# 044 — Plan

**Written 2026-09-11**, after Islam signed off `spec.md` and the mockup
(*"the questions are good, go ahead with the plan"*). Nothing built.
Branch: `claude/blissful-brown-fxlait`. **New stack only** — the frozen single
file takes no new features (§314), and `main` cut over on 2026-09-10 (§317.3–.8).

## The trap, first — because it would kill this feature in silence

`smp-app/db/schema.sql` ends in **one loop over the catalogue** that gives every
table row-level security, a `tenant_rows` policy and a `(tenant_id)` index —
**by exclusion**, not by inclusion:

```sql
WHERE n.nspname = current_schema() AND c.relkind = 'r'
  AND c.relname NOT IN ('tenants','users','tenant_users','sessions',
                        'login_attempts','platform_access','tenant_log',
                        'push_keys','_migrations')
```

A new table is tenant-owned unless somebody says otherwise. So a
`memory_entries` carrying a column called `tenant_id` — the obvious name, since
it points at `tenants (id)` — would be handed a policy reading
*`tenant_id = current_setting('app.tenant_id')`*, and **a consultant on RHI
could never read a Raya insight.** The whole feature, destroyed, by a loop
nobody edited, with no error anywhere.

**And the two deployments would disagree** (§113.7's mirror): `schema.sql` runs
**once**, recorded as `schema` in `_migrations`, so on the existing deployment
the loop never re-runs and the table would be fine — while every fresh
deployment got the dead version. Perfect on ours, broken on a new client's.

**Two answers, and the second is what makes the first safe to rely on:**

1. The three memory tables join the exclusion list, and `db/README.md`'s list
   with them.
2. **The column is `about_tenant_id`, never `tenant_id`** — it means *which
   client this insight is about*, which is not *which tenant owns this row*, and
   the two are genuinely different facts. The gain is the failure mode: if
   somebody later adds a fourth memory table and forgets the exclusion list, the
   loop's `CREATE INDEX … (tenant_id)` **fails the apply outright** rather than
   silently attaching a policy that empties the page. *A loud failure in place
   of a quiet one is the whole of the naming decision.*

`checks/memory-boundary.mjs` asserts both ends: no `tenant_rows` policy on the
memory tables, and an insight written under one tenant setting **read back under
another** — which is the feature, expressed as the one assertion that fails if
any of this is got wrong.

## Where every piece goes

| | |
| --- | --- |
| `smp-app/db/schema.sql` | the table, in the **platform** half, and the exclusion list |
| `smp-app/db/migrations/004-the-consulting-memory.sql` | the same table for the deployment that already ran `schema.sql` |
| `smp-app/db/README.md` | its list of platform tables, or the doc drifts |
| `smp-app/lib/memory-api.ts` | the endpoint's answers |
| `smp-app/app/api/memory/route.ts` | one route, one action per request |
| `smp-app/lib/memory-split.cjs` | the debrief splitter — UMD, node **and** browser |
| `platform.html` (repo root) | the Memory tab; `build-shell.mjs` generates the served copy |
| `smp-app/scripts/build-shell.mjs` | one line, to copy the splitter into `public/` |
| `smp-app/checks/memory-*.mjs` | four checks, each red first |

**`platform.html` at the repo root is the source** — `scripts/build-shell.mjs`
generates `smp-app/shell/platform.html` from it and lifts its inline script into
`public/platform-page.js`, because the page is served under `script-src 'self'`
with no hash to go stale (Phase B). **Never edit the generated copy.**

## Three decisions about where code goes, and why

**A route of its own, not a fourth action on `/api/platform`.**
`lib/platform-api.ts` is the frozen endpoint carried across *byte for byte* and
its whole discipline is that it still answers what the frozen page asked. Adding
a feature's actions into it ends that property and makes a future diff against
the original impossible. `lib/memory-api.ts` keeps the carried file carried.

**No new rule in `platform-rules.cjs`, and that is not a shortcut.** Measured:
`platform.html` loads **no rules module in the browser at all** — no
`<script src>`, no `FFRules` — because the page reads flags the server already
computed (`mine`, `canConsultants`, `canAccess`). So *may I edit this entry*
is answered once on the server and sent as `mine: true` on the row, exactly as
`FF.isMine` is today (§53.5: one answer, not two), and **asked again at press
time** (§48.2). It also avoids a live drift: `smp-app/lib/platform-rules.cjs`
and the root's `lib/platform-rules.js` are **byte-identical copies with nothing
syncing them** — recorded here, deliberately not touched by this feature.

**The splitter is its own module.** It is the one piece of this feature with a
wrong answer available to it, so it must be checkable without a browser or a
database: a UMD like `platform-rules.cjs`, `require`d by `checks/memory-split.mjs`
and loaded by the page with a script tag.

## The table

In the platform half, above the tenant block:

```sql
CREATE TABLE memory_entries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  about_tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE RESTRICT,
  author_id       uuid NOT NULL REFERENCES users (id)   ON DELETE RESTRICT,
  kind            text NOT NULL DEFAULT 'lesson',
  title           text NOT NULL,
  happened        text NOT NULL DEFAULT '',
  did             text NOT NULL DEFAULT '',
  came_of_it      text NOT NULL DEFAULT '',
  next_person     text NOT NULL DEFAULT '',
  occurred        text NOT NULL DEFAULT '',   -- the period; free text, filled by the debrief
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memory_kind CHECK (kind IN ('practice','hiccup','lesson')),
  CONSTRAINT memory_title CHECK (btrim(title) <> '')
);
CREATE INDEX memory_about ON memory_entries (about_tenant_id, created_at DESC);
CREATE INDEX memory_author ON memory_entries (author_id);
```

**One table.** Drafts are never stored (the debrief does not remember where it
got to — spec), so there is nothing else to hold.

**`ON DELETE RESTRICT` on both, and it is a decision rather than caution.**
Deleting a client that has insights is **refused, naming them** — §62's shape —
because *the memory outlives the engagement*: when Forefront stops working with
somebody, what was learned there is worth more, not less. Retiring a client is
the ordinary path and touches none of this. Same for a consultant who leaves:
their insights stay, and stay attributed.

**The four answers may be empty and the title may not** — that is *a title and
a client are enough to save*, enforced in the database rather than only in the
form.

**`occurred` is free text and stores an absence as `''`.** Nothing derives it
and no picker offers it; the debrief writes the period it was given.

## The endpoint

`POST /api/memory`, one `action` per request, session required — **every
signed-in consultant, no gate** (decision 1), which makes this the first
platform surface with none, so the check asserts it rather than leaving it to
read as an oversight.

| action | what it does |
| --- | --- |
| `list` | filters: `client`, `industry`, `kind`, `q`. Joins `tenants` for the name and the industry; returns `mine` per row |
| `one` | a single entry with the same `mine` |
| `save` | insert or update — the author or a platform admin only, **re-checked here** |
| `drop` | the author or a platform admin |
| `saveMany` | the debrief's drafts, in **one transaction**: all of them land or none does |

**The industry is joined, never stored on the entry** (spec): one answer to
*what kind of business was this*.

**`q` searches the title and the four answers.** `ILIKE` over a few hundred rows
is the right amount of machinery for a few hundred rows; full-text search is
recorded below, not built.

**`saveMany` is one transaction on purpose.** Six insights half-saved after a
long conversation is the outcome nobody can tell apart from a bug, and the
person has already read them all.

## The page

A fourth tab in `platform.html`'s `drawNav()` — `["memory", "Memory", true]`,
`true` because nobody is gated — and the four states the mockup draws, in the
page's own classes.

**Its own silent-refresh discipline**: `platform.html` builds a detached node
and swaps it in, keeping the scroll (§313.28). The memory's list and drafts do
the same, and **the drafts screen never repaints under a typing hand** (§71.2) —
editing a draft writes to the draft in memory and nothing redraws.

## The splitter

`lib/memory-split.cjs` — `split(text) → { entries, unread }`:

- blocks between `===` rules, each parsed on its `KIND:` / `TITLE:` / `WHEN:`
  and the four answer keys;
- **case-insensitive, tolerant of spacing**, and a key it does not know is
  ignored rather than failing the block;
- a block it cannot read comes back **whole in `unread`**, with its text intact
  (§184);
- **a paste with no `===` at all is one entry holding all of it**, never nought
  — losing what somebody dictated is the one unacceptable outcome, so the
  degenerate case is the safe one;
- `kind` that is not one of the three falls back to `lesson` and is flagged for
  the reader rather than refused.

## Phases

**A — the record.** Table, migration, endpoint, the list, reading one, the
one-insight form, the empty state. **Useful on its own**, which is why it is
first: somebody can start writing the day it lands.

**B — the debrief.** The splitter, the prompt, the paste, the drafts screen,
`saveMany`.

**C — the assistant.** `lib/assistant.cjs` already answers from a corpus,
declines rather than invents, and hands over (§104, §299) — this points it at
the entries, with two rules of its own: **every answer names its sources**
(which entry, which client, who wrote it) and it answers only from what the
asker may read. **Last, deliberately**: an assistant over an empty memory
answers confidently from nothing.

## What is checked, and every one red first

| | |
| --- | --- |
| `checks/memory-split.mjs` | pure, no browser, no database — the blocks, the tolerances, the unreadable block kept, the no-`===` paste becoming one entry |
| `checks/memory-boundary.mjs` | **the assertion the feature rests on**: written under one tenant, read under another; no `tenant_rows` policy on the table; nothing drawn inside a client's shell |
| `checks/memory-api.mjs` | every action; the author and the admin may edit and a third consultant may not; `saveMany` all-or-nothing; a client with insights refusing deletion |
| `checks/memory-page.mjs` | the tab drawn for a consultant with no admin flag; an entry written and read back **through the API**; the author's name on the entry; a title-only save |

**Decision 4 as an absence, at both ends**: opening an entry writes no row —
the table counted before and after — **with a write of the entry itself
asserted to land in the same run**, or a build that stored nothing at all
passes it (§113.8).

`npm run check:memory` and `check:memory:red` join `package.json` beside the
nine that are there, with a named break per assertion group.

## What could go wrong that no check will catch

- **A model that ignores the block format.** Every assistant follows it most of
  the time and none follows it always; the amber block is the designed outcome,
  not a failure — and no check of ours can test somebody else's model.
- **Somebody pasting a draft they have not read.** The review screen makes it
  possible to read them, not certain. This is a working practice, not a control.
- **Confidentiality.** Decision 1 is deliberate and the platform enforces the
  boundary it can: Forefront's door, never a client's shell. It cannot enforce
  judgement about what goes in a write-up.

## Recorded, not built

- Full-text search, ranking, tags. `ILIKE` first; measure before adding an index
  nobody needs.
- Attachments (§261's blob endpoint exists).
- Editing somebody else's entry: the author and a platform admin, and no more,
  until Islam says otherwise.
- `platform-rules.cjs` duplicated at the root with nothing syncing it — a live
  drift risk, named here, and not this feature's to fix.

## Stop points — Islam's, both of them

1. **After phase A**, before the debrief is built: a page he can put an insight
   into, so the shape is judged on use rather than on a drawing.
2. **The merge**, on that merge, every time (rule 4). This changes no save path
   and no authoriser, so it carries **no forced sign-out** (§ spec 029's test) —
   said rather than assumed.
