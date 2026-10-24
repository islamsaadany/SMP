# Spec 067 — Processes, rethought: a reading side for managers, a builder for the office

**Status:** design agreed by Islam in mockups, 2026-10-24. **Nothing is built.**
The next step is a staged build plan, written once the team has read this.
Mockups and this spec are on branch `claude/admiring-clarke-f11ae0`.

**Created:** 2026-10-24

**Builds on:** spec 065 (FFProcess carried into SMP) and the 2026-10-23 redesign
prototype (`design-mockups/processes-redesign/2026-10-23_processes-prototype.html`).

## Islam's words

Each answer is recorded as he gave it, because the design rests on them. The
mockup it was given against is named after it.

1. *"I want to rethink the whole concept. when someone opens a process module what do they expect to see and what is the right structure to have for the viewer and the builder .. think with me"*
2. Who opens it: *"D, mainly managers and process owners"*.
3. What owners may do: *"B now, built so C can follow"*. Now, owners ask for changes and the office makes them. Later, owners may edit a draft themselves, with the office reviewing it.
4. What a process opens on: *"flow first and the steps and summary comes as tabs as you did"* (process page, A/B/C).
5. *"can you take download, pring and suggest a change in top right and give meoptions of the tabs to be more visible outside of the blue banner?"*. Tab style chosen: *"2"*, buttons.
6. What the module opens on: *"A"*, My processes. On the to-do: *"I'm not sure if we should combine waiting on you with my processes and should we split the to do to th end like option C?"*, then *"2, keep To do as the second tab"*.
7. Where the office builds: *"separate builder but how can the office enter the builder part?"* The ways in and out were drawn, and his reply was *"ok"*.
8. *"the all process table needs to be serachable and sortable with alternating light grey and white starting with white as the table header is already grey which I suggest to be darker a bit"*.
9. The builder home opens on All processes, with To handle second: *"ok proceed"*.
10. The office sections, after the fuller mockup: *"go with A noting that the bar needs to be freezed on scrlling down and I don't we need the title on each page given we have the box highlighted in the bar"*.
11. *"I'm ok with the mockups"*.
12. A section's numbers: *"Q1 A"*, boxes under the tabs. A section's views: *"Q2 B"*, they stay with the tabs as you scroll.

## 1. The shape

Processes has two sides, and **who you are decides which one opens**. There is no
switch to remember.

| | Reading side | Builder |
|---|---|---|
| Who | A client's own people: managers, process owners, approvers, staff | The Strategy Office (Super user and SMO team seats) |
| Opens on | **My processes** | **All processes** |
| What they do | Read, approve, review, acknowledge, suggest a change | Draw, write, check and publish processes; run priorities, governance, the org directory, the export |
| What they see of a process | Only the version in force | Every version, including drafts |

This keeps how SMP works today, where the office lands in the office area and a
client's person is sent to the reading pages. What changes is what each side
looks like.

## 2. Things that hold on every page

- **The navy band** is the Internal Tracker's masthead: a gold path at the top, a white title, a one-line description, count tiles on the right, and a gold rule along the bottom.
- **Actions sit at the top right of the band**, above the tiles: Download SOP, Print, Suggest a change, New process, Send for approval. The main one is gold.
- **Tabs are navy buttons, under the band.** They show their counts, and a gold count marks what is waiting. *(Q5.)*
- **The tab bar stays in place as you scroll**, with a thin line under it once it has stuck. *(Q10.)*
- **No title above a section.** The highlighted tab says where you are. The section's one-line description replaces the band's subtitle, so it costs no space. *(Q10.)*
- **Tables:**
  - Rows alternate white then light grey, under a header a step darker than the grey. *(Q8.)*
  - There is no row hover, as on SMP's other tables (§278.3).
  - A process opens from its name or its button.
  - Long tables have a search box and sortable column headings. *(Q8.)*
- **Light and dark** both work, and every page works at phone width.

## 3. The reading side

### 3.1 Opening the module: My processes  *(Q6)*

The band reads **My processes**, with the person's role and what they own,
approve and have a step in. Its tiles show what they own, what they approve,
what is waiting on them, and risks with no control.

The tabs are **My processes · To do · Map · All processes**. To do is second and
carries a gold count.

- **My processes** has two tables.
  - **Yours** lists the processes they own or approve. Each row shows their part, where the process is, and what needs attention, such as a risk with no control, how many have read it, or the review date.
  - **You have a step in** lists the processes someone else owns where their role does part of the work. Each row names their step.

  Each row carries **its own action button**: Open and approve, Review by 12 Nov, Read the change, Reply to the office.
- A **"Waiting on you"** line in the band opens To do, so the to-do never hides.
- **To do** groups the waiting items: to approve, to review, to read, and answers to their suggestions. Each item has its button. A short "done lately" list sits beside it, and when the tab is empty it says they are up to date.
- **Map** shows every process grouped by area, with the selling flow drawn left to right.
  - Their own processes are gold, and the ones where they have a step are dashed.
  - An **Only mine** filter narrows the map, and clicking a process opens a side panel.
- **All processes** is the full list, as today. It is not drawn yet.

Acting on an item in a row or on the To do tab clears it in both places.

### 3.2 A process  *(Q4, Q5)*

The band shows the name, the version in force, "You own this", the approver and
the state of the next version. Its tiles show steps, roles, how many have read it,
risks with no control, and days to the review. At the top right sit
**Download SOP · Print · Suggest a change**.

A **"Waiting on you"** line appears in the band whenever something is waiting, for
example "The yearly review is due on 12 Nov · Open the summary".

The tabs are **Flow · Steps · Summary**, and the page **opens on Flow**. On a phone it
opens on Steps, because the flow needs sideways scrolling there.

- **Flow** draws lanes per role, with arrows and labelled decisions. Clicking a step opens its panel: who does it, approval, time limit, what they do, and its control.
- **Steps** is a numbered list with an index of steps beside it. Each step shows who does it, what they do, the approval, the time limit, and its risk and control.
- **Summary** has four parts:
  - what the process is for, its scope, and its measures;
  - **Is it in good shape?**, covering approval, RACI, risks with no control, who has not read it, and a missing SOP version;
  - what is waiting on them;
  - the flow in one line, then the steps, each opened one at a time.

**Suggest a change** works on every tab and can be pinned to a step. It goes to the
Strategy Office, and the answer comes back on the page and in To do. Owners do not
edit, because that is answer 3's "B now".

## 4. The builder

### 4.1 Getting in and out  *(Q7)*

**Ways in:**
1. **Processes in the top bar.** An office seat lands on the builder home.
2. **Open in builder.** This sits at the top right of any process page, for office seats only.
3. **Start a draft from this.** This sits on a suggestion and opens the builder on that process with a draft started and the step selected. **Open in builder** on a draft the approver sent back does the same.

**Ways back out:**
- **Preview as manager** shows the draft exactly as the owner will read it. A gold strip says it is a preview and offers **Back to the builder**.
- **Open the staff view** shows Processes as client staff see it.

**Not chosen:**
- A Read / Build switch in the top bar. It is one more thing to forget, and the seat already says who builds.
- A second "Process builder" entry in the top bar.

### 4.2 The builder home  *(Q8, Q9, Q10, Q12)*

The band reads **Process builder**, with the office's own counts: a suggestion,
drafts sent back, open drafts, and gaps. Its actions are **Open the staff view** and
**New process**.

The eight tabs sit in one row, with All processes first: **All processes · To handle ·
Landscape · Priorities · Governance · Org & roles · Export · Settings**.

- **All processes** is a table of every process: name, owner, where it is, gaps, and Open in builder.
  - A search box matches the code, name, owner or state, and shows "3 of 13" while filtering.
  - Every column heading sorts. "Where it is" sorts by what needs the office first: sent back, review late, waiting for approval, then being drawn.
- **To handle** lists suggestions from owners, drafts the approver sent back, and processes with gaps. It carries a gold count.
- **Landscape** has three views: Value chain, Hand-overs and Milestones. It replaces today's separate Value chain and Helicopter pages.
- **Priorities** has four steps: 1 Score, 2 Rank, 3 Plan, 4 Sign-off.
- **Governance** has six views: Needs attention, Assessment, Risks, Policies, Controls and Activity.
- **Org & roles** has three views: People, Roles and Chart.
- **Export** builds the pack. Tick processes and pack sections, then Preview report, SOP, or Check end to end. The check reads at most 12 processes and says how many to untick (§599).
- **Settings** holds the logo and colours, the client profile, the governance profile, the categories and the language. It is for Admins.

**Today's Dashboard goes**, because All processes and the band's tiles do its job.

On a section's page:
- There is no title; its description sits in the band.
- **Its numbers sit in boxes under the tabs**, while the band keeps the office's counts. *(Q12, Q1 A.)*
- **Its own views sit in a second, lighter row of switches that stays under the tab bar as you scroll.** *(Q12, Q2 B.)* On a phone the eight tabs already take three rows, so there only the tabs stay and the views scroll with the page. This phone rule is proposed and not yet confirmed.

### 4.3 Building one process  *(Q7)*

The band shows the process and its draft, for example "Draft v4 · started from Hend
Mourad's suggestion on step 4". Its actions are **Preview as manager** and
**Send for approval**.

A menu on the left lists the sections, each with a status dot: **Map · RACI ·
Authority · Risks & controls · Quality · Lifecycle**.

- **Map** is the flow with a toolbar (+ Step, + Decision, Connect two steps, Undo) and "Saved as you type".
  - Gaps show as red marks on the steps.
  - The selected step opens as a form: the step, who does it, what they do (with "Changed in v4" marks), who is involved (R, A, C and I chips), approval and time limit, and risk and control (+ Add a control).
  - When the draft came from a suggestion, the owner's words sit at the top.
- **RACI** is the full grid. A step with no one accountable is marked.
- **Authority, Risks & controls, Quality and Lifecycle** keep the designs of the 2026-10-23 prototype. They are not redrawn here.

## 5. Still open

1. **The phone rule for the views row** (§4.2) is proposed and needs a yes.
2. **The darker table header.** SMP's other tables use a slightly lighter one. Does Processes' header become the platform's header?
3. **Owners editing drafts later** (answer 3's "C"). With a separate builder, owners need either a limited way into the builder for their own drafts or a lighter editor of their own. This is to be designed when that stage comes; nothing here blocks it.
4. **The seven decisions on the 2026-10-23 prototype** are still with the team. Some are answered by this design, for example where the tabs go and what the module opens on. They need reconciling before the build plan.
5. **Not drawn yet:**
   - the reading side's All processes tab;
   - what frontline staff with no ownership see, assumed to be My processes, made mostly of "You have a step in", plus To do;
   - the approver's full approval screen.

## 6. Mockups

Every mockup is a private page; share it from its Share menu. The source of each is
in `design-mockups/processes-redesign/`.

| What | Page | File |
|---|---|---|
| A process page | https://claude.ai/artifact/SHQYtVxi7jJEiKyXr4PWpG | `2026-10-24_process-page-options.html` |
| Opening the module (reading side) | https://claude.ai/artifact/Ca4iexcoLs3XUoaLcVi3BB | `2026-10-24_module-landing-options.html` |
| Where the office builds (options compared) | https://claude.ai/artifact/6SGfFu8mK9svrLzZeVUagb | `2026-10-24_builder-options.html` |
| The builder: ways in and out, the builder home, every section | https://claude.ai/artifact/BT6QKStYrnyVhtfxjd6yJA | `2026-10-24_builder-entry.html` |

Earlier versions of each page, holding the options that were not chosen, are in the
page's history and in git.

## 7. For the build plan

These notes are for whoever writes the staged plan; none of it is decided wording for
screens.

- **Today:**
  - The office area is `app/(ffp)/[slug]/processes/(shell)/`, with a side menu (`workspace-sidebar.tsx`: Dashboard, Org, Processes, Priorities, Helicopter, Value chain, Governance, Export).
  - The reading pages are `processes/read/`, opened by `readerSeat`.
  - The frame (`processes/layout.tsx`) already sends a client's person to their reading page and asks `requireOffice` for the office area. That is the "seat decides" in §1.
- **The builder home** replaces the side menu with the tab row, in the order above. Helicopter and Value chain become Landscape's views, and the Dashboard's settings move to Settings.
- **The builder page** replaces the process page's seven tabs with the left menu in §4.3.
- **The reading side** grows from `read/` into §3: My processes, To do, Map, and a process page with Flow, Steps and Summary.
- **"Waiting on you" and To do** need one source for what is waiting on a person: approvals, reviews due, unread versions they have a step in, and answers to their suggestions. The row buttons and the To do tab both read it, which is what keeps them in step.
- **Suggestions** are a new record: who, which process, which step, the words, the office's answer, and the draft they started. The office's To handle reads them.
- Rules carried over: §599 (a button asks the same rule its save asks; export check at most 12) and §278.3 (no row hover).
