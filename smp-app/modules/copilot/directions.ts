/* ── THE DIRECTIONS AND CAPABILITIES CHATS, ON THE SERVER (spec 064 §4–§5,
   §494) ──
   The How-we-compete chat's own shape (./compete.ts): every write is judged
   against the STORED row (§42); the model is asked with no transaction open
   (§289); a failure is said in words (§171). The rules live in
   lib/copilot-directions.ts — this file only carries them to the page. */
import { withTenant } from "../../lib/tenant.ts";
import { type Who, oneLine, isPlace, oneChat, newChat, MAX_TITLE, NO_KEY, failedLine } from "../../lib/copilot.ts";
import { askFlowJson, configured } from "../../lib/copilot-ask.ts";
import { partsOf } from "../../lib/copilot-settings.ts";
import { doorPool } from "../../lib/auth.ts";
import {
  type Dirs, type Fn, type Option, MAX_OPTIONS, MAX_CAPS, SCORE_MAX, CAP_KINDS, CAP_KIND_WORD, CAP_KIND_SAYS,
  newDirs, sanitizeDirs, storedDirs, dirsOf, writeDirs, todoOf, doneCount, scoreOf, goes, finishBlocker,
  dirsInstruction, OPTIONS_SCHEMA, CAPS_SCHEMA, suggestQuestion, moreQuestion, capsQuestion, modelOptions, modelCaps, saveDirs,
} from "../../lib/copilot-directions.ts";

type Out = { status: number; body: Record<string, unknown> };
const out = (status: number, body: Record<string, unknown>): Out => ({ status, body });
const refused = (status: number, why: string): Out => out(status, { ok: false, why });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const brk = () => process.env.SMP_BREAK || "";
const MAX_CONTEXT = 24_000;
const ARCHIVED = "This chat is archived. Restore it to keep talking.";
const SAVED_ALREADY = "This is saved. Start a new chat to make the next version.";
const NOT_DIRS = "This is not a Directions or Capabilities chat.";

/* The functions the page offers as owners, cut to shape. They are the
   tenant's own names, sent by the page that draws them; an owner the model
   names that is not on this list is dropped rather than guessed at. */
function fnsOf(raw: unknown): Fn[] {
  return (Array.isArray(raw) ? raw : []).map((x: any) => ({ key: String(x && x.key || "").trim(), name: oneLine(x && x.name).slice(0, 120) }))
    .filter((f) => /^[a-z0-9][a-z0-9_-]{0,63}$/.test(f.key) && f.name).slice(0, 60);
}
const titlesOf = (raw: unknown, n: number) => (Array.isArray(raw) ? raw : []).map((t) => oneLine(t).slice(0, 160)).filter(Boolean).slice(0, n);

export async function dirsView(c: any, chat: { id: string }) {
  const s = await dirsOf(c, chat.id);
  if (!s) return {};
  const todo = todoOf(s);
  return { dirs: s, dirsTodo: todo, dirsDone: doneCount(todo), dirsScores: s.options.map(scoreOf),
    dirsWords: { max: SCORE_MAX, kinds: CAP_KINDS, kindWord: CAP_KIND_WORD, kindSays: CAP_KIND_SAYS }, dirsBlocker: finishBlocker(s) };
}
export async function dirsProgress(c: any, ids: string[]): Promise<Record<string, { done: number; of: number }>> {
  if (!ids.length) return {};
  const r = await c.query("SELECT id, extra->'directions' AS d FROM copilot_chats WHERE id = ANY($1::uuid[]) AND extra ? 'directions'", [ids]);
  const m: Record<string, { done: number; of: number }> = {};
  for (const x of r.rows) { const s = storedDirs(x.d); if (s) { const t = todoOf(s); m[String(x.id)] = { done: doneCount(t), of: t.length }; } }
  return m;
}

export const DIRS_ACTS = ["newDirections", "dirStart", "dirSave", "dirFinish"];
export const DIRS_ASKS = ["dirSuggest", "dirMore", "capSuggest"];

export async function dirsAct(c: any, b: any, who: Who): Promise<Out> {
  const kind = String(b.act || "");
  const by = who.personKey || "";
  if (kind === "newDirections") {
    const place = String(b.place || "");
    if (!isPlace(place)) return refused(400, "Which place?");
    const mode = b.mode === "capabilities" ? "capabilities" : "directions";
    const hadPlan = Math.max(0, Math.min(99, Number(b.hadPlan) || 0));
    const chat = await newChat(c, { place, section: mode, title: oneLine(b.title).slice(0, MAX_TITLE) || (mode === "capabilities" ? "Capabilities" : "Directions"), by });
    await writeDirs(c, chat.id, newDirs(mode, !!b.withCaps, hadPlan));
    return out(200, { ok: true, chat: { ...chat, dirs: true }, ...(await dirsView(c, chat)) });
  }
  const id = String(b.id || "");
  if (!UUID.test(id)) return refused(400, "Which chat?");
  const chat = await oneChat(c, id);
  if (!chat) return refused(404, "That chat is not here any more.");
  if (chat.archived) return refused(400, ARCHIVED);
  const stored = await dirsOf(c, id);
  if (!stored) return refused(400, NOT_DIRS);
  if (stored.saved) return refused(400, SAVED_ALREADY);

  if (kind === "dirStart") {
    if (stored.start) return refused(400, "This chat has already started.");
    if (b.start !== "plan" && b.start !== "fresh") return refused(400, "Start from the plan, or fresh?");
    /* Starting from the plan puts its Directions on the table first, marked
       as the plan's, keyed by the pillar they came from — so a save updates
       that pillar rather than adding a second one beside it (§48). */
    const existing = b.start === "plan" ? (Array.isArray(b.existing) ? b.existing : []).slice(0, MAX_OPTIONS)
      .map((x: any) => ({ title: x && x.title, planId: x && x.id, mark: "plan", go: true })) : [];
    const s = sanitizeDirs({ start: b.start, options: existing }, stored);
    await writeDirs(c, id, s);
    return out(200, { ok: true, ...(await dirsView(c, chat)) });
  }
  if (kind === "dirSave") {
    await writeDirs(c, id, sanitizeDirs(b.dirs, stored));
    return out(200, { ok: true, ...(await dirsView(c, chat)) });
  }
  if (kind === "dirFinish") {
    const why = brk() === "dir-finish-any" ? "" : finishBlocker(stored);
    if (why) return refused(400, why);
    const placeWord = oneLine(b.placeWord).slice(0, 120) || chat.place;
    const fns = fnsOf(b.fns);
    const name = (k: string) => (fns.find((f) => f.key === k) || { name: k }).name;
    const r = await saveDirs(c, chat, stored, placeWord, name, by);
    const s: Dirs = { ...stored, saved: { deliverableId: r.deliverableId, n: r.n, title: r.title } };
    await writeDirs(c, id, s);
    return out(200, { ok: true, saved: s.saved, ...(await dirsView(c, chat)) });
  }
  return refused(400, "Not something the Copilot does.");
}

const partText = async (keys: string[]) => {
  if (!configured() || brk() === "no-method") return "";
  try { return (await partsOf(doorPool())).filter((p) => keys.includes(p.key) && p.text.trim()).map((p) => "## " + p.title + "\n\n" + p.text.trim()).join("\n\n"); }
  catch { return ""; }
};

/* The first suggestion ticks the strongest: the four best scores go ahead
   unless the person says otherwise (the mockup's "The 4 ticked are the ones
   I'd take"). Ties keep the order the table is in. */
export const TICK_FIRST = 4;
function tickBest(os: Option[]): Option[] {
  const order = os.map((o, k) => ({ k, sc: scoreOf(o) ?? -1 })).sort((a, b) => b.sc - a.sc || a.k - b.k);
  const pick = new Set(order.slice(0, TICK_FIRST).filter((x) => x.sc >= 0).map((x) => x.k));
  return os.map((o, k) => ({ ...o, go: pick.has(k) }));
}

/* Suggest the options, add more, suggest the capabilities. Read, ask, write
   — no transaction across the model (§289). */
export async function dirsAsk(tenantId: string, b: any, _who: Who): Promise<Out> {
  const id = String(b.id || "");
  if (!UUID.test(id)) return refused(400, "Which chat?");
  const kind = String(b.act);
  const placeWord = oneLine(b.placeWord).slice(0, 120);
  const context = String(b.context ?? "").slice(0, MAX_CONTEXT);
  const ask = oneLine(b.ask).slice(0, 1000);
  const own = titlesOf(b.own, 4);
  const fns = fnsOf(b.fns);

  const step1 = await withTenant(tenantId, async (c) => {
    const chat = await oneChat(c, id);
    if (!chat) return refused(404, "That chat is not here any more.");
    if (chat.archived) return refused(400, ARCHIVED);
    const stored = await dirsOf(c, id);
    if (!stored) return refused(400, NOT_DIRS);
    if (stored.saved) return refused(400, SAVED_ALREADY);
    const s = b.dirs ? sanitizeDirs(b.dirs, stored) : stored;
    if (kind === "dirSuggest" || kind === "dirMore") {
      if (s.mode !== "directions") return refused(400, NOT_DIRS);
      if (!s.start) return refused(400, "Start from the plan, or fresh?");
      if (kind === "dirMore" && !own.length && !ask && s.options.length >= MAX_OPTIONS) return refused(400, "The table is full.");
    }
    if (kind === "capSuggest") {
      if (s.mode === "directions" && (!s.withCaps || !s.chose)) return refused(400, "Choose the Directions first.");
      if (s.caps.length >= MAX_CAPS) return refused(400, "The table is full.");
    }
    if (b.dirs) await writeDirs(c, id, s);
    return { chat, s };
  });
  if ("status" in step1) return step1;
  const { chat, s } = step1;

  const dirs = s.mode === "directions" ? goes(s).map((o) => o.title) : titlesOf(b.dirTitles, 20);
  const method = await partText(["part7", "part8"]);
  const question = kind === "dirSuggest" ? suggestQuestion(s, fns)
    : kind === "dirMore" ? moreQuestion(s, fns, own, ask)
    : capsQuestion(dirs, fns, s.caps, own, ask);
  const r = await askFlowJson({ instruction: dirsInstruction(method),
    corpus: "PLACE: " + (placeWord || chat.place) + "\n\n" + context, corpusName: "THE PLAN AS IT STANDS", parts: [],
    question, schema: kind === "capSuggest" ? CAPS_SCHEMA : OPTIONS_SCHEMA, maxOutput: 8192 });
  if (!r.ok) {
    if (!(r as any).noKey) console.error("copilot: directions ask:", r.why);
    return refused(503, (r as any).noKey ? NO_KEY : failedLine(r.why));
  }
  const j: any = r.json || {};
  const reply = String(j.reply ?? "").trim().slice(0, 1200);
  return withTenant(tenantId, async (c) => {
    const now = await dirsOf(c, id);
    if (!now || now.saved) return refused(400, SAVED_ALREADY);
    let g: Dirs;
    if (kind === "dirSuggest") {
      const got = modelOptions(j.options, fns, []);
      if (!got.length) return refused(503, failedLine("the answer had nothing in it"));
      /* The plan's own rows keep their place, their key and their mark; the
         model only scores them. Every other row is a first suggestion. */
      const byTitle = new Map(got.map((o) => [o.title.toLowerCase(), o]));
      const plan = now.options.filter((o) => o.mark === "plan").map((o) => {
        const m = byTitle.get(o.title.toLowerCase());
        return m ? { ...o, urgency: m.urgency, importance: m.importance, ease: m.ease, ownedBy: o.ownedBy || m.ownedBy } : o;
      });
      const taken = new Set(plan.map((o) => o.title.toLowerCase()));
      const fresh = got.filter((o) => !taken.has(o.title.toLowerCase())).map((o) => ({ ...o, mark: "" as const }));
      g = sanitizeDirs({ options: tickBest([...plan, ...fresh].slice(0, MAX_OPTIONS)), chose: false }, now);
    } else if (kind === "dirMore") {
      const have = new Set(now.options.map((o) => o.title.toLowerCase()));
      const got = modelOptions(j.options, fns, own).filter((o) => !have.has(o.title.toLowerCase()));
      if (!got.length) return refused(503, failedLine("the answer had nothing new in it"));
      g = sanitizeDirs({ options: [...now.options, ...got].slice(0, MAX_OPTIONS) }, now);
    } else {
      const first = !now.caps.length;
      const have = new Set(now.caps.map((x) => x.title.toLowerCase()));
      const got = modelCaps(j.capabilities, fns, dirs, own, first).filter((x) => !have.has(x.title.toLowerCase()));
      if (!got.length) return refused(503, failedLine("the answer had nothing new in it"));
      g = sanitizeDirs({ caps: [...now.caps, ...got].slice(0, MAX_CAPS) }, now);
    }
    g.reply = reply;
    await writeDirs(c, id, g);
    return out(200, { ok: true, ...(await dirsView(c, chat)) });
  });
}
