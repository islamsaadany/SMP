/* ── FEEDBACK FROM WHOEVER IS LOOKING AT THE SCREEN (§71) ─────────────────
   Its own endpoint rather than an action on /api/state, and that is the whole
   design: `/api/state` writes the strategy graph, authorises every field
   against who you are (§42), and TRUNCATEs thirty tables to do it. Feedback is
   none of those things — it is a note about the product, raised by somebody
   who may hold no role at all, and it must survive every save.

   WHO MAY DO WHAT, and it is short:
     raise      anybody signed in. That is the point: the people most likely to
                spot a wrong number are the ones with the least access, and a
                feedback box only they cannot reach is worse than none.
     read own   anybody, so nothing they raise disappears into silence.
     read all   the SMO.
     reply      the SMO on anything; the raiser on their own.
     status     the SMO. It is a promise about what will happen, and only one
                person is in a position to make it.
   ──────────────────────────────────────────────────────────────────────── */
const auth = require("../lib/auth.js");
const pg = require("pg");
const io = require("../lib/state-io.js");
const { ensureReady } = io;
function getPool() { return io.getPool(pg); }

/* Room for a title, a paragraph and one shrunk screenshot. The client already
   caps the image (§50: 1600px, PNG and JPEG with the smaller kept), so this is
   the backstop for a client that did not — never the only limit. */
const MAX_SHOT = 3 * 1024 * 1024;
const MAX_TEXT = 8000;
const KINDS = ["issue", "idea", "question"];
const STATUSES = ["new", "open", "done", "parked"];

function readBody(req) {
  return new Promise(function (resolve, reject) {
    let s = "";
    req.on("data", function (c) {
      s += c;
      /* Refused while it arrives, not after: a body read to the end and then
         rejected has already cost the memory it was meant to protect. */
      if (s.length > MAX_SHOT + 64 * 1024) { reject(new Error("too large")); req.destroy(); }
    });
    req.on("end", function () { try { resolve(s ? JSON.parse(s) : {}); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}
function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(obj));
}
const str = function (v, max) {
  return String(v == null ? "" : v).trim().slice(0, max || MAX_TEXT);
};

module.exports = async function handler(req, res) {
  let client;
  try {
    client = await getPool().connect();
    await ensureReady(client);
    const body = req.method === "POST" ? await readBody(req) : {};
    const action = body.action || (req.method === "GET" ? "list" : "");
    const me = await auth.getSession(client, req);
    if (!me) return send(res, 401, { ok: false, error: "sign in first" });
    const isSMO = me.role === "super";

    if (action === "list") {
      /* THE SMO SEES EVERYTHING, EVERYBODY ELSE SEES THEIR OWN. One query with
         one branch rather than two queries: two would drift the day a column
         is added, and the second is the one nobody reads.

         The screenshot is NOT in the list. It is the largest thing in the row
         by three orders of magnitude, and a list of forty reports would carry
         forty images to draw forty one-line rows. `has_shot` says whether to
         offer it; `one` fetches it. */
      const rows = (await client.query(
        "SELECT id, at, person_key, person_name, kind, title, body, page, target, " +
        "       cycle, build, status, seen_at, (shot IS NOT NULL) AS has_shot, " +
        "       (SELECT count(*) FROM feedback_replies r WHERE r.feedback_id = f.id) AS replies " +
        "FROM feedback f " + (isSMO ? "" : "WHERE person_key = $1 ") +
        "ORDER BY at DESC LIMIT 300", isSMO ? [] : [me.key])).rows;
      /* What the images are costing, so a cap is never a surprise (§71). Asked
         only of the SMO, who is the only person who can act on it. */
      let bytes = null;
      if (isSMO) {
        bytes = +(await client.query(
          "SELECT COALESCE(SUM(length(shot)), 0) AS n FROM feedback")).rows[0].n;
      }
      return send(res, 200, { ok: true, items: rows, mine: me.key, smo: isSMO, shotBytes: bytes });
    }

    if (action === "one") {
      const r = (await client.query(
        "SELECT id, person_key, shot FROM feedback WHERE id = $1", [body.id])).rows[0];
      if (!r) return send(res, 404, { ok: false, error: "no such report" });
      if (!isSMO && r.person_key !== me.key) {
        return send(res, 403, { ok: false, error: "that is not yours" });
      }
      const replies = (await client.query(
        "SELECT id, at, person_key, person_name, body FROM feedback_replies " +
        "WHERE feedback_id = $1 ORDER BY at", [body.id])).rows;
      return send(res, 200, { ok: true, shot: r.shot, replies: replies });
    }

    if (action === "raise") {
      const title = str(body.title, 200);
      if (!title) return send(res, 400, { ok: false, error: "Give it a title." });
      const shot = body.shot ? String(body.shot) : null;
      if (shot && shot.length > MAX_SHOT) {
        return send(res, 400, { ok: false, error: "That picture is too large even after shrinking." });
      }
      /* A data URI or nothing. A `shot` that is a URL would make the admin page
         fetch whatever a raiser pointed it at — the page renders this into an
         <img>, and that is somebody else's server learning who opened it. */
      if (shot && !/^data:image\/(png|jpeg|webp);base64,/.test(shot)) {
        return send(res, 400, { ok: false, error: "That is not a picture this can store." });
      }
      const kind = KINDS.indexOf(body.kind) > -1 ? body.kind : "issue";
      const r = (await client.query(
        "INSERT INTO feedback (person_key, person_name, kind, title, body, page, target, " +
        "                      cycle, build, shot) " +
        "VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id",
        [me.key, me.name || null, kind, title, str(body.body),
         str(body.page, 120), str(body.target, 120), str(body.cycle, 120),
         str(body.build, 60), shot])).rows[0];
      return send(res, 200, { ok: true, id: r.id });
    }

    if (action === "reply") {
      const owner = (await client.query(
        "SELECT person_key FROM feedback WHERE id = $1", [body.id])).rows[0];
      if (!owner) return send(res, 404, { ok: false, error: "no such report" });
      if (!isSMO && owner.person_key !== me.key) {
        return send(res, 403, { ok: false, error: "that is not yours" });
      }
      const text = str(body.body);
      if (!text) return send(res, 400, { ok: false, error: "Nothing to say." });
      await client.query(
        "INSERT INTO feedback_replies (feedback_id, person_key, person_name, body) " +
        "VALUES ($1,$2,$3,$4)", [body.id, me.key, me.name || null, text]);
      /* A reply from the SMO on a report nobody has moved is the moment it
         stopped being new — said by the act rather than by remembering to set
         it, which is the status nobody ever updates. */
      if (isSMO) {
        await client.query(
          "UPDATE feedback SET status = 'open', seen_at = COALESCE(seen_at, now()) " +
          "WHERE id = $1 AND status = 'new'", [body.id]);
      }
      return send(res, 200, { ok: true });
    }

    if (action === "status") {
      if (!isSMO) return send(res, 403, { ok: false, error: "Answering feedback is the SMO's." });
      if (STATUSES.indexOf(body.status) < 0) {
        return send(res, 400, { ok: false, error: "Not a status." });
      }
      await client.query(
        "UPDATE feedback SET status = $1, seen_at = COALESCE(seen_at, now()) WHERE id = $2",
        [body.status, body.id]);
      return send(res, 200, { ok: true });
    }

    if (action === "drop") {
      /* The SMO's, and it takes the thread with it (ON DELETE CASCADE). The
         SCREENSHOT is the reason this exists at all: a status of "done" leaves
         the image in the database for ever, and the one thing here with a real
         storage cost should be removable. */
      if (!isSMO) return send(res, 403, { ok: false, error: "Removing feedback is the SMO's." });
      await client.query("DELETE FROM feedback WHERE id = $1", [body.id]);
      return send(res, 200, { ok: true });
    }

    return send(res, 400, { ok: false, error: "unknown action" });
  } catch (e) {
    return send(res, e.code === "NO_DB" ? 503 : 500,
                { ok: false, error: e.message === "too large" ? "Too large." : "Something went wrong." });
  } finally {
    if (client) client.release();
  }
};
