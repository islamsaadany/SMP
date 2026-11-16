/* The pieces of the SOP suggestion that need no database or model: what to ask for, the prompt, and which of the
   model's answers may be shown. A suggestion only ever fills a field that is empty, so nothing a person wrote is
   replaced; the person then uses, edits or deletes each one. */

export type SopField = "how" | "inputs" | "output" | "errors" | "risk";
export const SOP_FIELDS: SopField[] = ["how", "inputs", "output", "errors", "risk"];

export type SopStepFacts = {
  id: string;
  n: number;
  type: "TASK" | "DECISION";
  label: string;
  role: string | null;
  how: string[];
  inputs: string;
  output: string;
  errors: string;
  risk: string;
  note: string;
  rules: string;
};

export type SopAnswer = { stepId: string; how: string[]; inputs: string; output: string; errors: string; risk: string };

/** The fields a step still has empty, in the order the SOP reads. */
export function emptyFields(s: Pick<SopStepFacts, SopField>): SopField[] {
  return SOP_FIELDS.filter((f) => (f === "how" ? s.how.filter((x) => x.trim()).length === 0 : !String(s[f]).trim()));
}

export function buildSopPrompt(ctx: { industry: string | null; processName: string; description: string | null; purpose: string | null; steps: SopStepFacts[]; targetIds: string[] }): string {
  const lines: string[] = [];
  lines.push(`Industry / sector: ${ctx.industry?.trim() || "not stated"}`);
  lines.push(`Process: ${ctx.processName}`);
  if (ctx.description?.trim()) lines.push(`Description: ${ctx.description.trim()}`);
  if (ctx.purpose?.trim()) lines.push(`Purpose: ${ctx.purpose.trim()}`);
  lines.push("", "All steps in order (for context):");
  for (const s of ctx.steps) {
    const bits = [`${s.n}. [${s.type}] ${s.label}`, s.role ? `role: ${s.role}` : null, s.note.trim() ? `note: ${s.note.trim()}` : null, s.rules.trim() ? `rules: ${s.rules.trim()}` : null].filter(Boolean);
    lines.push(`- ${bits.join(" | ")}`);
  }
  lines.push("", "Write the following (stepId, then the fields to fill; what the user already entered is shown so you stay consistent with it):");
  for (const id of ctx.targetIds) {
    const s = ctx.steps.find((x) => x.id === id);
    if (!s) continue;
    const want = emptyFields(s);
    if (!want.length) continue;
    const have = SOP_FIELDS.filter((f) => !want.includes(f)).map((f) => `${f}: ${f === "how" ? s.how.join(" / ") : s[f]}`);
    lines.push(`- stepId ${s.id} — step ${s.n} "${s.label}" — FILL: ${want.join(", ")}${have.length ? ` — ALREADY ENTERED: ${have.join("; ")}` : ""}`);
  }
  return lines.join("\n");
}

/** Keeps only what was asked for: a known step, a field that is still empty, trimmed and bounded. */
export function cleanAnswers(raw: SopAnswer[], steps: SopStepFacts[], targetIds: string[]): SopAnswer[] {
  const out: SopAnswer[] = [];
  for (const a of raw ?? []) {
    if (!targetIds.includes(a?.stepId)) continue;
    const s = steps.find((x) => x.id === a.stepId);
    if (!s) continue;
    const want = emptyFields(s);
    const text = (v: unknown) => String(v ?? "").trim().slice(0, 2000);
    const r: SopAnswer = {
      stepId: s.id,
      how: want.includes("how") ? (Array.isArray(a.how) ? a.how : []).map((x) => String(x ?? "").trim().slice(0, 500)).filter(Boolean).slice(0, 12) : [],
      inputs: want.includes("inputs") ? text(a.inputs) : "",
      output: want.includes("output") ? text(a.output) : "",
      errors: want.includes("errors") ? text(a.errors) : "",
      risk: want.includes("risk") ? text(a.risk) : "",
    };
    if (r.how.length || r.inputs || r.output || r.errors || r.risk) out.push(r);
  }
  return out;
}
