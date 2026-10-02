/* FFPROCESS'S DATABASE IS A ROOM OF ITS OWN IN SMP'S DATABASE.
   The Processes module (FFProcess, brought in whole) keeps its own 32 tables
   under the Postgres schema `ffprocess`, so none of its names (`users`,
   `people`, `roles`, `sessions`…) can meet SMP's shared schema. It runs as the
   same non-owner role every SMP request runs as (lib/db.ts appUrl), with the
   schema named to the adapter — Prisma qualifies every table with it, and the
   connection's own search_path never decides where a query lands.
   ISOLATION IS FFPROCESS'S OWN: every page and action asks
   requireWorkspaceAccess(), whose workspace is the SMP client's slug. */
import "server-only";
import { PrismaClient } from "@/ffp/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { appUrl } from "@/lib/db.ts";

export const FFP_SCHEMA = "ffprocess";

const globalForPrisma = globalThis as unknown as { ffpPrisma: PrismaClient | undefined };

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: appUrl() }, { schema: FFP_SCHEMA });
  return new PrismaClient({ adapter });
}

/* Lazily, so a build that imports this file never needs a database. */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_t, p) {
    const c = (globalForPrisma.ffpPrisma ??= createPrismaClient());
    const v = (c as unknown as Record<string | symbol, unknown>)[p];
    return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(c) : v;
  },
});
