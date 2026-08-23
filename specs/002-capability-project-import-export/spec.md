# Feature Specification: Capability project import and export

**Feature Branch**: `claude/adminsmo-access-module-wj89vv`
**Created**: 2026-08-20
**Status**: Approved by record — DECISIONS-AND-LOGIC v1.8 §16.4 ("The import
template") and §15.12 ("Import and export for projects"), extended to the §15
project model (deliverables, outcomes, milestones, optional key objectives)
**Input**: Backlog items §16.4 + §15.12 — the template still carries nothing
for capabilities, so a project round trip loses the deliverables, outcomes and
milestones.

## User Scenarios & Testing

### User Story 1 — Download a capability's plan template (P1)

The SMO opens Manage → Import, picks a **capability** instead of a business
unit (same page, same flow — §16.4: "Capability projects arrive the way a
unit's plan does"), and downloads an Excel workbook shaped like the thing being
planned: Read me · Objectives · Projects · Deliverables · Outcomes ·
Milestones. Children choose their **project from a dropdown of project names**;
nobody types an id; the ID column is grey and last.

**Acceptance Scenarios**:

1. **Given** the Import page, **When** the scope list opens, **Then** it offers
   Business units and Capabilities as two groups; picking a capability keeps
   the Plan/Progress toggle and the same three steps.
2. **Given** People is selected under Plan, **When** Download Excel is pressed,
   **Then** the workbook carries that capability's key objectives (with
   weight), each project's brief row (owner, stakeholders, timeline kind,
   start, end), and its deliverables (kind: Delivered/not or % — and nothing
   else: since v3.20 a deliverable carries no due date and no owner, §53.4),
   outcomes
   (direction, target split into value and unit, measured at) and milestones
   (covers, owner, finish) — each child sheet with a Project dropdown.
3. **Given** the CSV alternative, **Then** a flat file with types
   `PLAN · CAPOBJECTIVE · PROJECT · DELIVERABLE · OUTCOME · MILESTONE` downloads,
   ids carried, one row per item.

### User Story 2 — Upload, review, apply (P1)

The filled workbook (or CSV) is uploaded. Nothing is applied on arrival: the
file is validated, diffed against what is recorded, and the differences are
confirmed by a person. Rows with a blank id are created — projects before
their children. Absent is reported, never deleted. Applying leaves a receipt.

**Acceptance Scenarios**:

1. **Given** an untouched export re-uploaded, **Then** the review reads **zero
   changes** (idempotence — §9.3: "the test that matters").
2. **Given** a changed outcome target and a new milestone with no id, **Then**
   the review lists one change (was → now) and one creation; Apply writes both
   and reports "1 changed, 1 created" with a link-back.
3. **Given** a file whose ids mostly belong to another capability or to a
   business unit, **Then** the whole file is refused with the shape message
   naming what it looks like (§9.4).
4. **Given** a progress file uploaded under kind=Plan (or vice versa), **Then**
   the file is refused and the toggle named.
5. **Given** a milestone finishing after its project's end date, **Then** it is
   saved exactly as entered and surfaced as a notice, never a problem (§15.4).

### User Story 3 — Progress by sheet for a capability (P2)

Same Plan/Progress toggle as a unit. The progress workbook mirrors the
capability's reporting page: key objectives (actual), deliverables (Yes/No or
%), outcomes (actual, in the target's unit), milestones (status). Only the
New value column is typed; blank means unchanged; SMO-gated like every sheet
upload.

**Acceptance Scenarios**:

1. **Given** a deliverable marked Yes and an outcome actual entered, **Then**
   the review shows both was → now; applying updates them, recomputing outcome
   progress from the target on arrival (never typed).
2. **Given** a milestone status "Completed" in the sheet, **Then** applying
   sets the status; an unfilled status row changes nothing.

### Edge Cases

- Deliverable kind invalid (not Delivered/not or %) → problem, blocks apply.
- Outcome with no target → notice: recorded, not scored.
- Renaming a project on the Projects sheet must not orphan its children:
  children already known fall back to the parent the platform records (§9.2).
- Outcome actual stored with its unit (e.g. "15 d"), progress recomputed with
  the ≤/≥ direction rule, clamped 0–150 — identical to a unit measure.
- A capability with no projects downloads a valid template with empty child
  sheets (headers + dropdown-less), uploadable to create its first project.

## Requirements

- **FR-001**: Import page scope covers capabilities: grouped dropdown, state in
  `IMP`, same three-step flow, same Plan/Progress toggle, SMO-only.
- **FR-002**: Capability plan workbook: Read me · Objectives · Projects ·
  Deliverables · Outcomes · Milestones; dropdown validations (project names,
  Yes/No, kinds, direction, milestone status); grey locked ID column last;
  targets split into value + unit.
- **FR-003**: Capability plan CSV: flat rows, columns
  `id,type,parent_id,name,description,owner,stakeholders,direction,value,unit,
  kind,measure_at,start,end,finish,covers,weight,compile,timeline,notes`
  (`due` was dropped in v3.20 with the field itself, §53.4; `owner` stays for
  projects and milestones);
  the workbook reduces to these rows before the shared diff/apply path.
- **FR-004**: Validation problems block: missing id/type, duplicate id,
  unmatched project, bad direction/kind/status/compile. Notices do not: no
  target, no measure-at, milestone past project end.
- **FR-005**: Diff: per-field was → now for briefs, deliverables, outcomes,
  milestones and key objectives; new rows created projects-first; absent
  reported, never removed; receipt on apply.
- **FR-006**: Progress workbook and CSV for a capability (Objectives ·
  Deliverables · Outcomes · Milestones), new-value-only entry, progress
  recomputed on arrival, statuses applied only where filled.
- **FR-007**: File-shape checks: wrong capability, unit-file-under-capability
  (and the reverse), plan/progress kind mismatch — all refused whole.
- **FR-008**: Round-trip idempotence: export → re-import untouched → zero
  changes, for both plan and progress, workbook and CSV.

## Success Criteria

- **SC-001**: Idempotence verified in an automated browser check for every
  capability (plan CSV and workbook paths).
- **SC-002**: `qa.py` walk clean; the Import page renders for both scopes.
- **SC-003**: A project round trip preserves deliverables, outcomes and
  milestones exactly (the §15.12 defect closed).

---

## Amendment — 2026-08-20 (§22 of the decisions document)

The import model changed under this spec and under the business-unit plan
import alongside it. Where this spec says a filled file is compared against
what is recorded and applied as a difference, that is now true of **reporting
only**:

- **A plan upload authors the plan; it does not amend one.** Everything in the
  file is created and every code is minted on arrival. There is no ID column in
  the plan template, and no row is matched against anything.
- **The template is generic.** One workbook for every business unit and one for
  every capability; which one it is for is a dropdown on its Read me sheet
  (cell B2), and that is what the platform reads on upload.
- **Replacing archives.** The outgoing plan and every figure reported against it
  are kept as a restorable snapshot before the new plan is written. Nothing an
  import does is a deletion.
- **A plan must arrive as .xlsx.** A flat CSV has no Read me sheet and so cannot
  say which unit or capability it is for.

The progress (reporting) half of this spec is unchanged.
