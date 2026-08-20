/* ── Page info ────────────────────────────────────────────────────────────
   The reasoning that used to sit on the screens as notes and ledes. It is
   still worth having — it is what stops a number being misread — but it is
   read once and then never again, so it does not belong in the way.

   The division: a small ⓘ beside a figure explains THAT FIGURE. The Info
   button explains HOW THE PAGE WORKS. They never repeat each other.
   ──────────────────────────────────────────────────────────────────────── */

var PAGE_INFO = {

  g_perf: {
    title: "Group performance",
    body: [
      ["Three figures, never blended",
       "The group's own scorecard, its business units' performance, and their execution answer different " +
       "questions. Blending them would produce a number that answers none of the three."],
      ["Where the units figure comes from",
       "It is the weighted average of each unit's own headline, at the weights composed on the Weighting " +
       "tab. It is honestly <i>the weighted average of unit headlines</i> &mdash; not <i>how the group is " +
       "doing across all its measures</i>. Pooling every objective flat was tested and rejected: it lets " +
       "whoever writes the longest scorecard override the agreed weights."],
      ["Execution is a ratio",
       "Delivered divided by what should have been delivered by now, derived from each tactic's quarter " +
       "span rather than typed. <b>100% means exactly on plan, not finished.</b>"],
      ["Themes and capabilities",
       "A theme aggregates every pillar carrying it, across every unit. Capabilities are pillars in their " +
       "own right &mdash; they carry no theme because they support all of them."],
      ["Order is not influence",
       "Arranging units, themes or capabilities changes where they sit and nothing else. Weight determines " +
       "how much a unit counts; position determines nothing."]
    ]
  },

  u_perf: {
    title: "Unit performance",
    body: [
      ["The headline is the unit's own scorecard",
       "Performance here is the unit's Key Objectives, each actual against its target. It is <b>not</b> a " +
       "roll-up of the pillars below."],
      ["Pillars explain the number rather than produce it",
       "A pillar's key measures are internal to that pillar. They can carry detail that pulls a pillar down " +
       "while the unit's objectives are going well &mdash; the two are not in contradiction, they sit at " +
       "different altitudes."],
      ["Execution is the one reading that travels upward",
       "Tactic delivery rolls up from the pillars to the unit and on to the group, because key tactics are " +
       "worth watching from above even though they belong to a pillar. Measure performance does not."],
      ["One list, two kinds",
       "A direction and a capability are structurally identical &mdash; same owner, measures, tactics and " +
       "scores &mdash; so they share one list and one health calculation. Each carries exactly one theme."]
    ]
  },

  u_found: {
    title: "Foundation",
    body: [
      ["A static record",
       "This page holds authored content, not reported numbers. Reading is the normal state; editing is " +
       "entered deliberately."],
      ["Targets only, no progress",
       "The objectives appear with their targets and nothing else. The foundation states what was committed " +
       "to; the Performance page states how it is going. One number in two places is one number too many."],
      ["End in mind is optional",
       "A foundation carries a Winning Aspiration, and may carry an End in mind beside it. Where there is " +
       "none, nothing appears \u2014 an empty labelled block would assert that something is missing when the " +
       "plan simply does not work that way. The field is always present while editing, so one can be added."],
      ["Winning Aspiration is one entity",
       "Vision, End State and Winning Aspiration are three display labels for the same statement. Every unit " +
       "holds one, the group included. The horizon is a field beside it rather than words inside it, so " +
       "changing the year is one edit and not a rewrite."],
      ["Clause labels are data",
       "Each unit writes its own. The group says <i>Offering / To / Through</i>; Mobile says <i>We provide / " +
       "For / All Overall</i>. Neither is a subset of the other, which is why foundation content is stored " +
       "as rows rather than columns."],
      ["What a unit does not hold",
       "Purpose and Core Values live at group level and are inherited. A business unit declares neither, and " +
       "has no temple &mdash; the themes sit one level up."]
    ]
  },

  u_anal: {
    title: "SWOT",
    body: [
      ["Context, not a score",
       "Nothing on this page feeds a number. The SWOT is captured with the first submission of a unit's " +
       "strategy and stands as the reasoning behind the plan."],
      ["One per unit",
       "In a group this screen appears once per business unit. A single company has exactly one. The screen " +
       "is identical; only how many exist differs."]
    ]
  },

  g_found: {
    title: "Group foundation",
    body: [
      ["Held here, inherited downward",
       "Purpose and Core Values live at group level only. A business unit declares neither."],
      ["Persists across strategy years",
       "The foundation outruns the current cycle, so it is not retyped each January. Pillars are annual; the " +
       "foundation is not."],
      ["The group's objectives are authored",
       "They are set by the group and never summed from its units. Targets only here; performance is on the " +
       "Performance page."]
    ]
  },

  g_focus: {
    title: "Focus",
    body: [
      ["What a focus measure is",
       "A measure the CEO has marked as one of the few that carry reward this cycle. It can be a " +
       "unit's own Key Objective or a key measure under any direction or capability."],
      ["One rule, not a target per measure",
       "Where reward begins is a property of the scheme, set once for the cycle on Setup and read " +
       "by every focus measure. No measure grows a second target, and the line is never negotiated " +
       "one row at a time. At 100% delivering the commitment earns; set it higher and a fourth " +
       "standing appears \u2014 <i>met, not earning</i> \u2014 for a measure that hit its target without " +
       "clearing the reward line."],
      ["Focus changes no score",
       "The unit headline, the pillar figures and the group compile are computed exactly as they " +
       "are without it. Unit weights already decide how much a unit counts; letting focus alter " +
       "scoring would count the same emphasis twice and make the group number impossible to explain " +
       "in a room. <b>No compensation arithmetic lives here</b> \u2014 the platform reports standing, " +
       "the scheme pays."],
      ["Marked in Setup, read everywhere",
       "Marking is a configuration act and lives on <b>Setup \u2192 Focus measures</b>: a marking mode " +
       "sitting inside a unit's reading page invites a stray click on a decision that carries money. " +
       "The setup screen offers everything measurable in a unit \u2014 Key Objectives first, then each " +
       "pillar's key measures \u2014 each shown with its target, so the choice is made against the " +
       "number and not the name alone. This board reviews every unit at once."],
      ["Who sees what",
       "The CEO and the SMO see this board. A business unit sees only its own focus measures, on its " +
       "own page. What another unit is rewarded on is not its business."],
      ["Every cycle starts unmarked",
       "Marks are stored against the cycle, not against the measure, so last year's emphasis cannot " +
       "quietly become this year's by default. There is no cap: three is the usual choice and it " +
       "stays a choice."],
      ["Progress is not coloured here",
       "The band scale answers <i>is this on plan</i>; the standing answers <i>does this earn</i>. " +
       "A measure can read 88% and green on the band while being short of the reward line, so in " +
       "this table the badge carries the meaning and the number stays plain."]
    ]
  },

  g_temple: {
    title: "The temple",
    body: [
      ["A view, not a scoreboard",
       "The roof is the aspiration, the band is the Key Objectives with their targets, the columns are the " +
       "themes, and the base is the capabilities that carry no theme because they support all three."],
      ["Edited as tables, saved as the temple",
       "A temple is a picture, and a picture is an awkward thing to type into. Editing opens tables for the " +
       "aspiration, the objectives, the themes and the capabilities \u2014 they write to the same objects the " +
       "view renders, so what is saved is the temple."],
      ["A theme's code is what pillars point at",
       "Renaming a theme carries its pillars with it. A theme still in use cannot be removed, because " +
       "deleting it would leave those pillars pointing at nothing and quietly absent from every theme."],
      ["No performance figures appear here",
       "Deliberately. The temple is the strategy on one page; how it is going belongs on Performance."]
    ]
  },

  g_weight: {
    title: "Business unit weighting",
    body: [
      ["Composed, never typed",
       "Each factor becomes a share of the group total, then the shares combine at the factor weights. Only " +
       "the composite totals 100% &mdash; the factor columns hold their own units and have no reason to sum " +
       "to anything."],
      ["Impact on group is a judgement",
       "No formula produces it, so it carries a written reason. It is the factor that lets strategy override " +
       "arithmetic, which only matters if it can actually move the number."],
      ["Factors are rows, not columns",
       "Adding a factor is data entry rather than a schema change, and each declares its own type &mdash; " +
       "derived from a stored figure, a judgement on a scale, or an estimate. All three convert to shares " +
       "the same way, so the arithmetic never branches on type."],
      ["Per cycle, not per tenant",
       "Each year takes insight from the last, so the previous cycle's split is shown beside the new one."],
      ["Changing a weight mid-cycle moves a reported figure",
       "This is allowed and it is not normal. A target freezes when reported, because it is a commitment made " +
       "to one owner. A weight is group governance: when it changes the group figure legitimately " +
       "recalculates, and the warning is what makes that visible rather than silent."]
    ]
  },

  c_labels: {
    title: "Labels",
    body: [
      ["Internal name and display label",
       "The internal name is the contract the platform is built on and never changes. The display label is " +
       "what a tenant sees, and can differ at group and business unit level."],
      ["Per tenant, managed by the SMO",
       "Not per cycle &mdash; a cycle-scoped label would let two years use different words for the same " +
       "object, and no report spanning both could be read without a glossary."],
      ["Collisions are blocked",
       "Two entities may never share a display label at the same level. Two different objects rendering under " +
       "one word on the same screen is not recoverable by the reader."]
    ]
  },

  c_access: {
    title: "Levels and access",
    body: [
      ["Page level only",
       "If a level can open a page, it sees everything on it. Restriction happens by removing the page, never " +
       "by trimming its contents &mdash; per-element permissions make a system nobody can reason about."],
      ["Three states, not two",
       "The CEO views the weighting table but does not manage it. Visible and editable are different grants; " +
       "collapsing them would either lock the CEO out or hand them the model."],
      ["A person is a level plus a unit",
       "The level decides which pages, the attachment decides whose. Two people at N-1 reach the same page " +
       "types but different units."],
      ["The SMO is not a level",
       "It is a super user beside the ladder. An SMO manager might sit at N-2 and still need rights no N-1 has."]
    ]
  },

  c_units: {
    title: "Business units",
    body: [
      ["The one place a unit is named",
       "Everything else in the platform references a unit's <b>key</b>, not its name. The name is display " +
       "only, the same as any other label, so renaming a unit here cannot detach it from its weight, its " +
       "pillars or its people."],
      ["BU head and owner",
       "The <b>head</b> is accountable for the unit. The <b>owner</b> holds the same access and does the " +
       "work &mdash; entering results, adjusting the plan, reporting. They are often different people, and " +
       "separating them keeps <i>who may edit this</i> apart from <i>whose number is this</i>. Only people " +
       "attached to the unit can hold either role."],
      ["Two master clears, across every unit",
       "<b>Clear all progress</b> removes every reported actual in every unit and the group\'s own figures, " +
       "leaving all plans standing \u2014 the start of a reporting cycle. <b>Clear all plans</b> empties every " +
       "unit\'s plan content. The units themselves survive both: names, codes, roles and weights are " +
       "configuration, not plan content."],
      ["Two different clears",
       "<b>Clear numbers</b> removes what was <i>reported</i> \u2014 actuals and progress \u2014 and leaves the plan " +
       "standing. That is the start of a reporting cycle, or the fix after a bad progress upload. " +
       "<b>Clear plan</b> removes what was <i>committed to</i>, so a fresh file can be loaded."],
      ["Cleared means unreported, never zero",
       "A cleared measure reads <i>Not scored</i> and a cleared tactic reads <i>Not reported</i>, and both " +
       "are left out of every average. Resetting them to zero would report a unit as failing when nobody " +
       "had yet said anything."],
      ["Clearing a plan is not retiring a unit",
       "<b>Clear plan</b> empties everything a plan template carries \u2014 pillars, measures, tactics, objectives, " +
       "SWOT and the foundation text \u2014 so a fresh file can be loaded into a clean unit. The unit itself " +
       "survives: its name, code, roles and weight are configuration, not plan content."],
      ["Retired, never deleted",
       "A unit carries pillars, measures, tactics and reported progress. Retiring it stops it appearing; " +
       "deleting it would destroy a cycle's record. Retired units stay listed and greyed."],
      ["What the columns show",
       "Pillars, objectives and weight are read from the unit itself \u2014 they are not set here. Weight is " +
       "composed on the Weighting tab; pillars and objectives are authored on the unit's own pages."]
    ]
  },

  cap_work: {
    title: "Projects",
    body: [
      ["What a capability is",
       "Cross-cutting work the whole group depends on, improved by a supporting function. It is not " +
       "a pillar one level up: it belongs to no business unit, and <b>nothing here touches any " +
       "unit's score</b> \u2014 otherwise the function that carries it would make a unit accountable for " +
       "work the group asked the whole business to do."],
      ["Who reaches this page",
       "The people of the function that carries it, and the SMO and CEO. A business unit head has " +
       "no business in a capability."],
      ["Enhancement projects replace what is here",
       "Measures and initiatives were inherited from when a capability was modelled as a pillar. A " +
       "capability has no targets of its own; its health is whether its projects land. Projects " +
       "carrying a brief, deliverables and milestones replace them next."]
    ]
  },

  cap_report: {
    title: "Reporting",
    body: [
      ["Reported by the function, not a unit",
       "Whoever carries the capability enters its figures \u2014 the head, or a Strategy custodian. Any " +
       "one of them acts for the whole."],
      ["The box states its unit",
       "Type the number; the unit sits beside it as a fixed suffix, and is rejoined on save."],
      ["Blank is not zero",
       "An unfilled row stays unreported when the cycle closes. It never becomes a nil return."]
    ]
  },

  u_plan: {
    title: "Strategy",
    body: [
      ["The plan, without the reading of it",
       "Targets, horizons, owners and quarters \u2014 what was agreed. <b>No reported figure appears " +
       "on this page.</b> Performance answers how it is going; this answers what was promised. The " +
       "group's Temple already makes the same separation, and a capability makes it between " +
       "Projects and Performance."],
      ["Why the rail",
       "A unit's directions and capabilities are a list worked through one at a time, and the " +
       "fourth of them sits two screens below the first in a stacked list. The rail keeps every " +
       "one a click away and does not scroll off. It groups by kind, because a <b>Direction</b> " +
       "and a <b>Capability</b> are different things."],
      ["What stays open",
       "Which item is open belongs to the unit rather than to the page, so it keeps its place as " +
       "you move between tabs. That is not hidden state \u2014 the rail shows the selection the whole " +
       "time, which is why it is allowed to persist."]
    ]
  },
  k_found: {
    title: "Capability \u2014 Foundation",
    body: [
      ["What a capability has, and what it does not",
       "A definition and, where it has any, its key objectives. It has no clauses, no aspiration " +
       "and no SWOT \u2014 <b>its foundation is the group's</b>. That is why a capability's Strategy tab " +
       "holds two sections against a business unit's three."],
      ["Why the third column is Weight",
       "A capability's key objectives carry the same optional weighting a unit's do, but they have " +
       "never had a three-year horizon. Same layout as a unit's Foundation, one column different."],
      ["Key objectives are authored here and read on Performance",
       "They appear in one place to be written and one place to be read. They are deliberately not " +
       "repeated on Projects: a duplicated table is a table that will one day disagree with itself."]
    ]
  },
  k_perf: {
    title: "Capability \u2014 Performance",
    body: [
      ["Three readings, never folded into one",
       "A capability shows its <b>key objectives</b>, its <b>project performance</b> and its " +
       "<b>execution</b> side by side. A capability that hit its objectives while its projects " +
       "delivered nothing is a different situation from one whose projects landed but moved no " +
       "number, and a single average would hide which one you are looking at."],
      ["Key objectives are optional",
       "Some capabilities hold interrelated projects serving one number at the top; others are a " +
       "portfolio of unrelated work with nothing meaningful above them. Where there are none the " +
       "card is <b>hidden rather than shown at zero</b> \u2014 an invented target is worse than an " +
       "absent one, because it will be reported against."],
      ["How a project's performance is built",
       "Half from its <b>deliverables</b> \u2014 what it handed over \u2014 and half from its " +
       "<b>outcomes</b> \u2014 what changed because of it. Half each <b>per side</b>, not per row, so " +
       "four deliverables and one outcome still weigh evenly: they are two kinds of evidence, not " +
       "six comparable items."],
      ["Why the number can fall",
       "An outcome names when it will be measured, and before that time it is absent from the " +
       "arithmetic rather than counted as zero. So a project reads on its deliverables alone early " +
       "on, and can <b>drop</b> later when an outcome arrives below target. That is the project's " +
       "real story, not a defect."],
      ["Execution is milestones and nothing else",
       "Milestones completed, never typed. A milestone whose finish date falls after its project's " +
       "end date is <b>saved exactly as entered</b> \u2014 the platform never refuses one \u2014 and said " +
       "out loud, because either the timeline moves or the overrun stands and both are yours."]
    ]
  },
  k_proj: {
    title: "Projects",
    body: [
      ["The function is the destination, not the capability",
       "The navigation offers <b>supporting functions</b> \u2014 Finance, HR, Marketing \u2014 and the " +
       "capabilities each one carries are named inside its pages. A function may carry more than " +
       "one (Marketing carries two), the Strategy custodian is named after the function, and the " +
       "capabilities themselves already appear in the temple. Listing capabilities in the row " +
       "would name the work where the organisation belongs."],
      ["What a capability is",
       "Cross-cutting work the whole group depends on, improved by a supporting function. It belongs " +
       "to no business unit and no unit is accountable for it \u2014 which is why it is <b>scored by the " +
       "group</b> and never folds into the owning function's unit, if it has one."],
      ["Measures and initiatives are on their way out",
       "They were inherited from when a capability was modelled as a pillar. <b>Enhancement " +
       "projects</b> replace them next \u2014 each with a brief, stakeholders, deliverables and " +
       "milestones, and progress derived from milestones completed rather than typed."],
      ["Who reaches this page",
       "The head of the function that carries it, its Strategy custodians, the SMO and the CEO. A " +
       "business unit has no business in another function's improvement work."]
    ]
  },

  k_report: {
    title: "Reporting",
    body: [
      ["The same rules as a unit's reporting",
       "Enter the actual; what it means against the target is worked out here. Blank stays " +
       "unreported and never becomes a nil return. An initiative outside this cycle's window is " +
       "<i>not asked</i> rather than an empty box somebody forgot."],
      ["Custodians share everything",
       "Where a function has custodians, any one of them can enter and submit for the whole " +
       "function. That is why adding one asks for confirmation."],
      ["It does not touch a business unit's score",
       "A capability is the group's. If the function is also a business unit \u2014 IT and Care both are " +
       "\u2014 this work is still scored separately, or the unit would be accountable for something the " +
       "group asked the whole business to do."]
    ]
  },

  c_fns: {
    title: "Supporting functions",
    body: [
      ["A function is not a business unit",
       "Finance, HR and Treasury carry no plan, no weight and no pillars. They improve a " +
       "<b>cross-cutting capability</b> the whole group depends on. Keeping them as their own list " +
       "rather than units in disguise is what stops them appearing in the weighting, the compile " +
       "and the group figure, where they do not belong."],
      ["A head, and optionally custodians",
       "The same two roles as a business unit and the same names, because it is the same " +
       "relationship. <b>The custodian slot is optional:</b> where the head does the work themselves " +
       "they already have access as head, and inventing a second record for the same person would " +
       "put one person on the board twice."],
      ["Custodians share everything",
       "Any one of them can enter, submit and reopen for the whole function. Slicing a function " +
       "between them is tidier on paper and means maintaining an assignment map that drifts the " +
       "first time somebody leaves. The screen warns whenever more than one person can act."],
      ["The qualifier names the function, not a capability",
       "<i>Strategy custodian, Marketing</i> \u2014 never <i>Strategy custodian, Brand Positioning</i>. " +
       "Marketing holds two capabilities, and naming someone after one of them breaks the moment a " +
       "second is assigned."]
    ]
  },

  c_caps: {
    title: "Capabilities",
    body: [
      ["What a capability is here",
       "Cross-cutting work the whole group depends on, improved by a supporting function through " +
       "enhancement projects. It is <b>not</b> a pillar one level up: it belongs to no business unit " +
       "and no unit is accountable for it."],
      ["One function each",
       "A capability is allocated to exactly one function. A function may hold several \u2014 which is " +
       "why custodians are named after the function."],
      ["Capability delivery reads separately",
       "The group's execution figure is about business units. Capability delivery is cross-cutting " +
       "and is its own reading, shown beside the group figure rather than folded into it \u2014 folding " +
       "it in would mean giving capabilities a weight, and make the group figure something no unit " +
       "head could reconcile against their own page."],
      ["Measures and initiatives are on their way out",
       "They were inherited from when a capability was modelled as a pillar. A capability has no " +
       "targets of its own; its health is whether its projects land. <b>Enhancement projects</b> \u2014 " +
       "brief, deliverables and milestones \u2014 replace them next."]
    ]
  },

  c_import: {
    title: "Import",
    body: [
      ["Upload the workbook, or the CSV",
       "An .xlsx is a zip of XML, so the platform reads one directly \u2014 no converter and nothing to install. " +
       "Excel omits empty cells entirely, so every value is placed by its own cell reference rather than by " +
       "position; reading by position shifts a whole row left the moment one cell is left blank."],
      ["Renaming a pillar does not orphan its rows",
       "Measures and tactics name their pillar rather than carrying its id. Rename a pillar on the Pillars " +
       "sheet and the child sheets still hold the old name \u2014 the dropdown cannot help, its list is fixed " +
       "text inside the file. Anything the platform already holds falls back to the parent it currently " +
       "records, so a rename is a rename and not a detachment."],
      ["Excel to fill, CSV underneath",
       "The workbook has <b>one sheet per part of the plan</b> \u2014 Foundation, Aspiration, Objectives, SWOT, " +
       "Pillars, Measures, Tactics \u2014 each with only its own columns. Measures and tactics choose their " +
       "pillar from a <b>dropdown of pillar names</b>, so nobody types a parent id. Direction, compile, kind, " +
       "theme and the quarter columns are lists, which removes most of what the import validator exists to " +
       "catch. The raw CSV is still available for anyone who wants it."],
      ["The ID column is grey and last",
       "Blank means a new item. Filled means the platform already holds it and will update rather than " +
       "duplicate. Download a filled workbook to change an existing plan, or a fresh one to start."],
      ["Two templates, one file per unit",
       "<b>Plan</b> carries the whole authored strategy \u2014 foundation clauses, aspiration, key objectives " +
       "with both horizons, and every pillar with its measures and tactics. It carries no actuals. " +
       "<b>Progress</b> carries only what is reported: an actual against each measure and a percent complete " +
       "against each tactic. It cannot create anything and cannot change a target."],
      ["Who may upload what",
       "Creating a plan is the SMO's, by sheet or in the platform. Progress is normally entered directly by " +
       "the unit's head or owner; a progress upload by sheet is the SMO's alone, so one hand is accountable " +
       "for data that overwrites what someone else typed."],
      ["Every row carries an id",
       "That is what lets the same file be uploaded twice without duplicating a plan, and what lets the " +
       "review say <i>this target changed</i> rather than <i>this measure is new</i>. The platform generates " +
       "ids and the template carries them; nobody types one."],
      ["Bad data is refused, not absorbed",
       "A pillar carrying a theme code that does not exist would be created, render nowhere, and be found " +
       "months later by someone wondering why a theme looks short. Problems \u2014 an unknown theme, a direction " +
       "that is not \u2265 or \u2264, a parent that matches no pillar, a duplicate id \u2014 block the apply. Notices, such " +
       "as a measure with no target, do not."],
      ["Nothing is applied on arrival",
       "The file is compared against what is recorded and the differences are shown first. An upload can " +
       "replace a figure a unit head entered, so it is confirmed by a person, not by a file."],
      ["Absent is not deleted",
       "An item recorded in the platform but missing from the file is reported, never removed. A missing row " +
       "is far more often an editing slip than a decision to delete a measure with reported history."],
      ["The column contract",
       "The plan template follows the strategy team's deck-extraction format so a file built for a deck " +
       "loads without reshaping. Four columns differ: <b>owners</b> becomes <b>owner</b> and " +
       "<b>collaborators</b>; <b>value_3y</b> carries the three-year target beside this year's; and " +
       "<b>kind</b> holds Direction or Capability rather than leaving it as prose in a note. Files still " +
       "using the old shape load unchanged \u2014 a piped <i>owners</i> column is split on arrival, a single " +
       "piped foundation row is expanded, and <i>kind</i> falls back to reading the note."],
      ["Provenance survives the round trip",
       "<b>source_slide</b> records which slide a row came from. The platform stores it and writes it back " +
       "rather than dropping it, so a plan exported after a year still says where each line originated."],
      ["A measure with no target is not a measure scoring zero",
       "It is excluded from the score and marked <i>No target</i>. Averaging a zero in would report a plan " +
       "as failing because someone left a cell blank."],
      ["Progress is recomputed, not typed",
       "The sheet carries the actual. What that actual means against the target is worked out on arrival, so " +
       "a percentage in a spreadsheet can never disagree with the number the platform shows."]
    ]
  },

  u_present: {
    title: "Presentation mode",
    body: [
      ["Built from the platform, not exported from it",
       "The deck is assembled when it is opened, from whatever the platform holds at that moment. " +
       "There is no exported copy and no version to go stale \u2014 a figure corrected an hour before the " +
       "meeting is the figure on the slide."],
      ["A mode, not a page",
       "It takes the whole window and the app disappears. <b>Esc</b> or <b>Exit</b> returns to exactly " +
       "the page it was opened from. Arrows or space to move, <b>F</b> for fullscreen, <b>W</b> to fit " +
       "an odd screen instead of 16:9."],
      ["One shape everywhere",
       "Slides are authored at a fixed 16:9 and scaled to fit, so what is rehearsed is what projects \u2014 " +
       "the same line breaks and the same rows per slide on any screen."],
      ["Long tables squeeze, then split",
       "A slide that overruns is tightened first; only at the floor does its table continue on a second " +
       "slide marked <i>continued</i>. This happens once when the deck opens, so nothing reflows while " +
       "somebody is presenting."],
      ["The notes are the validation",
       "Every note written during reporting travels into the deck beside the figure it explains, and the " +
       "closing summary gathers everything at risk or off track with what is being done about it. Nobody " +
       "writes the explanation twice."],
      ["The owner's note is editable here",
       "Changed in the room, changed in the platform. Everything else on the deck is read-only."]
    ]
  },

  u_report: {
    title: "Reporting",
    body: [
      ["What this screen asks for",
       "This unit's Key Objectives, every key measure carrying a target, and the tactics whose " +
       "quarters fall inside the open cycle. A tactic outside the window reads <i>not asked</i> " +
       "rather than sitting there as an empty box that looks like a chore somebody forgot."],
      ["The box states its unit",
       "Type the number; the unit sits beside it as a fixed suffix taken from the measure's own " +
       "target \u2014 <b>2.7</b> B EGP, <b>28</b> %, <b>3,180</b> with none at all, and a tactic plainly " +
       "as a percentage. It is rejoined on save, so nothing downstream ever sees a bare number."],
      ["Progress is worked out, not typed",
       "Enter the actual; what it means against the target is computed on the spot, so a figure and " +
       "its meaning can never disagree. A tactic reported at 100% becomes Done."],
      ["Blank is not zero",
       "An unfilled row stays unreported when the cycle closes. It never becomes a nil return \u2014 " +
       "the platform's oldest rule, and the one a form is most likely to break."],
      ["A note is required where a figure is red",
       "Anything at risk or off track carries a line of explanation before the report can be " +
       "submitted. A red number with nothing beside it is where a review meeting stalls."],
      ["Saving and submitting",
       "Every entry saves as you go and the SMO can see progress. <b>Submit</b> says you are done, " +
       "which is what lets the SMO tell <i>still working</i> from <i>finished and short</i>. You can " +
       "reopen your own report until the cycle closes."],
      ["Who reports",
       "The unit's owner is the main user; the head can enter figures too. The SMO can enter on " +
       "anyone's behalf, and enters the group's own objectives and capabilities directly \u2014 nobody " +
       "is asked for those."]
    ]
  },

  c_cycle: {
    title: "Reporting cycle",
    body: [
      ["What a cycle is",
       "A window the SMO opens over a span \u2014 a quarter, a half, a month. Opening it turns the plan " +
       "into a request sitting with every unit's owner. Quarterly is the usual rhythm; the span is " +
       "free where a cycle needs to differ."],
      ["The window sets as-of",
       "What <i>should be delivered by now</i> is measured from the cycle's end. A review covering " +
       "January to June and one covering the full year cannot be measured from the same quarter."],
      ["Opening makes plan edits the SMO's alone",
       "Not frozen \u2014 SMO-only for the span. A correction is still possible, but it goes through one " +
       "accountable hand rather than a unit quietly moving its own target while reporting against it. " +
       "Focus marks lock at the same moment, for the same reason."],
      ["Closing with gaps is allowed",
       "Waiting for the last number means never closing, and a cycle that never closes writes no " +
       "history. Whatever is unreported closes as unreported and stays visibly so \u2014 a stronger " +
       "prompt than a reminder email."],
      ["Closing is what creates the past",
       "Every figure is snapshotted against the cycle. From the second close onward each score can " +
       "show what it was last time: the group figure, every unit headline. A figure with no past is " +
       "a fact; a figure with a delta is a story."]
    ]
  },

  c_focus: {
    title: "Focus measures",
    body: [
      ["What this screen does",
       "Chooses the few measures per unit that carry reward this cycle. Pick a unit, then mark any " +
       "Key Objective or key measure. Nothing else about the plan can be changed here."],
      ["Why it is not done on the unit's page",
       "Marking carries money. A marking mode inside a page whose normal job is reading invites a " +
       "stray click on a decision nobody meant to make. Every target is shown here beside its " +
       "measure, so the choice is still made against the number."],
      ["One rule sets where reward begins",
       "Set on Scoring bands, read by every focus measure. No measure carries a second target."],
      ["Every cycle starts unmarked",
       "Marks are stored against the cycle, not the measure. There is no cap \u2014 three is the usual " +
       "choice and it stays a choice. Once the cycle is locked, nothing can be marked or unmarked."],
      ["Focus changes no score",
       "It is a lens and an incentive, never a second weighting. No compensation arithmetic lives " +
       "in the platform."]
    ]
  },

  c_bands: {
    title: "Scoring bands",
    body: [
      ["One scale for every benchmarked figure",
       "Performance is actual over target; execution is delivered over plan. Both are the same kind of " +
       "number, so both read on these bands."],
      ["Colour and status word come from one place",
       "If they were computed separately a figure could read green beside a word saying it was behind. One " +
       "source, no contradiction."],
      ["Per tenant, changed rarely",
       "Moving a threshold rewrites how every past report reads &mdash; a quarter reported on track becomes " +
       "needs attention with no data having changed."]
    ]
  }
};

function pageInfoFor(key){
  var d = PAGE_INFO[key];
  if (!d) return null;
  return modalFor(esc(d.title), "How this page works",
    d.body.map(function(x){
      return '<h4 class="mini">' + x[0] + '</h4><p class="sub" style="margin:0 0 14px">' + x[1] + '</p>';
    }).join(""));
}
