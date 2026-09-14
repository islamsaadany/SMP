/* The strategy frameworks library, phase A (spec 052).
 *
 * DRIVES THE REAL HANDLER against a real database — `frameworksAction`, the
 * same function the route calls — rather than a stub of it (§100.3). What it
 * does NOT drive is the HTTP door in front of that handler: a session, and a
 * password that is no longer temporary. That door is `app/api/frameworks/route.ts`,
 * it is `/api/memory`'s byte for byte, and it is proved by that endpoint's own
 * check against a built app. Said here rather than left for somebody to
 * assume this file covers it (§113.8).
 *
 * EVERYTHING RUNS INSIDE ONE TRANSACTION THAT ALWAYS ROLLS BACK, which is what
 * lets a break delete a row to prove an assertion can fail without leaving the
 * database short of a framework afterwards.
 *
 *   DATABASE_URL_UNPOOLED=postgres://…/smp_dev node --experimental-strip-types checks/frameworks.mjs
 *   … --break=client-reads    (RED: a client's own staff read Forefront's library)
 *   … --break=alphabetical    (RED: the sections come back in name order, not the book's)
 *   … --break=short-library   (RED: one framework is missing)
 *   … --break=no-admin-gate   (RED: anybody adds to the firm's library)
 *   … --break=think-capped    (RED: the by-name draft is capped like a lookup)
 *   … --break=no-corpus       (RED: the ask answers from nothing at all)
 *
 * THE MODEL IS STOOD IN FRONT OF, never branched around (§100.3, §142.6): a
 * local stub answers on GEMINI_ENDPOINT, which is the environment variable
 * that exists for exactly this, and what it KEEPS is the request — so what
 * drafting sends can be asserted rather than reasoned about.
 *
 * The eighty are compared against their own INVARIANTS rather than against the
 * upstream dataset, and that is deliberate: once migration 009 has run, this
 * table IS the library — admins edit it — and the toolkit repository is a
 * historical source rather than a second copy to keep in step (plan.md). The
 * invariants are strong enough to catch a truncated, duplicated or scrambled
 * load, which is what could actually go wrong.
 */
import pg from "pg";
import { createServer } from "node:http";
import { SCHEMA } from "../db/schema-name.mjs";
import { frameworksAction, slugFor } from "../lib/frameworks-api.ts";
import { DRAFT_FIELDS } from "../lib/frameworks-ask.ts";

const URL_ = process.env.DATABASE_URL_UNPOOLED || "postgres://postgres:postgres@localhost:5432/smp_dev";
const brk = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8);
if (brk) process.env.SMP_BREAK = brk;

let oks = 0, fails = 0;
const ok = (l) => { oks++; console.log("ok    " + l); };
const fail = (l, m) => { fails++; console.log("FAIL  " + l + (m === undefined ? "" : " — " + String(m).slice(0, 220))); };
const check = (c, l, m) => (c ? ok(l) : fail(l, m));
async function section(name, fn) {
  console.log("\n── " + name);
  try { await fn(); } catch (e) { fail(name + " — the section died rather than reporting (§215)", e && e.stack ? e.stack.split("\n").slice(0, 2).join(" ") : e); }
}

/* The three people every assertion here is about. None is written to the
   database: `frameworksAction` reads the session it is handed and nothing
   else, which is the whole reason it can be driven this way. */
const CONSULTANT = { id: "00000000-0000-0000-0000-000000000001", email: "c@forefront.example", name: "A Consultant", kind: "office", isAdmin: false, mustChange: false };
const ADMIN = { ...CONSULTANT, id: "00000000-0000-0000-0000-000000000002", name: "An Admin", isAdmin: true };
const CLIENT = { ...CONSULTANT, id: "00000000-0000-0000-0000-000000000003", name: "A Client's Own Person", kind: "client" };

/* ── The stub in front of the model ────────────────────────────────
   It keeps the request and answers whatever `reply` is set to, so each
   section says what the model would have said and then asserts what came
   back through it. */
let seen = null, reply = null;
function answers(o) { reply = o; seen = null; }
const server = createServer((req, res) => {
  let b = "";
  req.on("data", (d) => { b += d; });
  req.on("end", () => {
    try { seen = JSON.parse(b); } catch { seen = null; }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(reply) }] } }] }));
  });
});
await new Promise((r) => server.listen(0, r));
process.env.GEMINI_ENDPOINT = "http://localhost:" + server.address().port + "/";
process.env.GEMINI_API_KEY = "AIzaStubStubStubStubStubStubStubStubStu";

/* A whole draft, as the model would send one back. */
function drafted(over) {
  const d = { known: true, why: "" };
  for (const f of DRAFT_FIELDS) d[f] = f + " text";
  d.name = "The Endurance Lens (Forefront)";
  return Object.assign(d, over || {});
}
const prompt = () => {
  const parts = (seen && seen.contents && seen.contents[0] && seen.contents[0].parts) || [];
  return parts.map((p) => p.text || "").join("\n") + "\n" +
    (((seen && seen.systemInstruction && seen.systemInstruction.parts) || []).map((p) => p.text || "").join("\n"));
};
const cfg = () => (seen && seen.generationConfig) || {};

const pool = new pg.Pool({ connectionString: URL_, max: 2, options: "-c search_path=" + SCHEMA });
const c = await pool.connect();
await c.query("BEGIN");

try {
  if (brk === "short-library") await c.query("DELETE FROM frameworks WHERE idx = (SELECT max(idx) FROM frameworks)");

  /* `added_by` carries a foreign key, so the admin who saves has to be a real
     row — made inside the transaction that rolls back, like everything else
     here. Its id replaces the made-up one on ADMIN. */
  ADMIN.id = (await c.query(
    "INSERT INTO users (email, name, password_hash, kind, is_admin) " +
    "VALUES ('check.admin@forefront.example', 'An Admin', 'x', 'office', true) RETURNING id")).rows[0].id;
  /* AND SO IS THE CONSULTANT, whose save is refused — because a BREAK that
     lets it through would otherwise die on that foreign key rather than
     reporting the widening it exists to catch (§215). */
  CONSULTANT.id = (await c.query(
    "INSERT INTO users (email, name, password_hash, kind) " +
    "VALUES ('check.consultant@forefront.example', 'A Consultant', 'x', 'office') RETURNING id")).rows[0].id;

  await section("the table is the platform's own", async () => {
    const col = await c.query(
      "SELECT 1 FROM pg_attribute a JOIN pg_class t ON t.oid = a.attrelid " +
      "WHERE t.relname = 'frameworks' AND a.attname = 'tenant_id' AND NOT a.attisdropped");
    check(col.rowCount === 0, "it carries no tenant_id column at all — a framework is about nobody");
    const r = await c.query(
      "SELECT c.relrowsecurity AS rls, c.relforcerowsecurity AS force, " +
      "(SELECT count(*) FROM pg_policy p WHERE p.polrelid = c.oid)::int AS pols " +
      "FROM pg_class c WHERE c.relname = 'frameworks' AND c.relnamespace = current_schema()::regnamespace");
    check(r.rowCount === 1, "the table is there");
    check(r.rows[0] && !r.rows[0].force, "row-level security is NOT forced on it", r.rows[0] && r.rows[0].force);
    check(r.rows[0] && r.rows[0].pols === 0, "no tenant policy is attached to it", r.rows[0] && r.rows[0].pols);
    /* BOTH ENDS: a tenant-owned table beside it must still be fenced, or a
       build that switched row-level security off everywhere passes the three
       above perfectly (§94.2). */
    const t = await c.query(
      "SELECT relforcerowsecurity AS force FROM pg_class WHERE relname = 'tactics' AND relnamespace = current_schema()::regnamespace");
    check(t.rowCount === 1 && t.rows[0].force, "and a tenant-owned table beside it IS still forced — the control");
  });

  await section("the eighty, whole", async () => {
    const r = (await c.query("SELECT idx, slug, section FROM frameworks ORDER BY idx")).rows;
    check(r.length === 80, "eighty frameworks", r.length);
    const idxs = r.map((x) => x.idx);
    const wanted = Array.from({ length: 80 }, (_, i) => i + 1);
    check(JSON.stringify(idxs) === JSON.stringify(wanted),
      "their order is exactly 1–80, no gap and nothing twice — which is what catches a truncated or doubled load",
      idxs.length + " values, first " + idxs[0] + " last " + idxs[idxs.length - 1]);
    check(new Set(r.map((x) => x.slug)).size === r.length, "every slug is its own");
    const secs = [...new Set(r.map((x) => x.section))];
    check(secs.length === 8, "eight sections", secs.length);
    /* EACH SECTION IS CONTIGUOUS IN idx — a real property of the dataset, and
       what would catch a load that scrambled the book's teaching order while
       keeping every row. */
    const runs = r.reduce((a, x) => (a.length && a[a.length - 1] === x.section ? a : a.concat(x.section)), []);
    check(runs.length === 8, "and each one is one unbroken run, so the book's order survived", runs.length + " runs");
    const empty = await c.query(
      "SELECT count(*)::int AS n FROM frameworks WHERE btrim(name) = '' OR btrim(section) = '' " +
      "OR btrim(purpose) = '' OR btrim(key_questions) = '' OR btrim(when_to_use) = '' " +
      "OR btrim(when_not_to_use) = '' OR btrim(inputs_required) = '' OR btrim(outputs) = '' " +
      "OR btrim(executive_example) = '' OR btrim(consultant_use_case) = '' OR btrim(facilitation_tips) = ''");
    check(empty.rows[0].n === 0, "not one field is empty on any of them", empty.rows[0].n);
    const authored = await c.query("SELECT count(added_by)::int AS n FROM frameworks");
    check(authored.rows[0].n === 0, "and none of them claims an author — they came with the library (§35)", authored.rows[0].n);
  });

  await section("the list", async () => {
    const a = await frameworksAction(c, CONSULTANT, { action: "list" });
    check(a.code === 200 && a.body.ok, "an ordinary consultant reads it", a.code);
    const rows = a.body.frameworks || [];
    check(rows.length === 80, "all eighty come back", rows.length);
    const f = rows[0] || {};
    check(!!f.name && !!f.section && !!f.purpose && !!f.keyQuestions && !!f.whenToUse,
      "each row carries the five that decide whether this is the right tool");
    check(f.facilitationTips === undefined,
      "and NOT the other four — the list is not the detail page (the whole library travels at once)");
    const secs = a.body.sections || [];
    check(secs.length === 8, "eight sections come with it", secs.length);
    check(secs.reduce((n, s) => n + s.n, 0) === 80, "their counts add up to eighty",
      secs.reduce((n, s) => n + s.n, 0));
    /* THE BOOK'S ORDER, asserted as AGREEMENT with the rows' own idx rather
       than against eight typed names (§94.8): rename a section tomorrow and
       this still holds. */
    const byFirstIdx = [...new Set(rows.map((r) => r.section))];
    check(JSON.stringify(secs.map((s) => s.section)) === JSON.stringify(byFirstIdx),
      "and they are in the book's order, not alphabetical",
      secs.map((s) => s.section).join(" · "));
  });

  await section("one framework", async () => {
    const list = await frameworksAction(c, CONSULTANT, { action: "list" });
    const first = (list.body.frameworks || [])[0];
    const a = await frameworksAction(c, CONSULTANT, { action: "one", id: first.id });
    check(a.code === 200 && a.body.ok, "it reads", a.code);
    const f = a.body.framework || {};
    const nine = ["purpose", "keyQuestions", "whenToUse", "whenNotToUse", "inputsRequired",
                  "outputs", "executiveExample", "consultantUseCase", "facilitationTips"];
    check(nine.every((k) => typeof f[k] === "string" && f[k].length > 0),
      "all nine content fields come back filled",
      nine.filter((k) => !f[k]).join(", ") || "none missing");
    check(f.addedBy === null,
      "its author is null rather than a name invented to fill the column (§35)", f.addedBy);
    const miss = await frameworksAction(c, CONSULTANT, { action: "one", id: "00000000-0000-0000-0000-0000000000ff" });
    check(miss.code === 404, "an id nobody has is a 404 and says so in words", miss.code);
    const bad = await frameworksAction(c, CONSULTANT, { action: "nonsense" });
    check(bad.code === 400, "an action it does not know is a 400", bad.code);
  });

  await section("the one gate, both ends", async () => {
    const cl = await frameworksAction(c, CLIENT, { action: "list" });
    check(cl.code === 403, "a client's own person is refused", cl.code);
    check(cl.body.error === "That is not something this account opens.",
      "in the same words the memory and the console refuse them — never a sentence of its own (§53.5)",
      cl.body.error);
    /* THE OPENNESS IS ASSERTED AS LOUDLY AS THE REFUSAL (§94.2, decision 1):
       a build that gated this to admins would be a library only admins could
       read, and every assertion above would still pass. */
    const con = await frameworksAction(c, CONSULTANT, { action: "list" });
    check(con.code === 200, "an ordinary consultant — no admin flag — reads the whole library", con.code);
    const adm = await frameworksAction(c, ADMIN, { action: "list" });
    check(adm.code === 200, "and so does an admin", adm.code);
  });
  await section("drafting one — who may ask, both ends", async () => {
    answers(drafted());
    const con = await frameworksAction(c, CONSULTANT, { action: "draft", name: "Anything" });
    check(con.code === 403, "an ordinary consultant cannot draft one", con.code);
    check(con.body.error === "Adding to the library is a Forefront admin's.",
      "and is told which door it is, rather than that something went wrong", con.body.error);
    /* BOTH ENDS (§94.2): a build that refused everybody would satisfy the two
       above perfectly and be a library nobody can add to. */
    const adm = await frameworksAction(c, ADMIN, { action: "draft", name: "Anything" });
    check(adm.code === 200 && adm.body.drafted === true, "an admin gets a draft", adm.code + " " + JSON.stringify(adm.body).slice(0, 90));
    const cl = await frameworksAction(c, CLIENT, { action: "draft", name: "Anything" });
    check(cl.body.error === "That is not something this account opens.",
      "and a client's own person meets the outer gate, in its own words", cl.body.error);
  });

  await section("drafting writes nothing", async () => {
    answers(drafted());
    const before = (await c.query("SELECT count(*)::int AS n FROM frameworks")).rows[0].n;
    const a = await frameworksAction(c, ADMIN, { action: "draft", name: "The Endurance Lens" });
    const after = (await c.query("SELECT count(*)::int AS n FROM frameworks")).rows[0].n;
    check(a.body.drafted === true, "it came back", JSON.stringify(a.body).slice(0, 90));
    /* THE WHOLE OF DECISION 3, COUNTED. A draft that wrote would look
       identical from the screen — the fields are on it either way. */
    check(before === after, "and the library gained nothing by asking", before + " → " + after);
    const d = a.body.draft || {};
    check(DRAFT_FIELDS.every((f) => typeof d[f] === "string"), "all eleven fields come back",
      DRAFT_FIELDS.filter((f) => typeof d[f] !== "string").join(", "));
  });

  await section("what drafting sends the model", async () => {
    answers(drafted());
    await frameworksAction(c, ADMIN, { action: "draft", name: "Blue Ocean Strategy" });
    /* THE THREE OPTIONS spec 052 added, read off the wire. Each fails
       silently if it is ever lost: a capped lookup cannot compose, 2048
       truncates eleven fields, and the shipped schema is three fields wide. */
    check(!cfg().thinkingConfig,
      "by name, the thinking cap is OFF — this is the one call in the platform that is not a lookup",
      JSON.stringify(cfg().thinkingConfig));
    check(cfg().maxOutputTokens === 4096, "with room for eleven fields, not a lookup's 2048", cfg().maxOutputTokens);
    const req = (cfg().responseSchema || {}).required || [];
    check(req.length === 13 && req.indexOf("known") >= 0,
      "and its own schema, which REQUIRES the I-do-not-know flag", req.length + " required");
    const inst = prompt();
    check(inst.indexOf("Bridging the Gap") >= 0 || inst.indexOf("Knowing Your Business") >= 0,
      "the sections it must choose from are in the prompt, read from the library itself");

    answers(drafted());
    await frameworksAction(c, ADMIN, { action: "draft", name: "", source: "A pasted chapter about endurance." });
    /* PASTED SOURCE IS RETRIEVAL AGAIN, and keeps both defaults — which is
       the distinction this whole file rests on. */
    check(cfg().thinkingConfig && cfg().thinkingConfig.thinkingBudget === 0,
      "from a pasted source the cap is back ON — the material is in the prompt and the job is to shape it",
      JSON.stringify(cfg().thinkingConfig));
    check(prompt().indexOf("A pasted chapter about endurance.") >= 0,
      "and what was pasted is what it is answering from");
  });

  await section("it may say it does not know", async () => {
    answers({ known: false, why: "I do not know that one well enough to write it up.", ...Object.fromEntries(DRAFT_FIELDS.map((f) => [f, ""])) });
    const before = (await c.query("SELECT count(*)::int AS n FROM frameworks")).rows[0].n;
    const a = await frameworksAction(c, ADMIN, { action: "draft", name: "The Forefront Endurance Lens" });
    check(a.code === 200, "a decline is an answer rather than an error", a.code);
    check(a.body.drafted === false && a.body.declined === true,
      "it comes back marked declined, which is what draws the other door rather than an alarm",
      JSON.stringify(a.body).slice(0, 90));
    check(String(a.body.why || "").indexOf("well enough") >= 0,
      "in the assistant's own words — which framework it does not know is the useful part (§125, reversed)",
      a.body.why);
    check(before === (await c.query("SELECT count(*)::int AS n FROM frameworks")).rows[0].n,
      "and nothing was written, as with any other draft");
  });

  await section("a section it invented is dropped", async () => {
    answers(drafted({ section: "Frameworks I Have Just Made Up" }));
    const a = await frameworksAction(c, ADMIN, { action: "draft", name: "X" });
    check(a.body.draft.section === "",
      "a ninth section never reaches the draft — the eight are fixed (decision 1), and the admin picks",
      a.body.draft.section);
    /* BOTH ENDS: a build that emptied the section always would pass the one
       above and make every draft ask for a section nobody offered. */
    const real = (await c.query("SELECT section FROM frameworks ORDER BY idx LIMIT 1")).rows[0].section;
    answers(drafted({ section: real }));
    const b = await frameworksAction(c, ADMIN, { action: "draft", name: "X" });
    check(b.body.draft.section === real, "and a real one survives untouched", b.body.draft.section);
    /* THE NAME FALLS BACK TO WHAT WAS TYPED: a draft with no name cannot be
       saved at all, and the person has already said what it is called. */
    answers(drafted({ name: "" }));
    const d = await frameworksAction(c, ADMIN, { action: "draft", name: "The Typed Name" });
    check(d.body.draft.name === "The Typed Name", "a nameless draft takes the name that was typed", d.body.draft.name);
  });

  await section("asking it", async () => {
    const first = (await c.query("SELECT id, name FROM frameworks ORDER BY idx LIMIT 2")).rows;
    answers({ answered: true, reply: "Two bear on this.", source: "[" + first[0].id + "], " + first[1].id });
    const a = await frameworksAction(c, CONSULTANT, { action: "ask", question: "Which tool for a price war?" });
    check(a.code === 200 && a.body.answered === true, "an ordinary consultant asks and is answered", a.code);
    check(a.body.reply === "Two bear on this.", "in the assistant's words", a.body.reply);
    const src = a.body.sources || [];
    check(src.length === 2, "with both sources named", src.length);
    check(src[0].id === first[0].id && src[0].name === first[0].name,
      "each resolved to a real framework, name and all", JSON.stringify(src[0]).slice(0, 80));
    check(!!src[0].purpose, "carrying what it is for, so the row says why before it is opened");

    /* THE WHOLE LIBRARY IS THE CORPUS, and only the five that decide which
       tool this is — the other four would be some 140 KB in one prompt, and
       a prompt cut in half answers confidently from what survived the cut. */
    const sent = prompt();
    /* THE NAME, not the id (§113.8): `assistant.cjs` falls back to a corpus
       built from `kb` when corpusText is empty, and `kb` here carries the ids
       — so an id-shaped assertion is TRUE of a build that sent eighty bare
       ids and no frameworks at all, which is exactly what must fail. */
    check(sent.indexOf(first[0].name) >= 0, "every framework is in the prompt, by name", first[0].name);
    check(sent.indexOf("[" + first[0].id + "]") >= 0, "with its id, which is what a citation resolves against");
    check(sent.indexOf("When to use it:") >= 0, "and the five that decide which tool it is");
    check(sent.indexOf("Facilitation tips") < 0 && sent.indexOf("facilitation_tips") < 0,
      "and NOT the other four — the corpus is the deciding fields, not the whole entry");
    check(cfg().thinkingConfig && cfg().thinkingConfig.thinkingBudget === 0,
      "asking is a LOOKUP and keeps every default the platform has — the cap included",
      JSON.stringify(cfg().thinkingConfig));
    check(cfg().maxOutputTokens === 2048, "including the output budget", cfg().maxOutputTokens);

    /* A CITED ID NOBODY HAS IS DROPPED, never drawn (§96.2): the page makes
       every source a door, so an unresolved one sends somebody to a 404. */
    answers({ answered: true, reply: "Here.", source: "00000000-0000-0000-0000-0000000000ff, " + first[0].id });
    const b = await frameworksAction(c, CONSULTANT, { action: "ask", question: "x" });
    check((b.body.sources || []).length === 1,
      "an id nobody has is dropped rather than drawn", (b.body.sources || []).length);
    check((b.body.sources || [])[0].id === first[0].id, "and the real one survives beside it");
  });

  await section("when the library has nothing", async () => {
    answers({ answered: false, reply: "I have nothing on pre-mortems.", source: "" });
    const con = await frameworksAction(c, CONSULTANT, { action: "ask", question: "How do we run a pre-mortem?" });
    check(con.body.answered === false, "it declines rather than reaching for something close", con.body.answered);
    /* THE SENTENCE IS THE PRODUCT'S, NEVER THE MODEL'S (§125) — and it is
       different for the one person who can do something about it, which is
       the third way in to adding. */
    check(String(con.body.reply).indexOf("asking the office") >= 0,
      "and says the useful thing, in the product's own words", con.body.reply);
    check(String(con.body.reply).indexOf("I have nothing on pre-mortems") < 0,
      "the model's own sentence is not what is shown");
    const adm = await frameworksAction(c, ADMIN, { action: "ask", question: "How do we run a pre-mortem?" });
    check(String(adm.body.reply).indexOf("you can add it") >= 0,
      "an admin is told they can add it — the same answer, the door on it", adm.body.reply);
    check(con.body.reply !== adm.body.reply, "and the two genuinely differ", con.body.reply === adm.body.reply);
    check((adm.body.sources || []).length === 0, "a decline names no sources");
    /* NOTHING IS STORED, which is the memory's own decision holding here for
       a second reason: the library records what the firm PUBLISHED, not what
       somebody went looking for. */
    const n = (await c.query("SELECT count(*)::int AS n FROM frameworks")).rows[0].n;
    check(n === 80, "and asking wrote nothing", n);

    const empty = await frameworksAction(c, CONSULTANT, { action: "ask", question: "   " });
    check(empty.body.why === "there is no question", "an empty question is refused before the model is reached", empty.body.why);
  });

  await section("saving one", async () => {
    const sec = (await c.query("SELECT section FROM frameworks ORDER BY idx LIMIT 1")).rows[0].section;
    const good = {};
    for (const f of DRAFT_FIELDS) good[f] = f + " text";
    good.name = "The Endurance Lens (Forefront)";
    good.section = sec;

    const n = async () => (await c.query("SELECT count(*)::int AS n FROM frameworks")).rows[0].n;
    const top = async () => (await c.query("SELECT max(idx)::int AS n FROM frameworks")).rows[0].n;
    const was = await n(), wasTop = await top();

    const con = await frameworksAction(c, CONSULTANT, { action: "save", draft: good });
    check(con.code === 403, "an ordinary consultant cannot save one", con.code);
    check(await n() === was, "and the refusal wrote nothing", was + " → " + await n());

    const a = await frameworksAction(c, ADMIN, { action: "save", draft: good });
    check(a.code === 200 && a.body.ok, "an admin saves it", a.code + " " + JSON.stringify(a.body).slice(0, 80));
    /* EVERY READ AFTER THE SAVE DEGRADES (§215). Under `no-admin-gate` the
       consultant's save has already taken the slug, so this one 409s and
       there is no id — and a query on `undefined` dies on uuid syntax,
       taking the ten assertions after it with it. */
    const r = a.body.id
      ? (await c.query("SELECT * FROM frameworks WHERE id = $1", [a.body.id])).rows[0]
      : null;
    check(!!r, "the row is there");
    check(r && r.slug === slugFor(good.name) && r.slug === "the-endurance-lens-forefront",
      "with the slug minted from the name, the dataset's own rule", r && r.slug);
    check(r && r.idx === wasTop + 1, "at the end of the book, moving no section (§101's units.idx)", r && r.idx);
    check(r && r.added_by === ADMIN.id, "carrying who added it", r && r.added_by);
    check(r && r.facilitation_tips === "facilitationTips text",
      "and every one of the eleven landed in its own column", r && r.facilitation_tips);
    /* IT READS BACK THROUGH THE PRODUCT, not only out of the table: the
       author is the whole reason `one` LEFT JOINs, and this is the first row
       in the library that has one. */
    const one = a.body.id
      ? await frameworksAction(c, CONSULTANT, { action: "one", id: a.body.id })
      : { body: {} };
    check(one.body.framework && one.body.framework.addedBy === "An Admin",
      "and an ordinary consultant reads it with its author's name on it", one.body.framework && one.body.framework.addedBy);

    /* THE COLLISION, REFUSED BY NAME (§87): the same tool under a second
       author's name genuinely wants the same address, and the person needs to
       know WHICH row is in the way. */
    const clash = await frameworksAction(c, ADMIN, { action: "save", draft: good });
    check(clash.code === 409, "saving the same name again is refused", clash.code);
    check(String(clash.body.error).indexOf("The Endurance Lens (Forefront)") >= 0,
      "and the refusal NAMES the framework already holding that address", clash.body.error);
    check(await n() === was + 1, "with nothing written by the refusal", await n());
  });

  await section("what saving refuses, each by name", async () => {
    const sec = (await c.query("SELECT section FROM frameworks ORDER BY idx LIMIT 1")).rows[0].section;
    const n = async () => (await c.query("SELECT count(*)::int AS n FROM frameworks")).rows[0].n;
    const was = await n();
    const base = {};
    for (const f of DRAFT_FIELDS) base[f] = "x";
    const bad = async (over, why) => {
      const a = await frameworksAction(c, ADMIN, { action: "save", draft: { ...base, section: sec, name: "A Name", ...over } });
      check(a.code === 400, why + " — refused", a.code);
      return a.body.error;
    };
    /* THE DATABASE'S OWN CHECK, SAID EARLY (§184): a constraint error names a
       constraint, and the person needs to be told which box. */
    check(String(await bad({ name: "   " }, "no name")).indexOf("name") >= 0, "…and the sentence says it is the name");
    check(String(await bad({ section: "" }, "no section")).indexOf("section") >= 0, "…and that one says it is the section");
    const inv = await bad({ section: "Nowhere At All" }, "a section that does not exist");
    check(String(inv).indexOf("Nowhere At All") >= 0,
      "…and names the section nobody has, rather than saying something is wrong", inv);
    /* A NAME OF PUNCTUATION slugs to nothing, which the database would take
       once and refuse for ever after. */
    const pun = await bad({ name: "——" }, "a name that gives no address");
    check(String(pun).indexOf("letters") >= 0, "…and says what is missing", pun);
    check(await n() === was, "and not one of the four wrote anything", was + " → " + await n());
  });

} finally {
  await c.query("ROLLBACK").catch(() => {});
  c.release();
  await pool.end();
  server.close();
}

console.log("\n" + oks + " passed, " + fails + " failed");
process.exit(fails ? 1 : 0);
