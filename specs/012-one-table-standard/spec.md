# 012 · One table standard

**Version:** v3.24 (unbuilt) · **Decisions:** §79 · **Status:** specified, not built
**Constitution:** checked against v1.1.0 — principles VI, XIV, XV and XVI carry weight here.

Islam, twice: *"in any table in the app always give it the following
functionalities: search bar with quick filters · sorting for the headers ·
always freeze first row and first column · the columns check list view · edit
icon in the top right to edit · ability to add · ability to remove a full row or
retire it with warnings"*, narrowed to *"the tables in the setup and manage
sections only"*.

Then, after using the register: *"for the tables with edit I don't need to edit
the whole table — maybe by pressing the 3 dots on the right of the row I can
work on the row inline and then a small save button rather than opening the
whole table for edits … and this can be across the tables that has individual
row flow."*

That second message **reverses the fifth item** of the first, and the reversal is
the most important decision in this spec. It is recorded as a reversal, not
folded in silently.

---

## 1 · The inventory, counted rather than remembered

Driven across all 18 Setup and Manage pages: **19 tables**. Of those, **one**
has a row menu today (the register), and **three** are wider than the box they
sit in.

| Page | Cols × rows | Wider than its box | A row is a *thing* |
|---|---|---|---|
| People register | 9 × 33 | **yes** | **yes** |
| Official BU list | 5 × 10 | no | **yes** |
| Roles & access | 8 × 8 | **yes** | no — a *cell* is the edit |
| Business units | 11 × 10 | no | **yes** |
| · unit marks | 4 × 10 | no | no — a file picker |
| Companies | 6 × 2 | no | **yes** |
| Functions | 9 × 8 | no | **yes** |
| Capabilities | 7 × 8 | **yes** | **yes** |
| Figure sets | 7 × 1 | no | **yes** |
| Scoring bands | 4 × 4 | no | no — a fixed set |
| Labels | 3 × 8 | no | no — the left column is a contract |
| Branding | 2 × 2 | no | no — two colour pickers |
| Communication | 2 × 5 | no | no — settings |
| Reporting cycle | 8 × 10 | no | no — derived |

**Seven tables have an individual row flow.** Everything in §2 applies to those
seven. §4 says what the other twelve get and what they must not be given.

---

## 2 · What is settled

### 2.1 A row is edited on the row (REVERSES the original fifth item)

Pressing the row's **⋮** offers **Edit this row**. The row's editable cells
become fields **in place**; the actions cell shows **Save** and **Cancel**. No
other row changes, and the rest of the page stays exactly as it was.

Why the reversal is right, in Islam's own case: a whole-table edit mode turns
33 rows × 9 columns into **297 inputs** to change one job title, every one of
them a way to change something by accident, and it repaints the entire table to
get there. The row menu already exists on the register and is already where
*Delete permanently* and *Set a password* live — editing belongs with them.

- **One row open at a time.** Two open rows are two unsaved states and a
  question about which Save means which.
- **Cancel restores what was there**, from a copy taken when the row opened —
  never by re-reading fields that have already been typed into.
- **Save writes and closes.** Fields save as they are today (each binds to its
  setter, §71.2); Save is what ends the mode and what makes the act deliberate.
- **Leaving the page with a row open cancels it.** An edit you cannot see is
  not an edit you agreed to.

### 2.2 Search, with quick filters

One box above the table. It **filters rows in place and never repaints**
(Constitution XV, §35) — a repaint would replace the input being typed into.
Matching is against the row's visible text, so what you searched for is what you
can see.

Quick filters are per-table chips beside the box, offering the answer somebody
actually wants: *Active / Retired* on the register, *Unmapped* on the BU list,
*Retired* on units, companies and functions.

**It appears when there is something to search.** Below nine rows the box is
furniture: Companies has two rows and Figure sets one. The threshold is a
number in one place, so a table crosses it as the tenant grows.

### 2.3 Sortable headers

Click a header to sort, again to reverse, a third time to return to the table's
own order — which is a real state, because the order of units and pillars is the
order somebody **arranged** (§63) and must be recoverable.

**Sorting never reorders the data**, only the view. A table whose row order is
itself the setting (Business units, Figure sets) sorts for reading and saves
nothing — and says so, because a sort that looked like a rearrangement would be
the worst possible ambiguity on exactly those two tables.

### 2.4 Freeze the first row and the first column

Both, and both **conditionally on need** rather than always: the header pins
when the table has its own scroll box; the first column pins when the table is
**wider than that box**. Three tables need the column today; a 4-column table
given a sticky column gets a hairline and a stacking context for nothing.

The mechanics are already proved on the register (§69.19) and must be reused,
not rewritten: the **vertical sticky goes on the `<tr>`, not the cell** —
Chromium does not honour a vertical sticky on a table cell under
`border-collapse:collapse`, and it fails silently with every property reading
back exactly as written. Horizontal sticky on a cell does work.

A frozen cell takes `background:inherit` and the row carries the ground
(§73.2), or the frozen columns stay white beside a striped row.

### 2.5 The columns checklist

A **⋮ Columns** control on the header, listing the columns with a tick each,
remembered per person in `localStorage` — never in the state graph (§25, §47.1):
one person hiding a column must not hide it for the tenant.

**A saved map is always MERGED with the current defaults, never substituted**
(§30.2): a column added later is absent from a map written before it existed,
and reading absent as *false* hides every new column from everybody who ever
touched the control.

It appears above six columns. The first column and the actions column are never
hideable — one is what a row IS, the other is how you act on it.

### 2.6 Add a row

An **Add** row at the foot of the table, in the table, carrying the one field
that identifies the thing — a name, a person, a set. Everything else is filled
in on the row afterwards, through §2.1.

Not every table: **Archived plans** are records, and a role cannot be added at
all (the seven live in `lib/rules.js`; adding one is a code change and a
security decision).

### 2.7 Remove or retire, with the refusal as the feature

Two different acts and both belong on the row's menu:

- **Retire** — they have left, it is finished, it is over. Everything already
  attributed stays true. This is the default for anything that has been used.
- **Delete permanently** — the row should never have existed.

**A delete is REFUSED while anything still points at the row, and the refusal
NAMES what** (§62, §69.4). The refusal sits where the confirmation would be, so
the reason arrives in the place the answer was expected. Blockers are re-asked
on Yes, never trusted from the render that drew the button (§48.2).

**Anything ever reported is a refusal, not a warning** — that is what Retire is
for.

---

## 3 · One implementation, opted into

`tablekit` — one module, wired once per paint, that a table opts into with
`data-tablekit` and a small declaration of what it supports. Seven copies of
search-and-sort is seven places for the next fault to hide, and this project has
already paid for that three times with duplicated CSS rules (§51.5, §53.6) and
twice with duplicated JS (§56.7).

**The classes are prefixed** (Constitution XIV): `tk-search`, `tk-sort`,
`tk-cols`, `tk-rowedit`. `pname` became the pillar rail's rules on a register
cell because it was one plain word (§73.1) — a shared component is exactly where
that happens next.

The register is the reference implementation: it already has the freeze, the
columns chooser, the kebab, Add and Delete. **Those move into `tablekit`
unchanged in behaviour and are asserted to be unchanged**, or this becomes a
rewrite of a working page.

---

## 4 · The twelve tables that are not row-flow, and what they must NOT get

Stated so nobody adds them later out of consistency:

- **Roles & access** — 49 cells, each a two-state toggle. Sorting a matrix
  scrambles the argument it makes; row edit is meaningless when the whole table
  is edits. It gets the **freeze** (it is wider than its box) and nothing else.
- **Scoring bands, Labels, Branding, Communication** — 2 to 8 fixed rows that
  are *settings in a table shape*. A search box and a columns chooser on four
  rows hide nothing and cost a header. Rows cannot be added or removed: the
  bands are the scale, and Labels' left column is a contract that never changes.
- **Reporting cycle, unit marks** — derived or a file picker. No row to edit.
- **Group and company performance, weighting composites** — the row is a
  calculation. There is nothing to add.

---

## 5 · How it is verified

Per Constitution IV and XVI, and the checks are named here so they cannot be
skipped:

1. **Every one of the seven** is driven: search hides rows without repainting;
   sort orders, reverses and returns; the columns map survives a column being
   added; a row opens, saves, and cancels back to what it was.
2. **The scroll does not move** on any of it (§75) — the box's offset and the
   caret are asserted, at 1280×820 with the box already scrolled.
3. **The freeze is measured in PIXELS, not asked of the DOM** (§53.7): a frozen
   cell's computed `position` reads `sticky` whether or not it pins.
4. **The register is asserted unchanged** — same columns, same freeze offsets,
   same actions — before and after it moves onto `tablekit`.
5. **Each new check is proved by breaking what it guards** (Constitution XVI).
6. `qa.py` and the contrast sweep at their baselines: no console errors, 6
   failing runs (§16.15's deferred family).

---

## 6 · Open, and Islam's to answer

1. **Quick filters** — the four proposed above are a guess at what is wanted.
   Which does each table need?
2. **Sorting the two arranged tables** (Business units, Figure sets) — is a
   read-only sort useful there, or is it a trap worth removing entirely?
3. **Retire on the BU list** — an Official BU name has no life today: it is
   added or removed. Should a name that is no longer used be retired instead,
   so the people carrying it keep their history?
