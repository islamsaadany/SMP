# Claude Code Instructions for SMP

> This file is automatically read by Claude Code at the start of each session.
> It contains project-specific instructions, guidelines, and configuration.
> Adapted 2026-08-20 from the HR_ERP rules file: the working rules carry over
> verbatim; the HR_ERP project context was removed and replaced with SMP's.

---

## Steering Documents

SMP adopts the same steering system as HR_ERP — but only `CLAUDE.md` exists so far.
As the project's scope is defined, the companion files are created and become mandatory reading:

1. **`CLAUDE.md`** (this file) — how to work, conventions, house rules. *(exists)*
2. **`PROJECT_DETAILS.md`** — technical reference: stack, schema, modules, settled decisions. *(create when the stack is decided)*
3. **`IMPLEMENTATION_PLAN.md`** — phases, scope, and the decisions log. *(create when scope is defined)*
4. **`IMPLEMENTATION_PROGRESS.md`** — live tracker of built / in-progress / next. *(create with the plan)*
5. **`specs/`** — per-feature specifications via spec-kit. *(adopt when feature work starts; spec-kit is not installed in this repo yet)*

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
- **MOCKUP-FIRST (NON-NEGOTIABLE): never adjust a design — layout, structure, section order, styling, or any visual element — without first showing the user a static HTML mockup of the proposed look and getting explicit sign-off on that HTML view.** Build the mockup (self-contained HTML, navy/gold palette, saved under `design-mockups/<feature>/<YYYY-MM-DD>_<desc>.html` and published as an Artifact for review), wait for approval, and only then touch the real components. No "I'll just build it and you review at the end" for visual/structural changes.
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
**SMP** is a new project at its very beginning. Its full scope, purpose, and target users are
**still to be defined with the user** — do not invent or assume them. What exists today:

- A **starting page** (`index.html`): a self-contained navy/gold access gate with exactly **one
  access — `AdminSMO`** (password `4123`) — that unlocks a placeholder home card where the SMP
  modules will appear. The session persists per tab via `sessionStorage`, with sign-out.
- The password check is **client-side and visible in the page source** — a simple gate, not
  security. It must be replaced with a server-side check before SMP handles anything sensitive.

### Technology Stack
**Not decided yet.** Currently plain static HTML/CSS/JS with no build step, no `package.json`,
no framework, no database, no deployment target. When a stack is chosen, record it here and in
`PROJECT_DETAILS.md` (the HR_ERP house stack — Next.js + TypeScript + Prisma/Postgres + Tailwind
on Vercel — is the natural default, but it is a decision to align on, not an assumption).

### Repository
- **GitHub:** `islamsaadany/SMP`
- **Production URL:** none yet.

### Current Directory Layout
```
SMP/
  CLAUDE.md          # this file — the only steering file so far
  README.md
  index.html         # access gate + starting page (AdminSMO)
  ui-versions/       # UI snapshots before edits (created on first UI edit)
```

---

## Configuration

- **Env vars:** none yet. Record every variable here as it is introduced.
- **Database:** none yet. When one arrives, migrations are Claude's job, not the user's —
  never ask the user to paste SQL or a `DATABASE_URL` into chat.

### Build Commands
```bash
# No build step yet — open index.html directly in a browser.
# When a Node/TS stack lands, record dev/build/lint/typecheck commands here.
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
2. Once they exist: update **`PROJECT_DETAILS.md`**, **`IMPLEMENTATION_PROGRESS.md`**,
   **`IMPLEMENTATION_PLAN.md`**, and the relevant **`specs/`** feature spec in the same way
   the HR_ERP process requires.

---

*Last Updated: 2026-08-20 (Adapted from the HR_ERP rules file for SMP: working rules kept verbatim; HR_ERP project context, benefits/HR patterns, Neon/env configuration, and spec-kit installation notes removed or parked until SMP's scope and stack are defined.)*
