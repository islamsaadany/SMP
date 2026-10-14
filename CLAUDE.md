# Claude Code Instructions for SMP

> This file is automatically read by Claude Code at the start of each session.
> It contains project-specific instructions, guidelines, and configuration.
> Adapted 2026-08-20 from the HR_ERP rules file: the working rules carry over
> verbatim; the HR_ERP project context was removed and replaced with SMP's.

Full history: `CLAUDE.full.md` (archive, do not load whole)

This file is the working set. Every decision, changelog entry and build
command below that is reduced to one line keeps its full text in the
archive or in `SMP-Project-Folder/DECISIONS-AND-LOGIC-v3.22.md`. An index
line ends in a pointer: `→ §N` means read that section of the decisions
file; `→ full:N` means read `CLAUDE.full.md` from line N. Nothing was
deleted — see §531 in the decisions file.

---

## Steering Documents

SMP adopts the same steering system as HR_ERP. Read these:

1. **`CLAUDE.md`** (this file) — how to work, conventions, house rules. *(exists)*
2. **`PROJECT_DETAILS.md`** — technical reference: stack, schema, modules. *(not created; `db/schema.sql` and `DECISIONS-AND-LOGIC-vX.Y.md` carry this today)*
3. **`IMPLEMENTATION_PLAN.md`** — phases, scope, and the decisions log. *(not created; the phase plan lives in `IMPLEMENTATION_PROGRESS.md` and the decisions log in `DECISIONS-AND-LOGIC-vX.Y.md`)*
4. **`IMPLEMENTATION_PROGRESS.md`** — **live tracker of built / in flight / next / waiting on Islam. This is how progress is reported — updated in the same commit as the work it describes.** *(exists)*
5. **`specs/`** — per-feature specifications via spec-kit. *(installed and in use)*

**When any steering file changes materially, update it in the same commit as the code.**
A drift between specs and code is a documentation bug — report it before silently realigning.

---

## Working Guidelines

### 1. CRITICAL: Never Act Without Alignment
- **NEVER implement features or make significant changes without explicit user confirmation.**
- **When the user says "let's align first" — STOP and discuss before any implementation.**
- **Always present the plan/structure and wait for confirmation before coding.**
- **If uncertain about requirements, ASK — do not assume.**
- **This rule is NON-NEGOTIABLE.**

### 1b. CRITICAL: Align Before Every Fix or Change
- **Before implementing ANY fix or change, explain what you plan to do in simple, non-technical words.**
- **Wait for the user to confirm before writing any code.**
- **If there are multiple approaches, present them as options with a clear recommendation.**
- **Never redesign, restyle, or restructure anything that wasn't explicitly asked for.**
- **Stick to exactly what was requested — no extra "improvements" or visual changes.**
- **If a fix requires touching something the user didn't mention, flag it and ask first.**

### 1b-iii. PLAIN WORDS ALWAYS, NOT ONLY BEFORE A CHANGE (2026-09-12)
- **Islam: *"plain words"*, twice in one session, and then: *"plain words
  ALWAYS is that rule on claudemd?"*** It was not. 1b above says it about the
  moment BEFORE a change — *explain what you plan to do in simple,
  non-technical words* — and said nothing about the message after it, which is
  where most of the words are.
- **So it is the default for everything said to Islam**: what was found, what
  was built, what is left, what went wrong. Say the thing, then the reason. A
  section number is a reference, never an explanation — if a sentence only
  makes sense to somebody who has read §313, it is not written yet.
- **The words that carry weight stay**: a control's own name, a page's name, a
  figure. Those are the product's vocabulary and using a different one to
  sound simpler is worse than the jargon it replaced.
- **WHAT THIS DOES NOT REACH, said so it is not quietly widened**: the
  decisions document, the code comments, the commit messages and the checks'
  own prose. Those are the record, and the record is written for whoever has
  to change this in six months — it carries the reasoning, the measurements
  and the section numbers on purpose. The rule is about what is said to a
  person, not about what is written down for the next one.

### 1b-ii. NO GREY DESCRIPTIONS UNDER PAGE AND SECTION HEADINGS (2026-08-27)
- **Islam: *"remove the grey descriptions and stop adding descriptions to
  pages."*** A heading names the thing; a paragraph under it in grey saying the
  same thing again is furniture, and it pushes the content people came for
  further down the page.
- **Do not pass a `note` to `section()` for new work**, and do not add
  explanatory prose under a page title.
- **Where a sentence carries a fact the screen does not otherwise state**, it is
  not a description — it is information, and it belongs on a **hover** (`tip()`)
  or in the knowledge base, never as a paragraph. Flag it rather than deleting
  it silently: §127 made every line of chat-settings prose a tooltip for exactly
  this reason, and kept *"No one is set"* on the page because a status is not a
  description.
- Existing pages keep theirs until Islam asks for a sweep; this rule governs
  what is BUILT from now on.

### 1c. CRITICAL: UI Changes Require Explicit Approval
- **NEVER change any UI design, layout, styling, or visual element without explicit user approval.**
- **This includes: colors, borders, spacing, card designs, labels, icons, section order, font sizes — EVERYTHING visual.**
- **Product design language is navy/gold** (carried over from the Forefront house style; the SMP starting page already uses it).
- **When restoring a design, match the original EXACTLY.**
- **Describe the change in words and get approval before making it** — what moves, what it replaces, what it costs.
- **MOCKUP-FIRST (NON-NEGOTIABLE): never adjust a design — layout, structure, section order,
  styling, or any visual element — without first showing a static HTML mockup of the proposed
  look and getting explicit sign-off on that HTML view.** Build the mockup (self-contained
  HTML, navy/gold, saved under `design-mockups/<feature>/<YYYY-MM-DD>_<desc>.html`), wait
  for approval, and only then touch the real sources.
  **A MOCKUP IS PUBLISHED AS AN ARTIFACT, NEVER SENT AS A FILE TO DOWNLOAD**
  (Islam, 2026-08-24: *"the mockup needs to be always an artifact here not a
  downloadable html"*). A mockup exists to be LOOKED AT, and a file that has to be
  saved and opened is a review that happens later or not at all. The file still
  lives under `design-mockups/` — that is the record — and the thing handed over is
  the published page. **No "I'll just build
  it and you review at the end" for visual or structural changes.**
  *(REINSTATED 2026-08-24 at Islam's direction, reversing the 2026-08-20 note that retired it
  as belonging to the prototype era. Recorded as a reversal rather than overwritten, per
  Principle II: the intervening versions built visual work — §80–§85's table standard among
  it — under the weaker "describe it in words" rule, and that is why the reversal exists.
  `SMP-Project-Folder/mockups/` remains the historical record of what was settled and what was
  rejected; `design-mockups/` is produced again from today.)*
- **CONTENT IS ALIGNED IN CHAT, NOT IN A MOCKUP (2026-09-23).** Islam:
  *"content fix doesn't need a mockup it needs alignment here first mockup is
  for visual after we agree on content."* Words, descriptions, defaults, which
  rows exist and what each means are agreed here, in plain words, first. The
  mockup comes after, and only for how it looks.
- **After ANY UI change, save a snapshot of the changed file to `ui-versions/` (see UI Version Tracking below).**

### 2. Think Before Acting
- **Don't follow commands blindly** — analyze requests and challenge if something seems incorrect or risky.
- **Align before action** — if there's ambiguity or risk, discuss first.
- **Consider implications** — think through downstream effects before implementing.

### 2b. CRITICAL: No Unneeded Complications
- **Answer the question that was asked, at the size it was asked.** A small request gets a small
  answer — one script, not four; one file, not a set; one paragraph, not a briefing.
- **Deliver ONE thing.** Never hand over alternatives, variants, or a "quick version and a full
  version" and leave the user to choose. Pick the best one and give that.
- **A check must answer in words**, not leave the user to interpret a blank result.
- **Don't expand scope mid-answer.** Extra options, extra tooling, extra explanation the user
  didn't ask for are noise — flag a genuine concern in one sentence and move on.
- **Prefer the shortest thing that works**, and only add detail when the user asks for it.

### 3. Quality Assurance
- **Always verify before handing anything over.** With today's static-HTML stage, that means
  actually exercising the page (headless Chromium is available in-session). Once SMP gains a
  Node/TypeScript stack, run `npx tsc --noEmit` and `npm run build` before every handover.
- **A CACHED TYPECHECK REPORTS A CLEAN TREE ON A BUILD THAT DOES NOT COMPILE
  (&sect;320.5a).** `smp-app/tsconfig.json` sets `incremental: true`, so `tsc
  --noEmit` reads `tsconfig.tsbuildinfo` &mdash; and with a stale one it printed
  **nothing and exited 0 twice** on a tree holding `Expected 2 arguments, but got
  1`, finding it the instant the cache file was removed. Reproduced deliberately
  before it was believed. **Every recent "`tsc` clean" in this project may have
  been measured against that cache**, which is &sect;298.3's fault in the
  typechecker: *the count is not the verdict*. `npm run typecheck` deletes the
  cache first, and that is the only run worth quoting.
- **Fix type errors across the outcome** — don't leave TypeScript errors unresolved.
- **Test implications of changes** — ensure changes don't break existing functionality.

### 3a. CRITICAL: Audit Fixes Before Asking the User to Test
- **Never hand over a fix and ask the user to test it without auditing it yourself first.** The user's time is not a substitute for verification.
- **Prove the fix works with the tools available**, not by reasoning alone:
  - Run the project's checks (today: drive the page in headless Chromium; later: `npx tsc --noEmit`, `npm run build`, and whatever the stack adds).
  - For future DB/schema/seed changes, apply the SQL to a throwaway local Postgres and query the exact rows/columns the pages read — never assume seed SQL applied cleanly.
  - For behavior changes, trace the actual code path end-to-end.
- **State what you verified and how** when handing over. If something is genuinely un-testable from here, say so explicitly and explain the residual risk — don't present unverified work as done.
- **When a symptom persists, re-audit from first principles** instead of repeating the same instruction — find the proof before concluding.

### 3b. Engineering Preferences (Overrides Defaults)
- **DRY: flag repetition aggressively** — extract at 3+ repeats; flag at 2.
- **Edge cases: handle more, not fewer** — nulls, empty states, unexpected input, boundaries.
- **Aim for "engineered enough"** — not fragile, not over-abstracted. When in doubt, ask.
- **Explicit over clever** — readable, obvious code over compact/clever solutions.
- **Anything involving money, permissions, or rules must be server-authoritative** — never trust
  the client for enforcement. (SMP's current access gate is a client-side placeholder and is
  explicitly NOT real security — it must move server-side before SMP holds anything sensitive.)

#### A FLOOR CANNOT YIELD, AND THAT IS THE WHOLE FAULT (§158)
- `table { min-width:620px }` stops a data table squashing and is the right
  default. It is also a FLOOR: a pane that narrows past it does not shrink the
  table, it **cuts** it — 585px of pane against 620px of table at a 900px
  window, so the last column is sliced and the heading reads *COMPILE*.
  **§109 recorded the same global rule from the other side** (a small table
  overflowing its grid track by 300px): a good default in both directions
  still has two edges.
- **Anything that does not move the floor moves nothing.** Tightening cell
  padding narrowed the columns and left `scrollWidth` at 620 to the pixel,
  because the flexible column absorbs every pixel saved. Padding is what moves
  an **intrinsic** minimum, which is the different fault underneath — and both
  were present, one per side of the switch (§53.5).
- **An affordance is not a fix when the box only scrolls because of a bug.**
  §108.5's scroll shadow and visible track answer *this box scrolls and does
  not say so*; here the answer was for it not to scroll. It could not even be
  demonstrated: headless paints no scrollbar, and on an iPad the native one is
  an overlay that vanishes.
- **`.pane` INCLUDES SETUP** — `<div class="pane setuppane">` — so scope any
  pane rule with `:not(.setuppane)` or it reaches the register.

#### A CONTROL DOES NOT SHRINK, SO THE PROSE PAYS FOR THE WINDOW (§267)
- With the plan's pen open, **five of a tactic's seven columns hold controls**
  and their 666px is the same at 1920 and at 1100 — so every pixel the window
  loses comes off the two PROSE columns, which are the only elastic thing in
  the row. Measured: the Tactic column **269 → 192 → 115 → 74px** at 1400 /
  1300 / 1200 / 1100, the tallest row **191 → 1957**, and at 1100 the table
  stopped fitting its pane at all (§158, silently). **Read mode has none of
  it** — its seven columns are all text, so they shrink together — which is
  why four versions of sweeps at 1440 walked past it: the tables are walked,
  and they are walked CLOSED.
- **WHAT FOLDS IS A CONTROL, SO IT CANNOT BE A MEDIA QUERY.** A query hides a
  column; it cannot move one. Drawing the tail twice so CSS can pick a copy
  puts two things in the document writing one field (§53.5, with §96's failure
  mode). `tailFolds()` is read while the row is BUILT and is **one answer for
  the whole table** — the head, every row and the Add row's span, or they
  disagree about how many columns there are.
- **A RENDER DECISION HAS TO HEAR THE WINDOW CHANGE, AND A ZOOM IS A RESIZE**
  — which is exactly what was reported. Repaint only when the answer FLIPS
  (a dragged window edge fires on every pixel), **armed once** (§24, §47.2),
  and **never under a typing hand**: a bound field writes on `change`, i.e. on
  blur (§35), so the paint waits for the blur that was going to commit it.
- **A HEADING IS A CONTROL'S NAME.** Islam: *"the collab and the quarters to
  lose their haeders"* — right for the width, and a column head is the
  accessible name of every cell under it, so the word moves ONTO the control
  (`aria-label`, `role="group"`) rather than back onto the page (1b-ii).
- **DROP A FLOOR THAT NEVER BITES.** The mockup carried a `min-width` on the
  prose columns; with the fold and the stack in place the Tactic column is
  247px at a 1000px window on its own, so the floor would only be a thing to
  explain later (§2b).
- **A BOX SIZED AT PAINT TIME CLIPS ON A RESIZE (§267.2).** A growing field is
  sized by MEASURING its text (§189), at the end of a paint — so a window that
  narrows without crossing a repaint threshold leaves the box holding a height
  measured at the old width. **Only ever on a resize**, which is why nothing saw
  it: opened at 1000px, 0 of 15 boxes cut; **narrowed** to 1000px, 9. Re-fit on
  resize (one frame, sets a height, no paint, no state) — and assert it by
  NARROWING, never by loading, or the check passes on the broken build.
- **A KEY BELONGS TO THE BOX BELOW IT (§267.2).** Islam: *"the description title
  is stuck to the tactic box"* — a label with 3px under it and nothing over it
  reads as belonging to whatever ended above. The gap over is four times the gap
  under; assert **over > under**, never either number. And name a control only
  where nothing else does: with a column heading above it, a key underneath says
  the word twice on one row (§87), so the folded tail's two are named and the
  unfolded ones are not.
- **A FIXED RAIL BESIDE A SQUEEZED TABLE IS THE FIRST THING TO SPEND (§267.2,
  amending §162).** 196px of fixed width plus a gutter, beside the table through
  the whole band where the prose columns are collapsing — and its own names
  wrapping to four lines, so *the list is taller than the pane it is narrowing*.
  Across at 1200 is worth a third more width to the prose (Tactic 369 → 492px at
  1200) and takes 40–110px OFF every row. 820 was never argued as the right width
  for it; it is where the page stops being two columns at all.
- **A FIX FOR THE STRIPE IS NOT A FIX FOR THE HOVER (§267.1).** §73.2 gave the
  two FROZEN columns `background:inherit` so a striped row is striped all the
  way across, and answered the stripe only: `tbody tr:hover > td` is outranked
  by it, so a hovered row went grey **except** its first two cells — measured,
  `#EFF2F6` against `#FFFFFF`, with the step on the left edge of the cell after
  the name. **Older than the fold and measured identically on the build before
  it**; what the fold changed is that a sliver became a slab. Follow what the
  neighbours already do rather than deciding anew — on a STRIPED row the zebra
  beats the hover, so painting the pair grey there inverts the seam instead of
  closing it.

#### A BOX CAN BE CENTRED AND THE DRAWING INSIDE IT NOT BE (§302)
- Islam: *"the home icon is not centered in the top box."* **The box was
  innocent and saying so first was most of the work** — three sections have
  already answered a complaint about this one control (§197.2, §200.2, §202),
  so the first question is whether one came undone. None had: **6.00px above
  and below** in the 46px bar, **6.50px on all four sides** of the drawing.
  What sat low was the **painted house, by 2.06px**.
- **A HOUSE HAS A POINTED ROOF, SO ITS BOX CENTRES AND ITS MASS DOES NOT.**
  Nearly all its ink is in the lower half, and the eye reads weight — which is
  why **every assertion we had passed on the build he reported**: §202's four
  gaps measure the BOX. *An assertion about where a drawing sits is not an
  assertion about where it looks like it sits.* Measure the INK, as an
  **alpha-weighted centroid** off the painted pixels at 8× (§185, §294.1) — a
  **threshold** reports both builds identically, because the drawing reaches
  the same rows either way and what moved is where its weight is.
- **A FIGURE THAT DOES NOT MOVE WITH THE WINDOW IS ARITHMETIC, NOT LAYOUT.**
  The +0.50px across was the same at every width and every zoom: a 21px mark in
  a 34px square leaves **thirteen** pixels of slack, which cannot halve into
  whole pixels, so the browser snaps it. 20px leaves 14. Assert *the slack is a
  whole number*, never the mark size that produces one.
- **FIXING TWO THINGS AT ONCE MEANS RE-MEASURING AFTER THE FIRST.** 0.6 of the
  2.06 was that same snap, so correcting the slack and then shifting the full 2
  the mockup drew put the house **0.54px HIGH**; §302 shipped **1.5**, residual
  0.04. The mockup is left saying 2 — it is the record of what was signed off,
  not of what was built (Principle II).
- **AND THE OPTICAL SHIFT IS REVERSED (§302.3): THE BOX, NOT THE WEIGHT.**
  Islam, an hour after the merge — *"we need to center the drawing in the box
  not the weight ... go with A."* **The two readings cannot both be nought**,
  and that is the decision rather than a defect: §302's build put the drawing's
  own box **1.438px high**, measured. So the `transform` is DELETED, and option
  A turns out **not to be a smaller nudge but none at all** — at 20px the path
  is already centred in its `viewBox` to 0.062px, and a guessed micro-constant
  would only be a thing to explain later (§122.5). *The argument in §302 is
  right about how an eye works and wrong about what was asked for; both halves
  are kept.* **The assertion is REWRITTEN, never loosened** (§218): the
  drawing's bounding box, with the centroid measured beside it and **printed
  rather than asserted**, because asserting either is choosing against the
  other and that choice belongs in the decisions log, not in a tolerance —
  printed so the cost stays visible in every run. Falsified both ways from the
  SOURCES (§276), and **neither earlier build passes it**.
- **THE SLACK RULE IS ABOUT THE PAIR, NOT THE MARK (§302.4).** *"make the home
  icon bigger a bit but keep the box with teh same size"*, then, of three sizes
  drawn for him, *"24px"*. What must be even is **the square minus the mark**;
  20 was never magic. In a 34px box: 22 sits 6 a side, **24 sits 5 (shipped)**,
  and **23 is the reported fault again** (3 red, `slack 5.5`, `box 0.5`
  across). An odd size here is not a slightly different look. **26 is where it
  stops being free** — 4 a side meets the button's own 5px radius, so the next
  step up is a look decision rather than an arithmetic one.
- **THE CORRECTION LIVES IN THE DRAWING, NEVER IN A CSS NUDGE** — and with
  §302.3 there is no correction at all, which is the better end of that rule:
  the path's bytes and its `viewBox` are untouched either way, so §202's four
  gaps stay true and a mark drawn here later inherits nothing measured for this
  one. **And §202's own assertions needed no editing** — they assert that
  opposite gaps are EQUAL and never what they are, so they survived
  21 → 20 → 22 untouched: *a check written against the problem survives the
  fix* (§94.8).
- **The stroke is `--on-accent` #16325C, byte-identical to the bar's navy**, so
  the square's rounded corners classify as house ink and the mark measures a
  perfect 34×34 — that called a correct build broken twice before the sample
  was scoped to the drawing's own box.

#### A pinned header's ground filler paints when it is NOT pinned too (§53.7)
- `.pane > .pband::before` and `.split .rail::before` fill the gap between the
  chrome and the pinned pair with `--ground`. **CSS cannot ask whether a sticky
  element is pinned**, so they paint in the flow position as well — over
  whatever sits immediately above the split.
- The clearance is one rule: **`* + .split { margin-top: var(--pin-clear) }`**
  (`--pin-clear` = `--rail-gap + 2`). Never plain `.split`: a split that STARTS
  its container must keep `margin-top:0` or the rail's flow position stops
  matching its sticky offset and it slides the difference (§29.4).
- `.capline` carries the same number as its bottom margin, because on Projects
  the split is the capbody's first child and has no sibling gap to widen.
- `--split-gap` is the gutter, named once: the rail's filler has to reach across
  it to meet the pane's, or the band shows through as a tab between them.
- **Measure this in PIXELS.** `elementFromPoint` returns an element and a
  `::before` is not one, so a DOM probe calls the broken build clean.

#### A unit and a function are the same product — test both (2026-08-23, §53.5, A15)
- **Every functional or visual change is tested on BOTH sides of the navigation
  switch.** A business unit's page and a supporting function's must not drift
  apart unless something genuinely conflicts — and where it does, say which and
  why.
- **Walking both sides is not testing both sides.** The sweep had walked every
  function page for four versions and reported "ok" while three fixes sat on the
  unit's side only. Walking proves a page RENDERS; none of the three were
  rendering faults. The two pages were fine — they were fine *differently*.
- So `qa.py` **measures** the unit's Plan pane and the function's Projects pane
  and asserts they **agree** — the rail's track, the pane's box, its padding,
  the sticky offsets, the band name — never what the number is, so a deliberate
  change to both stays green and a change to one does not.

#### Lessons carried over from HR_ERP (apply if SMP uses React/Next.js)
- **Server pages people MONITOR must keep themselves live** — server-rendered pages never re-render on client-side navigation or while sitting open, so a badge/queue/tracker painted once goes stale. Pattern: a poller (mount + focus + interval) hitting a small API and broadcasting an app event, or a router.refresh-on-focus auto-refresher for whole pages.
- **Never close a menu/modal from a submit button's `onClick`** — React flushes click updates synchronously, so the `<form>` unmounts before the browser dispatches `submit`; the action silently never runs. Dispatch first, then close: `action={(fd) => { dispatch(fd); setOpen(false); }}`.

### 4. Git Workflow
- **Development branch:** the session-coded branch you start on (e.g. `claude/adminsmo-access-module-wj89vv`). All work is committed here.
- **`main`** — production/stable. Merge to main only when work is complete and verified.
- **Commit with descriptive messages** — explain what and why.
- **Push:** `git push -u origin <branch-name>`; retry on network errors with exponential backoff.
- **NEVER MERGE TO `main` WITHOUT ISLAM SAYING SO, ON THAT MERGE (2026-08-26).**
  Islam: *"don't merge without confirmation with me, not to damage things."*
  **A go-ahead to BUILD is not a go-ahead to MERGE**, and neither is a line in
  my own message saying the work could go to main on its own — that is me
  describing an option, not him choosing it. This was written after I merged
  the chat fix on exactly that inference. The word has to be about the merge,
  and it has to be his. Building, checking and pushing the BRANCH need no
  second ask; `main` is production, and production is his call every time.
- **BEFORE MERGING, FETCH MAIN AND LOOK AT IT.** `git fetch origin main` and
  compare — another session may have pushed while this one was working, and it
  has: §70 landed on main mid-session on 2026-08-24 while §71 was being built.
  Never merge blind.
- **Merge with `--ff-only`.** It REFUSES a divergent main instead of inventing a
  merge commit, so the moment two sessions have touched the same thing you are
  told rather than shown a silent auto-merge. On a refusal: fetch, merge main
  into the branch, resolve there, re-run the checks, then fast-forward.
- **`node --check sw.js` AFTER EVERY MERGE (§146.2).** Merging main spliced the
  two SHELL name blocks together: the branch's `const SHELL` landed INSIDE
  main's comment, the comment lost its opener, and the file ended with **two
  `const SHELL` declarations** and loose prose between them. **It did not
  conflict.** A worker that will not parse does not install, so every returning
  browser would have gone on serving itself the old shell — §91's own failure,
  by a route §91 does not name. `sw.js` is **not generated**, so no build step
  would have caught it; rebuild it from main's copy and re-apply the one line
  the branch changes, exactly as §91 prescribes for the built file.
- **AFTER A MERGE THAT BRINGS IN SOMEBODY ELSE'S SOURCES, REBUILD — never trust
  git's merge of the built file.** `strategy-management-platform-vX.Y.html` is
  generated; git will happily splice two versions of it into something that
  belongs to neither. Run `python3 build.py`, copy it over, and re-run the
  checks before pushing. Two branches each adding a `var pf` to `wire()` merged
  with no textual conflict at all and broke a page (§56.7) — a clean merge is
  not a working one.
- **`main` MUST HOLD A SHA NO OTHER REF HOLDS, UNTIL PRODUCTION HAS SERVED IT
  (§91, taught three times now — §91.4, §107.15, §108.17).** Vercel
  deduplicates by SHA, so a SHA on two refs is ONE deployment and which ref
  gets it is a race. **Order does not fix it** (§91.4), **delay does not fix
  it** (§108.17 — 32 minutes of not-building is not proof the race is over, it
  is proof the build has not started, which is the worst moment to offer a
  second candidate), and **neither does the standard procedure**: "merge main
  INTO the branch, resolve, fast-forward" creates the merge commit ON THE
  BRANCH, so pushing that branch hands Vercel the SHA on a preview ref first
  and `main` arriving later is a no-op (§107.15 — the same author's first
  merge of the day deployed and the second did not, differing only in when the
  branch was pushed). **Push the branch freely for every commit that is not
  the merge commit; hold the merge commit's branch push until §91.5's live
  check says production built.** The way back is a commit `main` holds and the
  branch does not, and it must be one worth making.
- **NEVER PUSH ONE COMMIT TO TWO REFS AT ONCE (§91, corrected).** Vercel
  deduplicates by commit SHA, so a SHA that reaches `main` and the branch within
  a second of each other produces exactly ONE deployment — and which ref it is
  attributed to is a race. Production sat three merges behind on §88 because
  that race was lost three times running. **Order does not fix it** (§91.4 was
  written saying it did, and `8de38f8` went to `main` first and still never
  built): what fixes it is the branch not carrying the same SHA. Push the merge
  to `main`, CHECK IT DEPLOYED, and only then fast-forward the branch. (The
  fetch-and-compare rule above still comes first.)
- **AFTER EVERY MERGE, READ THE LIVE SITE — DO NOT READ THE DASHBOARD (§91.5).**
  `curl https://smp-orpin-tau.vercel.app/sw.js | grep SHELL` and compare the
  built file's byte count against the local one. Three merges reported as
  "merged to main" were true and not deployed, and no amount of looking at git
  would have shown it. The deployment is part of the merge, and the only thing
  that proves it is the bytes the client's browser would receive.
- **AND BUMP IT TO A NAME NOBODY ELSE HAS SERVED (§94.12).** Two sessions
  merged on the same day and both independently wrote `smp-shell-v3.25b`. Same
  string on both sides, so **git merged `sw.js` with no conflict at all** while
  the bytes behind that name differed — and a worker caches by NAME, so a
  browser holding the other session's copy would never fetch this one. §91's
  fault by a route §91 did not predict. **`git show origin/main:sw.js` before
  choosing**, in the same breath as the fetch-and-look that precedes every
  merge: a merge will not tell you. **AND CONFIRM IT AGAIN IMMEDIATELY BEFORE
  THE PUSH (§94.16)** — it collided a SECOND time the same day, because the
  window between reading main and pushing is as long as running the checks, and
  a name chosen at the start of it is chosen from stale information. The
  confirmation is the LAST step of a merge, not the first.
- **EVERY RELEASE IS ANNOUNCED BY THE RELOAD BANNER, AND THE LIVE READ PROVES
  IT (§397).** §258's *"A newer version of the platform is ready"* hears of a
  release only when the browser sees `/sw.js` CHANGE. The served worker is
  generated with the frozen `SHELL` name dropped (§316.10), so from spec 054 to
  §396 it was byte-identical in every release and **the banner never fired for
  anybody** &mdash; the `SHELL` bump reaches only the offline copy. Since §397
  `scripts/build-sw.mjs` stamps it with `releaseStamp()`, a hash of every file a
  tab holds (`public/` less the worker, `shell/`, `lib/shell.ts`), so a release
  that changes any of them changes `/sw.js` and one that changes none offers no
  reload. **After every merge the served `/sw.js` must carry a stamp different
  from the one it served before the push** &mdash; read off the live site with
  the other witnesses (&sect;91.5); a release that touched only server code is
  the one case where the same stamp is correct, and the note says so.
  `npm run check:release` asserts the stamp is current and that every held file
  moves it; `check:release:red` must go red.
- **BUMP `SHELL` IN `sw.js` ON EVERY MERGE THAT CHANGES THE BUILT FILE (§91).**
  Not on a version bump — on a CONTENT change. It sat at `v3.22` through §80 to
  §90 because the built file kept the same filename the whole time, and the
  service worker caches by URL: every returning browser would have been served
  the old platform out of its own disk whatever production served. The trigger
  is "the built file's bytes changed", which is every merge.
- **A MERGE THAT CHANGES HOW A SAVE IS JUDGED SHIPS WITH THE FORCED SIGN-OUT
  (2026-09-03, spec 029).** Islam: *"if I'm on the old shape how saving what I'm
  doing now and reload save me? wouldn't what I save get lost as well?"* — and he
  is right for exactly one kind of deploy. The save-safety banner (§258) tells a
  stale tab to reload and saves first, which is enough when a deploy only
  changes pages; when it changes the authoriser, the change-list diff, the
  review map or what a save touches, an old tab's save can be refused and the
  banner's save-first has nothing to save into. So such a merge carries a
  one-shot `DELETE FROM sessions;` migration (precedent 040) and no tab can
  stay on the old rules. **Say which kind every merge is** in the what-to-check
  note.
- **END EVERY MERGE WITH WHAT TO GO AND CHECK** (Islam, 2026-08-24; CLAUDE-RULES
  A16). The last thing said after a merge to `main` is a short list of screens:
  what to open, what to do there, and what should happen — one line each, in the
  words of the navigation. No rationale, no section numbers; those are in the
  decisions document. **Anything the merge brought in from another branch is on
  the list too**, marked as somebody else's: it is in the product now, and not
  knowing where it came from is exactly why it needs pointing at. Anything that
  cannot be checked from a screen is named as such rather than left off.

### 5. Communication
- **Be proactive about issues** — flag concerns early.
- **Explain reasoning** — give the rationale behind suggestions.
- **Ask clarifying questions** — better to ask than assume.
- **Security risks are reported in four parts, in order** (CLAUDE-RULES A14):
  the issue in one sentence, **how it hurts us**, the solution in one sentence,
  and **what the solution costs — including what else in the system it touches**.
  One risk at a time, worst first. No finding tables, no option menus.

---

## Project Context

### What This App Is
**SMP is the Strategy Management Platform** — a consulting product for running a client's
strategy: group and business-unit plans, derived scoring, reporting cycles with snapshots,
focus measures, capabilities with enhancement projects, import/export, and presentation mode.
The prototype's demo tenant is Raya Trade (group shape); only Mobile's plan content is real,
everything else is labelled invented.

**DIRECTION SINCE 2026-09-09 (spec 043, §314): THE REBUILD IS THE WORK.**
Islam's decision record, verified against the code and aligned question by
question: SMP moves to **Next.js with ONE shared Postgres schema and row-level
security**, reversing §36 and §313's schema-per-client eight days after that
merged. `users` (platform-wide logins) and `people` (a client's register) are
two tables linked by tenant and person; the tenant is set **per request**
inside a transaction on the direct connection, never per connection (§289's
lesson); the app connects as a **non-owner** role with `FORCE ROW LEVEL
SECURITY`, or the shared schema is weaker than the schemas it replaces; the
URL is an address the server checks, never the authority, and the
`raya-trade` fallback goes. **The single file takes no new features from
2026-09-09** — a client-blocking defect is a correction and is asked about
first. `smp-app/` is replaced on the branch; `main` is untouched until Islam
says merge. **Spec 043 was signed off 2026-09-09** with one change to the
plan: Raya Trade's data is carried across by a one-off migration proved by
running it (§314.1); RHI and El Abd start empty, the demo is seeded. The
first slice is a spike of nine database proofs, not a screen. **`plan.md`
was written 2026-09-09** with `data-model.md` (42 tenant-owned tables, not the
spec's first 44 — `push_keys` is per deployment), two contracts and a
`quickstart.md`; the four plan-stage choices in `research.md` §P1–P7 were
**answered by Islam the same day** — no auth library; Prisma with a wrapper,
`pg` if S6 fails; the checks pointed at Next; and **the save enhanced
(§314.2)**: every box still saves on blur and posts §210's change list, but the
server **writes only the rows the list names** — §241's row-addressed writer
is the only writer, the wipe-and-rewrite `writeState` is not carried over, an
unaddressable shape is a 400 and never a silent full rewrite (spike S9).
`tasks.md` written 2026-09-09 (72 tasks, one phase per proof) **and the spike
is green** (§314.3): nine proofs under `smp-app/spike/`, each red first —
`npm run spike` and `npm run spike:red` from `smp-app/` with the sandbox
Postgres up (`smp-app/spike/README.md` holds every first run). The shared
schema is `smp-app/db/schema.sql` (the source; Prisma introspects it), the
tenant is set only in `lib/tenant.ts`, the save is `lib/save.ts` over
`lib/state-io.ts`'s row-addressed writer, and the frozen reader and rule
modules are carried across as `.cjs` with the frozen tests green against
them. `tenant_id` DEFAULTS to the request's setting and the policy is
`NULLIF(current_setting(…, true), '')::uuid` — a once-set setting reads back
as `''` on a reused connection. **S1's Neon answer is in (§314.4)**: through
Neon's SQL editor, no connection string — `neondb_owner · rolcreaterole t ·
rolsuper f · rolbypassrls t`, the key makes the role and §P5's stop does not
fire; the sign-in-as-`smp_app` half runs on Neon at the first deploy.
**The first screen group is built (§315)**: the door (`/`, `/<client>/sign-in`,
the password card) and the landing (`/<client>`, the welcome screen), behind
the mockup Islam signed off with his own fourth wall line. **The landing's
rows are the frozen readers' own** — `smp-app/lib/frozen.cjs` runs the four
source files in a vm and asks them in one synchronous call, never a second
copy (§53.5). **The stylesheets are verbatim and LINKED from `public/`,
never bundled** (`scripts/sync-css.mjs`; the bundler refuses §272.8's stray
close-comment mark). `npm run check:door` drives the built app in headless
Chromium (44/0, red first). Every page behind *Continue* is a holder that
says it is the next group's. **The rest is drawn as ten phases in
`specs/043-shared-schema-rebuild/phases.md`** (2026-09-09) — the frozen
renderers and shell carried verbatim over the new API, client and routing,
six named stop points — **approved by Islam 2026-09-09 (A0)** with one
constraint: database work he runs goes through **Neon's SQL editor only**,
so every such step is handed as SQL to paste or runs at deploy from Vercel's
own environment, and one that fits neither is said rather than assumed
(§315.1). The phases run without stopping except at those points. **Phase A is
built (§315.2)**: `smp-app/lib/state-api.ts` behind `app/api/[slug]/state`,
the office row by the frozen rules with no membership written for a seat
held by rule, a malformed change list a 400, and the lock's remaining job
under the row writer named — the maps on one row — with `checks/state-api.mjs`
87/0 and six red runs (`npm run check:state`, `check:state:red`).
**Phase B is built (§315.3)**: the frozen shell is SERVED, all of it —
`scripts/build-shell.mjs` concatenates build.py's own list plus the shell's
inline block into one `public/shell.js` and `lib/shell.ts` serves it as a
document under `script-src 'self'` (no hash to go stale), with `sync.js`
CARRIED rather than rewritten (its boot, wall, save, refusal banner and
chrome are all screen decisions) and the new app answering the frozen
spellings `/api/state`, `/api/auth`, `/api/chat|mail|blob`. `shell/route.js`
is the one piece of new browser code: the address IS §173's remembered place,
the place becomes the address after every paint, and a deep address stands the
intro round down for that session through the tour's own *Skip for now* mark —
the landing carries the offer (`/<client>/tour`) and *Continue* is the answer
to it. Forefront's own pages are `platform.html` over `lib/platform-api.ts`.
`checks/shell.mjs` 36/0 with two red runs; `qa.py` against the served app
(`SMP_BASE`) 33 viewers, 229 destinations, ERRORS none — and its own first
three runs found the HARNESS, not the product (the register probes wrote the
office's own row, which §313.29 marks and the authoriser refuses, and a
refused flush blocks every viewer switch after it).
**Phase C is accepted (§316, §316.1)**: **39 frozen checks re-pointed at the
served app, 0 failures**, each on a freshly seeded tenant — the plan's named
group, the fifteen its trailing "…" leaves unnamed, and the three that judge
who may open the Strategy tab at all — with `qa.py` at Next 33 viewers / 229
destinations / ERRORS none, state 87/0, door 44/0, shell 36/0, 588/0, 136/0
and `tsc` clean. **ONE PRODUCT FAULT, THE FIRST CORRECTION THE FREEZE HAS
TAKEN**: the plan builder minted a capability key objective with **no id**, so
the row rendered, scored and reported and could NOT be written — §314.2's
row-addressed writer refuses the whole save by name
(`cap_key_objectives - a row has no id`), measured — and the check had asked a
UNIT's objective for its id one screenful above and never a capability's
(§94.2). Asked of Islam first (§314), then minted from the MAXIMUM
(`mintRowId`) and never with `renumberCapability()`, whose positional renumber
would have silently re-addressed every project, deliverable, outcome and
milestone under the capability, which figures and snapshots are keyed on
(§48) — *a fix that reaches further than the fault is a second fault with a
green check over it*. **EVERYTHING ELSE IT FOUND WAS THE HARNESS**: a check
that stands up its own `/raya-trade` to answer with a POISONED graph is no
longer re-pointed (`reorder-integrity` — the poisoned graph IS its subject,
and the served app cannot be made to hold that state), and it **says so in its
own first lines** rather than qa-run.py keeping a list of names (§104.7),
asserted at both ends. **Nothing retired.**

**AND OPENING A NEW CYCLE COULD NOT BE SAVED (§316.3)** — found in Phase D
and fixed on Islam's word (*"yes fix it"*, after he sent the first version of
the question back as too technical, which is rule 1b). `openNewCycle`
replaces `REVIEW` with what the panel collected, and **§307 took the review
point off that panel**, so the new review carries no `endsQuarter` at all
while `review.ends_quarter` was `NOT NULL` — the save was refused, the cycle
existed on screen and nowhere else, and a refresh brought the old one back.
**A LIVE DEFECT ON `main`, established on the FROZEN writer rather than
inferred from the port** (§303): *"null value in column ends_quarter ...
violates not-null constraint"*, with `endsQuarter` deleted exactly as the
mint deletes it. What the rebuild changed is that a refused statement now
NAMES ITSELF (§316.2) — Postgres answers a bad value with the type and not
the column, so "invalid input syntax for type numeric" over thirty tables
sends somebody to look at everything (§123) — which is the only reason it was
found. **THE COLUMN MOVES, NOT THE MINT**: nothing has written that value
since §47.8, `reviewAsOf()` already reads an absent one as Q4, so it is
stored as an ABSENCE (§50.6); having the mint choose a quarter would put a
value on the record nobody picked, which is what §307 removed the picker to
stop. The `DEFAULT` stays, so a tenant holding one keeps it — asserted at
both ends, or a build that stopped storing the field passes half. Migration
044 (`@phase: pre`) and `smp-app/db/migrations/002`, both **red first** by
putting the constraint back: the frozen round trip prints the refusal
verbatim and `check:state` §8 goes 3 red on the person's own sentence.

**Phase D is accepted (§316.4)**: **22 frozen checks at the served app, 0
failures**, `qa.py` 33 viewers / 229 destinations / ERRORS none, state 91/0,
the nine spike proofs, 588/0, 136/0. **ONE PRODUCT FAULT (§316.3) AND EVERY
OTHER FINDING A CHECK** — four that SERVE THEIR OWN STATE and must not be
re-pointed (§316.1, and three said so in their own docstrings); one asserting
half a rule (*"with no server, Save draft parks nothing"* is §220's decision
from one side — REWRITTEN to *the park follows the save's outcome*, true on
both stacks, §218); one fixture writing `t.actual = ""` where the product
stores `null`, harmless over `file://` and a 500 over HTTP on the one `actual`
column that is numeric (§100.3); one BUCKETING pixel tops so a 1px difference
read as two lines (§122.4 — 87 against 86 is `round(14.5)` against
`round(14.33)`); one holding a handle across the repaint its own save caused
(§222, §215); and one measuring a box before `growBox` had seen it, so a long
stored note made it appear to SHRINK. **AND MY OWN RUNNER LIED THE WAY §298.3
NAMES**: it counted `^  FAIL` lines, which the checks do not all spell that
way — one printed *"6 failed"* under a count of 0 — while another's tail read
*"- waiting 500ms"*, a run that STOPPED rather than passed. *The tail is the
verdict; the count is not.*

**Phase E is accepted, and the clip endpoint is ported (§316.5)**: **38 frozen
Setup checks at the served app** and `api/blob.js` PORTED — the fifth and last
endpoint, over `lib/blob-api.ts` — with `checks/blob-api.mjs` **23/23** and RED
both ways; `qa.py` at Next 33 viewers / 229 destinations / ERRORS none, the
`file://` sweep ERRORS none, door 44/0, state 91/0, shell 36/0, 588/0, 136/0.
**NO NEW PRODUCT FAULT IN THIS GROUP** — four reds were established as NOT this
work's by reproducing them on **`origin/main`'s OWN BUILD** before anything here
was blamed (§303), and all four are recorded rather than fixed, because the
frozen file takes no new work (§314) and none blocks a client: `history-page`
10 and `tour` 15 (its step 9 points at a control §252.2 made the office's, so a
custodian is shown a hole with nothing in it); **`band-corner` 6, where the
check is right** — at 1440×900 the Plan page does not scroll AT ALL, so the band
sits exactly at its own sticky offset (`bandTop 191 == top 191`) and
`pinWatch()` cannot tell *satisfied its offset* from *pinned*, so the corner
fill paints at rest and the card's rounded corners read square, which is
§130.6's complaint live, **and three of that file's six passing assertions pass
for the wrong reason with it** (FIXED at §327) (§94.5); and `table-scroll`'s **4px** squeeze of
the viewer label at 1100px, measured on both stacks — `brand 301 · clientback 0
· viewer 608` over `file://` against `brand 184 · clientback 122 · viewer 523`
served — so it is the CLIENT-BACK control a served deployment draws for a
Forefront consultant (§313.36) and never for a client's own staff, on a label
§178 already puts on a hover. **EVERY OTHER FINDING WAS A CHECK**, and the two
worth carrying into F–H: **THE CHAT CORNER TAKES CLICKS THAT ARE NOT ITS OWN**
— it is deliberately not drawn over `file://` (§97), so no screen check has ever
had to dodge a fixed 60px bubble over the bottom-right of every page, and
Playwright presses an element's CENTRE; stood down for CLICKS ONLY
(`pointer-events`, never hidden, or a contrast probe measures something else),
with a check whose subject IS the corner saying so in its own first lines
(§167.2's finding, §104.7's rule). And **A CHECK THAT RELIES ON A RELOAD TO
RESET IS RELYING ON `file://`**: `role-picker` lands again at the top of every
section and assumes the row holds nothing — true while landing meant re-reading
the baked file, and served from a database its four grants accumulate, section 5
RETIRES the row and section 6 presses a picker correctly no longer drawn, so the
file DIED rather than reporting (§215). The state is snapshotted on the first
landing and PUT BACK on every one after (§94.2). **Nothing retired.**

**Phase F is accepted (§316.6)**: **18 frozen Presentation checks at the served
app, 0 failures** — `qa.py` at Next 33 viewers / 229 destinations / ERRORS
none, the `file://` sweep ERRORS none, door 44/0, state 91/0, shell 36/0, blob
23/23, 588/0, 136/0. **NOTHING WAS PORTED FOR THIS GROUP AND NOTHING NEEDED TO
BE**, which is worth saying rather than leaving as an absence: a deck is
assembled in the BROWSER from the graph on the press (§51.8, §253.3), the
`.pptx` and the print are built there too (§296, §311), and the one thing that
ever leaves is a clip — ported at §316.5. So the only thing the new stack
changes for the whole Presentation is where the graph came from, and the group
still found two checks, which is the argument for running it rather than
reasoning about it. **NO PRODUCT FAULT**; both findings were shapes met before
— `video-slides` asserting the WORDS of one stack for a rule that holds on both
(over `file://` `sync.js` refuses before anything leaves, served the ENDPOINT
refuses in its own words, and the storage section has THREE honest answers of
which the check knew one), and `hide-slide` reading the rail on the line after
`switchViewer()`, which §237 made asynchronous over HTTP — so *"the custodian
has neither"* measured the office and its thirty-one eyes. `qa-run.py` already
settles a switch made through the CONTROL; that one went round it. **Nothing
retired.**

**Phase G is accepted, and the two Communication endpoints are ported (§316.7)**:
`api/chat.js` (1883 lines) and `api/mail.js` (462) **carried across** as
`lib/chat-api.cjs` and `lib/mail-api.cjs`, with `lib/{mailer,push,assistant,
mail-html,audience}.cjs` beside them — every decision, query and sentence byte
for byte, and **the plumbing replaced in exactly ten named ways** listed in the
carried file's own header, checked by reading the whole code-only diff hunk by
hunk against that list. `checks/comms-api.mjs` 47/47 with a browser SEAM
section, RED both ways; the twelve frozen browser checks own-server and green;
`qa.py` at Next 33 viewers / 229 destinations, ERRORS the ONE named 404 and
nothing else; the `file://` sweep ERRORS none; door 44/0, state 91/0, shell
36/0, blob 23/23, 588/0, 136/0, `tsc` clean.
**TWO PRODUCT FAULTS, BOTH FOUND BY PRESSING THE ENDPOINTS**: `FROM org WHERE
id = 1` named a column the shared schema does not have (a singleton is keyed by
`tenant_id` ALONE), so every chat request answered *Something went wrong*; and
`push_subscriptions` was mis-keyed in the NEW schema, so a device signed in to
by somebody else would MULTIPLY rather than move and the previous person would
go on being notified — migration 003. **Two nested transactions became
SAVEPOINTs**, because the request is already inside `withTenant`'s and a COMMIT
there would take `app.tenant_id` with it. **THE SEAM WAS MEASURED BY NOBODY**:
all twelve browser checks serve their own stub and must (§94.11), so not one
had ever spoken to the ported endpoint — section 8 drives the real corner
against the real route and reads the row back THROUGH the tenant.
**AND `/sw.js` IS 404, WHICH IS STOP POINT C**: the plan says both *"no service
worker"* (reasoned about caching) and *"carry notifications"* — and that one
file carries `push`, so no device can register; worse, **every page load logs
that 404 for every viewer, with nobody having turned anything on** —
`pushSync()` registers the worker BEFORE it asks whether this
device wants a subscription (§282.4), so no switch prevents it. **The chain I
first reasoned — a VAPID pair moving — was REFUTED by deleting the pair and
sweeping again**, which is also why E and F were clean: their chat route was a
HOLDER answering with no `chat` key at all. Put to Islam, not decided here.
**Nothing retired.**

**Phase H is accepted, and nothing was ported for it (§316.8)**: the workbook
builders and readers are client-side and travel with the shell BY
CONSTRUCTION — `build-shell.mjs` reads build.py's own list and asserts the
assembly byte-identical, so a file gained tomorrow turns the build red rather
than being missed. `template-round-trip` 0 failures at Next; `import-page` and
`kb-file` 1 each, and **both are the ONE recorded worker 404**, established as
not this group's by running all three green over `file://` first (§303).
**AND VERIFYING THE ROW FOUND HALF OF IT COVERED BY NOTHING**: the round trip
is proved IN THE BROWSER and never saves, so *"the upload's replace path and
the archive land through A's save"* had no check on either stack — and it is
the half most likely to fail here, because §314.2's writer is ROW-ADDRESSED and
a replace is precisely the shape that ADDS and REMOVES rows.
`checks/upload-seam.mjs` 9/9, RED both ways, drives the platform's own
workbook in a real browser on the served app and reads the plan back out of
Postgres THROUGH the tenant — an update, an INSERT, a DELETE, the archive
written once by the replace path itself, and none of it in the other client.
**AND THE FALSIFICATION FOUND THE CHECK'S OWN FIXTURE CLAIMING THREE THINGS AND
MAKING ONE**: a plan row's id is minted BY POSITION (§22), so dropping the last
pillar and appending a new one leaves the id set `mobile-P1…P4` either way —
every row an UPDATE — and `--break=no-inserts` went green on both pillar claims
and red on the ARCHIVE, which was the only insert that fixture made (§94.5).
**Two faults in my own probe, each an old rule in a new place**: it called
`archiveUnitPlan` itself and then read two archives back (§100.3 — a probe that
makes the thing it measures is measuring itself), and it read the database with
**stderr thrown away**, asking for a bare `name` across a join where two tables
have one, so *column reference "name" is ambiguous* came back as an empty
string and read as *the value is not there* (§93) — calling a CORRECT build
broken. `qa.py` at Next 33 viewers / 229 destinations, ERRORS the ONE recorded 404 and nothing else; the `file://` sweep ERRORS none; door
44/0, state 91/0, shell 36/0, blob 23/23, comms 47/47,
588/0, 136/0, `tsc` clean. **AND STOP POINT C IS NARROWED, NOT ANSWERED**:
the worker gap now reddens ANY re-pointed check that asserts no console errors,
not merely a sweep's ERRORS line — and Phase J's own row already serves a
self-destructing `sw.js`, so a file at that address is in the plan already;
what is genuinely open, and Islam's, is **whether it also carries `push`**.
**Nothing retired.**

**Phase I is PREPARED and not run (§316.9)** — its row is *1 + Islam* behind
stop point E — and **what he is asked for came out at TWO PRESSES and no SQL,
which is a finding rather than a tidy-up**: a tenant created with an `INSERT`
holds no graph, and a tenant with no graph answers **404 at the state API**, so
the client cannot be opened by anybody including the person who could fix it
(§61) — while Forefront's own *Add a client* writes the row AND loads **§67's
cleared graph**, deleting the row if that load fails. The runbook is
`specs/043-shared-schema-rebuild/phase-i-runbook.md`.
**`scripts/seed-demo.mjs`** carries the demo under the demo TENANT with the
frozen renaming table and its refusal **required, never copied**, refusing
twice — on the graph it builds and on the graph Postgres hands back — proved on
a virgin database; **`checks/demo-seed.mjs` 7/7, RED both ways**, scans the
COLUMNS of every tenant-owned table rather than the graph (a reader only
surfaces what it knows about) with Raya's scanned as the CONTROL (§113.8).
**Its own first run called a correct demo broken five times**, matching the
token `Nour` inside the invented *Noura Ghanem*: the frozen refusal splits on
non-letters and matches WHOLE WORDS, so the answer was to ask IT per row rather
than write a second rule (§53.5) — which brings its picture rule along, so a
`data:` URI in any column is refused outright.
**AND OPENING AN EMPTY CLIENT FOUND A LIVE DEFECT**: the landing resolved the
person from the MEMBERSHIP while the state API places them on the REGISTER, so
a Forefront admin opening a client BY RULE (`door.ts`'s `seatFor`, no
`tenant_users` row) was told *"You are not on this client's register yet — the
SMO places you from People"* **for ever, on every client**, with their row
plainly in `people` — §53.5's drift with §124's sign, sending the only person
who could act to do something already done. `registerKeyFor()` is the one
read-only answer both halves ask, and it is **deliberately not `officeRow`
called from a page**: opening a landing is not a placement, and a reader that
creates what it looked for is how a phantom change reaches every save (§42).
Both ends asserted on two different clients; door 44 → **49/0**, with
`--break=membership-key` reddening exactly one.
**THE RAYA CARRY'S ROUTE IS RECORDED, as stop point E asks**: at deploy from
Vercel's own environment, with **no second database** — the frozen schemas and
the shared schema are one Neon database, so nothing is pasted — running once by
construction, and its cost is a SEQUENCE rather than a guard (after the frozen
site stops taking writes, or a figure entered in between is carried and then
lost). **Nothing retired.**

**PHASE J IS BUILT AND NOT RUN (§316.10)** — the cutover itself is Islam's,
and everything that could be built and proved here is. **STOP POINT C IS
ANSWERED AND IT IS HIS** (*"1. ok"*): `/sw.js` is served again. **The plan
said both things and was right about its own half each time** — line 47's *no
service worker and no offline copy* reasons entirely about CACHING, and that
argument is STRONGER on the new stack, because the platform document is
server-rendered and per person, so a cached copy is one person's page served
to the next on that device; Phase G's row says *carry notifications*, and
`push` lives in that one file. So the caching half is DROPPED and the
notification half is CARRIED — `scripts/build-sw.mjs` generates it from the
frozen worker rather than copying (§53.5, `build-shell.mjs`'s discipline),
splitting at §231's own marker with **both ends asserted** (the dropped half
must hold `SHELL`, a fetch handler and a cache; the carried half must hold
`push` and `notificationclick` and name none of them), proved able to fail
three ways from a doctored source. **There is no `fetch` handler at all**,
which is what *stores nothing* means when it is measured. **AND IT IS WHAT
CLEARS THE FROZEN CACHES**, which is why Phase J's row asked for a file here:
every cache deleted on activate and the clients claimed, so §91's returning
browser cannot be served the old platform out of its own disk — it destroys
the old CACHES, not itself, because staying resident is how a push arrives
with no tab open. **A side effect named rather than discovered**: claiming a
tab that already had a controller fires `controllerchange`, which is what
§258 watches, so a tab left open on the frozen build is offered *"A newer
version of the platform is ready"* at the cutover. **THE 404 EVERY PAGE LOAD
LOGGED IS GONE** — `qa.py` at Next ERRORS **none** for the first time since
Phase G, with `import-page` and `kb-file` (1 red each for exactly it) green
there too. **AND THE MANIFEST HAD TO CROSS WITH IT**, or the answer is true on
a laptop and nowhere else: on an iPhone a push is only ever delivered to a
platform ADDED TO A HOME SCREEN, and the new app served and linked none —
`scripts/sync-static.mjs` carries it and the four icons from the repository
root verbatim (it needed no editing: `start_url` and `scope` were already
"/"), both surfaces link them, and the check asserts every icon the manifest
NAMES answers. **The offline copy does not come back** and that is line 47
standing. **AND MEASURING THE DEPLOYMENT FOUND WHAT NOTHING LOOKS AT**: the
frozen `vercel.json` sets **eight** security headers on every path (§43.6) and
the only surface on the new stack setting any was the shell's own route — the
door, the landing, `/sw.js` and every stylesheet came back with NONE, so a
cutover would have dropped HSTS and the policy from the sign-in page as a
deployment detail. `next.config.ts` reads them **out of that same file**,
which is the rule that came with them, in **two sets kept DISJOINT**: the six
that are the same everywhere on `/(.*)` with the shell no longer repeating
them, and `Content-Security-Policy`/`Referrer-Policy` on the DOOR and the
LANDING alone, the React surfaces with no route handler of their own. **WHICH
WINS WHEN BOTH SET ONE IS NOT RELIED ON** — measured, a config header replaced
a route's and did not read the same way for every key, and a POLICY is the
wrong place to lean on an internal precedence — so the "exactly once"
assertion is **the control rather than the alarm and says so** (§113.8).
**AND THE `DELETE FROM sessions` THE ROW ASKED FOR IS NOT WRITTEN**, which
reading the carry decided: `migrate-raya.mjs` copies the password hashes
verbatim and **not one session**, so everybody signs in once by construction
and a migration deleting nothing would be ceremony (§24) — said rather than
quietly dropped. **WHAT RUNS AT DEPLOY IS ONE FILE AND TWO SWITCHES**
(`scripts/deploy.mjs`, called by `npm run build` before `next build`, because
a bootstrap on a request path is what §98 measured and §289 found failing
under a burst): the schema and the migrations EVERY build, Raya's carry and
the demo seed only under `SMP_CARRY_RAYA` / `SMP_SEED_DEMO`, **neither ever on
a preview**. Both refuse themselves once run, so **the switch decides WHEN
rather than whether — and when is the whole cost**, because the carry reads
the frozen schema while the frozen site may still be taking writes; a sequence
Islam controls and not something that can be turned into a guard.
**`SMP_APP_PASSWORD` is named in the runbook** rather than left at its default,
which is the word `smp_app`. `qa.py` at Next 33 viewers / 229 destinations /
ERRORS none, `file://` ERRORS none, door 49/0, state 91/0, **shell 60/0** with
five red runs, blob 23/23, comms 47/47, upload 9/9, demo 7/7, 588/0, 136/0,
the nine spike proofs, `tsc` clean. The runbook is
`specs/043-shared-schema-rebuild/phase-j-runbook.md`. **STILL ISLAM'S**: the
Vercel settings, the two switches, the address, **the two presses of *Add a
client*** — he made them on the FROZEN platform, so they are owed again on the
new one — and **the merge, his word on that merge every time**. **Nothing
retired.**

The whole project lives in **`SMP-Project-Folder/`**, which Islam also carries outside the
repo as a zip and brings back — treat that folder as the product. Read, in order:

1. **`SMP-Project-Folder/CLAUDE-RULES.md`** — how Islam and Claude work together. These are
   the operative working rules for platform work (mock-first, ask-don't-assume, one thing at
   a time, handover shape). They take precedence over the generic guidelines above where the
   two overlap.
2. **`SMP-Project-Folder/DECISIONS-AND-LOGIC-vX.Y.md`** — every decision with its reasoning.
   The rebuild contract. §16 is the backlog; reversals are recorded, never overwritten.
3. **`SMP-Project-Folder/README.md`** — the map: what each file and mockup is, and whether it
   is settled, pending or rejected.

There is also a small **access gate** (`index.html`, AdminSMO / 4123) from before the project
folder arrived — a client-side placeholder, explicitly not security.

### Technology Stack
A **single self-contained HTML prototype** (no server, no dependencies, works offline),
assembled from `SMP-Project-Folder/src/` by `python3 build.py`. The build must be
**byte-identical** to the shipped `strategy-management-platform-vX.Y.html` — if it is not,
something is out of step. `python3 qa.py` walks every page as every viewer and asserts no
console errors (in this cloud environment, run it via a wrapper that points Playwright at
`/opt/pw-browsers/chromium`). **RUN IT THROUGH `qa-run.py`, NEVER DIRECTLY, AND READ THE
TAIL** (&sect;320.6b, the third time &mdash; &sect;279.3, &sect;301.2): run directly it
looks for a headless shell this image does not hold, prints Playwright's *"run playwright
install"* banner and **exits 0**, so a whole-platform sweep that never launched a browser
reads as a clean run. *A check that cannot launch reports no failures.* Edit the sources, never the built file.

### Repository
- **GitHub:** `islamsaadany/SMP`
- **Deployment:** Vercel — static files plus **`/api/state`** as a serverless function
  (`package.json` deliberately has **no build script**, so the static serve is untouched;
  `vercel.json` only bundles `db/**` into the function). `index.html` (the AdminSMO gate)
  serves at the root and links to the shipped platform file. Production tracks `main`.
- **Database (since v2.0):** Neon Postgres via the Vercel integration's env vars
  (`DATABASE_URL` and friends — the API tries the standard names; never ask for or paste
  a connection string in chat). The first request against an empty database applies
  `db/schema.sql` + `db/migrations/*.sql` (registry `_sql_migrations`) and seeds it from
  `db/seed-state.json` under an advisory lock — nobody runs SQL by hand. The seed is
  **generated from the platform sources** by `node scripts/extract-state.js`. Served over
  http(s) the platform hydrates from GET /api/state and autosaves on change; opened from
  file:// it runs on baked data.
- **THE POOLED CONNECTION KEEPS NOTHING BETWEEN STATEMENTS (§289, 2026-09-04):**
  production talks to Neon through PgBouncer in transaction mode, so every
  statement sent OUTSIDE a transaction may run on a different backend. A
  session-level lock (`pg_advisory_lock`), a session setting (`SET …`), `LISTEN`,
  `PREPARE` or a temp table taken on one statement is NOT there on the next,
  and worse, it stays on the backend it landed on and is handed to somebody
  else's request. **Anything that must hold across statements lives inside
  `BEGIN … COMMIT`**, with `pg_advisory_xact_lock` for a lock and `SET LOCAL`
  for a setting — a transaction pins one backend for its life. §240 learned
  this for the save; §289 learned it for the bootstrap, where a session lock
  let two cold starts apply one migration and the sign-in page said
  *"Something went wrong"* once per deploy. **When a fault looks like this** —
  a 500 that only happens under a burst, right after a deploy, or a hang
  nobody can reproduce alone — read the runtime log line the endpoint writes
  (`api/auth:`, `api/state:`, `api/chat:`) and grep `api/` and `lib/` for the
  five words above outside a transaction — or run
  `node scripts/test-session-state.js`, which does that grep for you and is
  red on any of them (§289.2). `scripts/test-cold-starts.js` models the pooler
  and is the shape a behavioural check for this class takes.
- **AND THE DIRECT CONNECTION IS ASKED FOR FIRST (§313.34):** since the
  multi-client split, a request is aimed at a client with `SET search_path` —
  the one line the whole boundary rests on, and precisely the shape above. So
  `getPool()`'s list of env names is an **order**, not a spelling:
  `DATABASE_URL_UNPOOLED` and `POSTGRES_URL_NON_POOLING` win over
  `DATABASE_URL` and friends, because on a DIRECT connection a checked-out
  client is one backend for the life of the checkout, which is what
  `withSchema()`'s set-and-reset has always assumed. The pooled names stay as
  the fallback (a project holding only those must still start) and the process
  writes **one line to the runtime log** naming the setting to add, since a
  deployment silently running on the risky endpoint is worse than the risk.
  The cost: a direct connection is a real connection, so **a great many people
  saving in the same seconds** is the named trigger to revisit, and the answer
  then is every client request in one transaction with `SET LOCAL`. The
  preference is asserted by `node scripts/test-db-url-choice.js`, and
  `pointAt()` carries the ONE named, printed exception in
  `scripts/test-session-state.js`.
- **AND A CLIENT'S CONNECTION WEARS THAT CLIENT'S BADGE (§313.35):** rules 1
  and 2 of `lib/platform-io.js` are our code being right; rule 3 is the
  database refusing when it is not. One role per client schema (`smp_<schema>`,
  no login, creates nothing), made and granted BY THE PLATFORM with the room
  and memoised per process under a transaction-scoped lock; every connection
  serving a client request does `SET ROLE` into it after `ensureReady` has run
  as the owner, and `RESET ROLE` at release. Another client's schema is refused
  by the database (42501 by name, 42P01 by a moved path). **What it does not
  do, stated**: the owner's key still opens every room (the badge fences a
  MISTAKE, not a leaked key), and the shared platform tables the door reads are
  listed once in `PLATFORM_FOR_CLIENTS` and reachable from every badge. No key
  cannot make a role → served as the owner, said once in the log. `withOwner()`
  is the door for creating and migrating a schema and has three callers;
  everything else is `withSchema()`/`connectFor()`. `api/blob.js` was the fifth
  endpoint and had never been routed by client at all — it is now, and the
  browser names the client on all three of its calls. `SET ROLE` is the second
  named, printed exception in `test-session-state.js`, which learned the word.
  Proved on three database roles including one shaped like Neon's; run
  `node scripts/test-client-badge.js` after touching any of it.
- **AND A MERGE IS READ BEFORE IT IS BELIEVED (§313.37):** merging `main`
  into the split's branch brought back `DEMO = clone(graph())` in a hunk both
  sides had edited — a variable §313.8 deleted — and reading the branch's own
  files found four faults no check had reached: `blobLive()` asking a deleted
  `isDemoMode()` (every store call threw over HTTP, unseen over `file://`),
  the store's slug in the body where the server reads the address,
  `dismissWhere` asking for a session without its client key, and the worker
  opening `/raya-trade` on every client. **Grep the merged result for the
  names the branch deleted, not only for duplicate declarations** (§147.4
  from the other side): a name a hunk brings back is valid on both sides and
  green everywhere. `multi-client.py` §18 and `test-platform.js` press both
  now. And **`checks/fixture-platform.js` assumes a rehearsal database** —
  seed a tenant in `public`, run `scripts/migrate-to-multi-client.js`, then
  the fixture — and says so in words rather than with a foreign-key error.
- **AND EVERY CLIENT HAS A DOOR OF ITS OWN (§313.36):** `/<client>/sign-in`
  is the gate served for that client, wearing the mark on its registry row
  (set on the client's card, PNG only, refused by shape on the server);
  `/` stays Forefront's door and draws no client. A signed-out person is sent
  to their client's door through the ONE `doorUrl()` in `sync.js`, never to
  the root. The door reads its client off the address, and the server answers
  what it wears (name and mark, public — the address already names the
  client; unknown, retired, schema-shaped or misspelt all answer a plain door)
  and where the sign-in lands — the door's client only if `mayOpenClient`
  says so, else where the root would send them. Three files carry the door
  path: `vercel.json`, `scripts/dev-server.js` (reads it) and
  `checks/boot-skeleton.py`'s stub. Proved at both ends by
  `scripts/test-platform.js` (the subject that can fail is a consultant on
  TWO clients — a client's own person lands the same from every door) and
  `checks/multi-client.py` §17.
- **Identity (since v2.1, §19; hardened v3.12, §43):** the gate is a real login
  (person key + password, scrypt-hashed, httpOnly session); `/api/state` requires
  a session AND a password that is no longer temporary; a signed-in person sees
  their own view; the SMO issues temporary passwords from People. **§19.4 is
  reversed:** `SMO` / `1234` still opens an empty deployment but forces a change
  at once. Sign-ins are rate-limited (8 per key, 25 per address, 15 minutes);
  a password change ends that person's other sessions. Security headers are in
  `vercel.json` and read from there by `scripts/dev-server.js` — never typed twice.
- **Two datasets (since v2.2, §21):** the database holds the **client's own** tenant;
  the full Raya Trade worked example is baked into the platform file and reachable
  only through the **Demo data** button, which labels it and refuses to save it.
  A first deployment seeds the example and then clears it — `db/migrations/004-clean-slate.sql`
  runs after the seed, which is why `ensureReady` seeds first and migrates second.
  **Never put invented content in the database**; it belongs in the demo dataset.
- **Plan import (since v2.3, §22):** an upload **authors** a plan rather than amending
  one, which is why the template carries no codes — the platform mints them on arrival.
  One generic `.xlsx` template; the unit is chosen on its Read me sheet (cell B2); a plan
  cannot arrive as a CSV, because a CSV cannot say whose plan it is. Replacing archives
  the outgoing plan into `plan_archives` (state field `archives`); **nothing an import
  does is a deletion**.
- **Companies (since v2.5, §23):** a layer between the group and the business unit —
  visibility, not strategy: no score, no page. A unit belongs to a company or is
  explicitly its own; two per-company flags decide whether its CEO sees the other
  companies and the group. Stored (`companies` table, `units.company`), survives the
  clean slate, and `006-companies.sql` adds it to a tenant already deployed.
- **Authorisation (since v3.12, §42):** `/api/state` authorises every save.
  `lib/rules.js` is the SHARED rules module — roles, areas, access defaults and
  every pure "may this person…" function; `build.py` inlines it into the
  platform, `api/state.js` requires it, `scripts/extract-state.js` runs it
  before the sources. **Never write a second copy of a rule.** `lib/authorize.js`
  classifies the diff between the stored and incoming graphs and refuses what
  the person's roles disallow — always resolved against the **stored** world.
  An unclassified change is the SMO's, by design. `change_log` (migration 010)
  is written from the same diff and lives outside the state graph.
  Run `node scripts/test-authorize.js` after touching either file, and
  `node scripts/test-door.js <smo-password>` against a running dev-server
  after touching `api/auth.js` or `lib/auth.js` (it ends by rate-limiting the
  SMO on purpose — `DELETE FROM login_attempts;` clears it).

#### Repository — decision index

The 297 decisions that were recorded in this section in full. One line each:
what it decided, and where to read it. Full prose in `CLAUDE.full.md`
lines 1017–8517.

- The platform says it has saved → §527
- A clock on the review → §340
- The keyboard belongs to the presentation → §297
- The presentation loop: play from the editor, and come back to it → §295
- A yes or a no that can be under way → §300
- The review deck as a PowerPoint, made to read like the deck → §311
- One PDF of the whole flow, in the contingency pack → §312
- The planning period, and the review cycle inside it → §308
- One month, one meaning → §307
- A row's type is a picker, and its direction opens → §292
- A backup to adjust to and present from → §297
- The deck on paper → §296
- Files out, files in, and the record → §295
- The template carries what the platform holds → §294
- What a row is measured against, beside the box it is typed into → §344
- A reported figure follows the target's unit → §277
- A count is owed in whole ones → §276
- The fault was not the duplication, it was that correctness depended on order → §281
- The reporting page says where submit is held → §279
- The label, the fold, and a setup page that is not a unit's → §296
- No composer over a list of people, and a test that says what it cannot see → §298
- Waiting and ask, and the list the questions fill → §299
- The settings panel scrolls inside itself → §294
- A panel edits, a dialog asks → §273.3
- Reopening a closed cycle → §273.2
- The caret belongs to the disclosure, not to the class → §287
- "open a new cycle" drew nothing, on `main` → §273.5
- The pen closes itself, and the banner is two columns → §273.4
- Editing the cycle that is running → §273
- The reporting note is prose, and had one line to say it in → §271
- The setup tables are arranged, and their rows act from one menu → §261
- The group has a mark, and the deck has separators → §259
- A video in the review, and the bytes are not in the database → §261
- A finger gets a way back (, reversing 's forward-only for touch and not for a mouse) → §280
- Fullscreen is the slide, the arrows and nothing else → §265
- One flow, several decks, back to back → §266
- One deck's strip is labelled, and its pills are grouped → §266.12
- The dialog does not change size as rows move → §266.11
- The picker is two tables, searched, and dragged by its own numbers → §266.10
- A function's presentation button sits where a unit's does → §275
- The plan download is an entry in the presentation menu, and the office's → §252.2
- The objectives table, and a cell that stopped being one → §278.3
- A target with a shape of its own → §278
- A summary is made of the number it summarises → §264
- Empty is not missing, and the bar now says which → §272
- The platform collects, then sends one email → §293
- A reported note is named as one → §255
- A figure is read against what it is measured by → §254
- A table with no rows is not a slide → §253
- A title is one line, and the box was the only place that said otherwise → §255
- The presentation reads what was reported → §252
- A slide the office does not present → §256
- A target that is a yes or a no → §257
- The screen asks the column the save asks → §270
- One edit, one done → §269
- The strategy pen lives on the section line → §268
- The plan's titles could not wrap at all → §189
- What is attached is shown, not described → §286.2
- One panel, whatever is in it → §285.2
- A picture is pasted, not only attached → §286
- The office's corner carries the queue → §285
- The corner survives the walk → §284
- A reply nobody was ever told about → §283
- The corner arrives with the page, and the search reaches somebody who has never written in → §290
- A save must not shut everybody else out → §288
- The chat must not wait on a save → §282
- A refusal without its cause is why nothing converges → §282.2
- The office starts a conversation → §247
- The platform registers its own worker, and a hang is not a silence → §231.5
- Is it WORKING? → §231.6
- A failed ask is not an answer, and the inbox said it was → §231.4
- A VIEW-AS session starts where their session would start → §237
- One function's submit must not carry everybody's report state → §234
- What the round left behind → §301.7
- A saved draft is the owner's to reopen → §301.6
- The row carries who it belongs to → §301.5
- Theirs opens, not the first one → §301.4
- A project owner reports, and the bar said view only → §301
- No door when nothing is owed → §301.3
- A closed report says so to them too → §301.2
- The unit is there before the number is → §251
- The direction and the compile rule stay the office's → §249.4
- What auditing found → §249
- The outcome and its target are owed → §249
- A tactic is judged by what it produced → §248
- A tactic's outcome is measured against its own window → §250
- YTD is measured against the part of the year that has passed → §239
- A dependency must not be able to take the feature it serves down → §231.3
- A box that arrives with no tab open → §231
- The notice speaks the user's language → §230.2
- A late answer still lands → §230
- Enter commits a ONE-LINE prose box → §229
- A function's objectives are written at the page's width → §231
- A box from the computer when a message lands → §225
- A capability travels on its own → §216
- A milestone's collaborators, the tactic's rule moved over → §227
- Counted and fillable are two questions, and the door asks the second → §223
- The reporting tab is orange at all times → §222.2
- Reporting is a tab → §222
- The target decides the strategy column → §217
- The office's approval on a fill is gone → §218
- Commit the box before leaving → §219
- A closed report is closed → §220
- A saved draft is submitted where it stands → §263
- Submit is shut until the report is complete → §221
- A plan travels row by row → §215
- The overview owes nothing → §214.4
- A sentence nobody has settled is a question mark on the page → §214.3
- Counted and fillable are two questions → §214.2
- A counted gap must be one the save accepts → §214
- A supporting function's overview is a supporting function's overview → §211
- The office inbox got a thinner panel than the corner → §188
- A seat is granted and never derived → §187
- A count that cannot be quiet about anybody → §187
- Collaborators are not a gap → §187
- The welcome header's roles stack → §187
- The chat inbox list says the name → §187
- A seat is not an ordinary role → §186
- Viewing as somebody is judged as somebody → §185
- A way back to the welcome screen → §185
- A glyph that differs from tofu by one pixel passes "it is drawn" and fails "it is a mark" → §185
- A date the platform cannot read is a gap, and a refusal costs one row → §184
- The strip kept its own answer, and the control beside it had it right → §178
- The page said missing and the count said nothing was → §177
- The band's buttons went nowhere, five ways → §177.2
- The grant is per page and the reach is per row → §177
- Who owns every place was two lists and they disagreed → §175
- Assert the agreement between the resolver and the table, not a list of pairs → §175.2
- A column a role could never hold is an option that means nothing → §174
- A TWO-ROW head pins as a `thead`, not as cells → §174.1
- A refresh is not a new session → §173
- A check constraint is a copy of a rule in another file, and nothing compares them → §172
- A failed save must say so, and three of them did not → §171
- A debounce is a DATA-LOSS window when the flush cannot reach it → §170
- A stub fast enough to be convenient is fast enough to hide a race → §170.2
- A sticky box with no travel is not sticky, and the page had 60px of scroll it did not need → §167
- 's welcome screen blinds any check written before it → §148
- The colour is the band's key → §168
- Absent is not zero when a setting is a number → §169
- The floor is not a role, and it must be read as one → §93
- Editing keeps its head, and the name gets the line → §194
- A reply says it went as soon as it has gone → §193
- The house leads the row → §193.2
- The gap walk walked what the count no longer counted → §192.4
- The pending count says where, and walks you there → §192
- A line the platform cannot name is nobody's to change → §191
- An attention item you can answer, on the box it is about → §190
- A dash meant "we never asked" → §93
- One line, and the page's controls are on it → §130
- A band cannot be a lighter shade of the stripe → §130.8
- A guessed constant between two pinned things is a hole → §130.10
- A sampled search for a symptom finds the fault when it is lucky → §130.10
- Pinned twice, and asserted once → §130.9
- `.acgrid` is a scroll box, so the page offset went inside it → §130.2
- A table row has no box once its cells are positioned → §130.7
- Focus reaches supporting functions, in both shapes → §130.5
- The company is sometimes derived and sometimes stored → §130.6
- Email settings are a section, not a dropdown → §130.4
- The railed pages get the whole window → §93.9
- A row you could not finish editing → §93.10
- A comment ate the rule → §93.11
- The register speaks the navigation's language → §93.12
- A question the register has already answered → §93.13
- Name and full name → §93.8
- The name column fits the name, and two values copy themselves → §93.6
- The performance page went unmeasured for the third time → §93.7
- A count belongs where the gap is closed, and it pushed a button off the page → §93.4
- A table page is not a notification area → §93.5
- One chip too many → §93
- One destination is not a question → §92
- An owner is picked from the register, and it decides who may report → §130.1
- A ticking list stays open, and that reverses `choose()` on purpose → §130.1
- A 1px clipped element scrolling is never the page moving → §130.1
- One item still gets the rail, on both sides of the switch → §130.2
- The pinned title's corners take the page's ground — while pinned → §130.3
- The squared corner was the card's border, not the band's → §130.8
- The place beside the name is a hint, never part of the answer → §130.9
- The picker lists the register's *Name*, not the full legal one → §130.7
- Terse drops the detail, never the alarm → §119.3
- The questions travel, and the round trip must be a fixed point → §161
- The pen promised a paragraph break it never made → §161.3
- `who` is three, and the third makes a pair deterministic → §161.1
- A recipe is a promise about behaviour, and nobody was revisiting it → §160
- A tenant's label is never inflected, and the help was inflecting one → §160.6
- Read the defaults before calling something a build → §160.2
- The code can be better than its own comment → §160.4
- The knowledge base is the office's → §119.4
- The deck names what the plan owes → §119.1
- Fill the gaps → §145
- The only way out may not be the quietest thing on the screen → §159
- The own columns are two questions, and 's lock is a default now → §94
- The strategy tab is authored by the office, and only the plan ever was → §94
- The arrange button goes, because took away its reason → §94.3
- Every page gets the whole window, and the fault was an alignment → §94.13
- Assert the agreement, not the number → §94.14
- Nothing wears a colour it will have to change → §94.10
- A feature only visible over HTTP is invisible to the whole suite → §94.11
- People open where they work, and the group is a place → §94.6
- Report is the one solid button, and the legend gets out of its way → §94.8
- A check that only looks for something present cannot see a control that should not be… → §94.2
- The office is two roles → §89
- A control below the fold is a control that does nothing → §90
- A setup table row is one line → §88
- A name is never an identifier → §87
- Edit and add were built, and the pen was invisible → §70
- A company gets a page → §68
- Two demos: Filled project and Clear project → §67
- An inline XLSX dropdown over 255 characters is an empty dropdown → §67.5
- Renaming a unit broke every save → §67.6
- The 1-year view on a unit's key objectives is a toggle → §66
- The register's file carries where somebody sits, and the column is called Unit → §65
- A class name is one global namespace → §65.9
- A unit's Performance has three headline numbers → §64
- Performance opens; reporting is a mode; arranging belongs to the plan → §63
- A function can be deleted, and the refusal is the feature → §62
- An empty function is still a function → §61
- A function that plans in pillars (spec 010, made usable in ) → §59
- Official BU (renamed from Main BU, v3.21, ) → §58
- A Main BU holds several → §57
- Where people say they work → §56
- A clean merge can still collide in a shared scope → §56.7
- The floor is two roles → §55
- The BU list → §54
- Picture slides → §50
- One table, two halves → §99
- A deliverable's due and owner → §53.4
- Collaborators on a tactic (since the import template; given a column in v3.18, ) → §50
- Figure sets → §44
- DB verification loop → full:6957
- Talking to the strategy office → §97
- The corner minimises, and a reply announces itself → §99
- The chat has a switch, and polling was the real cost → §98
- A failure mode designed to be invisible to the user must still be visible to the operator → §123
- It rendered perfectly and did nothing → §123.4
- The settings run one way, and a status is not an explanation → §127
- A deployment cannot say which key it has, and must say enough → §126
- A debounced save with no flush loses the last 800ms → §126.1
- Saying nothing is not a neutral outcome → §125
- A test that reads a setting it does not control is not a test → §125.4
- A status word is a claim, and presence is not proof → §124
- A check that asserts agreement passes when both sides vanish → §113.8
- A migration that reads a column `schema.sql` no longer creates is broken on every fresh… → §113.7
- The conversation you have open never leaves the list → §105
- A fix tested against the wrong bytes looks exactly like a fix that does not work → §105.6
- The assistant answers first, and off is the default → §104
- A list of exceptions is a list somebody forgets to add to → §104.7
- The knowledge base's missing half, and it is data → §103
- You cannot stub a function the file declares → §103.4
- The world is two ALLOW-LISTS, one behind the other → §102.4
- Focus measures have a switch, and it hides rather than forgets → §102
- Reordering is the unit's, the words are the office's → §101
- The register stops being a form → §116
- A mark belongs inside the block it marks → §116.4
- The count and the queue are one list → §116.2
- One line above the table, and a dialog that was wasteful rather than dense → §122
- A check that argues with a decision is one that gets deleted → §122.6
- A cap made of a guessed constant goes stale silently → §122.5
- The check measured the inner box and passed on the build it was written to reject → §122.4
- A local alias is invisible from another file, and only over HTTP → §116.9
- Every way out of a dialog is the same way out → §116.6
- The unit cell says where, the roles cell says what → §110
- Putting the cursor in a field must not move the row → §110.7
- `max-width:100%` on a field in an AUTO-LAYOUT table does nothing → §110.8
- The onboarding tour is told where the person works → §107
- The corner minimises, and the inbox follows the window → §100.4
- Email → §72
- A link in an email has nothing to be relative to → §176
- A test copy is a send, and it says so → §146
- The email greets its receiver → §135
- Send a message opens on what went → §137
- The action is made obvious, and both choices are islam's → §144.8
- The bar reports, and moves on → §136
- A check must be able to stand in front of the provider → §142.6
- PWA → §26
- Clean URL → §35.6
- My reporting: the lines a tactic's owner enters → §382
- One question, and it is "do I run this ONE?" → §387
- MULTI-CLIENT : one platform, many clients → §313
- The door is a door → §313.3
- A role is a seat on a client → §313.4
- Identity is an email → §313.2
- The platform's PRE-PHASE runs before its schema file → §313.4
- An office account is placed by its address, never invented → §313.32
- The demo client, and what it retires → §313.8
- The tour runs on the person's own plan → §313.9
- Multi-tenant — the reasoning behind all of the above → §36
- A tab that is the same everywhere is not a reason to be anywhere → §383
- Viewing as somebody is judged as somebody on a read path too → §383
- And crossing it is a press, not a page load → §367
- The way across runs both ways, and roles & access was never removed → §362.1
- What every person can open, measured before anything moves (T0, spec 056) → full:8199
- The client's own settings wear the client's bar → §362
- One repository, and a module is a folder → §345
- The internal tracker is the office's weekly list, per client → §356
- Meeting notes: one meeting, one note, and the minutes as an email → §357
- Portfolio: the rules and the tables, before any screen → §375
- A module is a folder that serves itself → §354

- **WHEN A FIELD IS RENAMED, FIND THE CODE THAT CREATES IT** — not only the
  code that reads it (§51.10). §15 renamed a capability's `measures`/`tactics`
  to `keyObjectives`/`projects`; the ADD button kept minting the old shape for
  eleven versions, so adding a capability produced a row with no id, no
  function and neither list, and the Capabilities page threw and rendered
  nothing. A reader that crashes is loud; **a writer that mints the old shape
  is silent until somebody opens the page that reads it** — a different page,
  reached from a different menu, so the two are never seen together.
- **A CHECK KEYED ON MARKUP THAT NO LONGER EXISTS DOES NOT FAIL — IT PASSES
  QUIETLY** (§51.11). Three in one day: the sweep's `unit/perf` label had never
  scanned Performance; a scoped probe broke when the sweep it string-matched
  changed and reported the page behind as the new surface; and reshaping the
  Units | Functions control would have left `qa.py` reporting "ok" having
  walked half the product. **When a control changes shape, grep the checks for
  the old selector before trusting the next green run**, and make the label say
  which page was actually scanned.
- **MEASURING THE THING YOU BUILT PROVES WHAT YOU BUILT, NOT WHAT WAS ASKED
  FOR** (§51.7). Islam said Units | Functions was "still 2 buttons"; I measured
  one container, showed him the box, and argued. The measurement was true and
  the answer was wrong — it *was* two buttons dressed as one, so pressing it
  selected a side rather than switching. B1 says verify by measuring; it does
  not say measure the answer you already have.
- **Manage slides is a MODE, and its rail is the WHOLE deck** (§51.8): every
  generated slide as a real slide at one tenth, which is what removed the
  position dropdown — a picture slide is placed by where it is inserted.
  `slidesPlace()` is the ONE function behind both Add and the arrows, and it
  removes the slide from the list before counting what sits before it, or the
  slide creeps. A blank slide is drawn in the editor only (`pslideHtml(sl,
  blank)`) — never on a projector. A picture **fits** its frame by default;
  Fill is chosen, because §16.12 asks for a screenshot first and a screenshot
  with its edges cut off is not a screenshot of anything.
- **A READER MUST NEVER CREATE THE FIELD IT WAS LOOKING FOR** (§42, §50.6).
  `branding()` invented a four-null object the database never held, so every
  save carried a phantom group change and every non-SMO save would have been
  refused for ever. Accessors return a shared **frozen** empty rather than
  building a container, the writing half is a separate function, and removing
  the last item deletes the key again.
- **A CHECK THAT MEASURES THE WRONG THING PASSES** (§50.6). The contrast sweep
  clicked a unit and called what appeared `unit/perf`; since §28 a unit opens
  on Strategy › Plan, so for twelve versions it measured Plan twice and
  Performance never — 31 real failures invisible the whole time. Same day, a
  scoped probe broke when the sweep it string-matched changed, and silently
  reported the page behind as the new surface. **Assert the contract, and make
  the label say which page was actually scanned.** A MODAL AND A DECK SLIDE ARE
  NOT PAGES — scan their own subtree, or the page behind is counted again under
  a second name.
- **`--gold-deep` on `--surface-2` is 4.45:1** — §38.5, and the fifth time.
  When an accent must stay the mark, MOVE THE GROUND to `--surface`, and put
  hover on the border rather than the fill or the failure comes straight back.
- **Screen preferences live in `localStorage`, never in the state graph**
  (§25, §47.1): the theme, the People page's visible columns
  (`smp.people.columns`), the Setup rail's collapsed state (`smp.setup.rail`).
  A saved map is always **merged** with the current defaults, never
  substituted — a key added later is absent from a map written before it
  existed, and reading absent as `false` hides every new thing from everyone
  who ever touched the control (§30.2).
- **A menu's action fires BEFORE the menu closes** (§47.2). Closing it from the
  button's own handler unmounts the control the click is still inside — the
  same fault the React note below records, and the same one HR_ERP records
  against its bulk password action. And **every exit repaints, including the
  cancelled ones**, or the state says closed while the panel is still on screen.
- **Setup is a PAGE with a rail, and it is the ONLY door (since v3.17, §46.1,
  §47.7):** the gear is not a menu — it navigates straight to the page, which
  carries all sixteen entries in five groups, *Running the cycle* first. It
  lands on the def marked `primary`, never merely the first in the array. A
  group folds, but **never the one holding the current page**. The old Manage
  menu, `MENU_OPEN` and all its CSS are gone (§24). `SETUP_GROUPS` in `shell.html` is the
  order and `grp` on each def is its group — one list, so a page cannot be in
  two groups or none. **Figure sets is one page with two sections** and is
  gated on `c_source` (`area:"always"`), never on `c_sets`, or a set owner who
  is not the SMO loses the page they exist for. A Setup page's sections render
  INSIDE its pane, not in the chrome's third row. `reachable()` is the ONE
  function that answers "is there anything behind this tab" — the menu and
  `paint()` must never ask it differently.
- **Searchable dropdowns (since v3.15, §45.5):** `src/searchsel.js` enhances
  **every** `<select>` in the platform once its list passes five options —
  `SEARCHSEL.wire()` runs at the end of `paint()`, after `wire()`. The native
  select is **hidden in place, never replaced or reparented**, so every existing
  `change` handler and `sel.value` read keeps working; choosing fires a real
  `change` on it. Three rules it obeys and you must too: typing never repaints
  (§35), the popup is unhooked BEFORE the change fires (§30.1), and the button
  follows the select's `hidden` (§34). The popup is `position:fixed` because
  `.cfg` is an overflow container and would clip an absolute one.
- **On each version bump:** update the gate's link in `index.html`, bump `SHELL`
  **and** the platform filename in `sw.js`, `vercel.json`'s rewrite destination
  and `scripts/dev-server.js`'s `PLATFORM_FILE`, regenerate `db/seed-state.json`,
  and re-run the round-trip test.

### Current Directory Layout
```
SMP/
  CLAUDE.md               # this file
  README.md
  index.html              # access gate (AdminSMO) — predates the project folder
  SMP-Project-Folder/     # THE PRODUCT — sources, docs, mockups (see its README.md)
    CLAUDE-RULES.md       #   working rules (operative)
    DECISIONS-AND-LOGIC-vX.Y.md
    strategy-management-platform-vX.Y.html   # the built prototype
    src/                  #   sources + build.py + qa.py
    mockups/              #   settled / pending / rejected design work
  .specify/               # spec-kit: templates, scripts, memory/constitution.md
  specs/                  # spec-kit feature specifications (one folder per feature)
  ui-versions/            # UI snapshots before edits (created on first UI edit)
```

---

## Configuration

- **Env vars:** `DATABASE_URL` (or the other standard Neon names) — set by the Neon
  integration in the Vercel project, read by `api/state.js`. Nothing else.
- **Database:** Neon Postgres (see Repository above). Schema and seed are applied by the
  platform itself on first contact with an empty database; migrations are Claude's job —
  never ask the user to paste SQL or a connection string into chat.

### Build Commands

Every command, with one line on what it is for. The reasoning behind each
check — what it was written against, what it was proved able to fail — is in
`CLAUDE.full.md` lines 8633–11090.

```bash
cd SMP-Project-Folder/src
  # the working directory every check below assumes
python3 build.py
  # assembles strategy-management-platform.html (must be byte-identical to the shipped vX.Y file)
python3 qa.py
  # walks every page as every viewer, reports console errors (needs Playwright + Chromium)
python3 checks/built-in-step.py
  # THE SHIPPED FILE IS IN STEP WITH ITS SOURCES (§349). CLAUDE.md has required build.py's output…
node smp-app/checks/modules.mjs
  # a module per client, and every module serving itself (§320.5, §363) — npm run check:modules…
node smp-app/checks/tracker.mjs
  # the Internal Tracker, the office's weekly list per client (spec 054, §356) — npm run…
node smp-app/checks/notes.mjs
  # Meeting Notes: one meeting, one note, and the minutes as an email (spec 055, §357) — npm run…
node scripts/test-my-reporting.js
  # MY REPORTING: the lines a tactic's owner enters (§382, spec 062) — no browser and no database…
python3 SMP-Project-Folder/src/checks/my-reporting.py
  # ...and the presses (§382): the tab drawn on the person's own place and nowhere else, a figure…
node smp-app/checks/portfolio-module.mjs
  # Portfolio serves itself — the landing and a project's charter (spec 060 §12, §439) — npm run…
node smp-app/checks/portfolio.mjs
  # the delivery plan's RULES and TABLES, before any screen (spec 060, §375) — npm run…
node scripts/test-nav-row.js
  # WHAT THE DESTINATION ROW OFFERS, AND WHY (§383). No browser and no database: the SHIPPED…
node smp-app/checks/view-as.mjs
  # viewing as somebody, on a READ path (§383) — npm run check:viewas, no database and no browser…
node smp-app/checks/insights.mjs
  # the library, and who can see one report (spec 053, §355) — npm run check:insights, needs a…
python3 SMP-Project-Folder/src/checks/publishing-room.py
  # the room Forefront publishes from, and who can see one report (spec 053, §355). NO DATABASE…
python3 checks/blob-api.mjs
  # (in smp-app: npm run check:blob) the clip endpoint on the new stack (§316.5): the door in…
python3 SMP-Project-Folder/src/checks/console-boot.py
  # the console asks once, and asks both at once (§369). Islam: *"the window is not active on…
python3 checks/deck-pdf.py
  # the deck on paper (§296): the entry beside Present on all three deck shapes with the word PDF…
python3 checks/review-pptx.py
  # the review deck as a PowerPoint (§311): the file is BUILT and READ BACK — the real…
python3 checks/drivers-switch.py
  # revenue drivers On | Off (spec 063 §6.7, §389): the real control pressed both ways, the…
python3 checks/presentation-timer.py
  # a clock on the review (§340): the minutes set in the flow and read back off the STORED graph…
python3 checks/contingency.py
  # the contingency files (§297): the card, the banner and the list drawn for the office and…
python3 checks/import-page.py
  # Import & archives, three tabs (§295): the mode switch gone from BOTH tabs and Build a plan…
python3 checks/project-row-type.py
  # a project row's type is a picker and its direction opens (§292): ONE way to add a row and…
python3 checks/yn-in-progress.py
  # a yes or a no that can be under way (§300): the three answers are the product's own words, the…
python3 checks/report-blockers.py
  # the reporting page says WHERE Submit is held (§279): the bar's chips asserted as AGREEMENT…
python3 checks/cycle-edit.py
  # editing the cycle that is running (§261): the strip carries ONE control and neither Close the…
python3 checks/fold-caret.py
  # the caret belongs to the disclosure (§287): the two strips that do NOT fold draw none, open…
python3 checks/attention-dismiss.py
  # every attention item can be ANSWERED, on the box it is about: one item per kind (five of six…
python3 checks/direction-part.py
  # a direction owner sees their part only (§517): the half eye in the Part owner row's Group /…
python3 checks/access-merged.py
  # Roles & access is one table of 48 cells drawn over the stored 117 (§516): the shape asserted…
python3 checks/required-fields.py
  # the Add someone form says what it needs (§506): the star on Full name and Email and nowhere…
python3 checks/people-dialog.py
  # the register reads and the dialog writes: the queue, Add, and neat with every column on (§116…
python3 checks/register-header.py
  # one line above the table and a dialog that fits the window — the HEADER's height, not…
python3 checks/role-picker.py
  # giving somebody a role: every control PRESSED, both ends asked, and the absences asserted (§110)
python3 checks/strategy-split.py
  # the Strategy | Reporting halves: the cell pressed open AND closed, both ends each time — and…
python3 checks/report-saves.py
  # reporting REACHES THE STORED PLAN and schedules a save, on a unit, a capability function AND…
python3 checks/report-note-wrap.py
  # the reporting note is PROSE (§271): nothing clipped sideways with a real sentence in it on all…
python3 checks/project-dates.py
  # a project's Start and End are PICKED as Jul 26, and the overrun warning reads them the…
python3 checks/refusal-keeps-work.py
  # a refusal costs the row it named and nothing else (§184): one refused row among three, the…
python3 checks/submit-gate.py
  # Submit is shut until the report is complete and the plan holds no gaps, with the reason on…
python3 checks/division-functions.py
  # a supporting function belongs to a division and counts in it (§391): a company with no…
python3 checks/objectives-actions.py
  # the third way a function plans (§342, spec 049): the format is a THIRD value read back off the…
python3 checks/pillar-breakdown.py
  # a breakdown of a pillar's targets (§343, spec 050): the state is MADE and PUT BACK (§255…
python3 checks/capability-report-column.py
  # a capability's reporting page asks the column that judges it (§341): measured on the SHIPPED…
python3 checks/functional-projects.py
  # a function's projects are its own (§326, spec 048 stage 1). Islam: "the problem with having…
python3 checks/capability-remove.py
  # removing a capability: two answers, not one (§325). Islam: "when I try to remove the…
python3 checks/pillar-kind.py
  # a pillar says which kind of thing it is (§324): the mark DRAWN on the Plan rail and band, the…
python3 checks/objectives-table.py
  # the objectives table with the monthly drawer in it (§278.3): opening the drawer moves NO…
python3 checks/template-round-trip.py
  # the template carries what the platform holds (§294): a FIXED POINT, never a list of columns…
python3 checks/monthly-plan.py
  # a target with a shape of its own (§278): the arithmetic asked of the rule, the drawer PRESSED…
python3 checks/tactic-outcome.py
  # a tactic is judged by what it produced (§248, §249): the claim is not that the columns are…
python3 checks/tactic-proration.py
  # a tactic's OUTCOME is measured against its own window, not the year (§250): the share asserted…
python3 checks/unit-follows.py
  # a reported figure follows the target's unit (§277): the story through the REAL controls on a…
python3 checks/count-compile.py
  # a count is owed in whole ones (§276): the ONE compile list and what on it prorates (both…
python3 checks/measure-score-spread.py
  # a summary is made of the number it summarises (§257): a card's Highest and Lowest, and the…
python3 checks/reporting-ytd-target.py
  # what a row is measured against, in the column beside the box it is typed into (§344): the…
python3 checks/ytd-proration.py
  # YTD is measured against the part of the year that has PASSED (§239): the review point is a…
python3 checks/project-done.py
  # a project owner reports, and the bar stops saying View only (§301): the chip built from the…
python3 checks/capability-first.py
  # theirs is the capability that leads (§310): on Projects, Reporting and Performance the…
python3 checks/deck-figures.py
  # a figure is read against what it is measured by (§254): the benchmark asserted as AGREEMENT…
python3 checks/master-presentation.py
  # one flow, several decks, back to back (§261): agreement and never a number — the flow's slide…
python3 checks/deck-strip.py
  # one deck's strip is labelled and its pills grouped (§266.12): the codes asserted as AGREEMENT…
python3 checks/master-picker.py
  # the picker is two tables, searched, and dragged by its own numbers (§266.10): Kind asserted as…
python3 checks/deck-dividers.py
  # the group's mark and the deck's four blue section dividers (§259): the blue asserted as…
python3 checks/deck-blank-slides.py
  # a table with no rows is not a slide (§253): every deck swept through the builder its own…
python3 checks/one-line-titles.py
  # a title is one line and the box says so (§255): a stored value carrying blank lines drawn as…
python3 checks/video-slides.py
  # a video in the review (§261): which links play and which are honestly refused, the policy and…
python3 checks/deck-outcome.py
  # the presentation reads what was reported (§252): the tactics slide's nine columns, its figures…
python3 checks/reported-note.py
  # a reported note is NAMED as one (§255): the note keyed and the description left plain — a…
python3 checks/setup-arrange.py
  # the Setup tables are arranged and their rows act from one menu (§261): a REAL pointer drag…
python3 checks/empty-not-missing.py
  # empty is not missing (§272): the office shown no bar with nothing owed AND still holding the…
python3 checks/fn-perf-controls.py
  # a supporting function's Performance controls sit where a unit's do (§275): both pages asserted…
node scripts/test-chat-chase.js
  # the platform collects, then sends one email (§293): nothing goes out while the collection…
python3 checks/gap-walk.py
  # the band's chips and Next gap actually go somewhere: a unit AND a function, as the filler AND…
python3 checks/viewer-line.py
  # the Viewing-as line: the roles and where each is held, of EVERY person — no em-dashes, the…
python3 checks/viewas-fresh.py
  # a view-as session starts where their session would start (§237): the switch rebases on the…
python3 checks/milestone-fill.py
  # a milestone is filled, and a bounded role fills only its own (§177): every red Missing the…
python3 checks/unit-before-number.py
  # the unit is picked BEFORE the number (§251): the picker drawn on a row with no target on all…
python3 checks/gap-fill.py
  # fill the gaps (§145): the third toggle where it belongs and nowhere else, fill mode's fields…
python3 checks/owner-picker.py
  # an owner is picked from the register, not typed: all five fields PRESSED through the real…
python3 checks/rail-standard.py
  # one item still gets the rail, on a unit AND a function — it MAKES the one-pillar unit, the…
# TWO CHECKS NEED PILLOW (§328.6): home-mark.py and chat-settings-scroll.py read
# painted pixels through PIL and die with ModuleNotFoundError where it is absent,
# which reads like a failure in a summary and is not one — `pip install pillow`.
# band-corner.py argues the other way in its own docstring and unfilters the PNG
# by hand; not reconciled, and said rather than left to be rediscovered.
python3 checks/capability-pillar-edit.py
  # a capability planned in pillars can be EDITED (§411): the quarter buttons, the hide eye and…
python3 checks/structure.py
  # the client's structure (§404): Setup › Structure's boxes pressed and read back, one adjustment…
python3 checks/detail-layers.py
  # the plan details per layer (§420): the rule asked per layer with the client-wide fallback, the…
python3 checks/plan-switch.py
  # the plan section switches per layer and the extra details split in two (§422): Off asks…
python3 checks/structure-sections.py
  # each layer's three sections as the pages read them (§418): the first section off, titles, S&W…
python3 checks/pillar-rail.py
  # clicking a pillar opens THAT pillar (§393): the rail keys on the row id, never the stored…
python3 checks/band-corner.py
  # the pinned title's corners, measured in PIXELS because a DOM probe calls the broken build…
python3 checks/control-targets.py
  # how big a control is, and how far from its neighbour (§484). NO CHECK IN THIS PRODUCT HAD EVER…
python3 checks/no-jump.py
  # nothing moves the register under you — the act of OPENING a row included, since §110.7
python3 checks/plan-edit-line.py
  # the strategy pen is ON the section line (§268): every section on both sides of the switch…
python3 checks/plan-builder.py
  # building a plan ON the platform: the door, the chooser, the band's map, every row form asked…
python3 checks/project-custodian.py
  # a custodian per project (§147): the Project owner's project takes their figures, the one…
python3 checks/access-header.py
  # the matrix header: two lines at four widths, centred, BOTH rows pinned while the rows scroll…
python3 checks/stay-put.py
  # a refresh stays where you are, and a NEW session still opens where §94.6 says (§173)
python3 checks/history-page.py
  # History (§262): the page in the rail for the office over HTTP and not over file://, the ask…
node scripts/test-history-read.js
  # ...and the server half on a real Postgres: real saves NEEDS A REHEARSAL DATABASE (§328.3), and…
python3 checks/safety-banners.py
  # the page warns BEFORE a save can be lost (§258): the tab asks the server about its own page…
node scripts/test-safety-peek.js
  # ...and the server half against a real Postgres: who else, when, the asker excluded, a function…
node scripts/test-session-state.js
  # nothing session-level on the pooled connection (§289.2): every server file read, comments…
node scripts/test-db-url-choice.js
  # the direct connection is asked for FIRST (§313.34): a client's schema is chosen with SET…
node scripts/test-client-badge.js
  # a client's connection wears that client's badge (§313.35): both ends every time — what the…
node scripts/test-cold-starts.js
  # two cold starts, one new migration, a POOLED connection (§289): the pooler is modelled…
python3 checks/save-said.py
  # a save that FAILS says so on the page: a server error naming its status, an unreachable…
python3 checks/setup-sticky.py
  # a Setup page that FITS does not scroll, and nothing pinned ends up behind the chrome — over…
python3 checks/scoring-bands.py
  # the scale is the tenant's: add, remove and recolour a level, every control PRESSED and…
python3 checks/perf-line.py
  # the Performance line: Report, Presentation and Bands on the tab row, three bands, the hover…
python3 checks/squeezed-rail.py
  # below 820 the rail reads ACROSS on both sides, and the demo banner's invented-content line is…
python3 checks/table-fit.py
  # the plan tables FIT the pane at every width — never "and it scrolls" — on a unit AND a…
python3 checks/plan-tail-fold.py
  # the plan table at a narrower window (§267): above 1400 byte-for-byte what it was — a build…
python3 checks/email-link.py
  # the link that LEAVES, read out of the html posted to /api/mail — never the value in the box…
node scripts/test-push.js
  # a box with no tab open (§231): a throwaway HTTPS server stands IN FRONT of the real push…
python3 checks/setup-squeezed.py
  # the Setup page is not a unit's plan page (§296): at 1250/1100/1000/950 the rail is a 196px…
python3 checks/office-ask.py
  # Waiting and Ask, and the list the questions fill (§299): BOTH ENDS of the switch (with Ask off…
node scripts/test-ask.js
  # ...and the server half on a real Postgres with a stand-in for the model (§100.3): off is a…
python3 checks/corner-reply-box.py
  # no composer over a list of people, and a test that says what it cannot see (§298): on the…
python3 checks/chat-settings-scroll.py
  # the settings panel scrolls inside itself (§294): the panel capped and scrolling, the page's…
python3 checks/office-chat.py
  # the chat's client half — serves the built file over HTTP, because the whole feature is…
python3 checks/welcome.py
  # the welcome screen (§148): three viewers over HTTP, every row asserted against the function…
python3 checks/home-mark.py
  # the home mark: centred in the row, square at every width, gold exactly when something is…
python3 checks/setup-rail.py
  # the Setup rail fits the window, every entry is reachable by scrolling the LIST, and the cap…
python3 checks/cycle-board.py
  # every subject that reports has a row, the functions are in ONE list under one band, and the…
python3 checks/hide-slide.py
  # the office hides a slide and the projector skips it (§256): every headline number…
python3 checks/video-keys.py
  # the keyboard belongs to the presentation (§297): focus landing in a player handed straight…
python3 checks/present-loop.py
  # play from the editor, and come back to it (§295): Play beside Done on ONE row (two auto…
python3 checks/deck-fullscreen.py
  # fullscreen is the slide, the arrows and nothing else (§265): REAL fullscreen, the bar measured…
python3 checks/notes-slide.py
  # the notes slide appears when somebody wrote a note — and whitespace is not a note, on all…
python3 checks/client-setup.py
  # the set-up flow inside the platform (§360, spec 057): the bare state MADE (§255), the Getting…
python3 checks/attention-rows.py
  # what is waiting on the office — one list, three readers, and no fourth (§359, spec 056 §9.1)…
python3 checks/setup-per-module.py
  # a def knows its module, and the rail draws by it (§359.2, spec 056 §4.2–§4.3): every def…
python3 checks/setup-search.py
  # the rail's search: typing NEVER repaints, a repaint keeps the filter, and a match inside a…
python3 checks/setup-header.py
  # the page's controls share its pinned line, the counts and the SMO pill are gone, the matrix's…
python3 checks/send-overview.py
  # Send an email opens on the record, writing is the second subtab, and a send LANDS back on the…
python3 checks/email-greeting.py
  # the greeting row is ONE line with no prose, the switch does not move, and what the page POSTS…
python3 checks/setup-pages.py
  # every Setup page is named ONCE and in the rail's own word, and the name and the table head…
python3 checks/save-fidelity.py
  # WHAT THE SCREEN HOLDS IS WHAT THE SERVER HOLDS (§210): real controls driven — typing with the…
node scripts/test-graph-diff.js
  # the change list on its own: only what changed travels, applying it to a DIFFERENT target…
python3 checks/enter-commits.py
  # Enter commits a growing one-line box instead of inserting a newline, and a rows-2 area keeps…
python3 checks/fn-ko-edit.py
  # a function's objectives are written at the page's width (§226): the editing table in a band on…
python3 checks/fn-pillars.py
  # the two supporting-function formats draw ONE Overview: asserted as their AGREEMENT, never as a…
python3 checks/knowledge-base.py
  # the page and db/kb.json draw from ONE source — the AGREEMENT, never the count (§103)
python3 checks/kb-file.py
  # the questions file (§161): the round trip is a FIXED POINT — downloaded and uploaded untouched…
node scripts/test-kb-audience.js
  # who sees which answer (§160): an office answer absent for everybody else AND still present for…
DATABASE_URL=… node scripts/test-roundtrip.js
  # seed a tenant in public
DATABASE_URL=… node scripts/migrate-to-multi-client.js
  # split it into schemas
DATABASE_URL=… node SMP-Project-Folder/src/checks/fixture-platform.js
DATABASE_URL=… node scripts/test-platform.js
  # the boundary, on the server
DATABASE_URL=… node scripts/test-platform-rules.js
  # the seats and the admin flag
DATABASE_URL=… SMP_CHROME=… python3 SMP-Project-Folder/src/checks/multi-client.py
  # the door holds nothing but sign-in; the cards, the seats read-only, the Demo button gone for…
DATABASE_URL=… SMP_CHROME=… python3 SMP-Project-Folder/src/checks/platform-look.py
  # Forefront's own two pages: contrast in both themes and no sideways scroll at four widths…
node smp-app/checks/memory-boundary.mjs
  # …and since §331 it also asserts that the two copies of WHICH TABLES ARE THE PLATFORM'S OWN…
node smp-app/checks/office-standing.mjs
  # the office's own row keeps its standing (§338) — npm run check:standing, needs a database. An…
node smp-app/checks/generated-in-step.mjs
  # the served copies are in step with the frozen sources (§329): smp-app/public/ is generated by…
DATABASE_URL_UNPOOLED=… node smp-app/checks/schema-room.mjs
  # the shared schema has a room of its own, and public is a CLIENT (§317.4) — it BUILDS the real…
node smp-app/checks/deploy-context.mjs
  # what reaches the build (§317.3): .vercelignore excluded smp-app/ itself, so Vercel deleted the…
SMP_CHROME=… python3 SMP-Project-Folder/src/checks/platform-cards.py
  # the worked example is not one of the clients (§317) — out of the client grid and below it…
DATABASE_URL=… node scripts/seed-demo-client.js --dry-run
  # what the Demo client would hold
DATABASE_URL=… node scripts/migrate-to-multi-client.js --dry-run
```

Commands that sat in the prose between those blocks rather than in them:

```bash
DATABASE_URL=… node scripts/test-video-roundtrip.js
  # a video slide needs no migration — round trip on a throwaway Postgres (§261.1)
DATABASE_URL=… node scripts/test-video-endpoint.js
  # the clip endpoint's refusals; sets a NONSENSE store token on purpose (§261.5)
DATABASE_URL=… node scripts/test-capability-move.js
  # a project changing hands survives a save; both ends asserted (§325)
DATABASE_URL=… node scripts/test-functional-projects.js
  # a function's projects need no column; the one-off move, run once (§326)
DATABASE_URL=… node scripts/test-two-tabs.js
  # two people, one database — SMP_WHOLE_GRAPH=1 must go red (§210)
DATABASE_URL=… node scripts/test-email-greeting.js <smo-password>
  # the mail half; spawns its own dev-server (§142.6)
DATABASE_URL=… node scripts/test-test-copies.js <smo-password>
  # a test copy is a send, and it says so (§146)
DATABASE_URL=… node scripts/test-one-line-heal.js
  # the one-off heal of stored titles; both ends asserted (§253)
SMP_CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome python3 qa-run.py <file>
  # in this cloud image, run any sweep through the wrapper so Playwright finds Chromium
DATABASE_URL=… node scripts/test-chat.js <smo-password>
  # the chat's server half; needs a database and a running dev-server (§97.9)
```

Note on the archive: at `CLAUDE.full.md:10858` and `:10872` the invocations
for `test-functional-projects.js` and `test-capability-move.js` are spliced
into each other by an earlier edit. Both are written out correctly above; the
damaged lines are left in the archive as they are.

## Common Tasks

### UI Version Tracking (MANDATORY)
Before editing any UI file, copy it to
`ui-versions/<component-name>/<YYYY-MM-DD>_<short-description>.<ext>`. The snapshot
is the rollback point; the live file is the new version. This exists because
prior sessions (on HR_ERP) accidentally reverted agreed-upon designs.

### Before Committing
1. Run the project's checks (today: exercise the page; later: `npx tsc --noEmit`).
2. Review all changed files.
3. No secrets committed (`.env.local`, tokens, keys).
4. If a UI file changed, confirm the `ui-versions/` snapshot was saved.
5. If a schema/seed file changed (future), confirm the matching SQL migration was regenerated.

### Keeping Docs Current (MANDATORY before merging to main)
1. Update this **`CLAUDE.md`** if a new pattern/rule/workflow was established or project facts changed.
2. Update **`SMP-Project-Folder/DECISIONS-AND-LOGIC-vX.Y.md`** for every decision, reversal, or
   built backlog item — in the same commit as the code (rule A7/A8).
3. Update **`SMP-Project-Folder/README.md`** when a mockup's status changes or the "where things
   stand" picture moves.
4. Update the relevant **`specs/`** feature spec if product behavior changed.

---
## Changelog index

The 311 entries that ran from here to the end of the file, newest first.
One line each. Full prose in `CLAUDE.full.md` lines 11115–23048.

- 2026-10-12 entering figures from the keyboard → §528
- 2026-10-11 the sweep of the merged tree, and the proof that could not walk → §526
- 2026-10-11 a capability's owner opens on their capability → §520.11
- 2026-10-11 a capability's owner and a direction's owner read their own progress in the… → §520.10
- 2026-10-11 merged to `main` on Islam's word → §520.9
- 2026-10-11 the capabilities reporting section is one section, with a rail → §520.8
- 2026-10-11 a capability planned in pillars reports its measures and tactics → §520.7
- 2026-10-11 a capability's owner reports their own capability → §520.6
- 2026-10-11 a capability owner reads their own capability's figures → §520.5
- 2026-10-11 a capability's owner is a part owner → §520
- 2026-10-10 the last three from the Foundation flow UX review → §525.1
- 2026-10-10 four of seven from a UX review of the Foundation flow → §525
- 2026-10-10 "On the plan" is written only after the plan saves → §524.1
- 2026-10-10 the trail is quiet while you are viewing as somebody else → §519
- 2026-10-10 the section is called Competitive Discipline → §518
- 2026-10-10 a direction owner sees their part only, when the office says so → §517
- 2026-10-08 Save needs only the six parts, and Apply to plan is its own press → §524
- 2026-10-08 spec 066 merged to `main` on Islam's word → §516.4
- 2026-10-08 the Reporting cycle is the office's alone too, and the CEOs stop marking… → §516.3
- 2026-10-08 Setup is the office's alone, and the column headings in Islam's words → §516.2
- 2026-10-08 two ceo rows, Setup never offered to them, and a Part owner who may read → §516.1
- 2026-10-07 stage 2 of spec 066 built — one Roles & access table → §516
- 2026-10-07 stage 1 of spec 066 built — the numbers mean one thing → §515.2
- 2026-10-07 stage 1 of spec 066 started, measured before any rule moves → §515.1
- 2026-10-08 the part names are the client's words, the check's results belong to the… → §514
- 2026-10-07 a Foundation part is edited from its card → §513
- 2026-10-07 a part of the Foundation opens at every step, and a typed line opens the part… → §512
- 2026-10-07 the Add someone form says what it needs → §506
- 2026-10-07 a direction's owner and custodian are a row on Roles & access → §505
- 2026-10-07 a failed save is kept on this computer, and can be sent to the office → §504
- 2026-10-06 the Internal Tracker's topic has its own column, right before the week → §503
- 2026-10-06 a capability's Target box can be read, and a failed save says enough to trace → §502
- 2026-10-06 the Copilot lives inside Strategy, its settings on the console (spec 064) → §501
- 2026-10-06 the company's capability is edited like a direction → §500
- 2026-10-06 the Internal Tracker wears Forefront's colours, never the client's → §499
- 2026-10-06 /the Internal Tracker gets topics and the ledger page, and the band's words… → §497
- 2026-10-06 Advisory in the Copilot (spec 064) → §496
- 2026-10-06 Execution in the Copilot, and Setup › Planning & reporting cycle (spec 064… → §495
- 2026-10-05 Directions and Capabilities, in the Copilot (spec 064 stage 2) → §494
- 2026-10-05 How we compete, in the Copilot (spec 064 stage 1b) → §493
- 2026-10-05 How we compete, in the plan (spec 064 stage 1a) → §492
- 2026-10-05 a capability planned in pillars is shaped like one direction → §491
- 2026-10-04 one rail width, a compact to-do, the old help library, a Foundation to-do → §490.2
- 2026-10-04 the swot chat compacted → §490.1
- 2026-10-04 the swot Copilot flow (spec 064) → §490
- 2026-10-04 the company's capabilities can be edited in place → §488
- 2026-10-04 the four acts the console record was still silent about → §487.1
- 2026-10-04 the console keeps a record, and reads it back as History → §487
- 2026-10-04 (drawn, not built): the console's record as a History page → §486
- 2026-10-04 the gold has an ink of its own → §485
- 2026-10-03 the edge of a box is not a gridline, and a destructive control has a size of… → §484
- 2026-10-04 the company's directions on Performance, and the ink on the accent → §483
- 2026-10-04 the company's capabilities, drawn like its directions → §482
- 2026-10-04 a direction's own deck, and the company's short review → §481
- 2026-10-03 the cycle board, one line per direction → §480
- 2026-10-03 Structure decides, and nothing is optional → §479
- 2026-10-03 a Foundation chat starts from what is there → §478
- 2026-10-03 the second try can only return the text → §477
- 2026-10-02 a change claimed is a change shown → §476
- 2026-10-02 more room for the Copilot → §475
- 2026-10-02 no quick reply is marked recommended → §474
- 2026-10-02 the guided Foundation flow → §473
- 2026-10-02 the Copilot asks first, saves a draft, and shows one word while it works → §472
- 2026-10-02 the Copilot talks naturally → §471
- 2026-10-02 the Copilot chat's text size → §470
- 2026-10-03 a company direction's owner and custodian → §469
- 2026-10-02 the Structure cards in the agreed order → §468
- 2026-10-02 the company plans in projects → §466
- 2026-10-02 the Structure cards, and capabilities in one place → §465
- 2026-10-02 planned on the company, the row is the functions and the divisions are its… → §464
- 2026-10-01 one mark per client → §461
- 2026-10-01 the Copilot talks like a consultant → §460
- 2026-10-01 Processes (FFProcess) carried into SMP (spec 065), merged to `main` 2026-10-01… → §459
- 2026-10-01 the Copilot asks before it refines, the page stops scrolling, a busy provider… → §458
- 2026-10-01 the Copilot reads the plan's own words, and asks a busy provider once more → §457
- 2026-10-01 the Copilot gets a page and settings of its own → §456
- 2026-10-01 the Copilot's paperclip is centred in a 30px strip under the box → §455
- 2026-10-01 a Copilot column on Roles & access, View or Edit → §454
- 2026-10-01 the Copilot tab appears the moment it is turned on, and its chat reads like… → §453
- 2026-09-30 the Strategy Copilot, stage 2 — the AI in a chat (spec 064) → §452
- 2026-09-30 the Strategy Copilot, stage 1 (spec 064) → §451
- 2026-10-01 the merge with `main` , and the witness I had written off → §443.10
- 2026-10-01 the add box keeps what it has just used, and the panel shuts behind every… → §443.9
- 2026-10-01 the plan question's two buttons sit under it → §450
- 2026-09-30 an Objectives & actions unit moves across as one direction → §447.1
- 2026-09-30 one company, its directions on its own page → §447
- 2026-10-01 one top bar for every module → §444
- 2026-10-01 Portfolio — writing a plan, built (spec 060 ) → §443
- 2026-09-30 Portfolio — writing a plan, drawn and not built (spec 060 ) → §442
- 2026-09-30 a business unit says how it plans in Client set-up → §438
- 2026-09-30 a supporting function's key objectives are a tick on its first section → §437
- 2026-09-30 one row's settings stay changeable on a client with a plan → §436
- 2026-09-30 one item's exceptions live on its layer's card → §435
- 2026-09-30 the group's own swot and Plan start off → §428.2
- 2026-09-30 the top layer's own plan, and capabilities as a card → §428
- 2026-09-30 Structure ticks that change nothing are drawn off, greyed and unpressable → §427
- 2026-09-29 a function's Structure row offers what its page can show → §426
- 2026-09-29 Raya keeps what it sees, and the Structure branch merges → §423.1
- 2026-09-29 a supporting function's S&W waits for the office → §423
- 2026-09-29 the top level's type can be changed on a client with a plan, and the plan… → §421
- 2026-09-29 each layer has its own switches for the plan details → §420
- 2026-09-29 the Structure step keeps every key it does not draw → §418.1
- 2026-09-28 each layer's three sections, set on Structure → §418
- 2026-09-28 a word is not the shape, and one order for the module menu → §417
- 2026-09-29 a capability planned in pillars can be edited like a unit's plan → §411
- 2026-09-28 years 1 &middot; 2 &middot; 3, and the yearly revision → §416
- 2026-09-28 a tactic's requirements → §415
- 2026-09-28 several outcomes per tactic → §414
- 2026-09-25 a direction's overview → §413
- 2026-09-24 a capability has its own owner and custodian, reversing → §412
- 2026-09-24 a tactic's status is RHI's words, picked by the platform → §419
- 2026-09-30 a crossing quietly catches up → §433
- 2026-09-29 Strategy ↔ its settings is a press, not a page load → §432
- 2026-09-29 the platform opens on the last saved copy, then updates → §431
- 2026-09-24 the plan page restyled, a quieter top bar, and the typeface switch gone → §410
- 2026-09-24 the section switch is squared → §409.3
- 2026-09-24 Reporting is a filled button again, and no tab draws a box → §409.2
- 2026-09-24 the tab banner → §409
- 2026-09-24 is reverted → §408.1
- 2026-09-24 a light row for the office, a navy bar for the unit → §408
- 2026-09-24 what left, finished → §405.1
- 2026-09-24 a business unit chooses how it plans → §405
- 2026-09-24 the client's structure → §404
- 2026-09-24 a console tab shows what it last showed, then catches up → §400.2
- 2026-09-24 the trail's first word reads Platform → §400.1
- 2026-09-24 Home says only where you are → §403
- 2026-09-24 one typeface, and one Viewing as → §402
- 2026-09-24 the trail's two menus → §401
- 2026-09-23 moving between the console, a client and its modules → §400
- 2026-09-24 a supporting function has its own Strengths and Weaknesses (merged to `main`… → §399
- 2026-09-23 the client's words reach every screen → §395
- 2026-09-23 clicking a pillar opens that pillar → §393
- 2026-09-23 one word per thing, in two forms → §392
- 2026-09-22 a supporting function can belong to a division → §391
- 2026-09-23 Revenue drivers (spec 063), an On | Off switch, and the merge → §389
- 2026-09-22 the second renumber, the merge, and two guards a decision had already… → §388
- 2026-09-22 the renumber owed before the merge, and what the sweep took with it → §385.3
- 2026-09-21 the second half of the same sentence — `main` comes in → §385.2
- 2026-09-21 the merge, and the two intersections → §385.1
- 2026-09-21 the reports' filters are the reports that exist (spec 061) → §385
- 2026-09-20 a tactic's owner is a row on the table → §384
- 2026-09-20 the tab that filled the row, and the mirror that showed your own face (spec 061) → §383
- 2026-09-22 one blank template per way of planning (spec 059) → §380
- 2026-09-21 the working copy carries the platform, not a link to it (spec 030) → §379
- 2026-09-20 an address is taken whole (spec 059) → §378
- 2026-09-20 an address is a value, not a control (spec 059) → §377
- 2026-09-20 the reports, as a tab in the platform (spec 061) → §376
- 2026-09-20 My reporting — the lines a tactic's owner enters (spec 062) → §382
- 2026-09-20 Portfolio — the rules and the tables, before any screen (spec 060) → §375
- 2026-09-20 an address that is not unique is not an address (spec 059) → §374
- 2026-09-19 the open box, and the column that never said it was frozen (spec 059) → §373
- 2026-09-18 the cell is the control (spec 059) → §372
- 2026-09-18 the browser signs you in, and the console stops arriving deaf → §370
- 2026-09-17 the crossing between the two settings rails is a press → §367
- 2026-09-17 the four that were red, and what measuring them found → §366
- 2026-09-17 the sweep before the merge, and the four things it found → §365
- 2026-09-17 the Forefront team is a setup table (spec 058 a) → §364
- 2026-09-17 the trial module goes, and what its check proved stays → §363
- 2026-09-16 Forefront team is the store and the register is a reader (spec 058 a, stage… → §362.2
- 2026-09-15 the sweep, and the viewer a reload put back (spec 056 , plan step 6, on the… → §359.6
- 2026-09-16 the week by its month, cards that hold still, and a line that asks later… → §356.16
- 2026-09-15 the Internal Tracker's row, redrawn at Islam's word and built (spec 054) → §356.11
- 2026-09-14 a module is a folder that serves itself → §354
- 2026-09-13 one repository, and the line that is not drawn yet → §345
- 2026-09-13 a capability is a step, and the middle option takes the platform's own word → §347
- 2026-09-13 what the set-up flow never asked about is not the flow's to reset → §346
- 2026-09-13 a breakdown of a pillar's targets (spec 050) → §343
- 2026-09-13 the demo owes nothing → §353
- 2026-09-13 a capability is owned like a unit — and it already is → §336
- 2026-09-12 the rules the new stack runs are a copy, and nobody was comparing them → §335
- 2026-09-12 adding a module to a client, and a trial that proves it (spec 046 ) → §320.5
- 2026-09-11 removing a capability — the box, or the box and its work → §325
- 2026-09-10 8: the cutover, and the six things between the merge and a site that serves → §317.3
- 2026-09-08 the merge rehearsed, and what reading the merged tree found → §313.37
- 2026-09-08 a client's connection wears that client's badge → §313.35
- 2026-09-07 a project saved as a draft → §309
- 2026-09-08 and the review deck as a PowerPoint, and one PDF of the whole flow → §311
- 2026-09-07 the planning period, and the review cycle inside it → §308
- 2026-09-07 the contingency files → §306
- 2026-09-05 the deck on paper → §305
- 2026-09-05 Import & archives is three tabs — files out, files in, and the record → §304
- 2026-09-05 the template carries what the platform holds → §303
- 2026-09-07 4: the box, not the weight — and the mark grows in twos → §302.3
- 2026-09-07 a project owner reports, and the bar said View only → §301
- 2026-09-06 a yes or a no that can be under way → §300
- 2026-09-05 no composer over a list of people, and a test that says what it cannot see → §298
- 2026-09-05 a blanket renumber swept somebody else's citations → §264.3
- 2026-09-04 the platform collects for ten → §293
- 2026-09-04 one deck's strip is labelled, and its pills are grouped → §266.12
-            a row's type is a picker, and its direction opens → §292
- 2026-09-04 the corner arrives with the page, and the search reaches somebody who has… → §290
- 2026-09-04 the bootstrap's lock lives inside one transaction → §289
- 2026-09-04 a save stops shutting everybody else out, and a row says the register's name → §288
- 2026-09-04 the chat does not wait on a save, the notifications say where they stop, a… → §282
- 2026-09-04 the objectives table, and a cell that stopped being one → §278.3
- 2026-09-04 the dialog does not change size as rows move → §266.11
- 2026-09-04 the pen closes itself, and the banner is two columns — and "Open a new… → §273.4
- 2026-09-03 a target with a shape of its own → §278
- 2026-09-04 a reported figure follows the target's unit → §277
- 2026-09-03 a count is owed in whole ones → §276
- 2026-09-03 the group has a mark, and the → §259
- 2026-09-03 editing the cycle that is running → §273
- 2026-09-03 editing the cycle that is running → §273
- 2026-09-03 empty is not missing, and the bar now says which → §272
- 2026-09-03 the plan table at a narrower window → §267
- 2026-09-03 fullscreen is the slide, the arrows and nothing else → §265
- 2026-09-03 a saved draft can be submitted where it stands → §263
- 2026-09-03 History — who changed what, and a way back → §262
- 2026-09-03 the Setup tables are arranged, and their rows act from one menu → §261
- 2026-09-03 a title is one line, and the box *Earlier the same day → §260
- 2026-09-03 the page warns before a save can be lost → §258
- 2026-09-02 the plan download comes back, in the menu and for the office → §252.2
- 2026-09-02 a reported note is named as one → §255
- 2026-09-02 a tactic's outcome is measured against its own window → §250
- 2026-09-02 a tactic is judged by what it produced → §248
- 2026-09-02 the screen asks the column the save asks, the remove × gets its seat, and two… → §250
- 2026-09-01 the functions are on the function half, in one list; the cycle note is a line… → §245
- 2026-09-01 write only what changed — merged FLAG-OFF, off by default, not on the live line → §241
- 2026-09-01 saves take turns, so two at once cannot lose data → §240
- 2026-09-01 YTD is measured against the part of the year that has passed → §239
- 2026-09-01 the security follow-ups — a csp net and no dev files served → §238
- 2026-09-01 a view-as session starts where their session would start → §237
- 2026-09-01 / / the added slide moves slide by slide → §236
- 2026-09-01 one escaper, safe in an attribute → §235
- 2026-09-01 one function's submit must not carry everybody's report state → §234
- 2026-09-01 removing a pillar or a project → §232
- 2026-09-01 Enter commits a one-line prose box → §229
- 2026-09-01 a function's objectives are written at the page's width → §226
- 2026-08-31 a plan travels row by row, and a capability travels on its own → §215
- 2026-08-31 a supporting function's Overview is a supporting function's Overview → §211
- 2026-08-31 send what changed, and apply it onto our own copy → §210
- 2026-08-31 three from the welcome screen → §202
- 2026-08-31 the wall, and the fillable unit → §200.2
- 2026-08-31 the unit, the repeat in months, the Overview, the welcome screen's cycle, and… → §195
- 2026-08-30 an attention item you can answer, on the box it is about → §190
- 2026-08-30 a date the platform cannot read, and a refusal that costs only the row it named → §184
- 2026-08-30 a link in an email has nothing to be relative to → §176
- 2026-08-29 a Setup page that fits, an editable scale, the away threshold, and a change… → §167
- 2026-08-29 the Performance line, three bands, and two headers found lying across their… → §162
- 2026-08-29 the welcome screen's way out → §159
- 2026-08-28 the UI/UX audit, waves 2–4 → §149
- 2026-08-28 the welcome screen → §148
- 2026-08-28 a custodian per project → §147
- 2026-08-28 a test copy is a send, and it says so → §146
- 2026-08-28 Send an email opens on what went → §144
- 2026-08-27 the bar reports, and moves on → §136
- 2026-08-27 the register notices two people whose name reads the same → §131
- 2026-08-27 an owner is picked, a single item keeps its rail, and the pinned title's corners → §130
- 2026-08-26 building a plan on the platform → §129
- 2026-08-26 a tactic that names no quarter, a closing slide, and the overview's download → §128
- 2026-08-26 one line above the table, and a → v3.44 full:21283
- 2026-08-26 is the bot working, and the settings that sit under the question → §123
- 2026-08-26 the deck names its gaps, and the base becomes the office's → §119
- 2026-08-26 the CF tab, the add row, and a null that outlived its session → §118
- 2026-08-26 the Strategy | Reporting split, and the plan as slides → §117
- 2026-08-26 the register stops being a form → §116
- 2026-08-26 the assistant , and a chat that vanished → §111
- 2026-08-26 giving somebody a role → §110
- 2026-08-26 the Setup makeover, complete — the words, the window, the Overview, the search… → §108
- 2026-08-26 the onboarding tour → §107
- 2026-08-26 reordering comes back , and focus measures get a switch → §101
- 2026-08-25 the corner minimises, and the inbox follows the window → §100.4
- 2026-08-25 the corner, corrected by using it → §100
- 2026-08-25 one table, two halves → §99
- 2026-08-25 the chat gets a switch, and a poll gets cheaper → §98
- 2026-08-25 talking to the Strategy Office → §97
- 2026-08-25 the objectives editor was drawn and connected to nothing → §96
- 2026-08-25 the composer stays one screen → §95
- 2026-08-25 the strategy tab, the door, and one solid button → §94
- 2026-08-24 who a row is → §87
- 2026-08-24 the register, the deck, and the door → §69
- 2026-08-23 a unit and a function are the same product → §53
- 2026-08-23 the BU list, and the register as a file → §54
- 2026-08-23 the client's mark, on the door and on the deck → §52
- 2026-08-23 the client's own mark on the door → §52
- 2026-08-23 the capability half catches up, and slides get a place → §51
- 2026-08-23 a column the data always had, and pictures in the review → §50
- 2026-08-23 the due diligence, and the four it could not fix without asking → §48
- 2026-08-22 v3.17 → §47
- 2026-08-22 v3.16 → §46
- 2026-08-22 v3.15 → §45
- 2026-08-22 v3.14 → §44
- 2026-08-21 v3.13 → §41.10
- 2026-08-21 v3.12, merged → §41.8
- 2026-08-21 116 figures across ten units → §16.7
- 2026-08-21 `PALETTES[0]` was `slate` and the bare `:root` held slate's values → §41.6
- 2026-08-21 The team is stored, not read off the person → §16.7
- 2026-08-21 is reversed → §43
- 2026-08-21 Everything built decided what a screen offered; nothing decided what the server… → §42
- 2026-08-21 A tenant's branding will supply a palette, never a language → §38
- 2026-08-21 525 controls on one screen → §37
- 2026-08-21 A disagreement is not possible when only one copy exists → §35
- 2026-08-21 not in its form — it is in the split → §34
- 2026-08-20 The role is the thing; a job title never decides access → §33
- 2026-08-20 three → §32
- 2026-08-20 for the SMO only → §31
- 2026-08-20 A handler that rewrites the dom must not run in the middle of an… → v3.5 full:22910
- 2026-08-20 Whoever rewrites the dom re-wires it, in the same function → v3.4 full:22926
- 2026-08-20 mechanism → v3.3 full:22943
- 2026-08-20 A layout verified at the widths that pass is not verified → v3.2 full:22966
- 2026-08-20 The service worker never caches `/api/*` → v3.1 full:22983
- 2026-08-20 a colour written into a rule as a literal is a light-mode… → v3.0 full:22994
- 2026-08-20 Manage → v2.9 full:23008
- 2026-08-20 A sticky offset changes nobody's height; a max-height does. Never… → v2.8 full:23016
- 2026-08-20 When a control "does not work", check what the click actually hits → v2.7 full:23023
- 2026-08-20 the horizon is the tenant's to set, not a baked default ; Distribution and… → §23.5
- 2026-08-20 the company level ported from Islam's own build , plus the two defects a real… → §23
- 2026-08-20 the SMP icon — `favicon.svg` / `favicon.png` at the repo root, and… → v2.4 full:23035
- 2026-08-20 the plan template loses its codes; upload authors and archives → §22
- 2026-08-20 the clean slate and the Demo button ; the seed-then-migrate order and the "no… → §21
- 2026-08-20 (SMP identified as the Strategy Management Platform: project folder… → full:23046

