# Spec 064 — The Strategy Copilot inside SMP: build plan (core slice)

**Status:** plan for sign-off, 30 Sep 2026. Nothing built yet.
**Source of truth:** `decisions-v0.3.md` in this folder (Islam's decision record, copied in verbatim).
**Picture signed off:** `design-mockups/copilot/2026-09-30_copilot-tab.html` (v2, chats and deliverables as two stacked rails).
**Scope agreed in chat:** core workspace only, office-only, Gemini on the existing key, old Copilot data not carried (start empty), the methodology a placeholder until Islam's AI instructions arrive.

Not in this build (decisions §2.4, §7, §9, §10): the office overview, the material library, Promote, the methodology page on the console.

---

## 1. What gets built, in one paragraph

A **Copilot** tab on every place in the Strategy platform (group, company, unit, supporting function, capability), after Reporting. Inside it, five sections: Foundation · Analysis · Directions · Execution · Advisory. Each section has a **Chats** rail (with + New chat) above a **Deliverables** rail. A chat is a named conversation with the AI, which knows the place it is in. A draft the AI writes can be **saved** as the next version of a deliverable, after a preview of exactly what will be stored. A deliverable can be edited in place and restored to an older version; every change is a new version with a note, an author and a date. Only the Super user and SMO team can open any of it.

## 2. Shape of the code

It is a module like Tracker and Notes, and a tab like Insights (§376). No new sign-in, tenancy or roles (decisions §14).

| Piece | Where | What it does |
|---|---|---|
| Module entry | `smp-app/lib/modules.ts` | `copilot` added to `MODULES` and `MODULE_DEF` (`built: true`, `areas: []` for now, like the Tracker), so it is turned on per client from the client card. |
| Server | `smp-app/modules/copilot/index.ts` + registry line | Serves `/<client>/copilot/api` (GET list/read, POST act). Refuses anybody who is not `super`/`smoteam` on this client, at the api AND at any page address (the Tracker's rule, §356). |
| Rules and SQL | `smp-app/lib/copilot.ts` | Pure rules (who may, version numbering, restore, budget) plus every statement, run through `withTenant`. |
| The AI | `smp-app/lib/copilot-ask.ts` | Builds the place's context, asks Gemini through `lib/assistant.cjs` (`askJson`, history of the last turns), returns structured answers. |
| Guidance | `smp-app/lib/copilot-guidance.ts` | The placeholder methodology, one constant per section, written so Islam's instructions replace it without touching anything else. |
| The tab | `SMP-Project-Folder/src/copilot.js` + `copilot.css` | Draws the tab, sections, the two rails and the panes inside the platform. Asks the api, writes the answer into its own node, **never calls `paint()` from a fetch** (§35, §376). |
| The stamp | `smp-app/lib/shell.ts` | Stamps `data-copilot` on the served document only for somebody the server would let in, so the tab is drawn exactly where it would work (the `data-library-cats` pattern). Absent over `file://` and for everybody else, so no dead tab. |

The frozen file changes (a new tab, a new script, a new stylesheet), so each merge owes the built file rebuilt, the generated copies regenerated (`generated-in-step`), and the `sw.js` bump (§91).

## 3. Data (one migration, `smp-app/db/migrations/020-copilot.sql`, mirrored in `schema.sql`)

Every table carries `tenant_id`, is RLS-forced with the same policy as `tracker_actions`, and cascades from the tenant so a client delete stays clean. Old Copilot data is not carried.

| Table | Holds |
|---|---|
| `copilot_chats` | id, place (the product's own place word: `group`, `co:<k>`, a unit key, `fn:<k>`, `cap:<id>`), section (one of five), title, assumptions (list, carried onto anything saved), advisory budget (questions asked, round), created by/at, last activity. |
| `copilot_messages` | chat id, who (a person or the AI), body, and a structured part for what the screen draws specially: playback, draft, missing-input offer, choice between sources, recorded assumption, pasted material. |
| `copilot_deliverables` | id, place, section, type, kind (`promotable` / `copilot-only`), title, the approach recorded when the place was not set up yet (decisions §4.3), created by/at. |
| `copilot_versions` | deliverable id, number (1, 2, 3…, unique per deliverable), body, note, by, at, the chat it came from, "restored from N", assumptions and whether it rests on pasted material, and the gaps shown at save time. |

Versions are never edited or deleted: an inline edit and a restore each **add** a version (decisions §3.6, §3.7). Deleting is not in this slice (see §7 question 1).

## 4. The deliverable shapes

The shape follows the place's plan type (decisions §4.2), in the client's own words (Terminology):

| Section | Promotable shapes | Copilot-only |
|---|---|---|
| Foundation | Foundation (purpose, aspiration, key objectives, values, in the client's words) | — |
| Analysis | SWOT (four lists, each item with its evidence) | Macro / micro / internal scans, free-form |
| Directions | Pillar set (pillars format) | Directions scoring, IE position, value discipline, free-form |
| Execution | Pillars with key measures and tactics · Projects (deliverables, outcomes, milestones) · Objectives with dated actions — whichever the place uses | Objective sets (SMART / OKR / scorecard), free-form |
| Advisory | — | Decision Brief, or free-form (title and body) |

Where a place is not set up yet, the chat asks which approach from a fixed list and records it on the deliverable. Nothing here writes into SMP; Promote is a later round.

## 5. Stages

Each stage ends green on its own checks and is pushed to the branch. No merge to `main` without Islam's word on that merge.

**Stage 1 — The shelf, with no AI yet.**
The module entry, the migration, the server gate, the stamp and the tab. Sections, the two rails, + New chat, a chat that stores what is typed, a deliverable opened with its versions, inline edit, restore, rename a chat. Everything reads and writes the database; the AI reply is a fixed "the Copilot is not connected yet" line.
*What Islam can check:* open Mobile › Copilot as the SMO, start a chat, see it on the rail after a reload; open the same page as a unit head and see no tab.

**Stage 2 — The AI in a chat.**
The one line of context (what the AI can see for this place, with the detail on hover), built from the platform's own readers so the numbers match the Performance page. Playback before producing (understood / working from / missing). "Assume for me" recorded on the chat and never asked again. Missing input named with its two ways on. Pasted material marked, with an offer to save it to its own section. Gemini through the existing key; with no key, the chat says so plainly.
*What Islam can check:* ask Mobile's Analysis for a SWOT refresh and get the playback first, then a draft.

**Stage 3 — Save, in the right shape.**
Save to the shelf → the preview dialog showing exactly what will be stored in the place's shape, the gaps and the assumptions, a note box → stored as the next version of the same deliverable, never a second copy. Promotable or Copilot-only marked on the rail.
*What Islam can check:* save a SWOT twice from two chats and see one SWOT with v1 and v2.

**Stage 4 — Advisory.**
One question per turn, the visible count (5 per round, 2 rounds, then it answers on assumptions), the two quick replies, a contradiction put as a choice, and the Decision Brief.
*What Islam can check:* start an Advisory chat and watch the count move and stop at the budget.

**Stage 5 — The group, companies, and the sweep.**
At the group (and a company), the Deliverables rail lists every place's deliverables in that section, grouped by place; the author's name on every item, with a Client mark for work not made by the office. Full `qa.py` sweep, both sides of the Units | Functions switch, dark and light, window sizes down to 1000px.
*What Islam can check:* the group's Execution rail listing Mobile, Retail Stores and Finance under their own names.

## 6. How it is proved

- `smp-app/checks/copilot.mjs` (database, no browser): the gate at both ends (office in, unit head out, at page and api); one client cannot see another's chats; version numbers only go up; restore adds a version; the Advisory budget stops at 5 and at round 2; the stamp present only for the office. A stand-in model on `GEMINI_ENDPOINT` so what was asked and answered is read off the wire. Proved able to fail by breaking each rule once.
- `SMP-Project-Folder/src/checks/copilot-tab.py` (over HTTP with a stub, because the tab does not exist over `file://`): the tab drawn after Reporting, the two rails, a chat that writes and reads back, save/edit/restore driven by pressing the real controls, contrast in both themes, no sideways scroll.
- The existing suites stay green: `qa.py` (walks every page as every viewer), authoriser, state, modules, door, shell, `generated-in-step`, `built-in-step`, `tsc`.

## 7. Two questions for Islam before Stage 1

1. **Deleting.** The record says nothing about removing a chat or a deliverable. Proposal: a chat can be deleted by whoever started it or the Super user; a deliverable cannot be deleted in this slice (its history is the record). OK?
2. **Pasted material size.** Proposal: up to about 30 pages of text per paste; anything longer is refused with the reason, until the material library exists. OK?

Everything else is settled by the decision record and the mockup.
