# Spec 065 — Processes: FFProcess carried into SMP

**Status:** built on `claude/zealous-archimedes-ktucft`, not merged. 2026-10-01.

## Islam's decisions
- *"we need to bring this Process module with all it's data and design even to the SMP"* — FFProcess (github.com/ahmedgalal-lang/FFProcess) becomes SMP's **Processes** module.
- *"A, keep its design, smp client register, office only, RHI"*:
  - **A** — ported into SMP's own app, not linked out to the old site.
  - **Keep its design** — FFProcess's own pages and look, under SMP's top bar.
  - **SMP client register** — the people in Processes come from the client's People register.
  - **Office only** — the Super user and the SMO team; a client's own people are refused.
  - **RHI** — the old FFProcess data belongs to the RHI client.

## Shape
- Pages live in Next's own route tree, `app/(ffp)/[slug]/processes/…`; `MODULE_DEF.processes.appRoute` says so, so the module table has no server for it.
- One FFProcess workspace per SMP client, its id the client's key; its tables in their own Postgres schema `ffprocess`, applied at deploy by `db/apply-ffp.mjs`.
- The SMP seat decides: `super`/`smoteam` act as the workspace's ADMIN; `lib/access.ts` OFFICE_ONLY refuses anybody else at the door.
- **The register is the store** (`ffp/lib/register-sync.ts`): every active person on the client's register appears in the Org Directory, name and email following the register; somebody retired or removed is hidden, never deleted; an old FFProcess person with no key is adopted once by matching email (case-insensitive). The office's own rows do not appear. Roles in the process maps and reporting lines stay Processes' own.
- A linked person's name and email cannot be changed and they cannot be deleted in Processes — the page says to change them on the register, and the server refuses it too.
- The sync runs once per request (React `cache()`), awaited by the layout and every page, because Next renders them at the same time.

## Bringing the old data across
`scripts/carry-ffprocess.mjs`, also behind a deploy switch:
- `FFPROCESS_DATABASE_URL` (the old database, set in Vercel — never pasted in a chat), `SMP_CARRY_FFPROCESS` = the old workspace's id or exact name, optional `SMP_CARRY_FFPROCESS_TO` (default `rhi`) and `FFPROCESS_SOURCE_SCHEMA` (default `public`).
- Production only; copies everything the old workspace reaches (ids kept, one transaction), maps old users to existing accounts by email, refuses a workspace that already holds data — so a switch left on logs "turn it off" and does nothing.
- Run by hand with no `--from` to list the old workspaces; without `--apply` it is a dry run that prints counts.

## Open
- Adding a person directly in Processes (not on the register) is still allowed; whether it should be is Islam's.
