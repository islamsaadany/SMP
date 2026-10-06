/* ══ ADVISORY, IN THE COPILOT (spec 064 decisions-v0.4 §6, §496; the
   signed-off design-mockups/copilot-advisory/2026-10-06_advisory.html) ═════
   Islam, of the drawing: "ok for both" — the question count sits in the
   right column, and "Proceed with what you have" is offered from the first
   question.

   AN ADVISORY CHAT ASKS, THEN ADVISES. The person brings a question; the
   Copilot asks ONE question a turn, at most five a round and two rounds,
   then writes a Decision Brief whatever it has. Two replies are always on
   offer: "I don't know — assume for me" (the turn is answered by an
   ASSUMPTION, which the right column lists) and "Proceed with what you have"
   (the asking stops and the brief is written now).

   THE COUNT IS THE SERVER'S, NEVER THE MODEL'S (§42). The model is asked
   for a brief — and only a brief — once ten questions are spent or proceed
   was pressed; a question it returns anyway is a failure, not an eleventh
   turn. The page draws the count from the stored turns, so the pips and the
   rule cannot disagree (§53.5).

   WHEN TWO SOURCES DISAGREE IT ASKS RATHER THAN PICKS: the platform's own
   figure against a file's is put to the person as a choice (the platform,
   the file, or a number of their own). That is a question too and counts.

   THE BRIEF IS CHECKED, NOT TRUSTED: two to four options and EXACTLY ONE
   recommended; every fact tagged with where it came from (Platform · You ·
   File · Assumed). It is saved as a COPILOT-ONLY deliverable, versioned by
   title, and never goes into the plan.

   Where the chat stands rides `extra.advisory` on the chat (no migration),
   the SWOT flow's shape. The page never sends the state: every act names
   what the person did and the server works the rest out from the STORED
   row. */
import { oneLine, MAX_TITLE, newDeliverable, addVersion, type Section } from "./copilot.ts";

type Q = { query: (text: string, values?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }> };
const str = (v: unknown) => (v == null ? "" : String(v));
const brk = () => process.env.SMP_BREAK || "";

export const PER_ROUND = 5;
export const ROUNDS = 2;
export const MAX_ASK = 2000;
export const MAX_TEXT = 600;
export const MAX_LIST = 8;
export const ASSUME_WORDS = "I don't know — assume for me";
export const PROCEED_WORDS = "Proceed with what you have";
export const CLASH_WORDS = { platform: "Use the platform figure", file: "Use the file", own: "Neither — I'll give the number" } as const;

export const SOURCES = ["platform", "you", "file", "assumed"] as const;
export type Src = (typeof SOURCES)[number];
export const SOURCE_TAG: Record<Src, string> = { platform: "Platform", you: "You", file: "File", assumed: "Assumed" };
const isSrc = (v: unknown): v is Src => (SOURCES as readonly string[]).includes(String(v));

export type Clash = { what: string; platform: string; file: string };
export type Turn = { round: number; q: string; clash: Clash | null; answer: string; how: "" | "said" | "assumed" | "platform" | "file" | "own" };
export type Fact = { source: Src; text: string };
export type Option = { title: string; detail: string; recommended: boolean };
export type Brief = { title: string; situation: string; known: Fact[]; options: Option[]; why: string; next: string[] };
export type Advisory = {
  phase: "asking" | "brief" | "saved";
  ask: string; turns: Turn[]; assumed: string[]; seen: string[];
  stopped: boolean; lead: string; brief: Brief | null; reply: string;
  saved: { deliverableId: string; n: number; title: string } | null;
};

export const newAdvisory = (): Advisory => ({ phase: "asking", ask: "", turns: [], assumed: [], seen: [], stopped: false, lead: "", brief: null, reply: "", saved: null });

const line = (v: unknown, max = MAX_TEXT) => oneLine(v).slice(0, max);
const list = (v: unknown, max = MAX_LIST) => (Array.isArray(v) ? v : []).map((x) => line(x)).filter(Boolean).slice(0, max);

/* ── THE COUNT ─────────────────────────────────────────────────────────── */
/* A turn belongs to the round it was asked in. Round 1 holds the first five,
   round 2 the next five; ten spent means the brief is owed. */
export const asked = (s: Advisory) => s.turns.length;
export const roundNow = (s: Advisory) => Math.min(ROUNDS, Math.floor(Math.min(asked(s), PER_ROUND * ROUNDS - 1) / PER_ROUND) + 1);
export const askedInRound = (s: Advisory) => s.turns.filter((t) => t.round === roundNow(s)).length;
export const spent = (s: Advisory) => asked(s) >= PER_ROUND * ROUNDS && brk() !== "no-budget";
export const pending = (s: Advisory): Turn | null => { const t = s.turns[s.turns.length - 1]; return t && !t.how ? t : null; };
/* The brief is owed — the model may not ask again — when the person said
   proceed, or the budget is gone and nothing is waiting on an answer. */
export const briefOwed = (s: Advisory) => s.stopped || (spent(s) && !pending(s));
export function countView(s: Advisory) {
  const r = roundNow(s);
  return { round: r, rounds: ROUNDS, asked: askedInRound(s), of: PER_ROUND, total: asked(s), stopped: s.stopped, owed: briefOwed(s) };
}

/* ── STORING ──────────────────────────────────────────────────────────── */
const HOWS = ["", "said", "assumed", "platform", "file", "own"];
function cleanClash(x: any): Clash | null {
  if (!x || typeof x !== "object") return null;
  const c = { what: line(x.what, 200), platform: line(x.platform, 300), file: line(x.file, 300) };
  return c.what && c.platform && c.file ? c : null;
}
function cleanTurn(x: any): Turn | null {
  if (!x || typeof x !== "object") return null;
  const q = line(x.q, MAX_TEXT);
  if (!q) return null;
  return { round: Number(x.round) === 2 ? 2 : 1, q, clash: cleanClash(x.clash), answer: line(x.answer, MAX_ASK), how: HOWS.includes(x.how) ? x.how : "" };
}
export function cleanBrief(x: any): Brief | null {
  if (!x || typeof x !== "object") return null;
  const known: Fact[] = (Array.isArray(x.known) ? x.known : []).map((f: any) => ({ source: isSrc(f && f.source) ? f.source : "assumed", text: line(f && f.text) }))
    .filter((f: Fact) => f.text).slice(0, 10);
  let options: Option[] = (Array.isArray(x.options) ? x.options : []).map((o: any) => ({ title: line(o && o.title, 200), detail: line(o && o.detail), recommended: !!(o && o.recommended) }))
    .filter((o: Option) => o.title).slice(0, 4);
  /* EXACTLY ONE recommended: several keep the first; none is not a brief. */
  const first = options.findIndex((o) => o.recommended);
  if (brk() !== "brief-any-rec") {
    if (first < 0) return null;
    options = options.map((o, k) => ({ ...o, recommended: k === first }));
  }
  const b: Brief = { title: line(x.title, MAX_TITLE), situation: line(x.situation, 1200), known, options, why: line(x.why, 1200), next: list(x.next, 6) };
  if (!b.title || !b.situation || b.options.length < 2) return null;
  return b;
}
export function storedAdvisory(raw: unknown): Advisory | null {
  if (!raw || typeof raw !== "object") return null;
  const j: any = raw;
  const s = newAdvisory();
  s.ask = line(j.ask, MAX_ASK);
  s.turns = (Array.isArray(j.turns) ? j.turns : []).map(cleanTurn).filter(Boolean).slice(0, PER_ROUND * ROUNDS) as Turn[];
  s.assumed = list(j.assumed, 12);
  s.seen = list(j.seen, 12);
  s.stopped = !!j.stopped;
  s.lead = line(j.lead, 1200);
  s.reply = line(j.reply, 1200);
  s.brief = cleanBrief(j.brief);
  if (j.saved && typeof j.saved === "object" && j.saved.deliverableId) s.saved = { deliverableId: str(j.saved.deliverableId), n: Number(j.saved.n) || 0, title: oneLine(j.saved.title) };
  s.phase = s.saved && j.phase === "saved" ? "saved" : s.brief ? "brief" : "asking";
  return s;
}
export async function advisoryOf(c: Q, chatId: string): Promise<Advisory | null> {
  const r = await c.query("SELECT extra->'advisory' AS advisory FROM copilot_chats WHERE id = $1", [chatId]);
  return r.rows[0] ? storedAdvisory(r.rows[0].advisory) : null;
}
export async function writeAdvisory(c: Q, chatId: string, s: Advisory): Promise<void> {
  await c.query("UPDATE copilot_chats SET extra = extra || jsonb_build_object('advisory', $2::jsonb), last_at = now() WHERE id = $1",
    [chatId, JSON.stringify(s)]);
}

/* ── WHAT THE PERSON DID ─────────────────────────────────────────────────
   One function for every reply, so the turn it lands on is decided once.
   `kind`: "say" (typed words), "assume", "proceed", or a clash choice
   ("platform" | "file" | "own" — "own" needs the words). Returns the new
   state or a refusal sentence. */
export function applyReply(s: Advisory, kind: string, words: string): Advisory | string {
  const g: Advisory = { ...s, turns: s.turns.map((t) => ({ ...t })), assumed: [...s.assumed] };
  const w = line(words, MAX_ASK);
  if (g.saved) return "This is saved. Start a new Advisory chat for the next question.";
  if (g.brief) return "The brief is written. Ask for changes to it, or save it.";
  if (!g.ask) {
    if (kind !== "say" || !w) return "Say what you would like advice on.";
    g.ask = w;
    return g;
  }
  if (kind === "proceed") { g.stopped = true; const p = pending(g); if (p) { p.how = "assumed"; } return g; }
  const p = pending(g);
  if (!p) return kind === "say" && !w ? "Say what you would like to add." : g;
  if (kind === "assume") { p.how = "assumed"; return g; }
  if (kind === "platform" || kind === "file") {
    if (!p.clash) return "That question is not a choice between sources.";
    p.how = kind; p.answer = kind === "platform" ? p.clash.platform : p.clash.file;
    return g;
  }
  if (kind === "say" || kind === "own") {
    if (!w) return "Write your answer first.";
    p.how = p.clash && kind === "own" ? "own" : "said"; p.answer = w;
    return g;
  }
  return "Not something the Copilot does.";
}

/* ── THE TO-DO LIST, WORKED OUT ─────────────────────────────────────── */
export type Todo = { key: string; title: string; status: string; state: "done" | "open" };
export function todoOf(s: Advisory): Todo[] {
  const said = s.turns.filter((t) => t.how).length;
  return [
    { key: "ask", title: "Your question", state: s.ask ? "done" : "open", status: s.ask ? "Asked" : "Not asked yet" },
    { key: "questions", title: "Questions", state: s.brief || s.stopped || spent(s) ? "done" : "open", status: said + " answered" },
    { key: "brief", title: "Decision brief", state: s.brief ? "done" : "open", status: s.brief ? "Written" : "After the questions" },
    { key: "save", title: "Save", state: s.saved ? "done" : "open", status: s.saved ? "Saved as " + s.saved.title + " v" + s.saved.n : "Into Advisory deliverables" },
  ];
}
export const doneCount = (t: Todo[]) => t.filter((x) => x.state === "done").length;

/* ── WHAT THE MODEL READS AND RETURNS ────────────────────────────────── */
export function advisoryInstruction(method: string): string {
  return "You are Forefront Consulting's strategy consultant, advising a client on a question they bring." +
    "\nRULES: Ask ONE short question at a time, only what you genuinely need to advise well. Never invent a figure, a name or a fact." +
    " When the platform's figures and a file's figures disagree on the same thing, do not choose: return a clash naming both values." +
    " When the person says to assume, make a sensible stated assumption and list it in `assumed`." +
    " Tag every fact in a brief with where it came from: platform (the plan and figures given), you (the person's answers), file (a file given), assumed." +
    " A brief has two to four options and exactly ONE recommended. Return JSON in the shape asked, with no preamble." +
    (method.trim() ? "\n\nFOREFRONT'S METHOD:\n" + method.trim() : "");
}
const BRIEF = { type: "OBJECT", properties: {
  title: { type: "STRING" }, situation: { type: "STRING" },
  known: { type: "ARRAY", items: { type: "OBJECT", properties: { source: { type: "STRING", enum: [...SOURCES] }, text: { type: "STRING" } }, required: ["source", "text"] } },
  options: { type: "ARRAY", items: { type: "OBJECT", properties: { title: { type: "STRING" }, detail: { type: "STRING" }, recommended: { type: "BOOLEAN" } }, required: ["title", "detail", "recommended"] } },
  why: { type: "STRING" }, next: { type: "ARRAY", items: { type: "STRING" } } },
  required: ["title", "situation", "known", "options", "why", "next"] };
const LIST = { type: "ARRAY", items: { type: "STRING" } };
export const TURN_SCHEMA = { type: "OBJECT", properties: {
  kind: { type: "STRING", enum: ["question", "clash", "brief"] }, lead: { type: "STRING" }, question: { type: "STRING" },
  clash: { type: "OBJECT", properties: { what: { type: "STRING" }, platform: { type: "STRING" }, file: { type: "STRING" } } },
  assumed: LIST, seen: LIST, brief: BRIEF }, required: ["kind", "lead"] };
export const BRIEF_SCHEMA = { type: "OBJECT", properties: { lead: { type: "STRING" }, assumed: LIST, seen: LIST, brief: BRIEF }, required: ["lead", "brief"] };
export const REVISE_SCHEMA = { type: "OBJECT", properties: { reply: { type: "STRING" }, brief: BRIEF }, required: ["reply", "brief"] };

export function transcript(s: Advisory): string {
  const out = ["THE PERSON ASKS: " + s.ask];
  s.turns.forEach((t, k) => {
    out.push("Q" + (k + 1) + " (round " + t.round + "): " + t.q + (t.clash ? " [clash on " + t.clash.what + ": platform " + t.clash.platform + " vs file " + t.clash.file + "]" : ""));
    out.push("   A: " + (t.how === "assumed" ? "(they do not know — assume)" : t.how === "platform" ? "use the platform figure: " + t.answer
      : t.how === "file" ? "use the file: " + t.answer : t.how ? t.answer : "(not answered)"));
  });
  if (s.assumed.length) out.push("ASSUMED SO FAR: " + s.assumed.join("; "));
  return out.join("\n");
}
export function turnQuestion(s: Advisory): string {
  return transcript(s) + "\n\nYou have asked " + askedInRound(s) + " of " + PER_ROUND + " questions in round " + roundNow(s) + " of " + ROUNDS + "." +
    " Return kind \"question\" with ONE question, or kind \"clash\" when two sources disagree on a figure you need, or kind \"brief\" when you have enough." +
    " `lead` is one or two sentences to the person before the question (or before the brief). List in `seen` up to six short facts you are using from the platform, and in `assumed` any assumption you made this turn.";
}
export function briefQuestion(s: Advisory): string {
  return transcript(s) + "\n\n" + (s.stopped ? "The person said to proceed with what you have." : "The questions are used up.") +
    " Write the Decision Brief now. Where something is unknown, state an assumption and tag it assumed. `lead` is one sentence saying you are writing the brief on what you have." +
    " List in `seen` up to six short facts you used from the platform, and in `assumed` every assumption.";
}
export function reviseQuestion(s: Advisory, ask: string): string {
  return transcript(s) + "\n\nTHE BRIEF AS IT STANDS:\n" + briefText(s.brief) + "\n\nThe person asks: " + ask +
    "\n\nDo what they ask and nothing else; return the whole brief, still with exactly one recommended option. In `reply` say in one or two sentences what you changed.";
}

export function briefText(b: Brief | null): string {
  if (!b) return "";
  return b.title + "\n\nSituation: " + b.situation + "\n\nWhat we know:\n" + b.known.map((f) => "- [" + SOURCE_TAG[f.source] + "] " + f.text).join("\n") +
    "\n\nOptions:\n" + b.options.map((o, k) => String.fromCharCode(65 + k) + ". " + o.title + (o.recommended ? " (recommended)" : "") + " — " + o.detail).join("\n") +
    "\n\nWhy: " + b.why + "\n\nNext steps:\n" + b.next.map((n, k) => (k + 1) + ". " + n).join("\n");
}

/* The model's turn, cut to what the server will keep. A question when the
   brief is owed is refused (the count is ours). */
export function takeTurn(s: Advisory, j: any): Advisory | string {
  const g: Advisory = { ...s, turns: s.turns.map((t) => ({ ...t })) };
  g.assumed = [...new Set([...g.assumed, ...list(j && j.assumed, 6)])].slice(0, 12);
  const seen = list(j && j.seen, 6);
  if (seen.length) g.seen = seen;
  g.lead = line(j && j.lead, 1200);
  const kind = String(j && j.kind || "brief");
  if (kind === "brief" || briefOwed(s)) {
    const b = cleanBrief(j && j.brief);
    if (!b) return briefOwed(s) && kind !== "brief" ? "a question came back where the brief was owed" : "the brief was not complete";
    g.brief = b; g.phase = "brief"; g.reply = "";
    return g;
  }
  const clash = kind === "clash" ? cleanClash(j && j.clash) : null;
  if (kind === "clash" && !clash) return "the clash did not name both figures";
  /* A clash IS the question; the platform words it when the model did not. */
  const q = line(j && j.question) || (clash ? "Which " + clash.what + " should I use?" : "");
  if (!q) return "the answer had no question in it";
  g.turns.push({ round: g.turns.length >= PER_ROUND ? 2 : 1, q, clash, answer: "", how: "" });
  return g;
}

/* ── SAVING: THE BRIEF AS A COPILOT-ONLY DELIVERABLE ─────────────────── */
export async function saveAdvisory(c: Q, chat: { id: string; place: string; section: Section; title: string }, s: Advisory, by: string) {
  const b = s.brief as Brief;
  const title = (b.title || "Decision brief").slice(0, MAX_TITLE);
  const body = { text: briefText(b), brief: b, ask: s.ask, assumed: s.assumed };
  const note = "Built in “" + chat.title + "”";
  const hit = await c.query("SELECT id FROM copilot_deliverables WHERE place = $1 AND section = $2 AND lower(title) = lower($3) ORDER BY created_at DESC LIMIT 1",
    [chat.place, chat.section, title]);
  if (hit.rows[0]) { const id = str(hit.rows[0].id); return { deliverableId: id, n: await addVersion(c as any, id, { body, note, by }), title }; }
  const id = await newDeliverable(c as any, { place: chat.place, section: chat.section, title, type: "advisory",
    kind: brk() === "advisory-promotable" ? "promotable" : "copilot-only", approach: "Decision brief", body, note, by, chatId: chat.id, chatTitle: chat.title });
  return { deliverableId: id, n: 1, title };
}
