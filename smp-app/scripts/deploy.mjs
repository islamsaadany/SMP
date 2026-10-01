/* WHAT RUNS AT DEPLOY (spec 043 Phase J, stop point E).

   Islam runs database work through Neon's SQL editor only (§315.1), so every
   step that cannot be pasted as SQL runs HERE — from Vercel's own
   environment, where the connection string already lives and nobody has to
   hold it. This is called from `npm run build`, before `next build`, because
   a bootstrap on a request path is what §98 measured the cost of and what
   §289 found failing under a burst.

   THREE STEPS, AND TWO OF THEM ARE SWITCHES HE TURNS ON FOR ONE DEPLOY:

   1 · The schema and the migrations — EVERY build, `db/apply.mjs`, one
       transaction under a transaction-scoped lock. A failure fails the
       build, because a deployment whose schema did not apply must not ship.

   2 · Raya Trade carried across — only when `SMP_CARRY_RAYA=1`. It refuses
       by construction once a `raya-trade` tenant exists, so the switch is
       not what makes it safe; what the switch buys is WHEN, and when is the
       whole cost (phase-i-runbook §2): the carry reads the frozen schema
       while the frozen site may still be taking writes, so a figure entered
       between the read and the address moving is carried and then lost.
       That is a sequence Islam controls — set the variable, deploy, move the
       address — and it cannot be turned into a guard.

   3 · The demo seeded — only when `SMP_SEED_DEMO=1`. Refuses to overwrite a
       demo somebody has practised in unless `--replace` is passed by hand,
       or the switch says `SMP_SEED_DEMO=replace`: the demo's CONTENT is
       swapped and the tenant, and everybody given it, stays (seed-demo.mjs).
       Like `1`, it is a switch to turn off again — left on, every production
       deploy resets the demo.

   NEITHER SWITCH RUNS ON A PREVIEW. A preview build gets production's
   environment unless somebody has scoped it, and a preview that carried a
   tenant into the production database would be a data change nobody asked
   for, arriving from a branch.

   AND THERE IS NO `DELETE FROM sessions`, WHICH PHASE J'S ROW ASKED FOR.
   Reading the carry is what removed it: `scripts/migrate-raya.mjs` copies
   the accounts' password hashes VERBATIM and deliberately does not copy a
   single session, so the shared schema's `sessions` starts empty and every
   person signs in once on the new stack whatever we do here. A one-shot
   migration deleting nothing would be ceremony, and a migration that looks
   load-bearing and is not is worse than none (§24). Said rather than
   quietly dropped. */
import { applyAll } from "../db/apply.mjs";
import { applyFfp } from "../db/apply-ffp.mjs";

const url = process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING
  || process.env.DATABASE_URL || process.env.POSTGRES_URL;
const onVercel = !!process.env.VERCEL;
const production = !onVercel || process.env.VERCEL_ENV === "production";
const asked = (v) => process.env[v] === "1";

if (!url) {
  if (onVercel) { console.error("deploy: no database connection string in the environment — a deployment cannot ship without one"); process.exit(2); }
  console.log("deploy: no connection string here, so nothing was applied (a local build; on Vercel this is an error)");
  process.exit(0);
}

/* THE APP'S OWN PASSWORD IS REFUSED HERE, NOT BY THE DATABASE (§317.5).
   Unset, `SMP_APP_PASSWORD` falls back to the literal word `smp_app` — fine
   on a laptop, a password on a production database — and Neon says so at
   COMMIT, in its control plane's words, three files into a transaction and
   with a stack trace from `pg`: "insecure password, try including more
   special characters…". Correct, and it names neither the variable nor the
   place to set it. This is the same refusal one step earlier and in the
   product's own words (§124, §171: a failure that cannot be acted on is a
   failure reported twice). Only where a deployment is being built — the
   spike and a laptop pass their own password to applyAll and never come
   through here. */
const pw = process.env.SMP_APP_PASSWORD || "";
if (onVercel && (pw.length < 12 || !/[a-z]/.test(pw) || !/[A-Z0-9]/.test(pw))) {
  console.error("deploy: SMP_APP_PASSWORD is " + (pw ? "too weak" : "not set") +
    " — the app signs in to the database with it on every request, and the database refuses a weak one.");
  console.error("deploy: set it in the Vercel project's environment variables to something long, with upper and lower case and a digit, then deploy again.");
  process.exit(2);
}

const applied = await applyAll(url);
console.log("deploy: schema and migrations up to date" + (applied.length ? " — applied " + applied.join(", ") : " (nothing new)"));
/* Processes' own tables (FFProcess, carried in whole) — their own schema,
   after SMP's, because they are granted to the role SMP's run makes. */
const ffpApplied = await applyFfp(url, { log: () => {} });
console.log("deploy: Processes tables up to date" + (ffpApplied.length ? " — applied " + ffpApplied.length + " migrations" : " (nothing new)"));

if (asked("SMP_CARRY_RAYA")) {
  if (!production) console.log("deploy: SMP_CARRY_RAYA is set but this is a preview — the carry does not run here");
  else {
    const { migrateRaya } = await import("./migrate-raya.mjs");
    /* A SWITCH LEFT ON IS A LINE IN THE LOG, NOT A FAILED BUILD (§317.9). The
       runbook has always said so and the code threw: the carry refuses
       itself once the tenant exists, and an uncaught refusal here failed the
       build that was completing the cutover — the one AFTER the carry had
       run, so the site stayed down until somebody found the switch. Only the
       refusal is caught; anything else in the carry still fails the build. */
    try {
      await migrateRaya({ from: url, to: url });
      console.log("deploy: Raya Trade carried across — turn SMP_CARRY_RAYA off; it refuses itself from here on");
    } catch (e) {
      if (!/already exists — this runs once/.test(String(e.message))) throw e;
      console.log("deploy: SMP_CARRY_RAYA is still on and the carry has already run — nothing done; turn it off");
    }
  }
}

/* FFProcess's own data carried into a client's Processes (2026-10-01).
   SMP_CARRY_FFPROCESS holds the OLD workspace's id or exact name (not "1"),
   FFPROCESS_DATABASE_URL the old database — set in Vercel, never pasted in a
   chat. It copies into an EMPTY workspace once and refuses itself after, so a
   switch left on is a line in the log rather than a failed build (§317.9). */
const ffFrom = process.env.SMP_CARRY_FFPROCESS || "";
if (ffFrom) {
  if (!production) console.log("deploy: SMP_CARRY_FFPROCESS is set but this is a preview — the carry does not run here");
  else if (!process.env.FFPROCESS_DATABASE_URL) console.log("deploy: SMP_CARRY_FFPROCESS is set but FFPROCESS_DATABASE_URL is not — nothing carried");
  else {
    const { carryFfprocess } = await import("./carry-ffprocess.mjs");
    try {
      await carryFfprocess({
        source: process.env.FFPROCESS_DATABASE_URL, target: url, from: ffFrom,
        to: process.env.SMP_CARRY_FFPROCESS_TO || "rhi",
        sourceSchema: process.env.FFPROCESS_SOURCE_SCHEMA || "public",
        apply: true, log: (m) => console.log(m),
      });
      console.log("deploy: Processes carried across — turn SMP_CARRY_FFPROCESS off; it refuses itself from here on");
    } catch (e) {
      if (!/already holds/.test(String(e.message))) throw e;
      console.log("deploy: SMP_CARRY_FFPROCESS is still on and the workspace already holds data — nothing done; turn it off");
    }
  }
}

const demoReplace = process.env.SMP_SEED_DEMO === "replace";
if (asked("SMP_SEED_DEMO") || demoReplace) {
  if (!production) console.log("deploy: SMP_SEED_DEMO is set but this is a preview — the demo is not seeded here");
  else {
    const { seedDemo } = await import("./seed-demo.mjs");
    try {
      await seedDemo({ url, replace: demoReplace });
      if (demoReplace) console.log("deploy: the demo's content is replaced — turn SMP_SEED_DEMO off, or every deploy resets it");
      else console.log("deploy: the demo is seeded — turn SMP_SEED_DEMO off");
    } catch (e) {
      if (!/already|practised|--replace/.test(String(e.message))) throw e;
      console.log("deploy: SMP_SEED_DEMO is still on and the demo is already seeded — nothing done; turn it off");
    }
  }
}
