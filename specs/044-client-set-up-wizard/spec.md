# 044 · Setting a client up, and a function that plans in objectives

**Version:** v4.90 · **Decisions:** §318, §321, §322 · **Status:** answered; built; revised twice by Islam and merged

> **REVISION 2 (2026-09-11) — WHAT THIS SPEC NO LONGER DESCRIBES.** Two of
> Islam's corrections landed after the first build and neither is a detail:
>
> **The horizon left set-up** (§321) — *"why is the horizon is in the setup?
> time is not relevant in the setup. the plan we upload will need this not the
> setup."* So a plan's horizon arrives with the plan; §5's step list below
> still names it and is stale on that one point.
>
> **Set-up happens on the OUTSIDE** (§322) — *"the setup should happen on the
> external creatoin not inside … the wizard should start on the outside window
> so the people after the setup can get intop the platform ready."* The flow
> is Forefront's own page, reached from a client's card, and it REPLACED the
> client settings page rather than sitting beside it. Wherever this spec says
> Setup's first entry, read Forefront's platform page.
>
> **And a client is born empty** (§322): it used to be minted from §67's
> *cleared* graph, which keeps the unit and function NAMES and empties their
> content — right for a deployment that is already this client's, wrong for
> one that has never existed, so every new client arrived wearing Raya Trade's
> units.
>
> Recorded as revisions rather than rewritten into the body, so what was
> signed off first is still readable beside what replaced it (Principle II).

Islam: *"any Consultant who gets into the platform and adds a new client to set
up this client he needs to go through a series of questions … is the company a
multi business company or a single business company … will it include the
functions … are they planning projects or planning in pillars or would be
showing functional objectives and tactics … what are the names that are used in
this company … there needs to be a buildup of some sort of wizard that builds
with the Consultant showing him some sort of visuals so he can see what this
means and what this looks like."*

And, mid-round, the sentence that decided the wizard's shape: *"the wizard
should be dynamic in a way that accepts a build up of these different setups,
allocation, naming type of plans for each."*

Drawn first (`design-mockups/onboarding-wizard/2026-09-07_set-up-a-client.html`,
published as an artifact, rule 1c).

---

## 1 · What is asked

1. A **wizard** that sets a client up from nothing: the organisation, its units,
   its capabilities, its supporting functions, its words, and its office.
2. It **builds up** rather than interrogates. Units, capabilities and functions
   are lists the consultant adds to, and **every thing added carries its own
   owner and its own plan type** — so one client runs several plan types at once.
3. Every choice is **shown, not described**: a small drawing per option, and a
   diagram of the client's shape that grows as it is answered.
4. A **third plan type** — objectives, actions, requirements — because Elabd's
   functions plan that way and the platform has no shape for it. **Drawn dull
   in the wizard and NOT built here** — see §2.
5. It ends on a **summary with two doors**: start the plans, or bring the people in.
6. **Nothing it writes is final.** Every answer lands on a Setup page that
   already exists and stays editable there (Islam: *"6. yes"*).

## 2 · What is NOT in scope, and why

Islam, 2026-09-07: *"don't build things that doesn't exist now in the platform.
we are focused on the building the wizard and then i will take it to another
discussion to build what's missing."* And, on how they should read meanwhile:
*"keep the mockup as is but kepe the non existing parts dull for now."*

So **the wizard offers only what the platform can already do**, and the three
shapes below are drawn in the wizard, dulled, inert and each saying *Later* —
visible so the whole intent reads, offering nothing that would open an empty
page (§61). Their decisions are recorded here so the separate discussion starts
from them rather than from scratch.

- **Multi-tenancy.** Islam, 2026-09-07: *"this is a fix I will do in the tenant
  management platform let's just build the wizard and the flow."* This
  **reverses** the earlier decision in this same round to build the thin
  plumbing first (schema per client, the client picker, a Super user pinned to
  one client). Recorded as a reversal, not overwritten: §36's assessment stands
  unchanged and unbuilt, and the wizard deliberately does not depend on it —
  the client's name is `GROUP.org`, which is already data, so the wizard shapes
  a deployment from empty with nothing new underneath it.
- **A function that plans in objectives, actions and requirements** (§5 below).
  Two of Islam's answers about it are already taken and are recorded, not acted
  on: such a function shows **two headline numbers side by side** — objectives
  and actions, allowed to disagree, on §64's reasoning — and a requirement is
  **raised on the raiser's own page**, appearing on the owing function's page as
  owed. Neither is built here.
- **A capability as its own strategic entry** beside the units, owned by a
  function head (§4 below). Today a capability exists only underneath a function
  that plans in projects, and the wizard sets exactly that.
- **The single-business shape.** `shape = SINGLE_COMPANY | GROUP` is in §4 of
  the model document and has never been built. Neither Raya nor Elabd is
  single-business, so it is **left out of round one** at Islam's direction — a
  question whose answer nothing acts on is a control that does nothing (§61).
  The wizard is a march of steps; adding the step later is cheap.

## 3 · The shape

**The march, eight steps, each openable from the rail at any time**

| | Step | Writes |
|---|---|---|
| 1 | The client | `GROUP.org`, and the address it is served at |
| 2 | The year | `GROUP.horizon` |
| 3 | Business units | `UNITS` + `UNIT_KEYS`, through `addBusinessUnit` |
| 4 | Companies | `COMPANIES` + `units.company` (§23) |
| 5 | Capabilities | a strategic entry beside the units, owned by a function head |
| 6 | Supporting functions | `FUNCTIONS` + each one's plan type |
| 7 | The words | `LABELS.entries`, **generated from steps 3–6** |
| 8 | The office | the office's seat on the register (§33, §89) |

**Every row minted through the platform's own minter** — `addBusinessUnit`,
`addFunction`, `addCompany` — never a second one (§53.5). The wizard is a
guided way through Setup, not a second store: there is no draft, nothing is
kept beside the answers, and progress is **derived from the data** exactly as
the plan builder's chips are (§129).

**The shape diagram** is drawn from that same data — the chips cannot fall out
of step with the answers, because there is no second copy of them — and uses
the product's own navigation switch (Strategic | Functions) so it reads as the
thing being built rather than as a generic org chart.

**The words step is generated.** It asks only for the words this client's shape
actually uses: a client with no capabilities is never asked what it calls one;
a client whose functions plan in objectives is asked for its word for
*objective*, *action* and *requirement*. Free text, no presets — Islam: *"this
needs to be dynamic as each client has it's own naming."*

**The summary** lists every answer with a way back to the step that set it, and
ends on two doors: **Start the plans** (the plan builder, §129) and **Bring the
people in** (the register).

## 4 · A capability, as Elabd has it

Islam: *"capabilities are on the strategic navigation and held by function
heads and it's planed in pillars, functional objectives are held by function
heads and lands in the navigation in the functions navigation."*

So a capability is **its own entry beside the business units** on the strategic
side of the navigation switch, with its own page, planning in pillars, and
**owned by a function head**. A function head therefore appears in two places
— their capability on the strategic side, their function's own plan on the
functions side — and the two are different things.

**This is why the third plan type is exclusive rather than a tick-list.** The
first cut proposed a function holding both; his correction removes the need,
because the navigation switch already separates them and no page has to do two
jobs.

Nearest existing machinery: `pillarCarrier` / `p.by` already lets a pillar be
carried by a function head (§253.2 cut the demo's example; the feature is live).

## 5 · A function that plans in objectives

Islam: *"each function has objectives like the measures we have and actions
like tactics they work on that has due dates. and finally they have
requirements from other functions and departments."*

**Not built in this round** — recorded so the separate discussion has the
model. `format` would gain a third value beside `pillars` and `projects`:

- **Objective** — the measure row the platform already has: direction, unit,
  target, compile rule, actual, scored by `measureScore` (§239, §276). Nothing
  new; a pillars function already holds function-level objectives.
- **Action** — a tactic, except its time is a **due date** rather than Q1–Q4
  flags. The date control exists: a month and a year, picked and never typed
  (§177). Answered in the product's own three words — *Not started · In
  progress with a %· Done* (§300, §104.10) — with the partial prorated against
  the due date.
- **Requirement** — raised on **another function or department**, and this is
  the one genuinely new object: nothing in the product today is drawn at both
  ends. It appears on the raiser's page as something they are waiting for, and
  on the owing function's page as something owed, with a due date and an owner,
  and the owing side can mark it done. **It moves nobody's score** (Islam's
  choice of three) — which is what keeps it small: no dispute rule, no
  arithmetic, no second definition of what a function is judged on.

## 6 · Still to settle, for the round that builds the missing shapes

1. **Whether a requirement is a counted gap** (§249) and whether it holds
   Submit (§221). Recommendation: neither, matching its not-scored decision.
2. **The workbook.** A plan is authored by upload (§22), so the three new row
   kinds need sheets and a round trip, or a download-and-re-upload drops them.
3. **What happens to a function already holding a plan** if its type is
   changed to objectives — the switch is already refused while the other side
   holds content (§59), and a third value needs the same guard.

*(Answered and recorded above: the two headline numbers, and where a
requirement is raised from.)*

## 7 · What the check must assert

- Every step's answer read back **off the stored graph**, never off the screen
  (§96) — a wizard wired to nothing renders perfectly.
- The words step generated from the shape: asserted **at both ends** — the rows
  a client's mix produces, and the rows it does not (§94.2).
- The shape diagram asserted as **agreement** with the data, never as a count
  (§94.8).
- A function set to each plan type the platform HAS drawing that type's pages,
  and the other's absent.
- Every dulled control asserted **inert** — present, saying *Later*, and
  changing nothing when pressed (§61, §94.15): a mockup's dulling is a drawing,
  a product's has to be enforced.
- Nothing new stored outside what Setup already holds — no draft, no progress
  flag (§25, §47.1).

## 8 · What the merge with `main`'s rebuild changed (§318.7)

Built against the frozen single file; `main` moved 583 commits underneath it
(the Next.js rebuild on a shared schema, spec 043). Merged 2026-09-11 on
Islam's word. Nothing about the wizard's behaviour moved. Three things about
its surroundings did, and one is an open question for him:

1. **It crosses to the new stack whole.** `build-shell.mjs` reads `build.py`'s
   own script list, so `wizard.js` needed nothing; `sync-css.mjs` keeps its
   stylesheet order by hand, so `wizard.css` had to be added there or the
   wizard would serve with its behaviour and none of its design.
2. **Renumbered** §303 → §318 and spec 042 → spec 044, `main` having taken
   both. Scoped to the lines this branch wrote (§264.3).
3. **OPEN, for Islam — and pressing, because the cutover has run** (measured:
   production serves the generated worker and answers 404 for the frozen file,
   so *Add a client* is the only way a client arrives now). A client created
   through Forefront's *Add a client*
   starts from §67's cleared graph, which **keeps Raya's unit and function
   names** and empties their content — so `wizTenantBare()` is false, the
   Overview's *Set this client up* door does not draw for it, and the wizard's
   units step offers somebody else's names to rename rather than an empty list
   to build. The wizard itself is still the first entry in Setup, so nothing is
   unreachable. Two decisions sit here: whether a new client should start with
   no units at all (§54's rule applied to the names), and whether the door
   should ask a looser question than *bare*.
