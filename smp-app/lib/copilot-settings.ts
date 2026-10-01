/* ══ THE COPILOT'S OWN SETTINGS (§444, spec 064) ═══════════════════════════
   Two things, the same for every client (Islam, 2026-10-01): the method the
   Copilot is told, in fourteen parts filed under its five sections, and five
   blank templates. What ships is lib/copilot-defaults.generated.ts; a row in
   `copilot_assets` is an edit OVER the shipped text, by key. Saving the
   shipped text back DELETES the row rather than storing a copy of it
   (§50.6: a value put back to its default loses its key), so "has this been
   changed?" is always "is there a row?" and never a comparison of two texts.

   WHO MAY CHANGE IT: a Forefront super user — the platform admin flag on the
   account (`users.is_admin`), Islam's answer "forefront superuser only". It
   is not the client's Super user seat, because these settings are not the
   client's: one edit here changes what the Copilot is told on every client.
   The route hands the module `admin` already narrowed for view-as (§383), and
   the module asks it on every write — the page drawing no Edit button is the
   courtesy, the refusal here is the rule (§42).

   A PLATFORM TABLE, read through the door's pool and never inside
   withTenant: it names no client (schema.sql's exclusion list). */
import type { Pool, PoolClient } from "pg";
import { DEFAULT_PARTS, DEFAULT_TEMPLATES } from "./copilot-defaults.generated.ts";

type Q = Pool | PoolClient;
export const SECTION_TITLE: Record<string, string> = {
  foundation: "Foundation", analysis: "Analysis", directions: "Directions", execution: "Execution", advisory: "Advisory",
};
export const SECTION_ORDER = ["foundation", "analysis", "directions", "execution", "advisory"] as const;
export const MAX_PART = 200_000;
export const MAX_TEMPLATE = 3 * 1024 * 1024;

export type Part = { key: string; n: number; title: string; section: string; text: string; edited: boolean; at: string | null };
export type Template = { key: string; name: string; file: string; section: string; use: string; edited: boolean; at: string | null; size: number };

const isPartKey = (k: string) => DEFAULT_PARTS.some((p) => p.key === k);
const isTemplateKey = (k: string) => DEFAULT_TEMPLATES.some((t) => t.key === k);

async function rows(q: Q): Promise<Map<string, { text: string; name: string; bytes: Buffer | null; at: string }>> {
  const r = await q.query("SELECT key, text, name, bytes, updated_at FROM copilot_assets");
  const m = new Map();
  for (const x of r.rows) m.set(x.key, { text: x.text, name: x.name, bytes: x.bytes, at: new Date(x.updated_at).toISOString() });
  return m;
}

export async function partsOf(q: Q): Promise<Part[]> {
  const got = await rows(q);
  return DEFAULT_PARTS.map((p) => {
    const s = got.get(p.key);
    return { key: p.key, n: p.n, title: p.title, section: p.section, text: s ? s.text : p.text, edited: !!s, at: s ? s.at : null };
  });
}

/* What one section is told: every part filed under it, in order, each under
   its own title. Read on every question, so an edit takes effect on the
   next message without anybody restarting anything. */
export async function methodFor(q: Q, section: string): Promise<string> {
  const ps = (await partsOf(q)).filter((p) => p.section === section && p.text.trim());
  return ps.map((p) => "## " + p.title + "\n\n" + p.text.trim()).join("\n\n");
}

export async function templatesOf(q: Q): Promise<Template[]> {
  const got = await rows(q);
  return DEFAULT_TEMPLATES.map((t) => {
    const s = got.get(t.key);
    return { key: t.key, name: t.name, section: t.section, use: t.use, file: s && s.name ? s.name : t.file,
      edited: !!s, at: s ? s.at : null, size: s && s.bytes ? s.bytes.length : Buffer.from(t.data, "base64").length };
  });
}

export async function templateFile(q: Q, key: string): Promise<{ name: string; bytes: Buffer } | null> {
  const t = DEFAULT_TEMPLATES.find((x) => x.key === key);
  if (!t) return null;
  const s = (await rows(q)).get(key);
  if (s && s.bytes) return { name: s.name || t.file, bytes: s.bytes };
  return { name: t.file, bytes: Buffer.from(t.data, "base64") };
}

type Done = { ok: true; changed: boolean } | { ok: false; why: string };

export async function savePart(q: Q, key: string, text: string, by: string | null): Promise<Done> {
  if (!isPartKey(key)) return { ok: false, why: "Which part?" };
  const t = String(text ?? "").replace(/\r\n/g, "\n");
  if (!t.trim()) return { ok: false, why: "A part cannot be empty. Use Put back the shipped text instead." };
  if (t.length > MAX_PART) return { ok: false, why: "That is longer than a part may be." };
  const shipped = DEFAULT_PARTS.find((p) => p.key === key)!.text;
  if (t.trim() === shipped.trim()) return resetAsset(q, key);
  const r = await q.query(
    "INSERT INTO copilot_assets (key, text, updated_by) VALUES ($1, $2, $3) " +
    "ON CONFLICT (key) DO UPDATE SET text = EXCLUDED.text, updated_by = EXCLUDED.updated_by, updated_at = now() " +
    "WHERE copilot_assets.text IS DISTINCT FROM EXCLUDED.text RETURNING key", [key, t, by]);
  return { ok: true, changed: r.rowCount! > 0 };
}

/* An xlsx is a zip, so it starts "PK\x03\x04"; anything else is refused by
   SHAPE rather than by name, because a renamed file is the one a name cannot
   catch (the Copilot reads a filled template as Excel, lib/copilot-files.ts). */
export async function saveTemplate(q: Q, key: string, name: string, bytes: Buffer, by: string | null): Promise<Done> {
  if (!isTemplateKey(key)) return { ok: false, why: "Which template?" };
  const n = String(name || "").replace(/[\\/\r\n]/g, " ").trim().slice(0, 200);
  if (!/\.xlsx$/i.test(n)) return { ok: false, why: "A template is an Excel file (.xlsx)." };
  if (!bytes.length) return { ok: false, why: "That file is empty." };
  if (bytes.length > MAX_TEMPLATE) return { ok: false, why: "A template can be up to 3 MB." };
  if (!(bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04))
    return { ok: false, why: "That is not an Excel file, whatever its name says." };
  await q.query(
    "INSERT INTO copilot_assets (key, name, bytes, updated_by) VALUES ($1, $2, $3, $4) " +
    "ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name, bytes = EXCLUDED.bytes, updated_by = EXCLUDED.updated_by, updated_at = now()",
    [key, n, bytes, by]);
  return { ok: true, changed: true };
}

export async function resetAsset(q: Q, key: string): Promise<Done> {
  if (!isPartKey(key) && !isTemplateKey(key)) return { ok: false, why: "Which part?" };
  const r = await q.query("DELETE FROM copilot_assets WHERE key = $1", [key]);
  return { ok: true, changed: r.rowCount! > 0 };
}

/* What a section's Template road may offer the person, by name (lib/copilot-guidance.ts). */
export function templateNamesFor(section: string): string[] {
  return DEFAULT_TEMPLATES.filter((t) => t.section === section).map((t) => t.name);
}
