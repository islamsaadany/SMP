/* The consulting memory (spec 044) — Forefront's own, never a client's.
 *
 * A ROUTE OF ITS OWN, NOT A FOURTH ACTION ON platform-api.ts. That file is the
 * frozen endpoint carried across byte for byte, and its discipline is that it
 * still answers exactly what the frozen page asked; putting a new feature's
 * actions inside it ends that property and makes a future diff against the
 * original impossible. Same shape, same `Answer`, same one-action-per-request.
 *
 * WHAT IT NEVER DOES: touch withTenant. Every row here is platform-wide by
 * construction — `memory_entries` carries no tenant policy (schema.sql) — and
 * that is the feature rather than an oversight: an insight from Raya Trade is
 * worth having BECAUSE it helps on RHI. The boundary this endpoint DOES keep
 * is the one that matters: a client's own staff never reach it.
 */
import type { Pool, PoolClient } from "pg";
import type { SessionUser } from "./auth.ts";
import { memoryAsk } from "./memory-ask.ts";

type Q = Pool | PoolClient;
export type Answer = { code: number; body: Record<string, unknown> };
const ok = (body: Record<string, unknown>): Answer => ({ code: 200, body: { ok: true, ...body } });
const no = (code: number, error: string): Answer => ({ code, body: { ok: false, error } });

/* THE SAME SENTENCE platform-api.ts refuses a client account with, deliberately
   (§53.5): two surfaces that refuse the same person in two different words tell
   an attacker which is which. */
const NOT_YOURS = "That is not something this account opens.";

export const KINDS = ["practice", "hiccup", "lesson"] as const;
/* The four answers, named ONCE — the row builder, the update and the draft
   reader all walk this list, so a fifth question is one edit (§104.7). */
export const ANSWERS = ["happened", "did", "came_of_it", "next_person"] as const;

const str = (v: unknown): string => (v == null ? "" : String(v));
const oneLine = (v: unknown): string => str(v).replace(/\s*\n\s*/g, " ").trim();
const kindOf = (v: unknown): string => (KINDS as readonly string[]).includes(str(v)) ? str(v) : "lesson";

/* WHO MAY CHANGE ONE, ANSWERED ONCE AND ON THE SERVER (decision 3, plan.md).
   platform.html loads no rules module in the browser at all — it reads flags
   the server computed — so this is sent as `mine` on the row and asked AGAIN
   here at press time (§48.2), never re-derived by the page. */
const mayEdit = (me: SessionUser, authorId: string): boolean =>
  process.env.SMP_BREAK === "anyone-edits" ? true       /* RED: anybody rewrites anybody's insight */
    : me.isAdmin || authorId === me.id;

const ROW =
  "e.id, e.about_tenant_id, e.author_id, e.kind, e.title, e.happened, e.did, e.came_of_it, " +
  "e.next_person, e.occurred, e.created_at, e.updated_at, " +
  "t.key AS client_key, t.name AS client_name, t.industry, u.name AS author_name, u.email AS author_email";
const FROM =
  "FROM memory_entries e JOIN tenants t ON t.id = e.about_tenant_id JOIN users u ON u.id = e.author_id";

function shape(r: Record<string, any>, me: SessionUser) {
  return {
    id: r.id, kind: r.kind, title: r.title,
    happened: r.happened, did: r.did, came_of_it: r.came_of_it, next_person: r.next_person,
    occurred: r.occurred, when: r.created_at,
    client: r.client_key, clientName: r.client_name, industry: r.industry,
    author: r.author_name, authorEmail: r.author_email,
    mine: mayEdit(me, r.author_id),
  };
}

async function tenantIdFor(c: Q, key: unknown): Promise<string | null> {
  if (!key) return null;
  const r = await c.query("SELECT id FROM tenants WHERE key = $1", [String(key)]);
  return r.rowCount ? r.rows[0].id : null;
}

/* One draft off the wire, trusted for nothing. The kind falls back rather than
   refusing (the splitter already guesses it), the title is one line and must
   not be blank — which is the database's own CHECK said early, so the person
   is told which row rather than meeting a constraint error (§184). */
function draftOf(d: any) {
  return {
    kind: kindOf(d?.kind),
    title: oneLine(d?.title),
    happened: str(d?.happened).trim(),
    did: str(d?.did).trim(),
    came_of_it: str(d?.came_of_it).trim(),
    next_person: str(d?.next_person).trim(),
    occurred: oneLine(d?.occurred),
  };
}

async function insert(c: Q, d: ReturnType<typeof draftOf>, tenantId: string, authorId: string) {
  const r = await c.query(
    "INSERT INTO memory_entries (about_tenant_id, author_id, kind, title, happened, did, came_of_it, next_person, occurred) " +
    "VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id",
    [tenantId, authorId, d.kind, d.title, d.happened, d.did, d.came_of_it, d.next_person, d.occurred]);
  return r.rows[0].id as string;
}

export async function memoryAction(pool: Pool, me: SessionUser, body: any): Promise<Answer> {
  /* A CLIENT'S OWN STAFF NEVER REACH THIS. They sign in to the same door and
     carry a session like anybody else, so this is the one gate the memory has
     — and it is the boundary the whole spec rests on, not a formality. */
  if (me.kind === "client" && process.env.SMP_BREAK !== "client-reads") return no(403, NOT_YOURS);

  const action = String(body?.action || "");

  if (action === "list") {
    const where: string[] = [];
    const args: unknown[] = [];
    if (body.client) { args.push(String(body.client)); where.push("t.key = $" + args.length); }
    if (body.industry) { args.push(String(body.industry)); where.push("t.industry = $" + args.length); }
    if (body.kind) { args.push(kindOf(body.kind)); where.push("e.kind = $" + args.length); }
    if (str(body.q).trim()) {
      /* ILIKE over a few hundred rows is the right amount of machinery for a
         few hundred rows; full text is recorded in plan.md, not built. The
         four answers are searched as well as the title, because what somebody
         remembers about an old insight is usually a phrase from inside it. */
      args.push("%" + str(body.q).trim() + "%");
      const p = "$" + args.length;
      where.push("(e.title ILIKE " + p + " OR e.happened ILIKE " + p + " OR e.did ILIKE " + p +
                 " OR e.came_of_it ILIKE " + p + " OR e.next_person ILIKE " + p + " OR t.name ILIKE " + p + ")");
    }
    const rows = (await pool.query(
      "SELECT " + ROW + " " + FROM +
      (where.length ? " WHERE " + where.join(" AND ") : "") +
      " ORDER BY e.created_at DESC LIMIT 500", args)).rows;
    /* The filters are built from what the memory HOLDS, never from every
       client on the platform: a picker offering ten industries that match
       nothing is ten ways to empty the page (§61). */
    const clients = (await pool.query(
      "SELECT DISTINCT t.key, t.name FROM memory_entries e JOIN tenants t ON t.id = e.about_tenant_id ORDER BY t.name")).rows;
    const industries = (await pool.query(
      "SELECT DISTINCT t.industry FROM memory_entries e JOIN tenants t ON t.id = e.about_tenant_id " +
      "WHERE btrim(t.industry) <> '' ORDER BY t.industry")).rows.map((r) => r.industry);
    return ok({ entries: rows.map((r) => shape(r, me)), clients, industries });
  }

  if (action === "one") {
    const r = await pool.query("SELECT " + ROW + " " + FROM + " WHERE e.id = $1", [str(body.id)]);
    if (!r.rowCount) return no(404, "That insight is no longer here.");
    return ok({ entry: shape(r.rows[0], me) });
  }

  if (action === "save") {
    const d = draftOf(body);
    if (!d.title) return no(400, "Give it a title — that and a client are all it needs.");
    if (body.id) {
      const cur = await pool.query("SELECT author_id FROM memory_entries WHERE id = $1", [str(body.id)]);
      if (!cur.rowCount) return no(404, "That insight is no longer here.");
      if (!mayEdit(me, cur.rows[0].author_id)) return no(403, "Only the person who wrote it can change it.");
      await pool.query(
        "UPDATE memory_entries SET kind=$2, title=$3, happened=$4, did=$5, came_of_it=$6, next_person=$7, occurred=$8, updated_at=now() WHERE id=$1",
        [str(body.id), d.kind, d.title, d.happened, d.did, d.came_of_it, d.next_person, d.occurred]);
      return ok({ id: str(body.id) });
    }
    const tenantId = await tenantIdFor(pool, body.client);
    if (!tenantId) return no(400, "Say which client it came from.");
    return ok({ id: await insert(pool, d, tenantId, me.id) });
  }

  if (action === "saveMany") {
    const tenantId = await tenantIdFor(pool, body.client);
    if (!tenantId) return no(400, "Say which client it came from.");
    const drafts = Array.isArray(body.entries) ? body.entries.map(draftOf) : [];
    if (!drafts.length) return no(400, "There is nothing here to save.");
    const missing = process.env.SMP_BREAK === "partial-save" ? -1 : drafts.findIndex((d: any) => !d.title);
    if (missing >= 0) return no(400, "Give number " + (missing + 1) + " a title before saving.");
    /* ONE TRANSACTION, ALL OR NONE. Six insights half-saved after a long
       conversation is the outcome nobody can tell from a bug — and the person
       has already read all six, which is what makes saving them together the
       honest thing to do. */
    const c = await pool.connect();
    try {
      /* RED: saved one at a time, so a bad row leaves the good ones behind —
         the outcome nobody can tell from a bug. */
      if (process.env.SMP_BREAK !== "partial-save") await c.query("BEGIN");
      const ids: string[] = [];
      for (const d of drafts) ids.push(await insert(c, d, tenantId, me.id));
      if (process.env.SMP_BREAK !== "partial-save") await c.query("COMMIT");
      return ok({ ids, saved: ids.length });
    } catch (e) {
      await c.query("ROLLBACK").catch(() => {});
      throw e;
    } finally { c.release(); }
  }

  /* ASKING IT (phase C). Nothing is stored: what was asked and what came back
     are not written anywhere, which is decision 4 holding one surface further
     out — the memory records what people CHOSE to write up, not what they
     went looking for. */
  if (action === "ask") {
    const r = await memoryAsk(pool, me, body.question);
    if (!r.ok) return ok({ answered: false, reply: "", sources: [], why: r.why });
    return ok({ answered: r.answered, reply: r.reply, sources: r.sources });
  }

  if (action === "drop") {
    const cur = await pool.query("SELECT author_id FROM memory_entries WHERE id = $1", [str(body.id)]);
    if (!cur.rowCount) return ok({ gone: true });
    if (!mayEdit(me, cur.rows[0].author_id)) return no(403, "Only the person who wrote it can remove it.");
    await pool.query("DELETE FROM memory_entries WHERE id = $1", [str(body.id)]);
    return ok({ gone: true });
  }

  return no(400, "Unknown action.");
}
