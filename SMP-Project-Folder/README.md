# SMP Project Folder — v1.9

Everything needed to pick this project up cold. Read in this order.

---

## Read first

**`CLAUDE-RULES.md`** — how Islam and Claude work together. Read before doing
anything. The first rule is the important one: **mock before building, always.**

**`DECISIONS-AND-LOGIC-v1.9.md`** — every decision with its reasoning,
including reversals recorded as reversals. Three sections matter most:

- **§11** — model questions still open
- **§16** — the backlog: agreed, and marked BUILT as each lands
- **§17** — version history

**`specs/`** (repo root) — spec-kit feature specifications, one folder per
feature, adopted in 1.9. The decisions document stays authoritative; a spec
records how one feature was cut against it.

---

## The platform

**`strategy-management-platform-v1.9.html`** — the built prototype. One file,
opens in a browser, no server.

**`src/`** — the sources it is built from, and the tooling:

- `python3 build.py` assembles the single file. It must rebuild **byte-identical**
  to the shipped HTML; if it does not, something is out of step.
- `python3 qa.py` walks every viewer against every page they can reach and
  reports crashes. Run it after every change.

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

**Next:** nothing mid-flight. The backlog is the longer-term set below, plus
the open model questions in §11.

**Longer term:** source teams (§16.7), the help box (§16.8), people and
credentials (§16.9), strategy versions (§16.10).

---

## One caution

Only Mobile's plan comes from a real deck. **Every other unit, every capability
and every reported figure is invented** so the structure could be judged. It is
labelled as such in the product and in §13 of the decisions document. Nothing
invented should reach a client.
