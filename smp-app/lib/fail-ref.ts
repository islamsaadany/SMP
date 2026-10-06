/* A FAILED REQUEST SAYS ENOUGH TO BE TRACED (§502). Islam, of the red
   "Not saved" bar on El Abd: *"you need to write an actual error here so we
   can get back to you to fix it properly."* The bar carried "HTTP 500" and
   nothing else, and the server's own sentence never left the response, so a
   failure on a client's tenant could not be found again.

   Every failure gets a REFERENCE, written to the runtime log beside the full
   stack, and handed to the browser with a description made of NAMES only —
   the database's error code, the table, the column, the constraint. NEVER the
   database's own message (§43: a raw error is a free schema map and can carry
   the values that were being written, which is somebody's data). The log holds
   the rest, found by the reference. */
import { randomBytes } from "node:crypto";

const WORDS: Record<string, string> = {
  "22P02": "a value is not in the shape this field takes",
  "22003": "a number is out of range for this field",
  "22001": "a value is too long for this field",
  "22007": "a date is not in a shape the server reads",
  "23502": "a required field is empty",
  "23503": "a row points at something that is not there",
  "23505": "two rows claim the same identity",
  "23514": "a value breaks one of the table's rules",
  "40001": "two saves met at the same moment",
  "40P01": "two saves met at the same moment",
  "57014": "the database took too long to answer",
  "53300": "the database has too many connections open",
};

const ALPH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function newRef(): string {
  const b = randomBytes(6);
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPH[b[i] % ALPH.length];
  return "SMP-" + s;
}

/* The table a statement wrote, read off its own text — the one place that
   knows it when Postgres does not say (a type error names a type, §316.2). */
export function tableOf(sql: string): string {
  const m = /^\s*(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+("?[\w.]+"?)/i.exec(sql || "");
  return m ? m[1].replace(/"/g, "") : "";
}

/* NAMES ONLY. Every part is a fixed word or an identifier — never text the
   database composed around a value. */
export function describe(e: any): string {
  const code = e && typeof e.code === "string" ? e.code : "";
  const parts: string[] = [];
  if (code && WORDS[code]) parts.push(WORDS[code]);
  else if (code && /^08/.test(code)) parts.push("the connection to the database dropped");
  else if (code) parts.push("the database refused the change");
  else parts.push("the server failed while handling it");
  const table = (e && (e.table || e.smpTable)) || "";
  if (table) parts.push("table " + table);
  if (e && e.column) parts.push("field " + e.column);
  if (e && e.constraint) parts.push("rule " + e.constraint);
  if (code) parts.push("code " + code);
  return parts.join(" · ");
}

export function failRef(where: string, e: unknown): { ref: string; reason: string } {
  const ref = newRef(), reason = describe(e);
  console.error(where + ": " + ref + " — " + reason + "\n", e instanceof Error ? e.stack || e.message : e);
  return { ref, reason };
}
