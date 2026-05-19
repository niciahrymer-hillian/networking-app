// Prisma CLI config (used by prisma db push, prisma migrate, prisma studio, etc.)
// WHY: The CLI datasource only accepts a `url` — it has no `adapter` field.
//      For local dev (file:) this is enough. For Turso cloud (libsql://) the CLI
//      cannot connect natively, so use `npm run db:push` which runs scripts/turso-push.mjs.
// EFFECT: `npx prisma db push` works against the local file in dev.
//         Vercel + Turso cloud deploys go through the turso-push script in vercel.json.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["TURSO_DATABASE_URL"] ?? "file:./prisma/dev.db",
  },
});
