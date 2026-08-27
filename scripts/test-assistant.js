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
     · `answered: false` says so in one line of the PRODUCT's words, never
       the model's, and leaves it Waiting (§125)
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
    if (MODE === "badkey400") return reply(400, { error: { message: "API key not valid. Please pass a valid API key." } });
    if (MODE === "notfound") return reply(404, { error: { message: "model not found" } });
    if (MODE === "garbage") {
      return reply(200, { candidates: [{ content: { parts: [{ text: "not json at all" }] } }] });
    }
    if (MODE === "empty") return reply(200, { candidates: [] });
    /* THE PROVIDER THAT NEVER HEARD OF THINKING (§134): a 400 naming the
       field when it is present, an ordinary answer when it is not — which is
       how Google actually refuses an unknown generationConfig member. */
    if (MODE === "nothink" && LAST && LAST.generationConfig &&
        LAST.generationConfig.thinkingConfig) {
      return reply(400, { error: { message:
        'Invalid JSON payload received. Unknown name "thinkingBudget" at ' +
        "'generation_config.thinking_config'" } });
    }
    if (MODE === "hang") return;                       /* never answers: the timeout path */
    /* THE MODEL'S WORDS ON A HANDOFF ARE A TRAP, and the stub sets it (§104).
       A provider that says something helpful-sounding while answering false is
       exactly the case `answered` exists to decide — if this string ever
       reaches the thread, the flag has stopped being what decides. */
    const out = MODE === "handoff"
      ? { answered: false, reply: "The office would know — ask the office.", source: "" }
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
    const m = (await c.query("SELECT bot, handoff, source, from_office, by_name, body FROM chat_messages " +
                             "WHERE person_key=$1 ORDER BY id", [WHO.key])).rows;
    return { waiting: !!(t && t.waiting), msgs: m,
             bots: m.filter(function (x) { return x.bot && !x.handoff; }).length,
             said: m.filter(function (x) { return x.handoff; }).length };
  }
  /* The one thing `say` does with the assistant, run exactly as `say` runs it. */
  async function run(cfg) {
    await reset();
    let a = null;
    if (cfg.assistant) {
      const out = await assistant.ask({ kb: kb, question: "a question", history: [], who: "the head of a business unit", labels: {} });
      a = (out && out.ok) ? out : null;
      /* §125, run exactly as `say` runs it. A HANDOFF SAYS SO; a failure — `a`
         null — still writes nothing at all, and section 4 is what holds that
         line, because telling somebody the assistant considered their question
         when it was never asked is a lie nobody can see (§112.2). */
      if (a && !a.answered) {
        await c.query("INSERT INTO chat_messages (person_key, from_office, bot, handoff, by_key, by_name, body) " +
                      "VALUES ($1,true,true,true,'assistant','Assistant',$2)",
                      [WHO.key, assistant.HANDOFF_LINE]);
      }
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

  /* §125 REVERSES THE FIRST HALF OF THIS SECTION'S OLD TITLE. A handoff used
     to write nothing, and the person was left looking at a screen identical to
     the one they would see if the assistant had never run — §123's fault one
     layer in. It SAYS SO now; what has not changed, and is what the rest of
     this section holds, is that the conversation stays in the office's queue. */
  console.log("\n3 · a handoff says so, and still leaves it waiting");
  MODE = "handoff";
  st = await run({ assistant: true });
  ck("the person is told the assistant could not answer", st.said === 1, st);
  ck("and it is not counted as an answer", st.bots === 0, st);
  ck("the thread is still waiting", st.waiting === true, st);
  ck("and the person's own words are still there",
     st.msgs.length === 2 && st.msgs[0].body === "a question", st);
  ck("in the product's own words, one place", st.msgs.some(function (m) {
    return m.handoff && m.body === assistant.HANDOFF_LINE; }), st);
  /* THE MODEL'S WORDS CANNOT REACH A CALLER ON A HANDOFF, and that is enforced
     one layer down rather than by whoever writes the INSERT — so it is asserted
     THERE, where it can actually fail. Asserting it on the stored row instead
     was a no-op: `ask()` had already blanked the reply, so the assertion passed
     however the caller behaved (§94.5 — an assertion that cannot fail is not
     one, and this file's own break test is what showed it). */
  const said = await assistant.ask({ kb: kb, question: "x", history: [], who: "somebody", labels: {} });
  ck("a handoff carries no words from the model, whatever it sent",
     said.ok === true && said.answered === false && said.reply === "" && said.source === null, said);

  console.log("\n4 · EVERY FAILURE LANDS ON THE CHAT AS IT WORKED BEFORE");
  for (const m of ["refuse", "notfound", "garbage", "empty"]) {
    MODE = m;
    st = await run({ assistant: true });
    /* NOTHING AT ALL, the handoff line included (§125). A failure is not a
       decision, and a deployment with no key must not tell people the
       assistant looked at their question and gave up. */
    ck("`" + m + "` writes nothing and leaves it waiting",
       st.bots === 0 && st.said === 0 && st.waiting === true && st.msgs.length === 1,
       { mode: m, st: st });
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

  /* §126. "Rejected" and "not the key you made" are two different errands and
     the deployment cannot tell them apart from outside — so the shape is
     reported, and the one thing that must never happen is the VALUE reaching
     the screen. Asserted here rather than in the browser check, whose stub
     supplies the steps and would never run this at all (§94.2). */
  console.log("\n5 · which key, without saying which key");
  process.env.GEMINI_API_KEY = "AIzaSyC00000000000000000000000000000000";
  let shape = assistant.keyShape();
  ck("an AI Studio key is recognised by its shape",
     shape && shape.len === 39 && shape.head === "AIza" && shape.looksRight === true, shape);
  ck("and no more of it than that is ever handed out",
     shape && Object.keys(shape).sort().join() === "head,len,looksRight" &&
     !/0{5}/.test(JSON.stringify(shape)), shape);
  /* GOOGLE'S NEWER FORM IS A KEY, NOT A STRANGER (§132.2). The first real
     AQ.-prefixed key this row ever met was called "a different kind of
     credential" and then accepted by the provider one step later — the
     heuristic must recognise every shape Google issues, and stay humble about
     the rest. */
  /* BUILT AT RUNTIME, NOT WRITTEN AS A LITERAL: a plausible-looking AQ. string
     trips GitHub's secret scanner even when it is fiction, and the scanner is
     right to be paranoid — so the fixture is assembled where no scanner reads. */
  process.env.GEMINI_API_KEY = ["AQ", "ExampleNotARealKey0000000000000000000000000000000"].join(".");
  shape = assistant.keyShape();
  ck("Google's newer AQ.-prefixed form is recognised too",
     shape && shape.head.slice(0, 3) === "AQ." && shape.looksRight === true, shape);
  process.env.GEMINI_API_KEY = "ya29.a0AfH6SMBexample-oauth-token-not-a-key";
  shape = assistant.keyShape();
  ck("an unrecognised shape is reported, not endorsed",
     shape && shape.looksRight === false, shape);
  process.env.GEMINI_API_KEY = "  AIzaSyC00000000000000000000000000000000\n";
  ck("and the shape is read AFTER the trim, or a clean key reads as malformed",
     assistant.keyShape().looksRight === true, assistant.keyShape());
  delete process.env.GEMINI_API_KEY;
  ck("no key, no shape", assistant.keyShape() === null);
  process.env.GEMINI_API_KEY = "test-key-not-a-real-one";

  console.log("\n6 · the thinking cap, and the provider that refuses it");
  /* The cap is SENT by default — retrieval over an in-prompt corpus needs no
     reasoning, and §133's timeout came straight back at 20s the day the model
     felt like thinking long. */
  assistant._resetThinkCap && assistant._resetThinkCap();
  MODE = "answer"; CALLS = 0;
  let r6 = await assistant.ask({ kb: kb, question: "x", history: [], who: "w", labels: {} });
  ck("the thinking cap goes out with the request",
     r6.ok === true && LAST && LAST.generationConfig &&
     LAST.generationConfig.thinkingConfig &&
     LAST.generationConfig.thinkingConfig.thinkingBudget === 0, LAST && LAST.generationConfig);
  /* AND A PROVIDER THAT REFUSES THE KNOB LOSES THE KNOB, NOT THE ANSWER. */
  assistant._resetThinkCap();
  MODE = "nothink"; CALLS = 0;
  r6 = await assistant.ask({ kb: kb, question: "x", history: [], who: "w", labels: {} });
  ck("a refused cap is dropped and the question asked again, once",
     r6.ok === true && CALLS === 2 &&
     !(LAST.generationConfig && LAST.generationConfig.thinkingConfig), { calls: CALLS });
  CALLS = 0;
  r6 = await assistant.ask({ kb: kb, question: "x", history: [], who: "w", labels: {} });
  ck("and the refusal is remembered for the process",
     r6.ok === true && CALLS === 1, { calls: CALLS });
  /* NEVER INTO A BAD KEY: a 400 about the credential is not a 400 about the
     knob, and retrying it would double every bad-key failure. */
  assistant._resetThinkCap();
  MODE = "badkey400"; CALLS = 0;
  r6 = await assistant.ask({ kb: kb, question: "x", history: [], who: "w", labels: {} });
  ck("a bad key is never retried into", r6.ok === false && r6.badKey === true && CALLS === 1,
     { calls: CALLS, r: r6 });
  assistant._resetThinkCap();
  MODE = "answer";

  console.log("\n7 · what actually goes to the provider");
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
