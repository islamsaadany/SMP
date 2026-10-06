/* ══ EXECUTION, IN THE COPILOT (spec 064 §6, §495; the signed-off
   design-mockups/copilot-directions-flow/2026-10-05_directions-flow-v2.html,
   panel F) ═══════════════════════════════════════════════════════════════
   An Execution chat first asks how long the plan is — the whole of next year,
   this quarter to the year end, or months picked — and then walks the plan's
   Directions and Capabilities one at a time, drafting each one's measures
   (with a target for the period) and its tactics (with an owner and the
   quarters it runs in). The quarters offered are the PERIOD's quarters only.

   ONE STATE under `extra.execution` (no migration — the section was in the
   CHECK since §490). The to-do list is worked out on every read, never
   stored (§53.5); `saved` is the product's (§42).

   ONE CALENDAR YEAR, AT MOST TWELVE MONTHS, which is what the plan period
   on Setup › Planning & reporting cycle can hold (§308). */
import { oneLine, MAX_TITLE, newDeliverable, addVersion } from "./copilot.ts";

type Q = { query: (text: string, values?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }> };
const str = (v: unknown) => (v == null ? "" : String(v));
const brk = () => process.env.SMP_BREAK || "";

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const COMPILES = ["Sum", "Count", "Latest", "Average"];
export const MAX_MEASURES = 6, MAX_TACTICS = 8, MAX_ITEMS = 16;

export type Period = { y: number; m1: number; m2: number };
export type Measure = { name: string; target: string; compile: string };
export type Tactic = { name: string; owner: string; quarters: number[] };
export type Item = { kind: "direction" | "capability"; planId: string; title: string; ownedBy: string; measures: Measure[]; tactics: Tactic[]; drafted: boolean };
export type Exec = { period: Period | null; items: Item[]; cursor: number; reply: string; saved: { deliverableId: string; n: number; title: string } | null };

/* ── THE PERIOD ─────────────────────────────────────────────────────── */
export const quarterOf = (m: number) => Math.ceil(m / 3);
export function periodQuarters(p: Period | null): number[] {
  if (!p) return [1, 2, 3, 4];
  const out: number[] = [];
  for (let q = quarterOf(p.m1); q <= quarterOf(p.m2); q++) out.push(q);
  return out;
}
export const periodLength = (p: Period) => p.m2 - p.m1 + 1;
export const monthWord = (m: number, y: number) => MONTHS[m - 1] + " " + y;
export function periodWords(p: Period): string {
  const qs = periodQuarters(p);
  return (p.m1 === 1 && p.m2 === 12 ? "Full year " + p.y : MONTHS[p.m1 - 1] + "–" + MONTHS[p.m2 - 1] + " " + p.y) +
    " (" + (qs.length === 1 ? "Q" + qs[0] : "Q" + qs[0] + "–Q" + qs[qs.length - 1]) + ")";
}
export function validPeriod(p: any): Period | null {
  const y = Number(p && p.y), m1 = Number(p && p.m1), m2 = Number(p && p.m2);
  if (!Number.isInteger(y) || y < 2000 || y > 2100) return null;
  if (!Number.isInteger(m1) || !Number.isInteger(m2) || m1 < 1 || m2 > 12 || m1 > m2) return null;
  return { y, m1, m2 };
}
/* The two ready answers, worked out from today (spec §6.1): the whole of the
   coming year — this one while we are still in its first quarter — and the
   rest of this year from the start of the current quarter. */
export function periodChoices(today: Date) {
  const y = today.getFullYear(), m = today.getMonth() + 1;
  const full: Period = { y: m <= 3 ? y : y + 1, m1: 1, m2: 12 };
  const rest: Period = { y, m1: (quarterOf(m) - 1) * 3 + 1, m2: 12 };
  return { full, rest };
}

export const newExec = (items: Item[]): Exec => ({ period: null, items, cursor: 0, reply: "", saved: null });

const cleanQs = (v: unknown, allowed: number[]) =>
  [...new Set((Array.isArray(v) ? v : []).map(Number).filter((q) => allowed.includes(q)))].sort();
const cleanMeasure = (x: any): Measure => ({ name: oneLine(x && x.name).slice(0, 200), target: oneLine(x && x.target).slice(0, 60),
  compile: COMPILES.includes(str(x && x.compile)) ? str(x.compile) : "" });
const cleanTactic = (x: any, allowed: number[]): Tactic => ({ name: oneLine(x && x.name).slice(0, 200), owner: oneLine(x && x.owner).slice(0, 120),
  quarters: brk() === "exec-any-quarter" ? cleanQs(x && x.quarters, [1, 2, 3, 4]) : cleanQs(x && x.quarters, allowed) });
const ID = /^[A-Za-z0-9:_.-]{1,80}$/;
export function cleanItem(x: any, allowed: number[]): Item {
  return {
    kind: x && x.kind === "capability" ? "capability" : "direction",
    planId: ID.test(str(x && x.planId)) ? str(x.planId) : "",
    title: oneLine(x && x.title).slice(0, 160), ownedBy: oneLine(x && x.ownedBy).slice(0, 120),
    measures: (Array.isArray(x && x.measures) ? x.measures : []).map(cleanMeasure).filter((m: Measure) => m.name).slice(0, MAX_MEASURES),
    tactics: (Array.isArray(x && x.tactics) ? x.tactics : []).map((t: any) => cleanTactic(t, allowed)).filter((t: Tactic) => t.name).slice(0, MAX_TACTICS),
    drafted: !!(x && x.drafted),
  };
}

/* The page's version, cut to shape. The items' identities (kind, planId,
   title, owner) are the product's: the page may change what is UNDER an item,
   never which items there are (§42). */
export function sanitizeExec(raw: unknown, stored: Exec): Exec {
  const j: any = raw && typeof raw === "object" ? raw : {};
  const s: Exec = { ...stored };
  const qs = periodQuarters(s.period);
  if (Array.isArray(j.items)) s.items = stored.items.map((it, k) => {
    const got = cleanItem(j.items[k], qs);
    return { ...it, measures: got.measures, tactics: got.tactics, drafted: it.drafted || got.drafted };
  });
  if ("cursor" in j) s.cursor = Math.max(0, Math.min(s.items.length - 1, Number(j.cursor) || 0));
  return s;
}
export function storedExec(raw: unknown): Exec | null {
  if (!raw || typeof raw !== "object") return null;
  const j: any = raw;
  const period = validPeriod(j.period);
  const qs = periodQuarters(period);
  const s: Exec = {
    period, cursor: Math.max(0, Number(j.cursor) || 0), reply: str(j.reply).slice(0, 1200),
    items: (Array.isArray(j.items) ? j.items : []).map((x: any) => cleanItem(x, qs)).filter((i: Item) => i.title).slice(0, MAX_ITEMS),
    saved: j.saved && j.saved.deliverableId ? { deliverableId: str(j.saved.deliverableId), n: Number(j.saved.n) || 0, title: oneLine(j.saved.title) } : null,
  };
  s.cursor = Math.min(s.cursor, Math.max(0, s.items.length - 1));
  return s;
}
export async function execOf(c: Q, chatId: string): Promise<Exec | null> {
  const r = await c.query("SELECT extra->'execution' AS d FROM copilot_chats WHERE id = $1", [chatId]);
  return r.rows[0] ? storedExec(r.rows[0].d) : null;
}
export async function writeExec(c: Q, chatId: string, s: Exec): Promise<void> {
  await c.query("UPDATE copilot_chats SET extra = extra || jsonb_build_object('execution', $2::jsonb), last_at = now() WHERE id = $1",
    [chatId, JSON.stringify(s)]);
}
/* Changing the period takes every tactic's quarters back inside it — a
   quarter outside the plan is not a quarter this plan runs in. */
export function withPeriod(s: Exec, p: Period): Exec {
  const qs = periodQuarters(p);
  return { ...s, period: p, items: s.items.map((it) => ({ ...it, tactics: it.tactics.map((t) => ({ ...t, quarters: t.quarters.filter((q) => qs.includes(q)) })) })) };
}

/* ── THE TO-DO LIST, WORKED OUT ────────────────────────────────────── */
export type Todo = { key: string; title: string; status: string; state: "done" | "open" };
const itemDone = (it: Item) => it.measures.length > 0 && it.tactics.length > 0;
/* "1 measure", "2 tactics" — a word the platform writes itself, never a
   tenant label, so inflecting it is safe (§107.8 is about labels). */
const nOf = (n: number, w: string) => n + " " + w + (n === 1 ? "" : "s");

export function todoOf(s: Exec): Todo[] {
  const out: Todo[] = [{ key: "period", title: "Plan period", state: s.period ? "done" : "open", status: s.period ? periodWords(s.period) : "How long is this plan?" }];
  for (const it of s.items) out.push({ key: "item:" + it.planId, title: it.title, state: itemDone(it) ? "done" : "open",
    status: it.measures.length || it.tactics.length ? nOf(it.measures.length, "measure") + " · " + nOf(it.tactics.length, "tactic") : "Not drafted yet" });
  out.push({ key: "save", title: "Save", state: s.saved ? "done" : "open", status: s.saved ? "Saved as " + s.saved.title + " v" + s.saved.n : "Into the plan" });
  return out;
}
export const doneCount = (t: Todo[]) => t.filter((x) => x.state === "done").length;
export function finishBlocker(s: Exec): string {
  if (!s.period) return "Say how long the plan is first.";
  if (!s.items.length) return "There is nothing in the plan to set measures for yet.";
  if (brk() === "exec-finish-any") return "";
  const left = s.items.find((it) => !itemDone(it));
  return left ? "“" + left.title + "” still needs at least one measure and one tactic." : "";
}

/* ── WHAT THE MODEL READS AND RETURNS ────────────────────────────────── */
export function execInstruction(method: string): string {
  return "You are Forefront Consulting's strategy consultant, turning one strategic Direction or Capability into its execution plan." +
    "\nRULES: Use the plan, the SWOT and How we compete as evidence; never invent a figure. A measure says how we will know it worked, with a target for the plan period;" +
    " compile is one of Sum, Count, Latest, Average. A tactic is a piece of work with an owner (a role or a function, never an invented name) and the quarters it runs in," +
    " chosen ONLY from the quarters given. Return JSON in the shape asked, with no preamble." +
    (method.trim() ? "\n\nFOREFRONT'S METHOD:\n" + method.trim() : "");
}
export const DRAFT_SCHEMA = { type: "OBJECT", properties: { reply: { type: "STRING" },
  measures: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, target: { type: "STRING" }, compile: { type: "STRING" } }, required: ["name", "target", "compile"] } },
  tactics: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, owner: { type: "STRING" }, quarters: { type: "ARRAY", items: { type: "INTEGER" } } }, required: ["name", "owner", "quarters"] } } },
  required: ["reply", "measures", "tactics"] };
export function draftQuestion(s: Exec, it: Item, ask: string): string {
  const p = s.period as Period;
  const qs = periodQuarters(p);
  return "THE PLAN PERIOD: " + periodWords(p) + ". Quarters a tactic may run in: " + qs.map((q) => "Q" + q).join(", ") + ".\n\n" +
    (it.kind === "capability" ? "THE CAPABILITY: " : "THE DIRECTION: ") + it.title + (it.ownedBy ? " (owned by " + it.ownedBy + ")" : "") +
    (it.measures.length || it.tactics.length ? "\n\nALREADY DRAFTED (improve, keep what is good):\n" + it.measures.map((m) => "- measure: " + m.name + " · " + m.target).join("\n") + "\n" + it.tactics.map((t) => "- tactic: " + t.name).join("\n") : "") +
    (ask ? "\n\nThe client asks: " + ask : "") +
    "\n\nDraft 2 to 4 measures with targets for the period and 3 to 6 tactics. In `reply`, say in one sentence what you drafted.";
}

/* ── SAVING: THE DELIVERABLE ─────────────────────────────────────────── */
export function execText(s: Exec): string {
  const out: string[] = ["PLAN PERIOD: " + (s.period ? periodWords(s.period) : "—")];
  for (const it of s.items) {
    out.push("", (it.kind === "capability" ? "CAPABILITY: " : "DIRECTION: ") + it.title);
    it.measures.forEach((m) => out.push("  Measure: " + m.name + " — " + (m.target || "no target") + (m.compile ? " (" + m.compile + ")" : "")));
    it.tactics.forEach((t) => out.push("  Tactic: " + t.name + (t.owner ? " · " + t.owner : "") + (t.quarters.length ? " · " + t.quarters.map((q) => "Q" + q).join(" ") : "")));
  }
  return out.join("\n");
}
export const execTitle = (placeWord: string) => ("Execution — " + (oneLine(placeWord) || "this place")).slice(0, MAX_TITLE);
export async function saveExec(c: Q, chat: { id: string; place: string; title: string }, s: Exec, placeWord: string, by: string) {
  const title = execTitle(placeWord);
  const body = { text: execText(s), period: s.period, items: s.items };
  const note = "Built in “" + chat.title + "”";
  const hit = await c.query("SELECT id FROM copilot_deliverables WHERE place = $1 AND section = 'execution' AND lower(title) = lower($2) ORDER BY created_at DESC LIMIT 1", [chat.place, title]);
  if (hit.rows[0]) { const id = str(hit.rows[0].id); return { deliverableId: id, n: await addVersion(c as any, id, { body, note, by }), title }; }
  const id = await newDeliverable(c as any, { place: chat.place, section: "execution", title, type: "execution", kind: "promotable",
    approach: "Measures and tactics for the plan period", body, note, by, chatId: chat.id, chatTitle: chat.title });
  return { deliverableId: id, n: 1, title };
}
