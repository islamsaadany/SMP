/* ══ THE STRATEGY COPILOT — ITS RULES AND ITS STATEMENTS (spec 064) ═══════
   Stage 1 of the plan (specs/064-strategy-copilot/plan.md §5): the shelf with
   no AI yet. A chat is a named conversation about one PLACE and one SECTION;
   a deliverable is what gets kept, and it keeps every version it has had.

   THE PLACE IS THE PRODUCT'S OWN WORD (§54): `group`, `co:<k>`, a unit key,
   `fn:<k>`, `cap:<id>` — the same strings a role is held at and the frozen
   shell calls TARGET, so the tab passes what it is standing on and nothing
   is translated on the way (§53.5). It is checked for SHAPE here and not for
   existence, because a place is the client's graph's to answer and a chat
   about a unit later retired is still a record of what was said.

   A VERSION IS NEVER EDITED OR DELETED (decisions §3.6, §3.7). An inline edit
   and a restore each ADD one, numbered from the maximum inside the same
   transaction with the deliverable row locked, so two presses at once cannot
   both write v4 — and the unique index would refuse the second if they did.

   Every statement runs inside `withTenant` (lib/tenant.ts); none of them
   names a tenant, which is why none of them can reach another's rows. */
import type { PoolClient } from "pg";

type Q = { query: PoolClient["query"] };
const str = (v: unknown) => (v == null ? "" : String(v));
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : str(v));

export const SECTIONS = ["foundation", "analysis", "directions", "execution", "advisory"] as const;
export type Section = (typeof SECTIONS)[number];
export const SECTION_WORD: Record<Section, string> = {
  foundation: "Foundation", analysis: "Analysis", directions: "Directions", execution: "Execution", advisory: "Advisory",
};
export function isSection(s: unknown): s is Section { return typeof s === "string" && (SECTIONS as readonly string[]).includes(s); }

/* The shape of a place word — never its existence (above). Anchored and
   short, because it is written into rows and read back into addresses. */
const PLACE = /^(group|(co|fn|cap):[A-Za-z0-9_-]{1,60}|[A-Za-z0-9_-]{1,60})$/;
export function isPlace(p: unknown): p is string { return typeof p === "string" && PLACE.test(p); }

/* THE OFFICE ONLY (decision record v0.4 §2, Islam: the Super user and the SMO
   team). The same two seats the Internal Tracker opens to, asked of the seat
   the door established — one list of office seats, not a second (§53.5). */
export { isOffice } from "./tracker.ts";
export type Who = { personKey: string | null; seat: string | null };

/* WHETHER THE COPILOT TAB IS DRAWN FOR THIS DOCUMENT (spec 064): the server's
   own gate, answered once per document by the two callers that serve the
   frozen shell (Strategy's page and the Setup document), so the tab exists
   exactly where the api would answer (§61). `have` is what this person may
   open here, which already carries the client's own list. */
import { isOffice as officeSeat } from "./tracker.ts";
export function copilotStampFor(have: readonly string[], seat: unknown): boolean {
  return have.includes("copilot") && officeSeat(seat);
}

/* WHO MAY DELETE A CHAT (plan §7.1, Islam): whoever started it, or the Super
   user. A deliverable is never deleted — its versions are the record. An
   office login the register has not placed has no key, so it can delete only
   by being the Super user: an empty key must never match an empty
   `created_by`, or every chat nobody signed would be anybody's. */
export function mayDeleteChat(chat: { by: string }, who: Who): boolean {
  if (who.seat === "super") return true;
  return !!who.personKey && chat.by === who.personKey;
}

/* ABOUT THIRTY PAGES (plan §7.2): a paste longer than this is refused with
   the reason rather than cut, because a silently shortened document is a
   draft built on something nobody pasted (§96.2). */
export const MAX_MESSAGE = 120_000;
export const MAX_TITLE = 160;

/* What the chat answers until the AI is connected (plan §5, stage 1). Said
   in words, never a spinner, and never dressed as an answer: it is the
   PRODUCT speaking, marked as such, so nobody mistakes it for the Copilot
   having considered their question (§125's rule). */
export const NOT_CONNECTED =
  "The Copilot is not connected yet. What you type here is kept with this chat, and the AI will answer in it once it is switched on.";

export function oneLine(v: unknown): string { return str(v).replace(/\s+/g, " ").trim(); }

/* ── CHATS ──────────────────────────────────────────────────────────── */
export type Chat = { id: string; place: string; section: Section; title: string; by: string; at: string; last: string; count: number };
const CHAT_COLS = "c.id, c.place, c.section, c.title, c.created_by, c.created_at, c.last_at";
const chatOf = (r: any): Chat => ({ id: str(r.id), place: str(r.place), section: r.section, title: str(r.title),
  by: str(r.created_by), at: iso(r.created_at), last: iso(r.last_at), count: Number(r.count) || 0 });

export async function chatsOn(c: Q, place: string, section: Section): Promise<Chat[]> {
  const r = await c.query(
    "SELECT " + CHAT_COLS + ", (SELECT count(*) FROM copilot_messages m WHERE m.chat_id = c.id AND m.who = 'person') AS count " +
    "FROM copilot_chats c WHERE c.place = $1 AND c.section = $2 ORDER BY c.last_at DESC, c.created_at DESC", [place, section]);
  return r.rows.map(chatOf);
}
export async function oneChat(c: Q, id: string): Promise<Chat | null> {
  const r = await c.query("SELECT " + CHAT_COLS + ", 0 AS count FROM copilot_chats c WHERE c.id = $1", [id]);
  return r.rows[0] ? chatOf(r.rows[0]) : null;
}
export async function newChat(c: Q, a: { place: string; section: Section; title: string; by: string }): Promise<Chat> {
  const r = await c.query(
    "INSERT INTO copilot_chats (place, section, title, created_by) VALUES ($1, $2, $3, $4) " +
    "RETURNING id, place, section, title, created_by, created_at, last_at, 0 AS count",
    [a.place, a.section, a.title, a.by]);
  return chatOf(r.rows[0]);
}
export async function renameChat(c: Q, id: string, title: string): Promise<void> {
  await c.query("UPDATE copilot_chats SET title = $2 WHERE id = $1", [id, title]);
}
export async function deleteChat(c: Q, id: string): Promise<void> {
  await c.query("DELETE FROM copilot_chats WHERE id = $1", [id]);
}

export type Message = { id: string; who: "person" | "ai"; by: string; body: string; part: unknown; at: string };
export async function messagesOf(c: Q, chatId: string): Promise<Message[]> {
  const r = await c.query("SELECT id, who, by_key, body, part, at FROM copilot_messages WHERE chat_id = $1 ORDER BY id", [chatId]);
  return r.rows.map((x: any) => ({ id: str(x.id), who: x.who, by: str(x.by_key), body: str(x.body), part: x.part ?? null, at: iso(x.at) }));
}
/* WHAT IS TYPED IS KEPT, and — until stage 2 — answered by the product's own
   line, marked `notConnected` so the screen draws it as the product and never
   as the AI (§125). Both rows in one transaction with the chat's last touch,
   so the rail's order and the conversation cannot disagree. */
export async function say(c: Q, chatId: string, body: string, by: string): Promise<void> {
  await c.query("INSERT INTO copilot_messages (chat_id, who, by_key, body) VALUES ($1, 'person', $2, $3)", [chatId, by, body]);
  await c.query("INSERT INTO copilot_messages (chat_id, who, body, part) VALUES ($1, 'ai', $2, $3)",
    [chatId, NOT_CONNECTED, JSON.stringify({ kind: "notConnected" })]);
  await c.query("UPDATE copilot_chats SET last_at = now() WHERE id = $1", [chatId]);
}

/* ── DELIVERABLES AND THEIR VERSIONS ─────────────────────────────────── */
export const KINDS = ["promotable", "copilot-only"] as const;
export type Kind = (typeof KINDS)[number];
export function isKind(s: unknown): s is Kind { return typeof s === "string" && (KINDS as readonly string[]).includes(s); }

export type Deliverable = { id: string; place: string; section: Section; type: string; kind: Kind; title: string;
  approach: string; by: string; at: string; latest: number; latestBy: string; latestAt: string };
const delivOf = (r: any): Deliverable => ({ id: str(r.id), place: str(r.place), section: r.section, type: str(r.type),
  kind: r.kind, title: str(r.title), approach: str(r.approach), by: str(r.created_by), at: iso(r.created_at),
  latest: Number(r.latest) || 0, latestBy: str(r.latest_by), latestAt: iso(r.latest_at) });
const DELIV_SELECT =
  "SELECT d.id, d.place, d.section, d.type, d.kind, d.title, d.approach, d.created_by, d.created_at, " +
  "v.n AS latest, v.by_key AS latest_by, v.at AS latest_at FROM copilot_deliverables d " +
  "LEFT JOIN LATERAL (SELECT n, by_key, at FROM copilot_versions x WHERE x.deliverable_id = d.id ORDER BY n DESC LIMIT 1) v ON true ";

export async function deliverablesOn(c: Q, place: string, section: Section): Promise<Deliverable[]> {
  const r = await c.query(DELIV_SELECT + "WHERE d.place = $1 AND d.section = $2 ORDER BY coalesce(v.at, d.created_at) DESC", [place, section]);
  return r.rows.map(delivOf);
}
export async function oneDeliverable(c: Q, id: string): Promise<Deliverable | null> {
  const r = await c.query(DELIV_SELECT + "WHERE d.id = $1", [id]);
  return r.rows[0] ? delivOf(r.rows[0]) : null;
}

export type Version = { n: number; body: unknown; note: string; by: string; at: string; chatId: string | null;
  chatTitle: string; restoredFrom: number | null; assumptions: unknown[]; pasted: boolean; gaps: unknown[] };
export async function versionsOf(c: Q, id: string): Promise<Version[]> {
  const r = await c.query(
    "SELECT n, body, note, by_key, at, chat_id, chat_title, restored_from, assumptions, pasted, gaps " +
    "FROM copilot_versions WHERE deliverable_id = $1 ORDER BY n DESC", [id]);
  return r.rows.map((x: any) => ({ n: Number(x.n), body: x.body, note: str(x.note), by: str(x.by_key), at: iso(x.at),
    chatId: x.chat_id ? str(x.chat_id) : null, chatTitle: str(x.chat_title),
    restoredFrom: x.restored_from == null ? null : Number(x.restored_from),
    assumptions: Array.isArray(x.assumptions) ? x.assumptions : [], pasted: !!x.pasted, gaps: Array.isArray(x.gaps) ? x.gaps : [] }));
}

/* A body is what a version holds. Stage 1 keeps free text; the shapes of
   plan §4 arrive with Save in stage 3 and sit in the same column. */
export function bodyOf(v: unknown): { text: string } | null {
  if (v && typeof v === "object" && typeof (v as any).text === "string") return { text: (v as any).text };
  return null;
}

/* THE NEXT NUMBER, UNDER A LOCK (above). `FOR UPDATE` on the deliverable row
   is what serialises two presses; the unique constraint is the backstop. */
async function nextN(c: Q, id: string): Promise<number> {
  await c.query("SELECT id FROM copilot_deliverables WHERE id = $1 FOR UPDATE", [id]);
  const r = await c.query("SELECT coalesce(max(n), 0) + 1 AS n FROM copilot_versions WHERE deliverable_id = $1", [id]);
  /* THE CHECK'S BREAK: numbering from a count rather than the maximum is the
     fault §96.2 records for row ids, and must turn checks/copilot.mjs red. */
  if ((process.env.SMP_BREAK || "") === "count-versions") {
    const k = await c.query("SELECT count(*) AS n FROM copilot_versions WHERE deliverable_id = $1", [id]);
    return Number(k.rows[0].n) + 1;
  }
  return Number(r.rows[0].n);
}

export async function newDeliverable(c: Q, a: { place: string; section: Section; title: string; type: string; kind: Kind;
  approach: string; body: unknown; note: string; by: string; chatId: string | null; chatTitle: string }): Promise<string> {
  const d = await c.query(
    "INSERT INTO copilot_deliverables (place, section, type, kind, title, approach, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id",
    [a.place, a.section, a.type, a.kind, a.title, a.approach, a.by]);
  const id = str(d.rows[0].id);
  await c.query(
    "INSERT INTO copilot_versions (deliverable_id, n, body, note, by_key, chat_id, chat_title) VALUES ($1, 1, $2, $3, $4, $5, $6)",
    [id, JSON.stringify(a.body ?? {}), a.note, a.by, a.chatId, a.chatTitle]);
  return id;
}

/* AN EDIT ADDS A VERSION (decisions §3.6) — never an UPDATE of the last one. */
export async function addVersion(c: Q, id: string, a: { body: unknown; note: string; by: string }): Promise<number> {
  const n = await nextN(c, id);
  await c.query("INSERT INTO copilot_versions (deliverable_id, n, body, note, by_key) VALUES ($1, $2, $3, $4, $5)",
    [id, n, JSON.stringify(a.body ?? {}), a.note, a.by]);
  return n;
}

/* A RESTORE ADDS A VERSION TOO (decisions §3.7): the old body comes back as
   the newest one, marked with where it came from, and nothing in between is
   lost. Restoring the version that is already the latest is refused rather
   than stored as a copy of itself. */
export async function restoreVersion(c: Q, id: string, from: number, by: string): Promise<number | "same" | "missing"> {
  const src = await c.query("SELECT body, assumptions, pasted, gaps FROM copilot_versions WHERE deliverable_id = $1 AND n = $2", [id, from]);
  if (!src.rows[0]) return "missing";
  const n = await nextN(c, id);
  if (n - 1 === from) return "same";
  const s = src.rows[0];
  await c.query(
    "INSERT INTO copilot_versions (deliverable_id, n, body, note, by_key, restored_from, assumptions, pasted, gaps) " +
    "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    [id, n, JSON.stringify(s.body ?? {}), "Restored from v" + from, by, from,
     JSON.stringify(s.assumptions ?? []), !!s.pasted, JSON.stringify(s.gaps ?? [])]);
  return n;
}
