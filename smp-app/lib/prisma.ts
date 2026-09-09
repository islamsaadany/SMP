/* Prisma with a wrapper (research §P2, spec 043 §4.3).

   Prisma has no per-request SET LOCAL of its own, so every operation on a
   tenant model — and every raw query — goes through a client extension that
   runs it as the second statement of a BATCH transaction whose first is
   `set_config('app.tenant_id', $1, true)`: one transaction, one backend
   (§289), the setting dying with the COMMIT. That is Prisma's own documented
   shape for row-level security; `query(args)` inside a `$transaction([...])`
   batch binds to that transaction, which an interactive one does not give
   an extension. A query that escapes the wrapper runs with no setting and
   sees an EMPTY world (the policy compares against null) — the safe failure,
   and S6 asserts it rather than assuming it.

     tenantClient(tenantId).units.findMany()      → A's units
     platformPrisma.client.tenants.findMany()     → the registry (no RLS)

   WHAT THIS DOES NOT GIVE: several operations in ONE transaction. Each
   operation is its own transaction; a batch `$transaction([...])` on the
   extended client would nest one inside another. Multi-statement tenant work
   — the save, with its lock (contracts/tenant-request.md §3) — goes through
   `withTenant()` on the pg pool, where BEGIN…COMMIT is explicit. Said here so
   nobody reaches for `tenantClient(...).$transaction` and gets a nesting
   error dressed as a bug. The schema is SQL; Prisma introspects it. */
import prismaPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { appPool } from "./db.ts";

const { PrismaClient } = prismaPkg;
type Client = InstanceType<typeof PrismaClient>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const g = globalThis as unknown as { __smpPrisma?: Client };
function base(): Client {
  return (g.__smpPrisma ??= new PrismaClient({ adapter: new PrismaPg(appPool()) }));
}
export function resetPrisma(): void { g.__smpPrisma = undefined; }

/* The platform's own tables — no tenant, no policy. Never for tenant rows:
   through this client a tenant table is empty. */
export const platformPrisma = { get client(): Client { return base(); } };

export function tenantClient(tenantId: string) {
  if (!UUID.test(String(tenantId))) throw new Error("tenantClient: not a tenant id");
  const p = base();
  /* Every kind of operation Prisma can issue, through one wrapper. The
     set_config is a raw statement in the SAME batch, so it runs first on the
     transaction's backend and the operation second. */
  const inTenant = async ({ args, query }: { args: unknown; query: (a: any) => Promise<unknown> }) => {
    const [, result] = await p.$transaction([
      p.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`,
      query(args) as any,
    ]);
    return result;
  };
  return p.$extends({
    query: {
      $allModels: { $allOperations: inTenant },
      $queryRaw: inTenant,
      $executeRaw: inTenant,
      $queryRawUnsafe: inTenant,
      $executeRawUnsafe: inTenant,
    },
  });
}
