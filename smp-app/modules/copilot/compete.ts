/* ── THE HOW-WE-COMPETE CHAT, ON THE SERVER (spec 064 §3.2–§3.5, §493) ──
   The SWOT chat's own shape (modules/copilot/swot.ts): every write is judged
   against the STORED row (§42); the model is asked with no transaction open
   (§289); a failure is said in words (§171). The rules live in
   lib/copilot-compete.ts — this file only carries them to the page. */
import { withTenant } from "../../lib/tenant.ts";
import { type Who, oneLine, isPlace, oneChat, newChat, MAX_TITLE, NO_KEY, failedLine } from "../../lib/copilot.ts";
import { askFlowJson, configured } from "../../lib/copilot-ask.ts";
import { partsOf } from "../../lib/copilot-settings.ts";
import { doorPool } from "../../lib/auth.ts";
import {
  DISCS, DISC_WORD, DISC_SUB, MARKET, INTERNAL, CLARITY_WORD, MAX_VALUES, isDisc, resultOf, cleanScores, cleanValue,
  type Compete, newCompete, sanitizeCompete, storedCompete, competeOf, writeCompete, todoOf, doneCount,
  competeInstruction, SCORE_SCHEMA, VALUES_SCHEMA, REFINE_SCHEMA, scoreQuestion, valuesQuestion, refineQuestion, saveCompete,
} from "../../lib/copilot-compete.ts";

type Out = { status: number; body: Record<string, unknown> };
const out = (status: number, body: Record<string, unknown>): Out => ({ status, body });
const refused = (status: number, why: string): Out => out(status, { ok: false, why });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const brk = () => process.env.SMP_BREAK || "";
const MAX_CONTEXT = 24_000;
const ARCHIVED = "This chat is archived. Restore it to keep talking.";
const SAVED_ALREADY = "This is saved. Start a new How we compete chat to make the next version.";
const NOT_COMPETE = "This is not a How we compete chat.";

/* What the chat GET adds: the state, the to-do list and the RESULTS worked
   out by the one scoring function — the page never adds a score up (§94.8). */
export async function competeView(c: any, chat: { id: string }) {
  const s = await competeOf(c, chat.id);
  if (!s) return {};
  const todo = todoOf(s);
  const market = resultOf("market", s.market), internal = resultOf("internal", s.internal);
  return { compete: s, competeTodo: todo, competeDone: doneCount(todo),
    competeFactors: { market: MARKET, internal: INTERNAL },
    competeResult: { market, internal, recommended: market.complete ? market.leader : "", aligned: market.complete && internal.complete && market.leader === internal.leader },
    competeWords: { disc: DISC_WORD, sub: DISC_SUB, clarity: CLARITY_WORD, discs: DISCS } };
}

export async function competeProgress(c: any, ids: string[]): Promise<Record<string, { done: number; of: number }>> {
  if (!ids.length) return {};
  const r = await c.query("SELECT id, extra->'compete' AS compete FROM copilot_chats WHERE id = ANY($1::uuid[]) AND extra ? 'compete'", [ids]);
  const m: Record<string, { done: number; of: number }> = {};
  for (const x of r.rows) { const s = storedCompete(x.compete); if (s) { const t = todoOf(s); m[String(x.id)] = { done: doneCount(t), of: t.length }; } }
  return m;
}

export const COMPETE_ACTS = ["newCompete", "competeSave", "competeFinish"];
export const COMPETE_ASKS = ["competeScore", "competeValues", "competeRefine"];

export async function competeAct(c: any, b: any, who: Who): Promise<Out> {
  const kind = String(b.act || "");
  const by = who.personKey || "";
  if (kind === "newCompete") {
    const place = String(b.place || "");
    if (!isPlace(place)) return refused(400, "Which place?");
    const chat = await newChat(c, { place, section: "compete", title: oneLine(b.title).slice(0, MAX_TITLE) || "How we compete", by });
    const s = newCompete();
    await writeCompete(c, chat.id, s);
    return out(200, { ok: true, chat: { ...chat, compete: true }, ...(await competeView(c, chat)) });
  }
  const id = String(b.id || "");
  if (!UUID.test(id)) return refused(400, "Which chat?");
  const chat = await oneChat(c, id);
  if (!chat) return refused(404, "That chat is not here any more.");
  if (chat.archived) return refused(400, ARCHIVED);
  const stored = await competeOf(c, id);
  if (!stored) return refused(400, NOT_COMPETE);
  if (stored.saved) return refused(400, SAVED_ALREADY);

  if (kind === "competeSave") {
    await writeCompete(c, id, sanitizeCompete(b.compete, stored));
    return out(200, { ok: true, ...(await competeView(c, chat)) });
  }
  if (kind === "competeFinish") {
    /* Saved only when the STORED chat holds a table (§42), never the page. */
    if (!stored.table && brk() !== "compete-finish-any") return refused(400, "Pick the values and check the table before saving.");
    const placeWord = oneLine(b.placeWord).slice(0, 120) || chat.place;
    const r = await saveCompete(c, chat, stored, placeWord, by);
    const s: Compete = { ...stored, phase: "saved", saved: { deliverableId: r.deliverableId, n: r.n, title: r.title } };
    await writeCompete(c, id, s);
    return out(200, { ok: true, saved: s.saved, ...(await competeView(c, chat)) });
  }
  return refused(400, "Not something the Copilot does.");
}

const partText = async (keys: string[]) => {
  if (!configured() || brk() === "no-method") return "";
  try { return (await partsOf(doorPool())).filter((p) => keys.includes(p.key) && p.text.trim()).map((p) => "## " + p.title + "\n\n" + p.text.trim()).join("\n\n"); }
  catch { return ""; }
};

/* Score the disciplines, suggest the values, refine the table. Read, ask,
   write — no transaction across the model (§289). */
export async function competeAsk(tenantId: string, b: any, _who: Who): Promise<Out> {
  const id = String(b.id || "");
  if (!UUID.test(id)) return refused(400, "Which chat?");
  const kind = String(b.act);
  const placeWord = oneLine(b.placeWord).slice(0, 120);
  const context = String(b.context ?? "").slice(0, MAX_CONTEXT);
  const ask = oneLine(b.ask).slice(0, 1000);
  if (kind === "competeRefine" && !ask) return refused(400, "Say what to change.");

  const step1 = await withTenant(tenantId, async (c) => {
    const chat = await oneChat(c, id);
    if (!chat) return refused(404, "That chat is not here any more.");
    if (chat.archived) return refused(400, ARCHIVED);
    const stored = await competeOf(c, id);
    if (!stored) return refused(400, NOT_COMPETE);
    if (stored.saved) return refused(400, SAVED_ALREADY);
    const s = b.compete ? sanitizeCompete(b.compete, stored) : stored;
    if (kind === "competeValues" && !s.chosen) return refused(400, "Choose the discipline first.");
    if (kind === "competeRefine" && !s.table) return refused(400, "There is no table to refine yet.");
    if (b.compete) await writeCompete(c, id, s);
    return { chat, s };
  });
  if ("status" in step1) return step1;
  const { chat, s } = step1;

  const method = await partText(["part6"]);
  const question = kind === "competeScore" ? scoreQuestion() : kind === "competeValues" ? valuesQuestion(s.chosen as any) : refineQuestion(s.table, ask);
  const schema = kind === "competeScore" ? SCORE_SCHEMA : kind === "competeValues" ? VALUES_SCHEMA : REFINE_SCHEMA;
  const r = await askFlowJson({ instruction: competeInstruction(method),
    corpus: "PLACE: " + (placeWord || chat.place) + "\n\n" + context, corpusName: "THE PLAN AS IT STANDS", parts: [],
    question, schema, maxOutput: 8192 });
  if (!r.ok) {
    if (!(r as any).noKey) console.error("copilot: compete ask:", r.why);
    return refused(503, (r as any).noKey ? NO_KEY : failedLine(r.why));
  }
  const j: any = r.json || {};
  return withTenant(tenantId, async (c) => {
    const now = await competeOf(c, id);
    if (!now || now.saved) return refused(400, SAVED_ALREADY);
    let g: Compete;
    if (kind === "competeScore") {
      const market = cleanScores("market", j.market), internal = cleanScores("internal", j.internal);
      if (!market || !resultOf("market", market).complete) return refused(503, failedLine("the scores were incomplete"));
      g = sanitizeCompete({ market, internal, edited: [], phase: "discipline", chosen: "" }, now);
    } else if (kind === "competeValues") {
      const vals = (Array.isArray(j.values) ? j.values : []).map(cleanValue).filter((v: any) => v.title).slice(0, MAX_VALUES);
      if (!vals.length) return refused(503, failedLine("the answer had nothing in it"));
      g = sanitizeCompete({ suggested: vals, picked: [], phase: "values", table: null }, now);
    } else {
      const vals = (Array.isArray(j.values) ? j.values : []).map(cleanValue).filter((v: any) => v.title);
      if (!vals.length || !now.table) return refused(503, failedLine("the answer had nothing in it"));
      g = sanitizeCompete({ table: { discipline: now.table.discipline, values: vals }, phase: "table" }, now);
      g.alts = (Array.isArray(j.alternatives) ? j.alternatives : []).map((x: unknown) => oneLine(x).slice(0, 160)).filter(Boolean).slice(0, 4);
      g.reply = String(j.reply ?? "").trim().slice(0, 1200);
    }
    if (kind !== "competeRefine") { g.alts = []; g.reply = ""; }
    await writeCompete(c, id, g);
    return out(200, { ok: true, ...(await competeView(c, chat)) });
  });
}
export { isDisc };
