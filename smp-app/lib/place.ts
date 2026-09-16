/* ── WHERE A PERSON SITS (spec 046 §4.1, §4.10) ───────────────────────────
   The spine's answer, in one file, because it is a spine fact: the people
   register, the org structure and where each person sits are the CLIENT's and
   no module's (spec 046 §4.1). A module that needs it asks here; a module
   that grew its own copy would be a second answer to a question the register
   already answers, which is the drift §53.5 exists to stop — and this one
   would be worse than most, because the two copies would disagree about who
   may read something.

   THE VOCABULARY IS THE PRODUCT'S OWN AND NOT A NEW ONE. A place is spelt the
   way a ROLE's place has been spelt since §54: a unit's key (`mobile`), or a
   supporting function's with the `fn:` prefix (`fn:finance`). The same
   strings `roleWheres()`, `personAt()` and every `r.at` already use — so a
   list of places stored anywhere in this product reads the same, and nothing
   here has to be translated on the way in or out.

   A PERSON SITS IN EXACTLY ONE PLACE, BY CONSTRUCTION (§130.6, §54):
   `attachPersonAt()` clears all three pointers before writing one, so
   `personAt()` gives ONE answer and so does this. It is deliberately not a
   list — a person with two places would make "may they read this" a question
   with two answers, and the register is what stops that being possible.

   THE COMPANY IS NOT A PLACE HERE, and that is a decision rather than an
   omission (spec 046 §4.10, Islam 2026-09-15). A company is a GROUPING of
   units (§23), so ticking one would be a third thing to keep in step with the
   units under it — and a person attached to a company rather than to a unit
   is at the group for this purpose, which is what `null` means below. */
import type { Pool, PoolClient } from "pg";

type Q = Pool | PoolClient;

/* A unit's key, or `fn:` and a supporting function's. Never a company, never
   `group` — both of those are the ABSENCE of a place for this question. */
export type Place = string;

export type PlaceRow = { at: Place; label: string; kind: "unit" | "fn" };

const str = (v: unknown): string => (v == null ? "" : String(v));

/* THE SUFFIX IS LOAD-BEARING FOR EXACTLY ONE ROW AND IS DRAWN FOR EVERY ONE
   (§65). Raya Trade has a business unit called Care AND a supporting function
   called Care, and the same is true of IT — so a list naming both without
   saying which is which offers two identical entries. Drawn on every function
   rather than on the pair, because a suffix that appears on two rows of eight
   reads as a note about those two and not as a rule. */
export function placeLabel(name: string, kind: "unit" | "fn"): string {
  return kind === "fn" ? name + " (function)" : name;
}

/* EVERY PLACE THIS CLIENT HAS, in the navigation's own order — `idx`, which is
   what Setup writes when the tables are arranged (§261) — so the tick list
   reads down in the same order as the switcher. RETIRED units and functions
   are left out: ticking a place nobody sits in is a rule that can never let
   anybody through, and it is the shape of an exception that quietly means
   nobody (§61 one step round). */
export async function placesFor(c: Q): Promise<PlaceRow[]> {
  const u = await c.query(
    "SELECT key, COALESCE(NULLIF(name,''), key) AS name FROM units WHERE active ORDER BY idx, key");
  const f = await c.query(
    "SELECT key, COALESCE(NULLIF(name,''), key) AS name FROM functions WHERE active ORDER BY idx, key");
  return [
    ...u.rows.map((r: any) => ({ at: str(r.key), label: placeLabel(str(r.name), "unit"), kind: "unit" as const })),
    ...f.rows.map((r: any) => ({ at: "fn:" + str(r.key), label: placeLabel(str(r.name), "fn"), kind: "fn" as const })),
  ];
}

/* WHERE ONE PERSON SITS. Null is a real and common answer — somebody at the
   group, somebody attached to a company rather than a unit, somebody the
   register has not placed yet, or nobody at all — and it is never guessed at
   (§35). What null MEANS for a narrowed report is decided by the caller and
   not here: for the library it means they see the everyone reports and no
   narrowed one, which is stated where that rule lives.

   THE UNIT WINS IF BOTH ARE SOMEHOW SET. It cannot happen through the
   register (§130.6), so this is the answer to a row that arrived some other
   way — an upload, a migration, a hand-edited database — and one answer
   chosen on purpose beats two answers chosen by whichever query ran first. */
export async function placeOf(c: Q, personKey: string | null): Promise<Place | null> {
  if (!personKey) return null;
  const r = await c.query("SELECT unit_key, fn_key FROM people WHERE key = $1", [personKey]);
  if (!r.rows[0]) return null;
  const unit = str(r.rows[0].unit_key), fn = str(r.rows[0].fn_key);
  if (unit) return unit;
  if (fn) return "fn:" + fn;
  return null;
}
