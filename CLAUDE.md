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
- **DB verification loop:** start a throwaway Postgres 16, then
  `DATABASE_URL=... node scripts/test-roundtrip.js` (clean slate PASS, round trip PASS,
  fixed point PASS) and `DATABASE_URL=... node scripts/dev-server.js` + drive the platform
  in a browser, in **both** live and demo mode.
- **On each version bump:** update the gate's link in `index.html`, regenerate
  `db/seed-state.json`, and re-run the round-trip test.

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

*Last Updated: 2026-08-20 — v2.9: the chrome is two lines. The header
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
