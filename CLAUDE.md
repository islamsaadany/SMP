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
- **BEFORE MERGING, FETCH MAIN AND LOOK AT IT.** `git fetch origin main` and
  compare — another session may have pushed while this one was working, and it
  has: §70 landed on main mid-session on 2026-08-24 while §71 was being built.
  Never merge blind.
- **Merge with `--ff-only`.** It REFUSES a divergent main instead of inventing a
  merge commit, so the moment two sessions have touched the same thing you are
  told rather than shown a silent auto-merge. On a refusal: fetch, merge main
  into the branch, resolve there, re-run the checks, then fast-forward.
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
  waiting for, and **it still starts hidden**. A screen preference
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
python3 checks/office-chat.py   # the chat's client half — serves the built file over HTTP,
                                # because the whole feature is invisible over file:// (§97.9)
python3 checks/setup-rail.py    # the Setup rail fits the window, every entry is reachable
                                # by scrolling the LIST, and the cap does not move --chrome-h
                                # (§101.5 — that last one is what licenses the cap at all)
python3 checks/setup-overview.py      # the Overview agrees with the pages it summarises; it
                                      # MAKES the state, because the demo tenant is all-clear
python3 checks/setup-overview-live.py # ...and its three server-backed rows, over HTTP, where
                                      # they exist at all (§101.12)
python3 checks/setup-search.py  # the rail's search: typing NEVER repaints, a repaint keeps
                                # the filter, and a match inside a FOLDED group is findable
                                # (§101.13, §101.14 — all three fail silently)
```
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

*Last Updated: 2026-08-26 &mdash; **v3.33: the Setup makeover, complete &mdash;
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
