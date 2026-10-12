/* ══ HOW WE COMPETE, IN THE COPILOT (spec 064 §3.2–§3.5, §493; the signed-off
   design-mockups/copilot-directions-flow/2026-10-05_directions-flow-v2.html,
   panel B) ═══════════════════════════════════════════════════════════════
   Islam: "start the build". A How-we-compete chat scores the three value
   disciplines against ten market factors and ten internal factors, lets the
   person change any score, recommends the discipline the MARKET rewards, then
   suggests five values, the person ticks the closest, refines them in the
   chat, and saves the table into the plan.

   THE FACTORS AND THE RULE ARE THE OLD COPILOT'S, WORD FOR WORD (Forefront's
   method, part 6 — smp-app/assets/copilot/instructions-source.md), and live
   here once: the page draws the factors the server sends with the chat, so
   the factors scored and the factors drawn cannot drift (§53.5).

   ONE SCORING FUNCTION (§94.8): `resultOf` is asked by the view the page
   draws and by the check; the browser never adds a score up itself. Every
   score the person changes is a save, and the answer carries the result.

   WHERE THE CHAT STANDS rides `extra.compete` on the chat (no migration),
   the SWOT flow's own shape (lib/copilot-swot.ts). What the PRODUCT decides
   — that it was saved — is never taken from the page (§42, §96.2). The
   to-do list is WORKED OUT on every read, never stored. */
import { oneLine, MAX_TITLE, newDeliverable, addVersion, type Section } from "./copilot.ts";

type Q = { query: (text: string, values?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }> };
const str = (v: unknown) => (v == null ? "" : String(v));

export const DISCS = ["btc", "bts", "bp"] as const;
export type Disc = (typeof DISCS)[number];
export const isDisc = (v: unknown): v is Disc => (DISCS as readonly string[]).includes(String(v));
export const DISC_WORD: Record<Disc, string> = { btc: "Best Total Cost", bts: "Best Total Solution", bp: "Best Product" };
export const DISC_SUB: Record<Disc, string> = { btc: "Operational excellence", bts: "Customer intimacy", bp: "Product leadership" };

export type Factor = { id: string; name: string; description: string };
export const MARKET: Factor[] = [
  { id: "market_growth", name: "Market Growth Rate", description: "How fast is the market growing and what drives growth?" },
  { id: "competition", name: "Competition Dynamics / Customer Selection", description: "How intense is competition and on what basis do firms compete?" },
  { id: "customer_behavior", name: "Customer Behavior", description: "How do customers make decisions and what influences them?" },
  { id: "tech_change", name: "Technological Change", description: "How rapidly is technology evolving in this market?" },
  { id: "regulatory", name: "Regulatory Environment", description: "What regulatory factors impact the market?" },
  { id: "supply_chain", name: "Supply Chain Complexity", description: "How complex are supply chain requirements?" },
  { id: "product_lifecycle", name: "Industry Products Life Cycle", description: "Where is the industry in its lifecycle?" },
  { id: "customer_need", name: "Customer Need", description: "What are the primary needs customers seek to fulfill?" },
  { id: "product_mix", name: "Market Product Mix Requirement", description: "What product/service mix does the market demand?" },
  { id: "switching_costs", name: "Switching Costs / Customer Lock-in", description: "How easy is it for customers to switch providers?" },
];
export const INTERNAL: Factor[] = [
  { id: "operations", name: "Operational Efficiency", description: "How efficient are internal operations and processes?" },
  { id: "innovation", name: "Innovation Capacity", description: "How strong is the ability to innovate and develop new offerings?" },
  { id: "offerings", name: "Product/Service Offerings", description: "How competitive are current products/services?" },
  { id: "workforce", name: "Workforce Skill Area", description: "What are the core skills and capabilities of the workforce?" },
  { id: "brand", name: "Brand Positioning", description: "How is the brand perceived in the market?" },
  { id: "risk", name: "Approach to Risk", description: "How does the organization approach risk-taking?" },
  { id: "culture", name: "Culture Driver", description: "What drives organizational culture and behavior?" },
  { id: "processes", name: "Core Processes", description: "What are the most important operational processes?" },
  { id: "structure", name: "Organization Structure", description: "How is the organization structured to deliver value?" },
  { id: "systems", name: "Management Systems", description: "What management systems guide decision-making?" },
];
export const SIDES = { market: MARKET, internal: INTERNAL } as const;
export type Side = keyof typeof SIDES;
export type Score = Record<Disc, number>;
export type Scores = Record<string, Score>;

/* ── THE ONE SCORING FUNCTION ────────────────────────────────────────────
   0, 1 or 2 per factor per discipline; each side totals out of 20 and reads
   as a per-cent. The gap between first and second decides how clear it is:
   over 25 points Clear, 10 or more Leaning, otherwise Unclear. A tie breaks
   btc, then bts, then bp (the method's own order). */
export type Result = { total: Score; pct: Score; leader: Disc; second: Disc; gap: number; clarity: "clear" | "leaning" | "unclear"; complete: boolean };
export function resultOf(side: Side, s: Scores | null): Result {
  const fs = SIDES[side];
  const total: Score = { btc: 0, bts: 0, bp: 0 };
  let complete = !!s;
  for (const f of fs) {
    const row = s && s[f.id];
    if (!row) { complete = false; continue; }
    for (const d of DISCS) total[d] += row[d];
  }
  const max = fs.length * 2;
  const pct: Score = { btc: 0, bts: 0, bp: 0 };
  for (const d of DISCS) pct[d] = Math.round((total[d] / max) * 100);
  /* Ordered by per-cent, and a tie keeps the method's own order: a stable
     sort over DISCS does exactly that. */
  const order = [...DISCS].sort((a, b) => pct[b] - pct[a]);
  if (process.env.SMP_BREAK === "compete-tie-last") order.sort((a, b) => pct[b] - pct[a] || DISCS.indexOf(b) - DISCS.indexOf(a));
  const gap = pct[order[0]] - pct[order[1]];
  const clarity = gap > 25 ? "clear" : gap >= 10 ? "leaning" : "unclear";
  return { total, pct, leader: order[0], second: order[1], gap, clarity, complete };
}
export const CLARITY_WORD = { clear: "Clear", leaning: "Leaning", unclear: "Unclear" } as const;

/* ── THE CHAT'S STATE ─────────────────────────────────────────────────── */
export const PHASES = ["score", "discipline", "values", "table", "saved"] as const;
export type Phase = (typeof PHASES)[number];
export type Value = { title: string; how: string[]; measure: string[] };
export type Compete = {
  phase: Phase;
  market: Scores | null; internal: Scores | null;
  edited: string[];                 // "market:market_growth:btc" — drawn as an edited pill
  chosen: Disc | "";
  suggested: Value[]; picked: number[];
  table: { discipline: Disc; values: Value[] } | null;
  alts: string[];                   // alternative titles the last refine offered, as quick replies
  reply: string;                    // what the last refine said
  saved: { deliverableId: string; n: number; title: string } | null;
};
export const MAX_VALUES = 5;
export const MAX_BULLETS = 5;
export const MAX_TEXT = 300;

export const newCompete = (): Compete => ({ phase: "score", market: null, internal: null, edited: [], chosen: "", suggested: [], picked: [], table: null, alts: [], reply: "", saved: null });

const cleanScore = (raw: any): Score | null => {
  if (!raw || typeof raw !== "object") return null;
  const s = {} as Score;
  for (const d of DISCS) { const n = Number(raw[d]); if (!(n === 0 || n === 1 || n === 2)) return null; s[d] = n; }
  return s;
};
export function cleanScores(side: Side, raw: any): Scores | null {
  if (!raw || typeof raw !== "object") return null;
  const out: Scores = {};
  for (const f of SIDES[side]) { const s = cleanScore(raw[f.id]); if (s) out[f.id] = s; }
  return Object.keys(out).length ? out : null;
}
const lines = (v: unknown) => (Array.isArray(v) ? v : []).map((x) => oneLine(x).slice(0, MAX_TEXT)).filter(Boolean).slice(0, MAX_BULLETS);
export const cleanValue = (x: any): Value => ({ title: oneLine(x && x.title).slice(0, 160), how: lines(x && x.how), measure: lines(x && x.measure) });
const cleanValues = (v: unknown, max: number) => (Array.isArray(v) ? v : []).map(cleanValue).filter((x) => x.title).slice(0, max);

/* The page's flow, cut to shape. `saved` is the product's and is kept. A
   phase the work does not reach yet is put back. */
export function sanitizeCompete(raw: unknown, stored: Compete): Compete {
  const j: any = raw && typeof raw === "object" ? raw : {};
  const s: Compete = { ...stored };
  if ((PHASES as readonly string[]).includes(j.phase)) s.phase = j.phase;
  if ("market" in j) s.market = cleanScores("market", j.market);
  if ("internal" in j) s.internal = cleanScores("internal", j.internal);
  if (Array.isArray(j.edited)) s.edited = j.edited.map(str).filter((x: string) => /^(market|internal):[a-z_]+:(btc|bts|bp)$/.test(x)).slice(0, 60);
  if ("chosen" in j) s.chosen = isDisc(j.chosen) ? j.chosen : "";
  if ("suggested" in j) s.suggested = cleanValues(j.suggested, MAX_VALUES + 3);
  if (Array.isArray(j.picked)) s.picked = [...new Set(j.picked.map(Number).filter((n: number) => Number.isInteger(n) && n >= 0 && n < s.suggested.length))].sort((a: any, b: any) => a - b) as number[];
  if ("table" in j) {
    const t = j.table && typeof j.table === "object" ? j.table : null;
    const values = t ? cleanValues(t.values, 8) : [];
    s.table = t && isDisc(t.discipline) && values.length ? { discipline: t.discipline, values } : null;
  }
  if (process.env.SMP_BREAK === "compete-trust-saved" && j.saved) s.saved = j.saved;
  return settle(s);
}
/* The phase follows the work, never ahead of it. */
function settle(s: Compete): Compete {
  const scored = resultOf("market", s.market).complete;
  if (s.phase !== "score" && !scored) s.phase = "score";
  if ((s.phase === "values" || s.phase === "table") && !s.chosen) s.phase = "discipline";
  if (s.phase === "table" && !s.table) s.phase = "values";
  if (s.phase === "saved" && !s.saved) s.phase = s.table ? "table" : "values";
  return s;
}
export function storedCompete(raw: unknown): Compete | null {
  if (!raw || typeof raw !== "object") return null;
  const j: any = raw;
  const base = newCompete();
  if (j.saved && typeof j.saved === "object" && j.saved.deliverableId) base.saved = { deliverableId: str(j.saved.deliverableId), n: Number(j.saved.n) || 0, title: oneLine(j.saved.title) };
  base.alts = (Array.isArray(j.alts) ? j.alts : []).map((x: unknown) => oneLine(x).slice(0, 160)).filter(Boolean).slice(0, 4);
  base.reply = String(j.reply ?? "").slice(0, 1200);
  const s = sanitizeCompete(j, base);
  if (base.saved && j.phase === "saved") s.phase = "saved";
  return s;
}
export async function competeOf(c: Q, chatId: string): Promise<Compete | null> {
  const r = await c.query("SELECT extra->'compete' AS compete FROM copilot_chats WHERE id = $1", [chatId]);
  return r.rows[0] ? storedCompete(r.rows[0].compete) : null;
}
export async function writeCompete(c: Q, chatId: string, s: Compete): Promise<void> {
  await c.query("UPDATE copilot_chats SET extra = extra || jsonb_build_object('compete', $2::jsonb), last_at = now() WHERE id = $1",
    [chatId, JSON.stringify(s)]);
}

/* ── THE TO-DO LIST, WORKED OUT (spec §3.5) ──────────────────────────── */
export type Todo = { key: string; title: string; status: string; state: "done" | "open" };
export function todoOf(s: Compete): Todo[] {
  const m = resultOf("market", s.market);
  const scored = m.complete && resultOf("internal", s.internal).complete;
  return [
    { key: "score", title: "Score the disciplines", state: scored ? "done" : "open", status: scored ? DISC_WORD[m.leader] + " leads the market" : "20 factors, 3 disciplines" },
    { key: "discipline", title: "Choose the discipline", state: s.chosen ? "done" : "open", status: s.chosen ? DISC_WORD[s.chosen] : "Not chosen yet" },
    { key: "values", title: "Pick the values", state: s.table ? "done" : "open", status: s.table ? s.table.values.length + " values" : s.suggested.length ? s.picked.length + " ticked" : "Not suggested yet" },
    { key: "table", title: "Refine and check the table", state: s.saved ? "done" : "open", status: s.saved ? "Checked" : s.table ? "On the table now" : "After the values" },
    { key: "save", title: "Save", state: s.saved ? "done" : "open", status: s.saved ? "Saved as " + s.saved.title + " v" + s.saved.n : "Into Competitive Discipline" },
  ];
}
export const doneCount = (t: Todo[]) => t.filter((x) => x.state === "done").length;

/* ── WHAT THE MODEL READS AND RETURNS ────────────────────────────────── */
export function competeInstruction(method: string): string {
  return "You are Forefront Consulting's strategy consultant, choosing how an organisation competes with the Value Disciplines framework (Treacy and Wiersema)." +
    "\nRULES: Use the SWOT, the Foundation and the plan as evidence; never invent a figure, a name or a fact. Return JSON in the shape asked, with no preamble." +
    (method.trim() ? "\n\nFOREFRONT'S METHOD:\n" + method.trim() : "");
}
const SCORE = { type: "OBJECT", properties: { btc: { type: "INTEGER" }, bts: { type: "INTEGER" }, bp: { type: "INTEGER" } }, required: ["btc", "bts", "bp"] };
const sideSchema = (fs: Factor[]) => ({ type: "OBJECT", properties: Object.fromEntries(fs.map((f) => [f.id, SCORE])), required: fs.map((f) => f.id) });
export const SCORE_SCHEMA = { type: "OBJECT", properties: { market: sideSchema(MARKET), internal: sideSchema(INTERNAL) }, required: ["market", "internal"] };
const VALUE = { type: "OBJECT", properties: { title: { type: "STRING" }, how: { type: "ARRAY", items: { type: "STRING" } }, measure: { type: "ARRAY", items: { type: "STRING" } } }, required: ["title", "how", "measure"] };
export const VALUES_SCHEMA = { type: "OBJECT", properties: { values: { type: "ARRAY", items: VALUE } }, required: ["values"] };
export const REFINE_SCHEMA = { type: "OBJECT", properties: { reply: { type: "STRING" }, values: { type: "ARRAY", items: VALUE }, alternatives: { type: "ARRAY", items: { type: "STRING" } } }, required: ["reply", "values"] };

const factorLines = (fs: Factor[]) => fs.map((f) => "- " + f.id + ": " + f.name + " — " + f.description).join("\n");
export function scoreQuestion(): string {
  return "Score every factor below for EACH of the three value disciplines — btc (Best Total Cost), bts (Best Total Solution), bp (Best Product) — independently: " +
    "2 = strong match, 1 = partial match, 0 = not relevant. At least one discipline should score 2 for each factor.\n\nMARKET FACTORS (what the market rewards):\n" +
    factorLines(MARKET) + "\n\nINTERNAL FACTORS (what the organisation is built for):\n" + factorLines(INTERNAL);
}
export function valuesQuestion(d: Disc): string {
  return "The organisation leads with " + DISC_WORD[d] + " (" + DISC_SUB[d] + "). Suggest exactly 5 value-proposition values it could stand on." +
    " Each: a title of 2 to 4 words; `how` — about 3 short bullets saying how the value is delivered; `measure` — 1 to 3 measures, each with a target where the material allows one." +
    " Ground each in the SWOT. Never pad.";
}
export function tableText(t: Compete["table"]): string {
  if (!t) return "";
  return "DISCIPLINE: " + DISC_WORD[t.discipline] + "\n" + t.values.map((v, k) => (k + 1) + ". " + v.title + "\n   How: " + v.how.join("; ") + "\n   Measure: " + v.measure.join("; ")).join("\n");
}
export function refineQuestion(t: Compete["table"], ask: string): string {
  return "Here is the value-proposition table as it stands:\n\n" + tableText(t) +
    "\n\nThe client asks: " + ask +
    "\n\nDo what they ask and nothing else; return the whole table in `values`, in the same order, with every value they did not ask about unchanged." +
    " If they asked for another title, put 2 or 3 alternatives in `alternatives` and keep the current title in `values`." +
    " In `reply` say in one or two sentences what you changed.";
}

/* ── SAVING: THE TABLE AS A DELIVERABLE ──────────────────────────────── */
export const competeTitle = (placeWord: string) => ("Competitive Discipline — " + (oneLine(placeWord) || "this place")).slice(0, MAX_TITLE);
export async function saveCompete(c: Q, chat: { id: string; place: string; section: Section; title: string }, s: Compete, placeWord: string, by: string) {
  const title = competeTitle(placeWord);
  const body = { text: tableText(s.table), compete: s.table, scores: { market: s.market, internal: s.internal } };
  const note = "Built in “" + chat.title + "”";
  const hit = await c.query("SELECT id FROM copilot_deliverables WHERE place = $1 AND section = $2 AND lower(title) = lower($3) ORDER BY created_at DESC LIMIT 1",
    [chat.place, chat.section, title]);
  if (hit.rows[0]) { const id = str(hit.rows[0].id); return { deliverableId: id, n: await addVersion(c as any, id, { body, note, by }), title }; }
  const id = await newDeliverable(c as any, { place: chat.place, section: chat.section, title, type: "compete", kind: "promotable",
    approach: "Value disciplines", body, note, by, chatId: chat.id, chatTitle: chat.title });
  return { deliverableId: id, n: 1, title };
}
