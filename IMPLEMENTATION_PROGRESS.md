# SMP — Implementation Progress

How things are going, in one place. Updated in the same commit as the work it
describes. This replaces sending the built HTML and the project zip after every
version (rules A2 / A11, changed 2026-08-20) — those go only when asked for.

**Where it runs:** Vercel, production tracks `main`. Static files plus two
serverless functions (`/api/state`, `/api/auth`) against Neon Postgres.
**Latest version:** v2.5 · **Last updated:** 2026-08-20
**Sign in as:** `SMO` / `1234` — no password change asked for (§19.4).
**Direction:** rebuilding on the HR_ERP stack (§20, decided 2026-08-20).

---

## Waiting on Islam

Nothing proceeds past this line without an answer.

| # | Decision needed | Why it is blocking | Recorded |
|---|---|---|---|
| **D7** | **Are Distribution and B2C your real companies**, with Mobile / Consumer Electronics / IT and Retail Stores / Online Shop / Care under them? | They came from your own build and are now in the client tenant. Everything else invented was cleared in §21, so this is the one thing standing on your word. Change it in Setup → Business units, or say and I will. | §23 |
| **D5** | **Go-ahead for R2** — sign-in and the shell on the new stack. | R1 proved the stack; R2 is the first thing anyone would see change. Nothing starts without the word (A1). | §20 |

**Answered:**

- **D6 · The weighting values — ANSWERED 2026-08-20: cleared too.** The factor
  model stays (the four factors, their types and their 40/30/20/10 weights); the
  per-unit figures, the written reasons and the prior cycle are gone. With
  nothing entered, every unit counts equally (§21.5).
- **D4 · The rebuild plan — ANSWERED 2026-08-20:** CSS carried **verbatim**
  (Tailwind only for genuinely new things); cutover **early, page group by page
  group**, the new app becoming the live site while un-ported screens link back
  to the frozen build.
- **D3 · The demo content in the open — ANSWERED by v2.2.** It is no longer in
  the tenant at all. It lives in the demo dataset, behind a button, labelled
  while it is on screen, and it cannot be written to the database (§21).
- **D1 · Stack — ANSWERED 2026-08-20: move to the HR_ERP stack** (Next.js,
  React, TypeScript, Prisma, NextAuth). Reverses §19's Path A. The database,
  the identity model and every recorded decision carry across; the glue is
  discarded; the offline single-file prototype stops gaining features at v2.1
  (it still takes corrections and the client's own instructions — §20, clarified).
  Recorded as §20.
- **D2 · Phase 2 as it stood** — superseded by the stack move. Its content
  (per-action writes, server-side rule enforcement, the change log) does not go
  away; it becomes part of the rebuild rather than a patch on the old stack.

---

## Built and verified

### v2.5 — the company level, and two bugs a real plan exposed *(current)*
**Companies**, ported from the build you did outside the repo (§23). A layer
between the group and the business unit — Distribution and B2C today, with four
units standing alone. It is **visibility, not strategy**: a company carries no
score and no page. A company CEO sees their own units, and two flags **per
company** decide whether they also see the other companies (default no) and the
group (default yes). Supporting functions belong to no company.

Set up on **Setup → Business units**, which now leads with a Companies table and
gives each unit a Company column. Standing alone is named in words rather than
left as an empty cell, because it is a decision. The navigation row does **not**
group by company — you built that and took it out in the same version, and the
reasoning is recorded rather than deleted.

**Two defects you found by actually using the upload:**

- **A pillar arriving from an upload had no code.** Its title read "undefined"
  and every rail button carried the same key, so the rail could not select
  between pillars. Codes are filled in when absent now, positionally; hand-set
  ones are left alone, because nine units carry codes already printed in decks.
- **The sticky chrome was pinned three times over**, at offsets read from two
  custom properties that the shipped file never sets. The header condenses on
  scroll, so the rows drifted out of register and content showed through the
  seams — the haze. One container is pinned now, and the browser owns the
  offset.

**And one found while porting:** `renderFocusSetup` was defined twice, the first
56 lines dead and returning the wrong screen. That is what made your copy look
as though the Focus measures page were broken. Removed.

*Verified:* the access rule proved for both company CEOs and for both flags ·
the code fix through the real upload path, with the rail navigating to the right
pillar · the chrome screenshotted at four scroll positions, rows stacking
contiguously · round trip, fixed point and archived-plan round trip PASS, with
the clean slate now asserting 2 companies and 6 assigned units · every page as
every viewer, live and demo, no console errors · offline walk clean for all 31
viewers · byte-identical rebuild.

### v2.4 — SMP gets an icon
The Strategy Temple, in the house navy and gold, as the browser-tab and bookmark
icon: pediment, architrave, three pillars, stylobate — the platform's own
drawing rather than a generic mark. It reads at 16px, which is the only size
that really matters.

`favicon.svg` and `favicon.png` sit at the repo root for the served site; the
single-file platform carries the same mark **inlined as a data URI**, so it
still shows its own icon opened from a memory stick with no network.

### v2.3 — the plan template loses its codes
**One generic workbook** instead of a download per business unit, and no code in
it anywhere. The unit is chosen on the Read me sheet (one dropdown, cell B2);
everything else — pillar codes, item ids, the links between a measure and its
pillar — the platform assigns on arrival, exactly as it does when you add a
pillar on screen.

What made that possible is a rule, not a clever matcher: **an upload authors a
plan, it does not amend one.** With no row ever matched against what is
recorded, no row needs an identity typed into a sheet.

**Replacing a plan archives it.** Before the new plan is written, the outgoing
one is snapshotted whole — foundation, aspiration, objectives, SWOT, pillars,
measures, tactics and every figure reported against them. **Archived plans** on
Manage lists them with what each held, who replaced it and when, and a
**Restore** that puts one back (archiving whatever is there now, so a restore
can itself be undone). Nothing an import does is a deletion.

**The template asks in your words, not the platform's:** theme by name with an
explicit *— none —* for a cross-cutting pillar · owner typed, not chosen · the
Pillar list on Measures and Tactics read **live** from the Pillars sheet · units
of measure suggested rather than enforced · targets written as real numbers.

*Fixed on the way, and the reason this was urgent:* on a unit with no plan the
Pillar and Owner dropdowns were **empty**, and Excel refuses whatever is typed
into an empty list — so a first plan could not be authored from the template at
all. The same hole sat in the capability workbook's Project column. And every
cell the workbook wrote was text, so every target carried Excel's "number stored
as text" warning.

*Verified:* the template built and inspected sheet by sheet · a filled template
written, read back, and every code minted in the right order with every child on
the right pillar · the flow driven on the real screens — upload, the unit read
from the file, the warning naming 16 reported figures, apply, archive, restore ·
the same over HTTP against Postgres, including the archive surviving a page
reload · round trip, fixed point and an archived-plan round trip all PASS · every
page walked as every viewer, live and demo, no console errors · offline walk
clean for all 29 viewers · byte-identical rebuild.

**A plan must arrive as the .xlsx template.** A CSV has no Read me sheet, so it
cannot say whose plan it is, and guessing would write one unit's plan into
another. Reporting still takes a CSV — it is per unit and the unit is chosen on
screen.

### v2.2 — the clean slate, and the Demo button
The deployed tenant is now the client's own. **Kept:** the company, the ten
business units, the supporting functions, the three group themes, the eight
capability names with their owning function, and all configuration (labels,
bands, levels, the access matrix, the weighting factors and their values).
**Cleared:** every unit plan, foundation and SWOT · the group's foundation,
purpose, values and key objectives · every capability's definition, key
objectives and projects · the reporting cycle, its focus marks and its history ·
the invented people and their role assignments · every weighting factor value,
the written reasons beside them, and the prior cycle. Only `SMO` can sign in.

The worked example did not go: a **Demo data** button top-right switches the
whole product to the full Raya Trade dataset for explaining, shows the
invented-data banner the whole time it is up, and **cannot be saved** — the
autosave refuses to run in demo mode, and returning restores the client's data
exactly as it was left. Offline the button is hidden, because the file *is* the
example.

Three defects only an empty tenant could expose, fixed on the way: "Clear all
plans" on Supporting functions had been inert since 1.7 (it cleared fields a
capability stopped having); capability key objectives and projects were being
stored twice, so a cleared capability would have refilled itself on the next
save; and the group's own scorecard was a stored number that read `undefined%`
with no objectives set — it is computed on read now, like everything else
(§5.1). The viewer switcher was also filled once at load, so after hydration it
still offered the example's 29 people and threw when one was picked.

*Verified:* clean-slate counts read back from a database seeded and migrated
from scratch (units 10, functions 7, themes 3, capabilities 8, people 1;
pillars, measures, tactics, key objectives, clauses, SWOT, projects and history
all 0; cycle and review empty; `smo` the only account) · every page walked as
every viewer, **live and demo, no console errors** · the database read before,
during and after a demo session and across the autosave interval: **unchanged**
· round trip and fixed point still PASS · the offline file walks clean for all
29 viewers.

**The weighting table, empty.** The four factors and their 40/30/20/10 weights
stay — that is the model, not content — and each unit keeps a row to enter its
figures into. Until anything is entered, **every unit counts equally** in the
group compile and the page says so; a share of nothing reads as a dash, not 0%.
Two more defects fell out of this: emptying a cell used to leave the old figure
in place, and a factor added through the editor never got a share column.

### v2.1 — identity
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

**R1 — the Next.js scaffold — is done, on the branch only.** `main` serves the
v2.5 single file as it always has; nothing anyone uses runs on the new stack
yet.

What R1 proved, in `smp-app/`:

- **Prisma reads the existing database.** All 35 tables introspected with
  `prisma db pull` — no new tables, no data moved, no migration. The schema
  stays owned by `db/schema.sql` and `db/migrations/`, which the platform
  applies itself.
- **The design crosses intact.** `scripts/sync-css.mjs` generates the app's
  stylesheet from the platform's own `src/*.css` in build.py's order — carried,
  never hand-copied. A card rendered with the real class names comes out with
  the navy header and the 112px dial, unaltered.
- **The scoring engine ports exactly.** `lib/scoring.ts` (nulls dropped, one
  band function, optional KO weights) computes **the same figure as the live
  platform for all ten units**, Nigeria's dash included.
- Typecheck and production build both pass.

Stack note: Prisma 7 keeps the connection URL in `prisma.config.ts` and
connects through a driver adapter (`@prisma/adapter-pg`) — the same `pg`
driver the old endpoints used.

---

## Next — the rebuild on the HR_ERP stack

**D4 answered 2026-08-20:** the CSS is carried **verbatim** (Tailwind only for
genuinely new things), and the cutover is **early, page group by page group** —
the new app becomes the live site while un-ported screens still link back to
the v2.5 build. Those two answers work together: because the stylesheet is the
same one, the mixed period looks consistent rather than like two products.

| Step | What it is | Why this order |
|---|---|---|
| ~~**R1**~~ | ~~Scaffold beside the live product.~~ **Done** — see *In flight*. NextAuth itself moves to R2, where the shell needs it. | Proved the new stack reads the real data before a single screen is ported. |
| **R2** | **Sign-in and the shell.** The gate, the session, the navigation, the access matrix — the frame every page hangs in. | Everything else needs the frame and the person. |
| **R3** | **Read-only screens first:** Group Performance, unit Performance, Foundation, SWOT, Temple, Strategy/Plan, capability pages. Measured against the frozen v2.5 file screen by screen. | Reading is the bulk of the product and the highest drift risk — port it while there is a reference to compare against. |
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

1. **The tenant is empty, and that is the point.** Until the plans are authored,
   most screens show "No data" rather than figures — which is correct, not
   broken. Load one with **Manage → Import**: download the plan template, choose
   the unit on its Read me sheet, fill it, upload it. Press **Demo data** to show
   anyone what a filled-in platform looks like meanwhile.
2. **A plan upload replaces that unit's whole plan** rather than merging into
   it. The one it replaces is archived and restorable, so this is safe — but it
   is not the way to correct a typo. Edit on screen for that.
3. **Authorization is at the door, not per action.** A signed-in person is
   authenticated, but their browser is still trusted about *what* changed.
   Step R4 of the rebuild closes it.
4. **Last writer wins.** Saves replace the whole state transactionally; two
   people editing at once will not corrupt anything, but the second overwrites
   the first.
5. **The SMO password is `1234`** and is not forced to change (§19.4) — weak,
   deliberate, and to be replaced before anything client-confidential goes in.
   Passwords the SMO issues to other people are still temporary and still force
   a change. **No self-service recovery:** a forgotten password is reset by the
   SMO, which also ends that person's sessions.
6. **Usernames are person keys** (`own_mob`, `mobhead`), shown to the SMO beside
   the Set-password control. Real emails are §16.9 work.
7. **The demo content is invented** except Mobile's plan, and labelled as such
   in the product.

---

## Working outside the repo, and bringing it back

You develop in the project folder outside this repo and bring it back. One rule
makes that safe: **start each outside session from the current folder.** Ask me
for a zip, or pull from GitHub. The v2.5 round arrived on a pre-1.9 base, so
taking it wholesale would have deleted four shipped features and everything from
2.0 on — measured at 409, 191 and 187 lines of pure removal in three files.

- **Quick features and adjustments:** just say so here. Nothing to transfer,
  nothing to reconcile, and it lands verified against the real database.
- **Bigger design rounds outside:** fine, from a fresh copy. Then the difference
  is your new work and it merges cleanly.
- **Never send the built HTML as the thing to merge.** It is generated from
  `src/` by `build.py`; an edit made directly to it cannot go back into the
  sources. Edit sources only.

## Where the pieces live

| Path | What |
|---|---|
| `index.html` | The gate — real login when served with a database, legacy AdminSMO latch offline |
| `SMP-Project-Folder/src/` | The platform's sources; `build.py` assembles the single file, `qa.py` walks every page as every viewer |
| `SMP-Project-Folder/strategy-management-platform-v2.5.html` | The built platform (must rebuild byte-identical from `src/`) |
| `SMP-Project-Folder/DECISIONS-AND-LOGIC-v2.5.md` | Every decision with its reasoning — the contract |
| `db/` | `schema.sql`, `migrations/`, `seed-state.json` (generated) |
| `lib/`, `api/` | State reader/writer and auth; the two endpoints |
| `scripts/` | `extract-state.js` (regenerate the seed), `test-roundtrip.js`, `dev-server.js` |
| `specs/` | Per-feature specifications (spec-kit) |

**The verification loop before any handover:** rebuild byte-identical → `qa.py`
walk → `DATABASE_URL=… node scripts/test-roundtrip.js` (clean slate, round trip,
fixed point and the archived-plan round trip must all print PASS) →
`node scripts/dev-server.js` and drive it in a browser, **in both live and demo
mode**.
