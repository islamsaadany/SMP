# SMP — Implementation Progress

How things are going, in one place. Updated in the same commit as the work it
describes. This replaces sending the built HTML and the project zip after every
version (rules A2 / A11, changed 2026-08-20) — those go only when asked for.

**Where it runs:** Vercel, production tracks `main`. Static files plus two
serverless functions (`/api/state`, `/api/auth`) against Neon Postgres.
**Latest version:** v2.1 · **Last updated:** 2026-08-20

---

## Waiting on Islam

Nothing proceeds past this line without an answer.

| # | Decision needed | Why it is blocking | Recorded |
|---|---|---|---|
| **D1** | **Stack: stay on the current one, or move to the HR_ERP stack?** | v2.1 was built on the current stack **without this being confirmed** — the question was asked, came back as a question, and the build went ahead anyway. Everything from Phase 2 onward compounds on the answer. | §19 of the decisions doc, and the answer written out in chat 2026-08-20 |
| **D2** | Phase 2 scope — go ahead as described below, or reshape it? | It is the next build and it is not started. | §19.2 |
| **D3** | Is the deployed demo content acceptable in the open? | Only Mobile's plan is real; everything else is invented and labelled. Anyone with the URL and an issued password sees it. | §13 |

---

## Built and verified

### v2.1 — identity *(current)*
Real sign-in on the deployed product. The gate is a login (person key +
password, scrypt-hashed, httpOnly session); `/api/state` requires a session; a
signed-in person sees their own view; the SMO issues temporary passwords from
Levels & access and every issued password must be changed on first use. The
viewer switcher survives only as the SMO's read-only simulation and in the
offline file. Bootstrap: `smo` / `4123`, must-change.

*Verified:* full flow in a real browser against a throwaway Postgres 16 —
bootstrap forced a change; the SMO issued Mennah Farouk a password; she was
forced to change it, saw only Group and Mobile, reported a figure that landed in
its exact row; her temporary password was refused afterwards; unauthenticated
access bounced to the gate. Offline QA walk clean for all 29 viewers.

### v2.0 — the state moved into the database
Schema (the §4 hierarchy + configuration + cycle as real tables), seed generated
mechanically from the platform sources, one endpoint reading and writing the
whole state, schema and seed applied on first contact with an empty database
under an advisory lock. Offline the file still runs on baked data.

*Verified:* round-trip deep-equal (seed → write → read → identical) and
`write(read())` a fixed point; seed-once / no-reseed; browser edits landing in
their exact rows; QA walk clean over HTTP and file://.

### v1.9 — the last prototype gaps closed
Capability card + Cards/Table toggle (§16.6) · capability project import and
export, idempotent for all eight capabilities (§16.4) · presentation mode for a
supporting function · the rail on a unit's My reporting (§15.12 fully cleared).

*Verified:* byte-identical rebuild, QA walk for all 29 viewers, plus a browser
suite per feature.

---

## In flight

Nothing. The last build (v2.1) is merged to `main` and the working tree is
clean.

---

## Next, in order

| Phase | What it is | Blocked by |
|---|---|---|
| **2** | **Per-action writes.** The whole-state save is replaced by one endpoint per action (report a figure, edit a plan, change a config, mark focus, submit/reopen), each **validated on the server** against the cycle rules — so enforcement stops being the browser's word. Carries the **per-figure change log** (§16.0a): *this measure read 48%, changed to 62% by Omar at 11:40*. Also: sign-in rate limiting. | D1, D2 |
| **3** | **The cycle, server-side.** Closing a cycle writes real snapshot rows; deltas read from them; import review and apply move to the server. | Phase 2 |
| **4** | Multi-tenant (Raya beside ELABD, §1) and strategy versions (§16.10). | Phase 3 |

**Longer-term backlog**, unchanged and unstarted: source teams (§16.7), the help
box (§16.8), the rest of people-and-credentials (§16.9 — Phase 1 took the login
half), images in review mode (§16.11). **Open model questions** still open:
§11 (year-end rollover, mid-year tactic removal, the ELABD single-company
shape, optional pillar-measure weighting).

---

## Known limits of what is deployed

Stated here rather than discovered later.

1. **Authorization is at the door, not per action.** A signed-in person is
   authenticated, but their browser is still trusted about *what* changed.
   Phase 2 closes it.
2. **Last writer wins.** Saves replace the whole state transactionally; two
   people editing at once will not corrupt anything, but the second overwrites
   the first.
3. **No self-service password recovery.** A forgotten password is reset by the
   SMO, which also ends that person's sessions.
4. **Usernames are person keys** (`own_mob`, `mobhead`), shown to the SMO beside
   the Set-password control. Real emails are §16.9 work.
5. **The demo content is invented** except Mobile's plan, and labelled as such
   in the product.

---

## Where the pieces live

| Path | What |
|---|---|
| `index.html` | The gate — real login when served with a database, legacy AdminSMO latch offline |
| `SMP-Project-Folder/src/` | The platform's sources; `build.py` assembles the single file, `qa.py` walks every page as every viewer |
| `SMP-Project-Folder/strategy-management-platform-v2.1.html` | The built platform (must rebuild byte-identical from `src/`) |
| `SMP-Project-Folder/DECISIONS-AND-LOGIC-v2.1.md` | Every decision with its reasoning — the contract |
| `db/` | `schema.sql`, `migrations/`, `seed-state.json` (generated) |
| `lib/`, `api/` | State reader/writer and auth; the two endpoints |
| `scripts/` | `extract-state.js` (regenerate the seed), `test-roundtrip.js`, `dev-server.js` |
| `specs/` | Per-feature specifications (spec-kit) |

**The verification loop before any handover:** rebuild byte-identical → `qa.py`
walk → `DATABASE_URL=… node scripts/test-roundtrip.js` (must print PASS twice) →
`node scripts/dev-server.js` and drive it in a browser.
