# Implementation Plan: Database persistence

**Spec**: `spec.md` · **New**: `db/schema.sql`, `db/seed-state.json`,
`lib/state-io.js`, `api/state.js`, `scripts/extract-state.js`,
`src/sync.js`, `package.json`, `vercel.json` · **Touched**:
`SMP-Project-Folder/src/shell.html` (boot + afterPaint hooks),
`SMP-Project-Folder/src/build.py` (include sync.js)

## Architecture

Vercel serves the repo statically (unchanged) plus `/api/state` as a Node
serverless function. `package.json` carries only the `pg` dependency and **no
build script**, so the static deploy is untouched. `vercel.json` exists solely
to include `db/**` files in the function bundle.

The state is one object graph — `{ group, units, unitKeys, functions,
functionKeys, people, unitRoles, levels, access, labels, bands, weighting,
koWeights, cycle, review, history }` — the same shapes the front end already
holds. `lib/state-io.js` owns both directions:

- `writeState(client, state)`: in one transaction, delete the tenant's rows
  and insert the graph. Known columns are listed per entity **once**; every
  other field on an object lands in that row's `extra` JSONB and is merged
  back on read — which is what makes the deep-equal round trip provable.
- `readState(client)`: assemble the graph back, ordered by the stored `idx`.
- `ensureReady(client)`: advisory lock → run `db/schema.sql` (all
  `CREATE TABLE IF NOT EXISTS`) → if `org` is empty, `writeState(seed)`.
  A migrations registry arrives when the schema first changes; recorded.

`scripts/extract-state.js` evaluates `group-data.js` + `config-data.js` in a
sandbox and emits `db/seed-state.json` — the seed is the sources, mechanically.

`src/sync.js` (inside the built file): `SYNC.boot(paint)` paints immediately,
then on http(s) fetches `/api/state`, hydrates the globals **in place**
(mutating the arrays/objects the closures capture), and repaints.
`SYNC.afterPaint()` serializes the graph, hashes it, and POSTs when it differs
from the last saved hash, debounced 800ms. `file://` or a failed GET disables
sync for the session.

## Fidelity rules

- Ids are written and read verbatim — never regenerated on hydrate
  (config-data assigns ids only to objects that lack them).
- Numbers stay numbers, strings stay strings, null stays null (`extra` JSONB
  preserves types; typed columns chosen only where the type is certain).
- Order is data: every list writes `idx` and reads ordered by it — the
  arrangement feature depends on this.
- Derived scores are never written (§5.1); `units[].weight` is recomputed by
  `syncWeights()` from the factor table after hydration, exactly as on load.

## Constitution check

- III/IV: sync.js joins the build; byte-identical + QA walk discipline holds;
  everything proven against a throwaway local Postgres before handover.
- V: only authored/reported content is stored.
- VI: no screen changes at all.
- VIII: the seed is the platform's own labelled demo content, not invented
  fresh.
- Server-authoritativeness of access is explicitly deferred to §16.9 and
  recorded as such — the grant matrix persists but is not yet enforced
  server-side.
