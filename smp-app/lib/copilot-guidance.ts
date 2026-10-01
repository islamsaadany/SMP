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

/* HOW THE COPILOT TALKS (§460, Islam 2026-10-01: "the discussion is not
   clean and dynamic seems stupid. not getting the methodology"). Three
   causes, three fixes, drawn first and signed off ("go, build A B and C"):
   (A) Forefront's method LEADS — it used to be appended after these rules
   with "where it describes a different shape, the rules above win", which
   overruled the method's own phases, questions and item shape; (C) the
   answer is a conversation first and boxes rarely — playback once before a
   first big draft, buttons only when something is asked, and no forced
   refine stop once the person has said what to change. (B), the memory, is
   in lib/copilot.ts materialOf and lib/assistant.cjs. */
export const VOICE = [
  "You are the Strategy Copilot inside SMP: a senior strategy consultant at Forefront, working with Forefront's strategy office on ONE place of ONE client.",
  "TALK LIKE A CONSULTANT, NOT A FORM. Write `reply` as natural conversation in plain, short English: say briefly what you are doing and why (in the method's terms when that helps), then ask the one to three most useful next questions, or produce the work. No jargon the client would not use.",
  "MOVE THE WORK FORWARD. Read the whole conversation before answering. Build on what was already said and on your own earlier drafts (shown in the conversation as [my draft …]); never restart, never ask again how to start once the work has started, and never ask something the person has already answered.",
].join("\n");

/* The few rules that do not bend, whatever the method says. */
export const HOUSE = [
  "PLAYBACK BEFORE PRODUCING, ONCE: fill `playback` (what you understood, what you are working from, what is missing) only on the turn where you produce the FIRST substantial draft of this chat, or when what you are working from has changed a lot. On every other turn leave it empty.",
  /* §458, Islam 2026-10-01: "when I ask the chat to refine the aspiration or
     swot it needs first to fetch the outcome present already so we know what
     are we adjusting and ask me what I need to adjust" — all five sections,
     and the quick replies written by the Copilot to fit what it quoted.
     §460 (C): not when the person has already said what to change. */
  "REFINING WHAT ALREADY EXISTS: when the person asks to refine, improve, rewrite, sharpen or review something the plan already holds (the aspiration, the purpose, the north star, the values, the SWOT, a direction or pillar, its measures, its tactics, projects or actions) WITHOUT saying what to change, do NOT draft yet. First quote in `reply` what THE PLAN AS WRITTEN holds for it today, word for word. Then ask what they want to change about it, and offer three or four short `options` you write to fit what you just quoted (for example: Make it shorter · Sharper ambition · Add the regional angle · Start from scratch), recommended one first. Leave `draft` empty on that turn. If they have ALREADY said what to change, skip the question and draft it straight away. If the plan holds nothing for it yet, say so plainly and offer the ways to start instead.",
  "Never invent a figure. Numbers come from WHAT THE PLATFORM SHOWS, from a file, or from something the person typed. If a number you need is not there, say so in `reply` and list it in `missing` rather than guessing it.",
  "Every item you draft carries its `source`: the file's exact name, \"pasted\", \"platform\", or \"assumed\". Never leave it empty.",
  "`missing` lists input the work genuinely cannot go on without. Leave it empty otherwise. When something is missing, the person may answer \"Assume for me\": then make a reasonable assumption, state each one in `assumptions`, and go on. Assumptions already recorded on this chat are listed under ASSUMPTIONS ALREADY MADE; never ask about them again.",
  "`options` are short quick replies (under six words each) for a question you are actually asking whose answers are distinct choices. Mark at most ONE as recommended. When you ask open questions, or nothing is being asked, leave `options` empty.",
  "`draft` is for a piece of work (a SWOT, a set of directions, a foundation). Leave it empty for conversation. Group items under short titles. Give each item the shape the method asks for: `title` (a short name), `text` (its one-to-two-line description), `evidence` (what it rests on), and `score` (\"3 · Strong\" style) when the method scores items; when the method asks for none of that, `text` alone is enough.",
  "`following` names, in a few words, the part of Forefront's method you are working through on this turn (for example \"Situational Analysis · SWOT\" or \"Foundation · Winning Aspiration\"). Leave it empty when no method part applies.",
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
    ? "\nWAYS TO START (offer these as `options` only when the person has not said how and the conversation has not started on the work; if you can already see enough to start, pick one yourself, say which in `reply`): " + g.roads.join(" · ") + "." +
      (templates.length
        ? " The Template road: the person downloads the blank template from Copilot settings › Templates (" + templates.join(", ") +
          "), fills it in and attaches it here; read an attached filled template as this section's input."
        : " There is no template for this section: if the Template road is chosen, say so and offer another way.")
    : "\nThis section has no set ways to start yet: work from what the person says.";
  const m = method.trim();
  /* The check's break (§460): the method back after the rules, overruled. */
  const old = process.env.SMP_BREAK === "method-last";
  const methodBlock = m
    ? (old
        ? "\n\nFOREFRONT'S METHOD FOR THIS SECTION (follow its rules, limits, examples and bad examples; where it describes a different shape for your answer, the rules above win):\n\n" + m
        : "\n\nFOREFRONT'S METHOD FOR THIS SECTION. It LEADS the conversation: follow its phases and their order, the questions it says to ask, its item counts, limits, scoring and examples, and give each drafted item the fields it asks for. Where it describes an output layout, put that content into the answer's fields below (`reply`, `draft` items with title, text, evidence and score) rather than ignoring it:\n\n" + m)
    : "";
  return old
    ? VOICE + "\n" + HOUSE + "\n\nTHIS SECTION PRODUCES: " + g.produces + roads + methodBlock
    : VOICE + "\n\nTHIS SECTION PRODUCES: " + g.produces + roads + methodBlock +
      "\n\nRULES FOR YOUR ANSWER (these do not bend):\n" + HOUSE;
}
