/* ── FEEDBACK (§71) ──────────────────────────────────────────────────────
   Driven over HTTP against the real handler, because what is being asserted is
   who may do what — and a permission is a status code, not a return value.

   The cases that matter are the REFUSALS: a contributor reading somebody
   else's report, a contributor setting a status, a picture that is a URL
   rather than an image. Those are the ones a UI cannot be trusted to prevent.

     DATABASE_URL=postgres://... node scripts/test-feedback.js
*/
const fs = require("fs"), path = require("path"), http = require("http"), pg = require("pg");
const io = require("../lib/state-io.js");
const auth = require("../lib/auth.js");
const handler = require("../api/feedback.js");

const fail = [];
function ok(label, cond, extra) {
  console.log((cond ? "PASS  " : "FAIL  ") + label + (extra ? "   " + extra : ""));
  if (!cond) fail.push(label);
}
function post(port, body, cookie) {
  return new Promise(function (res_, rej) {
    const data = JSON.stringify(body);
    const req = http.request({ port, path: "/api/feedback", method: "POST",
      headers: Object.assign({ "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data) }, cookie ? { Cookie: cookie } : {}) },
      function (r) { let o=""; r.on("data",c=>o+=c); r.on("end",()=>{
        let j=null; try{j=JSON.parse(o);}catch(e){j={raw:o};}
        res_({status:r.statusCode, body:j}); }); });
    req.on("error", rej); req.end(data);
  });
}

(async function () {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const dir = path.join(__dirname, "..", "db");
  await io.ensureReady(c, dir);
  const state = JSON.parse(fs.readFileSync(path.join(dir, "seed-state.json"), "utf8"));
  const smo = state.people.filter(p => p.role === "super")[0];
  const other = state.people.filter(p => p.key !== smo.key)[0];
  await io.writeState(c, state);

  const sess = async function (key) {
    const t = await auth.createSession(c, key);
    return auth.cookieHeader({ headers: {} }, t).split(";")[0];
  };
  const smoC = await sess(smo.key), theirC = await sess(other.key);

  const server = http.createServer(handler);
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;

  ok("a stranger is refused", (await post(port, { action: "list" })).status === 401);

  /* ANYBODY SIGNED IN MAY RAISE ONE — the point of the feature. */
  const PIC = "data:image/png;base64," + Buffer.from("x".repeat(64)).toString("base64");
  let r = await post(port, { action: "raise", title: "Mobile revenue looks wrong",
    body: "The number on Performance does not match the plan.", kind: "issue",
    page: "unit/performance", target: "mobile", cycle: "H1 2026", build: "v3.22",
    shot: PIC }, theirC);
  ok("a person with no role can raise one", r.status === 200 && r.body.ok, JSON.stringify(r.body.error));
  const id = r.body.id;

  r = await post(port, { action: "raise", title: "", body: "x" }, theirC);
  ok("a report with no title is refused", r.status === 400);
  r = await post(port, { action: "raise", title: "Nice try",
    shot: "https://evil.example/track.png" }, theirC);
  ok("a picture that is a URL is refused", r.status === 400,
     "(the admin page renders it — a URL is somebody else's server learning who looked)");

  /* WHO SEES WHAT. */
  r = await post(port, { action: "list" }, smoC);
  ok("the SMO sees it", r.body.items.some(x => x.id === id));
  ok("...with the context captured, not typed",
     (r.body.items.find(x => x.id === id) || {}).page === "unit/performance");
  ok("...and the list carries no screenshot",
     !("shot" in (r.body.items.find(x => x.id === id) || {})),
     "(forty images to draw forty one-line rows)");
  ok("...but says there is one", (r.body.items.find(x => x.id === id) || {}).has_shot === true);
  ok("...and what the pictures cost", typeof r.body.shotBytes === "number",
     r.body.shotBytes + " bytes");

  r = await post(port, { action: "list" }, theirC);
  ok("the raiser sees their own", r.body.items.length === 1 && r.body.items[0].id === id);
  ok("...and is not told they are the SMO", r.body.smo === false);
  ok("...and gets no storage total", r.body.shotBytes === null);

  /* A SECOND PERSON'S REPORT IS NOT THEIRS TO READ. */
  await post(port, { action: "raise", title: "Someone else's" }, smoC);
  r = await post(port, { action: "list" }, theirC);
  ok("one person cannot see another's", r.body.items.length === 1);

  r = await post(port, { action: "one", id: id }, theirC);
  ok("the raiser may open their own", r.status === 200 && !!r.body.shot);
  const smoItem = (await post(port, { action: "list" }, smoC)).body.items
    .find(x => x.person_key === smo.key);
  r = await post(port, { action: "one", id: smoItem.id }, theirC);
  ok("and not somebody else's", r.status === 403, JSON.stringify(r.body.error));

  /* THE CONVERSATION. */
  r = await post(port, { action: "reply", id: id, body: "Looking at it now." }, smoC);
  ok("the SMO may reply", r.status === 200);
  const after = (await post(port, { action: "list" }, smoC)).body.items.find(x => x.id === id);
  ok("...and replying moves it off new by itself", after.status === "open", after.status);
  ok("...and stamps when it was seen", !!after.seen_at);
  r = await post(port, { action: "reply", id: id, body: "Thanks." }, theirC);
  ok("the raiser may reply on their own", r.status === 200);
  r = await post(port, { action: "reply", id: smoItem.id, body: "no" }, theirC);
  ok("and not on somebody else's", r.status === 403);
  r = await post(port, { action: "one", id: id }, theirC);
  ok("the thread reads back in order", r.body.replies.length === 2 &&
     r.body.replies[0].body === "Looking at it now.");

  /* STATUS AND REMOVAL ARE THE SMO'S. */
  ok("a status nobody defined is refused",
     (await post(port, { action: "status", id: id, status: "wibble" }, smoC)).status === 400);
  ok("a contributor cannot set a status",
     (await post(port, { action: "status", id: id, status: "done" }, theirC)).status === 403);
  ok("the SMO can", (await post(port, { action: "status", id: id, status: "done" }, smoC)).status === 200);
  ok("a contributor cannot remove one",
     (await post(port, { action: "drop", id: id }, theirC)).status === 403);
  ok("the SMO can, and it takes the thread with it",
     (await post(port, { action: "drop", id: id }, smoC)).status === 200 &&
     +(await c.query("SELECT count(*) n FROM feedback_replies WHERE feedback_id=$1", [id])).rows[0].n === 0);

  /* AND IT SURVIVES A SAVE — the whole reason it is not in the state graph. */
  const before = +(await c.query("SELECT count(*) n FROM feedback")).rows[0].n;
  await io.writeState(c, state);
  const kept = +(await c.query("SELECT count(*) n FROM feedback")).rows[0].n;
  ok("a save cannot erase feedback", kept === before && kept > 0,
     before + " before, " + kept + " after");

  server.close(); await c.end();
  console.log(fail.length ? "\nFAILED: " + fail.join(", ") : "\nall good");
  process.exit(fail.length ? 1 : 0);
})().catch(e => { console.error("THREW:", e.message); process.exit(1); });
