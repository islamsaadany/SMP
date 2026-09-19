# Analytics brief — the one screen the first audit did not reach (spec 056 §9.10)

> **ANSWERED 2026-09-19.** The reply is `analytics-audit.md` (848 lines, commit
> `bf9793c`), and what it settles and leaves open is §9.11 of the spec. This page
> is kept as the record of what was asked — do not re-run it.

For a session that can read **`aleymahmoud-ff/clientplus`**. This session
cannot: an `add_repo` across owners is refused, and the GitHub tools here are
scoped to `islamsaadany/smp`.

**The first audit (`port-audit.md`, 2,295 lines) is excellent and has one
hole.** It names the analytics files and their line counts and **never says what
any of them put on the screen**:

```
 985  src/app/clients/[clientId]/scopeplan/analytics/page.tsx
 747  src/app/api/scopeplan/analytics/route.ts
 642  src/app/clients/[clientId]/scopeplan/analytics/GroupsBuilder.tsx
 410  src/app/clients/[clientId]/scopeplan/analytics/PendingCompletionsTab.tsx
```

Two and a half thousand lines, and the only other mention in the whole audit is
one aside — *"an optional coloured bucket a user drags phases into so the
analytics page can group by it"*. So SMP cannot draw this screen: anything drawn
from what is known would be **invented rather than ported**, which is the one
thing this port is trying not to do.

**Everything else is drawn and signed off** — the project team, the charter, the
plan with its Gantt, and Progress. Analytics is the last tab and the only one
still dark.

---

## What is already decided — so no effort is spent on it

Read this first; it removes work and, more importantly, it is what makes
question A below the one that matters.

1. **The `(client, agreement, scope)` triple is gone.** A project belongs to a
   client, full stop. `agreements`, `scopes`, `subdomains`, `domains` and
   `client_assignments` are **not** ported.
2. **There are no hours, no rates, no budget amounts and no finance anywhere in
   the destination.** The whole platform has 57 tables and not one holds a
   budget, a contract, a fee or an hour. A project carries **one** budget figure
   — a headline on its charter, read by nothing.
3. **Time entry, utilisation and consultant costs are not coming across** and
   are not reachable from the destination at all.
4. **Six roles became three** — Lead, Contributor, Viewer, held per project.
5. **Pending completions already has a home**: it is the **Progress** tab, which
   is drawn. So the Analytics *tab* of the same queue is a duplicate on the way
   in, unless it does something the standalone page does not — see D.
6. Nothing is being built. This is reading, not porting.

---

## A · The question that decides whether any of it can be ported

**What does the analytics page read that is not the plan tree?**

For every figure, chart, table and tile on that page, say which of these it
comes from:

- **the plan tree alone** (phases, work packages, activities, sub-activities,
  their dates, statuses and progress) — portable as-is;
- **the agreement or scope** (budget hours, budget amount, agreement dates,
  lead consultant) — the level that no longer exists, so each one is either
  dropped or comes back as a field on the project, and which is a decision;
- **time entries, utilisation, consultant costs, finance** — not reachable, so
  whatever it renders cannot come across in any form;
- **other clients** — the destination sets one client per request and an unset
  one reads empty tables, so anything cross-client is structurally impossible
  here.

**Answer this one first even if you answer nothing else.** If most of the page
turns out to be hours and utilisation, the honest outcome is that Portfolio's
Analytics is a small new screen rather than a port, and knowing that is worth
more than a faithful description of something that cannot travel.

---

## B · What is actually on the screen

**A faithful walk-through, section by section, in the order somebody sees
them.** For each one:

- its heading, in the product's own words;
- what it draws — a number, a table, a bar chart, a donut, a timeline, a
  heatmap — and **which chart library**;
- **what the figure IS**, in the words somebody using the product would say;
- the arithmetic, as pasted code with its file and line numbers, and whether it
  is computed **on the server or in the browser**;
- what it shows when there is nothing to show.

**Sample values help more than prose.** If the app can be run against any real
or seeded data, paste what the page actually renders — headings and numbers, as
text. A screenshot is better still. If it cannot be run, say so.

**And say which sections are the point.** 985 lines is a lot of page; two or
three of its sections are presumably why anybody opens it, and the rest is
furniture. Which are which, and how do you know — is it in the code, or is it
your reading?

---

## C · Phase groups

The audit says a phase group is *"an optional coloured bucket a user drags
phases into so the analytics page can group by it"*, and `phase_groups` has a
`scope_id` with **no foreign key**.

- **What does grouping buy on the analytics page?** Does it change a number, or
  only the order and colour of what is already drawn?
- `GroupsBuilder.tsx` is **642 lines**, which is large for a drag-and-drop list.
  What is the rest of it doing?
- Is a phase in exactly one group, or several?
- What happens to the page when nothing has been grouped — is that the normal
  state?
- `phase_groups/[id]/members/route.ts` exists. **Members of a phase group?**
  That reads like people, not phases. What is a member here, and does it affect
  who sees anything?

---

## D · The pending-completions duplicate

The same queue exists twice: `pending-completions/page.tsx` (449 lines) and
`analytics/PendingCompletionsTab.tsx` (410).

- **Do they run the same query?** Paste both call sites.
- **Do they offer the same controls?** Can you sign off from the analytics tab,
  or only look?
- Is one of them dead — does either have importers or a route that reaches it?
- If they differ, **which is the one people use**, and what does the other one
  have that it does not?

*Why it matters here:* the destination has one Progress page with a sign-off
queue on it. If the analytics tab is the same thing, it is dropped. If it is a
different reading — everything pending across the whole client, say, rather than
one project — that is a real feature and it needs to be known about.

---

## E · The endpoint

`api/scopeplan/analytics/route.ts`, 747 lines.

- **What does it return?** The response shape, as a pasted type or a real
  example.
- What is aggregated in SQL and what in JavaScript?
- **Does it fan out across clients, scopes or agreements** in any query? Paste
  any `WHERE` that is not scoped to one client and one scope.
- Is it paginated, capped, or does it walk everything every time? On the largest
  real plan, roughly how much does it return?
- **Is it cached anywhere**, and if so where — a stored table, a memo, a header?

*Why it matters here:* the destination computes a pillar's score, a unit's and
the group's when the page is drawn and stores none of them, on a rule it has
written down (*a summary must be made of the numbers it summarises*). A stored
analytics figure would be the first thing here that can go stale, so if theirs
stores anything it is worth knowing why.

---

## F · Who may open it

- **The permission gate on the analytics page and on its endpoint**, as code
  with file and line, and say which of the two actually refuses.
- Is there anything on that page a **client-side** person should not see —
  margins, rates, another client's anything, an internal note?
- Does what is drawn narrow by role, or does everybody who can open it see the
  same page?

*Why it matters here:* a Portfolio project has the client's own people on it as
Contributors and Viewers. A page that quietly assumes a consultant is reading it
is a disclosure the moment it is ported as-is.

---

## G · What is dead

The first audit found **82% of `lib/scopeplan/` has zero importers**, and that
the dead files are the ones that read like the specification. So, for these four
files: **which of them, and which exported functions inside them, actually have
importers?** A section of an analytics page that nothing routes to is not a
feature to port.

---

## H · The one thing worth saying in your own words

**If you had to keep three things from that page and throw the rest away, which
three, and why?** Not the three biggest — the three somebody would notice
missing on the Monday.

---

## How to answer

One markdown document. Code in fenced blocks with its file path above it.
Sample output as text, screenshots if the app runs.

**Mark anything you could not verify.** *"I could not find where this is
enforced"* is a useful sentence; a confident guess is not. If the code
contradicts this brief, the code wins — say so, and quote it.
