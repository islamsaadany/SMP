/* ── THE INTERNAL TRACKER SERVES ITSELF (spec 054) ───────────────────────
   Four addresses: the page (with its view, search and opened row on the
   address, so a filtered week is a link somebody can send), the one script,
   the api every change is POSTed to, and `list` — the list drawn again, as
   JSON, which a press reads after it has landed and the arrow and the
   grouping read on their own (§356.12: a read is a GET, and the api's own
   405 says a GET there is not a write). Anything else inside the module
   comes back to the page rather than being refused, which is what every
   unknown word inside a client already gets (lib/modules.ts).

   EVERY WRITE ANSWERS WITH THE LIST (§356.12): the same function that drew
   the page draws it again after the change, inside the same tenant read, so
   the browser swaps it in and never renders a row of its own (§53.5).

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
import { trackerDocument, refusedDocument, listFragment, type Ask, type PageArgs } from "./page.ts";
import { APP_JS } from "./script.ts";
import {
  type Who, type Group, isView, isGroup, isStatus, isOffice, calendarDay, oneLine, GROUP_COOKIE,
  oneAction, addAction, setFields, setStatus, deleteAction, isOfficeRow, mayChange,
} from "../../lib/tracker.ts";

const brk = () => process.env.SMP_BREAK || "";
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const no = (status: number, why: string) => json(status, { ok: false, why });

export async function serve(a: ServeArgs): Promise<Response> {
  const first = a.rest[0] || "";
  if (first === "app.js" && a.rest.length === 1)
    /* The check's second break puts the reload back after an add, which must
       turn checks/tracker.mjs §10 red (§94.5). Never set on a deployment. */
    return new Response(APP_JS.replace("/*%BRK%*/", brk() === "reload-on-add" ? "location.reload();" : ""), { status: 200, headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "no-store" } });

  /* THE GATE. The check's break opens it to anybody with a membership, which
     must turn checks/tracker.mjs red (§94.5). Never set on a deployment. */
  const office = brk() === "no-office-gate" ? a.seat != null : isOffice(a.seat);
  if (!office) {
    if (first === "api") return no(403, "The Internal Tracker is the office's.");
    return new Response(await refusedDocument(a.slug, a.tenantId, a.tenantName, a.have), { status: 403, headers: shellHeaders() });
  }
  const who: Who = { personKey: a.personKey ?? null, seat: a.seat ?? null };

  const page = (ask: Ask): PageArgs => ({ slug: a.slug, tenantId: a.tenantId, tenantName: a.tenantName, have: a.have, ask, who });

  if (first === "api" && a.rest.length === 1) {
    if (a.req.method !== "POST") return no(405, "POST only.");
    let body: any = null;
    try { body = await a.req.json(); } catch { body = null; }
    if (!body || typeof body !== "object") return no(400, "Nothing arrived.");
    try {
      const out = await withTenant(a.tenantId, (c) => act(c, body, who));
      if (out.status !== 200) return json(out.status, out.body);
      /* Drawn again under the tenant, as the page the press was made on —
         the view, the search, the grouping and the opened row all ride on
         the press, so the answer is the list the person is looking at. */
      const frag = await listFragment(page(askOf(body, a.req)));
      return json(200, { ...out.body, body: frag.body, count: frag.count, open: frag.open });
    } catch (e) {
      console.error("tracker: writing " + a.slug + ":", (e as Error).message);
      return no(500, "That did not save. Nothing was changed — try again.");
    }
  }
  if (first === "list" && a.rest.length === 1) {
    const u = new URL(a.req.url);
    try {
      const frag = await listFragment(page(askOf(Object.fromEntries(u.searchParams), a.req)));
      return json(200, { ok: true, body: frag.body, count: frag.count, open: frag.open });
    } catch (e) {
      console.error("tracker: reading " + a.slug + ":", (e as Error).message);
      return no(500, "The list could not be read just now. Nothing has been lost — try again in a moment.");
    }
  }
  if (a.rest.length)
    return Response.redirect(new URL(clientHref(a.slug, "tracker", ""), a.req.url), 302);

  const u = new URL(a.req.url);
  return new Response(await trackerDocument(page(askOf(Object.fromEntries(u.searchParams), a.req))),
    { status: 200, headers: shellHeaders() });
}

/* WHICH LIST: the view, the search, the opened row and the grouping — off
   the address, or off a press's own body. The grouping falls back to the
   cookie the script writes (§356.11), so the next visit opens grouped the
   way this browser last chose, and to Owner where nothing chose. */
function askOf(src: Record<string, unknown>, req: Request): Ask {
  const s = (k: string) => (src[k] == null ? "" : String(src[k]));
  return {
    view: isView(s("view")) ? (s("view") as Ask["view"]) : "week",
    q: s("q"),
    open: s("open") || null,
    group: isGroup(s("group")) ? (s("group") as Group) : groupCookie(req),
  };
}
function groupCookie(req: Request): Group {
  const m = new RegExp("(?:^|;\\s*)" + GROUP_COOKIE.replace(/\./g, "\\.") + "=([^;]*)").exec(req.headers.get("cookie") || "");
  const v = m ? decodeURIComponent(m[1]) : "";
  return isGroup(v) ? v : "owner";
}

type Q = Parameters<typeof oneAction>[0];
type Out = { status: number; body: Record<string, unknown> };
const out = (status: number, body: Record<string, unknown>): Out => ({ status, body });
const refused = (status: number, why: string): Out => out(status, { ok: false, why });
const ONLY = "Only its owner or the client's Super user can change this action.";

/* ONE RULE FOR EVERY CHANGE (§356.11): with collaborators gone there is no
   longer a "somebody on it" — a `collab` act, from a tab on the build
   before, is not something this list does any more. */
async function act(c: Q, b: any, who: Who): Promise<Out> {
  const kind = String(b.act || "");
  const by = who.personKey || "";

  if (kind === "add") {
    const title = oneLine(b.title);
    if (!title) return refused(400, "An action needs a few words.");
    const ownerKey = String(b.ownerKey || who.personKey || "");
    if (!ownerKey) return refused(400, "You are not on this client's register yet, so nothing can be owned by you here.");
    if (!(await isOfficeRow(c, ownerKey))) return refused(400, "An action is owned by somebody on the office's seats.");
    const row = await addAction(c, { title, ownerKey, by });
    return out(200, { ok: true, id: row.id });
  }

  const id = String(b.id || "");
  if (!id) return refused(400, "Which action?");
  const cur = await oneAction(c, id);
  if (!cur) return refused(404, "That action is not on this client's list any more.");
  if (!["status", "due", "notes", "rename", "owner", "delete"].includes(kind)) return refused(400, "Not something this list does.");
  if (!mayChange(cur, who)) return refused(403, ONLY);

  if (kind === "status") {
    if (!isStatus(b.status)) return refused(400, "Not a status this list knows.");
    await setStatus(c, id, b.status, by);
  } else if (kind === "due") {
    const due = b.due == null || b.due === "" ? null : calendarDay(b.due);
    if (b.due && !due) return refused(400, "That is not a date this list can read.");
    await setFields(c, id, { due });
  } else if (kind === "notes") {
    await setFields(c, id, { description: String(b.description || "") });
  } else if (kind === "rename") {
    if (!oneLine(b.title)) return refused(400, "An action needs a few words.");
    await setFields(c, id, { title: String(b.title) });
  } else if (kind === "owner") {
    const ownerKey = String(b.ownerKey || "");
    if (!ownerKey || !(await isOfficeRow(c, ownerKey))) return refused(400, "An action is owned by somebody on the office's seats.");
    await setFields(c, id, { ownerKey });
  } else if (kind === "delete") {
    await deleteAction(c, id);
  }
  return out(200, { ok: true, id });
}
