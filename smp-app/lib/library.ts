/* ── THE LIBRARY: one machine, two names (spec 053, spec 046 §4.8) ───────
   Insights and Processes are the same catalogue with different content — an
   item with a name, a set of categories, its own date, a version and something
   to open. `kind` is which. Built once and instantiated twice, so Processes is
   a word in one list rather than a second build of this file (§53.5).

   FOREFRONT PUBLISHES, THE CLIENT READS (spec 046 decision #9, confirmed by
   Islam 2026-09-13). Every write here is called from the console
   (lib/platform-api.ts); the client's app calls the reads and nothing else.
   That is not enforced by which functions exist — it is enforced where it has
   to be, at the endpoint (§42, §44) — but it is why the reads take a
   `forClient` flag and the writes do not.

   WHAT IS NOT HERE: the bytes. A file lives in the blob store at `file_path`
   (§261, lib/blob-api.ts), because a serverless function refuses a request
   body over about 4.5MB and a 20MB report cannot arrive in one piece. This
   module holds where it is and never what it says. */
import type { Pool, PoolClient } from "pg";
import type { Place } from "./place.ts";

type Q = Pool | PoolClient;

/* ── THE VOCABULARY ─────────────────────────────────────────────────────
   ONE LIST FOR EVERY CLIENT, for now (spec 053 §7.1, Islam's answer). What
   makes it safe to start fixed is that an item stores the WORDS: giving one
   client their own later reads these same rows and moves no data.

   NO `Other`. The attached file had a sixth called that and it is dropped —
   a report filed under Other is a report nobody finds, and a category meaning
   "not one of the others" is where everything lands once somebody is in a
   hurry. */
/* ── HOW BIG A REPORT MAY BE ────────────────────────────────────────────
   THE PIECE SIZE IS THE ONE THAT IS NOT A PREFERENCE. A serverless function
   refuses a request body over about 4.5MB, so every piece has to sit under
   that with room for the rest of the request — 3MB, the same order §261 slices
   a clip into.

   THE CEILING IS 20MB AND IT IS UNPROVEN, said plainly rather than shipped as
   a fact: it is the attached file's number, and that file records never having
   reached it. Ours will be measured the first time a real report goes up
   through a real store, and this constant is where the measurement lands. */
export const UPLOAD_PIECE_BYTES = 3 * 1024 * 1024;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;

export const CATEGORIES = ["Analysis", "Macro", "Market", "Sector", "Governance"] as const;
export type Category = (typeof CATEGORIES)[number];

/* ── WHO MAY SEE ONE REPORT (spec 046 §4.10, reversing decision 15) ──────
   Decision 15 settled that visibility inside a library is WHOLE MODULE for
   now, and the mockup signed off on 13 September carries that ruling in its
   own notes. Islam, 2026-09-15: *"for some certain reports it might need to
   belong to a function or more not the whole company … the default is all can
   see and the smo can make the exceptions."* Recorded as a reversal rather
   than overwritten (Principle II): whole-module was right for a library with
   one shelf and stopped being right at three sensitive reports in forty.

   ABSENCE IS EVERYONE, AND THAT IS THE WHOLE MODEL (§50.6). A report with no
   list is readable by everybody in the client — including a business unit
   created next month, which is precisely what a list of today's eighteen
   departments with all of them ticked would NOT do. So *All* DELETES the key
   rather than writing every place into it: ticking everything today and
   meaning everyone-for-ever are two different facts, they differ only in the
   future, and nobody would ever connect the missing unit to the tick list
   somebody filled in a year earlier.

   AN EMPTY LIST IS NOBODY, AND IT IS A REAL STATE. `[]` is not the same as
   absent: it is a published report in nobody's library, which is a thing to
   want for an hour while something is staged. Allowed, and MARKED — refusing
   it would be the platform deciding somebody's staging for them, and drawing
   it like any other report would be worse (the console says so on the row and
   on the card).

   IT RIDES `extra`, SO THERE IS NO MIGRATION, and that is claimed nowhere —
   checks/insights.mjs writes one, reads it back, and asserts the table gained
   no column (§172's lesson: four layers once agreed about a value the database
   had never been offered). What it costs is that the filter below is a jsonb
   test rather than an indexed one; at a client's library — tens of reports,
   low hundreds — that is nothing, and the number to revisit it at is written
   beside the query rather than left to be discovered. */
export const SEEN_KEY = "seen";

/* THE STORED LIST IS VALIDATED, DE-DUPLICATED AND SORTED, for `categories`'
   own reasons one field over: the order somebody ticked in must not change
   what is stored, and two reports narrowed to the same three places must be
   byte-identical. `known` is the client's own places (lib/place.ts) — a word
   outside it is DROPPED rather than refused, because a unit retired later
   must not make a report unreadable or a stored row unsaveable, and there is
   no way to type one in by hand.

   NULL OUT MEANS EVERYONE. Undefined in, null in, or a non-array all answer
   null; an array answers an array, empty included. */
export function normalizeSeen(v: unknown, known: readonly string[]): string[] | null {
  if (!Array.isArray(v)) return null;
  const want = new Set(v.filter((x) => typeof x === "string") as string[]);
  return known.filter((k) => want.has(k));
}

/* WHAT THE STORED ROW SAYS, read back. Absent, null, or anything that is not
   an array is everyone — a row hand-edited into a shape nothing writes must
   read as the DEFAULT rather than as nobody (§42 fails closed, and closed
   here is the state that loses nothing). */
export function seenOf(extra: unknown): string[] | null {
  const v = extra && typeof extra === "object" ? (extra as any)[SEEN_KEY] : null;
  return Array.isArray(v) ? v.filter((x) => typeof x === "string") as string[] : null;
}

export const KINDS = ["insights", "processes"] as const;
export type Kind = (typeof KINDS)[number];

export function isCategory(s: unknown): s is Category {
  return typeof s === "string" && (CATEGORIES as readonly string[]).includes(s);
}
export function isKind(s: unknown): s is Kind {
  return typeof s === "string" && (KINDS as readonly string[]).includes(s);
}

/* Validate, de-duplicate, and re-sort into the list's own order, so the order
   somebody clicked cannot change what is stored and two items carrying the
   same two categories are byte-identical. An unknown word is DROPPED rather
   than refused: a category retired later must not make an item unreadable,
   and a typo in a query string is not worth a 400. */
export function normalizeCategories(v: unknown): Category[] {
  const want = new Set<string>((Array.isArray(v) ? v : [v]).filter((x) => typeof x === "string") as string[]);
  return CATEGORIES.filter((c) => want.has(c));
}

const str = (v: unknown): string => (v == null ? "" : String(v));
/* A title is one line however it was pasted (§260's rule, one field over). */
export const oneLine = (v: unknown): string => str(v).replace(/\s+/g, " ").trim();
/* A summary keeps its paragraphs and loses its ends. */
export const trimmed = (v: unknown): string => str(v).replace(/[ \t]+\n/g, "\n").trim();

/* A DATE IS A CALENDAR DAY AND NEVER A MOMENT. `report_date` is a `date`
   column, so what pg hands back is a Date at LOCAL midnight — and taking
   `.toISOString().slice(0,10)` of that turns 1 Aug into 31 July for anybody
   west of Greenwich. Read back off the local parts instead. Absent is null
   and is never today (§35). */
export function calendarDay(v: unknown): string | null {
  const s = str(v).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [, m, d] = s.split("-").map(Number) as [number, number, number];
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return s;
}
export function dayOut(v: unknown): string {
  if (!v) return "";
  if (v instanceof Date) {
    const p = (n: number) => String(n).padStart(2, "0");
    return v.getFullYear() + "-" + p(v.getMonth() + 1) + "-" + p(v.getDate());
  }
  return str(v).slice(0, 10);
}

/* ── THE FILE ───────────────────────────────────────────────────────────
   A PDF IS CHECKED BY ITS FIRST BYTES, never by its name or by what the
   browser said it was (the attached file gets this right, and §52's PNG-only
   decision is why it matters: an uploaded file is executable content until
   something has looked at it). */
export function looksLikePdf(bytes: Uint8Array | null | undefined): boolean {
  if (!bytes || bytes.length < 5) return false;
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 &&
         bytes[3] === 0x46 && bytes[4] === 0x2d;   /* %PDF- */
}

/* Scrubbed before it can reach a Content-Disposition header, because a
   filename in a header is an injection surface. Control characters (CR and LF
   among them, which are the dangerous ones), slashes, quotes and climbing
   runs all go, and something is always returned. */
export function safeFileName(v: unknown): string {
  let s = str(v)
    .replace(/[\x00-\x1f\x7f]/g, "")
    .replace(/[\\/"']/g, "")
    .replace(/\.{2,}/g, ".")
    .trim()
    .slice(0, 120)
    .trim();
  if (!s) s = "report";
  if (!/\.[A-Za-z0-9]{2,5}$/.test(s)) s += ".pdf";
  return s;
}

/* WHERE THE BYTES LIVE, AND THE PATH IS THE PERMISSION (§261's rule, carried
   rather than re-argued): the tenant is IN the path, so an address cannot be
   made to reach across clients even if everything above it were wrong. Every
   segment is scrubbed to a safe alphabet, so nothing typed climbs out of the
   folder it belongs to. */
const seg = (s: unknown, max: number): string =>
  str(s).replace(/[^A-Za-z0-9._:-]/g, "-").slice(0, max);
export function filePath(kind: Kind, tenantId: string, id: string, name?: string): string {
  const ext = (str(name).match(/\.([A-Za-z0-9]{2,5})$/) || [, "pdf"])[1]!.toLowerCase();
  return seg(kind, 12) + "/" + seg(tenantId, 40) + "/" + seg(id, 40) + "." + seg(ext, 5);
}

/* One place turns bytes into the words a screen prints, so a list and a card
   cannot say one file is two different sizes. */
export function sizeLabel(bytes: unknown): string {
  const n = Number(bytes) || 0;
  if (n <= 0) return "";
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(n < 10 * 1024 ? 1 : 0) + " KB";
  return (n / (1024 * 1024)).toFixed(n < 10 * 1024 * 1024 ? 1 : 0) + " MB";
}

/* ── READING ────────────────────────────────────────────────────────────
   THE CLIENT'S READ CARRIES `state = 'published'` IN THE **WHERE**, never in
   a filter afterwards and never in the screen: a withdrawn report's id must
   answer "not found" rather than "not allowed", so a reader is never told a
   record exists (spec 053 §4.8). Every read path — the list, one item, and
   the file — goes through this one function, or the three would have to agree
   by being written the same way three times (§53.5). */
export function shelfWhere(forClient: boolean): string {
  /* THE CHECK'S BREAK (constitution XVI, lib/modules.ts's own shape): a build
     that stopped hiding drafts from a client must turn checks/insights.mjs red
     before its green run is believed (§94.5). Never set on a deployment. */
  if (brk() === "client-sees-drafts") return "";
  return forClient ? " AND state = 'published'" : "";
}

/* WHO IS READING, AND IT GOES IN THE **WHERE** FOR `shelfWhere`'s OWN REASON
   (spec 046 §4.10): a narrowed report's id must answer *not found* rather than
   *not allowed*, so a reader is never told a record exists that they may not
   open. Filtering afterwards, or on the screen, would give the two states two
   different answers and one of them would be a disclosure.

   THE OFFICE READS EVERYTHING. Whoever holds this client's **Super user** or
   **SMO team** seat sees every report whatever its list says — written against
   the SEAT, because the seat is what the platform holds and who employs
   somebody is not a thing it knows (`tenant_users.seat`; schema.sql's own
   note: a consultant on three clients and a client user on one are the same
   shape). Islam, 2026-09-15: *"there is no client smo for the client it's
   always the smo which is us"* — so the office reading everything is us
   reading what we published.

   SOMEBODY WITH NO PLACE SEES THE EVERYONE REPORTS AND NO NARROWED ONE, and
   that is the honest answer rather than a generous one: the register has not
   said where they work, so there is nothing to match, and a null that matched
   everything would make an unplaced row the widest grant in the product.

   THE PARAMETER IS THE VIEWER'S ONE PLACE (lib/place.ts — a person sits in
   exactly one, §130.6), so this takes one value and never a list.

   THE CLAUSE AND ITS ARGUMENT ARE ONE ANSWER, and that is not tidiness. The
   first build had the caller push the value and this decide the clause, with
   a comment telling the next person to keep the placeholder number in step —
   and the `everyone-sees-everything` break promptly desynchronised them, so
   the falsification came back **0 red** with a parameter-count error swallowed
   by the run's own catch (§54.5: a green falsification is indistinguishable
   from a working guard, and §215: it died rather than reporting). Two things
   that must agree, returned together, cannot.

   SCALE, SAID RATHER THAN DISCOVERED: `extra` is jsonb and this test is not
   covered by `library_items_shelf`, so it is a filter over the rows the index
   already narrowed to one kind and one state. At a client's library that is
   tens of rows. The number to revisit it at is a client whose shelf passes a
   few thousand reports, and the answer then is a column and an index, which
   `normalizeSeen`'s canonical shape is what makes cheap. */
export function seenSql(forClient: boolean, viewer: Viewer | undefined, nextArg: number): { clause: string; args: unknown[] } {
  const none = { clause: "", args: [] as unknown[] };
  const v = viewer || NOBODY_SEES_ALL;
  if (!forClient || v.seesAll) return none;
  /* The break for this half: a build that stopped narrowing at all. It renders
     perfectly and every other assertion about the library passes with it
     (§96), which is why the check DRIVES two viewers rather than reading one. */
  if (brk() === "everyone-sees-everything") return none;
  if (!v.place) return { clause: " AND NOT (extra ? '" + SEEN_KEY + "')", args: [] };
  return {
    clause: " AND (NOT (extra ? '" + SEEN_KEY + "') OR extra->'" + SEEN_KEY + "' @> $" + nextArg + "::jsonb)",
    args: [JSON.stringify([v.place])],
  };
}

/* WHO IS ASKING, AS ONE VALUE, so the three read paths cannot be handed
   different halves of it (§53.5). `seesAll` is the seat and is decided by the
   caller, never here — this module knows about a library and nothing about
   doors. */
export type Viewer = { place: Place | null; seesAll: boolean };
export const NOBODY_SEES_ALL: Viewer = { place: null, seesAll: false };
const brk = (): string => (typeof process !== "undefined" ? process.env.SMP_BREAK || "" : "");

const COLS =
  "id, kind, title, summary, categories, report_date, state, version, " +
  "file_path, file_name, file_size, downloads, published_at, published_by, created_at, updated_at, extra";

export type Item = {
  id: string; kind: Kind; title: string; summary: string; categories: Category[];
  reportDate: string; version: number;
  fileName: string; fileSize: number; sizeLabel: string; hasFile: boolean;
};
export type OfficeItem = Item & {
  state: string; downloads: number; publishedAt: string; publishedBy: string; filePath: string;
  /* null is everyone; an array is exactly those places; [] is nobody. */
  seen: string[] | null;
  /* The WORDS for that list, built here so the console's list and its card
     cannot describe one report's reach two ways (§53.5) and the browser has
     no second spelling of "3 departments" to keep in step. Empty string is
     everyone, which is what draws no mark at all. */
  seenLabel: string;
};

/* WHAT A CLIENT RECEIVES AND WHAT THE CONSOLE RECEIVES DIFFER BY WHOLE KEYS,
   never by a null: `filePath: null` would still tell a reader the field
   exists, and `downloads` on a client's screen is a number nobody there can
   act on. ONE serializer with a flag, because two would drift the first time
   a column was added (§53.5) — and this is the one thing the attached file's
   permissions layer gets exactly right, so it is kept. */
export function shape(r: Record<string, any>, forClient: boolean): Item | OfficeItem {
  const base: Item = {
    id: str(r.id),
    kind: isKind(r.kind) ? r.kind : "insights",
    title: str(r.title),
    summary: str(r.summary),
    categories: normalizeCategories(r.categories),
    reportDate: dayOut(r.report_date),
    version: Number(r.version) || 1,
    fileName: str(r.file_name),
    fileSize: Number(r.file_size) || 0,
    sizeLabel: sizeLabel(r.file_size),
    hasFile: !!str(r.file_path),
  };
  /* The break for the other half: a build that handed a client the file's
     path, its state and how it has done. */
  if (forClient && brk() !== "leak-file-path") return base;
  return {
    ...base,
    state: str(r.state),
    downloads: Number(r.downloads) || 0,
    publishedAt: r.published_at ? new Date(r.published_at).toISOString() : "",
    publishedBy: str(r.published_by),
    filePath: str(r.file_path),
    /* WHO MAY SEE IT IS THE CONSOLE'S TOO, for the same reason the file's path
       is: a client has already been filtered by it (seenWhere), so handing
       them the list would say which OTHER departments exist on a report they
       can read, and nobody there can act on it. */
    seen: seenOf(r.extra),
    seenLabel: seenLabel(seenOf(r.extra)),
  };
}

export type ListQuery = {
  kind: Kind; forClient: boolean; q?: string; category?: string; state?: string;
  /* Omitted on the console's read, where `forClient` is false and seenWhere
     answers nothing. A client's read that forgot it would be the whole shelf,
     so the three call sites are asserted rather than trusted. */
  viewer?: Viewer;
};

/* ONE ORDER AND NO SORT CONTROL (spec 053): newest report first by the
   report's OWN date, with undated items last rather than leading the shelf,
   then by when it arrived, then by id — so the order is total and no page can
   show one row twice. */
const ORDER = " ORDER BY report_date DESC NULLS LAST, created_at DESC, id DESC";

export async function listItems(c: Q, qy: ListQuery): Promise<any[]> {
  const args: unknown[] = [qy.kind];
  let sql = "SELECT " + COLS + " FROM library_items WHERE kind = $1" + shelfWhere(qy.forClient);
  /* BEFORE THE SEARCH AND THE CATEGORY, which append their own after it. */
  const seen = seenSql(qy.forClient, qy.viewer, args.length + 1);
  args.push(...seen.args);
  sql += seen.clause;
  const cat = normalizeCategories(qy.category)[0];
  if (cat) { args.push(JSON.stringify([cat])); sql += " AND categories @> $" + args.length + "::jsonb"; }
  const q = oneLine(qy.q);
  if (q) {
    args.push("%" + q.replace(/[%_\\]/g, "\\$&") + "%");
    sql += " AND (title ILIKE $" + args.length + " OR summary ILIKE $" + args.length + ")";
  }
  /* A state filter is the console's alone. Asked for in a client's request it
     is IGNORED rather than refused — it could only ever narrow what
     `shelfWhere` already decided, and must never widen it (§42). */
  if (!qy.forClient && (qy.state === "draft" || qy.state === "published")) {
    args.push(qy.state); sql += " AND state = $" + args.length;
  }
  return (await c.query(sql + ORDER, args)).rows;
}

export async function oneItem(c: Q, kind: Kind, id: string, forClient: boolean, viewer?: Viewer): Promise<any | null> {
  const args: unknown[] = [kind, id];
  const seen = seenSql(forClient, viewer, args.length + 1);
  args.push(...seen.args);
  const r = await c.query(
    "SELECT " + COLS + " FROM library_items WHERE kind = $1 AND id = $2" +
    shelfWhere(forClient) + seen.clause, args);
  return r.rows[0] || null;
}

/* ── WRITING ────────────────────────────────────────────────────────────
   AN ITEM IS BORN A DRAFT, so nothing reaches a client's library by being
   saved. */
export type Draft = { title: string; summary: string; categories: Category[]; reportDate: string | null };

export function draftOf(d: any): Draft {
  return {
    title: oneLine(d && d.title).slice(0, 200),
    summary: trimmed(d && d.summary).slice(0, 1000),
    categories: normalizeCategories(d && d.categories),
    reportDate: calendarDay(d && d.reportDate),
  };
}

export async function insertItem(c: Q, kind: Kind, d: Draft): Promise<any> {
  const r = await c.query(
    "INSERT INTO library_items (kind, title, summary, categories, report_date) " +
    "VALUES ($1, $2, $3, $4::jsonb, $5) RETURNING " + COLS,
    [kind, d.title, d.summary, JSON.stringify(d.categories), d.reportDate]);
  return r.rows[0];
}

export async function updateItem(c: Q, id: string, d: Draft): Promise<any | null> {
  const r = await c.query(
    "UPDATE library_items SET title = $2, summary = $3, categories = $4::jsonb, report_date = $5, " +
    "updated_at = now() WHERE id = $1 RETURNING " + COLS,
    [id, d.title, d.summary, JSON.stringify(d.categories), d.reportDate]);
  return r.rows[0] || null;
}

/* REPLACING THE FILE KEEPS THE ID, THE ADDRESS, THE CATEGORIES AND THE COUNT,
   and moves the version by one — the semantics are "a new edition of the same
   report" (spec 053 §4.6). The FIRST file is not an edition: an item with no
   file yet becomes v1 rather than v2, which is why the CASE reads the stored
   path rather than counting writes. The version moves HERE and nowhere else,
   so the number means one thing. */
export async function setFile(c: Q, id: string, path: string, name: string, size: number): Promise<any | null> {
  const r = await c.query(
    "UPDATE library_items SET file_path = $2, file_name = $3, file_size = $4, " +
    (brk() === "version-always"
      ? "version = version + 1, "
      : "version = CASE WHEN file_path = '' THEN version ELSE version + 1 END, ") +
    "updated_at = now() WHERE id = $1 RETURNING " + COLS,
    [id, path, safeFileName(name), Math.max(0, Number(size) || 0)]);
  return r.rows[0] || null;
}

/* WHO MAY SEE IT, WRITTEN. `null` DELETES the key rather than storing it, so
   everyone-for-ever and a list of today's places are two different rows and
   not one row spelt two ways (§50.6) — which is also what makes *All* honest:
   pressing it hands the report back to a department created next month.

   AN EMPTY ARRAY IS STORED. `[]` is nobody, deliberately, and is the one case
   where absent and empty must not collapse.

   IT IS ITS OWN STATEMENT AND NOT PART OF `updateItem`, because narrowing a
   report is not editing its words: the console sends it on its own, the
   authoriser can name it on its own, and a card that saved the title and the
   visibility together would make correcting a typo re-assert who may read it. */
export async function setSeen(c: Q, id: string, seen: string[] | null): Promise<any | null> {
  const r = await c.query(
    seen === null
      ? "UPDATE library_items SET extra = COALESCE(extra,'{}'::jsonb) - '" + SEEN_KEY + "', " +
        "updated_at = now() WHERE id = $1 RETURNING " + COLS
      : "UPDATE library_items SET extra = jsonb_set(COALESCE(extra,'{}'::jsonb), '{" + SEEN_KEY + "}', $2::jsonb), " +
        "updated_at = now() WHERE id = $1 RETURNING " + COLS,
    seen === null ? [id] : [id, JSON.stringify(seen)]);
  return r.rows[0] || null;
}

/* `published_at` IS STAMPED ONCE AND NEVER REWRITTEN, so withdrawing and
   republishing does not move a report's place in history — COALESCE in the
   statement rather than a read-then-write two presses could race. */
export async function setState(c: Q, id: string, state: "draft" | "published", who: string): Promise<any | null> {
  const r = await c.query(
    "UPDATE library_items SET state = $2, updated_at = now(), " +
    "published_at = CASE WHEN $2 = 'published' THEN COALESCE(published_at, now()) ELSE published_at END, " +
    "published_by = CASE WHEN $2 = 'published' AND published_by = '' THEN $3 ELSE published_by END " +
    "WHERE id = $1 RETURNING " + COLS, [id, state, str(who)]);
  return r.rows[0] || null;
}

/* Returns the path of the file that is now unreferenced, so the caller can
   take it out of the store. The row goes either way: a blob the store no
   longer holds is not a reason to keep a row nobody can open (§62's shape —
   the refusal is the feature, and a missing file is not a refusal). */
export async function deleteItem(c: Q, id: string): Promise<string> {
  const r = await c.query("DELETE FROM library_items WHERE id = $1 RETURNING file_path", [id]);
  return r.rows[0] ? str(r.rows[0].file_path) : "";
}

/* COUNTED ON THE SERVER, at the moment the address is minted, and never in
   the browser — the attached file increments its own display on a click that
   may have 404'd (its §10.7). One statement, so two people downloading in the
   same second cannot lose a count; and `state = 'published'` again, so a
   withdrawn report cannot be counted even if something above reached it. */
export async function countDownload(c: Q, id: string): Promise<void> {
  await c.query("UPDATE library_items SET downloads = downloads + 1 WHERE id = $1 AND state = 'published'", [id]);
}

/* WHAT THE CONSOLE PRINTS ON A ROW, in one place, so the list and the card
   cannot describe one report's reach two ways (§53.5). Never the names —
   the row has no width for three of them without wrapping onto a second line,
   which is the one thing a list like this may not do (§88) — so it says how
   many and the card says which. */
export function seenLabel(seen: string[] | null): string {
  if (seen === null) return "";
  if (!seen.length) return "Nobody";
  return seen.length + (seen.length === 1 ? " department" : " departments");
}
