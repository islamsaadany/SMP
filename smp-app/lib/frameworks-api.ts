/* The strategy frameworks library (spec 050) — Forefront's own.
 *
 * A ROUTE OF ITS OWN, for memory-api.ts's reason word for word: platform-api.ts
 * is the frozen endpoint carried across byte for byte, and putting a new
 * feature's actions inside it ends the property that makes a diff against the
 * original possible. Same shape, same `Answer`, one action per request.
 *
 * IT NEVER TOUCHES withTenant. Every row is platform-wide by construction —
 * `frameworks` carries no tenant policy and no tenant column at all
 * (schema.sql) — and that is the feature: the library is the firm's, and a
 * framework is about nobody. The boundary it DOES keep is the one that
 * matters, and it is the door in front of this file: a client's own staff
 * never reach it.
 *
 * READING IS EVERY CONSULTANT'S AND ADDING IS AN ADMIN'S, which is decision 2
 * and the only division this endpoint makes among the people it lets in. It is
 * asked HERE rather than inferred from the page: platform.html loads no rules
 * module in the browser and reads a flag the server computed, so the flag is
 * what draws the button and this is what decides (§42, §48.2).
 */
import type { Pool, PoolClient } from "pg";
import type { SessionUser } from "./auth.ts";
import { DRAFT_FIELDS, askLibrary, draftFramework } from "./frameworks-ask.ts";

type Q = Pool | PoolClient;
export type Answer = { code: number; body: Record<string, unknown> };
const ok = (body: Record<string, unknown>): Answer => ({ code: 200, body: { ok: true, ...body } });
const no = (code: number, error: string): Answer => ({ code, body: { ok: false, error } });

/* THE SAME SENTENCE memory-api.ts and platform-api.ts refuse a client account
   with, deliberately and to the letter (§53.5): two surfaces that refuse the
   same person in two different words tell whoever is probing which is which. */
const NOT_YOURS = "That is not something this account opens.";

const str = (v: unknown): string => (v == null ? "" : String(v));
const oneLine = (v: unknown): string => str(v).replace(/\s*\n\s*/g, " ").trim();

/* WHO MAY ADD ONE, ANSWERED ONCE (decision 2). An admin, and the same test
   decides whether `draft` may be asked for at all — a draft nobody can save is
   a model call spent on a dead end (§61), and it is the expensive half. */
const mayAdd = (me: SessionUser): boolean =>
  process.env.SMP_BREAK === "no-admin-gate" ? true   /* RED: anybody writes the firm's library */
    : me.isAdmin;

const NOT_ADMIN = "Adding to the library is a Forefront admin's.";

/* THE SLUG IS THE NAME, and it is the dataset's own rule rather than a second
   one: lower case, anything that is not a letter or a digit becomes a hyphen,
   runs collapse, ends trimmed — which is exactly what the eighty carry
   (`the-80-20-principle-pareto`). Minted here and UNIQUE in the database, so
   two admins racing on one name is refused by Postgres rather than by whoever
   looked first. */
export function slugFor(name: string): string {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/* The eleven the draft carries, paired with the columns they land in. Named
   once beside DRAFT_FIELDS rather than spelled again in an INSERT, so a
   twelfth field is one edit in each of two files and neither can silently
   drop it (§104.7). */
const COL: Record<string, string> = {
  name: "name", section: "section", purpose: "purpose", keyQuestions: "key_questions",
  whenToUse: "when_to_use", whenNotToUse: "when_not_to_use", inputsRequired: "inputs_required",
  outputs: "outputs", executiveExample: "executive_example",
  consultantUseCase: "consultant_use_case", facilitationTips: "facilitation_tips",
};

/* THE FIVE THAT DECIDE WHETHER THIS IS THE RIGHT TOOL, and the whole reason
   the list carries them: the search runs in the browser (the library is 80
   rows and they are already there), so a round trip per keystroke would be
   slower AND would repaint the box being typed into (§35, §108.13).
   They are the same five the ask sends as its corpus, which is not a
   coincidence worth repeating in two places — it is the toolkit's own search
   weighting, where the name counts for three and an example for one. */
const LIST_COLS = "id, idx, slug, name, section, purpose, key_questions, when_to_use";

function shape(r: Record<string, any>) {
  return {
    id: r.id, slug: r.slug, name: r.name, section: r.section,
    purpose: r.purpose, keyQuestions: r.key_questions, whenToUse: r.when_to_use,
  };
}

function shapeOne(r: Record<string, any>) {
  return {
    ...shape(r),
    whenNotToUse: r.when_not_to_use, inputsRequired: r.inputs_required, outputs: r.outputs,
    executiveExample: r.executive_example, consultantUseCase: r.consultant_use_case,
    facilitationTips: r.facilitation_tips,
    /* ABSENT IS "CAME WITH THE LIBRARY" AND IS NOT A PERSON (§35). The page
       says so in words; it must never fall back to a name. */
    addedBy: r.added_by_name || null,
    when: r.created_at,
  };
}

export async function frameworksAction(pool: Q, me: SessionUser, body: any): Promise<Answer> {
  const action = str(body?.action);

  /* THE ONE GATE THIS ENDPOINT HAS, and it is the memory's: a client's own
     staff never reach Forefront's library. Everything else is open by
     decision 1 — every consultant reads all of it — which is why the check
     asserts the OPENNESS as loudly as the refusal (§94.2): a build that
     quietly gated this would be a library only admins could read. */
  if (me.kind === "client" && process.env.SMP_BREAK !== "client-reads") return no(403, NOT_YOURS);

  if (action === "list") {
    /* ORDERED BY THE BOOK, never alphabetically — `idx` is the dataset's own
       1–80 and the sections come out in the order they teach in. */
    const rows = (await pool.query(
      "SELECT " + LIST_COLS + " FROM frameworks ORDER BY idx")).rows;
    /* THE SECTIONS ARE DERIVED FROM THE ROWS, so there is no second list of
       section names to keep in step (§53.5) — and none to go stale the day
       one is renamed. Ordered by the smallest idx in each, which is where
       that section starts in the book; a framework added later takes the
       highest idx and so moves no section. */
    /* RED: name order, which scrambles a sequence that teaches. */
    const order = process.env.SMP_BREAK === "alphabetical" ? "section" : "min(idx)";
    const sections = (await pool.query(
      "SELECT section, count(*)::int AS n FROM frameworks GROUP BY section ORDER BY " + order)).rows;
    /* WHO MAY ADD IS THE SERVER'S ANSWER, sent with the list and never worked
       out in the browser: platform.html loads no rules module, and a page that
       decided this for itself would be a second answer to drift from this one
       (§42). It draws the button; `save` asks again at press time (§48.2). */
    return ok({ frameworks: rows.map(shape), sections, total: rows.length, canAdd: mayAdd(me) });
  }

  if (action === "one") {
    /* The author is LEFT JOINed because `added_by` is NULL on every framework
       that came with the library, and an INNER join would hide all eighty —
       the silent kind of wrong, because the page would work perfectly for
       anything an admin added later. */
    const r = await pool.query(
      "SELECT f.id, f.idx, f.slug, f.name, f.section, f.purpose, f.key_questions, f.when_to_use, " +
      "       f.when_not_to_use, f.inputs_required, f.outputs, f.executive_example, " +
      "       f.consultant_use_case, f.facilitation_tips, f.added_by, f.created_at, f.updated_at, " +
      "       u.name AS added_by_name " +
      "FROM frameworks f LEFT JOIN users u ON u.id = f.added_by WHERE f.id = $1",
      [str(body.id)]);
    if (!r.rowCount) return no(404, "That framework is no longer here.");
    return ok({ framework: shapeOne(r.rows[0]) });
  }

  /* ASKING IT. Nothing is stored — what was asked and what came back are
     written nowhere, which is the memory's own decision holding here for a
     second reason: the library records what the firm has PUBLISHED, not what
     somebody went looking for. Every consultant may ask (decision 1); what
     the answer says when nothing fits depends on whether this person can do
     anything about it, which is why `canAdd` is handed in. */
  if (action === "ask") {
    const r = await askLibrary(pool, body?.question, mayAdd(me));
    if (!r.ok) return ok({ answered: false, reply: "", sources: [], why: r.why });
    return ok({ answered: r.answered, reply: r.reply, sources: r.sources });
  }

  /* DRAFTING ONE. It writes NOTHING — the whole point of decision 3 is that a
     person reads it before the library gains a row — so this action touches
     no table but the one it reads the sections out of, and the check counts
     the rows before and after to say so (§94.2). */
  if (action === "draft") {
    if (!mayAdd(me)) return no(403, NOT_ADMIN);
    const r = await draftFramework(pool, { name: body?.name, source: body?.source });
    if (!r.ok) return ok({ drafted: false, why: r.why });
    if (!r.known) return ok({ drafted: false, declined: true, why: r.why });
    return ok({ drafted: true, draft: r.draft });
  }

  if (action === "save") {
    /* ASKED AGAIN AT PRESS TIME (§48.2). The flag that drew the button was
       computed when the page was drawn, and a seat can move in between —
       so the answer that matters is this one, taken now. */
    if (!mayAdd(me)) return no(403, NOT_ADMIN);

    const d: Record<string, string> = {};
    for (const f of DRAFT_FIELDS) d[f] = str(body?.draft?.[f]).trim();
    d.name = oneLine(d.name);
    d.section = oneLine(d.section);

    /* THE DATABASE'S OWN CHECK, SAID EARLY AND BY NAME (§184): a constraint
       error names a constraint, and the person needs to be told which box. */
    if (!d.name) return no(400, "Give it a name before saving.");

    /* THE SECTION IS ONE OF THE EIGHT, and that is decision 1 held on the
       SERVER rather than by the picker: the screen offers what exists, and a
       ninth arriving through the endpoint would fragment the list the picker
       is built from — with nothing in the product able to merge two. Refused
       by name, so the answer says what is wrong rather than that something is. */
    const sections: string[] = (await pool.query(
      "SELECT section FROM frameworks GROUP BY section ORDER BY min(idx)")).rows.map((r) => r.section);
    if (!d.section) return no(400, "Say which section it belongs in.");
    if (!sections.includes(d.section)) return no(400, "There is no section called " + d.section + ".");

    const slug = slugFor(d.name);
    /* A NAME OF NOTHING BUT PUNCTUATION slugs to an empty string, which the
       database would take once and refuse for ever after. Refused here, where
       it can be explained. */
    if (!slug) return no(400, "That name gives no address — give it some letters.");

    /* THE COLLISION IS REFUSED BY NAME (§87). Two frameworks can genuinely
       want one address — the same tool under a second author's name — and the
       person needs to know WHICH row is in the way, not that one is. Asked
       here so the sentence is the product's; the UNIQUE index behind it is
       what makes two admins racing on one name safe rather than last-wins. */
    const clash = await pool.query("SELECT name FROM frameworks WHERE slug = $1", [slug]);
    if (clash.rowCount) return no(409, "The library already holds " + clash.rows[0].name + ".");

    const cols = DRAFT_FIELDS.map((f) => COL[f]);
    const marks = DRAFT_FIELDS.map((_, i) => "$" + (i + 3));
    let r;
    try {
      r = await pool.query(
        "INSERT INTO frameworks (slug, added_by, " + cols.join(", ") + ", idx) " +
        "VALUES ($1, $2, " + marks.join(", ") + ", " +
        /* THE END OF THE BOOK, WORKED OUT IN THE INSERT rather than read and
           then written: two admins saving in the same second would otherwise
           both read the same maximum and land on one number, which is not a
           collision Postgres can catch — `idx` is an order, not a key. */
        "(SELECT coalesce(max(idx), 0) + 1 FROM frameworks)) RETURNING id",
        [slug, me.id, ...DRAFT_FIELDS.map((f) => d[f])]);
    } catch (e: any) {
      /* The index is the authority, and this is the race the sentence above
         cannot win: both admins looked, neither saw the other, one INSERT
         lands. Same words, so which of the two paths refused is invisible. */
      if (e && e.code === "23505") {
        const c2 = await pool.query("SELECT name FROM frameworks WHERE slug = $1", [slug]);
        return no(409, "The library already holds " + (c2.rows[0]?.name || d.name) + ".");
      }
      throw e;
    }
    return ok({ id: r.rows[0].id, slug });
  }

  return no(400, "Unknown action.");
}
