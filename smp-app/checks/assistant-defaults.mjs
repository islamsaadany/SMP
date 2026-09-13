/* The assistant's own defaults, after spec 050 split its provider call in two.
 *
 * WHY THIS FILE EXISTS AT ALL: `ask()` sits in front of the chat, the
 * knowledge base and the consulting memory, and spec 050 gave it three new
 * options so ONE caller — drafting a framework, which is not a lookup — can
 * ask for a different schema, no corpus, and room to reason. The change is
 * only safe if every caller that passes none of the three behaves exactly as
 * it did, and "exactly as it did" is not something a reading can establish.
 *
 * SO IT READS WHAT GOES ON THE WIRE. A stub stands in front of the provider
 * through GEMINI_ENDPOINT — the environment variable that exists for this
 * (§100.3, §142.6: a test double behind an `if` in the module would be a
 * second code path shipping to production) — and the request body is asserted.
 *
 * ALL THREE FAIL SILENTLY IN PRODUCTION if they are ever lost, which is why
 * they are asserted rather than trusted: a corpus guard that stops guarding
 * answers from nothing at all; thinking left on turns every lookup's latency
 * back into weather (§134); and a bigger output budget hides §133's truncation
 * until the day it does not.
 *
 *   node checks/assistant-defaults.mjs
 *   … --break=loose-defaults   (RED: the three defaults flipped)
 *
 * No database and no network — the stub is local. */
import { createServer } from "node:http";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const A = require("../lib/assistant.cjs");

const brk = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8);
if (brk) process.env.SMP_BREAK = brk;
let oks = 0, fails = 0;
const ok = (l) => { oks++; console.log("ok    " + l); };
const fail = (l, m) => { fails++; console.log("FAIL  " + l + (m === undefined ? "" : " — " + String(m).slice(0, 220))); };
const check = (c, l, m) => (c ? ok(l) : fail(l, m));

/* The stub answers whatever shape the caller's schema asks for; what it is
   FOR is the request, which it keeps. */
let seen = null;
const reply = { candidates: [{ content: { parts: [{ text: JSON.stringify({ answered: true, reply: "yes", source: "1", name: "X" }) }] } }] };
const server = createServer((req, res) => {
  let b = "";
  req.on("data", (d) => { b += d; });
  req.on("end", () => {
    try { seen = JSON.parse(b); } catch { seen = null; }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(reply));
  });
});
await new Promise((r) => server.listen(0, r));
process.env.GEMINI_ENDPOINT = "http://localhost:" + server.address().port + "/";
process.env.GEMINI_API_KEY = "AIzaStubStubStubStubStubStubStubStubStu";

const KB = { sections: [{ id: "1" }], recipes: [] };
const cfg = () => (seen && seen.generationConfig) || {};

console.log("── what every caller that asks for nothing still gets");
await A.ask({ question: "anything", kb: KB, corpusText: "something" });
check(JSON.stringify(cfg().responseSchema) === JSON.stringify(A.SCHEMA),
  "the three-field answer shape, unchanged", JSON.stringify(cfg().responseSchema).slice(0, 90));
check(cfg().thinkingConfig && cfg().thinkingConfig.thinkingBudget === 0,
  "thinking capped at nought — a lookup does not reason (§134)", JSON.stringify(cfg().thinkingConfig));
check(cfg().maxOutputTokens === 2048, "and 2048 tokens of headroom", cfg().maxOutputTokens);

const empty = await A.ask({ question: "anything", kb: { sections: [], recipes: [] } });
check(!empty.ok && /empty/.test(empty.why || ""),
  "an empty corpus is still refused rather than answered from nothing", JSON.stringify(empty));

console.log("\n── and what the one caller that is not asking a question can ask for");
seen = null;
const SCHEMA2 = { type: "object", properties: { name: { type: "string" } }, required: ["name"] };
const r = await A.askJson({ question: "draft one", needsCorpus: false, think: true,
                            schema: SCHEMA2, maxOutput: 4096, instruction: "…" });
check(r.ok && r.json && r.json.name === "X", "it hands the parsed object back, unshaped", JSON.stringify(r).slice(0, 120));
check(JSON.stringify(cfg().responseSchema) === JSON.stringify(SCHEMA2), "under the caller's own schema");
check(!cfg().thinkingConfig, "with the thinking cap NOT sent — composing is not retrieval");
check(cfg().maxOutputTokens === 4096, "and the headroom it asked for", cfg().maxOutputTokens);
check(r.ok, "and no corpus was required of it");

/* BOTH ENDS (§94.2): the shaping `ask()` does must still happen, or a build
   that returned the raw object from both would pass everything above. */
console.log("\n── ask() still shapes its answer");
const shaped = await A.ask({ question: "anything", kb: KB, corpusText: "something" });
check(shaped.ok && shaped.answered === true && shaped.reply === "yes" && shaped.json === undefined,
  "answered, reply and source — never the raw object", JSON.stringify(shaped));

server.close();
console.log("\n" + oks + " passed, " + fails + " failed");
process.exit(fails ? 1 : 0);
