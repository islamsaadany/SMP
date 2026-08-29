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
   made on purpose. A good few of these refuse something, and those are the
   ones people will be annoyed by.

   A REFUSAL THAT HAS STOPPED BEING ABSOLUTE MUST SAY SO. This file sat
   unchanged from §103 to §148 while the platform learned to open a plan's
   Strategy half to a role (§117) and to let somebody fill only what is empty
   (§145) — so five answers went on saying a flat "the office" about something
   the office can now hand over. A recipe is a promise about behaviour, and a
   promise nobody revisits is the one a client reads out in a meeting: when a
   rule gains an exception, the recipe that states the rule is part of the
   change.

   `who` IS RELEVANCE, NEVER PERMISSION. "office" means the answer is only
   useful to somebody who can do it — every word here is readable by everyone,
   because the knowledge base is (`c_kb`, area "always"). A question with two
   true answers is TWO entries sharing a `q`, and the assistant picks by the
   asker's roles. The moment a tag is used to hide something it has become
   authorisation by prose, and that is a different feature (spec 016 §3).

   NO SECTION NUMBERS AND NO INTERNAL VOCABULARY: these are read by somebody
   who has just hit a wall. The tenant's own words for a pillar and a business
   unit are substituted at render time by L().

   AND THE LABEL IS NEVER INFLECTED (§107.8, and see recipeText). `bu` for a
   pillar is "Pillars" — already plural, with no singular anywhere for a
   sentence to reach for — so every sentence here takes `{pillar}` exactly as
   it comes and is phrased to accept a plural noun. Where the ROLE is meant,
   "Pillar owner" is written literally: that is its name on Roles & access and
   it is not a tenant label.

   REWRITTEN WITH ISLAM, 2026-08-29. He softened every answer and settled the
   ten places where the shipped wording did not match the build — the reopen
   button, the arrows that are not called Arrange, who submits, where a
   project's Owner is set, the thresholds a tenant can change, and what
   offline really does. The record of each decision is in the decisions
   document; what is here is the outcome. */
var RECIPES = [

{ g: "Reporting", items: [
  { id: "report-a-figure", q: "How do I report a figure?",
    a: "Open your unit, go to Performance, and select Report. The page will switch " +
       "to a reporting form where you can enter the actual for each measure and " +
       "add a note where needed. Save draft lets you save your progress without " +
       "submitting it. When everything is ready, select Submit to send the report " +
       "to the Strategy Office." },
  { id: "draft-vs-submit", q: "What is the difference between Save draft and Submit?",
    a: "Save draft saves your progress without submitting it to the Strategy " +
       "Office. You can save a draft as often as needed. Submit sends the " +
       "completed figures to the Strategy Office and marks your unit as reported " +
       "for the cycle." },
  { id: "report-after-lock", q: "Can I still report once the cycle is locked?",
    a: "Once a reporting cycle is locked, its figures can no longer be edited " +
       "directly. This keeps the closed cycle as an accurate record of what was " +
       "reported at the time.|If you notice something that needs correcting, let " +
       "the Strategy Office know here and they can help update it." },
  { id: "someone-elses-figure", q: "Why is one of my figures somebody else's to enter?",
    a: "Some figures are managed centrally by another team. For example, a revenue " +
       "figure may be owned by Finance even when it contributes to your unit's " +
       "performance. These figures are grouped into a figure set, and its figure " +
       "owner is responsible for entering them wherever they appear. The figure " +
       "still contributes to your unit's results, and the page shows who is " +
       "responsible for reporting it." },
  { id: "dash-not-zero", q: "Why does my score show a dash instead of 0?",
    a: "A dash means the measure is not yet measurable because no actual has been " +
       "reported. A score of 0 would mean an actual result of zero and would " +
       "affect the average.|Once an actual is reported, the score will appear." },
  { id: "figure-note", q: "How do I add a note to a figure, and who reads it?",
    a: "Add the note beside the actual on the reporting form. The Strategy Office " +
       "can see it, and it will stay with the figure during the review.|Notes are " +
       "useful for adding context the number alone cannot provide, such as why " +
       "performance changed or what happens next." },
  { id: "submitted-by-mistake", q: "I submitted by mistake — what now?",
    a: "Press <b>Reopen my report</b> on the Performance page — it sits beside the " +
       "Submitted badge — then correct the figures and submit again.|If the cycle " +
       "has been locked, or you are not your unit's head or strategy custodian, " +
       "that button is not there: ask the Strategy Office here and they can reopen " +
       "it for you." },
  { id: "the-dot", q: "What is the dot beside Performance?",
    a: "The dot means there is a report waiting to be submitted and you have " +
       "permission to submit it. It disappears once the report is submitted.|If " +
       "you don't have reporting access, the dot won't appear for you." },
  { id: "who-reports", q: "Who reports my unit's figures?",
    a: "Your unit's strategy custodian or head can report and submit its figures. " +
       "Figures that belong to a figure set are entered by that figure set's owner " +
       "wherever they appear. The Strategy Office can also report on behalf of a " +
       "unit when needed." },
  { id: "needs-a-pct", q: "A row says Needs a % — what does it want?",
    a: "The row is marked In progress, but its progress percentage is still " +
       "missing. Enter the percentage completed so the platform can calculate the " +
       "result accurately. Until then, the row is left out of the average and will " +
       "need to be completed before submitting." },
  { id: "function-submit", q: "How does a supporting function submit its report?",
    a: "A supporting function submits from its Reporting page, just like a " +
       "business unit. One submission covers all the capabilities owned by that " +
       "function.|Before submitting, make sure any at risk or off track figures " +
       "have the required notes and that all In progress rows include a progress " +
       "percentage." },
  { id: "run-review", q: "How do I run a review, or present one?",
    a: "From the unit's Performance page, use Report to enter or review figures " +
       "and Presentation to open the presentation deck or manage its slides." },
  { id: "picture-slide", q: "How do I put a picture into the review deck?",
    a: "Go to Presentation › Manage slides, add the image and choose where you " +
       "want it to appear. It will be included when the presentation deck opens. " +
       "The image belongs to that reporting cycle and will be archived with it." }
]},

{ g: "My Plan", items: [
  { id: "plan-mistake", q: "There is a mistake in my plan — how do I fix it?",
    a: "If you spot something that needs correcting, let the Strategy Office know " +
       "here and they can update it. This applies to the full plan, including the " +
       "aspiration, SWOT and measures. Depending on your access, the Strategy " +
       "Office may also allow your role to edit Strategy pages directly or use " +
       "Fill gaps, which lets you complete information that is currently missing." },
  { id: "add-a-row", q: "How do I add {pillar}, measures or tactics?",
    a: "New {pillar}, measures and tactics are normally added by the Strategy " +
       "Office on your unit's Plan page. Let them know here what you would like to " +
       "add and where it belongs." },
  { id: "reorder", q: "How do I reorder my {pillar}?",
    a: "Select the up-and-down arrows in the top-right of the Plan pane, then drag " +
       "the rows into the order you want. Select them again when you're done.|The " +
       "new order will automatically carry through to Performance and Reporting." },
  { id: "who-edits-plan", q: "Who can edit my unit's plan, and why not me?",
    a: "By default, the Strategy Office manages edits to the plan to keep the " +
       "agreed strategy consistent. Your access can also be extended to allow full " +
       "Strategy editing or Fill gaps, which lets you complete missing " +
       "information. Reporting access is managed separately, so being able to " +
       "report does not automatically mean you can edit the plan." },
  { id: "plan-arrives", q: "How does a plan arrive in the first place?",
    a: "The Strategy Office creates the plan either by uploading the template or " +
       "building it directly through the platform's Plan pages. Once the plan is " +
       "in place, reporting is done against it.|If anything is missing or " +
       "incorrect, let the Strategy Office know here." },
  { id: "old-plan", q: "What happens to my old plan when a new one is uploaded?",
    a: "It is archived, not deleted, and can be restored if needed. Uploading a " +
       "new plan does not delete the previous one." },
  { id: "collaborator", q: "What is a collaborator on a tactic?",
    a: "A collaborator is someone who supports a tactic alongside the person " +
       "accountable for it. Collaborators are selected from the people register to " +
       "ensure each person is correctly identified. Being named as a collaborator " +
       "does not automatically provide reporting access; the Strategy Office also " +
       "needs to enable Reporting for Contributors." },
  { id: "change-targets", q: "Can I change my targets during the year?",
    a: "Targets are normally kept unchanged during a reporting cycle so " +
       "performance can be measured consistently against what was originally " +
       "agreed. If circumstances have changed and you believe a target should be " +
       "reviewed, let the Strategy Office know here and explain what has changed." }
]},

{ g: "Filling in what's missing", items: [
  { id: "fill-what", q: "What does Fill in missing elements do?",
    a: "Fill in missing elements lets you complete information that has not yet " +
       "been added to the plan, such as a missing target, owner or tactic quarter. " +
       "It only applies to empty fields, so existing information remains " +
       "unchanged. Anything you add stays pending until the Strategy Office " +
       "confirms it." },
  { id: "fill-what-not", q: "What can I not change while I am filling gaps?",
    a: "Fill gaps is designed only for information that is currently missing. You " +
       "won't be able to change existing values or add, remove, rename or reorder " +
       "rows.|If something already entered needs correcting, let the Strategy " +
       "Office know here." },
  { id: "fill-find", q: "How do I find what is missing?",
    a: "The red bar on each section shows how many items are missing. Select one " +
       "of the chips to go directly to that item.|Once you start filling gaps, you " +
       "can use Next gap to move through the missing items one by one." },
  { id: "fill-pending", q: "Why does the value I filled say pending?",
    a: "A value you add through Fill gaps stays pending until the Strategy Office " +
       "confirms it. While it's pending, you can still update or clear it.|If the " +
       "value affects a score, that score will wait until the value is confirmed." },
  { id: "fill-dash", q: "I filled the target — why is the score still a dash?",
    a: "If you have just filled in the target, it is entered but still pending " +
       "confirmation. Because the score depends on that target, it stays a dash " +
       "until the Strategy Office confirms it.|You can continue entering figures " +
       "and saving drafts in the meantime." },
  { id: "fill-submit", q: "Why won't it let me submit — something is awaiting confirmation?",
    a: "One or more values used to calculate the report are still awaiting " +
       "confirmation. The submission message will show which rows are affected. " +
       "Once the Strategy Office confirms those values, you'll be able to " +
       "submit.|You can continue reporting and saving drafts in the meantime." },
  { id: "fill-confirm", q: "How do I confirm what somebody filled in?", who: "office",
    a: "Select the tick beside the amber pending mark to confirm the value. You " +
       "can also edit the value if a correction is needed; saving the correction " +
       "will confirm it at the same time. The page shows how many items are still " +
       "waiting for confirmation." }
]},

{ g: "Owners and reporting permissions", items: [
  { id: "project-owner", q: "What is a project owner?",
    a: "A project owner is the person named as the project's Owner. To report on " +
       "the project, two things need to be in place: you must be named as the " +
       "Owner, and Reporting must be enabled for Project owners under Roles & " +
       "access. When both are enabled, you can report on the full project." },
  { id: "pillar-owner", q: "What is a Pillar owner?",
    a: "A Pillar owner is the person named as the Owner of one of your {pillar}. " +
       "They report everything inside it — its measures and its tactics — when " +
       "Reporting is enabled for Pillar owners under Roles &amp; access." },
  { id: "contributor-role", q: "What is a contributor?",
    a: "A contributor is someone named within a plan to contribute to a specific " +
       "item, such as a tactic, project or milestone. If Reporting is enabled for " +
       "Contributors, they can report on the specific rows where they are " +
       "named.|Submission remains with the person responsible for the overall unit " +
       "or function." },
  { id: "owner-cant-report", q: "I own a project and still cannot report it — why?",
    a: "Check two things: that you are named as the project's Owner on the " +
       "project, and that Reporting is enabled for Project owners under Roles " +
       "&amp; access.|If either needs updating, let the Strategy Office know here " +
       "and mention the project." },
  { id: "some-rows-only", q: "Why can I enter some rows on this page and not others?",
    a: "Your reporting access may apply to specific parts of the page rather than " +
       "the whole plan. For example, Project owners can report on their projects, " +
       "Pillar owners on their {pillar}, and Contributors on the rows where they " +
       "are named.|You can still view the other rows. If you think you should be " +
       "able to report on a particular row, let the Strategy Office know here." },
  { id: "owner-from-register", q: "Why is Owner a list of people rather than a box to type in?",
    a: "Owners are selected from the people register so the platform can correctly " +
       "connect each person to their reporting permissions. This also avoids " +
       "issues caused by different spellings of the same name. Existing names " +
       "imported from older plans are preserved so the plan continues to display " +
       "as originally uploaded." }
]},

{ g: "Understanding the numbers", items: [
  { id: "headline", q: "How is my unit's headline number worked out?",
    a: "Your unit's headline number is calculated from its key objectives, " +
       "comparing each actual against its target. Performance for your {pillar} is " +
       "calculated separately, so the two numbers may differ without either being " +
       "incorrect." },
  { id: "pillar-vs-objectives", q: "Why do my {pillar} disagree with my objectives?",
    a: "Each of your {pillar} scores on the measures inside it, while your " +
       "objectives are the overall results the unit is measured against. Because " +
       "they measure different things, the two can differ without either being " +
       "wrong." },
  { id: "execution", q: "What is execution, and why is 100% not “finished”?",
    a: "Execution compares what has been delivered with what was planned to be " +
       "delivered by now, based on each tactic's scheduled quarters. So 100% means " +
       "you're exactly on plan at this point in time, not necessarily that the " +
       "tactic is complete." },
  { id: "colours", q: "What do the colours mean?",
    a: "The colours give a quick view of performance against the benchmark. By " +
       "default: On track from 85%, Needs attention from 70%, At risk from 50%, " +
       "and Off track below 50% — and the Strategy Office can change these " +
       "thresholds for your organisation.|The colour and the status word always " +
       "come from the same scale, so they can never disagree." },
  { id: "focus-measure", q: "What is a focus measure?",
    a: "A focus measure is a measure the CEO has identified as particularly " +
       "important for the year. It doesn't change how the score is calculated; it " +
       "simply highlights the measures that should receive additional attention." },
  { id: "reward-line", q: "What is the reward line?",
    a: "The reward line is the performance level at which a measure becomes " +
       "eligible for reward. If it's set at 100%, it matches the target. If it's " +
       "set higher, a measure can meet its target without yet reaching the reward " +
       "line. The measure's performance score is still calculated against its " +
       "original target." },
  { id: "unit-to-group", q: "How does my unit's number reach the group's?",
    a: "Unit results contribute to the group's result based on their assigned " +
       "weight rather than through a simple average. Each unit's weight is set on " +
       "the group's Weighting tab. Changing the order of units on the page does " +
       "not affect their weight." }
]},

{ g: "Capabilities and projects", items: [
  { id: "add-project", q: "How do I add a project to a capability?", who: "office",
    a: "On the capability's <b>Projects</b> page, with the pen open. Projects " +
       "belong to the supporting function that owns the capability." },
  { id: "add-project-ask", q: "How do I add a project to a capability?",
    a: "The Strategy Office can add a project to a capability for you. Let them " +
       "know which capability it belongs to and what the project should be called." },
  { id: "deliverable-or-outcome", q: "Deliverable or outcome — which is this?",
    a: "A deliverable is something the project produces, while an outcome is a " +
       "measurable change the project is expected to achieve. If an item has a " +
       "target and direction, it's treated as an outcome. Both contribute to the " +
       "project's performance score." },
  { id: "project-performance", q: "How is a project's performance worked out?",
    a: "A project's performance is calculated equally from its deliverables and " +
       "outcomes. If the project has only one of the two, that component carries " +
       "the full score." },
  { id: "no-outcomes", q: "Why has my project no outcomes section?",
    a: "The Outcomes section is hidden when a project doesn't have any outcomes " +
       "yet. If you have editing access, open the Edit control and both sections " +
       "will appear so you can add the first outcome." },
  { id: "repeating-project", q: "What does Repeats: Each cycle mean on a project?",
    a: "Repeats: Each cycle means the project starts a new reporting period with " +
       "each cycle rather than being completed once. When a new cycle opens, the " +
       "previous figures are archived, the reporting fields are cleared, and the " +
       "project dates move forward based on the cycle length. Projects without " +
       "this setting keep their existing figures." }
]},

{ g: "Access and navigation", items: [
  { id: "strategy-vs-reporting", q: "My access says Strategy and Reporting separately — what is the difference?",
    a: "Strategy controls access to the plan itself, including the foundation, " +
       "SWOT and strategic plan. Reporting controls access to performance figures, " +
       "drafts and submissions. They are managed separately, so you may be able to " +
       "report against a plan without being able to edit it. Strategy access can " +
       "also include Fill gaps, which allows you to complete missing information " +
       "without changing existing content." },
  { id: "other-unit", q: "Why can't I open another business unit?",
    a: "Your access is based on the business units connected to your role, so " +
       "units you don't have access to won't appear for you. If you need access to " +
       "another unit, let the Strategy Office know here and they can review your " +
       "access." },
  { id: "my-role", q: "What does my role let me do?",
    a: "What you can do depends on both your role and what that role is connected " +
       "to. For example, being assigned to one unit gives you access to that unit, " +
       "not automatically to every unit.|If you hold multiple roles, your " +
       "permissions are combined across the areas each role covers." },
  { id: "get-access", q: "How do I get access to something I cannot open?",
    a: "Let the Strategy Office know here which page you need access to and why. " +
       "They can review the request and update your access where appropriate." }
]},

{ g: "The platform and support", items: [
  { id: "ask-the-office", q: "How do I ask the Strategy Office something?",
    a: "Use the chat bubble in the bottom-right corner of any page to contact the " +
       "Strategy Office. Your questions and their replies stay together in one " +
       "ongoing conversation, so you can easily refer back to previous " +
       "messages.|You can also attach screenshots when helpful." },
  { id: "assistant-answer", q: "Something answered me straight away — was that a person?",
    a: "That was the platform assistant. When enabled, it will first try to answer " +
       "your question using the platform's knowledge base. If the answer doesn't " +
       "address what you need, select This didn't answer it — send it to the " +
       "office and someone from the Strategy Office can pick it up. Questions the " +
       "assistant can't answer are sent to them automatically." },
  { id: "welcome-screen", q: "What is the screen I get when I sign in?",
    a: "The welcome screen gives you a quick view of anything that needs your " +
       "attention, such as a report to submit, missing plan information or a reply " +
       "from the Strategy Office. Each item includes a shortcut to take you " +
       "directly to it.|Select Continue to enter the platform." },
  { id: "take-the-tour", q: "Can I see the introduction again?",
    a: "Yes. The welcome screen offers <b>Take an intro round</b>, and it appears " +
       "the next time you sign in — so if you have already moved past it today, " +
       "you will see it again on your next sign-in.|The introduction uses a worked " +
       "example rather than your own data, so you can explore the platform without " +
       "changing or saving anything." },
  { id: "password", q: "How do I change my password?",
    a: "If you're already signed in, ask the Strategy Office here and they can " +
       "issue a temporary password. You'll be asked to choose a new password when " +
       "you use it.|If you can't sign in, contact the Strategy Office through your " +
       "usual support channel." },
  { id: "offline", q: "Does it work with no internet, and can I install it?",
    a: "Yes. The platform can be installed through your browser and can also open " +
       "while you're offline.|Changes cannot be saved without a connection, but " +
       "they will sync once you're back online — as long as you keep the tab open. " +
       "Closing it while offline loses whatever you entered, so it is safest to " +
       "enter figures while connected." },
  { id: "where-data", q: "Where does my data live?",
    a: "Your plans, figures and people data are stored in the database for your " +
       "organization's deployment. Personal display preferences, such as light or " +
       "dark mode and which columns you choose to show, are stored locally in your " +
       "browser." },
  { id: "demo-data", q: "What does Demo data do, and why can't I save in it?",
    a: "Demo data gives you a fully worked example so you can explore how a " +
       "completed platform looks without affecting your organization's data. " +
       "Saving is intentionally disabled in Demo mode. Clear project shows the " +
       "opposite: what a new deployment looks like before information is added." }
]},

{ g: "Strategy Office questions", items: [
  { id: "add-person", q: "How do I add somebody to the register?", who: "office",
    a: "Go to Setup › People and add them to the register. Make sure to include an " +
       "employee number or email as a unique identifier, since more than one " +
       "person may have the same name." },
  { id: "people-file", q: "How do I upload the people file?", who: "office",
    a: "Go to Setup › People and use the register's file menu to upload the people " +
       "file. The upload can add or update people, but it won't remove anyone " +
       "simply because they're missing from the file. Any records the platform " +
       "can't confidently match will be set aside for you to review." },
  { id: "new-cycle", q: "How do I open a new reporting cycle?", who: "office",
    a: "Go to <b>Setup › Running the cycle</b>. A new cycle can only be opened " +
       "once the current one is closed.|Opening one archives the previous cycle's " +
       "figures and clears the reporting fields, so each unit is asked again " +
       "rather than inheriting the last set of answers." },
  { id: "branding", q: "How do I set the colours and the logo?", who: "office",
    a: "Go to Setup › Branding to set the platform colours and logo. Logos should " +
       "be uploaded in PNG format; SVG files aren't supported for security " +
       "reasons." },
  { id: "focus-switch", q: "How do I turn focus measures off?", who: "office",
    a: "Go to Setup › Focus measures and use the control in the page header to " +
       "turn them off. This hides focus measures across the platform without " +
       "removing their settings, so they'll return if you turn the feature back " +
       "on." }
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
