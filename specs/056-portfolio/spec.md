# 056 · Portfolio — the delivery plan, per client

**Status:** **not built. Nothing is drawn and no source has moved.** This is the
spec spec 046 §8 said Portfolio needed — *"Breakdowns, timelines and
dependencies are named and not specified. Portfolio needs its own spec."* — and
what it specifies is the shape, not the screens. **No mockup exists yet**, so
rule 1c is not yet paid: nothing visual may be built from this page until each
screen is drawn and signed off.

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
| 1 | Its own navigation | A project is picked first; then **Plan** (the tree, the Gantt, the dependencies) · **Progress** (the sign-off queue and what is owed) · **Analytics** (overview and schedule, filtered by phase, group, assignee, status). An activity opens a panel rather than a page. |
| 2 | Its own roles and areas | **Three roles, no areas at all.** There is no Portfolio column on Roles &amp; access. The roles belong to a project, not to the module (§6) — which is the contract's *own roles* answered honestly rather than by borrowing a grid. |
| 3 | Its own Setup group | **Yes**, and small: the three words (§9.1), and who leads which project. Nothing else. |
| 4 | Its own rhythm | **Checkpoints**, weekly or monthly, per project — **not** the reporting cycle. Strategy's cycle does not reach it and must not. |
| 5 | A landing | The project list for this client, with each project's state. A client with one project lands in it. |

What the spine gives for nothing: the address `/<client>/portfolio/…`, the
switcher entry, the row on the client's card, the on/off drawer, the door,
`withTenant`, branding, and the register through `lib/place.ts`.

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
| `portfolio_projects` | **New, and the whole of decision 2.** The plan's parent: name, description, state, dates, who leads it. Replaces `(client_assignments, scopes)`. |
| `portfolio_phase_groups` | Optional grouping above phases, colour-coded |
| `portfolio_phases` | Phase, numbered, status |
| `portfolio_work_packages` | **Renamed on the way in.** ClientPlus calls the table `scope_milestones` and the column `milestone_id` — stale since the concept was renamed in Dec 2025. Fixed now or never (the brief's own words), and doubly so here, where `milestones` means a Strategy milestone one module away. |
| `portfolio_activities` | The working unit. Name, description, deliverables and their type, duration, planned and actual start/end, one dependency, assignee, status, progress, and the three flags — is it a milestone, is it billable, does it trigger an invoice |
| `portfolio_sub_activities` | Weighted breakdown driving progress |
| `portfolio_collaborators` | Supporting people on an activity |
| `portfolio_comments` | The discussion on an activity |
| `portfolio_comment_mentions` | @mentions |
| `portfolio_comment_reactions` | Emoji reactions |
| `portfolio_files` | **A link, not an upload** — see §9.4 |
| `portfolio_history` | Field-level audit with a source tag (`auto:status_done`, `manual:lead_adjustment`) |
| `portfolio_terminology` | The three words, per client — see §9.1 |
| `portfolio_members` | **New, and §6's whole answer.** A row per (project, person, role): who is on this project and at what. Three roles, defaulting to Viewer. Replaces `client_team_members` and `scope_lead_assignments` together. |

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
| **Contributor** | Sees the plan; reports the activities assigned to them; comments on the ones they are tagged on. |
| **Viewer** | Reads, changes nothing. **Where everybody starts.** |

**Whether a Contributor reports or only comments is read off the ACTIVITY**,
never from this table — assigned is one thing, tagged is another, and the
reference already stores both.

**A client-side Lead is the unusual case and is not a gap** (Islam: *"not
usual but ok to have the role ready for the future"*). Most projects will have
nobody in the list at Lead, because whoever leads it usually holds a seat
rather than a place in the list, and
completions queue there. The screen states it and does not nag (§45.2 with the
sign reversed: this is a fact about a healthy project, not something owed).

### 6.3 · The six become three, and nothing is lost

Only two things ever varied across the reference's six — how much of the plan
you see, and what you may do to it. Six names for four answers.

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
published, awaiting sign-off. It supersedes `2026-09-17_project-team.html`
(the two-layer version) and `2026-09-17_roles-access-tab.html` (the company
matrix), **both kept as the record of what was tried and turned down**
(Principle II).

---

## 7 · What is taken from the reference and what is left

| Theirs | Here |
|---|---|
| The five-level tree | Taken, under a project rather than a triple (decision 2) |
| Two-step Done → Completed with a validated end date | **Taken whole.** The single most valuable rule in it |
| Actual dates derived at one chokepoint | **Taken whole**, chokepoint included |
| Progress computed from weighted sub-activities; manual entry refused | Taken, refusal wording included |
| Cascade preview before commit | Taken |
| Auto-renumbering, including the 1.2.3 → 1.2 collapse | Taken |
| Planning Mode with draft recovery | **Taken.** Flagged by the brief as the other thing a fresh build would miss |
| Per-agreement terminology | Taken as per-**client** — §9.1 |
| `client_team_members`, `scope_lead_assignments` | Taken as ONE table, `portfolio_members` — two rows saying one thing (§6.2) |
| Excel round-trip with a GPT instructions sheet | **Open** — §9.3 |
| The six-role visibility matrix | **Three roles, on the project** (§6.3) — the six collapse with nothing lost, because only two things ever varied across them. Its *shape* — composable filter fragments rather than scattered conditions — is what makes it port at all |
| Assignees who are not users | Taken; SMP's register already behaves this way |
| `client_assignments`, `scopes`, `agreement_scopes`, domains, subdomains | **Left.** Decision 2 |
| `in_app_notifications` | **Left as a table** — §9.5 |
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

Each of these changes what gets built. None is decided here.

### 9.1 · Where the three words live
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
**Recommendation: per client, in `portfolio_terminology`.** The words are how a
client talks, and one client calling a Phase two things in two projects is the
confusion the feature removes. *Cost:* a faithful port would be per project.

### 9.2 · The role ladder — answered (§6)
Settled 2026-09-17: three roles, on the project, with no module-level column at
all. **And that closes the question of where a module declares a role**: these
are not client roles, so they never touch the frozen `lib/rules.js`, and
`MODULE_DEF` needs no roles field. What was a gap in the module contract turns
out to be a question Portfolio does not ask.

**And the last line of it is answered too** (2026-09-17): the client's Super
user can do anything — naming people onto a project, and starting one. Nothing
is left open in §6.

### 9.3 · The Excel round-trip
A template pre-filled with the client's context, the team roster, valid values
and a sheet of instructions for an AI to write the plan against, uploaded back
with row-level validation. It is the fastest way to author a large plan and
today it is behind a two-name allowlist. **Keep it, drop it, or keep it as the
office's?** Keeping it brings ExcelJS — which SMP already does elsewhere for
the Strategy workbook, so the dependency is not new.

### 9.4 · Files
`activity_files` stores a URL, not an upload. SMP has a blob store already (the
review clips). **Link-only for the first build, or real attachments?** Real
attachments are net-new work and a storage cost per client.

### 9.5 · Notifications
Mention, comment, assignment and status-change notices have no home: SMP has
push, the office chat and email, and no in-app notification list. The honest
options are to ride push, to ride the chat, or to build the spine a notification
list — **which is spine work, not this module's**, and should be specified
separately if it is wanted.

### 9.6 · What the agreement level held
Budget hours, budget amount, a lead consultant and contract dates. **Are any of
them worked against?** If yes they come back as fields on `portfolio_projects`;
if no they go. Decision 2 dropped the level, not necessarily the facts.

### 9.7 · The migration
Real plans exist. Moving them means: each `(agreement, scope)` pair becomes one
project; MySQL types become Postgres; every person becomes a register key on the
right client, and anybody not on that register is a decision rather than a
default. **How many plans, and on how many clients?**

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
- **This session has not read the reference code.** Every claim about ScopePlan
  here is the handover brief's, written by a session with that repository
  attached. Before building, this repository needs sight of it — a fork under
  `islamsaadany`, or the work done in a session started on it.
