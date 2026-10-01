/* ── ONE CLIENT'S PROCESSES, CARRIED FROM THE OLD FFPROCESS DATABASE ──────
   FFProcess ran on its own database before it became SMP's Processes module
   (2026-10-01, decision "RHI"). This copies ONE of its workspaces — every
   process, step, role, person, RACI cell, authority rule and governance row
   under it — into SMP's `ffprocess` schema, under the SMP client's address.

   NOTHING IS LISTED BY HAND. The tables, their keys and what points at what
   are read from the TARGET's own catalogue, so a table FFProcess gains next
   month is carried the day it is added, not the day somebody remembers
   (§104.7). What belongs to the workspace is everything reachable DOWN from
   its row through those foreign keys; what it points UP at outside itself —
   a process category (the firm's), a user (an author or approver) — is
   brought along and re-addressed: the category to SMP's firm, a user to the
   SMP user holding the same email or a copy of the old row with no password.

   IDS ARE KEPT. FFProcess mints cuids/uuids, globally unique, so a carried
   row keeps its id and every link between rows survives without a map. Only
   the workspace's own id changes — to the client's address (`rhi`) — and
   with it every `workspaceId`, and every `firmId` becomes SMP's firm.

   IT RUNS ONCE, BY CONSTRUCTION. It refuses a target workspace that already
   holds anything — with one exception made on purpose: people mirrored from
   the client's register (smpKey set) and holding nothing else are removed
   first, because the next page load mirrors them again and ADOPTS the
   carried person with the same email (ffp/lib/register-sync.ts) rather than
   leaving two of everybody.

   ORDER: rows are inserted with every NULLABLE foreign key emptied, in the
   order the NOT NULL keys require, then the nullable keys are put back in a
   second pass — so self-references (a person's manager) and cycles (a
   process branching from a step of another process) need no special case.
   All of it in ONE transaction: half a client's processes is worse than none.

   Usage:
     FFPROCESS_DATABASE_URL=… DATABASE_URL=… node scripts/carry-ffprocess.mjs
         lists the old database's workspaces and stops
     … --from "<old workspace id or exact name>" [--to rhi]          dry run
     … --from "<…>" --to rhi --apply                                 writes
   The old database's schema is FFPROCESS_SOURCE_SCHEMA (default `public`).
   At deploy: SMP_CARRY_FFPROCESS="<id or name>" (scripts/deploy.mjs). */
import pg from "pg";
import { FFP_SCHEMA } from "../db/apply-ffp.mjs";

const SKIP = new Set(["_migrations", "_prisma_migrations", "accounts", "sessions", "verification_tokens", "firm_members", "members", "firms", "users", "process_categories"]);
const FIRM_ID = "forefront";

const q = (s) => '"' + String(s).replace(/"/g, '""') + '"';

async function catalogue(c) {
  const tables = (await c.query(
    "SELECT relname FROM pg_class WHERE relnamespace = $1::regnamespace AND relkind = 'r'", [FFP_SCHEMA])).rows.map((r) => r.relname);
  const cols = {};
  for (const r of (await c.query(
    "SELECT table_name, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = $1 ORDER BY ordinal_position", [FFP_SCHEMA])).rows) {
    (cols[r.table_name] ||= []).push({ name: r.column_name, type: r.data_type, nullable: r.is_nullable === "YES" });
  }
  const pks = {};
  for (const r of (await c.query(
    `SELECT c.conrelid::regclass::text AS t, a.attname::text AS col FROM pg_constraint c
       JOIN unnest(c.conkey) WITH ORDINALITY k(n, i) ON true
       JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.n
      WHERE c.connamespace = $1::regnamespace AND c.contype = 'p' ORDER BY k.i`, [FFP_SCHEMA])).rows) {
    (pks[bare(r.t)] ||= []).push(r.col);
  }
  const fks = (await c.query(
    `SELECT c.conrelid::regclass::text AS t, c.confrelid::regclass::text AS r,
            (SELECT array_agg(a.attname::text ORDER BY k.i) FROM unnest(c.conkey) WITH ORDINALITY k(n, i) JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.n) AS cols,
            (SELECT array_agg(a.attname::text ORDER BY k.i) FROM unnest(c.confkey) WITH ORDINALITY k(n, i) JOIN pg_attribute a ON a.attrelid = c.confrelid AND a.attnum = k.n) AS refs
       FROM pg_constraint c WHERE c.connamespace = $1::regnamespace AND c.contype = 'f'`, [FFP_SCHEMA])).rows
    .map((r) => ({ t: bare(r.t), r: bare(r.r), col: r.cols[0], ref: r.refs[0], multi: r.cols.length > 1 }));
  if (fks.some((f) => f.multi)) throw new Error("carry-ffprocess: a composite foreign key — this carry only knows single-column keys");
  return { tables, cols, pks, fks };
}
function bare(t) { return String(t).replace(/^.*\./, "").replace(/^"|"$/g, ""); }

export async function carryFfprocess({ source, target, from, to = "rhi", sourceSchema = "public", apply = false, log = console.log }) {
  const src = new pg.Client({ connectionString: source, options: "-c search_path=" + sourceSchema });
  const dst = new pg.Client({ connectionString: target, options: "-c search_path=" + FFP_SCHEMA });
  await src.connect(); await dst.connect();
  try {
    const ws = (await src.query("SELECT id, name FROM workspaces ORDER BY name")).rows;
    if (!from) {
      log("carry-ffprocess: the old database holds " + ws.length + " workspace(s) — pass --from with one of them:");
      for (const w of ws) log("  " + w.id + "  " + w.name);
      return { listed: ws };
    }
    const hit = ws.filter((w) => w.id === from || w.name.toLowerCase() === String(from).toLowerCase());
    if (hit.length !== 1) throw new Error("carry-ffprocess: " + (hit.length ? "more than one" : "no") + " workspace matches \"" + from + "\" in the old database");
    const oldId = hit[0].id;

    const cat = await catalogue(dst);
    const srcCols = {};
    for (const r of (await src.query("SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = $1", [sourceSchema])).rows) {
      (srcCols[r.table_name] ||= new Set()).add(r.column_name);
    }
    const own = cat.tables.filter((t) => !SKIP.has(t));
    const key = (t, row) => (cat.pks[t] || Object.keys(row)).map((k) => String(row[k])).join("\u0001");
    const picked = Object.fromEntries(own.map((t) => [t, new Map()]));
    const read = async (t, where, args) => {
      const have = srcCols[t];
      if (!have) return [];
      const list = cat.cols[t].filter((c) => have.has(c.name)).map((c) => q(c.name)).join(", ");
      return (await src.query("SELECT " + list + " FROM " + q(t) + " WHERE " + where, args)).rows;
    };

    /* DOWN from the workspace, to a fixpoint. */
    for (const r of await read("workspaces", "id = $1", [oldId])) picked.workspaces.set(key("workspaces", r), r);
    const ids = (t, col) => [...new Set([...picked[t].values()].map((r) => r[col]).filter((v) => v != null))];
    for (let changed = true; changed; ) {
      changed = false;
      for (const f of cat.fks) {
        if (!picked[f.t] || !picked[f.r] || f.t === "workspaces") continue;
        const want = ids(f.r, f.ref);
        if (!want.length || !srcCols[f.t]?.has(f.col)) continue;
        for (const r of await read(f.t, q(f.col) + " = ANY($1)", [want])) {
          const k = key(f.t, r);
          if (!picked[f.t].has(k)) { picked[f.t].set(k, r); changed = true; }
        }
      }
    }

    /* UP to what the workspace points at outside itself. */
    const fkOf = (t) => cat.fks.filter((f) => f.t === t);
    const wantUp = (rt) => {
      const s = new Set();
      for (const t of own) for (const f of fkOf(t)) if (f.r === rt) for (const r of picked[t].values()) if (r[f.col] != null) s.add(r[f.col]);
      return [...s];
    };
    const catsIn = wantUp("process_categories");
    const cats = catsIn.length ? await read("process_categories", "id = ANY($1)", [catsIn]) : [];
    const usersIn = wantUp("users");
    const users = usersIn.length ? (await src.query("SELECT id, name, email FROM users WHERE id = ANY($1)", [usersIn])).rows : [];

    /* The target must be empty — bar mirrored register people holding nothing. */
    const holds = [];
    for (const t of own) {
      if (t === "workspaces" || !cat.cols[t].some((c) => c.name === "workspaceId")) continue;
      const n = Number((await dst.query("SELECT count(*) FROM " + q(t) + " WHERE \"workspaceId\" = $1" + (t === "people" ? " AND \"smpKey\" IS NULL" : ""), [to])).rows[0].count);
      if (n) holds.push(t + " " + n);
    }
    if (holds.length) throw new Error("carry-ffprocess: the target workspace \"" + to + "\" already holds " + holds.join(", ") + " — this runs once, into an empty workspace");

    const counts = Object.fromEntries(own.filter((t) => picked[t].size).map((t) => [t, picked[t].size]));
    log("carry-ffprocess: \"" + hit[0].name + "\" (" + oldId + ") → \"" + to + "\"");
    for (const [t, n] of Object.entries(counts)) log("  " + t.padEnd(36) + n);
    log("  process_categories (shared)".padEnd(38) + cats.length + "   users referenced " + users.length);
    if (!apply) { log("carry-ffprocess: dry run — nothing written (add --apply)"); return { counts, dry: true }; }

    await dst.query("BEGIN");
    try {
      await dst.query("INSERT INTO firms (id, name" + (cat.cols.firms.some((c) => c.name === "updatedAt") ? ", \"updatedAt\") VALUES ($1, 'Forefront', now())" : ") VALUES ($1, 'Forefront')") + " ON CONFLICT (id) DO NOTHING", [FIRM_ID]);
      /* Users: the SMP user with the same email, or a copy with no password. */
      const userMap = new Map();
      for (const u of users) {
        const hitU = (await dst.query("SELECT id FROM users WHERE lower(email) = lower($1)", [u.email])).rows[0];
        if (hitU) userMap.set(u.id, hitU.id);
        else {
          await dst.query("INSERT INTO users (id, name, email, \"updatedAt\") VALUES ($1, $2, $3, now())", [u.id, u.name, u.email]);
          userMap.set(u.id, u.id);
        }
      }
      for (const c of cats) {
        c.firmId = FIRM_ID;
        await insertRow(dst, cat, "process_categories", c, { nullFks: false, onConflict: true });
      }
      /* Register-mirrored people holding nothing: removed, re-mirrored on the next load. */
      await dst.query("DELETE FROM people WHERE \"workspaceId\" = $1 AND \"smpKey\" IS NOT NULL", [to]);
      await dst.query("DELETE FROM workspaces WHERE id = $1", [to]);

      const rewrite = (t, row) => {
        const out = { ...row };
        if (t === "workspaces") { out.id = to; out.firmId = FIRM_ID; }
        if ("workspaceId" in out && out.workspaceId === oldId) out.workspaceId = to;
        for (const f of fkOf(t)) if (f.r === "users" && out[f.col] != null) out[f.col] = userMap.get(out[f.col]) ?? out[f.col];
        return out;
      };
      /* Order by the NOT NULL keys among the carried tables. */
      const hard = (t) => fkOf(t).filter((f) => f.r !== t && picked[f.r] && !cat.cols[t].find((c) => c.name === f.col).nullable).map((f) => f.r);
      const order = [], seen = new Set();
      const visit = (t, path = new Set()) => {
        if (seen.has(t)) return;
        if (path.has(t)) throw new Error("carry-ffprocess: a cycle of NOT NULL keys through " + t);
        path.add(t); for (const r of hard(t)) visit(r, path); path.delete(t);
        seen.add(t); order.push(t);
      };
      for (const t of own) if (picked[t].size) visit(t);
      for (const t of order) for (const row of picked[t].values()) await insertRow(dst, cat, t, rewrite(t, row), { nullFks: true });
      /* Second pass: the nullable keys put back. */
      for (const t of order) {
        const soft = fkOf(t).filter((f) => cat.cols[t].find((c) => c.name === f.col).nullable);
        if (!soft.length || !cat.pks[t]) continue;
        for (const raw of picked[t].values()) {
          const row = rewrite(t, raw);
          const set = soft.filter((f) => row[f.col] != null);
          if (!set.length) continue;
          const args = set.map((f) => row[f.col]);
          const where = cat.pks[t].map((k, i) => q(k) + " = $" + (args.length + i + 1)).join(" AND ");
          await dst.query("UPDATE " + q(t) + " SET " + set.map((f, i) => q(f.col) + " = $" + (i + 1)).join(", ") + " WHERE " + where,
            [...args, ...cat.pks[t].map((k) => row[k])]);
        }
      }
      await dst.query("COMMIT");
    } catch (e) { await dst.query("ROLLBACK"); throw e; }
    log("carry-ffprocess: written — open " + to + "'s Processes once and the register people are linked by email");
    return { counts, dry: false };
  } finally {
    await src.end(); await dst.end();
  }
}

async function insertRow(c, cat, t, row, { nullFks, onConflict }) {
  const cols = cat.cols[t].filter((col) => col.name in row);
  const nullable = new Set(nullFks ? cat.fks.filter((f) => f.t === t).map((f) => f.col).filter((n) => cat.cols[t].find((x) => x.name === n).nullable) : []);
  const vals = cols.map((col) => {
    let v = row[col.name];
    if (nullable.has(col.name)) v = null;
    if (v != null && (col.type === "json" || col.type === "jsonb")) v = JSON.stringify(v);
    return v;
  });
  await c.query("INSERT INTO " + q(t) + " (" + cols.map((x) => q(x.name)).join(", ") + ") VALUES (" + cols.map((_, i) => "$" + (i + 1)).join(", ") + ")" +
    (onConflict ? " ON CONFLICT DO NOTHING" : ""), vals);
}

if (import.meta.url === "file://" + process.argv[1]) {
  const arg = (n) => { const i = process.argv.indexOf("--" + n); return i > 0 ? process.argv[i + 1] : undefined; };
  const source = process.env.FFPROCESS_DATABASE_URL;
  const target = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!source || !target) { console.error("carry-ffprocess: set FFPROCESS_DATABASE_URL (the old database) and DATABASE_URL (SMP's)"); process.exit(2); }
  carryFfprocess({ source, target, from: arg("from"), to: arg("to") || "rhi", sourceSchema: process.env.FFPROCESS_SOURCE_SCHEMA || "public", apply: process.argv.includes("--apply") })
    .catch((e) => { console.error(e.message); process.exit(1); });
}
