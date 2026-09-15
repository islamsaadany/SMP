# 054 · Action Tracking — the team's weekly list, per client

**Status:** clarified 2026-09-15, not yet planned. Every decision below is
Islam's or was put to him with its cost and taken; the two that are still his
are in §9. **Nothing is built and no mockup is drawn yet** — the mockup comes
next and is signed off before a source moves (rule 1c).

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
| 5 | Who owns an action | **Somebody on the client's register who holds an office seat.** The consultants are already on every client's register as office rows (§338, §339), so the owner is picked from the register like every other name in the product — narrowed to office rows, because the client's people cannot open the list an action lives on. |
| 6 | Grouping | **By owner, and nothing else.** The client is already the scope; the other system's free "scopes" list is a second thing to maintain for a list that is per client by construction. |

---

## 3 · What it does, in plain words

One list per client, read by the week. An action has a title, an owner, a due
date, a status, and can name collaborators and carry a description. The week
runs from the first working day to the last (§9.2). Anything not done by the
end of the week is still on next week's list — nothing carries it, it is
simply still due. Anything past its due date reads **late**, and says how
many weeks it has been carried. Every status change is kept with who and when,
and the first entry is who made the action.

Three statuses and the product's own three words (§300): **Not started ·
In progress · Done**. Done stamps when; reopening clears it.

Four views: **This week** (due by the end of this week, or late), **All**,
**Mine**, and **Undated** (no due date yet — an action with no date is never
late and never on This week, so it needs a view of its own or it is lost).
A search box over the title. One summary strip over the whole client: open ·
late · due this week · done this week.

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

What the spine gives for nothing: the address `/<client>/<word>/…`, the
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
| `collaborators jsonb` | register keys, canonically ordered, may be empty |
| `due date` | optional; NULL is *no date yet* and is never late (§35) |
| `first_due date` | the first due date ever set; kept while open so a reschedule cannot reset the carried count; cleared on Done |
| `status` | `not_started` · `in_progress` · `done` |
| `done_at` | stamped on Done, cleared on reopen |
| `created_by`, `created_at`, `updated_at` | |
| `extra jsonb` | room for what is not built (§7): a late override, a reason, a link to Strategy — drawn by nothing |

**`action_events`** — one row per status change, plus one on creation:
`action_id`, `from`, `to`, `by_key`, `at`. Appended, never edited; a log a
save could rewrite is not a log (§42).

**No migration and no schema change beyond the two tables.** Owner and
collaborators are KEYS and never names: the register renders the name, so a
rename reaches every action (§48) and somebody retired reads as retired
rather than as a name nobody can find.

---

## 6 · Who may do what

- **Open the module:** the client's Super user and SMO team seats. Everybody
  else is turned away at the module's own server, not only hidden from the
  switcher — a hidden entry is decoration (§42, §44).
- **Create:** anybody who can open it, naming any office row as owner.
- **Change status, date, title, description:** the owner, a collaborator, or
  the client's Super user.
- **Reassign the owner, change collaborators, delete:** the owner or the
  Super user. Being the creator confers nothing.
- **The rule lives on the server** and the screen asks the same function
  (§42): a control the server refuses is never drawn.

---

## 7 · What is taken from the reference and what is left

| Theirs | Here |
|---|---|
| Sunday-to-Saturday week, carry-over by still-being-due | Taken; the days are §9.2 |
| Late computed from the due date; carried-weeks from the first due date | Taken |
| Status history with who and when, opening with "created" | Taken |
| Not started · In progress · Done | Taken — the product's own words already |
| Owner, collaborators, description | Taken; owner and collaborators as register keys, never free text |
| Views: This week · All · My actions · Undated | Taken; *Mine* rather than *My actions*, one word |
| Summary strip of four | Taken |
| Search, owner filter, group by owner | Taken |
| Free "scopes" list with rename, retire, reorder | **Not taken** (decision 6) |
| Function/department on an action | **Not taken** — a unit is a place in the Strategy module; if it is wanted here it is one field in `extra` and a decision |
| Link to a strategy key action | **Not taken** — the two lists are kept apart (spec 046 decision 6's shape); room left in `extra` |
| Created from a note | **Not taken** (decision 3) |
| Force-late / never-late override and a late reason | **Not taken** to start; the reference had the field and no box to type it. Room in `extra` |
| Stakeholder free-text field | **Not taken** — theirs stored it and no screen showed it |
| Every member sees every action; any member may own | **Narrowed to the office** (decisions 2, 5) |
| Their bug: a collaborator cannot save the edit form | Avoided by construction: the server judges the CHANGE, not the whole form |

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

## 9 · Still Islam's

1. **The word.** `actions` as the key and **Actions** as the label is the
   proposal; *Action Tracking* is the reference's name and is two words on a
   switcher whose other entries are one. Islam's to say.
2. **The week's days.** The reference runs Sunday to Saturday. Egypt's working
   week is Sunday to Thursday, and *this week* should probably mean the days
   somebody is at their desk. Sunday to Thursday is the recommendation, with
   Friday and Saturday work reading as next week's.

## 10 · Recorded, not decided

- A per-module access tab (spec 046 §4.4) is still built for no module; this
  one is office-by-rule and adds nothing to that debt.
- Nothing reminds anybody. If a weekly digest is ever wanted it is the
  collection mechanism §293 already has, pointed at this list, and its own
  decision.
- The mockup: This week with a few late rows, the edit form, the detail with
  its history, and the empty client — drawn in the platform's own tokens
  before a source moves.
