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
  /* REVERSED BY §303, AT ISLAM'S WORD, AND REWRITTEN RATHER THAN DELETED
     (§218). §299 wrote NOTHING here — an unreached ask left no trace at all —
     on the reasoning that such a row would fill the office's list with
     something no answer can close. He asked for it back on the strength of his
     own case: he asked, nothing came back, and the platform said nothing had
     happened. What keeps §299's point intact is not silence but the STATE: it
     is recorded, and recorded as unreached rather than declined, so it joins
     no gap count and offers no answer to write. Asserted as that distinction
     rather than as a total, which is what a count of rows could never say. */
  check("...and it IS recorded now, as its own state",
        (await count("SELECT count(*)::int n FROM assistant_asks")) === 3,
        await count("SELECT count(*)::int n FROM assistant_asks"));
  const notReached = (await client.query(
    "SELECT reached, answered, answer FROM assistant_asks " +
    " WHERE question = 'this one never reaches the model'")).rows[0];
  check("...as unreached, which is not declined",
        !!notReached && notReached.reached === false && notReached.answered === false &&
        notReached.answer === null, notReached);
  check("...while the declined one stays reached",
        (await count("SELECT count(*)::int n FROM assistant_asks " +
                     " WHERE NOT answered AND reached")) === 1);
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
  /* FIVE, NOT FOUR, SINCE §303: the ask that never reached the model is one of
     them. Rewritten rather than loosened (§218) — the number is the point, and
     the corner showing the question that vanished is the whole of what he
     asked for. */
  check("the office reads its own history", r.code === 200 && (r.body.rows || []).length === 5,
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

  /* ── 8 · THE THIRD STATE, AND THE OFFICE'S OWN HALF (§303) ────────── */
  console.log("\n8 · both halves of the history");
  await setting("ask", true);
  await client.query("TRUNCATE assistant_asks");

  /* THE QUESTION THAT VANISHED. §299 wrote nothing when the model could not be
     reached, so a question asked into a broken connection left no trace
     anywhere — which is exactly what Islam met. Recorded now, and recorded as
     its OWN state: not answered, not declined, NOT REACHED. */
  model.mode = "down";
  const lost = await call(sidOffice, { action: "ask", body: "Does an unreachable ask leave a trace?" });
  check("an ask nobody could reach still answers the corner honestly",
        lost.code === 200 && lost.body && lost.body.reached === false, lost.body && lost.body.reached);
  const lostRow = (await client.query(
    "SELECT answered_by, reached, answered, answer FROM assistant_asks " +
    " WHERE question = $1", ["Does an unreachable ask leave a trace?"])).rows[0];
  check("...and is written down", !!lostRow, lostRow);
  check("...as unreached rather than declined",
        !!lostRow && lostRow.reached === false && lostRow.answered === false &&
        lostRow.answer === null, lostRow);
  check("...on the assistant's half",
        !!lostRow && lostRow.answered_by === "assistant", lostRow && lostRow.answered_by);

  /* BOTH ENDS (§94.2): a build that recorded EVERYTHING as unreached would
     satisfy every line above. */
  model.mode = "answer";
  await call(sidOffice, { action: "ask", body: "And a reachable one?" });
  const gotRow = (await client.query(
    "SELECT reached, answered FROM assistant_asks WHERE question = $1",
    ["And a reachable one?"])).rows[0];
  check("...while a reachable one is still marked reached",
        !!gotRow && gotRow.reached === true && gotRow.answered === true, gotRow);

  /* WITH THE SWITCH OFF NOTHING IS WRITTEN AT ALL, unreached included — the
     guard is in front of the recorder, so "the assistant failed" and "there is
     no assistant on this platform" can never be confused (§303). */
  await setting("ask", false);
  const beforeOff = await count("SELECT count(*)::int n FROM assistant_asks");
  model.mode = "down";
  await call(sidOffice, { action: "ask", body: "With the switch off?" });
  check("with Ask off nothing is recorded, not even a failure",
        (await count("SELECT count(*)::int n FROM assistant_asks")) === beforeOff, beforeOff);
  await setting("ask", true);
  model.mode = "answer";

  /* ── THE OFFICE'S HALF IS COLLECTED, NEVER MARKED ─────────────────── */
  await client.query("DELETE FROM chat_messages WHERE person_key = $1", [outsider.key]);
  await client.query(
    "INSERT INTO chat_threads (person_key, person_name, waiting) VALUES ($1,$2,true) " +
    "ON CONFLICT (person_key) DO UPDATE SET waiting = true", [outsider.key, "Tester"]);
  await client.query(
    "INSERT INTO chat_messages (person_key, by_key, from_office, body, at) VALUES " +
    "($1,$1,false,'Hi', now() - interval '20 minutes'), " +
    "($1,$1,false,'Can you change my weight?', now() - interval '19 minutes')",
    [outsider.key]);
  const nOffice0 = await count(
    "SELECT count(*)::int n FROM assistant_asks WHERE answered_by = 'office'");
  await call(sidOffice, { action: "reply", person: outsider.key,
                          body: "Weights are set on Setup › Weighting." });
  const offRow = (await client.query(
    "SELECT question, answer, answered, reached, office, answered_by " +
    "  FROM assistant_asks WHERE answered_by = 'office' ORDER BY id DESC LIMIT 1")).rows[0];
  check("a reply records the exchange, with no press", !!offRow, offRow);
  /* THE QUESTION IS EVERYTHING THEY SAID SINCE THE OFFICE LAST SPOKE — the
     exchange, not its last line, which is as often a detail as the question. */
  check("...the whole exchange as the question",
        !!offRow && offRow.question === "Hi Can you change my weight?", offRow && offRow.question);
  check("...and the reply as the answer",
        !!offRow && offRow.answer === "Weights are set on Setup › Weighting.", offRow && offRow.answer);
  /* WHICH SIDE ASKED AND WHO ANSWERED ARE TWO FACTS. A user asked; the office
     answered. Reading either off the other is how the two halves drift. */
  check("...asked by them and answered by the office",
        !!offRow && offRow.office === false && offRow.answered_by === "office", offRow);

  /* AND NOTHING IS RECORDED WHERE THERE IS NO QUESTION, or the list carries a
     row with an answer and nothing it answers. */
  const n1 = await count("SELECT count(*)::int n FROM assistant_asks WHERE answered_by = 'office'");
  await call(sidOffice, { action: "reply", person: outsider.key, body: "Let me know." });
  check("a second reply with nothing new from them records nothing",
        (await count("SELECT count(*)::int n FROM assistant_asks WHERE answered_by = 'office'")) === n1,
        n1);
  await client.query("DELETE FROM chat_threads WHERE person_key = $1", ["nobodyyet"]);
  await client.query(
    "INSERT INTO people (key, name, idx) VALUES ('nobodyyet','Nobody Yet',997) " +
    "ON CONFLICT (key) DO NOTHING");
  await call(sidOffice, { action: "reply", person: "nobodyyet", start: true,
                          body: "Could you send me your Q3 figures?" });
  check("...and the office starting a conversation records nothing",
        (await count("SELECT count(*)::int n FROM assistant_asks WHERE answered_by = 'office'")) === n1,
        n1);
  check("...while the one real exchange is there", n1 === nOffice0 + 1, [nOffice0, n1]);

  /* ── AND THE LIST COMES BACK AS TWO HISTORIES ─────────────────────── */
  const list = await call(sidOffice, { action: "askQuestions" });
  const both = (list.body && list.body.rows) || [];
  check("the list carries both halves, told apart",
        both.some(function (r) { return r.answered_by === "office"; }) &&
        both.some(function (r) { return r.answered_by === "assistant"; }),
        both.map(function (r) { return r.answered_by; }));
  check("...and the third state survives the grouping",
        both.some(function (r) { return r.reached === false; }),
        both.map(function (r) { return r.reached; }));
  /* THE TOTALS ARE ASKS AND THEY COME FROM THE SAME RESULT, so the switch can
     never print a number the list it opens disagrees with (§108.1). */
  const asked = (list.body && list.body.asked) || {};
  const sum = function (side) {
    return both.filter(function (r) { return r.answered_by === side; })
               .reduce(function (a, r) { return a + (r.times | 0); }, 0);
  };
  check("...with a total per half that agrees with the rows",
        asked.assistant === sum("assistant") && asked.office === sum("office"),
        [asked, sum("assistant"), sum("office")]);

  client.release();
  await pool.end();
  srv.close();
  console.log("\n" + ok + " passed, " + bad + " failed");
  process.exit(bad ? 1 : 0);
}

main().catch(function (e) { console.error(e); process.exit(1); });
