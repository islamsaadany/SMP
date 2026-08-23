# 010 · Functions that plan in pillars, and functions under a unit
> *Completed in §59: the Setup controls (Plans in, Under), the authoriser
> classification, ids on a function's pillars, its place in the navigation,
> and one resolver for a target. The import template is still open.*

**Status:** DESIGNED, being built. Every decision below was put to Islam before
anything was written; his answers are marked.
**Records as** §52 in the decisions document — *(number to confirm against the
other session's §52; see §7)*.

---

## 1 · The three things Islam described

> *"for some supporting functions plans they built them in the format of the
> Business units. so we need to accommodate this somewhere to identify the plan
> format … so the system can receive the outcome and the performance page is
> built accordingly."*

> *"some of the supporting functions are not really supporting functions across
> the group but rather a function under a unit like the merchandizing under the
> retail."*

> *"the retail has 3 pillars, 2 the retail custodian progress and 1 of them is a
> pillar for merchandizing where the merchandizing took and broke down in to 3
> pillars where their collective performance represents the performance of that
> pillar of the retail which impacts the retail performance."*

Three things, and the third is the one that decides the shape:

**A pillar is either scored from its own measures and tactics, or handed to a
function whose pillars produce its score.** Same structure, one level down.

---

## 2 · What is settled

| Question | Answer | Asked |
|---|---|---|
| One planning template per function, or both? | **One.** A function is either a pillars function or a projects function, chosen once. | Islam |
| Do pillar-planning functions become Units? | **No.** "A function that plans in pillars is just a planning template — they shouldn't count as Units." | Islam |
| What passes up to the parent's pillar? | **Both scores, kept apart** — the child's measure performance becomes that pillar's performance, its execution becomes that pillar's execution. The pillar carries no measures or tactics of its own. | Islam |
| Where is the handover said? | **On the unit's pillar.** You set it where you see the consequence, in Retail's own plan, beside the two pillars Retail does itself. | Islam |
| Navigation | **In the Functions navigation**, alongside the group-wide ones. | Islam |
| Who runs a sub-function? | **Its own head and custodian, plus the SMO.** The parent sees the numbers and does not type them. | Islam |
| Name | **Functions**, everywhere. | Islam |

---

## 3 · The model

Three fields, and nothing else changes shape.

    FUNCTIONS[key].format   "projects" (default) | "pillars"
    FUNCTIONS[key].under    null (the group) | "<unitKey>"
    <unit>.items[i].by      undefined | "<functionKey>"

**`format` decides which pages a function has.** A projects function keeps
capabilities, projects, deliverables, outcomes and milestones — everything spec
002 and §15 built. A pillars function carries `items[]` of exactly the shape a
unit's pillars have, and its Performance, Plan, Report and deck pages are the
UNIT's, not new ones. That is the whole reason this is a template rather than a
second kind of thing: two pages doing the same job should be the same page with
different content (A13, B5).

**`under` decides where it sits.** Null is today's behaviour — a function
supporting the whole group. A unit key makes it a function *of* that unit. It
still appears in the Functions navigation; it is not nested a third level deep.

**`by` on a pillar is the handover.** A pillar naming a function has no measures
and no tactics of its own: its two scores are read from that function.

### 3.1 Why `by` sits on the pillar and not on the function

Islam chose it, and the reason holds up: **Retail's plan is where the
consequence is visible.** Opening Retail you see three pillars, two of them
Retail's own work and one that says *carried by Merchandising*. Put the pointer
on the function instead and Retail's plan grows a pillar its own people did not
add and cannot remove.

---

## 4 · Scoring

A pillar today has two numbers, derived from what hangs under it:

    performance = mean of its measures' progress
    execution   = delivered / planned across its due tactics

A **handed-over** pillar takes those two numbers from its function, computed the
same way over the function's own pillars — the function's overall performance
and its overall execution. **They stay apart.** Nothing is blended, so Retail's
two headline numbers remain comparable across all three of its pillars.

    Merchandising          performance   execution
      MD01 Assortment            72%          85%
      MD02 Space                 64%          70%
      MD03 Supplier terms        80%          60%
      ───────────────────────────────────────────
      the function              72%          72%
                                  ↓            ↓
    Retail Stores
      RS01 Store network         88%          91%   (its own)
      RS02 Omnichannel           61%          70%   (its own)
      RS03 Merchandising         72%          72%   ← carried by Merchandising

**A cycle counts once.** A handed-over pillar contributes to Retail through its
function and the function is not also counted at group level as a unit — it is
not a unit, which is exactly what Islam's answer to question 1 protects.

### 4.1 What happens when the function has reported nothing

Absent, never zero (§15.1). A function with no scorable measures gives the
pillar a null performance, which reads as "not scored" — not as 0%, which would
say the work is failing when it has not been reported.

---

## 5 · Authorisation

**Its own head and custodian, plus the SMO.** Nothing new is invented: a
sub-function is a function, so `a_fn_own` and `a_fn_other` already answer for
it, and `lib/rules.js` needs no new role.

The parent unit gets **no** write over it. That is the point of the arrangement:
a pillar's score is Merchandising's answer, and a unit that could type it would
be reporting its own mark. Retail reads the number and chases the people.

Editing `by` — which function carries a pillar — is a **plan** change, so it is
the SMO's (§31, §42's `unitPlan`).

---

## 6 · What this deliberately does not do

- **No third navigation level.** Islam chose the Functions row.
- **No blended score.** Rejected when asked: Retail's performance and execution
  must stay comparable across its pillars.
- **No both-templates function.** Rejected when asked: a function running both
  is recorded as two.
- **A handed-over pillar carries no measures of its own.** That followed from
  "both scores, kept apart" and is stated here because it is the surprising
  half: the pillar becomes a window, not a container with extras.
- **Nothing recursive beyond one level, yet.** A function under a unit cannot
  itself hand a pillar to another function. Nothing in the model forbids it;
  nothing has asked for it, and the scoring would need a cycle guard before it
  could be allowed.

---

## 7 · Open, and to confirm before this merges

- **The section number.** Another session shipped a §52 today. This one takes
  the next free number in the log at merge time, not at writing time.
- **The horizon** (§16.16) is group-wide and any plan upload moves it. A
  function planning in pillars carries key objectives with horizons too, which
  makes that sharper — but it is its own piece of work.

---

## Addendum — §61 (2026-08-23)

Three things the original spec left unfinished, found by using the product.

**A function is in the navigation before it has a plan.** The gate was
"is there anything behind this function". That is right for a reader and wrong
for whoever has to fill it: a pillars function with no plan could not be
opened, so the only way to reach it was to give it a plan first — and on a
clean-slate tenant, where every capability is removed, no function appeared at
all. A function now shows when it is active AND (it has work OR the viewer may
edit its plan or foundation). Its empty pages say what would fill them.

**A pillars function can receive a plan by upload.** The plan template's Read me
sheet lists business units *and* the functions whose format is pillars; the
label reads "Business unit or function" and the reader accepts the old label
too. The upload resolves that name to `fn:<key>` and applies through the same
`applyPlanReplace()` a unit uses — against a WRITABLE view, because
`fnAsUnit()` is a reading view whose assigned fields are thrown away.

**The download is one button with two entries** — *Pillars template* and
*Projects template* — on both the plan and the progress step. On progress the
subject list is narrowed to the subjects that keep the chosen format, and the
format is read off the selected subject rather than stored beside it.
