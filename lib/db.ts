// Singleton Prisma client.
// WHY: Next.js hot-reload in dev would otherwise create a new DB connection on every file save,
//      exhausting connection limits. Storing on globalThis survives hot-reload.
// EFFECT: One PrismaClient instance is reused across all server-side requests.
// Prisma 7 requires a driver adapter for SQLite — we use @prisma/adapter-better-sqlite3.

import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { join } from "path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createClient() {
  // DB_PATH env var allows overriding the database location in production (e.g. Railway volume)
  const dbPath = process.env.DB_PATH ?? join(process.cwd(), "prisma", "dev.db");
  const adapter = new PrismaBetterSqlite3({ url: dbPath });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
