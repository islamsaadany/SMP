/* ── A DELETED PERSON'S DOOR GOES WITH THEM (§69) ────────────────────────
   The hole this proves closed: person keys are MINTED FROM THE NAME
   (mintPersonKey), and `credentials` is not in ALL_TABLES because it must
   survive the TRUNCATE every save does. So before this, deleting "Ahmed Ali"
   and adding "Ahmed Ali" again handed the new person the deleted person's
   password — silently, because both sign-in and getSession JOIN `people` and
   the join succeeds again the moment the key comes back.

   Asserted against a REAL Postgres, because that is the only place the
   interaction between a TRUNCATE, a table deliberately outside it and a
   re-minted key actually happens.

     DATABASE_URL=postgres://... node scripts/test-person-purge.js
*/
const fs = require("fs");
const path = require("path");
const pg = require("pg");
const io = require("../lib/state-io.js");
const auth = require("../lib/auth.js");

const fail = [];
function ok(label, cond, extra) {
  console.log((cond ? "PASS  " : "FAIL  ") + label + (extra ? "  " + extra : ""));
  if (!cond) fail.push(label);
}

(async function () {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const dir = path.join(__dirname, "..", "db");
  await io.ensureReady(client, dir);

  /* A tenant with somebody in it, and a door for them. The seed is cleared by
     migration 004, so the register is built here rather than borrowed. */
  const state = JSON.parse(fs.readFileSync(path.join(dir, "seed-state.json"), "utf8"));
  const keep = state.people[0].key;
  const goes = "ahmedali";
  state.people = [state.people[0], { key: goes, name: "Ahmed Ali", title: "Analyst" }];
  await io.writeState(client, state);

  const hash = auth.hashPassword("first-password");
  for (const k of [keep, goes]) {
    await client.query(
      "INSERT INTO credentials (person_key, password_hash, must_change) VALUES ($1,$2,false) " +
      "ON CONFLICT (person_key) DO UPDATE SET password_hash = EXCLUDED.password_hash", [k, hash]);
    await client.query(
      "INSERT INTO sessions (token_hash, person_key, expires_at) VALUES ($1,$2, now() + interval '30 days') " +
      "ON CONFLICT (token_hash) DO NOTHING", ["tok-" + k, k]);
    await client.query(
      "INSERT INTO bu_declarations (person_key, at) VALUES ($1,'mobile') " +
      "ON CONFLICT (person_key) DO NOTHING", [k]);
  }
  const count = async (t, k) =>
    +(await client.query("SELECT count(*) n FROM " + t + " WHERE person_key = $1", [k])).rows[0].n;

  ok("the door exists before the delete",
     (await count("credentials", goes)) === 1 && (await count("sessions", goes)) === 1 &&
     (await count("bu_declarations", goes)) === 1);

  /* THE DELETE ITSELF: a save whose register no longer holds the person. That
     is the only signal the server gets — there is no delete endpoint. */
  state.people = [state.people[0]];
  await io.writeState(client, state);

  ok("credentials purged",     (await count("credentials", goes))     === 0);
  ok("sessions purged",        (await count("sessions", goes))        === 0);
  ok("declaration purged",     (await count("bu_declarations", goes)) === 0);
  ok("the person who STAYED keeps all three",
     (await count("credentials", keep)) === 1 && (await count("sessions", keep)) === 1 &&
     (await count("bu_declarations", keep)) === 1);

  /* THE HOLE: the same name comes back and mints the same key. Without the
     purge this reads `true` — the new person signs in with the old one's
     password on their first day. */
  state.people = [state.people[0], { key: goes, name: "Ahmed Ali", title: "Analyst" }];
  await io.writeState(client, state);
  const cred = (await client.query(
    "SELECT password_hash FROM credentials WHERE person_key = $1", [goes])).rows[0];
  ok("a re-minted key inherits NO password", !cred,
     cred ? "(inherited " + cred.password_hash.slice(0, 12) + "…)" : "");

  /* AND WHAT MUST NOT BE PURGED. Both are records rather than doors: a log a
     save can erase is not a log (§42), and login_attempts says so in its own
     migration (§43.4). */
  /* NO .catch() HERE. The first version wrote a column change_log does not
     have and swallowed the error, so the row was never inserted and the
     assertion below failed on a table that was fine — CLAUDE.md's "a check
     that asks whether it can run is a check that passes", caught by the
     assertion rather than by the insert. It throws now. */
  await client.query(
    "INSERT INTO change_log (person_key, person_name, kind, target, what) " +
    "VALUES ($1,$2,'setup',$3,$4)", [goes, "Ahmed Ali", "group", "changed a target"]);
  await client.query("INSERT INTO login_attempts (key_tried, ip) VALUES ($1,'1.2.3.4')", [goes]);
  state.people = [state.people[0]];
  await io.writeState(client, state);
  const logs = +(await client.query(
    "SELECT count(*) n FROM change_log WHERE person_key = $1", [goes])).rows[0].n;
  const tries = +(await client.query(
    "SELECT count(*) n FROM login_attempts WHERE key_tried = $1", [goes])).rows[0].n;
  ok("the change log keeps the departed key", logs > 0, "(" + logs + " rows)");
  ok("failed sign-ins are kept too", tries > 0, "(" + tries + " rows)");

  /* AN EMPTY REGISTER PURGES EVERYTHING — which is what the clean slate leaves
     (migration 004 keeps one person, but a tenant that emptied itself must not
     keep a password that opens it). */
  state.people = [];
  await io.writeState(client, state);
  const left = +(await client.query("SELECT count(*) n FROM credentials")).rows[0].n;
  ok("an empty register leaves no credential standing", left === 0, "(" + left + " left)");

  await client.end();
  console.log(fail.length ? "\nFAILED: " + fail.join(", ") : "\nall good");
  process.exit(fail.length ? 1 : 0);
})().catch(function (e) { console.error("FAIL:", e); process.exit(1); });
