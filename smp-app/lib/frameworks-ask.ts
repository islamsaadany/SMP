/* Asking the library, and drafting a framework (spec 050).
 *
 * TWO CALLS THAT LOOK ALIKE AND ARE OPPOSITE, which is why they sit in one
 * file: asking is a LOOKUP over eighty frameworks and keeps every default
 * `assistant.cjs` has; drafting composes, and is the one call in this
 * platform that is not retrieval. The header below is about the second.
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

/* ════════════════════════════════════════════════════════════════
   ASKING IT — `memory-ask.ts`'s shape, and deliberately its shape rather
   than a second one (§53.5). It is NOT a second assistant: `assistant.cjs`
   already answers from a corpus, declines rather than inventing and caps its
   own thinking; this points it at a different corpus under the same two
   rules, and keeps every default.
   ════════════════════════════════════════════════════════════════ */

/* THE DECLINE IS OURS, NEVER THE MODEL'S (§125), and it says the useful
   thing. `assistant.cjs` BLANKS the reply when it hands over, because on the
   product's own manual a decline means a person is coming and the model's
   sentence would read as the answer. Nobody is coming here — "nothing in the
   library covers that" IS the answer, and for an admin the next step is to
   add it, which is what `NOTHING_FITS_ADMIN` says and why there are two. */
export const NOTHING_FITS =
  "Nothing in the library covers that one. It may be worth asking the office to add it.";
export const NOTHING_FITS_ADMIN =
  "Nothing in the library covers that one — if you know the framework, you can add it.";

export type Cited = { id: string; name: string; section: string; purpose: string };

const ASK_INSTRUCTION = [
  "You are answering a consultant at Forefront from the firm's own strategy frameworks",
  "library: eighty published tools, each with what it is for, the questions it answers",
  "and when it is the right one to reach for.",
  "",
  "Answer ONLY from the frameworks below. Never invent a tool, an author or a method,",
  "and never describe a framework the list does not carry.",
  "",
  "The question is almost always some form of \"which of these should I use, and why\".",
  "Say which, in a sentence or two, and say what makes it the right one for what they",
  "described. Where two genuinely fit, say both and say what separates them.",
  "",
  "ALWAYS name your sources. `source` must be the bracketed id of every framework you",
  "drew on, comma separated — the consultant's next step is to open it and read it, and",
  "they cannot do that if you do not say which one.",
  "",
  "If nothing in the library fits, set answered to false. That is a useful answer: it",
  "means the firm has not written that tool up. A confident answer from nothing is not.",
  "",
  "Reply in plain prose, a few sentences, in British English. No markdown.",
].join("\n");

/* THE FIVE THAT DECIDE WHICH TOOL THIS IS, and no more: the whole library
   travels in one prompt, and at eighty frameworks the nine fields would be
   some 140 KB where these five are about 32 (plan.md). The failure a bigger
   corpus buys is the bad kind — a prompt cut in half answers confidently
   from the frameworks that survived the cut. They are the same five the LIST
   carries, which is not a coincidence to repeat in two places: they are what
   answers "is this the right tool". */
type AskRow = { id: string; name: string; section: string; purpose: string; key_questions: string; when_to_use: string };

export function corpusOf(rows: AskRow[]): string {
  return rows.map((r) => [
    "## [" + r.id + "] " + r.name,
    "Section: " + r.section,
    "What it is for: " + r.purpose,
    "Questions it answers: " + r.key_questions,
    "When to use it: " + r.when_to_use,
  ].join("\n")).join("\n\n");
}

export async function askLibrary(pool: Q, question: unknown, canAdd: boolean) {
  const q = String(question || "").trim();
  if (!q) return { ok: false as const, why: "there is no question" };
  const rows: AskRow[] = (await pool.query(
    "SELECT id, name, section, purpose, key_questions, when_to_use FROM frameworks ORDER BY idx")).rows;
  /* AN EMPTY LIBRARY IS SAID RATHER THAN ANSWERED FROM (§45.2). It cannot
     happen on a deployed database — migration 009 loads eighty — which is
     exactly why it is guarded: the state that cannot happen is the one
     nothing would have caught. */
  if (!rows.length) return { ok: false as const, why: "the library is empty" };

  const r = await A.ask({
    question: q,
    /* `assistant.cjs` refuses an empty corpus by COUNTING sections and
       recipes, so the rows ride in as `sections`; the count is all it reads
       them for once corpusText is supplied. memory-ask.ts's own note. */
    kb: { sections: rows.map((x) => ({ id: x.id })), recipes: [] },
    corpusName: "THE STRATEGY FRAMEWORKS LIBRARY",
    /* RED: the frameworks are not sent. `assistant.cjs` falls back to building
       a corpus out of `kb` when corpusText is empty, and `kb` here is nothing
       but the ids — so what it would answer from is EIGHTY BARE IDS, which is
       measured rather than described as "nothing at all": a confident answer
       naming tools it was never shown is precisely what this must not do, and
       that is what the break produces. */
    corpusText: process.env.SMP_BREAK === "no-corpus" ? "" : corpusOf(rows),
    instruction: ASK_INSTRUCTION,
    emptyWhy: "the library is empty",
  });
  if (!r || !r.ok) return { ok: false as const, why: (r && r.why) || "the assistant could not be reached" };

  /* THE SOURCES ARE RESOLVED AGAINST WHAT WAS SENT, never trusted as written
     (§96.2): a cited id nobody has is citing nothing, and the page draws each
     source as a door — so an unresolved one would send somebody to a 404.
     memory-ask.ts's rule, copied rather than re-invented. */
  const byId = new Map(rows.map((x) => [String(x.id), x]));
  const cited: Cited[] = String(r.source || "")
    .split(/[,\s]+/).map((x) => x.replace(/[[\]]/g, "").trim()).filter(Boolean)
    .filter((id, i, all) => all.indexOf(id) === i)
    .map((id) => byId.get(id)).filter(Boolean)
    .map((x) => ({ id: String(x!.id), name: x!.name, section: x!.section, purpose: x!.purpose }));

  if (!r.answered) {
    return { ok: true as const, answered: false, reply: canAdd ? NOTHING_FITS_ADMIN : NOTHING_FITS, sources: [] as Cited[] };
  }
  return { ok: true as const, answered: true, reply: String(r.reply || ""), sources: cited };
}

/* ════════════════════════════════════════════════════════════════
   DRAFTING ONE — the half that composes.
   ════════════════════════════════════════════════════════════════ */

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
