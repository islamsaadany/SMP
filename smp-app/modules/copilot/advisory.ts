/* ── THE ADVISORY CHAT, ON THE SERVER (spec 064 decisions-v0.4 §6, §496) ──
   The How-we-compete chat's own shape (modules/copilot/compete.ts): every
   write is judged against the STORED row (§42); the model is asked with no
   transaction open (§289); a failure is said in words (§171). The rules —
   the count, the brief check, the save — live in lib/copilot-advisory.ts;
   this file only carries them to the page. The page never sends the state:
   it names what the person did. */
import { withTenant } from "../../lib/tenant.ts";
import { type Who, oneLine, isPlace, oneChat, newChat, MAX_TITLE, NO_KEY, failedLine } from "../../lib/copilot.ts";
import { askFlowJson, configured } from "../../lib/copilot-ask.ts";
import { methodFor } from "../../lib/copilot-settings.ts";
import { doorPool } from "../../lib/auth.ts";
import { sourcesFor, sourcesMaterial } from "../../lib/copilot-sources.ts";
import {
  type Advisory, newAdvisory, storedAdvisory, advisoryOf, writeAdvisory, applyReply, todoOf, doneCount, countView, briefOwed, pending,
  advisoryInstruction, TURN_SCHEMA, BRIEF_SCHEMA, REVISE_SCHEMA, turnQuestion, briefQuestion, reviseQuestion, takeTurn, cleanBrief, saveAdvisory,
  ASSUME_WORDS, PROCEED_WORDS, CLASH_WORDS, SOURCE_TAG, MAX_ASK,
} from "../../lib/copilot-advisory.ts";

type Out = { status: number; body: Record<string, unknown> };
const out = (status: number, body: Record<string, unknown>): Out => ({ status, body });
const refused = (status: number, why: string): Out => out(status, { ok: false, why });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const brk = () => process.env.SMP_BREAK || "";
const MAX_CONTEXT = 24_000;
const MAX_FILES_TEXT = 40_000;
const ARCHIVED = "This chat is archived. Restore it to keep talking.";
const SAVED_ALREADY = "This is saved. Start a new Advisory chat for the next question.";
const NOT_ADVISORY = "This is not an Advisory chat.";

/* What the chat GET adds: the state, the to-do list, the COUNT worked out by
   the server (the pips and the rule cannot disagree, §53.5), the words of the
   two standing replies, and the names of the files the Copilot can read. */
export async function advisoryView(c: any, chat: { id: string; place: string }) {
  const s = await advisoryOf(c, chat.id);
  if (!s) return {};
  const todo = todoOf(s);
  const files = (await sourcesFor(c, chat.place)).map((x) => x.name);
  return { advisory: s, advisoryTodo: todo, advisoryDone: doneCount(todo), advisoryCount: countView(s), advisoryFiles: files,
    advisoryWords: { assume: ASSUME_WORDS, proceed: PROCEED_WORDS, clash: CLASH_WORDS, tags: SOURCE_TAG } };
}

export async function advisoryProgress(c: any, ids: string[]): Promise<Record<string, { done: number; of: number }>> {
  if (!ids.length) return {};
  const r = await c.query("SELECT id, extra->'advisory' AS advisory FROM copilot_chats WHERE id = ANY($1::uuid[]) AND extra ? 'advisory'", [ids]);
  const m: Record<string, { done: number; of: number }> = {};
  for (const x of r.rows) { const s = storedAdvisory(x.advisory); if (s) { const t = todoOf(s); m[String(x.id)] = { done: doneCount(t), of: t.length }; } }
  return m;
}

export const ADVISORY_ACTS = ["newAdvisory", "advisoryFinish"];
export const ADVISORY_ASKS = ["advisoryTurn", "advisoryRevise"];

export async function advisoryAct(c: any, b: any, who: Who): Promise<Out> {
  const kind = String(b.act || "");
  const by = who.personKey || "";
  if (kind === "newAdvisory") {
    const place = String(b.place || "");
    if (!isPlace(place)) return refused(400, "Which place?");
    const chat = await newChat(c, { place, section: "advisory", title: oneLine(b.title).slice(0, MAX_TITLE) || "Advisory", by });
    await writeAdvisory(c, chat.id, newAdvisory());
    return out(200, { ok: true, chat: { ...chat, advisory: true }, ...(await advisoryView(c, chat)) });
  }
  const id = String(b.id || "");
  if (!UUID.test(id)) return refused(400, "Which chat?");
  const chat = await oneChat(c, id);
  if (!chat) return refused(404, "That chat is not here any more.");
  if (chat.archived) return refused(400, ARCHIVED);
  const stored = await advisoryOf(c, id);
  if (!stored) return refused(400, NOT_ADVISORY);
  if (stored.saved) return refused(400, SAVED_ALREADY);
  if (kind === "advisoryFinish") {
    /* Saved only when the STORED chat holds a brief (§42), never the page. */
    if (!stored.brief) return refused(400, "There is no brief to save yet.");
    const r = await saveAdvisory(c, chat, stored, by);
    const s: Advisory = { ...stored, phase: "saved", saved: { deliverableId: r.deliverableId, n: r.n, title: r.title } };
    await writeAdvisory(c, id, s);
    return out(200, { ok: true, saved: s.saved, ...(await advisoryView(c, chat)) });
  }
  return refused(400, "Not something the Copilot does.");
}

/* The office's own Advisory method (Copilot settings), every part filed
   under that section — the same reader every other section asks. */
const methodText = async () => {
  if (!configured() || brk() === "no-method") return "";
  try { return await methodFor(doorPool(), "advisory"); } catch { return ""; }
};

/* One reply, then one turn of the model's. Read and write the reply, ask with
   no transaction open (§289), write the turn. */
export async function advisoryAsk(tenantId: string, b: any, _who: Who): Promise<Out> {
  const id = String(b.id || "");
  if (!UUID.test(id)) return refused(400, "Which chat?");
  const kind = String(b.act);
  const placeWord = oneLine(b.placeWord).slice(0, 120);
  const context = String(b.context ?? "").slice(0, MAX_CONTEXT);
  const ask = oneLine(b.ask).slice(0, 1000);
  if (kind === "advisoryRevise" && !ask) return refused(400, "Say what to change.");

  const step1 = await withTenant(tenantId, async (c) => {
    const chat = await oneChat(c, id);
    if (!chat) return refused(404, "That chat is not here any more.");
    if (chat.archived) return refused(400, ARCHIVED);
    const stored = await advisoryOf(c, id);
    if (!stored) return refused(400, NOT_ADVISORY);
    if (stored.saved) return refused(400, SAVED_ALREADY);
    let s = stored;
    if (kind === "advisoryRevise") {
      if (!s.brief) return refused(400, "There is no brief to change yet.");
    } else if (b.reply) {
      const g = applyReply(s, String(b.reply), String(b.words ?? "").slice(0, MAX_ASK));
      if (typeof g === "string") return refused(400, g);
      s = g;
      await writeAdvisory(c, id, s);
    }
    const files = (await sourcesFor(c, chat.place)).map((x) => x.id);
    const mats = kind === "advisoryRevise" ? [] : await sourcesMaterial(c, files);
    return { chat, s, mats };
  });
  if ("status" in step1) return step1;
  const { chat, s, mats } = step1;
  if (kind === "advisoryTurn") {
    if (!s.ask) return refused(400, "Say what you would like advice on.");
    if (s.brief) return out(200, { ok: true, ...(await withTenant(tenantId, (c) => advisoryView(c, chat))) });
    /* A question still waiting on an answer is not asked again. */
    if (pending(s) && !s.stopped) return out(200, { ok: true, ...(await withTenant(tenantId, (c) => advisoryView(c, chat))) });
  }

  let filesText = "";
  for (const m of mats) { if (m.text && filesText.length < MAX_FILES_TEXT) filesText += "\n\n### " + m.name + "\n" + m.text.slice(0, MAX_FILES_TEXT - filesText.length); }
  const parts = mats.filter((m) => m.bytes && m.fileKind === "pdf").slice(0, 3)
    .map((m) => ({ inlineData: { mimeType: "application/pdf", data: (m.bytes as Buffer).toString("base64") } }));
  const owed = briefOwed(s);
  const method = await methodText();
  const question = kind === "advisoryRevise" ? reviseQuestion(s, ask) : owed ? briefQuestion(s) : turnQuestion(s);
  const schema = kind === "advisoryRevise" ? REVISE_SCHEMA : owed ? BRIEF_SCHEMA : TURN_SCHEMA;
  const r = await askFlowJson({ instruction: advisoryInstruction(method),
    corpus: "PLACE: " + (placeWord || chat.place) + "\n\nTHE PLATFORM'S PLAN AND FIGURES:\n" + context + (filesText ? "\n\nFILES:" + filesText : ""),
    corpusName: "WHAT THE COPILOT CAN SEE", parts, question, schema, maxOutput: 8192 });
  if (!r.ok) {
    if (!(r as any).noKey) console.error("copilot: advisory ask:", r.why);
    return refused(503, (r as any).noKey ? NO_KEY : failedLine(r.why));
  }
  const j: any = r.json || {};
  return withTenant(tenantId, async (c) => {
    const now = await advisoryOf(c, id);
    if (!now || now.saved) return refused(400, SAVED_ALREADY);
    let g: Advisory;
    if (kind === "advisoryRevise") {
      const bf = cleanBrief(j.brief);
      if (!bf || !now.brief) return refused(503, failedLine("the brief came back incomplete"));
      g = { ...now, brief: bf, reply: oneLine(j.reply).slice(0, 1200) };
    } else {
      const t = takeTurn(now, j);
      if (typeof t === "string") return refused(503, failedLine(t));
      g = t;
    }
    await writeAdvisory(c, id, g);
    return out(200, { ok: true, ...(await advisoryView(c, chat)) });
  });
}
