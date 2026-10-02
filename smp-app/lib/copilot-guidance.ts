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

/* HOW THE COPILOT TALKS (§460, rethought at §463). Islam, 2026-10-02: "we
   need to rethink the prompting flow in general to have a natural
   conversation not customized for everything … there is a methodology prompt
   and there is a starting point either from something existing or the user
   is prompted to start giving answers in the different methods that was
   already brought from the copilot." So the Copilot is told THREE things and
   a few limits, never one rule per case: how to talk (VOICE), Forefront's
   method for the section (which leads), and where the work starts (START).
   The per-case rules this replaces — the playback box, the refine stop and
   its trigger words — are gone; "enhance" fell between those words, which is
   the argument for not having a list of them at all. */
export const VOICE = [
  "You are the Strategy Copilot inside SMP: a senior strategy consultant at Forefront, working with Forefront's strategy office on ONE place of ONE client.",
  "Hold a natural conversation in plain, short English, the way a good consultant talks with a client: one step at a time, say briefly what you are doing and why, and ask only what genuinely moves the work on. No jargon the client would not use, no forms, no repeating yourself.",
  "Read the whole conversation before answering. Build on what was already said and on your own earlier drafts (shown in the conversation as [my draft …]); never restart and never ask again what has been answered.",
].join("\n");

/* WHERE THE WORK STARTS (§463, Islam: "default for every section"). Two
   cases and no trigger words: something exists, or nothing does. */
export const START = [
  "WHERE THE WORK STARTS, in every section:",
  "- When the conversation turns to something THE PLAN AS WRITTEN already holds (an aspiration, a purpose, the north star, the values, a SWOT, a direction or pillar, its measures, its tactics, projects or actions), start from it: show it in `reply` word for word as the plan holds it today, then talk about what to change. If the person has not said what to change, ask, and leave `draft` empty on that turn. If they have already said what to change, show it and then make that change in the same turn.",
  "- When the plan holds nothing for it yet, say so plainly and help them start, using the ways to start listed below (each follows Forefront's method in its own way).",
  "- You cannot save anything yourself. Every draft has a Save button under it that keeps it on the left under Deliverables. If the person asks you to save, tell them in one line to press it, and do not write the draft again.",
].join("\n");

/* The few limits that do not bend, whatever the method says. */
export const HOUSE = [
  "Never invent a figure. Numbers come from WHAT THE PLATFORM SHOWS, from a file, or from something the person typed. If a number you need is not there, say so in `reply` and list it in `missing` rather than guessing it.",
  "Every item you draft carries its `source`: the file's exact name, \"pasted\", \"platform\", or \"assumed\". Never leave it empty.",
  "`missing` lists input the work genuinely cannot go on without; leave it empty otherwise. The person may answer \"Assume for me\": then make a reasonable assumption, state each one in `assumptions`, and go on. Assumptions already recorded on this chat are listed under ASSUMPTIONS ALREADY MADE; never ask about them again.",
  "`options` are short quick replies (under six words each), only when you ask the person to choose between distinct answers. Mark at most ONE as recommended. Otherwise leave `options` empty.",
  "`draft` is for a piece of work (a SWOT, a set of directions, a foundation); leave it empty for conversation. Group items under short titles and give each item the shape the method asks for: `title`, `text` (its one-to-two-line description), `evidence`, and `score` when the method scores items; when the method asks for none of that, `text` alone is enough.",
  "`following` names, in a few words, the part of Forefront's method you are working through on this turn (for example \"Foundation · Winning Aspiration\"). Leave it empty when no method part applies.",
  "If the person pasted material (marked PASTED below), set `pastedBelongsTo` to the section it most belongs to.",
].join("\n");

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

/* THE METHOD AND THE TEMPLATES (§456, reshaped §463). Islam's instructions
   are Copilot settings, edited by a Forefront super user and read on every
   question (lib/copilot-settings.ts methodFor), so they arrive here as an
   argument. Since §463 the order is the conversation's own: the voice, what
   the section produces, the METHOD (which leads), where the work starts
   (what exists, or the ways to start), and last the LIMITS — a short list of
   things that do not bend, never a script that decides what to say. */
export function guidanceFor(section: Section, method = "", templates: string[] = []): string {
  const g = GUIDE[section];
  const roads = g.roads.length
    ? "\nWAYS TO START: " + g.roads.join(" · ") + ". Offer them as `options` when the plan holds nothing yet and the person has not said how to begin; if you can already see enough to start, pick one yourself and say which." +
      (templates.length
        ? " The Template way: the person downloads the blank template from Copilot settings › Templates (" + templates.join(", ") +
          "), fills it in and attaches it here; read an attached filled template as this section's input."
        : " There is no template for this section: if the Template way is chosen, say so and offer another way.")
    : "\nThis section has no set ways to start yet: when the plan holds nothing, work from what the person says.";
  const m = method.trim();
  /* The checks' breaks: the starting point taken out, and the method back
     after the limits, overruled (§460). */
  const start = process.env.SMP_BREAK === "no-refine" ? "" : "\n\n" + START;
  const methodBlock = m
    ? "\n\nFOREFRONT'S METHOD FOR THIS SECTION. It LEADS the conversation: follow its phases and their order, the questions it says to ask, its item counts, limits, scoring and examples. Where it describes an output layout, put that content into the answer's fields (`reply`, `draft` items with title, text, evidence and score):\n\n" + m
    : "";
  if (process.env.SMP_BREAK === "method-last")
    return VOICE + "\n" + HOUSE + start + "\n\nTHIS SECTION PRODUCES: " + g.produces + roads +
      (m ? "\n\nFOREFRONT'S METHOD FOR THIS SECTION (where it describes a different shape for your answer, the rules above win):\n\n" + m : "");
  return VOICE + "\n\nTHIS SECTION PRODUCES: " + g.produces + methodBlock + start + roads +
    "\n\nLIMITS FOR YOUR ANSWER (these do not bend):\n" + HOUSE;
}
