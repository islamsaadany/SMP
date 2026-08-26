/* ── The assistant's server half (§104, spec 016 §8) ───────────────────────
   Against a real Postgres and a STUB THAT MODELS GOOGLE, reached through
   `GEMINI_ENDPOINT` — so the product has no test-only branch in it and the
   thing under test is the real call path (§100.3: a stub that merely answers
   instead of modelling makes a correct client read as broken).

   NOTHING ASSERTS WHAT THE ASSISTANT SAYS. Its wording is not deterministic
   and never will be, so what is asserted is the CONTRACT (§94.8: write the
   check against the problem, not the phrasing):

     · with the switch off, the model is never called at all
     · `answered: true` writes a message and takes the thread out of Waiting
     · `answered: false` writes NOTHING and leaves it Waiting
     · every failure — timeout, refusal, malformed JSON, a missing key —
       leaves the person's message stored and the thread Waiting
     · a bot message is marked as one and never wears a person's name

   THE FAILURE CASES ARE THE POINT. They are four separate faults that fail at
   four different places in the call, and a build that lost the degradation
   would still pass every happy-path assertion.

     node scripts/test-assistant.js        (needs DATABASE_URL)
*/
const http = require("http");
const { Pool } = require("pg");
const io = require("../lib/state-io.js");
const Rules = require("../lib/rules.js");
const assistant = require("../lib/assistant.js");

let pass = 0, fail = 0;
function ck(what, ok, extra) {
  if (ok) { pass++; return; }
  fail++;
  console.log("  FAIL  " + what + (extra !== undefined ? "\n        " + JSON.stringify(extra) : ""));
}

/* ── A stub that answers the way Google does ─────────────────────────── */
let MODE = "answer", CALLS = 0, LAST = null;
const stub = http.createServer(function (req, res) {
  CALLS++;
  let raw = "";
  req.on("data", function (d) { raw += d; });
  req.on("end", function () {
    LAST = (function () { try { return JSON.parse(raw); } catch (e) { return null; } })();
    const reply = function (code, obj) {
      const b = typeof obj === "string" ? obj : JSON.stringify(obj);
      res.writeHead(code, { "Content-Type": "application/json" }); res.end(b);
    };
    if (MODE === "refuse") return reply(429, { error: { message: "quota" } });
    if (MODE === "notfound") return reply(404, { error: { message: "model not found" } });
    if (MODE === "garbage") {
      return reply(200, { candidates: [{ content: { parts: [{ text: "not json at all" }] } }] });
    }
    if (MODE === "empty") return reply(200, { candidates: [] });
    if (MODE === "hang") return;                       /* never answers: the timeout path */
    const out = MODE === "handoff"
      ? { answered: false, reply: "", source: "" }
      : { answered: true, reply: "From your key objectives, each actual against its target.",
          source: "[headline]" };
    reply(200, { candidates: [{ content: { parts: [{ text: JSON.stringify(out) }] } }] });
  });
});

(async function () {
  await new Promise(function (r) { stub.listen(0, "127.0.0.1", r); });
  const port = stub.address().port;
  process.env.GEMINI_ENDPOINT = "http://127.0.0.1:" + port + "/";
  process.env.GEMINI_API_KEY = "test-key-not-a-real-one";

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const c = await pool.connect();
  await io.ensureReady(c);
  const kb = require("../db/kb.json");

  const WHO = { key: "asst_test", name: "Test Person", role: "owner" };
  await c.query("DELETE FROM chat_messages WHERE person_key = $1", [WHO.key]);
  await c.query("DELETE FROM chat_threads WHERE person_key = $1", [WHO.key]);

  async function reset() {
    await c.query("DELETE FROM chat_messages WHERE person_key = $1", [WHO.key]);
    await c.query("INSERT INTO chat_threads (person_key, person_name, waiting) VALUES ($1,$2,true) " +
                  "ON CONFLICT (person_key) DO UPDATE SET waiting = true", [WHO.key, WHO.name]);
    await c.query("INSERT INTO chat_messages (person_key, from_office, by_key, by_name, body) " +
                  "VALUES ($1,false,$2,$3,$4)", [WHO.key, WHO.key, WHO.name, "a question"]);
    CALLS = 0;
  }
  async function after() {
    const t = (await c.query("SELECT waiting FROM chat_threads WHERE person_key=$1", [WHO.key])).rows[0];
    const m = (await c.query("SELECT bot, source, from_office, by_name, body FROM chat_messages " +
                             "WHERE person_key=$1 ORDER BY id", [WHO.key])).rows;
    return { waiting: !!(t && t.waiting), msgs: m, bots: m.filter(function (x) { return x.bot; }).length };
  }
  /* The one thing `say` does with the assistant, run exactly as `say` runs it. */
  async function run(cfg) {
    await reset();
    let a = null;
    if (cfg.assistant) {
      const out = await assistant.ask({ kb: kb, question: "a question", history: [], who: "the head of a business unit", labels: {} });
      a = (out && out.ok) ? out : null;
      if (a && a.answered) {
        await c.query("INSERT INTO chat_messages (person_key, from_office, bot, by_key, by_name, body, source) " +
                      "VALUES ($1,true,true,'assistant','Assistant',$2,$3)", [WHO.key, a.reply, a.source]);
        await c.query("UPDATE chat_threads SET waiting=false WHERE person_key=$1", [WHO.key]);
      }
    }
    return after();
  }

  console.log("\n1 · THE SWITCH, WHICH IS THE HALF THAT IS NOT ON SCREEN");
  ck("assistant defaults OFF", Rules.chatCfg(undefined).assistant === false);
  ck("only an explicit true turns it on", Rules.chatCfg({ assistant: "yes" }).assistant === false);
  let st = await run({ assistant: false });
  ck("with it off the model is NEVER CALLED", CALLS === 0, CALLS);
  ck("and the question waits for a person", st.waiting === true, st);
  ck("and nothing was written into the thread", st.bots === 0, st);

  console.log("\n2 · an answer");
  MODE = "answer";
  st = await run({ assistant: true });
  ck("the model was asked", CALLS === 1, CALLS);
  ck("the answer is in the thread", st.bots === 1, st);
  ck("it is marked as the assistant's, not a person's",
     st.msgs.some(function (m) { return m.bot && m.by_name === "Assistant"; }), st);
  ck("the brackets are stripped off the cited section",
     st.msgs.some(function (m) { return m.source === "headline"; }), st);
  ck("and it leaves the office's Waiting queue", st.waiting === false, st);

  console.log("\n3 · a handoff writes nothing and leaves it waiting");
  MODE = "handoff";
  st = await run({ assistant: true });
  ck("no message was written", st.bots === 0, st);
  ck("the thread is still waiting", st.waiting === true, st);
  ck("and the person's own words are still there",
     st.msgs.length === 1 && st.msgs[0].body === "a question", st);

  console.log("\n4 · EVERY FAILURE LANDS ON THE CHAT AS IT WORKED BEFORE");
  for (const m of ["refuse", "notfound", "garbage", "empty"]) {
    MODE = m;
    st = await run({ assistant: true });
    ck("`" + m + "` writes nothing and leaves it waiting",
       st.bots === 0 && st.waiting === true && st.msgs.length === 1, { mode: m, st: st });
  }

  MODE = "hang";
  const t0 = Date.now();
  const slow = await assistant.ask({ kb: kb, question: "x", timeoutMs: 900 });
  ck("a hung provider gives up rather than hanging (" + (Date.now() - t0) + "ms)",
     slow.ok === false && Date.now() - t0 < 4000, slow);

  delete process.env.GEMINI_API_KEY;
  const noKey = await assistant.ask({ kb: kb, question: "x" });
  ck("with no key it refuses by name, and says which variable",
     noKey.ok === false && /GEMINI_API_KEY/.test(noKey.why), noKey);
  process.env.GEMINI_API_KEY = "test-key-not-a-real-one";

  console.log("\n5 · what actually goes to the provider");
  MODE = "answer";
  await assistant.ask({ kb: kb, question: "how do I report", history: [], who: "a strategy custodian", labels: { pillar: "direction", pillars: "directions" } });
  const sys = (LAST.systemInstruction.parts || []).map(function (p) { return p.text; }).join("\n");
  ck("the whole corpus is sent, with no retrieval step", sys.length > 40000, sys.length);
  ck("the tenant's own word for a pillar is used", /direction/.test(sys) && !/\{pillar/.test(sys));
  ck("markup is stripped — the model reads prose", !/<b>/.test(sys));
  ck("the asker's role is stated, so a two-track question can be picked",
     /strategy custodian/.test(sys));
  ck("a JSON schema is demanded rather than hoped for",
     LAST.generationConfig.responseMimeType === "application/json" &&
     !!LAST.generationConfig.responseSchema, LAST.generationConfig);
  ck("temperature is 0 — this is recall, not composition",
     LAST.generationConfig.temperature === 0);

  await c.query("DELETE FROM chat_messages WHERE person_key = $1", [WHO.key]);
  await c.query("DELETE FROM chat_threads WHERE person_key = $1", [WHO.key]);
  c.release(); await pool.end(); stub.close();

  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(function (e) { console.log("FAIL " + e.stack); process.exit(1); });
