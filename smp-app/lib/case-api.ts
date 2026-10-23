/* Case studies (spec 067) — Forefront's own, never a client's.
 *
 * A ROUTE OF ITS OWN, /api/cases, beside the memory's and for the memory's
 * reason (lib/memory-api.ts's header): one action per request, one `Answer`
 * shape, and nothing added to the frozen platform endpoint.
 *
 * WHAT IT NEVER DOES: touch withTenant. `case_studies` is a platform table
 * read across clients by design (schema.sql, beside the table). The one
 * boundary it keeps is the memory's: a client's own staff never reach it.
 *
 * EVERY RULE IS ASKED HERE AND SENT TO THE PAGE AS A FLAG (`canWrite`,
 * `canOpen`), never re-derived in the browser — and asked AGAIN when the
 * press lands (§48.2). The rules are Islam's decisions, numbered as in the
 * spec: admins open a piece of work and ask for a write-up (11); the writer
 * or an admin writes it and marks it done (10); a draft is read by its
 * writer and the admins, a finished one by every consultant (2, 10).
 */
import crypto from "node:crypto";
import type { Pool, PoolClient } from "pg";
import type { SessionUser } from "./auth.ts";
import { draftOf, insertEntry, KINDS } from "./memory-api.ts";
import { ready as storeReady, beginUpload, putPart, finishUpload, signedReadFor, dropBlob } from "./blob-api.ts";
import { UPLOAD_PIECE_BYTES, MAX_FILE_BYTES, sizeLabel, safeFileName } from "./library.ts";

type Q = Pool | PoolClient;
export type Answer = { code: number; body: Record<string, unknown> };
const ok = (body: Record<string, unknown>): Answer => ({ code: 200, body: { ok: true, ...body } });
const no = (code: number, error: string): Answer => ({ code, body: { ok: false, error } });
const brk = () => process.env.SMP_BREAK || "";

/* The memory's own refusal sentence, for the memory's reason (§53.5). */
const NOT_YOURS = "That is not something this account opens.";
const GONE = "That case study is no longer here.";

export const STATES = ["running", "writing", "done"] as const;
/* The four prose sections, named ONCE — the reader, the save and the
   splitter's field names all walk this list (§104.7). */
export const PROSE = ["in_short", "client_why", "asked_to_do", "came_of_it"] as const;

const str = (v: unknown): string => (v == null ? "" : String(v));
const oneLine = (v: unknown, max = 200): string => str(v).replace(/\s*\n\s*/g, " ").trim().slice(0, max);
const prose = (v: unknown): string => str(v).replace(/\r\n?/g, "\n").trim().slice(0, 20000);
const month = (v: unknown): string => /^\d{4}-(0[1-9]|1[0-2])$/.test(str(v).trim()) ? str(v).trim() : "";
const day = (v: unknown): string | null => /^\d{4}-\d{2}-\d{2}$/.test(str(v).trim()) ? str(v).trim() : null;
const isUuid = (v: unknown): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str(v));
const list = (v: unknown, max = 50): any[] => (Array.isArray(v) ? v.slice(0, max) : []);

/* ── THE RULES, each with the switch that puts back what it forbids ── */
type Row = Record<string, any>;
export function mayOpen(me: SessionUser): boolean {
  return brk() === "anyone-opens" ? true : me.isAdmin;          /* RED: anybody opens a piece of work */
}
export function maySeeDraft(me: SessionUser, r: Row): boolean {
  if (r.state === "done") return true;
  return brk() === "drafts-open" ? true : me.isAdmin || r.writer_id === me.id;   /* RED: a draft read by all */
}
export function mayWrite(me: SessionUser, r: Row): boolean {
  if (brk() === "anyone-writes") return true;                   /* RED: anybody rewrites a case study */
  if (me.isAdmin) return true;
  return r.state !== "running" && r.writer_id === me.id;
}

/* ── READING ───────────────────────────────────────────────────────── */
const HEAD =
  "cs.id, cs.name, cs.started, cs.ended, cs.state, cs.due::text AS due, cs.done_at, cs.created_at, cs.updated_at, " +
  "cs.writer_id, cs.opened_by, t.key AS client_key, t.name AS client_name, t.industry, t.size, t.mark, t.past, " +
  "t.status AS client_status, w.name AS writer_name, w.email AS writer_email, o.name AS opener_name, a.name AS asker_name, " +
  "jsonb_array_length(cs.deliverables) AS n_deliverables, " +
  "(SELECT count(*)::int FROM memory_entries m WHERE m.case_id = cs.id) AS n_insights";
const FROM =
  "FROM case_studies cs JOIN tenants t ON t.id = cs.about_tenant_id " +
  "LEFT JOIN users w ON w.id = cs.writer_id LEFT JOIN users o ON o.id = cs.opened_by LEFT JOIN users a ON a.id = cs.asked_by";

function head(r: Row) {
  return {
    id: r.id, name: r.name, started: r.started, ended: r.ended, state: r.state, due: r.due,
    doneAt: r.done_at, createdAt: r.created_at,
    client: { key: r.client_key, name: r.client_name, industry: r.industry, size: r.size, mark: r.mark || null,
              past: !!r.past, archived: r.client_status === "retired" },
    writer: r.writer_id ? { id: r.writer_id, name: r.writer_name, email: r.writer_email } : null,
    openedBy: r.opener_name || "", askedBy: r.asker_name || "",
    deliverables: Number(r.n_deliverables) || 0, insights: Number(r.n_insights) || 0,
  };
}

async function rowFor(c: Q, id: unknown): Promise<Row | null> {
  if (!isUuid(id)) return null;
  const r = await c.query("SELECT cs.*, " + HEAD + " " + FROM + " WHERE cs.id = $1", [str(id)]);
  return r.rowCount ? r.rows[0] : null;
}

async function people(c: Q, ids: string[]): Promise<Map<string, { name: string; email: string }>> {
  const m = new Map<string, { name: string; email: string }>();
  const want = ids.filter(isUuid);
  if (!want.length) return m;
  const r = await c.query("SELECT id, name, email FROM users WHERE id = ANY($1::uuid[])", [want]);
  for (const u of r.rows) m.set(u.id, { name: u.name, email: u.email });
  return m;
}

/* The whole case study, as THIS person may see it. A draft that is not
   theirs comes back as its head and its insights only: the insights are the
   memory's and every consultant reads those (045 decision 1); the story is
   the writer's until they mark it done. */
async function full(c: Q, r: Row, me: SessionUser) {
  const see = maySeeDraft(me, r);
  const team = list(r.our_team);
  const names = await people(c, team.map((p) => str(p.id)));
  const ins = await c.query(
    "SELECT e.id, e.kind, e.title, e.next_person, e.occurred, e.created_at, e.author_id, u.name AS author_name " +
    "FROM memory_entries e JOIN users u ON u.id = e.author_id WHERE e.case_id = $1 ORDER BY e.created_at DESC", [r.id]);
  return {
    ...head(r),
    hidden: !see,
    canWrite: mayWrite(me, r), canAsk: mayOpen(me), canDrop: mayOpen(me),
    inShort: see ? r.in_short : "", clientWhy: see ? r.client_why : "",
    askedToDo: see ? r.asked_to_do : "", cameOfIt: see ? r.came_of_it : "",
    ourTeam: see ? team.filter((p) => names.has(str(p.id))).map((p) => ({ id: p.id, role: str(p.role), ...names.get(str(p.id))! })) : [],
    theirTeam: see ? list(r.their_team) : [],
    stages: see ? list(r.stages) : [],
    /* THE FILE'S PATH NEVER LEAVES THE SERVER — its name and size do, and
       the way to it is fileOpen, which asks the rule again (§261.10). */
    deliverables: see ? list(r.deliverables).map((d) => ({
      id: d.id, name: str(d.name), what: str(d.what), month: str(d.month),
      file: d.file && d.file.path ? { name: str(d.file.name), size: sizeLabel(d.file.bytes) } : null })) : [],
    whoToAsk: see ? list(r.who_to_ask) : [],
    insightList: ins.rows.map((e) => ({ id: e.id, kind: e.kind, title: e.title, next: e.next_person,
      occurred: e.occurred, when: e.created_at, author: e.author_name, mine: me.isAdmin || e.author_id === me.id })),
  };
}

/* ── WRITING: everything off the wire is trusted for nothing ─────────── */
async function officeIds(c: Q, ids: unknown[]): Promise<Set<string>> {
  const want = ids.map(str).filter(isUuid);
  if (!want.length) return new Set();
  const r = await c.query("SELECT id FROM users WHERE kind = 'office' AND id = ANY($1::uuid[])", [want]);
  return new Set(r.rows.map((u) => u.id));
}

/* A DELIVERABLE'S FILE IS NEVER TAKEN FROM THE BODY: it is carried over from
   the stored row by the deliverable's id, so a save cannot point a line at
   somebody else's file (the path is the permission, library.ts). */
function deliverablesOf(body: unknown, stored: any[]): any[] {
  const byId = new Map(list(stored, 200).map((d) => [str(d.id), d]));
  return list(body, 60).map((d) => {
    const id = isUuid(d?.id) && byId.has(str(d.id)) ? str(d.id) : crypto.randomUUID();
    const was = byId.get(id);
    return { id, name: oneLine(d?.name), what: oneLine(d?.what, 400), month: oneLine(d?.month, 40),
             file: brk() === "take-file" && d?.file ? d.file : (was && was.file) || null };   /* RED: a file named by the browser */
  }).filter((d) => d.name || d.what || d.file);
}

async function pastClient(c: Q, me: SessionUser, p: any): Promise<{ id: string } | Answer> {
  const name = oneLine(p?.name, 120);
  if (!name) return no(400, "A past client needs a name.");
  const key = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
  if (!key) return no(400, "That name does not make an address.");
  const taken = await c.query("SELECT name FROM tenants WHERE key = $1", [key]);
  if (taken.rowCount) return no(400, "There is already a client called " + taken.rows[0].name + ". Pick it from the list instead.");
  /* RETIRED FROM THE START, WITH NOTHING BEHIND THE DOOR (spec 067 §7): no
     graph, no people, no modules. It exists to be written about. */
  const t = await c.query(
    "INSERT INTO tenants (key, name, industry, size, status, archived_at, archived_by, past, modules) " +
    "VALUES ($1,$2,$3,$4,'retired',now(),$5,true,'[]'::jsonb) RETURNING id",
    [key, name, oneLine(p?.industry, 80), oneLine(p?.size, 40), me.email]);
  return { id: t.rows[0].id };
}

function contentTypeFor(name: string): string {
  const ext = (name.match(/\.([A-Za-z0-9]{2,5})$/) || [, ""])[1]!.toLowerCase();
  return ({ pdf: "application/pdf", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            zip: "application/zip", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", csv: "text/csv" } as Record<string, string>)[ext]
    || "application/octet-stream";
}
/* WHERE A DELIVERABLE'S FILE LIVES, built from two ids the server resolved —
   never a path a browser sent (library.ts filePath's rule). */
export function casePath(caseId: string, deliverableId: string, name: string): string {
  const seg = (s: string, n: number) => s.replace(/[^A-Za-z0-9._:-]/g, "-").slice(0, n);
  const ext = (name.match(/\.([A-Za-z0-9]{2,5})$/) || [, "bin"])[1]!.toLowerCase();
  return "cases/" + seg(caseId, 40) + "/" + seg(deliverableId, 40) + "." + seg(ext, 5);
}

/* ── THE ENDPOINT ───────────────────────────────────────────────────── */
export async function caseAction(pool: Pool, me: SessionUser, body: any): Promise<Answer> {
  if (me.kind === "client" && brk() !== "client-reads") return no(403, NOT_YOURS);
  const action = str(body?.action);

  /* THE LIBRARY: every piece of work, newest first. The page arranges it
     into shelves and the desk; the search looks into a story only where this
     person may read it, so a draft's words cannot be found by searching. */
  if (action === "library") {
    const args: unknown[] = [];
    let where = "";
    const q = str(body.q).trim();
    if (q) {
      args.push(me.id, me.isAdmin, "%" + q + "%");
      const p = "$" + args.length;
      where = " WHERE (cs.name ILIKE " + p + " OR t.name ILIKE " + p + " OR t.industry ILIKE " + p +
        " OR ((cs.state = 'done' OR $2 OR cs.writer_id = $1) AND (cs.in_short ILIKE " + p + " OR cs.client_why ILIKE " + p +
        " OR cs.asked_to_do ILIKE " + p + " OR cs.came_of_it ILIKE " + p + " OR cs.deliverables::text ILIKE " + p + ")))";
    }
    const rows = (await pool.query(
      "SELECT " + HEAD + " " + FROM + where + " ORDER BY coalesce(cs.done_at, cs.created_at) DESC LIMIT 500", args)).rows;
    const toPlace = (await pool.query(
      "SELECT t.name AS client, count(*)::int AS n FROM memory_entries m JOIN tenants t ON t.id = m.about_tenant_id " +
      "WHERE m.case_id IS NULL GROUP BY t.name ORDER BY count(*) DESC, t.name")).rows;
    return ok({ cases: rows.map(head), toPlace, canOpen: mayOpen(me), me: me.id });
  }

  /* HOME'S TWO CARDS (spec 068): the write-ups this person is asked for, each
     with how many of the eight sections hold something; the case studies
     marked done in the last 30 days; and how many of their own insights are
     in no case study yet. Done ones are read by everyone, so `fresh` needs no
     rule; `writing` is the person's own by its WHERE. */
  if (action === "home") {
    const writing = (await pool.query(
      "SELECT " + HEAD + ", (" +
      "(cs.in_short <> '')::int + (cs.client_why <> '')::int + (cs.asked_to_do <> '')::int + " +
      "(jsonb_array_length(cs.our_team) + jsonb_array_length(cs.their_team) > 0)::int + " +
      "(jsonb_array_length(cs.stages) > 0)::int + (jsonb_array_length(cs.deliverables) > 0)::int + " +
      "(cs.came_of_it <> '')::int + (jsonb_array_length(cs.who_to_ask) > 0)::int) AS filled " +
      FROM + " WHERE cs.state = 'writing' AND " +
      (brk() === "home-all" ? "$1::uuid IS NOT NULL" : "cs.writer_id = $1") +      /* RED: everybody's write-ups on my Home */
      " ORDER BY cs.due NULLS LAST, cs.name", [me.id])).rows;
    const fresh = (await pool.query(
      "SELECT " + HEAD + " " + FROM + " WHERE cs.state = 'done' AND cs.done_at > now() - interval '30 days' " +
      "ORDER BY cs.done_at DESC LIMIT 3")).rows;
    const loose = (await pool.query(
      "SELECT count(*)::int AS n FROM memory_entries WHERE case_id IS NULL AND author_id = $1", [me.id])).rows[0].n;
    return ok({ writing: writing.map((r) => ({ ...head(r), filled: Number(r.filled) || 0 })), fresh: fresh.map(head), loose });
  }

  if (action === "case") {
    const r = await rowFor(pool, body.id);
    if (!r) return no(404, GONE);
    return ok({ case: await full(pool, r, me) });
  }

  /* What the opening form needs: every client but the worked example —
     archived and past ones included, since a case study is written after the
     work (decision 5) — and every consultant. */
  if (action === "options") {
    const clients = (await pool.query(
      "SELECT key, name, industry, status, past FROM tenants WHERE kind <> 'demo' ORDER BY status = 'retired', name")).rows
      .map((t) => ({ key: t.key, name: t.name, industry: t.industry, archived: t.status === "retired", past: !!t.past }));
    const consultants = (await pool.query(
      "SELECT id, name, email FROM users WHERE kind = 'office' AND status = 'active' ORDER BY name")).rows;
    return ok({ clients, consultants, canOpen: mayOpen(me) });
  }

  if (action === "open") {
    if (!mayOpen(me)) return no(403, "Opening a piece of work is for the platform's admins.");
    const name = oneLine(body.name, 160);
    if (!name) return no(400, "Give the piece of work a name.");
    const writer = isUuid(body.writer) ? str(body.writer) : "";
    const due = day(body.due);
    if (writer && !due) return no(400, "Say when the write-up is wanted.");
    const c = await pool.connect();
    try {
      await c.query("BEGIN");
      let tenantId = "";
      if (body.past) {
        const made = await pastClient(c, me, body.past);
        if ("code" in made) { await c.query("ROLLBACK"); return made; }
        tenantId = made.id;
      } else {
        const t = await c.query("SELECT id FROM tenants WHERE key = $1 AND kind <> 'demo'", [str(body.client)]);
        if (!t.rowCount) { await c.query("ROLLBACK"); return no(400, "Say which client it was for."); }
        tenantId = t.rows[0].id;
      }
      const office = await officeIds(c, [writer, ...list(body.team).map((p: any) => p?.id ?? p)]);
      if (writer && !office.has(writer)) { await c.query("ROLLBACK"); return no(400, "The writer has to be one of the consultants."); }
      const team = list(body.team).map((p: any) => ({ id: str(p?.id ?? p), role: oneLine(p?.role, 80) })).filter((p) => office.has(p.id));
      const r = await c.query(
        "INSERT INTO case_studies (about_tenant_id, name, started, ended, state, opened_by, writer_id, asked_by, due, our_team) " +
        "VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb) RETURNING id",
        [tenantId, name, month(body.started), month(body.ended), writer ? "writing" : "running", me.id,
         writer || null, writer ? me.id : null, writer ? due : null, JSON.stringify(team)]);
      await c.query("COMMIT");
      return ok({ id: r.rows[0].id });
    } catch (e) { await c.query("ROLLBACK").catch(() => {}); throw e; }
    finally { c.release(); }
  }

  if (action === "ask") {
    if (!mayOpen(me)) return no(403, "Asking for a write-up is for the platform's admins.");
    const r = await rowFor(pool, body.id);
    if (!r) return no(404, GONE);
    if (r.state === "done") return no(409, "It is already written up.");
    const writer = str(body.writer), due = day(body.due);
    if (!(await officeIds(pool, [writer])).has(writer)) return no(400, "The writer has to be one of the consultants.");
    if (!due) return no(400, "Say when the write-up is wanted.");
    await pool.query(
      "UPDATE case_studies SET state='writing', writer_id=$2, asked_by=$3, due=$4, ended=coalesce(nullif($5,''), ended), updated_at=now() WHERE id=$1",
      [r.id, writer, me.id, due, month(body.ended)]);
    return ok({ id: r.id });
  }

  if (action === "save") {
    const r = await rowFor(pool, body.id);
    if (!r) return no(404, GONE);
    if (!mayWrite(me, r)) return no(403, r.state === "running"
      ? "Nobody has been asked to write this up yet." : "Only its writer or an admin can change it.");
    const name = oneLine(body.name ?? r.name, 160);
    if (!name) return no(400, "Give the piece of work a name.");
    const office = await officeIds(pool, list(body.ourTeam).map((p: any) => p?.id));
    const ourTeam = list(body.ourTeam).map((p: any) => ({ id: str(p?.id), role: oneLine(p?.role, 80) })).filter((p) => office.has(p.id));
    const theirTeam = list(body.theirTeam).map((p: any) => ({ name: oneLine(p?.name, 120), role: oneLine(p?.role, 160) })).filter((p) => p.name);
    const stages = list(body.stages).map((s: any) => ({ when: oneLine(s?.when, 40), what: oneLine(s?.what, 300) })).filter((s) => s.what);
    const who = list(body.whoToAsk).map((p: any) => ({ name: oneLine(p?.name, 120), about: oneLine(p?.about, 400) })).filter((p) => p.name);
    await pool.query(
      "UPDATE case_studies SET name=$2, started=$3, ended=$4, in_short=$5, client_why=$6, asked_to_do=$7, came_of_it=$8, " +
      "our_team=$9::jsonb, their_team=$10::jsonb, stages=$11::jsonb, deliverables=$12::jsonb, who_to_ask=$13::jsonb, updated_at=now() WHERE id=$1",
      [r.id, name, body.started === undefined ? r.started : month(body.started), body.ended === undefined ? r.ended : month(body.ended),
       prose(body.inShort), prose(body.clientWhy), prose(body.askedToDo), prose(body.cameOfIt),
       JSON.stringify(ourTeam), JSON.stringify(theirTeam), JSON.stringify(stages),
       JSON.stringify(deliverablesOf(body.deliverables, r.deliverables)), JSON.stringify(who)]);
    return ok({ case: await full(pool, (await rowFor(pool, r.id))!, me) });
  }

  /* MARKED DONE IS WHAT PUTS IT ON THE SHELVES (decision 10). In short has
     to be there, because it is the first thing a new joiner reads and the
     cover's own words. */
  if (action === "done") {
    const r = await rowFor(pool, body.id);
    if (!r) return no(404, GONE);
    if (!mayWrite(me, r)) return no(403, "Only its writer or an admin can mark it done.");
    if (r.state === "done") return ok({ id: r.id });
    if (!str(r.in_short).trim() && brk() !== "done-empty") return no(400, "Write In short first — it is the first thing a new joiner reads.");
    await pool.query("UPDATE case_studies SET state='done', done_at=now(), done_by=$2, updated_at=now() WHERE id=$1", [r.id, me.id]);
    return ok({ id: r.id });
  }

  /* THE INSIGHTS FROM THE INTERVIEW, saved into this piece of work — all or
     none, for the debrief's reason (lib/memory-api.ts saveMany). */
  if (action === "insights") {
    const r = await rowFor(pool, body.id);
    if (!r) return no(404, GONE);
    if (!mayWrite(me, r)) return no(403, "Only its writer or an admin can add to it.");
    const drafts = list(body.entries, 40).map(draftOf);
    if (!drafts.length) return ok({ saved: 0 });
    const missing = drafts.findIndex((d) => !d.title);
    if (missing >= 0) return no(400, "Give insight " + (missing + 1) + " a title before saving.");
    const c = await pool.connect();
    try {
      await c.query("BEGIN");
      for (const d of drafts) await insertEntry(c, d, r.about_tenant_id, me.id, r.id);
      await c.query("COMMIT");
      return ok({ saved: drafts.length });
    } catch (e) { await c.query("ROLLBACK").catch(() => {}); throw e; }
    finally { c.release(); }
  }

  /* PLACING AN INSIGHT (spec 067 §5): into a piece of work for the SAME
     client, or back to "not yet in a case study". By its author or an admin,
     the memory's own rule for changing an entry. */
  if (action === "place") {
    if (!isUuid(body.entry)) return no(404, "That insight is no longer here.");
    const e = await pool.query("SELECT author_id, about_tenant_id FROM memory_entries WHERE id = $1", [str(body.entry)]);
    if (!e.rowCount) return no(404, "That insight is no longer here.");
    if (!(me.isAdmin || e.rows[0].author_id === me.id) && brk() !== "anyone-places") return no(403, "Only the person who wrote it, or an admin, can place it.");
    let caseId: string | null = null;
    if (body.case) {
      const r = await rowFor(pool, body.case);
      if (!r) return no(404, GONE);
      if (r.about_tenant_id !== e.rows[0].about_tenant_id && brk() !== "cross-client") return no(400, "That piece of work is for a different client.");
      caseId = r.id;
    }
    await pool.query("UPDATE memory_entries SET case_id = $2, updated_at = now() WHERE id = $1", [str(body.entry), caseId]);
    return ok({ placed: !!caseId });
  }

  if (action === "drop") {
    if (!mayOpen(me)) return no(403, "Removing a piece of work is for the platform's admins.");
    const r = await rowFor(pool, body.id);
    if (!r) return ok({ gone: true });
    /* Its insights stay, back under their client (SET NULL); its files go. */
    for (const d of list(r.deliverables, 200)) if (d.file && d.file.path) await dropBlob(str(d.file.path));
    await pool.query("DELETE FROM case_studies WHERE id = $1", [r.id]);
    return ok({ gone: true });
  }

  /* ── A DELIVERABLE'S FILE: begin, pieces (lib route), finish, open ── */
  if (action === "fileBegin" || action === "fileFinish") {
    const r = await rowFor(pool, body.id);
    if (!r) return no(404, GONE);
    if (!mayWrite(me, r)) return no(403, "Only its writer or an admin can attach a file.");
    if (!storeReady()) return no(503, "There is no file store set up yet, so a file cannot be attached. Everything else about the case study works.");
    const d = list(r.deliverables, 200).find((x) => str(x.id) === str(body.deliverable));
    if (!d) return no(404, "That deliverable is not there any more. Save the draft, then attach the file.");
    const name = safeFileName(body.name);
    const path = casePath(r.id, d.id, name);
    if (action === "fileBegin") {
      const size = Number(body.bytes || 0);
      if (!(size > 0)) return no(400, "That file is empty.");
      if (size > MAX_FILE_BYTES) return no(400, "That file is " + sizeLabel(size) + " — bigger than the " + sizeLabel(MAX_FILE_BYTES) + " a deliverable may be.");
      const up = await beginUpload(path, contentTypeFor(name));
      if (!up) return no(503, "The file store would not take it. Nothing was changed.");
      return ok({ path, storeKey: up.key, uploadId: up.uploadId, piece: UPLOAD_PIECE_BYTES });
    }
    if (str(body.path) !== path) return no(400, "That file does not belong to this deliverable.");
    const done = await finishUpload(path, str(body.storeKey), str(body.uploadId), body.parts || []);
    if (!done) return no(503, "The file store would not finish it. Nothing was changed.");
    const next = list(r.deliverables, 200).map((x) => str(x.id) === str(d.id)
      ? { ...x, file: { path, name, bytes: Number(body.bytes || 0) } } : x);
    await pool.query("UPDATE case_studies SET deliverables = $2::jsonb, updated_at = now() WHERE id = $1", [r.id, JSON.stringify(next)]);
    return ok({ file: { name, size: sizeLabel(body.bytes) } });
  }

  if (action === "fileOpen") {
    const r = await rowFor(pool, body.id);
    if (!r || !maySeeDraft(me, r)) return no(404, "That file is not there.");
    const d = list(r.deliverables, 200).find((x) => str(x.id) === str(body.deliverable));
    if (!d || !d.file || !d.file.path) return no(404, "That file is not there.");
    if (!storeReady()) return no(503, "There is no file store set up yet, so the file cannot be opened.");
    const url = await signedReadFor(str(d.file.path));
    if (!url) return no(503, "The file store would not open it just now. Try again in a moment.");
    return ok({ url });
  }

  return no(400, "Unknown action.");
}

/* ONE PIECE OF A DELIVERABLE'S FILE, raw bytes (app/api/cases/file). Every
   piece is authorised, not one address minted and then trusted (§261). */
export async function casePart(pool: Pool, me: SessionUser, q: URLSearchParams, bytes: Buffer): Promise<Answer> {
  if (me.kind === "client") return no(403, NOT_YOURS);
  const r = await rowFor(pool, q.get("id"));
  if (!r) return no(404, GONE);
  if (!mayWrite(me, r)) return no(403, "Only its writer or an admin can attach a file.");
  if (!storeReady()) return no(503, "There is no file store set up yet.");
  const d = list(r.deliverables, 200).find((x) => str(x.id) === str(q.get("deliverable")));
  if (!d) return no(404, "That deliverable is not there any more.");
  const path = str(q.get("path")), key = str(q.get("storeKey")), uploadId = str(q.get("uploadId"));
  const n = Number(q.get("n") || 0);
  if (path !== casePath(r.id, d.id, safeFileName(q.get("name")))) return no(400, "That file does not belong to this deliverable.");
  if (!key || !uploadId || !(n > 0)) return no(400, "That piece names nothing.");
  if (!bytes || !bytes.length) return no(400, "That piece is empty.");
  if (bytes.length > UPLOAD_PIECE_BYTES + 1024) return no(413, "That piece is too big.");
  const etag = await putPart(path, key, uploadId, n, bytes);
  return ok({ etag, partNumber: n });
}

export { KINDS };
