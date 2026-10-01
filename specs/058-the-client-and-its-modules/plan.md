# 056 · Plan

**Written 2026-09-16 against the spec and the signed-off drawing.** Nothing
built. Six stages, each of which ships on its own and is proved on its own —
so the thing Islam reported is fixed first and the rest follows without a
stop-the-world change.

---

## The seam, measured

Read before planning, so the stages name real work rather than a shape.

- **`/<client>/setup` is served by `lib/shell.ts`** as the frozen shell
  document, from `smp-app/app/(platform)/[slug]/[...rest]/route.ts`. The
  module stamped on it is `w.module || DEFAULT_MODULE`, and a bare
  `/<client>/setup` carries no module word — **which is exactly why the
  client's own settings arrive wearing Strategy's**.
- **The chrome is the frozen body** (`shell/body.html`): `<header class="top">`
  — house, org name, `clientback`, *Viewing as*, theme — and `<nav class="units">`,
  filled by `paintUnits()` with the Group dropdown, the Units | Functions
  switch and the row of destinations. `paint()` draws it on every page.
- **The document already knows it is the client's.** `data-setup-scope="client"`
  is written by `shell/route.js` and read by `setupScope()` (spec 056). The
  rail already filters on it; nothing else does.
- **The way back already exists.** `#clientback` is the control that returns
  to the console, drawn only where there is a door to go back to. It is *Save
  & close*'s body, not a new button.
- **Setup already has no tab row** — `paint()` hides `#tabrow` and `#secrow`
  for `current === "setup"`. So the only thing to stand down is the
  destination row and the two controls beside it.
- **A def already carries its module** (`mod`, spec 056). Seven say `client`.
  Moving a page between rails is one field.
- **The team list already exists**, inside the set-up flow
  (`src/client-setup.js`, `setTeam` on `/api/platform`).
- **`change_log` has no module column** and does have `kind`. Which module a
  change belongs to is derived from that (spec §8).

**What this measurement buys:** stage 1 is a scope test on a chrome that
already knows the answer, not a new document.

---

## Stage 1 · The client's settings wear the client's bar

**Ships the reported fault.** On a client-scoped Setup document the chrome
draws the client's mark, its name and *Save & close*, and does **not** draw
the destination row, the Group dropdown, the Units | Functions switch or the
module switcher.

- Read the scope where the chrome is drawn, never in each control (§53.5) —
  one answer, so a control added later is covered the day it is added.
- `#clientback` becomes *Save & close* on this document and keeps its
  behaviour: it already returns to the console and is already hidden where
  there is no console to return to.
- **The frozen shell is edited, so the generated copies are regenerated**
  (`build-shell.mjs`, `sync-css.mjs`) and `generated-in-step` must be clear
  (§329). The built file changes, so `sw.js`'s `SHELL` is bumped at merge,
  confirmed against `origin/main` immediately before the push (§91, §94.16).

**Proved by:** the client's Setup drawing none of the five, **and a module's
page still drawing all of them** — both ends, or a build that deleted the
navigation everywhere passes half (§94.2). Falsified from the sources by
restoring the scope-blind chrome.

---

## Stage 2 · Forefront team, and the register that reads from it

- **A new client-scoped def** under *Who*, above the register, drawing the
  team the set-up flow draws today. One renderer, moved rather than copied
  (§53.5); the flow keeps its step by calling it.
- **The register reads consultants from that list**: read-only, marked, no
  unit, no Official BU, no Emp ID, **no password control** — the server
  already refuses to issue one to a seat holder (§89), and a row must not
  offer what the save will turn down.
- **A seat holder cannot be given a client role from the register** —
  enforced in the rule both sides ask, never only by not drawing the picker
  (§42).
- **The count says both**: the client's own people, and how many are ours.
- **The search still finds them** from the register's own box.

**Named in the plan because it is the trap:** the underlying register row
**stays**. It is a consultant's standing on a client — how the platform knows
they hold the seat, how a plan can name them, how the state API places them —
and removing it is the defect fixed at §338/§316.9. This stage changes the
TABLE.

**Also re-read here:** §313.32's email-match adoption, the one path by which a
human is both a consultant and a client person.

**Proved by:** both ends again — a consultant present and read-only, a client
person still fully editable; the count agreeing with the two lists rather than
a typed number (§94.8); and the register's search finding a consultant.

**§364 — the page, after Islam used it.** *"forefront team is damaged it needs
to be a table looks like the people register wiht the required columns."*
Stage 2 gave the page the flow's own renderer whole, and the flow's own
DRESS with it: the rows were wrapped in the class the step chips wear — a pill
— and were a flex row written for a 760px step column, so on a full-width Setup
page they wanted 2471px in a 1323px box. **A shape built for one room, used in
another.** The page draws the setup tables' own `.cfg > table.unitcfg` now —
Name · Email · Seat on this client · On this register as · Remove — with the
add row and the note under it. **One renderer, two hosts still holds** and is
what this stage was right about: the table is built in `officeStep`, the flow's
step and the page are two readers of it, and the host dresses its own note. The
register column is drawn only on a client whose register came across, where the
match is by address and has to be confirmed (§313.32); on one the platform
built there is nothing to pick. `checks/team-page.py`, 31 assertions, red six
ways from the sources.

---

## Stage 3 · Access — the rows are the client's, the columns are the module's

- The client's seven pages answer to the **seat**, not to `a_setup`.
- `a_setup` narrows to meaning *this module's own settings*, on each module's
  own table.
- **A module may declare rows its own work derives** — project owner, pillar
  owner, contributor stay Strategy's.

**The hard rule, asserted rather than promised:** *nobody's access changes on
the day this ships.* The check walks **every person in the demo tenant against
every page** and requires the set of what they can open to be equal before and
after. It is written and run **first**, against the unchanged build, so the
baseline is measured rather than assumed (§303).

**Proved by:** that equality, plus both ends of the new gate — a seat holder
opens the client's settings, and somebody with `a_setup` at edit and no seat
does not.

---

## Stage 4 · Terminology — one page, two doors

- The page becomes **client-scoped**, and **Strategy's rail keeps an entry
  that opens the same page** — one store, two doors, never a copy that syncs.
- **A module declares its own words**, the way it already declares its areas
  and its landing lines (spec 056 §4.4, §4.5). The page shows the client's own
  words always, and a module's only where the client has that module.

**Proved by:** a word set from one door reading from the other; a client
without Strategy never being asked for a Pillar's word — and a client WITH
Strategy still being asked, or an empty list passes it (§113.8).

---

## Stage 5 · The tools stay with the module; the email identity comes up

- **Platform Inbox** and **Send an email** stay Strategy's — already true by
  their `mod`, so this stage is the split inside the second one.
- **The outgoing identity** — the from-address, the display name, the reply-to
  and the footer — becomes a **client** page (drawn as *Outgoing email*; the
  name is a proposal). The tool that sends stays with the module.
- **Nothing stored moves**: those settings already ride the group's own row.

**Proved by:** the identity set from the client's page reaching a message sent
from Strategy, end to end through the real builder — the one assertion that
fails if the two halves have been separated wrongly.

---

## Stage 6 · History — one record, a door per scope

- **The client's settings** carries History: everything, with tabs — the
  client itself, then one per module the person may open (`openableModules`).
- **Each module's settings** shows its own slice, drawn by its own rail, and
  you stay in the module. **Never a link out to the client's page**, which
  belongs to the two seats and would open onto a refusal for anybody else
  (§61).
- **Which module a change belongs to is DERIVED from `kind`**, never stored
  beside it: a second field saying the same thing is two answers to one
  question, and it would leave every row already written with nothing in it.
  An unrecognised kind lands on the **client** tab — the safe end, since that
  page is the office's and shows everything.
- **The module's page says where the rest is**: a door for a seat holder, a
  plain sentence for everybody else (§61, §124).

**Proved by:** the tabs asserted as an AGREEMENT with the log rather than a
typed list (§94.8); an unknown kind landing on the client tab; and a module's
history asserted NOT to contain another module's rows.

---

## What is deliberately not in this plan

- **Taking the spine out of the frozen shell.** Its own piece (§10,
  `specs/046-modules/repo-boundary.md`), worth doing when a module needs
  navigation of its own.
- **A client-side administrator.** §4 is the decision to revisit if that is
  ever wanted; today the client's settings are the two seats'.
- **A client-level home screen.** `/<client>` stays a door into the first
  module somebody may open (spec 057).
- **Moving the register row of a consultant.** Named in stage 2 as the thing
  that must not be done here.
- **Strategy's *Running the cycle* group** being tools in a settings rail
  (spec §7) — recorded, not this round.

## Risks, named

1. **The chrome is shared by every screen in the product.** Stage 1's scope
   test must be one answer read once, or a control added later is drawn on a
   page it does not belong to. Mitigated by both-ends assertions on a module
   page in the same run.
2. **Stage 3 moves the thing that decides who sees what.** Mitigated by the
   equality assertion, written and measured on the unchanged build first.
3. **Stage 2 touches the office's own standing.** Mitigated by changing the
   table and not the row, and by re-reading §313.32 before it is built.
4. **Six stages across two stacks.** Every stage that edits a frozen source
   regenerates the served copies and runs `generated-in-step` (§329), and the
   full sweep runs at the end of each.
