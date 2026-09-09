# Contract · The nine proofs

Each proof is one script under `smp-app/spike/`, run by `node`, against a
fresh throwaway database `_harness.mjs` creates and drops. Each prints one
line per property (`ok` / `FAIL` + what it measured) and exits non-zero on
the first failure. Each accepts `--break=<name>`, which builds the thing
under test **wrongly** in the way named, and the red run with that switch is
recorded before the green run is believed (constitution XVI). The harness
seeds two tenants, A and B, with at least one row in every tenant table.

| # | script | asserts | `--break=` turns it red by |
|---|---|---|---|
| S1 | `s1-neon-role.mjs` | `CREATE ROLE smp_app LOGIN NOBYPASSRLS` succeeds; `smp_app` owns no table; with `FORCE` on and `app.tenant_id` unset, `smp_app` reads **0** rows and the owner reads all. Prints the key's `rolcreaterole` and `rolsuper` first. | `no-force` (policy on, `FORCE` off, connect as owner → sees every row) · `bypass` (role made with `BYPASSRLS`) |
| S2 | `s2-isolation.mjs` | as `smp_app` with A set: `SELECT` with no WHERE on **every** tenant table returns only A's rows; `INSERT` carrying B's `tenant_id` is refused (`42501`); `DELETE` with no WHERE removes A's rows and B's counts are unchanged. Walks the table list **from the catalogue**, never a literal. | `no-policy:<table>` (one table's policy dropped) · `owner` (runs as the owner) |
| S3 | `s3-pooler.mjs` | under the pooler model (`test-cold-starts.js`'s: session state lost after every autocommit statement) a bare `SET app.tenant_id` followed by a `SELECT` reads **nothing**, and `SET LOCAL` inside `BEGIN…COMMIT` reads A's rows; and the same on the real direct URL. | `bare-set` (`withTenant` uses `SET` outside a transaction) |
| S4 | `s4-delete.mjs` | after `DELETE FROM tenants WHERE id = A`, every table the catalogue says carries `tenant_id` holds **0** rows for A, and B's per-table counts equal their values before. | `no-cascade:<table>` (one FK without `ON DELETE CASCADE`) |
| S5 | `s5-schema-check.mjs` | data-model.md's four rules over `pg_class` / `pg_policy` / `pg_constraint`; names every offending table. | `add-table` (creates `stray` with tenant-shaped data and no `tenant_id`) · `no-force:<table>` |
| S6 | `s6-prisma-wrapper.mjs` | through the extended Prisma client, `SELECT current_setting('app.tenant_id', true)` from inside a model query returns A; a query through the **unextended** client returns null and `findMany` on a tenant model returns `[]`; every Prisma operation kind (`findMany`, `create`, `update`, `delete`, `$queryRaw`, `$transaction`) is exercised. | `escape` (one operation routed round the extension) |
| S7 | `s7-door.mjs` | a `client` user at B's slug is sent to A's; an office user with no `tenant_users` row on B gets the refusal; a slug that does not exist gets **the same** status and sentence; `must_change` blocks `/api/<slug>/state` both ways (§43.2). | `follow-slug` (landing takes the slug) · `two-refusals` (nonexistent answers 404, refused answers 403) |
| S8 | `s8-raya-migration.mjs` | against a copy of `raya_trade` made by `scripts/migrate-to-multi-client.js` on a seeded v2.0-shaped database: after `scripts/migrate-raya.mjs`, every tenant-owned table's row count under Raya's `tenant_id` equals the schema's; one unit's plan read through `state-io.ts` is byte-identical to the frozen `readState()`'s (canonical JSON, §249.3); a change-list save round-trips; a sign-in that worked before still works, `must_change` intact. | `short:<table>` (one table skipped) · `wrong-tenant` (one table written under B) |
| S9 | `s9-row-write.mjs` | on tenant A seeded with the worked example: a change list naming one measure's target is posted through the save; that row's value is the new one; **every other row in every tenant-owned table carries the `xmin` it had before the save** (read before and after as `smp_app` under A); a change list adding a row, removing a row and reordering a list each write only the rows they name; a shape the writer cannot address answers 400 naming it, and nothing is written; tenant B's rows are untouched throughout. | `full-write` (the save cleared and re-inserted the graph — the reported fault) · `silent-fallback` (an unaddressable shape rewritten whole instead of refused) |

Order of first runs: S1, S3, S5, then the schema, then S2, S6, S4, S7, S8, S9 —
plan.md's delivery order. S1 is also run by Islam against the real Neon key
(quickstart §4); its printed lines are the record, and the URL is never
printed or pasted.
