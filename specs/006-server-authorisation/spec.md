# 006 · The server decides who may change what

**Status:** proposed, awaiting Islam's read of §3.
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
| **A unit's plan** — its pillars, measures, tactics, targets, directions, SWOT, key objectives | §31: a plan is authored by upload and corrected by the SMO alone. A plan correctable by the person measured against it is a different product. |
| Opening, chasing and closing a cycle; imports; archived plans | The cycle is run from the SMO's side |

### A unit's own people may change

| | Who exactly |
|---|---|
| **The reporting** — a measure's actual, its progress and its note; a tactic's status, its actual and its note | The unit's owner, its strategy custodian, and any contributor attached to that unit — plus the SMO |
| The unit's own foundation words, where the platform lets them be typed | Owner and custodian |

A supporting function's reporting works the same way, for its head and its
custodian.

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

## 7 · What I need Islam to decide

1. **A locked cycle.** Should the server refuse reporting saves once a cycle
   is locked? I propose yes — a locked cycle that still accepts numbers is not
   locked. The SMO stays able to correct.
2. **Contributors.** A contributor is named on a particular measure or tactic.
   Should they be able to write only the rows they are named on, or all of
   their unit's reporting? The matrix today says the whole unit. Narrowing it
   is stricter and more work; I propose leaving it as the matrix says.
3. **A tactic's quarters** (which quarters it runs in) — plan, or reporting? I
   propose plan, so only the SMO changes them.

---

## 8 · How it will be verified

- A throwaway Postgres, and a scripted attempt at the escalation in §1 —
  it must be refused, and the refusal must name the reason.
- Every role in the demo tenant saving what they are entitled to save, and
  being refused what they are not. This is the test that catches a rule
  written too tightly, which is the real risk of this change.
- The existing round trip, clean slate and fixed-point tests unchanged.
- QA's 31 viewers, zero console errors; byte-identical rebuild.
