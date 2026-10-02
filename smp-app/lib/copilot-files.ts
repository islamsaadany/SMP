/* ══ A FILE IN A COPILOT CHAT (spec 064 stage 2, plan §7.3) ══════════════
   Islam: "Upload Word, PDF and Excel now." A file belongs to its chat — there
   is no library (decisions v0.4 §7) — and what the AI takes from it is named
   with the file's name, the same discipline as pasted material.

   THREE KINDS AND NO OTHERS, READ THREE WAYS:
     · PDF   — handed to the model AS a document. It reads PDFs itself, and a
               text extraction here would lose every table and chart it can see.
     · Word  — a .docx is a zip; the words are in word/document.xml.
     · Excel — a .xlsx is a zip; the cells are the sheets plus the shared
               strings. Each sheet is written out as rows, tab-separated.
   The old binary .doc and .xls are refused in words rather than guessed at
   (§96.2): what cannot be read must never arrive as an empty file the model
   then answers about.

   NO DEPENDENCY. A zip's central directory and `inflateRaw` are all a .docx or
   .xlsx needs, so the reader is below rather than a package in the lockfile
   (§72's reasoning: one small, testable piece of our own over a library for
   something this narrow).

   THE CAP IS THE BODY THE PLATFORM CAN RECEIVE: a function refuses a request
   over 4.5MB, the file travels base64-encoded (4/3 larger), so 3MB is the most
   that can arrive at all. Said at the paperclip, before the upload. */
import { inflateRawSync } from "node:zlib";

export const MAX_FILE_BYTES = 3 * 1024 * 1024;
export const MAX_FILES_PER_MESSAGE = 3;
/* What is handed to the model from one Word or Excel file. About thirty pages,
   the paste limit (plan §7.2), so a file cannot carry more than a paste can. */
export const MAX_FILE_TEXT = 120_000;

export type FileKind = "pdf" | "docx" | "xlsx";
export const KIND_WORD: Record<FileKind, string> = { pdf: "PDF", docx: "Word", xlsx: "Excel" };

export function kindOf(name: string, type: string): FileKind | null {
  const n = name.toLowerCase(), t = type.toLowerCase();
  if (n.endsWith(".pdf") || t === "application/pdf") return "pdf";
  if (n.endsWith(".docx") || t.includes("wordprocessingml")) return "docx";
  if (n.endsWith(".xlsx") || t.includes("spreadsheetml")) return "xlsx";
  return null;
}

export const REFUSE_KIND = "The Copilot reads Word (.docx), PDF and Excel (.xlsx) files. Save it as one of those and attach it again.";
export const REFUSE_SIZE = "That file is larger than 3 MB, so it was not attached. Split it, or paste the part that matters.";

/* ── the zip ─────────────────────────────────────────────────────────── */
function entries(buf: Buffer): Map<string, Buffer> {
  /* The end-of-central-directory record is in the last 64KB + 22 bytes. */
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("not a zip");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = new Map<string, Buffer>();
  for (let k = 0; k < count; k++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("bad central directory");
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nlen = buf.readUInt16LE(p + 28), xlen = buf.readUInt16LE(p + 30), clen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nlen);
    p += 46 + nlen + xlen + clen;
    /* only the parts we read are inflated */
    if (!/^(word\/document\.xml|xl\/sharedStrings\.xml|xl\/workbook\.xml|xl\/worksheets\/sheet\d+\.xml)$/.test(name)) continue;
    const lnlen = buf.readUInt16LE(local + 26), lxlen = buf.readUInt16LE(local + 28);
    const start = local + 30 + lnlen + lxlen;
    const raw = buf.subarray(start, start + csize);
    if (method === 0) out.set(name, Buffer.from(raw));
    else if (method === 8) out.set(name, inflateRawSync(raw));
  }
  return out;
}

const XML_ENT: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
export function unxml(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_m, e: string) => {
    if (e[0] === "#") return String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return XML_ENT[e.toLowerCase()] ?? _m;
  });
}

/* Word: a paragraph per <w:p>, a tab per <w:tab/>, a table cell ends in a tab. */
export function docxText(buf: Buffer): string {
  const doc = entries(buf).get("word/document.xml");
  if (!doc) throw new Error("no document.xml");
  const xml = doc.toString("utf8");
  const paras: string[] = [];
  for (const m of xml.matchAll(/<w:p[\s>][\s\S]*?<\/w:p>|<w:p\/>/g)) {
    const p = m[0]
      .replace(/<w:tab\/>/g, "\t").replace(/<w:br\/>/g, "\n")
      .replace(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g, (_x, t) => "\u0000" + t + "\u0001")
      .replace(/<[^>]+>/g, "");
    const txt = p.replace(/[^\u0000\u0001]*\u0000([^\u0001]*)\u0001/g, "$1");
    paras.push(unxml(txt.replace(/[\u0000\u0001]/g, "")));
  }
  return paras.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/* Excel: every sheet by name, each row tab-separated, shared strings resolved. */
export function xlsxText(buf: Buffer): string {
  const z = entries(buf);
  const shared: string[] = [];
  const ss = z.get("xl/sharedStrings.xml");
  if (ss) for (const m of ss.toString("utf8").matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    shared.push(unxml([...m[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join("")));
  }
  const names: string[] = [];
  const wb = z.get("xl/workbook.xml");
  if (wb) for (const m of wb.toString("utf8").matchAll(/<sheet\b[^>]*\bname="([^"]*)"/g)) names.push(unxml(m[1]));
  const sheets = [...z.keys()].filter((k) => k.startsWith("xl/worksheets/"))
    .sort((a, b) => Number(a.match(/(\d+)/)![1]) - Number(b.match(/(\d+)/)![1]));
  const out: string[] = [];
  sheets.forEach((k, i) => {
    const rows: string[] = [];
    for (const r of z.get(k)!.toString("utf8").matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
      const cells: string[] = [];
      for (const c of r[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const attrs = c[1], inner = c[2] || "";
        const t = (attrs.match(/\bt="([^"]*)"/) || [])[1] || "";
        const v = (inner.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
        const is = (inner.match(/<is>([\s\S]*?)<\/is>/) || [])[1];
        let val = "";
        if (t === "s" && v != null) val = shared[Number(v)] ?? "";
        else if (t === "inlineStr" && is) val = unxml([...is.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join(""));
        else if (v != null) val = unxml(v);
        cells.push(val.replace(/\s+/g, " ").trim());
      }
      while (cells.length && !cells[cells.length - 1]) cells.pop();
      if (cells.length) rows.push(cells.join("\t"));
    }
    out.push("## Sheet: " + (names[i] || "Sheet " + (i + 1)) + "\n" + rows.join("\n"));
  });
  return out.join("\n\n").trim();
}

/* What the file says, as text, for Word and Excel — or a refusal in words. A
   PDF has no text here: it goes to the model as itself. */
export function readFile(kind: FileKind, buf: Buffer): { ok: true; text: string } | { ok: false; why: string } {
  if (kind === "pdf") {
    if (buf.subarray(0, 5).toString("latin1") !== "%PDF-") return { ok: false, why: "That file says it is a PDF and is not one." };
    return { ok: true, text: "" };
  }
  try {
    const text = kind === "docx" ? docxText(buf) : xlsxText(buf);
    if (!text) return { ok: false, why: "That file has no words in it the Copilot can read." };
    return { ok: true, text: text.length > MAX_FILE_TEXT ? text.slice(0, MAX_FILE_TEXT) : text };
  } catch {
    return { ok: false, why: "That " + KIND_WORD[kind] + " file could not be opened. Save it again and attach the new copy." };
  }
}

export function sizeWord(n: number): string {
  if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(1).replace(/\.0$/, "") + " MB";
  return Math.max(1, Math.round(n / 1024)) + " KB";
}
