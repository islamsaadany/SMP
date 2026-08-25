# 006 · The server decides who may change what

**Status:** BUILT (2026-08-21). §7's three questions answered by Islam and folded in below.
**Closes:** §19.2 (per-action authorisation) and the change log, as one piece
of work rather than two.

---

## 1 · What is wrong today

`POST /api/state` checks that you are signed in and nothing else. It then
wipes all thirty tables and writes back whatever arrived — including the
register of people, the roles, and the access matrix itself.

So the lowest-privilege person in the tenant can post a state that makes them
the SMO, and on their next request they are: issuing passwords, resetting
anyone's, reading and changing everything. They do not need a flaw to do it.
The browser already builds and sends that exact object; they would only have
to change one field on its way out.

**Everything in v3.10's access work — the seven roles, the forty-nine cells,
own versus other — currently decides what a screen OFFERS. It does not decide
what the server ACCEPTS.**

---

## 2 · The rule the fix rests on

On every save the server reads what it already holds, works out what changed,
and refuses any change the person's roles do not allow.

Two things about that sentence carry the whole design:

**The person's roles are read from the STORED state, never from the incoming
one.** Otherwise a save could grant itself the role that authorises it, in the
same request. This is the single most important line in the build.

**The rules are one file, run on both sides.** The browser already answers
"may this person edit this?" to decide what to draw (`grantAt`, `roleOwns`,
`personRoles` in `config-data.js`). The server needs the same answer to decide
what to accept. Two copies of that logic are two copies that will drift, and
the drift would be silent — a screen that offers an edit the server then
refuses. So the rules move into one module that `build.py` inlines into the
platform and Node `require`s. Same rule, one copy, cannot disagree. This is
§33's pattern applied to authorisation.

---

## 3 · Who may change what — READ THIS PART

Everything below is what the platform's current rules already say, written out
in plain words. If any line is wrong about how a real engagement works, it is
the line that changes — not the code.

### Only the SMO may change

| | Why |
|---|---|
| The register of people — adding, retiring, titles, seat roles | It is the SMO's page (§35) |
| Who owns a unit, who is its custodian, who heads a function | Same fact, either surface (§33) |
| The access matrix itself | The thing that decides everything else |
| Units, companies, supporting functions — adding, renaming, retiring | Setup |
| Labels, bands, capabilities | Setup |
| Weighting — the factors and each unit's values | A group decision, not a unit's |
| The group's aspiration, end in mind, mission, clauses, key objectives, themes, horizon | The group's own strategy |
| **The whole Strategy tab of a unit or a function** — pillars, measures, tactics, targets, directions, key objectives; the aspiration, end in mind and clauses; the SWOT; a capability's definition and its projects | §31, widened by §93 (Islam, 2026-08-25). A plan correctable by the person measured against it is a different product — and so is an *aspiration* correctable by them. The five pages are `STRATEGY_PAGES` in `lib/rules.js`; `mayAuthorPage()` is the one question the screen and the server both ask. |
| Opening, chasing and closing a cycle; imports; archived plans | The cycle is run from the SMO's side |

### A unit's own people may change

| | Who exactly |
|---|---|
| **The reporting** — a measure's actual, its progress and its note; a tactic's status, its actual and its note | The unit's owner, its strategy custodian, and any contributor attached to that unit — plus the SMO |
| ~~The unit's own foundation words~~ | **Reversed by §93** — the aspiration, the end in mind and the clauses moved to the SMO's list above. Kept here struck through rather than deleted: what changed is the answer, and the question was a real one. |

A supporting function's reporting works the same way, for its head and its
custodian. **Reporting is deliberately untouched by §93**: the unit of that
decision is the PAGE and not the area, because `a_unit_own` also carries
Performance and My reporting — closing the area would have taken reporting away
in order to withhold authoring.

### Rules that override the table

| | |
|---|---|
| Focus measures are marked by the group CEO (and the SMO) | §37 |
| The knowledge base is readable by everyone | §37 |
| **Nothing may be written to a locked cycle** — by anyone but the SMO | Proposed here; see §7 |

---

## 4 · What happens when a save breaks a rule

The whole save is refused, and the answer names what was refused: *"Retail
Stores' targets cannot be changed here — a plan is corrected by the SMO."*

Refusing the whole save rather than the disallowed part of it is deliberate.
A partial save leaves the browser holding a picture of the tenant that the
database does not share, and the next save writes that picture back — so a
half-accepted save is a slower way of accepting all of it.

---

## 5 · The change log

The diff that authorises the save is the diff that gets written down. One
table: who, when, what changed, from what to what. It costs nothing extra
because the comparison has already been done.

This is what makes "who moved this target" answerable, which today it is not.

---

## 6 · What this touches

| | |
|---|---|
| `api/state.js` | The check, on POST |
| A new `lib/rules.js` | The role and grant logic, moved out of `config-data.js` |
| `SMP-Project-Folder/src/config-data.js` | Calls the moved functions instead of holding them |
| `src/build.py` | Inlines `lib/rules.js` into the single file |
| A new migration | The change-log table |
| **No screen** | Nothing is redrawn, nothing is relaid out |

The single-file offline handover keeps working: with no server there is
nothing to save to, so the rules are only ever the browser's own answer there
— exactly as today.

---

## 7 · Answered

1. **A locked cycle refuses reporting.** Yes. The SMO stays able to correct.
2. **Contributors view; if allowed, their own lines only.** Both halves are
   built. The shipped default for a contributor's own unit moves from `edit`
   to `view` (migration 011, and only where the tenant still holds the old
   default). And "their lines only" is a RULE WITH TEETH in `lib/rules.js`, so
   a tenant that has `edit` stored still cannot touch anybody else's rows.
   Submitting the report, and the unit's note on the cycle, speak for the whole
   unit — so a contributor limited to their own lines does neither.

   One weakness, recorded rather than hidden: `owner` and `collaborators` hold
   a TYPED NAME, not a link to a person, so "named on" is matched against the
   key and the name. Two people with the same name collide, and a renamed
   person loses their rows. A measure names nobody at all, so it is matched
   against the owner of the pillar it sits under. **The Finance custodian work
   adds a real per-measure owner; this tightens the day that lands.**
3. **A tactic's quarters are plan.** Only the SMO moves them — otherwise a
   tactic that was due in Q2 and did not happen can be dragged to Q4, and the
   record of what was promised stops being a record.

## 8 · One thing the browser found that the tests did not

`branding()` created `GROUP.branding = {palette:null, font:null, accent:null,
bar:null}` the first time anything asked, while an untouched tenant's database
held no branding at all. The two could never become equal, so **every save
carried a group change nobody made** — and the moment the server started
checking, every non-SMO save was refused, permanently, with a message naming
nothing useful.

Sixty-seven unit tests and ten end-to-end API tests all passed while this was
true, because they built their payloads from the seed rather than from a
running browser. It took signing in as a unit head and typing a number.

Two things came out of it. `sync.js` drops an all-null branding the same way
it already zeroes a derived weight — **what is not the tenant's own is not
sent**. And the unrecognised-change refusal now NAMES the fields that moved:
a refusal nobody can diagnose is a bug report addressed to nobody.

---

## 9 · Verified

- `node scripts/test-authorize.js` — **67 checks, 0 failures**. Escalation,
  reach, the locked cycle, the contributor rule, a retired person, and — the
  half that matters more — every role doing its own legitimate work without
  being refused.
- A throwaway Postgres 16 and the real API end to end: sign in, save, be
  refused. **10 checks, 0 failures.** A unit head cannot make themselves the
  SMO, cannot rewrite their own plan, cannot widen the matrix; can report their
  own figure, and it lands.
- The change log holds `mobhead · Data duplicate rate · actual · 1.4% → 51%`.
- The platform driven in a browser as a unit head and as the SMO: 12 reportable
  fields offered, a legitimate report saved silently, a plan change refused
  with the banner shown, no console errors.
- Round trip, clean slate and fixed point unchanged: PASS.
- QA's 31 viewers × every page, zero console errors; byte-identical rebuild.
- Cost: **~240ms** per save against a local Postgres with the ten-unit example,
  where the extra read is the whole of the added work.
