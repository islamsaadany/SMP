/* ══ DIRECTIONS AND CAPABILITIES, IN THE COPILOT (spec 064 §4–§5, §494; the
   signed-off design-mockups/copilot-directions-flow/2026-10-05_directions-
   flow-v2.html, panels D, E and F) ═════════════════════════════════════════
   Islam: "start the build", then "proceed with all until you need someting
   from me". A Directions chat opens by asking whether to start from the
   Directions the plan already has or to start fresh, then suggests options
   drawn from the SWOT and the chosen discipline, scores each Urgency ×
   Importance × Ease (1–4 each, out of 64), lets the person change any score,
   tick what goes ahead, ask for more or add their own, and — where Structure
   keeps capabilities inside the company plan — goes on to the Capabilities
   that deliver them. Where capabilities are a layer of their own, the same
   table is a chat of its own in the Capabilities section.

   ONE STATE, TWO MODES. A directions chat and a capabilities chat share one
   shape under `extra.directions` (no migration); `mode` says which, and the
   to-do list is WORKED OUT from it on every read, never stored (§53.5).

   ONE SCORING FUNCTION (§94.8): `scoreOf` is asked by the view and by the
   check; the page never multiplies.

   WHAT REACHES THE PLAN is written by the browser after the Finish press,
   into the writable view of the place, and carried by the autosave — the
   same road the How-we-compete and SWOT chats take. The deliverable is the
   record of what was chosen; the plan is the plan. */
import { oneLine, MAX_TITLE, newDeliverable, addVersion, type Section } from "./copilot.ts";

type Q = { query: (text: string, values?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }> };
const str = (v: unknown) => (v == null ? "" : String(v));
const brk = () => process.env.SMP_BREAK || "";

export const MODES = ["directions", "capabilities"] as const;
export type Mode = (typeof MODES)[number];
export const MARKS = ["", "new", "yours", "plan"] as const;
export type Mark = (typeof MARKS)[number];
export const CAP_KINDS = ["gap", "transformation", "enabler"] as const;
export type CapKind = (typeof CAP_KINDS)[number];
export const CAP_KIND_WORD: Record<CapKind, string> = { gap: "Gap-closing", transformation: "Transformation", enabler: "Enabler" };
export const CAP_KIND_SAYS: Record<CapKind, string> = {
  gap: "Something we must build because a weakness or a Direction needs it.",
  transformation: "A change we choose to make for its own sake.",
  enabler: "A supporting foundation such as data or systems.",
};
export const isCapKind = (v: unknown): v is CapKind => (CAP_KINDS as readonly string[]).includes(String(v));
export const MAX_OPTIONS = 12;
export const MAX_CAPS = 10;

export type Option = { title: string; urgency: number; importance: number; ease: number; ownedBy: string; go: boolean; mark: Mark; planId: string };
export type Cap = { title: string; kind: CapKind | ""; serves: string[]; ownedBy: string; keep: boolean; mark: Mark; planId: string };
export type Dirs = {
  mode: Mode;
  withCaps: boolean;        // directions mode: capabilities are chosen in this chat (capAtTop)
  start: "" | "plan" | "fresh";
  hadPlan: number;          // how many Directions the plan held when the chat opened
  options: Option[];
  chose: boolean;           // "Go ahead with the N ticked" was pressed
  caps: Cap[];
  reply: string;
  saved: { deliverableId: string; n: number; title: string } | null;
};

/* ── THE ONE SCORING FUNCTION ──────────────────────────────────────────
   Each of the three is 1 to 4; the score is their product, out of 64. A row
   missing any of the three has no score rather than a nought (§35). */
export const SCORE_MAX = 64;
export const isScore = (n: unknown) => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 4;
export function scoreOf(o: { urgency: number; importance: number; ease: number }): number | null {
  if (!isScore(o.urgency) || !isScore(o.importance) || !isScore(o.ease)) return null;
  if (brk() === "dir-score-sum") return o.urgency + o.importance + o.ease;
  return o.urgency * o.importance * o.ease;
}

export const newDirs = (mode: Mode, withCaps: boolean, hadPlan: number): Dirs =>
  ({ mode, withCaps: mode === "directions" && !!withCaps, start: hadPlan > 0 && mode === "directions" ? "" : "fresh", hadPlan,
     options: [], chose: false, caps: [], reply: "", saved: null });

const KEY = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const cleanKey = (v: unknown) => { const s = str(v).trim(); return KEY.test(s) ? s : ""; };
const cleanMark = (v: unknown): Mark => ((MARKS as readonly string[]).includes(str(v)) ? (str(v) as Mark) : "");
const cleanN = (v: unknown) => { const n = Number(v); return isScore(n) ? n : 0; };
const ID = /^[A-Za-z0-9:_.-]{1,80}$/;
const cleanId = (v: unknown) => { const s = str(v); return ID.test(s) ? s : ""; };

export const cleanOption = (x: any): Option => ({
  title: oneLine(x && x.title).slice(0, 160), urgency: cleanN(x && x.urgency), importance: cleanN(x && x.importance), ease: cleanN(x && x.ease),
  ownedBy: cleanKey(x && x.ownedBy), go: !!(x && x.go), mark: cleanMark(x && x.mark), planId: cleanId(x && x.planId),
});
export const cleanCap = (x: any): Cap => ({
  title: oneLine(x && x.title).slice(0, 160), kind: isCapKind(x && x.kind) ? x.kind : "",
  serves: (Array.isArray(x && x.serves) ? x.serves : []).map((s: unknown) => oneLine(s).slice(0, 160)).filter(Boolean).slice(0, 8),
  ownedBy: cleanKey(x && x.ownedBy), keep: !!(x && x.keep), mark: cleanMark(x && x.mark), planId: cleanId(x && x.planId),
});

/* The page's version, cut to shape. `saved`, `mode`, `withCaps` and
   `hadPlan` are the product's and are kept (§42, §96.2). */
export function sanitizeDirs(raw: unknown, stored: Dirs): Dirs {
  const j: any = raw && typeof raw === "object" ? raw : {};
  const s: Dirs = { ...stored };
  if (j.start === "plan" || j.start === "fresh") s.start = s.start || j.start;
  if (Array.isArray(j.options)) s.options = j.options.map(cleanOption).filter((o: Option) => o.title).slice(0, MAX_OPTIONS);
  if ("chose" in j) s.chose = !!j.chose;
  if (Array.isArray(j.caps)) s.caps = j.caps.map(cleanCap).filter((c: Cap) => c.title).slice(0, MAX_CAPS);
  if (process.env.SMP_BREAK === "dir-trust-saved" && j.saved) s.saved = j.saved;
  return settle(s);
}
/* The work cannot run ahead of itself: nothing is chosen with nothing ticked. */
function settle(s: Dirs): Dirs {
  if (s.mode === "directions" && s.chose && !s.options.some((o) => o.go)) s.chose = false;
  return s;
}
export function storedDirs(raw: unknown): Dirs | null {
  if (!raw || typeof raw !== "object") return null;
  const j: any = raw;
  const mode: Mode = j.mode === "capabilities" ? "capabilities" : "directions";
  const base = newDirs(mode, !!j.withCaps, Number(j.hadPlan) || 0);
  base.start = j.start === "plan" || j.start === "fresh" ? j.start : base.start;
  if (j.saved && typeof j.saved === "object" && j.saved.deliverableId) base.saved = { deliverableId: str(j.saved.deliverableId), n: Number(j.saved.n) || 0, title: oneLine(j.saved.title) };
  base.reply = String(j.reply ?? "").slice(0, 1200);
  return sanitizeDirs({ options: j.options, caps: j.caps, chose: j.chose }, base);
}
export async function dirsOf(c: Q, chatId: string): Promise<Dirs | null> {
  const r = await c.query("SELECT extra->'directions' AS d FROM copilot_chats WHERE id = $1", [chatId]);
  return r.rows[0] ? storedDirs(r.rows[0].d) : null;
}
export async function writeDirs(c: Q, chatId: string, s: Dirs): Promise<void> {
  await c.query("UPDATE copilot_chats SET extra = extra || jsonb_build_object('directions', $2::jsonb), last_at = now() WHERE id = $1",
    [chatId, JSON.stringify(s)]);
}

/* What may be saved, asked of the STORED chat (§42). */
export const goes = (s: Dirs) => s.options.filter((o) => o.go);
export const kept = (s: Dirs) => s.caps.filter((c) => c.keep);
export function finishBlocker(s: Dirs): string {
  if (s.mode === "directions") {
    if (!s.chose || !goes(s).length) return "Tick the Directions that go ahead first.";
    if (s.withCaps && !kept(s).length) return "Keep at least one Capability first.";
    return "";
  }
  if (!kept(s).length) return "Keep at least one Capability first.";
  return "";
}

/* ── THE TO-DO LIST, WORKED OUT (spec §5.1, §5.2) ───────────────────── */
export type Todo = { key: string; title: string; status: string; state: "done" | "open" };
const plural = (n: number, one: string, many: string) => n + " " + (n === 1 ? one : many);
export function todoOf(s: Dirs): Todo[] {
  const saved: Todo = { key: "save", title: "Save", state: s.saved ? "done" : "open", status: s.saved ? "Saved as " + s.saved.title + " v" + s.saved.n : "Into the plan" };
  if (s.mode === "capabilities") {
    const k = kept(s);
    return [
      { key: "suggest", title: "Suggest Capabilities", state: s.caps.length ? "done" : "open", status: s.caps.length ? plural(s.caps.length, "suggested", "suggested") : "From the saved Directions" },
      { key: "choose", title: "Choose and set owners", state: k.length && k.every((c) => c.ownedBy) ? "done" : "open",
        status: k.length ? plural(k.length, "kept", "kept") + (k.some((c) => !c.ownedBy) ? " · owners to set" : "") : "None kept yet" },
      saved,
    ];
  }
  const g = goes(s);
  const out: Todo[] = [
    { key: "options", title: "Options", state: s.options.length ? "done" : "open", status: s.options.length ? plural(s.options.length, "option", "options") + " scored" : s.start === "" ? "Start from the plan or fresh" : "Not suggested yet" },
    { key: "choose", title: "Choose Directions", state: s.chose && g.length ? "done" : "open", status: s.chose && g.length ? plural(g.length, "Direction", "Directions") + " chosen" : g.length ? g.length + " ticked" : "None ticked yet" },
  ];
  if (s.withCaps) {
    const k = kept(s);
    out.push({ key: "caps", title: "Choose Capabilities", state: k.length ? "done" : "open", status: k.length ? plural(k.length, "Capability", "Capabilities") + " kept" : s.chose ? "Not suggested yet" : "After the Directions" });
  }
  out.push(saved);
  return out;
}
export const doneCount = (t: Todo[]) => t.filter((x) => x.state === "done").length;

/* ── WHAT THE MODEL READS AND RETURNS ────────────────────────────────── */
export function dirsInstruction(method: string): string {
  return "You are Forefront Consulting's strategy consultant, choosing an organisation's strategic Directions and the Capabilities that deliver them." +
    "\nRULES: Use the SWOT, How we compete, the Foundation and the plan as evidence; never invent a figure, a name or a fact. A Direction faces OUTSIDE — a market, a customer, a growth move — never an internal fix." +
    " Score Urgency, Importance and Ease each 1 to 4 (4 = most urgent, most important, easiest). Own each one by a function from the list given, using its key, or leave ownedBy empty if none fits." +
    " Return JSON in the shape asked, with no preamble." +
    (method.trim() ? "\n\nFOREFRONT'S METHOD:\n" + method.trim() : "");
}
const OPTION = { type: "OBJECT", properties: { title: { type: "STRING" }, urgency: { type: "INTEGER" }, importance: { type: "INTEGER" }, ease: { type: "INTEGER" }, ownedBy: { type: "STRING" } }, required: ["title", "urgency", "importance", "ease", "ownedBy"] };
export const OPTIONS_SCHEMA = { type: "OBJECT", properties: { reply: { type: "STRING" }, options: { type: "ARRAY", items: OPTION } }, required: ["reply", "options"] };
const CAP = { type: "OBJECT", properties: { title: { type: "STRING" }, kind: { type: "STRING" }, serves: { type: "ARRAY", items: { type: "STRING" } }, ownedBy: { type: "STRING" } }, required: ["title", "kind", "serves", "ownedBy"] };
export const CAPS_SCHEMA = { type: "OBJECT", properties: { reply: { type: "STRING" }, capabilities: { type: "ARRAY", items: CAP } }, required: ["reply", "capabilities"] };

export type Fn = { key: string; name: string };
const fnLines = (fns: Fn[]) => fns.length ? fns.map((f) => "- " + f.key + ": " + f.name).join("\n") : "(none — leave ownedBy empty)";
const optionLines = (os: Option[]) => os.map((o, k) => (k + 1) + ". " + o.title).join("\n");

export function suggestQuestion(s: Dirs, fns: Fn[]): string {
  const from = s.options.length ? "\n\nTHE PLAN'S EXISTING DIRECTIONS (score each of these too, and return them first, word for word):\n" + optionLines(s.options) : "";
  return "Suggest 5 possible strategic Directions for this place, drawn from its SWOT and the way it competes, and score each." + from +
    "\n\nFUNCTIONS (for ownedBy):\n" + fnLines(fns) +
    "\n\nIn `reply`, say in one sentence what the options are drawn from.";
}
export function moreQuestion(s: Dirs, fns: Fn[], own: string[], ask: string): string {
  return "These Directions are already on the table:\n" + optionLines(s.options) +
    (own.length ? "\n\nThe client adds these of their own — score them, and keep their titles exactly:\n" + own.map((t) => "- " + t).join("\n") : "") +
    (ask ? "\n\nThe client asks: " + ask : "") +
    (own.length && !ask ? "" : "\n\nAdd 2 new options that are not already on the table.") +
    "\n\nReturn ONLY the new rows in `options` (the client's own first), never the ones already on the table.\n\nFUNCTIONS (for ownedBy):\n" + fnLines(fns) +
    "\n\nIn `reply`, say in one sentence what you added.";
}
export function capsQuestion(dirs: string[], fns: Fn[], have: Cap[], own: string[], ask: string): string {
  const first = !have.length && !own.length && !ask;
  return "THE CHOSEN DIRECTIONS:\n" + (dirs.length ? dirs.map((d) => "- " + d).join("\n") : "(none given)") +
    (have.length ? "\n\nCAPABILITIES ALREADY ON THE TABLE:\n" + have.map((c) => "- " + c.title).join("\n") : "") +
    (own.length ? "\n\nThe client adds these of their own — keep their titles exactly:\n" + own.map((t) => "- " + t).join("\n") : "") +
    (ask ? "\n\nThe client asks: " + ask : "") +
    (first ? "\n\nSuggest 3 to 5 Capabilities the organisation must build to deliver these Directions, drawn from them and the SWOT." : "\n\nReturn ONLY the new rows" + (own.length || ask ? "" : " — add 2 that are not already on the table") + ".") +
    " Capabilities are never scored. For each give a kind: gap (" + CAP_KIND_SAYS.gap + "), transformation (" + CAP_KIND_SAYS.transformation + ") or enabler (" + CAP_KIND_SAYS.enabler + ");" +
    " `serves` — the titles of the Directions above it supports, word for word; and ownedBy — a function key from the list.\n\nFUNCTIONS (for ownedBy):\n" + fnLines(fns) +
    "\n\nIn `reply`, say in one sentence what you suggested.";
}

/* The model's rows, cut to shape: an owner not on the list is dropped rather
   than guessed at; a `serves` naming a Direction not on the table is dropped. */
export function modelOptions(raw: unknown, fns: Fn[], ownTitles: string[]): Option[] {
  const keys = new Set(fns.map((f) => f.key));
  const own = new Set(ownTitles.map((t) => t.toLowerCase()));
  return (Array.isArray(raw) ? raw : []).map((x: any) => {
    const o = cleanOption({ ...x, go: false, mark: "" });
    if (!keys.has(o.ownedBy)) o.ownedBy = "";
    o.mark = own.has(o.title.toLowerCase()) ? "yours" : "new";
    return o;
  }).filter((o) => o.title);
}
export function modelCaps(raw: unknown, fns: Fn[], dirs: string[], ownTitles: string[], first: boolean): Cap[] {
  const keys = new Set(fns.map((f) => f.key));
  const dl = new Map(dirs.map((d) => [d.toLowerCase(), d]));
  const own = new Set(ownTitles.map((t) => t.toLowerCase()));
  return (Array.isArray(raw) ? raw : []).map((x: any) => {
    const c = cleanCap({ ...x, keep: first, mark: "" });
    if (!keys.has(c.ownedBy)) c.ownedBy = "";
    c.serves = c.serves.map((t) => dl.get(t.toLowerCase()) || "").filter(Boolean);
    c.mark = own.has(c.title.toLowerCase()) ? "yours" : first ? "" : "new";
    if (c.mark === "yours") c.keep = true;
    return c;
  }).filter((c) => c.title);
}

/* ── SAVING: WHAT WAS CHOSEN, AS A DELIVERABLE ───────────────────────── */
export function dirsText(s: Dirs, fnName: (k: string) => string): string {
  const out: string[] = [];
  if (s.mode === "directions") {
    out.push("DIRECTIONS:");
    goes(s).forEach((o, k) => out.push((k + 1) + ". " + o.title + " — U" + o.urgency + " × I" + o.importance + " × E" + o.ease + " = " + (scoreOf(o) ?? "—") + "/" + SCORE_MAX + (o.ownedBy ? " · " + fnName(o.ownedBy) : "")));
  }
  if (s.mode === "capabilities" || s.withCaps) {
    out.push("CAPABILITIES:");
    kept(s).forEach((c, k) => out.push((k + 1) + ". " + c.title + (c.kind ? " — " + CAP_KIND_WORD[c.kind] : "") + (c.serves.length ? " · serves " + c.serves.join(", ") : "") + (c.ownedBy ? " · " + fnName(c.ownedBy) : "")));
  }
  return out.join("\n");
}
export const dirsTitle = (s: Dirs, placeWord: string) =>
  ((s.mode === "capabilities" ? "Capabilities — " : "Directions — ") + (oneLine(placeWord) || "this place")).slice(0, MAX_TITLE);
export async function saveDirs(c: Q, chat: { id: string; place: string; section: Section; title: string }, s: Dirs, placeWord: string, fnName: (k: string) => string, by: string) {
  const title = dirsTitle(s, placeWord);
  const body = { text: dirsText(s, fnName), directions: s.mode === "directions" ? goes(s) : [], capabilities: s.mode === "capabilities" || s.withCaps ? kept(s) : [] };
  const note = "Built in “" + chat.title + "”";
  const hit = await c.query("SELECT id FROM copilot_deliverables WHERE place = $1 AND section = $2 AND lower(title) = lower($3) ORDER BY created_at DESC LIMIT 1",
    [chat.place, chat.section, title]);
  if (hit.rows[0]) { const id = str(hit.rows[0].id); return { deliverableId: id, n: await addVersion(c as any, id, { body, note, by }), title }; }
  const id = await newDeliverable(c as any, { place: chat.place, section: chat.section, title, type: s.mode, kind: "promotable",
    approach: s.mode === "capabilities" ? "Capabilities" : "Urgency × Importance × Ease", body, note, by, chatId: chat.id, chatTitle: chat.title });
  return { deliverableId: id, n: 1, title };
}
