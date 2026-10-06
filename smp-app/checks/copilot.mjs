/* ── THE STRATEGY COPILOT, STAGES 1 AND 2 (spec 064) ─────────────────────────────
   The shelf with no AI yet, checked against a real Postgres:

     · §1 the pure rules — the seven sections, the shape of a place word, who
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
       answer checked rather than trusted (no option marked recommended, a source
       naming a file nobody attached read as assumed);
     · §5 (stage 2) the AI READ OFF THE WIRE — a stand-in model on
       GEMINI_ENDPOINT (§100.3) records what it was sent: the guidance, the
       platform's line, the Word file's words, the PDF as itself; then the
       answer kept, assumptions recorded once and sent back, the paste offer,
       a failure and no key each saying so and keeping what was typed;
     · §7 (§490) the SWOT chat and the sources shelf — who may delete a
       source at both ends, a saved state the page cannot claim, an analysis
       refused until the to-do list is done and a save until there is a draft;
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
  isSaveAsk, isBareEnhance, draftText, claimsDraft, NO_DRAFT,
  partMemo,
} from "../lib/copilot.ts";
import { kindOf, readFile, MAX_FILE_BYTES } from "../lib/copilot-files.ts";
import { isPasted, shapeAnswer, corpusOf, askCopilot } from "../lib/copilot-ask.ts";
import { guidanceFor } from "../lib/copilot-guidance.ts";
import { mayDeleteSource } from "../lib/copilot-sources.ts";
import { newSwot, sanitizeSwot, todoOf, doneCount, QUESTIONS as SWQ } from "../lib/copilot-swot.ts";
import { methodFor } from "../lib/copilot-settings.ts";
import { resultOf as cpResult, MARKET as CP_M, INTERNAL as CP_I } from "../lib/copilot-compete.ts";
import { periodQuarters as exQs, periodWords as exWords, validPeriod as exValid, periodChoices as exChoices, withPeriod as exWith, cleanItem as exItem, newExec, todoOf as exTodo, finishBlocker as exBlock } from "../lib/copilot-execution.ts";
import { scoreOf as dvScore, finishBlocker as dvBlock, newDirs, modelCaps as dvCaps, modelOptions as dvOpts, todoOf as dvTodo } from "../lib/copilot-directions.ts";
import { DEFAULT_PARTS } from "../lib/copilot-defaults.generated.ts";
import { doorPool } from "../lib/auth.ts";
import { moduleMenu } from "../lib/modules.ts";
import { decideOpen } from "../lib/access.ts";

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
check("seven sections, in the record's order (§493: How we compete after the analysis, Capabilities before Execution)", SECTIONS.join(",") === "foundation,analysis,compete,directions,capabilities,execution,advisory");
check("a near miss is not a section", !isSection("Foundation") && !isSection("plan") && isSection("advisory"));
check("a place is the product's own word — group, a unit, fn:, co:, cap:",
  ["group", "mobile", "fn:finance", "co:distribution", "cap:cap6"].every(isPlace));
check("...and nothing else is: an address, a quote, an empty string",
  !isPlace("") && !isPlace("fn:") && !isPlace("mobile/x") && !isPlace("x'--") && !isPlace("zz:q"));
/* §453 (Islam, 2026-10-01) REVERSES "whoever started it may delete": a chat is
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
/* §454 — the Copilot column on Roles & access. Nothing stored is the office's
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
check("...and no option is ever marked recommended, whatever the model sends (§474)", sh && sh.part.options.length === 2 && sh.part.options.every((o) => !("recommended" in o)));
check("...a source naming a file nobody attached is read as assumed, never drawn as a file (§96.2)",
  sh && sh.part.draft.groups[0].items.map((x) => x.source).join("|") === "Q3 deck.pdf|assumed|platform", sh && JSON.stringify(sh.part.draft.groups[0].items));
check("...and a section that is not a section is not an offer", sh && sh.part.pastedBelongsTo === null);
check("an answer with nothing in it is a failure, not an empty bubble (§124)", shapeAnswer({ reply: "  ", options: [{ label: "x" }] }, []) === null);
check("each section's guidance carries the house rules; the roads only where the record defines them",
  /WHERE THE WORK STARTS/.test(guidanceFor("analysis")) && /Never invent a figure/.test(guidanceFor("analysis")) && /Guided questions/.test(guidanceFor("analysis")) && /There is no template for this section/.test(guidanceFor("foundation")) &&
  /Copilot settings › Templates \(Porter's Five Forces/.test(guidanceFor("analysis", "", ["Porter's Five Forces"])) &&
  /FOREFRONT'S METHOD FOR THIS SECTION[\s\S]*Rule one/.test(guidanceFor("analysis", "## SWOT\n\nRule one", [])) &&
  !/WAYS TO START/.test(guidanceFor("directions")));
/* §493: How we compete — the one scoring function (§94.8). */
{
  const all = (fs, sc) => Object.fromEntries(fs.map((f) => [f.id, sc]));
  const r = cpResult("market", all(CP_M, { btc: 2, bts: 1, bp: 0 }));
  check("§493 a side totals out of 20 and reads as a per-cent", r.complete && r.total.btc === 20 && r.pct.btc === 100 && r.pct.bts === 50 && r.pct.bp === 0, JSON.stringify(r));
  check("...a gap over 25 points is Clear", r.leader === "btc" && r.second === "bts" && r.gap === 50 && r.clarity === "clear");
  const tie = cpResult("market", all(CP_M, { btc: 1, bts: 1, bp: 1 }));
  check("...a tie breaks btc, then bts, then bp, and reads Unclear", tie.leader === "btc" && tie.second === "bts" && tie.clarity === "unclear", JSON.stringify(tie));
  const tie2 = cpResult("market", all(CP_M, { btc: 0, bts: 2, bp: 2 }));
  check("...bts before bp when they tie at the top", tie2.leader === "bts" && tie2.second === "bp", tie2.leader + "," + tie2.second);
  const part = cpResult("internal", { operations: { btc: 2, bts: 0, bp: 0 } });
  check("...one factor scored is not complete", part.complete === false);
  const lean = Object.fromEntries(CP_I.map((f, k) => [f.id, k < 2 ? { btc: 2, bts: 0, bp: 0 } : { btc: 1, bts: 1, bp: 0 }]));
  const lr = cpResult("internal", lean);
  check("...a 20-point gap is Leaning", lr.gap === 20 && lr.clarity === "leaning", JSON.stringify(lr.pct));
}

/* §494: Directions — the one score, the blockers, the model's rows cut to shape. */
{
  check("§494 a Direction's score is Urgency × Importance × Ease, out of 64", dvScore({ urgency: 4, importance: 4, ease: 3 }) === 48 && dvScore({ urgency: 1, importance: 2, ease: 2 }) === 4);
  check("...a row missing a score has no score, never a nought (§35)", dvScore({ urgency: 4, importance: 0, ease: 3 }) === null);
  const d = newDirs("directions", true, 0);
  check("...nothing chosen blocks the save", /Tick the Directions/.test(dvBlock(d)));
  check("...Directions chosen with Capabilities owed still block", /Keep at least one Capability/.test(dvBlock({ ...d, chose: true, options: [{ title: "A", urgency: 1, importance: 1, ease: 1, ownedBy: "", go: true, mark: "", planId: "" }] })));
  check("...a plan holding Directions asks plan-or-fresh first; an empty one starts fresh", newDirs("directions", false, 4).start === "" && newDirs("directions", false, 0).start === "fresh");
  check("...the to-do has Choose Capabilities only when capabilities are chosen here", dvTodo(newDirs("directions", true, 0)).some((t) => t.key === "caps") && !dvTodo(newDirs("directions", false, 0)).some((t) => t.key === "caps"));
  const fns = [{ key: "commercial", name: "Commercial" }];
  const o = dvOpts([{ title: "Win families", urgency: 9, importance: 3, ease: 3, ownedBy: "nobody" }, { title: "Mine", urgency: 3, importance: 3, ease: 3, ownedBy: "commercial" }], fns, ["mine"]);
  check("...a score out of range is dropped, an owner not on the list is dropped, the client's own row is marked theirs",
    o[0].urgency === 0 && o[0].ownedBy === "" && o[0].mark === "new" && o[1].mark === "yours" && o[1].ownedBy === "commercial", JSON.stringify(o));
  const c = dvCaps([{ title: "Supply chain", kind: "gap", serves: ["win families", "Made up"], ownedBy: "commercial" }, { title: "X", kind: "weird", serves: [], ownedBy: "" }], fns, ["Win families"], [], true);
  check("...a Capability serves only Directions on the table, spelt as they are, and a kind not on the list is none",
    c[0].serves.join() === "Win families" && c[0].kind === "gap" && c[1].kind === "" && c[0].keep === true, JSON.stringify(c));
}
/* §495: Execution — the period, its quarters, and what blocks the save. */
{
  check("§495 a period's quarters are the ones its months touch, and no period means all four", exQs({ y: 2026, m1: 7, m2: 12 }).join() === "3,4" && exQs({ y: 2026, m1: 2, m2: 4 }).join() === "1,2" && exQs(null).join() === "1,2,3,4");
  check("...said as months and quarters, the full year as Full year", exWords({ y: 2026, m1: 7, m2: 12 }) === "Jul\u2013Dec 2026 (Q3\u2013Q4)" && exWords({ y: 2027, m1: 1, m2: 12 }) === "Full year 2027 (Q1\u2013Q4)", exWords({ y: 2026, m1: 7, m2: 12 }));
  check("...a period is months in ONE year, first before last", exValid({ y: 2026, m1: 9, m2: 3 }) === null && exValid({ y: 2026, m1: 0, m2: 5 }) === null && exValid({ y: 2026, m1: 3, m2: 9 })?.m2 === 9);
  const ch = exChoices(new Date(2026, 9, 6));
  check("...in October the ready answers are next year whole, and Oct–Dec", ch.full.y === 2027 && ch.full.m1 === 1 && ch.rest.y === 2026 && ch.rest.m1 === 10 && ch.rest.m2 === 12, JSON.stringify(ch));
  const it = exItem({ title: "Win families", planId: "mobile-P1", measures: [{ name: "Share", target: "30%", compile: "Bogus" }], tactics: [{ name: "Launch", owner: "Commercial", quarters: [1, 3, 4, 9] }] }, [3, 4]);
  check("...a tactic keeps only quarters inside the period, and a compile rule not on the list is none", it.tactics[0].quarters.join() === "3,4" && it.measures[0].compile === "", JSON.stringify(it));
  const s0 = newExec([exItem({ title: "Win families", planId: "mobile-P1", tactics: [{ name: "T", quarters: [1, 2, 3] }] }, [1, 2, 3, 4])]);
  check("...nothing is saved before the period is said", /how long the plan is/.test(exBlock(s0)));
  const s1 = exWith(s0, { y: 2026, m1: 7, m2: 12 });
  check("...setting a shorter period takes every tactic's quarters back inside it", s1.items[0].tactics[0].quarters.join() === "3", JSON.stringify(s1.items[0].tactics));
  check("...an item with no measure still blocks, by name", /Win families/.test(exBlock(s1)));
  check("...the to-do is the period, one row per item, then Save", exTodo(s1).map((t) => t.key).join() === "period,item:mobile-P1,save" && exTodo(s1)[0].state === "done");
}
/* §460: the conversation fixes, A B C, each asked of the rule itself. */
{
  const M = "## Situational Analysis - SWOT\n\nPhase one: Strengths from the Internal analysis.";
  const gi = guidanceFor("analysis", M, []);
  check("§460 A: the method LEADS — it is sent before the answer rules and is not overruled by them",
    gi.indexOf("Phase one") >= 0 && gi.indexOf("Phase one") < gi.indexOf("LIMITS FOR YOUR ANSWER") && /It LEADS the conversation/.test(gi) && !/the rules above win/.test(gi), gi.slice(0, 200));
  check("§460 A: a drafted item takes the method's shape — title, evidence, score — and a turn names the method part it follows",
    /`title`[\s\S]*`evidence`[\s\S]*`score`/.test(gi) && /`following`/.test(gi));
  check("§471: a natural conversation — no playback box, buttons only for a real choice, and one starting point for every section",
    /natural conversation/.test(gi) && !/PLAYBACK/.test(gi) && !/playback/.test(gi) && /leave `options` empty/.test(gi) &&
    /WHERE THE WORK STARTS, in every section/.test(gi) && /word for word/.test(gi) && /already said what to change/.test(gi) &&
    ["foundation", "analysis", "directions", "execution", "advisory"].every((k) => /WHERE THE WORK STARTS/.test(guidanceFor(k))));
  check("§471: what exists comes before the ways to start, and the method before both",
    gi.indexOf("Phase one") < gi.indexOf("WHERE THE WORK STARTS") && gi.indexOf("WHERE THE WORK STARTS") < gi.indexOf("WAYS TO START"));
  check("§471: an answer's old playback field is not kept",
    !("playback" in (shapeAnswer({ reply: "Hi", playback: { understood: "x" } }, []) || { part: { playback: 1 } }).part));
  const sh2 = shapeAnswer({ reply: "Here is the internal half.", following: "Situational Analysis · SWOT",
    draft: { title: "Mobile SWOT", groups: [{ title: "Strengths", items: [
      { title: "Brand partnerships", text: "Samsung and Xiaomi deals.", evidence: "your message", score: "3 · Strong", source: "pasted" },
      { title: "Title only", text: "" }, { text: "Plain line" }] }] } }, []);
  const its = sh2 && sh2.part.draft.groups[0].items;
  check("§460 A: an item keeps its title, evidence and score; a title alone becomes its text; a plain line stays plain",
    its && its[0].title === "Brand partnerships" && its[0].evidence === "your message" && its[0].score === "3 · Strong" &&
    its[1].text === "Title only" && !its[1].title && !its[2].title && !its[2].evidence && sh2.part.following === "Situational Analysis · SWOT", JSON.stringify(sh2 && sh2.part));
  const memo = partMemo({ kind: "answer", following: "SWOT", options: [{ label: "Move to the market" }, { label: "Add one" }],
    draft: { title: "Mobile SWOT", groups: [{ title: "Strengths", items: [{ title: "Brand partnerships", text: "Samsung deals.", score: "3 · Strong" }] }] } });
  check("§460 B: the Copilot's own draft and the buttons it offered ride with its words into the next question",
    /\[my draft "Mobile SWOT":/.test(memo) && /Brand partnerships — Samsung deals\. \(3 · Strong\)/.test(memo) && /\[options I offered: Move to the market · Add one\]/.test(memo), memo);
  check("...and a part that is not an answer adds nothing", partMemo({ kind: "files" }) === "" && partMemo(null) === "");
}
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
  const raw = async (method, path, body, who, qs = "", admin = false) => {
    const isForm = body instanceof FormData;
    const req = new Request("https://smp.example/raya-trade/copilot/" + path + qs,
      method === "POST" ? (isForm ? { method, body } : { method, body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }) : { method });
    return serve({ req, slug: "raya-trade", module: "copilot", tenantId: A, tenantName: "Raya Trade",
      have: ["strategy", "copilot"], rest: path ? path.split("/") : [], personKey: who.personKey, seat: who.seat, admin });
  };
  const call = async (method, path, body, who, qs = "") => {
    const res = await raw(method, path, body, who, qs);
    let j = null; try { j = await res.json(); } catch { j = null; }
    return { st: res.status, j, to: res.headers.get("location") || "" };
  };
  const page = async (method, path, body, who, qs = "", admin = false) => {
    const res = await raw(method, path, body, who, qs, admin);
    const ct = res.headers.get("content-type") || "";
    return { st: res.status, ct, text: /html/.test(ct) ? await res.text() : "", bytes: /html/.test(ct) ? null : Buffer.from(await res.arrayBuffer()),
      to: res.headers.get("location") || "", disp: res.headers.get("content-disposition") || "" };
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
  /* §456 REVERSES §451's "no page of its own": the bare address is the
     Copilot page, listing every chat and deliverable on the client. */
  const bare = await page("GET", "", null, NORAN);
  check("the Copilot's own address is a page now — HTML, not a trip back to Strategy (§456)",
    bare.st === 200 && /html/.test(bare.ct) && /<table/.test(bare.text), bare.st + " " + bare.ct);
  check("...listing this client's chat with a link that opens it in its place's Copilot tab",
    bare.text.includes(c1.title) && /href="\/raya-trade\/strategy\/mobile\/copilot\/analysis#cop=chat-[0-9a-f-]{36}"/.test(bare.text), bare.text.slice(0, 200));
  const odd = await raw("GET", "elsewhere", null, NORAN);
  check("an address the Copilot does not draw goes to its page, never a blank", odd.status === 302 && /\/raya-trade\/copilot\/?$/.test(new URL(odd.headers.get("location")).pathname));
  const hendPage = await page("GET", "", null, HEND);
  check("a client's own person is refused the page in words, not shown it", hendPage.st === 403 && !hendPage.text.includes(c1.title), hendPage.st + "");
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
  check("a live chat is not deleted, even by the Super user — it is archived first (§453)", liveDel.st === 400 && /Archive the chat first/.test(liveDel.j.why), JSON.stringify(liveDel.j));
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

  /* §454 — View and None are the SERVER's answer too, not only the screen's. */
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
  /* ══ §3c · the Copilot's own settings (§456) ═══════════════════════
     The same for every client; read by the office, changed by a Forefront
     super user only (the account's admin flag, never the client's seat). */
  section("§3c · Copilot settings: the office reads, only a Forefront super user changes");
  const KEY = "part2";
  await doorPool().query("DELETE FROM copilot_assets WHERE key = ANY($1)", [[KEY, "t3"]]);
  try {
    const ins = await page("GET", "settings", null, NORAN, "?section=analysis");
    check("the AI instructions page draws the analysis parts for the office, read only",
      ins.st === 200 && /SWOT/.test(ins.text) && /Same for all clients/.test(ins.text) && /Read only/.test(ins.text) && !/edit=part/.test(ins.text), ins.st + "");
    const insAdm = await page("GET", "settings", null, NORAN, "?section=analysis", true);
    check("...and offers Edit to a Forefront super user, and only to one", /edit=part2/.test(insAdm.text) && !/Read only/.test(insAdm.text));
    const fd = (o) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.append(k, v); return f; };
    const nope = await page("POST", "settings", fd({ act: "save", key: KEY, text: "Hijacked" }), NORAN, "?section=analysis");
    const rowNope = await doorPool().query("SELECT 1 FROM copilot_assets WHERE key = $1", [KEY]);
    check("a POST from somebody who is not a Forefront super user changes nothing and says why",
      nope.st === 400 && /Only a Forefront super user/.test(nope.text) && rowNope.rowCount === 0, nope.st + " " + rowNope.rowCount);
    const yes = await page("POST", "settings", fd({ act: "save", key: KEY, text: "## General\n\nOur own SWOT rule." }), NORAN, "?section=analysis", true);
    const rowYes = await doorPool().query("SELECT text FROM copilot_assets WHERE key = $1", [KEY]);
    check("an admin's save is stored and answers 303 to the page, so a refresh does not resend it",
      yes.st === 303 && /done=saved/.test(yes.to) && rowYes.rowCount === 1 && /Our own SWOT rule/.test(rowYes.rows[0].text), yes.st + " " + yes.to);
    check("...and the next question is told it (methodFor reads the stored row)", /Our own SWOT rule/.test(await methodFor(doorPool(), "analysis")));
    const empty = await page("POST", "settings", fd({ act: "save", key: KEY, text: "   " }), NORAN, "?section=analysis", true);
    check("an empty part is refused in words, the stored text kept", empty.st === 400 && /cannot be empty/.test(empty.text) &&
      (await doorPool().query("SELECT 1 FROM copilot_assets WHERE key = $1", [KEY])).rowCount === 1);
    const shipped = DEFAULT_PARTS.find((x) => x.key === KEY).text;
    const back = await page("POST", "settings", fd({ act: "save", key: KEY, text: shipped }), NORAN, "?section=analysis", true);
    check("saving the shipped text DELETES the row — the default is an absence (§50.6)",
      back.st === 303 && (await doorPool().query("SELECT 1 FROM copilot_assets WHERE key = $1", [KEY])).rowCount === 0, back.st + "");
    const tp = await page("GET", "settings/templates", null, NORAN);
    check("the templates page lists all five, each downloadable, read only for the office",
      tp.st === 200 && (tp.text.match(/settings\/templates\/t[1-5]"/g) || []).length === 5 && /Read only/.test(tp.text), tp.st + "");
    const dl = await page("GET", "settings/templates/t3", null, NORAN);
    check("a template downloads as the shipped Excel file", dl.st === 200 && dl.bytes && dl.bytes[0] === 0x50 && dl.bytes[1] === 0x4b && /Porters/.test(decodeURIComponent(dl.disp)), dl.st + " " + dl.disp);
    const notX = fd({ act: "replace", key: "t3" }); notX.append("file", new Blob([Buffer.from("not excel")]), "porter.xlsx");
    const rep = await page("POST", "settings/templates", notX, NORAN, "", true);
    check("a file that only CALLS itself .xlsx is refused by its shape", rep.st === 400 && /not an Excel file/.test(rep.text) &&
      (await doorPool().query("SELECT 1 FROM copilot_assets WHERE key = 't3'")).rowCount === 0, rep.st + "");
    const realX = fd({ act: "replace", key: "t3" }); realX.append("file", new Blob([XLSX]), "Porter v2.xlsx");
    const rep2 = await page("POST", "settings/templates", realX, NORAN, "", true);
    const dl2 = await page("GET", "settings/templates/t3", null, NORAN);
    check("an admin's replacement is what every client downloads next", rep2.st === 303 && dl2.bytes && dl2.bytes.equals(XLSX) && /Porter v2/.test(decodeURIComponent(dl2.disp)), rep2.st + " " + dl2.disp);
    const repNo = await page("POST", "settings/templates", fd({ act: "reset", key: "t3" }), NORAN);
    check("...and somebody else cannot put it back either", repNo.st === 400 && (await doorPool().query("SELECT 1 FROM copilot_assets WHERE key = 't3'")).rowCount === 1);
    const hendSet = await page("GET", "settings", null, HEND);
    check("a client's own person is refused the settings too", hendSet.st === 403, hendSet.st + "");
    check("the switcher offers the Copilot to the office, and the door refuses a client's person",
      moduleMenu(["strategy", "copilot"]).some((m) => m.key === "copilot") && decideOpen("none", "copilot", {}, null) === false);
  } finally {
    await doorPool().query("DELETE FROM copilot_assets WHERE key = ANY($1)", [[KEY, "t3"]]).catch(() => {});
  }

  section("§5 · the AI is asked with the section's guidance, the platform's line and the files — and its answer is kept checked");
  const seen = [];
  let NEXT = null;
  const stand = http.createServer((req, res) => {
    let b = ""; req.on("data", (d) => (b += d)); req.on("end", () => {
      let j = null; try { j = JSON.parse(b); } catch { j = null; }
      seen.push({ url: req.url, key: req.headers["x-goog-api-key"], body: j });
      const n = (Array.isArray(NEXT) ? NEXT.shift() : NEXT) || { answer: { reply: "ok" } };
      if (n.status) { res.writeHead(n.status, { "Content-Type": "application/json" }); res.end(JSON.stringify({ error: { message: "stand-in refused" } })); return; }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(n.answer) }] } }] }));
    });
  });
  await new Promise((r) => stand.listen(0, "127.0.0.1", r));
  process.env.GEMINI_ENDPOINT = "http://127.0.0.1:" + stand.address().port + "/models/";
  process.env.GEMINI_API_KEY = "stand-in-key";
  process.env.SMP_COPILOT_RETRY_MS = "0";
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
      /WHERE THE WORK STARTS/.test(sys) && /THIS SECTION PRODUCES: Analysis/.test(sys) && /2 measures off track/.test(sys) && /PLACE: Mobile \(mobile\)/.test(sys), sys.slice(0, 160));
    check("...told to start from what the plan holds, word for word, and ask what to change (§471)",
      /start from it: show it in `reply` word for word/.test(sys) && /If the person has not said what to change, ask/.test(sys));
    check("...and Forefront's own method for that section, read from Copilot settings (§456)",
      /FOREFRONT'S METHOD FOR THIS SECTION/.test(sys) && /## Situational Analysis - SWOT/.test(sys) && /Copilot settings › Templates \(/.test(sys));
    check("...the Word file as its words, by name", /=== FILE: notes\.docx ===\nMobile & Accessories/.test(sys));
    const lastTurn = w && w.body ? w.body.contents[w.body.contents.length - 1] : null;
    check("...and the PDF as itself, on the question — not a text extraction",
      !!lastTurn && lastTurn.parts.some((p) => p.inlineData && p.inlineData.mimeType === "application/pdf" && Buffer.from(p.inlineData.data, "base64").equals(pdf)) &&
      lastTurn.parts.some((p) => /\[attached with this message: Q3 deck\.pdf, notes\.docx\]/.test(p.text || "")), JSON.stringify(lastTurn && lastTurn.parts.map((p) => Object.keys(p))));
    const ans = s1.j && s1.j.messages[s1.j.messages.length - 1];
    check("the answer is kept as an answer: the missing input, two ways on, the draft with its sources",
      s1.st === 200 && ans.who === "ai" && ans.part.kind === "answer" && ans.part.missing[0] === "Competitor prices for Q3" && !("playback" in ans.part) &&
      ans.part.options.length === 2 && !ans.part.options.some((o) => "recommended" in o) && ans.part.draft.groups[0].items[0].source === "notes.docx",
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

    /* §460 B, on the wire: the Copilot's own earlier draft and buttons travel
       with its words, so it builds on them rather than asking how to start. */
    const aiTurn = seen[seen.length - 1].body.contents.find((t) => t.role === "model" && /I read your deck and notes/.test(t.parts[0].text || ""));
    check("§460 B: the next ask carries the Copilot's own earlier draft and the buttons it offered",
      !!aiTurn && /\[my draft "Mobile SWOT":/.test(aiTurn.parts[0].text) && /Share fell 4 points/.test(aiTurn.parts[0].text) &&
      /\[options I offered: Assume for me · I'll send them\]/.test(aiTurn.parts[0].text), aiTurn && aiTurn.parts[0].text.slice(0, 300));
    {
      const hist = Array.from({ length: 30 }, (_, i) => ({ from_office: i % 2 === 1, body: "turn " + i }));
      const before = seen.length;
      NEXT = { answer: { reply: "ok" } };
      await askCopilot({ section: "analysis", place: "mobile", placeWord: "Mobile", context: "", question: "next", pasted: false, history: hist, assumptions: [], files: [] });
      const sent = seen.length > before ? seen[seen.length - 1].body.contents : [];
      check("§460 B: a long chat sends twenty earlier turns, not eight", sent.length === 21 && /turn 10/.test(sent[0].parts[0].text), sent.length + "");
    }

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

    /* §457: THE PLAN'S OWN WORDS REACH THE MODEL WHOLE. The tab now sends the
       place's written plan, ~8,000 characters for a unit, and the old 6,000
       cap would have cut the very sentence Islam asked about. */
    NEXT = { answer: { reply: "Read it." } };
    const longCtx = "Mobile · 4 pillars · the plan's own text\n\nTHE PLAN AS WRITTEN:\nFOUNDATION\nWinning Aspiration: " + "x".repeat(15000) + " ASPIRATION-END";
    await call("POST", "api", { act: "say", id: ch.id, text: "Can we enhance the winning aspiration?", context: longCtx, placeWord: "Mobile" }, NORAN);
    const sysL = seen[seen.length - 1].body.systemInstruction.parts.map((p) => p.text).join("");
    check("the place's written plan reaches the model whole — a 15,000-character Foundation is not cut", /ASPIRATION-END/.test(sysL) && /THE PLAN AS WRITTEN/.test(sysL));

    /* §457: A BUSY PROVIDER IS ASKED ONCE MORE. Both ends (§94.2): a 503 then
       an answer gives the answer, from two asks; a refusal that is not "busy"
       is asked once; and busy twice is a failure after exactly two asks. */
    NEXT = [{ status: 503 }, { answer: { reply: "Second time lucky." } }];
    const b0 = seen.length;
    const r1 = await call("POST", "api", { act: "say", id: ch.id, text: "Busy then fine" }, NORAN);
    const a1 = r1.j.messages[r1.j.messages.length - 1];
    check("a 503 is asked again once, and the person sees the answer, not the refusal",
      seen.length === b0 + 2 && a1.part.kind === "answer" && a1.body === "Second time lucky.", seen.length - b0 + " asks · " + JSON.stringify(a1).slice(0, 160));
    NEXT = [{ status: 404 }, { answer: { reply: "never reached" } }];
    const b1 = seen.length;
    const r2 = await call("POST", "api", { act: "say", id: ch.id, text: "Not a busy refusal" }, NORAN);
    check("...a refusal that is not 'busy' is asked once only, and said",
      seen.length === b1 + 1 && r2.j.messages[r2.j.messages.length - 1].part.kind === "failed", seen.length - b1 + " asks");
    /* §458: busy four times, and the lighter model answers — five asks, the
       last one to the fallback model by name in the address. */
    NEXT = [{ status: 503 }, { status: 503 }, { status: 429 }, { status: 503 }, { answer: { reply: "From the lighter model." } }];
    const bF = seen.length;
    const rF = await call("POST", "api", { act: "say", id: ch.id, text: "Still busy" }, NORAN);
    const aF = rF.j.messages[rF.j.messages.length - 1];
    check("a provider busy four times is asked three more times and then the lighter model once — which answers (§458)",
      seen.length === bF + 5 && /gemini-flash-lite-latest/.test(seen[seen.length - 1].url) && !/gemini-flash-lite-latest/.test(seen[seen.length - 2].url) &&
      aF.part.kind === "answer" && aF.body === "From the lighter model.", seen.length - bF + " asks · " + (seen[seen.length - 1] || {}).url);
    /* §458: the answer's own format never reaches the screen. Both ends: a
       field that ran on into the next JSON key is cut, and a quote-comma-quote
       that is not one of our keys is kept as written. */
    NEXT = { answer: { reply: "Refined.", following: "Foundation \u00b7 Aspiration", assumptions: ["He said \"yes\", \"no\" and left", "The plan's aspiration (MENA expansion).\", \"missing\": \"None."] } };
    const rL = await call("POST", "api", { act: "say", id: ch.id, text: "Leak test" }, NORAN);
    const pA = (rL.j.messages[rL.j.messages.length - 1].part.assumptions) || [];
    check("a line that ran on into the answer's next field is cut there (§458)", pA[1] === "The plan's aspiration (MENA expansion).", JSON.stringify(pA[1]));
    check("...and ordinary quotes in what the model wrote are kept", pA[0] === 'He said "yes", "no" and left', JSON.stringify(pA[0]));

    /* §472: AN ENHANCEMENT ASKS FIRST, held by the product. A short "enhance"
       about something the plan holds is told so on that turn, and a draft
       written anyway is dropped; the answer to that question is not held. */
    const qL = JSON.stringify(seen.find((x) => /Can we enhance the winning aspiration/.test(JSON.stringify(x.body.contents))).body.contents);
    check("a short ask to improve what the plan holds is told, on that turn, to quote it and ask what to improve (§472)", /FOR THIS TURN ONLY/.test(qL) && /word for word/.test(qL), qL.slice(-300));
    const ctxA = "Mobile\n\nTHE PLAN AS WRITTEN:\nWinning Aspiration: Be first.";
    const DR = { title: "Aspiration — Mobile", groups: [{ title: "Aspiration", items: [{ text: "Be the first choice for a phone", source: "platform" }] }] };
    NEXT = { answer: { reply: "Today it reads: Be first. What should improve?", options: [{ label: "Make it measurable" }], draft: DR } };
    const e1 = await call("POST", "api", { act: "say", id: ch.id, text: "enhance the aspiration", context: ctxA }, NORAN);
    const ae1 = e1.j.messages[e1.j.messages.length - 1];
    check("...and a draft it writes anyway is dropped, so the page shows the question, not a draft", !ae1.part.draft && ae1.part.askFirst === true && ae1.part.options.length === 1, JSON.stringify(ae1.part).slice(0, 200));
    NEXT = { answer: { reply: "Here it is, sharper.", draft: DR } };
    const e2 = await call("POST", "api", { act: "say", id: ch.id, text: "improve it, make it measurable", context: ctxA }, NORAN);
    const ae2 = e2.j.messages[e2.j.messages.length - 1];
    const q2 = JSON.stringify(seen[seen.length - 1].body.contents);
    check("...the answer to that question is not held: the draft comes (§472, both ends)", !!(ae2.part.draft && ae2.part.draft.groups) && !/FOR THIS TURN ONLY/.test(q2.slice(-600)), JSON.stringify(ae2.part).slice(0, 160));
    NEXT = { answer: { reply: "A first aspiration.", draft: DR } };
    const e3 = await call("POST", "api", { act: "say", id: ch.id, text: "enhance the aspiration", context: "Mobile" }, NORAN);
    check("...and where the plan holds nothing, nothing is held back", !!e3.j.messages[e3.j.messages.length - 1].part.draft);

    /* §476: A CHANGE CLAIMED IS A CHANGE SHOWN. Islam's report: asked to
       remove the year, the model said "I've removed the hardcoded year …
       Click the Save button under the draft" and sent no draft. Asked again
       once; the second answer's draft is what the page shows. Both ends: a
       second miss says so instead of the claim, and an answer that claims
       nothing is asked once only. */
    NEXT = [{ answer: { reply: "I've removed the hardcoded year. Click the Save button under the draft." } },
            { answer: { draft: DR } }];
    const bC = seen.length;
    const c1 = await call("POST", "api", { act: "say", id: ch.id, text: "Remove specific target year", context: ctxA }, NORAN);
    const ac1 = c1.j.messages[c1.j.messages.length - 1];
    const qC = JSON.stringify(seen[seen.length - 1].body.contents);
    check("an answer that claims a change with no draft is asked again, and the revised text is shown with its Save (§476)",
      seen.length === bC + 2 && !!(ac1.part.draft && ac1.part.draft.groups) && /removed the hardcoded year/.test(ac1.body) && /whole revised text in `draft`/.test(qC),
      seen.length - bC + " asks · " + JSON.stringify(ac1).slice(0, 200));
    /* §477: the second try is a SMALLER ask — its shape holds only the
       draft, required, with no `reply` to talk in. Read off the wire. */
    const sch2 = (seen[seen.length - 1].body.generationConfig || {}).responseSchema || {};
    check("...and that second ask can only return the draft — no reply field, the draft required (§477)",
      !!(sch2.properties && sch2.properties.draft) && !(sch2.properties && sch2.properties.reply) && (sch2.required || []).includes("draft"),
      JSON.stringify(sch2).slice(0, 160));
    NEXT = [{ answer: { reply: "I've removed the year. Press Save below." } }, { answer: { reply: "I've removed it." } }];
    const c2 = await call("POST", "api", { act: "say", id: ch.id, text: "Remove specific target year", context: ctxA }, NORAN);
    const ac2 = c2.j.messages[c2.j.messages.length - 1];
    check("...a second miss says so, and never claims a Save that is not there", !ac2.part.draft && ac2.body === NO_DRAFT && ac2.part.noDraft === true, JSON.stringify(ac2).slice(0, 200));
    NEXT = { answer: { reply: "Which year would you like it to name instead?" } };
    const bN = seen.length;
    await call("POST", "api", { act: "say", id: ch.id, text: "Remove specific target year", context: ctxA }, NORAN);
    check("...and an answer that claims nothing is asked once only", seen.length === bN + 1, seen.length - bN + " asks");
    check("the claim words are narrow", claimsDraft("I've removed the hardcoded year") && claimsDraft("Here is the revised aspiration.") && claimsDraft("Click the Save button under the draft") &&
      !claimsDraft("Shall I draft one for you?") && !claimsDraft("Which year would you like it to name instead?") && !claimsDraft("What should improve?"));

    /* §472: A DRAFT IS SAVED TO THE RAIL by the product. The button makes v1;
       the same title again is v2 of the same deliverable; a saved draft is
       not saved twice; and a typed "save it" saves without asking the model. */
    const dm2 = ae2.id;
    const sv1 = await call("POST", "api", { act: "saveDraft", id: ch.id, messageId: dm2 }, NORAN);
    const shelfS = await asTenant(A, (c) => deliverablesOn(c, "mobile", "analysis"));
    const dS = shelfS.find((d) => d.title === "Aspiration — Mobile");
    const vS = dS ? await asTenant(A, (c) => versionsOf(c, dS.id)) : [];
    check("Save under a draft puts it on the rail as v1, its text written out (§472)",
      sv1.st === 200 && sv1.j.saved.n === 1 && !!dS && vS.length === 1 && /Be the first choice for a phone/.test(vS[0].body.text), JSON.stringify(sv1.j).slice(0, 200));
    check("...and the draft now says it was saved", sv1.j.messages.find((m) => m.id === dm2).part.saved.n === 1);
    const again = await call("POST", "api", { act: "saveDraft", id: ch.id, messageId: dm2 }, NORAN);
    check("...a saved draft is not saved twice, in words", again.st === 400 && /already saved/.test(again.j.why));
    const notD = await call("POST", "api", { act: "saveDraft", id: ch.id, messageId: e1.j.messages[e1.j.messages.length - 2].id }, NORAN);
    check("...and the person's own message is not a draft — judged on the stored row (§42)", notD.st === 400 && /not a draft/.test(notD.j.why));
    const bS = seen.length;
    const ty = await call("POST", "api", { act: "say", id: ch.id, text: "looks great, save it" }, NORAN);
    const tyL = ty.j.messages[ty.j.messages.length - 1];
    const vS2 = await asTenant(A, (c) => versionsOf(c, dS.id));
    check("a typed 'looks great, save it' saves the latest draft at once, asking the model nothing (§472)",
      ty.st === 200 && seen.length === bS && tyL.part.kind === "saved" && /Saved: Aspiration — Mobile, v2/.test(tyL.body) && vS2.length === 2, seen.length - bS + " asks · " + tyL.body);
    const shelfS2 = await asTenant(A, (c) => deliverablesOn(c, "mobile", "analysis"));
    check("...as v2 of the SAME deliverable, never a second row with the same title", shelfS2.filter((d) => d.title === "Aspiration — Mobile").length === 1);
    const ch2 = (await call("POST", "api", { act: "newChat", place: "mobile", section: "analysis", title: "Empty" }, NORAN)).j.chat;
    const ty2 = await call("POST", "api", { act: "say", id: ch2.id, text: "save it" }, NORAN);
    check("...and in a chat with no draft it says so rather than pretending", /no draft in this chat/.test(ty2.j.messages[ty2.j.messages.length - 1].body));
    check("the save words are narrow: a question that mentions saving goes to the model",
      isSaveAsk("save it") && isSaveAsk("Looks great, save it!") && !isSaveAsk("how would this save us money in Q3 and beyond") && !isSaveAsk("don't save it yet"));
    check("...and a short 'enhance' is the bare kind, a long one is not", isBareEnhance("enhance it") && !isBareEnhance("enhance the aspiration so it names online sales and the 2028 target clearly"));
    check("a draft is written out as readable text", /^Aspiration — Mobile\n\nASPIRATION\n- Be the first choice/.test(draftText(DR)), JSON.stringify(draftText(DR)));
    NEXT = null;

    /* ══ §6 · THE GUIDED FOUNDATION (§465) ══════════════════════════════
       The flow is the office's, stored on the chat, cut to shape by the
       server, drafted by the model from the answers, checked across the five
       parts, and saved as the NEXT version of one deliverable — never from
       what the page claims (§42). */
    {
    section("§6 · the Foundation chat: from the plan or fresh, the years, the draft, the check, a new version each run");
    const nf = await call("POST", "api", { act: "newFlow", place: "mobile" }, NORAN);
    check("a new Foundation chat on a place with no Foundation opens on the roads — no question to ask (§478)",
      nf.st === 200 && nf.j.chat.section === "foundation" && nf.j.flow.phase === "path" && nf.j.flow.ans.length === 6, JSON.stringify(nf.j).slice(0, 200));
    const np = await call("POST", "api", { act: "newFlow", place: "mobile", hasPlan: true }, NORAN);
    check("...and on a place that has one it asks first: start from it, or start fresh", np.st === 200 && np.j.flow.phase === "start" && np.j.flow.start === "", JSON.stringify(np.j.flow).slice(0, 120));
    {
      const P = JSON.parse(JSON.stringify(np.j.flow));
      const pl = await call("POST", "api", { act: "flowSave", id: np.j.chat.id, flow: { ...P, start: "plan", drafts: ["We sell phones", "Lead by 2028", "", "", "Grow share", ""], from: [true, true, true, false, true, false], done: [true, true, false, false, true, false] } }, NORAN);
      check("Start from it loads the plan's parts into the cards, marked as from the plan, and asks no years",
        pl.st === 200 && pl.j.flow.phase === "loaded" && pl.j.flow.path === "guided" && pl.j.flow.from.join() === "true,true,false,false,true,false" && pl.j.flow.y0 === null,
        JSON.stringify(pl.j.flow).slice(0, 200));
      const back = await call("POST", "api", { act: "flowSave", id: np.j.chat.id, flow: { ...pl.j.flow, phase: "path" } }, NORAN);
      check("...a flow started from the plan never drops back to the roads", back.j.flow.phase === "loaded");
      const fr = await call("POST", "api", { act: "newFlow", place: "mobile", hasPlan: true }, NORAN);
      const fr1 = await call("POST", "api", { act: "flowSave", id: fr.j.chat.id, flow: { ...fr.j.flow, start: "fresh" } }, NORAN);
      check("Start fresh goes to the roads", fr1.j.flow.phase === "path" && fr1.j.flow.start === "fresh");
      const fr2 = await call("POST", "api", { act: "flowSave", id: fr.j.chat.id, flow: { ...fr1.j.flow, start: "", phase: "start" } }, NORAN);
      check("...and the page cannot go back to the question once it is answered", fr2.j.flow.phase === "path", fr2.j.flow.phase);
      await call("POST", "api", { act: "delete", id: fr.j.chat.id }, NORAN);
    }
    const hendNf = await call("POST", "api", { act: "newFlow", place: "mobile" }, HEND);
    check("...and a client's own person cannot start one", hendNf.st === 403, hendNf.st + "");
    const fid = nf.j.chat.id;
    const g0 = await call("GET", "chat", null, NORAN, "?id=" + fid + "&placeWord=Mobile");
    check("the chat comes with its flow, the six parts' questions and examples, nothing marked optional (§479: Structure decides, never the card), the short-answer line and the next version",
      g0.j.flow && g0.j.flowSteps.length === 6 && g0.j.flowSteps.map((e) => e.key).join() === "who,asp,eim,pur,obj,val" &&
      !g0.j.flowSteps.some((e) => e.optional) && g0.j.flowSteps.every((e) => e.questions.length && e.examples.length === e.questions.length) &&
      g0.j.shortAnswer === 15 && g0.j.nextVersion === 1, JSON.stringify(Object.keys(g0.j)));
    const lst = await call("GET", "list", null, NORAN, "?place=mobile&section=foundation");
    check("...and the rail marks it guided", lst.j && (lst.j.chats || []).some((c) => c.id === fid && c.guided), JSON.stringify(lst.j && lst.j.chats).slice(0, 200));
    let F = JSON.parse(JSON.stringify(nf.j.flow));
    const bad1 = await call("POST", "api", { act: "flowSave", id: fid, flow: { ...F, path: "guided", y0: 2026, y1: 2024, phase: "ask" } }, NORAN);
    check("the guided road with years that run backwards stays on the years step", bad1.st === 200 && bad1.j.flow.phase === "year");
    const s1f = await call("POST", "api", { act: "flowSave", id: fid, flow: { ...F, path: "guided", y0: 2026, y1: 2028, phase: "year" } }, NORAN);
    check("good years move it on to the questions", s1f.j.flow.phase === "ask" && s1f.j.flow.y1 === 2028);
    F = s1f.j.flow;
    const sneak = await call("POST", "api", { act: "flowSave", id: fid, flow: { ...F, path: "notes", phase: "ask" } }, NORAN);
    check("another road never enters the guided steps — it stays at the road and goes on as a chat", sneak.j.flow.phase === "path" && sneak.j.flow.path === "notes");
    const offRoad = await call("POST", "api", { act: "flowDraft", id: fid, el: 0, placeWord: "Mobile" }, NORAN);
    check("...and drafting off the guided road is refused in words", offRoad.st === 400 && /guided questions first/.test(offRoad.j.why), JSON.stringify(offRoad.j));
    const fake = await call("POST", "api", { act: "flowSave", id: fid, flow: { ...F, path: "guided", phase: "saved", saved: { deliverableId: "x", n: 9, title: "fake" } } }, NORAN);
    check("the page cannot say it is saved — `saved` is the product's", fake.j.flow.saved === null && fake.j.flow.phase !== "saved", JSON.stringify(fake.j.flow.saved));
    F = fake.j.flow;
    const noAns = await call("POST", "api", { act: "flowDraft", id: fid, el: 0, placeWord: "Mobile" }, NORAN);
    check("a part with no answer is not drafted", noAns.st === 400 && /Answer at least one/.test(noAns.j.why));
    F.ans[0][0] = "Connect every Egyptian to the people and services they rely on"; F.phase = "review";
    const before6 = seen.length;
    NEXT = { answer: { text: "Connect every Egyptian to what matters, by " + "{Y}" + "." } };
    const d1 = await call("POST", "api", { act: "flowDraft", id: fid, el: 0, flow: F, placeWord: "Mobile", context: "Mobile · 4 pillars" }, NORAN);
    const wq = seen[seen.length - 1];
    const sysF = wq && wq.body && wq.body.systemInstruction ? wq.body.systemInstruction.parts.map((p) => p.text).join("") : "";
    const qText = wq && wq.body ? JSON.stringify(wq.body.contents) : "";
    check("drafting asks the model once, with the answers given as they stand on the page",
      seen.length === before6 + 1 && (sysF + qText).includes("Connect every Egyptian to the people and services they rely on"), (sysF + qText).slice(0, 200));
    check("...and the draft lands on the flow, not yet agreed", d1.st === 200 && d1.j.flow.phase === "draft" && /Connect every Egyptian/.test(d1.j.flow.drafts[0]) && !d1.j.flow.done[0], JSON.stringify(d1.j).slice(0, 200));
    NEXT = { answer: { text: "Connect Egypt to what matters." } };
    const r1 = await call("POST", "api", { act: "flowRefine", id: fid, el: 0, how: "concise", placeWord: "Mobile" }, NORAN);
    check("a refine rewrites that part's draft", r1.st === 200 && r1.j.flow.drafts[0] === "Connect Egypt to what matters.");
    const early = await call("POST", "api", { act: "flowCheck", id: fid, placeWord: "Mobile" }, NORAN);
    check("the check across the parts waits for every part to be agreed", early.st === 400 && /Every part needs/.test(early.j.why));
    const earlyFin = await call("POST", "api", { act: "flowFinish", id: fid, placeWord: "Mobile" }, NORAN);
    check("...and so does saving it", earlyFin.st === 400 && /Every part needs/.test(earlyFin.j.why));
    F = r1.j.flow;
    F.drafts = F.drafts.map((d, i) => d || (i === 3 ? "" : "Part " + (i + 1) + " draft for {Y}")); F.done = F.done.map((_, i) => i !== 3); F.phase = "check";
    await call("POST", "api", { act: "flowSave", id: fid, flow: F }, NORAN);
    /* §479: nothing is optional — a part the Structure carries is owed, and
       one it does not is never asked. Both ends (§94.2). */
    const owedPur = await call("POST", "api", { act: "flowCheck", id: fid, placeWord: "Mobile" }, NORAN);
    check("with Purpose switched on in Structure, an empty Purpose holds the check (§479)", owedPur.st === 400 && /Every part needs/.test(owedPur.j.why), owedPur.st + "");
    F.skip = ["pur"];
    const sv = await call("POST", "api", { act: "flowSave", id: fid, flow: F }, NORAN);
    check("...and switched off it is not asked", sv.st === 200 && sv.j.flow.skip.join() === "pur", JSON.stringify(sv.j.flow && sv.j.flow.skip));
    const sk = await call("POST", "api", { act: "newFlow", place: "mobile", skip: ["asp", "val", "nope"] }, NORAN);
    check("only Purpose and Core Values can be switched off — never the Aspiration", sk.st === 200 && sk.j.flow.skip.join() === "val", JSON.stringify(sk.j.flow && sk.j.flow.skip));
    if (sk.j.chat) await call("POST", "api", { act: "delete", id: sk.j.chat.id }, NORAN);
    NEXT = { answer: { agree: ["The purpose and the aspiration point the same way."], issues: [{ element: "val", text: "One value repeats the purpose." }, { element: "nothing", text: "A general note." }] } };
    const ck = await call("POST", "api", { act: "flowCheck", id: fid, placeWord: "Mobile" }, NORAN);
    check("the check comes back as agreements and issues, each issue naming a real part or none",
      ck.st === 200 && ck.j.flow.phase === "check" && ck.j.flow.check.agree.length === 1 &&
      ck.j.flow.check.issues[0].el === "val" && ck.j.flow.check.issues[1].el === "", JSON.stringify(ck.j.flow && ck.j.flow.check));
    const fin = await call("POST", "api", { act: "flowFinish", id: fid, placeWord: "Mobile" }, NORAN);
    check("saved as Foundation — Mobile, version 1", fin.st === 200 && fin.j.saved.n === 1 && fin.j.saved.title === "Foundation — Mobile" && fin.j.flow.phase === "saved", JSON.stringify(fin.j).slice(0, 200));
    const vrow = (await asTenant(A, (c) => c.query("SELECT v.n, v.body->>'text' t FROM copilot_versions v WHERE v.deliverable_id = $1 ORDER BY n", [fin.j.saved.deliverableId]))).rows;
    check("...Purpose switched off does not hold it up, and the version holds the parts, the end year written in", vrow.length === 1 && /WHO WE ARE\nConnect Egypt to what matters\./.test(vrow[0].t) && /END IN MIND\nPart 3 draft for 2028/.test(vrow[0].t) && /CORE VALUES\nPart 6 draft for 2028/.test(vrow[0].t) && /draft for 2028/.test(vrow[0].t) && !/\{Y\}/.test(vrow[0].t), JSON.stringify(vrow).slice(0, 200));
    const again = await call("POST", "api", { act: "flowSave", id: fid, flow: F }, NORAN);
    check("a saved flow is done — it cannot be changed or saved twice", again.st === 400 && (await call("POST", "api", { act: "flowFinish", id: fid, placeWord: "Mobile" }, NORAN)).st === 400);
    const nf2 = await call("POST", "api", { act: "newFlow", place: "mobile" }, NORAN);
    const F2 = { ...nf2.j.flow, y0: 2026, y1: 2028, path: "guided", phase: "check", drafts: F.drafts, done: F.done, skip: ["pur"] };
    await call("POST", "api", { act: "flowSave", id: nf2.j.chat.id, flow: F2 }, NORAN);
    const g2 = await call("GET", "chat", null, NORAN, "?id=" + nf2.j.chat.id + "&placeWord=Mobile");
    check("a second run says before the press that it will be version 2", g2.j.nextVersion === 2, g2.j.nextVersion + "");
    const fin2 = await call("POST", "api", { act: "flowFinish", id: nf2.j.chat.id, placeWord: "Mobile" }, NORAN);
    const nd = (await asTenant(A, (c) => c.query("SELECT count(*)::int n FROM copilot_deliverables WHERE title = 'Foundation — Mobile'"))).rows[0].n;
    check("...and becomes version 2 of the SAME deliverable, never a second one", fin2.j.saved && fin2.j.saved.n === 2 && fin2.j.saved.deliverableId === fin.j.saved.deliverableId && nd === 1,
      JSON.stringify(fin2.j.saved) + " · " + nd);
    const hendSave = await call("POST", "api", { act: "flowSave", id: nf2.j.chat.id, flow: F2 }, HEND);
    check("a client's own person cannot write a flow", hendSave.st === 403);
    NEXT = null;
    }

    /* ══ §8 · the How-we-compete chat (§493) ═══════════════════════════
       Scored, chosen, valued, refined and saved through the stand-in; every
       gate asked of the STORED chat (§42), both ends (§94.2). */
    {
    section("§8 · the How-we-compete chat: scored, chosen, valued, refined, saved");
    const mk = (fs, f) => Object.fromEntries(fs.map((x, k) => [x.id, f(k)]));
    const SC = { market: mk(CP_M, () => ({ btc: 2, bts: 1, bp: 0 })), internal: mk(CP_I, () => ({ btc: 1, bts: 2, bp: 0 })) };
    const VALS = [1, 2, 3, 4, 5].map((n) => ({ title: "Value " + n, how: ["How " + n], measure: ["Measure " + n] }));
    const hn = await call("POST", "api", { act: "newCompete", place: "mobile" }, HEND);
    check("a client's own person cannot start one", hn.st === 403, hn.st + "");
    const nc = await call("POST", "api", { act: "newCompete", place: "mobile" }, NORAN);
    check("the office starts a How we compete chat, on the score step, with the twenty factors",
      nc.st === 200 && nc.j.chat?.section === "compete" && nc.j.compete?.phase === "score" && nc.j.competeFactors?.market.length === 10 && nc.j.competeFactors?.internal.length === 10 && nc.j.competeTodo.length === 5,
      JSON.stringify(nc.j).slice(0, 200));
    const cid = nc.j.chat?.id;
    const early = await call("POST", "api", { act: "competeValues", id: cid, placeWord: "Mobile" }, NORAN);
    check("values are refused before a discipline is chosen", early.st === 400 && /Choose the discipline/.test(early.j.why), JSON.stringify(early.j));
    const noTab = await call("POST", "api", { act: "competeFinish", id: cid, placeWord: "Mobile" }, NORAN);
    check("saving is refused while there is no table — asked of the stored chat", noTab.st === 400 && /check the table/.test(noTab.j.why), JSON.stringify(noTab.j));
    NEXT = { answer: { market: { [CP_M[0].id]: { btc: 2, bts: 1, bp: 0 } }, internal: SC.internal } };
    const half = await call("POST", "api", { act: "competeScore", id: cid, placeWord: "Mobile" }, NORAN);
    check("scores that come back incomplete are refused, never half-kept", half.st === 503, half.st + "");
    NEXT = { answer: SC };
    const sc = await call("POST", "api", { act: "competeScore", id: cid, placeWord: "Mobile", context: "SWOT: strong stores" }, NORAN);
    check("scored through the model, the chat moves to choosing and recommends what the market rewards",
      sc.st === 200 && sc.j.compete?.phase === "discipline" && sc.j.competeResult?.recommended === "btc" && sc.j.competeResult?.market.pct.btc === 100 &&
      sc.j.competeResult?.internal.leader === "bts" && sc.j.competeResult?.aligned === false, JSON.stringify(sc.j.competeResult || sc.j).slice(0, 200));
    check("...and the model was asked for every factor", /operations/.test(JSON.stringify(seen[seen.length - 1] || "")) && /switching_costs/.test(JSON.stringify(seen[seen.length - 1] || "")));
    let C = sc.j.compete;
    const fake = await call("POST", "api", { act: "competeSave", id: cid, compete: { ...(C||{}), phase: "saved", saved: { deliverableId: "x", n: 7, title: "fake" } } }, NORAN);
    check("the page cannot say it is saved — `saved` is the product's", fake.st === 200 && fake.j.compete?.saved === null && fake.j.compete?.phase !== "saved", JSON.stringify(fake.j.compete && fake.j.compete?.saved));
    const ahead = await call("POST", "api", { act: "competeSave", id: cid, compete: { ...(C||{}), phase: "table" } }, NORAN);
    check("the phase never runs ahead of the work", ahead.j.compete?.phase === "discipline", ahead.j.compete?.phase);
    const ed = JSON.parse(JSON.stringify(C || {market:{}})); (ed.market = ed.market || {})[CP_M[1].id] = { btc: 0, bts: 2, bp: 2 }; ed.edited = ["market:" + CP_M[1].id + ":btc"];
    const es = await call("POST", "api", { act: "competeSave", id: cid, compete: ed }, NORAN);
    check("a changed score is kept, marked edited, and the result follows", es.j.compete?.edited.length === 1 && es.j.competeResult?.market.pct.btc === 90, JSON.stringify(es.j.competeResult && es.j.competeResult?.market.pct));
    NEXT = { answer: { values: VALS } };
    const vv = await call("POST", "api", { act: "competeValues", id: cid, placeWord: "Mobile", compete: { ...es.j.compete, chosen: "bts", phase: "values" } }, NORAN);
    check("choosing a discipline and asking gives five values to tick", vv.st === 200 && vv.j.compete?.chosen === "bts" && vv.j.compete?.suggested.length === 5 && vv.j.compete?.phase === "values",
      JSON.stringify(vv.j.compete || vv.j).slice(0, 200));
    const tb = await call("POST", "api", { act: "competeSave", id: cid, compete: { ...vv.j.compete, picked: [0, 2, 9], table: { discipline: "bts", values: [VALS[0], VALS[2]] }, phase: "table" } }, NORAN);
    check("ticking two makes the table, and a tick past the list is dropped", tb.j.compete?.picked.join() === "0,2" && tb.j.compete?.table.values.length === 2 && tb.j.compete?.phase === "table", JSON.stringify(tb.j.compete?.picked));
    const noAsk = await call("POST", "api", { act: "competeRefine", id: cid, placeWord: "Mobile" }, NORAN);
    check("a refine with nothing asked is refused in words", noAsk.st === 400 && /Say what to change/.test(noAsk.j.why));
    NEXT = { answer: { reply: "Sharper titles.", values: [{ ...VALS[0], title: "Hassle-free" }, VALS[2]], alternatives: ["Easy to buy", "One visit"] } };
    const rf = await call("POST", "api", { act: "competeRefine", id: cid, placeWord: "Mobile", ask: "Make the first title warmer" }, NORAN);
    check("refining changes the table in place and offers alternatives", rf.st === 200 && rf.j.compete?.table.values[0].title === "Hassle-free" && rf.j.compete?.alts.length === 2 && rf.j.compete?.reply === "Sharper titles.",
      JSON.stringify(rf.j.compete || rf.j).slice(0, 200));
    const hf = await call("POST", "api", { act: "competeFinish", id: cid, placeWord: "Mobile" }, HEND);
    check("a client's own person cannot save it", hf.st === 403);
    const fn = await call("POST", "api", { act: "competeFinish", id: cid, placeWord: "Mobile" }, NORAN);
    check("saving makes version 1 of How we compete — Mobile", fn.st === 200 && fn.j.saved && fn.j.saved.n === 1 && fn.j.saved.title === "How we compete \u2014 Mobile" && fn.j.compete?.phase === "saved",
      JSON.stringify(fn.j).slice(0, 200));
    const vrow = fn.j.saved ? (await asTenant(A, (c) => c.query("SELECT body FROM copilot_versions WHERE deliverable_id = $1", [fn.j.saved.deliverableId]))).rows : [];
    check("...the version holds the table and the scores", vrow.length === 1 && vrow[0].body.compete.discipline === "bts" && vrow[0].body.compete.values.length === 2 && !!vrow[0].body.scores.market,
      JSON.stringify(vrow).slice(0, 200));
    const after = await call("POST", "api", { act: "competeSave", id: cid, compete: tb.j.compete }, NORAN);
    check("a saved chat refuses further changes", after.st === 400 && /Start a new How we compete chat/.test(after.j.why));
    const nc2 = await call("POST", "api", { act: "newCompete", place: "mobile" }, OMAR);
    NEXT = { answer: SC }; await call("POST", "api", { act: "competeScore", id: nc2.j.chat?.id, placeWord: "Mobile" }, OMAR);
    const g2 = await call("GET", "chat", null, OMAR, "?id=" + nc2.j.chat?.id);
    await call("POST", "api", { act: "competeSave", id: nc2.j.chat?.id, compete: { ...g2.j.compete, chosen: "btc", table: { discipline: "btc", values: [VALS[1]] }, phase: "table" } }, OMAR);
    const fn2 = await call("POST", "api", { act: "competeFinish", id: nc2.j.chat?.id, placeWord: "Mobile" }, OMAR);
    check("a second chat saves as version 2 of the SAME deliverable", fn2.j.saved && fn2.j.saved.n === 2 && fn.j.saved && fn2.j.saved.deliverableId === fn.j.saved.deliverableId, JSON.stringify(fn2.j.saved));
    const notCp = await call("POST", "api", { act: "competeSave", id: ch.id, compete: {} }, NORAN);
    check("a chat that is not How we compete is refused", notCp.st === 400 && /not a How we compete chat/.test(notCp.j.why));
    NEXT = null;
    }

    /* ══ §9 · the Directions and Capabilities chats (§494) ════════════ */
    {
    section("§9 · the Directions chat: plan or fresh, scored, chosen, capabilities, saved");
    const FNS = [{ key: "commercial", name: "Commercial" }, { key: "it", name: "IT" }];
    const hn = await call("POST", "api", { act: "newDirections", place: "mobile", mode: "directions", withCaps: true, hadPlan: 2, title: "Directions 2026" }, HEND);
    check("a client's own person cannot start one", hn.st === 403, hn.st + "");
    const nd = await call("POST", "api", { act: "newDirections", place: "mobile", mode: "directions", withCaps: true, hadPlan: 2, title: "Directions 2026" }, NORAN);
    check("the office starts a Directions chat that asks plan-or-fresh first", nd.st === 200 && nd.j.chat?.section === "directions" && nd.j.dirs?.start === "" && nd.j.dirs?.withCaps === true && nd.j.dirsTodo?.length === 4,
      String(JSON.stringify(nd.j)).slice(0, 200));
    const did = nd.j.chat?.id;
    const tooSoon = await call("POST", "api", { act: "dirSuggest", id: did, placeWord: "Mobile", fns: FNS }, NORAN);
    check("nothing is suggested before plan-or-fresh is answered", tooSoon.st === 400 && /Start from the plan/.test(tooSoon.j.why), JSON.stringify(tooSoon.j));
    const st = await call("POST", "api", { act: "dirStart", id: did, start: "plan", existing: [{ id: "mobile-P1", title: "Grow accessories" }, { id: "mobile-P2", title: "Win families" }] }, NORAN);
    check("starting from the plan puts its Directions on the table, marked and keyed to their pillars", st.st === 200 && st.j.dirs?.options.length === 2 && st.j.dirs.options.every((o) => o.mark === "plan" && o.planId) && st.j.dirs?.start === "plan",
      String(JSON.stringify(st.j.dirs)).slice(0, 200));
    const again = await call("POST", "api", { act: "dirStart", id: did, start: "fresh" }, NORAN);
    check("...and it cannot start twice", again.st === 400 && /already started/.test(again.j.why));
    NEXT = { answer: { reply: "From the SWOT.", options: [
      { title: "Win families", urgency: 4, importance: 4, ease: 3, ownedBy: "commercial" }, { title: "Grow accessories", urgency: 2, importance: 2, ease: 2, ownedBy: "" },
      { title: "Upper Egypt", urgency: 3, importance: 4, ease: 3, ownedBy: "nobody" }, { title: "Own label", urgency: 3, importance: 3, ease: 3, ownedBy: "it" },
      { title: "Delivery", urgency: 2, importance: 3, ease: 2, ownedBy: "" }, { title: "B2B", urgency: 1, importance: 2, ease: 2, ownedBy: "" } ] } };
    const sg = await call("POST", "api", { act: "dirSuggest", id: did, placeWord: "Mobile", fns: FNS, context: "SWOT: strong stores" }, NORAN);
    const so = sg.j.dirs?.options || [];
    check("suggested and scored: the plan's rows keep their key and mark, new rows follow, the four best are ticked",
      sg.st === 200 && so.length === 6 && so[0].planId === "mobile-P1" && so[0].urgency === 2 && so[1].mark === "plan" && so[1].ownedBy === "commercial" &&
      so.filter((o) => o.go).length === 4 && !so.find((o) => o.title === "B2B").go && sg.j.dirsScores?.[1] === 48,
      String(JSON.stringify(so)).slice(0, 300));
    check("...an owner the model named that is not a function is dropped", so.find((o) => o.title === "Upper Egypt")?.ownedBy === "");
    check("...and the model was told the plan's own rows and the functions", /THE PLAN'S EXISTING DIRECTIONS[\s\S]*Grow accessories/.test(JSON.stringify(seen[seen.length - 1] || "")) && /commercial: Commercial/.test(JSON.stringify(seen[seen.length - 1] || "")));
    NEXT = { answer: { reply: "Added yours.", options: [{ title: "Small stores", urgency: 3, importance: 4, ease: 3, ownedBy: "commercial" }, { title: "Win families", urgency: 1, importance: 1, ease: 1, ownedBy: "" }] } };
    const mo = await call("POST", "api", { act: "dirMore", id: did, placeWord: "Mobile", fns: FNS, own: ["Small stores"] }, NORAN);
    check("adding your own: scored, marked yours, and a row already on the table is not added twice",
      mo.st === 200 && mo.j.dirs?.options.length === 7 && mo.j.dirs.options[6].mark === "yours" && mo.j.dirs.options.filter((o) => o.title === "Win families").length === 1,
      JSON.stringify(mo.j.dirs?.options.map((o) => o.title + ":" + o.mark)));
    const capEarly = await call("POST", "api", { act: "capSuggest", id: did, placeWord: "Mobile", fns: FNS }, NORAN);
    check("Capabilities are refused before the Directions are chosen", capEarly.st === 400 && /Choose the Directions/.test(capEarly.j.why));
    const finEarly = await call("POST", "api", { act: "dirFinish", id: did, placeWord: "Mobile", fns: FNS }, NORAN);
    check("saving is refused while nothing is chosen — asked of the stored chat", finEarly.st === 400 && /Tick the Directions/.test(finEarly.j.why), JSON.stringify(finEarly.j));
    const fake = await call("POST", "api", { act: "dirSave", id: did, dirs: { saved: { deliverableId: "x", n: 9, title: "fake" } } }, NORAN);
    check("the page cannot say it is saved — `saved` is the product's", fake.st === 200 && fake.j.dirs?.saved === null);
    const none = await call("POST", "api", { act: "dirSave", id: did, dirs: { options: mo.j.dirs.options.map((o) => ({ ...o, go: false })), chose: true } }, NORAN);
    check("'chosen' with nothing ticked does not stick", none.j.dirs?.chose === false);
    const ch2 = await call("POST", "api", { act: "dirSave", id: did, dirs: { options: mo.j.dirs.options, chose: true } }, NORAN);
    check("choosing the ticked ones moves the to-do on, and Capabilities are now owed", ch2.j.dirs?.chose === true && /Keep at least one Capability/.test(ch2.j.dirsBlocker), ch2.j.dirsBlocker);
    const chosen = (ch2.j?.dirs?.options || []).filter((o) => o.go).map((o) => o.title);
    NEXT = { answer: { reply: "To deliver them.", capabilities: [
      { title: "Low-cost supply chain", kind: "gap", serves: [chosen[0], "Not a direction"], ownedBy: "commercial" },
      { title: "Data-led pricing", kind: "transformation", serves: [chosen[1]], ownedBy: "it" } ] } };
    const cs = await call("POST", "api", { act: "capSuggest", id: did, placeWord: "Mobile", fns: FNS }, NORAN);
    check("Capabilities suggested from the chosen Directions, kept, serving only Directions on the table",
      cs.st === 200 && cs.j.dirs?.caps.length === 2 && cs.j.dirs.caps.every((x) => x.keep) && cs.j.dirs.caps[0].serves.join() === chosen[0] && cs.j.dirs.caps[0].kind === "gap" && cs.j.dirsBlocker === "",
      String(JSON.stringify(cs.j.dirs?.caps)).slice(0, 300));
    check("...and the model was asked with the chosen Directions", chosen.every((t) => JSON.stringify(seen[seen.length - 1] || "").includes(t)));
    const hf = await call("POST", "api", { act: "dirFinish", id: did, placeWord: "Mobile", fns: FNS }, HEND);
    check("a client's own person cannot save it", hf.st === 403);
    const fin = await call("POST", "api", { act: "dirFinish", id: did, placeWord: "Mobile", fns: FNS }, NORAN);
    check("saving makes version 1 of Directions — Mobile", fin.st === 200 && fin.j.saved?.n === 1 && fin.j.saved?.title === "Directions \u2014 Mobile" && fin.j.dirsDone === 4, String(JSON.stringify(fin.j)).slice(0, 200));
    const vrow = fin.j.saved ? (await asTenant(A, (c) => c.query("SELECT body FROM copilot_versions WHERE deliverable_id = $1", [fin.j.saved.deliverableId]))).rows : [];
    check("...the version holds the chosen Directions and kept Capabilities, owners by name",
      vrow.length === 1 && vrow[0].body.directions.length === chosen.length && vrow[0].body.capabilities.length === 2 && /Commercial/.test(vrow[0].body.text) && /48\/64/.test(vrow[0].body.text),
      String(JSON.stringify(vrow)).slice(0, 300));
    const after = await call("POST", "api", { act: "dirSave", id: did, dirs: { chose: false } }, NORAN);
    check("a saved chat refuses further changes", after.st === 400 && /Start a new chat/.test(after.j.why));

    section("§9b · the Capabilities chat, when capabilities are their own layer");
    const nc = await call("POST", "api", { act: "newDirections", place: "mobile", mode: "capabilities", title: "Capabilities 2026" }, NORAN);
    check("a Capabilities chat starts with nothing to choose first", nc.st === 200 && nc.j.chat?.section === "capabilities" && nc.j.dirs?.start === "fresh" && nc.j.dirs?.withCaps === false && nc.j.dirsTodo?.length === 3);
    const cfin0 = await call("POST", "api", { act: "dirFinish", id: nc.j.chat?.id, placeWord: "Mobile", fns: FNS }, NORAN);
    check("...nothing kept, nothing saved", cfin0.st === 400 && /Keep at least one Capability/.test(cfin0.j.why));
    NEXT = { answer: { reply: "From the saved Directions.", capabilities: [{ title: "One retail system", kind: "enabler", serves: ["Upper Egypt"], ownedBy: "it" }] } };
    const cc = await call("POST", "api", { act: "capSuggest", id: nc.j.chat?.id, placeWord: "Mobile", fns: FNS, dirTitles: ["Upper Egypt"] }, NORAN);
    check("...suggested from the saved Directions the page sends", cc.st === 200 && cc.j.dirs?.caps[0]?.serves.join() === "Upper Egypt" && cc.j.dirs.caps[0].kind === "enabler");
    const cfin = await call("POST", "api", { act: "dirFinish", id: nc.j.chat?.id, placeWord: "Mobile", fns: FNS }, NORAN);
    check("...and saves as Capabilities — Mobile", cfin.st === 200 && cfin.j.saved?.title === "Capabilities \u2014 Mobile");
    const notDv = await call("POST", "api", { act: "dirSave", id: ch.id, dirs: {} }, NORAN);
    check("a chat that is not Directions is refused", notDv.st === 400 && /not a Directions/.test(notDv.j.why));
    NEXT = null;
    section("§9c · the Execution chat: the period, one item at a time, saved");
    const xh = await call("POST", "api", { act: "newExecution", place: "mobile", title: "Execution 2026", items: [{ kind: "direction", planId: "mobile-P1", title: "Win families" }] }, HEND);
    check("a client's own person cannot start one", xh.st === 403, xh.st + "");
    const xn = await call("POST", "api", { act: "newExecution", place: "mobile", title: "Execution 2026",
      items: [{ kind: "direction", planId: "mobile-P1", title: "Win families", ownedBy: "Commercial" }, { kind: "capability", planId: "cap:cap1", title: "Supply chain" }, { title: "" }] }, NORAN);
    const xid = xn.j.chat?.id;
    check("the office starts one: the plan's items, the period asked first, a to-do of period + items + save",
      xn.st === 200 && xn.j.chat?.section === "execution" && xn.j.exec?.items.length === 2 && xn.j.exec?.period === null && xn.j.execTodo?.length === 4 && /how long the plan is/.test(xn.j.execBlocker),
      String(JSON.stringify(xn.j)).slice(0, 200));
    const xe = await call("POST", "api", { act: "execDraft", id: xid, placeWord: "Mobile" }, NORAN);
    check("nothing is drafted before the period is said", xe.st === 400 && /how long the plan is/.test(xe.j.why), JSON.stringify(xe.j));
    const xbad = await call("POST", "api", { act: "execPeriod", id: xid, period: { y: 2026, m1: 11, m2: 3 } }, NORAN);
    check("a period that runs backwards is refused in words", xbad.st === 400 && /ONE year/.test(xbad.j.why));
    const xp = await call("POST", "api", { act: "execPeriod", id: xid, period: { y: 2026, m1: 7, m2: 12 } }, NORAN);
    check("picked months set the period, and only Q3 and Q4 are offered", xp.st === 200 && xp.j.exec?.period?.m1 === 7 && xp.j.execWords?.quarters.join() === "3,4", JSON.stringify(xp.j.execWords));
    NEXT = { answer: { reply: "Drafted.", measures: [{ name: "Family share", target: "30%", compile: "Latest" }], tactics: [{ name: "Family bundles", owner: "Commercial", quarters: [1, 3, 4] }] } };
    const xd = await call("POST", "api", { act: "execDraft", id: xid, placeWord: "Mobile", context: "SWOT: strong stores" }, NORAN);
    const xi = xd.j.exec?.items[0];
    check("the model drafts the item under the cursor; a quarter outside the period is dropped",
      xd.st === 200 && xi?.measures.length === 1 && xi?.tactics[0]?.quarters.join() === "3,4" && xi?.drafted === true, String(JSON.stringify(xi)).slice(0, 200));
    check("...and the model was told the period's quarters only", /Quarters a tactic may run in: Q3, Q4/.test(JSON.stringify(seen[seen.length - 1] || "")));
    const xf0 = await call("POST", "api", { act: "execFinish", id: xid, placeWord: "Mobile" }, NORAN);
    check("saving is refused while an item has no measure — named, asked of the stored chat", xf0.st === 400 && /Supply chain/.test(xf0.j.why), JSON.stringify(xf0.j));
    const items2 = xd.j.exec.items.map((x, k) => k === 1 ? { ...x, title: "Renamed", measures: [{ name: "Lead time", target: "5 days", compile: "Average" }], tactics: [{ name: "One warehouse", owner: "Supply", quarters: [2, 4] }] } : x);
    const xs = await call("POST", "api", { act: "execSave", id: xid, exec: { items: items2, cursor: 1, saved: { deliverableId: "x", n: 9, title: "fake" } } }, NORAN);
    check("the page writes what is under an item, never which items there are, and cannot say it is saved",
      xs.st === 200 && xs.j.exec?.items[1].title === "Supply chain" && xs.j.exec?.items[1].tactics[0].quarters.join() === "4" && xs.j.exec?.saved === null && xs.j.execBlocker === "",
      String(JSON.stringify(xs.j.exec)).slice(0, 300));
    const xhf = await call("POST", "api", { act: "execFinish", id: xid, placeWord: "Mobile" }, HEND);
    check("a client's own person cannot save it", xhf.st === 403);
    const xf = await call("POST", "api", { act: "execFinish", id: xid, placeWord: "Mobile" }, NORAN);
    check("saving makes version 1 of Execution — Mobile", xf.st === 200 && xf.j.saved?.n === 1 && xf.j.saved?.title === "Execution \u2014 Mobile" && xf.j.execDone === 4, String(JSON.stringify(xf.j)).slice(0, 200));
    const xv = xf.j.saved ? (await asTenant(A, (c) => c.query("SELECT body FROM copilot_versions WHERE deliverable_id = $1", [xf.j.saved.deliverableId]))).rows : [];
    check("...the version holds the period and both items", xv.length === 1 && xv[0].body.period?.m1 === 7 && xv[0].body.items.length === 2 && /PLAN PERIOD: Jul\u2013Dec 2026/.test(xv[0].body.text), String(JSON.stringify(xv)).slice(0, 300));
    const xafter = await call("POST", "api", { act: "execPeriod", id: xid, choice: "full" }, NORAN);
    check("a saved chat refuses further changes", xafter.st === 400 && /Start a new chat/.test(xafter.j.why));
    const notEx = await call("POST", "api", { act: "execSave", id: ch.id, exec: {} }, NORAN);
    check("a chat that is not Execution is refused", notEx.st === 400 && /not an Execution/.test(notEx.j.why));
    NEXT = null;
    }

    NEXT = { status: 500 };
    const b2 = seen.length;
    const n0 = (await asTenant(A, (c) => messagesOf(c, ch.id))).length;
    const s4 = await call("POST", "api", { act: "say", id: ch.id, text: "One more question" }, NORAN);
    const last4 = s4.j.messages[s4.j.messages.length - 1];
    check("when the AI fails, what was typed is kept and the product says so — never a pretend answer",
      s4.st === 200 && s4.j.messages.length === n0 + 2 && s4.j.messages[s4.j.messages.length - 2].body === "One more question" &&
      last4.part.kind === "failed" && /could not answer just now/.test(last4.body) && /send it again/.test(last4.body), JSON.stringify(last4));
    check("...after exactly five asks — once, three more, then the lighter model once — never a loop (§458)", seen.length === b2 + 5, seen.length - b2 + " asks");
    delete process.env.GEMINI_API_KEY;
    const before = seen.length;
    const s5 = await call("POST", "api", { act: "say", id: ch.id, text: "And with no key?" }, NORAN);
    check("with no key the model is never asked, and the line says so", seen.length === before && s5.j.messages[s5.j.messages.length - 1].body === NO_KEY);
    const chat5 = await call("GET", "chat", null, NORAN, "?id=" + ch.id);
    check("...and the chat reports that the AI is off", chat5.j.aiOn === false);
  } finally {
    delete process.env.GEMINI_API_KEY; delete process.env.GEMINI_ENDPOINT; delete process.env.SMP_COPILOT_RETRY_MS;
    await new Promise((r) => stand.close(r));
  }

  /* ══ §7 · the SWOT chat and the sources shelf (§490) ═════════════════
     Every gate asked of the STORED row, never of the page (§42), and each
     at both ends (§94.2): who may delete a source, a saved SWOT the page
     cannot claim, an analysis refused until the to-do list is done, and a
     save refused until there is a draft. None of it needs the model. */
  section("§7 · the SWOT chat and the sources shelf");
  check("whoever added a source may delete it", mayDeleteSource({ by: "noran" }, NORAN));
  check("...and the Super user may", mayDeleteSource({ by: "noran" }, ISLAM));
  check("...and nobody else may — another of the office, or nobody signed in",
    !mayDeleteSource({ by: "noran" }, OMAR) && !mayDeleteSource({ by: "noran" }, { personKey: null, seat: null }));
  const sw_fresh = newSwot(null);
  check("a fresh SWOT opens on the methods with nothing saved", sw_fresh.phase === "methods" && sw_fresh.saved === null);
  const sw_claimed = sanitizeSwot({ phase: "saved", saved: { deliverableId: "x", n: 9, title: "Faked" } }, sw_fresh);
  check("the page cannot claim a SWOT is saved — `saved` is the product's", sw_claimed.saved === null && sw_claimed.phase !== "saved", JSON.stringify(sw_claimed.saved));
  const sw_ticked = sanitizeSwot({ methods: { internal: ["guided", "research"], micro: ["report"], macro: [] } }, sw_fresh);
  check("a method an area does not offer is dropped (Internal has no deep research)",
    sw_ticked.methods.internal.join() === "guided" && sw_ticked.methods.micro.join() === "report", JSON.stringify(sw_ticked.methods));
  const sw_td = todoOf(sw_ticked);
  check("the to-do list counts what is ticked plus the analyses and the draft, nothing done yet",
    sw_td.length === 4 && doneCount(sw_td) === 0, sw_td.map((x) => x.title + ":" + x.state).join(" | "));

  const sw_ns = await call("POST", "api", { act: "newSwot", place: "mobile" }, NORAN);
  const sw_sid = sw_ns.j && sw_ns.j.chat && sw_ns.j.chat.id;
  check("the office starts a SWOT chat", sw_ns.st === 200 && !!sw_sid, sw_ns.st + " " + JSON.stringify(sw_ns.j).slice(0, 160));
  check("...a client's own person cannot", (await call("POST", "api", { act: "newSwot", place: "mobile" }, HEND)).st === 403);
  const sw_sv = await call("POST", "api", { act: "swotSave", id: sw_sid, placeWord: "Mobile",
    swot: { methods: { internal: ["guided"], micro: ["report"], macro: [] }, ans: { internal: SWQ.internal.map(() => "") } } }, NORAN);
  check("ticks are kept and the list says 0 of 4", sw_sv.st === 200 && sw_sv.j.swotDone === 0 && sw_sv.j.swotTodo.length === 4, JSON.stringify(sw_sv.j && sw_sv.j.swotTodo));
  /* §490.2 — "Help me understand" is the old library, chosen by the client's industry. */
  const sw_q = sw_sv.j && sw_sv.j.swotQuestions || {};
  const sw_mi = (sw_q.micro || []).find((q) => q.key === "rivalry"), sw_ma = (sw_q.macro || []).find((q) => q.key === "economic");
  check("a micro and a macro question carry the old library's help (simpler terms, things to think about, an example)",
    !!(sw_mi && sw_mi.more && sw_mi.more.simplerTerms && sw_mi.more.thinkAbout.length && sw_mi.more.exampleResponse) &&
    !!(sw_ma && sw_ma.more && sw_ma.more.simplerTerms), JSON.stringify(sw_mi && sw_mi.more).slice(0, 160));
  check("...and an internal question keeps its own short line and no library entry",
    (sw_q.internal || []).length > 0 && (sw_q.internal || []).every((q) => !q.more), "");
  const { helpFor: sw_help } = await import("../lib/copilot-swot-help.ts");
  check("the library picks the client's industry and falls back to Other",
    sw_help("rivalry", "Retail & E-commerce").industry === "Retail" && sw_help("rivalry", "Something unknown").industry === "Other" &&
    sw_help("nope", "Retail & E-commerce") === null, JSON.stringify([sw_help("rivalry","Retail & E-commerce")?.industry, sw_help("rivalry","x")?.industry]));
  const sw_early = await call("POST", "api", { act: "swotAnalysis", id: sw_sid, area: "micro", placeWord: "Mobile" }, NORAN);
  check("an analysis is refused, in words, until the lines of the list are done", sw_early.st === 400 && /to-do list/.test(sw_early.j && sw_early.j.why), sw_early.st + " " + JSON.stringify(sw_early.j));
  const sw_fin0 = await call("POST", "api", { act: "swotFinish", id: sw_sid, placeWord: "Mobile" }, NORAN);
  check("saving is refused until there is a draft and the analyses are agreed", sw_fin0.st === 400 && /Draft the SWOT/.test(sw_fin0.j && sw_fin0.j.why), sw_fin0.st + " " + JSON.stringify(sw_fin0.j));
  const sw_nsaved = (await asTenant(A, (c) => c.query("SELECT count(*)::int n FROM copilot_deliverables WHERE title LIKE 'SWOT%'"))).rows[0].n;
  check("...and nothing was written", sw_nsaved === 0, sw_nsaved + "");

  const sw_add = await call("POST", "api", { act: "addSource", place: "mobile", kind: "report", name: "market.txt", text: "Competitors cut prices.",
    chatId: sw_sid, area: "micro", method: "report", placeWord: "Mobile" }, NORAN);
  const sw_srcId = sw_add.j && sw_add.j.source && sw_add.j.source.id;
  check("a pasted ready report is kept on the client's shelf and ticks its line", sw_add.st === 200 && !!sw_srcId && sw_add.j.swotDone === 1, sw_add.st + " " + JSON.stringify(sw_add.j).slice(0, 200));
  const sw_shelf = await call("GET", "sources", null, OMAR, "?place=mobile");
  const sw_row = sw_shelf.j && sw_shelf.j.sources.find((x) => x.id === sw_srcId);
  check("another of the office sees it on the shelf, with no delete offered", !!sw_row && sw_row.mayDelete === false, JSON.stringify(sw_row));
  check("...and its delete is refused on the server too", (await call("POST", "api", { act: "deleteSource", sourceId: sw_srcId }, OMAR)).st === 403);
  const sw_shelfI = await call("GET", "sources", null, ISLAM, "?place=mobile");
  check("the Super user is offered the delete", !!sw_shelfI.j.sources.find((x) => x.id === sw_srcId && x.mayDelete));
  check("a source added for this unit shows on another unit's shelf only when retagged to all units",
    !(await call("GET", "sources", null, NORAN, "?place=retail")).j.sources.some((x) => x.id === sw_srcId) &&
    (await call("POST", "api", { act: "retagSource", sourceId: sw_srcId, place: "all" }, NORAN)).st === 200 &&
    (await call("GET", "sources", null, NORAN, "?place=retail")).j.sources.some((x) => x.id === sw_srcId));
  check("whoever added it deletes it", (await call("POST", "api", { act: "deleteSource", sourceId: sw_srcId }, NORAN)).st === 200 &&
    !(await call("GET", "sources", null, NORAN, "?place=mobile")).j.sources.some((x) => x.id === sw_srcId));

  /* ══ §4 · the catalogue ═══════════════════════════════════════ */
  section("§4 · every table is the tenant's, fenced like the tracker's");
  const T = ["copilot_chats", "copilot_messages", "copilot_deliverables", "copilot_versions", "copilot_files", "copilot_sources"];
  const rls = await owner("SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = $1 AND relname = ANY($2)", [SCHEMA, T]);
  check("all six tables exist, RLS on and FORCED", rls.length === 6 && rls.every((x) => x.relrowsecurity && x.relforcerowsecurity), JSON.stringify(rls));
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
