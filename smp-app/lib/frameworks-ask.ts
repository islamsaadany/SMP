/* Drafting a framework, and asking the library (spec 050).
 *
 * THIS IS THE ONE CALL IN THIS PLATFORM THAT IS NOT A LOOKUP, and the whole
 * file turns on saying so. Everywhere else the assistant answers FROM a corpus
 * that is in the prompt and declines rather than inventing (§104). Drafting
 * asks it for eleven fields of content about a framework somebody published,
 * which is composing — so it gets room to reason (`think`), no corpus to
 * answer from (`needsCorpus: false`) and its own schema, through the three
 * options spec 050 added to `assistant.cjs`. Never a second caller: the key,
 * the endpoint, the timeout and every way it degrades live there (§53.5).
 *
 * TWO RULES MAKE THAT SAFE AND NEITHER IS OPTIONAL:
 *
 *   1 · IT MAY SAY IT DOES NOT KNOW. `known: false` is a first-class answer,
 *       and the schema requires the flag rather than inferring it from empty
 *       fields — a library of eighty real frameworks is exactly where a
 *       plausible invention does the most damage, because it is quoted to a
 *       client under Forefront's name. Pasting the source is the answer then.
 *   2 · NOTHING HERE WRITES. This module returns a draft; `save` in
 *       frameworks-api.ts is a separate action and the press is what writes.
 *
 * AND PASTED SOURCE IS RETRIEVAL AGAIN, so it keeps the thinking cap: the
 * material is in the prompt and the job is to shape it, which is what §134's
 * rule is actually about.
 */
import type { Pool, PoolClient } from "pg";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const A = require("./assistant.cjs");

type Q = Pool | PoolClient;

/* The eleven the table holds, named ONCE and walked by the schema, the
   instruction and the reader (§104.7). */
export const DRAFT_FIELDS = [
  "name", "section", "purpose", "keyQuestions", "whenToUse", "whenNotToUse",
  "inputsRequired", "outputs", "executiveExample", "consultantUseCase", "facilitationTips",
] as const;

const props: Record<string, { type: string }> = { known: { type: "boolean" }, why: { type: "string" } };
for (const f of DRAFT_FIELDS) props[f] = { type: "string" };

/* EVERY FIELD IS REQUIRED, INCLUDING THE FLAG. A schema that let fields be
   absent would make "it declined" and "it answered badly" the same shape, and
   they are not the same thing to the person reading the draft. */
export const DRAFT_SCHEMA = {
  type: "object",
  properties: props,
  required: ["known", "why", ...DRAFT_FIELDS],
};

const FIELD_ASKS: Record<string, string> = {
  name: "the framework's name, with its originator in brackets if it has one — e.g. \"The Five Forces (Porter)\"",
  section: "which of the sections below it belongs in, copied exactly",
  purpose: "why the tool exists, one or two sentences",
  keyQuestions: "the question or questions it answers",
  whenToUse: "when it is the right tool",
  whenNotToUse: "its pitfalls, and the situations to avoid it in",
  inputsRequired: "the data and preparation it needs",
  outputs: "what comes out of it",
  executiveExample: "one sentence on how a leadership team uses it",
  consultantUseCase: "one sentence on how a consultant uses it",
  facilitationTips: "how to run it in a workshop",
};

function fieldList(): string {
  return DRAFT_FIELDS.map((f) => "  " + f + " — " + FIELD_ASKS[f]).join("\n");
}

/* THE HOUSE'S OWN VOICE IS ASKED FOR, because the eighty already in the
   library are written one way and a draft that reads differently is spotted
   as the odd one out long before anybody checks whether it is right. */
const VOICE = [
  "Write in British English, plainly, in the register of a consulting reference:",
  "no marketing language, no hedging, no bullet characters. Each field is one to",
  "three sentences of continuous prose. Do not repeat the framework's name inside",
  "the other fields.",
].join("\n");

function instructionFor(sections: string[], source: string | null): string {
  const secs = "The sections, and it must be one of exactly these:\n" +
    sections.map((s) => "  · " + s).join("\n");
  if (source) {
    return [
      "You are turning source material into one entry in a firm's strategy frameworks library.",
      "",
      "Use ONLY the material given below. Do not add anything it does not say, and do not",
      "draw on what you may know about this framework from elsewhere — if the material is",
      "too thin to fill a field honestly, leave that field empty rather than inventing it.",
      "Set `known` true, and leave `why` empty.",
      "",
      VOICE, "", secs, "", "The fields:", fieldList(),
    ].join("\n");
  }
  return [
    "You are writing one entry in a firm's strategy frameworks library, from a",
    "framework's name alone.",
    "",
    "IF YOU DO NOT KNOW THIS FRAMEWORK WELL ENOUGH TO BE ACCURATE, say so: set",
    "`known` false, put one plain sentence in `why`, and leave every other field",
    "empty. Do not produce a plausible account of something you are unsure of, and",
    "do not guess at an originator. This library is quoted to clients, so a",
    "confident invention here is worse than no entry at all.",
    "",
    "If you do know it: set `known` true, leave `why` empty, and fill every field.",
    "",
    VOICE, "", secs, "", "The fields:", fieldList(),
  ].join("\n");
}

export type Draft = Record<string, string>;
export type DraftResult =
  | { ok: true; known: true; draft: Draft }
  | { ok: true; known: false; why: string }
  | { ok: false; why: string };

export async function draftFramework(pool: Q, opts: { name?: unknown; source?: unknown }): Promise<DraftResult> {
  const name = String(opts.name || "").trim();
  const source = String(opts.source || "").trim();
  if (!name && !source) return { ok: false, why: "Give it a name, or paste the source." };

  const sections: string[] = (await pool.query(
    "SELECT section FROM frameworks GROUP BY section ORDER BY min(idx)")).rows.map((r) => r.section);

  const r = await A.askJson({
    question: source
      ? "Turn this into one library entry" + (name ? ", for: " + name : "") + ".\n\n" + source
      : "Write the library entry for: " + name,
    schema: DRAFT_SCHEMA,
    /* Composing from the model's own knowledge has no corpus to answer from,
       and needs room to reason. Pasted source is retrieval again and keeps
       both of this platform's defaults. */
    needsCorpus: !source ? false : true,
    kb: source ? { sections: [{ id: "src" }], recipes: [] } : undefined,
    corpusText: source || undefined,
    corpusName: source ? "THE SOURCE MATERIAL" : undefined,
    /* RED: the thinking cap put back on the by-name draft, which is the
       default every other caller wants and the one thing this call is not.
       Observable on the wire, which is how the check sees it. */
    think: process.env.SMP_BREAK === "think-capped" ? false : !source,
    maxOutput: 4096,
    instruction: instructionFor(sections, source || null),
  });

  if (!r || !r.ok) return { ok: false, why: (r && r.why) || "the assistant could not be reached" };
  const j = r.json || {};
  if (j.known !== true) {
    /* THE SENTENCE IS THE MODEL'S HERE, and that is the one place in this
       platform where it is — §125's rule is that a DECLINE must not read as
       an answer, and this decline IS the useful thing: which framework it
       does not know, in its own words, is what tells the admin whether to
       paste the source or check the name. */
    return { ok: true, known: false, why: String(j.why || "").trim() ||
      "I do not know that one well enough to write it up." };
  }
  const draft: Draft = {};
  for (const f of DRAFT_FIELDS) draft[f] = String(j[f] || "").trim();
  /* THE NAME FALLS BACK TO WHAT WAS TYPED, never to nothing: a draft with no
     name cannot be saved (the table's own CHECK), and the person has already
     told us what it is called. */
  if (!draft.name) draft.name = name;
  /* A SECTION IT INVENTED IS DROPPED RATHER THAN STORED. The eight are fixed
     (spec 050 §11), the screen offers them as a picker, and an empty one
     means the admin picks — which is better than a ninth section arriving
     through a draft nobody read closely. */
  if (draft.section && !sections.includes(draft.section)) draft.section = "";
  return { ok: true, known: true, draft };
}
