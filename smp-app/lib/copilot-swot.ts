/* ══ THE SWOT FLOW (§480, the signed-off
   design-mockups/copilot-swot-flow/2026-10-04_v2.html) ═══════════════════
   Islam: "proceed". A SWOT chat starts from the place's SWOT or from nothing,
   asks which METHODS feed each of the three areas — internal (strengths and
   weaknesses), micro (competition, Porter's five forces) and macro (market,
   DESTEP) — and turns the answer into a to-do list that stays on screen.
   When the lines are done, the micro and macro analyses are written and
   agreed, then the SWOT is drafted, checked and saved.

   THE QUESTIONS ARE THE OLD COPILOT'S, WORD FOR WORD (Islam: never invent
   them), and live here once: the tab draws what the server sends with the
   chat, so the questions asked and the questions drafted from cannot drift
   (§53.5). The micro and macro definitions are the "Help me understand".

   WHERE THE FLOW STANDS IS ON THE CHAT (`extra.swot`, no migration), the
   flow-file's own shape (lib/copilot-flow.ts). What the PRODUCT decides — which
   sources are linked, when a prompt was downloaded, the check, that it was
   saved — is never taken from the page (§42, §96.2). The to-do list and the
   per-letter count are WORKED OUT on every read, never stored, so they can
   never disagree with what is linked (§53.5). */
import { oneLine, MAX_TITLE, newDeliverable, addVersion, type Section } from "./copilot.ts";

type Q = { query: (text: string, values?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }> };
const str = (v: unknown) => (v == null ? "" : String(v));

export const AREAS = ["internal", "micro", "macro"] as const;
export type Area = (typeof AREAS)[number];
export const METHODS = ["guided", "template", "report", "research"] as const;
export type Method = (typeof METHODS)[number];
export const isArea = (v: unknown): v is Area => (AREAS as readonly string[]).includes(String(v));
export const isMethod = (v: unknown): v is Method => (METHODS as readonly string[]).includes(String(v));
/* Internal has no deep research: it is about the organisation itself, which
   the organisation knows and the open web does not (the mockup's grid). */
export const OFFERED: Record<Area, Method[]> = {
  internal: ["guided", "template", "report"],
  micro: ["guided", "template", "report", "research"],
  macro: ["guided", "template", "report", "research"],
};
export const AREA_WORD: Record<Area, string> = { internal: "Internal", micro: "Micro · competition", macro: "Macro · market" };
export const METHOD_WORD: Record<Method, string> = { guided: "Guided questions", template: "Template", report: "Ready reports", research: "Deep research" };
/* The Copilot settings template each area downloads (lib/copilot-settings.ts). */
export const TEMPLATE_OF: Record<Area, string> = { internal: "t2", micro: "t3", macro: "t4" };
/* Which letters an area feeds: the original's own rule — strengths and
   weaknesses from the internal input, opportunities and threats from the
   micro and macro analyses. */
export const FEEDS: Record<Area, ("s" | "w" | "o" | "t")[]> = { internal: ["s", "w"], micro: ["o", "t"], macro: ["o", "t"] };

export type GuidedQ = { key: string; name: string; question: string; help: string };
export const QUESTIONS: Record<Area, GuidedQ[]> = {
  internal: [
    { key: "S1", name: "Customer-perceived strengths", question: "What do customers consistently praise about your organization? What keeps them coming back?", help: "Customer-perceived strengths" },
    { key: "S2", name: "Unique capabilities", question: "What unique resources, skills, or capabilities do you have that competitors lack?", help: "Unique capabilities" },
    { key: "S3", name: "Competitive advantage", question: "What do you do better than anyone else in your market? What's your \"unfair advantage\"?", help: "Competitive advantage" },
    { key: "S4", name: "Structural advantages", question: "What advantages come from your history, relationships, location, or reputation?", help: "Structural advantages" },
    { key: "W1", name: "Customer-perceived gaps", question: "What do customers complain about or wish you did better?", help: "Customer-perceived gaps" },
    { key: "W2", name: "Capability gaps", question: "What resources or capabilities are you lacking compared to competitors?", help: "Capability gaps" },
    { key: "W3", name: "Operational weaknesses", question: "What internal processes cause the most friction, delays, or frustration?", help: "Operational weaknesses" },
    { key: "W4", name: "Competitive vulnerabilities", question: "Where do you typically lose deals or customers, and why?", help: "Competitive vulnerabilities" },
    { key: "O1", name: "Market trends", question: "What market trends or changes could benefit your organization in the next 2-3 years?", help: "Market trends" },
    { key: "O2", name: "Unmet needs", question: "What unmet customer needs have you noticed that you could potentially address?", help: "Unmet needs" },
    { key: "O3", name: "Competitor gaps", question: "What weaknesses do your competitors have that you could exploit?", help: "Competitor gaps" },
    { key: "O4", name: "External enablers", question: "What new technologies, partnerships, or regulatory changes could create opportunities for you?", help: "External enablers" },
    { key: "T1", name: "Competitive threats", question: "What are competitors doing that concerns you most?", help: "Competitive threats" },
    { key: "T2", name: "Market risks", question: "What market or industry changes could negatively impact your business?", help: "Market risks" },
    { key: "T3", name: "Internal risks", question: "Which of your weaknesses could become critical if left unaddressed?", help: "Internal risks" },
    { key: "T4", name: "External disruptions", question: "What economic, regulatory, or technological shifts could disrupt your business model?", help: "External disruptions" },
  ],
  micro: [
    { key: "rivalry", name: "Competitive Rivalry", question: "Tell me about your main competitors. How many direct competitors do you have, and how intense is the competition for market share?",
      help: "The intensity of competition among existing firms in the industry. High rivalry reduces profit potential as firms compete on price, marketing, and innovation." },
    { key: "entrants", name: "Threat of New Entrants", question: "Are there any new companies trying to enter your market? What barriers exist that would prevent new competitors from entering?",
      help: "The likelihood of new competitors entering the market. Low barriers to entry increase this threat, potentially reducing profit margins for all players." },
    { key: "substitutes", name: "Threat of Substitutes", question: "What alternatives do customers have to your product or service? Are there any substitutes that could satisfy the same need?",
      help: "The availability of alternative products or services that satisfy the same customer need. High substitute threat limits pricing power." },
    { key: "suppliers", name: "Supplier Power", question: "How dependent are you on your suppliers? Do you have many suppliers to choose from, or are there just a few who have significant power over pricing and terms?",
      help: "The bargaining power suppliers have over the industry. Powerful suppliers can squeeze profitability by raising prices or reducing quality." },
    { key: "buyers", name: "Buyer Power", question: "How much power do your customers have in negotiations? Can they easily switch to competitors, or do they have limited options?",
      help: "The bargaining power customers have over the industry. Powerful buyers can demand lower prices, better quality, or more services." },
  ],
  macro: [
    { key: "demographic", name: "Demographic", question: "What demographic trends are affecting your industry? Consider population changes, age distribution, migration patterns, or education levels in your target markets.",
      help: "Population-related factors that affect market size, composition, and characteristics. These shape demand patterns and workforce availability." },
    { key: "economic", name: "Economic", question: "What economic conditions are impacting your business? Think about economic growth, inflation rates, employment levels, or consumer spending patterns in your markets.",
      help: "Economic conditions that affect purchasing power, business costs, and market dynamics. These directly impact revenue potential and operational costs." },
    { key: "social", name: "Social", question: "What social and cultural trends are you observing? Consider changes in lifestyle, consumer values, health consciousness, or social attitudes that might affect demand for your products or services.",
      help: "Social and cultural factors that influence consumer behavior, preferences, and societal expectations. These shape demand for products and services." },
    { key: "technological", name: "Technological", question: "How is technology changing your industry? Are there new technologies, digital transformation trends, or automation developments that could disrupt or enable your business?",
      help: "Technology developments that create opportunities or threats through innovation, disruption, or efficiency improvements." },
    { key: "environmental", name: "Environmental", question: "What environmental factors should you consider? Think about climate change impacts, sustainability regulations, or environmental awareness affecting your industry.",
      help: "Environmental and ecological factors including climate change, sustainability requirements, and resource availability." },
    { key: "political", name: "Political", question: "What political and regulatory factors are relevant? Consider government policies, trade regulations, tax changes, or political stability in your operating regions.",
      help: "Government policies, regulations, and political conditions that affect business operations, market access, and compliance requirements." },
  ],
};

export const PHASES = ["start", "methods", "gather", "analyses", "draft", "check", "saved"] as const;
export type Phase = (typeof PHASES)[number];
export const LETTERS = ["s", "w", "o", "t"] as const;
export type Letter = (typeof LETTERS)[number];
export const LETTER_WORD: Record<Letter, string> = { s: "Strengths", w: "Weaknesses", o: "Opportunities", t: "Threats" };

export type Item = { title: string; description: string; evidence: string };
export type Factor = Item;
export type Analysis = { items: { key: string; factors: Factor[]; from: string }[]; agreed: boolean };
export type Link = { area: Area; method: Method; sourceId: string; name: string; at: string };
export type Swot = {
  phase: Phase; start: string;
  fromPlan: Record<Letter, string[]>;
  methods: Record<Area, Method[]>;
  ans: Record<Area, string[]>;
  q: { area: Area; i: number };
  links: Link[];
  promptAt: { micro: string | null; macro: string | null };
  micro: Analysis | null; macro: Analysis | null;
  draft: Record<Letter, Item[]> | null;
  check: { agree: string[]; issues: { letter: string; text: string }[] } | null;
  saved: { deliverableId: string; n: number; title: string } | null;
};

export const MAX_ANSWER = 2000;
export const MAX_TEXT = 600;
export const MAX_ITEMS = 7;
export const MIN_ITEMS = 5;
export const MAX_FACTORS = 4;

const emptyLetters = (): Record<Letter, any[]> => ({ s: [], w: [], o: [], t: [] });
export function newSwot(fromPlan: Partial<Record<Letter, unknown>> | null): Swot {
  const plan = emptyLetters() as Record<Letter, string[]>;
  let has = false;
  if (fromPlan) for (const L of LETTERS) {
    plan[L] = (Array.isArray(fromPlan[L]) ? (fromPlan[L] as unknown[]) : []).map((x) => oneLine(x).slice(0, MAX_TEXT)).filter(Boolean).slice(0, 20);
    if (plan[L].length) has = true;
  }
  return {
    phase: has ? "start" : "methods", start: has ? "" : "fresh", fromPlan: plan,
    methods: { internal: [], micro: [], macro: [] },
    ans: { internal: QUESTIONS.internal.map(() => ""), micro: QUESTIONS.micro.map(() => ""), macro: QUESTIONS.macro.map(() => "") },
    q: { area: "internal", i: 0 }, links: [], promptAt: { micro: null, macro: null },
    micro: null, macro: null, draft: null, check: null, saved: null,
  };
}

const int = (v: unknown, lo: number, hi: number) => { const n = Number(v); return Number.isInteger(n) ? Math.min(hi, Math.max(lo, n)) : lo; };
const cleanItem = (x: any): Item => ({ title: oneLine(x && x.title).slice(0, 160), description: oneLine(x && x.description).slice(0, MAX_TEXT), evidence: oneLine(x && x.evidence).slice(0, MAX_TEXT) });
export function cleanAnalysis(area: "micro" | "macro", raw: any, keepFrom: Analysis | null): Analysis | null {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.items)) return null;
  const items = QUESTIONS[area].map((q) => {
    const got = raw.items.find((x: any) => x && x.key === q.key);
    const kept = keepFrom ? keepFrom.items.find((x) => x.key === q.key) : null;
    const factors = (got && Array.isArray(got.factors) ? got.factors : []).map(cleanItem).filter((f: Item) => f.title).slice(0, MAX_FACTORS);
    return { key: q.key, factors, from: kept ? kept.from : oneLine(got && got.from).slice(0, 300) };
  });
  return { items, agreed: !!raw.agreed && items.some((x) => x.factors.length) };
}
function cleanDraft(raw: any): Record<Letter, Item[]> | null {
  if (!raw || typeof raw !== "object") return null;
  const d = emptyLetters() as Record<Letter, Item[]>;
  for (const L of LETTERS) d[L] = (Array.isArray(raw[L]) ? raw[L] : []).map(cleanItem).filter((x: Item) => x.title).slice(0, MAX_ITEMS);
  return LETTERS.some((L) => d[L].length) ? d : null;
}

/* WHICH AREAS ARE IN THE RUN: those with a method ticked. */
export const areasOn = (s: Swot) => AREAS.filter((a) => s.methods[a].length);
export const externalOn = (s: Swot) => (["micro", "macro"] as const).filter((a) => s.methods[a].length);
export const analysesAgreed = (s: Swot) => externalOn(s).every((a) => !!(s[a] && s[a]!.agreed));

/* The page's flow, cut to shape. `links`, `promptAt`, `fromPlan`, `check`,
   `saved` and each analysis's `from` are the product's and are kept from
   what is stored. A phase the work does not reach yet is put back. */
export function sanitizeSwot(raw: unknown, stored: Swot): Swot {
  const j: any = raw && typeof raw === "object" ? raw : {};
  const s: Swot = { ...stored };
  if ((PHASES as readonly string[]).includes(j.phase)) s.phase = j.phase;
  if (j.start === "plan" || j.start === "fresh") s.start = j.start;
  if (j.methods && typeof j.methods === "object") {
    const m = { internal: [], micro: [], macro: [] } as Record<Area, Method[]>;
    for (const a of AREAS) m[a] = OFFERED[a].filter((x) => Array.isArray(j.methods[a]) && j.methods[a].includes(x));
    s.methods = m;
  }
  if (j.ans && typeof j.ans === "object") {
    const ans = { ...stored.ans };
    for (const a of AREAS) if (Array.isArray(j.ans[a])) ans[a] = QUESTIONS[a].map((_, k) => str(j.ans[a][k]).slice(0, MAX_ANSWER));
    s.ans = ans;
  }
  if (j.q && isArea(j.q.area)) s.q = { area: j.q.area, i: int(j.q.i, 0, QUESTIONS[j.q.area as Area].length - 1) };
  if ("micro" in j) s.micro = cleanAnalysis("micro", j.micro, stored.micro);
  if ("macro" in j) s.macro = cleanAnalysis("macro", j.macro, stored.macro);
  if ("draft" in j) s.draft = cleanDraft(j.draft);
  if (process.env.SMP_BREAK === "swot-trust-saved" && j.saved) s.saved = j.saved;
  return settle(s);
}
/* The phase follows the work, never ahead of it. */
function settle(s: Swot): Swot {
  if (s.phase === "start" && s.start) s.phase = "methods";
  if (s.phase !== "start" && s.phase !== "methods" && !areasOn(s).length) s.phase = "methods";
  if ((s.phase === "draft" || s.phase === "check") && !analysesAgreed(s)) s.phase = "analyses";
  if (s.phase === "check" && !s.draft) s.phase = "draft";
  if (s.phase === "saved" && !s.saved) s.phase = s.draft ? "check" : "draft";
  return s;
}
export function storedSwot(raw: unknown): Swot | null {
  if (!raw || typeof raw !== "object") return null;
  const j: any = raw;
  const s = newSwot(j.fromPlan || null);
  s.links = (Array.isArray(j.links) ? j.links : []).filter((x: any) => x && isArea(x.area) && isMethod(x.method) && str(x.sourceId))
    .map((x: any) => ({ area: x.area, method: x.method, sourceId: str(x.sourceId), name: oneLine(x.name).slice(0, 200), at: str(x.at) }));
  s.promptAt = { micro: j.promptAt && j.promptAt.micro ? str(j.promptAt.micro) : null, macro: j.promptAt && j.promptAt.macro ? str(j.promptAt.macro) : null };
  s.micro = cleanAnalysis("micro", j.micro, null);
  s.macro = cleanAnalysis("macro", j.macro, null);
  if (j.check && typeof j.check === "object") s.check = {
    agree: (Array.isArray(j.check.agree) ? j.check.agree : []).map((x: unknown) => oneLine(x).slice(0, 400)).filter(Boolean).slice(0, 8),
    issues: (Array.isArray(j.check.issues) ? j.check.issues : []).map((x: any) => ({ letter: str(x && x.letter), text: oneLine(x && x.text).slice(0, 400) })).filter((x: any) => x.text).slice(0, 8),
  };
  if (j.saved && typeof j.saved === "object" && j.saved.deliverableId) s.saved = { deliverableId: str(j.saved.deliverableId), n: Number(j.saved.n) || 0, title: oneLine(j.saved.title) };
  const fromPage = sanitizeSwot(j, s);
  /* sanitizeSwot keeps the analyses' `from`; on the stored row it is the
     stored text itself. */
  fromPage.micro = s.micro && fromPage.micro ? { ...fromPage.micro, items: fromPage.micro.items.map((x, k) => ({ ...x, from: s.micro!.items[k].from })) } : fromPage.micro;
  fromPage.macro = s.macro && fromPage.macro ? { ...fromPage.macro, items: fromPage.macro.items.map((x, k) => ({ ...x, from: s.macro!.items[k].from })) } : fromPage.macro;
  fromPage.check = s.check; fromPage.saved = s.saved;
  if (s.saved && j.phase === "saved") fromPage.phase = "saved";
  return fromPage;
}
export async function swotOf(c: Q, chatId: string): Promise<Swot | null> {
  const r = await c.query("SELECT extra->'swot' AS swot FROM copilot_chats WHERE id = $1", [chatId]);
  return r.rows[0] ? storedSwot(r.rows[0].swot) : null;
}
export async function writeSwot(c: Q, chatId: string, s: Swot): Promise<void> {
  await c.query("UPDATE copilot_chats SET extra = extra || jsonb_build_object('swot', $2::jsonb), last_at = now() WHERE id = $1",
    [chatId, JSON.stringify(s)]);
}

/* ── THE TO-DO LIST AND THE COUNT PER LETTER, WORKED OUT ─────────────── */
export type Todo = { area: Area | null; method: Method | "analyses" | "draft"; title: string; status: string; state: "done" | "wait" | "open" };
const answered = (s: Swot, a: Area) => s.ans[a].filter((x) => x.trim()).length;
const linksOf = (s: Swot, a: Area, m: Method) => s.links.filter((l) => l.area === a && l.method === m);
const day = (iso: string) => { const d = new Date(iso); return isNaN(+d) ? "" : d.toISOString().slice(0, 10); };
export function todoOf(s: Swot): Todo[] {
  const out: Todo[] = [];
  for (const a of AREAS) for (const m of s.methods[a]) {
    const ls = linksOf(s, a, m);
    if (m === "guided") {
      const n = answered(s, a), all = QUESTIONS[a].length;
      out.push({ area: a, method: m, title: METHOD_WORD[m], state: n === all ? "done" : "open", status: n === all ? all + " answered" : n + " of " + all + " answered" });
    } else if (m === "research") {
      const at = s.promptAt[a as "micro" | "macro"];
      out.push({ area: a, method: m, title: METHOD_WORD[m], state: ls.length ? "done" : at ? "wait" : "open",
        status: ls.length ? "Answer uploaded " + day(ls[ls.length - 1].at) : at ? "Prompt downloaded " + day(at) + " · waiting for the answer" : "Not started" });
    } else {
      out.push({ area: a, method: m, title: m === "template" ? "Interview template" : METHOD_WORD[m], state: ls.length ? "done" : "open",
        status: ls.length ? ls.map((l) => l.name).join(" · ") : m === "template" ? "Not uploaded yet" : "None picked yet" });
    }
  }
  if (externalOn(s).length) out.push({ area: null, method: "analyses", title: "Micro and macro analyses",
    state: analysesAgreed(s) ? "done" : "open", status: analysesAgreed(s) ? "Agreed" : "Ready once the lines above are done" });
  out.push({ area: null, method: "draft", title: "Draft the SWOT", state: s.saved ? "done" : "open", status: s.saved ? "Saved as " + s.saved.title + " v" + s.saved.n : "Then check and save" });
  return out;
}
export const doneCount = (t: Todo[]) => t.filter((x) => x.state === "done").length;
/* "What we have so far — Per letter": the sources feeding each letter. A set
   of guided answers with anything in it counts as one. */
export function coverageOf(s: Swot): Record<Letter, number> {
  const c: Record<Letter, Set<string>> = { s: new Set(), w: new Set(), o: new Set(), t: new Set() };
  for (const l of s.links) for (const L of FEEDS[l.area]) c[L].add(l.sourceId);
  for (const a of AREAS) if (s.methods[a].includes("guided") && answered(s, a)) for (const L of FEEDS[a]) c[L].add("guided:" + a);
  return { s: c.s.size, w: c.w.size, o: c.o.size, t: c.t.size };
}
/* Every gather line done — the analyses may be written. A line merely
   waiting on a deep-research answer is not done. */
export const gatherDone = (s: Swot) => todoOf(s).filter((t) => t.area).every((t) => t.state === "done");

/* ── WHAT THE MODEL READS ─────────────────────────────────────────────── */
export function guidedText(s: Swot, a: Area): string {
  return QUESTIONS[a].map((q, k) => s.ans[a][k].trim() ? q.name + "\nQ: " + q.question + "\nA: " + s.ans[a][k].trim() : "").filter(Boolean).join("\n\n");
}
export type Material = { name: string; kind: string; text: string; bytes: Buffer | null; fileKind: string | null };
const PER_SOURCE = 40_000;
export function swotCorpus(s: Swot, placeWord: string, context: string, areas: Area[], material: { area: Area; m: Material }[]): string {
  const out: string[] = ["PLACE: " + (placeWord || "this place")];
  out.push("\nTHE PLAN AS IT IS WRITTEN ON THE PLATFORM (context only — never evidence):\n" + (context.trim() || "Nothing yet."));
  if (s.start === "plan" && LETTERS.some((L) => s.fromPlan[L].length))
    out.push("\nTHE SWOT THE PLAN HOLDS TODAY:\n" + LETTERS.map((L) => LETTER_WORD[L] + ": " + (s.fromPlan[L].join("; ") || "none")).join("\n"));
  for (const a of areas) {
    const g = s.methods[a].includes("guided") ? guidedText(s, a) : "";
    if (g) out.push("\n" + AREA_WORD[a].toUpperCase() + " — GUIDED ANSWERS:\n" + g);
    for (const x of material.filter((y) => y.area === a))
      out.push("\n" + AREA_WORD[a].toUpperCase() + " — SOURCE \"" + x.m.name + "\":\n" + (x.m.fileKind === "pdf" ? "(the PDF is attached as itself)" : x.m.text.slice(0, PER_SOURCE)));
  }
  return out.join("\n");
}
export const pdfPartsOf = (material: { m: Material }[]) =>
  material.filter((x) => x.m.fileKind === "pdf" && x.m.bytes).map((x) => ({ inlineData: { mimeType: "application/pdf", data: x.m.bytes!.toString("base64") } }));

export function swotInstruction(method: string): string {
  return "You are Forefront Consulting's strategy consultant, building an organisation's situational analysis from what the client gave you." +
    "\nRULES: Use only the guided answers and the sources — never invent a figure, a name or a fact. The plan is context only, never evidence." +
    " Name the source each point comes from. Return JSON in the shape asked, with no preamble." +
    (method.trim() ? "\n\nFOREFRONT'S METHOD:\n" + method.trim() : "");
}
const ITEM = { type: "OBJECT", properties: { title: { type: "STRING" }, description: { type: "STRING" }, evidence: { type: "STRING" } }, required: ["title"] };
export const ANALYSIS_SCHEMA = (area: "micro" | "macro") => ({
  type: "OBJECT",
  properties: { items: { type: "ARRAY", items: { type: "OBJECT", properties: {
    key: { type: "STRING", enum: QUESTIONS[area].map((q) => q.key) }, factors: { type: "ARRAY", items: ITEM }, from: { type: "STRING" } }, required: ["key", "factors"] } } },
  required: ["items"],
});
export const DRAFT_SCHEMA = { type: "OBJECT", properties: { s: { type: "ARRAY", items: ITEM }, w: { type: "ARRAY", items: ITEM }, o: { type: "ARRAY", items: ITEM }, t: { type: "ARRAY", items: ITEM } }, required: ["s", "w", "o", "t"] };
export const CHECK_SCHEMA = {
  type: "OBJECT",
  properties: { agree: { type: "ARRAY", items: { type: "STRING" } },
    issues: { type: "ARRAY", items: { type: "OBJECT", properties: { letter: { type: "STRING", enum: [...LETTERS] }, text: { type: "STRING" } }, required: ["text"] } } },
};
export const ANSWER_SCHEMA = { type: "OBJECT", properties: { answer: { type: "STRING" }, used: { type: "ARRAY", items: { type: "STRING" } } }, required: ["answer"] };

export function analysisQuestion(area: "micro" | "macro"): string {
  return "Write the " + (area === "micro" ? "MICRO analysis (Porter's five forces)" : "MACRO analysis (DESTEP)") + " from the material." +
    " For each of these, give 2 to 4 factors, each with a short title, a one-sentence description and the evidence, and in `from` the names of the sources it came from:\n" +
    QUESTIONS[area].map((q) => "- " + q.key + ": " + q.name + " — " + q.help).join("\n") +
    "\nWhere the material says nothing about one, give no factors for it rather than inventing any.";
}
export function analysisText(s: Swot, area: "micro" | "macro"): string {
  const an = s[area];
  if (!an) return "";
  return QUESTIONS[area].map((q, k) => { const it = an.items[k];
    return it && it.factors.length ? q.name + ":\n" + it.factors.map((f) => "- " + f.title + (f.description ? ": " + f.description : "") + (f.evidence ? " [" + f.evidence + "]" : "")).join("\n") : ""; })
    .filter(Boolean).join("\n\n");
}
export function draftQuestion(s: Swot): string {
  const ext = externalOn(s).map((a) => "THE AGREED " + a.toUpperCase() + " ANALYSIS:\n" + analysisText(s, a)).join("\n\n");
  return "Draft the SWOT. Strengths and weaknesses come from the internal input; opportunities and threats from the micro and macro analyses." +
    " " + MIN_ITEMS + " to " + MAX_ITEMS + " items per letter where the material supports it — never pad. Each item: a short title, a one-sentence description, and the evidence." +
    (ext ? "\n\n" + ext : "");
}
export function checkQuestion(s: Swot): string {
  return "Check this SWOT. In `agree` say what holds together; in `issues` name what does not (an item in the wrong letter, a weakness that is really a threat, an item with no evidence, a duplicate), with its letter. At most three of each. Short sentences.\n\n" +
    LETTERS.map((L) => LETTER_WORD[L].toUpperCase() + ":\n" + (s.draft ? s.draft[L] : []).map((x) => "- " + x.title + ": " + x.description).join("\n")).join("\n\n");
}
export function answerForQuestion(area: Area, i: number): string {
  const q = QUESTIONS[area][i];
  return "Answer this question for the client from the material, in two or three sentences, in their own voice. Put in `used` the names of the sources you drew on. If the material does not answer it, say so in one sentence and leave `used` empty.\n\nQUESTION: " + q.question;
}

/* ── SAVING: THE SWOT AND BOTH ANALYSES AS DELIVERABLES ───────────────── */
export function swotText(s: Swot, placeWord: string): string {
  const out = ["SWOT — " + placeWord, ""];
  for (const L of LETTERS) { out.push(LETTER_WORD[L].toUpperCase()); (s.draft ? s.draft[L] : []).forEach((x, k) => out.push((k + 1) + ". " + x.title + (x.description ? " — " + x.description : "") + (x.evidence ? "\n   Evidence: " + x.evidence : ""))); out.push(""); }
  return out.join("\n").trim();
}
export const swotTitle = (word: string, placeWord: string) => (word + " — " + (oneLine(placeWord) || "this place")).slice(0, MAX_TITLE);
async function saveOne(c: Q, chat: { id: string; place: string; section: Section; title: string }, title: string, type: string, body: unknown, by: string) {
  const note = "Built in “" + chat.title + "”";
  const hit = await c.query("SELECT id FROM copilot_deliverables WHERE place = $1 AND section = $2 AND lower(title) = lower($3) ORDER BY created_at DESC LIMIT 1",
    [chat.place, chat.section, title]);
  if (hit.rows[0]) { const id = str(hit.rows[0].id); return { deliverableId: id, n: await addVersion(c as any, id, { body, note, by }), title }; }
  const id = await newDeliverable(c as any, { place: chat.place, section: chat.section, title, type, kind: "promotable",
    approach: "Guided SWOT", body, note, by, chatId: chat.id, chatTitle: chat.title });
  return { deliverableId: id, n: 1, title };
}
export async function saveSwot(c: Q, chat: { id: string; place: string; section: Section; title: string }, s: Swot, placeWord: string, by: string) {
  for (const a of externalOn(s)) await saveOne(c, chat, swotTitle(a === "micro" ? "Micro analysis" : "Macro analysis", placeWord), a, { text: analysisText(s, a), analysis: s[a] }, by);
  return saveOne(c, chat, swotTitle("SWOT", placeWord), "swot", { text: swotText(s, placeWord), swot: s.draft, before: s.fromPlan }, by);
}
export async function nextSwotVersion(c: Q, chat: { place: string; section: string }, placeWord: string): Promise<number> {
  const r = await c.query(
    "SELECT coalesce(max(v.n), 0) + 1 AS n FROM copilot_deliverables d LEFT JOIN copilot_versions v ON v.deliverable_id = d.id " +
    "WHERE d.place = $1 AND d.section = $2 AND lower(d.title) = lower($3)", [chat.place, chat.section, swotTitle("SWOT", placeWord)]);
  return Number(r.rows[0]?.n) || 1;
}
