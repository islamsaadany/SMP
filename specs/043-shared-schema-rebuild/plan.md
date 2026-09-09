# Implementation Plan: One schema, every client — the spike

**Branch**: `claude/smp-tenancy-stack-decision-l5aoo5` (feature `043-shared-schema-rebuild`)
**Date**: 2026-09-09 | **Spec**: [spec.md](./spec.md) — signed off 2026-09-09 (§314, §314.1)
**Mockup**: none — this slice draws no screen (spec §5: *"the first slice is a spike, not a page"*). The first ported screen gets its own mockup before it is built (constitution I).

## Summary

The first slice of the rebuild is **eight proofs on a real Postgres and no
screen**. It builds the shared schema (`tenants`, `users`, `tenant_users`, and
every tenant-owned table carrying `tenant_id` under `FORCE ROW LEVEL
SECURITY`), the non-owner app role, the per-request tenant transaction, the
deletion routine, the door's landing rule, and the one-off script that carries
Raya Trade's schema across — and proves each by breaking it first (constitution
XVI). When S1–S8 are green the data layer is settled and the screens follow,
page group by page group (D4), each behind a mockup. Nothing in this slice is
served to anybody; `main` is untouched until Islam says merge, on that merge.

## Technical Context

**Language/Version**: TypeScript 7 on Node 22 (`smp-app/` skeleton, §20/D1);
the spike scripts are plain `.mjs` run by `node`, the same shape as
`scripts/test-*.js` today (constitution VI).
**Primary Dependencies**: `pg` 8, Prisma 7 with `@prisma/adapter-pg` (kept for
the platform tables; the tenant layer's driver is decided by S6, research.md
§P2), Next 16 / React 19 (present in the skeleton, unused by this slice).
**No auth library** — the door is `lib/auth.js`'s own rules ported (research
§P1); `next-auth` leaves `package.json`.
**Storage**: Neon Postgres, one database, **one schema `public`** for tenant
data and the platform tables alike. Two roles: the owner (migrations only) and
`smp_app` (runtime, `LOGIN NOBYPASSRLS`, non-owner).
**Testing**: the eight spike scripts against a throwaway Postgres 16 here
(`/usr/lib/postgresql/16`, present) and, for S1 alone, the real Neon key from
Islam's shell — never pasted in chat. Each script exits non-zero on its first
failure and prints the property it measured, and each is run once **against a
deliberately broken build** before its green run is believed.
**Target Platform**: Vercel (Node 22 serverless) against Neon through the
**direct** connection string for tenant work (`DATABASE_URL_UNPOOLED`, the
order §313.34 already fixed).
**Project Type**: web application — `smp-app/` (Next.js) replaces
`SMP-Project-Folder/` + `api/` as the live product, screen by screen; this
slice is the database half only.
**Performance Goals**: a request touching tenant data costs **one transaction**
(BEGIN · SET LOCAL · work · COMMIT); no `ensureReady` per request (§98's 14 → 5
must not come back — migrations run at deploy, not on the poll path).
**Constraints**: the Neon key may lack `CREATEROLE` (S1 decides; §313.35 found
it depends on the key); the transaction pooler keeps nothing between
statements (§289); no `WHERE tenant_id` is ever the guarantee (spec §4.3).
**Scale/Scope**: 4 tenants at cutover, tens approaching a hundred in three
years; **42 tenant-owned tables** (data-model.md — the spec said 44 and is
corrected in this commit: `push_keys` is one VAPID pair per deployment and
joins the platform side with `credentials`, `sessions`, `login_attempts`); Raya
Trade's 33-person register and its closed cycles carried across.

## Constitution Check

*GATE: passed before Phase 0; re-checked after Phase 1 — no change.*

| Principle | How this plan satisfies it |
|---|---|
| **I · Align before building** | Every decision in the spec was put to Islam and answered (§2); four plan-stage choices the spec deferred are decided in research.md §P1–P4 with the reasoning, and go back to him in the report before `tasks.md`. No screen, so no mockup yet; the first ported screen gets one. |
| **II · The decisions document is the contract** | §314 and §314.1 already carry the decisions; the plan-stage choices are appended as §314.2 in the same commit as the first spike code, not before. The 44 → 42 correction is recorded in the spec, not silently. |
| **III · Edit the sources, never the built file** | The frozen single file is not touched. The shared schema is written as `smp-app/db/schema.sql` + numbered migrations, applied by a script — never by hand, never through Prisma's own migrate (research §P2). |
| **IV · Verify by walking** | This slice has no page to walk. Every proof is a script that measures and prints; `qa.py` stays green on the frozen build throughout, because nothing in it changes. |
| **V · Derived, never stored** | Untouched — no scoring surface. The graph readers are ported later, with the same arithmetic. |
| **VI · Follow what the platform already does** | The door is `lib/auth.js` ported (scrypt, httpOnly cookie, 30-day session, §43's rate limits); the spike scripts are `scripts/test-*.js`'s shape; the pooler is modelled the way `test-cold-starts.js` models it; the save keeps §210's change-list contract. |
| **VIII · Islam decides content** | No content in this slice. `tenants.region` holds one value he has not yet named (spec §4.5). |
| **IX · One copy of a rule** | `lib/rules.js` is ported as one TypeScript module both sides import; row addressing gains `tenantId`. The spike touches only its tenant-addressing seam. |
| **X · The server decides** | The tenant is resolved from the session's memberships on the server (contracts/tenant-request.md); the slug never reaches SQL; the database refuses cross-tenant rows whatever the app asks (S2). |
| **XI · A record a save can erase is not a record** | The save's clear becomes `DELETE … WHERE tenant_id = $1` on the 33 graph tables **only** (data-model.md); `change_log`, chat, messages, drafts, push, asks and declarations are outside the clear, as today. |
| **XII · A reader never creates** | The spike's readers return frozen empties; `readState()`'s port keeps that contract. |
| **XIII / XIV / XV** | No screen in this slice; re-checked when the first one is drawn. |
| **XVI · Prove a check by breaking it** | Each of S1–S8 has a named break in contracts/spike.md (`--break=<name>`) that must turn it red before the green run counts; the schema check S5 is run against a table added without `tenant_id` on purpose. |

**No violations to justify.** One cost accepted and recorded rather than
argued away: **the rewrite of every bare-id reader** (§314's stated price) —
this slice ports only `readState`/`writeState`'s addressing and the rules
module's row lookup; the rest follows screen by screen.

## Project Structure

### Documentation (this feature)

```text
specs/043-shared-schema-rebuild/
├── spec.md              # signed off 2026-09-09 (§314.1); table count corrected here
├── plan.md              # this file
├── research.md          # the four code questions (2026-09-09) + §P1–P7 plan-stage decisions
├── data-model.md        # the shared schema: platform tables, the 42 tenant-owned tables, keys
├── contracts/
│   ├── tenant-request.md   # how a request learns its tenant; the door; the save
│   └── spike.md            # the eight proofs: script, arguments, what it prints, its break
├── quickstart.md        # running the spike locally, and S1 against Neon
└── tasks.md             # /speckit-tasks — not created here
```

### Source code (repository root)

`smp-app/` is **replaced** (spec §2 row 7). What this slice creates:

```text
smp-app/
├── package.json             # next, react, pg, prisma (+adapter); next-auth REMOVED
├── db/
│   ├── schema.sql           # the shared schema: platform tables + 42 tenant tables, RLS, FORCE
│   ├── migrations/          # numbered, registered in _migrations, applied by db/apply.mjs
│   ├── apply.mjs            # runs schema + migrations AS THE OWNER, once, at deploy — never per request
│   └── roles.sql            # CREATE ROLE smp_app LOGIN NOBYPASSRLS … ; grants (idempotent)
├── lib/
│   ├── db.ts                # two pools: owner (migrations, S1) and smp_app (runtime); direct URL first (§313.34)
│   ├── tenant.ts            # withTenant(tenantId, fn): BEGIN · SET LOCAL app.tenant_id · fn · COMMIT
│   ├── prisma.ts            # Prisma client + the extension that routes every op through withTenant (S6)
│   ├── auth.ts              # lib/auth.js ported: scrypt, sessions on user_id, rate limits, must_change
│   ├── door.ts              # resolve slug → tenant row → may this user open it (contracts/tenant-request.md)
│   ├── rules.ts             # lib/rules.js ported; row lookup takes {tenantId, key}
│   └── state-io.ts          # readState/writeState against the shared schema; the clear is per tenant
├── spike/
│   ├── s1-neon-role.mjs … s8-raya-migration.mjs   # one script per proof (contracts/spike.md)
│   ├── _harness.mjs         # throwaway DB, two tenants seeded, --break=<name> switch, pooler model
│   └── README.md            # one paragraph: run order, what green means
└── scripts/
    ├── sync-css.mjs         # kept (D4)
    ├── migrate-raya.mjs     # §4.7: raya_trade schema → shared schema under Raya's tenant_id (deleted after cutover)
    └── seed-demo.mjs        # seed-demo-client.js carried over, writing under the demo tenant
```

Untouched by this slice: `SMP-Project-Folder/`, `api/`, `lib/`, `db/`,
`sw.js`, `vercel.json` — the frozen build keeps serving every client until the
first screen group cuts over (D4).

**Structure Decision**: one Next.js app with a `db/` folder of plain SQL and a
`spike/` folder of plain scripts. Plain SQL because the frozen product's
`db/schema.sql` + `db/migrations/*` is the shape every reader here already
knows, and because RLS policies, `FORCE`, roles and grants are written in SQL
whichever ORM runs the queries. Prisma introspects the result; it does not own
it (research §P2).

## Delivery order

One slice, eight proofs, in the order each depends on the one before. Nothing
is a screen.

1. **S1 · the role and `FORCE`** — `db/roles.sql` and one tenant table with the
   policy; proved here on Postgres 16, then **by Islam against Neon** (quickstart
   §4). Everything below assumes S1's answer; if the key cannot make a role, the
   fallback is named in research §P5 and the plan stops for a decision.
2. **S3 · the pooler** — `lib/tenant.ts`; a bare `SET` leaks under the modelled
   pooler, `SET LOCAL` in the transaction on the direct URL does not.
3. **S5 · the schema check** — the catalogue query that every later table must
   pass; written before the 42 tables so it can fail on each one added wrong.
4. **The shared schema** — `db/schema.sql`: platform tables, then the 42 tenant
   tables with composite keys (data-model.md), each with the policy and `FORCE`.
   S5 green.
5. **S2 · isolation** — two tenants seeded; every tenant table read, inserted
   and deleted with no WHERE as `smp_app`.
6. **S6 · the wrapper** — `lib/prisma.ts`; an operation inside the extension sees
   the setting, one that escapes sees nothing. If it cannot be made to hold, the
   tenant layer drops to `pg` (research §P2) and this step is re-run on that.
7. **S4 · deletion** — export, delete, count from the catalogue; a neighbour's
   counts unchanged.
8. **S7 · the door** — `lib/auth.ts` + `lib/door.ts`; a client user at another
   slug lands on their own; an outsider and a nonexistent slug are refused with
   one sentence.
9. **S8 · Raya** — `scripts/migrate-raya.mjs` against a copy of `raya_trade`;
   counts, a plan byte-identical through `state-io.ts`, a save round-tripping, a
   migrated sign-in still working.

After 9: `tasks.md` for the first screen group, which begins with its mockup.

## Complexity Tracking

No constitution violations. Two things that could read as complexity are
named so they are not mistaken for it:

| Item | Why it is here | Simpler alternative rejected because |
|---|---|---|
| Two database roles and two pools | RLS is bypassed for a table's owner; without a non-owner runtime role the shared schema is weaker than the schemas it replaces (spec §4.3, §314) | one role means `FORCE` protects nothing — proved by S1's break |
| A Prisma extension over `withTenant` rather than Prisma alone | Prisma has no per-request `SET LOCAL`; an unwrapped query sees an empty world only because the policy compares against a missing setting | dropping Prisma outright is the fallback S6 decides, not the default (research §P2) |
