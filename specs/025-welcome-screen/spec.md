# 025 · The welcome screen

**Version:** v3.58 · **Decisions:** §148 · **Status:** answered; built

Islam: *"let's work on a Welcome screen for the user with what needs to be
done with good design and name of company and smo and overview of his list of
actions and info to work on or take an intro round."* Settled over three
mockup rounds (design-mockups/welcome-screen/), with two of his corrections
becoming the design: the greeting leads on the left (band B, the tenant a
compact signature on the separator's edge), and no number ever stands without
its noun (variation C — the bare 3/4/1 badges were *"confusing"*).

---

## 1 · What is asked

1. A welcome screen for the signed-in person: good design, the company's
   name and the SMO's, an overview of their actions and information to work
   on, and a way to take an intro round.

## 2 · The design (§148)

- **One screen after sign-in, before the platform** — offered from `land()`
  beside the tour (§94.10), once per browser session (sessionStorage; a
  throwing store reads as seen). Never over `file://`, never on a projector.
- **The band**: "Welcome, `firstName()`" leads with role chips and the cycle
  state; the tenant (`GROUP.org` initials mark, name, "Strategy Management
  Office") signs on the right, every line starting at the separator.
- **"Waiting on you"**: rows computed by NOTHING new — `reportPending()` +
  `reportedCount()` + `submitBlockers()` for the submission,
  `seesGaps()`/`gapTotal()`/`gapMap()` for the plan's gaps (§145),
  `CHAT.unread()` for the office's reply. The office's list is the Setup
  Overview's own `attentionRows()` + `CHAT.officeQueue` (§108.10). Empty
  says "Nothing is waiting on you" (§45.2).
- **Doors press the platform's own controls** (`[data-u]`, `[data-s]`,
  `[data-md]`, `[data-setupgo]`, `[data-report]`), behind `setTimeout(…,0)`
  for §30.1/§145.14's reason. Continue names where the platform already is
  and steps aside.
- **"Take an intro round"** is the tour's visible offer (gated on
  `TOUR.storyFor()`, never the office §118) and its reachable home again
  (§119.4); starting it is a handoff to `TOUR.start()`. While the welcome is
  up, the tour's auto-offer is skipped — its memory untouched.
- **One solid CTA** (§41): Report's `--cta`, only while a cycle is open;
  missing counts wear `--bad-tx` as words (§38.5). All tokens; no `paint()`.

## 3 · Files

`src/welcome.js`, `src/welcome.css` (new, concatenated late), `shell.html` +
`build.py` (one script tag / two list entries), `sync.js` (the offer beside
`TOUR.offer`), `sw.js` (SHELL → v3.58-welcome).

## 4 · Proof

`checks/welcome.py` over HTTP with a stub (§94.11): three viewers, made
state (§94.2), agreement not constants (§94.8), doors pressed and read back
(§70), absences asserted, and proved able to fail against the shipped
pre-§148 file (§94.5). Full `qa.py` green.
