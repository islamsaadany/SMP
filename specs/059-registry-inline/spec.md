# Spec 059 — the client's People register: a cell is the control

**Asked for by Islam, 2026-09-17.** Built as §366.

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
* `checks/people-dialog.py` §2 — one control per cell, none past its cell.
* `checks/seat-grant.py` §3 — a seat still asks before it lands, and Cancel
  leaves the list exactly as it was.
* `checks/smo-team.py`, `checks/forefront-team.py` — granting through the ticks.

Proved able to fail three ways from the sources (§366.11).
