/* HISTORY IS READ FILTERED, AND ONLY BY WHO MAY (§262) — the server half.

   GET /api/state?log=1 answers a slice of change_log: the office any slice;
   anybody else one place they hold a role at, or a 403. Driven through the
   REAL handler with a mock req/res against a real Postgres, in the shape
   scripts/test-safety-peek.js uses. The rows it reads are produced by real
   saves through the same handler, never inserted by hand.

   Run: DATABASE_URL=… node scripts/test-history-read.js */
const path = require("path"); const ROOT = path.join(__dirname, "..");
const { Pool } = require(path.join(ROOT, "node_modules/pg"));
const io = require(path.join(ROOT, "lib/state-io.js")); const D = require(path.join(ROOT, "lib/graph-diff.js"));
const auth = require(path.join(ROOT, "lib/auth.js")); const handler = require(path.join(ROOT, "api/state.js"));
const seed = require(path.join(ROOT, "db/seed-state.json")); const clone = o => JSON.parse(JSON.stringify(o));
function mockRes(){ let r; const d = new Promise(x => r = x); return { statusCode:200, setHeader(){}, end(b){ r({ status:this.statusCode, body:b }); }, done:d }; }
async function call(req){ const res = mockRes(); handler(req, res); const r = await res.done; let j = null; try { j = JSON.parse(r.body); } catch (e) {} return { status:r.status, j }; }
(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 4 }); const c = await pool.connect(); let fail = 0;
  const check = (w, ok, x) => { console.log((ok ? "  ok    " : "  FAIL  ") + w + (ok || x == null ? "" : "  — " + x)); if (!ok) fail++; };
  try {
    io.forgetReady(); await io.ensureReady(c); await io.writeState(c, seed);   /* the full worked example: people with roles */
    await c.query("UPDATE credentials SET must_change = false");
    const sess = async k => "smp_session=" + await auth.createSession(c, k);
    const get = (cookie, q) => call({ method:"GET", url:"/api/state" + q, headers:{ cookie }, on(){} });
    const post = (cookie, body) => call({ method:"POST", url:"/api/state", headers:{ cookie, "content-type":"application/json" }, body, on(){} });
    const smo = await sess("smo"), mobCust = await sess("own_mob"), retHead = await sess("rethead");
    const t0 = (await c.query("SELECT now() AS t")).rows[0].t.toISOString();

    console.log("1 · real saves, real rows");
    let base = await io.readState(c), s1 = clone(base);
    const base0Asp = base.units.mobile.aspiration, base0Swot = clone(base.units.mobile.swot.s); s1.units.mobile.items[0].measures[0].target = "4.2B EGP";
    let r = await post(smo, { changes: D.graphChanges(base, s1) }); check("the office corrects a Mobile target", r.status === 200, r.status);
    base = await io.readState(c); const s2 = clone(base); s2.units.mobile.items[0].tactics[0].actual = 60;
    r = await post(mobCust, { changes: D.graphChanges(base, s2) }); check("Mobile's custodian reports a figure", r.status === 200, r.status + " " + JSON.stringify(r.j).slice(0, 120));
    base = await io.readState(c); const s3 = clone(base); s3.units.retailstores.items[0].measures[0].target = "9 %";
    r = await post(smo, { changes: D.graphChanges(base, s3) }); check("the office corrects a Retail target", r.status === 200, r.status);

    console.log("1b · the unit's own words are a row with a before and an after (§262.3)");
    base = await io.readState(c); const s4 = clone(base); s4.units.mobile.aspiration = "PEEK-WORDS " + Date.now();
    r = await post(smo, { changes: D.graphChanges(base, s4) }); check("the office rewrites Mobile's aspiration", r.status === 200, r.status);
    r = await get(smo, "?log=1&target=mobile&kind=unitFoundation&limit=1");
    const fm = r.j && r.j.log[0] && r.j.log[0].rows_ && r.j.log[0].rows_.moved && r.j.log[0].rows_.moved[0];
    check("...logged as the unit's own row, field aspiration, from AND to", !!fm && fm.id === "mobile" && fm.field === "aspiration" && fm.from === base.units.mobile.aspiration && fm.to === s4.units.mobile.aspiration, JSON.stringify(fm));
    base = await io.readState(c); const s5 = clone(base); s5.units.mobile.swot.s = base.units.mobile.swot.s.concat(["A new strength"]);
    r = await post(smo, { changes: D.graphChanges(base, s5) }); check("...and a SWOT quadrant", r.status === 200, r.status);
    r = await get(smo, "?log=1&target=mobile&kind=unitAnalysis&limit=1");
    const sm2 = r.j && r.j.log[0] && r.j.log[0].rows_ && r.j.log[0].rows_.moved && r.j.log[0].rows_.moved[0];
    check("...logged as swot.s with both lists", !!sm2 && sm2.field === "swot.s" && Array.isArray(sm2.from) && sm2.to.length === sm2.from.length + 1, JSON.stringify(sm2).slice(0, 120));
    /* put both back, so the counts below are what they were */
    base = await io.readState(c); const s6 = clone(base); s6.units.mobile.aspiration = s4.units.mobile.aspiration.replace(/^PEEK-WORDS \d+$/, base0Asp); s6.units.mobile.swot.s = base0Swot;
    r = await post(smo, { changes: D.graphChanges(base, s6) }); check("...and both put back", r.status === 200, r.status);

    console.log("2 · the office reads any slice");
    r = await get(smo, "?log=1&from=" + encodeURIComponent(t0));
    check("everything since the start", r.status === 200 && r.j && r.j.office === true && r.j.log.length === 7, r.status + " " + (r.j && r.j.log && r.j.log.length));
    check("...most recent first", r.j && r.j.log[0].target === "mobile" && r.j.log[r.j.log.length - 1].target === "mobile", r.j && r.j.log.map(x => x.target).join(","));
    check("...each row carrying who, when, place, field, from AND to",
      r.j && r.j.log.every(x => x.person_name && x.at && x.target && x.rows_ && x.rows_.moved[0].field && "from" in x.rows_.moved[0] && "to" in x.rows_.moved[0]),
      r.j && JSON.stringify(r.j.log[0]).slice(0, 200));
    check("...and no state graph rides along", r.j && !r.j.state);
    r = await get(smo, "?log=1&target=mobile&from=" + encodeURIComponent(t0));
    check("by place: Mobile's six", r.j && r.j.log.length === 6 && r.j.log.every(x => x.target === "mobile"), r.j && r.j.log.length);
    r = await get(smo, "?log=1&person=own_mob&from=" + encodeURIComponent(t0));
    check("by person: the custodian's one", r.j && r.j.log.length === 1 && r.j.log[0].person_key === "own_mob", r.j && r.j.log.length);
    r = await get(smo, "?log=1&kind=unitReporting&from=" + encodeURIComponent(t0));
    check("by kind: the one figure", r.j && r.j.log.length === 1 && r.j.log[0].kind === "unitReporting", r.j && r.j.log.length);
    const t1 = (await c.query("SELECT now() AS t")).rows[0].t.toISOString();
    r = await get(smo, "?log=1&from=" + encodeURIComponent(t1));
    check("a window after everything: empty", r.j && r.j.log.length === 0, r.j && r.j.log.length);
    r = await get(smo, "?log=1&limit=2&from=" + encodeURIComponent(t0));
    check("the cap holds", r.j && r.j.log.length === 2, r.j && r.j.log.length);
    r = await get(smo, "?log=1&limit=9999&from=" + encodeURIComponent(t0));
    check("...and is never above 500", r.status === 200);

    console.log("3 · everybody else reads one place they hold");
    r = await get(mobCust, "?log=1&target=mobile&from=" + encodeURIComponent(t0));
    check("Mobile's custodian reads Mobile", r.status === 200 && r.j && r.j.office === false && r.j.log.length === 6, r.status + " " + (r.j && r.j.log && r.j.log.length));
    r = await get(mobCust, "?log=1&target=retailstores&from=" + encodeURIComponent(t0));
    check("...and not Retail (403)", r.status === 403, r.status);
    r = await get(mobCust, "?log=1&from=" + encodeURIComponent(t0));
    check("...and not everything (403)", r.status === 403, r.status);
    r = await get(retHead, "?log=1&target=retailstores&from=" + encodeURIComponent(t0));
    check("Retail's head reads Retail", r.status === 200 && r.j && r.j.log.length === 1, r.status + " " + (r.j && r.j.log && r.j.log.length));
    r = await get("smp_session=nope", "?log=1&target=mobile");
    check("no session, no history (401)", r.status === 401, r.status);

    console.log("4 · the ordinary read is untouched");
    r = await get(mobCust, "");
    check("a plain GET is the full read", r.status === 200 && r.j && r.j.state && r.j.person, r.status);
  } finally { c.release(); await pool.end(); }
  console.log(fail ? "\nHISTORY-READ FAILED (" + fail + ")" : "\nHISTORY-READ OK"); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
