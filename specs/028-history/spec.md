# 028 — History: who changed what, and a way back

**Status:** built on `claude/platform-performance-audit-z91vi4` (§262), 2026-09-03.
**Asked by:** Islam — *"how about a history saving and recovery feature to track the changes per user and per unit and function to ensure nothing is lost?"*
**Mockup:** `design-mockups/history/2026-09-03_history-page.html`, drawn from real change-log rows; signed off with three questions answered (below).

## What it is

A screen over the change log the platform has written on every accepted save since §42, and a way to put a value back.

1. **Setup › History** (Running the cycle). One line per changed field: when, who, where, kind, row, field, from → to. Filters — person, place, kind, window — ask the server for a slice. The search filters the drawn rows in place. Every cell is one line; the whole value is on the hover.
2. **Restore** on a line puts the old value back into the row and lets the platform save it. It is an ordinary change: authorised, merged with everyone else's work, logged, and itself restorable. A line that cannot be put back (a submission, a reorder, a setting, a row that was added) shows Restore greyed with the reason.
3. **On a unit's or function's own page**: *"Last changed by X, today 05:16 · See history"* on the pane band, opening the same table scoped to that place in a dialog. A custodian who has no Setup still has this.

## Decisions (Islam's, 2026-09-03)

1. The page is the office's by rule, like the Platform Inbox. Everybody else reads only a place they hold a role at, through the door on that page.
2. Restore is an ordinary change, never a database rollback. A rollback would silently destroy everything done since.
3. The read is filtered (person, place, kind, window, a cap of 500) — one indexed query on the log, never the graph. A filter change fetches again; the count is of what was fetched.
4. The button is called **Restore** (offered to rename to Recover; not asked for).

## Server

`GET /api/state?log=1&person=&target=&kind=&from=&to=&limit=` → `{ ok, office, log:[…] }`. The office may ask any slice; anybody else must name one `target` they hold a role at (read off the stored register and the world) or is refused with 403. No session → 401. The ordinary read is untouched.

## §592 — A removed row's Restore, and the plan as it stood on a day (2026-10-23)

Islam: *"if I remove a line fully do I get history of the plans somehow to check what was it on a certain date the way google docs history work?"* — answers: **old position**, **on screen is enough**, and **on the Plan page** for the office.

1. The log carries a row that left or arrived **whole, with its seat** (holder, list, index, length) — `structuralRows()` in `lib/authorize.js`. The gate is unchanged.
2. On History the line reads the seat (*MB01 · measure 2 of 5 → removed*) and **Restore puts the row back at that index**, with everything it held. A value on a removed row is held until the row is back. Rows removed before §592 keep the greyed button.
3. On a unit's or pillars function's **Plan page**, after *See history*: **As it stood on…** (office only). The page draws a copy rebuilt from the log — newest first, each value before put back, rows re-seated or taken out — under a banner; read only by `mayAuthor()`'s own guard; rows removed since wear *Removed since*. The live graph is never touched. What cannot be replayed (a reorder, a pre-§592 entry, a capped entry) is counted in the banner.

Not yet: the company's own plan, and a projects or objectives function. Proof: `checks/history-asof.py` (34 green, 21 red on the previous build), `test-authorize` +5. Mockups: `design-mockups/history/2026-10-23_removed-row-and-as-of-real.html`.

## Not done, and said

- Work that never reached the server leaves no line. The save-safety banners (§258) stand in front of that.
- A reorder has no Restore. A SWOT line is restored whole.

## Proof

`SMP-Project-Folder/src/checks/history-page.py` (25 red on `main`'s build) and `scripts/test-history-read.js` (real handler, real Postgres).
