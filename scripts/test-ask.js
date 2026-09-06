/* THE OFFICE'S ASK, AND THE LIST IT FILLS (§299) — against a real database and
 * a stand-in for the model, because neither half can be seen anywhere else.
 *
 * WHAT MUST BE TRUE, and the order is the argument:
 *
 *   1 · OFF IS A REFUSAL ON THE SERVER. With `ask` off the corner draws no
 *       second half at all, so nothing in the product can reach the action —
 *       which is exactly why the guard is here (§42, §98.2: a switch that only
 *       hides a control is decoration).
 *   2 · IT IS A LOOKUP, NOT A CHAT. This is the section the whole design rests
 *       on: an Ask writes no chat message, moves no thread, sets nothing
 *       waiting and leaves the office's own queue exactly as it was. Asserted
 *       by measuring those rows BEFORE and AFTER, because "it worked" is true
 *       of a build that also put the office in their own queue.
 *   3 · ONLY WHAT THE ASSISTANT READ IS RECORDED. Answered and declined are
 *       rows; unreachable is not — that is a plumbing fault with its own
 *       diagnostic (§123), and a list full of rows no answer can close is a
 *       list nobody reads. Driven by making the model unreachable, not by
 *       reasoning about it.
 *   4 · A USER'S QUESTION IS RECORDED TOO, through `say`, which is the other
 *       half of Islam's ask and shares one table with the first.
 *   5 · THE LIST GROUPS THE SAME QUESTION AND NOT A SIMILAR ONE. Case, spacing
 *       and a trailing "?" are one spelling; a differently worded question is
 *       its own row, deliberately (§299: the platform must not decide two
 *       questions are the same in front of the office).
 *   6 · EVERYBODY ELSE IS REFUSED, both ends (§94.2).
 *   7 · A SAVE CANNOT REACH IT. The table sits outside the state graph beside
 *       the chat's own (§97, §288), and a save clears thirty tables.
 *
 * THE MODEL IS STOOD IN FRONT OF, NEVER BRANCHED AROUND (§100.3, §142.6).
 * `GEMINI_ENDPOINT` is an environment variable for exactly this reason, so the
 * code under test is the code that ships.
 *
 * Run: DATABASE_URL=... node scripts/test-ask.js
 */
const http = require("http");
const { Readable } = require("stream");
const pg = require("pg");
const io = require("../lib/state-io.js");
const auth = require("../lib/auth.js");

let ok = 0, bad = 0;
function check(what, cond, got) {
  if (cond) { ok++; console.log("  ok   " + what); }
  else { bad++; console.log("  FAIL " + what + (got !== undefined ? "  --  " + JSON.stringify(got) : "")); }
}

/* The stand-in. `mode` is set per assertion: what the model says is the thing
   being varied, so it is a variable rather than a second server. */
const model = { mode: "answer", calls: 0 };
function startModel() {
  return new Promise(function (resolve) {
    const srv = http.createServer(function (req, res) {
      model.calls++;
      let body = ""; req.on("data", function (d) { body += d; });
      req.on("end", function () {
        if (model.mode === "down") { res.destroy(); return; }
        if (model.mode === "refuse") {
          res.writeHead(403, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: { message: "API key not valid" } }));
          return;
        }
        const out = model.mode === "answer"
          ? { answered: true, reply: "A measure that adds up over the year is " +
              "compared with the share of its target due by the review point.",
              source: "scoring" }
          : { answered: false, reply: "", source: null };
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(out) }] } }] }));
      });
    });
    srv.listen(0, "127.0.0.1", function () { resolve(srv); });
  });
}

async function main() {
  const srv = await startModel();
  process.env.GEMINI_ENDPOINT = "http://127.0.0.1:" + srv.address().port + "/v1/models/x:generateContent";
  process.env.GEMINI_API_KEY = "AIzaTESTKEYTESTKEYTESTKEYTESTKEYTESTKEY";
  const handler = require("../api/chat.js");

  const pool = io.getPool(pg);
  let client = await pool.connect();
  await io.ensureReady(client);

  /* The office and somebody who is not — read off the seeded register rather
     than invented, so the roles are the product's own. */
  const people = (await client.query("SELECT key, role FROM people ORDER BY key")).rows;
  const officeKey = "smo";
  const outsider = people.filter(function (p) {
    return String(p.role || "") !== "super" && String(p.role || "") !== "smoteam";
  })[0];
  if (!outsider) throw new Error("the seed has nobody outside the office");

  /* THE STATE IS MADE, NOT INHERITED (§94.2). Every count below is an
     absolute — "the answered question is on the list" means one row, not one
     more than last time — so a second run against the same database would
     report a working build broken, which is exactly what the first re-run of
     this file did. The table is this file's for the length of the run; these
     scripts are documented as running against a throwaway Postgres, and the
     alternative (measuring deltas) would let a build that wrote to the wrong
     asker pass every assertion here. */
  await client.query("TRUNCATE assistant_asks");

  const sidOffice = await auth.createSession(client, officeKey);
  const sidOther = await auth.createSession(client, outsider.key);

  /* THE REQUEST IS A REAL STREAM, because the handler reads its body off one —
     a plain object with a `body` property is the shape a framework hands over
     and NOT the shape this endpoint parses, and the first run of this file
     spent every assertion on a 500 saying so (§100.3: a stand-in that models
     less than the thing it stands in for reports a working build as broken). */
  async function call(sid, body) {
    const res = { statusCode: 0, headers: {}, body: "",
      setHeader: function (k, v) { this.headers[k.toLowerCase()] = v; },
      end: function (b) { this.body = b || ""; } };
    const req = Readable.from([JSON.stringify(body)]);
    req.method = "POST"; req.url = "/api/chat";
    req.headers = { cookie: "smp_session=" + sid, "content-type": "application/json" };
    await handler(req, res);
    let j = null; try { j = JSON.parse(res.body); } catch (e) {}
    return { code: res.statusCode, body: j };
  }
  async function setting(key, val) {
    const r = (await client.query("SELECT extra FROM org WHERE id = 1")).rows[0] || {};
    const extra = r.extra || {};
    extra.chat = Object.assign({}, extra.chat || {}, { on: true });
    extra.chat[key] = val;
    await client.query("UPDATE org SET extra = $1 WHERE id = 1", [extra]);
  }
  const count = async function (sql, args) {
    return (await client.query(sql, args || [])).rows[0].n | 0;
  };

  /* ── 1 · OFF IS A REFUSAL ─────────────────────────────────────────── */
  console.log("\n1 · the switch");
  await setting("ask", false);
  let r = await call(sidOffice, { action: "ask", body: "does this reach the model" });
  check("with Ask off the office is refused", r.code === 403, r);
  check("...and the model was never called", model.calls === 0, model.calls);

  await setting("ask", true);

  /* ── 2 · A LOOKUP, NOT A CHAT ─────────────────────────────────────── */
  console.log("\n2 · nothing else moves");
  const before = {
    msgs: await count("SELECT count(*)::int n FROM chat_messages"),
    threads: await count("SELECT count(*)::int n FROM chat_threads"),
    waiting: await count("SELECT count(*)::int n FROM chat_threads WHERE waiting")
  };
  model.mode = "answer";
  r = await call(sidOffice, { action: "ask", body: "Why is my YTD compared with less than the full target?" });
  check("the office gets an answer", r.code === 200 && r.body && r.body.ok && r.body.reached, r.body);
  check("...and it is the assistant's words",
        !!(r.body.rows || []).filter(function (x) { return x.answered; }).length, r.body && r.body.rows);
  const after = {
    msgs: await count("SELECT count(*)::int n FROM chat_messages"),
    threads: await count("SELECT count(*)::int n FROM chat_threads"),
    waiting: await count("SELECT count(*)::int n FROM chat_threads WHERE waiting")
  };
  check("no chat message was written", after.msgs === before.msgs, { before, after });
  check("no conversation was started", after.threads === before.threads, { before, after });
  check("nothing is waiting on anybody", after.waiting === before.waiting, { before, after });

  /* ── 3 · ONLY WHAT THE ASSISTANT READ ─────────────────────────────── */
  console.log("\n3 · what is recorded");
  const rows0 = await count("SELECT count(*)::int n FROM assistant_asks");
  check("the answered question is on the list", rows0 === 1, rows0);
  model.mode = "decline";
  r = await call(sidOffice, { action: "ask", body: "Can a unit head reopen their own report?" });
  check("a declined question answers 200 and is reached",
        r.code === 200 && r.body.reached, r.body);
  check("...and is recorded as unanswered",
        (await count("SELECT count(*)::int n FROM assistant_asks WHERE NOT answered")) === 1);

  model.mode = "down";
  const callsBefore = model.calls;
  r = await call(sidOffice, { action: "ask", body: "this one never reaches the model" });
  check("an unreachable model still answers the office", r.code === 200, r.code);
  check("...and says it was NOT reached", r.body && r.body.reached === false, r.body);
  check("...and the model was genuinely tried", model.calls > callsBefore);
  check("...and NOTHING was recorded",
        (await count("SELECT count(*)::int n FROM assistant_asks")) === 2,
        await count("SELECT count(*)::int n FROM assistant_asks"));
  model.mode = "answer";

  /* ── 4 · A USER'S QUESTION LANDS ON THE SAME LIST ─────────────────── */
  console.log("\n4 · everybody else's questions");
  await setting("assistant", true);
  await call(sidOther, { action: "say", body: "Why is my YTD compared with less than the full target?" });
  const mine = (await client.query(
    "SELECT asker_key, office, answered FROM assistant_asks WHERE asker_key = $1",
    [outsider.key])).rows;
  check("a user's question is recorded", mine.length === 1, mine);
  check("...marked as NOT the office's", mine.length === 1 && mine[0].office === false, mine);
  check("...and their conversation still exists as it did",
        (await count("SELECT count(*)::int n FROM chat_messages WHERE person_key = $1",
                     [outsider.key])) >= 2);

  /* ── 5 · THE LIST ─────────────────────────────────────────────────── */
  console.log("\n5 · the list");
  r = await call(sidOffice, { action: "askQuestions" });
  check("the office reads the list", r.code === 200 && r.body.ok, r.body);
  const rows = (r.body && r.body.rows) || [];
  const ytd = rows.filter(function (x) {
    return x.qkey === "why is my ytd compared with less than the full target"; })[0];
  check("the same question asked twice is ONE row", !!ytd && ytd.times === 2, ytd);
  check("...by two people", !!ytd && ytd.people === 2, ytd);
  check("...asked by the office AND by somebody else",
        !!ytd && ytd.by_office === true && ytd.office_only === false, ytd);
  check("...and counted as answered", !!ytd && ytd.answered === true, ytd);
  const reopen = rows.filter(function (x) {
    return x.qkey === "can a unit head reopen their own report"; })[0];
  check("a declined question reads as unanswered", !!reopen && reopen.answered === false, reopen);
  check("...and is marked the office's alone", !!reopen && reopen.office_only === true, reopen);
  /* A DIFFERENTLY WORDED QUESTION IS ITS OWN ROW, deliberately: grouping it
     with the one above would be the platform guessing (§299). */
  model.mode = "answer";
  await call(sidOffice, { action: "ask", body: "  WHY IS MY YTD COMPARED WITH LESS THAN THE FULL TARGET???  " });
  await call(sidOffice, { action: "ask", body: "How is YTD worked out?" });
  r = await call(sidOffice, { action: "askQuestions" });
  const again = (r.body.rows || []).filter(function (x) {
    return x.qkey === "why is my ytd compared with less than the full target"; })[0];
  check("case, spacing and a trailing ? are the SAME question", again && again.times === 3, again);
  check("a differently worded question is its own row",
        (r.body.rows || []).some(function (x) { return x.qkey === "how is ytd worked out"; }));

  /* ── 6 · WHOSE LIST IT IS ─────────────────────────────────────────── */
  console.log("\n6 · both ends");
  r = await call(sidOther, { action: "askQuestions" });
  check("somebody outside the office cannot read the list", r.code === 403, r);
  r = await call(sidOther, { action: "ask", body: "and cannot ask" });
  check("...and cannot use the Ask box", r.code === 403, r);
  r = await call(sidOffice, { action: "askMine" });
  check("the office reads its own history", r.code === 200 && (r.body.rows || []).length === 4,
        r.body && (r.body.rows || []).length);
  check("...oldest first, as a conversation reads",
        (r.body.rows || []).length > 1 &&
        new Date(r.body.rows[0].at) <= new Date(r.body.rows[1].at));

  /* ── 7 · A SAVE CANNOT REACH IT ───────────────────────────────────── */
  console.log("\n7 · outside the state graph");
  const kept = await count("SELECT count(*)::int n FROM assistant_asks");
  const state = await io.readState(client);
  await io.writeState(client, state);
  check("a full save leaves every question standing",
        (await count("SELECT count(*)::int n FROM assistant_asks")) === kept, kept);

  client.release();
  await pool.end();
  srv.close();
  console.log("\n" + ok + " passed, " + bad + " failed");
  process.exit(bad ? 1 : 0);
}

main().catch(function (e) { console.error(e); process.exit(1); });
