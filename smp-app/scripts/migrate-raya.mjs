/* Raya Trade, carried across — ONE TENANT, ONE SCRIPT, ONCE (spec 043 §4.7,
   §314.1). Reads the `raya_trade` schema through the frozen product's OWN
   reader (lib/state-io.js — the reader that wrote the JSON blobs interprets
   them once), creates Raya's tenants row, loads the graph under it, copies
   the nine tables outside the graph row for row with tenant_id added, and
   carries the accounts: platform.accounts → users (hash and must_change
   VERBATIM — nobody gets a new password), platform.account_clients →
   tenant_users. platform.sessions are NOT copied: everyone signs in once.

     node scripts/migrate-raya.mjs --from=postgres://…/copy  [--schema=raya_trade] [--to=<owner url of the shared db>]

   `--to` defaults to DATABASE_URL_UNPOOLED. Prints one line per table with
   both counts. Written for Raya's shape as it stands (migrations 001–043)
   and for no other; DELETED from the tree once the cutover is done — a
   one-off left behind is a second reader of the old schema somebody will
   trust. The breaks (--break=short:<table>, --break=wrong-tenant) exist for
   S8 and do nothing without the switch. */
import { createRequire } from "node:module";
import pg from "pg";
import { withTenant } from "../lib/tenant.ts";
import { loadGraph } from "../lib/state-io.ts";

const require = createRequire(import.meta.url);
const frozen = require("../../lib/state-io.js");     /* the FROZEN reader, on purpose */
frozen.tuneTypes(pg);

const OUTSIDE = ["bu_declarations", "change_log", "chat_threads", "chat_messages", "messages",
  "message_drafts", "message_recipients", "push_subscriptions", "assistant_asks"];

export async function migrateRaya({ from, to, schema = "raya_trade", tenantKey = "raya-trade", tenantName = "Raya Trade",
  brk = null, log = (s) => console.log(s), appPools = null }) {
  const src = new pg.Client({ connectionString: from });
  await src.connect();
  await src.query("SET search_path TO " + schema + ", platform");
  const graph = await frozen.readState(src);
  if (!graph) throw new Error("migrate-raya: no graph in " + schema);

  const dst = new pg.Client({ connectionString: to });
  await dst.connect();
  const counts = {};
  try {
    await dst.query("BEGIN");
    /* the registry row — an existing key means this already ran */
    const had = (await dst.query("SELECT id FROM tenants WHERE key = $1", [tenantKey])).rows[0];
    if (had) throw new Error("migrate-raya: tenant " + tenantKey + " already exists — this runs once");
    const reg = (await src.query("SELECT name, industry, notes, mark, colors, kind, made_here FROM platform.clients WHERE key = $1", [tenantKey])).rows[0] || {};
    const tenantId = (await dst.query(
      "INSERT INTO tenants (key, name, industry, notes, mark, colors, kind, made_here) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id",
      [tenantKey, reg.name || tenantName, reg.industry || "", reg.notes || "", reg.mark || null, reg.colors || {}, reg.kind || "client", !!reg.made_here])).rows[0].id;
    await dst.query("COMMIT");   /* the row must exist before smp_app can set it */

    /* the graph, under Raya's tenant, through the app role (loadGraph is
       loaded with tenant_id from the setting — never written here) */
    const skip = brk && brk.startsWith("short:") ? brk.slice(6) : null;
    if (skip && !OUTSIDE.includes(skip)) {
      /* the break: one graph table left short — drop its rows from the graph */
      const g = JSON.parse(JSON.stringify(graph));
      if (skip === "people") g.people = g.people.slice(1);
      else if (skip === "tactics") g.units[g.unitKeys[0]].items[0].tactics = [];
      else throw new Error("short: only people/tactics are modelled for a graph table");
      await withTenant(tenantId, (c) => loadGraph(c, g));
    } else {
      await withTenant(tenantId, (c) => loadGraph(c, graph));
    }

    /* the nine outside the graph, row for row, as the owner with tenant_id
       explicit (bigserial ids KEPT — they are the keys chat and messages
       hold — and the sequences moved past them) */
    await dst.query("BEGIN");
    for (const t of OUTSIDE) {
      if (skip === t) continue;
      const rows = (await src.query("SELECT * FROM " + t)).rows;
      const under = tenantId;
      for (const r of rows) {
        const names = Object.keys(r);
        await dst.query("INSERT INTO " + t + " (tenant_id, " + names.map((n) => '"' + n + '"').join(",") + ") VALUES ($1," + names.map((_, i) => "$" + (i + 2)).join(",") + ")",
          [under, ...names.map((n) => r[n] !== null && typeof r[n] === "object" ? JSON.stringify(r[n]) : r[n])]);
      }
      if (rows.length && rows[0].id !== undefined && typeof rows[0].id === "number" || (rows.length && /^\d+$/.test(String(rows[0]?.id)))) {
        await dst.query("SELECT setval(pg_get_serial_sequence($1, 'id'), (SELECT COALESCE(max(id), 1) FROM " + t + "))", [t]);
      }
      counts[t] = rows.length;
      log("copied " + t + " " + rows.length);
    }
    /* the accounts */
    const accounts = (await src.query("SELECT email, name, kind, is_admin, password_hash, must_change, status, created_at, updated_at FROM platform.accounts")).rows;
    const userIds = {};
    for (const a of accounts) {
      const r = await dst.query(
        "INSERT INTO users (email, name, kind, is_admin, password_hash, must_change, status, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) " +
        "ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id",
        [a.email.toLowerCase(), a.name, a.kind, a.is_admin, a.password_hash, a.must_change, a.status, a.created_at, a.updated_at]);
      userIds[a.email.toLowerCase()] = r.rows[0].id;
    }
    const memberships = (await src.query("SELECT email, person_key, seat, added_at FROM platform.account_clients WHERE client_key = $1", [tenantKey])).rows;
    for (const m of memberships) {
      /* the person this login IS on Raya's register: the mapping's key if the
         register holds it, else the address (§313.32) — refused if neither */
      let pk = (await dst.query("SELECT key FROM people WHERE tenant_id = $1 AND key = $2", [tenantId, m.person_key])).rows[0]?.key;
      if (!pk) {
        const byMail = (await dst.query("SELECT key FROM people WHERE tenant_id = $1 AND lower(COALESCE(extra->>'email','')) = $2 AND COALESCE(extra->>'active','true') <> 'false'", [tenantId, m.email.toLowerCase()])).rows;
        if (byMail.length === 1) pk = byMail[0].key;
      }
      if (!pk) { log("skipped membership " + m.email + " — names nobody on the register (§313.32)"); continue; }
      await dst.query("INSERT INTO tenant_users (tenant_id, user_id, person_key, seat, added_at) VALUES ($1,$2,$3,$4,$5)",
        [tenantId, userIds[m.email.toLowerCase()], pk, m.seat === "super" ? "super" : "smoteam", m.added_at]);
    }
    log("accounts " + accounts.length + " · memberships " + memberships.length);
    if (brk === "wrong-tenant") {
      /* the break: one graph table's rows moved under a neighbour */
      const other = (await dst.query("SELECT id FROM tenants WHERE key <> $1 LIMIT 1", [tenantKey])).rows[0];
      if (other) await dst.query("UPDATE labels SET tenant_id = $1 WHERE tenant_id = $2", [other.id, tenantId]);
    }
    await dst.query("COMMIT");
    return { tenantId, counts };
  } catch (e) {
    await dst.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    await src.end(); await dst.end();
  }
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) {
  const a = (n) => { const x = process.argv.find((s) => s.startsWith("--" + n + "=")); return x ? x.slice(n.length + 3) : null; };
  const from = a("from"), to = a("to") || process.env.DATABASE_URL_UNPOOLED;
  if (!from || !to) { console.error("migrate-raya: --from=<copy url> and --to (or DATABASE_URL_UNPOOLED) are required"); process.exit(2); }
  migrateRaya({ from, to, schema: a("schema") || "raya_trade", brk: a("break") })
    .then((r) => console.log("done — tenant " + r.tenantId), (e) => { console.error("FAILED " + e.message); process.exit(1); });
}
