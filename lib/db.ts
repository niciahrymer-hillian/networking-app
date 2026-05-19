// Singleton Prisma client.
// WHY: Next.js hot-reload in dev would otherwise create a new DB connection on every file save,
//      exhausting connection limits. Storing on globalThis survives hot-reload.
// EFFECT: One PrismaClient instance is reused across all server-side requests.
// Uses @prisma/adapter-libsql so the same code works against a local SQLite file in dev
// (TURSO_DATABASE_URL=file:./prisma/dev.db) and Turso cloud in production.

import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  // PrismaLibSql accepts a Config object directly — no need to pre-create a Client
  const adapter = new PrismaLibSql({
    // Local dev: file:./prisma/dev.db — Production: libsql://<db>.turso.io
    url: process.env.TURSO_DATABASE_URL ?? "file:./prisma/dev.db",
    // authToken is only required for Turso cloud connections, not local files
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
