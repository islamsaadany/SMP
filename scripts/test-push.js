/* ══ A BOX THAT ARRIVES WITH NO TAB OPEN — THE SERVER HALF (§226) ═════════

   Needs a real Postgres:
     DATABASE_URL=… node scripts/test-push.js

   IT STANDS IN FRONT OF THE PUSH SERVICE, rather than mocking the library
   (§100.3, and the same reason SMP_RESEND_ENDPOINT and GEMINI_ENDPOINT are
   environment variables). A subscription's endpoint is simply a URL the
   browser hands over, so a test can hand over one of its own — which means
   what actually leaves this platform is read off the wire, encrypted body
   and VAPID header and all, by the real `web-push` doing the real thing.
   Nothing in `lib/push.js` branches for a test.

   HTTPS BECAUSE THE GUARD REQUIRES IT, and the guard requires it because the
   endpoint is fetched by our own server: an http one would be somebody
   pointing it at a host of their choosing. A self-signed certificate and
   NODE_TLS_REJECT_UNAUTHORIZED for this process only. */

const https = require("https");
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const pg = require("pg");

const io = require("../lib/state-io.js");
const push = require("../lib/push.js");

let pass = 0;
const fails = [];
function ok(cond, what, extra) {
  if (cond) { pass++; console.log("  ok   " + what); }
  else { fails.push(what); console.log("  FAIL " + what + (extra === undefined ? "" : "  — " + JSON.stringify(extra))); }
}

/* A throwaway certificate, made here rather than committed: a key in the
   repository is a key in the repository, whatever it is for. */
function makeCert() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "smp-push-"));
  const key = path.join(dir, "k.pem"), crt = path.join(dir, "c.pem");
  execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes",
    "-keyout", key, "-out", crt, "-days", "1", "-subj", "/CN=localhost"],
    { stdio: "ignore" });
  return { key: fs.readFileSync(key), cert: fs.readFileSync(crt) };
}

(async function () {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";   // our own self-signed cert

  const got = [];                 /* every request the "push service" received */
  const answer = { code: 201 };   /* what it answers with, so 410 can be driven */
  const pem = makeCert();
  const srv = https.createServer(pem, function (req, res) {
    let raw = Buffer.alloc(0);
    req.on("data", function (c) { raw = Buffer.concat([raw, c]); });
    req.on("end", function () {
      got.push({ path: req.url, auth: req.headers.authorization || "",
                 encoding: req.headers["content-encoding"] || "",
                 ttl: req.headers.ttl, bytes: raw.length });
      res.writeHead(answer.code); res.end();
    });
  });
  await new Promise(function (r) { srv.listen(0, "127.0.0.1", r); });
  const PORT = srv.address().port;
  const EP = function (n) { return "https://127.0.0.1:" + PORT + "/dev/" + n; };

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await io.ensureReady(client);

    /* ── THE KEY PAIR IS MINTED ONCE AND KEPT ────────────────────────── */
    console.log("\nTHE DEPLOYMENT MINTS ITS OWN KEY PAIR, ONCE.");
    await client.query("DELETE FROM push_keys");
    const k1 = await push.publicKey(client);
    ok(!!k1 && k1.length > 40, "a public key comes back", k1 && k1.length);
    const rows = (await client.query("SELECT public_key, private_key FROM push_keys")).rows;
    ok(rows.length === 1, "and exactly one pair is stored", rows.length);
    ok(rows[0].public_key === k1, "...the same one that was handed out");
    ok(rows[0].private_key && rows[0].private_key !== rows[0].public_key,
       "...with a private half that is not the public one");
    /* IT IS NEVER MINTED TWICE. A second deployment reading it must get the
       same key, or every device subscribed under the first goes silent. */
    const k2 = await push.publicKey(client);
    ok(k2 === k1, "asking again gives the same key, never a new pair");

    /* ── A DEVICE THAT HAS SAID YES IS SENT TO ───────────────────────── */
    console.log("\nA MESSAGE REACHES THE DEVICE, THROUGH THE REAL LIBRARY.");
    await client.query("DELETE FROM push_subscriptions");
    await client.query(
      "INSERT INTO push_subscriptions (endpoint, person_key, p256dh, auth) VALUES ($1,$2,$3,$4)",
      [EP("laptop"), "smo", FAKE_P256, FAKE_AUTH]);
    got.length = 0;
    let out = await push.sendTo(client, await push.subsOf(client, "smo"),
      { title: "Hend Farouk", body: "The Q3 target still reads 4.2M.", tag: "office" });
    ok(out.sent === 1 && out.failed === 0, "one device, one send", out);
    ok(got.length === 1, "and the push service was actually called", got.length);
    if (got.length) {
      /* WHAT LEAVES IS ENCRYPTED AND SIGNED. Neither is asserted by reading
         our own code — they are read off the wire, which is the only place
         the claim is true or false. */
      ok(/^vapid /i.test(got[0].auth), "signed with a VAPID header", got[0].auth.slice(0, 40));
      ok(got[0].encoding === "aes128gcm", "and the body is encrypted", got[0].encoding);
      ok(got[0].bytes > 0, "...and it is not empty", got[0].bytes);
      ok(String(got[0].ttl) === "3600", "with a TTL, so a stale one is dropped", got[0].ttl);
    }

    /* ── A DEVICE THE SERVICE SAYS IS GONE IS DROPPED ────────────────── */
    console.log("\nA DEVICE THAT IS GONE IS FORGOTTEN, AND ONLY THAT ONE.");
    await client.query(
      "INSERT INTO push_subscriptions (endpoint, person_key, p256dh, auth) VALUES ($1,$2,$3,$4)",
      [EP("phone"), "ceo", FAKE_P256, FAKE_AUTH]);
    answer.code = 410;                       /* the service: this one is gone */
    out = await push.sendTo(client, await push.subsOf(client, "smo"), { title: "x", body: "y" });
    ok(out.dropped === 1 && out.sent === 0, "a 410 drops the device", out);
    let left = (await client.query("SELECT endpoint FROM push_subscriptions ORDER BY endpoint")).rows;
    ok(left.length === 1 && left[0].endpoint === EP("phone"),
       "...and takes nobody else's row with it", left.map(function (r) { return r.endpoint; }));

    /* ── AND A SERVICE THAT IS MERELY BROKEN CHANGES NOTHING ─────────── */
    answer.code = 500;
    out = await push.sendTo(client, await push.subsOf(client, "ceo"), { title: "x", body: "y" });
    ok(out.failed === 1 && out.dropped === 0, "a 500 is a failure, not a removal", out);
    left = (await client.query("SELECT count(*)::int n FROM push_subscriptions")).rows[0];
    ok(left.n === 1, "...and the device is still subscribed", left.n);
    answer.code = 201;

    /* ── THE OFFICE'S DEVICES, AND NOBODY ELSE'S ─────────────────────── */
    console.log("\nA QUESTION GOES TO THE OFFICE, AND TO NOBODY ELSE.");
    await client.query("DELETE FROM push_subscriptions");
    /* One of each: the office, somebody who is not, and a retired row. */
    const who = (await client.query(
      "SELECT key, role FROM people ORDER BY idx LIMIT 6")).rows;
    const officeKeys = who.filter(function (p) {
      return require("../lib/rules.js").isOfficeRole(p.role);
    }).map(function (p) { return p.key; });
    const otherKey = (who.find(function (p) {
      return !require("../lib/rules.js").isOfficeRole(p.role);
    }) || {}).key;
    ok(officeKeys.length >= 1 && !!otherKey,
       "the register has both kinds to tell apart", { officeKeys: officeKeys, otherKey: otherKey });
    for (const k of officeKeys.concat([otherKey])) {
      await client.query(
        "INSERT INTO push_subscriptions (endpoint, person_key, p256dh, auth) VALUES ($1,$2,$3,$4)",
        [EP(k), k, FAKE_P256, FAKE_AUTH]);
    }
    let subs = await push.officeSubs(client, null);
    ok(subs.length === officeKeys.length,
       "only the office's devices are chosen", subs.map(function (s) { return s.person_key; }));
    ok(!subs.some(function (s) { return s.person_key === otherKey; }),
       "...and never somebody else's");
    /* THE SENDER IS NEVER TOLD ABOUT THEIR OWN MESSAGE. */
    subs = await push.officeSubs(client, officeKeys[0]);
    ok(!subs.some(function (s) { return s.person_key === officeKeys[0]; }),
       "and the person who wrote it is left out");
    /* A RETIRED PERSON IS NOT THE OFFICE ANY MORE. */
    await client.query(
      "UPDATE people SET extra = COALESCE(extra,'{}'::jsonb) || '{\"active\":\"false\"}'::jsonb " +
      "WHERE key = $1", [officeKeys[0]]);
    subs = await push.officeSubs(client, null);
    ok(!subs.some(function (s) { return s.person_key === officeKeys[0]; }),
       "a retired person's device is not sent to");
    await client.query(
      "UPDATE people SET extra = extra - 'active' WHERE key = $1", [officeKeys[0]]);

    /* ── AND NOTHING IS SENT WHEN THERE IS NOBODY TO SEND TO ─────────── */
    got.length = 0;
    out = await push.sendTo(client, [], { title: "x", body: "y" });
    ok(out.sent === 0 && got.length === 0, "no devices, no requests", out);

    /* ── A SAVE MUST NOT ERASE ANY OF IT (§56) ───────────────────────── */
    console.log("\nA SAVE CANNOT REACH ANY OF THIS.");
    const before = (await client.query(
      "SELECT count(*)::int n FROM push_subscriptions")).rows[0].n;
    const graph = await io.readState(client);
    await io.writeState(client, graph);
    const after = (await client.query(
      "SELECT count(*)::int n FROM push_subscriptions")).rows[0].n;
    ok(after === before && after > 0,
       "the subscriptions survive a whole-graph save", { before: before, after: after });
    const keysLeft = (await client.query("SELECT count(*)::int n FROM push_keys")).rows[0].n;
    ok(keysLeft === 1, "and so does the key pair", keysLeft);

  } finally {
    await client.query("DELETE FROM push_subscriptions").catch(function () {});
    await client.end().catch(function () {});
    srv.close();
  }

  console.log("\n" + pass + " passed, " + fails.length + " failed");
  process.exit(fails.length ? 1 : 0);
})().catch(function (e) {
  console.error("\nthrew: " + (e && e.stack || e));
  process.exit(1);
});

/* A well-formed client key pair, so the library's encryption has something
   real to work against — these are a browser's public values, which is what a
   subscription carries and what makes them safe to write down. */
var FAKE_P256, FAKE_AUTH;
(function () {
  const crypto = require("crypto");
  const ecdh = crypto.createECDH("prime256v1");
  ecdh.generateKeys();
  FAKE_P256 = ecdh.getPublicKey().toString("base64url");
  FAKE_AUTH = crypto.randomBytes(16).toString("base64url");
})();
