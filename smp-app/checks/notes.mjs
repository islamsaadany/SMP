/* MEETING NOTES — one meeting, one note, and the minutes as an email (spec 055).

   WHAT THIS FILE IS FOR. The five claims that would hurt if they were false:
   that a client's person can neither open nor write to it (decision 8); that
   a second Refine ADDS and never rewrites what the writer edited (decision
   6); that a casual attendee never reaches the client's register (decision
   4); that what went out is kept as it went, though the note goes on being
   edited (decision 6); and that the minutes reach every attendee with an
   address, the sender included, and nobody else.

   BOTH ENDS, EVERY TIME (§94.2): every refusal is asserted beside the same
   act ALLOWED to somebody the rule admits, or a build that refused everybody
   passes half of it (§113.8). What is DRIVEN and what is READ (§100.3):
     · §1–§2 RUN the pure rules with no database and no network;
     · §3–§6 RUN every statement as `smp_app` with the tenant set, the way
       withTenant does in the product;
     · §7 drives REFINE against a stand-in model and §8 the SEND against a
       stand-in mail service — both stood in FRONT of the real code on the
       environment variables that exist for exactly that (§100.3, §142.6),
       so what was asked and what left are read off the wire rather than
       reasoned about;
     · §9 drives the module's own SERVER at both ends of every act;
     · §10 READS the catalogue: both tables fenced and forced, their policy
       IDENTICAL to an existing tenant table's (§94.8), neither on the
       platform's own list (§331), and the columns spec 055 §5 names;
     · §11 serves it over a port and PRESSES it in Chromium, reading the
       database back after every press (§70, §96).

     DATABASE_URL_UNPOOLED=postgres://owner@… node checks/notes.mjs
     SMP_BREAK=no-office-gate     node checks/notes.mjs   # must go red
     SMP_BREAK=rewrite-on-refine  node checks/notes.mjs   # must go red
     SMP_BREAK=casual-to-register node checks/notes.mjs   # must go red
     SMP_BREAK=snapshot-moves     node checks/notes.mjs   # must go red
     SMP_BREAK=no-copy-to-sender  node checks/notes.mjs   # must go red
     SMP_BREAK=close-on-tick      node checks/notes.mjs   # must go red
     SMP_BREAK=title-as-heading   node checks/notes.mjs   # must go red
     SMP_BREAK=date-two-presses   node checks/notes.mjs   # must go red      */
import pg from "pg";
import { createServer } from "node:http";

let ok = 0;
const bad = [];
const check = (what, good, detail) => {
  if (good) { ok++; console.log("  ok   " + what); }
  else { bad.push(what); console.log("  FAIL " + what + (detail === undefined ? "" : "  — " + String(detail).slice(0, 240))); }
};
const section = (n) => console.log("\n" + n);
/* EVERY PROBE DEGRADES (§215): a thrown probe is a failure in the throw's own
   words, never a run that stopped and printed fewer failures. */
const probe = async (what, fn) => { try { return await fn(); } catch (e) { check(what, false, "threw: " + String((e && e.message) || e)); return undefined; } };

/* ── THE TWO STAND-INS, IN FRONT OF THE REAL CODE ──────────────────────
   Both are started and named in the environment BEFORE lib/notes.ts is
   imported, because lib/mailer.cjs reads its endpoint once at load. Each
   KEEPS what arrived, so what was asked and what left are facts. */
let modelSeen = null, modelAnswer = null, modelStatus = 200;
const model = createServer((req, res) => {
  let b = "";
  req.on("data", (d) => { b += d; });
  req.on("end", () => {
    try { modelSeen = JSON.parse(b); } catch { modelSeen = null; }
    res.writeHead(modelStatus, { "Content-Type": "application/json" });
    res.end(JSON.stringify(modelStatus === 200
      ? { candidates: [{ content: { parts: [{ text: JSON.stringify(modelAnswer) }] } }] }
      : { error: { message: "the stand-in was told to refuse" } }));
  });
});
let mailSeen = [], mailFail = null;
const mail = createServer((req, res) => {
  let b = "";
  req.on("data", (d) => { b += d; });
  req.on("end", () => {
    let j = null; try { j = JSON.parse(b); } catch {}
    mailSeen.push(j);
    if (mailFail && j && String((j.to || [])[0] || "").includes(mailFail)) {
      res.writeHead(422, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "The stand-in refused that address." }));
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ id: "stub-" + mailSeen.length }));
  });
});
await new Promise((r) => model.listen(0, "127.0.0.1", r));
await new Promise((r) => mail.listen(0, "127.0.0.1", r));
process.env.GEMINI_ENDPOINT = "http://127.0.0.1:" + model.address().port + "/";
process.env.GEMINI_API_KEY = "AIzaStubStubStubStubStubStubStubStubStu";
process.env.SMP_RESEND_ENDPOINT = "http://127.0.0.1:" + mail.address().port;
process.env.RESEND_API_KEY = "test-key-not-real";
process.env.SMP_MAIL_FROM = "smp@example.test";

const { usePools } = await import("../lib/db.ts");
const { SCHEMA } = await import("../db/schema-name.mjs");
const { PLATFORM_TABLES } = await import("../lib/schema-check.ts");
const N = await import("../lib/notes.ts");
const { serve } = await import("../modules/notes/index.ts");
const { notesDocument, sentWord } = await import("../modules/notes/page.ts");

const brk = process.env.SMP_BREAK || "";
const TODAY = "2026-09-16";

/* ══ §1 · what a note is made of ═════════════════════════════════════ */
section("§1 · attendees, dates and the minutes' shape");
check("a register attendee is a KEY and a casual one a name and an address (decision 4)",
  JSON.stringify(N.attendeesOf([{ key: "islam" }, { name: "Karim Fawzy", email: "Karim@Partner.Example" }])) ===
  '[{"key":"islam"},{"name":"Karim Fawzy","email":"karim@partner.example"}]',
  JSON.stringify(N.attendeesOf([{ key: "islam" }, { name: "Karim Fawzy", email: "Karim@Partner.Example" }])));
check("...somebody named twice is on the meeting once", N.attendeesOf([{ key: "a" }, { key: "a" }]).length === 1);
check("...and an entry that is neither is dropped, never guessed at (§96.2)",
  N.attendeesOf([{ name: "No address" }, { email: "nobody@x.test" }, "islam", null, { name: "Bad", email: "not-an-address" }]).length === 0);
check("an address is an address, or it is nothing", N.emailOf("a@b.co") === "a@b.co" && N.emailOf("a@b") === "" && N.emailOf("") === "" && N.emailOf(null) === "");
check("a date the page cannot read is refused (the tracker's own rule, never a second one)",
  N.calendarDay("16/09/2026") === null && N.calendarDay("2026-02-31") === null && N.calendarDay("2026-09-16") === "2026-09-16");
const M = N.minutesOf({ summary: " Two  lines ", discussed: ["a", "", "  "], agreed: [], actions: [{ what: "Do it", who: "Ramy", when: "20 Sep" }, { what: "", who: "x", when: "y" }], open: ["later"], next: "25 Sep" });
check("the minutes are six parts and nothing else (spec 055 §3)",
  Object.keys(M).join(",") === "summary,discussed,agreed,actions,open,next", Object.keys(M).join(","));
check("...empty lines and an action with no 'what' are dropped", M.discussed.length === 1 && M.actions.length === 1 && M.actions[0].who === "Ramy");
check("...and something that is not minutes at all is refused, never stored as a shape nothing can draw",
  N.minutesOf("summary") === null && N.minutesOf([1, 2]) === null && N.minutesOf(null) === null);
check("empty minutes are known to be empty, so the page offers Refine rather than a page of headings",
  N.minutesEmpty(N.emptyMinutes()) && N.minutesEmpty(null) && !N.minutesEmpty(M));
check("the six words are the ones the mockup was signed off with",
  N.PARTS.map((p) => N.PART_WORD[p]).join(" · ") === "Summary · Discussed · Agreed · Actions · Open · Next meeting");

/* ══ §2 · a second Refine adds and never rewrites ════════════════════ */
section("§2 · a second Refine ADDS (decision 6), and the prompt says what was agreed");
const held = N.minutesOf({
  summary: "The writer's own summary, edited.",
  discussed: ["Mobile's figures are ready by 20 September."], agreed: ["No new tactics."],
  actions: [{ what: "Mobile Q3 figures", who: "Ramy", when: "20 Sep" }], open: [], next: "",
});
const came = N.minutesOf({
  summary: "The model's summary.",
  discussed: ["Mobile's figures are ready by 20 September!", "Marketing moved its spend."],
  agreed: ["No new tactics", "Drafts by 22 September."],
  actions: [{ what: "Mobile Q3 figures", who: "", when: "" }, { what: "Send the footfall data", who: "Karim", when: "" }],
  open: ["Next meeting not fixed."], next: "25 Sep",
});
const merged = N.mergeMinutes(held, came);
check("a line the writer edited survives verbatim", merged.discussed[0] === held.discussed[0], merged.discussed[0]);
check("...and the model's near-repeat of it is not added beside it (one line, not two)",
  merged.discussed.length === 2 && merged.discussed[1] === "Marketing moved its spend.", JSON.stringify(merged.discussed));
check("...the same, said with a full stop and without, is the same line", merged.agreed.length === 2 && merged.agreed[0] === "No new tactics.", JSON.stringify(merged.agreed));
check("an action already there keeps the owner the writer typed", merged.actions[0].who === "Ramy", JSON.stringify(merged.actions[0]));
check("...and a new one is appended", merged.actions.length === 2 && merged.actions[1].what === "Send the footfall data");
check("the writer's summary is kept; the model's is not written over it", merged.summary === held.summary, merged.summary);
check("...and a part the writer left EMPTY takes the model's", merged.next === "25 Sep" && merged.open.length === 1);
check("the prompt says keep every fact, invent nothing, and mark what is unclear (spec 055 §3)",
  /Keep every fact\. Invent nothing\./.test(N.PROMPT) && /question mark rather than guessing/.test(N.PROMPT) &&
  /must be one of the attendees/.test(N.PROMPT) && /language the notes are in/.test(N.PROMPT));
check("...and a second Refine is TOLD to add and never to rewrite", /ADDED; never rewrite/.test(N.PROMPT_AGAIN));
check("the answer's shape is the six parts, required", N.MINUTES_SCHEMA.required.join(",") === "summary,discussed,agreed,actions,open,next");
/* THE SUBJECT SAYS WHICH IT IS (decision 6). */
check("the first send is Minutes, the next is Updated minutes",
  N.subjectFor({ title: "Q3 review", metOn: "2026-09-16", sends: 0 }) === "Minutes: Q3 review — Wed 16 Sep 2026" &&
  N.subjectFor({ title: "Q3 review", metOn: "2026-09-16", sends: 1 }).startsWith("Updated minutes: "),
  N.subjectFor({ title: "Q3 review", metOn: "2026-09-16", sends: 1 }));
/* THE EMAIL IS THE MINUTES (decision 5), and an empty part is not printed. */
const bodyHtml = N.minutesEmailBody(merged, "Wed 16 Sep 2026 · Islam, Ramy · written up by Islam");
/* BOTH ENDS (§94.2): `merged` legitimately HOLDS an open point and a next
   meeting, so asserting their absence over it would report a correct build
   broken — the absence is asserted over minutes whose parts are empty. */
const thinHtml = N.minutesEmailBody(N.minutesOf({ summary: "Short.", discussed: ["One thing."], agreed: [], actions: [], open: [], next: "" }), "meta");
check("the email prints a heading over every part that holds something (§45.2)",
  /Summary/.test(bodyHtml) && /Discussed/.test(bodyHtml) && /Open/.test(bodyHtml) && /Next meeting/.test(bodyHtml),
  (bodyHtml.match(/>[A-Z][a-z]+ ?[a-z]*</g) || []).join(" "));
check("...and none over a part that is empty",
  /Summary/.test(thinHtml) && /Discussed/.test(thinHtml) && !/Agreed/.test(thinHtml) && !/Open/.test(thinHtml) && !/Next meeting/.test(thinHtml),
  (thinHtml.match(/>[A-Z][a-z]+ ?[a-z]*</g) || []).join(" "));
check("...the actions are a table with three columns, and a blank cell is a dash", /<th[^>]*>What<\/th>/.test(bodyHtml) && /&mdash;/.test(bodyHtml));
/* NO COLOUR IS INVENTED HERE (§25, §53.5): every literal in the minutes body
   is one the mail builder already paints, so the pairs `test-mail-contrast.js`
   measures are the pairs a reader sees — and moving that palette moves this. */
const MAILC = (await import("../lib/mail-html.cjs")).default || (await import("../lib/mail-html.cjs"));
const shellHex = new Set(((MAILC.html({ org: "X", title: "Y", body: "z", footer: "f" }).match(/#[0-9A-Fa-f]{6}/g)) || []).map((h) => h.toUpperCase()));
const bodyHex = Array.from(new Set(((bodyHtml.match(/#[0-9A-Fa-f]{6}/g)) || []).map((h) => h.toUpperCase())));
check("...and it invents no colour of its own — every one is the mail builder's",
  bodyHex.length > 0 && bodyHex.every((h) => shellHex.has(h)), bodyHex.filter((h) => !shellHex.has(h)).join(",") || bodyHex.join(","));
check("...every style is inline and no custom property is used — email is not the web (lib/mail-html.cjs)",
  !/var\(--/.test(bodyHtml) && !/<style/.test(bodyHtml) && /style="/.test(bodyHtml));
check("...and the head names the date, who was there and who wrote it up", /Wed 16 Sep 2026 · Islam, Ramy · written up by Islam/.test(bodyHtml));
check("the same minutes are kept as plain text for the platform's own record",
  /SUMMARY/.test(N.minutesText(merged)) && /ACTIONS/.test(N.minutesText(merged)) && /OPEN/.test(N.minutesText(merged)),
  N.minutesText(merged).slice(0, 80));
check("...and the plain text skips an empty part too",
  /SUMMARY/.test(N.minutesText(N.minutesOf({ summary: "Short.", discussed: [], agreed: [], actions: [], open: [], next: "" }))) &&
  !/OPEN/.test(N.minutesText(N.minutesOf({ summary: "Short.", discussed: [], agreed: [], actions: [], open: [], next: "" }))));

/* ══ the database ═════════════════════════════════════════════════════ */
const URL_ = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "";
if (!URL_) {
  console.log("\nNo DATABASE_URL — §3–§11 need one. A check that cannot run is not a check that passed (§54.5).");
  process.exit(1);
}
const pool = new pg.Pool({ connectionString: URL_, max: 4, options: "-c search_path=" + SCHEMA });
const appUrl = new URL(URL_);
appUrl.username = "smp_app";
appUrl.password = process.env.SMP_APP_PASSWORD || "smp_app";
const appPool = new pg.Pool({ connectionString: appUrl.toString(), max: 4, options: "-c search_path=" + SCHEMA });
usePools(pool, appPool);
const owner = async (sql, args) => (await pool.query(sql, args)).rows;
async function asTenant(tenantId, fn) {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    await c.query("SET LOCAL search_path TO " + SCHEMA);
    await c.query("SET LOCAL ROLE smp_app");
    await c.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    const out = await fn(c);
    await c.query("COMMIT");
    return out;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally { c.release(); }
}

let failed = false;
try {
  await owner("SET search_path TO " + SCHEMA);
  const stamp = "nts" + Date.now().toString(36);
  const [{ id: A }] = await owner("INSERT INTO tenants (key, name) VALUES ($1, $2) RETURNING id", [stamp + "-a", "Raya Trade"]);
  const [{ id: B }] = await owner("INSERT INTO tenants (key, name) VALUES ($1, $2) RETURNING id", [stamp + "-b", "RHI"]);
  const person = async (t, key, name, seat, idx, email, unit) => {
    const [u] = await owner("INSERT INTO users (email, name, kind, is_admin, must_change, password_hash) VALUES ($1,$2,'client',false,false,'x') RETURNING id",
      [stamp + "-" + key + "@example.test", name]);
    await owner("INSERT INTO people (tenant_id, key, idx, name, unit_key, extra) VALUES ($1,$2,$3,$4,$5,$6)",
      [t, key, idx, name, unit || null, JSON.stringify(email ? { email } : {})]);
    await owner("INSERT INTO tenant_users (tenant_id, user_id, person_key, seat) VALUES ($1,$2,$3,$4)", [t, u.id, key, seat]);
  };
  await owner("INSERT INTO units (tenant_id, key, idx, name, active) VALUES ($1,'mobile',0,'Mobile',true)", [A]);
  await person(A, "islam", "Islam Saadany", "super", 0, "islam@forefront.test");
  await person(A, "noran", "Noran Essam", "smoteam", 1, "noran@forefront.test");
  await person(A, "ramy", "Ramy Behairy", "none", 2, "ramy@raya.test", "mobile");
  await person(A, "hala", "Hala Mostafa", "none", 3, "", "mobile");   /* no address, on purpose */
  await person(B, "omar", "Omar Khalil", "super", 0, "omar@forefront.test");

  /* ══ §3 · the register a note draws from ════════════════════════════ */
  section("§3 · who can be on a meeting, and what the register answers");
  const reg = await asTenant(A, (c) => N.registerOf(c));
  check("every active person on this client is offerable", ["islam", "noran", "ramy", "hala"].every((k) => reg.has(k)), Array.from(reg.keys()).join(","));
  check("...with their address where the register holds one, and nothing where it does not (§35)",
    reg.get("ramy").email === "ramy@raya.test" && reg.get("hala").email === "", JSON.stringify(reg.get("hala")));
  check("...and where they sit, in the navigation's own words (lib/place.ts)", reg.get("ramy").place === "Mobile", reg.get("ramy").place);
  check("B's people are not A's", !reg.has("omar") && (await asTenant(B, (c) => N.registerOf(c))).has("omar"));
  const officeA = await asTenant(A, (c) => N.officeRows(c));
  check("the office rows are the two seats, in the register's order", officeA.map((p) => p.key).join(",") === "islam,noran", JSON.stringify(officeA));
  const named = N.namedOf([{ key: "ramy" }, { key: "hala" }, { name: "Karim Fawzy", email: "karim@partner.test" }, { key: "gone" }], reg, new Set(officeA.map((p) => p.key)));
  check("a keyed attendee is rendered from the register at draw time (§48)", named[0].name === "Ramy Behairy" && named[0].place === "Mobile");
  check("...one with no address is still an attendee, marked", named[1].name === "Hala Mostafa" && named[1].email === "");
  check("...a casual one says it is for this meeting only", named[2].casual && named[2].place === "this meeting only" && named[2].key === null);
  check("...and somebody the register no longer holds reads as their key, with no address (§35)", named[3].name === "gone" && named[3].email === "");

  /* ══ §4 · the note ══════════════════════════════════════════════════ */
  section("§4 · one meeting, one note");
  const n1 = await asTenant(A, (c) => N.newNote(c, "noran", TODAY));
  check("a new note is today's, with whoever started it already on it", n1.metOn === TODAY && JSON.stringify(n1.attendees) === '[{"key":"noran"}]', JSON.stringify(n1));
  check("...with no minutes at all, never six empty parts (§50.6)", n1.minutes === null && n1.sends === 0);
  await asTenant(A, (c) => N.setFields(c, n1.id, { title: "  Q3 review   preparation ", raw: "ramy: figures by the 20th\nagreed: drafts by 22 sep" }));
  const n1b = await asTenant(A, (c) => N.oneNote(c, n1.id));
  check("the title is one line however it was pasted", n1b.title === "Q3 review preparation", n1b.title);
  check("...and the notes are kept as typed, line breaks and all", n1b.raw.split("\n").length === 2);
  check("a note id from another client answers nothing, never another client's note",
    (await asTenant(B, (c) => N.oneNote(c, n1.id))) === null && (await asTenant(A, (c) => N.listNotes(c))).length === 1 && (await asTenant(B, (c) => N.listNotes(c))).length === 0);
  check("...and a word that is not an id at all answers nothing rather than throwing", (await asTenant(A, (c) => N.oneNote(c, "banana"))) === null);

  /* ══ §5 · refining, against the stand-in model ══════════════════════ */
  section("§5 · Refine — what the model is asked, and what comes back");
  const attendees = N.namedOf([{ key: "noran" }, { key: "ramy" }, { key: "hala" }], reg, new Set(officeA.map((p) => p.key)));
  modelAnswer = { summary: "Preparing the Q3 review.", discussed: ["Mobile's figures are ready by 20 September."], agreed: ["Drafts by 22 September."], actions: [{ what: "Mobile Q3 figures", who: "Ramy", when: "20 Sep" }], open: [], next: "" };
  const r1 = await probe("Refine answers", () => N.refine({ title: n1b.title, metOn: n1b.metOn, raw: n1b.raw, minutes: null }, "Raya Trade", attendees));
  check("the notes come back as minutes", r1 && r1.ok && r1.minutes.summary === modelAnswer.summary, JSON.stringify(r1));
  const asked = (modelSeen && modelSeen.systemInstruction.parts.map((p) => p.text).join("\n")) || "";
  const corpus = (modelSeen && modelSeen.contents[0].parts.map((p) => p.text).join("\n")) || "";
  check("the model is handed the client, the date and the attendees as facts, with the raw notes",
    /Client: Raya Trade/.test(asked) && /Wed 16 Sep 2026/.test(asked) && /Noran Essam, Ramy Behairy, Hala Mostafa/.test(asked) && /figures by the 20th/.test(asked),
    asked.slice(0, 200));
  check("...and it is told the rules we agreed, not asked to invent a format", /Keep every fact/.test(asked) && /six parts/.test(asked));
  check("...under the six-part shape, so the platform never parses prose",
    modelSeen.generationConfig.responseSchema.required.join(",") === "summary,discussed,agreed,actions,open,next");
  check("...answering from the MEETING and not from the knowledge base (needsCorpus:false)", /=== THE MEETING ===/.test(asked) && !/KNOWLEDGE BASE/.test(asked));
  check("...and a first Refine is not told to add to minutes that do not exist", !/ADDED; never rewrite/.test(asked));
  await asTenant(A, (c) => N.setFields(c, n1.id, { minutes: r1.minutes }, "noran"));
  const edited = N.minutesOf({ ...r1.minutes, discussed: ["Mobile's figures are ready by 20 September, seasonality explained."] });
  modelAnswer = { summary: "A new summary the writer will not see.", discussed: ["Marketing moved its spend to Q4."], agreed: [], actions: [], open: [], next: "" };
  const r2 = await probe("Refine again answers", () => N.refine({ title: n1b.title, metOn: n1b.metOn, raw: n1b.raw + "\nyara: spend moved to Q4", minutes: edited }, "Raya Trade", attendees));
  check("a second Refine is told the minutes already written, and to ADD to them",
    /ADDED; never rewrite/.test((modelSeen.systemInstruction.parts.map((p) => p.text).join("\n"))) && /MINUTES ALREADY WRITTEN/.test(modelSeen.contents[0].parts.map((p) => p.text).join("\n") + modelSeen.systemInstruction.parts.map((p) => p.text).join("\n")));
  check("...the writer's edited line survives it whatever the model returns (decision 6)",
    r2 && r2.ok && r2.minutes.discussed[0] === edited.discussed[0], JSON.stringify(r2 && r2.minutes && r2.minutes.discussed));
  check("...the new line is added beside it", r2.ok && r2.minutes.discussed.length === 2 && /Marketing moved/.test(r2.minutes.discussed[1]));
  check("...and the writer's summary is not written over", r2.ok && r2.minutes.summary === edited.summary, r2.ok && r2.minutes.summary);
  /* THE THREE WAYS IT CAN FAIL, EACH LEAVING THE MINUTES UNTOUCHED (§112.2). */
  modelStatus = 500;
  const rBad = await probe("a refused model", () => N.refine({ title: "x", metOn: TODAY, raw: "something", minutes: null }, "Raya Trade", attendees));
  check("a model that refuses is said in words and changes nothing", rBad && !rBad.ok && /could not refine/.test(rBad.why), JSON.stringify(rBad));
  modelStatus = 200;
  modelAnswer = { summary: "", discussed: [], agreed: [], actions: [], open: [], next: "" };
  const rEmpty = await probe("an empty answer", () => N.refine({ title: "x", metOn: TODAY, raw: "something", minutes: null }, "Raya Trade", attendees));
  check("...an answer in a shape the minutes cannot take is refused, not stored", rEmpty && !rEmpty.ok && /shape the minutes cannot take/.test(rEmpty.why), JSON.stringify(rEmpty));
  const rNone = await probe("no notes", () => N.refine({ title: "x", metOn: TODAY, raw: "   ", minutes: null }, "Raya Trade", attendees));
  check("...and there is nothing to refine before anything is typed", rNone && !rNone.ok && /no notes to refine/.test(rNone.why));
  const key = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  const rOff = await probe("no assistant", () => N.refine({ title: "x", metOn: TODAY, raw: "something", minutes: null }, "Raya Trade", attendees));
  check("a deployment with no assistant says so, and the minutes stay yours to write (§61)", rOff && !rOff.ok && /not set up on this deployment/.test(rOff.why), JSON.stringify(rOff));
  process.env.GEMINI_API_KEY = key;
  await asTenant(A, (c) => N.setFields(c, n1.id, { minutes: r2.minutes }, "noran"));

  /* ══ §6 · the send ══════════════════════════════════════════════════ */
  section("§6 · the minutes ARE the email (decision 5), and what went out is kept");
  await asTenant(A, (c) => N.setFields(c, n1.id, { attendees: [{ key: "noran" }, { key: "ramy" }, { key: "hala" }, { name: "Karim Fawzy", email: "karim@partner.test" }] }));
  const ready = await asTenant(A, (c) => N.oneNote(c, n1.id));
  mailSeen = [];
  const s1 = await probe("the send answers", () => asTenant(A, (c) => N.sendMinutes(c, ready, { personKey: "noran", seat: "smoteam" }, "Raya Trade", { bar: "#16325C", accent: "#B8862B" })));
  check("one email per attendee with an address, and none to the one without", s1 && s1.ok && s1.sent === 3 && s1.skipped.join() === "Hala Mostafa", JSON.stringify(s1));
  const went = mailSeen.map((m) => (m.to || [])[0]).sort().join(",");
  /* NORAN IS AN ATTENDEE AS WELL AS THE SENDER, so this send proves she is
     written to ONCE and proves nothing about the copy — the copy is its own
     subject, on the second send below, whose sender is not on the meeting
     (§113.8: an assertion satisfied by something other than its subject). */
  check("...nobody but the attendees is written to", went === "karim@partner.test,noran@forefront.test,ramy@raya.test", went);
  check("...every address is asked for exactly once", new Set(mailSeen.map((m) => (m.to || [])[0])).size === mailSeen.length);
  const one = mailSeen[0];
  check("the subject says these are the minutes, of this meeting, on this date", /^Minutes: Q3 review preparation — Wed 16 Sep 2026$/.test(one.subject), one.subject);
  check("...replies go to whoever sent them, from the platform's own address", one.reply_to === "noran@forefront.test" && /Noran Essam </.test(one.from), one.from + " / " + one.reply_to);
  check("...the client's name and colour are on it, and the minutes are in the body",
    /Raya Trade/.test(one.html) && /#16325C/i.test(one.html) && /Mobile's figures are ready by 20 September, seasonality explained\./.test(one.html), one.html.slice(0, 120));
  check("...it carries no data-URI image, which mail clients block (§72)", !/src="data:/.test(one.html));
  check("...and it tells the reader a correction comes again, marked as updated", /marked as updated/.test(one.html));
  const sends1 = await asTenant(A, (c) => N.sendsOf(c, n1.id));
  check("the send is kept: who, when, to whom, and how each fared", sends1.length === 1 && sends1[0].sentBy === "noran" && sends1[0].to.length === 3 && sends1[0].to.every((t) => t.ok), JSON.stringify(sends1[0] && sends1[0].to));
  check("...and it is the FIRST send, so it is not an update", sends1[0].isUpdate === false);
  check("the platform's own record holds it too, as minutes", (await owner("SELECT kind, subject, total, sent FROM messages WHERE tenant_id = $1", [A])).map((m) => m.kind + ":" + m.total + ":" + m.sent).join() === "minutes:3:3");
  /* THE NOTE GOES ON BEING EDITED AND THE RECORD DOES NOT MOVE (decision 6). */
  await asTenant(A, (c) => N.setFields(c, n1.id, { minutes: N.minutesOf({ ...r2.minutes, summary: "Rewritten after the send." }) }));
  const after = await asTenant(A, (c) => N.sendsOf(c, n1.id));
  /* COMPARED WITH THE MINUTES AS THEY WERE AT SEND TIME, never with a second
     reading of the same row: a snapshot that stored nothing compares equal to
     itself at both moments and satisfies that perfectly (§113.8). */
  check("what was kept IS what went out", sends1[0].minutes.summary === r2.minutes.summary && sends1[0].minutes.discussed.join("|") === r2.minutes.discussed.join("|"),
    JSON.stringify(sends1[0].minutes.summary) + " vs " + JSON.stringify(r2.minutes.summary));
  check("editing the minutes after a send does not move what went out (§42)",
    after[0].minutes.summary === r2.minutes.summary && after[0].minutes.summary !== "Rewritten after the send.", after[0].minutes.summary);
  check("...and the note itself does hold the new words — both ends", (await asTenant(A, (c) => N.oneNote(c, n1.id))).minutes.summary === "Rewritten after the send.");
  mailSeen = []; mailFail = "karim";
  const sent2 = await asTenant(A, (c) => N.oneNote(c, n1.id));
  const s2 = await probe("the second send answers", () => asTenant(A, (c) => N.sendMinutes(c, sent2, { personKey: "islam", seat: "super" }, "Raya Trade", { bar: "#16325C", accent: "#B8862B" })));
  check("a second send says Updated minutes (decision 6)", s2 && s2.ok && /^Updated minutes: /.test(mailSeen[0].subject), mailSeen[0] && mailSeen[0].subject);
  check("...and any office person may send, not only whoever wrote it (decision 8)", s2.ok && s2.sent > 0);
  check("...the sender gets a copy though they were not at the meeting",
    mailSeen.some((m) => (m.to || [])[0] === "islam@forefront.test"), mailSeen.map((m) => (m.to || [])[0]).sort().join(","));
  check("an address the provider refuses is counted and named, and the others still go", s2.failed === 1 && s2.sent === 3, JSON.stringify(s2));
  const sends2 = await asTenant(A, (c) => N.sendsOf(c, n1.id));
  check("...the refusal is kept on the send, in the provider's own words", sends2[0].to.some((t) => !t.ok && /stand-in refused/.test(t.error || "")), JSON.stringify(sends2[0].to.find((t) => !t.ok)));
  check("...and the first send is still there, unchanged", sends2.length === 2 && sends2[1].minutes.summary === sends1[0].minutes.summary);
  mailFail = null;
  /* NOTHING TO SEND, AND NOBODY TO SEND TO — both refused in words (§221). */
  const bare = await asTenant(A, (c) => N.newNote(c, "noran", TODAY));
  const sNo = await asTenant(A, (c) => N.sendMinutes(c, bare, { personKey: "noran", seat: "smoteam" }, "Raya Trade", { bar: "", accent: "" }));
  check("a note with no minutes is not sent, and says why", !sNo.ok && /minutes are empty/.test(sNo.why), JSON.stringify(sNo));
  await asTenant(A, (c) => N.setFields(c, bare.id, { minutes: M, attendees: [{ key: "hala" }] }));
  const noAddr = await asTenant(A, (c) => N.oneNote(c, bare.id));
  const sNone = await asTenant(A, (c) => N.sendMinutes(c, noAddr, { personKey: null, seat: "smoteam" }, "Raya Trade", { bar: "", accent: "" }));
  check("...and a meeting where nobody has an address is not sent either", !sNone.ok && /nobody to send the minutes to/.test(sNone.why), JSON.stringify(sNone));

  /* ══ §7 · the module's own server ═══════════════════════════════════ */
  section("§7 · the server — the office in, a client's person out, every act both ends");
  const call = async (tenant, who, rest, body, q) => {
    const url = "https://smp.example/x/notes" + rest.map((r) => "/" + r).join("") + (q || "");
    const req = body ? new Request(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) : new Request(url);
    const res = await serve({ req, slug: "x", module: "notes", tenantId: tenant, tenantName: tenant === A ? "Raya Trade" : "RHI",
      have: ["strategy", "notes"], rest, personKey: who.personKey, seat: who.seat });
    const text = await res.text();
    let j = null; try { j = JSON.parse(text); } catch {}
    return { status: res.status, text, j, to: res.headers.get("location") || "" };
  };
  const NORAN = { personKey: "noran", seat: "smoteam" }, ISLAM = { personKey: "islam", seat: "super" }, RAMY = { personKey: "ramy", seat: "none" };
  const list = await call(A, NORAN, [], null);
  check("the office opens the list", list.status === 200 && /<title>Raya Trade &mdash; Meeting Notes<\/title>/.test(list.text), list.status + " " + (list.text.match(/<title>[^<]*/) || [""])[0]);
  check("...newest first, under the month it happened in, with what went out", /September 2026/.test(list.text) && /Q3 review preparation/.test(list.text) && /class="sent upd"/.test(list.text));
  check("...and nothing on it is inline script — the policy would silence it", !/<script>|onclick=/i.test(list.text) && /app\.js"><\/script>/.test(list.text));
  const shut = await call(A, RAMY, [], null);
  check("the client's own person is turned away with a sentence, not a page", shut.status === 403 && /Meeting Notes is the office/.test(shut.text) && !/data-act="new"/.test(shut.text), String(shut.status));
  check("...and at the api too, not only on the page (§42)", (await call(A, RAMY, ["api"], { act: "new" })).status === 403);
  check("somebody with no membership at all is turned away", (await call(A, { personKey: null, seat: null }, [], null)).status === 403);
  check("the script is served by the module itself, talking to its own api", (await call(A, NORAN, ["app.js"], null)).text.includes("data-api"));
  check("a word the module does not draw comes back to the list", (await call(A, NORAN, ["nothing-here"], null)).status === 302);
  check("GET at the api is not a write", (await call(A, NORAN, ["api"], null)).status === 405);
  const made = await call(A, NORAN, ["api"], { act: "new" });
  check("a new meeting is started and the page answers with it", made.j && made.j.ok && made.j.note && /class="ttl"/.test(made.j.body), made.text.slice(0, 120));
  const nid = made.j.note;
  check("...and it opens on the notes box, with no minutes and nothing to send yet",
    /data-act="raw"/.test(made.j.body) && /Refine into minutes/.test(made.j.body) && /data-act="send"[^>]*aria-disabled="true"/.test(made.j.body));
  check("the title is written on leaving the box", (await call(A, NORAN, ["api"], { act: "title", note: nid, value: "Cycle kick-off" })).j.ok &&
    (await asTenant(A, (c) => N.oneNote(c, nid))).title === "Cycle kick-off");
  check("a date the page cannot read is refused in words", (await call(A, NORAN, ["api"], { act: "date", note: nid, value: "16/09/2026" })).status === 400);
  check("...and a real one is written — both ends", (await call(A, NORAN, ["api"], { act: "date", note: nid, value: "2026-09-02" })).j.ok &&
    (await asTenant(A, (c) => N.oneNote(c, nid))).metOn === "2026-09-02");
  const addedRamy = await call(A, NORAN, ["api"], { act: "add-attendee", note: nid, key: "ramy" });
  check("an attendee is added from the register", addedRamy.j.ok && (await asTenant(A, (c) => N.oneNote(c, nid))).attendees.some((x) => x.key === "ramy"));
  check("...somebody who is not on it is refused, and nothing is written", (await call(A, NORAN, ["api"], { act: "add-attendee", note: nid, key: "omar" })).status === 400);
  const casual = await call(A, NORAN, ["api"], { act: "add-attendee", note: nid, name: "Karim Fawzy", email: "karim@partner.test" });
  check("a casual attendee is added by name and address", casual.j.ok && (await asTenant(A, (c) => N.oneNote(c, nid))).attendees.some((x) => x.email === "karim@partner.test"));
  /* THE ONE THAT WOULD HURT MOST QUIETLY (decision 4). */
  check("...and is NOT written to the client's register", !(await asTenant(A, (c) => N.registerOf(c))).has("karim-partner-test"),
    Array.from((await asTenant(A, (c) => N.registerOf(c))).keys()).join(","));
  check("...a casual attendee with no address is refused, because the minutes could not reach them", (await call(A, NORAN, ["api"], { act: "add-attendee", note: nid, name: "Nobody" })).status === 400);
  check("an attendee is taken off again", (await call(A, NORAN, ["api"], { act: "drop-attendee", note: nid, key: "ramy" })).j.ok &&
    !(await asTenant(A, (c) => N.oneNote(c, nid))).attendees.some((x) => x.key === "ramy"));
  modelAnswer = { summary: "A short kick-off.", discussed: ["The cycle opens on Monday."], agreed: [], actions: [], open: [], next: "" };
  await call(A, NORAN, ["api"], { act: "raw", note: nid, value: "cycle opens monday" });
  const refined = await call(A, NORAN, ["api"], { act: "refine", note: nid });
  check("Refine writes the minutes and says so", refined.j.ok && /minutes are written/.test(refined.j.said) && /A short kick-off\./.test(refined.j.body), refined.j.said);
  check("...and who refined it, and when, is kept", (await asTenant(A, (c) => N.oneNote(c, nid))).refinedBy === "noran");
  check("the minutes are edited in place and saved", (await call(A, NORAN, ["api"], { act: "minutes", note: nid, minutes: { ...modelAnswer, summary: "Edited by hand." } })).j.ok &&
    (await asTenant(A, (c) => N.oneNote(c, nid))).minutes.summary === "Edited by hand.");
  check("...and clearing every box stores an ABSENCE, not six empty parts (§50.6)",
    (await call(A, NORAN, ["api"], { act: "minutes", note: nid, minutes: N.emptyMinutes() })).j.ok &&
    (await asTenant(A, (c) => N.oneNote(c, nid))).minutes === null);
  check("something that is not minutes at all is refused", (await call(A, NORAN, ["api"], { act: "minutes", note: nid, minutes: "prose" })).status === 400);
  check("an act this page does not do is refused, and writes nothing", (await call(A, NORAN, ["api"], { act: "publish", note: nid })).status === 400);
  check("a note from another client cannot be written by this client's server", (await call(B, { personKey: "omar", seat: "super" }, ["api"], { act: "title", note: nid, value: "x" })).status === 404);
  check("...nor one that has been deleted", (await call(A, NORAN, ["api"], { act: "title", note: "11111111-1111-4111-8111-111111111111", value: "x" })).status === 404);
  const gone = await call(A, ISLAM, ["api"], { act: "delete", note: nid });
  check("any office person may delete a note, and the page goes back to the list", gone.j.ok && gone.j.gone === true && (await asTenant(A, (c) => N.oneNote(c, nid))) === null);
  const opened = await call(A, NORAN, [], null, "?note=" + n1.id);
  check("one note opens on its own page, with its minutes beside its notes", /class="two"/.test(opened.text) && /data-part="summary"/.test(opened.text) && /data-act="raw"/.test(opened.text));
  check("...its attendees as chips, the one with no address marked", /class="chip warn"/.test(opened.text) && /Hala Mostafa/.test(opened.text) && /class="chip once"/.test(opened.text));
  check("...and its history, newest first", /sent updated minutes to/.test(opened.text) && /started the note/.test(opened.text));
  const missing = await call(A, NORAN, [], null, "?note=11111111-1111-4111-8111-111111111111");
  check("a link to a meeting that is not here says so, with the way back (§35, §61)", /not on this client's list any more/.test(missing.text) && /All meetings/.test(missing.text) === false && /Back to the meetings/.test(missing.text));
  const empty = await notesDocument({ slug: "x", tenantId: B, tenantName: "RHI", have: ["strategy", "notes"], ask: { q: "", note: null }, who: { personKey: "omar", seat: "super" }, today: TODAY });
  check("a client with no meetings is one sentence and a way to start", /No meetings noted for RHI yet/.test(empty) && /data-act="new"/.test(empty));
  const searched = await notesDocument({ slug: "x", tenantId: A, tenantName: "Raya Trade", have: ["strategy", "notes"], ask: { q: "zzz", note: null }, who: NORAN, today: TODAY });
  check("a search that finds nothing says so and offers the way back", /Nothing matches/.test(searched) && /see them all/.test(searched));
  const noDb = await notesDocument({ slug: "x", tenantId: "not-a-tenant-id", tenantName: "Raya Trade", have: ["strategy", "notes"], ask: { q: "", note: null }, who: NORAN });
  check("a list that could not be read says so, and is not drawn as empty (§35, §93)", /could not be read/.test(noDb) && !/No meetings noted/.test(noDb));
  check("the word on a row says what went out", sentWord({ sends: 0 }, TODAY).word === "Not sent" &&
    sentWord({ sends: 1, lastSentAt: "2026-09-16T10:00:00Z", lastSentUpdate: true }, TODAY).word === "Updated 16 Sep" &&
    sentWord({ sends: 1, lastSentAt: "2026-09-16T10:00:00Z", lastSentUpdate: false }, TODAY).word === "Sent 16 Sep",
    sentWord({ sends: 1, lastSentAt: "2026-09-16T10:00:00Z", lastSentUpdate: true }, TODAY).word);
  /* BOTH ENDS (§94.2): the year is dropped only because it is THIS year — a
     send from another one still says which, or the row is ambiguous. */
  check("...and a send from another year still says which year",
    sentWord({ sends: 1, lastSentAt: "2025-11-04T10:00:00Z", lastSentUpdate: false }, TODAY).word === "Sent 4 Nov 2025",
    sentWord({ sends: 1, lastSentAt: "2025-11-04T10:00:00Z", lastSentUpdate: false }, TODAY).word);

  /* ══ §8 · the catalogue ═════════════════════════════════════════════ */
  section("§8 · both tables fenced, and not the platform's");
  const cat = await owner(
    "SELECT c.relname, c.relrowsecurity AS rls, c.relforcerowsecurity AS force, pg_get_expr(p.polqual, p.polrelid) AS q " +
    "FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace LEFT JOIN pg_policy p ON p.polrelid = c.oid AND p.polname = 'tenant_rows' " +
    "WHERE n.nspname = $1 AND c.relname IN ('notes','note_sends','tracker_actions')", [SCHEMA]);
  const by = Object.fromEntries(cat.map((r) => [r.relname, r]));
  for (const t of ["notes", "note_sends"]) {
    check(t + " has row-level security switched on and FORCED", by[t] && by[t].rls && by[t].force, JSON.stringify(by[t]));
    check(t + "'s policy is IDENTICAL to an existing tenant table's (§94.8)", by[t] && by.tracker_actions && by[t].q === by.tracker_actions.q, by[t] && by[t].q);
    check(t + " is not on the platform's own list (§331)", !PLATFORM_TABLES.includes(t));
  }
  const cols = await owner("SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'notes' ORDER BY ordinal_position", [SCHEMA]);
  check("the note row holds exactly what spec 055 §5 says and no more",
    cols.map((c) => c.column_name).join(",") === "tenant_id,id,title,met_on,attendees,raw,minutes,refined_at,refined_by,created_by,created_at,updated_at,extra",
    cols.map((c) => c.column_name).join(","));
  const scols = await owner("SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'note_sends' ORDER BY ordinal_position", [SCHEMA]);
  check("...and a send keeps who, when, whether it was an update, to whom, and the minutes as sent",
    scols.map((c) => c.column_name).join(",") === "tenant_id,id,note_id,sent_by,sent_at,is_update,subject,recipients,minutes",
    scols.map((c) => c.column_name).join(","));
  check("deleting a note takes its sends with it and leaves the platform's record standing",
    (await asTenant(A, async (c) => { await N.deleteNote(c, n1.id); return (await c.query("SELECT count(*)::int AS n FROM note_sends")).rows[0].n; })) === 0 &&
    (await owner("SELECT count(*)::int AS n FROM messages WHERE tenant_id = $1", [A]))[0].n === 2);

  /* ══ §9 · the page, pressed in a browser ════════════════════════════
     §7 proved the SERVER; nothing above has ever RUN app.js. A script wired
     to nothing renders a page that answers every markup assertion (§96), so
     the module is served over a real port — the same serve() the route calls
     — and Chromium presses the controls while the DATABASE is read back. */
  section("§9 · a note taken, refined and sent, pressed in a browser");
  const srv = createServer(async (rq, rs) => {
    try {
      const chunks = []; for await (const ch of rq) chunks.push(ch);
      const url = "http://smp.test" + rq.url;
      const rest = String(rq.url).split("?")[0].split("/").filter(Boolean).slice(2);
      const req = new Request(url, { method: rq.method, headers: { "Content-Type": rq.headers["content-type"] || "" },
        body: rq.method === "POST" ? Buffer.concat(chunks) : undefined });
      const res = await serve({ req, slug: "x", module: "notes", tenantId: A, tenantName: "Raya Trade",
        have: ["strategy", "notes"], rest, personKey: "noran", seat: "smoteam" });
      rs.writeHead(res.status, Object.fromEntries(res.headers)); rs.end(Buffer.from(await res.arrayBuffer()));
    } catch (e) { rs.writeHead(500); rs.end(String(e)); }
  });
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + srv.address().port + "/x/notes";
  let browser = null;
  try {
    const { chromium } = await import("playwright-core");
    browser = await chromium.launch({ executablePath: process.env.SMP_CHROME || undefined, args: ["--no-sandbox"] });
  } catch (e) { check("a browser to press the controls in (set SMP_CHROME)", false, e.message.split("\n")[0]); }
  if (browser) {
    const pgp = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errs = []; pgp.on("pageerror", (e) => errs.push(String(e))); pgp.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
    const settle = () => pgp.waitForTimeout(400).then(() => pgp.waitForLoadState("load"));
    /* A MARK ON THE WINDOW, so "it stayed" is a fact: every press is answered
       with the page drawn again and swapped in — a reload would satisfy every
       other assertion here (§113.8, §356.12). */
    const stayed = () => pgp.evaluate("window.__stay === 1");
    await pgp.goto(base); await settle();
    await probe("a note is started", async () => {
      await pgp.locator("[data-act=new]").click();
      await pgp.waitForURL(/note=/, { timeout: 5000 });
      await settle();
    });
    const nid2 = new URL(pgp.url()).searchParams.get("note");
    check("+ New meeting opens a note of its own, on the address", !!nid2 && (await asTenant(A, (c) => N.oneNote(c, nid2))) !== null, pgp.url());
    await pgp.evaluate("window.__stay = 1");
    check("the mark is really planted, or 'it stayed' proves nothing", await stayed());
    await pgp.locator("[data-act=title]").fill("Q3 review preparation");
    await pgp.locator("[data-act=raw]").click(); await settle();
    check("the title is saved on leaving the box, with no reload and no Save button",
      (await asTenant(A, (c) => N.oneNote(c, nid2))).title === "Q3 review preparation" && await stayed());
    await pgp.locator("[data-act=raw]").fill("ramy: figures by the 20th\nagreed: drafts by 22 sep");
    await pgp.locator("[data-act=title]").click(); await settle();
    check("...and so are the notes", (await asTenant(A, (c) => N.oneNote(c, nid2))).raw.startsWith("ramy: figures"));
    check("...and the page says so", /Saved just now/.test(await pgp.locator("[data-saved]").innerText()));
    /* THE DATE IS A WORD, AND THE PRESS DOES NOT TAKE THE WORD AWAY (§357.4).
       A raw date box prints whatever spelling the browser's locale chose,
       which the platform uses nowhere — so what is asserted is that the word
       is still the word AFTER the press, which is the whole of what changed.
       The calendar cannot be seen from here (headless draws no native
       picker), so what is measured is that it was ASKED FOR: showPicker is
       recorded on the prototype, which also makes the run deterministic. A
       picker's only observable effect is the value it sets and the change it
       fires, so that is what stands in for a person choosing a day. */
    const dayWord = async () => (await pgp.locator("button[data-act=date]").innerText()).trim();
    check("the date reads in the platform's own words, not the browser's locale",
      /^\w{3} \d{1,2} \w{3} \d{4}$/.test(await dayWord()), await dayWord());
    check("...and the mark beside it is DRAWN, never a character a font may fail to draw (§52)",
      await pgp.locator("button[data-act=date] svg[stroke]").count() === 1);
    /* Hidden IN PLACE, never display:none: a box that is not rendered cannot
       be asked to open its calendar (§45.5's idiom, and its constraint). */
    const box = pgp.locator("input[data-native-date]");
    check("...and the native box is beside it, holding the same day and still rendered",
      await box.count() === 1 && (await box.getAttribute("value")) === (await asTenant(A, (c) => N.oneNote(c, nid2))).metOn &&
      (await box.evaluate((el) => getComputedStyle(el).display)) !== "none",
      await box.evaluate((el) => getComputedStyle(el).display));
    await pgp.evaluate(() => { window.__pick = 0; HTMLInputElement.prototype.showPicker = function () { window.__pick++; }; });
    const wordWas = await dayWord();
    await pgp.locator("button[data-act=date]").click(); await pgp.waitForTimeout(120);
    check("ONE PRESS OPENS THE CALENDAR", await pgp.evaluate(() => window.__pick) === 1);
    check("...and the word is still the word — the day does not reformat under the hand that pressed it",
      await pgp.locator("button[data-act=date]").isVisible() && (await dayWord()) === wordWas &&
      await pgp.locator("input.date").count() === 0, await dayWord());
    await box.evaluate((el) => { el.value = "2026-09-02"; el.dispatchEvent(new Event("change", { bubbles: true })); });
    await settle();
    check("...and the day chosen there is written, with no reload",
      (await asTenant(A, (c) => N.oneNote(c, nid2))).metOn === "2026-09-02" && await stayed());
    check("...and the word says the new day", /2 Sep 2026/.test(await dayWord()), await dayWord());
    /* AND WHERE THE CALENDAR CANNOT BE OPENED FOR THEM — an older Safari or
       Firefox — the press still does something (§61): the box is shown in
       place of the word. It is NOT thrown away on blur, which is the fault
       this same control was measured making one module over (§356.14): the
       calendar takes the focus, so a box dismissed on blur dies the moment it
       is used. */
    await pgp.evaluate(() => { delete HTMLInputElement.prototype.showPicker; });
    await pgp.locator("button[data-act=date]").click(); await pgp.waitForTimeout(120);
    check("with no calendar to open, the press shows the box in place rather than doing nothing",
      await pgp.locator("input[data-native-date]").isVisible() && !(await pgp.locator("button[data-act=date]").isVisible()));
    await pgp.evaluate(() => document.querySelector("input[data-native-date]").blur());
    await pgp.waitForTimeout(250);
    check("...and a blur does not throw it away", await pgp.locator("input[data-native-date]").isVisible());
    await pgp.locator("[data-act=title]").click(); await pgp.waitForTimeout(120);
    check("...and a press elsewhere puts the word back", await pgp.locator("button[data-act=date]").isVisible());
    /* THE TITLE READS AS SOMETHING YOU TYPE IN (Islam, of the built page: "I
       need to set the title manually"). It always was a box — borderless,
       transparent and 21px bold, so it drew as a heading the platform had
       written. Measured as PAINT and never as a class (§94.8): a build that
       renamed the class and kept the look would pass a class assertion and
       fail the person looking at it. Both ends — the box must read as a box
       AND still be the one that writes the title, which the section above
       already proved. */
    const ttl = await pgp.locator("input[data-act=title]").evaluate((el) => {
      const c = getComputedStyle(el);
      return { w: parseFloat(c.borderTopWidth), bg: c.backgroundColor, r: parseFloat(c.borderTopLeftRadius) };
    });
    check("the title is drawn as a box, not as a heading", ttl.w >= 1 && ttl.r >= 1 && !/rgba\(0, 0, 0, 0\)/.test(ttl.bg), JSON.stringify(ttl));
    const keys = (await pgp.locator(".head .lab").allInnerTexts()).map((t) => t.trim());
    check("...and the title and the date carry the page's own key, as everything else on it does",
      keys.length === 2 && /title/i.test(keys[0]) && /date/i.test(keys[1]), JSON.stringify(keys));
    /* THE ATTENDEES, PRESSED. */
    await pgp.locator("[data-act=open-att]").click(); await pgp.waitForTimeout(150);
    check("+ Add attendee opens the register", await pgp.locator(".pick .prow").first().isVisible());
    await pgp.locator("[data-act=find-att]").fill("ramy"); await pgp.waitForTimeout(120);
    const visible = await pgp.locator(".pick .prow:visible").allInnerTexts();
    check("...the search hides rows in place, without a repaint (§35)", visible.length === 1 && /Ramy/.test(visible[0]), JSON.stringify(visible));
    await pgp.locator(".pick .prow:visible").first().click(); await settle();
    check("...picking one puts them on the meeting", (await asTenant(A, (c) => N.oneNote(c, nid2))).attendees.some((x) => x.key === "ramy") && await stayed());
    /* THE LIST STAYS OPEN WHILE YOU TICK (Islam, of the built page: "don't
       close the drop down with each add ... let me make the checks for all the
       attendees"). Every press here is answered by the page drawn again, so
       this is the list being CARRIED across that redraw, not a press being
       skipped — which is why what was typed to find somebody is asserted
       beside it. This block replaces a re-opening press: it was there because
       a tick used to close the list, and pressing the same button now toggles
       it shut, so a check written against the old behaviour would go red on a
       correct build (§214.3, rewritten and never loosened — §218). */
    check("...and the list STAYS OPEN, so several can be ticked in one go",
      /* The LIST, never its first row: the search term is carried across too,
         so the first row is legitimately hidden and asking it would report a
         working build broken. */
      await pgp.locator(".pick").isVisible());
    check("...with the search still holding what was typed",
      (await pgp.locator("[data-act=find-att]").inputValue()) === "ramy",
      await pgp.locator("[data-act=find-att]").inputValue());
    check("...and the row that was ticked is lit",
      (await pgp.locator(".pick .prow:visible").first().getAttribute("data-on")) === "true");
    /* AND THE PASS RECOVERS, so a build that shut the list reddens the two
       assertions above and every one after them still reports (§215, §280):
       without this the next press waits thirty seconds on a hidden box and
       takes the rest of the file down with it. */
    const reopen = async () => { if (!(await pgp.locator(".pick").isVisible())) { await pgp.locator("[data-act=open-att]").click(); await pgp.waitForTimeout(150); } };
    await reopen();
    /* A SECOND PERSON WITHOUT RE-OPENING ANYTHING, which is the whole ask: a
       build that kept the list open and lost the tick would pass everything
       above (§113.8). */
    await pgp.locator("[data-act=find-att]").fill(""); await pgp.waitForTimeout(120);
    const off = pgp.locator('.pick .prow[data-on="false"]').first();
    const offKey = await off.getAttribute("data-key");
    await off.click(); await settle();
    const two = await asTenant(A, (c) => N.oneNote(c, nid2));
    check("...a second person ticked in the same open list",
      two.attendees.some((x) => x.key === "ramy") && two.attendees.some((x) => x.key === offKey) && await stayed(),
      offKey + " / " + JSON.stringify(two.attendees.map((x) => x.key || x.email)));
    check("...and the list is open still", await pgp.locator(".pick").isVisible());
    /* AND THE SECOND PERSON COMES BACK OFF, which proves the tick toggles and
       leaves the meeting exactly as the rest of this file expects to find it
       (§94.2) — without it, every assertion downstream about who the minutes
       reach is measuring a fixture this section changed. */
    await reopen();
    await pgp.locator('.pick .prow[data-key="' + offKey + '"]').click(); await settle();
    const back = await asTenant(A, (c) => N.oneNote(c, nid2));
    check("...and ticking them again takes them off, with the list still open",
      !back.attendees.some((x) => x.key === offKey) && await pgp.locator(".pick").isVisible(),
      JSON.stringify(back.attendees.map((x) => x.key || x.email)));
    await reopen();
    await pgp.locator("[data-att-name]").fill("Karim Fawzy");
    await pgp.locator("[data-att-mail]").fill("karim@partner.test");
    await pgp.locator("[data-act=add-casual]").click(); await settle();
    check("...and somebody who was there and is not on the register is added for this meeting only",
      (await asTenant(A, (c) => N.oneNote(c, nid2))).attendees.some((x) => x.email === "karim@partner.test") &&
      !(await asTenant(A, (c) => N.registerOf(c))).has("karim-partner-test"));
    check("...drawn as a dashed chip that says so", await pgp.locator(".chip.once").first().isVisible());
    /* AND THE WAY OUT, which is the other half of keeping it open (§94.2): it
       is not a confirmation — every tick above is already in the database by
       the time it is pressed — it is the deliberate way to finish, because a
       tablet has no Escape key and that was the only one. */
    await reopen();
    check("the list says each tick is already saved, rather than offering to save them",
      /already saved/i.test(await pgp.locator(".pick .done").innerText()),
      await pgp.locator(".pick .done").innerText());
    await pgp.locator("[data-act=done-att]").click(); await pgp.waitForTimeout(150);
    check("...and Done closes it", !(await pgp.locator(".pick").isVisible()));
    /* REFINE, against the stand-in. */
    modelAnswer = { summary: "Preparing the Q3 review.", discussed: ["Mobile's figures are ready by 20 September."], agreed: ["Drafts by 22 September."], actions: [{ what: "Mobile Q3 figures", who: "Ramy", when: "20 Sep" }], open: [], next: "" };
    await pgp.locator("[data-act=refine]").click(); await settle();
    const refinedRow = await asTenant(A, (c) => N.oneNote(c, nid2));
    check("Refine writes the minutes and draws them beside the notes", refinedRow.minutes && refinedRow.minutes.summary === modelAnswer.summary && await pgp.locator("[data-minutes]").isVisible(), JSON.stringify(refinedRow.minutes));
    check("...silently: the page did not reload", await stayed());
    check("...every part is a box the writer can edit (decision 3)", (await pgp.locator("[data-minutes] [contenteditable]").count()) >= 6);
    check("...and the raw notes are untouched beside them", (await pgp.locator(".side [data-act=raw]").inputValue()).startsWith("ramy: figures"));
    /* EDITED IN PLACE, AND THE EDIT SURVIVES A SECOND REFINE. */
    const firstLi = pgp.locator('[data-part="discussed"] li').first();
    await firstLi.click();
    await pgp.keyboard.press("End");
    await pgp.keyboard.type(" Seasonality explained.");
    await pgp.locator("[data-act=title]").click(); await settle();
    const eRow = await asTenant(A, (c) => N.oneNote(c, nid2));
    check("a minute edited in place is saved on leaving it", /Seasonality explained\./.test(eRow.minutes.discussed[0]), eRow.minutes.discussed[0]);
    modelAnswer = { summary: "A summary the writer will not see.", discussed: ["Marketing moved its spend to Q4."], agreed: [], actions: [], open: [], next: "" };
    await pgp.locator("[data-act=refine]").click(); await settle();
    const eRow2 = await asTenant(A, (c) => N.oneNote(c, nid2));
    check("...and it survives a second Refine, which ADDS (decision 6)",
      /Seasonality explained\./.test(eRow2.minutes.discussed[0]) && eRow2.minutes.discussed.length === 2 && eRow2.minutes.summary === "Preparing the Q3 review.",
      JSON.stringify(eRow2.minutes.discussed));
    /* THE SEND. */
    mailSeen = [];
    await pgp.locator("[data-act=send]").click(); await settle();
    check("Send emails the minutes to the attendees with an address, and a copy to the sender",
      mailSeen.length === 3 && mailSeen.map((m) => m.to[0]).sort().join(",") === "karim@partner.test,noran@forefront.test,ramy@raya.test",
      mailSeen.map((m) => m.to[0]).join(","));
    check("...and says who they went to", /went to 3 people/.test(await pgp.locator("#said").innerText()), await pgp.locator("#said").innerText());
    check("...with the send kept and the page drawn again saying so", (await asTenant(A, (c) => N.sendsOf(c, nid2))).length === 1 && /last went out/.test(await pgp.locator("#body").innerText()) && await stayed());
    /* THE WAY BACK, AND DELETE. */
    await pgp.locator("[data-act=delete-ask]").click(); await pgp.waitForTimeout(120);
    check("Delete asks in the page, never a browser dialog (§95)", await pgp.locator(".sure").isVisible());
    await pgp.locator("[data-act=delete-no]").click(); await pgp.waitForTimeout(120);
    check("...Keep it keeps it", (await asTenant(A, (c) => N.oneNote(c, nid2))) !== null && !(await pgp.locator(".sure").isVisible()));
    await pgp.locator("[data-act=delete-ask]").click(); await pgp.waitForTimeout(120);
    await pgp.locator("[data-act=delete]").click();
    await pgp.waitForURL((u) => !u.searchParams.get("note"), { timeout: 5000 });
    await settle();
    check("...and Yes deletes it and lands on the list", (await asTenant(A, (c) => N.oneNote(c, nid2))) === null && /Meetings/.test(await pgp.locator("h2.pt").innerText()));
    check("no page error from any of it", errs.length === 0, errs.join(" | "));
    await browser.close();
  }
  srv.close();

  await owner("DELETE FROM tenants WHERE id = ANY($1)", [[A, B]]);
  await owner("DELETE FROM users WHERE email LIKE $1", [stamp + "-%"]);
} catch (e) {
  failed = true;
  console.log("\n  DIED: " + ((e && e.stack) || e));
} finally {
  await pool.end().catch(() => {});
  await appPool.end().catch(() => {});
  model.close(); mail.close();
}

console.log("\n" + ok + " passed, " + bad.length + " failed" + (failed ? " — and the run DIED, which is a failure of its own (§215)" : ""));
process.exit(bad.length || failed ? 1 : 0);
