# 021 · The Setup header line

**Status:** built (v3.48, §135)
**Asked for by:** Islam, 2026-08-27, from using the Setup pages on his own laptop
**Mockups:** `design-mockups/setup-refinements/2026-08-27_setup-header-line.html`,
`design-mockups/setup-refinements/2026-08-27_marking-and-the-matrix.html`

## What was asked

Eleven items. Seven of them are one standard applied to every Setup page; the
other four are separate decisions.

## 1 · One line per page

**Every Setup page draws ONE pinned row: its name, then its search box, then its
own buttons.** Nothing else stands between that row and the page's content.

- The page's controls reach the shell through `PAGE_TOOLS` (the search) and
  `PAGE_ACTS` (the buttons), reset before the page renders and read after —
  the same trip `PAGE_TITLE` already makes in the other direction (§121.1).
- `cfgHead()` and `tkBar()` write into those slots and return nothing. A caller
  outside a Setup page (`PAGE_TITLE == null`) still gets the old row.
- The row is `nowrap` and **the title is what gives way**: the controls are real
  buttons and cannot honestly be narrowed; a long page name can ellipsise
  without anybody losing a control.

## 2 · What is drawn on it, and what is not

| Gone | Kept |
|---|---|
| the `SMO` / `SMO only` / `Everyone` pill | an ALARM chip — something outstanding |
| every count chip (*10 names*, *10 units*, *8 capabilities*, *all assigned*) | |
| the quick-filter chips (*Retired*, *Unmapped*, *Mapped*, *Unassigned*) | the search box |
| the row count (*10 rows*) | |
| the grey briefing paragraph on every page | a real section heading |

**Dropping the filters hides nothing.** Every row carries
`data-tkrow="active|retired"` and every one is drawn — the chips narrowed a
view, they never revealed rows the table was holding back.

## 3 · Roles & access

The matrix's `thead` is `position:static`. `.acgrid` is `overflow-x:auto`, which
makes the box — not the page — what a sticky head pins against, so §121.4's page
offset was being applied inside it.

## 4 · Focus measures

- **On / Off**, a segmented pair on the pinned line.
- **The destinations are a row**, `Units | Functions` and then the places, each
  carrying its own mark count.
- **One table**: Measure · Target · Focus, banded by key objectives and then by
  pillar (a unit, or a pillars function) or by capability (a capability
  function). The band is `--line` with `--ink-2` — a band that has to be told
  apart from the zebra stripe cannot be a lighter shade of it, and it must not
  be the same navy as the `<thead>` above it either.
- **Supporting functions can be marked**, and the group's Focus board shows
  them beside the units.

## 5 · Send an email

- *Send a message* → **Send an email**; *Inbox* → **Platform Inbox**. Keys
  unchanged (`send`, `chat`).
- **Two sections**: *Compose* and *Email settings*. `Setup › Email` leaves the
  rail. Each section keeps its own access key, so a `c_comms` holder without
  `c_send` still reaches the settings half.

## 5a · The table head pins flush under the page header

`--sethead-h` is published by a ResizeObserver from `.setuphead`'s measured
height, re-pointed at the end of every `paint()`. A literal cannot be right:
the header is 42px where the controls are small, 49px where a search box sits
on the line, and taller again when it wraps. Any positive gap between the two
pinned boxes is a slot that scrolling rows show through.

## 5b · The rail's own head

`.rhead` and `.railfind` are `position:sticky` inside `.setuprail`, on top of
the rail already being sticky against the page. Redundant wherever the rail's
`max-height` applies; load-bearing where it does not (no `100dvh` support;
below 900px, where the split stacks and the rail is uncapped).

## 5c · Focus measures sits with Measurement

`grp:"meas"` rather than `grp:"cycle"`. The marks belong to the cycle, but the
rail's groups answer what somebody came to do, and they came to say which
measures matter. Nothing else about the page changes.

## 6 · The company on a person's row

- A **Company** field beside *Unit or function*, and a **Company** column on the
  register (off by default).
- **Read-only wherever the unit has already answered it** — a person in Mobile
  reads *Distribution*, from `units.company`.
- **Writable where nothing else has**, through `attachPersonAt()`, which clears
  the other two pointers. One stored fact; two fields that cannot disagree.
- Companies left the *Unit or function* dropdown. A role held at a company is
  refused until the Company field answers, the refusal names that field, and
  either half completes the grant (§110).

## Checks

`src/checks/setup-header.py` — every page walked, every control pressed, the
matrix measured at three scroll positions on a window short enough to scroll,
and a function's focus mark asked of `CYCLE.focus` after the press. Proved able
to fail: **33 failures against the previous build**.

Also updated: `register-header.py`, `focus-switch.py`, `role-picker.py`,
`send-message.py`, `table-standard-all.py`, `setup-search.py`, `setup-rail.py`,
`people-dialog.py`, `duplicates.py`, `identity-merge.py`.

## Open

- **Not reproduced:** the left rail's own header and search bar reported as not
  sticky. Measured holding at nine window sizes and three scroll positions on
  this build and on `main`'s.
- **Flagged, not built:** the Email settings section lost the note explaining
  that the API key and from-address live in the deployment's environment
  variables. It stated a fact rather than describing a setting (§127), and
  without it somebody will look for a field that does not exist.
