# 054 · Setup per module, and the client's own setup on the landing

**Status:** decided 2026-09-15. Islam, of the four decisions the mockup left
open: *"as drawn for all four, write the spec."* **Nothing is built.** The
mockup is `design-mockups/module-setup/2026-09-15_setup-per-module.html`,
published and signed off as an artifact (rule 1c); it is the record of what
was agreed and is not edited to match what gets built (Principle II).

**Reverses:** spec 046 §4.5 (*one Setup page, a Client group and a group per
module*, which **rejected** a Setup page per module) and the "one page" half of
spec 046 §4.4 (*one Access page, a Client tab and a tab per module*). Both are
reversed at Islam's instruction and recorded as reversals, never overwritten:

> *"the setup and access page should be per module because each module has
> its own setup elements including the access and the landing line."*

§4.5's reason for rejecting this was never wrong and survives as the one
question this spec has to answer: *the spine has to live somewhere that is not
inside any module.* §4.5 answered it with a Client group on Strategy's rail.
This spec answers it with the client landing, which is the spine's own page.

**Depends on:** spec 046 (modules on one spine), spec 053 (Insights, the
first module with anything of its own to set), §354 (a module is a folder
that serves itself), §355 (the module seam carries the viewer's seat).

**Decisions log:** §356, written with the build, not before it (rule A7: in
the same commit as the code).

---

## 1 · What this is

Today there is **one Setup page for the whole client and it lives inside
Strategy**. The gear in the top bar opens it; its address `/<client>/setup/…`
carries no module because when it was built Strategy was the whole product.
Its rail holds five groups and every page the client can set, from the
reporting cycle to the people register to the colours of the bar.

The client now holds modules that are not Strategy. Insights is built and
serves itself (§354); a client's card names which modules it has. But
**Insights has no Setup, no access page, and no way to say what one line it
shows about itself anywhere** — and the only Setup there is belongs to a
module Insights is not in.

Islam's ruling is that each module carries its own. What that leaves is the
settings that belong to no module: the people, the seats, the organisation,
the branding, the email sender. They are the client's whatever modules the
client has, and they need a home that is not inside any module.

## 2 · The four decisions — all four "as drawn"

Put to Islam with a recommendation on each; he took the drawing on all four.

1. **Where the client-wide settings live: the client landing.** The
   alternative — a fourth Setup called *Client*, behind the gear, reachable
   from every module — was offered and not taken. The landing is the one page
   that belongs to no module, and the Super user opens it every day.

2. **Which entries are the client's: the eight the drawing marks.** People
   register, Knowledge base, Business units, Supporting functions, Companies,
   Official BU list, Branding, Email. The recommendation was to keep
   Knowledge base in Strategy; Islam took the drawing, so it moves. **The
   drawing carries one gap here, said rather than hidden**: its "Today" rail
   marks Knowledge base as moving and its landing block lists five doors
   without it. This spec lists it as the sixth door (§4.1). Terminology
   stays in Strategy, as drawn.

3. **An Access page per module, inside that module's Setup.** Strategy's is
   the matrix exactly as it is today. Insights' is one column — *may open
   Insights* — against the same roles. **The seats and where each person sits
   stay on the People register**, which is the client's, not any module's.

4. **A Landing line per module, chosen from a short list, never typed.**
   Each module names the sentences it can say about itself; the client picks
   one; the landing draws it under the module's name. Insights' three are
   drawn; Strategy's are the cycle's states.

## 3 · What the code says today

Read, not remembered; these are the facts the shape rests on.

- **The Setup rail is one list with a group key per page** —
  `SETUP_GROUPS` and the `grp` field on every def in
  `SMP-Project-Folder/src/shell.html`. Five groups: `cycle`, `who`, `run`,
  `meas`, `look`. There is no notion of which module a page belongs to.
- **`setup` is a spine segment** — `SPINE_SEGMENTS = ["setup", "tour"]` in
  `smp-app/lib/modules.ts`, and `shell/route.js` writes `/<client>/setup/<page>`
  with no module in it. So the spine address already exists; what it carries
  is the wrong rail.
- **A module declares its own areas** — `MODULE_DEF[k].areas` in
  `lib/modules.ts` (spec 046 §4.2, spec 053 §4.5). Insights declares
  `a_insights` with two states, `none` and `view`. Strategy declares none,
  because its areas ARE the frozen matrix's in `lib/rules.js`, the only place
  they may live (the carried `rules.cjs` is asserted identical to it, §335).
  **Nothing reads a module's areas but `checks/modules.mjs`**; no page sets a
  grant on them, so every role holds the default and Insights opens for
  everybody (spec 053 §7.2).
- **The access matrix has two areas that are not one module's**: `a_setup`
  (*Units, Companies, Functions, People, Labels, Bands, Capabilities, this
  page*) and `a_cycle`. Spec 046 §4.4 already decided both move — `a_setup`
  splits into client setup and module setup, `a_cycle` becomes Strategy's —
  and neither has moved.
- **The landing is the Next app's own page** — `smp-app/lib/landing.ts`
  builds it from the frozen readers: a greeting, *Waiting on you* (each row
  a door), *Your pages*, the intro-round card, and Continue. It carries no
  settings and lists no modules. The module switcher lives in the top bar
  (§320.6) and is drawn only for a client with more than one.
- **The module seam is deliberately narrow** — `modules/registry.ts` hands a
  module the request, the slug, the tenant id, the client's name, its modules,
  the address inside the module, and since §355 the viewer's person key and
  seat. No pool, no session, no registry row. A module has no door of its own
  to WRITE a client setting through.
- **The console's client card already reads one line per module** —
  `moduleRows()` in `lib/modules.ts`: *cycle open*, *N new*. That line is
  computed on the server from facts; nobody chooses it.

## 4 · The shape

### 4.1 The client landing gains a Client setup block

On `/<client>`, right column, under the heading **Client setup**, drawn for
the Super user only and for nobody else (§61: not a disabled block, absent).
Six doors, each opening an existing page at its spine address
`/<client>/setup/<page>`:

| Door | Opens | Today's page |
|---|---|---|
| People | the register | `people` |
| Access | seats, and where each person sits | the People register's seat and place columns — see §4.4 |
| Organisation | companies, units, functions, Official BU list | `companies`, `units`, `fns`, `mainbu` |
| Branding | colours and the mark | `brand` |
| Email | sender name, reply-to, footer | the email half of `brand` (§130.4) |
| Knowledge base | the platform's own explanations | `kb` |

> **Built 2026-09-15 (§356.3), with one drift reported rather than silently
> realigned:** the email settings are not "the email half of `brand`" — since
> §135/§137 they are the third section of Strategy's *Send an email* page —
> so the Email door opens `setup/send#comms`, the one door in the block that
> lands in Strategy's rail. Whether they should move to Branding is Islam's.

**The pages are the existing pages, moved and not rewritten.** What changes
is the rail they sit in: opened from the landing they sit in a rail holding
the Client group alone, under the heading *Client · Setup*, with a way back
to the landing. The spine address they already have carries no module, which
is exactly right for them.

**Organisation is one door onto four pages** because four doors for the shape
of the business would make the block longer than the *Waiting on you* list it
sits beside, and the four are one errand (§32's door behind a door applies
the other way: four things that are one job go behind one door).

The left column gains **Your modules** — one row per module the client has,
in `MODULES`' order, each carrying its landing line (§4.5) and opening the
module. A client with one module still sees the row: the line is worth
having with one module, and a list that appears at two would be a screen
that changes shape on the day a module is added.

### 4.2 Each module has its own Setup, reached from inside it

The gear opens `/<client>/<module>/setup/…` — the module's own Setup, wearing
the module's name in the rail head (*Strategy · Setup*, *Insights · Setup*).
The `setup` segment stops being spine-only for these pages: it is the spine's
when it follows the client alone and the module's when it follows a module.

**Strategy's Setup** keeps four groups: Running the cycle (Reporting cycle,
Platform Inbox, Send an email, History, Import & storage, Contingency,
Figures I report), Measurement (Scoring bands, Figure sets, Focus measures,
Terminology), **Access** (Roles & access) and **The landing** (Landing line).
The Overview page goes with the Client entries it mostly counted — see §7.

**Insights' Setup** is two groups: Access and The landing. That is its honest
size: reports are published from the Forefront console, so there is nothing
else for the client to set. A module's Setup is as long as what it has to
set, never padded to look like Strategy's.

**A module switched off takes its Setup with it** (spec 046 §4.5's one rule
that survives): no address, no gear entry, no row on the landing.

### 4.3 What decides which group a page is in

Today `grp` on a def names one of five groups. It names **a module and a
group** now, with the Client group's pages carrying no module. One list, in
the shell where the defs already live, read by the rail, the gear, the
keyword search (§108.13) and the route. A page cannot be in two modules or
none, by construction.

### 4.4 Access, per module

- **Strategy's Roles & access** is the matrix as it stands, under Strategy's
  Setup. Nothing in `lib/rules.js` moves for this; the page moves rail.
- **The seats** (Super user, SMO team) and **where each person sits** are
  already set on the People register (§33, §186). The landing's *Access* door
  opens the register scrolled to that; no second surface is built, because
  two surfaces onto one fact is §110's pair.
- **Insights' Roles & access** is `MODULE_DEF.insights.areas` drawn as a
  table: the client's roles down, one column across, `none` or `view` in
  each cell, defaulting to `view`. It is the first thing that READS a module's
  declared areas other than a check, which is what that declaration was
  written for (spec 053 §4.5).
- **`a_setup` splits as spec 046 §4.4 decided**: the client's settings are the
  Super user's by seat, never a matrix cell; a module's Setup is a grant in
  the module's own table. **`a_cycle` moves into Strategy's table** in name
  only — it is already only ever Strategy's.

> **Built 2026-09-15 (§356.5)** as decided, with two things said out loud:
> the eye is drawn on every row `matrixRows()` draws, the Super user's and
> the SMO team's included, so a client's own Super user who shut their own row
> is judged by the table while an office login holding the seat is not (the
> seat opens everything, spec 046 §4.10) — whether the office's rows should be
> read-only by rule there is a decision not taken here; and `a_setup` and
> `a_cycle` are not renamed or moved in `lib/rules.js` — nothing there moves
> for this, as the first bullet says, and the split is expressed by which
> RAIL the pages sit on.

### 4.5 The landing line

Each module **declares the sentences it can say about itself**, beside its
label and its areas in `MODULE_DEF` — a key, a label for the Setup page, and
a reader that produces the line from facts the module already has. The
client picks one key per module on that module's *Landing line* page, from a
radio list with the sentence previewed underneath (as drawn). **Never free
text**: a typed line goes stale the day the fact behind it changes, and the
whole reason for the line is that it is true today.

- **Insights**: *New reports this month* (`2 new reports this month`), *The
  latest report, by name* (`Latest: Egypt retail outlook, Q3`), *Nothing*.
- **Strategy**: *The cycle's state* (`Cycle open · reports due 30 Sep`),
  *What is waiting* (`3 of 10 units still to submit`), *Nothing*.
- Every module ships with a default so an unchosen module still says
  something; *Nothing* draws the module's row with no line under it.

> **Built 2026-09-15 (§356.4)** as decided, with one narrowing said out loud:
> the "units" in *What is waiting* counts every SUBJECT the cycle board has a
> row for — functions and a capability included — so the sentence says
> *3 of 18 still to submit* with no noun, because *units* would be untrue of
> the functions it counts.

**The console's card row and the landing's line are the same reader.**
`moduleRows()` computes a line per module today for the Forefront card; a
module's declared readers replace its hand-written cases, so the card and the
landing cannot say two things about one module (§53.5).

### 4.6 The gear

The gear opens the Setup of the module you are standing in. On the landing
there is no module, so there the gear is not drawn — the Client setup block
is that page's own way in, and a control that opens what is already on the
screen is a duplicate (§94.15).

## 5 · Costs, stated rather than discovered

- **Setting a client up means visiting more than one page.** The wizard
  (spec 044) already walks the client-wide half in one flow, which is what
  makes this cost bearable; a module's own Setup is short by construction.
- **The Overview loses its subject.** It counted what was waiting across
  the register (passwords, declarations) and the cycle (submissions) and the
  inbox. Those now sit on two sides of the line. See §7.
- **Two rails to keep in step**, drawn by one list (§4.3), asserted by the
  checks in §6.
- **Six checks and a sweep move.** `setup-pages.py`, `setup-rail.py`,
  `setup-header.py`, `setup-search.py`, `access-header.py`, `welcome.py`
  and `qa.py`'s Setup walk each address the rail by the shape it has today;
  every one is rewritten to the new shape, never loosened (§218), and each
  is red on the build before.

## 6 · What must be proved

Each at both ends (§94.2), each falsified from the sources (§276):

1. **The landing's block is the Super user's**: drawn for the seat, absent
   for the SMO team and for a client's own head; every door opens the page
   it names at a spine address with no module in it.
2. **A module's Setup holds exactly its own pages**, asserted as agreement
   with the def list rather than a typed list of labels, on Strategy AND on
   Insights; and no page appears in two rails or none.
3. **A module switched off has no Setup address**, answered exactly as any
   other unknown word (§320.5).
4. **Insights' access page writes a grant the module's server reads** —
   `none` shuts the module for that role by its own address as well as its
   row, `view` opens it, and Strategy's matrix is byte-identical before and
   after.
5. **The landing line is chosen, stored as an absence when default (§50.6),
   drawn on the landing AND on the console card from one reader**, and a
   module set to *Nothing* draws its row with no line.
6. **The gear**: opens the module's own Setup from inside a module; not drawn
   on the landing.
7. **Every existing Setup page still writes what it wrote** — driven through
   its new address, the stored graph read back (§96).

## 7 · Deliberately not decided here

- ~~Where the landing-line pick is stored, and which door writes it.~~
  **SETTLED 2026-09-15, Islam: "ok" to the recommendation.** The pick rides
  `org.extra` under a key per module — no migration, an absence when default
  (§50.6) — and **the spine writes it**: the module declares its list of
  choices in `MODULE_DEF`, the Landing line page is the spine's, and the
  module only ever READS the pick through the seam, which therefore does not
  grow beyond §355's two facts.
- **What becomes of the Overview** — drawn 2026-09-15 at Islam's *"ok show
  me"*: `design-mockups/module-setup/2026-09-15_overview-fate.html`. The
  drawing rests on a measurement: both halves of the Overview are ALREADY on
  the landing — the office's *Waiting on you* is `attentionRows()` row for
  row (§148) and the cycle column joined it at §200 — so the proposal is to
  DELETE the Overview, land Strategy's gear on Reporting cycle, and let the
  rail's pills follow their pages to the two rails. Awaiting sign-off.
- **Terminology.** Spec 046 §4.1 says *business unit*, *function* and
  *company* are the client's words and *pillar*, *aspiration*, *tactic* are
  Strategy's, so the page would split. The drawing keeps all of it in
  Strategy and Islam took the drawing; the split is left as §4.1's, for the
  day a second module needs the client's words.
- **The Platform Inbox.** Spec 046 §4.1 calls it the spine's; the drawing
  keeps it in Strategy's Setup, because Strategy is the only module with an
  office desk today. Recorded as a tension, not resolved.
- **Portfolio's and Processes' Setup.** Neither is built; each declares its
  own pages when it lands. The contract is §4.2 and §4.3.

## 8 · Files this will touch

- `SMP-Project-Folder/src/shell.html` — `SETUP_GROUPS`, the `grp` field on
  every def (gains the module), the rail builder, the gear.
- `smp-app/lib/modules.ts` — `SPINE_SEGMENTS`, `whereOf()`, `MODULE_DEF`
  (gains `lines`), `moduleRows()` reading them.
- `smp-app/shell/route.js` — `setup` under a module as well as on the spine.
- `smp-app/lib/landing.ts`, `app/(platform)/…` — the Client setup block and
  Your modules.
- `smp-app/modules/registry.ts` — only if §7's first item grows the seam.
- `smp-app/modules/insights/` — its Setup: Access and Landing line.
- `lib/rules.js` — `a_setup`'s note, and `a_cycle`'s home; nothing else,
  or the carried copy goes red (§335).
- Checks: the six named in §5, `checks/modules.mjs`, and a new
  `checks/setup-per-module.py`.

## 9 · The order of the work

1. A mockup of the Overview's fate (§7), signed off, before any rail moves —
   it is the one screen this spec cannot draw without a decision.
2. The list: `grp` gains a module; the rail draws by it; the spine and the
   module addresses both resolve. Strategy's Setup is byte-identical to the
   pixel except for the Client entries leaving it. Checks rewritten and red
   first.
3. The landing's Client setup block and Your modules, on the Next app.
4. The landing line: declared, chosen, stored, drawn in both places.
5. Insights' Setup: Access and Landing line, the first page to read a
   module's declared areas.
6. §356 in the decisions log, in the same commit as step 2.
