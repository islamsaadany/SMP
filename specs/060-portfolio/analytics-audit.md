# ScopePlan Analytics — the fourth screen

Companion to `SCOPEPLAN-PORT-AUDIT.md`. Read against commit `bf9793c`, working
tree clean. Covers the four files the first audit counted but never opened.

**Caveats, stated once:**

- **The app cannot be run here.** No `DATABASE_URL`, no `.env`, no `mysql`/
  `mysqld` binary in the container. So there are **no screenshots and no real
  rendered values**. Where numbers appear below, they come from executing the
  endpoint's own formulas — copied verbatim — against synthetic input, and are
  labelled as such.
- The repository still contains **no ScopePlan rows of any kind** (established in
  the first audit, §H.1: the one production dump predates the feature and no seed
  creates phases or activities). So I cannot tell you what this page looks like
  for a real client.
- Everything else below is read from source with file and line numbers.

---

## A · What the analytics page reads that is not the plan tree

**Nothing. It is 100% plan tree, and it is the cleanest thing in the module.**

The endpoint makes exactly six database calls. Here they all are:

```
src/app/api/scopeplan/analytics/route.ts
 :70   db.phase.findMany      — phases belonging to selected groups (filter translation)
 :103  db.phase.findMany      — the phases themselves
 :120  db.phaseGroup.findMany — the groups
 :154  db.activity.findMany   — every activity under those phases
 :471  db.phase.findMany      — unfiltered phase list, for the filter dropdown
 :476  db.activity.findMany   — distinct assignees, for the filter dropdown
```

Three tables: `phases`, `phase_groups`, `activities`. That is the whole data
surface. Against your four categories:

| Category | What the page reads from it |
|---|---|
| **Plan tree alone** | **All of it.** Every figure on the page derives from activity `status`, `progress`, `plannedEndDate`, `actualEndDate`, `isMilestone`, `assignedToUsername`, plus phase `name`/`phaseNumber` and group `name`/`color`. |
| **Agreement or scope** | **Nothing is read.** No budget hours, no budget amount, no agreement dates, no lead consultant. `assignmentId` and `scopeId` appear only as optional `WHERE` narrowing (`:56-57`) — and see the finding below, the page never sends them. |
| **Time entries, utilisation, consultant costs, finance** | **Nothing.** No `hist_data`, no `consultant_deals`, no `client_revenues`, no `consultant_costs`, no `client_costs`. Not imported, not queried, not referenced anywhere in the 747 lines or the 2,037 lines of UI. |
| **Other clients** | **Nothing.** Every query is anchored on `clientId`. See §E for the two `WHERE` clauses that are not scope-anchored and why they are still client-safe. |

So the honest answer to the question you said mattered most is the good one:
**Analytics is a port, not a rewrite.** There are no hours on it and nothing to
drop. Two figures — `progressPercent` selected at `:110` and the word "weighted"
in one label — are noise, and both are covered in §B.

### A.1 The finding that makes this easier than expected

**The page already ignores the `(client, agreement, scope)` triple.** It fetches
client-wide and nothing else.

```tsx
// src/app/clients/[clientId]/scopeplan/analytics/page.tsx:166-176
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('clientId', clientId);
      if (phaseFilter.length) params.set('phaseId', phaseFilter.join(','));
      if (groupFilter.length) params.set('groupId', groupFilter.join(','));
      if (assignedToFilter.length) params.set('assignedTo', assignedToFilter.join(','));
      if (statusFilter.length) params.set('status', statusFilter.join(','));

      const res = await apiFetch(`/api/scopeplan/analytics?${params.toString()}`);
```

`assignmentId` and `scopeId` are **never set**. The endpoint accepts both
(`:26-31`) and applies them if present (`:56-57`), but no caller supplies them.
The route is `/clients/[clientId]/scopeplan/analytics` — no agreement or scope in
the path either.

Consequences worth knowing:

1. **Every other ScopePlan screen is per-`(client, agreement, scope)`; this one is
   per-client.** The plan page refuses to render without both selected
   (`scopeplan/page.tsx:315`, `const canCreate = selectedAssignment && selectedScope`).
   Analytics aggregates across *all* of a client's plans at once.
2. **It is therefore already at the grain your destination wants** — if a
   Portfolio project maps to what ClientPlus calls a client. If a project maps to
   a *plan* (one agreement+scope), then this page is currently a **cross-project
   roll-up** and porting it as a project tab silently narrows it.
3. Dropping the triple requires **no change to this file**. The two unused query
   parameters are deleted and everything else stands.

That is the one decision this section leaves you: the page's grain is client, not
plan, and it always has been.

---

## B · What is on the screen

**No chart library.** `grep -rn "recharts|chart.js|react-chartjs|Chart\b"` across
the analytics directory returns **nothing**. Every visual is hand-built: one
inline `<svg>` ring, and bars that are `<div>`s with a percentage width. Imports
are `lucide-react` icons and `date-fns` only (`page.tsx:4-14`). The palette is
Tailwind classes inline.

**Everything is computed on the server.** The page does no arithmetic on the data
it receives beyond two derived percentages noted below; it renders fields
straight out of the JSON.

### The shell

Heading **"Scope Plan Analytics"** with the client name beneath, and a back arrow
to the plan (`page.tsx:219-222`). Then a **Filters** card — four multi-selects,
**Group**, **Phase**, **Assigned To**, **Status**, each with Select All / Deselect
All and a Clear All link (`page.tsx:224-281`, component at `:845-948`). Filters
re-fetch the whole endpoint; nothing is filtered in the browser.

Then four tabs (`page.tsx:200-205`):

```tsx
  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'schedule', label: 'Schedule & Timeline', icon: Calendar },
    { key: 'pending', label: 'Pending', icon: CheckCircle2 },
    { key: 'groups', label: 'Groups', icon: Layers },
  ];
```

Default tab is `overview` (`:139`). While loading: a pulsing icon and *"Loading
analytics…"* (`:306-315`).

---

### Tab 1 — Overview

**§1. Project Health Score.** An SVG donut ring, 120px, `strokeDasharray="314"`,
green ≥70 / amber ≥40 / red below, with the number in the middle and the word
**Health** under it (`page.tsx:324-351`). Beside it four rows: *On-track
activities*, *Overdue ratio*, *Blocked items*, *Avg progress*.

**What it is, in a user's words:** one 0–100 number for "is this plan in trouble."

The arithmetic, server-side:

```ts
// src/app/api/scopeplan/analytics/route.ts:259-265
    // Health score (composite)
    const blockedPenalty = Math.min(statusCounts.BLOCKED * 5, 20);
    const overduePenalty = overdueActivities.length > 0
      ? Math.min(Math.round((overdueActivities.length / Math.max(totalActive, 1)) * 50), 30)
      : 0;
    const progressBonus = Math.round(avgProgress * 0.5);
    const healthScore = Math.max(0, Math.min(100, progressBonus + 50 - blockedPenalty - overduePenalty));
```

I ran that formula verbatim against synthetic activity sets. **Real output of the
real function, synthetic input — not a screenshot:**

```
score | avgProg | overdue | blocked | active | case
------+---------+---------+---------+--------+-----------------------------------
   50 |      0% |       0 |       0 |      0 | empty plan (0 activities)
   50 |      0% |       0 |       0 |     20 | brand-new plan: 20 TODO, none overdue
  100 |    100% |       0 |       0 |      0 | all 20 COMPLETED, nothing late
   88 |     75% |       0 |       0 |     10 | 10 done, 10 in progress @50%
   20 |      0% |      20 |       0 |     20 | every active activity overdue
    0 |      0% |      30 |      10 |     30 | 20 overdue + 10 blocked
   93 |     95% |       0 |       1 |      1 | one blocked activity, all else fine
   70 |     80% |       0 |       4 |      4 | 4 blocked, all else complete
```

Three properties fall out of that which are worth deciding on before porting:

- **A plan that has not started scores 50, the same as an empty one.** The base is
  50 and an untouched plan earns and loses nothing.
- **The floor is 20 unless something is BLOCKED.** Max penalties are 20 + 30 = 50
  against a base of 50 plus a progress bonus. A totally overdue plan with no
  blocked items still reads 20.
- **`blockedPenalty` is absolute, not proportional.** Four blocked activities cost
  the full 20 points whether the plan has 4 activities or 400 — unlike
  `overduePenalty`, which is a ratio. On a large plan four blocked items is noise;
  the score treats it as a fifth of the plan's health.

**Inconsistency:** a plan with *no phases* short-circuits to `emptyOverview()`
which hardcodes `healthScore: 0` (`:717`), while a plan with phases but no
activities computes to **50**. Same emptiness, two different numbers.

The three supporting figures beside the ring: *On-track %* is computed server-side
at `:250-257`; *Overdue ratio* is one of only two figures computed in the browser
— `Math.round((overdueCount / totalActivities) * 100)` inline at `page.tsx:352`;
*Avg progress* is `:242-247`, which counts DONE and COMPLETED as 100 regardless of
their stored `progress` and excludes CANCELLED.

**§2. Three KPI tiles** (`page.tsx:356-386`): **Total Activities** (with
*"Across N phases"*), **Overdue** (with *"avg N days late"* or *"All on track"*),
**Cancelled** (with *"N blocked · N on hold"* as its subtitle — a tile labelled
one thing showing two others underneath).

**§3. Activity Status Breakdown** (`page.tsx:386-419`). Seven horizontal bars, one
per status, each `count (pct%)`. **Statuses with zero are filtered out**
(`.filter(s => (data.overview.statusCounts[s.key] || 0) > 0)`, `:400`) — so the
legend changes shape as a plan progresses, and an empty plan shows an empty card
with no message.

**§4. Groups & Phases** (`page.tsx:421-541`). The largest section. A list of
collapsible cards, one per group, coloured by a 4px left border. Each header
shows the group name, a *solo* pill for virtual groups, a line reading
`N phases · N activities · N done · N overdue`, and three metric pills:
**Progress**, **On-Time**, **Health** (the last as a coloured circle). Expanding
reveals a progress bar per phase with `doneCount/totalActivities activities done`
and a status pill — **On Track** (≥90%), **In Progress**, **Early Stage**, **Not
Started** (`route.ts:287-290`).

Empty state: *"No phases found"* (`:431`); an empty group renders and says *"No
phases in this group"* (`:503`).

The footer line reads:

```tsx
// src/app/clients/[clientId]/scopeplan/analytics/page.tsx:536-538
                  <div className="mt-4 pt-3 border-t text-xs text-gray-400">
                    Weighted avg progress: <b ...>{data.overview.avgProgress}%</b> across <b ...>{data.overview.phaseProgress.length} phases</b>
```

**It says "Weighted" and it is not weighted.** `avgProgress` (`route.ts:242-247`)
is a plain arithmetic mean over activities. A phase with one activity counts the
same per-activity as a phase with fifty. Nothing in the module weights by
duration, effort or anything else.

---

### Tab 2 — Schedule & Timeline

**§1. Seven tiles** (`page.tsx:551-582`): To Do, In Progress, Done, Completed,
**On-Time Delivery** (`N%` with *"N of M"*), **Milestones Hit** (`N / M`), **Due
This Week** (with *"N in progress"*).

On-time delivery, server-side, and read the `else`:

```ts
// src/app/api/scopeplan/analytics/route.ts:361-373
    let onTimeCount = 0;
    for (const a of completedActivities) {
      if (!a.plannedEndDate) { onTimeCount++; continue; }
      const planned = new Date(a.plannedEndDate);
      if (a.actualEndDate) {
        if (new Date(a.actualEndDate) <= planned) onTimeCount++;
      } else {
        onTimeCount++; // No actual end date recorded — assume on time
      }
    }
```

**An activity with no recorded actual end date counts as on time.** That matters
more than it looks: the first audit established that `actualEndDate` is only ever
set on the transition to **COMPLETED**, and is **cleared** whenever a COMPLETED
activity is reopened. So every activity sitting at **DONE** awaiting a lead's
sign-off — precisely the queue the Pending tab exists to clear — is counted as
on time. **On-Time Delivery is biased upward by exactly the backlog the next tab
is about.**

**§2. Overdue Activities by Delay Severity** (`page.tsx:587-644`, component
`:770-843`). Three stacked cards — **1 – 5 days late** (yellow), **6 – 14 days
late** (red), **15+ days late** (dark red). Each shows a count, a bar of *"N% of
overdue"*, *"Avg delay: N days"*, and the first three activities with their
`displayId`, name and *"Nd late"*, expandable to all. Bucket boundaries at
`route.ts:404-413`. Clicking an activity deep-links back into the plan:

```tsx
// src/app/clients/[clientId]/scopeplan/analytics/page.tsx:787-790
  const handleActivityClick = (activity: DelayCategory['activities'][0]) => {
    const scopeParam = activity.scopeId ? `&scopeId=${activity.scopeId}` : '';
    router.push(`/clients/${clientId}/scopeplan?activityId=${activity.id}${scopeParam}`);
  };
```

That `scopeId` is the **one place the whole page touches the scope level** — and
only to rebuild a URL for a screen that requires it. It disappears with the
triple.

Empty state is the nicest on the page: a green tick and *"All activities are on
track!"* (`:593-597`).

**§3. Milestone Tracker** (`page.tsx:648-718`). A vertical timeline with connector
lines, one row per activity flagged `isMilestone`, each with an icon, the name, a
group colour dot, `groupName · phaseName · Due <date>` (or `Completed <date>`),
and a badge: **On Time** / **Nd Late** / **Overdue** / **Upcoming** / **Planned**.

Classification at `route.ts:314-330`: done + actual ≤ planned → `on_time`; done +
late → `late` with `delayDays`; not done + past due → `overdue`; not done + due
within **14 days** → `upcoming`; otherwise `planned`. Sorted overdue → upcoming →
on_time → late → planned (`:352-355`).

Two bugs in the row rendering, both confirmed:
- `Milestones Hit` counts `on_time` **plus** `late` (`route.ts:655`). A milestone
  delivered three weeks late counts as hit.
- The `upcoming` badge renders `delayDays` as a countdown — *"(in 5d)"* at
  `page.tsx:695` — but for an `upcoming` milestone the endpoint **never assigns
  `delayDays`**; it stays `0` (initialised `:315`, assigned only in the `late` and
  `overdue` branches). So every upcoming milestone reads **"(in today)"**.

Empty state: *"No milestones defined"*.

**§4. Upcoming Deadlines (Next 21 Days)** (`page.tsx:720-744`, component
`:949-985`). Three columns — **This Week**, **Next Week**, **Week After** —
bucketed at ≤7 / ≤14 / ≤21 days (`route.ts:435-437`). Each shows up to three
activities with `displayId`, name and a day label, then *"+ N more"*. Empty:
*"No deadlines"*.

---

### Tab 3 — Pending

Renders `<PendingCompletionsTab clientId={clientId} onChange={fetchAnalytics} />`
(`page.tsx:750`). See §D.

### Tab 4 — Groups

Renders `<GroupsBuilder … onChange={fetchAnalytics} />` (`page.tsx:754-758`). See
§C. Note this tab is a **management** screen, not analytics — it is the only place
in the product where phase groups are created and edited.

---

### Which sections are the point

**My reading, and I will say which is which.**

**From the code, not opinion:** *Overview* is the default tab (`:139`), and the
*Groups & Phases* section is the only one the endpoint builds a bespoke
aggregation for — `computePhaseMetricsForGroup` (`route.ts:497-563`) exists for
nothing else and is run once per group plus once per ungrouped phase. The
*Schedule* tab is the only one with uncapped payload (§E), which suggests whoever
wrote it expected the lists to be read in full. Those are the three that cost
someone real design effort.

**My reading, offered as such:** the page is three ideas and a lot of furniture.

1. **The overdue triage** (Delay Severity) — the only section that sorts work by
   urgency and lets you click through to fix it.
2. **Groups & Phases** — the only view of "which part of this plan is behind,"
   and the reason phase groups exist at all.
3. **Milestone Tracker** — the only place the client-visible commitments are
   listed together with whether they were met.

Furniture: the seven status tiles on the Schedule tab restate the Status
Breakdown from the Overview tab in a different shape; **Cancelled** as a
headline KPI is odd; and the Health Score is a single composite number whose
formula (see the table above) is arbitrary enough that I would not port it
without someone re-deciding the weights.

---

## C · Phase groups

**What grouping buys: it changes numbers, not just colour and order.**
`computePhaseMetricsForGroup` (`route.ts:497-563`) computes a **per-group**
`avgProgress`, `onTimePercent`, `overdueCount`, `completedCount`, `statusCounts`
and `healthScore` — figures that exist nowhere else in the product. The per-group
health score reuses the overall formula verbatim (`:544-551`).

Grouping also changes the page's *global* numbers when used as a filter: selecting
groups rewrites the phase `WHERE` before anything is counted (`:64-87`), so every
figure on every tab reflects only the selected groups.

**Every phase is in at most one group.** Enforced by a single nullable
`phases.group_id` column, and the route says so itself:

```ts
// src/app/api/scopeplan/phase-groups/[id]/members/route.ts:1-6
// Assigns phases to a group. Atomic: sets phase.groupId for each phaseId
// in the request body. Passing an empty array clears all phases from the
// group (but does not delete the group itself). Phases already assigned
// to another group are reassigned (each phase can belong to at most one
// group, enforced by the single groupId column).
```

**"Members" are phases, not people.** That is the whole answer — the route name is
misleading and the file's own header is the correction. It touches no user, no
team member and no permission; it is `UPDATE phases SET group_id = ?`. It does
**not** affect who sees anything.

**Nothing grouped is the normal state, and the page is built for it.** Every
ungrouped phase is synthesised into a **"virtual solo group"** so the UI always
has group containers to render:

```ts
// src/app/api/scopeplan/analytics/route.ts:610-628
    const ungroupedPhases = phases
      .filter((p: any) => p.groupId == null)
      .sort((a: any, b: any) => a.phaseNumber - b.phaseNumber);
    let virtualSortBase = (phaseGroupsFromDb.length > 0
      ? Math.max(...phaseGroupsFromDb.map((g) => g.sortOrder))
      : -1) + 1;
    for (const p of ungroupedPhases) {
      const metrics = computePhaseMetricsForGroup([p.id]);
      groupedResult.push({
        id: -p.id, // negative to distinguish from real group IDs
        name: p.name,
        color: NEUTRAL_COLOR,
        isVirtual: true,
        sortOrder: virtualSortBase++,
        metrics,
        phases: [phaseProgressById.get(p.id)!].filter(Boolean),
      });
    }
```

A virtual group takes the **negative of the phase id**, is grey (`#6b7280`), is
badged **solo** in the UI (`page.tsx:465-469`), and the filter translates negative
ids back to phase ids (`route.ts:64-87`). So with nothing grouped, the page shows
one grey card per phase and every number is per-phase. Grouping is purely
additive. **If you drop phase groups entirely, the Groups & Phases section
degrades to a phase list and nothing else on the page changes.**

**The 642 lines.** Only about 90 of them are drag-and-drop. The file is a full CRUD
admin screen:

| Lines | What |
|---|---|
| `:86-111` | fetch groups |
| `:113-145` | create (name only; colour auto-assigned server-side) |
| `:147-190` | rename, and change colour — two separate `PUT`s |
| `:192-215` | delete, with confirm |
| `:217-250` | the **assign-phases modal** — a checkbox list of every phase, posting `{phaseIds, replace: true}` to `/members` |
| `:251-311` | drag-to-reorder with `dragId`/`dragOverId` state, persisted via `PUT /phase-groups/reorder` |
| `:328-359` | create form |
| `:360-522` | the group rows: drag handle, colour dot + **inline colour picker**, inline rename, action buttons |
| `:523-548` | an **"ungrouped phases" preview** listing what has not been filed |
| `:549-642` | the assign modal's markup |

Colours come from a ten-entry palette cycled by group count
(`src/lib/scopeplan/phaseGroupColors.ts`) — one of only two live files left in
`lib/scopeplan/`.

---

## D · The pending-completions duplicate

**They are the same screen twice. The tab is a copy of the page with the chrome
removed, and it says so.**

```tsx
// src/app/clients/[clientId]/scopeplan/analytics/PendingCompletionsTab.tsx:1-4
// src/app/clients/[clientId]/scopeplan/analytics/PendingCompletionsTab.tsx
// Embedded pending-completions queue for the analytics page's "Pending" tab.
// Mirrors the standalone /pending-completions page but without the page
// header (since it lives inside the analytics page shell).
```

**Same query — byte-identical.**

```tsx
// src/app/clients/[clientId]/scopeplan/pending-completions/page.tsx:92-97
  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(
        `/api/scopeplan/pending-completions?clientId=${clientId}`
      );
```
```tsx
// src/app/clients/[clientId]/scopeplan/analytics/PendingCompletionsTab.tsx:80-85
  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(
        `/api/scopeplan/pending-completions?clientId=${clientId}`
      );
```

**Same write — same endpoint, same body.**

```tsx
// pending-completions/page.tsx:123-135
        const res = await apiFetch(
          `/api/scopeplan/activities/${activityId}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'COMPLETED',
              actualEndDate,
            }),
          }
        );
```
```tsx
// analytics/PendingCompletionsTab.tsx:114-122
        const res = await apiFetch(
          `/api/scopeplan/activities/${activityId}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'COMPLETED', actualEndDate }),
          }
        );
```

**Same controls. You can sign off from the analytics tab.** Both carry the three
filter cards (Total / On Time / Late), both carry **Complete All On-Time (N)** and
**Complete All Late (N)** bulk buttons, both carry a per-row `<input type="date">`
and a per-row complete button:

```
                                      standalone page   analytics tab
  "Complete All On-Time" / "…Late"          :297 :305       :261 :269
  per-row <input type="date">               :395            :357
  per-row handleCompleteOne                 :426            :388
```

**A structural diff of the two files, comments and blank lines stripped, yields
only:** the page has `useParams`/`useRouter`, a back arrow, an `<h1>Pending
Completions</h1>`, and a `/api/clients/{id}` fetch for the client name; the tab
takes `{clientId, onChange}` as props and fires `onChange?.()` after a completion
so the surrounding analytics refreshes (`:128`, `:158`). Everything else differs
only in line-wrapping and brace style.

**Neither is dead.** Both are reachable:
- standalone — a **Pending** button with a live count badge in the plan header
  (`ScopePlanHeader.tsx:383-399`, `router.push('/clients/{id}/scopeplan/pending-completions')`);
- tab — the Analytics page's third tab (`page.tsx:750`).

**Which do people use?** *I could not determine this from the code.* There is no
telemetry, no analytics event, no server log distinguishing them — both call the
same endpoint with the same query string, so even a request log could not tell
them apart. The standalone one has the more prominent entry point (a badged button
on the plan page, which is where people work) and is the one the tab documents
itself as mirroring; that is my inference, not evidence.

**Neither is a wider reading.** Both fetch `?clientId={id}` with no other
parameter, and the endpoint (`pending-completions/route.ts`) is already
client-wide — it matches on `{ phase: { clientId } }` or
`{ workPackage: { phase: { clientId } } }` with no agreement or scope narrowing.
So the answer to the question you were actually asking: **they are the same
reading, and it is the client-wide one.** Neither offers anything the other does
not.

**Recommendation for the port:** drop both in favour of the Progress tab, and
carry across only the two things the Progress tab may not have — the **three-way
On Time / Late split with counts**, and the **bulk "Complete All On-Time"**
action. Those are the parts that make a queue clearable rather than browsable.

---

## E · The endpoint

**Response shape.** The declared client-side type, which matches the returned
object at `route.ts:630-705`:

```tsx
// src/app/clients/[clientId]/scopeplan/analytics/page.tsx:44-100 (abridged to the shape)
interface AnalyticsData {
  groups: GroupRow[];                    // { id, name, color, isVirtual, sortOrder, metrics, phases[] }
  overview: {
    healthScore: number;
    totalActivities: number;
    statusCounts: Record<string, number>;   // all 7 statuses
    overdueCount: number;
    avgDelayDays: number;
    blockedCount: number;
    onHoldCount: number;
    avgProgress: number;
    onTrackPercent: number;
    phaseProgress: PhaseProgressRow[];      // one row per phase
  };
  schedule: {
    statusCounts: { todo; inProgress; done; completed };
    onTimePercent; onTimeCount; completedCount;
    milestones: Milestone[];                // UNCAPPED
    milestonesHit; milestonesTotal;
    dueThisWeek: { total; inProgress; notStarted };
    delayCategories: {
      mild:   { count; avgDelay; activities[] };   // UNCAPPED
      medium: { count; avgDelay; activities[] };   // UNCAPPED
      severe: { count; avgDelay; activities[] };   // UNCAPPED
    };
    upcoming: { thisWeek[]; thisWeekTotal; nextWeek[]; nextWeekTotal; weekAfter[]; weekAfterTotal };
  };
  filterOptions: { phases[]; assignees[]; groups[] };
}
```

**SQL vs JavaScript.** Essentially everything is JavaScript. SQL does filtering
and one `distinct` (`:484`) and nothing else — there is **not a single
`groupBy`, `_count`, `_avg` or `_sum`** in the file. All six queries are plain
`findMany`s; every count, average, bucket and score is a `.filter()` or
`.reduce()` over arrays in memory. `phaseProgress` (`:268-302`) and
`computePhaseMetricsForGroup` (`:497-563`) both re-scan the full activity array
once per phase and once per group — O(phases × activities) and
O(groups × activities) in the request.

**Cross-client fan-out: none.** Every query carries `clientId`. The two `WHERE`
clauses that are not scope-anchored are:

```ts
// src/app/api/scopeplan/analytics/route.ts:142-147
    const activityWhere: any = {
      OR: [
        { phaseId: { in: phaseIds } },
        { workPackage: { phaseId: { in: phaseIds } } },
      ],
    };
```
```ts
// src/app/api/scopeplan/analytics/route.ts:476-485
    const assignees = await db.activity.findMany({
      where: {
        OR: [
          { phaseId: { in: allPhaseIds } },
          { workPackage: { phaseId: { in: allPhaseIds } } },
        ],
      },
      select: { assignedToUserId: true, assignedToUsername: true },
      distinct: ['assignedToUserId'],
    });
```

Both are safe because `phaseIds` and `allPhaseIds` were derived from a
`clientId`-anchored phase query. But note they are **id-list joins, not relational
constraints** — under a row-level-security model where an unset tenant reads
empty, an empty `phaseIds` array would make these match nothing rather than
everything, which is the right failure direction. They do fan out **across
agreements and scopes** within the client, by design (§A.1).

**Pagination and caps: none.** No `take`, no `skip`, no `revalidate`, no
`dynamic`, no `LIMIT`. The only trimming is three `.slice(0, 5)` calls on the
*upcoming* lists (`:686-691`) — and even there the untrimmed totals are sent
alongside. **`milestones` and all three `delayCategories[*].activities` arrays are
returned in full**, each element carrying `id`, `displayId`, `name`, `status`,
`assignedTo`, dates, `phaseName`, `groupId`, `groupName`, `groupColor`.

**Rough payload.** *I could not measure this — no data exists to measure.* By
construction: the response carries one object per milestone, one per overdue
activity, one per phase (twice — in `overview.phaseProgress` and again nested in
`groups[].phases`), plus one per group. A 200-activity plan with 20 milestones and
40 overdue items would return roughly 60 fully-hydrated activity objects and ~15
phase objects — tens of kilobytes. It is not a scale problem at ClientPlus's size
(54 clients, 151 scopes); it would become one if a client accumulated years of
plans, because the page is client-wide and nothing ages out.

**Caching: none, anywhere.** Not in the route, not in the client. `fetchAnalytics`
is a `useCallback` keyed on the filters and re-runs on every filter change
(`page.tsx:189`); completing an activity in the Pending tab calls it again via
`onChange`. **Nothing is stored.** No `progress_percent` is written, no summary
table, no memo, no header.

**On your stored-summary concern:** this endpoint is already on your side of the
line — it computes from the rows every time and persists nothing. The one
vestige pointing the other way is that it **selects a stored summary column it
never uses**:

```ts
// src/app/api/scopeplan/analytics/route.ts:105-113
      select: {
        id: true,
        name: true,
        phaseNumber: true,
        status: true,
        progressPercent: true,     // ← selected, never read
        scopeId: true,
        groupId: true,
      },
```

`phases.progress_percent` is `DECIMAL(5,2) NOT NULL DEFAULT 0` and — as the first
audit established — is **never written by any ScopePlan code**. It is selected
here and referenced nowhere else in the 747 lines. Someone started to build the
stored-summary version and stopped. Drop the column; do not revive it.

---

## F · Who may open it

**The page has no permission gate at all.** `grep` for `useModulePermission`,
`permission`, `canAccess`, `redirect`, `unauthorized`, `403` across
`analytics/page.tsx` returns **nothing**. It is a client component that renders
its shell, then fetches.

**The endpoint is the only thing that refuses:**

```ts
// src/app/api/scopeplan/analytics/route.ts:42-52
    // Phase 5: Check client access
    const { allowed, ctx: visibilityCtx, reason } = await resolveVisibility(
      session.user.id,
      session.user.username,
      clientIdNum,
      session.user.modulePermissions?.['scope_plan']
    );

    if (!allowed || !visibilityCtx) {
      return NextResponse.json({ error: reason || 'Insufficient permissions' }, { status: 403 });
    }
```

So an unauthorised person gets the page frame, the heading, the filters and the
tab bar, and then a permanent *"Loading analytics…"* — the fetch failure is
swallowed into `console.error` (`page.tsx:185`) with no user-facing message.
Middleware contributes nothing beyond requiring a session; `/clients/**` is not in
its module map (`src/middleware.ts:88-105`), and `isExternal` users are
**explicitly allowed** `/clients` (`:61`).

### The disclosure, and it is a real one

**The analytics endpoint does not apply activity-level visibility. The plan page
does.**

```
src/app/api/scopeplan/hierarchy/route.ts:11   import { buildActivityFilter, isActivityVisible } ...
src/app/api/scopeplan/hierarchy/route.ts:95   const activityFilter = buildActivityFilter(visibilityCtx);
src/app/api/scopeplan/hierarchy/route.ts:119        where: activityFilter,
src/app/api/scopeplan/hierarchy/route.ts:151      where: activityFilter,

src/app/api/scopeplan/analytics/route.ts      — buildActivityFilter: not imported
                                              — visibilityCtx.activityFilter: never referenced
```

Analytics applies only the **scope-level** narrowing:

```ts
// src/app/api/scopeplan/analytics/route.ts:89-100
    // Visibility filtering
    if (visibilityCtx.visibleScopeIds !== 'all') {
      if (visibilityCtx.visibleScopeIds.length === 0) {
        return NextResponse.json({ /* empty */ });
      }
      phaseWhere.scopeId = { in: visibilityCtx.visibleScopeIds };
    }
```

Recall from the first audit how `visibleScopeIds` is derived for a CONTRIBUTOR
(`visibility.ts:223-307`): it is the set of scopes containing **at least one**
activity they are assigned to or collaborating on. So:

> A **CONTRIBUTOR** assigned to one activity in a scope sees, on the Analytics
> page, the **name, display id, assignee, dates and delay** of *every* activity in
> that entire scope — in the Delay Severity lists, the Milestone Tracker and the
> Upcoming Deadlines columns — even though the plan page shows them only their own
> rows. The **Assigned To** filter dropdown additionally enumerates **every
> assignee across the client** (`route.ts:476-485`, which uses `allPhaseIds` and
> applies no activity filter).

A **COLLABORATOR** is in the same position. A **VIEWER** already sees everything
by design, so for them this is not a leak.

**Does what is drawn narrow by role?** Only by scope, and only on the two tabs fed
by this endpoint. `GroupsBuilder` and `PendingCompletionsTab` call their own
endpoints, which have their own checks (`phase-groups` requires CLIENT_LEAD;
`pending-completions` requires `canAccessClient` and then filters to activities
the caller can manage). The Overview and Schedule tabs draw the same content for
everyone who can see the scope.

**Is there anything a client-side person should not see?** No margins, rates,
costs, hours or other-client data — §A settles that. What there is: **other
people's work and other people's names**, at a granularity the plan page
deliberately withholds from that same person. For a Portfolio project with the
client's own staff on it as Contributors and Viewers, "Viewer sees the whole plan"
is presumably intended, but "Contributor sees the whole plan through the analytics
tab while seeing only their own rows on the plan tab" is an accident, not a
design. **Port the page with `buildActivityFilter` applied, or decide explicitly
that analytics is Lead-only.**

---

## G · What is dead

**Of the four files in the brief, none is dead.**

```
analytics/page.tsx                 — Next.js route; linked from ScopePlanHeader.tsx:354
analytics/GroupsBuilder.tsx        — imported analytics/page.tsx:13, rendered :755
analytics/PendingCompletionsTab.tsx— imported analytics/page.tsx:14, rendered :750
api/scopeplan/analytics/route.ts   — called analytics/page.tsx:177
pending-completions/page.tsx       — Next.js route; linked from ScopePlanHeader.tsx:388
```

This is the opposite of what the first audit found for `lib/scopeplan/`. The
analytics surface is entirely live.

**Dead things *within* it, which is a shorter list:**

1. **`phases.progressPercent`** — selected at `route.ts:110`, read nowhere. Dead
   field on a dead column.
2. **`assignmentId` and `scopeId` query parameters** — accepted at `:26-31`,
   applied at `:56-57` and `:466-467`, and **never sent by any caller** (§A.1).
   Dead parameters, and the two that would otherwise be the porting problem.
3. **`milestone.delayDays` in the `upcoming` branch** — rendered at
   `page.tsx:695` as a countdown, never assigned for that status, always `0`.
4. **`emptyOverview()`'s `healthScore: 0`** — unreachable in the sense that it
   contradicts the live formula's 50 for the same situation (§B).

One live file from `lib/scopeplan/` is used here: **`phaseGroupColors.ts`**,
imported by `api/scopeplan/phase-groups/route.ts:14`. Together with
`activityDates.ts` it is one of the two survivors of that directory.

---

## H · Three things to keep

If I had to keep three and bin the rest — the three someone notices missing on
the Monday, not the three biggest:

**1. The overdue triage — Delay Severity with click-through.**
It is the only part of the page that answers "what do I do now" rather than "how
are we doing." Three buckets, worst first, each item a link that opens the
activity in the plan. Everything else on the page tells you there is a problem;
this is the only thing that hands you the list. If the Progress tab does not
already have a "what is late, worst first, click to fix" list, this is the gap.

**2. Groups & Phases — per-phase progress with a named status.**
"Phase 3: Design — 42% — 5/12 activities done — *Early Stage*" is the sentence a
lead needs before a client call, and it exists nowhere else in the product: the
plan page shows one number for the whole plan, and `phases.progress_percent` is
never written. Note this survives the loss of phase groups intact — with nothing
grouped, the virtual-solo mechanism already renders it as a plain phase list. So
keep the **phase rows**; the coloured buckets above them are optional.

**3. The Milestone Tracker.**
The only place the deliverables a client actually cares about are listed together
with whether each was met, and by how many days. It reads off `isMilestone`,
`plannedEndDate` and `actualEndDate` — three fields you are already porting — and
it is the natural thing to put in front of a client. Fix `milestonesHit` to stop
counting late milestones as hit, and fix the always-"today" countdown, and it is
ready.

**What I would bin:** the Health Score, because its weights are arbitrary in a way
the table in §B makes plain (an empty plan and an untouched plan both score 50; a
fully-overdue plan floors at 20; four blocked items cost a fifth of the score on a
plan of any size) — if Portfolio wants one number, it should be a number Portfolio
decides on, not this one inherited. Also the seven Schedule tiles, which restate
the Overview's status breakdown; the *Cancelled* KPI; and the *Upcoming Deadlines*
columns, which are a weaker version of the overdue list pointed at the future and
capped at three rows each.

---

## What I could not verify

1. **Anything the page actually renders.** No database, no MySQL binary, no
   `.env`; and no ScopePlan rows exist in the repository to seed one from. The
   numbers in §B are the real formulas executed against synthetic input, clearly
   labelled. There are no screenshots because the app cannot start.
2. **Which pending-completions surface people use.** No telemetry, and both hit
   the same endpoint with the same query string, so request logs could not
   distinguish them either. My inference from entry-point prominence is marked as
   inference in §D.
3. **Real payload size.** Construction-based estimate only, in §E.
4. **Whether the Contributor disclosure in §F has ever mattered in practice** —
   that needs the live `client_team_members` table to know whether anyone actually
   holds CONTRIBUTOR on a client with a populated plan.
