# 054 · Research — what the code settled before the plan was written

Four questions the spec could not answer without reading the code. Each is
answered from the sources named, not from memory, and each answer is a
decision the plan rests on.

## R1 · Who serves a module's Setup — the module, or the spine?

**The spine.** Spec 054 §7 settled that the landing-line pick is written by
the spine and only read by a module, and reading the seam says why that has to
be true of the whole Setup: `modules/registry.ts`'s `ServeArgs` hands a module
no pool, no session and no registry row — the seam is deliberately two facts
wider than it was (§355) and no wider. A module that drew its own Setup would
have to write a client's settings, which is the door the seam does not have.

So `/<client>/<module>/setup/<page>` is served by `lib/shell.ts`'s
`shellDocument()` — the frozen shell — **from the route directly**, never
through `serverFor(module)`. The document is stamped `data-module` as every
served page already is; the shell reads it and draws the module's groups. The
`setup` segment stops being spine-only: `whereOf()` returns the module for
`/<client>/<module>/setup/…` and `null` for `/<client>/setup/…`, and the route
serves the shell in both cases.

**What this leaves in `modules/strategy/index.ts`**: its own header records
that Setup "arrives here" because the spine/module line was implicit. After
this it does not arrive there — the route serves Setup itself — and that
comment is corrected in the same edit (§104.8).

## R2 · How the shell knows which pages belong to which module

**`grp` gains a module, and the module comes from the document.** Every def
in `SUBS.manage`/`SUBS.setup` (shell.html) carries `grp`; each gains `mod:`
naming the module that owns it, with the Client group's pages carrying
`mod: null`. `setupRail()` filters `defs` by the document's `data-module`:

| The document says | The rail draws |
|---|---|
| `data-module="strategy"` | defs with `mod === "strategy"` |
| `data-module="insights"` | defs with `mod === "insights"` |
| no `data-module` and a spine address | defs with `mod === null` (the Client group) |
| `file://` (no server, no module) | **every def, in one rail, as today** |

The last row is the offline contingency copy (§306), which has no modules at
all and must keep working: an unstamped document with no server draws the
whole list. That is not a special case written for it — it is the absence of a
filter — and it is asserted (plan step 2).

**Insights' pages are shell pages too.** Its Roles & access and Landing line
are two new defs in `SUBS.setup` with `mod: "insights"`, rendered by the
frozen shell from what the document carries. The shell learns a module's
areas and its landing-line choices from **`data-modules`**, which
`shellDocument()` already stamps with each module's key, label and note; it
gains `areas` and `lines` — one list, stamped by the server that owns it
(`MODULE_DEF`), never a second copy in the browser (§53.5).

## R3 · Where a module's grant lives, and who enforces it

**In `access_grants`, under the area key the module declared, and the spine
enforces it at the route.**

`access_grants` is `(role_key, page_key, grant_)` with `grant_` checked
against `none | view | fill | edit`; Insights' `a_insights` declares
`["view", "none"]`, both admitted. The frozen matrix writes rows through the
ordinary save, classified `access` by `lib/authorize.js` (the Super user's,
§89), so Insights' one-column table is the same writer with a different key —
no new save path, no new rule. **`lib/rules.js` does not learn the key**: the
carried `rules.cjs` is asserted identical to it (§335), and a module's area in
the frozen Strategy product is where it does not belong (modules.ts's own
comment). The stored map must therefore **keep a key the shipped `AREAS` list
does not name** — the merge in `lib/state-io.js`'s read and the hydrate's
`ACCESS` merge are checked for this in plan step 5 before anything is built on
it, and the round trip proves it.

**Enforcement is the route's**: before `serverFor(module)` is called, the
route asks the spine `mayOpenModule(tenantId, personKey, seat, module)` —
the seat opens everything (spec 046 §4.10's own rule), otherwise the person's
roles (from the graph, through `frozen.cjs`, the way `landing` already reads
them) against the stored grant, defaulting to the area's `shipped` state. A
refusal is the same redirect an unknown module word gets (§320.5: one
behaviour for "not a thing here"). **The module server never learns about
grants** and the seam stays at §355's width.

## R4 · Where the landing-line pick lives, and how two readers share one line

**`GROUP.landing[<module>] = <key>` in `org.extra`**, no migration, deleted
when set back to the module's default (§50.6). Written by the Landing line
page through the ordinary save; classified `setup` by the authoriser **and**
added to `gExtra` in the same edit, or the change is invisible and therefore
allowed to everybody (§259.2, §308: the two edits go together, falsified
separately).

**The line is computed on the server from the pick and the module's facts**,
by one function `landingLine(module, pick, facts)` in `lib/modules.ts`,
replacing the hand-written Strategy cases in `moduleRows()` — so the console
card and the landing read one function (§53.5). Insights' facts (new reports
this month, the latest report's name) come from `lib/library.ts`, which the
spine already reads for the console; Strategy's from the cycle, which
`landing.ts` already reads. The frozen `landing` builder does not draw the
line: `landing.ts` adds `modules: [{key,label,line}]` beside the Landing it
already returns, and `Welcome.tsx` draws the row.

## R5 · The Overview's rows and where they go

`attentionRows()` (config-render.js) has five rows: chat → `chat`, claims →
`cycle`, custodians/passwords/declarations → `people`. After the split the
destinations sit on two rails, and `attentionByPage()` — which sums those
rows per destination for the rail's pills — needs no edit at all: a pill is
drawn beside whichever rail holds the page (R2 decides which). The Overview
def is deleted with `renderOverview()`, its CSS, `setup-overview.py` and
`setup-overview-live.py` (rewritten to assert the landing carries the rows —
`welcome.py` already does, so the two become one). `primary` moves to
Reporting cycle, the def `menuHTML()` already falls back to.
