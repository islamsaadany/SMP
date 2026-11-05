# 069 · Track Record — what we did for each client, assignment by assignment

**Status:** **BUILT 2026-10-26 on Islam's "Build it", MERGED TO `main` the same day on "merge it and put it live"** (decision record §650).
The drawing that was signed off is
`design-mockups/track-record/2026-10-26_track-record-steps.html` (its second
version, drawn in the console as it is today).

**Reworks spec 067 (Case studies)**, which it renames and simplifies. What 067
says about where it lives, who reads a published write-up, the eight sections,
the interview's splitter, files, and the client's own people never reaching it
still holds. Where this departs from 067 it says so.

---

## 1 · What was asked

Islam, 2026-10-26: *"the case studies module is not working properly it's not
counter intuitive and it needs a different name as case studies mean that
there is something new while it's just documentation of our previous work. so
let's revise the module how it works and how it helps people add the cases and
how the user gets easily the prompt."*

What made it hard to use, found by reading the module: three steps by an admin
before anybody wrote anything (open a piece of work, then ask for the write-up
with a writer and a date); words to learn (piece of work, running, being
written, the desk, the shelves, the interview, place an insight); the prompt
only visible to the person asked, behind a button called *The interview*; a
second, separate prompt under Insights; and checking the paste on another page.

## 2 · The decisions, Islam's, 2026-10-26

| # | Question | Answer |
|---|---|---|
| 1 | The name | **Track Record** (*"Track Record is good"*). |
| 2 | Who starts a write-up | **Any consultant** (*"consultants can start"*). |
| 3 | Where clients and dates come from | **A registry**: every client with its assignments, each with start and end month, lead consultant, team and type (*"nobody needs to create a client and always pick from a list"*). |
| 4 | Who keeps the registry | **The super user** (*"registry is from the super user"*). |
| 5 | Assignment types | **Planning and Retainer, for now.** |
| 6 | What a page is for | **The client.** A write-up or a learning belongs to **one assignment** of that client, which gives it its context (*"the page would be for the client but the project or the learning would be relevant to the assignment"*). |
| 7 | Clients / Learnings switch on the front | **Removed** (*"learnings are part of the clients work"*). The cross-client question it answered ("every hiccup on a Retainer") is the front's search and filters. |
| 8 | The add button | **One, + Add to Track Record**, offering *Write up an assignment* or *Add learnings*. No *add a client* there. |
| 9 | The learnings prompt | **Kept** (it was *Write up a period*), now tied to an assignment; typing one in is the other way. |
| 10 | The client list | **Islam will send it; a way of adding more stays.** |

**Placed rather than asked, and said on the mockup:** the registry is drawn on
the **Clients page** (its list view), because Clients is already the one list
of clients and only the super user adds to it — not a second page.

## 3 · How it works

1. **The super user adds assignments on Clients** (list view): under each
   client, *+ Add an assignment* — name, Planning or Retainer, start month, end
   month (empty while running), **planned man-days** (the days agreed with the
   client, a whole number, empty where none was recorded; §696), lead, team,
   each picked from the consultants.
   *Edit* changes one; *Remove* (asked twice) removes it and its write-up, and
   its learnings go back under the client. A **past client** is added on
   Clients › Ended (name, industry, size), made ended with nothing behind its
   door (067 §7), and gets assignments the same way.
2. **The write-up lands on the lead's My tasks and Home** once the end month
   has come and nobody has started it — wanted by the first day after that
   month. Nobody has to ask. Old assignments loaded from the list show at once.
3. **Writing it up** (from My tasks, the client's page, or *+ Add to Track
   Record › Write up an assignment*): one page with what the registry says,
   the prompt to take to an assistant (built from the registry — client,
   industry, type, months, lead, team), **Open in Claude** (a new chat with the
   prompt in it) beside **Copy the prompt**, and the paste box. *Type it in by
   hand instead* skips the prompt.
4. **Check, attach files, publish**: the paste fills the eight sections (067
   §4), every one editable; the learnings it found are listed, tied to this
   assignment; *Save as draft* or *Publish*. The name, months and team are the
   registry's and are not typed again; the team's roles are.
5. **Any time, learnings**: *+ Add learnings* on the client's page or the
   front — pick the client and one of its assignments, then **talk it
   through** (the learnings prompt with the client and assignment in it;
   paste back; check; save all) or **type one in**.

## 4 · What a reader sees

- **The front**: one card per client with its assignments and where each
  write-up stands (*Written up · Draft · Not written · Running*) and how many
  learnings it holds. Filters: industry, type, kind of learning. Picking a kind
  of learning lists those learnings across every client in the cards' place;
  a search finds write-ups and lists the learnings that match.
- **A client's page**: the client on its band; its assignments on a strip of
  months; one tab per assignment with the write-up, *At a glance* (type,
  months, lead, team, where it stands, the one button that moves it on) and
  *Learnings from this assignment*. Learnings written before today, tied to
  no assignment, are listed under the tabs as *Not tied to an assignment yet*
  until their author or a super user picks one on the learning's page.

## 5 · Who may do what, on the server (`lib/case-api.ts`)

| | |
| --- | --- |
| add, change, remove an assignment; add a past client | the super user |
| start a write-up nobody has started | any consultant |
| change a started or published one, publish | its writer, its lead, a super user |
| read a draft | its writer, its lead, a super user |
| read a published one, or one nobody has started | every consultant |
| tie a learning to an assignment | its author or a super user, same client only |

A client's own people reach none of it (067 §8).

## 6 · Stored

`case_studies` keeps its name (the record), and each row is now an
assignment: two columns added — `kind` (`planning` | `retainer`) and
`lead_id` — in `schema.sql` and migration `034-track-record.sql`. Rows already
there become Planning with no lead. `planned_days` (integer, NULL where none
was recorded, never 0 for nothing) follows in migration `036-planned-days.sql`
(§696); it is shown on the assignment's line, in the write-up's At a glance and
in the interview prompt. The state word is unchanged in storage
(`running` = nothing written, `writing` = draft, `done` = published); the
first save sets the writer. `asked_by` and `due` stay for the record and are
no longer written. The console's tab key stays `memory`.

## 7 · Gone

*Open a piece of work*, *Ask for the write-up*, the desk and the shelves, the
Insights list as a separate view, *Not yet in a case study*, and Home's
*insights of yours to place*. The memory's assistant (*Ask a question*) stays
on the front's band.

## 8 · Recorded, not done

- **The client list is not loaded yet**: Islam will send it.
- **Assignment types beyond Planning and Retainer** are one word in
  `ASSIGNMENT_KINDS` and one in the `case_kind` check when they come.
- **Cards view on Clients** does not show assignments; the list view does.
- **A super user may start a write-up before the end month**; a consultant
  is offered it once the assignment has ended.

## 9 · Checked

`checks/case-api.mjs` (the endpoint, every rule both ways, red under eight
breaks), `checks/case-page.mjs` (the whole walk in a real browser: the
registry, a past client, My tasks, prompt and paste, publish, the front and
its filters, a client's page, a draft kept back, learnings by prompt and by
hand, a phone; red under three breaks), `checks/memory-page.mjs` (the
learnings' screens, rewritten for where they now live), `checks/memory-api.mjs`,
`checks/case-split.mjs`, `checks/memory-split.mjs`, `checks/memory-boundary.mjs`,
`checks/shell.mjs`.
