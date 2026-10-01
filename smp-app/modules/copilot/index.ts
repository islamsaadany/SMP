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
  chatsOn, allChats, allDeliverables, oneChat, newChat, renameChat, deleteChat, archiveChat, restoreChat, messagesOf,
  deliverablesOn, oneDeliverable, versionsOf, bodyOf, newDeliverable, addVersion, restoreVersion,
  NO_KEY, failedLine, recordSaid, materialOf, recordAnswer, assumptionsOf,
  attachFile, detachFile, pendingFiles, pendingCount, fileBytes, oneMessage, copilotGrant, storedCopilotGrant,
} from "../../lib/copilot.ts";
import { kindOf, readFile, MAX_FILE_BYTES, MAX_FILES_PER_MESSAGE, REFUSE_KIND, REFUSE_SIZE } from "../../lib/copilot-files.ts";
import { askCopilot, isPasted, configured } from "../../lib/copilot-ask.ts";
import { methodFor, templateNamesFor, partsOf, templatesOf, templateFile, savePart, saveTemplate, resetAsset, MAX_TEMPLATE } from "../../lib/copilot-settings.ts";
import { shellHeaders } from "../../lib/shell.ts";
import { listDocument, instructionsDocument, templatesDocument, refusedCopilot, barOf, type Names, type Flash, type ListAsk } from "./page.ts";
import { doorPool, getSession, readCookie } from "../../lib/auth.ts";

const brk = () => process.env.SMP_BREAK || "";
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const no = (status: number, why: string) => json(status, { ok: false, why });
const html = (status: number, body: string) =>
  new Response(body, { status, headers: { ...shellHeaders(), "Content-Type": "text/html; charset=utf-8" } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function serve(a: ServeArgs): Promise<Response> {
  const first = a.rest[0] || "";
  /* THE GATE. The check's break opens it to anybody with a membership, which
     must turn checks/copilot.mjs red (§94.5). Never set on a deployment. */
  const office = brk() === "no-office-gate" ? a.seat != null : isOffice(a.seat);
  const isApi = (first === "api" || first === "list" || first === "chat" || first === "deliverable" || first === "file") && a.rest.length === 1;
  /* THE COPILOT'S OWN PAGES (§456): the list at the module's bare address,
     its settings under `settings`. Any other address inside the module goes
     back to the list rather than to Strategy, now that the module has a page
     of its own to be the answer. */
  const isPage = !isApi && (a.rest.length === 0 || first === "settings");
  if (!isApi && !isPage) return Response.redirect(new URL(clientHref(a.slug, "copilot", ""), a.req.url), 302);
  if (!office) return isPage
    ? html(403, await refusedCopilot(a.slug, a.tenantName, a.have, a.tenantId, "The Copilot is the office's.", !!a.consultant))
    : no(403, "The Copilot is the office's.");
  /* VIEW OR EDIT (Islam, 2026-10-01): the office seat's own cell on Roles &
     access, read off the stored map on every path. NONE refuses the reads as
     well — a hidden tab is decoration (§42) — and VIEW refuses every POST,
     because every POST here is a write. The check's break skips the read so
     a View seat can write, which must turn checks/copilot.mjs red (§94.5). */
  /* A cell that cannot be READ refuses every act on the client's chats (a
     500 in words) and still lets the page draw, because every read on the
     page says for itself when it could not be made — a page is never blank
     for want of one row (§93, §231.4). */
  let stored: string | null | undefined;
  try { stored = await withTenant(a.tenantId, (c) => storedCopilotGrant(c, a.seat)); }
  catch (e) { console.error("copilot: grant " + a.slug + ":", (e as Error).message); stored = undefined; }
  if (stored === undefined && !isPage && brk() !== "no-view-gate") return no(500, "The Copilot could not be read just now. Nothing has been lost — try again in a moment.");
  const grant = brk() === "no-view-gate" ? "edit"
    : copilotGrant(brk() === "no-office-gate" && !isOffice(a.seat) ? "smoteam" : a.seat, stored === undefined ? null : stored);
  if (grant === "none") return isPage
    ? html(403, await refusedCopilot(a.slug, a.tenantName, a.have, a.tenantId, "The Copilot is not open to you on this client.", !!a.consultant))
    : no(403, "The Copilot is not open to you on this client.");
  /* The pages answer their own writes: the settings are not this client's
     (lib/copilot-settings.ts), so they are not judged by the Copilot cell —
     reading them needs the office and the cell's View, changing them needs a
     Forefront super user, asked here on every POST (§42). */
  if (isPage) return pages(a);
  if (a.req.method === "POST" && grant !== "edit")
    return no(403, "View only — you can read the Copilot's chats and deliverables, not change them.");
  const who: Who = { personKey: a.personKey ?? null, seat: a.seat ?? null };
  const u = new URL(a.req.url);
  const q = (k: string) => u.searchParams.get(k) || "";

  try {
    if (first === "list") {
      const place = q("place"), section = q("section");
      if (!isPlace(place) || !isSection(section)) return no(400, "Which place and which section?");
      return json(200, await withTenant(a.tenantId, async (c) =>
        ({ ok: true, chats: await chatsOn(c, place, section), archived: await chatsOn(c, place, section, true),
           mayDelete: who.seat === "super" && grant === "edit", mayEdit: grant === "edit", deliverables: await deliverablesOn(c, place, section) })));
    }
    if (first === "chat") {
      const id = q("id");
      if (!UUID.test(id)) return no(400, "Which chat?");
      const got = await withTenant(a.tenantId, async (c) => {
        const chat = await oneChat(c, id);
        return chat ? { ok: true, chat, messages: await messagesOf(c, id), mayDelete: grant === "edit" && mayDeleteChat(chat, who), mayEdit: grant === "edit",
          pending: await pendingFiles(c, id), assumptions: await assumptionsOf(c, id), aiOn: configured() } : null;
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
    if (first === "file") {
      /* A file comes back as itself, to the office only, as a download —
         never displayed inline, so a file cannot run as a page here. */
      const id = q("id");
      if (!UUID.test(id)) return no(400, "Which file?");
      const f = await withTenant(a.tenantId, (c) => fileBytes(c, id));
      if (!f) return no(404, "That file is not here any more.");
      const type = f.kind === "pdf" ? "application/pdf"
        : f.kind === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      return new Response(new Uint8Array(f.bytes), { status: 200, headers: {
        "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "attachment; filename*=UTF-8''" + encodeURIComponent(f.name) } });
    }
    /* api */
    if (a.req.method !== "POST") return no(405, "POST only.");
    let body: any = null;
    try { body = await a.req.json(); } catch { body = null; }
    if (!body || typeof body !== "object") return no(400, "Nothing arrived.");
    if (body.act === "say") {
      const r = await sayFlow(a.tenantId, body, who);
      return json(r.status, r.body);
    }
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
const ARCHIVED = "This chat is archived. Restore it to keep talking.";
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

  if (kind === "attach" || kind === "detach") {
    const chat = await oneChat(c, id);
    if (!chat) return refused(404, "That chat is not here any more.");
    if (chat.archived) return refused(400, ARCHIVED);
    if (kind === "detach") {
      const fid = String(b.fileId || "");
      if (!UUID.test(fid)) return refused(400, "Which file?");
      if (!(await detachFile(c, id, fid))) return refused(400, "That file was already sent, so it stays with the chat.");
      return out(200, { ok: true, pending: await pendingFiles(c, id) });
    }
    const name = oneLine(b.name).slice(0, 200);
    const fk = kindOf(name, String(b.type || ""));
    if (!name || !fk) return refused(400, REFUSE_KIND);
    const data = String(b.data || "");
    /* The size is asked of the ENCODED text first, so an oversized body is
       refused before it is decoded into memory. */
    if (data.length > Math.ceil(MAX_FILE_BYTES / 3) * 4 + 8) return refused(400, REFUSE_SIZE);
    const bytes = Buffer.from(data, "base64");
    if (!bytes.length) return refused(400, "That file is empty.");
    if (bytes.length > MAX_FILE_BYTES) return refused(400, REFUSE_SIZE);
    if ((await pendingCount(c, id)) >= MAX_FILES_PER_MESSAGE) return refused(400, "Three files can go with one message. Send these first.");
    const read = readFile(fk, bytes);
    if (!read.ok) return refused(400, read.why);
    const file = await attachFile(c, id, { name, kind: fk, size: bytes.length, bytes, text: read.text, by });
    return out(200, { ok: true, file, pending: await pendingFiles(c, id) });
  }

  if (kind === "savePasted") {
    /* The offer under pasted material (plan §5 stage 2): kept as a
       Copilot-only deliverable in the section it belongs to, so it does not
       live only inside one chat. Judged against the STORED message (§42):
       it must be this chat's, the person's, and marked pasted. */
    const chat = await oneChat(c, id);
    if (!chat) return refused(404, "That chat is not here any more.");
    const m = await oneMessage(c, id, String(b.messageId || "").replace(/\D/g, "") || "0");
    const p: any = m && m.part;
    if (!m || m.who !== "person" || !p || !p.pasted) return refused(400, "That is not pasted material in this chat.");
    const section = String(b.section || "");
    if (!isSection(section)) return refused(400, "Which section?");
    const first = oneLine(m.body).slice(0, 80);
    const did = await newDeliverable(c, { place: chat.place, section, title: "Pasted — " + (first || "material"), type: "free",
      kind: "copilot-only", approach: "", body: { text: m.body }, note: "Pasted into “" + chat.title + "”", by,
      chatId: chat.id, chatTitle: chat.title });
    return out(200, { ok: true, id: did });
  }

  if (kind === "rename" || kind === "deleteChat" || kind === "archiveChat" || kind === "restoreChat") {
    const chat = await oneChat(c, id);
    if (!chat) return refused(404, "That chat is not here any more.");
    if (kind === "archiveChat") { if (!chat.archived) await archiveChat(c, id, by); return out(200, { ok: true }); }
    if (kind === "restoreChat") { if (chat.archived) await restoreChat(c, id); return out(200, { ok: true }); }
    if (kind === "rename") {
      const title = oneLine(b.title).slice(0, MAX_TITLE);
      if (!title) return refused(400, "A chat needs a name.");
      await renameChat(c, id, title);
      return out(200, { ok: true });
    }
    if (!mayDeleteChat(chat, who)) return who.seat !== "super"
      ? refused(403, "Only the Super user can delete a chat. Archive it instead — nothing is lost.")
      : refused(400, "Archive the chat first; only an archived chat can be deleted.");
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

/* ── SAYING SOMETHING (stage 2) ────────────────────────────────────────
   Step 1 and step 2 are two transactions with the model between them (see
   lib/copilot.ts). What arrives from the page beside the words is what the
   PLATFORM shows for this place — the one line of context and its detail,
   built by the tab from the platform's own readers — and it is only ever
   material for the prompt: nothing is stored from it and nothing is decided
   by it. */
/* What the tab sends of the plan (§457): the place's own written words, the
   chat's section first, so a long plan loses the far sections and never the
   one being asked about. A whole unit's plan is ~8,000 characters. */
const MAX_CONTEXT = 24_000;
async function sayFlow(tenantId: string, b: any, who: Who): Promise<Out> {
  const id = String(b.id || "");
  if (!UUID.test(id)) return refused(400, "Which chat?");
  const text = String(b.text ?? "");
  const fileIds = (Array.isArray(b.fileIds) ? b.fileIds : []).map(String).filter((x: string) => UUID.test(x));
  if (!text.trim() && !fileIds.length) return refused(400, "Nothing to send.");
  if (text.length > MAX_MESSAGE) return refused(400, TOO_LONG);
  if (fileIds.length > MAX_FILES_PER_MESSAGE) return refused(400, "Three files can go with one message.");
  const pasted = isPasted(text);
  const by = who.personKey || "";

  const step1 = await withTenant(tenantId, async (c) => {
    const chat = await oneChat(c, id);
    if (!chat) return null;
    if (chat.archived) return "archived" as const;
    const said = await recordSaid(c, id, { body: text, by, fileIds, pasted });
    if (said === "badFile") return "badFile" as const;
    return { chat, said, material: await materialOf(c, id, said.messageId) };
  });
  if (!step1) return refused(404, "That chat is not here any more.");
  if (step1 === "archived") return refused(400, ARCHIVED);
  if (step1 === "badFile") return refused(400, "One of those files is not waiting in this chat any more. Attach it again.");
  const { chat, said, material } = step1;

  const question = (text.trim() || "(sent without words)") +
    (said.files.length ? "\n[attached with this message: " + said.files.map((f) => f.name).join(", ") + "]" : "");
  /* What this section is told, read on every question so an edit in Copilot
     settings takes effect on the next message (§456). A database that will
     not answer gives the Copilot no method rather than no answer. */
  const method = configured() && brk() !== "no-method" ? await methodFor(doorPool(), chat.section).catch(() => "") : "";
  const r = configured()
    ? await askCopilot({ method, templates: templateNamesFor(chat.section),
        section: chat.section, place: chat.place, placeWord: oneLine(b.placeWord).slice(0, 120),
        context: String(b.context ?? "").slice(0, MAX_CONTEXT), question, pasted,
        history: material.history, assumptions: material.assumptions, files: material.files,
      })
    : { ok: false as const, noKey: true, why: "no key is set" };

  await withTenant(tenantId, async (c) => {
    if (r.ok) {
      const part: any = { ...r.part };
      /* The offer to keep pasted material is attached by the PRODUCT, only
         under a message that really was pasted — never on the model's say. */
      if (pasted || brk() === "offer-always") part.pastedOffer = { messageId: said.messageId, section: r.part.pastedBelongsTo || chat.section };
      if (said.files.length) part.read = said.files.map((f) => f.name);
      await recordAnswer(c, id, { body: r.reply, part, assumptions: r.part.assumptions });
    } else if ((r as any).noKey) {
      await recordAnswer(c, id, { body: NO_KEY, part: { kind: "noKey" } });
    } else {
      console.error("copilot: ask:", r.why);
      await recordAnswer(c, id, { body: failedLine(r.why), part: { kind: "failed" } });
    }
  });
  return out(200, { ok: true, messages: await withTenant(tenantId, (c) => messagesOf(c, id)),
    assumptions: await withTenant(tenantId, (c) => assumptionsOf(c, id)) });
}

/* ── THE PAGES (§456) ──────────────────────────────────────────────────
   The list, and the two settings pages. A write is a plain form POST that
   answers with the page drawn again and a sentence saying what happened
   (§171: a save that fails says so), so no script is needed anywhere here. */
async function pages(a: ServeArgs): Promise<Response> {
  const u = new URL(a.req.url);
  const q = (k: string) => u.searchParams.get(k) || "";
  const bar = await barOf(a.tenantId);
  const sub = a.rest[1] || "";
  const by = await adminId(a);
  try {
    if (a.rest[0] !== "settings") {
      if (a.rest.length) return Response.redirect(new URL(clientHref(a.slug, "copilot", ""), a.req.url), 302);
      const ask: ListAsk = { view: q("view") === "deliverables" ? "deliverables" : "chats",
        section: isSection(q("section")) ? q("section") : "", place: isPlace(q("place")) ? q("place") : "", q: oneLine(q("q")).slice(0, 120) };
      let chats: any = null, delivs: any = null, names: Names = { places: new Map(), people: new Map() };
      try {
        await withTenant(a.tenantId, async (c) => {
          if (ask.view === "chats") chats = await allChats(c); else delivs = await allDeliverables(c);
          names = await namesOf(c);
        });
      } catch (e) { console.error("copilot: list " + a.slug + ":", (e as Error).message); }
      return html(200, listDocument(a.slug, a.tenantName, a.have, bar, names, ask, chats, delivs, !!a.consultant));
    }
    const pool = doorPool();
    if (sub === "" ) {
      let flash: Flash = null;
      if (a.req.method === "POST") {
        if (!a.admin && brk() !== "settings-any-office") flash = { ok: false, text: "Only a Forefront super user can change the AI instructions." };
        else {
          const f = await a.req.formData();
          const key = String(f.get("key") || ""), act = String(f.get("act") || "");
          const r = act === "reset" ? await resetAsset(pool, key) : act === "save" ? await savePart(pool, key, String(f.get("text") ?? ""), by) : { ok: false as const, why: "Not something this page does." };
          /* A write that landed answers with the page's own address (303), so
             a refresh reads the page rather than sending the form again. */
          if (r.ok) return seeOther(a, "settings", { section: q("section") || "foundation", done: act === "reset" ? "reset" : r.changed ? "saved" : "same" }, key);
          flash = { ok: false, text: r.why };
        }
      } else if (q("done")) flash = { ok: true, text: q("done") === "reset" ? "The shipped text is back." : q("done") === "saved" ? "Saved. Every client's Copilot reads it from the next message." : "Nothing changed." };
      const parts = await partsOf(pool);
      return html(flash && !flash.ok ? 400 : 200, instructionsDocument(a.slug, a.tenantName, a.have, bar, parts, q("section") || "foundation",
        a.admin, flash && flash.ok ? "" : q("edit"), flash, !!a.consultant));
    }
    if (sub === "templates" && a.rest.length === 2) {
      let flash: Flash = null;
      if (a.req.method === "POST") {
        if (!a.admin && brk() !== "settings-any-office") flash = { ok: false, text: "Only a Forefront super user can replace a template." };
        else {
          const f = await a.req.formData();
          const key = String(f.get("key") || ""), act = String(f.get("act") || "");
          let r: { ok: true; changed: boolean } | { ok: false; why: string };
          if (act === "reset") r = await resetAsset(pool, key);
          else if (act === "replace") {
            const file = f.get("file");
            if (!file || typeof file === "string") r = { ok: false, why: "Choose the file to put in its place." };
            else if (file.size > MAX_TEMPLATE) r = { ok: false, why: "A template can be up to 3 MB." };
            else r = await saveTemplate(pool, key, file.name, Buffer.from(await file.arrayBuffer()), by);
          } else r = { ok: false, why: "Not something this page does." };
          if (r.ok) return seeOther(a, "settings/templates", { done: act === "reset" ? "reset" : "replaced" }, "");
          flash = { ok: false, text: r.why };
        }
      } else if (q("done")) flash = { ok: true, text: q("done") === "reset" ? "The shipped file is back." : "Replaced. Every client now downloads the new file." };
      return html(flash && !flash.ok ? 400 : 200, templatesDocument(a.slug, a.tenantName, a.have, bar, await templatesOf(pool), a.admin, flash, !!a.consultant));
    }
    if (sub === "templates" && a.rest.length === 3) {
      const f = await templateFile(pool, a.rest[2]);
      if (!f) return html(404, await refusedCopilot(a.slug, a.tenantName, a.have, a.tenantId, "That template is not here.", !!a.consultant));
      return new Response(new Uint8Array(f.bytes), { status: 200, headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff", "Content-Disposition": "attachment; filename*=UTF-8''" + encodeURIComponent(f.name) } });
    }
    return Response.redirect(new URL(clientHref(a.slug, "copilot", "settings"), a.req.url), 302);
  } catch (e) {
    console.error("copilot: page " + a.rest.join("/") + " " + a.slug + ":", (e as Error).message);
    return html(500, await refusedCopilot(a.slug, a.tenantName, a.have, a.tenantId,
      a.req.method === "POST" ? "That did not save. Nothing was changed — try again." : "This could not be read just now. Nothing has been lost — try again in a moment.", !!a.consultant));
  }
}

function seeOther(a: ServeArgs, rest: string, params: Record<string, string>, anchor: string): Response {
  const u = new URL(clientHref(a.slug, "copilot", rest), a.req.url);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  if (anchor) u.hash = anchor;
  return new Response(null, { status: 303, headers: { Location: u.toString(), "Cache-Control": "no-store" } });
}

/* The account behind an admin's write, for `updated_by`; null for anybody
   else, who cannot write here anyway. */
async function adminId(a: ServeArgs): Promise<string | null> {
  if (!a.admin) return null;
  /* lib/session.ts would pull Next in; the two readers it wraps are here. */
  try { const u = await getSession(doorPool(), readCookie(a.req.headers.get("cookie"))); return u ? u.id : null; } catch { return null; }
}

/* The client's names for every place word and every person, read once per
   list — including retired ones, because a chat about a unit since retired
   is still a record of what was said and should still say where. */
async function namesOf(c: any): Promise<Names> {
  const places = new Map<string, string>(), people = new Map<string, string>();
  const r = await c.query(
    "SELECT key AS k, coalesce(nullif(name,''), key) AS n, 'unit' AS t FROM units " +
    "UNION ALL SELECT 'fn:' || key, coalesce(nullif(name,''), key), 'fn' FROM functions " +
    "UNION ALL SELECT 'co:' || key, coalesce(nullif(name,''), key), 'co' FROM companies " +
    "UNION ALL SELECT 'cap:' || id, coalesce(nullif(name,''), id), 'cap' FROM capabilities");
  for (const x of r.rows) places.set(String(x.k), String(x.n));
  const p = await c.query("SELECT key, coalesce(nullif(name,''), key) AS n FROM people");
  for (const x of p.rows) people.set(String(x.key), String(x.n));
  return { places, people };
}
