/* ── THE CLIPS, ON THE SHARED SCHEMA (§316.5, porting api/blob.js) ────────
   §261's endpoint carried across whole. Every decision in it is kept and
   none is re-argued here; what changes is how the client is resolved and how
   the connection is taken — `withTenant` on the app role rather than
   `withSchema` on a client schema (§314).

   WHY THE FILE ARRIVES IN PIECES. A serverless function refuses a request
   body over 4.5MB, so a 50MB clip cannot be posted in one go. The store's own
   multipart upload is the documented way round it: the browser slices the
   file, each piece comes through here under the cap, and EVERY PIECE IS
   AUTHORISED rather than one address being minted and then trusted.

   NOTHING HERE TRUSTS THE BODY FOR WHO IS ASKING (§185). The person comes off
   the session; the target is checked against the STORED graph; and the
   ceiling is counted from the stored slides, because a limit the screen alone
   enforces is decoration (§42, §44, §98.2).

   NO STORE, NO CRASH (§231.3). The package is loaded inside a try and
   remembered, and with no store configured this answers "not set up" and the
   platform goes on working — the link half of the feature needs nothing from
   here. In this repository the package is deliberately NOT a dependency yet,
   so that degrade path is the one exercised by every check today. */
import { createRequire } from "node:module";
import type { PoolClient } from "pg";
import { withTenant } from "./tenant.ts";
import { readState } from "./state-io.ts";
import type { Person } from "./state-api.ts";

const R = createRequire(import.meta.url)("./rules.cjs");

/* Loaded once, inside a try. A deployment that never installed the package or
   never set the token is not a reason for the chat, the deck or the save to
   stop working. */
let _blob: any = null, _tried = false;
function blob(): any {
  if (!_tried) {
    _tried = true;
    try { _blob = createRequire(import.meta.url)("@vercel/blob"); }
    catch { _blob = null; }
  }
  return _blob;
}
function token(): string {
  return process.env.BLOB_READ_WRITE_TOKEN || process.env.SMP_BLOB_TOKEN || "";
}
export function ready(): boolean { return !!blob() && !!token(); }

/* WHERE A CLIP LIVES, and the path is the permission. `videos/<target>/<id>.<ext>`
   — a person may only write under a target they may report for, and the read
   address reads the target back out of the path to ask the same question
   again. The segments are scrubbed to a safe alphabet, so nothing a person
   types can climb out of the folder it belongs to. */
function safe(s: unknown, max?: number): string {
  return String(s == null ? "" : s).replace(/[^A-Za-z0-9._:-]/g, "-").slice(0, max || 80);
}
export function clipPath(target: string, id: string, name?: string): string {
  const ext = (String(name || "").match(/\.([A-Za-z0-9]{2,5})$/) || [, "mp4"])[1]!.toLowerCase();
  return "videos/" + safe(target, 60) + "/" + safe(id, 40) + "." + safe(ext, 5);
}
export function targetOfPath(p: unknown): string {
  const m = String(p || "").match(/^videos\/([^/]+)\//);
  return m ? m[1]! : "";
}

/* MAY THIS PERSON SEE THIS DECK AT ALL. Watching is a reading act, so it takes
   the reading grant rather than the reporting one — but "none" is a WORD, and
   §261.5 records what testing the answer for TRUTH rather than for its VALUE
   cost: everybody could watch everything. */
export function mayWatch(world: any, person: any, target: string): boolean {
  const isFn = String(target || "").indexOf("fn:") === 0;
  const g = R.grantIn(world, person, isFn ? "fn" : "unit", target);
  if (process.env.SMP_BREAK === "watch-truthy") return !!g;   /* §261.5's fault, on purpose */
  return !!g && g !== "none";
}
/* MAY THIS PERSON PUT A CLIP ON THIS DECK. The same question `reportState`
   asks in the authoriser, asked the same way: a picture slide, a video slide,
   the cycle note and Submit all speak for the whole unit in front of the
   board, so one rule serves all four (§50, §53.5). Somebody who edits only
   through a bounded role does none of them. */
export function maySpeakFor(world: any, person: any, target: string): boolean {
  const isFn = String(target || "").indexOf("fn:") === 0;
  const area = isFn ? "fn" : "unit";
  if (R.grantIn(world, person, area, target) !== "edit") return false;
  if (R.onlyOwnLines(world, person, area, target)) return false;
  return true;
}

/* The stored slides for a target — never the incoming ones. The ceiling has to
   be counted against what the database holds, or two tabs each carrying two
   clips both pass a check made against their own copy (§42). */
function storedSlides(state: any, target: string): any[] {
  const m = state && state.review && state.review.slides;
  return m && Array.isArray(m[target]) ? m[target] : [];
}

/* THE ONE PLACE A READ ADDRESS IS MINTED, and it is TWO steps, not one.
   A private blob has no fetchable address of its own: the store issues a
   short-lived delegation scoped to ONE pathname and ONE operation, and that is
   what signs a concrete URL. `getDownloadUrl` IS NOT THIS (§261.10): it takes
   a full blob URL, is synchronous, and only appends a download flag — handed a
   pathname it throws, the catch swallows it, and NOTHING ever plays. */
const READ_MINUTES = 60;
async function signedRead(path: string): Promise<string> {
  const b = blob();
  if (!b || typeof b.issueSignedToken !== "function" || typeof b.presignUrl !== "function") return "";
  try {
    const until = Date.now() + READ_MINUTES * 60 * 1000;
    const t = await b.issueSignedToken({ pathname: path, operations: ["get"], validUntil: until, token: token() });
    const out = await b.presignUrl(t, { operation: "get", access: "private", pathname: path, validUntil: until });
    return (out && out.presignedUrl) || "";
  } catch { /* a clip the store no longer holds and a store that refused are
               both "you cannot watch this now" */ return ""; }
}

export type BlobAnswer = { code: number; body?: unknown; redirect?: string };

/* Both halves read the stored graph once and build the world from it, which is
   what makes every answer here a fact about the DATABASE rather than about
   whatever the browser sent (§42). */
async function world(tenantId: string, fn: (c: PoolClient, state: any, w: any) => Promise<BlobAnswer>): Promise<BlobAnswer> {
  return withTenant(tenantId, async (c) => {
    const state = await readState(c);
    return fn(c, state, R.worldOf(state));
  });
}
function actor(state: any, person: Person): any {
  const me = (state.people || []).find((p: any) => p && p.key === person.key);
  /* The seat rides the session (state-api's personFor), and the register row
     carries everything else — the same pair every other endpoint judges on. */
  return Object.assign({}, me || { key: person.key, name: person.name }, person.role ? { role: person.role } : {});
}

/* ── The play address: a GET, because it is what a <video> asks for ─────── */
export async function playAnswer(tenantId: string, person: Person, path: string): Promise<BlobAnswer> {
  if (!ready()) return { code: 503, body: { ok: false, error: "no video store here" } };
  const target = targetOfPath(path);
  return world(tenantId, async (_c, state, w) => {
    if (!target || !mayWatch(w, actor(state, person), target))
      return { code: 403, body: { ok: false, error: "That review is not yours to watch." } };
    const url = await signedRead(path);
    if (!url) return { code: 404, body: { ok: false, error: "that clip is no longer here" } };
    return { code: 302, redirect: url };
  });
}

/* ── One piece of a clip, authorised like every other piece ─────────────── */
export async function partAnswer(tenantId: string, person: Person, q: URLSearchParams, bytes: Buffer): Promise<BlobAnswer> {
  if (!ready()) return { code: 503, body: { ok: false, error: "no video store here" } };
  const path = String(q.get("path") || ""), key = String(q.get("key") || "");
  const uploadId = String(q.get("uploadId") || ""), n = Number(q.get("n") || 0);
  if (!path || !key || !uploadId || !(n > 0)) return { code: 400, body: { ok: false, error: "that piece names nothing" } };
  return world(tenantId, async (_c, state, w) => {
    if (!maySpeakFor(w, actor(state, person), targetOfPath(path)))
      return { code: 403, body: { ok: false, error: "You cannot add a video to that review." } };
    const b = blob();
    const part = await b.uploadPart(path, bytes, { access: "private", key, uploadId, partNumber: n, token: token() });
    return { code: 200, body: { ok: true, partNumber: n, etag: part.etag } };
  });
}

/* ── Everything that CHANGES anything is a POST ─────────────────────────── */
export async function postAnswer(tenantId: string, person: Person, body: any): Promise<BlobAnswer> {
  const what = String((body && body.action) || "");

  if (what === "status") {
    /* The storage page asks before it draws (§45.2): a page showing an empty
       table where there is no store at all has described somebody's data when
       nothing was read (§231.4). */
    return { code: 200, body: { ok: true, ready: ready(), max: R.VIDEO_MAX_BYTES, secs: R.VIDEO_MAX_SECS, each: R.VIDEO_PER_SUBJECT } };
  }

  if (what === "begin") {
    if (!ready()) return { code: 503, body: { ok: false, error: "no video store here" } };
    const target = String(body.target || "");
    const bytes = Number(body.bytes || 0);
    return world(tenantId, async (_c, state, w) => {
      if (!maySpeakFor(w, actor(state, person), target))
        return { code: 403, body: { ok: false, error: "You cannot add a video to that review." } };
      if (!(bytes > 0) || bytes > R.VIDEO_MAX_BYTES)
        return { code: 400, body: { ok: false, error: "that clip is over the size limit" } };
      /* THE CEILING, COUNTED FROM THE DATABASE. Islam's 3 a subject. */
      if (!R.videoRoom(storedSlides(state, target)))
        return { code: 409, body: { ok: false, error: "That review already has " + R.VIDEO_PER_SUBJECT + " videos." } };
      const id = "v" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const path = clipPath(target, id, body.name);
      const up = await blob().createMultipartUpload(path, { access: "private", contentType: String(body.type || "video/mp4"), token: token() });
      return { code: 200, body: { ok: true, path, key: up.key, uploadId: up.uploadId } };
    });
  }

  if (what === "finish") {
    if (!ready()) return { code: 503, body: { ok: false, error: "no video store here" } };
    const path = String(body.path || "");
    return world(tenantId, async (_c, state, w) => {
      if (!maySpeakFor(w, actor(state, person), targetOfPath(path)))
        return { code: 403, body: { ok: false, error: "You cannot add a video to that review." } };
      await blob().completeMultipartUpload(path, body.parts || [], {
        access: "private", key: String(body.key || ""), uploadId: String(body.uploadId || ""), token: token() });
      return { code: 200, body: { ok: true, path } };
    });
  }

  /* ── The storage page (Islam's #3) ────────────────────────────────────── */
  if (what === "list") {
    /* THE PERSON FIRST, THE STORE SECOND. Reversed, a unit head and the office
       are told the same thing — "no video store here" — and a refusal that
       names the wrong cause sends somebody to the wrong page (§16.7, §124). */
    if (process.env.SMP_BREAK === "store-first" && !ready())
      return { code: 503, body: { ok: false, error: "no video store here" } };
    if (!R.isOfficeRole(person.role)) return { code: 403, body: { ok: false, error: "Video storage is the SMO's." } };
    if (!ready()) return { code: 200, body: { ok: true, ready: false, clips: [] } };
    const got = await blob().list({ prefix: "videos/", token: token() });
    return { code: 200, body: { ok: true, ready: true,
      clips: (got.blobs || []).map((x: any) => ({ path: x.pathname, bytes: x.size, at: x.uploadedAt })) } };
  }

  if (what === "drop") {
    /* CLEARING STORAGE IS DESTRUCTION, so it is the Super user's and not merely
       the office's (§89, §146): two questions with the same answer today, and
       §94's drift the day the first is widened. */
    if (process.env.SMP_BREAK === "store-first" && !ready())
      return { code: 503, body: { ok: false, error: "no video store here" } };
    if (!R.isSuperRole(person.role)) return { code: 403, body: { ok: false, error: "Deleting a clip is the Super user's." } };
    if (!ready()) return { code: 503, body: { ok: false, error: "no video store here" } };
    const paths = (Array.isArray(body.paths) ? body.paths : [body.path]).map(String).filter((p: string) => p.indexOf("videos/") === 0);
    if (!paths.length) return { code: 400, body: { ok: false, error: "nothing named to delete" } };
    await blob().del(paths, { token: token() });
    return { code: 200, body: { ok: true, gone: paths } };
  }

  return { code: 400, body: { ok: false, error: "unknown action" } };
}
