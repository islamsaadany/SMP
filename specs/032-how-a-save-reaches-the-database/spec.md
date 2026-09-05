# 032 · How a save reaches the database

**Status:** BACKFILL of built behaviour — nothing here is new, and nothing here
is a proposal.
**Decisions:** §138 · §170 (+.2) · §184 · §195 · §204 · §210 · §215 · §216 ·
§234 · §237 · §240 · §241 (+.1 –.3) · §282 · §288 (+.1)
**Constitution:** checked against v1.2.0 — Principles III (edit the sources),
IX (one copy of a rule, both sides), X (the server decides) and XI (a record a
save can erase is not a record) carry the weight here.
**Related:** spec 006 (who may change what), spec 007 (the security floor),
spec 030 (the banners that warn before a save can be lost).

---

## 0 · Why this document exists

This is the highest-risk path in the product — it is the only one that can lose
a client's work — and it had no spec. What it does have is **eight decision
sections written across three weeks**, four of them prompted by somebody losing
work on a live deployment, and each recording one repair rather than the shape
of the thing.

The shape matters more than any one repair, because every fault on this path has
been of the same kind: *a save carried more than it meant to.* Reading the
sections in order tells you what was fixed; it does not tell you what a save now
is. This document does, written from `lib/state-io.js`, `lib/graph-diff.js` and
`api/state.js` rather than from the log.

**It changes nothing.** Where this and the product disagree, the product is
right and this file is the defect.

---

## 1 · The path, end to end

1. A field writes on `change` — i.e. on **blur** (§35) — into the in-memory
   graph. Nothing is posted yet.
2. `paint()` ends in `afterPaint()`, which schedules a save on a **leading-edge**
   debounce: the first change of a burst goes at once, the trailing timer still
   runs (§170).
3. `sync.js` builds a **change list** — what differs from the last graph the
   server acknowledged — and posts it (§210).
4. `api/state.js` opens **one transaction**, takes a **transaction-scoped
   advisory lock** (§240), reads the stored graph, **applies the change list
   onto it** (§210), authorises the result against the **stored** world
   (spec 006), writes, commits, and logs after the commit.
5. The write is **incremental** where the change shape allows and a full rewrite
   otherwise (§241); the full rewrite clears with **DELETE**, never TRUNCATE
   (§288).

Each numbered step below is one of those, and each exists because the step
before it was not enough on its own.

---

## 2 · Send what changed, and apply it onto our own copy (§210)

*"why is the whole plan is sent, why don't we just send the changed element only
not to cause this issue?"* — and it is the root that three separate faults
shared.

Every save used to post the **whole graph**, and the stored copy was thrown away
and replaced with the client's. So:

- work done before a viewer switch rode into a save under the new identity
  (§204);
- **a tab open a while silently overwrote everybody else's saved work** —
  measured against a real Postgres: an aspiration and a register rename, both
  gone, no error anywhere;
- a refusal could name any part of the product, because every part was in the
  envelope (§184).

**The shape is "apply, don't replace".** The client sends the parts it changed
and the server applies them onto the stored graph *before judging it*. Nothing
downstream changed — the authoriser still compares stored with incoming, the
writer still writes a whole graph — and that containment is why it was safe to
do in an afternoon on a live product.

`lib/graph-diff.js` is **one module both sides use** (Principle IX). Three rules
in it:

- **A key that went is not a key set to null** (`priorCycle` is legitimately
  null), so `set` and `del` are two lists.
- **A path the server does not understand is refused, never guessed at.**
- **The whole-graph path stays**, for tabs open on the previous build — refusing
  them would turn a data-safety fix into an outage mid-sentence.

Falsifiable by construction: `SMP_WHOLE_GRAPH=1` restores the old behaviour and
`scripts/test-two-tabs.js` goes from 11/11 to four failures.

---

## 3 · Finer than a part: a plan row by row (§215), a capability on its own (§216)

§210 stopped at a **top-level part**, and that was still too coarse twice over.

**§215 — a plan travels row by row.** Islam asked the right question: *"is there
any risk?"* Both halves of it were answerable. Every plan row has carried a
unique id since §191 — measured, **219 of 219**, none missing, none shared — and
adding, removing or reordering a row needs authoring rights, which are the
office's alone (§94), so the two people who share a unit **cannot change which
rows exist**. **27,600 bytes → ~200.**

- **The lists are named, never discovered** (`keyObjectives`, `items`, and
  `measures`/`tactics` inside a pillar); anything else travels whole. *The fine
  path is an optimisation and must never be the only way a change can travel.*
- **Order is part of "same rows"**, or a reorder the authoriser judges by id
  order (§101) would travel as field edits and leave the order behind.
- **The server validates every row edit before applying any** — half a save is
  worse than none.

**§216 — a capability travels on its own.** Reported from the deployment: *"the
CX is still getting errors on filling"*, with the refusal naming **a function
she had never opened**. Measured: every capability lives in the `group` part and
`group` travelled whole, so **one milestone owner sent 33,433 bytes** carrying
all eight functions' plans — and any difference anybody else had made was judged
as hers. **33,433 → 168 bytes.** Capabilities are an array inside a part, which
is exactly what §215's keyed-map split did not reach; the addressing is a
declared **tree** now, walked identically by the differ and the server.

**§234 — and `review` was the same fault a third time.** It holds four maps
keyed by target for the whole tenant (`submitted` · `parked` · `note` ·
`slides`) and travelled whole, so any save touching it carried a stale copy of
everyone's report state — **refused where the victim's rights stopped it, and
silently wiping where they did not** (the lost slides). It splits field by field
and entry by entry; `REVIEW_PER_TARGET` is exported from `graph-diff.js` and the
authoriser's per-target loop reads it, because *a field joining one list and not
the other is this fault reborn*.

---

## 4 · Saves take turns (§240)

*"what if people submit saves together — would that lose data?"* Measured, and
yes. A save is read-modify-write and there was **no lock** around the three
steps, so two overlapping saves both read the same starting state before either
wrote and the later writer overwrote the earlier one's change. Silent, and most
likely at a reporting deadline when many people save at once.

**Sequential saves were already safe** (§210's merge handles a stale tab saving
after another completes); only truly concurrent ones lost data.

The fix is one transaction with `pg_advisory_xact_lock` at the top. **It must be
transaction-scoped, not session-scoped**: production is Neon behind PgBouncer
transaction pooling, where a session lock can sit on a backend the next
statement is never routed to. The first draft used a session lock, passed on a
direct local Postgres, and **would have been a no-op on production** — §100.3, a
test must model the server.

Only the write path locks; a GET needs none. Proved and proved able to fail with
`scripts/test-concurrent-saves.js` driving the real handler: with the lock 8 of
8 survive; with `SMP_NO_SAVE_LOCK=1`, 6 of 8 are lost.

---

## 5 · Write only what changed (§241)

The full writer rewrote all 31 tables whatever changed. `writeStateIncremental`
reads the change list §210 already sends, works out which **subjects** it
touches — a business unit, a supporting function, a capability — and rewrites
only those.

- **Never wrong, only sometimes unoptimised.** `planSubjects()` returns **null**
  for every shape it does not handle and the caller runs the full writer, so an
  unrecognised shape is not a failure — it is the old behaviour.
- **Byte-identical by construction**: it uses the full writer's own builders
  (`rowsOf`, `colsFor`, `splitRow`, the `E` descriptors), lifted to module scope
  rather than copied, and `scripts/test-incremental-write.js` asserts it —
  **17 change shapes written both ways and compared**, with the optimised ones
  asserted handled and the fallbacks asserted fallen-back.
- **One DELETE clears a subject's subtree**, because the FKs already cascade.
- **Merged flag-off** behind `SMP_INCREMENTAL_WRITE`, then activated. A 120-save
  concurrency stress lost nothing either way; flag-on ran about four times
  faster.
- A save **says which writer ran** — `wrote: "incremental" | "full"` in the
  response, one `[save]` line in the log — a diagnostic, never a second decision.

Still falling back, and recorded so that adding one is a decision rather than a
discovery: a capability **reorder or add/remove**, every group-own field, and all
the settings and register tables.

---

## 6 · The clear stops shutting everybody out (§288)

*"this error always comes and manytimes the chat disappears before coming back
and disappear again."*

The full rewrite began with `TRUNCATE … CASCADE`, which takes an **ACCESS
EXCLUSIVE** lock on every table it names for the whole of §240's transaction —
so while any save ran, anywhere in the tenant, **every reader of the graph was
not slow but frozen**. Measured on a real Postgres with a save held open:

| | TRUNCATE | DELETE |
|---|---|---|
| `auth.getSession()` | blocked | 2ms |
| the chat's settings | blocked | 1ms |
| the register | blocked | 1ms |
| a unit's plan | blocked | 1ms |
| the clear itself | 44ms | 116ms |

**§282 fixed one reader and this is why that was not enough.** That section took
the register's join out of the chat's queue — true, useful, and it left three
doors standing, one of which (`getSession`) sits in front of *every*
authenticated request in the product. Patching readers one at a time was chasing
a fault with more heads than could be counted. `DELETE` takes ROW EXCLUSIVE,
which does not conflict with a reader at all.

**And the test had passed on it**, which is the part worth keeping: it held a
save open with `TRUNCATE people` — one table, where a save truncates 33. The
list is read out of `lib/state-io.js` now rather than copied (§100.3 from the
inside).

**Checked rather than assumed**, against the schema this repo builds: all 14 FKs
cascade; no table outside the list references one inside it, so the chat and the
message record stay outside the clear exactly as before; no user triggers; no
sequences.

**The cost is measured, not hoped for**: about 72ms on the clear, and dead rows
— the one that needed watching, since a graph rewritten on every save is a great
deal of churn. It is **bounded**: 160 full saves went 5.5 → 15.4 → 15.5 → 15.5 →
15.5 MB. It steps once and flattens, because the space a DELETE frees is reused.

---

## 7 · What a save is allowed to cost when it is refused (§184)

A save is **all or nothing**, so one refused row used to fail the whole post and
the only control on the banner destroyed the good work with it — which is how a
CX custodian lost three legitimate fills to one unreadable date.

The verdict carries an **address** now — target, row id, field, and the value
the row *held* — so the banner names the lines and offers to **put back those
and save the rest**. Discard stays and is never the only control again.
`undoable` is the **server's** answer, and a change to *which rows exist* offers
no button at all: one that cannot work is worse than the destructive one.

---

## 8 · The windows where work can still be lost, and what closes each

| Window | Closed by |
|---|---|
| Typing, before blur | nothing — a field writes on blur by design (§35); §219 blurs the box before leaving |
| The debounce, ~800ms | **leading-edge** debounce (§170): the first change of a burst goes at once |
| Leaving the page mid-debounce | `flushLeave()` on visibilitychange/pagehide (§138) — `keepalive` under 64KB, plain fetch over, **and that limit is stated because one SMP save is 216,307 bytes** |
| Switching viewer with work pending | flush first, as you (§204); then rebase on the server's graph (§237) |
| Two people, different fields | the change list (§210, §215, §216, §234) |
| Two people, **same field, same moment** | **not closed** — last write wins, stated rather than implied |
| A tab on an older build | the whole-graph path still accepted; the save-safety banners warn (spec 030) |
| Two overlapping saves | the advisory lock (§240) |

---

## 9 · Requirements, as things that can be checked

- **R1** A save posts what changed, never the whole graph, from any tab on the
  current build.
- **R2** The server applies onto the **stored** graph and authorises the result;
  it never trusts the incoming graph as the world.
- **R3** A path the differ does not understand is **refused**, never guessed.
- **R4** Any change shape may travel whole; the fine path is never the only way.
- **R5** Row edits are validated in full before any is applied.
- **R6** The read-modify-write runs in one transaction under a
  transaction-scoped lock.
- **R7** The incremental writer is byte-identical to the full writer for every
  shape it handles, and falls back for every shape it does not.
- **R8** The clear never takes a lock that blocks a reader.
- **R9** A refusal names the rows it refused and offers to keep the rest.
- **R10** Nothing on this path writes to the change log before the commit.

---

## 10 · Traceability

| Behaviour | Section | Check |
|---|---|---|
| Batched reads and writes (236 → 45 crossings) | §195 | round trip |
| Send what changed | §210 | `scripts/test-graph-diff.js`, `checks/save-fidelity.py` |
| Plan row by row | §215 | `scripts/test-two-tabs.js` (`SMP_WHOLE_GRAPH=1` must go red) |
| A capability on its own | §216 | `scripts/test-cx-refusal.js` |
| `review` per target | §234 | `test-graph-diff`, `test-authorize` |
| The lock | §240 | `scripts/test-concurrent-saves.js` (`SMP_NO_SAVE_LOCK=1` must go red) |
| Incremental write | §241 | `scripts/test-incremental-write.js` |
| DELETE, not TRUNCATE | §288 | `scripts/test-chat-during-save.js` |
| A refusal keeps the work | §184 | `checks/refusal-keeps-work.py` |
| Flush on leave | §138 | `checks/save-flush.py` |
| A failed save says so | §171 | `checks/save-said.py` |

**The database verification loop** (from `CLAUDE.md`, restated because this is
the spec that owns it): start a throwaway Postgres 16, then
`DATABASE_URL=… node scripts/test-roundtrip.js` — clean slate, round trip and
fixed point must all PASS — and drive the platform against
`scripts/dev-server.js` in both live and demo mode.

---

## 11 · Open, and recorded rather than done

- **Same-field, same-moment collisions are last-write-wins.** Stated in §210 and
  still true. Closing it means either field-level merge or an explicit conflict,
  and both are product decisions about what a reporter should see.
- **A failed autosave is silent unless a button was pressed** — the debounce and
  the interval both call `save()` with no callback (§160.4). §171 gave the
  pressed path a voice; the background path still has none.
- **Nothing is stored locally**, so work survives a reconnection only while the
  tab stays open (§160.4).
- **`planSubjects` falls back** for capability reorder/add-remove, group-own
  fields and every settings/register table (§241.3).
- **The one-second window in §288's own note**: for a second or two after a
  save, a renamed person can show their previous name in the chat (§282's stated
  cost).
