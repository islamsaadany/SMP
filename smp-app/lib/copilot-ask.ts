/* ══ ASKING THE COPILOT (spec 064 stage 2) ════════════════════════════════
   NOT A SECOND ASSISTANT. `lib/assistant.cjs` is the one place the key is
   read and the one call to the provider; this file only says what to send
   (the section's guidance, what the platform shows, the files, the chat's
   assumptions) and reads the answer back into the shape the screen draws.

   THE ANSWER IS CHECKED, NEVER TRUSTED AS WRITTEN (§96.2): every list is
   capped, every string trimmed, a `source` naming a file nobody attached is
   read as "assumed" rather than drawn as a file, and no option is ever
   marked recommended (§474). An answer with nothing in it is a failure, not an
   empty bubble (§124). */
import { createRequire } from "node:module";
import { SECTIONS, type Section } from "./copilot.ts";
import { guidanceFor } from "./copilot-guidance.ts";

const need = createRequire(import.meta.url);
const A = need("./assistant.cjs") as {
  askJson: (o: Record<string, unknown>) => Promise<{ ok: boolean; json?: unknown; why?: string; badKey?: boolean }>;
  configured: () => boolean;
};
export const configured = (): boolean => A.configured();

const str = (v: unknown) => (v == null ? "" : String(v));
/* THE ANSWER'S OWN FORMAT NEVER REACHES THE SCREEN (§458). Islam saw a
   "Working from" line end in `", "missing": "None.` — the model had written
   the next field of its JSON INSIDE this one. A string that runs on into
   `", "<one of our own field names>":` is cut there; anything else is kept
   exactly as written (§96.2). */
const OWN_KEYS = "understood|workingFrom|missing|reply|options|assumptions|draft|pastedBelongsTo|title|groups|items|text|source|label|evidence|score|following";
const LEAK = new RegExp('["\u201d]\\s*,\\s*"(?:' + OWN_KEYS + ')"\\s*:[\\s\\S]*$');
export const unleak = (v: string) => (process.env.SMP_BREAK === "keep-leak" ? v : v.replace(LEAK, "").trim());
const clip = (v: unknown, n: number) => unleak(str(v).replace(/\s+/g, " ").trim()).slice(0, n);

/* A paste is longer than a thought: two thousand characters, or more than
   one blank-line-separated paragraph at eight hundred. Marked on the
   message (plan §7.2) so everything drafted from it can say so. */
export function isPasted(text: string): boolean {
  const t = text.trim();
  return t.length >= 2000 || (t.length >= 800 && /\n\s*\n/.test(t));
}

export const SCHEMA = {
  type: "OBJECT",
  properties: {
    reply: { type: "STRING" },
    missing: { type: "ARRAY", items: { type: "STRING" } },
    options: {
      type: "ARRAY",
      items: { type: "OBJECT", properties: { label: { type: "STRING" } }, required: ["label"] },
    },
    assumptions: { type: "ARRAY", items: { type: "STRING" } },
    draft: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        groups: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              items: {
                type: "ARRAY",
                items: { type: "OBJECT", properties: { title: { type: "STRING" }, text: { type: "STRING" }, evidence: { type: "STRING" }, score: { type: "STRING" }, source: { type: "STRING" } }, required: ["text"] },
              },
            },
          },
        },
      },
    },
    pastedBelongsTo: { type: "STRING", enum: [...SECTIONS] },
    following: { type: "STRING" },
  },
  required: ["reply"],
};

export type Answer = {
  kind: "answer";
  missing: string[];
  options: { label: string }[];
  assumptions: string[];
  draft: { title: string; groups: { title: string; items: DraftItem[] }[] } | null;
  pastedBelongsTo: Section | null;
  /* The method part this turn works through (§460), "" when none. */
  following: string;
};
/* An item in the method's own shape (§460): title, description, evidence
   and score are optional, because a method that asks for none of them is
   answered by `text` alone. */
export type DraftItem = { text: string; source: string; title?: string; evidence?: string; score?: string };

/* The model's JSON into the screen's shape, with the files that were really
   attached as the only names a source may carry. */
export function shapeAnswer(raw: unknown, fileNames: string[]): { reply: string; part: Answer } | null {
  const j: any = raw && typeof raw === "object" ? raw : {};
  const reply = unleak(str(j.reply).trim()).slice(0, 8000);
  const list = (v: unknown, n: number, m: number) => (Array.isArray(v) ? v : []).map((x) => clip(x, m)).filter(Boolean).slice(0, n);
  // §474: a quick reply is never marked recommended (Islam: "remove
  // recommended from answering questions"), so whatever the model sends
  // in that field is dropped here rather than trusted.
  const options = (Array.isArray(j.options) ? j.options : [])
    .map((o: any) => ({ label: clip(o && o.label, 60) }))
    .filter((o: any) => o.label)
    .slice(0, 5);
  const names = new Set(fileNames);
  const source = (s: unknown) => {
    const v = clip(s, 160);
    if (!v) return "assumed";
    if (v === "pasted" || v === "platform" || v === "assumed") return v;
    /* The check's break: trust whatever name the model wrote (§94.5). */
    if ((process.env.SMP_BREAK || "") === "trust-source") return v;
    return names.has(v) ? v : "assumed";
  };
  let draft: Answer["draft"] = null;
  if (j.draft && typeof j.draft === "object" && Array.isArray(j.draft.groups)) {
    const groups = j.draft.groups.slice(0, 12).map((g: any) => ({
      title: clip(g && g.title, 80),
      items: (Array.isArray(g && g.items) ? g.items : []).slice(0, 30)
        .map((it: any) => {
          const o: DraftItem = { text: clip(it && it.text, 600), source: source(it && it.source) };
          const t = clip(it && it.title, 140), e = clip(it && it.evidence, 400), sc = clip(it && it.score, 40);
          if (!o.text && t) { o.text = t; } else if (t) o.title = t;
          if (e) o.evidence = e;
          if (sc) o.score = sc;
          return o;
        }).filter((it: any) => it.text),
    })).filter((g: any) => g.items.length);
    if (groups.length) draft = { title: clip(j.draft.title, 120), groups };
  }
  const pastedBelongsTo = (SECTIONS as readonly string[]).includes(j.pastedBelongsTo) ? (j.pastedBelongsTo as Section) : null;
  const part: Answer = {
    kind: "answer", missing: list(j.missing, 8, 300), options,
    assumptions: list(j.assumptions, 10, 300), draft, pastedBelongsTo,
    following: clip(j.following, 120),
  };
  if (!reply && !draft) return null;
  return { reply, part };
}

export type AskFile = { name: string; kind: string; text: string; bytes?: Buffer | null };
export type AskInput = {
  section: Section; place: string; placeWord: string;
  context: string; question: string; pasted: boolean;
  history: { from_office: boolean; body: string }[];
  assumptions: string[];
  files: AskFile[];
  /* Forefront's method for this section and the templates it may offer, as
     Copilot settings hold them now (lib/copilot-settings.ts, §456). */
  method?: string;
  templates?: string[];
};

export function corpusOf(a: AskInput): string {
  const out: string[] = [];
  out.push("PLACE: " + (a.placeWord || a.place) + " (" + a.place + ")");
  out.push("SECTION: " + a.section);
  out.push("\nWHAT THE PLATFORM SHOWS FOR THIS PLACE (source \"platform\"):\n" + (a.context.trim() || "Nothing was sent."));
  out.push("\nASSUMPTIONS ALREADY MADE ON THIS CHAT (never ask about these again):\n" +
    (a.assumptions.length ? a.assumptions.map((x) => "- " + x).join("\n") : "None yet."));
  const readable = a.files.filter((f) => f.text);
  const pdfs = a.files.filter((f) => f.kind === "pdf");
  if (a.files.length) {
    out.push("\nFILES IN THIS CHAT (cite each by its exact name as `source`):");
    for (const f of readable) out.push("\n=== FILE: " + f.name + " ===\n" + f.text);
    for (const f of pdfs) out.push("\n=== FILE: " + f.name + " === (a PDF, attached to the question itself)");
  }
  if (a.pasted) out.push("\nThe person's latest message is PASTED material (source \"pasted\").");
  return out.join("\n");
}

export type AskResult = { ok: true; reply: string; part: Answer } | { ok: false; why: string; noKey?: boolean };

/* The one call. A PDF rides as a document on the question; everything else
   is text in the corpus. The timeout is the drafting one — a draft is not a
   lookup (§134's own distinction) — and thinking is allowed. */
const BUSY = new Set([429, 500, 502, 503, 504]);
/* The pauses before each further ask (§458). SMP_COPILOT_RETRY_MS, when set,
   replaces every one of them — the check sets it to 0 so a run takes no time. */
const WAITS = [2000, 5000, 10000];
const waitFor = (i: number) => { const n = Number(process.env.SMP_COPILOT_RETRY_MS); return process.env.SMP_COPILOT_RETRY_MS != null && Number.isFinite(n) && n >= 0 ? n : WAITS[i]; };
/* The lighter model asked once when the main one stays busy. An override
   for the day Google renames it; a fallback that is itself refused only
   means the person is told about the busy main model, as before. */
const fallbackModel = () => String(process.env.GEMINI_FALLBACK_MODEL || "gemini-flash-lite-latest").trim();
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
export async function askCopilot(a: AskInput): Promise<AskResult> {
  if (!A.configured()) return { ok: false, noKey: true, why: "no key is set" };
  const pdfParts = a.files.filter((f) => f.kind === "pdf" && f.bytes && f.bytes.length)
    .map((f) => ({ inlineData: { mimeType: "application/pdf", data: f.bytes!.toString("base64") } }));
  const call = (model?: string) => A.askJson({
    question: a.question,
    history: a.history,
    maxTurns: process.env.SMP_BREAK === "short-memory" ? 8 : 20,
    schema: SCHEMA,
    needsCorpus: false,
    instruction: guidanceFor(a.section, a.method || "", a.templates || []),
    corpusName: "THIS CHAT'S MATERIAL",
    corpusText: corpusOf(a),
    parts: pdfParts,
    think: true,
    maxOutput: 8192,
    timeoutMs: 55_000,
    ...(model ? { model } : {}),
  });
  /* A BUSY PROVIDER IS ASKED AGAIN BEFORE ANYBODY IS TOLD (§457, widened by
     §458). Islam met the 503 "high demand" again after §457's single retry:
     a busy spell lasts longer than 2.5 seconds. So three more asks, waiting
     2, 5 and 10 seconds, and then the lighter model once (his "fallback ok").
     Only the statuses that mean "not now" — a refusal of the question or the
     key would only be repeated — and a busy answer comes back fast, so the
     whole ladder stays well inside one request's life. */
  const r = await withRetry(call);
  if (!r.ok) return { ok: false, why: r.why || "no answer" };
  const shaped = shapeAnswer(r.json, a.files.map((f) => f.name));
  if (!shaped) return { ok: false, why: "the answer had nothing in it" };
  return { ok: true, reply: shaped.reply, part: shaped.part };
}

/* THE SECOND TRY HAS ONLY ONE PLACE TO PUT AN ANSWER (§477). §476 asked a
   draftless "I've made the change" again in the same full shape, and on
   Islam's tenant it talked a second time and sent nothing — most likely
   copying its own earlier draftless replies in the history. So the second
   try is a different, smaller ask: a shape holding ONLY the draft, required,
   with no `reply` to talk in. Same instruction, corpus and history, so it
   still knows what was asked; NO_DRAFT stays the last resort. */
export const DRAFT_ONLY_SCHEMA = {
  type: "OBJECT",
  properties: { draft: (SCHEMA.properties as any).draft },
  required: ["draft"],
};
export async function askDraftOnly(a: AskInput): Promise<{ ok: true; draft: NonNullable<Answer["draft"]> } | { ok: false; why: string }> {
  if (!A.configured()) return { ok: false, why: "no key is set" };
  const call = (model?: string) => A.askJson({
    question: a.question, history: a.history, maxTurns: 20, schema: DRAFT_ONLY_SCHEMA, needsCorpus: false,
    instruction: guidanceFor(a.section, a.method || "", a.templates || []),
    corpusName: "THIS CHAT'S MATERIAL", corpusText: corpusOf(a), parts: [],
    think: true, maxOutput: 8192, timeoutMs: 55_000, ...(model ? { model } : {}),
  });
  const r = await withRetry(call);
  if (!r.ok) return { ok: false, why: r.why || "no answer" };
  const j: any = r.json && typeof r.json === "object" ? r.json : {};
  const shaped = shapeAnswer({ reply: "", draft: j.draft }, a.files.map((f) => f.name));
  if (!shaped || !shaped.part.draft) return { ok: false, why: "no draft came back" };
  return { ok: true, draft: shaped.part.draft };
}

/* The ladder, shared by every ask the Copilot makes (§465): the guided
   Foundation's draft, refine and check are asked of the same busy provider. */
async function withRetry(call: (model?: string) => Promise<any>): Promise<any> {
  const busy = (x: { ok: boolean }) => !x.ok && BUSY.has(Number((x as { status?: number }).status));
  let r = await call();
  if (busy(r) && process.env.SMP_BREAK !== "no-retry") {
    for (let i = 0; i < WAITS.length && busy(r); i++) { await sleep(waitFor(i)); r = await call(); }
    if (busy(r) && process.env.SMP_BREAK !== "no-fallback") {
      const f = await call(fallbackModel());
      if (f.ok) r = f;
    }
  }
  return r;
}

/* ONE SMALL ASK IN ONE SMALL SHAPE (§465): the guided Foundation's draft,
   refine and check. No history — what the flow knows is in the corpus. */
export async function askFlowJson(a: { instruction: string; corpus: string; question: string; schema: unknown }):
  Promise<{ ok: true; json: any } | { ok: false; why: string; noKey?: boolean }> {
  if (!A.configured()) return { ok: false, noKey: true, why: "no key is set" };
  const call = (model?: string) => A.askJson({
    question: a.question, history: [], maxTurns: 0, schema: a.schema, needsCorpus: false,
    instruction: a.instruction, corpusName: "THIS FOUNDATION", corpusText: a.corpus, parts: [],
    think: true, maxOutput: 4096, timeoutMs: 55_000, ...(model ? { model } : {}),
  });
  const r = await withRetry(call);
  if (!r.ok) return { ok: false, why: r.why || "no answer" };
  return { ok: true, json: r.json };
}
