/* ── THE SHORT LIST ON FIRST SIGN-IN (§57, fixed in §69.14) ──────────────
   It came back EMPTY for the one tenant it was built for, and the gate then
   drew the flat list it draws when nothing is mapped — so a narrowing that
   was working "correctly" looked exactly like a narrowing that was not there.

   The cause: an Official BU points at whatever `r.at` can name (§54) — a unit,
   fn:<key>, co:<key>, "group", or nothing — and this list offers units and
   functions only, because those are the places a person can BE. In Raya's
   tenant Distribution is a COMPANY, so it matched nothing.

   Driven over HTTP against the real handler, because what is asserted is what
   the DOOR serves.

     DATABASE_URL=postgres://... node scripts/test-wherelist.js
*/
const fs = require("fs");
const path = require("path");
const http = require("http");
const pg = require("pg");
const io = require("../lib/state-io.js");
const auth = require("../lib/auth.js");
const handler = require("../api/auth.js");

const fail = [];
function ok(label, cond, extra) {
  console.log((cond ? "PASS  " : "FAIL  ") + label + (extra ? "   " + extra : ""));
  if (!cond) fail.push(label);
}
function post(port, body, cookie) {
  return new Promise(function (resolve, reject) {
    const data = JSON.stringify(body);
    const req = http.request(
      { port: port, path: "/api/auth", method: "POST",
        headers: Object.assign(
          { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
          cookie ? { Cookie: cookie } : {}) },
      function (res) {
        let out = ""; res.on("data", function (c) { out += c; });
        res.on("end", function () {
          let j = null; try { j = JSON.parse(out); } catch (e) { j = { raw: out }; }
          resolve({ status: res.statusCode, body: j, cookie: (res.headers["set-cookie"] || [])[0] });
        });
      });
    req.on("error", reject); req.end(data);
  });
}

(async function () {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const dir = path.join(__dirname, "..", "db");
  await io.ensureReady(client, dir);
  const state = JSON.parse(fs.readFileSync(path.join(dir, "seed-state.json"), "utf8"));

  /* Islam's tenant, in the shape that broke it: the ten client names MAPPED,
     and the first of them pointing at a COMPANY. */
  const co = Object.keys(state.companies || {})[0];
  const held = state.unitKeys.filter(function (k) { return state.units[k].company === co; });
  const someFn = state.functionKeys[0];
  const someUnit = state.unitKeys.filter(function (k) { return held.indexOf(k) === -1; })[0];
  state.group.mainbus = [
    { name: "Distribution",     at: "co:" + co },
    { name: "Support Function", at: "fn:" + someFn },
    { name: "Retail",           at: someUnit },
    { name: "Everything",       at: "group" },
    { name: "Risk",             at: null }
  ];
  ok("the demo tenant really does hold a company with units", held.length > 1,
     co + ": " + held.join(", "));

  const P = "Where_2026";
  const mk = async function (key, name, bu) {
    state.people.push({ key: key, name: name, mainbu: bu });
    await io.writeState(client, state);
    await client.query(
      "INSERT INTO credentials (person_key, password_hash, must_change) VALUES ($1,$2,false) " +
      "ON CONFLICT (person_key) DO UPDATE SET password_hash = EXCLUDED.password_hash, " +
      "must_change = false", [key, auth.hashPassword(P)]);
  };
  state.people = [state.people[0]];
  await mk("atco",    "At A Company",  "Distribution");
  await mk("atfn",    "At A Function", "Support Function");
  await mk("atunit",  "At A Unit",     "Retail");
  await mk("atgroup", "At The Group",  "Everything");
  await mk("atnone",  "At Nothing",    "Risk");
  await mk("atblank", "No BU At All",  undefined);

  const server = http.createServer(handler);
  await new Promise(function (r) { server.listen(0, r); });
  const port = server.address().port;

  const near = async function (key) {
    await client.query("DELETE FROM login_attempts");
    const r = await post(port, { action: "login", user: key, password: P });
    const c = (r.cookie || "").split(";")[0];
    const w = await post(port, { action: "whereList" }, c);
    return w.body;
  };

  let j = await near("atco");
  ok("a company Official BU offers the units it holds",
     j.near.length === held.length && held.every(function (k) { return j.near.indexOf(k) > -1; }),
     JSON.stringify(j.near) + " vs " + JSON.stringify(held));
  ok("...and names the client's own word for it", j.mainbu === "Distribution", String(j.mainbu));
  ok("...and every one is really in the list served", j.near.every(function (at) {
       return j.units.concat(j.functions).some(function (x) { return x.at === at; }); }));

  j = await near("atfn");
  ok("a function Official BU offers that function",
     j.near.length === 1 && j.near[0] === "fn:" + someFn, JSON.stringify(j.near));
  j = await near("atunit");
  ok("a unit Official BU offers that unit",
     j.near.length === 1 && j.near[0] === someUnit, JSON.stringify(j.near));

  /* The two that must narrow NOTHING, and for different reasons. */
  j = await near("atgroup");
  ok("pointing at the GROUP narrows nothing", j.near.length === 0, JSON.stringify(j.near));
  j = await near("atnone");
  ok("pointing at nothing narrows nothing", j.near.length === 0, JSON.stringify(j.near));
  j = await near("atblank");
  ok("no Official BU at all narrows nothing", j.near.length === 0, JSON.stringify(j.near));
  ok("...and the full list is still served in every case",
     (j.units || []).length > 0 && (j.functions || []).length > 0,
     (j.units || []).length + " units, " + (j.functions || []).length + " functions");

  /* A RETIRED unit is not somewhere to be seated, so a company holding one
     must not offer it (the list itself already excludes retired units). */
  state.units[held[0]].active = false;
  await io.writeState(client, state);
  j = await near("atco");
  ok("a retired unit is not offered, even from its own company",
     j.near.indexOf(held[0]) === -1 && j.near.length === held.length - 1,
     JSON.stringify(j.near));

  server.close();
  await client.end();
  console.log(fail.length ? "\nFAILED: " + fail.join(", ") : "\nall good");
  process.exit(fail.length ? 1 : 0);
})().catch(function (e) { console.error("FAIL:", e); process.exit(1); });
