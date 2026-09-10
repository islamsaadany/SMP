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
       demo somebody has practised in unless `--replace` is passed by hand.

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

if (asked("SMP_CARRY_RAYA")) {
  if (!production) console.log("deploy: SMP_CARRY_RAYA is set but this is a preview — the carry does not run here");
  else {
    const { migrateRaya } = await import("./migrate-raya.mjs");
    await migrateRaya({ from: url, to: url });
    console.log("deploy: Raya Trade carried across — turn SMP_CARRY_RAYA off; it refuses itself from here on");
  }
}

if (asked("SMP_SEED_DEMO")) {
  if (!production) console.log("deploy: SMP_SEED_DEMO is set but this is a preview — the demo is not seeded here");
  else {
    const { seedDemo } = await import("./seed-demo.mjs");
    await seedDemo({ url });
    console.log("deploy: the demo is seeded — turn SMP_SEED_DEMO off");
  }
}
