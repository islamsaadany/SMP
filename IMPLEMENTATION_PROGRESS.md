# SMP — Implementation Progress

How things are going, in one place. Updated in the same commit as the work it
describes. This replaces sending the built HTML and the project zip after every
version (rules A2 / A11, changed 2026-08-20) — those go only when asked for.

**Where it runs:** Vercel, production tracks `main`. Static files plus two
serverless functions (`/api/state`, `/api/auth`) against Neon Postgres.
**Latest version:** v2.1 · **Last updated:** 2026-08-20
**Sign in as:** `SMO` / `1234` — no password change asked for (§19.4).
**Direction:** rebuilding on the HR_ERP stack (§20, decided 2026-08-20).

---

## Waiting on Islam

Nothing proceeds past this line without an answer.

| # | Decision needed | Why it is blocking | Recorded |
|---|---|---|---|
| **D4** | **Approve the rebuild plan** — order of work, what happens to the live product meanwhile, and whether the CSS is carried over verbatim (strongly recommended) rather than re-expressed in Tailwind. | The stack move is decided; **how** it is done is not, and nothing is built until it is (A1). | §20 |
| **D3** | Is the deployed demo content acceptable in the open? | Only Mobile's plan is real; everything else is invented and labelled. Anyone with the URL and the SMO password sees it. | §13 |

**Answered:**

- **D1 · Stack — ANSWERED 2026-08-20: move to the HR_ERP stack** (Next.js,
  React, TypeScript, Prisma, NextAuth). Reverses §19's Path A. The database,
  the identity model and every recorded decision carry across; the glue is
  discarded; the offline single-file prototype stops gaining features at v2.1.
  Recorded as §20.
- **D2 · Phase 2 as it stood** — superseded by the stack move. Its content
  (per-action writes, server-side rule enforcement, the change log) does not go
  away; it becomes part of the rebuild rather than a patch on the old stack.

---

## Built and verified

### v2.1 — identity *(current)*
Real sign-in on the deployed product. The gate is a login (person key +
password, scrypt-hashed, httpOnly session); `/api/state` requires a session; a
signed-in person sees their own view; the SMO issues temporary passwords from
Levels & access and every issued password must be changed on first use. The
viewer switcher survives only as the SMO's read-only simulation and in the
offline file. Sign-in for the SMO is `SMO` / `1234` with no forced change
(§19.4, 2026-08-20).

*Verified:* full flow in a real browser against a throwaway Postgres 16 —
bootstrap forced a change; the SMO issued Mennah Farouk a password; she was
forced to change it, saw only Group and Mobile, reported a figure that landed in
its exact row; her temporary password was refused afterwards; unauthenticated
access bounced to the gate. Offline QA walk clean for all 29 viewers.

### v2.0 — the state moved into the database
Schema (the §4 hierarchy + configuration + cycle as real tables), seed generated
mechanically from the platform sources, one endpoint reading and writing the
whole state, schema and seed applied on first contact with an empty database
under an advisory lock. Offline the file still runs on baked data.

*Verified:* round-trip deep-equal (seed → write → read → identical) and
`write(read())` a fixed point; seed-once / no-reseed; browser edits landing in
their exact rows; QA walk clean over HTTP and file://.

### v1.9 — the last prototype gaps closed
Capability card + Cards/Table toggle (§16.6) · capability project import and
export, idempotent for all eight capabilities (§16.4) · presentation mode for a
supporting function · the rail on a unit's My reporting (§15.12 fully cleared).

*Verified:* byte-identical rebuild, QA walk for all 29 viewers, plus a browser
suite per feature.

---

## In flight

Nothing being built. The stack move (§20) is decided and its plan is with
Islam for approval (D4). v2.1 is merged to `main` and deployed.

---

## Next — the rebuild on the HR_ERP stack

Proposed order, **awaiting approval (D4)**. Nothing below is started.

| Step | What it is | Why this order |
|---|---|---|
| **R1** | **Scaffold beside the live product.** Next.js + TypeScript + Prisma pointed at the **existing** Neon tables (`prisma db pull` — no new schema, no data moved), NextAuth over the existing credentials, SMP's CSS carried over verbatim. Nothing user-facing changes yet. | Proves the new stack reads the real data before a single screen is ported. |
| **R2** | **Sign-in and the shell.** The gate, the session, the navigation, the access matrix — the frame every page hangs in. | Everything else needs the frame and the person. |
| **R3** | **Read-only screens first:** Group Performance, unit Performance, Foundation, SWOT, Temple, Strategy/Plan, capability pages. Measured against the frozen v2.1 file screen by screen. | Reading is the bulk of the product and the highest drift risk — port it while there is a reference to compare against. |
| **R4** | **Editing and reporting, per action.** Each write its own server operation, validated against the cycle rules, carrying the **change log** (§16.0a) — the old Phase 2, now built the right way rather than patched on. | Enforcement stops being the browser's word. |
| **R5** | **The heavy machinery:** import/export (Excel + CSV), presentation mode, cycle close and snapshots. | Self-contained; safest to move last. |
| **R6** | **Cutover**, then multi-tenant (§1) and strategy versions (§16.10). | — |

**Longer-term backlog**, unchanged and unstarted: source teams (§16.7), the help
box (§16.8), the rest of people-and-credentials (§16.9 — Phase 1 took the login
half), images in review mode (§16.11). **Open model questions** still open:
§11 (year-end rollover, mid-year tactic removal, the ELABD single-company
shape, optional pillar-measure weighting).

---

## Known limits of what is deployed

Stated here rather than discovered later.

1. **Authorization is at the door, not per action.** A signed-in person is
   authenticated, but their browser is still trusted about *what* changed.
   Step R4 of the rebuild closes it.
2. **Last writer wins.** Saves replace the whole state transactionally; two
   people editing at once will not corrupt anything, but the second overwrites
   the first.
3. **The SMO password is `1234`** and is not forced to change (§19.4) — weak,
   deliberate, and to be replaced before anything client-confidential goes in.
   Passwords the SMO issues to other people are still temporary and still force
   a change. **No self-service recovery:** a forgotten password is reset by the
   SMO, which also ends that person's sessions.
4. **Usernames are person keys** (`own_mob`, `mobhead`), shown to the SMO beside
   the Set-password control. Real emails are §16.9 work.
5. **The demo content is invented** except Mobile's plan, and labelled as such
   in the product.

---

## Where the pieces live

| Path | What |
|---|---|
| `index.html` | The gate — real login when served with a database, legacy AdminSMO latch offline |
| `SMP-Project-Folder/src/` | The platform's sources; `build.py` assembles the single file, `qa.py` walks every page as every viewer |
| `SMP-Project-Folder/strategy-management-platform-v2.1.html` | The built platform (must rebuild byte-identical from `src/`) |
| `SMP-Project-Folder/DECISIONS-AND-LOGIC-v2.1.md` | Every decision with its reasoning — the contract |
| `db/` | `schema.sql`, `migrations/`, `seed-state.json` (generated) |
| `lib/`, `api/` | State reader/writer and auth; the two endpoints |
| `scripts/` | `extract-state.js` (regenerate the seed), `test-roundtrip.js`, `dev-server.js` |
| `specs/` | Per-feature specifications (spec-kit) |

**The verification loop before any handover:** rebuild byte-identical → `qa.py`
walk → `DATABASE_URL=… node scripts/test-roundtrip.js` (must print PASS twice) →
`node scripts/dev-server.js` and drive it in a browser.
