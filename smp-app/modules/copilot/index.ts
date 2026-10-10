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
  saveDraftFrom, latestDraftId, isSaveAsk, isBareEnhance, claimsDraft, NO_DRAFT,
} from "../../lib/copilot.ts";
import { kindOf, readFile, MAX_FILE_BYTES, MAX_FILES_PER_MESSAGE, REFUSE_KIND, REFUSE_SIZE } from "../../lib/copilot-files.ts";
import { askCopilot, askDraftOnly, askFlowJson, isPasted, configured } from "../../lib/copilot-ask.ts";
import {
  FLOW_ELEMENTS, cleanSkip, allAgreed, savedCurrent, SHORT_ANSWER, MAX_ANSWER, MAX_DRAFT, REFINES, type Flow, newFlow, sanitizeFlow, flowOf, writeFlow,
  flowInstruction, flowCorpus, draftQuestion, refineQuestion, checkQuestion, TEXT_SCHEMA, CHECK_SCHEMA,
  saveFoundation, nextFoundationVersion, appliedFoundation, cleanPartWords,
  withYear,
} from "../../lib/copilot-flow.ts";
import { methodFor, templateNamesFor } from "../../lib/copilot-settings.ts";
import { shellHeaders } from "../../lib/shell.ts";
import { listDocument, refusedCopilot, barOf, type Names, type ListAsk } from "./page.ts";
import { doorPool } from "../../lib/auth.ts";
import { SWOT_ACTS, SWOT_ASKS, swotAct, swotAsk, swotView, swotProgress, sourcesGet, sourceFile } from "./swot.ts";
import { COMPETE_ACTS, COMPETE_ASKS, competeAct, competeAsk, competeView, competeProgress } from "./compete.ts";
import { DIRS_ACTS, DIRS_ASKS, dirsAct, dirsAsk, dirsView, dirsProgress } from "./directions.ts";
import { EXEC_ACTS, EXEC_ASKS, execAct, execAsk, execView, execProgress } from "./execution.ts";
import { ADVISORY_ACTS, ADVISORY_ASKS, advisoryAct, advisoryAsk, advisoryView, advisoryProgress } from "./advisory.ts";

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
  const isApi = (first === "api" || first === "list" || first === "chat" || first === "deliverable" || first === "file"
    || first === "sources" || first === "source") && a.rest.length === 1;
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
{ const chats = await chatsOn(c, place, section);
          return { ok: true, chats, archived: await chatsOn(c, place, section, true),
            mayDelete: who.seat === "super" && grant === "edit", mayEdit: grant === "edit", deliverables: await deliverablesOn(c, place, section),
            /* The rail's "N of M done" under a SWOT chat (§490). */
            swotProgress: section === "analysis" ? await swotProgress(c, chats.map((x: any) => x.id))
              : section === "compete" ? await competeProgress(c, chats.map((x: any) => x.id))
              : section === "directions" || section === "capabilities" ? await dirsProgress(c, chats.map((x: any) => x.id))
              : section === "execution" ? await execProgress(c, chats.map((x: any) => x.id))
              : section === "advisory" ? await advisoryProgress(c, chats.map((x: any) => x.id)) : {} }; }));
    }
    if (first === "chat") {
      const id = q("id");
      if (!UUID.test(id)) return no(400, "Which chat?");
      const got = await withTenant(a.tenantId, async (c) => {
        const chat = await oneChat(c, id);
        if (!chat) return null;
        /* A GUIDED FOUNDATION carries its state and its questions (§465): the
           screen draws the questions the server will draft from (§53.5). */
        const flow = await flowOf(c, id);
        const pw = oneLine(q("placeWord")).slice(0, 120);
        return { ok: true, chat, messages: await messagesOf(c, id), mayDelete: grant === "edit" && mayDeleteChat(chat, who), mayEdit: grant === "edit",
          pending: await pendingFiles(c, id), assumptions: await assumptionsOf(c, id), aiOn: configured(),
          ...(flow ? { flow, flowSteps: FLOW_ELEMENTS, shortAnswer: SHORT_ANSWER, nextVersion: await nextFoundationVersion(c, chat, pw || chat.place), applied: await appliedFoundation(c, chat, pw || chat.place) } : {}),
          ...(chat.section === "analysis" ? await swotView(c, chat, pw) : {}),
          ...(chat.section === "compete" ? await competeView(c, chat) : {}),
          ...(chat.section === "directions" || chat.section === "capabilities" ? await dirsView(c, chat) : {}),
          ...(chat.section === "execution" ? await execView(c, chat) : {}),
          ...(chat.section === "advisory" ? await advisoryView(c, chat) : {}) };
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
    if (first === "sources") {
      const r = await sourcesGet(a.tenantId, q("place"), who);
      return json(r.status, r.body);
    }
    if (first === "source") {
      /* A source comes back as itself, as a download (the file rule above). */
      const r = await sourceFile(a.tenantId, q("id"));
      return r || no(404, "That source is not here any more.");
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
    if (body.act === "flowDraft" || body.act === "flowRefine" || body.act === "flowCheck") {
      const r = await flowAsk(a.tenantId, body, who);
      return json(r.status, r.body);
    }
    if (SWOT_ASKS.includes(String(body.act))) {
      const r = await swotAsk(a.tenantId, body, who);
      return json(r.status, r.body);
    }
    if (COMPETE_ASKS.includes(String(body.act))) {
      const r = await competeAsk(a.tenantId, body, who);
      return json(r.status, r.body);
    }
    if (COMPETE_ACTS.includes(String(body.act))) {
      const r = await withTenant(a.tenantId, (c) => competeAct(c, body, who));
      return json(r.status, r.body);
    }
    if (EXEC_ASKS.includes(String(body.act))) {
      const r = await execAsk(a.tenantId, body, who);
      return json(r.status, r.body);
    }
    if (EXEC_ACTS.includes(String(body.act))) {
      const r = await withTenant(a.tenantId, (c) => execAct(c, body, who));
      return json(r.status, r.body);
    }
    if (DIRS_ASKS.includes(String(body.act))) {
      const r = await dirsAsk(a.tenantId, body, who);
      return json(r.status, r.body);
    }
    if (DIRS_ACTS.includes(String(body.act))) {
      const r = await withTenant(a.tenantId, (c) => dirsAct(c, body, who));
      return json(r.status, r.body);
    }
    if (ADVISORY_ASKS.includes(String(body.act))) {
      const r = await advisoryAsk(a.tenantId, body, who);
      return json(r.status, r.body);
    }
    if (ADVISORY_ACTS.includes(String(body.act))) {
      const r = await withTenant(a.tenantId, (c) => advisoryAct(c, body, who));
      return json(r.status, r.body);
    }
    if (SWOT_ACTS.includes(String(body.act))) {
      const r = await withTenant(a.tenantId, (c) => swotAct(c, body, who));
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
  if (kind === "newFlow") {
    /* A GUIDED FOUNDATION (§465): a Foundation chat that carries a flow. */
    const place = String(b.place || "");
    if (!isPlace(place)) return refused(400, "Which place?");
    const chat = await newChat(c, { place, section: "foundation", title: oneLine(b.title).slice(0, MAX_TITLE) || "Foundation", by });
    /* §478: whether the place already HAS a Foundation only decides which
       question opens the chat — start from it, or the four roads — so the
       page's word is enough; nothing is read or written by it. */
    /* §479: which parts the Structure switches off rides the same word. */
    const flow = newFlow(b.hasPlan === true, cleanSkip(b.skip));
    await writeFlow(c, chat.id, flow);
    return out(200, { ok: true, chat: { ...chat, guided: true }, flow });
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

  if (kind === "saveDraft") {
    /* A draft saved to the Deliverables rail (§472). Judged against the
       STORED message (§42): it must be this chat's and the Copilot's, and
       carry a draft; a draft already saved is not saved twice. */
    const chat = await oneChat(c, id);
    if (!chat) return refused(404, "That chat is not here any more.");
    if (chat.archived) return refused(400, ARCHIVED);
    const r = await saveDraftFrom(c, chat, String(b.messageId || "").replace(/\D/g, "") || "0", by);
    if (r === "notDraft") return refused(400, "That is not a draft in this chat.");
    if (r === "already") return refused(400, "That draft is already saved.");
    return out(200, { ok: true, saved: r, messages: await messagesOf(c, id) });
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

  if (kind === "flowSave" || kind === "flowFinish") {
    const chat = await oneChat(c, id);
    if (!chat) return refused(404, "That chat is not here any more.");
    if (chat.archived) return refused(400, ARCHIVED);
    let stored = await flowOf(c, id);
    if (!stored) return refused(400, "This is not a guided Foundation chat.");
    /* §479: the Structure may have changed since the flow was last written,
       so the finish carries the page's current answer of what is off. */
    if (Array.isArray(b.skip)) stored = { ...stored, skip: cleanSkip(b.skip) };
    /* §517 — a SAVED flow goes on being edited: the cards stay open and the
       next Save makes the next version. The old refusal ("start a new
       guided run") is gone, and so is the break that reopened it. */
    if (kind === "flowSave") {
      const f = sanitizeFlow(b.flow, stored);
      await writeFlow(c, id, f);
      return out(200, { ok: true, flow: f });
    }
    /* SAVED AS A VERSION OF "Foundation — <place>" — only when all five parts
       are agreed, asked of the STORED flow (§42), never of the page. */
    if (!(allAgreed(stored) || brk() === "finish-any")) return refused(400, "Every part needs a draft you have agreed before the Foundation can be saved.");
    /* §517 — the check is an extra step, never the door: nothing here asks
       for `stored.check`. What IS refused is saving the same drafts twice. */
    if (savedCurrent(stored) && brk() !== "save-same-twice") return refused(400, "Nothing has changed since v" + stored.saved!.n + " was saved.");
    const placeWord = oneLine(b.placeWord).slice(0, 120) || chat.place;
    const s = await saveFoundation(c, chat, stored, placeWord, by, cleanPartWords(b.partWords));
    const f: Flow = { ...stored, phase: "saved", saved: { deliverableId: s.deliverableId, n: s.n, title: s.title, drafts: stored.drafts.slice() } };
    await writeFlow(c, id, f);
    return out(200, { ok: true, flow: f, saved: f.saved });
  }

  /* §517 — APPLY TO PLAN, in two acts (§517.1). `applyFoundation` READS:
     it hands the browser the LATEST version's six parts, with the end year
     written in, and records nothing. The browser writes them onto the
     place's Foundation page (the old one archived first, §49.2) through the
     ordinary save, which the authoriser judges (§42) — and only once that
     save has LANDED does it send `foundationApplied`, which writes the note
     *version N is on the plan* on the deliverable's own row (`extra.applied`,
     no migration). §517 wrote the note FIRST, so a save that was refused,
     failed or never left the tab left the deliverable saying "On the plan
     as vN" over a plan that did not hold it (§124: a status claiming more
     than happened). The note now follows the fact. Always the LATEST
     version — the cards' unsaved words never reach the plan (Islam: "the
     plan only changes when we apply to plan"). */
  if (kind === "applyFoundation") {
    const d = await oneDeliverable(c, id);
    if (!d) return refused(404, "That deliverable is not here any more.");
    if (d.type !== "foundation" && brk() !== "apply-any-type") return refused(400, "Only a saved Foundation can be applied to the plan.");
    const cur = (await versionsOf(c, id))[0];
    const body: any = cur && cur.body && typeof cur.body === "object" ? cur.body : {};
    const parts = Array.isArray(body.foundation) ? body.foundation : [];
    if (!parts.length) return refused(400, "This version holds no Foundation parts to apply.");
    const years = Array.isArray(body.years) ? body.years : [null, null];
    /* The break puts §517's order back: the note written on the READ. */
    if (brk() === "stamp-on-read")
      await c.query("UPDATE copilot_deliverables SET extra = extra || jsonb_build_object('applied', $2::jsonb) WHERE id = $1", [id, JSON.stringify({ n: cur.n, at: new Date().toISOString(), by })]);
    /* The stored parts keep their raw {Y}; what goes onto the plan has the
       end year written in, exactly as the version's text does. */
    const filled = parts.map((p: any) => ({ key: String(p.key || ""), name: String(p.name || ""), text: withYear(String(p.text || ""), Number.isInteger(years[1]) ? years[1] : null) }));
    return out(200, { ok: true, n: cur.n, foundation: filled, years });
  }
  /* §517.1 — the note, sent by the browser only after the plan's own save
     came back "saved" (or had nothing left to send). It names the version
     the browser WROTE, so a v4 saved by somebody else in between does not
     get the credit for a v3 that went onto the plan; a version this
     Foundation does not hold, or one with no parts, is refused by name. */
  if (kind === "foundationApplied") {
    const d = await oneDeliverable(c, id);
    if (!d) return refused(404, "That deliverable is not here any more.");
    if (d.type !== "foundation") return refused(400, "Only a saved Foundation can be applied to the plan.");
    const n = Number(b.n);
    const v = (await versionsOf(c, id)).find((x: any) => x.n === n);
    const vb: any = v && v.body && typeof v.body === "object" ? v.body : {};
    if (!v || !Array.isArray(vb.foundation) || !vb.foundation.length) return refused(400, "That version of the Foundation is not here.");
    const applied = { n, at: new Date().toISOString(), by };
    await c.query("UPDATE copilot_deliverables SET extra = extra || jsonb_build_object('applied', $2::jsonb) WHERE id = $1", [id, JSON.stringify(applied)]);
    return out(200, { ok: true, applied });
  }

  if (kind === "editVersion" || kind === "restore") {
    const d = await oneDeliverable(c, id);
    if (!d) return refused(404, "That deliverable is not here any more.");
    if (kind === "editVersion") {
      const text = String(b.text ?? "");
      if (text.length > MAX_MESSAGE) return refused(400, TOO_LONG);
      const cur = (await versionsOf(c, id))[0];
      if (cur && bodyOf(cur.body)?.text === text) return refused(400, "Nothing changed, so no new version was made.");
      /* §518 — a Foundation is its parts, and a plain-text edit would make a
         version holding none, which Apply to plan then refuses. Its parts
         are changed in the chat that built it. */
      if (d.type === "foundation" && brk() !== "text-edit-foundation")
        return refused(400, "A Foundation is changed part by part in its chat, so its parts stay whole for Apply to plan.");
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

  /* "SAVE IT" IS THE PRODUCT'S, NOT THE MODEL'S (§472): a short ask to save
     saves the latest draft at once, with no question to the model — which
     is what kept the page "working" for minutes and then saved nothing. */
  if (!said.files.length && isSaveAsk(text) && brk() !== "save-to-model") {
    await withTenant(tenantId, async (c) => {
      const mid = await latestDraftId(c, id);
      if (!mid) { await recordAnswer(c, id, { body: "There is no draft in this chat to save yet.", part: { kind: "saved" } }); return; }
      const r = await saveDraftFrom(c, chat, mid, by);
      const body = r === "already" ? "That draft is already saved — it is on the left under Deliverables."
        : r === "notDraft" ? "There is no draft in this chat to save yet."
        : "Saved: " + r.title + ", v" + r.n + ". It is on the left under Deliverables.";
      await recordAnswer(c, id, { body, part: { kind: "saved" } });
    });
    return out(200, { ok: true, messages: await withTenant(tenantId, (c) => messagesOf(c, id)),
      assumptions: await withTenant(tenantId, (c) => assumptionsOf(c, id)) });
  }

  /* AN ENHANCEMENT ASKS FIRST, AND THE PRODUCT HOLDS IT TO THAT (§472).
     The instruction already says so and the model did not always follow it:
     a short "enhance it" about something the plan already holds is told,
     on this turn, to quote what exists and ask what to improve — and any
     draft it writes anyway is dropped, so the page never shows one. The
     person's next answer is not held, or the asking would never end. */
  const hasPlan = /THE PLAN AS WRITTEN:\s*\S/.test(String(b.context ?? ""));
  const lastAi = [...material.history].reverse().find((h) => h.from_office);
  const askedBefore = !!(lastAi && /\[asked what to improve\]/.test(lastAi.body));
  const askFirst = hasPlan && !pasted && !said.files.length && isBareEnhance(text) && !askedBefore && brk() !== "no-ask-first";

  const question = (text.trim() || "(sent without words)") +
    (said.files.length ? "\n[attached with this message: " + said.files.map((f) => f.name).join(", ") + "]" : "") +
    (askFirst ? "\n\n[FOR THIS TURN ONLY: the person asked to improve something the plan already holds and did not say what to improve. Quote the existing text from THE PLAN AS WRITTEN word for word in `reply`, ask what they want improved, offer three or four specific improvements as `options`, and leave `draft` empty.]" : "");
  /* What this section is told, read on every question so an edit in Copilot
     settings takes effect on the next message (§456). A database that will
     not answer gives the Copilot no method rather than no answer. */
  const method = configured() && brk() !== "no-method" ? await methodFor(doorPool(), chat.section).catch(() => "") : "";
  const askIn = (q: string) => ({ method, templates: templateNamesFor(chat.section),
    section: chat.section, place: chat.place, placeWord: oneLine(b.placeWord).slice(0, 120),
    context: String(b.context ?? "").slice(0, MAX_CONTEXT), question: q, pasted,
    history: material.history, assumptions: material.assumptions, files: material.files,
  });
  const ask = (q: string) => askCopilot(askIn(q));
  let r = configured() ? await ask(question) : { ok: false as const, noKey: true, why: "no key is set" };
  /* A CHANGE CLAIMED IS A CHANGE SHOWN (§476). Asked to refine, the model
     answered "I've removed the year … press Save under the draft" and sent
     no draft, so the page claimed a change it never showed and offered a
     button that was not there. Such an answer is asked again once, told to
     return the whole revised text as the draft; if it still comes back
     without one, the false claim is replaced by a line saying so. */
  let noDraft = false;
  if (r.ok && !askFirst && !r.part.draft && claimsDraft(r.reply) && brk() !== "trust-claim") {
    const hint = "\n\n[FOR THIS TURN ONLY: your answer said the change was made but returned no draft. Return the whole revised text in `draft` (every item, not only what changed).]";
    if (brk() === "full-retry") {
      const r2 = await ask(question + hint);
      if (r2.ok && r2.part.draft) r = r2; else noDraft = true;
    } else {
      const d = await askDraftOnly(askIn(question + hint));
      if (d.ok) r = { ...r, part: { ...r.part, draft: d.draft } }; else noDraft = true;
    }
  }

  await withTenant(tenantId, async (c) => {
    if (r.ok) {
      const part: any = { ...r.part };
      if (askFirst) { delete part.draft; part.askFirst = true; }
      if (noDraft) part.noDraft = true;
      /* The offer to keep pasted material is attached by the PRODUCT, only
         under a message that really was pasted — never on the model's say. */
      if (pasted || brk() === "offer-always") part.pastedOffer = { messageId: said.messageId, section: r.part.pastedBelongsTo || chat.section };
      if (said.files.length) part.read = said.files.map((f) => f.name);
      await recordAnswer(c, id, { body: noDraft ? NO_DRAFT : r.reply, part, assumptions: r.part.assumptions });
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

/* ── THE GUIDED FOUNDATION'S THREE ASKS (§465) ──────────────────────────
   A draft of one part, a refine of it, and the check across all five. The
   same shape as `sayFlow`: read in one transaction, the model asked with no
   transaction open (§289), the answer written in another, against the flow
   as it stands THEN, so a page that saved meanwhile is not overwritten. */
async function flowAsk(tenantId: string, b: any, who: Who): Promise<Out> {
  const id = String(b.id || "");
  if (!UUID.test(id)) return refused(400, "Which chat?");
  const kind = String(b.act);
  const el = Number(b.el);
  if (kind !== "flowCheck" && !(Number.isInteger(el) && el >= 0 && el < FLOW_ELEMENTS.length)) return refused(400, "Which part?");
  const how = String(b.how ?? "").trim();
  if (kind === "flowRefine" && (!how || how.length > MAX_ANSWER)) return refused(400, "Say what to change.");
  const placeWord = oneLine(b.placeWord).slice(0, 120);
  const context = String(b.context ?? "").slice(0, MAX_CONTEXT);

  const step1 = await withTenant(tenantId, async (c) => {
    const chat = await oneChat(c, id);
    if (!chat) return refused(404, "That chat is not here any more.");
    if (chat.archived) return refused(400, ARCHIVED);
    const stored = await flowOf(c, id);
    if (!stored) return refused(400, "This is not a guided Foundation chat.");
    if (stored.path !== "guided" && brk() !== "flow-any-path") return refused(400, "Choose to answer the guided questions first.");
    /* The answers or the draft as the page has them now ride with the ask,
       checked as any save is, so a correction made a second ago is drafted. */
    const f = b.flow ? sanitizeFlow(b.flow, stored) : stored;
    if (kind === "flowDraft" && !f.ans[el].some((x) => x.trim())) return refused(400, "Answer at least one question first.");
    if (kind === "flowRefine" && !f.drafts[el].trim()) return refused(400, "There is no draft of this part to change yet.");
    if (kind === "flowCheck" && !allAgreed(f)) return refused(400, "Every part needs a draft you have agreed before they can be checked together.");
    if (b.flow) await writeFlow(c, id, f);
    return { chat, f };
  });
  if ("status" in step1) return step1;
  const { chat, f } = step1;

  const method = configured() && brk() !== "no-method" ? await methodFor(doorPool(), "foundation").catch(() => "") : "";
  const question = kind === "flowDraft" ? draftQuestion(f, el) : kind === "flowRefine" ? refineQuestion(f, el, how) : checkQuestion(f);
  const r = await askFlowJson({ instruction: flowInstruction(method), corpus: flowCorpus(f, placeWord || chat.place, context, kind === "flowCheck" ? undefined : el),
    question, schema: kind === "flowCheck" ? CHECK_SCHEMA : TEXT_SCHEMA });
  if (!r.ok) {
    if (!(r as any).noKey) console.error("copilot: flow ask:", r.why);
    return refused(503, (r as any).noKey ? NO_KEY : failedLine(r.why));
  }
  if (kind === "flowCheck") {
    const j = r.json || {};
    const agree = (Array.isArray(j.agree) ? j.agree : []).map((x: unknown) => oneLine(x).slice(0, 400)).filter(Boolean).slice(0, 8);
    const keys = FLOW_ELEMENTS.map((e) => e.key);
    const issues = (Array.isArray(j.issues) ? j.issues : []).map((x: any) => ({ el: keys.includes(String(x && x.element)) ? String(x.element) : "", text: oneLine(x && x.text).slice(0, 400) }))
      .filter((x: any) => x.text).slice(0, 8);
    if (!agree.length && !issues.length) return refused(503, failedLine("the answer had nothing in it"));
    return withTenant(tenantId, async (c) => {
      const now = await flowOf(c, id);
      if (!now) return refused(400, "This is not a guided Foundation chat.");
      const g: Flow = { ...now, phase: "check", check: { agree, issues } };
      await writeFlow(c, id, g);
      return out(200, { ok: true, flow: g });
    });
  }
  const text = String((r.json && r.json.text) ?? "").trim().replace(/^["“]+|["”]+$/g, "").slice(0, MAX_DRAFT);
  if (!text) return refused(503, failedLine("the answer had nothing in it"));
  return withTenant(tenantId, async (c) => {
    const now = await flowOf(c, id);
    if (!now) return refused(400, "This is not a guided Foundation chat.");
    const drafts = now.drafts.slice(); drafts[el] = text;
    const done = now.done.slice(); done[el] = false;
    const from = now.from.slice(); from[el] = false;
    const g: Flow = { ...now, phase: "draft", e: el, drafts, done, from, check: null };
    await writeFlow(c, id, g);
    return out(200, { ok: true, flow: g });
  });
}

/* ── THE PAGE (§456, §501) ─────────────────────────────────────────────
   The list of every chat and deliverable on this client, reached from the
   Copilot tab's own rail. The settings were here until §501 moved them to
   the console; their old addresses redirect there. */
async function pages(a: ServeArgs): Promise<Response> {
  const u = new URL(a.req.url);
  const q = (k: string) => u.searchParams.get(k) || "";
  const bar = await barOf(a.tenantId);
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
    /* THE SETTINGS LIVE ON THE CONSOLE NOW (§501): they are the same for
       every client, so an address under one client was saying something
       untrue. An old bookmark is a door, so it lands where they went (§61). */
    return Response.redirect(new URL("/platform#copilot", a.req.url), 302);
  } catch (e) {
    console.error("copilot: page " + a.rest.join("/") + " " + a.slug + ":", (e as Error).message);
    return html(500, await refusedCopilot(a.slug, a.tenantName, a.have, a.tenantId,
      a.req.method === "POST" ? "That did not save. Nothing was changed — try again." : "This could not be read just now. Nothing has been lost — try again in a moment.", !!a.consultant));
  }
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
