/* ── SIGNING IN WITH AN EMAIL ADDRESS (§69.11) ───────────────────────────
   The door took a person key. A person key is minted from the name and shown
   in two places nobody looks (a row's hover title, and the Set-a-password
   prompt), so the one string it accepted was the one string nobody had —
   Islam, locked out of his own deployment with a password he had just issued
   himself.

   Driven against the real handler over HTTP rather than by calling the query
   directly: what is being asserted is what the DOOR does, including the
   refusals, and a refusal is a status code and a sentence rather than a return
   value. Every case that matters is here, including the two that must NOT
   work.

     DATABASE_URL=postgres://... node scripts/test-signin.js
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
        let out = "";
        res.on("data", function (c) { out += c; });
        res.on("end", function () {
          let j = null;
          try { j = JSON.parse(out); } catch (e) { j = { raw: out }; }
          resolve({ status: res.statusCode, body: j, cookie: (res.headers["set-cookie"] || [])[0] });
        });
      });
    req.on("error", reject);
    req.end(data);
  });
}

(async function () {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const dir = path.join(__dirname, "..", "db");
  await io.ensureReady(client, dir);

  /* A register shaped for the cases: one ordinary person with an address, one
     with NONE (the bootstrap SMO's situation), and two sharing one. */
  const state = JSON.parse(fs.readFileSync(path.join(dir, "seed-state.json"), "utf8"));
  const smo = state.people.filter(function (p) { return p.role === "super"; })[0] || state.people[0];
  state.people = [
    Object.assign({}, smo, { email: undefined }),                     /* no address at all */
    { key: "islamsaadany", name: "Islam Saadany", email: "Islam.Saadany@Forefront.Consulting " },
    { key: "shareda", name: "Shared A", email: "desk@raya.example" },
    { key: "sharedb", name: "Shared B", email: "desk@raya.example" }
  ];
  await io.writeState(client, state);

  const PW = "Raya_2026";
  ok("the password Islam used passes the policy", auth.passwordPolicy(PW) === null,
     auth.passwordPolicy(PW) || "");
  for (const k of [smo.key, "islamsaadany", "shareda", "sharedb"]) {
    await client.query(
      "INSERT INTO credentials (person_key, password_hash, must_change) VALUES ($1,$2,true) " +
      "ON CONFLICT (person_key) DO UPDATE SET password_hash = EXCLUDED.password_hash, " +
      "must_change = true", [k, auth.hashPassword(PW)]);
  }

  const server = http.createServer(handler);
  await new Promise(function (r) { server.listen(0, r); });
  const port = server.address().port;
  const clear = function () { return client.query("DELETE FROM login_attempts"); };

  /* ── The thing that was broken ──────────────────────────────────── */
  await clear();
  let r = await post(port, { action: "login", user: "islam.saadany@forefront.consulting", password: PW });
  ok("signs in with the email address", r.status === 200 && r.body.ok,
     r.body.error || ("as " + (r.body.person || {}).key));
  ok("...and is told to choose a password", !!(r.body.person || {}).mustChange);

  /* Typed the way a person types it, and stored the way a spreadsheet stored
     it: mixed case at both ends, and a trailing space in the register. */
  await clear();
  r = await post(port, { action: "login", user: "  Islam.SAADANY@Forefront.Consulting  ", password: PW });
  ok("case and stray spaces do not matter, at either end", r.status === 200 && r.body.ok,
     r.body.error || "");

  /* ── The fallback that keeps a deployment enterable ─────────────── */
  await clear();
  r = await post(port, { action: "login", user: smo.key, password: PW });
  ok("the person key still works (the bootstrap SMO has no address)",
     r.status === 200 && r.body.ok, r.body.error || "");

  /* ── The two that must NOT work ─────────────────────────────────── */
  await clear();
  r = await post(port, { action: "login", user: "desk@raya.example", password: PW });
  ok("an address on two rows signs NOBODY in", r.status === 401 && !r.body.ok);
  ok("...and says why, so the person stuck knows who to ask",
     /more than one row/i.test(r.body.error || ""), JSON.stringify(r.body.error));
  const tried = +(await client.query(
    "SELECT count(*) n FROM login_attempts WHERE key_tried = 'desk@raya.example'")).rows[0].n;
  ok("...and is rate limited like any other refusal", tried === 1,
     "(" + tried + " recorded — an unlimited one is an address oracle)");

  await clear();
  r = await post(port, { action: "login", user: "", password: PW });
  ok("an EMPTY box is not an ambiguous match", r.status === 401 &&
     !/more than one row/i.test(r.body.error || ""), JSON.stringify(r.body.error));

  await clear();
  r = await post(port, { action: "login", user: "nobody@raya.example", password: PW });
  ok("an unknown address is refused generically", r.status === 401 &&
     /Wrong sign-in/.test(r.body.error || ""), JSON.stringify(r.body.error));
  await clear();
  r = await post(port, { action: "login", user: "islam.saadany@forefront.consulting", password: "wrong" });
  ok("a known address with a wrong password says the SAME thing",
     r.status === 401 && /Wrong sign-in/.test(r.body.error || ""), JSON.stringify(r.body.error));

  /* ── Retired is still refused, by address as it was by key ──────── */
  state.people[1].active = false;
  await io.writeState(client, state);
  await client.query(
    "INSERT INTO credentials (person_key, password_hash, must_change) VALUES ($1,$2,true) " +
    "ON CONFLICT (person_key) DO UPDATE SET password_hash = EXCLUDED.password_hash",
    ["islamsaadany", auth.hashPassword(PW)]);
  await clear();
  r = await post(port, { action: "login", user: "islam.saadany@forefront.consulting", password: PW });
  ok("a RETIRED person is refused by address too", r.status === 401, JSON.stringify(r.body.error));
  delete state.people[1].active;
  await io.writeState(client, state);

  /* ── setPassword lowercases, as the door does ───────────────────── */
  await clear();
  await client.query("DELETE FROM credentials WHERE person_key = 'islamsaadany'");
  r = await post(port, { action: "login", user: smo.key, password: PW });
  const sess = (r.cookie || "").split(";")[0];
  ok("the SMO has a session to issue from", !!sess);
  r = await post(port, { action: "setPassword", person: "IslamSaadany", password: "Other_2026" }, sess);
  ok("Set a password accepts a mixed-case key", r.status === 200 && r.body.ok,
     JSON.stringify(r.body.error));
  const stored = (await client.query(
    "SELECT person_key FROM credentials WHERE lower(person_key) = 'islamsaadany'")).rows[0];
  ok("...and stores it lowercased, so the door can find it",
     !!stored && stored.person_key === "islamsaadany", stored ? stored.person_key : "(none)");
  await clear();
  r = await post(port, { action: "login", user: "islam.saadany@forefront.consulting", password: "Other_2026" });
  ok("...and that password then works", r.status === 200 && r.body.ok, JSON.stringify(r.body.error));

  /* ── And what the person sees next: the short list (§56, §57) ───── */
  const cookie = (r.cookie || "").split(";")[0];
  r = await post(port, { action: "whereList" }, cookie);
  ok("the where-do-you-work list is served after signing in",
     r.status === 200 && r.body.ok && Array.isArray(r.body.units),
     r.body.ok ? (r.body.units.length + " units, " + r.body.functions.length + " functions, near=" +
                  JSON.stringify(r.body.near)) : JSON.stringify(r.body.error));

  server.close();
  await client.end();
  console.log(fail.length ? "\nFAILED: " + fail.join(", ") : "\nall good");
  process.exit(fail.length ? 1 : 0);
})().catch(function (e) { console.error("FAIL:", e); process.exit(1); });
