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
- **Identity (since v2.1, §19):** the gate is a real login (person key + password,
  scrypt-hashed, httpOnly session); `/api/state` requires a session; a signed-in person
  sees their own view; the SMO issues temporary passwords from Levels & access (forced
  change on first sign-in; sign-in: `SMO` / `1234`, no forced change — §19.4). Enforcement is at the
  door — per-action authorization and the change log are Phase 2 (§19.2).
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
  Run `node scripts/test-authorize.js` after touching either file.
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

*Last Updated: 2026-08-21 — v3.12 (in progress): THE SERVER DECIDES WHO MAY
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
