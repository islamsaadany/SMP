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

#### BUILT in v3.12 (2026-08-21) — what the build settled

Islam brought it back in his own words: a *"Finance Strategy custodian … more
of the Finance SMO custodian"* who chooses which of the units' numbers he is
master of and enters them when the cycle opens — *"the finance enters and the
unit has no permission to change."* That is this section, and the design above
stands unchanged. Five things the build had to decide:

**The team is STORED, not read off the person.** §33's instinct is to read a
role from what it is attached to, and here that fails: the person may sit with
the SMO rather than in the function whose number it is — which is exactly
Islam's Finance SMO custodian, who is not Finance's own custodian. The
attribution has to name the number's HOME, not the reporter's desk. So
`row.src = { team, by }`.

**It is a rule, not a matrix cell** (§37). A source's reach is defined entirely
by what it is named on: it crosses units without owning them, and reaches
nothing it is not named on. There is no column to set, because every cell would
hold the same answer.

**The figure and the note had to be split in the authoriser.** Until now a
reported row moved as one thing. `actual` and `progress` are the source's;
`note` is the unit's, always. Splitting them is what makes §16.7's first
settled question enforceable rather than a convention.

**Who is master of a figure is SETUP, not plan and not report.** It is
classified separately so a refusal says *"Setup is the SMO's"* rather than
*"a plan is corrected by the SMO"* — both true, but only one of them sends the
person to the right screen.

**A half-set row is KEPT.** The first build deleted `src` whenever one end was
empty, which made the control impossible to complete: choosing a team dropped
it because no person was set, and choosing a person dropped it because the team
had just been dropped. **A control that cannot be completed is broken**, and it
was only visible by driving the real page. A half-set row is now stored, shown
as *Needs both*, and does nothing until both ends are set.

Two screens: **Setup › Source of figures** (the SMO assigns, one unit at a
time, like Focus measures) and **Manage › Figures I report** (the source's own
surface, every unit at once — the point is that Finance enters revenue once
per unit in ONE place rather than visiting ten pages). The second is hidden
outright for anybody named on nothing: a menu entry that opens an empty page is
worse than no entry.

**Scope, stated:** unit key objectives and unit key measures. Capability
projects — deliverables, outcomes and milestones — are not sourced yet.

#### RESHAPED the same day: one decision, then ticks

Islam, on seeing it: *"that's a huge setup to do and not practical … he just
needs the measure and target so he can tick if he owns this or not."* He was
right, and the number says why: **116 figures across ten units**, each asking
for a team AND a person before the feature did anything for anybody.

What the data also said, measured rather than assumed: only ONE measure name
repeats across units, so "set it once by name" would have saved nothing —
but **27 of the 116 are money** (B EGP, M EGP, EGP), spread across all ten
units. The thing that separates a team's number from the unit's is not its
name; it is what it is measured in. Which means the work is one selection and
a run of ticks, not 116 decisions.

So: **WHO is chosen once at the top**, and every row below is a single mark —
the same shape as Focus measures, which asks the same kind of question (A13).
The units are **buttons in a row rather than a dropdown**, with their counts on
them, so where the work is left is visible without opening anything. And the
row shows the measure and its target and nothing else: the direction, the
compile rule and the pillar are the plan's business, not the custodian's.

Three states per row, not two: unclaimed, mine, or **another team's** — the
third shown as that team's name rather than a tick that could be overwritten
without noticing. Switching the team at the top is how you release it.

This also retires the half-set problem that the first build had: a mark is
only offered once both ends are set, and it writes both at once.

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

### 16.14 The Strategy Copilot inside SMP — one surface, two products

*(Islam, 2026-08-21, parked by him: "I want to keep it with you and I will come
back to it later." Recorded because the one question he asked outright has an
answer, and answering it later from memory is how answers drift.)*

**What he wants.** SMP's users able to use the Strategy Copilot to refine their
plan, talk through challenges, and search what was written and reviewed before —
eventually with a plan built in the Copilot arriving in SMP's planning cycle as
a submission.

**His question: the same repository, or two?** **Two, and one surface.** The
user never sees two products: they are on their plan, they open a Copilot panel
beside it, and it already knows which unit and which cycle they are looking at.
But SMP holds the client's authoritative numbers and answers only to its own
database, while the Copilot talks to a model provider. One repository means one
deploy, one dependency tree and one blast radius — a Copilot change could take
down the system of record, and every Copilot dependency becomes a dependency of
the thing holding a client's strategy.

**Where the line sits, in one sentence: the Copilot may PROPOSE, SMP DECIDES.**
The panel is the Copilot's, rendered inside SMP's page, and every request it
makes carries the SMP session — so it can only see what that signed-in person
can already see. It reads plans and past reviews, and writes a DRAFT. A draft
becomes a plan only when a person submits it through SMP's own cycle, which is
where §42's authorisation and change log already are.

**Two consequences, so they are not surprises later.** The panel exists only in
the hosted platform: the single-file handover has no server to talk to, so
there is no Copilot there and it simply does not appear. And **the read scope is
a security question, not an AI one** — "the Copilot can search previous plans"
means a model provider sees a client's strategy. It belongs with §43's open
items, not after them.

### 16.13 The assignment memory — Forefront's own, not a tenant's

*(Islam, 2026-08-21. Captured on arrival, per rule A8. He has previous work on
this to share, which comes in before anything is designed.)*

**The idea.** A conversational bot that asks Forefront's consultants about the
assignments they worked on — what was achieved, what was learned, what went
wrong — and turns those answers into a **standardised corporate memory**. The
purpose is not the record: it is that the next assignment starts from the last
one, and that Forefront's position is argued from what it has actually done.

**The one structural thing already clear**, and it is the reason this is
recorded here rather than in a tenant's backlog: **this lives ABOVE the
tenants.** A client's tenant holds that client's strategy and nothing else
(§21, §36). Forefront's memory of an assignment is Forefront's, spans clients,
and must never be reachable from inside a tenant. It is a different product on
the same shelf, exactly as the Copilot is (§16.14).

**Not designed.** Waiting on the previous efforts Islam is bringing, so the
standard it produces is built on what has already been tried rather than
invented beside it.

### 16.15 The unit's Performance page fails contrast in light mode

*Found 2026-08-23 while building §50, and NOT fixed there — it is a palette
decision on a page that version was not asked to touch (§25's precedent, where
light mode's 61 failures were recorded rather than fixed inside a dark-mode
change).*

**31 failing runs** across the two light palettes: 17 in slate/light, 14 in
forefront/light, 0 in either dark. Every one of them is a **scoring colour used
as TYPE** — `71%`, `88%`, `58%` and the `%` suffix beside them, at 3.19–4.45
against a needed 4.5. That is §38.5, which was closed once by giving every
scoring colour a `-tx` twin for words; this page did not get them.

**Why nobody saw it.** The contrast sweep clicked a unit and called what
appeared `unit/perf`. Since §28 a unit opens on **Strategy › Plan**, so that
label measured the Plan page twice and the Performance page never. The sweep now
clicks Performance explicitly and labels the landing page `unit/landing`, which
is what surfaced these. **A check that measures the wrong page passes.**

The fix is the `-tx` twins applied to `num.final`, `rnum`, `.appear b` and the
`SMALL` suffix on that page. It is small; it is a visual change to a page Islam
looks at, so it waits for his word (rule 1c).

### 16.12 Images in review mode — BUILT in v3.18

Review mode should accommodate **images**: a screenshot of a platform or an
outcome, or an uploaded picture slide placed at a chosen point in the deck.
Designed and built as **§50**, 2026-08-23.

---

### 16.11 The people register — agreed, not yet built

Islam, v3.5: *"enable me to add names not only from a list … which will need
that we have an employees list in the setup pages for the employees with ID,
names, titles, Units, numbers, and reset password functionality in that table,
adding employee and removing employee etc. which will serve later for the
password management and access management."*

A Setup page listing everyone: id, name, title, unit, contact number, with add,
remove and **reset password** on the row. The owner fields on Business units and
Supporting functions become type-or-pick rather than pick-only, and a typed name
that is not yet known **creates a person** in the register rather than a loose
string.

Why it is its own version and not an item in a list: `people` is already a table
that everything references by key, and password reset already exists as a server
action bound to Levels & access. Joining those two, and making a free-text field
mint a person, touches the data model, the round trip and identity — not a
screen. It also has a decision inside it that has not been taken: **removing a
person who has reported.** Units and functions are retired rather than deleted
for exactly that reason (§30.3), and a person carries reported history the same
way.

Sequenced immediately after v3.5 at Islam's direction.

---

## 51 · The capability half catches up, and slides get a place (v3.19)

*2026-08-23, in one long sitting. Islam went through the built product and sent
notes as he found things. Almost none of it is a feature: most are paths that
had been broken since a rename, or fields nothing read, or controls that looked
like one thing and behaved as another.*

### 51.1 A paragraph typed as two paragraphs now reads as two

The editing control is a `<textarea>` and kept every line break; the READING
control was a bare `<span>`, and HTML collapses newlines to a single space. **The
text was never lost — it was never shown.** `white-space:pre-line` lives on the
one function every long-text field goes through rather than on each caller.

Half of the complaint was the other end: every box was `rows="2"`, so a purpose
written as three paragraphs was typed through a two-line window. Enter worked
and you could not see that it had. The box grows with its content now — which is
not a repaint, so it is safe on `input` where a repaint would destroy the field
being typed into (§35). Measured: 104px to 217px.

### 51.2 The capability template says which function it is for

B2 named the capability and nothing named the function under it, so two
functions with a similarly named capability could not be told apart: the first
match in the array won, silently, into the wrong function's plan. B3 is a
dropdown of the tenant's functions now and the import resolves within it.

**A blank B3 still resolves across the tenant**, because a template people keep
on disk for months and which stops opening is a template that has broken.

### 51.3 A project is the function's pillar, so it is coded and framed like one

The unit rail has shown `MB01` since §46.3 and the project rail beside it showed
a bare name — the same component, addressable on one page and nameless on the
next, with no way to say "FIN02" in a meeting. `projCode()` derives
`prefix + position` exactly as `pillarCode()` does, DERIVED and never stored.

All three project panes carried an `.ptitle` with a 19px `<h3>` — the shape the
unit's pane had until §46.3 replaced it with the 33px coded band. They wear one
header now, and `pillarBand`'s `right` slot, which had existed and never been
used, carries the score.

### 51.4 The function's nameplate is gone

It printed the name, the people, the capability count and "scored by the group"
above a navigation row that already highlights the function. §24's argument, and
the unit pages had settled it two versions earlier by having **no such band at
all**. It was also lying with nobody attached: *"Supporting function · · carries
1 capability"* — two middots with nothing between them, which is what a joined
empty list looks like.

### 51.5 The worst reading in the product, on the word the band exists to say

There were **two `.capline` blocks** in one file — one on `--surface-2`, one on
`--panel` — and the second won on source order, so editing the first did
nothing (§29.2: a duplicated CSS rule does not fail loudly, it quietly ignores
you). The band had moved to the navy ground and kept the PAGE's ink: the
capability's own name measured **1.72:1** in slate and **1.43:1** in forefront.

It takes `--panel-ink` and `--panel-quiet` now, as `.grouphead` and
`.rail .rhead` already did — §38.5 and §41.10, the **sixth** header, missed when
the other five were converted.

**And nothing had ever looked.** The contrast sweep covered the group, one unit
and Setup; every function page had gone twelve versions unmeasured. §41.5 again:
a page nothing navigates to is a page nothing measures.

### 51.6 Three things found by using it

**A function's "Shown in the nav" was not shown in the nav.** Both branches that
build the navigation read the full name, so the field was stored, printed in the
Setup table, editable there, and read by NOTHING. §45.1's fault in a fourth
tree: a read that never happens fails silently, and it fails looking like the
feature was never built.

**The searchable dropdown closed on any scroll** — including scrolling its own
list. The note beside it argued that closing was honest because the popup is
`position:fixed`; that held while every list fitted the viewport. A list long
enough to scroll breaks it: reaching for the twelfth entry scrolls the popup's
list, the scroll bubbles to the window with capture on, and the control shuts
under the pointer. It follows its button now and closes only once the button has
left the screen.

**And the editor's picture slots wrapped** — a slide is a fixed 1600×900 stage
where there is always room, and a dialog is not.

### 51.7 One button, two words

*Islam, twice: "I want it a switching button where the 2 words stay on 1 button
but on clicking the selection switches."*

It had LOOKED like one segmented control since §41.8 and it was **two buttons
inside a container dressed to look like one** — so you pressed the side you
wanted rather than pressing the control, which is a different thing and is what
he kept reporting. I measured the container, showed him it was one box, and
argued the point. **The measurement was true and the answer was still wrong:
measuring the thing you built proves what you built, not what was asked for.**

Hover used to light the unselected word — right for two buttons, since you were
pointing at the side you meant. With one button it made both halves look lit and
the state unreadable at the exact moment somebody was looking at it. Hover lifts
the whole control now.

### 51.8 Manage slides — a mode laid out like the deck it edits

*Islam: "the buttons shouldn't be pictures it should be manage slides which
opens the slides list on the left like PowerPoint and on the right are the
slides view … think of the customer experience to have something functional."*

**THE LEFT RAIL IS THE WHOLE DECK**, not just the picture slides — every
generated slide too, as REAL slides at one tenth rather than drawings of them,
so a slide that is wrong is wrong in the rail too.

That is what made **the position dropdown disappear**. Where a picture slide
goes is said by where it sits, which is how anybody who has used slides expects
to say it. §50.3 is unchanged underneath — the anchor is still read out of the
deck — but it is read from where you dropped the slide rather than typed into a
list describing the deck in words.

A **mode** rather than a dialog, for the reason presenting is one: this is
looking at a deck, and a deck does not fit in a 940px box.

**A blank slide is visible in the editor and nowhere else.** A slide with no
picture is not a slide and must never reach a projector (§50.2) — but the moment
after you press Add a slide it is exactly that, and a rail that does not show
the thing you just made has swallowed it.

**Patching the rendered slide does not survive a field going from empty to
filled**: typing the first title had no heading element to write into, because a
slide with no title has none. The selected slide is re-drawn from the one
function the deck itself uses.

### 51.9 Fit is the default, not fill

*Two of Islam's notes turned out to be one note.* "Allow me to zoom out more as
the zoom in is too big" and "pictures need to be wrapped to fit in the space you
give to it in the slide" describe a single fault: the frames were
`object-fit:cover`, which fills the box and throws away whatever does not reach
the edge — so a portrait infographic in a landscape frame lost BOTH its edges,
and the zoom slider could only make it worse, because 100% was already the
tightest crop on offer. **There was no way to say "show me all of it."**

So a picture fits its frame whole, and FILL is the deliberate choice for a
photograph that should bleed. §16.12 asks for a screenshot of a platform before
it asks for anything else, and a screenshot with its edges cut off is not a
screenshot of anything. Two words rather than a slider position.

The frame's ground moved to the slide's own white: with `contain` the picture no
longer fills its box, so whatever sits behind it becomes a letterbox band **on
the slide**, and a grey band around a screenshot reads as part of the design.

**Up and down**: a picture slide steps over its neighbour whatever kind of slide
that is — which is how a picture gets from the end of the pillars to the end of
the SWOT without anybody naming an anchor. Add and the arrows are the SAME act,
so they are one function; it removes the slide from the list FIRST, or the count
of what sits before it includes itself and the slide creeps.

### 51.10 Adding a capability took the product down

The add button pushed `{ name, def, measures:[], tactics:[] }` — the shape a
capability had **before §15** replaced measures and tactics with key objectives
and projects. So the row had no id, no function and neither list, and the
Capabilities Setup page threw and rendered nothing at all. Removing one read
`measures.length` on an object that has not carried `measures` since §15, so it
threw before it could confirm and never removed anything.

**§24's rule with the sign reversed: when a field is renamed, the code that
CREATES it has to be found as well as the code that reads it.** A reader that
crashes is at least loud. A writer that mints the old shape is silent until
somebody opens the page that reads it — which here was a different page, reached
from a different menu, so the two were never seen together.

One function mints a capability now, with an id taken from the highest in play
rather than from the length, so removing one and adding another cannot hand the
newcomer a dead row's id. The Setup table is editable: the name typed rather
than printed, Remove on the row, Add beneath it, and a confirmation that names
what would be destroyed.

### 51.11 What the checks taught, three times in one day

**A CHECK KEYED ON MARKUP THAT NO LONGER EXISTS DOES NOT FAIL — IT PASSES
QUIETLY.** Three instances, all found by looking rather than by a red run:

- The contrast sweep clicked a unit and called what appeared `unit/perf`. Since
  §28 a unit opens on Strategy › Plan, so for twelve versions it measured the
  Plan page twice and the Performance page never. Clicking Performance
  explicitly surfaced **31 failures that had been there all along** (§16.15).
- A scoped probe of mine broke when I edited the sweep it string-matched, and
  silently reported the page behind as the new surface — 0 failures became 63,
  none of them real.
- Removing the two-button fold would have broken both sweeps: `qa.py` would have
  iterated nothing and reported "ok" having walked HALF THE PRODUCT, and the
  contrast sweep, which found buttons by matching text, would have clicked the
  switch believing it was opening a fold.

**The rule: when a control changes shape, grep the checks for the old selector
before trusting the next green run — and make the label say which page was
actually scanned.** Both sweeps ask what is LIT now and fail loudly when the
answer is wrong; the SMO walks 34 destinations.

### 51.12 Still open, deliberately

**§16.15** — 53 failing contrast runs across both Performance pages, all light
mode, all scoring colours used as TYPE. Recorded and not fixed: a palette
decision on pages this version was not asked to touch (§25's precedent).

**The header and the rail** (Islam's item 2: sticky, bigger header, smaller
rail) — a visual change, so it waits for agreed numbers.

**Functions that plan in pillars** (§52) — designed, not built.

---

## 50 · Collaborators, and pictures in the review (v3.18)

*2026-08-23. Two asks from Islam, one small and one not: "in the tactics table
add collaborator so we have Owner which is 1 person and Collabs. which are the
people who will support", and "in the presentation I want to add a feature for
the custodian to add a slide with pictures where he uploads pictures to add in
certain slides and adjust these pictures in the slide."*

### 50.1 The collaborators were already there. Nobody could see them.

A tactic has carried `collaborators` since the import template was built
(§22): the upload writes them, `tactics.collaborators` stores them, and
`SMPRules.namedOn()` reads them to decide whether a Contributor may report a
line that is theirs (§42). Three things kept the feature invisible.

**Nothing in the product could set them.** They arrived with the upload or not
at all, so a name that changed after a plan landed meant re-uploading a whole
unit to fix one word.

**There was no column.** They were a small grey *"with A, B"* line under the
owner's name on the unit's Performance page, and absent from the Plan page and
from the deck entirely — so on the two surfaces a client actually sees, the
people supporting a tactic did not exist.

**And no tactic in the demo had any**, so all 116 rendered nothing. This is
§45.2 exactly: *a feature that renders nothing looks like a feature that was
not built.*

**ONE PERSON IS ACCOUNTABLE AND SEVERAL SUPPORT THEM — that is two facts, so
it is two columns.** Owner is unchanged and still one name. Collabs. sits
beside it on all three tactics tables, quieter than the owner, wrapping rather
than growing the row (measured: every row still 61px). Nobody supporting reads
as an em-dash, never "Missing" — absent is a real answer (§15.1).

**Correcting them is the SMO's** (Islam, asked and answered 2026-08-23). It is
the same pen that corrects the rest of the plan, behind the same gate (§31),
and the reason is not tidiness: **being named on a tactic is what decides who
may report it**, so a unit that could edit its own collaborators could hand
itself reporting rights the access matrix never gave it.

Demo collaborators were added to **Retail Stores only**. Mobile's plan is the
client's real one, and who supports its tactics is not Forefront's to invent
(rule A4, §B3).

### 50.2 A picture slide is not a slide. It is a title, a place and a picture.

§16.12 asked for images in review mode and left it undesigned. The design
follows from the one thing that makes presenting out of the platform worth
doing: **the deck is built fresh every time it is opened and there is no
exported copy** (§8.8). A figure corrected an hour before the meeting is the
figure on the slide.

So what is stored is never a slide. It is a **title**, a **position**, an
**arrangement** and the **pictures**; the slide is assembled at the moment the
deck opens, beside figures current to the minute. A stored slide would be the
exported deck the whole feature exists to avoid.

### 50.3 Where a picture can go is the deck itself, not a list beside it

A position is an **anchor**: a named point written on the slide it names,
carrying its own label. The picker is built by generating the deck into a
detached element and reading those anchors back — so **the list of places a
picture can go IS the deck**, and the two cannot drift. A slide added to the
deck later gets a position for free, or gets none, and either way that is one
decision in one place rather than two lists that agree until they do not.

Twelve for a unit (cover, aiming at, where it stands, the objectives table,
SWOT, the overview, one per pillar, notes, attention, last), five for a
supporting function.

**Inserted BEFORE the fit pass**, deliberately: the fit pass CLONES a long
table's slide to continue it, so a picture inserted afterwards could land
between a table and its own continuation, and an anchor read after cloning
would match twice.

**AN ANCHOR THAT IS NO LONGER THERE IS NOT A LOST SLIDE.** A pillar can be
renamed, replaced by an upload or removed between the day a picture was placed
and the day the deck is opened. The picture then goes to the end, still in the
room, rather than being silently dropped.

### 50.4 They belong to the CYCLE

*(Islam, asked and answered 2026-08-23.)* A picture is evidence for one review
— the store that opened, the screen that went live. It is archived with the
cycle's figures when the cycle closes and the next cycle starts with a clean
deck, exactly as the unit's note does (§49.1). The alternative was put to him
and rejected on the reason that decides it: **a picture that stays presents
itself as this cycle's until somebody remembers to take it out, and nobody
does.**

Archived rather than dropped, because a restore that gives back the numbers
and not the pictures has not restored the review.

### 50.5 Who may add one is not a new rule

*(Islam: the custodian, the owner and the SMO.)* A picture put in front of the
board **speaks for the whole unit** — which is the same act as submitting and
the same act as the cycle note. So it is not given a rule of its own: it is
classified with them, under `reportState`, and both sides ask **one function**
(`canSpeakFor`). A contributor limited to their own lines does none of the
three; a locked cycle stops taking all three together.

That is §42's whole argument applied rather than re-learned, and it was
**measured rather than assumed**: for every one of the 31 people against every
one of the 10 units and 7 functions, the browser's answer was compared with
the real server authoriser's verdict on the same change. **527 questions, zero
disagreement.**

The honest consequence, recorded rather than hidden: a locked cycle refuses a
picture the same way it refuses a figure. That is right for figures and
arguable for pictures, since a review meeting can happen after the lock. It is
left matching the note rather than given a fourth rule; revisit if it bites.

### 50.6 What the building taught

**A COLOUR THAT CLEARS ON WHITE IS NOT THEREBY CLEARED — §38.5 for the fifth
time, and this one is written down by number.** The empty picture slot put
`--gold-deep` on `--surface-2`: 4.45:1, needing 4.5. CLAUDE.md records that
exact figure from §46, and I walked into it anyway. The ground moved to
`--surface`, where the accent clears, and hover moves the BORDER rather than
the fill — moving the fill would have put the failure straight back.

**A RULE NAMED AFTER ITS PARENT APPLIES TO ITS PARENT AND TO NOTHING ELSE.**
The arrangement classes were written `.pgrid.pg2`, and the editor's container
is `.picslots` — so every arrangement silently stacked into one column. It
cost nothing to fix and would have cost nothing to find, except that it is
invisible in the source and obvious in a screenshot: **the layout was verified
by looking at it, not by reading it** (B1).

**READING MUST NEVER WRITE.** `pslidesOf()` returns a shared frozen empty
array rather than creating the field it was looking for. That is §42's
`branding()` fault — a reader that mutates what it reads makes every save
carry a change the database never held, and every non-SMO save is then refused
for ever. Removing the last picture deletes the key too, so a tenant that
tries the feature and abandons it is left byte for byte where it started.

**ENCODED BOTH WAYS, AND THE SMALLER ONE KEPT.** §16.12 asks for two different
things, and they want opposite formats. Measured, not reasoned: a screenshot
of a table is **164 KB as PNG against 256 KB as JPEG**; a photograph is
**395 KB as JPEG against 3,058 KB as PNG** — seven times. Guessing from the
file's own type gets both wrong the moment somebody pastes a screenshot saved
as .jpg, so the browser encodes it twice and keeps the smaller. Pictures are
shrunk to 1,600px on the long edge first, because the stage is 1600×900 and
anything more is detail nobody in the room can see, carried in every save for
ever.

**ONE WAY INTO THE DIALOG.** §48.4 made the modal actually modal — inert page
behind, remembered focus, announced only when open — and two callers had been
left behind setting `.on` by hand. They get a dialog that only looks like one.
`openModalHtml()` is now the single door and all three go through it.

**AND A CHECK THAT MEASURES THE WRONG PAGE PASSES.** The contrast sweep
clicked a unit and called what appeared `unit/perf`. Since §28 a unit opens on
**Strategy › Plan**, so for twelve versions that label measured the Plan page
twice and the Performance page never — silently, and in the safe direction,
which is §45.1's fault arriving in a third tree. Clicking Performance
explicitly surfaces **31 failing runs that have been there all along**, all in
light mode, all scoring colours used as TYPE (§38.5 again). They are recorded
here and NOT fixed: that is a palette decision on a page this version was not
asked to touch (§25's precedent), and it is now item §16.15.

The two new surfaces measure **0** across all four palette-and-theme
combinations.

### 50.7 What it is not

Free placement was offered and not chosen: dragging pictures anywhere and
resizing them freely is a drawing tool, and the slides would stop matching the
rest of the deck — the first thing that reads as a different product (A13).
The arrangement is chosen, the crop is free within its frame, and a caption is
optional.

Not sourced from anywhere: pictures are uploaded, never linked. A linked image
would break the offline single-file handover and put a request to a third
party on every load of a file holding a client's strategy (§26.1's argument,
one surface out).

---

## 17 · Version history

### v3.19 — the capability half catches up, and slides get a place

Almost none of it a feature. **Adding a capability took the product down** —
the add button minted the shape a capability had before §15, and the
Capabilities page threw; it can be added, named and removed now. The capability
pages take the pillar pages' design: project codes, the coded band on every
pane, the nameplate gone, and a capability name that measured **1.43:1** on its
own band. **Manage slides** becomes a mode with the deck down the left and the
slide on the right, where a picture fits its frame whole and moves with the
arrows. **Units | Functions becomes one switching button.** And a function's
"Shown in the nav" is finally shown in the nav (§51).

### v3.18 — collaborators get a column, and the review gets pictures

Two asks. **Collabs.** joins Owner on all three tactics tables — the data was
already there, arriving with the upload and deciding who may report a line,
with no way to set it and no column to show it. And **picture slides**: the
custodian, the owner or the SMO adds a titled slide of one to four pictures,
crops each one inside its frame, captions it, and places it at any of twelve
named points in the deck. They belong to the cycle and are archived with its
figures when it closes (§50).

### v2.9 — two lines of chrome, and one way in

The header carried the product name, the org name, the unit name, a derived
"Group · 10 business units · H1 2026" tag and an Info button, on top of the two
nav rows below it — five statements of where you are, above a row that already
says it. It is two lines now: the product on the left, who you are looking as in
the middle, Demo data and Sign out on the right; then the navigation. Setup and
Manage, two glyphs at the right of the nav row, became one worded **Manage**
button with a menu listing all ten destinations. Nothing about the pages moved
(§24).

### v2.8 — the cap that would not settle

v2.7's own fix carried a feedback loop: a rail capped against the measured
chrome height changes the page height, which re-clamps the scroll, which flips
the header, which changes the measured height. It oscillated forever and nothing
in the rail could be clicked. The cap is a constant now, and the header will not
condense on a page with no room to scroll — the loop's second door (§23.7).

### v2.7 — the rail was pinned under the chrome

The rail was `position:sticky; top:12px` — twelve pixels from the top of the
window, beneath a sticky header up to 258px tall. Scrolled, its first rows slid
under the chrome, which then swallowed the clicks: the rail could not navigate
on any page. Pinned below the chrome now. And the chrome itself had no
background, so mid-condense the page showed through the gap between a container
animating its height and children animating their padding — the haze (§23.6).

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

### 23.6 The rail was pinned under the chrome — v2.7

*Islam, after v2.5 shipped: "I still can't navigate", and "the glitch of the
scrolling up still is there."*

Both were still true, and §23.3's two fixes — real, and both needed — had not
reached the cause. The cause was one line:

```
.rail { position:sticky; top:12px; }
```

**Twelve pixels from the top of the window**, while the chrome above it is a
sticky bar 169px tall condensed and 258px expanded. So the moment the page
scrolled, the rail's first rows slid *underneath* the chrome — and since the
chrome sits above them in the stacking order, **it swallowed the clicks**. The
item pressed was a navigation button. Proved with `elementFromPoint` over each
rail row: at rest every row hits itself; past 500px of scroll the first row
hits `BUTTON.primary` in the nav.

Pinned below the chrome now, at `calc(var(--chrome-h) + 12px)` — the same
measured height `.pheadwrap` already used, so it follows the header as it
condenses instead of guessing. A `max-height` keeps a long rail inside the
window rather than running past the bottom.

**And the haze had a second cause: `.chrome` had no background of its own.** It
relied on its three children tiling it exactly, which they do at rest — but not
mid-condense, when the rows animate their padding over .18s while the container
animates its height. Measured at 169px against children summing to 170: every
frame where the two disagree, the page showed through a transparent parent.
A floor cannot have a gap.

*The lesson worth keeping: v2.5's fix removed three competing sticky offsets and
was verified by geometry — rows stacking contiguously — which was true and did
not answer the question. What proved this one was asking what the user's click
would actually hit, and what a transparent container shows when its children
briefly do not cover it.*

### 23.7 The cap that would not settle — v2.8

Testing v2.7 the way Islam uses it — **served, signed in, on a cleared tenant,
against a plan that arrived by upload, clicked while scrolled** — the browser
driver refused to click at all: *element is not stable*, retried for thirty
seconds. An element that never stops moving cannot be clicked, which is the
same complaint by another route, and this one was **introduced by v2.7's own
fix**.

The cap added beside the offset was the cause:

```
max-height: calc(100vh - var(--chrome-h) - 24px);
```

It closes a loop. The cap follows the measured chrome; the cap changes the
page's height; the page's height re-clamps the scroll position; the scroll
position crosses a condense threshold; the chrome changes height; the measured
value changes. Traced at 240 → 243 → 290 → 240 → 290, forever.

**A sticky OFFSET is safe because it changes nobody's height. A max-height is
not.** The cap is now a constant — `calc(100vh - 320px)`, 320 being the tallest
the chrome gets plus the gap — and 100vh does not move.

**And the loop had a second door, which the constant alone did not close.** The
chrome is in flow, so condensing it shortens the document by ~40px on every
page, not just this one. Where a page is barely taller than the window that
shortening re-clamps the scroll and flips the header straight back. The
hysteresis (condense at 70, expand at 20) was built to stop one flip causing the
next, and cannot help here, because the flip comes from *the document changing
height*, not from anybody scrolling. So the handler now asks first whether there
is any point: **no room to scroll, no condensing.** Reclaiming 40px on a page
with 60px of scroll was never worth it.

**One residual, and it is not a defect.** On a very short window, the first rail
row can sit behind the chrome — because a sticky element cannot float outside
its container, and on a short page the whole section has scrolled up with it.
`--chrome-h` measures correctly (258) and the rail is pinned correctly; the
container simply ended. That is what sticky does, and making the rail escape its
container would be worse than the symptom.

### 23.8 Verified before handover

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

---

## 24 · The chrome becomes two lines — v2.9

### 24.1 What Islam asked for

Six changes, in his words:

1. Remove the "Group · 10 business units · H1 2026" line.
2. The Demo data button moves to the top right.
3. Remove the title of "B2B eComm" — i.e. the org-and-unit heading.
4. The navigation bar becomes the second line of the system.
5. The first line: **Strategy Management Platform** on the left, Demo and Sign
   out on the far right, "Viewing as" in between.
6. Merge Setup and Manage into one **Manage** button with a dropdown to reach
   each.

Asked what he meant by (6), he answered with the test: *"we are just combining
them under 1 list … but still every button will take us to their place."* That
is the whole contract — the merge is about the way IN, not about the pages. Each
of the ten entries opens exactly the page its icon used to open, with the same
tab row underneath it. And he asked for the per-page **Info** button to go.

### 24.2 What the header was carrying

The first line held five things that all answered the same question:

| Element | Said |
|---|---|
| `.eyebrow` | "Strategy Management Platform · Spec 012" |
| `#title` | "Raya Trade — B2B eComm" |
| `#shapetag` | "Group · 10 business units · H1 2026" |
| `#pageinfo` | Info |
| `#demobtn` | Demo data |

Below it, the nav row already highlights the unit you are on, and the tab row
below that names the page. The header was repeating the row twice and spending a
whole line to do it. What survives is what the row below cannot say: which
product this is, whose eyes you are looking through, and the two controls that
leave.

### 24.3 Merging the two icons into one menu

A gear and a stacked list sat pinned at the right of the nav row. Between them
they held ten destinations, and which glyph held which page was something you
had to remember rather than read. One worded button reads instead:

```
MANAGE ▾      MANAGE            SETUP
              Reporting cycle   Labels
              Import            Levels & access
              Archived plans    Scoring bands
              Focus measures    Business units
                                Supporting functions
                                Capabilities
```

The two groups stay **named** inside the one list, because they are genuinely
different kinds of thing — what the SMO does every cycle, and what was decided
once (§15.14's distinction, unchanged). Merging them into an unlabelled run of
ten would have thrown away the only thing the two buttons were ever telling you.

`SUBS.manage` and `SUBS.setup` are untouched, and so is `defsFor` — the menu
sets `current` to `"manage"` or `"setup"` and `currentSub` to the entry's own
key, then paints. That is precisely what clicking the icon and then its tab did.
The sub-tab row stays: the menu is the way **in**, the tab row the way **around**
once you are there.

Three details the menu had to get right:

- **Access.** An entry appears only where `grant()` allows the page, and a group
  heading only where that group has at least one entry left. The button itself
  disappears when neither has any — the same rule the two icons followed.
- **Where it is anchored.** The panel is absolutely positioned, so however long
  the list grows it never widens the nav row or shoves the unit tabs along.
  `.units-in` is `overflow-x:visible` (arrange.css overrides the base sheet's
  `auto`), which is what lets the panel hang below the row rather than be
  clipped by it.
- **`here` and `open` are different states.** The button is gold when you are on
  one of its pages, lit when the menu is showing, and both can be true at once,
  so they do not share a style.

### 24.4 What the removals took with them

Deleting an element and leaving its CSS behind is how dead rules become live
bugs somewhere else. Two of these already were:

- `.eyebrow { overflow:hidden; max-height:20px }` and
  `body.scrolled .eyebrow { opacity:0; max-height:0 }` were written for the
  header's kicker — but `.eyebrow` is also the **deck slide's** kicker, at 17px.
  A 20px clip and a `body.scrolled` fade meant for a condensing header were
  reaching a full-screen slide that has neither. Entering presentation mode
  while scrolled would have faded the slide's own kicker to nothing.
- `.shapetag` and its `body.scrolled` size rule had no other user at all.

Both went with the elements. `PAGEINFO` itself stays — the explanations are
still reachable from the `[data-modal]` links inside the pages.

### 24.5 Verified

- **The ten destinations, over HTTP, signed in as the SMO.** Every entry opened
  its own page with the right sub-tab selected — `manage/cycle` → "Reporting
  cycle" … `setup/caps` → "Capabilities" — and the button read as gold on all
  ten. Zero console errors.
- **The menu closes** on an outside click and on Escape, and choosing an entry
  closes it.
- **`qa.py` now walks the menu**, not just the row: it opens each fold, walks
  every destination and every sub-tab, then reopens the menu before each of its
  ten entries. 31 viewers, no console errors.
- **The rail still navigates** — the v2.7/v2.8 regression, re-proven rather than
  assumed. At 1400×900, 1280×720 and 1600×1000, at scroll 0/200/600/1400,
  `elementFromPoint` over the first four rail rows returned the rail every time,
  never the chrome, and a rail click changed the pane. `--chrome-h` measures
  202px unscrolled and 169px condensed — the header is 56px shorter than the
  258px that swallowed the rail in v2.6.
- **Presentation mode** renders with the deck's own kicker unclipped.
- **Round trip, fixed point and archived-plan round trip PASS**; `db/seed-state.json`
  regenerated and byte-identical, because none of this touched the data.

---

## 25 · Light and dark, by choice — v3.0

Islam: *"Add dark and light mood for the page as well."*

### 25.1 The dark palette was already there. The choice was not.

`_shared.css` has carried a complete dark palette since the beginning — every
token, every state band, redefined under `@media (prefers-color-scheme: dark)`
and again under `:root[data-theme="dark"]`. Nothing set `data-theme`, so the
second block had never once been used, and the product followed the laptop
silently with no way for a person to say otherwise.

So this was not building dark mode. It was **adding the switch, and then finding
out how much of the existing dark palette actually worked** — which is a
different and more useful piece of work, because a palette nothing has ever
selected is a palette nobody has ever checked.

### 25.2 Three states, not two

Auto · Light · Dark, cycled by one round control in the first line, left of
Demo data.

Auto is the starting position and keeps following the device. A two-state
toggle would have had to guess a side at first load and, worse, would have
thrown away the ability to go back to following — the state most people
should be in.

**Auto REMOVES the attribute rather than setting it to `"auto"`.** The
stylesheet keys off `:root[data-theme="dark"]` and
`:root:not([data-theme="light"])`, so *absence* is what hands the decision back
to `prefers-color-scheme`. Setting `data-theme="auto"` would be a third string
neither selector matches — which happens to work today, and would quietly stop
working the moment a rule tested for `"light"`.

### 25.3 The choice belongs to the screen, not to the graph

It lives in `localStorage` under `smp.theme`, and **never in the state graph**.
Putting it in the graph would autosave it to the database, and one person
picking dark would turn the platform dark for everyone in the tenant. It is a
property of the screen you are sitting at — which is also why the gate reads
the same key rather than having a switch of its own: same browser, same choice,
so signing in never changes the colours under you.

Applied inline **from the head**, before the body is parsed, so a person who
chose dark never watches the page paint light and flip. `THEME.apply()` runs at
parse time; `THEME.wire()` runs after the chrome exists and only hangs the
control on it.

Nothing else in the product had to learn about any of this: no JS reads a
colour, so setting one attribute is the whole of the change.

### 25.4 What the switch exposed: colours written as literals

Turning the palette on for the first time made a class of latent defect
visible at once. A hardcoded colour in a rule is a **light** value with no dark
counterpart, so it survives into dark unchanged:

- **`tbody tr:nth-child(even) > td { background:#F7F9FC }`** — the zebra stripe
  on every table in the product. In dark it painted a near-white band under
  near-white text. This one defect accounted for 482 of the 482 failing runs
  measured (13 of 52 distinct pairs, but by far the most-repeated).
- `tbody tr.focusrow:nth-child(even) > td { background:#FDFAF1 }` — the same,
  gold-tinted, on focus rows.
- `.b-over { background:#FBF6E9; border:1px solid #E8D9AE }` — the "earning" badge.
- **`color:#fff` on a `--stone` / `--stone-soft` / `--gold-deep` fill.** In light
  those tokens are dark navy and deep gold, so white is right. In dark they are
  deliberately *lighter than the page*, so white on them fell to 1.94–3.91.

Five new tokens close the class: `--zebra`, `--zebra-focus`, `--over-bg`,
`--over-line`, and `--on-fill` — the ink for text sitting **on** a stone or gold
fill, white in light and near-black in dark. `--on-fill` is deliberately *not*
used on `--panel` fills, which stay dark navy in both themes and keep white.

**The rule this leaves behind: a colour with no entry in the palette block
cannot follow the theme.** Every literal in a rule is a light-mode assumption.

`--ink-3` and `--none` were also nudged in dark only (`#868F9C`→`#949DAA`,
`#7B838F`→`#8E97A3`) — both sat just under AA on `--surface-2`, which is what a
card header and a chip are painted on.

### 25.5 Dark is now cleaner than light — and light is not this version's job

Measured with a WCAG AA audit over 19 pages, every visible run of text against
the background actually painted behind it:

| | before | after |
|---|---|---|
| **dark** | 482 failing runs, 52 distinct | **11 failing runs, 3 distinct** |
| **light** | 391 failing runs, 61 distinct | *unchanged* |

The three left in dark are worth naming honestly:

- `--ink-3` on a `--panel` band (a `.why` note on navy), 3.36 — **this fails
  worse in light**, at 2.73. Pre-existing, both themes.
- `.editbtn.danger` on `--surface-2`, 4.49 against a 4.50 threshold. Inside the
  rounding of the measurement itself.

**Light mode has 61 distinct AA failures and this version did not touch them.**
They are shipped, pre-existing, and fixing them means re-tuning the house
palette — a design decision, not a dark-mode fix, and not something to do
without asking. Recorded here as backlog, not quietly corrected.

### 25.6 The client's name comes back

Removing the org-and-unit title in §24 left the product never saying whose
strategy it was showing. `Strategy Management Platform · Raya Trade` — product
name in the serif h1, tenant name after it in smaller sans. Repainted in
`paint()` rather than set once, because the Demo button swaps the whole graph
and Labels can rename the tenant while you are looking at it. `textContent`,
never `innerHTML`: the org name is typed by a person.

### 25.7 The first line was never actually one line

§24 asked for three things on the first line. Measured against the running
product, signed in, they had never fit: brand 400 + viewer 467 + buttons 257 +
two 20px gaps = **1164px against a 1132px column**, so the two buttons wrapped
onto a row of their own for everyone with a session. The wrap was already in
v2.9; the client name and the theme mark made it worse.

Fixed by stating what gives instead of leaving it to the browser: the buttons
never shrink, the tenant name and the person picker do (`min-width:0` plus
ellipsis; the viewer `select` cap 250px → 170px, since it sizes itself to its
longest option and "Strategy Management Office — all units" pinned it wide).
`.top-in`'s gap 20px → 16px.

`flex-wrap` deliberately stays `wrap`: a genuinely narrow window should still
break the row rather than overflow it. The fix is to stop it happening at
ordinary widths, not to forbid it. One line holds at **1180px and above** —
1180 being the content column, below which the whole page is already
compromised.

### 25.8 Verified

- **Three themes × 31 viewers × every destination and sub-tab**, via `qa.py`
  driven at this container's Chromium: device-light, device-dark, and
  device-light-with-dark-chosen (a different CSS selector from device dark).
  **Zero console errors in all three.**
- **The cycle**, at both device settings: auto → light → dark → auto, each step
  asserted on the attribute, on `localStorage`, and on the colour actually
  painted; auto proven to return to the *device's* colour, not to light.
- **Remembered across a reload**, and **inherited by the gate** in the same
  browser — asserted on the gate's card and on the password field, which is the
  one box that would keep the user agent's white if `background` and `color`
  were not both stated.
- **The gate with no stored choice**, at both device settings: follows the
  device, sets no attribute.
- **Served and signed in** against a throwaway Postgres: hydrate, repaint,
  theme switch, reload, gate, and the Demo button — banner up, dataset swapped,
  refusing to save. Zero console errors.
- **One line at 1920 / 1600 / 1400 / 1280 / 1180**, and in the condensed
  (scrolled) state.
- **Round trip, fixed point and archived-plan round trip PASS**;
  `db/seed-state.json` regenerated and byte-identical — none of this touched
  the data.

### 25.9 Open

- **Light mode's 61 AA failures** (§25.5). Needs a palette decision.
- **`--ink-3` on `--panel`** — a `.why` note on a navy band, failing in both
  themes, worse in light.

---

## 26 · The platform becomes installable — v3.1

Islam: *"When you finish we want to make the platform pwa."*

Installed to a dock or a home screen: its own icon, opening in its own window
with no browser chrome, and opening at all when there is no network.

### 26.1 The rule this is built around: `/api/*` is never cached

A service worker's whole job is serving things without asking the network, and
that is exactly the wrong behaviour for `/api/state`. A cached response there is
**last quarter's actuals wearing this quarter's chrome** — and a strategy
platform that shows stale figures as if they were current is worse than one
that will not open.

So `/api/` requests are passed straight through and allowed to fail. `sync.js`
already handles an unreachable API by falling back to the data baked into the
file, and the platform says on screen that it is doing so. Non-GET requests
(sign-in, save) are passed through for the same reason.

Asserted, not assumed: the cache is read after a full signed-in session,
including a hydrate and an autosave, and checked to contain no `/api/` entry.

### 26.2 Network first, cache as the fallback

Cache-first would pin every person to the shell they happened to load first, and
a deploy would not reach them until someone cleared a cache by hand. Network
first means the cache is only ever what you get when there is no network.

The cache name (`smp-shell-v3.1`) **is** the cache-busting mechanism: `activate`
deletes every cache that is not the current one, so bumping the name on a
release retires everything from the last one. It has to be bumped whenever the
shell list changes.

Assets are added one at a time rather than with `addAll`, which is
all-or-nothing: a single 404 would fail the install and leave no worker at all,
so one missing icon would cost the offline gate.

### 26.3 Registered from the gate only

The worker's scope is the whole origin, and reaching the platform file requires
having signed in at the gate first — so by the time anyone opens the platform
the worker is installed and has already precached it. A second registration
inside the built file would be the same five lines kept in step by hand for
nothing.

Guarded on `location.protocol` as well as on support: opened from a memory stick
the platform is a `file://` page, where there is no worker to register.

### 26.4 The icon, and why there are two shapes

`icons/` carries 192 and 512 "any" plus a 512 **maskable**, generated from the
same Strategy Temple drawing as `favicon.svg` by rendering it through Chromium
(there is no rsvg or cairo in the build container).

The maskable one is a different drawing, not a resize: a maskable icon is
cropped by the platform to whatever shape it likes — a circle on Android — so it
is full-bleed navy with no corner radius and the temple pulled in to about 62%,
inside the 80% safe zone. Shipping the rounded tile as maskable would have had
its corners cut off. **Re-run `scripts` icon generation if `favicon.svg` changes.**

### 26.5 The window chrome follows the theme

Two `theme-color` tags, one per `prefers-color-scheme`, because the attribute
takes a media query but not a class. Without them an installed app in dark mode
keeps a navy title bar above a near-black page. The manifest's own `theme_color`
is the light one — it is the install-time colour and cannot be conditional.

### 26.6 Verified

- **Worker registers and reaches `activated`**, scope the whole origin.
- **Manifest fetched and parsed** as `application/manifest+json`, with every
  installability field asserted individually: `name`, `short_name`,
  `start_url`, `scope`, `display: standalone`, both colours, a 192, a 512 and a
  maskable — and all three icon files fetched and confirmed as real PNGs.
- **`/api/` absent from the cache** both after first load and after a complete
  signed-in session.
- **Offline, with the network genuinely cut**: the gate opens and the platform
  opens, paints, and populates its navigation from the baked fallback.
- `dev-server.js` learned `.webmanifest`, `.png` and `.svg` content types —
  a manifest served as `octet-stream` is ignored and a worker that does not
  arrive as JavaScript is refused, so testing this locally needed the same
  headers `vercel.json` sets in production.
- **Three themes × 31 viewers**, round trip, fixed point, archived-plan round
  trip: all still PASS, seed byte-identical, rebuild byte-identical.

---

## 27 · One line, and the thing that was really moving it — v3.2

Islam, on the deployed v3.1: *"all the effort was to make the first line very
small you made 2 lines"*, *"decrase very much the name of the platform that's
not the thing"*, *"no ned to auto. just light and dark"* — and, with a screenshot
of the chrome sliding sideways, *"the header here is still glitchy. you need to
fix this once and for all"*.

### 27.1 Fitting at one width is not fitting

§25.7 measured the first line, fixed it, and verified it at 1180px and above.
Islam's laptop is a ~1000px CSS viewport. Below 1180 the row still wrapped —
and the version note said so, in the sentence claiming it was fixed.

That is the lesson, and it is not about pixels: **a layout verified at the
widths that pass is not verified.** The measurement was real and the conclusion
was wrong, because the range tested was chosen to contain the answer already
expected. The check now sweeps 1920 → 600 and asserts one line at every step.

The row no longer wraps at all — `flex-wrap: nowrap` — so there is no width at
which it can become two. Everything left of the buttons shrinks and ellipses,
in the order they are least missed: the person note first (the level and reach
are both said again on the page), then the product name, then the tenant name,
then the picker. **The buttons never shrink**: they are the controls, and a
truncated "SIGN OU" is worse than no header at all.

### 27.2 The product name was the largest text in the product

26px serif — bigger than any page heading — spending the first line restating
the name of the tab you are already looking at. It is 13px now, with the tenant
name beside it at 12px carrying more weight than the product does. Every other
item shrank with it, and the header went from **108px tall to 47px**, 41px
scrolled.

The condense-on-scroll for the title went with it: at 13px there was nothing
left to condense, and a font resizing under the reader to save three pixels is
a twitch, not a feature. Only the padding still moves.

### 27.3 Auto is gone

Three states where the third one's whole job is to be invisible. The device
still decides where the switch STARTS — so the default is unchanged for anyone
who never touches it — it just stops being a position you can land on. Nothing
is written to storage until someone actually chooses, so a browser that has
never been told still follows the device across sessions.

With two states the attribute is now always set explicitly, so one selector
paints the page instead of two that have to agree. The `prefers-color-scheme`
block stays for the gate, which has no switch and no script beyond reading
storage.

### 27.4 The "glitchy header" was never the header

The chrome sliding sideways, leaving its seams showing, was the symptom of a
**horizontal page scroll**, and `position: sticky` is defined to scroll
horizontally with the page. So the question was never why the header moved. It
was what made the page wider than the window.

`.tip::after` — the hover note on every explanatory icon. A 255–320px
absolutely positioned bubble, anchored to a 14px icon, laid out **at all times**
at `opacity: 0`. An absolutely positioned box contributes to the document's
scrollable overflow whether or not you can see it. Wherever one of those icons
sat near the right of the content column, an invisible 320px box hung past the
edge and the whole product grew a horizontal scroll nobody could account for.

It came and went depending on which page you were on, because it depended on
where the icons happened to land — which is exactly why it read as a flickering
header bug rather than as a layout defect with a cause.

**The rule: `opacity: 0` hides a box. It does not remove it from the page.**
The tooltip is `display: none` until hover now. The cost is the .13s fade, which
cannot survive `display: none`, and that is a fair price.

`.wrap` also gets `overflow-x: clip` as the backstop for a tooltip genuinely
open near the right edge. **`clip`, deliberately, and never `hidden`:**
`overflow: hidden` makes the element a scroll container and would break every
`position: sticky` inside it — the rail among them, which this project has
already spent two versions repairing. `clip` clips without scrolling and lets
the other axis stay `visible`, so a note can still open upward past the top of
a card.

### 27.5 NaN on the group's front page

Not asked for, and fixed anyway, because it was on the first screen of the
deployed product: **BUSINESS UNITS — EXECUTION read `NaN%`**, under a "No data"
chip, above the sentence "Delivered 0% against 0% planned — variance +0".

`groupRatio()` was `groupExec()/groupPlan()*100`. A tenant with no tactics has
nothing delivered and nothing planned, so both sides were dividing by a weight
total of zero and the ratio was `0/0`. `Math.round(NaN)` is `NaN`.

This is §5.7 again — **null is never zero** — with a corollary: *and it is never
NaN either.* The honest answer when there is no plan is nothing, and the card
already knew how to say it: `drillCard` renders null as "Not yet measurable",
which is what the two cards beside it had been doing correctly all along.
`splitCard` had carried the same guard for the same reason; this is that guard
one level up. The sub-sentence is replaced too, because three false precisions
under a card that says "Not yet measurable" is worse than the NaN.

**Every clean slate showed this. The demo dataset never did** — which is how it
reached production: the dataset used for checking was the one that could not
expose it.

### 27.6 Verified

- **One line at 1920 / 1440 / 1280 / 1100 / 1000 / 900 / 820 / 760 / 680 / 600**,
  signed in, with all three buttons present — and at scroll depths 0 / 200 /
  600 / 1400.
- **No horizontal page scroll**: 8 widths × 13 pages, `scrollWidth` vs
  `clientWidth` asserted zero on every one; and zero again with a tooltip open.
- **The chrome's left edge is identical at every scroll depth** — the sideways
  drift is gone at the source.
- **The rail still works** with `overflow-x: clip` in place: `position: sticky`
  intact, `elementFromPoint` returns the rail for every on-screen row at scroll
  0 / 300 / 900, and a rail click still changes the pane.
- **Two theme states only**: four presses asserted to alternate light/dark, the
  attribute always set, no "auto" reachable in the value, the storage key or
  the control's label.
- **NaN gone against a genuinely clean-slate database** — a fresh tenant seeded
  and cleared, signed into over HTTP: `groupRatio()` returns null, the card
  reads "Not yet measurable", and the string "NaN" appears nowhere on the page.
  The demo dataset is unchanged at 102% of plan.
- Three themes × 31 viewers, zero console errors. PWA suite green. Round trip,
  fixed point and archived-plan round trip PASS, seed byte-identical, rebuild
  byte-identical.

---

## 28 · Six from the deployed product — and the condense finally goes — v3.3

### 28.1 The footer

One sentence — the product's name, a spec number, a shape — under every page.
Its last real content (the invented-data notice) moved to the demo banner in
§21, where it is true. What was left was a signature. Gone, and the `<footer>`
with it.

### 28.2 Manage becomes a mark

At 11px uppercase in a pill, the word was the widest thing in the navigation
row, and it named a *menu* rather than a place. It is a gear now — the one
glyph everyone already reads as "the settings are behind here" — in the same
20px box the theme control uses.

**The word did not disappear, it moved**: `title` and `aria-label` both say
Manage. A glyph is never the only thing that says what a control does — the
same rule §24 wrote when the icons went the other way, and the reason those
icons carried titles even then.

### 28.3 The rail expands. Fully.

`max-height: calc(100vh - 320px)` with `overflow: auto` cut a unit's list off
mid-row — the one thing a navigation rail must never do, because a list that
ends in a half-drawn item reads as *the list ends here*.

The cap is gone. The rail is as tall as its content, whatever that is: proven
against a synthesised unit with **18 directions** — all 18 rendered, nothing
clipped, no inner scrollbar, and the 18th row reachable and clickable.

It still sticks, so on the normal shape — more detail than rail — the rail
holds still and the pane beside it scrolls, which is §28.4's ask. Where a unit
has more directions than fit the window, the page scrolls until the last is
reachable and the rail pins from there. That is the honest behaviour; the
alternative was pretending a 20-item list can be held on one screen.

**Nothing here is sized against `--chrome-h`.** The sticky *offset* reads it,
which changes nobody's height. v2.8's cap read it as a *max-height*, which
changed the page's height, which re-clamped the scroll, which re-condensed the
header, which changed the measurement — forever. A sticky offset is safe; a
measured max-height is a loop.

### 28.4 Nothing above the rail

"Pillars — directions and capabilities" sat above a rail whose own header
already reads PILLARS and counts them, and it pushed the rail a heading's
height down the page — which is exactly the room the rail needs to stay in view
while the pane scrolls. On the Plan page the unit's name and "The plan as
agreed · no reported figure on this page" went for the same reason the chrome
shed five statements in §24: the nav row highlights the unit and the tab says
Plan.

`section()` now omits its header entirely when there is nothing to put in it.
An empty `<h2>` still spends its line-height and its margin, and a heading that
renders as blank is worse than no heading.

### 28.5 A unit opens on its Plan

What the unit agreed is what people come to read and what they come to change;
the score is a consequence of it, and one click away. `entrySub()` decides,
checking both the tab and the section against what the viewer actually holds —
so someone without `u_plan` is never sent to a tab that is not there. Group,
functions, Manage and Setup are untouched, and sign-in still opens on Group.

### 28.6 The condense-on-scroll goes, and the scroll glitch with it

This is the fourth version to carry a fix for "on scrolling up the page starts
getting hazy and damaged", and the first to remove the *mechanism* rather than
a cause underneath it.

Two real causes were found and fixed before: a chrome with no background of its
own (§23.6) and a rail capped against its own measured height (§23.7). Both
were genuine. The symptom kept coming back.

What was still there, measured directly: **at scroll position 25 the chrome
settles at 190px if you arrived scrolling DOWN, and 168px if you arrived
scrolling UP — and stays there.** Not a transition mid-flight; the settled
state depended on the direction you came from.

That is the hysteresis — condense past 70, expand below 20 — working exactly as
designed. It is what stopped the header chattering at the threshold, and it was
right to add. But its consequence is that scrolling back up holds the header
condensed and then drops 22px of chrome into the page in one step, moving
everything below it, animated over `.18s ease`. That step is the "hazy and
damaged" of the original report.

**It bought 22px.** The header was 108px tall when the condense was written and
reclaiming a fifth of it was worth something. It is 47px now (§27). Reclaiming
22px from 47 is not worth a chrome whose height depends on which way you were
scrolling — so the whole mechanism goes: the scroll listener, the `scrolled`
class, and every `body.scrolled` rule that hung off it (the top padding, the
viewer label, the nav and tab button padding).

The ResizeObserver that publishes `--chrome-h` stays; the rail's sticky offset
still reads it. It reports a constant now, which is the easiest possible thing
for it to be right about.

**The general rule, which is what the four versions actually cost:** *a
component whose size depends on scroll position will eventually depend on
scroll direction, and then it is no longer a component, it is a state machine
nobody drew.* Removing it is cheaper than getting it right.

### 28.7 Verified

- **Scroll sweep, both directions**, 25px steps down and back up on two long
  pages, plus 65 frames of continuous upward scroll: **the chrome reports one
  single height throughout — `[190]` — with zero height changes and zero class
  flips.** Before this change the same sweep found two settled heights at the
  same position depending on direction.
- **Nothing shows through the chrome** at any scroll position, either
  direction; the chrome's left edge is identical throughout; no page scrolls
  horizontally.
- **Pixel scan** down through the chrome mid-scroll: solid bands only, and the
  frame at the top after scrolling up is identical to a fresh load bar 23
  pixels of ±1 antialiasing on the theme button's curve.
- **The rail with 18 directions**, on both Plan and Performance: all rows
  rendered, `scrollHeight ≤ height` (nothing clipped), no inner scrollbar,
  still `position: sticky`, last row reachable and returning the rail to
  `elementFromPoint`.
- **A unit opens on Strategy › Plan** with the Plan section reading as
  selected; the menu still opens all ten destinations behind the gear, which
  carries `title` and `aria-label`.
- Three themes × 31 viewers, zero console errors. Contrast unchanged at 3
  distinct in dark. Seed byte-identical, rebuild byte-identical.

---

## 29 · Seven from the deployed product — v3.4

### 29.1 The folds died whenever the menu was touched

*"the units and functions button in the navigation are not working for multiple
times and then work. some sort of lag I guess"*

Not lag. Reproduced in three clicks: **open the Manage menu, close it any way at
all, and the Units and Functions folds are dead** until something forces a full
repaint.

`paintUnits()` replaces `#units` innerHTML, so every handler inside that row is
destroyed on each call and has to be re-attached. It re-attached the unit tabs
and the menu — but the folds were wired in `wire()`, which only runs on a full
`paint()`. Three paths call `paintUnits()` **alone**: opening the menu, closing
it with Escape, and closing it by clicking anywhere else. After any of them the
folds were listening to nothing.

The rule was already written, on the fold's own handler, in its own comment:
*"paint() rather than paintUnits() because rewriting the row destroys its own
handlers, and a fold that works once is worse than one that does not work at
all."* The fold obeyed it. The menu, added later, broke it from the other side —
the handler was correct and something else pulled the DOM out from under it.

**So the rule is now structural rather than remembered: whoever rewrites the
DOM re-wires it, in the same function, and there is exactly one function that
rewrites this row.** The fold wiring moved into `paintUnits()`.

### 29.2 The menu's group labels

Ten entries under two whispered labels read as one list of ten. The labels now
sit on a `--surface-2` band: visibly a different *kind* of row from the things
they head, which is the whole job of a group label.

### 29.3 The first line at half height

47px → **27px**. The padding was already 8px a side and the controls 31px, so
squeezing padding alone could never have got below 31 — the content had to
shrink, and the tallest item sets the row.

The tallest was the theme button at 30px, and it was 30px because **there were
two `.themebtn` rules**: a 20px one written for this change and a 30px one left
from §25, with the later of the two winning. A duplicated rule does not fail
loudly; it just quietly ignores you. One rule now.

Everything else came down with it: the select to 19px, the pills to 19px, the
product name to 12px, `.top-in` padding to 3px.

### 29.4 The rail's 10px slide, and why the fix is one number

A sticky element sits where the flow puts it and only pins once scrolling
carries it up to its offset. If the flow puts it **lower** than the offset, it
slides exactly that difference on the first scroll and then stops — which is the
small lurch, and it is not a bug in `position: sticky`, it is two numbers that
were supposed to be the same and were not.

Measured: `.view` had `padding-top: 22px`, `.split` added `margin-top: 12px`,
and the sticky offset was `--chrome-h + 12`. Flow position 34px below the
chrome, pin position 12px below it, travel 22px.

**Fixed by making it impossible rather than by choosing a better number.** One
variable, `--rail-gap`, is the panel's top padding *and* the sticky offset, and
`.split` contributes nothing. The flow position and the pin position are now the
same expression, so the difference cannot be non-zero. Measured after: the rail
top reads 192 at every scroll position from 0 to 1200. **Zero travel.**

### 29.5 Direction and Capability, hidden behind one flag

*"across the platform hide the distinction of direction and capability. it will
be brought later not now."*

`SHOW_KIND = false`, and five call sites read it: the pill on a pillar, the meta
line above it, the accordion row, the Kind column in the drill table (the column
goes with its values — a header labelling a blank column is worse than either)
and the Performance rail's sub-line. Flipping one flag brings all five back.

The field itself is untouched: still in the data, still round-tripped through
the database, still a column in the import template's Pillars sheet with its
dropdown. **There is no Setup screen for it** — it has only ever been authored
by upload — so "keep it in Setup" turned out to be a question about something
that does not exist.

What is deliberately NOT hidden: the **"Direction" column** in a key-objective
table, which means the direction of travel — whether higher is better. Same
word, unrelated thing.

The meta line is also built from its non-empty parts now. It used to concatenate
kind, theme and owner with fixed separators, so a pillar with neither theme nor
owner read `Direction · theme ·` — two separators pointing at nothing, visible
in Islam's own screenshot.

### 29.6 "Plan only", and the rail footer that explained a number

The Plan page carried *"Plan only — Nothing here has been reported"* above
tables whose headings already say "as planned" and whose actual columns are all
em-dashes, on a tab labelled Plan. Four statements of one thing. Gone — and gone
from the project pane too, where the identical notice sat in the identical
position.

The rail's footer said *"Figure shown is key measures"*, explaining a bare
number on the right of each row. On the **Plan** page there is no figure to
explain — nothing has been reported — so the footer was describing a count as
if it were a score.

### 29.7 The rail rows say what their numbers are

They used to carry two numbers: the tactics count in small grey on the left, and
the measures count as a **bare unlabelled number** on the right. Two numbers,
one of them unexplained, and a footer at the bottom trying to explain it.

One line now, both labelled: `3 measures · 2 tactics · Abuelenien`. The bare
number went, and the footer with it.

### 29.8 Verified

- **The folds after every way of closing the menu** — Escape, an outside click,
  and pressing the button again — plus twice in a row. All live. Before this,
  all three left them dead.
- **The first line measures 27px**, with the select, both pills and the mark all
  at 19–20px.
- **Rail travel is 0px**, sampled at eight scroll positions from 0 to 1200.
- **No kind anywhere a reader goes** on Plan or Performance, and the meta line
  no longer ends in a dangling separator; the field still round-trips.
- **The rail rows read "N measures · N tactics"**, no bare number, no footer.
- Three themes × 31 viewers, zero console errors. The chrome still reports one
  single height across a full scroll sweep in both directions. Contrast
  unchanged. Seed and rebuild byte-identical.

---

## 30 · The knowledge base, and the two-click save — v3.5

Nine items came off the deployed product. Two of them — a people register and
the knowledge base — were features rather than tweaks, so they were split:
**this version is the seven, plus the knowledge base**, and the people register
(§16.11) is its own piece of work with the data model and password handling it
deserves.

### 30.1 The two-click save

*"the edit in the business units and functions table in the setup requires 2
clicks to save. not sure why"*

Every editable field commits on `change` and then repaints. But `change` on a
text input fires on **blur**, and the blur is caused by pressing something else
— usually the Done button in the same table. So the order was:

1. mousedown on Done
2. the input blurs → `change` fires → the value is written
3. `paint()` rewrites the panel **and destroys the button being pressed**
4. mouseup, and the click lands on nothing

The value was saved on the first click. What took a second click was *leaving
edit mode*, which is indistinguishable from "it didn't save" to the person
doing it.

**Fixed once rather than in twenty handlers: a repaint requested while the
mouse is down is held until the click it belongs to has landed.** `mouseup` and
`click` are dispatched in the same task and timers run after it, so a
`setTimeout(…, 0)` scheduled on `mouseup` is reliably after the click. A
mousedown whose mouseup never arrives releases on its own after 500ms — a stuck
flag would silently stop the page repainting, and nothing is worth that.

Deliberately *not* solved by committing on `input` instead. That fixes the
button, but a field committing on every keystroke must also not repaint on every
keystroke, and then nothing derived updates until something else happens to
paint. This keeps the repaint and moves it a few milliseconds.

**The general form, which is the third of its family this month:** a handler
that rewrites the DOM must not run in the middle of an interaction with that
DOM. §29.1 was the same shape (the menu rewriting the row the folds lived in);
so was the React note in CLAUDE.md about closing a modal from a submit button.

### 30.2 A new page was invisible on every existing tenant

Building the knowledge base exposed something worse than the page itself.

The access map is stored **per tenant, in the database**, so it only ever holds
the page keys that existed when that tenant was written. A page added in a later
version has no row — and "no row" read as `"none"`. So the knowledge base worked
perfectly on a fresh deployment and could not be opened at all on the live one.

`grant()` now falls back to the **shipped default** for that level when the key
is absent, which is what the tenant would have been given had the page existed
when it was seeded. **Absent means "not answered yet", not "denied"** — a stored
`"none"` is a decision and still wins.

This was going to bite every future page, silently, and only ever in
production. The seed carries the new key too, so fresh tenants and existing ones
arrive at the same place by different routes.

### 30.3 The knowledge base

*"we need to have the KB as a page … from now and keep adding to it"*

Seven sections — scoring, access, labels, units and functions, plans, the cycle,
and where the data lives — with a contents strip, written to be read start to
finish by someone new rather than sampled.

**It is a page, not a set of tooltips.** The Info button and its modals went in
§24 for a reason: an explanation that only appears where you already are cannot
be read *before* you get there, cannot be sent to someone, and cannot be
scanned. Everything removed from the setup screens in §30.4 landed here, joined
by the rules that were only ever in the decisions document.

**What lives here versus in this document:** the knowledge base says how the
platform *behaves*, in the words a client would use. This document says why we
chose it and what we rejected, in ours. Different readers, different books.

Access is `c_kb`, granted **view to every level**. An explanation nobody can
open is not an explanation.

### 30.4 Four screens lose their essays

Scoring bands, Levels & access and Labels each opened with a paragraph and a row
of fact-pills; Supporting functions closed with three more paragraphs. All of it
is true and none of it belonged there: **a setup table is where you change a
thing, not where the thing is explained**, and prose above and below every table
is how a configuration screen stops being scannable.

Moved, not deleted — §30.3 is where it went.

### 30.5 Companies gets its own tab

It sat above the Business units table, putting two different questions on one
screen: which units exist, and who is allowed to see whom. They are edited at
different times for different reasons, and a ten-row units table pushed the
company rules off the top. Same access key, since the same person manages both.

### 30.6 The pen, in the corner of the box it edits

A bare "Edit" bar floating above a page says *a page* is editable. A pen in the
corner of a card says *this* is. It appears on hover and on keyboard focus
(`:focus-within`, or a hover-only control is unreachable without a mouse) and
**stays visible while editing** — a control that vanishes while you are using it
is worse than one that was never subtle.

`visibility`, not `display`, so the button always holds its box and hovering a
card never reflows it. Note the inversion of §27: an invisible box still
contributes to layout, which was a bug for a 320px tooltip hanging off the page
and is exactly what is wanted for a 28px button that must not move anything when
it appears.

**The Plan page did not get one, and that is a decision, not an omission.** The
Plan page has no edit mode at all: a plan is *authored by upload* (§22), which
is why the template carries no codes and why replacing one archives it. Putting
a pen there means editing a plan in place — a real change to how plans are
authored, and one to take deliberately rather than as the seventh item in a
list. Raised rather than built.

### 30.7 A third dead duplicate

`renderBandsExtra` was defined **twice, byte-identically**, so the first had
never once run. That is three this month: `renderFocusSetup` (§21), the two
`.themebtn` rules (§29.3), and now this. The first was found because a page
misbehaved, the second because a number would not change, this one by reading.

A duplicate definition never fails loudly. It quietly picks one.

### 30.8 The scroll step that reverts — not reproduced

*"when I'm scrolling in a page there is always a last small step of scrolling
that reverts. it happens on my way up or down."*

Driven with real wheel events, four steps each way on a long page, sampling the
scroll position immediately and again 800ms later: **it never moved on its
own**. Programmatic scrolling did not either. The chrome is one fixed height
since §28, so the mechanism that caused the earlier drift is gone.

The remaining candidate is the browser's own **scroll anchoring**
(`overflow-anchor`, currently `auto`), which nudges the scroll position when
content above the viewport changes size — plausible on a trackpad, and not
reproducible in headless Chromium on Linux. **Not "fixed" speculatively**:
disabling scroll anchoring has its own failure mode, and shipping a guess as a
fix is what §28 was written about. Open, pending which input device and which
pages.

### 30.9 Verified

- **One click saves and closes** in Setup › Business units: the value written
  and edit mode left in a single press, where it previously took two.
- **`grant('c_kb')` resolves to `view`** on a tenant seeded before the key
  existed, and the knowledge base appears in the Manage menu.
- **The knowledge base renders all seven sections** with its contents strip, and
  carries every block removed from the four setup screens.
- **All four screens keep their tables** and lose only the prose.
- **Companies renders as its own tab** with every column, and Business units no
  longer carries it.
- **The pen** is hidden at rest, visible on hover, turns edit on in one click,
  stays visible while editing, and turns it off again in one — on Foundation and
  on SWOT.
- Three themes × 31 viewers, zero console errors. The chrome still reports one
  height across a full scroll sweep both ways. PWA suite green. Round trip,
  fixed point and archived-plan round trip PASS. Rebuild byte-identical; the
  seed gains exactly one key per level, which is the point.

---

## 31 · The plan becomes correctable, for the SMO — v3.6

Islam, on §30.6's raised question: *"the plan page should have a pen for the
SMO."* Answered, and built.

### 31.1 What this does and does not change

**§22 stands.** A plan is still *authored by upload*: the template still carries
no codes because the platform mints them on arrival, an upload still replaces a
whole unit's plan, and replacing still archives the outgoing one rather than
deleting it.

What this adds is the **correction afterwards** — a target typed wrong, an owner
who moved, a measure named badly — without making the SMO rebuild and re-upload
an entire unit to fix a word. Authoring and correcting are different acts and
the platform now has both.

Editable: the pillar name and its end-state line, each measure's
name, target and three-year target, and each tactic's name and owner. Not
editable: the code (minted, §22), the direction and compile rule (they change
what a figure MEANS, and a plan whose meaning drifts under a reported actual is
worse than one that is wrong in a name), and the quarters grid.

### 31.2 SMO only, and not merely by access key

`mayEditPlan()` requires the viewer's level to be `smo` **and** `u_plan` to
grant edit. The key alone is not enough: `u_plan` at edit is held by unit heads
too, and *a plan being correctable by the person measured against it* is a
different decision from *a plan being correctable by its custodian*. One is
housekeeping; the other is moving the goalposts.

This is the first thing to revisit when per-action authorisation and the
per-figure change log land (§19.2). Until then the narrower rule is the safe
one, and it is written as a named function rather than an inline condition so
there is exactly one place to change.

### 31.3 Verified

- The pen appears on the plan's title box, hidden at rest and visible on hover.
- One click opens 24 fields; typing and one more click writes the change into
  the graph and leaves edit mode — the §30.1 fix holding on a new page.
- **A CEO-level viewer gets no pen and no editable fields** on a plan they can
  otherwise read.
- Three themes × 31 viewers, zero console errors; chrome one height across a
  full scroll sweep; PWA green; round trip, fixed point and archived-plan round
  trip PASS; seed and rebuild byte-identical.

---

## 32 · One door — v3.7

Islam: *"on opening the platform every time the access page opens on user and
password and lags for a moment then it shifts to another window of a button to
access. this behaviour is odd there shouldn't be 2 pages of access just the user
and password."*

### 32.1 It was three states, not two

Traced rather than guessed:

1. The page painted, and the sign-in card was visible **immediately** — in its
   legacy shape, with the fixed "AdminSMO" block rather than a user field.
2. `fetch("/api/auth")` answered → `enterServerMode()` replaced that block with
   the user field. The layout shifted.
3. If a session was already valid → `signedIn()` → the whole card was swapped
   for the **Starting page**: a badge, a welcome line, and a button to open the
   platform.

Three states in about a second, every single time, and the third one existed
only to offer a button to the thing you had already asked for.

**There is exactly one honest thing to show before the answer is known, and it
is nothing.** The card is hidden until the session check resolves. Then:

- **session live → the platform opens.** The gate is never seen at all.
- **no session → the sign-in card**, in its final shape, once.
- **a temporary password → the change-password card**, because that is the one
  thing standing between signing in and being in.

### 32.2 The Starting page is gone

A page whose only content is a button to the page you just asked for is a door
behind a door. Signing in **is** the request to open the platform.

Sign out went with it, which is right: it lives in the platform's own top bar,
where you are when you want it. It posts to `/api/auth` and returns to `/` —
and `/`, with no session, is the sign-in card.

### 32.3 The 30 days were already true, and now they are said

`SESSION_DAYS = 30` in `lib/auth.js`, with the cookie's `Max-Age` set to match.
What made it *feel* untrue was the Starting page: being asked to press a button
every time reads as being asked to sign in every time. The gate now says the
promise out loud — *"You will stay signed in on this device for 30 days"* —
under the button, because a promise the product keeps is worth stating.

### 32.4 The door itself

Taken from HR_ERP's sign-in, which had already settled this: **a navy ground
rather than pale grey**, a gold letterspaced eyebrow above the mark, deeper
corners and a stronger shadow, more generous padding, and errors as a tinted
block rather than a bare red line. A front door set into a wall reads as
deliberate; a form floating on grey reads as unfinished.

Both cards carry the eyebrow, so the change-password step is visibly the same
product rather than a stray form.

### 32.5 The Labels page loses its last three notes

*No collisions*, *labels are per tenant not per cycle*, and *Vision / End State
/ Winning Aspiration are one entity* — all true, none of them a control. They
are in the knowledge base's Labels section now, joining the essay that left in
§30.4.

**A collision itself still shouts on the page.** That is not an explanation, it
is a state that blocks saving, and a blocked save has to say why where the save
is. The "all clear" note went; the alarm stayed.

### 32.6 Verified

- **Sampled every 60ms through the load:** the states are `-`, `-`, then
  `login`, and never two cards at once. Before this it was login → login
  (reshaped) → home.
- **`#home` does not exist in the document.**
- **Signing in lands on the platform**, not on a second page.
- **Reopening with a live session goes straight in** — the gate is never
  rendered.
- The dark gate is still one card; the 30-day line is present.
- Three themes × 31 viewers, zero console errors; scroll sweep one height; PWA
  suite green (its sign-in assertion updated — it was asserting on the Starting
  page this version deletes); round trip, fixed point and archived-plan round
  trip PASS; seed and rebuild byte-identical.

---

## 33 · Roles replace levels — v3.8

Islam: *"N minus one and N-2 … was a start that we used to talk about the
accessibility that is not really relevant at this moment … the titles should
not be relevant in the platform accessibility, the activity and visibility
should be role based."*

### 33.1 The giveaway was already in the code

`LEVELS` carried a `titles` field:

> `{ key:"n1", name:"N-1", titles:"Business Unit Head · Group CFO · Group COO" }`

An abstraction invented before anyone knew what the platform needed, with real
job titles stapled on to explain what it meant. If a level has to list the
titles that live at it, the titles were the thing all along.

So: **the role is the thing.** A person's official title — Senior Director,
Senior Manager — stays in the registry as information *about them* and is never
consulted for access. Two people with the same title can hold different roles,
which is correct and was not previously expressible.

### 33.2 Seven roles, and where each one lives

Super user · Group CEO · Company CEO · Business unit owner · Strategy
custodian · Supporting function head · Contributor.

**Where a role lives depends on what kind of role it is, and this is the whole
design:**

- A role that names a **seat in the organisation** — super user, group CEO,
  company CEO — is a property of the **person**. Nothing else points at it.
- A role that names **responsibility for a thing** — unit owner, custodian,
  function head — is a property of the **thing**. Mobile already had a head
  field and a custodian field; those pointers *are* the role, read from the
  other end.

That is what makes Islam's "and vice versa" work without two tables fighting.
Setting Mobile's owner on the unit page and setting it in the registry are the
**same write**, so they cannot disagree — there is one fact with two editing
surfaces, not two facts to keep in step.

It also gives **multiple roles for free**, which he asked for: a person can be
group CEO *and* own Care, because those are two records in two different places
rather than one field fighting itself. `personRoles(p)` assembles the list;
nothing is stored twice.

### 33.3 The most generous answer, within each role's reach

A person holding several roles gets the **most generous** grant across them.
Anything else surprises: a group CEO who also owns Care would lose the ability
to edit Care's foundation because their CEO row says view, and nobody could
work out why. Least privilege is right for a role a person was *given*; it is
wrong *across* roles the same person legitimately holds.

**Scope is not relaxed this way.** `reaches()` still resolves per role, so edit
inherited from owning Care never reaches Mobile.

### 33.4 The matrix was rebuilt, not mapped

At Islam's direction. The rows mean something different now, so a grant carried
across would be an old answer to a new question. Every role starts from a
shipped default, and §30.2's rule does the rest: an absent key means "not
answered yet", so a migrated tenant with an empty map reads entirely through
the defaults until someone changes a cell.

Which exposed a bug of my own making: `stateCell` read `ACCESS[role][page]`
directly, so on a migrated tenant — where the map is legitimately empty — the
whole page threw on `undefined[pageKey]`. It reads through `grantFor()` now, and
writing a cell is the moment that role gets a row of its own. **Only testing
against a migrated database found this**; every fresh-deploy test passed.

### 33.5 Two kinds of migration want opposite orders

The serious one. `ensureReady` seeds and *then* migrates, deliberately: §21's
clean slate must run after the seed or it clears nothing. But **008 reshapes
columns the seed writes into**, and `schema.sql` cannot help — every statement
in it is `CREATE TABLE IF NOT EXISTS`, which never adds a column to a table that
already exists.

So on the deployed tenant the seed would have tried to write `people.role`
against a table that still had `level`, and failed *before* the migration that
would have renamed it ever ran. **It would have broken the live database, and
no fresh-deploy test could have caught it** — the fresh path builds the new
shape from schema.sql and never notices.

Migrations now declare their phase in their first line — `-- @phase: pre` —
and run in two passes: **schema migrations before the seed, data migrations
after**. No marker means post, which is what every migration before 008 wants.
The answer travels with the file rather than in a list that drifts.

### 33.6 Verified

- **The upgrade path, against a faithful v3.7 tenant built by the v3.7 code
  itself** — checked out from `main`, its own `ensureReady` run to create it,
  then the new code let loose on it: `people.role` present and `level` gone,
  `access_grants` rekeyed to `role_key` and emptied, the `levels` table dropped,
  `smo → super`, and the state reading back clean. This is what Islam's
  database will do.
- **Fresh deploy**: clean slate, round trip, fixed point and archived-plan round
  trip all PASS.
- **Every person resolves to at least one role**, including the Group CFO, who
  had no seat and no pointer and now resolves as a contributor at the group —
  reaching the group pages and no unit, which the old model could not say
  (there "unit: group" meant all ten).
- **Spot checks**: Mobile's head is `owner@mobile`, edits its foundation, cannot
  reach Retail Stores, cannot edit the plan; its custodian resolves as
  `custodian@mobile`; the company CEO reaches its own company's units; Finance's
  head is `fnhead@fn:finance` and reaches no business unit but edits its own
  pages.
- **The matrix renders on a migrated tenant** with an empty map, showing the
  shipped defaults, and changing a cell creates that role's row.
- **No "Level", no N-1/N-2/N-3 anywhere on the page.**
- Three themes × 31 viewers, zero console errors; scroll sweep one height; PWA
  suite green; seed and rebuild byte-identical.

### 33.7 Still to come — v3.9

The registry page itself, and the assignment field Islam described: a search
that offers the relevant people first with **+ Add new** beside it, creating a
person with their name and that role, who appears in the registry immediately
for the rest of their details. Plus per-row password reset and bulk temporary
passwords (§16.11).

---

## 34 · The door gets a wall — v3.9 (in progress)

Islam: *"The smp login page is poor in design can you use front end skill and
create a more neat one. Look at the strategy formulation project repo which has
an amazing design with strong concept and get back to me."*

### 34.1 What the reference actually does

The reference is `Strategy-Formulation`'s `app/(auth)/layout.tsx` — and the
strong concept Islam saw is **not in the form**. It is in the split.

43% of the screen is a navy wall that argues the product's case: the mark, one
hero sentence with its idea half in a gradient, four value tiles, a quoted line
pinned to the bottom behind a rule, and three huge faint rings bleeding off the
edges. The other 57% is a pale dotted field with the form floating on it. The
form itself is ordinary; what makes it feel considered is that **the brand does
its talking somewhere other than on top of the password box**.

Our gate had been asking one 400px card to carry the whole product — an
eyebrow, a name, a tagline and a form, stacked in a box on flat navy. Every
line of brand it wanted to say had to be squeezed above the fields, which is
why it read as thin.

### 34.2 What was taken, and what was deliberately not

**Taken**: the split; the glass card (`rgba(...,0.82)` over `blur(20px)`, 20px
radius, three stacked shadows instead of one); icon-inset fields with a 3px
focus ring rather than a border swap; the dot grid; one `rise` keyframe replayed
with staggered delays so the page assembles rather than appears; the compact
brand bar below the breakpoint.

**Not taken**, and on purpose:

- **Their `AUTH_001…AUTH_999` error codes with resend/report actions.** That is
  built for a product with self-service registration and a support desk. SMP has
  three failure modes and one SMO who issues passwords by hand; a code would be
  theatre, and a "report this issue" button with nothing behind it is a lie.
- **Their blue.** They are navy-and-blue; SMP is navy-and-gold (§0). Gold takes
  every accent the reference gives blue — the focus ring, the hero gradient, the
  quote's rule. Borrowing the blue would have made this a copy rather than a
  sibling.
- **Their light-only palette.** Their sign-in has no dark mode; ours does
  (§25), so the wall, the dotted field, the glass and the ring are all tokens in
  the same three blocks as everything else.

### 34.3 The wall may only claim what SMP does

Four tiles, and each one had to be a thing the product actually does: scores
derived and never typed (§5.1), reporting cycles snapshotted and never
overwritten, the view resolved per role (§33), and installable/offline (§26).
The front door is the one page seen by someone who has not signed in yet — it
is the last place invented capability belongs. Same rule as §21's "never put
invented content in the database", one surface further out.

### 34.4 Height is a constraint a width query cannot see

The wall's content needs about 600px of height. On a 1024×560 window the quote
fell below the fold and the whole page grew a scrollbar to reach a decorative
line — while every `max-width` query in the file reported the layout fine,
because **width was never the constraint**. A `@media (max-height: 700px)`
block compacts the wall instead. §27.1 said verify at every width; this extends
it: **sweep the other axis too, or the layout is verified in one dimension and
guessed in the other.**

### 34.5 Whoever hides a field hides its furniture

`enterServerMode()` used to unhide the person-key `<input>`. With the input now
living inside a `.field` wrapper that also holds its icon, unhiding the input
alone would have left a person icon floating on the card in legacy mode. The
wrapper is what carries `hidden` now — **the unit of showing and hiding is the
composed control, never the one element inside it that happens to have the id.**

### 34.6 Verified

- Width sweep 1920→360 in **both** themes: no horizontal scroll at any width,
  card never clipped, wall present at ≥981 and gone below, bar the inverse.
- Height sweep 1080→520 at desktop widths: nothing clipped, nothing below the
  fold, no page scroll down to 560. At 1440×520 the page scrolls 8px — recorded,
  not fixed; nothing is hidden and that window is smaller than any real one.
- Behaviour unchanged: legacy mode shows the fixed access name, server mode
  swaps in the person-key field **with its icon** and re-points the label, a
  wrong password shows the error and clears the field, the change-password card
  takes focus and rejects a mismatch, the reveal toggles all three password
  fields. Zero console errors.
- **Contrast: every text run on the gate meets WCAG AA in both themes** — scored
  against the worst stop of each gradient surface, not against a flat colour.
  (The checker had to be fixed first: reading only `backgroundColor` walks
  straight past a gradient to the white body beneath and scores white-on-navy at
  1.05. **A contrast check that cannot see gradients is a contrast check that
  passes everything.**)

---

## 35 · The register — v3.9

§16.11, built. Islam: *"people can be added in integration with the business
unit or supporting functional pages as well through the assigning field which
should be a search field with a list that appears below with relevant names but
with an Add new button that creates only the name and the Role."* And later,
about the register and the unit page: *"these three tables should interact
together."*

### 35.1 One fact, two editing surfaces

They interact because there is nothing to synchronise. §33 already settled where
a role lives: a SEAT (super user, group CEO, company CEO) is a property of the
person; RESPONSIBILITY FOR A THING (unit owner, custodian, function head) is a
property of the thing. So the register does not keep its own copy of who runs
Mobile — it writes `UNIT_ROLES.mobile.head`, which is the same field the
Business units page writes, through the same function.

`grantPersonRole(person, role, where)` is that function, and both screens call
it. There is no reconciliation step because there is nothing to reconcile: a
disagreement is not possible when only one copy exists.

A responsibility role is singular by nature — one head per unit — so granting it
takes it from whoever held it. That is not a hazard to guard against; it is what
"this is now their unit" means.

### 35.2 The picker, and why the <select> had to go

The unit page's role control was a `<select>` over `PEOPLE.filter(p => p.unit === k)`,
which had two faults that only show up in use:

- It could offer **only people already attached to this unit**, so the first
  person on a new unit could never be chosen — there was nobody attached yet.
- It could not offer somebody who **does not exist**, which is the normal case
  when a unit is being set up from a plan that arrived yesterday.

The replacement is a search over an **ordered, not filtered** list: this unit's
people first under their own heading, then everybody else. A picker that hides
the rest cannot move a person between units, and people move between units.
Typing a name nobody has offers **+ Add "…"**, which creates the person and
gives them the role in one act — Islam's "creates only the name and the Role" —
and they appear in the register immediately for the rest of their details.

One picker serves Business units and Supporting functions, addressed at a unit
key or at `"fn:<key>"`, which is the same encoding `personRoles()` already
reports. Neither page knows about the other.

**Typing does not repaint.** The filter hides rows in place. A repaint would
replace the very input being typed into, taking its focus and its caret with
it — the same family of fault as §30.1, where a change handler rewrote the DOM
under a button mid-click. **A search box is an interaction that lasts several
keystrokes, and nothing may rebuild it while it is running.**

### 35.3 People are retired, never deleted

The decision §16.11 left open. Units are retired rather than deleted because a
closed cycle names them (§30.3); a person carries reported history the same way.
Snapshots attribute figures to whoever entered them, so deleting the row would
turn a closed cycle into one nobody reported.

Retiring **revokes every role they hold** rather than leaving them pointed at
while unable to act. The unit then reads "unassigned", which is the true state
of a unit whose head has left — where a retired person still named as head is a
unit that looks staffed and is not.

And it closes the door on the **server**, not only in the client: the login
query and every session read now require the person to be active. Retirement is
what happens when somebody leaves the company, so it has to refuse the correct
password, not merely stop offering them roles. Verified with the right password
against a retired account.

### 35.4 Passwords: one shared temporary, and who decides the set

Islam chose **one shared temporary password** over one generated per person. It
is single-use by construction — `must_change` forces a change on first sign-in —
and a list of per-person passwords has to be carried somewhere, which in
practice is less safe than the password was.

**The server decides who is in the set.** `issueTemporary` sends a password and
nothing else; the insert selects the people who have no credentials row at all.
A client that sends a list can send a longer one, so it does not send one — the
worst a stale screen can do is issue to a shorter list than it showed. Nobody's
existing password is ever overwritten; resetting one person is the per-row
action, deliberately separate.

### 35.5 A person the server has not met yet has no password state

Password state is **not in the state graph and never will be** — credentials
live in their own table (§19) — so the register asks for it separately, and only
the SMO may ask.

The bug this exposed: a person created in the register does not exist to the
server until the autosave lands, so they were absent from the cached states and
the "N cannot sign in yet" offer never appeared for them. **Absent is not
"none"**: not knowing whether someone has a password is a different state from
knowing they have none, and the column shows a dash for the first (§30.2, the
same distinction that made new page keys invisible on old tenants).

The fix is to drop the cached states on every successful save, so the next paint
asks again — the first moment the answer can be right. A save that clears them
also asks the screen to repaint, but only when that column is actually on
screen: a repaint nobody can see can only cost.

### 35.6 The URL stops naming the repository

Islam: *"The project url is always named something strange:
…/SMP-Project-Folder/strategy-management-platform-v3.8.html what is that?"*

Fair. The versioned filename is deliberate — **the version IS the cache bust** —
but it has no business being read by a person, and neither has the name of a
folder in the repository. A Vercel rewrite maps the tenant's own name onto the
file, so the address reads `<domain>/raya-trade`.

Opened from a memory stick there is no server to rewrite anything, so the gate
still uses the real relative path there. **The pretty URL is a property of being
hosted**, and claiming it offline would be a broken link.

Three files carry the mapping and must stay in step: `vercel.json` (the rewrite),
`scripts/dev-server.js` (the same rewrite, so what is tested locally is what
ships), and `sw.js` — which caches `/raya-trade` and **not** the versioned
filename, because a service worker caches by REQUEST URL and the gate asks for
the tenant path. Caching the file behind it would fill the cache with something
nobody requests and leave the platform unavailable offline.

### 35.7 Also in this version

- The **People section left Roles & access.** A matrix page is where you set
  what a role may reach; a staff list is not a matrix, and carrying both on one
  screen is most of why that page reads as exhausting. Its redesign is next.
- **cfgHead draws no Clear button without a clear scope.** Companies passed none
  and got one anyway — and because it shares the "units" edit key, opening that
  menu read `labels[0]` off an argument nobody had passed and threw. A control
  that cannot work should not be drawn.
- `phone` and `active` ride in the `people` table's **`extra` jsonb** rather
  than becoming columns. Neither has relational meaning, and adding a column to
  a table that already exists needs a pre-phase migration (§33.5) for nothing
  gained. Round trip verified, and the server reads `active` out of the jsonb in
  the login guard.
- **A unit and a function may share a name** — Care and IT are both, here — and
  one person is often custodian of each. Unqualified, the row read "Strategy
  custodian · Care" twice and looked like a duplicate rather than two real roles
  over two different things. The kind is part of the answer, so it is part of
  the label.
- §16.11 was **numbered twice**; the later one is 16.12 now.

### 35.8 Verified

- 31 viewers × every page, zero console errors; byte-identical rebuild.
- Register driven end to end from the built file: minting a key (and deduping it
  to `needspassword2` on a second identical name), giving a role, the same fact
  appearing on Business units, the picker's filter **not stealing focus**,
  Add-new creating and assigning in one act, and retirement revoking the role.
- Against a throwaway Postgres: clean slate PASS, round trip PASS, fixed point
  PASS, archived plan PASS; `phone` and `active` survive `extra`; bulk issues
  only to those with none and is a no-op the second time; **a retired person is
  refused with the correct password.**
- Live in a browser against that database: states load, the pills render, the
  bulk offer appears only when somebody needs one, and issuing updates the page.
- Both URLs: signing in hosted lands on `/raya-trade`; opened from disk the gate
  still uses the relative versioned path.

---

## 36 · Multi-tenant — what to do when the time comes

Islam: *"the platform should handle multi tenants … that's a future thing I will
build but I just want to make sure that the platform is prepared."*

Nothing speculative was built. What follows is the assessment, so that when it
is built it is not a redesign.

### 36.1 What is already tenant-shaped

- **The org name is data.** `GROUP.org` is what the chrome and the deck read;
  "the platform is named after Raya Trade" already works with no code change.
- **The state graph is one tenant's whole document.** `readState`/`writeState`
  move the entire graph in one go. That shape does not change.
- **The tenant is already in the URL** (§35.6). `/raya-trade` exists today and
  is the seam.
- **The demo dataset is already separate from the tenant's data** (§21) — the
  distinction between "this client's content" and "an example" is settled.

### 36.2 The recommendation: one Postgres SCHEMA per tenant

Two ways exist. A `tenant` column on every table means touching every query,
every insert, every migration, and every uniqueness constraint — and getting one
wrong shows one client another client's plan. **One schema per tenant** means
`SET search_path` at the top of the connection and nothing else changes:
`db/schema.sql`, every migration, `readState` and `writeState` all stand
unaltered, and cross-tenant leakage is prevented by Postgres rather than by
remembering a WHERE clause.

The cost is a schema per client to create and migrate — which `ensureReady`
already does, once per schema instead of once.

### 36.3 The one trap to avoid

**Person keys are short and global.** `smo`, `ceo`, `own_mob` — every tenant will
want `smo`. `credentials` and `sessions` are keyed on `person_key`, so under a
tenant COLUMN those keys need a composite key and every join needs updating.
Under a schema per tenant they are simply different tables and the collision
cannot occur. This is the strongest argument for the schema route, and the thing
that would be expensive to discover late.

### 36.4 The shape of the change

1. Resolve the tenant from the URL path (the slug is already there).
2. `SET search_path TO <tenant>` on each connection, from a whitelist of known
   tenants — never from the URL directly, or the path becomes a way to name a
   schema.
3. Sign-in gains a tenant: a person belongs to one, and the gate either asks
   which client after sign-in (Islam's description) or infers it from the path.
4. `ensureReady` runs per schema, exactly as it does now per database.

Steps 1 and 2 are small. Step 3 is the real work, and it is a decision about
identity rather than about plumbing: whether the SMO is one person with access
to many clients, or one account per client. **That question is not answered
here**, and it should be answered before anything is built.

### 36.5 Restated, unchanged — 2026-08-22

Islam, a version later and in the same words: *"the platform should handle
multi tenants for now where the SMO can enter the platform first and then
choose the client so for now he can choose raya trade and chose another so the
platform is named after raya trade. that's a future thing I will build but I
just want to make sure that the platform is prepared."*

Recorded because it **confirms the shape twice**, and because the sentence
answers half of §36.4's open question by itself: *the SMO enters first and then
chooses the client* means ONE ACCOUNT REACHING MANY TENANTS, not an account per
tenant. That settles which way the identity decision goes and leaves only its
mechanics — whether the schema is chosen after sign-in or carried in the path,
and what a session token is scoped to.

**Still nothing built, and still nothing scaffolded.** A tenant switcher with
one tenant behind it is a control that cannot be tested, and §36.2's whole
argument is that the cost of doing this late is small precisely because
`readState`/`writeState` move a whole tenant in one go. Nothing about this
version's work moves the platform away from that: figure sets went into
`org.extra` rather than into a table with a tenant column, and the searchable
picker is chrome. The one thing to re-read first is §36.3 — person keys are
short and global, and that is the trap that would be expensive to find late.

---

## 37 · The matrix stops being a matrix of pages — v3.10

Islam, on the old page: *"too much. we just need the roles on the left and the
types of pages they might see/edit on the horizontal access and in the table we
have the option to set viewer or editor (Editor includes viewer anyway) or
none."*

And on what the columns are: *"the Group is a page, Own business unit, Other
business units, setup and management pages, own supporting function, other
supporting functions. what else?"*

### 37.1 What was wrong with it

The page was 25 pages × 7 roles, and each cell was three buttons: **525
controls on one screen**, above a roles table and a staff list. It answered
"what may a Company CEO do with the Weighting page" — a question with 175
instances, none of which anyone asks. What people ask is "what can a unit head
do", which is one column, or "who can open Setup", which is one row.

An intermediate design was drawn and rejected before this one: pick a role,
then set five collapsible page groups. It halved well on paper — 15 controls at
rest — but building the mockup killed it. **With the real defaults, four groups
in five are "mixed" for most roles**, so a page that opened mixed groups to
avoid hiding a difference opened itself straight back into the 25-row list it
was meant to replace. The mockup cost an hour and saved building the wrong
thing; that is what mockups are for.

### 37.2 Seven areas, and why seven and not six

Islam's six, with two changes, both forced by what the shipped defaults
actually said rather than by preference:

- **Setup and Management could not be one column.** Every role held *view* on
  the Reporting cycle — a unit head has to see the cycle is open — while only
  the SMO touched Labels, Bands, Units, People. Merged, a unit owner either
  loses sight of the cycle or gains the setup pages. They are two columns.
- **The Knowledge base left the table entirely.** It was `view` for all seven
  roles without exception. **A column whose every cell holds the same answer is
  a question with no second answer.** It is a rule now: readable by everyone,
  always.

Nothing else was missing. All 25 pages land in the seven, and **Companies needs
no column** — a company has no page at all; it is visibility, not strategy
(§23).

### 37.3 Own is not a setting

Islam: *"own is always about what they have a role in … a business unit head
and custodian of Mobile owns Mobile. A CEO of Retail owns all the units below
him. I see this as a logic thing not a settings thing."*

Which is exactly right, and it is the same principle §33 established from the
other end: the attachment already lives on the thing. `roleOwns()` reads it.
There is no control for it anywhere, and there cannot be one to get wrong.

It differs from the old `roleReaches()` in one deliberate way, and the
difference is the whole point: **reaching and owning stopped being the same
word.** A Company CEO whose company may see the others *reaches* those units,
but does not own them — so "own" answers the first column and the matrix
answers the second. Under the old model those were one boolean, which is why
"a unit owner may view other units" was not expressible at all. It is now.

Someone holding several roles gets the most generous answer, with **each role
resolving its own OWN**: the head of the IT unit who also heads the IT function
gets the owner's answer for the IT unit and the function head's for IT the
function, from the same two roles, without either being consulted about the
wrong thing.

### 37.4 Three things became rules

Each was a cell. Each is a sentence now, and each is true whatever the table
says:

- **The Knowledge base is readable by everyone.** An explanation nobody can
  open is not an explanation.
- **A plan is corrected by the SMO alone** (§22, §31). A unit owner holding
  edit on their own unit still cannot rewrite the plan they are measured
  against — that is the point of the rule, and it must not depend on a grant.
- **Focus measures are marked by the group CEO and the SMO.** What carries
  reward is the office's decision, not a page permission. This one was the
  giveaway that the old model was wrong: the group CEO's row read `view` on
  every group page except `g_focus`, which was `edit`, purely so that one
  button would work.

The company's two flags (§23) also survive and sit **on top**: they can only
ever narrow. A company set to keep to itself does, whatever the matrix says —
because the matrix is about a role and those flags are about one company, and
the more restrictive of two true statements is the one to obey.

### 37.5 Reach is derived now, not decided beside the table

`unitsReachable()` used to ask `reaches()`, which had its own opinion. Now a
unit is reachable when the area answering for it is not "none" — which is what
makes "Other business units: view" mean anything: the unit appears in the
navigation, at view. Verified live: granting it took Mobile's head from **2
destinations to 11**, on a repaint, against a real database.

### 37.6 What the collapse costs

Honest ledger. Five unit pages now share one answer, so distinctions inside a
group are gone. Three mattered and all three became rules (§37.4). One remains:
a **Contributor** holding edit on their own unit can now also edit that unit's
Foundation and SWOT, where before they had `none` on the SWOT. It is small — a
contributor is somebody named on a measure inside that unit — and it is
reversible by setting Contributor to *view*, at the cost of their reporting.
Recorded rather than hidden.

### 37.7 Two buttons a cell, not three

Islam: *"No need for the none box that's the default no need to grow the
matrix."*

Right, and the reason is worth writing down: **none is not a third thing you
choose, it is the absence of the other two.** Giving it a button of its own made
the cell 50% wider for a state that needs no control at all — on a table that
was rebuilt to stop being too wide.

Each button is a toggle now. Pressing the lit one turns it off and the cell
falls back to none. The state a press produces is worked out at render, so the
click handler still says only "set this cell to this" and never has to know
what it is replacing.

A cell with neither lit sits on a dashed tray. **Nothing lit IS the answer**,
and a blank cell in a permissions table would read as "nobody has filled this
in" — the one thing it must never be mistaken for.

49 cells, 86 buttons.

### 37.8 Two layout faults the first build had

- **The role column was 19% and the role's description a full sentence**, so
  every one of seven rows wrapped to eight lines and the 49-cell table was
  taller than the 175-cell one it replaced. The description is on hover; the
  cell is two lines.
- **The header notes ran straight across their neighbours.** `_shared.css` sets
  `thead th { white-space: nowrap }` — right for a one-word header, wrong for a
  column that explains what it covers. And `table-layout: fixed` takes every
  width from the **first row, which is the header**, so `.cfg th:first-child`
  was still claiming 15% for a column the `td` rule set to 19%. **A width set
  on the body cells of a fixed-layout table is a width that does nothing.**

### 37.9 Verified

- 31 viewers × every page, zero console errors; byte-identical rebuild; no
  horizontal scroll at 1560, 1000 or below.
- The cell toggles through every path: lit edit → none, none → view, view →
  edit, edit → view, lit view → none, and back. No none button survives
  anywhere, and 86 buttons stand where 147 did.
- The model, per role: a unit head edits their own unit and reaches no other;
  a company CEO owns their company's three units and is held off the rest by
  `seeOthers`; the group CEO sees all ten at view and no Setup; a function head
  edits their own function only; someone holding two roles gets each answer
  from the right one.
- The three rules hold independently of the table: a unit head cannot edit
  their plan or mark focus; the group CEO can mark focus but not edit a plan;
  the SMO can do both.
- **Upgrade from a real v3.9 tenant**, built by running v3.9's own code from
  `origin/main`: 175 page-keyed grants → 0, migration 009 recorded, the graph
  still round-trips, a second run is a no-op, and an area row written after the
  upgrade survives later runs.
- Fresh deploy: clean slate, round trip, fixed point and archive all PASS, with
  **49 grants** — seven roles by seven areas.
- Live against that database through the real gate at `/raya-trade`: 49 cells,
  and changing one moved the navigation on the next paint.

---

## 38 · A design language, and palettes under it — v3.11

Islam sent back `mock-sfstyle.html` — the Strategy-Formulation option drawn on
SMP's own screens — and asked for *"a theme adjustment for the overall design …
after choosing the theme we can identify the colors and shades of the palette
colors used so we can amend upon the company branding."* On branding he was
specific: *"when we do the multitenant we have the ability to adjust the
branding of the platform based on the company who is using the platform."*

### 38.1 The measurement that shaped the answer

Colour in SMP was already tokenised — that is what made dark mode possible in
§25. The type scale and the shape were not: **287 literal font-sizes and 50
literal radii** across about 1,040 rules. Which decided the scope, because the
reference's character is not the indigo. It is the 14px body with no serif, the
`font-black uppercase tracking-widest` micro-labels, hairline cards that state
themselves by border colour, and a LIGHT table header where SMP had a navy band
and a zebra stripe. A palette swap would have produced SMP in different colours
and nothing more.

### 38.2 Two layers, and the line between them is the point

**LAYER 1 — the LANGUAGE.** Type scale, shape, weight. One set, never themed,
never per tenant.

**LAYER 2 — the PALETTE.** Colours and nothing else. Four blocks: two palettes
× light and dark.

Islam chose one language with several palettes over two languages side by side,
and the reason is maintenance: two languages means every page built from here is
drawn twice and tested twice, and they drift the first time one is fixed and the
other is not.

The line is drawn exactly there because of §36. **A tenant's branding will
supply a PALETTE, never a language** — a client can be given their colours
without being given a different product. Nothing was scaffolded for it; the
seam is simply in the right place.

### 38.3 Nothing was renamed, because the names were never about colour

A thousand rules read the colour tokens. Renaming them would have meant editing
every one of those rules to change none of their meaning. Instead three slots
started carrying a JOB rather than a colour:

| token | was | is now, in slate |
|---|---|---|
| `--panel` | navy | slate-900 — the dark bar |
| `--gold`  | gold | indigo-600 — **the accent** |
| `--stone` | navy | slate-700 — neutral-strong |

Which is why nothing had to move: **"gold" was never really gold, it was
whatever the accent happened to be.** The rename would have been a rename of
the comment, not of the code.

### 38.4 A colour that works as a FILL usually fails as TYPE

The first contrast sweep across all four combinations returned 15 failures, and
every one was the same mistake: one token doing both jobs. `--good` at #059669
is a fine dot and a fine bar, and 3.77:1 as a figure. White on the house gold is
**2.4:1**.

So the palette gained a second rank — `--good-tx`, `--attn-tx`, `--warn-tx`,
`--bad-tx`, and `--on-accent` for text sitting on the accent fill. The bare
token stays the fill; the -tx pair is the same meaning one or two steps darker,
for words. **Getting this wrong is not a wrong shade, it is a word nobody can
read.**

Two more for the same reason: the dark bar took `--panel-quiet` and
`--panel-hover` rather than borrowing `--ink-3` and `--surface-2`. Those are
PAGE colours, and the nav bar is not the page — `--ink-3` on it was a dark grey
on near-black at about 2.5:1, and `--surface-2` as a hover painted a near-white
block onto a dark bar. **A surface with its own background needs its own ink.**

### 38.5 The dark variant had to be designed, not copied

Strategy-Formulation has no dark palette anywhere, so slate-dark is SMP's own:
a #0B1120 ground, #131C2E surfaces, indigo-400 accents, and the four scoring
colours lifted to their 300/400 shades so they still separate on a dark ground.
Islam chose this over dropping dark, and it was the right call — dark already
worked and taking it away would have been a visible regression.

### 38.6 An !important is a decision that has to be revisited when the decision changes

The navy table header was enforced with `!important` in `arrange.css`, because
several stylesheets set a background on `th` and one of them had to win. Changing
`_shared.css` therefore did nothing at all — the headers stayed navy through the
whole first pass and only the screenshots showed it. The rule is now the light
header, still `!important`, still for the same reason. **A rule written to win
an argument keeps winning it after the argument has changed.**

### 38.7 The typeface, and why four rather than one

Islam: *"Do we have an option for the fonts used as well?"* — then, when I asked
him to choose one: *"I don't understand why you want to choose from them. Why
not to have four."*

He was right, and the answer to why I had asked was simply that he had picked
"embed one family" earlier — I was following an instruction, not defending a
position. Worth recording because the reasoning that came out of it is the
useful part.

**The constraint that shapes every font decision here** is A5: the built file
has to open from a memory stick and look like itself. So a linked webfont is
out — it breaks the offline handover, and it puts a request to a third party on
every load of a file holding a client's strategy. A face either travels inside
the file or it does not exist.

**The cost turned out to be an order of magnitude smaller than I first quoted.**
I estimated 60–200 KB per family. Latin subsets of VARIABLE faces are 24–48 KB,
because one file covers every weight and the non-latin ranges are dropped. Four
faces are 148 KB, and the built file went from 792 KB to 994 KB. All four are
SIL OFL 1.1, which permits embedding — most foundry fonts do not, and that is
the constraint that actually narrows the field.

**The real cost of four was never bytes. It was verification.** Every face has
different metrics, so a column that fits in one may wrap in another. One face is
6 width checks; five faces is 30. That is the honest argument for settling on
fewer, and it is the reason this axis is temporary.

**The shape question underneath it.** Islam had already said the font should
live WITH the palette. If that is true then the font is not a separate choice at
all — it is part of what "Forefront" and "Slate" ARE, the same way the navy is,
and four fonts would mean four palettes rather than a font menu. Two shapes
follow:

- **A** — the font rides with the palette. One switch. A client's branding
  later arrives as one package: their colours and their face together, which is
  how a brand actually works.
- **B** — the font is its own axis. Three switches, any combination, 30 checks.

Islam: *"Good approach B first."* Which is the right sequencing: **B is how you
DECIDE, A is how you SHIP.** Judging a typeface from a specimen sheet is
guessing; judging it on your own screen with your own numbers in it is not. Once
each palette has a face, the axis collapses into the palette and the faces
nobody picked leave the file.

**Absence is the system stack.** There is no `[data-font="system"]` block,
because there is nothing for it to say — `apply()` REMOVES the attribute, and
`--sans` falls back to `--sys-sans`. The same reasoning §25.2 used for the
theme before Auto was retired.

Two small things: every face names the system stack after it, so a face that
fails to decode degrades to the system font rather than to a default serif; and
the control renders its own name IN the face it names, so the press is not the
only way to find out what it looks like.

The MONO stack stays a system stack. It carries person keys and unit codes — a
dozen short strings — and a second embedded family for those would be 40 KB for
nothing.

### 38.8 Verified

- **Zero contrast failures across all four combinations** — slate and forefront,
  light and dark. Light mode had carried 61 known failures since §25; those are
  gone with the palette rather than fixed one at a time.
- 31 viewers × every page, zero console errors; byte-identical rebuild.
- Width sweep 1920→900 on the densest page (a unit's Plan, rail plus two wide
  tables): no horizontal page scroll at any width.
- All four palette/theme pairs load from storage, paint the right attributes and
  survive a reload.
- **Five faces × six widths on the densest page** (a unit's Plan: the rail plus
  the measures and tactics tables) — no horizontal page scroll in any of the 30.
- Each embedded face actually becomes the body font rather than silently
  falling back; "System" removes the attribute; the choice survives a reload.
- The built file is 994 KB with all four faces inside it, up from 792 KB.


---

## 39 · Branding — the tenant's own colours

Islam: *"where is the branding adjustment section?"* — and there wasn't one.
§38 built the palette LAYER and stopped there, on the reading that branding was
the multi-tenant thing. The seam was right; the missing part was a place to
type a colour, and he was right to look for it.

### 39.1 Branding is tenant data. A theme is not.

This is the whole design, and it is the inverse of §25.2. A theme must NEVER go
in the state graph, because it autosaves and one person choosing dark would
turn the platform dark for the entire company. Branding is the opposite case
for exactly the same reason: a client's colours have to be the same for
everyone in that tenant, so they belong in the graph and nowhere else.

So the precedence is three lines:

    a person's own choice   (localStorage)      wins
    the tenant's branding   (the state graph)   otherwise
    the shipped palette                         otherwise

Which is why `chosenPalette()` returns **null** rather than a default when
nobody has pressed anything: only an actual choice may outrank the tenant's
brand, and "whatever was first in the list" is not a choice. Getting that
backwards would have meant a tenant's branding never applied to anybody,
because everybody already had a default.

Islam chose brand-as-default-with-personal-override. Light and dark stay
personal regardless — that is about the room somebody is sitting in, not about
the brand.

### 39.2 A brand is two colours, not seven

Asking for an accent, a darker accent for text, an ink to sit on the accent, a
glow, a bar, a quiet ink for the bar and a hover is asking somebody to do the
work the platform should do. The page takes **the accent and the dark bar** and
derives the other five.

That is also the only way §38.4 can be *guaranteed* rather than remembered. A
brand colour that is unreadable as text is **darkened until it is readable**,
by walking it toward black (or toward white on a dark ground) until it clears
4.5:1 — and the page says so: *"darkened to #896E34"*. The house gold makes the
point on its own: as a fill it gets ink `#0C111A` for **7.89:1** where white
would have given 2.4:1, and as a word it becomes `#896E34` for 4.83:1.

The bar's quiet ink is derived the same way — the bar mixed 55% toward its own
ink — so it is legible ON the bar whatever colour the bar is, which is the
§38.4 mistake made impossible instead of merely fixed.

### 39.3 Reported, never silently corrected

Every derived pair is contrast-checked and shown, with the ratio and a verdict,
every time a colour changes. Somebody typing their own brand colour is entitled
to know it needed darkening and by how much. A half-typed hex is refused rather
than stored — storing it would blank the colour and look like the platform had
lost it.

### 39.4 No schema change

`GROUP.branding` rides in the org row's `extra` jsonb, exactly as `phone` and
`active` do for people (§35.7). Anything on the group that is not an org column
and not a tabled key lands there already.

### 39.5 Verified

- Two colours derive seven; **every derived pair clears 4.5:1** for the house
  navy and gold, including the two that fail if taken naively.
- It paints: the accent reaches `--gold` and the nav bar takes the brand colour
  live, on the same repaint.
- **A personal choice still outranks it**, and with no personal choice the
  tenant's brand decides — both directions checked.
- Clearing the brand removes the inline properties rather than leaving them
  behind, so the shipped palette comes back.
- Round trip against Postgres: branding survives, lands in `org.extra`, and
  `write(read())` is still a fixed point with it set.
- 31 viewers × every page, zero console errors.


---

## 40 · The retheme's second pass — what a one-page sweep missed

Islam, with a screenshot of the rail: *"it's working but some areas had the
dark blue navigation color that was turned to transparent now. we need to check
them … check the rest."*

### 40.1 The claim that was too big

§38 reported **zero contrast failures across all four combinations**, and that
was true of what it measured — the group's front page. Swept across **19 pages**
instead of one, the same check returned **316**. The measurement was honest;
the sentence around it was not, and "zero failures" without naming the surface
it covered is the kind of claim that stops anyone looking again.

The sweep now walks every destination — five group tabs, a unit's Performance
and Strategy, eight Setup pages and four Manage pages — in both palettes and
both themes.

### 40.2 What Islam actually spotted, and the rule behind it

`.rail .rhead` was navy; the retheme made it the card's own surface, which left
it reading as nothing at all. **A header is a label for what sits under it, and
it needs a ground of its own to be one — whether or not that ground is dark.**
It takes the same quiet header the tables now use.

Auditing the rest turned up the worse half of the same mistake: `thead th` and
`.phead` went light while `.grouphead`, `.gcard .card-head` and `.capline`
stayed navy, so **the product was carrying both header treatments at once** —
exactly what the rule those files already stated exists to prevent. A retheme
that converts some members of a family and not the others is worse than one
that converts none, because the survivors read as mistakes rather than as a
style.

### 40.3 Three inks on grounds they were never chosen for

All of the remaining 316 were one shape of error, and it is §38.4 again:

- **`--ink-3` cleared 4.5:1 on white and failed at 4.34 on `--surface-2`** —
  which is where most of it actually is, in card heads, table heads and section
  grounds. **A token checked against the most generous background it ever meets
  is a token checked against the one case that was never in doubt.** Both quiet
  inks are set against the quietest ground they sit on now.
- **`--none` was 2.56:1** as text and is used as text in a dozen places.
- **`--panel` used as INK on the accent fill** (the open nav fold), and
  **`--gold` used as ink on the panel** (the Temple's pillar labels, at 2.84:1).
  A colour chosen to work as a fill on the page is not a colour that works as a
  word on the bar; that is what `--on-accent` and `--panel-accent` are for, and
  three rules had been reaching past them.

One was wrong in meaning as well as in contrast: the access matrix's *edit*
state sat on `--attn-bg`, the WARNING tint. "May edit" is not a warning. It is
on the accent tint now.

### 40.4 Verified

- **316 → 0** across 19 pages × 2 palettes × 2 themes.
- Only three surfaces still carry the dark panel colour, and all three are
  meant to: the prototype banner, the navigation bar, and the Temple — which is
  a drawing, not a component.
- 31 viewers × every page, zero console errors; byte-identical rebuild.


---

## 41 · The accent budget

Islam, comparing the old rail with the new one: *"this view made better sense …
the grey shade on the selected direction is more subtle rather than what you
made … it's a strategy platform, needs to be subtly coloured."*

### 41.1 It was not one rule, it was five

The retheme gave a solid accent fill to five things at once, and three of them
had been navy or subtle:

| | was | became |
|---|---|---|
| the rail's selected pillar | grey ground, accent edge | solid accent |
| the navigation's selected unit | accent underline | solid accent pill |
| the current quarter pip | navy | solid accent |
| import step numbers | navy | solid accent |
| the capability band | navy | solid accent |

Which is why it read loud without any one of them being obviously wrong. **The
budget is the thing to watch, not the rule.** A single solid fill is a mark; a
product with nine of them has a colour scheme instead of an accent.

The reason it happened is worth keeping too: the reference marks its current
place with a filled pill and a pulsing dot, and I carried that through
consistently — the rail matching the nav so "which pillar am I on" reads the
same way "which unit am I on" does. **The consistency was real; the volume was
wrong**, and consistency at the wrong volume is still wrong.

### 41.2 What was chosen, from a comparison rather than from a description

Four rail treatments, three navigation treatments and two pip treatments drawn
in both palettes, on the real components, before anything was implemented.
Islam took **B, C, A**:

- **Rail: a quiet ground with an accent edge.** The edge says which row without
  taking the row's own colours away — the score in particular keeps its scoring
  colour instead of being swallowed by the fill, which on a page about scores
  is the whole point.
- **Navigation: the underline, as it was.** The 3px line is a transparent
  border reserved on every button, so selecting one cannot move the row by
  three pixels. The pill's radius went with its fill: a rounded pill carrying a
  straight underline reads as neither.
- **Pips: solid, unchanged.** A 20px pip is a mark, not a slab. Keeping this
  one solid is what makes the other two read as deliberate rather than as a
  product with no accent at all.

The accent now does four jobs across the product instead of nine.

**The rail and the navigation no longer match each other**, which was
deliberate before and is given up on purpose. That was the price of the quieter
register and it is worth paying.

### 41.3 What went with it

The pulsing dot, and with it `@keyframes sf-pulse` and its reduced-motion
guard — nothing else referenced them (§24: delete an element and delete its CSS
with it).

### 41.4 The last item on the budget: the open fold

The rail, the navigation and the pips were the five; the **open navigation
fold** was the sixth and was not touched, because it was gold before the
retheme rather than because of it. With the navigation back to an underline
that became the visible fault: the opened MENU was louder than the page you
were ON, and the accent was being spent twice within two inches of itself.

Drawn again rather than described — five treatments, the same moment in each
(`mockups/2026-08-21_fold-accent_PENDING.html`): A the solid pill as shipped,
B the closed shape kept with the accent on the caret alone, C an accent edge
instead of a fill, D accent words with no fill, E the rail's answer borrowed
literally. **Chosen: D.**

The recommendation had been C, and the note against D was recorded before the
choice and stands: the open state loses the border the closed state has, which
is the wrong way round if you read the border as "this is a control". Islam
took D anyway, and the reading that makes it right is a different one — an
open fold is not a button any more, it is a **heading over the list it just
revealed**, and a heading does not need a box. What the choice buys is that
the underlined page is now unambiguously the loudest thing on the bar, which
was the whole point of the budget.

One rule fell out of implementing it. **`.open` beats `:hover` on source order
alone** — both are `0,3,0` — so replacing the open fill without adding an open
hover would have left the fold silent under the mouse. The `.open:hover` rule
is there for that reason, not for decoration.

### 41.6 The palette switch is removed, and the default was wrong

*(Islam, 2026-08-21: "I don't need to have slate, the branding covers this from
inside.")*

Which colours the product wears is the TENANT's decision, set once on Setup ›
Branding — not a per-screen preference that leaves two people in the same
organisation looking at different products. The switch is gone. Light and dark
stay each viewer's own, because those are about the room they are sitting in.

Removing it exposed a defect the switch had been hiding: **`PALETTES[0]` was
`slate`, and the bare `:root` block held slate's values** — so a fresh
deployment opened in a palette that is not the house one. Nobody noticed,
because everybody pressed the button. **What paints when nothing has decided
must be what the product actually is**, so Forefront is `PALETTES[0]` and the
bare `:root` now.

Three smaller consequences. The stored `smp.palette` key is no longer read AND
is cleared on load — a value left in a browser from before would otherwise pin
that person to a palette with no control left to change it back. The dead
helpers went with the control (§24). And the contrast sweep now selects a
palette the way branding does, `THEME.setBrand({palette})`, rather than through
a key nothing reads any more — otherwise it would have measured Forefront
twice and called it four combinations.

Slate stays in the stylesheet as the second palette the two-layer system proves
itself against, and as what a tenant's branding will plug into (§36).

### 41.7 The closed fold: a soft ghost

Islam, on the closed state: *"they look poor."* He was right, and the reason is
typographic rather than chromatic: the labels were **11px uppercase
letterspaced in a bordered capsule**, sitting beside 13.5px sentence-case tabs.
A different species. Four treatments were drawn
(`mockups/2026-08-21_closed-fold_PENDING.html`); **D was chosen** — a quiet
fill, no border, the row's own sentence case.

Why not B, which was the recommendation and dropped the container entirely: a
fold is **a group of things rather than a page**, and the container is what
says so. D keeps that and drops the shouting.

### 41.8 The folds become one control

The soft ghost (§41.7) was chosen from four treatments and never reached
Islam's screen — `main` was four versions behind — so when he looked at the
deployed bar he was looking at the capsule it replaced. Six were drawn again,
closed AND open, and **4 was chosen: one shared container.**

Both folds now sit in a single segmented box divided by a hairline. Three
things it buys. The bar carries **one box instead of two**, on a row that has
no other box. The shared container **says outright that Units and Functions
are the same kind of thing**, which two separate capsules only implied. And
the two folds **stop moving**: they used to be separated by whichever list was
open, so the control you had just pressed changed position every time you
pressed it, and Functions sat somewhere different depending on Units. The
opened list now follows both of them.

Open is **the segment lit, not the word coloured**. §41.4's accent words had
nowhere to sit inside a filled container — a coloured word on a filled ground
reads as the disabled segment rather than the open one — and lighting the
segment is what a segmented control already means. The accent budget is
untouched: this spends a lighter wash, not the accent.

One implementation note worth keeping: the divider between the segments is an
**inset shadow, not a border**, because a border would add a pixel to the
segment's width and shift the one beside it.

### 41.9 The phantom in every mockup

Islam: *"why is the sample you show showing a unit while closed, we already
removed this long ago."*

He was right. `.foldhere` — the "· Mobile" beside the closed Units fold — was
removed from the markup in an earlier version (the reversal is recorded in
`unitTabs()`'s own comment) and **its CSS was left behind**. Every fold mockup
in this round was drawn by reading that stylesheet, so every option put in
front of him contained an element the product does not have.

The rule §24 already states — delete an element and delete its CSS with it —
exists precisely so that leftover CSS cannot later be mistaken for the product.
This is what happens when it is not followed. The rule is now deleted.

**And the lesson underneath it: a mockup drawn from the STYLESHEET is drawn
from what the product could look like, not from what it does.** Draw from the
rendered page.

### 41.10 The headers go back to the tenant's colour

Islam, on the rail's PILLARS header and the table headers: *"what happened to
the coloring... they were following the navigation branding color."* And then,
on being offered navy: **"it's not a navy/gold thing. It follows the brand
colours set in the platform."**

That sentence is the decision, and it is a product argument rather than a taste
one. `--panel` is the colour **Setup › Branding sets for the navigation bar**.
A header on `--panel` WEARS THE TENANT'S BRAND; a header on `--surface-2`
wears nothing. The light header was the reference product's answer to a
question SMP answers differently, because SMP is branded per tenant and the
reference was not — porting it was porting an answer along with the language.

**All five go back together**, which is §40's lesson applied rather than
re-learned: `thead th` (every table in the product), `.phead`, `.rail .rhead`,
`.grouphead`, `.gcard .card-head`. Converting SOME members of a family is
worse than converting none — the survivors read as mistakes rather than as a
style — and it is what left the presentation deck's headers navy while every
screen behind them went light.

**The audit that found them** is worth keeping as a method: rather than
listing from memory, every selector carrying `background:var(--panel)` in the
pre-retheme stylesheets was diffed against the current ones. Eight had lost it;
five were headers and go back, and three (`.imp-n`, `.oblband.cap`,
`.qs i.on`) had gone to the ACCENT rather than to light and belong to §41's
budget, not here.

**And the ink had to follow the ground, again.** Restoring the ground took the
sweep from 0 to 36 failures, every one of them a second line inside a header —
"Performance, Foundation, Temple…", "Their key is their username" — written in
the page's quiet ink, which is quiet on a pale ground and **2.4:1** on this
one. §38.5 for the third time: **a surface with its own ground needs its own
ink.** `.factor-h span` was the stubborn one, at `0,1,1` where the header's own
rule could not reach it; it takes `--panel-quiet` directly now, which is
correct rather than clever because `.factor-h` only ever appears inside a
header. Back to 0.

### 41.5 Verified

- Contrast: **0 failures** across 4 combinations × 20 pages and states. The
  sweep gained a state rather than a page: **an open fold is not reachable by
  navigating to it**, so it was never being measured — `scan("group/units-fold-open")`
  runs while it is open. A treatment nothing measures is a treatment nothing
  checks.
- 31 viewers × every page, zero console errors; byte-identical rebuild.

---

## 42 · The server decides who may change what

*(Spec 006. The first item of the security work Islam asked for, and the only
one that was exploitable by a real user rather than a hypothetical one.)*

### 42.1 What was wrong

`POST /api/state` checked that you were signed in and nothing else. It then
truncated all thirty tables and wrote back whatever arrived — including
`people`, `unit_roles` and `access_grants`.

So the lowest-privilege person in the tenant could post a state making
themselves the SMO, and on their next request they were: issuing passwords,
resetting anyone's, reading and changing everything. No flaw was needed. The
browser already builds and sends that object; one field had to be edited on
its way out.

**Everything §37 built decided what a screen OFFERED. Nothing decided what the
server ACCEPTED.** The forty-nine cells were a suggestion.

### 42.2 The two lines that carry the design

**The world is the STORED state, never the incoming one.** Roles, the access
map, unit ownership and the company flags are all read from what the database
already holds. Authorise against the incoming state and a save can grant
itself the role that authorises it, in the same request. It is one line in
`authorize()` — `const w = R.worldOf(stored)` — and it is the whole security
property.

**An unrecognised change is the SMO's.** Every classifier ends in a
fall-through that lands on `unknown`. A field the platform gains in a later
version is guarded on the day it is added rather than the day somebody
remembers to guard it. It fails CLOSED, and the cost of failing closed is a
refusal the SMO can always make instead — never a silent hole. That bucket
caught a real defect within an hour (§42.5).

### 42.3 One copy of the rules, run on both sides

The browser already answered "may this person edit this?" to decide what to
draw. The server needed the same answer to decide what to accept. Two copies
would drift, and the drift is silent in the worst way: **a screen that offers
an edit the server then refuses.**

So `lib/rules.js` holds the roles, the areas, the shipped access defaults and
every pure function that reads them — `personRoles`, `roleOwns`,
`companyAllows`, `areaFor`, `grantIn`, `namedOn`, `onlyVia`. `build.py` inlines
it into the single file; `api/state.js` requires it; `scripts/extract-state.js`
runs it before the sources so the seed is generated from the same list.
`config-data.js` keeps every name it had and aliases them, so the forty call
sites did not move.

This is §33's pattern — one fact, two editing surfaces, cannot disagree —
applied to authorisation. It was not optional: the moment the contributor
default moved to `view`, the two copies already disagreed.

### 42.4 The diff IS the change log

The comparison that authorises the save is the comparison that gets written
down, so the log costs nothing extra. `change_log` (migration 010) sits
outside the state graph beside `credentials` and `sessions` — **a log a save
can erase is not a log** — and carries, for each figure that actually moved,
its row, its name, its field, and its before and after.

    mobhead | unitReporting | mobile | reported figures
             {"id":"mobile-P1-M1","name":"Data duplicate rate",
              "field":"actual","from":"1.4%","to":"51%"}

Whole-area changes (the register, the matrix, the cycle) carry no values — a
diff of the people array is not a sentence anybody reads — so for those the
WHAT is the record. The itemised list is capped at 200 rows: a plan import
moves thousands at once, and a log entry nobody can read is not a record.

### 42.5 What the browser found that seventy-seven tests did not

`branding()` created `GROUP.branding = {palette:null, font:null, accent:null,
bar:null}` the first time anything asked, while an untouched tenant's database
held no branding at all. The two could never become equal again, so **every
save carried a group change nobody had made** — and once the server started
checking, every non-SMO save was refused for ever, with a message naming
nothing useful.

Sixty-seven unit tests and ten end-to-end API tests passed while this was
true, because every one of them built its payload from the seed rather than
from a running browser. It took signing in as a unit head and typing a number.

**A reader that mutates what it reads will eventually be caught by whoever
compares before and after.** The fix follows the rule `weight` already
established: `sync.js` drops an all-null branding on the way out — what is not
the tenant's own is not sent. And the unrecognised-change refusal now NAMES
the fields that moved, because a refusal nobody can diagnose is a bug report
addressed to nobody.

### 42.6 A refused save says so, where the save is

Before this, a failed save logged a warning to a console nobody has open and
retried for ever. With authorisation that becomes the worst failure the
feature could have: a change made, refused, and still on screen as though it
had landed. The banner carries the server's own sentence, never a paraphrase,
and the refused payload is remembered so the identical body is not posted
again — remembered separately from `lastSaved`, which would claim it had
landed. This is §32's rule from the Labels page, one surface further in.

### 42.7 Islam's three answers

- **A locked cycle refuses reporting**, from everyone but the SMO. Both the
  screen and the server check it, or the page invites a figure the server will
  turn away.
- **Contributors view; if allowed, their own lines only.** The default moves
  to `view` (migration 011, only where the tenant still holds the old default —
  *a migration that overwrites a setting somebody made is a migration lying
  about being a default*). "Their lines only" is a rule with teeth, so a stored
  `edit` still reaches nobody else's rows. Submitting, and the unit's note on
  the cycle, speak for the whole unit, so a contributor does neither.
- **A tactic's quarters are plan.** If a unit can move its own ticks, a tactic
  due in Q2 that did not happen is dragged to Q4 and the unit is no longer
  late. The record of what was promised stops being a record.

`canReport()` also stopped being a hard-coded `head or custodian or SMO` and
now asks the matrix — **a control that changes nothing is worse than no
control**, and the contributor row could not do anything even when the SMO set
it to edit.

### 42.8 Verified

- `scripts/test-authorize.js`: **67 checks, 0 failures.** Escalation, reach,
  the locked cycle, the contributor rule, a retired person — and the half that
  matters more, every role doing its own legitimate work unrefused.
- Throwaway Postgres 16 and the real API end to end: **10 checks, 0 failures.**
- The platform driven in a browser as a unit head and as the SMO: 12 reportable
  fields offered, a legitimate report saved silently, a plan change refused
  with the banner shown, no console errors.
- Round trip, clean slate, fixed point: PASS. QA 31 viewers, zero console
  errors. Byte-identical rebuild.
- Cost: **~240ms** per save on a local Postgres with the ten-unit example.

### 42.9 What this did NOT close

The rest of the security floor, in the order proposed: the `1234` SMO
(migration 003) still exists; `must_change` is still not enforced on
`/api/state`, so a temporary password buys a full session; there is still no
rate limit or lockout on sign-in; there are still no security headers; raw
database errors still reach the browser; expired sessions are never pruned and
a password change does not end the others.

---

## 43 · The security floor

*(Spec 007. The five items §42.9 left open, plus session hygiene. §42 closed
the hole a real user could walk through; these are the ones an attacker walks
through.)*

### 43.1 The `1234` SMO is retired, not removed

**§19.4 is reversed.** Islam, 2026-08-20: *"don't ask me to do new passwords
now on the app, just let me access with SMO and 1234."* That was right for a
prototype nobody's data was in and is wrong for a product a client's strategy
is in. The convenience it bought is one screen, once.

The bootstrap still creates `smo` / `1234` on an empty database — a deployment
with no way in is not a deployment — but it now carries `must_change`, so the
first sign-in leads straight to the change screen.

For a tenant already running, one step checks whether the stored hash still
verifies against `1234` and sets `must_change` only if it does. **It could not
be a `.sql` file**: migration 003 wrote the hash with its own salt, so the
question cannot be asked in SQL. It runs once, recorded in the same
`_sql_migrations` registry, and it **sets a flag rather than clearing a
password** — this must not be able to lock anybody out of their own
deployment, and somebody who already chose a real password is not nagged.

### 43.2 A temporary password bought the whole tenant

The gate had always sent people with a temporary password to the change
screen. The server did not care whether they went, so an issued password
opened a thirty-day session and every figure in the tenant.

`/api/state` refuses both directions while `must_change` is set. **Identity is
checked before authorisation**: somebody who has not finished signing in is
not somebody whose roles are worth consulting.

### 43.3 Nothing slowed a guess

Two thresholds in a rolling fifteen-minute window, because they answer two
different attacks: **8 per person key** stops a password list against one
person; **25 per address** stops a list of PEOPLE instead — person keys are
short and guessable, so without the second the username half of each guess is
free. Only failures are recorded; a successful sign-in clears that key's.

Two rules came out of building it. **The limit is checked BEFORE the password
is verified**, or it is a timing oracle: a wrong password costs a scrypt hash
and a locked-out one costs nothing, and the difference is measurable. And the
message never says which threshold was hit or whether the key exists — **a
rate limiter that confirms usernames has given away what it was protecting.**

**The trade-off is real and was observed, not theorised:** hammering `smo`
locked the SMO out for the window, mid-test. A threshold per key means anybody
who knows a key can push that account over it. That is exactly why the window
is short and self-clearing rather than a lock somebody lifts by hand — a
permanent lockout turns "I know your username" into "I can keep you out".

### 43.4 Headers, and the limit of the policy

A CSP plus `X-Frame-Options: DENY`, `nosniff`, `no-referrer`, HSTS, a
`Permissions-Policy` turning off camera / microphone / geolocation / payment /
USB, `Cross-Origin-Opener-Policy` and DNS prefetch off — on every path.

`scripts/dev-server.js` **reads the list out of `vercel.json`** rather than
repeating it: the local server exists to test what ships, and a second copy of
a header list is a second copy that goes stale. It drops HSTS alone, because
sending it from `http://localhost` pins the browser to https for localhost and
breaks every other local server on the machine.

**The honest limit.** `'unsafe-inline'` stays, because the single-file design
is nothing but inline script and inline `style=` attributes. What the policy
still buys is real — no external script, no external connection, no framing,
no plugins, no `<base>` — so an injection has nowhere to send anything. What
it does not buy is protection from an injection that runs. The upgrade is a
hash-based `script-src`, which is possible (there is not one inline event
handler in the product) and needs `build.py` to emit the hashes and the gate to
carry its own. Recorded rather than done, because **a stale hash is a page
that does not load.**

### 43.5 Two smaller ones

A database error names tables, columns and sometimes values. None of that
belongs in a browser: it is a free map of the schema to anyone probing and
means nothing to the person who hit it. One sentence out, the real error to
the function's log.

And sessions: expired rows are deleted on every sign-in — one DELETE on a path
already writing, since there is no scheduler here — and choosing a new
password ends **every other session that person holds**, because the old
password may be exactly why they are choosing. Their own survives: being
signed out of the tab you just used to choose a password is not security, it
is a bug that looks like one.

### 43.6 Verified

- 11 checks on the door and the limiter against the real API: `1234` signs in
  and buys nothing; the change is accepted and the state then opens; a weak
  replacement is refused; guessing is cut off from the ninth attempt; a
  CORRECT password is refused while the window holds.
- 4 on sessions, and a stale row gone on the next sign-in.
- §42's 12 authorisation checks re-run through the temporary-password flow.
- The platform driven in a browser under the CSP: **no violations**, worker
  registers, manifest loads, fonts render, reporting saves, a plan change
  refused with the banner.
- Fresh database: clean slate, round trip, fixed point PASS — and the
  bootstrap SMO arrives with `must_change` set.
- QA 31 viewers, zero console errors; byte-identical rebuild.

### 43.8 An explicit reset, asked for and once

Islam, 2026-08-21: *"Please reset my admin password to 1234 for now until
later adjustment."* Asked for outright, so done — and written where it can be
seen rather than done quietly, because four digits on a public URL is not a
password and the whole of §43 exists because of that.

Two things make it safe enough to write down. It runs **AFTER**
`retireTheSimplePassword`, or the retirement would set `must_change` back in
the same request — order is the whole of the correctness. And it runs **ONCE**,
recorded in the migration registry: a reset that ran on every deployment would
put the password back to 1234 every time a real one was chosen, which is a
permanent backdoor and the exact thing §43.1 removed.

Changing the password from Setup › People from then on is what it is for, and
this step will not fight it. Delete the function and its registry row to end
it.

### 43.7 What is still not done

Hash-based CSP (§43.4). Tenant isolation (§36). At-rest key custody, backups
and retention. **Who at Forefront can read production** — a people-and-process
control, not a code one. An external penetration test before go-live. The
Copilot's read scope.

---

## 44 · Figure sets — who is responsible for which numbers — v3.14

Spec `specs/008-figure-sets/spec.md`. This **supersedes the `{ team, by }` shape
§16.7 built** on 2026-08-21 (nothing was deployed with it, so nothing migrates)
and **reverses §16.7's third settled question** — see §44.6.

Islam's own account of the concept, which is where the whole design comes from:

> *"There is someone who can be responsible of a set of numbers. This person
> can see a full list like we created with all the units in place so he can
> tick what he is responsible of."*

### 44.1 The unit of ownership is a SET, not a person and not a department

§16.7 attached a number to a *team plus a person*, and the first thing that
broke was the naming. "Figure custodian 1, 2, 3" says nothing about what
anybody owns; *Financial Figures* and *Market Figures* say everything.

So the thing that owns numbers is a **named set** — a name, a team, ONE owner,
and who may pick its figures. **The role then needs no name of its own**: a
person is the owner of a set, and that is the whole of it. It is also what
makes several people owning different numbers work without inventing a
hierarchy of custodians.

**The team is on the SET, not read off the person.** §33's instinct — read a
role from what it is attached to — fails here, and Islam's reason for showing a
department at all decides it: the BU head needs to know **who to talk to** when
he is writing the note against a number he did not enter. *"Set by Financial
Figures"* does not answer that; *"Set by Finance"* does. And the person's own
department cannot be trusted to say it, because the Finance SMO custodian sits
with the office rather than in Finance. It also survives the owner changing:
hand the set to somebody else and the unit still reads *Set by Finance*.

**ONE owner per set.** Two people splitting the work is TWO SETS, which is the
more honest arrangement anyway — each one's scope becomes visible instead of
two people sharing an undivided pile. And it is what lets a figure store only
the SET: who enters it is read from the set, never copied onto the row. Handing
a set over is then **one edit rather than twenty-seven**, and no figure can be
left pointing at whoever used to hold it. Same pattern as a unit's head pointer
(§33): a role is read from the thing, never stored twice.

**Membership lives on the FIGURE**, not as a list inside the set:

    row.src = { set: "<set id>" }     claimed into a set
    row.src = { by:  "<person key>" } named directly by a unit custodian

That is what makes *one figure, one set* an invariant that cannot be violated
rather than a rule somebody has to check — and it is why a conflict is caught
at the moment of the tick instead of found later.

### 44.2 Who picks a set's figures is a SECURITY setting

Islam: *"some numbers are confidential for some people and they shouldn't see
all the group numbers, but for Finance everything is not confidential because
they see everything, so they are a special case."*

**A set owner who ticks from the full list has, by definition, read every
number in the group.** That is the whole mechanism. For Finance it costs
nothing. For anybody else it means somebody whose entire job was entering three
numbers can read the lot.

So each set carries a switch, and **it defaults to the SMO**: the exception is
the one you switch on, not the one you remember to switch off. It is enforced
**on the server** — a set marked *the SMO fills it* has its claims refused when
they arrive from its owner. A switch that only hides a control is decoration,
which is what §42 already cost us once.

**And there is no half-view to design.** "The owner picks" IS the grant of
sight over the whole group's figures, so where it is off the picking page does
not exist for that owner at all.

### 44.3 Two ways a figure gets an owner, and first claim wins

**A · somebody ticks from the full list** — the SMO by default, the set's owner
where the switch allows. Set at the top, units as buttons with their counts on
them, one tick per row.

**B · the unit's own strategy custodian names people, figure by figure.**
*"The custodian doesn't get a ticking page — he gets all his directions and
targets and a searchable dropdown in front of each number so he can set who can
input them."* No set is involved.

The two want opposite shapes for a reason worth keeping: **a set owner is
looking ACROSS ten units for the few figures that are theirs; a custodian is
looking DOWN one unit at all of them.** A ticking page serves the first and
fights the second.

**There is no precedence rule between A and B, deliberately.** Whoever claimed
it first holds it. A rule that ranked them would need explaining every time it
applied — and it would be arbitrary, because both are legitimate claims made by
people who are entitled to make them.

Attempting to claim what somebody already holds does not fail silently: the
person is told **who holds it** and is offered **Request the claim**.

### 44.4 Claim requests

A request records the figure, the asking set and who asked. **The SMO answers
it** — not the current holder, for two reasons: the holder has an interest in
the answer, and the SMO is the only person who can see both sides. *Move it*
puts the figure in the asking set and closes the request in one act, because a
granted request sitting open beside a figure that had already moved is two
records of one decision. *Leave it* closes it without moving anything.

**Asking twice is refused** — asking twice is not asking louder. **Removing a
set takes its outstanding requests with it**, because a request to move a
figure into a set that no longer exists is a question with no answer. And
**removing a set releases its figures** back to the units rather than orphaning
them: a figure pointing at a set that is gone has nobody to enter it and no way
to say so.

### 44.5 B is built and HIDDEN, behind a tenant switch

At Islam's direction — *"keep the option hidden somewhere in the setup maybe
until later"* — so one way of assigning is watched in practice before the second
is turned on.

**Strategy › Who enters**, one section inside each unit's Strategy tab. It is a
UNIT page and not a Setup one for a reason that only shows up when you check:
**a strategy custodian holds no Setup at all**, so a Setup page would have been
unreachable by the only person it is for.

The switch lives on Setup › Figure sets, behind the Edit button — one line
about the same subject, which is who is master of which numbers. **The server
reads the same flag**, so a naming posted while it is off is refused; hiding
the page would have left the save unguarded.

**Turning it OFF leaves every naming in place.** A switch that destroys data is
not a switch, and turning it back on has to find the page as it was left. The
namings simply stop being reachable — which is what *hidden* means.

**Naming somebody gives them that FIGURE and nothing else** — not the unit's
other measures, not its plan, not its score. They sign in during the cycle and
find one page listing every figure they owe, wherever those figures live. Which
is also why it stores a person rather than a role: there is no role to give.

**A custodian may name anyone the platform knows**, not only people attached to
their unit — the person who knows a number often does not sit in the unit that
reports it. The picker reuses the register's (§35): same search, same *ordered,
not filtered* rule, one filter implementation rather than two that would drift.

### 44.6 What this reverses, and what still stands

§16.7 settled: *"Disagreement is settled off the platform. No challenge
workflow, no arbitration screen."*

That still holds for **whether a number is right** — the conversation about a
disputed figure belongs between the two teams. What has changed is **whether
somebody may claim it**, and there the old decision assumed the SMO was the
only person assigning. Once two people can claim, **a refusal with no route
forward is a dead end**, and the platform is the only thing that knows the
claim was turned away. Recorded as a reversal with its reasoning, never
overwritten.

Everything else in §16.7 stands unchanged and is worth restating, because it is
what makes the feature safe: **the unit writes the note, always** (the number is
the set's, the performance is the unit's); **an assigned figure still counts
toward the unit's total**, so a unit cannot submit around a missing number and
the chasing is distributed to the people who want it; and **the unit's
custodian submits the whole thing**, having possibly entered none of it.

### 44.7 What the build taught

**A reader that mutates what it reads will be caught by whoever compares before
and after.** Not new here — it is §42.5 — but it is why every step of this was
driven in a real browser against a real server rather than trusted to tests.
Step 3's acceptance test is exactly that: sign in as the unit's custodian, name
somebody, and confirm **the server accepted the save**.

**The client and the server must build the world the same way.** The browser's
`world()` was assembled field by field, so it carried `sets` but not `claims` —
the page answered "has this been asked for?" from a world with no requests in
it while the server answered from one that had them. That is the drift
`lib/rules.js` exists to prevent, and it happened TWICE in one afternoon. Both
sides call `SMPRules.worldOf()` from a state-shaped object now, so there is
nowhere left for them to differ.

**A row whose content does not fit its track does not wrap — it overflows.**
The request button needed 215px in a `.pick` grid track fixed at 90, and
rendered off the right edge of the page. No test saw it; one click that could
not land did.

**A state that cannot be reached by navigating is a state nothing measures.**
§41.5 again: the contrast sweep walks pages, so the Who enters page had to be
switched on explicitly and its picker opened explicitly, or neither would ever
have been measured. The sweep runs 25 pages and states now.

### 44.8 Scope, stated

Unit key objectives and unit key measures. **Capability projects — deliverables,
outcomes and milestones — are not assignable**, and were not in §16.7 either.

---

## 45 · Eight refinements, and what the measuring found — v3.15

Islam, 2026-08-22, working through the built product screen by screen. Eight
items, none of them a feature. What makes them worth a section is that half of
them turned out to be **a symptom of something with a cause**, and the causes
are the part worth keeping.

### 45.1 A key measure is a one-year number

*"in the direction plans the key measures are for 1 year only so remove the 3
years column."*

Done, **on the Plan page and nowhere else** — which is a distinction the page
names badly. A pillar's KEY MEASURES carry one target and it is this year's; a
unit's KEY OBJECTIVES carry two, this year's and the horizon, and they are a
different table on a different page. Three other places still show a
three-year column and all three are key objectives: the unit's Foundation, the
group's Temple, and slide 2 of the deck (where it reads *"By 2029"* once the
group has set its horizon). They were left, deliberately, and Islam was told
which they were.

`target3y` is **still stored** and still travels through import, export and the
archive. A column was removed, not a field: nothing a plan already carries is
lost, and an uploaded template that fills it is not rejected.

### 45.2 The pane stops repeating the rail

*"do we need this part since the information is already on the card on the
rail? and same question for the performance as well."*

No, and the rail card is the proof: it already carries the code, the name, the
counts and the owner, four inches to the left of a heading saying the same
three things. On Performance it was worse — the rail states the name, the score
AND the execution figure, and `scorePair` below states both scores again at the
size they deserve, so the heading was the third telling.

**Two exceptions, and they are the same rule: a pane with nothing naming it is
only acceptable while something else names it.**

1. A unit with ONE pillar has no rail. The heading stays there — removing it
   would leave a plan with nothing on the page saying which plan it is.
2. **Editing needs it back whatever the rail says.** The pillar's name is typed
   in that heading. Take the block away in edit mode and the name becomes
   uneditable — a removal that quietly deletes a capability is not a removal.

Which left the pen, and a small lesson with it: **a control that appears on
hover needs something to hover.** The pen lived on `.ptitle.hoverpen`, and
`.ptitle` is what went. It moves to the pane's own corner and the PANE becomes
the hover target — same language, different anchor.

### 45.3 The viewer switcher had been hidden from the only person it is for

*"for the demo view please leave for me the drop down at the top of the page
for view as to test things."* — followed, when asked what he actually saw, by
*"no it's now signed as and the name of the person."*

That is a bug, and it had been live since §33. `sync.js` decided who keeps the
switcher with:

```js
if (person.level !== "smo") { sel.hidden = true; ... }
```

`level` stopped existing when roles replaced levels. The server has returned
`role: "super"` ever since, so `undefined !== "smo"` was **true for
everybody** — the SMO saw "Signed in as …" and lost the simulation entirely,
on the deployed product only, which is why no file-opened test ever showed it.

**A comparison against a field nobody sets fails silently and in the safe
direction**, which is exactly why it survived a version: it locks down rather
than opens up, so nothing broke, nothing threw, and the sweep stayed green. A
rename that leaves a dead read behind is not caught by tests that assert what
is allowed; it is caught by somebody using the product.

### 45.4 A feature that renders nothing looks like a feature that was not built

*"please update the data with the note of Financy entry thing. where does this
note appear?"*

It appeared nowhere, because the demo dataset shipped with **no figure sets at
all** — and every surface §44 built renders nothing where there is nothing to
render. The worked example now carries ONE set, *Financial Figures* on Finance,
owned by the Head of Finance, and it claims **every figure whose target is in
EGP — 26 of them, across all ten units**. That is the argument the feature is
for, and it is the one §16.7a already found in the data: what separates a
team's number from the unit's is **what it is measured in**, not what it is
called.

`pick: "owner"` deliberately. The demo is where you show somebody that ticking
from the full list is reading every number in the group, and you cannot show
that with a set only the SMO can open. The client's own tenant still starts
with none and still defaults to the SMO.

Which exposed the thing worth recording. **`sets` live in `org.extra`, so they
are the one part of §44 the clean slate could not reach.** Migration 004 does
`DELETE FROM pillars`, which takes every `row.src` with the measures that
carried it — but it left the set itself standing, holding nothing and **owned
by a person the same migration had just deleted**. §21 says invented content
never enters the database, and this is the first time a feature has stored
something where §21's enforcement was not looking. 004 now clears `sets`,
`claims` and `naming`, and that is safe to add to a migration already recorded
as applied because **the only route into `org.extra` is the seed, the seed only
runs against an empty database, and 004 runs immediately after it**.

Answering the question he actually asked: the note appears in three places, all
on the reporting side — a chip naming the team beside a figure the unit may not
type, a highlighted note above the unit's report naming each outstanding figure
and who owes it, and the set owner's own *Figures I report* page.

### 45.5 A searchable dropdown, and why the native `<select>` stays

*"make all the drop downs beyond 5 items searchable, this might apply to any
selection list in the platform."*

It does, so it is not a control the Figure sets page owns: it is an
enhancement applied to every `<select>` in the platform once its list passes
five options. Below six, nothing changes at all — which is what lets it be
applied to everything without an inventory of what deserves it. Direction (2),
compile rule (3) and who-picks (2) are answered by looking; twenty-nine people
are not.

**The native `<select>` is not replaced, not moved, and not reparented — it is
hidden in place and a button is inserted in front of it.** Every existing
handler keeps working untouched: `data-setowner`, `data-prole-where`,
`[data-coflag]`, every `addEventListener("change")` `wire()` attaches, every
`sel.value` read. Choosing a name sets the select and fires a real `change`, so
the handler that saves it never learns there was a search box. **Rewiring the
controls that feed the access matrix in order to add a search box is not a
trade worth making.**

Three rules it had to obey, all of them already paid for elsewhere:

- **Typing never repaints** (§35). The filter hides rows in place.
- **The DOM is cleaned up before the change fires** (§30.1). Selecting an
  option repaints the whole panel, so the popup is closed and unhooked FIRST
  and nothing touches the DOM after.
- **Whoever hides a field hides its furniture** (§34). `sync.js` hides the
  viewer switcher by setting `hidden` on the select; the button follows it.

And one that is new: **the popup is `position:fixed`, and that is not a
preference.** `.cfg` is `overflow-x:auto`, which computes overflow-y to auto as
well, so an absolutely positioned popup inside a settings table is clipped by
its own table. Fixed positioning is the only kind that escapes an overflow
ancestor without having to know there was one.

### 45.6 The access table, and a colour emoji that could not be coloured

*"the design is poor, please remove all the descriptions from the headers and
just make it appear on hovering and make the icons of view and edit in place
and make the eye icon colorless like the pen."*

The eye was `&#128065;` — U+1F441, which every platform renders as a **colour
emoji**. Two faults follow from that one fact and both were on screen. A colour
emoji **ignores its element's `color`**, so a lit cell painted the glyph in the
emoji's own browns on a navy ground instead of inverting; and at emoji metrics
it **overhangs a 26×24 button**, which is why it appeared to sit below its box
rather than in it. The pen (`&#9998;`, U+270E) is a text glyph and behaved —
which is exactly why the pair looked mismatched. Two inline SVGs settle both:
they take `currentColor`, and the rule sizes them rather than a font nobody
chose.

The header notes are lists — *"Open, chase and close · Import · Archived plans
· Focus measures"* — and seven of them stacked under seven labels made the HEAD
of a 49-cell table taller than its body. They go to hover, which is the answer
the role column already reached in §37. With them gone the row padding could
come down too: the setup default is nine pixels top and bottom, written for
cells holding a sentence, and every cell here holds one 26px control.

The two essays under the table went to the knowledge base — *"Own is not a
setting"* and *"Three things are rules"*. **A setup page is where you change a
thing, not where it is explained** (§30). Reading them again to move them found
that `c_access`'s knowledge-base entry was **still written in levels**, which
§33 retired a version ago: *"a person is a level plus a unit"* was no longer
true of anything. Rewritten.

### 45.7 A list is as wide as its content

*"for the fill figure set table, make the table narrow fitting the content not
screen wide."*

A row on the fill page is a tick, a measure name, a target and one short
state — about 700px of content stretched across 1400, so **the tick you press
and the state it produces sat at opposite ends of the monitor**. Capped at
760px. The cap is on the LIST only: the pills, the "Filling" selector and the
unit buttons above it are page-wide furniture.

### 45.8 The diagnosis was half right, and measuring said so

*"for the people table rows are very high let's see how to make it a normal
table height and I can't find the passwrod reset functions."*

The role chips were the obvious culprit and they were **not the cause of the
typical row**. Compacting them took the tallest rows from 89px to 69px and left
the median at 61 — which is the number that matters, because there are 31 rows
and only three of them hold three roles.

Measuring cell by cell found three small things, all paid on **all** 31 rows:

1. 18px of the setup table's own padding. The register is a LIST — you scan it
   for a name — which is a different reading act from the settings tables that
   padding was written for.
2. A Person cell spending two lines on a name and a key. `loghead` is seven
   characters and it cost every row 17px to put it on a line of its own.
3. A Standing cell whose pill and "View as" link **wrapped** inside a 10%
   column.

61px → 41px, and 89 → 63. The lesson is the method rather than the numbers:
**the obvious cause explained the worst row and none of the ordinary ones**,
and only measuring every cell of an ordinary row said so.

The password reset was not missing. **Credentials are not in the state graph
and never will be** (§19), so the Password column is filled by a separate ask
and simply absent when the platform is opened from a file — which is where he
was looking. Nothing to fix; worth stating plainly, because "the column is not
there" and "the feature is not built" look identical from the outside.

### 45.9 A scratch file that looked like data

Claiming the money figures touched `src/new-units.js` as well — until the
claims did not show up and the count came back 26 rather than 44.
**`new-units.js` is not in `build.py`.** The four units it describes really
live in `group-data.js:737`; the file is a leftover from when they were being
drafted, and it has not been built into anything since it was committed.
Reverted rather than kept in step, because §24's rule reads the same from this
side: **a file that is not built is not the product, and editing it as though
it were is how a source of truth acquires a second copy.**

### 45.10 What was verified, and how

Not by reasoning. Every item was driven in headless Chromium against the built
file:

- Plan and Performance panes: `.ptitle` count 0 where a rail exists, the pen
  present, the measure headers read `# · Measure · Dir. · Target · Compiled`.
- The access table: no `.factor-h`, no emoji left in the grid, and every SVG
  measured **inside** its button's rectangle rather than assumed to be.
- The searchable picker: opened, filtered to one row on "yara", clicked, and
  `GROUP.sets[0].owner` read back as `fn_mkt` — the proof that the native
  select really did receive the change.
- The demo set: Nigeria's report shows *"1 figure is entered by another team"*
  naming Finance and Hossam; Mobile's shows the chip and no note, because all
  four of its claimed figures are in.
- People rows: measured before and after, in the same page, by injecting the
  old rule.
- A fresh Postgres 16, seeded and clean-slated: `org.extra` holds no `sets`,
  no `claims`, no `naming`, and no unit row carries a `src`.

`qa.py` walks 31 viewers with no console errors. The contrast sweep reports
**0 failing runs across 4 combinations × 25 pages and states**.
`test-authorize.js` passes 114. `test-roundtrip.js` passes clean slate, round
trip, fixed point and archived plan.

---

## 46 · Setup becomes a place, and four things drawn before they were built — v3.16

Islam, working through v3.15 screen by screen a second time. Four of the five
items were settled from a **mockup** rather than from a description
(`mockups/2026-08-22_five-questions_PENDING.html`), which is the part of the
method worth keeping: two of the options in it were killed by being drawn, and
one of them was mine.

### 46.1 Ten setup tabs become a grouped rail

*"let's think of some sort of grouping for the settup tabs. and an easier view
for it. maybe a collapsable rail on the left for easier navigation think with
me."*

Three moves, in order, and the first one halves the problem before any design
happens. **The gear menu was doing two unrelated jobs**: six of its entries are
things you DO inside a cycle — open it, chase it, import a plan, mark focus
measures — and ten are things you SET ONCE and revisit rarely. They shared a
list because they arrived one at a time, not because they belong together.

**A rail is not a new component.** It is `.rail` inside `.split`, which is what
a unit's pillars have sat in since 1.7. That is most of the argument: Setup
stops looking like a settings screen bolted onto the side of the product and
starts looking like the rest of it. A row of tabs would have been a new thing
to design and would have run out of room at ten.

**The groups are the QUESTION YOU CAME TO ANSWER**, not which table the page
edits — group by table and you get the same flat row with headings over it.
*Who* (People, Roles & access) · *What we run* (Business units, Companies,
Supporting functions, Capabilities) · *How it's measured* (Figure sets, Scoring
bands, Labels) · *How it looks* (Branding). Four groups, two to four each,
every page in exactly one.

**The icon strip was killed by its own mockup**, and it was my suggestion to
draw it. Ten setup pages need ten icons, and a label, a scoring band and a
figure set are three abstractions with no picture anybody guesses right. It was
drawn collapsed specifically so it could be seen failing. **A collapse that
hides the only thing identifying the page is a control you have to learn.**

Consequences that had to follow, or the change would have been half made:
**the tab row is emptied AND hidden** for Setup (an empty `<nav>` still spends
its border), and **the gear menu offers Setup as ONE entry** rather than ten.
Listing the pages in the menu and in the rail is stating the navigation twice —
the fault the chrome shed in 2.9.

### 46.2 Configuring a set and filling one are two halves of one page

Two Setup pages became one with two sections, using the section row Strategy
already has. The trick is in the gating and it is worth stating plainly:
**the parent entry is gated on `c_source`, not on `c_sets`.** `c_source` is
`area:"always"`, so the entry is reachable and the SECTIONS decide what is
inside it — the SMO gets both, a set owner who is not the SMO gets only *Fill*,
and anybody else gets no entry at all. Gate the parent on `c_sets` and the set
owner loses the page they exist for.

A Setup page's sections render **inside its own pane**, not in the chrome's
third row: that row spans the window, and the pane starts 236px in beside the
rail, so a row of section tabs up there would be pointing at a page it does not
sit above.

### 46.3 The pillar name comes back wearing the rail's own mark

*"we will need the title of the pillar here you were right. we need to bring it
back but with a better condensed design … would be better if the line is
highlighted maybe grey."*

He was right and so was the original instinct: the rail says which pillar is
SELECTED, but by the time you have scrolled to the tactics table the rail is
off-screen and nothing on the page says what you are reading.

Three greys were drawn and they are not one idea wearing different borders.
**B1 bleeds to the pane's edge** and becomes a pane header — which puts a grey
band 40px above the navy table head on a page whose job is a table. **B2 is an
inset bordered strip** — a box inside a box, and the platform only draws those
for things you can press. **B3 took the rail's own mark**: `--surface-2` with a
3px gold left edge, to the pixel what `.ritem.on` already wears. Islam chose B3.
**The two halves of the screen say "this one" in one language rather than two**,
and nothing was invented.

Two things fell out of building it:

**A colour that clears on white is not thereby cleared.** `--gold-deep` on
`--surface-2` measures **4.45:1** — under by five hundredths. §38.5 for the
fourth time: a surface with its own ground needs its own ink. The code takes
`--stone`, which is also the better answer on §41's accent budget: the gold edge
is the mark, and a gold code beside it would be a second one.

**The code shown is DERIVED; the code stored is an IDENTIFIER.** Putting the
code back on the Plan page put the two side by side for the first time, and
they disagreed — the Plan rail printed `it.code` ("01", what Mobile's plan
arrived with) while every other surface derives `codePrefix + position` and
prints "MB01". One tab of a unit called a pillar 01 and the next called it
MB01. The DISPLAY moved to `pillarCode()`; the data attribute did not, because
`data-urail` is the rail's selection key and `unitRailPick()` matches on
`it.code`.

### 46.4 The register: columns that fit, and one menu at the end of the row

*"the first column of the name needs to wrap around the name length … the roles
can be cut to fit a certain column size and appear more on hovering … for
password it should show the status only and we have a vertical 3 dots at the end
of row on the right with the actions like reset password."*

**"Wrap around the name length" means the column fits the name, not that the
name is broken to fit the column** — and reading it the other way first is what
produced 59px rows. `.cfg table` is `table-layout:fixed` with percentage
widths, right for a settings table of equal cells and wrong for a register,
where the answer is as long as the person's name happens to be. Auto layout,
content-sized columns, one line each: **79px → 39px, and every row the same
height.**

Getting there cost three specificity lessons in one file, which is worth
recording as one rule: **a class alone rarely wins against `.cfg table`.**
`.peoplecfg` (0,1,0) lost to `.cfg table` (0,1,1); `.cfg table.peoplecfg`
(0,2,1) then TIED with `.cfg table.unitcfg` in `arrange.css`, which
`build.py` concatenates later — and an equal specificity loses on source
order. The register carries both classes, so the override names both.

**`width:99%; max-width:0` is a FIXED-layout trick.** Under auto layout
`max-width:0` is not a hint, it is a cap, and the roles column collapsed to
17px. A cell in an auto table cannot be told "take the remainder and truncate";
a block inside it can, so the clip moved into a `.rolebox`.

**The kebab fixes more than the height it saves.** Every per-person action used
to need a column: that is how Password came to be 150px wide to hold one word
and one link, and how *View as* ended up duplicating the switcher in the top
bar. A menu is where the next one goes too.

And the menu is **`position:fixed`**, for the same reason the searchable
dropdown's popup is (§45.5). The first attempt turned the container's overflow
OFF so the menu would not be clipped — which also turned off the container's
SCROLLING, and the actions column landed at x=1780 on a 1500px screen with no
way to reach it. **Fixed positioning is the only kind that escapes an overflow
ancestor.**

**The chip names the place only when it is not the person's own.** Islam, on
Hossam's row: *"we don't need finance again. it's Function Head"* — and then,
unprompted, the better answer: *"we can add the unit/function they belong to and
the strategy custodian is more of a role right?"* Right, and it resolves what
was otherwise a real loss: dropping the attachment everywhere drops the half
that decides access, because *Strategy custodian* says nothing about whose plan
they may change. With **Belongs to** as its own column the ordinary case is
already said, so the chip repeats it only when the role reaches somewhere the
person does not sit. The full *role · where* is always on the hover.

It was written as a comparison of two LABELS first, and every group-level role
read as "elsewhere" because one function said "The group" and the other said
"the group". **Two renderings of one fact will always find a way to disagree;
compare the fact.** It compares attachment keys now.

Also: the register's first row was literally named *Strategy Management
Office*. It is a seat, not a person, and a register whose first row is an office
teaches everyone reading it that these rows are job boxes. Renamed; the KEY is
untouched, because it is the username and the clean slate keeps the row by it.

### 46.5 Filling a set is a flat searchable table

*"make the tables searchable not categorized by direction like this … we can
have the table for all units as a default so we have the unit as a column that
can be filtered by … accordingly the units names at the top are not usable."*

**THE TWO JOBS WANT OPPOSITE SHAPES.** Reading a unit's plan is done in plan
order, one unit at a time, which is why the plan pages group by pillar. Filling
a set is the other job entirely: you are hunting for the eleven revenue lines
among a hundred and sixteen figures, and pillar order actively HIDES them from
each other. Flat and filtered puts every "revenue" in the group on one screen,
which is what a set crossing ten units is for.

**Measure and Target are separate columns**, deliberately: they were one visual
blob, and a search over the blob matches `4B EGP` when you type a name. **Key
objectives join through an `In` column** reading either a pillar code or the
words *Key objective*. **The `#` column numbers what is SHOWN**, so "11 of 116"
is a countable claim rather than a rendered one.

**Typing never repaints** (§35) — the search hides rows in place, renumbering
and retallying as it goes; the dropdowns do repaint, because they change which
rows exist. And **the row carries its own unit now**: the tick used to read the
unit from page state, which was safe only while the page showed one unit at a
time.

### 46.6 Two collective password actions, and why they are not one

*"we need the collective action list of password reset for all or for people
without set passwords."*

Two, and the second is not the first with a wider `WHERE`. **The first can lock
nobody out** — it reaches only people who have never had a password, so the
worst it can do is hand a way in to somebody who had none. **The second is a
reset**: it overwrites passwords people are using, so it ends their sessions
(a reset that leaves the target signed in is not a reset) and it is confirmed
before it is typed.

**It excludes the person asking, on the server.** §43 learned once that being
signed out of the tab you are working in is a bug that looks like security;
here it is worse — mistype the shared password while resetting everybody and
the SMO has locked themselves out of their own deployment with no second SMO to
ask. Retired people are excluded from both, because §35 turns them away at the
door with the correct password.

**The server picks the set, both times.** The screen sends a password and a
scope, never a list of keys, so a stale screen can only ever issue to fewer
people than it thinks.

### 46.7 The bug the sweep found, and the one the sweep hid

**An empty array is truthy.** `if (secs)` walked straight into `secs[0].k` for
any viewer whose every section was refused — which, once Figure sets was gated
on an `area:"always"` key, meant the group CEO crashed the page by opening
Setup. The real fault was upstream: paint() filtered out defs with nothing to
render, found the list empty, and **fell back to the unfiltered list**, putting
back exactly the defs it had just ruled out. Nothing to render is a real
answer, and the page now says so in words. The reachability test is ONE
function used by both the menu and paint(), because the two asked the same
question differently and disagreed for exactly one viewer.

**And the sweep itself had to move.** It clicked ten `[data-md="setup"]` menu
entries that no longer exist — 30 seconds of Playwright timeout each, forty
dead clicks, and it never finished. It walks the rail now, and opens each Setup
page's sections explicitly: §41.5 again, **a state that cannot be reached by
navigating is a state nothing measures.**

---

## 47 · The register's controls, and a rail that gets out of the way — v3.17

Islam pointed at the HR ERP for the password reset and the filters: *"check the
password reset design in the people erp repo and check the page search and
filters and let's see what is a good practice we had there to match."* So this
section is partly a port, and the parts worth recording are where the two
products agree for the same reason.

### 47.1 Which columns the register shows

*"add a columns filter to mark what to show of the columns and make the contact
unchecked by default."*

HR_ERP's employees grid has exactly this — a `Columns ▾` popover, last in the
filter row, with `All · None` and one tick per column, and `name` marked
non-hideable. The same three decisions land here for the same reasons.

**It is a property of the SCREEN, never of the state graph.** §25 settled this
for the theme: autosaving it would decide for everyone in the tenant what THEY
see. localStorage, per browser. (HR_ERP goes one better and also saves to the
account so it follows a person between devices; SMP has nowhere to put that
yet, and localStorage is the honest half.)

**The saved map is MERGED with the defaults, never substituted.** A column
added later is not in a map written before it existed, and reading a missing
key as `false` would hide every new column from everybody who had ever opened
the chooser. That is §30.2 — an absent key means "not answered yet", not
"denied" — one surface further out.

**Person is not in the list.** A register with the names hidden is not a
register. HR_ERP reaches the same answer by marking `name` non-hideable rather
than by trusting nobody to untick it.

Also gone, at Islam's direction: *"Never decides access"* under the Job title
header. It is a note about the MODEL sitting on a column header, and §30 put
the model in the knowledge base.

And the roles column now shows **one chip, then a "…"**. Most people hold one
role; five hold more, and sizing all thirty-one rows for those five made this
the widest column on the page. **The overflow is a CONTROL, not a hover** — a
hover cannot be reached on a touch screen, cannot be read aloud, and this is
the only place the second role appears.

### 47.2 The actions go to the top right

HR_ERP's registry header is an action cluster — `CSV ▾` · `Passwords ▾` ·
`+ New employee` — beside the title, with each menu item a **title over a line
of description** and the destructive one under a divider in red. SMP's
`cfgHead` gained an `extra` slot so that shape is available to any Setup page
rather than each one inventing a place for its own controls.

**THE ACTION FIRES BEFORE THE MENU CLOSES.** HR_ERP's `runAndClose` carries a
comment about a shipped-but-dead bulk password action; SMP's own CLAUDE.md
records the same fault from the React side ("never close a menu from a submit
button's onClick — the form unmounts before the browser dispatches submit").
Two codebases, two frameworks, one bug. It is written down in both.

**Every exit repaints, including the cancelled ones.** The first version set
`PWMENU = false` at the top of the handler and repainted only on success — so
pressing Cancel left the panel on screen with the state already saying it was
closed, and the next unrelated repaint would make it vanish. **State and screen
diverge in exactly the paths nobody tests.**

### 47.3 The rail collapses; it was already sticky

*"the side panel needs to be collapsable and it needs to be sticky."*

Sticky it already was — `.rail` has carried `position:sticky` since 1.7 and the
setup rail inherits it; measured, it pins under the chrome and holds. What it
could not do is get out of the way, and the register is nine columns wide in
the 880px the rail leaves.

**COLLAPSED IS A HANDLE, NOT AN ICON RAIL**, and this is where the port stops.
HR_ERP collapses its sidebar to 64px of icons and that works there, because its
destinations are Employees, Directory, Time off — things with pictures. Ours
are Labels, Scoring bands, Figure sets, and §46.1 already drew that failing.
What makes a 36px handle enough is that **the pane already names the page**:
every Setup page opens with its own title, so collapsing costs navigation
rather than orientation, and one click brings it back. The mechanics are
HR_ERP's, because they are the house pattern — a grid column swap on the
container, the toggle inside the panel's own head rather than in the page, and
the preference in localStorage.

### 47.4 Four things the pages themselves needed

**The Report page gets the same pillar band** as Plan and Performance. It was
left behind when those two changed in §46.3 — a 19px heading over a meta line,
the shape they shed. Its counts and its tally move to the band's right end. And
`p.kind` goes with it: `SHOW_KIND` has been false since 3.4, every other
surface honours it, and this was the last place in the product still printing
"Direction".

**No note under a pillar.** Mobile's first pillar carried *"End-state: unified
market intelligence engine"* and the other nine units carried nothing — so the
line was not a feature of the page, it was **one unit's plan having a field the
rest left empty**, and a layout that shifted depending on which pillar you
picked. It stays editable while a plan is being corrected, because a page that
cannot show a field also cannot fix it.

**Picking a new pillar puts you at the top of it.** The rail is sticky, so it
is still under the cursor after a long scroll down the tactics table — you pick
the next pillar and land halfway down a table you have not read. `scrollTo(0,0)`
is the wrong fix: it throws away the rail's pinned position and puts the page
header back on screen. It scrolls to the SPLIT's own offset less the chrome and
the rail gap — **the same two numbers the rail's sticky offset is built from**,
read from the same custom properties, so the pane's top lands exactly where the
rail's does. And only ever upwards.

**A bug a long name exposed.** The searchable dropdown's label was appended as
a bare TEXT NODE, so `.ssbtn > :first-child` — the rule written to truncate
it — matched the CARET, because `:first-child` selects the first ELEMENT child
and a text node is not one. The label therefore had no `white-space:nowrap` and
the button WRAPPED. **A selector that matches something, just not the thing it
was written for, fails silently in both directions**: nothing looked broken
until the SMO's name went from "Strategy Management Office" to "Mohamed Essam —
Head of the Strategy Management Office" inside a 150px control.

### 47.5 Cleaning the user-facing prose

*"we need to clean any unneded notes or explanations from the user interface …
I'm fine for now for the setup and manage pages but the user facing needs
cleaning."*

Measured rather than guessed: every one of the thirteen user-facing pages was
driven and every visible line of prose pulled out, excluding drill-down modals
(where an explanation is exactly what you opened it for). **Nine of thirteen
were already clean** — both Foundations, SWOT, Plan, Temple, unit Performance
and both function pages had nothing.

One line was plainly wrong and is gone outright: Weighting carried *"Factors
are stored as rows, not as fixed columns, so adding one is data entry rather
than a schema change."* **That is a sentence about the database, rendering on a
page a group CEO opens.**

Three others kept their first half and lost their second, because in each case
the first sentence states a fact or an action and the second is an aphorism:
the group's variance line lost *"Read as a share of plan, not of the whole
year"*, the focus board lost *"beside the target and the history that inform
the decision"*, and the Report's blocked-submit warning lost *"a red number
with nothing beside it is where a review meeting stalls"*. The warning still
says why Submit is blocked, which is the part that had to survive.

**The test worth keeping is the one that found them**: drive the pages and read
what is actually on screen. Grepping the source finds the conditional empty
states too, and those are not noise — they are the page explaining why it is
empty.

### 47.6 Units | Functions becomes a switch

*"one button as a switch between both and the one that is selected is
highlighted … for better usability."*

The control has looked like one segmented box since §41.8, but it behaved as
two independent folds with a **third state — both closed**. That state is what
made it a pair of folds rather than a switch, and dropping it is the whole
change: the row always shows one list, the lit half always says which, and
pressing the lit side now does nothing rather than emptying the row. **Nobody
was choosing "neither" on purpose**; they were closing the one they had opened.

Two things followed. **The disclosure arrow had to go** — a ▸/▾ twist promises
"this opens and closes", and `aria-expanded` says the same to a screen reader;
both became `aria-pressed` and no arrow. And **a switch cannot rest on a side
with nothing behind it**: a viewer holding functions but no units is moved to
the side that has something, or they would face an empty list with no clue that
the other half was full.

### 47.7 Setup and Manage become one page

*"I guess we can combine both into the new page we made for the setup with the
grouping of the pages and in the rail we can make the grouping collapsable."*

The split was made in §46.1 and it was right **about the menu**: sixteen flat
entries doing two jobs. But the rail with groups already solves that, so
keeping two doors behind one gear became the odd part. Five groups now, and
**Running the cycle comes first** because it is what anybody opens most.

Three consequences, each of which had to be built or the merge would be half
done:

**The gear stops being a menu.** With one destination behind it, a menu holding
one item is a door behind a door — which §32 removed once already at the gate.
The gear IS the door now, and that removes an interaction rather than adding
one. `MENU_OPEN`, the panel markup, its group bands and its CSS all went with
it (§24, and §41.9's reason: a stylesheet left behind is how a later mockup
draws a control the product does not have).

**It lands on the PRIMARY page, not the first one in the array.** Landing on
"whatever happens to be first" put the gear on the knowledge base — true of the
list, wrong for the person pressing it.

**A group folds, but never the one you are in.** A rail that can hide the row
it is pointing at is a rail that lies about where you are, so the stored
preference is overridden for the current group.

And the sweeps had to move again. Both `qa.py` and the contrast sweep clicked
`[data-md="manage"][data-ms=…]` entries that no longer exist; they walk the
rail now and **unfold every group first**, because a folded group hides its
rows and a page nothing clicks is a page nothing tests. §41.5, third time.

### 47.8 Opening a cycle asks what it is

*"on opening the cycle it didn't ask me any questions. when a cycle opens I
believe we should set the name of the cycle and the duration it covers."*

It minted `{ name:"Cycle 3", from:<last cycle's end>, to:"", due:"",
endsQuarter:4 }` and opened it — a name nobody chose, a period half filled from
a guess, and a hard-coded end quarter. **That last one is not cosmetic:
`endsQuarter` decides which tactics count as DUE**, so a wrong guess silently
changes every unit's execution score. It is asked for now, with the reason
printed under the field.

An inline panel rather than a modal, because what you are about to replace —
the cycle above it — should stay on screen while you describe its successor.
And **nothing touches `REVIEW` until Open is pressed**: a half-filled form would
otherwise have already closed the cycle it was going to succeed. The name is
the one field that blocks, because it is what every snapshot, delta and
archived plan is filed under and nothing can derive it.

The fields listen on `input` rather than `change`: a change event does not fire
until blur, so pressing Open straight from a field would read the value from
before the last thing typed.

### 47.9 Two small ones from the same pass

**The Report page kept the old pillar header** when Plan and Performance took
the band in §46.3 — and it was also the last place in the product still
printing `p.kind` ("Direction"), which `SHOW_KIND` has hidden since 3.4.

**No note under a pillar.** Mobile's first pillar carried *"End-state: unified
market intelligence engine"* and the other nine units carried nothing, so the
line was not a feature of the page — it was one unit's plan having a field the
rest left empty, and a layout that shifted depending on which pillar you
picked. Still editable while correcting a plan, because a page that cannot show
a field also cannot fix it.

**Picking a new pillar puts you at the top of it.** The rail is sticky, so it
is still under the cursor after a long scroll — you picked the next pillar and
landed halfway down a table you had not read. `scrollTo(0,0)` is the wrong fix:
it throws away the rail's pinned position. It scrolls to the SPLIT's offset
less the chrome and the rail gap, **the same two numbers the rail's own sticky
offset is built from**, and only ever upwards.

---

## 48 · The due diligence — what walking every scenario found

Islam, after the register's controls landed: *"do a due diligence on all the
user scenarios that they might go through and identify if any scenario is
bugged or blocked or has an issue, check if there is any inconsistency in the
flow or gaps and the accessibility."*

Thirty-one viewers were signed in and walked, not reasoned about. The method is
the finding: **every fault below was invisible to static reading and to twelve
versions of green sweeps**, because each one failed silently and in the safe
direction.

### 48.1 A comparison against a field nobody sets, for the third time

`arrange.js` asked `v.level === "smo"` and `v.level === "n1"`. `level` was
deleted in §33 when roles replaced it, so both branches were false for all
thirty-one people and **177 lines of pointer drag-and-drop have been dead code
ever since**. Nothing threw. `sync.js` hid the viewer switcher from the SMO the
same way (§45.3), and `canReport()` was a hard-coded level test before §42.

**THE RULE, earned three times: after renaming a field, grep the OLD name
across every source, including the ones the change was not about.** A stale
comparison locks down rather than opening up — so no error is raised, no sweep
goes red, and the feature simply is not there.

Restated in roles and asked through `grantAt()`, so the access matrix stays the
single answer: the SMO anywhere, and within a unit whoever may edit its plan.

### 48.2 Import was the only Setup page with no access check at all

`a_cycle` defaults to `view` for every role and the rail gated on "not none", so
a contributor, a unit owner, a custodian and a company CEO all carried Import —
could apply a file, read "Applied to Mobile. 3 figures updated", and then have
the server refuse the save. **The "SMO only" pill the page printed was
decoration.**

Gated in three places on purpose, because each protects something different:
the rail's `when` decides whether the ROW is drawn, `renderImport()` decides
whether the PAGE renders (a destination can be reached with a stale
`currentSub` after a role changes under the viewer), and the apply handler
decides whether the FILE IS APPLIED — which matters most, because applying a
plan archives and replaces a whole unit's plan in memory before any save is
attempted.

### 48.3 The modal was not modal, and the menus dropped focus

Four faults of one shape. The modal announced `aria-modal` and behaved like a
panel: one Tab left it into a page that was neither `inert` nor
`aria-hidden`; Escape dropped focus to `<body>`; and while CLOSED it stayed
tabbable and in the accessibility tree, so every screen carried a stray Close
button and a permanently announced empty dialog — **§3.2's `opacity:0` lesson
arriving in a different tree**. The row menu and both header menus opened
without taking focus and closed without giving it back.

Focus is moved AFTER the paint that creates the control, because focusing a
node the paint is about to replace focuses nothing; and the return target is
looked up by data attribute rather than held as a node, because a repaint may
have replaced the button.

### 48.4 The cheap accessibility set — five edits, five real findings

`<html lang>` (the build emitted **no `<html>` tag at all**, so 22 of 22 page
states failed); a `<main>` landmark and a skip link, first in the tab order and
visible only on focus, because the navigation runs to twenty entries; names on
the eight Capabilities selects, the focus-measure unit picker and the file
input; and **a `--focus` token per palette, because `--gold` measures 2.40:1 on
white and a focus ring needs 3:1** — it cleared on the navy bar at 5.32 and
failed on every light surface, which is most of the product.

### 48.5 Three from the journey walk

**The Focus board sent people to a control that does not exist** — "press Mark
focus on the unit's Performance page". There is no such button for any viewer;
marking moved to Setup, and `focusStrip()`'s own comment thirty lines up says
so. The page and the comment beside it disagreed and the page was wrong.

**A file that fails to read now says why.** `impFail()` wrote the reason into
`IMP.check`, but `checkBlock` only rendered inside `step3`, and `step3` only
exists when there is a summary or a diff — so the one case where the message
matters most had nowhere to render. Upload the wrong template and the page did
not move. **The sentence existed the whole time.**

**A row's action menu closes when its action fires** (§47.2), cleared AFTER the
action and never before.

---

## 49 · The four the audit could not fix without asking

The last four findings each changed behaviour or destroyed data, so they were
put to Islam with a proposal and a cost apiece. *"all 4 are good go."*

### 49.1 A new cycle asks again — because it now clears

Opening a cycle replaced the name, the dates and the deadline and **left every
actual, progress mark, tactic status and note exactly where the last cycle left
them**. 163 of 184 items read "reported" the second it opened, a unit head could
press Submit without touching a field, and the page's own copy already claimed
the new cycle "asks every unit again".

**Clearing alone was not the fix.** `HISTORY` keeps a SCORE per unit and never
the raw figures, so a clear with nothing behind it destroys the closed cycle's
numbers. Opening ARCHIVES first — the same act an import performs on a plan it
replaces, with the same Restore — and the confirmation says how many figures
and notes are about to go.

**The snapshot is keyed BY ID, never cloned by position.** A plan may be edited
between the close and the restore, and a positional snapshot would then put last
cycle's number against a different measure. An id that is no longer there is
dropped on the way back in.

Two consequences worth recording. **A capability is ONE object** — the group's
headline pair (`perf`/`exec`) and the function's own reporting hang off the same
record — so both are taken in one pass rather than two that could disagree.
And **notes are cleared with the figures they explain**, or the new cycle opens
with last cycle's explanation sitting under a blank number.

The archive gets **its own column** rather than reusing `plan`: a plan archive
holds no figures and a figures archive holds no plan, and one column carrying
either depending on `kind` is a lie the next reader has to discover.

Open remains `a_cycle` edit, which defaults to the SMO alone. A tenant that
grants it wider will find the SERVER refusing the figure clears (§42) — the
correct direction, and not something to loosen without a decision.

### 49.2 Clearing a plan is the same act as replacing one

An **import** that replaced a plan archived the outgoing one and offered a
Restore; **Clear plan** destroyed the identical thing with no archive and no
undo. Two routes to the same outcome, one of them reversible.

`clearUnitPlan()` and `clearCapability(c, "plan")` archive on the way out now
and RETURN the archive, so the import path takes one rather than two — it used
to call `archiveUnitPlan()` itself and then call a clear that (once fixed)
archived again. The reason is threaded through as a word, so the list says how a
plan left rather than only that it did: *cleared*, or *replaced by an upload*.

### 49.3 A company gets a life

The Companies page offered two visibility dropdowns per company and nothing
else: no add, no rename, no retire, and **no `addCompany` anywhere in the
product**. Every other Setup table has had all three since 1.7.

**Retired, never deleted**, and for the reason a unit is: a company key is
written into every company CEO's role as `co:<key>` and into `units.company`, so
a deleted row leaves a pointer at nothing. Retiring is **REFUSED while any unit
still belongs**, and the cell says how many rather than going quiet about why
there is no button — quietly orphaning a unit into "its own company" behind the
SMO's back is the failure this prevents.

A retired company is not offered as a destination in the unit picker, and not
offered as a seat in the role picker; a unit already in one still shows it,
marked, because hiding it would silently read as "its own company".

**A correction to the finding as first written.** It claimed a real tenant
*inherits* Distribution and B2C from the demo. It does — and **deliberately**:
§21's clean slate keeps the companies for the same reason it keeps the ten
business units and the supporting functions, and v2.6 recorded both companies as
real. Migration 004 is unchanged. The gap was the missing controls, and with a
rename in place they are no longer stuck.

### 49.4 Retiring remembers what it took

Retiring revokes every role (§35, and right). **Restoring gave none of it
back**, so a Strategy custodian who was retired and brought back returned as a
Contributor of their unit, and nobody was told.

Retiring stores what it revoked; restoring names it and asks. **A seat somebody
else has taken up meanwhile is named and NOT offered** — restoring one person
must never quietly unseat another. `contrib` is not stored, because it is not
granted: it is read off `p.unit`, which retiring leaves alone, so it comes back
by itself, and storing it would make the list say a role was returned that was
never taken.

**A second correction, and the reason to measure first.** The finding also
proposed deleting `lib/rules.js`'s last line — *a person attached to a unit and
holding nothing else is a Contributor of it* — as a role nobody granted.
Measured against the tenant, **two real people resolve through it and nothing
else**, and it is not an invention: it is the definition of Contributor. It
stays. The demotion was real; its cause was the restore, not the fallback.

`roleWhereLabel()` came out of `renderPeople()` in the same pass, because the
restore dialog needed to name where a role was held and a second copy of that
function is exactly the drift `lib/rules.js` exists to prevent.
