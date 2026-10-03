/* ══ THE GUIDED FOUNDATION FLOW (§465, the signed-off
   design-mockups/copilot-foundation-flow/2026-10-02_working-flow.html) ═══
   Islam: "ok approved, build it". A Foundation chat can be a GUIDED one: the
   years first, then the way to build it, then the five parts in order —
   questions with examples, the answers back in boxes to correct, a draft,
   a refine, save and on to the next — then one check across all five and
   the whole thing saved as a version of "Foundation — <place>".

   THE QUESTIONS ARE THE OLD COPILOT'S, AND THEY LIVE HERE ONCE. The tab draws
   them from what the server sends with the chat, so the questions the screen
   asks and the questions the draft is written from cannot drift (§53.5).

   WHERE THE FLOW STANDS IS STORED ON THE CHAT, NOT AS MESSAGES: the chat's
   `extra.flow` (no migration — `copilot_chats.extra` is jsonb). The screen
   draws the conversation FROM it, so leaving and coming back lands exactly
   where you were, and the record is what was answered and drafted, which is
   what the deliverable is made of. Every write is CHECKED, never trusted as
   sent (§96.2): a phase outside the list, a year outside the plausible, an
   answer longer than any answer, a list of the wrong length — each is cut to
   shape or refused. What the product decides — that the Foundation was
   SAVED, and as which version — is never taken from the page at all. */
import { oneLine, MAX_TITLE, newDeliverable, addVersion, type Section } from "./copilot.ts";

type Q = { query: (text: string, values?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }> };
const str = (v: unknown) => (v == null ? "" : String(v));

export type FlowElement = { key: string; name: string; questions: string[]; examples: string[][] };
export const FLOW_ELEMENTS: FlowElement[] = [
  { key: "who", name: "Who We Are", questions: [
    "Let's start simple — what type of organization are you? Don't overthink it.",
    "What do you sell or provide? Just list your main products or services.",
    "Who buys from you? What industries or customer types?",
    "Where do you operate geographically?",
    "How do customers find and buy from you? What are your sales channels?",
    "How do you operate internally? What's your delivery model?",
    "What makes you different from competitors? Be specific.",
  ], examples: [
    ["An F&B retail company", "A logistics company", "A management consultancy"],
    ["Meals, desserts, and beverages", "Freight forwarding, warehousing, and last-mile delivery", "Strategy consulting and organizational design"],
    ["Urban consumers aged 18-45", "E-commerce, retail, and healthcare businesses", "Mid-size companies with 100-500 employees"],
    ["Cairo, Alexandria, and Giza", "Egypt and Saudi Arabia", "Across the UAE"],
    ["Dine-in restaurants, delivery apps, and takeaway counters", "Direct sales team and channel partners", "Referrals and RFP responses"],
    ["Central kitchens supplying all outlets with standardized recipes", "Own fleet with real-time tracking and warehouse network", "Project-based teams with senior partner oversight"],
    ["Consistent food quality through standardized central production", "Real-time visibility and faster delivery than competitors", "Deep sector expertise in healthcare and financial services"],
  ] },
  { key: "asp", name: "Winning Aspiration", questions: [
    "Close your eyes and imagine it's the end of {Y} — you've \"won.\" Paint me that picture. What does success look like?",
    "What specific achievements would make you say \"we made it\"? Give me something measurable.",
    "What's the bold, stretch goal that excites you but also scares you a little?",
    "By the end of {Y}, where do you want to stand compared to your competitors? What's your market position?",
  ], examples: [
    ["We're the go-to brand for quick, quality meals in every major city", "We've become the most trusted logistics partner in the MENA region", "Our clients see us as essential to their strategic success"],
    ["100 outlets across 5 countries with 90%+ customer satisfaction", "Processing 1M+ shipments annually with 99% on-time delivery", "50+ enterprise clients with 80% renewal rate"],
    ["Become a household name that people recommend to friends", "Disrupt the industry with tech that competitors try to copy", "Be invited to advise on national-level strategic initiatives"],
    ["The #1 choice for quality-conscious diners in our category", "The premier logistics partner that others benchmark against", "The strategic consultancy that top executives trust most"],
  ] },
  { key: "eim", name: "End in Mind", questions: [
    "Now look far past {Y} — past any plan. If everything goes right for decades, what does this organization become?",
    "What lasting mark do you want to leave on your market, your customers or your country — one with no finish date?",
    "Whatever products or markets change, what should still be true about you in twenty years?",
  ], examples: [
    ["The name every household trusts for everyday meals", "The backbone that moves the region's trade", "The partner leaders call before every big decision"],
    ["Raised the standard of service everyone in the industry is judged by", "Made reliable delivery normal in places that never had it", "Built a generation of local strategy talent"],
    ["We keep our promises to customers", "We stay the most dependable link in the chain", "Our advice is honest, even when it is unwelcome"],
  ] },
  { key: "pur", name: "Purpose", questions: [
    "Take me back to the beginning — why was this organization created? What problem sparked it all?",
    "Who benefits most from what you do? How are their lives or businesses better because of you?",
    "Here's a thought experiment: if your organization disappeared tomorrow, what would the world actually lose?",
    "When your team wakes up for work, what feeling do you want them to have about why they're coming in?",
  ], examples: [
    ["To make quality food accessible to everyday families", "To solve the inefficiencies in regional logistics", "To help businesses navigate digital transformation"],
    ["Busy professionals who get reliable, delicious meals without cooking", "Businesses that can now deliver products faster and more reliably", "Companies that become more competitive through better strategy"],
    ["A trusted source of comfort food that brings people together", "A logistics partner that truly understands local market needs", "Strategic thinking that helps businesses thrive, not just survive"],
    ["Proud to make someone's day better with every meal served", "Part of something that's transforming an entire industry", "That their ideas directly shape the future of our clients"],
  ] },
  { key: "obj", name: "Key Objectives", questions: [
    "Let's talk numbers. What financial metric would tell you the business is healthy and growing?",
    "What about your customers? What metric would show they love what you're doing?",
    "Operationally, what metric proves your engine is running smoothly?",
    "What about your team? What metric would show your people are thriving?",
    "If you could only look at ONE number to know if everything is working, what would it be?",
  ], examples: [
    ["Revenue growth of 25% year-over-year", "Gross margin above 40%", "Monthly recurring revenue of $1M+"],
    ["Customer retention rate above 85%", "Net Promoter Score (NPS) of 50+", "Monthly active users growing 10%+ monthly"],
    ["On-time delivery rate of 99%+", "Average fulfillment time under 24 hours", "Quality defect rate below 1%"],
    ["Employee engagement score above 80%", "Staff turnover below 15% annually", "Internal promotion rate of 30%+"],
    ["Number of happy repeat customers per month", "Total orders fulfilled with 5-star ratings", "Net revenue retention rate"],
  ] },
  { key: "val", name: "Core Values", questions: [
    "Think of your best team member — the one who perfectly embodies your culture. What 3 behaviors do they consistently show?",
    "What behavior is absolutely unacceptable here — even if the person delivers amazing results?",
    "Picture your team at its absolute best. What does that look like? How are people interacting?",
    "How do you want your people to treat customers — especially when things get tough?",
    "Last one! When someone asks your employees \"what's it like working there?\" what do you want them to say?",
  ], examples: [
    ["They admit mistakes quickly, help others without being asked, and share knowledge openly", "They challenge ideas respectfully, follow through on commitments, and celebrate others' wins", "They stay calm under pressure, find solutions not blame, and mentor junior colleagues"],
    ["Blaming others, hiding mistakes, or taking credit for someone else's work", "Being disrespectful to colleagues, cutting corners on quality, or lying to customers", "Hoarding information, undermining teammates, or ignoring safety protocols"],
    ["Ideas flow freely, debates are healthy, and decisions happen fast", "Everyone knows the goal, helps each other, and celebrates wins together", "People speak up, listen deeply, and build on each other's ideas"],
    ["We listen first, never make excuses, and always find a way to help", "We're honest about what we can deliver, proactive about problems, and generous with our time", "We treat every customer like our most important one, respond quickly, and follow up until it's resolved"],
    ["It's challenging but rewarding - you grow faster here than anywhere else", "The people are incredible - everyone genuinely wants each other to succeed", "You're trusted to do your best work, and your ideas actually matter"],
  ] },
];
const N = FLOW_ELEMENTS.length;

/* WHERE A FLOW STANDS (§473). `start` asks whether to begin from the
   Foundation the place already has or from nothing — drawn only where the
   place HAS one; `path` the way to build it, `year` the years (the guided
   road from nothing), `loaded` the cards filled from the plan with nobody
   working on one yet, `ask` one question of element `e`, `review` its answers
   back in boxes, `draft` its draft, `check` the look across every part,
   `saved` done. */
export const PHASES = ["start", "path", "year", "loaded", "ask", "review", "draft", "check", "saved"] as const;
export type Phase = (typeof PHASES)[number];
export const PATHS = ["guided", "notes", "template", "import"] as const;
export type Flow = {
  phase: Phase; start: string; y0: number | null; y1: number | null; path: string; e: number; qi: number;
  ans: string[][]; drafts: string[]; done: boolean[]; from: boolean[]; skip: string[];
  check: { agree: string[]; issues: { el: string; text: string }[] } | null;
  saved: { deliverableId: string; n: number; title: string } | null;
};
export const MAX_ANSWER = 2000;
export const MAX_DRAFT = 6000;
export const SHORT_ANSWER = 15;
/* §474 — WHAT IS ASKED FOLLOWS THE STRUCTURE, AND NOTHING IS "OPTIONAL"
   (Islam, of §473's Optional mark: *"yes for all proceed"* to: a part
   switched on in Client set-up › Structure is asked and owed like any other,
   a part switched off is left out of the chat entirely). Purpose and Core
   Values are the two a Structure can switch off for a Foundation; the page
   names which are off (`skip`), because the Structure is the client's graph
   and the page holds it. Nothing outside this list can be skipped, so a
   page cannot talk its way past the Aspiration. Reversing §473's
   OPTIONAL set, recorded as a reversal. */
export const SKIPPABLE = ["pur", "val"];
export function cleanSkip(v: unknown): string[] {
  return Array.isArray(v) ? SKIPPABLE.filter((k) => v.includes(k)) : [];
}
export const live = (f: Flow, i: number) => !f.skip.includes(FLOW_ELEMENTS[i].key);
export const STARTS = ["plan", "fresh"] as const;

/* A new flow opens on the start question only where the place already has a
   Foundation to start from; otherwise straight on the four roads. */
export function newFlow(hasPlan = false, skip: string[] = []): Flow {
  return { phase: hasPlan ? "start" : "path", start: "", y0: null, y1: null, path: "", e: 0, qi: 0,
    ans: FLOW_ELEMENTS.map((el) => el.questions.map(() => "")), drafts: FLOW_ELEMENTS.map(() => ""),
    done: FLOW_ELEMENTS.map(() => false), from: FLOW_ELEMENTS.map(() => false), skip: cleanSkip(skip), check: null, saved: null };
}
/* Every part the Structure asks for agreed WITH a draft (§474); a part
   switched off is not asked, so it waits for nothing. */
export function allAgreed(f: Flow): boolean {
  return FLOW_ELEMENTS.every((_, i) => !live(f, i) || (f.done[i] && !!f.drafts[i].trim()));
}
const year = (v: unknown) => { const n = Number(v); return Number.isInteger(n) && n >= 2000 && n <= 2100 ? n : null; };
const int = (v: unknown, lo: number, hi: number) => { const n = Number(v); return Number.isInteger(n) ? Math.min(hi, Math.max(lo, n)) : lo; };

/* The page's flow, cut to shape. `saved` and `check` are never taken from
   the page: they are kept from what is stored, because the product decides
   them. A flow whose years are not both set, or run backwards, cannot have
   left the `year` step. */
export function sanitizeFlow(raw: unknown, stored: Flow | null): Flow {
  const j: any = raw && typeof raw === "object" ? raw : {};
  const base = stored || newFlow();
  const f = newFlow();
  f.phase = (PHASES as readonly string[]).includes(j.phase) ? j.phase : base.phase;
  f.start = (STARTS as readonly string[]).includes(j.start) ? j.start : "";
  f.y0 = year(j.y0); f.y1 = year(j.y1);
  f.path = (PATHS as readonly string[]).includes(j.path) ? j.path : "";
  f.e = int(j.e, 0, N - 1);
  f.qi = int(j.qi, 0, FLOW_ELEMENTS[f.e].questions.length - 1);
  f.ans = FLOW_ELEMENTS.map((el, i) => el.questions.map((_, k) => str(Array.isArray(j.ans) && Array.isArray(j.ans[i]) ? j.ans[i][k] : "").slice(0, MAX_ANSWER)));
  f.drafts = FLOW_ELEMENTS.map((_, i) => str(Array.isArray(j.drafts) ? j.drafts[i] : "").slice(0, MAX_DRAFT));
  f.done = FLOW_ELEMENTS.map((_, i) => !!(Array.isArray(j.done) && j.done[i]) && !!f.drafts[i].trim());
  f.skip = Array.isArray(j.skip) ? cleanSkip(j.skip) : base.skip;
  f.from = FLOW_ELEMENTS.map((_, i) => !!(Array.isArray(j.from) && j.from[i]) && !!f.drafts[i].trim());
  f.check = base.check; f.saved = base.saved;
  if (process.env.SMP_BREAK === "flow-trust-saved" && j.saved) f.saved = j.saved;
  const yearsOk = f.y0 != null && f.y1 != null && f.y1 >= f.y0;
  if (f.phase === "start" && f.start) f.phase = f.start === "plan" ? "loaded" : "path";
  if (f.start === "plan") {
    /* STARTED FROM THE PLAN: the cards hold the plan's parts and the person
       works on one at a time. The years were never asked, so nothing waits
       on them; the road is the guided one. */
    f.path = "guided";
    if (f.phase === "start" || f.phase === "path" || f.phase === "year") f.phase = "loaded";
  } else {
    if (f.phase === "loaded") f.phase = "path";
    /* The page may not go BACK to the question once it has been answered. */
    if (f.phase === "start" && stored && stored.phase !== "start") f.phase = "path";
    /* The guided steps belong to the guided road; another road leaves the
       flow and goes on as an ordinary chat (the screen draws it so). */
    if (f.path !== "guided" && f.phase !== "start" && f.phase !== "path") f.phase = "path";
    else if (f.path === "guided" && !yearsOk && f.phase !== "start" && f.phase !== "path") f.phase = "year";
    else if (f.path === "guided" && yearsOk && f.phase === "year") f.phase = "ask";
  }
  if (f.phase === "saved" && !base.saved) f.phase = allAgreed(f) ? "check" : "draft";
  if (f.phase === "check" && !allAgreed(f)) f.phase = "draft";
  return f;
}
export function storedFlow(raw: unknown): Flow | null {
  if (!raw || typeof raw !== "object") return null;
  const f = sanitizeFlow(raw, null);
  const j: any = raw;
  if (j.check && typeof j.check === "object") f.check = {
    agree: (Array.isArray(j.check.agree) ? j.check.agree : []).map((x: unknown) => oneLine(x).slice(0, 400)).filter(Boolean).slice(0, 8),
    issues: (Array.isArray(j.check.issues) ? j.check.issues : []).map((x: any) => ({ el: str(x && x.el), text: oneLine(x && x.text).slice(0, 400) })).filter((x: any) => x.text).slice(0, 8),
  };
  if (j.saved && typeof j.saved === "object" && j.saved.deliverableId) {
    f.saved = { deliverableId: str(j.saved.deliverableId), n: Number(j.saved.n) || 0, title: oneLine(j.saved.title) };
    f.phase = j.phase === "saved" ? "saved" : f.phase;
  }
  return f;
}

export async function flowOf(c: Q, chatId: string): Promise<Flow | null> {
  const r = await c.query("SELECT extra->'flow' AS flow FROM copilot_chats WHERE id = $1", [chatId]);
  return r.rows[0] ? storedFlow(r.rows[0].flow) : null;
}
export async function writeFlow(c: Q, chatId: string, f: Flow): Promise<void> {
  await c.query("UPDATE copilot_chats SET extra = extra || jsonb_build_object('flow', $2::jsonb), last_at = now() WHERE id = $1",
    [chatId, JSON.stringify(f)]);
}

/* {Y} is the end year, where a question names it. */
export const withYear = (s: string, y1: number | null) => s.replace(/\{Y\}/g, y1 == null ? "the strategy" : String(y1));

/* ── THE THREE ASKS ───────────────────────────────────────────────────
   Small answers in small shapes: a draft is one text, a refine is one text,
   the check is what agrees and what does not. Each is told Forefront's own
   method for the Foundation (Copilot settings, §456) and what the plan
   already says, and is told not to invent a figure. */
export const TEXT_SCHEMA = { type: "OBJECT", properties: { text: { type: "STRING" } }, required: ["text"] };
export const CHECK_SCHEMA = {
  type: "OBJECT",
  properties: {
    agree: { type: "ARRAY", items: { type: "STRING" } },
    issues: { type: "ARRAY", items: { type: "OBJECT", properties: { element: { type: "STRING", enum: FLOW_ELEMENTS.map((e) => e.key) }, text: { type: "STRING" } }, required: ["text"] } },
  },
};
export const REFINES: Record<string, string> = {
  concise: "Make it more concise. Keep every fact; cut words.",
  professional: "Make it more professional, ready for an executive presentation. No marketing fluff.",
  simple: "Simplify it: plainer words, shorter sentences. Keep every fact.",
};

export function flowInstruction(method: string): string {
  return "You are Forefront Consulting's strategy consultant, writing one part of an organisation's Foundation from what the client told you." +
    "\nRULES: Use only what the answers and the plan say — never invent a figure, a name or a fact. Write in the organisation's own voice, plainly, with no marketing fluff." +
    " Keep to the counts and lengths Forefront's method states for this part. Return JSON with the finished text only — no preamble, no quotation marks around it, no notes." +
    (method.trim() ? "\n\nFOREFRONT'S METHOD FOR THE FOUNDATION:\n" + method.trim() : "");
}

export function flowCorpus(f: Flow, placeWord: string, context: string, upTo?: number): string {
  const out: string[] = [];
  out.push("PLACE: " + (placeWord || "this place"));
  out.push("STRATEGY PERIOD: " + (f.y0 != null && f.y1 != null ? f.y0 + " to the end of " + f.y1 : "not set — use the horizon the plan names, if any"));
  out.push("\nTHE PLAN AS IT IS WRITTEN ON THE PLATFORM:\n" + (context.trim() || "Nothing yet."));
  const parts = FLOW_ELEMENTS.map((el, i) => (live(f, i) && f.done[i] && f.drafts[i].trim() && (upTo == null || i !== upTo) ? el.name + ":\n" + f.drafts[i].trim() : "")).filter(Boolean);
  if (parts.length) out.push("\nPARTS OF THIS FOUNDATION ALREADY AGREED:\n" + parts.join("\n\n"));
  return out.join("\n");
}

export function draftQuestion(f: Flow, i: number): string {
  const el = FLOW_ELEMENTS[i];
  const qa = el.questions.map((q, k) => "Q: " + withYear(q, f.y1) + "\nA: " + (f.ans[i][k].trim() || "(not answered)")).join("\n\n");
  return "Draft the " + el.name.toUpperCase() + " part of the Foundation from these answers." + (el.key === "obj" ? " Write each objective on its own numbered line." : el.key === "val" ? " Write each value on its own line, its name then a dash and what it means." : "") + "\n\n" + qa;
}
export function refineQuestion(f: Flow, i: number, how: string): string {
  const el = FLOW_ELEMENTS[i];
  return "Rewrite this " + el.name.toUpperCase() + " draft. " + (REFINES[how] || ("The person asked: " + how)) + "\n\nTHE DRAFT:\n" + f.drafts[i];
}
export function checkQuestion(f: Flow): string {
  return "Check these parts of one Foundation against each other. Say in `agree` where two parts support each other, and in `issues` where they do not (a gap, a contradiction, an objective that measures nothing the other parts promise), naming the part to change in `element`. At most three of each. Short sentences.\n\n" +
    FLOW_ELEMENTS.map((el, i) => live(f, i) ? el.name.toUpperCase() + " (" + el.key + "):\n" + f.drafts[i].trim() : "").filter(Boolean).join("\n\n");
}

/* ── THE FOUNDATION AS ONE TEXT, AND SAVING IT ──────────────────────── */
export function foundationText(f: Flow, placeWord: string): string {
  const out = ["Foundation — " + placeWord, f.y0 != null && f.y1 != null ? f.y0 + " to the end of " + f.y1 : "", ""];
  FLOW_ELEMENTS.forEach((el, i) => { if (live(f, i) && f.drafts[i].trim()) out.push(el.name.toUpperCase(), withYear(f.drafts[i].trim(), f.y1), ""); });
  return out.join("\n").trim();
}
export const foundationTitle = (placeWord: string) => ("Foundation — " + (oneLine(placeWord) || "this place")).slice(0, MAX_TITLE);

/* EACH RUN IS A NEW VERSION OF ONE DELIVERABLE: the title is what the rail
   shows, so a deliverable already called "Foundation — Mobile" in this place
   and section gains a version; otherwise it is made at v1. */
export async function saveFoundation(c: Q, chat: { id: string; place: string; section: Section; title: string }, f: Flow, placeWord: string, by: string): Promise<{ deliverableId: string; n: number; title: string; isNew: boolean }> {
  const title = foundationTitle(placeWord);
  const body = { text: foundationText(f, placeWord), foundation: FLOW_ELEMENTS.filter((_, i) => live(f, i)).map((el) => ({ key: el.key, name: el.name, text: f.drafts[FLOW_ELEMENTS.indexOf(el)] })), years: [f.y0, f.y1] };
  const note = "Built in “" + chat.title + "”";
  const hit = await c.query(
    "SELECT id FROM copilot_deliverables WHERE place = $1 AND section = $2 AND lower(title) = lower($3) ORDER BY created_at DESC LIMIT 1",
    [chat.place, chat.section, title]);
  if (hit.rows[0]) {
    const id = str(hit.rows[0].id);
    return { deliverableId: id, n: await addVersion(c as any, id, { body, note, by }), title, isNew: false };
  }
  const id = await newDeliverable(c as any, { place: chat.place, section: chat.section, title, type: "foundation", kind: "promotable",
    approach: "Guided questions", body, note, by, chatId: chat.id, chatTitle: chat.title });
  return { deliverableId: id, n: 1, title, isNew: true };
}

/* The version the NEXT save would be, so the screen can say it before the
   press ("Save as Foundation — Mobile v3"). */
export async function nextFoundationVersion(c: Q, chat: { place: string; section: string }, placeWord: string): Promise<number> {
  const r = await c.query(
    "SELECT coalesce(max(v.n), 0) + 1 AS n FROM copilot_deliverables d LEFT JOIN copilot_versions v ON v.deliverable_id = d.id " +
    "WHERE d.place = $1 AND d.section = $2 AND lower(d.title) = lower($3)", [chat.place, chat.section, foundationTitle(placeWord)]);
  return Number(r.rows[0]?.n) || 1;
}
