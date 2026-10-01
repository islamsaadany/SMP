/* ══ ASKING THE COPILOT (spec 064 stage 2) ════════════════════════════════
   NOT A SECOND ASSISTANT. `lib/assistant.cjs` is the one place the key is
   read and the one call to the provider; this file only says what to send
   (the section's guidance, what the platform shows, the files, the chat's
   assumptions) and reads the answer back into the shape the screen draws.

   THE ANSWER IS CHECKED, NEVER TRUSTED AS WRITTEN (§96.2): every list is
   capped, every string trimmed, a `source` naming a file nobody attached is
   read as "assumed" rather than drawn as a file, and at most one option is
   the recommended one. An answer with nothing in it is a failure, not an
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
const clip = (v: unknown, n: number) => str(v).replace(/\s+/g, " ").trim().slice(0, n);

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
    playback: {
      type: "OBJECT",
      properties: { understood: { type: "STRING" }, workingFrom: { type: "STRING" }, missing: { type: "STRING" } },
    },
    missing: { type: "ARRAY", items: { type: "STRING" } },
    options: {
      type: "ARRAY",
      items: { type: "OBJECT", properties: { label: { type: "STRING" }, recommended: { type: "BOOLEAN" } }, required: ["label"] },
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
                items: { type: "OBJECT", properties: { text: { type: "STRING" }, source: { type: "STRING" } }, required: ["text"] },
              },
            },
          },
        },
      },
    },
    pastedBelongsTo: { type: "STRING", enum: [...SECTIONS] },
  },
  required: ["reply"],
};

export type Answer = {
  kind: "answer";
  playback: { understood: string; workingFrom: string; missing: string } | null;
  missing: string[];
  options: { label: string; recommended: boolean }[];
  assumptions: string[];
  draft: { title: string; groups: { title: string; items: { text: string; source: string }[] }[] } | null;
  pastedBelongsTo: Section | null;
};

/* The model's JSON into the screen's shape, with the files that were really
   attached as the only names a source may carry. */
export function shapeAnswer(raw: unknown, fileNames: string[]): { reply: string; part: Answer } | null {
  const j: any = raw && typeof raw === "object" ? raw : {};
  const reply = str(j.reply).trim().slice(0, 8000);
  const pb = j.playback && typeof j.playback === "object" ? j.playback : null;
  const playback = pb && (clip(pb.understood, 600) || clip(pb.workingFrom, 600) || clip(pb.missing, 600))
    ? { understood: clip(pb.understood, 600), workingFrom: clip(pb.workingFrom, 600), missing: clip(pb.missing, 600) } : null;
  const list = (v: unknown, n: number, m: number) => (Array.isArray(v) ? v : []).map((x) => clip(x, m)).filter(Boolean).slice(0, n);
  let seenRec = false;
  const options = (Array.isArray(j.options) ? j.options : [])
    .map((o: any) => ({ label: clip(o && o.label, 60), recommended: !!(o && o.recommended) }))
    .filter((o: any) => o.label)
    .slice(0, 5)
    .map((o: any) => { const r = o.recommended && !seenRec; if (r) seenRec = true; return { label: o.label, recommended: r }; });
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
        .map((it: any) => ({ text: clip(it && it.text, 600), source: source(it && it.source) })).filter((it: any) => it.text),
    })).filter((g: any) => g.items.length);
    if (groups.length) draft = { title: clip(j.draft.title, 120), groups };
  }
  const pastedBelongsTo = (SECTIONS as readonly string[]).includes(j.pastedBelongsTo) ? (j.pastedBelongsTo as Section) : null;
  const part: Answer = {
    kind: "answer", playback, missing: list(j.missing, 8, 300), options,
    assumptions: list(j.assumptions, 10, 300), draft, pastedBelongsTo,
  };
  if (!reply && !playback && !draft) return null;
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
const RETRY_MS = () => { const n = Number(process.env.SMP_COPILOT_RETRY_MS); return Number.isFinite(n) && n >= 0 ? n : 2500; };
export async function askCopilot(a: AskInput): Promise<AskResult> {
  if (!A.configured()) return { ok: false, noKey: true, why: "no key is set" };
  const pdfParts = a.files.filter((f) => f.kind === "pdf" && f.bytes && f.bytes.length)
    .map((f) => ({ inlineData: { mimeType: "application/pdf", data: f.bytes!.toString("base64") } }));
  const call = () => A.askJson({
    question: a.question,
    history: a.history,
    schema: SCHEMA,
    needsCorpus: false,
    instruction: guidanceFor(a.section, a.method || "", a.templates || []),
    corpusName: "THIS CHAT'S MATERIAL",
    corpusText: corpusOf(a),
    parts: pdfParts,
    think: true,
    maxOutput: 8192,
    timeoutMs: 55_000,
  });
  /* A BUSY PROVIDER IS ASKED ONCE MORE BEFORE ANYBODY IS TOLD (Islam,
     2026-10-01, after a 503 "high demand" reached him mid-conversation).
     Only the statuses that mean "not now" — never a refusal of the question
     or the key, which a second ask would only repeat — and only once, after
     a short pause, because a spike is usually seconds long and a loop would
     hold the person's message for minutes. Such an answer comes back fast,
     so two asks stay well inside one request's life. */
  let r = await call();
  if (!r.ok && BUSY.has(Number((r as { status?: number }).status)) && process.env.SMP_BREAK !== "no-retry") {
    await new Promise((res) => setTimeout(res, RETRY_MS()));
    r = await call();
  }
  if (!r.ok) return { ok: false, why: r.why || "no answer" };
  const shaped = shapeAnswer(r.json, a.files.map((f) => f.name));
  if (!shaped) return { ok: false, why: "the answer had nothing in it" };
  return { ok: true, reply: shaped.reply, part: shaped.part };
}
