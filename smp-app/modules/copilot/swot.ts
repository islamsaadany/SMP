/* ── THE SWOT CHAT AND THE SOURCES, ON THE SERVER (§480) ────────────────
   Split from index.ts so that file stays the Foundation's and the gate's.
   The same three rules hold here as there: every write is judged against
   the STORED row (§42); the model is asked with no transaction open (§289),
   between a read and a write against what is stored THEN; and a failure is
   said in words (§171). The rules themselves live in lib/copilot-swot.ts and
   lib/copilot-sources.ts — this file only carries them to the page. */
import { withTenant } from "../../lib/tenant.ts";
import { type Who, oneLine, isPlace, oneChat, newChat, MAX_TITLE, NO_KEY, failedLine } from "../../lib/copilot.ts";
import { kindOf, readFile, MAX_FILE_BYTES, REFUSE_KIND, REFUSE_SIZE } from "../../lib/copilot-files.ts";
import { askFlowJson, configured } from "../../lib/copilot-ask.ts";
import { partsOf } from "../../lib/copilot-settings.ts";
import { doorPool } from "../../lib/auth.ts";
import {
  AREAS, OFFERED, METHOD_WORD, AREA_WORD, TEMPLATE_OF, QUESTIONS, LETTERS, LETTER_WORD, MAX_ANSWER, isArea, isMethod,
  type Swot, type Area, newSwot, storedSwot, sanitizeSwot, swotOf, writeSwot, todoOf, doneCount, coverageOf, gatherDone, externalOn, analysesAgreed,
  swotCorpus, pdfPartsOf, swotInstruction, ANALYSIS_SCHEMA, DRAFT_SCHEMA, CHECK_SCHEMA, ANSWER_SCHEMA,
  analysisQuestion, draftQuestion, checkQuestion, answerForQuestion, cleanAnalysis, saveSwot, nextSwotVersion,
} from "../../lib/copilot-swot.ts";
import {
  isSourceKind, SOURCE_WORD, MAX_SOURCE_TEXT, sourcesFor, oneSource, addSource, retagSource, mayDeleteSource, deleteSource,
  sourceBytes, sourcesMaterial,
} from "../../lib/copilot-sources.ts";
import { generatePorterResearchPrompt, generateDestepResearchPrompt, type CompanyContext } from "../../lib/copilot-research.ts";

type Out = { status: number; body: Record<string, unknown> };
const out = (status: number, body: Record<string, unknown>): Out => ({ status, body });
const refused = (status: number, why: string): Out => out(status, { ok: false, why });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const brk = () => process.env.SMP_BREAK || "";
const MAX_CONTEXT = 24_000;
const ARCHIVED = "This chat is archived. Restore it to keep talking.";
const SAVED_ALREADY = "This SWOT is saved. Start a new SWOT chat to make the next version.";
const NOT_SWOT = "This is not a SWOT chat.";
const placeOf = (v: unknown) => (String(v) === "all" ? "all" : isPlace(v) ? String(v) : "");

/* What the chat GET adds for a SWOT chat: its state, and the to-do list and
   per-letter count WORKED OUT from it, plus the questions and the grid the
   page draws — so the page draws what the server will draft from (§53.5). */
export async function swotView(c: any, chat: { id: string; place: string; section: any }, pw: string) {
  const s = await swotOf(c, chat.id);
  if (!s) return {};
  const todo = todoOf(s);
  return { swot: s, swotTodo: todo, swotDone: doneCount(todo), swotCover: coverageOf(s), swotGatherDone: gatherDone(s),
    swotQuestions: QUESTIONS, swotOffered: OFFERED, swotMethodWord: METHOD_WORD, swotAreaWord: AREA_WORD, swotTemplateOf: TEMPLATE_OF,
    swotNextVersion: await nextSwotVersion(c, chat, pw || chat.place) };
}

/* The rail's "N of M done" for a SWOT chat, read with the list. */
export async function swotProgress(c: any, ids: string[]): Promise<Record<string, { done: number; of: number }>> {
  if (!ids.length) return {};
  const r = await c.query("SELECT id, extra->'swot' AS swot FROM copilot_chats WHERE id = ANY($1::uuid[]) AND extra ? 'swot'", [ids]);
  const m: Record<string, { done: number; of: number }> = {};
  for (const x of r.rows) { const s = storedSwot(x.swot); if (s) { const t = todoOf(s); m[String(x.id)] = { done: doneCount(t), of: t.length }; } }
  return m;
}

/* ── THE SOURCES SHELF ────────────────────────────────────────────────── */
export async function sourcesGet(tenantId: string, place: string, who: Who): Promise<Out> {
  const p = placeOf(place);
  if (!p) return refused(400, "Which place?");
  /* Each row says whether THIS person may delete it, asked of the same rule
     the delete asks (§61: a × the server refuses is not drawn). */
  return withTenant(tenantId, async (c) => out(200, { ok: true,
    sources: (await sourcesFor(c, p)).map((x) => ({ ...x, mayDelete: mayDeleteSource(x, who) })), words: SOURCE_WORD }));
}
export async function sourceFile(tenantId: string, id: string): Promise<Response | null> {
  if (!UUID.test(id)) return null;
  const f = await withTenant(tenantId, (c) => sourceBytes(c, id));
  if (!f) return null;
  const type = f.kind === "pdf" ? "application/pdf"
    : f.kind === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    : f.kind === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "text/plain; charset=utf-8";
  const bytes = f.bytes ? new Uint8Array(f.bytes) : new TextEncoder().encode(f.text);
  return new Response(bytes, { status: 200, headers: { "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
    "Content-Disposition": "attachment; filename*=UTF-8''" + encodeURIComponent(f.name + (f.bytes ? "" : f.name.endsWith(".txt") ? "" : ".txt")) } });
}

/* ── THE WRITES THAT NEED NO MODEL ────────────────────────────────────── */
export const SWOT_ACTS = ["newSwot", "swotSave", "swotLink", "swotUnlink", "swotPrompt", "swotFinish", "addSource", "deleteSource", "retagSource"];
export const SWOT_ASKS = ["swotAnswer", "swotAnalysis", "swotDraft", "swotCheck"];

export async function swotAct(c: any, b: any, who: Who): Promise<Out> {
  const kind = String(b.act || "");
  const by = who.personKey || "";

  if (kind === "newSwot") {
    const place = String(b.place || "");
    if (!isPlace(place)) return refused(400, "Which place?");
    const chat = await newChat(c, { place, section: "analysis", title: oneLine(b.title).slice(0, MAX_TITLE) || "SWOT", by });
    /* The plan's SWOT as the page has it only decides the opening question
       and is kept as "before" on the saved deliverable — nothing is decided
       by it (§478's shape). */
    const s = newSwot(b.fromPlan && typeof b.fromPlan === "object" ? b.fromPlan : null);
    await writeSwot(c, chat.id, s);
    return out(200, { ok: true, chat: { ...chat, swot: true }, swot: s });
  }

  if (kind === "addSource") return addSourceAct(c, b, by);
  if (kind === "deleteSource" || kind === "retagSource") {
    const id = String(b.sourceId || "");
    if (!UUID.test(id)) return refused(400, "Which source?");
    const s = await oneSource(c, id);
    if (!s) return refused(404, "That source is not here any more.");
    if (kind === "retagSource") {
      const p = placeOf(b.place);
      if (!p) return refused(400, "Which place?");
      await retagSource(c, id, p);
      return out(200, { ok: true });
    }
    if (!mayDeleteSource(s, who)) return refused(403, "Only whoever added a source, or the Super user, can delete it.");
    await deleteSource(c, id);
    return out(200, { ok: true });
  }

  const id = String(b.id || "");
  if (!UUID.test(id)) return refused(400, "Which chat?");
  const chat = await oneChat(c, id);
  if (!chat) return refused(404, "That chat is not here any more.");
  if (chat.archived) return refused(400, ARCHIVED);
  const stored = await swotOf(c, id);
  if (!stored) return refused(400, NOT_SWOT);
  if (stored.saved && brk() !== "swot-reopen") return refused(400, SAVED_ALREADY);

  if (kind === "swotSave") {
    const s = sanitizeSwot(b.swot, stored);
    await writeSwot(c, id, s);
    return out(200, { ok: true, ...(await swotView(c, chat, oneLine(b.placeWord))) });
  }

  if (kind === "swotLink" || kind === "swotUnlink") {
    const area = b.area, method = b.method;
    if (!isArea(area) || !isMethod(method) || !OFFERED[area].includes(method) || method === "guided") return refused(400, "Which line of the to-do list?");
    const sid = String(b.sourceId || "");
    if (!UUID.test(sid)) return refused(400, "Which source?");
    let links = stored.links;
    if (kind === "swotUnlink") links = links.filter((l) => !(l.area === area && l.method === method && l.sourceId === sid));
    else {
      const src = await oneSource(c, sid);
      if (!src) return refused(404, "That source is not here any more.");
      if (src.place !== "all" && src.place !== chat.place) return refused(400, "That source belongs to another unit.");
      if (!links.some((l) => l.area === area && l.method === method && l.sourceId === sid))
        links = [...links, { area, method, sourceId: sid, name: src.name, at: new Date().toISOString() }];
    }
    const s: Swot = { ...stored, links };
    await writeSwot(c, id, s);
    return out(200, { ok: true, ...(await swotView(c, chat, oneLine(b.placeWord))) });
  }

  if (kind === "swotPrompt") {
    /* The deep-research prompt is the original Copilot's, word for word
       (lib/copilot-research.ts); the time it was taken is the PRODUCT's to
       stamp, so the to-do line can say it is waiting for the answer. */
    const area = b.area;
    if (area !== "micro" && area !== "macro") return refused(400, "Deep research is for the micro or the macro analysis.");
    if (!stored.methods[area as Area].includes("research")) return refused(400, "Tick Deep research for this area first.");
    const x = b.company && typeof b.company === "object" ? b.company : {};
    const ctx: CompanyContext = { companyName: oneLine(x.companyName).slice(0, 200) || "the company", industry: oneLine(x.industry).slice(0, 200),
      whoWeAre: String(x.whoWeAre ?? "").slice(0, 4000), purpose: String(x.purpose ?? "").slice(0, 2000),
      winningAspiration: String(x.winningAspiration ?? "").slice(0, 2000), northStar: String(x.northStar ?? "").slice(0, 2000),
      region: oneLine(x.region).slice(0, 200) || undefined };
    const text = area === "micro" ? generatePorterResearchPrompt(ctx) : generateDestepResearchPrompt(ctx);
    const s: Swot = { ...stored, promptAt: { ...stored.promptAt, [area]: new Date().toISOString() } };
    await writeSwot(c, id, s);
    const pw = oneLine(b.placeWord) || chat.place;
    return out(200, { ok: true, text, name: (area === "micro" ? "Porter research prompt - " : "DESTEP research prompt - ") + pw.replace(/[\\/:*?"<>|]/g, " ") + ".txt",
      ...(await swotView(c, chat, pw)) });
  }

  if (kind === "swotFinish") {
    /* Saved only when there is a draft and every analysis in the run is
       agreed, asked of the STORED state (§42), never of the page. */
    if (!(stored.draft && analysesAgreed(stored)) && brk() !== "swot-finish-any") return refused(400, "Draft the SWOT and agree the analyses before saving.");
    const placeWord = oneLine(b.placeWord).slice(0, 120) || chat.place;
    const r = await saveSwot(c, chat, stored, placeWord, by);
    const s: Swot = { ...stored, phase: "saved", saved: { deliverableId: r.deliverableId, n: r.n, title: r.title } };
    await writeSwot(c, id, s);
    return out(200, { ok: true, saved: s.saved, ...(await swotView(c, chat, placeWord)) });
  }
  return refused(400, "Not something the Copilot does.");
}

/* A SOURCE ARRIVES: a file, or text pasted (a deep-research answer is often
   pasted). It may be linked to a line of a SWOT chat's to-do list in the
   same press; the link is judged as `swotLink` is. */
async function addSourceAct(c: any, b: any, by: string): Promise<Out> {
  const place = placeOf(b.place);
  if (!place) return refused(400, "Which place?");
  const kind = b.kind;
  if (!isSourceKind(kind) || kind === "guided") return refused(400, "Which kind of source?");
  let name = oneLine(b.name).slice(0, 200), fileKind: string | null = null, bytes: Buffer | null = null, text = "";
  if (b.data) {
    const fk = kindOf(name, String(b.type || ""));
    if (!name || !fk) return refused(400, REFUSE_KIND);
    const data = String(b.data);
    if (data.length > Math.ceil(MAX_FILE_BYTES / 3) * 4 + 8) return refused(400, REFUSE_SIZE);
    bytes = Buffer.from(data, "base64");
    if (!bytes.length) return refused(400, "That file is empty.");
    if (bytes.length > MAX_FILE_BYTES) return refused(400, REFUSE_SIZE);
    const read = readFile(fk, bytes);
    if (!read.ok) return refused(400, read.why);
    fileKind = fk; text = read.text;
  } else {
    text = String(b.text ?? "");
    if (!text.trim()) return refused(400, "Attach a file or paste the text.");
    if (text.length > MAX_SOURCE_TEXT) return refused(400, "That is longer than about thirty pages, so it was not kept. Send it in parts.");
    if (!name) name = SOURCE_WORD[kind] + " — " + new Date().toISOString().slice(0, 10);
  }
  const src = await addSource(c, { place, kind, name, fileKind, size: bytes ? bytes.length : Buffer.byteLength(text), bytes, text, by });
  let view = {};
  const chatId = String(b.chatId || "");
  if (UUID.test(chatId)) {
    const chat = await oneChat(c, chatId);
    const stored = chat && !chat.archived ? await swotOf(c, chatId) : null;
    if (chat && stored && !stored.saved && isArea(b.area) && isMethod(b.method) && b.method !== "guided" && OFFERED[b.area as Area].includes(b.method)
      && (place === "all" || place === chat.place)) {
      const s: Swot = { ...stored, links: [...stored.links, { area: b.area, method: b.method, sourceId: src.id, name: src.name, at: new Date().toISOString() }] };
      await writeSwot(c, chatId, s);
      view = await swotView(c, chat, oneLine(b.placeWord));
    }
  }
  return out(200, { ok: true, source: src, ...view });
}

/* ── THE FOUR ASKS ─────────────────────────────────────────────────────
   Answer one guided question for the client, write one analysis, draft the
   SWOT, check it. Read, ask, write — three steps, no transaction across the
   model (§289). */
const partText = async (keys: string[]) => {
  if (!configured() || brk() === "no-method") return "";
  try { return (await partsOf(doorPool())).filter((p) => keys.includes(p.key) && p.text.trim()).map((p) => "## " + p.title + "\n\n" + p.text.trim()).join("\n\n"); }
  catch { return ""; }
};

export async function swotAsk(tenantId: string, b: any, who: Who): Promise<Out> {
  const id = String(b.id || "");
  if (!UUID.test(id)) return refused(400, "Which chat?");
  const kind = String(b.act);
  const placeWord = oneLine(b.placeWord).slice(0, 120);
  const context = String(b.context ?? "").slice(0, MAX_CONTEXT);
  const area = b.area;
  if (kind === "swotAnswer" && !(isArea(area) && Number.isInteger(Number(b.i)) && Number(b.i) >= 0 && Number(b.i) < QUESTIONS[area as Area].length))
    return refused(400, "Which question?");
  if (kind === "swotAnalysis" && area !== "micro" && area !== "macro") return refused(400, "Which analysis?");

  const step1 = await withTenant(tenantId, async (c) => {
    const chat = await oneChat(c, id);
    if (!chat) return refused(404, "That chat is not here any more.");
    if (chat.archived) return refused(400, ARCHIVED);
    const stored = await swotOf(c, id);
    if (!stored) return refused(400, NOT_SWOT);
    if (stored.saved) return refused(400, SAVED_ALREADY);
    const s = b.swot ? sanitizeSwot(b.swot, stored) : stored;
    if (kind === "swotAnalysis" && !s.methods[area as Area].length) return refused(400, "Tick a method for this area first.");
    if (kind === "swotAnalysis" && !gatherDone(s) && brk() !== "swot-any-gather") return refused(400, "Finish the lines of the to-do list first.");
    if (kind === "swotDraft" && !analysesAgreed(s)) return refused(400, "Agree the micro and macro analyses first.");
    if (kind === "swotCheck" && !s.draft) return refused(400, "There is no draft to check yet.");
    if (b.swot) await writeSwot(c, id, s);
    const areas: Area[] = kind === "swotAnswer" || kind === "swotAnalysis" ? [area as Area] : kind === "swotDraft" ? AREAS.filter((a) => s.methods[a].length) : [];
    const want = s.links.filter((l) => areas.includes(l.area));
    const mats = await sourcesMaterial(c, [...new Set(want.map((l) => l.sourceId))]);
    const material = want.map((l) => ({ area: l.area, m: mats.find((m) => m.id === l.sourceId)! })).filter((x) => x.m);
    return { chat, s, areas, material };
  });
  if ("status" in step1) return step1;
  const { chat, s, areas, material } = step1;

  const method = await partText(kind === "swotAnalysis" ? [area === "micro" ? "part3" : "part4"] : ["part2"]);
  const question = kind === "swotAnswer" ? answerForQuestion(area, Number(b.i))
    : kind === "swotAnalysis" ? analysisQuestion(area) : kind === "swotDraft" ? draftQuestion(s) : checkQuestion(s);
  const schema = kind === "swotAnswer" ? ANSWER_SCHEMA : kind === "swotAnalysis" ? ANALYSIS_SCHEMA(area) : kind === "swotDraft" ? DRAFT_SCHEMA : CHECK_SCHEMA;
  const r = await askFlowJson({ instruction: swotInstruction(method), corpus: swotCorpus(s, placeWord || chat.place, context, areas, material),
    corpusName: "THIS SWOT'S MATERIAL", parts: pdfPartsOf(material), question, schema, maxOutput: kind === "swotAnswer" ? 1024 : 8192 });
  if (!r.ok) {
    if (!(r as any).noKey) console.error("copilot: swot ask:", r.why);
    return refused(503, (r as any).noKey ? NO_KEY : failedLine(r.why));
  }
  const j = r.json || {};
  if (kind === "swotAnswer") {
    /* An answer for the client is a SUGGESTION in the box, never stored by
       the ask: the person keeps it, edits it or throws it away, and the
       ordinary save stores whatever they keep. */
    const answer = String(j.answer ?? "").trim().slice(0, MAX_ANSWER);
    if (!answer) return refused(503, failedLine("the answer had nothing in it"));
    const used = (Array.isArray(j.used) ? j.used : []).map((x: unknown) => oneLine(x).slice(0, 200)).filter(Boolean).slice(0, 6);
    return out(200, { ok: true, answer, used });
  }
  return withTenant(tenantId, async (c) => {
    const now = await swotOf(c, id);
    if (!now || now.saved) return refused(400, SAVED_ALREADY);
    let g: Swot;
    if (kind === "swotAnalysis") {
      const an = cleanAnalysis(area, { items: j.items }, null);
      if (!an || !an.items.some((x) => x.factors.length)) return refused(503, failedLine("the answer had nothing in it"));
      g = { ...now, phase: "analyses", [area]: { ...an, agreed: false } } as Swot;
    } else if (kind === "swotDraft") {
      const d = sanitizeSwot({ draft: j }, now).draft;
      if (!d) return refused(503, failedLine("the answer had nothing in it"));
      g = { ...now, phase: "draft", draft: d, check: null };
    } else {
      const agree = (Array.isArray(j.agree) ? j.agree : []).map((x: unknown) => oneLine(x).slice(0, 400)).filter(Boolean).slice(0, 8);
      const issues = (Array.isArray(j.issues) ? j.issues : []).map((x: any) => ({ letter: (LETTERS as readonly string[]).includes(String(x && x.letter)) ? String(x.letter) : "", text: oneLine(x && x.text).slice(0, 400) }))
        .filter((x: any) => x.text).slice(0, 8);
      if (!agree.length && !issues.length) return refused(503, failedLine("the answer had nothing in it"));
      g = { ...now, phase: "check", check: { agree, issues } };
    }
    await writeSwot(c, id, g);
    return out(200, { ok: true, ...(await swotView(c, chat, placeWord)) });
  });
}
export { LETTER_WORD, externalOn };
