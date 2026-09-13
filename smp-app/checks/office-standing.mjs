/* THE OFFICE'S OWN ROW KEEPS ITS STANDING (§338).

   Islam, setting a client up through the flow: *"a strange error it worked
   with the team but for me it's not working"* — inside the client he had
   just created he read **NO ROLE** and *"No pages granted"*, while every
   colleague he added worked.

   THE FAULT HITS WHOEVER OPENS A CLIENT HOLDING NO SEAT. A Forefront admin
   opens one BY RULE (door.ts's seatFor) and holds no `tenant_users` row, so
   `officeRow` mints them a register row and nothing else records them. The
   moment they add the FIRST colleague, setTeam's sweep — *"a row the platform
   minted and nobody is any more is retired"* — reads them as nobody and
   retires their own row. It never came back: the adoption branch set the role
   and never the standing, and the mint path's `ON CONFLICT DO NOTHING`
   returned the retired row untouched.

   §339 STOPS THAT STATE ARISING AT CREATION and does not retire this check:
   the creator is written onto the team as the client is made, so what is left
   here is every OTHER way in — an admin opening a client a colleague made, a
   client made before §339, or one whose creator was taken off the team. The
   fixture builds that state deliberately rather than by making a client.

     DATABASE_URL_UNPOOLED=postgres://…/smp_dev node checks/office-standing.mjs
     … --break=no-heal   (RED: placing somebody no longer lifts the retirement)

   NO BROWSER AND NO SERVER (§94.11 does not apply — none of this is drawn):
   the subject is three functions and a table, and the landing is asked
   through lib/frozen.cjs exactly as the page asks it. Every probe degrades
   rather than dying (§215). */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import pg from "pg";
import { applyAll } from "../db/apply.mjs";
import { SCHEMA } from "../db/schema-name.mjs";
import { withTenant } from "../lib/tenant.ts";
import { loadGraph, readState } from "../lib/state-io.ts";
import { officeRow, registerKeyFor } from "../lib/state-api.ts";

const require = createRequire(import.meta.url);
const frozen = require("../lib/frozen.cjs");
const here = dirname(fileURLToPath(import.meta.url));
const URL_ = process.env.DATABASE_URL_UNPOOLED || "postgres://postgres:postgres@localhost:5432/smp_dev";
const brk = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8);
if (brk) process.env.SMP_BREAK = brk;   /* read at call time, so this lands */
let oks = 0, fails = 0;
const ok = (l) => { oks++; console.log("ok    " + l); };
const fail = (l, m) => { fails++; console.log("FAIL  " + l + (m === undefined ? "" : " — " + String(m).slice(0, 200))); };
const check = (c, l, m) => (c ? ok(l) : fail(l, m));

const KEY = "check-standing";
const HIM = "creator@forefront.example", HER = "colleague@forefront.example";
const pk = (e) => "ff_" + String(e).toLowerCase().split("@")[0].replace(/[^a-z0-9]+/g, "_").slice(0, 24);

await applyAll(URL_, { appPassword: process.env.SMP_APP_PASSWORD || "smp_app", log: () => {} });
const owner = new pg.Client({ connectionString: URL_, options: "-c search_path=" + SCHEMA });
await owner.connect();
try {
  await owner.query("DELETE FROM tenants WHERE key = $1", [KEY]);
  await owner.query("DELETE FROM users WHERE email IN ($1,$2)", [HIM, HER]);

  /* createClient's graph, verbatim — bare, with an EMPTY register. The
     membership §339 writes beside it is deliberately NOT written here: the
     subject is an admin who holds no seat, which is what §338 is about. */
  const seed = JSON.parse(readFileSync(join(here, "..", "..", "db", "seed-state.json"), "utf8"));
  const t = (await owner.query(
    "INSERT INTO tenants (key, name, made_here) VALUES ($1,'Check Standing',true) RETURNING id", [KEY])).rows[0];
  const g = frozen.bare(seed); g.group.org = "Check Standing"; g.people = [];
  for (const k of g.functionKeys || []) if (g.functions[k]) g.functions[k].head = null;
  await withTenant(t.id, (c) => loadGraph(c, g));
  const T = { id: t.id, key: KEY, name: "Check Standing", kind: "client", status: "active", made_here: true, mark: null };

  const mk = async (email, name, admin) => (await owner.query(
    "INSERT INTO users (email, name, kind, is_admin, must_change, password_hash) VALUES ($1,$2,'office',$3,false,'x') RETURNING id",
    [email, name, admin])).rows[0].id;
  const himId = await mk(HIM, "The Creator", true);
  const herId = await mk(HER, "A Colleague", false);
  const userOf = async (id) => (await owner.query("SELECT id, email, name, is_admin FROM users WHERE id = $1", [id])).rows[0];
  const asUser = (u) => ({ id: u.id, email: u.email, name: u.name, kind: "office", isAdmin: !!u.is_admin, mustChange: false });

  /* setTeam's own tail — the membership, then the sweep and the seat */
  async function setTeam(id, email, seat) {
    const u = await userOf(id), personKey = pk(email);
    await withTenant(t.id, (c) => officeRow(c, asUser(u), T, seat, personKey));
    await owner.query(
      "INSERT INTO tenant_users (tenant_id, user_id, person_key, seat) VALUES ($1,$2,$3,$4) " +
      "ON CONFLICT (tenant_id, user_id) DO UPDATE SET seat = EXCLUDED.seat", [t.id, u.id, personKey, seat]);
    const team = (await owner.query("SELECT person_key FROM tenant_users WHERE tenant_id = $1", [t.id])).rows.map((x) => x.person_key);
    await withTenant(t.id, async (c) => {
      await c.query("UPDATE people SET extra = jsonb_set(COALESCE(extra,'{}'::jsonb), '{active}', 'false'::jsonb) WHERE extra->>'ffrow' = 'true' AND key <> ALL($1::text[])", [team]);
      await c.query("UPDATE people SET role = $2 WHERE key = $1 AND extra->>'ffrow' = 'true'", [personKey, seat]);
    });
  }
  const pagesFor = async (email) => {
    const graph = await withTenant(t.id, (c) => readState(c));
    const key = await withTenant(t.id, (c) => registerKeyFor(c, email, pk(email)));
    const out = frozen.landing(graph, key || "");
    return { pages: (out.pages || []).length, chips: out.chips || [] };
  };
  const standing = async (key) => (await withTenant(t.id, (c) => c.query(
    "SELECT COALESCE(extra->>'active','') AS a FROM people WHERE key = $1", [key]))).rows[0];

  /* 1 · he opens a client holding no membership — admin, by rule */
  const himUser = asUser(await userOf(himId));
  await withTenant(t.id, (c) => officeRow(c, himUser, T, "super", null));
  let mine = await pagesFor(HIM);
  check(mine.pages > 0 && mine.chips.length > 0,
    "an admin holding no seat opens the client and wears the Super user seat", JSON.stringify(mine));

  /* 2 · he adds the first colleague — the sweep runs */
  await setTeam(herId, HER, "smoteam");
  const hers = await pagesFor(HER);
  check(hers.pages > 0, "the colleague he adds reads their pages — this half always worked", JSON.stringify(hers));

  /* 3 · THE PROPERTY: his very next page load puts him back. `personFor`
     calls officeRow on every request, so this is the load nobody has to
     make on purpose — which is what turns a permanent lock-out into a
     flicker nobody sees. */
  await withTenant(t.id, (c) => officeRow(c, himUser, T, "super", null));
  mine = await pagesFor(HIM);
  check(mine.pages > 0, "…and HIS next page load reads his pages again (§338)", JSON.stringify(mine));
  check(mine.chips.some((c) => /super/i.test(c.role)),
    "…wearing the Super user seat, not a blank role", JSON.stringify(mine.chips));
  const st = await standing(pk(HIM));
  check(st && st.a !== "false", "…because the retirement his own team sweep wrote is lifted", JSON.stringify(st));

  /* 4 · BOTH ENDS (§94.2): being taken OFF a team must still retire the row,
     or a build that simply stopped retiring anybody passes everything above
     while quietly leaving every departed consultant on the register. */
  await owner.query("DELETE FROM tenant_users WHERE tenant_id = $1 AND user_id = $2", [t.id, herId]);
  await setTeam(himId, HIM, "super");
  const gone = await standing(pk(HER));
  check(gone && gone.a === "false",
    "a colleague taken off the team IS retired — the sweep still does its job", JSON.stringify(gone));
  const hersNow = await pagesFor(HER);
  check(hersNow.pages === 0, "…and reads nothing on that client", JSON.stringify(hersNow));

  await owner.query("DELETE FROM tenants WHERE key = $1", [KEY]);
  await owner.query("DELETE FROM users WHERE email IN ($1,$2)", [HIM, HER]);
} catch (e) {
  fail("the check ran to the end", e && e.message);
} finally {
  await owner.end().catch(() => {});
}
console.log("\n" + (fails ? "RED " : "GREEN ") + oks + " passed, " + fails + " failed" + (brk ? "  (--break=" + brk + ")" : ""));
process.exit(fails ? 1 : 0);
