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
 * PHASE A IS READ-ONLY. `draft` and `save` are phase B and are deliberately
 * not stubbed here — an action that exists and refuses everything is a control
 * with nothing behind it (§61), and the page has no button for them yet.
 */
import type { Pool, PoolClient } from "pg";
import type { SessionUser } from "./auth.ts";

type Q = Pool | PoolClient;
export type Answer = { code: number; body: Record<string, unknown> };
const ok = (body: Record<string, unknown>): Answer => ({ code: 200, body: { ok: true, ...body } });
const no = (code: number, error: string): Answer => ({ code, body: { ok: false, error } });

/* THE SAME SENTENCE memory-api.ts and platform-api.ts refuse a client account
   with, deliberately and to the letter (§53.5): two surfaces that refuse the
   same person in two different words tell whoever is probing which is which. */
const NOT_YOURS = "That is not something this account opens.";

const str = (v: unknown): string => (v == null ? "" : String(v));

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
    return ok({ frameworks: rows.map(shape), sections, total: rows.length });
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

  return no(400, "Unknown action.");
}
