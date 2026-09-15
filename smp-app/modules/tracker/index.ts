/* ── THE INTERNAL TRACKER SERVES ITSELF (spec 054) ───────────────────────
   Three addresses: the list (with its view, search and opened row on the
   address, so a filtered week is a link somebody can send and Back works),
   the one script, and the api every change is POSTed to. Anything else
   inside the module comes back to the list rather than being refused, which
   is what every unknown word inside a client already gets (lib/modules.ts).

   THE OFFICE ONLY, BY RULE (decision 2), asked of the SEAT the door already
   established and asked HERE at the server — not only by leaving the entry
   off a menu, because a hidden entry is decoration (§42, §44). A client's
   person is told so in words, with the way back (§61). The switcher still
   lists the module for them, since the spine's menu knows modules and not
   seats (spec 046 §4.4 is not built); that is recorded in the spec.

   EVERY WRITE IS JUDGED AGAINST THE STORED ROW, never against what the page
   drew (§42): the rule is lib/tracker.ts's, the same one the page asked
   before drawing the control. A body that names no act, or an act with a
   thing missing, is a 400 in words and writes nothing. */
import { clientHref } from "../../lib/modules.ts";
import { shellHeaders } from "../../lib/shell.ts";
import { withTenant } from "../../lib/tenant.ts";
import type { ServeArgs } from "../registry.ts";
import { trackerDocument, refusedDocument, type Ask } from "./page.ts";
import { APP_JS } from "./script.ts";
import {
  type Who, isView, isStatus, isOffice, calendarDay, oneLine,
  oneAction, addAction, setFields, setStatus, deleteAction, isOfficeRow, mayChange, mayOwn,
} from "../../lib/tracker.ts";

const brk = () => process.env.SMP_BREAK || "";
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const no = (status: number, why: string) => json(status, { ok: false, why });

export async function serve(a: ServeArgs): Promise<Response> {
  const first = a.rest[0] || "";
  if (first === "app.js" && a.rest.length === 1)
    return new Response(APP_JS, { status: 200, headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "no-store" } });

  /* THE GATE. The check's break opens it to anybody with a membership, which
     must turn checks/tracker.mjs red (§94.5). Never set on a deployment. */
  const office = brk() === "no-office-gate" ? a.seat != null : isOffice(a.seat);
  if (!office) {
    if (first === "api") return no(403, "The Internal Tracker is the office's.");
    return new Response(await refusedDocument(a.slug, a.tenantId, a.tenantName, a.have), { status: 403, headers: shellHeaders() });
  }
  const who: Who = { personKey: a.personKey ?? null, seat: a.seat ?? null };

  if (first === "api" && a.rest.length === 1) {
    if (a.req.method !== "POST") return no(405, "POST only.");
    let body: any = null;
    try { body = await a.req.json(); } catch { body = null; }
    if (!body || typeof body !== "object") return no(400, "Nothing arrived.");
    try {
      return await withTenant(a.tenantId, (c) => act(c, body, who));
    } catch (e) {
      console.error("tracker: writing " + a.slug + ":", (e as Error).message);
      return no(500, "That did not save. Nothing was changed — try again.");
    }
  }
  if (a.rest.length)
    return Response.redirect(new URL(clientHref(a.slug, "tracker", ""), a.req.url), 302);

  const u = new URL(a.req.url);
  const ask: Ask = {
    view: isView(u.searchParams.get("view")) ? (u.searchParams.get("view") as Ask["view"]) : "week",
    q: u.searchParams.get("q") || "",
    open: u.searchParams.get("open") || null,
  };
  return new Response(await trackerDocument({ slug: a.slug, tenantId: a.tenantId, tenantName: a.tenantName, have: a.have, ask, who }),
    { status: 200, headers: shellHeaders() });
}

type Q = Parameters<typeof oneAction>[0];

async function act(c: Q, b: any, who: Who): Promise<Response> {
  const kind = String(b.act || "");
  const by = who.personKey || "";

  if (kind === "add") {
    const title = oneLine(b.title);
    if (!title) return no(400, "An action needs a few words.");
    const ownerKey = String(b.ownerKey || who.personKey || "");
    if (!ownerKey) return no(400, "You are not on this client's register yet, so nothing can be owned by you here.");
    if (!(await isOfficeRow(c, ownerKey))) return no(400, "An action is owned by somebody on the office's seats.");
    const row = await addAction(c, { title, ownerKey, by });
    return json(200, { ok: true, id: row.id });
  }

  const id = String(b.id || "");
  if (!id) return no(400, "Which action?");
  const cur = await oneAction(c, id);
  if (!cur) return no(404, "That action is not on this client's list any more.");

  if (kind === "status") {
    if (!isStatus(b.status)) return no(400, "Not a status this list knows.");
    if (!mayChange(cur, who)) return no(403, "Only its owner, somebody on it, or the client's Super user can change this action.");
    await setStatus(c, id, b.status, by);
    return json(200, { ok: true });
  }
  if (kind === "due") {
    if (!mayChange(cur, who)) return no(403, "Only its owner, somebody on it, or the client's Super user can change this action.");
    const due = b.due == null || b.due === "" ? null : calendarDay(b.due);
    if (b.due && !due) return no(400, "That is not a date this list can read.");
    await setFields(c, id, { due });
    return json(200, { ok: true });
  }
  if (kind === "notes" || kind === "rename") {
    if (!mayChange(cur, who)) return no(403, "Only its owner, somebody on it, or the client's Super user can change this action.");
    if (kind === "rename" && !oneLine(b.title)) return no(400, "An action needs a few words.");
    await setFields(c, id, kind === "notes" ? { description: String(b.description || "") } : { title: String(b.title) });
    return json(200, { ok: true });
  }
  if (kind === "owner" || kind === "collab") {
    if (!mayOwn(cur, who)) return no(403, "Only its owner or the client's Super user can hand this action to somebody else.");
    if (kind === "owner") {
      const ownerKey = String(b.ownerKey || "");
      if (!ownerKey || !(await isOfficeRow(c, ownerKey))) return no(400, "An action is owned by somebody on the office's seats.");
      await setFields(c, id, { ownerKey, collaborators: cur.collaborators.filter((k) => k !== ownerKey) });
    } else {
      const keys = Array.isArray(b.collaborators) ? b.collaborators.map((k: unknown) => String(k || "")).filter(Boolean) : [];
      for (const k of keys) if (!(await isOfficeRow(c, k))) return no(400, "Somebody on an action holds one of the office's seats.");
      await setFields(c, id, { collaborators: keys.filter((k: string) => k !== cur.ownerKey) });
    }
    return json(200, { ok: true });
  }
  if (kind === "delete") {
    if (!mayOwn(cur, who)) return no(403, "Only its owner or the client's Super user can delete this action.");
    await deleteAction(c, id);
    return json(200, { ok: true });
  }
  return no(400, "Not something this list does.");
}
