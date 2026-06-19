// One-time migration: encrypt existing User.email at rest.
//
// For every account that still has a plaintext `email`, this writes:
//   emailEnc  = AES-256-GCM(email)      — unreadable without ENCRYPTION_KEY
//   emailHash = SHA-256(lower(trim()))  — deterministic lookup/dedup key
//   email     = NULL                    — plaintext removed
//
// It also adds the two columns + the emailHash unique index if missing, so it can
// run against a DB whose schema predates this change.
//
// Idempotent: only rows with a non-null `email` are processed, so re-running is a
// no-op. Backward-compatible: the auth routes match BOTH emailHash and any
// remaining plaintext email, so logins keep working before/during/after this.
//
//   node scripts/migrate-encrypt-emails.mjs            # LOCAL (file:./prisma/dev.db)
//   node scripts/migrate-encrypt-emails.mjs --prod     # PROD  (Turso, from .env.vercel)
//
// CRITICAL: each DB is encrypted with ITS OWN env's ENCRYPTION_KEY (the key prod
// uses to decrypt). --prod loads .env.vercel; local loads .env.local + .env.
import dotenv from "dotenv";
import { createClient } from "@libsql/client";
import { createCipheriv, createHash, randomBytes } from "crypto";

const PROD = process.argv.includes("--prod");
if (PROD) {
  dotenv.config({ path: ".env.vercel" });
} else {
  dotenv.config({ path: ".env.local" });
  dotenv.config();
}

const url = process.env.TURSO_DATABASE_URL ?? "file:./prisma/dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;
if (PROD && !authToken) {
  console.error("❌ --prod requires TURSO_AUTH_TOKEN (from .env.vercel).");
  process.exit(1);
}
const KEY = process.env.ENCRYPTION_KEY;
if (!KEY || KEY.length !== 64) {
  console.error("❌ ENCRYPTION_KEY (64 hex chars) is required to encrypt emails.");
  process.exit(1);
}
const keyBuf = Buffer.from(KEY, "hex");

const db = createClient({ url, authToken });
const target = PROD ? "PROD (Turso)" : `LOCAL (${url})`;

// Mirror lib/crypto.ts exactly so the app can decrypt what we write here.
const encrypt = (text) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyBuf, iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString("base64");
};
const hash = (text) => createHash("sha256").update(text.toLowerCase().trim()).digest("hex");

async function addColumnIfMissing(col) {
  const info = await db.execute("PRAGMA table_info(User)");
  if (info.rows.some((r) => r.name === col)) return false;
  await db.execute(`ALTER TABLE "User" ADD COLUMN "${col}" TEXT`);
  return true;
}

async function main() {
  console.log(`→ Target: ${target}`);

  // 1) Schema: ensure the columns + unique index exist.
  for (const col of ["emailEnc", "emailHash"]) {
    const added = await addColumnIfMissing(col);
    console.log(`   column ${col}: ${added ? "added" : "already present"}`);
  }
  await db.execute('CREATE UNIQUE INDEX IF NOT EXISTS "User_emailHash_key" ON "User"("emailHash")');

  // 2) Data: encrypt every still-plaintext email.
  const rows = (await db.execute("SELECT id, email FROM User WHERE email IS NOT NULL")).rows;
  console.log(`   rows to migrate: ${rows.length}`);

  let migrated = 0;
  for (const r of rows) {
    const email = String(r.email);
    await db.execute({
      sql: 'UPDATE "User" SET emailEnc = ?, emailHash = ?, email = NULL WHERE id = ?',
      args: [encrypt(email), hash(email), r.id],
    });
    migrated++;
  }

  // 3) Verify: no plaintext left, every account that had an email now has a hash.
  const leftover = (await db.execute("SELECT COUNT(*) c FROM User WHERE email IS NOT NULL")).rows[0].c;
  const withHash = (await db.execute("SELECT COUNT(*) c FROM User WHERE emailHash IS NOT NULL")).rows[0].c;
  console.log(`✅ migrated ${migrated} | plaintext emails left: ${leftover} | accounts with emailHash: ${withHash}`);
}

main()
  .catch((e) => { console.error("❌", e.message); process.exit(1); })
  .finally(() => db.close());
