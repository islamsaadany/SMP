# 050 — Plan

Written 2026-09-13 from `spec.md` and the signed-off mockup. Paths are from the
repository root; `smp-app/` is the stack production serves.

---

## The trap, first — the assistant is built for retrieval, and drafting is not

`lib/assistant.cjs`'s `ask()` is the one place this platform talks to a model,
and **three of its defaults are wrong for drafting a framework — two of them
silently.**

1. **It hardcodes `responseSchema: SCHEMA`**, which is `{answered, reply,
   source}`. A draft is eleven fields. This one fails loudly, which is the
   harmless kind.
2. **It refuses an empty corpus.** Every existing caller answers *from* a
   corpus; a draft by name has none at all. Also loud.
3. **It caps thinking at nought**, and §134 gives the reason in its own
   comment — *"answering from a corpus that is IN THE PROMPT is retrieval, not
   reasoning"*. **That reasoning does not hold here.** Composing eleven fields
   about a published framework is the one call in this platform that is not
   retrieval, and a budget of nought produces a **worse draft that looks
   exactly like a good one**. Nothing on the screen, nothing in a log, and no
   check can see it.
4. **`maxOutputTokens: 2048`, with thinking billed against it** (§133). Eleven
   fields is roughly 600 tokens of visible answer; give the model room to think
   and the eleventh field is what gets cut. A truncated draft looks like a
   short one.

**So `ask()` gains three named options and keeps every default it has**:
`schema` (defaulting to `SCHEMA`), `needsCorpus` (defaulting to true) and
`think` (defaulting to the cap). **Never a second caller** — the key, the
endpoint, the timeout, the thinking-knob retry and every degradation rule live
in that file, and a second path to the provider is a second answer to all of
them (§53.5, §112.2). Every existing caller passes none of the three and
behaves byte for byte as it does today, which is what the check asserts.

### The second thing to watch, which is a limit rather than a trap

The ask sends the library as the corpus. **At 80 frameworks it is about 32 KB
if only the five deciding fields travel** — name, section, purpose, key
questions, when to use it — which is roughly a third of sending all nine, and
is exactly what the toolkit's own search already weights highest. That fits
comfortably. **It stops fitting somewhere around 400–500 frameworks**, and the
failure then is the bad kind: a corpus cut in half answers confidently from the
half it got. Named here with its number so the day it matters is a day somebody
saw coming; nothing is built for it now.

---

## Where every piece goes

| Piece | File |
|---|---|
| The table | `smp-app/db/schema.sql` — above the tenant block, beside `memory_entries` |
| Its exclusion | **the same file's** RLS loop, `relname NOT IN (…)` |
| Its exclusion, again | `smp-app/lib/schema-check.ts` — `PLATFORM_TABLES` |
| The table, for a database that already ran the schema | `smp-app/db/migrations/008-the-frameworks-library.sql` |
| The eighty | `smp-app/db/migrations/009-the-eighty-frameworks.sql` |
| Reading and writing | `smp-app/lib/frameworks-api.ts` |
| Asking and drafting | `smp-app/lib/frameworks-ask.ts` |
| The route | `smp-app/app/api/frameworks/route.ts` |
| The three model options | `smp-app/lib/assistant.cjs` |
| The screens | `smp-app/shell/platform.html` — **the source**; `public/platform-page.js` is generated from it |
| The doc | `smp-app/db/README.md` — its list of platform tables |

**`public/` is generated and tracked, and production serves it** (§329). Every
task that touches `shell/platform.html` ends by re-running the generators;
`checks/generated-in-step.mjs` is what catches it if one does not.

---

## The table

```
frameworks
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
  slug        text NOT NULL UNIQUE
  name        text NOT NULL
  section     text NOT NULL
  purpose, key_questions, when_to_use, when_not_to_use,
  inputs_required, outputs, executive_example,
  consultant_use_case, facilitation_tips
              text NOT NULL DEFAULT ''
  added_by    uuid NULL REFERENCES users (id) ON DELETE SET NULL
  created_at  timestamptz NOT NULL DEFAULT now()
  updated_at  timestamptz NOT NULL DEFAULT now()
  CONSTRAINT frameworks_name CHECK (btrim(name) <> '')
```

Three decisions in that, each with its reason:

- **No `tenant_id`, and no reference to `tenants` at all.** The memory's entries
  are *about* a client; a framework is about nobody. This is the one place it
  departs from spec 045's table.
- **`added_by` is NULL-able and `ON DELETE SET NULL`**, where the memory's
  author is `NOT NULL … RESTRICT`. Two reasons: the eighty that come with the
  library were written by nobody here, and an entry outlives whoever typed it —
  blocking a consultant's removal because they once added a framework is the
  wrong trade. **Absent means *came with the library*** and nothing derives a
  person to fill it (§35).
- **The nine content fields default to `''` and are never NULL**, so every
  reader is spared a null check and an empty field reads as empty everywhere.
  The name is the only one that cannot be blank.

**`slug` is UNIQUE in the database.** Today a one-off script derives it and
nothing can collide; with admins adding, two frameworks can want one slug, and
a collision is refused **by name** rather than resolved silently (§87's rule:
the platform notices, names both sides, and does not guess).

---

## One endpoint, four actions

`/api/frameworks`, the shape `/api/memory` already uses — its own route rather
than a fifth action on `/api/platform`, which carries the frozen endpoint byte
for byte. The door in front of it is that file's: a session, and a password
that is no longer temporary.

| Action | Who | What |
|---|---|---|
| `list` | any session | every framework, name/section/purpose, ordered by section then name |
| `one` | any session | all thirteen fields of one |
| `ask` | any session | the question, answered from the library with its sources |
| `draft` | **admin** | a name or pasted source in, eleven fields back. **Writes nothing.** |
| `save` | **admin** | the reviewed fields in, one row written |

**`draft` and `save` are two actions and that is the design, not a convenience.**
The draft is what comes back to be read; the save is the press. A single action
that drafted and wrote would be exactly the thing decision 3 exists to prevent.

**The admin test is `accounts.is_admin`, asked on the server** (constitution X),
and asked **again at press time** on `save` rather than trusted from whatever
drew the screen (§48.2).

---

## The eighty, and how they arrive

`db/apply.mjs` runs `migrations/*.sql` **and only `.sql`** — the frozen stack
had a `.js` migration (§260) and this one has no such door. So the eighty ride
in as a migration of eighty `INSERT`s.

**It is generated, once, and the output is committed.** `scripts/make-frameworks-migration.mjs`
reads the dataset and writes `009-the-eighty-frameworks.sql`; it is run by hand,
its output is the artefact, and the source is recorded in the migration's own
header — `islamsaadany/strategic-decision-toolkit` at `12089e9`. Escaping eighty
records of prose containing curly quotes and en-dashes by hand is how a dataset
arrives subtly wrong.

**It runs once by construction** — `_migrations` records it — so a later deploy
can never restore an entry an admin has since corrected. `added_by` is NULL on
all eighty.

---

## The page — `shell/platform.html`

A fifth tab, **ungated as Memory is**, and four states inside it:

- **The list.** The box (segmented *Search* | *Ask it*, one field), the eight
  section chips with their counts, the count line, and a row per framework —
  name, section, purpose. **The search filters in place and never repaints**
  (§35, §108.13), and a repaint keeps the filter (§108.13's own rule).
- **One framework**, in place behind a `.cback`, nine headed sections, with
  *Edit* for an admin.
- **Asking.** The answer, then a row per framework it drew on, each a door in.
- **Adding**, for an admin: the two ways in, then the draft, then the press.

**Every class the page adds is prefixed `fw`** — a class name is one global
namespace and the console already holds `.tag`, `.cell`, `.row`, `.band`
(§65.9). The mockup is drawn that way and the build takes its names from it.

---

## The ask — `frameworks-ask.ts`

`memory-ask.ts`'s shape, 1:1, with three differences:

1. **The corpus is the five deciding fields**, for the reason above.
2. **The sources are resolved against what was sent**, never trusted as
   written — a model citing an id nobody has is citing nothing, and a page
   drawing it sends somebody after a framework that does not exist (§96.2).
   This is memory-ask's own rule and it is copied, not re-invented.
3. **The decline is the product's words, never the model's** (§125), and it
   says the useful thing: nothing here covers that. For an admin the same
   answer carries the door to adding it.

---

## The draft — `frameworks-ask.ts`, second half

Two ways in, one path out:

- **By name:** no corpus, thinking allowed, eleven fields back.
- **By pasted source:** the source IS the corpus, and the instruction changes
  from *recall this* to *turn this into the fields* — which is retrieval again,
  so the thinking cap stays.
- **Either may decline**, and a decline is the product's sentence offering the
  other door.

**Nothing about the draft touches the database.** It is computed and returned;
the row appears when `save` is pressed and not before. This is asserted by
counting rows before and after (§9 of the spec).

---

## Phases

1. **A — the library, read-only.** The table, the eighty, the list, one
   framework, the search. Useful on its own: eighty frameworks, searchable, for
   the whole firm. **Ends at stop point 1** — Islam opens it and reads one.
2. **B — adding.** The admin's two doors, the draft, the review, the save, and
   the refusals on the server. **Ends at stop point 2** — Islam adds one.
3. **C — asking.** Built last, deliberately and for spec 045's own reason: *an
   assistant over an empty corpus answers confidently from nothing.* Here the
   corpus ships full, so the reason is weaker — but the ordering also puts the
   one change to `assistant.cjs` after the read path is proved, so a regression
   there cannot be confused with a new feature's own noise.

---

## What is checked, and every one red first

`smp-app/checks/frameworks.mjs`, the shape `checks/memory-*.mjs` already has.

- **The eighty land whole** — all thirteen fields on all eighty, **compared
  against the source dataset** rather than against typed numbers (§94.8).
- **A non-admin cannot draft or save**, asked of the server; **and an admin
  can**, or the refusal proves nothing (§94.2).
- **A draft writes nothing** — rows counted before and after.
- **A slug collision is refused by name.**
- **The ask names its sources, and declines when nothing fits** — both ends.
- **A cited id that is not in what was sent is dropped**, not drawn.
- **Every existing `ask()` caller is byte-identical** with the three new
  options absent — the chat, the knowledge base and the memory.
- **The two platform-table lists agree** — §331's existing check, which this is
  the first new table to exercise since it was written.
- **`generated-in-step`** — `public/` regenerated after every page edit.
- **No client request reaches `/api/frameworks`**, driven rather than read.

`SMP_BREAK` switches, for the ones a green run cannot prove on its own:
`no-corpus` (the ask answers from nothing), `no-admin-gate` (the server stops
refusing), `draft-writes` (the draft saves), `think-capped` (the draft path
takes the retrieval default).

---

## What could go wrong that no check will catch

- **A draft that is confidently wrong and reads well.** The review is the whole
  defence and it is a human one. Nothing automated can tell a good account of
  Blue Ocean Strategy from a plausible one.
- **The eight sections stop fitting.** The spec names the trigger — the first
  framework that genuinely fits none — and nothing will raise it but a person.
- **The library drifts from the toolkit repo.** Once the eighty are in this
  table, that repository is a historical source and not a second copy to keep in
  step. Said here so nobody later tries to sync them.

---

## Recorded, not built

The template download, retiring a framework, any history of what an entry said
before it was edited, and per-section visibility. All four are in the spec.

---

## Stop points — Islam's

- **After A**: he opens Frameworks and reads one.
- **After B**: he adds one, by name and by pasted source, and sees a decline.
- **The merge to `main`**, his word on that merge, every time.
