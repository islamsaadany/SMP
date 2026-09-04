/* THE PAGE ASKS WHO ELSE LANDED A CHANGE ON IT (§258) — the server half.

   GET /api/state?since=<iso>&target=<unit key | fn:key> answers from change_log
   (the log every save already writes, §42): who else, and when, oldest first,
   the asker excluded. An unparseable `since` falls through to the ordinary
   read. Driven through the REAL handler with a mock req/res, against a real
   Postgres, in the shape scripts/test-concurrent-saves.js uses.

   Run: DATABASE_URL=… node scripts/test-safety-peek.js */
const path = require("path");
const ROOT = path.join(__dirname, "..");
const { Pool } = require(path.join(ROOT, "node_modules/pg"));
const io = require(path.join(ROOT, "lib/state-io.js"));
const D = require(path.join(ROOT, "lib/graph-diff.js"));
const auth = require(path.join(ROOT, "lib/auth.js"));
const handler = require(path.join(ROOT, "api/state.js"));
const clone = o => JSON.parse(JSON.stringify(o));

function mockRes() {
  let resolve;
  const done = new Promise(r => (resolve = r));
  const res = { statusCode: 200, setHeader() {},
    end(body) { resolve({ status: this.statusCode, body: body }); }, done };
  return res;
}
async function call(req) { const res = mockRes(); handler(req, res); const r = await res.done;
  let j = null; try { j = JSON.parse(r.body); } catch (e) {} return { status: r.status, j: j }; }

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
  let fail = 0;
  const check = (w, ok, x) => { console.log((ok ? "  ok    " : "  FAIL  ") + w + (ok || x == null ? "" : "  — " + x)); if (!ok) fail++; };
  const c = await pool.connect();
  try {
    io.forgetReady();
    await io.ensureReady(c);
    await c.query("UPDATE credentials SET must_change = false WHERE person_key = 'smo'");
    const smo = "smp_session=" + await auth.createSession(c, "smo");
    /* A clean-slate tenant holds the bootstrap SMO alone (§21), so the
       "somebody else" is minted here — a plain register row with no seat. */
    await c.query("INSERT INTO people (key, idx, name) VALUES ('peeker', 999, 'Peek Person') ON CONFLICT (key) DO NOTHING");
    const base = await io.readState(c);
    const otherKey = "peeker";
    const other = "smp_session=" + await auth.createSession(c, otherKey);
    const unit = base.unitKeys[0], unit2 = base.unitKeys[1];
    const fnKey = Object.keys(base.functions || {})[0];
    const t0 = (await c.query("SELECT now() AS t")).rows[0].t.toISOString();
    const get = (cookie, q) => call({ method: "GET", url: "/api/state" + (q || ""), headers: { cookie }, on() {} });
    const post = (cookie, body) => call({ method: "POST", url: "/api/state",
      headers: { cookie, "content-type": "application/json" }, body, on() {} });

    console.log("1 · nothing landed yet");
    let r = await get(other, "?since=" + encodeURIComponent(t0) + "&target=" + unit);
    check("answers 200 with an empty list", r.status === 200 && r.j && Array.isArray(r.j.changed) && r.j.changed.length === 0, r.status + " " + JSON.stringify(r.j).slice(0, 120));
    check("...and carries no state graph (a peek is light)", r.j && !r.j.state);

    console.log("2 · the office lands a change on " + unit);
    const screen = clone(base); screen.units[unit].aspiration = "PEEK-" + Date.now();
    r = await post(smo, { changes: D.graphChanges(base, screen) });
    check("the save is accepted", r.status === 200, r.status + " " + JSON.stringify(r.j));
    r = await get(other, "?since=" + encodeURIComponent(t0) + "&target=" + unit);
    check("somebody else asking about that page is told", r.j && r.j.changed && r.j.changed.length === 1, JSON.stringify(r.j && r.j.changed));
    const smoName = base.people.find(p => p.key === "smo").name;
    check("...and told WHO", r.j && r.j.changed[0] && r.j.changed[0].by === smoName, r.j && JSON.stringify(r.j.changed[0]));
    check("...and WHEN, parseable", r.j && r.j.changed[0] && !isNaN(Date.parse(r.j.changed[0].at)));
    r = await get(smo, "?since=" + encodeURIComponent(t0) + "&target=" + unit);
    check("the asker's own landing is not news to them", r.j && r.j.changed && r.j.changed.length === 0, JSON.stringify(r.j && r.j.changed));
    r = await get(other, "?since=" + encodeURIComponent(t0) + "&target=" + unit2);
    check("another page's asker is told nothing", r.j && r.j.changed && r.j.changed.length === 0, JSON.stringify(r.j && r.j.changed));
    const t1 = (await c.query("SELECT now() AS t")).rows[0].t.toISOString();
    r = await get(other, "?since=" + encodeURIComponent(t1) + "&target=" + unit);
    check("asking from AFTER the landing is told nothing", r.j && r.j.changed && r.j.changed.length === 0, JSON.stringify(r.j && r.j.changed));

    if (fnKey) {
      console.log("3 · a supporting function is a page too (fn:" + fnKey + ")");
      const s2 = clone(base); s2.functions[fnKey].def = "PEEK-FN-" + Date.now();
      r = await post(smo, { changes: D.graphChanges(base, s2) });
      check("the function save is accepted", r.status === 200, r.status + " " + JSON.stringify(r.j));
      const logged = (await c.query("SELECT DISTINCT target FROM change_log WHERE at > $1", [t1])).rows.map(x => x.target);
      check("the log names it as fn:<key>", logged.indexOf("fn:" + fnKey) >= 0, JSON.stringify(logged));
      r = await get(other, "?since=" + encodeURIComponent(t1) + "&target=" + encodeURIComponent("fn:" + fnKey));
      check("a peek on the function's page is told", r.j && r.j.changed && r.j.changed.length >= 1, JSON.stringify(r.j && r.j.changed));
    }

    console.log("3b · the first ask syncs the tab's clock to the database's (§258.1)");
    r = await get(other, "?since=" + encodeURIComponent(t0) + "&target=" + unit + "&sync=1");
    check("a sync answers the server's now and no changes", r.status === 200 && r.j && r.j.now && !isNaN(Date.parse(r.j.now)) && Array.isArray(r.j.changed) && r.j.changed.length === 0, JSON.stringify(r.j));
    const dbNow = (await c.query("SELECT now() AS t")).rows[0].t.getTime();
    check("...and it is the DATABASE's clock, within 5s", r.j && Math.abs(Date.parse(r.j.now) - dbNow) < 5000, r.j && r.j.now);
    check("...carrying no state graph", r.j && !r.j.state);

    console.log("4 · the ordinary read is untouched");
    r = await get(other, "?since=garbage&target=" + unit);
    check("an unreadable since falls through to the full read", r.status === 200 && r.j && r.j.state && !r.j.changed, r.status);
    r = await get(other, "?since=" + encodeURIComponent(t0));
    check("since without a target falls through to the full read", r.status === 200 && r.j && r.j.state && !r.j.changed, r.status);
    r = await get(other);
    check("a plain GET is the full read", r.status === 200 && r.j && r.j.state && r.j.person, r.status);
    r = await get("smp_session=nope", "?since=" + encodeURIComponent(t0) + "&target=" + unit);
    check("no session, no peek (401)", r.status === 401, r.status);
  } finally { c.release(); await pool.end(); }
  console.log(fail ? "\nSAFETY-PEEK FAILED (" + fail + ")" : "\nSAFETY-PEEK OK");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
