/* ══ THE COPILOT'S SOURCES (§490, spec 064 — the SWOT flow) ═════════════
   Islam, of the mockup: "per client is better". A source is anything brought
   in for an analysis — a ready report, a filled interview template, a deep
   research answer, a set of guided answers — and it belongs to the CLIENT,
   not to the chat it arrived in, so one brought in for Mobile's SWOT can be
   picked again for Retail's. `place` is the unit it is about, or "all".

   WHO MAY DELETE ONE IS ASKED OF THE STORED ROW (§42): whoever added it, or
   the Super user — never of what the page drew. Everything else here is the
   office's, which the module's own gate already decides on every path. */
import { oneLine } from "./copilot.ts";

type Q = { query: (text: string, values?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }> };
const str = (v: unknown) => (v == null ? "" : String(v));
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : str(v));

export const SOURCE_KINDS = ["guided", "template", "report", "research"] as const;
export type SourceKind = (typeof SOURCE_KINDS)[number];
export const isSourceKind = (v: unknown): v is SourceKind => (SOURCE_KINDS as readonly string[]).includes(String(v));
export const SOURCE_WORD: Record<SourceKind, string> = {
  guided: "Guided answers", template: "Template", report: "Ready report", research: "Deep research",
};
export const MAX_SOURCE_TEXT = 120_000;
export const MAX_SOURCE_NAME = 200;

export type Source = { id: string; place: string; kind: SourceKind; name: string; fileKind: string | null; size: number; by: string; at: string };
const row = (x: any): Source => ({ id: str(x.id), place: str(x.place), kind: x.kind, name: str(x.name),
  fileKind: x.file_kind == null ? null : str(x.file_kind), size: Number(x.size) || 0, by: str(x.by_key), at: iso(x.at) });

/* The shelf for one place: what was brought in for it, and what was brought
   in for every unit. Newest first. */
export async function sourcesFor(c: Q, place: string): Promise<Source[]> {
  const r = await c.query(
    "SELECT id, place, kind, name, file_kind, size, by_key, at FROM copilot_sources WHERE place = $1 OR place = 'all' ORDER BY at DESC, id",
    [place]);
  return r.rows.map(row);
}
export async function oneSource(c: Q, id: string): Promise<Source | null> {
  const r = await c.query("SELECT id, place, kind, name, file_kind, size, by_key, at FROM copilot_sources WHERE id = $1", [id]);
  return r.rows[0] ? row(r.rows[0]) : null;
}
export async function addSource(c: Q, a: { place: string; kind: SourceKind; name: string; fileKind: string | null;
  size: number; bytes: Buffer | null; text: string; by: string }): Promise<Source> {
  const r = await c.query(
    "INSERT INTO copilot_sources (place, kind, name, file_kind, size, bytes, text, by_key) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) " +
    "RETURNING id, place, kind, name, file_kind, size, by_key, at",
    [a.place, a.kind, oneLine(a.name).slice(0, MAX_SOURCE_NAME) || "Untitled", a.fileKind, a.size, a.bytes, a.text.slice(0, MAX_SOURCE_TEXT), a.by]);
  return row(r.rows[0]);
}
export async function retagSource(c: Q, id: string, place: string): Promise<void> {
  await c.query("UPDATE copilot_sources SET place = $2 WHERE id = $1", [id, place]);
}
/* Who may delete: the person who added it, or the Super user. The check's
   break lets anybody, which must turn checks/copilot.mjs red (§94.5). */
export function mayDeleteSource(s: { by: string }, who: { personKey: string | null; seat: string | null }): boolean {
  if (process.env.SMP_BREAK === "source-any-delete") return true;
  return who.seat === "super" || (!!who.personKey && s.by === who.personKey);
}
export async function deleteSource(c: Q, id: string): Promise<void> {
  await c.query("DELETE FROM copilot_sources WHERE id = $1", [id]);
}
export async function sourceBytes(c: Q, id: string): Promise<{ name: string; kind: string | null; bytes: Buffer | null; text: string } | null> {
  const r = await c.query("SELECT name, file_kind, bytes, text FROM copilot_sources WHERE id = $1", [id]);
  const x = r.rows[0];
  return x ? { name: str(x.name), kind: x.file_kind == null ? null : str(x.file_kind), bytes: x.bytes ?? null, text: str(x.text) } : null;
}
/* What the model reads from a set of sources: the text of each, and each PDF
   as itself (a PDF keeps no text, lib/copilot-files.ts). */
export async function sourcesMaterial(c: Q, ids: string[]): Promise<{ id: string; name: string; kind: string; text: string; bytes: Buffer | null; fileKind: string | null }[]> {
  if (!ids.length) return [];
  const r = await c.query("SELECT id, name, kind, file_kind, bytes, text FROM copilot_sources WHERE id = ANY($1::uuid[])", [ids]);
  return r.rows.map((x: any) => ({ id: str(x.id), name: str(x.name), kind: str(x.kind), text: str(x.text), fileKind: x.file_kind == null ? null : str(x.file_kind),
    bytes: x.file_kind === "pdf" ? x.bytes : null }));
}
