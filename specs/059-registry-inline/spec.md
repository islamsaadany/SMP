# Spec 059 — the client's People register: a cell is the control

**Asked for by Islam, 2026-09-17.** Built as §368.

> *"for the client registry I'd like to do some in line adjustments like the
> phone, employee ID, email, the unit/function, job title, etc. and about the
> roles why do I need to add them as chips why can't we make it a multi tick
> serarchable drop down to add the roles?"*

## 1 · What it is

Two changes to **Setup › People register** inside a client platform. Nothing on
the Forefront consultants list moves.

1. **A cell opens where it is.** A double-click on Name, Full name, Emp. ID,
   Job title, Official BU, Unit or function, Company, Email or Mobile turns
   that cell into the field the dialog already draws for it. Enter stores it,
   Escape throws it away, leaving the cell commits it.
2. **The Roles cell IS a ticking list.** Pressing it opens the platform's own
   searchable list with a tick per role; the chips it already draws are the
   closed control's label.

## 2 · The decisions

| # | Decision | Whose |
|---|---|---|
| 1 | A cell is opened by a **double-click**, because a single click already copies an address or a number (§93.6) | Islam |
| 2 | The roles control is the **cell itself**, never a box beside the chips | Islam |
| 3 | There is **no × on a chip** — unticking is the way off | Islam |
| 4 | One cell open at a time; the dialog stays for a whole row | Claude, stated |
| 5 | A row the Forefront platform **minted** stays read-only; a row it **adopted** is the client's own person and opens (spec 058 §3a.1) | carried |

## 3 · What is NOT in it

* Adding a person, retiring one, and the attention queue are untouched.
* No new stored field, no migration, no server rule — asserted (§172).
* Roles a person holds somewhere this register cannot reach, and roles that come
  from being named on a plan, are **stated above the list** and never ticked:
  the ticks are what this cell can set.

## 4 · Where it is checked

* `checks/role-picker.py` — the list, the open cell at four widths, and what
  Enter and Escape do to the DATA.
* `checks/people-dialog.py` §2 — at rest the table holds no control; a
  double-click opens one, and it fits its cell. Served over HTTP, which is the
  only place §368.16's blur fault is visible at all.
* `checks/seat-grant.py` §3 — a seat still asks before it lands, and Cancel
  leaves the list exactly as it was.
* `checks/smo-team.py`, `checks/forefront-team.py` — granting through the ticks.

Proved able to fail three ways from the sources (§368.11), and four more for
§368.14–.17: the caret back (8 red), the boxes back on `width:100%` (4), the
roles list left standing at rest (16), and the blur guard removed (4, over
HTTP).

## 5 · What the second round settled (§368.14–.17, 2026-09-18)

Islam, testing it: *"on opening something the arrow appears, no need for the
arrow. and for the roles as well ... the table in general should look everything
fixed and not editable until I made the double click."*

* **No caret in this table.** It announces a list the double-click has already
  opened — and as an inline span after a block label it fell to its own line,
  taking the open row 38.6 → 59.6px.
* **The roles cell opens like every other cell**, keyed on `PROLEPICK` rather
  than `PCELL`, because a ticking list fires `change` on every tick.
* **One height for an open cell**, whichever kind it is: `.cfg input`'s own
  12.5px / `4px 7px`, which cannot reach a `<button>`. Asserted as the
  agreement, never as the number.
* **A save's repaint no longer closes the cell** — §368.16, a live-deployment
  defect invisible over `file://`.

## 6 · What the third round settled (§369, 2026-09-19)

Islam, testing it again: the open Unit box lying across the Email column, and
*"you added the 3 dots to the roles whihc is wrong the 3 dots is out of this
column."* Both drawn out of the running platform and signed off first (rule 1c);
of the two answers offered for the second, he picked **A**.

* **An open cell is capped to its own column.** `width:auto` fills for an
  `<input>` and shrink-fits for a `<button>`, and `.ssbtn` is
  `white-space:nowrap` — so a long label put 261px of control in a 176px cell,
  93.6px into EMAIL, taking the email's clicks. `max-width:none` →
  `max-width:100%`, measured with and without the column's declared width.
* **The frozen column says it is frozen.** The ⋮ was never added to Roles; it is
  the last column, frozen since §69.19, floating over whatever scrolls beneath.
  Its seam had **never painted** — no `box-shadow` draws on a `<td>` under
  `border-collapse:collapse` — so it is a `::before` wash now, `--froze-wash`
  declared in all four palettes.
* **The `fits` assertion had no data to exercise it** (§255). It is the right
  property and it passed throughout, because the demo holds no label long enough
  to overflow. The state is made and put back there now.
* **The seam is measured as PAINT** — two screenshots either side of the wash,
  which must differ — because reading the declaration is exactly what could not
  tell a live seam from a dead one.

Proved able to fail three ways from the sources — **4 / 8 / 8 red**: the cap
put back, the seam removed, and the seam declared as the box-shadow that never
painted. The last two go red identically, which is the finding: to the page,
a seam declared that way and no seam at all are the same build.

**Not done, recorded:** the kebab cell's block is declared twice in
`config.css`, byte for byte; and making the table fit a narrower window so it
never scrolls (option C) is untouched — it means giving up or narrowing a
column.
