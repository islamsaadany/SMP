/* ── MEETING NOTES SERVES ITSELF (spec 055) ──────────────────────────────
   Three addresses: the page (the list, or one note, with the search and the
   open note on the address so a link somebody sends opens the same note),
   the one script, and the api every change is POSTed to. Anything else
   inside the module comes back to the list rather than being refused, which
   is what every unknown word inside a client already gets (lib/modules.ts).

   EVERY WRITE ANSWERS WITH THE PAGE DRAWN AGAIN (§356.12, one module over):
   the same function that drew it draws it again, inside the same tenant
   read, so the browser swaps it in and never renders a part of its own.

   THE OFFICE ONLY, BY RULE (decision 8), asked of the SEAT the door
   established and asked HERE at the server — not only by leaving the entry
   off a menu, because a hidden entry is decoration (§42, §44). A client's
   own person is told so in words, with the way back (§61).

   AND EVERY WRITE IS JUDGED AGAINST THE STORED ROW, never against what the
   page drew (§42): the note is read back before anything is written to it,
   so a note from another client, or one somebody deleted while this tab sat
   open, is a 404 in words and writes nothing. */
import { clientHref } from "../../lib/modules.ts";
import { shellHeaders } from "../../lib/shell.ts";
import { withTenant } from "../../lib/tenant.ts";
import type { ServeArgs } from "../registry.ts";
import { notesDocument, refusedDocument, noteFragment, type Ask, type PageArgs } from "./page.ts";
import { APP_JS } from "./script.ts";
import {
  type Who, type Attendee, isOffice, calendarDay, oneLine, emailOf, minutesOf, minutesEmpty, attendeesOf,
  oneNote, newNote, setFields, deleteNote, refine, sendMinutes, registerOf, officeRows, namedOf, brandOf, todayIn,
} from "../../lib/notes.ts";

const brk = () => process.env.SMP_BREAK || "";
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const no = (status: number, why: string) => json(status, { ok: false, why });

export async function serve(a: ServeArgs): Promise<Response> {
  const first = a.rest[0] || "";
  if (first === "app.js" && a.rest.length === 1)
    /* `close-on-tick` puts back the reported fault: the list is rebuilt hidden
       by every redraw, so refusing to carry it is exactly what shut it after
       each tick. Never set on a deployment (constitution XVI). */
    /* `date-two-presses` puts back what §357.4 removed: the calendar is not
       opened for them, so the word is swapped for a box and the calendar is
       behind the icon inside it — two presses, and the day reformats into
       whatever spelling the browser's locale chose. */
    return new Response(APP_JS
      .replace("/*%BRK%*/", brk() === "close-on-tick" ? "return false;" : "")
      .replace("/*%DATEBRK%*/", brk() === "date-two-presses" ? "throw 0;" : ""), { status: 200, headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "no-store" } });

  /* THE GATE. The check's break opens it to anybody with a membership, which
     must turn checks/notes.mjs red (§94.5). Never set on a deployment. */
  const office = brk() === "no-office-gate" ? a.seat != null : isOffice(a.seat);
  if (!office) {
    if (first === "api") return no(403, "Meeting Notes is the office's.");
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
      const out = await withTenant(a.tenantId, (c) => act(c, body, who, a.tenantName));
      if (out.status !== 200) return json(out.status, out.body);
      if (out.body.gone) return json(200, out.body);
      const ask: Ask = { q: "", note: String(out.body.note || body.note || "") || null };
      const frag = await noteFragment(page(ask));
      return json(200, { ...out.body, body: frag.body, note: frag.note });
    } catch (e) {
      console.error("notes: writing " + a.slug + ":", (e as Error).message);
      return no(500, "That did not save. Nothing was changed — try again.");
    }
  }
  if (a.rest.length)
    return Response.redirect(new URL(clientHref(a.slug, "notes", ""), a.req.url), 302);

  const u = new URL(a.req.url);
  const ask: Ask = { q: u.searchParams.get("q") || "", note: u.searchParams.get("note") || null };
  return new Response(await notesDocument(page(ask)), { status: 200, headers: shellHeaders() });
}

type Q = Parameters<typeof oneNote>[0];
type Out = { status: number; body: Record<string, unknown> };
const out = (status: number, body: Record<string, unknown>): Out => ({ status, body });
const refused = (status: number, why: string): Out => out(status, { ok: false, why });

/* WHAT A PRESS MAY DO. Every act but `new` names a note, and the note is read
   back from the stored rows before anything is written (§42). */
async function act(c: Q, b: any, who: Who, tenantName: string): Promise<Out> {
  const kind = String(b.act || "");
  const by = who.personKey || "";

  if (kind === "new") {
    const n = await newNote(c, by, todayIn());
    return out(200, { ok: true, note: n.id });
  }

  const id = String(b.note || "");
  if (!id) return refused(400, "Which meeting?");
  const cur = await oneNote(c, id);
  if (!cur) return refused(404, "That meeting is not on this client's list any more.");

  if (kind === "title") {
    await setFields(c, id, { title: String(b.value || "") });
  } else if (kind === "date") {
    const day = calendarDay(b.value);
    if (!day) return refused(400, "That is not a date this list can read.");
    await setFields(c, id, { metOn: day });
  } else if (kind === "raw") {
    await setFields(c, id, { raw: String(b.value || "") });
  } else if (kind === "minutes") {
    const m = minutesOf(b.minutes);
    if (!m) return refused(400, "Those are not minutes this note can hold.");
    /* EMPTIED BY HAND IS EMPTIED (§50.6): every box cleared stores an
       absence rather than six empty parts, so the page offers Refine again
       rather than a page of empty headings. */
    await setFields(c, id, { minutes: minutesEmpty(m) ? null : m });
  } else if (kind === "add-attendee") {
    const att = await addAttendee(c, cur.attendees, b);
    if (typeof att === "string") return refused(400, att);
    await setFields(c, id, { attendees: att });
  } else if (kind === "drop-attendee") {
    const list = cur.attendees.slice();
    const key = String(b.key || "");
    const at = key ? list.findIndex((x) => "key" in x && x.key === key) : Number(b.at);
    if (!(at >= 0 && at < list.length)) return refused(400, "Nobody by that name is on this meeting.");
    list.splice(at, 1);
    await setFields(c, id, { attendees: list });
  } else if (kind === "refine") {
    /* WHAT THE WRITER HOLDS IS WHAT IS REFINED FROM (decision 6): the boxes
       are posted with the press, so a second Refine adds to the minutes as
       EDITED rather than to the last ones the model returned. */
    const held = minutesOf(b.minutes);
    const base = { title: cur.title, metOn: cur.metOn, raw: cur.raw, minutes: held && !minutesEmpty(held) ? held : cur.minutes };
    const reg = await registerOf(c);
    const office = new Set((await officeRows(c)).map((p) => p.key));
    const r = await refine(base, tenantName, namedOf(cur.attendees, reg, office));
    if (!r.ok) return refused(502, r.why);
    await setFields(c, id, { minutes: r.minutes }, by);
    return out(200, { ok: true, note: id, said: "The minutes are written. Read them, correct anything, then send." });
  } else if (kind === "send") {
    /* THE BOXES AS THEY STAND GO OUT, so what was edited a second ago is
       what is sent — stored first, then sent, so the record and the email
       are the same minutes (§42). */
    const held = minutesOf(b.minutes);
    if (held && !minutesEmpty(held)) await setFields(c, id, { minutes: held });
    const now = (await oneNote(c, id))!;
    const r = await sendMinutes(c, now, who, tenantName, await brandOf(c));
    if (!r.ok) return refused(400, r.why);
    const skipped = r.skipped.length ? " " + r.skipped.join(", ") + (r.skipped.length === 1 ? " has" : " have") + " no email and did not receive them." : "";
    const failed = r.failed ? " " + r.failed + " did not arrive." : "";
    return out(200, { ok: true, note: id, said: "The minutes went to " + r.sent + (r.sent === 1 ? " person." : " people.") + skipped + failed });
  } else if (kind === "delete") {
    await deleteNote(c, id);
    return out(200, { ok: true, gone: true });
  } else {
    return refused(400, "Not something this page does.");
  }
  return out(200, { ok: true, note: id });
}

/* A REGISTER ROW BY ITS KEY, OR A CASUAL NAME AND ADDRESS (decision 4), and
   a casual attendee is NEVER written to the register: the register is the
   client's people and this is one person at one meeting. The check's break
   writes them to `people`, which must go red (§94.5). */
async function addAttendee(c: Q, have: Attendee[], b: any): Promise<Attendee[] | string> {
  const key = String(b.key || "").trim();
  if (key) {
    const reg = await registerOf(c);
    const p = reg.get(key);
    if (!p) return "Nobody with that name is on this client's register.";
    if (have.some((x) => "key" in x && x.key === key)) return "They are already on this meeting.";
    return have.concat([{ key }]);
  }
  const name = oneLine(b.name).slice(0, 120), email = emailOf(b.email);
  if (!name) return "A name, so the minutes say who was there.";
  if (!email) return "An email address, or the minutes cannot reach them.";
  if (have.some((x) => !("key" in x) && x.email === email)) return "They are already on this meeting.";
  if (brk() === "casual-to-register")
    await c.query("INSERT INTO people (key, idx, name, extra) VALUES ($1, 999, $2, $3) ON CONFLICT DO NOTHING",
      [email.replace(/[^a-z0-9]+/g, "-"), name, JSON.stringify({ email })]);
  return attendeesOf(have.concat([{ name, email }]));
}
