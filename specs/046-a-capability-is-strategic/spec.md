# 046 · A capability is a strategic entry, and a function's projects are its own

**Version:** v3.22 · **Decisions:** §322 · **Renumbered:** built as spec 045 · §319–§321 and moved at the merge — `main` had taken both while this was in flight (§287, §301, §310, §318 and main’s own §319.1 all set the precedent: a gap is harmless where a collision is not). The heal keeps its `045-` registry name, because that name is a key and not a label (§30.2, §65). · **Status:** model agreed with Islam; **stage 1 BUILT** (§322), **the demo finished** (§329, his *"finish the demo data yes"*) and **stage 2 BUILT** (§330, his four answers on the mockup and *"shall we proceed?"*). Every question in §10 is answered below.

Islam, 2026-09-12, correcting a proposal of mine that would have hidden the
problem rather than fixed it:

> *"capability is something Strategic and the capability is either planned in
> the form of a pillar or in the form of an overview and projects like what
> we're doing today and the functional plans might be in the form of projects
> that they work on as functions and in the form of objectives and actions that
> we discussed earlier so the problem with having the capability hidden in the
> functional plans is confusing for the whole structure aligned with me what
> you're understanding to fix this once and for old"*

And his four answers to the alignment, which are the decisions this spec rests
on:

1. **Who holds a capability** — *"a supporting function for today but we can
   open it to the business units as well to include future cases."*
2. **Both at once** — *"yes they can."*
3. **What Raya has today** — *"they caapbilities in raya trade are not
   capabilities they are just projecst under functions."*
4. **A capability planned as a pillar** — *"that's corrent a capaibility
   planned as a pillar."*

§318 §4 already holds his earlier sentence on the same subject and it agrees:
*"capabilities are on the strategic navigation and held by function heads and
it's planed in pillars, functional objectives are held by function heads and
lands in the navigation in the functions navigation."* That section recorded it
and deliberately did not build it. **This is the round that builds it.**

---

## 1 · The fault, in one sentence

The only container the platform owns for a supporting function's projects is
called a **capability** — so every function that plans in projects appears to
hold a strategic capability whether it holds one or not, and a real capability
has nowhere of its own to live.

## 2 · What the platform does today (measured, 2026-09-12, demo tenant)

Three rules, and every one of them is the fault:

1. **The form is asked of the FUNCTION**, not of the thing being planned:
   `format` is `"pillars"` or `"projects"`, and a function is one or the other.
2. **If it plans in projects, every project must sit inside a capability.**
   There is no such thing as a project that simply belongs to the function.
3. **A capability can only belong to a supporting function.** Every read goes
   through `capsOfFunction(fk)`, so a capability naming no function is drawn
   nowhere at all — not on a unit, not at the group.

What that produces on screen:

| Measured | |
|---|---|
| Functions that plan in projects | **7** |
| …carrying exactly **one** capability | **6** (only Marketing carries two) |
| Pages drawing the navy `CAPABILITY` band | **4** — Overview, Projects, Performance, Reporting |
| Times the Overview says it | **2** — the band, then a row reading *Capability: Financial Infrastructure* directly above *Carried by: Finance* |
| Project codes that mention it | **0** — they already read `FIN01`, `FIN02`, `FIN03`, the function's own letters (§310) |

So the projects are already the **function's** everywhere the arithmetic
touches them. The box is a layer of vocabulary sitting on top.

**And two pieces of the answer already exist**, which is what makes this
tractable rather than a rewrite:

- **A pillar can already say it is a capability.** §320 shipped `kind` with the
  values *Direction* and *Capability*, drawn and settable, on a unit's pillar
  and on a pillars function's. That is Islam's first form, live today.
- **A function already holds everything a container holds.** §213 gave a
  supporting function its own `def` and `koHolderById("fn:<key>")` already
  resolves to the function's own `keyObjectives`. So a dissolved box has a home
  for its definition and its objectives without inventing a field.

## 3 · The model

**Two questions, asked separately, where the platform today asks one and
answers the other by force.**

### What is this thing?

- **A capability.** Strategic — the group decides it is worth building. It is
  **its own entry on the strategic side of the navigation switch**, beside the
  business units, with its own pages. **Held by a supporting function head**
  today; the model admits a business unit holding one, for the future cases
  Islam names.
- **A subject's own plan.** The ordinary work of a business unit or a
  supporting function, on that subject's own page.

### How is it planned?

| | pillars | overview + projects | objectives & actions |
|---|---|---|---|
| **A capability** | yes (§320's `kind`, live) | yes (today's shape) | — |
| **A business unit's own plan** | yes (today) | — | — |
| **A supporting function's own plan** | yes (today) | **yes — new** | later (§318 §5) |

**The form belongs to the thing, not to the subject.** A capability carries its
own form exactly as a function carries one today.

### The two live together without either page doing two jobs

Islam: *"yes they can."* A function head may hold a capability **and** their
function's own plan — and they never collide, because §318's navigation switch
already separates them: the capability is an entry on the **strategic** side,
the function's own plan is on the **functions** side. One person, two entries,
two pages. This is why no page needs a mode and no score needs combining.

## 4 · What changes on the screen

**A supporting function that plans in projects**

- Its projects belong to the function. **No band, on any of the four pages.**
- Its Overview reads **Function · Led by · Definition** with its Key
  Objectives beside them — which is *byte for byte what a pillars function's
  Overview already draws* (§213, measured on Merchandising). The two formats
  converge one step further rather than diverging (§53.5).
- The rail leads with **Projects N**; the codes are unchanged.

**A capability**

- An entry on the strategic side of the navigation switch, beside the business
  units, reached like a unit.
- Its own name, its own definition, its own key objectives, its own form
  (pillars, or overview + projects), its own score.
- **The band comes back where it means something** — inside a capability that
  plans in overview + projects and carries several sets of work — and is gone
  everywhere it never did.

## 5 · What happens to what is already there

Islam, answer 3: Raya's capabilities are not capabilities. So **every existing
capability dissolves**, and no tenant carries one until somebody creates one
deliberately:

| The box holds | Where it goes |
|---|---|
| Projects | the function's own projects, **ids and codes untouched** (§232, §316 — a renumber re-addresses every deliverable, outcome, milestone and figure) |
| Definition | the function's `def`, where the function has none; otherwise kept in the archive |
| Key objectives | the function's own `keyObjectives`, where the function has none; otherwise kept in the archive |
| Its **name** | the archive alone. A container's name has nowhere honest to go, and inventing one is the confusion this round removes. |

**Archive first, always** (§49.2, §232's rule with a fourth caller), so the way
back is Setup › Import & storage, exactly as it is for a removed pillar or
project.

**Proved against a real database, never claimed** (§172, §321's own lesson):
`projects.cap_id` is `NOT NULL … ON DELETE CASCADE`, so a dissolve that does
not land loses the projects while the save reports success.

**The demo.** Its eight are the same containers wearing invented names, so they
dissolve too — and then **one real capability is created** as a strategic
entry, or the feature renders nothing and reads as one that was never built
(§45.2). Proposed, for Islam — **and answered: *"finish the demo data yes."***

**DONE, §329:** the eight dissolve at boot through `SMPRules.dissolvePlan`
itself, so the ids are byte-identical to a healed tenant's and the rule is not
written a third time. Until that landed, stage 1 was live and INVISIBLE:
Finance's Projects page went on drawing a `CAPABILITY` band over `FIN01`,
`FIN02`, `FIN03` on the shipped build. **The one real capability waits for
stage 2**, which is where it has a home — so the product holds none today,
which is §8's *"the truth of his tenant"*.

**AND THE DATA ANSWERED §10.4 ON THE WAY.** Marketing is the only function
carrying two, so the first box's definition becomes Marketing's and the
second's has nowhere to go — *"Treat what we sell as a portfolio to be shaped,
not a catalogue to be carried."* That is a strategic sentence about shaping a
portfolio rather than a description of a function's ordinary work, and it is
the demo's own: **Product Mindset, held by Marketing, is the recommendation
for the one real capability**, planned in overview + projects (the form its
one project is already in).

## 6 · Turning one into the other

Islam, 2026-09-12: *"one more thing is the ability to turn functional projects
to a capability and vice versa."*

Which is the decision that makes the model hold over time rather than only on
the day a client is set up. A function starts three projects; a year later two
of them turn out to be one strategic thing. Nothing about that should cost a
re-upload.

### Giving the projects back — and it is stage 1's migration, not a second one

**This already exists.** §321's Remove dialog offers *Keep the projects* and
picks a destination from the capability's siblings. Once a function can own
projects, **the function itself is one more destination in that list** — and it
is then the destination that is always there, so the held state disappears:

> The dialog Islam photographed on 11 September reads *"There is nowhere for
> them to go — this is the only capability Finance has, so its projects already
> belong to the function."* That sentence was true only while a function's
> projects had to live in a box. After stage 1 it is false, the button is live,
> and the case it was written for cannot occur.

**And stage 1's migration goes through that same control** (§53.5), rather than
being a one-off written beside it. Two answers to *what does dissolving a box
mean* is exactly how the two drift the first time either is corrected — and it
means the migration is proved by driving the product's own dialog, which is a
better proof than a script that agrees with itself.

### Making projects a capability

New, and stage 2, because it needs somewhere to promote **into**:

- On a function's Projects page, **pick the projects** — not all of them, or a
  function whose five projects contain one capability cannot say so.
- **Name it.** The capability is a strategic entry from that moment: its own
  place beside the business units, its own definition and key objectives,
  written on it afterwards.
- It is created in the **overview + projects** form. Projects cannot promote
  into a capability planned as pillars, because a pillar is not a project —
  said here rather than discovered at the control.

### What travels, and what does not

| | Goes | Stays |
|---|---|---|
| The projects picked | with their **ids**, their deliverables, outcomes, milestones and every reported figure | |
| The function's definition | | the function's — it describes the function |
| The function's key objectives | | the function's. The capability starts with none and they are written on it |
| The reporting tally | it moves: the capability becomes a subject that reports | |

**The ids never change** (§232, §316), which is what keeps every figure, focus
mark and cycle snapshot pointing at the row it was entered against.

**The CODES do change, and that is right rather than a cost to hide.** A
project's code is its position in the thing that holds it (§310), so `FIN02`
becomes the capability's own code the moment it stops being Finance's second
project. It is a derived label, not a stored identifier — nothing keys on it —
but it is on every screen, in the deck and in the workbook, so **the control
says so before the press**, the way §321's dialog names its cost.

### The edges

- **Promoting nothing** is refused — a capability with no projects and no
  pillars has nothing to be.
- **Demoting everything** empties the capability, which is §321's Remove: one
  act, not two, and the same dialog.
- **Both directions archive first** (§49.2, §232 — a fifth caller), so the way
  back is Setup › Import & storage.
- **The office's**, both ways: creating a strategic entry and destroying one
  are the same kind of act as authoring a plan (§94).

## 7 · What is NOT in this round, and why

- **Objectives and actions**, the third form. §318 §5 holds its whole model —
  objective, action with a due date, requirement drawn at both ends, moving
  nobody's score — and it is a form of its own, not a variation of this one.
- **A business unit holding a capability.** The model admits it from day one so
  nothing has to be re-shaped later; the Setup control that does it waits for a
  client that needs it (§61 — a control with nothing behind it).
- **Renaming anything.** The word *capability* stays the word; what changes is
  where it is true.

## 8 · Staging

Islam has **no real capabilities today**, so the two halves are not equally
urgent and they do not depend on each other:

**Stage 1 — a function's projects are its own.** *BUILT, §322.* The dissolve,
the band gone, the Overview converged, the migration **through §321's own
dialog** (§6), the workbook and the deck following. No schema change and no
SQL migration: a function's plan already rides in `functions.extra` (§118,
§213), proved on a real Postgres rather than claimed (§172).
This is the whole of what is confusing him now, and it leaves the product with
no capabilities at all — which is the truth of his tenant.

**Stage 2 — a capability is a strategic entry.** Its place in the navigation,
its pages, its two forms, who may author it, how it is created, and
**making projects a capability** (§6).

Each is its own decisions section, its own checks, its own merge.

## 9 · What the checks must assert

- The dissolve read back **off the stored graph and out of Postgres**, never
  off the screen (§96): the projects present, their **ids and codes identical**,
  their reported figures intact, and **none of it in another function**.
- **Both ends** (§94.2): a function's pages with no band, and a capability's
  with one — or a build that deleted the band outright passes every absence.
- The archive written **once**, by the dissolve itself, and restorable.
- A pillars function's Overview and a projects function's asserted to
  **agree**, never as two literals (§53.5, §94.8).
- **The other end of the cascade** (§321's own proof): a dissolve that fails to
  move the projects must go red, not green — the database deletes them and the
  save reports success.
- The workbook a **fixed point** (§22, §294): downloaded, uploaded untouched,
  nothing changed.
- **The round trip between the two** (§6): projects made a capability and given
  back, with every **id** asserted identical at the end and every figure still
  against the row it was entered on — and the **codes** asserted to have moved
  and moved back, or a build that silently kept the function's numbering passes
  the half that matters least.

## 10 · Settled before Stage 2 was written — Islam's four answers (§330)

Four were put to him on the stage-2 mockup and answered in one message
(**"yes for all"** to 1–3 as the mockup numbered them, the demo *"do what you
want"*, and **"ok with the promirting mockup"**). What each now says:

1. **ANSWERED — the office authors, a function head HOLDS.** Creating,
   renaming and removing a capability is the office's (§94's strategy pages);
   the function that holds it is where its access comes from, named once in the
   shared rules as `capHolderTarget()` and asked by `roleOwns` and
   `companyAllows`. No new column on Roles & access, and nobody's rights move.
2. **ANSWERED — Setup › Capabilities is the home, and the function's Projects
   page is the second door.** One act, two ways in (§53.5) — the promote panel
   there names the new codes before the press. The plan builder and the client
   wizard are deliberately NOT third doors.
3. **ANSWERED — yes, its own row on the cycle board.** That is what makes it a
   subject rather than a label (§244), and it is why §330 had to teach
   `reportPending` and the Submit button: the board asked for a report while
   the tab above it said nothing.
4. **ANSWERED — *Product Mindset*, held by Marketing, in overview + projects**,
   the recommendation §329 derived from the data. Islam: *"for the demo do what
   you want"*; Raya's Marketing plans in pillars and holds none, so the
   recommendation was only ever about the worked example. **The cost is stated
   in §330**: the demo therefore shows a capability in ONE of its two forms.
5. **ANSWERED — taken.** *"ok with the promirting mockup"*, which is the panel
   that names the new codes. A code says where a project lives, so it moving is
   the code telling the truth rather than a cost to hide.

**AND HIS OWN TENANT NEEDS NOTHING** — *"for my still mines are all done"*.

## 11 · What the whole-suite sweep found afterwards (§330.16–.18)

Stage 2 was accepted on its own checks; running all 167 afterwards found
**six more product faults, and every one is the same sentence** — *walk the
capabilities* — written before stage 1 moved a supporting function's projects
onto the function. Recorded here because it is the spec's own risk showing
itself: **stage 1 changed where a project lives and stage 2 changed what a
capability IS, and both left copies of the old question behind.**

The four in the product: `capItemById()` (a supporting function's whole
Reporting page wrote nothing — drawn, pressed, discarded), `capsOfFn()` in the
shared rules (§147.8's Contributor floor dead for every function since stage
1), `ctxOfFn()` in the authoriser (the project owner refused every figure with
their role plainly derived), and `eachHolder()`'s own membership test. Beside
them: a capability's Submit was held by nothing at all (§221 inert on the
destination stage 2 created), and the plan builder minted a capability box that
stayed empty and left a brand-new function's own Projects page with nowhere to
put a first project (§61).

**What this says about the next stage**: the walk is now in `eachProject`,
`eachHolder`, `fnHolders`, `holderById`, `holderItemById`, `holdersOfFn` and
`capsShown` — seven named answers, each with exactly one job. A change to what
a holder IS should be a change to those and nothing else. **Grep for
`GROUP.capabilities` and `w.capabilities` before calling any such stage done**;
that is what would have found all six in an afternoon.

### Left for Islam, deliberately (both stated in the decisions log)

- **Should the builder offer to make a capability?** It no longer mints one
  silently, and the guided build does not ask. Whether it should belongs with
  **Objectives & actions** rather than inside a repair.
- **Should being named on a CAPABILITY's project grant at the capability
  rather than at the function?** `capsOfFn()` was WIDENED rather than
  narrowed, on purpose: narrowing takes a role away from somebody who holds it
  today. Since a capability is a destination now the case can be made — and it
  means teaching `roleWheres`, the areas and the register's own vocabulary a
  `cap:` place.
