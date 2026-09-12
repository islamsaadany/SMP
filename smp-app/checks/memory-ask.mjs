/* Asking the consulting memory (spec 045, phase C), against a STAND-IN for the
   model (§100.3, §142.6): a check that calls Google proves nothing about this
   code and fails when somebody else's service has a bad afternoon. The
   stand-in speaks the provider's own shape, so what is measured is our half —
   what we SEND it, and what we do with what comes back.
 *
 * THE TWO RULES THIS PHASE EXISTS FOR, and both are asserted against the wire:
 *   · every answer names its sources, and a cited id nobody has is DROPPED
 *     rather than drawn as a door to an insight that does not exist;
 *   · a question the memory does not cover DECLINES — "nobody has written this
 *     one up yet" is a useful answer and a confident one from nothing is not.
 *
 *   DATABASE_URL_UNPOOLED=… node checks/memory-ask.mjs
 *   … --break=trust-source  (RED: a made-up citation is drawn as a source)
 *   … --break=no-corpus     (RED: the entries are not sent, so it answers from nothing)
 */
import { createServer } from "node:http";
import { createRequire } from "node:module";
import pg from "pg";
import { SCHEMA } from "../db/schema-name.mjs";
import { devTenant } from "../scripts/dev-tenant.mjs";

const URL_ = process.env.DATABASE_URL_UNPOOLED || "postgres://postgres:postgres@localhost:5432/smp_dev";
const brk = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8);
let oks = 0, fails = 0;
const ok = (l) => { oks++; console.log("ok    " + l); };
const fail = (l, m) => { fails++; console.log("FAIL  " + l + (m === undefined ? "" : " — " + String(m).slice(0, 220))); };
const check = (c, l, m) => (c ? ok(l) : fail(l, m));
async function section(name, fn) {
  console.log("── " + name);
  try { await fn(); } catch (e) { fail(name + " — the section died rather than reporting (§215)", e && e.stack ? e.stack.split("\n").slice(0, 2).join(" ") : e); }
}

/* ── the stand-in ───────────────────────────────────────────────────────
   It records what it was SENT, which is most of what is worth checking:
   whether the entries reached the model at all, and under what instruction. */
let lastSent = null, reply = { answered: true, reply: "It happened at Raya Trade.", source: "" };
const provider = createServer((req, res) => {
  let body = "";
  req.on("data", (d) => { body += d; });
  req.on("end", () => {
    lastSent = JSON.parse(body);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(reply) }] } }] }));
  });
});
await new Promise((r) => provider.listen(0, r));
const port = provider.address().port;
process.env.GEMINI_API_KEY = "AIza" + "x".repeat(35);
process.env.GEMINI_ENDPOINT = "http://localhost:" + port + "/v1beta/models/";

const { tenantId } = await devTenant({ url: URL_, log: () => {} });
const owner = new pg.Pool({ connectionString: URL_, max: 2, options: "-c search_path=" + SCHEMA });
await owner.query("DELETE FROM memory_entries");
const author = (await owner.query("SELECT id, name FROM users WHERE kind = 'office' ORDER BY email LIMIT 1")).rows[0];
const mk = async (title, happened) => (await owner.query(
  "INSERT INTO memory_entries (about_tenant_id, author_id, kind, title, happened) VALUES ($1,$2,'hiccup',$3,$4) RETURNING id",
  [tenantId, author.id, title, happened])).rows[0].id;
const one = await mk("The weighting workshop ran twice", "We ran it without the CEO in the room.");
const two = await mk("Q1 figures came back in three units", "Cartons, kilos and EGP against one target.");

const { memoryAsk, corpusOf, NOT_WRITTEN_UP } = await import("../lib/memory-ask.ts");
const me = { id: author.id, email: "x@forefront.example", name: author.name, kind: "office", isAdmin: true, mustChange: false };
const pool = new pg.Pool({ connectionString: URL_, max: 2, options: "-c search_path=" + SCHEMA });
/* the break is applied to what the CALLER does with the answer, so the module
   under test is the shipped one (§276) */
if (brk === "no-corpus") process.env.SMP_BREAK = "no-corpus";
const ask = async (q) => {
  const r = await memoryAsk(pool, me, q);
  if (brk === "trust-source" && r.ok) {
    r.sources = String(reply.source || "").split(/[,\s]+/).filter(Boolean).map((id) => ({ id, title: "?", client: "?", author: "?" }));
  }
  return r;
};

await section("1 · what we send it", async () => {
  reply = { answered: true, reply: "Yes — it happened on Raya Trade.", source: "[" + one + "]" };
  const r = await ask("has a weighting workshop ever gone wrong?");
  check(r.ok === true, "it answers", JSON.stringify(r).slice(0, 120));
  const sys = JSON.stringify((lastSent && lastSent.systemInstruction) || {});
  check(/THE CONSULTING MEMORY/.test(sys), "the corpus is sent under its own name, not as the product's manual", sys.slice(0, 100));
  check(/ALWAYS name your sources/.test(sys), "…under the instruction that makes it cite (rule one)", "");
  check(/never invent an engagement/i.test(sys), "…and the one that forbids inventing a client", "");
  check(sys.indexOf("weighting workshop ran twice") > 0 && sys.indexOf("without the CEO") > 0,
    "EVERY ENTRY REACHES IT — title and body, or it is answering from nothing", "the entries were not in what was sent");
  check(sys.indexOf(author.name) > 0, "…with the author's name on each, because the answer has to point at a person", "");
});

await section("2 · every answer names its sources", async () => {
  reply = { answered: true, reply: "Yes.", source: "[" + one + "], [" + two + "]" };
  let r = await ask("what has gone wrong on Raya?");
  check(r.sources.length === 2, "two citations come back as two sources", JSON.stringify(r.sources.map((s) => s.title)));
  check(r.sources[0].title === "The weighting workshop ran twice" && !!r.sources[0].author,
    "…each carrying the title and WHO wrote it, which is the next step", JSON.stringify(r.sources[0]));

  /* A CITATION NOBODY HAS IS A DOOR TO NOTHING (§96.2) */
  reply = { answered: true, reply: "Yes.", source: "[00000000-0000-0000-0000-000000000000], [" + one + "]" };
  r = await ask("what has gone wrong?");
  check(r.sources.length === 1 && r.sources[0].id === one,
    "a cited id nobody has is DROPPED, never drawn as a door to an insight that does not exist", JSON.stringify(r.sources));

  reply = { answered: true, reply: "Yes.", source: "[" + one + "], [" + one + "]" };
  r = await ask("again?");
  check(r.sources.length === 1, "…and the same one cited twice is one source", JSON.stringify(r.sources));
});

await section("3 · it declines rather than inventing", async () => {
  reply = { answered: false, reply: "a wombat wrote this sentence", source: "" };
  const r = await ask("what did we learn about shipbuilding?");
  check(r.ok === true && r.answered === false, "a question the memory does not cover comes back NOT answered", JSON.stringify(r));
  /* IN THE PRODUCT'S WORDS, NOT THE MODEL'S (§125): assistant.cjs blanks a
     declined reply on purpose, so the memory supplies its own sentence — and
     the check asserts it is OURS by making the stand-in say something else. */
  check(r.reply === NOT_WRITTEN_UP && !/wombat/.test(r.reply),
    "…and says so in the PRODUCT's words, never the model's (§125)", JSON.stringify(r.reply));
  check(r.sources.length === 0, "…citing nothing, because there was nothing to cite", JSON.stringify(r.sources));
});

await section("4 · an empty memory is not asked at all", async () => {
  await owner.query("DELETE FROM memory_entries");
  const before = lastSent;
  const r = await ask("anything?");
  check(r.ok === false && /nothing has been written up/.test(r.why || ""),
    "with nothing written up it says so rather than asking a model to answer from nought", JSON.stringify(r));
  check(lastSent === before, "…and the model is not called at all — an assistant over an empty memory is worse than none", "it was called");
});

await section("5 · nothing is stored by asking (decision 4, one surface out)", async () => {
  await mk("Something to find", "a body");
  const n = async (t) => (await owner.query("SELECT count(*)::int c FROM " + t)).rows[0].c;
  const before = [await n("memory_entries"), await n("assistant_asks").catch(() => 0)];
  reply = { answered: true, reply: "Yes.", source: "" };
  await ask("what went wrong?");
  const after = [await n("memory_entries"), await n("assistant_asks").catch(() => 0)];
  check(JSON.stringify(before) === JSON.stringify(after),
    "asking writes NO row — the memory records what people chose to write up, not what they went looking for", JSON.stringify([before, after]));
});

await owner.query("DELETE FROM memory_entries");
await owner.end(); await pool.end();
provider.close();
console.log((fails ? "RED  " : "GREEN  ") + oks + " ok, " + fails + " failed");
process.exit(fails ? 1 : 0);
