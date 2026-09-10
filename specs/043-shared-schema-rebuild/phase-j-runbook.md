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

## 4 · The project setting

**Root Directory → `smp-app`**, and **“Include source files outside of the
Root Directory” must stay on**: the app reads the frozen product's own
sources at runtime (`lib/frozen.cjs`, `next.config.ts`'s
`outputFileTracingIncludes`) and the frozen `vercel.json` at build time for
the security headers (§43.6). That is not new to this step — it is how the app
has been built since Phase B — but it is the one setting that would fail
silently at build rather than loudly at runtime.

The domain follows the project, so nothing about DNS changes.

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
10. **The demo** (`/demo`) — the worked example, with nobody real in it.

And one that is not a screen: on any page, the browser's console should log
**no 404 for `/sw.js`** — that file is served now, it carries the
notifications and it stores nothing (§316.10).
