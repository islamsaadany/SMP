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
- **Describe the change in words and get approval before making it** — what moves, what it replaces, what it costs. *(Superseded 2026-08-20: this used to demand a static HTML mockup before any visual change. That belonged to the prototype era and is retired — the approval it protected is not. `design-mockups/` is no longer produced; `SMP-Project-Folder/mockups/` stays as the historical record of what was settled and what was rejected.)*
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
- **Where people say they work (since v3.21, §56):** the first sign-in asks,
  and the answer is a **declaration that grants nothing** — the BU that decides
  access stays the SMO's, who sees *"They said X — Use it"* under the BU on the
  register and accepts through `attachPersonAt()`, the same one door. Stored in
  `bu_declarations`, OUTSIDE the state graph and with **no foreign key**: a save
  TRUNCATEs the thirty tables CASCADE, so a column on `people` would be erased
  and an FK would take the whole table with it. The list of choices is built and
  re-validated on the SERVER, and nothing about the question may block a
  sign-in — the password is set before it is asked.
- **A clean merge can still collide in a shared scope (§56.6):** two branches
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
- **Deliverables and outcomes (one table since v3.21, §53.4):** a project's two
  kinds of evidence read as ONE table with a **Type** column, on all three
  project panes — while the SCORE still keeps them apart, half per SIDE
  (`projPerf`). Reading them together and scoring them together are different
  questions. A deliverable has **no due and no owner**: it is delivered when the
  project ends, and the project's owner owns it. `delivDue()` no longer exists —
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
```

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

*Last Updated: 2026-08-23 &mdash; **v3.21: a unit and a function are the same
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
a max-height never may** (§28.3, the v2.8 loop); Manage is a gear with the word
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
