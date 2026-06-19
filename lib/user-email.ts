// Account-email helpers. Email is stored encrypted (emailEnc) with a deterministic
// SHA-256 lookup key (emailHash). These helpers keep that detail in one place so the
// auth routes don't each reimplement encrypt/hash/decrypt + backward-compat lookup.
//
// Backward compatibility: rows created before the migration still have a plaintext
// `email` column and a null emailHash. Every lookup therefore matches BOTH emailHash
// (migrated rows) and the plaintext email (legacy rows), so no one is locked out
// mid-migration.
import { encrypt, decrypt, hash } from "@/lib/crypto";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// What to write for a new/updated account email: encrypted blob + lookup hash,
// and null the legacy plaintext column so nothing is stored in the clear.
export function emailWriteFields(email: string) {
  const normalized = normalizeEmail(email);
  return { email: null, emailEnc: encrypt(normalized), emailHash: hash(normalized) };
}

// Prisma `where` OR-clauses that match an email across migrated + legacy rows.
export function emailMatchClauses(email: string) {
  const normalized = normalizeEmail(email);
  return [{ emailHash: hash(normalized) }, { email: normalized }];
}

// Recover the plaintext address for sending mail / display (own-account flows only).
export function readEmail(user: { emailEnc?: string | null; email?: string | null }): string | null {
  if (user.emailEnc) {
    try {
      return decrypt(user.emailEnc);
    } catch {
      return null; // wrong key / tampered — fail closed rather than throw
    }
  }
  return user.email ?? null;
}
