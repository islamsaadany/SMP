/* ── MEETING NOTES — the rules, and the rows (spec 055) ──────────────────
   One meeting, one note (Islam, 2026-09-16: "title date attendees and text
   is enough"): a title, a date, the attendees, and the text typed while the
   meeting runs. The assistant the platform already has turns the notes into
   MINUTES in six parts; the minutes are the email; the note stays editable
   after a send and is sent again as updated minutes. Everything a page, the
   email and the check have to agree about is here once (§53.5).

   THE OFFICE ONLY, BY RULE (decision 8, spec 054 decision 2's reason): the
   seat the door established is asked at the server, not only by leaving the
   entry off a menu. AND ANY OFFICE PERSON ON THE CLIENT MAY WRITE ANY NOTE
   (decision 8, taken with the drawing): notes are the office's shared record
   of a client and one person covers for another; who wrote and who sent is
   the accountability, kept on the row and on every send.

   WHO ATTENDS (decision 4): a register or office row by its KEY — the
   register renders the name and the address at draw time and at send time,
   so a rename or a corrected address reaches every note (§48, §74.2) — or a
   CASUAL attendee, a name and an email for this meeting only, never written
   to the register (the register is the client's people; this is one person
   at one meeting).

   THE DAY HELPERS ARE THE TRACKER'S OWN (lib/tracker.ts) rather than a
   second copy: the same zone, the same spelling, the same refusal of a date
   that cannot be read. A third module wanting them is the day they move to a
   file of their own. */
import { createRequire } from "node:module";
import type { PoolClient } from "pg";
import { calendarDay, todayIn, readableDay, isOffice, OFFICE_SEATS, officeRows, namesOf, shortNames, type Person } from "./tracker.ts";
import { placesFor } from "./place.ts";

export { calendarDay, todayIn, readableDay, isOffice, OFFICE_SEATS, officeRows, namesOf, shortNames };
export type { Person };

const need = createRequire(import.meta.url);
const A = need("./assistant.cjs") as {
  askJson: (o: Record<string, unknown>) => Promise<{ ok: boolean; json?: unknown; why?: string }>;
  configured: () => boolean;
};
const MAILER = need("./mailer.cjs") as {
  configured: () => boolean;
  sendOne: (o: { fromName: string; to: string; subject: string; html: string; replyTo?: string }) => Promise<string | null>;
};
const MAIL = need("./mail-html.cjs") as { html: (o: Record<string, unknown>) => string; footerDefault: (org: string) => string };

/* THE REAL CLIENT, not the tracker's structural `{ query }` — `placesFor()`
   is the spine's answer to where a person sits (lib/place.ts) and takes one,
   and asking it is the point (§53.5): a copy of that query here would be the
   second answer to a question the register already answers. */
type Q = PoolClient;
const str = (v: unknown) => (v == null ? "" : String(v));
const brk = () => (typeof process !== "undefined" ? process.env.SMP_BREAK || "" : "");
export const oneLine = (v: unknown): string => str(v).replace(/\s+/g, " ").trim();
export const trimmed = (v: unknown): string => str(v).replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").trim();

export const TITLE_MAX = 200;
export const RAW_MAX = 60000;
export const PART_MAX = 2000;
export const ITEMS_MAX = 60;

/* ══ attendees ═══════════════════════════════════════════════════════ */
/* A register row by key, or a casual name and address (decision 4). */
export type Attendee = { key: string } | { name: string; email: string };
export const isKeyed = (a: Attendee): a is { key: string } => "key" in a;

const EMAIL = /^[^@\s,;]+@[^@\s,;]+\.[^@\s,;]+$/;
export function emailOf(v: unknown): string {
  const s = str(v).trim().toLowerCase();
  return EMAIL.test(s) ? s : "";
}

/* What arrives is a list somebody posted; what is kept is a list this code
   can stand behind: a keyed attendee once, a casual one with a real address
   and a name, and nothing else (§96.2 in the other direction — an entry that
   is neither is dropped, never guessed at). */
export function attendeesOf(v: unknown): Attendee[] {
  const out: Attendee[] = [];
  const keys = new Set<string>(), mails = new Set<string>();
  for (const x of Array.isArray(v) ? v : []) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    if (typeof o.key === "string" && o.key.trim()) {
      const k = o.key.trim();
      if (keys.has(k)) continue;
      keys.add(k); out.push({ key: k });
    } else {
      const name = oneLine(o.name).slice(0, 120), email = emailOf(o.email);
      if (!name || !email || mails.has(email)) continue;
      mails.add(email); out.push({ name, email });
    }
    if (out.length >= 80) break;
  }
  return out;
}

/* ══ the minutes ═════════════════════════════════════════════════════
   Six parts (spec 055 §3, agreed 2026-09-16): summary · discussed · agreed ·
   actions (what · who · by when) · open · next. A fixed shape, so the
   platform puts each part in its box rather than parsing prose. */
export type ActionLine = { what: string; who: string; when: string };
export type Minutes = { summary: string; discussed: string[]; agreed: string[]; actions: ActionLine[]; open: string[]; next: string };
export const PARTS = ["summary", "discussed", "agreed", "actions", "open", "next"] as const;
export const PART_WORD: Record<(typeof PARTS)[number], string> = {
  summary: "Summary", discussed: "Discussed", agreed: "Agreed", actions: "Actions", open: "Open", next: "Next meeting",
};
export const emptyMinutes = (): Minutes => ({ summary: "", discussed: [], agreed: [], actions: [], open: [], next: "" });

const lines = (v: unknown): string[] =>
  (Array.isArray(v) ? v : []).map((x) => oneLine(x).slice(0, PART_MAX)).filter(Boolean).slice(0, ITEMS_MAX);
const actionLines = (v: unknown): ActionLine[] =>
  (Array.isArray(v) ? v : []).map((x) => {
    const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
    return { what: oneLine(o.what).slice(0, PART_MAX), who: oneLine(o.who).slice(0, 120), when: oneLine(o.when).slice(0, 60) };
  }).filter((a) => a.what).slice(0, ITEMS_MAX);

/* Shaped, never trusted: what the model or the page posted is read into the
   six parts and anything else is dropped. Null is "not minutes at all" — a
   string, a number, a list — and the caller refuses rather than storing a
   shape nothing can draw. */
export function minutesOf(v: unknown): Minutes | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  return {
    summary: trimmed(o.summary).slice(0, PART_MAX),
    discussed: lines(o.discussed), agreed: lines(o.agreed),
    actions: actionLines(o.actions), open: lines(o.open),
    next: oneLine(o.next).slice(0, PART_MAX),
  };
}
export function minutesEmpty(m: Minutes | null): boolean {
  return !m || (!m.summary && !m.discussed.length && !m.agreed.length && !m.actions.length && !m.open.length && !m.next);
}

/* A SECOND REFINE ADDS AND NEVER REWRITES (decision 6, spec 055 §3): every
   line the writer holds survives verbatim, a returned line that is not
   already there is appended, and the two prose parts are taken only where
   the writer left them empty. Held here in code rather than trusted to the
   prompt, because a prompt is a request and this is a rule — and the check
   asserts an edited line survives whatever the stand-in model returns. */
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
export function mergeMinutes(have: Minutes, add: Minutes): Minutes {
  if (brk() === "rewrite-on-refine") return add;
  const join = (a: string[], b: string[]) => {
    const seen = new Set(a.map(norm));
    return a.concat(b.filter((x) => { const n = norm(x); if (!n || seen.has(n)) return false; seen.add(n); return true; })).slice(0, ITEMS_MAX);
  };
  const seenA = new Set(have.actions.map((x) => norm(x.what)));
  return {
    summary: have.summary || add.summary,
    discussed: join(have.discussed, add.discussed),
    agreed: join(have.agreed, add.agreed),
    actions: have.actions.concat(add.actions.filter((x) => { const n = norm(x.what); if (!n || seenA.has(n)) return false; seenA.add(n); return true; })).slice(0, ITEMS_MAX),
    open: join(have.open, add.open),
    next: have.next || add.next,
  };
}

/* ══ what the assistant is told (spec 055 §3, agreed 2026-09-16) ═══════
   Written once, here; the check reads it from here. */
export const PROMPT = [
  "You are writing the minutes of a meeting for a strategy office.",
  "You are given raw notes typed during a meeting with the client named below, on the date named, with the attendees named.",
  "Rewrite them as minutes in six parts: summary, discussed, agreed, actions, open, next.",
  "Keep every fact. Invent nothing. Add nothing the notes do not say.",
  "Keep names as written. An action's owner must be one of the attendees, and only where the notes name one; otherwise leave who empty. Fill by-when only where the notes say when; otherwise leave it empty.",
  "Where a point is unclear, keep it and mark it with a question mark rather than guessing.",
  "Write in the language the notes are in; if they mix Arabic and English, follow the majority.",
  "Plain, short sentences. No greetings, no filler, no sign-off.",
  "summary is two or three lines on what the meeting was about. discussed, agreed and open are short items, one per line. next is the next meeting if one was set, otherwise empty.",
].join("\n");
export const PROMPT_AGAIN =
  "\nMINUTES ALREADY WRITTEN are given beside the notes. The writer has edited them. Return the minutes with what the notes now carry ADDED; never rewrite, reword or drop a line already there.";

export const MINUTES_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    discussed: { type: "array", items: { type: "string" } },
    agreed: { type: "array", items: { type: "string" } },
    actions: { type: "array", items: { type: "object", properties: { what: { type: "string" }, who: { type: "string" }, when: { type: "string" } }, required: ["what", "who", "when"] } },
    open: { type: "array", items: { type: "string" } },
    next: { type: "string" },
  },
  required: ["summary", "discussed", "agreed", "actions", "open", "next"],
};

export type Named = { name: string; email: string; place: string; casual: boolean; key: string | null };

/* THE NOTES THE MODEL IS HANDED: the head first, so the client, the date and
   the attendees are facts in the corpus and not only in the instruction. */
export function corpusFor(n: { title: string; metOn: string; raw: string; minutes: Minutes | null }, tenantName: string, attendees: Named[]): string {
  const head = "Client: " + tenantName + "\nMeeting: " + (n.title || "(untitled)") + "\nDate: " + readableDay(n.metOn) +
    "\nAttendees: " + (attendees.map((a) => a.name).join(", ") || "(none named)");
  const again = n.minutes && !minutesEmpty(n.minutes) ? "\n\n=== MINUTES ALREADY WRITTEN ===\n" + JSON.stringify(n.minutes, null, 1) : "";
  return head + "\n\n=== RAW NOTES ===\n" + n.raw + again;
}

export async function refine(n: { title: string; metOn: string; raw: string; minutes: Minutes | null }, tenantName: string, attendees: Named[]): Promise<{ ok: true; minutes: Minutes } | { ok: false; why: string }> {
  if (!trimmed(n.raw)) return { ok: false, why: "There are no notes to refine yet." };
  if (!A.configured()) return { ok: false, why: "The assistant is not set up on this deployment, so the minutes are yours to write by hand." };
  const again = !!n.minutes && !minutesEmpty(n.minutes);
  const r = await A.askJson({
    instruction: PROMPT + (again ? PROMPT_AGAIN : ""),
    corpusName: "THE MEETING", corpusText: corpusFor(n, tenantName, attendees),
    question: again ? "Add what the notes now carry to the minutes already written." : "Write the minutes of this meeting.",
    schema: MINUTES_SCHEMA, needsCorpus: false, maxOutput: 6144,
  });
  if (!r.ok) return { ok: false, why: "The assistant could not refine the notes: " + (r.why || "no answer") + ". The minutes are untouched." };
  const got = minutesOf(r.json);
  if (!got || minutesEmpty(got)) return { ok: false, why: "The assistant answered in a shape the minutes cannot take. Nothing was changed." };
  return { ok: true, minutes: again ? mergeMinutes(n.minutes!, got) : got };
}

/* ══ the rows ═════════════════════════════════════════════════════════ */
export type Note = {
  id: string; title: string; metOn: string; attendees: Attendee[]; raw: string; minutes: Minutes | null;
  refinedAt: string | null; refinedBy: string; createdBy: string; createdAt: string; updatedAt: string;
  sends: number; lastSentAt: string | null; lastSentUpdate: boolean;
};
export type Who = { personKey: string | null; seat: string | null };

const COLS =
  "n.id, n.title, n.met_on::text AS met_on, n.attendees, n.raw, n.minutes, n.refined_at, n.refined_by, n.created_by, n.created_at, n.updated_at, " +
  "(SELECT count(*) FROM note_sends s WHERE s.note_id = n.id)::int AS sends, " +
  "(SELECT max(s.sent_at) FROM note_sends s WHERE s.note_id = n.id) AS last_sent_at, " +
  "COALESCE((SELECT s.is_update FROM note_sends s WHERE s.note_id = n.id ORDER BY s.sent_at DESC, s.id DESC LIMIT 1), false) AS last_update";

export function shape(r: Record<string, any>): Note {
  return {
    id: str(r.id), title: str(r.title), metOn: str(r.met_on), attendees: attendeesOf(r.attendees), raw: str(r.raw),
    minutes: r.minutes == null ? null : minutesOf(r.minutes),
    refinedAt: r.refined_at ? str(r.refined_at) : null, refinedBy: str(r.refined_by),
    createdBy: str(r.created_by), createdAt: str(r.created_at), updatedAt: str(r.updated_at),
    sends: Number(r.sends || 0), lastSentAt: r.last_sent_at ? str(r.last_sent_at) : null, lastSentUpdate: !!r.last_update,
  };
}

/* Newest meeting first; two on one day by when they were started. */
export async function listNotes(c: Q): Promise<Note[]> {
  const r = await c.query("SELECT " + COLS + " FROM notes n ORDER BY n.met_on DESC, n.created_at DESC");
  return r.rows.map(shape);
}
export async function oneNote(c: Q, id: string): Promise<Note | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const r = await c.query("SELECT " + COLS + " FROM notes n WHERE n.id = $1", [id]);
  return r.rows[0] ? shape(r.rows[0]) : null;
}
/* A new note is today's, with whoever starts it as its first attendee — the
   office person taking the notes was in the meeting. */
export async function newNote(c: Q, by: string, today: string): Promise<Note> {
  const att: Attendee[] = by ? [{ key: by }] : [];
  const r = await c.query("INSERT INTO notes (met_on, attendees, created_by) VALUES ($1, $2, $3) RETURNING id", [today, JSON.stringify(att), by]);
  return (await oneNote(c, str(r.rows[0].id)))!;
}
export type Patch = { title?: string; metOn?: string; attendees?: Attendee[]; raw?: string; minutes?: Minutes | null };
export async function setFields(c: Q, id: string, p: Patch, by?: string): Promise<Note | null> {
  const sets: string[] = [], args: unknown[] = [];
  const put = (col: string, v: unknown) => { args.push(v); sets.push(col + " = $" + args.length); };
  if (p.title !== undefined) put("title", oneLine(p.title).slice(0, TITLE_MAX));
  if (p.metOn !== undefined) put("met_on", p.metOn);
  if (p.attendees !== undefined) put("attendees", JSON.stringify(attendeesOf(p.attendees)));
  if (p.raw !== undefined) put("raw", trimmed(p.raw).slice(0, RAW_MAX));
  if (p.minutes !== undefined) {
    put("minutes", p.minutes == null ? null : JSON.stringify(p.minutes));
    if (by !== undefined) { put("refined_by", by); sets.push("refined_at = now()"); }
  }
  if (!sets.length) return oneNote(c, id);
  sets.push("updated_at = now()");
  args.push(id);
  const r = await c.query("UPDATE notes SET " + sets.join(", ") + " WHERE id = $" + args.length + " RETURNING id", args);
  return r.rows[0] ? oneNote(c, id) : null;
}
export async function deleteNote(c: Q, id: string): Promise<boolean> {
  const r = await c.query("DELETE FROM notes WHERE id = $1", [id]);
  return (r.rowCount || 0) > 0;
}

/* WHO A KEY IS: the register's name, address and place, read at draw time
   and again at send time (§48). Somebody the register no longer holds keeps
   their key on the note and reads as it, with no address. */
export type Register = Map<string, { name: string; email: string; place: string; active: boolean }>;
export async function registerOf(c: Q): Promise<Register> {
  const places = new Map((await placesFor(c)).map((p) => [p.at, p.label]));
  const r = await c.query(
    "SELECT key, COALESCE(NULLIF(name, ''), key) AS name, COALESCE(extra->>'email', '') AS email, unit_key, fn_key, " +
    "COALESCE(extra->>'active', 'true') <> 'false' AS active FROM people ORDER BY idx, key");
  const out: Register = new Map();
  for (const x of r.rows as any[]) {
    const at = x.unit_key ? str(x.unit_key) : x.fn_key ? "fn:" + str(x.fn_key) : "";
    out.set(str(x.key), { name: str(x.name), email: emailOf(x.email), place: places.get(at) || "", active: !!x.active });
  }
  return out;
}
export function namedOf(list: Attendee[], reg: Register, office: Set<string>): Named[] {
  return list.map((a) => {
    if (isKeyed(a)) {
      const p = reg.get(a.key);
      return { name: p ? p.name : a.key, email: p ? p.email : "", place: p ? (office.has(a.key) ? "office" : p.place) : "", casual: false, key: a.key };
    }
    return { name: a.name, email: a.email, place: "this meeting only", casual: true, key: null };
  });
}

/* ══ the send (decisions 5, 6, 10) ═══════════════════════════════════ */
export type SendRow = { id: string; sentBy: string; sentAt: string; isUpdate: boolean; subject: string; to: { name: string; email: string; ok: boolean; error: string | null }[]; minutes: Minutes };
export async function sendsOf(c: Q, noteId: string): Promise<SendRow[]> {
  const r = await c.query("SELECT id, sent_by, sent_at, is_update, subject, recipients, minutes FROM note_sends WHERE note_id = $1 ORDER BY sent_at DESC, id DESC", [noteId]);
  return r.rows.map((x: any) => ({ id: str(x.id), sentBy: str(x.sent_by), sentAt: str(x.sent_at), isUpdate: !!x.is_update, subject: str(x.subject),
    to: Array.isArray(x.recipients) ? x.recipients : [], minutes: minutesOf(x.minutes) || emptyMinutes() }));
}

/* readableDay() carries the year whenever it is not the CURRENT year, and
   nothing here hands it a today — so a record that outlives its year always
   says which one, and appending the year beside it printed it twice. */
export function subjectFor(n: { title: string; metOn: string; sends: number }): string {
  return (n.sends > 0 ? "Updated minutes: " : "Minutes: ") + (n.title || "Meeting") + " — " + readableDay(n.metOn);
}

const e = (s: unknown) => str(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/* THE MINUTES INSIDE THE PLATFORM'S OWN EMAIL SHELL (decision 10): tables
   and inline styles for the reason lib/mail-html.cjs gives at its top —
   email is not the web. Six parts, a heading only over a part that holds
   something (§45.2), the actions a three-column table. */
export function minutesEmailBody(m: Minutes, meta: string): string {
  const ink = "#1B2330", quiet = "#6B7686", line = "#E3E8EF";
  const h = (t: string) => '<p style="margin:18px 0 5px;font:600 11.5px/1.4 Helvetica,Arial,sans-serif;letter-spacing:.09em;text-transform:uppercase;color:' + quiet + '">' + e(t) + "</p>";
  const p = (t: string) => '<p style="margin:0 0 6px;font:400 15px/1.6 Georgia,\'Times New Roman\',serif;color:' + ink + '">' + e(t) + "</p>";
  const ul = (xs: string[]) => '<ul style="margin:0;padding-left:20px;font:400 15px/1.6 Georgia,\'Times New Roman\',serif;color:' + ink + '">' + xs.map((x) => "<li style=\"margin:0 0 3px\">" + e(x) + "</li>").join("") + "</ul>";
  const th = (t: string) => '<th align="left" style="font:600 11px/1.4 Helvetica,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:' + quiet + ';padding:0 6px 4px 0;border-bottom:1px solid ' + line + '">' + t + "</th>";
  const td = (t: string) => '<td valign="top" style="font:400 14px/1.5 Helvetica,Arial,sans-serif;color:' + ink + ';padding:6px 6px 6px 0;border-bottom:1px solid ' + line + '">' + (e(t) || "&mdash;") + "</td>";
  let out = '<p style="margin:0 0 18px;padding-bottom:14px;border-bottom:1px solid ' + line + ';font:400 13px/1.6 Helvetica,Arial,sans-serif;color:' + quiet + '">' + e(meta) + "</p>";
  if (m.summary) out += h("Summary") + p(m.summary);
  if (m.discussed.length) out += h("Discussed") + ul(m.discussed);
  if (m.agreed.length) out += h("Agreed") + ul(m.agreed);
  if (m.actions.length) out += h("Actions") +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tr>' + th("What") + th("Who") + th("By when") + "</tr>" +
    m.actions.map((a) => "<tr>" + td(a.what) + td(a.who) + td(a.when) + "</tr>").join("") + "</table>";
  if (m.open.length) out += h("Open") + ul(m.open);
  if (m.next) out += h("Next meeting") + p(m.next);
  return out;
}
/* The same minutes as plain text, for the platform's own record of what it
   sent (`messages.body`) and for a mail list's preview line. */
export function minutesText(m: Minutes): string {
  const parts: string[] = [];
  if (m.summary) parts.push("SUMMARY\n" + m.summary);
  if (m.discussed.length) parts.push("DISCUSSED\n" + m.discussed.map((x) => "- " + x).join("\n"));
  if (m.agreed.length) parts.push("AGREED\n" + m.agreed.map((x) => "- " + x).join("\n"));
  if (m.actions.length) parts.push("ACTIONS\n" + m.actions.map((a) => "- " + a.what + (a.who ? " — " + a.who : "") + (a.when ? " — by " + a.when : "")).join("\n"));
  if (m.open.length) parts.push("OPEN\n" + m.open.map((x) => "- " + x).join("\n"));
  if (m.next) parts.push("NEXT MEETING\n" + m.next);
  return parts.join("\n\n");
}

export type SendOut = { ok: true; sent: number; failed: number; skipped: string[]; id: string } | { ok: false; why: string };
/* ONE EMAIL PER ATTENDEE WITH AN ADDRESS, and a copy to the sender (decision
   10). The sender's name is on the message and replies go to them. The rows
   are written BEFORE the sends (lib/mail-api.cjs's own reason: a send that
   half succeeds and then loses the function is the case a record exists
   for) and the outcome is written after each. The minutes are copied INTO
   the send row, because the note goes on being edited (decision 6) and the
   record of what went out must not move with it. */
export async function sendMinutes(c: Q, n: Note, who: Who, tenantName: string, brand: { bar: string; accent: string }): Promise<SendOut> {
  const m = n.minutes;
  if (minutesEmpty(m)) return { ok: false, why: "The minutes are empty — refine the notes, or write them, before sending." };
  if (!MAILER.configured()) return { ok: false, why: "No mail is set up on this deployment, so nothing can be sent from here." };
  const reg = await registerOf(c);
  const office = new Set((await officeRows(c)).map((p) => p.key));
  const named = namedOf(n.attendees, reg, office);
  const to: { name: string; email: string; key: string | null }[] = [];
  const skipped: string[] = [];
  const seen = new Set<string>();
  for (const a of named) {
    if (!a.email) { skipped.push(a.name); continue; }
    if (seen.has(a.email)) continue;
    seen.add(a.email); to.push({ name: a.name, email: a.email, key: a.key });
  }
  const me = who.personKey ? reg.get(who.personKey) : null;
  const meName = me ? me.name : "The Strategy Office", meEmail = me ? me.email : "";
  if (meEmail && !seen.has(meEmail) && brk() !== "no-copy-to-sender") { seen.add(meEmail); to.push({ name: meName, email: meEmail, key: who.personKey }); }
  if (!to.length) return { ok: false, why: "Nobody on this meeting has an email address, so there is nobody to send the minutes to." };

  const subject = subjectFor(n);
  const meta = readableDay(n.metOn) + " · " + named.map((a) => a.name).join(", ") + " · written up by " + meName;
  const html = MAIL.html({
    org: tenantName, eyebrow: "Minutes of meeting", title: n.title || "Meeting", preheader: m!.summary || subject,
    bodyHtml: minutesEmailBody(m!, meta), accent: brand.accent, panel: brand.bar,
    footer: "Sent by " + meName + " from the Strategy Management Platform. Reply to this email to reach them. " +
      "If these minutes are corrected, you will receive them again, marked as updated.",
  });
  const text = minutesText(m!);
  const msg = (await c.query(
    "INSERT INTO messages (by_key, by_name, subject, body, kind, total) VALUES ($1,$2,$3,$4,'minutes',$5) RETURNING id",
    [who.personKey || "", meName, subject, text, to.length])).rows[0];
  const results: SendRow["to"] = [];
  let sent = 0, failed = 0;
  for (const r of to) {
    let id: string | null = null, err: string | null = null;
    try { id = await MAILER.sendOne({ fromName: meName, to: r.email, subject, html, replyTo: meEmail || undefined }); if (!id) err = "The provider did not answer for this one."; }
    catch (x) { err = (x as Error).message || "Could not reach the mail service."; }
    if (err) failed++; else sent++;
    results.push({ name: r.name, email: r.email, ok: !err, error: err });
    await c.query("INSERT INTO message_recipients (message_id, person_key, person_name, address, ok, error, provider_id) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [msg.id, r.key, r.name, r.email, !err, err, id]);
  }
  await c.query("UPDATE messages SET sent = $2, failed = $3 WHERE id = $1", [msg.id, sent, failed]);
  const row = (await c.query(
    "INSERT INTO note_sends (note_id, sent_by, is_update, subject, recipients, minutes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
    [n.id, who.personKey || "", n.sends > 0, subject, JSON.stringify(results), JSON.stringify(brk() === "snapshot-moves" ? {} : m)])).rows[0];
  return { ok: true, sent, failed, skipped, id: str(row.id) };
}

/* The colours the email wears: the client's own bar and accent, one row of
   `org`, and the shipped defaults where a client has chosen none. */
export async function brandOf(c: Q): Promise<{ bar: string; accent: string }> {
  const r = await c.query("SELECT extra->'branding'->>'bar' AS bar, extra->'branding'->>'accent' AS accent FROM org");
  const hex = (v: unknown) => (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : "");
  return { bar: hex(r.rows[0]?.bar), accent: hex(r.rows[0]?.accent) };
}
