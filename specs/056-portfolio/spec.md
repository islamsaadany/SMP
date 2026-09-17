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
| 3 | Whose module is it? | **Both.** The office reaches it by seat; the client's own people through a grant. One module, two audiences — never one module behaving two ways (§6). |
| 5 | Who starts a project? | **Forefront, by seat.** Consultants scope the work and then name the client's people onto it. *Cost:* a client wanting to run their own workstream has to ask. |
| 4 | What is it called? | **Portfolio**, keeping his own earlier call (spec 046 decision 3). `Projects` was asked for and put back with the measurement: Strategy already has a **Projects** tab on a supporting function, a **Project owner** role on Roles & access, and a **Projects sheet** whose name is a validation range inside workbooks clients already hold — 98 occurrences of the word in the built product. Renaming Strategy's was offered with that cost and refused, as it was the first time. |

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
| 2 | Its own roles and areas | **One area, and a ladder that is not on the table.** The area answers *may this role open Portfolio on this client at all*. Everything about a single project is membership on that project (§6). |
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
| `portfolio_members` | **New, and §6.2's whole answer.** A row per (project, person, level): who is on this project and at what level. Replaces `client_team_members` and `scope_lead_assignments` together. |

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

**Two questions, answered in two places — and collapsing them was the first
drawing's mistake.** Islam, 2026-09-17, of a mockup that put Strategy's company
roles down the side of a Portfolio tab: *"the visibility here is subject to the
role in the project not the normal company role the general roles of the
strategy are not really fitting here."* He is right. A function head is not a
project lead; being a BU owner says nothing about whether somebody is on a piece
of delivery work. **Membership belongs to the project**, which is what the
reference already does.

### 6.1 · Layer one — the company question

One area on the client's access tab, and it answers only *may this kind of
person open Portfolio on this client at all.* `view` / `none`, plus `lead`,
which is the client-wide level below. Nothing on it is about a single project.

Above it, and not on it: **Forefront reaches every client by seat**, the way the
Internal Tracker and Meeting Notes already work, and **Forefront starts a
project** (decision 5).

### 6.2 · Layer two — membership on one project

A row per (project, person, level). Four levels, and the reach of each is the
reference's own:

| Level | Reaches |
|---|---|
| **Lead** | The whole plan. Restructures it, and signs off completions. |
| **Senior contributor** | Sees the whole plan; reports only activities assigned to them. |
| **Contributor** | Sees and reports only their own activities. |
| **Collaborator** | Sees activities they are tagged on; comments rather than reports. |

### 6.3 · The six levels, and where each is answered

**Nothing is invented and nothing is dropped.** Two are about a whole client,
four about one project; two are renamed, and only because decision 2 removed the
word *scope* and because *client lead* already means the client's own SMO here.

| ScopePlan today | Here |
|---|---|
| Client Lead | **Portfolio lead** — client level, the access tab |
| Viewer | **Viewer** — client level, the access tab |
| Scope Lead | **Lead** — project level |
| Senior Contributor | **Senior contributor** — project level |
| Contributor | **Contributor** — project level |
| Collaborator | **Collaborator** — project level |

### 6.4 · True whatever anybody is set to

Three rules, following the shape §89 gave its own three — sentences that hold
however the table reads:

- **Only a Lead completes an activity.** Whoever does the work marks it Done;
  marking it Completed, and setting the real end date, is the Lead's. Everything
  at Done queues for them.
- **An assignee reports, a collaborator comments.** Read off the activity,
  never from the membership table.
- **A Lead is named on the project, never granted elsewhere** — the shape a
  pillar's owner already has (§33: responsibility for a thing is a property of
  the thing).

And the two that hold everywhere in this product: **the rule lives on the server
and the screen asks the same function** (§42), and **Portfolio may not read or
write another module's rows**, the client registry, or another tab of the
matrix.

**The cost, stated:** somebody on four projects is named four times. That is
what membership belonging to the work costs, and what it buys is that their
reach on one project says nothing about another, and taking them off one is a
row rather than a change to what their company role means.

**Mockup:** `design-mockups/portfolio/2026-09-17_project-team.html`, published
and awaiting sign-off. It **replaces** `2026-09-17_roles-access-tab.html`, kept
as the record of the rejected approach (Principle II).

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
| The six-role visibility matrix | **Taken whole** — all six levels kept, split between a client-wide area and per-project membership (§6). Its *shape* — composable filter fragments rather than scattered conditions — is what makes it port at all. Two renamed |
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

### 9.2 · The role ladder — answered in §6, with two ends left
Settled 2026-09-17: the six levels are kept and split across a client-wide area
and per-project membership. What is still open is smaller and both ends are
Islam's: **may the client's own Super user name people onto a project**, or only
Forefront; and **where a module declares a role at all** — `MODULE_DEF` holds
areas and has nowhere for *Portfolio lead*, while the client's role list is the
frozen `lib/rules.js`, where a Portfolio word does not belong (§335).

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
