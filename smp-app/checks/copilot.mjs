/* ── THE STRATEGY COPILOT, STAGES 1 AND 2 (spec 064) ─────────────────────────────
   The shelf with no AI yet, checked against a real Postgres:

     · §1 the pure rules — the five sections, the shape of a place word, who
       may delete a chat (both ends, §94.2), and the stamp's own rule;
     · §2 every statement run as `smp_app` with the tenant set — a chat keeps
       what is typed and answers with the product's line, versions only go
       UP (an edit and a restore each ADD one, decisions §3.6/§3.7), two
       presses at once cannot both write the same number, and one client
       cannot see another's chats;
     · §3 the module's own server at both ends of the gate — the office in,
       a client's own person refused at the api AND every read, in words —
       and every act refused where it must be;
     · §1b (stage 2) a Word or Excel file read, or refused in words; an
       answer checked rather than trusted (one recommended option, a source
       naming a file nobody attached read as assumed);
     · §5 (stage 2) the AI READ OFF THE WIRE — a stand-in model on
       GEMINI_ENDPOINT (§100.3) records what it was sent: the guidance, the
       platform's line, the Word file's words, the PDF as itself; then the
       answer kept, assumptions recorded once and sent back, the paste offer,
       a failure and no key each saying so and keeping what was typed;
     · §4 the catalogue — every table RLS-forced with the policy IDENTICAL to
       `tracker_actions`', and none on PLATFORM_TABLES.

   Run it with the database up:
     DATABASE_URL_UNPOOLED=postgres://owner@… node --experimental-strip-types checks/copilot.mjs
   Its breaks (`check:copilot:red`) must each turn it red (§94.5). */
import pg from "pg";
import { usePools } from "../lib/db.ts";
import { SCHEMA } from "../db/schema-name.mjs";
import { PLATFORM_TABLES } from "../lib/schema-check.ts";
import { serve } from "../modules/copilot/index.ts";
import http from "node:http";
import { deflateRawSync } from "node:zlib";
import {
  SECTIONS, isSection, isPlace, mayDeleteChat, MAX_MESSAGE, NO_KEY, copilotStampFor, copilotGrant,
  chatsOn, newChat, messagesOf, recordSaid, recordAnswer, deliverablesOn, newDeliverable, versionsOf, addVersion, restoreVersion,
} from "../lib/copilot.ts";
import { kindOf, readFile, MAX_FILE_BYTES } from "../lib/copilot-files.ts";
import { isPasted, shapeAnswer, corpusOf } from "../lib/copilot-ask.ts";
import { guidanceFor } from "../lib/copilot-guidance.ts";

/* The key decides whether the model is asked at all; this check sets it per
   section, so a key in the environment must not decide it first (§100.3). */
delete process.env.GEMINI_API_KEY;

let ok = 0;
const bad = [];
const check = (what, good, detail) => {
  if (good) { ok++; console.log("  ok   " + what); }
  else { bad.push(what); console.log("  FAIL " + what + (detail ? "  — " + detail : "")); }
};
const section = (n) => console.log("\n" + n);
const probe = async (what, fn) => { try { return await fn(); } catch (e) { check(what, false, "threw: " + String(e && e.message || e)); return undefined; } };

/* ══ §1 · the rules ══════════════════════════════════════════════════ */
section("§1 · the sections, the place word, and who may delete");
check("five sections, in the record's order", SECTIONS.join(",") === "foundation,analysis,directions,execution,advisory");
check("a near miss is not a section", !isSection("Foundation") && !isSection("plan") && isSection("advisory"));
check("a place is the product's own word — group, a unit, fn:, co:, cap:",
  ["group", "mobile", "fn:finance", "co:distribution", "cap:cap6"].every(isPlace));
check("...and nothing else is: an address, a quote, an empty string",
  !isPlace("") && !isPlace("fn:") && !isPlace("mobile/x") && !isPlace("x'--") && !isPlace("zz:q"));
/* §441 (Islam, 2026-10-01) REVERSES "whoever started it may delete": a chat is
   archived by anybody in the office and deleted only by the Super user, and
   only once archived. Rewritten, never loosened (§218) — both ends. */
const live = { archived: "" }, gone = { archived: "2026-10-01T09:00:00Z" };
check("the Super user may delete an ARCHIVED chat", mayDeleteChat(gone, { personKey: "islam", seat: "super" }));
check("...but not one still live — it is archived first", !mayDeleteChat(live, { personKey: "islam", seat: "super" }));
check("...and the SMO team may delete nothing, archived or not, their own included (both ends, §94.2)",
  !mayDeleteChat(gone, { personKey: "omar", seat: "smoteam" }) && !mayDeleteChat(live, { personKey: "omar", seat: "smoteam" }));
check("the tab is stamped for the office where the client has the module", copilotStampFor(["strategy", "copilot"], "smoteam") && copilotStampFor(["strategy", "copilot"], "super"));
check("...and for nobody else — a client's person, or a client without it", !copilotStampFor(["strategy", "copilot"], "none") &&
  !copilotStampFor(["strategy", "copilot"], null) && !copilotStampFor(["strategy"], "super"));
/* §442 — the Copilot column on Roles & access. Nothing stored is the office's
   shipped edit; a client seat is none BY RULE, whatever a stored row says. */
check("the office opens at edit with nothing stored — nobody's access moves the day it ships",
  copilotGrant("super", null) === "edit" && copilotGrant("smoteam", undefined) === "edit");
check("a stored view or none is obeyed for the office", copilotGrant("smoteam", "view") === "view" && copilotGrant("super", "none") === "none");
check("...and a client's person is none even with edit stored (both ends, §94.2)", copilotGrant("none", "edit") === "none" && copilotGrant(null, "edit") === "none");
check("a value outside the two buttons reads as none, never as edit (§96.2)", copilotGrant("smoteam", "fill") === "none");


/* ══ §1b · files and answers, with no database ══════════════════════ */
section("§1b · a file is read or refused in words; an answer is checked, never trusted");
/* A real .docx/.xlsx is a zip: made here, entry by entry, one of them
   deflated, so the reader's inflate path is exercised and not only STORE. */
function zip(files) {
  const locals = [], cents = []; let off = 0;
  for (const [name, text, deflate] of files) {
    const raw = Buffer.from(text, "utf8"), data = deflate ? deflateRawSync(raw) : raw, nm = Buffer.from(name, "utf8");
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(deflate ? 8 : 0, 8);
    lh.writeUInt32LE(data.length, 18); lh.writeUInt32LE(raw.length, 22); lh.writeUInt16LE(nm.length, 26);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(deflate ? 8 : 0, 10); ch.writeUInt32LE(data.length, 20); ch.writeUInt32LE(raw.length, 24);
    ch.writeUInt16LE(nm.length, 28); ch.writeUInt32LE(off, 42);
    locals.push(lh, nm, data); cents.push(ch, nm); off += 30 + nm.length + data.length;
  }
  const cd = Buffer.concat(cents), e = Buffer.alloc(22);
  e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(files.length, 8); e.writeUInt16LE(files.length, 10);
  e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(off, 16);
  return Buffer.concat([...locals, cd, e]);
}
const DOCX = zip([["[Content_Types].xml", "<x/>", false],
  ["word/document.xml", '<w:document><w:body><w:p><w:r><w:t>Mobile &amp; Accessories</w:t></w:r></w:p><w:p><w:r><w:t xml:space="preserve">Share fell </w:t></w:r><w:r><w:t>4 points</w:t></w:r></w:p></w:body></w:document>', true]]);
const XLSX = zip([["xl/workbook.xml", '<workbook><sheets><sheet name="Q3 figures" sheetId="1"/></sheets></workbook>', false],
  ["xl/sharedStrings.xml", "<sst><si><t>Revenue</t></si><si><t>Units</t></si></sst>", true],
  ["xl/worksheets/sheet1.xml", '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1"><v>96</v></c></row><row r="2"><c r="A2" t="s"><v>1</v></c><c r="B2"><v>1200</v></c></row></sheetData></worksheet>', true]]);
check("the three kinds are known by name or by type, and nothing else is",
  kindOf("a.PDF", "") === "pdf" && kindOf("x", "application/vnd.openxmlformats-officedocument.wordprocessingml.document") === "docx" &&
  kindOf("b.xlsx", "") === "xlsx" && kindOf("old.doc", "application/msword") === null && kindOf("c.xls", "") === null && kindOf("n.txt", "text/plain") === null);
const dr = readFile("docx", DOCX);
check("a Word file's paragraphs are read, entities undone, runs joined", dr.ok && dr.text === "Mobile & Accessories\nShare fell 4 points", JSON.stringify(dr));
const xr = readFile("xlsx", XLSX);
check("an Excel file reads as its sheet by name, rows tab-separated, shared strings resolved",
  xr.ok && xr.text === "## Sheet: Q3 figures\nRevenue\t96\nUnits\t1200", JSON.stringify(xr));
check("a PDF is not read here — it goes to the model as itself", (() => { const r = readFile("pdf", Buffer.from("%PDF-1.7 x")); return r.ok && r.text === ""; })());
check("a file that says PDF and is not one is refused in words", (() => { const r = readFile("pdf", Buffer.from("hello")); return !r.ok && /is not one/.test(r.why); })());
check("a Word file that will not open is refused in words, never read as empty", (() => { const r = readFile("docx", Buffer.from("not a zip at all")); return !r.ok && /could not be opened/.test(r.why); })());
check("a paste is long, or long with paragraphs; a sentence is not",
  isPasted("x".repeat(2000)) && isPasted("a".repeat(500) + "\n\n" + "b".repeat(400)) && !isPasted("Refresh the SWOT") && !isPasted("a".repeat(900)));
const sh = shapeAnswer({ reply: " Here is a start. ", options: [{ label: "Assume for me", recommended: true }, { label: "I'll give it", recommended: true }, { label: "  " }],
  draft: { title: "SWOT", groups: [{ title: "Strengths", items: [{ text: "Coverage", source: "Q3 deck.pdf" }, { text: "Brand", source: "made-up.xlsx" }, { text: "Share", source: "platform" }, { text: "" }] }, { title: "Empty", items: [] }] },
  assumptions: ["Margins flat"], pastedBelongsTo: "nowhere" }, ["Q3 deck.pdf"]);
check("an answer is trimmed, empty options and empty groups dropped", sh && sh.reply === "Here is a start." && sh.part.options.length === 2 && sh.part.draft.groups.length === 1 && sh.part.draft.groups[0].items.length === 3, JSON.stringify(sh));
check("...only ONE option can be the recommended one", sh && sh.part.options.filter((o) => o.recommended).length === 1 && sh.part.options[0].recommended);
check("...a source naming a file nobody attached is read as assumed, never drawn as a file (§96.2)",
  sh && sh.part.draft.groups[0].items.map((x) => x.source).join("|") === "Q3 deck.pdf|assumed|platform", sh && JSON.stringify(sh.part.draft.groups[0].items));
check("...and a section that is not a section is not an offer", sh && sh.part.pastedBelongsTo === null);
check("an answer with nothing in it is a failure, not an empty bubble (§124)", shapeAnswer({ reply: "  ", options: [{ label: "x" }] }, []) === null);
check("each section's guidance carries the house rules; the roads only where the record defines them",
  /PLAYBACK BEFORE PRODUCING/.test(guidanceFor("analysis")) && /Guided questions/.test(guidanceFor("analysis")) && /Template road is not ready/.test(guidanceFor("foundation")) &&
  !/WAYS TO START/.test(guidanceFor("directions")));
const cp = corpusOf({ section: "analysis", place: "mobile", placeWord: "Mobile", context: "4 pillars · 2 measures off track", question: "q", pasted: true,
  history: [], assumptions: ["Margins flat"], files: [{ name: "notes.docx", kind: "docx", text: "Share fell" }, { name: "deck.pdf", kind: "pdf", text: "" }] });
check("what the model is sent names the place, what the platform shows, the assumptions and each file by name",
  /PLACE: Mobile \(mobile\)/.test(cp) && /4 pillars · 2 measures off track/.test(cp) && /- Margins flat/.test(cp) &&
  /=== FILE: notes\.docx ===\nShare fell/.test(cp) && /FILE: deck\.pdf === \(a PDF/.test(cp) && /PASTED material/.test(cp), cp);

/* ══ the database ══════════════════════════════════════════════════ */
const URL_ = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "";
if (!URL_) {
  console.log("\nNo DATABASE_URL — §2–§4 need one. A check that cannot run is not a check that passed (§54.5).");
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
  } catch (e) { await c.query("ROLLBACK").catch(() => {}); throw e; } finally { c.release(); }
}

let failed = false;
let A = null, B = null;
try {
  await owner("SET search_path TO " + SCHEMA);
  const stamp = "cop" + Date.now().toString(36);
  [{ id: A }] = await owner("INSERT INTO tenants (key, name) VALUES ($1, $2) RETURNING id", [stamp + "-a", "Raya Trade"]);
  [{ id: B }] = await owner("INSERT INTO tenants (key, name) VALUES ($1, $2) RETURNING id", [stamp + "-b", "RHI"]);

  /* ══ §2 · the statements ════════════════════════════════════════ */
  section("§2 · a chat keeps what is typed; a version is never overwritten");
  const c1 = await asTenant(A, (c) => newChat(c, { place: "mobile", section: "analysis", title: "SWOT refresh", by: "noran" }));
  check("a chat is born on its place and section with its title", c1.place === "mobile" && c1.section === "analysis" && c1.title === "SWOT refresh" && c1.by === "noran", JSON.stringify(c1));
  await asTenant(A, async (c) => {
    await recordSaid(c, c1.id, { body: "Refresh Mobile's SWOT from Q3", by: "noran", fileIds: [], pasted: false });
    await recordAnswer(c, c1.id, { body: NO_KEY, part: { kind: "noKey" } });
  });
  const m1 = await asTenant(A, (c) => messagesOf(c, c1.id));
  check("what is typed is kept, then the product's own line — never dressed as the AI (§125)",
    m1.length === 2 && m1[0].who === "person" && m1[0].body === "Refresh Mobile's SWOT from Q3" && m1[0].by === "noran" &&
    m1[1].who === "ai" && m1[1].body === NO_KEY && m1[1].part && m1[1].part.kind === "noKey", JSON.stringify(m1));
  const rail = await asTenant(A, (c) => chatsOn(c, "mobile", "analysis"));
  check("the rail lists it, counting what the PERSON said", rail.length === 1 && rail[0].id === c1.id && rail[0].count === 1, JSON.stringify(rail));
  check("...and another section of the same place does not", (await asTenant(A, (c) => chatsOn(c, "mobile", "foundation"))).length === 0);
  check("...and another place does not", (await asTenant(A, (c) => chatsOn(c, "fn:finance", "analysis"))).length === 0);
  check("B cannot see A's chat — the tenant is the boundary", (await asTenant(B, (c) => chatsOn(c, "mobile", "analysis"))).length === 0);

  const d1 = await asTenant(A, (c) => newDeliverable(c, { place: "mobile", section: "analysis", title: "Mobile SWOT", type: "free",
    kind: "promotable", approach: "", body: { text: "S: presence" }, note: "First", by: "noran", chatId: null, chatTitle: "" }));
  const n2 = await asTenant(A, (c) => addVersion(c, d1, { body: { text: "S: presence\nW: margin" }, note: "Added a weakness", by: "islam" }));
  const n3 = await asTenant(A, (c) => addVersion(c, d1, { body: { text: "S: presence\nW: margin\nO: B2B" }, note: "Added an opportunity", by: "noran" }));
  check("an edit ADDS a version: 1, then 2, then 3", n2 === 2 && n3 === 3, n2 + "," + n3);
  const r = await asTenant(A, (c) => restoreVersion(c, d1, 1, "islam"));
  const vs = await asTenant(A, (c) => versionsOf(c, d1));
  check("a restore ADDS v4 holding v1's body, marked where it came from — nothing in between is lost",
    r === 4 && vs.length === 4 && vs[0].n === 4 && vs[0].body.text === "S: presence" && vs[0].restoredFrom === 1 && vs[0].note === "Restored from v1" &&
    vs.map((v) => v.n).join(",") === "4,3,2,1", JSON.stringify(vs.map((v) => [v.n, v.note])));
  check("restoring the version that is already the latest is refused, not copied", (await asTenant(A, (c) => restoreVersion(c, d1, 4, "islam"))) === "same");
  check("...and a version that was never there is named as missing", (await asTenant(A, (c) => restoreVersion(c, d1, 9, "islam"))) === "missing");
  const shelf = await asTenant(A, (c) => deliverablesOn(c, "mobile", "analysis"));
  check("the shelf shows the deliverable at its latest version", shelf.length === 1 && shelf[0].latest === 4 && shelf[0].kind === "promotable", JSON.stringify(shelf));
  /* THE NUMBERING IS FROM THE MAXIMUM, UNDER A LOCK (§96.2): two presses at
     the same moment get two numbers, never one — asserted by pressing twice
     at once, on a deliverable whose versions are NOT 1..n (a count would
     collide with the maximum there). */
  await owner("DELETE FROM copilot_versions WHERE deliverable_id = $1 AND n = 2", [d1]);
  const both = await probe("two edits at once both land", () => Promise.all([
    asTenant(A, (c) => addVersion(c, d1, { body: { text: "x" }, note: "one", by: "islam" })),
    asTenant(A, (c) => addVersion(c, d1, { body: { text: "y" }, note: "two", by: "noran" })),
  ]));
  check("two edits at once get two NEW numbers after the maximum — 5 and 6, whatever was removed below",
    both && both.slice().sort().join(",") === "5,6", JSON.stringify(both));
  await probe("a version cannot be written twice under one number", async () => {
    let threw = false;
    try { await asTenant(A, (c) => c.query("INSERT INTO copilot_versions (deliverable_id, n, body, note, by_key) VALUES ($1, 5, '{}', '', 'x')", [d1])); }
    catch (e) { threw = /copilot_versions_tenant_id_deliverable_id_n_key|unique/.test(String(e.message)); }
    check("the unique constraint refuses a second v5 — the backstop behind the lock", threw);
  });

  /* ══ §3 · the server ═══════════════════════════════════════════ */
  section("§3 · the module's server: the office in, everybody else out, in words");
  const call = async (method, path, body, who, qs = "") => {
    const req = new Request("https://smp.example/raya-trade/copilot/" + path + qs,
      method === "POST" ? { method, body: JSON.stringify(body), headers: { "Content-Type": "application/json" } } : { method });
    const res = await serve({ req, slug: "raya-trade", module: "copilot", tenantId: A, tenantName: "Raya Trade",
      have: ["strategy", "copilot"], rest: [path], personKey: who.personKey, seat: who.seat });
    let j = null; try { j = await res.json(); } catch { j = null; }
    return { st: res.status, j, to: res.headers.get("location") || "" };
  };
  const NORAN = { personKey: "noran", seat: "smoteam" }, ISLAM = { personKey: "islam", seat: "super" },
        OMAR = { personKey: "omar", seat: "smoteam" }, HEND = { personKey: "hend", seat: "none" };
  const list = await call("GET", "list", null, NORAN, "?place=mobile&section=analysis");
  check("the office reads the two rails", list.st === 200 && list.j.ok && list.j.chats.length === 1 && list.j.deliverables.length === 1, list.st + " " + JSON.stringify(list.j).slice(0, 120));
  for (const [path, qs] of [["list", "?place=mobile&section=analysis"], ["chat", "?id=" + c1.id], ["deliverable", "?id=" + d1]]) {
    const out = await call("GET", path, null, HEND, qs);
    check("a client's own person is refused at " + path + ", in words", out.st === 403 && out.j && /office/.test(out.j.why), out.st + " " + JSON.stringify(out.j));
  }
  const postHend = await call("POST", "api", { act: "newChat", place: "mobile", section: "analysis" }, HEND);
  check("...and at the api, writing nothing", postHend.st === 403 && (await asTenant(A, (c) => chatsOn(c, "mobile", "analysis"))).length === 1, postHend.st);
  const bare = await call("GET", "", null, NORAN);
  check("the Copilot's own address goes back to Strategy — it has no page of its own",
    bare.st === 302 && /\/raya-trade(\/strategy)?\/?$/.test(new URL(bare.to).pathname), bare.st + " " + bare.to);
  check("a place that is not a place word is refused", (await call("GET", "list", null, NORAN, "?place=../x&section=analysis")).st === 400);
  const made = await call("POST", "api", { act: "newChat", place: "fn:finance", section: "advisory", title: "  Pricing   question " }, OMAR);
  check("+ New chat makes one, its title on one line", made.st === 200 && made.j.chat.title === "Pricing question" && made.j.chat.by === "omar", JSON.stringify(made.j));
  const unnamed = await call("POST", "api", { act: "newChat", place: "fn:finance", section: "advisory" }, OMAR);
  check("...and a chat with no title is named after its section rather than left blank", unnamed.j && unnamed.j.chat.title === "New advisory chat", JSON.stringify(unnamed.j));
  const said = await call("POST", "api", { act: "say", id: made.j.chat.id, text: "Should we cut prices?" }, OMAR);
  check("with no key, saying something answers with the conversation and the product's own line — never a pretend answer",
    said.st === 200 && said.j.messages.length === 2 && said.j.messages[1].body === NO_KEY && said.j.messages[1].part.kind === "noKey", JSON.stringify(said.j).slice(0, 200));
  const long = await call("POST", "api", { act: "say", id: made.j.chat.id, text: "x".repeat(MAX_MESSAGE + 1) }, OMAR);
  check("a paste past about thirty pages is refused with the reason, and nothing kept (§96.2)",
    long.st === 400 && /thirty pages/.test(long.j.why) && (await asTenant(A, (c) => messagesOf(c, made.j.chat.id))).length === 2, JSON.stringify(long.j));
  const ren = await call("POST", "api", { act: "rename", id: made.j.chat.id, title: "Prices" }, NORAN);
  check("anybody in the office may rename a chat", ren.st === 200);
  const liveDel = await call("POST", "api", { act: "deleteChat", id: made.j.chat.id }, ISLAM);
  check("a live chat is not deleted, even by the Super user — it is archived first (§441)", liveDel.st === 400 && /Archive the chat first/.test(liveDel.j.why), JSON.stringify(liveDel.j));
  const arc = await call("POST", "api", { act: "archiveChat", id: made.j.chat.id }, NORAN);
  const lst = await call("GET", "list", null, NORAN, "?place=fn:finance&section=advisory");
  check("anybody in the office may archive a chat, and it leaves the list for the archived one",
    arc.st === 200 && !lst.j.chats.some((x) => x.id === made.j.chat.id) && lst.j.archived.some((x) => x.id === made.j.chat.id), JSON.stringify(lst.j).slice(0, 200));
  check("...the list says whether this person may delete: the SMO team may not", lst.j.mayDelete === false);
  const sayArc = await call("POST", "api", { act: "say", id: made.j.chat.id, text: "still there?" }, OMAR);
  check("...an archived chat takes nothing new until it is restored", sayArc.st === 400 && /archived/.test(sayArc.j.why), JSON.stringify(sayArc.j));
  const res = await call("POST", "api", { act: "restoreChat", id: made.j.chat.id }, OMAR);
  const lst2 = await call("GET", "list", null, NORAN, "?place=fn:finance&section=advisory");
  check("Restore puts it back on the list, with every message kept",
    res.st === 200 && lst2.j.chats.some((x) => x.id === made.j.chat.id) &&
    (await owner("SELECT count(*)::int AS n FROM copilot_messages WHERE chat_id = $1", [made.j.chat.id]))[0].n === 2);
  await call("POST", "api", { act: "archiveChat", id: made.j.chat.id }, OMAR);
  const delNo = await call("POST", "api", { act: "deleteChat", id: made.j.chat.id }, OMAR);
  check("whoever started it may NOT delete it, archived or not, and is told who can", delNo.st === 403 && /Only the Super user/.test(delNo.j.why), JSON.stringify(delNo.j));
  const delYes = await call("POST", "api", { act: "deleteChat", id: made.j.chat.id }, ISLAM);
  check("...the Super user may, and it and everything said in it are gone",
    delYes.st === 200 && (await owner("SELECT count(*)::int AS n FROM copilot_messages WHERE chat_id = $1", [made.j.chat.id]))[0].n === 0);
  const own = await call("POST", "api", { act: "archiveChat", id: unnamed.j.chat.id }, OMAR);
  check("...and the unnamed chat is archived, not deleted", own.st === 200);
  const ed = await call("POST", "api", { act: "editVersion", id: d1, text: "edited", note: "Tightened" }, NORAN);
  check("Edit through the server adds the next version", ed.st === 200 && ed.j.n === 7, JSON.stringify(ed.j));
  const same = await call("POST", "api", { act: "editVersion", id: d1, text: "edited" }, NORAN);
  check("...an edit that changes nothing is refused rather than stored as a copy", same.st === 400 && /Nothing changed/.test(same.j.why));
  const rs = await call("POST", "api", { act: "restore", id: d1, from: 3 }, NORAN);
  check("Restore through the server adds the next version", rs.st === 200 && rs.j.n === 8, JSON.stringify(rs.j));
  const noDel = await call("POST", "api", { act: "deleteDeliverable", id: d1 }, ISLAM);
  check("a deliverable cannot be deleted, not even by the Super user — its versions are the record", noDel.st === 400 && (await asTenant(A, (c) => versionsOf(c, d1))).length === 7);
  const gone = await call("GET", "chat", null, NORAN, "?id=" + made.j.chat.id);
  check("a deleted chat reads as gone, in words", gone.st === 404 && /not here/.test(gone.j.why));

  /* §442 — View and None are the SERVER's answer too, not only the screen's. */
  section("§3b · the Copilot column: view reads, none is refused, both on the server");
  const setGrant = (role, g) => asTenant(A, (c) => c.query(
    "INSERT INTO access_grants (role_key, page_key, grant_) VALUES ($1, 'a_copilot', $2) ON CONFLICT (tenant_id, role_key, page_key) DO UPDATE SET grant_ = EXCLUDED.grant_", [role, g]));
  try {
    await setGrant("smoteam", "view");
    const vl = await call("GET", "list", null, NORAN, "?place=mobile&section=analysis");
    check("an SMO team member at view still reads every chat and deliverable", vl.st === 200 && vl.j.chats.length === 1 && vl.j.deliverables.length === 1, vl.st);
    check("...and is told they may not change them, and may not delete", vl.j && vl.j.mayEdit === false && vl.j.mayDelete === false, JSON.stringify(vl.j && { e: vl.j.mayEdit, d: vl.j.mayDelete }));
    const vc = await call("GET", "chat", null, NORAN, "?id=" + c1.id);
    check("...the chat opens, read-only", vc.st === 200 && vc.j.mayEdit === false, vc.st);
    const before = (await asTenant(A, (c) => chatsOn(c, "mobile", "analysis"))).length;
    const vp = await call("POST", "api", { act: "newChat", place: "mobile", section: "analysis" }, NORAN);
    check("a write at view is refused in words, and nothing is kept",
      vp.st === 403 && /View only/.test(vp.j && vp.j.why) && (await asTenant(A, (c) => chatsOn(c, "mobile", "analysis"))).length === before, vp.st + " " + JSON.stringify(vp.j));
    const sp = await call("GET", "list", null, ISLAM, "?place=mobile&section=analysis");
    check("the Super user's own row is untouched by the team's — still edit", sp.st === 200 && sp.j.mayEdit === true, JSON.stringify(sp.j && sp.j.mayEdit));
    await setGrant("smoteam", "none");
    const nl = await call("GET", "list", null, NORAN, "?place=mobile&section=analysis");
    check("at none the reads are refused too, in words", nl.st === 403 && /not open to you/.test(nl.j && nl.j.why), nl.st + " " + JSON.stringify(nl.j));
  } finally {
    await asTenant(A, (c) => c.query("DELETE FROM access_grants WHERE page_key = 'a_copilot'"));
  }
  const back = await call("GET", "list", null, NORAN, "?place=mobile&section=analysis");
  check("with the row removed the team is back at edit (the shipped answer)", back.st === 200 && back.j.mayEdit === true);

  /* ══ §5 · the AI, read off the wire ═════════════════════════════ */
  section("§5 · the AI is asked with the section's guidance, the platform's line and the files — and its answer is kept checked");
  const seen = [];
  let NEXT = null;
  const stand = http.createServer((req, res) => {
    let b = ""; req.on("data", (d) => (b += d)); req.on("end", () => {
      let j = null; try { j = JSON.parse(b); } catch { j = null; }
      seen.push({ url: req.url, key: req.headers["x-goog-api-key"], body: j });
      const n = NEXT || { answer: { reply: "ok" } };
      if (n.status) { res.writeHead(n.status, { "Content-Type": "application/json" }); res.end(JSON.stringify({ error: { message: "stand-in refused" } })); return; }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(n.answer) }] } }] }));
    });
  });
  await new Promise((r) => stand.listen(0, "127.0.0.1", r));
  process.env.GEMINI_ENDPOINT = "http://127.0.0.1:" + stand.address().port + "/models/";
  process.env.GEMINI_API_KEY = "stand-in-key";
  try {
    const ch = (await call("POST", "api", { act: "newChat", place: "mobile", section: "analysis", title: "Q3 SWOT" }, NORAN)).j.chat;
    const b64 = (buf) => buf.toString("base64");
    const pdf = Buffer.from("%PDF-1.7\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF");
    const at1 = await call("POST", "api", { act: "attach", id: ch.id, name: "Q3 deck.pdf", type: "application/pdf", data: b64(pdf) }, NORAN);
    const at2 = await call("POST", "api", { act: "attach", id: ch.id, name: "notes.docx", type: "", data: b64(DOCX) }, NORAN);
    const at3 = await call("POST", "api", { act: "attach", id: ch.id, name: "figures.xlsx", type: "", data: b64(XLSX) }, NORAN);
    check("three files attach and wait with the chat, each with its name, kind and size",
      at3.st === 200 && at3.j.pending.length === 3 && at3.j.pending.map((f) => f.kind).join(",") === "pdf,docx,xlsx" && at1.j.file.size === pdf.length,
      JSON.stringify(at3.j).slice(0, 200));
    const at4 = await call("POST", "api", { act: "attach", id: ch.id, name: "more.pdf", type: "", data: b64(pdf) }, NORAN);
    check("...and a fourth is refused in words — three go with one message", at4.st === 400 && /Three files/.test(at4.j.why));
    const old = await call("POST", "api", { act: "attach", id: ch.id, name: "old.doc", type: "application/msword", data: b64(Buffer.from("x")) }, NORAN);
    check("an old .doc is refused in words, naming what IS read", old.st === 400 && /\.docx/.test(old.j.why), JSON.stringify(old.j));
    const big = await call("POST", "api", { act: "attach", id: ch.id, name: "big.pdf", type: "", data: "A".repeat(Math.ceil(MAX_FILE_BYTES / 3) * 4 + 40) }, NORAN);
    check("a file over 3 MB is refused before it is decoded, in words", big.st === 400 && /3 MB/.test(big.j.why), JSON.stringify(big.j));
    const det = await call("POST", "api", { act: "detach", id: ch.id, fileId: at3.j.file.id }, NORAN);
    check("a waiting file can be taken off", det.st === 200 && det.j.pending.length === 2);
    const clientFile = await call("GET", "file", null, HEND, "?id=" + at1.j.file.id);
    check("a file is the office's — a client's person is refused it", clientFile.st === 403);
    const bFile = await probe("another client cannot read the file", () => asTenant(B, (c) => c.query("SELECT count(*)::int AS n FROM copilot_files")));
    check("...and another client's rows hold none of it — the tenant is the boundary", bFile && bFile.rows[0].n === 0);

    NEXT = { answer: {
      reply: "I read your deck and notes. Here is a first SWOT.",
      playback: { understood: "Refresh the Q3 SWOT", workingFrom: "Q3 deck.pdf, notes.docx, the platform", missing: "Competitor prices" },
      missing: ["Competitor prices for Q3"],
      options: [{ label: "Assume for me", recommended: true }, { label: "I'll send them" }],
      assumptions: ["Competitor prices held flat", "Competitor prices held flat"],
      draft: { title: "Mobile SWOT", groups: [{ title: "Weaknesses", items: [{ text: "Share fell 4 points", source: "notes.docx" }, { text: "Margin", source: "invented.xlsx" }] }] },
    } };
    const s1 = await call("POST", "api", { act: "say", id: ch.id, text: "Refresh the SWOT from these", fileIds: [at1.j.file.id, at2.j.file.id],
      context: "Mobile · 4 pillars · 2 measures off track", placeWord: "Mobile" }, NORAN);
    const w = seen[seen.length - 1];
    check("the model was asked, once, with the key", seen.length === 1 && w.key === "stand-in-key", seen.length + "");
    const sys = w && w.body && w.body.systemInstruction ? w.body.systemInstruction.parts.map((p) => p.text).join("") : "";
    check("...told the section's guidance and what the platform shows for the place",
      /PLAYBACK BEFORE PRODUCING/.test(sys) && /THIS SECTION PRODUCES: Analysis/.test(sys) && /2 measures off track/.test(sys) && /PLACE: Mobile \(mobile\)/.test(sys), sys.slice(0, 160));
    check("...the Word file as its words, by name", /=== FILE: notes\.docx ===\nMobile & Accessories/.test(sys));
    const lastTurn = w && w.body ? w.body.contents[w.body.contents.length - 1] : null;
    check("...and the PDF as itself, on the question — not a text extraction",
      !!lastTurn && lastTurn.parts.some((p) => p.inlineData && p.inlineData.mimeType === "application/pdf" && Buffer.from(p.inlineData.data, "base64").equals(pdf)) &&
      lastTurn.parts.some((p) => /\[attached with this message: Q3 deck\.pdf, notes\.docx\]/.test(p.text || "")), JSON.stringify(lastTurn && lastTurn.parts.map((p) => Object.keys(p))));
    const ans = s1.j && s1.j.messages[s1.j.messages.length - 1];
    check("the answer is kept as an answer: playback, the missing input, two ways on, the draft with its sources",
      s1.st === 200 && ans.who === "ai" && ans.part.kind === "answer" && ans.part.playback.missing === "Competitor prices" &&
      ans.part.options.length === 2 && ans.part.options[0].recommended && ans.part.draft.groups[0].items[0].source === "notes.docx",
      JSON.stringify(ans).slice(0, 300));
    check("...a source naming a file nobody attached reads as assumed", ans && ans.part.draft.groups[0].items[1].source === "assumed");
    check("...and the files it read are named on it", ans && (ans.part.read || []).join(",") === "Q3 deck.pdf,notes.docx");
    const me = s1.j && s1.j.messages[s1.j.messages.length - 2];
    check("what was said carries its files, which are no longer waiting",
      me && me.part.files.map((f) => f.name).join(",") === "Q3 deck.pdf,notes.docx" && (await call("GET", "chat", null, NORAN, "?id=" + ch.id)).j.pending.length === 0);
    check("an assumption is recorded on the chat once, whatever the model repeats", s1.j && s1.j.assumptions.join("|") === "Competitor prices held flat", JSON.stringify(s1.j && s1.j.assumptions));
    check("...and a message with no paste carries no offer to save one", ans && !ans.part.pastedOffer);
    const sentDetach = await call("POST", "api", { act: "detach", id: ch.id, fileId: at1.j.file.id }, NORAN);
    check("a SENT file cannot be taken off — what was said is the record", sentDetach.st === 400);
    const dl = await serve({ req: new Request("https://smp.example/raya-trade/copilot/file?id=" + at2.j.file.id), slug: "raya-trade", module: "copilot",
      tenantId: A, tenantName: "Raya Trade", have: ["strategy", "copilot"], rest: ["file"], personKey: "noran", seat: "smoteam" });
    check("the office gets a file back as itself, as a download, never inline",
      dl.status === 200 && /attachment/.test(dl.headers.get("content-disposition") || "") && dl.headers.get("x-content-type-options") === "nosniff" &&
      Buffer.from(await dl.arrayBuffer()).equals(DOCX));

    NEXT = { answer: { reply: "Going on with that assumed.", assumptions: ["Competitor prices held flat"] } };
    await call("POST", "api", { act: "say", id: ch.id, text: "Assume for me" }, NORAN);
    const sys2 = seen[seen.length - 1].body.systemInstruction.parts.map((p) => p.text).join("");
    check("the next ask carries the assumption already made, so it is never asked again",
      /ASSUMPTIONS ALREADY MADE ON THIS CHAT[^\n]*\n- Competitor prices held flat/.test(sys2));
    check("...and the earlier file, still by name — a file belongs to its chat", /=== FILE: notes\.docx ===/.test(sys2));
    check("...and the history holds what was said, the product's own lines left out",
      seen[seen.length - 1].body.contents.some((t) => t.role === "user" && (t.parts[0].text || "").startsWith("Refresh the SWOT from these")));

    NEXT = { answer: { reply: "This is a market scan.", pastedBelongsTo: "analysis" } };
    const paste = "Market notes\n\n" + "The category grew in Q3. ".repeat(100);
    const s3 = await call("POST", "api", { act: "say", id: ch.id, text: paste }, NORAN);
    const offer = s3.j.messages[s3.j.messages.length - 1].part.pastedOffer;
    const pastedMsg = s3.j.messages[s3.j.messages.length - 2];
    check("pasted material is marked, and the answer offers to keep it in the section it belongs to",
      pastedMsg.part.pasted && offer && offer.section === "analysis" && offer.messageId === pastedMsg.id, JSON.stringify(offer));
    const kept = await call("POST", "api", { act: "savePasted", id: ch.id, messageId: offer.messageId, section: offer.section }, NORAN);
    const shelf2 = await asTenant(A, (c) => deliverablesOn(c, "mobile", "analysis"));
    check("Save keeps it as a Copilot-only deliverable in that section, the paste its first version",
      kept.st === 200 && shelf2.some((d) => d.id === kept.j.id && d.kind === "copilot-only" && /^Pasted — Market notes/.test(d.title)), JSON.stringify(kept.j));
    const notPaste = await call("POST", "api", { act: "savePasted", id: ch.id, messageId: me.id, section: "analysis" }, NORAN);
    check("...and a message that was NOT pasted cannot be saved that way — judged on the stored row (§42)", notPaste.st === 400 && /not pasted/.test(notPaste.j.why));

    NEXT = { status: 500 };
    const n0 = (await asTenant(A, (c) => messagesOf(c, ch.id))).length;
    const s4 = await call("POST", "api", { act: "say", id: ch.id, text: "One more question" }, NORAN);
    const last4 = s4.j.messages[s4.j.messages.length - 1];
    check("when the AI fails, what was typed is kept and the product says so — never a pretend answer",
      s4.st === 200 && s4.j.messages.length === n0 + 2 && s4.j.messages[s4.j.messages.length - 2].body === "One more question" &&
      last4.part.kind === "failed" && /could not answer just now/.test(last4.body) && /send it again/.test(last4.body), JSON.stringify(last4));
    delete process.env.GEMINI_API_KEY;
    const before = seen.length;
    const s5 = await call("POST", "api", { act: "say", id: ch.id, text: "And with no key?" }, NORAN);
    check("with no key the model is never asked, and the line says so", seen.length === before && s5.j.messages[s5.j.messages.length - 1].body === NO_KEY);
    const chat5 = await call("GET", "chat", null, NORAN, "?id=" + ch.id);
    check("...and the chat reports that the AI is off", chat5.j.aiOn === false);
  } finally {
    delete process.env.GEMINI_API_KEY; delete process.env.GEMINI_ENDPOINT;
    await new Promise((r) => stand.close(r));
  }

  /* ══ §4 · the catalogue ═══════════════════════════════════════ */
  section("§4 · every table is the tenant's, fenced like the tracker's");
  const T = ["copilot_chats", "copilot_messages", "copilot_deliverables", "copilot_versions", "copilot_files"];
  const rls = await owner("SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = $1 AND relname = ANY($2)", [SCHEMA, T]);
  check("all five tables exist, RLS on and FORCED", rls.length === 5 && rls.every((x) => x.relrowsecurity && x.relforcerowsecurity), JSON.stringify(rls));
  const pol = await owner("SELECT tablename, qual, with_check FROM pg_policies WHERE schemaname = $1 AND tablename = ANY($2)", [SCHEMA, T.concat(["tracker_actions"])]);
  const ref = pol.find((p) => p.tablename === "tracker_actions");
  check("each carries the policy IDENTICAL to tracker_actions' (§94.8)",
    !!ref && T.every((t) => pol.some((p) => p.tablename === t && p.qual === ref.qual && p.with_check === ref.with_check)), JSON.stringify(pol.map((p) => p.tablename)));
  check("none is on PLATFORM_TABLES — they are the client's rows", T.every((t) => !PLATFORM_TABLES.includes(t)));
} catch (e) {
  failed = true;
  console.log("\nDIED: " + (e && e.stack || e));
} finally {
  /* Leave nothing behind: a stray tenant named "Raya Trade" is a second card
     the console draws, and a neighbouring check reads the wrong one (§94.2). */
  if (A || B) await owner("DELETE FROM tenants WHERE id = ANY($1)", [[A, B].filter(Boolean)]).catch((e) => console.log("cleanup: " + e.message));
  await pool.end().catch(() => {}); await appPool.end().catch(() => {});
}
console.log("\n" + ok + " passed, " + bad.length + " failed" + (failed ? " — AND THE RUN DIED (§215)" : ""));
process.exit(bad.length || failed ? 1 : 0);
