/* ── THE STRATEGY COPILOT SERVES ITS API (spec 064, stage 1) ─────────────
   The Copilot has no page of its own: it is a TAB inside Strategy's pages
   (lib/modules.ts `inside`), drawn by the frozen shell's src/copilot.js,
   because it works on the place you are standing on. So this server answers
   three reads and one write, and sends any other address inside the module
   back to Strategy — the same answer every unknown word inside a client
   already gets (lib/modules.ts).

     GET  list?place=&section=   the two rails: chats, then deliverables
     GET  chat?id=               one chat and its messages
     GET  deliverable?id=        one deliverable and every version
     POST api                    { act, … } — see `act` below

   THE OFFICE ONLY, AT THE SERVER (decisions v0.4 §2; the Tracker's rule,
   §356): asked of the seat the door established on EVERY path, the reads
   included — a hidden tab is decoration (§42, §44). The refusal is words.

   EVERY WRITE IS JUDGED AGAINST THE STORED ROW (§42): a chat is deleted by
   the person who started it or the Super user (plan §7.1), asked of the row
   in the database and never of what the page drew. */
import { clientHref } from "../../lib/modules.ts";
import { withTenant } from "../../lib/tenant.ts";
import type { ServeArgs } from "../registry.ts";
import {
  type Who, isOffice, isPlace, isSection, isKind, oneLine, mayDeleteChat, MAX_MESSAGE, MAX_TITLE, SECTION_WORD,
  chatsOn, oneChat, newChat, renameChat, deleteChat, messagesOf, say,
  deliverablesOn, oneDeliverable, versionsOf, bodyOf, newDeliverable, addVersion, restoreVersion,
} from "../../lib/copilot.ts";

const brk = () => process.env.SMP_BREAK || "";
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const no = (status: number, why: string) => json(status, { ok: false, why });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function serve(a: ServeArgs): Promise<Response> {
  const first = a.rest[0] || "";
  /* THE GATE. The check's break opens it to anybody with a membership, which
     must turn checks/copilot.mjs red (§94.5). Never set on a deployment. */
  const office = brk() === "no-office-gate" ? a.seat != null : isOffice(a.seat);
  const isApi = (first === "api" || first === "list" || first === "chat" || first === "deliverable") && a.rest.length === 1;
  if (!isApi) return Response.redirect(new URL(clientHref(a.slug, "strategy", ""), a.req.url), 302);
  if (!office) return no(403, "The Copilot is the office's.");
  const who: Who = { personKey: a.personKey ?? null, seat: a.seat ?? null };
  const u = new URL(a.req.url);
  const q = (k: string) => u.searchParams.get(k) || "";

  try {
    if (first === "list") {
      const place = q("place"), section = q("section");
      if (!isPlace(place) || !isSection(section)) return no(400, "Which place and which section?");
      return json(200, await withTenant(a.tenantId, async (c) =>
        ({ ok: true, chats: await chatsOn(c, place, section), deliverables: await deliverablesOn(c, place, section) })));
    }
    if (first === "chat") {
      const id = q("id");
      if (!UUID.test(id)) return no(400, "Which chat?");
      const got = await withTenant(a.tenantId, async (c) => {
        const chat = await oneChat(c, id);
        return chat ? { ok: true, chat, messages: await messagesOf(c, id), mayDelete: mayDeleteChat(chat, who) } : null;
      });
      return got ? json(200, got) : no(404, "That chat is not here any more.");
    }
    if (first === "deliverable") {
      const id = q("id");
      if (!UUID.test(id)) return no(400, "Which deliverable?");
      const got = await withTenant(a.tenantId, async (c) => {
        const d = await oneDeliverable(c, id);
        return d ? { ok: true, deliverable: d, versions: await versionsOf(c, id) } : null;
      });
      return got ? json(200, got) : no(404, "That deliverable is not here any more.");
    }
    /* api */
    if (a.req.method !== "POST") return no(405, "POST only.");
    let body: any = null;
    try { body = await a.req.json(); } catch { body = null; }
    if (!body || typeof body !== "object") return no(400, "Nothing arrived.");
    const out = await withTenant(a.tenantId, (c) => act(c, body, who));
    return json(out.status, out.body);
  } catch (e) {
    console.error("copilot: " + first + " " + a.slug + ":", (e as Error).message);
    return a.req.method === "POST"
      ? no(500, "That did not save. Nothing was changed — try again.")
      : no(500, "This could not be read just now. Nothing has been lost — try again in a moment.");
  }
}

type Q = Parameters<typeof oneChat>[0];
type Out = { status: number; body: Record<string, unknown> };
const out = (status: number, body: Record<string, unknown>): Out => ({ status, body });
const refused = (status: number, why: string): Out => out(status, { ok: false, why });
const TOO_LONG = "That is longer than about thirty pages, so it was not kept. Send it in parts.";

async function act(c: Q, b: any, who: Who): Promise<Out> {
  const kind = String(b.act || "");
  const by = who.personKey || "";

  if (kind === "newChat") {
    const place = String(b.place || ""), section = String(b.section || "");
    if (!isPlace(place) || !isSection(section)) return refused(400, "Which place and which section?");
    const title = oneLine(b.title).slice(0, MAX_TITLE) || ("New " + SECTION_WORD[section].toLowerCase() + " chat");
    const chat = await newChat(c, { place, section, title, by });
    return out(200, { ok: true, chat });
  }
  if (kind === "newDeliverable") {
    const place = String(b.place || ""), section = String(b.section || "");
    if (!isPlace(place) || !isSection(section)) return refused(400, "Which place and which section?");
    const title = oneLine(b.title).slice(0, MAX_TITLE);
    if (!title) return refused(400, "A deliverable needs a title.");
    const kindOf = isKind(b.kind) ? b.kind : "copilot-only";
    const text = String(b.text ?? "");
    if (text.length > MAX_MESSAGE) return refused(400, TOO_LONG);
    const id = await newDeliverable(c, { place, section, title, type: oneLine(b.type) || "free", kind: kindOf,
      approach: oneLine(b.approach), body: { text }, note: oneLine(b.note) || "First version", by, chatId: null, chatTitle: "" });
    return out(200, { ok: true, id });
  }

  const id = String(b.id || "");
  if (!UUID.test(id)) return refused(400, kind === "editVersion" || kind === "restore" ? "Which deliverable?" : "Which chat?");

  if (kind === "say" || kind === "rename" || kind === "deleteChat") {
    const chat = await oneChat(c, id);
    if (!chat) return refused(404, "That chat is not here any more.");
    if (kind === "say") {
      const text = String(b.text ?? "");
      if (!text.trim()) return refused(400, "Nothing to send.");
      if (text.length > MAX_MESSAGE) return refused(400, TOO_LONG);
      await say(c, id, text, by);
      return out(200, { ok: true, messages: await messagesOf(c, id) });
    }
    if (kind === "rename") {
      const title = oneLine(b.title).slice(0, MAX_TITLE);
      if (!title) return refused(400, "A chat needs a name.");
      await renameChat(c, id, title);
      return out(200, { ok: true });
    }
    if (!mayDeleteChat(chat, who)) return refused(403, "Only the person who started this chat or the Super user can delete it.");
    await deleteChat(c, id);
    return out(200, { ok: true });
  }

  if (kind === "editVersion" || kind === "restore") {
    const d = await oneDeliverable(c, id);
    if (!d) return refused(404, "That deliverable is not here any more.");
    if (kind === "editVersion") {
      const text = String(b.text ?? "");
      if (text.length > MAX_MESSAGE) return refused(400, TOO_LONG);
      const cur = (await versionsOf(c, id))[0];
      if (cur && bodyOf(cur.body)?.text === text) return refused(400, "Nothing changed, so no new version was made.");
      const n = await addVersion(c, id, { body: { text }, note: oneLine(b.note) || "Edited", by });
      return out(200, { ok: true, n });
    }
    const from = Number(b.from);
    if (!Number.isInteger(from) || from < 1) return refused(400, "Which version?");
    const r = await restoreVersion(c, id, from, by);
    if (r === "missing") return refused(404, "That version is not on this deliverable.");
    if (r === "same") return refused(400, "That is already the latest version.");
    return out(200, { ok: true, n: r });
  }
  return refused(400, "Not something the Copilot does.");
}
