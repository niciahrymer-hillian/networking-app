#!/usr/bin/env node
// scripts/turso-push.mjs
// Pushes the Prisma schema to the database.
//
// WHY: `prisma db push` only understands native SQLite file: URLs. Turso uses
//      libsql:// which the Prisma CLI rejects with P1013. This script bridges
//      the gap by generating schema SQL via `prisma migrate diff` (no DB
//      connection needed) and applying it directly through the @libsql/client.
//
// EFFECT: Idempotent — uses CREATE TABLE IF NOT EXISTS so it's safe to run on
//         every Vercel deploy regardless of whether tables already exist.
//
// Usage:
//   Local file (dev):       TURSO_DATABASE_URL=file:./prisma/dev.db  node scripts/turso-push.mjs
//   Turso cloud (prod):     TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... node scripts/turso-push.mjs

import { execSync } from "child_process";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL ?? "file:./prisma/dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

// Local file DB — the native Prisma CLI works fine here, no adapter needed.
if (url.startsWith("file:")) {
  console.log("Local SQLite — running prisma db push...");
  execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
  process.exit(0);
}

// Turso cloud — generate full schema SQL (no DB connection required for --from-empty)
// then apply it via the libSQL HTTP client.
console.log("Turso cloud — generating schema SQL...");
// Force a file: URL so Prisma can resolve the SQLite dialect for SQL generation.
// The generated SQL is fully compatible with Turso/libSQL — we just can't let
// Prisma see a libsql:// URL or it produces empty output.
const raw = execSync(
  "npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script",
  { encoding: "utf8", env: { ...process.env, TURSO_DATABASE_URL: "file:./prisma/dev.db" } }
);

// Make CREATE TABLE / CREATE INDEX idempotent so re-deploys don't fail on
// objects that already exist.
const sql = raw
  .replace(/CREATE TABLE "/g, 'CREATE TABLE IF NOT EXISTS "')
  .replace(/CREATE UNIQUE INDEX "/g, 'CREATE UNIQUE INDEX IF NOT EXISTS "')
  .replace(/CREATE INDEX "/g, 'CREATE INDEX IF NOT EXISTS "');

const db = createClient({ url, authToken });

async function execSafe(stmt) {
  try {
    await db.execute(stmt);
  } catch (e) {
    // Ignore 'already exists' (idempotent re-runs)
    if (e.message?.includes("already exists") || e.cause?.message?.includes("already exists")) {
      console.warn("Skipping:", e.message);
      return;
    }
    throw e;
  }
}

// Parse the desired columns for each table out of the generated CREATE TABLE
// blocks. WHY: `migrate diff --from-empty` only ever emits CREATE TABLE (full
// schema), never ALTER. So on a DB whose tables already exist with an OLDER
// schema, newly-added columns would never be applied — and a later CREATE INDEX
// on a missing column aborts the whole deploy. We bridge that gap below by
// diffing columns and issuing ALTER TABLE ADD COLUMN for anything missing.
function parseDesiredColumns(schemaSql) {
  const tables = {};
  const tableRe = /CREATE TABLE (?:IF NOT EXISTS )?"([^"]+)" \(([\s\S]*?)\n\);/g;
  let m;
  while ((m = tableRe.exec(schemaSql))) {
    const [, table, body] = m;
    const cols = [];
    for (const rawLine of body.split("\n")) {
      const line = rawLine.trim().replace(/,$/, "");
      if (!line.startsWith('"')) continue;          // skip CONSTRAINT / FOREIGN KEY lines
      if (/PRIMARY KEY/i.test(line)) continue;      // PK columns exist at creation; can't ALTER-add
      const name = line.match(/^"([^"]+)"/)?.[1];
      if (name) cols.push({ name, def: line });
    }
    tables[table] = cols;
  }
  return tables;
}

// Split on semicolons; skip statements that are purely whitespace/comments or PRAGMA.
const statements = sql
  .split(";")
  .map((s) => s.trim())
  .filter((s) => {
    if (!s) return false;
    const withoutComments = s.replace(/^--.*$/gm, "").trim();
    if (!withoutComments) return false;
    if (withoutComments.toUpperCase().startsWith("PRAGMA")) return false;
    return true;
  });

// Classify by the actual SQL, ignoring the leading "-- CreateTable" comments
// that `migrate diff` emits before each statement.
const codeOf = (s) => s.replace(/^--.*$/gm, "").trim();
const createTableStmts = statements.filter((s) => /^CREATE TABLE/i.test(codeOf(s)));
const indexStmts = statements.filter((s) => !/^CREATE TABLE/i.test(codeOf(s)));

// 1. Create any tables that don't exist yet.
console.log(`Ensuring ${createTableStmts.length} tables exist...`);
for (const stmt of createTableStmts) await execSafe(stmt + ";");

// 2. Add any columns missing from already-existing tables (additive only).
const desired = parseDesiredColumns(sql);
for (const [table, cols] of Object.entries(desired)) {
  let existing;
  try {
    const info = await db.execute(`PRAGMA table_info("${table}")`);
    existing = new Set(info.rows.map((r) => r.name));
  } catch {
    continue; // table not introspectable; CREATE TABLE step already handled it
  }
  if (existing.size === 0) continue;
  for (const col of cols) {
    if (existing.has(col.name)) continue;
    try {
      await db.execute(`ALTER TABLE "${table}" ADD COLUMN ${col.def}`);
      console.log(`Added missing column: ${table}.${col.name}`);
    } catch (e) {
      // A NOT NULL column without a default can't be added to a populated table.
      // Surface it loudly rather than silently aborting the whole deploy.
      console.warn(`Could not add ${table}.${col.name}: ${e.message}`);
    }
  }
}

// 3. Create indexes (now safe — referenced columns exist).
console.log(`Ensuring ${indexStmts.length} indexes...`);
for (const stmt of indexStmts) await execSafe(stmt + ";");

console.log("Schema pushed to Turso successfully.");
