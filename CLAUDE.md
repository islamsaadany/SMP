# Claude Code Instructions for SMP

> This file is automatically read by Claude Code at the start of each session.
> It contains project-specific instructions, guidelines, and configuration.
> Adapted 2026-08-20 from the HR_ERP rules file: the working rules carry over
> verbatim; the HR_ERP project context was removed and replaced with SMP's.

---

## Steering Documents

SMP adopts the same steering system as HR_ERP. Read these:

1. **`CLAUDE.md`** (this file) — **how to work**: conventions, house rules, the standing
   facts about the stack, and one-line warnings. It carries no decision histories. *(exists)*
2. **`SMP-Project-Folder/DECISIONS-AND-LOGIC-vX.Y.md`** — **what was decided and why**:
   every §, every reversal, every measurement, in full. The rebuild contract, and where a
   finished piece of work is written up. *(exists)*
3. **`PROJECT_DETAILS.md`** — technical reference: stack, schema, modules. *(not created; `db/schema.sql` and the decisions log carry this today)*
4. **`IMPLEMENTATION_PLAN.md`** — phases and scope. *(not created; the phase plan lives in `IMPLEMENTATION_PROGRESS.md`)*
5. **`IMPLEMENTATION_PROGRESS.md`** — **live tracker of built / in flight / next / waiting on Islam. This is how progress is reported — updated in the same commit as the work it describes.** *(exists)*
6. **`specs/`** — per-feature specifications via spec-kit. *(installed and in use)*

**When any steering file changes materially, update it in the same commit as the code.**
A drift between specs and code is a documentation bug — report it before silently realigning.

**THIS FILE IS LOADED IN FULL AT THE START OF EVERY SESSION, SO ITS SIZE IS A RUNNING
COST.** It reached 1.01 MB by accumulating a paragraph per merge and was cut to ~51 KB on
2026-09-08 (§313). Write new work up in the decisions log; change this file only when a
working RULE changes.

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

#### The long-form lessons live in the decisions log
The §-numbered essays that used to sit here (§158 the yielding floor, §267 the
squeezed prose columns, §302 the centred box, §53.7 the pinned filler, §53.5 both
sides of the switch) are in **`SMP-Project-Folder/DECISIONS-AND-LOGIC-vX.Y.md`**,
in full. One-line warnings are under **Traps that bite** below; read the § section
itself before changing anything it covers.

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
- **Screen preferences live in `localStorage`, never in the state graph**
  (§25, §47.1): the theme, the People page's visible columns
  (`smp.people.columns`), the Setup rail's collapsed state (`smp.setup.rail`).
  A saved map is always **merged** with the current defaults, never
  substituted — a key added later is absent from a map written before it
  existed, and reading absent as `false` hides every new thing from everyone
  who ever touched the control (§30.2).
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

### Traps that bite

Short warnings only. **The reasoning, the measurements and the reversals for every
§ below are in `SMP-Project-Folder/DECISIONS-AND-LOGIC-vX.Y.md`** — read the section
before changing anything it covers.

**Layout and CSS**
- **§158 — a floor cannot yield.** `table{min-width:620px}` is a FLOOR: a pane narrower
  than it CUTS the table rather than shrinking it. Tables must FIT, never "and it
  scrolls". `.pane` includes Setup — scope with `:not(.setuppane)`.
- **§267 — a control does not shrink.** With the pen open most plan columns hold
  controls, so every pixel a narrower window loses comes off the prose columns. Read
  mode never shows it, which is why width sweeps walk tables CLOSED and miss it.
- **§53.7 — a pinned header's `::before` filler paints when it is NOT pinned too.** CSS
  cannot ask whether a sticky element is pinned. Measure in PIXELS: `elementFromPoint`
  cannot see a `::before` or a box-shadow (§294.1).
- **§302 — a box can be centred and the drawing inside it not be.** The eye reads the
  INK, not the box, so every box-measuring assertion passes on the build somebody
  reported. Measure an alpha-weighted centroid off the painted pixels at 8× (§185).
- **§29.2 / §51.5 / §53.6 / §88 / §287 — a rule declared TWICE in one file.** The later
  wins on source order, so editing the first does nothing. Recorded five times.
- **§93.11 — when a declaration provably matches and provably does nothing, suspect the
  parser.** Ask `document.styleSheets` what the browser actually holds; a stray `*/` or
  prose left in a stylesheet eats the whole block.
- **§38.4 / §38.5 — a colour that works as a FILL fails as TYPE.** `--gold-deep` on
  `--surface-2` is 4.45:1. A surface with its own ground needs its own ink. Eighth time.
- **§122.5 — a cap made of a guessed constant goes stale silently.** Measure it; never
  hardcode a number that tracks somebody else's layout.
- **§65.9 — a class name is one global namespace.** A one-word modifier collides with a
  one-word component and wears its rules.
- **§37 — `table-layout:fixed` takes every column width from the FIRST row.**

**JavaScript**
- **§56.7 / §147.4 / §281 — two `var`s of one name in one scope merge with no conflict,
  and a function declaration hoists over its twin.** Valid on both sides, silent, past
  `node --check`. After any merge, grep the result for its own declarations.
- **§30.1 — a repaint asked for while the mouse is down destroys the control mid-click.**
- **§71.2 — a bound field writes without repainting.** Never repaint under a typing hand.
- **§29.5 — whoever rewrites the DOM re-wires it, in the same function.**
- **§47.2 — a menu's action fires BEFORE the menu closes.** Dispatch first, then close.
- **§24 — delete an element and delete its CSS with it**, and delete a NAMED function,
  never a line range (§214 sliced a range and took a live function with it).
- **§104.10 / §35 — `Number("")` is 0 and finite; whitespace is truthy; `all([])` is
  true; an empty array is truthy. Absent is never zero.**
- **§50.6 — a reader must never create the field it looked for**, and a cleared value
  DELETES its key rather than storing a null.
- **§104.7 — take the type from the DEFAULT.** A list of exceptions is a list somebody
  forgets to add to.
- **§96 — a control drawn and wired to nothing renders perfectly** and discards every
  keystroke. Ask the DATA after pressing, never the screen.
- **§48 — address a row by its id, never by its position.**

**Server, database and deploy**
- **§42 — one rules module, both sides.** A screen that offers what the server refuses
  is drift, and it fails silently in the safe-looking direction.
- **§172 — a CHECK constraint is a copy of a rule in another file, and nothing compares
  them.** Widening a value list is a migration.
- **§113.7 — a migration reading a column `schema.sql` no longer creates is broken on
  every FRESH deployment and perfect on yours.** Run the round trip on a virgin
  database after every merge, not only after touching the schema.
- **§184 — a save is all or nothing**, so one unclassified row costs every fill in the
  same post.

**Checks and verification**
- **§94.2 — assert BOTH ENDS.** A check that only looks for something PRESENT cannot see
  a control that should not be drawn.
- **§94.5 — prove a check can FAIL before believing it green.** Setting a value to what
  it already is catches nothing.
- **§113.8 — a check asserting agreement passes when both sides vanish.**
- **§215 — a probe that DIES reports fewer failures than exist.** Every probe degrades
  rather than throws.
- **§51.11 / §274 — a check keyed on markup that moved does not fail, it passes
  quietly.** When a control changes shape, grep EVERY check for the old selector — and
  on BOTH sides of a merge, because a merge brings in checks written against the old world.
- **§100.3 — a stub that models less than the server reports a working build as broken.**
- **§54.5 / §298.3 — a check that cannot launch, or is killed by a timeout, reports 0
  failures.** Read the TAIL of a run, never the count.
- **§105.6 — compare the built file's mtime with the dev-server's start time.** A fix
  tested against the wrong bytes looks exactly like a fix that does not work.
- **§94.8 — assert the AGREEMENT or the relationship, never a literal number** — a check
  written against the problem survives somebody changing their mind.
- **§214.3 / §218 — a check holding a literal a decision moved is REWRITTEN, never
  deleted and never loosened.**
- **§276 / §238 — falsify from the SOURCES.** Editing the built file silences the whole
  script block under the hashed CSP, so the check reports "cannot continue", not a failure.

**Product**
- **§53.5 / A15 — one question, one answer.** A business unit and a supporting function
  are the same product; walking both sides is not testing both sides — measure them and
  assert they AGREE.
- **§61 — a control with nothing behind it, or a state with no way out, is a trap.**
- **§45.2 / §15.1 — a feature that renders nothing looks like one that was never built.**
- **§124 — a status word is a claim.** Never let presence stand in for proof.

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
Every check names the § it guards; the reasoning is in the decisions log.
```bash
cd SMP-Project-Folder/src
python3 build.py                        # assembles strategy-management-platform.html (must be byte-identical to the shipped vX.Y file)
python3 qa.py                           # walks every page as every viewer, reports console errors (needs Playwright + Chromium)
python3 checks/deck-pdf.py              # the deck on paper (§296)
python3 checks/review-pptx.py           # the review deck as a PowerPoint (§311)
python3 checks/contingency.py           # the contingency files (§297)
python3 checks/import-page.py           # Import & archives, three tabs (§295)
python3 checks/project-row-type.py      # a project row's type is a picker and its direction opens (§292)
python3 checks/yn-in-progress.py        # a yes or a no that can be under way (§300)
python3 checks/report-blockers.py       # the reporting page says WHERE Submit is held (§279)
python3 checks/cycle-edit.py            # editing the cycle that is running (§261)
python3 checks/fold-caret.py            # the caret belongs to the disclosure (§287)
python3 checks/attention-dismiss.py     # every attention item can be ANSWERED, on the box it is about
python3 checks/people-dialog.py         # the register reads and the dialog writes: the queue, Add, and neat with every column on (§116, over HTTP)
python3 checks/register-header.py       # one line above the table and a dialog that fits the window — the HEADER's height, not .hright's (§122)
python3 checks/role-picker.py           # giving somebody a role: every control PRESSED, both ends asked, and the absences asserted (§110)
python3 checks/strategy-split.py        # the Strategy | Reporting halves
python3 checks/report-saves.py          # reporting REACHES THE STORED PLAN and schedules a save, on a unit, a capability function AND one…
python3 checks/report-note-wrap.py      # the reporting note is PROSE (§271)
python3 checks/project-dates.py         # a project's Start and End are PICKED as `Jul 26`, and the overrun warning reads them the platform's…
python3 checks/refusal-keeps-work.py    # a refusal costs the row it named and nothing else (§184)
python3 checks/submit-gate.py           # Submit is shut until the report is complete and the plan holds no gaps, with the reason on hover;…
python3 checks/objectives-table.py      # the objectives table with the monthly drawer in it (§278.3)
python3 checks/template-round-trip.py   # the template carries what the platform holds (§294)
python3 checks/monthly-plan.py          # a target with a shape of its own (§278)
python3 checks/tactic-proration.py      # a tactic's OUTCOME is measured against its own window, not the year (§250)
python3 checks/unit-follows.py          # a reported figure follows the target's unit (§277)
python3 checks/count-compile.py         # a count is owed in whole ones (§276)
python3 checks/measure-score-spread.py  # a summary is made of the number it summarises (§257)
python3 checks/ytd-proration.py         # YTD is measured against the part of the year that has PASSED (§239)
python3 checks/project-done.py          # a project owner reports, and the bar stops saying View only (§301)
python3 checks/capability-first.py      # theirs is the capability that leads (§310)
python3 checks/deck-figures.py          # a figure is read against what it is measured by (§254)
python3 checks/master-presentation.py   # one flow, several decks, back to back (§261)
python3 checks/deck-strip.py            # one deck's strip is labelled and its pills grouped (§266.12)
python3 checks/master-picker.py         # the picker is two tables, searched, and dragged by its own numbers (§266.10)
python3 checks/deck-dividers.py         # the group's mark and the deck's four blue section dividers (§259)
python3 checks/deck-blank-slides.py     # a table with no rows is not a slide (§253)
python3 checks/one-line-titles.py       # a title is one line and the box says so (§255)
python3 checks/video-slides.py          # a video in the review (§261)
python3 checks/deck-outcome.py          # the presentation reads what was reported (§252)
python3 checks/reported-note.py         # a reported note is NAMED as one (§255)
python3 checks/setup-arrange.py         # the Setup tables are arranged and their rows act from one menu (§261)
python3 checks/empty-not-missing.py     # empty is not missing (§272)
python3 checks/fn-perf-controls.py      # a supporting function's Performance controls sit where a unit's do (§275)
node scripts/test-chat-chase.js         # the platform collects, then sends one email (§293)
python3 checks/gap-walk.py              # the band's chips and Next gap actually go somewhere
python3 checks/viewer-line.py           # the Viewing-as line
python3 checks/viewas-fresh.py          # a view-as session starts where their session would start (§237)
python3 checks/milestone-fill.py        # a milestone is filled, and a bounded role fills only its own (§177)
python3 checks/unit-before-number.py    # the unit is picked BEFORE the number (§251)
python3 checks/gap-fill.py              # fill the gaps (§145)
python3 checks/owner-picker.py          # an owner is picked from the register, not typed
python3 checks/rail-standard.py         # one item still gets the rail, on a unit AND a function — it MAKES the one-pillar unit, the demo has none (§130.2)
python3 checks/band-corner.py           # the pinned title's corners, measured in PIXELS because a DOM probe calls the broken build clean (§130.3, §53.7)
python3 checks/no-jump.py               # nothing moves the register under you — the act of OPENING a row included, since §110.7
python3 checks/plan-edit-line.py        # the strategy pen is ON the section line (§268)
python3 checks/plan-builder.py          # building a plan ON the platform
python3 checks/project-custodian.py     # a custodian per project (§147)
python3 checks/access-header.py         # the matrix header
python3 checks/stay-put.py              # a refresh stays where you are, and a NEW session still opens where §94.6 says (§173)
python3 checks/history-page.py          # History (§262)
node scripts/test-history-read.js       # ...and the server half on a real Postgres
python3 checks/safety-banners.py        # the page warns BEFORE a save can be lost (§258)
node scripts/test-safety-peek.js        # ...and the server half against a real Postgres
node scripts/test-session-state.js      # nothing session-level on the pooled connection (§289.2)
node scripts/test-cold-starts.js        # two cold starts, one new migration, a POOLED connection (§289)
python3 checks/save-said.py             # a save that FAILS says so on the page
python3 checks/setup-sticky.py          # a Setup page that FITS does not scroll, and nothing pinned ends up behind the chrome — over HTTP…
python3 checks/scoring-bands.py         # the scale is the tenant's
python3 checks/perf-line.py             # the Performance line
python3 checks/squeezed-rail.py         # below 820 the rail reads ACROSS on both sides, and the demo banner's invented-content line is gone (§162)
python3 checks/table-fit.py             # the plan tables FIT the pane at every width — never "and it scrolls" — on a unit AND a function,…
python3 checks/plan-tail-fold.py        # the plan table at a narrower window (§267)
python3 checks/email-link.py            # the link that LEAVES, read out of the html posted to /api/mail — never the value in the box, which…
node scripts/test-push.js               # a box with no tab open (§231)
python3 checks/setup-squeezed.py        # the Setup page is not a unit's plan page (§296)
python3 checks/office-ask.py            # Waiting and Ask, and the list the questions fill (§299)
node scripts/test-ask.js                # ...and the server half on a real Postgres with a stand-in for the model (§100.3)
python3 checks/corner-reply-box.py      # no composer over a list of people, and a test that says what it cannot see (§298)
python3 checks/chat-settings-scroll.py  # the settings panel scrolls inside itself (§294)
python3 checks/office-chat.py           # the chat's client half — serves the built file over HTTP, because the whole feature is invisible over file:// (§97.9)
python3 checks/welcome.py               # the welcome screen (§148)
python3 checks/home-mark.py             # the home mark
python3 checks/setup-rail.py            # the Setup rail fits the window, every entry is reachable by scrolling the LIST, and the cap does…
python3 checks/cycle-board.py           # every subject that reports has a row, the functions are in ONE list under one band, and the…
python3 checks/hide-slide.py            # the office hides a slide and the projector skips it (§256)
python3 checks/video-keys.py            # the keyboard belongs to the presentation (§297)
python3 checks/present-loop.py          # play from the editor, and come back to it (§295)
python3 checks/deck-fullscreen.py       # fullscreen is the slide, the arrows and nothing else (§265)
python3 checks/notes-slide.py           # the notes slide appears when somebody wrote a note — and whitespace is not a note, on all three deck shapes (§246)
python3 checks/setup-overview.py        # the Overview agrees with the pages it summarises; it MAKES the state, because the demo tenant is…
python3 checks/setup-overview-live.py   # ...and its three server-backed rows, over HTTP, where they exist at all (§101.12)
python3 checks/setup-search.py          # the rail's search
python3 checks/setup-header.py          # the page's controls share its pinned line, the counts and the SMO pill are gone, the matrix's two…
python3 checks/send-overview.py         # Send an email opens on the record, writing is the second subtab, and a send LANDS back on the…
python3 checks/email-greeting.py        # the greeting row is ONE line with no prose, the switch does not move, and what the page POSTS names…
python3 checks/setup-pages.py           # every Setup page is named ONCE and in the rail's own word, and the name and the table head stay on screen (§121)
python3 checks/save-fidelity.py         # WHAT THE SCREEN HOLDS IS WHAT THE SERVER HOLDS (§210)
node scripts/test-graph-diff.js         # the change list on its own
python3 checks/enter-commits.py         # Enter commits a growing one-line box instead of inserting a newline, and a rows-2 area keeps its…
python3 checks/fn-ko-edit.py            # a function's objectives are written at the page's width (§226)
python3 checks/fn-pillars.py            # the two supporting-function formats draw ONE Overview
python3 checks/knowledge-base.py        # the page and db/kb.json draw from ONE source — the AGREEMENT, never the count (§103)
python3 checks/kb-file.py               # the questions file (§161)
node scripts/test-kb-audience.js        # who sees which answer (§160)
```
A video slide needs no migration, and the clip endpoint's refusals — both
against a throwaway Postgres (the second starts its own dev-server, and sets a
NONSENSE store token on purpose, or every guard behind the store check goes
unexercised):
`DATABASE_URL=… node scripts/test-video-roundtrip.js` (§261.1)
`DATABASE_URL=… node scripts/test-video-endpoint.js` (§261.5 — the file that found
the truthy `"none"`)

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

## Where the decisions are

**This file is how to work. `SMP-Project-Folder/DECISIONS-AND-LOGIC-vX.Y.md` is what was
decided and why** — every §, every reversal, every measurement, in full and in order.
It is the rebuild contract (Principle II: reversals are recorded, never overwritten).

Until 2026-09-08 this file also carried a prose summary of every § section and a running
release trailer. Both were a second copy of the log — 1.01 MB, loaded into every session
before a word was typed — so they were removed (§313). Nothing was lost: every § named
here has a fuller entry in the log, and the previous file is in git.

**When you finish a piece of work, write it up in the decisions log — not here.**
This file changes only when a working RULE changes.
