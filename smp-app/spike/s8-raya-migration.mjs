/* S8 — Raya Trade carried across (spec 043 §4.7, §314.1, contracts/spike.md).

   Against a COPY of the frozen deployment (quickstart §3: smp_v20, moved
   into raya_trade + platform by scripts/migrate-to-multi-client.js):
   scripts/migrate-raya.mjs runs into a throwaway shared database, then —
   every tenant table's count under Raya's tenant_id equals the copy's; the
   whole graph read through the new reader is byte-identical (normalised) to
   the frozen reader's on the copy; a change-list save round-trips; a sign-in
   that worked before works after, must_change intact.

     node spike/s8-raya-migration.mjs --from=postgres://postgres:postgres@localhost:5432/smp_v20
     … --break=short:people      (RED: one table left short, named)
     … --break=wrong-tenant      (RED: one table written under another tenant — Raya short AND the neighbour moved) */
import { createRequire } from "node:module";
import pg from "pg";
import { makeDb, tenantTables, check, fail, finish, brk, arg } from "./_harness.mjs";
import { withTenant } from "../lib/tenant.ts";
import { readState } from "../lib/state-io.ts";
import { save } from "../lib/save.ts";
import * as auth from "../lib/auth.ts";
import * as door from "../lib/door.ts";
import { migrateRaya } from "../scripts/migrate-raya.mjs";

const require = createRequire(import.meta.url);
const frozen = require("../../lib/state-io.js");
frozen.tuneTypes(pg);
function normalize(v) {
  if (Array.isArray(v)) return v.map(normalize);
  if (v && typeof v === "object") { const o = {}; for (const k of Object.keys(v).sort()) if (v[k] !== null && v[k] !== undefined) o[k] = normalize(v[k]); return o; }
  return v;
}
const canon = (v) => JSON.stringify(normalize(v));

const from = arg("from") || "postgres://postgres:postgres@localhost:5432/smp_v20";
const breakArg = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8) || null;
const db = await makeDb();
try {
  /* a neighbour, so "written under another tenant" has somewhere to land */
  const B = (await db.owner.query("INSERT INTO tenants (key, name) VALUES ('b-co', 'Tenant B') RETURNING id")).rows[0].id;
  const ts = await tenantTables(db.owner);
  const bBefore = {};
  for (const t of ts) bBefore[t] = (await db.owner.query("SELECT count(*)::int AS n FROM " + t + " WHERE tenant_id = $1", [B])).rows[0].n;

  /* a known password on one account of the copy, so the sign-in can be driven */
  const src = new pg.Client({ connectionString: from }); await src.connect();
  const acct = (await src.query("SELECT email, is_admin, must_change FROM platform.accounts ORDER BY is_admin DESC, email LIMIT 1")).rows[0];
  const pw = "Carried-1!";
  await src.query("UPDATE platform.accounts SET password_hash = $2 WHERE email = $1", [acct.email, auth.hashPassword(pw)]);
  const srcCounts = {};
  for (const t of ts) srcCounts[t] = (await src.query("SELECT count(*)::int AS n FROM raya_trade." + t)).rows[0].n;
  await src.query("SET search_path TO raya_trade, platform");
  const before = await frozen.readState(src);
  await src.end();

  const run = await migrateRaya({ from, to: db.ownerUrl, brk: breakArg, log: () => {} });
  const R = run.tenantId;

  /* 1 · counts, every tenant table */
  let short = 0;
  for (const t of ts) {
    const n = (await db.owner.query("SELECT count(*)::int AS n FROM " + t + " WHERE tenant_id = $1", [R])).rows[0].n;
    if (n !== srcCounts[t]) { short++; fail(t + ": " + n + " under Raya, " + srcCounts[t] + " in the copy"); }
  }
  check(short === 0, ts.length + " tenant tables: every count equal", short + " differ");
  /* 2 · the whole graph, byte-identical through the new reader */
  const after = await withTenant(R, (c) => readState(c));
  check(canon(after) === canon(before), "the graph read through state-io.ts is byte-identical to the frozen reader's (normalised)", canon(after).length + " vs " + canon(before).length);
  const unit = before.unitKeys[0];
  check(canon(after.units[unit]) === canon(before.units[unit]), "…and " + unit + "'s plan on its own", "");
  /* 3 · a save round-trips on the migrated tenant */
  const smo = (before.people || []).find((p) => p.role === "super") || { key: "smo" };
  const D = require("../lib/graph-diff.cjs");
  const edited = JSON.parse(JSON.stringify(after)); edited.units[unit].aspiration = "S8 aspiration";
  const r = await save(R, { key: smo.key, name: smo.name, role: "super" }, { changes: D.graphChanges(after, edited) });
  const again = await withTenant(R, (c) => readState(c));
  check(r.code === 200 && again.units[unit].aspiration === "S8 aspiration" && canon(again) === canon(edited), "a change-list save round-trips on the migrated tenant", "code " + r.code + " " + JSON.stringify(r.body).slice(0, 100));
  /* 4 · a sign-in that worked before works after, must_change intact */
  const s = await auth.signIn(db.app, acct.email, pw, "8.8.8.8");
  const me = s.ok ? await auth.getSession(db.app, s.token) : null;
  check(s.ok && me && me.email === acct.email.toLowerCase() && me.mustChange === !!acct.must_change, "the migrated account signs in with its OLD hash, must_change intact", s.ok ? JSON.stringify(me) : s.message);
  if (me) {
    const d = await door.resolveTenant(db.app, { ...me, mustChange: false }, "raya-trade");
    check(d.ok === true || (d.ok === false && d.status === 404), "the door answers for raya-trade (open for the admin, refused for a member the register does not hold — §313.32)", JSON.stringify(d).slice(0, 100));
  }
  /* 5 · the neighbour untouched */
  let moved = 0;
  for (const t of ts) { const n = (await db.owner.query("SELECT count(*)::int AS n FROM " + t + " WHERE tenant_id = $1", [B])).rows[0].n; if (n !== bBefore[t]) { moved++; fail(t + ": B " + bBefore[t] + " → " + n); } }
  check(moved === 0, "tenant B's counts unchanged in every table", moved + " tables moved");
} catch (e) { fail("S8 ran", (e.code || "") + " " + e.message + "\n" + (e.stack || "").split("\n").slice(0, 5).join("\n")); }
await db.drop();
finish();
