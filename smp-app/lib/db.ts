/* One Prisma client for the app.
   Prisma 7 connects through a driver adapter; `pg` is the same driver the old
   endpoints used, against the same Neon database. Cached on globalThis so a
   hot reload in development does not open a new pool on every edit. */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function connectionString(): string {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL;
  if (!url) throw new Error("No database connection configured (DATABASE_URL).");
  return url;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaPg({ connectionString: connectionString() }) });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
