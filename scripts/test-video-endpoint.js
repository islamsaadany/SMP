/* THE CLIP ENDPOINT'S REFUSALS (§261) — against a real database and a real
 * session, because that is the only place they can be seen.
 *
 * WHY THIS FILE EXISTS. Writing it found a genuine hole: `R.grantIn()` answers
 * with a WORD, and one of the words is `"none"` — which is truthy. The
 * playback gate tested the answer for truth rather than for its value, so
 * ANYBODY SIGNED IN COULD PLAY ANY UNIT'S CLIP. §104.10's family (`Number("")`
 * is 0 and finite), and invisible to every assertion short of driving the
 * refusal with somebody who should be refused.
 *
 * BOTH ENDS, EVERY TIME (§94.2). "It refuses" is true of an endpoint that
 * refuses everybody, so each refusal is asserted beside the person it must let
 * through.
 *
 * A FAKE STORE TOKEN IS SET ON PURPOSE. With no token the endpoint answers
 * "no video store here" first and every guard behind it goes unexercised —
 * which is exactly how the size and path guards were untested until this file
 * set one. The token is nonsense, so nothing leaves the machine: the guards
 * run, and the call fails at the store afterwards.
 *
 * Run: DATABASE_URL=... node scripts/test-video-endpoint.js
 *   (it starts its own dev-server on 3998 and stops it again)
 */
const { spawn } = require("child_process");
const pg = require("pg");
const io = require("../lib/state-io.js");
const auth = require("../lib/auth.js");

const PORT = 3998;
const BASE = "http://localhost:" + PORT;
const PW = "EndpointTest123!";
let ok = 0, bad = 0;

function check(what, cond, got) {
  if (cond) { ok++; console.log("  ok   " + what); }
  else { bad++; console.log("  FAIL " + what + (got !== undefined ? "  --  " + JSON.stringify(got) : "")); }
}

async function post(cookie, body) {
  const r = await fetch(BASE + "/api/blob", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Cookie": cookie || "" },
    body: JSON.stringify(body)
  });
  return { code: r.status, body: await r.json().catch(function () { return null; }) };
}
async function play(cookie, path) {
  const r = await fetch(BASE + "/api/blob?play=" + encodeURIComponent(path),
    { headers: { Cookie: cookie || "" }, redirect: "manual" });
  return { code: r.status, body: await r.json().catch(function () { return null; }) };
}
async function login(user) {
  const r = await fetch(BASE + "/api/auth", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", user: user, password: PW })
  });
  const j = await r.json();
  if (!j.ok) throw new Error("could not sign in as " + user + ": " + j.error);
  return (r.headers.getSetCookie ? r.headers.getSetCookie() : [r.headers.get("set-cookie")])
    .filter(Boolean).map(function (c) { return String(c).split(";")[0]; }).join("; ");
}

/* ── 0 · THE READ ADDRESS, AGAINST A STUBBED STORE ────────────────────────
 * The fault this section exists for shipped once and was invisible to every
 * other assertion here: `signedRead` reached for `getDownloadUrl`, which takes
 * a full blob URL and is synchronous — handed a pathname it throws
 * `Invalid URL`, the catch swallowed it, and EVERY clip would have reported
 * "no longer here". Nothing would ever have played.
 *
 * It cannot be caught with a fake token (the store refuses first) or with a
 * real one (there is no store here), so the SDK is stubbed and the handler is
 * driven in-process: what must be true is that a viewer who may watch gets a
 * 302 to the address the two-step minted, and that the pathname reaches the
 * store scoped to a `get`.
 */
async function readAddressTest() {
  const seen = { issued: null, presigned: null };
  /* Injected BEFORE api/blob.js is required, so its one-time load picks this
     up instead of the real package. */
  require.resolve("@vercel/blob");
  require.cache[require.resolve("@vercel/blob")] = {
    id: require.resolve("@vercel/blob"), filename: require.resolve("@vercel/blob"),
    loaded: true, exports: {
      issueSignedToken: async function (o) { seen.issued = o; return {
        delegationToken: "d", clientSigningToken: "c", validUntil: o.validUntil }; },
      presignUrl: async function (t, o) { seen.presigned = o;
        return { presignedUrl: "https://store.example/" + o.pathname + "?sig=abc" }; },
      list: async function () { return { blobs: [] }; },
      del: async function () {}, head: async function () { return {}; },
      createMultipartUpload: async function () { return { key: "k", uploadId: "u" }; },
      uploadPart: async function () { return { etag: "e" }; },
      completeMultipartUpload: async function () { return {}; }
    }
  };
  process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_FAKE_forguards";
  const handler = require("../api/blob.js");

  /* The office, straight from the stored graph — the handler reads the person
     off the session, so the session module is asked for a real one. */
  const pool = io.getPool(pg);
  const client = await pool.connect();
  await io.ensureReady(client);
  const sid = await auth.createSession(client, "smo");
  client.release();

  const res = { statusCode: 0, headers: {}, body: "",
    setHeader: function (k, v) { this.headers[k.toLowerCase()] = v; },
    end: function (b) { this.body = b || ""; } };
  await handler({ method: "GET", url: "/api/blob?play=videos/mobile/v1.mp4",
                  headers: { cookie: "smp_session=" + sid } }, res);

  check("a permitted viewer is redirected to the clip", res.statusCode === 302,
        { code: res.statusCode, body: String(res.body).slice(0, 90) });
  check("...to the address the store signed",
        String(res.headers.location || "").indexOf("sig=abc") > 0, res.headers.location);
  check("...scoped to THIS clip and to reading only",
        seen.issued && seen.issued.pathname === "videos/mobile/v1.mp4" &&
        JSON.stringify(seen.issued.operations) === '["get"]', seen.issued);
  check("...and presigned as private, never public",
        seen.presigned && seen.presigned.access === "private" &&
        seen.presigned.operation === "get", seen.presigned);
  /* The delegation must expire: an address that outlives the session is the
     public URL this design exists to avoid. */
  check("...with an expiry set", !!(seen.issued && seen.issued.validUntil > Date.now()),
        seen.issued && seen.issued.validUntil);

  delete require.cache[require.resolve("@vercel/blob")];
  delete require.cache[require.resolve("../api/blob.js")];
  /* The pool is SHARED and the rest of this file still needs it — closing it
     here is what turned the first draft's throw into a hang. */
}

(async function () {
  const pool = io.getPool(pg);
  const client = await pool.connect();
  await io.ensureReady(client);
  /* Two people who differ in exactly the way the gates care about: the office,
     and somebody attached to one unit and holding no role at all. */
  const hash = await auth.hashPassword(PW);
  for (const k of ["smo", "mobhead"]) {
    await client.query(
      "INSERT INTO credentials (person_key,password_hash,must_change) VALUES ($1,$2,false) " +
      "ON CONFLICT (person_key) DO UPDATE SET password_hash=$2, must_change=false", [k, hash]);
  }
  await client.query("DELETE FROM login_attempts");
  client.release();

  const srv = spawn(process.execPath, [__dirname + "/dev-server.js", String(PORT)], {
    env: Object.assign({}, process.env,
      { BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_FAKE_forguards" }),
    stdio: "ignore"
  });
  await new Promise(function (r) { setTimeout(r, 2500); });

  try {
    console.log("0 \u00b7 the read address, against a stubbed store");
    await readAddressTest();

    const smo = await login("smo");
    const head = await login("mobhead");

    console.log("1 · nobody signed in gets nothing");
    check("an anonymous status is refused", (await post("", { action: "status" })).code === 401);
    check("an anonymous play is refused", (await play("", "videos/mobile/x.mp4")).code === 401);

    console.log("2 · watching is gated on being able to see that review");
    /* THE FINDING. `grantIn` answers "none" for a unit somebody cannot see,
       and "none" is truthy — so this passed for everybody before the fix. */
    const far = await play(head, "videos/nigeria/x.mp4");
    check("a unit head cannot play another unit's clip", far.code === 403, far);
    check("...and the refusal says why",
          /not yours to watch/.test((far.body || {}).error || ""), far.body);
    /* Both ends: the same call, by people who SHOULD get past the gate, must
       fail at the store instead — never at the gate. */
    const own = await play(head, "videos/mobile/x.mp4");
    const off = await play(smo, "videos/nigeria/x.mp4");
    check("...but their own unit's clip gets past the gate", own.code !== 403, own);
    check("...and the office gets past it everywhere", off.code !== 403, off);

    console.log("3 · adding a clip is the same act as speaking for the unit");
    const mine = await post(head, { action: "begin", target: "mobile", name: "a.mp4", bytes: 1000 });
    const notmine = await post(head, { action: "begin", target: "nigeria", name: "a.mp4", bytes: 1000 });
    check("a unit head is refused on another unit", notmine.code === 403, notmine);
    check("...and is not refused on their own", mine.code !== 403, mine);

    console.log("4 · the ceilings are the server's, not the screen's");
    const big = await post(smo, { action: "begin", target: "mobile", name: "a.mp4",
                                  bytes: 99 * 1024 * 1024 });
    check("a clip over the size limit is refused", big.code === 400, big);
    check("...naming the size rather than something vague",
          /size limit/.test((big.body || {}).error || ""), big.body);

    console.log("5 · the storage page is the office's, and deleting is narrower still");
    const list = await post(head, { action: "list" });
    const drop = await post(head, { action: "drop", paths: ["videos/mobile/x.mp4"] });
    check("somebody outside the office cannot list what is stored", list.code === 403, list);
    check("...nor delete a clip", drop.code === 403, drop);
    /* The GATE, not the store: with a nonsense token the listing itself
       cannot succeed, and asserting 200 here would be asserting that this
       machine has a blob store. What must be true is that the office is not
       turned away at the door. */
    const olist = await post(smo, { action: "list" });
    check("...and the office is not turned away", olist.code !== 403, olist);
    /* The path is the permission, so nothing outside the videos folder can be
       named — a delete is the one act here that cannot be undone. */
    const esc = await post(smo, { action: "drop", paths: ["../../etc/passwd"] });
    check("a path outside the videos folder is refused", esc.code === 400, esc);

    console.log("6 · the limits the screen draws come from here");
    const st = await post(smo, { action: "status" });
    check("status reports the ceiling",
          (st.body || {}).each === 3 && (st.body || {}).secs === 120, st.body);
  } finally {
    srv.kill();
    await pool.end();
  }
  console.log("\n" + ok + " passed, " + bad + " failed");
  process.exit(bad ? 1 : 0);
})().catch(function (e) {
  console.error("threw:", e.message);
  process.exit(1);
});
