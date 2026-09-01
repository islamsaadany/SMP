/* ── Task recipes ─────────────────────────────────────────────────────────
   The knowledge base explains how things WORK. These explain how to DO things,
   which is what somebody types into a bubble in the corner — and until now the
   platform had almost none of it: four mentions of pressing anything across
   693 lines of PAGE_INFO.

   DATA, NOT A RENDER FUNCTION, and that is the whole reason this file exists
   rather than another `kbSection()` call. `scripts/extract-kb.js` reads it
   straight into `db/kb.json` for the assistant, so the words a person reads on
   the Knowledge base page and the words the assistant answers from are the
   same words (§42: never a second copy of a rule, applied to prose).

   THE VOICE, settled with Islam: concise — the answer, then what to do next.
   A recipe that REFUSES something keeps one clause of WHY. A bare "not
   yourself" reads as the software being obstructive; "not yourself — a plan
   you're measured against isn't yours to rewrite" reads as a decision somebody
   made on purpose. Twelve of these refuse something, and those twelve are the
   ones people will be annoyed by.

   `who` IS RELEVANCE, NEVER PERMISSION. "office" means the answer is only
   useful to somebody who can do it — every word here is readable by everyone,
   because the knowledge base is (`c_kb`, area "always"). A question with two
   true answers is TWO entries sharing a `q`, and the assistant picks by the
   asker's roles. The moment a tag is used to hide something it has become
   authorisation by prose, and that is a different feature (spec 016 §3).

   NO SECTION NUMBERS AND NO INTERNAL VOCABULARY: these are read by somebody
   who has just hit a wall. The tenant's own words for a pillar and a business
   unit are substituted at render time by L(). */
var RECIPES = [

{ g: "Reporting", items: [
  { id: "report-a-figure", q: "How do I report a figure?",
    a: "Open your unit, go to <b>Performance</b>, and press <b>Report</b>. That turns the " +
       "page into a reporting form: each measure takes its actual, and a note if it needs one." +
       "|<b>Save draft</b> keeps what you have typed without telling anyone. <b>Submit</b> " +
       "sends it to the office." },
  { id: "draft-vs-submit", q: "What is the difference between Save draft and Submit?",
    a: "A draft is yours — saved, and nobody is told. Submitting hands the figures to the " +
       "office and marks your unit as having reported for the cycle." +
       "|Draft as often as you like; submit once the whole set is right." },
  { id: "report-after-lock", q: "Can I still report once the cycle is locked?",
    a: "No — once the office locks a cycle the figures are fixed. That is what makes a closed " +
       "cycle a record of what was true at the time rather than something that keeps moving." +
       "|If a number is wrong, say so here. The office can still correct it." },
  { id: "someone-elses-figure", q: "Why is one of my figures somebody else's to enter?",
    a: "Some numbers belong to a team rather than to the unit that reports them — revenue " +
       "exists in Finance before anyone asks you for it. Those are grouped into a named " +
       "<b>figure set</b>, and the set's <b>figure owner</b> enters them wherever they appear." +
       "|It still counts towards your unit's total, so you can chase it. The page names who owes it." },
  { id: "dash-not-zero", q: "Why does my score show a dash instead of 0?",
    a: "Nothing has been reported for it yet. A dash means <i>not yet measurable</i>; 0 would " +
       "mean a real result of nothing, and would pull your average down." +
       "|Report an actual and the score appears." },
  { id: "figure-note", q: "How do I add a note to a figure, and who reads it?",
    a: "The note sits beside the actual on the reporting form. The office reads it, and it " +
       "travels with the figure into the review." +
       "|Use it for the thing a number cannot say — why it moved, or what happens next." },
  { id: "submitted-by-mistake", q: "I submitted by mistake — what now?",
    a: "Tell the office here. Submitting is how a unit speaks for itself, so it is not " +
       "something you can quietly take back, but the office can reopen it for you." },
  { id: "the-dot", q: "What is the dot beside Performance?",
    a: "It means this subject owes a submission and you are able to make it. It clears when " +
       "you submit." +
       "|If you cannot report, you never see it — the platform does not nag somebody who has " +
       "no control that would clear it." },
  { id: "who-reports", q: "Who reports my unit's figures?",
    a: "Your unit's <b>strategy custodian</b> or its <b>head</b>. Submitting speaks for the " +
       "whole unit, so it stays with the people who hold it." +
       "|Two exceptions: a figure that belongs to a figure set is entered by that set's owner " +
       "wherever it appears, and the office can report on anyone's behalf." }
]},

{ g: "My plan", items: [
  { id: "plan-mistake", q: "There is a mistake in my plan — how do I fix it?",
    a: "Not yourself. Plans are corrected by the Strategy Office — a plan you are measured " +
       "against is not yours to rewrite." +
       "|Tell them here what is wrong. That covers the aspiration and the SWOT too, not only " +
       "the measures." },
  { id: "add-a-row", q: "How do I add a {pillar}, a measure or a tactic?",
    a: "The office adds them, on your unit's <b>Plan</b> page. Ask here and say where it " +
       "belongs and what it should be called." },
  { id: "reorder", q: "How do I reorder my {pillars}?",
    a: "Press the arrange control in the top-right of the Plan pane, drag the rows by the " +
       "handles that appear, and press it again when you are done." +
       "|The order carries through to Performance and Reporting on its own." },
  { id: "who-edits-plan", q: "Who can edit my unit's plan, and why not me?",
    a: "The Strategy Office. A plan is the agreement you are measured against, so it stays " +
       "with the people who keep the agreement rather than with either side of it." +
       "|Everything else — reading it, reporting against it, explaining a figure — is yours." },
  { id: "plan-arrives", q: "How does a plan arrive in the first place?",
    a: "It is authored once, by the office, and everything after that is reporting against it." +
       "|If yours is missing or wrong, ask here." },
  { id: "old-plan", q: "What happens to my old plan when a new one is uploaded?",
    a: "It is archived, not deleted, and it can be restored. Nothing an import does is a deletion." },
  { id: "collaborator", q: "What is a collaborator on a tactic?",
    a: "Somebody who supports the tactic alongside the person accountable for it. It records " +
       "who is involved — it does not by itself let them report the line." +
       "|The office sets them." },
  { id: "change-targets", q: "Can I change my targets during the year?",
    a: "Not yourself, and the office will usually say no mid-cycle — a target that moves while " +
       "it is being measured stops being a target." +
       "|If something genuinely changed, say what and why here." }
]},

{ g: "Understanding the numbers", items: [
  { id: "headline", q: "How is my unit's headline number worked out?",
    a: "From your <b>key objectives</b> — each actual against its target." +
       "|Not from the {pillars} below, which is why the two can disagree without either being " +
       "wrong. They sit at different altitudes." },
  { id: "pillar-vs-objectives", q: "Why does a {pillar} disagree with my objectives?",
    a: "A {pillar}'s measures are internal to that {pillar}; your objectives are what the unit " +
       "is judged on. A {pillar} can struggle while the objectives are fine." +
       "|The platform keeps them apart rather than blending them into one number that answers " +
       "neither." },
  { id: "execution", q: "What is execution, and why is 100% not “finished”?",
    a: "It is what has been delivered divided by what should have been delivered <b>by now</b>, " +
       "worked out from each tactic's quarters." +
       "|So 100% means exactly on plan, not complete." },
  { id: "colours", q: "What do the colours mean?",
    a: "One scale for every figure judged against a benchmark: on track from 85%, needs " +
       "attention from 70%, at risk from 50%, off track below that." +
       "|The colour and the word come from the same place, so they can never disagree." },
  { id: "focus-measure", q: "What is a focus measure?",
    a: "One the CEO has marked as a measure the year turns on. It changes no score — it changes " +
       "what gets looked at first." },
  { id: "reward-line", q: "What is the reward line?",
    a: "The point at which delivering the commitment earns. At 100% it is the target itself; " +
       "set higher, a measure can meet its target without clearing the line and reads as " +
       "<i>met, not earning</i>." +
       "|Either way it is scored against its own target exactly as before." },
  { id: "unit-to-group", q: "How does my unit's number reach the group's?",
    a: "Weighted, not averaged. Each unit carries a weight set on the group's <b>Weighting</b> " +
       "tab, and the group's figure is the weighted average of the unit headlines." +
       "|Position on the page is not weight — arranging changes nothing." }
]},

{ g: "Capabilities and projects", items: [
  { id: "add-project", q: "How do I add a project to a capability?", who: "office",
    a: "On the capability's <b>Projects</b> page, with the pen open. Projects belong to the " +
       "supporting function that owns the capability." },
  { id: "add-project-ask", q: "How do I add a project to a capability?", who: "everyone",
    a: "The office adds them. Say which capability it belongs to and what it should be called." },
  { id: "deliverable-or-outcome", q: "Deliverable or outcome — which is this?",
    a: "A <b>deliverable</b> is a thing you produce; an <b>outcome</b> is a change you can " +
       "measure. If it has a target and a direction, it is an outcome." +
       "|Both are evidence, and the score reads them as two halves." },
  { id: "project-performance", q: "How is a project's performance worked out?",
    a: "Half from its deliverables and half from its outcomes. Where a project has only one of " +
       "the two, that side carries the whole score." },
  { id: "no-outcomes", q: "Why has my project no outcomes section?",
    a: "Because it has none yet. An empty half is not drawn — a project with no outcomes is a " +
       "plan that committed to no measurable change, not a broken screen." +
       "|Open the pen and both halves appear, so you can add the first one." }
]},

{ g: "Getting at things", items: [
  { id: "password", q: "How do I change my password?",
    a: "Ask the office here and they issue a temporary one; you choose your own the moment you " +
       "use it." +
       "|<i>If you have forgotten it you cannot reach this chat at all — you are asking from " +
       "inside the platform. Ask the office by any other route you have.</i>" },
  { id: "other-unit", q: "Why can't I open another business unit?",
    a: "Access is by page: a unit you are not attached to is removed, not trimmed. You see what " +
       "your role is attached to." +
       "|Need something you can't open? Ask here — granting it is the office's to do." },
  { id: "my-role", q: "What does my role let me do?",
    a: "It depends on what it is attached to as much as what it is called — holding a unit " +
       "gives you that unit, not all of them. Hold several roles and you get the most generous " +
       "answer of them, each about its own thing." +
       "|The <b>Access</b> section above has the full picture." },
  { id: "get-access", q: "How do I get access to something I cannot open?",
    a: "Ask here, and say which page and why. Access is the office's to grant." }
]},

{ g: "The office's own work", who: "office", items: [
  { id: "add-person", q: "How do I add somebody to the register?",
    a: "<b>Setup › People</b>, on the register itself. Give them an employee number or an " +
       "email — a name is not an identifier, and two people really can share one." },
  { id: "people-file", q: "How do I upload the people file?",
    a: "<b>Setup › People</b>, from the register's file menu. It <b>adds and amends and " +
       "never removes</b> — nobody is retired by being left out of a file." +
       "|Anything it cannot match is set aside for you to answer rather than guessed at." },
  { id: "new-cycle", q: "How do I open a new reporting cycle?",
    a: "<b>Setup › Running the cycle</b>. Opening one archives the figures and then clears " +
       "them, so every unit is asked again rather than inheriting last quarter's answers." },
  { id: "run-review", q: "How do I run a review, or present one?",
    a: "On a unit's <b>Performance</b> page — <b>Report</b> to enter figures, " +
       "<b>Presentation</b> to project the deck or to manage its slides." },
  { id: "picture-slide", q: "How do I put a picture into the review deck?",
    a: "Under <b>Presentation › Manage slides</b>. Pick where it goes and it is assembled " +
       "into the deck when the deck opens." +
       "|It belongs to the cycle, so it is archived with the figures." },
  { id: "branding", q: "How do I set the colours and the logo?",
    a: "<b>Setup › Branding</b>. The mark must be a PNG — an uploaded SVG can carry code, " +
       "which is not a risk worth taking for a logo." },
  { id: "focus-switch", q: "How do I turn focus measures off?",
    a: "<b>Setup › Focus measures</b>, on the button in the page header. Off hides them " +
       "everywhere and keeps every mark, so turning it back on restores them." }
]},

{ g: "The platform itself", items: [
  { id: "offline", q: "Does it work with no internet, and can I install it?",
    a: "Yes to both. It is a single page and it keeps itself, so it opens offline, and your " +
       "browser will offer to install it with its own icon and window." +
       "|What it cannot do offline is save — anything typed goes up when you are back." },
  { id: "where-data", q: "Where does my data live?",
    a: "In a database belonging to this deployment. Figures, plans and people are stored there; " +
       "what you have chosen on screen — light or dark, which columns you show — stays in your " +
       "own browser." }
]}

];

/* How many, asked in one place so the page's header and any check agree. */
function recipeCount(){
  return RECIPES.reduce(function(n, g){ return n + g.items.length; }, 0);
}

/* Every recipe flat, with its group and audience resolved — the shape both the
   page and `scripts/extract-kb.js` want, so neither walks the nesting itself. */
function recipesFlat(){
  var out = [];
  RECIPES.forEach(function(g){
    g.items.forEach(function(r){
      out.push({ id: r.id, group: g.g, q: r.q, a: r.a, who: r.who || g.who || "everyone" });
    });
  });
  return out;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { RECIPES: RECIPES, recipeCount: recipeCount, recipesFlat: recipesFlat };
}
