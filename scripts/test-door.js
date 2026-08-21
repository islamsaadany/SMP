/* The door: temporary passwords, rate limiting, sessions (spec 007).
   Needs a running dev-server and a database — unlike test-authorize.js none of
   this is pure, and none of it can be checked without the real handlers.

     DATABASE_URL=postgres://... node scripts/dev-server.js &
     node scripts/test-door.js [smo-password]

   The password is an argument because retiring 1234 (§43.1) means the FIRST
   run against a fresh database uses it and every run after that does not.
   The run prints the password it leaves behind.

   It ends by locking the SMO out for the rate-limit window, deliberately —
   that is the trade-off in §43.3, and a test that cannot show it is not
   testing the limiter. */
const BASE = process.env.SMP_BASE || "http://localhost:3999";
const SMO_PW = process.argv[2] || "1234";
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok    " + n); }
  else { fail++; console.log("  FAIL  " + n + (x ? "  << " + x : "")); } };

async function post(path, body, jar, ip) {
  const headers = { "Content-Type": "application/json" };
  if (jar && jar.cookie) headers.Cookie = jar.cookie;
  if (ip) headers["x-forwarded-for"] = ip;
  const r = await fetch(BASE + path, { method: "POST", headers, body: JSON.stringify(body) });
  const set = r.headers.get("set-cookie");
  if (set && jar) jar.cookie = set.split(";")[0];
  let b = null; try { b = await r.json(); } catch (e) {}
  return { status: r.status, body: b };
}
const stateStatus = jar => fetch(BASE + "/api/state", { headers: { Cookie: jar.cookie } })
  .then(r => r.status);

(async () => {
  const IP = "10.1.1.1";
  console.log("\n1 · a temporary password buys nothing");
  const a = {};
  let r = await post("/api/auth", { action: "login", user: "smo", password: SMO_PW }, a, IP);
  ok("the SMO signs in", r.status === 200, JSON.stringify(r.body));
  if (r.body && r.body.person && r.body.person.mustChange) {
    ok("and is told to choose their own", true);
    ok("the state is refused until they do", await stateStatus(a) === 403);
  } else {
    console.log("  ..    this SMO has already chosen a password — those two skipped");
  }

  console.log("\n2 · choosing one");
  const NEW = "Str0ng!" + Math.floor(Math.random() * 100000);
  r = await post("/api/auth", { action: "change", password: "1234" }, a, IP);
  ok("a weak password is refused", r.status === 400, JSON.stringify(r.body));
  r = await post("/api/auth", { action: "change", password: NEW }, a, IP);
  ok("a strong one is accepted", r.status === 200, JSON.stringify(r.body));
  ok("and the state opens", await stateStatus(a) === 200);

  console.log("\n3 · a password change ends the OTHER sessions");
  const b = {}, c = {};
  await post("/api/auth", { action: "login", user: "smo", password: NEW }, b, IP);
  await post("/api/auth", { action: "login", user: "smo", password: NEW }, c, IP);
  ok("two more sessions, both live", await stateStatus(b) === 200 && await stateStatus(c) === 200);
  const NEW2 = NEW + "x";
  r = await post("/api/auth", { action: "change", password: NEW2 }, c, IP);
  ok("one of them changes the password", r.status === 200, JSON.stringify(r.body));
  ok("it keeps its own session", await stateStatus(c) === 200);
  ok("the other is gone", await stateStatus(b) === 401);

  console.log("\n4 · errors say nothing about the schema");
  r = await post("/api/auth", { action: "nonsense" }, null, IP);
  ok("an unknown action is a plain refusal",
     r.status === 400 && !/relation|column|syntax|pg_/i.test(String(r.body && r.body.error)));

  console.log("\n5 · guessing is slowed down  (this locks the SMO out for the window)");
  const GIP = "10.9.9." + (1 + Math.floor(Math.random() * 200));
  let blockedAt = null, last = null;
  for (let i = 1; i <= 12; i++) {
    last = await post("/api/auth", { action: "login", user: "smo", password: "wrong" + i }, null, GIP);
    if (last.status === 429 && blockedAt === null) blockedAt = i;
  }
  ok("the attempts are cut off", blockedAt !== null && blockedAt <= 9, "blocked at " + blockedAt);
  r = await post("/api/auth", { action: "login", user: "smo", password: NEW2 }, null, GIP);
  ok("and a CORRECT password does not bypass the limit", r.status === 429, String(r.status));
  console.log("        " + (last.body && last.body.error));

  console.log("\n" + pass + " passed, " + fail + " failed");
  console.log("the SMO password is now: " + NEW2);
  console.log("the SMO is rate-limited for the window — that is §43.3's trade-off,");
  console.log("shown rather than described. DELETE FROM login_attempts; clears it.");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
