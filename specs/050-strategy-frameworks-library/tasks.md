# 050 — Tasks

Written 2026-09-13 from `plan.md`. **Nothing is built.** Paths are from the
repository root.

**Every check is written red first** — run it against the build before the
change and watch it fail, or its green run proves nothing (§94.5).

**Every task that edits `smp-app/shell/platform.html` ends by re-running the
generators**, because `smp-app/public/` is generated, tracked, and what
production serves (§329). `node smp-app/checks/generated-in-step.mjs` is the
one that catches a forgotten run.

---

## Phase A — the library, read-only

Useful on its own: eighty frameworks, searchable, for the whole firm. Ends at
**stop point 1**.

- [ ] **A1 · The table.** `smp-app/db/schema.sql`, above the tenant block
  beside `memory_entries`, exactly as `plan.md` gives it — **no `tenant_id` and
  no reference to `tenants`**.
- [ ] **A2 · Its exclusion, in the same edit.** Same file, the loop at the end:
  `'frameworks'` into `relname NOT IN (…)`. **A1 without A2 is not a quiet
  bug** — the loop forces row-level security and then creates an index on a
  `tenant_id` this table has not got, so the schema apply fails and a fresh
  deployment gets no database at all. One edit, both halves.
- [ ] **A3 · Its exclusion, again.** `smp-app/lib/schema-check.ts`
  `PLATFORM_TABLES`. These two lists cannot share a constant (one runs inside
  Postgres), which is why §331 wrote a check that they name the same set — this
  is the first table to exercise it since.
- [ ] **A4 · The migration**, for a database that has already run the schema:
  `smp-app/db/migrations/008-the-frameworks-library.sql`. No RLS statements —
  on an existing database the loop is not re-run, which is the outcome wanted,
  and the migration must not invent a second answer (spec 045's A3).
- [ ] **A5 · The generator.** `smp-app/scripts/make-frameworks-migration.mjs`
  reads the dataset and writes the inserts. Run by hand, **its output is the
  artefact**, and the source is named in the migration's own header:
  `islamsaadany/strategic-decision-toolkit` at `12089e9`.
- [ ] **A6 · The eighty.** `smp-app/db/migrations/009-the-eighty-frameworks.sql`,
  committed. `added_by` NULL on all eighty.
- [ ] **A7 · The doc.** `smp-app/db/README.md` — its list of platform tables, or
  it drifts the day this lands.
- [ ] **A8 · `smp-app/lib/frameworks-api.ts`** — `list` and `one`. Session
  required, no gate. `canAdd` computed **on the server** per request and never
  re-derived in the browser.
- [ ] **A9 · `smp-app/app/api/frameworks/route.ts`** — one route, the action off
  the body, the shape `app/api/memory/route.ts` already uses.
- [ ] **A10 · The tab.** `smp-app/shell/platform.html` `drawNav()`:
  `["frameworks", "Frameworks", true]` — ungated, as Memory is — and
  `redraw()`'s branch.
- [ ] **A11 · The list**, from the mockup: the box, the eight chips with counts,
  the count line, a row per framework. Every new class prefixed `fw` (§65.9).
- [ ] **A12 · One framework**, in place behind a `.cback`, nine headed sections.
- [ ] **A13 · The search filters in place and never repaints** (§35), and a
  repaint keeps the filter (§108.13). Both are assertions, not intentions.
- [ ] **A14 · Regenerate** `public/`, and `generated-in-step` clear.
- [ ] **A15 · `smp-app/checks/frameworks.mjs`** — the eighty land whole
  (compared against the source dataset, never typed numbers), the list and one
  read, no client request reaches the route. Red first.

> **Stop point 1 — Islam opens Frameworks and reads one.**

---

## Phase B — adding

- [ ] **B1 · `smp-app/lib/assistant.cjs` gains three named options** — `schema`,
  `needsCorpus`, `think` — each defaulting to exactly what it does today.
  **Never a second caller.** The header comment says why drafting is the one
  call in this platform that is not retrieval.
- [ ] **B2 · Every existing caller asserted byte-identical** with the three
  absent: the chat, the knowledge base, the memory. This is the task that makes
  B1 safe, and it is red first by breaking a default.
- [ ] **B3 · `smp-app/lib/frameworks-ask.ts`, the draft half** — by name (no
  corpus, thinking allowed, a bigger output budget) and by pasted source (the
  source is the corpus, the thinking cap stays). Either may decline.
- [ ] **B4 · `draft` and `save` as two actions.** `draft` writes nothing;
  `save` writes one row and **re-asks the admin test at press time** (§48.2).
- [ ] **B5 · The slug**, minted from the name, UNIQUE in the database, and a
  collision refused **by name** (§87).
- [ ] **B6 · The screens** — the two ways in, the draft with every field
  editable, the amber *this is a draft* band, Save and Discard, and the decline
  offering the other door.
- [ ] **B7 · Regenerate** `public/`, and `generated-in-step` clear.
- [ ] **B8 · The checks.** A non-admin refused **and an admin allowed** (§94.2);
  a draft writing nothing, counted before and after; a collision refused.
  Switches: `no-admin-gate`, `draft-writes`, `think-capped`.

> **Stop point 2 — Islam adds one by name, one by pasted source, and sees a
> decline.**

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
