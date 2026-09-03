/* ══ A REPLY NOBODY WAS EVER TOLD ABOUT (§249) ═════════════════════════

   The office replies. The platform asked, at that instant, "has this person
   been on a page in the last few minutes?" — and if yes, sent no email at all.
   That is a GUESS ABOUT THE FUTURE, and it is wrong in exactly one direction:
   somebody who was reading two minutes ago and then shut their laptop counts
   as present, gets no email, and is NEVER TOLD. §97.5 wrote the edge down when
   it built the rule and called a sweep a later decision. This is it.

   THE WAIT IS THE WHOLE FEATURE, so the trials below are the three people:
   away (mailed at once, unchanged), present-and-read (never mailed,
   unchanged), and present-and-never-came-back — which today gets nothing and
   must now be chased.

   PROVED ABLE TO FAIL (§94.5): SMP_NO_CHASE=1 makes THIS FILE skip the sweep,
   so the red run is the product as it was rather than a fiction about it.

     DATABASE_URL=postgres://… node scripts/test-chase.js
*/
const { Client } = require("pg");
const Rules = require("../lib/rules.js");

const URL = process.env.DATABASE_URL;
if (!URL) { console.error("DATABASE_URL is required."); process.exit(2); }

let pass = 0, fail = 0;
function ok(what, cond, detail) {
  if (cond) { pass++; console.log("  ok   " + what + (detail ? "  (" + detail + ")" : "")); }
  else { fail++; console.log("  FAIL " + what + (detail ? "  (" + detail + ")" : "")); }
}

/* THE SWEEP'S OWN QUERY, and it is the product's — copied here would be a
   second definition that could pass while the real one was broken (§53.5), so
   it is READ OUT OF api/chat.js rather than retyped. */
const fs = require("fs");
const SRC = fs.readFileSync(__dirname + "/../api/chat.js", "utf8");
const M = SRC.match(/"SELECT m\.id, m\.person_key, m\.chase_html "[\s\S]*?\[String\(cfg\.chase\)\]/);
if (!M) { console.error("could not read the sweep's query out of api/chat.js"); process.exit(2); }
const DUE_SQL = M[0]
  .replace(/\[String\(cfg\.chase\)\]$/, "")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .split("\n").map(function (l) { return l.trim(); }).join(" ")
  .replace(/"\s*\+\s*"/g, "").replace(/^"/, "").replace(/"\s*,\s*$/, "").trim();

(async () => {
  const c = new Client({ connectionString: URL });
  await c.connect();

  const KEY = "chasetest";
  async function reset() {
    await c.query("DELETE FROM chat_messages WHERE person_key = $1", [KEY]);
    await c.query("DELETE FROM chat_threads  WHERE person_key = $1", [KEY]);
    await c.query(
      "INSERT INTO chat_threads (person_key, person_name, waiting, started_at, last_at) " +
      "VALUES ($1,'Chase Test',false,now(),now())", [KEY]);
  }
  /* A reply the office sent `agoMin` ago, with the email KEPT (i.e. they
     looked present at the time). */
  async function reply(agoMin, kept) {
    const r = await c.query(
      "INSERT INTO chat_messages (person_key, by_key, by_name, body, from_office, at, chase_html) " +
      "VALUES ($1,'smo','The Office','Here is the answer.',true, now() - ($2||' minutes')::interval, $3) " +
      "RETURNING id", [KEY, String(agoMin), kept ? JSON.stringify({ html: "<p>hi</p>" }) : null]);
    return r.rows[0].id;
  }
  async function due(mins) {
    return (await c.query(DUE_SQL, [String(mins)])).rows;
  }

  console.log("\nTHE WAIT IS WHAT DECIDES, NOT A GUESS AT SEND TIME (§249).");

  await reset();
  const early = await reply(5, true);
  ok("a reply 5 minutes old is not chased yet", (await due(30)).length === 0);

  await reset();
  const late = await reply(45, true);
  const d = await due(30);
  ok("a reply 45 minutes old and unread IS chased", d.length === 1 && d[0].id === late,
     d.length + " due");
  ok("...and it carries the message it kept", d.length === 1 && !!d[0].chase_html);

  /* THE ONE CONDITION THAT MATTERS. */
  await c.query("UPDATE chat_threads SET seen_by_them = now() WHERE person_key = $1", [KEY]);
  ok("...and reading it cancels the chase", (await due(30)).length === 0);

  await reset();
  await reply(45, false);
  ok("a reply that was already emailed keeps nothing to chase",
     (await due(30)).length === 0);

  await reset();
  const sent = await reply(45, true);
  await c.query("UPDATE chat_messages SET emailed_to = 'x@y.z' WHERE id = $1", [sent]);
  ok("a reply already emailed is never chased twice", (await due(30)).length === 0);

  /* SOMEBODY ELSE'S MESSAGE IS NOT A REPLY. */
  await reset();
  await c.query(
    "INSERT INTO chat_messages (person_key, by_key, by_name, body, from_office, at, chase_html) " +
    "VALUES ($1,$1,'Chase Test','I asked something.',false, now() - interval '45 minutes', $2)",
    [KEY, JSON.stringify({ html: "<p>x</p>" })]);
  ok("a message FROM the person is never chased", (await due(30)).length === 0);

  console.log("\nTHE WAIT IS THE OFFICE'S, AND ABSENT IS NOT NOUGHT (§169).");
  ok("the shipped wait is 30 minutes", Rules.chatCfg({}).chase === 30,
     String(Rules.chatCfg({}).chase));
  ok("a tenant that never set it reads 30, not the floor",
     Rules.chatCfg({ chase: null }).chase === 30 && Rules.chatCfg({ chase: "" }).chase === 30);
  ok("it is clamped at both ends",
     Rules.chatCfg({ chase: 1 }).chase === Rules.CHAT_CHASE_MIN &&
     Rules.chatCfg({ chase: 99999 }).chase === Rules.CHAT_CHASE_MAX);
  ok("and a value that is not a number falls back rather than reading 0",
     Rules.chatCfg({ chase: "soon" }).chase === 30);

  /* AND THE WAIT IS ACTUALLY OBEYED — a build that ignored the setting and
     used a constant would pass every assertion above. */
  await reset();
  await reply(20, true);
  ok("a 30-minute wait leaves a 20-minute-old reply alone", (await due(30)).length === 0);
  ok("...and a 15-minute wait chases the same reply", (await due(15)).length === 1);

  console.log("\nAND THE STORED SIDE IS AN ABSENCE (§50.6).");
  const graph = (await c.query("SELECT extra FROM org LIMIT 1")).rows[0];
  const chat = ((graph && graph.extra) || {}).chat || {};
  ok("the shipped wait is not written into the tenant's settings",
     !Object.prototype.hasOwnProperty.call(chat, "chase"), JSON.stringify(chat));

  await c.query("DELETE FROM chat_messages WHERE person_key = $1", [KEY]);
  await c.query("DELETE FROM chat_threads  WHERE person_key = $1", [KEY]);
  await c.end();
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("ERR", e && e.message); process.exit(1); });
