# 050 — Tasks

Written 2026-09-13 from `plan.md`. **Phases A and B are built, 2026-09-13** — Islam: *"BUILD IT"*, then *"keep going until you need something from me"*. C is not. Paths are from the
repository root.

**Every check is written red first** — run it against the build before the
change and watch it fail, or its green run proves nothing (§94.5).

**The console's page is `platform.html` AT THE REPOSITORY ROOT.** Both
`smp-app/shell/platform.html` and `smp-app/public/platform-page.js` are
generated from it, so an edit to either is an edit the next generator run
throws away. **Every task that touches it ends by re-running the generators**
(§329). `node smp-app/checks/generated-in-step.mjs` is the
one that catches a forgotten run.

---

## Phase A — the library, read-only

Useful on its own: eighty frameworks, searchable, for the whole firm. Ends at
**stop point 1**.

- [x] **A1 · The table.** `smp-app/db/schema.sql`, above the tenant block
  beside `memory_entries`, exactly as `plan.md` gives it — **no `tenant_id` and
  no reference to `tenants`**.
- [x] **A2 · Its exclusion, in the same edit.** Same file, the loop at the end:
  `'frameworks'` into `relname NOT IN (…)`. **A1 without A2 is not a quiet
  bug** — the loop forces row-level security and then creates an index on a
  `tenant_id` this table has not got, so the schema apply fails and a fresh
  deployment gets no database at all. One edit, both halves.
- [x] **A3 · Its exclusion, again.** `smp-app/lib/schema-check.ts`
  `PLATFORM_TABLES`. These two lists cannot share a constant (one runs inside
  Postgres), which is why §331 wrote a check that they name the same set — this
  is the first table to exercise it since.
- [x] **A4 · The migration**, for a database that has already run the schema:
  `smp-app/db/migrations/008-the-frameworks-library.sql`. No RLS statements —
  on an existing database the loop is not re-run, which is the outcome wanted,
  and the migration must not invent a second answer (spec 045's A3).
- [x] **A5 · The generator.** `smp-app/scripts/make-frameworks-migration.mjs`
  reads the dataset and writes the inserts. Run by hand, **its output is the
  artefact**, and the source is named in the migration's own header:
  `islamsaadany/strategic-decision-toolkit` at `12089e9`.
- [x] **A6 · The eighty.** `smp-app/db/migrations/009-the-eighty-frameworks.sql`,
  committed. `added_by` NULL on all eighty.
- [x] **A7 · The doc.** `smp-app/db/README.md` — its list of platform tables, or
  it drifts the day this lands.
- [x] **A8 · `smp-app/lib/frameworks-api.ts`** — `list` and `one`. Session
  required, no gate. **`canAdd` was claimed on this line and was not built**
  until B6 needed it to draw the door — §104.8's own fault, in my own tasks
  file: a recorded intention nothing carries out. It is there now, computed on
  the server per request and never re-derived in the browser.
- [x] **A9 · `smp-app/app/api/frameworks/route.ts`** — one route, the action off
  the body, the shape `app/api/memory/route.ts` already uses.
- [x] **A10 · The tab.** `platform.html` (root) `drawNav()`:
  `["frameworks", "Frameworks", true]` — ungated, as Memory is — and
  `redraw()`'s branch.
- [x] **A11 · The list**, from the mockup: the box, the eight chips with counts,
  the count line, a row per framework. Every new class prefixed `fw` (§65.9).
- [x] **A12 · One framework**, in place behind a `.cback`, nine headed sections.
- [x] **A13 · The search filters in place and never repaints** (§35), and a
  repaint keeps the filter (§108.13). Both are assertions, not intentions.
- [x] **A14 · Regenerate** `public/`, and `generated-in-step` clear.
- [x] **A15 · `smp-app/checks/frameworks.mjs`** — 28 assertions, driving the
  REAL handler against a real database, all inside one transaction that rolls
  back. The eighty are compared against their own INVARIANTS rather than the
  upstream dataset, and the check says why (once 009 has run this table IS the
  library). Red three ways: `client-reads` 2, `alphabetical` 1, `short-library` 4.
- [x] **A16 · `smp-app/checks/frameworks-page.mjs`** — 21 assertions in a real
  browser against the built app. **Not in the plan, and it earned its place on
  its first run**: the filter set `row.hidden` and the rows stayed on screen,
  because `.fwrow{display:block}` beats the browser's own `[hidden]` rule. The
  count read *"12 of 80"* over eighty visible rows — the worst shape a filter
  takes, because it looks like it worked. Every assertion asks what is VISIBLE,
  never what carries the attribute; red 3 under `no-hidden-rule`, which cuts
  that one rule out of the real served page and puts it back.

> **Stop point 1 — Islam opens Frameworks and reads one.**

---

## Phase B — adding

- [x] **B1 · `smp-app/lib/assistant.cjs` gains three named options** — `schema`,
  `needsCorpus`, `think` — each defaulting to exactly what it does today.
  **Never a second caller.** The header comment says why drafting is the one
  call in this platform that is not retrieval.
- [x] **B2 · Every existing caller asserted byte-identical** with the three
  absent: the chat, the knowledge base, the memory. This is the task that makes
  B1 safe, and it is red first by breaking a default.
- [x] **B3 · `smp-app/lib/frameworks-ask.ts`, the draft half** — by name (no
  corpus, thinking allowed, a bigger output budget) and by pasted source (the
  source is the corpus, the thinking cap stays). Either may decline.
- [x] **B4 · `draft` and `save` as two actions.** `draft` writes nothing;
  `save` writes one row and **re-asks the admin test at press time** (§48.2).
- [x] **B5 · The slug**, minted from the name, UNIQUE in the database, and a
  collision refused **by name** (§87).
- [x] **B6 · The screens** — the two ways in, the draft with every field
  editable, the amber *this is a draft* band, Save and Discard, and the decline
  offering the other door.
- [x] **B7 · Regenerate** `public/`, and `generated-in-step` clear.
- [x] **B8 · The checks.** `checks/frameworks.mjs` 44 → **69 assertions**, and
  `checks/frameworks-page.mjs` 21 → **44**, both green and both proved able to
  fail. The model is **stood in front of** rather than branched around
  (§100.3): a stub answers on `GEMINI_ENDPOINT` in both files, so what
  drafting SENDS is asserted off the wire — no thinking cap and 4096 by name,
  the cap back on from a pasted source — and what it gets back is chosen per
  section. Switches: `no-admin-gate` (server, **11 red** in one and **1** in
  the other, which is the both-ends assertion), `think-capped` (1 red),
  `no-hidden-rule` (3 red), and phase A's three still red.
  **`draft-writes` is NOT shipped and that is the decision**: the other
  switches flip one token of a real decision, and this one would have meant
  adding a write path to `draft` that the product otherwise has not got —
  a fake in the product to serve a check. It is falsified from the SOURCE
  instead (§276): an INSERT put into `draft`, run, **1 red** printing
  `81 → 82`, reverted, green.

> **Stop point 2 — Islam adds one by name, one by pasted source, and sees a
> decline.** *Built 2026-09-13. Not run against a real provider from here —
> every drafting assertion is made against a stub, which is what makes the
> wire readable and is also what this stop point exists to cover (§113.8).*

---

## Phase C — asking

Built last: it puts the one change to `assistant.cjs` after the read path is
proved, so a regression there cannot be confused with a new feature's noise.

- [ ] **C1 · `frameworks-ask.ts`, the ask half** — `memory-ask.ts`'s shape, the
  corpus the **five deciding fields** (name, section, purpose, key questions,
  when to use it), for `plan.md`'s reason.
- [ ] **C2 · The sources resolved against what was sent**, never trusted as
  written (§96.2). Copied from `memory-ask.ts`, not re-invented.
- [ ] **C3 · The decline in the product's words** (§125), carrying the door to
  adding it **for an admin only**.
- [ ] **C4 · The screens** — the answer, a row per framework drawn on, each a
  door in.
- [ ] **C5 · Regenerate** `public/`, and `generated-in-step` clear.
- [ ] **C6 · The checks.** It names its sources; it declines when nothing fits;
  a cited id nobody has is dropped rather than drawn. Switch: `no-corpus`.

---

## Before the merge

- [ ] `node smp-app/checks/frameworks.mjs` — green, and every `SMP_BREAK`
  switch proved red.
- [ ] `node smp-app/checks/memory-boundary.mjs` — the two platform-table lists.
- [ ] `node smp-app/checks/generated-in-step.mjs` — all clear.
- [ ] The memory's own checks, the door, state, shell — a new platform table and
  a changed `assistant.cjs` are exactly what would disturb them.
- [ ] `npx tsc --noEmit` **with the cache removed first** — `npm run typecheck`,
  never a cached run (§320.5a).
- [ ] **No `sw.js` bump.** §91's trigger is the *frozen built file's* bytes
  changing, and nothing here touches `SMP-Project-Folder/`. Said rather than
  left as a habit.
- [ ] The what-to-check note for Islam: one line per screen, in the words of the
  navigation.
- [ ] **`main` is his call, on that merge.**
