/* ── WHAT A PERSON IS CALLED, FOR EVERY MODULE THAT PRINTS A NAME ──────────
   The register is the CLIENT's and no module's (spec 046 §4.1), which is
   `lib/place.ts`'s own argument for *where* somebody sits; this is the same
   argument for *what they are called*. It was the Internal Tracker's
   (lib/tracker.ts), `lib/notes.ts` borrowed it, and Portfolio is the third —
   the point `lib/notes.ts`'s own note names as the day they move out.

   A NAME IS READ AT DRAW TIME AND NEVER STORED BESIDE A KEY (§48, §130.9):
   a row keeps the person's KEY, and what it prints is whatever the register
   says today — so renaming somebody on the register renames them everywhere,
   and a row cannot go on naming a spelling the register has corrected.

   THE SHORT FORM IS THE REGISTER'S OWN RULE (§130.7, §81.1), not a `split(" ")`
   — first name where that is unambiguous, two names where it is not, and the
   whole name where even that clashes. `nameWords` is the frozen product's, so
   a compound first name stays whole (*Abd El Moniem*, never *Abd*) and the
   platform prints one spelling of a person wherever it prints them. */
import { createRequire } from "node:module";
import type { Pool, PoolClient } from "pg";

const need = createRequire(import.meta.url);
const R = need("./rules.cjs");

type Q = { query: Pool["query"] | PoolClient["query"] };
const str = (v: unknown) => (v == null ? "" : String(v));

export type Person = { key: string; name: string };

/* Every key on this register and the name it carries — the key itself where
   the name is blank, so a row never prints nothing at all (§35). */
export async function namesOf(c: Q): Promise<Map<string, string>> {
  const r = await c.query("SELECT key, COALESCE(NULLIF(name, ''), key) AS name FROM people");
  return new Map((r.rows as Record<string, unknown>[]).map((x) => [str(x.key), str(x.name)]));
}

/* THE SHORTEST FORM THAT STILL TELLS TWO PEOPLE APART. A clashing pair is
   LENGTHENED rather than left reading as one person (§81.1) — which on a plan
   is what stops two rows looking like one person's work. */
export function shortNames(people: readonly Person[]): Map<string, string> {
  const out = new Map<string, string>();
  const at = (n: number) => people.map((p) => R.nameWords(p.name, n) || p.name);
  const one = at(1), two = at(2);
  const dup = (arr: string[], i: number) => arr.some((x, j) => j !== i && x.toLowerCase() === arr[i].toLowerCase());
  people.forEach((p, i) => {
    out.set(p.key, !dup(one, i) ? one[i] : !dup(two, i) ? two[i] : p.name);
  });
  return out;
}

/* The pair a screen actually wants: read the register once, and get both the
   full name and the short one off it. */
export async function readNames(c: Q): Promise<{ full: Map<string, string>; short: Map<string, string> }> {
  const full = await namesOf(c);
  const short = shortNames(Array.from(full, ([key, name]) => ({ key, name })));
  return { full, short };
}
