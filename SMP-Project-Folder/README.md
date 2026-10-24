# SMP Project Folder — v3.15

Everything needed to pick this project up cold. Read in this order.

---

## Read first

**`CLAUDE-RULES.md`** — how Islam and Claude work together. Read before doing
anything. The first rule is the important one: **align before building** — a
question returned is not an answer, and nothing is built until the answer is
given. *(A1 was "mock before building" until 2026-08-20; that rule belonged to
the prototype era and was retired when Islam said so. The approval it protected
did not go with it.)*

**`DECISIONS-AND-LOGIC-v3.22.md`** — every decision with its reasoning,
including reversals recorded as reversals. Three sections matter most:

- **§11** — model questions still open
- **§16** — the backlog: agreed, and marked BUILT as each lands
- **§17** — version history

**`specs/`** (repo root) — spec-kit feature specifications, one folder per
feature, adopted in 1.9. The decisions document stays authoritative; a spec
records how one feature was cut against it.

*Swept 2026-09-05.* Two folders both numbered 029 (save-safety-banners became
**030**), three specs titled with a number other than their folder's, and four
that still said they were unbuilt long after they shipped — all corrected.
**031–037** are backfills rather than features, each covering behaviour built
across a dozen or more decision sections with no single place saying what the
model IS — which is what the constitution's backfill provision is for:

| | |
|---|---|
| **031** | How a figure is scored |
| **032** | How a save reaches the database |
| **033** | Reaching somebody who is not looking (notifications, the corner) |
| **034** | The review deck |
| **035** | Gaps, filling, and where Submit is held |
| **036** | Setup: the register, the matrix and the cycle |
| **037** | Authoring a plan on the screen |
| **038** | The escaping sweep, and the net behind it |
| **039** | Reporting is a tab |
| **040** | A supporting function's report |

Coverage went from **122 of 279** decision sections named in a spec to
**217 of 286 (76%)**, and **every feature-sized decision up to §288 now has
one**. §289, §292 and §294 arrived from other sessions after the sweep and are
named in `IMPLEMENTATION_PROGRESS.md`. The 67 left are
fixes and refinements — the original handoff (§10–§20), the UI audit waves
(§149–§157), the knowledge base (§164–§167), the welcome and boot follow-ups
(§200–§209) — where the decisions document is the right home and a spec would be
filing for its own sake.

---

## The platform

**`strategy-management-platform-v3.22.html`** — the built prototype. One file,
opens in a browser, no server needed — **and, served on Vercel, it reads and
writes its whole state through `/api/state` against Neon Postgres** (§18 of
the decisions document). Opened from disk it runs on its baked-in demo data,
exactly as every version before it.

**`src/`** — the sources it is built from, and the tooling:

- `theme.js` is inlined by `build.py` into the **head**, not the body — the
  stored theme has to be applied before the page paints or it flips.
- `python3 build.py` assembles the single file. It must rebuild **byte-identical**
  to the shipped HTML; if it does not, something is out of step.
- `python3 qa.py` walks every viewer against every page they can reach and
  reports crashes. Run it after every change.
- `sync.js` is the persistence module — hydrate from the database, save on
  change, silently local on file://.
- `searchsel.js` (v3.15) makes **every** `<select>` past five options
  searchable. It hides the native select **in place** rather than replacing it,
  so every existing handler keeps working — read the header comment before
  touching it.
- `new-units.js` is **not built into anything.** It is a leftover from when
  four of the units were being drafted; they really live in `group-data.js`.
  Do not edit it expecting the platform to change (§45.9).

The database layer itself lives at the **repo root** (`db/`, `api/`, `lib/`,
`scripts/`): schema, seed generated from these sources
(`node scripts/extract-state.js`), the endpoint, the round-trip test and a
local dev server.

**Edit the sources, never the built file.**

---

## Mockups

Design work, in `mockups/`. Everything here was drawn before building, and some
of it was rejected — which is the point of keeping it.

### Settled and built

| File | What it settled |
|---|---|
| `concept-focus.html` | Focus measures — the mark, the reward rule, the standings |
| `concept-cycle.html` | The reporting cycle — open, report, chase, close |
| `mock-present.html` | Presentation mode — 16:9, the slide order, the notes column |
| `mock-navA.html` | The Units / Functions fold, **with the width measurements** |
| `mock-setuphead.html` | One header for both configuration tables |
| `mock-icons2.html` | Edit and clear icons, compared at real size |
| `mock-capcard.html` | The capability card, and the Cards/Table toggle. **Built in 1.9** |
| `2026-08-21_design-language-strategy-formulation_SETTLED.html` | The Strategy-Formulation language on SMP's own screens. **Built in 3.11** (&sect;38) |
| `2026-08-21_accent-budget_SETTLED.html` | Four rail treatments, three navigation, two pips, in both palettes. Settled **B / C / A** (&sect;41) |
| `2026-08-21_fold-accent_SETTLED.html` | Five treatments for the OPEN navigation fold, both palettes. Settled **D**, accent words with no fill (&sect;41.4) |
| `2026-08-21_closed-fold_SETTLED.html` | Four treatments for the CLOSED navigation fold. Settled **D**, a soft ghost — quiet fill, no border, the row's own type (&sect;41.7) |
| `2026-08-21_fold-six_SETTLED.html` | Six treatments, closed AND open, redrawn without the phantom `.foldhere`. Settled **4**, one shared segmented container (&sect;41.8) |
| `2026-08-23_login-client-logo.html` | The tenant's mark on the gate. Not a drawing of the gate &mdash; **the gate itself**, with the mark in it, which is why it is byte-for-byte `index.html`. **Built** (&sect;52) |
| `../../design-mockups/pillar-category-breakdown/2026-09-11_targets-breakdown-by-category.html` | A pillar's targets broken down by category, on the plan pane and on performance. Built out of the REAL pane's markup and stylesheets. Islam's decisions drawn in: shape A, it SCORES and Submit waits for it, equal weight across categories, the mix column an indicator that is never scored, and the "scores into the pillar" totals row removed at his word. **Approved, not built** (&sect;324.8) |
| `../../design-mockups/function-plan-types/2026-09-11_three-ways-a-function-plans.html` | The three ways a supporting function plans &mdash; Pillars &middot; Projects &middot; Objectives &amp; actions &mdash; drawn side by side out of the real pages, with the capability box removed from the projects shape. Names confirmed; the owner column stays. **Approved; the Direction/Capability mark built as &sect;324, the other two recorded and not built** |
| `../../design-mockups/capability-remove/2026-09-11_two-answers.html` | Removing a capability, with today's browser dialog beside two treatments of the platform's own: the two answers as one row of buttons, and as two rows each saying what it does &mdash; plus the state where figures have already been reported and the one where it is the function's only capability. **Islam picked B; built as &sect;325** |
| `../../design-mockups/performance-actions/2026-08-25_report-button-and-row.html` | Report and Presentation leave the band legend for a row of their own, and Report goes solid orange. Today beside the proposal, both themes, with the fill and ink measured for all four palettes. **Built in 3.25** (&sect;93.8) |
| `../../design-mockups/loading-skeleton/2026-08-25_skeleton-on-boot.html` | What the platform shows between opening and the database answering. Today's boot beside the proposal, both themes. **Built in 3.25** (&sect;94.10) |
| `../../design-mockups/full-width/2026-08-25_page-fills-the-window.html` | The 1180px content cap comes off every page. Not a drawing &mdash; screenshots of the REAL platform at 1670px with the cap on and off, four pages, with the widths measured. **Built in 3.25** (&sect;94.13) |
| `../../design-mockups/functions-table/2026-08-25_functions-table-rework.html` | The Functions table takes the register's shape &mdash; a row menu, a column chooser, one line per row. Today beside the proposal. **Built in 3.25** (&sect;94.11) |
| `../../design-mockups/client-door/2026-09-08_client-door.html` | Every client gets a door of its own: Raya's sign-in at its own address wearing Raya's mark on the card, with Forefront's root door beside it unchanged. Built from the real door's stylesheet. **Approved and built** (&sect;313.36) |
| `../../design-mockups/send-a-message/2026-08-25_send-a-message-rework.html` | The composer stays one screen: the audience becomes a bounded summary, the send bar is pinned and carries the count, drafts and sent move into the header, and a copy can be sent to yourself first. Today beside the proposal. **Built in 3.25** (&sect;95) |
| `../../design-mockups/foundation-edit/2026-08-25_objectives-table-width.html` | The Foundation's objectives table leaves the aspiration card for a full-width band while the pen is open. Real screenshots at 1600px, today beside the proposal, both themes, with the width measured (696px &rarr; 1493px) and the cost stated in its own panel. **Built in 3.25** (&sect;96.6) |
| `../../design-mockups/access-strategy-reporting-split/2026-08-26_matrix-split-and-plan-download.html` | The own access columns split into Strategy &#124; Reporting halves, and a download-the-plan-as-slides (.pptx) button beside the pen. Screenshots of the REAL platform with the proposal injected into the live table and pane. **Built in 3.40** (&sect;117, spec 019); its five follow-ups built in 3.42 (&sect;119) |
| `../../design-mockups/gap-fill/2026-08-27_gap-fill-states.html` | Fill the gaps: the Roles &amp; access Strategy cell's third state, fill mode's three gap states (Missing / pending with the office's confirm tick / confirmed), the dash with its “not counted yet” line, and the Submit refusal. Published as an artifact and approved whole. **Built in 3.55** (&sect;145, spec 023) |
| `../../design-mockups/gap-fill/2026-08-27_gap-visibility.html` | Finding the gaps, first drawing: counts on the tab and the rail, the fill-mode chip band, the Next-gap walker. **Superseded the same day** &mdash; Islam asked for red wording, a red worded button by the arrange arrows, and no number on the tab (r2 below). Built shape is r2's. |
| `../../design-mockups/gap-fill/2026-08-27_gap-visibility-r2.html` | Finding the gaps, revision 2 as corrected: the WHOLE missing bar &mdash; "N Missing", one red chip per owing place, the solid red *Fill in missing elements* button &mdash; in the section row beside the tabs, nothing in the page body, red italic rail words, the empty-hand note that points away. **Built in 3.55** (&sect;145.14) |
| `../../design-mockups/plan-builder/2026-08-26_build-a-plan-flow.html` | Building a plan on the platform: the door beside Import, the subject chooser, the builder band as a MAP of section chips, the structured row forms, and the review. Revision 2 &mdash; Islam's two corrections (any order; rows added whole) are drawn in. **Built in 3.47** (&sect;129, spec 020) |
| `../../design-mockups/setup-refinements/2026-08-27_setup-header-line.html` | Every Setup page's search, filters and buttons share the pinned line with its name; the `SMO` pill, the count chips and the briefing paragraph go; Send a message becomes Send an email with the Email settings folded in. Not a drawing &mdash; the real platform driven in a browser with the proposal injected into the live page, plus two options for the company field. **Built in 3.48** (&sect;135) |
| `../../design-mockups/setup-refinements/2026-08-27_marking-and-the-matrix.html` | Focus measures as a switch on the header line, a navigation-style destination row and one table headed like the register; and the diagnosed repair for the Roles &amp; access header, which was pinning 141px down inside its own scroll box. Before and after on the same build. **Built in 3.48** (&sect;135.2, &sect;135.5) |
| `../../design-mockups/office-chat/2026-08-25_talking-to-the-office.html` | The corner, the conversation it opens, and the Setup page the office answers from. Both themes, with the five decisions and their costs stated under each screen. **Built in 3.26** (&sect;97, spec 015) |
| `../../design-mockups/office-chat/2026-08-25_chat-settings.html` | The chat's on/off switch and its four settings, in a dropdown on the Messages page header, and what "off" actually does. Both themes. **Built in 3.27** (&sect;98) |
| `../../design-mockups/office-chat/2026-08-25_what-was-built.html` | Not a proposal &mdash; the outcome report for &sect;97, with screenshots of the running product, the decisions and their costs, and what the three suites assert. |
| `../../design-mockups/project-tables/2026-08-25_deliverables-outcomes-split.html` | A project's deliverables and outcomes stay in one table and split into two halves, each declaring its own columns; `Finish` becomes `Due date`. Today beside the proposal, all three panes, drawn with the platform's own stylesheet and the real FIN01 plan. **Built in 3.25** (&sect;99) |
| `../../design-mockups/people-register-role-picker/2026-08-26_where-half-own-line.html` | Giving somebody a role: the picker's second half goes, the Unit cell answers where, and a pick that cannot land says so. Not a drawing &mdash; the real platform driven to the register, with the proposal prototyped on the live page, plus the row that jumped to the top when opened. **Built in 3.34** (&sect;110) |
| `../../design-mockups/people-register-modal/2026-08-26_register-dialog-and-queue.html` | The register stops being a form: a one-line header, a dialog that edits and adds, and an attention queue that opens the rows it counts. Islam's six decisions drawn on the real platform, with the dialog built from the register's own controls. **Built in 3.39** (&sect;116) |
| `../../design-mockups/people-register-width/2026-08-26_register-width-and-attention.html` | Why four complaints on the register were one cause &mdash; a 1417px table in a 1005px window &mdash; with each candidate measured rather than argued. Superseded by the dialog above, and kept because its measurements are what decided it. **Answered in 3.39** (&sect;116) |
| `../../design-mockups/people-register/2026-08-26_compact-header-and-dialog.html` | One line above the table and a dialog that fits the window. The header's four asks with the pixel cost of each, and the dialog's 482px of content shown to be waste rather than density &mdash; an empty cell and a repeating paragraph. Both costs stated before they were agreed. **Built in 3.44** (&sect;122) |
| `../../design-mockups/welcome-screen/2026-08-28_welcome-final.html` | The welcome screen after sign-in: the greeting leads, the tenant signs on the separator's edge, and every count lives inside its own sentence. Final of three rounds &mdash; the two earlier files in the same folder are the band variations (round 2) and the numbers variations (round 3), each with Islam's pick recorded. **Built in 3.58** (&sect;148, spec 025) |
| `../../design-mockups/pillar-project-remove/2026-09-01_remove-controls.html` | Removing a whole pillar or project: the worded quiet-red control in the pinned editing head beside Done, and the confirmation naming what the thing holds, what has been reported this cycle, and the archive-first way back. Signed off by Islam 2026-09-01. **Built** (&sect;232) |
| `../../design-mockups/hide-from-presentation/2026-09-01_hide-element.html` | Hiding an element from the presentation: a per-row eye in the plan pen &mdash; the row kept, left out of the deck, and NOT counted in any score (Islam's decision); rows only, never a pillar, capability or project; the workbook carries the mark. Signed off by Islam 2026-09-01. **Built** (&sect;233) |
| `../../design-mockups/data-loss-warnings/2026-09-02_save-safety-banners.html` | The two save-safety cautions in the refusal's own slot: *a newer version is ready* (Reload) and *somebody else updated this page* (Reload &amp; keep mine / Dismiss). Islam: *"BOTH"*. **Built on the branch** (&sect;258) |
| `../../design-mockups/history/2026-09-03_history-page.html` | Setup › History: who changed what, where, from what to what, with Restore &mdash; drawn from real change-log rows produced through the real save path. Islam: *"ok agreed let's build"*, with his three questions (office-only, restore vs rollback, filtered read) answered first. **Built on the branch** (&sect;262, spec 028) |
| `../../design-mockups/empty-not-missing/2026-09-03_empty-not-missing.html` | Why Mobile and Care show *Fill in what is empty* with no count and no badges &mdash; the empty Collabs. column, which &sect;187 ruled is NOT missing. Three states shot out of the RUNNING platform with the state made (0 owed, 22 empty): today, the office with the bar gone, and a filler with a quiet count, a chip per pillar and a mark on each rail row. Islam picked *hide it from the office, guide the filler* from three options with the cost of each. Signed off 2026-09-03. **Built** (&sect;261) |
| `../../design-mockups/corner-reply-box/2026-09-05_corner-reply-box.html` | The office's corner: the box under the Waiting list writes to their own thread rather than to the person they are looking at &mdash; reproduced first, so all three of Islam's symptoms are shown as one cause. Today beside the proposal in BOTH palettes, plus the conversation-open state that does NOT change and already reads *"Reply to Hend&hellip;"*. Carries the notification test's second half: one line saying what a browser cannot see about the computer's own settings, drawn over a clean result only. Islam: *"build"*. **Built on the branch** (&sect;298) |
| `../../design-mockups/report-find-the-blocker/2026-09-04_reporting-find-the-blocker.html` | Why a report will not submit when *something needs a note* and nothing on the page says where. Four states shot out of the RUNNING platform with the state MADE (17 of 17 entered, the gate held by one note): today, and three options &mdash; the rail marking the pillar, &sect;272's missing bar in the banner's place, and that bar counting all four blockers with a walk. The capture and the composer are kept beside it. Islam: **C**. **Built** (&sect;279) |
| `../../design-mockups/yn-in-progress/2026-09-06_yn-in-progress.html` | A yes/no row gains an **In progress** answer with a per-cent, reported through &sect;104's own pair of boxes and prorated against the row's own window. Drawn in the platform's own CSS, both themes, with the costs stated in their own panel. Published as an artifact; corrected twice by Islam (the three words are the tactic's own, and the boxes are two, not one) and the target kept as `Y/N` after five alternatives were weighed. **Merged** (&sect;300, spec 041) |
| `../../design-mockups/consulting-memory/2026-09-11_consulting-memory.html` | **The consulting memory**: Forefront's own record of what worked, what went wrong and what was learned with a client. Six states in the platform page's own tokens and all three palette blocks &mdash; the empty state, the list with its filters, one entry read, the one-insight wizard, the **period debrief** (the prompt to take to a voice conversation, and the drafts it comes back as) and the assistant's box. Published as an artifact and revised once on Islam's correction that the debrief, not the one-at-a-time form, is the main door. **Built and merged** (&sect;319, spec 045) |
| `../../design-mockups/client-setup-outside/2026-09-11_set-up-on-the-outside.html` | **Setting a client up from Forefront's own page**, not from inside the client: eight steps down a rail with the shape being built beside them, in the platform page's own tokens. Islam: *"the setup should happen on the external creatoin not inside &hellip; the wizard should start on the outside window so the people after the setup can get intop the platform ready."* **Built** (&sect;322, spec 044 revision 2) |
| `../../design-mockups/archive-a-client/2026-09-12_archive-and-delete.html` | **Archiving a client, and only then deleting one**: six frames made of the platform page's own stylesheet verbatim &mdash; the ending block at the foot of Settings, both asks, the archived card and the band it sits in. Islam: *"we need an option to remove the client"*, then *"both, demo client is not removable, and the name is Archive not put aside."* The mockup is where the confirming button's 2.90:1 was caught (&sect;38.4). **Built** (&sect;323, spec 047) |
| `../../design-mockups/capability-ownership/2026-09-12_capability-owner-and-custodian.html` | **Who owns a capability**, drawn twice. The first version put an Owner and a Custodian on the capability's own row with two new columns on Setup &rsaquo; Capabilities; Islam withdrew it &mdash; *"the capability is normally owned by a function &hellip; the function owner and custodian can handle the capability"* &mdash; and the second draws what the platform ALREADY does, measured seat by seat rather than argued: the function's Head or Custodian reaches its capabilities through `capHolderTarget()`, and one Roles &amp; access cell opens both plans together. **Nothing built** (&sect;336) |
| `../../design-mockups/portfolio/2026-09-17_project-team.html` | **Portfolio: who is on a project** &mdash; the four roles of spec 060 &sect;6, the two-step sign-off's second half, and a Viewer with no control at all. **Approved (&sect;439's read-through); NOT built, and where it hangs is one of &sect;442's four open questions** &mdash; a fifth tab or a line on the charter, against a tab row already agreed as four |
| `../../design-mockups/portfolio/2026-09-17_project-team-picker.html` | The picker that names somebody onto a project, drawn beside the team screen: the client's own register, a name kept as typed for anybody outside it (&sect;96.2, &sect;130.7). **Approved; not built with the team screen** |
| `../../design-mockups/portfolio/2026-09-17_project-charter.html` | A project's charter &mdash; its name, its dates, its Manager row reading whoever is at Lead (&sect;6.4a, the one place two sentences of the spec pointed different ways and were reconciled rather than left). **Approved; BUILT** (&sect;439) |
| `../../design-mockups/portfolio/2026-09-17_roles-access-tab.html` | **A module's own Roles &amp; access tab** (spec 046 &sect;4.4), drawn for Portfolio. **Approved; NOT built** &mdash; who may open a module at all is still nobody's to set, which is said out loud rather than left as an absence (&sect;355) |
| `../../design-mockups/portfolio/2026-09-18_project-plan.html` | The delivery plan in **two views** &mdash; the tree and the chart &mdash; both reading ONE set of rows through `_rows.js` and `_derive.js`, which is &sect;5.2 carried out in the drawings themselves so two pictures of one project cannot disagree. **Approved; BUILT as a READ** (&sect;440); writing it is the drawing below |
| `../../design-mockups/portfolio/2026-09-18_project-progress.html` | What is owed, in four parts, and the place where work is accepted &mdash; two steps, so nobody closes their own (&sect;6.2). **Approved; BUILT** (&sect;441) |
| `../../design-mockups/portfolio/2026-09-19_analytics-brief.html` | The brief for Analytics: what the reading is, and the three things it corrects against the tool being replaced. **Approved; BUILT as &sect;441** |
| `../../design-mockups/portfolio/2026-09-20_project-analytics.html` | Analytics &mdash; how far each part is along, what is behind, and every commitment with the state it is actually in, every figure `rollUp`'s own rather than typed (&sect;94.8). **Approved; BUILT** (&sect;441) |
| `../../design-mockups/portfolio/2026-09-20_portfolio-landing.html` | The module's landing: the strip's counts, and a project with no plan reading **No plan yet** rather than 0% &mdash; the difference &sect;9.13 exists to draw. **Approved; BUILT** (&sect;439) |
| `../../design-mockups/portfolio/2026-09-30_plan-writing.html` | **Writing a plan** &mdash; the sixth screen, which is the writing half of two that already exist plus the two dialogs writing needs: the row strip, the add lines, the ticking list of what a moved date shifts, a refusal by name where a row holds work, and the panel's two audiences. Built from the served page's own 17,804-byte stylesheet, where rendering it found **eight faults and five class collisions** (&sect;65.9: a mockup drawn on a real page's stylesheet inherits its whole namespace). **APPROVED AND BUILT** &mdash; Islam, *"I wan to start planning"* (&sect;442 drew it, &sect;443 built it; spec 060 &sect;15 is left as it was written and &sect;16 records what shipped) |
| `../../design-mockups/role-picker-email/2026-10-12_email-needed.html` | The role picker asks for an email before adding somebody new: today, the star at rest, and the refusal after pressing Add with no address, in both themes. Not a drawing &mdash; the running platform with the proposal applied in the browser. Reverses the email half of &sect;87.3, which required neither box. **Approved and BUILT** (&sect;531) |
| `../../design-mockups/delete-for-good/2026-10-14_naming-what-goes.html` | The three acts with nothing behind them &mdash; a clip's bytes, a filed archive, a monthly plan's twelve numbers &mdash; drawn as the platform's own question: what goes, what STAYS, and no way back. **FORGET, not delete**, for an archive, on Islam's pick. **Approved and BUILT** (&sect;534) |
| `../../design-mockups/restore-a-person/2026-10-14_three-answers.html` | The one place a browser box carried a question with THREE answers, where Cancel meant *"yes, but differently"* and Escape silently chose a real change. One role per line with **Free** or **Taken** at the front. **Approved and BUILT** (&sect;534.1) |
| `../../design-mockups/refusal-in-place/2026-10-14_nine-notices.html` | Nine boxes that were not questions at all &mdash; each fired AFTER the platform had refused and changed nothing. Four shapes cover all nine, and three of the four were already in the product. **Approved and BUILT** (&sect;534.2) |
| `../../design-mockups/remove-a-line/2026-10-14_the-line-asks.html` | One sentence across six screens, hanging off a 24-pixel &times; beside a line somebody is mid-typing. Two treatments; A was recommended and **Islam chose B** &mdash; the line stays readable and the question opens under it, the cost (the list grows by a strip) known and accepted. **BUILT** (&sect;534.4) |
| `../../design-mockups/grey-with-a-reason/2026-10-15_before-and-after.html` | Four controls greyed the DEAD way while carrying an explanation nobody can reach, drawn before and after. The dashed struck-through box is the sentence as it exists today: written, and shown to nobody. Islam: *"proceed with all"*. **Approved and BUILT** (&sect;538) |
| `../../design-mockups/shortcuts-sheet/2026-10-18_what-the-keys-do.html` | The keys the platform already answers, written down for the first time &mdash; two treatments: everything with what works HERE marked, or only what works where you are standing. **Islam chose A**, because B never tells a reporter the deck has keys. Every line was read out of the file that binds it. **Approved and BUILT** (&sect;539) |
| `../../design-mockups/go-to-a-place/2026-10-18_alt-g.html` | Alt+G opens a searchable list of every place you can reach. Three states drawn, because the two that are not the happy path are where this control is usually wrong: just opened (on WHERE YOU ARE), after typing, and nothing matching &mdash; which says so in words and drops the keys that would now do nothing. **Approved and BUILT** (&sect;547) |
| `../../design-mockups/setup-one-screen/2026-10-18_the-shape-interactive.html` | The whole of a client's tree on one screen, pressable — the layers, the boxes, and the panel that opens beside whatever you press. Eight versions with Islam: layers numbered and created bottom-up by the kind that needs one, each bottom kind carrying its own layer above it, a “needs one” flag rather than a refusal, and the navigation **chosen on the row, not derived** (*“it needs to be chosen somehow not derived”*). Driven by 45 Playwright assertions kept beside it (`drive-the-mockup.py`). Islam: *“the shape is good, let's build stage 4”*. **Approved and BUILT** (§544, spec 066 stage 4) |
| `../../design-mockups/elabd-report-rail/2026-10-19_one-rail.html` | El Abd's company Reporting as the SMO: its five directions and five capabilities on one rail, under two labels, with one pane — in place of two stacked rail-and-pane blocks. Islam: *“heading directions and capabilities and remove key mesasures and tactics”*, *“directions first yes”*, *“build”*. **Approved and BUILT** (§556) |
| `../../design-mockups/reporting-phone/2026-10-19_reporting-on-a-phone.html` | Reporting on a phone, today and with the fix: screenshots of the running page at 390px with the CSS injected. The Reporting bar and the band wrap, the band stops pinning, the top bar takes two lines with both names whole; desktop pixel-identical. Islam: *“fix the phone overflow on reporting”*, then *“ok”*. **Approved and BUILT** (§559) |
| `../../design-mockups/elabd-breakdown-columns/2026-10-19_target-and-reported.html` | El Abd's categories table on Reporting as a target column and a *Reported* column, one pair per breakdown column, the way Key Measures reads — in place of the box with `/ 13%` stacked under it — and the unit back inside the box. Islam: *“needs to appear in the form of target and report not 1 column”*, then *“go ahead”*. **Approved and BUILT** (§557) |
| `../../design-mockups/deck-quiet-target/2026-10-21_quiet-target-and-categories.html` | El Abd's D001 slides and Performance page, as real screenshots today beside the proposal: the target after the slash on the key measures and tactics slides set smaller than the figure, and the categories table on the slide and on Performance as a target column and an *Actual* column per breakdown column, the actual in its band. Drawn first with a Progress column too; Islam: *“remove the progress just keep the target and actual and color code the actual”*, then *“mockup ok”*. **Approved and BUILT** (§568) |
| `../../design-mockups/tactic-status-slides/2026-10-21_status-and-columns.html` | El Abd's D003 tactics on Performance and the tactics slide, as real screenshots today beside the proposal: the status as the real word in its own colour with a red DELAYED under it when late, YTD actual as numbers, a Status column on the slide, and a Columns menu in the slide view that hides Owner and Collabs. on every tactics slide. Four versions: Delayed as a word, then red In progress, then the word keeping its colour (*“in progress to stay with it's color”*), then In progress yellow (*“the orange is close to the red”*); then *“yes build it”*. **Approved and BUILT** (§571) |
| `../../design-mockups/tactic-status-slides/2026-10-21_cleaner-tactics-slide.html` | Two options for D003's tactics slide on the real deck (A: a solid red DELAYED tag and the due figure beside the actual; B: the status in a pill, a red dot and DELAYED under it, the due figure under the actual), drawn again without the due figure where it was 100%. Islam: *“option B but keep the due even it's 100%”*. **Option B approved** (§572) |
| `../../design-mockups/tactic-status-slides/2026-10-21_option-b-everywhere.html` | Option B on the tactics and key measures slides and on Performance's two tables, today beside a build of it: bold names, regular outcome, the pill and red-dot Delayed, *due X* under the actual, a bigger Progress. Islam: *“yes build it”*. **Approved and BUILT** (§572) |
| `../../design-mockups/tactic-status-slides/2026-10-21_delayed-not-bold.html` | The Status column on the tactics slide and on Performance, DELAYED bold as built beside regular weight. Islam: *“not bold, apply it and put it live”*. **Approved and BUILT** (§572.1) |
| `../../design-mockups/tactic-status-slides/2026-10-22_delayed-centred-slide.html` | The slide's Status column, DELAYED as live (at the pill's left edge) beside centred under the pill, as Performance draws it. Islam: *“apply it and put it live”*. **Approved and BUILT** (§572.2) |
| `../../design-mockups/units/2026-10-22_concise-units.html` | Units on the key measures slide and Performance, as real screenshots today beside the proposal: the unit a little smaller than its number and in dark grey (the line's own grey inside *due*), K/M/B kept full size as part of the amount, dollars in front (`$2M`, `$800K`), and the unit list shortened (SQM, d and h off it for new rows; `$`, `$K`, `$M`, `$B` on it). Islam: *“ok for the units list”*, *“yes build it”*. **Approved and BUILT** (§573) |
| `../../design-mockups/tactics-slide-widths/2026-10-23_columns-fit-content.html` | The tactics slide with each column as wide as what it holds, today beside proposed, with owners and collaborators named, switched off, and nobody named: figures to their content, names on one line, Tactic and Outcome the biggest equal share, the Note no longer a quarter of the slide. Islam: *“yes build it and apply to all slides”*. **Approved and BUILT** for every slide table (§604) |
| `../../design-mockups/guided-tour/2026-10-22_direction-tour.html` | A Guided tour picked in Master presentation from the subjects in the flow, a button on that subject's cover, and the tour through its slides: the slide dimmed, one part lit, a card saying what it is — fourteen stops across the cover, the key measures, the tactics and where it stands. Real screenshots of the build on the demo company shaped like El Abd, figures invented. Islam: *“an option in the flow to present a demo direction … highlights a part and dim the rest with a tool tip”*. **Superseded** by the made-up direction below (§574.1) |
| `../../design-mockups/guided-tour/2026-10-22_made-up-direction.html` | Presentation → Guided tour under Master presentation, opening a made-up direction — EX001 Growing the Restaurant Business, never stored, its cover saying the figures are made up — full screen with the tour on: thirteen stops across the cover, the key measures, the tactics and where it stands, the line under the two readings removed. Real screenshots at Q3. Islam: *“from the options of presentation drop down below the master presentation … on a dummy direction with multiple dynamics”*. **Approved and BUILT** (§574.1–§574.4) |
| `../../design-mockups/guided-tour/2026-10-22_slide-marker.html` | The guided tour's clear views marked two ways: the title ringed with its name in gold, and a label naming the slide and what it is about (results, the work). Islam chose both, on the clear views only. **Approved and BUILT** (§574.5) |
| `../../design-mockups/guided-tour/2026-10-22_purpose-slide.html` | The example's closing slide, *What this platform is for*: One source of truth, Visibility, Accountability, History that stays — big titles, a line of five words or fewer under each — lit one by one with a sentence each, then *Now, today's review*. Real screenshots. Then the lines in Islam's meanings and the objectives brought in one per press rather than toured. **Approved and BUILT** (§574.6–§574.8) |
| `../../design-mockups/note-first/2026-10-22_note-before-anything-else.html` | Mobile's Reporting page as a real screenshot today beside the proposal: a figure typed in red (Mobile market share, 18% against 32% due) locks every other box until its note is written — a red bar in the *to finish* bar's place naming the row with *Go to it*, the other boxes greyed, the row's note ringed and its figure left open. Content agreed in chat (*"agreed"*, with the tactic owner writing the note on My reporting); then *"build the note lock"*. **Approved and BUILT** (§576.1) |
| `../../design-mockups/quarterly-plan/2026-10-22_quarterly-plan-entry.html` | Planning a target by quarter as well as by month, drawn into the running Key measures table (Mobile › MB03 › Accessory revenue): a By month | By quarter switch on the drawer's title line, four boxes labelled with their months, the figures carried across on switching, a quarter inside the review owed in proportion (152M EGP at August on 45 / 51 / 84 / 120), *by quarter* on Performance, and Q1 target to Q4 target in the workbook. Islam answered 1a, 2a and the column names before it was drawn, then *“go ahead and build it”*. **Approved and BUILT** (§577) |
| `../../design-mockups/presenter-clock/2026-10-22_grow-and-pulse.html` | The presenter's clock over a real slide, today beside the proposal: a third bigger in the last two minutes, a slow pulse from thirty seconds, 1.6× and pulsing once over (or pulsing for thirty seconds over, then still). Interactive: step through the moments or play them at ten times speed. **Superseded** by round 3 (§580) |
| `../../design-mockups/line-by-line/2026-10-22_build-and-detail.html` | Line by line (the switch in the slide view, a key measures table filling row by row, *Where it stands* one reading at a time) and the detail under the two readings on a direction's *Where it stands*, as real screenshots of the build. **Settled and live** (§578, §579) |
| `../../design-mockups/stand-detail/2026-10-22_figures-beside-names.html` | The lines under the two numbers on a direction's *Where it stands*: today, where the left half's figures nearly touch the right half's names, and two fixes as real screenshots — A, the list narrowed; B, the figures right after the longest name. **Settled** (B); live (§578.1) |
| `../../design-mockups/presenter-clock/2026-10-22_stages-dim-black.html` | Round 2 of the presenter's clock, Islam's stages: amber from 5:00, larger with a slow pulse in the last minute, red and pulsing once over, the slide half dark at +2:00 and black at +5:00, T to pause and lift it, the next direction clearing it. Interactive. **Superseded** by round 3 (§580) |
| `../../design-mockups/presenter-clock/2026-10-22_dim-last-minute.html` | Round 3 of the presenter's clock: the slide stays as it is until four minutes over, then dims lightly (about a quarter) while the clock pulses twice as fast, and goes black at five over. **Settled** (*"quarter is fine, build it"*); live (§580) |
| `../../design-mockups/two-screens/2026-10-22_slide-view-and-projector.html` | Presenting on two screens: the projector shows the slides, the laptop keeps the slide view marking what the room sees and driving it, looking ahead without the room seeing, and a strip on every page while away. Real screenshots with the new parts drawn in. **Settled** (*"wait for Enter, strip buttons enough"*); live (§582) |
| `../../design-mockups/present-in-window/2026-10-23_present-in-a-window.html` | Presenting in a window for an online meeting with no second screen: the *Present in a window* button, the slides in a window of their own beside the slide view, the window to pick in the meeting's share list. Real screenshots with the new parts drawn in. **Settled** (*"always there, office only"*); live (§582.1) |
| `../../design-mockups/my-work/2026-10-22_tracker-look.html` | The console's My work tab in the Internal Tracker's look, inside the console's own chrome: the navy panel with the week, *My work* and the four counts (the admins' Show picker beside the name), the three groups as numbered sections under a heavy rule, and each row the Tracker's tick · the action · its client · its week · its status · the way into that client's Tracker; on a phone a row folds onto two lines. Round 2 at Islam's word (*“add the done tick and status change too”*): the tick and the status are controls, a ticked row stays green until My work is next read, the counts drop at once. Then *“go ahead and build it”*. **Approved and BUILT** (§583) |
| `../../design-mockups/left-nav/2026-10-23_left-sidebar.html` | The console's tabs moved from the navy bar across the top into a navy column on the left, in today's order under three headings (Work · Team · Knowledge) with History alone at the foot; the mark at its head, the name, role and Sign out at its foot; a « button that keeps the column to its icons; on a phone, a menu button that opens the same column over the page. Islam: *“yes build it, keep the headings and the « button, but make the names of the module appear on hovering when they are collapsed”*. **Approved and BUILT** (§601) |
| `../../design-mockups/instant-navigation/2026-10-23_skeletons.html` | Every click shows something at once: one click (Strategy → Internal Tracker) side by side today and with this, the console's tabs the first time in grey, the console as you left it with the Updating… pill, and each client module's grey shape at the press. Islam: *“yes build it”*. Insights, Meeting Notes and Portfolio were restyled meanwhile (§605) and their shapes follow the new pages. **Approved and BUILT** (§620) |
| `../../design-mockups/modules-look/2026-10-23_one-look.html` | Insights, Meeting Notes, Portfolio and Processes in the Internal Tracker's look, each beside a real screenshot of the demo client today, on a computer and on a phone: the client's panel with the name, the counts and the views inside it; the underlined search line and the console's amber button; lists as the Tracker's rows under numbered headings, status words for pills; one typeface. Processes' side menu becomes the panel's tabs, so the page stops sliding on a phone. On phones every module's top bar fits one line and the Tracker's views stay on one line and slide. Strategy and Copilot left for the end, at Islam's word (*“keep the strategy till the end but adjust the rest”*). Islam: *“ok for insights, meeting notes and projects”*. **Approved and BUILT for those three** (§605), on the branch; Processes, the one-line top bar on phones and the Tracker's phone views are drawn and **not approved** |
| `../../design-mockups/pinned-directions/2026-10-23_directions-stay-in-view.html` | A unit's Plan page below 1200px, as real screenshots today beside the proposal: the strip of directions sticks under the top bar and the open direction's title scrolls away with the plan (reading and editing); the open direction filled navy as the Plan button is, the others greyed; the names wrapping rather than cut or pushed off the end, at 1100, 900 and 760. Three rounds: *“they need to stay visible somehow”*, *“is it a repetition?”*, *“the text needs to wrap and the highlighting needs to be more clear and the other directions titles to be dimmed”*. Islam: *“ok build it”*. **Approved and BUILT** (§609) |
| `../../design-mockups/top-themes-temple/2026-10-23_themes-on-foundation-temple-reads.html` | The company level's Foundation with a Themes box under Key Objectives (code, name, note, how many pillars use it, *In use* or Remove, *+ Add a theme*), three theme cards when reading, and a *Heading* column on Key Objectives; the Temple with no Edit, showing only what the Foundation and the Capabilities section hold. Real screenshots of the demo with the new parts drawn in. Islam: *“the temple should eventually read from the other areas not built on it's own”*, then *“go ahead with all of them”* to the plan, and of this drawing *“yes all ok, build it”* and *“I'm ok with all, but a question would that disrupt elabd?”* (it does not: §611.1's last check section). **Approved and BUILT** (§611.1); the Heading column is drawn only where the Temple is on, which the drawing did not say |
| `../../design-mockups/who-we-are-one-box/2026-10-23_one-box-bold.html` | Who we are as ONE box: the small opener boxes and *+ Add a line* go, a **B** button (and Ctrl/⌘+B) bolds any selected words, what is there today comes in with each line's opener already bold, pasting brings words only; reading as paragraphs with the bold kept; the slide shows the same, the Excel plan keeps its two columns (a paragraph's leading bold is the opener). Real screenshots of the demo with the change drawn in. Islam: *“for the who we are make it one box remove the left box and allow me to make a ceratin part bold”*. **Rejected**, nothing built — Islam: *“negelct the who we are keep it as is.. just fix the themes notes”* |
| `../../design-mockups/strip-card/2026-10-23_strip-as-own-card.html` | The squeezed strip of directions as its own card, on the real Plan and Performance pages scrolled down: A a gutter of page ground under it, B the gutter with a soft shade, C the gutter with the side list's navy header as its first cell, D a navy outline with the gutter, E the outline alone. Islam: *“go with D, but the outer line is not around the whole thing is it broken?”* — it was; fixed with it. **D approved and BUILT** (§618) |
| `../../design-mockups/setup-save/2026-10-23_save-on-setup-real.html` | How a change on a Setup page is made, drawn on screenshots of the real pages over five rounds: the client's colours and the scoring bands wait for **Apply** (with Discard, an Undo for a few seconds after, and Reset to the shipped palette that also waits); every Roles & access change, and hiding anything that holds written content, asks first in a **floating box beside the control** that says what will change; everything else on Setup takes effect as it is made, with no Save button; a strip at the bottom when you leave with colours not applied; End in Mind with its own tick on the shape screen; the Terminology page gone; and the table of seventeen paragraphs taken off the pages. Islam: *“ok build it but make the floating boxes fit the content not too extended for a content that is not there”*. **Approved and BUILT** (§621) |
| `../../design-mockups/client-setup-rail/2026-10-24_client-setup-options.html` | The client's place in Setup, drawn on the live page: the client's own pages as a group at the top of the rail instead of three pills; three layouts for its first page (tabs, summary cards, one page with shortcuts); Forefront team and the office step shown to be one table; the organisation pages' jobs and a Divisions fold; the Official BU list's readers; and where El Abd's grey "Key Measures" came from. Islam: *"go with your recommendations, build it"*, with three changes — what follows from the colours goes on the Brand tab, Forefront team stays in People & access, and Key Objectives is the default — and the Divisions fold questioned. **Approved and BUILT with those changes** (§624): the client group (Profile in tabs, The shape), the office step removed, the BU list in The organisation, Capabilities and the Caps column only where they list something, the word fix. **Not built**: folding Divisions into Business units, and removing the Capabilities page outright. The mockup's rails are the offline copy's, which carries Strategy's groups too — the client settings rail holds three groups only (Islam: *"you got the client settings wrong"*) |
| `../../design-mockups/brand-strip/2026-10-24_strip-in-tenant-colours.html` | The squeezed strip of directions under a tenant whose bar is green and accent amber, on the real Plan page: today (the strip stays navy), then nine options &mdash; the bar colour, dark grey, light grey, type only and the accent as the open item's fill; a hairline, an inset hairline or separate cards between directions. Islam: *&ldquo;the actual color of the client might be too much .. suggest other neutral colors as well&rdquo;* |
| `../../design-mockups/brand-strip-live/2026-10-24_strip-options-live.html` | The same page with a panel of switches, so every combination is pressed rather than read: tenant presets and colour pickers writing the platform's own eight brand tokens, the fill, the separation, the outer line, the Plan switch, the dark theme; the strip itself pressable. Islam: *&ldquo;dark grey with the accent line beneath, separation hairline inset, outerline same as fill, fix the plan switch the same way&rdquo;*. **Chosen and BUILT** (&sect;627) |

### Drawn, awaiting a decision

| File | What it asks |
|---|---|
| `2026-08-23_deck-unit-logo/` | The unit lockup on the review deck &mdash; large on the cover, small in the footer of every other slide. Screenshots from the REAL deck, plus the patch that produces them. **Not built**; the sources are reverted and the build is byte-identical to the shipped file (&sect;52.8) |

### Settled — build status noted

| File | What it holds |
|---|---|
| `mock-capproject.html` | The first project sketch. Superseded — kept for the reasoning |
| `mock-capproject2.html` | The project model on the platform's own components. **Built in 1.8** |
| `mock-caprail.html` | The rail on a capability, all three tabs. **Built in 1.8** |
| `mock-unitrail.html` | The rail on a business unit, drawn with Mobile's real content. **All three pages built — Strategy in 1.7, Performance in 1.8, Reporting in 1.9** |
| `mock-foundationtab.html` | Foundation as a subtab — the page reproduced unchanged, plus the capability version. **Built in 1.8** |
| `mock-strategytab.html` | The Strategy tab and its three subtabs, with Mobile's real content. **Decided with `mock-twotab`, built in 1.8** |
| `mock-twotab.html` | Two tabs for a unit — Performance and Strategy — with reporting folded into Performance. **Built in 1.8** |
| `mock-capability.html` | The capability pages and their Setup screens |
| `mock-capline.html` | The one-line capability band, and projects expanded |
| `2026-08-22_five-questions_SETTLED.html` | Four questions from the v3.15 walkthrough, drawn at real scale in the product's own tokens and settled from the drawing. **Pillar title** &mdash; three greys; B3 chosen, which wears the rail's own grey-plus-gold-edge rather than inventing a fourth banded thing. **Setup navigation** &mdash; the grouped rail, and the icon-strip collapse drawn *collapsed* so it could be seen failing. **Fill a figure set** as one flat searchable table. **The People row.** Built in v3.16 (&sect;46). |

### Rejected — kept so the ground is not retrod

| File | Why it was rejected |
|---|---|
| `mock-obligation.html` | Reporting as a person's page. Built, then reverted: it only solved a case that does not exist, since nobody owes both a unit and a capability. |
| `mock-brief.html` | The CEO brief. Rejected as drawn — too much detail on a page that should answer one question. |
| `mock-nav.html` | Four navigation options, superseded by `mock-navA` |
| `mock-expandall.html` | Placements for an expand-all control, rejected |
| `mock-icons.html` | A first icon set, superseded by `mock-icons2` |
| `mock-groupreport.html` | Group reporting before capabilities were understood |
| `preview-report.html` | The reporting page before it was built |
| `concept-reporting.html` | An early reporting concept |
| `2026-08-21_access-role-then-groups_REJECTED.html` | Roles &amp; access as **pick a role, then five collapsible page groups**. Killed by its own mockup: with the real defaults four groups in five are &ldquo;mixed&rdquo;, so a page that opened mixed groups to avoid hiding a difference unfolded straight back into the 25-row list it was meant to replace. Superseded by the 7&times;7 area table (&sect;37). |

---

## Where things stand

**Built:** the group and unit model, scoring, the temple, arrangement, import
and export, focus measures, the reporting cycle with snapshots and deltas,
presentation mode, supporting functions and capability ownership, the folding
navigation, Setup split from Manage, the project model with the rail and two
tabs (1.7–1.8), and — in 1.9 — the capability card with the Cards/Table
toggle (§16.6), capability project import and export (§16.4), presentation
mode for a supporting function, and the rail on My reporting (§15.12, now
cleared).

Version **2.0** moved the platform's state into the database (§18): served on
Vercel it loads from and saves to Neon, self-building and self-seeding on
first contact; opened as a file it is unchanged. Version **2.1** put real
sign-in on top (§19): the gate is a login, the platform requires a session,
each person sees their own view, and the SMO issues passwords from Levels &
access. The viewer switcher survives only as the SMO's read-only simulation
and in the offline file.

Version **2.2** turned the demo tenant into the client's own (§21): the
companies, the business units, the supporting functions, the themes, the
capability names and the configuration stayed; every invented plan, foundation,
person, cycle, capability content and weighting value went. The weighting
*model* survives — the four factors and their 40/30/20/10 split — and until a
figure is entered every unit counts equally (§21.5). The worked example is still
there: a **Demo data** button switches the whole product to it for explaining,
labels it while it is on screen, and cannot save it.

Version **2.3** took the codes out of the plan template (§22). One generic
workbook instead of a download per unit; the unit is chosen on its Read me
sheet; the platform assigns every code on arrival. It rests on one rule — **an
upload authors a plan, it does not amend one** — which is what removes the need
to match a row against anything. Replacing a plan **archives** the outgoing one,
reported figures included, and Manage lists archives with a Restore.

Version **2.5** brought in the **company level** (§23, built by Islam outside
the repo): a layer between the group and the business unit, for visibility
rather than strategy — a company CEO sees their own units, with two per-company
flags deciding whether they also see the other companies and the group. Two
defects that only a real uploaded plan could expose went with it: a pillar
arriving from an upload had no code, so the rail could not navigate; and the
sticky chrome was pinned three times over, which smeared the header on scroll.

Versions **2.6–2.8** were what a real uploaded plan and a real screen exposed:
the horizon stopped being a baked default and became the tenant's to set; the
rail was found pinned twelve pixels from the top of the window, under a chrome
up to 258px tall that was swallowing its clicks; and the fix for that carried a
feedback loop — a rail capped against the measured chrome height — that had to
be broken with a constant.

Version **2.9** cut the chrome to two lines (§24). The header had been saying
where you are five times over, above a navigation row that already said it:
product name, org name, unit name, a derived "Group · 10 business units" tag and
an Info button. It is now the product on the left, **Viewing as** in the middle,
Demo data and Sign out on the right — then the navigation, then the tabs. Setup
and Manage, two glyphs at the right of the nav row, became one worded **Manage**
button with a menu listing all ten destinations in two labelled groups. Nothing
about the pages moved: each entry opens exactly the page its icon used to, with
the same tab row underneath.

Version **3.0** added the light/dark switch (§25). The dark palette had been in
`_shared.css` from the beginning with nothing to select it — the product followed
your laptop silently. **Auto · Light · Dark** now cycles from a round mark left
of Demo data, remembered on that screen only (never in the database, or one
person's choice would recolour the whole tenant), and the sign-in gate reads the
same choice so signing in never changes the colours under you. The gate's dark
colours were built; it had none.

Selecting the palette for the first time is what exposed the real defect: the
zebra stripe on **every table** was a hardcoded `#F7F9FC`, painting a near-white
band under near-white text. Five new tokens closed that class of bug and dark
went from 482 failing contrast runs to 11. **Light mode's 61 are pre-existing,
untouched and recorded** (§25.5) — a palette decision, not a dark-mode fix. The
client's name came back beside the product name, and the first line was measured
and made to *actually* be one line, which it had not been for anyone signed in.

Version **3.1** made it installable (§26). To a dock or a home screen: own icon,
own window, and it opens with no network. `sw.js` holds the shell — the gate, the
built platform file, the icons — and **never `/api/*`**, because a cached
`/api/state` is last quarter's actuals wearing this quarter's chrome. Offline you
get the platform on its baked data, which it already says on screen.

Version **3.2** made the first line one line at *every* width (§27) — v3.0 had
verified it only at 1180 and above, which is why it still arrived as two rows on
a 1000px laptop. The product name dropped from 26px to 13px and the header from
108px to 47px. Auto went; Light and Dark only.

And the header that kept looking "glitchy" turned out not to be the header:
`.tip::after`, the hover note on every explanatory icon, is a ~320px absolutely
positioned box that was laid out **at all times** at `opacity:0`. Near the right
edge it made the page wider than the window, the page scrolled sideways, and the
sticky chrome slid with it. Hidden tooltips are `display:none` now.
`groupRatio()`'s `NaN%` on the group front page — 0/0 on a tenant with no
tactics — went with it.

Version **3.3** took six changes off the deployed product and, with them, the
scroll-up glitch at its source (§28). The footer sentence went; **Manage is a
gear** with the word in its tooltip; the **rail expands to any number of
directions** instead of cutting the list off mid-row; the headings above it went
on both Plan and Performance; and a business unit opens on **Strategy › Plan**.

The glitch: three versions had fixed real causes underneath it. What remained
was the condense-on-scroll itself — at scroll position 25 the chrome settled at
190px arriving downward and 168px arriving upward, so scrolling back up dropped
22px of chrome into the page in one step. It bought 22px on a header that is now
47px. The mechanism is gone and the chrome reports one single height, in both
directions.

Version **3.4** took seven more off the deployed product (§29). The
Units/Functions folds were not lagging, they were **dead** after any use of the
Manage menu — that row's HTML is rewritten when the menu opens or closes, which
destroys the handlers inside it. The first line is **27px**, half of 47, once a
duplicate `.themebtn` rule was found holding it at 31. The rail's slide is
**0px**, because its gap and its sticky offset are now the same variable rather
than two numbers that were meant to agree. Direction/Capability is hidden behind
one flag everywhere a reader goes, with the field untouched in the data and the
import template. The "Plan only" notice and the rail footer went, and rail rows
now read "3 measures · 2 tactics" instead of a bare unlabelled number.

Version **3.5** added the **Knowledge base** (§30) — first in the Manage menu,
open to everyone, seven sections written to be read start to finish. The essays
that sat above and below four setup tables moved into it: a setup table is where
you change a thing, not where the thing is explained. Also: the **two-click
save** in Setup is one click (a field's blur was repainting the page and
destroying the button mid-press), **Companies** has its own tab, and the **pen
on hover** replaces the bare Edit bar wherever an edit mode exists.

Building the KB caught a defect worth naming: **a page added in a new version
was invisible on every existing tenant**, because the access map is stored per
tenant and a missing key read as denied. It falls back to the shipped default
now.

Version **3.8** replaced levels with **roles** (§33). N-1/N-2/N-3 are gone and
a job title never decides access. A role naming a seat lives on the person; a
role naming responsibility for a thing lives on the thing, so the unit page and
the registry are two views of one fact. It also caught two defects that would
have reached production, including a migration ordering flaw that would have
broken the live database on deploy (§33.5).

Versions **3.9–3.18** built out from there and are recorded in §34–§50. The
**people register** (§16.11, §35) landed — people are retired, never deleted,
and the refusal is on the server; the **access matrix** stopped being 25 pages
× 7 roles and became 7 roles × 7 areas (§37); a **design language** separated
from the palettes under it (§38–§41); **`/api/state` began authorising every
save** against the STORED world, with the diff that authorises doubling as the
change log (§42); the **security floor** went in — the `1234` SMO retired
rather than removed, rate limiting, security headers read from `vercel.json`
rather than typed twice (§43); **figure sets** made a number belong to a named
set rather than to the unit that reports it (§44, spec 008); and **Setup became
a place** — one railed page behind one door, with Manage folded into it, the
gear no longer a menu, and Units | Functions a two-position switch (§46, §47).

**v3.18** added the two things this round asked for: **Collabs.** beside Owner
on every tactics table — a field the data had carried since the import template
and no screen had ever shown or let anybody type — and **picture slides**, the
backlog's §16.12, where the custodian, owner or SMO puts a titled slide of
cropped, captioned pictures at a named point in the review deck. Both are
recorded as §50.

Then a **due diligence** (§48, §49): thirty-one viewers signed in and walked
rather than reasoned about. It found reordering had been dead code for
everybody since §33, Import with no access check at all, a modal that was not
modal, and a build emitting no `<html>` tag — then four that changed behaviour
or data and were put to Islam first. **A new cycle now clears the figures it
archives**, so a unit cannot submit without touching a field; **clearing a plan
archives it**, as replacing one always did; a **company can be created, renamed
and retired**; and **retiring remembers what it took**, so restoring does not
silently demote.

Version **3.22** (§69) is a working session rather than a feature. The People
page becomes the **People register**, its role picker puts each half in its own
column (role in Roles, where in Unit) and commits itself with no Give and no
Cancel — the result carries an × already. A person can be **deleted**, refused
while anything still points at them and naming what, and the delete purges their
password, sessions and declaration on the server: person keys are minted from
the name, so without that a re-added name inherited the deleted person's
password. **Manage slides** shows the deck the projector will show — it ran
neither the footer pass nor the fit pass, so slides overflowed and the unit's
lockup was missing — and the arrows walk it. Fullscreen hides the strip. The
tab row reads **Strategy** then **Performance**, and the orange dot only appears
where a subject owes a submission on an open cycle. A supporting function's
Strategy holds **Overview**, not Foundation. And **sign-in takes the email
address on the register** (the person key still works, for the bootstrap SMO and
anybody with no address).

Version **3.21** (§59&ndash;§63) finished the supporting-function half. A
function that plans in pillars can now be reached before it has a plan and
receive one by upload; a function can be **deleted** where nothing points at it
and nothing was ever reported against it, and the refusal names what is in the
way; the plan template is one button with two entries (**Pillars** /
**Projects**); and **Performance opens directly**, with **Report** as a mode you
enter and leave and **Presentation** as a menu &mdash; arranging having moved to
the Plan, where the order is decided.

The **Demo data** button is now a menu with two entries (§67): **Filled
project**, the full worked example, and **Clear project**, the same organisation
with nothing filled in &mdash; what a new deployment looks like on day one, for
explaining the reporting cycle from the beginning. Neither can be saved.

Version **3.47** lets the office **build a plan on the platform** (§129,
spec 020, mockups in `../../design-mockups/plan-builder/`): a second door
beside Import opens a chooser of every unit and function — or creates one,
a new function asked *pillars or projects* at birth — and a band of section
chips maps the plan, each openable in any order, each reading the data.
Every "+ Add" in build mode opens a form asking the row's fields in the
outcome's order, and starting fresh over a standing plan archives it first.
On the way, five authoring surfaces that could be read but never STARTED
from empty were fixed — the first "Who we are" line, the SWOT, the empty
Plan page, a virgin pillars function's first row, and a capability's key
objectives.

Version **3.57** adds **a custodian per project — as two new roles** (§147,
spec 024). A **Project owner** is named on a project's Owner row and reports
that project whole; a **Pillar owner** is named on a pillar's Owner row — on
a unit or a pillars function — and reports that pillar whole; a
**Contributor** is everyone else the plan names (collaborators,
stakeholders, milestone owners) and reports nothing until the SMO opens the
Contributor row, then only the rows that name them. All three are derived
from the plan's own Owner rows, never granted by hand; each has its own row
on Roles & access shipping at view, and an owner reports only when that row
says edit AND the plan names them — Islam's two conditions, exactly. None of
the three submits. On the way, two server drifts were fixed: a custodian's
deliverable report (and the §104.10 milestone %) refused as plan since
migration 024, and a pillars function's Report page reading the own-unit
cell where the server judged the own-function one.

**Next:** the rebuild on the HR_ERP stack (§20) — sign-in and the shell, then
the read-only screens, then editing and reporting per action. Then
**multi-tenant** (§36) — nothing scaffolded, deliberately, and one Postgres
schema per tenant when it comes. Then the longer-term set below and the open
model questions in §11. Still open from the security floor and needing
decisions rather than code: hash-based CSP, key custody and retention, who at
Forefront may read production, and an external penetration test before go-live
(§43).

**Longer term:** source teams (§16.7), the help box (§16.8), people and
credentials (§16.9), strategy versions (§16.10).

---

## One caution

Only Mobile's plan comes from a real deck. **Every other unit, every capability
and every reported figure is invented** so the structure could be judged. It is
labelled as such in §13 of the decisions document.

Since v2.2 that invented content lives in one place only: **the demo dataset,
behind the Demo button, labelled every second it is on screen.** The deployed
tenant no longer holds any of it, and demo data cannot be written to the
database. Nothing invented reaches a client's own data by construction rather
than by care.
