import "server-only";
import { Type, type Schema } from "@google/genai";
import { generateStructured } from "./gemini";

export type PackCheckFinding = {
  /** "ACROSS" for a point about the pack as a whole, otherwise a process code from the pack. */
  scope: string;
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  recommendation: string;
};

export type PackCheckResult = { summary: string; findings: PackCheckFinding[] };

export type PackCheckOutcome =
  | { ok: true; data: PackCheckResult }
  | { ok: false; reason: "NOT_CONFIGURED" | "REQUEST_FAILED"; message: string };

const SYSTEM_PROMPT =
  "You are a process-improvement consultant doing a last read of a documentation pack before it goes to a " +
  "client. You are given several processes — each with its Process Map, RACI matrix and authority rows — plus " +
  "facts worked out across the pack. Find what would embarrass the consultant or mislead the client: a process " +
  "that is unfinished, hand-offs to a process that is not in the pack, the same activity owned by different " +
  "roles in different processes, roles that appear in one process and nowhere else without reason, missing " +
  "ownership or approvals, contradictions between processes. Use scope \"ACROSS\" for a point that spans " +
  "processes, otherwise the exact process code. Be specific — name the steps, activities and roles. Only report " +
  "what the supplied material shows; do not invent facts. If a process is fine, report nothing for it.";

const SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "2-4 sentences: is this pack ready to send, and what is the main thing to fix." },
    findings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          scope: { type: Type.STRING, description: 'Either "ACROSS" or a process code from the pack.' },
          severity: { type: Type.STRING, enum: ["high", "medium", "low"] },
          title: { type: Type.STRING, description: "Short label, under 10 words." },
          description: { type: Type.STRING, description: "What the issue is and where it shows up." },
          recommendation: { type: Type.STRING, description: "A concrete next step." },
        },
        required: ["scope", "severity", "title", "description", "recommendation"],
        propertyOrdering: ["scope", "severity", "title", "description", "recommendation"],
      },
    },
  },
  required: ["summary", "findings"],
  propertyOrdering: ["summary", "findings"],
};

export async function runPackCheck(promptText: string): Promise<PackCheckOutcome> {
  return generateStructured<PackCheckResult>({
    systemPrompt: SYSTEM_PROMPT,
    promptText,
    schema: SCHEMA,
    notConfiguredMessage: "The end-to-end check isn't configured for this deployment yet.",
    malformedMessage: "The model did not return structured findings.",
  });
}
