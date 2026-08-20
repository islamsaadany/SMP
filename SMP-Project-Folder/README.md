# SMP Project Folder — v2.2

Everything needed to pick this project up cold. Read in this order.

---

## Read first

**`CLAUDE-RULES.md`** — how Islam and Claude work together. Read before doing
anything. The first rule is the important one: **align before building** — a
question returned is not an answer, and nothing is built until the answer is
given. *(A1 was "mock before building" until 2026-08-20; that rule belonged to
the prototype era and was retired when Islam said so. The approval it protected
did not go with it.)*

**`DECISIONS-AND-LOGIC-v2.2.md`** — every decision with its reasoning,
including reversals recorded as reversals. Three sections matter most:

- **§11** — model questions still open
- **§16** — the backlog: agreed, and marked BUILT as each lands
- **§17** — version history

**`specs/`** (repo root) — spec-kit feature specifications, one folder per
feature, adopted in 1.9. The decisions document stays authoritative; a spec
records how one feature was cut against it.

---

## The platform

**`strategy-management-platform-v2.2.html`** — the built prototype. One file,
opens in a browser, no server needed — **and, served on Vercel, it reads and
writes its whole state through `/api/state` against Neon Postgres** (§18 of
the decisions document). Opened from disk it runs on its baked-in demo data,
exactly as every version before it.

**`src/`** — the sources it is built from, and the tooling:

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

**Next:** the rebuild on the HR_ERP stack (§20) — sign-in and the shell, then
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
