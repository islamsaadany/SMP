# Spec 046 — one repo or several, and where the line actually runs

**Status:** a question Islam asked on 2026-09-13 — *"I have various modules that
can join this repo. when would I keep them on different repos and when should I
bring them into 1 repo, given that I want them integrated on the client
platform"* — answered here. **Nothing is built and no file moves.** This page is
the reasoning, so the next person deciding it is not deciding it from scratch.

**Depends on:** §320 / this spec (four modules on one spine), §313 (one door,
many clients), §314 (the shared schema).

**Reverses:** nothing.

---

## 1 · The decision

**One repository, for anything that runs inside the client platform.** A module
becomes a folder, not a repository.

A separate repository is right only when the thing has stopped being a module
and become either a **separate product** or a **service**. §4 gives the four
tests; any one of them is enough.

This is not a preference about tidiness. It follows from what a module is
already required to share, which §2 measures.

---

## 2 · What a module shares, measured

§4.2 of the spec says a module must bring five things of its own: its
navigation, its roles and areas, its Setup group, its rhythm, and a landing.
Read the other way, that list is also a statement of what it does **not**
bring — and the half it does not bring is the expensive half.

Measured on the tree as it stands:

| What is shared | Where it lives today | What a second repo would have to do |
|---|---|---|
| **The tenant boundary** | `lib/tenant.ts` — `withTenant()` is the one way tenant data is reached: `BEGIN · SET LOCAL app.tenant_id · COMMIT`, on the app pool as `smp_app`, with row-level security forced. With no setting every tenant table reads **empty** rather than everybody's. | Hold a second copy of the one line the whole client boundary rests on, or open the database another way. Two answers to *which client is this* (§53.5), on the question where being wrong is worst. |
| **The door and the session** | `lib/door.ts`, `lib/session.ts`, `lib/auth.ts` — the httpOnly cookie, the seat on the client, the refusals. | Share a cookie across origins, or sign in twice. |
| **The address** | One route handler — `app/(platform)/[slug]/[...rest]/route.ts` — reads which modules the client has and only then decides what the address names. | A proxy in front choosing which deployment answers, and two deployments that must agree about the client list and the module list. |
| **Which modules a client has** | `lib/modules.ts`, read by **seven hand-written places** (the route, the landing, the platform console's API, the trial module, the shell's own browser file, and two checks) plus two generated copies under `public/`. | Publish that list across a repo boundary, or keep a second copy of it. |
| **Roles & access** | One page, a Client tab and a tab per module (§4.4). The page has to know every module by definition. | — |
| **Setup, branding, the register, the people** | Spine, all of it. | — |
| **The schema and the migrations** | `scripts/deploy.mjs` applies `db/schema.sql` plus every migration on **every build**, in one transaction under a transaction-scoped lock; a failure fails the build. | Two builds, each applying its own copy of the schema to one database. |

The last row is the practical one. Two repositories means two deploy pipelines
both running migrations against the same Postgres. The lock stops them
corrupting each other; it does not stop them **disagreeing** about what the
schema is. That is §289's fault with a much longer fuse.

### 2.1 · Why the drift would be silent

`lib/modules.ts` says in its own first lines why the module list is declared
once: so that a fifth module is *an entry there* rather than an edit in the
console, the switcher and Setup — which is how two screens come to spell one
module differently (§53.5). A separate repository re-creates by hand exactly
the drift that file exists to prevent.

And it would drift **without anything going red**, which is the part that makes
it expensive rather than merely annoying. This project has already paid for that
lesson at a much shorter distance: §329 exists because `smp-app/public/` is
generated from the frozen sources and **tracked**, so a source edited without
re-running a generator left production serving the old bytes with nothing
comparing the two. A repository boundary is the same gap, much wider, and no
check can span it — `checks/modules.mjs` asserts facts that are true *across*
modules (that a module the client does not hold falls through to the legacy
branch; that the switcher lists exactly what they hold), and a check cannot
assert that about code it cannot see.

---

## 3 · Why not to split "for isolation"

The honest form of the argument for splitting is: *a module should not be able
to break another one.* That is a real want, and a repository is the wrong
instrument for it — it buys the isolation at the price of the integration,
which is the thing Islam actually asked for.

The cheaper instruments, in order:

1. **A folder per module** (`smp-app/modules/portfolio/…`) holding that module's
   navigation, roles, Setup group and landing.
2. **A package boundary** inside the repo — an explicit list of what a module
   may reach on the spine, and what it may never touch — if and when a team
   boundary appears.
3. **A repository**, only when one of §4's tests is true.

Steps 1 and 2 give almost all of the isolation. Step 3 is the only one that also
gives up shared checks, shared types, one deployment, one migration path and
atomic changes across the seam.

---

## 4 · The four tests for a separate repository

Any one of these, and split. None of them, and do not.

1. **It is sold to somebody who is not an SMP client.** It has customers of its
   own and a release cycle the platform must not be tied to.
2. **Someone else builds it** and must not have push rights to the platform's
   code.
3. **It holds data the platform must not be able to read.** A genuinely
   different security boundary — not merely a different subject.
4. **It is a service, not a module.** It answers over HTTP, holds no client
   rows, and could be swapped for a third party tomorrow.

Test 4 already has instances, and naming them is what keeps the test honest:
the mail sender (`lib/mailer.cjs`) and the clip store are exactly this shape —
named endpoints, configured per deployment, replaceable, and deliberately not
code in this tree. Neither of them is a module, and neither ever appears in the
switcher.

### 4.1 · What the four named modules score

| Module | 1 · Sold separately | 2 · Built by others | 3 · Data we must not read | 4 · A service | Verdict |
|---|---|---|---|---|---|
| **Strategy** | no | no | no | no | this repo |
| **Portfolio** | no | no | no | no | this repo |
| **Insights** | no | no | no — *Forefront publishes it* (§4.3) | no | this repo |
| **Processes** | no | no | no — *Forefront publishes it* (§4.3) | no | this repo |

None of the four passes any test. All four are the client's own data, in the
client's own tenant, behind the client's own door, written by Forefront or by
the client through the matrix.

---

## 5 · The open item, and it is the one that matters

This decision is the cheap half. The expensive half is still unwritten:

> **Where does the line between spine and module run in the code?**

Today it is implicit — Strategy **is** the shell. `lib/shell.ts` serves the
frozen platform; `lib/trial.ts` serves a small document of its own; and the
route handler chooses between them with a branch that says, in its own comment,
that it is a branch rather than a table *because there are two of them*.

That branch is correct at two and stops being correct at three. Before Portfolio
is built, the following need naming rather than discovering:

- **What a module may reach on the spine.** The tenant, the session, the
  register, branding, the save path — as a declared list, not as whatever it
  happens to import.
- **What a module may never touch.** Another module's rows, the client registry,
  the access matrix's other tabs.
- **How a module declares itself.** `MODULE_DEF` already holds the label, the
  note and `built`. The contract asks for five things (§4.2) and the file
  carries the part every surface needs *today*; the other four are
  `lib/shell.ts`-shaped and unwritten.
- **Who serves a module's document**, once "a branch for two" no longer holds.

Doing this with **two** modules is far cheaper than doing it with four, and it
is what makes the second module cheap rather than the second module being the
thing that teaches us where the line was.

---

## 6 · What this does not decide

- **Whether Portfolio is one deployable or many.** It is one repository; how
  many things Vercel builds from it is a separate question, and today the
  answer is one.
- **What Portfolio contains.** Still unspecified (§8 of the spec); it needs its
  own spec.
- **Anything about the frozen single-file build.** `SMP-Project-Folder/` is the
  offline product and is untouched by this.

---

## 7 · What would change the answer

Written down so that reversing it is a decision rather than a drift. Any of:

- A module gains customers outside SMP's clients (test 1).
- A team is brought in who must not hold push rights (test 2).
- A module is asked to hold material under a different confidentiality regime —
  a client's legal or HR records, say — where *the platform's own code should
  not be able to read it* is the requirement rather than *this client's staff
  should not* (test 3).
- A module stops holding client rows entirely and becomes something we call
  over HTTP (test 4).

Short of one of those, the repository stays one.
