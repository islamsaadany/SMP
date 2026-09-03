/* ── ONE CHASE PER CONVERSATION, NOT ONE PER MESSAGE (§261) ───────────────
   Islam: "the messages emailed to me from the platform when someone sends to
   me — when I don't reply it sends an email for each message. It needs to
   compile some messages rather than an email for each message."

   BOTH HALVES OF THE SAME FAULT ARE HERE, because they are one feature seen
   from two ends: the office chased once per message from a person, and a
   person chased once per reply from the office. What is asserted is the pair —
   a build that fixed one half and not the other passes half of this file and
   fails the rest (§53.5).

   DRIVEN THROUGH THE REAL HANDLER with a mock req/res against a real Postgres,
   in the shape scripts/test-safety-peek.js and test-concurrent-saves.js use —
   and with a STAND-IN MAIL SERVICE in front of it (§142.6, §100.3), because
   what actually left the platform is the whole of what this claims and the
   only way to know it is to read it off the wire. `SMP_RESEND_ENDPOINT` is a
   deployment variable, not a branch in lib/mailer.js: a test double behind an
   `if` would be a second code path shipping to production.

   TIME IS MOVED IN THE DATABASE, never waited for. The quiet period is an hour
   by default and a check that slept through one would never be run. What is
   asserted is that a chase that is DUE goes and one that is not does not — the
   clock itself belongs to `chatChaseDue`, which is asserted directly below.

   Run: DATABASE_URL=… node scripts/test-chat-chase.js
   ──────────────────────────────────────────────────────────────────────── */
const path = require("path");
const http = require("http");
const ROOT = path.join(__dirname, "..");

/* BEFORE api/chat.js IS REQUIRED. lib/mailer.js reads the endpoint once at
   module load, which is right for a server and means the stand-in has to be
   standing before anything asks. */
const MAIL = [];
const srv = http.createServer(function (req, res) {
  let raw = "";
  req.on("data", function (c) { raw += c; });
  req.on("end", function () {
    let j = null; try { j = JSON.parse(raw); } catch (e) {}
    /* A REFUSAL ON DEMAND (§7 below): a send that fails must buy no silence. */
    if (MAIL.refuse) {
      res.writeHead(500, { "content-type": "application/json" });
      return res.end(JSON.stringify({ message: "the mail service said no" }));
    }
    MAIL.push(j || {});
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ id: "mail-" + MAIL.length }));
  });
});

(async () => {
  await new Promise(r => srv.listen(0, "127.0.0.1", r));
  process.env.SMP_RESEND_ENDPOINT = "http://127.0.0.1:" + srv.address().port;
  process.env.RESEND_API_KEY = "test-key";
  process.env.SMP_MAIL_FROM = "SMP <smp@example.com>";

  const { Pool } = require(path.join(ROOT, "node_modules/pg"));
  const io = require(path.join(ROOT, "lib/state-io.js"));
  const auth = require(path.join(ROOT, "lib/auth.js"));
  const Rules = require(path.join(ROOT, "lib/rules.js"));
  const handler = require(path.join(ROOT, "api/chat.js"));

  function mockRes() {
    let resolve;
    const done = new Promise(r => (resolve = r));
    return { statusCode: 200, setHeader() {},
             end(body) { resolve({ status: this.statusCode, body: body }); }, done };
  }
  /* A REAL READABLE, because api/chat.js STREAMS its body — it refuses an
     oversized one while it arrives rather than after (§71), so there is no
     `req.body` shortcut to hand an object to, and a stub with an inert `on()`
     simply hangs for ever. A stand-in that models less than the thing it
     stands in for is not a stand-in (§231.5, §100.3). */
  const { Readable } = require("stream");
  async function call(cookie, body) {
    const res = mockRes();
    const req = Readable.from([JSON.stringify(body)]);
    req.method = "POST"; req.url = "/api/chat";
    req.headers = { cookie: cookie, "content-type": "application/json" };
    handler(req, res);
    const r = await res.done;
    let j = null; try { j = JSON.parse(r.body); } catch (e) {}
    return { status: r.status, j: j };
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
  let fail = 0;
  const check = (w, ok, x) => {
    console.log((ok ? "  ok    " : "  FAIL  ") + w + (ok || x == null ? "" : "  — " + x));
    if (!ok) fail++;
  };
  const c = await pool.connect();
  try {
    io.forgetReady();
    await io.ensureReady(c);
    await c.query("UPDATE credentials SET must_change = false WHERE person_key = 'smo'");
    /* The office needs an address to be chased at, and the asker one to be
       chased AT — both on the register, because the server resolves every
       address from the stored register and never from a request (§74.2). */
    await c.query(
      "UPDATE people SET extra = COALESCE(extra,'{}'::jsonb) || '{\"email\":\"office@example.com\"}'::jsonb " +
      " WHERE key = 'smo'");
    await c.query(
      "INSERT INTO people (key, idx, name, extra) VALUES " +
      " ('asker', 901, 'Asking Person', '{\"email\":\"asker@example.com\"}'::jsonb) " +
      "ON CONFLICT (key) DO UPDATE SET extra = EXCLUDED.extra, name = EXCLUDED.name");
    /* Chat settings, written where the endpoint reads them (org.extra.chat).
       The assistant stays OFF: it would answer some of these and end the
       waiting spell, and what is under test is what happens while a
       conversation waits. */
    await c.query(
      "UPDATE org SET extra = COALESCE(extra,'{}'::jsonb) || " +
      " '{\"chat\":{\"on\":true,\"notify\":true,\"rep\":\"smo\",\"mail\":true,\"assistant\":false}}'::jsonb " +
      " WHERE id = 1");

    const smo = "smp_session=" + await auth.createSession(c, "smo");
    const her = "smp_session=" + await auth.createSession(c, "asker");
    const say = (t) => call(her, { action: "say", body: t });
    const reply = (t) => call(smo, { action: "reply", person: "asker", body: t,
                                     html: "<p>" + t + "</p>", subject: "A reply" });
    const thread = () => call(smo, { action: "thread", person: "asker" });
    const chased = async () => (await c.query(
      "SELECT chased_at, chased_them_at FROM chat_threads WHERE person_key = 'asker'")).rows[0] || {};
    const toOffice = () => MAIL.filter(m => (m.to || []).indexOf("office@example.com") >= 0);
    const toHer = () => MAIL.filter(m => (m.to || []).indexOf("asker@example.com") >= 0);
    const ageChase = (col, mins) => c.query(
      "UPDATE chat_threads SET " + col + " = now() - ($1 || ' minutes')::interval " +
      " WHERE person_key = 'asker'", [String(mins)]);

    console.log("\n1 · the office is chased once, not once per message");
    for (const t of ["First one", "Second one", "Third one", "Fourth one", "Fifth one"]) {
      const r = await say(t);
      if (r.status !== 200) check("say was accepted (" + t + ")", false, r.status + " " + JSON.stringify(r.j));
    }
    check("five messages, one email", toOffice().length === 1, toOffice().length + " emails");
    check("...and it names the person", /Asking Person/.test((toOffice()[0] || {}).subject || ""),
          (toOffice()[0] || {}).subject);
    check("...and the conversation remembers being chased", !!(await chased()).chased_at);

    console.log("\n2 · after a long silence it chases again, and COMPILES");
    await ageChase("chased_at", 61);
    await say("Sixth one");
    const second = toOffice()[1];
    check("a second email went", toOffice().length === 2, toOffice().length + " emails");
    check("...its subject counts all six", /6 messages waiting/.test((second || {}).subject || ""),
          (second || {}).subject);
    check("...and it carries every unanswered message, not just the newest",
          ["First one", "Second one", "Third one", "Fourth one", "Fifth one", "Sixth one"]
            .every(w => (second || {}).html && second.html.indexOf(w) >= 0));
    check("...and points at the page by its own name",
          /Platform Inbox/.test((second || {}).html || ""));

    console.log("\n3 · replying ends the spell, and the next message chases at once");
    /* She is HERE for this one, so the reply's own away chase does not fire and
       what is counted below is unambiguous. */
    await c.query("UPDATE chat_threads SET here_at = now() WHERE person_key = 'asker'");
    const rr = await reply("Here is your answer");
    check("the reply is accepted", rr.status === 200, rr.status + " " + JSON.stringify(rr.j));
    check("...and it is not emailed to somebody sitting in the platform",
          rr.j && rr.j.here === true && toHer().length === 0, JSON.stringify(rr.j && rr.j.mailed));
    check("...and the office's chase is forgotten", !(await chased()).chased_at);
    await say("A new question, next morning");
    check("so the next message chases straight away", toOffice().length === 3, toOffice().length + " emails");
    check("...and it counts only this spell", /A question is waiting/.test((toOffice()[2] || {}).subject || ""),
          (toOffice()[2] || {}).subject);

    console.log("\n4 · and the same rule going the other way (§261, the away chase)");
    await c.query("UPDATE chat_threads SET here_at = now() - interval '2 hours' WHERE person_key = 'asker'");
    const r1 = await reply("Reply one");
    const r2 = await reply("Reply two");
    const r3 = await reply("Reply three");
    check("three replies to somebody away, one email", toHer().length === 1, toHer().length + " emails");
    check("...the first says it went", r1.j && r1.j.mailed && r1.j.mailed.sent === true,
          JSON.stringify(r1.j && r1.j.mailed));
    check("...and the others SAY why they did not, rather than going quiet",
          [r2, r3].every(r => r.j && r.j.mailed && r.j.mailed.sent === false &&
                              /already been emailed/.test(r.j.mailed.why || "")),
          JSON.stringify(r2.j && r2.j.mailed));
    check("...and the message tag is only on the reply that left (§188)",
          (await c.query("SELECT count(*)::int AS n FROM chat_messages " +
                         " WHERE person_key = 'asker' AND emailed_to IS NOT NULL")).rows[0].n === 1);

    console.log("\n5 · the office is shown the same rule before it presses Send (§97.5)");
    const th = await thread();
    check("the thread carries when they were last chased",
          th.j && th.j.chasedThemAt != null, JSON.stringify(th.j && th.j.chasedThemAt));
    check("...and the shared rule agrees with the server's own answer",
          Rules.chatChaseDue(th.j.chasedThemAt, Date.now(), 60) === false);

    console.log("\n6 · coming back to the platform ends the away spell");
    await call(her, { action: "mine" });
    check("her own poll clears it", !(await chased()).chased_them_at);
    await c.query("UPDATE chat_threads SET here_at = now() - interval '2 hours' WHERE person_key = 'asker'");
    await reply("Reply four, next day");
    check("so leaving again is chased afresh", toHer().length === 2, toHer().length + " emails");

    console.log("\n7 · a send that failed buys no silence");
    await c.query("UPDATE chat_threads SET chased_at = NULL WHERE person_key = 'asker'");
    const before = toOffice().length;
    MAIL.refuse = true;
    await say("A question nobody will be told about");
    MAIL.refuse = false;
    check("nothing went", toOffice().length === before, toOffice().length + " emails");
    check("...and nothing was remembered", !(await chased()).chased_at);
    await say("And another");
    check("so the next message chases rather than waiting out an hour",
          toOffice().length === before + 1, toOffice().length + " emails");

    console.log("\n8 · the rule itself, at both ends (§94.5)");
    check("never chased → due", Rules.chatChaseDue(null, Date.now(), 60) === true);
    check("chased a minute ago → not due",
          Rules.chatChaseDue(Date.now() - 60000, Date.now(), 60) === false);
    check("chased two hours ago → due",
          Rules.chatChaseDue(Date.now() - 7200000, Date.now(), 60) === true);
    check("a time that will not read → due, never silent",
          Rules.chatChaseDue("not a time", Date.now(), 60) === true);
    check("...and the quiet period is the setting, not a number written twice",
          Rules.chatChaseDue(Date.now() - 10 * 60000, Date.now(), 5) === true &&
          Rules.chatChaseDue(Date.now() - 10 * 60000, Date.now(), 60) === false);

    console.log("\n9 · and the flood is what it was before (§94.2, the other end)");
    /* WITHOUT THIS THE WHOLE FILE PASSES ON A BUILD THAT SENDS NOTHING AT ALL.
       Every assertion above is satisfied by a mailer that never fires, so one
       of them has to prove an email still goes out for the right reason. */
    check("a first message on a fresh spell still emails somebody",
          toOffice().length >= 4 && /Asking Person/.test(toOffice()[toOffice().length - 1].subject || ""));

  } finally {
    await c.query("DELETE FROM chat_messages WHERE person_key = 'asker'").catch(() => {});
    await c.query("DELETE FROM chat_threads WHERE person_key = 'asker'").catch(() => {});
    await c.query("DELETE FROM people WHERE key = 'asker'").catch(() => {});
    c.release();
    await pool.end();
    srv.close();
  }
  console.log(fail ? "\n" + fail + " FAILED" : "\nall ok");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
