# 056 · Portfolio — the delivery plan, per client

**Status:** **not built. No source has moved.** This is the
spec spec 046 §8 said Portfolio needed — *"Breakdowns, timelines and
dependencies are named and not specified. Portfolio needs its own spec."* — and
what it specifies is the shape, not the screens. **Three screens are drawn and
signed off** — the project team (§6.4), the charter (§5.1) and the plan (§9.9);
**Progress is drawn and awaits sign-off** (§9.10). **Analytics is audited and not
drawn** — what it is FOR is a decision, not a hole in the reading (§9.11). Rule
1c is paid for the first three and owed for the rest: nothing visual may be built
from this page until each screen is drawn and signed off.

**Read with spec 046 (Modules)**, whose §4.2 contract this passes in §4 and
whose module frame — the address, the switcher, the row on the client's card,
the on/off drawer, the door and `withTenant` — it inherits without touching.
`portfolio` is **already the reserved word** in `MODULES` and `MODULE_DEF`
(`built: false`), so the address, the switcher and `isModule()` need no edit to
make room for it; the flag flips when there is a page behind it.

**Not the Internal Tracker (spec 054).** That is Forefront's weekly to-do list
about one client, opened by the seat, and it stays exactly as it is. This is the
delivery plan for a piece of work, and it is read by the office **and** by the
client. Islam, 2026-09-17: *"tracker is internal .. project plan is for internal
and client as well."* **Two lists, no pointer between them**, and neither
absorbs the other — put to him with the cost of merging them (the tracker's
speed, one line and Enter, does not survive inside a five-level tree with
dependencies and sign-off) and he kept them apart.

**Reference, never source:** `aleymahmoud-ff/clientplus`'s **ScopePlan**, read
on 2026-09-16 through a handover brief written by a session with that
repository attached — this session cannot reach it (cross-owner). §7 says what
is taken and what is left, one line each, so nothing is copied past a decision.
**Nothing in this page has been verified against that code by this session**;
every claim about ScopePlan is the brief's, and is marked where it matters.

---

## 1 · What is asked

Islam, 2026-09-16: *"on another repo named client plus there is a project
management module that I need to get as a module in the SMP."*

What that repository holds is **ScopePlan**: a delivery plan the consulting team
builds once and then works against — a tree of phases, work packages and
activities, with dates, dependencies, assignees, progress and a sign-off queue.
The brief's own summary of its state: **built, complete as a feature set, and
untested** — about 29,500 lines, zero tests touching it, and no spec behind it.

It is also, by the brief's reading, **the only part of ClientPlus shaped like a
client**: everything in it hangs off a client id and the rest of that product
(time entry, utilisation, finance) is firm-wide and cross-client by nature,
which fights SMP's *no tenant set means empty tables* rule outright.

---

## 2 · The decisions

Islam's, 2026-09-17, each answered against the options and the cost of each.

| # | Question | Answer |
|---|---|---|
| 1 | Has anyone really used it? | **"we have plans but we are good to adjust if needed."** Real plans exist, so the rules in §3 are validated by use and are ported faithfully rather than re-argued — **and the shape is open**, so the parent object is redesigned rather than inherited. There is data to migrate (§9). |
| 2 | What does a plan hang off? | **"a project belongs to a client."** No agreement, no scope, no engagement level. A client has projects; a project holds the tree. |
| 3 | Whose module is it? | **Both.** A seat on the client reaches every project; everybody else reaches the projects that name them. One module, two ways in — and the two are not *the office* and *the client*, which §6.1 is the correction of. |
| 4 | What is it called? | **Portfolio**, keeping his own earlier call (spec 046 decision 3). `Projects` was asked for and put back with the measurement: Strategy already has a **Projects** tab on a supporting function, a **Project owner** role on Roles & access, and a **Projects sheet** whose name is a validation range inside workbooks clients already hold — 98 occurrences of the word in the built product. Renaming Strategy's was offered with that cost and refused, as it was the first time. |
| 5 | Who starts a project? | **By seat.** Answered *"Forefront only, by seat"* and **widened the same hour** (*"a client super user can do anything"*) — and the two halves turn out to be one mechanism, which is what §6.1 corrects: a seat on this client is a seat on this client, whoever holds it. Consultants scoping the work and then naming the client's people onto it is how an engagement normally begins, which is a fact about engagements rather than a rule in the code. Recorded as a widening rather than overwritten. |

### 2.1 · What decision 2 dissolves

The brief named the coupling as the thing to read first: a plan exists per
`(client, agreement, scope)` triple, and `scope` hangs off `subdomains` →
`domains`, ClientPlus's time-tracking hierarchy — *the module needs the leaf
without the trunk.*

Decision 2 removes the problem rather than solving it. **`client_assignments`,
`scopes`, `agreement_scopes`, `subdomains` and `domains` never come across.**
What was a triple becomes one object the module owns outright, and SMP's
`tenants` row — the client — is the only thing borrowed, which it was going to
borrow anyway.

**What is given up, stated rather than discovered:** an agreement's start and
end dates, its budget hours, its budget amount and its lead consultant have
nowhere to live. If any of those are worked against today they come back as
fields on the project, not as a restored level — and that is a question in §9,
not an assumption here.

---

## 3 · What it does, in plain words

A project is a piece of work for a client. Somebody in the office builds its
plan once, and then the people doing the work report against it.

**A project has two halves and one of them is a page.** The **charter** is the
one page that says what this project is — why it exists, what is in and out of
it, what it produces, how success is judged, when, with whom, at what cost, and
what could go wrong (§5.1). The **plan** is the tree underneath it. The charter is
agreed once and is where somebody who has never seen the project starts; the
plan is worked against every week.

**The plan is a tree.** A project holds phases, numbered 1, 2, 3. A phase may
hold work packages, numbered 1.1, 1.2 — or not, and then its activities are
numbered 1.1 directly. An activity is the working unit and is where everything
that matters lives: what it is, what it produces, how long it takes, when it is
planned to start and end, what it depends on, who is doing it, and how far along
it is. An activity may be broken into sub-activities, which nobody reads as a
list — they exist to work out the percentage.

**Phase groups** sit above phases and group them for reporting. Optional.

**Six rules are the actual product**, and the brief is right that a fresh build
would not think to include them. They are ported as they are:

1. **Two people finish an activity, not one.** Whoever is doing the work marks
   it Done. Only a lead marks it Completed, and sets the real end date when they
   do — inside a range the platform checks. Everything sitting at Done queues on
   a sign-off screen. This is a governance rule, not a status list.
2. **Real dates are worked out, never typed.** The real start is stamped the
   first time progress leaves nought. The real end is stamped on Completed and
   cleared if it is reopened. One place in the code does it and every path goes
   through it.
3. **Progress is computed, and typing over it is refused when it would lie.**
   With sub-activities present the percentage comes from them and a manual
   figure is turned away with the reason. Weights sum to 100 where set, equal
   otherwise. One sub-activity started with none finished reads 10%, which is
   what trips rule 2.
4. **Moving a date moves what depends on it, and shows you first.** A preview
   says what will shift before anything commits.
5. **The numbers renumber themselves** on every move, insert and delete —
   including collapsing 1.2.3 to 1.2 when an activity sits straight under a
   phase.
6. **Planning Mode.** You restructure the whole plan in a draft — added, changed
   and deleted items held together behind a banner with a count — and then save
   it all or throw it all away, with recovery for the browser that died. The
   brief calls this rare in this kind of tool and it is the reason building a
   plan is bearable at all.

**What the client does** (spec 046 decision 5, unchanged): they update progress
and add notes. They do not restructure the plan.

---

## 4 · The module contract (spec 046 §4.2)

| # | Asks for | Here |
|---|---|---|
| 1 | Its own navigation | A project is picked first; then **Charter** (§5.1) · **Plan** (the tree and the timeline, which is a Gantt — §9.9) · **Progress** (the sign-off queue and what is owed — §9.10) · **Analytics**, whose content is a decision rather than a port (§9.11). An activity opens a panel rather than a page. **The charter was not in this list when it was written** and is first now, because it is where somebody who has never seen the project starts. |
| 2 | Its own roles and areas | **Three roles, no areas at all.** There is no Portfolio column on Roles &amp; access. The roles belong to a project, not to the module (§6) — which is the contract's *own roles* answered honestly rather than by borrowing a grid. |
| 3 | Its own Setup group | **Yes**, and it holds ONE thing: the three words (§9.1). Who leads a project is set on the project (§5.1a), which is where it belongs — so this group is a page with a row on it, and saying so now is cheaper than discovering it. |
| 4 | Its own rhythm | **Checkpoints**, weekly or monthly, per project — **not** the reporting cycle. Strategy's cycle does not reach it and must not. **A checkpoint is a date and nothing else** (§9.10): it stores nothing, records nothing and gates nothing. |
| 5 | A landing | The project list for this client, with each project's state. A client with one project lands in it. |

What the spine gives for nothing: the address `/<client>/portfolio/…`, the
switcher entry, the row on the client's card, the on/off drawer, the door,
`withTenant`, branding, and the register through `lib/place.ts`.

**WHO SEES IT IN THE SWITCHER FOLLOWS FROM §6 AND IS NOT A NEW SETTING**:
anybody holding a seat on the client, or named on at least one project. Spec 046
§6 asks this to be proved at both ends, and Portfolio can answer it from
`portfolio_members` with nothing stored — **which is the honest answer rather
than the convenient one**: drawing the entry for somebody on no project opens
onto an empty list, and a control with nothing behind it is not a choice
(§61, §32). *Cost, stated*: the entry **appears** the day somebody is named onto
their first project, which is right and will surprise them once.

---

## 5 · What it stores

**Tenant-owned, every one.** `db/schema.sql`'s loop enables and forces
row-level security on every table not on the platform's own list, so all of
them are covered on the next apply, and `lib/schema-check.ts`'s
`PLATFORM_TABLES` must **not** gain any of them (§331).

**Every table is prefixed `portfolio_`**, following `tracker_actions` /
`tracker_events` and for a harder reason than tidiness: `projects`, `phases`,
`activities` and `milestones` are generic words and **`projects` and
`milestones` are already tables in this schema, Strategy's.** An unprefixed
`projects` would not merely read ambiguously, it would collide.

| Table | Holds |
|---|---|
| `portfolio_projects` | **New, and the whole of decision 2.** The plan's parent, and **the charter it is described by** (§5.1) — name, brief, the four accountable people, why, what is in and out, what it produces, when, at what cost and against what risk. Plus the **checkpoint cadence and its day** (§9.10) — two fields, no table, and the next date derived. Replaces `(client_assignments, scopes)` and the agreement above them. |
| `portfolio_phase_groups` | Optional grouping above phases, colour-coded. **Genuinely optional and probably not in the first build** (§9.11): dropping it degrades the phase roll-up to a plain phase list and changes nothing else, and their own version is 642 lines of CRUD admin screen. |
| `portfolio_phases` | Phase, numbered, status |
| `portfolio_work_packages` | **Renamed on the way in.** ClientPlus calls the table `scope_milestones` and the column `milestone_id` — stale since the concept was renamed in Dec 2025. Fixed now or never (the brief's own words), and doubly so here, where `milestones` means a Strategy milestone one module away. |
| `portfolio_activities` | The working unit. Name, description, deliverables and their type, duration, planned and actual start/end, one dependency, assignee, status, progress, and **two** flags — is it a milestone, is it billable. **Their third flag, *does it trigger an invoice*, is not ported** (§9.9). |
| `portfolio_sub_activities` | Weighted breakdown driving progress |
| `portfolio_collaborators` | Supporting people on an activity |
| `portfolio_comments` | The discussion on an activity |
| `portfolio_comment_mentions` | @mentions |
| `portfolio_comment_reactions` | Emoji reactions |
| `portfolio_files` | **A real upload, and a link beside it** — §9.4 |
| `portfolio_history` | Field-level audit with a source tag (`auto:status_done`, `manual:lead_adjustment`) |
| `portfolio_terminology` | The three words, per client — see §9.1 |
| `portfolio_members` | **New, and §6's whole answer.** A row per (project, person, role): who is on this project and at what. Three roles, defaulting to Viewer. Replaces `client_team_members` and `scope_lead_assignments` together. |

### 5.1 · The project charter

**SIGNED OFF 2026-09-17**, with one widening —
`design-mockups/portfolio/2026-09-17_project-charter.html`, in the platform's own
tokens, both palettes, with his own charter as its content. It draws both states,
because a page you write once and read often cannot be judged from the reading
half alone (§273.4: three structures drawn in one state were three identical
pictures). **Both of the things it named as assumptions rather than decisions
were answered on the page** — *"1. office and lead 2. 2 fields"*:

- **the office AND the Lead hold the pen**, which WIDENS what the drawing
  assumed. It had the charter as the office's alone, following §6.2 — a Lead
  builds the PLAN — and a Lead correcting the page that describes the plan they
  are building is the better reading. **The consequence is named rather than
  discovered**: a Lead can also change the **budget** and the **agreed window**,
  which are the two commercial rows, and a client-side Lead doing so is
  rewriting what was signed up to. It is not a hole — every field records who
  changed it and when (§7.6's history, which does NOT cascade here) — and
  narrowing those two rows alone is one line if it ever bites. Left as he said
  it, because the case it bites in is the one he has already called unusual.
- **In scope and Out of scope are two fields**, confirmed against his own form's
  single cell. Nobody types a heading into a box.

**AND IT WAS NOT RENDERED BEFORE PUBLISHING**, which is said rather than left as
an absence (§54.5): this container has no browser. So it was read instead, and
two faults were found that way — an em-dash placeholder becoming the text of a
field somebody opened, and a five-field pair leaving one row dangling with the
border taken off one of the two cells on the bottom line.


Islam, 2026-09-17, with the one-page form his practice already uses:
*"any project should have a place for an overall view in a project charter that
sets many things including the budget … in addition to the detailed plan."*

**THIS IS §109 GROWN UP, AND SAYING SO IS MOST OF WHY IT FITS.** Three months
ago he asked for the same thing at a smaller scale — *"any project needs 3
things at its starting part which are the brief, stakeholders, start and end
date"* — and that is Strategy's project front matter today: **Owner · Start ·
End** down one side, **Brief · Stakeholders** down the other. The charter is
what those four become when the project is a delivery engagement rather than a
capability project. **It is not a new level in the tree**: it is the project
describing itself, which is the hole decision 2 left when it deleted the
agreement.

**And it must not be unified with Strategy's.** Spec 046 §8 already records that
a Strategy project and a Portfolio project are different things; two front
matters is correct, and the day somebody "tidies" them into one is the day a
capability project grows a budget.

**The form, as his practice writes it** — four bands: who and why; what is in
and out; what it produces and how success is judged; when, with what, at what
cost, and against what risk.

| Row | What it is here |
|---|---|
| Title, Brief | The project's own two fields. |
| **Sponsor, Consultant(s), Stakeholders** | **People, PICKED — never typed** (§130.1: 32 of 78 demo tactics named an owner who matched nobody on the register, and being named is what decides who may report). A stored value outside the register is KEPT in its own group, because his own example writes *"HR Director/Head"* — a post, not a person (§96.2). |
| Pain drivers, Gain drivers | Prose. |
| Scope span | Prose, in and out. |
| Deliverables, Success criteria | **Prose, written as a list by a person** — his example is dashes and one *"X% reduction"* left as a placeholder. Turning them into rows would be inventing a structure the document does not have. |
| **Project Manager** | **Not a field at all — it is the Lead** (§5.1a). Read from the team, never stored twice. |
| Timeline / Milestones | **A door to the plan, never a second copy** — §5.2. |
| Resources required | Prose. |
| **Budget required** | A headline figure — §5.2. |
| Risks & assumptions | Prose. New: nothing in SMP or the reference holds this. |

**HALF THE ROWS ARE EMPTY IN HIS OWN EXAMPLE** — Date, Consultant(s), Budget and
Risks all blank. So every field is optional and **the page must not nag**: a red
*Missing* over a count of nought is worse than silence (§214.4), and a charter
with four blanks is a normal charter rather than a broken one (§45.2 with the
sign reversed).

**APPROVAL IS NOT BUILT** (2026-09-17, *"Approval doesn't do anything. we can
remove it"*). The paper form ends in a signature; here it would be a stamp
nothing reads, and a field nothing reads is worse than no field — somebody
fills it in for nothing, and the next reader takes it for load-bearing (§24,
§294.2's write-only column). So no approved-by, no approved-at, and **nothing
gates building the plan**: a project is drafted and worked on, not signed into
life.

### 5.1a · The Project Manager IS the Lead

Islam, 2026-09-17: *"yes project manager is the lead the rest of the roles are
not related to the roles of accessability."*

**THIS REMOVES A FIELD RATHER THAN ADDING ONE, which is the best kind of
answer.** The charter has no Manager column: the row **reads whoever is at Lead**
on the project, and setting it there sets the role. One fact, two surfaces that
cannot disagree because only one copy exists — which is **§33's model exactly**:
a seat belongs to the person, but responsibility for a THING belongs to the
thing, so a unit's head is written by the People page and by the unit's own page
and both write the one field.

**The other three grant nothing, and the cost of that is stated rather than
discovered**: naming somebody Sponsor or Stakeholder **does not let them in**. A
client's CEO sponsoring a project cannot read it unless somebody also puts them
in the team at Viewer. That is his decision (*"not related to the roles of
accessability"*) and it is consistent with how this platform already treats a
claim about somebody — §56: a person's own declaration of where they work
**grants nothing**; the office places them. **The screen should say so** where
those names are drawn, because nothing else on the page would tell anybody
(§35). *Consultants are the case where it costs nothing anyway* — anybody from
the office already reaches every project by their seat (§6.1).

**His form says "Project Manager" and "Project Consultant(s)"**, so one is
singular by intent and the other is not. The row shows **whoever holds Lead**,
which is normally one person; **Lead is not forced singular**, because a second
one is a real case (somebody covering a handover) and refusing it would be a
constraint nobody asked for. The cost: the row can read two names.

### 5.2 · The two rows that open onto something bigger

Islam, twice and both times as a *maybe*: *"the budget can pop up to build a
detailed budget"*, and *"the milestones to open a pop up to set the milestones
timeline setting the start and the end of the project"*.

**They are one shape, and naming it is what stops them being two features**: a
charter row states the headline, and the detail lives behind it. What decides
whether that is sound is the same question both times — **does the headline
STORE its own copy, or READ the detail?** Two places answering one question is
the drift this project keeps recording (§53.5), and here the lying copy would be
the one on the page people read first.

**The milestones row: the plan already holds the dates**, so a typed timeline
beside it is a second answer by construction. But a charter is **agreed** at a
moment, and *what was agreed* is legitimately not *what is happening* — which is
**the product's own idiom, not a new one**: §239 puts a figure beside what it is
measured by, and §344 put that benchmark next to the box it is typed into.
**Recommendation: the charter states what was agreed; the plan says what is
happening; the row shows both when they differ.** That difference is the single
most useful fact on the page.

**The budget row: recommend the headline now and the breakdown named, not
built.** A breakdown is lines, amounts, categories and probably planned against
actual — a feature the size of the plan tree — and **the platform has no money
concept at all** (§9.6: 57 tables, not one holds a budget, a fee or an hour). One
number costs one field. What decides the rest is whether anybody tracks spend
against it, which is a question about the practice rather than the code.

**Thirteen in, fourteen out.** Three of ClientPlus's are dropped or replaced —
`scope_plan_terminology` is re-keyed per client, and `client_team_members` and
`scope_lead_assignments` become the single `portfolio_members` (§6.2), which is
the two of them saying one thing instead of two. Two are added:
`portfolio_projects` (decision 2) and `portfolio_members`.

**Two things are NOT tables here:**

- **`in_app_notifications`.** SMP has no in-app notification table — it has web
  push (`push_subscriptions`, `push_keys`), the office chat and email. Mention,
  comment, assignment and status-change notices need a home that is the spine's
  and does not exist. §9.5.
- **People.** Assignees are register keys, never names (§48, §130.9) — the
  register renders the name, so a rename reaches every activity. ClientPlus's
  non-user assignee (`isNonUser`, `externalName`) is **kept and comes free**:
  SMP's plan rows already store a name outside the register and keep it rather
  than guessing (§96.2, §130.7).

---

## 6 · Who may do what

**Settled with Islam, 2026-09-17, over two corrections of mine.** The first
drawing put Strategy's company roles down the side of a Portfolio tab; the
second kept a module-level column above per-project membership. Both were
too much: *"I don't understand the 2 layers and the six roles why are you
complicating things? the portfolio has it's own roles it's that simple. and
it's relevant to the project itself not even the module."*

**There is no Portfolio column on Roles &amp; access.** If you are not on a
project you see nothing; if you are, your role on that project is the whole
answer.

### 6.1 · Who gets in

**There is no Forefront-versus-client distinction inside a client, and drawing
one was a mistake of mine.** Islam, 2026-09-17: *"a client super user is one of
the 2 seats .. why it's different that forefront?"* It is not. Read off the
code rather than remembered:

- a **client's own person** is given Super user or SMO team on their own People
  page; their `tenant_users` row is written with no seat at all
  (`register-api.ts`), so it takes the default `none` and the **register role**
  is what carries their reach;
- a **Forefront person** is given a seat on the client from the console, and
  that seat **writes the same register role** — `officeRow()` sets
  `role = seat`.

By the time anything inside the client asks, both are the same value on the
same column. A consultant holding Super user on a client and that client's own
SMO holding Super user on it reach exactly the same things. What differs is how
many clients you hold it on, and whether you are also a platform admin — neither
of which is Portfolio's business.

| On this client | Portfolio |
|---|---|
| **Super user** | **Anything**, on every project, deleting one included. |
| **SMO team** | Everything the Super user can, **except deleting a project.** Not a new rule: §89 already names the three things that seat does not get, and destruction is the one of the three that lands here — the access matrix does not (Portfolio has no column) and passwords are not Portfolio's business. |
| **Anybody else** | Only where a project names them, at one of the three roles below. |

**So the team list is the people who hold NEITHER seat**, which is a property of
the model rather than a sentence about Forefront: anybody holding one is already
on every project, so naming them could add nothing. That is also why the picker
in §6.4 offers the register minus those two roles.

### 6.2 · Three roles, on the project

| Role | Reaches |
|---|---|
| **Lead** | Builds and restructures the plan, and signs off completions. |
| **Contributor** | **Sees the whole plan**; reports the activities assigned to them; comments on the ones they are tagged on. *Seeing all of it is the platform's own rule and it is a choice — §7.4A.* |
| **Viewer** | Reads, changes nothing — **not even a comment** (2026-09-17: *"viewer no commenting just viewing"*). **Where everybody starts.** |

**Whether a Contributor reports or only comments is read off the ACTIVITY**,
never from this table — assigned is one thing, tagged is another, and the
reference already stores both.

**A client-side Lead is the unusual case and is not a gap** (Islam: *"not
usual but ok to have the role ready for the future"*). Most projects will have
nobody in the list at Lead, because whoever leads it usually holds a seat
rather than a place in the list, and
completions queue there. The screen states it and does not nag (§45.2 with the
sign reversed: this is a fact about a healthy project, not something owed).

### 6.3 · The six become three — and two things ARE lost

Only two things ever varied across the reference's six — how much of the plan
you see, and what you may do to it. Six names for four answers.

**This section said *nothing lost* and that was wrong** (2026-09-17): the audit
checked the collapse against the four live permission functions rather than
against their matrix and found three branches that do not map. **§7.4 is the
correction**, and one of the three turns out not to apply to this model at all.

| ScopePlan today | Here | Why |
|---|---|---|
| Client Lead | **Lead** | Identical to Scope Lead once decision 2 deletes *scope*. |
| Scope Lead | **Lead** | " |
| Senior Contributor | **Contributor** | Differed from Contributor only by seeing the rest of the plan — and on a plan with dependencies, seeing what you are waiting on is the normal case, not a privilege. |
| Contributor | **Contributor** | " |
| Collaborator | **Contributor** | Not a level: it is whether the ACTIVITY names you as assignee or tags you. Already stored there. |
| Viewer | **Viewer** | Unchanged. |

**What is given up, stated:** somebody who should see *only their own
activities* and not the rest of the plan cannot be expressed. If that case
arrives it comes back as a tick on the membership — *their own activities
only* — and never as a fourth role.

### 6.4 · Naming people onto a project

**SIGNED OFF 2026-09-17** (*"ok for the project team mockup"*), from
`design-mockups/portfolio/2026-09-17_project-team-picker.html`, drawn in the
platform's own tokens — the third drawing of this screen, after one that put
the client's Strategy roles down the side of a Portfolio tab (his correction:
*"the visibility here is subject to the role in the project not the normal
company role"*) and one that kept a module-level layer above the project (his:
*"why are you complicating things?"*). **Both are kept in `design-mockups/`
rather than deleted** — what was rejected is part of the record, and the second
of the two is the reason this one has no module layer at all (Principle II).


The client's register, through **the platform's own searchable ticking list**
— the control a tactic's collaborators and the import page already use
(§45.5, §130.1, §295.1), so this costs a call rather than a component.

- **Active people only.** A retired person cannot sign in, so offering them is
  offering a name that can never open it (§247's own test).
- **A tick lands at once and there is no Done button.** That list commits per
  tick and stays open until you click away (§130.1) — a Done here would give
  one control two behaviours depending on the screen it is on (§53.5).
- **Everybody lands as Viewer** (Islam). Nothing is granted until somebody
  decides, which is the safe direction (§42 fails closed), and the list is
  never in a state where a person is on a project with no role.
- **The two office roles are not offered.** They are in already (§6.1), so a
  tick beside them would be a control that changes nothing (§94.15).
- **Taking somebody off who holds activities is REFUSED, by name** (Islam:
  *"refusal is better"*) — the shape §62 already gives retiring a function
  that still holds capabilities: the press is live and names what is in the
  way rather than being hidden or silently stranding the rows. Unassigned
  activities in a live plan are what nobody notices until a checkpoint.

### 6.5 · True whatever anybody is set to

- **Only a Lead completes an activity.** Whoever does the work marks it Done;
  marking it Completed and setting the real end date is the Lead's, and
  everything at Done queues for them.
- **An assignee reports, a collaborator comments** — off the activity.
- **The rule lives on the server and the screen asks the same function**
  (§42); **Portfolio may not read or write** another module's rows, the client
  registry, or the access matrix.

**Mockup:** `design-mockups/portfolio/2026-09-17_project-team-picker.html`,
published and **signed off** (§6.4). It supersedes `2026-09-17_project-team.html`
(the two-layer version) and `2026-09-17_roles-access-tab.html` (the company
matrix), **both kept as the record of what was tried and turned down**
(Principle II).

---

## 7 · What is taken from the reference and what is left

**MEASURED NOW, NOT TAKEN ON TRUST.** Every line below was the handover brief's
claim until 2026-09-17, when a session that could read the repository audited it
against commit `d569ba6` — `port-audit.md` beside this file, 2,295 lines, DDL
generated from the schema and every rule quoted with its line numbers. **Four of
the rows below were wrong**, and they are corrected here rather than softened.
Two things it could not verify are named at its end: whether any of it has ever
run against real data, and whether the timezone handling misbehaves.

| Theirs | Here |
|---|---|
| The five-level tree | Taken, under a project rather than a triple (decision 2) |
| Two-step Done → Completed with a validated end date | **Taken whole.** The single most valuable rule in it |
| Actual dates derived at one chokepoint | **Taken whole**, chokepoint included — and **one copy of it, not four**: `calculateEndDate` exists four times over there and the live copies disagree about whether a date snaps to Sunday (§53.5, their trap 4). |
| Progress computed from weighted sub-activities; manual entry refused | Taken — **and the rule is narrower than the brief said**: by weight only if the set sums to 100, otherwise by a plain count. Never by duration or effort. |
| Cascade preview before commit | Taken |
| Auto-renumbering, including the 1.2.3 → 1.2 collapse | Taken |
| Planning Mode with draft recovery | **NOT taken — reversed on the audit** (§7.3). |
| Per-agreement terminology | Taken as per-**client** — §9.1 |
| `client_team_members`, `scope_lead_assignments` | Taken as ONE table, `portfolio_members` — two rows saying one thing (§6.2) |
| Excel round-trip with a GPT instructions sheet | **Kept, and the office's** — §9.3. **Its gate must move to the server**: theirs checks a session and nothing else, and the only thing in front of it is two names hardcoded on a screen (§7.5). |
| The six-role visibility matrix | **Three roles, on the project** (§6.3) — **and §6.3's "nothing lost" was wrong**: the audit found three branches that do not map (§7.4). Its *shape* — composable filter fragments rather than scattered conditions — is what makes it port at all |
| Assignees who are not users | Taken; SMP's register already behaves this way |
| `client_assignments`, `scopes`, `agreement_scopes`, domains, subdomains | **Left.** Decision 2 |
| `in_app_notifications` | **Left as a table.** Theirs is a real bell with four notice types — and no deep link, so it cannot take you to what it names (§9.5). |
| Its own session (`getClientsUser`, `getServerSession`) | Left. SMP's door, one cookie |
| `getApiUrl()` and its hardcoded `/forefront` prefix | Left. The spine's route |
| 26 routes under `/api/scopeplan/*` | Left as routes; the module serves itself through `modules/registry.ts` |
| `prisma db push` and MySQL column types | Left. `db/schema.sql` plus a migration, applied on every build |
| ExcelJS | Kept if §9.3 keeps the round-trip; the only external dependency it brings |

### 7.1 · Traps — things in that namespace that are not this

The brief names four, and each is a thing to walk past rather than port:

- **`/api/scopeplan/tasks/*`** (398 lines) is a personal task module. Its own
  schema comment says so. Leave it.
- **`/clients/[clientId]/milestones`** and `milestone_clusters` /
  `milestone_actions` / `milestone_weekly_tasks` are the **older planning model
  ScopePlan replaced**. Both still ship there. Take one.
- **`phases.progress_percent` and `scope_milestones.progress_percent` are dead
  columns** — nothing writes them; progress is computed live. Do not port them
  as-is; drop them or wire them up deliberately.
- **A hardcoded username allowlist** gates the Excel import behind two names,
  which makes it a private admin tool today. It becomes a real permission or it
  does not come (§9.3).

### 7.2 · The four that are security, and must not be ported in shape

**1. One route deletes any row in the system for any signed-in person.** Their
`bulk-create` gates on `canManageScope` **inside `if (validatedData.scopeId)`**,
and `scopeId` is nullable — send it as `null` and the only check left is *are
you signed in*. Then three `deleteMany` calls run against id arrays that **are
never checked against the client, the scope or anything**, with cascades taking
comments, files, history and sub-activities. **Two rules out of one fault**:
never make a permission check conditional on an optional field, and check
ownership of **every** id rather than of the request. Both are things this
platform already says — §42's *an unrecognised change is the SMO's* fails
closed, and §191 is the whole record of a plan row with no id being read as *no
change* and therefore ALLOWED.

**2. The workbook endpoint is open, and it hands out the user directory.** Their
template route checks for a session and nothing else, and the file it returns
carries a **Team sheet with every active user's username, full name, role and
email**, plus the client's agreement, budget and existing plan. The importer is
gated; the exporter is not. — §7.5.

**3. The screen's permission hook fails OPEN**, returning `canCreate` /
`canEdit` / `canDelete` **true** when its context is missing. The server
refuses, so it is buttons that 403 rather than a breach — and it is the inverse
of the convention, and the thing a port copies without noticing.

**4. Terminology is writable by anyone with global edit on clients** — the
handler parses a `clientId` and never uses it. Small blast radius, and it sits
on the feature decision 4 keeps.

**And three permission checks ask the wrong module** (`clients` where the other
48 ask `scope_plan`), so whether you may create a non-user assignee is governed
by a different module from the action containing it.

### 7.3 · Planning Mode is not ported — reversed on the audit

§7 said *taken*, on the brief's word that a fresh build would miss it. **The
audit says what it is**: 1,040 lines of browser state keeping every phase, work
package and activity tagged *new / modified / deleted*, auto-saved to
**`localStorage`** under a key built from **the client, the agreement and the
scope** — two of which decision 2 deletes — committed by one POST to the route
in §7.2. Nothing is on the server until *Save All*, so **a draft does not follow
anybody between browsers**, and its 502-line renumbering engine runs against
drafts alone.

**THIS PRODUCT DELETED EXACTLY THIS SHAPE ONCE, AND WROTE DOWN WHY** (§273.4):
*"there is no Save and no Cancel anywhere else in the product, because there is
nothing for them to do"* — a field writes when the cursor leaves it and the
autosave carries it. A draft is what forces a Save, a Cancel **and** a guard on
closing.

**And the need it serves is already answered here**: building a two-hundred-row
plan without a request per keystroke is what the **workbook** is for (§9.3), and
that is SMP's own draft-and-commit — authored somewhere else, applied in one
act, archiving what it replaces (§22). *The cost is stated rather than
discovered*: restructuring a plan on screen is visible to anybody looking at it
as it happens, where Planning Mode let you finish first.

### 7.4 · The three branches that do not map — §6.3 corrected

§6.3 said the six roles collapse **with nothing lost**. The audit checked it
against the four live `canX` functions rather than the matrix, and found three
places where that is untrue. **Two of them are one question.**

**A. Does a Contributor see the WHOLE plan, or only their own rows?** Their
`SENIOR_CONTRIBUTOR` sees everything and works on assigned rows; `CONTRIBUTOR`
sees only its own; `COLLABORATOR` sees only rows it is tagged on — and a list
and a detail view **already disagree** about that last one. So the two-role
split exists because somebody wanted both, and one answer settles all three.
**Recommendation, and it is the platform's own**: **see the plan, write your own
rows.** §215 states it for Strategy in those words, `OWN_LINES_ONLY` is the
list, and §93 records what happens when the write half slips. *Cost:* the
narrower kind — somebody who may see only their own rows — is not available,
and their own code cannot agree with itself about it today.

**B. Can a Viewer comment? — answered: no** (2026-09-17, *"viewer no commenting
just viewing"*). Their code says yes while their own matrix grants `view` alone
and their own docstring says a Viewer cannot — **three places disagreeing, so
there was no behaviour to be faithful to**; this picks the one the word means.
**It matters because of where the word sits**: everybody lands at Viewer
(§6.4), so this is what the default quietly grants, and read-only is the only
default that fails closed. *Cost, stated:* a sponsor who wants to ask a question
on a row has to be made a Contributor, and then they can also report the rows
assigned to them — which is nothing, unless somebody assigns them one.

**C. Their Lead was narrowed by scope, and that narrowing is NOT lost here.**
The audit flags it as the widening to watch — *anyone who was Lead of one scope
becomes Lead of everything* — and that is true of a port that drops the scope
and keeps one plan per client. **It is not true of this model**: a client has
several PROJECTS, `portfolio_members` is a row per *(project, person, role)*
(§6.2), so a Lead is Lead of one project exactly as a Scope Lead led one scope.
The narrowing moves rather than going. **What does have to be rewritten** is the
handful of *"no scope → require Client Lead"* fallbacks their code marks
*(shouldn't happen)*: with scopes gone those become the only path, and the
Lead-equivalent tier would lose phase and activity deletion entirely.

### 7.5 · What the workbook may carry

§9.3 keeps the round-trip as the office's. Two things follow from the audit, and
neither is plumbing.

**The gate goes on the SERVER.** Theirs is two usernames hardcoded in a screen
(`['aley', 'galal']`), with the endpoint itself asking only whether you are
signed in — which is §42's rule with nothing behind it: *a switch that only
hides a control is decoration*, and §186 is the record of a picker offering what
the save refuses.

**The Team sheet is a decision, not a detail.** A workbook has to name who may
own a row, and theirs does it by shipping **every active user's email** in a file
that then leaves the building. The register already holds the short name a plan
is written against (§130.7), so the sheet can carry names without addresses
— and it should carry **this client's** register rather than every user of the
platform.

**And one trap belongs to the AI sheet itself**: their instructions tell the
model that the end date is required and say nothing about the start, while the
column is `NOT NULL` — so a model following the prompt produces a file that
rolls the whole import back. A template and its reader are one artefact; §294 is
the record of them disagreeing five ways at once.

### 7.6 · What the schema must not inherit

There is **no referential integrity to inherit** — six columns carry no foreign
key at all, including an activity's assignee and a comment's mentioned user —
and **no `CHECK` constraint anywhere in their schema**. So orphans are assumed
rather than ruled out, and the new tables get the constraints on the way in
(§331's loop gives every one of them row-level security; that is a different
guarantee).

| Theirs | Here |
|---|---|
| An activity has two nullable parents and nothing says exactly one is set | A constraint. *"You will not get a cleaner moment."* |
| `activity_history` **cascades** with its activity | It does not. §42: a log a save can erase is not a log — which is why `change_log` lives outside the state graph. |
| Phase numbers are supplied by the browser and a delete never renumbers, leaving gaps and stale codes | The **code is derived from position** here, as a Strategy project's already is (§310) — so a gap cannot happen, and §232's rule holds: ids are never renumbered, because figures are keyed on them. |
| A MySQL unique index over nullable columns constrains nothing, so duplicate phase numbers exist today | Named as a **migration blocker**: with the nullables gone the key starts biting. Check before adding it. |
| Mentions match `@(\w+)` against usernames written `first.last` | Broken there, and worth saying what it means: **the volume of mention notices in their production is not evidence of anything.** |
| A mention writes **two** notices — an unawaited `async` inside a `forEach`, racing the loop below it | One. |
| Reopening a completed activity **clears the sign-off date** and needs only the work-on gate | If two-step completion is the governance feature being kept, **the reopen is gated like the completion** — or a Contributor undoes a Lead's sign-off. |
| **82% of `lib/scopeplan/` is dead**, and the dead files are the ones that read like the specification | Stated so nobody ports fiction: 512 lines of role logic, 239 of date logic and 346 of dependency logic with **zero importers**. The live rules are elsewhere. |
| Three unrelated meanings of *milestone*, plus Strategy's own | §5's `portfolio_work_packages` renames one; the flag on an activity and Strategy's table are the other two. **Name them apart now.** |
| `activities.trigger_invoice` — written, guarded as a structural field, and **read by nothing the audit shows**; their own workbook does not carry it | **Not ported** (§9.9). It is an agreement's fact, and decision 2 deleted the agreement. |
| `phases.progress_percent` is **selected by the analytics endpoint and read nowhere** in its 747 lines | Confirmed dead by a second reading (§9.11). The column is dropped and the figure derived, which their own analytics already does. |
| Their **Milestones Hit** counts a milestone delivered late as hit, and an **upcoming** milestone's countdown renders a field that branch never assigns, so every one reads *"(in today)"* | Neither is ported (§9.11). |
| **On-Time Delivery counts an activity with no recorded actual end date as on time** — and their actual end is cleared on reopen, so the Done-awaiting-sign-off queue inflates it | **An activity with no real end date is not counted at all** here, rather than counted as a success (§9.11). |
| A label reading **"Weighted avg progress"** over a plain arithmetic mean | §9.8 decided the weighting; the label must not arrive ahead of it. |

---

## 8 · How it is proved

Nothing here is believed on a green run alone; each is asserted at **both ends**
(§94.2) and proved able to fail from the sources (§276).

- **Spec 046 §6 comes first, and it is not this module's work.** *Before
  Portfolio is built:* a person holding a role in one module and none in another
  sees exactly one in the switcher, and somebody holding roles in three sees
  three; and two modules read the spine identically and neither can write the
  other's rows. `checks/modules.mjs` covers the first half today.
- **The six rules of §3 are checked as rules, not as screens** — pure functions
  where they can be, so the sign-off, the derived dates, the computed progress,
  the cascade and the renumbering are provable without a browser.
- **The tenant boundary**, the way every other module's check does it: one
  client's plan is not another's, read back through `withTenant` as `smp_app`.
- **Both audiences, both ends**: an office seat opens it and a client person
  without the grant does not; with the grant they write only what §9.2 allows.
- **The migration is proved by running it** (§314.1), on a copy, with row counts
  and a sample plan compared before and after — never claimed.
- **Zero tests exist on the reference.** Everything above is net-new here, which
  is a cost of the port and is named rather than absorbed.

---

## 9 · Open — needs a decision before anything is drawn

Each of these changes what gets built. **Four of the seven were answered on
2026-09-17** and are kept here rather than moved, so the question and its answer
sit together. Three are live: §9.3, §9.5 and §9.6.

**And every claim in §7 is still the handover brief's rather than measured** —
this session cannot read `aleymahmoud-ff/clientplus` (an `add_repo` across
owners is refused, and the GitHub tools are scoped to this repository). The
brief for a session that can is `extraction-brief.md` beside this file; it asks
for schema, code and counts rather than description, for the reason §7 records.

### 9.1 · Where the three words live — answered (2026-09-17, *"agreed"*)
**Per client, in `portfolio_terminology`.** The recommendation below, taken as
it stands. A faithful port would have been per project; one client calling a
Phase two things in two projects is the confusion the feature removes.

One client calls it a Phase, another a Wave. ClientPlus stores this per
`(agreement, scope)`; decision 2 deletes that key. **It cannot ride SMP's
`labels` table** — measured: that is Strategy's own fixed vocabulary, a closed
list of Strategy concepts (theme, pillar, keyobj, aspiration, purpose, values,
measure…) each carrying a group word and a business-unit word, not a generic
key-to-word map. Six frozen sources read it — `config-data`, `config-render`,
`group-render`, `sync`, `templates` and `xlsx` — and `lib/frozen.cjs` **runs
those same sources in a vm** to answer the landing page, so a Portfolio row put
in `labels` would not sit quietly beside Strategy's: it would be hydrated into
the frozen product's own readers on every request, and travel into the plan
workbook, which reads that list to build its sheets.
**Why it could not ride `labels`** is the part worth keeping, because it is the
reason this needed asking at all rather than being assumed.

### 9.2 · The role ladder — answered (§6)
Settled 2026-09-17: three roles, on the project, with no module-level column at
all. **And that closes the question of where a module declares a role**: these
are not client roles, so they never touch the frozen `lib/rules.js`, and
`MODULE_DEF` needs no roles field. What was a gap in the module contract turns
out to be a question Portfolio does not ask.

**And the last line of it is answered too** (2026-09-17): the client's Super
user can do anything — naming people onto a project, and starting one. Nothing
is left open in §6.

### 9.3 · Writing a plan in a spreadsheet instead of on the screen — answered (2026-09-17)

Islam, 2026-09-17: *"what s theexcel round trip?"* — fairly, because the first
version of this section named the thing and never said what it is.

**In plain words.** A plan can be two hundred activities. Typing that into a
screen, one row at a time, is miserable. So the module lets you do it in a
spreadsheet instead:

1. you **download a file** from the platform. It arrives already knowing the
   client, already listing the people who could own a row, and already carrying
   the allowed values in each column, so the dropdowns work;
2. it also carries **a sheet of instructions written for an AI** — so the file
   can be handed to one with *"write the plan for this"*, and what comes back is
   in the shape the platform can read;
3. you **upload it back**, and the platform reads it row by row, refusing what
   it cannot accept.

**SMP ALREADY DOES THIS, WHICH IS MOST OF THE ARGUMENT.** A Strategy plan is
authored by uploading a workbook — that is §22's contract, *an upload authors a
plan rather than amending one* — and §294 proves the trip is a **fixed point**:
what goes out and comes back untouched changes nothing. So this is not a new
idea being imported; it is the idea this product already uses to write a plan,
arriving in a second module.

**AND THE TOOL IS NOT NEW EITHER.** SMP builds its own `.xlsx` in `xlsx.js` with
no dependency at all — a zip of XML — which is what lets the whole platform be
one file that works offline. The reference uses a library instead. Whether the
port keeps that library or uses SMP's own builder is an implementation question
and not this one.

**THE ONE RULE THAT WOULD HAVE TO COME WITH IT** is §22's: **an upload authors,
so a column the file does not carry is a column the plan LOSES.** §294 is the
whole record of that going wrong five ways at once on the Strategy workbook —
a write-only column, a dropped weight, a per-cent written into the reporter's
box — every one invisible because the file looked right. A Portfolio workbook
inherits that trap the day it exists, and the check that guards it is a round
trip rather than a list of columns.

**Answered 2026-09-17** (*"the uploader is the office only"*): **kept, and the
office's.** Which also reads the reference's two-name allowlist as a deliberate
gate rather than an unfinished feature — same answer arrived at twice.

### 9.4 · Files — answered (2026-09-17, *"real uploads"*)
`activity_files` stores a URL, not an upload. **Files are uploaded into the
platform.**

**The machine for it is built, connected and proved**, which is most of why this
was cheap to say yes to — measured in `smp-app/lib/blob-api.ts` rather than
remembered: a serverless function refuses a body over 4.5MB, so the browser
slices the file and **every piece is authorised on arrival** rather than one
address being minted and then trusted (§261); the ceiling is counted on the
SERVER from what is stored, because a limit the screen alone enforces is
decoration (§42, §44); a stored file is **private** and is read through a
two-step signed address, never a public URL (§261.10); and with no store
configured the endpoint answers in words and the rest of the platform goes on
working (§231.3). The store has been connected since 4 September.

**What is Portfolio's to decide, and none of it is plumbing**: the path a file
lives under — which IS the permission, the way `videos/<target>/` already is
— the ceiling per project, who may attach one, and what happens to the file
when the activity it hangs off is deleted. **Deleting is where this gets
expensive**: a blob outlives its row unless something removes it, so an
orphaned file is a storage cost nobody can see and nobody can reach.

**The link half is kept beside it**, because it costs nothing and it is what a
plan pointing at a document in the client's own system needs.

### 9.5 · How somebody finds out that a project needs them — answered (2026-09-17, *"B for now"*)
**Portfolio puts its own lines on the welcome screen.** Nothing is sent; a
screen everybody already opens says what is owed. **"For now"** is recorded as
his word: C — a box on the device when something is put in your name — is a
later decision, and **nothing about B has to be undone to add it**, which is
why starting here costs nothing later.

**What B does NOT reach is stated rather than discovered**: somebody who is not
in the platform learns nothing. That is the whole of what C buys.


**The question in one sentence: when something on a project is waiting on you,
how do you learn about it without opening the project and looking?** The first
version of this section was written in jargon and Islam said so
(2026-09-17: *"I don't understand"*), which is rule 1b-iii — it named four
kinds of notice and never said what the thing is for.

**The moments are concrete and there are five of them**: an activity is put in
your name; one in your name falls due, or passes its date; somebody writes your
name into a comment; a Lead is owed a sign-off, because whoever did the work has
marked it done and only a Lead closes it; and a checkpoint is a few days off.

**What the platform already has, measured rather than remembered**:
- a **box on the device** — built for chat messages (§231), per device, off by
  default, with three switches that must all say yes;
- **email** — the office's collection (§293), ten minutes after a question goes
  unanswered, and it exists for the chat and nothing else;
- the **welcome screen** (§148), which already answers *is anything waiting on
  me?* — a submission owed, a plan with holes in it, an unread reply — and is
  Strategy's alone today;
- **nothing in-app that lists notices.** There is no bell, no feed, no *3 new*.

**AND THE REFERENCE HAS A BELL, WHICH MAKES THE COMPARISON REAL RATHER THAN
HYPOTHETICAL** (audited 2026-09-17). Four notice types written inline in the
route handlers — an activity put in your name, its status changed, your name in
a comment, a comment on your row — read by a header dropdown polling an unread
count **every thirty seconds**. No email, no push, no digest, no preference.
**And two things it does not do decide the comparison**: it carries an activity
id and **no route resolves that into an address**, so *open the thing that
changed* is not implemented — §16.7's rule exactly, *a count that cannot take
you to what it counts makes work* — and **nothing fires** when an activity is
deleted, when a dependency cascade moves your dates, or when something lands in
the sign-off queue, which are the three events most worth being told about.
So **B is not a lesser version of what they have**: the welcome screen's rows
are doors, which theirs are not.

**Three honest answers, with what each costs**:

| | What happens | Cost |
|---|---|---|
| **A** | Nothing arrives. The project list says what each project owes and you look. | Somebody who does not open Portfolio for a week does not know. Cheapest by a distance, and it is what the Internal Tracker does today. |
| **B** | Portfolio adds its rows to the **welcome screen** — *4 activities due this week, 1 waiting for your sign-off.* | A screen every viewer already opens, so it is seen without being sent. Does not reach anybody who is not in the platform. |
| **C** | B, plus a **box on the device** when an activity is put in your name or your name is written in a comment. | Real work: a second thing that sends, and a switch of its own or people turn the whole lot off. |

**Recommendation: B, and A for everything else.** It is the one that costs
little and is seen, it uses a screen the platform already draws, and it does not
ask anybody to carry a second inbox. C is a later decision and is not made
harder by starting at B — nothing about B has to be undone to add it.

**A notification list is not built either way** (a bell with a feed behind it):
that is the spine's, not this module's, and if it is wanted it wants a spec.

### 9.6 · The budget and the contract — not Portfolio's, either way

Islam, 2026-09-17: *"the budget hours and budget amount and contract is
apparently a client thing not a project thing right?"*

**Right, and measuring it makes the question smaller rather than bigger.** A
contract is signed with a client, runs for a period, and can cover several
projects — so it is not a field on a project, and hanging it on one would mean
copying the same number onto every project it pays for, which is how two of them
come to disagree.

**But where it lives is the second question. The first is whether anything in
the PLAN is measured against it** — and that is a fact about the reference code
rather than a decision:

- if an activity carries estimated hours that roll up towards a budget, then
  Portfolio needs at least the number, wherever it is kept;
- if nothing in the tree reads any of it, then budget hours, budget amount,
  contract dates and the lead consultant are a **commercial record with no part
  in a delivery plan** — and Portfolio needs none of them.

**ANSWERED BY THE AUDIT, 2026-09-17**: `budget_hours`, `start_date` and
`expected_end_date` are read by **exactly one file** — the workbook's Context
sheet, where they are printed as prose for the AI to plan against — and **no
plan-tree logic reads any of them.** Nothing validates an activity against the
agreement's dates or its budget. So the second reading holds: it is a commercial
record with no part in the arithmetic.

**Which gives the charter's budget figure a use rather than leaving it
decorative**: it is what the workbook's context sheet tells the model to plan
within (§9.3, §7.5).

**AND SMP HAS NOWHERE TO PUT IT TODAY, MEASURED**: **57 tables in
`smp-app/db/schema.sql` and not one holds a budget, a contract, a fee or an
hour.** The only matches for *budget* in the whole product are comments about
how much accent colour a screen may spend (§41). So this is not a field being
moved from one level to another — it is a **concept the platform does not have**,
and giving it one is a feature of its own with its own spec, not a column added
in passing (rule 2b).

**ANSWERED 2026-09-17, AND THE TWO HALVES SPLIT** (*"I beleive the contract is
irrelevant now. but for the bugdet I think any project should have a place for
an overall view in a project charter"*):

- **the contract is dropped** — budget hours, contract dates and the lead
  consultant go with it, and nothing asks for them again;
- **the budget stays, as a headline on the project's own charter** (§5.1) rather
  than as a level above it. Which answers the question this section asked
  without needing the reference's code: it is not a client-level fact being
  moved, it is **one figure on the page that describes the project**.

The detailed breakdown behind it is §5.2, and is named rather than built.

### 9.7 · The migration
Real plans exist. Moving them means: each `(agreement, scope)` pair becomes one
project; MySQL types become Postgres; every person becomes a register key on the
right client, and anybody not on that register is a decision rather than a
default. **Deferred, 2026-09-17** (*"I will bring the old plans data later"*). So the
first build is authored fresh and the migration is written against the real
data when it arrives, rather than against a guess at its shape. Nothing in the
model is decided by it — which is what makes deferring it safe.

**Three blockers are known already, from the audit, and they are worth having in
hand before the data arrives**:

- **duplicate phase numbers almost certainly exist.** Their unique key spans two
  nullable columns and in MySQL a NULL constrains nothing, so a plan with no
  scope has **no phase-number uniqueness at all** today. Here those nullables
  are gone and the key starts biting. Check before adding it.
- **orphans are assumed rather than ruled out** — six columns carry no foreign
  key, an activity's assignee and a comment's mentioned user among them.
- **two people hold Lead by a NAME MATCH and no row**: being named
  `lead_consultant` on the client, or on any subdomain of it, grants their
  Client Lead outright. Those grants **cannot be migrated**, because there is no
  membership row to carry — whoever holds Lead that way has to be named
  explicitly. Which is §130.1's own lesson arriving from the other side: 32 of
  78 demo tactics named an owner who matched nobody, and a name match is not a
  grant.

### 9.8 · Does a phase show how far along it is?

**New, from the audit — and it is the one finding that opens a question rather
than closing one.** There is **no roll-up above the activity at all.** The
columns exist: `phases.progress_percent` and the work packages' are both
`DECIMAL(5,2) NOT NULL DEFAULT 0`, and **nothing in their code ever writes
either** — the only figure the plan renders is one number for the whole plan.
So a phase shows nothing, and two columns read `0.00` for ever while looking
like data (§294.2's write-only column, one step worse: never-written).

**CORRECTED BY THE SECOND AUDIT (2026-09-19, §9.11)**: *"a phase shows nothing"*
is true of their **plan** page and **false of their analytics page**, which
computes a figure per phase at request time and renders it with a named status.
The half that stands is the one that mattered: **the stored columns are still
never written** — and the analytics endpoint **selects `progress_percent` and
never reads it**, which is the strongest confirmation the recommendation below
could have asked for. Somebody started the stored-summary version and stopped.

**SMP rolls up everywhere**, which is what makes this a question rather than an
omission: a measure rolls into a pillar, a pillar into a unit, a unit into the
group, each weighted and each with the arithmetic recorded. A plan whose phases
carry no figure is a plan nobody can scan from the top.

**Recommendation: derive it, never store it.** Their two columns are dropped
rather than ported (§7.6), and a phase's figure is worked out from its
activities when the page is drawn — which is how a pillar's is (§264: a summary
must be made of the numbers it summarises, and the whole of that section is what
happens when it is not). **Their own analytics already does exactly this**, and
caches nothing anywhere (§9.11 §E).

#### The weighting — answered by the platform, not chosen here (2026-09-17)

Asked *"what do you recommend?"*, and the honest answer is that **neither of the
two obvious options is the platform's, and the platform's is better than both.**

**Equal across activities is wrong in a way everybody has met**: a phase holding
*Kick-off meeting* (one day, done) and *Company-wide rollout* (sixty days, ten
per cent) reads **55%** when almost nothing has happened. A consulting phase is
exactly that shape — one large piece of work and several small ones.

**By duration is wrong in a worse way: the number moves when nobody reports
anything.** Extend an activity's end date and its weight grows, so the phase's
figure changes on a rescheduling. §277 is a whole section about a figure moving
because something beside it moved, and it is not a fault worth designing in.

**So: a weight per activity, defaulting to equal — which is what this platform
already does at every level above the activity, and what the reference already
does one level BELOW it.** A pillar's score is its measures weighted;
the group is its units weighted and re-normalised (§68); and the reference's own
sub-activity rule is *by weight if the set sums to 100, otherwise by count*. So
weighting is already the vocabulary at the bottom of their tree and at every
level of ours, and this extends it rather than inventing anything.

**And the blank rule is already written and already proved** — §243, in Islam's
own words: *"missing it should be considered equally weighted objectives not
0."* A blank counts as the average of the weights that WERE set; none set means
equal; every weight nought falls back to equal rather than to a dash. Reused,
never re-decided.

*The cost, stated*: most phases will carry no weights and will read the
equal-weight average, which is the number the first paragraph calls wrong. The
difference is that it is **correctable without touching a single date**, and
correcting it is one number on one row.

**WORKED ON THE DRAWING RATHER THAN ASSERTED** (2026-09-18): the plan mockup's
figures are computed from its own rows rather than typed — 100 / 67 / 10 across
the three phases, 20 for a work package, 100 for an activity whose three
sub-activities carry weights of 40, 40 and 20. **The first draft of it typed
62 and 8 and both were wrong**, which is the argument for deriving in one
sentence: two drawings of one project that disagree are the fault this spec
spends §5.2 warning about, and the charter was corrected to match.

**AND ONE THING THE ARITHMETIC DECIDED RATHER THAN THE OTHER WAY ROUND**: an
activity marked done and **waiting for a Lead's sign-off counts as 100%**.
Progress is how much work is done; the sign-off is whether a Lead accepts it.
Holding it at 99 until somebody signs would make the figure say something about
governance instead.

**A work package rolls into its phase and a phase with none rolls from its
activities directly** — the same shape the numbering already has (1.1 sits
directly under a phase when there is no work package).

**One thing not to conflate, because the same cell would say both**: this figure
is *how much is done*, and whether that is good depends on the dates. Progress
and being on schedule are two readings, and §344's rule is the one that applies
— a figure is read against what it is measured by, beside the box it is typed
into.

---

### 9.9 · The plan's second view, and the third flag — answered (2026-09-18)

**SIGNED OFF**, from `design-mockups/portfolio/2026-09-18_project-plan.html`,
drawn in the platform's own tokens with both palettes. Three things were asked
on it and Islam answered all three in one line — *"1. tmieline should have the
gantt 2. a billable for now is just a flag. no need for more now 3. agreed"*.

**1 · The Timeline IS a Gantt.** The first drawing had Timeline as a second
list sorted by date, which is a sort and not a view. It is a real chart now:
a month axis, a bar per activity with its progress filled in, a **today line**,
a **summary bar** per phase spanning what is in it, **milestone diamonds**
rather than bars (a milestone is a date, not a stretch of work), a red overrun
past the planned bar where something ran long, and **dotted elbows for
dependencies**, one per activity so the connectors stay readable.

**What it adds that the list cannot**, in the drawing's own example: phase 3 has
barely started and its bar runs to August, which reads in one glance and nowhere
in a list; and 2.2 running four days past its plan is drawn crossing into 2.3's
own window, so *why* 2.3 is blocked is visible rather than merely stated.

**BOTH VIEWS COME OFF ONE LIST AND THAT IS THE RULE, NOT A CONVENIENCE.** The
tree and the chart are two readings of the same rows in the drawing, so they
cannot disagree — the fault §5.2 spends its length on, and the one the charter
already caught once (§9.8: two typed figures, both wrong). A second builder for
the timeline would be §305's measured refusal arriving in a module that has not
been written yet.

**2 · Billable is a flag and nothing else.** It sits on the activity, it is
drawn on the panel, and **nothing counts it, totals it or invoices from it** —
so no rate, no hours, no amount and no billing screen, which is the whole of
*"no need for more now"*.

**AND THE THIRD FLAG IS NOT PORTED.** Their `activities.trigger_invoice` is
dropped, for a reason that is arithmetic rather than taste: **the level it
reported into is the one decision 2 deleted.** An invoice trigger is an
agreement's fact — it says *bill against this engagement when this activity
lands* — and there is no agreement here to bill against. Measured in the audit
rather than assumed: it is written, it is guarded as a structural field, and
**nothing shown reads it** (§294.2's write-only column) — and **their own
workbook does not carry it**, listing `IsMilestone, IsBillable` and stopping,
so dropping it costs the round trip nothing. §7.6 takes it.

**3 · The Charter tab stands** (*"agreed"*) — first of four, before Plan, as
§4's row 1 already had it.

**AND IT WAS NOT RENDERED BEFORE PUBLISHING EITHER** (§54.5, as §5.1 records
for the charter): this container has no browser. So the script was syntax-checked
and its arithmetic run outside the page — the three phase figures printed
**100 / 67 / 10**, which is what §9.8 asserts and what the charter says — and the
file was read instead. **Two faults were found that way**, both the same shape,
a rule written for a thing that was not there: the timeline's 820px grid had a
scroller declared in the stylesheet and **no element wearing it**, so the chart
would have scrolled the whole PAGE sideways rather than itself (§27.2 — a
sideways page scroll drags every sticky element with it); and the dependency
elbow's vertical drop was **a typed row pitch of 28px** where a row is 28 plus
its own border, so it is measured off the two rows at draw time instead
(§122.5 — a guessed constant goes stale in silence, and this one was already
one pixel wrong on the build it was written for).

**Progress is drawn at §9.10.** **Analytics** has no mockup, so rule 1c is still
owed for one of the four tabs.

---

### 9.10 · Progress — drawn 2026-09-18, awaiting sign-off

`design-mockups/portfolio/2026-09-18_project-progress.html`, in the platform's
own tokens, both palettes. **It reads the plan's rows** — the array is copied
byte for byte from the plan drawing — so the count at the top of the Plan page
and the count at the top of this one cannot disagree. That is §5.2's rule and
§9.8 is the record of it failing once already.

**Four sections, every one derived**: waiting to be signed off (**2.2**), past
its date (**2.3**, eleven days), nobody on it (**3.1.2, 3.2.1, 3.2.2**) and
signed off (**1.1, 1.2, 2.1**). Nothing on the page is typed; the figures were
run outside the browser before publishing and agree with the plan's own.

**THE PAGE SAYS WHAT IS TRUE AND THE CONTROLS ARE DRAWN FOR WHOEVER HOLDS
THEM** (§301). The drawing carries its own **Lead / Contributor / Viewer**
switch — the drawing's, never the product's — so both ends can be looked at
(§94.2): a Lead signs off and reopens; a Contributor reads the same four
sections and is offered neither; a Viewer is offered nothing at all. **Nothing
is hidden from anybody**, which is the difference between this and a narrowed
page: what changes is what can be pressed.

**The real end date is bounded and the row SAYS the bound** (§124), because the
second half of the rule is the one nobody expects: not before the day the work
was marked done, **and if the work was on time, not after its planned end
either**. 2.2 ran four days over, so its upper bound is open, and the row says
that too. The screen shows the bound; the server is what refuses — the same rule
twice on purpose (§42: a screen that only narrows a picker has narrowed nothing).

**Nobody is on these is the section §6.4 asked for before this page existed** —
*unassigned activities in a live plan are what nobody notices until a
checkpoint.* All three of them sit in the phase that has barely started.

**BLOCKED IS DELIBERATELY NOT A SECTION.** 2.3 cannot start because 2.2 has not
finished, which is a fact about 2.2 and already counted above; a fifth section
would make one activity read as two things owed (§108.1's own arithmetic).

**A gold edge means *this one is yours to do*, and it is drawn on what is owed
and never on what is finished** — marking a Lead's own signed-off rows would be
a colour that means nothing (§41's budget).

**An empty section says so and does not nag** (§45.2 with the sign reversed, as
§6.2 already records for the completions queue): a project with nothing waiting
is a healthy project rather than a screen that failed to load.

**AND IT WAS NOT RENDERED BEFORE PUBLISHING** (§54.5, as §5.1 and §9.9 record):
this container has no browser. The script was syntax-checked, its four lists run
outside the page and compared with the plan's own counts, and the file read.
**Two figures it first typed are derived now** — which phases the unassigned
rows sit in, and how far 2.2 ran over — because §9.8's whole lesson is that a
typed figure on a second drawing of one project is the fault, not the shortcut.

#### The checkpoint — answered (2026-09-18)

Islam: *"the checkpoint is just a date for the manager to have a look at the
project and review with the project team."*

**SO IT STORES NOTHING, AND THAT IS THE WHOLE ANSWER.** There is **no
`portfolio_checkpoints` table**, no attendance, no minutes, no per-checkpoint
record and no sign-off against one. Two fields on `portfolio_projects` — a
**cadence** (weekly, monthly, or none) and the **day** it runs on — and the next
date is **worked out from them, never stored** (§9.8's rule, one field over: a
figure that can be derived is not a figure to keep in step).

**None is a real answer.** A project with no checkpoint set draws no line and is
not nagged about one (§45.2 with the sign reversed).

**MISSING ONE COSTS NOTHING AND THE PLATFORM NEVER SAYS YOU MISSED IT.** A date
that has passed simply rolls to the next; there is nothing to be late against,
because nothing is recorded per checkpoint. Saying so now is cheaper than
discovering it: an alarm would be inventing an obligation out of a date he
described as *a look*.

**It gates nothing** — no save is refused, no figure is owed by it, and it
reaches no other module. What it is FOR is that the counts on Progress have a
date to be read against: *three days away* is what turns eleven days late from a
fact into something somebody does on Friday.

**Set by the office and the Lead**, which is the charter's own pen (§5.1) rather
than a second rule.

**The drawing is confirmed rather than changed** — it already names the next one
and holds nothing else, which turns out to be exactly right.

**AND THE RECORD OF THE REVIEW, IF ANYBODY WANTS ONE, IS NOT PORTFOLIO'S.**
Meeting Notes (spec 055) is one meeting, one note, with attendees and minutes
that go out as an email — which is the thing he is describing. It is **the
office's only** today, and a project team holds the client's own people, so the
two do not join up as they stand. Recorded as a possible later link and
deliberately not designed here (§10).

#### And the one it left open — since answered at §9.11

- **Analytics had no drawing and could not honestly have one** — the first audit
  named its files and never said what any of them rendered.
  **`specs/056-portfolio/analytics-brief.md` was written for a session that can
  read the reference, and `analytics-audit.md` is the answer (§9.11).** It is
  read now, and what it leaves is a decision about what the fourth tab is FOR
  rather than a hole in the reading.

---

### 9.11 · Analytics, audited — and the fourth tab may not earn its place

`specs/056-portfolio/analytics-audit.md`, read against commit `bf9793c` by a
session with the reference attached, answering `analytics-brief.md`. It opened
the four files the first audit counted and never read — 2,784 lines between them.

#### What it settles, and the answer is the good one

**Analytics is 100% plan tree.** Six database calls, three tables — `phases`,
`phase_groups`, `activities` — and **nothing else**: no budget hours, no budget
amount, no agreement dates, no lead consultant, no time entries, no utilisation,
no consultant costs, no other client. Every figure comes off activity `status`,
`progress`, `plannedEndDate`, `actualEndDate`, `isMilestone`, `assignedToUsername`
plus a phase's name and number.

So **the question this spec said mattered most comes back clean**: there is
nothing on that page that cannot travel, and nothing to drop for want of a level
decision 2 deleted. **Everything is computed at request time and nothing is
cached anywhere** — no stored summary, no memo, no header — which is this
platform's own rule (§264) arriving from the other side.

**And there is no chart library at all.** One hand-built inline `<svg>` ring and
bars that are `<div>`s with a percentage width. Nothing to port, nothing to add.

#### The grain — and it answers itself

**Their analytics page is per CLIENT, not per plan**, and always has been: every
other ScopePlan screen refuses to render without an agreement and a scope
selected, and this one sends neither (the two query parameters exist, are
applied, and **no caller supplies them**). So it aggregates across all of a
client's plans at once.

A Portfolio **project** maps to what they call a plan, not to a client — this
client has several projects — so porting that page as a project tab would
**silently narrow it**, which is the audit's own warning.

**It answers itself, because §4 row 5 already has the client-wide place**: the
landing is *the project list for this client, with each project's state*. Their
page is client-wide because their plan page is per-(agreement, scope) and they
had nowhere else to put it. We do. **So the cross-project reading goes on the
landing whatever else happens**, and anything on a project tab is per project by
construction.

#### The harder question, and it is Islam's

The audit was asked which three things it would keep. Measured against what is
**already drawn here**, two of the three are not missing:

| It would keep | Here |
|---|---|
| **Overdue triage** — late work, worst first, click through to fix | **Progress has it** (§9.10, *Past their date*). What it does **not** have is the three severity buckets — 1–5 / 6–14 / 15+ days — and **click-through to the row**. Both are small, and both belong on Progress. |
| **Per-phase progress with a named status** — *Phase 3 — 42% — 5/12 done — Early Stage* | **The Plan has the figure** (§9.8: 100 / 67 / 10 derived) and the **Gantt has the shape** (a summary bar per phase). What is missing is the **word** — *On Track · In Progress · Early Stage · Not Started* — which is a label on a number that is already there. |
| **The Milestone Tracker** — every commitment, met or missed, by how many days | **Genuinely missing.** Nothing here lists the milestones together with whether they were hit. |

**So one section of that page is new, and it is the one for a different
audience**: Progress is a working queue for the people doing the work, and a
milestone tracker is what you put in front of the client.

**Three ways to take it, and this is the decision:**

- **A · No fourth tab.** The severity buckets and click-through join Progress;
  the named phase status joins the Plan; the milestone tracker becomes a section
  on Progress; the cross-project reading goes on the landing. *Smallest, and it
  mixes two audiences on one page.*
- **B · A fourth tab that is the client-facing reading.** Analytics becomes the
  milestone tracker and the phase roll-up — what you would show a client — while
  the triage stays on Progress where the work is. *This is the recommendation:
  it keeps the tab §4 already promised, gives it a reason to exist that Progress
  does not already serve, and is mostly new rather than a port.*
- **C · Port it closer to theirs** — four tabs' worth on one Analytics page.
  *Costs the most and, by the audit's own reading, most of it is furniture.*

#### What is binned, on the audit's own evidence

- **The Health Score.** One composite 0–100 whose weights are arbitrary, and the
  audit ran the real formula to prove it: **an empty plan and an untouched plan
  both score 50**; a **totally overdue** plan floors at **20**; and
  `blockedPenalty` is **absolute, not proportional**, so four blocked activities
  cost a fifth of the score whether the plan has four or four hundred. Worse, a
  plan with no phases hardcodes **0** while a plan with phases and no activities
  computes **50** — *the same emptiness, two different numbers.* If Portfolio
  ever wants one number it decides its own (§264's shape).
- **The seven Schedule tiles**, which restate the Overview's status breakdown in
  a different shape.
- **Cancelled as a headline figure**, whose own subtitle shows two other numbers.
- **Upcoming Deadlines**, a weaker version of the overdue list pointed forwards
  and capped at three rows a column.

#### Four faults not to port

1. **Milestones Hit counts late ones as hit.** A milestone delivered three weeks
   late is counted.
2. **Every upcoming milestone reads "(in today)"** — the badge renders a
   countdown from a field that branch never assigns, so it is always `0`.
3. **"Weighted avg progress" is not weighted.** It is a plain mean over
   activities, so a phase with one counts the same per activity as a phase with
   fifty. §9.8 decided the weighting here; the label must not arrive with it.
4. **On-Time Delivery is biased upward by exactly the queue it sits beside.** An
   activity with no recorded actual end date **counts as on time** — and their
   `actualEndDate` is only ever set on the transition to Completed and **cleared
   on reopen**, so everything sitting at Done awaiting sign-off is counted on
   time. Here it cannot arise the same way (§9.10: sign-off is what writes the
   date), **but the rule must be that an activity with no real end date is not
   counted at all** rather than counted as a success.

#### The disclosure — and why it does not port as one

The audit found a real one: their analytics endpoint applies **scope-level**
narrowing and **not** activity-level, where their plan page applies both. So a
**Contributor** assigned to one activity sees, through analytics, the name,
assignee, dates and delay of **every activity in that scope** — while the plan
page shows them only their own rows.

**It does not port, because §6.2 already decided the opposite**: here a
Contributor **sees the whole plan** — it is written down, it was a choice, and
it is the reason this is not a leak in our model but is in theirs. *Their leak
exists because their Contributor is narrowed on one page and not the other; ours
is narrowed on neither.*

**One part of it would port and must not**: their assignee filter enumerates
**every assignee across the whole client**, not the plan. Our Contributor is
scoped to the **project**, so a filter built the same way would name people on
projects they are not on.

#### Phase groups — a decision this makes cheap

An optional coloured bucket a Lead drags phases into. The audit settles three
things: **a phase is in at most one group** (one nullable column); **"members"
are phases, not people**, and the route touches no permission; and **nothing
grouped is the normal state and the page is built for it** — every ungrouped
phase is synthesised into a *virtual solo group*, so **dropping groups entirely
degrades the section to a phase list and changes nothing else on the page.**

**So it is genuinely optional**, and the cost is named: **642 lines**, of which
about 90 are the drag-and-drop and the rest a full CRUD admin screen — create,
rename, recolour with an inline picker, delete, reorder, an assign-phases modal
and an ungrouped preview. **Recommendation: not in the first build.**
`portfolio_phase_groups` stays in §5 as a table nothing writes yet, or comes out
until somebody asks for it — **Islam's, and it is a real saving either way.**

#### What the audit could not verify, said rather than left

**The app cannot be run there** — no database, no `.env`, no MySQL binary — and
**the repository holds no ScopePlan rows at all**, which the first audit already
established. So **there are no screenshots and no real rendered values**: the
health-score table in it is the real formula executed against synthetic input,
and is labelled as such. Also unverified: which of the two pending-completions
surfaces people actually use (no telemetry, and both call the same endpoint with
the same query string), the real payload size, and whether the Contributor
disclosure has ever mattered in practice.

#### And the duplicate is settled

Their pending-completions page and its analytics tab are **the same screen
twice** — byte-identical query, identical write, identical controls, and the tab
says so in its own first lines. **Neither is a wider reading**; both are
client-wide. So the audit's own recommendation stands and is taken: **drop both
in favour of Progress**, and carry across the two things that make a queue
clearable rather than browsable — the **On Time / Late split with counts**, and a
**bulk sign-off**.

**And the bulk action has a decision inside it**, which is presumably why theirs
is two buttons rather than one: a sign-off writes a real end date, and for an
on-time activity that date is obvious while for a late one it is not. So *Sign
off everything that was on time* is safe in one press and *everything late* is
not — recorded here rather than discovered when it is built.

---

## 10 · Recorded, not decided

- **A Portfolio project pointing at a Strategy project.** Spec 046 §8 already
  records this: they are different things, nothing is designed for the link, and
  adding one later is an optional field rather than a redesign. Unchanged.
- **Strategy's reporting cycle does not reach Portfolio**, and Portfolio's
  checkpoints do not reach Strategy. Two rhythms, no join.
- **The 113 TypeScript errors in that area** are one repeated mistake — an
  optional value passed where a required one is typed — and the brief traced the
  runtime path and found it fails closed. The signature is wrong, not the
  behaviour. It is noted so the count does not frighten anybody pricing this.
- **This session has not read the reference code, and two sessions that could
  have.** `port-audit.md` (2,295 lines, commit `d569ba6`) and `analytics-audit.md`
  (848 lines, commit `bf9793c`) are theirs, written with that repository
  attached, and every claim in §7 and §9.11 is sourced to one of them with file
  and line. **What neither could do is RUN it** — no database, no `.env`, no
  MySQL binary, and the repository holds no ScopePlan rows at all — so there are
  **no screenshots and no real rendered values anywhere in this spec**, and
  nothing is known about what a real client's plan looks like on any of those
  screens. Before building, this repository still needs sight of the code — a
  fork under `islamsaadany`, or the work done in a session started on it.
- **A checkpoint and a meeting note may be the same act one day.** §9.10 settles
  that a checkpoint stores nothing; Meeting Notes (spec 055) is what a record of
  that review would be. It is the office's only and a project team holds the
  client's own people, so nothing joins them today. An optional pointer later is
  a field, not a redesign — the same shape spec 046 §8 records for a Portfolio
  project pointing at a Strategy one.
