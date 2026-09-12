# The shared schema (spec 043, §314)

One Postgres schema, `public`, every client. Two kinds of table: the
platform's own (`tenants`, `users`, `tenant_users`, `sessions`,
`login_attempts`, `platform_access`, `tenant_log`, `push_keys`,
`memory_entries`, `_migrations`) with no tenant policy, and the 42
tenant-owned tables, every one carrying `tenant_id` under `FORCE ROW LEVEL
SECURITY` and the one policy `tenant_rows` — given to them by ONE loop over
the catalogue at the end of `schema.sql`, so a table added later is covered
on the next apply.

**The loop works by EXCLUSION, so a table added later is tenant-owned unless
it is named in that list.** `memory_entries` (spec 045) is Forefront's own
and deliberately crosses every client, which is why it is on the list — and
why its client column is `about_tenant_id` rather than `tenant_id`: with that
name, forgetting the list fails the apply outright at the loop's own
`CREATE INDEX … (tenant_id)`, instead of silently attaching a policy that
empties the feature on every fresh deployment while leaving this one working.

- **`schema.sql`** is the source. Prisma introspects it (`npm run db:pull`
  regenerates `prisma/schema.prisma`) and never migrates it.
- **`roles.sql`** makes `smp_app` — `LOGIN NOBYPASSRLS`, owns nothing, may
  create nothing — because Postgres bypasses row-level security for a table's
  OWNER. The app connects as `smp_app` at runtime (`lib/db.ts` `appPool()`);
  the owner key runs migrations only (`ownerPool()`).
- **`apply.mjs`** runs `roles.sql` + `schema.sql` (once) + `migrations/*.sql`
  (each once, by name, registered in `_migrations`) as the owner, in ONE
  transaction under a transaction-scoped advisory lock — at deploy, never on
  a request (research §P6). A file that fails rolls the whole run back and
  records nothing. `DATABASE_URL_UNPOOLED=… SMP_APP_PASSWORD=… node db/apply.mjs`.
- **The policy** compares `tenant_id` with
  `NULLIF(current_setting('app.tenant_id', true), '')::uuid`, and the column
  DEFAULTS to the same expression — so inside `withTenant()` a row lands under
  the request's tenant without any row builder naming it, and outside it
  every tenant table is empty (a setting that was once set reads back as `''`
  on a reused connection, which is why the `NULLIF` — §314.3).
- **Never `SET` outside a transaction** on these connections (§289):
  `lib/tenant.ts` is the one place the tenant is set, as a transaction-local
  setting.
