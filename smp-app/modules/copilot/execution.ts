/* ── THE EXECUTION CHAT, ON THE SERVER (spec 064 §6, §495) ──
   The Directions chat's own shape (./directions.ts): every write judged
   against the STORED row (§42); the model asked with no transaction open
   (§289); a failure said in words (§171). The rules live in
   lib/copilot-execution.ts. */
import { withTenant } from "../../lib/tenant.ts";
import { type Who, oneLine, isPlace, oneChat, newChat, MAX_TITLE, NO_KEY, failedLine } from "../../lib/copilot.ts";
import { askFlowJson, configured } from "../../lib/copilot-ask.ts";
import { partsOf } from "../../lib/copilot-settings.ts";
import { doorPool } from "../../lib/auth.ts";
import {
  type Exec, MAX_ITEMS, COMPILES, MONTHS, newExec, cleanItem, sanitizeExec, storedExec, execOf, writeExec, withPeriod,
  validPeriod, periodChoices, periodQuarters, periodWords, periodLength, todoOf, doneCount, finishBlocker,
  execInstruction, DRAFT_SCHEMA, draftQuestion, saveExec,
} from "../../lib/copilot-execution.ts";

type Out = { status: number; body: Record<string, unknown> };
const out = (status: number, body: Record<string, unknown>): Out => ({ status, body });
const refused = (status: number, why: string): Out => out(status, { ok: false, why });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const brk = () => process.env.SMP_BREAK || "";
const MAX_CONTEXT = 24_000;
const ARCHIVED = "This chat is archived. Restore it to keep talking.";
const SAVED_ALREADY = "This is saved. Start a new chat to make the next version.";
const NOT_EXEC = "This is not an Execution chat.";

export async function execView(c: any, chat: { id: string }) {
  const s = await execOf(c, chat.id);
  if (!s) return {};
  const todo = todoOf(s);
  const ch = periodChoices(new Date());
  return { exec: s, execTodo: todo, execDone: doneCount(todo), execBlocker: finishBlocker(s),
    execWords: { quarters: periodQuarters(s.period), period: s.period ? periodWords(s.period) : "", length: s.period ? periodLength(s.period) : 0,
      compiles: COMPILES, months: MONTHS, choices: { full: ch.full, fullWord: periodWords(ch.full), rest: ch.rest, restWord: periodWords(ch.rest) } } };
}
export async function execProgress(c: any, ids: string[]): Promise<Record<string, { done: number; of: number }>> {
  if (!ids.length) return {};
  const r = await c.query("SELECT id, extra->'execution' AS d FROM copilot_chats WHERE id = ANY($1::uuid[]) AND extra ? 'execution'", [ids]);
  const m: Record<string, { done: number; of: number }> = {};
  for (const x of r.rows) { const s = storedExec(x.d); if (s) { const t = todoOf(s); m[String(x.id)] = { done: doneCount(t), of: t.length }; } }
  return m;
}

export const EXEC_ACTS = ["newExecution", "execPeriod", "execSave", "execFinish"];
export const EXEC_ASKS = ["execDraft"];

export async function execAct(c: any, b: any, who: Who): Promise<Out> {
  const kind = String(b.act || "");
  const by = who.personKey || "";
  if (kind === "newExecution") {
    const place = String(b.place || "");
    if (!isPlace(place)) return refused(400, "Which place?");
    /* The plan's Directions and Capabilities, as the page reads them. Only
       their names and keys are taken; what is drafted under them is the
       chat's own work. */
    const items = (Array.isArray(b.items) ? b.items : []).map((x: any) => cleanItem({ kind: x && x.kind, planId: x && x.planId, title: x && x.title, ownedBy: x && x.ownedBy }, [1, 2, 3, 4]))
      .filter((i: any) => i.title).slice(0, MAX_ITEMS);
    const chat = await newChat(c, { place, section: "execution", title: oneLine(b.title).slice(0, MAX_TITLE) || "Execution", by });
    await writeExec(c, chat.id, newExec(items));
    return out(200, { ok: true, chat: { ...chat, exec: true }, ...(await execView(c, chat)) });
  }
  const id = String(b.id || "");
  if (!UUID.test(id)) return refused(400, "Which chat?");
  const chat = await oneChat(c, id);
  if (!chat) return refused(404, "That chat is not here any more.");
  if (chat.archived) return refused(400, ARCHIVED);
  const stored = await execOf(c, id);
  if (!stored) return refused(400, NOT_EXEC);
  if (stored.saved) return refused(400, SAVED_ALREADY);

  if (kind === "execPeriod") {
    const ch = periodChoices(new Date());
    const p = b.choice === "full" ? ch.full : b.choice === "rest" ? ch.rest : validPeriod(b.period);
    if (!p) return refused(400, "A plan period is months in ONE year, the first before the last.");
    await writeExec(c, id, withPeriod(stored, p));
    return out(200, { ok: true, ...(await execView(c, chat)) });
  }
  if (kind === "execSave") {
    await writeExec(c, id, sanitizeExec(b.exec, stored));
    return out(200, { ok: true, ...(await execView(c, chat)) });
  }
  if (kind === "execFinish") {
    const why = finishBlocker(stored);
    if (why) return refused(400, why);
    const r = await saveExec(c, chat, stored, oneLine(b.placeWord).slice(0, 120) || chat.place, by);
    const s: Exec = { ...stored, saved: { deliverableId: r.deliverableId, n: r.n, title: r.title } };
    await writeExec(c, id, s);
    return out(200, { ok: true, saved: s.saved, ...(await execView(c, chat)) });
  }
  return refused(400, "Not something the Copilot does.");
}

const partText = async (keys: string[]) => {
  if (!configured() || brk() === "no-method") return "";
  try { return (await partsOf(doorPool())).filter((p) => keys.includes(p.key) && p.text.trim()).map((p) => "## " + p.title + "\n\n" + p.text.trim()).join("\n\n"); }
  catch { return ""; }
};

/* Draft the item under the cursor. Read, ask, write (§289). */
export async function execAsk(tenantId: string, b: any, _who: Who): Promise<Out> {
  const id = String(b.id || "");
  if (!UUID.test(id)) return refused(400, "Which chat?");
  const placeWord = oneLine(b.placeWord).slice(0, 120);
  const context = String(b.context ?? "").slice(0, MAX_CONTEXT);
  const ask = oneLine(b.ask).slice(0, 1000);
  const step1 = await withTenant(tenantId, async (c) => {
    const chat = await oneChat(c, id);
    if (!chat) return refused(404, "That chat is not here any more.");
    if (chat.archived) return refused(400, ARCHIVED);
    const stored = await execOf(c, id);
    if (!stored) return refused(400, NOT_EXEC);
    if (stored.saved) return refused(400, SAVED_ALREADY);
    const s = b.exec ? sanitizeExec(b.exec, stored) : stored;
    if (!s.period) return refused(400, "Say how long the plan is first.");
    if (!s.items[s.cursor]) return refused(400, "There is nothing in the plan to set measures for yet.");
    if (b.exec) await writeExec(c, id, s);
    return { chat, s };
  });
  if ("status" in step1) return step1;
  const { chat, s } = step1;
  const it = s.items[s.cursor];
  const r = await askFlowJson({ instruction: execInstruction(await partText(["part9", "part10"])),
    corpus: "PLACE: " + (placeWord || chat.place) + "\n\n" + context, corpusName: "THE PLAN AS IT STANDS", parts: [],
    question: draftQuestion(s, it, ask), schema: DRAFT_SCHEMA, maxOutput: 8192 });
  if (!r.ok) {
    if (!(r as any).noKey) console.error("copilot: execution ask:", r.why);
    return refused(503, (r as any).noKey ? NO_KEY : failedLine(r.why));
  }
  const j: any = r.json || {};
  return withTenant(tenantId, async (c) => {
    const now = await execOf(c, id);
    if (!now || now.saved) return refused(400, SAVED_ALREADY);
    const k = now.cursor;
    const got = cleanItem({ ...now.items[k], measures: j.measures, tactics: j.tactics }, periodQuarters(now.period));
    if (!got.measures.length && !got.tactics.length) return refused(503, failedLine("the answer had nothing in it"));
    const items = now.items.map((x, i) => (i === k ? { ...x, measures: got.measures, tactics: got.tactics, drafted: true } : x));
    await writeExec(c, id, { ...now, items, reply: String(j.reply ?? "").trim().slice(0, 1200) });
    return out(200, { ok: true, ...(await execView(c, chat)) });
  });
}
