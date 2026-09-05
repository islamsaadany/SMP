# 039 · Reporting is a tab

**Status:** BACKFILL of built behaviour — nothing here is new, and nothing here
is a proposal.
**Decisions:** §222 (+.2), revisiting §63 · §41 · §61 · §63.2 · §94.15 · §220 ·
§221
**Constitution:** checked against v1.2.0 — Principle VI (follow what the
platform already does) and XIII (a colour that works as a fill fails as type).
**Related:** spec 035 (what Submit refuses and where it is held), spec 019 (the
Strategy | Reporting split in the access matrix).

---

## 0 · Why this document exists

This is a small change with a **reversal** inside it, and reversals are the ones
worth writing down: §63 took Reporting *out* of one place for a stated reason,
and §222 put it somewhere else. Read as two log entries they look like a mind
changed twice. They are not, and the difference is the whole of this document.

**It changes nothing.** Where this and the product disagree, the product is
right and this file is the defect.

---

## 1 · What §63 decided, and why it still holds

§63 removed a **Reporting section from inside Performance**, on Islam's own
point: *"performance is a result of reporting, so having inside performance 2
buttons performance and reporting actually doesn't make sense."*

**That argument was about two siblings under one heading, and it is still
true.** Reporting is not a subdivision of Performance; Performance is what
Reporting produces.

---

## 2 · What §222 changes, and why it is not a reversal of that

*"how about for the reporting to split it as a tab beside the Strategy and
Performance to be more obvious to the users with its distinct orange colour."*

**A top-level tab is a different placement, not the same one restored.**
Reporting stops being buried inside the thing it produces and sits beside it.
Recorded as a change of mind about placement rather than as an oversight in §63.

Three treatments were drawn **in the real page** (rule 1c) and Islam picked
**B**, the solid fill when selected.

---

## 3 · What went with it

**The Report button is deleted, not left uncalled.** A button that opens what a
tab beside it opens is **a control with no audience of its own** — §94.15's
argument, which retired the Arrange button for the same reason. `reportBtn()` is
gone (§24).

**The accent budget is unchanged because the fill MOVED rather than
multiplied** (§41). §94's ruling — *"make it all orange to obvious for the
user"* — survives the move as the tab's fill.

**`when` is the cycle, `ac` is the grant.** `allowed()` already asks the grant,
so the tab's definition answers only the other half — **the same pair
`reportBtn()` asked**, because a tab that opens nothing is worse than no tab
(§61). Measured: cycle closed → two tabs; cycle open → three.

**Being on the tab IS the mode**, set once in `paint()` rather than inside each
of the two render functions, or a unit and a function would carry their own copy
of one rule (§53.5).

---

## 4 · The tab created a fault, and the check caught it

**Close went dead.** `REPORTING` is now set by `paint()` from the tab you are
on, so the old handler's `REPORTING = null; paint()` **put it straight back** —
the control rendered perfectly and did nothing.

> §96's family exactly: *a control that renders correctly and changes nothing is
> invisible to every assertion short of asking whether the state moved.*

Close leaves the **tab** now, landing on whichever tab is marked `primary`, read
off the **row** rather than from a list of keys in the handler.

---

## 5 · The colour, corrected by using it (§222.2)

*"the reporting button should always become orange even if it's not open, and
it's appearing as long as the cycle is open."*

§222's first build gave the orange to the **word** when unselected and the fill
only on selection — **so the tab was quiet in exactly the state where somebody
needs to notice it.** The old Report button was solid at all times, and this is
that volume moved rather than a new one added.

**Selection is still said**, in `--cta-hover` — the deeper half of the same
pair, declared for every palette beside `--cta`, so it needs no new token and no
literal (§25). *A tab that never changes when you are standing on it stops
answering "where am I".*

**And the orange is two tokens, because §38.4 cuts both ways** (§94.8): the
bright orange that works as a **fill** cannot carry white type at 2.46:1, and the
deep orange that works as **type** cannot carry the page's ink. `--cta` and
`--cta-ink` are declared together, one line per palette.

---

## 6 · What the move exposed elsewhere

**Nine checks pressed the old button** (§51.11, for the seventh time). All nine
were repointed — **and the first sweep did it with a blanket string replacement
that put double quotes inside double-quoted Python strings and broke four files
at parse time.** An unquoted attribute value is valid CSS and cannot close a
string of either kind.

**Four checks then found real work**, and each is a lesson worth keeping:

| Check | What it found |
|---|---|
| `perf-line` | asserted three controls on the tab row, and there are two |
| `strategy-office` | measured the tab's ink against a **transparent** ground and got a meaningless 3.79 — the fill exists only while selected, **and the node must be re-queried after the press**, since selecting it repaints the row and `getComputedStyle` on a detached node returns empty strings |
| `report-chrome` | measured Submit's fill on a report §221 had **dimmed** |
| `project-tables` | could not press Submit at all — **Playwright treats `aria-disabled` as disabled**, and the press is forced there because the click handler is still the enforcement |

**And six of the ten demo units ship already submitted**, so with §220's lock
they now open read-only. **That is the feature working, and it changes what the
demo shows** — stated rather than absorbed.

---

## 7 · A save that did not happen does not close the report

§220's rule, corrected here. The first build **parked before the save** and
repainted in the callback, which broke §63.2 — the outcome is written into the
button a repaint replaces, so the word vanished in the frame it appeared and
three checks went red — **and worse, it parked a report whose save had failed.**

Now: **save, park only on success**, and let the repainted bar be the
confirmation, since it says *Draft saved* in its own right.

---

## 8 · Requirements, as things that can be checked

- **R1** The tab is drawn only while a cycle is open **and** only for somebody
  who may report — both halves asserted.
- **R2** No Report button exists anywhere; the tab is the only door.
- **R3** The tab is orange unselected and deeper when selected — measured as
  paint, on a re-queried node.
- **R4** Close leaves the tab and lands on the `primary` one, read off the row.
- **R5** Parking writes only after a successful save.
- **R6** `--cta` and `--cta-ink` are declared as a pair in every palette.

---

## 9 · Traceability

| Behaviour | Section | Check |
|---|---|---|
| The tab, its gates, Close | §222 | `checks/report-chrome.py`, `perf-line.py` |
| The colour, both states | §222.2 | `checks/report-chrome.py` |
| Submit's own gate, unchanged by the move | §221 | `checks/submit-gate.py` |
| The lock a submitted report carries | §220 | `checks/submit-gate.py` |
| Reporting reaches the stored plan | — | `checks/report-saves.py` |

---

## 10 · Open, and recorded rather than done

- **`report-chrome.py`'s *Submit is filled* assertion could not pass on the
  shipped data** — all ten demo units are blocked by something, so the filled
  state is unreachable there. Rewritten in §280.1 to assert **both ends** (held
  and saying why; filled the moment the gate opens, with the open state **made**)
  — recorded here because it is this section's assertion that went stale.
- **The demo now opens six units read-only**, which is correct and is a change
  to what a first-time viewer sees.
