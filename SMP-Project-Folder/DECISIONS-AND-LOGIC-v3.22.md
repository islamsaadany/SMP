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

### 16.16 The horizon belongs to a plan, not to the group

*(Islam, 2026-08-23: "for the By in this strategy it's all 2027 but it needs to
be set from somewhere in the plans later." Recorded on arrival, per A8.)*

`GROUP.horizon` is ONE value for the whole tenant, and it is what every
"by &lt;year&gt;" on screen reads from (§23.5). The plan template already
carries a Horizon row on its Aspiration sheet — and the import writes it
**straight to the group's value**, so uploading one unit's plan with a
different year silently moves the year every OTHER unit is read against. A
blank is safe, because it keeps what is there; a different value is not.

Today that is invisible because every unit's plan carries the same year. It
stops being invisible the moment two units plan to different horizons, which
is the situation Islam is describing.

**Not designed.** The open question is whether a horizon belongs to the unit,
to the plan (so an archived plan keeps the year it was written against), or
stays the group's with the per-unit value an override. It touches the import,
the archive and every surface that prints a year, so it is its own piece of
work rather than a field added quietly.

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

---

## 52 · The client's own mark on the door

*Written as §51 and renumbered on the way to main. **A number can be spent in
code before it is spent in this log**: the capability-parity and Manage slides
work reached main referencing §51 through §51.11 in its commits and its source
comments while this log still ended at §50, so the log said the number was free
and eleven files said it was taken — and the two merged CLEANLY, because
nothing textually collided. That is the worst way for a collision to arrive.
Renumbered mine rather than theirs, because a number already in shipped source
comments is the harder one to move. **§51 was written up shortly afterwards**,
in the v3.19 rename of this file, so the gap closed on its own; what is worth
keeping is that for a few hours the contract and the code disagreed and no tool
could have told you.*

Islam, looking at the gate: *"in the login page I need to have the client's
logo somewhere."* Small ask, and every part of it turned out to be a decision.

### 52.1 The mark goes on the CARD, not on the wall

The gate is a split door since §34: a navy wall arguing the product's case, and
a glass card floating on a pale field. Forefront's temple mark sits top-left of
the wall. There were four places a client's mark could go and only one survives
the arguments.

**The person at this door works for the client.** They are signing in to *their*
strategy, not into a consulting product — so the tenant's mark belongs on the
thing they touch, and Forefront's belongs on the wall that explains the product.
Put both on the wall and they compete for one corner.

And the decider, which is a measurement rather than a preference: **below 980px
the wall is gone entirely** (§34), and the card is the whole page. A mark on the
wall is a mark that vanishes on every phone. A mark on the card is on every
screen there is.

It is on **both** cards — signing in, and choosing your own password — because
they are two doors into the same tenant. One `<symbol>`, referenced twice,
never written twice.

### 52.2 The file you are handed is not the asset

Two JPEGs arrived over WhatsApp, 633×81, one black and one reversed. Neither is
usable and the reason is not fussiness: **a JPEG has no alpha**, so the black
one carries an opaque `#D9D9D9` ground and the reversed one `#F6F6F6` — the
white lockup on a near-white rectangle, invisible, and either one dropped on the
card paints a grey box around itself.

What made it recoverable is that the client also sent their **brand identity
manual**, and page 24 draws the lockup as vector artwork. So the asset is
extracted from the client's own drawing rather than traced from a screenshot,
and the colours are read off the paths — `#282E76` and `#3A67B1` — rather than
sampled from a picture of them.

**The manual draws every lockup over a construction grid**, `#CDDDF0`, and the
grid is not the mark. Filtering it out is one line; noticing it is the work.

### 52.3 A `<use>` clones into a SHADOW TREE

One definition, two references, and the fill themed by the page's tokens — so
`.clientmark .mk { fill: var(--client-mark) }`. It styled **nothing**. A `<use>`
clones its target into a shadow tree that a document selector cannot reach.

**Custom properties DO cross that boundary**, so the fill is declared inline
inside the symbol and the tokens still decide it. The rule to keep: *a selector
stops at the shadow boundary; an inherited property does not.*

Caught only by screenshotting the result. It would have shipped as a black
lockup in dark mode, on a near-black card.

### 52.4 A HEIGHT IS NOT A WIDTH, and the wall and the card are gated differently

The mark cost the card about 70px. At **1024×560** that was enough to push the
page 20px past the fold and grow a scrollbar — which is *exactly* §35.4, where
the wall's quote fell below the fold on a short laptop and no width query could
see it. The file already carries a `@media (max-height: 700px)` block for that.

Putting the condensed values in that block fixed 1024×560 and left 461–980px
wide and short still broken — because that block is written
`(max-height: 700px) and (min-width: 981px)`, and the `min-width` is there for
the **wall**, which only exists above 980.

**THE WALL IS GATED ON WIDTH. THE CARD IS NOT.** Anything that condenses the
card needs its own block with no width condition — placed last, so that on a
screen both short and narrow the *shorter* answer wins on source order.

Swept 22 sizes in both themes. Three stacked-layout sizes still scroll by
24–64px and are recorded rather than hidden: two of the three already did before
this change, and what falls below the fold is the copyright line, never a
control.

### 52.5 Two lockups, two jobs — do not mix them

The brand manual carries the mark in several forms, and the temptation is to
pick the nicest one. Islam settled it flatly: **the arrows lockup
(`RAYA ◄► TRADE`, the manual's "online" sub-brand) is the GROUP; the with-line
lockup (`RAYA │ DISTRIBUTION`) is the UNIT.** Two different things, two
different uses.

So the gate wears the arrows mark, and a unit — wherever a unit's mark ends up —
wears the line one. They are even drawn in different blues (`#282E76`/`#3A67B1`
against `#001780`/`#225FAC`), which is the artwork and not drift in the
extraction.

### 52.6 The divider is a STROKE, and a redaction that removes what it touches removes it

Extracting the seven unit lockups the same way produced seven lockups that still
looked like lockups — and had **lost the vertical rule** that the file is
literally named after ("Subsidiaries with line"). Twice, for two different
reasons.

The rule is drawn as a **stroked** line, not a filled shape, so a filter written
around fill colours drops it in silence. And it reaches **above** the wordmark,
so removing line art that *touches* the redaction took it away with the rows
either side; it has to be removed only when *covered*.

Both faults produce a plausible result. Neither is visible in the source. The
only thing that found them was rendering the output and looking at it.

### 52.7 Where the client's material lives

`clients/raya-trade/` at the repository root — brand assets and reference,
deliberately **not** inside `SMP-Project-Folder/`. That folder is the product and
travels as a zip; a 19 MB brand manual does not belong in the thing you carry.
A second client is a sibling folder, never a rewrite of this one.

### 52.8 Still open

Unit lockups on the review deck — **the cover and the footer of every slide**,
settled in principle, to be drawn before it is built.

The mapping is partly answered, and the answer is a shape rather than a list:
**Distribution covers Mobile, IT and Consumer Electronics** — which is exactly
the three units whose `company` is `distribution` in the stored tenant, so the
lockup belongs to the COMPANY and its units inherit it. The Electronics lockup
is not used. The rest is to be confirmed, so nothing else is assumed and no
unit is given a mark on a guess.

And the one that needs a decision rather than code: **an uploaded SVG is
executable content**, in a page that already runs with `'unsafe-inline'` (§43.6).
Either uploads are raster only, or the SVG is sanitised against an allow-list on
the way in. The seven extracted here are safe because nobody uploaded them.

### 52.9 A unit's own mark, and PNG as a security decision

Islam: the units have their own lockups, the SMO uploads them, *"I can upload
the others to the table later."* Six things came out of building it.

**PNG ONLY, and it is a security decision, not a preference.** An uploaded SVG
is executable content — it can carry a `<script>`, and this page already runs
with `'unsafe-inline'` (§43.6), so one uploaded file could read every session in
the tenant. Put to Islam as a trade with its cost stated — raster does not scale
as sweetly, and a mark that cannot be recoloured needs answering on a dark
slide; he chose PNG. The cap is 900px on the long edge, which is what the deck's
cover mark needs on a 4K projector, and 220KB of data URI, because it is carried
in every save.

**NO MIGRATION, AND THAT IS THE SCHEMA WORKING AS DESIGNED.** `units` carries an
`extra` JSONB, and `lib/state-io.js` puts every key it does not recognise there
and reads it straight back — so `logo` round-trips with no schema change at all.
Checked in a throwaway Postgres rather than assumed: three units, 17,978
characters each, still there **after the clean slate** — which is right, because
migration 004 removes `perf` by name and keeps the rest, and a real client's
lockup is not invented content (§21).

**A LOGO IS A UNIT SETTING**, so `logo` joins `UNIT_CONFIG` in `lib/authorize.js`
rather than being left to the unknown fall-through. Both land on the SMO, so it
changes no permission — it changes the REFUSAL, which now says Setup is the
SMO's and sends the person to the page that holds it (§16.7).

**ITS OWN SECTION, NOT A TWELFTH COLUMN.** The units table already carries
eleven columns, its widths are declared on the header row and sum to the whole,
and a mark needs a preview and two controls in one cell. A section on the same
page is what §46 settled Setup pages are for.

**THE GROUND IS THE WHOLE POINT, TWICE OVER.** `picIntake` paints white
underneath before encoding, because a transparent PNG re-encoded as a JPEG comes
back with a black ground — correct for a slide picture and fatal for a mark,
which is exactly what made the supplied JPEGs unusable (§52.2). Rather than a
second copy of decode-and-scale, the shared half became `imgToCanvas(file,
maxEdge, ground)` and the ground is stated by its caller. And because a PNG
cannot be recoloured for a dark slide the way an SVG could, the mark sits on a
light plate there — the same answer the sign-in wall already gives Forefront's
own mark, and one the person uploading cannot get wrong.

**THE FOOTER IS OUT OF FLOW**, and a footer that quietly lengthens the deck is
the fault that avoids: in the flex column it would shorten every content box,
which changes how many rows a table fits and therefore how many continuation
slides `deckFitPass()` mints. Measured across five units — 27 / 22 / 19 / 19 /
19 slides before, exactly the same after. And the skip rule is *a slide that
wears the mark large does not wear it small as well*; written first against
`.d-cover` it silently took the footer off five more, because the SWOT divider,
the four pillar dividers and Thank you all carry that class.

**Removing a mark DELETES the key** rather than blanking it, so a unit with no
mark is the shape it was before anybody uploaded one, and `unitLogo()` never
creates what it was looking for (§50.6).

### 52.10 Every unit gets a mark, and two silent failures on the way

Islam confirmed the mapping and asked for the rest to be drawn. All ten units
carry one now — eight distinct marks, because **DISTRIBUTION is the COMPANY's**
and its three units (Mobile, Consumer Electronics, IT) wear it.

**B2B ECOMM WEARS MAZAYA**, and that was not a guess: *"a unit may be known
internally by a brand the formal name does not carry — B2B Ecomm trading as
Mazaya"* has been the worked example in `navName()` since 3.4. The fact was
already in the codebase; it only had to be read.

Two failures on the way, both SILENT, both found only by looking at the picture.

**A FONT SUBSET MAPS FAR MORE THAN IT DRAWS.** The JetBrains Mono embedded in
Raya's manual carries a cmap entry for every ASCII character and an outline for
only 36 of them — **no digits at all**. `B2B ECOMM` rendered as `B B / ECOMM`
and nothing complained, because the generator treated a glyph with no outline
as a space. It now refuses any character it cannot draw, with a space the one
exception, and the font is the full open-licensed release — proved to be the
same drawing by redrawing a supplied lockup at 0 differing pixels first.

**`set_content()` SERVES FROM `about:blank`, AND CHROMIUM REFUSES A `file://`
SUBRESOURCE THERE.** Rendering the lockups to PNG through `set_content` gave
ten broken-image icons: 2.5KB each, all within 200 bytes of one another, every
one of them a placeholder rather than a logo. They would have been baked into
the platform and the seed. The fix is a real `file://` page — and the guard,
which matters more, is that the renderer now COUNTS THE INK and refuses
anything under 5%. The good renders run 18–24%.

Both faults share a shape worth naming: **a pipeline that substitutes silently
produces a plausible artefact.** Neither raised an exception, neither failed a
test that existed, and both were obvious the moment the output was looked at.

The rendering is a script (`scripts/make-unit-marks.py`) rather than a one-off,
and it produces exactly what an upload through Setup would: PNG, transparent,
900px on the long edge. **A rule the SMO must obey is a rule the demo data
obeys too.**

---

---

## 53 · A unit and a function are the same product (v3.21)

*2026-08-23. Islam, after using the built v3.19: "when we press on a function in
the navigation it should open by default on the projects page in the strategy,
and we need to match the sizing we made in the page for the rail and the project
name at the top of the right panel and the stickiness. You need to add a rule
that any change happens in the functionality or visual should be tested across
the units and the functions as they need to match unless something is
conflicting. For the deliverables and outcomes they need to be in the same table
with a tag to show which is which rather than 2 tables, and remove the due
column — it's not mandatory as it's a full project due, it's delivered when the
project ends. And there is no owner on the deliverables or outcomes, the
department is responsible."*

Five items, and the middle one is not a feature at all. It is the rule the other
four are evidence for.

### 53.1 A function opens on its Projects

§28 decided that a business unit opens on **Strategy › Plan** and not on
Performance: what was agreed is what people come to read and to change, and the
score is a consequence of it, one click away. The argument is about plans, not
about units — but the code that carried it out said, in as many words, *not a
function*:

```js
if (k !== "group" && k !== "manage" && k !== "setup" && !isFn(k)) {
```

So for four versions a supporting function opened on Performance while every
business unit opened on its plan, and the reason was a clause in a condition
rather than a decision anybody made.

The tab and the section are the only things that differ — `fnstrat`/`proj` for a
function, `strategy`/`plan` for a unit — so they are **two variables, not two
branches**. A second branch is how the two halves drift apart again.

### 53.2 The same rail, because it is the same rail

The function's Projects page and the unit's Plan page render through the *same*
`railFor`, the same `.split`, the same `.pane` and the same `pillarBand`. What
had diverged was everything passed into them:

| | Unit's Plan rail | Function's Projects rail |
|---|---|---|
| Number on the right | none (§29.6) | the deliverables count |
| Footer | none (§29.6) | "Figure shown is deliverables" |
| Small line | two counts and the owner | three counts, both dates and the timeline kind |

§29.6 removed the bare number and the footer that tried to explain it, on the
argument that **nothing on a plan page has been reported, so there is no figure
to explain**. That argument is about plan pages. It was applied to the unit's
and not to the function's, which is the same page under a different name.

Both now carry the same shape. The project's owner moved onto the band rather
than into the rail's small line: a pillar has two child lists and a project has
three, so a name in the rail took every row to three lines while the unit's sat
at two — and the sizing is the thing that had to match.

The Performance rail's footer stops captioning a column and **states the
summary**, exactly as a unit's does: "63% across 3 projects · execution 42%".

Two small things fell out of it. `railFor` rendered `<span class="rnum"></span>`
even when there was no number, and an empty span still takes its track in the
row's grid. And the Performance and Report panes each carried an
`<h4>Projects</h4>` immediately above a rail whose own head says "PROJECTS 3".

### 53.3 A capability is a band, not a card

The measurable half of "match the sizing". A function's page wrapped everything
below the capability band in `.capbody` — a bordered white box with 16px of
horizontal padding — so the rail and the pane **inside** it, which draw their own
borders, sat 17px in on each side and 34px narrower than the identical rail and
pane on a unit's page. A card inside a card, and the outer one's padding was
the difference.

The band stays: a function can carry several capabilities and something has to
separate them. The box around the rest is gone.

It also fixes a seam nobody had named. `.pane > .pband`'s `::before` paints
`--ground` over whatever scrolls up into the gap above a pinned band (§51.13).
While the capbody was white, that painted the page's grey onto a white card and
left a line down both sides. With no card there is nothing to disagree with.

And **the third duplicated rule in `arrange.css`**: two `.capbody` blocks, 105
lines apart, the later one winning on source order — §29.2's lesson and §51.5's
`.capline`, in the same file, for the third time. Editing the first one did
nothing at all.

### 53.4 Deliverables and outcomes are one table

They are two kinds of evidence that a project achieved what it set out to, which
is exactly why the **score** still keeps them apart — half from the deliverables
side, half from the outcomes side, per side and not per row (§9). Reading them
together and scoring them together are different questions, and only the first
one had been asked.

One table on all three project panes, with a **Type** column carrying
`Deliverable` or `Outcome`. A column rather than a pill beside the name: with
two values and two only, a column is the thing you can run your eye down. The
row numbers run across the whole table — two rows both called 1 would say it was
still two tables.

**No due.** A deliverable carried a quarter of its own, and one later than the
cycle meant *not asked*: a dimmed row the tally left out. Islam: it is delivered
when the project ends. So the column went — and with nothing left to set,
`delivDue()` went with it, at all four of its call sites rather than being left
behind always answering true (§24). An **outcome** keeps its measurement time,
because that is a real thing somebody chose.

**No owner.** The project has one. A row inside it naming a second person in a
smaller font invited an argument about which of the two was accountable, and the
answer Islam gives is neither: the department is.

Removed everywhere the fields could be read or written, not only where they were
shown — the three panes, the review deck's slide and its attention gather, both
`.xlsx` sheets that carried them, the CSV column lists in both directions, the
seed, and the two database columns (migration 016). **A column the platform no
longer reads is worse than no column**: somebody fills it in and nothing
happens.

### 53.5 THE RULE: measure both, not walk both

> Any change to how something works or how it looks is tested on **both** sides
> of the navigation switch. A unit's page and a function's are the same product
> and must not drift apart unless something genuinely conflicts.

Everything in 53.1–53.3 was a fix applied to one side and not the other, and
each had been through several green sweeps. The sweeps walk both sides already
— qa.py has pressed the switch and visited every function page since §51.9 —
and reported "ok" every time, because **walking a page proves it renders, and
these were not rendering faults**. The two pages were fine. They were fine
differently.

So the check MEASURES them and compares: the rail's grid track, the pane's box
inside the panel, the pane's padding, whether the rail and the band are sticky
and at what offset, and the band name's size and weight. It asserts the two
**agree**, never what the number is — so a deliberate change to both stays
green, and a change to one does not.

Proved against the previous build before being trusted: run on v3.19 it reports
`paneLeft: unit 212, function 229` and `paneRight: unit 0, function 17`; run on
this one, nothing. And it names the page it actually scanned and asserts that
name, because §50.6's sweep spent twelve versions measuring the wrong page under
the right label.

The landing is asserted the same way, from the navigation rather than from the
function that decides it: click the destination, read back which tab and section
are lit.

### 53.6 What was deliberately not changed

The **deck** keeps a slide for deliverables and a slide for outcomes. A slide is
a full screen with one table on it, and a Type column exists to let the eye sort
a list it is scrolling — on a slide the heading already sorts it. Only the two
dead columns came off.

**Milestones keep their owner.** Islam named deliverables and outcomes, and a
milestone is a piece of the timeline somebody is walking, not a thing the
project hands over.

The two database columns are **dropped**, not left standing and ignored. What
was in them survives in `plan_archives` for any plan that carried them, which is
where a replaced plan has lived since §22.

### 53.7 The strip above a pinned header paints whether or not it is pinned

*Reported by Islam against v3.20, from a screenshot: the capability band with a
piece of its bottom cut out on the right and left hanging below on the left.*

§51.13 pinned the project band and filled the 22px gap between it and the chrome
with the page's own ground, so the pane's content could not slide through the
window. Two things were wrong with that filler, and the second is the real one.

**It covered the pane only.** The rail's column beside it had nothing over it, so
content kept sliding through there — which is why the band was cut off in a
straight line where the pane began and carried on below it over the rail. The
rail pins too, so it takes the same filler rather than the pane's being stretched
left across a track width that would then have to be written twice. Its offset is
one pixel above the band's, so its strip is one pixel shorter and the two cover
the same line. The 16px gutter between them is `--split-gap` now, named once and
read in both places, because the filler has to reach across it (§29.4's rule,
applied to the gutter).

**And it paints at all times.** CSS cannot ask whether a sticky element is
currently pinned, so the filler is there in the flow position too — painting the
page's ground over whatever sits immediately above the split. Nine pixels off the
bottom of a capability band; **twenty-three off the key-objectives table** above
the rail on a function's Performance and Report pages; and on **the unit's Report
page** the same, which is the point: this was never a function-only fault, it was
just invisible where nothing sits above a split. On a unit's Plan page nothing
does.

The fix is clearance, and it is one rule:

```css
* + .split { margin-top: var(--pin-clear); }   /* --pin-clear = --rail-gap + 2 */
```

`* + .split`, not `.split`: a split that STARTS its container must keep
`margin-top: 0`, or the rail's flow position stops matching its sticky offset and
it slides the difference on the first scroll (§29.4, the lurch). And the
capability band carries the same number as its own bottom margin, because on the
Projects page the split is the capbody's first child and there is no sibling gap
for the rule to widen.

**Measured in pixels, not in the DOM.** `elementFromPoint` returns an element and
a `::before` is not one, so the first probe reported "ok" on the broken build. The
check that found it screenshots a one-pixel row and reads the colours: for every
railed split, at eight scroll positions, every pixel of the visible gap must be
the page's ground. It reports 4 pages on the v3.19 build — including
`(22, 50, 92)`, the band's own navy, on the function's Projects page — and 0 on
this one.

`qa.py` asserts the invariant that keeps it fixed rather than the pixels, so it
needs no image library: for every split holding a rail, the distance from its top
to the lowest thing drawn before it in the page must be at least `--pin-clear`.
Not merely its previous sibling — on the Projects page the band is a step further
out, and a check that looked only at siblings would have called that page clean.

## 54 · The BU list, and the register as a file — v3.21

Islam brought one row of Raya's employee data and one problem:

> Emp.ID 102347 · Mohamed Hassanin Ehsan Hassanin · Senior Manager (Sales) ·
> mohamed_ehsan@rayacorp.com · 01111111821 · **Distribution**
>
> "however in the official company list of the BUs are the following:
> Distribution, Finance, IT, Logistics, Maintenance, Marketing, Mazaya,
> Retail, Risk, Support Function … so we can call these the main BUs so we can
> keep our Units in place as is. we just will need to map the Main BU to the BU
> in the table … and you give me a template download and upload for the data in
> the people register tab so I can upload an excel with the agreed on format to
> seed in the users. and of course add to the template the roles in a drop down
> to identify their roles and change standing to Status"

Four things, and only the last one is a rename.

### 54.1 The platform holds none of those ten words

Checked against the tenant rather than assumed, and that is the whole finding:

| Official BU | What the platform actually holds |
|---|---|
| Distribution | a **company**, not a unit |
| Finance | supporting **function** |
| IT | a **unit** *and* a **function** — both exist |
| Logistics | **unit** |
| Maintenance | nothing |
| Marketing | supporting **function** |
| Mazaya | nothing — a name in the demo's content, not a unit |
| Retail | a unit, but named **Retail Stores** |
| Risk | nothing |
| Support Function | nothing |

Six of the ten do not resolve. So the file cannot be read against the
platform's own list, and naming a unit on each of five hundred employee rows
would be one fact typed five hundred times with a typo in some of them putting
somebody quietly in the wrong place.

**THE LIST IS THE BRIDGE, AND IT IS STORED ONCE.** A Setup page — *BU list* —
holding the client's own names, each pointing at one place here or at nothing.

**POINTING AT NOTHING IS AN ANSWER, NOT AN OMISSION.** Risk employs people and
carries no strategy: they are on the register, they belong to Risk, and there
is simply nothing for them to open. A list that demanded a target for every
name would force a wrong one.

**THE VOCABULARY IS `r.at`'s** — `"group"`, `"co:<company>"`, `"fn:<function>"`
or a unit key, the same strings a role is held at and the same ones
`roleWhereLabel()` names. That reuse is what lets a Main BU point at a
**company**: the platform already knew how to attach somebody to one, because
that is where a company CEO sits (§23). Nothing new had to be invented for
Distribution, which was the case that looked hardest.

**IT SITS IN *WHO*, NOT IN *WHAT WE RUN*, and shares `c_people`.** It is not
another thing being planned; it is the vocabulary the register's own data
arrives in, and its only reader is the register. Companies already shares
`c_units` on exactly this argument (§30) — a fourteenth access key for a
ten-row table would be a switch nobody ever moves.

**WHAT EACH NAME POINTS AT IS ISLAM'S, AND IS LEFT EMPTY** (A4). Two of the ten
make that plain: Distribution is a company rather than a unit, and **IT is the
name of both a business unit and a supporting function**, so the platform
cannot guess which one an employee in IT belongs to. The demo ships the ten
names and no mappings.

### 54.2 The register carries two answers, because they are two questions

Renamed at Islam's word: *"belongs to is not good naming"*. A strategy
platform's word for a part of the business is **BU**.

- **Main BU** — what the organisation calls the person's part of the business.
  HR's word, straight off the file, never interpreted.
- **BU** — what that points at here: the unit, function or company whose pages
  they open. This is the attachment access has always been read from; it was
  called *Belongs to*.

And *Standing* becomes **Status**, which is what a column holding Active or
Retired is. Standing is what a focus measure has.

**WHERE THE TWO DISAGREE, THE CELL SAYS SO.** The list can be re-pointed after
a file was loaded, and a person can be moved by hand afterwards; neither is a
fault. A mapping that silently moved thirty people the next time a row changed
would be the worst kind of helpful, so the register marks the disagreement and
leaves the answer to the SMO.

Three new facts on a person — employee number, email, Main BU — and **none
needed a migration**: they ride in the `people` row's `extra`, the same free
ride `active` and `phone` take (§35). The BU list rides in `org.extra`, as
figure sets do (§44).

### 54.3 The register as a file — and it is the export too

One workbook, two sheets, eight columns: Emp ID · Name · Job title · Email ·
Mobile · Main BU · Role · Status. It downloads what is on the register right
now, so the template **is** the export, and a filled copy uploaded back amends
rather than duplicating.

**AN UPLOAD ADDS AND AMENDS, AND NEVER REMOVES.** This is §22's contract for a
plan turned round, and deliberately so: a plan is authored by upload because a
plan is one whole thing, and a register is not. Five hundred people arrive in
batches from an HR system nobody here controls, so a file that replaced the
register would retire everybody it forgot to mention. Retiring is something the
file can *ask* for — Status: Retired — doing exactly what the row's own menu
does. **A blank cell means "nothing to say about this", never "clear it".**

**MATCHED ON EMP ID** (Islam, asked). Not the name, which two people share and
one person changes; not the email, which changes with a mail domain. A row with
no employee number is **skipped with a notice**, not refused — the thirty-three
people already in this tenant have none, and a template that could be
downloaded and not uploaded back is §51.14 arriving in a second file.

**AN UNKNOWN DEPARTMENT IS ADDED TO THE LIST, UNMAPPED, RATHER THAN REFUSED.**
It is how the ten names arrive in the first place. A fresh tenant's list is
empty, and demanding it be typed before the first file could be read is the
trap §22 fell into: a locked dropdown offered nothing, so Excel refused every
pillar name typed into the column, so a first plan could not be authored from
the template. Role and Status are closed lists; **Main BU is a suggestion**.

**A ROLE IS ALWAYS HELD OVER THE PERSON'S OWN BU** (Islam's ruling), which is
what keeps the template to one column rather than two. The consequence is
honest and is stated on the sheet: a role needs the Main BU to point somewhere,
and it must point somewhere that role can be held — "Business unit owner" of a
supporting function is not a thing, and the refusal names what the role does
admit. Contributor is not offered at all: it is not granted, it is what
somebody attached to a unit and holding nothing else already is (§49.5).

### 54.4 What the round trip caught, immediately

**THE PLATFORM REFUSED ITS OWN EXPORT.** The download writes each person's
current role, so 31 of the demo's 33 rows came back naming a role the upload
then could not place — those people have no Main BU, a role is held over their
own BU, and there was nothing to place it against.

Found by a check, not by reading, and the check is the point: the people file
is asserted to be a **fixed point** — downloaded and uploaded back unchanged,
it must move nothing. Without that, the first thing anybody does with the
feature (download it to see the shape) reports a register full of changes that
are not changes.

The rule that fixes it is the one the column already promised: **this column
gives a role, it never takes one away.** If they already hold it there is
nothing to give, so there is nothing to check and no BU needed. What it will
not do is **move** one — a custodian of Mobile whose BU says Retail stays
custodian of Mobile, because moving a custodianship is a real act and a
spreadsheet column that did it as a side effect would do it to everybody at
once.

Two smaller ones, both from the same run. Written as *clear the role, then
check it*, the check fell through holding `null` and reported all 31 rows as
asking for Contributor — **clear it before anything is asked of it**. And the
first version of the one-edited-cell check changed the *person* and downloaded
again, so both sides agreed and it reported zero changes while passing: **the
edit has to be made to the FILE** (§50.6, measuring the wrong thing passes).

### 54.5 A check that asks whether it can run is a check that passes

Walked into while writing the test for something else, and recorded because
this file records it twice already. The new authorisation test was written
`A.classify ? … : null` — and the export is called `collect()`, so it skipped
in silence and the suite still said "passed". It is unconditional now.

The same rule was applied forward rather than re-learned: the contrast sweep
**seeds two BU rows and a drifting person** before walking Setup, because an
empty BU list renders one note and would be reported clean (§45.2); and the
sweep's page count is **counted rather than typed**, because the literal `34`
was already stale.

### 54.6 A client must not inherit Raya's departments

The demo carries the ten names so the feature is visible rather than described.
That put them in `org.extra`, which is **exactly where §45.3's figure set
survived the clean slate** — so `mainbus` joins `sets`, `claims` and `naming`
in migration 004's scrub. Editing that file reaches every future deployment and
no existing one, which is correct: an existing tenant is never re-seeded, so it
never receives them. Verified by deploying to an empty database and asking the
`org` row, rather than by reading the SQL.

### 54.7 What was measured

- `test-authorize.js`: **131 passed, 0 failed** — five new, covering that a
  unit head and a custodian cannot point or re-point a BU row, that the SMO
  can, and that the change is classified as `setup` rather than falling into
  the unknown bucket.
- `qa.py`: every page as all 31 viewers, **no console errors**; the people file
  round trip **33 rows, fixed point PASS**, one edited cell producing exactly
  one changed row, and Islam's own sample employee in an unmapped department
  coming back as *added* with the department offered to the BU list.
- Contrast sweep: **53 failing runs before, 53 after** — the new pages add
  none. (The 53 are §16.15's, on the Performance page, recorded and untouched.)
- `test-roundtrip.js` against a real Postgres 16: clean slate, deep-equal round
  trip and fixed point all **PASS** with the BU list in the seed.
- End to end, signed in, against the API: the BU list and a person carrying an
  employee number, email and Main BU save, persist and read back, and
  `change_log` names the change *"the BU list"* rather than *unknown*. The real
  upload path was driven through the file input — the review named the
  duplicate employee number, skipped the person with none, offered the unknown
  department, and applied.

### 54.8 What this cost, and what is still open

The register was already wider than its box: **1061px in 920px** at v3.19,
scrolling in place. Main BU adds 66px, so it is **1127px** now. The box scrolls
and the page does not, and Job title or Contact can be switched off in the
Columns menu to recover it — but it is a widening, and it is recorded rather
than left to be noticed.

Still open, and each needs an answer rather than code:

- **What each of the ten names points at.** Ten dropdowns, five minutes, and
  nobody but Islam can fill them. IT is the one to think about: a unit and a
  function share the name.
- **Email is the obvious future sign-in name.** It is on the register now; the
  username is still a key minted from the person's name (§35). Changing what
  people sign in with is its own decision.
- **The file grants roles and nothing slows it down.** An upload that names
  *Super user* against a row gives the SMO seat, and it is authorised as Setup
  like everything else here — correct, and worth knowing before a file arrives
  from somebody else's laptop.

---

## 55 · The floor is two roles (v3.21)

*2026-08-23. Islam: "for the people roles we need a role named employee which
is a normal team member."*

### 55.1 An ordinary team member already had a role, and it was the wrong word

Roles are derived, never stored (§33), and there has always been a floor:

```js
if (!out.length && p.unit) out.push({ role:"contrib", at:p.unit });
```

Anybody attached to a unit and holding nothing else **is** a Contributor — not
granted, not offered in the employee file's dropdown, and refused by the reader
if a file asks for it, because it arrives by itself (§54.4).

But *Contributor* means "named on a measure or a tactic", and on a real tenant
the register is the whole company. Most of the people on it carry no strategy at
all. Calling them Contributors overstates what they are, and it is the first
thing anybody notices when the employee file lands.

### 55.2 Two roles, because the platform already knows the difference

**Employee** — on the register, attached to a part of the business, named on
nothing. **Contributor** — named on a measure or a tactic, so they report those
lines.

Both derived, neither grantable. The difference is a fact the platform already
computes, because `namedOn()` is what decides whether a Contributor may report a
line; `namedInUnit()` asks the same question of the whole unit and the floor
splits on the answer. So a person becomes a Contributor the moment a plan names
them and stops being one the moment it stops — nothing to maintain, and no way
for the register to disagree with the plan.

In the worked example it separates immediately: **Ramy Behairy is named on a
Mobile tactic and is a Contributor; the Group CFO is named on nothing and is an
Employee.** (Reported here as measured. An earlier probe of mine called
`SMPRules.worldOf()` with no argument, which builds an EMPTY world — so
`namedInUnit` had no plan to look in and answered false for both. §50.6 again,
in my own check rather than in the product: a probe that measures the wrong
thing agrees with itself.)

### 55.3 The rule that had to be named once

Twelve places asked the literal string `"contrib"`. Every one of them means *is
this person here only as somebody who speaks for themselves* — and a second
floor role added beside the first would have widened all twelve by omission.

A tenant that gave Employee edit on its own unit would have got an employee who
could **submit the unit's report, write the cycle note, add a picture slide to
the review, and decide who enters a figure**. Nobody would have chosen that, and
every test would have passed, because the tests name the role too.

So the concept is named once in `lib/rules.js` — `OWN_LINES_ONLY`, with
`onlyOwnLines()` and `isOwnLinesRole()` — and the twelve call sites ask it
instead. Same answer for a Contributor, right answer for an Employee. The test
that would have caught the widening is in the suite (§9 of
`test-authorize.js`).

### 55.4 Its access starts where a Contributor's already is

A new role's defaults reach every existing tenant the day they upgrade: §30.2
made an absent key mean *not answered yet*, so `grant()` falls back to the
shipped default. Shipping a tighter floor would quietly take the group away from
people who can see it today, without anybody choosing it.

So Employee ships with exactly a Contributor's current access — group view, own
unit view, nothing else — and the SMO tightens it on the matrix. **That is the
whole reason it is a row of its own:** on a tenant whose register is the entire
company, "does an ordinary employee see the group's strategy" is a real question,
and until now there was no way to answer it separately from "does a person named
on a tactic".

### 55.5 What was left alone

The employee file offers neither role in its Role dropdown and refuses both by
name, exactly as it already refused Contributor. Retiring stores neither, because
neither is taken away — both are read off `p.unit`, which retiring leaves alone
(§49.6). And the access matrix grew a row rather than a page: 7 roles became 8,
49 stored grants became 56.

---

## 56 · Where people say they work (v3.21)

*2026-08-23. Islam: "we are meeting the people tomorrow so maybe on
registration and password change they can set their BU from the list or their
supporting function, so we can get precisely who is where rather than
guessing."*

### 56.1 A declaration is not an attachment

A person choosing their own BU is choosing their own access. An Employee sees
their own unit's plan and the group (§55.4), so a free pick at first sign-in is
a screen where anybody awards themselves the reach to read whichever unit's
numbers they were curious about — and across companies it defeats the
per-company visibility flags Raya specifically asked for (§23).

So what somebody picks is **recorded and grants nothing**. Their BU on the
register — the thing that decides what opens — is still the SMO's, changed on
the People page like any other. Which is also what lets the list be the whole
organisation rather than a guess at which part of it is theirs: constraining the
choices would only have mattered if the choice granted something.

### 56.2 It lives outside the state graph, and without a foreign key

`lib/state-io.js` writes a save by TRUNCATE-ing all thirty tables and
re-inserting, so a column on `people` would be erased by the next thing the SMO
saved. `bu_declarations` sits where credentials, sessions and the change log
sit, for the reason §42 gives: a record a save can erase is not a record.

And with **no foreign key to `people`**, which is why `credentials` has none
either: that TRUNCATE is CASCADE, so a reference would take this table with it
on every single save. It is the kind of correctness that is invisible until the
first time somebody presses Save and the evidence is gone.

### 56.3 The list is built on the server

`whereList` reads the units and functions out of the database and
`declareWhere` validates against the same query. A client that names its own
options can name one that is not there, and the declaration is stored by key —
so the choices and the check come from one place rather than two that can
disagree. The options are built with `createElement`, not with a string: every
one of those names came out of the database and the gate has no `esc()` to
borrow.

### 56.4 Nothing about it may stop somebody signing in

The password is already set by the time the declaration is sent, and its answer
is not waited on for anything. A failure there costs the SMO one row to fill in
by hand; a failure that blocked the door would cost somebody their first
sign-in. On a deployment too old to have the endpoint the question simply is not
asked, rather than asked and broken.

### 56.5 The SMO reads it on the register

Under the BU, never instead of it: *"They said Retail Stores — Use it"*. Silent
when it agrees with where they already are, because a register that annotated
every row with a note confirming the row is a register nobody reads. **Use it**
is an ordinary edit through `attachPersonAt()` — the one door the register and
the file importer already share (§54) — so it is authorised on the server like
every other change, and there is no second write path to guard.

### 56.6 The label names what it asks for, not why we are asking

*Islam, same evening: "change 'where you work' to 'pick your unit/function'."*

**Pick your unit or function.** "Where do you work?" is a question about the
person; the answer is one of two lists sitting directly under it, and the label
should say which lists those are. It reads as an instruction now, because that
is what it is — and it is honest about the shape of the answer, which matters
when the alternative is somebody scanning a dropdown wondering whether their
department is supposed to be in it at all.

It also survives the shortening that is coming. Once the BUs are mapped under
each Main BU and the supporting functions under the Support Function name, the
list can narrow to what that person's Main BU actually holds — and it is still
a unit or a function they are picking, just fewer of them. A label naming the
REASON would have had to be rewritten the day the reason changed.

### 56.7 A CLEAN MERGE CAN STILL COLLIDE IN A SHARED SCOPE

Found by driving the merged product, not by any test. Two branches each added a
`var pf` to `wire()` — one for the function's Present button, one for the People
page's file input — six hundred lines apart, nothing about the text conflicting,
and git merged both without a word.

`var` is FUNCTION-scoped, so they were **one binding**. On every paint where the
People page was not on screen, the second line reassigned it to null, and the
deck button's handler — which closed over the same `pf` — threw `null.dataset`.
**A function's Present did nothing at all**, and both halves had worked
perfectly in the tree each was written in.

Fixed by renaming one and by having both handlers read `this` rather than close
over the element they were wired to. The rule is the finding: the merge report
is not a substitute for opening the product, because the collisions a merge
creates are exactly the ones neither side could have tested for.

---

## 57 · A Main BU holds several, and the sign-in list gets short (v3.21)

*2026-08-23. Islam: "just give me a table in the setup and enable the edit for
me to map the main BUs list to the BUs and functions and I will do it, so
everyone gets to the login with a short list to pick from — given they can
always choose other and we can adjust with them later if something is
missing."*

### 57.1 One target was the reason it could not place anybody

§54 gave each Main BU exactly one target, which was right for *Mazaya* and
wrong for the two names that matter most. **Distribution is a COMPANY here**
holding three units, and **Support Function** is the client's one word for
eight. A single target could name the company and stop — and stopping there is
precisely what left the register guessing.

Several targets say the actual choices, and the sign-in picker offers those and
nothing else.

### 57.2 It reads both shapes, and there is no migration

Every row written before today holds a string. `mainbuAts()` reads a string as
a list of one and the array as itself, so a tenant that has already mapped part
of its list does not do it again; the row is written back as an array the next
time it is touched. `mainbus` lives in `org.extra`, which is jsonb and takes an
array without being asked (§54.1).

### 57.3 Several places means the file places nobody

`mainbuAt()` answers **only where the name means one place** and null wherever
it does not. A Main BU covering three units cannot say which of them somebody
is in — that is the entire reason the question is asked at sign-in — so the
person arrives unattached and the picker offers them those three.

The guard is in one function and every resolver goes through it, which is what
made the fault findable: the people-file importer was still reading `bu.at`
directly, so it attached people to **the array** — `['mobile','b2becomm']`, a
value that is not a place at all. `qa.py` caught it within a minute of the
assertion existing, because the assertion is the rule: *a name that holds
several places nobody.*

### 57.4 A set of chips, not a dropdown

One `<select>` cannot show four answers or take one away without disturbing the
rest. Each mapped target is a chip carrying its own ×; the dropdown underneath
adds, and **offers only what is not already mapped**, so pressing it can never
be a no-op. Add and remove are separate writes — neither sends the whole list,
so a stale tab can duplicate at worst and can never silently drop the four
somebody else mapped while it was open.

`.uchip` also stopped being scoped to one table. It was defined only under
`.cfg.srctable`, so the register's BU cell and this one had been drawing bare
text where a chip was intended — §24 from the other end: **an element with no
CSS is as invisible a fault as CSS with no element.**

### 57.5 Short at the top, and everything still reachable

The gate asks the server for the list; the server reads the person's Main BU,
looks it up in the stored rows, and returns what it holds. **Narrowed on the
server**, never sent up and filtered by the page — a client that decides its own
short list has decided nothing, because it still had the long one to decide
from.

Their own go first under the client's own word for that part of the business,
then *Other business units* and *Other supporting functions*. Islam: "they can
always choose other and we can adjust with them later if something is missing."
A short list that cannot be escaped strands whoever it forgot — and since the
answer is a declaration that grants nothing (§56.1), nothing turns on which half
they pick from.

Driven end to end: Distribution mapped to Mobile and Consumer Electronics on
Setup, the SMO given that Main BU, and the sign-in card then offered
**Distribution (2) · Other business units (8) · Other supporting functions
(8)** — the pick landing in `bu_declarations` as before.

---

## 58 · Official BU, and it is measured by nothing (v3.21)

*2026-08-23. Islam: "we can even name the Main BU to be Official BU for clear
naming forward. There is no performance or measurements for the official BU —
so do nothing for logic for it. The only performance we build is for what we
verify in our management practice: the business units and functions we
identify, and of course the companies that already group them."*

### 58.1 The word

**Main BU → Official BU**, everywhere a person reads it: the register's column,
the Setup page and its rail entry, the people workbook's column and its Read-me
line, and every sentence that pointed at the page. *BU* keeps its own name — it
is what the official one points at, and what decides access.

"Main" said which of several was the important one, which is not the
distinction. **Official** says whose word it is: the client's, off their own
employee data, as opposed to the platform's.

**The stored field names did not move.** `p.mainbu`, `GROUP.mainbus`,
`mainbuAt()` and the rest keep their spelling — renaming them is a data
migration for a word nobody reads, and §51.10's lesson is about a rename whose
WRITERS were missed. The surest way not to miss one is not to rename the field.

### 58.2 A header is a contract

The workbook's column is written as **Official BU** and read as either. Somebody
is holding a file downloaded before the rename with the old word at the top of
that column, and refusing it would be §54.4's fault — the platform turning away
its own export — arriving through a relabelling rather than through a rule.

Both paths are in `qa.py` and deliberately so: the fixed point proves the new
header round-trips, and the new-joiner row keeps the OLD header with a note
saying not to tidy it.

### 58.3 AN OFFICIAL BU IS MEASURED BY NOTHING, AND THAT IS THE DESIGN

Islam's second half is an instruction *not* to build, and it is worth recording
as a decision rather than as an absence, because the temptation will return
every time somebody looks at the list and sees ten named things with no score
beside them.

An Official BU **has no plan, no performance, no execution and no page.** It is
vocabulary: the client's word for a part of the business, and a pointer to what
is actually measured. Everything that carries a score is something the practice
identifies and verifies — **a business unit, a supporting function, or a company
grouping them** — and each of those already has its own record, its own plan and
its own way of being scored.

This is the same argument §23 made for companies (*visibility, not strategy: no
score, no page*), and it holds here for a stronger reason: a name that holds
several units would have to sum or average them to have a number at all, and
that number would be a second, quieter answer to a question the group's own
rollup already answers properly.

The page says so now, in the one place somebody would ask: *"An official BU
carries no strategy and no score of its own — it is vocabulary, and what it
points at is what is measured."*

### 58.4 One note that had gone stale

*"A name may point at a company"* was the best a single target could do, and
exactly why it placed nobody. It now reads **"One name may hold several"**, and
tells the SMO to map the units themselves — which is what §57 made possible and
what the sign-in picker reads.

---

## 59 · A function that plans in pillars actually works (v3.21)

*2026-08-23. The piece I flagged when spec 010 merged — the Setup controls it
never got, and the authoriser gap that made it unusable. Islam: "ok go ahead
for this."*

Spec 010 was merged as *model, scoring, demo and page routing built; Setup
controls, authoriser classification and the import template still open*. That
was true, and it understated it. Building the two controls surfaced **four
faults, all from the same merge, all invisible because nothing had ever walked
that path.**

### 59.1 Its custodian could not report on it

A function's plan and its figures live on the FUNCTION, and the authoriser had
one line for the whole of `functions`: any change anywhere classified as Setup.
So Merchandising's custodian could open the Report page, type a number, and
have the save refused as *"Setup is the SMO's."*

**Classified by the unit's own classifier**, run against the `fn:<key>` target
— not a second copy of it. The verdict already understood a function target
(`unitReporting` asks `edits(…, "fn", t)`), so §42's whole figure/note/plan
split arrives intact and cannot drift away from the unit's. What stays Setup is
the function's SETTINGS, which is what that line was always really about.

The classification is read from the **stored** side, so a save that switched
`format` and rewrote the plan in one request cannot ask the incoming world
whether it was allowed (§42.2).

### 59.2 Its pillars had no ids, so the classifier saw nothing

`renumberUnit()` ran over `UNIT_KEYS` alone. Merchandising's three pillars,
their measures and their tactics all carried `id: undefined`.

Silent, and it broke two things at once: the rail keys off the id, and the
authoriser compares plans BY id — so with every row keyed `undefined` the
stored and incoming graphs looked identical and a reported figure classified as
**nothing at all**. Found by asking the classifier what it made of a figure
somebody had just typed and getting back an empty list. Not by reading it.

### 59.3 It was not in the navigation, and the rule was written twice

`fnsReachable()` required `capsOfFunction(k).length` — right for a function
whose whole plan lives in its capabilities, wrong for one whose plan is its
own. Merchandising was built, scored, rolling into Retail's pillar, and
**unreachable**.

And fixing it left the row exactly as invisible, which is how the second copy
was found: `myFns()` in the shell asked the same question with the same wrong
test. `fnHasWork()` answers it once now.

### 59.4 And then its Performance page threw

Making it reachable is what let the sweep walk it — and the first thing the
sweep did was crash: `deltaFor()` resolved a target as `UNITS[key]`, and
`UNITS["fn:merchandising"]` is undefined.

`unitLike(target)` resolves it in one place now. **This is the shape of all
four:** spec 010 gave a function the unit's pages without giving it everything
a unit key means, and each gap was invisible until something walked the path.
The sweep could not walk it because of §59.3, and §59.3 was hidden behind
§59.2. They came out in order, each one uncovering the next.

### 59.5 The two controls

**Plans in** — *Projects* or *Pillars* — and **Under**, on Setup › Supporting
functions. Both were built by spec 010 and neither had a control: `format` and
`under` could only be set by editing the source, so a second Merchandising was
impossible to create through the product.

**Switching is refused while the other side holds something.** A function
holding capabilities cannot become a pillars one and a function holding pillars
cannot go back — switching would not delete the work, it would stop DRAWING it,
which is worse: the plan is still in the save and nothing shows it. The same
contract as retiring a company that still holds units (§49.3).

**Shown and disabled, never hidden.** Every function in a live tenant holds
something, so a control that vanished while it did would be a control nobody
ever saw — §45.2's *"a feature that renders nothing looks like a feature that
was not built"*. Disabled with the reason beside it says the true thing: this is
settable, once the row is cleared.

**Under is offered only to a pillars function**, because only it borrows a
foundation; and switching back to Projects clears `under` as well as `format`,
so no field is stored that nothing reads (§53.4's rule about a column the
platform no longer needs).

Driven through the real controls: a new function is switchable, choosing
Pillars stores `format`, choosing a unit stores `under`, and going back to
Projects leaves `{}` — both keys gone.

### 59.6 Nine columns is the table's limit, and it was already at eight

Drawn as two columns, *Plans in* and *Under* took the table to ten in edit
mode. **Measured rather than judged:** at 920px "Shown in the nav" wanted 119px
in a 94px cell, "Strategy custodian" 129 in 119 and "Capabilities" 86 in 68 —
three headers overlapping their neighbours, and the format select clipped to
"Proje".

Two changes, both repairs to what the ninth column cost:

**They became ONE column,** because they are one fact — how this function
plans, of which `under` is the second half and exists only on the pillars side.
Stacked in one cell, the way the Official BU list's mapping cell does it. The
word UNDER sits above its select rather than beside it: beside it the select
had ~90px of a 138px column and clipped "Retail Stores" to "Ret…", and the
value is the half worth reading.

**Three headers shortened** — *Nav name*, *Caps*, *Custodian*. Each still says
what its column is; the long forms were describing what the row already shows.
Zero overlapping headers after, measured the same way.

### 59.7 What is still open on spec 010

**The import template.** A pillars function's plan can be corrected on the page
and reported on, but it cannot yet ARRIVE by upload the way a unit's does: the
plan template's Read-me lists business units, and a function is not among them.
That is the next piece, and it is its own decision — §22 says an upload
AUTHORS a plan, which for a function means deciding what happens to the
capabilities it is not using.

## 60 · The sliders mark, the rail's code, and the page stops moving (v3.21)

**60.1 The gear is two sliders.** Islam did not like the gear. Six marks were
drawn at the size the control is actually worn — a 20px mark inside a 34px
button, which is the only size it is ever seen at — and he chose the sliders.
The gear's teeth were the whole problem: at 20px an outlined cog loses them to
anti-aliasing and reads as a smudge. Two sliders hold their shape at any size,
and they are the truer picture of what is behind the button: sixteen things you
SET, not machinery.

**60.2 The code is not part of the name.** Islam: *"the code looks like the same
name with the pillar name, that needs distinction in colour and alignment."* It
did, for a plain reason — the code sat INSIDE the same bold element as the name,
same colour, same weight, same line, so `FIN01` read as the title's first word.
It takes `.pband-code`'s treatment now (mono, letter-spaced, `--stone`, its own
line), so the rail and the pane beside it say a code the SAME way rather than
two ways (§53).

`--gold-deep` on `--surface-2` for the selected row's code was **§38.5 for the
seventh time** — the sweep went 53 → 61 and back to 53 on `--ink-2`. This file
records that trap by number and it was walked into anyway.

**60.3 A toggle that removes the sub-details.** In the rail's header, remembered
in `localStorage` (`smp.rail.terse`) like every other screen preference (§25,
§47.1) — never in the state graph, because one person tidying their rail must
not tidy everybody's. `railHead()`, `railName()` and `railSub()` are the one
place all four rails ask, or the fourth is the one that keeps its sub-line.

**60.4 The page stopped moving.** `html { scrollbar-gutter: stable }`. A unit
whose page is short enough to need no scrollbar and one that needs one are
different widths, so switching between them shifted the whole layout — which is
what Islam saw on IT and Corporate and on the functions. Recorded honestly:
headless Chromium draws overlay scrollbars and cannot reproduce the jump, so
this was reasoned from the mechanism and the measurement of the two page
heights, not seen failing and then seen fixed.

## 61 · An empty function is still a function (v3.21)

**61.1 Three functions were missing from the navigation.** Islam: *"why can't I
see the merchandising, consumer finance, and marketing in the functions
navigation bar? they are still functions the whole point is that they are
planned in a different format."*

`fnHasWork()` was the whole gate — a function appeared when it had capabilities,
or, if it plans in pillars, when it had pillars. That is right for somebody
coming to READ, because an empty page is a dead end, and it is exactly wrong for
the people who have to put something there: **a function with no plan could not
be opened, so the only way to reach it was to give it a plan first.**

Worst on a fresh tenant. Migration 004 removes every capability, so on a clean
slate EVERY function serving the group was missing from the navigation until
somebody uploaded something — and there was nowhere to upload it from.

**The test is EDIT, not view.** `fnCanFill(k)` asks the same grant that decides
whether the plan and the foundation can be authored at all, at the target the
tab would open; `fnShows(k)` is `active && (fnHasWork || fnCanFill)`, and it is
asked ONCE, by both `fnsReachable()` and the shell's `myFns()` — §59 has already
been paid for asking this question in two places with two different answers.

**61.2 An empty page has to say what would fill it.** Both empty states existed
only in theory before, because neither page could be reached. The pillars one
said *"This unit has no pillars yet"* on a supporting function. The projects one
said nothing at all: `[].map().join("")` is the empty string, and an empty
string is a blank page rather than an empty state (§45.2). `fnNothingBehind()`
is one sentence used by all three of a function's pages, because the third copy
is the one that gets left behind.

**61.3 A reading view is not a writable one.** `fnAsUnit()` builds a fresh object
every call and hands out a shared frozen empty where the function has no array,
because a reader must never create the field it was looking for (§50.6). An
import WRITES — and `clearUnitPlan()` ASSIGNS `u.items`, `u.keyObjectives` and
`u.swot` rather than emptying them in place, so a plan applied to the view is
written to an object thrown away one line later.

**This is the silent kind.** The import reports the pillars, measures and
tactics it wrote, the archive is taken, nothing throws — and the function is
still empty when you open it. `fnWritable()` mints the containers (in the
WRITING half, deliberately, which is the only place that mints them) and
`fnWriteBack()` copies the assigned fields back; `unitLikeWritable()` is
`unitLike()` for somebody about to write. `qa.py` asserts it by writing a plan
and then asking the FUNCTION, and the assertion was proved against the fault:
through the reading view the check reports `viewItems: 1, fnItems: 0`.

**61.4 One button, two entries.** Islam: *"Make this part into download Plan
Template and a drop down opens with 2 selections Pillars Template or Projects
Template and same for the Progress."* What was there was a button and, beside
it, a link calling itself *Capability template* — unfindable, and the only place
in the flow where the word for the other half of the product appeared.

It is a `<details>`, not a button and a flag: a menu's action fires BEFORE the
menu closes (§47.2), and a `<details>` closed from inside its own click has not
unmounted the button the click is still in — it hides it. Keyboard and screen
reader come free.

**61.5 A plan template is generic; a progress template is not.** Both plan files
are built against an empty shape with the subject named on the Read me sheet
(§22), so both menu entries are just downloads. A progress workbook is one
subject's current rows, so the subject travels with the format: choosing a
format the selected subject does not keep moves the selection to the first that
does AND repaints, so the select shows exactly what was downloaded.

**The format is READ OFF THE SUBJECT, never stored beside it.** A second field
would be a second copy of the same fact and the two would drift — the list
offering capabilities while the format said pillars, and the select showing
nothing selected. The subject already says which plan it keeps, so changing the
format IS changing the subject.

**61.6 The pillars template now offers the functions that plan in pillars.**
`planSubjectNames()` is units plus pillars-format functions, named once because
the Import page prints the same count. The Read me label becomes *"Business unit
or function"* — and **the reader takes either.** Renaming it without that is
§51.11 exactly: `readmePick()` stops finding the cell, the upload reports *no
business unit called ''*, and nothing says why. The round trip caught it inside
one run. §58 had already settled the principle for the people workbook: **write
the new label, read either — somebody is holding a file downloaded before the
rename.**

## 62 · A function can be deleted, and the refusal is the feature (v3.21)

**62.1 The ask.** Islam: *"give me the option to fully delete functions in the
functions setup."* A function created by mistake, or one the client turned out
not to run, could only ever be **Retired** — a permanent row in a list of
sixteen, with no way to take it back out.

**62.2 Retire is still the default, and this is why.** §33 put responsibility
roles ON the thing, so a function's head and custodian go with it — but a
function KEY is written into five other places: `c.fn` on a capability, `p.by`
on a pillar that scores from it, `p.fn` on a person, `fn:<key>` in the Official
BU list, and every reporting key `REVIEW` and `HISTORY` hold. Removing the row
leaves each of those pointing at nothing, and **nothing would say so** —
exactly the fault §49.3 refused for companies.

So the delete is **refused while anything still points at it, and the refusal
names what.** Measured against the demo before it was written: all eight
functions are blocked, and each for a different reason.

**Anything ever reported is a refusal, not a warning.** A figure that was
submitted is a record, and a record whose subject has been deleted is worse
than a tidy list. That case is what Retire is for, and the refusal says so in
those words. A function's own unreported plan is **not** a blocker: it is the
function's, it goes with it, and the confirmation names what goes.

**62.3 The refusal is where the confirmation would be.** §59 shows a blocked
control DISABLED with its reason beside it, and that is right for a one-line
reason in a cell with room. This cell has neither. The reasons are sentences
that name what is in the way AND where to go and clear it, and the actions
column is **83px wide with four controls already wrapping in it** — measured,
not guessed; the §59 treatment put six lines of grey text under every row.

So the button is always live and pressing it always answers. A disabled button
says "no"; this one says why, and what to do instead. It breaks out of the cell
(absolute, opening leftward so it cannot leave the table) and is left-aligned,
because centred prose is for one line and not for a paragraph.

**62.4 Checked at both ends, and the far end was already right.** The blockers
are asked again on Yes rather than trusted from the render that drew the
button — a confirmation can sit open while something changes underneath it, and
the check that matters is the one nearest the write (§48.2). On the server,
`lib/authorize.js` already classifies a removed function as **setup** three
ways over, so a non-SMO save carrying a deletion is refused with a sentence
that names Setup. Nothing needed adding: §42's "an unrecognised change is the
SMO's" had covered a feature that did not exist yet, which is the whole point
of that rule.

Proved through a throwaway Postgres as well as in the browser: eight functions
in, `hr` deleted, `writeState` then `readState` gives back seven and the key is
absent from `functionKeys`.

**62.5 `--bad` on `--bad-bg` is 4.41.** §38.5's rule — a colour that works as a
FILL usually fails as TYPE — caught by measuring the new panel in all four
palette-and-theme combinations. Fixed for **every** confirmation rather than
only the wide one, because converting some members of a family is worse than
converting none (§40). Worth recording that the contrast sweep did not find it
and could not: a confirmation is not a page, and a sweep that walks pages only
ever sees states that are pages (§41.4, again).

**62.6 `plural()` grew a second form.** `plural(n, "capability")` gave
"1 capabilitys". The explicit plural is optional, so every existing call is
unchanged — and it lives in `plural()` rather than at the call sites because
this file already records "3 pillarss" (§59) as the cost of doing it by hand.

## 63 · Performance opens, reporting is a mode, arranging belongs to the plan (v3.21)

**63.1 Performance is a result of reporting.** Islam: *"generally performance
is a result of reporting, so having inside performance 2 buttons performance
and reporting actually doesn't make sense."*

The Performance tab held two sibling sections, one of them called Performance —
the tab asking its own word twice, and calling the other one a page. Reporting
is not a page you visit: it is what a cycle asks of you for two weeks a
quarter, which §15.10 said in a comment and the navigation contradicted.

Performance is what opens. **Report** is a button on it; pressing it enters a
mode, and Cancel leaves. `REPORTING` holds the **target**, not a boolean, so it
can never open somebody else's report — and it is dropped by every navigation,
which needed the drop to happen on a **tab** change as well as a destination
change. It did not before: only the destination cleared the edit modes, so
pressing Strategy and coming back landed you in the report again.

`leaveModes()` is that clearing, named once. It had been written out by hand at
two call sites and every mode added since has had to be added to both — and
this version adds two more (`REPORTING`, and the plan's pen driving the drag
handles), which is exactly when a fourth copy gets forgotten.

**63.2 Save draft, and it says the true thing.** Islam: *"keep save draft button
as a feeling for the user that he is saving keeping the autosave just in case."*

The autosave is untouched and is still the thing that actually protects the
work. This is the reassurance — and **reassurance that lies is worse than
none**, so it FLUSHES rather than pretending to, and reports which of the real
outcomes happened: saved, already saved, refused, or there is no server here at
all. Opened from a file it says *"Nothing to save — no server here"*, which is
true and is not the word "Saved".

The word is written into the element rather than through a repaint: `paint()`
replaces the button that was just pressed, and the reassurance would vanish in
the frame it appeared in.

Proved against a real server rather than reasoned about: dev-server on a
throwaway Postgres, signed in as the SMO, a cycle note typed, Save draft
pressed — the button says **Saved**, and `select notes from review` comes back
holding it.

**63.3 Arranging belongs to the plan.** Islam: *"the arrange should be something
in the plan that moves pillars up and down or arrange the measures and tactics
tables and eventually the progress and performance pages follow the same
arrangement so in the plan when we press the edit button we find that we can
edit the fields and even rearrange things."*

Right, and it was on the wrong page: the order of a unit's pillars is part of
what was agreed, not part of how it is going. **Progress and Performance need
nothing to follow it** — order is stored on the object, so there was never a
second arrangement to keep in step; asserted rather than assumed, by reordering
on the plan and then reading the Performance rail.

**TWO WAYS IN, ONE MODE.** The SMO's plan pen turns the handles on with the
fields, exactly as asked. A BU head has **no pen** — correcting a plan is the
SMO's (§31) — and could arrange before this, so they keep an explicit Arrange
button, hidden while the pen is on because a button reading "Done" for a mode
it did not start is a lie about what pressing it will do.

**63.4 Two things that had never worked, found by moving them.**

**A pillars function could not be presented at all.** It is drawn by the unit's
pages, so it rendered the unit's Present button, and that handler read
`UNITS[current]` — which for `fn:merchandising` is undefined. §59's `unitLike()`
rule, applied to the one place that still asked differently. The button carries
its target now and the handler resolves it.

**63.5 A handle that renders looks like a feature that was built.** The pillar
rail's grips were bound to **nothing**. The shell chose the drag item selector
from `data-kind`, and `"pillars"` meant the accordion's `.prow-wrap`, which does
not exist inside a rail — so `closest()` returned null and every drag returned
before it started. Measured, not reasoned: **4 grips, 0 bound, 0 items**, on
every unit, for as long as the rail has had handles.

**THE CONTAINER SAYS WHAT IT HOLDS** now (`data-item`), so the two cannot
disagree, and `qa.py` asserts the BINDING rather than the presence — on a unit's
plan and a pillars function's alike (A15).

**63.6 Hidden is not empty, and it had to be both.** The section row kept the
buttons of whatever page was last on screen: hidden, but still in the document,
still a tab stop, and still found by anything that queries for them.

Two things went looking. A hidden control is still focusable, which is §48's
`opacity:0` lesson arriving in a third tree. And the contrast sweep reads the
section buttons after choosing a tab — so with Performance's sections gone it
found **Strategy's left over**, pressed them, and reported what it measured as
`fn/performance/foundation`: seven pre-existing failures counted a second time
under the name of a page it was not on. 53 → 60 → 53.

That is §50.6 for the fourth time, and the shape is always the same: **the check
did not break, it started measuring something else and kept reporting.** The
number moved, which is the only reason it was looked at — so the rule earned
here is the one about baselines: **a contrast total that moves after a change
that touches no colour is a check to read, not a number to accept.** The row is
emptied whenever it is hidden, and the sweep asks for visible buttons anyway,
because a check that trusts the page it is checking is not a check.

## 64 · A third number, and it reverses half a rule (v3.21)

**64.1 The ask.** Islam: *"for the units performance please add to the 2 main
numbers of the objectives and the execution a third number in the middle for the
pillars collective performance based on the pillars measures."*

**64.2 Nothing new is computed.** `unitPillars(u)` is `avg(u.items.map(pillarPerf))`
and has existed since the scoring model did — it was already on screen, in the
rail's footer, as a bare number beside a bare execution figure. What changed is
where it is shown: **two numbers under a list is not the same claim as a
headline**, and this one answers a question the page was not answering.

**64.3 IT REVERSES HALF OF §5's RULE, and the half matters.** `TIP_PERF` said
the objectives figure *"is NOT a roll-up of its pillars' key measures; those are
shown per pillar inside the unit and **never aggregate**."*

The first clause still stands and is the whole reason the two cards sit side by
side: **the objectives figure is the unit's scorecard and nothing else feeds
it.** What is reversed is *never aggregate* — the pillars now have a collective
figure of their own, beside it rather than inside it. The two are meant to be
**comparable and to be able to disagree**: the objectives are what the unit is
judged on, the pillars are how it means to move them, and a gap between them is
the interesting reading. Recorded here rather than quietly edited, because a
reversal is a decision (A7).

Read left to right the three are an argument: **what we are judged on · how the
work we set ourselves is going · whether the work happened at all.**

**64.4 The middle card is where a FUNCTION finally gets a score.** Merchandising
has no key objectives — its foundation is Retail's (§59) — so its Performance
page led with a dash and an execution figure and carried **no measure-based
score anywhere**. It now reads 83%, which is what its three pillars average to
and what Retail's R04 has been scoring from all along. The card was asked for on
a unit; the function got the bigger share of it, because a function that plans
in pillars is drawn by the unit's page.

**64.5 Two things the average had to get right.** A pillar **handed to a
function** has no measures of its own, so its row would read `0` measures beside
a real figure and look like a fault — it says *"from Merchandising"* instead.
And a unit with **nothing scored** reads a dash, never `0`: an average is the
easiest place in the product to turn "unreported" into "achieved nothing", so
`qa.py` blanks every progress figure and asserts the middle card goes to an
em-dash.

**64.6 The tip had to become a function.** Every other `TIP_` is a constant
because it names nothing tenant-specific. This one names the tenant's word for a
pillar, and a constant is evaluated when the file loads — before hydration on a
deployed tenant, so it would say "Pillars" for a client who calls them
Directions. `tipPillars()` is read at render time. Same shape as §30.2, in
prose.

Swept 1920 → 600: three across down to 900, two to 760, one below, no horizontal
scroll at any width (§27.1).

**64.7 It ADDS four to §16.15, and that is recorded rather than hidden.** The
contrast sweep goes 40 → 44, all on `unit/perf` in light mode, all of them the
new card's own big number and its per-cent sign — the identical elements the two
cards beside it already fail on. No new kind of failure and no new selector: the
third card fails exactly as its siblings do, because it is drawn exactly as they
are.

The remedy is known and is one line — §38.5's `-tx` twins, the tokens this design
system already defines for a scoring colour used as TYPE rather than as a fill.
It is **not** applied here, because changing the colour of the two existing
headline numbers is a visible change to a page Islam reads daily and was not
what he asked for (rule 1c), and fixing only the new one would make it the odd
one out of three (§40: converting some of a family is worse than converting
none). It is his call, and it is a small one: all three headlines together, or
none.

## 65 · The register's file carries where somebody actually sits (v3.21)

**65.1 The ask, and why the column was missing.** Islam: *"for the people
register table the downloaded template has only the official BU and not the BU
as well. The BU as far as I understand is the relation we have … we need this in
the download template as if I know some of them I will upload it ready and we
don't need to get them from the audience."*

He is right, and the gap was a consequence of the order things were built in.
§54 put the client's own name for a part of the business in the file. §56 and
§57 then made the place it opens reachable two other ways — the Official BU list
mapping a name to exactly one target, or the person declaring it at their first
sign-in. **Neither of those helps somebody who already knows.** The register
shows both columns side by side; the file it exports should carry both.

**65.2 It is called Unit, not BU.** Islam, on seeing it: *"it needs to be only
Unit not BU as it covers BUs and functions as well."* The column holds a
business unit, a supporting function **or a company** — "BU" named a third of
what it can say. The register's header changed with it, so the screen and the
file use one word.

**THE KEY DID NOT CHANGE.** `PEOPLE_COLS` still holds `k:"bu"`, because a
column preference written before the rename would otherwise miss its key, fall
back to the shipped default, and reappear for everybody who has ever touched
the column chooser (§30.2). The label is what people read; the key is what code
holds.

**65.3 Write the new label, read either.** "BU" was this column's header for
exactly one build, and somebody may be holding that file. `fileUnit()` takes
either — the same rule §58 earned for the Official BU rename, applied forward
this time instead of after the fact.

**65.4 Blank means nothing to say, and that is what makes the two columns work
together.** Fill Unit and it decides. Leave it and the Official BU decides,
where that name points at exactly one place. Leave both and the person stays
where they are. Every other cell in this file already behaves that way (§54), so
the precedence needed no new rule — only for `attachPersonAt()` to move out from
under `if (row.mainbu)`, where filling only the new column would have done
nothing at all and said nothing about why.

**65.5 The vocabulary is `roleWhereLabel()`'s, and the suffix is load-bearing.**
"the group", "Mobile", "Merchandising (function)", "Distribution" — the same
words the Official BU list's chips and the register's own cell show, so the file
and the screen cannot describe one thing two ways. The `(function)` suffix is
not decoration: this tenant has a business unit called **IT** and a supporting
function called **IT**, and a bare "IT" in a spreadsheet names neither.

**65.6 An exact match is answered; the near miss is named.** "IT" is the
business unit's own name, so resolving it to the unit is correct and refusing it
would turn a right answer into an error message. But somebody typing it meaning
the FUNCTION gets the unit and is told nothing — the silent wrong answer §61
refused for capabilities, arriving where a refusal would be wrong. So it
resolves **and** says what else it could have been, as a notice on the review.

**And only where it would move somebody.** Written on the value alone, that
notice fired four times against the platform's own download — §54.4 arriving
through a warning instead of a refusal. A row that leaves somebody where they
already are has nothing to warn about.

**65.7 The Unit list is NOT soft, and the Official BU list still is.** An
Official BU the platform has never met is added unmapped, because that is how
the client's names arrive at all (§54). A unit is the opposite: it exists here
or it does not, and typing a new one cannot conjure one. So the dropdown is the
whole answer and a name outside it is refused by name.

**65.8 A validation range is a POSITION.** Inserting Unit moved Role G→H and
Status H→I, and nothing warns when a range stops matching its column — a Role
dropdown left on G would have offered role names inside the Unit cell, which is
the kind of wrong that looks like a feature. The ranges are derived from
`PEOPLE_FILE_COLS` now, so the next column added cannot leave one behind.

**65.9 A class name is one global namespace.** Islam, on the access matrix:
*"the eye in this table when it's clicked it drops down it needs to stay in the
middle of its box."*

The lit eye's icon sat **11px below the centre of its own 24px button** —
measured, and only on `.on.view`. Nothing was wrong with the button's rules; it
was wearing somebody else's. `.view` is the **page region**
(`.view { padding-top: var(--rail-gap) }`), and the button's state modifier was
the bare word `view`, so the lit eye was given 22px of padding inside a 24px
box.

**§56.7 in CSS instead of JS**, and the same shape: a one-word modifier and a
one-word component in one shared scope, valid on both sides, silent when they
meet. The modifiers are `st-view` / `st-edit` / `st-none` now. `.edit` had not
collided yet — it is renamed anyway, because a family half-converted is worse
than one left alone (§40).

**65.10 AND THE NEW COLUMN BROKE TWO CHECKS, CORRECTLY.** The people-file block
asserts three things about the Official BU mapping — a name that means one
place, one that means nothing, one that holds several. With the download now
filling Unit for everybody, those three stopped observing the mapping at all
and reported where each person already sits: `'group' / 'group'` where
`'retailstores' / nothing` was wanted, and somebody placed at `logistics` by a
name that holds several.

**The product was right and the check was right to fail.** The Unit column
beating the mapping is the whole feature; a check written before it could not
know that. Fixed by giving those three a copy of the rows with **Unit blanked**,
which is the documented *"leave it and the Official BU decides"* path — so the
assertion is now sharper than it was, proving the fallback as well as the
mapping. That is the line between fixing a check and editing it into agreeing:
the behaviour it was written to protect is unchanged, and it is now isolated
well enough to see it.

## 66 · The 1-year view becomes a toggle (v3.21)

**66.1 "For now" was waiting for this.** Islam, 2026-08-23: *"the key objectives
in the units for now hide the 1 year view and just keep the 3 years."* §51.16
made that a hard-coded `false`, and said in the code that "for now" was why it
was a switch and not a deletion. Today: *"for the key objectives for the business
units make a toggle to show and hide the 1 year view in the foundation page."*

**It still starts hidden.** The default is the answer it has been giving for
three versions, so nobody's page changes until they press it.

**66.2 A screen preference, never the state graph.** `localStorage`, key
`smp.ko.year` — the same shape as the theme, the People page's visible columns
and the rail's terse switch (§25, §47.1). One person deciding to see both
horizons must not decide it for the whole tenant, and a toggle that autosaved
would do exactly that.

**66.3 The unit's only.** The group's objectives have always shown both, so
there is nothing there to toggle — the control is absent rather than present and
inert. Hidden in edit mode too, for the same reason the layout switch is:
authoring shows every field there is, and a control that hid one would be lying
about what is stored.

**66.4 One state, so one button.** The layout switch beside it is two choices
and is drawn as a segmented pair; this is one thing that is on or off, and a
two-button control for it would put a permanently-lit half beside a
permanently-dark one — §41.8's argument at the size a card header allows.

`margin-left:auto` sits on the toggle and is removed from the `.minisw` that
follows it: the first auto margin in a flex row eats the free space, so both
carrying one would have thrown them to opposite ends of the header.

**66.5 Both layouts, because they fail differently.** The columns view drops a
grid TRACK (`.ohead.one` exists precisely so the row does not keep a 96px hole);
the chips view drops a line inside each chip. A check on one proves nothing
about the other, so `qa.py` asserts both — 2 columns off and 3 on, and the chip
carrying "3-year" only when the toggle is lit.

## 67 · Two demos, a name that meant two things, and an empty dropdown (v3.21)

**67.1 Filled project and Clear project.** Islam: *"another demo data view … so
when I press on the top view of demo data I get a drop down of 2 things, Filled
Project & Clear Project. The new clear project is a project with the same setup
but with no uploaded data at all, not plans no performance nothing — so I can
explain for them the cycle there."*

**What Clear Project IS: exactly what a client's own deployment looks like on
day one.** That is not a new idea — it is `db/migrations/004-clean-slate.sql`,
which has run once on every tenant since §21. `clearedGraph()` mirrors it
statement for statement, so the screen he shows and the screen they get are the
same screen.

**67.2 So the risk is drift, and it is asserted rather than trusted.** 004 has
already been amended THREE times — §44's figure sets, §54's BU list and spec
010's function pillars each arrived somewhere the clean slate was not looking. A
second copy in JavaScript is a fourth place to forget, and it cannot be avoided:
004 is SQL against thirty tables and this is a graph in a browser.

`scripts/test-clean-parity.js` deploys to a real Postgres, reads back what 004
actually leaves, and compares it field by field with what `clearedGraph()`
produces — reading the function OUT of the source rather than holding a copy,
because a test carrying its own copy of the thing it tests proves only that the
copy agrees with itself. **The comment is not the guard; the test is.**

Confirmed end to end on a live tenant: a clean-slate deployment shows 10 units,
8 functions, 2 companies, 8 capabilities, 1 person and 0 pillars — and Clear
Project shows exactly that, from the full example's 33 people and 25 pillars.

**67.3 The save guard had to widen with it.** Everything asking `mode ===
"demo"` now asks `isDemoMode()`, the save guard most of all: **a Clear Project
that could save would write an EMPTY tenant over a real one**, which is worse
than writing an invented one over it. The banner says which of the two is on
screen, and the second sentence — *only Mobile's plan is real* — appears on the
filled one only: a Clear Project has no invented content to warn about, and
warning anyway teaches people to stop reading the banner.

**67.4 The IT unit becomes "IT Dist."** Islam: *"we have IT in the units and IT
in the supporting functions, let's name the IT unit IT Dist."* Two things with
one name is a real ambiguity, not a cosmetic one — it is the exact case §65.5's
`(function)` suffix exists for, and the one a bare "IT" in a spreadsheet could
not answer. The unit is the group's IT products **distributor**; its own first
clause says so and it wears Distribution's mark, so the name was short rather
than wrong. Migration 018 carries it to a deployed tenant, **matching on the old
value** so a name somebody has since chosen is never overwritten (§51.20).

**67.5 AN INLINE DROPDOWN OVER 255 CHARACTERS IS AN EMPTY DROPDOWN.** Islam:
*"the drop down in the units in the people registry template is empty."*

Excel ignores a data-validation list longer than 255 characters **and says
nothing**: the file opens, the column looks right, and the list is gone.
Measured: the Unit column's 21 places are **301** characters; the Official BU
list beside it is 93. That is the whole of why one worked and one did not.

Both move to a **Lists** sheet and are referenced by range. Both, not only the
one that broke: the Official BU list crosses 255 the moment a client has twenty
departments, and it would fail the same silent way — converting one member of a
family and leaving the other is how the second one gets forgotten (§40). The
sheet is visible rather than hidden, because a hidden sheet is something
somebody deletes by accident and a validation whose range has gone is an empty
dropdown again.

**And the writer refuses now.** `buildXlsx` throws on an inline list over 255
with the count, the length and the column — a list that grows with the tenant
will cross that line one day whatever it is today, and this is the one class of
bug where the artefact looks perfect. Swept across all five workbooks the
platform builds: 24 inline lists, longest 136.

**67.6 RENAMING A UNIT BROKE EVERY SAVE, AND HAD FOR AS LONG AS THE FIX
EXISTED.** The rename in §67.4 would not apply — the round trip died on
`weighting_rows.unit_key` violating NOT NULL.

The line that attaches a weighting row to a unit was written to FIX
name-matching. The note above it records the fault exactly: *"the weighting
table used to match on the name string, which meant a rename silently detached
a unit from its weight with no error anywhere."* It added `key` to every row —
**and went on overwriting that key from the name anyway.**

So the fault it was written against was still live, and worse than silent.
A rename survives the session, because the attach runs once at load. On the
NEXT load the name no longer matches, `row.key` becomes null, and every save
from that moment fails with a constraint violation — **the tenant can no longer
write anything at all.** Renaming a unit is a supported act on Setup → Business
units.

The key the row carries wins; the name-match stays as the fallback for a row
written before rows carried a key. `qa.py` renames every unit, re-runs the
attach the way a load does, and asserts all ten rows still know their unit.

**Nothing in the product would have said a word.** It took a rename plus a
round trip against a real database — and the rename was asked for as a naming
tidy-up.

## 68 · A company gets a page (v3.21)

**68.1 The ask, and the half of §23 it reverses.** Islam: *"we will need to add
a Companies performance page that includes the overall performance of the
company and the general view of the units belonging to them, like the group's
first 2 tabs in the performance."*

§23 settled that a company is **visibility, not strategy: no score, no page.**
Only the second clause moves. A company still carries **no strategy of its
own** — no plan, no foundation, no key objectives, nothing authored. What it now
has is a **reading of the units it holds**, which is a different claim: the
group has always had one, and a company is the same kind of thing over a smaller
list. Recorded as a reversal rather than edited away (A7).

**68.2 The compile, put to Islam and answered.** Each unit's figure weighted by
the weight it **already carries at group level**, re-normalised so the company's
own units sum to 100%. Distribution's 43% share of the group is not spent twice:
the re-normalisation is exactly what dividing by the total of those weights
does, which is why the group's own function needed no change to become general —
`weightedOver(keys, of)` is one function and `groupUnitsObjectives()` is it
called with `UNIT_KEYS`.

The alternatives were offered and rejected. **Equal weight** contradicts the
Weighting tab: a unit counting for 4% of the group would count the same as one
counting for 30%. **Per-company weights** is a second source of weight that can
disagree with the first, and nobody has asked for it.

**68.3 The group button becomes a dropdown.** Islam, asked where a company
should sit: *"make the group button name general and make it a drop down that
opens group and company."*

So the first control in the navigation row **says where you are at this level** —
"Group" on the group, the company's name on a company — and opens to offer the
others. One button where a row of them would grow by one per company, and it
puts the group and its companies where they belong: the same kind of thing, one
above the other.

**With one destination it is a plain button.** A menu holding a single item is a
door behind a door (§32), and it is the ordinary case: a tenant with no
companies has only the group, and a company CEO whose `seeGroup` flag is off has
only their own.

**68.4 One tab, and that is the point.** A tab row of one would be a row saying
nothing — a company has exactly one page because it has exactly one thing to
say. It is gated on the GROUP's Performance key at the company's target, which
means §23's two flags are already the thing that decides: `companyAllows()`
answers for the group, for your own company and for somebody else's without a
new rule.

**`roleOwns()` needed a case for it.** A `co:<key>` target reaches it now, and
without one **a company's own CEO did not own their own company** — which turned
their page into an "other company" and handed the answer to the `seeOthers`
flag. Their own is theirs; anybody else's still goes through the flag.

**68.5 The unit card is EXTRACTED, not copied.** `unitCards(keys)` draws the
Business units section on both pages. Two cards meant to be identical and
maintained apart is exactly how the group and a company come to disagree about
the same unit — and the disagreement would be invisible, because nobody looks at
the two pages side by side.

**68.6 A number that is not a score must not wear a scoring colour.** The third
card is the company's **share of the group** — the one figure that only means
something at this level, since the re-normalised two deliberately forget it. It
is 43%, and `band(43)` is off-track red, so the card said a perfectly ordinary
share of a ten-unit group was failing. `drillCard`'s `plain` option uses the
quiet mark instead. **The bands mean something, and spending them on a number
nobody is judging is how they stop meaning it.**

**68.7 The sweep stopped visiting the group, and crashed rather than lying.**
`walk_destinations()` selects `#units button[data-u]`. The group and the
companies moved inside a `<details>` — they are still buttons carrying `data-u`,
so the selector matched them, found them hidden, and timed out.

The crash is the lucky half. **Filtering to visible ones alone would have been
worse than the crash**: the sweep would have walked the unit row and quietly
stopped visiting the GROUP at all — the page every viewer opens first — and gone
on reporting "ok". §50.6's fault in the one place it costs most. So it walks the
visible row AND opens the selector to walk what is behind it, which is also how
the company pages come to be swept for every viewer at all.

**And THREE places clicked it directly, not one.** `walk_destinations()` was
merely the first to crash; two more — the landing check and the report-mode
check — waited thirty seconds each for a hidden button and took the whole sweep
down with them. That is §51.11's rule arriving as an instruction rather than a
warning: **when a control changes shape, grep the checks for the old selector
before trusting the next run**, and fix all of them, not the one that failed
first. `go_top(pg, key)` is that one place now: it clicks the control where it
is, opening the selector if it has to.

**68.9 Recorded rather than narrowed: a unit head sees the companies.** The
control offers a company to anybody whose group access reaches it — and a
business unit head can already open the group's page, which shows every unit's
card. So this is consistent and leaks nothing. It is more than they need, and
narrowing it would be a rule nobody has asked for; said here so it is a choice
rather than an oversight.

**68.10 THE COMPANY PAGE FAILED CONTRAST TWELVE TIMES AND DID NOT.** With the
company page swept for the first time, the total went 44 → 62 and the new
entries read `company/performance :: B — 1.93 < 3` on the unit gauges, in dark,
on both palettes. The group's identical cards passed, which is the thing that
did not add up: `unitCards()` draws both.

**Because the group's Business units section had never been scanned either.**
The group's Performance page opens on its FIRST section, "Overall performance",
and the sweep scans what is on screen — so the unit cards had been on the group
page for versions without a check ever seeing them. The company page has no
section row, so it put them in front of the sweep for the first time.

**And the failure was the check's, not the page's.** `.gauge` is a
conic-gradient donut and `.gauge::before` paints an opaque hole over the middle
of it. The number sits on the HOLE; `bgsOf()` reads the element's own
`backgroundImage` and measured the number against the ORANGE ARC. Proved by
**sampling the rendered pixels** rather than by reasoning: `rgb(19,28,46)` all
round the glyphs, against ink of `rgb(232,237,245)` — about 14:1, not 1.93.

**§53.7's blind spot, from the other side.** That one recorded a DOM probe
calling a broken build clean, because `elementFromPoint` cannot return a
`::before`. This is the same gap producing the opposite lie: a correct build
called broken, twelve times, and it would have been "fixed" by somebody
repainting a gauge that was never wrong.

`coverOf()` is the rule, and it is narrow enough not to hide anything: a
pseudo-element is the background of what sits inside it when it has content, is
absolutely positioned, and **none of its four insets is auto** — which is the
computed shape of "fills its parent". A small marker pseudo fails all three.

What survives is 6 real ones: `num.final` in the units TABLE view, in light —
scoring colours used as type, §16.15's family, and previously unmeasured for the
same reason. Recorded, not fixed: it is the palette decision Islam has deferred.

---

## 69 · The register, the deck, and the door (v3.22)

A working session rather than a feature: eleven things Islam asked for while
using the product, and the four that turned out to be one argument each are the
ones worth reading.

**69.1 People register, and the block that said the page's own name.** The page
has been called *the register* in every sentence written about it since §35 and
the heading said *People*, so the word people use and the word on the door were
different words. The rename took the intro block with it: a section headed
*The register* two lines under a page headed *People register* is §28's empty
header with the header full, and the sentence beneath it explained the MODEL
(a role is one fact with two editing surfaces), which is what the knowledge base
is for (§30).

**69.2 The role picker sits in its two columns.** Islam: *"keep the unit
selection in the unit and keep the role selection in the role so I can choose
both but each in it's right placement."*

The old control opened a role select AND a where select inside the Roles cell,
so the Unit column sat empty beside a dropdown naming a unit. **One control
spanning two columns belongs in neither.** The role select stays in Roles; the
where select is drawn in the Unit column, under what that cell already says
rather than instead of it — where somebody SITS and where a role REACHES are
two different facts (§46.4), and a picker that covered the first while asking
the second would be hiding the answer.

**69.3 No Give, no Cancel, and no pill.** Islam: *"in the edit just give me the
drop downs to select from for both unit and role without give or cancel —
eventually it's a selection that I can remove after with the x button you
made."*

The result already carries an ×, so the undo is where the confirmation would be
— §62's rule turned round. The role is granted the moment BOTH halves are
answered, which is exactly why both now start on a blank *Choose…* and the
picker opens on no role at all: **a picker that commits on its own must never
commit something nobody picked.** The *No role* pill is hidden while it is open,
because that pill is a READING state and the answer is being typed.

**69.4 Deleted, not retired — and the refusal is the feature.** §62's shape,
applied to a person. Retiring is still right for anybody who was really here;
this is for the rows that never were — typed by mistake, imported twice, a test.
The delete is refused while anything still points at the person and the refusal
NAMES what: a granted role, a figure set they own, a figure they enter, an open
claim. Blockers are re-asked inside `deletePerson()` and never trusted from the
render that drew the button (§48.2).

**A TYPED NAME IS NOT A POINTER.** `t.owner` and `t.collaborators` hold text —
an imported plan names people who were never on the register at all (§50.2) — so
being named on a line does not block. The confirmation says how many lines keep
the name instead, because "deleted" reading as "scrubbed from the plan" is the
wrong expectation to leave somebody with.

**And the door goes with the row.** `people` is TRUNCATEd and rewritten on every
save; `credentials`, `sessions` and `bu_declarations` are not, deliberately and
with no foreign key (§19, §56). That was right while a person could only be
retired: retirement leaves the row standing and both the sign-in query and
`getSession()` JOIN `people`, so the join turns them away. A DELETED person has
no row, so those close by themselves — **and the credential stays.** Person keys
are minted from the name: delete *Ahmed Ali*, add *Ahmed Ali* again, and
`mintPersonKey()` hands back `ahmedali`. The new person inherits the deleted
person's password on their first day and nobody is told.

`change_log` and `login_attempts` are deliberately NOT purged: one is the record
of who changed what and the other of who is failing to get in, whose own
migration says a save must not be able to erase it. **A log that forgets is not
a log.** `scripts/test-person-purge.js` proves it against a real Postgres and
was itself checked by removing the purge, where it fails five ways and prints
the inherited hash.

**69.5 Manage slides was showing a deck nobody would project.** Three
complaints, one cause — Islam: *"the overflowing issue is only in the editing
view, all is ok in the presentation view."* `slidesAssemble()` ran neither
`deckFootMarks()` nor `deckFitPass()`, which are the two steps `openDeckWith()`
runs after building the slides. So content overflowed, the unit's lockup was
missing from every footer, and a long table ran off the bottom instead of
continuing. The mode exists to show the real slide at one tenth (§51.8); it was
showing an unfinished one.

**THE MEASURING BOX HAS TO BE IN THE DOCUMENT**, and that is why this was easy
to miss. The fit pass decides by comparing `scrollHeight` with `clientHeight`,
and both are **0** on a detached element — so a detached deck reports every
slide as fitting perfectly and the pass silently does nothing. §50.3 renders the
deck detached to read its anchors out: right for reading markup, useless for
reading a height. The editor assembles into an off-screen 1600×900 `.deck`
(`left:-99999px`, not `display:none`, which has no layout), inert, removed in a
`finally`.

`data-ed` is minted AFTER the fit pass, or every continuation slide carries a
clone of its parent's key — two rail rows with one key, and the arrows stick.

**69.6 Arrows walk the deck while it is being adjusted.** Up/Down because the
rail is a vertical list, Left/Right because it is a deck, Home/End for the ends.
Taken only when focus is on nothing that reads them: a `<select>` and a
`<textarea>` get the same courtesy the guard already gave `<input>`, because a
picture slide's pane carries both and **stealing Down from an open dropdown
takes away the ability to choose anything.**

**69.7 Fullscreen gives the whole screen to the slide.** The 62px strip stayed
up — 7% of the projected image spent on controls the room can see and the
presenter does not need. It hides on entering fullscreen and returns for 2.2s on
a move, a touch or a key, because it carries Exit and **a presenter who cannot
find the way out of somebody else's laptop is stranded.** `transform` rather
than `display`, so the stage's height never changes and `deckScale()` is not
re-running on every mouse move. The class is set from `fullscreenchange`, never
from the button: Escape and the browser can both leave fullscreen. Measured: the
stage 838 → 900, the deck 0.931 → 0.991.

**69.8 Slide headings go bold.** Measured before changing anything: 400 in the
projector AND in the editor, identically, and 400 since the deck was written —
so not a regression and not an editor-only difference. But `--serif` resolves to
the sans stack (there is no serif face embedded, §38.7) and a display heading at
400 in a sans reads *light* rather than *quiet*. Put to Islam with the
measurement; he chose bold. The eyebrows, `.dlab`s and table headers were
already 700, so the deck arrives at one weight. Checked after: same slide count
on all ten units, so nothing re-split.

**69.9 The dot on Performance means something.** It was
`.tabs button.primary::before` — painted on whichever tab is the landing page,
on every destination, always. So it said *this is the regular view*, which the
tab being there already says, while looking exactly like the marks the rest of
the platform uses for something outstanding.

`reportPending()` is the one place that decides: **this subject owes a
submission on an open cycle, and you are somebody who could make it.** Three
things it deliberately is not — not the group's and not a company's (neither
submits, so *has not submitted* is not a state they can be in, §68); not
"somebody, somewhere, has not submitted", which is the SMO's board and needs a
page rather than a dot; and not shown to a reader, because `canSpeakFor()` is
the same question the Submit button asks (§50.4) and **asking it differently
here is how a screen comes to nag somebody who has no control that would clear
it.**

To the RIGHT of the word, as asked — and that is where it belongs: a mark after
a word annotates it, a mark before one is a bullet. A real element rather than a
pseudo, because the condition lives in JS and because §68.10 records what
pseudo-elements do to the contrast sweep.

**And Strategy comes first.** §28's argument stands and this is the tab row
catching up with it: what was agreed is what people come to read and the score
is a consequence of it — which is already why a unit and a function both OPEN on
their plan, while the row said the opposite left to right. `primary` keeps its
own job, which is not order.

**69.10 A function has an Overview, not a Foundation.** Islam: *"the word
foundation is confusing, the capability doesn't have a foundation"* — and, on
the other kind, *"the function that plans in pillars has overview as well, the
foundation is only for business units."*

The page had been saying it in prose for versions: a capability has no clauses,
no aspiration and no SWOT, and its foundation IS the group's (§15.1). **A tab
called Foundation over a page whose first sentence denies there is one is the
label arguing with the content.** Both formats get the same word, because they
are the same product (§53.5) and a label that changed with the format would be a
third thing to keep in step. The KEY stays `found` and the access key stays
`k_found`: renaming either loses every stored preference and every grant
pointing at it, for a word (§65, §58).

**69.11 The door takes an email address.** Islam, locked out of his own
deployment with a password he had just issued himself: *"on login it's asking
for your person key, it should ask for my email and the emails were uploaded in
the sheet to the people registry."*

He was right and the diagnosis is worth writing down: **the one string the door
accepted was the one string nobody had.** A person key is minted from the name
(`mintPersonKey`) and appears in exactly two places — a row's hover title, and
the Set-a-password prompt. The password was fine; the username was undiscoverable.

**THE KEY STILL WORKS**, and that is not tidiness. The bootstrap SMO has no
email at all (§43.8 keeps `SMO` / `1234` with `must_change` so a fresh
deployment has a way in), and neither does anybody whose Email cell is blank —
today every row of the demo seed. A door that only takes an email locks all of
them out, and **a deployment nobody can enter is not a deployment.** Resolved on
the server from ONE query, because two identifiers answered by two lookups are
two doors.

**TWO ROWS, ONE ADDRESS** is a real state — a shared inbox, or somebody imported
twice — and nothing has ever enforced uniqueness. Signing one of them in is the
worst outcome available: nothing on the screen would say which of the two they
had become. So both are refused, and the door SAYS SO, at Islam's direction.
That is a deliberate trade against §43.3's rule that a refusal must not confirm
which names exist: the person stuck cannot fix it themselves and has no other
way to know who to ask. It records a failure like every other refusal — and the
limit that actually bounds the enumeration it opens is the **25-per-address**
one, not the 8-per-key one, because somebody probing addresses varies the key
every time.

Two smaller things found while tracing it. `setPassword` stored the key as typed
while `login` lowercases before looking it up, so a mixed-case key would write a
credential nothing could ever match — the correct password refused for ever,
with nothing saying why. Latent rather than live (every minted key is already
lowercase) but **precisely the shape of the fault reported**, and a pair of
comparisons that normalise differently will find each other eventually. And the
sign-in card focused the password unconditionally, which was right over a fixed
name and wrong the moment there was a field above it.

The register gained the two facts that became access facts that day: **N with no
email** and **N addresses on more than one row**, both counted over active
people only and both naming the rows in their title. And the sign-in name is an
off-by-default column: §35 was right to take it out from under the name, and it
is a diagnostic now rather than the thing everybody needs.

Everything after the password already worked and needed nothing: the forced
change (§43), and the *where do you work* question with a short list narrowed
from the person's Official BU **on the server** (§56, §57).

**69.13 The pen reaches the projects page, and both pages can add.** Islam:
*"in the projects and pillars pages I need to have the edit with include the
arrange and add access, to edit current projects and pillars or add one."*

The pillars page has had a pen since §31 and drag handles since §63.3; the
projects page had **neither** — §53.5 exactly, the two pages fine *differently*.
It is the SAME pen (`EDIT_PAGE.plan`) and the same gate (`mayEditPlan()`, the
SMO's alone): giving a function's plan a looser gate than a unit's would be
inventing that decision on the quiet.

§22 is untouched. A plan still ARRIVES by upload, codes are still minted on
arrival, replacing still archives. This is the pen doing one more thing —
**a pen that can retype every field but cannot add the row somebody forgot is
half a pen.**

**ADDS APPEND AND NOTHING RENUMBERS.** `renumberUnit()` rewrites every id from
POSITION, which is right when a whole plan is authored at once (import,
restoring an archive) and quietly destructive here: ids are what a reported
figure, a focus mark and a cycle snapshot are keyed on (§48.1), and **reordering
deliberately does not renumber**, so after one drag a pillar's position and its
id already disagree. A new row is appended and given an id of its own; removing
one leaves every other id untouched, which is asserted. And not `length + 1` —
after a removal, `-P3` can still be held by the last of three.

**69.14 The short list came back empty for the one tenant it was built for.**
Islam: *"on the selection of the unit on login the whole list was brought while
we already set the Official BU he belongs to."*

§54's vocabulary meeting §57's narrowing. An Official BU points at whatever
`r.at` can name — a unit, `fn:<key>`, `co:<key>`, `"group"`, or nothing — and
the sign-in list offers **units and functions only**, because those are the
places a person can BE. In this tenant Distribution is a COMPANY (§54.1: six of
the ten client names are not units here), so `co:distribution` matched nothing,
`near` came back empty, and the narrowing collapsed into *no narrowing at all* —
failing in the safe direction and therefore invisible.

**A company expands to the units it holds**, which is the honest reading: *you
work at Distribution* narrows the question to Distribution's three units rather
than answering it. **The group expands to nothing** — everything is under the
group, so it narrows nothing, and a heading saying "yours" over the full list
would be a lie about where somebody works.

And the test found a second one underneath: **`active` is a COLUMN on units and
functions, not a key in `extra`** — only a PERSON's retirement rides in the
extra blob (§35). Both queries read `extra->>'active'`, so COALESCE returned
`'true'` every time and **a retired unit has been offered on the first-sign-in
list since §56 shipped.** The fourth instance of a comparison against a field
nobody sets, and the first to fail in the GENEROUS direction.

**69.15 A control that is dangerous when wrong must fail closed.** Tarek — a
contributor holding no role — was served the viewer switcher AND the Demo data
button, with the switcher showing somebody else's name as the person signed in.

**The fault is the direction of the gate, not the test.** Both controls sit in
the markup and were CORRECTED afterwards: shown by default, hidden by a step
that runs later. Anything that stops that step — an exception above it, an
early return, a person the register does not hold — leaves them standing, for
everybody. `isSMOSession()` is asked by both now, so the two cannot disagree
about who the SMO is.

**And if the register does not hold the signed-in person, render nobody.**
`VIEWER` was simply left where it was — at whoever the list happens to start
with — so a person the platform could not find was shown **the first person's
view**, wearing their own name in the corner. The SMO's pages served to somebody
who is not the SMO, with nothing on screen saying so. It cannot happen from a
save (the session JOINs `people`), and *"it cannot happen"* is not a reason to
render the wrong person when it does.

**69.16 Email leaves the Contact column.** Islam: *"the contact in the People
register table needs to split the email from the contact number."* §54 put them
together as one answer to one question — how you reach somebody — and that
stopped being true the day the email became **how somebody signs in** (§69.11).
It is not a contact detail any more; it is their name at the door, and it is the
column the SMO reads when access does not work. Its own column, shown by
default; the number keeps one, off by default. The `contact` key is **gone**
rather than repurposed: a stored preference for "contact" meant both, and
reading it as "email" would turn one answer into another (§30.2, §65).

**69.17 The two facts that could be read and not corrected.** Islam: *"in the
People register I need to be able to edit the Official BU and the Unit."* They
were the only two on the register that could be read and not fixed: the Official
BU arrives with the file, and the Unit was writable only through the *"They said
X — Use it"* note — so a row the file placed wrongly could be corrected nowhere.

Both are selects, for opposite reasons that are both §54's. **The Official BU
list is SOFT** — a name not on it is added unmapped by the file reader, because
a fresh tenant could never read its first file otherwise — so the select carries
the list plus whatever this row already says, and a new name is added to the
list unmapped through `mainbuList()`, the same door the importer uses. **A unit
is not soft**: it either exists here or it does not, and typing one cannot
conjure it. The Unit writes through `attachPersonAt()`, the one place that
answers "where does this person sit".

**69.18 The switcher a non-SMO must never see, and the list that stayed long.**
Two of §69.14 and §69.15's fixes did not take, and both failures are worth more
than the fixes were.

**THE BUTTON IS FOUND BY POSITION, AND SOMETHING WAS INSERTED BETWEEN.**
`searchsel.js` states the contract in its own header, rule 3: *"sync.js hides
the viewer switcher for anyone who is not the SMO by setting `hidden` on the
select itself; the button follows it, or a non-SMO would get a live control in
front of a hidden field."* It followed by reading `sel.previousSibling` — and
sync.js, in the same breath as hiding the select, inserts the person's name with
`box.insertBefore(nm, sel)`. The name lands **between the button and the
select**, `previousSibling` stops being the button, the sync is skipped, and the
button stays live showing whoever it was built with.

Ashraf saw *"Signed in as [Mohamed Essam ▾]"* beside his own name: a working
viewer switcher, on a screen where it must never appear, naming the SMO as the
person signed in. The comment beside the insertion had even anticipated the
shape of it — *"reparenting the select would break that"* — and guarded against
reparenting, not against inserting between. A WeakMap cannot be broken by
either: **the pairing is held by identity rather than by adjacency.** And
sync.js now takes the button down itself rather than describing the removal to
a component two files away.

**HALF THE REGISTER HAS NO OFFICIAL BU.** §57 narrowed the first-sign-in list by
the Official BU and nothing else, and in Raya's own file some rows carry an
Official BU and no Unit while others carry a Unit and no Official BU. For
everybody in the second group the short list was empty for a reason that had
nothing to do with them: **the SMO had already said where they sit, and the
question ignored it.** The person's own attachment is added to the offer — not a
second source of truth, since `unit_key`/`fn_key`/`company` are what personAt()
already reads (§54.1), and the declaration still grants nothing either way.

`near` is also filtered against what the list actually serves, so a retired unit
cannot be smuggled in by an Official BU or by a stale attachment — §57's gate
reads `near.indexOf`, so an `at` the page cannot find makes the "yours" group
claim members it never renders.

**69.19 A vertical sticky on a table CELL does nothing, and says nothing.**
Islam: *"for the People register table please make the 1st column and first row
sticky."* Written the obvious way — `thead th { position:sticky; top:0 }`, which
is what `.cfg.srctable` uses and what every reference shows — **it did not
work**, and it failed the way this file keeps recording: `position` computed to
`sticky`, `top` to `0px`, and the header scrolled away with the body. Chromium
does not honour a vertical sticky on a table cell under
`border-collapse:collapse`. The same declarations on the `<tr>` hold it.
Horizontal sticky on a cell DOES work — measured in the same run, `td.pname`
held its column — so **the two axes live on two different elements, and that is
a browser fact rather than a preference.**

**TWO COLUMNS ARE FROZEN, NOT ONE.** The first is `#`, which alone would keep a
row number and lose the name: a frozen column that answers *which row is this*
with *row 17* has frozen the wrong thing.

**AND THE OFFSET IS A MEASUREMENT, SO THE WIDTH HAD TO BE ONE.** `left` for the
second frozen column must equal the first's rendered border-box width, and under
`table-layout:auto` a declared `width` is a suggestion the browser may grow —
the `#` column rendered wider than its 38px, so Person sat on top of it and the
header read "# J". Pinned at min, max and width so auto layout has nothing left
to decide.

A retired row's frozen cells dim their INK rather than their opacity:
`tr.retired td` carries `opacity:.62`, and opacity dims the background too — so
the two sticky cells would have gone translucent and every row scrolling past
would have ghosted through them.

**69.20 Delete permanently was built and could not be reached.** Islam: *"allow
me to remove a full employee in the register, not only retired"* — which §69.4
had built. Measured at 1440px: the row's kebab sits **317px past the right edge
of its own scroll box**, and Delete permanently is inside that menu. **A control
nobody can get to is a control that was not built.** The register grew a
horizontal scroll the day it grew its ninth column (§54.6, recorded then and not
acted on), and every per-row action has been behind it since.

The actions column freezes to the right, the mirror of the pair on the left —
and that is the argument for both: **what you scroll to reach is the thing you
do to a row, and what you need beside it is the name of the row you are doing it
to.**

**69.21 The first few names in the column, the whole one on the row.** Islam:
*"for the employees table names let's make them only the first 2 names so the
first column wraps better"* — and then **three**, having seen two. Two lost the
surname on the Arabic naming pattern this register is full of: *Mohamed Hamed
Ahmed Hamed Ahmed* is given name, father, grandfather, so two words name a
person and their father and nobody's family. The count is a named constant
(`SHORT_NAME_WORDS`), because the next time it moves it will move for a reason
and the reason belongs beside the number. The file carries full legal names — *Mohamed Hamed Ahmed Hamed
Ahmed* — and that column is now FROZEN, so every character it takes is taken
from every other column at every scroll position.

**DISPLAY ONLY, AND THE EDIT FIELD KEEPS THE WHOLE NAME**, which is the trap and
it is worth writing down: the input's value is what `fieldWire("pname")` writes
back to `p.name`, so shortening the *value* would have overwritten the
register's real names with two words each — silently, on the first keystroke in
any row, with the file's own copy gone. Asserted by firing a `change` on an
untouched field and reading the stored name back.

**69.22 A password is issued in the page, not in a dialog.** Islam: *"I can't
set the temp password"* — and the code path was **fine**. Driven on the served
app against a real Postgres it worked perfectly, which is what made it hard:
there was no error anywhere, on his screen or in the logs.

The control was a native `prompt()`, and it has one failure nothing can report:
**a browser is allowed to suppress it.** Chrome offers *"prevent this page from
creating additional dialogs"* after a few, and a suppressed prompt returns
`null` — which the handler read as *cancelled* and did nothing about. Silently,
for ever, with the button still there.

It was the wrong control for three more reasons that were true all along: a
password manager cannot see into it, the rules could not be shown until after
they had been broken, and there was nowhere to put the password afterwards — an
issued password exists **to be read out to somebody**, and the SMO had to
remember what they had just typed into a dialog that was already gone.

So it is a panel in the row, where the delete question already is. It carries a
field, a **Generate** button, the rules in front of you, and — after it is set —
the password itself, to copy. The two collective actions open the same panel:
both were a `confirm()` in front of a `prompt()`, and on the destructive one a
suppressed confirm meant **a reset proceeding because its warning had been
silenced**. That warning is in the panel now.

**THE POLICY IS NOT RESTATED AS A CHECK.** The rules are printed so somebody can
read them; the only thing that REFUSES is `auth.passwordPolicy` on the server,
whose sentence is shown verbatim. A second copy here would be a rule in two
places (§42).

**Generated from `crypto`, never `Math.random`** — this is a credential, and a
predictable one is worse than a weak one somebody chose. One character is taken
from each required class first so the result cannot fail the policy, then the
rest is filled and the whole thing shuffled: building it in class order would
make every generated password start with a capital and end with a symbol.

Two things found while building it, and both are §69.20's bill:

**FREEZING A COLUMN MAKES EVERY CELL IN IT A STACKING CONTEXT.** `position:
sticky` plus a z-index does that, so the menu's own `z-index:40` is resolved
*inside its cell*, and the sticky cells of every LATER row paint on top of it.
The panel was drawn correctly and buried under the rows beneath it — which read
on screen as clipped text and a squashed field, not as a stacking problem. The
open row's CELL is lifted; the menu's z-index cannot escape a context its parent
created.

**AND `node --check` CANNOT SEE INLINE SCRIPT.** A splice left a stray `});` in
`shell.html`, every file "passed", and the built page died with *Unexpected
token ')'* — a blank platform. The build is now parse-checked by pulling every
`<script>` block out of the built file and running `new Function` over it: 15
blocks, and the one that mattered was the one no tool was looking at.

## 70 · Edit and Add were built, and the pen was invisible (v3.22)

**70.1 The ask, and what was already there.** Islam: *"in the project page I need
to have the edit and add access, to edit current projects or add one. Same for
the strategy plan page for the units — I can edit, which includes the arrange
and Add, so I can add a pillar if needed."*

**All of it was already built.** Measured rather than assumed, by turning the
mode on and counting what appears:

| | fields | drag handles | Add |
|---|---|---|---|
| capability · Projects | 34 | 14 | project · deliverable · outcome · milestone |
| unit · Plan | 25 | 13 | pillar · measure · tactic |

What was missing was any way to find the way in: the pen sits in `.paneact` at
`opacity:0` **until the pane is hovered**, on the two pages whose whole job is
reading. On a touch screen there is no hover at all — so a plan could not be
corrected from a tablet in a meeting, which is exactly where a plan gets
corrected.

**70.2 §30's rule was right for a card and wrong for a pane.** "The pen-on-hover
replaces the Edit bar where an edit mode exists" still holds for `.hoverpen`:
a card is small, the pen sits on its own heading, and the thing you hover IS the
thing being edited. A **pane** is 920×1015 and the pen is a 28px square in one
corner of it. One rule was being applied to two components that do not behave
alike. The pane's changes; the card's does not. Only plan-carrying panes have a
`.paneact`, so converting that rule converts the whole of its family (§40).

**70.3 A DOM check would have passed every day this was broken.** `mayEditPlan()`
returned true, `grant("u_plan")` was `edit`, and `querySelector('.penbtn')`
found the button — all three green while the control could not be pressed. So
`qa.py` **clicks it the way a person does, with no forcing**: Playwright refuses
to click something invisible, which is the whole assertion. It then counts the
fields, the handles and each Add by name, presses Done, and checks that a unit
head — who may not correct a plan (§31) — is still offered nothing.

"Built and could not be reached" is the second one this week, after the
register's Delete (§69.20). Both were found by a person trying to use the
product, not by a check.

---

## 71 · Feedback, and a table that stays still (v3.23)

**71.1 Feedback lives outside the state graph.** Islam: *"some sort of feedback
box in the bottom right of the page where the person who is using it, if he
finds any issue with a page or a number, can submit an issue or feedback or a
request … and this feedback should land in the admin page."*

Its own tables and its own endpoint, for the reason `credentials`, `change_log`
and `bu_declarations` have theirs: **a save TRUNCATEs thirty tables CASCADE**, so
feedback stored in the graph would be erased by the next autosave — by the very
person it was reported to. A foreign key to `people(key)` would be worse still:
the CASCADE would take the whole table. `person_key` is plain text, resolved at
read time, so **a report from somebody since deleted still stands** — the report
is about the PRODUCT, and it does not stop being true when its author leaves.

**WHERE IT WAS RAISED IS CAPTURED, NOT TYPED.** The page, the target, the cycle
and the build are what the screen already knew; a description of them would be
wrong more often than the machine's answer, and asking for it is asking somebody
to do the computer's job.

**Who may do what is the design, and the refusals are the part worth testing.**
Anybody signed in may RAISE one — the people most likely to spot a wrong number
are the ones with the least access, and a feedback box only they cannot reach is
worse than none. Everybody reads their own, so nothing disappears into silence.
The SMO reads all, sets status, removes. Islam chose a **thread** over a bare
status, so both sides can reply on an item that is theirs — and a reply from the
SMO moves it off *new* by itself, because **a status you have to remember to set
is the status nobody sets**.

**THE LIST CARRIES NO SCREENSHOT.** The image is three orders of magnitude
larger than the rest of the row, and forty reports would carry forty images to
draw forty one-line rows. `has_shot` says whether to offer it; `one` fetches it.
A `shot` that is a URL is REFUSED — the admin page renders it into an `<img>`,
and a URL is somebody else's server learning who opened the report.

And `getPool()` was copied into two endpoints identically and would have been a
third. What is copied is **the six env-var spellings** Neon and Vercel use
between them, so a third copy is a third place to forget one the day the
integration renames something. One list, in `lib/state-io.js`.

**71.2 A text field writes its value and repaints nothing.** Islam: *"when I
edit things of the table let the table stay stable — it jumps to other cells or
refreshes the whole page."*

It did. Every editable field called `paint()`, which rebuilds the entire panel.
Tabbing out of a name threw away **the scroll position, the focus, the open menu
and every enhanced select on the page**, and rebuilt thirty-three rows to record
one word — on a table you edit by moving across it, so it happened on EVERY
cell. Measured, with the repaint in place: scroll `300,120` → `0,0`, the row
moved 305px → 605px, focus lost. Without it: all three hold, and the value is
still written.

**Nothing needed the repaint.** The value is already correct in the box it was
typed into; the copies of it elsewhere — a chip counting who has no email, a
name echoed in the navigation — refresh on the next natural paint. That is a
summary going stale for a few seconds against losing your place on every field
exit, and it is not close.

**SAVED, THOUGH.** `SYNC.afterPaint()` schedules the write and was only ever
reached THROUGH `paint()` — so removing the repaint without `fieldSaved()` would
have left every edit on screen and never in the database until something else
happened to repaint. That is the trap in this change and it is the whole of it.

Applied to the register's five fields, to **every field on a plan** (`data-fld`
— a pillar's name, a target, an owner, a tactic, on the one screen somebody
fills in left to right), and to the plain name fields on Business units,
Functions, Companies and Capabilities. **`mbname` keeps its repaint**, and that
is the line: renaming an Official BU can be REFUSED, and it changes what other
rows point at.

**And a frozen cell must not paint outside itself.** The name input carries
`min-width:170px` plus the cell's padding, so on a narrow column the box spilled
past the frozen boundary and sat on top of the column scrolling underneath —
which is what made the register look like it was flipping between two layouts.
`overflow:hidden` on the sticky cells, and the input bounded BY the cell rather
than by a number of its own, so the two can never disagree about where the
column ends.

**71.3 The table standard, and what it cannot reach.** Islam, as a standing
rule: every table gets a search with quick filters, sortable headers, a frozen
first row and column, a columns chooser, an edit pen, Add, and Remove-or-retire
with warnings — **in Setup and Manage only** (asked, and answered: the plan and
reporting tables are not in scope).

That answer removes the one real conflict. On a plan table the ORDER IS THE
DATA — it is what was agreed, it is stored, and it drives the deck, the export
and the drag handles (§63.3) — so a sortable header there either shows an order
that disagrees with everything else or rewrites the plan when somebody clicks a
column heading. In Setup, row order carries no meaning and the question does not
arise.

The audit, which found less than expected: **nothing in the platform sorts** —
zero sortable headers anywhere. Only the People register has a columns chooser
or a frozen row. **No table filters its own rows**; the three search boxes are
the people PICKER inside dropdowns and the Figure-sets fill table. Eight of the
sixteen Setup pages have an edit pen, three have an Add row, four have a
remove.

What genuinely cannot have all seven: **Roles & access** has no rows to add (the
seven roles live in `lib/rules.js`; adding one is a code change and a security
decision), **Archived plans** can be removed but never added (they are records),
**derived tables** — group and company performance, weighting composites — have
no row to add because the row is a calculation, and on the 4–10 row tables
(Labels, Scoring bands, Weighting factors) a search box, a freeze and a columns
chooser are controls that hide nothing.

---

## 72 · Communication: a page for what the platform says out loud (v3.23)

Islam: *"we need to setup an email in the people registry for now to send for
the whole list or certain roles or certain units etc. — a communication email"*,
then, once the Resend variables were in place: *"for the email sending I need to
have a test email send to see the design of the email and the sender of the
email name etc. A communication setup page should handle all the relevant
details."*

This is the second half of that ask: the **channel** — can this deployment send,
what does a message arrive as, what does it look like, and prove it. Choosing
recipients (the whole list, certain roles, certain units) is the composer, and
it goes on top of this rather than beside it.

**72.1 The address is a deployment decision; the name is a screen one.** Two
halves, deliberately kept apart:

| | Where it lives | Why there |
|---|---|---|
| the sending **address** | `SMP_MAIL_FROM` in the environment | it is tied to the domain verified with Resend — changing it is a redeploy |
| the **display name** | `comms.fromName`, the tenant's own settings | "Raya Trade" is a thing to change on a Tuesday |

Together they make `Raya Trade <smp@domain>`. Written apart, they cannot drift:
there is exactly one place each lives. **The key never leaves the server** —
`RESEND_API_KEY` is read in `api/mail.js` and nowhere else, and `status` reports
whether a key is *present*, never what it is.

**72.2 "Present" is not "accepted", and "accepted" is not "verified".** Three
different facts, and the first draft of the page collapsed them into one. An
environment variable being set says nothing about whether Resend knows the
value; a key being accepted says nothing about whether the domain will reach
anybody but the account holder. So the status section reports each separately,
and — the part that matters — **it reports only what was actually asked**: the
key is put to Resend exactly once, by the domain check, so with no address
configured there is nothing to check a domain for and the page says *"it has not
been put to Resend yet"* rather than claiming an acceptance nobody established.
A refused key is reported on the **key** row, not the domain row: "not verified"
would send somebody to their DNS records over a typo in a variable.

Matched on Resend's **message**, not its status code, because Resend answers an
invalid key with **400** rather than 401 — measured against the live service,
not assumed. The status codes stay in the test as well, so if Resend corrects
that, the code becomes the honest signal.

**72.3 The preview is the real builder's output, in a shadow root.** `MAIL.html()`
draws the preview and the test send carries the same string — a preview drawn
from anything else is a picture of an email nobody receives (§50's rule about
the deck, one medium further out).

It is a **shadow root and not an iframe**, and that is the tenant's own CSP
deciding: `frame-src 'none'` (§43.6) would have drawn a blank box. A shadow root
gives exactly what the iframe was for — nothing in the platform's stylesheet can
reach in, nothing in the email's markup can reach out — with no policy to widen.
Measured: the 600px card renders at 600px, centred, in Helvetica, with the
platform's four embedded faces nowhere near it.

**72.4 Email is not the web, and the whole shape of `mail.js` is that sentence.**
Tables and not divs (Outlook renders through Word: no flexbox, no grid, no
reliable `max-width` on a block). Every style inline (Gmail strips `<style>` on
some clients and keeps it on others, so a design that depends on it is right
half the time). Colours literal, because `var()` is not supported.

And **no data-URI image**, which cost a decision. The tenant's mark is stored as
a data URI (§52) and **Gmail and Outlook block data-URI images outright** — not
"sometimes hidden", a broken-image box in the clients most people read mail in.
So the header is typographic. Carrying the real mark would mean serving it from
a URL an email client can fetch unauthenticated, which is a decision about making
a logo public and Islam's to make rather than mine to assume.

**72.5 A COLOUR THAT WORKS AS A FILL USUALLY FAILS AS TYPE — the sixth time
(§38.4, §38.5).** The header's kicker was written in the tenant's accent over
the tenant's panel: **3.94:1** on the house pair, measured. This project records
that trap by number in five places and the first draft of this file walked into
it anyway.

The accent moved to where an accent belongs — **3px of fill under the header**,
which has no ratio to meet and reads as the tenant's mark on the message — and
the kicker takes the panel's own ink softened toward it (7.41:1). A second
failure came out of the same measurement: the line under the card was #8A94A6 on
the mail ground at **2.83:1**.

**And the ink is DERIVED, not assumed.** White-on-panel is only safe while the
tenant keeps a dark bar; `--panel` is whatever Branding sets. The platform
derives `--panel-ink` for exactly this reason and an email cannot read a custom
property, so six lines of luminance maths live in `mail.js`. Asserted against a
light bar and a bright accent as well as the shipped palette.

**`scripts/test-mail-contrast.js` reads the builder's OUTPUT**, not a list of
the colours I intended — arithmetic on what I intended proves what I intended.
It tracks the ground with a **stack of `<td bgcolor>`**, because the first
version looked backwards for the nearest one and reported the CTA's white label
as white-on-white: the button sits inside the card's cell and carries a ground of
its own, so a check that measures the wrong thing fails for reasons that have
nothing to do with the product (§50.6, from the other side). 16 pairs, 0
failures, and proved by putting the accent back and watching it fail.

**72.6 The sentence saying what a send did is written into the element.** A
repaint would replace the button that was just pressed (§63.4). It is also
**read once and cleared**, or "API key is invalid" would still be sitting under
the button on a visit three days later, describing a send nobody made. And the
relayed error is **Resend's own sentence or ours, never undici's**: a refusal
from Resend names the real cause far better than anything generic could, and a
network failure names nothing at all — "fetch failed" tells somebody neither
what broke nor whether the message went.

**72.7 Nothing needed a migration, and nothing needed a second rule.**
`comms` rides in `org.extra` like `branding`, `sets` and `mainbus` — proved
against a real Postgres by round-tripping four fields. `lib/authorize.js`
already refused it as `unknown`, which is §42's "an unrecognised change is the
SMO's" covering a feature that did not exist yet; it is **named** as `setup`
anyway, so the refusal sends somebody to Setup rather than reporting "the
group's comms" (§16.7). `c_comms` is `area:"a_setup"`, so the matrix already
says only the SMO — and `api/mail.js` asks the same question on the server,
because a page that only hides a control is decoration (§42).

**72.8 The accessor returns a shared frozen empty (§42, §50.6).** `comms()`
never creates the field it was looking for; `commsWritable()` is the writing
half; clearing the last field **deletes the key again**, so a tenant that has
set nothing writes nothing. This is the exact fault `branding()` taught by
inventing a four-null object the database never held. Asserted in the browser:
clear both fields and `'comms' in GROUP` is false.

**72.9 Fields save without repainting (§71.2).** `fieldSaved()`, not `paint()` —
a repaint on `change` replaces the field somebody has just tabbed out of. What
does have to follow the edit is the preview, so it is redrawn on its own: one
element, not the page.

**72.10 The pen does something here, and the sweep found a seventh §38.5.**
Branding draws an edit icon and gates its fields on the grant alone, so its pen
is decoration — a control that changes nothing is worse than no control. Four
settings that go out over the organisation's name are worth one deliberate press
first, and it is the shape Islam asked every Setup table to take.

Putting the Send-a-test button on the page also put `.editbtn.apply` somewhere
the contrast sweep could reach it for the first time: **`--good` as the word,
3.77:1 on slate/light**, while `.editbtn.danger` two rules below already took
`--bad-tx`. Half a family converted, which is worse than none — and it had been
sitting unread on Import's two Apply buttons, which only appear once a file has
been chosen. The border keeps `--good`; a border has no ratio to meet.

The other six failures in the sweep are `num.final` on the company and units
table views, which are §16.15's deferred palette decision — **recorded, not
fixed, and unchanged by this version**.

**Still open, and deliberately:** the composer — choosing the whole list, certain
roles or certain units, which is the half of Islam's ask this page is the
foundation for; and whether the tenant's mark can be served from a public URL so
an email can carry it.

---

## 73 · The person box, and a stripe that was painting nothing (v3.23)

Islam, with a screenshot: *"still there is visual issue see the person box"* and
*"we need alternating colors with white and grey across the tables."*

**73.1 A CLASS NAME IS ONE GLOBAL NAMESPACE — §65.9, in the file that records
it.** §69.19 froze the register's first two columns and named the name cell
`pname`. `.pname` has been the **pillar rail's** name block since 1.7:
`display:flex; flex-direction:column`.

A `<td>` given `display:flex` **stops being a table cell**, and a box that is
not a table cell does not stretch to its row. Measured at 1440px: the row 39px
and the name cell **31px**, the header 29px and **26px**. That 8px strip of page
showing under a frozen white cell is the box in the photograph.

Nothing was wrong with the register's own rules — the cell was wearing somebody
else's. Both names were valid, both scopes were real, and the collision was
silent, exactly as the access matrix's `view` modifier was silent against the
page region `.view`. The cell is `namecell`; both measurements match the row.

Worth naming the pattern, because this is the third instance: **a one-word class
that reads naturally in two places will eventually be written in both.** The
register's cells are `idx`, `namecell`, `kebcell` — none of them a word another
component would reach for.

**73.2 The stripe existed and painted nothing.** `--zebra` was `var(--surface)`
in all four palettes — the legacy of §25, where a hardcoded `#F7F9FC` survived
into dark mode and put a near-white band under near-white text. Neutralising the
token fixed dark and left the platform with a zebra rule that painted white on
white. Real values now, per palette, so `tbody tr:nth-child(even)` stripes
everywhere.

**And the frozen columns had to stop being white.** `td.idx`, `td.namecell` and
`td.kebcell` carried `background:var(--surface)`, which was indistinguishable
from the row while the stripe was off — and the moment it is on, those three
columns stay white beside a grey row: **the exact seam freezing them was meant
to avoid.** A background cannot be inherited from a colour nobody set, so the
ground moved onto the `<tr>` (base, stripe and hover) and the three cells take
`background:inherit`. Measured in both themes: `tr`, `idx`, `namecell`, middle
cell and `kebcell` all report the same colour on every row.

**73.3 Checked against the new ground BEFORE running anything.** §25's lesson is
that a new ground under old ink is where this breaks. Every ink token clears on
the zebra in all four palettes (worst: `--ink-3` at 4.88). Five raw scoring
colours fail — and they **already fail on plain white** by about the same margin
(`--good` 3.77 → 3.54), so the stripe is not the cause: §16.15's deferred
palette family, unchanged. The sweep agrees: **6 failing runs before, 6 after**,
all of them the company page's `num.final`.

The header's own cells needed nothing: `thead th` takes `--panel` with
`!important` two files later (§41.10), so a rule for them would have been dead
code — written, measured as changing nothing, removed.

---

## 74 · Writing a message, and sending it (v3.23)

Islam: *"Man I want to start sending messages, that's the setup. I need the
message initiation and sending section."*

§72 built the channel. This is the thing that uses it: **Running the cycle ›
Send a message** — who · what it says · what they will see · send it · what has
been sent.

**74.1 It is a DOING page, so it sits with the cycle.** §46.1 split Setup into
what you SET and what you DO, and Communication is the first and this is the
second. Gated on being the SMO **outright**, not by a matrix cell: `api/mail.js`
refuses a non-SMO, so a cell here would let the SMO grant a page the server then
refuses on every press — §42's drift, which `lib/rules.js` exists to prevent.
Mailing the whole register in the organisation's name is not "running a cycle",
and `a_cycle` edit is held by more people than that.

**74.2 THE PAGE HOLDS CRITERIA; THE SERVER HOLDS THE RECIPIENTS.** Ticking a box
changes what was *chosen*. Who that resolves to is asked of the server, shown
before anything is sent, and **resolved again on the server at send time**. A
page that assembled the list itself would be the browser deciding who gets mail
(§42, one surface out), and it would answer from a register that may be a minute
stale — somebody retired in between must not receive it.

`lib/audience.js` is that resolution, and it is **one copy run on both sides**
for the same reason `lib/rules.js` is: the composer shows the list and the
server sends to it, and two answers to "what does *unit heads* mean" would
differ in the one direction nobody checks.

Four rules inside it:

- **Criteria ADD UP, they do not narrow each other.** Ticking *Business unit
  owner* and *Mobile* means both groups, not the owners of Mobile. Four boxes
  that intersected would need a sentence explaining themselves every time, and
  the thing somebody wants is a list they can see — which is on screen.
- **Somebody attached to a place with no role there is still there.** A unit's
  people are the people in it, not the people with a title in it.
- **A retired person is excluded silently** — retirement is not an omission.
- **SKIPPED PEOPLE ARE NAMED, NOT COUNTED.** "3 skipped" tells nobody which
  three, and each one is a different edit on a different row. Two reasons a
  person is skipped: no address, or **an address somebody else already has** —
  the register has never enforced uniqueness (§69.23 met that at the door), and
  here it would quietly send the same inbox the same message twice.

**74.3 One message per person, in one call.** Never a shared To, never a BCC:
nobody should see anybody else's address, and a failure has to name the person
it failed for. That is normally a choice between privacy and thirty-three HTTP
calls — **Resend's batch endpoint takes up to 100 separate messages in one
request**, so it is neither. It also settles a constraint that would otherwise
have decided the design: a serverless function has seconds and Resend
rate-limits at two a second, so a loop over the register would have timed out
halfway with no record of where it stopped.

**The row is written BEFORE the send, not after.** A send that half succeeds and
then loses the function is the case a record exists for, and a record written
afterwards is exactly the one that would be missing.

**74.4 THE JOIN IS BY POSITION, AND THAT IS THE PART THAT FAILS SILENTLY.**
Resend returns ids in the order they were sent, so recipient *i* is matched to
answer *i*. Get it wrong and **every row still says "sent"** — against the wrong
person. `scripts/test-mail-send.js` stubs `fetch` and drives the real handler
against a real Postgres, then reads the rows back and checks each address
against its own id. It also drives the case nobody writes by hand — **an answer
shorter than what was sent** — and asserts the missing one is recorded as
failed rather than counted as sent. Proved by breaking the join on purpose: 3 of
13 checks fail, and they are the right three.

It asserts the shape of the request too, not only the rows: one email object per
person, one address in each `to`, and no address appearing in anybody else's —
a shared To would pass every row-matching check and still be the bug this design
exists to avoid.

**74.5 `messages` and `message_recipients` live outside the state graph**
(migration 020), with credentials, `change_log`, `bu_declarations` and
`feedback`. A save TRUNCATEs thirty tables CASCADE. **No foreign key to
`people`**: deleting somebody from the register must not take the history of
what they were sent with them (§69.23's rule from the other end). Asserted — a
full `writeState` leaves the sent messages untouched.

The message is stored once and each recipient is a row, because *"did Ashraf get
it"* and *"what did we send in March"* are different questions and only the
second is about the message. The **criteria are stored as chosen**, not the list
they resolved to: the list is in the recipients table, and what you want back
when a message reached the wrong people is what somebody ticked.

**74.6 Ticking repaints; typing does not (§35, §71.2).** The audience comes back
from the server while somebody is mid-sentence, so it is written into one
element and the composer is left alone. The request is debounced, and **a stale
answer is discarded** — tick again while one is in flight and painting it would
show a list for criteria no longer on screen.

**74.7 Two things the drawing caught that the measurement did not.** The role
capsules wrapped mid-word — *Business unit owner* onto three lines, *Strategy
Management Office* onto two — so a row came out at three different heights and
the ticked one was no longer the one that stood out. A capsule is a label; a
label that wraps is a paragraph with a border. And **`.chip` has never had rules
of its own** — only `.phead2 .chip` does — so every resolved name rendered as
bare text beside the capsule that had been ticked to produce it.

**74.8 The email's header name is its own field** (Islam: *"this header should
be in the edits as well"*). It defaults to the organisation's name and is stored
separately, because renaming the tenant to change what an email says would
rename it on every screen in the platform.

**Still open:** the cycle chase — the same send with the recipients and the body
worked out from who owes a submission. It is now one function away, which was
the point of building this first.

---

## 75 · A repaint must not move the page (v3.23)

Islam: *"on every edit in the table the table jumps up to the start. Make any
editing doesn't make the tables jump!!"* — and, a minute later, *"I'm not able
to add a role or add a number without the whole thing jumping."*

**75.1 §71.2 fixed the fields it could reach and could never fix the rest.**
That version took `paint()` OFF the handlers that did not need it, which was
right and is why typing a name is steady. It does nothing for the edits that
genuinely have to repaint: **adding a row, giving somebody a role, opening the
role picker, changing a figure** — these change what the page *says*, not just
what is in a box. Chasing them one handler at a time is how a fault comes back
six versions later on the one nobody remembered.

**So the repaint is made harmless instead.** `paint()` replaces the whole of
`#panel`, and that throws away three things somebody was relying on:

- **where the page was scrolled**
- **where each scroll BOX inside it was scrolled** — the register is 1127px
  wide in a 920px box and taller than its own frame, so it has both, and its
  vertical offset is the one Islam photographed at row 76
- **which field had the cursor, and where in it**

All three are taken before the rebuild and put back after, **synchronously, in
the same frame**, so nothing is ever drawn at the top and then moved — that
flash is the same jump, only quicker. The cost is two walks of the panel per
paint; the alternative is auditing every handler in the platform for ever.

A box is matched across the rebuild by its class and its ordinal among boxes of
that class. Same page, same shape, so it holds — and when it does not, the worst
case is that nothing is restored, which is where the product already was.

**75.2 `focus()` SCROLLS, so the fix caused the fault it was written for.**
Restoring the scroll and then restoring the focus undoes the first with the
second: `focus()` brings its element into view by default. Measured — a field
near the bottom of the register drags the box to 952 whatever it was just set
to. `focus({preventScroll:true})`, with a plain `focus()` behind a try/catch for
anything that does not take the option.

**And it was the PROBE that found it**, by focusing a field before scrolling and
reporting a jump the product had not caused. A check that moves the thing it is
measuring measures itself — the trial now does its setup *before* setting the
scroll, so the probe's own focus can never be read as the product's.

Five edits asserted at 1280×820, scroll box at (600, 300) and page at 220:
editing a job title, opening the role picker, choosing a role in it, changing
where somebody sits, adding a person. All five: unchanged, and the caret stays
in the field it was in.

**75.3 "That comes to nobody with an address" was said for three different
things, and was true of one.** Islam added himself to the register with an
address, went to Send a message, and was told nobody had one.

The audience is resolved against the **stored** register, which is correct and
is §74.2's whole point — a posted list of addresses would be the browser
deciding who gets mail. What it means is that **the screen can be ahead of the
server**, and nothing on the page said so.

Two halves to the fix. `sendmsgAsk()` and the send both **flush first**:
`SYNC.saveNow` answers `"clean"` without a request when nothing has changed, so
it costs nothing on the ordinary path and closes the gap on the one that made a
correct rule look like a broken feature. And the empty list now says **which of
the three** it is: nothing matched · everything that matched has no address
(named) · or the register the server holds, counted, because *that* is the one
somebody cannot work out from the screen.

Reproduced exactly — add a person, type an address, go straight to Send without
waiting — and the person now appears in the resolved list.

---

## 76 · Drafts, dropdowns, and writing inside the design (v3.23)

Three asks in one sitting, and the third one arrived as a question.

**76.1 A draft is real work, so it goes on the server.** Islam: *"allow me to
save draft messages."*

**Its own table, not a flag on `messages`.** That table is the record of what
was SENT, and *"what did we send in March"* must not have to remember to say
*"and not the ones we did not"*. A draft has a different lifetime: it is
edited, it is deleted, and **it stops existing the moment it becomes a
message** — sending from a draft removes it, because a sent draft left in the
list is a trap, and the next person to open it would send it again with nothing
on it saying so.

**Not `localStorage`, deliberately.** The theme and the People page's columns
belong there (§25, §47.1) because they are screen preferences. A message
somebody typed is not: written on a laptop it has to be there on the desk.

Saved over rather than appended to — pressing Save twice leaves one draft, and
the id the composer holds says which. **A draft deleted in another tab becomes a
new draft rather than an error**: the alternative is losing the message to a
row that is no longer there.

**76.2 Thirty capsules become five searchable dropdowns.** Islam: *"for the who
gets it just make it multiple drop downs with searchable checklists and the drop
downs are beside each other."*

Right, and the number is the argument: eight roles, ten units, eight functions,
a group, two companies — thirty controls at once is a thing you scan rather than
a thing you use, and it only gets worse as the tenant grows. Five buttons, each
opening a searchable checklist, is the same choice in the same vocabulary.

**The count stays on the button**, which is what makes closing a panel safe:
nothing chosen is ever hidden by the control that chose it. One panel open at a
time — two overlapping popups on one row are two things covering each other.
**Typing in the search never repaints** (§35): the rows are hidden in place,
because a repaint would replace the input being typed into. And the panel is
`position:fixed`, placed by JS, for exactly searchsel's reason (§45.5): `.cfg`
is an overflow container and would clip an absolute one — this row sits inside
one that already scrolls sideways.

**Clear on one dropdown clears only what that dropdown offers.** Units and
functions share the `targets` list, so a naive clear on Business units would
empty the Functions beside it.

**76.3 You write inside the design.** Islam: *"should I edit in separate boxes
or can you let me edit inside the final design box?"* — and, separately, *"the
message box final design expands to fill the message with not scrolling."*

Inside. **A subject box above a preview of the subject is the same words twice,
and the second copy is the one that is wrong whenever they differ.** The heading
and the body are `contenteditable` in the message itself; the button keeps its
two fields, because a label and a link are not text in the flow and there is
nowhere in a design to type a URL. The heading doubles as the subject line, and
the note says so — that is a real thing to know, since the inbox list is the one
place the reader sees it and it is not on screen.

Four rules the editor obeys:

- **Typing never redraws it.** Rewriting `innerHTML` on a keystroke destroys the
  node the caret is in — §30.1's family. Typing writes into `SENDMSG` and
  touches nothing; the branding, the button and opening a draft redraw.
- **`innerText`, not the markup.** The browser is free to produce a `<div>`, a
  `<br>` or a bare text node depending on how Enter was pressed. What a message
  IS, is its words and where the blank lines are; `MAIL.html` makes paragraphs
  of them when it sends.
- **Paste is plain text.** Text pasted from a browser carries its own fonts,
  colours and links — none of which survive being read back as `innerText`, so
  it would look right while being typed and wrong when it arrived.
- **A placeholder, not sample words.** Sample words typed over become the
  message, and somebody would send *"Your message will appear here."*

The editor's own styles — the focus ring and the placeholder — go in a `<style>`
inside the **shadow root**, never in the email's markup: what is sent has no
editor in it. And the box it is in **does not scroll**: a scrolling box hides the
end of what you are writing behind an edge, which is the whole thing typing into
the design was for.

`data-mail-title` and `data-mail-body` are hooks written by `mail.js`. A data
attribute costs a mail client nothing, and it means the editor never has to
guess which element is the body — a guess that would break the first time that
markup moved.

---

## 77 · The whole way in, for every kind of person (v3.23)

Islam: *"can you test the login cycle of multiple roles now to make sure that
they login?"*

**77.1 The cycle, not the password check.** `scripts/test-login-cycle.js` walks
one holder of each role through the eight steps in the order a real person meets
them: the SMO issues a temporary password · they sign in with their **email** ·
`/api/state` **refuses them** while it is still temporary · they choose their own
· the platform opens and knows who they are · the where-do-you-work list is the
**short** one · they can reach a page · and the new password works while the
temporary one does not.

Step three is the reason this is worth having. It is invisible on screen — the
gate has always sent people to the change page — so if the SERVER stopped
caring, nothing would look different until somebody stayed on a temporary
password for a month (§43.2).

**77.2 Three things the test got wrong before the product did, and each is a
lesson about checks.**

**It aimed at the wrong endpoint.** `issueTemporary` is the BULK control behind
the Passwords header menu and **takes no list of people at all** — written
against it, the first subject silently issued to the whole register and every
subject after reported `issued: []` while signing in perfectly. A check aimed at
the wrong endpoint fails in the one direction that looks like a product bug.
The per-person path Islam actually presses is `setPassword`.

**It had one role to test.** A deployed tenant is clean-slated to the SMO
(migration 004), so the first run found two roles and both were the SMO — who
cannot be a subject anyway, because a reset deliberately excludes whoever asked
for it (§46.4). The test writes the worked example's register in first.

**It walked only the empty case.** Every subject fell through the *"no Official
BU"* branch, so **the shortlist — the thing Islam reported twice as broken —
was never exercised**. The demo ships the ten BU names with nothing mapped
(§54, A4), deliberately, so a client never inherits Raya's departments. The test
now points two of them somewhere and gives the subjects one each: **Distribution
at the COMPANY**, which is the interesting branch because it expands to the
units the company holds. Measured: **2 or 3 of 18** for every role.

And the check is that `near` is a proper SUBSET of what is offered, not that the
call answered `ok` — "it answered" is what a decoration answers too.

**77.3 It says which roles it could NOT reach.** A clean-slate tenant has no
plan, and a **Contributor is somebody a plan line names** (§55) — so nobody is
one, and a run reporting "6 roles, all green" without saying so is a green run
that covered less than it looks like.

**90 checks, 0 failures**, across Group CEO, Company CEO, Business unit owner,
Strategy custodian, Supporting function head and Employee.

---

## 78 · Seventy-three people, and what the file said about them (v3.23)

Islam sent the real register as a table and asked for duplicates.

**78.1 There are none** — no repeated Emp ID, no repeated address, no repeated
name across the 73 rows. Three things the data does say:

- **Two people are indistinguishable in the register.** *Ahmed Mostafa Mohamed
  El Gebely* (185) and *Ahmed Mostafa Mohamed Abou El Einen* (9648) both display
  as "Ahmed Mostafa Mohamed", because the Person column shows three names
  (§69.21). Their minted sign-in keys collide too and the second takes a numeric
  suffix — harmless since the door takes the EMAIL now (§69.23), but the column
  needs a fourth name for these two or nobody can tell them apart.
- **Twelve rows carry no mobile** (`0`, or `#N/A` for one) and **six are missing
  their leading zero**. The importer takes a ten-digit number as written; it is
  a phone number and nothing computes with it.
- **All ten Official BU names already exist** in the platform's list, so nothing
  arrives unmapped.

**78.2 The file was built by the platform's own exporter, and read back through
its own reader.** Hand-rolling an `.xlsx` would be a second copy of a format the
reader expects, and the two would drift the first time a column moved — §65's
validation-range trap arriving through a script instead of through a rename. So
the platform is loaded, `PEOPLE` is replaced with the rows to add, and its own
Download button is pressed.

Then it is **read back through the upload**, on a register that already holds
people, because that is the state it will meet: **73 rows read, 73 added, no
problems, no new BU names**, every field where it should be. §52's rule — a
pipeline that substitutes silently produces a plausible artefact.

**Unit, Role and Status are left blank.** They are the SMO's to decide, and a
guess written into the file would decide them. The upload adds and amends and
**never removes** (§54), so anyone already on the register is updated on their
Emp ID rather than duplicated.

---

## 79 · Spec-kit across everything, and a row edited on the row (v3.23)

Islam: *"we need to start using spec-kit across the platform, across everything,
to make sure things are well structured and in place."*

**79.1 The constitution was the gap, not the specs.** Eleven specs exist and the
last is §54 (v3.21) — everything from §55 to §78 has none. But writing
twenty-four retrospective documents would be an exercise: the decisions document
already carries the reasoning, at more length than a spec would.

What was actually missing is upstream of that. `.specify/memory/constitution.md`
was **v1.0.0, ratified before roles replaced levels** — so a spec review checked
compliance against a set of principles that predated server authorisation, the
security floor, records outside the state graph, and every law the last twenty
sections earned. **A spec cannot be checked against a rule nobody wrote down
where the check happens.**

Amended to **1.1.0** with eight principles, IX–XVI. None is new; each is a law
the work earned by breaking it, several repeatedly:

| | | Earned |
|---|---|---|
| IX | One copy of a rule, run on both sides | §42, §74.2 |
| X | The server decides; the browser only draws | §42, §74.2 |
| XI | A record a save can erase is not a record | §69.23, §71, §74.5 |
| XII | A reader never creates what it was looking for | §42, §50.6 |
| XIII | A colour that works as a fill fails as type | **seven times** |
| XIV | A class name is one global namespace | **three times** |
| XV | Typing never repaints; a repaint never moves the page | §30.1, §35, §71.2, §75 |
| XVI | A check that measures the wrong thing passes | §50.6, §51.11, §54.5, §74.4 |

And the workflow now says it outright: **every feature gets a spec before it
gets code**, and work already built without one is backfilled **when it is next
touched** — so the gap closes where it matters rather than as an exercise.

**79.2 A ROW IS EDITED ON THE ROW, which reverses the fifth of the seven.**
Islam asked for *"edit icon in the top right to edit"* and then, after using it:
*"I don't need to edit the whole table — maybe by pressing the 3 dots on the
right of the row I can work on the row inline and then a small save button."*

Recorded as a reversal, and the number is why he is right: whole-table edit
turns the register into **297 inputs** to change one job title, every one of
them a way to change something by accident — and it repaints the whole table to
get there. The row menu already holds *Delete permanently* and *Set a password*;
editing belongs beside them.

One row open at a time (two open rows are two unsaved states and a question
about which Save means which); Cancel restores from a copy taken when the row
opened, never by re-reading fields already typed into; and leaving the page
cancels, because an edit you cannot see is not an edit you agreed to.

**79.3 The inventory was counted, not remembered.** Driven across all eighteen
Setup and Manage pages: **19 tables, one with a row menu, three wider than their
box**. And only **seven have an individual row flow** — which is Islam's own
qualifier, *"the tables that has individual row flow"*, turned into a list.

The other twelve are named in the spec **with what they must not be given**,
because the failure mode of a standard is applying it out of consistency: Roles
& access is a 49-cell matrix where sorting scrambles the argument the table
makes; Scoring bands and Labels are fixed sets whose rows cannot be added or
removed; Branding and Communication are settings wearing a table's shape.

**79.4 It is built UNDER the register, not beside it.** The register already
carries five of the seven, and every one was paid for with a real fault —
§69.19's sticky-on-the-row, §69.20's unreachable Delete, §71.2's jumping,
§73.1's class collision. Extracting from a page that works, and asserting it
still works, is a smaller risk than writing the component from the spec and
retro-fitting the one page that already does the job.

**Nothing is built yet.** Spec, plan and tasks are written and gated on three
questions in §6 that are Islam's to answer — which is Principle I, applied to
the largest remaining piece of work rather than around it.

---

## 80 · The row edits on the row, and the register gets its bar (v3.24)

Spec 012, phases 1–3, on the register. Islam's three answers settled it: quick
filters as proposed, no retiring on Official BU names, and the sort question was
left to me.

**80.1 SORTING A TABLE WHOSE ORDER IS A SETTING: IT DOES NOT SORT.** Business
units and Figure sets carry an order somebody **arranged**, and on Business
units that order is what appears in the navigation and on the group page. Put
sorting beside arranging and the two are ambiguous in a way no label fixes: sort
by name, drag a row, and the drag now means something different because what you
see is not what is stored. A *"sorted for reading"* badge would be a warning
about a hazard rather than the removal of one — §32's habit, and §28's: remove
the mechanism rather than get it right.

It costs nothing. Ten rows and one row, and **search narrows a ten-row table
better than sorting it**. Recorded so it can be revisited if a third arranged
table ever arrives with two hundred rows.

**80.2 `editable` was one boolean read at ten places; it became a function of
the row.** That is the whole of the reversal, and it is why this is a small diff
rather than a rewrite. The ten call sites did not otherwise change.

Two of them were **outside** the row loop and broke the page on the first build:
`roleCell` and `roleWhereCell` read the page mode from a closure. They compute
it from the row now — and not by taking a parameter, because they are two halves
of one control (§69.1) and a parameter one of them forgot would put a remove-×
on a closed row.

**The Add row keeps `mayEdit`**, deliberately: adding is not editing a row, and
it must be reachable without opening one first.

**The pen is gone from the register.** It turned on a mode that no longer
exists, so it would have been a control that changes nothing — worse than no
control (§37, §72.10).

**80.3 Cancel restores from a copy, and puts it back IN PLACE.** The snapshot is
taken when the row opens, because that is the only moment the original still
exists; restoring by re-reading the fields would restore the edits it exists to
undo. And it writes back into the same object rather than replacing it —
something else may already hold a reference to that person (the viewer switcher,
a role chip, an open menu), and swapping the object would leave those pointing
at the edited one while the register showed the restored one.

**Leaving the page cancels.** The fields have already written themselves
(§71.2), so "keep" would mean half-typed values persisting with nothing on
screen saying so.

**80.4 THE SETUP RAIL HAD A PARTIAL COPY OF `leaveModes()`, AND A PARTIAL COPY
IS WORSE THAN NONE.** Navigating between Setup pages repeated three of that
function's lines inline instead of calling it. So every mode added since — the
open row, the composed message, the sent-a-test sentence — was cleared when you
left a UNIT and kept when you left a SETUP PAGE, which is the same act to
anybody using it. Found by an abandoned row edit surviving a page change.
Constitution IX, one level down: one rule, one place.

**80.5 The sort's column index is a POSITION, so it is counted rather than
declared.** Columns are hidden and shown under Columns, which moves every index
after them — §65's validation-range trap in a different file. `th()` counts as
it emits, so the header and the sort cannot disagree.

Three columns do not sort, and the reason is the same for all three: **Roles** is
a stack of chips, **Password** is a pill, and **#** is the row's position in the
view. Sorting any of them orders rows by text that happens to have been
rendered, which is not a fact anybody asked about. And the row numbers are
**renumbered after a sort**, because a first column reading 7, 3, 12 says the
sort failed.

**80.6 The filters read attributes, not the rendered text.** *Active* is a fact
about a person; the word "Active" may not be in the row at all, because the
Status column can be turned off under Columns. A filter matching visible text
would answer differently depending on which columns somebody had hidden.

**80.7 A CHECK KEYED ON THE PEN PASSED BY CRASHING.** Removing `[data-edit=
"people"]` broke the no-jump probe — the one that guards §75 — and it failed
loudly, which is the good case. Six probes referenced that selector. Constitution
XVI as an instruction rather than a warning: when a control changes shape, grep
the checks for the old selector before trusting the next green run.

The two that matter are now **in the repo** rather than in a scratch directory:
`src/checks/table-standard.py` (28 assertions) and `src/checks/no-jump.py`
(seven edits, each asserting the box, the page and the caret do not move —
search and sort added to it here). Contrast sweep and `qa.py` at baseline.

**Still to build in spec 012:** the columns chooser moving into `tablekit`, and
phases 4–5 — the other six row-flow tables, and the freeze alone on Roles &
access.

---

## 81 · Duplicates, flagged where they are (v3.24)

Islam: *"in case of duplication in the registry flag it in the app."* Said after
I had reported the 73-row file's duplicates in chat — which answers the question
once, for one file, to one person.

**81.1 FIXING IT BEATS FLAGGING IT, where the thing is fixable.** The register
shows three names (§69.21) and Raya's file carries *Ahmed Mostafa Mohamed El
Gebely* and *Ahmed Mostafa Mohamed Abou El Einen* — at three names, the same row
twice. A warning would say "these two are indistinguishable" and leave them
indistinguishable.

`displayNames()` shows **the shortest prefix that tells them apart**: three
names for the 31 rows that do not clash, four for the two that do. It lengthens
every member of a clash **together**, or the pair would still read as one long
name and one short one and look like an error rather than a distinction. And it
is computed over the whole register **including retired rows**, because a
retired person is on screen when that filter is on and a name that changes
length with a filter is worse than a long one.

Two people with the genuinely identical full name cannot be separated at any
length. That case falls through to the flag, which is correct — it is the one
case where "these are indistinguishable" is the whole truth.

**81.2 Two kinds of duplicate matter, and a repeated name is not one of them.**

- **An Emp ID on two rows** is broken now: the people workbook matches on it
  (§54), so an upload amends one of them and nothing can say which.
- **An address on two rows** turns BOTH people away at the door (§69.23), and
  sends one inbox the same message twice (§74.2).
- A repeated **name** is neither — two people really can be called the same
  thing — so only a name that survives §81.1 unseparated is reported.

**Retired rows are excluded.** They cannot sign in and no upload places them, so
counting them would report a problem nobody has.

**The mark is ON THE ROW and it NAMES THE OTHER ROWS.** A count in a header is a
number you then have to go and find, in a register of 33 rows and eleven
columns — §62's rule that a refusal names what is in the way, applied to a
warning. It sits **inline after the name**, because the first column is frozen
and a mark in any other one is a mark behind a horizontal scroll (§69.20's
lesson). The header keeps its counts, and the new **Duplicates** quick filter
takes you straight to them — which is what the table standard's filter row is
for (§80).

`registerDupes()` and `personDupe()` are **one pair answering for three
surfaces** — the row's mark, the header's counts and the filter — so they cannot
disagree about who is affected (§33's shape).

**81.3 `var` HOISTS THE DECLARATION AND NOT THE VALUE.** The computation was
written with the other counts, two hundred lines **below** the row map that
reads it. Every row therefore read `undefined` — and it did not throw until the
first person with **no employee number and no address**, because the first two
tests short-circuited past `d` and the third did not. A helper that answers for
three surfaces has to be computed before the first of them, not beside the last.

Found in seconds by the check, because the check injects all three kinds of
duplicate rather than trusting a register that has none. **A clean register
proves nothing about a flag for duplicates** — the first two assertions are that
a clean one shows no marks and offers no filter, and everything after that runs
against injected ones.

`src/checks/duplicates.py`, 15 assertions.

---

## 82 · The tables stop overflowing, and two names is not two words (v3.24)

**82.1 759px of horizontal overflow, down to 38px.** Islam: *"for the tables as
well fix the overflow of data by wrapping."*

Every Setup table body was `nowrap`, inherited from `_shared.css`'s rule for
HEADERS. So one nine-word job title held its column open at nine words wide, and
on the register every other column paid for it at every scroll position, because
two of them are FROZEN (§69.19).

**The split is by what the cell HOLDS, not by column name.** Prose wraps — a job
title, an Official BU, an address. Things read as one token do not — a number, a
sign-in name, a pill, a date: a broken employee number is harder to read than a
wide column, and a pill wrapped mid-word looks broken rather than narrow. An
address gets `overflow-wrap:anywhere`, because it has no spaces to break at and
would otherwise hold its column open exactly as before.

| | before | after |
|---|---|---|
| People register | 207px past its box | **18px** |
| Capabilities | 552px | **fits** |
| Roles & access | 20px | 20px (a 49-cell matrix; it gets the freeze instead) |

**82.2 A SELECT SIZES ITSELF TO ITS LONGEST OPTION, AND THAT OPTION IS NOT ON
SCREEN.** Capabilities was three times worse than the register and none of it
was text: its function picker's list contains *Strategy Management Office*, so
the column was 239px wide to hold a word nobody can see until the list is open.

`max-width:100%` did nothing — **measured, 552px before and after**. Under
`table-layout:auto` the cell is sized BY its child, so a percentage of the cell
is a percentage of the width the select just asked for. It is circular. §46's
note that `width:99%; max-width:0` is a fixed-layout trick, met from the other
side. An absolute cap fixes it, and costs nothing: the chooser opens over the
page anyway (§45.5), so a narrow closed control loses no list.

**82.3 "ABD EL" IS NOT TWO NAMES — IT IS HALF OF ONE.** Islam: *"for any
placement of the name of people like in the custodian of the unit or the
function use the first 2 names only."*

Done in **one function**: all fifteen call sites of `personName()` are display
sites — a cell, a chip, a pill, a confirmation — and none stores or exports what
it gets, so a `personShort()` beside it would have been fifteen edits and a coin
toss on the sixteenth. `personFullName()` is there for anything that ever needs
the whole thing.

Then the first build put **"Abd El"** in the Mobile custodian's cell, which names
nobody: half this register begins that way. A particle binds to the name after
it — *Abd El Hamid* is one given name in three tokens — so `nameWords()` counts
NAMES, taking the run of particles with the word they belong to. That is not a
wider reading of the ask; it is the only reading under which "the first 2 names"
means two names. Applied to the register's own three-name rule (§81.1) as well,
which had the same fault more quietly.

The register keeps its own rule and that stays right: **that column exists to
identify somebody, and the other fifteen exist to remind you who they are.**

**82.4 CLAUDE.md HAD NO RULE ABOUT CHECKING MAIN BEFORE MERGING.** Islam asked;
it did not. Three lines added, and each is a thing that has already happened:
fetch and look before merging (§70 landed on main mid-session while §71 was
being built); merge `--ff-only` so a divergent main REFUSES rather than being
silently auto-merged; and **after a merge that brings in somebody else's
sources, rebuild — never trust git's merge of the built file**, which is
generated and which git will happily splice into something belonging to neither
version. Two branches each adding a `var pf` to one function merged with no
textual conflict at all and broke a page (§56.7): a clean merge is not a working
one.

`src/checks/table-widths.py` walks every Setup and Manage page and reports how
far each table sits past its box, so the number is a measurement rather than an
impression.

---

## 83 · A duplicate address, caught where it arrives (v3.24)

Islam: *"Flag it in the page."*

§81 flagged duplicates on the register. This is the other half — **the moment
they arrive**, which is the upload, and the place a duplicate can be refused
instead of merely noticed.

**83.1 The file was checked for a repeated employee number and NEVER ONCE for a
repeated address**, in either direction: against another row of the same file,
or against somebody already on the register. Both landed silently — and the
consequence does not appear on the import receipt at all. The door refuses
**both** people with the correct password (§69.23), neither is told why, and the
only surface that would ever say so is the register's own duplicate mark, which
is a page nobody opens after an upload that reported no problems.

It is a **problem, not a notice**: the row is refused rather than applied. An
address is what somebody signs in with, so importing a collision breaks two
people who were working — and unlike a missing BU there is no sensible
half-answer to fall back on.

**ORDER MUST NOT DECIDE WHO IS THE IMPOSTOR, and the first draft let it.**
Written as a running tally, the first row to claim an address won it. So a NEW
person listed above the person who already holds that address took it, **and the
rightful owner was refused their own row** — found by the check, which is why it
seeds an existing holder and puts them BELOW the claimant. Occupancy is now
worked out for the whole file before the loop: the person who already holds an
address keeps it, and if nobody holds it the file is ambiguous and every row
claiming it is refused. §69.23's stance at the door, applied one step earlier.

**Three of the check's assertions then failed on correct behaviour**, because
they were written against the wording of the broken version — "also on Row 2",
and "Row 6 must not appear anywhere". Rewritten to assert **which rows are
refused**, which is the contract; Constitution XVI, met on my own check rather
than the product's.

**83.2 One floor, on one column, and it is the address.** Wrapping took the
register from **207px past its box to 0** — and made one row **382px tall**,
because an address has no spaces and `overflow-wrap:anywhere` broke it down a
column that had collapsed to nothing.

Minimums on the name and the job title were tried first and **bought nothing** —
measured, identical row heights at every value — while costing up to 184px of
scroll. Swept against the demo register and against the worst row it can produce
(an eight-word name, a 46-character title and a 30-character address on one
person):

| address floor | scroll | tallest row |
|---|---|---|
| none | 0px | 382px |
| 60px | 20px | 160px |
| **75px** | **35px** | **120px** |
| 90px | 50px | 120px |
| 120/150/170 on three columns | 184px | 79px |

**75px is where the tall row stops getting shorter**; everything above it buys
scroll and nothing else. Across every Setup table: **759px of overflow → 55px**,
and the two that remain (the register at 35, Roles & access at 20) are behind
frozen columns that make a short scroll workable (§69.20).

**83.3 THE SPLICE MADE A SECOND COPY OF THE RULES, and the later one won.**
Editing the block by string surgery left the register's wrap rules in the file
**twice** — sixty-one lines apart, the stale copy last, so every measurement
after it was of numbers I thought I had removed. That is §51.5, §53.6 and
§29.2's fault for the fourth time in this file, and the reason it was caught is
that the number stopped agreeing with the sweep that had just produced it: **a
measurement that disagrees with the one before it, after a change that should
not have moved it, is a file to read rather than a number to accept** (§63's
rule about the contrast total).

---

## 84 · The table standard reaches all seven (v3.24)

Spec 012, phases 1, 3 and 4. Search, quick filters and sortable headers now work
on every table that has an individual row flow — the register, the Official BU
list, Business units, Companies, Functions, Capabilities and Figure sets.

**84.1 The header row was extracted, not copied.** It was a closure inside
`renderPeople` with `"people"` written into it three times. `tkHead(id)` counts
the column INDEX itself rather than taking it, because every one of these tables
has conditional columns and a caller counting its own gets it wrong the first
time one becomes conditional.

**Two tables do not sort at all**, and that is the spec (§6.2) rather than an
omission: Business units and Figure sets carry an order somebody ARRANGED, and
on Business units that order is the navigation. **Two do not get a search box**
for the same kind of reason — one row and two rows — and the threshold is one
number (`TK_SEARCH_FROM`), so a table crosses it as the tenant grows rather than
when somebody remembers the page.

**84.2 A `<select>` PUTS EVERY OPTION IN THE ROW'S TEXT.** `tr.innerText` looked
right and was wrong on any table with a picker in it: on Capabilities each row
lists all eight functions, so searching *Treasury* matched **8 of 8**. The
reader sees one function per row and the search saw eight.

The reverse fault is in the same sentence: an `<input>` contributes **no text at
all**, so with a table in edit mode a search would have matched nothing. Both
are one mistake — reading the markup instead of what is on screen. A row's text
is now its cells with the pickers removed, plus each select's CHOSEN option,
plus each input's VALUE. `textContent` rather than `innerText` on the clone,
because a detached node reports `innerText` as empty (§69.5, in a fourth place).

**84.3 AND SORTING AN EDITABLE TABLE DID NOTHING, for exactly that reason.**
The comparator read `cell.innerText`, and Capabilities is editable for the SMO
without a pen — so every row sorted as the empty string and the order never
moved. It looked like a sort that does nothing, which is indistinguishable from
a sort that was never wired up. `tkCellText()` is now the one reader and
`tkRowText()` is it applied to the whole row: **one function, so the search and
the sort cannot disagree about what a row says.**

Found because the check drives all seven rather than the one it was written on.

**84.4 Two of the check's own assertions were wrong before the product was.**
It read `cells[1].innerText` — the same fault it was hunting — and it clicked a
header **twice**, which returns a two-row table to where it started, so
Companies reported "sorting does nothing" while sorting correctly. Every sort
step is captured now and at least one must differ. Constitution XVI, on my own
check twice in one session.

**Still to come (spec 012 phase 2):** the row edited on the row, from the ⋮,
with Save and Cancel in the actions cell. That is the reversal Islam asked for
in §79.2 and it is the piece with no precedent anywhere in the platform.

`src/checks/table-standard-all.py`, 44 assertions across the seven.

---

## 85 · A row is edited on the row, on all seven (v3.24)

Spec 012 phase 2 — Islam's reversal from §79.2, now on every table with an
individual row flow. A pen opens **one** row; its fields become editable in
place; **Save** and **Cancel** sit in the actions cell; Cancel restores from a
copy taken when the row opened; and leaving the page cancels, because an edit
you cannot see is not an edit you agreed to.

**85.1 The pen is inline where there is no ⋮.** The register puts *Edit this
row* in its menu because it has five other acts to put there. The other six have
one or two, and **a menu holding one item is a door behind a door** (§32) — so
the pen sits in the actions cell and the outcome is identical. Islam asked for
*"work on the row inline and then a small save button"*; the ⋮ was how he got
there rather than the point.

Retire, Restore, Remove and Delete keep their own controls and are drawn only
while the row is **closed**: offering Remove beside an unsaved edit is three
unrelated outcomes in one 83px column, which is the argument the register's own
cell already makes.

**`ROWEDIT` carries its table now.** It was a bare row key, which is right while
one table has the feature and wrong the moment a second does — Business units
and Functions both have a row keyed `it`, so opening one would have opened the
other. And `ROWFIND` is one registry saying how to find a row per table, rather
than six copies of that question spread through the shell.

**85.2 A CLOSURE DEFINED BESIDE A LOOP AND CALLED INSIDE IT — three times in one
change.** Moving editability from the page into the row leaves anything that
*captured* the page-level flag reading a variable that no longer exists at its
scope:

- Functions' `pick()` — **the whole page rendered as nothing**, "editable is not
  defined".
- The Official BU list's `target()` — the same, one page later.
- Both pages' **Add row and empty state**, which are the page's question and not
  a row's: written against `editable` they vanished the moment no row was open.

The units page needed none of it, purely because its picker happens to be
defined *inside* the map. **That is the shape to look for whenever a page-wide
flag becomes a per-row one**, and after the second instance it was found by
looking rather than by running into it.

**85.3 A ROW THAT LOSES ITS IDENTITY WHEN YOU EDIT IT CANNOT BE EDITED.** The BU
list keys a row by its **name** — which is right everywhere else and fatal here,
because renaming is the first thing the pen is for: type one character and the
open row stopped matching itself and closed mid-edit. Keyed by index instead.
Capabilities has the same shape (no id of its own) and was written that way from
the start.

**85.4 Two of the check's assertions were about the check, not the product.**
*"Every row offers a pen"* was written as **more than one**, which fails on the
one-row Figure sets table for having exactly the right number — it is `pens ==
rows` now. And the probe assumed a second row existed to open. Both are
Constitution XVI: assert the contract, and the contract is one pen per row.

`src/checks/row-edit.py`, 14 assertions × six tables, plus the register's own 28.

---

## 86 · Mockup-first is reinstated (2026-08-24)

Islam restored the rule §1c retired on 2026-08-20: **no visual or structural
change without a static HTML mockup signed off first.** Recorded in `CLAUDE.md`
as a REVERSAL rather than a swap, per Principle II — the note it replaces is
still readable, and the intervening versions matter: §80–§85's table standard,
the wrapping work and the duplicate marks were all built under the weaker
"describe it in words" rule. That is the gap the reinstatement closes.

`design-mockups/` is produced again from today. From here, a visual change is
drawn, sent, approved, and only then built.
## 87 · Who a row is, and two rows that are one person (v3.24)

Islam, sending a screenshot of the message composer: *"in the send message
functionality I got 3 people skipped but they have an email in the registry."*

They did. **The three people were on the register twice.** Once from the
employee file, with an address and a long legal name; once typed into the role
picker, with a shorter spelling of the same name and nothing else. The role sat
on the typed row, so a message aimed at that role resolved to the copy with no
address and reported it as *"no address on the register"* — a true sentence
about a row nobody was looking at.

Nothing in `lib/audience.js` was wrong. **The register let one human become two
rows, and then had no way to say so.**

### 87.1 A name is never an identifier

Islam: *"the name is not the challenge, the identifier really would be the ID
and the email."* That is the whole of it, and the register already proved it
twice over: it holds *Ahmed Mostafa Mohamed El Gebely* and *Ahmed Mostafa
Mohamed Abou El Einen* (§81.1), and it held the same person under two spellings
of their own name.

**The ladder is Emp ID, then email, and there is no third rung.** The employee
number survives a marriage, a transfer and a new mail domain (§54.2); the
address survives a tenant that never had employee numbers. Anything below those
two is a *resemblance* — something to show the SMO, never something to act on.

`personByIdentity()` in `config-data.js` is the one place that answers it, and
it returns **which rung answered**, because every caller has to say so: a review
line reading "matched" tells nobody whether the number or the address decided.

**An address on two rows answers nothing.** `personByEmail()` returns a person
only where the address means ONE person — §57's rule about a Main BU that holds
several, arriving in a second place, and the same rule the door already keeps
(§69.23). Read past it and you attach somebody to a coincidence.

### 87.2 The fourth kind of duplicate, and it is the one that bit

§81's three all match on a value two rows **share**. The pair that sent a
message to nobody shared nothing at all, so nothing was flagged.

`likelyDupes()` is a **resemblance**, said as one — amber where the other three
are red, because they are always a fault and this one may well be two people.
Two rules keep it quiet enough to read:

- **One side must be unidentified.** Two rows that both carry an employee number
  are two employees, whatever they are called. What is suspicious is a row with
  *nothing* to identify it that looks like somebody already here.
- **The shorter name must run through the longer one, in order, for at least two
  names.** Arabic names are a chain and the chain's order is part of it:
  *Mirna Gamal Sadek* inside *Mirna Gamal Sadek Soliman* is one person written
  short; *Mohamed Ali* inside *Ahmed Mohamed Ali* is not. **Not a similarity
  score** — a score needs a threshold, and a threshold is a number nobody can
  defend the day it puts two strangers together.

### 87.3 Both hand-typed doors ask for an identifier now

The register's Add row and the role picker's *add new* both took a name and
nothing else. **That is where the twins were made.**

Both now carry an Emp ID and an Email field, and **the stop is on the
identifier, never on the name**: a number or an address already on the register
refuses, names who it already is, and offers their row. A matching *name* is a
remark that stops nothing — two people really can share one, and refusing would
refuse a real colleague.

**Neither identifier is required** (Islam: yes, and mark the row). The SMO often
knows a name and a role and nothing else, and a door that demanded an employee
number would mean a unit could not be given its head until HR replied. The row
is added and **marked** — an unidentified row is exactly the shape the next
upload cannot match, and the register says so on the row rather than the fact
surfacing months later in a message that reached nobody.

**And the picker suggests before it offers to create.** A plain substring search
finds nobody the moment a name is typed a little differently from the way HR
spelled it, and what the picker then offered was *"+ Add"*. When nothing matches
exactly it now asks the looser question first and shows those rows under *"is it
one of these?"* — shown, never substituted, with Add still underneath. The
search also reads the employee number and the address, because a register of
five hundred people is not a list you scroll.

### 87.4 Two rows, one person — the merge

Retiring is for somebody who **left**; deleting is for a row that should never
have existed (§69). This is the third case and it is neither: two rows that were
both real entries about the same human, one holding the address and the other
holding the role. Retiring either loses something; deleting either is refused,
because a row holding a role is a row something points at.

**The survivor is chosen, never derived.** "Keep the older one" and "keep the one
with the address" are both defensible and both wrong sometimes, and the cost of
guessing is a sign-in name changing under somebody who is using it — the key is
minted from the name (§35) and `credentials` is keyed on it, so **the row that
survives is the password that survives**. The panel asks, defaulting to the row
that *can* be matched by a later upload, and names what each row would cost.

**What moves is every pointer `personDeleteBlockers()` refuses a delete for** —
and that is not a coincidence, it is the same list read the other way round. A
merge is a delete that first hands each pointer to somebody, which is why the
last thing `mergePeople()` does is call `deletePerson()`: **if anything was
missed the delete refuses and the merge fails loudly** rather than dropping a
role.

**Values are not pointers and are asked about separately.** A blank on the
survivor is filled from the other row without asking; where both say something
and they differ, the SMO picks.

**A section under the table, not a panel in the row.** Retire and Delete ask one
question and fit in the 83px actions column (§69.20); this one has to show two
whole people side by side, and "which of these two do we keep" is unreadable in
a 240px popover.

### 87.5 The upload matches on the ladder, and sets aside what it cannot place

The reader matched on **Emp ID only**, and a row with none was skipped. It now
matches on Emp ID, then email — so a tenant that has never had employee numbers
can be maintained by file at all, which it could not before.

**Two conflicts, and neither is guessed:**

- an employee number and an address that point at **two different people**
- an address already here arriving under a number the register has **never seen**

Applying either reading silently is the fault: matching on the number would
quietly move somebody else's address, matching on the address would quietly
renumber somebody. So the row is set aside, both readings are named **with the
people they mean**, and **nothing in the file can be applied until every one has
been answered** — the same shape §22 gave a plan import, with the answer moved
from "refuse the file" to "ask about the row".

An address on two register rows is a **problem**, not a question: the fix is on
the register and there is now a control for it, so the reader says *merge those
rows first* rather than picking one and leaving the pair standing.

**AND §83 IS KEPT WHOLE, WHICH DECIDED WHAT A CONFLICT MAY OFFER.** §83 refuses
any upload row that would hand one address to two people, because sign-in takes
the address and two holders turns both away (§69.23). §87 arrived at the same
function from the other side and the two had to be reconciled by hand rather
than by git:

- **A contested address is still §83's refusal.** Two rows of one file claiming
  the same address, or a row taking an address from the person who holds it
  while that person is also in the file, are refused exactly as before — worked
  out for the whole file first, so order cannot decide who the impostor is.
- **A single row contradicting the register is §87's question.** One claim on an
  address somebody already holds is not the file contradicting itself; it is the
  file contradicting the register, and it needs a person to say whether this is
  that colleague under a new employee number or a new colleague given a leaver's
  address.
- **Which is why a conflict does not offer "somebody new".** Every conflict is a
  row whose address already belongs to someone — that is what makes it one — so
  adding a third person with it is the very thing §83 exists to refuse. Offering
  it as one choice of four would be one reader answering one question two ways.
  It is **said rather than hidden**: the panel names who holds the address and
  says to clear it from their row first (§59's disabled-with-the-reason, §16.7's
  refusal that sends somebody somewhere).
- **The ladder reached back into §83's pre-pass.** The holder's own row may now
  carry no employee number at all, so where exactly one claim is ID-less that
  claim is the holder's; two ID-less rows on one address still say nothing about
  which is which, and both are refused.

### 87.6 A difference is an offer, never an instruction

Asked who wins where the file and the register disagree, Islam said the
register. That is the right way round and it is not the obvious one: **the file
looks newer because it was just uploaded, and it very often is not** — it is the
export somebody downloaded three weeks ago, edited two cells of, and sent back.
What is on the register is what people have been correcting by hand ever since.

So every field the file would change is listed, recorded value beside proposed
one, and **nothing moves until it is ticked**. *Take everything from the file* is
one press above the list, because a real HR export legitimately changes thirty
job titles and a safe default costing thirty clicks is a default people work
around by not reading the list at all.

A blank cell is still *"nothing to say"* and never appears here — that rule did
not change (§54).

**The fixed point had to be re-measured for this.** With the ticks off a plan
changes nothing whatever the file says, so a fixed-point check on the defaults
would be measuring the defaults — §51.11's check that passes because it asks
nothing. `qa.py` turns every pick **on** and then asserts the register
downloaded and uploaded back proposes nothing, which is the stronger claim; and
it asserts the other half too, that the same edited cell **unticked** offers one
change and makes none.

### 87.7 What this does not do

**Nothing merges itself.** Every join in this section is a person answering a
question the platform could not: which of two readings a file row meant, which
of two rows survives, which of two values is right. The platform's job is to
notice, to name both sides, and to refuse to guess — the same division §44 drew
for a claimed figure and §62 for a deleted function.

`src/checks/identity-merge.py`, driven through the screen, and the §87 block in
`qa.py`, driven through the rules.

---

## 88 · A Setup table row is one line (v3.24)

Islam, on the register: *"the table should NEVER NEVER NEVER wrap like that
where the row gets bigger — that's a visual mistake that should be avoided
everywhere in the setup tables."*

He was looking at a row 100px tall next to rows of 39px, with an address broken
mid-word across four lines.

### 88.1 It reverses §81.5 and §83.2, and both stay in the record

§81.5 was **Islam's own ask** — *"for the tables as well fix the overflow of data
by wrapping"* — and wrapping did what it was asked to: the register went from
207px past its box to 0. §83.2 then put a 75px floor on the address column and
brought the worst row down from 382px to 120px.

Both were reasonable and both are reversed here, because what they produced is
a table whose row height depends on how long somebody's email is. **A reversal
is recorded beside what it reverses** (Principle II), and the CSS carries the
same note: a dead copy of the old standard left in the file would reverse the
reversal on the next paint — which is not hypothetical, see §88.3.

### 88.2 The third answer neither round took

Do not wrap **and** do not overflow — **clip**:

- every cell in every Setup table is **one line**;
- a value too long for its column ends in an **ellipsis**;
- the column is **capped** so it cannot hold the table open;
- the whole value is **one hover away**.

**The cap was chosen by sweeping it**, against the worst row the register can
produce (an eight-word legal name, a 46-character job title, a 34-character
address): 130px → 110px of scroll · **150px → 190px** · 170px → 270px · 210px →
411px · 260px → 517px. 150px is where the scroll matches what the register cost
*before* any of this (1127px in a 920px box, §54.6) — a number the product has
already lived with, and one the frozen first and last columns were built to make
workable (§69.19, §69.20).

**THE HOVER IS MEASURED, NOT WRITTEN.** A `title` set at render time is a guess
about whether a value will fit — it depends on the column, the viewport and
which columns are switched on — so twenty renderers would guess wrong in twenty
places. `clipTitles()` runs at the end of `paint()` and titles only what is
**actually** clipped, removing it again when it is not. A cell that already
speaks on hover keeps its own words: the register's name cell carries the full
name and the sign-in key (§81.1), which says more than the value would.

### 88.3 THE BLOCK WAS IN THE STYLESHEET TWICE, AND THAT IS WHY EDITING IT DID NOTHING

§81.5's rule block appeared **twice** in `config.css`. The first edit changed the
first copy; the second copy won on source order and every table went on
wrapping. **This file has now made that mistake four times** (§29.2's `.pane`,
§51.5's `.capline`, §53.6's `.capbody`, and here).

A duplicated CSS rule does not fail loudly — it quietly ignores you.

### 88.4 Two checks that measured the wrong thing, inside one hour

Both found by disbelieving a number, and both are the same fault this document
keeps recording (§50.6):

- **A cell's height is the ROW's height.** The first version asked "is this
  element taller than one line", which reported a cell holding the number `7` as
  wrapping — 172 times. A `td` is as tall as the tallest cell beside it.
- **`getClientRects().length` is not the number of lines.** Chrome returns extra
  zero-width rects, so "Operational Excellence" was reported as two lines with
  `white-space:nowrap` computed on it. The number of lines is the number of
  **distinct tops** among rects that have any width.

The measurement that survives is a Range over each text node, counting distinct
line tops — the direct measurement of the thing being asserted, which nothing
around it can confuse.

### 88.5 What the check asserts, and what it deliberately does not

`src/checks/no-wrap.py`, at **1440, 1180 and 1000px** (§27.1: a layout verified
at the widths that pass is not verified — 1000px is the laptop this is used on).

It asserts three things: **no text renders on more than one line**, anywhere in
any Setup table; **nothing clipped is unreadable** — every clipped element
carries the whole of itself on hover; and **nothing is unreachable** — a table
wider than its box must sit in a container that actually scrolls.

It does **not** assert that every row in a table is the same height. A row can
be legitimately taller than its neighbour — two badges instead of one, a value
with an explanatory line under it, the add row at the foot — and failing those
would push somebody to delete real content to make a check go green. The height
spread is **printed** beside each table instead, so a table that goes ragged for
a new reason is visible to whoever reads the run.

---

## 89 · The office is two roles (v3.24)

Islam: *"I need to add the SMO team and their role needs to be below the super
user but nearly very close … let me know what should be strictly not on them."*

The Super user was doing two jobs — **owning** the deployment and **running** it.
Only the first is one person's. Until now the only way to give somebody the
second was to make them a Super user, which is not a smaller grant; it is the
same one.

### 89.1 The same grants, and three rules

**SMO team** sits directly under Super user and holds every area at edit:
group, every unit, every function, the reporting cycle, Setup. What separates
the two is not a cell in that table, and could not be — writing narrower areas
would take away whole pages in order to withhold three acts, and the team would
be unable to do the job the role exists for.

So the difference is **three rules**, in `lib/rules.js` beside §37's three,
because each is true whatever the matrix says:

1. **`mayEditAccess`** — the matrix is the Super user's. Editing it is editing
   who may edit it, so anybody who can is a Super user whether or not the row
   says so. The page stays **readable**: knowing what everyone may do is part of
   running the office.
2. **`mayDestroy`** — retiring is reversible and keeps every attribution true
   (§69); deleting, clearing a plan and clearing the tenant are not. **Merging
   is deliberately absent from this list**: it hands every pointer over before
   it removes a row and refuses if it cannot (§87.4).
3. **`mayIssuePasswordTo`** — Islam: *"for the passwords ok for the super user
   and the team members, but for the client they might be able to reset."* The
   office may let a colleague on the client's side in; it may not take a seat
   belonging to the office itself. **The test is on the TARGET, not on the act**
   — first-issue and reset are the same power, so splitting them would protect
   nobody. A Super user may still reset anybody, which is what makes them the
   way back in when the office locks itself out.

### 89.2 Nine places meant "the office" and said "super"

Reporting past a locked cycle, correcting a plan, marking a focus measure,
sending a message, reading password states. Every one is the job the new role
exists to do, so `inOffice()` replaced `hasRole("super")` at all of them.
Leaving them would have shipped a role that looks complete on the matrix and
**cannot run a cycle**.

### 89.3 THE REGISTER CARRIES THE SEAT, SO IT CARRIES THE MATRIX

Found by the check, not by reading, and it is the finding that matters most in
this section. An SMO team member holds the register at edit — and
`people[].role` is where `super` is **stored** (§33). So writing their own row
made them a Super user without ever opening Roles & access.

A role that cannot edit the matrix but can promote itself has not been
restricted; it has been inconvenienced.

`lib/authorize.js` classifies a **seat move as `access`**, whichever screen it
came from, and a **row leaving the register as `destroy`**. Everything else
about a row — name, address, employee number, where they sit — stays ordinary
setup, which is the register's day job. The seat is taken out of the comparison
on both sides afterwards, or one edit would be refused twice.

### 89.4 Enforced on the server, in both files

`api/auth.js` reads the seat off the **stored** row for `setPassword`,
`passwordStates` and `issueTemporary`, and the bulk query **excludes the office
in SQL** when a team member asks rather than trusting a list nobody sent (§35).
`api/state.js` refuses the two classifications above through `lib/rules.js`.
Hiding a control the server accepts is not a restriction, it is a delay (§42).

Checks: `src/checks/smo-team.py` asks each of the three twice — once of the rule
the server calls, once of the screen, signed in as one — and asserts the Super
user still has all three, because a check that only proves the withholding would
pass a build that withheld them from everybody. Four new cases in
`scripts/test-authorize.js` (156 passing), including the promotion above.

**Deliberately NOT withheld: Demo data.** It writes nothing — `isDemoMode()`
refuses every save (§67) — so it is a view, not a delete, and the team demos the
product.

---

## 90 · The register's furniture, and the merge becomes a popup (v3.24)

Four asks from Islam, and the first of them was a bug report.

### 90.1 "When I press merge with other row nothing happens"

It was not nothing. The merge section rendered **1086px down the page, below
the fold, with the page still at scroll 0** — drawn, permitted, and unreachable.

§70's fault reached by a different road: there a control invisible until hover,
here a control below the horizon. Both pass every check that asks whether
something is in the document.

### 90.2 So it is a popup, and that removes the class of fault

Nothing that appears where you are looking can open where you are not. It
reuses the platform's own modal (`openModalHtml`) rather than inventing one:
the page behind goes `inert`, focus moves in and returns to the ⋮ that opened
it, Escape closes — four things §48.4 had to fix once and nobody should fix
twice.

**Three steps**, because the three questions are answered at different moments
and by different reasoning: *who is this the same person as · which of the two
rows survives · what to do where they disagree*. One panel asking all three is
the panel that was there before.

`mergePaint()` rewrites the modal's **own** body and re-wires it rather than
calling `paint()`, which would rebuild the register behind an inert overlay and
leave the dialog holding a step nobody chose — §30.1's rule, and §24's: whoever
rewrites the DOM re-wires it, in the same function.

A refusal stays **in** the dialog: `mergePeople()` ends in `deletePerson()`,
which refuses if anything still points at the row, and its sentence has to be
read where the button was.

### 90.3 The file is a header button; the review is not furniture

Islam: *"put this as a button on the top beside the passwords with a drop down
to download the template or upload it, and remove the sections in the bottom of
the page."*

Steps 1 and 2 were **permanent furniture for something done twice a year**,
sitting under a 33-row table where the page's scroll ends. They are one dropdown
now, beside Columns and Passwords, where the register's other collective actions
already live (§69.22).

**What is not furniture is the review.** Reading a file produces conflicts to
answer and differences to tick (§87.5, §87.6) — a table with Apply at the end of
it — so it appears under the register at the moment it exists and goes when it
is applied or discarded. A dropdown is the right home for two buttons and the
wrong one for a decision.

The upload is a real `<input type=file>` with its **label** styled as the menu
item: a file picker cannot be opened from script without a user gesture, and a
button that reaches for a hidden input works in one browser and silently does
nothing in the next.

### 90.4 The notes went to the knowledge base, and arrived

Islam: *"remove the notes below the registry table and take them to the
knowledge base as agreed."* §30's rule applied to the last page still carrying
three paragraphs of model under its rows.

**Moved, not deleted** — each said something said nowhere else: what people type
at the door, what an issued password does next, why retiring and deleting are
different acts. They are a *The people register* section in `c_kb` now, with a
fifth paragraph on identity and merging, and the check asserts **both ends**:
gone from where they were, present where they went. A removal is the easiest
thing in the world to half-do.

### 90.5 The name column was already fixed

§88 made every Setup cell one line, the register included, and `no-wrap.py`
asserts it at 1440 / 1180 / 1000px. Nothing to do — recorded because the ask was
made and the answer is "already, and here is what proves it" rather than
"done".

---

## 91 · Merged, and nobody could have seen it (v3.24)

Islam, on the deployment card: *"actually it's still on preview."*

Two faults, independent, and either one alone would have made the last several
merges invisible.

### 91.1 The same SHA cannot be deployed twice

Every merge today pushed the **branch first** and then the identical commit to
`main`. Vercel deduplicates by commit SHA — having already built `f5e6b0f` as a
**Preview** for the branch, it built nothing when the same SHA arrived on the
production branch. Main was correct, the code was correct, and production was
several merges behind.

**The order is the fix**: `main` first, then the branch to the same SHA. The
fetch-and-compare before merging is unchanged; only which of the two pushes goes
first.

### 91.2 `SHELL` had not moved since §69

`sw.js` caches the app shell and **the cache name is the bust**. It sat at
`smp-shell-v3.22` through §80 to §90 — a new role, a rewritten register, a
merge wizard, the one-line table standard — because the built file kept the
**same filename** the whole time and the instruction to bump it lives under
*"on each version bump"*.

The service worker caches by URL. Same URL, same cache name, and every browser
that had ever opened the platform would go on serving the old one **out of its
own disk**, whatever production served. The two faults compound: production was
stale, and the fix for production would not have reached anybody who had visited
before.

**The trigger is not a version bump. It is the built file's bytes changing** —
which is every merge, and is now written where the constant is.

### 91.3 What this says about the checklist

Both faults are the same shape: a step that fires on a **name** changing, for a
thing that goes wrong when **contents** change. The version-bump checklist in
`CLAUDE.md` has six items and five of them really are keyed to the filename
(the gate's link, the rewrite destination, `PLATFORM_FILE`). `SHELL` was sitting
in that list and does not belong to it.

### 91.4 The order was not the fix, and saying so is the point

§91.1 above concluded that pushing `main` before the branch would solve it. It
does not. `8de38f8` was pushed to `main` first, by itself, and produced **no
production deployment at all** — production stayed on `29fe69d` (§88), proved
byte-for-byte: the served platform is 2,016,692 bytes, identical to that
commit's built file.

What actually happens is a **race**, not an order. Both refs receive the same
SHA within a second; Vercel deduplicates by SHA and builds once, attributing
that one deployment to whichever ref it processed first. §88 won the race and
became Production. The three merges after it lost it and became Previews of a
branch.

**So the fix is that the branch must not carry the same SHA yet.** Push the
merge to `main`, confirm it deployed, and fast-forward the branch afterwards.

### 91.5 And the only proof is the bytes

Three merges were reported as done — correctly, against git — while production
served none of them. Every check in this project ran against the local build,
and the local build was right. Nothing in the workflow ever asked the question
the client's browser asks.

It does now: **read the live site after every merge**, not the dashboard.
`sw.js`'s `SHELL` and the served platform's byte count answer it in two
commands, and both are things a screenshot of a deployment list cannot tell
you — the list said "Ready" for all four.

---

## 92 · One destination is not a question (v3.24)

Islam: *"I added SMO to Mohamed Essam but the employee role persisted and SMO
wasn't added."*

It had not been added. The register's role picker is two halves — the role in
the Roles column, where it is held in the Unit column — and it commits when the
**second** half is answered (§69.1, and both halves start blank on purpose: a
picker that commits on its own must never commit something nobody picked).

**A seat held over the group has exactly one place to hold it.** So the control
rendered a dropdown containing one option and waited to be told which of the one
to use. Doing nothing looked exactly like a broken button, and Employee stayed
because Employee is what is read when somebody holds nothing else (§55) — a true
answer to a grant that never happened.

**§32 had already settled this shape twice** — the gate's Starting page, and a
Manage menu holding one item: *a door behind a door.* The comment beside this
very code claimed the one-destination case "says it rather than offering a list
of one", which is what it should have done and is not what it did.

So: where a role can be held in exactly one place, it is granted **on the role
pick** and the second half never appears. Everything with a real choice — a unit
owner among ten units, a custodian among eighteen, a company CEO among two — is
unchanged and still asks.

**The undo is what makes committing on one press safe**: the × on the role chip,
which is exactly the argument §69 used to remove Give and Cancel.

Three roles were affected, and they are the three seats: Super user, **SMO
team** and Group CEO. The new one is the one somebody reached for first.

### 92.1 And the check was wrong before the product was

Asserting the second half of it — that a role with a real choice still asks —
timed out for thirty seconds waiting for a ⋮ that the register is **right** not
to draw: the row was still open from the first grant, and an open row shows Save
and Cancel where the menu was (spec 012 §2.1). The check now asserts that too,
rather than working around it.

---

## §93 — Employee stops being a role, and the password column stops lying

Two of Islam's four, and they are the same fault seen twice: **a screen showing
something true about the platform's internals and false about the client's
world.**

### 93.1 The floor is not a role

> *"I don't get the employee role. Anyone with no role is employee — if that's a
> glitch let's fix it. Employee doesn't give the person anything, and if so then
> let's remove this strange role."*

He is right, and the giveaway is that it could not be taken off anybody. It was
never granted: §55 derived it for whoever held nothing else, so the register drew
a chip nobody could remove, on a row that in fact held nothing.

**The floor stays; the role goes.** What somebody on the register with no role
may open is still a real question, and still the client's to answer — so it is
still a row on the access matrix, titled **Everyone else** and marked as not a
role. What changed is that nobody *holds* it: `personRoles()` returns `[]`, the
chip is gone, and the role picker no longer offers it.

**Stored under the key it always had.** Every deployed tenant's saved access map
has an `employee` row in it, and a saved map is merged with the defaults rather
than replacing them (§30.2). Renaming the key would have made the change a
migration for a word nobody reads (§58's rule) — and worse, would have silently
reset every tenant that had tightened it.

**THE FLOOR IS READ THE SAME WAY A ROLE IS, or it is wider than a Contributor.**
The first cut put the fallback inside `grantIn()` alone, and the authoriser test
found the hole within a minute: `editingRoles()` walks `personRoles()`, which for
a floor person is empty, so `onlyOwnLines()` answered **false** — and a client
who set Everyone else to *edit* on their own unit would have given every unroled
person on the register the right to rewrite their unit's whole plan, which is
more than a Contributor gets. `rolesOrFloor()` is the one list both read now, and
`OWN_LINES_ONLY` carries the floor beside `contrib`.

### 93.2 A dash meant "we never asked"

> *"The password status is all dash now, what is that status?"* … *"Some people
> already changed the passwords, the all -s are not actual, plus I set a temp
> password already — is that missing now?"*

Nothing is missing. `credentials` is its own table, deliberately outside the
state graph that a save TRUNCATEs (§69), so every real password and every
temporary one is exactly where it was.

The column was never asked. The fetch was gated on
`document.querySelector('[data-edit="people"]')` — **the page's old edit pen**,
which spec 012 removed when the register went to per-row editing. The gate was
looking for a control that no longer exists, so `PWSTATES` stayed `null`, and
`null` renders as the dash that means *not asked yet* (§35). It is gated on the
register itself now (`.peoplecfg`).

**And a failed ask is not an answer.** The old code returned on error and left
`PWSTATES` null — so a server that refused, or was unreachable, produced the same
all-dashes screen as one that was never asked. It stores `{__error}` now, the
column says **unreadable** with the reason in its title, and the "N with no
password" count refuses to count over it: counting an error as absence would have
reported everybody as having no password, which is the same quiet-wrong-answer in
a different place.

**The lesson is §51.11 from the other side.** That rule says: when a control
changes shape, grep the *checks* for the old selector. This was the *product*
holding a selector for a control that had been removed — and it fails the same
way, silently and in the safe-looking direction.

### 93.3 One chip too many

> *"The unit selected should be a normal selection, not a pill."*

The register's Unit cell drew a `.uchip`. That chip is right where several sit
side by side and the boundary between them is the point — the BU list's mapping
cell, which is what it was built for. Here there is exactly one value, in a
column whose heading already says what it is, so the border drew a box around the
only thing in the cell. It reads as an ordinary value now, like the row's others.

Left alone, on his own instruction: the role chip's place label. *"Keep it then —
when I fixed the unit it disappears"* — it is already suppressed where a role has
one possible place (§92), which is the case that looked wrong.

### 93.4 A note about the units nobody is keeping

> *"I want as well to leave a note somewhere by how many units that doesn't have
> custodians."*

**On the register**, beside the counts that are already there, because the
register is where the gap is *closed*: a custodian is given from a row on this
page, so a count anywhere else would name a problem and point at a different
screen. Amber, like the two beside it — a unit between custodians is a normal
state on a Tuesday and a permanent one is a problem. The unit names are on
hover, because a count with nothing behind it sends somebody looking.

**A retired person is not a custodian.** The seat is a key written on the unit,
and retiring somebody revokes their roles (§35) without clearing that pointer —
so asking whether the field is empty would report a unit as covered by somebody
who cannot sign in. It asks whether a person is there **and** active.

**AND THE PILL PUSHED A BUTTON OFF THE PAGE.** `.phead2` has wrapped since it
was written; `.hright` inside it never did, so it stayed one row and simply
overflowed the pane — and *Register file*, the header dropdown §90 had just
built, went out of reach the moment a sixth chip joined the row. **§90's fault a
third time**: present in the document, styled, enabled, and hitting `BODY`.
Every check that asks whether it exists passed; a screenshot showed it in a
second. The check presses the point now — `elementFromPoint` at the button's own
centre has to come back as the button — and `.hright` wraps.

### 93.5 A table page is not a notification area

> *"Screenshot — don't bring this again. Here this page is a table page, not for
> other notifications."*

After a merge the wizard closed and left a **Merge two rows** panel standing
under the register saying what had happened. That is the same argument §90 made
when it moved steps 1 and 2 *into* the dialog: what is said about an act belongs
where the act was.

So the receipt is the wizard's **last step**. The dialog stays open, says what
it did, and **Close** is what ends it. The register behind is repainted — which
is where the change becomes a save — and it is a table again.

The order matters and is written down: `mergeReset()` first (it clears every
field of `PMERGE`, `done` among them), then `done`, then `paint()`, then
`mergePaint()`. `paint()` is safe here because the overlay lives outside the
wrap it rewrites.

**And the page-level wiring went with the panel** (§24). Leaving it would have
been worse than dead code: it was a `document`-wide query for
`[data-pmerge-close]`, and the dialog's own Close and Cancel carry that
attribute — so with `paint()` now running while the wizard is open, it would
have bound a second handler to them, one that resets the merge without closing
the dialog.

### 93.6 The name column fits the name, and two values copy themselves

> *"The first column with the name needs to fit the name, and make the email and
> the phone to be copied on clicking on them."*

**The first half reverses §69.21 and §81.1 together.** Three names was the
column's budget, and §81.1 lengthened it only for the pair it could not
otherwise tell apart — *Ahmed Mostafa Mohamed El Gebely* and *Ahmed Mostafa
Mohamed Abou El Einen*. Both were answers to a column that had to stay narrow,
and the reason it had to has not held since §69.19 made it the **frozen**
column: it is the one column a wide table never scrolls away from, so it is the
wrong place to save pixels, and a name cut off in the only place it is written
is what put one human on this register twice (§87).

Still **one line** — §88 is unchanged; the column grows sideways, never
downward, and it is exempted from the 150px cap rather than the cap being
loosened for every cell.

**The cost, measured and recorded rather than glossed:** with the client's
longest real name — *Abd El Moniem Mohamed Abd El Moniem Mahmoud* — the Person
column renders at **392px** and the table at **1489px in a 920px pane**. That is
a wide horizontal scroll with 392px of it permanently spent, and it is the price
of the ask. `shortName()` is untouched and still what the merge wizard, the
picker and the audience list use: those are sentences, not a column.

**The second half is small and has one trap in it.** The address and the number
are the two values on this register that always leave it, and selecting text
inside a horizontally scrolling table with a frozen column is a drag that starts
a scroll instead. They are buttons now — real controls, keyboard-reachable,
announced — that look like the value and copy it on click.

- **The word is written into the element, not painted.** `paint()` would replace
  the button that was just pressed (§63, learned on Save draft), so the tick is
  set on the node and put back on a timer, with the original text kept on the
  node so a second click during the tick does not copy the word *Copied*.
- **The `execCommand` fallback is not decoration.** `navigator.clipboard` needs
  a secure context and this product is opened from `file://` every day of its
  life — so the hidden-textarea path is the one that actually runs here and the
  promise path is the one that runs in production. A failure says *Press ⌘C*
  rather than ticking anyway.
- **The value goes in the `title` beside the hint.** §88's `clipTitles()` only
  fills a title that is empty, so a bare *"Click to copy"* would have taken the
  hover away from exactly the values too long to read — the one case the hover
  exists for.

### 93.7 The Performance page went unmeasured for the third time

Found while reading the contrast sweep's own output rather than its total: it
printed `(picture sweep skipped: …)` and carried on.

**§50.6 already fixed this once.** It found `unit/perf` measuring the *Plan*
page twice and the Performance page never — for twelve versions, silently and in
the safe direction — and fixed it by clicking the tab explicitly, with a comment
saying so. Then **§69 made the tab read "Performance — not submitted yet"** when
a submission is owed, the exact-string match `=== 'Performance'` stopped
matching, the click stopped happening, and the sweep went back to measuring the
landing page under the name of a page it never opened.

It took two more states with it. `[data-picedit]` only exists on Performance, so
the picture-slide editor and the deck's picture slide — both opened on purpose by
§50 precisely because *a state nothing navigates to is a state nothing measures*
— were never reached, and the sweep said "skipped" in a line nobody read.

Two changes, and the second is the one that matters:

1. **Match the PREFIX.** The suffix is a status, not the name.
2. **Assert that it worked.** A helper that returns quietly when it found no tab
   is the same fault with a nicer face. It raises now.

And the assertion is asked of **`currentSub`, not of a `.on` class** — these
buttons carry no such class, so an assertion written against one would have
failed always, which is the same lie pointing the other way.

**The total went from 6 to 44 the moment it started measuring**, and not one of
the 38 is new. They are `71%`, `88%`, `58%` and the `%` beside them at 3.19–3.77
— **§16.15's list, value for value**: scoring colours used as TYPE on a page
that never got the `-tx` twins §38.5 gave the rest. One more (`num.final.attn`
at 2.99 on the slide editor) is the same family on a state that has never been
measured at all.

They stay recorded and unfixed, on §16.15's own precedent and §25's before it: a
palette decision does not get made inside a change about the people register.
What has changed is that they are **in the total** rather than behind a check
that was quietly looking elsewhere — which is the entire value of the fix.

**43 pages and states before, 44 after.**

### 93.8 Name and Full Name

> *"For the people names, don't you want to have a column for the full name and
> the user name which might be 2 names only for daily use?"* … *"We can have it
> Name and Full Name. For the identifiers keep it for the ID and email only."*

**It reverses half of §93.6, a day later, and it is the better answer.** That
section widened the frozen first column to hold *Abd El Moniem Mohamed Abd El
Moniem Mahmoud* — 392px of a 920px pane, permanently, on every screen. Splitting
the two facts gives most of it back: **216px**, with the whole legal name one
column to the right.

The register was carrying two different facts about what somebody is called in
one column, and every previous answer was an attempt to make one column serve
both. §69.21 cut it to two names; §81.1 lengthened it for the pair that clashed;
§93.6 widened it to fit everything. Two columns is what all three were reaching
for.

**Not "user name."** Islam's own phrase, and it had to be turned down: the
register already has a **Sign-in name** column, and two columns whose names both
suggest a login is exactly how two rows for one human get made (§87). *Name* and
*Full Name*.

**Stored, not derived, and that is the whole reason it is a field.** The first
two names are a good guess and a bad rule — plenty of people go by their third
name, by a shortening, or by something the file never says. A derived-only
column is one nobody can correct, and correcting it is the point.

- `knownName()` reads (typed, else the guess) and `setKnownName()` writes;
  clearing it back to the guess **deletes** the key rather than storing it, or a
  later correction to the full name would leave a stale short one beside it.
  §50.6's rule: a reader must never create the field it was looking for.
- **§81.1 moves rather than dies.** It no longer disambiguates a *column* — it
  disambiguates the **guess**, for anybody who has never corrected theirs, so
  two people whose first two names match still read as two rows for somebody who
  has hidden Full Name. A typed value always wins and is never lengthened.
- The map is built **once** by the three callers that walk the whole register
  (render, export, file plan), never per row.

**AND THE OLD FILES STILL READ.** Every people workbook downloaded before today
has a `Name` column holding the *full* name, so the new pair could not simply
take those headers — read blindly, an old file would put a five-part legal name
into the short column and leave the full one empty. §58's rule a third time —
*write the new label, read either* — with the twist that the old header's
meaning is decided by what sits beside it: **`Full Name` present means `Name` is
the short one; `Full Name` absent means the file predates the split and its
`Name` is the full one.** Decidable from the row itself, which is what makes it
safe.

**`known` IS A LABEL AND NEVER AN IDENTIFIER**, on Islam's explicit instruction:
*"for the identifiers keep it for the ID and email only."* §87's ladder is Emp ID
then email and stops; this adds no rung, and nothing — not the upload, not the
merge, not the door — resolves on it. Two people really can be "Ahmed Mostafa".
It is a **pick** on an upload like any other field, and the register wins by
default: it is the column most likely to have been typed by the SMO and left
alone in an export, so it is exactly the one a file must not overwrite quietly.

No migration: `people.extra` is jsonb and `lib/state-io.js` files every
unrecognised key there and reads it back — the same mechanism `email`, `phone`
and `empId` already ride on (§52, on units).

### 93.9 The railed pages get the whole window

> *"The page is wide, however the rail on the left and the tables are stuck in a
> confined space with a lot of buffer on right and left."*

1180px is a **reading measure** and it is right for the pages it was chosen for:
a unit's plan, the knowledge base, a group's foundation are prose, and prose has
an optimum line length. A Setup page is a rail and a table, and a table has the
opposite need — every pixel it is denied becomes a horizontal scroll inside a
box.

So it is an attribute on the root (`data-wide`, set from `railed`) rather than a
rule on `.wrap`: the chrome's three rows are capped at the same 1180, and
widening the content alone would leave the navigation indented from the page
under it. Four containers, one state, every other page untouched.

1600px rather than no cap at all — a table stretched across a 32-inch monitor
puts its first and last column a head-turn apart, which is what the register's
frozen columns exist to prevent.

**Measured:** the People register goes from **1354px in a 920px box** — 434px of
permanent horizontal scroll — to **1354px in a 1340px box**, which is no scroll
at all.

### 93.10 A row you could not finish editing

> *"A quick bug — when I edit a row, that's how the editing cells look like."*

The open row ran past the right edge of its box with the frozen Save/Cancel
column painted over Email, Roles and Status. The fields were there and
unreachable — §70's fault again, a control that is present and cannot be used.

**The cause was `max-width:none` on `tr.tk-open td`.** A read row's cells are
capped at 150px (§88); an open row's were not, so every field took its intrinsic
preferred width, every column it sat in grew, and the table went from 1354px to
**1608px** the moment a pen was pressed — inside a box that had not changed. A
table that changes width when you start editing is a table that moves the thing
you were about to click. Capped, it opens at 1435px, and the wider page (§93.9)
absorbs the rest.

`overflow:visible` stays: a capped cell that also clipped would cut the controls
off instead of the table.

**Two things were chased and found innocent, and both are worth the space.** A
`<select>` in these cells computes to the width of the whole box — 920px, 1340px,
whatever the box is — because the cell has no definite width under auto layout,
so a percentage resolves against the box. That is §69's feedback loop and it
looks alarming in a measurement; it is also harmless, because `.ss-native` is
`position:absolute`, `opacity:0` and clipped. And a px cap on the open row's
text fields computed correctly at every value tried and changed nothing on
screen — so it was **removed rather than left in** (§37): a rule that changes
nothing is worse than no rule. The 12px of overlap it was aimed at is recorded
instead.

### 93.11 A comment ate the rule

> *"Roles and access headers needs to be wrapped."*

§88's one-line standard (`.cfg table thead th { white-space:nowrap }`) had
silently overridden the access matrix's own `white-space:normal`, and seven
headers that each explain what a column covers went back to running straight
across their neighbours. The paragraph above the original rule had predicted
exactly this fault; §88 was written later in the same file, broader, and won.

**The fix took four attempts and only the last one is the lesson.**

1. `.cfg .acgrid thead th` — matched nothing: both classes are on the **same**
   element (`<div class="cfg acgrid">`), so the descendant combinator was wrong.
   It measured exactly like the bug.
2. `.cfg.acgrid table thead th` — correct selector, and still nothing. `matches()`
   confirmed it hit the element. `!important` changed nothing.
3. The reason was that **a comment I had written swallowed it**: correcting the
   selector left a paragraph sitting after the `*/` that closed the comment
   above it, so the parser met prose where a selector belonged and discarded the
   block that followed.
4. With the comment repaired it *still* did not apply — and the decisive
   measurement was asking the browser for its own parsed rules: the stylesheet
   contained 1593 rules and not that one, while every neighbouring `.acgrid`
   rule was present.

**WHEN A DECLARATION THAT PROVABLY MATCHES PROVABLY DOES NOTHING, SUSPECT THE
PARSER, NOT THE CASCADE** — and read the built stylesheet through
`document.styleSheets`, not the source line. The rule now lives in `arrange.css`,
which build.py concatenates last, beside the two exceptions this same table has
already had to keep there for the same reason (§69). Third time.

### 93.12 The register speaks the navigation's language

> *"For the units name in the people register let's use the navigation names,
> and for the units remove the word function that comes between brackets."*

`placeLabel()` is the register's own vocabulary and `roleWhereLabel()` is
unchanged — the latter is what the people workbook's Unit column is written from
and read back against (§65), so renaming it would leave every file downloaded
before today failing to match.

**The suffix is dropped from seven of eight functions and kept for one**, and the
exception is not a hedge. §65 added `(function)` because this tenant has a unit
and a function that share a name, and that is still true: **Care** is both, with
the same navigation name. IT is not — the unit is *IT Dist.* — so IT loses the
suffix along with the rest. Same shape as §81.1's names and §65's own near-miss
rule: disambiguate the pair that clashes, leave everybody else alone.

### 93.13 A question the register has already answered

> *"Ahmed Mostafa's unit is already set in the registry table, he shouldn't get
> the dropdown of what unit he belongs to."*

It follows from what the declaration *is*. §56 built it as a thing that **grants
nothing**: the person says where they think they work, and the SMO — who decides
— accepts it on the register. Where the SMO has already placed them, the question
has been answered by the only person whose answer counts, and asking again offers
a choice that changes nothing.

**The test is the attachment, not the Official BU.** `unit_key` / `fn_key` /
`company` are what `personAt()` reads and what decides access (§54.1); an
Official BU is the client's own word for a department and may point at nothing
here (§58.3), so a row carrying only that is still a row nobody has placed.
"group" does not count either — every seat role sits there.

**Decided on the server**, like the short list beside it and for the same reason:
a page that decides whether to ask has decided nothing, because it still had the
question.
### 93.15 The platform knew, and had no screen that could say so

> *"A very strange thing. I sent a message, everyone received it but not the SMO
> team."* … *"I added them by function and by people selection directly, and
> still they didn't receive the email."*

**I guessed twice and was wrong twice**, which is the part of this worth keeping.
The first guess was that the SMO team sit at the group and a units-only
selection would miss them — true of the resolver, and irrelevant here, because a
direct People pick matches unconditionally. The second was the shape of the
audience criteria. Both were reasoning where a measurement was available.

**The measurement was available.** Every send writes a `message_recipients` row
per person: the address it used, whether the provider accepted it, the provider's
error, and the provider's own id. `historyOne` has returned all of it since the
table existed. **Nothing in the client has ever called it** — the record was
written on every send and could not be read back from any screen, so the single
question a record exists to answer had to be guessed at.

**The three outcomes are three different problems**, and separating them is the
whole value of the screen:

| | | |
|---|---|---|
| **absent** | never resolved into the audience | fix is on the register |
| **failed** | the provider refused it, and said why | fix is the address |
| **sent** | handed over, id returned | delivery — a filter, a rule, a full mailbox |

The last one is the one nothing on this side can fix, and **knowing that is the
point**. "44 of 47" tells you a number and none of the three.

Failures sort first and are named, the same rule the audience summary already
follows: *3 failed* tells nobody which three, and each is a different fix.

### 93.15a Two CSS lessons, one of them mine from the same day

**A `table-layout:fixed` table takes every width from the header row (§46), and
four attempts were spent refusing to believe it.** `.cfg table` is fixed;
`table-layout:auto` was written at three increasing specificities and stayed
computed as `fixed`, while a `width` from the *very next line* applied. Setting
the four header widths instead worked first time. When a layout mode will not
turn off, build with it rather than against it.

**And §93.11 happened again, hours after being written down.** Editing a comment
left a paragraph after the `*/` that closed it, so the parser met prose where a
selector belonged and discarded the block. It is the same fix and the same
check: ask `document.styleSheets` what the browser actually holds — though note
that query is not decisive on its own, because a rule missing from the dump can
still be applying. **The element is the authority**: `matches()` for whether the
selector hits, and `getComputedStyle` for whether the declaration won.

---

## 94 · The strategy tab is the office's, people open where they work, and Report goes solid (v3.25)

> **Numbered §94, not §93.** This work and the register's were built in two
> sessions on the same day; §93 reached `main` first, so it keeps the number
> and this took the next one. Recorded rather than silently renumbered,
> because the two sections found the SAME broken assertion in
> `test-authorize.js` independently — see §94.5 and §93's own note — and that
> coincidence is the useful part: a check that could not fail was invisible to
> two people reading the same file for two unrelated reasons.


Three asks in one message, on 2026-08-25. Two of them turned out to be half
built already, and finding out which half is most of what this section is.

### 94.1 "Don't allow anyone else other than the SMO and super user to edit the strategy tab"

Islam added *"these are already set"*, which was true of exactly one page of
four. Asked whether he meant the plan alone or the whole tab, he answered:
*"I tested and the custodian found the pens."*

**§31 CLOSED THE PLAN AND NOTHING ELSE.** A plan arrives by upload and is
corrected by the SMO alone — *a plan correctable by the person measured against
it is a different decision from one correctable by its custodian.* That argument
is exactly as true of the **aspiration** the objectives hang off, the **SWOT**
the pillars were reasoned from, and the **definition** of a capability. Only the
plan had ever been asked, so a strategy custodian could not touch the measures
and could rewrite the aspiration above them. **That is not a smaller grant, it
is a stranger one.**

`STRATEGY_PAGES` in `lib/rules.js` names the five pages once — `u_found`,
`u_anal`, `u_plan`, `k_found`, `k_proj` — and `mayAuthorPage()` is the one
question both sides ask.

**THE UNIT OF THE DECISION IS THE PAGE, NOT THE AREA.** `a_unit_own` also
carries Performance and My reporting, which the unit's own people must keep, so
closing the area would have taken **reporting** away in order to withhold
authoring. Three things are deliberately NOT on the list: the group's own pages
(Islam said *units or functions*, and `a_group` edit is the office's already),
every reporting page, and **Strategy › Who enters** — which is a section of the
tab, but sits behind a tenant switch that is off by default, and turning it on
is the office deliberately handing naming to the custodian (spec 008 §3B). **A
rule cannot close a door somebody has to open on purpose.**

That third one was raised as an open question at handover rather than decided
quietly, because it is the one place where §94.1 read literally and §94.1 read
for its reason disagree. **Islam, asked directly: "leave it."** So it is his
ruling and not a judgement call left inside the code — which matters, because
the next person to read `STRATEGY_PAGES` will find one page of the tab missing
from it and should find out why here rather than guessing.

The switch is `Setup › Figure sets → Edit`, *"Unit custodians may name who
enters a figure"*, and it ships **Off** — so today the section does not exist
for anybody, the SMO included. If it is ever turned on, this is the decision to
revisit: at that moment a unit owner and a strategy custodian gain a section of
the Strategy tab, and that will be on purpose.

### 94.2 The gate is on the control, not on the eleven call sites

`penBtn()` and `editBar()` both began `if (grant(acKey) !== "edit") return ''`,
and every pen in the platform is drawn by one of them. They ask `mayAuthor()`
now, so **a pen added to a strategy page later is gated on the day it is added**
and not on the day somebody remembers — §42's fall-through rule, on the screen
instead of the server.

**AND THE FIELDS ASK AGAIN.** `EDIT_PAGE` is a switch, and a switch survives
things a grant does not: the viewer switcher repaints **without leaving modes**,
so an open Foundation pen followed the SMO into a custodian's view and the
fields stayed editable for somebody the rule closes them to. `authoring(page,
acKey)` is the pair asked together — and it takes the **access key** and not
just the page name, because the group's Foundation and a unit's share one page
key and only one of them is a strategy page. The viewer switch calls
`leaveModes()` now, which every other navigation in the platform has done since
§63.1.

### 94.3 Reordering is authoring, and it was already being refused

`canArrange()` ended at `grantAt("u_plan", unitKey) === "edit"` — held by a unit
owner and a strategy custodian on their own unit. **So the pen was closed to
them and the drag handles were not**, and the order of a plan is as much a part
of what was agreed as its words.

It was not even a working grant. `lib/authorize.js` compares the row ids **in
order**, so every one of those drags was classified as a plan change and
**refused on save**: the rows moved on screen and the save came back rejected.
§63.3 had kept an explicit Arrange button *precisely* so a BU head with no pen
could still reorder, and it had been handing them something the server would
never accept. That button no longer draws for them.

### 94.4 Three drifts, all in the direction the screen says yes and the server says no

The rule `lib/rules.js` exists to prevent, found three times in one afternoon —
twice inside the file that enforces it.

- **`unitPlan` asked `isSMO`** — the Super user — while the pen asked
  `inOffice()`. **An SMO team member was offered the plan pen on every unit and
  every save came back refused**, for as long as §89's role has existed.
- **`capPlan` asked only `edits(…, "fn", …)`** — so a function head could write
  with the API what the screen would not draw for them. A capability's
  definition, key objectives and projects **are** a supporting function's
  Strategy tab.
- **`hasRole("super")` was the tenth place meaning "the office"** (§89 named
  nine). A function's Reporting page let a Super user report past a locked cycle
  and a unit's asked `inOffice()`, so the two sides of the navigation switch
  disagreed (§53.5) — and the server refused both. All four `locked && !smo`
  gates are `!office` now.

### 94.5 And the most important test in the suite could not fail

*"1 · may not touch the access matrix"* set `access.smoteam.a_setup` to
`"edit"` — **which it already was**. The mutation produced an identical map,
`same()` saw no change, and the save was allowed with an **empty** change list.
So §89's first and gravest rule had never once been exercised, and the suite
printed *155 passed* while saying so. §54's lesson in its purest form: **a check
that cannot fail is not a check.** It moves a row that is genuinely different
now, and the suite gained the two halves §94 needed on both sides of the switch.

The two tests asserting that a unit head **may** write their own foundation and
SWOT were **moved, not deleted**: what changed is the answer, and a deleted test
would leave nothing saying the answer used to be the other one.

### 94.6 "The default opening page for the users is on the plan in the strategy"

Half true since §28: a unit opens on Strategy › Plan and a function on Strategy
› Projects. What was never true is **which destination opens** — `var current =
"group"` was a literal, and `paintUnits()` only corrects `current` when it names
somewhere the viewer cannot reach. The group is reachable by nearly everybody,
**so the correction never ran**: a unit head signed in, read a group score they
do not own, and had to find their own unit before reaching the plan.

`entryDest()` answers the door and `entrySub()` answers the page. Where somebody
sits is **`personAt()`** — the one pair that answers that question (§54), the
same answer the register shows and the people file writes, so moving somebody to
another unit moves where they open with nothing else to change. **Attached to
the group means the group**: the SMO and the group CEO both sit there, and for
them the group's Performance page *is* their own place.

**AND IT IS CHECKED, NEVER ASSUMED** — against the list `paintUnits()` has just
built of every destination this viewer can open, so somebody attached to a unit
their roles no longer reach lands where they landed before this existed.

### 94.7 The target was the one on screen, not the one being asked about

`entrySub()` called `allowed(defsFor(k))` with no target, and `allowed()` falls
back to the global `TARGET` — which **both** callers ask before `paint()` has
moved it. So a unit head walking from the group to their own unit had their
unit's tabs judged against `"group"`. It is the exact fault the long note beside
`TARGET` in `paint()` records, sitting in the one place that had not been
corrected; found only because §94.6 made that path the FIRST thing that runs.

### 94.8 Report is the one solid button in the product

Islam: *"the report button in performance make it all orange to obvious for the
user and bring the 2 buttons above the reading colours rectangle."*

**A REFERENCE STRIP IS NOT A PLACE FOR ACTIONS.** Report and Presentation rode
in `.bands-act`, at the right-hand end of the band legend — a strip whose whole
job is explaining what the colours below it mean — and on a narrow window they
**wrapped with it and moved**. They take `.pageact` now, which is **not a new
component**: a supporting function's Performance page has carried exactly that
row since §63, so this is the unit catching up with the function (§53.5). The
group's page still puts Arrange in the legend, which is where a control that
rearranges the thing being explained belongs.

**THE ORANGE IS TWO TOKENS, BECAUSE §38.4 CUTS BOTH WAYS.** The bright orange
that works as a FILL on a card cannot carry white type (2.46:1); the deep orange
that works as TYPE is too dark to read the page's own ink off. So `--cta` /
`--cta-ink` are declared together, one line per palette, both values already in
the palette — light takes the deep orange with white (5.54, 5.18), dark takes
the bright one with the page's near-black (7.26, 7.89). Nothing is invented, so
a tenant's branding recolours the button with everything else.

**IT IS ONE FILL, ONCE.** §41's accent budget is not broken by this: the button
is drawn only while a cycle is OPEN and only for somebody who may report, so the
page is back to its quiet register for the rest of the quarter. And the
*Submitted* badge inside it is an **outline**, not a wash — a white wash lightens
the ground under its own text to about 4.2:1, which is the fill/type trap again,
one element in.

### 94.9 And the move was reversed the same day, for a better reason

Islam, having looked at the built row: *"I think we can leave the 2 buttons in
the same line with the reading colours and we can even shrink the reading
colours a bit in font size so the buttons are more obvious."*

Recorded as a reversal rather than overwritten, because the second answer is
right and it explains the first one's mistake. **THE PROBLEM WAS NEVER WHERE THE
BUTTONS WERE.** It was that they read as quietly as the strip beside them: two
12px uppercase controls against a 12.5px reference legend, all of it the same
weight of grey. **Moving them spent a whole row of vertical space to solve a
contrast problem** — and it worked, which is exactly why it was worth stopping
to ask whether it was the right instrument.

Making the legend smaller solves it where it is. The row now has one thing that
shouts, one that speaks and one that whispers, in that order: Report solid at
12px, Presentation outlined at 12px, the legend at 10.5px with its label at
9.5px. **The colour dots come down with the text** — a 13px circle beside
10.5px type stops being a swatch and becomes a bullet.

**10.5px IS THE FLOOR, AND IT IS THE PRODUCT'S OWN.** Islam asked for one more
step after seeing 11px, and this is where it stops: 10.5px is the size every
uppercase key in the platform already wears, and the label at 9.5px is
`--fs-micro`, the smallest type in the design language. So the legend is now as
quiet as anything the product says rather than quieter than everything — which
is a floor with a reason behind it, not a number that happened to look right. `.bands-act` gained a gap, because it
now holds two controls where it held one and a solid button touching an outlined
one reads as a single split control.

§94.8's first half is therefore **not built**: the unit's Performance page keeps
its legend row, and `.pageact` stays what it was — the function's page's row, and
the group's Arrange still rides in the legend. The solid orange, the two tokens
and the outlined badge all stand.

**AND THE CHECK CHANGED WITH IT, INTO A BETTER CHECK.** It had asserted a
POSITION — *Report has left the legend* — which a reversal makes false and which
was never the thing that mattered. It asserts the **order of loudness** now: the
legend must measure smaller than the buttons beside it, and its label smaller
still. That is what was actually wrong, and it is what a later stylesheet edit
could silently undo. **A check written against the last instruction is a check
that has to be rewritten every time somebody changes their mind; a check written
against the PROBLEM survives the change.**

One trap on the way, and it is §50.6's: the first version measured
`[data-present]` and reported the two buttons 127px apart **and overlapping at
once**. Presentation is a `<details>`, so the element carrying that attribute is
a menu ITEM inside the closed popup — it has a box, at a position that means
nothing. What is on the row is the `<summary>`.

### 94.10 Nothing wears a colour it will have to change

> *"When I open the platform it opens on a color scheme and then it glitches
> and shifts to the current color. Can this doesn't happen?"*

**TWO THINGS ARRIVE LATE, NOT ONE**, and only the visible one was reported. The
tenant's accent and bar are set on **Setup › Branding** and live in the
database, so `boot()` painted from the baked file and repainted when
`/api/state` answered — that is the colour shift. But the worked example is
baked into the file too, so on a client's deployment that same moment is a
flash of **Raya Trade's units and figures** before their own arrive. Same
cause, and worse.

The first answer put to Islam was to remember the applied branding in
`localStorage` and paint it from the head — the trick `theme.js` already uses
for light and dark. He asked for a **skeleton** instead, and it is the better
answer for a reason worth keeping: **remembering the colours would have fixed
the colours and left the content flashing.** One mechanism, not two, and no
cache to go stale.

**THE PALETTE IS THE WHOLE IDEA.** Everything the skeleton wears —
`--surface-2`, `--line`, `--ground` — is the page's own neutral, and none of it
is brandable: `brandTokens()` writes only the `--gold*`, `--on-accent`,
`--accent-glow` and `--panel*` families. So nothing on that screen can change
when the branding arrives. **A skeleton that kept the navy bar would still swap
it a moment later**, which is why the real chrome is *hidden* rather than
dimmed. Both themes come free, because those tokens are already redefined per
palette and per theme — somebody who chose dark waits in a dark skeleton.

**AND IT DOES NOT PRETEND TO BE A PARTICULAR PAGE.** Until the server says who
this is, the platform does not know whether it is opening a unit's Plan (a rail
and a pane) or the group's Performance (cards). A heading and three blocks is
true of both; a rail would be right for one and wrong for the other.

**THE SWITCH IS IN THE HEAD, WITH `theme.js`'s ARGUMENT.** That file exists so
the page never paints light and then flips; this is the same sentence about the
tenant's colours, which cannot be answered the same way because they are not in
the browser. The page *cannot* open in the right colours. It can open in **no**
colours — §32's rule at the gate ("before the answer is known there is exactly
one honest thing to show, and it is nothing"), one surface further in. It is
deliberately not `SYNC`'s check moved earlier: this has to run before `sync.js`
exists, and a boot state waiting on a script further down the page is one frame
too late, which is the whole fault.

**EVERY EXIT FROM `boot()` IS NOW LOAD-BEARING.** The line that was removed —
an unconditional `paint()` before the fetch — was also the safety net: whatever
happened next, something was on screen. Nothing else paints this page now, so
`land()` is one idempotent door and four things go through it: the answer, a
failure, a backstop at 8s, and `file://` (where the class is never stamped and
`bootLand()` is called anyway, so the two can never disagree). A **401** is the
one case that deliberately does *not* paint — the browser is already going to
the gate, and painting would draw a page nobody sees over data this person is
not entitled to.

`chromeFor()` gained a `paint()` on its one early return for the same reason:
harmless while `boot()` had already painted, and a blank page now.

**A FAST ANSWER WOULD FLASH THE SKELETON ON AND OFF**, so it is held to a
180ms floor — under the threshold at which a delay is noticed, and a floor
rather than a duration, so a slow answer waits no longer for it.

### 94.11 The check had to build a deployment, because `qa.py` cannot see this

Every other check opens the built file over `file://`, where there is no
server, nothing arrives late, and the class is deliberately never stamped —
**so the entire feature is invisible to the whole suite, and a build that had
lost it would go green every time** (§51.11, walked into knowingly). So
`src/checks/boot-skeleton.py` serves the built file over HTTP with a
deliberately slow `/api/state`, which is the only condition the fault was ever
visible under. The stub answers with a **purple bar the baked file does not
hold**, so *"the tenant's colours arrived"* and *"the baked colours were never
shown"* are two measurements rather than one hopeful one.

Two things it got wrong first, both instructive.

**SERVING THE PLATFORM AT `/` MADE THE REFUSAL CASE AN INFINITE LOOP** — a 401
sends the browser to `/`, which was the platform again, which asked again. The
stub has to model the DEPLOYMENT (the gate at `/`, the platform at
`/raya-trade`, §35.6) and not just the one file under test; getting that wrong
hid the fifth case behind a crash.

**AND `getComputedStyle` ON A HIDDEN ELEMENT STILL RETURNS ITS BACKGROUND.**
Reading `nav.units` reported the navy bar as being on screen while the skeleton
was correctly covering the whole chrome — §68.10's fault in the other
direction, calling a correct build broken. It is measured two ways that cannot
make that mistake: whether the bar has a **box** at all (`getClientRects()`),
and what is actually under a point at the top of the page
(`elementFromPoint`) — asserted in **both** states, so a build where the chrome
never comes back fails too.


### 94.12 Two sessions chose the same cache name, and git said nothing

The second merge of the day brought §93.9–§93.13 in, cleanly — and **`sw.js`
did not conflict, because both sessions had independently written
`smp-shell-v3.25b`.** Same string on both sides, so git merged it silently,
while the built file's bytes behind that name were different on each side.

A service worker caches by NAME. A browser already holding the other session's
`v3.25b` would go on serving it and never fetch this one — §91's fault
(*"every returning browser would be served the old platform out of its own
disk"*) reached by a route §91 did not predict, because §91 is about
remembering to bump it and this is about bumping it to a value somebody else
already used.

**The trigger is unchanged and is what saves it:** the built file's bytes
changed, so the name changes. What this adds is that the name has to be one
**nobody has served** — so `git show origin/main:sw.js` before choosing, in the
same breath as the fetch-and-look that precedes every merge. A merge will not
tell you.

### 94.13 The page stops being narrower than the bar above it

> *"The page is wide but the section below the navigation part is compact with a
> lot of padding on the right and left, not utilizing the screen width — let's
> make it fit always."*

**MEASURED BEFORE DRAWING, AND THE MEASUREMENT FOUND THE REAL FAULT.** The
complaint reads as *"the page is too narrow"*, and it is not quite that. At
1670px the destination row runs **edge to edge at 1655px** while the page under
it sits at **1132px, centred**, with 238px of nothing down each side. The row
had been let past the cap deliberately — `.units-in.folded { max-width:none }`,
*"a navigation bar is chrome, not content"* — and the content had not. **Two
containers that used to agree stopped agreeing**, which is why it reads as
broken rather than merely narrow, and it is precisely what §93.9 said it was
avoiding when it widened all four together for the railed pages.

So this is **§93.9 finished, not a new idea**. The mechanism already existed
(`data-wide` on the root, four containers) and was switched on for Setup only.
The cap comes off everywhere and **the 1600px ceiling goes with it**, so there
is one behaviour and not two: §93.9 chose 1600 because a table stretched across
a 32-inch monitor puts its first and last column a head-turn apart, which is
true and is what the register's frozen first and last columns already exist for
(§69.19, §69.20). A second threshold is a second thing to explain.

`data-wide` itself is **gone** — the attribute had nothing left to switch, and
so is the `max-width:none` override on the folded row, because a rule that no
longer does anything is a rule somebody will one day read as load-bearing (§24).

**Measured at 1670px:** every page except Setup goes **1132 → 1607px**, and a
unit's Plan pane **920 → 1395px**. The function's Projects table stops wrapping
its third row onto two lines and fits one more row on screen; the People
register loses its horizontal scroll entirely.

**AND THE ONE REAL COST IS RECORDED RATHER THAN HIDDEN.** 1180 was a **reading
measure** and prose has an optimum line length. At 1670px a unit's Foundation
goes from 483 to **732px** on its longest line, which is comfortable; at 2560px
it reaches **1166px**, which is not. The Knowledge base is unaffected — it
already carries its own measure. The fix, when somebody runs the platform on a
monitor that wide, is a measure on the few prose BLOCKS rather than on the page.
Not built, deliberately: it is not worth adding before it is needed, and adding
it now would put a second width rule back in the file this section just took one
out of.

### 94.14 The check asserts the agreement, not the number

`src/checks/page-width.py`. The fault was two containers that stopped agreeing,
so what is asserted is that the navigation row, the tab row and the page
**start and end at the same x** — and deliberately not what that x is. A later
change to the gutters keeps it green; a cap reintroduced on any one of the three
does not. §53.5's rule, which is the same reason `qa.py` compares a unit's pane
with a function's rather than checking either against a figure.

Swept at 1920 / 1670 / 1280 / 1000 across five kinds of page, because §27.1's
lesson is that a layout verified at the width that passes is not verified. It
also asserts **no sideways scroll** — removing a cap is exactly the change that
pushes something past the window, and §27.2 records what that costs: a
horizontal scroll drags every sticky element with it — and that the window is
genuinely used, so a cap replaced by a slightly larger cap fails.

A zero-width row is skipped rather than failed: Setup has no tab row at all
(§46.1), and asserting against it would be measuring a thing the page is right
not to draw.

### 94.15 The Arrange button goes, because §94.3 took away its reason

> *"Remove the arrange button from the units and functions as it's already
> embedded in the edit button — when I press the pencil I can arrange, so the
> button is not needed."*

He is right, and the interesting part is *why* it was there. §63.3 kept it for a
precise, stated reason:

> *"A BU head has no pen — `mayEditPlan()` is the SMO's (§31) — and could
> arrange before this, so they keep an explicit button: tying the handles to the
> pen alone would have taken reordering away from the people who use it most,
> silently."*

**§94.3 closed reordering to the office**, who are exactly the people who *do*
have the pen. So the sentence that justified the button stopped being true the
same day, and what was left was a second control doing what the pen beside it
already does. **A control with no audience of its own is not a choice, it is a
duplicate** — and the two were already an either/or dressed as two things,
because the button had to be hidden whenever the pen was on (a button reading
"Done" for a mode it did not start lies about what pressing it will do).

**THE GROUP KEEPS ITS OWN, AND THAT IS THE POINT RATHER THAN AN EXCEPTION.** The
group's Performance page has no pen at all, so `arrangeBtn("group")` is the only
way to reorder units, themes and capabilities. The button is redundant precisely
where a pen sits beside it, and nowhere else — which is why "remove the Arrange
button", read one page too widely, would have taken away the one that still
does something.

Gone from both sides in the same breath (§53.5): a button removed from a unit
and left on a function is exactly the drift that rule exists to stop.

**AND IT NEARLY SHIPPED RETURNING `undefined`.** The unit's Plan ended
`return arr + (…)`; deleting the leading term left `return` alone on a line, and
automatic semicolon insertion ends the statement there — the function returns
undefined and everything below it becomes dead code. This file already carries
that scar on `renderGroupFoundation()`, which rendered the literal word
"undefined" for versions. Caught by reading the diff before building; the check
now reads `#panel` for the word, because **the page renders it rather than
throwing**, so nothing else would have said so.

The check asserts **both ends**: that the button is absent, and that pressing
the pen still produces handles — 13 on a unit, 14 on a capability. Proving the
button is gone proves nothing on its own, because a build that had lost the
handles too would pass it.

*(A note on the check that found nothing: the first run reported the function's
pen giving zero handles. The product was fine — the test navigated by setting
`current` directly, which does not drop modes, so the page arrived with the pen
already on and the click turned it OFF. §51.11's shape, in a scratch script: the
measurement was true and it was measuring the wrong state.)*
