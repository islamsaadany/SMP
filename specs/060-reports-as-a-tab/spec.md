# Spec 060 — The reports, as a tab in the platform

**Asked for** 2026-09-20 by Islam, of the Insights module:

> *"for the users not the smo they can see the insights as a tab beside the
> tabs visible to them. better usability than going to another module. the
> module is managed by the smo which is relevant but the user to move between
> modules is not very usable. align wiht me"*

Built as **§375**.

---

## 1 · What was actually wrong, measured before anything was proposed

A client's own person opening the platform reaches the Insights library through
the **module switcher** — a four-square mark at the far left of the pale top
bar, with no word beside it, in a different row from every other piece of
navigation. Pressing it opens a menu of two: the module they are in, and the
reports.

Three things were true of that and none of them is a matter of taste.

- **The mark is not navigation-shaped.** Every destination, tab and section in
  this product is a word on a navy row. This is a picture on a white row.
- **For a client's person the menu holds one useful entry.** The other is the
  page they are standing on, which `route.js` correctly makes do nothing.
- **And it offers doors that refuse them.** `decideOpen`'s first rule is *a
  module with no declared area is open to everybody the door let in*, and the
  Internal Tracker and Meeting Notes declare `areas: []` because they are the
  office's and refuse a client's person **at the page**. So a client's person
  on a tenant holding either is offered it and turned away. Named here as a
  precondition; see §5.

## 2 · The three placements, drawn

`design-mockups/insights-in-navigation/2026-09-20_where-the-second-module-lives.html`
— three at real size in the product's own chrome (rule 1c), published as an
Artifact and signed off. Islam picked **C**: a real tab beside Strategy and
Performance.

**C was the one recommended against**, so the cost is his and is recorded
rather than re-argued: those tabs are three views of **one subject**, and this
library is the **client's** — press *Retail Stores* and it shows the same
reports. It was drawn that way, side by side, before he chose.

One objection made in that first drawing was **withdrawn** in the second, in
the open: I said C costs "a second copy of the library". Reading
`insightsDocument` showed the rows can be lifted into a function both surfaces
call, so the drift objection was wrong. The untruth objection above stands.

## 3 · The three decisions, confirmed

`design-mockups/insights-in-navigation/2026-09-20_the-tab-from-the-inside.html`
— the room behind the tab, and the three questions the placement leaves.
Answered *"yes to three"*; the word on the tab was left unanswered, so
**Insights** stands, being the module's name everywhere else.

1. **Every destination carries the tab** — a unit, a supporting function, a
   company and the group.
2. **The address stays the module's own.** The ordinary address would be
   `/raya-trade/strategy/mobile/insights`, which names a unit in a link that
   is not about that unit. The tab writes `/raya-trade/insights` instead.
3. **The four-square mark is drawn only where the tabs cannot reach it.**

## 4 · What was built

| Piece | Where |
|---|---|
| The row builder, shared by the module's page and the tab | `modules/insights/page.ts` — `libraryRows`, `readLibrary`, `libraryFragment` |
| The tab's answer, as JSON | `GET /<client>/insights/list` |
| The stamp that says there is a library | `lib/shell.ts` — `data-library-cats` |
| The tab, its sections and its pane | `SMP-Project-Folder/src/insights.js` (`LIBRARY`) |
| The tab on all four destination kinds | `src/shell.html` — `LIB_TAB`, declared once |
| The pane's design | `src/group-extra.css`, every rule scoped to `.libpane` |
| The address, and the switcher standing down | `smp-app/shell/route.js` |
| The check | `smp-app/checks/insights-tab.mjs` |

### The rules it obeys

- **One renderer, two hosts** (§53.5, §364). A report's title, its fact line,
  its date spelling and its download button come from one function, so the tab
  cannot spell a report differently from the module's own page.
- **A failed read is not an empty one** (§93). The count has three answers —
  a number, *Asking…*, and an em-dash — and an unreadable library says so and
  promises nothing has been lost. It must never read as *nothing has been
  published*, which is what an empty list says and is a different sentence.
- **Typing never repaints** (§35). The search box sets what was typed and asks
  nothing; Enter and the Search button ask. The row the box sits in is not
  rewritten when an answer lands — only the list and the count are.
- **Never `paint()` from a fetch** (§71.2) — `history.js`'s own pattern.
- **Nothing is drawn over `file://`** (§61): the contingency copy has no server
  to ask, and the test is the served document's stamp rather than the protocol,
  so there is one answer rather than two that can disagree.
- **A class name is one global namespace** (§65.9). The module's classes are
  `.list`, `.item`, `.body` and `.none`; every rule carried into the platform
  is scoped to `.libpane`.

## 5 · Recorded, not done

- **Tracker and Notes are still offered to a client's person** on a tenant that
  holds them, and still refuse them at the page. Decision 3 removes *Insights*
  from that menu and does not close this: for a client with Strategy and the
  reports the mark disappears entirely, and for one that also has an office
  module it remains, listing that module. The honest fix is the module's own
  area declaration, which is a change to two modules this round was not asked
  about (rule 1b). **My second mockup said decision 3 closes it "for free";
  that is true of the shapes in front of us and not in general, and the
  over-claim is corrected here rather than left standing** (§124).
- **A shared or reloaded `/<client>/insights` link opens the module's own
  page**, not the tab — the same reports, the whole window, its own way back.
  The room differs; the reports do not. Stated rather than discovered.
- The tab shows the **client's** reports on a unit's page. §2's cost, accepted.
