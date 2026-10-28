# Processes module — reference as it stands on 2026-10-28

**What this is.** A complete description of SMP's Processes module (the FFProcess
port) as built on `main` and the branches merged into it up to 2026-10-28:
every page, every feature, every rule, every table, and how the pieces read each
other. It is written to be the record of the *old* module before it is changed,
so that anything that moves can be checked against what was there.

**How to read it.** Sections 1–3 say where the module came from and where it
lives. Sections 4–17 walk the product, page by page, with the rules each page
obeys. Sections 18–22 are the engineering: tables, migrations, pure rules,
loaders, checks, deploy. Section 23 is the **correlation map**: for each thing
that can change, who reads it. Section 24 lists what is open, parked or
deliberately not built. Section 25 is the timeline of every recorded change.

Paths are relative to `smp-app/` unless written in full. Section numbers in the
form §NNN refer to `IMPLEMENTATION_PROGRESS.md` and
`SMP-Project-Folder/DECISIONS-AND-LOGIC-v3.22.md`.

A clickable mockup of the whole module on invented data sits beside this file's
record at `design-mockups/processes-module/2026-10-28_whole-module-walkthrough.html`.

---

## 1. Origin and the decisions that shape it

- **Spec 065** (`specs/065-processes/spec.md`, §459, 2026-10-01). Islam: *"we need
  to bring this Process module with all its data and design even to the SMP"*,
  then *"A, keep its design, smp client register, office only, RHI"*. So:
  - **A** — FFProcess (github.com/ahmedgalal-lang/FFProcess) is ported into SMP's
    own Next.js app, not linked out.
  - **Keep its design** — FFProcess's own pages and look (slate, indigo accents,
    its own side rail) under SMP's top bar.
  - **SMP client register** — the people in Processes come from the client's
    People register. *The register is the store* (§53.5).
  - **Office only** — the Super user and the SMO team; a client's own people are
    refused at the door. Later (§540–§545) one area opened to client staff: the
    reading page.
  - **RHI** — the old FFProcess data belongs to the RHI client, carried once by
    script.
- **Spec 046 (modules)** had earlier framed Processes as *"a bank of processes
  that they can search and look up how things go"*, Forefront-only authoring,
  "a bank, for now" (room kept for an owner and a next-review date, drawn by
  nothing). The port superseded that: Processes is now a full workspace with
  authoring, a lifecycle and a reading page.
- **One workspace per client**, its id the client's key, its tables in their
  own Postgres schema `ffprocess`.
- **The seat decides, not FFProcess's own membership.** `super`/`smoteam` act as
  the workspace's ADMIN; everybody else is refused by `OFFICE_ONLY` in
  `lib/access.ts`. FFProcess's `members` table is no longer consulted.
- **Mockup-first.** Every visual change since the port was drawn first under
  `design-mockups/` (list in section 26).
- **Lifecycle decisions (§539, 2026-10-18):** Governance sits in the side rail,
  not as a top tab; the reader view opens to client staff read-only, approved or
  published versions only, with Acknowledge; existing processes that already
  named an approver start Published with a baseline version 1, the rest Draft;
  the review interval is 12 months from publishing, changeable per process; the
  approver is chosen from the People register, must have an email and a role
  there, and cannot be the person who sent the process for review.
- **Approval moved to the reading page (§545, 2026-10-19).** Found by driving it
  for real: the approver is a client person, so approving on the office-only
  Lifecycle tab meant nobody could ever approve. The approver now approves from
  `/processes/read`; the office cannot approve for them. Reading and approving
  are counted together on the staff bar.
- **Nothing from the AI reaches the client (§543–§544).** Proposed steps and
  review notes are drawn only on office pages; a test scans every client-facing
  file for the AI's markers. "Replace step" asks the person for the words.
- **Priorities (§595–§610).** After mapping the high-level processes, the office
  scores importance, complexity and risk, ranks, plans waves against capacity,
  and sends one page to a named client approver. Suggestions are office-only and
  never printed.

## 2. Where it lives (code map)

| Path | What |
|---|---|
| `app/(ffp)/[slug]/processes/layout.tsx` | The Processes frame: SMP's top bar, locale and direction, the register sync awaited |
| `app/(ffp)/[slug]/processes/(shell)/…` | The office workspace: side rail and the eight pages |
| `app/(ffp)/[slug]/processes/reports/…` | The Export Report preview, the SOP, the printed map, the priorities one-pager (office only) |
| `app/(ffp)/[slug]/processes/read/…` | The staff reading page (client people and the office) |
| `ffp/lib/domain/*` | Pure rules (no database, dates passed in) — section 19 |
| `ffp/lib/data/*` | Loaders — section 20 |
| `ffp/lib/actions/*` | Server actions (process, steps, lifecycle, RACI, authority, quality, priorities, governance, org) |
| `ffp/lib/auth/*` | `config.ts` (`auth()`), `workspace.ts` (`officeSeat`, `requireWorkspaceAccess`, `readerSeat`, `requireFirmOwner`), `require-office.ts` (`requireOffice`) |
| `ffp/lib/register-sync.ts` | The People register mirrored into the Org Directory |
| `ffp/lib/reports/load-report-data.ts` | One loader for the report, PDF and PPTX |
| `ffp/lib/i18n/*` | English and Arabic messages, RTL |
| `ffp/prisma/schema.prisma`, `ffp/prisma/migrations/*` | The `ffprocess` schema — section 18 |
| `db/apply-ffp.mjs` | Applies the migrations at deploy |
| `scripts/carry-ffprocess.mjs` | Copies one old FFProcess workspace into a client, once |
| `checks/processes-e2e.mjs`, `tests/processes-gate.mjs`, `tests/no-ai-in-client-output.mjs` | The guards — section 21 |
| `lib/access.ts` (`OFFICE_ONLY`), `lib/modules.ts` (`MODULE_DEF.processes`, `appRoute: true`) | How SMP admits and routes the module |
| `lib/bar-extras.ts`, `lib/topbar.ts`, `lib/shell.ts`, `shell/route.js mountProcessesLink` | The staff "Processes · N to read" link |

The module is switched on per client from the client's card in the office
console (the modules table of spec 046); `MODULE_DEF.processes` says
`appRoute: true`, so the module table has no server of its own for it.

## 3. The workspace

- One `Workspace` row per client, `id` = the SMP tenant key, upserted by
  `officeSeat` the first time an office person opens the module.
- It carries the profile (industry, description, governance company size and
  jurisdiction), the branding (logo as a data URL, primary, secondary and
  tertiary accent colours — the page header strip is drawn in the accent) and
  the export settings (`reportArrangement`, `reportMapLayout` FLOW or ROLES).
- The **Dashboard** page (`(shell)/page.tsx`) shows the workspace name,
  "Client engagement workspace overview.", the branding card ("Client logo &
  accent colors": Upload/Replace logo, Primary/Secondary/Tertiary, Remove), the
  profile card ("Industry / sector", "About this organization", Edit/Save/
  Cancel, empty states "No industry set" and "No background notes yet."), three
  stat cards (Processes · RACI drafts · Members) and the buttons "View
  processes →", "Org directory", "Export report".
- The industry on the profile is what the AI review says it reviews against
  ("Reviewed against {industry} norms").

## 4. Who may use it, and how they get in

### 4.1 The three areas and their gates
| Area | Route | Gate (first thing awaited) | Who passes |
|---|---|---|---|
| The frame | `app/(ffp)/[slug]/processes/layout.tsx` | SMP session (`currentUser`, else `/<slug>/sign-in`), `resolveTenant` (302 → its redirect, 403 → sign-in, else `/platform`), `processes` in `modulesFor(tenant.modules)` (else Strategy) | Anybody signed in at a client that has Processes on. The frame does **not** decide who sees which part. |
| The office workspace | `(shell)/layout.tsx` and every page under it | `requireOffice(slug)` then `requireWorkspaceAccess(slug,"VIEWER")` | The office only (`super`, `smoteam`) |
| Reports | `reports/layout.tsx` | `requireOffice` | The office only; no sidebar so the screen is what prints |
| The reading page | `read/layout.tsx` | `readerSeat(slug)`, `notFound()` on failure | The office, or a client person with a register key |

- `requireOffice` **redirects** a client person to `/<slug>/processes/read`
  rather than drawing a notice, because Next runs a page's code even when its
  layout declines to draw it and the page's data would ride along in the
  response (§545 found a 307 whose body held process names and steps). Every
  office page awaits `props.params` then `requireOffice` before it reads
  anything; `tests/processes-gate.mjs` fails if one does not. The older
  `officeOnlyNotice` no longer exists.
- `officeSeat(slug)` (React `cache`): a session plus `resolveTenant` with seat
  `super` or `smoteam`; it upserts the `Workspace {id: tenant.key, firmId:
  forefront, name}`. `requireWorkspaceAccess` hardcodes `accessLevel = "ADMIN"`,
  `accessVia = "MEMBER"` for an office seat and returns UNAUTHORIZED otherwise.
  So VIEWER and EDITOR never occur; FFProcess's `members` and `firm_members`
  are not consulted; the sidebar badges "★ Firm Owner access"
  (`OWNER_CARVEOUT`) and "View only" (`!canEdit`) can never appear today.
- `auth()` (`ffp/lib/auth/config.ts`) wraps SMP's `currentUser()`, answers only
  for `kind === "office"`, and upserts an `ffprocess.users` row by lowercased
  email; `ensureFirm()` upserts the single Firm `forefront`.
- `readerSeat(slug)`: SMP session plus `resolveTenant`; `office` is true for
  super/smoteam; otherwise `mayRead` (`process-reader.ts`) requires
  `userKind === "client"` and a non-blank `personKey` (a `tenant_users` row
  bound to a People-register row). It returns `{office, userId, email, name,
  personKey, tenantName}`. A client user with no person key gets a 404 on
  `/read`.
- **A client person's path**: they sign in as usual; the frame admits them; any
  office page redirects them to `/read`; they see published processes, and
  processes or the plan awaiting their approval, matched by
  `person.smpKey === personKey`. They never see the side rail, a draft, a
  risk, a finding or a suggestion.
- **SMP's own rule**: `lib/access.ts` has `OFFICE_ONLY = {"copilot",
  "processes"}`. `openableModules` filters it for anyone without an office
  seat, so client people are never offered Processes on the switcher or the
  landing. Note: `decideOpen` asks `openingArea(module)` first and
  `MODULE_DEF.processes` has `areas: []`, so `mayOpenModule` in the platform
  router never refuses Processes itself — the real gates are `requireOffice`
  and `readerSeat`.
- **Server actions** (`ffp/lib/actions/*.ts`, none inline in `app/`): nearly
  all gate with `requireWorkspaceAccess(id, "EDITOR")`. VIEWER:
  `reviewProcessWithAI`, `checkPackWithAI`, `validateRaciMatrixAction`. ADMIN:
  `approvePolicyDraft`, `publishPolicyDraft`, `retirePolicyDraft`,
  `updateWorkspaceProfile`, `updateWorkspaceBranding`. `readerSeat`:
  `acknowledgeProcess`, `approveProcess`, the client path of
  `returnProcessToDraft`, `approvePriorityPlan`, `returnPriorityPlan`.
  `requireFirmOwner` (SMP `isAdmin`): the organisation actions
  (`listAllWorkspaces`, `createWorkspace`, `deleteWorkspace`, `addFirmOwner`,
  `changeFirmMemberRole`, `removeFirmMember`) — nothing in `app/` calls them.
  `setLocale` has no gate.
- **API routes** (`app/api/ffp/…`, all GET, no middleware; each checks for
  itself): `export/process-map/[processId]` (PDF), `export/raci/[processId]?
  format=pdf|xlsx`, `export/authority/[processId]?format=pdf|xlsx`,
  `export/org-chart/[workspaceId]` (PDF), `export/report/[workspaceId]?ids=`
  (PPTX) — all "VIEWER", which is office-only in practice (a client person
  gets 401); `export/priorities/[workspaceId]` and `…/flagged-steps` (XLSX,
  `officeSeat`, 403 on refusal); `template/process-import/[workspaceId]`
  (EDITOR). PNG export is client-side only (`html-to-image` `toPng`).
- **Isolation** is the application's: there is no row-level security on the
  `ffprocess` schema. Every loader and action is scoped by `workspaceId`.

### 4.2 The staff link on the top bar (§542)
- `ffp/lib/data/process-reading.ts readingFor(workspaceId, personKey)` →
  `{published, waiting, approvals}`: `published` counts PUBLISHED non-archived
  processes; `waiting` those without a `process_acknowledgements` row for the
  latest published version (every published process, not only those the person
  is "expected" to acknowledge); `approvals` the IN_REVIEW processes naming the
  person as approver, plus 1 if the priority plan is SENT to them. It never
  throws (null on error, which draws no link).
- `offersReadingLink` (`process-reader.ts`): the client has Processes, the
  visitor is not office, `mayRead` holds.
- `lib/bar-extras.ts`: `withBarExtras` / `barExtras` (AsyncLocalStorage);
  `readingLink(r)` is null when nothing is published and nothing to approve,
  else `{label: "Processes", count}` with "N to read" and/or "M to approve"
  joined by " · ".
- Computed once per GET in `app/(platform)/[slug]/[...rest]/route.ts` for a
  person with a key. Drawn by three readers: `lib/topbar.ts` (the shared bar
  of Notes, Tracker, Portfolio, Insights: `<a class="tbread">` to
  `/<slug>/processes/read`, the count in `span.tbn`, `aria-current` inside
  Processes; consultants get the module menu instead); `lib/shell.ts` stamps
  `data-processes-read='{"label","count"}'` on `<html>` of the frozen Strategy
  document and `shell/route.js mountProcessesLink()` inserts `a.processes-read`
  before `#topacts` at boot and after every paint, removing it when the stamp
  is absent or the page is the console; and the Processes frame itself, which
  the platform router does not serve, calls `readingFor` and passes the result
  to `topBarHtml`.

### 4.3 The reading page (§540, §545; `read/*`)
- **`/read`**: "Processes" — "The approved way we work. Open one to read it
  and confirm you have." A section "Waiting for your approval" lists
  "Deep-dive priorities — which processes to take deep, and in what order —
  Open to approve" and any process IN_REVIEW naming this person ("Open to
  approve"). Then the PUBLISHED processes: "CODE · Name · vN" with "You have
  read this version" or "Needs your acknowledgement". Empty: "Nothing has
  been published yet."
- **`/read/[processId]`**: one PUBLISHED process, or an IN_REVIEW one for its
  named approver only. "← All processes"; "Version N · in force from DATE" or
  "For your approval · sent by X"; "What changed in this version"; "Purpose";
  "Covers" / "Does not cover"; "The steps" numbered, a "decision" tag, "Done
  by: Role" or "No role named", the action bullets. Nothing else from the
  process is shown: no risks, quality, findings, notes, scores.
- **Acknowledge bar** (sticky): "Confirm you have read and understood version
  N." + "I have read this" → "You have read version N. Thank you."; for the
  office "You are looking at this as the office…". One
  `process_acknowledgements` row per (process, version, person key); a new
  published version needs everybody again.
- **Approval bar**: "You are asked to approve this version." with Send back
  ("Why it is sent back", Send back / Cancel) and Approve. Approval is by the
  register key the door gave them, never by email; the sender can never
  approve; the office cannot approve for them.
- **`/read/priorities`**: the sent plan's snapshot, for the plan's named
  approver only, with "You are asked to approve this plan." (Send back /
  Approve).
- A draft is unreadable by address; office pages redirect; the exports
  refuse. All of it is driven for real by `check:processes`.

## 5. The Org Directory and the register

- **Page**: "Org Directory" — "Roles and people are shared across every process
  map, RACI matrix, and authority matrix in this workspace." Action "View Org
  Chart →".
- **Roles** (`roles`): per workspace, archived never deleted. Add form "New role"
  (placeholder "e.g. Controller"), "Add role"; rows Edit / Delete with the
  inline confirm "Delete? Yes". A role is what a step is assigned to, what a
  RACI column is, who an authority rule names, who owns a risk, a checklist
  item or a treatment action.
- **People** (`people`): Name · Email · Roles · Reports to · Actions. "Reports
  to" is an inline select with "— no manager —". Add form Name, Email, Role,
  Reports to; "Add person".
- **The register is the store** (`ffp/lib/register-sync.ts`, §459): every
  active person on the client's People register appears here, name and email
  following the register; a person retired or removed on the register is
  hidden here (archived), never deleted, so their RACI cells and steps stay; an
  old FFProcess person with no key is adopted once by a case-insensitive email
  match (§87: a name is never an identifier). The office's own rows do not
  appear. Roles and reporting lines are Processes' own. A linked person's name
  and email cannot be changed here ("From the Client register — change it
  there") and the server refuses it too; Delete is not offered. The sync runs
  once per request (React `cache()`), awaited by the layout and every page,
  because Next renders them at the same time (the first build lost the race and
  showed an empty directory).
- **Still allowed, recorded as Islam's call**: adding a person directly in
  Processes who is not on the register.
- **Org Chart** (`org/chart`): "Built from each person's manager in the Org
  Directory — set or change “Reports to” there." Top-down tree, each node the
  name and the role names in small uppercase; "← Org Directory", "Export PDF",
  "⬇ PNG". `org-chart.ts` refuses a manager cycle and lays the tree out.
- The manager links feed one more thing: the RACI **Suggest** button proposes
  the owner's manager's role as Accountable (§530).

## 6. Navigation

Side rail (`workspace-sidebar.tsx`, labels from `ffp/lib/i18n/messages/en.ts`
`nav.items`): **Dashboard · Org Directory · Processes · Priorities · Helicopter
View · Value Chain · Governance · Export Report**. Also "Workspace", the
client's logo and name, "★ Firm Owner access", "View only", the language
switcher (en/ar), and a hide/show toggle (collapsed state is component state,
not persisted). The rail is the office's; a client person never sees it.

Within a process, the **stepper** strip (`process-stepper.ts`,
`computeProcessStepper`) runs Process ("Created") → Process Map ("Add the first
step" / "N steps added") → RACI Matrix ("Map the steps first" / "Assign
responsibility per step" / "N activities assigned" / "Finalized") → Authority
Matrix ("Finalize RACI first" / "Set thresholds and approvers per task" / "N
tasks set") → AI Review ("Optional — run anytime"). Done steps show ✓ in green,
the current one is amber with a NEXT tag. The "Process" button goes to this
process's own page (§546); the process page carries the same strip; the Process
Map page (only — not RACI, Authority or AI Review) shows the seven tabs under
the strip with none marked.

Moving between Processes' own pages shows a grey skeleton at once (§620,
`loading.tsx`).

## 7. The Processes list

- Header "Processes" — "Every process has a unique code and can nest under a
  main process."
- Search "Search by name, code, category, or task…" matches name, code,
  category name, step label and activity name; results are flat, never folded.
- "Deleted processes (N)" link — "Deleting hides a process — it can be brought
  back." Deleting is soft (`archivedAt`); the deleted page lists them with
  Restore. `process-delete-impact.ts` summarises what a delete leaves behind.
- Columns: **Code · Process · Category · Steps · Depth · Priority · Status · RACI
  · Actions** ("Open →" first, then Edit, Clone, Archive). Sub-lines: "N
  sub-processes", "sub-process of X" (when the parent is not the row it folds
  under), "↰ branches from CODE · step N".
- **Folding (§508):** the list shows main processes; a +/− beside one opens its
  sub-processes one level at a time; Open all / Close all above the table.
  `orderProcessTree` orders depth-first to any depth (a process nested two
  levels down used to vanish); `fold-chains.ts` gives each row its ancestors so
  a row shows only while every ancestor is open.
- **Depth** is "Deep dive" when the priorities decision is Wave 1 or Wave 2,
  else "High-level"; **Priority** reads "Wave 1 · rank 3"; **Status** is the
  lifecycle word or "Review overdue"; **RACI** is Final or Draft.
- Below the table: the create form (name, code, category, parent), "Generate
  from a template", and the import panel (`process-import.ts`: a strict
  workbook format with `FORMAT_VERSION`, required sheets and `MAX_STEPS`;
  `checkTemplateIdentity` refuses a file that is not the template).
- **Codes** (`process-hierarchy.ts`): a top-level process takes a three-letter
  prefix from the first word of its name (padded with X, fallback PRC); a
  sub-process takes its parent's alphabetic prefix; the number is one past the
  highest for that prefix, starting at 100. A rename or re-parent re-prefixes
  generated-style codes and their descendants. Codes are unique per workspace,
  case-insensitive. Parent chains and branch chains are refused if they would
  cycle.

## 8. The process page and its seven tabs

Heading: breadcrumb "PARENTCODE · Parent name /", the name, an indigo code
chip, the status badge (lifecycle word or "Review overdue"), and when the
process goes deep an amber chip "Wave 1 · rank 2 · deep dive 3 of 6". Subline
"N step(s) · Open process map → · RACI → · AI review →", then the stepper, then
the tabs **Overview · Lifecycle · Risks & controls · Quality · People ·
Compliance · Connections** (`process-tabs.tsx`, `?tab=`).

### 8.1 Overview
Cards "Purpose" ("No purpose recorded yet."), "In scope" and "Out of scope"
side by side ("None recorded."), "Measures" (Metric / Target / Frequency, from
`kpis`).

### 8.2 Lifecycle (§539)
- A pill strip of the five statuses, the current one dark.
- **Draft**: "This is a draft. Pick who approves it and say what changed, then
  send it for review." Approver select ("Choose from the Client register…"),
  "Reviewers (optional)" checkboxes, "What changed", **Send for review**. A
  returned process shows "Sent back: …".
- **In review**: facts (Approver / Reviewers / Sent by / What changed),
  "Waiting for X to approve. They approve from their own reading page, so send
  them the link." + "Their reading page"; "Send back to draft" with "Why".
- **Approved**: "Approved. Publishing makes it the official version and starts
  the review clock." **Publish** / Send back.
- **Published**: "Review every [n] months" (1–60), **Retire**.
- Cards: "Next review" ("YYYY-MM-DD · in N day(s)" or "N day(s) overdue"),
  "Link for staff" with Copy link (§541), "Read and acknowledged · vN" ("X of Y
  have confirmed they have read it." + "Still to read: …"), "Approved versions"
  ("v2 · approved DATE by NAME (Role) · published DATE"), "Document control"
  (Version / Owner / Effective / Approved by, "Not recorded yet"), "Revision
  history".
- **Rules** (`process-lifecycle.ts`, `actions/process-lifecycle.ts`):
  - Moves: DRAFT —submit→ IN_REVIEW; IN_REVIEW —approve→ APPROVED or —return→
    DRAFT; APPROVED —publish→ PUBLISHED or —return→ DRAFT; PUBLISHED —retire→
    RETIRED; RETIRED is final.
  - Submit needs an EDITOR, an approver on the register with an email and a
    role, a change note, and an approver who is not the actor; at most 10
    reviewers, the approver excluded. The approver's name and role are
    snapshotted as they stood.
  - Approve: only the named approver (by register key, never by email alone)
    and never the submitter (`mayApprove`: NOT_THE_APPROVER / OWN_DRAFT);
    creates `ProcessVersion` number max+1 recording change note, submitter,
    approver and role.
  - Return needs a reason; from IN_REVIEW only the approver or the submitter;
    from APPROVED any EDITOR.
  - Publish writes the version into the SOP's own document control:
    `sopVersion` = "vN", `sopApprovedBy`, `sopEffectiveDate` = today, a row
    appended to `sopRevisions`; sets `nextReviewDue` = publish date + interval;
    stamps `version.publishedAt`.
  - **Editing something in force (APPROVED or PUBLISHED) sends it back to
    Draft** (`resetIfInForce`), called by `updateProcess`,
    `updateProcessScope`, `updateProcessKpis`, `updateProcessSop`,
    `addProcessStep`, `addProcessStepsBulk`, `updateProcessStep`,
    `deleteProcessStep` — and **not** by connection, hand-over, RACI,
    authority, milestone or reorder edits.
  - Overdue: only PUBLISHED with `nextReviewDue` before today.
  - Every move is a compare-and-set; a second mover gets CONFLICT.
  - Backfill: a process that already named `sopApprovedBy` became PUBLISHED
    with version 1 and a review a year out; the rest DRAFT.

### 8.3 Risks & controls (§538)
Tiles Risks recorded · Risks with no control · Steps with no control. Table
Risk · Step ("Whole process") · Level · Control (red "No control" when empty)
· Type · Last test ("Pass · date" / "Fail" / "Not tested") · Remove. Form "Add
a risk and its control": Risk, Step, Risk level (Low/Medium/High), Control,
Control type (Not set/Preventive/Detective/Corrective), Last test, Frequency,
Owner, Evidence. Table `process_controls`; levels and results are plain
strings. Server actions in `actions/process-quality.ts` check EDITOR and that
the process belongs to the workspace.

### 8.4 Quality (§538)
Tiles Open non-conformances · Closed · Failed control tests. List with a
status select (Open / In progress / Closed) and "Raised DATE · Action: … ·
owner". Form "Record a non-conformance": What went wrong, Detail, Corrective
action, Action owner. Table `process_non_conformances`.

### 8.5 People, Compliance, Connections
Dashed empty boxes today: "Who reads and acknowledges this process is not
recorded yet.", "Compliance coverage is not recorded yet for this process.",
"Connections to pillars, Tracker actions and systems are not recorded yet. The
step-level hand-overs live on the process map." The acknowledgement tally is
on the Lifecycle tab, not here. The mockups
(`design-mockups/processes-complete/`, `processes-space/`) drew these three
tabs full; only the shape was built.

## 9. The Process Map

Header: name, code chip, "N step(s) · Build RACI → · AI Review →", the
stepper, the seven tabs (none marked), "Export PDF".

### 9.1 Process Documentation card
"Feeds the Export Report’s Executive Summary and Involved Parties sections."
Fields: Process Purpose; In-Scope (one per line); Out-of-Scope; External
Entities (name + "One sentence on its role"). Empty: "Not documented yet — add
a Purpose, Scope, and External Entities for the Export Report."

### 9.2 SOP document control card (§510)
Version · Effective date · Owner · Approved by, a missing value as a "Missing"
pill; "Revision history" rows Version / Date / By / What changed, "+ Add a
revision" (hand-kept). Publishing (§539) writes these fields itself.

### 9.3 Steps
- Types: START, TASK, DECISION, END. Fields on a step: label, assigned role,
  swimlane role, supporting roles, order, position, phase and phase order
  (value chain), `raciSkipped`, `reviewNotes` (office-only), `milestone`,
  `joinRequiresAll`, `detailedAction[]` (the SOP "how", the report's "Detailed
  Action"), `exceptionHandling` ("Risk if Mishandled"), `sopInputs`,
  `sopOutput`, `sopErrors`, the step-priority fields (section 13.6).
- **Predecessors** are `step_connections` rows (same process only;
  `process-graph.ts` refuses CROSS_PROCESS_CONNECTION and UNKNOWN_STEP; cycles
  and rework loops are allowed). **Decision branches are the same table**: a
  labelled connection out of a DECISION step ("Yes" / "No" / an outcome label),
  reconciled by `decision-branches.ts` as delete / createToExisting /
  createNewStep. A step with several predecessors says "Needs both: A and B"
  when `joinRequiresAll`, and the feeders get "4a / 4b" labels
  (`parallel-step-numbering.ts`).
- **Hand-overs between processes (§521)** are their own table `step_handoffs`
  (from step, to step, optional label). One link is both things: a predecessor
  seen from the later step, "continues in IT-05 · step 3" seen from the
  earlier. `step-handoff.ts` refuses SAME_STEP, UNKNOWN_STEP, SAME_PROCESS,
  DUPLICATE and LOOP (counted across connections and hand-overs, so two
  processes cannot wait on each other). "Ready" means documented: steps have no
  done status, nothing blocks. Print, import and template do not carry them;
  the SOP does (§523).
- **Steps List** rows: ▲ number ▼, the type badge, the label, the role pill,
  "★ Milestone", the amber gap chip ("⚠ no accountable · no approver"; also no
  predecessor, two accountables, no responsible, an unfinished rule — from
  `step-readiness.ts`, which reuses the RACI and authority validators),
  "📄 Documented", the summary line ("Entry point — no predecessor" /
  "Connects from: A (Yes)" / "Needs both: A and B" / "Waits on a step in another
  process"), hand-over chips ("← FIN-02 · step 3 · Label", "→ continues in
  FIN-03 · step 1 · Label"), "AI Review note: …", "🔗 CODE — Name" (a
  `process_step_links` row), the star, the pencil, the trash with "Delete this
  step? Yes No". "↓↑ Arrange by flow" (`step-order.ts arrangeByFlow`: longest
  path, back edges ignored, ties keep their order).
- **Diagram**: swimlanes by role plus "Unassigned"; task cards show the role
  and "SLA 3d" or "no SLA set" and a gate line such as "More than $10,000";
  decisions are diamonds; Start and End are terminals; dashed amber hand-over
  nodes "Comes in from …" / "Continues in CODE" in the gutters (not draggable,
  not in lanes); "⬇ PNG". Layout and routing are `process-layout.ts` and
  `connector-routing.ts`.
- **Step edit form**: Step name; Type; Assigned role; "Requires all
  predecessors"; Detailed Action (one per line); Risk if Mishandled; Inputs,
  tools and systems (SOP); Expected output (SOP); Common errors and exceptions
  (SOP); Link to other process(es); the Predecessors editor ("Connects from",
  "Connector label", "+ Add predecessor"); the "Waits on a step in another
  process" editor (a select grouped by process code, "Label", "+ Add a step
  from another process"); for a decision the "Branches" editor ("leads to":
  not set / Create a new step / Link to an existing step, "+ Add another
  outcome"). Staged edits are reconciled on Save, deletes before creates.
- **Add step form**: Step name ("e.g. Confirm Delivery"), Type, Assigned role,
  Connects from, Connector label ("Yes / No"), Insert ("after the step it
  connects from" / "at the end of the list"), "+ Add Step"; "+ Add multiple
  steps at once" ("One step per line…", "Add N steps"). An empty process also
  offers the template form and "Draft it with AI" (§509).
- **Proposed steps from the AI review (§529)** appear as dashed rows
  "Proposed · from AI review", "After “X”", Confirm / Delete. Until confirmed it
  is a field on the finding, not a step: RACI, Authority, exports, numbering and
  the review context never see it.

## 10. The RACI Matrix

- Top bar "CODE · Name" with Export PDF, Export Excel, "AI Review →"; h1 "RACI
  Matrix"; the stepper.
- Toolbar: **Mark Final** (disabled while there are issues) or **Reopen**; badge
  DRAFT (amber) / FINAL (green); **Fill from step owners** ("Puts R for each
  step's assigned role…" — empty cells only, never over anything, never on
  skipped rows, filled cells carry a dot, §530); **Suggest** (dashed cells
  proposing the owner's manager's role as A on rows with no A; ✓ Accept / Edit /
  Dismiss; "Suggestions shown — nothing saved yet"); "+ Add title" (an existing
  title or a new one).
- Banner: green "Ready to finalize — every task has exactly one Accountable and
  at least one Responsible." or amber "N tasks missing an Accountable or
  Responsible — finalization blocked."
- Table: Task, one column per role title (`raciVisibleRoleIds` pins columns;
  `computeVisibleRoleIds`), Actions (Skip, Edit, Delete; a skipped row is
  struck through with "Skipped ✕"). Cells cycle R → A → C → I → clear.
- Rows (`raci-table.ts buildRaciTableRows`): one per `Activity`, or a single
  row for a step with no Activity; freestanding Activities appended. "New
  activity" ("e.g. Reconcile Statement") adds one.
- `raci-validation.ts`: MISSING_ACCOUNTABLE, MULTIPLE_ACCOUNTABLE,
  MISSING_RESPONSIBLE. `finalizeRaciMatrix` refuses while any issue exists;
  `reopenRaciMatrix` sets DRAFT. Status lives in `raci_matrix_statuses`.
- Legend: R Responsible · A Accountable · C Consulted · I Informed · "Filled
  from owner" (dot) · "Suggested" (dashed). Viewers see neither button.

## 11. The Authority Matrix

- h1 "Authority Matrix". "Each task carries as many rules as it needs. A rule
  turns on an amount of money or an elapsed time, and says what happens then —
  the task needs approval, or it escalates."
- Amber banner "N rules still need finishing…".
- Columns Task · Turns on · Value · Direction · Then. One
  `authority_assignments` row per task (by step or by activity, `skipped`),
  holding ordered `authority_rules`: measure MONEY (amount, Decimal 14,2) /
  TIME (days) / NONE; direction More than · At or above · Below · At or below ·
  "No rule at all" (GREATER_THAN, GREATER_OR_EQUAL, LESS_THAN, LESS_OR_EQUAL,
  EQUAL_NO_APPROVAL); consequence "Needs approval" / "Escalates"; who = a role
  or a person ("— nobody yet —").
- Row actions "+ Add another", "Skip" ("Skipped — no authority rules apply." +
  Unskip), "No rules yet.".
- `authority-table.ts validateAuthorityTable`: skips skipped and no-approval
  rows; MISSING_APPROVER when a row has no rules; INCOMPLETE_RULE_FIGURE /
  INCOMPLETE_RULE_WHO per rule. `deriveControlPoints` (report): a task with two
  or more approval rules is a Key Control Point. `gateLine` is the text on the
  map card. `deriveProcessOwnerRoleId`: the role most often Accountable, else
  the most frequent approver.

## 12. AI in the workspace

- **AI Review** page: "Reviews this process end to end — Process Map, RACI
  matrix, and Authority Matrix — against how this workflow is typically run in
  your industry — and highlights gaps and risks you can act on." Card "Reviewed
  against {industry} norms". **Run AI review** / "Run AI review again" with "N
  open · M integrated", a summary paragraph or "No gaps or risks found."
- A finding (`review_findings`): category GAP / RISK; area Process Map / RACI
  Matrix / Authority Matrix / General; severity high / medium / low (the card is
  tinted); status New / Edited / Integrated (OPEN, EDITED, INTEGRATED,
  DISMISSED); title, description, recommendation.
  `process-review.ts findStructuralGaps` adds MISSING_START, MISSING_END,
  ISOLATED_STEP, DECISION_SINGLE_BRANCH before the model is asked;
  `review-findings.ts` de-duplicates by normalised title and keeps dismissed
  ones out.
- Card actions: Edit; **Add as a step** (Step text, "Place it after", "Notes
  (optional)", "Add to process (proposed)" → "Proposed · waiting on the map,
  after “X”" with Withdraw; Confirm on the map makes the real step and the
  finding reads "✓ Added to the process as …"); **Merge as a note** (writes an
  office-only `reviewNotes` line on the step); **Replace a step** (§544: asks
  "What the step should say (this is what the report prints)", pre-filled with
  the AI's title, nothing written until Replace step, blank refused); Remove.
- **Draft with AI** (§509): the draft box takes notes and may use the org
  chart's roles (invented roles show amber); an empty process offers "Draft it
  with AI" on its map page.
- **Check these N end to end** on the Export page (§509): reads the ticked
  processes together, lists "N high · N medium · N low", a summary, "Across
  these processes", then per process "map · RACI · authority" links with
  finding cards or "Fine — nothing to flag." Saves nothing, never blocks the
  preview.
- **Governance**: "Generate assessment" / "Regenerate" per aspect, "Draft with
  AI" for a governing policy.
- With no key the check says plainly that it isn't configured. **Nothing the AI
  writes reaches a client**: `tests/no-ai-in-client-output.mjs` scans the
  client-readable files for `reviewNotes`, `proposed*`, `ReviewFinding`, "AI
  Review" and "from AI review". The one deliberate gap: "Replace step" writes
  the person's own text, which the report prints as any step.
- The AI does **not** propose content for the SOP's Missing fields (§609,
  awaiting Islam's word).

## 13. Priorities (§595–§610)

Header "Deep-dive priorities" — "N high-level processes. Which ones do we take
deep next: full steps, RACI, controls and an SOP?" Four step tabs: 1 Score
"Importance, complexity, risk" · 2 Rank "See them side by side" · 3 Plan
"Waves and progress" · 4 Sign-off "One page for the client". Links "Download
as Excel", "Download all steps (flagged marked)". When the plan is locked a
banner says so.

### 13.1 Score
- "What counts, and how much (agree this with the client first)": weights
  Importance to the business 35 · Risk if it goes wrong 40 · Complexity 25
  (integers 0–100, at least one above 0). "Deep dives the team can run at
  once" (capacity, default 4).
- Buttons: "Fill the empty complexity and risk from the map", "Suggest waves
  from the ranking", "Clear entries…" (pick kinds — importance, complexity,
  risk, why, decisions — and processes; draft plan only; ticks only what is
  shown).
- **Choose processes · N of M ▾** (§610): mains with their subs, searchable;
  ticking a main ticks its subs; Select all / None / Only unscored / Has
  flagged steps; remembered in the browser per client; a sub whose main is not
  chosen shows on its own. A strip: "N / M shown" · scored · steps flagged ·
  "X / 4 in Wave 1 (capacity)".
- Table: Rank · Process · Department (the category) · Importance · Complexity ·
  Risk (1–5 dots) · Score (out of 100) · Why (one line) · Decision (Wave 1 /
  Wave 2 / Later / Stays high-level / "Not decided"). Steady code order (§596);
  subs indented under their main with a "Main" tag; "Steps inside: N steps · N
  flagged · N noticed" opens every step in map order (§606).
- **Score formula** (`priorities.ts`):
  `round((wI·I + wR·R + wC·C) / (5·(wI+wR+wC)) · 100)`, null unless all three
  are set. **Rank**: score descending, ties to higher risk, then higher
  importance, then code; unscored last with no rank.
- **Suggestions (office-only, never printed)**: complexity from the map
  (points = steps + 2·decisions + 2·cross-process + roles; bands <6→1, <12→2,
  <20→3, <30→4, else 5; null with no steps); risk from the logged controls (≥2
  high → 5, 1 high → 4, any medium → 3, else 2; null when nothing is logged).
  `suggestDecisions`: the first `capacity` ranked go to Wave 1, the next
  `capacity` to Wave 2, the next 3 to Later, the rest Stays high-level.

### 13.2 Rank
Bubble chart "Importance across, risk up — bigger circle means more complex";
quadrants Start here / Risky, less central / Central, lower risk / Leave
high-level; a "Selected" panel (Importance / Risk / Complexity / Score, "Open
process →") and the "Ranked" list.

### 13.3 Plan
Banner "Team capacity: 4 deep dives at a time. Wave 1 holds N — fits." (or
"— too many…"). Four columns with an editable timing line each (Wave 1 "Start
now" · Wave 2 "Next" · Later "Review later" · Stays high-level "no deep dive
planned"; stored on the plan). A card: name, "CODE · Department", six bars,
"Deep dive X of 6 (!) · Open process →"; the "!" lists every aspect, its state
and what turns it green (§597). **Aspects** (`ASPECT_DEFS`, each with its help
text): Map (steps ≥ 3) · RACI (matrix FINAL) · Authority (at least one
assignment) · Controls (at least one control with text) · SOP (`sopVersion`
non-blank) · Approved (APPROVED or PUBLISHED). A process with flagged steps is
represented by those steps only (§607, `priority-units.ts planUnits`), each
"⚑ name · Step of … · Score N".

### 13.4 Sign-off
One page "Deep-dive priorities — Client": status Draft / Waiting for approval /
"Approved by X, date"; "From N high-level processes we propose to go deep on
M…"; the weight tiles; "Wave 1 — Start now · N items" and Wave 2 tables (rank,
name, department, why); "Later, or stays high-level"; two signature lines.
"Who signs for the client" + **Send to client for approval** (freezes a
snapshot; the sender can never approve); Withdraw / Reopen (needs a "Why",
kept in the record); "Export one page" (printed from the frozen snapshot;
scanned by the no-AI check); the "Record" history. Plan status DRAFT → SENT →
APPROVED (`priority_plans`); `planEditable` DRAFT only; `planCanSend` DRAFT
with at least one shortlisted item; `mayApprovePlan` is the same rule as
`mayApprove`. The approver approves from their reading page
(`read/priorities`, "You are asked to approve this plan.", Send back / Approve).

### 13.5 Where the marks show
The process list (Depth, Priority), the process page header chip, and the
Helicopter View (both modes: "Deep dive" label, gold ring on a card). A step's
score never changes its process's score; the list, page and helicopter follow
the process's own wave.

### 13.6 Steps inside a process (§601–§608)
The map notices a step when it has a high or medium risk control, a risk note,
a decision, a hand-over or link, three or more roles, six or more sub-tasks, or
a procedure of five lines or more (`stepSignals`). The office flags a step (⚑);
only a flagged step is scored, starting from map suggestions
(`suggestStepComplexity`: decision·2 + 2·hand-overs + roles + floor(subtasks/3),
bands <3, <5, <7, <10; `suggestStepRisk`); importance is always the office's.
A flagged step has its own wave ("With its process" by default). Un-flagging
asks first and clears the scores. **Make it a process** creates a draft
sub-process under the same main, branching from the step, carrying the step's
scores; the step stays as the link and reads "Now its own process". Flagged
steps show on plan cards ("Steps to watch") and on the Excel's second sheet;
nothing about steps goes into the client's sign-off page.

### 13.7 Downloads (office only)
"Download as Excel" (§598): one row per process in screen order with level,
code, name, main process, department, the three scores, score, rank, decision,
why, deep dive x of 6 and Yes/No per aspect; a second sheet with weights,
capacity, plan status and approver; a "Flagged steps" sheet with a Wave
column. "Download all steps (flagged marked)" (§608): one flat sheet, one row
per step of every process, with a Flagged Yes/No column, scores, wave, why,
what the map noticed, and whether it is now its own process. A client person
is refused.

## 14. Helicopter View

- "How {client}'s processes connect — N processes · N branches · N step links."
- Toggle "▤ Milestones" | "▭ Cards"; the picker "Processes: All (N) / N of M ▾"
  (§511: a searchable tick list, mains with subs, ticking a main ticks its subs
  with an indeterminate box, Select all / none; hides from the picture only;
  remembered per browser as the hidden ids so a new process shows by default;
  the PNG exports what is drawn; a shown process branching from a hidden one
  reads "↰ from CODE, hidden").
- **Milestones**: one rail per process (`milestone-rails.ts`): header code,
  name, "Deep dive", "N steps", "↰ from CODE · step N"; beads are the
  milestones plus junction steps ("label", "step N", "↳ CODE" / "🔗 CODE");
  "N milestones marked · steps another process depends on are always shown".
- **Cards** (`process-landscape.ts`, React Flow canvas): 210px card with code,
  "Deep dive", "N steps", name, "under PARENT", "↰ from CODE · step N"; a
  branch card has a dashed amber border, a deep-dive card an amber ring; "Drag
  to rearrange for an export; the layout isn't saved."; "⬇ PNG".
- Below: "Connections", each tagged "Branch" (amber, `branchFromStepId`) or
  "Step link" (indigo, `process_step_links`).

## 15. Value Chain

- "How work moves through {client}, phase by phase, across every process."
- Setup: "Add a phase" ("e.g. Initiation"); "Import from spreadsheet" (.xlsx
  with Phase and Step / Activity columns, "Preview", "Import N activities";
  `value-chain-import.ts`).
- Stats Activities · Phases · Departments. Search "Search activity, owner,
  support…", Owner filter ("All departments"), toggle "By Phase" / "By Owner"
  (`value-chain.ts groupByPhase / groupByOwner`, `UNPHASED_COLUMN`,
  `UNOWNED_COLUMN`).
- Board columns are `phases` (colour dot, NAME, count, +, ← →, Rename,
  Delete). A card is a **process step** placed in a phase (`phaseId`,
  `phaseOrder`): process code link, ★, ▲▼, Edit, title, description, owner
  ("No owner yet"), "Support: …" (supporting roles), "⚠ gaps", "🔗 CODE", a
  phase select. Add-activity form: Activity, On process, Owner.

## 16. Governance

Header "Governance, Controls & Metrics". Every section header carries an
"About …" guide with tabs Why it matters / How to fill it in / How to evaluate
it (`section-guides.ts`, also in Arabic). Sections top to bottom:

1. **Dashboard** "What needs attention" (`governance-dashboard.ts`): Open High /
   Medium / Low risks · Overdue treatment actions · Policies overdue for review
   · Aspects without a published governing policy · Checklist items done (of
   total) · Overdue checklist items.
2. **Review calendar** (§540): the "Staff reading page" link with Copy link;
   "Process review calendar" buckets Overdue · Next 30 days · 31 to 90 days ·
   Later, rows "date · CODE · Name · v1.2 · approved by X (Role)", each
   linking to its Lifecycle tab. Published processes only.
3. **Governance profile**: Company size (Early-stage startup / Growth-stage /
   Mid-market / Public corporation), Jurisdiction, Industry; "Save profile".
4. **Assessment**: "Evaluated against four pillars: Accountability ·
   Transparency & Fairness · Responsibility · Independence". Aspect tabs (the
   seven defaults Board Structure · Risk & Internal Controls · Ethics Policy ·
   Compensation · ESG · Data Integrity · Accessibility, "+ Add aspect";
   `governance_aspects`, custom since migration 20260927). Per aspect:
   "Generate assessment" / "Regenerate", "Last generated …"; "Governing policy
   — {aspect}" (one per aspect: Start from template, Draft with AI, Write one,
   Choose from library; `aspectPolicyState` NONE / NOT_PUBLISHED / PUBLISHED);
   "Executive summary — {aspect}" (hand-editable, `summaryHandEdited`);
   "Governance checklist" items with phase Immediate / Near-term / Long-term,
   "Owner: …", "Due …", "Overdue" (`checklist-due.ts`, UTC calendar day; DONE
   and DISMISSED never overdue), "Mark done", "Dismiss", "View draft policy →".
   Regenerating keeps hand-managed items (`governance-findings.ts`).
5. **Risk register**: "+ Add risk"; "Heat map — open risks by likelihood and
   impact" (rows High / Medium / Low, columns Low / Medium / High / Critical;
   closed risks excluded); table Risk · Likelihood · Impact · Level (derived:
   likelihood 1–3 × impact 1–4, ≥6 High, ≥3 Medium, else Low) · Owner · Status
   (Open / Mitigating / Accepted / Closed) · "Treatment". Treatment panel:
   "Current level: … target: …", strategy Mitigate / Transfer / Accept / Avoid
   / "Not decided", target likelihood and impact, Rationale, "Save treatment",
   "Treatment actions" with Owner, Due, Done/Overdue, "Add action".
6. **Policy library**: rows title, "Governs {aspect}" or "Added manually", "·
   updated DATE", "Needs review" (PUBLISHED past `reviewDueDate`). Drawer:
   Submit for review / Approve / Publish / Retire (DRAFT, IN_REVIEW, APPROVED,
   PUBLISHED, RETIRED), "Review due", "Show version history (n)" (one
   `GovernancePolicyVersion` per save), "Acknowledged by" / "Mark acknowledged"
   (per person). Templates in `policy-templates.ts` (English and Arabic).
7. **Activity**: "Show activity" toggle; entries typed Aspect / Assessment /
   Checklist item / Risk / Policy, each "by NAME"; "Load more" (50 a page,
   newest first; written inside the same transaction as the change).
8. **KPIs and controls**: "Key Control Points & KPIs, from each process's
   Authority Matrix"; per process "Key Control Points" and "Operational KPIs &
   SLAs" (Metric / Target / Frequency, "+ Add metric" — these are the process's
   `kpis`).

Governance is also the module's only append-only log; there is no general
audit table (section 18).

## 17. Export, the report, the SOP, the printed map

- **Export Report** page: "Pick which processes to include…". Table with a
  select-all box (§507: every process starts unticked; the box is
  indeterminate when some are ticked), Code · Process · Order (↑↓); "The report
  follows the order above…" (`process-order.ts applyPackOrder`; the arrangement
  is stored on the workspace, `report-arrangement.ts`). "Pack sections": Cover
  page (locked) · Org Structure · Helicopter View · Value Chain · Governance &
  Risk · Processes in This Report · Closing page. "Inside each process":
  Executive Summary (Process Purpose, Trigger & Output, Internal Roles,
  External Entities, Scope) · Process Map & Narrative (Workflow diagram, Step
  narrative) · RACI & Authority Matrix (RACI grid, Authority rules) ·
  Governance, Controls & Metrics (Key Control Points, Operational KPIs & SLAs).
  Buttons "Preview report →" (shut until one process is ticked, hover says
  why), "SOP →", "✨ Check these N end to end".
- **Report preview** (`reports/page.tsx`, `export-preview.tsx`): toolbar
  Spacing (Tight / Compact / Default / Roomy), Map layout (Flow / Roles),
  "One continuous page" (§522: on by default; the sheet is measured and printed
  as one page 297mm wide and as tall as the content; above Chrome's 200in it
  falls back to A4 pages), "Download PPTX", "Print / Save as PDF". Cover:
  eyebrow "Business Process Documentation & Procedure Standard", the company
  name, Document ID / Version 1.0 / Effective Date / Classification "Internal —
  Confidential" / Prepared By, "Contents — N processes" ("under X" /
  "top-level"). Body: Org Structure, Helicopter View, "{Company} Value Chain",
  Governance & Risk (assessment, risk register, governing policies, policy
  library), Processes in This Report, then per process a brand banner with the
  **real document control** (§547: Status, Version, Effective Date, Approved By
  from the SOP fields; Review Cycle "Every N months · next DATE" once published;
  Owner = `sopOwner` else the owning role; a dash where nothing was filled),
  Process Purpose, Trigger / Output, Internal Roles, External Entities, Scope,
  Workflow, step narrative ("Detailed Action", "Risk if Mishandled"), RACI grid
  with the authority rules, Key Control Points, Operational KPIs & SLAs; a
  closing "Thank you". **The PowerPoint still prints the old made-up document
  control** (left for the PowerPoint work).
- **SOP** (§510, §523; `sop.ts compileSop`, `reports/sop/`): toolbar "← Back to
  picker" (§609), "N SOPs · Company", "One continuous page", "Print / save as
  PDF". Per SOP: eyebrow "Company · Standard Operating Procedure", name + code,
  "N item(s) still Missing". Sections 1 Document control (Version / Effective
  date / Owner / Approved by) · 2 Purpose and scope (In / Out) · 3 Who is
  involved · 4 Procedure (Step and who · How + "Common errors:" · In / out ·
  Approval, hand-over — "→ IT-05 · step 3" and in amber "from IT-01 · step 7")
  · 5 Controls and KPIs ("metric — target X, frequency") · 6 Revision history.
  Anything not said is a red "Missing", never an invented value.
- **Printed map** (`reports/printed-map/`, `print-map-layout.ts`): Flow layout
  (one step per row) or Roles layout (a column per role, falling back to Flow
  above `MAX_ROLE_COLUMNS`); cards show the role ("No role set"), "SLA Nd" /
  "no SLA set", the gate line, "ends here".
- **Priorities one-pager** (`reports/priorities/`, `priorities-document.tsx`):
  the sign-off page from the frozen snapshot, "← Back to Priorities", printed
  on its own.

### 17.1 How the files are made
- Libraries: `@react-pdf/renderer` for the PDFs (authority, org chart, process
  map, RACI, in `ffp/lib/export/pdf/`), `exceljs` (`ffp/lib/export/xlsx.ts`,
  the two priorities workbooks, the import template), `pptxgenjs`
  (`ffp/lib/export/pptx/report-pptx.ts`), `html-to-image` for PNG.
- The picker GETs `/reports?ids=…` or `/reports/sop?ids=…`; it flags blocks
  that are empty across the whole pack (`isBlockEmpty`, `isSectionEmpty`).
- `reports/page.tsx` loads `loadReportData` and the stored arrangement and map
  layout; `export-preview.tsx` has the density and arrangement controls, the
  "One continuous page" box and "Download PPTX".
- "One continuous page" (report and SOP, on by default): on `beforeprint` the
  paper is held at 297mm (report) or 210mm (SOP), its height measured and
  divided by `pageZoom()`, a `@page { size: W H; margin: 0 }` style injected
  and page breaks relaxed; above Chrome's 200in limit it falls back to A4;
  `afterprint` restores the layout. Never verified in a real print dialog
  (headless cannot show it).
- The gate wording on map cards, the matrix, the deck and the sheet all come
  from one `gateLine`.
- The priorities one-pager is drawn from the frozen snapshot and holds no
  suggestions or notes; the two Excel workbooks (section 13.7) are office
  working files.

## 18. The data model (`ffp/prisma/schema.prisma`, schema `ffprocess`)

Tables are snake_case via `@@map`. The schema is `ffprocess` because `users`,
`sessions` and `people` already exist in SMP's `public`. The client is
generated into `ffp/generated/prisma`; the app connects through
`ffp/lib/db/client.ts` (PrismaPg, `schema: "ffprocess"`, lazy proxy).

### 18.1 Identity and the workspace
| Table | Fields that matter | Notes |
|---|---|---|
| `users` | `email` (unique), `passwordHash` | Upserted by `auth()` for office people; authored policy versions and log entries point here |
| `accounts`, `sessions`, `verification_tokens` | | Auth.js leftovers, unused by SMP's sign-in |
| `firms` | `name` | One row, `forefront` |
| `firm_members` | `firmId`, `userId` (unique), `role` OWNER/MEMBER | Vestigial |
| `workspaces` | `id` = client key; `firmId`, `name`, `currency` ("USD"), `industry`, `description`, `governanceCompanySize`, `governanceJurisdiction`; `logoDataUrl`, `accentColor`, `accentColorSecondary`, `accentColorTertiary`; `reportArrangement` Json, `reportMapLayout` FLOW/ROLES | One per client; no FK to SMP's `tenants` |
| `members` | `workspaceId`, `userId?`, `invitedEmail`, `accessLevel` VIEWER/EDITOR/ADMIN, `status` PENDING/ACTIVE/REMOVED, `inviteToken` | **No longer consulted**; the Dashboard's Members count still reads it |

### 18.2 Org
| Table | Fields | Notes |
|---|---|---|
| `roles` | `workspaceId`, `name`, `archivedAt` | Archived, never deleted. Read by steps (assigned, swimlane, supporting), RACI columns, authority rules, risk/checklist/action owners |
| `people` | `workspaceId`, `name`, `email`, `managerId` (self), `archivedAt`, `smpKey` (unique per workspace) | `smpKey` = the People-register row it mirrors |
| `person_roles` | (personId, roleId) | |

### 18.3 Process and steps
| Table | Fields | Notes |
|---|---|---|
| `process_categories` | `firmId`, `name` (unique together) | Firm-wide; the "Department" in Priorities |
| `processes` | `workspaceId`, `categoryId?`, `code` (unique per workspace), `name`, `description`, `parentProcessId` (self), `archivedAt` (soft delete), `raciVisibleRoleIds[]`, `branchFromStepId` (SetNull); documentation `processPurpose`, `inScope[]`, `outOfScope[]`, `externalEntities` Json `{name, description}[]`, `kpis` Json `{metric, target, frequency}[]`; SOP control `sopVersion`, `sopOwner`, `sopEffectiveDate` (String), `sopApprovedBy`, `sopRevisions` Json `{version, date, by, change}[]`; lifecycle `lifecycleStatus` DRAFT/IN_REVIEW/APPROVED/PUBLISHED/RETIRED, `reviewIntervalMonths` (12), `nextReviewDue`, `approverPersonId`, `approverName`, `approverRole`, `reviewers` Json, `submittedByName`, `submittedByEmail`, `submittedAt`, `returnReason`, `pendingChangeNote`, `publishedAt`, `retiredAt`; priorities `priorityImportance`, `priorityComplexity`, `priorityRisk` (1–5), `priorityWhy`, `deepDiveDecision` WAVE_1/WAVE_2/LATER/HIGH_LEVEL | |
| `phases` | `workspaceId`, `name` (unique per ws), `order`, `color` | Value-chain stages |
| `process_steps` | `processId`, `type` START/TASK/DECISION/END, `label`, `assignedRoleId`, `swimlaneRoleId`, supporting roles (m:n), `positionX/Y`, `order`, `phaseId` (SetNull), `phaseOrder`, `raciSkipped`, `reviewNotes`, `milestone`, `joinRequiresAll`, `detailedAction[]`, `exceptionHandling`, `sopInputs`, `sopOutput`, `sopErrors`, `priorityFlagged`, `priorityImportance/Complexity/Risk`, `priorityWhy`, `deepDiveDecision` | |
| `process_step_links` | `stepId` → `targetProcessId` (cascade), unique pair | "🔗 CODE" on a step |
| `step_connections` | `processId`, `fromStepId`, `toStepId`, `label?` | Same-process edges: the predecessor **and** the decision branch (a labelled edge out of a DECISION); no separate branch table |
| `step_handoffs` | `fromStepId`, `toStepId`, `label`, unique pair, both cascade | Cross-process predecessor (§521) |
| `process_versions` | `processId`, `number` (unique per process), `changeNote`, `submittedBy`, `approvedBy`, `approvedRole`, `approvedAt`, `publishedAt` | Immutable |
| `process_acknowledgements` | `processId`, `versionNumber`, `personKey` (register key, not a Person FK), `personName`, `acknowledgedAt`; unique (process, version, key) | |
| `process_controls` | `processId`, `stepId?` (SetNull), `risk`, `riskLevel` "low/medium/high", `control`, `controlType`, `frequency`, `owner`, `evidence`, `lastTestedAt`, `lastTestResult` "pass/fail/not_tested", `order` | Strings, not enums |
| `process_non_conformances` | `title`, `detail`, `raisedAt`, `status` "open/in_progress/closed", `correctiveAction`, `actionOwner`, `dueAt`, `closedAt` | |

### 18.4 RACI, authority, review, priorities
| Table | Fields | Notes |
|---|---|---|
| `activities` | `processId`, `name`, `relatedStepId?`, `order` | A RACI row; a step without one gets a single implied row |
| `raci_assignments` | `activityId`, `roleId`, `code` RESPONSIBLE/ACCOUNTABLE/CONSULTED/INFORMED; unique (activity, role) | |
| `raci_matrix_statuses` | PK `processId`, `status` DRAFT/FINAL, `finalizedAt`, `finalizedByMemberId` | |
| `authority_assignments` | `processId`, `activityId?` (unique), `stepId?` (unique), `skipped` | One per task |
| `authority_rules` | `assignmentId`, `order`, `whoRoleId` or `whoPersonId`, `measure` MONEY/TIME/NONE, `amount` Decimal(14,2), `days`, `direction` GREATER_THAN/GREATER_OR_EQUAL/LESS_THAN/LESS_OR_EQUAL/EQUAL_NO_APPROVAL, `consequence` APPROVAL/ESCALATION | |
| `review_findings` | `processId`, `title`, `description`, `recommendation`, `category` GAP/RISK, `area` PROCESS_MAP/RACI/AUTHORITY/GENERAL, `severity` HIGH/MEDIUM/LOW, `status` OPEN/EDITED/INTEGRATED/DISMISSED, `integrationMode` MERGED/REPLACED, `integratedStepId` (SetNull), `proposedLabel`, `proposedNotes`, `proposedAfterStepId` | A proposed step is a field here, not a step |
| `priority_plans` | one per workspace: `weightImportance` 35, `weightRisk` 40, `weightComplexity` 25, `capacity` 4, `wave1Label` "Start now", `wave2Label` "Next", `laterLabel` "Review later", `status` DRAFT/SENT/APPROVED, `approverPersonId/Name/Role`, `sentAt`, `sentByName/Email`, `snapshot` Json, `returnReason`, `approvedAt`, `approvedByName/Role`, `history` Json `{at, by, what, reason?}[]` | |

### 18.5 Governance
| Table | Fields | Notes |
|---|---|---|
| `governance_aspects` | `workspaceId`, `name` (unique per ws) | Ordered by createdAt; at most one governing policy |
| `governance_assessments` | `aspectId` (unique), `summary`, `summaryHandEdited` | |
| `governance_checklist_items` | `assessmentId`, `title`, `description`, `ownerRoleId` or `ownerPersonId` (SetNull), `dueDate`, `phase` IMMEDIATE/NEAR_TERM/LONG_TERM, `status` OPEN/EDITED/DONE/DISMISSED | |
| `governance_policy_drafts` | `workspaceId`, `checklistItemId?` (unique), `title`, `body`, `status`, `handManaged`, `approvedByUserId`, `approvedAt`, `effectiveDate`, `reviewDueDate`, `governsAspectId?` (unique, SetNull), `lifecycleStatus` DRAFT/IN_REVIEW/APPROVED/PUBLISHED/RETIRED | |
| `governance_policy_versions` | `policyId`, `versionNumber`, `title`, `body`, `createdByUserId` | One per save |
| `governance_policy_acknowledgements` | (policyId, personId) unique | |
| `governance_risks` | `title`, `description`, `handManaged`, `sourceItemId?`, owner role or person, `likelihood` LOW/MEDIUM/HIGH, `impact` LOW/MEDIUM/HIGH/CRITICAL, `status` OPEN/MITIGATING/ACCEPTED/CLOSED, `treatmentStrategy` MITIGATE/TRANSFER/ACCEPT/AVOID, `treatmentRationale`, `targetLikelihood`, `targetImpact` | Level is derived, not stored |
| `governance_risk_treatment_actions` | `riskId`, `description`, owner, `dueDate`, `doneAt` | |
| `governance_activity_log_entries` | `workspaceId`, `entityType` ASPECT/ASSESSMENT/CHECKLIST_ITEM/RISK/POLICY, `entityId` (no FK), `entityLabel`, `summary`, `actorUserId`, `createdAt` | Append-only |

**There is no general audit table.** History lives in `process_versions`,
`process_acknowledgements`, `sopRevisions`, the plan's `history` and
`snapshot`, `governance_policy_versions` and the governance log.

### 18.6 Migrations (`ffp/prisma/migrations/`, applied in name order, 52 today)
| Migration | Adds |
|---|---|
| 20260811095243_init | Base schema: firm, workspace, member, role, person, process, step, connection, link, activity, RACI, old decision_types / approval_rules |
| 20260811095351_add_user_password_hash | `users.passwordHash` |
| 20260811110000_add_invite_token | `members.inviteToken` + expiry |
| 20260817104029_process_step_link_target_cascade | Link → target cascade |
| 20260819115707_add_workspace_profile_and_process_categories | Profile fields; `process_categories`; `processes.categoryId` |
| 20260823104140_add_person_manager | `people.managerId` |
| 20260823120557_add_raci_skip_and_workspace_logo | `raciSkipped`; workspace logo |
| 20260823122404_add_review_findings | `review_findings` + enums |
| 20260825115952_add_raci_visible_role_ids | `raciVisibleRoleIds` |
| 20260825122004_add_firm_logo | firm logo |
| 20260825123500_redesign_authority_matrix_per_process | drops decision_types / approval_rules; `authority_assignments` |
| 20260825124000_rename_authority_co_approver_role_id | rename |
| 20260825161500_move_logo_to_workspace | logo + accent on workspace |
| 20260825170800_workspace_secondary_tertiary_accent | two more accents |
| 20260826110000_export_report_source_fields | `detailedAction`, `exceptionHandling`; purpose, scope, external entities, kpis |
| 20260826123000_authority_sla_direction_escalation | direction, SLA days, escalation |
| 20260830120000_process_branch_from_step | `branchFromStepId` |
| 20260830130000_process_step_order | `order`, backfilled |
| 20260830170000_process_step_milestone | `milestone` |
| 20260830180000_value_chain_phases | `phases`; `phaseId`; supporting roles |
| 20260831120000_activity_phase_order | `phaseOrder` |
| 20260909070000_remove_demo_editor_account, 20260909100000_remove_demo_identities | seed identities removed |
| 20260914090000_authority_rules | `authority_rules` + backfill |
| 20260916164319_report_arrangement | `reportArrangement` |
| 20260922100550_governance_generator | assessments, checklist, policy drafts, risks |
| 20260922143416_governance_policies_and_focus_areas | hand-written policies; Data Integrity, Accessibility |
| 20260923060750_report_map_layout | FLOW/ROLES |
| 20260923181802_governance_summary_hand_edited | `summaryHandEdited` |
| 20260924072309_step_join_requires_all | `joinRequiresAll` |
| 20260927125721_custom_governance_aspects | `governance_aspects`; drops the enum |
| 20260928110455_policy_lifecycle | policy lifecycle, versions, acknowledgements |
| 20260928145849_checklist_owner_due_date | owner, due date |
| 20260928151749_risk_treatment | treatment + actions |
| 20260928154007 … 20260928155849 (incidents, data_privacy, conflicts_training, vendors, ethics_cases) | operational registers, all **dropped** by 20260929101531_remove_operational_registers |
| 20260928162256_governance_activity_log | the log |
| 20260929125952_aspect_governing_policy | `governsAspectId` |
| **20261001120000_smp_register_key** | `people.smpKey` — the first SMP-specific migration (§459) |
| 20261007120000_process_sop | step `sopInputs/Output/Errors`; process `sopVersion/Owner/EffectiveDate/ApprovedBy/Revisions` (§510) |
| 20261011120000_step_handoffs | `step_handoffs` (§521) |
| 20261012120000_review_finding_proposed_step | `proposedLabel/Notes/AfterStepId` (§529) |
| 20261015120000_process_controls_quality | `process_controls`, `process_non_conformances` (§538) |
| 20261018120000_process_lifecycle | lifecycle columns, `process_versions`; backfill: non-blank `sopApprovedBy` → PUBLISHED, review now+12 months, version 1 (§539) |
| 20261018130000_process_acknowledgements | `process_acknowledgements` (§540) |
| 20261023120000_priorities | DeepDiveDecision, PriorityPlanStatus; process priority columns; `priority_plans` (§595) |
| 20261026120000_step_priorities | step flag and scores (§601) |
| 20261027120000_step_decision | `process_steps.deepDiveDecision` (§607) |

Since §459 every migration is additive. Later ones are hand-written and
idempotent (`IF NOT EXISTS`).

## 19. The pure rules (`ffp/lib/domain/*`)

| File | Exports and the rule |
|---|---|
| `process-lifecycle.ts` | `MOVES`, `actionsFrom`, `nextStatus`, `editResetsToDraft` (APPROVED, PUBLISHED), `mayApprove` (NOT_THE_APPROVER / OWN_DRAFT), `isOverdueForReview` (PUBLISHED only), `addMonths` (clamps to month end), `daysToReview`, `STATUS_LABEL`, `reviewBucket` overdue/next30/next90/later |
| `process-reader.ts` | `mayRead`, `expectedAcknowledgers` (holders of a role one of the steps is assigned to; no roles = nobody), `acknowledgementProgress`, `offersReadingLink` |
| `priorities.ts` | `DECISIONS`, `DECISION_LABEL`, `goesDeep`, `DEFAULT_WEIGHTS`, `validWeights`, `validScore`, `weightedScore`, `rankProcesses`, `suggestDecisions`, `wave1OverCapacity`, `suggestComplexity`, `suggestRisk`, `ASPECT_DEFS`/`ASPECTS`, `deepDiveProgress`, `planEditable`, `planCanSend`, `planCanReopen`, `mayApprovePlan`, `inTree`, `stepSignals`, `suggestStepComplexity`, `suggestStepRisk` |
| `priority-units.ts` | `planUnits` (flagged steps stand in for their process; a step's decision falls back to its process's), `byScoreDesc` |
| `process-stepper.ts` | `computeProcessStepper` |
| `document-control.ts` | `documentControl` (status text, version, effective date, approved by from the SOP fields; owner `sopOwner` else the owning role; "Every N months · next DATE" when published; dashes) |
| `sop.ts` | `compileSop` ("Missing" per field, per-step who/how/inputs/output, `missingCount`) |
| `access-control.ts` | `hasSufficientAccess` (VIEWER 0 < EDITOR 1 < ADMIN 2), `canChangeLastAdmin`, `canChangeLastFirmOwner` |
| `raci-validation.ts` | `validateRaciMatrix`: MISSING_ACCOUNTABLE, MULTIPLE_ACCOUNTABLE, MISSING_RESPONSIBLE |
| `raci-table.ts` | `buildRaciTableRows`, `computeVisibleRoleIds`, `planOwnerFill` (R into empty cells), `planSuggestions` (manager's role as A where none) |
| `authority-table.ts` | `DIRECTION_LABELS`, `requiresApproval`, `additionalApprovals`, `deriveRowSummary`, `buildAuthorityTableRows`, `formatMoney`, `gateLine`, `formatSla`, `describeAuthorityRule/Row`, `validateAuthorityTable` (MISSING_APPROVER, INCOMPLETE_RULE_FIGURE, INCOMPLETE_RULE_WHO) |
| `step-authority-summary.ts` | `buildStepAuthoritySummary` by stepId |
| `step-readiness.ts` | `deriveGapsByStep` (PREDECESSOR, ACCOUNTABLE, TOO_MANY_ACCOUNTABLE, RESPONSIBLE, APPROVER, INCOMPLETE_RULE), `STEP_GAP_LABELS`, `STEP_GAP_DESCRIPTIONS` |
| `step-handoff.ts` | `judgeHandoff` (SAME_STEP, UNKNOWN_STEP, SAME_PROCESS, DUPLICATE, LOOP over connections + hand-overs), `HANDOFF_REFUSALS`, `reconcileHandoffDrafts` |
| `process-graph.ts` | `validateConnections` (CROSS_PROCESS_CONNECTION, UNKNOWN_STEP); cycles allowed |
| `decision-branches.ts` | `reconcileBranchDrafts` (delete / createToExisting / createNewStep) |
| `predecessor-editor.ts` | `reconcilePredecessorDrafts` |
| `process-hierarchy.ts` | `isCodeAvailable`, `generateProcessCode`, `recodeAfterChange`, `wouldCreateCycle`, `wouldCreateBranchCycle`, `orderProcessTree` |
| `process-order.ts` | `applyPackOrder` |
| `step-order.ts` | `moveStepInOrder`, `insertPositionAfter`, `insertStepAt`, `arrangeByFlow` |
| `parallel-step-numbering.ts` | `computeStepNumberLabels` ("4a / 4b") |
| `process-delete-impact.ts` | `summariseDeleteImpact` |
| `process-review.ts` | `findStructuralGaps`, `buildProcessReviewPrompt` |
| `review-findings.ts` | `toPersistedFinding`, `normalizeFindingTitle`, `partitionNewFindings`, `appendReviewNote` |
| `process-report.ts` | `buildCombinedMatrixRows`, `deriveControlPoints` (≥2 approval rules), `involvedRoleIds`, `deriveRoleDuties`, `deriveProcessOwnerRoleId`, `deriveDocumentationGaps` |
| `report-arrangement.ts` | `PACK_SECTIONS`, `PROCESS_SECTIONS`, `BLOCKS`, `ARRANGEMENT_VERSION`, `resolveArrangement`, `defaultArrangement`, `isBlockEmpty`, `isSectionEmpty`, `toStored` |
| `report-pagination.ts` | `paginate` |
| `print-map-layout.ts` | `buildPrintMapLayout`, `MAX_ROLE_COLUMNS` |
| `process-layout.ts`, `connector-routing.ts` | map geometry, `routeConnectors` |
| `milestone-rails.ts` | `buildMilestoneRails` (milestones + junction steps) |
| `process-landscape.ts` | `buildProcessLandscape`, `describeLandscape` |
| `helicopter-pick.ts` | `groupProcesses`, `toggleGroup`, `toggleOne`, `pickLabel`, `groupState`, `hiddenOrigins`, `shownFromHidden` |
| `value-chain.ts` | `PHASE_COLORS`, `phaseColorFor`, `groupByPhase`, `groupByOwner`, `UNPHASED_COLUMN`, `UNOWNED_COLUMN`, `boardTotals`, `valueChainSummary`, `ownerOptions` |
| `value-chain-import.ts` | `matchHeaders`, `findHeaderRow`, `parseDepartments`, `buildImportPlan` |
| `process-import.ts` | `FORMAT_VERSION`, `SHEETS`, `REQUIRED_SHEETS`, `MAX_STEPS`, `parseWorkbook`, `checkTemplateIdentity` |
| `org-chart.ts` | `wouldCreateManagerCycle`, `layoutOrgChart` |
| `policy-lifecycle.ts` | `isPolicyOverdueForReview` |
| `checklist-due.ts` | `isChecklistItemOverdue`, `dayOf` |
| `risk-treatment.ts` | `LIKELIHOOD_ROWS`, `IMPACT_ORDER`, `heatMapCells`, `isTreatmentActionOverdue` |
| `governance-risk.ts` | `deriveRiskLevel` |
| `governing-policy.ts` | `aspectPolicyState` |
| `governance-focus-areas.ts` | `DEFAULT_GOVERNANCE_ASPECT_NAMES` |
| `governance-findings.ts` | `partitionNewChecklistItems`, `partitionNewRisks`, `isHandManaged` |
| `governance-dashboard.ts` | `isDashboardEmpty`, `buildDashboardTiles` |
| `governance-report.ts` | `buildGovernanceReport`, `isGovernanceReportEmpty`, `RISK_STATUS_LABEL`, `POLICY_LIFECYCLE_LABEL`, `formatReportDate`, `titleCase` |
| `policy-templates.ts` / `.ar.ts`, `section-guides.ts` / `.ar.ts` | templates and help copy |
| `logo.ts`, `color-contrast.ts`, `color-extraction.ts` | branding |

Outside domain: `(shell)/processes/fold-chains.ts` (`foldChains`), and the
lifecycle reset in `ffp/lib/data/process-lifecycle-reset.ts`.

## 20. Loaders (`ffp/lib/data/*`)
`authority-assignments.ts` (the one mapper, Decimal → number) ·
`governance-activity.ts` (`loadGovernanceActivity` 50 a page, `logGovernanceActivity` in the same transaction) ·
`owner-assignment.ts` (`checkAssignableOwner`) ·
`priorities.ts` (`loadPlan` → `DEFAULT_PLAN` when no row, `loadPriorityRows`, `buildSnapshot`) ·
`process-lifecycle-reset.ts` (`resetIfInForce`) ·
`process-reading.ts` (`awaitingApproval`, `planAwaitingApprovalBy`, `readingFor`) ·
`process-review-context.ts` (`loadProcessReviewContext`: map, RACI, authority for the AI review and the pack check) ·
`process-stepper-data.ts` (`getProcessStepperCounts`) ·
`register-person.ts` (`registerPerson`) ·
`review-findings-data.ts` (`getActiveReviewFindings`) ·
`ffp/lib/reports/load-report-data.ts` (`loadReportData(workspaceId, processIds)` — everything the report, PDF and PPTX need; each step is built from a named list of fields, which is why `reviewNotes` can never leak).

## 21. Checks and tests

| Script | What it guards |
|---|---|
| `npm run check:processes` → `checks/processes-e2e.mjs` | The real thing: `next start` on 3981, a real Postgres (`DATABASE_URL_UNPOOLED`), Playwright, client `raya-trade`, about 107 checks (last recorded GREEN 128/0, §610). Drives the register mirror; draft → send for review → approval only by the named approver (not the sender, not another office login) → publish (version, effective date, review a year out); staff reading and acknowledging with the count falling; "N to read" / "1 to approve" on both bars; staff refused office pages and downloads and redirected from `/`; drafts invisible to staff; signed-out → sign in; priorities scoring, ranking, waves, locking, sign-off, approval, reopen with reason; step flagging, promote-to-process, both Excel files; AI review "Add as a step" with confirm; SOP back link; the office's own pages carry no staff link. Needs `npm run build` first. |
| `npm run test:processes` | `tests/process-lifecycle.mjs` (35), `process-reader.mjs` (26), `bar-reading-link.mjs` (12), `document-control.mjs` (11), `priorities.mjs` (42), `processes-gate.mjs`, `no-ai-in-client-output.mjs` |
| `tests/processes-gate.mjs` | Every page under `read/` sits under a `readerSeat` layout; every other page under a `requireOffice` layout with `props.params` then `requireOffice` as its first awaits; gate layouts call `requireOffice` before `requireWorkspaceAccess` or prisma; `requireOffice` redirects, the read layout 404s; the frame calls `resolveTenant`; more than 15 pages found |
| `tests/no-ai-in-client-output.mjs` | Scans `ffp/lib/reports`, `processes/reports`, `processes/read`, `app/api/ffp/export`, `sop.ts`, `process-report.ts`, `priorities-document.tsx` for `reviewNotes`, `proposed*`, `ReviewFinding`, "AI Review", "from AI review", `ai-review`; ≥15 files; "Replace step" writes the person's trimmed text (≤200) |
| `check:handoff` (`checks/process-handoff.mjs`, 16, red 10 ways) | §521 rules |
| `check:sop` (`process-sop.mjs`, 20) | `compileSop` |
| `check:raci` (`raci-autofill.mjs`, 13, red 6 ways) | fill and suggest |
| `check:propose` (`review-propose-step.mjs`) | propose / confirm / delete |
| `check:pick` (`helicopter-pick.mjs`, 12, red 5 ways) | the picker |
| `checks/modules.mjs` | `(ffp)` layout exists, `serverFor` returns null for Processes |
| `checks/instant-nav.mjs` | the Insights → Processes → Notes skeleton presses |

Pure checks each have a `--red` variant that proves they can fail.

## 22. Deploy, the schema and the carried data

- `scripts/deploy.mjs` runs SMP's `applyAll`, then `db/apply-ffp.mjs
  applyFfp(url)`, on every deployment, previews included. `applyFfp` creates
  schema `ffprocess`, applies the migrations in name order inside one
  transaction under advisory lock `420043` with `SET LOCAL search_path TO
  ffprocess`, records each in `ffprocess._migrations`, and grants `smp_app`
  USAGE, DML on tables and sequences and default privileges. The build also
  runs `prisma generate --config ffp/prisma.config.ts`.
- `scripts/carry-ffprocess.mjs` (§459): copies one old FFProcess workspace into
  a client's empty one — everything reachable by foreign key, ids kept, in one
  transaction, two passes (nullable FKs afterwards), old users re-addressed to
  the SMP user with the same email or copied without a password; the workspace
  id becomes `--to` (default `rhi`) and `firmId` `forefront`; refuses a
  non-empty target except mirrored register-only people, which it removes first
  so adoption by email works; skips auth/firm/member tables. CLI: no `--from`
  lists the old workspaces; without `--apply` it is a dry run with counts.
  Env: `FFPROCESS_DATABASE_URL` (the old database, set in Vercel),
  `FFPROCESS_SOURCE_SCHEMA` (default `public`), `SMP_CARRY_FFPROCESS` (the old
  workspace's id or exact name; production only; needs the URL; "already holds"
  is logged, never fatal), `SMP_CARRY_FFPROCESS_TO` (default `rhi`).
- AI keys: `lib/assistant.cjs` is the only reader. `ANTHROPIC_API_KEY`
  (model `ANTHROPIC_MODEL`, default `claude-opus-5-5`, `ANTHROPIC_BASE_URL`,
  16384 output tokens, 55s timeout) else `GEMINI_API_KEY` (`GEMINI_MODEL`;
  `gemini.ts` defaults to `gemini-3.5-flash`, `assistant.cjs` to
  `gemini-3.6-flash` — two defaults). No key → `{ok:false, reason:
  "NOT_CONFIGURED"}` with a per-feature sentence.

## 23. Correlation map — if you change this, these read it

| Change | Who reads it |
|---|---|
| **The People register** (name, email, active, removed) | Org Directory people (sync per request); who may be picked as approver (needs email + role); who is expected to acknowledge; who may open `/read` (`personKey`); the staff link; approvals matched by `smpKey`; the carry script's email adoption |
| **A role** (`roles`) | Step assignment and swimlane; RACI columns (`raciVisibleRoleIds`); authority rule "who"; risk / checklist / action owners; `expectedAcknowledgers`; "Who is involved" in the SOP; "Internal Roles" in the report; priorities complexity (roles per process / per step); `deriveProcessOwnerRoleId`; the Value Chain "By Owner" grouping and "Support:" line; the milestone rails' lanes |
| **A person's manager** | The org chart; RACI **Suggest** |
| **`lifecycleStatus`** | List Status badge and "Review overdue"; process page badge; Lifecycle tab; which processes the reading page shows (PUBLISHED) and which wait for approval (IN_REVIEW by approver); the review calendar (PUBLISHED); `documentControl` status in the report; the Approved aspect in Priorities; the staff link's counts; `readingFor`; the clear-entries rule (plan DRAFT only is the plan's, not the process's) |
| **Publishing** | Writes `sopVersion`, `sopApprovedBy`, `sopEffectiveDate`, `sopRevisions`, `nextReviewDue`, `publishedAt`, a `process_versions` row → read by the SOP document control, the report banner, the SOP aspect, the calendar, "Approved versions", every acknowledgement count (a new version needs everybody again) |
| **An edit to a process or its steps** (8 actions) | Drops APPROVED/PUBLISHED to DRAFT → the process leaves the reading page and the calendar until re-approved and re-published |
| **A step's `assignedRoleId`** | Swimlane; RACI fill (R) and the implied RACI row; `expectedAcknowledgers`; SOP "who" (a blank is Missing); report narrative; printed map "No role set"; complexity suggestions; step signals (≥3 roles) |
| **`step_connections`** | Predecessors and branches on the map and list; "no predecessor" gap; arrange by flow; 4a/4b numbering; hand-over loop check; the SOP's "→ next" column; structural gaps for the AI review; step signals (decision) |
| **`step_handoffs`** | Both maps' gutters; both step lists' chips; the SOP's Approval/hand-over column; the Helicopter "Step link" connections and junction beads; the readiness check (a step fed only by a hand-over is not "no predecessor"); step signals (handover); priorities complexity (cross-process). Not carried by print, import, template |
| **`branchFromStepId`** | List sub-line "↰ branches from"; Helicopter "Branch" connection and dashed card; the hidden-origin note; "Make it a process" uses it |
| **`milestone`** | Helicopter rails' beads (plus junction steps always); the ★ on the map |
| **`detailedAction`, `exceptionHandling`, `sopInputs/Output/Errors`** | SOP Procedure (How, In/out, Common errors); report narrative (Detailed Action, Risk if Mishandled); "📄 Documented"; step signals (risk noted, ≥5 lines) |
| **RACI cells / status** | The banner and Mark Final; the stepper (RACI done when FINAL; Authority current only then); step gaps; the RACI aspect; `deriveProcessOwnerRoleId`; the report grid; the list's RACI column; the Dashboard "RACI drafts" |
| **Authority rules** | The map card's gate line (shared `gateLine`); step gaps (APPROVER, INCOMPLETE_RULE); Key Control Points (≥2 approval rules) in the report and Governance KPIs; the Authority aspect (≥1 assignment); the SOP's Approval column; `deriveProcessOwnerRoleId` fallback |
| **`process_controls`** | Risks & controls tiles and table; Quality's "Failed control tests"; priorities risk suggestion (process and step); step signals; the Controls aspect; the SOP "Controls and KPIs" |
| **`kpis`** | Overview "Measures"; Governance "Operational KPIs & SLAs"; the report and SOP KPI lines; the KPI aspect of delete impact |
| **`processPurpose`, scope, `externalEntities`** | Overview; the map's Documentation card; the report's Executive Summary; the SOP's Purpose and scope; the reading page |
| **Priority scores, weights, capacity, decisions** | Score, Rank, Plan, Sign-off; the list's Depth and Priority; the page header chip; Helicopter "Deep dive"; both Excel files; the client one-pager (from the snapshot only once sent) |
| **A flagged step** | Replaces its process on the plan board and the sign-off; its own wave; the Flagged-steps sheet; "Make it a process" |
| **`priority_plans.status`** | Editability of every score and decision; "Clear entries"; the reading page's "Waiting for your approval"; the staff link's approval count |
| **`review_findings`** (incl. proposals) | The AI Review page; the map's proposed rows; step `reviewNotes` on merge. Never the report, SOP, printed map, RACI, exports or the reading page |
| **`phases` / `phaseId`** | The Value Chain board only (and the report's Value Chain section) |
| **Workspace `industry`** | AI review "Reviewed against"; the governance assessment |
| **Workspace accents / logo** | Every page header strip; the report's cover and banners; the PPTX |
| **`reportArrangement`, `reportMapLayout`** | The Export page's sections and the preview; the printed map's layout |
| **Governance aspects / policies / risks / checklist** | The Governance page, its dashboard tiles, the activity log; the report's Governance & Risk section. Nothing in a process reads them (Compliance tab is a placeholder) |
| **`MODULE_DEF.processes` / the client's modules** | The frame's admission; `openableModules`; the consultant's module menu; the staff link (`offersReadingLink` requires the client to have Processes) |

## 24. Open, parked and deliberately not built

- **Adding a person directly in Processes** (not on the register) is still
  allowed — Islam's call (§459, open since 2026-10-01).
- **Notifications and email**: none. An approver learns of a review only from
  the reading list and the top bar; no reminders to those still to read.
- **People, Compliance, Connections tabs** are placeholders (drawn full in the
  mockups).
- **Tracker / Strategy links**: nothing. Processes does not read pillars or
  write actions.
- **PowerPoint** still prints the old made-up document control (§547);
  priorities PPTX deferred.
- **One continuous page** never verified in a real print dialog.
- **ERP preparation** (§599): parked at Islam's word.
- **AI content for the SOP's Missing fields**: not built (§609), awaiting a
  word.
- **Archive or delete a client** does not touch `ffprocess.workspaces` (no FK
  to `tenants`); rows are left orphaned. A retired client is refused by
  `resolveTenant`, which blocks Processes too.
- **Members, firm owners, "Firm Owner access", "View only"**: vestigial. The
  Dashboard's Members count reads rows nobody writes.
- **No row-level security** on `ffprocess`; isolation is `requireWorkspaceAccess`.
- **"Edit drops to Draft"** does not cover connection, hand-over, RACI,
  authority, milestone or reorder edits.
- **Translation**: only the shell, Governance, policy templates, section
  guides and the report's control-point sentences are in Arabic; Process Map,
  RACI, Authority, Lifecycle, Priorities and the domain labels are English.
- **Two Gemini defaults** (`gemini.ts` vs `assistant.cjs`).
- **"Processes settings"** in the consultant's module menu points at
  `/<slug>/processes/setup`, which the `(ffp)` tree does not serve (falls
  through to the platform's Setup document — inferred, not run).
- **`lib/library.ts`** still lists `KINDS = ["insights","processes"]` from the
  library era.
- **The helicopter picker** was never looked at on a real workspace; cards do
  not name a hidden link target (§511).

## 25. Timeline of recorded changes

| Date | § | What |
|---|---|---|
| 2026-10-01 | §459 (spec 065) | FFProcess ported in; register sync; carry script. Merged |
| 2026-10-05 | §507 | Export starts empty, select-all box |
| 2026-10-05 | §508 | The list folds sub-processes |
| 2026-10-06 | §509 | AI draft with org roles; "Draft it with AI" on an empty map; "Check these N end to end" |
| 2026-10-06 | §511 | Helicopter process picker (option A) |
| 2026-10-07 | §510 | SOP per process; three SOP boxes on a step; document control |
| 2026-10-08 | | §507–§511 merged to `main` |
| 2026-10-11 | §521 | Cross-process hand-overs (`step_handoffs`) |
| 2026-10-11 | §522 | Report prints as one continuous page |
| 2026-10-11 | §523 | SOP shows hand-overs, prints as one page; merged 10-12 |
| 2026-10-12 | §529 | AI review "Add as a step" (proposal → confirm) |
| 2026-10-13 | §530 | RACI "Fill from step owners" and "Suggest"; merged |
| 2026-10-15 | §538 | Process page with seven tabs; Risks & controls; Quality |
| 2026-10-18 | §539 | The controlled lifecycle |
| 2026-10-18 | §540 | Review calendar; staff reader view; acknowledgements; gate moved into the areas |
| 2026-10-18 | §541 | Copy-link addresses for staff |
| 2026-10-18 | §542 | "Processes · N to read" on the staff top bar |
| 2026-10-19 | §543–§544 | No AI in client output; "Replace step" asks for the words |
| 2026-10-19 | §545 | Driven for real: approval moved to the reading page; reader asks SMP's session; `requireOffice` redirects before reading. Merged on condition of no harm |
| 2026-10-19 | §546 | Strip's "Process" goes to the process page; tabs under the map's strip |
| 2026-10-19 | §547 | Report states the real document control |
| 2026-10-23 | §595 | Deep-dive priorities (four steps, aspects, sign-off, migration) |
| 2026-10-23 | §596–§598 | Steady list, subs under mains, Clear entries; the "!"; Excel download |
| 2026-10-23 | §620 | Instant navigation skeletons (incl. Processes) |
| 2026-10-26 | §599 | ERP preparation parked |
| 2026-10-26 | §600–§606 | Layout fixes; step-level priorities (flag, score, Make it a process); more signals; full-width |
| 2026-10-27 | §607–§608 | Plan holds flagged steps; download all steps |
| 2026-10-27 | §609 | SOP and priorities back links; "Add as a step" checked for real |
| 2026-10-27 | §610 | "Choose processes" picker and the strip |

## 26. The mockups behind it (`design-mockups/`)
`processes/2026-10-11_sop-preview.html` · `processes-ai/2026-10-05_build-and-check.html` ·
`processes-list-fold/2026-10-05_plus-to-open-subs.html` · `helicopter-pick-processes/2026-10-05_choose-processes-options.html` ·
`processes-sop/2026-10-06_sop.html` · `process-cross-predecessor/2026-10-11_cross-process-predecessor.html` ·
`process-risk-integration/2026-10-12_risk-add-step.html` · `processes-space/2026-10-14_processes-structure.html` ·
`processes-complete/2026-10-14_processes-complete-solution.html` · `staff-processes-link/2026-10-18_staff-processes-link.html` ·
`processes-priorities/2026-10-23_deep-dive-priorities.html`, `2026-10-26_step-level-priorities.html`, `2026-10-27_easier-priorities-page.html` ·
`processes-module/2026-10-28_whole-module-walkthrough.html` (the whole module, clickable).
