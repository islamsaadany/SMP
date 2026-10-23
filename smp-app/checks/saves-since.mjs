/* §588.1 AGAINST A REAL POSTGRES: the save numbers itself (`saves`, migration
   029), the read answers "what changed since N" with the change itself, a
   list too large to carry is handed on as {full:true}, a refused save takes
   no number, and a list operation (§588) is a save the server accepts. Runs
   on the dev tenant (remade at the start), through the app's own save() and
   readAnswer() and under the app role's row policy — no HTTP, so it needs
   no `next build`. Prints one line per property (§215) and ends RED/GREEN.
     DATABASE_URL_UNPOOLED=postgres://…/smp_dev node checks/saves-since.mjs
     … --break=no-save-number   (RED: a save lands and is never numbered — every other tab stays stale, silently)
     … --break=no-sweep         (RED: the list is never swept — it grows for ever, §588.2)
   The break is read by lib/save.ts from SMP_BREAK (constitution XVI); the
   script passes it on. */
const brkArg = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8);
if (brkArg) process.env.SMP_BREAK = brkArg;
import pg from "pg";
import { devTenant } from "../scripts/dev-tenant.mjs";
import { SCHEMA } from "../db/schema-name.mjs";
import { save, SAVE_BYTES_CAP } from "../lib/save.ts";
import { readAnswer } from "../lib/state-api.ts";
import { withTenant } from "../lib/tenant.ts";
import { readState } from "../lib/state-io.ts";

const URL_ = process.env.DATABASE_URL_UNPOOLED;
let oks = 0, fails = 0;
const check = (c, l, m) => { if (c) { oks++; console.log("ok    " + l); } else { fails++; console.log("FAIL  " + l + (m === undefined ? "" : " — " + String(m).slice(0, 200))); } };

const { tenantId } = await devTenant({ url: URL_, log: () => {} });
const owner = new pg.Pool({ connectionString: URL_, max: 2, options: "-c search_path=" + SCHEMA });
const tenant = (await owner.query("SELECT * FROM tenants WHERE id = $1", [tenantId])).rows[0];
const urow = (await owner.query("SELECT * FROM users WHERE email = 'office@forefront.example'")).rows[0];
const user = { id: urow.id, email: urow.email, name: urow.name, kind: urow.kind, isAdmin: !!urow.is_admin, mustChange: false };
const r = { user, tenant, seat: "super", personKey: null };
const graph0 = await withTenant(tenantId, (c) => readState(c));
const smo = graph0.people.find((p) => p.key === "smo") || graph0.people[0];
const other = graph0.people.find((p) => p.key !== smo.key && p.key === "mobhead") || graph0.people.find((p) => p.key !== smo.key);
const actor = (p, role) => ({ key: p.key, name: p.name, role, email: p.key + "@raya.example" });
const rowEdit = (at, set) => ({ set: {}, del: [], rows: [{ at, path: [], id: null, set, del: [] }] });

console.log("\n1 · a fresh copy carries the number 0");
const full0 = await readAnswer(r, new URLSearchParams(""));
check(full0.code === 200 && full0.body.seq === 0, "the full read says seq 0", JSON.stringify({ code: full0.code, seq: full0.body.seq }));

/* The numbers run on from whatever the database has handed out before (one
   sequence, every tenant), so what is asserted is the ORDER and the gaps,
   never a literal. */
console.log("\n2 · saves number themselves in order");
const s1 = await save(tenantId, actor(smo, "super"), { changes: rowEdit("units.mobile", { aspiration: "First" }) });
check(s1.code === 200 && typeof s1.body.seq === "number" && s1.body.seq > 0, "the first save carries a number", JSON.stringify(s1.body).slice(0, 200));
const n1 = s1.body.seq;
const s2 = await save(tenantId, actor(smo, "super"), { changes: rowEdit("group", { org: "Second Ltd" }) });
check(s2.code === 200 && s2.body.seq === n1 + 1, "the second is the next number", JSON.stringify(s2.body).slice(0, 200));
const refused = await save(tenantId, actor(other, "owner"), { changes: { set: { access: {} }, del: [] } });
check(refused.code === 403, "a refused save is refused", refused.code);
const s3 = await save(tenantId, actor(smo, "super"), { changes: rowEdit("units.mobile", { aspiration: "Third" }) });
check(s3.code === 200 && s3.body.seq === n1 + 2, "...and takes no number: the next landed save follows straight on", JSON.stringify(s3.body).slice(0, 120));
const n3 = s3.body.seq;

console.log("\n3 · what changed since N is the change itself");
const a0 = await readAnswer(r, new URLSearchParams("after=0"));
check(a0.code === 200 && a0.body.ok && a0.body.changes.length === 3 && a0.body.seq === n3 && a0.body.more === false,
      "after=0 answers the three saves, up to the third's number", JSON.stringify(a0.body).slice(0, 200));
const first = a0.body.changes[0];
check(first && first.seq === n1 && first.by && first.changes && first.changes.rows && first.changes.rows[0].set.aspiration === "First",
      "...each carrying who, when and the change list as it was sent", JSON.stringify(first).slice(0, 200));
const a2 = await readAnswer(r, new URLSearchParams("after=" + (n1 + 1)));
check(a2.body.changes.length === 1 && a2.body.changes[0].seq === n3, "after the second answers only the third", JSON.stringify(a2.body).slice(0, 120));
const a3 = await readAnswer(r, new URLSearchParams("after=" + n3));
check(a3.body.changes.length === 0 && a3.body.seq === n3, "after the third answers nothing new and the same number", JSON.stringify(a3.body));
const bad = await readAnswer(r, new URLSearchParams("after=x"));
check(bad.code === 200 && bad.body.state && !bad.body.changes, "a number that is not one falls through to the ordinary read", bad.code);
const full3 = await readAnswer(r, new URLSearchParams(""));
check(full3.body.seq === n3 && full3.body.state.units.mobile.aspiration === "Third", "the full read carries the third's number and the graph at it", full3.body.seq);

console.log("\n4 · a list too large to carry is recorded as {full}");
const big = rowEdit("units.mobile", { aspiration: "x".repeat(SAVE_BYTES_CAP + 10) });
const s4 = await save(tenantId, actor(smo, "super"), { changes: big });
check(s4.code === 200 && s4.body.seq === n3 + 1, "the save lands and is numbered", JSON.stringify(s4.body).slice(0, 120));
const a3b = await readAnswer(r, new URLSearchParams("after=" + n3));
check(a3b.body.changes.length === 1 && a3b.body.changes[0].changes.full === true && !a3b.body.changes[0].changes.rows,
      "...and is handed on as {full:true}, not the list", JSON.stringify(a3b.body.changes[0]).slice(0, 160));

console.log("\n5 · a list operation (§588) is a save the server accepts");
const items = graph0.units.mobile.items;
const op = { set: {}, del: [], lists: [{ at: "units.mobile", path: [], list: "items",
  add: [{ row: { id: "mobile-P99-test", code: "", name: "Added by the test", sub: "", kind: "", theme: "", owner: "", measures: [], tactics: [] }, after: String(items[items.length - 1].id) }] }] };
const s5 = await save(tenantId, actor(smo, "super"), { changes: op });
check(s5.code === 200 && s5.body.seq === n3 + 2, "a pillar added as a list operation lands, numbered", JSON.stringify(s5.body).slice(0, 200));
const after5 = await withTenant(tenantId, (c) => readState(c));
const ids = after5.units.mobile.items.map((x) => x.id);
check(ids[ids.length - 1] === "mobile-P99-test" && ids.length === items.length + 1, "...and the stored plan holds it, last", ids.join());
check(after5.units.mobile.aspiration.length === SAVE_BYTES_CAP + 10, "...beside the figure the earlier save wrote", after5.units.mobile.aspiration.length);
const onlyLists = await save(tenantId, actor(smo, "super"), { changes: { lists: [{ at: "units.mobile", path: [], list: "items", drop: ["mobile-P99-test"] }] } });
check(onlyLists.code === 200, "a body that is only a list operation is a save, not 'no change list'", JSON.stringify(onlyLists.body).slice(0, 160));
const a5 = await readAnswer(r, new URLSearchParams("after=" + (n3 + 1)));
check(a5.body.changes.length === 2 && a5.body.changes[0].changes.lists && a5.body.changes[1].changes.lists, "...and both travel on as list operations", JSON.stringify(a5.body).slice(0, 200));

console.log("\n6 · the list is kept for a week (§588.2)");
{
  const old = (await owner.query("INSERT INTO saves (tenant_id, at, person_key, changes) VALUES ($1, now() - interval '8 days', 'old', '{}'::jsonb) RETURNING id", [tenantId])).rows[0].id;
  const there = async () => (await owner.query("SELECT count(*)::int AS n FROM saves WHERE id = $1", [old])).rows[0].n;
  check(await there() === 1, "an entry eight days old is in the list");
  const s7 = await save(tenantId, actor(smo, "super"), { changes: rowEdit("units.mobile", { aspiration: "Seventh" }) });
  check(s7.code === 200, "a save lands", s7.code);
  check(await there() === 0, "...and the week-old entry is gone with it");
  const a6 = await readAnswer(r, new URLSearchParams("after=0"));
  check(a6.body.oldest === n1, "the read names the oldest entry still kept", JSON.stringify({ oldest: a6.body.oldest, n1 }));
  check(a6.body.changes.length === 7 && a6.body.changes.every((x) => x.seq >= n1), "...and answers only kept entries", a6.body.changes.length);
}

console.log("\n7 · the number is per tenant");
const seqRows = await owner.query("SELECT count(*)::int AS n FROM saves WHERE tenant_id = $1", [tenantId]);
check(seqRows.rows[0].n === 7, "seven saves recorded for the tenant", seqRows.rows[0].n);

await owner.end();
console.log("\n" + oks + " ok, " + fails + " failed — " + (fails ? "RED" : "GREEN"));
process.exit(fails ? 1 : 0);
