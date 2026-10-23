# Spec 068 — Home, and the console made compact

**Status: BUILT on branch `claude/cool-bardeen-xqllne`, not merged.**
Decision record: `SMP-Project-Folder/DECISIONS-AND-LOGIC-v3.22.md` §614.

## What Islam asked for

- "we need a user dashboard design when they open, maybe we adjust my work to
  be the dashboard where it shows your tasks and it shows your clients to open
  directly from there. and maybe anything else"
- "call it Home, … include case studies, late and this week"
- From two homes he liked (a people portal and ClientPlus): keep the serif,
  "make it Your SMP Home", "the screen should split between the clients and
  the tasks, clients on the left and tasks on the right and the tasks show the
  view like the Client plus but with overdue and this week in the same place
  and all tasks takes the person to the tasks tab", "below 2 cards the case
  studies".
- "remove go to clients button, and change the name of my work to my Tasks",
  "the admin also sees his clients".
- "why is client plus a bit smaller in view than this dashboard?" → "build it
  compact, for all console".

## Drawings

All in `design-mockups/home/`, published as artifacts:
- `2026-10-23_home.html`: first drawing (superseded)
- `2026-10-23_home-v2.html`: after the two references (superseded)
- `2026-10-23_home-v3.html`: the split
- `2026-10-23_home-v4.html`: compact, **the one built**

## What is built

1. **Home is the console's first tab and its landing** (`/platform`, no hash).
   My work is renamed **My tasks** (its key and address `#mywork` unchanged),
   second in the column.
2. **The greeting band**: the date, "Good morning/afternoon/evening, <first
   name>" in a serif, "Your SMP Home."
3. **Your clients (left)**: the clients this person has a SEAT on, admins
   too, one row each with a button into each module carrying the module's
   mark (the same `cards` answer and marks as Clients). No "Go to Clients".
4. **Your tasks (right)**: ClientPlus's panel, with Overdue and This week as
   tabs in one place. It opens on Overdue when anything is overdue. Rows are
   My tasks' own rows (`mywork`), write-ups included. A row opens what it
   opens on My tasks; ticking and status stay on My tasks. "All tasks →" goes
   to My tasks.
5. **Case studies, two cards**: your write-ups in progress (a ring of the
   eight sections filled, Continue or Start), with your insights still to
   place under them; and the case studies marked done in the last 30 days.
   Served by `/api/cases` action `home` (`lib/case-api.ts`).
6. **Compact, across the console**: 14px text, a 212px column with 13.5px
   tabs, the whole width of the window, smaller page titles and tighter rows
   on My tasks; the case study's reading measure stays.

## Checks

- `checks/case-api.mjs` §7b: Home's read (yours only, the count follows the
  writing, done ones only, your loose insights). Red under `home-all`.
- `checks/shell.mjs`: the console opens on Home with My tasks second; Home's
  tasks panel on made Tracker rows; the client with its modules; All tasks
  lands on My tasks; 14px and full width; the column at 212px.
- Rewritten for the new landing: `door-landing.mjs`, `tab-keep.py`;
  repaired from spec 067's Clients filter: `console-record.mjs` (reads the
  navigation's own list), `client-card-modules.py` (presses Demo).

## Not built

- Hours and recent activity from ClientPlus: the console keeps no hours, and
  History holds what happened.
