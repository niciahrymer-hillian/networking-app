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

// Make every CREATE TABLE idempotent so re-deploys don't fail on existing tables.
const sql = raw.replace(/CREATE TABLE "/g, 'CREATE TABLE IF NOT EXISTS "');

const db = createClient({ url, authToken });

// Split on semicolons; skip statements that are purely whitespace/comments or PRAGMA.
const statements = sql
  .split(";")
  .map((s) => s.trim())
  .filter((s) => {
    if (!s) return false;
    // Remove comment lines to check if there's any real SQL left
    const withoutComments = s.replace(/^--.*$/gm, "").trim();
    if (!withoutComments) return false;
    if (withoutComments.toUpperCase().startsWith("PRAGMA")) return false;
    return true;
  });

console.log(`Applying ${statements.length} statements to Turso...`);
for (const stmt of statements) {
  await db.execute(stmt + ";");
}

console.log("Schema pushed to Turso successfully.");
