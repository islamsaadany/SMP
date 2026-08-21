# SMP Project Folder — v3.8

Everything needed to pick this project up cold. Read in this order.

---

## Read first

**`CLAUDE-RULES.md`** — how Islam and Claude work together. Read before doing
anything. The first rule is the important one: **align before building** — a
question returned is not an answer, and nothing is built until the answer is
given. *(A1 was "mock before building" until 2026-08-20; that rule belonged to
the prototype era and was retired when Islam said so. The approval it protected
did not go with it.)*

**`DECISIONS-AND-LOGIC-v3.10.md`** — every decision with its reasoning,
including reversals recorded as reversals. Three sections matter most:

- **§11** — model questions still open
- **§16** — the backlog: agreed, and marked BUILT as each lands
- **§17** — version history

**`specs/`** (repo root) — spec-kit feature specifications, one folder per
feature, adopted in 1.9. The decisions document stays authoritative; a spec
records how one feature was cut against it.

---

## The platform

**`strategy-management-platform-v3.10.html`** — the built prototype. One file,
opens in a browser, no server needed — **and, served on Vercel, it reads and
writes its whole state through `/api/state` against Neon Postgres** (§18 of
the decisions document). Opened from disk it runs on its baked-in demo data,
exactly as every version before it.

**`src/`** — the sources it is built from, and the tooling:

- `theme.js` is inlined by `build.py` into the **head**, not the body — the
  stored theme has to be applied before the page paints or it flips.
- `python3 build.py` assembles the single file. It must rebuild **byte-identical**
  to the shipped HTML; if it does not, something is out of step.
- `python3 qa.py` walks every viewer against every page they can reach and
  reports crashes. Run it after every change.
- `sync.js` is the persistence module — hydrate from the database, save on
  change, silently local on file://.

The database layer itself lives at the **repo root** (`db/`, `api/`, `lib/`,
`scripts/`): schema, seed generated from these sources
(`node scripts/extract-state.js`), the endpoint, the round-trip test and a
local dev server.

**Edit the sources, never the built file.**

---

## Mockups

Design work, in `mockups/`. Everything here was drawn before building, and some
of it was rejected — which is the point of keeping it.

### Settled and built

| File | What it settled |
|---|---|
| `concept-focus.html` | Focus measures — the mark, the reward rule, the standings |
| `concept-cycle.html` | The reporting cycle — open, report, chase, close |
| `mock-present.html` | Presentation mode — 16:9, the slide order, the notes column |
| `mock-navA.html` | The Units / Functions fold, **with the width measurements** |
| `mock-setuphead.html` | One header for both configuration tables |
| `mock-icons2.html` | Edit and clear icons, compared at real size |
| `mock-capcard.html` | The capability card, and the Cards/Table toggle. **Built in 1.9** |
| `2026-08-21_design-language-strategy-formulation_SETTLED.html` | The Strategy-Formulation language on SMP's own screens. **Built in 3.11** (&sect;38) |
| `2026-08-21_accent-budget_SETTLED.html` | Four rail treatments, three navigation, two pips, in both palettes. Settled **B / C / A** (&sect;41) |
| `2026-08-21_fold-accent_SETTLED.html` | Five treatments for the OPEN navigation fold, both palettes. Settled **D**, accent words with no fill (&sect;41.4) |

### Settled — build status noted

| File | What it holds |
|---|---|
| `mock-capproject.html` | The first project sketch. Superseded — kept for the reasoning |
| `mock-capproject2.html` | The project model on the platform's own components. **Built in 1.8** |
| `mock-caprail.html` | The rail on a capability, all three tabs. **Built in 1.8** |
| `mock-unitrail.html` | The rail on a business unit, drawn with Mobile's real content. **All three pages built — Strategy in 1.7, Performance in 1.8, Reporting in 1.9** |
| `mock-foundationtab.html` | Foundation as a subtab — the page reproduced unchanged, plus the capability version. **Built in 1.8** |
| `mock-strategytab.html` | The Strategy tab and its three subtabs, with Mobile's real content. **Decided with `mock-twotab`, built in 1.8** |
| `mock-twotab.html` | Two tabs for a unit — Performance and Strategy — with reporting folded into Performance. **Built in 1.8** |
| `mock-capability.html` | The capability pages and their Setup screens |
| `mock-capline.html` | The one-line capability band, and projects expanded |

### Rejected — kept so the ground is not retrod

| File | Why it was rejected |
|---|---|
| `mock-obligation.html` | Reporting as a person's page. Built, then reverted: it only solved a case that does not exist, since nobody owes both a unit and a capability. |
| `mock-brief.html` | The CEO brief. Rejected as drawn — too much detail on a page that should answer one question. |
| `mock-nav.html` | Four navigation options, superseded by `mock-navA` |
| `mock-expandall.html` | Placements for an expand-all control, rejected |
| `mock-icons.html` | A first icon set, superseded by `mock-icons2` |
| `mock-groupreport.html` | Group reporting before capabilities were understood |
| `preview-report.html` | The reporting page before it was built |
| `concept-reporting.html` | An early reporting concept |
| `2026-08-21_access-role-then-groups_REJECTED.html` | Roles &amp; access as **pick a role, then five collapsible page groups**. Killed by its own mockup: with the real defaults four groups in five are &ldquo;mixed&rdquo;, so a page that opened mixed groups to avoid hiding a difference unfolded straight back into the 25-row list it was meant to replace. Superseded by the 7&times;7 area table (&sect;37). |

---

## Where things stand

**Built:** the group and unit model, scoring, the temple, arrangement, import
and export, focus measures, the reporting cycle with snapshots and deltas,
presentation mode, supporting functions and capability ownership, the folding
navigation, Setup split from Manage, the project model with the rail and two
tabs (1.7–1.8), and — in 1.9 — the capability card with the Cards/Table
toggle (§16.6), capability project import and export (§16.4), presentation
mode for a supporting function, and the rail on My reporting (§15.12, now
cleared).

Version **2.0** moved the platform's state into the database (§18): served on
Vercel it loads from and saves to Neon, self-building and self-seeding on
first contact; opened as a file it is unchanged. Version **2.1** put real
sign-in on top (§19): the gate is a login, the platform requires a session,
each person sees their own view, and the SMO issues passwords from Levels &
access. The viewer switcher survives only as the SMO's read-only simulation
and in the offline file.

Version **2.2** turned the demo tenant into the client's own (§21): the
companies, the business units, the supporting functions, the themes, the
capability names and the configuration stayed; every invented plan, foundation,
person, cycle, capability content and weighting value went. The weighting
*model* survives — the four factors and their 40/30/20/10 split — and until a
figure is entered every unit counts equally (§21.5). The worked example is still
there: a **Demo data** button switches the whole product to it for explaining,
labels it while it is on screen, and cannot save it.

Version **2.3** took the codes out of the plan template (§22). One generic
workbook instead of a download per unit; the unit is chosen on its Read me
sheet; the platform assigns every code on arrival. It rests on one rule — **an
upload authors a plan, it does not amend one** — which is what removes the need
to match a row against anything. Replacing a plan **archives** the outgoing one,
reported figures included, and Manage lists archives with a Restore.

Version **2.5** brought in the **company level** (§23, built by Islam outside
the repo): a layer between the group and the business unit, for visibility
rather than strategy — a company CEO sees their own units, with two per-company
flags deciding whether they also see the other companies and the group. Two
defects that only a real uploaded plan could expose went with it: a pillar
arriving from an upload had no code, so the rail could not navigate; and the
sticky chrome was pinned three times over, which smeared the header on scroll.

Versions **2.6–2.8** were what a real uploaded plan and a real screen exposed:
the horizon stopped being a baked default and became the tenant's to set; the
rail was found pinned twelve pixels from the top of the window, under a chrome
up to 258px tall that was swallowing its clicks; and the fix for that carried a
feedback loop — a rail capped against the measured chrome height — that had to
be broken with a constant.

Version **2.9** cut the chrome to two lines (§24). The header had been saying
where you are five times over, above a navigation row that already said it:
product name, org name, unit name, a derived "Group · 10 business units" tag and
an Info button. It is now the product on the left, **Viewing as** in the middle,
Demo data and Sign out on the right — then the navigation, then the tabs. Setup
and Manage, two glyphs at the right of the nav row, became one worded **Manage**
button with a menu listing all ten destinations in two labelled groups. Nothing
about the pages moved: each entry opens exactly the page its icon used to, with
the same tab row underneath.

Version **3.0** added the light/dark switch (§25). The dark palette had been in
`_shared.css` from the beginning with nothing to select it — the product followed
your laptop silently. **Auto · Light · Dark** now cycles from a round mark left
of Demo data, remembered on that screen only (never in the database, or one
person's choice would recolour the whole tenant), and the sign-in gate reads the
same choice so signing in never changes the colours under you. The gate's dark
colours were built; it had none.

Selecting the palette for the first time is what exposed the real defect: the
zebra stripe on **every table** was a hardcoded `#F7F9FC`, painting a near-white
band under near-white text. Five new tokens closed that class of bug and dark
went from 482 failing contrast runs to 11. **Light mode's 61 are pre-existing,
untouched and recorded** (§25.5) — a palette decision, not a dark-mode fix. The
client's name came back beside the product name, and the first line was measured
and made to *actually* be one line, which it had not been for anyone signed in.

Version **3.1** made it installable (§26). To a dock or a home screen: own icon,
own window, and it opens with no network. `sw.js` holds the shell — the gate, the
built platform file, the icons — and **never `/api/*`**, because a cached
`/api/state` is last quarter's actuals wearing this quarter's chrome. Offline you
get the platform on its baked data, which it already says on screen.

Version **3.2** made the first line one line at *every* width (§27) — v3.0 had
verified it only at 1180 and above, which is why it still arrived as two rows on
a 1000px laptop. The product name dropped from 26px to 13px and the header from
108px to 47px. Auto went; Light and Dark only.

And the header that kept looking "glitchy" turned out not to be the header:
`.tip::after`, the hover note on every explanatory icon, is a ~320px absolutely
positioned box that was laid out **at all times** at `opacity:0`. Near the right
edge it made the page wider than the window, the page scrolled sideways, and the
sticky chrome slid with it. Hidden tooltips are `display:none` now.
`groupRatio()`'s `NaN%` on the group front page — 0/0 on a tenant with no
tactics — went with it.

Version **3.3** took six changes off the deployed product and, with them, the
scroll-up glitch at its source (§28). The footer sentence went; **Manage is a
gear** with the word in its tooltip; the **rail expands to any number of
directions** instead of cutting the list off mid-row; the headings above it went
on both Plan and Performance; and a business unit opens on **Strategy › Plan**.

The glitch: three versions had fixed real causes underneath it. What remained
was the condense-on-scroll itself — at scroll position 25 the chrome settled at
190px arriving downward and 168px arriving upward, so scrolling back up dropped
22px of chrome into the page in one step. It bought 22px on a header that is now
47px. The mechanism is gone and the chrome reports one single height, in both
directions.

Version **3.4** took seven more off the deployed product (§29). The
Units/Functions folds were not lagging, they were **dead** after any use of the
Manage menu — that row's HTML is rewritten when the menu opens or closes, which
destroys the handlers inside it. The first line is **27px**, half of 47, once a
duplicate `.themebtn` rule was found holding it at 31. The rail's slide is
**0px**, because its gap and its sticky offset are now the same variable rather
than two numbers that were meant to agree. Direction/Capability is hidden behind
one flag everywhere a reader goes, with the field untouched in the data and the
import template. The "Plan only" notice and the rail footer went, and rail rows
now read "3 measures · 2 tactics" instead of a bare unlabelled number.

Version **3.5** added the **Knowledge base** (§30) — first in the Manage menu,
open to everyone, seven sections written to be read start to finish. The essays
that sat above and below four setup tables moved into it: a setup table is where
you change a thing, not where the thing is explained. Also: the **two-click
save** in Setup is one click (a field's blur was repainting the page and
destroying the button mid-press), **Companies** has its own tab, and the **pen
on hover** replaces the bare Edit bar wherever an edit mode exists.

Building the KB caught a defect worth naming: **a page added in a new version
was invisible on every existing tenant**, because the access map is stored per
tenant and a missing key read as denied. It falls back to the shipped default
now.

Version **3.8** replaced levels with **roles** (§33). N-1/N-2/N-3 are gone and
a job title never decides access. A role naming a seat lives on the person; a
role naming responsibility for a thing lives on the thing, so the unit page and
the registry are two views of one fact. It also caught two defects that would
have reached production, including a migration ordering flaw that would have
broken the live database on deploy (§33.5).

**Next:** the people register (§16.11) — an employees page with IDs, titles,
units and password resets, which is also what item 2 of Islam's list needs
before a name can be typed rather than picked. Then the rebuild on the HR_ERP
stack (§20) — sign-in and the shell, then
the read-only screens, then editing and reporting per action with server-side
rule checks and the per-figure change log (§16.0a, §19.2). Then the longer-term
set below and the open model questions in §11.

**Longer term:** source teams (§16.7), the help box (§16.8), people and
credentials (§16.9), strategy versions (§16.10).

---

## One caution

Only Mobile's plan comes from a real deck. **Every other unit, every capability
and every reported figure is invented** so the structure could be judged. It is
labelled as such in §13 of the decisions document.

Since v2.2 that invented content lives in one place only: **the demo dataset,
behind the Demo button, labelled every second it is on screen.** The deployed
tenant no longer holds any of it, and demo data cannot be written to the
database. Nothing invented reaches a client's own data by construction rather
than by care.
