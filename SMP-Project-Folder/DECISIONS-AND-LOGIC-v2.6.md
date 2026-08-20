# Strategy Management Platform — Decisions and Logic

**Spec 012 — the strategy layer · Raya Trade group shape**
**Version 4.0 — supersedes all earlier versions of this document and
`01-DESIGN-BRIEF.md` from the Claude Code handoff.**

This is the rebuild contract. Someone with no prior context should be able to
reconstruct the model, the scoring, the access rules, the configuration and the
import from this file alone.

Where a decision was made, the reasoning is recorded beside it — a decision
without its reasoning gets reopened every time somebody new arrives. Where a
decision **reverses** an earlier one, both are recorded, or the code will look
like it contradicts the spec.

---

## 1. What is being built

A strategy layer above the platform's existing functional plans. The platform
already tracks departmental objectives and KPIs (specs 001–011). It has no
representation of the *company's own strategy* — what it decided to do this
year, who owns it, and whether it is working.

Two health readings at two altitudes, deliberately never blended:

| Layer | Question | Where |
|---|---|---|
| **Strategy health** (new) | Are our strategic bets paying off? | This feature |
| **Functional health** (exists) | Are the functions delivering their plans? | Specs 001–003 |

**Tenant shapes.** `SINGLE_COMPANY` and `GROUP`. Raya Trade is the group case
and drives the design. ELABD is the single-company case and is **out of scope**
until the group shape is complete; it will then adopt whatever this document
settles.

**Scale of the prototype:** 10 business units, 24 pillars, 76 measures, 78
tactics, 8 group capabilities carrying 19 tactics of their own.

---

## 2. Vocabulary — the contract

Every term has an **internal name** the platform is built on, and a **display
label** the tenant sees. The internal name never changes.

| Internal name | What it is | Lives at |
|---|---|---|
| **Theme** | The group's standing columns — One Trade, Deepen Value Chain, Diversification | Top unit |
| **Pillar** | A business unit's direction **or** capability. Carries key measures and tactics, tagged with exactly one theme | Business unit |
| **Key Objectives** | A unit's own scorecard. Its headline score | Every unit |
| **Winning Aspiration** | The end-state statement | Every unit |
| **End in Mind** | A second statement beside it. **Optional** | Every unit |
| **Purpose** | Why the organisation exists | Top unit only |
| **Core Values** | Group-level, inherited downward | Top unit only |
| **Key Measure** | The measures under a pillar | Pillar |
| **Tactic** | The work under a pillar. Quarter flags, an owner, collaborators | Pillar |

**The trap.** At group level the temple's three columns are *themes*. At
business-unit level, *pillar* means that unit's directions and capabilities.
Never use "pillar" for the group's columns.

### Naming history, so it is not relitigated

| Was called | Now | Note |
|---|---|---|
| North Star, Guiding Objectives | **Key Objectives** | Same entity |
| Mission | **Purpose** | Straight relabel |
| Vision / End State | **Winning Aspiration** | See below |
| Pillars (at group level) | **Themes** | Display label may still say "Pillars" |
| Analysis (page name) | **SWOT** | The page was always a SWOT |

### Winning Aspiration and End in Mind — reversed twice, settled

**Settled: two separate statements, and End in Mind is optional.**

- *Original brief:* the group held a Vision, business units held a Winning
  Aspiration — two entities at two levels.
- *First reversal:* merged into one entity with three display labels, on the
  reading that Vision / End State / Winning Aspiration were synonyms.
- *Second reversal, and the correct one:* Raya's own deck carries **both**
  `ASP1 Winning aspiration` and `ASP2 End in mind`, saying different things.

**But not every foundation has both.** The group states an aspiration and no End
in Mind. Where there is none, **nothing renders** — an empty labelled block
asserts that something is missing when the plan simply does not work that way.
The field is always present while editing, so one can be added.

*The lesson worth keeping:* the merge happened because two labels looked
synonymous in isolation. The client's source document settled it, not reasoning
about the words.

---

### 2.9 A capability's words

**Key objectives** is deliberately the same term at the top of a business unit
and at the top of a capability. It is the same idea, and keeping one word is
what makes the two recognisable as the same kind of thing.

Everything below it changes word, because it changes nature:

| Business unit | Capability | Why the word changes |
|---|---|---|
| Pillar | **Project** | A project has a start, an end and a brief; a pillar is standing |
| Key measure | **Outcome** and **Deliverable** | Two different things: what changed, and what was handed over |
| Tactic | **Milestone** | A milestone is a date reached, not work in progress |

*Project, not initiative.* Both were in use. **Project** sits naturally with
brief, deliverables, milestones and end date, all of which are specified;
*initiative* reads vaguer in a strategy deck, which is where the confusion would
start.

**The word changes; the arithmetic does not.** An outcome is scored exactly the
way a unit's key measure is — target, actual, direction, band. "Outcomes, not
key measures" is a naming rule, not a second scoring engine. Read the other way,
someone will eventually build one.


## 3. Configuration

### 3.1 Labels

- **Per tenant**, not per cycle. A cycle-scoped label would let 2026 and 2027
  use different words for the same object, and no report spanning both could be
  read without a glossary.
- Configurable **at group and business-unit level** independently.
- **Managed by the SMO**, not the client.
- **Collisions blocked at save.** Two entities may never share a display label
  at the same level — two objects rendering under one word on the same screen
  is not recoverable by the reader.

### 3.2 Scoring bands — one scale

| Band | Floor | Colour |
|---|---|---|
| On track | 85% | green |
| Needs attention | 70% | yellow |
| At risk | 50% | orange |
| Off track | 0% | red |

**One scale for every figure scored against a benchmark.** Performance is actual
over target; execution is delivered over plan. Both are the same kind of number.

**The colour and the status word come from the same function.** This was a real
defect: a headline read 87% in green while the pill beside it said "Behind
plan", because the number was banded and the pill computed separately against
100. One source, no contradiction.

**Per tenant, one standing scale.** Moving a threshold rewrites how every past
report reads. 70 and 50 match the platform's existing `STATUS_THRESHOLDS`; 85 is
the added top edge. *Verify that against `src/lib/scoring.ts` — it is carried
from the handoff and has never been checked.*

### 3.3 Business units

The one place a unit is named. **Everything else references the unit's key**;
the name is display only.

*This fixed a real bug:* the weighting table matched units by name string, so
renaming a unit silently detached it from its weight with no error anywhere.

- **Retired, never deleted.** A unit carries pillars, measures, tactics and
  reported progress. Retiring stops it appearing; deleting would destroy a
  cycle's record. Retired units stay listed and greyed on Setup only.
- **Retirement means retirement everywhere.** One `activeKeys()` helper decides
  which units the product is currently about; the nav, the BU cards, the group
  compile and the weighting composite all ask it. Retiring a unit zeroes its
  weight, re-splits the live units to 100, and removes it from every rollup at
  once — it was originally only greying a Setup row while continuing to score
  the group.
- Each unit names a **BU head** (accountable) and an **Owner** (same access,
  does the work — entering results, adjusting the plan, reporting). Only people
  attached to the unit can hold either role. Separating them keeps *who may edit
  this* apart from *whose number is this*.

### 3.4 Clearing

Four actions, deliberately distinct:

| | Removes | Keeps |
|---|---|---|
| **Clear progress** (one unit) | Actuals and progress | The whole plan |
| **Clear plan** (one unit) | Pillars, measures, tactics, objectives, SWOT, foundation text | The unit, its name, code, roles, weight |
| **Clear all progress** | Every actual in every unit, and the group's own figures | All plans |
| **Clear all plans** | Every unit's plan content | All ten units and their configuration |

**Cleared means unreported, never zero.** A cleared measure reads *Not scored*
and a cleared tactic *Not reported*, and both are left out of every average.
Resetting to zero would report a unit as failing when nobody had yet said
anything.

### 3.5 Edit gating

Configuration and content screens open **read-only**. Editing is entered
deliberately. This applies to the foundation, the SWOT, the temple, business
unit weighting, the factor editor, the bands, the units page and the labels.

**Every editable field must be bound to a setter.** This was a real defect: the
foundation rendered textareas bound to nothing, so every edit looked accepted
and was silently discarded on the next repaint. Fields now register where they
write; an unbound field renders as read-only text, so it is visibly not editable
rather than quietly lossy.

---

## 4. The hierarchy

```
Organization                    shape = SINGLE_COMPANY | GROUP
 └── Strategy (per year)        horizon, asOfQuarter
      ├── Theme[]               ab, name, note
      ├── Capability[]          group-level pillars, no theme
      └── StrategyUnit[]        key, name, codePrefix, active, weight
           ├── Foundation       clauses[], aspiration, endInMind?
           ├── KeyObjective[]   target3y + target — targets only
           ├── SwotItem[]       s / w / o / t
           └── Pillar[]         kind = DIRECTION | CAPABILITY, one theme
                ├── Measure[]   direction, target, compile, actual, progress
                └── Tactic[]    q1–q4 flags, owner, collaborators[], actual
```

### Who holds what

| | Group unit | Business unit | Single company |
|---|---|---|---|
| Purpose, Core Values | yes | **no** — inherits | yes |
| Winning Aspiration | yes | yes | yes |
| End in Mind | optional | optional | optional |
| Who We Are clauses | yes | yes, **own labels** | yes |
| Key Objectives | yes | yes | yes |
| Themes | owns them | uses the group's | owns them |
| Directions | **no** | yes | yes |
| Capabilities | yes (cross-cutting) | yes | yes |
| Temple | yes | **no** | yes |

**Foundation content is rows, not columns.** The group uses *We are / Offering /
To / Through / Covering / Empowered by*; Mobile uses *We are / We provide / For
/ All Overall / We facilitate / Using*. Neither is a subset of the other.

### Identity

**Every item carries a stable id**, generated by the platform, carried by the
template, never typed: `{unitKey}-P1`, `{unitKey}-P1-M2`, `{unitKey}-KO3`,
`{unitKey}-ASP1`. Without them a re-upload cannot tell a corrected target from a
new measure, and duplicates a plan every time.

**Pillar codes are positional.** `MB01`, `RS01`, `NG01` — the number comes from
position and renumbers on reorder; the prefix says which unit. They reference
nothing outside the platform, which is why renumbering is safe. Had they been
quoted in decks, position would have needed its own column.

---

## 5. Scoring

### 5.1 Nothing is stored

Every figure is derived from the measures and tactics beneath it. A pillar
computes from its own content, a unit from its pillars, the group from its
units. A row and its expansion cannot disagree, because they are one
calculation.

*This was the last thing fixed:* group capabilities carried typed
`perf / exec / planned` and **no tactics at all**, so their execution figure
could not be checked against anything. They now hold measures and tactics like
any pillar and score through the same functions.

```
pillarPerf(p)   = mean of scorable measures' progress
pillarExec(p)   = mean of reported, due tactics' actual
pillarPlan(p)   = mean of reported, due tactics' planned
unitObjectives  = koScore(unit's Key Objectives, optional weights)
groupUnits      = weighted mean of unit headlines, at composite weights
```

### 5.2 The three readings

| Reading | Source | Where it appears |
|---|---|---|
| **Key Objectives performance** | The unit's own scorecard | The unit's headline, on its card |
| **Key measures performance** | A pillar's measures | The BU page, per pillar |
| **Execution performance** | Tactics | Both — per pillar, **and** rolled up |

**What travels upward:** execution, because key tactics are worth watching from
above even though they belong to a pillar. Measure performance does not — a
pillar's measures are internal to that pillar.

**Naming.** Both are *performance*; what differs is what is performing. The
earlier pair — "Performance" and "Execution" — read as a quality beside an
activity and did not scan as a pair. *Tactical performance* was rejected:
**tactical** as an adjective drifts from **Tactic** as the entity.

### 5.3 The group figure — the double average

**`Business units performance` = the weighted average of unit headlines.** Not a
pooled reading across every objective.

**Reasoning.** A BU head's number must mean the same thing on their own page as
on the group page. The alternative was tested and rejected: pooling every
objective flat lets whoever writes the longest scorecard override the negotiated
weights. With Mobile 4 objectives at 62%, Retail 4 at 86%, Mazaya 12 at 40% and
weights 45/31/24 — average of averages gives **64%**, pooled flat gives **54%**,
and a unit worth 24% supplies 60% of the inputs.

### 5.4 Key Objectives may carry weights

Optional, within a unit. Unweighted means equal — the one default nobody has to
argue for in a quarterly review. Where weights are set they total 100.

It changes what that unit's headline says; it does **not** give the unit more
influence at group level. And it must propagate: the headline on the BU page and
the figure in the group compile are the same computed number.

### 5.5 Quarters are flags, not a span

A tactic carries `q1 q2 q3 q4`. Real work skips quarters — a plan can run Q2 and
Q4 with nothing in Q3, and a span cannot say that.

**This is what finally makes `planned` derived rather than stored.** What a
tactic should have delivered by now is the share of its own active quarters that
have passed:

```
planned = (active quarters up to asOfQuarter) ÷ (active quarters) × 100
```

A tactic running Q1–Q2 reviewed at H1 is due at 100%; one running Q2–Q4 at 33%.
`asOfQuarter` is 2 for an H1 review.

*Reversed from:* start and end columns, which cannot express a gap.

**Display:** a marked quarter is tinted whether or not it has passed; only the
fill separates passed from ahead. Unmarked quarters are dashed and grey. Before
this, a marked-but-future quarter looked identical to an unmarked one, and a
tactic running Q2–Q3 read as running Q2 only.

### 5.6 Three states a tactic can be in

| State | Condition | Scored |
|---|---|---|
| **Not yet due** | its quarters have not started | no |
| **Not reported** | due, but nothing entered | no — shows what it is due at |
| Reported | delivered against plan | yes |

Only the third enters an average. Previously "due but unreported" averaged in as
zero, reporting a unit as failing at the start of a cycle when nobody had typed
anything. The same trap existed on import, where a newly created tactic arrived
at `actual: 0` — so a plan read as failing on the day it landed.

### 5.7 null is never 0

A missing number and a failing number must never look the same.

- A measure with **no target** is recorded and reads *Missing* / *Not scored*.
  Excluded from the mean, never counted as zero.
- Averages **drop nulls** rather than counting them.
- Highest and lowest read the **scored** items only. `Math.max` over a list
  containing null treats null as zero, and an unscored measure was reporting a
  lowest of 0% — exactly the false failure the rule exists to prevent.
- One `pct()` function renders every score, so a null reaches a screen as a dash
  by construction rather than by each call site remembering.

### 5.8 Execution is a ratio

```
execution = delivered ÷ should-be-delivered × 100
```

**100% means exactly on plan, not finished.** The raw pair and the variance stay
visible beneath the ratio.

*Known weakness, stated accurately:* the quarter flags are typed. Marking a
tactic Q1–Q4 instead of Q1–Q2 lowers the planned line. The manipulation moved
one field over; it did not disappear. Any control belongs on changing quarters
after a cycle opens.

### 5.9 Focus measures

The CEO marks a few measures per unit as the ones carrying reward. A focus
measure can be a unit's Key Objective **or** a key measure under any direction
or capability.

**Focus changes no score.** The unit headline, the pillar figures and the group
compile are computed exactly as without it. Unit weights already decide how much
a unit counts, and letting focus alter scoring would count the same emphasis
twice and make the group figure impossible to explain in a room. **No
compensation arithmetic lives in the platform** — it reports standing; the
scheme pays.

**One rule, not a target per measure.** Where reward begins is a property of the
cycle — `CYCLE.rewardAt`, set once on Setup — not a stretch target negotiated
row by row. At 100%, delivering the commitment earns. Set it higher and a fourth
standing appears between short and earning:

| Standing | Condition |
|---|---|
| Short | progress below 100% |
| Met, not earning | at target, below the reward line (only when the rule is above 100) |
| Earning | at or above the reward line |
| Not reported | no figure |

**A mark, not a label or a column.** The row already carries six numbers; a word
beside every marked one turns a quiet signal into a column of shouting.

**Reporting reads like the Performance page.** Key Objectives get their own
section with a completion tally; each pillar is a collapsible row carrying its
kind, its counts and how much of it is done; inside, measures and tactics are
separate tables with full headers. The entry box **states the measure's unit**
as a fixed suffix rather than asking for it to be typed, and rejoins it on save
— actuals are stored with their unit, so a field showing `28%` beside a `%`
suffix would read as *28% %*, and storing a bare `2.7` would break every screen
expecting `2.7B EGP`.

**Marked in Setup, read everywhere else.** Marking lives on **Setup → Focus
measures**, not inside a unit's page. *This reverses an earlier decision:*
marking inline was proposed so the choice sat beside the evidence, and it was
wrong — a marking mode inside a page whose normal job is reading invites a stray
click on a decision that carries money. The setup screen keeps the evidence by
showing every target beside its measure. Available to the CEO, and to the SMO
acting on their behalf. The group **Focus board** reviews all units at once.

**Every cycle starts unmarked.** Marks are stored against the cycle, not against
the measure, so last year's emphasis cannot quietly become this year's default.
**No cap** — three is the usual choice and stays a choice. Marks lock when the
cycle opens.

**A unit sees only its own**, as a panel on its Performance page — placed
**below the two headline boxes and above the pillars, closed by default**. It is
a lens on a few measures, not the unit's headline; opening the page to it put a
nine-row table where the score should be. Collapsed, it is one line: *1 of 3
earning*, the standings, and the rule. The
board is the CEO's and the SMO's. What another unit is rewarded on is not its
business, and a league table nobody asked for is the fastest way to make this
political.

**The strip leads with a count, not a mean.** Three measures at 163, 44 and 97
average to 101, which reads as *just there* when one is earning and two are
short. Reward is won per measure, so the count is the situation; the mean sits
second and quiet.

**Progress is not coloured on focus tables.** The band scale answers *is this on
plan*; the standing answers *does this earn*. A measure can read 88% and green on
the band while being short of the reward line, and colouring both in one row
makes the table argue with itself.

### 5.10 Milestones are gone

A milestone was a measure with no number, counted beside the score and never
averaged. Only one existed. A Go/No-Go decision is work with an owner and a
quarter span — which is a **tactic**. Modelling it as a special kind of measure
bought nothing and cost a storage shape, a branch in every table, and its own
tests.

---

## 6. Business unit weighting

### 6.1 The composite

Weights are **composed from factors**, never typed:

| Factor | Weight | Type |
|---|---|---|
| Revenue contribution | 40% | derived |
| Profit contribution | 30% | derived |
| Impact on group | 20% | judgement, carries a written reason |
| Potential growth | 10% | estimate |

```
share of a factor = unit's value ÷ sum of all units' values
contribution      = Σ (factor weight × that unit's share)
```

For Mobile: (40% × 28%) + (30% × 22%) + (20% × 13%) + (10% × 5%) = **21%**. The
ten contributions total 100%.

**Weighting rows are keyed by unit key, not name** — the same rename rule as
everywhere else. They were matched by display name long after this document
claimed otherwise, so renaming a unit silently detached it from its factor row.
The claim is now true.

**Every weighting field is bound.** The forty per-unit value inputs rendered as
editable and saved nothing for two sessions — the same unbound-field defect the
foundation had, surviving because that fix bound one page's fields without
auditing the rest. The audit rule that follows: any input without a `data-`
binding is a bug by definition.

**A rejected argument, recorded so it is not remade.** It was proposed that
revenue and profit correlate and should merge into one "scale" factor. **False
for Raya's data** — Retail is 29% of revenue but 36% of profit; it is the
higher-margin unit and the two factors say different things about it.

**Factors are rows, not fixed columns.** Adding one is data entry, not a
migration. Each declares its type, which decides how values are captured; all
three convert to shares identically so the arithmetic never branches.

**Weights must total exactly 100.** Blocked, never silently normalised —
normalisation gives an answer nobody asked for, with no error to explain it.

**The written reason for Impact on group lives in edit mode only.** It is what
makes a judgement defensible, so it stays where the judgement is made and off
the reading view, where it turned one column into a paragraph.

### 6.2 Scope and change

**Per cycle**, not per tenant. Each year takes insight from the last, so the
previous cycle's split is shown beside the new one.

**A mid-cycle change is allowed and exceptional.** The SMO is warned that
reported performance will move, and only while editing.

**Why this differs from a target, deliberately.** A **target** freezes at
reporting via `targetSnapshot`, because it is a commitment made to a specific
owner and moving it rewrites what that person was judged on. A **weight** is
group governance: when it changes the group figure legitimately recalculates,
and the warning makes that visible rather than silent. **This is not an
inconsistency to be cleaned up later.**

### 6.3 Depth

Business units carry weight. Key Objectives may optionally carry weight within a
unit. **Pillars and measures remain unweighted** — see §11.

---

## 7. Access

### 7.1 Page level only

If a level can open a page, it sees **everything on it**. Restriction happens by
removing the page, never by trimming its contents.

Per-element permissions make a system nobody can reason about: every new field
becomes a permission question, and nobody can answer *what does a BU head
actually see* without reading the code.

### 7.2 Three states per cell

`none` / `view` / `edit`. The CEO views the weighting table but does not manage
it — visible and editable are different grants, and collapsing them would either
lock the CEO out or hand them the model.

### 7.3 A person is a level plus a unit

**Level** decides which pages — CEO, N-1, N-2, N-3. Levels replace job titles so
the model travels between clients; each tenant maps its own titles on.
**Unit attachment** decides whose. Two people at N-1 reach the same page types
but different units; a person attached to the group reaches every unit.

**The SMO is not a level.** It is a super user beside the ladder — an SMO
manager might sit at N-2 and still need rights no N-1 has.

### 7.4 Pages

| Scope | Pages |
|---|---|
| Group | Performance · Foundation · Focus · Temple · Weighting |
| Business unit | Performance · Foundation · SWOT · Reporting |
| Setup | Labels · Levels & access · Scoring bands · Business units · Focus measures · Import |

### 7.5 Reordering follows access

**Order is stored on the object and shared**, which is why it needs permissions
at all — a personal view preference would need none.

| Who | May reorder |
|---|---|
| SMO | Everything |
| BU head / owner | Their own unit's pillars, measures and tactics |
| Everyone else | Nothing — the handle is not rendered |

**A mode, not a permanent affordance.** One **Arrange** button per page; **Done**
returns it to static. **Drag by handle, never by the row** — a pillar row is
already a click target that expands it. Arrow keys move a focused handle, since
a drag that only works with a mouse locks out anyone who cannot use one.

**Insertion is found by closest edge, comparing both axes** — not by vertical
midpoint. The same code serves table rows stacked vertically and cards side by
side in a grid; comparing only vertical position silently does nothing in a
grid, where every card shares a row.

**Two lists that must move together.** Reordering business units also reorders
the unit navigation; reordering themes moves the temple. A unit first on the
group page and third in the tab bar makes the arrangement look like it did not
take.

**Order never touches the maths.** Reordering business units leaves the group
figure unchanged; weights determine influence, position determines nothing.

---

## 8. Screens

### 8.1 Navigation

```
[ Group ] [ Mobile ] … [ Nigeria ] │ [ ⚙ Setup ]
```

Group Performance's four sections are a **third nav row**, not one long scroll —
roughly 1,050px per section against 2,600px scrolling. The section heading is
dropped in that mode; the tab already names it.

### 8.2 Chrome

All nav rows sit in **one sticky container**, condensing on hysteresis
(condense at 70px, expand at 20px). Its height is observed with a
`ResizeObserver`, not measured at chosen moments.

*Two defects this replaced.* The original measured `header.offsetHeight` on
every scroll frame and wrote it into the layout — while the header was
mid-transition, so it was measuring an animation and feeding the result back
into itself. The first fix then measured once at load, before the tab row was
populated, so the sticky pillar header pinned too high and hid behind the nav.

### 8.3 The card — settled after six iterations, not reopened

```
┌─────────────────────────────────┐
│  Mobile                         │  ← dark navy header
│  21% weight · 4 pillars         │
├──────────────────┬──────────────┤
│  OBJECTIVES  ⓘ   │ EXECUTION ⓘ  │
│      ◕ 60%       │     98%      │
│                  │   OF PLAN    │
│                  │  Delivered43%│
│                  │  Planned  44%│
│                  │  Variance  −1│  ← only coloured figure here
└──────────────────┴──────────────┘
```

- **Colour appears exactly twice: the dial, and the variance.**
- Execution is *smaller, not fainter*.
- The **ⓘ is not a +** — it explains a number, never creates.
- Cards hold a **330px minimum**. Below that the execution box truncates its
  labels; both grids share the minimum so a card is the same card wherever it
  appears.
- Grid tracks are clamped with `minmax(0, ·)`. A track defaults to
  `min-width: auto` and never shrinks below its content, so a card gets pushed
  open from the inside.

### 8.4 The Objectives/pillars gap — resolved as "leave the card alone"

Pillar measures performance stays on the BU page, per pillar. No divergence flag
on the card, no third colour, no threshold.

Pillar performance is a pillar-level concern. A pillar's measures may include
detail that lowers its reading while the unit's objectives are going well — the
two are not in contradiction, they are at different altitudes.

### 8.5 Pillar list

A **table that expands**: column headers once at the top, not a label repeated
under every value. The separate "where the unit figure comes from" table was
deleted — it repeated the same pillars with the same numbers, and its total row
moved into the list where a total belongs.

Two behaviours, one problem: a **sticky header** keeps the column meanings, and
the **accordion** (one pillar open at a time) stops the list becoming unreadable.

**Panels open and close independently — there is no accordion.** This took three
attempts and the reasoning is worth keeping, because the first two both looked
correct when measured.

1. *Scroll the opened row to the top.* Threw the page ~350px on every click.
2. *Anchor the clicked row so it cannot move.* It did not move — 0px, measured.
   But holding it still while a panel **above** it collapsed meant scrolling the
   window **785px**, so everything else on screen changed at once. The row was
   the wrong thing to hold: what the eye tracks is the page, not the row.
3. *Stop closing other panels.* Opening only ever adds height **below** the
   clicked row, so nothing above it moves and no correction is needed. Measured
   movement on open: 0px for the page, the row, and the content above it.

The accordion existed to stop the list becoming unreadable with several pillars
open. That is a smaller cost than a page that lurches on every click. The one
remaining movement is closing a panel near the foot of the page, where the
document becomes shorter than the current scroll and the browser clamps.

**One control opens or closes them all**, beside the first column header: arrows
apart to unfold, arrows together to fold. Drawn as SVG rather than typed as a
glyph, because at 15px a character renders differently in every font and the two
states have to be told apart at a glance. It shows what pressing it will do
rather than what the state is, and it follows the rows — opening the last panel
by hand flips it to fold.

Tables carry a row number in a narrow first column; the row's conclusion —
*Progress* for a measure, *Of plan* for a tactic — is the last column and
carries the band colour. Row numbers renumber live while dragging, so the
position being chosen is visible before the drop.

### 8.6 Foundation and SWOT

Static records with an Edit button. No lede, no explanatory notes, no content
bar — Edit is a bare button above the columns.

Key Objectives sit **inside the aspiration card**, beneath the statement, as
**targets only**: a three-year and a this-year column, no actual, no progress,
no colour. Two layouts, toggled — **cards** (default) and columns. The horizon
is a **field beside the title**, not words inside the statement, so changing the
year is one edit and not a rewrite of every unit.

SWOT points are numbered, the numbers grey, so a review can refer to
"weakness 3".

### 8.7 The temple

A **view, not a scoreboard**: roof, aspiration, objectives with targets only,
themes as columns, capabilities as the base. **No performance figures.**

**Edited as tables, saved as the temple.** A picture is an awkward thing to type
into. A theme's code is what every pillar points at, so renaming one **carries
its pillars with it**, and a theme in use **cannot be removed** — deleting it
would leave its pillars pointing at nothing and quietly absent from every theme.
Removing an objective with a reported actual, or a capability with work under
it, **asks once** — a row still empty goes without ceremony.

**Edit modes drop on unit switch.** Entering Edit on one unit's foundation and
switching units used to land you editing the next unit without asking — the
flag was global. Edit is a decision about the thing being edited, not a lamp
that stays on while you walk around. Saved edits survive; only the mode drops.

### 8.8 Presentation mode

A unit's review, **assembled when it is opened** from whatever the platform
holds at that moment. There is no exported copy and no version to go stale.

**A mode, not a page.** Opened by **Present** in the action bar on a unit's
Performance page, beside Arrange. It takes the whole window; Esc or Exit returns
to exactly where the presenter was. Available to anyone who can view that unit's
Performance page.

**One shape everywhere.** Slides are authored at a fixed **1600×900** and scaled
to fit, so what is rehearsed is what projects. Fit-to-window is a toggle for an
odd display, not the default — filling the window means the slide is a different
shape on every machine, and line breaks and rows-per-slide change with it.

**Sequence:** cover · what we are aiming at (targets only) · the two headline
readings · objectives in detail · SWOT cover and four categories · pillars
overview · then per pillar a lead-in, its measures and its tactics · the owner's
note · what needs attention · thank you.

**Long tables squeeze, then split.** A slide that overruns is tightened first;
only at the floor does its table continue on a second slide marked *continued*.
Continuations are themselves splittable, or a long table stops one slide short
and quietly overflows. This runs once on open, so nothing reflows mid-review.

**The notes are the validation.** Every note written during reporting travels
into the deck beside the figure it explains, and the closing summary gathers
everything at risk or off track with what is being done. The owner is already
required to write those notes; nobody writes the explanation twice.

**Only the owner's note is editable.** Changed in the room, changed in the
platform.

### 8.9 Table headers

**Dark ground, white type**, on every table and on the grid headers that behave
like one — the pillar lists and the grouped lists in Setup. A column header is a
label for what sits beneath it; at this weight it reads as one band rather than
as a first row of data, and no screen carries two different ideas of what a
header looks like.

### 8.11 Two roles on a unit: head and Strategy custodian

**The head is the owner.** A business unit's head owns the unit by definition, so
nothing else on a unit should claim that word.

The second role is the person who **holds the strategy on the head's behalf**:
keeps the plan current, makes the entries, does the reporting, sits with the SMO
and often presents. That is stewardship, not ownership — hence **Strategy
custodian**. *Mennah Farouk — Strategy custodian, Mobile.*

*This renames an earlier field.* `UNIT_ROLES.owner` became
`UNIT_ROLES.custodian`, because "owner" was carrying **three** meanings at once:
the unit's second person, a pillar's owner, and a tactic's owner — and the first
of those contradicted the head.

**"Owner" survives on pillars and tactics**, where it means responsibility for a
piece of work rather than access to a unit. Those are unambiguous in context and
were left alone.

### 8.12 Explanation

Inline explanatory copy was removed from every screen. It lives in two places:

- **ⓘ beside a figure** explains *that figure*.
- **Info**, top right of the page chrome, explains *how the page works*.

They never repeat each other. This document remains authoritative — if a
decision changes, it changes here first and the Info follows.

*A tooltip sets its own `white-space`.* Inside a table header, where `nowrap`
keeps column titles on one line, a tooltip inherited it and ran off the edge as
a single line.

---

## 9. Import and export

### 9.1 Who does what

| | Who |
|---|---|
| Create a plan — sheet or in-platform | **SMO** |
| Record progress — in the platform | BU head or Owner |
| Upload progress by sheet | **SMO only** |

**Two reversals from the handoff**, both deliberate:

*Decision 6* said no recorded progress → CREATE, and the plan owner may upload.
The plan owner no longer uploads.

*Decision 5* said the importer has **no code path** to `MeasureEntry` or
`TacticProgress` — an architectural absence, not a permission, because a
mid-cycle upload overwrites numbers owners entered. It now needs that path,
gated to the SMO.

**The protection that absence provided is replaced by:** nothing is applied on
arrival. The file is compared against what is recorded and the differences are
confirmed by a person.

### 9.2 The Excel workbooks

The CSV is a machine format wearing a spreadsheet's clothes — one flat table, 22
columns, ids and parent_ids. Nobody should fill that by hand.

**The workbook is shaped like the plan**: one sheet per part, each with only its
own columns.

| Plan workbook | Progress workbook |
|---|---|
| Read me · Foundation · Aspiration · Objectives · SWOT · Pillars · Measures · Tactics | Read me · Objectives · Measures · Tactics |

- **Measures and tactics choose their pillar from a dropdown of pillar names.**
  Nobody types a parent id — ids are the largest source of hand-fill error.
- Direction, compile, kind, theme and the quarter columns are lists, which
  removes most of what the validator exists to catch.
- **ID is grey and last.** Blank means new; filled means the platform holds it
  and will update rather than duplicate. A fresh template and a filled download
  are the same file in two states.
- Targets split into **value and unit** — `30` and `%`, not `"30%"`.
- The progress workbook covers **Key Objectives as well as** measures and
  tactics. Without them the unit headline — the number the whole page is built
  on — was unreportable.

**Written and read with no library.** An `.xlsx` is a ZIP of XML; entries are
stored uncompressed on write, and `DecompressionStream` inflates on read.
Requires Chrome 80+, Safari 16.4+, Firefox 113+.

**Excel omits empty cells entirely**, so every value is placed by its own cell
reference. Reading by position shifts a whole row left the moment one cell is
blank.

**Renaming a pillar does not orphan its rows.** A child names its pillar rather
than carrying its id — and the dropdown's list is fixed text inside the file, so
it cannot help after a rename. Anything the platform already holds falls back to
the parent it currently records.

### 9.3 The CSV contract

Column order:

```
id, type, parent_id, source_slide, name, description, outcome,
owner, collaborators, direction, value, value_3y, unit, horizon,
compile, q1, q2, q3, q4, theme, kind, notes
```

Row types: `PLAN · FOUNDATION · ASPIRATION · NORTHSTAR · STRENGTH · WEAKNESS ·
OPPORTUNITY · THREAT · PILLAR · MEASURE · TACTIC`.

**This follows the strategy team's deck-extraction format** so a file built for a
deck loads without reshaping. Three columns were added — `value_3y`,
`collaborators`, `kind` — and `owners` was split into `owner` + `collaborators`.
Older files still load: a piped `owners` column is split on arrival, a single
piped FOUNDATION row is expanded against the unit's labels, and `kind` falls
back to reading `notes`, where the source deck writes it as prose.

**`source_slide` is preserved and written back**, so a plan exported a year later
still says where each line originated.

**`horizon` on a measure is carried, not acted on.** Targets are annual; a note
such as `H2` records when the owner intends to measure and changes no scoring.

**Idempotence is the test that matters.** Export a plan, re-import it untouched:
zero changes. Verified across units, after importing a real deck file, and
against a workbook resaved by Excel itself.

### 9.4 File-shape checks, then validation

Before any row is examined, two whole-file checks run. **A file for the wrong
unit is refused**: every id carries its unit's key, so a file whose ids mostly
belong to another unit names that unit and asks for the toggle to be switched —
applying one would duplicate a whole plan into the wrong unit under foreign
ids. **A file of the wrong kind is refused**: a progress file under kind=Plan
otherwise reads as a near-empty diff, which looks like an answer while being
the wrong question.

### Validation

**Problems block the apply; notices do not.** Bad data that loads silently is
worse than a file that refuses to load — a pillar with a theme code that does
not exist would be created, render nowhere, and be found months later by someone
wondering why a theme looks short.

| Problems | Notices |
|---|---|
| Unknown theme · direction not ≥/≤ · compile not Sum/Latest/Average · unmatched pillar · duplicate id · missing id or type | No target set · no quarters marked · pillar has no theme |

### 9.5 Create, update, and what is never done

- Rows with an unrecognised id are **created**, not merely reported. Pillars
  before their children, so a measure finds its parent whatever the file order.
  Without this, the review promised "8 new" and applied none of them, and
  loading a unit's first plan imported nothing.
- A newly created tactic arrives **Not started with nothing reported** — zero
  would read as started-and-delivered-nothing on the day a plan lands.
- **Absent is not deleted.** An item in the platform but missing from the file
  is reported, never removed. A missing row is far more often an editing slip
  than a decision to delete something with reported history.
- **The status pill follows the reported number.** A tactic reported at 100%
  becomes Done; one reported above zero stops being Not started. Statuses the
  number cannot infer are left alone.
- **Applying leaves a receipt** — what changed, what was created, and a link to
  the unit — rather than the review silently vanishing.
- **Progress is recomputed, not typed.** The sheet carries the actual; what it
  means against the target is worked out on arrival, so a stale percentage in a
  spreadsheet can never contradict the platform.

---

## 10. Decisions carried forward from the handoff

Unchanged, with their original reasoning:

1. **Directions and Capabilities are one entity with a `kind`.** Structurally
   identical; two tables would mean two health calculations to keep in agreement
   forever.
2. **A null theme means cross-cutting, not missing.** The temple base sits under
   all three columns.
3. **Foundation content is rows, not columns.**
4. **Foundation persists across years; pillars are annual.**
5. **A reported score never changes retroactively.** `targetSnapshot` and
   `plannedSnapshot` freeze the benchmark at entry. *(See §6.2 for why weights
   are deliberately exempt.)*
6. **Planning cadence and review cadence are independent.** Quarters are the
   planning grid; a ReviewCycle covers a span and is where actuals land.
7. **Tactic tasks are separate from the Action Tracker (spec 011) —
   deliberately.** The Action Tracker is the SMO's internal tool; merging would
   expose it to every BU head. **Must not be "cleaned up" later.**
8. **Ownership attaches to the object, not the org chart.**

---

## 11. Still open

| # | Question | Note |
|---|---|---|
| **G** | What happens to an unfinished tactic at year end — carry forward with history, or restart? | Recommendation: explicit rollover, never automatic, so someone must say "this is still worth doing" once a year |
| **G′** | What happens to execution if a tactic is **removed** mid-year? | A tactic contributes to both delivered and planned; removing it moves both |
| **H** | The ELABD single-company shape — does section 2/4 become directions, or does a single company get three sections? | Out of scope until the group shape is finished |
| **D′** | Do pillar measures get optional weighting like Key Objectives? | Currently equal-weight always |
| — | Import reconciliation: per-row accept, or all-or-nothing? | Currently all-or-nothing. Per-row is a reconciliation screen, a much larger build |
| — | **Group import.** The group's own foundation, objectives and eight capabilities have no template | To be entered manually for now |
| — | Reconcile levels with the **existing** role model in specs 001–011 | Cannot be checked from outside the codebase. **Do not build a second role system beside the first** |
| — | SWOT ids are **positional** — `S3` means "whatever is third". Reordering rewrites them | Accepted deliberately |
| — | Quarter flags are typed, so a soft plan can still flatter the ratio (§5.8) | No control designed |

---

## 12. What changed since the handoff — for test reconciliation

The scoring engine has **121 passing tests** encoding the original decisions.

| Change | Test impact |
|---|---|
| `GROUP.pillars` → `GROUP.themes` | Naming only |
| Two aspiration statements, End in Mind optional | Foundation shape; no scoring test |
| Key Objectives may carry optional weights | **New logic** — `koScore(list, weights)`. Unweighted must return the identical value to the current mean |
| All figures derived, none stored | Any test reading a stored `perf.*` needs rewriting |
| **Quarter flags replace start/end** | `quartersInSpan` and `expectedCompletion` are replaced by `tacticPlanned` from flags. **Every span test is rewritten** |
| Three tactic states — not due / not reported / reported | New: reported-ness is separate from due-ness |
| **Milestones removed** | Milestone assertions in T004 come out |
| One band scale; status word derives from it | Any test asserting "Ahead of plan" / "Behind plan" changes |
| Nulls dropped from averages, never counted | Pins the no-target and cleared cases |
| Pillar codes positional | `code` leaves the record; `pillarCode(unit, index)` replaces it |
| Order stored on the object | New: a persisted sort position per list |
| Importer gains a path to progress data, SMO-gated | **Reverses handoff decisions 5 and 6** |
| Weights not snapshotted; mid-cycle change warns | **Reverses** the weight-freezing assumption |
| Capabilities gain tactics and derive | New: capabilities score identically to pillars |

`05-spec-STALE.md` and `06-plan-STALE.md` remain wrong in every way listed here
plus the five the handoff named. **Rewriting them against this file is the first
job on the new branch.**

---

## 13. Data honesty

**Only Mobile's plan content is real**, transcribed from the Raya Trade 2026
decks and later loaded from the team's own extraction file.

- **The other nine business units are invented** — foundations, objectives,
  SWOTs, pillars, measures, tactics.
- **Every reported actual is invented, including Mobile's.** Ten of the 116
  measures were deliberately lifted above target: a dataset in which nothing
  anywhere beat its plan is itself an artefact, and it left whole states of the
  product — every focus standing above *short* — impossible to see.
- The eight group capabilities carry **real names** from the Strategy Temple
  slide; their definitions, measures and all their tactics are invented.
- The 24 people, their levels, unit attachments and role assignments are
  invented, except where a name appears as an owner in Mobile's real plan.
- The four weighting factor values per unit are invented for all ten.

**Nothing here should reach a client with the invented content still in it.**

---

## 14. Files

| File | What | Lines |
|---|---|---|
| `strategy-management-platform.html` | The full mockup. Single file, no dependencies, works offline | — |
| `DECISIONS-AND-LOGIC.md` | This document | — |
| `src/group-data.js` | All plan content | 739 |
| `src/config-data.js` | Labels, levels, access, bands, derived scoring | 496 |
| `src/group-render.js` | Performance, temple, foundation, SWOT views | 1053 |
| `src/config-render.js` | Setup pages and the import flow | 488 |
| `src/templates.js` | CSV templates, diff, validation, apply | 463 |
| `src/xlsx.js` | Workbook writer and reader, no library | 535 |
| `src/pageinfo.js` | Page-level Info content | 305 |
| `src/arrange.js` | Drag-to-reorder with keyboard equivalent | — |
| `src/shell.html` | Navigation, access filtering, event wiring | 608 |
| `src/*.css` | Styles | — |
| `src/build.py` | Assembles the single file | — |

Rebuild with `python3 build.py` from `src/`. The output is byte-identical to the
shipped file — verified on every change.

### A note on class names

The navigation owns `.units`, `.tabs` and `.prow`. Reusing those names elsewhere
silently inherits nav styling — a table given `class="units"` had its buttons
rendered white-on-white and invisible. Prefix new component classes.

### A note on what caught the bugs

Almost every defect in this document was found by an automated walk that loads
every page as every viewer and asserts no console errors — not by looking at
screenshots. Two renderers were deleted by a careless edit and only the walk
noticed. Keep that harness.

---

## 15 · The project model — built in 1.7

A capability stopped being a pillar. This section replaces what §15.2 and §15.3
said about it, and reverses one thing they got wrong; the old wording is quoted
where it matters rather than deleted, because a reversal that hides what it
reversed is not a record.

### 15.1 What a capability carries

**Key objectives — optional.** Some capabilities hold interrelated projects
serving one number at the top; others are a portfolio of unrelated work with
nothing meaningful above them. Where there are none the card is **hidden, not
shown at zero**. An invented target is worse than an absent one, because it will
be reported against and someone will manage to it.

They weight exactly as a unit's key objectives do. This was argued the other way
first — Claude proposed optional, Islam called it always-three, then reversed to
optional in the same session. Optional stands.

*The cost, accepted:* project performance is the primary card where there are no
key objectives, and key objectives is primary where there are. The eight
capabilities no longer line up card-for-card, so the group capabilities table
should rank on **project performance**, which all eight have.

**Projects.** One project serves exactly one capability. Shared projects were
ruled out as a complication with no current need.

### 15.2 A project's two sides — REVERSAL

> §15.2 previously read: *"progress has a single definition: milestones
> completed, never typed."*

That is now wrong, and only half right at the time. Milestones are the
**execution** half. A project also has a **performance** half, and it has two
parts:

| | What it is | How it reads |
|---|---|---|
| **Deliverables** | What the project hands over | Delivered / not, or a percentage |
| **Outcomes** | What changed because of it | Always a measure, with a target |
| **Milestones** | The timeline | Completed, in progress, not started |

Deliverables and outcomes were one list at first. They split because they behave
differently in time: **a deliverable finishes and stops moving; an outcome only
starts reading once the deliverables land, and keeps moving after the project
closes.** Averaged together the number is part output and part effect, and low
for months for two entirely different reasons.

The split also simplified the model rather than complicating it. The *three
kinds* a deliverable could take were a symptom of two different things sharing
one table. Separated, a deliverable has two kinds and an outcome has one shape.

**Why a deliverable is not a milestone.** A milestone answers *when* — it
carries a finish date and is reached or not. A deliverable answers *whether* —
it is a thing that now exists, and can be half-built. If a row cannot be given a
finish date it is not a milestone; if nobody receives it, it is not a
deliverable.

### 15.3 How a project's performance is computed

**Half from each side, per side and not per row.**

```
delivSide(p)  = mean of reported deliverables    (yes = 100, no = 0, or the %)
outcomeSide(p)= mean of outcomes whose measurement time has arrived
projPerf(p)   = delivSide × 0.5 + outcomeSide × 0.5
capPerf(c)    = mean of its projects' projPerf
capExec(c)    = milestones completed / milestones total
capKO(c)      = weighted mean of its key objectives, or ABSENT
```

Per side matters. Four deliverables and one outcome still weigh 50/50, because
they are two kinds of evidence that the project achieved what it set out to, not
six comparable items. Averaged per row, the outcome would carry a fifth of the
weight and the number would quietly become *how much did we produce* — which is
the thing the split existed to prevent.

**An outcome names when it will be measured**, and before that time it is
**absent from the arithmetic, never zero**. Forty hours a month cannot be saved
by a form that does not exist yet. If unmeasured outcomes counted as zero, every
project in the platform would sit near 50% for most of its life for a purely
structural reason and the number would stop distinguishing a good project from a
bad one.

Measurement time is explicit rather than derived from "once the deliverables are
done", because anything with a lag needs a quarter of data before it means
anything.

**The consequence, stated so it is not reported as a bug:** a project's
performance can **fall**. The Oracle sample read 88% on deliverables alone
before Q2, then 69% when the first outcome came in at half its target. That drop
is the project's real story.

### 15.4 The overrun rule

A milestone whose finish date falls after its project's end date is **saved
exactly as entered. The platform never refuses it.** It is said out loud, and
the two things that might be true are offered without either being applied:
extend the timeline, or let the overrun stand.

This came from Islam's own sample, which violates it: the project ends 30 Apr
2026 and two milestones finish in May. A rule that refused the date would have
made the real project unenterable.

### 15.5 The tabs — plan separated from performance

The plan and the reading of the plan stopped sharing a page.

| Business unit | Capability |
|---|---|
| **Performance** (opens first) | **Performance** (new, opens first) |
| Foundation | — |
| SWOT | — |
| **Strategy** (new) — the plan, no figures | **Projects** — the plan, no figures |
| My reporting | **Reporting** |

A capability has three tabs against a unit's five: it has no foundation or SWOT
of its own, because its foundation is the group's.

*Plan means plan.* Nothing on Strategy or Projects has been reported — no
progress, no status, no actuals. The one thing on those pages that looks like
status and is not: a milestone date tinted because it falls after the project's
end. That is plan against plan, and needs nobody to report anything.

### 15.6 The rail

A list on the left that does not scroll away, beside the one thing being read on
the right. It replaces the accordion wherever a page is a set of siblings worked
through one at a time.

It was drawn twice. The first attempt added a *previous / next project* bar at
the foot of an expanded accordion body, plus remembered cross-page state — both
invented, both rejected as confusing. The rail is Islam's own proposal and it
disposes of both problems at once.

**Where it earns most: reporting.** The rail carries each project's tally, so
while entering one project you can see the state of the others. An accordion
cannot do that — inside one body, the others are invisible.

**What is open travels between tabs.** Which project is open belongs to the
capability, not the page, so it keeps its place across Performance, Projects and
Reporting. This is *not* hidden state, and that distinction is the whole
argument: the rail shows the selection the entire time, so it staying put is
what a person would expect rather than something they must be told.

**On a unit it groups by kind.** Directions and Capabilities are different
things and the rail says so. A capability's projects have no such split.

**Below two items the rail does not draw** — one sibling is no siblings, and a
rail of one is a column of wasted width. The pane fills it.

*Costs, all accepted:* it is a new pattern, nothing else in the platform picks a
thing this way; it does not print, so presentation mode and export need the
items laid out one after another; and below ~820px it becomes a row of tabs
above the pane.

### 15.7 A defect found while building this

Capability reporting inputs were rendered in 1.6 and **bound to no handler at
all**. A figure typed into a capability's reporting page was discarded on the
next repaint, silently. It is wired now, along with the milestone and
deliverable pickers.

Progress is **not** recomputed when an actual is typed. That is not an
oversight: a unit's reporting page does not recompute either — a reported actual
carries its score in from the cycle — and the two pages have to behave the same
way.

### 15.8 Ideas kept, not taken

**Grouping the unit rail by kind.** The rail was first drawn with *Direction*
and *Capability* as headings inside it. Removed: the kind is already on the item
itself, and splitting a four-item rail bought nothing. Worth revisiting only if
a unit's list grows enough that the kinds stop being obvious at a glance.

### 15.10 Two tabs — built in 1.8

Five tabs became two, on both sides. The top row stopped being a list of pages
and became the only question that matters: **how is it going**, or **what did we
agree**.

| Business unit | Capability |
|---|---|
| **Performance** — opens here | **Performance** — opens here |
| &nbsp;&nbsp;· Performance | &nbsp;&nbsp;· Performance |
| &nbsp;&nbsp;· **Report** — appears and leaves | &nbsp;&nbsp;· **Report** — appears and leaves |
| **Strategy** | **Strategy** |
| &nbsp;&nbsp;· Foundation | &nbsp;&nbsp;· Foundation |
| &nbsp;&nbsp;· SWOT | *(no SWOT — its foundation is the group's)* |
| &nbsp;&nbsp;· Plan | &nbsp;&nbsp;· Projects |

**The third row is the one the group's Performance sections already use.** No
new component: one row that means *sections of the tab above*, wherever it
appears.

**Reporting is not a page you visit.** It is what a cycle asks of you for two
weeks a quarter, and a tab that is dead the rest of the year should not hold a
permanent seat. It has three states, and the middle one is the one worth
recording:

- **Cycle open, unsubmitted** — the section is there and gold. It is the only
  thing on the screen asking for something rather than telling you something.
- **Submitted** — it stays, but goes quiet, badged *Submitted*. Claude proposed
  this against the original instruction that it should disappear on submission,
  and it was taken: somebody who has just sent figures to the SMO will want to
  check what they sent, and if the section were gone there would be nowhere to
  look. Submission and closure look like one rule and are not — after
  submitting, the cycle is still live and the SMO may reopen it.
- **Cycle closed** — gone. There is genuinely nothing there.

**Foundation is unchanged.** Not redesigned, moved. The clause list, the
aspiration card with its horizon pill, end in mind, and the key objectives with
their columns-or-chips toggle all render as they did.

**A capability now has a Foundation too** — its definition and its key
objectives, in the same two-card grid. Added on the understanding that it is
judged after use rather than before: it holds little, and if it earns nothing it
should go and Strategy should simply *be* the projects.

Its third column is **Weight**, not a three-year target: capability objectives
carry the optional weighting and have never had a horizon.

**Key objectives came off the Plan.** They are authored on Foundation and read
on Performance. Repeating them above the rail was duplication, and a duplicated
table is one that will eventually disagree with itself.

### 15.11 The rail reached Performance and Reporting

Both sides now. The pillar accordion is gone from a unit's Performance and the
rail carries its place.

**Reordering moved with it**, which was the reason this was held back a
version. The handle sits in the rail row rather than a wide table row — a
vertical list of four is exactly what the pointer-based sorter was written for,
and the row still clicks to select, so the two gestures never compete.

### 15.12 Still to build — CLEARED in 1.9

All three were built. Recorded here rather than deleted, because this list is
how 1.8's edges were remembered:

- **The rail on a unit's Performance and My reporting.** Performance took it in
  1.8, with reordering. **My reporting followed in 1.9**: each rail row carries
  its pillar's tally — entries given of asked — so while entering one pillar the
  state of the others stays visible, which is where the rail earns most
  (§15.6). No reordering on Reporting: entry, not arrangement. The selection is
  the unit's and travels between Performance, Strategy and Report.
- **Import and export for projects.** Built in 1.9 — see §16.4, which it
  closes.
- **Presentation mode** for a capability. Built in 1.9: a **Present** button on
  a supporting function's Performance page, same place and same rule as a
  unit's (anyone who can view the page). The deck covers each capability the
  function carries with the project model's content — key objectives only
  where they exist, projects overview, then per project its deliverables,
  outcomes and milestones — closing with everything at risk, off track or
  overrunning, and an editable note. One deck system; the function deck adds
  content shapes, not chrome.

## 16 · Backlog — agreed, not yet built

Everything below predates 1.7. Two entries are now superseded by §15 and are
marked rather than deleted, because the reasoning that led to them is still the
record of how the project model was arrived at.

### 16.0 Custodians — SUPERSEDED: one per unit and per function

*Originally recorded as several custodians with equal access. Reversed for
consistency: a business unit has one Strategy custodian, so a supporting
function has one too, and both are configured the same way — a dropdown beside
the head. The reasoning below on shared access and change logging is kept
because it becomes live again the moment more than one person can act.*

### 16.0a The original decision, kept for its reasoning

**A unit or a function may have more than one Strategy custodian**, though it is
the exception. All custodians have **equal reach over the whole unit** — any one
may enter, submit or reopen. Slicing the unit between them (one per pillar) is
tidier on paper and means maintaining an assignment map that drifts out of date
the first time somebody leaves.

**The custodian slot is optional.** Where a function head does the work
themselves they already have access as head; no second record is invented for
the same person. The same holds for a small unit.

**Adding a second custodian shows a warning** — not a block. It is unusual
enough that it is worth confirming rather than doing silently.

**What equal access forces: a record of changes.** This is the cost of the
decision and it should be taken with it.

- **History at the level of the figure, not the event.** With one custodian,
  *Mennah submitted at 14:02* is enough. With several, the question becomes
  *who changed my number* — which needs *this measure read 48%, changed to 62%
  by Omar at 11:40*. Only that version settles an argument.
- **Reopen is the destructive act.** Any custodian can un-submit a colleague's
  finished work. The log records it; the person who submitted should also be
  told it happened.
- **A log is forensic, not preventive.** Two people editing the same figure need
  to know at the time, or the log faithfully records a silent overwrite that
  nobody noticed until the review.
- **The log belongs to the cycle and survives its close.** The snapshot freezes
  what the figures were; the log explains how they got there.

### 16.1 Supporting functions — BUILT

*The model and both Setup pages are in the platform. Capability pages, the
project model and the navigation fold are not.*

A **supporting function** — Finance, HR, Treasury, Marketing — is its own kind of
thing, not a business unit. It has a **head**, and optionally one or more
**Strategy custodians** — the same role and the same name as on a unit, because
it is the same relationship. The qualifier names the **function, not the
capability**: *Strategy custodian, Finance*, since Marketing holds two
capabilities and naming someone after one of them breaks the moment a second is
assigned. It remains *Strategy* custodian even though what they hold is
projects: the capability is part of the group's strategy and the job is
identical.

**Each capability is allocated to exactly one function** — People to HR, Brand
Positioning to Marketing, Financial Infrastructure to Finance. It carries no plan, no weight and no pillars. It has
an owner and it carries capabilities. **There is no overlap**: a name does not
appear on both lists, so a person owes either a unit's plan or a capability,
never both. Setup gains **Supporting functions** and **Capabilities** pages; the
SMO decides which capabilities exist and which function owns each.

### 16.2 A capability carries projects only — SUPERSEDED by §15

Capabilities **lose their measures**. They were inherited from when a capability
was modelled as a pillar; a cross-cutting capability has no targets of its own.
Its health is whether its enhancement projects land, so progress has a single
definition: **milestones completed**, never typed.

**Settled: capability delivery reads separately — two numbers, not one.** The
group's execution figure is about business units; capability delivery is
cross-cutting and gets its own reading beside it. Folding it in would mean giving
capabilities a weight, reopening the weighting model, and making the group figure
something no unit head could reconcile against their own page.

*Superseded note:* whether capability delivery counts toward the group figure. The figure
is currently the weighted average of ten unit headlines, which a BU head can
reconcile against their own page. Folding capabilities in means giving them a
weight and reopening the weighting model. *Suggested:* a second reading shown
beside it, not inside it — the same principle as focus measures.

### 16.3 The project model — SUPERSEDED by §15, BUILT in 1.7

A project has a **brief** and a **timeline**.

- **Brief:** name, start and end, description, stakeholders (more than one), and
  a list of deliverables.
- **Deliverables carry their own kind:** a measure with a target, a percentage of
  delivery, or simply delivered or not.
- **Timeline:** milestones, each with a status, a finish date and a note.
- **Timeline source is per project** — exact dates or quarters, whichever the
  work actually has.

*This reverses §5.9 for a different entity.* Milestones were removed because a
milestone-as-measure was a measure with no number. A project genuinely has
milestones, and they are the only way to say where it has got to.

**Validation this makes possible:** a milestone finishing after its project's end
date. The real sample had exactly that — a project ending 30 Apr with a milestone
finishing 31 May.

### 16.4 The import template — BUILT in 1.9

Capability projects arrive the way a unit's plan does: **Manage → Import**, not
from the capability's own page. The file needs its **own scope** — a capability
rather than a unit — and its own sheets: Brief, Deliverables, Milestones. Same
parser, same validation, same id rules underneath.

*As built, extended to the §15 project model.* The scope list offers business
units and capabilities in one dropdown. The **plan workbook** carries
Objectives (with weight — capability objectives weight like a unit's), Projects
(the brief: owner, stakeholders, timeline, start, end), Deliverables (kind:
delivered-or-not, or a percentage), **Outcomes** (direction, target split into
value and unit, measured at — a sheet §16.4 predates, added because §15.2 split
outcomes from deliverables), and Milestones (what it covers, owner, finish).
Children choose their **project from a dropdown of names**; the ID column is
grey and last; a renamed project does not orphan its children. A **progress
workbook** mirrors the capability's reporting page — Yes/No or a percentage per
deliverable, an actual per objective and outcome, a status per milestone — with
progress recomputed on arrival, never typed. The whole-file refusals hold
(wrong capability, a business unit's file, wrong kind), problems block and
notices do not, absent is reported and never removed, and a milestone finishing
after its project's end is a **notice, never a refusal** (§15.4). The test that
matters passes: export any capability, re-import untouched, zero changes —
verified for all eight, CSV and workbook, plan and progress. A project round
trip no longer loses anything.

### 16.5 Navigation — one row that folds — BUILT in 1.2 — BUILT

Two folds beside Group, labelled **Units** and **Functions**. Opening one closes
the other, so the row never grows. **Expanding is browsing, not going** — the
page does not change, and the collapsed fold carries the location (*Units ·
Mobile* in gold) so the navigation never stops saying where you are.

The folds appear **only for someone who reaches more than one unit and more than
one capability** — today the SMO and the CEO. Everyone else sees the row exactly
as it is now.

*Measured, not assumed:* with the labels written out in full the row still
wrapped at every width tested — the two pills cost more than the eight
capabilities they hide. **Short labels are what buy the single line.**

*What the build then found:* the mockup assumed a 1560px row, but the platform's
content column is **1180px**, so the folded row still wrapped. Two changes fixed
it: the row is allowed past the content column's width — a navigation bar is
chrome, not content — and its spacing tightens, but **only when the folds are
present**, so everyone else keeps today's roomier row. One line now at every
width down to 1280px.

*Two defects the build surfaced.* `paintUnits` reset `current` whenever the
destination was not in the visible list — so folding Mobile out of sight kicked
the page to Group, making a fold navigate. And the nav handler bound **every**
button in the row including the folds, setting `current` to `undefined`. A fold
must go nowhere, and both of those made it go somewhere.

### 16.6 The capability card, and a view toggle — BUILT in 1.9

A capability uses the **same card as a business unit**: the delivery dial on the
left, and on the right the milestones that produce it — *2 of 3*, with in
progress, not started and project count beneath. The same relationship Execution
already has with delivered, planned and variance. A one-box card was tried and
its labels clipped, because the card is sized for two.

Both Group Performance sections gain a **Cards / Table toggle** — cards to judge,
a table to scan. It goes on both or neither, or the two sections stop matching.

*As built, mapped onto the §15 model.* The mockup predated the project model,
so its "delivery" dial became **project performance** — the one reading all
eight capabilities have, and what the card's dial reads. The right box is the
milestones exactly as drawn. The header sub-line names the owning function and
its head, per the mockup; the two ⓘ drills stay. This **replaces the 1.8
card**, whose right box read "no plan" forever — it still expected the tactic
data a capability stopped carrying in 1.7, and its dial was labelled
Objectives while reading project performance.

The toggle sits on **Business units and Group capabilities** (themes, at
three, have no scanning problem). The tables show the same derived figures as
the cards; the conclusion is the last column and carries the band colour. The
**capabilities table ranks on project performance** (§15.1), unscored last;
the units table keeps the arranged order — unit order is a deliberate act,
weights decide influence, and re-sorting it would make the arrangement look
like it did not take. Arranging is a cards-view act; the toggle is a session
view preference, stored on nothing.

### 16.7 Source teams — a number is reported by whoever owns it

**The idea.** Many measures are not the business unit's number at all. Revenue,
margin, working capital and most financial figures already exist in Finance
before a unit is asked for them, and asking the unit to type them in achieves
two bad things at once: the same figure is entered ten times, and it can be
entered *wrong* ten times, because the person typing is not the person who
knows it.

So a measure gains a **source team** — the team that is master of that number.
Finance reports it once for every unit that uses it. The unit's own reporting
screen still shows the measure, but **dimmed and read-only**, attributed:
*reported by Finance*. The unit does not enter it and is not chased for it.

**What has to be configured.** A Setup screen listing every measurable thing in
the platform — unit Key Objectives, unit key measures, capability project
deliverables — from which the SMO marks a subset as source-owned and assigns
each to a team and a person. The pool is large, so it needs filtering by unit,
by pillar and by whether a source is already assigned.

**What follows in the cycle.** A source team becomes a reporting party like any
other: it gets its own reporting surface for the window, and its own row on the
SMO's completeness board. A cycle cannot close cleanly while Finance has not
reported, exactly as it cannot while a unit has not.

**Three questions this raised, now settled:**

1. **The unit writes the note, always.** Finance enters the figure; the unit
   explains it. The number is Finance's, the performance is the unit's, and the
   explanation belongs to whoever owns the performance.

2. **A unit cannot submit until its report is complete — including the figures
   it does not enter.** This looks like a defect and is not one. If a unit could
   submit around a missing Finance number, the only person chasing Finance would
   be the SMO. Making the unit's submission depend on it means **the unit pushes
   too**, and the chasing is distributed to the people who actually want the
   number. Source-owned items therefore **count toward the unit's total**.

   *What this forces in the design:* a blocked Submit button with no explanation
   is hostile. The unit's page has to say plainly what is outstanding, which team
   owes it and who to ask — otherwise the person is accountable for something
   they have no route to act on.

3. **Disagreement is settled off the platform.** A unit that disputes a figure
   goes directly to the team that entered it. No challenge workflow, no
   arbitration screen, no second version of a number sitting beside the first.
   The platform records one number and who is master of it; the conversation
   about whether it is right belongs between the two teams.

**Why it is worth building.** It removes the single largest source of effort and
error in the cycle, and it makes the platform's answer to *where did this number
come from* a real one rather than a convention.

### 16.8 A help box — self-service for the questions the SMO gets asked

**The idea.** A small chat box in the platform answering the questions people
actually arrive with: *where do I submit?* *what happens if I reopen?* *why can't
I edit my strategy?* *why is this number greyed out?* The goal is not
conversation — it is to stop the SMO being the help desk for things the platform
already knows.

**The examples split into three kinds, and the split matters.**

*How and where* — "where do I submit", "what does reopen do". These are answered
from what the platform documents about itself. The **Info panel already on every
page** is exactly this content, written per page, and the help box is a faster
way into it.

*Why can't I* — "why can't I edit my strategy", "why is this figure locked".
These are **not documentation questions**. They are questions about the current
state: the cycle is open, so plan edits are the SMO's alone; the figure is
source-owned by Finance; your level does not grant edit on this page. The
platform already knows every one of these answers — it just enforces them
silently.

*How is this calculated* — "why is this 60%", "what goes into execution", "why
did this measure not count". These are the deepest questions and the platform is
uniquely able to answer them, because it does not just know the formula — it knows
**the workings of the figure actually on screen**. Not *objectives are averaged*,
but *60% is the mean of four objectives; one is unreported and was dropped rather
than counted as zero, so the mean is over three*. The drill cards already do this
for some figures; the help box would make it askable of any of them.

This matters more than it sounds. A number nobody can explain is a number nobody
trusts, and the argument that follows lands on the SMO. Every scoring rule in
this document — nulls dropped rather than zeroed, quarter-share planning, the
composite from factors — exists precisely so a figure can be defended in a room.
The help box is where that defence becomes self-service.

**So the highest-value part needs no AI at all.** Every refusal in the platform
has a reason in the code: `planEditable()` knows the cycle is open, `grant()`
knows the level, a dimmed field knows its source team. Surfacing that reason is
deterministic, always correct, and cannot invent anything. **An assistant that
guesses at these is worse than none**, because a confident wrong answer about
why something is locked sends someone to the SMO angry rather than merely
puzzled.

*Suggested shape:* the box answers state questions from the platform's own rules
and page questions from the Info content, and **says "ask the SMO" whenever it
does not know** rather than reaching. Some questions route to the SMO by design —
anything that is a decision rather than a fact: changing a target mid-cycle,
reopening a closed cycle, adding a unit.

**What it would need.** The knowledge exists but is not organised. It sits in
three places that were each written for a different reader: this document (for
whoever rebuilds the platform), the Info panels (page by page, for whoever is on
that page), and the code (for nobody). Nothing joins them, nothing is indexed,
and no one can read the set as a whole to understand how the platform works.

The work is turning that into **one body of documentation the platform can read
back**: each rule carrying its condition, its scope and the sentence explaining
it — *who* it applies to, *when*, and *why*. It is a consolidation of what
already exists rather than new knowledge, and it has a second payoff: the same
body becomes the thing a new SMO or a client team reads to understand the
platform, which today does not exist in any single place.

**Why it is worth building.** Every question answered here is a question the SMO
does not answer twice, and the platform stops being something people need a
person to operate.

### 16.9 People, credentials and activity

**The idea.** People become real records rather than a list of names: name,
email, phone — particularly for the business unit head and the unit's owner —
with the ability to create and reset passwords individually and in bulk, and a
history of who has held which role.

**The distinction that matters.** A unit's *owner* is often a senior name, while
the person who actually makes the entries is an associate working to them. The
platform already separates head from owner in `UNIT_ROLES`; this extends it to
the person doing the work, so a report is attributed to whoever actually typed
it rather than to whoever is nominally accountable.

**Why history is not optional.** Snapshots attribute figures to people. When
someone leaves, the record of who reported H1 2026 must still be true — so the
platform needs *who held this role during that cycle*, not just *who holds it
now*. Deleting a person would rewrite history; people are retired, like units.

**What this changes about the prototype.** There is no authentication today. The
**viewer switcher is a prototype device** — it exists so the shape can be judged
from every angle in one browser, and it must not survive into a real build. Real
identity replaces it, and access stops being something you choose from a
dropdown.

**Activity.** Once identity is real, the cycle gains an audit trail it currently
lacks: who submitted, who reopened, who changed a target mid-cycle under the
SMO-only rule, who closed the cycle. Today all of those happen with no record of
who did them. Where a unit has several custodians this deepens from an event log
to **history per figure** — see §12.0.

**Source material.** Islam has an HR ERP product with a full people-profile
module. Claude has no access to it. What would be useful to bring across, and
nothing more — the HR module carries far more than this platform needs:

- the **person record schema** — field names, types, which are required
- **role assignment**, and how role history over time is stored
- the **credential flow** — how a password is set, reset and expired (the flow,
  never any secrets or keys)
- **bulk operations** — inviting or resetting a group of people at once
- the **activity or audit log** schema, if one exists

### 16.10 Strategy versions — the plans that came before

**The idea.** A strategy is replaced every few years. Pillars are dropped,
measures are rewritten, tactics finish or are abandoned; the foundation may shift
and even the Key Objectives are often not the same ones. The old plan still had
targets and still made progress against them, and that record should not vanish
when the new one is loaded.

So a **strategy version** becomes a thing the platform holds: its foundation, its
pillars, its measures and tactics, and the progress it reached — readable but
frozen. People can look back at what the last strategy said and how far it got.
For a consultancy this is the whole history of an engagement in one place.

**This is not the same as a cycle snapshot.** A snapshot freezes figures *within*
one strategy so H1 can be compared with H2. A version is a different plan
entirely. Everything below the foundation belongs to a version, and a cycle
belongs to a version too.

**The trap: deltas must not cross a version boundary.** The platform's whole
delta mechanism compares this cycle against the last close. Across a version
change that comparison is meaningless — 2024's 66% was an average over different
measures against different targets, so *▲ 4* would be arithmetic dressed up as
insight. **The first cycle of a new strategy shows no delta**, exactly as the
first cycle of all does today.

**What carries and what does not.** Units, people and roles persist across
versions — they are the organisation, not the plan. Pillars, measures and tactics
do not; they are the plan. Key Objectives sit awkwardly between the two and will
need a decision: carried forward by default and edited, or written fresh each
time.

### 16.11 Later

Review mode should accommodate **images**: a screenshot of a platform or an
outcome, or an uploaded picture slide placed at a chosen point in the deck.
Not designed yet.

---

## 17 · Version history

### v2.6 — the horizon stops being a default

`2029` came from the demo data and the clean slate missed it, so the plan
template shipped pre-filled with a year nobody had chosen (§23.5). Blank now
until the tenant sets one, with every page that reads it saying "not set"
rather than trailing a dangling "by". Distribution and B2C confirmed as the
client's real companies (§23.4).

### v2.5 — the company level, and two bugs an authored plan exposed

The company level (§15.13), built by Islam outside the repo and ported here: a
layer between the group and the business unit, for **visibility rather than
strategy**. Two bugs went with it, both in the plan upload built a version
earlier and both found by Islam the first time he used it in anger: a pillar
arriving from an upload carried **no code**, so its title read "undefined" and
the rail could not tell one pillar from another; and the sticky chrome was
pinned in three places at hardcoded offsets, so scrolling smeared the header.

### v2.4 — SMP gets an icon

The Strategy Temple as the tab and bookmark icon, in the house navy and gold —
the platform's own drawing, not a stock glyph. Real files at the repo root for
the served site; the same mark inlined as a data URI in the built single file,
so it carries its own icon offline (A5: the handover file needs nothing but
itself).

### v2.3 — the plan template loses its codes

One generic template instead of a download per unit, and no code in it anywhere:
the platform assigns every one on arrival. What made that possible is a rule
rather than a clever matcher — **an upload authors a plan, it does not amend
one** — so there is never a row to match a code against (§22). A file says which
unit it is for on its own Read me sheet. Replacing a plan archives the outgoing
one, reported figures included, and Manage lists archives with a Restore. The
Pillar and Owner dropdowns, which were empty on a unit with no plan and so made
a first plan impossible to author, are fixed.

### v2.2 — the clean slate, and the Demo button

The demo tenant became the client's own: the companies, the business units, the
supporting functions and the configuration stayed, every invented plan,
foundation, person, cycle, capability content and weighting value went
(§21, §21.5). The full worked example did not go with it —
a **Demo data** button switches the whole product to it for explaining, labels
it while it is on screen, and cannot write it to the database. Three defects
that only an empty tenant could expose were fixed on the way: "Clear all plans"
on Supporting functions had been inert since 1.7, capability content was being
stored twice, and the group's own scorecard was a stored figure that read
`undefined%` with no objectives set (§21.3).

### v2.1 — identity: real sign-in replaces the viewer switcher

Phase 1 of the real build, on the chosen Path A (the approved front end,
real machinery underneath — §19). The gate became a real login; the platform
requires a session; a signed-in person sees their own view; the SMO issues
temporary passwords from Levels & access and every issued password must be
changed on first use. The switcher survives only as the SMO's read-only
simulation and in the offline file. Enforcement is at the door; per-action
authorization and the change log are Phase 2.

### v2.0 — the state moves into the database

Major, because it changes the platform's structure — where its state lives —
while changing nothing on screen. Full record in **§18**. In one line: served
on Vercel the platform reads and writes its whole state through `/api/state`
against Neon Postgres (schema and seed applied on first contact, seed
generated from the sources); opened as a file it remains the same
self-contained prototype. Access persists but is not yet enforced — that is
§16.9, still open.

### v1.9 — the 1.8 edges closed: cards, sheets, decks, and the last rail

Built without check-ins on Islam's instruction, against what was already
recorded — every item below was settled in §15.12, §16.4 or §16.6 (and
`mock-capcard.html`) before this session started. Specs for the four features
live in `specs/` (spec-kit, adopted this version).

- **The capability card** (§16.6): the two-box card from the settled mockup,
  mapped onto the project model — performance dial left, milestones right.
  Replaces the 1.8 card whose execution box was permanently dead.
- **Cards / Table toggle** on Business units and Group capabilities; the
  capabilities table ranks on project performance (§15.1), the units table
  keeps the arranged order.
- **Capability project import and export** (§16.4): capability scope on
  Manage → Import, plan and progress workbooks and CSVs, idempotent round
  trip verified for all eight capabilities. Projects, deliverables, outcomes
  and milestones now survive a round trip.
- **Presentation mode for a supporting function** (§15.12): Present on the
  function's Performance page; the deck carries the project model.
- **The rail on My reporting** (§15.12): per-pillar tallies beside the entry
  tables; selection shared with Performance and Strategy.
- *Doc fixes:* the workbook read-mes said "Setup → Import" (Import moved to
  Manage in 1.5); two Info panels still said projects "replace measures and
  initiatives next" (they did, in 1.7). Both corrected to match the product.
- *Housekeeping:* the unused `VERSION` constant read "1.6"; now tracks the
  filename.

### v1.8 — two tabs, and the rail everywhere

- **Two tabs** on a business unit and on a capability: Performance and
  Strategy. Sections carried by the third nav row the group already uses.
- **Report** appears inside Performance while a cycle is open, goes quiet and
  badged once submitted, and leaves once the cycle closes.
- **Strategy** holds Foundation, SWOT and Plan on a unit; Foundation and
  Projects on a capability.
- **A capability gained a Foundation** — its definition and key objectives,
  weight as the third column.
- **The rail** reached a unit's Performance, carrying pillar reordering with it.
- Key objectives removed from the Plan; they are authored on Foundation and read
  on Performance.


### v1.7 — the project model, and the rail

- A capability stopped being a pillar. Measures and tactics gave way to
  **optional key objectives** plus **projects**, each carrying a brief,
  stakeholders, **deliverables**, **outcomes** and **milestones**.
- Project performance is **half deliverables, half outcomes, per side**.
  Execution is milestones. Neither is folded into the other.
- An outcome carries a **measurement time**; before it, the outcome is absent
  from the arithmetic rather than zero.
- A milestone finishing after its project's end date is **accepted and
  reported**, never refused.
- **The rail** — list left, item right — on all three capability tabs and on the
  new unit **Strategy** tab.
- **Strategy** added to a business unit: the plan, with no reported figure on it.
- **Performance** added to a capability, opening first.
- Fixed: capability reporting inputs were bound to no handler and silently
  discarded what was typed into them.
- Fixed: §12 and §13 were each used twice as section numbers, so the README's
  pointers resolved ambiguously. The backlog and version history are now §15
  and §16.
The platform carries a version in its header, so a screenshot can always be
traced to a build. Numbering starts at **1.0** rather than at zero: there were
roughly eleven rounds of building before versioning began, and pretending
otherwise would misrepresent the age of the thing. Minor for a batch of changes,
major for a structural one.

| Version | What changed |
|---|---|
| **1.0** | Everything to the point versioning began: the group and unit model, scoring, the temple, arrangement, import and export, focus measures, the reporting cycle with snapshots and deltas, presentation mode, dark table headers, alternating rows, independent accordion panels, `Reporting` as the unit tab, and `head` + `custodian` as the two unit roles. |
| **1.2** | The navigation fold, and a capability's own pages. `Units` / `Functions` beside Group, opening one closing the other; expanding is browsing, not going, and the closed fold carries the location. Folds appear only for someone reaching more than one unit *and* more than one capability. Capability pages — Projects and Reporting — reachable by the function's people, the SMO and the CEO. |
| **1.4** | A **short name per unit for the navigation**, set on Setup → Business units. Blank means use the full name. It is deliberately confined to the navigation — page titles, group cards, the deck and every export keep the full name, verified by checking the short name appears nowhere in a rendered deck. |
| **1.6** | **One header for both configuration tables.** Title left, facts and two round controls far right on the same line. Business units previously used four elements for this — a chip row, a bar with the count and Edit, the table, then master clear buttons at the very bottom of the page. **Edit is a pencil on a square** (it edits the page, not one thing); **clear is an eraser**, the only common mark meaning *rub out the contents and leave the thing* — a bin would say the row is going away, which is the opposite. The eraser opens two choices and the confirmation replaces the menu in the same place, so the second press lands where the first did. Setup and Manage icons pinned to the right edge of the navigation. |
| **1.5** | **Setup split into Setup and Manage.** Setup is what *exists* — labels, access, bands, units, functions, capabilities — decided once and revisited rarely. Manage is what the SMO *does* every cycle: the reporting cycle, import, and focus measures, which sat in Setup only because that was the only place that existed. Both are icons without words, each carrying a title and an aria-label. **Clearing now works at all three levels** and behaves identically at each: per unit, per function, and everything. A function's plan is its capabilities' work and its progress is what was reported against it; the capability *definition* survives both, being identity rather than plan. Where a function carries several capabilities the confirmation names how many it will take. |
| **1.4** | A **Navigation Name** on both units and functions — a short label for the row only, blank by default; page titles, group cards, the deck and every export keep the full name. The **Supporting functions** setup page rebuilt to match Business units exactly: row numbers, editable name, navigation name, code prefix, one head and one Strategy custodian as dropdowns, Retire rather than delete, and Add. |
| **1.3** | Navigation by **function**, not by capability. The Functions fold lists Finance, HR, Marketing and the rest; the capabilities each carries are named inside its pages, on one line each. A function may carry more than one, the custodian is named after the function, and the capabilities already appear in the temple — so the row offers the organisation and the pages name the work. |
| **1.2** | The folding navigation and capability pages. **Both folds start closed** and toggle — pressing the open one closes it — so the row arrives at its shortest and someone who never opens one is never shown eighteen entries. Fold contrast raised: the closed state was pale grey on navy and the open state a 14% gold wash, neither legible as a button; open is now solid gold, and the nav's own type went from 62% to 82% opacity.  Two folds beside Group — **Units** and **Functions** — appearing only for someone who reaches more than one unit *and* more than one capability, which today means the SMO and the CEO. Expanding is browsing, not going: the page does not change, and the closed fold carries the location. A capability became a destination with its own **Projects** and **Reporting** tabs, reachable by the people of the function that carries it. |
| **1.1** | Supporting functions and capability ownership. `FUNCTIONS` with a head and optional Strategy custodians; every capability allocated to exactly one function; Setup pages for both; people attached to a function rather than a unit, and the access guard that stops them reaching every business unit. Shared-access confirmation moved to the moment a custodian is added. |

---

## 18 · The database — v2.0

Instructed by Islam (2026-08-20): everything in the configuration, the access
model and the platform's content lives in the database, built and seeded on
deployment. This is the first slice of the "real build" §16.9 anticipates,
and it is a **major version** because it changes the platform's structure —
where its state lives — while changing **nothing on screen**.

### 18.1 What was decided

- **The product is unchanged; its state moves.** Served on Vercel, the
  platform loads its state from Neon Postgres through one endpoint
  (`/api/state`) and writes every change back — edits survive reloads and
  every viewer shares one state. Opened as a local file it behaves exactly as
  before, on the baked-in demo data: the offline handover property survives,
  and that baked data is precisely what seeds a fresh database.
- **Real tables, from §4.** The schema is the hierarchy this document already
  gives — organization → themes and capabilities → units → foundation, key
  objectives, SWOT, pillars → measures and tactics; capabilities → projects →
  deliverables, outcomes, milestones — plus configuration (labels, levels,
  access grants, bands, units, functions, people, roles, weighting factors
  and values) and the cycle (review, focus marks, KO weights, history).
  Stable ids are the keys; names stay display-only. Each entity carries an
  `extra` JSONB for provenance and display fields, so a round trip loses
  nothing — proven by a deep-equal test, not assumed.
- **Derived is still never stored (§5.1).** The tables hold what was authored
  and what was reported. A unit's weight is dropped on write and recomputed
  from the factor table after every load.
- **The seed is the sources, mechanically.** `db/seed-state.json` is
  generated from `group-data.js` and `config-data.js` by a script, and
  applied through the same writer the save path uses — one writer, so the
  seed, the save and the read can never disagree.
- **Building and seeding happen on deployment** — the first request against
  an empty database applies the idempotent schema and seeds it, under an
  advisory lock so concurrent cold starts cannot double-seed. Nobody runs SQL
  by hand; the connection comes from the Neon integration's environment
  variables in Vercel, never from a chat or a file.

### 18.2 Costs and limits, stated so they are not found later

- **Access is stored, not yet enforced.** People, levels and the grant matrix
  persist and are editable in Setup, but enforcement remains client-side and
  the viewer switcher remains the way in — real identity is §16.9, whose
  product decisions (credential flow, password policy) are still open. The
  deployed state is therefore shared and world-writable to anyone who reaches
  the URL; the AdminSMO gate in front of it is a latch, not a lock.
- **Last writer wins.** Saves replace the whole state transactionally; two
  people editing at once will not corrupt anything, but the second save
  overwrites the first. §16.0a's change-log reasoning becomes live the moment
  more than one person can act; it is not built yet.
- **A migrations registry is deliberately absent** until the schema first
  changes — machinery with nothing to record. The DDL is idempotent
  (`CREATE TABLE IF NOT EXISTS`).

### 18.3 What was verified before handover

Against a throwaway local Postgres 16: schema + seed on first contact, no
re-seed on second; **round trip deep-equal** (seed → write → read → identical
graph) and `write(read())` a fixed point; a browser session editing a
foundation, an access cell and a reported figure, each landing in its exact
row and visible to a fresh browser; the full QA walk clean for all 29 viewers
both over HTTP (database mode) and from file:// (offline fallback).

---

## 19 · Identity — v2.1, Phase 1 of the real build

Islam chose the architecture path on 2026-08-20 after the branding question
was answered: **Path A — the approved front end stays exactly as it is, and
the real machinery is built underneath it.** For the record: Path B (a
Next.js rebuild) would have changed the stack only, never the colors or the
branding; it was set aside because re-implementing every settled screen risks
drift across precisely the decisions that took longest to settle, and the
schema and server work built here carry over unchanged if B is ever chosen.

### 19.1 What was decided and built

- **Sign-in is real on the deployed product.** The AdminSMO gate became the
  login: a person key and a password, checked on the server, with the session
  an httpOnly cookie. The platform page requires a session — opened without
  one it returns to the gate. The original client-side AdminSMO/4123 gate
  survives only where there is no server to ask: the local file, or hosting
  with no database.
- **The viewer switcher is replaced by identity** (§16.9 said it must not
  survive into a real build). A signed-in person sees their own view — the
  navigation the access matrix grants them, nothing else — with *Signed in
  as* and a Sign out in the chrome. The SMO alone keeps the switcher, as a
  **read-only simulation**: it changes what is rendered, never who is acting,
  because the server authorizes by session and nothing else.
- **The SMO issues credentials.** On Levels & access, each person carries a
  Set password control (deployed mode only): the SMO issues a temporary
  password, hands it over outside the platform, and the person is **forced to
  choose their own on first sign-in**. Policy adopted from HR_ERP as
  proposed: at least 8 characters, an uppercase letter, a number, a special
  character. No self-service recovery yet — a forgotten password is reset by
  the SMO, which also ends that person's sessions.
- **Bootstrap:** an empty database seeds one credential — the SMO, with the
  gate's original 4123 — flagged must-change, so the first real sign-in
  immediately replaces it.
- **Passwords are scrypt-hashed** with per-password salts; sessions are
  stored by SHA-256 of the token; both live outside the state graph so a
  state save can never touch them. Wrong name and wrong password return one
  message — a login screen should not confirm which usernames exist.
- **The migrations registry arrived** with the schema's first change
  (002-identity), exactly as §18 promised.

### 19.2 Limits, stated

- **Enforcement is at the door, not per action.** A signed-in person's
  writes are authenticated but not yet authorized per field — a custodian's
  browser is trusted about *what* changed. Phase 2 (per-action writes with
  server-side rule checks and the per-figure change log of §16.0a) closes
  this; until then the exposure is limited to people the SMO has issued
  credentials to.
- **Usernames are person keys** (`own_mob`, `mobhead`) shown to the SMO
  beside the Set password control. Real emails and richer person records
  remain §16.9 work.
- **No rate limiting on sign-in yet**; noted for Phase 2.

### 19.3 Verified before handover

On a throwaway local Postgres: the full flow in a real browser — bootstrap
sign-in with 4123 forced a password change; the SMO issued Mennah Farouk a
temporary password from Levels & access; she signed in, was forced to choose
her own, saw only Group and Mobile with the switcher hidden and her name in
the chrome, reported a figure that landed in its exact row, and her old
temporary password was refused afterwards. An unauthenticated visit to the
platform bounced to the gate; /api/state answered 401 without a session.
Offline: the QA walk stayed clean for all 29 viewers and the legacy gate
behaved exactly as before.

### 19.4 The SMO's own sign-in is one step — reversal within v2.1

*Instructed by Islam, 2026-08-20: "don't ask me to do new passwords now on the
app, just let me access with SMO and 1234."*

The SMO signs in with **SMO / 1234** and is **not** asked to choose a new
password. This reverses, for that one account, the forced-change rule §19.1
had just introduced.

What did **not** change: sessions are still real, passwords are still hashed,
`/api/state` still requires a session, and passwords the SMO **issues to other
people** are still temporary and still force a change on first use. The
reversal is scoped to the one account that has to get in quickly.

*How it reaches an already-seeded database.* Changing the starting credential
in code would only ever affect an empty database, and the deployed one already
carried the old `4123` with the must-change flag. So it is a **migration**
(`003-simple-smo-access.sql`), applied once and recorded in the registry — the
first request after the deploy corrects the existing row. Being once-only is
what stops it from clobbering a real password later: change the SMO password
from inside the product and the migration never runs again.

**Stated plainly, because it is a step back:** `1234` on a product reachable
from the internet is weak, and the old `4123` stops working the moment this
deploys. It is a demo convenience and should be replaced before anything
client-confidential goes into the platform.

---

## 20 · The stack — reversal of §19's Path A

*Decided by Islam, 2026-08-20:* **SMP moves to the HR_ERP stack** — Next.js,
React, TypeScript, Prisma, NextAuth on Vercel and Neon. His reasoning, in his
words: it *"looks more solid and will handle a lot of complex work… we are
going to do a lot on this platform with lots of users."*

**This reverses §19's Path A**, which kept the hand-built single-file front end
and put a real server underneath it. Recorded as a reversal rather than
overwritten: §19 remains the record of what v2.1 was built on and why, and the
reasoning there — that Path A protected the settled design from porting drift —
is still the risk this move has to manage, not a reason it was wrong to choose.

**What carries across unchanged**, and why the reversal is cheap rather than
wasteful:

- **The database.** The schema, the migrations and the seeded content stay
  exactly as they are; Prisma is pointed at the existing tables rather than
  generating new ones. No data migration, nothing re-entered.
- **The identity model.** Scrypt-hashed passwords, server sessions, the SMO
  issuing temporary credentials — the same design NextAuth will carry.
- **Every decision in this document.** The model, the scoring, the vocabulary,
  the access rules and the screen behaviour are stack-independent; that is what
  makes them a rebuild contract rather than notes about one codebase.

**What is thrown away:** the glue — `api/state.js`, `api/auth.js` and
`src/sync.js`, a few hundred lines.

**What is at risk, and the decision that protects it:** every screen is
re-implemented, so the settled design can drift a shade or a few pixels at a
time. **SMP's existing CSS is therefore carried over verbatim rather than
re-expressed in Tailwind**, which is what makes an identical look achievable by
construction instead of by eye. Tailwind may be used for anything genuinely
new. *(Nothing about the move changes the navy/gold, the layouts or the
branding — that question was asked and answered before the decision.)*

**The offline single-file prototype stops gaining features.** v2.1 was its last
build of new capability; it remains as the frozen demo artefact and as the
reference the rebuild is measured against. This is the real cost of the move and
it is taken knowingly.

*Clarified 2026-08-20, on building v2.2:* "stops gaining features" is the rule;
"stops changing" is not. The single file **is** the live product until the
rebuild reaches each screen, so it still takes the client's own instructions
(§21's clean slate) and the fixes those expose. New capability goes to the new
stack; corrections go where the product actually runs.

*The plan itself — order of work, how the live product behaves during the
rebuild, and what "done" means for each slice — is not settled here. It goes to
Islam for approval before any of it is built (A1).*

---

## 21 · The clean slate, and the Demo button — v2.2

*Decided and built 2026-08-20, on Islam's instruction: "what's super actual for
now are the companies, the business units and the supporting functions … but as
mentioned keep the demo view with all data so we can explain."*

### 21.1 Two datasets, one product

The prototype's content did two jobs at once and could only do one of them
well. It had to be **the client's tenant** — the real companies, the real
business units, the real supporting functions — and it had to be **the worked
example** that explains what a filled-in platform looks like. As long as both
lived in the same rows, every screen was ambiguous: nobody could tell Raya's own
figures from the invented ones except by reading §13.

They are now separate, and the separation is structural rather than a label:

- **LIVE** is what the database holds. After the clean slate that is the
  client's own — the company, the ten business units, the supporting functions,
  the three group themes, the eight capability names, the configuration, and one
  account. Everything else is empty and waiting to be authored.
- **DEMO** is the full Raya Trade example, baked into the platform file exactly
  as it always was. It is captured in memory at boot, *before* the database
  answers, and never written anywhere.

A **Demo data** button in the top-right switches between them. In demo the
platform's own banner carries the invented-data notice, which is true of the
example and is no longer true of the client's tenant; live, the banner is gone.

**The guard that matters:** the autosave refuses to run in demo mode. Demo
content cannot reach the database even if someone types in it — anything typed
there is discarded on the way back. Leaving live snapshots the client's data
first, so returning restores it exactly rather than the state it had at boot;
an edit made before opening the demo survives the round trip.

The button exists only where there is a live dataset to tell the example apart
from. Opened as a file, the whole product **is** the example, so the button
stays hidden and nothing changes about the offline handover file.

### 21.2 What the clean slate kept, and what it removed

Applied as migration `004-clean-slate.sql` — recorded in the registry, so it
runs once and can never re-clear a tenant that has real work in it.

**Kept:** the company and its horizon · the ten business units · the supporting
functions · the three group themes and the eight capability **names** with their
owning function (§13 records these as real, drawn from Raya's own Strategy
Temple slide — only their content was invented) · all configuration: labels,
scoring bands, levels, the access matrix, the weighting factors and their
values · the SMO account, because it is the account the platform is entered
with.

**Removed:** every business unit's plan, foundation and SWOT · the group's
foundation — clauses, purpose, core values, key objectives · every capability's
definition, key objectives and projects · the reporting cycle, its focus marks
and its closed history · the invented people and the role assignments pointing
at them.

*(The weighting factor values were held back here and flagged; Islam cleared
them the same day — see §21.5.)*

Nothing is lost. The full example is still in `db/seed-state.json` and baked
into the platform file, which is what the Demo button shows.

### 21.3 Four bugs the clean slate exposed

An empty tenant is a test the product had never been given, and it failed four
ways. All four were real defects, not consequences of clearing:

1. **"Clear all plans" on Supporting functions did nothing at all.** It emptied
   `cap.measures` and `cap.tactics` — fields a capability stopped having in 1.7,
   when it gained key objectives and projects instead (§15). The line threw on
   the missing array before it reached anything real, so the button had been
   inert since 1.7. It now clears a capability's key objectives and its
   projects, which is what its plan is.

2. **Capability content was stored twice.** Key objectives and projects have
   their own tables, and the writer *also* copied them into
   `capabilities.extra`. Reading merged the blob back over the rows, so a
   cleared capability would have refilled itself with invented projects on the
   next save. The two fields are now declared as owned by their tables and
   dropped from the blob.

3. **The group's own scorecard was a stored number.** `GROUP.keyObjectivesScore`
   sat in the data at 75 — which agreed with the mean of the six objectives
   while the demo data was the only data, and read `undefined%` the moment a
   tenant had none. It is now computed on read like every other figure (§5.1),
   from the objectives that are actually there; the copy that said "mean of the
   six" and "all 6 objectives have a target" now counts them. Two further
   pre-computed group figures (`portfolio`, and the theme roll-ups) were found
   to be read by nothing at all and are gone from the tenant.

4. **The viewer switcher was filled once, at load.** It listed the baked-in
   example's 29 people — and went on listing them after hydration had replaced
   them with the tenant's own, so picking one of the departed threw on the next
   repaint. It is refilled whenever the list changes, and `viewer()` now
   resolves rather than returning nothing: if the person being viewed as has
   gone, the first person stands in and the selection is corrected to match. The
   Demo button swaps the same list, so both paths needed the same fix.

Alongside them, `bandOf` was given the same treatment as §5.7's nulls: a score
that cannot be computed is **No data**, not **Off track**. An empty tenant was
colouring its dials red for having nothing in them.

### 21.4 Verified before handover

- The clean-slate migrations applied to a database seeded from scratch, then the
  counts read back: units 10, supporting functions 7, themes 3, capabilities 8,
  people 1, weighting factors 4, weighting rows 10 — pillars, measures, tactics,
  unit and group key objectives, clauses, SWOT items, projects, capability key
  objectives, history, weighting values and the prior cycle all **0**; the cycle
  and the review empty; `smo` the only account that can sign in.
- Every page walked as every viewer, live and in demo, with the console
  watched — no errors in either.
- The database read before, during and after a demo session: **unchanged**,
  including across the autosave interval.
- Round-trip still deep-equal, and the file still opens and runs offline on the
  baked example.

### 21.5 The weighting values go too — and what an unentered table means

*Islam, 2026-08-20: "Clear the weighting values as well and proceed."*

Cleared as migration `005-clear-weighting.sql`: every per-unit factor value,
every written reason beside an impact judgement, and the prior cycle carried for
comparison — a 2025 split that never happened, against units the group no longer
has.

**What stays is the model, not the content.** The four factors — Revenue
contribution, Profit contribution, Impact on group, Potential growth — keep
their types, their bases and their 40/30/20/10 weights, because that is
configuration: it says how a unit's weight is *composed*. One row per business
unit stays too, so every unit still has somewhere to enter its figures and still
receives a composite.

**An empty table had to be given a meaning, and the choice matters**, because
the composite feeds the group's compile:

- **Nothing entered at all → every unit counts equally.** Equal weight is the
  default nobody has to defend — the same answer the Key Objectives already take
  when no weights are set (§5.1). The alternative the code actually produced was
  worse than wrong: every share computed to zero, and the rounding correction
  handed the whole 100% to whichever unit happened to be listed first.
- **A share of nothing is a dash, not 0%.** §5.7 again: a factor nobody has
  filled in is not a factor on which every unit scored zero.
- **Partly entered → the units with figures carry the composite.** Contributions
  are now normalised to their own total rather than having the shortfall dumped
  on the largest row. This is invisible on a full table — the contributions
  already sum to 100 — and is the difference between a half-filled table reading
  honestly and reading like a decision.
- The page says so in words while the table is empty, rather than leaving a
  column of identical 10%s to be interpreted.

**Two more defects surfaced.** Emptying a cell did nothing: the setter ignored
anything that did not parse as a number, so a blank field kept the old figure —
a value could be changed but never unset. And the share lists were built from
four hardcoded factor keys, so a factor added through the editor — the whole
point of factors being rows — got no share at all. Both are fixed; shares are
now built from the factor table itself.

The prior-cycle column reads **"Previous cycle · new this cycle"** for a tenant
in its first cycle. `PRIOR_CYCLE` is also rebound on hydration now: it was
assigned only when the payload carried one, so a tenant without a previous cycle
kept the baked-in example's 2025 split on screen.

---

## 22 · The plan template loses its codes — v2.3

*Islam, 2026-08-20: "in the uploading template of the business units or the
functions there is some sort of coding for the items, can we keep the template
without coding — the platform handles the coding on behalf of the SMO … not to
confuse the uploader with coding and mistakes that might endanger the integrity
of data?"*

### 22.1 The rule that made it possible

Codes were in the template for one reason: to answer *is this row an update, or
a new item?* Every attempt to remove them ran into that question, and every
answer to it was worse than the codes — matching by name turns a rename into a
duplicate; a hidden key is a key someone can still break.

The question was dissolved rather than answered. **An upload authors a plan; it
does not amend one.** After a plan is loaded, editing happens on screen. A
second upload is a new plan, not a correction to the last. With no row ever
matched, no row needs an identity typed into a sheet, and the whole ID column
goes — along with the class of mistake it carried.

The coding system itself is untouched. `MB01`, `mobile-P1`, `mobile-P1-M1` are
minted on arrival exactly as they are when a pillar is added on screen, and
renumbered the same way when things are reordered. *A code that is never typed
is a code that can never be typed wrong.*

### 22.2 One generic template, one unit per file

The template is the same file whichever unit is being planned. Nothing in it
names a unit except **one cell on the Read me sheet** — a dropdown of the
tenant's business units — and that cell is what the platform reads to know
whose plan it is.

*(This reverses an intermediate decision taken the same day. Islam's words were
"one template without the need of downloading a template for each unit"; that
was first built as one file carrying ALL ten units, with a Business unit column
on every sheet. Islam corrected it: the upload is one unit at a time. The
single-unit reading is both what he asked for and the better design — with one
unit per file, every pillar in the file belongs to that unit, so the Pillar
dropdown cannot offer a pillar from somewhere else and there is nothing left to
validate about it.)*

The capability template works the same way, with a Capability dropdown. It is a
separate file because a capability is a different shape — projects with
deliverables, outcomes and milestones, not pillars with measures and tactics —
not because it belongs to someone else.

**A plan must arrive as the .xlsx template.** A flat CSV has no Read me sheet
and so cannot say which unit it is for; guessing would write one unit's plan
into another, which is the worst accident this flow can have. Reporting still
takes a CSV, because reporting is per unit and the unit is chosen on screen.

### 22.3 Replacing archives, it does not delete

*Islam: "the replacing of any plan shouldn't delete the old but archive it
silently after the warning so we can retrieve later if needed."*

Before a plan is written, the outgoing plan is snapshotted whole — foundation,
aspiration, objectives, SWOT, pillars, measures, tactics **and every figure
reported against them** — and kept. The review says what is coming off the
screen and what it holds; confirming archives it and writes the new plan.

**Archived plans** on Manage lists them newest first with what each held, who
replaced it and when, and a **Restore**. Restoring is the same act in reverse:
it archives whatever is on screen now, so a restore can itself be undone. The
only control in the whole flow that destroys anything is Delete on an archive,
and it asks first.

Archives live in the state graph, not in a corner of the database, so they are
saved, read back and shown by the same machinery as the plan they came from.

**This is not §16.10.** Strategy versions — last year's plan readable *beside*
this year's, browsable and comparable — remains on the backlog. An archive is
restorable, not browsable, and that distinction is deliberate: it is the safety
net the replace rule needs, not the feature it will eventually become.

### 22.4 What the file asks for, in the tenant's own words

- **Theme is chosen by NAME**, never by its code. `OT` means nothing to whoever
  fills the sheet. **"— none —"** is offered explicitly, because a pillar is
  allowed to belong to no theme and the dropdown never used to admit it.
- **Owner is typed**, not chosen. After the clean slate the tenant has one
  person, so a list of people would be one name long and Excel would refuse
  every other name typed into it. It becomes a suggestion list once there are
  people to suggest — helping without ever blocking.
- **The Pillar list is live**: `Pillars!$A$2:$A$400`, read at the moment the
  cell is opened, so a pillar typed a minute ago is offered on the next sheet.
- **Units of measure suggest rather than insist.** A locked list would refuse
  the first legitimate unit nobody anticipated; a tenant's units are its own
  vocabulary.
- **Targets are written as numbers.** Every cell used to go out as text, which
  put Excel's "number stored as text" warning on every target in the file and
  stopped the column sorting or totalling.

### 22.5 The defect that made this urgent

On a unit with no plan, the Pillar dropdown on the Measures and Tactics sheets
was **empty** — its list was baked in at download from the pillars that already
existed — and Excel then refused every pillar name typed into the column. The
same hole sat in the capability workbook's Project column. **A first plan could
not be authored from the template at all**, which the clean slate (§21) turned
from a latent bug into a blocker on the only path into the product.

### 22.6 Verified before handover

- The generic template built and inspected: no ID column on any sheet, Pillar
  list live, theme names with "— none —", Owner with no list, unit list
  non-enforcing, Target numeric, Read me B2 offering all ten units.
- A template filled as a person would fill it, written to .xlsx, read back:
  every code minted in order, every measure and tactic hanging off the right
  pillar, theme names resolved to codes, "— none —" resolved to no theme.
- The flow driven on the real screens: upload → the unit read from the file →
  the review naming it and the 16 reported figures at stake → apply → the plan
  written, the archive listed → restore → the plan back and the replacement
  archived in its place.
- The same over HTTP against Postgres: a first plan writing 2 pillars and
  archiving nothing; a second archiving the first; the archive surviving a page
  reload; a restore landing in the database.
- Round trip and fixed point PASS, with an archived plan written and read back
  deep-equal — a snapshot is the largest single document the state holds.
- Every page walked as every viewer, live and demo, no console errors; the
  offline file clean for all 29 viewers; byte-identical rebuild.

---

## 23 · The company level — v2.5, ported from Islam's own build

*Built by Islam in the project folder outside the repo and ported here
2026-08-20. His §15.13 is reproduced as the decision; what follows records the
port and what it had to reconcile.*

### 23.1 The decision (Islam's §15.13)

A layer between the group and the business unit. **A company is a group of
business units, and each company has its own CEO.**

```
Group — Group CEO
  Company — Company CEO          e.g. Distribution, B2C
    Business unit — BU head
      Custodian
Supporting functions sit beside all of it, at group level
```

**In this version the company level is for VISIBILITY, not strategy.** A company
carries no score and no page of its own. Its purpose is that a company CEO can
see their own units without wading through everyone else's.

**It does NOT group the navigation row.** Built that way and taken out in the
same version: the SMO and the group CEO see everything and already have the
Units fold, so companies added a second layer of folding to a row that was
working; and a company CEO sees only their own three or four units, so there is
nothing to group. *The grouping solved a problem neither viewer had.* Recorded
rather than deleted — the company level is real and useful, and it was the
navigation that was the wrong place to express it.

**Both visibility flags are per company, not global.** Whether a company CEO
sees the other companies (default no), and whether they reach the group at all
(default yes). A client may want one company CEO measured against the whole and
another not, and that is configuration rather than a rule.

**A unit belongs to a company or is its own — never neither.** *Its own company*
is an explicit choice in Setup rather than an empty cell: an empty cell reads as
somebody having forgotten, and standing alone is a decision. B2B Ecomm,
Corporate, Logistics and Nigeria stand alone today.

**A company CEO is an attachment, not a level.** They sit at N-1 and hold the
same pages a unit head does, on a different set of units. A new level would have
meant a new column in the access matrix for a difference that is about *whose*,
not *which pages* — exactly the split §7.3 already makes.

**A company may have a strategy — optionally.** Closer to *what do you want to
focus on*, cascading to the units beneath. Not built, and explicitly not scored.

**Supporting functions do not belong to a company.** They serve all companies
and therefore all units, and stay where they are: scored by the group, carried
by a function. A company CEO does not own a capability.

**REVERSAL — the closed fold no longer announces where you are.** Since 1.2 a
closed fold carried the current unit as a gold marker. It now remembers
silently: reopening puts you back, and the page below already says where you
are. With the company folds gone there are only two folds again, so the original
argument partly returns — worth revisiting if the row ever feels lost.

### 23.2 What the port had to reconcile

The folder Islam worked in was **older than the repo** — its sources predated
1.9 (`VERSION` read "1.6" inside it) while `main` was at 2.4. Taken wholesale it
would have deleted the capability card and the Cards/Table toggle, capability
import/export, presentation mode for a function, the reporting rail, and
everything from 2.0 on. Measured: `templates.js` 0 lines added and 409 removed;
`present.js` 3 and 191; `xlsx.js` 2 and 187.

So nothing was overwritten. The company work — the model, the access rule, the
two Setup screens, the help text and the fold reversal — was lifted onto 2.4.

**Companies are stored, not baked.** A `companies` table and a `company` column
on `units`, carried in the state graph like everything else. `006-companies.sql`
adds them to a tenant already deployed, since `CREATE TABLE IF NOT EXISTS` skips
an existing database. **The company level survives the clean slate**: companies
are the client's own, like the units and the supporting functions (§21).

**The two company CEOs are demo people only.** `co_dist` and `co_b2c` are
placeholders — "Company CEO, Distribution" is not a person — so they live in the
baked example and are not written into the client's tenant. The SMO attaches
real people when there are real people to attach.

### 23.3 Two defects an authored plan exposed

Both were in the upload built in §22, and both surfaced the first time a real
plan was loaded rather than in any walk:

1. **An uploaded pillar had no code.** `createFromPlan` sets a pillar's id but
   never its `code`, and the rail keys off `code` while the pillar title leads
   with it. Every pillar therefore read **"undefined"** and every rail button
   carried the same key, so the rail could not select between them —
   *"I'm not able to navigate from the rail."* A code is now filled in when
   absent, positionally, by `renumberUnit`. An existing code is left alone:
   nine units carry hand-set ones (`R01`, `CE01`) and renumbering them would
   rewrite codes already printed in decks.

2. **The sticky chrome was pinned three times.** `header.top`, `nav.units` and
   `nav.tabs` were each `position:sticky` at offsets read from `--top-h` and
   `--units-h` — two custom properties set only by `group-shell.html`, which is
   **not the shell the platform is built from**. In the shipped file they never
   had a value, so the hardcoded fallbacks (58px, 45px) stood in. The header
   condenses on scroll, so its real height left those offsets: the rows drifted
   out of register, page content showed through the seams, and the `.18s`
   transitions smeared it — *"on scrolling up the page starts getting hazy and
   damaged, in all pages."* `.chrome` already wraps all three and is already
   sticky, so it is now the only thing pinned. One offset, owned by the browser,
   cannot drift.

**And a third, found while porting:** `renderFocusSetup` was defined **twice**,
and the first — 56 lines returning the Business units screen rather than the
focus one — was dead, because a later function declaration silently replaces an
earlier one. It is the same accident as the double `IMP` found in §22, and it is
what made Islam's copy look as though the Focus measures page were broken. The
dead copy is gone.

### 23.4 Confirmed real

*Islam, 2026-08-20, asked whether Distribution and B2C with those six units are
the client's own companies: "yes they are."*

So the company level is **real content**, not invented — the same standing as
the business units and the supporting functions (§13, §21). It is written into
the tenant by `006-companies.sql` and survives the clean slate.

### 23.5 The horizon is the tenant's to set

*Islam, 2026-08-20: "the horizon in the excel templates is 2029 — the horizon is
something we input, not a default."*

Right, and it was neither. `2029` came from the demo data, the clean slate
missed it, and it therefore survived into the client's tenant and shipped
pre-filled in the plan template. **A year nobody chose reads as a decision
somebody already made.**

- The template's Aspiration sheet now carries *"Horizon (the year this plan runs
  to)"* and leaves it **blank** until the tenant has set one; where they have,
  it is shown so a later plan neither hides nor silently overwrites it. The Read
  me says it is theirs to set.
- Every page that leans on it reads correctly when it is unset: the Temple's
  heading drops its dangling "by", and the horizon pill says **not set** rather
  than trailing a separator into nothing. Same rule as §5.7 — absent is absent,
  never a stand-in value.
- `007-horizon-is-yours.sql` clears it, **but only if it is still the seeded
  `2029`**. A horizon entered since is the tenant's own and is left alone.

### 23.6 Verified before handover

- The company model on the real screens: Distribution (3 units), B2C (3), four
  standing alone; both Setup sections rendering; the Company column on the units
  table.
- The access rule: the SMO reaches all ten units and the group; the Distribution
  CEO reaches Mobile, Consumer Electronics and IT; the B2C CEO reaches Retail
  Stores, Online Shop and Care. Turning `seeGroup` off closes the group to that
  CEO; turning `seeOthers` on opens the other company's units.
- The pillar-code fix through the real upload path: an authored plan for Care
  produced `CA01`, `CA02`, `CA03`, with unique rail keys, and clicking the
  second and third rail items opened the second and third pillars.
- The chrome, screenshotted at four scroll positions: the three rows stack
  contiguously (0→115, 115→161, 161→210) with only `.chrome` sticky, and no
  content bleeds through.
- Round trip, fixed point and archived-plan round trip PASS, with the clean
  slate now asserting 2 companies and 6 assigned units.
