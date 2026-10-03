/* Processes (FFProcess) keeps its own Prisma schema: its 32 tables live in
   their own Postgres schema, `ffprocess`, beside SMP's shared one. Only
   `prisma generate` reads this file; the tables are made by
   scripts/deploy.mjs from ffp/prisma/migrations, and the running app connects
   through ffp/lib/db/client.ts as smp_app. */
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
});
