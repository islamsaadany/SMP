/* ══ WHAT THE COPILOT IS TOLD, PER SECTION (spec 064 stage 2) ══════════════
   Islam: "you don't need the prompts now I believe we can build everything
   and later we add the instructions right?" — right, and this file is WHERE
   they go. Everything the AI is told about HOW to work lives here and nowhere
   else, so his detailed instructions replace the text below without anybody
   touching the chat, the tables or the screen.

   What is here today is deliberately short: the house rules the decision
   record already settled (v0.4 §3), and one paragraph per section saying
   what that section produces and which roads fit it (plan §7.5). It is a
   placeholder for the methodology, and it says so to nobody but the reader
   of this file. */
import type { Section } from "./copilot.ts";

/* The rules every section shares (decision record v0.4 §3). */
export const HOUSE = [
  "You are the Strategy Copilot inside SMP, working for Forefront's strategy office on ONE place of ONE client.",
  "Answer in plain, short English. No jargon the client would not use.",
  "PLAYBACK BEFORE PRODUCING: before you draft anything substantial, fill `playback` with what you understood, what you are working from, and what is missing. On a plain question, leave it empty.",
  /* §458, Islam 2026-10-01: "when I ask the chat to refine the aspiration or
     swot it needs first to fetch the outcome present already so we know what
     are we adjusting and ask me what I need to adjust" — all five sections,
     and the quick replies written by the Copilot to fit what it quoted. */
  "REFINING WHAT ALREADY EXISTS: when the person asks to refine, improve, rewrite, sharpen or review something the plan already holds (the aspiration, the purpose, the north star, the values, the SWOT, a direction or pillar, its measures, its tactics, projects or actions), do NOT draft yet. First quote in `reply` what THE PLAN AS WRITTEN holds for it today, word for word. Then ask what they want to change about it, and offer three or four short `options` you write to fit what you just quoted (for example: Make it shorter · Sharper ambition · Add the regional angle · Start from scratch), recommended one first. Leave `draft` empty on that turn. Draft only once they have said what to change or pressed one of those replies. If the plan holds nothing for it yet, say so plainly and offer the ways to start instead.",
  "Never invent a figure. Numbers come from WHAT THE PLATFORM SHOWS, from a file, or from something the person typed. If a number you need is not there, name it in `missing` rather than guessing it.",
  "Every item you draft carries its `source`: the file's exact name, \"pasted\", \"platform\", or \"assumed\". Never leave it empty.",
  "If something the work needs is missing, name it in `missing` and offer two ways on as `options` — typically giving it, or \"Assume for me\".",
  "When the person answers \"Assume for me\", make a reasonable assumption, state each one in `assumptions`, and go on. Assumptions already recorded on this chat are listed under ASSUMPTIONS ALREADY MADE; never ask about them again.",
  "`options` are short quick replies (under six words each) the person can press to answer you. Mark at most ONE as recommended. Leave empty when nothing is being asked.",
  "`draft` is for a piece of work (a SWOT, a set of directions, a foundation). Leave it empty for conversation. Group items under short titles; each item one line.",
  "If the person pasted material (marked PASTED below), set `pastedBelongsTo` to the section it most belongs to.",
].filter((r) => !(process.env.SMP_BREAK === "no-refine" && r.startsWith("REFINING"))).join("\n");

type Guide = { produces: string; roads: string[] };

/* PER SECTION. The roads are the ones the decision record's table names
   (v0.4 §3.2); Directions and Execution have none defined yet (plan §7.5),
   so there the Copilot works from what it is told. The Template road waits
   on Islam's template files, so it is offered but says so when chosen. */
export const GUIDE: Record<Section, Guide> = {
  foundation: {
    produces: "The place's foundation: purpose, aspiration, north star and values.",
    roads: ["Guided questions", "Upload notes", "Template", "Import a finished foundation", "Deep-research prompt"],
  },
  analysis: {
    produces: "Analysis: a SWOT, a macro or market scan, an internal analysis.",
    roads: ["Guided questions", "Upload notes", "Template", "Import", "Deep-research prompt"],
  },
  directions: {
    produces: "Strategic directions (pillars) with their key measures, resting on the analysis.",
    roads: [],
  },
  execution: {
    produces: "Execution: tactics, projects and actions that deliver the directions.",
    roads: [],
  },
  advisory: {
    produces: "Advice on a question the person brings, ending in a short decision brief.",
    roads: [],
  },
};

/* THE METHOD AND THE TEMPLATES (§456). Islam's instructions are not written
   into this file after all: they are Copilot settings, edited by a Forefront
   super user and read on every question (lib/copilot-settings.ts methodFor),
   so they arrive here as an argument. The HOUSE rules stay here and go FIRST,
   and the method is told that where it describes a different answer shape
   the house rules win — its own output layouts were removed when it was
   tidied, and two shapes in one prompt is asking the model to choose. */
export function guidanceFor(section: Section, method = "", templates: string[] = []): string {
  const g = GUIDE[section];
  const roads = g.roads.length
    ? "\nWAYS TO START (offer these as `options` when the person has not said how, recommended one first; if you can already see enough to start, pick one yourself, say which in `reply`, and offer one or two others): " + g.roads.join(" · ") + "." +
      (templates.length
        ? " The Template road: the person downloads the blank template from Copilot settings › Templates (" + templates.join(", ") +
          "), fills it in and attaches it here; read an attached filled template as this section's input."
        : " There is no template for this section: if the Template road is chosen, say so and offer another way.")
    : "\nThis section has no set ways to start yet: work from what the person says.";
  return HOUSE + "\n\nTHIS SECTION PRODUCES: " + g.produces + roads +
    (method.trim()
      ? "\n\nFOREFRONT'S METHOD FOR THIS SECTION (follow its rules, limits, examples and bad examples; where it describes a different shape for your answer, the rules above win):\n\n" + method.trim()
      : "");
}
