# 054 · Internal Tracker — the team's weekly list, per client

**Status:** **built 2026-09-15 (§356), on the branch, not merged.** Every
decision below is Islam's or was put to him with its cost and taken, the word
and the week included (decisions 7 and 8, answered the same day). The mockup is
`design-mockups/internal-tracker/2026-09-15_this-week-edit-detail-empty.html`,
published as an artifact and signed off (*"build"*). Built as `smp-app/modules/
tracker/` over `smp-app/lib/tracker.ts`, two tables in `db/schema.sql` and
migration 012, proved by `smp-app/checks/tracker.mjs` (124/0, red three ways).
One rule in §4 was corrected while building and says so.

**The second round is built (2026-09-15, §356.11–§356.13), on the branch,
not merged.** Islam, using the built tracker: *"The button with my initials
should open the list of the taem on the project ot assign an owner and it's
better to be first name of the owner and have a 3 dots on the right to open
that expanded view with notes or history and keep the action items editable
by a double click on the action name and no need for the 'with' part for
collaborators it's a simple task management thing."* Then, of the drawing:
first names only in the team list, an **arrow** rather than three dots, the
history **much smaller, in a box that scrolls**, and **adding a line silent**;
then *"carried 1 week is long"* — late is **Late · Late 1 w · Late 2 w** with
the date after — and **the grouping is a choice** on the far right of the
views row; and the word: *"remvoe collaborators and the rest is ok to build."*
The mockup is `design-mockups/internal-tracker/2026-09-15_row-first-name-dots-rename.html`,
published as an artifact and redrawn three times at his word before a source
moved (rule 1c). What it changes: **one action, one owner** — no *With*, no
second name on a row, the `collab` act refused, the column dropped by
migration 013, and §6's two rules now ONE (the owner or the Super user), which
narrows decisions 5 and 6's "collaborators" to nothing; the owner cell is the
owner's **first name** (the register's own rule, §130.7, a clashing pair
lengthened to two words, §81.1), and for the owner and the Super user it opens
the office on this client to hand the action on; an **arrow** at the row's
end opens the row in place for its notes, its history and Delete, and folds
it again — the title stops being a link; a **double-click** on the name
renames it in place, so the opened row keeps no Title box; the history is
small type in a box that scrolls; **late is one short word** with the weeks
riding on it; and **how the list is grouped is a choice** — Owner (the
default), Status, Due date, None — remembered on the browser as a cookie the
page reads, which loosens decision 6 from *by owner and nothing else* to *by
owner unless you choose otherwise*. **And every press is silent (§356.12)**:
the server answers each one with the list drawn again by the page's own
renderer and the script swaps it in, so nothing reloads and the browser still
renders no row of its own. The one cost stated on the mockup and kept: a
double-click has no hover on a tablet.

**Read with spec 046 (Modules)**, whose §4.2 contract this passes in §4 and
whose module frame — the address, the switcher, the row on the client's card,
the on/off drawer and the door — it inherits without touching.

**Not spec 046's Portfolio.** Portfolio is the client's own detailed projects
with breakdowns and timelines, written by the client. This is Forefront's
weekly to-do list about one client, written by the office. Two lists, no
pointer between them.

**Reference, never source:** `aleymahmoud-ff/strategy-management-system`'s
Action Tracking app, read through the description Islam uploaded on
2026-09-15. §7 says what is taken from it and what is left, one line each, so
nothing is copied past a decision.

---

## 1 · What is asked

Islam, 2026-09-15, of the two things that repository holds and SMP does not:
*"notes and action tracking are smp module and both are for the smo team
actually … the tracking tool is for the internal team weekly actions
tracking"* — then, corrected: *"no they belong to the client as they are
modules for handling this specific client … the tracking to be client
specific"* — and of the join with Notes: *"no the mom is for the attendees
the tracker is more for internal alignment."*

So: a client module, switched on per client, opened inside that client's
platform, holding that client's rows — and used by the office alone, for
their own weekly alignment about that client. The client's staff never see it.

---

## 2 · The decisions

| # | Question | Answer |
|---|---|---|
| 1 | Where it lives | **A client module.** Per client, in the client's own tables, behind the client's door, exactly as Insights. Not on Forefront's side of the door and not spanning clients (Islam's correction of my first proposal, which had put it beside the consulting memory). |
| 2 | Who opens it | **The office only, by rule** — whoever holds the client's Super user or SMO team seat. Not a matrix cell: the client's own people have nothing to do in it, and a cell they could tick would be a column nobody should fill (§61). The day a client person needs in is the day the per-module access tab (spec 046 §4.4) is built for it. |
| 3 | Its join with Notes | **None.** A MOM goes to its attendees by email; the tracker is internal. Nothing flows from one to the other, and the tracker takes no link to a note. Offered as one press per action item and turned down. |
| 4 | Order of building | **This first, then Notes.** No assistant and no email in it, so it is the smaller piece. |
| 5 | Who owns an action | **Somebody on the client's register who holds an office seat.** The consultants are already on every client's register as office rows (§338, §339), so the owner is picked from the register like every other name in the product — narrowed to office rows, because the client's people cannot open the list an action lives on. **One owner and nobody else** since §356.11 (*"no need for the 'with' part for collaborators"*). |
| 6 | Grouping | **By owner unless you choose otherwise** (loosened at §356.11 from *by owner, and nothing else*): Owner is how the list opens; Status, Due date or None are a choice on the views row, remembered by the browser and never stored on the client. The other system's free "scopes" list is still not taken — the client is already the scope. |
| 7 | The word | **Internal Tracker** (Islam, 2026-09-15). Key `tracker`; two words on the switcher, and the second says who it is for, which is the point. *Actions* was proposed and not taken. |
| 8 | The week | **Sunday to Thursday** (Islam, 2026-09-15). *This week* is the days somebody is at their desk; anything due on a Friday or Saturday reads as the following week's. |

---

## 3 · What it does, in plain words

One list per client, read by the week. An action has a title, one owner, a
due date, a status, and can carry a description. The week runs Sunday to
Thursday (decision 8). Anything not done by the end of the week is still on
next week's list — nothing carries it, it is simply still due. Anything past
its due date reads **Late**, with the weeks it has been carried on the word
(*Late 1 w*, *Late 2 w*) and the date after it. Every status change is kept
with who and when, and the first entry is who made the action.

Three statuses and the product's own three words (§300): **Not started ·
In progress · Done**. Done stamps when; reopening clears it.

Four views: **This week** (due by the end of this week, late, or with no date
yet), **All**, **Mine**, and **Undated** (no due date yet — the narrower list
of what still needs a date). *Corrected while building*: this first read "an
action with no date is never on This week", and the browser check found the
loss that makes — the line somebody has just typed on the landing has no date,
so on the reload it moved to Undated and vanished from under their hand, which
the sheet this replaces never did. A line with no date is this week's until
somebody says otherwise; it is never late.
A search box over the title. One summary strip over the whole client: open ·
late · due this week · done this week.

**IT WORKS LIKE THE SHEET IT REPLACES** (Islam, 2026-09-15: *"we are shifting
from a simple google sheet to a tool so it needs to be super simple"*). There
is **no form and no separate page**. The list ends in the next empty line: you
type an action there and press Enter, it lands under you with no date and Not
started, and everything else is changed **on the row itself** — the date, the
owner, who else, the status, the done tick. A row opens in place for its notes
and its history, and that is where Rename and Delete sit. Every write lands
when the control is left (§35), so nothing has a Save button.

**Nothing is sent and nothing runs on a schedule.** No reminder, no digest,
no notification. The late flag and the carried count are computed when the
page is read, from the due date and the date it was first given — so nothing
has to wake the platform up (§97.5), and a reschedule cannot reset the
counter.

---

## 4 · The module contract (spec 046 §4.2)

| # | Asks for | Here |
|---|---|---|
| 1 | Its own navigation | The four views: This week · All · Mine · Undated |
| 2 | Its own roles and areas | **None on the table**, by decision 2: office by rule. Recorded as the deliberate exception, the way Inbox and Setup are. |
| 3 | Its own Setup group | **None.** There is nothing to set. |
| 4 | Its own rhythm | **Weekly.** The list is read by the week, and it is the first module with a rhythm of its own that is not the reporting cycle. |
| 5 | A landing | This week |

What the spine gives for nothing: the address `/<client>/tracker/…`, the
switcher entry, the row on the client's card, the on/off drawer, the door,
`withTenant`, and the register through `lib/place.ts`.

---

## 5 · What it stores

Two tenant-owned tables. **`tenant_id` is the whole of what isolation
costs**: `db/schema.sql`'s loop enables and forces row-level security on every
table not on the platform's own list, so both are covered on the next apply,
and `lib/schema-check.ts`'s `PLATFORM_TABLES` must **not** gain them (§331).

**`actions`**

| Field | Why |
|---|---|
| `id`, `tenant_id` | the action and the client it is about |
| `title` | required; trimmed; the one thing that makes an action |
| `description` | plain text, optional |
| `owner_key` | a register key; must hold an office seat at the time it is set |
| `due date` | optional; NULL is *no date yet* and is never late (§35) |
| `first_due date` | the first due date ever set; kept while open so a reschedule cannot reset the carried count; cleared on Done |
| `status` | `not_started` · `in_progress` · `done` |
| `done_at` | stamped on Done, cleared on reopen |
| `created_by`, `created_at`, `updated_at` | |
| `extra jsonb` | room for what is not built (§7): a late override, a reason, a link to Strategy — drawn by nothing |

**`action_events`** — one row per status change, plus one on creation:
`action_id`, `from`, `to`, `by_key`, `at`. Appended, never edited; a log a
save could rewrite is not a log (§42).

**No migration and no schema change beyond the two tables** — and one after
them: migration 013 drops the `collaborators` column the first build carried
(§356.11). The owner is a KEY and never a name: the register renders the name,
so a rename reaches every action (§48) and somebody retired reads as retired
rather than as a name nobody can find.

---

## 6 · Who may do what

- **Open the module:** the client's Super user and SMO team seats. Everybody
  else is turned away at the module's own server, not only hidden from the
  switcher — a hidden entry is decoration (§42, §44).
- **Create:** anybody who can open it, naming any office row as owner.
- **Change status, date, title, description; hand it to somebody else;
  delete:** the owner or the client's Super user — ONE rule since §356.11,
  where the first build kept two (a collaborator could change but not hand
  on). Being the creator confers nothing.
- **The rule lives on the server** and the screen asks the same function
  (§42): a control the server refuses is never drawn.

---

## 7 · What is taken from the reference and what is left

| Theirs | Here |
|---|---|
| Sunday-to-Saturday week, carry-over by still-being-due | Taken as Sunday to Thursday (decision 8) |
| Late computed from the due date; carried-weeks from the first due date | Taken |
| Status history with who and when, opening with "created" | Taken |
| Not started · In progress · Done | Taken — the product's own words already |
| Owner, collaborators, description | Owner and description taken, the owner a register key and never free text; **collaborators taken and then removed** (§356.11, *"it's a simple task management thing"*) |
| Views: This week · All · My actions · Undated | Taken; *Mine* rather than *My actions*, one word |
| Summary strip of four | Taken |
| Search, owner filter, group by owner | Taken; the grouping a choice of four since §356.11 |
| Free "scopes" list with rename, retire, reorder | **Not taken** (decision 6) |
| Function/department on an action | **Not taken** — a unit is a place in the Strategy module; if it is wanted here it is one field in `extra` and a decision |
| Link to a strategy key action | **Not taken** — the two lists are kept apart (spec 046 decision 6's shape); room left in `extra` |
| Created from a note | **Not taken** (decision 3) |
| Force-late / never-late override and a late reason | **Not taken** to start; the reference had the field and no box to type it. Room in `extra` |
| Stakeholder free-text field | **Not taken** — theirs stored it and no screen showed it |
| Every member sees every action; any member may own | **Narrowed to the office** (decisions 2, 5) |
| Their bug: a collaborator cannot save the edit form | Avoided by construction: the server judges the CHANGE, not the whole form — and there is no collaborator to be refused any more |

---

## 8 · How it is proved

`smp-app/checks/actions.mjs`, needing a database, in the shape of
`checks/insights.mjs`: both ends of every rule (§94.2) — the office in, a
client person turned away by the server and not merely by the switcher; the
owner picker offering office rows and not the client's; late and carried
asserted as AGREEMENT with a date the check works out for itself (§94.8), on a
row whose due date is moved so the counter is proved not to reset; the four
views asserted disjoint where they must be and each holding what it names; a
reopen clearing `done_at`; the event log appending and never rewriting; and
the two tables asserted RLS-forced and absent from `PLATFORM_TABLES`. Red
under a named break before green is believed (§94.5); every probe degrades
rather than dies (§215). `checks/modules.mjs` covers the registry half by
construction — a fourth built module is asserted to serve itself.

---

## 9 · Settled the same day

The word and the week were the two things left open in the first draft of
this file and are decisions 7 and 8 now; the draft's own recommendation on
the week stood, and its proposal on the word did not.

## 10 · Recorded, not decided

- A per-module access tab (spec 046 §4.4) is still built for no module; this
  one is office-by-rule and adds nothing to that debt — **but the switcher
  still lists the tracker for a client's own person**, who is then refused at
  the door, because the spine's menu knows modules and not seats. That tab is
  where it ends.
- The module is turned on per client from the client's card (§320.5); no
  client has it until somebody presses it.
- Nothing reminds anybody. If a weekly digest is ever wanted it is the
  collection mechanism §293 already has, pointed at this list, and its own
  decision.
- The mockup shows This week with late rows, a line being added in place, a
  row opened for its notes and history, and an empty client — in the module
  page's own tokens, extended only where a list of actions needs a rule the
  library did not. Its first draft had a form and a detail page; both were
  taken out the same day at Islam's word (§3). The second mockup redrew the
  row's controls (§356.11) and was signed off with one change, no
  collaborators.
- A double-click has no hover on a tablet, so a finger is not told the name
  can be renamed; the expanded row carries no second way in, and Rename beside
  Delete there is a decision if it is ever wanted.
- The grouping is remembered per browser (a cookie), so two of the office read
  one list two ways, and a link somebody sends carries the view and the opened
  row but not the grouping.
