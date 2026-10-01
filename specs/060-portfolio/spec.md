# 056 · Portfolio — the delivery plan, per client

**Status:** **the rules, the tables, and the first screens are built.** §5's
tree, team and words are in `db/schema.sql` and `db/migrations/015-portfolio.sql`,
and §3's six rules, §6's reach and §9.8's roll-up are in
`smp-app/lib/portfolio.ts`, proved by `checks/portfolio.mjs` (121/0, red ten
ways) — which is the slice §8 names in its own words, *pure functions where
they can be, so the sign-off, the derived dates, the computed progress, the
cascade and the renumbering are provable without a browser*. **`portfolio` is
`built: true` since 2026-09-30** and the module serves itself: **the landing
(§9.13) and a project's charter (§5.1)** — §12 is that slice, with
`checks/portfolio-module.mjs` at 36/0, red four ways. The plan, Progress and
Analytics are next and are **said rather than left to be discovered** (§54.5):
a project opens on its charter and its landing row reads *No plan yet*, which
is the landing's own signed-off empty state and not a placeholder. This is the
spec spec 046 §8 said Portfolio needed — *"Breakdowns, timelines and
dependencies are named and not specified. Portfolio needs its own spec."* — and
what it specifies is the shape, not the screens. **Every screen is drawn and
every screen is signed off** — the project team (§6.4), the charter (§5.1) and
the plan (§9.9) on 2026-09-17/18, and **the landing** (§9.13, with its
commitments section §9.13b), **Progress** (§9.10) and **Analytics** (§9.12) on
2026-09-30. **RULE 1c IS PAID IN FULL**, so the sentence that stood here
through six drawings — *nothing visual may be built until each screen is drawn
and signed off* — is satisfied rather than waived, and what stops a build now
is no longer a sign-off. **AND §10's OWN ITEM IS ANSWERED TOO**: the reference
repository was given to this session on 2026-09-30 and is read — **§11 is that
read-through**, six screens against the code they describe, written before a
line was built. Three of its ten findings are instructions for whoever writes
the migration and two confirm the design's own corrections; **none invalidates
a signed-off screen**. What is still true is that no real client's plan has
been seen through it (§11.9), which is a question about shape and not about
rules. **Building started 2026-09-30 on Islam's word**, *"write it into the
spec first, then start building"*.

**Read with spec 046 (Modules)**, whose §4.2 contract this passes in §4 and
whose module frame — the address, the switcher, the row on the client's card,
the on/off drawer, the door and `withTenant` — it inherits without touching.
`portfolio` was **already the reserved word** in `MODULES` and `MODULE_DEF`,
so the address, the switcher and `isModule()` needed no edit to make room for
it — the whole of §12's frame cost one flag and one line in
`modules/registry.ts`, which is spec 046 §4.5's claim paid rather than
asserted.

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
| 1 | Its own navigation | A project is picked first; then **Charter** (§5.1) · **Plan** (the tree and the timeline, which is a Gantt — §9.9) · **Progress** (the sign-off queue and what is owed — §9.10) · **Analytics** — the client-facing reading: the phase roll-up and the commitments, and deliberately not the triage, which is Progress's (§9.11, §9.12). An activity opens a panel rather than a page. **The charter was not in this list when it was written** and is first now, because it is where somebody who has never seen the project starts. |
| 2 | Its own roles and areas | **Three roles, no areas at all.** There is no Portfolio column on Roles &amp; access. The roles belong to a project, not to the module (§6) — which is the contract's *own roles* answered honestly rather than by borrowing a grid. |
| 3 | Its own Setup group | **Yes**, and it holds ONE thing: the three words (§9.1). Who leads a project is set on the project (§5.1a), which is where it belongs — so this group is a page with a row on it, and saying so now is cheaper than discovering it. |
| 4 | Its own rhythm | **Checkpoints**, weekly or monthly, per project — **not** the reporting cycle. Strategy's cycle does not reach it and must not. **A checkpoint is a date and nothing else** (§9.10): it stores nothing, records nothing and gates nothing. |
| 5 | A landing | The project list for this client, with each project's state, and the cross-project reading §9.11 kept off the tabs — **drawn at §9.13**. A client with one project lands in it, so this list is only ever seen by somebody who can reach two or more. |

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

#### 6.4a · Can a LEAD name somebody? — open, answered the narrow way (2026-09-20)

**Found by building §6 rather than by reading it** (§375). Two sentences in
this page point different ways and both are Islam's:

- §6.4 and §9.2 make naming people onto a project **the seat's** — *the
  client's Super user can do anything, naming people onto a project and
  starting one*;
- §5.1 gives the charter's pen to the office **and the Lead**, and §5.1a has
  the charter's **Project Manager** row read whoever is at Lead and says
  *setting it there sets the role*.

So a Lead editing that one row on the charter would be naming somebody, which
the team screen does not let them do. Neither sentence is wrong; they were
written about two different surfaces and have not met.

**`mayNameTeam()` is the SEAT's alone until he says otherwise** (§42 fails
closed, and the narrow answer is the one that can be widened without taking
anything back). What it costs, stated: a Lead correcting the charter cannot
change who leads the project from that row, so the Manager row is read-only to
them and the team screen is where it moves. Whichever way it goes it is one
predicate, and the check asserts both ends of it already.

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

### 9.10 · Progress — SIGNED OFF 2026-09-30

**SIGNED OFF 2026-09-30** (*"ok for the progress and analytics too"*), from
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
  **`specs/060-portfolio/analytics-brief.md` was written for a session that can
  read the reference, and `analytics-audit.md` is the answer (§9.11).** It is
  read now, and what it leaves is a decision about what the fourth tab is FOR
  rather than a hole in the reading.

---

### 9.11 · Analytics, audited — and what the fourth tab is for

`specs/060-portfolio/analytics-audit.md`, read against commit `bf9793c` by a
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

**Three ways were put with the cost of each, and Islam took B (2026-09-20):**

- **A · No fourth tab.** The severity buckets and click-through join Progress;
  the named phase status joins the Plan; the milestone tracker becomes a section
  on Progress; the cross-project reading goes on the landing. *Smallest, and it
  mixes two audiences on one page.*
- **B · A fourth tab that is the client-facing reading** — **TAKEN**, and it was
  the recommendation. Analytics becomes the phase roll-up and the milestone
  tracker — what you would show a client — while the triage stays on Progress
  where the work is. It keeps the tab §4 already promised, gives it a reason
  Progress does not already serve, and is **mostly new rather than a port**.
  **Drawn at §9.12.**
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
and an ungrouped preview. **NOT IN THE FIRST BUILD** — the recommendation, taken
as offered on 2026-09-20 and reversible on a word. `portfolio_phase_groups`
stays in §5 as a table nothing writes yet, and **§9.12's drawing is the ungrouped
reading**, which their own page already renders when nothing has been filed.

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

### 9.12 · Analytics, drawn as B — SIGNED OFF 2026-09-30

**SIGNED OFF 2026-09-30** (*"ok for the progress and analytics too"*), from
`design-mockups/portfolio/2026-09-20_project-analytics.html`, in the platform's
own tokens, both palettes. **Two sections and nothing else**: where each part of
the plan stands, and every commitment with whether it was met.

**WHAT IS ABSENT IS THE DESIGN.** No health score, no seven status tiles, no
Cancelled figure, no upcoming-deadline columns, no severity buckets and no
sign-off queue — the first four because §9.11 binned them on the audit's own
evidence, the last two because **they are Progress's and nothing is repeated
across the two tabs**. That separation is the whole of what B means: Progress is
a working queue for the people doing the work, this is the reading you take into
a review.

**The roll-up is one level at a time** — an activity from its sub-activities, a
phase from its activities, the project from its phases, equal weights unless
somebody sets them (§9.8). The drawing reads **100 / 67 / 10** across the three
phases and **59%** overall, and the figures were run outside the browser before
publishing.

**TWO CORRECTIONS OF THE REFERENCE ARE VISIBLE ON THE PAGE, WHICH IS WHY THE
FIXTURE HAS SIX MILESTONES ON NINE ACTIVITIES** — one in every state the tracker
can draw, said on the page so nobody reads it as a realistic plan (§255):

- **A milestone is hit when it was signed off ON OR BEFORE its date, and not
  otherwise.** The drawing's *2.1* was signed off five days late and is **not**
  counted — theirs would count it. The headline reads **1 of 6**; theirs would
  read 2.
- **Marked done is not hit.** *2.2* is finished and waiting for a Lead, drawn in
  the platform's own navy and counted in **neither** column. Theirs counts it as
  delivered on time, because an activity with no recorded end date is assumed to
  have met its date — **which flatters exactly the sign-off backlog it sits
  beside**.

**AND THE TWO NUMBERS LOOK LIKE A CONTRADICTION UNTIL THEY ARE NAMED**, so the
page names them: phase 2 reads *2 of 3 done* while its commitment reads
*Awaiting sign-off*. Progress counts work that is finished; a commitment is met
when somebody accepts it. The blueprint draft is finished and nobody has
accepted it.

**"ON TRACK" IS NOT A WORD A PERCENTAGE MAY USE.** Theirs labels a phase at 90%
*On Track*, which is a claim about a schedule the figure cannot see — §344's own
rule. So the word beside the bar answers *how far along* (**Not started · Early ·
Under way · Nearly done · Done**, thresholds ours and said so) and a separate red
**Behind** mark answers *is it late*. Phase 2 in the drawing is 67% **and**
behind, and both are true.

**THE COMMITMENTS ARE IN DATE ORDER, REVERSING THEIRS.** They sort by severity —
overdue, then upcoming, then what was met — which is right for triage and wrong
for reading a project out. A review walks the timeline, and the outstanding ones
stand out by colour without being dragged to the top.

#### The rows are spliced, not copied — and that is new here

Three drawings now read one plan, and **three hand-kept copies of an array is
the fault §5.2 is about arriving in my own mockups**. So the canonical rows live
in `design-mockups/portfolio/_rows.js` and `sync-rows.py` splices them between
markers in every drawing that carries them — **write, or `--check` to fail when
one is behind**. It **refuses rather than guesses**: a file with one marker and
not the other, markers the wrong way round, or a run that matched no drawing at
all are each a failure with a name (§54.5 — an empty run that prints nothing is
not a pass). **Nothing is listed by hand**, so a fourth drawing joins by adding
the markers (§214.3).

**And it paid for itself at once**: this round gave four activities a milestone
flag and moved one sign-off date, and the plan and Progress drawings picked both
up with no editing — the plan's Gantt gained a second red overrun it is right to
have, and Progress's signed-off list moved to the real date.

#### What it leaves

- **Across projects is still not drawn.** §9.11 settled that the client-wide
  reading belongs on the **landing** — the project list with each project's
  state (§4 row 5) — and that is the last screen of this module with no picture.
- **Nothing is printable or exportable.** A review deck out of this page is the
  obvious next ask and is deliberately not built; Strategy's own `.pptx` and PDF
  routes (§296, §305, §311) are what it would follow.


### 9.13 · The landing — SIGNED OFF 2026-09-30

**SIGNED OFF 2026-09-30** (*"ok for the landing"*), from
`design-mockups/portfolio/2026-09-20_portfolio-landing.html`, in the platform's
own tokens, both palettes — **with the commitments section §9.13b added at his
word before the sign-off**, so what is signed off is the page including it.
**The last screen of this module with no picture.**

**ONE QUESTION, AND A ROW ANSWERS IT FOUR WAYS**: which project needs me — how
far along it is, whether it is late, what is waiting on somebody, and when
anybody next looks at it. Nothing else is on it. The charter, the tree, the
queue and the client-facing reading are four tabs one press away, and repeating
any of them here would be the fault §9.12 kept off Analytics.

**A PROJECT HAS NO STATUS FIELD AND ITS STATE IS DERIVED FROM ITS PLAN.** §5
stores a name, a charter and a checkpoint cadence and nothing that says how it
is going — which is §9.8's rule one level up, and is what makes this list unable
to disagree with the pages behind it. Culture Transformation's **59%**, its
**Behind** mark and its **5** are the same rows and the same sums the Plan,
Progress and Analytics read.

**TWO OF THE FIVE HAVE NO FIGURE AND THAT IS THE HONEST ANSWER.** *Retail
network review* has a charter and no plan, so there is nothing to average and
the row says **No plan yet** rather than printing 0% — absent is not nought
(§35, §93), and nothing gates building a plan (§5.1), so it is a normal state
rather than a broken one. *Finance systems consolidation* has a plan nobody has
started, which **is** nought and reads 0% — the difference the row above it
exists to show.

**WHAT IS WAITING IS A COUNT OF ROWS, NEVER OF REASONS** (§279, §108.1) — and
the fixture **demonstrates it rather than claiming it** (§255): Commercial
excellence programme's promotion review is past its date *and* has nobody on
it, so the breakdown names three reasons while the number reads **2**. A list
that added the reasons up would say 3 and send somebody looking for a row that
is not there.

**LATE AND HOW FAR ALONG ARE TWO QUESTIONS**, drawn apart for §9.12's reason:
the word beside the bar answers *how far along* and the red mark answers *is it
late*, because *On Track* is a claim about a schedule a percentage cannot see
(§344). A project can be 59% **and** behind.

**THE LIST IS NARROWED AND THE STRIP COUNTS WHAT YOU CAN OPEN.** A seat reaches
every project, anybody else only the ones naming them (§6.1) — and all three
headline figures move with the list (5 / 2 / 8 for a seat, 2 / 2 / 7 for Omar),
which is asserted by the fixture rather than by coincidence: a project only the
seat can see owes something, so the third figure could not have matched by
accident (§113.8). **Starting a project is by seat**, so Omar is offered no
button rather than a dead one (§61, §301), and **the gold edge is his and not
the seat's** — everything is a seat's, so marking all five would be a colour
that means nothing (§41).

**SOMEBODY WITH ONE PROJECT NEVER SEES THIS PAGE** (§4 row 5), so there is no
one-row state to look at and Omar is drawn on two.

**THE ORDER IS THE PLAN'S OWN START, EARLIEST FIRST — NOT WORST FIRST.** A short
list is scanned for a **name**, and an order that moves as things go wrong is
one nobody can scan; the marks and the strip do the alerting. Same argument
§9.12 made for the commitments. A project with no plan sorts last.

#### And this one was rendered before publishing

The three before it say in their own notes that they were not — those containers
had no browser. **This one has**, and it changes what can be claimed:

- every figure on the page was **read out of the rendered document**, not
  checked by eye;
- the Plan, Progress and Analytics drawings were rendered beside it and are
  **byte-identical to what they published** — 59%, 100 / 67 / 10, 1 of 6 and
  Progress's 1 / 1 / 3 / 3 are confirmed rather than recorded (§303);
- **contrast is measured in both palettes on all four drawings: 0 failures**,
  with the probe proved able to fail first (5 under a deliberate break) —
  because a sweep that reports nothing may be blind (§68.10);
- the table **fits its pane at 1600 / 1400 / 1280 / 1100 / 1000 / 900 / 768**
  with no sideways scroll, and that probe was proved able to report OVER too
  (§158: fit, never *and it scrolls*).

#### The arithmetic is spliced too, and the landing is why

§9.12 stopped three drawings holding three copies of the plan and left them
holding **three copies of the sums**: `kids()` and `roll()` were written out
twice, byte for byte but for a variable declaration, and the three predicates
that decide what is owed were a third copy on Progress. **They agreed, which is
what made it worth fixing while they still did** — the landing needs the roll-up
*and* the owed counts in one place, so copying would have made a fifth and a
sixth.

`design-mockups/portfolio/_derive.js` holds them, spliced by the same script
under a second marker pair. **What lives there is a FIGURE; what does not is
FORMAT** — `day()` prints a date with a year on Analytics and without one on the
Plan, which is each screen's own choice and must stay one.

**It is proved behaviour-neutral rather than claimed**: all three drawings
render byte-identical to their published output after the extraction. **And it
is proved load-bearing**, one break per thing each drawing reads — breaking
`roll()` reddens the Plan and Analytics and **leaves Progress untouched**,
because Progress draws only activities and a rolled figure never reaches it; a
break in `nobodyOn()` is what reddens Progress. *One falsification would have
left a third of it unproved.*

**AND THE EXTRACTION BROKE THE PLAN, WHICH IS WHY THE BASELINE WAS TAKEN
FIRST.** The slice that removed the Plan's copy of `d`/`kids`/`roll` took its
`esc()` with it — sitting between them — and the page rendered its panel and
**no tree and no Gantt at all**, with `esc is not defined` in a console nobody
had open. Every published figure was captured before the first edit, so it was
one diff rather than a discovery (§303, §214: delete a named function, never a
range).

#### What it leaves

- **Does a finished project stay in this list for ever?** *Supply chain
  resilience* is drawn in it, because nothing in §5 retires a project and a
  client with twelve years of work would eventually scroll. An archive, a fold,
  or nothing at all — a decision rather than a detail, and not taken here.
- **Nothing is printable**, the same as Analytics and for the same reason.
- ~~Should the landing name the next few commitments?~~ **Answered
  2026-09-30** — *"yes add the commitments section to the landing"* — and built
  at §9.13b.


#### §9.13a · Two sessions drew this screen, and one of them is thrown away

Recorded rather than quietly tidied, because the reason is the same one this
spec is about. Both drawings were made on 30 September against the same rows,
and **this one is the branch's**; the other
(`design-mockups/portfolio/2026-09-30_portfolio-landing.html`, published as an
artifact and **not committed**) is superseded in full.

**IT LOST ON FOUR MEASURABLE THINGS**, each of which is on the page above:
it had no **Next look** column at all, so the one fact §9.10's checkpoint
produces for this screen was missing; it drew **one** unplanned state where
there are **two** — a charter with no plan and a plan nobody has started — and
drawing them side by side is what proves *absent is not nought* (§35, §93); it
counted what is waiting as separate marks rather than a **union by row**, so it
never had to answer §108.1's arithmetic; and it left the **order** open where
this one settles it.

**AND ITS REFACTOR LOST FOR A BETTER REASON THAN BEING SECOND.** It merged the
plan and the sums into one `_plan.js`; `_rows.js` + `_derive.js` is two blocks,
which keeps fixture data apart from product arithmetic, **states the boundary**
(a figure is shared, a date format is each screen's), and gives `overall()` a
null for no plan instead of leaving every caller to remember. Its one carried
idea is the bullet above.

**WHAT IT DID FIND, AND IT WAS ITS OWN FAULT, NOT THE PRODUCT'S**: writing a
second copy of *how much warning a commitment deserves* — thirty days, beside
the fourteen §9.12 already had. Nothing in the branch carries it now, because
this landing prints no commitment dates; **it is named here so the next screen
that does prints one number rather than a second one** (§122.5 is about a
guessed constant, and this is not one — how much warning somebody wants cannot
be measured, so it is a decision with a name).

**THE LESSON IS §56.7's AND §256.2's, AND IT COST A DAY OF WORK**: two sessions
on one branch wrote one screen and one refactor each, and git noticed **six
conflicts and not the duplication** — the two landings have different filenames,
so nothing collided at all. *A clean merge is not a merge with one answer in
it.* Resolved by riding this model whole rather than carrying a second
(§256.2's own words), with every conflict taken from the branch and the tree
asserted byte-identical to it afterwards rather than assumed.

#### §9.13b · What is owed next — built and SIGNED OFF (2026-09-30)

Islam, of the question §9.13a left open: *"yes add the commitments section to the
landing."* Built into **this** landing rather than kept as the other drawing's,
so the page has one shape and one vocabulary (§53.5) — the same table as the
list, because a second shape for a second list on one page would be two answers
to how this page shows a list.

**IT IS THE ONE READING NO PROJECT TAB CAN GIVE**, which is why it belongs here:
a commitment belongs to a project, so the Analytics tab can only ever show one
project's at a time (§9.11). The list above answers *which project needs me* and
this answers *what do we owe next*.

**MET MEANS SIGNED OFF, AND THE TEST IS SHARED** — `metOn()` in `_derive.js`,
read by this page and by §9.12's, so the two cannot mean different things by it.
Culture's executive alignment workshop was accepted five days late and is
**met**: it owes nothing, it is done, and whether it was on time is Analytics'
question. Its blueprint draft is finished, unsigned, and is still owed.

**THREE THINGS PUT A COMMITMENT ON THE LIST**: it is waiting on a sign-off, it is
late, or it falls due inside `SOON`. Bounded by **time** rather than by a row
count, so no cut-off has to be defended the first time somebody adds a project.

#### The fault building it found, and it was a code path rather than a picture

**A SIGN-OFF IS OWED NOW WHATEVER ITS DATE SAYS**, and the first build excluded
one: a commitment finished early and sitting with a Lead, due in July, fell
outside a fortnight's window that has nothing to do with it. **Found by asking
whether a branch could be reached** — not by looking at the page, because the
fixture had no such row until one was made for it — and the giveaway is that
**the strip above already counts a sign-off as waiting on somebody**, so leaving
it out here would have been two answers on one screen, which is §5.2 in the
thing built to avoid it. *Commercial excellence's Assortment rules* is drawn for
it (§255), and one dead badge went with the fix: with the three cases exhaustive
there is no fourth state to style (§24).

#### And `SOON` is where §9.13a said the next screen would have to put it

That section recorded me writing *how much warning a commitment deserves* twice
— thirty days on the discarded landing, beside the fourteen §9.12 already had —
and said the next screen printing commitment dates would read **one** number.
**This is that screen**, so `SOON` moved into `_derive.js` beside the sums and
the Analytics page's typed `14` now reads it. It is not a guessed constant
(§122.5): how much warning somebody wants cannot be measured, so it is a
decision with a name, reversible in one place — **and it decides a colour and
never a word**, because every row prints how many days whether it is late or not.

#### The fixture had to grow, and that is the argument rather than an aside

**Four of the five projects carried no commitment at all**, so a cross-project
section would have drawn one project's and proved nothing about being
cross-project (§255). Five rows gained a flag, each for a state the section has
to show: one **overdue on a second project** (so it is genuinely across them),
one **inside the window on a project Omar is not named on** (so the switch
provably narrows the section and not only the list — §94.2), one **waiting on a
sign-off four months out**, one **outside the window** (so the window bites), and
one **met and signed off in 2025** (so the filter provably excludes by having
been accepted rather than by being old).

**AND EVERY CLAIM §9.13's OWN PROSE MAKES WAS RE-READ RATHER THAN ASSUMED
UNHARMED** (§303): Culture still 59%, Finance still 0%, Retail still no plan, the
order still earliest-plan-first, and *Commercial excellence*'s **2 owed rows over
3 reasons** — the row that exists to show §108.1's arithmetic — still 2 and
still 3, though its headline moved 39% → 64% and is quoted nowhere. The Plan and
Progress drawings and the Analytics page were re-read too, since the shared
module grew under all four.

#### What could not be checked

**No browser in this container**, so nothing is rendered. What was done instead:
every script syntax-checked, the artifact contract asserted, the splice asserted
in step across all four drawings, **every row the section draws printed in both
viewer states** (the seat sees six across three projects, Omar five across two,
with the gold edge on his two and on none of the seat's), the two excluded
reasons printed separately, and **the empty branch exercised on purpose** — it
ships and nothing on the page reaches it, because six rows are always in the
window (§54.5). Neither palette has been looked at.

#### What it leaves

- **A narrow window is untested and is not this section's fault.** The project
  list is four columns of fixed width with **one** media query on the page, and
  that is pre-existing; this section is three columns and its headers are
  `nowrap` at roughly 250px, so it should squash rather than overflow. Neither
  is measured, and a sideways page scroll is §27.2's own cost.
- **A commitment cannot be opened from here.** The row names its project and its
  number and nothing more — pressing it should reach the activity, which is the
  Plan tab's panel, and that is a link this drawing does not draw.

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
- **~~This session has not read the reference code~~ — ANSWERED 2026-09-30,
  see §11.** The paragraph below is left as it read, because it is the record
  of what was true for the thirteen days it stood.
- **Two sessions read the reference code and this one could not.** `port-audit.md` (2,295 lines, commit `d569ba6`) and `analytics-audit.md`
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

---

## 11 · The reference code, read at last — 2026-09-30

**Islam gave this session the reference repository** (`aleymahmoud-ff/clientplus`)
after asking what had been done with the time, and being told the honest answer:
§10's last bullet has said since 17 September that this repository had never
seen the code it is porting from, and nothing had been done about it. It is
cloned now and read. **What follows is the first comparison of the six
signed-off drawings against the thing they describe**, and it is written before
a line is built, because a drawing agreed against an audit is agreed against
somebody's summary.

**MOST OF IT PORTED HONESTLY AND SAYING SO FIRST IS THE POINT**: the tree (phase
→ optional work package → activity, with an activity straight under a phase
numbered `1.1` rather than `1.1.1`), the two-step completion, the real dates
stamped in one place (`src/lib/scopeplan/activityDates.ts`, whose own header
says *all code paths MUST pass through* it), the 10% floor for a started
activity with nothing finished, sub-activity weights summing to 100 with an
equal-count fallback, the single dependency with a cascade preview, and Planning
Mode are all present and behave as §3 and §7 describe. **The six rules are
real.** What follows is only where the drawings and the code disagree.

### §11.1 · There is no project, no charter and no checkpoint — at all

**The word `charter` appears nowhere in that codebase, and neither does
`checkpoint`.** Their hierarchy hangs off the CLIENT: `phases` carries
`client_id`, with an optional `assignment_id` and `scope_id` beside it, and the
page is `/clients/[clientId]/scopeplan`. A "scope" is a named row
(`scopes`: a name, a subdomain, a creator, a status) and is a FILTER over one
client's phases, not a container with a life of its own.

**So three of the six signed-off screens have no counterpart to be checked
against** — the charter (§5.1), the team (§6.4) and the landing (§9.13).
They are NEW PRODUCT rather than a port, and that is stated rather than left to
be discovered when one of them turns out wrong in use: there is no old
behaviour to fall back on, and no reference implementation whose mistakes we
have already learned from. The other three — the plan (§9.9), Progress (§9.10)
and Analytics (§9.12) — do have one.

**IT DOES NOT INVALIDATE THE DESIGN**, and the reason is in §5 already: a
Portfolio project owns its phases, which is what makes a charter, a team and a
landing row possible at all. What changes is the claim. This has been described
as a rebuild; **half of it is a rebuild and half of it is new**, and the new
half carries the risk that goes with anything nobody has used yet.

### §11.2 · Their phase progress is a flat average, and ours is weighted

`src/app/api/scopeplan/analytics/route.ts` computes a phase's figure as every
activity in it counted equally — `reduce(…) / total`, with DONE and COMPLETED
both scoring 100. There is no weight above the sub-activity: `SubActivity` has
a `weight` column and `Phase`, `WorkPackage` and `Activity` do not.

**§9.8 gave all three a weight** (`portfolio_phases.weight`,
`portfolio_work_packages.weight`, `portfolio_activities.weight`, each
nullable, each blank meaning *the average of those that were set*) and it is
`checks/portfolio.mjs` proves. It is the better answer and it is Islam's.

**THE COST IS A MIGRATION COST AND IT IS NOT SMALL**: a client moved across
will see their phase percentages CHANGE — the same work, a different number,
with nothing on the screen explaining why. Named here so it is a decision taken
rather than a support call.

### §11.3 · They hold a phase's progress twice, and the two can disagree

`phases.progress_percent` and `scope_milestones.progress_percent` are stored
columns, and `PATCH /api/scopeplan/phases/[id]` accepts a `progressPercent`
between 0 and 100 and writes it. **The analytics endpoint ignores both and
recomputes from the activities underneath.** So one phase can legitimately show
two different numbers on two screens of one product — §5.2's fault, in the
reference.

**Ours is derived and never stored** (§9.8's own rule, one level up from
§5.2's). **What this adds is a migration instruction**: that stored column is
read by one screen and contradicted by another, so it is thrown away on the way
across rather than carried into a column we would then have to explain.

### §11.4 · Renumbering happens in Planning Mode and nowhere else

`src/utils/scopeplan-numbering.ts` is headed *"Auto-renumbering logic for scope
plan items in Planning Mode"* and every function in it takes a DRAFT. The live
`DELETE /api/scopeplan/activities/[id]` has three modes (single, cascade,
unlink) and **renumbers nothing** — so outside Planning Mode a delete leaves the
hole: `1.1`, `1.3`, `1.4`.

**§3's rule 5 says on every move, insert and delete**, which is what is built
and proved. Ours is the more consistent behaviour and it is a real difference in
feel: a number under somebody's eye can change when a colleague deletes a row
above it. Recorded rather than reopened — **the display number is not the id**
(§5's rows are keyed by uuid), so nothing keyed on a row is moved by it.

### §11.5 · The on-time flaw is confirmed in the code, and our fix is right

§7's audit row and §9.11 record that On-Time Delivery counts an activity with no
recorded actual end date as on time. **It is there**, in the analytics route's
milestone pass: after the on-or-before-its-date comparison, the next branch is
`else if (isDone) milestoneStatus = 'on_time'` — done, no finish date, counted a
success. Combined with the actual end being CLEARED on reopen, the figure
flatters exactly the sign-off backlog it sits beside.

**§9.11's answer — an activity with no real end date is not counted at all —
is confirmed against the code rather than against a summary of it.**

**AND ONE NUMBER MATCHED EXACTLY**, which is worth as much as a disagreement:
their milestone `upcoming` window is **14 days**, the same figure §9.13b landed
on independently for the landing's commitments list and named once in
`_derive.js`.

### §11.6 · Their analytics skips the work package level

The activity filter is `phaseId IN (…) OR workPackage.phaseId IN (…)` and every
roll-up is phase → activities. The middle level exists in the tree and is not
rolled up. **Ours rolls up through it** (§9.8), which is what makes a work
package's own figure mean anything. Minor, and a difference.

### §11.7 · Six client-wide roles, against our three per project

`ClientTeamMember.teamRole` is one of **CLIENT_LEAD · SCOPE_LEAD ·
SENIOR_CONTRIBUTOR · CONTRIBUTOR · COLLABORATOR · VIEWER**, held for the whole
CLIENT, crossed with a separate module permission level (CONTROL / EDIT / VIEW /
NONE) in `src/lib/scopeplan/permissionUtils.ts`.

**§6 is three roles held on the PROJECT**, which is Islam's own correction
(*"the portfolio has it's own roles it's that simple. and it's relevant to the
project itself not even the module"*). Unchanged, **with the migration cost
named**: a person's role today covers everything for that client at once, so
moving them means DECIDING a role per project rather than mapping one.

### §11.8 · Their sign-off queue is one of our Progress page's four sections

`/api/scopeplan/pending-completions` is, in its own words, the *Lead Completion
Queue — activities that are DONE but not yet COMPLETED*. §9.10's Progress page
carries that plus past its date, nobody on it, and signed off. Ours is a
superset and no rule differs.

### §11.9 · There is still no real data, and now it is certain rather than assumed

`Dump20251023.sql` predates ScopePlan (built December 2025): it holds `scopes`
(151 rows) and `scope_templates` (74) and **no phases, work packages or
activities at all**, and neither `prisma/seed.ts` nor `prisma/seed-demo.ts`
creates one. So the code is fully readable and **no real client's plan has been
seen through it**. What that leaves unknown is shape rather than behaviour — how
many activities a real phase holds, how long real names are — which is a
question for the screens and not for the rules.

### §11.10 · What this changes, and what it does not

**Nothing here invalidates a signed-off screen.** Two things are decisions
rather than findings and both are Islam's: that phase percentages MOVE for any
client migrated (§11.2), and that three of the six screens have no reference
behaviour behind them (§11.1). Three are instructions for whoever writes the
migration (§11.2, §11.3, §11.7). Two are confirmations that the design's own
corrections were right (§11.5, §11.6).

---

## 12 · Built — the module serves itself, 2026-09-30

Islam: *"write it into the spec first, then start building."* §11 is the
writing; this is the first slice of the building. **What is here is the frame
and two screens** — the landing (§9.13, with §9.13b's commitments section) and
a project's charter (§5.1) — and what is not is said in the server's own
header rather than left to be discovered (§54.5).

### §12.1 · The frame cost one flag and one line

Spec 046 §4.5 claims a module is *a folder and an entry*, and this is the first
time that claim has been paid by somebody who did not write it.
`portfolio` was already the reserved word, so the address, the switcher, the
row on the client's card, the on/off drawer, the door, the seat and
`withTenant` all arrived working: the entire edit outside the module's own
folder is `built: false` → `true` in `lib/modules.ts` and `portfolio` added to
`SERVERS` in `modules/registry.ts`. **Both of the registry's own breaks keep
it**, so `no-server` and `wrong-server` go on falsifying what they were written
for rather than incidentally falsifying this.

### §12.2 · The queries live in their own file, so the rules stay pure

`lib/portfolio.ts` is what `checks/portfolio.mjs` asks with **no database and
no browser**, which is §8's own promise and the reason that check is 121
assertions long. A query in it would have ended that. So
`lib/portfolio-io.ts` is new and holds the six reads and writes —
`listProjects`, `oneProject`, `addProject`, `setCharter`, `roleOn`, `planRows`
— and **the rules file gained exactly one line**: `milestone?: boolean` on
`Row`, because §5's commitment mark changes no arithmetic there and decides
only which rows the landing reads (§9.13b) and what Analytics counts as a
commitment met (§9.12).

`planRows()` is **one query, not three**: a `UNION ALL` over phases, work
packages and activities ordered by position at each level, returning the flat
ordered array `_derive.js` already reads and §5.2 already argued for — *the
plan on the screen and the plan on the server cannot arrive at two answers for
one project*.

### §12.3 · Who sees what is in the WHERE, never in a filter afterwards

§6 says a seat on the client reaches every project and anybody else reaches the
projects that name them. That narrowing is in `listProjects`' own `JOIN
portfolio_members … WHERE person_key = $1`, and **a project this viewer cannot
see answers the same *not found* as one that does not exist** — so the address
cannot be used to discover what a client holds. §355's lesson, one module
along: *a report kept off a list and still downloadable is no rule at all.*
Asserted at both ends (§94.2) — B sees none of A's, A sees its own — and
falsified: `see-everything` drops the join and goes **2 red**.

### §12.4 · A read that failed is not an empty list

Found by `checks/modules.mjs` **crashing**, not by reading: that file drives
every module's server with a deliberately fake tenant id, and `withTenant`
refuses one, so my landing threw where the tracker's degrades. The fix is not
a try/catch that swallows: `seen` is `Seen[] | null` and **null is *it could
not be read***, so the strip's counts draw an em-dash and the page says
*Not read just now* rather than *No projects yet*. §35, §93 and §231.4 in one
line — *counting an error as absence reports everybody as having none*, and on
a landing that would tell a consultant their client has no delivery work.

### §12.5 · A word it does not draw is a redirect, never the landing

Also found by `checks/modules.mjs` going red: my server fell through to the
landing for any address it did not recognise, and that check asserts a module
answers **302** there — which is what every unknown word inside a client
already gets (`lib/modules.ts`) and what stops a mistyped address rendering a
page that looks right.

### §12.6 · One spelling of the em-dash

My own check contradicted itself: the strip wrote the character and the owe
cell wrote the entity, and `esc()` escapes only `& < > " '`, so both render
identically and only one can be asserted. Fixing the first broke the second.
**The character, everywhere**, because it survives `esc()` — with a comment
saying why, or the next person writes the entity again.

### §12.7 · A break that cannot falsify is not a break

The first falsification of the *No plan yet* state was a CSS
`visibility:hidden`, and it went **green** — because every assertion in that
section is about the document's words, and a rule that hides them changes
none. §54.5: *a falsification that passes is indistinguishable from a working
guard.* Replaced with `no-plan-yet`, which makes the cell print **0%** — the
actual fault, a project with no plan reading as one that has done nothing —
and it is 1 red.

### §12.8 · Two checks held a literal this build moves

§214.3 for the seventh time, both **REWRITTEN and never loosened** (§218).
`checks/portfolio.mjs` asserted *portfolio is a reserved word and NOT built*,
which was true for as long as it was and is now the opposite; it asserts what
survives — **a built module has a server of its own, and one that is not built
has none** — with the second half as the control, or the first passes on a
build where every module is built (§113.8). It stands on `processes`, the one
module still unbuilt, and it is **proved able to fail both ways**: the flag put
back is 2 red, the registry entry removed is 1 red. `checks/modules.mjs`'s
*an unbuilt module's word is not an address either* named `portfolio` outright;
it derives the set from the table now, and says in its own detail when there is
nothing left unbuilt for it to stand on.

**And the second `const UNBUILT` I wrote for it collided with the file's own**
— §56.7, caught by the parser rather than by a check, which is the loud end of
that fault.

### §12.9 · What is not built, said plainly

The plan, Progress and Analytics. A project opens on its **charter**, and a
row on the landing reads **No plan yet** — which is the landing's own
signed-off state for a project with none (§9.13) and not a placeholder. The
next slice is the plan, because Progress and Analytics both read it.

### §12.10 · And the container could not verify anything until it was made able to

`tsc` reported **498 errors** and `checks/portfolio.mjs` could not find the
`tenants` table: no `node_modules` and no database. Both are set up rather than
worked around — dependencies installed, Postgres 16 stood up and
`db/apply.mjs` run through migration 016 — because **a slice nothing can prove
is a slice nobody can trust**. Verified: `checks/portfolio-module.mjs` 36/0 and
red four ways (5 / 2 / 2 / 1), `checks/portfolio.mjs` 121/0 still red ten ways,
`checks/modules.mjs` 112/0, `checks/insights.mjs` 127/0,
`checks/notes.mjs` 170/0, `generated-in-step` all clear, `next build` compiled,
`tsc` clean but for `lib/prisma.ts`'s pre-existing error.
**`checks/tracker.mjs` is 224/4 and it is not this work's** — established by
stashing everything and reproducing the identical four on the baseline (§303).
They are the date-relative literals §375 already records as `main`'s, now four
rather than one because the clock has moved ten days further from the
fixture's stamps.

---

## 13 · Built — the plan, in two views, 2026-09-30

The second slice, and the one Progress and Analytics both wait on: **the plan
read**, in the two views §9.9 signed off. Writing one is not built and is said
in the file's own header (§54.5).

### §13.1 · One read, rolled up once, and both views read it

§9.9's rule is that the tree and the chart are two readings of one list, so
they cannot disagree — and it is carried out literally: `planRows` is asked
once, `rollUp` writes the parents' figures onto that array once, and both views
map over it. **Nothing on the page computes a figure**: the numbers are
`renumber`'s, the parents' percentages and spans `rollUp`'s, *late* is
`behind`'s and the two counts at the top are `waitingSignOff` and `overdue` —
every one of them in `lib/portfolio.ts`, where `checks/portfolio.mjs` asks them
with no browser. The check asserts **every figure on the page against
`rollUp`'s own answer** rather than against a typed number, so a change to the
roll-up moves both at once and cannot move one.

### §13.2 · And that found a real fault in the first slice

`planRows` ordered a phase row with `p2 = 0` and an activity hung straight off
that phase with `-1`, so **the phase sorted after its own children** — and the
numbering read `0.1 0.2 1 1.1` where it should read `1 1.1 1.2 2`. It is not
only the order on a page: `rollUp` and `kidsOf` read that array **by
position**, so every figure the landing drew for such a project was worked out
from the wrong set. Invisible in slice 1, because the only projects it had were
ones with no plan at all. One character, and the break `bad-order` puts it back
(**3 red**).

### §13.3 · The address carries the view and the opened row

So a plan opened on one activity is a link somebody can send — the tracker's
own idiom — and the switch is two `<a>`s rather than a script. **An opened
activity is read THROUGH its project**: an activity id is a uuid somebody can
type, and a row from another project is nothing here. The first version of that
assertion was **unfalsifiable** and went green under its own break, because the
page has a second fence behind the query (the opened row must also be in this
project's rows); it is asked of the read itself now, with the page's refusal
kept as the control (§113.8).

### §13.4 · Five things found by looking at the rendered page

None by a check, which is §311.1's own lesson arriving again — every one now
has an assertion.

1. **`27 – 27 Feb` for a one-day commitment.** A milestone's span is the day it
   falls on; printing it twice reads as a range of nothing.
2. **`Sep – Feb 27` for a phase crossing a year**, which reads as though
   September were 2027 too. It says both years now. The drawing never crossed
   one, so it never had to answer this.
3. **`JAN` and `FEB` twice on the axis with nothing telling them apart.** The
   first month of each later year carries its year; a year on every column
   would be twelve repetitions of one fact.
4. **A commitment on the scale's last day drawn half outside the track.** Both
   ends of the scale snap to a whole month now, not only the first.
5. **The panel said *still running* about work marked done** — which the
   status one line above contradicts (§124). Three states, three sentences,
   and the middle one says *the end date is written at sign-off* rather than
   leaving the absence to be wondered at (§35).

### §13.5 · The status column says what the status MEANS

`ACT_WORD.done` is **Done**, and a column reading *Done* beside *Completed*
asks the reader to have been told the difference — which is the whole of what
§6.2's two steps are. The column reads the drawing's own word, **Waiting to
sign off**; `ACT_WORD` is untouched and is still what the api and every refusal
spell, because that is the status's NAME. One answer per question, and these
are two questions (§53.5).

### §13.6 · The overrun a row awaiting sign-off cannot draw — A FINDING

The signed-off drawing draws an overrun for **2.2**, which is marked done,
finished four days late, and waiting for a Lead. **The schema forbids that
state**: `portfolio_activity_signed` requires `actual_end IS NULL` unless the
status is `completed`, and `stampDates` agrees — the real end date is written
**at sign-off** (§9.10), which is right, because it is the date a Lead agrees
rather than one anybody types.

So the two are consistent with each other and **both disagree with the
drawing**, and the thing neither holds is **the day the work was marked done**.
There is no column for it. That absence costs two things:

- the plan cannot draw the overrun for a row awaiting sign-off, so the chart
  shows one where the drawing shows two;
- **§9.10's own lower bound has nothing to read**: *not before the day the work
  was marked done* is a rule with no stored day behind it.

**RECORDED, NOT FIXED HERE**, and deliberately: this slice reads a plan and
writes no date, so adding a column, teaching `stampDates` to stamp it and
re-falsifying ten guards is a change of its own and not one to ride in beside a
read (rule 1b). The check asserts **exactly one** overrun rather than *at least
one*, so the day it is closed this goes red rather than passing quietly
(§113.8).

### §13.7 · A phase has no owner, and the drawing shows one

`portfolio_phases` carries a name, a position and a weight — no assignee — so
the Owner cell on a phase draws an em-dash where the drawing names a person.
Honest (§35) and a gap: whether a phase is owned at all is a decision §6 did
not take, and the drawing took it in passing. Recorded, not invented.

### §13.8 · The day helpers and the names left the tracker

`lib/notes.ts`'s own note said *a third module wanting them is the day they
move to a file of their own*, and Portfolio is that third module — so the day
helpers are `lib/day.ts` and the register's names are `lib/people.ts`, both
re-exported from `lib/tracker.ts` so every caller is untouched. The move is
**behaviour-neutral and asserted as such** rather than claimed: tracker and
notes are at exactly the counts they were before it.

**The fault that forced it was mine.** Slice 1 wrote a second `todayIn` inside
`modules/portfolio/`, which is a second answer to *which day is it* — the very
drift the note was about, and the one that makes a row read *late* on one
screen and not on another. What stays the tracker's is what is genuinely spec
054's: the Sunday-to-Thursday week and the office seats. **And what did NOT
move is recorded**: `addDays` and `daysBetween` are written twice, in
`lib/tracker.ts` and `lib/portfolio.ts`, answering identically — the portfolio
copy is what `cascade` does its arithmetic with under ten falsifications, so
joining them is its own change.

### §13.9 · And the fixture's dates are relative to today, never typed

Which is the one lesson `checks/tracker.mjs` is currently four failures short
of: every date in that check was written against the day it was written, and
every one has since gone stale (§214.3's family). A plan whose rows are placed
either side of `todayIn()` stays true on whatever day it is run.

### §13.10 · Verified

`checks/portfolio-module.mjs` **80/0**, red **nine** ways — and two of those
nine went green when first written, both this file rather than the product
(§54.5): `stale-name` had no stored name to prefer, and `act-anywhere` was
asserted against the page rather than the read. `checks/portfolio.mjs` 121/0
still red ten ways; modules 112/0; insights 127/0; notes 170/0;
`generated-in-step` all clear; `built-in-step.py` all good; `tsc` clean but for
`lib/prisma.ts`'s pre-existing error. `checks/tracker.mjs` 224/4 reproduces
identically on a stashed baseline (§303).

## 14 · Built — Progress and Analytics, 2026-09-30

The third slice, and the last of the three project screens the drawings
settled: **Progress** (§9.10) — what is owed, and accepting it — and
**Analytics** (§9.12), the reading. Both read the plan §13 built, which is why
they came together: the same `planRows` + `rollUp`, asked once, three screens
mapping over it. **Five of the six screens now work.** What is still not built
is **writing** a plan, and the landing's own header says so (§54.5).

### §14.1 · Three screens, one read (§5.2, §9.8)

`serve()` reads the rolled-up rows ONCE for the whole request and hands the
same array to Plan, Progress and Analytics, so the three cannot disagree about
one project. Nothing on any of the three computes a figure: Progress's three
counts are `waitingSignOff`, `overdue` and `nobodyOn`, Analytics' bars are
`rollUp`'s own percentages, its headline is `overall`, its word beside each bar
is `howFar` and its per-commitment state is `msState` — every one in
`lib/portfolio.ts`, which `checks/portfolio.mjs` asks with no browser at all.
The check asserts **agreement with the rule** in every case and never a typed
number (§94.8).

### §14.2 · Accepting work is the one thing this slice writes

`signOff` and `reopen` are the module's only new writes, and both are
**two-step** (§6.2): a Lead marks work done, and somebody with the seat accepts
it. The gate is `mayComplete` / `mayReopen`, asked on the SERVER as well as
used to decide which control is drawn — a control the server would refuse is
never drawn (§61), and a press the page did not draw is still refused (§42),
both asserted.

Three fences on one write, each with its own assertion: the **project is in the
WHERE** (an activity id is a uuid somebody can type, so a row from another
project is nothing here), the row must **already be marked done** (accepting
something nobody has finished is not a step), and the date must be **real** —
not in the future, not before the work started — refused **by name** (§123)
through `endDateRefused`, the same sentence `stampDates` already used.

Reopening **clears the real end date and who accepted it** while the progress
figure stands, which is what keeps the on-time reading honest: a commitment
whose acceptance was undone must stop counting as met.

### §14.3 · The bound the drawing asks for cannot be enforced, and it is said

The Progress drawing's sign-off box says the accepted date may not be *before
the day the work was marked done*. **There is no such column**: the platform
stores when a row was marked `done` nowhere, so that bound cannot be checked.
What ships is the two bounds that CAN be — not in the future, not before the
real start — and the departure is recorded here and in the file's own header
rather than answered by quietly adding a column, because adding a date rule is
its own decision (rule 1b). Whether the marking day should be stored is
§14.9's first open item.

### §14.4 · A commitment is hit only if it was accepted on or before its day

§9.12's three corrections of the reference, all carried out and all asserted:

- **Marked done is not hit.** The reference counts a milestone somebody has
  ticked as delivered on time. Here it is `wait` — counted in NEITHER column —
  because nobody has accepted it. The check asserts that directly, over a
  commitment made to be in that state.
- **Late is late.** Accepted after its date is `late`, and the row says *how*
  late in days, so the headline cannot quietly absorb it.
- **Order is date order, never severity.** The reference sorts its milestone
  list by how bad each one is, which is triage and not a record; `commitments`
  sorts by date and the check asserts the page's order against it.

**The pair that reads like a contradiction is NAMED** — a commitment past its
date, marked done, waiting to be accepted, drawn as *Waiting* rather than
*Overdue* — on a hover, never as a grey paragraph under the heading (1b-ii).

### §14.5 · *On Track* is not a word a percentage may use (§344)

The reference labels a phase at 90% *On Track*. That is a claim about a
schedule, and a percentage cannot see one — so `howFar` answers **how far
along** (*Not started · Early · Under way · Nearly done · Done*) and `behind`
answers **is it late**, drawn as a separate red *Behind* chip. A part can read
67% and *Behind*, and both are true. Two breaks hold it: `on-track` puts the
reference's label back, and `far-words` gives the page a word table of its own.

### §14.6 · And a falsification that did not falsify (§54.5)

`far-words` first changed `howFar` itself — and the check compares the page's
words against `howFar`, so **both sides moved together and the run read 0
failures**, which is indistinguishable from a guard that works. The fault the
assertion exists to catch is a SECOND answer to *how far along* (§53.5), so the
break now lives in `analytics.ts` as a local word table, and the reason is
written into the shared reader beside it so nobody moves it back.

### §14.7 · Two faults found by looking at the rendered page (§311.1)

Neither by a check, and both now asserted:

- The **Behind** chip was jammed against the phase name — the shared `.behind`
  carries no left margin and the drawing has 7px.
- A **late row did not say what was blocking it**. The drawing appends
  *"— blocked by X"*, read off `dependsOn`; without it the row names a problem
  and not its cause (§123).

### §14.8 · Four faults in the check itself, three of them one shape

- **A `date` column comes back as a `Date`**, so
  `String(row.actual_end).slice(0,10)` is `"Sat Sep 28"` and never a day — it
  reported a correct write broken (§100.3).
- **Three values were read out of counted offsets** (`slice(11,-1)` and
  friends) and all three were wrong by one, so three correct pages read as
  broken with the detail printing `>100%` and `eadership interviews`. Read out
  of the **capture group** now, which cannot be miscounted.
- **One assertion could not fail**, ending in `|| true` (§113.8). What it is
  for — a commitment marked done counted in neither column — is asserted now,
  over rows made to be in that state.
- And **the tab assertion held a literal this slice moved** (§214.3): it said
  the two unbuilt tabs carry no link, and Progress and Analytics now do.
  REWRITTEN to the surviving rule — the built ones link and the unbuilt ones do
  not — derived from `BUILT_TABS`, never typed (§218). Its first rewrite then
  **reported a correct build broken**, testing `href=".../plan"` against the
  whole document where the plan page's own List/Timeline switch contains one;
  it is scoped to the `<nav class="tabs">` block, with the reason recorded.

### §14.9 · Recorded, not done

- **The day work was marked done is not stored**, so §14.3's third bound cannot
  be enforced. Storing it is a schema change and a decision of its own.
- **The checkpoint line reports the cadence and never whether a checkpoint
  happened** — nothing records a checkpoint, so the line says when the next one
  falls due and no more (§124: a status may not claim more than it can see).
- **Analytics has no history**: every figure is today's. A trend needs
  something stored per checkpoint, which is the item above.
- **Writing a plan** is the next slice, and with it the sixth screen.

### §14.10 · Proved

`checks/portfolio-module.mjs` **119 passed, 0 failed**, with §9 (Progress) and
§10 (Analytics) added — and red under **all fourteen** breaks, the five new
ones being `anyone-signs` (8 red), `gold-on-done` (1), `done-is-hit` (3),
`on-track` (2) and `far-words` (1). `checks/portfolio.mjs` 121/0, `modules`
112/0, `insights` 127/0, `notes` 170/0, `generated-in-step` all clear,
`built-in-step.py` all good. `tsc` clean but for `lib/prisma.ts`'s pre-existing
error. **The frozen product is untouched and measured**, so `sw.js` is not
bumped (§91's trigger is the built file's bytes changing, and they did not).

Both pages swept at 1600/1440/1280/1100/1000/820/700 in both palettes: **0
overflow, 0 sideways scroll, 0 contrast failures** — and the probe was proved
able to fail first, by breaking a colour and a width and watching it report
them (§54.5).

---

## 15 · Drawn, not built — writing a plan, 2026-09-30

**Mockup:** `design-mockups/portfolio/2026-09-30_plan-writing.html`, published
as an artifact. **SIGNED OFF AND BUILT &mdash; see &sect;16**, which records what
shipped and where it differs from this. This section is left exactly as it was
written before any of it was in code (Principle II), because what was proposed
and why is the argument the sign-off was given on.

**&sect;12&ndash;&sect;14 built five of the six screens and every one of them
READS.** The sixth is not a screen at all in the way the other five are: it is
the WRITING half of two screens that already exist &mdash; the plan's tree and
an activity's panel &mdash; plus the two dialogs that writing needs. So the
drawing is of the Plan tab in a state nobody has seen.

### 15.1 &middot; The one decision everything else follows from

**There is no Planning Mode, and &sect;7.3 settled that on the audit.** Their
version holds every added, changed and deleted row in the browser behind a
banner and a *Save All*; this platform deleted exactly that shape once and
wrote down why (&sect;273.4): *a field writes when the cursor leaves it and the
autosave carries it*, so there is no Save and no Cancel anywhere in the
product, and a draft is what forces both plus a guard on closing the tab.

**So writing a plan is a pen** &mdash; `penBtn()`'s own two words, Edit and Done
editing, on the bar where the signed-off drawing put a bare *Edit* and said
nothing about what it opens. It is `.btn` and not `.pen`, because &sect;268
settled that a pen takes the shape of the line it sits on and this line is a row
of `.btn`s; lit it is `.btn.on`, which is what a pressed pen already looks like.
**The cost is stated rather than discovered**: restructuring a plan is visible
to anybody looking at it while it happens, where Planning Mode let you finish
first &mdash; and building a two-hundred-row plan without a request per
keystroke is what the workbook is for (&sect;9.3).

### 15.2 &middot; The row gains a strip, and the fields stay on the panel

**Three buttons on the right of each row in edit mode** &mdash; move up, move
down, remove &mdash; **and the fields are not edited in the row.** They are
edited on the panel, where all of them already are, so there is one answer to
*where is an activity changed* rather than two (&sect;53.5). It also avoids a
fault this product has already paid for: &sect;267 measured what happens when
controls go into a table's prose columns &mdash; five of seven columns stop
shrinking and the name pays for the window.

**The strip is a seventh COLUMN, and it folds under the name below 900px**,
because at 700 it takes the row to 694px in a 662px box and &sect;158's rule
is
*fit, never and it scrolls*. The read table already sits at its own edge there,
leaving 58px for the name, so the strip cannot be afforded a column of its own.

**An arrow that can do nothing is not drawn** &mdash; no move-up on the first
row of its container, no move-down on the last &mdash; with its space kept, so
the &times; does not move between rows (&sect;94.15, &sect;302's family).

### 15.3 &middot; Adding is a name and Enter, at the foot of the container

One add row at the foot of every container, and **the kind is decided by WHERE
you are typing** rather than by a picker somewhere else: a work package holds
activities and says so, the tree holds phases and says so, and **a phase may
hold either, so it offers both** as two small keys and pressing one puts the
cursor in the box. That is the Internal Tracker's idiom (&sect;356), chosen
there for the same reason: *we are shifting from a simple google sheet, so it
needs to be super simple.* Get the skeleton down, then open a row and fill it
in.

**A *+ add beneath* on the row strip was drawn and then removed**: on a phase it
cannot say whether it means a work package or an activity, and the add rows
already say it unambiguously &mdash; two ways to do one thing, one of them
vague (&sect;32). What it cost is the ability to insert in the middle; a row is
appended and moved up instead.

### 15.4 &middot; What edit mode deliberately does NOT offer

- **Status is not a field.** It is worked out: a real start date is stamped the
  first time progress leaves nought, a real end date at sign-off (&sect;3 №2).
  The way to change a status is to report against the row or to accept it on
  Progress &mdash; never to pick it from a list.
- **Nor is the per-cent, where there is a breakdown.** `manualProgressRefused`
  turns a typed figure away with the reason, and &sect;61 says do not draw a
  control the server refuses &mdash; so the box is simply not there and the
  line says why. *Which means that refusal is unreachable from the screen and
  reachable from the api and the workbook, and saying so is the point.*
- **Reordering is by arrows, never by dragging.** &sect;101 put that choice to
  Islam once already for Strategy's cards and he took the arrows; this stack
  has no `arrange.js` to inherit either.

### 15.5 &middot; Moving a date shows you first, and it is a ticking list

Rule 4 in &sect;3 is *moving a date moves what depends on it, and shows you
first*, and `cascade()` already returns the preview. **The dialog lists every
row that would shift, each ticked, and you untick what stays** &mdash; rather
than a pair of buttons saying *move them* against *leave them*.

**Both answers are real**, which is the argument: sometimes the work downstream
was going to slip anyway, sometimes it has a date of its own that nothing may
touch, and a plan with six things downstream is usually a mix. A ticking list
expresses any answer with one control, and ticking lists are the platform's own
everywhere else. **Nothing is written until the press**, including the date
being moved.

### 15.6 &middot; Removing a row is refused where it holds work

**A phase that still holds activities cannot be removed, and the refusal
names what is in the way** &mdash; the same answer settled one screen over
for taking somebody off a project (&sect;6.4, Islam: *refusal is better*), and
&sect;62's shape. The press stays live either way, because a control that is
simply missing tells nobody why.

**There is no undo and no archive, and that is a question rather than a
decision** (&sect;15.9). Strategy archives a plan before an upload replaces it
because an upload replaces the whole thing; here a row goes one at a time and
deliberately, so the guard is the refusal and the confirmation. If that is the
wrong call it is a table and a restore screen.

### 15.7 &middot; Two audiences share the panel and see different halves

- **A Lead or a seat** (`mayBuildPlan`) writes every fact on the row.
- **The person it is assigned to** (`mayReport`) gets the breakdown's status
  pickers and *Mark it done*, and **nothing else** &mdash; the platform's own
  rule in its own words, *see the plan, write your own rows* (&sect;7.4A).
  **The step's NAME and its WEIGHT are the plan's, not the report's**, so they
  read as text for them; the first draft made all three boxes and quietly let
  somebody reporting their own work re-weight it.
- **A Viewer** sees the read panel and no control at all. Everybody lands at
  Viewer, so read-only is what the default quietly grants, which is the only
  default that fails closed (&sect;7.4B).

**Marking it done is the first of the two steps** (&sect;3 №1): the button says
so and the sentence beside it says a Lead accepts it and sets the day the work
actually ended, which is the half Progress already draws.

### 15.8 &middot; Eight faults found by rendering it, and none by reading it

The drawing was swept at seven widths in both palettes, in both states, for
overflow, sideways scroll, contrast and console errors &mdash; and **the sweep
was proved able to fail first**, 44 reds from one broken colour and one broken
breakpoint (&sect;54.5). It is clean now. What it found on the way, and
&sect;311.1 is the rule each of these earns again:

1. the edit strip overrunning its box at 700px (&sect;15.2's fold);
2. a tick invented in front of *Done editing* that the platform's own pen has
   never worn (&sect;25);
3. *+ work package* breaking across two lines in a 78px key column;
4. the ambiguous *+ add beneath* (&sect;15.3);
5. a move-up arrow on a row that cannot move up (&sect;94.15);
6. **FIVE CLASS COLLISIONS with the page's own namespace** (&sect;65.9)
   &mdash; see below;
7. **`hidden` on a box with its own `display` hides nothing** (&sect;298.2,
   &sect;356.8, the third time in this repository): `.two` and `.tick` are
   flex, so the contributor state drew the date buttons AND the read-only
   dates at once, which is exactly what a permission gate doing nothing looks
   like;
8. the breakdown's name and weight editable by whoever was reporting.

**THE COLLISIONS ARE THE ONE WORTH KEEPING.** `.dlg` on this page means the
OVERLAY, and the drawing used it for the CARD &mdash; so the card inherited
`position:fixed; inset:0` and measured 520&times;756 at the top-left corner with
its navy header off screen. Pulling that thread found `.fld`, `.pen`, `.n` and
`.cell` too, **every one a second answer to something the page already
answers** (&sect;53.5): this page has a dialog already, `.dlg > .card > h2 + p +
.cbtns > .ghost + .start`, which is what *Start a project* opens. The drawing
uses it and re-declares none of them. *A mockup drawn on a real page's
stylesheet inherits its whole namespace*, so every class it introduces is now
checked against that namespace rather than guessed at.

### 15.9 &middot; What is asked, and it is four things

1. **Where does *who is on a project* hang?** That screen is drawn and signed
   off (&sect;6.4) and the tab row was agreed as four. **A fifth tab** &mdash;
   *Team*, after Analytics &mdash; or **a line on the charter**, which already
   names the four accountable people. The recommendation is the fifth tab:
   naming people is done while the plan is in front of you, and the charter is
   agreed once where the team changes through the work.
2. **Can a Lead name people?** &sect;6.4a answered it the narrow way until
   Islam says otherwise, and this is the round to widen it or leave it.
3. **Is a removed row worth keeping?** &sect;15.6 says no archive; one sentence
   either way settles it.
4. **Does the plan need an undo?** Nothing else in the platform has one. A
   mistyped name is retyped cheaply; a removed row with a breakdown on it is
   not.

### 15.10 &middot; And two things were corrected in the code while drawing this

Neither is visual and neither needs a sign-off. `modules/portfolio/page.ts`
carried a comment above `TABS` reading *two of the four are not built and the
row says so* &mdash; true until &sect;378 built Progress and Analytics, and
describing an intention the code beneath it had stopped carrying out
(&sect;104.8). `modules/portfolio/plan.ts`'s header named the same two as *not
yet* in its what-is-not-built list. **A stale comment renders perfectly and
nothing can go red on it**, which is why both are corrected in the same commit
as the drawing rather than left for the slice that builds from it.

## 16 · Built — writing a plan, 2026-10-01

**Islam, of the drawing &sect;15 published:** *"No I mean the plan in the
porfiltio I wan to start planning I mean."* That is the sign-off, and the
sixth screen is built. **&sect;15 is the record of what was proposed and is
left exactly as it was written** (Principle II); this section is what shipped,
and where the two differ it says so.

**Of &sect;15.9's four open questions, two are about the TEAM screen and are
still open; two the drawing already answered with a default and that default
is what shipped** &mdash; no archive on a removed row (&sect;15.6), and no undo
(nothing else in the platform has one). Both are said in the dialog that does
the removing, so nobody meets either as a surprise.

### 16.1 &middot; The pen is an address, and it carries the gate

`?edit=1`, which is this page's own idiom (the view switch is two links
already). **It means every control in edit mode is in the document only for
somebody the rules allow** (&sect;61), **and the api judges every press against
the stored row whether or not the page drew a control for it** (&sect;42):
`checks/portfolio-module.mjs` presses `add`, `field` and `remove` as a
Contributor with no page in front of it and each is refused by name.

**AND `edit` CARRIES THE GATE RATHER THAN ASKING IT AGAIN SEVEN TIMES.** The
first build wrote `a.edit && a.build` at seven controls, and the falsification
that removes the ADDRESS gate (`pen-for-all`) went **green** over the other six
&mdash; &sect;54.5's own fault, found by falsifying rather than by reading
(&sect;53.5: one question, seven answers, and the harmless one was the one
broken). `edit` is now true only for somebody `mayBuildPlan` allows, enforced at
the two places that build the page's arguments and nowhere below; `build`
survives for the two things that are a different question &mdash; whether the
Edit button is drawn at all, and what an empty plan says to somebody who could
fill it. With that, the break reddens exactly its own three assertions.

### 16.2 &middot; Every write answers with the plan drawn again

The tracker's own answer (&sect;356.12): the api re-reads, re-rolls-up and
returns `planBody` rendered, and the script swaps it in. **So the browser holds
no copy of the tree** and cannot disagree with the server about the numbering,
which arrow a row may use, or where an add row goes. One request at a time;
what a hand is typing survives the swap.

### 16.3 &middot; One product fault, and it was the one statement that writes

`moveDate` shifts a dependent row with `planned_start + $2`, and **a bound
parameter arrives untyped, so `date + unknown` is ambiguous between
`date + integer` and `date + interval`** &mdash; Postgres refused it outright
with *operator is not unique*. So **moving a date was refused on every real
press**, while the PREVIEW beside it and the *was this row shown* refusal
(&sect;42) were both perfectly green: the two paths that read were right and
the one that writes could never run. Cast to `::int`. Found by the check, and
only because the check reads the row back from Postgres rather than the
screen (&sect;96) &mdash; the api answered 400 with the DATABASE's own words,
which is also &sect;316.2 pointing at us.

### 16.4 &middot; What the drawing does not cover, answered three ways

1. **Marking done turns both ways.** The drawing shows only the pressing; a
   mark that cannot be taken off is a one-way door, and the person who pressed
   it by mistake would have to find a Lead to undo a thing that was never sent
   anywhere (&sect;61). Un-marking leaves the FIGURE where it is, because *this
   is not finished* is not *this work was not done* &mdash; and once a Lead has
   ACCEPTED it, un-marking is refused and named, since reopening is theirs
   (&sect;6.5).
2. **A phase and a work package are renamed on the row, by double-click** &mdash;
   the tracker's own idiom (&sect;356.11). Neither has a panel, so without it a
   name set once at the add row could never be corrected (&sect;61).
3. **A row's own WEIGHT has a box on the panel and a phase's has none**, which
   is stated rather than drawn: giving a phase row a weight box is a visual
   decision nobody has signed off, and the rule and the api accept one already
   (`ROW_FIELDS.phase` carries it), so the day a control is drawn for it
   nothing else has to move.

### 16.5 &middot; How it is proved

`checks/portfolio.mjs` **135/0**, red **twelve** ways &mdash; its new &sect;8c
asks the eight pure writing rules with **no browser and no database**, which is
&sect;8 of this spec in its own words, and `move-across` reddens the sibling
walk that was wrong in the first build (it counted `kidsOf`, which answers one
level down, so a phase holding a work package reported that package's first
activity as its next sibling).

`checks/portfolio-module.mjs` **184/0**, red **twenty-four** ways, every new
break reddening its own assertions: `pen-for-all`, `append-anywhere`,
`no-renumber`, `move-across`, `take-untrusted`, `weight-nought`,
`report-writes-plan`, `mark-signs-off`, `one-way-done`, `remove-anything`.
**Both ends everywhere** (&sect;94.2) &mdash; the pen for a seat and for a Lead
AND the read page for a Contributor and a Viewer; a refusal AND the write that
must still land; a step's status reportable by whoever the row names AND its
weight refused to them (&sect;15.7).

**Three of the breaks taught the file something before they worked.**
`append-anywhere` written as a bare `0` left a SELECT with no rows to read on
an empty container, so the INSERT returned nothing and the falsification broke
the STATEMENT rather than reproducing the defect (&sect;375: one proves the
check runs, the other proves it is about something) &mdash; it prepends with an
aggregate now. And `no-renumber` and `remove-anything` **died rather than
reporting** (&sect;215), because a break that changes the order or deletes a row
leaves a fixture read empty and `.find(…).name` throws: every row read, every
single-row read and the steps list degrade now.

### 16.6 &middot; Two faults in my own harness, both old rules

**My runner read `tail -1` and reported `135 passed, 0 failed` for a run that
was `111 passed, 22 failed`** &mdash; the last line was a continuation of the
FAILED list, not the verdict (&sect;298.3: *the tail is the verdict, never the
count*, and here the tail was neither). What it hid is worse than the number:
`smp_app` could not authenticate, so &sect;9 and &sect;10 &mdash; every
constraint and every RLS policy &mdash; were dying one by one and the suite was
reporting clean. *A check that cannot connect reports no failures* (&sect;54.5),
and the verdict line is matched by its own shape now.

**And a run that dies before its `finally` leaves its world behind**
(&sect;379.15 by a third road): today's syntax-error runs never reached the
drops, so sixteen tenant pairs stayed and `checks/memory-page.mjs` went **2
red** naming a client it never created &mdash; the console's Memory page opens
on the FIRST client BY NAME and `RHI` sorts before `Raya Trade`. Both portfolio
checks now sweep anything of their own older than an hour before they start, so
a crash cleans up after itself on the next run and a concurrent run is
untouched.

### 16.7 &middot; Recorded, not done

- **The team screen is still &sect;15.9 №1 and №2**, and both are Islam's: where
  *who is on a project* hangs, and whether a Lead may name people.
- **A phase's weight has no control**, &sect;16.4 №3.
- **Nothing says who else is looking at the plan while it is being
  restructured**, which is the stated cost of having no Planning Mode
  (&sect;15.1) and is the same gap the tracker has.
- **A two-hundred-row plan is built from the workbook and not here**
  (&sect;9.3): this is for writing one and correcting it, and that is what the
  pen's one-request-per-field shape is sized for.

### 16.8 &middot; The press itself, and two faults 184 assertions could not see

**Islam, on the built page, naming his first phase:** the screenshot reads
**"Which project?"** under an empty plan. Two faults, and the shape they share
is the whole of this section.

**ONE &mdash; THE BROWSER'S REQUEST NAMED NO PROJECT, ON ALL FIFTEEN ACTS.**
The api asks for the project by name and refuses without it, correctly; the
script's `post()` sent the act and the view and never the id. **So every press
in edit mode was refused and the whole screen was dead**, while the api, the
rules and **184 assertions were all right** &mdash; because every one of those
assertions builds its own request body, so not one had ever driven the request
the BROWSER makes. &sect;96 at its clearest: *a pen wired to nothing renders
perfectly.* The project rides on the body now and `post()` sets it **once**,
rather than fifteen call sites each remembering (&sect;104.7).

**TWO &mdash; AN EMPTY CONTAINER OFFERED NO WAY TO PUT THE FIRST THING IN IT.**
The add row is emitted where a container ENDS, read off the next row, and both
tests were written as *the last row BELOW it* &mdash; so they fire only on a
CHILD, and a phase just named, or a work package just named, had nothing under
it to type into. The only route on was to name a second phase (&sect;61's trap,
on the press that follows the one Islam made). **A container with nothing in it
ends at its own row**, which is one line and the same rule said properly.

**AND NEITHER COULD HAVE BEEN FOUND WITHOUT PRESSING IT.** &sect;12 of
`checks/portfolio-module.mjs` serves the module over a real port &mdash; the
same `serve()` the route calls, bridged from Node's request to a fetch Request
&mdash; and Chromium presses the controls while the rows are read back **from
Postgres and never off the screen** (&sect;70, &sect;96), which is the Internal
Tracker's own &sect;10 (&sect;356). It asserts the press Islam made, that
**nothing is said on the page because nothing was refused**, that the page did
**not reload** (a mark planted before the first press and read after the last,
&sect;356.12, &sect;113.8), the kind key that decides what the next Enter makes,
an arrow reordering the stored plan, a refusal arriving **in the server's own
words on the page**, and no page error anywhere in it.

**Two of its own first failures were the CHECK**: it looked for
`.addr[data-kind="activity"]`, which is a work package's add row and not the
key a phase offers; and it read `.dlg` unscoped, so it got the SHIFT dialog's
*Leave everything* and reported a correct refusal broken (&sect;100.3,
&sect;50.6).

**197/0, red twenty-six ways**, with `no-project` printing Islam's screenshot
back verbatim &mdash; *Which project?* &mdash; and `no-empty-add` reddening
exactly the three assertions about typing into something new.
