import "server-only";
import { Type, type Schema } from "@google/genai";
import { generateStructured } from "./gemini";

export type SopSuggestion = { stepId: string; how: string[]; inputs: string; output: string; errors: string; risk: string };
export type SopSuggestResult = { steps: SopSuggestion[] };

const SYSTEM_PROMPT =
  "You are an operations consultant drafting the Standard Operating Procedure for one business process, step by step. " +
  "Write in the voice of a procedure: short, concrete, imperative lines. Ground every line in the stated industry and in what the " +
  "user has already entered about this process and its steps (names, roles, neighbouring steps, notes, rules). " +
  "Fill ONLY the fields you are asked for on each step; leave any other field as an empty string (or an empty list for 'how'). " +
  "'how' is 2-6 one-line actions the role performs; 'inputs' names the documents, data, tools and systems used; 'output' names what the " +
  "step produces or decides; 'errors' lists the usual mistakes or exceptions; 'risk' says what goes wrong if the step is mishandled. " +
  "Do not invent company-specific facts (system names, thresholds, people) that were not given; when unsure, stay generic to the industry.";

const SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    steps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          stepId: { type: Type.STRING, description: "The id given for the step, copied exactly." },
          how: { type: Type.ARRAY, items: { type: Type.STRING }, description: "One line per action." },
          inputs: { type: Type.STRING },
          output: { type: Type.STRING },
          errors: { type: Type.STRING },
          risk: { type: Type.STRING },
        },
        required: ["stepId", "how", "inputs", "output", "errors", "risk"],
        propertyOrdering: ["stepId", "how", "inputs", "output", "errors", "risk"],
      },
    },
  },
  required: ["steps"],
  propertyOrdering: ["steps"],
};

export async function runSopSuggest(promptText: string) {
  return generateStructured<SopSuggestResult>({
    systemPrompt: SYSTEM_PROMPT,
    promptText,
    schema: SCHEMA,
    notConfiguredMessage: "AI suggestions aren't configured for this deployment yet.",
    malformedMessage: "The model did not return usable suggestions.",
  });
}
