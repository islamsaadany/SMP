# Usability audit — Strategy module and the doors

**Against:** Jakob Nielsen's 10 Usability Heuristics (NN/g).
**Date:** 2026-10-10.
**Scope, as Islam chose it:** the Strategy module (plan, reporting, performance,
presentation, Setup) plus the two doors (`/<client>/sign-in`, and the landing).
**Not covered, and named rather than left as an absence (§54.5):** Portfolio,
Insights, Processes, the Internal Tracker, Meeting Notes, the Copilot (except
where it draws inside Strategy, §501) and Forefront's own console.

**This is findings only.** Rule 1b: nothing here is built, and any fix is a
separate decision aligned in plain words first. **Status lines and the "Where
this stands" section were added on 2026-10-16 and are marked as such; no
finding below them has been edited, including the three that turned out to be
undercounts.** Every finding below is a
MEASUREMENT of the sources, not a reading of the record — where a section
number appears it is there to say which decision the measurement bears on.

---

## Summary

Three real gaps, two decisions for Islam, five heuristics that pass on
measurement.

| # | Heuristic | Verdict on 10 Oct | Where it stands, 16 Oct |
|---|---|---|---|
| 1 | Visibility of system status | **GAP** — a successful save is silent | **CLOSED** — §527 (the saved tip), §535 (the door). Its ellipsis nit was never real on screen |
| 2 | Match system / real world | Passes (measured) | — |
| 3 | User control and freedom | Passes, with 26 browser dialogs against our own rule | **CLOSED** — §534. The count was 30, not 26 |
| 4 | Consistency and standards | Two findings: six date spellings; a dropdown that declares a pattern it does not implement | **CLOSED** — §537 / §537.1 (there were nine spellings, not six) and §536 (one of its three claims was wrong) |
| 5 | Error prevention | Passes well; one break of the house rule, in the Copilot | **CLOSED** — §538. There were four breaks, and this one was the mildest |
| 6 | Recognition rather than recall | Passes (measured) | — |
| 7 | Flexibility and efficiency | **GAP** — one keyboard idiom in the whole product, and it is the projector | **CLOSED, bar customisation** — §528, §536, §539 (the keys written down at last), §544 (arrows on every row of tabs), §546 (Alt+S / Alt+D / Alt+E), §547 (Alt+G, go to a place). Customisation is left, and it is a product question |
| 8 | Aesthetic and minimalist | Substantially passes; not fully measured, said so below | **UNMEASURED STILL** — the 224 `.why` / `.note` strings have not been read one by one |
| 9 | Recognise / diagnose / recover | A deliberate trade, pulling against this heuristic | **AWAITING ISLAM.** Not a defect; nobody has ruled on it |
| 10 | Help and documentation | **GAP** — the knowledge base is the office's alone | **DROPPED** at Islam's word, 16 Oct |

### Where this stands (added 2026-10-16)

**This section is the only part of this file written after 10 October.** Everything below it is the original measurement and is left exactly as it was taken — including where it turned out to be wrong, because what an audit MISSED is worth as much as what it found, and three of its findings were undercounts:

- heuristic 3 counted **26** browser dialogs over `shell.html` alone; a scan of the whole built file found **30** (§534);
- heuristic 4(a) counted **six** date spellings by searching for the browser's own formatters; there were **nine**, three of them written out by hand from a month array (§537.1);
- heuristic 5 named **one** control greyed the dead way while carrying a reason; there were **four**, and the one it named was the mildest of them (§538);
- heuristic 7 says the product has **one** keyboard idiom; it had **four**, and the real finding — that none of them was written down anywhere — it does not make at all (§539).

And twice it was read as a to-do list when it was not: the saved indicator it reports missing was built the day after this file was written (§527), and the ASCII-ellipsis nit under heuristic 1 was never true of anything on screen — only of the comments describing the button. **So: measure the product, never this file.**

---

## 1. Visibility of system status — GAP · **CLOSED**

> **Closed by §527** (the saving/saved tip, built 11 Oct — the day after this file) **and §535** (the door's refusal reaches a screen reader; the button says what it is doing). The ellipsis nit below is **not real**: the rendered string is `Open a new cycle&hellip;` and only the comments spell it with dots.

**A successful ordinary save is silent.** Measured in `sync.js`: `save()`'s
reporter is

```js
var say = function (state) { if (done) done(state); … };
```

so `"saved"` reaches **only a caller that passed a callback**. Eight call sites
do (`SYNC.saveNow`): Save draft (§63), the safety banner's reload-and-keep
(§258.2), one Setup switch, the mail test, the contingency copy. Every other
edit in the product — a target typed, an owner picked, a figure reported, a
quarter ticked, a weight changed, a note written — goes through the debounced
autosave with **no `done`**, so nothing on the screen says it landed.
`flushLeave()` fires a bare `fetch` and ignores the answer by construction
(*"leaving anyway"*).

**Only failures speak.** `showFailed("server", …)` and
`showFailed("network", …)` are good (§171, §502). There is **no persistent
saved indicator anywhere** — grepped across all 27 sources and `shell.html`.

**Why this matters more here than it would elsewhere:** the product has
deliberately no Save button (§268, §273.4 — *"the platform writes as you type,
so the word Save would say the work is lost until pressed"*). That is the right
call AND it means the one promise the platform makes about saving has no
visible confirmation. Nielsen's first heuristic is exactly *keep users informed
through appropriate feedback within a reasonable amount of time.*

**What is good, measured:** the pending vocabulary is plentiful and in plain
words — `Saving…` ×5, `Asking…` ×4, `Sending…` ×2, `Creating…` ×2, plus
`Updating…`, `Taking them…`, `Sending you a copy…`, `Reading the team…`,
`Archiving…`, `Deleting…`, `Bringing them back…`, `One moment…`,
`Saved — reloading…`. The product is good at saying *working* and silent about
*done*.

**One nit:** `"Open a new cycle..."` uses three ASCII dots where every other
string in the product uses `…`.

**The door:** `<button type="submit" disabled={busy}>Sign In</button>` — the
button goes inert while signing in and its label never changes, where the
product's own convention writes the outcome into the button (§136's *Write
another*, §312's *Opening…*). And the refusal `<div className="error">` carries
**no `aria-live` and no `role="alert"`**, so a screen reader is told nothing
when a sign-in is refused; the input gets no `aria-invalid` and the error is
not associated with the field.

---

## 2. Match between system and the real world — PASSES

Swept every quoted sentence in all sources for internal vocabulary — *graph,
payload, jsonb, schema, endpoint, tenant, slug, serialize, truncate, cache,
token, parse, array, field name, row id*. **One** hit reaches a person:
*"This platform has no notification key yet."* — the office's notification
diagnostic, where technical naming is the point (§123, §231.6).

This is the strongest heuristic in the product, and it is not an accident:
Terminology (§392) gives thirteen things the client's own word in two forms,
and §395 moved **139** places onto it. The residue is recorded and deliberate:
knowledge-base prose, hovers, workbook column headings, role names, the Focus
measures feature name and a pillar's kind.

---

## 3. User control and freedom — PASSES, with one systemic weakness · **CLOSED**

> **Closed by §534.** The count below is `shell.html` only; the whole built file carried **30**, the thirtieth being Discard in `sync.js`. Four mockups drawn and signed off first.

**What works:** Escape closes the platform's modal (document-level listener),
the searchable dropdown, the role picker and every field editor. Destructive
acts archive FIRST and can be restored (§232, §49.2, §115, §22 — *nothing an
import does is a deletion*). A removal that would orphan something is refused
BY NAME rather than proceeding (§62, §325). Retire is the default and delete
the exception (§338.1).

**The weakness: 26 `confirm()` and 11 `alert()` calls remain in the sources** —
and the record rules against them three times over (§95, §116.6, §273.3, and
`shell.html`'s own comment: *"confirm(), which can be silenced for good on some
other site"*). A browser dialog permanently silenced elsewhere means those 26
destructive acts **proceed with no confirmation at all**, and those 11 refusals
say nothing. Among them: closing a cycle, opening a cycle, removing a value, a
line, a route, a period, a driver, clearing a monthly plan, deleting a clip,
deleting an archive, bringing a retired person back with no role.

**And one `prompt()` survives** (`shell.html:5017`) — naming a new supporting
function. The record already says Islam hit that exact failure once
(`config-data.js:452`: *"`prompt()` was the control, and Islam hit the one
failure it has"*), and it was replaced everywhere except here.

---

## 4. Consistency and standards — TWO FINDINGS · **BOTH CLOSED**

> **(a) closed by §537 and §537.1** — and there were **nine** spellings, not six: this sweep searched for the browser's formatters and walked past three day dates written out by hand. The shape is Islam's: a day reads `5 Mar 26`.
>
> **(b) closed by §536** — and one of its three claims was wrong: Enter-to-pick was already there, and had been since before this file was written. The arrows and Home/End were what was missing.

**(a) Six date spellings.** Measured:

- `{ day:"numeric", month:"short" }` ×4 (two different spacings)
- `"en-GB"` + `{ day, month:"long", year }` ×2 — **the locale hardcoded in two
  places and the browser's everywhere else**
- `{ day, month:"long", year }` with the browser's locale
- a bare `toLocaleString()` — whatever the browser hands back
- the month picker's `Jul 26` (§177)
- `30 Sep` for the reports-due day (§307)

So how a date reads depends on which screen you are standing on.

**(b) The searchable dropdown declares a pattern it does not implement.**
`searchsel.js` builds each row as `<button role="option" aria-selected>` inside
`role="listbox"` with `aria-multiselectable` for ticking lists — which is the
ARIA listbox contract — and binds **exactly one key**:

```js
if (e.key === "Escape") { close(); btn.focus(); return; }   // searchsel.js:327
```

No arrows, no Enter-to-pick, no Home/End. It IS operable, because the rows are
natively tabbable buttons, so nobody is locked out — it simply does not behave
the way its own declaration promises, and assistive technology announcing a
listbox will expect arrow keys. This is the universal dropdown: every `<select>`
past five options in the product (§45.5).

---

## 5. Error prevention — PASSES WELL · **CLOSED**

> **Closed by §538** — and the break named below is **one of four**, and the mildest: nothing is hidden at the quarter marks, because the strip above that table already says which period the plan covers. The serious one is Restore in the change log, which this file does not mention.

Submit is HELD with its reason before the press rather than refused after
(§221, §279); `aria-disabled` rather than `disabled` wherever a reason must
stay reachable (25 uses, §163); deleting a client requires the name typed back
and the server asks again (§323); an upload AUTHORS and archives first, so
nothing it does is a deletion (§22); a seat change is asked out loud naming the
role and what it hands over (§186); a plan row that cannot be addressed is
refused rather than half-written (§314.2).

The door is strong here too: `autoComplete="username"` / `current-password` /
`new-password`, `autoCapitalize="none"`, `inputMode="email"`,
`spellCheck={false}`, a show-password toggle, and a refusal that deliberately
does not say WHICH of the two was wrong (§43).

**One break of the house rule, adjacent to scope:** the Copilot's quarter
buttons are `disabled` while carrying `title="Q3 is outside the plan period"`.
A disabled control fires no mouse events, so that explanation cannot be
reached — §163/§221's own fault, in the one module that draws inside Strategy.

---

## 6. Recognition rather than recall — PASSES

**No free-text person field remains.** §130.1 turned five plan fields into
register pickers; the sweep across all sources found one `data-pphone` and
nothing else. Every `<select>` past five options becomes searchable on its own
(§45.5). A clipped value carries a hover, and only when it is ACTUALLY clipped
(§88 — measured at paint, never guessed at render). The gap walk, the chips and
the rail marks NAME where work is owed rather than leaving somebody to find it
by eye (§272, §279). Codes carry their names on hovers (§88, §266.9).

---

## 7. Flexibility and efficiency of use — GAP · **CLOSED, BAR CUSTOMISATION**

> **Every bullet about the keyboard is answered, and its headline claim was wrong.** It says the product has ONE keyboard idiom. Measured against the sources at the time of writing it had **four**, and the finding it does not make is the one that mattered: *nothing on any screen said so*. There was no list of keys anywhere in the product.
>
> - a keyboard route between destinations, tabs and sections → **§544**. Not a missing feature but a promise already made: eight `role="tablist"` groups, none of which bound an arrow. §536 again, one control over.
> - no accelerator for Submit, Save draft or the pen → **§546**. Islam picked Alt+S, Alt+D, Alt+E. Submit JUMPS to the button rather than sending, at his word.
> - no type-ahead or Enter-to-pick in the universal dropdown → **§536**, and one of this file's three claims about it was wrong: Enter-to-pick was already there.
> - no shortcut to the next gap → **§528** (Alt+Enter), which predates this file's publication by two days.
> - **and a fifth the audit did not list: none of it was discoverable.** §539 wrote the keys down, and every idiom added since has appeared on that sheet the same day it was built.
>
> - a *"go to"* list → **§547**. Alt+G, built on §536's list rather than a second one, and reading the navigation's own buttons so there is no second idea of what the places are. A key per destination is **not possible** and the audit does not claim otherwise: destinations are each tenant's own units, capabilities and functions, so there is nothing fixed to bind.
>
> **STILL OPEN: customisation** — no saved views, no default filters, no favourites. This file is right to name it, and it is a **product decision rather than a usability fix**, so it is left rather than built.

**The platform has one keyboard idiom and it is the projector.** `present.js`
binds arrows, PageUp/PageDown, Home, End, Escape, `f` (fullscreen), `w`
(fit to window) and `P` (pause the clock). That is a real idiom, and it is for
the twenty minutes a quarter somebody is presenting.

Everywhere else there is essentially nothing. Of the **11** keydown handlers in
`shell.html`, every single one is plumbing — Escape to close, Enter to commit a
field, Enter to add a typed row. One genuine accelerator exists outside the deck:
`arrange.js` moves a row with ArrowUp/ArrowLeft from the keyboard (§266.10).

So the daily work — the plan pane, reporting, the register, Setup — has:

- no keyboard route between destinations, tabs or sections
- no shortcut to the next gap (the walk is a button only, §279)
- no type-ahead or Enter-to-pick in the universal dropdown (see 4b)
- no accelerator for Submit, Save draft, or the pen

Nothing is unreachable. It is all slow for the person who does it every day,
which is precisely who heuristic 7 is about. And there is **no customisation
anywhere**: the only per-person state in the product is the theme, the text
size in the Copilot, the folded rail groups, the remembered place (§173) and
the Setup rail's folds. No saved views, no default filters, no favourites.

---

## 8. Aesthetic and minimalist design — SUBSTANTIALLY PASSES, not fully measured

Rule 1b-ii (no grey descriptions under page and section headings) is honoured
for new work, and this is a measurement rather than a reading: **zero** `note:`
arguments are passed to a `section()` call anywhere in the sources. The 171
`note:` strings that exist are DATA — 139 of them in `group-data.js`, which is
Terminology's own per-row descriptions (§392).

Counted: **145** `.why` elements and **79** `.note` elements. `.why` is the
platform's own aside, and most of it carries a fact the screen does not
otherwise state — which 1b-ii explicitly calls information rather than a
description.

**What this audit did NOT do (§124):** read each of those 224 one by one to say
whether any is a description rather than information. That needs a page-by-page
pass and is the honest limit of this finding.

---

## 9. Help users recognise, diagnose and recover — A DELIBERATE TRADE · **AWAITING ISLAM**

> **Unchanged, and deliberately.** This is a decision nobody has made yet, not a defect anybody has left.

A failed save names the step it stopped at, which is §123's rule working as
designed. What it puts on a client unit head's screen is four lines of
developer vocabulary (`sync.js:963`):

```
HTTP 500 · reference 7f3a2c
Reason: not_null_violation
Table: measures
Server said: …
```

The values ARE sanitised names rather than a raw database message (§43, §502),
and §504 built the route that hands the reference to the office — so the
technical detail is there ON PURPOSE and it is what makes a fault traceable.

Nielsen's ninth asks for plain language and **no error codes**. §502 asks for a
traceable reference. Those pull in opposite directions and **this is Islam's
call, not a defect to fix.** The network sentence beside it is plain English and
right: *"The platform could not reach the server (…)"*.

`unsaved.js` shows `Not done — HTTP 500` on the OFFICE's own page, which is the
right audience for it. The client-facing banner is the question.

---

## 10. Help and documentation — GAP · **DROPPED**

> **Dropped at Islam's word, 16 Oct 2026** (*"drop the knowledge base"*). Left in full below rather than deleted: a finding that was decided against is a decision, and the next audit should find it already answered rather than re-raise it.

The Knowledge base page carries `when: function(){ return inOffice(); }`
(`shell.html:1010`) — **the office's alone**, per §119.4, which reversed §30 and
§37. So a strategy custodian, a unit head, a project owner and a contributor
have **no documentation page anywhere in the product**.

What they do have: the welcome screen's intro round (§148, which is also the
tour's live replay home), hover notes (**180** `title=` attributes and 12
`tip()` bubbles) and the chat corner to the office (§97).

Two consequences measured:

1. The **43 task recipes** (§103) and 64 knowledge-base answers — including the
   ones written specifically for a custodian and for an owner, and tagged
   `who:"others"` (§161.1) — are readable only by the group they are not for.
2. The Knowledge base page's own tour replay button (`config-render.js:5116`)
   is drawn for **nobody**: the office can open that page, and the tour refuses
   the office outright (`tour.js` `storyFor`, §118). The capability is not
   stranded — the welcome card replays it (§148) — but that button is dead
   furniture (§94.15).

§119.4 recorded consequence 2 at the time and left it. Consequence 1 is the
larger one and is not recorded anywhere.

---

## Method

- Every finding is grepped or driven from `SMP-Project-Folder/src/*.js`,
  `shell.html` and `smp-app/app/(door)/Door.tsx`, not read off the record.
- Where a measurement contradicted a suspicion it is reported as a pass:
  heuristics 2, 6 and 8 were each expected to show faults and do not.
- Two suspicions were **ruled out** rather than reported: the 171 `note:`
  strings are data and not section descriptions, and `"Islam Saadany —
  undefined"` is a comment recording a past fault, not live text (§303's
  discipline — establish what something is before calling it a defect).
