# Phase J — the cutover, step by step

**Stop point E and F.** Everything below is either a Vercel setting, a switch
Islam turns on for one deploy, something he presses in the product, or the
merge — which is his word, on that merge, every time (CLAUDE.md §4). There is
**no SQL to paste and no connection string anywhere**: the two steps that
cannot be said in SQL run from Vercel's own environment (§315.1).

---

## The order, and why it is this order

| | Step | Who |
|---|---|---|
| 1 | **Merge the branch to `main`** — production does not move | Islam's word, Claude runs it |
| 2 | Set the environment variables that are new | Islam, Vercel |
| 3 | Turn on the two one-deploy switches | Islam, Vercel |
| 4 | **Point the project at `smp-app/`** and redeploy — this is the cutover | Islam, Vercel |
| 5 | Turn the two switches back off | Islam, Vercel |
| 6 | Press **Add a client** twice: *RHI*, *El Abd* | Islam, in the product |
| 7 | Walk the what-to-check list | Islam |

**Why the merge moves nothing.** The repository's root `package.json`
deliberately has no build script (§2.5), so the live deployment is the static
frozen site plus `api/*.js`; `smp-app/` is not built by it and is not served.
Merging puts the new app on `main` and changes not one byte of what anybody
opens — which is what makes step 1 safe to do first and separately, and what
`§91.5`'s live read confirms rather than assumes.

**Why the switches come before the root directory.** The moment the project
builds `smp-app/`, the shared schema is what serves every client — and a
shared schema with no tenants in it has nobody on it to sign in. So the deploy
that flips the root directory must be the SAME deploy that carries Raya Trade
across; otherwise the site is dark between the two.

---

## 2 · The environment variables, by name

Already there from the frozen deployment, and read unchanged: `DATABASE_URL`
and `DATABASE_URL_UNPOOLED` (the Neon integration's; §313.34 asks for the
unpooled one first and this reads it the same way), `GEMINI_API_KEY`,
`GEMINI_MODEL`, `RESEND_API_KEY`, `SMP_MAIL_FROM`, `BLOB_READ_WRITE_TOKEN`,
`VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` where they were set.

**New, and it matters:** `SMP_APP_PASSWORD`.

The app does not connect as the database's owner — it connects as `smp_app`, a
role that cannot create anything and that `FORCE ROW LEVEL SECURITY` applies
to, which is the whole of what makes one shared schema as strong as the
schemas it replaces (§314, spike S1). `db/apply.mjs` makes that role and sets
its password from this variable, and `lib/db.ts` signs in with it. **Left
unset it defaults to the word `smp_app`**, which is fine on a laptop and is a
password on a production database. Set it to something long, in Vercel, before
step 4.

`SMP_APP_URL` is the alternative to it — a whole connection string for
`smp_app` — and is not needed when the password is set.

---

## 3 · The two switches

Both are read by `smp-app/scripts/deploy.mjs`, which `npm run build` calls
before `next build`. Both refuse themselves once they have run, so the switch
decides WHEN rather than whether — and **neither runs on a preview**, because
a preview build gets production's environment and a branch is not where a
tenant should be created.

| Variable | Set to `1` for the cutover deploy | What it does |
|---|---|---|
| `SMP_CARRY_RAYA` | yes | `scripts/migrate-raya.mjs` — Raya Trade's graph, its nine outside-the-graph tables, and its accounts with their password hashes verbatim |
| `SMP_SEED_DEMO` | yes | `scripts/seed-demo.mjs` — the worked example under the `demo` tenant, renamed, refused twice if a real name survives |

**Turn them off after** (step 5). Leaving them on costs nothing but a refusal
in every build log, and a switch left on is a switch somebody later reads as
meaning something.

### The one cost, stated

The carry reads the frozen `raya_trade` schema **while the frozen site is
still serving** — the build runs, then the deployment is promoted. A figure
somebody enters in those minutes is carried and then lost. It cannot be
guarded, only sequenced: do it when nobody is reporting (§316.9 said the same
thing and this is where it lands).

**Everybody signs in again, and nothing had to be written to make that
happen.** Phase J's row asked for a one-shot `DELETE FROM sessions`; reading
the carry removed the need for it — `migrate-raya.mjs` copies the password
hashes and **not one session**, so the shared schema's `sessions` table starts
empty and every person signs in once, by construction. A migration that
deleted nothing would be ceremony (§24).

---

### And the Framework Preset must say Next.js (§317.8)

The frozen site had no framework, so the project's preset was **Other** — and
with Other, Vercel runs the build and then serves `public/` as plain files.
For the new app that is a folder of scripts and icons with no page at `/`:
**a build with no errors and a 404 on every address**, Vercel's own
`NOT_FOUND`, with Next's real output built and never looked at. Settings →
Build and Deployment → **Framework Preset → Next.js**, the four overrides
left off. A changed build setting is picked up by a NEW deployment (a push),
not a redeploy.

**And preview deployments are protected** — every address answers 302 to a
Vercel sign-in unless the browser is signed in to Vercel — so a preview
cannot be read from outside by `curl`; what it serves is read in the
browser, or on production once promoted.

## 3b · The room the shared schema lives in (§317.4)

**`public` on the real database is a CLIENT.** When spec 042 split the clients
into a schema each, the one that already existed stayed where it stood — so
`public` holds Raya Trade's 47 live tables and `platform.clients` says
`raya-trade → public` in a column. `elabd` is the second client; there is no
`raya_trade` schema and never was.

Everything here was built and proved against databases whose `public` was
empty, which is the one shape that cannot show this. The first real build
stopped one table in — `relation "sessions" already exists` — inside a
transaction that rolled back, so nothing was written. **What it was about to
do is the reason this is written down**: schema.sql's row-level-security loop
reads the catalogue and then ALTERs whatever it finds, and pointed at `public`
it would have enumerated a client's live tables and attached policies to them.

So the shared schema has a room of its own, `smp`, named once in
`db/schema-name.mjs` and read by the applier, the grants, both pools, Prisma's
adapter, the carry and the demo seed. **`public` is deliberately not left in
the search path behind it** — a fallback there resolves a missing table
silently to a client's live one. `npm run check:room` builds the real
database's shape and refuses if an apply reaches it; `--break=public` is red.

**And the carry is aimed by the registry, never by a constant.** It said
`raya_trade`, which does not exist: a carry that finds no graph carries
nothing, and that is a cutover onto an empty platform rather than an error
anybody notices in time. It reads `platform.clients.schema_name` now and says
which room it found.

**One thing to know if the carry ever fails halfway.** It writes the tenant's
registry row and commits it before copying the tables, so that a second run
refuses itself. A run that fails AFTER that leaves the row behind and the
retry refuses — the way out is one line in Neon's SQL editor,
`DELETE FROM smp.tenants WHERE key = 'raya-trade';`, and then deploy again.

## 4 · The project setting

**Root Directory → `smp-app`**, and **“Include source files outside of the
Root Directory” must stay on**: the app reads the frozen product's own
sources at runtime (`lib/frozen.cjs`, `next.config.ts`'s
`outputFileTracingIncludes`) and the frozen `vercel.json` at build time for
the security headers (§43.6). That is not new to this step — it is how the app
has been built since Phase B — but it is the one setting that would fail
silently at build rather than loudly at runtime.

The domain follows the project, so nothing about DNS changes.

### Two switches on that same settings page, and one of them takes the site down

Both were met on the day (2026-09-10) and neither is guessable from the
outside, so they are written down here rather than rediscovered.

**"Skip deployments when there are no changes to the root directory or its
dependencies" MUST BE OFF.** It tells Vercel to build only when something
inside `smp-app/` changed — and this app deliberately reads files from OUTSIDE
its own folder: the frozen product's sources, `platform.html`, `sw.js`, and
`vercel.json` for the security headers (§316.10). So a commit touching only
those genuinely changes what the app serves and Vercel would skip it: §317 was
a change to `platform.html` alone and would never have deployed. **And a
skipped deployment is marked Ready with NO OUTPUT** — promote one to
production and the domain answers 404 on every address, which is what
happened: not the old site, not the new one, `x-vercel-error: NOT_FOUND` on
`/`, `/platform`, `/raya-trade` and `/demo` alike. The way back is one press:
Deployments → the last good Production row → **Promote to Production**.

**AND `.vercelignore` DECIDED IT BEFORE EITHER OF THEM.** §238 wrote that
file for the FROZEN deployment, which served the whole repository as static
files, so everything internal had to be named in it — **`smp-app/` among
them**. With the Root Directory pointed at the app, Vercel cloned, removed
2046 ignored files, deleted the app, and built nothing: *"Build output
contains no functions, static, or services directory"*, **13ms**, an empty
deployment marked **Ready** that answered **404 on every address**. Nothing
in a build log says *you excluded the thing you asked me to build*; it says
the output is empty, which reads like a hundred other faults. Rewritten at
§317.3, with every pattern anchored — a bare `scripts/` matches at any depth
and would have deleted `smp-app/scripts/` next — and
`npm run check:deploy` refuses if the file swallows anything the app reaches
for, derived from build.py's own list rather than kept beside it.

**AND "REDEPLOY" IS NOT A WAY TO PICK UP A SETTING.** Redeploying an existing
deployment reuses what that deployment was built with, so a redeploy of a
commit that was built as the OLD static site rebuilds it as the old static
site — 10 and 28 seconds against the minutes a real build of this app takes.
**The build time is the tell, and it is readable before the build finishes.**
A setting change is picked up by a NEW deployment, which means a new commit
(or Deploy Hook), never a redeploy of an old one.

**The way back** is the same setting: put the Root Directory back and the
frozen site returns exactly as it was — the carry READS the frozen schemas and
writes nothing to them. What a revert costs is anything typed into the NEW
stack after the cutover, which is why the check list below is walked before
anybody is asked to work in it.

---

## 5 · What to check, in the words of the navigation

Open **the client's own door** (`/raya-trade/sign-in`) — the sign-in card, the
client's name and mark on it, and the password you already had. Then:

1. **Group → Performance.** The units and their scores, as they were.
2. **A unit → Strategy → Plan.** Your pillars, measures and tactics; open the
   pen on one, change a word, leave the box, reload — it stayed.
3. **A unit → Reporting.** Enter one figure, *Save draft*, reload.
4. **A supporting function → Projects.** A capability, its projects,
   its milestones.
5. **Presentation → Present.** The deck opens; the arrows move it; *Escape*
   comes back.
6. **Setup → People.** The register, the seats, the passwords column.
7. **The chat bubble**, bottom right — write to the office and see it arrive
   in **Setup → Platform Inbox**.
8. **Import & storage → Download** — a plan workbook opens in Excel.
9. **Forefront's own page** (`/platform`) — the client cards, and
   **Add a client** twice: *RHI*, then *El Abd*. Each opens on its own name
   with an empty plan and the builder as the way in.
10. **The demo** — its card is not in the client grid; it stands on its own
    beneath it, under *The worked example* (§317). Open it: the worked example,
    with nobody real in it.

And one that is not a screen: on any page, the browser's console should log
**no 404 for `/sw.js`** — that file is served now, it carries the
notifications and it stores nothing (§316.10).
