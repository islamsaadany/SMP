# 044 — Tasks

Written 2026-09-11 from `plan.md`. **Built 2026-09-11, all three phases** — Islam: *"go on with all the phases in sequence."* Every box below is done except where noted. Paths are from the
repository root; `smp-app/` is the new stack.

Every check is written **red first** — run it against the build before the
change and watch it fail, or its green run proves nothing (§94.5).

---

## Phase A — the record

Useful on its own. Ends at **stop point 1**: Islam puts a real insight in.

- [x] **A1 · The table, in the platform half.** `smp-app/db/schema.sql`:
  `memory_entries` as `plan.md` gives it, placed **above** the tenant block
  beside `push_keys`, with `about_tenant_id` — never `tenant_id`.
- [x] **A2 · The exclusion list.** Same file, the loop at the end:
  `'memory_entries'` added to `relname NOT IN (…)`. **A1 without A2 is the
  feature dead on every fresh deployment** — do them in one edit.
- [x] **A3 · The migration.** `smp-app/db/migrations/004-the-consulting-memory.sql`,
  the same table for the deployment that already ran `schema.sql` (it runs
  once, recorded as `schema`, so it will never re-run — §33.5). No RLS
  statements here: on an existing database the loop is not re-run, which is
  the outcome wanted, and the migration must not invent a second answer.
- [x] **A4 · The doc.** `smp-app/db/README.md` — its list of platform tables,
  or it drifts the day this lands.
- [x] **A5 · Prisma.** *(client regenerated; `db:pull` not run — it would rewrite `prisma/schema.prisma` from a dev database, which is a change to a checked-in file this feature does not need.)* `npm run db:pull` after applying, so the generated client
  knows the table. It introspects and never migrates (`db/README.md`).
- [x] **A6 · `smp-app/lib/memory-api.ts`** — `list`, `one`, `save`, `drop`.
  Session required, no gate. `mine` computed **on the server** per row and never
  re-derived in the browser. `save` re-checks the author/admin rule at press
  time (§48.2).
- [x] **A7 · `smp-app/app/api/memory/route.ts`** — one route, the action off the
  body, the shape `app/api/platform/route.ts` already uses.
- [x] **A8 · The tab.** `platform.html` (root) `drawNav()`:
  `["memory", "Memory", true]`, and `redraw()`'s branch.
- [x] **A9 · The list, reading one, the one-insight form, the empty state** —
  in the page's own classes, the detached-node swap it already uses (§313.28),
  and **no description under any heading** (rule 1b-ii).
- [x] **A10 · `checks/memory-boundary.mjs`** — written **before** A6 and run
  against the build without it. Written under one tenant, read under another;
  no `tenant_rows` policy on `memory_entries`; nothing drawn inside a client's
  shell. Break: `--break=tenant-column` (rename the column and put it back in
  the loop's reach) must go red.
- [x] **A11 · `checks/memory-api.mjs`** — every action; the author and a
  platform admin may edit, a third consultant may not, **both ends**; a client
  holding insights refusing deletion by name.
- [x] **A12 · `checks/memory-page.mjs`** — the tab drawn for a consultant with
  no admin flag; an entry written and read back **through the API**; the
  author's name on the entry; a title-only save; and decision 4 as an absence
  at both ends (opening writes no row, while the entry's own write lands in the
  same run — §113.8).
- [x] **A13 · `package.json`** — `check:memory` and `check:memory:red` with a
  named break per group, beside the nine already there.
- [x] **A14 · Run the neighbours.** `check:room`, `check:deploy`, `check:door`,
  `check:state`, `check:shell`, `tsc`, and `checks/platform-cards.py` against
  **both** copies of the page (`platform.html` and the generated
  `smp-app/shell/platform.html`) — a generated copy is where a drift hides
  (§317).

> **STOP — Islam. WAIVED BY HIM** (*"don't stop until you need me for a
> decision"*), so phases B and C were built on top of A without the pause.
> The words are therefore still placeholders, settled on use rather than here.

---

## Phase B — the period debrief

- [x] **B1 · `smp-app/lib/memory-split.cjs`** — UMD, like `platform-rules.cjs`.
  `split(text) → { entries, unread }`, tolerant of case and spacing, an unknown
  key ignored rather than fatal, an unreadable block kept **whole**, and **a
  paste with no `===` becoming one entry rather than nought**.
- [x] **B2 · `checks/memory-split.mjs`** — pure node, no browser, no database,
  **written before B1**. Every tolerance, and the degenerate paste. Breaks:
  `--break=drop-unread`, `--break=empty-on-noise`.
- [x] **B3 · `scripts/build-shell.mjs`** — one `copyFileSync` into `public/`,
  and the script tag in `platform.html`. **Assert the copy**, the way that file
  already asserts its assembly.
- [x] **B4 · The prompt.** Built from the client, its industry and the period —
  the text is settled in the mockup and moves across as it is.
- [x] **B5 · The debrief screen and the drafts screen.** Paste, split, read,
  edit, drop, save all. **No repaint under a typing hand** (§71.2): a draft edit
  writes to the draft and redraws nothing.
- [x] **B6 · `saveMany`** in `memory-api.ts` — **one transaction**, all or
  none, and the count the page shows is the count that landed.
- [x] **B7 · Extend `checks/memory-api.mjs`** — `saveMany` all-or-nothing,
  falsified by making one of six rows invalid and asserting **nought** are
  stored.
- [x] **B8 · Extend `checks/memory-page.mjs`** — a paste of four blocks driven
  through the real page becomes four drafts, and **nothing is stored until Save
  all** (the table counted after the paste, §94.2).

---

## Phase C — the assistant

- [x] **C1 · The corpus.** The entries, shaped for `lib/assistant.cjs` the way
  `db/kb.json` is shaped — read live, never a second store.
- [x] **C2 · Two rules of its own**: every answer **names its sources** (entry,
  client, author), and it answers only from what the asker may read — which
  today is everything, written down anyway so a later narrowing has somewhere
  to be enforced (§42).
- [x] **C3 · Where it is asked from** — a box on the Memory page, not a second
  corner (§32: a door behind a door).
- [x] **C4 · `checks/memory-ask.mjs`** — a stand-in for the model (§100.3);
  sources asserted present; **a question the corpus does not cover asserted to
  decline rather than answer**, which is the assertion this phase exists for.

---

## Before the merge

- [x] The memory's five checks green and **all ten falsifications red**;
  `check:room` 10/0, `check:deploy` 5/0, `check:shell` 61/0, `check:state`
  91/0, `check:door` 49/0, `test:rules` 588/0, `tsc` clean,
  `platform-cards.py` 19/0 on BOTH copies of the page (§317).
- [ ] **Not run here, and said rather than implied:** `qa.py` at Next and the
  nine spike proofs (untouched by this — no `lib/state*`, no tenant table, no
  save path); `check:demo`, **red on the build before this work too**
  (reproduced with the change stashed, §303) because this sandbox has no
  seeded demo tenant; and `platform-look.py`, whose fixture is the frozen
  stack's and predates the cutover — its subject is covered instead by
  `memory-page.mjs` §9, which measures contrast on these screens in BOTH
  palettes.
- [x] `IMPLEMENTATION_PROGRESS.md` and `DECISIONS-AND-LOGIC` updated **in the
  same commit as the work** (rule A7/A8).
- [ ] `SHELL` in `sw.js` bumped to a name `origin/main` does not hold —
  confirmed **again immediately before the push** (§91, §94.12, §94.16).
  **NOT DONE, and it belongs to the merge**: the name must be chosen from
  `origin/main` as it stands at that moment, not from it as it stands now
  (§94.16 — the window between reading main and pushing is as long as running
  the checks). Measured meanwhile: `public/shell.js` is **byte-identical to
  HEAD**, so the client's shell has not moved at all.
- [x] **No forced sign-out**: this changes no save path, no authoriser and no
  tenant table, so spec 029's migration is not owed — asserted rather than
  assumed (`check:state` 91/0, `test:rules` 588/0 untouched).
- [ ] **The what-to-check list** (rule A16) — written when the merge is, and
  not before: it names what to open on the deployment that merge produces.

> **STOP — Islam.** The merge, on that merge, every time (rule 4).
