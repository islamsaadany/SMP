# Claude Code Instructions for SMP

> This file is automatically read by Claude Code at the start of each session.
> It contains project-specific instructions, guidelines, and configuration.
> Adapted 2026-08-20 from the HR_ERP rules file: the working rules carry over
> verbatim; the HR_ERP project context was removed and replaced with SMP's.

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
- **BUMP `SHELL` IN `sw.js` ON EVERY MERGE THAT CHANGES THE BUILT FILE (§91).**
  Not on a version bump — on a CONTENT change. It sat at `v3.22` through §80 to
  §90 because the built file kept the same filename the whole time, and the
  service worker caches by URL: every returning browser would have been served
  the old platform out of its own disk whatever production served. The trigger
  is "the built file's bytes changed", which is every merge.
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
`/opt/pw-browsers/chromium`). Edit the sources, never the built file.

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
- **THE GROUP HAS A MARK, AND THE DECK HAS SEPARATORS (§259):** Islam, in one
  message — *"where can I upload the raya trade mark so it can be used? then
  work on separators let's make teh serparators blue background like the client
  brand colors"* — then four sections by number. **`--panel` IS THE BLUE AND IT
  IS NOT A COLOUR OF THE DECK'S OWN**: it is the token Setup › Branding's
  *Navigation bar* control sets, so a divider wears whatever blue the tenant
  picked and moves the day they move it (§41.10 on a projector); no new token,
  no literal (§25), and **the check proves it by REBRANDING the tenant mid-run
  and asserting the dividers followed** — an assertion naming `#16325C` passes
  on exactly the build that rules out (§94.8). The three inks already existed
  (§38.5): `--panel-ink` · `--panel-quiet` · `--panel-accent`, 12.77 / 7.24 /
  7.66:1 light and 16.63 / 7.73 / 11.42 dark. **THE FOUR SWOT HUES COULD NOT
  SURVIVE THE MOVE, MEASURED NOT PREFERRED** — 2.55 / 2.26 / 3.49, and
  *Opportunities* was drawn in `--panel` itself, **1.00:1 against its own
  ground**; one rule across the row instead (§254.5's own answer for the pillar
  cards), **the four category slides keeping their hues** and `.seccell.t-*`
  DELETED with the classes it styled (§24), asserted at both ends. **NO FOOTER
  MARK ON A DIVIDER** (his word), which removes a fault as well as a
  decoration: the white plate that makes a navy lockup readable is switched on
  by the PAGE being dark (§52), which a blue divider on a light page is not.
  **A DIVIDER IS ONLY DRAWN IF ITS SECTION IS** (§253) — a unit 28 → 31 slides
  with four, a pillars function two, **a capability function byte-for-byte what
  it was**. **The roll-call stays WHITE and the Overall performance divider
  carries NO NUMBERS**, both Islam's from two treatments drawn in the real deck,
  the first reversing my recommendation with its cost named (one extra slide per
  deck) and the second agreeing with it (§87's twins, in figures).
  **§259.2 — THE GROUP'S MARK**: §52.9 gave every UNIT one and stopped, so a
  supporting function showed nothing at all and the group had nowhere to go.
  One upload on **Setup › Branding**, FIRST on the page (the three colour
  sections under it are one argument read in order), through the **same
  `logoIntake()`** as a unit's or there would be two answers to *what may be
  uploaded* (§53.5). **`deckMark(u)`** is the one reader — the subject's own,
  the group's otherwise. **No migration** (`org.extra`), reads without writing,
  Remove DELETES the key (§50.6). **Classified `setup` and NAMED** so a refusal
  says Branding (§16.7) — **and the two edits go together**: with only the
  `add()` line removed and `"logo"` still in `gExtra` the field is neither
  classified nor swept and **a unit head may set the group's mark**, 3 of 489
  red. **The demo seed carries NO group mark, deliberately** (§54's rule: a
  client must never inherit Raya's); the PNG is rendered from the vector the
  repo already holds and handed over to upload. **And the knowledge base had
  been wrong since the page was written** — it promised Branding set "the
  colours and the logo" and that page set colours only (§104.8's family); it
  became true today. `checks/deck-dividers.py`: **22 red** before, and **its
  first two runs against that build DIED rather than reporting** (§215, twice
  in one file) — an empty list index, then a 30s timeout on a control that does
  not exist there. **Two of its own first failures were the CHECK** (a rebrand
  through a function name the platform does not have; a data URI sliced one
  character long), and one assertion was **unfalsifiable as written** — the
  seed has no mark, so deleting it from the incoming graph is a no-op that
  passes on every build (§94.5, its own example).
  **AND THE SEED WAS STALE ON `main`**: §253.2 cut Retail's `by:"merchandising"`
  in the sources and `db/seed-state.json` was never regenerated — *a seed that
  disagrees with the sources it is generated from is a fault nothing else would
  have found.*
- **THE PLAN DOWNLOAD IS AN ENTRY IN THE PRESENTATION MENU, AND THE OFFICE'S
  (§252.2, reversing §117's audience):** Islam — *"the ppt download leave it as
  an option in the drop down for the smo only."* §145.9 hid the pane-corner
  button for everyone and kept the machinery; this is that machinery given back
  **somewhere else** — beside *Present* and *Manage slides*, because that menu
  is where the decks already are and the pane corner already holds the pen, the
  arrows and §145's fill button. **THE CORNER BUTTON IS DELETED, NOT LEFT
  HIDDEN** (§24, §94.15) — `dlPlanBtn()`, `DL_PAGES` and `editBar()`'s `dl`
  term go with it, and **the first deletion sliced a RANGE** and left that
  function's comment stranded above `arrangePaneBtn()` (§214's own lesson,
  again). **THE NARROWING IS IN THE RULE, NEVER IN THE MENU** (§42, §48.2): the
  entry is drawn from `mayDownloadPlan()` and `sendPlanPptx()` asks it again at
  press time. **`ARRANGE_ROLES` IS UNTOUCHED** — reordering is still the
  custodian's and the owner's (§101); the two questions merely stopped sharing
  an answer. §119.9's two-buttons-per-tab problem disappears with the move.
  **Three assertions REVERSED and REWRITTEN, never deleted** (§218): *the
  custodian may* → *may NOT*, with the office's yes beside each and `mayArrange`
  asserted in the same breath. 474/0; and one of the check's own first failures
  was the CHECK — a function's Performance tab is keyed `fnperf`.

- **A REPORTED NOTE IS NAMED AS ONE (§255):** Islam — *"the perofmrance is
  showing hte notes under the tactic name. what is this issue?"*, then the
  correction that set the scope: *"notes is not in the desciption, notes is
  something relevant to the reporting and appears in performance as a separate
  element. so it needs to be there so we can't drop."* **NEITHER PLACEMENT WAS
  A MISTAKE** — §239.2 put the reporter's note under the name and §248 later put
  the plan's DESCRIPTION in the same cell; both right on their own, and both
  drawn as `.why` (12px, `--ink-3`), so a permanent statement and a this-cycle
  statement render identically with nothing saying which is which. §248's own
  comment saw the risk (*"two greys at one weight run together as a single
  block"*) and answered it **only for the NAME**, by bolding it. **THE COST
  DECIDED IT AND WAS MEASURED BEFORE HE CHOSE** (`design-mockups/
  tactic-note-placement/`, drawn out of the running platform with his own two
  tactics, §41.9/§245): a Note column of its own — what the deck has always had
  — takes the Tactic column **790 → 209px at 1920** and starts running past the
  pane at **1280px**, an ordinary laptop, where it fits today (§158: *fit, never
  "and it scrolls"*); naming it in place costs **no width at any width the table
  fits today**. **A RULE, NOT A SECOND SIZE OR COLOUR**: smaller or paler would
  rank the note UNDER the description and it is the newer of the two, so it
  keeps `.why`'s size and ink and is set apart sideways — 2px in `--line` (never
  the accent, §41's budget) and one uppercase key. **ONE BUILDER, BOTH TABLES ON
  THE PAGE** (§53.5): the tactics table he reported AND the key measures table
  above it, which stacks the same two greys the moment a row has a horizon as
  well as a note — nought in the demo, so latent rather than absent. **AND THE
  MOCKUP'S `.85` OPACITY WAS DROPPED IN THE BUILD** — about 4.2:1 at 10px, §38.5
  walked into while quoting it; without it **4.95 light / 5.53 dark**, measured
  with the sweep's own arithmetic (§95). **THE DEMO CANNOT SHOW THIS FAULT** (0
  of 84 tactics carry a note), so the check MAKES the state, including a row
  reporting nothing (§61). Proved able to fail: **16 red** — and **two of that
  count were the CHECK**, both found by falsifying rather than reading:
  `all([])` is true, so three assertions went green over an empty list
  (§113.8), and it **died rather than reported** on an empty list index (§215),
  printing four failures where there are sixteen. **RECORDED, NOT DONE, AND A
  DECISION**: four other surfaces draw a note as a plain grey and none stacks a
  second one, so none has the collision — and `capKOTable` already carries a
  column headed *Reported*, where a key under the name would say the word twice
  (§87's twins).
- **A FIGURE IS READ AGAINST WHAT IT IS MEASURED BY (§254):** eight things
  Islam sent from the live deck in one afternoon, all mocked up first
  (`design-mockups/deck-review-round/`). **THE BENCHMARK, AND THE COLUMN THAT
  NAMES IT** — his row read `6#` against `4#` at 133% with nothing saying why;
  §239 has prorated a `Sum` measure since it was written and the deck never
  printed what is due so far, so **nothing new is computed** and the shape is
  §252's own (figure bold, benchmark behind a slash), through **one builder
  `figVsDue()`** the three tables ask. *Annual target* is Performance's word
  (§239.2) — the **aim slide keeps *This year***, where it contrasts with the
  3-year column and is doing different work.
  **§254.1 — A SCALED CURRENCY IS ONE TOKEN WHEREVER IT IS DRAWN**: the
  convention existed and was only ever applied ON THE WAY IN, so a value that
  ARRIVED with a space was never tightened (§96.2 forbids rewriting what
  somebody wrote). **That rule is about what is STORED and it stands** —
  `unitTight()` is display only, asserted by building every deck and comparing
  every stored figure byte for byte. **The test is a magnitude letter, not a
  list** (`K`/`M`/`B` + exactly one word), so `K EGP` reads right the day a
  tenant types it though the picker does not offer it, while `M EGP B EGP` —
  typing, not a unit — keeps its space. **The first draft closed the wrong gap**
  and produced `8MEGP`: *tight* is a fact about the SEPARATOR, never about the
  unit, and the check caught it. The **doubling is healed on reporting and
  save** (his choice): the box is filled from the healed value AND `joinTarget`
  is handed the healed string to take its separator from, which is what makes
  *heal on save* true rather than *heal on screen* — with the cost stated, that
  a row nobody re-enters keeps its doubled string in the database and the
  workbook.
  **§254.2 — ONE QUESTION DECIDES THE WHOLE ROW, narrowing §248**: `2% / 2#`
  reproduced, and **nine states through the scorer all score with a figure in
  the outcome** — so the figure the deck could see was not in the outcome, and
  one path produces it exactly: the reporting box asks for the OUTCOME's figure
  only once the outcome has a target, so **a figure reported before that target
  was added sits in `actual` for ever** while the benchmark switches. §248
  switched on target AND figure deliberately; **the target alone decides now, at
  Islam's direction**, chosen from three behaviours with the cost of each — such
  a row leaves every average, stops counting as reported and refuses Submit,
  and it is the only one of the three that never states a figure nobody reported
  (§35). **0 of 78 demo tactics are in that state**, so nothing in the worked
  example moves and the check MAKES it.
  **§254.3** a not-due tactic is not dimmed (the cell says it in words).
  **§254.4** the deck ends on its numbers — the score table then the three
  readings, both built where they were, **anchors travelling with them**
  (§236.3). **§254.5** the pillars are NAMED before they are scored: his
  concept, the platform's treatment (one gold rule across the row, not a hue
  per card — §41's budget), **the CODE as the number**, and **the two pillar
  slides cannot share a name** — the score table takes the deck's own existing
  *"— where we stand"* rather than a new form of words (§87's twins on a
  projector, and two identical rows in Manage slides' rail).
  `checks/deck-figures.py`: **33 red** on the build before. **AND THREE CHECKS
  HELD SOMETHING THESE DECISIONS MOVED** (§214.3) — `deck-blank-slides.py`,
  written ONE SECTION EARLIER, searched for *"where we stand"* and went red on a
  correct build; `tactic-proration.py` asserted the demo HELD a carried pillar,
  true until §253.2 cut it, **rewritten to MAKE one** (§218); and
  `submit-gate.py` filled `actual` to model a complete report while its own
  §249 block gave eighteen tactics a target with no figure — reading *23 of 41*
  on a build behaving exactly as decided. **RECORDED, NOT DONE**: `K EGP` on the
  picker's list, the missing deck marks (a function can never have one, and
  there is no group mark to fall back on), and whether the notes slide keeps the
  last word.
- **A TABLE WITH NO ROWS IS NOT A SLIDE (§253):** Islam — *"slides are
  showing blank pages for the merchandizing."* Measured before anything was
  proposed: **four** slides in the whole product draw a heading, a navy column
  strip and then a whole empty page, and **all four are Merchandising** — its
  own deck's two objectives slides (a supporting function judged by its pillars
  legitimately carries none, §214.2, and the deck never learned it) and
  Retail's **RS04**, the pillar carried by that function, which printed
  **93% / 60% / 61%** across the top of a slide with nothing at all behind those
  numbers. **THE PRODUCT ALREADY KNEW THE ANSWER AND APPLIED IT TO ONE HALF**:
  `deckSlidesFn` has guarded its objectives slide since it was written, which is
  why **Marketing** — whose two capabilities also carry no objectives — has
  always been right; the unit deck, which a pillars function goes through since
  §224, had no such guard (§53.5). **ISLAM RULED IT FOR ANY SUBJECT**, reversing
  the narrower rule recommended to him (a unit AUTHORS objectives, so §243's
  SWOT test would have kept its empty slides) — recorded as his, with the cost
  named: a unit that has left its objectives blank is no longer told so from the
  projector, and still is on every screen that counts gaps. **IT DROPS THE
  TABLE, AND THE SLIDE ONLY WHERE THAT LEAVES NOTHING** — the aim slide carries
  a unit's aspiration ABOVE its table and that is not a table with no rows, so
  a unit keeps the slide and a function (whose half §243 already removed) loses
  it. **An anchor goes with its slide**, which is §50.3's existing behaviour: a
  picture placed after it lands at the END rather than being dropped.
  **§253.1 — THE READING NOBODY TOOK IS NOT DRAWN AT ALL**: the headline slide's
  objectives cell read a grey dash under *"no earlier cycle to compare"*, which
  is a control that failed to render rather than an absence (§45.2, §15.1). It
  goes for any subject with none, **at no CSS cost** — `.headgrid` without
  `.three` is the shape that slide wore before §243 added the third number.
  Settled from a mockup made of the REAL deck (§41.9), **and the mockup earned
  its place**: shooting it exposed that the footnote still opened *"Objectives
  measure what was committed to"*, explaining a number that would no longer be
  there. **§253.2 — THE POINTER IS CUT**: *"drop the merchandizing connection
  with the retail stores."* `by:"merchandising"` leaves Retail's fourth pillar;
  **the FEATURE is untouched** (`pillarCarrier`/`viaCarrier` still answer), and
  the cost is stated rather than discovered — the demo no longer SHOWS a carried
  pillar anywhere, so spec 010 is described and not visible. **Measured across
  every unit**: Retail execution 102→104 and planned 57→56, RS04's three figures
  93/60/61 → three dashes, **and nothing else in the tenant moves** — Retail's
  objectives (105) and pillar performance (94) included. `checks/deck-blank-slides.py`:
  **11 red** on the build before, its first failure printing the four blank
  slides by name. **AND ONE OF ITS OWN ASSERTIONS PASSED ON THE BROKEN BUILD**
  (§94.5) — it searched the first six headings and a pillar's tables sit at
  index 11, so it was true of the fault it existed to catch; it names the
  stripped pillar by its CODE now, because the other pillars legitimately keep
  their tables. **RECORDED, NOT DONE**: a pillars function's deck now opens
  cover → *Where X stands* → *Pillars* with no aim slide at all, which is correct
  and is the first deck in the product without one — whether it should open on
  something of its own is a decision about what a review says, and has not been
  put to Islam.
  **§253.3 — ONE ANSWER TO WHICH DECK A TARGET GETS**: Islam, on the live
  deployment — *"the manage presentation show this"*, the Manage slides editor
  open on `fn:merchandizing` with its bar drawn and the rail and stage
  **completely empty**. **§224 IS THE SAME FAULT AND IT WAS FIXED ON ONE
  SURFACE OF THREE**: that section made the Present button branch on the
  function's FORMAT rather than the `fn:` prefix, and `slidesAssemble()` and
  `deckAnchors()` were both still asking by prefix — so the editor assembled
  **2** slides (*"Capability review · 0 capabilities"* + Thank you) where the
  Present button opens **13**, and a picture could be placed in one of two
  positions in a deck that has thirteen. **`deckHtmlFor(target)` is the one
  reader** and all three surfaces ask it; `openDeckFn()` on a pillars function
  goes **2 → 13**, and the CAPABILITY deck is asserted unchanged in the same
  breath (Marketing 15 before and after) or a build routing everything through
  the unit deck would pass every assertion about the function.
  **AND THE FAILURE HAD NO VOICE**: `slidesAssemble()` had a `try/finally` and
  **no catch**, and `slidesPaint()` opened `if (!all.length) return;` — so a
  throw, or an empty deck, left the bar over a blank rail with nothing said
  (§32, §171, on the one surface that had neither). Both speak now.
  **WHAT IS NOT CLAIMED**: the demo's pre-fix editor draws TWO slides and
  Islam's screenshot shows NONE, so the prefix branch is certainly a defect and
  certainly makes that editor useless for a pillars function, and whether it is
  exactly what emptied HIS rail cannot be proved from here — which is why the
  failure was given a voice in the same change (§171: a diagnostic is not a
  fix, and which it is has to be said).
- **A TITLE IS ONE LINE, AND THE BOX WAS THE ONLY PLACE THAT SAID OTHERWISE
  (§255):** Islam, with a screenshot of a client's plan and the pen open — a
  tactic's name box **643px tall holding one sentence**. **NOTHING WAS WRONG
  WITH THE BOX**: §189 sizes a growing box to what is IN it, and what was in it
  was **blank lines** — thirty of them reproduce his screenshot to the pixel
  (643px box, 962px row). **INVISIBLE EVERYWHERE ELSE**, which is why it reads
  as a sudden layout fault: the same row is **42px** in reading mode because
  HTML collapses a break, and the deck and both workbooks print these on one
  line — so a value carries them for weeks and only the pen shows it. **TWO
  ROUTES, BOTH MEASURED**: Enter added one per press until §229 stopped it
  (*"nothing stored is scrubbed"* — this is that bill), and a **paste**, which
  §229 does not reach and which stored `"Line one\nLine two\n\n\n"` verbatim.
  **THE RULE IS ABOUT THE VALUE, SO IT IS `SMPRules.oneLine()`** (§42): a run of
  whitespace containing a break becomes ONE SPACE, ends trimmed, **every word
  kept** and ordinary spacing untouched (§96.2). **`.grow` IS THE DECISION** —
  §229 drew that line for Enter and this uses the same one, so a rows-2
  paragraph box (an aspiration, a definition, a note) is untouched and there is
  no second list to forget (§104.7). **THREE TOUCHES, THREE REASONS**:
  `textOr()` DRAWS one line whatever is stored (which closes it for good — it
  does not care how the breaks got there) and stores nothing; the **commit**
  stores one line at the one `data-fld` door, **written back into the box**
  because seeing the lines close up is the explanation (§124); and a **one-off
  heal** (`041-a-title-is-one-line.js`) of what a tenant already holds, or the
  workbook, the archive and every export go on carrying them. **IT COULD NOT BE
  A `.sql` FILE** (§43.1's reason, different shape): a pillars function's plan
  is one JSON blob (§118) and a tactic's description and outcome ride in
  `extra` (§248), so the fields sit at four depths in three shapes — and a
  blanket replace over the blob would flatten the paragraphs. **THE WALK IS
  STRUCTURAL, never "any key called `name`"** (the graph is full of names that
  are not plan prose), and a unit and a pillars function go through ONE walk
  (§59, A15). **ARCHIVES ARE DELIBERATELY NOT TOUCHED** (§22, §49.2: a record
  somebody tidied is no longer the record). Proved able to fail both ways —
  heal stubbed **14 red**, heal made over-eager **3 red and all three are the
  paragraphs**, which is the worse failure and the one a one-sided check would
  have applauded — and `checks/one-line-titles.py` is **5 red** on the shipped
  build, asserting AGREEMENT with a break-free clone of each box rather than a
  pixel count (§94.8). **RECORDED, NOT DONE**: an alt-enter INSIDE a workbook
  cell still arrives (the reader trims the ends, so the thirty trailing lines
  cannot), draws as one line and is cleaned on the next commit; cleaning it at
  the upload door would name the prose fields a third time in a reader that
  must not flatten a SWOT item.
- **THE PRESENTATION READS WHAT WAS REPORTED (§252):** Islam — *"presentations
  doesn't change when the plan performance is done"*, and then *"the
  presentation should update on either save draft or submit."* **THE PROPOSED
  FIX WOULD HAVE CHANGED NOTHING** — `openDeck()` calls `deckSlides()` on the
  press, so a deck is assembled fresh every time it opens and there is no
  stored copy to go stale (§51.8); a refresh wired to Save draft would have
  shipped and left the dash exactly where it was. *A reported symptom names
  where somebody was standing, not what they were standing on.* **THE FAULT IS
  FIVE READERS LOOKING IN THE OLD BOX**: §248 puts a tactic's outcome figure in
  `outActual`, and measured on Mobile the slide read **`— / 50%`** and **`—`**
  where Performance read **`4# / 3 #`** and **`133%`**, under a heading on that
  same slide already saying **`Delivered 98%`**; `reportedCount` went **41 of 41
  → 40 of 41**, so **Submit refused a finished report** with *"1 figure still to
  enter"*; `rowReads` returned null, so the note rule never saw an outcome at
  all; and the row wore `.notdue` while its own last two cells printed the
  figure. **THE EXPRESSION EXISTED AND WAS WRITTEN OUT ONCE** — inline in the
  Performance pane — so it is **`tacticProgress()`** now, with **`rowAnswered()`**
  beside it answering *has this row been answered* for every kind of row (§53.5);
  the ternary it replaces in `reportedCount` had **the same expression in both
  branches**, a tactic case written and never filled in. **THE SLIDE'S SHAPE IS
  ISLAM'S**, picked from three shot out of the REAL deck (§41.9,
  `design-mockups/tactic-outcome-slide/`): the **outcome takes a column of its
  own**, as on Performance, because a projector must not say something different
  from the page behind it — B (under the name) refused because §248 deliberately
  moved it out from there, C (dropping Collabs.) because it looks free only on a
  demo where nobody is named. **THE COST WAS MEASURED BEFORE HE CHOSE**: Mobile's
  deck 24 → 27 slides with 12 of 22 tactics carrying an outcome, every extra one
  a continuation the deck already makes. **Two headings take Performance's
  words** (*YTD actual* · *Progress*, §239.2), **a row owed a figure says "Not
  reported · due at …"** rather than printing the em-dash that means *nothing to
  report* (§35), and **a tactic with no outcome is byte-for-byte what it was**,
  asserted both ways. **Proved able to fail: 19 red** on the shipped file — and
  the check's own first run **died rather than reported** (§215), so it asks for
  the two shared readers by name before using them. **RECORDED, NOT DONE**: the
  `.pptx` plan download has no outcome column (its own mockup), and a deck
  already open on a projector still does not redraw mid-presentation, put to
  Islam and deliberately left.
- **A SLIDE THE OFFICE DOES NOT PRESENT (§256):** Islam — *"allow the smo to
  hide presentation slides of any unit or function."* §246 named this and left
  it, with the question inside it: *which slides may be hidden, and whether
  hiding one hides what it counts.* **IT CHANGES NO NUMBER, AND THAT IS THE
  ANSWER** — §233 hides a ROW and takes it out of every score; this hides a
  generated SLIDE and takes it out of **nothing** (still reported, still asked
  for, still scored, still on the page). Two switches, two jobs: one that did
  both would mean tidying a deck before a board meeting silently moved a unit's
  figures. Asserted FIRST, off the platform's own functions, byte-identical
  either side of the press. **IT LASTS** (so not in `REVIEW`, which the cycle
  clears — §50), the cost stated before he chose and guarded by the rail always
  saying **"N slides hidden"** with one press back. **THE OFFICE'S ALONE**, and
  a custodian SEES the marks and the count and gets no eye — seeing a state is
  not setting it, asserted at both ends (§94.2). **NAMED BY ITS ANCHOR, NEVER
  BY ITS POSITION** (§48, §236.3): every generated slide has carried one since
  the picture placer needed somewhere to land, so the nameable slides ARE the
  deck; it rides `units[k].extra`/`functions[k].extra` (§52, §213) so **no
  migration**, is stored as an ABSENCE (§50.6) and is **sorted**, or two
  spellings of one fact report a change that is not one. **THE ORDER OF THE
  PASS IS ITS CORRECTNESS** — after the pictures (a picture anchored to a
  hidden slide is still evidence) and before the fit pass (a continuation
  carries its parent's anchor, so removing the parent first takes a long table
  whole). **THE EDITOR MARKS WHAT THE PROJECTOR REMOVES**, or a hidden slide
  could never be brought back (§61). **A DECK CANNOT BE EMPTIED**, refused on
  the PRESS rather than in the pass (§53.5) and `aria-disabled`, never
  `disabled` (§163, §221). **Quiet, never amber** (§187). The server's
  `deckHide` is its own kind so the refusal names Manage slides and not Setup
  (§16.7), reads its field name from `lib/rules.js` (§234), and is deliberately
  **not** gated on the cycle lock — pruning the deck the morning of the meeting
  is when this is used. Drawn in the real page first (rule 1c, §41.9): Islam
  picked the dimmed treatment; **struck-through lost because a slide's name
  wraps and the rule runs through the gap**, and the camera found that
  **`.sl-lab` is `-webkit-line-clamp:2`**, which ATE the first draft's tag on
  exactly the rows whose names are longest. Proved able to fail: **33 red** on
  the build before, five falsifications on the server.
  **§256.1 — AND THE FIRST RUN DIED RATHER THAN REPORTING** (§215, §252 one
  section earlier): with no `hiddenSlides` and no `deckHidePass` the first probe
  threw and `grep -c FAIL` read ZERO, on precisely the build the file exists to
  see. Every probe degrades now.
  **§256.2 — TWO SESSIONS FOUND THE SAME FAULT ON THE SAME DAY, AND GIT MERGED
  BOTH FIXES SILENTLY.** Building this found that a pillars function's Manage
  slides assembled a deck nobody would project (measured: **editor 2 slides,
  projector 15**) because `slidesAssemble()` asked `kind === "fn"` while Present
  asked the FORMAT — §69.5's fault, one branch two files apart. **§253.3 had
  already fixed it from Islam's own report of that screen**, and better: it also
  routes `deckAnchors()`. That one stands. **The removal was not optional** —
  both sessions wrote a function named `deckHtmlFor` in the same file four
  hundred lines apart, and **git merged them with NO CONFLICT**: two
  declarations of one name, the later winning by hoisting, so the product would
  have run this branch's copy while main's sat dead under comments still
  describing it as live (§146.2, §56.7). `node --check` passes on that file.
  **After any merge touching a file both sides changed, grep the result for its
  own declarations** — §147.4's precedent, same conclusion: ride main's model
  whole rather than carry a second one. **§256.3 — A CORRECTION TO THE RECORD:**
  this branch had named `deckAnchors()` as callerless dead code, true of the
  build it was written against and **no longer true** — §253.3 gave it a caller
  in the same hours.

- **A TARGET THAT IS A YES OR A NO (§257):** Islam — *"for the target we need
  to add a Y/N in the units which dims the target itself."* **IT IS A UNIT, NOT
  A SECOND FIELD**, and that is why it costs no migration: §199 put the unit ON
  the target string, so `Y/N` is the unit whose value part is always empty and
  `target`/`target3y`/`outTarget` go on holding the whole string. **A COMPLETE
  ANSWER, NEVER A GAP** — one line before §249's numeric test, or every yes/no
  row wears the red word for ever and refuses Submit (§221) with nothing to
  fill. **100 or 0, and silence is NOT SCORED** (§35: absent is not zero), both
  his calls, taken before anything was built, across all three places the picker
  appears. The direction and the compile rule are dimmed with the target —
  **drawn and `disabled`, never merely dimmed** (§220), all four boxes kept
  because a hole among equal boxes reads as a control that failed to render
  (§248) — while **the unit picker stays live, being the only way back out**
  (§61). **THE LIST NARROWS ON A BLANK ROW** to blank and `Y/N`, because a
  brand-new "did it happen" row has no number to type and the em-dash made the
  one unit needing none the one unit unreachable. **§257.2, HIS CORRECTION AND THE
  BETTER MODEL**: the first build made a row yes/no by DESTROYING its number,
  caught on a row reading `100 · Y/N · ≥ · Latest` with nothing dimmed — *"even
  they are set before they need to be dimmed even by keeping the values but as
  if they are not counted anymore."* The outcome's picker KEEPS the figure (so
  `outTarget` was `100 Y/N`) while the dimming test asked whether the WHOLE
  STRING was `Y/N`, so the tables disagreed with the outcome beside them
  (§53.5 inside one feature); and destroying a figure is unlike every other
  unit and makes changing your mind cost what somebody typed. `Y/N` is written
  BESIDE the value now, `isYesNo` reads the unit off the end through
  `targetParts` (`outUnitOf`'s §248 rule), the dimmed boxes SHOW what they
  keep, and `100 B EGP` → `100 Y/N` → `100 B EGP` round trips. **The corrected
  check then found two more**: leaving Y/N blanked the value instead of handing
  it back, and `measureDue` parsed the kept 100 out of `100 Y/N` and printed
  *"due at 100 Y/N"* beside a Yes/No control. **6 red** on the build he was
  looking at; six assertions REWRITTEN, not deleted (§218). **§257.2a, found by
  driving it**: a bound field writes WITHOUT repainting (§71.2 — right for
  typing, wrong for a control that changes the row's SHAPE), so picking Y/N
  changed the plan and nothing visibly happened; safe to repaint only because
  these are SINGLE selects (§30.1, and §130.1 for why a ticking list is not).
  **§257.3**: leaving Y/N writes a bare unit `splitTarget` cannot read back, so
  `targetUnitOf` learned `outUnitOf`'s §248 rule — **narrowed to units the
  picker offers**, or a target reading `TBD` becomes a unit nobody chose
  (§96.2). The workbook carries it or a round trip drops every yes/no target
  (§22). **18 red** on the shipped build; one check held a rule this reverses
  and was REWRITTEN, not deleted (§218, §214.3).
- **THE PLAN'S TITLES COULD NOT WRAP AT ALL (§189):** Islam — *"wrap the
  content of the plans edit boxes across pillars and functions, specially for
  the titles and descriptions."* Not a bad wrap: every title and description
  was `inputOr()`, and an `<input>` is ONE LINE by definition, so a long title
  ran off the end and you scrolled sideways inside it. Measured with the pen
  open: 4 of 23 clipped at 1440, 8 at 1100 on a unit's Plan; two Descriptions
  clipped on a function's Projects in the demo's OWN data. **`textOr()` is its
  own builder, never a flag on `inputOr`** — which fields are prose is a
  decision per call site (an owner is picked, a target is one value), and
  guessing by class is how a target becomes a paragraph box. **A GROWING box,
  not a taller one**: `fieldOr()`'s two rows is too many for a short title and
  too few for a long one; `growFields()` runs at the end of `paint()` beside
  `SEARCHSEL.wire()`, for that function's own reason. **Enter still blurs** —
  a plan row's name is one line of prose however long, and blur is what
  commits (§35). **The short fields are untouched and it is asserted.**
  **AND IT BROKE §114.4**: `display:block` took the whole cell and pushed the
  remove × onto a second line — `inline-block` restores it, and it was found
  by `checks/plan-fields.py` GOING RED, not by reading the cascade, which is
  the argument for that check existing.
- **THE OFFICE STARTS A CONVERSATION (§247):** Islam — *"from the platform
  inbox allow the smo to initiate a message with someone."* Until now the office
  could only ever ANSWER: with nobody having written in there was no way to
  reach them from the Inbox at all. **IT IS A FLAG ON THE REPLY, NOT AN ACTION
  OF ITS OWN** — leaving the waiting list by the act (§71), the email chase
  (§97.5) and the box on their screen (§231) are all written once in the reply
  path, and a second endpoint would be a second copy of every one of them
  (§53.5); what starting adds is that the conversation may not exist yet.
  **AND THE PERSON MUST BE ONE**: `ensureThread` mints a row for any string, so
  a typo would leave a conversation with nobody in the queue for ever —
  checked against the STORED, ACTIVE register (§74.2), a retired person refused
  because they cannot sign in to read it. **ONE CONVERSATION PER PERSON
  SURVIVES** (§97): starting one with somebody who has written in carries on
  into their thread, and `person_key` being the primary key is what makes a
  second impossible. **THE CONTROL IS IN THE COLUMN IT ACTS ON** (Islam's A,
  from two placements drawn in the real page, §41.9) — the search gives up ~60px
  and it is asserted that it keeps its line. **IT IS THE THREAD PANE, NOT A
  DIALOG**, so opening a conversation leaves the form and so does Cancel.
  **SAID, NOT DISABLED** (§221): Send names which half is missing. **A SEND
  LANDS ON THE RECORD** (§144). **AND THE FIRST PROBE'S FAILURE WAS THE PROBE**
  — it compared the two controls' `top` values, and one row is not one top
  (§122.4).
- **THE PLATFORM REGISTERS ITS OWN WORKER, AND A HANG IS NOT A SILENCE
  (§231.5):** Islam, testing on a second account — *"the notifications are not
  working despite I accepted it."* One console line settled it: his main account
  answered REGISTERED, the test account's promise **never settled at all**.
  **`sw.js` IS REGISTERED FROM THE GATE ONLY (§26)** — true and sufficient while
  the worker merely cached the shell, and not for a moment longer than that: a
  browser that never completed a gate load (fresh profile, private window, a
  session opening the platform directly, §32) has no registration, and
  `navigator.serviceWorker.ready` there **never resolves**. Measured: 0
  registrations, pending after 3s, bell reading ON throughout. **A HANG IS NOT A
  FAILURE, WHICH IS WHY IT WAS SILENT** — it does not reject, so no catch runs
  (§171 one layer down). The platform registers it ITSELF (harmless twice), the
  wait is RACED AGAINST A CLOCK, and the bell gains a fifth state —
  allowed-but-not-registered — which says what happened and offers to try again
  rather than switching off what never came on (§61, §226.2's shape). **AND THE
  FIX'S FIRST BUILD REPEATED THE FAULT**: `subscribe()`'s own `.catch` set a
  flag and said nothing, so the bell went on promising a box with the subscribe
  genuinely failing (§124 inside its own fix, found by driving it). **TWO OF THE
  CHECK'S FAILURES WERE THE CHECK** (§100.3, twice in one run): the stub never
  served `sw.js`, so `register()` rejected on a content type; and the stand-in
  supplied `ready` but not `getRegistration` — *a stand-in that models less than
  the thing it stands in for reports a working build as broken.*
- **IS IT WORKING? (§231.6):** §123's argument for the other silent feature —
  *"it is not working" sends somebody to look at everything, naming the step
  sends them to one page.* Notifications have FOUR links and **every one fails
  invisibly by design** (a device that never registered, a key never minted, a
  library that did not load — §231.3 made that quiet on purpose — a push service
  that refused). **Test on this device** walks the chain in the panel that
  already holds *Test the assistant*, drawn by that button's own renderer
  (§53.5), only while the switch is on (§61). **A REAL SEND**, because an
  inspected chain is one nobody walked — to the asker's own devices and nobody
  else's. **Stores nothing** (§35) and **reads without repairing**, asserted.
  **It re-registers this device before asking**, or a browser that allowed
  notifications and never registered is told *none of your devices is
  registered* without the platform having tried.
- **A FAILED ASK IS NOT AN ANSWER, AND THE INBOX SAID IT WAS (§231.4):** Islam,
  on the Platform Inbox with §231.3's endpoint down — *"all conversations are
  gone!! what happened?"* **NOTHING HAD.** `boxLoadQueue` opened
  `if (err || !j) return;`, so `box.threads` stayed empty as initialised and the
  page printed **"No conversations yet"** — a statement about somebody's DATA
  made when nothing was ever read, with **0 · 0 · 0** beside it.
  **REPRODUCED ON A DATABASE HOLDING EVERY CONVERSATION**, endpoint answering
  500: the screen matched his screenshot word for word, so "nothing was lost" is
  a measurement and not a reassurance. **§93's fault where being wrong is most
  frightening** (that one made the password column say *unreadable* rather than
  *none* — counting an error as absence reports everybody as having none), and
  **§105's rule extended by one**: an empty state describes what was actually
  READ, never what could not be. The failure is recorded now, said plainly with
  *nothing has been lost*, and carries **Try again** — which reloads the queue
  AND any open conversation, or one pane is fixed while its neighbour still says
  the server is unreachable. **The counts read a dash** (§35: absent is not
  nought). **DRAWN ONLY WHEN THERE IS NOTHING TO SHOW** — a poll failing after a
  good one leaves the list somebody is reading where it was. **Warning ground,
  never an alarm colour** (§168, §190): the conversations are fine, the
  connection is not. **And the good path is asserted in the same breath**
  (§94.2), because a failure-reported assertion passes on a build that reports
  one always.
- **A VIEW-AS SESSION STARTS WHERE THEIR SESSION WOULD START (§237):** Islam,
  closing §234.2's finding — *"viewing as needs to have the same server
  connection and relation and not inherit my SMO abilities … so I get the
  errors."* The judging half has been the viewed person's since §185; what
  stayed the SMO's was the TAB (§234.2: its history made the §234 error
  unreachable from view-as, because the switch's own §204 flush had already
  re-aligned the server as the SMO). `switchViewer` now calls `SYNC.rebase()`
  after a clean flush: one GET, the boot's own `hydrate()` (§53.5), `LIVE`
  refreshed, `lastSaved` reset — a fresh sign-in by that person. **Three
  paths deliberately do not rebase**: file://‌/demo (nothing of the server's
  to take), a failed fetch (old baseline, never a blocked way — §209), and
  the refused way home, where taking the server's copy would silently destroy
  the work §184's banner offers to put back. Time is the stated limit — no
  switch can wear a tab that was open for hours; `test-two-tabs.js` guards
  that class. `checks/viewas-fresh.py`: 4 red on the pre-§237 build.
- **ONE FUNCTION'S SUBMIT MUST NOT CARRY EVERYBODY'S REPORT STATE (§234):**
  Islam, from a live client session — *"emergency error that we fixed 100
  times before"*: a CF custodian refused with **"You cannot report for
  admin."** four times over, functions he never opened; and the slides the
  same morning, *"someone was adding the slides and signed out and in and
  they lost progress."* **§216's fault one part over**: `review` holds four
  maps keyed by TARGET for the whole tenant (`submitted` · `parked` · `note`
  · `slides`) and travelled WHOLE, so any save touching it carried a stale
  copy of everyone's report state — refused where the victim's rights
  stopped it, silently wiping where they did not (the slides). The differ
  splits it now: field by field, and the four maps entry by entry —
  `review.submitted.fn:cf` and nothing else; a reopen is a DELETE of one key
  (§50.6). **`REVIEW_PER_TARGET` is exported from `graph-diff.js` and the
  authoriser's per-target loop reads it** (§53.5 — a field joining one list
  and not the other is this fault reborn). The apply side's three-segment
  paths are an ALLOW-LIST (`review.<one of four>.<target>` only), the
  fallbacks stay honest (an unaddressable key sends its field whole), and
  the residue is stated: same-target same-moment still last-write-wins,
  different targets never touch. Proved able to fail: 11 red on the differ's
  pre-build, and end-to-end on a real Postgres the whole-graph flag fails
  with the reported sentence to the word.
- **THE UNIT IS THERE BEFORE THE NUMBER IS (§251, reversing §248's own
  carve-out):** Islam, from his own plan with the pen open — *"In the edit I
  can't set the unit for a measure."* Two of his four Key measures had no target
  yet, and **there is no unit FIELD**: the unit lives inside the target string
  (§199), so a row with no target had nowhere to keep one and the column drew an
  em-dash with *"Set a target first"*. **THE TARGET HOLDS THE UNIT ALONE** until
  a number joins it — §248's own answer for a tactic's outcome (`"%"`, then
  `"90%"`), whose carve-out for the measures column (*"right in a column of its
  own"*) is reversed here at his instruction. **HE WAS ASKED WHERE AND ANSWERED
  "all 4 places"**: a pillar's Key measures, a unit's Overview objectives, the
  group's Foundation and a supporting function's Overview on BOTH formats — one
  cell, two shared builders, and fixing one is how the halves drift (§53.5).
  **THE ONE COST IS WHY `GAP_NUM` GREW**: a target holding `"%"` is non-blank
  and unusable, so `target`/`target3y` join `outTarget` — screen and server
  through the shared module — or the red Missing vanishes the moment a unit is
  picked, the count drops and Submit stops refusing (§249.2, one field over).
  Measured first: **208 non-blank targets in the shipped plan, 0 non-numeric**,
  so nothing in the demo moves; a tenant that typed a target as words gains the
  red word, and that is stated rather than discovered. **PROSE IS THE GUARD**:
  `targetParts` falls back to the WHOLE STRING when it sees no number, so
  reading any non-number as the unit would append *"Maintain share"* to the next
  bare number typed — the test is a unit the platform OFFERS (§199.4's fixed
  list), which is exactly what this control can ever have written, and anything
  else is kept as typed (§96.2). **ONE READER, ASKED BY BOTH** — `unitOfTarget`
  / `targetKeep`, with `outUnitOf`/`nextTargetUnit` and `measureDue` asking them
  rather than carrying a second copy of "is there a number in here" (§42). The
  unit lands in **this year's** target and never the 3-year one (a pillar's
  measures draw no such column, §51.16); **cleared, the key is DELETED** (§50.6).
  **FILL MODE IS DELIBERATELY UNCHANGED AND ASSERTED** (§201.2), one line to
  open. Proved able to fail twice: **16 red** with the em-dash put back, **6
  red** with the numeric rule removed — and **five of the check's own first-run
  failures were the CHECK**, among them a row searched by `textContent` when
  `koEdit` draws the name in an `<input>` (invisible on two of four surfaces),
  and the group's Foundation being a TAB rather than a section of Strategy.
  One assertion in `fn-ko-edit.py` was **REWRITTEN, not deleted** (§218).
  **AND THE CHECK FOUND A REAL ROUND-TRIP BREAK**: the workbook splits a target
  with `splitTarget`, so a unit-only one landed in the **Value** column, and
  `joinTarget` answers `""` for an empty value — the upload **dropped the unit**
  (§22: an upload authors, so what the file loses the plan loses). Both halves
  ask `targetPair` now and the rejoin is **`targetFromPair`, its own function on
  purpose**: `joinTarget` also rebuilds a REPORTED figure (§243), where a unit
  with no number is not an actual anybody entered. Asserted as a fixed point,
  with the emptied reporting box asserted to stay empty beside it.
- **THE DIRECTION AND THE COMPILE RULE STAY THE OFFICE'S (§249.4):** Islam,
  from the running platform — *"I viewed as Ali Reda from corporate, I can't
  adjust the direction or the compiling. is that ment to be?"* It is: neither
  is a gap (both carry a working default), so a filler writing one is
  AUTHORING, the server refuses it, and a save is all or nothing (§184).
  **THE GRANT DECIDES, AND IT WAS MEASURED RATHER THAN READ OFF A
  SCREENSHOT** — asked of `mayAuthorPage`/`mayFillPage` at each state of the
  own-Strategy cell: **view** draws read-only text, **fill** two controls and
  two read-only facts, **edit** all four. So there is no defect; somebody who
  needs those two is given Edit, not Fill gaps. *My first reading came from a
  screenshot of a tenant I cannot see and Islam corrected it — the answer only
  became worth trusting when it came from the rule.* **THE COST WAS STATED
  BEFORE HE CHOSE**: the direction stays `≥`, so a *less is better* outcome
  scores BACKWARDS until the office corrects it (2 against 5 reads 40%), and a
  blank compile compares against the WHOLE year (50 against 100% reads 50
  where Sum at eight months reads 75). He kept both the office's — consistent
  with §99.8, *how a thing is measured is a plan decision, not a reporting
  one*, and recorded as his call so the line (the filler writes the target but
  not the direction) is a decision rather than where the gap list happened to
  stop.
- **WHAT AUDITING §249 FOUND (§249.2, §249.3):** Islam, the same day —
  *"double check if this made any problems with the input or the saving or the
  reporting or the accessibility ... as the platform is live."* Two refusals,
  one mine and one older than mine and made routine by it. **§249.2 — A VALUE
  THAT IS STILL A GAP IS NOT A FILL**: §248 lets the unit be chosen before the
  number, so `outTarget` holds `"%"` on the way to `"90%"` — non-blank and
  still empty by the gap rule — and the first build **stamped** it (and
  `gapMissing` treats a marked field as ANSWERED, so the row would have left
  the count, the walk and Submit's refusal with an unusable target) and the
  server **refused** it (no mark on either side, so the gap pass skipped the
  field and it fell through to `unitPlan` — §184's shape, where one
  unclassified row costs every fill in the same post). The mark is written
  only for a value the platform can use; a gap moved to another gap is the
  filler's, and nothing is gained by it. **§249.3 — KEY ORDER IS NOT CONTENT,
  AND IT IS NOT ONLY `pend`**: §145 made the MARKS compare canonically because
  jsonb reorders `{by, at}`; the same fault sits on the ROW. The gap pass
  clears by ASSIGNING onto the stored clone, which APPENDS a key the stored row
  lacked, and `same()` is stringify-based — so two fills of absent keys in ONE
  post leave the clone spelling the row differently, the residual diff calls it
  `unitPlan`, and the save is refused. **It predates §249 and was measured on
  the build before it** (refused with both keys absent, accepted with both
  present-but-empty); §249 makes it the COMMON case, because §248's five fields
  are absent on every existing tactic and two of them are what a filler is now
  asked for — *the outcome and its target, filled together, would have been
  refused every time*. The repair is `sameCanon` generalised from the marks to
  the row, and that guard is the safety argument: it only re-spells rows whose
  CONTENT is already identical, asserted with a rename and a direction change
  smuggled in beside the fills and still refused. **AND THE REST OF THE AUDIT
  IS MEASUREMENT, NOT REASSURANCE**: round trip on a virgin Postgres 16, clean
  slate, two tabs 24/0, eight concurrent saves none lost, the incremental
  writer byte-identical — and the five §248 fields plus a mark on them
  round-trip through jsonb (**the first comparison said FAIL and the COMPARISON
  was wrong**, jsonb reordering the mark's keys: §145's lesson landing on the
  person quoting it). Reporting unchanged and a figure still enters. Contrast
  measured with the sweep's OWN function in both themes: Plan 0, Performance 0,
  Reporting 6 — **and the pre-§249 build reports the same 6**, same selector,
  same ratio. Reading mode is clean 1600 → 768; the pen's overflow below 1100
  is byte-identical to the build before. **RECORDED, NOT FIXED**: in FILL mode
  below 1000px the tactics table runs past its pane (20px at 1000, 120px at
  900, 45px at 768) because the cell keeps `.tgtcell` wherever it holds
  controls (§61) — it SCROLLS rather than clipping and every control was driven
  and writes, but §158's rule is *fit, never "and it scrolls"*, and every way of
  reclaiming the width changes a control's drawn shape, which wants a mockup
  (rule 1c) rather than a quiet widening.
- **THE OUTCOME AND ITS TARGET ARE OWED (§249, reversing §248's own
  exclusion):** Islam — *"the tactics outcome and target are not counting
  missing in the units plans. they should count as missing."* §248 left it
  undone deliberately and said whose call it was (*"one line and is Islam's to
  take"*): its quiet default answered a question about the ROLLOUT — the risk
  was noise — not about the plan. **BOTH, because half a row cannot be said**:
  the target carries the arithmetic, the outcome names what the number is
  about. **ONE LINE DOES FOUR THINGS** and all four were put to him with the
  arithmetic before it was written: the page says Missing, every count and the
  Next-gap walk include them, they become FILLABLE (`GAP_FIELDS` is the floor
  of `GAP_FILLABLE`, §205 — counted-and-not-fillable would be a red count with
  no control behind it, §223), and **Submit refuses while any tactic still owes
  one** (§221 reads the same map). That last is the cost, and he took it.
  **A TARGET HOLDING ONLY A UNIT IS STILL MISSING** — §248 lets the office pick
  what a thing is measured in before deciding how much of it, so `outTarget` is
  `"%"` for as long as it takes to type 90 and a blank test would call that row
  answered while `outcomeOf` refuses to score it (§184's rule with a number in
  place of a date). `GAP_NUM` + `targetHasNumber()`, **and `outcomeOf` asks that
  same function**, or the count and the score would disagree about one string
  (§42, §53.5); the wording is the one it already had, so **no stored figure
  moves**. **THE CELLS GO THROUGH `gapCell` AND THE CONTROLS STAY THEIR OWN**
  (§130.1's hook: prose that wraps, and four boxes in one cell) — **`fillKind`
  named**, or the cell opens whatever the shared list says and the new check
  passes on a reverted build (§228.2, and it did); **the direction and compile
  rule read-only in fill mode**, because both carry a default so neither is a
  gap and a filler writing one would refuse the whole save (§184) — drawn, not
  dropped, since a hole among four equal boxes reads as a control that failed
  to render; and **`.tgtcell` kept wherever controls are drawn**, read off the
  hook having run rather than re-derived, or below 880 the fold takes the only
  way to set a target off the screen (§61). **`outcomeCell` stopped saying
  dash on all three surfaces** — that em-dash was argued straight from the
  count, so the reason expired with it (§94.15) — and **the narrow fold says
  Missing** rather than hiding the one place the count names. Proved able to
  fail: **3 / 7 / 2 red** with the names taken back out, **1 red** with the
  numeric rule alone removed. **FOUR CHECKS HELD A LITERAL THIS MOVED**
  (§214.3, fifth time), all REWRITTEN not deleted (§218) — including one that
  was `or True` and one that **reported a correct build as broken**, because
  the fill door walks to the first gap and the first gap moved. **RECORDED,
  NOT DONE**: the plan deck has no column for either field, so §119's rule is
  now true of six of a tactic's eight facts and not these two — two more
  columns on a seven-column slide wants a mockup, not a quiet widening.
- **A TACTIC IS JUDGED BY WHAT IT PRODUCED (§248):** Islam — *"the tactics
  have outcomes that we need to have in our tactics plan so we can measure the
  progress against"*, and *"the outcome needs to have a target and measuring
  unit so it can be reported in the reporting and measured in the performance
  accordingly."* **BOTH FIELDS ALREADY EXISTED AND WERE BEING SWALLOWED** —
  `description` and `outcome` are stored on every tactic and the workbook has
  read both since the template existed; the outcome rendered in ONE place (a
  grey line under the name) and the description in NONE. **THE OUTCOME IS
  SHAPED AS A MEASURE**, so `measureDue`/`measureScore`/`measureDueLabel` serve
  it unchanged (§239's rule, not a second copy): Sum prorates, Latest and
  Average keep the annual target, the direction decides the division.
  **THE FIGURE IS ITS OWN FIELD AND THAT IS THE WHOLE MIGRATION STORY** —
  `t.actual` has always meant "% delivered" and is what `pillarExec` averages
  and `figuresSnapshot` archives, so an outcome's number in that box would make
  a tactic at **45** read **750%** against `≥ 6 #` the moment the target is set,
  and the average would mix a per cent with a count. It reports into
  **`outActual`**; the five fields ride in `extra`, so **no migration and no
  schema change**, and every closed cycle reads as it did. **THE SWITCH IS PER
  TACTIC, WHEN A HUMAN TYPES**: a tactic is asked and scored the old way until
  its outcome has both a target AND a figure, so adding one mid-round changes
  nothing. **Proved, not argued: 19 subjects read off the shipped build and
  this one, byte-identical.** **NOT A SETTING** (put to him, and refused for
  §44/§102/§104.7's reasons): the risk was noise, so the default is quiet — an
  empty outcome is an em-dash, never the red word, and is not a counted gap;
  it is deliberately not in `GAP_OPTIONAL` either, because its target is the
  office's and a fillable name with an unfillable target is §205. **FOUR EQUAL
  BOXES IN ONE CELL** (his): `--tw` is 96px, what a select needs for *Average*,
  measured — the width handed back goes to the prose columns and the rows get
  SHORTER (149 → 131). **THE DESCRIPTION IS UNDER THE TACTIC'S NAME** — his choice
  between two drawn shapes, and the first build got it wrong and shipped a
  column; he caught it from the running page. §158 comes free with it (seven
  columns fit everywhere), so only the TARGET folds, below 880, and **never
  while the pen is open** (§61: the four controls are the only way to set it);
  the head folds with its cells, decided where `ed` is known, never with
  `:nth-child`. **AND THE UNIT PICKER IS ALWAYS DRAWN** — hiding it until a
  target exists is right in a column and wrong inside four equal boxes, where
  the hole reads as a control that failed to render. A unit is held ALONE until
  a number joins it (`outTarget` is `"#"`, then `"6#"`; clearing the number
  keeps the unit), which needed `outUnitOf()`: `targetParts` falls back to
  `{value: the whole string, unit: ""}`, so a truthiness test threw the unit
  away on the first keystroke. **The workbook carries the three new facts** or a
  round trip drops every target (§22), with Q1–Q4 moving G:J → J:M because a
  validation range is a POSITION (§65). **`outActual` joins `REPORT.tactic`**
  in the same edit as the box that writes it (§42, §147). Proved able to fail:
  **31 red** on the previous build — and its first run DIED rather than
  reported (§215), so every evaluate degrades now.
- **A TACTIC'S OUTCOME IS MEASURED AGAINST ITS OWN WINDOW (§250):** Islam —
  *"a tactic that is only in q2 and 3 so that's a 6 months project from april
  till september .. now we are reporting till august so the proration how should
  it be calauclated? because it's different than the proration of the measurs
  that prorate across the eyar."* **HALF OF IT WAS ALREADY TRUE**: §239 gave
  `tacticPlanned()` the tactic's own months, so *% delivered* read **5 of 6 =
  83%**. What never reached it was §248's OUTCOME, which is shaped as a measure
  on purpose and so went through `measureDue()` — the YEAR's share. Measured on
  the shipped build at August, a Sum outcome of 12 against 7 read **88% for
  every one of ten window shapes**: one number for ten periods, §239.1's fault
  one part over. **THE SHARE IS SUPPLIED, NEVER RE-DERIVED** —
  `measureDue`/`measureScore`/`measureDueLabel` take an optional share; a key
  objective and a pillar measure pass nothing and read `elapsedShare()` exactly
  as before, a tactic's outcome passes `tacticShare(t)`, and a second
  `outcomeDue()` would be two definitions of proration drifting apart the first
  time either is corrected (§53.5). **Absent and null both mean the year**, so a
  tactic naming no quarters falls back rather than refusing to score.
  **IT IS AN EXACT FRACTION AND THE FIRST BUILD PROVED WHY**: `tacticShare()` is
  the value and `tacticPlanned()` is it ROUNDED, never the reverse — 83/100 is
  not 5/6, so the first draft made a target of 12 read **`9.96`** and moved a
  WHOLE-YEAR tactic from 88% to 87%. **THE MONTH BEING REPORTED IN COUNTS**, put
  to him rather than assumed, because the year already says 8/12 and not 7/12.
  Only `Sum` prorates; a `≤` outcome has its ALLOWANCE prorated and not its
  score; §239.4's nought rule and the 150 cap hold; the unit survives
  (`15B EGP`, `75%`, `5 #`). A NOT-STARTED tactic is never shown a target of
  nothing — every surface reaches its own not-due branch first, asserted as
  unreachable. **Nothing stored moves**: 842–852 scores read off the shipped
  build and this one at six review points, identical at every one.
  **§250.1 — AND IT NEARLY SHIPPED A SILENT DISASTER**: `Array.map` hands its
  callback the INDEX, and `pillarPerf` mapped `measureScore` POINT-FREE — so the
  first measure of every pillar would have been prorated by 0 (unscorable), the
  second by the whole year, the third by TWICE it, wrong only for the `Sum` rows.
  Measured: one pillar **100 → not scored**, another **83 → 65**. *Adding an
  optional parameter is a change to every place that function is passed BY
  NAME.* **AND THE PROBE THAT SHOULD HAVE CAUGHT IT WAS BLIND** — it called
  `unitPillars(key)` where that takes an OBJECT, so it compared two identical
  error strings and called it agreement (§94.5: two crashes agree perfectly).
  **§250.2 — RECORDED, NOT DONE**: the review deck still ignores an outcome
  entirely (`present.js` prints `t.actual` against `tacticPlanned` and has never
  referenced `outActual`), measured byte-identical before and after, so it is
  §248's omission and correcting it is a decision about what a slide shows;
  and `checks/report-saves.py` is red on `main` for a stub that does not serve
  `sw.js` (§100.3, §231.5), reproduced on the shipped build.
- **YTD IS MEASURED AGAINST THE PART OF THE YEAR THAT HAS PASSED (§239):**
  Islam — *"the reporting of YTD is being compared with the full year target
  without proration which is the wrong practice."* Three answers to one
  question: a tactic was compared with its own elapsed quarters, a milestone
  with its date, a measure with the **whole year**, flat. Measured: of 26 Sum
  measures with an actual, the median read **45 points low** and **18 crossed
  out of Off track**; group revenue read 43% for a half year that is 87%.
  **THE PLAN ALREADY SAID WHICH ROWS PRORATE** — `compile`: *Sum* adds up so it
  prorates, *Latest* is a rate at a point in time and *Average* is normalised,
  and with no baseline stored, prorating those would invent a glide path.
  **PRORATE THE TARGET, THEN COMPARE, NEVER THE RATIO**: dividing a score by the
  elapsed share is backwards for a ≤ measure, so the demo having none, the
  check MAKES one and asserts the 125% only the right arithmetic gives.
  **THE STORED FIGURE DOES NOT MOVE** — `progress` keeps the raw
  actual-against-annual ratio and the score is DERIVED (`measureScore()`, the
  tactic's own shape moved over), so archives and closed cycles read as they
  did, nothing is migrated, and the Focus board keeps the raw figure because
  **reward stays a year-end judgement** (his call).
  **AND THE REVIEW POINT WAS TWO FIELDS THAT DISAGREED (§239.1):**
  `tacticPlanned()` read `REVIEW.endsQuarter` (the CYCLE's end) while the
  quarter pips read `GROUP.asOfQuarter` (*"the review point"*) — identical in
  the demo, divergent on any cycle reported in-year: over 84 demo tactics a
  Q4 cycle makes **every one read 100%**, one distinct value, while the pips
  on the same row say Q2. It **nearly cost the whole fix**: prorating by
  `endsQuarter/4` is 4/4 on his tenant, so the change would have done nothing
  on the deployment that reported the bug. **IT IS A MONTH** (*"we might be
  reporting till month 8"*), `REVIEW.asOfMonth` riding `review.extra` so
  **no migration**, picked not typed (§177), set at cycle open AND editable
  mid-cycle — there was no editor at all before. **THE FALLBACK IS WHAT MAKES
  IT SAFE**: unset falls back to the cycle's quarter end, so nothing moves
  until the office sets a month, and it **never writes** (§42, §50.6).
  **Tactics count MONTHS**, so a half-finished quarter counts for its part.
  **AND THE `Not asked` GATE COMES BACK** — rows that had not started were
  being asked for figures. §239.2 carries the table wording, all his:
  *Annual target* · *YTD actual* · *YTD delivery* with the per cent sign on
  both halves (*"what is 45/50?"* — and the same cell already printed
  *"due at 50%"* WITH the sign) · Variance gone · *Of plan* → *Progress* ·
  *Due at* → *YTD Target*, KEPT, **reversing his own previous round** and
  recorded as a reversal · the reporter's note on Performance **under the
  name**, which `capKOTable()` has done all along, costing no width (§158).
  **`Compile` was never on a slide** and the .pptx is unreachable (§145.9), so
  that half of "remove them from slides" was checked and not done.
  **AND THE REVIEW POINT HAD TO KNOW ITS OWN YEAR (§239.3):** shipped, and
  within the hour — *"I adjusted the reporting cycle to august but the ytd is
  calculating against the full year target"*. §239.1's own fault by §239.1's own
  fix: `reviewAsOf()` reads `"Aug 26"`, which CARRIES ITS YEAR, and
  `elapsedMonths()`/`tacticPlanned()` threw it away and asked `cycleYear()`,
  which scrapes a four-digit year out of `to`/`name`/`due` — a cycle written
  *"Annual Plan / Jan / Dec"* has none, so the share was null and EVERYTHING
  fell back to the whole year with the month plainly set. Reproduced across
  four cycle shapes first. **One of his three screenshots was not a bug**: all
  four of those measures compile by `Latest`, which by decision does not
  prorate. **And the strip now says what the month MEANS** — *"· 8 of 12
  months"* — because he could not tell whether it had taken; unset it says
  *"taken from the cycle's end"* and shows the month IN USE rather than crying
  *Missing* over a working fallback (§177, §214.4).
  **AND NOUGHT ON A ≤ MEASURE IS THE BEST ANSWER (§239.4):** his own row,
  *Data duplicate rate ≤ 1%, 0%*, read **Not scored** — a regression §239
  introduced, because the arithmetic divides BY the actual and the guard
  against dividing by zero swallowed the best result in the table (the old
  expression landed on the cap by accident: 1/0 is Infinity, clamped). It
  returns the cap deliberately now, asserted with a real overshoot beside it so
  a build returning 150 for everything fails. **The rest of that table is the
  rule working**: all four rows compile by `Latest`. What it exposes is the
  rule's COST on his plan — his measures are adoption rates almost throughout,
  so "Sum only" moves very little for him, and that is a decision put to him
  with the arithmetic rather than assumed.
  **AND THE UNITS GAIN DOLLARS (§239.5):** `K USD` and `M USD`, at his
  instruction — the list carried Egyptian pounds only, so a stored `M USD` was
  KEPT by §96.2's rule and could never be CHOSEN. `B USD` and `K EGP` are
  deliberately not invented alongside them (§199.4: a fixed list is a
  vocabulary somebody agreed). They join `TIGHT_UNITS`, so a scaled currency is
  one token whichever currency it is — `6.2M USD`, like `6.2B EGP` — and it is
  proved a FIXED POINT: what the pen writes splits and rejoins to itself.
  **The check's own example had to move** (§51.11): §7b asserted `M USD` is
  offered though the list does not carry it, which would now pass while
  guarding nothing, so it asks about `B USD`. **And the doubled unit
  (§239.6) was already fixed** by §243 from another session, merged in before
  he asked — with one case it deliberately does not do (a DIFFERENT unit is
  left as typed, because rewriting `8 B EGP` as `M EGP` is a data fault where
  doubling is only a display one) and one it cannot (a value already stored
  doubled stays so until re-entered).
  **The server needed nothing** and it is asserted both ways: `asOfMonth` is
  not in `REVIEW_PER_TARGET`, so it classifies as `cycle` — the office's.
  Proved able to fail three ways (4 / 2 / 3 red). **AND `qa.py`'s OWN METHOD
  MOVED**: it modelled "nothing reported" by blanking `progress`, which
  asserts nothing once the score is derived from the actual — §51.11 in a
  check's machinery rather than its selectors.
- **A DEPENDENCY MUST NOT BE ABLE TO TAKE THE FEATURE IT SERVES DOWN (§231.3):**
  Islam, minutes after the §231 merge — *"the chat bubble disappeared!"*
  `lib/push.js` required `web-push` at its TOP level and `api/chat.js` requires
  `lib/push.js` at ITS top level, so anything stopping the library loading
  stopped **the whole chat endpoint** loading — reproduced: with the package
  moved aside the dev-server will not start. And §197 is explicit that **the
  corner is created hidden and only a SUCCESSFUL answer reveals it**, so a 500
  matches no branch and the bubble is simply never drawn. **§104's rule one
  module out**: no key, a refusal, a timeout and the switch off all land on the
  chat as it worked before, and *"the package did not load"* belongs on that
  list — a notification helper degrades to **no push**, never to **no
  conversation**. Loaded inside a `try` now, remembered so it is attempted once.
  **Why it was missing in production is NOT claimed** (the lockfile carries it);
  the endpoint must not depend on it either way. **Asserted as the SHAPE** — a
  top-level require is what cannot be caught, so its absence is the assertion,
  and a test that moved the package aside could not run twice.
- **A BOX THAT ARRIVES WITH NO TAB OPEN (§231):** Islam, having turned §225 on
  — *"I didn't get any notifications despite enabling the notifications"* — and
  then, correcting two wrong diagnoses, *"stop assuming wrong things, the bell
  is allowed and in the chat box is on."* **HE WAS RIGHT AND I WAS READING
  RATHER THAN MEASURING.** Measured: with the tab in the background, **0
  requests and 0 boxes across 45 seconds**, then **both boxes at once** on
  coming back — the one moment they are worth nothing. **THE CAUSE PREDATES
  §225**: §98.1 stops the chat's clock dead while `document.hidden` so the
  database can sleep, which is right for a badge you see next time you look and
  exactly wrong for a notification, whose job is to reach somebody NOT looking.
  *A feature can be correct in every line and still sit on a decision that makes
  it pointless.* **SO THE BROWSER STOPS ASKING AND THE SERVER SENDS**:
  `lib/push.js` is the one place a notification leaves the platform (`mailer.js`
  mirrored — only place the credential is read, nothing it returns contains it,
  knows nothing about who anybody is), and `sw.js` receives. **A DEPENDENCY,
  AND §72's REFUSAL STILL STANDS**: Gemini is one POST, web push is RFC 8291 +
  8292 and this sandbox cannot reach a push service, so hand-rolled crypto could
  never be tested against what it must satisfy — 17 packages, stated not hidden.
  **THE KEY PAIR IS MINTED ON FIRST USE INTO THE DATABASE** (env override), or
  the feature is off on every deployment until an engineer pastes two strings
  into Vercel; the cost is said — a dump now holds a key that could send a box
  to a subscribed device, smaller than the password hashes already there.
  **THE SUBSCRIPTION IS THE SWITCH** — no `on` column to disagree with it
  (§104.7, §50.6) — and it is written against the **signed-in person, never a
  key from the body** (§185), with an **https** endpoint only, because our own
  server fetches it (§71). **ONE BOX, ONE SOURCE** (§53.5): on a subscribed
  device the page stands its own box down, or one message draws two. **A 410
  DROPS THAT DEVICE AND A 500 DROPS NOTHING**, and a notification never costs
  the message it is about. **§231.2 — THE BELL HAD TO SAY WHAT WOULD HAPPEN**:
  §225 read the person's switch alone, so a browser never asked showed ON with
  a hover promising a box that could not appear (§124), and the only control
  switched OFF the thing that was not on (§61) — four states now, and the press
  ASKS in the third. **AND THE REPLY PUSH LANDED IN THE WRONG BRANCH** — both
  `thread` and `reply` contain a line starting `const here = t.here_at` and a
  first-occurrence replace took `thread`, so READING a conversation notified and
  ANSWERING one did not; found by the endpoint test, not by reading (§96).
  **NOT CLAIMED**: "browser closed" is true on a phone and partly true on a
  laptop (the service can only hand it over while the browser runs somewhere),
  and iOS still needs the platform on the home screen.
- **THE NOTICE SPEAKS THE USER'S LANGUAGE (§230.2):** Islam, on §201's wall —
  *"too technical for the users"*, then *"make a very simple user message"*,
  then *"no need for examples to look at."* Four short lines (*Just a moment…*
  · *Your page is taking a little longer to open. Your work is safe.* · *It
  will open by itself — no need to do anything.* · **Try again**), no "server",
  no "data", no "example" — asserted as a regex over the whole card. **The
  "Look at the example anyway" way past is REMOVED at his direction, cost
  stated**: while the server is truly down there is no way past — element,
  handler and `.nosrv-link` deleted, not hidden (§24), and the check asserts
  the absence.
- **A LATE ANSWER STILL LANDS (§230):** Islam, hard-refreshing after a
  deployment — §201's wall, every time, clearing itself later. **The server was
  healthy and the landing was wrong**: a cold function's first answer routinely
  arrives after the 8s `BOOT_GIVEUP`, and the one-shot `land()` swallowed it —
  real data hydrated in memory behind a wall promising nothing is saved. A
  second landing is allowed for exactly one case (first landing the backstop's,
  this one carrying the live tenant): it paints in place and takes the wall
  down — no reload; a late FAILURE still leaves §201 standing, probe and all.
  **Deliberately not a longer give-up.** Measured first: production 0.3–0.6s
  warm, a signed-in GET 11–54ms against a real Postgres — the 8s is eaten by
  the environment's cold start. `checks/boot-skeleton.py` §6: 2 red on the
  build before.
- **ENTER COMMITS A ONE-LINE PROSE BOX (§229):** found during §231's audit —
  §189's own text promised *"Enter blurs, which is what commits"* and no code
  ever carried it out, so Enter inserted a newline into every growing title
  box (§104.8's family: a recorded intention nothing compares with the code).
  One listener in the shell's `data-fld` textarea branch, gated on `.grow`
  (§104.7 — no list to forget); a `rows="2"` area keeps Enter as a paragraph
  key; **blur, never a synthesised change** (§219). Nothing stored is
  scrubbed. `checks/enter-commits.py`: 4 red on the pre-§229 build.
- **A FUNCTION'S OBJECTIVES ARE WRITTEN AT THE PAGE'S WIDTH (§231):** Islam —
  *"the keyobjectives table is tight I can't see the direction and I can't find
  the unit and the ibjectives cell is not wrapping"*, and *"led by is not open
  to edit"*. Three of the four are ONE omission: the function Overview's
  `capKoEdit` (both formats, §213) edited inside the half-width fgrid card —
  Objective input **101px**, Dir. select **34px** at 1500px — and §96.6's band,
  §199's Unit column and §189's wrapping prose had each reached the unit's
  table and never this one. **In edit/fill mode the table takes a `.koband`
  under the cards, on BOTH formats** (§53.5 — one page), reading mode keeps the
  card; the Unit column is §199's own trio plus `unitInherit` and
  `fillUnitCell`, nothing stored, **no server change** (`gapFieldPass` already
  runs `unitAddedOnly` per row kind); the name is `textOr` in `capKoEdit`
  ONLY — **the unit side is untouched at Islam's instruction**, asserted as a
  measurement. **Led by opens for the office through the register's own door**:
  Setup's `assignPicker` writing `FUNCTIONS[k].head` via `grantPersonRole`
  (§33, one fact one door), office-only because a head change classifies as
  Setup — both ends asserted, and the explanatory sentence is a hover (1b-ii),
  not the mockup's printed line. **The check guessed and the product was
  right**: it asserted `"1.6 B EGP"` where §199.4's convention writes
  `"1.6B EGP"` — the expectation moved to the platform's rule. 5 red on the
  pre-§231 build; `fn-pillars`, `foundation-objectives`, `objective-unit`,
  `gap-fill` and the full sweep green after.
- **A BOX FROM THE COMPUTER WHEN A MESSAGE LANDS (§225):** Islam — a browser
  notification for platform messages, *"for the SMO when someone replies, and
  for the users when the SMO replies to them"*, wording **B** (who wrote, and
  the first line), *"and the user can swithc off inside the platform as well"*,
  **per device**. **THREE SWITCHES, AND ALL THREE MUST SAY YES**: the company's
  (`chat.popup`, off by default — only an explicit `true` turns it on, §104),
  the person's own bell in the conversation, and the browser's permission —
  three decisions by three people, none standing in for another. **NOT NAMED
  `notify`**, which is already the handover email (§87's twins, in a settings
  object). **THE PERSON'S IS PER DEVICE AND THAT IS THE TRUTH, NOT A SHORTCUT**
  — the browser's permission is per device too, so a switch claiming to follow
  somebody everywhere would read ON on the laptop and stay silent on the iPad;
  `localStorage`, **stored as an ABSENCE** (§50.6), and **a throwing store
  reads as ON** (the opposite of §107's tour: the failure that matters is
  nagging somebody who said no, and that needs the key PRESENT). **THE PAIR IN
  THE HEADER HAD TO BE GROUPED** — `.chx` carried `margin-left:auto` itself, so
  a second one is pushed right independently and the two land a gap apart;
  the group is **`.chbtns`, never `.chacts`**, which already exists under
  `.chthead`, one letter from `.chathead` (§65.9). **FOUR ANSWERS, THREE
  DRAWN**: office off, or no `Notification` at all (an iOS Safari **tab**), and
  nothing is drawn (§61); a browser that **refused** still gets a bell,
  `aria-disabled` and never `disabled`, or the sentence explaining the silence
  cannot be reached (§221, §163). **ASKED ON A GESTURE ONLY** — opening the
  panel, or pressing the bell on. **THE OFFICE IS THE HALF THAT NEEDED THE
  SERVER**: their corner is their OWN conversation and the Inbox's clock stops
  the moment they leave that page (`boxBeat`), so `mine` carries `waiting` /
  `waitingWho` / `waitingBody` **for the office only** — one query for a handful
  of people (§98), the same two facts everybody else's box carries (§53.5).
  **NAMED IN `out.chat` OR IT NEVER ARRIVES**: that object lists the keys it
  forwards, so `popup` had to be added there too — §135's `greet` exactly, and
  without it the bell would never draw on the deployment. **NOTHING WHERE IT IS
  ALREADY ON SCREEN** (panel open; office reading the queue), **the first
  answer of a session never announces**, and **one tag per side** so a waiting
  question never replaces a reply. **THE ROW SITS ABOVE THE TWO EMAIL ROWS,
  NEVER BETWEEN THEM** — the first build split the pair §127 had just brought
  together, and the check said so.
- **A CAPABILITY TRAVELS ON ITS OWN (§216):** Islam, from the deployment —
  *"the CX is still getting errors on filling"* — with Hala, working on **CX**,
  refused by *"a project's milestones (**admin**) cannot be changed here"*.
  **THE REFUSAL NAMED A FUNCTION SHE HAD NEVER OPENED, and that is the clue.**
  Measured: every capability in the tenant lives in the `group` part and `group`
  travelled WHOLE — one milestone owner sent **33,433 bytes** carrying all eight
  functions' plans, so any difference between her tab and the stored graph, made
  by anybody, was judged as hers. §215's fix in the one place §210 could not
  reach: units and functions are keyed MAPS and were split; capabilities are an
  **array inside a part** and were not. The addressing is a declared TREE now,
  walked identically by the differ and the server, with anything outside it
  falling back to the whole part. **33,433 → 168 bytes.** Reproduced end to end
  against a real Postgres in her exact shape — stale tab, somebody else's change
  to another function in between — and **the other function's work survives**,
  which fails before the fix; 15 red with it switched off. **AND THE FIRST BUILD
  NAMED THE WRONG PART** (`org`, the word §210's prose uses; it is `group`) and
  **every unit test passed**, because they built the fixture with the same wrong
  name — the real-database test caught it (§100.3). **NOT fixed and said so**: a
  genuine refusal is still a refusal, and if they continue while naming a
  function nobody opened, this diagnosis is wrong.
- **A MILESTONE'S COLLABORATORS, THE TACTIC'S RULE MOVED OVER (§227):** Islam —
  *"add collaborators beside the owner column similar to the collaborators in
  the tactics in the units. align with me."* Aligned first; both decisions his:
  **being named is a reporting right** (the word means on a milestone what it
  means on a tactic) and **the column shows everywhere the tactics show
  theirs** — editable on the Plan pane, read-only on Performance and the deck;
  the Reporting pane shows no owner and stays untouched. Every accumulated
  tactic rule moves over rather than being re-decided: ticked from the
  register (§130.1), fillable while EMPTY and never counted (§187/§205 — the
  field joins `GAP_OPTIONAL.milestone` so screen and server answer together),
  emptied key DELETED (§50.6), em-dash for nobody (§15.1). **ONE RULE, NOT
  TWO**: `namedOn()` always read owner + collaborators; only §147.8's
  derivation stripped the milestone to `{owner}` — the row travels whole now,
  so a collaborator derives Contributor, reporting only the milestone that
  names them once the Contributor row is opened. **The workbook carries the
  column or the round trip drops the names** (§22: an upload authors) — sheet,
  reader (either comma or pipe, old files fine, §58), CSV pipeline; proved a
  fixed point. **No migration** — `milestones.extra`, §177's own road. **The
  header is "Collabs."**: the full word cost a 515px pane 11px at 830, found
  by `table-fit.py` going red, and the short form is what the tactics wear on
  every surface (§53.5). `project-tables.py`'s dead-cell probe learned that a
  `.collabs` em-dash is an ANSWER — exempting exactly one column, asserted, or
  a build classing every cell would blind it (§113.8).
- **COUNTED AND FILLABLE ARE TWO QUESTIONS, AND THE DOOR ASKS THE SECOND
  (§223):** Islam — *"Hala from CX can't fill the missing definition"*, with
  the Definition an em-dash and no control on the page. Measured:
  `mayFillPage` **true**, `gapTotal` **0**, **not one fill control drawn** —
  her permission was never the issue and the server accepts the save. **THE
  UNSTATED COST OF §214.2 AND §214.4**: both took fields out of the COUNTED
  list at Islam's direction and both carefully left them FILLABLE, and nobody
  asked how they would then be REACHED — fill mode is entered from the *Fill
  in missing elements* button, which is drawn from the counted total, so a
  page whose only blanks are optional had no door at all. **§205 from the
  other side**: that one is a cell the screen opens and the server refuses;
  this is one the server accepts and the screen never opens. `gapOpenable()`
  is `gapMap()` counting FILLABLE-and-blank and decides the DOOR; the red
  count and the chips still come from the counted total, so a bar with
  nothing owed carries no number, no chips and the words *Fill in what is
  empty* (§177 with the sign reversed, §214.4's own argument). **The walk
  stops offering a next gap that is not there.** `fn-pillars.py` asserted the
  bar was ABSENT — the exact state Hala met — and was REWRITTEN to assert no
  count, no chips, and a door.
- **THE REPORTING TAB IS ORANGE AT ALL TIMES (§222.2):** *"it should always
  become orange even if it's not open."* §222's first build gave the orange to
  the WORD unselected and the fill only on selection, so the tab was quiet in
  exactly the state where somebody needs to notice it — the old Report button
  was solid always, and this is that volume MOVED, not a new one (§41 holds:
  drawn only while a cycle is open, for somebody who may report). Selection is
  still said, in `--cta-hover`, the deeper half of the same pair — no new
  token, no literal (§25).
- **REPORTING IS A TAB (§222, revisiting §63):** Islam — *"split it as a tab
  beside the Strategy and Performance … with its distinct orange colour"*;
  three treatments drawn in the real page, he picked the **solid fill when
  selected**. §63 removed a Reporting SECTION from INSIDE Performance and that
  argument still holds — this is a different placement, and Reporting stops
  being buried in the thing it produces. **THE REPORT BUTTON GOES WITH IT**
  (§94.15: a control with no audience of its own), `reportBtn()` DELETED not
  left uncalled (§24), and the accent budget is unchanged because the fill
  MOVED rather than multiplied. **`when` is the cycle, `ac` is the grant** —
  the same pair the button asked, or it is a tab that opens nothing (§61).
  **Being on the tab IS the mode**, set once in `paint()` and never in each
  render (§53.5). **AND THE TAB KILLED CLOSE**: `REPORTING` is set from the
  tab, so `REPORTING = null; paint()` put it straight back — rendered
  perfectly, did nothing (§96). Close leaves the TAB now, landing on the
  `primary` one read off the ROW. **NINE CHECKS PRESSED THE OLD BUTTON**
  (§51.11, seventh time) and four then found real work — a row of three that
  is two, an ink measured against a TRANSPARENT ground (the fill exists only
  while selected, and the node must be re-queried after the press because the
  repaint detaches it), a fill measured on a report §221 had dimmed, and
  **Playwright treating `aria-disabled` as disabled**, so a forced press keeps
  the refusal path under test. **Six of the ten demo units ship already
  submitted**, so with §220's lock they now open read-only — the feature
  working, and a change to what the demo shows.
- **THE TARGET DECIDES THE STRATEGY COLUMN (§217):** `lib/authorize.js`'s
  `unitFoundation`, `unitAnalysis` and `unitPlan` guards each named a UNIT page
  key outright, while the target they are handed can be `fn:<key>` — a pillars
  function is classified through the unit-shaped pass (§59, and that is right)
  — so **a supporting function's plan was authorised against the BUSINESS UNIT
  Strategy column.** Measured, and exactly backwards: granting a custodian Edit
  on their own supporting function changed **nothing**, granting Edit on
  business units **let them author functions' plans**. `mayFillRow` two lines
  below had been asking `planPageOf(target)` all along, which is what made it
  findable. **ONE PAIRING, NAMED ONCE** — `strategyPageOf(target, unitPage)`,
  with `planPageOf()` becoming that asked for the plan (§53.5). **Asserted in
  both directions AND on both sides of the switch**: a test that only checks
  "the custodian can edit" passes on the broken build by setting the wrong
  cell. 2 red reverted; the unit half green either way.
- **THE OFFICE'S APPROVAL ON A FILL IS GONE (§218, reversing §145.10):** Islam
  — *"the custodian is already choosing from lists and he is responsible. The
  confirmation is just a gate that we never needed."* Put to him that the gate
  also stopped a filler naming themselves an Owner and thereby gaining that
  line's reporting right; **he decided, and it is recorded as his.** **WHAT
  SURVIVES IS THE STAMP, NOT THE GATE** — `pend` is still written and still
  read by the authoriser, so a filler can correct their own typo (§145), and it
  decides nothing else. **AND IT IS WHAT UNSTUCK CF**: `tacticPlanned()`
  returned null while quarters were pending, so a just-filled timeline read as
  NOT DUE and the row vanished under *"Not asked — outside this cycle"* —
  measured on one tactic, **settled 41 asked, pending 40, tick removed 41**.
  `GAP_SCORE_FIELDS`, `pendingScore`, `gapScoreWait`, `gapPendRows/Count`,
  `pendMap`, `pendChip`, `pendTotalChip`, `pendCountLine`, §192's whole walk and
  `checks/pending-walk.py` are DELETED, not left callerless (§24). **The two
  reversed assertions were REWRITTEN rather than deleted**, so a later build
  cannot drift back through them unnoticed.
- **COMMIT THE BOX BEFORE LEAVING (§219):** Islam, on Hala — *"she updated the
  definition of her capability and left and came back didn't find it."* Not the
  save path and not her permission (filling a blank definition is accepted,
  measured): every bound field writes on `change`, i.e. **when the cursor
  leaves it** (§35), and §138's flush sends what is already in the graph. So
  typing and closing the tab wrote nothing at all — no error, because nothing
  was ever entered. §170 closed the debounce window; this is that window one
  step earlier. **`blur()`, never a synthesised `change`** — it is what the
  browser does when focus moves, so a field wired any other way behaves the
  same and one already committed fires nothing. **Not claimed to be her path**,
  and it could not be reproduced from the demo.
- **A CLOSED REPORT IS CLOSED (§220):** *"the submit or the save as a draft
  locks the report and in both cases you can find the button Reopen."*
  **Measured first: nothing was ever locked** — after Submit all 12 figure
  boxes and the note stayed editable, so a report could change after the office
  received it. `REVIEW.parked` joins `submitted` in the authoriser's per-target
  list (parking speaks for the unit exactly as submitting does); **one Reopen
  for both**, and submitting clears a park or Reopen would clear one of two.
  **DISABLED, NOT ONLY DIMMED** — `pointer-events:none` is a look and the
  keyboard walks past it — and **readable**, because reviewing a closed report
  is most of why anybody reopens it. Applied once after the render, so a
  control added later is covered the day it is added. **Cancel becomes Close**,
  a correction not a rename: the handler discards nothing. **Cost stated**:
  Save draft stops meaning *save and keep typing*.
- **SUBMIT IS SHUT UNTIL THE REPORT IS COMPLETE (§221):** two blockers beside
  the three that existed — **`owed`** (rows asked with no figure) and
  **`gaps`** (what the plan still lacks) — all five now said BEFORE the press.
  **THE GAP COUNT IGNORES THE VIEWER**: `gapMap()` is scoped to what the person
  could close (§177), right for the counts they clear and wrong here, or a unit
  head submits past holes only the office can fill because to them it reads
  zero. **`aria-disabled`, NEVER `disabled`** — a disabled button takes no
  focus and the reason opens on hover AND focus (§163); the click handler still
  refuses, so the hover explains rather than enforces. **One list of reasons
  behind both wordings** (`submitWhyShort` for the bubble, `submitRefusal` for
  the banner), or the control and its explanation disagree about why it is
  shut. **And it catches a plan like CF's**: a tactic with no quarters is
  already a gap (§128), so *"3 of 3, Submitted"* can no longer happen.
- **A PLAN TRAVELS ROW BY ROW (§215):** Islam — *"for the business units, when
  you change a small thing it just sends the thing that changed. Is there any
  risk?"* §210 stopped at a top-level part because finer needs arrays matched by
  ROW ID and not by position (§48). **BOTH HALVES OF THAT RISK ARE ANSWERED**:
  every plan row has carried a unique id since §191 (measured — **219 of 219**,
  none missing, none shared), and Islam's own point closed the other — adding,
  removing or reordering a pillar needs authoring rights, which are the office's
  alone (§94), so the two people who share a unit **cannot change which rows
  exist**. **THE LISTS ARE NAMED, NEVER DISCOVERED** (`keyObjectives`, `items`,
  and `measures`/`tactics` inside a pillar); anything else returns null and the
  entry travels WHOLE — *the fine path is an optimisation and must never be the
  only way a change can travel*. **ORDER IS PART OF "SAME ROWS"**, or a reorder
  the authoriser judges by id order (§101) would travel as field edits and leave
  the order behind. **THE SERVER VALIDATES EVERY ROW EDIT BEFORE APPLYING ANY**
  — half a save is worse than none — and §210's blanket depth cap becomes an
  ALLOW-LIST of three shapes, never a general resolver. **27,600 bytes → ~200**,
  though the point is collisions, not speed: two of the office filling ONE unit
  at once now both land. **AND THE HARNESS LIED FIRST**: breaking the guard made
  the differ THROW, the suite died at that trial, and `grep -c FAIL` read ZERO —
  a falsification that looked like a pass. A throw is a failure now, and the
  failure path returns a shape the assertions can still read. **AND THE CASE THE
  FIRST TESTS COULD NOT SEE**: a structural change ALONE falls back by accident;
  one **beside a field edit** is where a new pillar silently never reaches the
  database while the screen shows it. Guards fail 8 / 5 / 2 when broken.
- **THE OVERVIEW OWES NOTHING (§214.4, reversing §214):** Islam — *"for the
  functions that plan with pillars remove the elements of the overview from the
  missing items."* **REVERSED ON BOTH FORMATS, and that is not a widening**: the
  capability side only ever counted the definition because §213 made it one page
  and §53.5 gives one page one answer — counting it on one format and not the
  other is the drift §211 cost a day finding. **STILL FILLABLE**, in
  `GAP_OPTIONAL` (§205, third time in a day: answering *counted* by emptying the
  list the SERVER reads is what refuses a save the screen has offered). **AND
  THE PAGE STOPPED SAYING THE WORD** — a red `Missing` over a count of nought is
  §177 with the sign reversed; `gapCell`'s own `readEmpty` draws the em-dash the
  Weight column beside it already used. **AND A HOLE CLOSED ON THE WAY PAST**:
  `gapMap`'s pending branch asked `GAP_FIELDS`, and §192's own comment says the
  question is whether the field is still FILLABLE — the two lists have now
  parted three times, and `gapCell` draws the confirm tick for every fillable
  field, so the office could not FIND a fill it could plainly see and tick.
- **A SENTENCE NOBODY HAS SETTLED IS A QUESTION MARK ON THE PAGE (§214.3):**
  Islam — *"remove the line that's talking about the Retail aspiration … I will
  think later how to edit it, to avoid any confusion."* The line was
  information rather than a description (1b-ii) and the FACT is still worth
  stating — where a supporting function's aspiration and SWOT live is said
  nowhere else — but it had already been wrong once inside a day (§213.1) and
  sat at the top of a page people are being asked to fill in. Removed from both
  of a pillars function's pages; `whereFoundationLives()` **DELETED rather than
  left callerless** (§24), so bringing it back is a decision somebody makes and
  not a line somebody finds. **RECORDED AS OUTSTANDING** — nothing now says a
  function's strategy is its parent's — and asserted as an ABSENCE, by the
  PARENT'S NAME rather than by the wording, which is the part not settled
  (§94.8). **AND ONE CHECK HELD A NUMBER §214.2 HAD MOVED**:
  `milestone-fill.py` asked for `>= 3` owing places, true only while a
  capability's objectives counted, so a deliberate decision read as a
  regression — it compares the office's map with the bounded role's now. Third
  time this file has recorded a literal outliving its decision.
- **COUNTED AND FILLABLE ARE TWO QUESTIONS (§214.2):** Islam — *"the key
  objectives should not count as missing in the functions in general. The
  definition is OK and the owner is OK, but the key objective specifically
  should not count."* §119.1's rule: a capability with none is judged by its
  projects, a function with none by its pillars, so an objective is an OPTIONAL
  line and an optional blank is not a gap. `capko`'s four fields move from
  `GAP_FIELDS` into **`GAP_OPTIONAL`** rather than being deleted — §205's lesson
  paid rather than repeated, because §187 stopped collaborators counting by
  emptying the one list the SERVER also reads, so the cell opened and every save
  of it was refused. Verified from the module, not assumed. **AND THE PAGE HAD
  TO STOP SAYING THE WORD**: `koReadBlock()` hardcoded a red `Missing` over a
  blank target, so leaving it would print the alarm over a count of nought —
  §177's fault with the sign reversed. An em-dash, which is what the Weight
  column beside it already drew. **A UNIT IS UNTOUCHED** and asserted both ways.
  2 red with the fields put back; 434 server tests still pass, which is the
  evidence the fills still land.
- **A COUNTED GAP MUST BE ONE THE SAVE ACCEPTS (§214):** Islam — *"all the
  overview for the functions planning by pillars should be mandatory and be
  counted as missing."* `GAP_FIELDS.cap = ["def"]`, ONE entry for both function
  formats, because since §213 it is one page and two answers to one question is
  §211's drift. **THE SERVER CHANGED IN THE SAME BREATH**: counting a gap the
  save refuses is §184 exactly — a red chip, a control that opens, a save that
  fails — so the gap pass runs on a clone of the capability ahead of the `def`
  comparison that made it `capPlan`, and on a clone of the FUNCTION in
  `collectFunction()` ahead of the unknown sweep. **`def` STAYS OUT OF
  `FN_KNOWN`**: what the pass does not classify falls through to that sweep and
  is the office's (§42), the safe way round — putting it in would leave a
  non-fill change seen by NOTHING on a pillars function, which is §191. The cell
  is **`gapCell`, never `fieldOr`** (`kind:"area"`), or a fill-grant holder
  meets a read-only line (§61). **"NO OBJECTIVES AT ALL" IS NOT A GAP, and not
  from taste**: a function judged by its pillars legitimately has none (§119.1,
  §187), and **fill mode cannot ADD a row** (§145), so it would be a mark
  nobody could clear. Cost measured: all 8 demo capabilities already carry a
  definition. **AND REMOVING DEAD CODE BROKE A LIVE PATH** — deleting the
  unused `fnOverviewHas()` by slicing between two anchors took `foundKeyFor()`
  with it, so **every clause Add and Remove in the product threw inside its own
  click handler**, business units included: invisible to a page-load error
  listener and identical to a button that does nothing. `plan-builder.py` went
  red, on a UNIT. *Run the whole suite, not the file you edited — and delete a
  named function, never a range.*
- **A SUPPORTING FUNCTION'S OVERVIEW IS A SUPPORTING FUNCTION'S OVERVIEW
  (§211, §212, §213):** three sections on one page, two of them wrong, and the
  record of why is the point. **§211** — Islam: *"pressing on the CON01 22 it
  doesn't take me to the pillars it's stuck in the overview"* — `gapMap()`
  walks a pillars function through `unitLike()` (right, §59) and handed out a
  UNIT's words for the two things not shared: a unit's plan section is `plan`,
  a function's is `proj`, and **setting `CURSEC` to a section the page does not
  have leaves the renderer on its FIRST one**; and the key is `k_found`/
  `k_proj`, which is what made counts read zero for the person doing the work
  while reading right from the office, who passes both. **§211.2 then removed
  the Overview on a probe of `FUNCTIONS[x].foundation`** — a field name that
  does not exist on a UNIT either, so the predicate was false for the wrong
  reason and *false-for-the-right-reason and false-for-the-wrong-reason are
  indistinguishable from outside*. **§212 put it back with a UNIT's foundation
  page**, which was the wrong neighbour. **§213 is the shape**: a supporting
  function inherits its aspiration and SWOT from the unit it plans under and
  never authors them, so it takes the CAPABILITY function's Overview — *What it
  is* (Function · Led by · **Definition**) and *Key Objectives* (Objective ·
  This year · **Weight**) — same page key, same access key, `koReadBlock()`
  lifted out so one table serves both (§53.5, closed by construction).
  **A UNIT IS UNTOUCHED AND IT IS ASSERTED**, at Islam's instruction:
  `renderUnitFoundation()` reverted exactly, §212's parameterisation DELETED
  (§24), and the check measures a unit's page and its whole workbook, because
  *"we did not touch it"* is a claim and not a measurement. **`def` IS NEW ON
  THE FUNCTION** and needs no migration — `functions` names six columns and
  files the rest into `extra`, the route `format` and `under` already take.
  **THE TEMPLATE STOPS ASKING**: no Foundation, Aspiration or SWOT sheet for a
  function, and its Objectives sheet trades the 3-year target for a Weight —
  **a validation range is a POSITION** (§65), so the ranges move with the
  columns or they validate the wrong cells in silence. The reader takes either
  file by HEADER NAME (§58), and `weight` is set only when the cell holds
  something, because `Number("")` is 0 and nought is a real weight (§104.10).
  **AND THE COST IS STATED**: a function's objectives now carry a weight and no
  3-year target, the reverse of before. **AND THE MISSING BAR IS GATED ON
  `secs.length > 1`** — found because §211.2 briefly left one section, and it
  would strip the count AND the fill button from any viewer whose grant hides
  one of two. 10 red on main; and one of the check's own failures was the
  CHECK — `planFromWorkbook()` returns a FLAT array, not `{rows}`, so a working
  round trip was reported broken three ways.
- **THE OFFICE INBOX GOT A THINNER PANEL THAN THE CORNER (§188):** three of
  Islam's four are one omission — §97 built the CORNER against exactly these
  faults and the office's own inbox skipped them. **The caret**: the inbox
  polls every 10s and `drawThread()` rewrites the pane the reply box is in;
  its comment claims the composer is only rebuilt on a person change and is
  HALF TRUE — the value is carried across, the element is replaced regardless,
  which is why it reads as the cursor jumping rather than work lost. Only the
  MESSAGES redraw while the composer has the cursor — never "skip the poll
  while typing", which holds back the thing the poll is for. **The box**: the
  corner's composer has grown to fit since §97; this was the same control with
  the handler missing. `chGrow` is one grower for both (§53.5), wired in
  `drawThread()` because that element is replaced on every person change
  (§29.5). **The pill**: both numbers were right and of DIFFERENT AGES — the
  inbox re-asks every beat, `OVQUEUE` is fetched once per visit (§108.10) and
  was never told the summary stopped being true; replying is the act that
  makes it wrong. The inbox hands the shell its own answer, and the pill is
  rewritten IN PLACE — a `paint()` there would rebuild the reply box, which is
  the fault above. **The tag**: the chase has existed since §97.5 and recorded
  NOTHING; `emailed_to` (033) holds the ADDRESS, never a boolean (§104.7),
  written only when it actually went, and **nothing is backfilled** — Islam
  was offered inference and turned it down.
- **A SEAT IS GRANTED AND NEVER DERIVED (§187):** Islam — *"level smo
  shouldn't be a super user — super user is only granted by the super user in
  the registry, for now."* `personRoles()` read `p.level` (the pre-§33 field)
  beside `p.role`, so a person carrying `level:"smo"` derived **Super user on
  the screen AND on the server** — one function, both sides — and an
  unrecognised key round-trips through `people.extra` untouched. Nothing has
  written it for fifty versions, which is what made it dangerous: an ungated
  fallback nobody was watching, §186's shape again. **The cost is stated**: a
  row still relying on `level` with no `role` loses the seat and is granted
  again on the register, which is where seats come from.
- **A COUNT THAT CANNOT BE QUIET ABOUT ANYBODY (§187):** §186's queue catches
  a seat sitting somewhere other than where its holder sits and is
  deliberately silent about one held BY somebody who sits at the group — a
  hole, measured and stated before this was built. So the register carries
  **"N people hold a seat"**, every holder on the hover. **ALWAYS DRAWN**,
  unlike the custodian chip beside it: a count that vanishes at some number
  cannot be trusted to be complete, and this exists to be the complete list.
  **Quiet, not amber** — the chip beside it is a warning, this is a fact true
  on every healthy tenant, and alarm colours would cry wolf until nobody read
  either (§41, from the other side). Asserted as AGREEMENT with the register,
  never as a number (§94.8).
- **COLLABORATORS ARE NOT A GAP (§187, reversing §145.10):** *"remove the
  missing collaborators as missing items."* A tactic with nobody supporting
  it is a tactic ONE person owns — a complete way to write a line — and every
  one was being counted as owing something. An optional blank is not a gap
  (§119.1, which is why the DECK never marked these). The `owner` stays: a
  line nobody owns is a line nobody can report.
- **THE WELCOME HEADER'S ROLES STACK (§187):** `.whero` was a flex row ALLOWED
  TO WRAP, so two long chips pushed the whole tenant block below them — at
  **every width, 1440 included** (294px → 204px). `nowrap` with a flexible
  greeting stacks the chips INSIDE their column instead. **Below 820 the old
  stacking returns on purpose** and is asserted, so it never reads as a
  regression.
- **THE CHAT INBOX LIST SAYS THE NAME (§187):** §181 shortened the thread, the
  heading and both placeholders and **stopped at the queue** — a different
  builder, and where the office actually looks. Full name to the hover, and
  **the search matches both**, because a typed short name is not always a
  prefix of the full one (§93.8).
- **A SEAT IS NOT AN ORDINARY ROLE (§186):** Islam — *"hussein khaled is a
  custodian and getting the super user … you assured me that it's
  impossible."* **It was not.** The register's role picker is a plain
  `<select>` and §92 grants a ONE-DESTINATION role on the pick — a seat has
  one destination — so the most powerful grant in the product was a single
  `change` event with nothing in between; the people workbook's Role column
  is the same grant by another road. **One line stood behind both**:
  `roleIsGrantable()` excluded only the derived floor roles and said nothing
  about seats. **THE SERVER WAS ALWAYS RIGHT** (a seat move classifies as
  `access`, §89), so the fault was the SCREEN offering what the save refuses —
  and going through instantly for the one person it does not refuse (§42's
  drift, in the worst place). Now: `roleIsGrantable()` asks
  `mayEditAccess()` **of the granter**, so the picker AND the template narrow
  together; and the Super user is **asked out loud**, with the ask NAMING the
  role and what it hands over (the failure mode is landing on the wrong line,
  and a confirmation that does not say which line catches none of them).
  **THE ASK IS STATE IN THE DIALOG'S BODY, never a modal of its own** —
  measured: `openModalHtml()` was painted straight back over by the
  register's own repaint (§116.6); `ROLESTOP`'s shape for `ROLESTOP`'s
  reason. **Cancel restores the picker** or a select still showing the
  refused value fires no `change` (§110). **AND THE REGISTER WATCHES**: a
  seat whose place is not where the person SITS joins the attention queue,
  under a collision and above every gap. **The test is the PLACE, not "holds
  two roles"** — the bootstrap SMO holds super@group AND heads the SMO
  function (§118), so the other reading nags about the one certainly-correct
  row. **Not claimed: who granted it and when** — `change_log` holds that and
  it needs the database.
- **VIEWING AS SOMEBODY IS JUDGED AS SOMEBODY (§185):** Islam — *"Hala got
  this error, when I view as her I didn't get it … the view-as function is not
  showing exactly what people see."* Measured: one edit, judged twice — REFUSED
  for her, ACCEPTED for the office. `/api/state` reads the person off the
  SESSION, so viewing as somebody changed everything the screen DREW and
  nothing the server ACCEPTED: no refusal anybody meets could be reproduced,
  and the office could write through a colleague's view what that colleague
  never could. **The drawing side is faithful** — the three places that read
  the real session are deliberate (the switcher, *Send me a copy*, the welcome
  screen's is-this-me guard). **`SMPRules.actingFor()` is the rule** (§42:
  testable without a database), and it can only NARROW: the gate is the SEAT
  ROLE ON THE SESSION, the simulated person is looked up in the STORED people,
  and an unknown key is REFUSED rather than treated as somebody with no roles.
  **A refusal while simulating says so** (`judgedAs` on the 403 — *"Setup is
  the SMO's"* is baffling when you ARE the SMO). **The remembered refusal is
  per viewer**, or switching back runs into a body remembered under somebody
  else's rights. **The change log still names who SIGNED IN** — authorised as
  them, made by you.
- **A WAY BACK TO THE WELCOME SCREEN (§185):** a house beside the gear, Islam's
  placement. **It does not ride on the gear** — `menuHTML()` returns nothing
  for anybody with no Setup destination, so hanging it there would give the way
  back to the office alone (§61). `WELCOME.open()` keeps only the two silences
  about whether the screen can EXIST (a projector, a file) — pressing a button
  IS the ask — and **never `markDone()`**, or the screen opens itself unasked
  next paint. Wired in `wireMenu()`, because `paintUnits()` destroys that row
  (§29.5); it navigates nowhere, so an open edit survives it.
- **A GLYPH THAT DIFFERS FROM TOFU BY ONE PIXEL PASSES "IT IS DRAWN" AND FAILS
  "IT IS A MARK" (§185):** Islam — *"I dismissed the case but the small mark is
  not there."* §180 proved `◌` was not tofu by asking whether it DIFFERED from
  the tofu rectangle. Re-measured in the font the mark computes to: bullseye
  **53** ink pixels, dotted circle **29**, tofu **28**. §52/§120.2 are about a
  character MAPPED and not DRAWN; this is drawn and invisible. It is **CSS**
  now — a 9px circle, 2px ring, filled waiting / open answered — under our
  control and unable to fall back to another font (§45's colour-emoji answer,
  second place). **The first CSS draft repeated the mistake**: a 1.5px dash on
  a 9px circle rounds to 1px and lays about four marks. Full against empty, at
  the same weight. The check asserts the visible mark, not the glyph (§51.11).
- **A DATE THE PLATFORM CANNOT READ IS A GAP, AND A REFUSAL COSTS ONE ROW
  (§184):** Islam, on the CX strategy custodian — *"they lost all data they
  inputed … and I didn't get them as the SMO."* The refusal was CORRECT:
  `gapBlank("30/09/2026")` is false, so correcting it was authoring, which is
  the office's (§94). **The loss was everything around it** — the whole graph
  posts together, so one refused row failed the whole save, and the only
  control on the banner destroyed the three good fills with it. **`monthsOf()`
  MOVES INTO `lib/rules.js`** as `whenMonths(v, last, cycleYear)` (§130.7's
  shape), because the server had no way to ask "is this a date" and so
  answered differently from the screen — §42's drift. `whenReadable()` asks
  the SHAPE with a year supplied, never a second list of regexes (§53.5);
  `dueFits()` moves onto it too. `GAP_WHEN` is keyed on the FIELD NAME
  (`start`·`end`·`finish` are dates in `GAP_FIELDS` and nothing else), and
  `gapEmpty()` is the ONE test `gapMissing()`, `gapCell()` and the
  authoriser's gap pass all ask. **`blank` AND `open` STAY APART** — the row
  opens to a filler AND still shows `30/09/2026`, or the fix hides the value
  somebody is being asked to correct (§96.2). **THE VERDICT CARRIES AN
  ADDRESS**: `refused: [{why, kind, target, rows:[{id,name,field,had,from}]}]`
  beside the unchanged sentences, so the banner names the lines and offers to
  **put back those and save the rest**; Discard stays but is never the only
  control again. **`splitRows`' plan half names its rows**, with `planMoved`
  unchanged as the gate — deriving it from the rows would WIDEN what is
  allowed, because a key-order difference (Postgres jsonb, §145) trips the
  omit-compare and produces no differing key. **`had` separates held-null from
  key-absent**, or the put-back is a change of its own and is refused again.
  **The address is target + row id, never a path** (§48); an `fn:` target
  resolves to the function AND its capabilities. **`undoable` is the SERVER's
  answer** (§42), and a change to WHICH rows exist offers no button at all —
  one that cannot work is worse than the destructive one. Nothing stored,
  nothing migrated.
- **THE STRIP KEPT ITS OWN ANSWER, AND THE CONTROL BESIDE IT HAD IT RIGHT
  (§178):** the *Viewing as* note read `p.unit` and nothing else — never `p.fn`,
  never `p.company` — so **9 of 33 people were told they belong nowhere** (every
  supporting-function person, both company CEOs) while the DROPDOWN six pixels
  left said the function's own name, because §142 built it from
  `placeLabel(personAt(p))`. §53.5 in the chrome. **The copy goes**; one builder,
  `viewerRoleLine()`, beside `placeLabel()`. **And the place belongs to the ROLE,
  not the person** — 10 of 33 hold roles in more than one place and the line named
  one for all of them; read off `personRoles()`, never `roleWheres()`, which falls
  through to *every unit* for a derived role (§175, the source of the reported
  *ALL UNITS*). **THE SELECT CARRIES THE SEAT, SO THE LINE DOES NOT REPEAT IT** —
  a role held only where the person sits is named without a place (379px at its
  widest, against 487px for the shape that repeats it); a role held ANYWHERE else
  is named; a role held in SEVERAL names them all including the seat, or it reads
  as held only elsewhere. **No role, and stop** — repeating the seat there would
  be the one place the line said twice what the select had already said.
  **The strip clips below ~1280 and cuts the TAIL**, which is the place, so the
  whole line goes on a hover (§88's shape) — set directly, because `clipTitles()`
  is scoped to the setup tables. Asserted of EVERY active person (the fault was
  invisible on exactly the nine nobody switches to) and as AGREEMENT with the
  rule, never a literal; **both ends, and the register must hold an example of
  each** (§113.8).
- **THE PAGE SAID MISSING AND THE COUNT SAID NOTHING WAS (§177):** a project
  pane prints the red word in two places the fill grant could not see — an
  **outcome with no target** and a **milestone with no due date** — and a
  milestone with no OWNER printed an em-dash, the platform's word for *absent*,
  which says nothing is owed. So a project owner given *Fill gaps* saw three
  red Missings, a gap total of **0**, and no control at all: **the product's own
  vocabulary disagreeing with the one feature named after it.** All three join
  `GAP_FIELDS`; a **deliverable** deliberately does not (its direction and
  target are written FOR it, §104) and the check asserts that absence.
  **THE DUE DATE IS PICKED, NEVER TYPED** — a month and a year (`Jul 26`),
  because every comparison the product makes is monthly (`monthsOf`,
  `dueThisCycle`, `shiftWhen`) and a day is precision it cannot use. Measured
  first: `24 Jul 26` reads, fits and shifts; **`24/07/2026` reads as null in
  all three**, which is what a free text box would have collected. The panel is
  **`position:fixed`** or `.tblscroll` clips it to a strip (§45.5, reproduced in
  the mockup before a source was touched), mounted on `<body>`, and
  `MONTHPOP.shut()` runs at the end of every paint beside `SEARCHSEL.wire()`.
  Nothing is lit until something is set (§15.1); **Clear** puts the row back to
  Missing; **dates already written are untouched**, and the stated cost is that
  a quarter can no longer be typed into a milestone's due date, in the pen
  either (§53.5: one control, one answer).
- **THE BAND'S BUTTONS WENT NOWHERE, FIVE WAYS (§177.2):** Islam — *"the CUS01
  3 button just opens the project and the next gap does nothing."* Each fault hid
  the next. **The walker asked for an element TYPE** (`.fld.gapfld`), so §177's
  month picker — a button — was invisible and a project owing only due dates had
  nothing to walk; the marker is **`.gapwalk`**, carrying NO styling, because
  *this control fills a gap* and *paint it red* are different facts and merging
  them restyles the office's pen to fix a button. **An author's fields were never
  marked at all**, so Next gap had never worked for the office, on units either.
  **It used `document.activeElement` as its cursor** and the press moves focus to
  the button — and the cursor is marked on the WALKABLE element, never the lit
  one, because a §130.1 picker rings its `.ssbtn` SIBLING (§34). **It asked
  `RAIL`**, which holds only what somebody PICKED and is empty on a page nobody
  clicked while the panes are plainly there — `RAIL_SHOWN` is the resolved answer,
  written where the resolving happens (§53.5) and reset beside `FIELDS`. **And a
  chip lit the first gap on the PAGE**, which on a function's projects page (every
  capability drawn at once) belongs to another pane — `data-gplace` carries the
  chip's own rail-and-code pair, one builder for both. **Crossing places skips by
  SAME PAGE, not by VISIBLE**: a project can be on screen and never walked,
  because the field list is scoped. Landing is queued behind `setTimeout` (§30.1).
- **THE GRANT IS PER PAGE AND THE REACH IS PER ROW (§177):** Islam — *"the fill
  grant should be for his project only he is not a cutodian."* There is no
  per-project cell and there should not be one, so `mayFillRow()` is
  `mayFillPage()` plus §147.7's `boundedReach()`, narrowing only when EVERY
  role granting fill here is a bounded one. **Applied to a pillar owner too**,
  unasked: the rule is about bounded roles, not about projects (§53.5). A gap
  inside no row falls out closed on its own, and **`gapCell` defaults its
  context to "inside no row"** — the safe way round, §42 in the small.
  **`gapMap()` counts only what this viewer could close**, or the red button
  promises a field it will not open (§61). **No migration**: the mark rides
  `extra` on `outcomes` and `milestones` — claimed, then proved by writing one
  of each against a real Postgres and reading it back (§172). The server's
  `gapRows()` reaches those rows BEFORE `splitRows` compares them, or a fill
  falls through to `capPlan` and is refused as authoring; its `ctx` is built
  from the **stored** graph (§42). Proved able to fail three ways — 13 on the
  screen, 5 on the server, and **the two REFUSED cases go green the moment
  `mayFillRow` is swapped for `mayFillPage`**, which is the only proof that
  matters when a pre-change build refuses everything anyway.
- **WHO OWNS EVERY PLACE WAS TWO LISTS AND THEY DISAGREED (§175):** `roleOwns()`
  said super and gceo; the matrix's `notApplicable()` said super and gceo; and
  **neither said `smoteam`** — so an SMO team member owned nothing, read
  `a_unit_other` for every unit, and their four *own* cells could never be
  consulted. It also left §89's claim untrue: that row is meant to carry the
  Super user's grants and the two read DIFFERENT columns. One exported rule
  (`ownsEveryPlace`) is asked by both sides now. **SMO team joins them at
  Islam's direction** (*"in case the SMO team is from inside the company as
  well"*): nothing moves on a default tenant, and one that had NARROWED the
  other-columns widens for its SMO team — stated, not discovered. **Both CEO
  rows were already right**, and the question about them is what found this.
- **ASSERT THE AGREEMENT BETWEEN THE RESOLVER AND THE TABLE, NOT A LIST OF
  PAIRS (§175.2):** for every role, which columns can `areaFor()` ever answer
  with, and does the matrix offer exactly those? Offered-and-unreachable is a
  control with nothing behind it; reachable-and-not-offered is access nobody
  can grant. Two traps: **a unit page asks the unit areas and a function page
  the function ones** (crossing all of them made a function head look as though
  it reached `a_unit_own`), and **`roleWheres()` is not the authority for a
  DERIVED role** — it falls through to "every unit" for `powner`, so their
  places come from what `personRoles()` mints. A role nobody holds is named as
  unmeasured, never passed over (§54.5).
- **A COLUMN A ROLE COULD NEVER HOLD IS AN OPTION THAT MEANS NOTHING (§174):**
  Islam: *"a project owner has options to edit or fill in a business unit."*
  Right, and the DERIVATION is what says so — `personRoles()` mints `powner`
  only from `capabilities[].projects` and a capability belongs to a FUNCTION,
  so the own-BU columns can never be theirs; the same look found the mirror
  (**a BU owner** can never hold an own supporting function, `fnhead`'s §117
  exclusion with the sides swapped). The OTHER columns stay — every unit is
  "other" to somebody holding none. Defaults were already `none`, so nobody's
  access moves; **what goes is being offered a choice with nothing behind it.**
  **AND ONE OF THE TWO EXAMPLES WAS WRONG AND IS SAID SO**: a `plowner` IS
  derived on a function whose `format` is `"pillars"` (§59), so that cell stays
  and the check asserts it stays — a build that dashed the whole table would
  otherwise satisfy every assertion about absence (§113.8).
- **A TWO-ROW HEAD PINS AS A `thead`, NOT AS CELLS (§174.1):** pinning the
  cells needs a second `top` for the lower row measured off the upper, which is
  §130.10's hole between two pinned things; a sticky `<thead>` moves as one
  block on one offset. **§163.5's argument survives**: it forbids pinning to
  the PAGE from inside an `overflow` box, not pinning to the BOX — so the box
  takes a height (`.panefill`, the register's own expression since §69.19) and
  the head pins at its top. **The first build guessed 52px for the legend and
  overran the window by 5px** — §122.5's fault committed while quoting it.
- **A REFRESH IS NOT A NEW SESSION (§173):** §94.6 decided where a SESSION
  opens (where the person works); a RELOAD had never been asked about and was
  landing people back on their own unit. Remembered in **`sessionStorage`**, so
  tomorrow's sign-in still obeys §94.6 — `localStorage` would silently reverse
  a decision nobody asked to reverse. **The place, never a mode** (§63.1), and
  the remembered destination is CHECKED against what this viewer can reach, or
  a revoked role opens an empty frame.
- **A CHECK CONSTRAINT IS A COPY OF A RULE IN ANOTHER FILE, AND NOTHING
  COMPARES THEM (§172):** §145 gave the Strategy cells a third state, `fill`,
  and `db/schema.sql` went on saying `CHECK (grant_ IN ('none','view','edit'))`
  — so granting Fill gaps threw in Postgres and `/api/state` answered **500**.
  **And it did not stop at that save**: the whole graph is posted every time,
  so the refused value stayed in every later payload and EVERY save of EVERY
  page failed from then on, which is why it reads as "nothing saves".
  **§94.2 with the sign reversed** — the seed grants no `fill`, so the round
  trip had never once offered the fourth value to the database while four
  layers agreed about it. The test now writes one grant of every value in
  `STATE_RANK`, read from the shared rule rather than listed, so a state added
  tomorrow is exercised that day. **Widening a value list is a migration**
  (030), idempotent, and backfills nothing — no stored row can hold the value
  the database was refusing.
- **A FAILED SAVE MUST SAY SO, AND THREE OF THEM DID NOT (§171):** §32 made a
  REFUSED save speak and stopped; a save that FAILS wrote one line to
  `console.warn`, so a 500, a dropped connection or a timeout looked **exactly
  like a save that worked** — screen updated, database not, next reload
  reverts. Closed: a server error names its **status** (500 sends you to the
  server, "could not reach" to the network — §123), and **a remembered
  refusal** was the truly silent one, because `save()` short-circuits on
  `refusedBody` and never reached the branch that draws the banner — set a
  cell, be refused, set it back, and there is no post and no message. Demo mode
  says it at the moment of the change, not only in the standing banner.
  `file://` still says nothing, deliberately. **AND A DIAGNOSTIC IS NOT A
  FIX** — say which it is: this makes an invisible failure visible, it does not
  claim to have found the cause.
- **A DEBOUNCE IS A DATA-LOSS WINDOW WHEN THE FLUSH CANNOT REACH IT (§170):**
  `afterPaint()` waited 800ms, and §138's flush-on-leave was supposed to cover
  that — **`keepalive` caps a body at 64KB and one SMP save is 216,307 bytes**,
  so over the cap it is a plain fetch the navigation cancels and the net has
  never once caught anything. Press a cell, refresh 150ms later: lost, on every
  page. It is a **leading-edge debounce** now — the first change of a burst goes
  at once and the trailing timer still runs — so one press is durable
  immediately and five presses cost two POSTs, not five. **In `afterPaint()`
  and nowhere else**: every writer ends in `paint()` and every `paint()` ends
  there, so a control added tomorrow is covered and there is no list to forget
  (§104.7). Typing is untouched — a field writes on `change`, i.e. on BLUR
  (§35), so a keystroke never reached it. *A limit stated in a comment is not a
  limit anybody has measured the product against.*
- **A STUB FAST ENOUGH TO BE CONVENIENT IS FAST ENOUGH TO HIDE A RACE
  (§170.2):** the first version of the new trial reloaded 150ms after a change
  and asserted the POST arrived — and **passed on the broken build**, because
  the stub answers in under a millisecond while a real server parsing 216KB and
  writing thirty tables does not. §94.5. Assert the property the harness can
  honestly see (**on the wire inside 250ms** — 0 posts on the old build), and
  put the reproduction of the LOSS where it can happen: the dev-server and a
  real Postgres, reading the row back rather than the screen.
- **A STICKY BOX WITH NO TRAVEL IS NOT STICKY, AND THE PAGE HAD 60px OF SCROLL
  IT DID NOT NEED (§167):** `.setuprail` is `position:sticky; top:97px` and on
  a page where the rail is the TALLEST thing in its row it never pins — a
  sticky element cannot travel past its containing block, so the rail scrolls
  away with the page and takes its own pinned head and search with it (measured
  on the Inbox at 1440×760: rail at y=37, head at y=38, chrome ending at 75).
  **§135.9's eleven-window measurement was true and was of the wrong element.**
  And the scroll that did it was a **guessed constant going stale** (§122.5,
  third time): `.wrap` ends the page with `padding-bottom:80px` while the rail's
  cap, `.panefill` and `.chinbox` each reserved **20px**. **RESERVING 80 IS THE
  WRONG WAY ROUND and the check said so** — six failures on §122.5's assertion
  that the register's table REACHES the fold, correctly, because 80px below a
  box already sized to the window is an empty band you have to scroll to see.
  So the foot is TWO numbers: `--page-foot:80px` for a page of content,
  `--pane-foot:20px` for a page whose content is capped to the window, with
  `.wrap:has(.setupsplit)` letting the page ask (§114.4's shape). Below the
  floors (rail 260px, box 340px) the page scrolls again by design.
- **§148's WELCOME SCREEN BLINDS ANY CHECK WRITTEN BEFORE IT (§167.2):**
  `.welcomeover` covers the viewport, so `elementFromPoint` returns it and
  every click is intercepted. `checks/office-chat.py` had been failing on *"a
  click at its centre reaches the bubble — DIV"* and that was **recorded as a
  product fault** because it reproduced on main; `checks/register-header.py`
  reported every control on the header row unreachable at four widths. Both
  suppress it as a RETURNING viewer does, **in an `add_init_script`** — setting
  the flag after `goto` is too late — and neither reaches into the overlay: the
  welcome screen has its own check. *A finding that reproduces on main is still
  a guess about the cause.*
- **THE COLOUR IS THE BAND'S KEY (§168):** a band's `key` is read as a CSS
  token (`var(--good)`, `.pill.good`) AND by `needsNote()`, which asks for an
  explanation on `bad` and `warn` — so picking a level's colour is not
  decoration beside its key, it IS the key, and picking red is what makes that
  level one a reporter must explain. Five to choose from and deliberately no
  sixth: a colour the product does not paint renders as nothing. A new level
  goes above the bottom one at half the floor above it (descending by
  arithmetic, never by hoping somebody types in order) and takes an unused
  colour; **removing one puts the 0 floor back**, or a figure of 12 belongs to
  no band; **two is the floor and the reason is said** (§59). `bands` is keyed
  on `idx` alone, so any number of levels and two sharing a colour both
  round-trip — proved against a real Postgres.
- **ABSENT IS NOT ZERO WHEN A SETTING IS A NUMBER (§169):** `Number(null)` and
  `Number("")` are both 0 and both finite, so clamping alone answered ONE
  MINUTE for every tenant that had never set the away threshold — §104.10's
  trap in a second place. Test for absence before reading the value as a
  number. **And a number is a third type in `chatSet()`** (§104.7): `!!value`
  would have stored `true` for every minute typed, and the clamp is asked
  through a ONE-KEY OBJECT rather than by naming `away`, so it stays true of
  the next number setting without anybody remembering to come back.
- **THE FLOOR IS NOT A ROLE, AND IT MUST BE READ AS ONE (§93):** Islam:
  *"anyone with no role is employee — employee doesn't give the person anything,
  so let's remove this strange role."* It was never granted; §55 DERIVED it, so
  the register drew a chip nobody could take off a row that held nothing.
  `personRoles()` returns `[]` now and the picker does not offer it — but **what
  somebody with no role may open is still the client's to answer**, so it is
  still a matrix row, titled *Everyone else* and marked as not a role, **stored
  under the key `employee` it always had** (a saved map is merged with the
  defaults, §30.2 — renaming the key is a migration for a word nobody reads, and
  would reset every tenant that had tightened it). **`rolesOrFloor()` IS THE ONE
  LIST**: putting the fallback in `grantIn()` alone left `editingRoles()` walking
  an empty array, so `onlyOwnLines()` answered false and a floor person given
  edit could rewrite their unit's WHOLE plan — wider than a Contributor, which is
  the opposite of a floor. `OWN_LINES_ONLY` carries the floor beside `contrib`.
- **EDITING KEEPS ITS HEAD, AND THE NAME GETS THE LINE (§194):** Islam —
  *"when I edit a plan or a pillar it loses its design and the name box becomes
  very small … and on editing we still need to maintain the pillar Code and name
  fixed so on scrolling down I can still see that save button."* Measured on
  Mobile's plan at 1500px with the pen open: the name box **228px in a 1225px
  pane** (19% of the line), and at 480px of scroll the code, the name AND the
  Done tick all off screen (top −211). **"Loses its design" is exact** —
  reading has pinned `.pane > .pband` since §53.7 and editing, which REPLACES
  that band with `.ptitle`, pinned nothing: the mode you WORK in was the one
  that lost the page's identity. `edhead` is a marker, not a style; reading's
  band is untouched (§53.5: two modes, two questions) and the editing head
  takes **the same sticky offset**, so switching does not jump. Same window,
  so the same two answers as the band: an **opaque ground** or rows slide
  through it, and the `::before` filler for the strip above (§53.7).
  **NOT a negative margin** — §121.2's fault is a NON-sticky row pulled under a
  pinned one; this whole row pins, the pen included. **The name had no width to
  grow into**: §189 made it a growing box and the code and box shared an `h3`
  in a shrink-to-fit column — the column flexes now and it is **228 → 1101px**.
  *A growing field in a container that does not grow is a fixed field.*
  **AND THE NOTE BAR IS HIDDEN AT ISLAM'S CHOICE** (*"hide the note bar for
  now"*), with the cost recorded: `sub` is still stored and renders NOWHERE, so
  a value that arrived with an upload can no longer be corrected from any
  screen — §61's trap, entered deliberately and reversibly. The builder is
  deleted, not commented out (§24). `checks/plan-edit-head.py` asserts the box
  as a **ratio of the pane** and never a pixel count (§94.8): **10 red** on the
  build before.
- **A REPLY SAYS IT WENT AS SOON AS IT HAS GONE (§193):** Islam — *"the
  messages are sent in the box but still there is sending.."*, with the reply
  plainly IN the thread above it, then correcting the diagnosis mid-fix: *"the
  reply back of the sending came back it just takes a long time."* **That
  correction is the whole of it**: the server STORES the reply and then EMAILS
  it and answers only when both are done, so *Sending…* stood for as long as a
  mail provider took over a message already delivered. **The thread is the
  evidence and it was on the same screen the whole time** — it is asked once at
  1.2s and the word becomes **Sent.**; the request's own answer then upgrades
  it to **Sent, and emailed to …**. Measured against an 8-second send: 0.3s
  *Sending…*, **2s Sent.**, 8s the emailed sentence. **AND `post()` HAD NO
  TIMEOUT AT ALL** — a request that stopped coming back left the word standing
  for ever; there is a clock now in the ONE place every chat request goes
  through (that function's own reason for existing). **A timeout is not a
  failure and is not dressed as one** — *"the reply may still have gone — it
  appears above if it did"*, not red (§123: *it did not send* and *we do not
  know* send somebody to two different places) — **and it can never take back a
  `Sent.` the thread has confirmed**, or the backstop would replace a true
  sentence with a doubt at 25s. §188's body-only redraw froze the footer's one
  non-control line, so the note is written into the node there too (§63). **The
  stub was lying and it cost a wrong diagnosis**: `api/chat.js` returns a
  thread's fields at the TOP LEVEL and the first stub nested them, so every
  reading said 0 messages and the product looked broken when the stub was
  (§100.3).
- **THE HOUSE LEADS THE ROW (§193.2):** Islam — *"move the home screen to the
  top left for all people so it becomes their home in general."* It sat beside
  the gear, and the gear is the SETUP door, which is the office's — so the way
  back to your own starting page kept company with a control most of the
  register never sees (§185 refused to hang it OFF the gear for that reason;
  this finishes the thought). `chromeActsHTML()` splits: the house leads with a
  separator AFTER it, the gear trails with one BEFORE, and neither draws its
  separator when its own button is absent, or the row ends in a hairline
  attached to nothing (§24). Both stay outside the scroll region (§136).
  Measured: a unit head, who has **no gear at all**, now reads
  `HOME · | · Group ▾ · [destinations]` — the case that makes the move worth
  making.
- **THE GAP WALK WALKED WHAT THE COUNT NO LONGER COUNTED (§192.4):** *"Next
  gap"* on a unit reached two of five places and the run ended — **and it was
  never stuck**: traced press by press it walks every field it has MARKED, and
  in that pillar it had marked **six** while the band counted **one**. Five
  were collaborator pickers. **§187's other half**: that section removed
  `collaborators` from `GAP_FIELDS` (*"remove the missing collaborators as
  missing items"*) so the counts stopped including them, and the walker does
  not read `GAP_FIELDS` — it marks any blank fillable cell. The count moved and
  the walk did not, so every press was spent on rows nothing was asking about
  and the presses ran out before Foundation, Objectives and two more pillars.
  **The count and the walk are one list (§116.2) and they had stopped being
  one.** `SMPRules.isGapField()` is the test, asked of the WHOLE table rather
  than of one kind — the cell builder is shared and is not told which kind of
  row it draws — and the union fails in the SAFE direction (walking one extra
  blank is a nuisance; skipping a real gap is a miss). **`gapfld` is untouched**:
  whether a cell is FILLABLE is a separate decision §187 did not make.
  *Reproduced on `origin/main`'s own build first, so it was known not to be
  the change beside it.*
- **THE PENDING COUNT SAYS WHERE, AND WALKS YOU THERE (§192):** Islam, as
  the SMO — *"I'm getting this badge but I don't know where they are — I think
  we need a flow like the filling to take me through the confirmation areas so
  I can confirm."* **IT WAS ON THE WRONG ROW, UNDER A BUTTON**: `.pband`
  reserves 76px (two pen glyphs) and the fill grant's control beside it is a
  WORDED button of 127–184px — **160px of overlap reading, 110 filling**,
  measured; the check reproduces it on the previous build as *['5 awaiting
  confirmation', 'Review pending · 5']*. A reserve kept in step with somebody
  else's wording is a guessed constant (§122.5), so the answer is not a bigger
  number. **AND THE NUMBER WAS NEVER THAT PILLAR'S** — `gapPendCount()` counts
  the whole SUBJECT, and the totals row above the pane is where the subject's
  counts already live; Islam picked that placement from two drawn options, and
  the collision goes with it by construction. **THE WALK IS THE GAP WALK'S
  OWN** (§16.7: a count that cannot take you to what it counts makes work;
  §177.2's fault on the other half of the same feature), and **`pendMap()` is
  `gapMap()` counting marks** — one navigation, or the two drift (§53.5); a
  mark is counted only for a field that kind still HAS, or it walks to a tick
  that is not drawn (§61, and §187's retired collaborators are exactly such a
  mark). **The gate asks the SUBJECT, never one page key** (`u_plan` on a unit,
  `k_proj` on a function). **AND THE BUG WAS TWO FUNCTIONS SHARING A NAME**:
  the bar's new chip was `pendChip(n)` and `pendChip(acKey,row,field)` already
  existed — the per-value mark carrying the office's confirm tick, called from
  six places — so a declaration hoisted over its twin and **every confirm tick
  in the product stopped being drawn**, silently (§56.7). *Found by driving it.*
  `checks/pending-walk.py`: 14 red on the previous build, and that count is
  only honest because the check reports a missing thing rather than crashing on
  it (its first run died and reported 2).
- **A LINE THE PLATFORM CANNOT NAME IS NOBODY'S TO CHANGE (§191):** the
  authoriser matches plan rows BY ID; `byId()` drops a row with none — rightly,
  two rows sharing `undefined` are not one row — and the loops that walk those
  maps then found **nothing to classify**, which reads as *no change* and was
  ALLOWED. Measured on the shipped build: with the ids stripped a **view-only
  unit head** could rewrite a key objective, a pillar, a measure, a tactic and
  a project's front matter. **§42's promise that an unclassified change is the
  SMO's, failing OPEN in the one place it was not kept.** **THREE STATES, each
  unjudged its own way**: no id; a NULL id (`byId` keeps it under the string
  `"null"`, so a whole list collapses onto one entry); and a DUPLICATE (§96.2
  from the other end). **THREE WALKS** — `splitRows`, the pillar list and the
  project list each build their own maps, so guarding the shared one closed
  three of four cases and **the sweep found the other two**: *a fix that closes
  three of four holes is exactly the kind that gets trusted.* The rule is
  **judge the list as a whole** — byte-identical costs nobody anything,
  anything else is the office's — and **never by position** (§48). The gap pass
  stops too, or it would clear one row's change while crediting it to another.
  **AND THE SHIPPED DATA WAS SWEPT**: every plan line carries a unique id except
  the group's own six (§96.4's recorded omission), which **nobody could ever
  have exploited** — the group's strategy is refused wholesale by another rule —
  so minting them removes the one list the guard would otherwise refuse, and
  gives a snapshot six rows it can tell apart. Migration 034, in `koSettle()`'s
  own `group-KO<n>` spelling, **continuing past the highest already present**:
  the first draft numbered from `idx` and would have minted a name an existing
  row was holding — a duplicate, which the new guard treats exactly like a
  missing id, so *the migration would have caused the very thing it exists to
  remove.* Found by driving it against a real Postgres 16, in four states.
- **AN ATTENTION ITEM YOU CAN ANSWER, ON THE BOX IT IS ABOUT (§190):** Islam
  — *"attention items that stays attention item is a problem always give me the
  option to dismiss and make gnerally the dismiss under the box with the issue
  and mark the issue box with some sort of surrounding outline."* Four of the
  seven kinds are answered by editing a field; **three were a life sentence**
  — a seat somebody meant to give, a row that never signs in, two people who
  really are two people (§87) — counting on the button, the Overview and the
  welcome screen for ever with no data to change that would clear them, and **a
  count nobody can get to zero is one people stop reading**, which takes the six
  that matter down with it. **A DISMISSAL REMEMBERS WHAT IT ANSWERED**:
  `attnMark()` fingerprints the FACT (which seat over which place, which
  address, which collision) and the item returns the moment it changes, so
  dismissing *"they hold Super user"* says nothing about the NEXT seat
  — §186's whole reason, and §180's rule applied to every kind at once.
  **Stored as an ABSENCE** (§50.6) riding `people.extra`, so **no migration**,
  and **filtered in `attentionOf()` alone** — the queue, the count, the button,
  the Overview row and the welcome screen all read through it (§116.2: one
  list). **The server needs nothing**: a non-seat, non-removal change to a
  person's row already classifies as `setup` (§42's fall-through). **§116.2's
  BAND GOES** — it said what was wrong above nine boxes and left you to guess
  which, worst on the two items that name a place, and it was the QUEUE's alone
  so *Edit details* said nothing at all; the sentence sits under the control
  that answers it, inside a ring on the WHOLE field (the label is what names the
  box) in the WARNING ground, because outstanding is not broken (§168). **A
  kind no field answers is SAID, never dropped** — *no password* is answered
  from the header's menu, so it takes a block of its own (§61). **A declaration
  keeps its own control** (§180) and gains the ring and no second Dismiss
  (§53.5). Proved able to fail: **21 red**; and two of the check's own first
  failures were the CHECK — **the stub answered the wrong action names**
  (`sync.js` asks `passwordStates` reading `j.states`, `declarations` reading
  `j.said`), so both fell through to `{ok:true}`, the client stored `{}` and two
  kinds were reported as not raised by a build that raises them perfectly.
  *Read an action name out of `sync.js`, never guess it — `people-dialog.py`
  carries the same two typos and its `said` assertions have been passing over an
  empty map since the day it was written.*
- **A DASH MEANT "WE NEVER ASKED" (§93):** *"the password status is all dash now
  … some people already changed the passwords."* Nothing was lost —
  `credentials` is its own table outside the TRUNCATE (§69). The fetch was gated
  on `[data-edit="people"]`, **the page's old edit pen, removed by spec 012**, so
  `PWSTATES` stayed null and null renders as the dash meaning *not asked yet*
  (§35). It is gated on the register itself now. **And a failed ask is not an
  answer**: it stores `{__error}`, the column says *unreadable* with the reason,
  and the "N with no password" count refuses to count over it — counting an error
  as absence reports everybody as having none. **§51.11 from the other side**:
  that rule watches for CHECKS holding a removed selector; this was the PRODUCT
  holding one, and it fails the same way — silently, in the safe-looking
  direction.
- **ONE LINE, AND THE PAGE'S CONTROLS ARE ON IT (§130):** §121.2 pinned the
  page's NAME and deliberately left the controls beneath it — because a
  negative margin pulled that NON-sticky row up and scrolling slid it out
  (**a sticky box may only overlap something that pins with it**). That
  forbids the FAKE move, not the move: the controls go INSIDE `.setuphead`
  now. **`PAGE_TOOLS` and `PAGE_ACTS` are `PAGE_TITLE`'s two siblings** —
  reset by the shell before the page renders, read after it — because the
  shell draws the header and the controls are produced deep inside each page's
  render. **The `SMO` pill and the count chips go from every page**, including
  the two Islam did not name: the chrome says who you are and the table IS the
  count, and a pill surviving on two pages after leaving eight reads as a
  mistake. **`alerts` is what survives and is not the same thing renamed** —
  "10 names" is the list, "3 names on people and not on this list" is
  something outstanding. **The quick filters and the row count go** (his call),
  and **nothing is hidden by it**: every row carries `data-tkrow` and every one
  is drawn, so the chip narrowed a view and never revealed rows. `TKFILTER`,
  the chip markup, its handler and `[data-tkcount]` are DELETED (§24).
- **A BAND CANNOT BE A LIGHTER SHADE OF THE STRIPE (§130.8):** the marking
  table's band was `--surface-2` (#EFF2F6) against a `--zebra` of #F5F7FA — six
  points on one channel, and Islam read them as the same grey. Reaching for
  §99's `tr.dxband` kept one vocabulary for "a band inside a table" (§53.5) and
  **Islam turned it down** — *"the band should be darker grey not navy"* — and
  he was right twice over: it wore the SAME navy as the `<thead>` directly above
  it, and it was what leaked through §130.10's slot and read as a second header.
  **A shared vocabulary is worth having and is not worth two confusions.**
  `--line` is the step that exists (#D6DCE5 / #333A45, so it tracks the theme
  without a literal, §25) and `--ink-2` on it is 6.49:1 light, 7.0:1 dark.
- **A GUESSED CONSTANT BETWEEN TWO PINNED THINGS IS A HOLE (§130.10):**
  `--sethead-h` was the literal `46px`, and §130 changed the header's height by
  putting the controls in it — 42px on some pages, 49px on others. So a table's
  head pinned **4px below** the page header, and **four pixels between two
  things that do not move is a slot scrolling rows show through**: measured, a
  4px leak at y=152, and what leaks is a BAND, which is why it reads as a second
  header. §122.5's fault, reintroduced by the change that moved the controls.
  **A better constant could not have been right** — the header WRAPS, so its
  height depends on the window too — so a ResizeObserver publishes it, the way
  `--chrome-h` already is. **NOT §28.3's loop**: it feeds a sticky OFFSET and
  nothing else, and an offset cannot change the height it was measured from.
- **A SAMPLED SEARCH FOR A SYMPTOM FINDS THE FAULT WHEN IT IS LUCKY (§130.10):**
  the check for the above swept scroll positions in 20px steps looking for a row
  showing through, and **passed on the deliberately broken build** — a 4px slot
  only shows something when a row happens to be crossing it. Measure the CAUSE
  (the gap), and only **while the head is actually pinned**: the second attempt
  measured at a fixed scroll and reported 50px on a page that was fine, because
  a short table's head is still in flow there. And **put the state back first**
  (§94.2) — an earlier section had left the focus page on a function with two
  rows, and a page too short to scroll has a head that never pins at all.
- **PINNED TWICE, AND ASSERTED ONCE (§130.9):** asked (twice) to make the rail's
  `SETUP` bar and search sticky, the honest first move was to MEASURE — eleven
  window sizes, four scroll positions, the list scrolled internally: 96px and
  136px every time, on this build and main's. It was already true and had
  **never been asserted**, which is why "already true" was only ever something a
  throwaway probe could say. `.rhead` and `.railfind` are sticky inside the rail
  now as belt and braces — a no-op wherever the cap applies, and the difference
  between holding and not in the two states it does not reach (a browser without
  `100dvh` drops the whole `max-height`; below 900px the rail stops being a
  column). The search's offset is the head's **measured** height, or it pins
  under the bar in exactly the state the fix exists for.
- **`.acgrid` IS A SCROLL BOX, SO THE PAGE OFFSET WENT INSIDE IT (§130.2):**
  *"check the table as the design is damaged."* `overflow-x:auto` makes the BOX
  what a sticky head pins against, so §121.4's 141px page offset pushed the
  Roles & access header **141px DOWN inside the table**, onto rows three and
  four — all twelve cells at one position, measured. **The exact fault §121.4
  wrote down about the register, on the one table its exclusion forgot.**
  `position:static`, not `top:0`: nine rows scrolling the page by 60px buy
  nothing from a sticky head, and this head is TWO ROWS with cells spanning
  both. **The damage was hiding §117's group headings** — *Own business unit*
  and *Own supporting function* — unreadable since the split shipped.
- **A TABLE ROW HAS NO BOX ONCE ITS CELLS ARE POSITIONED (§130.7):** the check
  for the above measured `tr.getBoundingClientRect()` and **called the broken
  build clean at three scroll positions**, because the row went on reporting
  the un-stuck layout while every `th` had moved. Measure the CELLS. Two more
  in the same file: a chip assertion scoped to where the chips had MOVED TO
  passed on a build where they were alive one row lower (§113.8's blind spot),
  and the page had to be given something to SCROLL — at 1560×900 that matrix
  scrolls 60px, so three measurements were of an unscrolled page (§94.2).
  **33 failures against the previous build** before the green was believed.
- **FOCUS REACHES SUPPORTING FUNCTIONS, IN BOTH SHAPES (§130.5):**
  `focusBands(key)` is ONE builder — a unit's key objectives and pillars; a
  **pillars** function's through `fnAsUnit()`, identically; a **capability**
  function's capabilities each banding their own key objectives (Islam:
  *"agreed"*). **The ids were already there** (`renumberCapability()` mints
  `cap1-KO1`), which is what made it cheap rather than a migration. **The
  group's Focus board grows the same half or the marks are stored where nobody
  looks** (§61) — its first column is *Where*, and a function's cell says
  "supporting function" where a unit's says its weight, because a function
  carries no weight and inventing one is a number that means nothing. The
  switch is a segmented On|Off pair in its **own class, never `.navswitch`**
  (§65.9: that one is scoped to `.units` and paints white-on-navy). **The grey
  note went and was carrying a bug** — `marks + plural(marks,"mark")` printed
  *"0 0 marks"* — and what it was evidence for is asserted of the DATA now.
- **THE COMPANY IS SOMETIMES DERIVED AND SOMETIMES STORED (§130.6):** a person
  sits in exactly ONE place by construction (`attachPersonAt()` clears all
  three pointers; `personAt()` gives one answer), so a second dropdown that
  could disagree is §110's pair. The field is **read-only wherever the unit has
  already answered it** — Mobile's company IS Distribution (§23) — and written
  only where nothing else has. **Companies left the Unit dropdown, and that
  broke granting a Company CEO**, found by `checks/role-picker.py`: the refusal
  names the field that can answer it, and **either half finishes it** (§110).
  The dialog gains a row (614px from 558), so a 640px window now scrolls it —
  recorded, not glossed (§122.5).
- **EMAIL SETTINGS ARE A SECTION, NOT A DROPDOWN (§130.4):** asked as a
  question and answered by what the page holds — a status table, four fields,
  a **live rendered preview** and a test send. A rendered email inside a
  dropdown is not a dropdown. Figure sets' and Import & archives' shape (§46.2,
  §108.4): one rail entry, two sections, **each keeping its own gate**, so a
  `c_comms` holder without `c_send` still reaches it. *Setup › Email* leaves
  the rail and its GROUP is renamed with it (§24).
- **THE RAILED PAGES GET THE WHOLE WINDOW (§93.9):** *"the page is wide,
  however the rail and the tables are stuck in a confined space."* 1180px is a
  READING measure, right for prose and wrong for a rail and a table — every
  pixel denied becomes horizontal scroll. `data-wide` on the ROOT, set from
  `railed`, widening all FOUR containers to 1600px: the chrome's rows carry the
  same cap, so widening the content alone would indent the navigation from the
  page under it. The register goes from **1354px in a 920px box to 1354px in a
  1340px box** — no scroll at all.
- **A ROW YOU COULD NOT FINISH EDITING (§93.10):** *"that's how the editing
  cells look like."* `max-width:none` on `tr.tk-open td` — read cells are capped
  at 150px (§88) and open ones were not, so every field took its intrinsic
  width and the table went 1354 → **1608px** the moment a pen was pressed,
  putting Email, Roles and Status under the frozen Save/Cancel column. **Two
  suspects were chased and found innocent, both worth keeping**: a `<select>`
  computing to the whole box's width is §69's feedback loop and is HARMLESS
  (`.ss-native` is absolute, `opacity:0`, clipped); and a px cap on the open
  row's text fields computed correctly and changed nothing on screen, so it was
  REMOVED rather than left (§37).
- **A COMMENT ATE THE RULE (§93.11):** §88's one-line standard had silently
  overridden the access matrix's own wrap rule. Four attempts, and only the last
  is the lesson. `.cfg .acgrid` matched NOTHING (both classes are on the SAME
  element — `.cfg.acgrid`); then the corrected selector still did nothing
  because **a paragraph I had written sat after the `*/` that closed the comment
  above it**, so the parser met prose where a selector belonged and discarded
  the block. **WHEN A DECLARATION THAT PROVABLY MATCHES PROVABLY DOES NOTHING,
  SUSPECT THE PARSER, NOT THE CASCADE** — ask `document.styleSheets` for the
  rules the browser actually holds (1593 of them, and not that one). It lives in
  `arrange.css` now, concatenated last, beside this table's two other
  exceptions (§69). Third time.
- **THE REGISTER SPEAKS THE NAVIGATION'S LANGUAGE (§93.12):** `placeLabel()` is
  the register's vocabulary; `roleWhereLabel()` is UNCHANGED because the people
  workbook is written from it and read back against it (§65). The `(function)`
  suffix is dropped from seven of eight and **kept for Care**, which is a unit
  AND a function with the same navigation name — §65's reason is still live for
  exactly one row. IT loses it (the unit is *IT Dist.*).
- **A QUESTION THE REGISTER HAS ALREADY ANSWERED (§93.13):** *"his unit is
  already set in the registry, he shouldn't get the dropdown."* §56's
  declaration GRANTS NOTHING — the SMO decides — so where the SMO has already
  placed somebody the question offers a choice that changes nothing. **The test
  is the attachment** (`unit_key`/`fn_key`/`company`), never the Official BU,
  which may point at nothing here (§58.3); "group" does not count. **Decided on
  the SERVER**, like the short list beside it: a page that decides whether to
  ask has decided nothing, because it still had the question.
- **NAME AND FULL NAME (§93.8, reversing half of §93.6 a day later):** Islam:
  *"we can have it Name and Full Name … for the identifiers keep it for the ID
  and email only."* Two facts about what somebody is called had been sharing one
  column, and every previous answer tried to make one column serve both (§69.21
  cut it to two names, §81.1 lengthened it for the clashing pair, §93.6 widened
  it to 392px). **Two columns is what all three were reaching for** — the frozen
  one is back to 216px. **NOT "user name"**, his own phrase, turned down: the
  register already has a *Sign-in name* column and two login-sounding names is
  how §87's twins get made. **STORED, NOT DERIVED** — the first two names are a
  good guess and a bad rule — with `setKnownName()` DELETING the key when it
  matches the guess, or correcting the full name later leaves a stale short one
  (§50.6). **§81.1 MOVES RATHER THAN DIES**: it disambiguates the GUESS now, so
  two people whose first two names match still read as two rows for somebody who
  has hidden Full Name; a typed value always wins. **AND THE OLD FILES STILL
  READ** — §58 a third time, with the twist that the old header's meaning is
  decided by what sits beside it: `Full Name` present means `Name` is the short
  one, absent means the file predates the split and its `Name` is the full one.
  **`known` is a LABEL, never an identifier**: §87's ladder adds no rung, and it
  is a pick on upload like any other field. No migration — `people.extra`.
- **THE NAME COLUMN FITS THE NAME, AND TWO VALUES COPY THEMSELVES (§93.6, its
  first half since narrowed by §93.8):**
  *"the first column with the name needs to fit the name, and make the email and
  the phone to be copied on clicking on them."* The first half **reverses
  §69.21 and §81.1 together** — three names, lengthened only for the pair they
  could not tell apart — because both answered a column that had to stay narrow,
  and since §69.19 it is the FROZEN column: the one a wide table never scrolls
  away, so the wrong place to save pixels, and a name cut off where it is the
  only thing written is what put one human on this register twice (§87). Still
  ONE LINE (§88 unchanged): the column is exempted from the 150px cap, not the
  cap loosened for every cell. **The cost is measured, not glossed**: at *Abd El
  Moniem Mohamed Abd El Moniem Mahmoud* the column is 392px and the table 1489px
  in a 920px pane. `shortName()` is untouched — the wizard, the picker and the
  audience list are sentences, not a column. The copy control has three notes
  worth keeping: **the word is written into the element** (paint() would replace
  the button just pressed, §63), **the `execCommand` fallback is the path that
  actually runs** (`navigator.clipboard` needs a secure context and this is
  opened from `file://` every day), and **the value goes in the `title` beside
  the hint**, because `clipTitles()` only fills an EMPTY title — a bare "Click
  to copy" would take the hover from exactly the values too long to read.
- **THE PERFORMANCE PAGE WENT UNMEASURED FOR THE THIRD TIME (§93.7):** §50.6
  fixed `unit/perf` scanning the Plan page for twelve versions by clicking the
  tab explicitly — then §69 made the tab read *"Performance — not submitted
  yet"*, the exact-string match stopped matching, and the sweep quietly went
  back to measuring the landing page under a name it never opened. It took the
  two PICTURE states with it (`[data-picedit]` only exists on Performance), and
  the sweep printed `(picture sweep skipped: …)` and carried on. **Match the
  PREFIX — a suffix is a status, not the name — and ASSERT IT WORKED**: a helper
  that returns quietly when it found no tab is the same fault with a nicer face.
  Asked of `currentSub`, not of a `.on` class these buttons do not have, or the
  assertion would fail always — the same lie pointing the other way.
- **A COUNT BELONGS WHERE THE GAP IS CLOSED, AND IT PUSHED A BUTTON OFF THE
  PAGE (§93.4):** *"leave a note somewhere by how many units that doesn't have
  custodians."* On the REGISTER, because a custodian is given from a row there —
  a count anywhere else names a problem and points at another screen. **A
  retired person is not a custodian**: retiring revokes the roles and leaves the
  unit's pointer written, so asking whether the field is empty reports a unit as
  covered by somebody who cannot sign in. And the new chip made `.hright`
  overflow its pane — it never wrapped, though `.phead2` always has — putting
  §90's own *Register file* dropdown out of reach: **present, styled, enabled,
  hitting `BODY`**. Third time. The check PRESSES THE POINT now
  (`elementFromPoint` at the button's centre must return the button); "is not
  None" is what missed it.
- **A TABLE PAGE IS NOT A NOTIFICATION AREA (§93.5):** *"this page is a table
  page, not for other notifications."* The merge left a *Merge two rows* receipt
  standing under the register. It is the wizard's LAST STEP now — the dialog
  stays open, says what it did, and Close ends it; §90's argument, applied to
  the one piece it had left outside. Order is load-bearing: `mergeReset()` (it
  clears `done` too), then `done`, then `paint()`, then `mergePaint()`. **And
  the page-level wiring went with the panel** — a `document`-wide query for
  `[data-pmerge-close]`, which the dialog's own Close and Cancel also carry, so
  with `paint()` now running while the wizard is open it would have bound a
  second handler that resets the merge without closing it (§24, §47.2).
- **ONE CHIP TOO MANY (§93):** the register's Unit cell drew a `.uchip`. That
  chip is right where several sit side by side and the boundary is the point (the
  BU list's mapping cell, which it was built for); here there is one value in a
  column whose heading already names it, so the border boxed the only thing in
  the cell. An ordinary value now.
- **ONE DESTINATION IS NOT A QUESTION (§92):** the register's role picker
  commits when its SECOND half is answered, and a seat held over the group
  offers a list of ONE — so picking "SMO team" and stopping looked exactly like
  a broken control, with Employee still showing because that is what is read
  when somebody holds nothing else (§55). §32's rule, already settled twice: a
  door behind a door. A role with one place is granted on the role pick; a role
  with a real choice still asks. The × on the chip is what makes committing on
  one press safe.
- **AN OWNER IS PICKED FROM THE REGISTER, AND IT DECIDES WHO MAY REPORT
  (§130.1):** `SMPRules.namedOn()` matches a tactic's `owner` against the
  register BY NAME, so a short spelling names nobody — **32 of the 78 tactics
  in the demo**, each one a person who owns a line and cannot enter its figure.
  Five fields become lists (project · milestone · tactic · **pillar**, plus
  collaborators as a **ticking** list), built from `ownerChoices()`: the active
  register under *People*, `placeLabel()`'s places under *Departments* — the
  navigation's own word, never a second vocabulary (§53.5) — plus an Official
  BU that points at nothing (§54: Risk carries no strategy and employs people).
  **A stored value outside the list is KEPT in its own group** (§96.2), so a
  plan uploaded before today reads exactly as it did. **The NAME is still what
  is stored**: a key would be a migration through `namedOn()`, the workbook,
  the deck and the archive. **The pillar's row is edit-mode only** — read mode
  already says it twice — and the meta line drops it while the pen is on.
- **A TICKING LIST STAYS OPEN, AND THAT REVERSES `choose()` ON PURPOSE
  (§130.1):** a single pick answers the question, so it closes before firing
  `change` (§30.1); a list you are ticking is not answered until you stop.
  **Committed per tick, never on close** — `close()` is the first thing
  `wire()` does at the end of `paint()`, by which time `FIELDS` is rebuilt and
  that element's `data-fld` points at somebody else's setter. Safe only because
  the `data-fld` handler writes without repainting (§71.2): **wire a multiple
  select to a handler that calls `paint()` and the popup dies under the
  pointer.** The setter is handed an ARRAY, asked of `el.multiple` in the one
  place every bound field goes through — `el.value` on a multiple select is the
  FIRST option and would have dropped the rest in silence. Emptied, the key is
  DELETED (§50.6). The tick is DRAWN, not written: U+2713 is outside the latin
  subsets and would ship as a blank box (§52, §120.2).
- **A 1px CLIPPED ELEMENT SCROLLING IS NEVER THE PAGE MOVING (§130.1):**
  setting `selected` on a `<select multiple>` fires a real `scroll` event from
  the hidden `.ss-native`, which reached `onGone` with capture on — so every
  tick re-placed the popup and a tick near the fold CLOSED it. Three versions
  of `searchsel.js` never saw it, because the single-select path never sets
  `selected` on anything. **Found by ticking, not by reading.**
- **ONE ITEM STILL GETS THE RAIL, ON BOTH SIDES OF THE SWITCH (§130.2,
  reversing `railWorthIt`'s threshold):** it was never about capabilities — the
  gate counted a capability's PROJECTS, so Marketing drew two capabilities on
  one page at two different left edges. `railWorthIt()` is the ONE answer,
  asked in four places; three of them spelled `u.items.length >= 2` inline,
  which is how a unit and a function come to be fine DIFFERENTLY (§53.5).
  **The pen already disagreed with the reading view** (§69.13 draws the rail
  from one project because Add lives in it). **Still false for an empty list**:
  nothing to list is not the same question as one thing to list (§61).
- **THE PINNED TITLE'S CORNERS TAKE THE PAGE'S GROUND — WHILE PINNED (§130.3,
  corrected by §130.6):** §53.7 painted the strip ABOVE the band and stopped at
  its top edge, where the two rounded corner notches begin — 13px² of the white
  card per corner, with rows sliding through it. It first painted **in both
  positions**, on §53.7's rule that CSS cannot ask whether a sticky element is
  pinned, at a cost priced as 1.4px of the pane's own corner arc. Islam: *"the
  corner still has this squared corner."* **The arithmetic was right and the
  place was wrong** — those pixels ARE the card's rounded corner, which is where
  an eye goes. So the one thing CSS cannot ask is asked in JavaScript:
  **`pinWatch()`** is an IntersectionObserver toggling `.pinned`, re-armed after
  every paint beside `SEARCHSEL.wire()`, with the previous one disconnected.
  **NOT v3.3's loop** — it changes no size, so nothing can feed back — and the
  threshold is the element's OWN sticky offset read off the computed style, not
  rebuilt from `--chrome-h` (§29.4). **It shipped once as a throw**: declared
  inside `wire()` and called from `paint()`, so every paint ended in *"pinWatch
  is not defined"* with the page still on screen (§118, one section later) —
  the check carries a page-error listener now. **Measured in PIXELS**, and the
  first version of the check reported a CORRECT build broken: in the dark
  palette `--surface` sits between `--ground` and `--surface-2`, so an
  antialiased pixel lands on it by arithmetic (§68.10).
- **THE SQUARED CORNER WAS THE CARD'S BORDER, NOT THE BAND'S (§130.8):** the
  third round on one corner, and each round found a different element — §130.3
  the pane's white ground, §130.6 the corner arc the fill covered at rest,
  §130.8 the **1px side border**, which `::before` covers everywhere ABOVE the
  band and which therefore begins, pinned, as a square-ended stub beside a
  rounded corner. A card whose side starts in a butt end READS as a squared
  corner. The fill goes `left:-1px`/`right:-1px` now and each gradient tile is
  `--r + 1` wide so its circle stays on the BAND's corner centre — the arc then
  meets the border's line exactly where the fill ends. **The check could not
  have seen it**: it sampled the band's own corner box and the offending pixel
  is the one immediately outside. *Reproducing the picture is not the same as
  reproducing the complaint* — the first two rounds fixed what I had measured,
  and what he was pointing at moved each time.
- **THE PLACE BESIDE THE NAME IS A HINT, NEVER PART OF THE ANSWER (§130.9):**
  `data-hint` on the option, drawn as a quiet span by `searchsel.js`; the closed
  control, the stored value, the workbook, the deck and `namedOn()` all see the
  NAME alone — "Ramy Behairy — Mobile" in a tactic would name nobody (§130.1's
  fault, §130.7's argument from the other side). **It joins what is searched**,
  or it is half a control. `personAt()` + `placeLabel()`, and somebody the
  register has not placed gets NO hint rather than a guess (§15.1). And it broke
  three assertions by being a span: a row's `textContent` became
  "Amaka EzeNigeria" — read the row's FIRST TEXT NODE.
- **THE PICKER LISTS THE REGISTER'S *Name*, NOT THE FULL LEGAL ONE (§130.7):**
  invisible here — all 33 demo people have a two- or three-word full name and
  none has a typed short one, so `knownName()` returns `p.name` and the wrong
  column looked right. Read through **`displayNames()`**, which lengthens the
  guess for a clashing pair (§81.1): in a PICKER two people reading as one entry
  means the second is silently dropped by the dedupe. **What is shown is what is
  STORED**, so the plan says the register's word (§53.5) — **which means
  `namedOn()` had to learn it, or §130.1 undoes itself.** The name rule MOVES
  into `lib/rules.js` (`NAME_PARTICLES`, `nameWords`, `knownGuess`), the browser
  keeps wrappers, and `namedOn()` matches the key, the full name, a typed
  `known`, and **`nameRuns()`** — every leading run from the short form up to
  the whole name, which is exactly the set of labels the register can show.
  **Never one name**: `KNOWN_NAME_WORDS` is the floor, so "Karim" still matches
  nobody — a bare first name would hand reporting rights to whoever shares it.
- **TERSE DROPS THE DETAIL, NEVER THE ALARM (§119.3):** the pillar rail opens
  COLLAPSED now (absent reads as terse, so only an explicit press turns it
  off), and that small line had been carrying two different kinds of thing —
  the routine counts, and §106.2's *N rows to check*, put there so the project
  holding a bad date is findable without opening each (§93.4). `railSub(html,
  alarm)` tells them apart. **Found by `checks/project-tables.py` going red on
  the day the default flipped**, not by reading the rail.
- **THE QUESTIONS TRAVEL, AND THE ROUND TRIP MUST BE A FIXED POINT (§161):**
  the knowledge base exports and imports as one `.xlsx` — the export IS the
  template (§54) — **matched on `Id`**, because the question text is the
  office's to edit and so cannot be the key (§87 in a third place). Adds and
  amends, never removes; an answer put back to the shipped wording CLEARS the
  override, so the file is the undo (§50.6); an unrecognised id applies
  **nothing** and is named, being the row that would otherwise become a silent
  duplicate. **THE SHIPPED TEXT SEPARATES PARAGRAPHS WITH `|` AND A CELL USES A
  BLANK LINE**, so the same prose arrives spelt two ways and a raw `===` calls
  an untouched round trip a change on **24 of 64 rows** — `SMPRules.kbSame()`
  is the ONE comparison, and the first build had two (one in the writer, one in
  the reader), found only because breaking the writer's produced **0 check
  failures**: every fixed-point assertion ran through the reader's. *Two places
  answering "is this the same prose" is how a review says reworded while the
  writer stores nothing.*
- **THE PEN PROMISED A PARAGRAPH BREAK IT NEVER MADE (§161.3):** `kbEdCard`'s
  lede has said *"A blank line is a paragraph break"* since §140 and the read
  path only ever split on `|`, so an office rewrite typed as two paragraphs
  rendered as one run-on — on the page AND in the assistant's answer, for
  twenty versions. `kbParas()` reads both now, in one place (§53.5).
- **`who` IS THREE, AND THE THIRD MAKES A PAIR DETERMINISTIC (§161.1):**
  `office` · `others` · `everyone`, with the old two mapping straight on so
  nothing stored moves (§30.2). §160 handed the office BOTH halves of a
  two-answer pair and told the model to choose; each side is now served exactly
  one. **The audience governs the assistant and never the page** — forced, not
  chosen: the Knowledge base page is the office's (§119.4), so an answer marked
  `others` obeyed there would be readable by nobody and editable by nobody
  (§61). The chip is drawn only for the two that are a DECISION, never for
  `everyone`, which 57 of 64 carry (§41's budget).
- **A RECIPE IS A PROMISE ABOUT BEHAVIOUR, AND NOBODY WAS REVISITING IT
  (§160):** `recipes.js` went from §103 to §159 untouched while the platform
  learned to split the own columns (§117), to fill only what is empty (§145)
  and to derive two owner roles off the plan (§147) — so fifteen features had
  no question and five answers said a flat *"the office"* about something the
  office can now hand over. **When a rule gains an exception, the recipe
  stating the rule is part of that change.** Two of the corrections were
  OURS, not the client's: *"submitted by mistake"* sent people to the office
  for **Reopen my report**, which `canSpeakFor()` draws for the unit's own
  head or custodian, and three `who:"office"` tags marked things a
  non-office person can actually do (**Present has no gate at all**, Manage
  slides is `canSpeakFor`, the **Demo data menu is not role-gated in any
  way**). **`who` IS PERMISSION NOW, NOT RELEVANCE** — `officeOnly()` filters
  the corpus by `Rules.isOfficeRole()` before it is sent, the same test
  `roleWord()` uses one line above — **and the tags had to be re-read before
  the meaning could be flipped**, or enforcing them would have hidden three
  real answers. **THE KB DESCRIBES THE PLATFORM, NEVER A TENANT'S
  CONFIGURATION**: one corpus serves every deployment, so an answer says what
  the platform *can* do with its condition attached.
- **A TENANT'S LABEL IS NEVER INFLECTED, AND THE HELP WAS INFLECTING ONE
  (§160.6, §107.8 for the second time):** `recipeText()` rendered
  `{pillars}` as `plural(2, L("pillar","bu"))` — **`plural()` returns a COUNT
  followed by the word** and `bu` is already *"Pillars"* — so the shipped
  question *"How do I reorder my {pillars}?"* rendered as **"How do I reorder
  my 2 Pillarss?"** on every deployment from §103 to §159, and `{pillar}`
  gave *"a Pillars owner"*. There is **no singular anywhere** (`internal` is
  the platform's own name, not for display), so both tokens take the label
  exactly as it comes and **every sentence is phrased to accept a plural
  noun**; where the ROLE is meant, *"Pillar owner"* is written literally,
  because that is its name on Roles & access and it is not a tenant label.
  **Proved on the built page, not argued** — a `{pillar}` check that only
  asserts "nothing unsubstituted" passes happily on *2 Pillarss*.
- **READ THE DEFAULTS BEFORE CALLING SOMETHING A BUILD (§160.2):** told that
  nobody should report single lines, I reported it as a code change. It was
  not: `contrib`, `powner` and `plowner` **all ship at view** on both
  Reporting halves, so the model asked for was the shipped default plus two
  cells switched on. *A rule can already be true by configuration, and
  reading `ACCESS_DEFAULTS` is cheaper than reading the rule.*
- **THE CODE CAN BE BETTER THAN ITS OWN COMMENT (§160.4):** I reported that
  offline work never syncs, on the strength of `sync.js` warning *"will retry
  on the next change"*. There is a **`setInterval(save, 5000)`** for the life
  of the page and `lastSaved` is set only on `r.ok`, so a failed save is
  re-posted every five seconds and the work **does** go up on reconnection.
  What is true is narrower and worth one clause: **only while the tab stays
  open**, because nothing is stored locally. **AND A FAILED AUTOSAVE IS
  SILENT** — the debounce and the interval both call `save()` with no
  callback, so only a pressed button ever reports; recorded, not fixed.
- **THE KNOWLEDGE BASE IS THE OFFICE'S (§119.4, REVERSING §30 AND §37):**
  `when: inOffice()` on the page def, the shape `c_send` and `c_chat` use —
  never a matrix cell, because who reads the office's own working notes is not
  a tick somebody could set on a bad afternoon. `c_kb` stays `area:"always"`.
  **The prose that claimed it was everyone's was corrected in the same edit**
  (the access page and `pageinfo.js`), or the product goes on saying what it
  stopped doing. **THE COST IS REAL AND RECORDED**: the tour's replay button
  lives on that page and `storyFor()` fits nobody who can now open it — §61's
  trap from the other side. The first-run tour is untouched; `checks/tour.py`
  asserts the absent half and deliberately does not assert the unreachability.
- **THE DECK NAMES WHAT THE PLAN OWES (§119.1):** `Missing`, bold, in the
  platform's own `--bad` — and **the slide is drawn even when it is empty**,
  because skipping it says *nothing is missing here*. An optional blank is not
  a gap: collaborators and an unmarked quarter are left alone. The check MAKES
  the gaps (§94.2) and asserts an EXACT count plus **that the filled facts are
  untouched**, or a builder that marked everything would pass.
- **FILL THE GAPS (§145, spec 023):** the Strategy cells carry a THIRD state —
  View / **Fill gaps** / Edit — letting a custodian or owner write only where
  the plan holds NOTHING. `GAP_FIELDS`/`GAP_SCORE_FIELDS`/`mayFillPage()`/
  `pendOf()`/`pendingScore()` live in `lib/rules.js` (one definition for
  screen, server and deck); a fill is `row.pend[field] = {by, at}`, stored as
  an absence, riding `extra` JSONB with no migration; the authoriser's gap
  pass (`gapFill`/`gapConfirm`) judges fill/amend/unfill/confirm against a
  CLONE and everything else falls through office-only. Reporting and drafts
  flow against a pending target; the SCORE reads a dash and leaves every
  average until the office confirms; Submit is refused naming the rows.
  `gapCell()` is the ONE builder for a fillable cell; no rows are ever
  added/removed/renamed/reordered in fill mode; an office write settles (the
  setters lift the mark — correcting is confirming). **Marks are compared
  canonically, never by stringify — Postgres jsonb reorders `{by, at}` to
  `{at, by}` and an order-sensitive compare refuses innocent saves.**
  §117's .pptx download button is hidden for everyone (§145.9) — machinery
  kept, `dlPlanBtn()` is one line to give back. **The second build
  (§145.10–13):** collaborators are fillable (empty list only) and **a
  pending name confers no reporting right** — `namedOn()` skips marked
  fields, owner included; the objectives' **This year column shows by
  default** (§66's toggle and saved choices untouched); and **the plan says
  where it is owed** — `gapMap()`/`gapMissing()` are ONE list feeding the
  Strategy tab's count, the rail's per-row counts, the fill-mode **gap
  band** (§129's chip shape; a chip is a door that keeps fill mode on) and
  the **Next gap** walker; counts rewrite IN PLACE via `gapBandRefresh()`
  (§71.2 — never a repaint under a typing hand). `FILL_PAGES` keeps the
  fill pen off u_anal (a pen that opens nothing, §61). **qa.py reads tab
  NAMES with `.tbadge/.vh/.tabdot` stripped** — the badge made textContent
  lie to two probes on a healthy build (§51.11). **The third build
  (§145.14, reshaping §145.12 from Islam's screens): red means missing,
  amber means pending — never mixed.** The WHOLE missing bar — the total
  as **"N Missing"**, one red chip per owing place, the solid red **Fill
  in missing elements** button — lives IN the section row beside
  Foundation · SWOT · Plan, read mode included, NOTHING in the page body,
  vanishing at zero; the Strategy tab's number is GONE. The corner button
  beside §101's arrows is the same press (red → **Done filling** while
  open → quiet amber **Review pending · N** when only marks remain); rail
  rows read red italic *"N Missing"* → green ✓; one press opens fill mode
  and walks to the first blank, and a page owing nothing says so and
  points away (`fillBarOr()` — the empty hand reads as broken, §45.2).
  **A REAL PRESS IS NOT A PROGRAMMATIC ONE**: §30.1's `CLICKING` guard
  HOLDS the paint until the click lands, so `enterFillMode()`'s walk read
  the read-mode page, found nothing and marched off through another
  place's chip — invisible to every evaluate-driven probe; the walk now
  queues behind the release timer (`setTimeout(gapWalk, 0)`). And
  **reassigning `window.fn` intercepts nothing called from inside the same
  script** — instrument the SOURCE, not a wrapper. Red WORDS wear
  `--bad-tx` (§38.5, sixth time — `--bad` as type measured 4.49 dark);
  the button keeps `--bad` as FILL with `--surface` ink. **AND THE BAR
  SHIPPED UNDRESSED WITH EVERY ASSERTION GREEN**: inside `nav.tabs`,
  `.tabs button` (0,1,1) outranks `.mchip`/`.fillcta` (0,1,0), so the
  chips lost their borders and the red button rendered as plain words
  while the corner copy wore the design — the contrast probe had printed
  both computed grounds one line apart and I read them as two valid
  states. One declaration, two selectors per list (`.missbar button.X`
  outranks the tab rule, §53.5); the check asserts the PAINT — same
  computed ground as the corner's AND a real colour, or both vanishing
  passes (§113.8).
- **THE ONLY WAY OUT MAY NOT BE THE QUIETEST THING ON THE SCREEN (§159):**
  the welcome screen's *Continue to Mobile* was a 13px `--stone` link at the
  foot of the LEFT COLUMN, and there is no ×, no Escape and no click-outside —
  so every other control on that screen goes somewhere and stays while one
  link carried the whole exit. **Three faults, and weight fixes one:** it was
  the quietest thing among three bordered buttons and a solid fill; its scope
  read as the end of *Waiting on you* rather than the way past the screen; and
  **below 960px it was not even last** — the columns stack, so at 900px the
  screen is 949px tall with **411px of side column after the way out**.
  `.wexit` is one bar **after `.wcols` inside `.wwrap`**, so it spans the grid
  and is last at every width, wearing `.wpages`' wide-row shape rather than a
  second vocabulary for *a row you press to go somewhere* (§53.5).
  **THE EMPTY CASE TAKES THE FILL AND THAT CLOSES A DRIFT** — §148's approved
  mockup said Continue is the loud control when nothing is waiting and the
  build never did it (§45.2, §61) — in **its own class `.wloud`, never
  `.wcta`**, which means *an action row shouts*; that separation is what lets
  the check assert no action row wears the fill AND that the exit does. **A
  row arriving late gives it back**: the inbox count and the chat's unread
  land after the screen is built, so `unEmpty()` — already the one place that
  removes the empty line — drops `wloud` in the same breath. The drawing's
  grey *Strategy · Plan* sub-line is **deliberately not built**: the label
  names the destination (1b-ii) and the second line needs the navigation-word
  reader §99 deleted. **Escape still does not close it** (§159.1) — offered
  with the variations, not taken up, and not slipped in unasked.
- **THE OWN COLUMNS ARE TWO QUESTIONS, AND §94'S LOCK IS A DEFAULT NOW (§117,
  partially reversing §94 at Islam's direction):** each own column on Roles &
  access splits into **Strategy** (the words as agreed — `a_unit_own_strat` /
  `a_fn_own_strat`, NEW keys) and **Reporting** (the OLD keys, which is the
  back-compat: a stored grant governed reporting, so it keeps meaning that and
  nobody's rights move; the strategy half falls back to defaults, §30.2).
  Strategy edit defaults to the office; **the SMO can open it to a role on the
  table** — `mayAuthorPage()` asks the GRANT now, with one §94 remnant as a
  rule: a non-office role never authors a unit or function it does not hold.
  **`mayArrange()` rides the REPORTING half** or the split would have silently
  taken §101's arrows back. **The plan downloads as slides** (`mayDownloadPlan`
  — office + owner/custodian/fnhead): `src/pptx.js` builds a real editable
  .pptx from `zipStore()`, plan content only, SWOT included, no reported
  figure — asserted as absences in `checks/strategy-split.py`.
- **THE STRATEGY TAB IS AUTHORED BY THE OFFICE, AND ONLY THE PLAN EVER WAS
  (§94):** Islam, asked whether he meant the plan or the tab — *"I tested and
  the custodian found the pens."* §31's argument (a plan correctable by the
  person measured against it is a different decision from one correctable by
  its custodian) is exactly as true of the **aspiration** the objectives hang
  off, the **SWOT** the pillars were reasoned from and a **capability's
  definition** — and only the plan had ever been asked, so a custodian could
  not touch the measures and could rewrite the aspiration above them.
  `STRATEGY_PAGES` in `lib/rules.js` names the five once (`u_found`, `u_anal`,
  `u_plan`, `k_found`, `k_proj`) and `mayAuthorPage()` is the ONE question both
  sides ask. **THE UNIT OF THE DECISION IS THE PAGE, NOT THE AREA**: `a_unit_own`
  also carries Performance and My reporting, so closing the area would take
  **reporting** away in order to withhold authoring. **THE GATE IS ON THE
  CONTROL** — `penBtn()` and `editBar()` draw every pen in the platform and both
  ask `mayAuthor()`, so a pen added to a strategy page later is gated the day it
  is added (§42, on the screen). **AND THE FIELDS ASK AGAIN**, because
  `EDIT_PAGE` is a switch and the viewer switcher repainted **without leaving
  modes** — `authoring(page, acKey)` takes the ACCESS KEY, since the group's
  Foundation and a unit's share one page key and only one is a strategy page.
  **REORDERING IS AUTHORING**: `canArrange()` ended at the raw grant, so the pen
  was closed to a unit owner and the drag handles were not — and
  `lib/authorize.js` compares row ids IN ORDER, so every one of those drags was
  already being refused on save. **THREE DRIFTS, ALL SCREEN-SAYS-YES /
  SERVER-SAYS-NO**: `unitPlan` asked `isSMO` while the pen asked `inOffice()`
  (an SMO team member was offered the plan pen on every unit and refused every
  time); `capPlan` asked only the function's grant, so a function head could
  write with the API what the screen would not draw; and `hasRole("super")` was
  the TENTH place meaning the office (§89 named nine). **NOT on the list,
  deliberately**: the group's own pages, every reporting page, and **Strategy ›
  Who enters** — behind a tenant switch that is off by default, so turning it on
  is the office deliberately handing naming to the custodian (spec 008 §3B), and
  **a rule cannot close a door somebody has to open on purpose.**
- **THE ARRANGE BUTTON GOES, BECAUSE §94.3 TOOK AWAY ITS REASON (§94.15):**
  §63.3 kept an explicit Arrange beside the pen for a stated reason — *"a BU
  head has no pen and could arrange before this, so they keep an explicit
  button"* — and §94.3 closed reordering to the office, who all have one. The
  sentence that justified it stopped being true the same day. **A control with
  no audience of its own is not a choice, it is a duplicate**, and the two were
  already an either/or dressed as two things (the button had to hide whenever
  the pen was on). **THE GROUP KEEPS ITS OWN and that is the point, not an
  exception**: its Performance page has no pen, so that button is the only way
  to reorder units, themes and capabilities — "remove the Arrange button" read
  one page too widely would have taken away the one that still does something.
  **AND IT NEARLY SHIPPED RETURNING `undefined`**: deleting the leading term of
  `return arr + (…)` left `return` alone on a line, where automatic semicolon
  insertion ends the statement — the same scar `renderGroupFoundation()` already
  carries. The page RENDERS the word rather than throwing, so the check reads
  `#panel` for it. Assert **both ends** — the button absent AND the pen still
  producing handles — or a build that lost the handles too would pass.
- **EVERY PAGE GETS THE WHOLE WINDOW, AND THE FAULT WAS AN ALIGNMENT (§94.13):**
  the complaint reads as "the page is too narrow" and is not quite that — the
  destination row had been let past the cap (`.units-in.folded{max-width:none}`,
  *"a navigation bar is chrome, not content"*) and the content had not, so at
  1670px the row ran edge to edge at 1655px above a page sitting at 1132px,
  centred. **Two containers that used to agree stopped agreeing**, which is why
  it reads as broken rather than merely narrow. §93.9 FINISHED, not a new idea:
  the cap comes off everywhere and **the 1600 ceiling goes with it**, so there is
  one behaviour and not two — the register's frozen first and last columns
  already answer the head-turn the ceiling was for. `data-wide` and the
  `max-width:none` override are both DELETED, because a rule that no longer does
  anything is one somebody reads as load-bearing (§24). Measured: 1132 → 1607px,
  and a unit's Plan pane 920 → 1395px. **The one real cost is recorded, not
  hidden**: 1180 was a READING measure, and at 2560px a unit's Foundation reaches
  1166px on its longest line — the fix then is a measure on the prose BLOCKS, and
  it is not worth adding before somebody has a monitor that wide.
- **ASSERT THE AGREEMENT, NOT THE NUMBER (§94.14):** `src/checks/page-width.py`
  measures that the navigation, the tab row and the page start and end at the
  same x — never what that x is — so a later change to the gutters stays green
  and a cap reintroduced on any one of the three does not. §53.5's rule, applied
  to width. Swept at 1920 / 1670 / 1280 / 1000 (§27.1), asserting **no sideways
  scroll** (§27.2: it drags every sticky element with it) and that the window is
  genuinely used, so a cap replaced by a bigger cap fails.
- **NOTHING WEARS A COLOUR IT WILL HAVE TO CHANGE (§94.10):** the platform
  painted from the BAKED file and repainted when `/api/state` answered — so it
  opened in the wrong colours and, on a client's deployment, in **Raya Trade's
  units and figures**. Two things arriving late, and only the first was
  reported. The answer is a **grey skeleton** (Islam's, over remembering the
  branding in `localStorage`: that would have fixed the colours and left the
  content flashing). **THE PALETTE IS THE WHOLE IDEA** — `--surface-2`,
  `--line` and `--ground` are the page's own neutrals and none of them is
  brandable (`brandTokens()` writes only the `--gold*`, `--on-accent`,
  `--accent-glow` and `--panel*` families), so nothing on that screen can
  change when the branding lands; the real chrome is HIDDEN, not dimmed,
  because a skeleton keeping the navy bar would still swap it. **Shape-neutral
  on purpose**: until the server says who this is, the platform does not know
  whether it is opening a unit's Plan (a rail and a pane) or the group's
  Performance (cards). **THE SWITCH IS IN THE HEAD, WITH `theme.js`'s
  ARGUMENT** — the page cannot open in the right colours, so it opens in NO
  colours (§32's rule at the gate, one surface in); deliberately not `SYNC`'s
  check moved earlier, because a boot state waiting on a script further down
  the page is one frame too late. **EVERY EXIT FROM `boot()` IS NOW
  LOAD-BEARING**: the removed `paint()` was also the safety net, so `land()` is
  one idempotent door with four ways in (the answer, a failure, an 8s backstop,
  `file://`) and one deliberate non-paint (a 401 is already going to the gate).
  A 180ms floor holds the skeleton so a fast answer cannot blink it.
- **A FEATURE ONLY VISIBLE OVER HTTP IS INVISIBLE TO THE WHOLE SUITE (§94.11):**
  every check opens the built file over `file://`, where nothing arrives late
  and the boot class is never stamped — **a build that had lost the skeleton
  would go green every time.** `src/checks/boot-skeleton.py` serves the built
  file with a slow `/api/state` answering with a **bar colour the baked file
  does not hold**, so "the tenant's colours arrived" and "the baked colours
  were never shown" are two measurements. Two traps on the way: **serving the
  platform at `/` made the 401 case an infinite loop** (the stub must model the
  DEPLOYMENT — gate at `/`, platform at `/raya-trade`), and
  **`getComputedStyle` on a `display:none` element still returns its
  background**, which reported the navy bar as on screen while the skeleton
  correctly covered it (§68.10 in reverse). Measure a BOX (`getClientRects`)
  and `elementFromPoint`, in both states.
- **PEOPLE OPEN WHERE THEY WORK, AND THE GROUP IS A PLACE (§94.6):** a unit has
  opened on Strategy › Plan since §28; what never happened is WHICH destination
  opens — `var current = "group"` was a literal, and `paintUnits()` only corrects
  `current` when it names somewhere unreachable, which the group never is. So
  every session started on a group score the viewer often does not own.
  `entryDest()` answers the door, `entrySub()` the page, and where somebody sits
  is **`personAt()`** — the one pair that answers that (§54). **"group" needs no
  special case and excluding it broke the SMO**: the first entry in the
  navigation row is the group/company DROPDOWN, which carries no key, so "the
  first door" is the first BUSINESS UNIT and the SMO opened on Mobile. Found by
  the check, in the line that looked too obvious to assert. And **the target is
  the destination being asked about**: `entrySub()` called `allowed()` with no
  target, which falls back to the global `TARGET`, and both callers ask before
  `paint()` has moved it — so a unit head walking from the group to their own
  unit had their unit's tabs judged against `"group"`.
- **REPORT IS THE ONE SOLID BUTTON, AND THE LEGEND GETS OUT OF ITS WAY (§94.8,
  REVERSED IN PART BY §94.9 THE SAME DAY):** asked for a row of its own —
  *"bring the 2 buttons above the reading colours rectangle"* — built, looked
  at, and then: *"we can leave the 2 buttons in the same line with the reading
  colours and we can even shrink the reading colours a bit in font size so the
  buttons are more obvious."* **THE PROBLEM WAS NEVER WHERE THE BUTTONS WERE**
  — it was that two 12px uppercase controls sat against a 12.5px legend in the
  same weight of grey, so **moving them spent a whole row of vertical space to
  solve a CONTRAST problem.** The legend drops to 10.5px (label 9.5px, dots 10px,
  because a 13px circle beside 10.5px type is a bullet not a swatch) and the row
  now reads in three volumes. **10.5px IS THE FLOOR AND IT IS THE PRODUCT'S
  OWN** — the size every uppercase key already wears, with the label at
  `--fs-micro` beneath it, so the legend is as quiet as anything the product
  says rather than quieter than everything: Report shouts, Presentation speaks, the legend
  explains. `.pageact` stays what it was — the function's page's row.
  **AND THE CHECK CHANGED INTO A BETTER CHECK**: it had asserted a POSITION,
  which a reversal makes false and which was never the point; it asserts the
  **order of loudness** now. *A check written against the last instruction has
  to be rewritten every time somebody changes their mind; a check written
  against the PROBLEM survives it.* **THE ORANGE IS TWO TOKENS, BECAUSE
  §38.4 CUTS BOTH WAYS**: the bright orange that works as a FILL cannot carry
  white type (2.46:1) and the deep orange that works as TYPE cannot carry the
  page's ink — so `--cta` / `--cta-ink` are declared together, one line per
  palette, both values already in it (5.54 / 5.18 light, 7.26 / 7.89 dark).
  **One fill, once**: drawn only while a cycle is OPEN and only for somebody who
  may report, so §41's budget holds. The *Submitted* badge inside it is an
  OUTLINE — a white wash lightens the ground under its own text to about 4.2:1.
- **A CHECK THAT ONLY LOOKS FOR SOMETHING PRESENT CANNOT SEE A CONTROL THAT
  SHOULD NOT BE DRAWN (§94.2, §94.5):** every plan-edit check counted fields and
  handles behind the pen and every one ran as the SMO, so none would ever have
  noticed the custodian's. `src/checks/strategy-office.py` asks each closed door
  TWICE — of the screen and of the shared rule — and asserts BOTH ENDS, or a
  build with the pen removed for everyone would pass. Same day, the same fault
  in the suite: **`test-authorize.js`'s "may not touch the access matrix" set a
  value to what it already was**, so `same()` saw no change, the save was allowed
  with an EMPTY change list, and §89's gravest rule had never once run while the
  suite printed *155 passed*.
- **THE OFFICE IS TWO ROLES (§89):** **SMO team** sits under Super user with the
  SAME grants in every area — the difference could not be a cell, because
  narrower areas would take away whole pages to withhold three acts. It is
  **three rules** in `lib/rules.js` beside §37's: `mayEditAccess` (the matrix is
  the Super user's — editing it is editing who may edit it), `mayDestroy`
  (retire yes, delete/clear no; **merge is deliberately not destruction**), and
  `mayIssuePasswordTo` (**the test is the TARGET**: the client's people yes, a
  Super user or another team member never — first-issue and reset are the same
  power, so splitting them protects nobody). **Nine places meant "the office"
  and said `hasRole("super")`** — reporting past a locked cycle, correcting a
  plan, marking focus, sending a message — and all nine are `inOffice()` now, or
  the role would look complete on the matrix and be unable to run a cycle.
  **THE REGISTER CARRIES THE SEAT, SO IT CARRIES THE MATRIX**: found by the
  check, not by reading — `people[].role` is where `super` is stored, so an SMO
  team member editing their own row promoted themselves without opening Roles &
  access. `lib/authorize.js` classifies a seat move as `access` and a row
  leaving as `destroy`, whichever screen they came from. Demo data is NOT
  withheld: it writes nothing (§67), so it is a view, not a delete.
- **A CONTROL BELOW THE FOLD IS A CONTROL THAT DOES NOTHING (§90):** *"when I
  press merge with other row nothing happens"* — it rendered 1086px down the
  page with the page at scroll 0. §70's fault by a different road, and both pass
  every check that asks whether something is in the document. The merge is the
  platform's own modal now (`openModalHtml`: inert page, focus returned, Escape)
  in **three steps**, because who · which survives · confirm are answered at
  different moments. `mergePaint()` rewrites the DIALOG's body, never `paint()`,
  which would rebuild the register behind an inert overlay. **The register's
  file is a header dropdown** beside Columns and Passwords — steps 1 and 2 were
  permanent furniture for something done twice a year — while the REVIEW stays
  on the page, because a dropdown is the right home for two buttons and the
  wrong one for a decision. The upload is a real file input with its **label**
  styled as the item: a picker cannot be opened from script without a gesture.
  And the three notes under the table moved to the knowledge base, with the
  check asserting **both ends** — gone from where they were, present where they
  went, because a removal is the easiest thing to half-do.
- **A SETUP TABLE ROW IS ONE LINE (§88):** Islam, on a register row 100px tall
  beside rows of 39px with an address broken mid-word: *"the table should NEVER
  wrap like that where the row gets bigger."* **It reverses §81.5 and §83.2** —
  his own earlier ask, *"fix the overflow of data by wrapping"*, which did fix
  the overflow and produced a row height that depended on how long somebody's
  email was. **The third answer is CLIP**: one line per cell, an ellipsis where
  it does not fit, the column capped so it cannot hold the table open, and the
  whole value one hover away. **The cap was chosen by sweeping it** — 150px is
  where the register's scroll matches what it cost before any of this (§54.6),
  and the frozen first and last columns were built for exactly that scroll
  (§69.19, §69.20). **THE HOVER IS MEASURED, NOT WRITTEN**: a `title` set at
  render time is a guess about whether a value will fit, so `clipTitles()` runs
  at the end of `paint()` and titles only what is actually clipped. And **the
  rule block was in `config.css` TWICE**, which is why editing it did nothing —
  the fourth time this file has hit that (§29.2, §51.5, §53.6). Two checks
  measured the wrong thing on the way, both inside an hour: **a cell's height is
  the ROW's height** (a cell holding `7` reported as wrapping, 172 times), and
  **`getClientRects().length` is not the number of lines** (Chrome returns
  zero-width extras) — it is the number of DISTINCT TOPS among rects with width.
  `src/checks/no-wrap.py` asserts no text on two lines, nothing clipped without a
  hover and nothing unreachable, at 1440 / 1180 / 1000px — and deliberately does
  NOT assert equal row heights, or the fix would be to delete real content.
- **A NAME IS NEVER AN IDENTIFIER (§87):** who a register row *is* is asked in
  ONE place — `personByIdentity()`: **Emp ID, then email, and no third rung** —
  and it reports which rung answered, because "matched" tells nobody what to
  check. An address on two rows answers **nothing** (§57's rule, §69.23's door).
  Three people were on the register twice — once from the employee file with an
  address, once typed into the role picker with a shorter spelling and nothing
  else — so a message aimed at a role reached the copy with no address and said
  they had none. Both hand-typed doors ask for an identifier now and refuse one
  already here by NAMING who; a matching **name** stops nothing, because two
  people really can share one. Neither is required — the row is **marked**
  instead, since that is the shape the next upload cannot match. The upload
  matches on the same ladder, **sets aside** a row whose ID and email point at
  two people (or whose address arrives under an unknown number) and applies
  nothing until each is answered. **A difference is an OFFER, never an
  instruction**: the register wins by default, because a people file is usually
  an export somebody edited two cells of — which meant the fixed-point check had
  to be re-measured with every pick TAKEN, or it was measuring the defaults
  (§51.11). And **merge** is a delete that first hands over every pointer, which
  is why its last act is `deletePerson()`: anything it forgot refuses the delete
  and fails loudly rather than dropping a role.
- **EDIT AND ADD WERE BUILT, AND THE PEN WAS INVISIBLE (§70):** a capability's
  Projects pane and a unit's Plan already gave 34/25 editable fields, 14/13 drag
  handles and Add for a project · deliverable · outcome · milestone / pillar ·
  measure · tactic — behind a pen at `opacity:0` **until the pane is hovered**,
  which on a touch screen never happens. §30's pen-on-hover is right for a
  **card** (`.hoverpen`: small, the pen on its own heading, hovering the thing
  being edited) and wrong for a **pane** (920×1015, a 28px square in one
  corner); the pane's rule changes, the card's does not. **A DOM check passed
  every day this was broken** — `mayEditPlan()` true, the grant `edit`, the
  button in the document — so `qa.py` CLICKS it with no forcing, because
  Playwright refuses to click something invisible. Second "built and could not
  be reached" in a week, after the register's Delete (§69.20), and both were
  found by somebody trying to use the product.
- **A COMPANY GETS A PAGE (§68):** it **reverses half of §23** — a company still
  carries no strategy of its own (no plan, no foundation, no objectives), and
  now carries a **reading of the units it holds**. The compile is each unit's
  figure weighted by the weight it already carries at group level,
  **re-normalised** so the company's units sum to 100% — which is what dividing
  by the total of those weights does, so `weightedOver(keys, of)` is ONE
  function and the group's version is it called with `UNIT_KEYS`. The **group
  button is a dropdown** (Islam: *"make the group button name general and make
  it a drop down that opens group and company"*) whose label is where you ARE,
  and a **plain button when there is one destination** (§32). One tab, because a
  company has one thing to say; gated on the group's key at the `co:` target, so
  §23's two flags already decide — but `roleOwns()` needed a `co:` case or **a
  company's own CEO did not own their own company**. `unitCards()` is EXTRACTED
  so the group and a company cannot disagree about the same unit. And **a number
  that is not a score must not wear a scoring colour**: "share of the group" is
  43%, `band(43)` is off-track red, and the card said an ordinary share was
  failing — `drillCard`'s `plain` uses the quiet mark. **THREE checks clicked
  the group directly** and only the first crashed; the other two waited thirty
  seconds each on a hidden button — §51.11 as an instruction, not a warning:
  when a control changes shape, grep the checks for the old selector and fix
  ALL of them (`go_top()` is the one place now). Filtering to visible buttons
  alone would have been worse than the crash: the sweep would have stopped
  visiting the GROUP and gone on reporting "ok". **And the company page failed
  contrast twelve times and did not** (§68.10): `.gauge` is a conic-gradient
  donut whose `::before` paints an opaque hole, the number sits on the HOLE,
  and `bgsOf()` measured it against the ORANGE ARC — 1.93:1 for text that
  samples at about 14:1. **§53.7's blind spot from the other side**: that one
  called a broken build clean, this called a correct one broken. `coverOf()`
  now treats a pseudo-element as the background when it has content, is
  absolutely positioned and **none of its four insets is auto** — the computed
  shape of "fills its parent", narrow enough that a marker pseudo fails it. The
  group's Business units section had never been scanned either: the group page
  opens on its FIRST section, so those cards had been unmeasured for versions.
- **Two demos: Filled project and Clear project (§67):** Clear Project is
  **what a client's deployment looks like on day one** — `clearedGraph()`
  mirrors `db/migrations/004-clean-slate.sql` statement for statement, so the
  screen shown and the screen they get are the same screen. That is a second
  copy of a rule and it cannot be avoided (SQL against thirty tables vs a graph
  in a browser), so **`scripts/test-clean-parity.js` asserts it** against a real
  Postgres, reading the function OUT of the source rather than holding a copy.
  004 has been amended three times already; the fourth time, this fails. The
  save guard widened with it (`isDemoMode()`): **a Clear Project that could save
  would write an EMPTY tenant over a real one.**
- **AN INLINE XLSX DROPDOWN OVER 255 CHARACTERS IS AN EMPTY DROPDOWN (§67.5):**
  Excel ignores it and says nothing — the file opens, the column looks right,
  the list is gone. The Unit column measured **301**; the Official BU list
  beside it 93, which is why one worked and one did not. Both moved to a
  **Lists** sheet referenced by range (both, or the second is forgotten — §40),
  and **`buildXlsx` now throws** on an over-long inline list, because a list
  that grows with the tenant crosses that line eventually and the artefact
  looks perfect every time.
- **RENAMING A UNIT BROKE EVERY SAVE (§67.6):** the line attaching a weighting
  row to a unit was written to FIX name-matching, added `key` to every row —
  **and went on overwriting that key from the name anyway.** A rename survives
  the session; on the NEXT load `row.key` is null, `weighting_rows.unit_key` is
  NOT NULL, and the tenant can never write again. Found only by renaming a unit
  AND running the round trip against a real database. The row's own key wins
  now; the name-match is the fallback.
- **The 1-year view on a unit's key objectives is a TOGGLE (§66):** §51.16's
  hard-coded `false` said "for now" in the code; this is the control it was
  waiting for. **§145.11 reversed the DEFAULT to shown** (a missing near
  target must be a visible red word); the toggle and every saved choice
  survive. A screen preference
  (`smp.ko.year` in `localStorage`), never the state graph — one person seeing
  both horizons must not decide it for the tenant (§25, §47.1). **The unit's
  only**: the group's objectives have always shown both, so the control is
  absent rather than present and inert, and it is hidden in edit mode because
  authoring shows every field there is. One state, so ONE button — a segmented
  pair would put a permanently-lit half beside a permanently-dark one. Asserted
  on **both layouts**, which fail differently: the columns view drops a grid
  TRACK, the chips view drops a line.
- **The register's file carries WHERE SOMEBODY SITS, and the column is called
  Unit (§65):** "Official BU" is the client's own word (§58); **Unit** is the
  business unit, supporting function or company it opens here — Islam renamed
  it from BU because "it covers BUs and functions as well". The label changed,
  **the key `bu` did not**, or every saved column preference would miss it and
  the column would reappear for everybody who touched the chooser (§30.2). The
  reader takes the old "BU" header too (§58's rule, applied forward). **Blank
  means nothing to say**: fill Unit and it decides, leave it and the Official BU
  mapping does, leave both and nobody moves — which only needed
  `attachPersonAt()` to move out from under `if (row.mainbu)`. The vocabulary is
  `roleWhereLabel()`'s and **the `(function)` suffix is load-bearing** (this
  tenant has a unit called IT and a function called IT); an exact match is
  answered and the near miss is NAMED, but **only where it would move
  somebody**, or the platform notices four times about its own export (§54.4).
  The Unit list is **not soft** while the Official BU list still is: a name can
  be added to the client's own vocabulary, a unit cannot be conjured. And
  **a validation range is a POSITION** — inserting the column moved Role G→H, so
  the ranges derive from `PEOPLE_FILE_COLS` now.
- **A CLASS NAME IS ONE GLOBAL NAMESPACE (§65.9):** the access matrix's lit eye
  sat 11px below the centre of its own button because its state modifier was the
  bare word `view` and `.view` is the PAGE REGION, carrying
  `padding-top: var(--rail-gap)`. Nothing was wrong with the button's rules; it
  was wearing somebody else's. **§56.7 in CSS instead of JS** — a one-word
  modifier and a one-word component in one scope, valid on both sides, silent
  when they meet. Scoped to `st-view` / `st-edit` / `st-none`.
- **A unit's Performance has THREE headline numbers (§64):** objectives ·
  **pillars** · execution, read left to right as *what we are judged on · how
  the work we set ourselves is going · whether the work happened*. Nothing new
  is computed — `unitPillars()` has existed since the scoring model did and was
  already on screen as a bare number in the rail's footer. **It reverses half
  of `TIP_PERF`'s rule**: the objectives figure is still NOT a roll-up of the
  pillars' measures (that is why the two sit side by side and may disagree),
  but "those never aggregate" is no longer true. A pillar handed to a function
  says *"from X"* rather than `0` measures, and a unit with nothing scored
  reads a **dash, never 0** — `qa.py` blanks every progress figure and asserts
  it. The tip is a FUNCTION, not a constant, because it names the tenant's word
  for a pillar and a constant is evaluated before hydration (§30.2, in prose).
- **Performance opens; reporting is a MODE; arranging belongs to the plan
  (§63):** the Performance tab held two sibling sections, one of them called
  Performance — Islam: *"performance is a result of reporting, so having inside
  performance 2 buttons performance and reporting actually doesn't make
  sense."* **Report** and **Presentation ▾** (Present / Manage slides) sit on
  the page; `REPORTING` holds the **target**, not a boolean, and `leaveModes()`
  drops it — **on a tab change as well as a destination change**, which nothing
  did before. **Save draft FLUSHES and says which of the five real outcomes
  happened** (saved / already saved / refused / failed / no server here), and
  the word is written into the element because `paint()` would replace the
  button that was just pressed. **Arrange left Performance for the Plan**: the
  order of a unit's pillars is what was agreed, not how it is going, and
  Progress and Performance need nothing to follow it because the order IS the
  array. Two ways in, one mode — the SMO's pen turns handles on with the
  fields, a BU head (who has no pen, §31) keeps an explicit button. Three
  things that had never worked, found by moving them: **a pillars function
  could not be Presented** (`UNITS["fn:…"]` is undefined — §59's `unitLike()`
  rule, one place still asking differently); **the rail's drag grips were bound
  to nothing** (4 grips, 0 bound: `data-kind="pillars"` meant `.prow-wrap`,
  which no rail contains — **the container says what it holds** via `data-item`
  now); and **a hidden section row is not an empty one**, so the contrast sweep
  pressed the last page's buttons and reported them under this page's name
  (§50.6, fourth time — **a contrast total that moves after a change touching
  no colour is a check to read, not a number to accept**).
- **A function can be DELETED, and the refusal is the feature (§62):** retired
  is still the default, because a function key is written into `c.fn` on a
  capability, `p.by` on a pillar, `p.fn` on a person, `fn:<key>` in the
  Official BU list and every reporting key REVIEW and HISTORY hold — so
  `fnDeleteBlockers()` refuses while any of those holds it and **names what**,
  and **anything ever reported is a refusal, not a warning** (that is what
  Retire is for). The button is always live and **the refusal is where the
  confirmation would be**: §59's disabled-with-the-reason is right for one
  line, and the actions column is 83px wide with four controls already
  wrapping. Blockers are re-asked on Yes, never trusted from the render that
  drew the button (§48.2). **The server needed nothing**: `lib/authorize.js`
  already classified a removed function as `setup`, which is §42's "an
  unrecognised change is the SMO's" covering a feature that did not exist yet.
  `plural()` now takes an optional plural form ("1 capability" / "2
  capabilities"), and `--bad` on `--bad-bg` is 4.41 — §38.5 again, fixed for
  every confirmation because converting some of a family is worse than none.
- **An empty function is still a function (§61):** `fnHasWork()` was the whole
  navigation gate, which is right for somebody coming to READ and wrong for the
  people who have to fill it — **a function with no plan could not be opened, so
  the only way to reach it was to give it a plan first**, and on a fresh tenant
  (migration 004 removes every capability) that hid EVERY function. `fnShows()`
  is `active && (fnHasWork || fnCanFill)` and the fill test is **edit**, asked
  ONCE by both `fnsReachable()` and the shell's `myFns()`. `fnNothingBehind()`
  is the one empty state all three of a function's pages use. **A READING VIEW
  IS NOT A WRITABLE ONE**: `fnAsUnit()` returns a fresh object and frozen
  empties, and `clearUnitPlan()` ASSIGNS `items`/`keyObjectives`/`swot`, so an
  import applied to the view reports what it wrote and writes nothing —
  `fnWritable()` / `fnWriteBack()` / `unitLikeWritable()` are the writing half,
  and `qa.py` proves it by asking the FUNCTION afterwards. **The download is one
  button with two entries** (`<details>`, so closing it from inside its own
  click hides rather than unmounts — §47.2): a plan template is generic in both
  formats, a progress template is one subject's rows, and **the format is read
  off the subject rather than stored beside it**, or the two drift. The pillars
  Read me now says *"Business unit or function"* and **the reader takes either**
  (§58's rule: write the new label, read either).
- **A function that plans in pillars (spec 010, made usable in §59):** its
  plan and figures live on the FUNCTION, so `collectFunction()` classifies them
  through **`collectUnit()` against the `fn:<key>` target** — never a second
  copy; only its SETTINGS are Setup. `renumberUnit()` runs over pillars
  functions too, or every row is keyed `undefined` and the authoriser sees NO
  change at all. `fnHasWork()` answers "is there anything behind this function"
  once (it was asked twice, both times as "has capabilities", which kept a
  pillars function out of the navigation). `unitLike(target)` resolves a unit
  key or `fn:<key>` in one place. **Setup › Supporting functions** carries
  *Plans in* and *Under*; switching is refused while the other side holds
  something, and the control is shown DISABLED with the reason rather than
  hidden.
- **Official BU (renamed from Main BU, v3.21, §58):** the client's own word for
  a part of the business. **It is measured by nothing** — no plan, no score, no
  page — and that is a decision, not an omission (§58.3): what carries a score
  is what the practice identifies and verifies, which is a unit, a supporting
  function or a company grouping them. The rename is LABELS ONLY: `p.mainbu`,
  `GROUP.mainbus` and `mainbuAt()` keep their spelling, because renaming a
  stored field is a migration for a word nobody reads. The people workbook
  WRITES "Official BU" and READS either — a header is a contract, and somebody
  is holding a file downloaded before the rename.
- **A Main BU holds SEVERAL (since v3.21, §57):** `mainbuAts()` reads a string
  as a list of one and an array as itself, so nothing written before it needs a
  migration (`mainbus` is jsonb in `org.extra`). **`mainbuAt()` answers only
  where the name means ONE place** — several means the file places nobody and
  the sign-in picker offers those few instead; read `bu.at` directly and you
  attach somebody to the ARRAY, which is what the importer was doing until
  `qa.py` asserted the rule. The Setup cell is chips with an × plus a dropdown
  offering only what is unmapped; add and remove are separate writes, so a
  stale tab can never drop somebody else's mapping. The gate's list is narrowed
  **on the server**, with everything else still under *Other* — a short list
  that cannot be escaped strands whoever it forgot.
- **Where people say they work (since v3.21, §56):** the first sign-in asks,
  and the answer is a **declaration that grants nothing** — the BU that decides
  access stays the SMO's, who sees *"They said X — Use it"* under the BU on the
  register and accepts through `attachPersonAt()`, the same one door. Stored in
  `bu_declarations`, OUTSIDE the state graph and with **no foreign key**: a save
  TRUNCATEs the thirty tables CASCADE, so a column on `people` would be erased
  and an FK would take the whole table with it. The list of choices is built and
  re-validated on the SERVER, and nothing about the question may block a
  sign-in — the password is set before it is asked.
- **A clean merge can still collide in a shared scope (§56.7):** two branches
  each added a `var pf` to `wire()`, 600 lines apart, no textual conflict — and
  `var` is function-scoped, so one binding, and a function's Present button
  threw `null.dataset` on every paint where the People page was absent. Only
  driving the merged product finds these. Prefer `this` over closing over the
  element a handler was wired to.
- **The floor is two roles (since v3.21, §55):** somebody attached to a part of
  the business and holding nothing else is a **Contributor** where a plan names
  them and an **Employee** where it does not — derived by `namedInUnit()`,
  never granted, neither offered in the people workbook. Employee ships with a
  Contributor's current access so nobody's view changes on upgrade; the SMO
  tightens it on the matrix, which is the point of it being its own row.
  **`OWN_LINES_ONLY` in `lib/rules.js` names the concept once** — twelve places
  tested the string `"contrib"`, and a second floor role beside it would have
  widened every one of them by omission (an employee given edit could have
  submitted the unit's report and named who enters a figure). Ask
  `onlyOwnLines()` / `isOwnLinesRole()`, never a role key.
- **The BU list (since v3.21, §54; spec 011):** the client's own names for
  parts of the business (`GROUP.mainbus`, so `org.extra` and no migration),
  each pointing at a unit, a function, a company, the group — or at NOTHING,
  which is a real answer for a department that carries no strategy. **The
  vocabulary is `r.at`'s** — `"group"`, `"co:…"`, `"fn:…"` or a unit key — the
  same strings a role is held at, which is the whole reason a Main BU can point
  at a COMPANY without inventing anything. The register carries **Main BU** (the
  client's word, off the employee file) beside **BU** (what it points at here,
  and what decides access) — renamed from *Belongs to*, as *Standing* was
  renamed to *Status*. `personAt()` / `attachPersonAt()` in `config-data.js` are
  the ONE pair that answer "where does this person sit"; the register and the
  file importer must never answer it separately. The **people workbook** is the
  register's export as well as its template, matched on **Emp ID**, and it
  **adds and amends and never removes** — that is §22's contract turned round,
  because a plan is one whole thing and a register arrives in batches. An
  unknown department is ADDED to the list unmapped rather than refused, or a
  fresh tenant could never read its first file (§22's locked-dropdown trap).
  **A ROLE THE PERSON ALREADY HOLDS IS NOT AN ASK** — the column gives a role,
  never takes or moves one; without that rule the platform refused its own
  export on 31 of 33 rows. The demo ships the ten names and NO mappings (A4),
  and migration 004 strips `mainbus` from `org.extra` so a client never
  inherits Raya's departments (§45.3's fault, avoided rather than repeated).
- **Picture slides (since v3.18, §50; spec 009):** the review deck can carry
  the custodian's own slides of uploaded pictures. **Nothing stores a SLIDE** —
  `REVIEW.slides` (keyed like `REVIEW.note`) holds a title, an anchor, an
  arrangement and the pictures, and the slide is assembled when the deck opens,
  because the deck is built fresh every time and a stored slide would be the
  exported deck the feature exists to avoid. **Where a picture may go is read
  BACK OUT of the deck**: `anch()` writes `data-anchor` + `data-anchor-label`
  on the slide it names and `deckAnchors()` renders the deck into a detached
  element to build the picker — one list, so a slide added later gets a
  position or gets none, in one place. Inserted BEFORE `deckFitPass()`, which
  clones slides to continue long tables. They belong to the **cycle**:
  archived by `figuresSnapshot()`, cleared by `clearForNewCycle()`. Adding one
  is authorised as `reportState` — the SAME classification as submitting and
  the cycle note, asked on both sides through `canSpeakFor()`; **never write a
  second rule for it**. Pictures are shrunk to 1600px and **encoded as both PNG
  and JPEG with the smaller kept** — a screenshot is smaller as PNG, a
  photograph seven times smaller as JPEG, and the file's own type predicts
  neither. No migration: it lands in the `review` row's `extra`.
- **ONE TABLE, TWO HALVES (§99, amending §53.4):** a project's two kinds of
  evidence are still ONE table on all three project panes, and the SCORE still
  keeps them apart half per SIDE (`projPerf`) — reading them together and
  scoring them together are different questions, and §99 changes neither
  answer. What went is the single **header row**: `Measured as` named the
  delivery kind on a deliverable and the **direction** on an outcome, and
  `Target` (plus `Measured at` on the plan pane) stood empty for every
  deliverable. **A dead cell is the table asking a row a question its kind
  cannot answer.** `dxSplit()` is the ONE builder all three panes call: a band
  opens each half on `--panel`, so a half opens the way a table opens (§41.10),
  and a quiet strip declares that half's columns. **The `#` and the NAME hold
  their position, and the column a score is read from is LAST on both halves**
  (`Reads` on Performance, `Note` beside `Reported` on Reporting) — a score
  column that moves between halves is one nobody can run their eye down. A
  cell is `[label, class, colspan]`, and **the colspan is what lets a shorter
  half end where the longer one does**. Three things go with the split: the
  **Type** column (the band says it — `dxTag()` is deleted, not left unused,
  §24), the **shared numbering** (§53.4 ran it across the table BECAUSE it was
  one list and said so; with two lists, two rows called 1 is the truth), and
  the **paired Add row** (each half's button says only its own name).
  **`Finish` → `Due date` and `Measured at` → `Measure date`**, on the panes,
  the deck and both workbooks — **stored fields keep their spelling**, and the
  workbook writes the new label and READS EITHER (§58, §65). The `"Measured at
  Q4 2026"` pills are left alone deliberately: a column heading is a noun, a
  pill is a sentence. `src/checks/project-tables.py` asserts **the problem, not
  the layout** (§94.8) — no dead cell, each half's colspans adding up to the
  same grid, both halves ending at the same pixel, and the rename at BOTH ENDS
  including both spellings through the real reader; it was proved able to fail
  before it was trusted (§94.5). **A cell holding a CONTROL is answered even
  when it reads empty**, or the check flags the reporting pane it helps most.
  **A HALF THAT IS NOT THERE IS NOT DRAWN (§99.7, reversing the first build the
  same hour):** an empty half first drew its band, its column strip and a
  dimmed *"No outcomes yet"*, on §45.2's rule. Islam: *"the presence of
  outcomes or deliverables that would make the sub table appear or not, not to
  keep tables in place with no need."* **§45.2 is about a FEATURE and this is
  about a PROJECT** — a project with no outcomes is not a broken screen, it is
  a plan that committed to no measurable change. **And the fact I was
  defending was already on the page**: `projPerf()` returns the other side
  whole when a side is empty (63% → 75% with FIN01's outcomes removed), and
  the Performance card already prints `Outcomes —`. **AUTHORING IS THE
  EXCEPTION** — the add row is the only way to write the first row of either
  half, so `dxShown()` takes `ed` and both halves always draw behind the pen
  (§61's fault otherwise). **ONE ANSWER, READ BY BOTH**: `dxHeading()` is built
  from `dxShown()`'s flags, so a section can never name a half it is not
  drawing; `DX_HEADING` is deleted (§24). With neither half the section is
  absent and the milestones table stands alone. **0 of 19 demo projects have an
  empty half**, so the check MAKES the state and asserts against an exact list
  including an empty one (§94.2).
  **READS BECOMES PERFORMANCE, AND A DELIVERABLE'S KIND STAYS IN THE PLAN
  (§99.8):** *"should the user submit % of progress? And Reads is a strange
  title."* The first was **already answered by the plan** — `kind` decides how
  a deliverable is reported (`binary` → a 100-or-0 dropdown, `pct` → a
  percentage box), so a % is available by setting *Measured as*. Nothing built,
  for two reasons worth keeping: **how a thing is measured is a plan decision,
  not a reporting one** (letting the reporter pick lets a unit change how it is
  measured while being measured — §42), and **an *In progress* state with no
  number forces the score to invent one** (§47). The rename is real: `Reads`
  was printed in these two tables and nowhere else, while the SAME 0–100 is
  **Score** on the Key objectives table two blocks up the same page,
  **Progress** on a unit's, and **Performance** on the group's projects table.
  I recommended Score; Islam picked **Performance**, and the cost is recorded
  not re-argued — the pane now carries three words for one number. **Progress
  was never a candidate**: the milestone table below uses it for a STATUS
  (§87's twins). The rename reaches the pane and the **deck**, and
  **the pane's check needed no editing** because it reads the last column's
  label off the page and compares the two halves to each other (§53.5) —
  *a check written against the problem survives somebody changing their mind
  about the wording.*
  **NOT DUE IS A LABEL, NOT A LOCK (§104.8):** the comment over the reporting
  pane said exactly that from the day it was written and the code under it did
  the opposite — `if (notDue)` **replaced** the picker with the words *Not
  asked*, so reporting early (asked for outright: *"they can report on it
  exceptional"*) was the one act the pane refused. **A comment can describe an
  intention the code never carried out, and nothing in a build compares the
  two.** The same gate on Performance printed a dash against a row that HAD
  been delivered early while its 100% went on counting toward the score
  (`projDeliverySide()` averages every deliverable, due or not) — *a figure
  that counts and is not shown is a screen arguing with its own score.* The
  gate moves from **"is this due"** to **"has this been answered"**;
  `notDueCell()` and `reportedAny()` are the one pair the two panes and the
  two tables ask, because four copies of a predicate drift. **THE FIRST CHECK
  PASSED ON A REVERTED BUILD** — FIN01's five milestones are all due, so three
  of the four paths went unmeasured, and §94.2 from the inverse side explains
  why every OTHER assertion stayed green: they ask whether a cell is
  *answered*, and a row replaced wholesale by a word answers every cell. It
  MAKES the four cases now, and each of the three reversions was put back and
  watched to fail before the green run was believed — the third needing its
  own assertion, that **Status and % must agree about whether a row was
  answered**. Deliberately not widened: the unit's tactic table has the
  identical lock and is untouched.
  **THE SCORE COLUMN SAYS WHAT IT HOLDS, NOT WHAT IT IS MEASURED IN (§104.9):**
  `%` is a unit, not a name — it says what the cell is measured in and nothing
  about what it measures, on the one column somebody runs their eye down. It is
  **Performance** on the deliverables and outcomes (*how well*, the word the
  card above the table and the group's projects table already use) and
  **Progress** on the milestones (*how far*). **§99.8's objection to Progress
  expired**: it read *the milestone table below uses it for a STATUS*, which
  was true when that table's only column was `Status` and stopped being true
  the moment the milestones gained a per-cent of their own — the §87 twin is
  gone, so the reason goes with it. `DX_PCT` / `MS_PCT` are declared once
  beside `DX_HEADING`, because the two panes and the deck are **three surfaces
  onto one column** and the third is the one left behind (§59). **The check
  asks for the two names and not for either**, or a build putting one word on
  both tables would pass. Measured at 1920/1500/1280/1000 (§27.1) and in the
  deck **in present mode**, the only place a slide has a width at all (§69): no
  header wraps, nothing scrolls. **Flagged, not changed**: the deck still
  carries a **Due date** column the three panes lost in §104.8 — the ask named
  the tables and the templates, and a column on a projector that is absent in
  the product is a decision, not a tidy-up.
  **AN IN PROGRESS WITH NO NUMBER IS NOT NOUGHT (§104.10):** the box opened and
  nothing else did — nothing said the number was owed, and `statusReads()`
  returned **0** for a wip with no per-cent, so the average COUNTED it: project
  performance 63 → 50 and Execution 49 → 41 **the instant the dropdown
  changed**, before the person who changed it had said anything. §99.8's own
  ruling from the other direction — *an In progress state with no number forces
  the score to invent one* — applied to the state itself. It returns **null**,
  so `sideAvg()` leaves it out the way it already leaves out an unmeasured
  outcome; the row is not forgiven but **outstanding** (`statusPending()`, the
  tally, and *Needs a %* in the same `.missing` a plan uses for an unset
  target). **`x.pct === ""` HAD TO BE NAMED**: `Number("")` is 0, not NaN, so
  an empty box would have gone on reading as a genuine nought through a fix
  aimed at exactly that — a typed `0` still reads 0, and both are asserted.
  `statusGiven()` IS `statusReads(x) != null` now, because two predicates that
  must agree about one row are how *given* and *reads* drift apart.
  **`capExec()` KEEPS ITS `|| 0` ON PURPOSE** — a milestone nobody has TOUCHED
  is Not started and nought is what it is; only one halfway through a sentence
  leaves. **THE PARITY CHECK HAD TO BE REWRITTEN, NOT SILENCED**: §104's
  "nobody's score moves" fixture stripped per-cents and left the statuses,
  which stopped modelling the old formula the moment this landed — it went red
  on all eight capabilities and would have called a deliberate decision a
  regression for ever. It settles every In progress too, and **today's claim is
  asserted separately** (all 18 In progress milestones in the demo carry a
  number, so `pending` is 0 and no existing figure moved).
  **A SUPPORTING FUNCTION SUBMITS, AND EVERYTHING BUT THE BUTTON WAS ALREADY
  BUILT (§105):** `canSpeakFor()`, `CURRENT_REPORT_KEY`, `reportSectionState()`,
  `reportPending()` and **`lib/authorize.js`'s `reportState` case** all carried
  an explicit `fn:` branch — **§71's fault exactly**, the back half built and
  the control never drawn, which is why the dot had been telling a function
  head they owed a submission with nothing that would clear it (§69.9, broken
  by the section that wrote it). **ONE PER FUNCTION, KEYED `fn:<key>`** — the
  shape all five already expect; a second shape would mean a second answer in
  five places. **THE REFUSAL IS ONE FUNCTION FOR BOTH SIDES**
  (`submitBlockers` / `submitRefusal` take a TARGET), because two Submits
  explaining themselves differently is §53.5's drift — and the old handler read
  `UNITS[b.dataset.submit]`, so a function's button wired to it would have
  submitted `undefined` and reported nothing in the way. Two rules stop it: a
  figure at risk with no note (the unit's, with `rowReads()` teaching
  `needsNote()` to read a deliverable and a milestone) and a row that said In
  progress and never said how far (§104.10). **Measured before building: every
  function is blocked by the note rule today, and so is every unit but
  Nigeria** — the demo behaves identically on both sides, which is the evidence
  the generalisation is faithful rather than over-strict.
  **THREE COLUMNS ARE THREE LAYERS, NOT TWO VOCABULARIES (§105.2):** the board's
  function half first got its own column strip and it **collided** — a strip's
  widths come from the table's own `<thead>`, and `DELIVERABLES` alone is wider
  than the Measures column at every width from 1920 down. Wrapping cannot save
  a word that does not fit. A unit's three columns are *judged on · measured ·
  the work*, and **a function has the same three** (key objectives; its
  OUTCOMES, which have a direction, a target and an actual; its deliverables
  and milestones) — so the counts become COMPARABLE down the page and the
  vocabulary is named once in the band, where nothing can collide. **A TABLE
  CELL RETURNS ONE CLIENT RECT HOWEVER MANY LINES IT HOLDS** (§88 somewhere
  new): ask a `Range` over its contents instead, or a detector reports four
  false positives. And `tr.dxband th`'s `nowrap` is right for a short label and
  wrong for a band spanning the table — it pushed the table 8px past its box
  rather than taking a second line. **AND THE SERVER HAD NEVER BEEN ASKED**:
  `test-authorize.js` had no `fn:` submission test at all, because there was no
  control, so no test had a reason to exist — it asks BOTH ends now, or the
  branch could accept anybody and the first assertion would still print ok.
  **AND "1 NEED NOTES" HAD BEEN WRONG SINCE THE COLUMN EXISTED (§105.4)** —
  unnoticed because it was rare, until the function rows put it on seven more.
  `notesOwed()` is one function: two halves of one board saying it differently
  is the fault §105.2 was built to avoid. *A defect can hide behind how seldom
  it is reached, and adding rows is a way of finding one.*
  **ASKED FOR AND NOT BUILT — THE REFUSAL (§104.10):** *"refuse the
  submission"* has nothing to attach to: **a capability's Reporting page has no
  Submit button.** One `data-submit` exists in the whole platform and it is on
  a UNIT; a function's reporting bar carries the tally and *Save draft* and
  nothing else. Worse, **`reportPending()` already returns true for an `fn:`
  target**, so a function head sees the dot saying they owe a submission and
  there is no control that would clear it — §69's own rule broken by the thing
  that wrote it. A function's Submit is a feature, not a fix, and what it means
  (one per function, or one per capability) is a decision. **ANSWERED THE
  SAME DAY, in §105 above:** one per function, and the server had been ready
  for it all along.
  **WHAT A MERGE DOES TO A PLAN ALREADY UPLOADED (§106):** nothing is deleted —
  migration 024 is score-preserving by construction and only `deliverables.due`
  and `milestones.pct` are new, so every existing row has them empty. **TWO
  THINGS CHANGE, AND THE FIRST IS NOT SMALL.** Measured with every milestone
  per-cent stripped (the shape of a tenant running on `main`), **Execution
  rises 8–27 points on all eight capabilities** — today an In progress
  milestone reads NOUGHT and §104.10 made it OUTSTANDING, so it leaves the
  average. Correct, and silent, and *a score that moves for a reason nothing on
  the page states is a score nobody can defend*: the card prints
  **`5 of 12 milestones · 2 not counted yet`**, only when there is one.
  **AND A DUE DATE THAT IS NOT ONE IS FINALLY NOTICED IN A STORED PLAN**
  (§106.2) — the upload has warned since §103 and **nothing ever looked at the
  database**, so a tenant that uploaded before that check is told nothing.
  `dueNote()` names the **value AND the row** ("Pending on Solution design"),
  beside `overrunNote()` whose shape it borrows, with the count on the RAIL so
  the project holding them is findable without opening each (§93.4, one press
  from where the gap is closed). `dueFits()` is the same reader the upload and
  the product already use — a second question would be a second definition of
  "a date". **MILESTONES ONLY**: their date is on that page and the pen edits
  it, so the note points at something fixable; a deliverable's is drawn on no
  pane since §104.8 and naming a bad one would send somebody after a control
  that is not there (§61). **Resolved THERE, never here** — a plan is the
  client's. **Still not run: migration 024 against a real Postgres.**
  **A PROJECT'S FRONT MATTER, AND IT IS NOT A `<TABLE>` (§109):** `start` and
  `end` were stored and shown in **exactly one place in the product — the
  review deck** — so the page that AUTHORS a project could not say when it
  runs. One box, divided: owner · start · end down the left, brief and
  stakeholders as two rows on the right. **A grid of rows, deliberately**: the
  platform sets a global `table { min-width:620px }` so its data tables never
  squash, which makes any small table **overflow its own grid track by 300px** —
  the grid column measured 320px the whole time, and it was found by asking
  `document.styleSheets` what the browser holds (§93.11), not by reading the
  cascade. **BOTH VALUE COLUMNS START AT ONE X** because each column's label
  track is sized to ITS OWN longest label (96px right, 64px left); one width
  would clip *Stakeholders* or waste 40px beside *Owner*. And **a pill's
  leading margin is right in a sentence and wrong as the first thing in a
  cell** — pulled back in `.pfval` only. **THE TIMELINE PILL IS GONE**: it once
  decided how every date was read, §104 ended that, and its one remaining
  effect was to SUPPRESS a true overrun warning on a "By quarter" project whose
  end date is a date; the field and the template are untouched, and the guard
  is a separate decision. **THE CHECK ASSERTS THE TWO THINGS NOTHING ELSE
  WOULD** — that the alignment holds at three widths in both themes (an `auto`
  track reproduces the exact fault: 627 vs 687), and that **the five fields
  WRITE** (§96: an editor wired to nothing looks identical and discards every
  keystroke). **A LABEL WIDER THAN ITS TRACK DOES NOT MOVE THE VALUE COLUMN** —
  both rows stay aligned and the WORD is what clips, so that is asserted with a
  `Range` separately. Plan pane only; the other two panes still show no dates,
  flagged rather than assumed.
  **THE PLAN PEN'S LAST THREE READ-ONLY FIELDS OPEN (§114):** a measure's
  direction and compile rule, and a tactic's quarters — §31 closed them because
  "they change what a figure MEANS", the right worry while the pen could fall
  to the person measured, and §94 gave the pen to the office, so the reason
  expired (§94.15's shape). The vocabulary is the Temple's own `selectOr`
  options, never a second list (§53.5); **a stored value outside the list is
  prepended rather than displayed wrong** (§96.2 from the display side); the
  quarters are `qs()`'s own four marks as buttons, resolved by id (§48.2) —
  and §42 had classified a quarter change as PLAN on the server four versions
  before the screen could make one. `checks/plan-fields.py` presses all three
  and reads the DATA back, both ends (§96, §94.2).
  **A REPEATING PROJECT, AND THE CLEAR BECOMES A DECISION (§115):** Islam's CX
  mystery shopping runs H1 and again H2 — same rows — and *"we don't want
  things repeated in the same project."* The machinery existed POINTING THE
  OTHER WAY: `clearCapability(c,"nums")` wiped EVERY project on every new
  cycle (unseen — the live tenant is still in its first), so a DELIVERED
  project's record would have been erased the day H2 opened. Now each project
  decides: marked `repeats:"cycle"` → archived, cleared, **every date shifted
  by the closed cycle's length** (`shiftWhen()`, `monthsOf()`'s mirror — one
  writer, shape for shape, unreadable shapes returned UNCHANGED, 2-digit years
  staying 2-digit, days clamping to the month they land in); unmarked →
  **figures and notes kept, delivered is delivered**. The mark is a front
  matter row behind the pen, drawn in read mode only when it says something;
  No DELETES the key (§50.6); capPlan on the server, asserted both ends.
  **AND THE ARCHIVE HAD BEEN QUIETLY INCOMPLETE SINCE MIGRATION 024** —
  `figuresSnapshot` still stored a deliverable's deleted `actual` and never
  took a milestone's `pct` (§51.10 in the archive). Fixed. 
  `checks/repeat-project.py` FAILS ON THE PRE-§115 BUILD BY CONSTRUCTION and
  was run against it to watch three failures before its green was believed;
  it turns the cycle through the REAL close/open controls and their confirm
  dialogs, and makes the state, because the demo has no repeating project.
  **STILL BROKEN AND DELIBERATELY NOT FIXED (§99.6):** `projPlanBody` defines
  `sortAttr()` and applies it to NEITHER table, so a project's drag grips are
  bound to nothing — §63's fault on the capability side. Flagged, not fixed:
  what a drop between the two halves means is a decision.
- **A deliverable's due and owner (§53.4, unchanged):** a deliverable has **no
  due and no owner** — it is delivered when the project ends, and the project's
  owner owns it. `delivDue()` no longer exists —
  an outcome keeps `measureAt`, because a measurement time is a real thing
  somebody chose. The fields are gone from the panes, the deck, both `.xlsx`
  sheets, both CSV column lists, the seed and the database (migration 016) —
  **a column the platform no longer reads is worse than no column.**
- **Collaborators on a tactic (since the import template; given a COLUMN in
  v3.18, §50):** `tactics.collaborators` is what `SMPRules.namedOn()` reads to
  decide whether a Contributor may report a line — so **it is the SMO's to
  edit**, behind `mayEditPlan()`, or a unit could grant itself reporting
  rights. `collabNames`/`collabCell`/`collabParse` in `group-render.js` are the
  one place three tables ask.
- **Figure sets (since v3.14, §44; spec 008):** a number can belong to a NAMED
  SET (`group.sets`) rather than to the unit that reports it. `row.src` is
  `{set}` or `{by}` — membership on the FIGURE, so one figure/one set is an
  invariant. Who may pick a set's figures is a **stored security setting** that
  defaults to the SMO and is enforced in `lib/authorize.js`, never by hiding a
  page. A refused claim raises a request (`group.claims`) the SMO answers on
  the cycle page. The unit custodian's per-figure naming (**Strategy › Who
  enters**) is behind `group.naming`, off by default, read on BOTH sides —
  turning it off must never delete a naming. Nothing needs a migration: these
  live in `org.extra`.
- **DB verification loop:** start a throwaway Postgres 16, then
  `DATABASE_URL=... node scripts/test-roundtrip.js` (clean slate PASS, round trip PASS,
  fixed point PASS) and `DATABASE_URL=... node scripts/dev-server.js` + drive the platform
  in a browser, in **both** live and demo mode.
- **TALKING TO THE STRATEGY OFFICE (since v3.26, §97; spec 015):** a bubble in
  the bottom-right corner of every page opens **one running conversation with
  the office**; the office answers from **Setup › Running the cycle ›
  Messages**. It is **§71 finished, not a second feature** — that section built
  the feedback endpoint, the tables, the thread and the rules, and *the box was
  never drawn*; this is that box, reshaped from a form into a conversation, and
  `022-office-chat.sql` drops `feedback`/`feedback_replies` because no human
  could ever reach them (§24). **ONE CONVERSATION PER PERSON IS AN INVARIANT** —
  `chat_threads.person_key` is the primary key — because the moment somebody
  has to decide whether what they are typing is a new item or the same one, it
  has stopped being a chat; the cost is §71's per-item statuses, and **flagging
  is the office's, per-message**, deliberately weaker. *Waiting* and *answered*
  move by themselves (§71: the status you must remember to set is the one
  nobody sets). **WHO READS IT IS A RULE, NOT A MATRIX CELL** (§37, §89):
  `c_chat` is `area:"always"` and the gate is `inOffice()` on the page def
  **and again on the server**; dropping a conversation is the Super user's
  alone. `isSuperRole()` / `isOfficeRole()` in `lib/rules.js` answer of a role
  KEY, so the endpoint never reads thirty tables to ask — and the refusal never
  names the missing role. **NOTHING IN `src/chat.js` EVER CALLS `paint()`**: it
  would throw away the half-typed message four seconds after somebody started
  typing (§35, §71.2, §30.1), so every update writes into the node it is about
  and the composer sits outside the rewritten region — and the outcome sentence
  lives in `box.note`, because the refresh that reports a send would otherwise
  wipe it (§63). **WHERE THEY WERE IS CAPTURED, IN THE NAVIGATION'S OWN WORDS**
  — read off `[aria-selected]`, never off `currentSub`, which is a key; the
  group sits in a DROPDOWN whose `<summary>` carries the selection (§94.6
  again), and a tab's `.vh` half is a status, not its name. `BUILD_ID` is
  stamped by `build.py` out of **`sw.js`'s `SHELL`**, the one string guaranteed
  to change when the built file's bytes do (§91). **THE CORNER IS NOT DRAWN**
  on a projector (CSS, off `present.js`'s own class), from `file://`, or for
  somebody the server refused — and `post()` refuses when there is no server,
  at the one place every request goes through (found by `qa.py`). Proved by
  `src/checks/office-chat.py` (the client half, over HTTP against a stub — the
  feature is invisible over `file://`, §94.11) and `scripts/test-chat.js`
  (the server half, against a real Postgres, signing in as somebody with no
  role because a check that only looks for something PRESENT cannot see a shut
  door, §94.2).
- **THE CORNER MINIMISES, AND A REPLY ANNOUNCES ITSELF (since v3.28, §99):**
  the panel's control is a **minus labelled Minimise**, not a × — one
  conversation per person, permanent, so nothing is ever closed. A reply that
  lands while it is shut gets a **third cadence** (`POLL_WAIT`, 15s) used only
  while the conversation is waiting or holds an unread, back to 180s the moment
  it is answered — plus a one-shot ring on the bubble, and nothing under
  `prefers-reduced-motion`. **§97.4 IS REVERSED**: nothing about where somebody
  was is captured, sent, stored or drawn — `whereNow()`, `navWord()`,
  `ICON_PAGE`, `BUILD_ID` and the `sw.js` build stamp are all gone, and
  **migration 023 drops `page`/`target`/`cycle`/`build`** (§53.4). The
  composer's footer sentence went with it, because a sentence that is merely
  stale is worse than none.
- **THE CHAT HAS A SWITCH, AND POLLING WAS THE REAL COST (since v3.27, §98):**
  five controls in a **Settings dropdown on the Messages page header** (§90's
  shape, never a second Setup page — §32) — on/off, Live/Relaxed, the promise
  the panel shows, screenshots, and email-when-away. Stored in `GROUP.chat` →
  `org.extra`, so **no migration**; `SMPRules.chatCfg()` is the ONE thing that
  decides what an absent key means and `chatBeat()` the one that turns
  Live/Relaxed into milliseconds. **A value put back to its default DELETES
  its key** and the last key leaving deletes `GROUP.chat` (§50.6 — a reader
  that creates what it looked for made every save carry a phantom change).
  **THE SERVER REFUSES `say` AND `reply` WHEN IT IS OFF**: with the corner not
  drawn, nothing in the product can reach them, which is exactly why they are
  guarded — a switch that only hides a control is decoration (§42, §44).
  **OFF NEVER DELETES A CONVERSATION** (§44) and **the Messages page stays in
  the rail**, or the only way to turn it back on would be to turn it on first
  (§61's trap). **Replying goes off with the chat** — a reply nobody can open
  is written into a room with no door. **AND MESSAGES ARE NOT WHAT COSTS**: one
  poll was **14 database round trips**, ten of them `ensureReady()` re-running
  the schema and both migration phases on *every request*. It is memoised per
  process now (**14 → 5**), the client **stops polling entirely while the tab
  is hidden**, and the idle beat is 180s. The two real limits are a licence and
  a database, not a quota: **Vercel Hobby is not licensed for commercial use**,
  and **Neon's free compute never autosuspends while anything polls**. Proved
  by `checks/office-chat.py` §6 (which passed for the wrong reason first — it
  pressed the bubble to open a panel that was already open, closing it) and by
  `scripts/test-chat.js`.
- **A FAILURE MODE DESIGNED TO BE INVISIBLE TO THE USER MUST STILL BE VISIBLE
  TO THE OPERATOR (§123):** §112.2 made every assistant failure land on the
  chat as it worked before — message stored, a person answers — which is right
  for the asker and left the office unable to tell **no API key, a rejected
  model, an unreachable provider and a genuine decline** apart: all four are a
  message in the inbox and no explanation. The diagnostic **walks the chain and
  reports where it STOPS**, because *"it is not working"* sends somebody to look
  at everything and *"the API key"* sends them to one page. **It makes a REAL
  call** — a key can be present and refused, a model name valid and retired —
  and **stores nothing**, because it answers about this moment and a stored
  answer goes stale invisibly (§35). Its last step separates *reachable but
  declined a question the corpus covers* from *could not be reached*, which
  would otherwise both read as "not working". **THE VERCEL TRAP IS NAMED IN THE
  ROW ITSELF**: a deployment only has the environment variables that existed
  when it was BUILT, so a key added afterwards needs a redeploy.
- **IT RENDERED PERFECTLY AND DID NOTHING (§123.4):** the button's branch went
  into the settings menu's **`change`** listener rather than its `click` one —
  anchored on a `<select>` that genuinely belongs there — and **a `<button>`
  never fires `change`**. Present, styled, and `elementFromPoint` returned it,
  so every assertion short of PRESSING it passed. Found by pressing, then by
  instrumenting the click: no request, no console error, and the button's own
  label unchanged, which is what says *the handler never ran* rather than *the
  request failed*. §96's family, fifth time.
- **THE SETTINGS RUN ONE WAY, AND A STATUS IS NOT AN EXPLANATION (§127):**
  asked to rethink the chat settings' sequence, titles and explanations, and
  settled from a mockup made of THAT VERY PANEL (§41.9) — **882px → 478px**,
  same seven controls, nothing removed. **THE ORDER WAS NOT ONE**: the master
  switch sat THIRD, under the assistant, which is a decision ABOUT the chat
  rather than one above it, and the two email rows sat five apart. It descends
  from *does this exist* to *a tuning knob* — Chat · Promise · Screenshots →
  Assistant (+ Test) → Handover email · Away email → Reply checks — and **the
  KEYS DO NOT MOVE** (§30.2), or every tenant that had touched a setting would
  have it reset for a word nobody reads. **EVERY LINE OF PROSE BECAME A
  TOOLTIP; "No one is set" DID NOT** — it is a fact about right now, not a
  description of how a setting works, and behind a hover somebody turns
  Handover email on, nobody is chosen, and nothing ever says so (§35, §45.2).
  **A TAP OPENS IT** (hover does not exist on a tablet, and the notes now carry
  the whole explanation), reusing the platform's own `.tip` rather than drawing
  a second one (§53.5) and **scoped to this panel**, because `.tip` is used
  everywhere and widening it is a change to pages this was not asked to touch.
  **AND THE BUBBLE HAD TO STOP HANGING OFF THE SIDE**: centring a 264px note on
  a 14px mark puts most of it outside a 392px dropdown, and seven marks sit at
  seven x positions — `position:static` hands it to `.chset-row`, where it
  spans the row, inside the panel **by construction rather than by arithmetic**.
  **AND THE CHECK COULD NOT FAIL WHEN FIRST WRITTEN**: it measured the ROW
  against the panel, and a row is inside its own panel by definition. A
  `::after` has no `getBoundingClientRect` (§53.7), so the box is computed from
  **whichever containing block `position` actually gives it** — following the
  CSS instead of assuming which rule is live.
- **A DEPLOYMENT CANNOT SAY WHICH KEY IT HAS, AND MUST SAY ENOUGH (§126):**
  the diagnostic read *switch WORKING · knowledge base WORKING · key PRESENT*
  with the provider still refusing it — and **"rejected" and "not the key you
  made" are two different errands**, the first to Google's console, the second
  to Vercel (a deployment only carries the variables that existed when it was
  BUILT). Its **length and first four characters** settle it and are not a
  secret: an AI Studio key is `AIza` plus 35, so any other shape is a different
  KIND of credential and no amount of looking at Google explains it. **Read
  AFTER §124's trim**, asserted, because that ordering is invisible and would
  break silently — and asserted in `test-assistant.js`, never the browser
  check, whose stub supplies the steps and would never run it (§94.2).
- **A DEBOUNCED SAVE WITH NO FLUSH LOSES THE LAST 800ms (§126.1, RECORDED NOT
  FIXED — CLOSED BY §138, v3.51, 2026-08-27):** press a switch, leave the page
  150ms later — **saves sent: none**,
  database unchanged, screen still showing the new value. `sync.js` is the
  autosave for the WHOLE platform, so branding, terminology and the access
  matrix have the same hole. **It was NOT the fault being chased** (the
  diagnostic said the switch had saved), and it is written down rather than
  fixed on the way past: changing the save path for every page in the product
  while looking at something else is what rule 1b exists to stop. **§138
  closed it as its own aligned change**: `flushLeave()` on
  visibilitychange/pagehide sends anything waiting (keepalive under 64KB,
  plain fetch over — that limit stated, not glossed), touches no save
  bookkeeping, skips while a save is in flight, and `checks/save-flush.py`
  reproduces the loss end to end on the pre-§138 build.
- **SAYING NOTHING IS NOT A NEUTRAL OUTCOME (§125):** with the assistant on
  and a working key, Islam got *"nothing happens at all"* — and that was §104
  working as designed. A handoff wrote NOTHING, on sound reasoning (a sentence
  would read as an answer and drop the conversation out of the office's queue
  with nobody coming), and what was never asked is what that looks like from
  the other end: **identical to the assistant never having been asked.**
  §123's fault one layer in, on the side §123 did not touch. It is **one line,
  in the PRODUCT's words and never the model's** — §104 is untouched, because
  that rule is about the model's sentence never standing in for an answer and
  `answered` still decides — and **the thread stays WAITING**, so the queue,
  the Waiting tab and the email chase are unchanged. **NARRATED, NOT SPOKEN**:
  no name, no time, no bubble, because the two sides of the conversation are
  the person and the office and a handoff is neither; **and no way out on it**,
  since that control is for a confident WRONG answer and here somebody is
  already coming (§62, §110). **A HANDOFF IS A DECISION; A FAILURE IS NOT** —
  no key, a refusal, a timeout, malformed JSON and the switch off all go on
  writing nothing at all (§112.2), because telling somebody the assistant
  considered their question when it never saw it is a lie the operator cannot
  see. `handoff` is a COLUMN (026) for §104's own reason, and `HANDOFF_LINE`
  lives in `lib/assistant.js` because two files need it (§53.5). **AND ONE
  ASSERTION WAS THROWN AWAY FOR BEING UNFALSIFIABLE** — *"never the model's own
  words"* asked of the stored row, when `ask()` already blanks the reply, so it
  passed however the caller behaved; asked of `ask()` now (§94.5). **THE CHAT
  PANEL HAS NEVER BEEN IN THE CONTRAST SWEEP** (§94.11 — invisible over
  `file://`), so the line was measured by hand: 5.00 light, 6.61 dark, at
  `--fs-small` because `--fs-micro` is for breadcrumbs and this is a sentence.
- **A TEST THAT READS A SETTING IT DOES NOT CONTROL IS NOT A TEST (§125.4):**
  `test-chat.js` failed five assertions after a dev-server restart and passed
  on the next run, twice — which looks exactly like a race and is not one.
  **With the assistant on, her message comes back with a second row beside it
  and her conversation is no longer waiting**, so five assertions about the
  human path fail for a reason none of them is about; it passed second time
  because that file's own settings section clears the switch on its way past.
  It forces the switch off at setup and restores the tenant's settings in the
  `finally` — **including ABSENT, which is not `{}`** (§50.6).
- **A STATUS WORD IS A CLAIM, AND PRESENCE IS NOT PROOF (§124):** §123's own
  screen said *The API key · **WORKING*** directly above the provider's *400:
  API key not valid* — two rows contradicting each other, both written by the
  diagnostic. `configured()` is `!!apiKey()` and never claimed more; **the word
  claimed it on its behalf**, because the state and the word had been one fact
  (`ok` → *working*). Right for every step whose check IS the thing, wrong for
  the one step that can only see presence — so **a step now chooses its own
  word** where the default would overclaim, and that row reads **PRESENT** with
  the detail saying the next step is what answers it. §35 with the sign
  reversed: that one is absence reported as *none*, this is presence reported
  as proof. **AND THE REFUSAL BELONGED TO THE KEY, NOT THE MODEL** — Google
  answers a bad key with **400**, not 401, so the generic branch reported it
  under whichever step happened to be running; `looksLikeBadKey()` reads 401,
  403 **and the provider's own words**, and the row is *The key itself*, naming
  the three causes that produce a correct-looking key the provider refuses (a
  pasted newline, a website/IP restriction on a server key, the Generative
  Language API never switched on). **TWO OF THOSE ARE NOW IMPOSSIBLE**:
  `apiKey()` trims and strips surrounding quotes, because *a value that only
  works when it is clean should be cleaned by whatever reads it* — done in the
  reader, never as an instruction to go and check. The check asserts *these two
  must DIFFER* (§113.8 does not apply — the fault it guards is the two
  collapsing into one word), and was watched to fail first: 3 failures against
  the previous build.
- **A CHECK THAT ASSERTS AGREEMENT PASSES WHEN BOTH SIDES VANISH (§113.8):**
  the knowledge base's contents are derived, and the check asserts one link per
  section — so when a fix pushed `undefined` into `secs` and the tour section
  left the page entirely, the count was sixteen and sixteen and it went GREEN.
  **Agreement is preserved by removing both sides**, which is the blind spot of
  every *these two must match* assertion. `checks/tour.py` caught it because it
  asserts PRESENCE. Neither alone was enough: **one check guards the
  relationship, another guards that there is anything to relate.** (The bug was
  `var` — the unshift sat twenty lines above the assignment, the declaration
  hoists and the value does not, so it pushed `undefined` in silence.)
- **A MIGRATION THAT READS A COLUMN `schema.sql` NO LONGER CREATES IS BROKEN ON
  EVERY FRESH DEPLOYMENT AND PERFECT ON YOURS (§113.7):** `024-one-row-shape`
  read `deliverables.actual` in four UPDATEs before dropping it, and
  `schema.sql` had stopped creating it — so an empty database could not even
  PARSE the statement (42703) while an existing tenant migrated flawlessly.
  **Production was never at risk and no new client could have been set up**,
  and nothing anybody was testing against would show it, because everybody
  tests against a database that already exists. **THE MIRROR OF §33.5**, which
  recorded the fault invisible to every fresh-deploy test; this one was
  invisible to every existing-database test. Fix: `ADD COLUMN IF NOT EXISTS`
  before the reads, so a fresh database gets NULL in a table still empty at
  pre-phase and the DROP takes it away again — idempotent on both. **RUN THE
  ROUND TRIP ON A VIRGIN DATABASE AFTER EVERY MERGE**, not only after touching
  the schema yourself: this arrived from somebody else's branch.
- **THE CONVERSATION YOU HAVE OPEN NEVER LEAVES THE LIST (since v3.31, §105):**
  Islam — *"I replied and the chat disappeared from all places."* **Nothing was
  deleted** (the only DELETE is the Super user's drop): replying marks a
  conversation ANSWERED (§71) and the inbox opens on WAITING, which excludes
  answered ones — **so the act of replying removed the row from the list the
  office was looking at**, while its thread sat open beside it, and it stayed
  gone because the page always opens on Waiting. **TWO CORRECT DECISIONS
  MEETING**: neither is wrong alone, and what was never asked is what they do
  to each other. **THE FILTER IS NOT CHANGED** — Waiting has to mean Waiting at
  thirty conversations — the conversation you are IN is exempt, and only that
  one; a search still hides it, because typing is asking to see something else.
  **AN EMPTY LIST SAYS WHERE EVERYTHING WENT**: *"Nobody is waiting"* was true
  and was a dead end, and the Flagged tab was saying something FALSE (*"No
  conversations yet"* with conversations present) — **an empty state describes
  THIS filter, never the whole product**. **AND A HANDLER THAT COMPARES
  IDENTITY ASSUMES IT KNOWS EVERY ELEMENT IT WILL EVER SEE**: the tab row lit
  by `b === tab` across every `[data-chtab]`, so the new way-back shortcut
  would have lit itself and un-lit all three tabs. Lit by VALUE now, scoped to
  the tab row.
- **A FIX TESTED AGAINST THE WRONG BYTES LOOKS EXACTLY LIKE A FIX THAT DOES NOT
  WORK (§105.6):** `build.py` writes `src/strategy-management-platform.html`
  and `scripts/dev-server.js` serves the shipped
  `strategy-management-platform-vX.Y.html`. The §105 reproduction was re-run
  after the change and showed the identical failure; the next move would have
  been to hunt a second cause that was not there. **Copy the built file before
  driving the dev-server**, every time.
- **THE ASSISTANT ANSWERS FIRST, AND OFF IS THE DEFAULT (since v3.31, §104;
  spec 016):** Islam — *"I need a switch to turn off AI response and just keep
  it to the SMO inbox."* `CHAT_DEFAULTS.assistant` is **false**, and
  `chatCfg()` reads it and `notify` **the other way round from the other four**
  — only an explicit `true` turns them on, so a stale value cannot switch it on
  by accident. **OFF MEANS THE MODEL IS NEVER CALLED**, in `say`, on the
  server: with the assistant off there is nothing on screen to hide, so the
  guard IS the feature (§42, §98.2) — asserted as a CALL COUNT OF ZERO, never
  as an absent button. **ORDER IS THE ROBUSTNESS ARGUMENT**: the message is
  inserted and the thread is already waiting BEFORE the model is asked, so no
  key, a refusal, a timeout, a malformed answer and the setting off all land on
  exactly the chat as it worked before — four failure modes, injected
  separately, because a build that lost the degradation passes every happy-path
  assertion. **THE HANDOFF IS A FLAG, NEVER A SENTENCE** (`{answered, reply,
  source}`), or the thread reads as answered and drops out of the queue with
  nobody coming; an `answered` with an empty reply is treated as a handoff,
  checked rather than trusted. **EVERY ANSWER CARRIES A WAY OUT**, because the
  spec covers the assistant KNOWING it cannot answer and the harder case is it
  being confidently wrong — and it sends an ORDINARY MESSAGE, so the office
  reads why. **`bot` IS A COLUMN, NEVER A RESERVED `by_key`** (§87: a name is
  never an identifier), and it is `from_office` TRUE + `bot` TRUE, because the
  assistant answers on the office's behalf and the mark is about HOW that side
  was written. **`GEMINI_API_KEY` IS READ IN ONE PLACE** and no SDK is added
  (§72, §97.5 — this is one POST); **`GEMINI_MODEL` and `GEMINI_ENDPOINT` are
  environment variables**, the first because provider names are retired on
  somebody else's schedule and the second because a check must MODEL the
  provider rather than branch around it (§100.3).
- **A LIST OF EXCEPTIONS IS A LIST SOMEBODY FORGETS TO ADD TO (§104.7):**
  `chatSet()` read `key === "promise" ? string : boolean`, so the second string
  setting would have stored `true` for whoever was chosen — silently, with the
  picker then showing nobody. **Take the type from the DEFAULT**, which cannot
  be forgotten.
- **THE KNOWLEDGE BASE'S MISSING HALF, AND IT IS DATA (since v3.31, §103):**
  it explained how things WORK and barely how to DO them — four mentions of
  pressing anything in 693 lines of `PAGE_INFO` — so **`src/recipes.js` holds
  43 task recipes as an ARRAY, not another `kbSection()` call**, because
  `scripts/extract-kb.js` reads the same array into **`db/kb.json`**: the words
  a person reads and the words the assistant answers from are the same words
  (§42, applied to prose). `{pillar}` is substituted at render time (§65).
  **`who` IS RELEVANCE, NEVER PERMISSION** — a question with two true answers
  is two entries sharing a `q`, and BOTH are shown, because the knowledge base
  is everyone's (§37); **the mark goes on the AUDIENCE, never on the
  duplicate**, or a two-track question renders as one heading twice.
  **`--check` fails when the corpus is out of step**, the discipline `build.py`
  already has; output is deterministic so an unchanged run is an empty diff.
  **The TOC was a hand-kept second copy and was ALREADY WRONG** — nine
  sections, eight links, the register missing since the day it was added — so
  it is derived now (§42, found only because seven groups were being added).
- **YOU CANNOT STUB A FUNCTION THE FILE DECLARES (§103.4):** a function
  declaration **hoists over anything a `vm` sandbox supplies**, so a stub
  passed in at construction is overwritten the moment the file is evaluated.
  Three times in one hour — `L()` and `kbRecipes()` (the fix is to feed them
  the DATA they read: `LABELS`, `RECIPES`) and `kbSection()` (no data to feed,
  so **replace it AFTER evaluation**, which works because `renderKB` looks it
  up at call time). The third **silently captured nothing** and would have
  shipped a corpus missing a third of itself — caught only because the
  extractor **throws when it captures nothing** rather than writing what it
  has (§54.5, earning its place within minutes). And a file evaluated only for
  something it declares early may be allowed to throw partway, provided **what
  you came for is asserted instead** — the stronger check, since it fails if
  the declaration ever moves below the throw.
- **THE WORLD IS TWO ALLOW-LISTS, ONE BEHIND THE OTHER (§102.4):**
  `worldOf()` does not pass the group through — it **lifts named keys off it**
  (`sets`, `claims`, `naming`, `focusOff`) — and **`W()` behind it names the
  keys it keeps**. A group setting must be added in **BOTH**, in the same edit
  as the rule that reads it, and forgetting either fails **silently and in the
  safe-looking direction**: the reader sees `undefined` and answers the
  default, which for a switch means *on*. Nothing throws, the page renders, the
  control does nothing. §44 recorded this once as a client/server difference;
  this was two filters in the same function on the same object, and only
  driving the real page found it — unit tests build worlds by hand and pass
  either way.
- **FOCUS MEASURES HAVE A SWITCH, AND IT HIDES RATHER THAN FORGETS (since
  v3.30, §102):** Islam — *"off means it disappears across the platform"*, and
  *"off and on brings back history yes"*. `cycle.focus` keeps every mark (§44,
  third time: a switch that destroys data is a delete with a friendly label).
  **Stored as an ABSENCE** — `GROUP.focusOff` exists only while off, so *on* is
  what an unasked tenant already has and turning it back on DELETES the key
  (§50.6); only `true` switches off, so a stale `false` cannot hide it. **Named
  `focusOff`, never `focus`**, because `CYCLE.focus` is the marks map one level
  away (§87's twins). **ONE GATE, because there was already one chokepoint**:
  seven surfaces read focus and all seven go through `isFocus()`.
  **`focusMarked()` is the RAW map with exactly one caller** — the Focus
  measures page's own ticks, or turning it off would look like losing them.
  **THE SWITCH IS NOT A BIGGER MARK**: marking is the CEO's and the SMO's
  (§37), the switch is the SMO's alone, classified `setup` beside `naming` —
  asserted as a PAIR, because locking something down proves nothing unless the
  right thing stayed open. **And the page carrying it stays reachable while it
  is off** (§61's trap: otherwise the only way back on is to turn it on first).
- **REORDERING IS THE UNIT'S, THE WORDS ARE THE OFFICE'S (since v3.30, §101,
  reversing §94.3):** `mayArrange()` in `lib/rules.js` is **its own rule, never
  a hole in `mayAuthorPage()`** — widening the authoring gate to let a custodian
  reorder would have handed them the words too, which is the fault §94 existed
  to fix. `ARRANGE_ROLES` is `owner · custodian · fnhead` — **the roles that
  HOLD the thing** (Islam: *"only custodian and BU owner"*, and of a function's
  Projects pane, *"same"*, which is its head). A Contributor never; a group or
  company CEO only if they hold one of those, because **reaching a unit is not
  holding it** (§37). The grant must still say edit, so this narrows and never
  widens. **`same(idsOf(a), idsOf(b))` IS AN ORDERED COMPARISON** — that one
  line is the whole of why §94.3's drags moved on screen and were refused on
  save — so `reordered()` answers **by SET** (never by sorting, or one list
  holding an id twice compares equal to another holding it twice in the other
  order) and an **all-null pair is never a reorder** (§96.4's ID-less group
  objectives). It classifies as `arrange`; anything else about the list is
  still `unitPlan`. **THE CONTROL SHARES THE PEN'S SLOT AND NEVER SITS BESIDE
  ONE** — §94.15's argument holds in the direction that still matters — and
  `paneActs()` is the ONE builder, because that line was written twice (§53.5).
  **Islam picked the up-down arrows over the grip mark** that would have matched
  the handles it turns on: recorded, not re-argued, and the cost is that a
  generic glyph puts the whole meaning in the `title` and `aria-label`.
  **Nothing was needed for Performance or Reporting — the order IS the array.**
  Proved by asking the screen AND the shared rule for five viewers and
  asserting BOTH ENDS (§94.2), by PRESSING the button (§70, §93.4), and by
  forcing each half false to watch the checks fail (§94.5).
- **THE REGISTER STOPS BEING A FORM (since v3.39, §116):** Islam's six —
  keep my column choice and make all-on neat; edit in a dialog; *"they said"*
  becomes a button at the top that opens the pending people one after another;
  Add opens it too; drop the row count and the quick filters; make the top panel
  concise. **ONE THING FOLLOWS AND IS WHY THEY HANG TOGETHER: the table no
  longer edits anything** — every collision this register has had (§110.1's
  *+ role* under the frozen Cancel, §110.8's fields over their neighbours, the
  Add row's boxes under the wrong headings) was a control clicked inside a 158px
  cell, and none survives the move. **THE SAME `data-` ATTRIBUTES**, so moving
  the form changed where it is drawn and nothing about how it saves — but
  `fieldWire` and the control wiring now take a ROOT, or re-running `wire()`
  binds a second handler to the page behind (§24, §47.2). **`paint()` REPAINTS
  THE DIALOG TOO**, one line at its end rather than one per handler: the
  dialog's controls are the register's and all end in `paint()`, so *+ role*
  pressed inside it changed nothing at all. **`NEWDRAFT` IS A PERSON BEFORE IT
  IS ON THE REGISTER** — not in PEOPLE, but `personBy()` answers for it, so Add
  and Edit are one form. **AND THE FIELD BEING TYPED IS COMMITTED BEFORE THE
  PRESS**: fields write on `change`, which for a text input means on blur, so
  the last box typed into has not been written when somebody reaches for the
  button — a mouse click blurs on the way past, which is the almost-always that
  hid it.
- **A MARK BELONGS INSIDE THE BLOCK IT MARKS (§116.4):** the declaration note,
  the duplicate mark and the Official BU disagreement were each placed NEXT TO a
  value, and `.val` and `<b>` are `display:block` under §88's clip rule — so each
  put its row at 51px against its neighbours' 39px. Three times, in one section.
  One glyph inside the value's own line, the sentence on the hover, the full
  words in the queue: `◎` a declaration, `‖` a collision, `≈` a resemblance,
  `≠` a disagreement.
- **THE COUNT AND THE QUEUE ARE ONE LIST (§116.2):** `attentionQueue()` is what
  the button counts AND what it opens — a count that cannot take you to what it
  counts is a count that makes work (§16.7's rule applied to a notice). **One
  entry per person, not per problem**; worst first then by name, so it is stable
  between two people; **and it walks the list it started with**, because fixing
  somebody removes them and a recomputed queue renumbers under whoever is
  working through it. **Units with no custodian cannot join it** — not a person,
  so there would be nobody to open; it keeps its own line (§93.4).
- **ONE LINE ABOVE THE TABLE, AND A DIALOG THAT WAS WASTEFUL RATHER THAN DENSE
  (§122):** the badge said who you are (the chrome says it on every page) and
  the count said how big the register is (**the table under it is that** — §116
  had already dropped the second copy of that count and kept this one, and
  *keeping one copy of something nobody asked for is still keeping it*). The
  fourth ask was not a removal and is the only one with a constraint in it:
  **Passwords was already in `.hright` and was WRAPPING**, and dropping the
  badge still left the row wanting 1107px. Two labels are terser and the search
  flexes from 160px — one line to **1280px** now, from 1512px. **THE CUSTODIAN
  MARK MOVED RATHER THAN WENT**: it is the one outstanding thing on that page
  that is not a person, so it cannot join the Attention queue (§116.2, nobody
  to open) and would have died with the line — a chip on the row, on the warning
  ground because a grey word among six controls is furniture, **drawn only when
  there is one** (§41's budget). **AND THE DIALOG WAS NOT DENSE, IT WAS
  WASTEFUL**: 482px of content, of which a whole 56px row was EMPTY (nine
  fields do not divide by two) and the tallest single block was a paragraph
  repeating itself on every person opened. Three columns divide nine exactly and
  the sentence became a `title` on a value that LOOKS un-editable — 482 → 337px,
  no scroll to 640px tall, **and narrower too (860px)**: narrower and shorter are
  usually a trade and were not here, because the height was waste. The width is
  marked on the **overlay**, never loosened on `.modal`, which every dialog
  shares, and comes off in `closeModal()` (§116.6's one door). Steps down are
  **3 → 2 → 1**, never 3 → 1, or the scroll comes back on a narrow laptop.
- **A CHECK THAT ARGUES WITH A DECISION IS ONE THAT GETS DELETED (§122.6):**
  §121.2 gave every Setup pane a **sticky page title**, from another branch the
  same day, and three things in §122 met it. **The bold had to MOVE**:
  `cfgHead()` now drops `.secttl` where the pane's name already says it, so
  bolding the old element alone would have styled something the register no
  longer renders (both carry 700 now, or a page whose heading genuinely differs
  reads in two weights). **§122's one-line header is SUPERSEDED** — §121.2
  deliberately did not pull the controls into the sticky header, because a
  non-sticky row slid out from under the pinned name, which is a better reason
  than the one that put them together; what survives is the half that was ever
  about the controls, that they are ONE row with Passwords on it and the table
  follows them. **AND THE RAIL STOPPED BEING THE RIGHT COMPARISON**: it is a
  max-height over a LIST, so on a tall window its content ends before its cap
  and the two legitimately differ — the pane still takes the rail's expression,
  but what is ASSERTED is the window, at both ends.
- **A CAP MADE OF A GUESSED CONSTANT GOES STALE SILENTLY (§122.5):** the
  register's table was `calc(100vh - 300px)`, and the 300 was a guess at an
  alarm-chip row, a filter row and a count line — §116 removed two and §122 the
  third, so the table ended **141px above the fold at every height** while the
  rail beside it correctly ended 20px short. **It takes the RAIL'S OWN
  expression now** (`.panefill`), because the two halves of the split start at
  the same y and a second way of saying "as tall as the window allows" is
  §53.5's drift — and the box FLEXES into what is left, which is what makes it
  right when the header takes a second line and any constant would have had to
  guess. `min-height:0` on **every link in the chain**, or a flex child refuses
  to shrink below its content (§100.5, another tree). **Only this pane is
  capped**: every other Setup page is a form, and capping those invents a
  scroll nobody asked for. **THE TITLE IS BOLD ON ALL TWELVE** — one page's in
  a different weight from eleven others reads as a mistake, not emphasis.
  **AND TWO ATTEMPTS TO BUY BACK THE 20px IT COST BOTH MADE IT WORSE**: a flex
  container **decides to WRAP from an item's hypothetical size** and only
  shrinks afterwards, so `min-width:0` on `.hright` changed nothing; and
  **`flex-basis:min-content` on a WRAPPING container is its widest ITEM, not
  the sum**, so the row sized itself below its own content and broke into two
  lines 150px EARLIER. Both reverted, the 1280 → 1300 trade recorded and the
  check's threshold moved — *a check left asserting a number that is no longer
  true is worse than the twenty pixels.*
- **THE CHECK MEASURED THE INNER BOX AND PASSED ON THE BUILD IT WAS WRITTEN TO
  REJECT (§122.4):** it asked whether **`.hright`** was one row — green on the
  previous build at every width, because **`.phead2` wraps too**, so when the
  controls stop fitting beside the title the whole block drops them onto a line
  of their own and the inner box honestly reports one row while the header is
  two. **Assert the box somebody can SEE**, and keep the inner one under it
  because that is the one that carried the wrapped control: with both, the old
  build fails 12 times (§94.5). Two more: **one row is not one `top` value**
  (different heights, so a naive count reported three rows on a row that was
  plainly one — cluster by the middle), and **the whole row is invisible over
  `file://`** (Passwords is `live`, so the first version measured five controls
  and called it a pass, §94.11).
- **A LOCAL ALIAS IS INVISIBLE FROM ANOTHER FILE, AND ONLY OVER HTTP (§116.9):**
  `attentionOf()` in `config-data.js` spelt half its declaration sentence with
  `whereLabel`, which is a **`var` inside `renderPeople()`** in
  `config-render.js` (§93.12's swap, made once rather than at five call sites).
  Every check was green: the crash needs a declaration AND a register placement
  that disagree, so it is invisible over `file://` (`SAIDWHERE` only ever comes
  from a server, §94.11) **and the ternary short-circuits for anybody the
  register has not placed** — which was every person the queue's own check had
  made (§94.2 from the inside). It is `roleWhereLabel` on **both** halves now:
  **a sentence that names two places and compares them must spell them the same
  way**, or a match reads as a difference; `placeLabel` stays right for the Unit
  CELL, where there is nothing to compare against. **AND THE COUNT AND THE QUEUE
  HAD DRIFTED THE OTHER WAY**: the Overview's password row counts
  `passwordReach()` (§89 excludes the office) and the queue's `nopw` counted
  everybody, so a Super user with no password put a row in the queue that
  whoever works through it has **no control to clear** — §16.7's fault inside
  §116.2's own list, asked through `mayIssuePasswordTo()` now. The check asserts
  the **relationship** (the button carries its own queue's length; every person
  the Overview counts is findable in that queue) rather than the chip string
  §116 removed — §51.11, loud this time only because the chip row is **gone**
  rather than merely renamed.
- **EVERY WAY OUT OF A DIALOG IS THE SAME WAY OUT (§116.6):** the × and Escape
  closed the overlay directly, which was fine when it held a wizard and not when
  it holds a form with `PDLG`, a row snapshot and a draft behind it. **And the
  body is emptied on close** — a form left in the hidden overlay collected a
  second handler on every repaint, for ever (§3.2: hidden is not gone).
- **THE UNIT CELL SAYS WHERE, THE ROLES CELL SAYS WHAT (since v3.34, §110):**
  Islam, of the picker's second half: *"choose where is very strange sentence.
  make it Unit and it's already in a cell what am I missing here?"* **Nothing,
  and it was worse than redundant** — `personAtChoices()` offers the group,
  every unit, every function and every company, item for item the list
  `roleWheres()` drew from, and `grantPersonRole()` WRITES IT BACK on every
  grant (`p.unit` / `p.fn` / `p.company`). The second dropdown asked a question
  the first had already answered and then forced its own answer onto it. §69.1's
  split survives in the half that mattered; the DUPLICATE goes, with
  `roleWhereCell`, `select.rolewhere` and `.rolewhy` (§24). **IT WAS ALSO
  UNREACHABLE:** `.cfg table td` is `white-space:nowrap` (§88), so the cell laid
  its two controls SIDE BY SIDE — the second started 150px into a 158px cell,
  ran 133px past its edge and landed under the Email field, which took every
  click. Present, enabled, correctly sized and hitting something else (§93.4,
  third time) — `elementFromPoint` at its own centre returned the Email input,
  and it only ever bit the roles with a real choice, because §92 grants a
  one-destination role on the pick. **A PICK THAT CANNOT LAND SAYS SO**, in two
  sentences because there are two ways out, and **`roleWheres()` remains the
  only definition** of what may be held where — `roleAtWord()` derives even the
  wording from it. **EITHER HALF FINISHES IT** (`tryGrantRole()`, called from
  the role select and from the Unit select while a refusal stands): a refused
  pick leaves that role SHOWING, so picking it again fires no `change` at all.
  **A RETIRED ROW IS OFFERED NOTHING** — the grant used to be written while the
  row read *No role*, leaving a unit pointed at somebody who cannot sign in.
  **CANCEL RESTORES THE POINTERS, NOT THE ROLE LIST**: granting an owner
  OVERWRITES whoever held it, so undoing by revoking left the unit headless —
  `ROWHELD` copies both maps whole.
- **PUTTING THE CURSOR IN A FIELD MUST NOT MOVE THE ROW (§110.7):** *"once I
  open the edit of a line the line jumps to the first line."* The cursor, not
  the repaint — the register is its own scrolling box and a plain `focus()`
  lets the browser scroll the field into view, hauling row 20 of 33 from y=638
  to y=105. `focusNoScroll()` is declared ONCE for both pens (§85).
  **`no-jump.py` had been green throughout**: it opens a row and then measures
  repaints, so the press that opens one was never measured (§94.2) — and one of
  its own trials was keyed on `[data-prole-kind]`, a selector that has never
  existed, behind a silent `if(!el) return` (§51.11).
- **`max-width:100%` ON A FIELD IN AN AUTO-LAYOUT TABLE DOES NOTHING (§110.8):**
  a percentage resolves against a containing block the cell has not settled, so
  the browser treats it as `none` — which is why an open row's fields painted
  21px over their neighbours. A px cap changes nothing either (§93.10 recorded
  that once already). **`width:100%` with `min-width:0`** is the fix: a definite
  width stops the field contributing its intrinsic size to the column. **The
  measure is that nothing MOVES** — every content column now holds its closed
  width, where the table used to grow 188px the moment a pen was pressed, and
  the check asserts that no content column GROWS rather than that none changes.
- **THE ONBOARDING TOUR IS TOLD WHERE THE PERSON WORKS (since v3.30, §107;
  spec 017):** a first-sign-in guided tour on **demo data**, two stories
  (strategy custodian; unit/function owner), told on a unit or a function —
  whichever the person actually holds their role over. `src/tour.js` mounts to
  `<body>` like the chat corner, **never calls `paint()`**, **holds selectors
  and not nodes** (re-anchored by `TOUR.onPaint()` at the end of `paint()`),
  and **navigates by pressing the platform's own `[data-u]` / `[data-s]` /
  `[data-sub2]` controls** rather than keeping a second copy of the shell's
  navigation. Roles come from the platform's own `personRoles()`, never from
  `SMPRules` directly — `world()` is the ONE builder and its comment records
  what happens twice in an afternoon otherwise. **A STEP NAMES A CONCEPT AND A
  PLACE SPELLS IT**: `resolve()` turns `strategy`/`plan` into `fnstrat`/`proj`
  for a function and DROPS the step a place cannot show (a function has no
  SWOT), so the counter counts what is actually walked (§61). **AND THE
  TARGETS SAY `$tab` / `$sec`** rather than repeating the key — the first
  build resolved the fields and left the selectors spelling a unit's keys, so
  a step disagreed with itself and lit nothing on four of eight steps.
  **A TENANT'S LABEL IS NEVER INFLECTED** (§107.8): `L("pillar","bu")` is
  *"Pillars"*, so `+ "s"` printed *the pillarss* — there is no singular to
  reach for, and every sentence takes the label exactly as given. **COPY THAT
  NAMES A PLACE IS A FUNCTION** (§64 again), or a constant evaluated before
  hydration holds the baked example's vocabulary on a client's deployment.
  Memory is `localStorage` (*never*) and `sessionStorage` (*skip for now*, so
  a new sign-in is a new session), and **a throwing store reads as
  already-marked** — a tour nobody can dismiss is worse than no tour.
  **AND IT TAKES YOU TO THE MAIN PAGE FIRST (§107.14):** replaying from the
  Knowledge base drew the welcome card OVER the Knowledge base, and worse,
  `setMode("demo")` ran AFTER `own` was resolved — so a key from the CLIENT'S
  tenant was looked up in the DEMO tenant's navigation, which matches only
  because this deployment IS the worked example. **Switch the mode, THEN read
  who and where, THEN check the place is reachable** (`if (!destBtn(own)) own
  = firstDest()`), and the welcome step carries a destination. The check had
  asked whether the tour was RUNNING and stopped there — **"it started" is not
  "it went anywhere"** (§94.2).
  `src/checks/tour.py` walks **every story as every role** and was **proved
  able to fail first** (§94.5) — the first deliberate break set a value to
  what it already was and caught nothing, which is §94.5's own example.
  **`own_it` is not a function custodian for checking purposes**: they hold it
  on the IT unit AND the IT function, so the walk measures the unit twice
  while looking like it covers functions — `fn_mkt2` is the true case.
- **THE CORNER MINIMISES, AND THE INBOX FOLLOWS THE WINDOW (since v3.29,
  §100.4, §100.5):** **the bubble is not drawn while the panel is open** —
  it sat underneath in the same dock column, pushing the panel a bubble's height
  off the bottom of the window, and the fix is CSS off the class the opener
  already sets, never a second piece of state. **Clicking outside minimises**,
  on `pointerdown` (a panel that lingers until the mouse comes up reads as
  having missed the press), and **TWO THINGS ARE NOT "OUTSIDE"**: the dock, and
  an open modal — a screenshot opened FROM the panel renders into the
  platform's own overlay, so without that exception looking at the picture you
  just attached puts the panel away behind it. **Escape is on the DOCUMENT** —
  it had been wired on the composer alone and did nothing once focus moved to
  the attach button (present, plausible and silent). **Minimising is never
  discarding** (§100.2), so the check types half a sentence and reads it back.
  **`.chinbox` IS `calc(100dvh - --chin-top - 20px)`**, floor 340px, with
  `min-height:0` on the queue, the thread and the thread's body or a grid/flex
  child refuses to shrink below its content and pushes the fixed height back in
  by another road. **NOT §28.3's LOOP, and the difference is the point**:
  nothing ABOVE the box moves when the box resizes, so the measurement is
  stable in a way a max-height fed by a height never was (the condense-on-scroll
  that made the top move went in v3.3). **THE ASSERTION IS THAT IT MOVED**, not
  that it fitted — every other assertion in `checks/office-chat.py` §8 passes on
  a tall window with the fixed 593px back in place, which is how this shipped;
  proved by putting it back and watching §8 fail. **AND THE STUB HAD TO GROW A
  CONVERSATION**: the office's page had never once been measured with a thread
  open, and twenty messages rather than three, or a box that CANNOT scroll
  reports as one that NEED not.
- **Email (since v3.23, §72; the credential moved in §97.5):** **`lib/mailer.js`
  is the only place `RESEND_API_KEY` is read**, and nothing it returns contains
  it — `api/mail.js` and `api/chat.js` both call it. §72's rule is unchanged;
  the address it points at moved, because the alternative was a second copy of
  the credential handling. **The ADDRESS is `SMP_MAIL_FROM`
  in the environment** (tied to the domain verified with Resend — a deployment
  decision); the **display name, reply-to, kicker and footer are `GROUP.comms`**,
  which rides in `org.extra` and needs no migration. `SMP-Project-Folder/src/mail.js`
  (`MAIL.html`) builds the message, and the **preview on Setup › Communication is
  that same call** — drawn into a **shadow root, never an iframe**, because the
  CSP says `frame-src 'none'`. Email is not the web: tables not divs, every style
  inline, colours literal, and **no data-URI image** (Gmail and Outlook block
  them, so the tenant's mark cannot travel in a message). **The accent is a FILL,
  never type** — as the kicker it measured 3.94:1, §38.4 for the sixth time — and
  the ink over the tenant's bar is DERIVED, so a light bar does not silently
  produce white on white. `scripts/test-mail-contrast.js` reads the builder's
  OUTPUT and tracks the ground with a stack of `<td bgcolor>`; run it after
  touching `mail.js`. "Present" ≠ "accepted" ≠ "verified": the page reports only
  what was actually asked, and matches a bad key on Resend's MESSAGE because
  Resend answers an invalid key with **400**, not 401.
- **A LINK IN AN EMAIL HAS NOTHING TO BE RELATIVE TO (§176, spec 027):**
  Islam pressed the button in a message he had sent himself and macOS answered
  **"The application can't be opened. −50"**. The link was
  `smp-orpin-tau.vercel.app` — what he typed, mailed verbatim. **A BROWSER
  FORGIVES A MISSING `https://` BECAUSE IT HAS AN ADDRESS BAR TO GUESS WITH; AN
  EMAIL HAS NO BASE DOCUMENT**, so the mail client hands the raw string to the
  operating system, which looks for a file of that name. The button was dead for
  **every recipient**. `SMPRules.webUrl()` is the ONE rule — in `lib/rules.js`,
  because the composer COMPLETES and the server REFUSES, and a screen that tidies
  a value the server judges differently is §42's drift with an inbox on the end
  of it. **COMPLETING IS NOT GUESSING**: `https://` is added only where what is
  there is already a host (a dot, no whitespace, no scheme), and everything else
  — a bare path, a sentence, `javascript:` — is refused rather than decorated,
  because inventing an address is how a message goes out pointing somewhere
  nobody meant. **ON BLUR, NEVER ON `input`** (§35), and **written into the
  field**, because seeing the scheme appear IS the explanation (§124). The
  refusal is at SEND, before the confirmation — the last moment it can be
  stopped — and **Send me a copy carries the identical one**, or a copy that
  quietly dropped the button is a preview of a message nobody can send (§53.5).
  **What the server guard does NOT claim is stated**: the html is posted whole
  (§72.3), so it checks the link the composer declares, not every href in that
  document. **TWO MORE FOUND BY LOOKING**: the test email shipped `href="#"`
  whenever the platform did not know its own address (a quiet no-op on a page,
  the same −50 in an inbox), and **the two emails disagreed about where the
  platform IS** — `commsShape()` said the gate, `chat.js` said the platform
  (§53.5 again); the pathname wins and chat.js asks rather than keeping a copy.
  **AND NO CHECK HAD EVER PRESSED EITHER SEND BUTTON** — `data-mailtest`
  appeared nowhere in `checks/`, because the whole surface is the empty state
  over `file://` (§94.11), and **a dead link renders perfectly**. *The symptom a
  person reports is the one they can SEE: two rounds went into proving the send
  worked before the screenshot showed the email had already arrived.*
- **A TEST COPY IS A SEND, AND IT SAYS SO (since v3.56, §146):** two kinds of
  email leave this platform and only one was recorded — `send` wrote a row and a
  row per recipient, while `test` (*Send me a copy*, and the test send on Email
  settings) sent a **real email through the same builder** and wrote nothing at
  all, so from the record those emails had never happened. **Nothing was ever
  lost**: `messages` sits outside the state graph with no foreign key, so the
  `TRUNCATE … CASCADE` on every save cannot reach it, and no `DELETE FROM
  messages` exists in the product. The test row is written **before** the send
  (a half-succeeded send is the case a record exists for) and **a failed test
  keeps its row**, saying 0 of 1. **`kind` is ONE column holding the word**
  (§104.7, §142) and **NULL is a real send**, so nothing is backfilled — proved
  against a tenant rolled back to its pre-§146 shape. **The mark goes in the
  audience column**: beside the heading it pushed the frozen first column onto a
  second line (§88, §116.4), and a test copy has no audience for that column to
  print. **Delete reaches test copies and nothing else** (Islam's B, chosen from
  two drawn scopes with the cost of each stated): the record of what the
  business was sent stays whole, and a real send carries no control rather than
  a disabled one. **The guard is asked twice on purpose** — `mayDestroy()` draws
  it, the server asks `isSuperRole` again — because the endpoint's own gate
  means *"Communication is the SMO's"* and this one means *"destruction is the
  Super user's"*: two questions with the same answer today, and §94's drift the
  day the first is widened. The kind is read off the **stored** row. **And
  `SYNC.mailTest()` did not forward the body** (§142's fault, found by looking
  this time): every test copy would have stored an empty one.
- **THE EMAIL GREETS ITS RECEIVER (since v3.50, §135; spec 021):** a per-message
  switch on Send a message opens each email *Dear Ahmed,* — off by default, the
  word editable per message, **Send a message only**. **EVERY RECIPIENT ALREADY
  GOT THEIR OWN EMAIL** (§74.3's one-message-per-person loop), so nothing about
  how many go out changes; what changes is that they stop being IDENTICAL, so
  the builder leaves a **marked region** and the server fills it once per
  recipient off the STORED register (§74.2). `GREET_OPEN`/`GREET_CLOSE`/
  `GREET_NAME` and `greetFill()` live in `lib/rules.js` because **both sides
  need the same three strings**; `src/mail.js` writes them, `api/mail.js` reads
  them. **THE REGION IS DELIMITED, NOT MERELY TOKENISED**: a token typed into
  the body can never be substituted, and an empty name removes the WHOLE
  paragraph — never `Dear ,`. The name is `firstName()` = `nameWords(…, 1)`,
  **the register's own reader** (§93.8), so a compound first name is kept whole
  ("Abd El Moniem", never "Abd") and a typed `known` wins. **ONE LINE, NO
  PROSE** (Islam, correcting a two-line first draft): `.imp-row` + `.cfg-lab` +
  `.minisw`, the platform's own switch row, with the word box BEFORE the switch
  so the switch never moves (§41.8) — two lines had also made the greeting read
  as a bigger decision than the button row under it, which is one. Six words
  survive under the preview (*Everyone sees their own name here.*), **outside**
  the email, because a badge inside would be a line nobody receives. `greet
  TEXT` on `messages` and `message_drafts` (027), **one column holding the
  word** and never a boolean beside it (§104.7); NULL is off, so nothing is
  backfilled. **AND `SYNC.mailSend()` NAMES EVERY FIELD IT FORWARDS**, so
  `greet` was silently dropped and the RECORD would have said no message ever
  greeted anybody — found by asking what the page POSTS, not by reading it.
  **AND THE GREETING MUST SIT OUTSIDE `data-mail-body`** (§142.8): the message
  is typed INTO the preview and read back with `innerText`, so a greeting
  emitted inside that div is absorbed into the body by the first keystroke —
  the email then carries it twice and the stored message holds a name nobody
  typed. Measured, not reasoned; every existing assertion passed while it was
  broken, because none typed into the body with the greeting on and then asked
  the DATA.
- **SEND A MESSAGE OPENS ON WHAT WENT (since v3.51, §137):** Islam: *"the
  opening page ... should be a dashboard of what was sent, to whom, how many
  people ... and when I say create a message it takes me to another tab ... and
  when I finish and send it it should take me back to the dashboard and show me
  that the message was sent there."* **TWO SUBTABS** — *Overview* (his word;
  the Setup rail has a page of the same name one group above, recorded rather
  than quietly changed, because they sit at different levels) and *Write a
  message* — in the platform's OWN `.secrow`, the one Import & archives and
  Figure sets already use (§46.2): never a button that navigates, because
  going back to the record must not mean abandoning what you were writing.
  **NOTHING NEW IS COMPUTED**: every send already wrote the row, and this is
  §95's own `renderDraftList()` / `renderSentList()` moved out of the header
  dropdowns they were hiding in — one renderer, so the list cannot say two
  things depending on where it is drawn. **A SEND LANDS ON THE RECORD** and the
  composer is EMPTIED, which is also how §136's rule survives: the send cannot
  be repeated by one press, by construction rather than by a flag. **A partial
  failure lands there too** (the message went to most people and the record is
  where the failures are named); **only a send that never happened stays put**,
  with the message still loaded and the bar red. **AND THE TWO FETCHES WERE
  GATED ON `#msgsend`** — the Send button, now on the other tab — so on the
  Overview neither list was ever asked and both said *Asking…* for ever: §93
  and §51.11 exactly, a gate keyed on markup that moved, failing silently and
  in the safe-looking direction. Gated on `#msgover`, the thing that draws
  them. **Found by driving it, not by reading it.**
- **THE ACTION IS MADE OBVIOUS, AND BOTH CHOICES ARE ISLAM'S (§144.8):** a tab
  reads as *where you are*, not as *something to do*, so the page's own purpose
  had no loud control. Three placements were drawn in the real page; he picked
  **above the lists** over the header, and **"Send an email"** over *Write a
  message*. **Both costs were stated before he chose and are recorded rather
  than re-argued**: the button SCROLLS AWAY on a long record (§95's own fault),
  and the platform now has three nouns for one thing — page *Send a message*,
  tab *Write a message*, button *Send an email* (§87's twins, in vocabulary).
  **DRAWN ONLY ON THE OVERVIEW** — a button offering to take you where you
  already are is a duplicate, not a choice (§94.15) — which holds by
  construction because it lives inside `#msgover`, and is asserted at BOTH ENDS.
  **AND THE CAPTURE LIED TWICE BEFORE THE COMPARISON WAS FAIR**: an element
  screenshot DISPLACES the sticky rows inside it (shooting `.setuppane` dropped
  the tab row from every option), so the viewport is shot and cropped to the
  pane's measured box; and the tab row styles its own buttons, so option B's
  fill had to be forced — which is itself a cost of B, named rather than hidden.
- **THE BAR REPORTS, AND MOVES ON (v3.50, §136 — SUPERSEDED BY §137):** Islam, using the
  product: *"When I send I don't get any verification that the message was sent
  and the page stays the same view."* Both halves true, and two faults. **The
  outcome was drawn in the failure-neutral voice** — `.why`, 12px, the page's
  quietest grey — because `reallySend()` works out `ok: !j.failed`, stores it,
  and **nothing ever read it**: the error path goes through `say()` and turns
  red, the success path repaints and the repaint drew that span plain. It reads
  the flag now, in `--good-tx`/`--bad-tx` at `--fs-note` (the first build
  reached for `--fs-small`, which is the 12px it already was — the check caught
  it by asking for a size worth READING rather than for a token name).
  **AND THE LOUD CONTROL STILL SAID NOT-SENT**: the orange button read *Send to
  76 people* and was live, one press from sending the whole thing again — §95
  put a confirmation in FRONT of the send *because it cannot be recalled* and
  then left the button loaded. It becomes **Write another**, never a disabled
  Send left lying there (a dead control in the loudest slot is furniture, and
  *Sent* on it beside *Sent* in the outcome is §87's twins). **`sent` IS ITS
  OWN FLAG**: a refused request and a partial delivery both read `ok:false` and
  only one must lock the button — a partial send has already reached most of
  the list, so one press would give those people it twice. **BOTH BUTTONS ARE
  DRAWN AND ONE IS HIDDEN**, because the way back must not repaint: the message
  is typed INTO the preview, so a `paint()` on the first keystroke rebuilds the
  contenteditable and the caret dies mid-word (§35, §71.2) — `sendmsgTouched()`
  is two `hidden` flags and nothing to rewire (§24, §47.2), called from every
  surface that changes the message **or who it goes to**. Without it the
  composer is a dead end (§61): the only control on offer CLEARS, so somebody
  fixing a typo to re-send would have to throw the fix away to get Send back.
  **Write another keeps the AUDIENCE** — the recipients are usually the same
  list and re-picking seventy-six people is real work.
- **A CHECK MUST BE ABLE TO STAND IN FRONT OF THE PROVIDER (§142.6, §100.3
  again):** `SMP_RESEND_ENDPOINT` joins `GEMINI_ENDPOINT` as an environment
  variable defaulting to the real service, because **a test double behind an
  `if` in `lib/mailer.js` would be a second code path shipping to production**.
  What each recipient was actually sent is the whole of what spec 021 claims,
  and the only way to know it is to catch the messages on the wire.
- **PWA (since v3.1, §26):** `manifest.webmanifest`, `sw.js` and `icons/` at the
  repo root; `vercel.json` sets the content types, and `scripts/dev-server.js`
  carries the same list so it can be tested locally. The worker caches the shell
  and **never `/api/*`**.
- **Clean URL (since v3.9, §35.6):** the platform is served at **`/raya-trade`**,
  not at its versioned filename — a Vercel rewrite maps the tenant's name onto
  the file. Three files carry that mapping and must stay in step: `vercel.json`,
  `scripts/dev-server.js` and `sw.js` (which caches the **tenant path**, since a
  worker caches by request URL). From `file://` there is no server to rewrite,
  so the gate uses the real relative path there.
- **Multi-tenant (§36):** not built, and deliberately not scaffolded. When it
  comes, use **one Postgres schema per tenant** (`SET search_path`) rather than
  a tenant column — person keys are short and global (`smo`, `ceo`), so a column
  forces composite keys through `credentials` and `sessions`. Read §36 first.
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
```bash
cd SMP-Project-Folder/src
python3 build.py     # assembles strategy-management-platform.html (must be byte-identical to the shipped vX.Y file)
python3 qa.py        # walks every page as every viewer, reports console errors (needs Playwright + Chromium)
python3 checks/attention-dismiss.py # every attention item can be ANSWERED, on the box it
                                # is about: one item per kind (five of six made, §94.2),
                                # the ring measured as PAINT not as a class, one press
                                # clearing the queue AND the count AND the button, and
                                # moving a dismissed seat bringing it straight back (§190)
python3 checks/people-dialog.py # the register reads and the dialog writes: the queue,
                                # Add, and neat with every column on (§116, over HTTP) —
                                # §8 covers dismissing a declaration (§180): outstanding
                                # counts and queues and wears a SOLID ring, answered does
                                # neither and wears a DOTTED one, the claim stays readable
                                # either way, and both rings are proved DRAWN rather than
                                # tofu boxes (ink alone cannot say — an absent glyph
                                # renders a rectangle that has ink of its own)
python3 checks/register-header.py # one line above the table and a dialog that fits the
                                # window — the HEADER's height, not .hright's (§122)
python3 checks/role-picker.py   # giving somebody a role: every control PRESSED,
                                # both ends asked, and the absences asserted (§110)
python3 checks/strategy-split.py # the Strategy | Reporting halves: the cell pressed
                                # open AND closed, both ends each time — and since §145.9
                                # the .pptx download asserted HIDDEN on every surface while
                                # the dormant builder is still proved by a direct call
python3 checks/report-saves.py  # reporting REACHES THE STORED PLAN and schedules a save, on
                                # a unit, a capability function AND one that plans in pillars
                                # — over HTTP, because a save cannot be seen over file:// at
                                # all; plus Save draft answering rather than sitting on
                                # "Saving…" (§183)
python3 checks/project-dates.py # a project's Start and End are PICKED as `Jul 26`, and the
                                # overrun warning reads them the platform's way — an EXACT set,
                                # because Date.parse("Jul 26") is 26 July 2001 and any
                                # "something overran" test passes on the old reader (§179);
                                # plus the type column unchipped on all three panes, both ends
python3 checks/refusal-keeps-work.py # a refusal costs the row it named and nothing
                                # else (§184): one refused row among three, the banner
                                # naming it, the button PRESSED, both fills untouched and
                                # a second post ACCEPTED — and the other end, a refusal
                                # with no row address offering no put-back. The stub runs
                                # the REAL authoriser, because a canned 403 would be a
                                # fiction about the one thing under test
python3 checks/submit-gate.py  # Submit is shut until the report is complete and the
                                # plan holds no gaps, with the reason on hover; Save
                                # draft and Submit both LOCK the report (controls
                                # actually disabled, never a class) and one Reopen
                                # unlocks either (§220, §221)
python3 checks/tactic-proration.py # a tactic's OUTCOME is measured against its own
                                # window, not the year (§250): the share asserted as
                                # AGREEMENT with a month count the check works out for
                                # itself, the exact fraction (a target of 12 over
                                # Apr-Sep reads 10, never 9.96), a whole-year tactic
                                # asserted UNCHANGED, only Sum prorating, both panes
                                # driven, and §2b guarding the index-leak that
                                # `.map(measureScore)` would reintroduce
python3 checks/ytd-proration.py # YTD is measured against the part of the year that has
                                # PASSED (§239): the review point is a month and the
                                # office picks it; Sum prorates and Latest must not; the
                                # TARGET is prorated, never the ratio (a made-up ≤ row
                                # reads 125%, where a divided ratio reads 150%); the
                                # stored `progress` is asserted UNCHANGED beside the new
                                # score; and every deck row is counted against its own
                                # header, because dropping a column from a header and not
                                # from the row is this change's easiest mistake
python3 checks/deck-figures.py   # a figure is read against what it is measured by
                                # (§254): the benchmark asserted as AGREEMENT with
                                # measureDueLabel and never as a literal, every
                                # tight-unit case INCLUDING the two that must not
                                # change, every stored figure byte-identical after
                                # building every deck (§96.2), §254.2's three states
                                # MADE and the row put back, and the slide order with
                                # the two pillar headings asserted different — 33 red
                                # on the build before
python3 checks/deck-dividers.py # the group's mark and the deck's four blue
                                # section dividers (§259): the blue asserted as AGREEMENT
                                # with `--panel` and never as a hex — it REBRANDS the
                                # tenant mid-run and asserts the dividers followed — the
                                # SWOT hues stripped on the divider AND kept on the
                                # category slides, no footer mark on a divider AND one on
                                # every content slide, a pillars function's two AND a
                                # capability function's none, the state MADE for the
                                # guards the demo cannot reach, and the upload driven with
                                # a real PNG and read back. 22 red on the build before;
                                # every probe degrades, because its first two runs there
                                # DIED and reported six failures of twenty-two (§215)
python3 checks/deck-blank-slides.py # a table with no rows is not a slide (§253):
                                # every deck swept through the builder its own Present
                                # button would call, the state MADE on a business unit
                                # (§94.2) and put back again (§113.8), a unit keeping the
                                # aspiration it never asked to lose, the headline slide's
                                # two shapes at both ends, and the Retail pointer cut with
                                # the FEATURE asserted still to answer — 11 red on the
                                # build before, its first failure naming the four blank
                                # slides Islam reported — and §6 covers §253.3, the one
                                # reader Present, Manage slides and the anchors all ask,
                                # with the CAPABILITY deck asserted unchanged beside it
python3 checks/one-line-titles.py # a title is one line and the box says so (§255):
                                # a stored value carrying blank lines drawn as ONE
                                # line on a unit AND a function, asserted as
                                # agreement with a break-free clone of each box and
                                # never as a pixel count; a pasted value read back
                                # from the DATA; and both ends — a rows-2 paragraph
                                # box keeps its breaks (5 red on the shipped build)
python3 checks/deck-outcome.py  # the presentation reads what was reported (§252): the
                                # tactics slide's nine columns, its figures asserted as
                                # AGREEMENT with the Performance page rather than as
                                # literals, a tactic with no outcome untouched, "Not
                                # reported" where a figure is owed, and every count and
                                # the note rule agreeing with the rule behind them —
                                # 19 red against the shipped pre-§252 file, and it asks
                                # for the two shared readers BY NAME first, or a build
                                # without them dies and reports zero failures (§215)
python3 checks/reported-note.py # a reported note is NAMED as one (§255): the note
                                # keyed and the description left plain — a build that
                                # named both closes nothing and passes every "the note
                                # is named" assertion — the row reporting NOTHING drawing
                                # no key, the key DRAWN rather than merely present, the
                                # width unchanged at every width the table fits today
                                # (the promise Islam chose this on), the contrast read
                                # with the sweep's OWN arithmetic, and a pillars FUNCTION
                                # asserted to use the same word. It MAKES the state: 0 of
                                # 84 demo tactics carry a note, so every assertion here
                                # passes on a build that lost the feature. 16 red before
python3 checks/gap-walk.py      # the band's chips and Next gap actually go somewhere:
                                # a unit AND a function, as the filler AND the office,
                                # every place the band names reached (§177.2)
python3 checks/viewer-line.py   # the Viewing-as line: the roles and where each is
                                # held, of EVERY person — no em-dashes, the seat never
                                # repeated, and the whole line on a hover (§178)
python3 checks/viewas-fresh.py  # a view-as session starts where their session would
                                # start (§237): the switch rebases on the server's
                                # graph, the first save under the view carries only the
                                # view's own act, and the refused way home keeps the
                                # work — against a stub whose dataset MOVES mid-run
python3 checks/milestone-fill.py # a milestone is filled, and a bounded role fills only
                                # its own (§177): every red Missing the page prints is one
                                # the count knows about, the month panel escapes the table's
                                # scroll box, every pick read back from the DATA, and the
                                # project beside his stays shut — both ends, three viewers
python3 checks/unit-before-number.py # the unit is picked BEFORE the number (§251): the
                                # picker drawn on a row with no target on all four
                                # surfaces, the unit held alone in this year's target,
                                # the row STILL saying Missing (the one cost), prose
                                # never read as a unit, the workbook's Value/Unit pair
                                # a fixed point, and fill mode asserted UNCHANGED —
                                # proved able to fail twice (16 red / 6 red)
python3 checks/gap-fill.py      # fill the gaps (§145): the third toggle where it belongs
                                # and nowhere else, fill mode's fields AND absences, every
                                # press read back from the DATA, the pending chip and the
                                # office's tick, the dash, and the Submit refusal
python3 checks/owner-picker.py  # an owner is picked from the register, not typed: all five
                                # fields PRESSED through the real popup and the state
                                # graph read back, both ends each time (§130.1)
python3 checks/rail-standard.py # one item still gets the rail, on a unit AND a function —
                                # it MAKES the one-pillar unit, the demo has none (§130.2)
python3 checks/band-corner.py   # the pinned title's corners, measured in PIXELS because a
                                # DOM probe calls the broken build clean (§130.3, §53.7)
python3 checks/no-jump.py       # nothing moves the register under you — the act of
                                # OPENING a row included, since §110.7
python3 checks/plan-builder.py  # building a plan ON the platform: the door, the chooser,
                                # the band's map, every row form asked of the DATA, and the
                                # empty-state fixes — proved able to fail twice (§129)
python3 checks/project-custodian.py # a custodian per project (§147): the Project owner's
                                # project takes their figures, the one beside it takes
                                # nothing, and a milestone owner is a Contributor who
                                # reports nothing until the row is opened — both ends,
                                # three viewers, proved able to fail
python3 checks/access-header.py # the matrix header: two lines at four widths, centred,
                                # BOTH rows pinned while the rows scroll, and no column
                                # offered to a role that could never hold it (§174)
python3 checks/stay-put.py      # a refresh stays where you are, and a NEW session still
                                # opens where §94.6 says (§173)
python3 checks/safety-banners.py # the page warns BEFORE a save can be lost (§258):
                                # the tab asks the server about its own page since it
                                # loaded (the stub records the ask), a landing by
                                # somebody else is drawn and NAMED, never twice, Dismiss
                                # hides it, Reload & keep mine POSTs this tab's change
                                # first and reloads only when it landed (a 500 keeps
                                # the page and §171's banner), the version caution
                                # outranks it, both themes measured, and file:// draws
                                # nothing and asks nothing — 20 red on the build before
node scripts/test-safety-peek.js # ...and the server half against a real Postgres: who
                                # else, when, the asker excluded, a function under
                                # fn:<key>, and every malformed ask falling through to
                                # the ordinary read
python3 checks/save-said.py     # a save that FAILS says so on the page: a server
                                # error naming its status, an unreachable server, a
                                # remembered refusal, and demo data — seven states
                                # through a stub that can be told to fail (§171)
python3 checks/setup-sticky.py  # a Setup page that FITS does not scroll, and nothing
                                # pinned ends up behind the chrome — over HTTP with a
                                # conversation open, because the Inbox's own two headers
                                # do not exist over file:// (§167)
python3 checks/scoring-bands.py # the scale is the tenant's: add, remove and recolour a
                                # level, every control PRESSED and BANDS.bands read back,
                                # both ends each time (§168)
python3 checks/perf-line.py     # the Performance line: Report, Presentation and Bands
                                # on the tab row, three bands, the hover bubble on
                                # hover AND focus, and nothing over the pinned title (§163)
python3 checks/squeezed-rail.py # below 820 the rail reads ACROSS on both sides, and the
                                # demo banner's invented-content line is gone (§162)
python3 checks/table-fit.py     # the plan tables FIT the pane at every width — never
                                # "and it scrolls" — on a unit AND a function, with the
                                # 620 floor still in force on a wide window (§158)
python3 checks/email-link.py    # the link that LEAVES, read out of the html posted to
                                # /api/mail — never the value in the box, which looked
                                # right the whole time; both send buttons, both ends of
                                # the refusal, and both emails' destination (§176)
node scripts/test-push.js       # a box with no tab open (§231): a throwaway HTTPS
                                # server stands IN FRONT of the real push service, so
                                # the encrypted body and the VAPID header are read off
                                # the wire — needs a real Postgres, no network
python3 checks/office-chat.py   # the chat's client half — serves the built file over HTTP,
                                # because the whole feature is invisible over file:// (§97.9)
python3 checks/welcome.py       # the welcome screen (§148): three viewers over HTTP, every
                                # row asserted against the function its destination page
                                # calls, every door pressed and read back, and the absences
                                # — and since §159 the way OUT: outside the list's column,
                                # last in the wrap, spanning both, and the fill at both ends
python3 checks/setup-rail.py    # the Setup rail fits the window, every entry is reachable
                                # by scrolling the LIST, and the cap does not move --chrome-h
                                # (§101.5 — that last one is what licenses the cap at all)
python3 checks/cycle-board.py    # every subject that reports has a row, the functions are
                                # in ONE list under one band, and the headline counts each
                                # exactly once (§244, §245)
python3 checks/hide-slide.py    # the office hides a slide and the projector skips it (§256):
                                # every headline number byte-identical either side of the
                                # press (§246's question, answered), the eye HOVERED and
                                # pressed, a picture anchored to a hidden slide still there,
                                # a hidden table taking its continuations, the emptied key
                                # DELETED, the last slide standing refused, the custodian
                                # seeing the marks and getting no control — and the editor
                                # and the projector proved to build ONE deck (§256.2).
                                # 33 red on the build before; every probe degrades (§215)
python3 checks/notes-slide.py   # the notes slide appears when somebody wrote a note — and
                                # whitespace is not a note, on all three deck shapes (§246)
python3 checks/setup-overview.py      # the Overview agrees with the pages it summarises; it
                                      # MAKES the state, because the demo tenant is all-clear
python3 checks/setup-overview-live.py # ...and its three server-backed rows, over HTTP, where
                                      # they exist at all (§101.12)
python3 checks/setup-search.py  # the rail's search: typing NEVER repaints, a repaint keeps
                                # the filter, and a match inside a FOLDED group is findable
                                # (§108.13, §108.14 — all three fail silently)
                                # setup-rail.py also measures every rail GLYPH against a
                                # character guaranteed missing: a mark that is MAPPED and
                                # not DRAWN ships as a blank box (§52, §120.2)
python3 checks/setup-header.py  # the page's controls share its pinned line, the counts and
                                # the SMO pill are gone, the matrix's two header levels stack,
                                # and a function's focus mark is written and shown (§130)
python3 checks/send-overview.py # Send an email opens on the record, writing is the second
                                # subtab, and a send LANDS back on the record with the
                                # composer emptied — the send that never happened is the
                                # one case that stays put (§144). §6 covers the test copy:
                                # marked in the AUDIENCE column, every heading still ONE
                                # line, and Delete drawn for the Super user and on test
                                # copies only (§146)
python3 checks/email-greeting.py # the greeting row is ONE line with no prose, the switch does
                                # not move, and what the page POSTS names NOBODY — the server
                                # fills it per recipient (§135, over HTTP)
python3 checks/setup-pages.py   # every Setup page is named ONCE and in the rail's own word,
                                # and the name and the table head stay on screen (§121)
python3 checks/save-fidelity.py # WHAT THE SCREEN HOLDS IS WHAT THE SERVER HOLDS
                                # (§210): real controls driven — typing with the
                                # pen open, a dropdown, adding and removing a row,
                                # reporting a figure — then the server's copy is
                                # compared with the screen's. A change the diff
                                # fails to NOTICE is silent data loss, so this
                                # asserts AGREEMENT, never a literal (§94.8)
node scripts/test-graph-diff.js # the change list on its own: only what changed
                                # travels, applying it to a DIFFERENT target leaves
                                # that target's other work alone, a removal is not a
                                # null, and an unknown path is refused (§210)
python3 checks/enter-commits.py # Enter commits a growing one-line box instead of
                                # inserting a newline, and a rows-2 area keeps its
                                # paragraph key — both ends (§229)
python3 checks/fn-ko-edit.py    # a function's objectives are written at the page's
                                # width (§226): the editing table in a band on BOTH
                                # formats, the Unit column writing the stored target,
                                # a wrapping name that writes the DATA, Led by opened
                                # for the office and refused to everybody else — both
                                # ends — and the unit side untouched, measured
python3 checks/fn-pillars.py     # the two supporting-function formats draw ONE Overview:
                                # asserted as their AGREEMENT, never as a list of headings;
                                # every press read back from the STORED function; the
                                # absences asserted on the CARDS (the line above the page
                                # names all three, so a text search passes on a broken
                                # build); a weight surviving the round trip; and a UNIT's
                                # page AND workbook measured in full, because "we did not
                                # touch it" is a claim, not a measurement (§211–§213)
python3 checks/knowledge-base.py # the page and db/kb.json draw from ONE source — the
                                # AGREEMENT, never the count (§103)
python3 checks/kb-file.py       # the questions file (§161): the round trip is a FIXED
                                # POINT — downloaded and uploaded untouched it changes
                                # nothing, before AND after applying — every kind of
                                # change classified, an unrecognised id refused by name,
                                # and the audience the file sets obeyed by the page and
                                # the corpus alike
node scripts/test-kb-audience.js # who sees which answer (§160): an office answer absent
                                # for everybody else AND still present for the office, and
                                # a two-answer question leaving each side exactly one.
                                # No database, no network — officeOnly() is pure.
```
Two people, one database — the scenario that was destroying work before §210
(needs a throwaway Postgres; `SMP_WHOLE_GRAPH=1` restores the old behaviour and
it must go red):
`DATABASE_URL=… node scripts/test-two-tabs.js`

The mail half needs a database and a password (it spawns its own dev-server):
`DATABASE_URL=… node scripts/test-email-greeting.js <smo-password>` (§142.6), and
`DATABASE_URL=… node scripts/test-test-copies.js <smo-password>` (§146).
The one-off heal of a tenant's stored titles needs a database (it runs through
the real `ensureReady` on the worked example, and asserts BOTH ends — the
titles healed, the paragraphs untouched):
`DATABASE_URL=… node scripts/test-one-line-heal.js` (§253).
In this cloud image, run any sweep through the wrapper so Playwright finds the
Chromium that is already here:
`SMP_CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome python3 qa-run.py <file>`.
The chat's **server** half needs a database and a running dev-server:
`DATABASE_URL=… node scripts/test-chat.js <smo-password>` (§97.9).

---

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

*Last Updated: 2026-09-03 &mdash; **&sect;260: a title is one line, and the box
was the only place that said otherwise.** Islam, with a screenshot of a client's
plan and the pen open: a tactic's name box **643px tall holding one sentence**,
the description and the outcome the same, the eye and the &times; floating in
the middle of the empty space. **NOTHING WAS WRONG WITH THE BOX** &mdash;
&sect;189 sizes a growing box to what is IN it, and what was in it was **blank
lines**: thirty of them reproduce his screenshot to the pixel (643px box, 962px
row), which disproved every layout cause in one measurement. **THEY ARE
INVISIBLE EVERYWHERE ELSE**, which is why it reads as a sudden fault: the same
row is **42px** in reading mode because HTML collapses a break, and the deck and
both workbooks print these fields on one line &mdash; so a value can carry them
for weeks and only the pen will ever show it. **TWO ROUTES, BOTH MEASURED**:
Enter added one per press until &sect;229 stopped it three days ago (whose own
text says *"nothing stored is scrubbed"* &mdash; this is that bill), and a
**paste**, which &sect;229 does not reach and which was measured storing
`"Line one\nLine two\n\n\n"` verbatim. **THE RULE IS ABOUT THE VALUE**, so it
lives in `lib/rules.js` where the three places that need it can ask one function
(&sect;42), it **keeps every word**, and **`.grow` is the decision** &mdash;
&sect;229 drew that line for Enter and this uses the same one, so a paragraph
box is untouched and there is no second list to forget. **THREE TOUCHES**:
`textOr()` draws one line whatever is stored (which is what closes it for good,
because it does not care how the breaks got there) and stores nothing; the
commit stores one line and **writes it back into the box**, because seeing the
lines close up is the explanation (&sect;124); and a one-off **heal** of what a
tenant already holds, which could not be a `.sql` file because a pillars
function's plan is one JSON blob (&sect;118) and a blanket replace would flatten
the paragraphs. **Proved able to fail both ways**: the heal stubbed **14 red**,
the heal made over-eager **3 red and all three are the paragraphs** &mdash; the
worse failure, and the one a check that only looked for one-line titles would
have applauded. `checks/one-line-titles.py` is **5 red** on the shipped build,
asserting agreement with a break-free clone of each box rather than a pixel
count (&sect;94.8). Full `qa.py` ERRORS none &middot; 472/0 &middot; 126/0
&middot; round trip, clean parity and two tabs green on virgin Postgres 16.
`plan-wrap.py`'s one failure reproduces on the untouched build (&sect;249.2).*

*Earlier the same day: **&sect;259: the group has a mark, and the
deck has separators.** Islam in one message &mdash; *"where can I upload the
raya trade mark so it can be used? then work on separators let's make teh
serparators blue background like the client brand colors"* &mdash; then four
sections by number. Both halves drawn in the REAL deck first and published as
one artifact (rule 1c, &sect;41.9); two of his four answers are choices between
treatments that only existed because they were drawn. **`--panel` IS THE BLUE
AND IT IS NOT THE DECK'S OWN COLOUR**: it is what Setup &rsaquo; Branding's
*Navigation bar* control sets, so a divider follows a tenant who rebrands
&mdash; proved by rebranding one mid-run rather than by naming a hex
(&sect;94.8). **THE FOUR SWOT HUES COULD NOT SURVIVE THE MOVE, AND THAT IS A
MEASUREMENT**: 2.55 / 2.26 / 3.49 against the blue, and *Opportunities* was
drawn in `--panel` itself &mdash; **1.00:1 against its own ground**. One rule
across the row, the four category slides keeping their colours, and
`.seccell.t-*` deleted with the classes it styled. **NO FOOTER MARK ON A
DIVIDER**, his word, and it removes a fault as well as a decoration: the plate
that keeps a navy lockup readable is switched on by the PAGE being dark, which
a blue divider on a light page is not. **The roll-call stays white** (his,
reversing my recommendation, one extra slide per deck named as its cost) and
**the closing divider carries no numbers** (his, agreeing with it &mdash; the
other printed the three headline readings two slides early and without their
bands). **&sect;259.2**: the group's mark, one upload on Branding through the
SAME intake as a unit's, `deckMark()` the one reader, no migration, the key
DELETED on Remove, classified `setup` and NAMED so a refusal says Branding
&mdash; **and the two server edits go together**, because with only the
classification removed a unit head may set it (3 of 489 red). The demo seed
carries none, deliberately. **The knowledge base had promised this page set
"the colours and the logo" since it was written**, and that page set colours
only; it became true today. `checks/deck-dividers.py` **22 red** before &mdash;
and **its first two runs against that build DIED rather than reporting**
(&sect;215, twice in one file), **two of its own first failures were the
CHECK**, and one assertion was unfalsifiable as written (&sect;94.5, its own
example). 489/0 authoriser, full `qa.py` sweep ERRORS none, nine neighbouring
deck checks green. **And the seed was stale on `main`** &mdash; &sect;253.2's
cut pointer had never been regenerated into `db/seed-state.json`.*


*Earlier: 2026-09-03 &mdash; **&sect;258: the page warns before a save
can be lost.** Islam, after a reporting round in which people lost work twice
over: *"can we have some sort of mid page warning like the error and network
issue in case the person is saving with someone opening the same thing … with
clear action so we can know what to do?"* &mdash; then *"BOTH"* of the two
cautions drawn, and *"for the safety banner let's build them on the branch."*
**THE TWO WAYS WORK WAS LOST WERE MEASURED FIRST AND NEITHER WAS THE WRITER**:
every loss reproduced as a STALE TAB posting the pre-&sect;234 shape and being
refused all-or-nothing (&sect;184), which migration 040 ended once and nothing
prevented next time; and two people on ONE number, where &sect;210 merges
different fields and the same field is last-write-wins. **Two cautions, one
family**, in the refusal's own slot on the ATTENTION ground &mdash; nothing has
gone wrong yet (&sect;168). **A newer version is ready**: `sw.js` claims its
clients on activate, so an open tab hears of a deploy through
`controllerchange`; the registration is asked for a newer worker on a clock and
on coming back, and only when there was a controller BEFORE (first install is
nobody stale). **Somebody else updated this page**: `change_log` already holds
who and when (&sect;42), so `GET /api/state?since=&target=` answers from it
&mdash; one indexed query, never the graph (&sect;98), the asker excluded &mdash;
and the caution NAMES them. **"Reload &amp; keep mine" is &sect;210 doing the
work**: flush this tab's change first, reload only when it landed; a flush that
fails keeps the page and &sect;171's banner. **The check said the button failed
contrast** (`--attn` under white, 3.25:1 &mdash; &sect;38.4 for the seventh
time), so it wears `--attn-tx`, &sect;94.8's own pair. Never `paint()`, never
over `file://`, every browser call guarded. `checks/safety-banners.py` **20 red**
on the build before (and its first run died rather than reported, &sect;215);
`scripts/test-safety-peek.js` against a real Postgres; full sweep, 472/0,
126/0, round trip PASS. **On the branch, not merged.** Recorded, not done: a
same-field collision inside one 20s peek is still last-write-wins, and the
worker half's first real proof is the next production deploy.*

*Earlier: 2026-09-02 &mdash; **&sect;252.2: the plan download comes back,
in the menu and for the office.** Islam, in the same breath as the merge:
*"the ppt download leave it as an option in the drop down for the smo only."*
&sect;145.9 hid the pane-corner button for everyone and kept the machinery;
this is that machinery given back **somewhere else** &mdash; an entry beside
*Present* and *Manage slides*, because that menu is where the decks already
are. The corner button is **deleted, not left hidden** (&sect;24), and the
narrowing lives in `mayDownloadPlan()` rather than in the menu, so the entry
and the press cannot answer differently (&sect;42, &sect;48.2). It **reverses
&sect;117's audience** at his instruction and is recorded as a reversal:
`ARRANGE_ROLES` is untouched, because reordering is still the custodian's and
the owner's (&sect;101). Three assertions rewritten rather than deleted
(&sect;218), 474/0, and one of the check's own first failures was the check.*

*Earlier the same day: **&sect;254.7&ndash;.12: the deck round,
finished.** Islam's four from the running deck, on top of the eight before them.
**&sect;254.7** &mdash; a unit written twice *with or without a gap*: his stored
`40 %%` survived &sect;254.1's collapse, which split the unit on WHITESPACE, and
`%%` is one word. Guarded so `mm` is not read as a doubled `m`. **And it caught a
regression of my own**: &sect;254.1 rebuilt the string with a space for any unit
it did not recognise, so `40%%` came out as `40 %%` &mdash; made WORSE by the
function that exists to tidy it. It never adds a separator now; the only thing it
does on its own is close one. **&sect;254.8 / &sect;254.12** &mdash; the pillar
cards size themselves and fill the slide rather than one row of it: `--c` and
`--r` carry the shape, up to three stay in a row and above that it is
`ceil(sqrt(n))`, so **his own "4 can form a box" reads as 2&times;2**, and five
goes 264px/27.6px &rarr; 445px/34.7px. **Flex-wrap, never a grid**, because a
ragged last row has to be CENTRED. **The vertical sizes follow the ROWS and the
horizontal ones the COLUMNS** &mdash; getting that wrong ran three rows 84px off
the slide; swept 1 to 10, nothing overflows. **&sect;254.9** &mdash; the
aspiration runs the width, *This year* comes before the horizon (header and row
moved TOGETHER), and the table grows: **the ceiling is the fit pass, not taste**,
because `.tight` shrinks the ASPIRATION too. Measured across all ten units:
**10 of 10 aim slides were on the generic 19px floor and none are now.**
**&sect;254.10** &mdash; two numbers, not four, with the reading PUT BACK before
it was obeyed: Delivered and Planned sat in two places spelled differently, and
the measures head had no Execution on it at all. **&sect;254.11** &mdash; the
sentence explaining Execution stays. `checks/deck-figures.py` **11 red** on the
build before; two of its own first failures were the CHECK (computed style does
not resolve on a detached render, and the aim table had to be asserted across
EVERY unit, since whether a slide tightens depends on its own prose). Three
assertions elsewhere were REWRITTEN, not deleted (&sect;218).*

*Earlier: 2026-09-02 &mdash; **&sect;255: a reported note is named as one.**
Islam, from his own Performance page: *"the perofmrance is showing hte notes
under the tactic name. what is this issue?"* &mdash; then, correcting the first
reading and setting the scope with it: *"notes is not in the desciption, notes
is something relevant to the reporting and appears in performance as a separate
element. so it needs to be there so we can't drop."* **NEITHER PLACEMENT WAS A
MISTAKE**: &sect;239.2 put the reporter's note under the name and &sect;248
later put the plan's DESCRIPTION in the same cell &mdash; both right on their
own, both drawn as `.why`, so a permanent statement and a this-cycle statement
render identically with nothing saying which is which. &sect;248's own comment
saw the risk in the abstract and answered it **only for the NAME**, by bolding
it. **THE COST WAS MEASURED BEFORE HE CHOSE**, out of the running platform with
his own two tactics in it: a Note column of its own &mdash; what the deck has
always had &mdash; takes the Tactic column **790 &rarr; 209px at 1920** and
starts running past the pane at **1280px**, where it fits today; naming it in
place costs no width at any width that fits. **A RULE, NOT A SECOND SIZE OR
COLOUR**, because smaller or paler would rank the newer fact under the older
one. **ONE BUILDER, BOTH TABLES ON THE PAGE** (&sect;53.5) &mdash; the key
measures table stacks the same two greys the moment a row has a horizon, nought
in the demo and therefore latent rather than absent. **THE MOCKUP'S OWN `.85`
OPACITY WAS DROPPED IN THE BUILD** (about 4.2:1 at 10px &mdash; &sect;38.5
walked into while quoting it; 4.95 / 5.53 without it). **THE DEMO CANNOT SHOW
THIS FAULT** &mdash; 0 of 84 tactics carry a note &mdash; so the check MAKES the
state, a row reporting nothing included. **16 red** on the build before, and
**two of that count were the CHECK**: `all([])` is true, so three assertions
went green over an empty list (&sect;113.8), and it **died rather than
reported** (&sect;215), printing four failures where there are sixteen.
**RECORDED, NOT DONE**: four other surfaces draw a note as a plain grey, none
of them stacks a second one, and `capKOTable` already has a column headed
*Reported*.*

*Earlier the same day: **&sect;254: a figure is read against what it
is measured by.** Eight things Islam sent from the live deck in one afternoon,
every one mocked up from the running deck before anything was built. **The
benchmark and the column that names it**: his row read `6#` against `4#` at 133%
with nothing saying why &mdash; &sect;239 has prorated a Sum measure since it was
written and the deck never printed it, so nothing new is computed and the shape
is &sect;252's own, through ONE builder the three tables ask; the column takes
Performance's *Annual target* (&sect;239.2). **&sect;254.1**: a scaled currency
is one token wherever it is DRAWN, the test a magnitude letter rather than a
list (so `K EGP` reads right though the picker does not offer it) &mdash; display
only, asserted by comparing every stored figure byte for byte, and **the first
draft closed the wrong gap** and produced `8MEGP`, because *tight* is a fact
about the separator and not about the unit. The doubling is healed **on
reporting and save**, his choice, with the residue stated. **&sect;254.2**:
`2% / 2#` reproduced &mdash; nine states through the scorer all score with a
figure in the outcome, so a figure reported BEFORE the outcome's target was added
sits in the old field for ever while the benchmark switches; the target alone
decides now, **narrowing &sect;248 at his direction** from three behaviours with
the cost of each, and it is the only one that never states a figure nobody
reported. **&sect;254.3** a not-due tactic is not dimmed. **&sect;254.4** the
deck ends on its numbers. **&sect;254.5** the pillars are named before they are
scored &mdash; his concept, the platform's treatment, the CODE as the number, and
the two pillar slides given different names (&sect;87's twins). 33 red on the
build before &mdash; **and three checks held something these decisions moved**,
one of them written a single section earlier and going red on a correct build.
**Recorded, not done**: `K EGP` on the picker, the missing deck marks, and where
the notes slide sits.*

*Earlier the same day: **&sect;253: a table with no rows is not a
slide.** Islam: *"slides are showing blank pages for the merchandizing."*
Measured before anything was proposed — **four** slides in the whole product
draw a heading, a column strip and a whole empty page, and **all four are
Merchandising**: its own deck's two objectives slides (a function judged by its
pillars legitimately carries none, &sect;214.2) and Retail's **RS04**, the
pillar carried by that function, which printed **93% / 60% / 61%** over nothing
at all. **THE PRODUCT ALREADY KNEW THE ANSWER AND APPLIED IT TO ONE HALF** —
`deckSlidesFn` has guarded its objectives slide since it was written, which is
why **Marketing** has always been right; the unit deck, which a pillars function
goes through since &sect;224, had no such guard (&sect;53.5). **Islam ruled it
for any subject**, reversing the narrower rule recommended to him, with the cost
recorded as his. It drops the TABLE, and the slide only where that leaves
nothing, so a unit keeps the aspiration above it. **&sect;253.1**: the headline
slide's objectives cell goes for any subject with none — no new CSS, because
`.headgrid` without `.three` is the shape it wore before &sect;243 — and the
**mockup earned its place**, exposing a footnote that would have gone on
explaining a number no longer on the slide. **&sect;253.2**: the Retail →
Merchandising pointer is cut at his instruction; the FEATURE is untouched, and
the price is stated rather than discovered (the demo no longer SHOWS a carried
pillar, so spec 010 is described and not visible). Measured across every unit:
Retail execution 102&rarr;104, planned 57&rarr;56, RS04's three figures to three
dashes, **nothing else moves**. `checks/deck-blank-slides.py` **11 red** on the
build before — **and one of its own assertions passed on the broken build**
(&sect;94.5), searching six headings where a pillar's tables sit at index 11;
it names the stripped pillar by its code now. **&sect;253.3, from the live
deployment mid-build**: *"the manage presentation show this"* &mdash; Manage
slides on a pillars function, bar drawn, rail and stage empty. &sect;224's
fault on two more surfaces (`slidesAssemble()` and `deckAnchors()` still asked
by the `fn:` prefix), so the editor assembled **2** slides where Present opens
**13**. `deckHtmlFor()` is the one reader now and all three ask it; the
capability deck is asserted unchanged. **And the failure had no voice** &mdash;
no catch, and a silent `return` on an empty deck &mdash; so both speak now
(&sect;32, &sect;171). **Not claimed**: the demo's pre-fix editor draws two
slides and his screenshot shows none, so whether the prefix branch is exactly
what emptied HIS rail cannot be proved from here. 14 red.*

*Earlier the same day: **&sect;252: the presentation reads what was
reported.** Islam: *"presentations doesn't change when the plan performance is
done"*, then *"the presentation should update on either save draft or submit."*
**THE PROPOSED FIX WOULD HAVE CHANGED NOTHING** &mdash; the deck is assembled
fresh on the press (&sect;51.8), so there is nothing stale for a refresh to
clear. The fault is that **five readers were still looking in the old box**:
&sect;248 puts a tactic's outcome figure in `outActual`, and measured on Mobile
the slide read `&mdash; / 50%` and `&mdash;` where Performance read `4# / 3 #`
and `133%` &mdash; under a heading on that same slide already reading
`Delivered 98%`. `reportedCount` went **41 of 41 &rarr; 40 of 41**, so
**Submit refused a finished report**; the note rule could not see an outcome at
all; and the row was dimmed as unreported beside its own printed figure. The
expression that answers this existed and was written out **once**, inline in the
Performance pane &mdash; it is `tacticProgress()` now, with `rowAnswered()`
beside it, asked by every surface (&sect;53.5). **The slide's shape is Islam's**,
picked from three shot out of the real deck (`design-mockups/tactic-outcome-slide/`):
the outcome takes a **column of its own**, with the cost measured before he chose
(Mobile's deck 24 &rarr; 27 slides). Two headings take Performance's words
(*YTD actual* &middot; *Progress*), a row owed a figure says **"Not reported
&middot; due at &hellip;"**, and a tactic with no outcome is byte-for-byte what
it was. **19 red** on the shipped file, 0 after &mdash; and the check's own
first run died rather than reported (&sect;215). **Recorded, not done**: the
`.pptx` plan download still has no outcome column, and a deck already open on a
projector does not redraw mid-presentation.*

*Earlier the same day: **&sect;251: the unit is there before the
number is.** Islam, from his own plan with the pen open: *"In the edit I can't
set the unit for a measure."* Two of his four Key measures had no target yet,
and the unit has no field of its own &mdash; it lives inside the target string
(&sect;199) &mdash; so a row with no target had nowhere to keep one and drew an
em-dash. The target holds the unit ALONE until a number joins it, which is
&sect;248's own answer for a tactic's outcome, whose explicit carve-out for the
measures column this reverses at his instruction. **A mockup was built first**
(rule 1c) from his own four rows in the platform's own tokens, because the
question he asked was WHERE; he answered **"all 4 places"** &mdash; a pillar's
Key measures, a unit's Overview objectives, the group's Foundation and a
supporting function's Overview on both formats. **The one cost was stated
before it was built**: a target holding only a unit is unusable, so
`target`/`target3y` join `GAP_NUM` and the row goes on saying Missing &mdash;
without it the red word vanishes the instant a unit is picked and the count
falls 46 &rarr; 45, measured. 208 non-blank targets in the shipped plan, 0
non-numeric, so nothing in the demo moves. **Prose is the guard**: reading any
non-number as the unit would have appended *"Maintain share"* to the next bare
number typed, so the test is a unit the platform OFFERS. One reader for both
sides (&sect;53.5), fill mode deliberately untouched and asserted, nothing
stored that was not stored before and nothing migrated. Proved able to fail
twice (16 red, 6 red); five of the new check's own first-run failures were the
CHECK, and one assertion in `fn-ko-edit.py` was rewritten rather than deleted
(&sect;218).*

*Earlier the same day: **&sect;250: a tactic's outcome is measured

*Earlier the same day: **&sect;257: a target that is a yes or a
no.** Islam: *"for the target we need to add a Y/N in the units which dims the
target itself."* Some rows are not measured &mdash; a certification achieved, an
agreement signed, a warehouse open &mdash; and the plan had no way to write one:
every target box wants a number, so such a row was left blank and, since
&sect;249, wore the red word for ever and refused Submit with nothing anybody
could fill. **BOTH DECISIONS ARE HIS AND WERE TAKEN BEFORE ANYTHING WAS BUILT**:
a Y/N row scores **100 or 0** (so it counts in every average), and it applies in
**all three** places the unit picker appears. **IT IS A UNIT, NOT A SECOND
FIELD**, which is the whole of why it costs no migration &mdash; &sect;199 put
the unit ON the target string, so `Y/N` is simply the unit whose value part is
always empty. **AND IT IS A COMPLETE ANSWER, NEVER A GAP**: one line before
&sect;249's numeric test, or the feature ships every yes/no row blocking Submit.
**Nothing said is not a no** (unanswered scores null and leaves the average).
The direction and the compile rule are dimmed alongside the target &mdash; mine,
put to him with the reasoning and confirmed &mdash; **drawn and `disabled`,
never merely dimmed** (&sect;220), with the unit picker left live because it is
the only way back out (&sect;61). **&sect;257.2 IS HIS CORRECTION, AND THE
BETTER MODEL**: the first build made a row yes/no by DESTROYING its number, and
he caught it on a row reading `100 &middot; Y/N &middot; &ge; &middot; Latest`
with nothing dimmed &mdash; *"even they are set before they need to be dimmed
even by keeping the values but as if they are not counted anymore."* The
outcome's picker KEEPS the figure, so `outTarget` was `100 Y/N` while the
dimming test asked whether the WHOLE STRING was `Y/N` &mdash; so the tables
disagreed with the outcome beside them (&sect;53.5 inside one feature) &mdash;
and destroying a figure is unlike every other unit and makes changing your mind
cost what somebody typed. `Y/N` is written BESIDE the value now, `isYesNo`
reads the unit off the end through `targetParts` (`outUnitOf`'s &sect;248
rule), the dimmed boxes SHOW what they keep, and `100 B EGP` &rarr; `100 Y/N`
&rarr; `100 B EGP` round trips. **The corrected check then found two more**:
leaving Y/N blanked the value instead of handing it back, and `measureDue`
parsed the kept 100 out of `100 Y/N` and printed *"due at 100 Y/N"* beside a
Yes/No control. **6 red** on the build he was looking at; six assertions
REWRITTEN, not deleted (&sect;218). **&sect;257.2a, found by driving it**: a
bound field writes WITHOUT repainting (&sect;71.2, right for typing), so
picking Y/N changed the plan and **nothing visibly happened** &mdash; every
assertion short of pressing the control passed. **&sect;257.3**: leaving Y/N writes a bare unit,
which `splitTarget` cannot read back, so `targetUnitOf` learned the rule
`outUnitOf` has had since &sect;248 &mdash; narrowed to units the picker itself
offers, or a target reading `TBD` would be read as a unit nobody chose.
**Proved able to fail: 18 red** on the shipped build; its first falsification
run DIED rather than reported (&sect;215), so every probe degrades now. One
check held a rule this reverses and was REWRITTEN, not deleted (&sect;218).
472/0 authoriser &middot; 126/0 differ &middot; thirteen neighbouring checks
&middot; full `qa.py` sweep ERRORS none. **RECORDED, NOT DONE**: a Y/N measure
stores no `progress`, so the Focus board shows nothing for one (a reward
decision, &sect;239); and `reportedCount` reads `actual` for every kind, so a
tactic reporting into `outActual` is never counted done &mdash; that predates
this and is measured as no worse for it, and fixing it changes what Submit
demands of every existing tactic, which is Islam's call.*

*Earlier: 2026-09-02 &mdash; **&sect;250: a tactic's outcome is measured
against its own window.** Islam, of a tactic marked Q2 and Q3: *"that's a 6
months project from april till september .. now we are reporting till august so
the proration how should it be calauclated? because it's different than the
proration of the measurs that prorate across the eyar."* Half of it was already
true &mdash; &sect;239 gave the *% delivered* column the tactic's own months, so
it read 5 of 6 = 83% &mdash; and &sect;248's OUTCOME went through the YEAR's
share, reading **88% for every one of ten window shapes** at August. The share
is SUPPLIED to the one arithmetic rather than re-derived beside it, it is an
EXACT fraction (the first draft read it back out of the rounded per cent and
moved a whole-year tactic from 88% to 87%), and the month being reported in
counts, as the year already counts it. **Nothing stored moves**: 842&ndash;852
scores read off the shipped build and this one at six review points, identical
at every one. **&sect;250.1**: it nearly shipped a silent disaster &mdash;
`pillarPerf` mapped `measureScore` POINT-FREE, and `Array.map` hands its
callback the index, so the new optional share would have been 0, then 1, then 2
down every pillar (one pillar 100 &rarr; not scored, another 83 &rarr; 65); and
the probe that should have caught it was comparing two identical crash strings.
**&sect;250.2, recorded not done**: the review deck still ignores an outcome
entirely (&sect;248's omission, measured byte-identical before and after), and
`checks/report-saves.py` is red on `main` for a stub that does not serve
`sw.js`. 33 new assertions, proved able to fail **15 red** on the shipped build;
eight neighbouring checks, the full `qa.py` sweep (ERRORS none), 472/0
authoriser and 126/0 differ all green.*

*Earlier the same day: **&sect;249.4: the direction and the compile
rule stay the office's.** Islam, from the running platform: *"I viewed as Ali
Reda from corporate, I can't adjust the direction or the compiling. is that ment
to be?"* It is &mdash; neither is a gap, so a filler writing one is AUTHORING,
the server refuses it, and a save is all or nothing (&sect;184). **THE GRANT
DECIDES, AND IT WAS MEASURED RATHER THAN READ OFF A SCREENSHOT**: **view** draws
read-only text, **fill** two controls and two read-only facts, **edit** all
four &mdash; so there is no defect, and somebody who needs those two is given
Edit. *My first reading came from a screenshot of a tenant I cannot see and he
corrected it; the answer only became worth trusting when it came from the rule.*
**THE COST WAS STATED BEFORE HE CHOSE**: the direction stays `&ge;`, so a *less
is better* outcome scores BACKWARDS until the office corrects it, and a blank
compile compares against the WHOLE year with no proration. He kept both the
office's, consistent with &sect;99.8 (*how a thing is measured is a plan
decision, not a reporting one*), recorded as his call.*

*Earlier the same day: **&sect;249.2 / &sect;249.3: what auditing
&sect;249 found.** Islam, the same day: *"double check if this made any problems
with the input or the saving or the reporting or the accessibility ... as the
platform is live."* Two refusals, one mine and one older than mine and made
routine by it. **&sect;249.2** &mdash; &sect;248 lets the unit be chosen before
the number, so `outTarget` holds `"%"` on the way to `"90%"`: non-blank and
still empty by the gap rule. The first build STAMPED it (and a marked field
reads as ANSWERED, so the row would have left the count, the walk and Submit's
refusal with an unusable target) and the server REFUSED it (no mark either
side, so the gap pass skipped the field and it fell through to `unitPlan` &mdash;
&sect;184's shape, where one unclassified row costs every fill in the same
post). The mark is now written only for a value the platform can use, and a gap
moved to another gap is the filler's. **&sect;249.3** &mdash; &sect;145 made the
MARKS compare canonically because jsonb reorders `{by, at}`; the same fault sits
on the ROW. The gap pass clears by ASSIGNING onto the stored clone, which
APPENDS a key the stored row lacked, and `same()` is stringify-based &mdash; so
two fills of absent keys in ONE post leave the clone spelling the row
differently, the residual diff calls it `unitPlan`, and the save is refused.
**It predates &sect;249 and was measured on the build before it**; &sect;249
makes it the COMMON case, because &sect;248's five fields are absent on every
existing tactic and two are now what a filler is asked for &mdash; *the outcome
and its target, filled together, would have been refused every time.* The repair
is `sameCanon` generalised to the row, and that guard is the safety argument:
only rows whose CONTENT is already identical are re-spelled, asserted with a
rename and a direction change smuggled in beside the fills and still refused.
**THE REST IS MEASUREMENT, NOT REASSURANCE**: round trip on a virgin Postgres
16, clean slate, two tabs 24/0, eight concurrent saves none lost, the
incremental writer byte-identical, and the five &sect;248 fields plus a mark on
them round-tripping through jsonb &mdash; **the first comparison said FAIL and
the COMPARISON was wrong**, jsonb reordering the mark's keys, which is
&sect;145's lesson landing on the person quoting it. Reporting unchanged, a
figure still enters, no page error. Contrast measured with the sweep's OWN
function in both themes: Plan 0, Performance 0, Reporting 6 &mdash; **and the
pre-&sect;249 build reports the same 6**, same selector, same ratio. Reading
mode clean 1600 &rarr; 768; the pen's overflow below 1100 byte-identical to
before. 472/0 authoriser &middot; 126/0 differ &middot; full `qa.py` ERRORS
none. **RECORDED, NOT FIXED**: in FILL mode below 1000px the tactics table runs
past its pane (20px at 1000, 120px at 900, 45px at 768) because the cell keeps
`.tgtcell` wherever it holds controls (&sect;61) &mdash; it SCROLLS rather than
clipping and every control was driven and writes, but &sect;158's rule is *fit,
never "and it scrolls"*, and every way of reclaiming the width changes a
control's drawn shape, which wants a mockup (rule 1c).*

*Earlier the same day: **&sect;249: the outcome and its target are
owed.** Islam, on the shipped &sect;248: *"the tactics outcome and target are
not counting missing in the units plans. they should count as missing."* That
section left it undone deliberately and said whose call it was &mdash; *"one
line and is Islam's to take"* &mdash; because its quiet default answered a
question about the ROLLOUT (the risk was noise, and 83 demo tactics would have
gained the red word overnight) and not about the plan. **BOTH FIELDS, because
half a row cannot be said**: the target carries the arithmetic, the outcome
names what the number is about. **ONE LINE DOES FOUR THINGS**, all four put to
him with the arithmetic before anything was written: the page says Missing
where it said an em-dash, every count and the Next-gap walk include them, they
become **fillable** (`GAP_FIELDS` is the floor of `GAP_FILLABLE`, &sect;205 &mdash;
counted-and-not-fillable is a red count with no control behind it, &sect;223),
and **Submit refuses while any tactic still owes one** (&sect;221 reads the same
map). The last is the cost and he took it: *"count them fully."*
**A TARGET HOLDING ONLY A UNIT IS STILL MISSING** &mdash; `outTarget` is `"%"`
for as long as it takes to type 90, so a blank test would call that row
answered while `outcomeOf` refuses to score it (&sect;184's rule with a number
in place of a date); `GAP_NUM` + `targetHasNumber()`, **and `outcomeOf` asks
that same function** or the count and the score disagree about one string
(&sect;42, &sect;53.5) &mdash; its wording unchanged, so **no stored figure
moves**. **THE CELLS GO THROUGH `gapCell` AND KEEP THEIR OWN CONTROLS**
(&sect;130.1's hook): **`fillKind` named**, or the cell opens whatever the
shared list says &mdash; and the new check duly passed on a reverted build
until it was (&sect;228.2); **the direction and the compile rule read-only in
fill mode**, drawn rather than dropped, because both carry a default so neither
is a gap and a filler writing one would refuse the whole save (&sect;184);
**`.tgtcell` kept wherever controls are drawn**, read off the hook having run
rather than re-derived, or below 880 the fold takes the only way to set a
target off the screen (&sect;61). **`outcomeCell` stopped saying dash on all
three surfaces**, that em-dash having been argued straight from the count
(&sect;94.15), and **the narrow fold says Missing** instead of hiding the one
place the count names. Proved able to fail: **3 / 7 / 2 red** with the names
taken back out, **1 red** with the numeric rule alone removed. 463/0 authoriser
&middot; 126/0 differ &middot; 47/0 tactic-outcome &middot; fifteen other checks
and the full `qa.py` sweep green. **FOUR CHECKS HELD A LITERAL THIS DECISION
MOVED** (&sect;214.3, fifth time), every one REWRITTEN rather than deleted
(&sect;218) &mdash; among them one whose assertion was `or True`, and one that
**reported a correct build as broken** because the fill door walks to the first
gap and the first gap moved. **RECORDED, NOT DONE**: the plan deck draws no
column for either field, so &sect;119's *the deck names what the plan owes* is
true of six of a tactic's eight facts and not these two &mdash; two more
columns on a seven-column slide wants a mockup (rule 1c), not a quiet widening;
and `plan-wrap.py`'s five clipped fields at 1100 reproduce on the untouched
build.*

*Earlier: 2026-09-02 &mdash; **&sect;248: a tactic is judged by what it
produced.** Islam, from his own plan: *"the tactics have outcomes that we need
to have in our tactics plan so we can measure the progress against"*, and
*"the outcome needs to have a target and measuring unit so it can be reported
in the reporting and measured in the performance accordingly."* **BOTH FIELDS
ALREADY EXISTED AND WERE BEING SWALLOWED** &mdash; `description` and `outcome`
are stored on every tactic and the workbook has read both since the template
existed; the outcome rendered in ONE place and the description in NONE.
**THE OUTCOME IS SHAPED AS A MEASURE**, so `measureDue`/`measureScore`/
`measureDueLabel` serve it unchanged (&sect;239's rule, not a second copy).
**THE FIGURE IS ITS OWN FIELD AND THAT IS THE WHOLE MIGRATION STORY** &mdash;
`t.actual` has always meant "% delivered", so an outcome's number in that box
would make a tactic at 45 read 750% against `&ge; 6 #`; it reports into
**`outActual`**, the five fields ride in `extra`, so **no migration and no
schema change**, and every closed cycle reads as it did. **THE SWITCH IS PER
TACTIC, WHEN A HUMAN TYPES**: a tactic is asked and scored the old way until
its outcome has both a target AND a figure. **Proved, not argued: 19 subjects
read off the shipped build and this one, byte-identical.** **NOT A SETTING**
(put to him, and refused): an empty outcome is an em-dash, never the red word,
and is not a counted gap. **FOUR EQUAL BOXES IN ONE CELL** (his) at
`--tw` 96px, measured; the description sits **under the tactic's name**, his
choice between two drawn shapes, and the first build got it wrong and shipped a
column. &sect;158 comes free (seven columns fit everywhere), so only the TARGET
folds, below 880, and **never while the pen is open** (&sect;61). **AND THE
UNIT PICKER IS ALWAYS DRAWN** &mdash; hiding it until a target exists reads as a
control that failed to render; a unit is held ALONE until a number joins it,
which needed `outUnitOf()`, because `targetParts` falls back to
`{value: the whole string, unit: ""}` and a truthiness test threw the unit away
on the first keystroke. The workbook carries the three new facts or a round trip
drops every target (&sect;22), with Q1&ndash;Q4 moving G:J &rarr; J:M because a
validation range is a POSITION (&sect;65). `outActual` joins `REPORT.tactic` in
the same edit as the box that writes it (&sect;42). Proved able to fail: **31
red** on the previous build &mdash; and its first run DIED rather than reported
(&sect;215), so every evaluate degrades now. **AND THE MERGE FOUND
&sect;94.12's COLLISION AGAIN**: this branch and main had both independently
written shell `v4.21`, which git merges without a word while the bytes differ
&mdash; `v4.22-tactic-outcome`, confirmed against `origin/main` immediately
before the push. Renumbered &sect;245 &rarr; &sect;248 because main took that
number and the two after it while this was being built. 44/44 on
`checks/tactic-outcome.py` &middot; 454/0 authoriser &middot; 126/0 differ
&middot; `ytd-proration`, `table-fit`, `cycle-board` green &middot; 19 subjects
unmoved against main's own build &middot; full `qa.py` sweep ERRORS none.*


*Earlier: 2026-09-01 &mdash; **&sect;245: the functions are on the
function half, in one list; &sect;246: the cycle note is a line somebody
wrote.** Islam, looking at what &sect;244 shipped &mdash; *"merch and marketing
and cf should be with functions not units"* &mdash; and, of the two bands drawn
for sign-off, *"don't split functions planning in pillars from functions
planning in projects they are functions reporting."* **&sect;244 FOUND THE HOLE
AND PUT THE ROWS IN THE WRONG PLACE**: that such a function had no row at all
stands, and the placement was argued from the three COUNT columns &mdash; true,
and an answer to a question nobody was asking. The board is scanned for *who
owes a report*, that block sits under **Business unit**, and a function owes one
as a function whatever shape its plan takes. **THE FORMAT IS NOT A GROUPING**:
how a function plans is a fact about its own pages, and splitting the list by it
makes somebody looking for Marketing decide which half to look in first &mdash;
one band, one list, the register's own order, with the shape deciding only which
builder draws the row (&sect;59). **So the band stopped naming one vocabulary**
(*"reporting in capabilities &mdash; key objectives, outcomes, and deliverables
and milestones"* was true of every row beneath it until a pillars function
joined): it says *"N functions reporting"*, and the mapped columns keep the
per-cell hovers that always explained them (&sect;35, &sect;124, 1b-ii).
**Two lists behind it**, because the totals must have exactly the membership the
rows have (&sect;108.1). **AND THE MOCKUP WAS DRAWN FROM THE PROTOTYPE, WHICH HE
COULD NOT READ** &mdash; it carried a *Care (function)* row and his tenant has no
such function, so the screen he was asked to sign off was populated with names
that mean nothing to him: *"stop showing mockups in the prototupe work on the
client."* `checks/cycle-board.py` asserts the placement AND that there is exactly
ONE band (a build that grouped the formats passes every "it is with the
functions" assertion on its own): **8 red** on &sect;244's build.
**AND &sect;246, from the same session** &mdash; *"for functions who already
didn't fill the notes an achievments slide it's still appearing."* &sect;243's
gate is right and what it READ was not: the deck's note box is
`contenteditable` and wrote `box.textContent` into `REVIEW.note` on every
keystroke, untrimmed and never deleted, and until &sect;243 that box was drawn
on EVERY deck &mdash; so a click and a space, or a word typed and deleted, left
a note made of whitespace, **and whitespace is truthy** (&sect;104.10's trap in a
third place: the falsy test is not the question *did somebody say something*).
**ONE READER AND ONE WRITER** &mdash; `cycleNote()` / `setCycleNote()`, where
five places read and two wrote (&sect;53.5) &mdash; **trimmed on READ as well as
on write**, so what is already in a client's database behaves today and nothing
is migrated, and **the emptied key is DELETED** (&sect;50.6). **No hide button**:
a control to hide a slide only drawn when it has content is a switch for a state
that cannot occur (&sect;61 from the other side); what is genuinely missing is
named instead &mdash; &sect;233 hides ROWS and nothing hides a generated SLIDE,
which is a feature with a real question inside it. `checks/notes-slide.py`:
**10 red** on the build before.*

*Earlier the same day: **&sect;244: every subject that reports is on
the cycle board.** Told that a function planning in pillars appears nowhere on
the page the office watches, Islam: *"put them on the unit half."* It was
filtered off BOTH halves &mdash; the function half asks for capabilities, which
a pillars function has none of by construction (&sect;59), and the unit half read
`activeKeys()`, which is units &mdash; so such a function could be a week late
and the board would carry no row for it. `boardUnitTargets()` is the one list
the rows AND `cycleTotals()` walk, so the headline can never disagree with what
is drawn (&sect;53.5, and &sect;108.1's miscount where the parts grew and the
divisor did not); its counts come from `reportedCount(unitLike(t))`, the same
function its own Reporting page draws from. **AND THE BOARD PRINTED "Care"
TWICE** &mdash; this tenant has a unit and a function of that name, and the
function half rendered `f.name` where `placeLabel()` already answers it
(&sect;65, &sect;93.12); found by the new check, not by reading. **AND ONE
CHECK HELD A COPY OF BOARD MEMBERSHIP**: `setup-overview.py` computed the board's
size as `activeKeys().length + boardFunctionKeys().length`, which this change
makes incomplete &mdash; it asks `boardUnitTargets()` now, the third time this
file has recorded a literal outliving the decision behind it (&sect;214.3).
`checks/cycle-board.py`: **7 red** on the pre-&sect;244 build.*

*Earlier the same day: **&sect;242: a supporting function's report
is asked for, and its objectives can be answered; &sect;243: the review deck,
and the weights its objectives are scored by.** Islam, from a live client
session: *"for the functions planning in pillars the key objectives reporting
wasn't done and the button of submit to smo was allowed and the input there
wasn't saved."* **THREE FAULTS IN ONE COAT.** `submitBlockers()` asked by
PREFIX, so every `fn:` target went to the CAPABILITY counters and a function
that plans in pillars has none &mdash; the gate looked at an empty list, found
nothing owed, and opened the button (measured: the page 0 of 10, the gate 0 of
0, a unit in the same state refusing with *"41 figures still to enter"*).
&sect;59's rule in the last place still asking by prefix, and &sect;224's fault
on the Present button one surface over. **It was never only the count**: the
rows come from the same list, so the note rule and the In-progress rule had
never once run on this format either. **A key objective added to a function had
no id**, so the reporting box carried the string `"undefined"`, `findById()`
matched nothing, and the figure was discarded in silence (&sect;51.10) &mdash;
worse on a capability, where `cap_key_objectives.id` is a PRIMARY KEY and the
save failed outright. **The rows already stored are healed by migration 039 and
deliberately NOT in the browser**: `lastSaved` is taken after hydration, so a
client-minted id joins the baseline and never travels while every row edit is
addressed AT it, and `applyChanges()` refuses a row id the stored graph does
not hold &mdash; failing the whole save. &sect;191's own answer.
**THEN &sect;243, from his decks and screens, signed off from a mockup built
out of the real platform.** A supporting function's aim slide loses the
aspiration heading it never had and the direction and 3-year columns it cannot
fill (&sect;213), with the this-year column **unconditional** there because it
is the only target a function has &mdash; his own reason: *"the functions has
no 3 years objectives."* Its five empty SWOT slides go, while **a unit with an
empty SWOT still draws its section** (&sect;45.2: the test is whether the
subject AUTHORS one). **Three headline numbers, not two** &mdash; &sect;64 gave
the Performance page three and only the SLIDE was left behind, so it is
asserted as AGREEMENT with what that page computes. The quarters read as the
four boxes every screen draws (the text form arrived through a merge with no
decision behind it). **The notes slide follows the note**, with the cost stated
and accepted: one that exists can still be corrected on the projector, one that
does not has no box to start it in. **A BLANK WEIGHT IS NEVER NOUGHT** &mdash;
`koScore()` read `weights[i] == null ? 0`, so where every reported row was
blank the total came to nothing and the headline returned null (measured: 90%
equally weighted, a dash on that weighting). The rule in one sentence: *a blank
counts as the average of the weights that were set; if none were set every
objective counts equally; and every set weight being zero falls back to equal
rather than to a dash.* **A unit's objectives gain a Weight column**, reversing
&sect;226's *"the unit side is untouched"* at Islam's instruction &mdash; and
it writes the ROW, because `KO_WEIGHTS` is positional (&sect;48) while a
capability's and a function's weights have always lived on the row; nothing is
migrated and the stored array is still read. **A function's read table drops
the Weight column when nothing is weighted**, the objectives read as a TABLE
with the cards/table switch DELETED (&sect;24), **the unit is never written
twice** (`joinTarget("", "8 M EGP", "M EGP")` returned *"8 M EGP M EGP"*; a
DIFFERENT unit is left exactly as typed, never rewritten), and **a long figure
is read at its target's scale** &mdash; display only, full number on the hover,
gated at **1000x** because &sect;199.6 makes a bare number inherit its row's
unit and one whole magnitude step is the only line at which "they wrote it out
in full" is the sole reading; **not one figure in the shipped plan moves**.
Proved able to fail: `checks/fn-report-gate.py` **16 red**, including
`boxId: 'undefined'` verbatim; `checks/deck-and-weights.py` **22 red**;
`scripts/test-ko-ids.js` 15 assertions against a real Postgres 16; round trip
on a virgin database PASS; `test-authorize` 451/0; `test-graph-diff` 126/0;
full `qa.py` sweep clean. **Two checks held assertions Islam had deliberately
reversed and both were REWRITTEN rather than deleted** (&sect;218) &mdash; and
one was failing because two check files still set `KO_VIEW`, which in sloppy
mode CREATED the global they asserted the absence of (&sect;51.11 from the
other side). **RECORDED, NOT DONE**: the SMO's cycle board leaves pillars
functions off entirely, so the office cannot see whether one has reported; and
`applyProgress()` still leaves `progress` unchanged where a target holds no
usable number, so an uploaded figure against an unusable target is stored and
silently unscored &mdash; deriving it would MOVE existing scores, so it was put
to Islam separately.*
*Earlier: 2026-09-01 &mdash; **&sect;241: write only what changed
&mdash; MERGED FLAG-OFF, OFF BY DEFAULT, NOT ON THE LIVE LINE.** The big performance
item: every save still rewrites all 31 tables even for a one-word edit
(&sect;195 already batched it, so this is scaling/efficiency, not the acute
fire). Built on the work branch and MERGED FLAG-OFF after a safety review for
Islam's presentation &mdash; it touches nothing existing until the env var is
flipped, so merging changed no behaviour. `writeStateIncremental` in `lib/state-io.js` reads the change
list the client already sends (&sect;210/&sect;215), works out which SUBJECTS
changed &mdash; a business unit, a capability, a supporting function &mdash; and
rewrites only those, using the SAME row builders as the full writer
(`rowsOf`/`colsFor` lifted to module scope so a rewritten subject is
byte-identical). It is **never wrong, only sometimes unoptimised**:
`planSubjects` returns null for any shape it does not handle (settings, the
register, a reorder, an add/remove, a group-own-field change, a whole-graph
post) and the caller falls back to the full `writeState`. FK cascades make one
DELETE clear a subject's subtree. **Gated behind `SMP_INCREMENTAL_WRITE=1`, OFF
by default**, so merging it later changes nothing until the env var is flipped.
**Proved byte-identical to the full rewrite** by
`scripts/test-incremental-write.js` (17 change shapes, each written BOTH ways
and compared; the optimised shapes asserted handled, the fallback shapes
asserted fallen-back), and proved end-to-end through the real handler under the
&sect;240 concurrency lock with the flag on. Round-trip, two-tabs and
concurrent all stay green flag-off (the module-scope refactor changed no
behaviour). **MERGED FLAG-OFF and re-verified before the merge**: the full DB
suite (round-trip, two-tabs, concurrent) green BOTH flag-off and flag-on, the
17-shape equivalence test byte-identical, and a 120-save concurrency stress lost
nothing either way (flag-on ran ~4x faster). **NEXT, after the presentation:**
set the env var on a test deployment, watch a few saves, then decide. Fully
revertible &mdash; flag-off is dormant, so a `git revert` (or leaving the flag
off) is a no-op on live behaviour. Not handled yet (falls back, correct):
capability reorder/add-remove, group-own fields, all settings/register tables
&mdash; each a safe future extension. **ACTIVATED on production
(`SMP_INCREMENTAL_WRITE=1`) at Islam's direction, after the full sweep proved
nothing lost.** So a save can be SEEN to have taken the small path, `/api/state`
now reports it: the success body carries `wrote: "incremental"` or `"full"`
(read in the browser Network tab's Response), mirrored by one `[save]` line in
the runtime log &mdash; a behaviour-neutral diagnostic, not a second decision
(the writer is chosen exactly as before; we only report which one ran).*

*Earlier: 2026-09-01 &mdash; **&sect;240: saves take turns, so two at
once cannot lose data.** Islam, on the performance sweep: *"what if people
submit saves together &mdash; would that lose data?"* Measured, and yes: a save
is read-modify-write (read the stored graph, lay this client's changes over it
per &sect;210, write the result), and there was NO lock around those three
steps. Two saves that OVERLAP both read the same starting state before either
writes, so the later writer overwrote the earlier's change &mdash; silently,
and most likely at a reporting deadline when many people save at once.
&sect;210's diff shrank the envelope and made refusals accurate; it did NOT
close this, because the server still writes the whole applied graph.
**THE FIX: ONE TRANSACTION, ONE TRANSACTION-SCOPED LOCK.** The whole
read-modify-write now runs in a single transaction with `pg_advisory_xact_lock`
at the top; the second save blocks until the first COMMITs, then reads the
first's result and merges onto it. **It MUST be transaction-scoped, not
session-scoped** &mdash; production is Neon behind PgBouncer transaction
pooling, where a session lock can sit on a backend the next statement never
sees; an xact lock lives and dies with the transaction on its pinned backend.
`writeState` gained an `{ inTransaction: true }` so it runs in the caller's
transaction instead of opening its own (every other caller &mdash; the seed,
the tests &mdash; is unchanged). **Only the write path locks**; a GET needs
none. **Proved and proved able to fail** on a real Postgres 16
(`scripts/test-concurrent-saves.js`, driving the REAL handler with 8 genuinely
concurrent saves): with the lock, 8 of 8 survive; with `SMP_NO_SAVE_LOCK=1`, 6
of 8 are lost. `test-roundtrip` (writer lossless) and `test-two-tabs`
(sequential &sect;210/&sect;215) both stay green. **AND THE TWO SECURITY
FOLLOW-UPS ARE DONE**: the hashed-CSP net (&sect;235) and a `.vercelignore` that
stops serving `scripts/`, sources, mockups and a separate app skeleton (no
secrets were ever exposed; `lib/` and `db/` stay, the functions need them) are
both live and verified on production.*

*Earlier: 2026-09-01 &mdash; **&sect;239: YTD is measured against the
part of the year that has passed.** Islam, from a live round: the reporting of
YTD was compared with the full-year target without proration. Measured before
building: of 26 Sum measures with an actual the median read 45 points low, and
18 of 26 crossed out of Off track. The plan already said which rows prorate
(`compile`), the target is prorated and never the ratio, the stored `progress`
is untouched so archives still read, and reward stays a year-end judgement. On
the way, the finding that reshaped it: **the review point was two fields that
disagreed**, and prorating by the cycle's end quarter would have done nothing
at all on the tenant that reported the bug. It is a month now, set by the
office and editable mid-cycle, riding `review.extra` with no migration and
falling back so nothing moves until they set one. &sect;239.3 then fixed the
half that shipped broken: the review point now knows its own year, because
asking `cycleYear()` for it made every cycle without a four-digit year fall
back silently. 33/33 on `checks/ytd-proration.py`, proved able to fail five
ways &middot; 454/0
authoriser (3 new, both ways) &middot; 126/0 differ &middot; full `qa.py` sweep
green &middot; `setup-overview`, `repeat-project`, `table-fit`,
`project-tables`, `submit-gate`, `fn-pillars` green.*

*Earlier: 2026-09-01 &mdash; **&sect;238: the security follow-ups &mdash;
a CSP net and no dev files served.** The two items &sect;235 recorded as open,
both done and verified live. **(1) A build-time hashed CSP** as defence behind
the escaping fix: `build.py` injects a `<meta http-equiv="Content-Security-Policy">`
into the built platform whose `script-src` allow-lists every inline `<script>`
by the SHA-256 of its exact bytes and permits nothing else inline &mdash; so an
injected `onerror=`/`onfocus=` cannot RUN even if an escaping gap is ever
reintroduced. Hashed in the same build that emits the scripts, so it can never
go stale (the one failure mode a hashed CSP otherwise risks &mdash; &sect;91's
"a stale hash is a page that does not load"). The `vercel.json` header keeps
`'unsafe-inline'` for the GATE (`index.html`, not built here); the meta is a
second, stricter policy scoped to the platform, and the browser enforces both,
so a script must pass both &mdash; real blocks pass (hash), an injected handler
is blocked (no hash, no unsafe-inline). Only `script-src` is set, so nothing
else about the policy changes. Proved by `checks/csp-net.py` over HTTP (real
scripts run, an injected `onerror=` does NOT fire) and by a full `qa.py` walk
(every page, every viewer, ERRORS none) &mdash; the app adds all handlers with
`addEventListener` and injects no `<script>` at runtime, so nothing legitimate
relies on inline execution. **(2) A `.vercelignore`** so the deployment stops
serving internal files: sources, in-repo checks, mockups, snapshots, docs and a
separate app skeleton were all publicly fetchable (no secrets &mdash; keys are
server env vars, and the client rules already ship inline). None are needed by
the running site, so excluding them touches no runtime dependency; `lib/` and
`db/` are deliberately KEPT because the `api/*` functions require them (the
documented low-severity residual &mdash; server source, still no secrets). Live
after deploy: `scripts/`, `smp-app/` &c. now 404, the gate, platform and API
all 200. **STILL OPEN &mdash; the server-side DB write** ("every save wipes and
rewrites all 31 tables"): the acute cost was already removed by &sect;195
(batched reads and writes), and closing the rest means an incremental writer or
a read-authorise-write lock on the LIVE database write path &mdash; the one
change that could corrupt production data, so it is recorded for a dedicated,
staged pass rather than rushed.*

*Earlier: 2026-09-01 &mdash; **&sect;237: a view-as session starts where
their session would start.** Islam, closing &sect;234.2's finding: *"viewing
as needs to have the same server connection and relation and not inherit my
SMO abilities &hellip; so I get the errors."* The judging half has been the
viewed person's since &sect;185; what stayed the SMO's was the TAB, and
&sect;234.2 records how its history made the &sect;234 error unreachable from
view-as. `switchViewer` now rebases on the server's graph after a clean
&sect;204 flush &mdash; one GET, the boot's own `hydrate()`, `LIVE` and
`lastSaved` reset &mdash; a fresh sign-in by that person. The refused way
home deliberately does NOT rebase (&sect;184's put-back would be silently
destroyed), nor file://, demo, or a failed fetch. `checks/viewas-fresh.py`
against a stub whose dataset moves mid-run: **4 red** on the pre-&sect;237
build; viewer-switch, welcome, refusal-keeps-work, save-flush,
boot-skeleton, save-fidelity, report-saves, gap-fill, submit-gate, 126/0,
451/0 and the full sweep green.*

*Earlier: 2026-09-01 &mdash; **&sect;236 / &sect;236.2 / &sect;236.3:
the added slide moves slide by slide.** Islam, on Manage slides: the Add
button becomes **"+ Add slide after"** in his words, so it says where the empty
slide lands (&sect;236); then, of the arrows, *"the rearrange of slides doesn't
move around the fixed slides of the main flow"* &mdash; measured, **25 dead
presses of 28** walking Mobile's deck and a function's slide never moving at
all, because a stored position is an ANCHOR (&sect;50.3) and the arrows stepped
blindly one row, so a press into an unanchored run recomputed the same position
and repainted in place. &sect;236.2 made the press land on the nearest real
place and, on his ruling, made **between a pillar's measures and tactics** a
place (mirrored on a function: between a project's deliverables and its
milestones). He tested again &mdash; *"the slides jump from slide 9 to 13 one
jump .. the added slides can move slide by slide the prohipted slides from the
movement are the original slides"* &mdash; and he was right: &sect;236.2 removed
the lie and drew its landing places from the anchors that happened to exist, so
its own "deliberately NOT anchored" list (the SWOT run, the section dividers)
was still hopped four at a time. **&sect;236.3 is the rule in one sentence:
every ORIGINAL slide is a landing place, and what is pinned is the originals'
own order.** Every fixed slide carries an anchor now; **the existing keys do
not move** (&sect;30.2 applied to anchors &mdash; `swot`, `p<CODE>`, `cap<id>`
are untouched), so every picture already placed in a live tenant stays exactly
where it sits, and there is no migration. One grouping survives and is not a
gap: the parts of a table split by `deckFitPass()` share their parent's anchor
and are ONE stop, after the last part &mdash; a picture cannot live between a
table and its own continuation. `checks/slide-move.py` asserts the problem and
never a layout (&sect;94.8): every fixed slide a landing place, every place its
OWN key (a non-adjacent repeat would silently merge two gaps into one
position), and the walk's stops equal the deck's own slide list, down and back
up, on a unit AND a function. **5 red then 6 red** on the two builds before,
each printing his report verbatim. **AND THE LESSON IS MINE**: &sect;236's
one-step probe landed on a spot that happened to work and I generalised from
it &mdash; a probe that samples one position proves that position (&sect;94.2
wearing a green tick).*

*Earlier: 2026-09-01 &mdash; **&sect;235: one escaper, safe in an
attribute.** A security sweep found the platform's main text-cleaner `esc()`
escaped only `&` and `<` &mdash; a text-node escaper &mdash; while being used
inside double-quoted HTML attributes ~226 times. A literal `"` in tenant data
(a name, a plan note, an uploaded workbook cell) broke out of the attribute,
and because the CSP allows `'unsafe-inline'` an injected `onfocus=`/`onerror=`
ran in the reader's browser &mdash; the SMO's, with full SMO authority. Two
sites had hand-patched `.replace(/"/g,"&quot;")`, which is two patches against
226 and the definition of ad-hoc. Separately, the tenant's LABELS rendered RAW
at ~43 sites and, through `recipeText()`, raw into the knowledge base, so a
relabelled Pillar of `<img onerror=…>` executed for every reader. **THE FIX IS
THREE ONE-LINERS.** `esc()` (and `welcome.js`'s `wesc()`) now escape `>`, `"`
and `'` as well &mdash; INERT in a text node, so nothing displayed normally
changes, verified that `esc()` output is only ever concatenated into innerHTML
(never compared, keyed, or read back), so the two hand-patches become harmless
no-ops. `L()` now returns its result through `esc()`, closing the 43 raw label
sites AND the knowledge-base substitution in one place because every reader
goes through `L()`; the KB's deliberate `<b>` markup is untouched (the answer
template is trusted, only the spliced label was not). The KB raw-`<p>` render
is deliberately NOT changed, preserving formatting. Cost stated: a label
CONTAINING `& < > " '` (none of the 8 real labels do) would render as an entity
in a couple of double-cleaned spots &mdash; cosmetic, never a broken flow.
Proved not to damage anything: `qa.py` clean, and `report-saves`, `gap-fill`,
`submit-gate`, `knowledge-base`, `fn-ko-edit` all green &mdash; reporting,
filling, submitting and editing all reach the stored plan exactly as before.
Still open and NOT done here (recorded): the `'unsafe-inline'` &rarr; hashed-CSP
backstop that would stop any future gap executing, and a `.vercelignore` so
`db/`, `lib/`, `scripts/` are not served as static files (no secrets are
exposed today).*

*Earlier: 2026-09-01 &mdash; **&sect;234: one function's submit must not
carry everybody's report state.** Islam, from a live client session:
*"emergency error that we fixed 100 times before"* &mdash; a CF custodian
refused with **"You cannot report for admin."** four times over, and slides
lost across a sign-out the same morning. &sect;216's fault one part over:
`review` (submitted &middot; parked &middot; note &middot; slides, each keyed
by target for the whole tenant) still travelled WHOLE, so one submit carried a
stale copy of everyone's report state &mdash; refused where the victim's
rights stopped it, silently wiping where they did not. The differ splits it
per field and per target now; `REVIEW_PER_TARGET` is one exported list read
by the differ and the authoriser both; the apply side's new paths are an
allow-list; reopen deletes one key. Reproduced red-first, falsified at both
layers (11 red on the differ's pre-build; the reported sentence to the word
under `SMP_WHOLE_GRAPH=1` on a real Postgres), 124/0 &middot; 451/0 &middot;
24/0 &middot; round trip PASS on a virgin database &middot; `report-saves` and
`save-fidelity` green over HTTP &middot; full `qa.py` sweep green.*

*Earlier: 2026-09-01 &mdash; **&sect;232: removing a pillar or a
project.** The mockup an earlier session published for sign-off
(`design-mockups/pillar-project-remove/`), signed off by Islam and built: a
worded quiet-red control in the pinned editing head (&sect;194's edhead on a
pillar, &sect;194.2's edband on a project), drawn only while the pen is open,
opening the platform's own confirmation &mdash; what the thing holds, what has
been reported against it this cycle, and the way back. **Archive first,
always** (&sect;49.2's rule with a third caller, through the same
`archiveUnitPlan()`/`archiveCapPlan()` the import and Clear plan take), and
**never renumber** &mdash; ids are what figures, focus marks and snapshots key
on, so the survivors keep theirs. The server needed nothing (&sect;42's
fall-through already makes a structural plan change the office's). **And the
way back was broken for every pillars FUNCTION**: `restoreArchive()` resolved
a "unit" archive through `UNITS[a.key]`, and a pillars function's archives are
keyed `fn:<key>` &mdash; un-restorable since spec 010, found because &sect;232's
confirmation promises the way back; fixed at both ends
(`unitLikeWritable`/`unitLike` + `fnWriteBack`). The new control is `.rmplan`,
never `.rmbtn` &mdash; that word is taken (&sect;65.9).
`checks/pillar-project-remove.py` presses everything and asks the DATA: **13
red** on the pre-&sect;232 build, all green after. **And &sect;233, built the
same day on his sign-off of `design-mockups/hide-from-presentation/`: hiding
an element from the presentation.** His three decisions verbatim: **hidden is
NOT counted** in any score; **rows only** (an objective, a measure, a tactic,
a deliverable, an outcome, a milestone &mdash; never a pillar, a capability or
a project, so a whole slide cannot disappear); **the workbook carries the
mark**. One predicate &mdash; `SMPRules.isHidden`/`shown` &mdash; runs every
reader that averages, asks or counts, because not counted means not asked and
not owed or the product argues with itself: scores, reporting asks, the note
rule, Submit, the gap count and walk, the reporting pane, the deck and the
.pptx builder all answer together. The mark is `row.hide === true` riding
`extra` (no migration), stored as an ABSENCE (&sect;50.6); the pen's eye
toggles it (lit on the attention ground &mdash; a decision, not a warning),
read mode wears **"Hidden &mdash; not counted"** for everyone, and every row
sheet gains a **Hidden** column at the END (a validation range is a POSITION,
&sect;65) with blank saying nothing (&sect;54's adds-and-amends). The server
needed nothing (&sect;42's fall-through). `checks/hide-element.py`: **17 red**
pre-&sect;233, 21 green after; two literals in `fn-pillars.py` and
`project-tables.py` moved with the deliberate workbook change
(&sect;214.3's lesson).*

*Earlier: 2026-09-01 &mdash; **&sect;229: Enter commits a one-line
prose box.** Found during &sect;226's accessibility audit and built on Islam's
word: &sect;189 promised *"Enter blurs, which is what commits"* and no code
ever carried it out, so Enter inserted a newline into every growing title box.
One listener in the shell's bound-textarea branch, gated on `.grow`; a
definition keeps its paragraph key; nothing stored is scrubbed. The check is
`checks/enter-commits.py`, run red-first (4 failures pre-&sect;229).*

*Earlier: 2026-09-01 &mdash; **&sect;226: a function's objectives are
written at the page's width.** Islam, from Consumer Finance's Overview: the
table tight, the direction invisible, no unit, the objective not wrapping, and
Led by not open to edit. Three of the four were ONE omission &mdash; the
function Overview's editor had been left three unit-side fixes behind
(&sect;96.6's band, &sect;199's Unit column, &sect;189's wrapping prose).
Settled from a mockup drawn out of the real page; his two decisions recorded:
the unit side untouched, Led by opened for the office through the register's
own door. The full account is &sect;226 in the decisions log; the check is
`checks/fn-ko-edit.py`, proved able to fail (5 red pre-&sect;226).*

*Earlier, same day: **a milestone's collaborators, the
tactic's rule moved over (&sect;227, built as &sect;224 before main took the
number), and the project band's name box takes the line (&sect;228 — §194's
fix reaching the `edband`, 181px of 1223 and three lines &rarr; 85% and one).** Islam: *"for the projects milestones
please add collaborators beside the owner column similar to the collaborators
in the tactics in the units. align with me to make the addition correctly."*
Aligned before building, and both decisions are his: being named a collaborator
on a milestone is a **reporting right** (through the same `namedOn()` the
tactic already uses — the derivation was passing a milestone stripped to its
owner, and the row travels whole now), and the column shows **everywhere the
tactics show theirs** — ticked from the register on the Plan pane, read-only on
Performance and the deck's milestone slide. Fillable while empty and never
counted as missing (&sect;187/&sect;205, with `GAP_OPTIONAL.milestone` keeping
screen and server in one answer), emptied key deleted (&sect;50.6), no
migration (`milestones.extra`, &sect;177's road). The workbook's Milestones
sheet gains the column or a download-and-re-upload would silently drop every
name (&sect;22); the round trip is proved a fixed point. The header is
"Collabs." — the full word cost a 515px pane 11px at 830, found by
`table-fit.py` going red, and it is the word the tactics wear on every surface
(&sect;53.5). Falsified before believed: the derivation reverted fails 2, the
fill rule 1, of 451.*
*Earlier: 2026-08-31 &mdash; **v3.99: a plan travels row by row, and a
capability travels on its own (&sect;215, &sect;216).** Islam, on the
deployment: *"the CX is still getting errors on filling"* &mdash; Hala, working
on **CX**, refused by *"a project's milestones (**admin**) cannot be changed
here"*. **THE REFUSAL NAMED A FUNCTION SHE HAD NEVER OPENED.** Measured: every
capability in the tenant lives in the `group` part, `group` travelled WHOLE, and
one milestone owner sent **33,433 bytes** carrying all eight functions' plans —
so a difference anybody else had made was judged as hers, her own legitimate
work was thrown away with the refusal (a save is all-or-nothing, &sect;184), and
her stale copy would have wiped theirs. &sect;210 split the four keyed MAPS and
stopped; capabilities are an ARRAY inside a part. **33,433 &rarr; 168 bytes**,
and &sect;215 took a unit's plan the same way &mdash; 27,600 &rarr; ~200 &mdash;
so two of the office filling ONE unit at once now both land. **ANYTHING
STRUCTURAL STILL TRAVELS WHOLE**, which is the whole safety argument: a row
added, removed or moved falls back to &sect;210's behaviour, and adding a pillar
needs authoring rights the office alone holds (&sect;94), so the two people who
share a unit cannot change which rows exist. **THREE THINGS THE TESTS TAUGHT**:
the first build named the wrong part (`org`, the word the prose uses; it is
`group`) and every unit test passed because the fixtures carried the same wrong
name &mdash; the real-database test caught it (&sect;100.3); breaking the
structural guard made the differ THROW, the suite died at that trial and
`grep -c FAIL` read ZERO, a falsification that looked like a pass; and a
structural change ALONE falls back by accident, so only one **beside a field
edit** exposes the guard at all. `scripts/test-cx-refusal.js` runs her exact
scenario against main's module and this one: refused, her work thrown away and
the other function's wiped on main; accepted and both surviving here.

*Earlier: 2026-08-31 &mdash; **v3.98: a supporting function's Overview
is a supporting function's Overview (&sect;211&ndash;&sect;214.3).** Islam, on
Consumer Finance and Merchandising: *"they have a missing item banner in the
foundation"*, and *"pressing on the CON01 22 it doesn't take me to the pillars
it's stuck in the overview"*. **THREE SECTIONS ON ONE PAGE, TWO OF THEM WRONG,
and the record of why is the point.** &sect;211 found the navigation fault &mdash;
`gapMap()` walks a pillars function through `unitLike()` (right, &sect;59) and
handed out a UNIT's words for the two things not shared, so `CURSEC` was set to
a section the page does not have and the renderer fell back to its first, which
is the Overview. **&sect;211.2 THEN REMOVED THE OVERVIEW ON A MEASUREMENT OF THE
WRONG FIELD** &mdash; a pillars function does not store `foundation`; it stores
`aspiration`, `endInMind`, `clauses` and `swot` directly, exactly as
`fnAsUnit()` reads them and `fnWriteBack()` writes them &mdash; so *"it can
never hold one"* was false, and the deleted tab was the only place an uploaded
aspiration or SWOT could ever have shown. *A predicate false for the right
reason and false for the wrong reason is indistinguishable from outside, and
the whole conclusion rested on which it was.* **&sect;212 put it back with a
UNIT's foundation page**, which was the wrong neighbour, and **&sect;213 is the
shape**: a supporting function inherits its aspiration and SWOT from the unit
it plans under and never authors them, so it takes the CAPABILITY function's
Overview &mdash; *What it is* (Function &middot; Led by &middot; **Definition**)
and *Key Objectives* (Objective &middot; This year &middot; **Weight**), one
builder for both formats and asserted as their AGREEMENT rather than as a list
of headings. **THE TEMPLATE STOPPED ASKING** for a strategy a function does not
author (no Foundation, Aspiration or SWOT sheet; a Weight in place of the
3-year target) **and a UNIT'S IS UNTOUCHED**, measured rather than claimed.
**&sect;214 MADE THE OVERVIEW MANDATORY** &mdash; and the server changed in the
same breath, because counting a gap the save refuses is &sect;184 exactly.
**&sect;214.2 THEN TOOK THE OBJECTIVES BACK OUT** at Islam's direction
(*"the key objective specifically should not count"*), into `GAP_OPTIONAL`
rather than out of the shared list, which is &sect;205's lesson paid rather
than repeated. **&sect;214.3 removed the explanatory line** until its wording is
settled, recorded as outstanding. **THREE FAULTS WERE FOUND BY LOOKING AT
SCREENSHOTS AND NOT BY READING CODE** &mdash; a line contradicting the card
beside it, an empty definition printing *"undefined"*, and a red *Missing* left
standing over a value that had stopped being counted &mdash; and one by running
the whole suite rather than the file just edited: deleting a dead function by
slicing between two anchors took a live one with it, and **every clause Add and
Remove in the product, business units included, threw inside its own click
handler**, invisible to a page-load error listener and identical to a button
that does nothing.

*Earlier: 2026-08-31 &mdash; **v3.97: send what changed, and apply it
onto our own copy (&sect;210).** Islam, after a morning of refusals naming
things nobody had touched: *"why is the whole plan is sent, why don't we just
send the changed element only not to cause this issue?"* **He is right, and it
is the root the day's three faults share.** Every save posted the WHOLE graph
and the database's copy was thrown away and replaced with the client's &mdash;
so work done before a view switch rode into a save under the new identity
(&sect;204), **a tab open a while silently overwrote everybody else's saved
work** (measured against a real Postgres: an aspiration and a register rename,
both gone, no error anywhere), and a refusal could name any part of the
product because every part was in the envelope. **THE SHAPE IS "APPLY, DON'T
REPLACE"**: the client sends the parts it changed and `api/state.js` applies
them ONTO THE STORED GRAPH before judging. **Nothing downstream changes** —
`authorize()` still compares stored with incoming, `writeState()` still writes
a whole graph &mdash; and that containment is why this was safe to do in an
afternoon on a live product. `lib/graph-diff.js` is ONE module both sides use
(&sect;42). **The granularity is a top-level part**, except the four maps keyed
by subject, compared entry by entry; **finer needs arrays matched by row ID**
(&sect;48) and is its own change, so the residue is stated rather than implied:
two people on the SAME unit still resolve last-write-wins there, and everyone
else no longer collides at all. **A key that went is not a key set to null**
(`priorCycle` is legitimately null), so `set` and `del` are two lists; **a path
the server does not understand is refused, never guessed at**. **The
whole-graph path stays** for tabs open on the previous build, because refusing
them would turn a data-safety fix into an outage mid-sentence. Proved and
proved able to fail: `SMP_WHOLE_GRAPH=1` restores the old behaviour and
`test-two-tabs.js` goes **11/11 &rarr; 4 failures**. And one check's stub had
to learn the same step (&sect;100.3) &mdash; it read `body.state`, answered 500
to every save and reported 14 failures; *a stub that does not model the server
is testing something the product does not do.*

*Earlier: 2026-08-31 &mdash; **v3.92: three from the welcome screen
(&sect;202).** Islam, using v3.91. **The house was SQUARE and the mark was not
in the middle of it** &mdash; &sect;200.2 fixed the box and that was half the
answer: `.navmenu-btn` is a worded pill, so it centres DOWN and starts its
content at the LEFT, which is right for a word and wrong for one mark in a
square. Measured: **1px of gold left of the house, 12px right**, at every
width, in both states; `justify-content` was `normal` and had never been asked.
Now 7/7/7/7 &mdash; and **the check's square assertion could never have caught
it**, so the four GAPS are what is asserted now (3 red without the fix).
**The intro round folds**: it is the one thing on that screen not waiting on
anybody, and shut it is one line that still NAMES the round (&sect;61 &mdash; a
fold hiding its own name is a feature nobody finds). The HEADING is the control,
never a caret beside it (&sect;32: two targets for one act, and the smaller one
is the one people press); open/shut is read off the body rather than kept in a
flag beside it (&sect;53.5). 6 red drawn open &mdash; one of them `welcome.py`
&sect;4, which pressed *Start the round* directly and must open the fold first.
**And Continue already named four kinds of place and missed the fifth**:
measured, `mobile`&rarr;*Continue to Mobile*, `fn:finance`&rarr;*Continue to
Finance*, `group`&rarr;*Continue to the group*, and **`setup`&rarr;*Continue***
&mdash; `placeLabel()` does not answer for Setup, because Setup is not a place a
ROLE is held. Setup is where the house now sits beside the gear (&sect;193.2),
so it is a common way in; *Continue to Setup* is honest, since Continue steps
aside and the page behind is Setup. **The null case was checked and deliberately
not branched** &mdash; `WELCOME.offer()` runs after the boot paint, so `current`
is always set (&sect;24: no branch for a path that cannot be reached).*

*Earlier: 2026-08-31 &mdash; **v3.91: the wall, and the fillable unit
(&sect;200.2&ndash;&sect;201.2).** Three fixes from Islam using the shipped
v3.89, all reported in one message. **The house glyph stopped being squeezed**
(&sect;200.2): drawn right, sat in a flex row that shrinks its items &mdash;
`flex:none`, asserted as a SQUARE at 1000px. **A boot that lands on the baked
example says so** (&sect;201): *"it opened on the prototype page with no way to
exit it!!"* &mdash; my first reading was wrong (I answered about &sect;173),
and the real path is `sync.js`: a failed or 8-second-late `/api/state` lands
`land()` on the baked Raya Trade demo SILENTLY. The fallback stays (&sect;94.10
built it so a broken server never leaves a grey page); what changes is that a
wall now says it is the built-in example, not your data, that your data is safe
on the server &mdash; `save()` already refused while not live, so the wall
makes an existing refusal VISIBLE &mdash; with *Try again*, a 10s probe that
reloads by itself the moment the server answers (a 500 keeps waiting rather
than reload-looping), and a deliberate *Look at the example anyway*
(&sect;61: a wall with no way past is a trap). Asserted in
`checks/boot-skeleton.py` &sect;4, the ONE file that can see the boot path
(&sect;94.11), proved able to fail: **7 red** with the wall's call removed.
**And a missing unit is the filler's to add** (&sect;201.2): *"he can't fill
the unit while he needs to fill if missing"* &mdash; right, and it was
&sect;184's shape one field over: the unit rides ON the target string
(&sect;199.4), so adding `%` to a bare `30` amends a non-blank value and
amending is the office's. `SMPRules.unitAddedOnly()` is the narrowest yes
&mdash; target fields only, stored unit EMPTY, number byte-identical &mdash;
asked by the screen to draw the picker and by the server to accept the save
from ONE function (&sect;42); the write is a PENDING fill (&sect;145), the
undo is its own transition, and **a unit is still not a counted gap** (46 of
178 shipped targets have none and are complete), so the picker offers without
nagging and a row whose unit is set stays the office's. The measures table
grows its Unit column decided ONCE per table, or header, rows and Add-row span
disagree (&sect;53.5). Proved at both ends: seven new authoriser cases (2 red
with the rule stubbed false), and `checks/objective-unit.py` &sect;9 drives
the exact state from his screenshot through real fill mode and reads the plan
back, inheritance included. `test-authorize` 423/0.*

*Earlier: 2026-08-31 &mdash; **v3.89: the unit, the repeat in months,
the Overview, the welcome screen's cycle, and the corner that comes back
(&sect;195&ndash;&sect;200).** A save cost **236 network crossings and costs
45** &mdash; the 504 Islam hit filling CX, root-caused by counting rather than
theorising: the writer issued an INSERT inside four loops and the reader asked
33 questions one at a time; both travel batched now, the reader as ONE message
from ONE snapshot, with the bind-parameter cap chunked out loud (&sect;195).
**The repeat is a count of months** with `"cycle"` still meaning what it meant
(&sect;196); **the chat corner retries its first answer** instead of staying
hidden three minutes after one failed poll &mdash; his report, and my first
diagnosis was wrong (&sect;197); **the home mark is quiet until something
waits, then gold**, counting the welcome screen's own list so it can never
open onto "Nothing is waiting on you" (&sect;197.2); **an unreadable date
reads Missing with the value beside it** and the workbook finally checks a
project's own dates (&sect;197.3); **the Setup Overview leads with the
queue** and the rail counts only what is folded (&sect;198); **a key
objective and a pillar measure get a UNIT** &mdash; stored NOWHERE, because
178 targets round-trip through the split/join pair with zero failures, so the
column is a view: picked from a fixed list (money is B EGP &middot; M EGP
&middot; EGP only, `#` committed to), set in the pen, riding the figure in
the view, and **a typed number inherits the row's unit** (&sect;199); **the
cycle summary joined the welcome screen gated on `c_cycle`**, because
business-wide figures on everyone's screen would be a new disclosure arriving
as a layout idea (&sect;200). Before this merge, both live incidents were
REPLAYED: the CX refusal keeps every good fill and offers the put-back; a 504
mid-save loses nothing, says so, and the retry lands it. 19/19 checks,
authoriser 416/0, overlapping saves torn-write-free, full sweep clean.*

*Earlier: 2026-08-30 &mdash; **v3.78: an attention item you can
answer, on the box it is about (&sect;190)**. Islam, from the register:
*"attention items that stays attention item is a problem always give me the
option to dismiss and make gnerally the dismiss under the box with the issue and
mark the issue box with some sort of surrounding outline to make sure I
understand what is the issue."* **THREE OF THE SEVEN KINDS WERE A LIFE
SENTENCE** &mdash; a seat somebody genuinely meant to give (&sect;186 exists to
raise it, and the office still has to be able to say *yes, on purpose*), a row
that never signs in, and two people who really are two people (&sect;87)
&mdash; counting on the button, the Setup Overview and the welcome screen for
ever, with no data to change that would clear them. **A count nobody can get to
zero is a count people stop reading**, and it takes the six kinds that do matter
down with it. **A DISMISSAL REMEMBERS WHAT IT ANSWERED**, which is the whole of
why one is safe to give: `attnMark()` fingerprints the FACT &mdash; which seat
over which place, which address, which collision &mdash; so dismissing *"they
hold Super user"* says nothing about the NEXT seat somebody is given, and moving
the dismissed person brings the item straight back. &sect;180's rule (*saying it
again clears the answer*) applied to every kind at once. Stored as an absence
riding `people.extra`, so nothing is migrated, and filtered in `attentionOf()`
alone, because the queue, the count, the button, the Overview row and the
welcome screen all read through it (&sect;116.2: one list). **AND THE SENTENCE
GAINED AN ADDRESS**: &sect;116.2's band said what was wrong ABOVE nine boxes and
left you to guess which &mdash; worst on the two items that name a place, which
read as being about whichever box you look at first &mdash; and it was the
QUEUE's alone, so anybody reaching the same row through *Edit details* was told
nothing at all. The band goes; the sentence sits under the control that answers
it, inside a ring on the whole field, in the WARNING ground, because outstanding
is not broken (&sect;168). **A kind no field answers is SAID, never dropped**,
and a declaration keeps the one control it has had since &sect;180 rather than
gaining a second (&sect;53.5). **Proved able to fail: 21 red** &mdash; and two
of the check's own first failures were the CHECK: **the stub answered the wrong
action names**, so both server-backed kinds were reported as not raised by a
build that raises them perfectly. *An action name is the product's &mdash; read
it out of `sync.js`, never guess it.* `qa.py` clean.*

*Earlier: 2026-08-30 &mdash; **v3.72: a date the platform cannot read,
and a refusal that costs only the row it named (&sect;184)**. Islam, from the
deployment: *"the CX strategy custodian got this error on submitting the report
and they lost all data they inputed and the dates showed waiting confirmation
and I didn't get them as the SMO."* **THE REFUSAL WAS CORRECT AND THE LOSS WAS
EVERYTHING AROUND IT** &mdash; reproduced against the real authoriser before a
line was written: an empty due date filled is `gapFill` and accepted; the same
act on a date holding **`30/09/2026`** is `capPlan` and refused, because a
non-blank value is not a gap, so correcting it is authoring and authoring is
the office's (&sect;94). Right on its own terms. What is wrong is that **the
whole graph posts together**, so that one row failed the whole save, took three
legitimate fills with it, and the only control on the banner was *Discard the
change and reload*. They never reached the database, which is exactly why the
SMO never received them. **`monthsOf()` MOVES INTO THE SHARED RULES** &mdash;
the platform's definition of a time lived in the browser alone, so the screen
and the save answered *"is this a date"* differently (&sect;42's drift) &mdash;
and an unreadable date is a GAP now, keyed on the field name, asked by the
counts, the cell and the server through one function. **`blank` and `open`
stay apart deliberately**: the row opens to a filler AND still shows
`30/09/2026`, because rendering the word *Missing* over it would hide the value
somebody is being asked to correct (&sect;96.2). **AND THE SECOND FIX IS THE
LARGER ONE, BECAUSE THE FIRST TWO DO NOT ANSWER THE QUESTION HE ASKED**
&mdash; *"is that covering the fix for reporting without losing the data even
aprtially?"* No. So the verdict carries an ADDRESS now, not only a sentence:
target, row id, field, and the value the row HELD. The banner names the lines
and offers to **put back those and save the rest**; Discard stays, and is never
the only control again. **`splitRows`' plan half had to learn to name its
rows** &mdash; with `planMoved` unchanged as the gate, because deriving it from
the row list would quietly WIDEN what is allowed (a key-order difference is
what Postgres jsonb hands back, &sect;145). **`undoable` is the SERVER's
answer**, and a change to WHICH rows exist offers no button at all: one that
cannot work is worse than the destructive one, because it looks like it did
something. **Proved able to fail three ways** &mdash; `gapBlank` restored: 3
red, among them *"all three in one save &mdash; the report, reproduced"*;
`onPlan(null)` restored: 2 red; and `checks/refusal-keeps-work.py` against the
shipped previous build: **11 red**, the banner reading *"&hellip;cannot be
changed here.Discard the change and reload"* and nothing else. **Two of the new
checks' own first-run failures were the CHECK** &mdash; six month buttons
counted because an earlier section had left the page as the office
(&sect;50.6), and a console listener reporting the 403 the file exists to
produce (&sect;128). 336 server assertions pass; `qa.py` clean.*

*Earlier: 2026-08-30 &mdash; **v3.65: a link in an email has nothing to
be relative to (&sect;176, spec 027)**. Islam pressed the button in a message he
had sent himself: **"The application can't be opened. &minus;50"**. The link was
`smp-orpin-tau.vercel.app` &mdash; what he typed, mailed verbatim. **A browser
forgives a missing `https://` because it has an address bar to guess with; an
email has no base document**, so the mail client hands the raw string to macOS,
which looks for a file of that name. The button was dead for **every
recipient**, and nothing between typing it and sending it said so.
**THE FIRST TWO ANSWERS WERE WRONG AND THAT IS THE LESSON**: he reported the
test send as not working, so I proved the send path sound end to end (19/19 on
the server against a real Postgres; the button pressed in a browser at six
window sizes) and asked what he saw &mdash; *"nothing happened at all"*, which
is a disabled button, so I went hunting for what disables it. Then the
screenshot arrived and **the email had already been delivered**: the send was
never the fault. *The symptom a person reports is the one they can SEE, and it
is not always the one nearest the cause.* One rule now (`SMPRules.webUrl`) in
the shared module, because the composer COMPLETES and the server REFUSES and
two rules for one question is &sect;42's drift with an inbox on the end of it
&mdash; and **completing is not guessing**: only a value that is already a host
gets a scheme, everything else is refused, since inventing an address is how a
message goes out pointing somewhere nobody meant. **Two more found by looking**:
the test email shipped `href="#"` whenever the platform did not know its own
address (a quiet no-op on a page, the same &minus;50 in an inbox), and the two
emails **disagreed about where the platform is** &mdash; one sent people to the
sign-in gate, the other to the platform. **AND NO CHECK HAD EVER PRESSED EITHER
SEND BUTTON**: `data-mailtest` appeared nowhere in `checks/`, because the whole
surface is the empty state over `file://` &mdash; and **a dead link renders
perfectly**. `checks/email-link.py` asserts the link that LEAVES, read out of
the html actually posted, and was proved able to fail first: **18 failures**
against the previous build, among them `and it is absolute &mdash;
['smp-orpin-tau.vercel.app']`, the reported fault reproduced. Recorded and not
fixed: messages already sent keep their dead button.*

*Earlier: 2026-08-29 &mdash; **v3.64: a Setup page that fits, an editable
scale, the away threshold, and a change saved at once
(&sect;167&ndash;&sect;170)**. Islam, on the
Platform Inbox: *"on scrolling up the messaging headr is lost the side rail of
the messages header is lost as well and the setup rail header and srach are
lost all of this is supposed to be sticky."* **THEY ARE ALL STICKY, AND
&sect;135.9 MEASURED THEM HOLDING at eleven window sizes** &mdash; and that
measurement was of the wrong element. `.setuprail` is itself sticky, and on a
page where the rail is the TALLEST thing in its row a sticky box has **zero
travel**, so `top:97px` never engages and the rail scrolls away carrying its
own pinned head and search: measured at 1440&times;760, rail at y=37, head at
y=38, chrome ending at 75. **And the 60px of scroll that did it was a guessed
constant going stale** (&sect;122.5, third time) &mdash; `.wrap` ends every
page with `padding-bottom:80px` while the rail's cap, the register's
`.panefill` and the inbox box each reserved **20**. **My first fix was the
wrong way round and the check caught it**: reserving the full 80 left the
register's table 80px short of the fold and `checks/register-header.py` went
red six times on &sect;122.5's own assertion &mdash; correctly, because 80px
below a box already sized to the window is an empty band you have to scroll to
see. Two numbers, then, with `:has(.setupsplit)` letting the page ask which
applies. **AND TWO CHECKS WERE BLIND TO &sect;148's WELCOME SCREEN**, one of
them reporting it as a product defect: *"a click at its centre reaches the
bubble &mdash; DIV"* was `.welcomeover`, and it had been recorded one section
earlier as real on the strength of reproducing on main &mdash; *a finding that
reproduces on main is still a guess about the cause*. Also: **the scoring bands
are the tenant's** (&sect;167) &mdash; add, remove and recolour a level, where
the colour **is** the key, so picking red is also what makes that level one a
reporter must explain; two is the floor and the reason is said; the bottom
level always starts at 0. And **how long somebody counts as away** (&sect;168)
is a box on the Away email row rather than a constant in `api/chat.js` beside a
hardcoded *"three minutes"* in prose &mdash; whose first build answered ONE
MINUTE for every untouched tenant, because `Number(null)` is 0 and finite.

*Earlier: 2026-08-29 &mdash; **v3.62: the Performance line, three bands,
and two headers found lying across their own rows (&sect;162&ndash;&sect;163)**.
Islam's seven from using the product on a squeezed window. **Three of them were
one lesson each.** The hover he reported as *"not working"* WAS working &mdash;
as a native `title`, which waits a second, hangs off an 11px target and on an
iPad does not exist; it is the product's own bubble now, opening on hover AND
on focus, which is what a tap gives. Then he reported *"a black box and later
the description"* on the compiled cell: that cell built its own span and kept
its own `title`, so it took the new bubble with **no text to put in it** and
the browser's tooltip a second behind &mdash; &sect;96's lesson exactly, a
helper that exists is not a helper that was used. And the bands *"are still
like the past"* because **they are a row in a table**: `sync.js` hydrates them
over the baked default, so changing what the product ships with reaches a fresh
deployment and nothing else (migration 029 moves a tenant still on the shipped
four and leaves a customised one alone &mdash; both cases driven against a real
Postgres). **THE ONE WORTH READING IS &sect;163.5**: every Setup table pinned
its header to a PAGE offset while sitting in a box that scrolls, so the browser
measured that offset from the top of the TABLE &mdash; the Scoring bands
heading sat **136px down its own body, across the third row, at every width
with the page unscrolled**. &sect;130.2 recorded that exact fault, fixed
`.acgrid`, and stopped; every other Setup table still had it and nobody had
looked. **AND MY OWN FIRST GUARD BROKE SOMETHING REAL** &mdash; raising the
pinned pane title above everything made fill fields unclickable beneath it and
the whole sweep failed; a guard that costs a working interaction is a second
fault, and the tie it was meant to settle needed breaking from below instead.
Also: the reading-the-colours banner was the page's control row, which is why
Report and Presentation read as a row of their own; the squeezed rail said
`display:flex` for versions and meant nothing by it, because reordering had
wrapped its rows in a container; and the chart legend was keeping a second copy
of the bands that already disagreed with them.*

*Earlier: 2026-08-29 &mdash; **v3.59: the welcome screen's way out
(&sect;159)**. Islam, using what &sect;148 shipped: *"continue to the unit or
the function button is a bit not obvious."* Five variations drawn in the real
screen and he chose **B**, one bar across both columns. **The fault was three
things and weight fixes one** &mdash; it is the ONLY exit (no &times;, no
Escape, no click-outside), it was the quietest thing on a screen holding three
bordered buttons and a solid fill, and it sat INSIDE the left column, so its
scope read as the end of the list. **Measured, not asserted**: the link began
585px into the columns and 165px above their bottom, and **below 960px it was
not even last** &mdash; at 900px the screen is 949px tall with 411px of side
column after the way out, so somebody looking for the exit at the foot finds
*Your pages* and the intro round. **The empty case closes a drift**:
&sect;148's own approved mockup said Continue becomes the loud control when
nothing is waiting and the build never did it, so an empty welcome offered a
grey link and nothing else &mdash; and the promotion is its own class, because
`.wcta` means *an action row shouts* and this is not one. **The drawing's grey
sub-line is deliberately not built** and **Escape is deliberately still not
wired**, both recorded rather than slipped in. Proved able to fail: **7
failures** against the pre-&sect;159 build, exactly the seven new assertions;
full `qa.py` green.*

*Earlier: 2026-08-28 &mdash; **v3.59: the UI/UX audit, waves 2&ndash;4
(&sect;149&ndash;&sect;158)**. Islam: *"I need a refinement plan for the whole
platform."* Twenty items audited, and what shipped is smaller than the audit
predicted because measuring kept dissolving items. **The last of them
(&sect;158) is the one worth reading**: the plan tables were cut off down the
right on a smaller window, and the cause was that
`table { min-width:620px }` is a FLOOR &mdash; the pane narrows past it and the
table does not shrink, it gets sliced (585px of pane against 620px of table at
900px). **Two wrong fixes were drawn first**: tightening cell padding narrowed
the columns and left `scrollWidth` at 620 to the pixel, because the flexible
column absorbs every pixel saved; and &sect;108.5's scroll shadow was an
affordance over a fault, undemonstrable anyway (headless paints no scrollbar,
and an iPad's is an overlay that vanishes). **&sect;53.5 paid within a minute**
&mdash; with the floor gone a unit's Plan fitted and a supporting FUNCTION's
Projects pane still ran 41px over, a different fault (five columns, intrinsic
minimum) needing the padding after all. **`:not(.setuppane)` was found by the
check**: Setup's pane is also `.pane`, so the obvious selector would have
squashed the register to fix the plan. **And the obvious both-ends assertion
could not fail** &mdash; `.cfg table`'s 760px floor is dead code, re-declared
as 0 later in the same file (the fifth duplicated rule this project has
recorded), so the reach is asserted on the SELECTOR the browser holds.
Also in the wave: the destination row scrolls instead of breaking below 1100px,
a failed render says so on the page, the last 800ms survive leaving the page,
the reporting controls ride the tab row, hover and focus are measured at last
(three contrast repairs), two typefaces instead of five, and the group cards'
sentences agree with their numbers. **Nothing else broke between 1440 and
768** &mdash; five pages, seven widths, both themes &mdash; and my own probe
cried wolf twice before that could be said, measuring the CENTRE of a control
half-scrolled under a clip.*

*Earlier: 2026-08-28 &mdash; **v3.58: the welcome screen (&sect;148,
spec 025)**. Islam: *"let's work on a Welcome screen for the user with what
needs to be done with good design and name of company and smo and overview of
his list of actions and info to work on or take an intro round."* Settled over
THREE mockup rounds before a source was touched, and two of the three
decisions are his corrections of the first drawing: **the greeting leads on
the left** (band B, the tenant a compact signature whose every line starts at
the separator hairline), and **no number ever stands without its noun**
(variation C &mdash; the bare 3/4/1 badges were *"confusing"*, so every count
lives inside its own sentence). **NOTHING NEW IS COMPUTED**: the submission
row is `reportPending()` + `reportedCount()` + `submitBlockers()`, the gaps
row is `seesGaps()`/`gapTotal()`/`gapMap()` (&sect;145) so a plain reader
never sees a nag they cannot clear (&sect;69), the reply row is
`CHAT.unread()`, and **the office's list IS the Setup Overview's own
`attentionRows()`** (&sect;108.10) with the inbox's count asked through
`CHAT.officeQueue` and written into the list when it answers &mdash; a count
with no answer draws no row, and an empty list says **"Nothing is waiting on
you"** (&sect;45.2). **EVERY DOOR PRESSES THE PLATFORM'S OWN CONTROLS**
behind `setTimeout(&hellip;,0)`, because the handler fires on a real click and
&sect;30.1's CLICKING guard holds any paint until the click lands
(&sect;145.14's fault avoided); Continue only steps aside, since the platform
under the overlay is already on the page &sect;94.6 chose. **ONCE PER BROWSER
SESSION** (sessionStorage; a throwing store reads as seen, &sect;107's rule);
never over `file://`, never on a projector. **THE TOUR IS NOT LOST**: while
the welcome is up its auto-offer is skipped (two docks fight for every click,
&sect;118) and the **intro-round card is the tour's offer made visible** and
its reachable home again (&sect;119.4) &mdash; `TOUR.storyFor()` gates it, so
never the office, and starting it hands the screen to `TOUR.start()`. Proof:
`checks/welcome.py` over HTTP with a stub (&sect;94.11), the state MADE
(&sect;94.2), agreement asserted rather than constants (&sect;94.8 &mdash;
the first run asserted the made gaps as exactly 3 and the demo plan already
owes 22 of its own), doors read back through `current`/`REPORTING`
(&sect;70), and **proved able to fail** against the shipped pre-&sect;148
file, where no overlay ever draws (&sect;94.5). Full `qa.py` green.*

*Earlier: 2026-08-28 &mdash; **v3.57: a custodian per project
(&sect;147, spec 024)**. Islam: *"in a case of a function that has 2 projects
each project has an owner so the custodian here is not on the whole capability
there is a custodian per project"* &mdash; and then, correcting the first
build (&sect;147.7): *"contributor is not the right naming &hellip; these are
2 roles."* **THREE BOUNDED ROLES, ALL DERIVED FROM BEING NAMED, NONE GRANTABLE
BY HAND**: a **Project owner** (`powner`) from a project's Owner row; a
**Pillar owner** (`plowner`) from a pillar's, on a unit or a pillars function;
a **Contributor** is everyone else the plan names &mdash; a collaborator, a
stakeholder, a milestone's owner &mdash; who **reports NOTHING until the
tenant opens the Contributor row**, and then only the rows that name them.
**TWO CONDITIONS before an owner reports, his words and nothing else**: the
role's own Reporting cell at edit (both owner rows SHIP AT VIEW &mdash;
condition 1 is that the grant is made on the table) and being named the Owner
&mdash; the register attachment the first build required is DROPPED, because
it was the silent third condition behind "I added ahmed abdelzim to a project
and he is not able to report". The line is the thing named, whole; none of the
three ever submits, writes the note or adds slides (`OWN_LINES_ONLY` carries
all three, so the picker, the workbook, the merge and the delete-blockers
already answer right). **ONE REACH RULE, PER ROW** &mdash;
`boundedReach()`/`mayReportRow()` in `lib/rules.js`, asked by the unit pane,
the function pane (per row now: a project's owner and a milestone's owner
meet on one table) and the authoriser; `ctxOfUnit()`/`ctxOfFn()` hand the
server the same row-with-context. **AND THE BUILD SURFACED A DRIFT**: a
pillars function's Report page asked the own-UNIT cell while the server
judged the own-FUNCTION one &mdash; invisible while custodian and head ship
with both at edit; `canReport()` asks `k_report` for `fn:` targets now, and
the server's own-lines narrowing reaches pillars functions (the `isFn` skip
is gone). **The seed gains chips and nobody gains grants** (24 of 33 demo
people are named owners in the worked example; both new rows ship at view).
**The world had to learn the capabilities**
(&sect;102.4's two allow-lists, both edited, asserted).
**AND THE GROUND IT STANDS ON WAS BROKEN**: since migration 024
the server had classified a custodian's DELIVERABLE report &mdash; and the
milestone % that &sect;104.10 REQUIRES &mdash; as PLAN and refused them, while
the screen offered both (`REPORT` had no deliverable family and `milestone`
never gained `pct`; no capReporting test existed to notice). Fixed and
asserted by name. **THE OWNER STAYS A NAME, DECIDED BY A MERGE** (&sect;147.4):
a keyed `owner`+`ownerKey` picker was built first, and `git fetch` before
pushing found &sect;130.1 already on `main` from another session &mdash; Islam's
own wider ask, register-picked owner NAMES on five plan fields, the
name-not-key decision recorded with its reasoning &mdash; so the `ownerKey`
layer was removed and this feature rides that model whole, because a tactic's
owner is already rights-bearing by name and one question must not have two
answers (&sect;53.5). Proved able to fail three ways before green was believed
(&sect;94.5): narrowing stubbed &rarr; 2 failures, derivation stubbed &rarr; 6,
screen gate flattened &rarr; 2. Seed scanned: nobody's standing changes.
**Flagged, not built** (&sect;147.6): a pillars function still derives no
contributors, and the bar's "View only" pill to a contributor with editable
rows is the unit side's own long-standing wording &mdash; changing it is a
decision for both sides at once.*

*Earlier: 2026-08-28 &mdash; **v3.56: a test copy is a send, and it says
so (&sect;146)**. Islam, using the product: *"there have been multiple sent
emails earlier. weren't they saved? I can't see them in the overview."*
**NOTHING WAS LOST, AND ESTABLISHING THAT FIRST WAS MOST OF THE WORK** &mdash;
`messages` sits outside the state graph with no foreign key, so the
`TRUNCATE &hellip; CASCADE` on every save cannot reach it, and there is no
`DELETE FROM messages` anywhere in the product; driven end to end against a real
Postgres, a send writes its row BEFORE the emails go out and appears on the
Overview at once. **The fault is that TWO KINDS OF EMAIL LEAVE THIS PLATFORM
AND ONLY ONE WAS RECORDED**: `test` &mdash; *Send me a copy*, and the test send
on Email settings &mdash; sends a REAL email through the same builder and wrote
nothing at all, so from the record those emails had never happened. From the
screen they are one act. **THE MOCKUP CAUGHT THE FIRST DRAWING**: a mark beside
the heading pushed the frozen first column onto a second line, which is the one
thing a setup table may never do (&sect;88) and &sect;116.4's fault exactly
&mdash; it lives in the column that already answers *who got it*, where it costs
no height and is the honest answer for a row that has no audience. **DELETE
REACHES TEST COPIES AND NOTHING ELSE**, Islam's B from two scopes drawn with the
cost of each stated: the record of what the business was sent stays whole.
**The guard is asked twice on purpose** &mdash; the endpoint's own gate means
*"Communication is the SMO's"* and this one means *"destruction is the Super
user's"*, two questions with the same answer this week and &sect;94's drift the
day the first is widened. **AND ONE ASSERTION COULD NOT FAIL FOR THE REASON IT
EXISTED**: the line count was taken per text node, and the mark that wraps is
its own text node sitting happily on one line &mdash; the deliberate break
reproduced the exact fault while that assertion stayed green, and four others
caught it. Counted across the whole cell it reads `[1,1,1,1,2]`. Both halves
watched to fail first: **5 / 1 / 2** on the client, **3 / 11** on the server.*

*Earlier, from another session: 2026-08-28 &mdash; **v3.55: fill the gaps (&sect;145, spec
023)**. Islam: *"a special type of editing which is just filling the missing
areas — the missing targets, maybe the missing timeline, the missing
owners."* A third state on the two STRATEGY cells of Roles &amp; access —
View / **Fill gaps** / Edit — granted per role by the SMO, reaching only a
unit or function the person holds. **A gap is a place holding nothing**
(`GAP_FIELDS` in `lib/rules.js`, the same list the deck marks Missing — one
definition for screen, server and deck); writing the first value is filling,
touching anything already written is authoring, and no rows are ever added,
removed, renamed or reordered in this mode. **A fill is PENDING until the
office confirms it** (Islam's own design): live and counted nowhere, amber
everywhere it shows, still the filler's to correct — `row.pend[field] =
{by, at}`, stored as an absence (&sect;50.6), riding each row's `extra`
JSONB with **no migration** (proved on a real Postgres 16, clean slate
included). Confirming is REMOVING the mark — a tick beside the chip, or the
office simply correcting the value, which settles it in passing. **The
server judges transitions, not intentions**: a gap pass ahead of the diff
classifies fill / amend / unfill / confirm against a clone and lets
everything else fall through office-only (`gapFill` passes on authorship OR
the fill grant; `gapConfirm` on authorship alone). **Reporting flows,
performance waits**: figures and drafts land against a pending target, but
a row whose score-bearing field (dir &middot; target &middot; compile
&middot; weight &middot; quarters) is pending scores a dash, leaves every
average, and **blocks Submit** — the refusal names the rows and sends the
unit to the office, the only desk that can clear it. Two lessons paid for:
**Postgres jsonb reorders object keys**, so marks are compared canonically
or an untouched pending field reads as a phantom amend that refuses an
innocent save (&sect;42's `branding()` shape, one layer down); and a fill
holder is the first person to hold &sect;101's arrows BESIDE a pen — both
sat at `right:0` and the arrows ate the pen's clicks (&sect;70's family,
caught by the check PRESSING it). The matrix wears the mockup-approved
restyle (&sect;145.7: chip toggles, tinted lit states, hairline rows), and
**&sect;117's .pptx download button is HIDDEN for everyone at Islam's
direction (&sect;145.9)** — machinery kept, one line to give back.
**AND THE FINDING SYSTEM WENT RED AND WORDED (&sect;145.14)**, reshaped
from Islam's own screens: the whole missing bar &mdash; *"N Missing"*, one
red chip per owing place, the solid red **Fill in missing elements**
button &mdash; moved INTO the section row beside the tabs (*"not to waste
lines in the page"*), read mode included, nothing left in the page body
and the Strategy tab's number gone; a page owing nothing says so and
points away, because *"I couldn't enter anything"* was &sect;45.2's empty
hand wearing fill mode's clothes. The bug worth reading: **a real press is
not a programmatic one** &mdash; &sect;30.1's `CLICKING` guard HOLDS the
paint until the click lands, so the one-press walk read the read-mode page,
found no fields and marched off through another place's chip, while every
evaluate-driven probe passed; the walk now queues behind the release timer,
and the probe that found it had to live in the SOURCE, because reassigning
`window.fn` intercepts nothing called from inside the same script. Proved
by `test-authorize.js` &sect;16 (6 red on the pre-build) and
`checks/gap-fill.py` (fails from its first section on the pre-build; 58
assertions on the &sect;145.14 shape), plus the round trip on a virgin
database.*

*Earlier: 2026-08-28 &mdash; **v3.54: Send an email opens on what went
(&sect;144)**. Islam: *"the opening page ... should be a dashboard of what was
sent, to whom, how many people ... and when I say create a message it takes me
to another tab ... and when I finish and send it it should take me back to the
dashboard and show me that the message was sent there."* **NOTHING NEW IS
COMPUTED** &mdash; every send already wrote its row, and this is &sect;95's own
`renderDraftList()` / `renderSentList()` moved out of the header dropdowns they
were hiding in, so the list cannot say two things depending on where it is
drawn. **A SEND LANDS ON THE RECORD AND THE COMPOSER IS EMPTIED**, which is
also how &sect;143's rule survives: the send cannot be repeated by one press,
by construction rather than by a flag. A partial failure lands there too (the
message went to most people and the record is where the failures are named);
**only a send that never happened stays put**. **AND THE TWO FETCHES WERE GATED
ON `#msgsend`** &mdash; the Send button, now on another tab &mdash; so on the
Overview neither list was ever asked and both said *Asking&hellip;* for ever:
&sect;93 and &sect;51.11 exactly, a gate keyed on markup that moved, failing
silently and in the safe-looking direction. **Found by driving it, not by
reading it.** **AND THE ACTION IS MADE OBVIOUS** (&sect;144.8): a tab reads as
*where you are*, not as something to do, so the page's own purpose had no loud
control &mdash; three placements were drawn in the real page and Islam picked
**above the lists**, and named the button himself. Both costs were stated
before he chose and are recorded rather than re-argued: it SCROLLS AWAY on a
long record, and the platform now carries more than one noun for the one act
(&sect;87's twins, in vocabulary). **MERGED WITH &sect;135&ndash;&sect;141 FROM
FOUR OTHER SESSIONS**, which had renamed this very page to *Send an email* and
given it a second subtab of its own (&sect;135.3): the two section rows are ONE
row now &mdash; **Overview &middot; Compose &middot; Email settings**, what you
arrive at, what you do, and what you set once &mdash; and my
&sect;135&ndash;&sect;137 became &sect;142&ndash;&sect;144 because main had
taken those numbers first. **The header dropdowns are DELETED, not left
unused** (&sect;24): with the Overview holding both lists, `renderDraftMenu()`
and `renderSentMenu()` had no caller, and a builder nobody calls is one the
next reader takes for load-bearing.*

*Earlier: 2026-08-27 &mdash; **v3.54: the bar reports, and moves on
(&sect;136)**. Islam, using the product: *"When I send I don't get any
verification that the message was sent and the page stays the same view."*
Both halves were true, and they are TWO faults. **Success was written in the
failure-neutral voice**: the words were there, in `.why` &mdash; 12px, the same
quiet grey as an empty space &mdash; because `reallySend()` works out
`ok: !j.failed`, stores it, and **nothing ever read it**, so a FAILED send
turned red and a successful one got no colour at all. **And the loudest control
on the bar still said not-sent**: the orange button read *Send to 76 people* and
was live, with the message and the audience still loaded &mdash; **one press
from sending the whole thing again**, which is &sect;95 putting a confirmation
in FRONT of the send *because it cannot be recalled* and then leaving the button
loaded. It becomes **Write another**, and `sent` is its own flag because a
refused request and a partial delivery both read `ok:false` and only one of them
must lock the button. **BOTH BUTTONS ARE DRAWN AND ONE IS HIDDEN**, because the
way back must not repaint &mdash; the message is typed INTO the preview, so a
`paint()` on the first keystroke after a send rebuilds the contenteditable and
the caret dies mid-word; without a way back the composer is a dead end
(&sect;61), since the only control on offer CLEARS and somebody fixing a typo
would have to throw the fix away to get Send back. **The first build reached for
`--fs-small`**, which is the 12px it already was, and the check caught it
because it asks for a size worth READING rather than for a token name. Proved by
`checks/send-said.py` (retired by &sect;137, whose own check carries the one
rule that survived), watched to fail first: the pre-&sect;136 bar restored
&rarr; **5 failures**; `sendmsgTouched()` removed &rarr; **2**, the dead end
exactly. **One of its own first-run failures was the check** &mdash; `focus()`
puts the caret at the START of a contenteditable, so the typed character lands
first and the assertion had used `endswith`.*

*Earlier the same day: **v3.54: the email greets its receiver
(&sect;135, spec 021)**. Islam: *"can we make an option while sending the email
to customize the email by the first name of the reciever like starting the
email with Dear Ahmed and then the body comes after &mdash; it's a turn on and
off option."* **Every recipient already received their own email**
(&sect;74.3's one-message-per-person loop), so nothing about how many go out
changes &mdash; what changes is that they stop being IDENTICAL, which is why
the builder leaves a **marked region** and the SERVER fills it once per
recipient off the stored register (&sect;74.2). The region is **delimited, not
merely tokenised**: a token typed into the body can never be substituted, and
an empty name removes the WHOLE paragraph rather than leaving `Dear ,`. The
name is the register's own reader (&sect;93.8), so a compound first name is
kept whole &mdash; **"Dear Abd El Moniem", never "Dear Abd"**, which is a real
row on this register and the reason that question was asked twice.
**ONE LINE, NO PROSE**, and that is Islam correcting a two-line first draft:
*"the design of the setting is poor. It should be one line you dont need 2
lines .. and no explanations needed in the setting itself it's clear."* Right
twice &mdash; a label reading *Open with a greeting* beside a box holding the
word *Dear* had already said what the sentence said (&sect;127 from the other
direction), and the height was not the only cost: **two lines under the message
made the greeting read as a bigger decision than the button row beneath it**,
which is one line. **AND THE BUG WAS IN THE PLUMBING**: `SYNC.mailSend()` names
every field it forwards, so `greet` was silently absent from the posted body
&mdash; the emails would have been personalised perfectly and
`messages.greet` would have been NULL on every row, so **the record would have
said no message ever greeted anybody**. Found by asking what the page POSTS,
not by reading it. Proved by two halves, each watched to fail first
(&sect;94.5): `test-email-greeting.js` **stands in front of the provider** via
the new `SMP_RESEND_ENDPOINT` (&sect;100.3 &mdash; a test double behind an `if`
in `lib/mailer.js` would be a second code path shipping to production) and
reads what each recipient was actually sent, asserting each carries **nobody
else's name**; `checks/email-greeting.py` measures the screen and the seam.
**Two of that check's own first-run failures were the CHECK**, clustering a
row's controls by their `top` when three controls of three heights on one line
have three different tops &mdash; &sect;122.4, already written down once.*

*Earlier, from four other sessions: 2026-08-27 &mdash; **v3.50: the Setup header line, the marking
table, and a repaired matrix (&sect;135)**. Eleven asks from using the Setup
pages, of which seven turn out to be **one standard applied to sixteen pages**:
the page's own search, filters and buttons share the pinned line with its name,
the `SMO` pill and every count chip go, and the grey briefing paragraph goes
everywhere. **&sect;121.2 had left those controls on a row of their own for a
good reason, and that reason forbade the FAKE move rather than the move** &mdash;
a negative margin pulled a NON-sticky row up under a pinned title and scrolling
slid it out; putting them INSIDE the header makes them pin with it. **The
quick filters and the row count go the way the register's did**, and nothing is
hidden by it: every row carries `data-tkrow` and every one is drawn, so the chip
narrowed a view and never revealed rows a table was holding back.
**AND THE DAMAGED MATRIX HAD ONE CAUSE** (&sect;135.2): `.acgrid` is
`overflow-x:auto`, which makes the BOX &mdash; not the page &mdash; what its
header pins against, so &sect;121.4's 141px page offset pushed the Roles &amp;
access header **141px down inside the table**, onto rows three and four. All
twelve cells at one position, measured. It is the exact fault &sect;121.4 wrote
down about the register, on the one table its exclusion forgot &mdash; and
repairing it made &sect;117's *Own business unit* and *Own supporting function*
headings readable for the first time since the split shipped.
**FOCUS REACHES SUPPORTING FUNCTIONS** (&sect;135.5), in both of their shapes,
with the group's board growing the same half or the marks are stored where
nobody can see them; the switch is a segmented On|Off pair on the header line,
and the grey note it replaced was printing *"0 0 marks"*. **THE COMPANY IS
SOMETIMES DERIVED AND SOMETIMES STORED** (&sect;135.6) &mdash; read-only
wherever the unit has already answered it, written only where nothing else has,
so two fields cannot contradict one stored fact. **Send a message becomes Send
an email with the Email settings as its second section** (a status table, four
fields, a live rendered preview and a test send: not a dropdown), and Inbox
becomes **Platform Inbox**, and Focus measures moves to *Measurement* — the
rail's groups answer what you came to do, and somebody opening that page came to
say which measures matter (&sect;135.11). `checks/setup-header.py` was proved able to fail
first &mdash; **33 failures against the previous build** &mdash; and **two of
its own assertions could not fail when written**: one scoped to where the chips
had moved TO (&sect;113.8), and one measuring `tr.getBoundingClientRect()`,
which goes on reporting the un-stuck layout because **a table row has no box of
its own once its cells are positioned**. **Still not reproduced**: the left
rail's own header and search, measured holding at nine window sizes and three
scroll positions on this build and on main's.*

*Earlier: 2026-08-27 &mdash; **v3.49: the register notices two people
whose name reads the same (&sect;131)**. Islam: *"for the names you normally
take the first 2 names but you allow me to amend the name in the edit. can
you notify me as an issue to address if 2 people their 1st 2 names are the
same so I can edit one of them."* &sect;81.1 already LENGTHENS the clashing
guess so the register stays readable, and never told anybody; the pair now
also joins the **Attention queue** (&sect;116.2) until a Name is amended to
read apart, which is the act that clears it. **A notice, never a mark**: a
shared name is not evidence of one human (&sect;87), so the row wears no
`.dupemark`, the kind sorts LAST in the queue, and anybody the row already
flags as a possible duplicate is left to that flag &mdash; telling the SMO to
RENAME a row that may need MERGING sends them to the wrong control.
**The comparison is what was stored or guessed, never what is drawn**
(`readName()`: the typed value or the flat two-name guess), because
&sect;81.1's lengthening is a disambiguation painted OVER the collision
&mdash; and a TYPED name that still collides is still flagged, since typed
values are never lengthened and would read as one person for ever. The
`read` groups ride `registerDupes()`'s existing walk, so nothing changed
signature and nothing renders differently &mdash; the queue button, band and
counter carry the new kind through &sect;116's machinery. Proved in
`checks/duplicates.py` beside the Ahmeds it already injects, watched to fail
4 ways on the pre-&sect;131 build first (&sect;94.5); the first run against
the demo found a real pair &mdash; both placeholder company CEOs read as
"Company CEO,".*

*Earlier: 2026-08-27 &mdash; **v3.48: an owner is picked, a single item
keeps its rail, and the pinned title's corners (&sect;130)**, with two of the
three corrected by Islam LOOKING at them (&sect;130.6, &sect;130.7). **A
tactic's owner is matched against the register BY NAME** &mdash; `namedOn()`
reads it beside the collaborators, and that is what makes somebody a
Contributor who may enter that line's figure. Measured before a line was
written: **38 owner names across the demo plan, 14 naming nobody, and 32 of the
78 tactics** owned by a short spelling that matches no one. Five fields become
lists &mdash; project, milestone, tactic, **pillar** (read-only everywhere in
the product's life until now), and collaborators as a **ticking** list of
people or departments. **A stored name outside the register is KEPT in its own
group** (&sect;96.2), so a plan uploaded before today reads exactly as it did.
**A ticking list stays open and commits per tick**, which reverses the
single-select rule on purpose and is safe only because the `data-fld` handler
writes without repainting. **And a 1px clipped element scrolling is never the
page moving**: setting `selected` on a `<select multiple>` fires a real
`scroll` from the hidden native select, which closed the popup on every tick
near the fold &mdash; invisible for three versions, because the single-select
path never sets `selected` on anything. **The rail comes back for one item, on
units AND functions.**

**THEN THE TWO CORRECTIONS, AND BOTH ARE THE SAME LESSON.** The corner fill
painted in BOTH positions on &sect;53.7's rule that CSS cannot ask whether a
sticky element is pinned, at a cost I measured at 13px&sup2; and called
invisible &mdash; *"the corner still has this squared corner."* **The
arithmetic was right and the place was wrong**: those pixels ARE the card's
rounded corner, which is where an eye goes. So the one thing CSS cannot ask is
asked in JavaScript (`pinWatch()`, an IntersectionObserver re-armed after every
paint), and it **shipped once as a throw** &mdash; declared inside `wire()`,
called from `paint()`, so every paint ended in *"pinWatch is not defined"* with
the page still on screen (&sect;118, one section later). And the picker listed
the **full legal name**: invisible here, because all 33 demo people have a two-
or three-word name and none has a typed short one, so `knownName()` returns
`p.name` and the wrong column looked right. It reads the register's **Name**
now, through `displayNames()` so a clashing pair never reads as one entry
&mdash; **which meant `namedOn()` had to learn that name**, or &sect;130.1
undoes itself: the name rule moves into `lib/rules.js` and matches the key, the
full name, a typed `known`, and every leading run down to the register's short
form &mdash; **never one name**, or a bare *"Karim"* would hand reporting
rights to whoever shares it. *Two builds that were correct on the only data
this repository holds.*

Three new checks, each proved able to fail against the build before it &mdash;
**20 / 14 / 8**, and after the corrections **4 more** on the names and **6** on
the corner. The corner check **reported a correct build broken on its first
run**, because in the dark palette `--surface` sits between `--ground` and
`--surface-2` and an antialiased pixel lands on it by arithmetic
(&sect;68.10).*

*Earlier: 2026-08-26 &mdash; **v3.47: building a plan on the platform
(&sect;129, spec 020)**. Islam: *"I want the team of the SMO to be able to
build a plan on the platform directly … they identify a function or a unit
and set which way are they going to plan pillars or projects and then they go
in a flow."* Settled over two mockup revisions, and both of his corrections
ARE the design: **a map, not a march** (the band under the tab row is one
chip per section, openable in any order, each chip reading the DATA — ✓ /
count / ○ — so nothing is stored and pausing costs nothing), and **a row is
added whole** (every "+ Add" in build mode opens &sect;116's dialog shape
asking that row kind's fields in the outcome's order; the name makes Add
live, everything else is NAMED while empty and never forced). Only a
function is asked *pillars or projects* — a unit always plans in pillars —
and the door is beside Import: two doors on the page where plans arrive,
with **Continue AND Start fresh** on a subject with content (one button that
always cleared would make pausing cost the whole plan) and Start fresh going
through the import's own archive path (&sect;49.2). **PART ONE WAS AN AUDIT,
AND IT FOUND FIVE SURFACES THAT COULD BE READ AND NEVER STARTED** (&sect;61's
trap, five more times): no first "Who we are" line (unit AND group), no SWOT
add, an empty Plan page that was a dead end pointing at Import, a VIRGIN
pillars function whose first row was accepted on screen and written nowhere
(`unitLike()`'s frozen empties — `unitLikeWritable()` now), and a
capability's key objectives readable on the Overview and writable nowhere.
Plus one found half-built: "+ Add a business unit" minted "New unit 1" with
`real:false` — stamping the SMO's own unit as ILLUSTRATIVE — and hardcoded
factor keys; it asks the form now, and the weighting row is minted from the
factor list (&sect;104.7). **The server needed nothing**: every builder edit
is a change the authoriser already classifies. `checks/plan-builder.py` asks
the DATA after pressing every control, and was **proved able to fail twice —
the second proof caught the check itself** (a substring "agreement" that a
lying chip satisfied; it compares the chip's mark now). Flagged, not built:
a pillars function's key objectives still have no authoring surface
anywhere.*

*Earlier: 2026-08-26 &mdash; **v3.46: a tactic that names no quarter, a
closing slide, and the overview's download (&sect;128)**. Three more from using
the plan download on a plan still being filled in. **A tactic with NO quarter
at all is a gap** &mdash; &sect;119.1 was right to leave a single blank quarter
alone (a tactic marked Q2 and Q3 is saying something by leaving Q1 and Q4
empty), and that reasoning never covered a row that answered nothing; the four columns
stay exactly as they are and **all four cells carry a bold red mark** instead.
The first answer merged one `Missing` across them and Islam turned it down
&mdash; *"the template should stay the same"* &mdash; and he is right: the four
columns are the workbook's shape, a table whose cells merge when a row is
incomplete cannot be scanned down a column, and the alarm had been allowed to
reshape the thing it was annotating (&sect;116.4's fault in a table).
**AND THE MARK IS A QUESTION MARK, NOT A TICK (&sect;128.5, reversing the
glyph and nothing else):** *"rather than the red check mark for the missing qs
make it red question marks."* A `&check;` in a Q column MEANS something on its
own &mdash; *this runs in this quarter*, the column's whole point and the
workbook's own shape &mdash; so painting it red asked the colour to REVERSE
the mark, and the row read *"runs everywhere"* to anybody who did not also
read the colour: close to the opposite of *"nobody said when this runs"*.
&sect;128.1 chose its mark for the colour and not for what the mark says.
A `?` says what the colour says, so the colour becomes emphasis rather than
the whole message &mdash; which is what a bold red `Missing` already does,
being a word that means missing before it is red. **Asserted at both ends**:
the gapped rows carry `?` in all four AND never a tick (a red &check; put back
satisfies "four bold red cells" and fails both), and an answered row never
wears a question mark.
**The deck closes on Thank you**, which is `present.js`'s own last slide
(&sect;53.5: two decks of the same plan should have the same manners). **And
the Function overview carries the download too** &mdash; a capability
function's strategy tab is TWO sections and only Projects had a `.paneact` to
hang the button on, so from the other half there was no way to take the plan
away. **IT RENDERED INVISIBLE FIRST, WHICH IS &sect;70 EXACTLY**: `.penbtn` is
built for a card corner (absolute, `opacity:0` until hovered) and a worded bar
is not one, so it sat in the document answering every DOM query and could not
be pressed &mdash; caught only because the check CLICKS. **And two of the first
run's three failures were the check, not the product**: `sorted()` over slide
parts is lexicographic, so `slide10` came before `slide2` and it measured a
pillar it had never touched. A measurement wrong in the direction of "broken"
costs as much as one wrong in the direction of "clean".*

*Earlier: 2026-08-26 &mdash; **v3.44: one line above the table, and a

*Earlier: 2026-08-26 &mdash; **v3.46: is the bot working, and the settings
that sit under the question** (&sect;123&ndash;&sect;127). Islam turned the
assistant on and nothing came back &mdash; *"but I received the message at the
inbox."* **That was the design working**: &sect;112.2 made every failure land on
the chat as it worked before the assistant existed, which is right for the
person asking and left the office unable to tell **no API key, a rejected model,
an unreachable provider and a genuine decline** apart. *A failure mode designed
to be invisible to the user must still be visible to the operator.* So the
diagnostic **walks the chain and reports where it STOPS** (&sect;123) &mdash;
and it **rendered perfectly and did nothing**, its branch written into the
settings menu's `change` listener where a `<button>` never reaches: present,
styled, and `elementFromPoint` returned it, so every assertion short of PRESSING
it passed. &sect;96's family, fifth time.

**THEN THE DIAGNOSTIC CONTRADICTED ITSELF** (&sect;124): *The API key ·
**WORKING*** sat directly above the provider's *400: API key not valid*.
`configured()` is `!!apiKey()` and never claimed more &mdash; **the word claimed
it on the key's behalf**, because a step's state and its word had been one fact.
A step chooses its own word now where the default would overclaim, and that row
reads **PRESENT**. &sect;35 with the sign reversed: that one is absence reported
as *none*, this is presence reported as proof. **And the refusal belonged to the
KEY, not the model** &mdash; Google answers a bad key with **400**, so the
generic branch had been reporting it under whichever step happened to be
running.

**THE HANDOFF WAS INVISIBLE TO THE PERSON WHO ASKED** (&sect;125): it wrote
nothing at all, on sound reasoning &mdash; a sentence would read as an answer
and drop the conversation out of the office's queue with nobody coming &mdash;
and *what was never asked is what that looks like from the other end*, which is
byte-for-byte what somebody sees when the assistant was never asked. One line
now says so, in the PRODUCT's words and never the model's, with the thread still
WAITING. **A handoff is a decision; a failure is not**, so no key, a timeout and
the switch off all go on writing nothing.

**AND THE DEPLOYMENT COULD NOT SAY WHICH KEY IT HAD** (&sect;126): *"rejected"*
and *"that is not the key you made"* are two different errands &mdash; one to
Google's console, one to Vercel, whose deployments only carry the variables that
existed when they were BUILT. The row reports the key's **length and first four
characters**, which settle it and are not a secret. **Recorded and deliberately
not fixed** on the way past: the autosave is debounced 800ms with **no flush
when the page goes away**, so any setting changed and left within 800ms is lost
while the screen shows the new value &mdash; every page in the product, and not
what Islam hit.

**AND THE SETTINGS RUN ONE WAY AT LAST** (&sect;127, settled from a mockup made
of that very panel): the master switch sat **third**, under a setting it
governs, and the two email rows sat five apart. **882px &rarr; 478px**, same
seven controls, keys unmoved, every explanation behind a mark that opens on
hover, focus **or tap**. **A status is not an explanation** &mdash; *"No one is
set"* stays on the page, because behind a hover somebody turns Handover email
on, nobody is chosen, and nothing ever says so. **And one assertion could not
fail when it was written**: it measured the ROW against the panel, and a row is
inside its own panel by definition.

*Earlier, from another session: **v3.44: one line above the table, and a
dialog that fits the window** (&sect;120), **with a bold title and a table
that reaches the fold** (&sect;120.5). Two asks minutes apart, both from
using the register on his own laptop, and both turned out to be **waste rather
than density**. The header: the badge said who you are, which the chrome says on
every page, and the count said how big the register is, which the table under it
is &mdash; &sect;116 had already dropped the second copy of that count for
exactly that reason and kept this one, and *keeping one copy of something nobody
asked for is still keeping it*. The fourth ask was the only one with a
constraint in it: **Passwords was already on the row and was WRAPPING**, and
removing the badge still left it wanting 1107px &mdash; so two labels are terser
and the search flexes 30px narrower, giving one line to **1280px**, from 1512.
**THE CUSTODIAN MARK MOVED RATHER THAN WENT**, because it is the one
outstanding thing on that page that is not a person and so cannot join the
Attention queue; a chip on the row, drawn only when there is one.
**AND THE DIALOG WAS NOT DENSE** &mdash; 482px of content, of which a whole
56px row was EMPTY (nine fields do not divide by two) and the tallest single
block was a paragraph repeating itself on every person opened. Three columns
divide nine exactly: **482 &rarr; 337px, no scroll down to a 640px window, and
narrower too** (860px, not 938) &mdash; narrower and shorter are usually a trade
and were not here, precisely because the height was waste. **THE CHECK PASSED ON
THE BUILD IT WAS WRITTEN TO REJECT**, which is the lesson worth keeping: it
measured `.hright`, and `.phead2` wraps too &mdash; so when the controls stop
fitting beside the title the whole block drops them to a line of their own, and
the inner box honestly reports ONE row while the header is two. Assert the box
somebody can SEE. With that corrected the previous build fails 12 times. **AND THE FOLLOW-UP FOUND A CAP
THAT HAD GONE STALE IN SILENCE** (&sect;120.5): the table's
`calc(100vh - 300px)` was a guess at three things sitting above it, all three of
which &sect;116 and &sect;118 removed &mdash; so it ended **141px above the fold
at every height** while the rail beside it ended 20px short. It takes the rail's
own expression now and FLEXES into what is left, which is what makes it right
when the header takes a second line. **And the two asks interact**: at 700 the
title is 208px against 180, so one line reaches 1300 rather than 1280 &mdash;
and both attempts to buy those pixels back made it worse, because a flex
container **decides to wrap before it shrinks**, and `flex-basis:min-content` on
a **wrapping** container is its widest item rather than the sum, which broke the
row into two lines 150px earlier than the fault it was aimed at.*

*Earlier: 2026-08-26 &mdash; **v3.42: the deck names its gaps, and the
base becomes the office's (&sect;119)**. Five follow-ups from using &sect;117.
**The plan download says `Missing` in bold red** wherever the plan owes
something &mdash; a direction, a target, a compile rule, an owner, a date, an
aspiration, an empty SWOT quadrant &mdash; in the platform's own `--bad`, and
**the slide is drawn even when it is empty**, because a skipped slide is the
strongest way of saying nothing is missing. **The tactics table becomes four
quarter columns** with a mark in the ones in action, the shape the workbook
already has. **The pillar rail opens collapsed**, read the other way round like
&sect;104's two settings so only an explicit press turns it off &mdash; **and
the alarm survives the collapse**, because that small line was carrying two
different kinds of thing and &sect;106.2's count of rows to check had been put
there deliberately (found by a check going red, not by reading). **The
knowledge base becomes the office's, REVERSING &sect;30 and &sect;37** &mdash;
gated `when: inOffice()` like `c_send`, never a matrix cell &mdash; with the
two places the product CLAIMED it was everyone's corrected in the same edit.
**And it leaves the tour's replay button unreachable**: the stories fit the
custodian and the owner, who can no longer open the page, while the office, who
can, fits none. Recorded and NOT asserted, because a check that froze it would
freeze the mistake; the first-run tour is untouched. **One item could not be
reproduced** (&sect;119.5: a capability's Projects pane draws the download for
the office and the head on live production) and is asked rather than fixed.*

*Earlier: 2026-08-26 &mdash; **v3.41: the CF tab, the add row, and a
null that outlived its session (&sect;118)**. From production, within hours of
&sect;113: *"the CF tab is not showing anything while it was showing it a
minute ago."* The tab was fine; **the PAGE could no longer be drawn**, and a
throw mid-`paint()` keeps the previous page on screen with the only witness
in the hidden console &mdash; so a data fault reads as a dead click. The
chain: the plan tables' **"+ Add" row is a `<tr>` inside the same sortable
tbody**, defended by its own comment as safe because it cannot be *dragged*
&mdash; and it was still **counted**, so every reorder commit carried
`+undefined = NaN`, `applyOrder` pushed `arr[NaN]`, and one phantom entry
joined the list per drag. On a unit that fails the save loudly (row-by-row
tables); **on a pillars function the plan is ONE JSON blob, `undefined`
becomes `null`, the save succeeds, and every later hydration hands the
poison back** &mdash; "a minute ago" is exactly the save-and-rehydrate cycle.
**THE PERSON MADE NO MISTAKE AND THAT IS A FINDING**: every hostile import is
refused before Apply with the reason named, so nothing he could type or
upload produces this &mdash; a control that silently does nothing is the
product's own fault by its own rules. Three fixes, one class each:
`makeSortable` counts rows carrying `data-oi` only; `applyOrder` refuses any
commit that is not a permutation (untouched, never half-applied); and
`fnPruneNulls()` heals already-saved poison at the hydration door &mdash;
remove-only, &sect;50.6 intact. **And the tour is never offered to the
office** (Islam: *"yes stop it to the SMO"*): the bootstrap SMO heads the SMO
function, so `storyFor()`'s `fnhead` rung matched and the full-viewport dock
ate every click while its welcome card waited &mdash; gated through
`SMPRules.isOfficeRole()`, the one definition of the office.
`checks/reorder-integrity.py` presses both reorder paths, the rail that must
KEEP working, the refusals, the healed tenant over HTTP (file:// never
hydrates, &sect;94.11) and both tour ends &mdash; and fails **16 ways**
against the previous build, ending in the production error verbatim
(&sect;94.5). Recorded, not fixed (&sect;118.7): a render that dies still
says nothing on the page (&sect;32 one level deeper); below ~1100px a wrapped
destination row paints under the page-tab row and its second line eats
clicks; and no-jump.py's "sorting a column" trial fails on main's own build.*

*Earlier: 2026-08-26 &mdash; **v3.40: the Strategy | Reporting split, and
the plan as slides (&sect;117, spec 019)**. Islam: *"the strategy should be
locked from the non SMO but the reporting should be editable by who we grant
the access so they can submit — we need this split in the roles and access
table"*, and a plan download in slides for the custodian and the BU owner.
Settled from a mockup of the REAL platform and confirmed whole. The decision
that shapes it: I recommended capping the Strategy half at view for non-office
roles and **Islam chose that the SMO can OPEN it** &mdash; so &sect;94's lock
is the shipped default now, not a floor, and opening a cell is a deliberate,
logged act. **THE NEW KEY IS THE STRATEGY HALF**, which is the whole
back-compat argument: a stored grant on the old key governed what a person
could actually DO (reporting, because &sect;94 refused authoring by rule), so
the old key keeps meaning Reporting and nobody's rights move on upgrade; no
migration. **&sect;101 NEEDED A DECISION TO SURVIVE**: the plan page's grant
moved to a half a holder reads at view, so `mayArrange()` now rides the
holder's WORKING grant &mdash; the same stored value it tested before the
split &mdash; or the arrows would have gone back silently. **THE .PPTX IS THE
XLSX'S SIBLING**: a zip of XML through the same `zipStore()`, offline, no
dependency; plan content only with the SWOT, and the reported figures are
asserted as ABSENCES, because a builder that quietly copied an actuals column
would pass every presence assertion (&sect;94.2 from the negative side).
**AND THE FALSE ALARM WAS THE MEASURING TOOL**: LibreOffice refused the file
&mdash; and refused a vanilla python-pptx file identically, because this image
ships no Impress component at all (&sect;68.10's class). With Impress
installed it renders cleanly. `checks/strategy-split.py` was proved able to
fail three ways before its green was believed; `test-authorize.js` &sect;15
fails on the pre-&sect;117 rules by construction.*

*Earlier: 2026-08-26 &mdash; **v3.39: the register stops being a form**
(&sect;116). Six decisions from Islam after two rounds of mockups, and **one
thing follows from them that nobody asked for, which is why they hang
together: with editing, adding and the queue all in a dialog, the table no
longer edits anything.** Every collision this register has had &mdash;
&sect;110.1's *+ role* under the frozen Cancel, &sect;110.8's fields painting
over their neighbours, the Add row's three boxes under the wrong headings
&mdash; was a control being clicked inside a 158px cell, and not one of them
survives the move. **THE COUNT AND THE QUEUE ARE THE SAME LIST**: six alarm
chips used to sit across the header naming numbers and pointing at rows to find
by eye, which is exactly *"I don't know which lines I should go and check"* &mdash;
one button now, and pressing it opens the first of them, says why above the
fields, and walks to the next in the same place. **THREE THINGS BESIDE A VALUE
WERE ALL ON A SECOND LINE** &mdash; the declaration note, the duplicate mark and
the Official BU disagreement &mdash; each putting its row at 51px against its
neighbours' 39px: &sect;88's own wrapping fault three times over, because `.val`
and `&lt;b&gt;` are `display:block` and a mark placed BESIDE one starts a new
line. **AND THE EMAIL FINALLY HOLDS AN EMAIL** (133px shown of 235px needed, on
33 of 33 rows): it could not be given the room while the table still edited,
because widening it alone pushed the controls further under the frozen columns.
Two faults were found by rewriting the checks rather than by reading: the
identity ladder was being called with an object instead of two arguments, so
&sect;87's stop never fired and a second row for somebody already here went
straight in; and the dialog had no *Add anyway*, which &sect;87.3 requires. The
new check was proved able to fail before its green run was believed &mdash;
**17 failures** against the previous build. **AND THE MERGE FOUND TWO MORE THAN
THE BUILD COULD** (&sect;116.9): `attentionOf()` spelt half its declaration
sentence with `whereLabel`, a **local `var` inside `renderPeople()` in another
file** &mdash; green everywhere, because the crash needs a declaration AND a
register placement that disagree, which is invisible over `file://` and
short-circuits for anybody the register has not placed, and that was every
person the queue's own check had made. Both halves say `roleWhereLabel` now: a
sentence that compares two places must spell them the same way or a match reads
as a difference. **And the count and the queue had drifted the other way** &mdash;
the Overview counts people this viewer may issue a password TO (&sect;89) and
the queue counted everybody, so a Super user with no password put a row in the
list that whoever works through it has no control to clear.*

*Earlier (recorded at the &sect;114.4 merge, the block the v3.38 merge should
have carried): 2026-08-26 &mdash; **v3.38: the pen's last read-only fields,
a repeating project, and the remove button's seat** (&sect;114, &sect;115,
&sect;114.4). **THE THREE FIELDS WERE READ-ONLY ON PURPOSE, AND THE PURPOSE
EXPIRED**: &sect;31 closed a measure's direction and compile rule and a
tactic's quarters because *"they change what a figure MEANS"* &mdash; the
right worry while the pen could fall to the person being measured &mdash; and
&sect;94 closed the pen to the office, so what was left was the office unable
to correct exactly the fields that most need correcting after an upload.
&sect;94.15's shape: a rule whose stated reason has expired does not get to
stand on habit. The vocabulary is the Temple's own `selectOr` lists, a stored
value outside the list is PREPENDED rather than displayed wrong (&sect;96.2
from the display side), and the satisfying half is that **&sect;42 classified
a quarter change as PLAN on the server four versions before the screen could
make one**. **A PROJECT CAN REPEAT** (&sect;115): the CX mystery shopping runs
H1 and again H2, and Islam refused the duplicate rows &mdash; one project,
marked *Repeats: Each cycle* in its front matter, whose figures are re-asked
and whose dates SHIFT by the new cycle's span when a cycle opens. **The
machinery mostly existed and pointed the other way**: `clearAllNotes` was
already wiping EVERY project's figures on each new cycle &mdash; a delivered
project erased the day H2 opens, unseen because the live tenant is still in
cycle 1 &mdash; so &sect;115 made the clear a decision per project: marked
ones re-ask and shift, unmarked ones KEEP their figures. `shiftWhen()` is
`monthsOf`'s mirror &mdash; one reader, one shifter, and an unreadable date is
left exactly as it arrived &mdash; and `figuresSnapshot` was archiving a
field deleted by migration 024 (`actual`) while missing the milestone `pct`
that replaced it: **a snapshot of stale fields is an archive of nothing, and
nothing complains**. The check turns the cycle through the REAL close and
open controls, dialogs and all, and failed three ways on the pre-&sect;115
build before its green was believed (&sect;94.5). **AND THE &times; STOPPED
TAKING A FULL LINE** (&sect;114.4): `.fld` is `width:100%`, so the remove
button wrapped and every editable row spent 20px on a 14px glyph. Two
placements drawn in the real platform; Islam picked **beside the field**, and
inside-the-field lost on SEMANTICS, not pixels &mdash; an &times; inside an
input is the clear-the-text idiom, and this one removes the ROW. Keyed on the
pair (`td:has(> .fld + .xbtn)`), so every table using the pattern is seated
and nothing else is touched; the check presses the point
(`elementFromPoint` at the button's centre, &sect;93.4).*

*Earlier: 2026-08-26 &mdash; **v3.37: the assistant (&sect;111,
&sect;112), and a chat that vanished (&sect;113)**. The last one came from
production and is the one worth reading: *"the chat was a user, he sent to me
and I replied and the chat disappeared from all places."* **NOTHING WAS
DELETED**, and establishing that first is most of the work &mdash; the only
DELETE in the whole chat API is the Super user's deliberate drop. What happened
is **two correct decisions meeting**: replying marks a conversation ANSWERED
(&sect;71's rule, that the status you must remember to set is the one nobody
sets) and the inbox opens on WAITING, which is the work queue and by definition
excludes answered ones. Neither is wrong alone. **Together they mean the act of
replying removes the row from the list you are looking at**, while its thread
sits open beside it &mdash; and it stays gone, because the page always opens on
Waiting and nothing on the screen mentions the All tab. *What was never asked is
what the two do to each other.* **THE FILTER IS NOT CHANGED**: the conversation
you are IN is exempt and only that one, because Waiting has to keep meaning
Waiting at thirty conversations. **AND AN EMPTY STATE DESCRIBES THIS FILTER,
NEVER THE WHOLE PRODUCT** &mdash; *"Nobody is waiting"* was true and was a dead
end, and the Flagged tab was flatly false, saying *"No conversations yet"* with
conversations present. **THE FIX MEASURED AS NOT WORKING FIRST**, and that is
its own lesson: `build.py` writes into `src/` and the dev-server serves the
shipped versioned file, so the reproduction re-ran against the OLD BYTES and
showed the identical failure. A fix tested against the wrong bytes looks exactly
like a fix that does not work, and the next move would have been to hunt a
second cause that was not there.

*Earlier: 2026-08-26 &mdash; **v3.34: giving somebody a role**
(&sect;110). Islam: *"in the people registry I'm trying to set business unit
owners as roles and it keeps failing with no error message."* **THE CONTROL WAS
PRESENT, ENABLED, CORRECTLY SIZED AND UNREACHABLE.** &sect;69.1 put the picker's
second half in the Unit column at his own request; &sect;88 then made every
Setup cell one line, so the cell laid its two controls SIDE BY SIDE &mdash; the
second started 150px into a 158px cell, ran 133px past its own edge, and landed
under the Email field, which took every click. All that survived on screen was
the letter **C** of *Choose where&hellip;*. Every check in the suite was green
on it for as long as it existed, because all of them ask whether a control is in
the document: `elementFromPoint` at its own centre returned the Email input, and
a real click was refused outright. &sect;93.4, third time. **AND IT ONLY BIT THE
ROLES WITH A REAL CHOICE** &mdash; &sect;92 grants a one-destination role on the
pick, so the SMO worked and a unit owner never could, which is exactly the
difference between his two reports. **THEN THE BETTER QUESTION**: *"make it Unit
and it's already in a cell what am I missing here?"* Nothing, and it was worse
than redundant &mdash; the Unit cell's own dropdown offers every place a role
can be held, item for item the list the second one drew from, and
`grantPersonRole()` WRITES THAT SAME FIELD BACK on every grant. **The second
dropdown asked a question the first had already answered and then forced its own
answer onto it.** So it is not renamed, it is removed, and &sect;46.4's "two
different facts" turns out to have been true of the concepts and never of the
code. **A PICK THAT CANNOT LAND NOW SAYS SO** &mdash; the one thing the old pair
could not do, since it committed on the second answer and made *not yet* and
*never* look identical. **AND EITHER HALF FINISHES IT**, which a check found: a
refused pick leaves that role SHOWING, so picking it again fires no `change` at
all, and setting the Unit had to be the other way in. Three more, each its own
silence: a **retired** row was offered the picker and the grant was WRITTEN
while the row read *No role*, leaving a unit pointed at somebody who cannot sign
in; **Cancel** restored the person and left the grant standing, and restoring by
revoking was not enough either, because granting an owner overwrites whoever
held it; and **opening a row threw it to the top of the register** &mdash; the
cursor, not the repaint, hauling row 20 from y=638 to y=105, with `no-jump.py`
green throughout because it opens a row and then measures repaints. **AND THE
BOXES OVERFLOWED EACH OTHER** (his last note): `max-width:100%` on a field in an
auto-layout table does nothing at all, a px cap does nothing either
(&sect;93.10 wrote that down once already), and `width:100%` with `min-width:0`
does &mdash; every content column now holds its closed width, where the table
used to grow 188px the moment a pen was pressed. The new check **presses** every
control and asks BOTH ENDS of each, and was proved able to fail before its green
run was believed: **17 failures** against the previous build.*
*Earlier: 2026-08-26 &mdash; **v3.33: the Setup makeover, complete &mdash;
the words, the window, the Overview, the search and the pills** (&sect;108, spec 018). Islam asked for the whole settings page
to be rethought &mdash; design, grouping, arrangement, a search bar, the namings
&mdash; and for HR_ERP's admin page to be considered. Settled from a mockup
carrying the audit, two drawn structures and a per-row naming table: he chose
**Option A**, the rail keeping the door with an Overview page opening it.
**THE AUDIT IS IN NUMBERS RATHER THAN ADJECTIVES**: the rail is **984px tall and
pins 128px down**, so it hung **112px** below a 1000px window and **312px**
below an 800px one, and what fell off the bottom was Branding and Communication
&mdash; &sect;90's "a control below the fold is a control that does nothing", by
a road &sect;90 did not walk. **THREE ROWS CAME OUT OF ONE WORD FAMILY** &mdash;
Messages, Send a message, Communication, in three different groups &mdash; which
is the collision HR_ERP hit with *Announcements* beside *Communications* and
settled the same way: **Inbox** is what the office ANSWERS, **Email** is what
the page actually sets (the display name, reply-to, kicker and footer of what
LEAVES), and **Terminology** is the tenant's vocabulary rather than stickers.
**Official BU list is deliberately NOT renamed**: it is the client's own word
(&sect;58), and the confusion with Business units is answered by a description
beside it, not by taking their word away. The group names **answer rather than
ask** &mdash; &sect;46 was right about the grouping and wrong about the words,
because a rail is scanned and a question reads a beat slower than its answer
&mdash; while **the keys do not move**, or every folded group would silently
unfold for everybody who ever touched one (&sect;30.2). **Import and Archived
plans become one page with two sections**, inseparable by construction since
&sect;22 made importing an archiving act, **with each section keeping its own
gate** so &sect;48.2's edit-only Import survives the merge. **AND THE RAIL FITS
THE WINDOW, WHICH &sect;28.3 SAYS IT MUST NOT** (&sect;108.5): that rule was
written against v2.8's oscillation, whose loop ran through the header CONDENSE
&mdash; deleted in v3.3 &mdash; so it is broken at a link rather than argued
away, and `--chrome-h` is now a constant (73px at every height swept).
**&sect;100.5 REFUSED THIS SAME CAP SIX DAYS AGO** and its reason was not the
loop but the affordance: *a list that says "it ends here" when it does not is
worse than a page that scrolls.* That objection is right, so the cap ships with
the sign &mdash; a visible scrollbar track and a **sticky fade that gets out of
its own way**, coming to rest after the last row where it has nothing left to
cover. **AND TWO ATTEMPTS TO BE CLEVER BROKE THE THING IT PROTECTS**: a
`margin-top:-22px` meant to give back the fade's height took it off the
SCROLLABLE height and stranded the last five entries, and removing it did not
fix them &mdash; the real cause was a speculative **`scroll-behavior:smooth`**
in the same edit, which makes `scrollIntoView` asynchronous so the check
measured before the scroll landed. *A nicety nobody asked for broke a real
reachability assertion, and it was not the cause I suspected first.* The check
**asserts the problem, not the numbers**, and was **proved able to fail before
it was trusted** &mdash; 8 failures with the cap removed.
**AND THE OVERVIEW IS BUILT** (&sect;108.10, spec 018): the gear lands on it, and
it answers the one question the office opens Setup to ask &mdash; *is anything
waiting on me?* &mdash; which before it existed took a walk through five pages,
because each outstanding thing lives only on the page that fixes it. **NO ROW
COMPUTES ANYTHING**: each declares a `count` calling the SAME function its
destination page calls, and the check asserts the two AGREE rather than asserting
the number (&sect;53.5, &sect;94.8) &mdash; a summary page is the one place a
disagreement is guaranteed to be seen and impossible to explain. Two sources were
already shared; the other three are **extracted rather than copied**, and
`CHAT.officeQueue()` is a second READER of the `queue` action the inbox already
calls rather than a second endpoint, so the Overview's number is by construction
the Inbox tab's number. **A COUNT HAS THREE ANSWERS, NOT TWO** &mdash; a number,
zero, and *we have not asked* &mdash; so a null draws no row, a zero says nothing
is waiting, and the page never prints `0`: &sect;93's fault one surface out,
because a summary showing five zeroes while it is still thinking has told
somebody they are clear when it does not know. **AND SAYING NO IS THE PAGE'S JOB
TOO** (&sect;45.2 turned round), or an absent list reads as a list that failed to
load. Three old faults arrived in new places: the password and declaration
fetches were **keyed on the register's MARKUP** and are keyed on the page NAME
now (the third time that class of gate has silently stopped matching, in the
safe-looking direction every time); the declarations fetch **never said it
failed**, leaving `{}` &mdash; harmless on the register, a false all-clear on the
Overview; and the demo tenant is entirely clear, so the check **MAKES the state
it measures** or every attention row ships unexercised (&sect;45.2, &sect;94.2).
**AND THE FIRST LIVE RUN'S ONE FAILURE WAS THE CHECK, NOT THE PRODUCT**: it
asserted the password count equalled the stub's own number, and the page said 2
where the stub marked 3 &mdash; because the first people on the seed are the SMO
and a Super user, and &sect;89 excludes the office from issuing. It asserts the
RELATIONSHIP now, **with the raw number asserted to differ**, or it would quietly
pass again the day that exclusion broke. **AND THE SEARCH AND THE PILLS FINISH IT.**
**THE KEYWORDS LIVE ON THE DEF** (&sect;108.13), beside the label, because some
errands do not know their page at all &mdash; *"where do I change the logo"* is
Branding &mdash; and a second table of them would have been the fourth place to
edit the day a page is renamed (&sect;108.3 renamed three in an afternoon). Every
typed word must match in any order, since *"reset password"* and *"password
reset"* are one errand. **TYPING NEVER REPAINTS** (&sect;35), and the query is
held in a variable rather than only in the box, because the Overview's own three
fetches each end in `paint()` about a second after the page opens &mdash;
exactly when somebody is typing; the filter is re-applied after every paint, or
a repaint quietly shows the whole list to somebody who believes they are reading
their results. **AND THE FOLD HAD TO STOP OMITTING ROWS** (&sect;108.14): a
filter cannot reveal a row that was never drawn, and that failure would have
looked exactly like *"there is no such setting"*. **THE PILLS ARE THE OVERVIEW'S
OWN ROWS SUMMED BY DESTINATION** (&sect;108.15) &mdash; nothing new is counted,
so a rail badge cannot disagree with the page it points at; never a zero, never
for somebody who cannot clear it (&sect;69's dot), and on a group heading only
while that group is FOLDED, because an open group's rows already speak. **AND
&sect;51.11 BIT IN MY OWN CHECK**: the row gained a label span and a pill, so
`.ritem`'s `textContent` became `"People register2"` and three assertions broke
&mdash; grep every check when a control changes shape, not the one that failed
first. **AND THE CONTRAST SCARE WAS THE MEASURING SCRIPT** (&sect;68.10): a
throwaway sweep reported eight failures including the pill at 1.64:1, because
its transparency test compared `'rgba(0,0,0,0)'` against `'rgba(0, 0, 0, 0)'`
&mdash; a spelling, not a value &mdash; so everything was measured against
BLACK. Testing the alpha instead: **0 failures**, the pill at 5.32:1 light and
9.34:1 dark. *A correct build reported broken is the same class of fault as a
broken build reported clean, and the first instinct &mdash; to go and change a
colour &mdash; would have damaged a working palette.*

*Earlier: 2026-08-26 &mdash; **v3.32: the onboarding tour** (&sect;107,
spec 017). *"For first time users we need some orientation flow that takes them
through the platform … highlighting some areas while dimming the rest of the
page … in a user story mode."* Settled over **four reviewed revisions of a
working mockup** before a line of `src/` was touched, and that is the part
worth keeping: **three of the five decisions are reversals of something drawn
first**, and not one of them could have been argued in the abstract.
**THE INTERACTIVE TOUR WAS BUILT AND THEN REVERSED** &mdash; the first
alignment said *"let them click, that would be more interactive"*, and demo
mode made it safe to let a first-time user press real controls, because a
dataset that refuses every write is the licence for that. Then: *"skip the
buttons clicking overall."* **A tour that waits for a press is a tour that can
be got wrong, by the one person in the tenant with no idea which button was
meant** &mdash; narrating costs nothing the pressing bought. **SKIP TOUR WENT
AND THE &times; STARTED ASKING** (*Don't show again* / *Skip for now*, with a
way back for a stray press), because two controls for one act is one too many.
**AND THE SPOTLIGHT HAD TO SAY WHERE YOU ARE**: lighting the whole navigation
row names the SET and not the SELECTION, which is the one question a
first-time viewer actually has &mdash; and lighting one button while ALSO
lighting a section and its content is what forced the dim to become an **SVG
mask**, since a box-shadow cutout can only ever have one hole. Built to hold
**no copy of anything**: it never calls `paint()`, holds selectors rather than
nodes, navigates by pressing the platform's own controls, and reads roles
through the platform's own `personRoles()`. **A STEP NAMES A CONCEPT AND A
PLACE SPELLS IT** &mdash; and the first build resolved the step's FIELDS while
leaving its SELECTORS spelling a unit's keys, so a step disagreed with itself
and the first function to walk the owner story lit nothing on four of eight
steps; `checks/tour.py` caught it within a minute of that story existing,
which is &sect;53.5's argument for walking both sides paid back immediately.
**THE CHECK WAS PROVED ABLE TO FAIL BEFORE ITS GREEN RUN WAS BELIEVED**
(&sect;94.5) **and the first attempt could not**: the deliberate break set a
step's section to the value it already held, a no-op caught by nothing, which
is exactly the fault &sect;94.5 records in `test-authorize.js`. Two more found
only by measuring: `own_it` holds custodian on the IT unit AND the IT
function, so adding them walked the unit twice while looking like it covered
functions; and the contrast measurement was proved real by wrecking the card's
text colour and watching it report 1.6:1, because a measurement that returns
nothing looks identical whether it is clean or blind. **AND THE WORDS WERE
WRONG WHILE EVERY ASSERTION WAS TRUE** (&sect;107.8): `L("pillar","bu")` is
*"Pillars"*, so the card read *"Strategy &rsaquo; Plan &mdash; the pillarss"*
&mdash; found by printing the nine titles and READING them, which no check
would have done. A tenant's label is never inflected.*

*Earlier: 2026-08-26 &mdash; **v3.30: reordering comes back

(&sect;101), and focus measures get a switch (&sect;102)**. The second one
carries the bug worth reading: the switch was wired, the rule was written, the
writer worked &mdash; and flipping it changed nothing at all. **`worldOf()` does
not pass the group through**; it lifts NAMED KEYS off it, and **`W()` behind it
names the keys it keeps** &mdash; two allow-lists, one behind the other, in the
same function, on the same object. A group setting has to be added in BOTH, and
forgetting either fails **silently and in the safe-looking direction**: the
reader sees `undefined` and answers the default, which for a switch means *on*.
Nothing throws, the page renders, the control does nothing. &sect;44 recorded
this once as a client/server difference and this was neither &mdash; and only
driving the real page found it, because the unit tests build their worlds by
hand and pass either way. The rest is settled shape: off HIDES and never
forgets (&sect;44 for the third time), stored as an ABSENCE so an unasked tenant
and one switched off and on again are byte-identical (&sect;50.6), one gate
inside `isFocus()` because seven surfaces already went through it, and the page
carrying the switch stays reachable while it is off (&sect;61's trap, or the only
way back on is to turn it on first). **The switch is the SMO's while marking
stays the CEO's** &mdash; asserted as a PAIR, because locking something down
proves nothing unless the right thing stayed open.

*Earlier the same day: **&sect;101, reordering comes back** (reversing
&sect;94.3). *"I will give it back &mdash; shall we
align where to visually have it?"* **EVERY WORD &sect;94.3 WROTE DOWN STAYED
TRUE**, which is what makes this a reversal rather than a correction: that
section closed reordering to the office because the order of a plan is as much
a part of what was agreed as its words, and it found on the way that
`lib/authorize.js` compares row ids **in order**, so every drag a unit head had
ever made was already being refused on save &mdash; the rows moved and the save
came back no. What changes is not that reordering stopped being a plan decision.
It is that **the plan's ORDER is the unit's to decide while the plan's WORDS
remain the office's**, and that is why `mayArrange()` is its own rule and not a
hole in `mayAuthorPage()`: the cheap fix would have handed them the words too,
which is the exact fault &sect;94 existed to fix. **THE AUTHORISER HAD TO LEARN
A NEW SHAPE** &mdash; `reordered()` answers by SET, never by sorting, because one
list holding an id twice would sort-compare equal to another holding it twice in
the other order, and an all-null pair is never a reorder (&sect;96.4's ID-less
group objectives). **Islam picked the up-down arrows over the grip mark** that
would have matched the handles it turns on; recorded and not re-argued, with the
cost stated: a generic glyph puts the whole meaning into the `title` and the
`aria-label`. Settled from a mockup made of the REAL platform &mdash; the built
file driven to a unit's Plan pane with each candidate injected into the live
pane, both sides the same build (&sect;41.9) &mdash; and two faults on the way
worth the comments they now carry: **Plan is a SECTION, not a tab**, so clicking
a tab called "plan" captured Performance under Plan's name (&sect;50.6 again),
and **`.paneact` does not exist for the people this is for**, so the first run
produced six identical pictures of an empty corner &mdash; itself the finding,
since giving them the control means rendering the slot and not merely filling
it. **AND BOTH FAILURE MODES WERE PROVED TO FAIL BEFORE BEING TRUSTED**: with
`mayArrange` forced false, 6 failures; with `reordered()` forced false &mdash;
the &sect;94.3 state exactly &mdash; 5.*

*Earlier: 2026-08-25 &mdash; **v3.29: the corner minimises, and the inbox
follows the window** (&sect;100.4, &sect;100.5). Two more messages from having
the thing open, and the first was three asks in one sentence that turned out to
be one fault seen from three sides. *"If I click outside the box minimise it
please, and when I open the chat box make it at the bottom and hide the chat
icon as if it comes above it."* **THE BUBBLE WAS STILL DRAWN UNDER THE OPEN
PANEL** &mdash; the dock is a column, so with both in it the panel sat 60px plus
a gap off the bottom of the window, which is exactly what *"make it at the
bottom"* describes; one CSS rule off the class the opener already sets, because
a bubble that opens a panel has nothing to say while the panel is open. Clicking
outside minimises on `pointerdown` rather than `click`, and **two things are not
"outside"** &mdash; the dock, and an open modal, or looking at the screenshot you
just attached would put the panel away behind it. **AND ESCAPE HAD NEVER WORKED
FROM ANYWHERE BUT THE COMPOSER**: present, plausible and silent, which is the
shape this file keeps recording. Then: *"the chat box requires a scroll up, this
shouldn't happen."* The office's inbox stood at a **fixed 593px** however tall
the window was &mdash; 506px of page scroll at 700px, with the reply box and Send
off the fold, so answering somebody began with hunting for the control. It
follows the window now, and **this is deliberately not &sect;28.3's feedback
loop**: nothing ABOVE the box moves when the box resizes, which is what made
v2.8's max-height oscillate for ever and does not apply here. **THE ASSERTION IS
THAT THE BOX MOVED, NOT THAT IT FITTED** &mdash; every other assertion in the new
section 8 passes on a tall window with the fixed height back in place, which is
precisely how this shipped, so it was proved by putting `height:593px` back and
watching the check fail. **And the stub had to grow a conversation**: the
office's page had never once been measured with a thread open, so the inbox drew
*"Pick somebody on the left"* and there was nothing to look at &mdash;
&sect;100.3's lesson a second time in the same file, and modelling the server
includes carrying enough data for the thing under test to be under any strain at
all.*

*Earlier: 2026-08-25 &mdash; **v3.28: the corner, corrected by using it**
(&sect;100). Three notes within minutes of the merge going live, each of them
from having the thing open rather than from reading about it. **&sect;97.4 IS
REVERSED**: *"the line in front of the chat shouldn't be there"*, and asked
whether it should be hidden from the sender or gone entirely, Islam chose gone.
The argument for capturing the page was &sect;71's and it is still a good
argument in the abstract &mdash; the screen knows where somebody is, so asking
them is asking them to do the computer's job &mdash; and it did not survive
being LOOKED AT: on a real message the line is longer than the message and
repeats under every single thing you send. It is not merely hidden: the two
helpers, the icon, `BUILD_ID` and the build-time stamp all go, and **migration
023 drops the four columns** (&sect;53.4 &mdash; a column the platform no longer
reads is worse than no column). **And the sentence under the composer went with
it**, because *"the page you are on is sent with your message"* stopped being
true the moment that stopped happening, and a sentence that is merely stale is
worse than no sentence. **THE &times; WAS A SMALL LIE**: there is one
conversation per person and it is permanent, so nothing is ever closed &mdash;
it is a minus now, labelled Minimise. **AND A REPLY HAS TO ANNOUNCE ITSELF**:
the count existed but arrived silently and up to three minutes late, because
&sect;98.1 took the shut panel to 180s. A **third cadence** rather than a
slower saving &mdash; 15s while the conversation is waiting on the office, back
to 180s the moment it is answered &mdash; plus a ring that expands out of the
bubble twice, and nothing at all under `prefers-reduced-motion`. **The bug in
that could not have been found by reading**: the arriving count was compared
against `state.unread` three lines AFTER being assigned to it, so the two were
always equal and a reply could never announce itself. It read correctly and
could not fire. **And the stub was lying about the server** &mdash; it answered
`thread: null` where the real endpoint returns `{waiting:true}`, so the client
behaved correctly and the check called it broken. A stub has to MODEL the
server, not merely answer it.*

*Earlier: 2026-08-25 &mdash; **&sect;99: one table, two halves.** It opened
as a question about a column that was there &mdash; *"for the project plans the
milestones has no due date? or am I confused?"* &mdash; and he was not confused
about the screen: a milestone has carried `finish` since the capability model
existed, on all three panes, the deck and both workbooks. It says **Finish**,
and **55 of the 60 milestones in the demo read a bare quarter** (`Q3`), because
only the one real project is timelined by date. *A column headed Finish holding
the word Q3 does not look like a due date*, which is the whole of why he asked.
Then the real ask: **the mixing of deliverables and outcomes.** &sect;53.4's
argument survives intact &mdash; they are two kinds of evidence, they are read
together, and the SCORE still keeps them apart half per side &mdash; but its
single **header row** could not: `Measured as` named the delivery kind on one
row and the **direction** on the next, and `Target` and `Measured at` stood
empty for every deliverable. **A dead cell is the table asking a row a question
its kind cannot answer**, and the em-dash is the shape a table makes when it has
been asked to hold two things at once. Still ONE table, split by a band on
`--panel` so a half **opens the way a table opens**; the `#` and the NAME hold
their position across the split, and the column a score is read from is LAST on
both halves. **THE COLSPAN IS THE WHOLE MECHANISM** &mdash; it is what lets a
half with fewer facts end where the other one does. Three things go with the
split, and each of them reverses a sentence &sect;53.4 wrote down: the **Type**
column (the band says it), the **shared numbering** (it ran across the table
BECAUSE it was one list &mdash; with two lists, two rows called 1 is the truth),
and the **paired Add row**. **`Finish` becomes `Due date`** on every surface,
with the stored field keeping its spelling and the workbook reading EITHER
(&sect;58) &mdash; while the *"Measured at Q4 2026"* pills are deliberately left
alone, because a column heading is a noun and a pill is a sentence. And the
check **asserts the problem, not the layout** (&sect;94.8): no dead cell, each
half's colspans adding up to the same grid, both halves ending at the same
pixel &mdash; proved able to fail before it was trusted, and taught two things
that would have made it lie (**a cell holding a CONTROL is answered even when it
reads empty**, and **Reporting is a MODE**, so pressing for a section row landed
on Performance twice). **Found and NOT fixed (&sect;99.6):** `projPlanBody`
defines `sortAttr()` and applies it to neither table, so a project's drag grips
are bound to nothing &mdash; and `qa.py` reports "14 handles" because it counts
them.* **AND THE EMPTY HALF WENT, AN HOUR AFTER IT SHIPPED** (&sect;99.7):
asked *"if the project has no outcomes should the table appear?"* I said yes,
on &sect;45.2's rule that a feature rendering nothing looks like one that was
never built, and gave the strongest reason I had &mdash; `projPerf()` returns
the other side WHOLE when a side is empty, so a project with no outcomes is
scored on its deliverables alone (63% &rarr; 75% with FIN01's removed). Islam:
*"not to keep tables in place with no need."* **&sect;45.2 is about a FEATURE
and this is about a PROJECT** &mdash; a project with no outcomes is not a broken
screen, it is a plan that committed to no measurable change &mdash; **and the
fact I was defending was already on the page**, because the Performance card
prints `Outcomes &mdash;` without any help from the table. *The argument for
keeping something is worth checking against what the page already says.*
**AUTHORING IS THE EXCEPTION AND IT IS NOT A DETAIL**: the add row is the only
way to write the first row of either half, so a half hidden for being empty
behind the pen is a half nobody can ever fill &mdash; &sect;61 exactly. And
**0 of 19 demo projects have an empty half**, so the check MAKES the state
rather than waiting for a client to find it.*

*Earlier: 2026-08-25 &mdash; **v3.27: the chat gets a switch, and a poll
gets cheaper** (&sect;98). Two asks that turned out to be one subject. *"How much
can vercel handle as messages per day?"* &mdash; and the answer is that
**messages are not the unit**: a message costs one request and an open tab costs
900 an hour. Measured against the real endpoint rather than estimated, one poll
was **14 database round trips**, and **ten of them were `ensureReady()`
re-running the whole schema and both migration phases on every single
request** &mdash; invisible while a request meant a page load, and not invisible
once a corner asks every four seconds. Memoised per process (**14 &rarr; 5**),
the client now **stops polling entirely while the tab is hidden**, and the idle
beat goes from 60s to 180s. **THE TWO REAL LIMITS ARE A LICENCE AND A DATABASE,
NOT A QUOTA**: Vercel's Hobby plan is not licensed for commercial use, and
Neon's free compute never autosuspends while anything is polling &mdash; one
signed-in tab keeps it awake whether or not a word is written, which is what
makes the hidden-tab stop a correctness change and not only a saving. Then the
switch: *"I will need in the setup page to enable or disable the chat with some
settings maybe."* Five controls in a **dropdown on the Messages page header**
(&sect;90's shape; five switches behind their own rail entry is a door behind a
door), and **the cost is stated in the row where the choice is made** &mdash;
which is the whole reason the cadence is a setting rather than a number in the
source. **THE SERVER REFUSES, WHICH IS THE HALF THAT IS NOT ON SCREEN**: with
the chat off the corner is not drawn, so nothing in the product can reach `say`
or `reply`, and that is exactly why both are guarded (&sect;42, &sect;44 &mdash;
a switch that only hides a control is decoration). **Off never deletes a
conversation and the page stays reachable**, or the only way to turn it back on
would be to turn it on first (&sect;61's trap). Three things were found by
running it rather than by reading: the office pressed Off and **watched nothing
happen for three minutes**, because their own corner was on the new idle beat;
the panel's second line **hid the promise at the one moment somebody wants
it**, while they are waiting; and the new check **passed for the wrong reason**
&mdash; it pressed the bubble to open a panel that was already open, closing it,
and then read stale values while the cadence assertion passed with zero polls.
Ask, then act.*

*Earlier: 2026-08-25 &mdash; **v3.26: talking to the Strategy Office**
(&sect;97, spec 015). A bubble in the bottom-right corner, one running
conversation with the office, and a Setup page the office answers from. **AND
HE HAD ASKED FOR IT ONCE ALREADY**: &sect;71 built the endpoint, the tables, the
reply thread, the screenshot handling and the access rules under a commit whose
own message says what happened &mdash; *"Feedback: the server half"* &mdash; and
**the box was never drawn**. Searching the built platform for the word finds
three hits and all three are the phrase *"feedback loop"* in unrelated comments.
So this is not a second feature beside that one; it is the missing half of it,
reshaped from a form into a conversation, and &sect;71's two tables are dropped
because no human could ever reach them. **ONE CONVERSATION PER PERSON, AND THE
QUEUE IS PEOPLE** &mdash; Islam's own sentence, *picks the people and replies to
them*: the moment somebody has to decide whether what they are typing is a new
item or the same one, it has stopped being a chat, so they never decide it and
the office sorts on its own side by flagging. The cost is recorded rather than
glossed: &sect;71's per-item statuses go, and flagging is deliberately weaker.
**WHO MAY READ IT IS A RULE, NOT A MATRIX CELL** &mdash; reading what everybody
wrote in confidence is not a tick somebody could set on a bad afternoon
(&sect;37 settled three cells that way, &sect;89 three more). **NOTHING IN THE
CLIENT FILE EVER CALLS `paint()`**, which is the rule the whole thing is built
around: it would throw away the half-typed message four seconds after somebody
started typing. Three old lessons arrived in new places &mdash; the outcome
sentence had to survive the refresh that REPORTS it (&sect;63 from the other
side), a flag had to refresh the queue as well as the thread, and `post()` had
to refuse when there is no server, **found by `qa.py`** walking every Setup page
over `file://` where the whole feature does not exist. **EMAIL ONLY WHEN THEY
ARE AWAY, AND THE EDGE IS STATED**: presence is the person's own polling and
nothing else &mdash; the first build stamped it on a SEND as well, and its own
comment said it should not &mdash; and with no scheduler on Vercel the decision
is made at the moment of replying, so somebody who shut their laptop thirty
seconds ago gets no email. That is why the office is shown which way it will go
*before* pressing Send, rather than the rule being silent. **THE CAPTURED PAGE
SPEAKS THE NAVIGATION'S LANGUAGE** &mdash; read off `[aria-selected]`, never off
`currentSub`, which is a key: the first build put "the group &rsaquo;
performance" on a message where the screen said "Group &rsaquo; Performance",
and asking only for BUTTONS left every group page with no destination at all,
because the group sits in a dropdown (&sect;94.6's trap, nine sections later).
And two of the first test run's failures were **the check being wrong rather
than the product** &mdash; a rendered uppercase compared against mixed case, and
an "she is away" that the test's own poll had made false &mdash; both fixed in
the check rather than loosened.*

*Earlier: 2026-08-25 &mdash; **v3.25: the objectives editor was drawn and
connected to nothing** (&sect;96). Islam, on a unit's Foundation with the pen
open: *"I can't remove objectives."* Measured before touching anything: **20
input fields, 0 wired; 4 Remove buttons, 0 wired; the Add button, 0 wired.**
Every control in that table was decoration &mdash; typing a name, changing a
direction, correcting a target, removing a row and adding one all looked
accepted and were discarded on the next repaint. **IT IS THE FAULT THE `FIELDS`
REGISTRY EXISTS TO PREVENT**, and the comment three lines above the broken
function says so in the PAST TENSE: that fix went to `fieldOr` and `inputOr` and
`koEdit` was left behind, because it builds its own `<input>` tags rather than
calling them. **A helper that exists is not a helper that was used**, and
nothing catches the difference &mdash; a bound field and an unbound one differ
by one absent attribute, the page renders, nothing throws, and every keystroke
is accepted before being thrown away. It survived because `renderTempleEdit` has
the SAME table, fully wired, editing the SAME `GROUP.keyObjectives`: one of the
two surfaces onto that list worked, so the list never looked broken, and the
unit's Foundation &mdash; which has no second surface &mdash; had nothing at
all. `selectOr` joins the family, because **a `<select>` is not an `<input>`**
and building its own is exactly how `koEdit` came to build unbound ones.
**MINTED FROM THE MAXIMUM, NEVER FROM THE COUNT** (&sect;96.2): remove the
middle of KO1&middot;KO2&middot;KO3 and Add, and the count says 3 while KO3 is
still on screen &mdash; the authoriser compares plans BY ID (&sect;59) and a
snapshot is keyed by id and never by position (&sect;48), so a collision is not
cosmetic; the Temple's own handler carried it too and is corrected through the
same function. **AND THE GROUP'S SIX OBJECTIVES CARRY NO IDS AT ALL**
(&sect;96.4) &mdash; `null` in the seed and in the database, because only rows
ADDED have ever been given one; survivable until this editor mints them, because
a list where one row is identified and six are not is worse than either state.
Filled in, never rewritten, and **from Add and Remove rather than from paint**,
or a reader that writes what it reads puts a phantom change into every save
(&sect;42). **AND `9.6999999999999993%` CAME FROM EXCEL VERBATIM** (&sect;96.3):
not the platform's arithmetic &mdash; JavaScript prints that number as `9.7`
&mdash; but the RAW TEXT of the cell, which Excel writes at full precision
whenever a value came from a calculation. Numeric cells go through the shortest
string that reads back as the same double, and the two guards are the fix: never
into exponential notation, and **anything that does not round-trip is left
exactly as it arrived**. **THE CHECK ASKS THE ONLY QUESTION THAT SEPARATES
THEM** &mdash; every existing check asks whether the pen is there and whether
fields appear, and all of that was TRUE the whole time; `foundation-objectives.py`
asks whether pressing the control CHANGES THE DATA, on both callers of the one
table, because they had drifted apart in silence and only asking both found it.
**AND THE TABLE GETS THE WINDOW WHILE IT IS BEING WRITTEN** (&sect;96.6):
*"when I edit the objectives table the table is very tight and crammed."* The
Foundation is a two-column grid, so the aspiration card gets 45% of the page and
was holding a six-column table with a text field in every cell &mdash; **696px,
the name clipped at twelve characters and the direction dropdown too narrow to
show its own value**; as a band beneath both columns it has **1493px**.
**READING MODE IS UNTOUCHED**, because the objectives belong inside the
aspiration when you are READING it and it is only authoring that needs the room
&mdash; `koBlock()` is the one renderer and the card and the band both call it.
**DELIBERATELY NOT THE WHOLE PAGE STACKING**, which was the other half of the
question: the two prose columns read BETTER side by side, and stacking them
would push the table further down to solve a problem it does not have. Settled
from a mockup made of the REAL platform (both sides the same build, the proposal
produced by moving the block in the browser), with the cost &mdash; a short
aspiration card and a gap beside "Who we are" while editing &mdash; in its own
panel before it was agreed. The check asserts the **relationship** and never the
number: out of the grid, in a band, as wide as the page, and back inside the
card the moment the pen closes.*

*Earlier: 2026-08-25 &mdash; **v3.25: the composer stays one screen**
(&sect;95, spec 014). Six changes to Send a message, and the argument under five
of them is the same one: **the page had exactly one part whose size was not
fixed, and everything else was below it.** Every recipient rendered as a chip,
so a group-wide send put nine hundred pixels of names between the message and
the button &mdash; add a unit to the business and Send moves further away. It is
a **bounded summary** now, and **THE SKIPPED COUNT IS NEVER BEHIND THE
DISCLOSURE**: it is the fault that started this whole thread (&sect;87), so it
reads on the line whether or not anybody opens the names, and the names put the
skipped FIRST, because "3 skipped" tells nobody which three. **THE COUNT IS ON
THE CONTROL THAT ACTS** &mdash; *Send to 76 people*, on a bar pinned to the foot
of the window. **SEND ME A COPY** is the missing safeguard and the cheapest one:
the same message, the same builder, one copy, **to the person SIGNED IN and
never the person being viewed as** &mdash; `viewer()` is the simulation and a
test that followed it would put a real message in a real colleague's inbox.
`confirm()` is gone: a browser dialog can be silenced permanently on some other
site, and this is the most irreversible act in the product &mdash; the
platform's own modal names the subject, the count, **who will not receive it**,
and that there is no undo. Drafts and Sent leave the scroll for header
dropdowns carrying their counts (&sect;90's move, on the page that needed it
next). **AND THE PARTIAL REPAINT OWNED MORE THAN IT KNEW** (&sect;95.7):
`paintAudience()` deliberately does not call `paint()` &mdash; the composer
beside it may have a half-typed sentence in it &mdash; which was right until the
count went onto the Send button, the one control it then had to update and did
not; the same replacement killed *Show the names*, bound in `wire()` inside the
element being replaced, **at the only moment there is ever anything to
disclose**. And the header's count was found by `.chip:last-of-type`, which
counts TAGS &mdash; two dropdown spans went in after the chips and it silently
matched nothing, so the header read "nobody chosen" over a resolved seventy-six.
**THE CHECK COULD NOT LIVE IN `qa.py`**: every other screen check opens the
built file over `file://`, where this whole page is the empty state &mdash; and
so is what the CONTRAST SWEEP has been calling clean for as long as the page has
existed. `src/checks/send-message.py` serves the built file with a stub, and
measures contrast with the sweep's OWN function read out of its source rather
than copied (&sect;67). Which found &sect;16.17 by accident: Chromium keeps
`:hover` after a click, so a still-lit button measured 4.34:1 &mdash;
`.editbtn:hover`, on every page, since long before this version. **Every
`:hover`, `:focus` and `:disabled` colour in this product is unmeasured**,
because a sweep that walks pages and states never touches a control. Recorded,
not quietly changed.*

*Earlier: 2026-08-25 &mdash; **v3.25: the strategy tab, the door, and one
solid button** (&sect;94). Three asks in one message, two of them half built
already, and finding out which half is most of the section. **"I TESTED AND THE
CUSTODIAN FOUND THE PENS"** &mdash; &sect;31 closed the PLAN and nothing else,
so a strategy custodian could not touch the measures and could rewrite the
**aspiration above them**, which is not a smaller grant but a stranger one. The
whole tab is the office's now, named once in `lib/rules.js` as five PAGES and
not as an area, because the area also carries Performance and My reporting and
closing it would take reporting away to withhold authoring. **THE GATE IS ON THE
CONTROL**, so a pen added later is gated the day it is added; and **the fields
ask again**, because the viewer switcher repainted without leaving modes and an
open pen followed the SMO into a custodian's view. **REORDERING IS AUTHORING**
&mdash; and it was already being refused on save, so &sect;63.3's explicit
Arrange button had been handing a BU head something the server would never
accept. Three drifts found, all screen-says-yes / server-says-no and two of them
inside the file that exists to prevent it: `unitPlan` asked for a **Super user**
while the pen asked for the **office**, so an SMO team member was offered the
plan pen everywhere and refused every time. **PEOPLE OPEN WHERE THEY WORK**:
`var current = "group"` was a literal and the correction only runs for an
unreachable destination, so every session started on a group score the viewer
often does not own &mdash; and excluding "group" as a special case put the SMO on
Mobile, because the first entry in the navigation row is a DROPDOWN with no key
of its own. **REPORT GOES SOLID, AND THE LEGEND GETS OUT
OF ITS WAY**: asked out of the band legend into a row of its own, built, looked
at, and asked back &mdash; **the problem was never where the buttons were**, it
was that two 12px controls sat against a 12.5px legend in the same grey, so the
move spent a row of vertical space to solve a CONTRAST problem. The legend drops
to 10.5px instead &mdash; the size every uppercase key in the platform already
wears &mdash; and the row reads in three volumes. The orange is **two tokens**,
because &sect;38.4 cuts both ways &mdash; the bright orange that works as a fill
cannot carry white type, the deep one that works as type cannot carry the page's
ink. And the check changed into a better check: it had asserted a POSITION, which
a reversal makes false; it asserts the **order of loudness** now. And the day's lesson twice over: **a
check that only looks for something PRESENT cannot see a control that should not
be drawn** &mdash; every plan-edit check ran as the SMO &mdash; while
`test-authorize.js`'s most important assertion **set a value to what it already
was**, so &sect;89's gravest rule had never once run and the suite printed 155
passed while saying so. **MERGED WITH &sect;93 FROM ANOTHER BRANCH**, built the
same day: Employee stops being a role (the floor stays, as *Everyone else* on the
matrix &mdash; nobody HOLDS it, so `personRoles()` returns `[]` and the chip that
could never be taken off is gone), the password column stops saying "none" when
it means "we never asked", and the register's Name column splits into Name and
Full Name. **Numbered &sect;94 because &sect;93 reached `main` first** &mdash;
and the two sections found the SAME no-op assertion in `test-authorize.js`
independently, which is the part worth keeping: a check that could not fail was
invisible to two people reading the same file for two unrelated reasons.
**AND THE BOOT GLITCH** (&sect;94.10): the platform painted from the BAKED file
and repainted when the database answered, so it opened in the wrong colours
and, on a client's deployment, in **Raya Trade's units and figures** &mdash; two
things arriving late, and only the first was reported. A grey **skeleton**
holds the screen instead, wearing only tokens no branding can touch, because a
skeleton keeping the navy bar would still swap it. Islam chose it over
remembering the colours in the browser, and he was right: that would have fixed
the colours and left the content flashing. **The check had to build a
deployment** &mdash; every other check opens the file over `file://`, where the
whole feature does not exist, so a build that had lost it would go green every
time. **AND EVERY PAGE GETS THE WHOLE WINDOW** (&sect;94.13): the complaint reads
as *"the page is too narrow"* and is not quite that &mdash; the navigation row
had been let past the 1180 cap and the content had not, so at 1670px the row ran
edge to edge above a page sitting centred with 238px of nothing down each side.
Two containers that used to agree stopped agreeing. &sect;93.9 finished: the cap
comes off everywhere, the 1600 ceiling goes with it, and the check asserts the
AGREEMENT rather than the number, so a later change to the gutters stays green.
**AND THE ARRANGE BUTTON GOES** (&sect;94.15): &sect;63.3 kept it beside the pen
for people who had no pen, and &sect;94.3 closed reordering to the office, who
all have one &mdash; so its reason expired the same day it was written down. The
group keeps its own, because that page has no pen at all. It nearly shipped
returning `undefined`: deleting the leading term of `return arr + (…)` left
`return` alone on a line, and the page RENDERS that word rather than throwing.*

*Earlier: 2026-08-24 &mdash; **v3.24: who a row is** (&sect;87, spec 013).
One screenshot &mdash; *"I got 3 people skipped but they have an email in the
registry"* &mdash; and nothing in the resolver was wrong: **the three people were
on the register twice.** Once from the employee file with an address and a long
legal name, once typed into the role picker with a shorter spelling and no
identifier at all; the role sat on the typed row, so the message resolved to the
copy nobody could email. The Name column shows the first three words
(&sect;81.1), which is why the two rows read as one on screen. **A NAME IS NEVER
AN IDENTIFIER** &mdash; this register already holds *Ahmed Mostafa Mohamed El
Gebely* and *Ahmed Mostafa Mohamed Abou El Einen*, and it held one human under
two spellings of their own name. So identity is **Emp ID, then email**, asked in
one place, reporting which rung answered. **THE FOURTH KIND OF DUPLICATE IS A
RESEMBLANCE AND IS SAID AS ONE**: &sect;81's three all match on a value two rows
SHARE and this pair shared nothing, so it is flagged amber, only where one side
has no identifier at all, and only where the shorter name **runs through** the
longer one in order &mdash; a chain of names, never a similarity score, because
a score needs a threshold and a threshold is a number nobody can defend the day
it pairs two strangers. **BOTH HAND-TYPED DOORS WERE THE FACTORY** and both ask
for an identifier now, refusing one already here by naming who &mdash; while a
matching NAME stops nothing, and neither identifier is required, because the SMO
often knows a name and a role and nothing else; the row is MARKED instead.
**THE PICKER SUGGESTS BEFORE IT CREATES**: a name typed a little differently
matched nobody and the only thing on offer was "+ Add", which is exactly how the
twins were made. **A DIFFERENCE IS AN OFFER, NEVER AN INSTRUCTION** (Islam's
ruling, and it is not the obvious way round): the file looks newer because it
was just uploaded and very often is not &mdash; it is the export somebody edited
two cells of three weeks ago. Which forced the round trip to be re-measured with
every pick TAKEN, or the fixed point was measuring the defaults (&sect;51.11
again). And **MERGE IS A DELETE THAT HANDS OVER EVERY POINTER FIRST**, ending in
`deletePerson()` on purpose: anything it forgot still points at the row, so the
delete refuses and the merge fails loudly instead of dropping a role. Nothing in
&sect;82 merges itself &mdash; every join is a person answering a question the
platform could not, and the platform's job is to notice, name both sides, and
refuse to guess.*

*Earlier: 2026-08-24 &mdash; **v3.22: the register, the deck, and the
door** (&sect;69). Eleven things Islam asked for while using the product, and
the ones worth reading are the four that turned out to be one argument each.
**A CONTROL SPANNING TWO COLUMNS BELONGS IN NEITHER**: the register's role
picker opened a role select AND a where select inside the Roles cell, so the
Unit column sat empty beside a dropdown naming a unit. The two halves go to
their own columns, and Give and Cancel go entirely &mdash; the result already
carries an &times;, so the undo is where the confirmation would be (&sect;62
turned round), which is exactly why both halves now start blank: **a picker that
commits on its own must never commit something nobody picked.** **A PERSON CAN
BE DELETED, AND THE REFUSAL IS THE FEATURE** (&sect;62's shape on a different
table) &mdash; refused while a role, a figure set, a named figure or an open
claim still points at them, and the refusal NAMES what; a TYPED NAME IS NOT A
POINTER, so being named on a plan line does not block, because an imported plan
names people who were never on the register. And **THE DOOR GOES WITH THE ROW**:
`credentials` survives the TRUNCATE by design, person keys are minted from the
name, so deleting *Ahmed Ali* and adding *Ahmed Ali* again handed the new person
the deleted one's password. `change_log` and `login_attempts` are deliberately
kept &mdash; a log that forgets is not a log. **MANAGE SLIDES WAS SHOWING A DECK
NOBODY WOULD PROJECT**: three complaints, one cause &mdash; `slidesAssemble()`
ran neither `deckFootMarks()` nor `deckFitPass()`. And the trap underneath it is
worth the space: **the fit pass decides by MEASURING, and `scrollHeight` and
`clientHeight` are both 0 on a detached element**, so a detached deck reports
every slide as fitting perfectly and the pass silently does nothing &mdash;
&sect;50.3's detached render is right for reading markup and useless for reading
a height. **THE DOT ON PERFORMANCE MEANS SOMETHING NOW**: it hung off
`.primary`, which is the landing page, so it was painted always and everywhere
while looking exactly like the marks the product uses for something outstanding.
It is `reportPending()` now &mdash; this subject owes a submission and you could
make it &mdash; and never shown to a reader, because `canSpeakFor()` is the same
question Submit asks and asking it differently is how a screen nags somebody who
has no control that would clear it. **AND THE ONE STRING THE DOOR ACCEPTED WAS
THE ONE STRING NOBODY HAD**: sign-in took a person key, which is minted from the
name and appears in a hover title and one prompt. It takes the EMAIL on the
register now, with the key still working &mdash; the bootstrap SMO has none, and
a deployment nobody can enter is not a deployment. Two rows sharing an address
sign NOBODY in and the door says so, a trade against &sect;43.3 made
deliberately. Everything after the password already worked: the forced change,
and the short list narrowed from the person's Official BU on the server.*

*Earlier: 2026-08-23 &mdash; **v3.21: a unit and a function are the same
product** (§53). Four fixes and one rule, and the rule is what the four are
evidence for. **A FUNCTION OPENED ON PERFORMANCE BECAUSE OF A CLAUSE, NOT A
DECISION**: §28's argument &mdash; what was agreed is what people come to read, the
score is a consequence of it &mdash; is about PLANS, and the code carrying it out
said `&& !isFn(k)`, so for four versions every unit opened on its plan and every
function did not. The tab and section keys are the only difference, so they are
two variables and not a second branch, which is how the halves drifted in the
first place. **A CAPABILITY IS A BAND, NOT A CARD**: everything below it was
wrapped in a bordered box with 16px of padding, so the rail and pane INSIDE it
&mdash; which draw their own borders &mdash; sat 34px narrower than the identical rail
and pane on a unit's page. A card inside a card, and the outer one's padding was
the whole of the mismatch; removing it also closed a seam, because `.pband`'s
`::before` paints the PAGE's ground and was painting it onto white. And the
**third duplicated rule in `arrange.css`** &mdash; two `.capbody` blocks, the later
winning on source order, after §29.2 and §51.5's `.capline` in the same file.
**§29.6 WAS APPLIED TO ONE RAIL OF TWO**: the unit's Plan rail lost its bare
number and the footer that tried to explain it &mdash; nothing on a plan page has
been reported, so there is no figure to explain &mdash; and the function's Projects
rail kept both, plus a small line carrying three counts, both dates and the
timeline kind over three lines where the unit's sat at two. **DELIVERABLES AND
OUTCOMES ARE ONE TABLE, TAGGED**, while the score still keeps them apart half
per side: reading them together and scoring them together are different
questions and only the first was ever asked. **A DELIVERABLE HAS NO DUE AND NO
OWNER** &mdash; it is delivered when the project ends and the project's owner owns
it &mdash; so `delivDue()` went at all four call sites rather than being left
answering true (§24), and both columns were dropped from the database, because a
column the platform no longer reads is one somebody fills in for nothing. Then
the rule itself: **WALKING BOTH SIDES IS NOT TESTING BOTH SIDES.** Every one of
those three had been through green sweeps that visited the page each time &mdash;
walking proves a page renders, and none of them were rendering faults. The two
pages were fine; they were fine DIFFERENTLY. So `qa.py` MEASURES the two and
asserts they AGREE &mdash; never what the number is, so a deliberate change to both
stays green &mdash; and it was run against v3.19 before being trusted, where it
reports `paneLeft: unit 212, function 229`.*

*Earlier: 2026-08-23 &mdash; **v3.21: the BU list, and the register as a
file** (§54, spec 011). A one-row sample and a ten-name list, and **six of the
ten names the client uses do not exist in the platform at all** — Distribution
is a COMPANY here, Retail is *Retail Stores*, and IT is the name of both a unit
and a function. Checking that against the tenant rather than assuming it is
what turned "map the BU column" into a stored list with a real question in it.
**POINTING AT NOTHING IS AN ANSWER**: Risk employs people and carries no
strategy, so they are on the register, they belong to Risk, and there is
nothing for them to open — a list that demanded a target for every name would
force a wrong one. **THE VOCABULARY IS THE ONE ROLES ALREADY USE**, which is
why the hardest-looking case cost nothing: the platform already knew how to
attach somebody to a company, because that is where a company CEO sits.
**AN UPLOAD ADDS AND AMENDS AND NEVER REMOVES** — §22's contract turned round,
deliberately: a plan is authored by upload because a plan is one whole thing,
and a register that a file replaced would retire everybody the file forgot.
**THE ROUND TRIP CAUGHT THE PLATFORM REFUSING ITS OWN EXPORT** on 31 of 33
rows, within a minute of the check existing — the download writes each person's
current role and the upload could not place it, and the fix is the rule the
column already promised: **it gives a role, it never takes or moves one.** Two
smaller ones from the same run, both old lessons: a value cleared AFTER
something was asked of it reported all 31 rows as asking for Contributor, and
the first one-edited-cell check edited the PERSON and downloaded again, so both
sides agreed and it passed while measuring nothing (§50.6). **AND A CHECK THAT
ASKS WHETHER IT CAN RUN IS A CHECK THAT PASSES**: the new authorisation test was
written `A.classify ? … : null` and the export is `collect()`, so it skipped in
silence while the suite said 131 passed. Applied forward rather than
re-learned — the contrast sweep now SEEDS two BU rows before walking Setup (an
empty page is reported clean, §45.2) and COUNTS its pages instead of printing a
literal that was already stale. **A CLIENT MUST NOT INHERIT RAYA'S
DEPARTMENTS**: the demo carries the ten names, which put them in `org.extra` —
exactly where §45.3's figure set survived the clean slate — so `mainbus` joins
the scrub in migration 004, verified by deploying to an empty database and
asking the row rather than by reading the SQL. Recorded rather than hidden: the
register was already 1061px in a 920px box and Main BU makes it 1127px.*

*Earlier: 2026-08-23 &mdash; **v3.21: the client's mark, on the door and
on the deck** (§52). **PNG ONLY, AND IT IS A SECURITY DECISION**: an uploaded
SVG is executable content in a page already running `'unsafe-inline'` (§43.6),
so one file could read every session in the tenant — put to Islam as a trade
with its cost stated, and he chose PNG. **A UNIT'S MARK NEEDS NO MIGRATION**:
`units` carries an `extra` JSONB and `lib/state-io.js` files every unrecognised
key there and reads it back, so `logo` round-trips untouched — proved in a
throwaway Postgres, 17,978 characters per unit, still there **after the clean
slate**, which is right because migration 004 removes `perf` BY NAME and a real
client's lockup is not invented content (§21). **A LOGO IS A UNIT SETTING**, so
it joins `UNIT_CONFIG` in `lib/authorize.js` rather than falling through to
unknown — the same permission either way, but the REFUSAL then names Setup and
sends the person somewhere (§16.7). **THE GROUND IS THE WHOLE POINT**:
`picIntake` paints white before encoding (right for a slide picture, fatal for a
mark), so the shared half became `imgToCanvas(file, maxEdge, ground)` with the
ground stated by its caller — and since a PNG cannot be recoloured, the mark
sits on a light plate on a dark slide, the same answer the sign-in wall already
gives Forefront's own mark. **A FOOTER IN THE FLEX COLUMN QUIETLY LENGTHENS THE
DECK** — it shortens every content box, which changes how many rows a table fits
and therefore how many continuation slides `deckFitPass()` mints; out of flow
with its space reserved, measured across five units at 27/22/19/19/19 slides
before and exactly the same after. And **a slide that wears the mark LARGE does
not wear it small as well** — written first against `.d-cover` it silently took
the footer off five more, because the SWOT divider, the four pillar dividers and
Thank you all carry that class. **§52.10: ALL TEN UNITS NOW CARRY A MARK** —
eight distinct, because DISTRIBUTION is the COMPANY's and its three units wear
it, and **B2B Ecomm wears MAZAYA**, which was not a guess but the worked example
`navName()` has carried since 3.4. Two SILENT failures on the way, both found
only by looking at the output: **a font subset MAPS far more than it DRAWS**
(the manual's JetBrains Mono has a cmap entry for every ASCII character and an
outline for 36, no digits, so `B2B` came out `B B` and nothing complained), and
**`set_content()` serves from `about:blank`, where Chromium refuses a `file://`
subresource** — so ten lockups rendered as broken-image icons, 2.5KB each and
all within 200 bytes of one another, and would have been baked into the seed.
Both now fail loudly: the generator refuses a character it cannot draw, and the
renderer COUNTS THE INK and refuses anything under 5%. **A pipeline that
substitutes silently produces a plausible artefact.***

*Earlier: 2026-08-23 &mdash; **the client's own mark on the door** (§52).
A one-line ask that was decisions all the way down. **THE TENANT'S MARK GOES ON
THE CARD, NOT ON THE WALL** — the person at that door works for the client, so
their mark belongs on the thing they touch while Forefront's stays on the wall
that explains the product; and the decider is a measurement, not a preference,
because **below 980px the wall is gone entirely** and a mark placed there
vanishes on every phone. **THE FILE YOU ARE HANDED IS NOT THE ASSET**: two
JPEGs arrived with opaque grey grounds — a JPEG has no alpha — so the reversed
lockup was invisible and either one would have painted a rectangle around
itself; the mark is extracted from the client's own brand manual instead, with
the colours read off the vector paths rather than sampled from a picture of
them, and the manual's `#CDDDF0` **construction grid dropped, because the grid
is not the mark**. Two faults, neither visible in the source and both found by
rendering the result. **A `<use>` CLONES INTO A SHADOW TREE**, which a document
selector cannot reach — so the obvious `.clientmark .mk { fill: … }` styled
nothing at all; custom properties DO cross that boundary, so the fill is
declared inline inside the symbol and the tokens still theme it. And **A HEIGHT
IS NOT A WIDTH** (§35.4, again): the mark cost the card ~70px, which at
1024×560 grew a scrollbar — and putting the fix in the existing short-window
block only half worked, because that block carries `min-width: 981px` for the
**wall**, which does not exist below 980. **THE WALL IS GATED ON WIDTH; THE
CARD IS NOT** — anything condensing the card needs its own block with no width
condition, placed last so the shorter answer wins on a screen that is both.
Swept 22 sizes in both themes; three stacked-layout sizes still scroll and are
recorded rather than hidden. **TWO LOCKUPS, TWO JOBS**: the arrows mark
(`RAYA ◄► TRADE`) is the GROUP, the with-line mark (`RAYA │ DISTRIBUTION`) is
the UNIT — Islam's ruling, and they are drawn in different blues. Extracting
the seven unit marks lost the rule the file is named after, twice: **the
divider is a STROKE, not a fill**, so a colour filter drops it silently, and it
reaches above the wordmark, so removing line art that TOUCHES the redaction
takes it with the neighbouring rows — remove only what is COVERED. Client
material lives in **`clients/raya-trade/`** at the root, never inside
`SMP-Project-Folder/`, which is the product and travels as a zip. Still open:
the unit lockups on the review deck (cover and footer of every slide, to be
drawn first), and the security decision that **an uploaded SVG is executable
content** in a page already running `'unsafe-inline'` (§43.6).*

*Earlier: 2026-08-23 — **v3.19: the capability half catches up, and
slides get a place** (§51). Almost none of it a feature. **ADDING A CAPABILITY
TOOK THE PRODUCT DOWN** — the add button had minted the pre-§15 shape for eleven
versions, so the new row had no id, no function and neither of the lists every
reader expects, and the Capabilities page threw and rendered nothing; removing
one threw before it could confirm. §24's rule with the sign reversed: **when a
field is renamed, the code that CREATES it has to be found as well as the code
that reads it**, because a writer minting the old shape is silent until somebody
opens the page that reads it. The capability pages take the pillar pages'
design — project codes, the coded band on every pane, the nameplate gone — and
that review found the worst reading in the product: **two `.capline` rules in
one file**, the second winning on source order, so the band went navy and kept
the page's ink and the capability's own NAME measured 1.43:1. Nothing had ever
looked: the function pages had gone twelve versions unswept. **MANAGE SLIDES**
becomes a mode with the whole deck down the left as real slides at one tenth,
which is what removed the position dropdown; a picture **fits** its frame rather
than being cropped by it, because two of Islam's notes turned out to be one
note and there had been no way to say "show me all of it". **UNITS | FUNCTIONS
IS ONE BUTTON**, at last — it had looked like one control since §41.8 and was
two dressed as one, and I measured the container and argued the point before
understanding him: **measuring the thing you built proves what you built, not
what was asked for.** And three checks were found lying in one day — a label
that had never scanned the page it named, a probe that broke when I edited what
it string-matched, and two sweeps that would have gone green while walking half
the product.*
*Earlier: 2026-08-23 — **v3.18: a column the data always had, and
pictures in the review** (§50, spec 009). **COLLABORATORS WERE NEVER MISSING**
— a tactic has carried them since the import template, the database stores
them, and being named on one is what lets a Contributor report a line. What was
missing was a COLUMN, any way to type one, and a single demo tactic that had
any, so 116 of them rendered nothing (§45.2 again). **ONE PERSON IS
ACCOUNTABLE AND SEVERAL SUPPORT THEM IS TWO FACTS, SO IT IS TWO COLUMNS** —
and correcting them is the SMO's, not because it is tidier but because **being
named on a tactic decides who may report it**, so a unit that could edit its own
collaborators could hand itself reporting rights the matrix never gave it. Then
§16.12, undesigned since v3.5: **A PICTURE SLIDE IS NOT A SLIDE.** The deck is
built fresh every time it opens and there is no exported copy, so what is stored
is a title, a place, an arrangement and the pictures — a stored slide would be
the exported deck the whole feature exists to avoid. **WHERE A PICTURE MAY GO IS
READ BACK OUT OF THE DECK ITSELF**, not listed beside it, so the two cannot
drift; an anchor that has since been renamed away sends its picture to the end
rather than dropping it. **WHO MAY ADD ONE IS NOT A NEW RULE** — a picture
speaks for the whole unit, which is submitting and the cycle note, so it is
classified with them and both sides ask one function; proved by comparing the
screen's answer with the server's for **527 person-and-target pairs, 0
disagreements**. **ENCODED BOTH WAYS AND THE SMALLER KEPT**, because §16.12 asks
for a screenshot AND a photograph and they want opposite formats: 164KB vs
256KB one way, 395KB vs 3,058KB the other, and the file's own extension predicts
neither. Three faults found by MEASURING: `--gold-deep` on `--surface-2` at
4.45:1 (§38.5, fifth time — walked into a trap this file records by number); a
rule written `.pgrid.pg2` applying to its parent and to nothing else, which
silently stacked every arrangement into one column and was invisible in the
source and obvious in a screenshot; and **two checks that were passing because
they were measuring the wrong thing** — the sweep's `unit/perf` label, which had
never once scanned the Performance page, and a probe of mine that broke when I
edited what it string-matched. The 31 failures the first one hid are recorded as
§16.15 and deliberately NOT fixed: a palette decision on a page this version was
not asked to touch.*

*Earlier: 2026-08-23 — **the due diligence, and the four it could not
fix without asking** (§48, §49). Thirty-one viewers were signed in and WALKED,
not reasoned about, and the method is the finding: **a comparison against a
field nobody sets fails silently and in the SAFE direction**, so twelve
versions of green sweeps never saw that reordering had been dead code for all
thirty-one people since §33 — the third instance of one fault, and the rule is
now earned: **after renaming a field, grep the OLD name across every source,
including the ones the change was not about.** Import was the only Setup page
with **no access check at all** and printed an "SMO only" pill as decoration.
The modal announced `aria-modal` and behaved like a panel — and while CLOSED
stayed tabbable and announced, §3.2's `opacity:0` lesson arriving in a
different tree. The build emitted **no `<html>` tag at all**. The Focus board
sent people to a control that does not exist. Then four that changed behaviour
or data, each put to Islam first. **A NEW CYCLE ASKS AGAIN**: opening one left
163 of 184 items reading "reported", so a unit could submit without touching a
field — it archives the figures and then clears them, because HISTORY keeps a
SCORE and never the raw numbers, and the snapshot is keyed **by id, never by
position**, or a plan edited in between puts last cycle's number against a
different measure. **CLEARING A PLAN IS THE SAME ACT AS REPLACING ONE** —
import archived and offered a Restore; Clear plan destroyed the identical thing
with no undo. **A COMPANY GETS A LIFE** (add, rename, retire), retired never
deleted because its key is written into every `co:<key>` role, and retiring is
REFUSED while units still belong rather than orphaning them quietly.
**RETIRING REMEMBERS WHAT IT TOOK**: restoring gave nothing back, so a
custodian returned as a Contributor and nobody was told — and a seat somebody
else has taken up meanwhile is named and NOT offered. Two findings CORRECTED by
measuring rather than reasoning: the demo's companies are inherited
deliberately (§21 keeps them exactly as it keeps the ten units), and
`lib/rules.js`'s Contributor fallback is load-bearing for two real people — it
is the definition of Contributor, not an invented role.*

*Earlier: 2026-08-22 — **v3.17**: ONE DOOR, A SWITCH, AND A CYCLE THAT
ASKS (§47). **THE GEAR STOPS BEING A MENU**: Setup and Manage merge into one
railed page, and with one destination behind it a menu holding one item is a
door behind a door (§32, once already at the gate). **A GROUP MAY FOLD BUT
NEVER THE ONE YOU ARE IN** — a rail that can hide the row it points at lies
about where you are. **THE THIRD STATE IS WHAT MADE IT A FOLD**: Units |
Functions looked like one segmented box since §41.8 but could also be BOTH
CLOSED; dropping that state is what turns it into a switch, and the disclosure
arrow had to go with it because ▸/▾ promises something that no longer happens.
**A HARD-CODED GUESS THAT CHANGES A SCORE IS NOT COSMETIC**: opening a cycle
minted `endsQuarter:4`, which decides which tactics count as due, so it is
asked for now — with nothing touching REVIEW until Open is pressed, or a
half-filled form would already have closed the cycle it meant to succeed. And
**MEASURE THE PROSE, DO NOT GREP IT**: driving all thirteen user-facing pages
found nine already clean and exactly one line that described the DATABASE on a
page a group CEO opens.*

*Earlier: 2026-08-22 — **v3.16**: SETUP BECOMES A PLACE (§46). Four of
five items settled from a MOCKUP rather than a description, and two of its
options were killed by being drawn — one of them mine. **THE GEAR MENU WAS
DOING TWO UNRELATED JOBS**: six entries are things you DO in a cycle, ten are
things you SET ONCE, and splitting them halved the problem before any design
happened. The rail is not a new component — it is what a unit's pillars have
sat in since 1.7 — and the groups are **the question you came to answer**, not
which table the page edits. **AN ICON STRIP NEEDS ICONS ANYBODY GUESSES
RIGHT**: a label, a scoring band and a figure set are three abstractions with
no picture, so the collapse was drawn collapsed in order to be seen failing.
**THE CODE SHOWN IS DERIVED; THE CODE STORED IS AN IDENTIFIER** — putting the
pillar name back put the two side by side and the Plan tab said "01" where
every other surface said "MB01". **A COLOUR THAT CLEARS ON WHITE IS NOT
THEREBY CLEARED**: `--gold-deep` on `--surface-2` is 4.45:1, §38.5 for the
fourth time. **"WRAP AROUND THE NAME LENGTH" MEANS THE COLUMN FITS THE NAME**,
not that the name is broken to fit the column — reading it the other way first
produced 59px rows; auto layout and content-sized columns gave 39px, every row
the same. Three specificity traps in one file collapse to one rule: **a class
alone rarely beats `.cfg table`**, and an equal specificity loses on
build.py's concatenation order. **`width:99%; max-width:0` IS A FIXED-LAYOUT
TRICK** — under auto layout `max-width:0` is a cap, so the clip moves into a
block inside the cell. **AN EMPTY ARRAY IS TRUTHY**: `if (secs)` crashed the
group CEO's Setup page, and the real fault was paint() falling back to the
UNFILTERED def list when the reachable one came out empty. **A RESET IS NOT
"ISSUE" WITH A WIDER WHERE** — it ends sessions, is confirmed first, and
excludes the person asking, on the server. And **compare the fact, not two
renderings of it**: a role chip comparing display labels read every
group-level role as "elsewhere" because one function said "The group" and the
other "the group".*

*Earlier: 2026-08-22 — **v3.15**: EIGHT REFINEMENTS, AND WHAT THE
MEASURING FOUND (§45). Islam went through the built product screen by screen.
None of the eight is a feature; half were a symptom with a cause. **A
comparison against a field nobody sets fails silently and in the SAFE
direction** — `sync.js` still read `person.level`, deleted by §33 a version ago,
so `undefined !== "smo"` was true for everybody and the viewer switcher was
hidden from the one person it exists for. It locks down rather than opens up,
so nothing threw and every sweep stayed green; only using the product found it.
**A feature that renders nothing looks like a feature that was not built** — the
demo shipped with no figure sets, so every surface §44 built showed empty; it
now carries *Financial Figures* claiming all 26 EGP-denominated figures. And
that exposed the real one: **`sets` live in `org.extra`, the first thing §44
stored where §21's clean slate was not looking** — migration 004 deleted every
`row.src` with the pillars that carried them and left the set standing, owned by
a person it had just deleted. **THE OBVIOUS CAUSE EXPLAINS THE WORST CASE AND
NONE OF THE ORDINARY ONES**: the People page's role chips took the tallest row
from 89px to 69 and left the median at 61, and only measuring every cell of an
ordinary row found the three things paid on all 31 (61 → 41). **A COLOUR EMOJI
CANNOT BE COLOURED** — `&#128065;` ignores its element's `color` and overhangs a
26×24 button, which is why the lit eye painted brown on navy and sat below its
box while the pen (a text glyph) behaved; both are SVG taking `currentColor`
now. **A control that appears on hover needs something to hover** — removing the
pane heading took the pen's anchor with it, so the pane became the target.
**A file that is not built is not the product** — `src/new-units.js` is not in
`build.py` and its four units really live in `group-data.js:737`; editing it as
though it were data is how a source of truth acquires a second copy. And the
searchable dropdown's own rule: **the native `<select>` stays**, hidden in
place, because rewiring the controls that feed the access matrix to add a search
box is not a trade worth making. Multi-tenant restated and recorded as §36.5 —
still nothing built, deliberately; *enter first, then choose the client* settles
half of §36.4's open question.*

*Earlier: 2026-08-22 — **v3.14**: FIGURE SETS (§44, spec 008). Many
numbers are not the business unit's — revenue exists in Finance before a unit
is asked for it. **The thing that owns numbers is a NAMED SET**, not a person
and not a department: "figure custodian 1, 2, 3" says nothing and *Financial
Figures* says everything, which is why **the owner needs no role of its own**.
**The team is on the SET, not read off the person** — §33's instinct fails
here, because the Finance SMO custodian sits with the office rather than in
Finance, and what the BU head is reading is *who do I talk to*. **ONE owner per
set**; two people splitting the work is TWO sets, which is more honest and is
what lets a figure store only the set — handing one over is ONE edit rather
than twenty-seven. **Membership lives on the FIGURE** (`row.src`), so *one
figure, one set* is an invariant rather than a rule somebody checks.
**WHO PICKS A SET'S FIGURES IS A SECURITY SETTING**: ticking from the full list
IS reading every number in the group, so it DEFAULTS TO THE SMO and is opened
deliberately — enforced on the server, because a switch that only hides a
control is decoration (§42, learned once already). **FIRST CLAIM WINS**, with
no precedence between a set's tick and a unit custodian's naming: a rule that
ranked them would need explaining every time it applied. A refusal names the
holder and offers **Request the claim** — this REVERSES §16.7's "no challenge
workflow", because once two people can claim, a refusal with no route forward
is a dead end. **The SMO answers the request**, not the holder, who has an
interest in the answer. Step 3 is BUILT AND HIDDEN behind a tenant switch:
**Strategy › Who enters** is a UNIT page and not a Setup one, because a
strategy custodian holds no Setup at all — a Setup page would be unreachable by
the only person it is for. **Turning the switch off keeps every naming**; a
switch that destroys data is not a switch. Naming somebody gives them THAT
FIGURE AND NOTHING ELSE. Two lessons, both old ones re-earned: **the client and
the server must build the world the same way** (the browser's `world()` carried
`sets` but not `claims`, so the page answered from a world with no requests in
it — the drift `lib/rules.js` exists to prevent, twice in one afternoon; both
sides call `SMPRules.worldOf()` now), and **a state that cannot be reached by
navigating is a state nothing measures** — the sweep had to switch naming on
and open the picker explicitly, and runs 25 pages and states.*

*Earlier: 2026-08-21 — **v3.13**: THE HEADERS GO BACK TO THE TENANT'S
COLOUR (§41.10). Islam: *"it's not a navy/gold thing. It follows the brand
colours set in the platform."* That is the decision and it is a product
argument, not taste: **`--panel` is what Setup › Branding sets for the
navigation bar**, so a header on it WEARS THE TENANT'S BRAND and a header on
`--surface-2` wears nothing — the light header was the reference product's
answer to a question SMP answers differently, because SMP is branded per tenant
and the reference was not. **All five go back together** (`thead th`, `.phead`,
`.rail .rhead`, `.grouphead`, `.gcard .card-head`) — §40's lesson applied
rather than re-learned. The AUDIT is the method worth keeping: every selector
carrying `background:var(--panel)` before the retheme was DIFFED against the
current stylesheets rather than listed from memory; eight had lost it, five
were headers, three had gone to the accent and belong to §41's budget. And
restoring the ground took the sweep from 0 to 36 — every failure a second line
inside a header, written in the page's quiet ink, 2.4:1 on this one. **§38.5
for the third time: a surface with its own ground needs its own ink.**
`.factor-h span` was the stubborn one at `0,1,1`, where the header's own rule
could not reach it. Back to 0.*

*Earlier: 2026-08-21 — **v3.12, MERGED**: the folds become ONE CONTROL
(§41.8, treatment 4) — a single segmented box divided by a hairline instead of
two capsules. One box on a row that has no other box; the container **says
outright that Units and Functions are the same kind of thing**; and the two
folds STOP MOVING, because they used to be separated by whichever list was open
so the control you had just pressed changed position every time. Open is **the
segment lit, not the word coloured** — §41.4's accent words had nowhere to sit
inside a filled container, and lighting the segment is what a segmented control
already means. The divider is an INSET SHADOW, not a border, or it would widen
the segment and shift the one beside it. §41.9: **every fold mockup this round
contained an element the product does not have** — `.foldhere` ("· Mobile"
beside the closed fold) was removed from the markup long ago and its CSS was
left behind, and I drew from the stylesheet. §24 exists precisely so leftover
CSS cannot be mistaken for the product; **a mockup drawn from the STYLESHEET is
drawn from what the product could look like, not from what it does.** Also
§43.8: an explicit once-only reset of the SMO password to 1234, asked for
outright — it runs AFTER the retirement (or that would undo it in the same
request) and ONCE (or it would put 1234 back every time a real password was
chosen, which is the backdoor §43.1 removed).*

*Earlier: 2026-08-21 — v3.12 (in progress): ONE DECISION, THEN TICKS
(§16.7a). Islam on the first Source-of-figures screen: *"that's a huge setup to
do and not practical … he just needs the measure and target so he can tick if
he owns this or not."* Right, and the number says why — **116 figures across ten
units**, each asking for a team AND a person before the feature did anything.
The data also said what to key on: only ONE measure name repeats across units,
so "set it once by name" saves nothing, but **27 of the 116 are money**, spread
across all ten — **what separates a team's number from the unit's is what it is
measured in, not its name**. So WHO is chosen once at the top and every row is a
single mark, the same shape as Focus measures (A13); the units are BUTTONS with
their counts on them rather than a dropdown, so where the work is left is
visible without opening anything; and a row shows the measure and its target
and nothing else — direction and compile rule are the plan's business, not the
custodian's. Three states per row, not two: unclaimed, mine, or **another
team's**, the third shown as that team's name rather than a tick that could be
overwritten unnoticed. Also §41.7: the CLOSED navigation fold is a soft ghost
(treatment D) — the fault was typographic, an 11px uppercase capsule beside
13.5px sentence-case tabs; D keeps a container, because **a fold is a group of
things rather than a page and the container is what says so**, and drops the
border and the shouting.*

*Earlier: 2026-08-21 — v3.12 (in progress): THE PALETTE SWITCH IS GONE
(§41.6). Islam: *"I don't need to have slate, the branding covers this from
inside."* Which colours the product wears is the TENANT's decision (Setup ›
Branding), not a per-screen preference that leaves two people in the same
organisation looking at different products; light and dark stay each viewer's
own. Removing it exposed what it had been hiding: **`PALETTES[0]` was `slate`
and the bare `:root` held slate's values**, so a fresh deployment opened in a
palette that is not the house one — invisible while everybody pressed the
button. **What paints when nothing has decided must be what the product
actually is.** The stored key is no longer read AND is cleared on load, or a
stale value would pin somebody to a palette with no control left to change it
back; the dead helpers went with the control (§24); and the contrast sweep
selects a palette via `THEME.setBrand({palette})` now, or it would measure
Forefront twice and call it four combinations.*

*Earlier: 2026-08-21 — v3.12 (in progress): FINANCE ENTERS THE NUMBERS
FINANCE OWNS (§16.7, built). A key objective or a key measure may carry
`src = { team, by }` — the team that is master of the number and the person who
enters it. **The team is STORED, not read off the person**: §33's instinct fails
here, because the person may sit with the SMO rather than in the function whose
number it is (Islam's "Finance SMO custodian"), and the attribution must name
the number's HOME rather than the reporter's desk. **It is a rule, not a matrix
cell** — a source's reach is entirely what it is named on, crossing units
without owning them. Two consequences in the authoriser: the FIGURE
(`actual`/`progress`) and the NOTE had to be split, because the number is the
source's and the explanation is always the unit's; and **who is master of a
figure is SETUP** — classified separately so a refusal says "Setup is the SMO's"
rather than "a plan is corrected by the SMO", both true but only one sending
somebody to the right screen. A sourced figure **still counts toward the unit's
total**, so a unit cannot submit around a missing Finance number — the unit
chases too, and the page names what is outstanding and who owes it. THE LESSON:
**a control that cannot be completed is broken** — deleting `src` whenever one
end was empty made it impossible to set (team dropped for want of a person,
person dropped because the team had just gone); a half-set row is kept, shown as
"Needs both", and does nothing. Only visible by driving the real page. Two
screens: Setup › Source of figures, and Manage › Figures I report (hidden
outright for anybody named on nothing). Not sourced yet: capability projects.*

*Earlier: 2026-08-21 — v3.12 (in progress): THE SECURITY FLOOR (§43,
spec 007), on top of §42. **§19.4 is REVERSED**: the `1234` SMO is RETIRED, not
removed — the bootstrap still creates it (a deployment with no way in is not a
deployment) but with `must_change`, and a one-off JS step sets the flag on an
existing tenant *only if the stored hash still verifies against 1234*. It could
not be a `.sql` file, because migration 003 salted that hash; it **sets a flag
rather than clearing a password**, so it can never lock anybody out of their own
deployment. A **temporary password now buys nothing** — `/api/state` refuses
both directions while `must_change` is set, and **identity is checked before
authorisation**. **Guessing is slowed**: `login_attempts` (migration 012), 8 per
key and 25 per address in a rolling 15 minutes, failures only, cleared on
success, pruned on every sign-in (no scheduler here). Two rules: **check the
limit BEFORE verifying the password** or it is a timing oracle, and **never say
which threshold was hit or whether the key exists** — a rate limiter that
confirms usernames has given away what it was protecting. The DoS trade-off is
real and was observed, not theorised (hammering `smo` locked the SMO out
mid-test): that is why the window is short and self-clearing rather than a lock
somebody lifts. **Security headers** in `vercel.json` for every path, and
`scripts/dev-server.js` READS THAT LIST rather than repeating it (dropping only
HSTS, which from localhost would pin every other local server to https). The
honest limit: `'unsafe-inline'` stays because the single file is nothing but
inline script and `style=`; the policy still blocks every external script,
connection, frame and plugin, so an injection has nowhere to send anything —
the hash-based `script-src` upgrade is possible (no inline handlers anywhere)
and recorded rather than done, because **a stale hash is a page that does not
load**. Also: raw DB errors no longer reach the browser (a free schema map to
anyone probing), expired sessions are pruned, and a password change ends every
OTHER session that person holds — but never their own, because being signed out
of the tab you just used to choose a password is a bug that looks like
security. Still open, and these need decisions not code: hash CSP, tenant
isolation (§36), key custody / backups / retention, **who at Forefront can read
production**, an external penetration test before go-live, the Copilot's read
scope.*

*Earlier: 2026-08-21 — v3.12 (in progress): THE SERVER DECIDES WHO MAY
CHANGE WHAT (§42, spec 006). `POST /api/state` checked that you were signed in
and nothing else, then truncated thirty tables and wrote back whatever
arrived — register and access matrix included — so the lowest-privilege person
in the tenant could post a state making themselves the SMO. **Everything §37
built decided what a screen OFFERED; nothing decided what the server
ACCEPTED.** Two lines carry the fix. **The world is the STORED state, never the
incoming one** — authorise against what is being written and a save grants
itself the role that authorises it, in the same request. And **an unrecognised
change is the SMO's**: every classifier falls through to `unknown`, so a field
added later is guarded the day it is added, not the day somebody remembers.
**The rules are ONE file run on both sides** (`lib/rules.js`, inlined by
build.py and required by Node) — two copies drift, and the drift is silent: a
screen that offers an edit the server then refuses. **The diff that authorises
IS the change log** (`change_log`, outside the state graph beside credentials —
a log a save can erase is not a log), so "who moved this target" is answerable
for the first time. Three rules from Islam: a locked cycle refuses reporting;
contributors view, and if granted edit reach **their own lines only** (a rule
with teeth, so a stored `edit` still reaches nobody else's rows) and never
submit, because submitting speaks for the unit; **a tactic's quarters are
plan** — if a unit moves its own ticks, a tactic due in Q2 that did not happen
is dragged to Q4 and the record stops being a record. Also: `canReport()`
stopped being a hard-coded `head or custodian or SMO` and asks the matrix —
**a control that changes nothing is worse than no control**. And a refused save
now says so ON THE PAGE (§32's rule, one surface in) rather than warning a
console nobody has open. THE LESSON: **a reader that mutates what it reads will
be caught by whoever compares before and after** — `branding()` created a
four-null object the database never held, so every save carried a phantom group
change and every non-SMO save would have been refused for ever. 67 unit tests
and 10 end-to-end API tests passed while that was true, because all 77 built
their payloads from the seed rather than from a running browser. **Signing in
and typing one number found it.** Still open, in order: the `1234` SMO,
`must_change` unenforced on /api/state, no rate limit or lockout, no security
headers, raw DB errors reaching the browser, sessions never pruned.*

*Earlier: 2026-08-21 — v3.11 (in progress): a design LANGUAGE, and
palettes under it (§38). Ported from Strategy-Formulation at Islam's direction.
Two token layers, and the line between them is the point: LAYER 1 is the
language (type scale, shape, weight) — one set, never themed; LAYER 2 is the
palette — colours only, four blocks (slate and forefront × light and dark).
**A tenant's branding will supply a PALETTE, never a language** (§36), so a
client can be given their colours without being given a different product.
Nothing was renamed: `--panel`, `--gold` and `--stone` now carry a JOB rather
than a colour — **"gold" was never really gold, it was whatever the accent
happened to be**. Three rules with teeth. **A colour that works as a FILL
usually fails as TYPE** — white on the house gold is 2.4:1 — so every scoring
colour gained a `-tx` twin for words; that one change took the sweep from 15
failures to 0 across all four combinations, and cleared light mode's 61
long-standing ones with it. **A surface with its own background needs its own
ink**: the dark nav bar took `--panel-quiet`/`--panel-hover` rather than
borrowing the page's `--ink-3`, which on it was 2.5:1. And **an !important
keeps winning after the argument has changed** — the navy table header was
enforced with one, so editing `_shared.css` did nothing and only the
screenshots showed it. A retheme's SECOND pass matters as much as the first (§40): §38's "zero
contrast failures" was measured on ONE page and returned **316** when swept
across nineteen. **A token checked against the most generous background it ever
meets is checked against the one case that was never in doubt** — `--ink-3`
cleared on white and failed on `--surface-2`, where most of it actually sits.
And converting SOME members of a family is worse than converting none: table
headers went light while `.grouphead` and `.gcard .card-head` stayed navy, so
the survivors read as mistakes rather than as a style. **A header needs a
ground of its own to be a header** — whether or not that ground is dark; the
rail's lost its fill entirely and vanished. 316 → 0. THE ACCENT BUDGET (§41): the retheme gave a solid accent fill to FIVE things
at once, and **the budget is the thing to watch, not the rule** — one solid
fill is a mark, nine is a colour scheme. Islam: *"it's a strategy platform,
needs to be subtly coloured."* Settled from a drawn comparison, not a
description: the rail takes a quiet ground with an accent EDGE (the score keeps
its own scoring colour instead of being swallowed), the navigation goes back to
the underline, the pips stay solid because a 20px pip is a mark not a slab. The
rail and the nav no longer match, which was deliberate before and is the price
of the quieter register. **Consistency at the wrong volume is still wrong.** The
last item on the budget was the OPEN navigation fold (§41.4) — settled from the
same kind of drawn comparison as D, accent words with no fill: **an open fold is
a heading over the list it just revealed, and a heading needs no box.** Two
things came out of building it. **`.open` beats `:hover` on source order alone**
(both `0,3,0`), so replacing an open fill without adding an open hover leaves the
control silent under the mouse. And **an open fold is not reachable by navigating
to it** — the contrast sweep had never measured it, because a sweep that walks
pages only ever sees states that are pages; it scans the open fold explicitly
now.
TYPEFACE (§38.7): four faces embedded as latin subsets
of variable fonts (148 KB for all four, because a linked webfont would break
the offline single-file handover). It is its own axis for now — **B is how you
decide, A is how you ship** — and collapses into the palette once each has a
face. Absence of `data-font` is the system stack; there is no block for it
because there is nothing to say.*

*Earlier: 2026-08-21 — v3.10: the matrix stops being a matrix of pages
(§37). It was 25 pages × 7 roles, three buttons a cell — **525 controls on one
screen**, answering a question with 175 instances that nobody asks. It is seven
roles down and seven AREAS across now: Group, own/other business unit,
own/other supporting function, Reporting cycle, Setup. 49 cells. **Own is not a
setting** — it is read from what each role is attached to, which is §33 from the
other end, and it made "reaching" and "owning" stop being the same word: a
company CEO who may see the other companies REACHES those units without owning
them, so the own column and the other column can now say different things. Three
cells became **rules**: the knowledge base is readable by everyone, a plan is
corrected by the SMO alone, and focus measures are marked by the CEO — each true
whatever the table says. **A column whose every cell holds the same answer is a
question with no second answer** — and **none is not a third thing you choose,
it is the absence of the other two**, so the cell is two toggles rather than
three buttons and nothing lit is itself the answer. Two layout lessons: a full sentence in a 19%
column makes a 49-cell table taller than the 175-cell one it replaced, and
**a width set on the body cells of a `table-layout:fixed` table does nothing** —
fixed layout takes every width from the header row. Also: the intermediate
design (pick a role, five collapsible groups) was killed BY ITS MOCKUP — with
real data four groups in five are "mixed", so it unfolded back into the list it
was meant to replace.*

*Earlier: 2026-08-21 — v3.9: the register (§35), and the URL stops
naming the repository (§35.6). The register works because there is nothing to
synchronise: §33 put a responsibility role on the THING, so the People page
writes `UNIT_ROLES.mobile.head` — the same field the unit page writes, through
the same function. **A disagreement is not possible when only one copy exists.**
The role `<select>` is a search now, because a select could offer only people
already attached to the unit (so a new unit could never get its first head) and
could not offer somebody who does not exist (the normal case). **Typing does not
repaint** — the filter hides rows in place, because a repaint would replace the
input being typed into, the same family of fault as §30.1. **People are retired,
never deleted**, retiring revokes their roles, and the refusal is on the SERVER:
a retired person is turned away with the correct password. **Absent is not
"none"** — a person the server has not met yet has no password state, so the
column shows a dash, and every save drops the cache so the next paint asks
again. Bulk temporary passwords: one shared password, and **the server picks who
gets it**, so a stale screen can only issue to fewer people, never more.*

*Earlier: 2026-08-21 — v3.9: the door gets a wall (§34).
The sign-in page was one 400px card asked to carry the whole product, so every
line of brand had to be squeezed above the password box. Strategy-Formulation's
strong concept is **not in its form — it is in the split**: a navy wall arguing
the product's case beside a pale dotted field the form floats on. Taken: the
split, the glass card, icon-inset fields with a focus RING rather than a border
swap, one staggered entrance. Deliberately not taken: their `AUTH_001` error
codes (theatre for a product with one SMO issuing passwords by hand), their
blue (we are navy/gold), their light-only palette. Three rules came out of it.
**The wall may only claim what SMP actually does** — the front door is the last
place invented capability belongs (§21, one surface further out). **Height is a
constraint a width query cannot see**: at 1024x560 the quote fell below the fold
while every max-width query reported the layout fine, so §27.1's sweep now runs
on both axes. **Whoever hides a field hides its furniture** — the unit of
showing and hiding is the composed control, never the one element inside it that
happens to have the id. And the tool lesson: **a contrast check that cannot see
gradients passes everything**, because reading only `backgroundColor` walks
straight past a gradient to the white body beneath.*

*Earlier: 2026-08-20 — v3.8: roles replace levels (§33).
N-1/N-2/N-3 were org depth, and the giveaway was in the code: each level carried
a `titles` string stapling real job titles onto the abstraction. **The role is
the thing; a job title never decides access.** Seven roles. **Where a role lives
depends on what kind it is** — a SEAT (super user, CEO) is a property of the
person; RESPONSIBILITY FOR A THING (unit owner, custodian, function head) is a
property of the thing, so a unit's head pointer IS the role read from the other
end. One fact, two editing surfaces, cannot disagree — and several roles at once
come free. Access is the **most generous** grant across a person's roles, with
scope still resolved per role. **Two kinds of migration want opposite orders
around the seed**: `schema.sql` is all CREATE TABLE IF NOT EXISTS and can never
add a column to an existing table, so a schema migration must run BEFORE the
seed while a data migration (§21's clean slate) must run after. Migrations
declare `-- @phase: pre` in their first line; no marker means post. Without this
the seed would have written `people.role` on a tenant that still had `level` and
broken the live database — invisible to every fresh-deploy test (§33.5).*

*Earlier: 2026-08-20 — v3.7: one door (§32). The gate was
**three** states every time — the sign-in card painted immediately in its legacy
shape, reshaped when `/api/auth` answered, then swapped for a Starting page
offering a button to the platform. **Before the answer is known there is exactly
one honest thing to show, and it is nothing**: the card is hidden until the
session check resolves, a live session opens the platform without the gate ever
being seen, and the Starting page is gone — a page whose only content is a
button to the page you just asked for is a door behind a door. The 30-day
session was always true (`SESSION_DAYS` in `lib/auth.js`); the Starting page is
what made it feel otherwise, so the promise is now stated under the button. The
door's design follows HR_ERP's sign-in. Also: the Labels page's last three notes
moved to the knowledge base, but **the collision alarm stayed** — a blocked save
must say why where the save is.*

*Earlier: 2026-08-20 — v3.6: the Plan page gains a pen,
**for the SMO only** (§31). §22 is unchanged — a plan is still authored by
upload, codes are still minted on arrival, replacing still archives — this adds
correcting a plan afterwards without re-uploading a unit to fix a word. The gate
is `mayEditPlan()`, level `smo` AND `u_plan` edit: **the key alone is not
enough**, because `u_plan` at edit is held by unit heads too and a plan
correctable by the person measured against it is a different decision from one
correctable by its custodian. Revisit when §19.2's per-action authorisation and
change log land. The code, the direction and the compile rule stay read-only —
they change what a figure MEANS.*

*Earlier: 2026-08-20 — v3.5: the knowledge base, and two
rules with teeth. **A handler that rewrites the DOM must not run in the middle
of an interaction with that DOM** — field `change` fires on blur, so pressing
Done saved the field, repainted, and destroyed the button mid-click; a repaint
asked for while the mouse is down now waits for the click (§30.1). This is the
third of that family after §29.1 and the React modal note. **An access key
absent from a tenant's stored map means "not answered yet", not "denied"** —
the map is stored per tenant and only holds keys that existed when it was
written, so every new page was invisible on existing deployments while working
on fresh ones; `grant()` falls back to the shipped default (§30.2). Also: the
Knowledge Base page (`c_kb`, view for everyone) is where explanation lives now —
a setup table is where you change a thing, not where it is explained; Companies
has its own tab; the pen-on-hover replaces the Edit bar where an edit mode
exists — **and not on Plan, which has none by design (§22)**; and a third
byte-identical duplicate function was found and removed.*

*Earlier: 2026-08-20 — v3.4: seven fixes, three rules.
**Whoever rewrites the DOM re-wires it, in the same function** — `paintUnits()`
replaces the nav row's innerHTML, so the fold handlers wired over in `wire()`
died every time the Manage menu opened or closed, and three paths call
`paintUnits()` alone. The fold's own comment had already stated the rule; the
menu broke it from the other side, so the wiring moved into the function that
destroys it. **A duplicated CSS rule does not fail loudly, it quietly ignores
you** — two `.themebtn` rules (20px and a 30px left from §25) held the first line
at 31px of content no matter what the new number said; it is 27px now, half of
47. **A sticky element that pins lower than it sits will slide the difference,
so make it one number, not two** — `--rail-gap` is now both the panel's
top padding and the sticky offset, and rail travel measures 0px at every scroll
position (§29.4). Also: `SHOW_KIND=false` hides Direction/Capability at five
call sites (the data and the import template keep it); the "Plan only" notice
and the rail's "Figure shown" footer are gone; rail rows read "N measures · N
tactics" rather than a bare number (§29).*

*Earlier: 2026-08-20 — v3.3: the condense-on-scroll is gone,
and the scroll-up glitch with it. Three versions had fixed real causes
underneath that symptom; this one removed the **mechanism**. Measured: at scroll
25 the chrome settled at 190px arriving downward and 168px arriving upward, and
stayed — the hysteresis working as designed, costing a 22px animated step into
the page every time you scrolled back up. **A component whose size depends on
scroll position will eventually depend on scroll DIRECTION, and then it is a
state machine nobody drew** — removing it is cheaper than getting it right. It
bought 22px on a 47px header. Gone: the listener, the `scrolled` class, every
`body.scrolled` rule. `--chrome-h` stays and now reports a constant. Also: the
rail lost its `max-height` (a capped rail cut lists off mid-row — a navigation
list must never say "it ends here"); **the sticky OFFSET may read `--chrome-h`,
a max-height never may** (§28.3, the v2.8 loop — **AMENDED BY §101.5/§101.6**:
the loop ran through the header CONDENSE, which this same version deleted, so
`--chrome-h` is now a constant and a max-height fed by it closes nothing. The
Setup rail is capped to the window since v3.30. Two conditions, both asserted by
`checks/setup-rail.py`: **nothing above the box may move when the box resizes**,
and the capped list must **say that it continues** — a visible scrollbar track
and a sticky fade, because §100.5's objection is right even where its refusal is
not); Manage is a gear with the word
in its `title`; a unit opens on Strategy › Plan; and `section()` omits an empty
header rather than rendering a blank `<h2>` that still spends its margin (§28).*

*Earlier: 2026-08-20 — v3.2: one line, at every width. Three
rules came out of it. **A layout verified at the widths that pass is not
verified** — v3.0 measured the first line, fixed it at 1180+, and said so in the
note claiming it was done; Islam's laptop is 1000px. Sweep 1920→600 and assert,
or do not claim it. **`opacity:0` hides a box, it does not remove it** — every
`.tip::after` hover note is a ~320px absolutely positioned bubble that was laid
out at all times, so wherever an icon sat near the right edge the page grew a
horizontal scroll and the sticky chrome slid with it; that was the "glitchy
header", for versions. Hidden tooltips are `display:none` now, with
`overflow-x:**clip**` on `.wrap` as the backstop — never `hidden`, which makes a
scroll container and breaks every `position:sticky` inside it. **Null is never
zero, and never NaN** (§5.7 extended): `groupRatio()` did 0/0 on a tenant with no
tactics and printed `NaN%` on the group's front page. Every clean slate showed
it and the demo dataset never did — check against the data that can expose the
bug, not the data that looks good. Theme is Light/Dark only now; the device
decides where the switch starts, not a third state (§27).*

*Earlier: 2026-08-20 — v3.1: installable. `manifest.webmanifest`,
`sw.js` and `icons/` at the repo root make SMP a PWA — own icon, own window, opens
offline. **The service worker never caches `/api/*`**: a cached `/api/state` is
last quarter's actuals wearing this quarter's chrome, and a platform showing stale
figures as current is worse than one that will not open. Network-first for the
shell, so a deploy still reaches people; the cache NAME is the bust, so bump
`SHELL` in `sw.js` whenever the shell list changes. Registration lives in the gate
only — one origin-wide scope covers both pages. Icons are generated from
`favicon.svg` by `python3 scripts/make-icons.py`; **the maskable one is a
different drawing, not a resize** (§26.4). Re-run it if the mark changes.*

*Earlier: 2026-08-20 — v3.0: light and dark, by choice. The dark
palette had been in `_shared.css` since the beginning with nothing to select it.
The switch (Auto/Light/Dark, `localStorage` key `smp.theme`, shared with the
gate) is small; what it exposed is the rule worth keeping: **a colour written
into a rule as a literal is a light-mode assumption that survives into dark** —
the zebra stripe was a hardcoded `#F7F9FC` painting a near-white band under
near-white text on every table. Five tokens closed the class; dark went from 482
failing contrast runs to 11. **Light still has 61, untouched and recorded** —
fixing them is a palette decision, not a dark-mode fix (§25). Two other rules:
**a theme is a property of the screen, never of the state graph** (autosaving it
would turn the platform dark for the whole tenant), and **`auto` removes the
attribute rather than setting it**, because absence is what hands the decision
back to `prefers-color-scheme` (§25.2).*

*Earlier: 2026-08-20 — v2.9: the chrome is two lines. The header
said where you are five times over, above a nav row that already said it, so the
org name, the unit name, the shape tag, the eyebrow and the Info button all went;
Setup and Manage became one worded **Manage** button with a menu of all ten
destinations. **Delete an element and delete its CSS with it** — `.eyebrow` was
also the deck slide's kicker, and a `max-height` written for a condensing header
was reaching a full-screen slide (§24).*

*Earlier: 2026-08-20 — v2.8: v2.7's rail cap closed a feedback loop —
measured height → page height → scroll clamp → header condense → measured height —
and it oscillated forever. **A sticky offset changes nobody's height; a max-height
does. Never size anything against a JS-measured value that the size itself can
change.** The header also no longer condenses on a page with no room to scroll
(§23.7).*

*Earlier: 2026-08-20 — v2.7: the rail was pinned 12px from the top of the
window, under a sticky chrome up to 258px tall, so the chrome swallowed its clicks;
and `.chrome` had no background of its own, which is what showed through mid-condense
(§23.6). **When a control "does not work", check what the click actually hits.***

*Earlier: 2026-08-20 — v2.6: the horizon is the tenant's to set, not a baked
default (§23.5); Distribution and B2C confirmed as real companies.*

*Earlier: 2026-08-20 — v2.5: the company level ported from Islam's own build
(§23), plus the two defects a real uploaded plan exposed — a pillar with no code, and
the triple-pinned sticky chrome.*

*Earlier: 2026-08-20 — v2.4: the SMP icon — `favicon.svg` / `favicon.png` at
the repo root, and the same mark inlined by `build.py` so the single file carries it
offline. Regenerate both together if the mark changes.*

*Earlier: 2026-08-20 — v2.3: the plan template loses its codes; upload authors
and archives (§22).*

*Earlier: 2026-08-20 — v2.2: the clean slate and the Demo button (§21); the
seed-then-migrate order and the "no invented content in the database" rule recorded
above.*

*Earlier: 2026-08-20 (SMP identified as the Strategy Management Platform: project folder
imported into the repo, spec-kit installed (.specify/ + specs/), project context, stack, layout,
build commands, and doc-currency rules rewritten around SMP-Project-Folder/.)*
