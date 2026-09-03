/* ── THE CLIPS (§261) ─────────────────────────────────────────────────────
   Islam: *"add to the presentation to be able to add a video to play inside
   the presentation how do you think we can do it without overloading the data
   base with videos?"*

   THE ANSWER WAS ABOUT PLACE, NOT QUALITY. The state graph is 297KB and every
   person downloads all of it on every sign-in; a two-minute clip is 20–40MB.
   So the bytes live here, in a blob store, and the graph keeps a path. This
   file is the only thing in the platform that touches them.

   WHY THE FILE ARRIVES IN PIECES. A Vercel function refuses a request body
   over 4.5MB, so a 50MB clip cannot be posted to us in one go. The documented
   way round it is the store's own multipart upload: the browser slices the
   file, each piece comes through here under the cap, and the store puts them
   back together. It costs a dozen round trips and buys two things worth
   having — the browser needs no SDK of its own (the platform is one
   self-contained HTML file with no bundler, so a browser package is not
   available to it), and EVERY PIECE IS AUTHORISED, rather than one address
   being minted and then trusted for the next several minutes.

   NOTHING HERE TRUSTS THE BODY FOR WHO IS ASKING (§185). The person comes off
   the session; the target is checked against the STORED graph; and the ceiling
   is counted from the stored slides, because a limit the screen alone enforces
   is decoration (§42, §44, §98.2).

   NO STORE, NO CRASH. The package is loaded inside a try and remembered, and
   with no store configured this endpoint answers "not set up" and the platform
   goes on working — the link half of the feature needs nothing from here.
   §231.3's rule: a dependency must not be able to take down the feature it
   serves, let alone its neighbours.
   ──────────────────────────────────────────────────────────────────────── */
const pg = require("pg");
const io = require("../lib/state-io.js");
const auth = require("../lib/auth.js");
const R = require("../lib/rules.js");
const { ensureReady, readState } = io;
function getPool() { return io.getPool(pg); }

/* Loaded once, inside a try. A deployment with no blob store never installed
   the package or never set the token, and neither is a reason for the chat,
   the deck or anything else on this platform to stop (§231.3). */
let BLOB = null, BLOB_TRIED = false;
function blob() {
  if (!BLOB_TRIED) {
    BLOB_TRIED = true;
    try { BLOB = require("@vercel/blob"); } catch (e) { BLOB = null; }
  }
  return BLOB;
}
function token() { return process.env.BLOB_READ_WRITE_TOKEN || ""; }
function ready() { return !!blob() && !!token(); }

function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(obj));
}

/* The JSON half. Parts arrive as raw bytes instead and are read by rawBody(). */
function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    return Promise.resolve(typeof req.body === "string" ? JSON.parse(req.body) : req.body);
  }
  return new Promise(function (resolve, reject) {
    let s = "";
    req.on("data", function (c) { s += c; if (s.length > 2e6) { reject(new Error("big")); req.destroy(); } });
    req.on("end", function () { try { resolve(s ? JSON.parse(s) : {}); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}
function rawBody(req) {
  if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
  return new Promise(function (resolve, reject) {
    const chunks = [];
    let n = 0;
    req.on("data", function (c) {
      n += c.length;
      /* One piece over the cap is a client that has stopped following the
         protocol; refusing is cheaper than discovering it at the store. */
      if (n > 5 * 1024 * 1024) { reject(new Error("piece too big")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", function () { resolve(Buffer.concat(chunks)); });
    req.on("error", reject);
  });
}

/* WHERE A CLIP LIVES, and the path is the permission. `<target>/<slide>.<ext>`
   — a person may only write under a target they may report for, and `play`
   reads the target back out of the path to ask the same question again. The
   segments are scrubbed to a safe alphabet, so nothing a person types can
   climb out of the folder it belongs to. */
function safe(s, max) {
  return String(s == null ? "" : s).replace(/[^A-Za-z0-9._:-]/g, "-").slice(0, max || 80);
}
function clipPath(target, id, name) {
  const ext = (String(name || "").match(/\.([A-Za-z0-9]{2,5})$/) || [, "mp4"])[1].toLowerCase();
  return "videos/" + safe(target, 60) + "/" + safe(id, 40) + "." + safe(ext, 5);
}
function targetOfPath(p) {
  const m = String(p || "").match(/^videos\/([^\/]+)\//);
  return m ? m[1] : "";
}

/* MAY THIS PERSON PUT A CLIP ON THIS DECK. The same question `reportState`
   asks in lib/authorize.js, and asked the same way: a picture slide, a video
   slide, the cycle note and Submit all speak for the whole unit in front of
   the board, so one rule serves all four (§50, §53.5). Somebody who edits
   only through a bounded role does none of them. */
/* MAY THIS PERSON SEE THIS DECK AT ALL. Watching is a reading act, so it takes
   the reading grant rather than the reporting one — but "none" is a WORD, and
   testing the answer for truth rather than for its value is what let everybody
   watch everything (see the note at the call site). */
function mayWatch(world, person, target) {
  const isFn = String(target || "").indexOf("fn:") === 0;
  const g = R.grantIn(world, person, isFn ? "fn" : "unit", target);
  return !!g && g !== "none";
}

function maySpeakFor(world, person, target) {
  const isFn = String(target || "").indexOf("fn:") === 0;
  const area = isFn ? "fn" : "unit";
  if (R.grantIn(world, person, area, target) !== "edit") return false;
  if (R.onlyOwnLines(world, person, area, target)) return false;
  return true;
}

/* The stored slides for a target — never the incoming ones. The ceiling has to
   be counted against what the database holds, or two tabs each carrying two
   clips both pass a check made against their own copy (§42). */
function storedSlides(state, target) {
  const m = state && state.review && state.review.slides;
  const list = m && Array.isArray(m[target]) ? m[target] : [];
  return list;
}

module.exports = async function handler(req, res) {
  let client;
  try {
    /* The play address is a GET, because it is what a <video> element asks
       for. Everything that CHANGES anything is a POST. */
    const url = new URL(req.url, "http://x");
    const play = url.searchParams.get("play");

    client = await getPool().connect();
    await ensureReady(client);
    const me = await auth.getSession(client, req);
    if (!me) return send(res, 401, { ok: false, error: "sign in first" });

    const state = await readState(client);
    const world = R.worldOf(state);
    const person = (state.people || []).filter(function (p) { return p.key === me.key; })[0]
                   || { key: me.key, role: me.role };

    if (play) {
      /* A CLIP IS NOT A PUBLIC FILE. The store's address is never written into
         a slide; the slide holds a path, and this hands out a short-lived
         address to somebody who is signed in and may see that deck. So a link
         copied out of a page stops working, and one copied by somebody with no
         session never starts. */
      if (!ready()) return send(res, 503, { ok: false, error: "no video store here" });
      const target = targetOfPath(play);
      /* `grantIn` ANSWERS WITH A WORD, AND ONE OF THE WORDS IS "none" — which
         is truthy, so a plain truth test here let anybody signed in play any
         unit's clip. §104.10's family (`Number("")` is 0 and finite; `""` is a
         real answer), found by driving the refusal rather than by reading it.
         The test is the WORD. */
      if (!target || !mayWatch(world, person, target)) {
        return send(res, 403, { ok: false, error: "that review is not yours to watch" });
      }
      const at = await signedRead(play);
      if (!at) return send(res, 404, { ok: false, error: "that clip is no longer here" });
      res.statusCode = 302;
      res.setHeader("Location", at);
      res.setHeader("Cache-Control", "no-store");
      res.end();
      return;
    }

    if (req.method !== "POST") return send(res, 405, { ok: false, error: "post" });

    /* A part carries BYTES, so its instructions ride in the query string —
       there is no JSON body to put them in. */
    if (url.searchParams.get("action") === "part") {
      return await putPart(req, res, url, world, person);
    }

    const body = await readBody(req);
    const what = body.action || "";

    if (what === "status") {
      /* The storage page asks before it draws (§45.2): a page that shows an
         empty table where there is no store at all has described somebody's
         data when nothing was read (§231.4). */
      return send(res, 200, { ok: true, ready: ready(),
        max: R.VIDEO_MAX_BYTES, secs: R.VIDEO_MAX_SECS, each: R.VIDEO_PER_SUBJECT });
    }

    if (what === "begin") {
      if (!ready()) return send(res, 503, { ok: false, error: "no video store here" });
      const target = String(body.target || "");
      if (!maySpeakFor(world, person, target)) {
        return send(res, 403, { ok: false, error: "You cannot add a video to that review." });
      }
      const bytes = Number(body.bytes || 0);
      if (!(bytes > 0) || bytes > R.VIDEO_MAX_BYTES) {
        return send(res, 400, { ok: false, error: "that clip is over the size limit" });
      }
      /* THE CEILING, COUNTED FROM THE DATABASE. Islam's 3 a subject. */
      if (!R.videoRoom(storedSlides(state, target))) {
        return send(res, 409, { ok: false,
          error: "That review already has " + R.VIDEO_PER_SUBJECT + " videos." });
      }
      const id = "v" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const path = clipPath(target, id, body.name);
      const b = blob();
      const up = await b.createMultipartUpload(path, {
        access: "private", contentType: String(body.type || "video/mp4"), token: token()
      });
      return send(res, 200, { ok: true, path: path, key: up.key, uploadId: up.uploadId });
    }

    if (what === "finish") {
      if (!ready()) return send(res, 503, { ok: false, error: "no video store here" });
      const path = String(body.path || "");
      if (!maySpeakFor(world, person, targetOfPath(path))) {
        return send(res, 403, { ok: false, error: "You cannot add a video to that review." });
      }
      const b = blob();
      await b.completeMultipartUpload(path, body.parts || [], {
        access: "private", key: String(body.key || ""),
        uploadId: String(body.uploadId || ""), token: token()
      });
      return send(res, 200, { ok: true, path: path });
    }

    /* ── The storage page (Islam's #3) ──────────────────────────────────── */
    if (what === "list") {
      if (!R.isOfficeRole(person.role)) {
        return send(res, 403, { ok: false, error: "Video storage is the SMO's." });
      }
      if (!ready()) return send(res, 200, { ok: true, ready: false, clips: [] });
      const b = blob();
      const got = await b.list({ prefix: "videos/", token: token() });
      return send(res, 200, { ok: true, ready: true,
        clips: (got.blobs || []).map(function (x) {
          return { path: x.pathname, bytes: x.size, at: x.uploadedAt };
        }) });
    }

    if (what === "drop") {
      /* CLEARING STORAGE IS DESTRUCTION, so it is the Super user's and not
         merely the office's (§89, §146): two questions with the same answer
         today, and §94's drift the day the first is widened. */
      if (!R.isSuperRole(person.role)) {
        return send(res, 403, { ok: false, error: "Deleting a clip is the Super user's." });
      }
      if (!ready()) return send(res, 503, { ok: false, error: "no video store here" });
      const paths = (Array.isArray(body.paths) ? body.paths : [body.path])
        .map(String).filter(function (p) { return p.indexOf("videos/") === 0; });
      if (!paths.length) return send(res, 400, { ok: false, error: "nothing named to delete" });
      const b = blob();
      await b.del(paths, { token: token() });
      return send(res, 200, { ok: true, gone: paths });
    }

    return send(res, 400, { ok: false, error: "unknown action" });
  } catch (e) {
    /* Never the raw error: a database or store message is a free map of the
       inside of this deployment to anybody probing it (§43). */
    return send(res, 500, { ok: false, error: "that did not work" });
  } finally {
    if (client) client.release();
  }
};

/* One piece of a clip. Authorised like every other piece — an upload that
   checked once and then trusted a handle would be an address somebody could
   go on writing to after their rights were taken away. */
async function putPart(req, res, url, world, person) {
  if (!ready()) return send(res, 503, { ok: false, error: "no video store here" });
  const path = String(url.searchParams.get("path") || "");
  const key = String(url.searchParams.get("key") || "");
  const uploadId = String(url.searchParams.get("uploadId") || "");
  const n = Number(url.searchParams.get("n") || 0);
  if (!path || !key || !uploadId || !(n > 0)) {
    return send(res, 400, { ok: false, error: "that piece is not addressed" });
  }
  if (!maySpeakFor(world, person, targetOfPath(path))) {
    return send(res, 403, { ok: false, error: "You cannot add a video to that review." });
  }
  const bytes = await rawBody(req);
  const b = blob();
  const part = await b.uploadPart(path, bytes, {
    access: "private", key: key, uploadId: uploadId, partNumber: n, token: token()
  });
  return send(res, 200, { ok: true, partNumber: n, etag: part.etag });
}

/* THE ONE PLACE A READ ADDRESS IS MINTED. Private Blob went generally
   available in June 2026 and the call that mints a signed read has moved once
   already in that SDK's life, so it is asked for by name here and nowhere
   else — and a version that does not carry it answers null, which the caller
   reports as "no longer here" rather than throwing. */
async function signedRead(path) {
  const b = blob();
  if (!b) return "";
  const opts = { token: token(), expiresIn: 60 * 60 };
  try {
    if (typeof b.getDownloadUrl === "function") return await b.getDownloadUrl(path, opts);
    if (typeof b.generateSignedUrl === "function") return await b.generateSignedUrl(path, opts);
    const h = await b.head(path, { token: token() });
    return (h && (h.downloadUrl || h.url)) || "";
  } catch (e) {
    return "";
  }
}
