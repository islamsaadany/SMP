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
import type { Rules } from "./shared-types.ts";

const need = createRequire(import.meta.url);
const R = need("./rules.cjs") as Rules;

type Q = { query: Pool["query"] | PoolClient["query"] };
const str = (v: unknown) => (v == null ? "" : String(v));
const brk = () => (typeof process !== "undefined" ? process.env.SMP_BREAK || "" : "");

export type Person = { key: string; name: string };

/* ── THE REGISTER'S NAME, NEVER ITS FULL NAME (§565) ────────────────────
   Islam: *"the names in the tracker should follow the name not the official
   name"*, and Notes and Portfolio with it. The register has carried two
   names since §93.8: **Full Name** is the employee file's, and **Name** is
   what the office calls somebody — what the SMO typed (`extra.known`), else
   the first two names. Every module printed the FULL one, so a Name typed on
   the register reached nothing outside it.

   THE REGISTER'S OWN RULE, the frozen `displayNames()` beside `knownName()`
   in public/shell.js: a typed Name wins and is never lengthened; an untyped
   one is the guess, and a clashing guess is lengthened one name at a time for
   the whole clash together. Worked over EVERY row, retired ones included,
   because that is what the register's column is worked over — a module that
   read only the active rows would print a shorter name than the register
   shows for the very pair the lengthening exists to separate. */
export function registerNames(people: readonly (Person & { known?: unknown })[]): Map<string, string> {
  const out = new Map<string, string>(), full = new Map<string, string>(), seen = new Map<string, string[]>();
  for (const p of people) {
    const typed = str(p.known).trim();
    if (typed) { out.set(p.key, typed); continue; }
    const label = R.knownGuess(p.name) || p.name;
    out.set(p.key, label);
    full.set(p.key, p.name);
    seen.set(label.toLowerCase(), (seen.get(label.toLowerCase()) || []).concat(p.key));
  }
  for (const keys of seen.values()) {
    if (keys.length < 2) continue;
    let n = R.KNOWN_NAME_WORDS, same = true;
    while (same && n < 8) {
      n++;
      const got = new Set<string>();
      same = false;
      for (const k of keys) {
        const lab = R.nameWords(full.get(k), n).toLowerCase();
        if (got.has(lab)) same = true;
        got.add(lab);
      }
    }
    for (const k of keys) out.set(k, R.nameWords(full.get(k), n) || full.get(k) || k);
  }
  return out;
}

/* Every key on this register and the NAME it carries (above) — the key
   itself where the full name is blank, so a row never prints nothing at all
   (§35). */
export async function namesOf(c: Q): Promise<Map<string, string>> {
  const r = await c.query("SELECT key, COALESCE(NULLIF(name, ''), key) AS name, extra->>'known' AS known FROM people ORDER BY idx, key");
  if (brk() === "full-names")   /* §565 put back: the employee file's name */
    return new Map((r.rows as Record<string, unknown>[]).map((x) => [str(x.key), str(x.name)]));
  return registerNames((r.rows as Record<string, unknown>[]).map((x) => ({ key: str(x.key), name: str(x.name), known: x.known })));
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
   Name and the short one off it. `full` keeps its old word for its callers;
   since §565 it holds the register's Name, never the employee file's. */
export async function readNames(c: Q): Promise<{ full: Map<string, string>; short: Map<string, string> }> {
  const full = await namesOf(c);
  const short = shortNames(Array.from(full, ([key, name]) => ({ key, name })));
  return { full, short };
}
