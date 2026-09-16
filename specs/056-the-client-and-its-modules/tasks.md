# 056 · Tasks

Dependency-ordered. Each stage ships and is proved on its own; **T0 runs
before any source moves**, because it is the baseline the whole of stage 3
rests on (§303).

Every task that edits a frozen source ends by regenerating the served copies
and running `generated-in-step` (§329). Every check is proved able to fail
from the SOURCES before its green run is believed (§276, §94.5).

---

## T0 · The baseline, before anything moves

- [x] **T0.1** `scripts/test-access-unmoved.js` — NOT a browser check, which
      is the one correction the building made: `grantAtPage` is the one
      function the screen and the server both ask (§42), so the whole access
      surface is a pure sweep of it and a walk of the pages drawn today would
      have measured the rails rather than the access. **No browser and no
      database**; the world is built from `db/seed-state.json` with the
      product's own `worldOf` (§100.3). 33 people × 35 page keys × 21 targets,
      every target in the tenant because the same page answers differently for
      a unit somebody owns and one they do not (§37).
- [x] **T0.2** Taken from `origin/main` and kept as
      `access-baseline.json` beside this file, carrying the commit it came
      from — a baseline with no provenance is a number somebody has to take on
      trust (§303). **8842 grants that are not `none`.**
- [x] **T0.3** And the answer to *"bring any access that was removed"* is a
      measurement rather than a reading: **UNMOVED** — every one of the 33
      opens exactly what they opened on `main`, at every target, across all 34
      shared page keys; the only difference is `c_landing` ADDED, whose 693
      cells (33 × 21) are the whole of 8842 → 9535. Proved able to fail twice:
      a page moved to another area **635 red**, the Roles & access page deleted
      **22 red**, the first of them naming the key GONE.

## Stage 1 · The client's settings wear the client's bar

- [x] **T1.1** One reader for the scope, asked where the chrome is drawn, never
      per control. — `clientScoped()`, two halves, both load-bearing.
- [x] **T1.2** On a client-scoped document: no destination row, no Group
      dropdown, no Units | Functions, no module switcher. — and the viewer
      strip with them; the switcher stands ITSELF down, being built at load
      (§359.2), off a scope the SERVER stamps.
- [x] **T1.3** The header carries the client's mark, its name and **Save &
      close** — `#clientback` reworded and kept, not a new control.
- [x] **T1.4** Regenerate `public/`; `generated-in-step` clear.
- [x] **T1.5** The chrome is proved. **NOT a Python check** — the whole
      surface is served-only, and `checks/shell.mjs` already stands up the
      built app, a database and a browser with `fresh`/`signIn`/`open` and a
      break switch; a second harness for one section would be a second copy
      of all of it (§53.5). It is section **3b** there: 20 assertions, both
      ends every time, proved able to fail **six ways** — 5 from the SOURCES
      (4 / 2 / 2 / 1 / 2 red) and `--break=no-setup-scope` (3 red, the third
      being the switcher drawn where there is nothing to switch to).
- [x] **T1.6** Full `qa.py` at Next and over `file://`; `setup-per-module`,
      `client-setup`, `client-setup-outside`, `welcome`, `door-landing`,
      `shell`, `modules`.
- [x] **T1.7** (§359.1, from Islam using it) **The way across runs both
      ways.** §357.9 gave a module's rail a row to the client's and left the
      reverse unbuilt, so arriving by the card's *Settings* chip left somebody
      on a rail with no Roles & access on it and no door to the rail that has
      it (§61). One row per module at the foot of the client's rail, read off
      `data-modules` — which stops carrying the switcher's rule in its name
      and becomes the LIST, the "a menu of one is a door behind a door" test
      (§32) moving into `shell/route.js`, the reader it belongs to.

## Stage 2 · Forefront team, and the register that reads from it

- [ ] **T2.1** Re-read §313.32's email-match adoption and write down what it
      means under this rule **before** building.
- [ ] **T2.2** New client-scoped def *Forefront team* under *Who*, above the
      register, drawing the team renderer **moved** out of the set-up flow;
      the flow's step calls it rather than keeping a copy.
- [ ] **T2.3** The register reads consultants from that list: read-only,
      marked, no unit / Official BU / Emp ID, no password control.
- [ ] **T2.4** The rule refuses a client role on a seat holder, both sides.
- [ ] **T2.5** The two-part count, derived from the two lists.
- [ ] **T2.6** The register's search still finds a consultant.
- [ ] **T2.7** `checks/forefront-team.py`: both ends (a consultant read-only
      **and** a client person still editable), the count as an agreement
      (§94.8), the search, and the refusal driven rather than read. Red from
      the sources.
- [ ] **T2.8** `test-authorize.js`: the refusal asserted server-side, red both
      ways.

## Stage 3 · Access — rows the client's, columns the module's

- [ ] **T3.1** The client's seven answer to the seat; they leave the matrix.
- [ ] **T3.2** `a_setup` narrows to *this module's own settings*, per module.
- [ ] **T3.3** Strategy keeps its derived rows (project owner, pillar owner,
      contributor) and no other module gains them.
- [ ] **T3.4** **Run T0.1 again and require equality.** Any difference is a
      finding, not a tolerance.
- [ ] **T3.5** Both ends of the new gate: a seat holder opens the client's
      settings; somebody with `a_setup` at edit and no seat does not.
- [ ] **T3.6** `test-authorize.js` red both ways on the new gate.

## Stage 4 · Terminology — one page, two doors

- [ ] **T4.1** The page becomes client-scoped; Strategy's rail keeps an entry
      onto the **same page**, never a copy.
- [ ] **T4.2** A module declares its own words, the way it already declares
      areas and landing lines; the client's own words always show.
- [ ] **T4.3** `checks/terminology-doors.py`: set from one door, read from the
      other; a client without Strategy is not asked for a Pillar's word **and
      one with Strategy is** (§113.8). Red from the sources.
- [ ] **T4.4** The workbook and every `L()` reader asserted unchanged
      (§346.3's routing rules still hold).

## Stage 5 · Tools stay, identity comes up

- [ ] **T5.1** *Outgoing email* as a client-scoped page — from-address,
      display name, reply-to, footer. The name is a proposal; confirm it.
- [ ] **T5.2** The Platform Inbox and Send an email stay Strategy's; only the
      identity section moves.
- [ ] **T5.3** Nothing stored moves — asserted on a real Postgres, not claimed
      (§172).
- [ ] **T5.4** End to end: the identity set on the client's page reaching a
      message sent from Strategy, through the real builder.

## Stage 6 · History — one record, a door per scope

- [ ] **T6.1** Derive the module from `kind`; an unrecognised kind lands on the
      **client** tab.
- [ ] **T6.2** Client-scoped History: everything, with tabs — the client, then
      one per module the person may open.
- [ ] **T6.3** Each module's own rail draws its own slice; **no link out** to
      the client's page.
- [ ] **T6.4** The module's page says where the rest is: a door for a seat
      holder, a sentence for everybody else.
- [ ] **T6.5** `checks/history-scopes.py`: the tabs as an agreement with the
      log (§94.8); a module's history asserted **not** to hold another
      module's rows; an unknown kind on the client tab. Red from the sources.
- [ ] **T6.6** `test-history-read.js` extended for the scoping, on a real
      Postgres.

## Close

- [ ] **C1** Full sweep: `qa.py` at Next and `file://`; the frozen suite; the
      app's checks; `tsc` cold; `built-in-step`; `generated-in-step`.
- [ ] **C2** Decisions log §359 written with the work (rule A7), and
      `IMPLEMENTATION_PROGRESS.md` in the same commit.
- [ ] **C3** `sw.js` `SHELL` bumped and confirmed against `origin/main`
      immediately before the push (§91, §94.16).
- [ ] **C4** The what-to-check list for Islam, one line per screen (A16).
      **The merge is his word, on that merge.**
