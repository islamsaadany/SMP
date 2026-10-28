/* ══ TRY THIS ══════════════════════════════════════════════════════════
   One story across the four people: a suggestion goes from the owner to the
   office, into a draft, to the approver, back out as the version in force, and
   on to the staff who read it. Start over puts everything back. */
const STORY = [
  ['hend.todo', 'Hend Mourad · owner', 'Answer the office', 'The office asked Hend about the delivery photo. On To do, press Reply and answer it.'],
  ['hend.p.ORD100.flow', 'Hend Mourad · owner', 'Suggest a change', 'On Order-to-Cash, pick a step on the Flow and press Suggest a change to this step.'],
  ['mona.handle', 'Mona Farag · Strategy Office', 'Pick it up', 'Hend’s reply and Nadia’s suggestion wait in To handle. Open the draft from one of them.'],
  ['mona.b.ORD100.map', 'Mona Farag · Strategy Office', 'Change the draft', 'Edit a step on Map, try Check with AI, look at Preview as manager, then Send for approval.'],
  ['yara.todo', 'Yara Kamal · approver', 'Approve it', 'Order-to-Cash v3 is in Yara’s To do. Read it, then approve it or send it back with a note.'],
  ['mona.handle', 'Mona Farag · Strategy Office', 'Publish it', 'To handle shows v3 approved. Publish puts it in force and asks everyone with a step to read it.'],
  ['dalia.todo', 'Dalia Sabry · staff', 'Read the new version', 'Dalia has a step in Order-to-Cash. To do asks Dalia to read v3; the steps that changed are marked.'],
  ['hend.p.ORD100.summary', 'Hend Mourad · owner', 'See who has read it', 'The Summary shows who has read v3 and who still has to, with a reminder button.'],
  ['mona.priorities.score', 'Also try', 'More to look at', 'On Priorities, open the steps inside Order-to-Cash, flag one and see it in the plan on its own. Send the plan to Yara. Procure-to-Pay came back from Yara, and Store Cash Handling waits for Yara.'],
];
ACT.guide = () => dialog({ title: 'Try this', sub: 'One suggestion, from the owner to the staff who read the new version. Every button works; switch who you are looking as at the top.', wide: true,
  body: '<div class="guide"><ol>' + STORY.map(([g, who, t, d]) => '<li><span><b>' + esc(t) + '</b><small>' + esc(who) + ' · ' + esc(d) + '</small></span><button class="btn" type="button" data-go="' + g + '">Go</button></li>').join('') + '</ol></div><p class="note">What you do is kept while this page stays open. Start over puts every process, suggestion and to-do back where the story begins.</p>',
  foot: '<button class="btn" type="button" data-act="startOver">Start over</button><button class="btn gold" type="button" data-act="close">Close</button>' });
ACT.startOver = () => {
  seed();
  Object.assign(UI, { sel: null, q: '', sort: ['name', 1], rq: '', rsort: ['name', 1], filt: null, undo: [], from: null, bsec: null, chosen: null, cpick: false, openSteps: {}, openQuiet: {}, openSubs: {} });
  closeLayer(); go(UI.as + '.' + home(UI.as));
  toast('Started over: every process, suggestion and to-do is back where the story begins.');
};
