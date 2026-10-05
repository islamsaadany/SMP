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

export const SECTIONS = ["foundation", "analysis", "compete", "directions", "capabilities", "execution", "advisory"] as const;
export type Section = (typeof SECTIONS)[number];
export const SECTION_WORD: Record<Section, string> = {
  foundation: "Foundation", analysis: "Analysis", compete: "How we compete", directions: "Directions",
  capabilities: "Capabilities", execution: "Execution", advisory: "Advisory",
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
import { MODULE_DEF } from "./modules.ts";
export function copilotStampFor(have: readonly string[], seat: unknown): boolean {
  return have.includes("copilot") && officeSeat(seat);
}

/* ── VIEW OR EDIT, PER OFFICE SEAT (Islam, 2026-10-01; the signed-off
   design-mockups/copilot-access/2026-10-01_copilot-column.html) ─────────
   The grant lives in the client's own access map under the area MODULE_DEF
   declares (a role row, the area key), so Strategy's Roles & access writes it
   through its ordinary save and the authoriser judges it as `access` — the
   Super user's alone (§89). An absent row reads as the area's SHIPPED state
   (§30.2: absent is "not answered yet", never "denied"), which is EDIT, so
   the office keeps what it had the day this ships. A seat that is not the
   office's is NONE by rule whatever the map holds: the column draws a dash
   for every client role ("office only for now"). ONE answer for the screen's
   stamp and the api's gate. */
export const COPILOT_AREA = MODULE_DEF.copilot.areas[0];
export type CopilotGrant = "edit" | "view" | "none";
export function copilotGrant(seat: unknown, stored: string | null | undefined): CopilotGrant {
  if (!officeSeat(seat)) return "none";
  const g = stored == null ? COPILOT_AREA.shipped : stored;
  return g === "edit" || g === "view" ? g : "none";
}
/* The stored cell for this seat's role, or null when the map holds none.
   The seat and the role are the same word for the office (super, smoteam). */
export async function storedCopilotGrant(c: PoolClient, seat: unknown): Promise<string | null> {
  if (typeof seat !== "string") return null;
  const r = await c.query("select grant_ from access_grants where role_key = $1 and page_key = $2", [seat, COPILOT_AREA.key]);
  return r.rows.length ? String(r.rows[0].grant_) : null;
}

/* WHO MAY DELETE A CHAT (§453, Islam 2026-10-01, reversing plan §7.1's
   "whoever started it"): a chat is ARCHIVED, never deleted, by anybody in
   the office; deleting is the Super user's alone and only of a chat already
   archived, so nothing leaves the list and the record in one press. That is
   §89's destruction rule (`mayDestroy`), asked of the seat the door set. A
   deliverable is never deleted — its versions are the record. */
export function mayDeleteChat(chat: { archived: string }, who: Who): boolean {
  /* The check's break deletes a live chat, which must turn it red (§94.5). */
  if (process.env.SMP_BREAK === "delete-live") return who.seat === "super";
  return who.seat === "super" && !!chat.archived;
}

/* ABOUT THIRTY PAGES (plan §7.2): a paste longer than this is refused with
   the reason rather than cut, because a silently shortened document is a
   draft built on something nobody pasted (§96.2). */
export const MAX_MESSAGE = 120_000;
export const MAX_TITLE = 160;

/* WHAT THE PRODUCT SAYS WHEN THE AI CANNOT (stage 2). Said in words and
   marked as the PRODUCT speaking, never dressed as an answer, so nobody
   mistakes it for the Copilot having considered their question (§125's rule).
   A row written by stage 1 carries `notConnected` and is still drawn as the
   product; nothing is migrated. */
export const NO_KEY =
  "The Copilot's AI is not switched on for this platform: no key is set. What you typed is kept with this chat, and it will be answered here once the key is added.";
export function failedLine(why: string): string {
  return "The Copilot could not answer just now (" + oneLine(why).slice(0, 200) + "). Your message is kept — send it again to retry.";
}

export function oneLine(v: unknown): string { return str(v).replace(/\s+/g, " ").trim(); }

/* ── CHATS ──────────────────────────────────────────────────────────── */
/* `archived` is when it was archived, or "" — stored in `extra` as an
   ABSENCE (§50.6), so no migration and a restored chat is byte-shaped like
   one never archived. */
export type Chat = { id: string; place: string; section: Section; title: string; by: string; at: string; last: string; count: number; archived: string; guided: boolean };
const CHAT_COLS = "c.id, c.place, c.section, c.title, c.created_by, c.created_at, c.last_at, c.extra->>'archivedAt' AS archived, (c.extra ? 'flow') AS guided";
const chatOf = (r: any): Chat => ({ id: str(r.id), place: str(r.place), section: r.section, title: str(r.title),
  by: str(r.created_by), at: iso(r.created_at), last: iso(r.last_at), count: Number(r.count) || 0, archived: str(r.archived), guided: r.guided === true });

/* The live list, or (`archived`) the archived one — never both at once, so
   the rail draws exactly one of them. */
export async function chatsOn(c: Q, place: string, section: Section, archived = false): Promise<Chat[]> {
  const r = await c.query(
    "SELECT " + CHAT_COLS + ", (SELECT count(*) FROM copilot_messages m WHERE m.chat_id = c.id AND m.who = 'person') AS count " +
    "FROM copilot_chats c WHERE c.place = $1 AND c.section = $2 AND (c.extra ? 'archivedAt') = $3 " +
    "ORDER BY c.last_at DESC, c.created_at DESC", [place, section, archived]);
  return r.rows.map(chatOf);
}
/* EVERY CHAT AND EVERY DELIVERABLE ON THE CLIENT (§456): the Copilot's own
   page lists them across places and sections, newest first. Archived chats
   are left out — the page is where work is FOUND, and an archived chat is
   reached from its own place's archived list. */
export async function allChats(c: Q): Promise<Chat[]> {
  const r = await c.query(
    "SELECT " + CHAT_COLS + ", (SELECT count(*) FROM copilot_messages m WHERE m.chat_id = c.id AND m.who = 'person') AS count " +
    "FROM copilot_chats c WHERE NOT (c.extra ? 'archivedAt') ORDER BY c.last_at DESC, c.created_at DESC LIMIT 500");
  return r.rows.map(chatOf);
}
export async function archiveChat(c: Q, id: string, by: string): Promise<void> {
  await c.query("UPDATE copilot_chats SET extra = extra || jsonb_build_object('archivedAt', now()::text, 'archivedBy', $2::text) WHERE id = $1", [id, by]);
}
export async function restoreChat(c: Q, id: string): Promise<void> {
  await c.query("UPDATE copilot_chats SET extra = extra - 'archivedAt' - 'archivedBy' WHERE id = $1", [id]);
}
export async function oneChat(c: Q, id: string): Promise<Chat | null> {
  const r = await c.query("SELECT " + CHAT_COLS + ", 0 AS count FROM copilot_chats c WHERE c.id = $1", [id]);
  return r.rows[0] ? chatOf(r.rows[0]) : null;
}
export async function newChat(c: Q, a: { place: string; section: Section; title: string; by: string }): Promise<Chat> {
  const r = await c.query(
    "INSERT INTO copilot_chats (place, section, title, created_by) VALUES ($1, $2, $3, $4) " +
    "RETURNING id, place, section, title, created_by, created_at, last_at, 0 AS count, '' AS archived, false AS guided",
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
/* ── SAYING SOMETHING, IN THREE STEPS (stage 2) ─────────────────────────
   The model is called BETWEEN two transactions, never inside one: a draft
   can take most of a minute, and a transaction held open that long pins a
   connection and holds the chat's rows for every other request (§289's
   lesson about what a transaction pins). So: record what was said and read
   what the AI needs (step 1), ask (the module), record the answer (step 2).
   What was typed is kept even when the answer never comes. */
export type FileMeta = { id: string; name: string; kind: string; size: number };
export type Said = { messageId: string; files: FileMeta[] };

export async function recordSaid(c: Q, chatId: string, a: { body: string; by: string; fileIds: string[]; pasted: boolean }): Promise<Said | "badFile"> {
  let files: FileMeta[] = [];
  if (a.fileIds.length) {
    const r = await c.query(
      "SELECT id, name, kind, size FROM copilot_files WHERE chat_id = $1 AND message_id IS NULL AND id = ANY($2::uuid[]) ORDER BY at",
      [chatId, a.fileIds]);
    if (r.rows.length !== a.fileIds.length) return "badFile";
    files = r.rows.map((x: any) => ({ id: str(x.id), name: str(x.name), kind: str(x.kind), size: Number(x.size) }));
  }
  const part = { kind: "said", files, pasted: a.pasted, words: a.body.trim() ? a.body.trim().split(/\s+/).length : 0 };
  const m = await c.query(
    "INSERT INTO copilot_messages (chat_id, who, by_key, body, part) VALUES ($1, 'person', $2, $3, $4) RETURNING id",
    [chatId, a.by, a.body, JSON.stringify(part)]);
  const messageId = str(m.rows[0].id);
  if (files.length) {
    await c.query("UPDATE copilot_files SET message_id = $2 WHERE chat_id = $1 AND id = ANY($3::uuid[])",
      [chatId, messageId, files.map((f) => f.id)]);
  }
  await c.query("UPDATE copilot_chats SET last_at = now() WHERE id = $1", [chatId]);
  return { messageId, files };
}

/* What the AI is sent from the chat: the conversation before this message
   (what the product said is left out — it is not the Copilot's), the
   assumptions already made, and every file SENT in the chat. PDFs travel as
   themselves, so only the most recent three do, or one chat of reports
   would outgrow the request. */
export type ChatMaterial = {
  history: { from_office: boolean; body: string }[];
  assumptions: string[];
  files: { name: string; kind: string; text: string; bytes: Buffer | null }[];
};
/* WHAT THE COPILOT SAID IS MORE THAN ITS WORDS (§460 B). It used to be
   sent its own earlier turns as `body` alone, so the drafts it had made and
   the buttons it had offered were gone by the next question — and it asked
   again how to start. The draft and the options ride with the words now, as
   compact text, capped so a long chat cannot outgrow the request. */
export function partMemo(part: any): string {
  if (process.env.SMP_BREAK === "words-only" || !part || part.kind !== "answer") return "";
  const out: string[] = [];
  const d = part.draft;
  if (d && Array.isArray(d.groups) && d.groups.length) {
    const lines = d.groups.map((g: any) => "  " + str(g.title) + ": " + (Array.isArray(g.items) ? g.items : []).map((it: any) =>
      (it.title ? str(it.title) + " — " : "") + str(it.text) + (it.score ? " (" + str(it.score) + ")" : "")).join("; "));
    out.push("[my draft" + (d.title ? " \"" + str(d.title) + "\"" : "") + ":\n" + lines.join("\n") + "]");
  }
  if (Array.isArray(part.options) && part.options.length) out.push("[options I offered: " + part.options.map((o: any) => str(o.label)).join(" · ") + "]");
  if (part.following) out.push("[following: " + str(part.following) + "]");
  /* §472: the turn that asked what to improve says so, so the next "enhance"
     is read as the answer to it rather than asked again. */
  if (part.askFirst) out.push("[asked what to improve]");
  if (part.saved && part.saved.n) out.push("[this draft was saved as v" + str(part.saved.n) + "]");
  const t = out.join("\n");
  return t ? "\n" + (t.length > 3000 ? t.slice(0, 3000) + "…]" : t) : "";
}

export async function materialOf(c: Q, chatId: string, beforeId: string): Promise<ChatMaterial> {
  const h = await c.query("SELECT who, body, part FROM copilot_messages WHERE chat_id = $1 AND id < $2 ORDER BY id", [chatId, beforeId]);
  const history = h.rows
    .filter((x: any) => x.who === "person" || !x.part || x.part.kind === "answer")
    .map((x: any) => {
      const names = x.part && Array.isArray(x.part.files) ? x.part.files.map((f: any) => f.name) : [];
      return { from_office: x.who === "ai", body: str(x.body) + (names.length ? "\n[attached: " + names.join(", ") + "]" : "") + (x.who === "ai" ? partMemo(x.part) : "") };
    });
  const ch = await c.query("SELECT assumptions FROM copilot_chats WHERE id = $1", [chatId]);
  const assumptions = Array.isArray(ch.rows[0]?.assumptions) ? ch.rows[0].assumptions.map(str) : [];
  const f = await c.query(
    "SELECT name, kind, text, CASE WHEN kind = 'pdf' THEN bytes END AS bytes, at FROM copilot_files " +
    "WHERE chat_id = $1 AND message_id IS NOT NULL ORDER BY at", [chatId]);
  const pdfKeep = new Set(f.rows.filter((x: any) => x.kind === "pdf").slice(-3).map((x: any) => x.name + "|" + iso(x.at)));
  const files = f.rows.filter((x: any) => x.kind !== "pdf" || pdfKeep.has(x.name + "|" + iso(x.at)))
    .map((x: any) => ({ name: str(x.name), kind: str(x.kind), text: str(x.text), bytes: x.bytes ?? null }));
  return { history, assumptions, files };
}

/* The answer, or the product's line when there is none. A new assumption is
   added to the chat's list once — the same words twice is one assumption. */
export async function recordAnswer(c: Q, chatId: string, a: { body: string; part: unknown; assumptions?: string[] }): Promise<void> {
  await c.query("INSERT INTO copilot_messages (chat_id, who, body, part) VALUES ($1, 'ai', $2, $3)",
    [chatId, a.body, JSON.stringify(a.part)]);
  if (a.assumptions && a.assumptions.length && (process.env.SMP_BREAK || "") !== "forget-assumptions") {
    const ch = await c.query("SELECT assumptions FROM copilot_chats WHERE id = $1 FOR UPDATE", [chatId]);
    const have: string[] = Array.isArray(ch.rows[0]?.assumptions) ? ch.rows[0].assumptions.map(str) : [];
    const low = new Set(have.map((x) => x.toLowerCase()));
    for (const x of a.assumptions) if (!low.has(x.toLowerCase())) { have.push(x); low.add(x.toLowerCase()); }
    await c.query("UPDATE copilot_chats SET assumptions = $2::jsonb WHERE id = $1", [chatId, JSON.stringify(have.slice(-40))]);
  }
  await c.query("UPDATE copilot_chats SET last_at = now() WHERE id = $1", [chatId]);
}

export async function assumptionsOf(c: Q, chatId: string): Promise<string[]> {
  const r = await c.query("SELECT assumptions FROM copilot_chats WHERE id = $1", [chatId]);
  return Array.isArray(r.rows[0]?.assumptions) ? r.rows[0].assumptions.map(str) : [];
}

/* ── FILES (plan §7.3) ──────────────────────────────────────────────── */
export async function attachFile(c: Q, chatId: string, a: { name: string; kind: string; size: number; bytes: Buffer; text: string; by: string }): Promise<FileMeta> {
  const r = await c.query(
    "INSERT INTO copilot_files (chat_id, name, kind, size, bytes, text, by_key) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
    [chatId, a.name, a.kind, a.size, a.bytes, a.text, a.by]);
  return { id: str(r.rows[0].id), name: a.name, kind: a.kind, size: a.size };
}
/* Only a file still waiting to be sent may be taken off: a sent one is part
   of what was said, and what was said is the record (decisions §3.6). */
export async function detachFile(c: Q, chatId: string, fileId: string): Promise<boolean> {
  const r = await c.query("DELETE FROM copilot_files WHERE chat_id = $1 AND id = $2 AND message_id IS NULL", [chatId, fileId]);
  return (r.rowCount || 0) > 0;
}
export async function pendingFiles(c: Q, chatId: string): Promise<FileMeta[]> {
  const r = await c.query("SELECT id, name, kind, size FROM copilot_files WHERE chat_id = $1 AND message_id IS NULL ORDER BY at", [chatId]);
  return r.rows.map((x: any) => ({ id: str(x.id), name: str(x.name), kind: str(x.kind), size: Number(x.size) }));
}
export async function pendingCount(c: Q, chatId: string): Promise<number> {
  const r = await c.query("SELECT count(*) AS n FROM copilot_files WHERE chat_id = $1 AND message_id IS NULL", [chatId]);
  return Number(r.rows[0].n) || 0;
}
export async function fileBytes(c: Q, fileId: string): Promise<{ name: string; kind: string; bytes: Buffer } | null> {
  const r = await c.query("SELECT name, kind, bytes FROM copilot_files WHERE id = $1", [fileId]);
  return r.rows[0] ? { name: str(r.rows[0].name), kind: str(r.rows[0].kind), bytes: r.rows[0].bytes } : null;
}
export async function oneMessage(c: Q, chatId: string, id: string): Promise<Message | null> {
  const r = await c.query("SELECT id, who, by_key, body, part, at FROM copilot_messages WHERE chat_id = $1 AND id = $2", [chatId, id]);
  const x = r.rows[0];
  return x ? { id: str(x.id), who: x.who, by: str(x.by_key), body: str(x.body), part: x.part ?? null, at: iso(x.at) } : null;
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
export async function allDeliverables(c: Q): Promise<Deliverable[]> {
  const r = await c.query(DELIV_SELECT + "ORDER BY coalesce(v.at, d.created_at) DESC LIMIT 500");
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

/* ── SAVING A DRAFT FROM THE CHAT (§472, Islam 2026-10-02) ─────────────
   "when I tried looks great save it it kept working … it should be saved to
   the deliverables rail on the left." There was no way to keep a draft at
   all, so "save it" only started another answer. A draft is now saved by
   the product, never by the model: a button under every draft, or a short
   "save it" typed into the chat, which saves the LATEST draft without
   asking the model anything.

   The deliverable stores the draft as text, because that is what a
   deliverable's version holds and what its edit box edits; the structured
   draft rides beside it. A draft whose title matches a deliverable already
   in this place and section is a NEW VERSION of it, never a second row —
   "the same thing" is the same title, which is what the rail shows. */
export function draftText(d: any): string {
  if (!d || !Array.isArray(d.groups)) return "";
  const out: string[] = [];
  if (d.title) out.push(str(d.title), "");
  for (const g of d.groups) {
    if (g && g.title) out.push(str(g.title).toUpperCase());
    for (const it of Array.isArray(g && g.items) ? g.items : []) {
      const head = (it.title ? str(it.title) : "") + (it.score ? (it.title ? " " : "") + "(" + str(it.score) + ")" : "");
      out.push("- " + (head ? head + ": " : "") + str(it.text));
      if (it.evidence) out.push("  Evidence: " + str(it.evidence));
    }
    out.push("");
  }
  return out.join("\n").trim();
}
export type SavedDraft = { deliverableId: string; n: number; title: string; isNew: boolean };
export async function saveDraftFrom(c: Q, chat: { id: string; place: string; section: Section; title: string }, messageId: string, by: string): Promise<SavedDraft | "notDraft" | "already"> {
  const m = await oneMessage(c, chat.id, messageId);
  const p: any = m && m.part;
  if (!m || m.who !== "ai" || !p || p.kind !== "answer" || !p.draft || !Array.isArray(p.draft.groups) || !p.draft.groups.length) return "notDraft";
  if (p.saved && p.saved.deliverableId) return "already";
  const title = (oneLine(p.draft.title) || (SECTION_WORD[chat.section] + " draft")).slice(0, MAX_TITLE);
  const body = { text: draftText(p.draft), draft: p.draft };
  const note = "Saved from “" + chat.title + "”";
  const hit = await c.query(
    "SELECT id FROM copilot_deliverables WHERE place = $1 AND section = $2 AND lower(title) = lower($3) ORDER BY created_at DESC LIMIT 1",
    [chat.place, chat.section, title]);
  let id: string, n: number, isNew: boolean;
  if (hit.rows[0]) { id = str(hit.rows[0].id); n = await addVersion(c, id, { body, note, by }); isNew = false; }
  else {
    id = await newDeliverable(c, { place: chat.place, section: chat.section, title, type: "free", kind: "copilot-only",
      approach: "", body, note, by, chatId: chat.id, chatTitle: chat.title });
    n = 1; isNew = true;
  }
  await c.query("UPDATE copilot_messages SET part = part || $3::jsonb WHERE chat_id = $1 AND id = $2",
    [chat.id, messageId, JSON.stringify({ saved: { deliverableId: id, n } })]);
  return { deliverableId: id, n, title, isNew };
}
/* The latest draft in a chat, for a typed "save it". */
export async function latestDraftId(c: Q, chatId: string): Promise<string | null> {
  const r = await c.query(
    "SELECT id FROM copilot_messages WHERE chat_id = $1 AND who = 'ai' AND part->>'kind' = 'answer' AND jsonb_typeof(part->'draft'->'groups') = 'array' AND jsonb_array_length(part->'draft'->'groups') > 0 ORDER BY id DESC LIMIT 1",
    [chatId]);
  return r.rows[0] ? str(r.rows[0].id) : null;
}
/* "save it", "looks great, save it", "save this please": a short message
   asking to save, and nothing else. Narrow on purpose — a longer message
   that mentions saving ("how would this save us money") goes to the model. */
export function isSaveAsk(text: string): boolean {
  const t = String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
  if (!t || t.length > 60) return false;
  if (!/\bsave\b/.test(t)) return false;
  if (/\b(don'?t|do not|not|no|never|without)\b/.test(t)) return false;
  return t.split(" ").length <= 8;
}
/* AN ENHANCEMENT ASKS FIRST (§472): a short ask to improve something the
   plan already holds, with nothing said about WHAT to improve. */
export function isBareEnhance(text: string): boolean {
  const t = String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
  if (!/\b(enhanc\w*|improv\w*|refin\w*|sharpen\w*|polish\w*|strengthen\w*|rework\w*|rewrit\w*|tweak\w*|better)\b/.test(t)) return false;
  return t.split(" ").length <= 8;
}

/* §476: an answer that says a revised text is waiting — "I've removed …",
   "here is the updated …", "press Save under the draft" — is a claim the page
   can only honour with a draft. Narrow on purpose: talk ABOUT a draft in
   general ("shall I draft one?") is not a claim that one is here. */
export function claimsDraft(reply: string): boolean {
  const t = String(reply || "").toLowerCase();
  return /\b(i'?ve|i have) (now )?(removed|updated|refined|revised|changed|rewritten|reworded|edited|adjusted|sharpened|tightened|replaced|added|dropped)\b/.test(t) ||
    /\bhere(?:'s| is) (?:the |your |a )?(?:revised|updated|refined|new|adjusted|reworded|sharper|tighter)\b/.test(t) ||
    /\b(press|click|use|hit) (the )?save\b/.test(t) || /\bsave button\b/.test(t) || /\b(under|below) the draft\b/.test(t);
}
export const NO_DRAFT = "The revised text did not come back with this answer, so there is nothing to save yet. Send your change again and it will be shown here with a Save button.";
