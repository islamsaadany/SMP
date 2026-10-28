/* ══ THE BUILDER HOME ══════════════════════════════════════════════════
   What the Strategy Office lands on: All processes first, To handle second,
   then the office sections as tabs. A section has no title: its tab says where
   you are and its one-line description sits in the band. Its numbers sit in
   boxes under the tabs; its own views stay under the tab bar (not on a phone). */
const PHONE = window.matchMedia('(max-width: 640px)');
PHONE.addEventListener('change', () => render());
const SECS = {
  all: ['All processes', 'Strategy Office · every process, in every state'],
  handle: ['To handle', 'Suggestions from owners, drafts the approver sent back or approved, and processes with gaps.'],
  landscape: ['Landscape', 'How Raya Trade’s processes fit together: today’s Value chain and Helicopter views in one place.', [['chain', 'Value chain'], ['cards', 'Hand-overs'], ['milestones', 'Milestones']]],
  priorities: ['Priorities', 'Which processes the office takes deep next: full steps, RACI, controls and an SOP.', [['score', '1 · Score'], ['rank', '2 · Rank'], ['plan', '3 · Plan'], ['signoff', '4 · Sign-off']]],
  governance: ['Governance', 'The assessment, risks, policies, and the controls that come from each process.', [['attention', 'Needs attention'], ['assessment', 'Assessment'], ['risks', 'Risks'], ['policies', 'Policies'], ['controls', 'Controls'], ['activity', 'Activity']]],
  export: ['Export', 'Pick processes and build the SOP pack: the company, a summary, the org structure, then each process.'],
};
function officeBand(sec) {
  const h = handleFor(), sug = h.filter((x) => x.kind === 'Suggestion' || x.kind === 'Reply').length, ret = procs().filter((p) => p.draft && p.draft.state === 'returned').length, open = procs().filter((p) => p.draft).length, gaps = totalGaps();
  return mast({ eyebrow: 'Raya Trade · Processes · Builder' + (sec !== 'all' ? ' › ' + SECS[sec][0] : ''), title: 'Process builder', sub: esc(sec === 'all' ? 'Strategy Office · ' + procs().length + ' processes · ' + open + ' drafts open · you see every process, in every state' : SECS[sec][1]),
    acts: '<button class="bq" type="button" data-act="lookStaff">Open the staff view</button><button class="bgold" type="button" data-act="newProc">New process</button>',
    tiles: tiles([[sug, sug === 1 ? 'Suggestion' : 'Suggestions', sug ? 'hot' : ''], [ret, 'Returned', ret ? 'late' : ''], [open, 'Drafts'], [gaps, 'Gaps', gaps ? 'late' : '']]) });
}
function officeTabs(sec, sub) {
  const n = handleFor().length;
  return tabBar([['all', 'All processes', procs().length], ['handle', 'To handle', n || '', true], ['landscape', 'Landscape'], ['priorities', 'Priorities'], ['governance', 'Governance'], ['export', 'Export']].map(([k, l, c, hot]) => [k, l, c || '', hot, 'mona.' + k]), sec, sub);
}
function officePage(sec, body, kpis) {
  if (!isOffice()) return R.list();
  const views = SECS[sec][2], v = views ? (views.some((x) => x[0] === UI.args[0]) ? UI.args[0] : views[0][0]) : null;
  const sv = views ? '<div class="sv" role="tablist" aria-label="' + SECS[sec][0] + ' views">' + views.map(([k, l]) => '<button type="button" role="tab" class="' + (k === v ? 'on' : '') + '" aria-selected="' + (k === v) + '" data-go="mona.' + sec + '.' + k + '">' + l + '</button>').join('') + '</div>' : '';
  const held = views && !PHONE.matches;
  return page(officeBand(sec) + officeTabs(sec, held ? sv : '') + (kpis ? kp(kpis) : '') + (views && !held ? '<div class="svrow">' + sv + '</div>' : '') + body(v));
}
ACT.lookStaff = () => { go('dalia.list'); toast('Now looking as Dalia Sabry, a sales coordinator: what client staff see.'); };

/* ── All processes ── */
R.all = () => officePage('all', () => {
  const q = UI.q.toLowerCase(), [k, dir] = UI.sort;
  const KEY = { name: (p) => p.name, owner: (p) => person(p.owner).name, state: (p) => stateOf(p).rank, ready: (p) => marksOf(p).reduce((a, b) => a + b, 0), gaps: (p) => gapsOf(anyC(p)).length };
  const rows = procs().filter((p) => !q || [p.code, p.name, p.cat, person(p.owner).name, stateOf(p).label].join(' ').toLowerCase().indexOf(q) >= 0)
    .sort((a, b) => { const x = KEY[k](a), y = KEY[k](b); return (typeof x === 'number' ? x - y : x.localeCompare(y)) * dir || a.name.localeCompare(b.name); });
  const th = (key, label) => '<th' + (k === key ? ' aria-sort="' + (dir > 0 ? 'ascending' : 'descending') + '"' : '') + '><button type="button" data-act="sort" data-k="' + key + '">' + label + ' <i>' + (k === key ? (dir > 0 ? '↑' : '↓') : '↕') + '</i></button></th>';
  return '<div class="tbar"><label class="srch"><span class="sr">Search processes</span><input type="search" id="q" value="' + esc(UI.q) + '" placeholder="Search by code, name, area, owner or state" data-inp="q" autocomplete="off"></label><span class="note">' + (q ? rows.length + ' of ' + procs().length + ' processes' : procs().length + ' processes · click a heading to sort') + '</span></div>' +
    '<div class="box tw"><table class="t cards"><thead><tr>' + th('name', 'Process') + th('owner', 'Owner') + th('state', 'Where it is') + th('ready', 'Ready') + th('gaps', 'Gaps') + '<th><span><span class="sr">Open</span></span></th></tr></thead><tbody>' +
    rows.map((p) => { const g = gapsOf(anyC(p)).length; return '<tr><td><span class="code">' + p.code + '</span> <button class="pn" type="button" data-go="mona.b.' + p.code + '.map">' + esc(p.name) + '</button></td><td>' + esc(person(p.owner).name) + '</td><td>' + stPill(p) + '</td><td>' + marksCell(p) + '</td><td class="' + (g ? 'gaps' : 'note') + '">' + (g || '—') + '</td><td><button class="btn" type="button" data-go="mona.b.' + p.code + '.map">Open in builder</button></td></tr>'; }).join('') +
    '</tbody></table>' + (rows.length ? '' : '<p class="empty">No process matches “' + esc(UI.q) + '”. Search looks at the code, name, area, owner and state.</p>') + '</div>';
});
INP.q = (el) => { UI.q = el.value; const pos = el.selectionStart; render(); const n = $('#q'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } };
ACT.sort = (el) => { const k = el.dataset.k; UI.sort = UI.sort[0] === k ? [k, -UI.sort[1]] : [k, k === 'gaps' ? -1 : 1]; render(); };

/* ── To handle ── */
R.handle = () => officePage('handle', () => {
  const h = handleFor();
  if (!h.length) return '<div class="ph"><b>Nothing waiting on the office</b>Suggestions, drafts sent back or approved, and gaps show up here.</div>';
  return '<div class="box">' + h.map((x) => {
    if (x.kind === 'Suggestion' || x.kind === 'Reply') {
      const s = x.s, p = s.code ? byCode(s.code) : null, c = p ? anyC(p) : null, stp = c ? stepById(c, s.step) : null;
      const head = s.code ? '<span class="code">' + s.code + '</span> <b>' + esc(p.name) + '</b>' : '<b>A new process</b>';
      const line = x.kind === 'Reply' ? esc(person(s.by).name) + ' replied to your answer · ' + fmt(s.reply.at) : esc(person(s.by).name) + (s.code ? ' suggested a change' + (stp ? ' to step ' + stepNo(c, s.step) + ', ' + esc(stp.label) : '') : ' asked for a new process') + ' · ' + fmt(s.at);
      const quote = x.kind === 'Reply' ? '“' + esc(s.reply.text) + '” (on: ' + esc(s.text) + ')' : esc(s.text);
      const acts = !s.code ? '<button class="btn" type="button" data-act="answer" data-id="' + s.id + '">Answer</button><button class="btn gold" type="button" data-act="newProc" data-name="' + esc(s.text.split(':')[0]) + '" data-sug="' + s.id + '">Create it</button>'
        : (x.kind === 'Suggestion' ? '<button class="btn" type="button" data-act="answer" data-id="' + s.id + '">Answer</button>' : '<button class="btn" type="button" data-act="sugDone" data-id="' + s.id + '">Mark done</button>') + '<button class="btn gold" type="button" data-act="draftFrom" data-id="' + s.id + '">' + (p.draft ? (s.draftV === p.draft.v ? 'Open draft v' + p.draft.v : 'Add to draft v' + p.draft.v) : 'Start a draft from this') + '</button>';
      return '<div class="trow"><span class="chip ' + (x.kind === 'Suggestion' ? 'gold' : 'navy') + '">' + x.kind + '</span><div class="t1">' + head + '<small>' + line + '</small><blockquote>' + quote + '</blockquote></div><div class="acts">' + acts + '</div></div>';
    }
    if (x.kind === 'Returned') { const p = x.p, d = p.draft; return '<div class="trow"><span class="chip bad">Returned</span><div class="t1"><span class="code">' + p.code + '</span> <b>' + esc(p.name) + '</b><small>' + esc(person(p.approver).name) + ' sent v' + d.v + ' back · ' + fmt(d.returnedAt) + '</small><blockquote>' + esc(d.returnedNote) + '</blockquote></div><div class="acts"><button class="btn gold" type="button" data-go="mona.b.' + p.code + '.life">Open in builder</button></div></div>'; }
    if (x.kind === 'Approved') { const p = x.p, d = p.draft; return '<div class="trow"><span class="chip gold">Approved</span><div class="t1"><span class="code">' + p.code + '</span> <b>' + esc(p.name) + '</b><small>' + esc(d.approvedBy || person(p.approver).name) + ' approved v' + d.v + ' · ' + fmt(d.approvedAt) + '. Publishing puts it in force and asks everyone with a step to read it.</small></div><div class="acts"><button class="btn" type="button" data-go="mona.b.' + p.code + '.life">Open in builder</button><button class="btn gold" type="button" data-act="publish" data-code="' + p.code + '">Publish v' + d.v + '</button></div></div>'; }
    if (x.kind === 'Plan') return '<div class="trow"><span class="chip bad">Returned</span><div class="t1"><b>Deep-dive plan</b><small>' + esc(person(S.plan.approver).name) + ' sent the plan back</small></div><div class="acts"><button class="btn gold" type="button" data-go="mona.priorities.signoff">Open Priorities</button></div></div>';
    return '<div class="trow"><span class="chip">Gaps</span><div class="t1"><b>' + plural(x.list.length, 'process', 'processes') + ' being drawn have gaps</b><small>' + esc(x.list.map((p) => p.name).join(', ')) + '</small></div><div class="acts"><button class="btn" type="button" data-act="sortGaps">See them, most gaps first</button></div></div>';
  }).join('') + '</div>';
});
ACT.sortGaps = () => { UI.sort = ['gaps', -1]; go('mona.all'); };
ACT.answer = (el) => {
  const s = S.suggestions.find((x) => x.id === el.dataset.id);
  dialog({ title: 'Answer ' + esc(person(s.by).name), sub: '“' + esc(s.text) + '”', body: fld('Your answer', '<textarea id="an-text" placeholder="For example: does the photo replace the paper, or come with it?"></textarea>'), foot: foot2('answerGo', 'Send answer', ' data-id="' + s.id + '"') });
};
ACT.answerGo = (el) => {
  const tx = val('an-text'); if (!tx) { toast('Write your answer first.'); return; }
  const s = S.suggestions.find((x) => x.id === el.dataset.id);
  s.answer = { by: 'office', text: tx, at: TODAY }; s.state = 'answered';
  log('Mona Farag answered ' + person(s.by).name + (s.code ? ' on ' + nameOf(s.code) : ''));
  closeLayer(); render(); toast('Sent. It lands in ' + person(s.by).name + '’s To do.');
};
ACT.sugDone = (el) => { const s = S.suggestions.find((x) => x.id === el.dataset.id); s.state = 'closed'; render(); toast('Marked done.'); };
function startDraft(p) {
  const v = (p.inForce || 0) + 1;
  p.draft = { v, state: 'draft', started: TODAY, note: '', c: clone(p.live || { purpose: '', inScope: [], outScope: [], steps: [], conn: [], raci: {}, auth: [], controls: [], kpis: [] }) };
  p.draft.c.steps.forEach((s) => { delete s.changed; });
  log('Mona Farag started ' + p.name + ' draft v' + v);
  return p.draft;
}
ACT.draftFrom = (el) => {
  const s = S.suggestions.find((x) => x.id === el.dataset.id), p = byCode(s.code);
  const d = p.draft || startDraft(p);
  if (!d.note) d.note = 'From ' + person(s.by).name + '’s suggestion';
  s.draftV = d.v; if (s.state === 'new' || s.state === 'replied') s.state = 'in-draft';
  UI.sel = s.step || null;
  go('mona.b.' + p.code + '.map'); toast('Draft v' + d.v + ' is open' + (s.step ? ', on the step the suggestion is about.' : '.'));
};
ACT.newProc = (el) => dialog({ title: 'New process', sub: 'Its code is made from its name.', body: fld('Name', '<input id="np-name" value="' + esc(el.dataset.name || '') + '" placeholder="For example: Supplier onboarding">') + fld('Owner', sel('np-owner', S.people.filter((x) => !x.office).map((x) => [x.id, x.name + ' · ' + roleName(x.roles[0])]), 'p3')) + fld('Area', sel('np-area', [['Finance', 'Finance'], ['Supply Chain', 'Supply Chain'], ['Retail', 'Retail'], ['Commercial', 'Commercial'], ['Care', 'Care'], ['HR', 'HR']], 'Finance')), foot: foot2('newProcGo', 'Create and open it', ' data-sug="' + (el.dataset.sug || '') + '"') });
ACT.newProcGo = (el) => {
  const n = val('np-name'); if (!n) { toast('Give it a name first.'); return; }
  const base = (n.replace(/[^A-Za-z]/g, '').slice(0, 3) || 'NEW').toUpperCase();
  let num = 100; while (byCode(base + num)) num += 100;
  const area = { Finance: 'fin', 'Supply Chain': 'buy', Retail: 'stores', Commercial: 'sell', Care: 'sell', HR: 'fin' }[val('np-area')] || 'fin';
  const p = { code: base + num, name: n, cat: val('np-area'), area, owner: val('np-owner'), approver: 'p1', parent: null, acks: [], nextReview: null, high: true, sop: false, live: null, inForce: null, publishedAt: null, versions: [], ncs: [], draft: null };
  S.processes.push(p); startDraft(p);
  if (el.dataset.sug) { const s = S.suggestions.find((x) => x.id === el.dataset.sug); s.state = 'closed'; s.code = p.code; }
  log('Mona Farag created ' + p.code + ' ' + p.name);
  closeLayer(); go('mona.b.' + p.code + '.map'); toast(p.code + ' ' + n + ' is created. Draw its first step with + Step.');
};
ACT.publish = (el) => {
  const p = byCode(el.dataset.code), d = p.draft;
  p.versions.unshift({ v: d.v, date: TODAY, by: d.approvedBy || person(p.approver).name, note: d.note || 'Changes in v' + d.v });
  p.live = d.c; p.inForce = d.v; p.publishedAt = TODAY; p.draft = null; p.acks = []; p.nextReview = plusYear(TODAY); p.sop = true;
  S.suggestions.filter((s) => s.code === p.code && s.draftV === d.v && s.state !== 'answered').forEach((s) => { s.state = 'closed'; });
  log('Mona Farag published ' + p.name + ' v' + d.v);
  render(); toast(p.name + ' v' + d.v + ' is in force. ' + plural(readersOf(p).length, 'person', 'people') + ' with a step are asked to read it.');
};

/* ── Landscape ── */
const CHAIN = [['Order intake', [['Receive the order', 'ORD100'], ['Confirm the order', 'ORD100'], ['Check credit', 'ORD100'], ['Set the price', 'PRI100']]], ['Fulfilment', [['Buy stock', 'PRO100'], ['Count stock', 'INV100'], ['Pick and pack', 'ORD100'], ['Deliver', 'LOG100']]], ['Billing & cash', [['Invoice', 'ORD100'], ['Collect payment', 'CRE100'], ['Pay suppliers', 'PRO100'], ['Bank store cash', 'STO100']]], ['Close & report', [['Close the month', 'REC100'], ['Report to the board', 'REC100']]]];
const LINKS = [['PRI100', ['ORD100']], ['ORD100', ['LOG100', 'CRE100', 'REC100']], ['PRO100', ['INV100', 'REC100']], ['INV100', ['REC100']], ['LOG100', []], ['CRE100', ['REC100']], ['STO100', ['REC100']], ['NEW100', ['STO100', 'HIR100']], ['REC100', []], ['HIR100', []], ['CUS100', ['ORD101']]];
R.landscape = () => officePage('landscape', (v) => {
  if (v === 'chain') return '<div class="chain">' + CHAIN.map(([ph, acts]) => '<div class="col"><h4>' + ph + '<span class="note">' + acts.length + '</span></h4>' + acts.map(([a, c]) => '<div class="card">' + esc(a) + '<small>' + pn(c) + '</small></div>').join('') + '</div>').join('') + '</div>';
  if (v === 'cards') return '<div class="cols">' + LINKS.map(([c, to]) => { const from = LINKS.filter((l) => l[1].indexOf(c) >= 0).map((l) => l[0]); return '<div class="col"><b>' + pn(c) + '</b><p class="note" style="margin-top:4px">' + (from.length ? 'Picks up from ' + from.map(nameOf).join(', ') : 'Starts here') + '</p><p class="note">' + (to.length ? 'Hands over to ' + to.map(nameOf).join(', ') : 'Ends here') + '</p></div>'; }).join('') + '</div>';
  return '<div class="box" style="padding:14px 16px"><div class="mil">' + procs().filter((p) => p.live).map((p) => '<div class="mrow2"><div>' + pn(p.code) + '</div><div class="rail2">' + tasks(p.live).map((s, i) => '<span class="' + (i === 0 || s.type === 'DECISION' || i === tasks(p.live).length - 1 ? 'm' : '') + '"><em>' + esc(s.label) + '</em></span>').join('') + '</div></div>').join('') + '</div><p class="note" style="margin-top:10px">Gold marks a milestone step.</p></div>';
}, [[procs().length, 'Processes'], [CHAIN.length, 'Phases'], [CHAIN.reduce((n, c) => n + c[1].length, 0), 'Activities'], [LINKS.reduce((n, l) => n + l[1].length, 0), 'Hand-overs']]);

/* ── Priorities ── */
const DEC = { W1: 'Wave 1', W2: 'Wave 2', LATER: 'Later', HIGH: 'Stays high-level' };
const prioScore = (r) => { const W = S.plan.weights; return Math.round((r[1] * W.imp + r[3] * W.risk + r[2] * W.cx) / 5); };
/* steps inside a process: what the map notices on a step, the office's flag and the step's own score (main §601–§610) */
const stepKey = (code, sid) => code + ':' + sid;
function noticed(c, s) {
  const n = [];
  if (s.type === 'DECISION') n.push('Decision point');
  controlsOf(c, s.id).filter((k) => k.level === 'High' || k.level === 'Medium').forEach((k) => n.push('Risk: ' + k.level.toLowerCase()));
  if (Object.keys(raciOf(c, s.id)).length >= 3) n.push(Object.keys(raciOf(c, s.id)).length + ' roles');
  if (s.acts.length >= 5) n.push('Long procedure');
  return n;
}
const stepScore = (x) => { const W = S.plan.weights; return Math.round((x.imp * W.imp + x.risk * W.risk + x.cx * W.cx) / 5); };
function stepsInside(code) {
  const c = anyC(byCode(code)); if (!c) return { flagged: [], noticed: [], quiet: [] };
  const all = tasks(c).map((s) => ({ s, f: S.steps[stepKey(code, s.id)], n: noticed(c, s) }));
  return { c, flagged: all.filter((x) => x.f), noticed: all.filter((x) => !x.f && x.n.length), quiet: all.filter((x) => !x.f && !x.n.length) };
}
/* what goes into the plan: a process with flagged steps is there as those steps, each in its own wave */
function planUnits() {
  const out = [];
  S.prio.forEach((r) => {
    const st = stepsInside(r[0]).flagged;
    if (!st.length) out.push({ kind: 'p', code: r[0], wave: r[5], score: prioScore(r), why: r[4] });
    else st.forEach((x) => out.push({ kind: 's', code: r[0], s: x.s, wave: x.f.wave === 'proc' ? r[5] : x.f.wave, score: stepScore(x.f), why: x.f.why }));
  });
  return out.sort((a, b) => b.score - a.score);
}
const dotsEd = (key, f, v) => '<span class="dots ed" role="group" aria-label="' + f + ': ' + v + ' of 5">' + [1, 2, 3, 4, 5].map((n) => '<button type="button" class="' + (n <= v ? 'on' : '') + '" data-act="stepDot" data-key="' + key + '" data-f="' + f + '" data-n="' + n + '" aria-label="' + n + '">●</button>').join('') + '</span>';
R.priorities = () => {
  const mains = S.prio.filter((r) => !byCode(r[0]).parent || !S.prio.some((m) => m[0] === byCode(r[0]).parent));
  const subsOf = (code) => S.prio.filter((r) => byCode(r[0]).parent === code);
  const ranked = mains.slice().sort((a, b) => prioScore(b) - prioScore(a));
  const chosen = UI.chosen || S.prio.map((r) => r[0]);
  const flaggedAll = Object.keys(S.steps).length, units = planUnits();
  const stateWord = { draft: 'Draft', sent: 'With Yara', approved: 'Signed off', returned: 'Sent back' }[S.plan.state];
  return officePage('priorities', (v) => {
    if (v === 'score') {
      const rows = []; let rank = 0;
      ranked.forEach((r) => { const subs = subsOf(r[0]); if (chosen.includes(r[0])) rows.push([r, ++rank, false, subs.length]); if (subs.length && (UI.openSubs || {})[r[0]]) subs.filter((x) => chosen.includes(x[0])).forEach((x) => rows.push([x, ++rank, true, 0])); });
      const w1 = units.filter((u) => u.wave === 'W1').length;
      const picker = '<div class="cpick"><button class="btn" type="button" data-act="cpick" aria-expanded="' + !!UI.cpick + '">Choose processes · ' + chosen.length + ' of ' + S.prio.length + ' ▾</button>' + (UI.cpick ? '<div class="cmenu box"><div class="row3" style="margin:0 0 6px">' + [['all', 'Select all'], ['none', 'None'], ['unscored', 'Only unscored'], ['flagged', 'Has flagged steps']].map(([k, l]) => '<button class="btn sm" type="button" data-act="cquick" data-k="' + k + '">' + l + '</button>').join('') + '</div>' + mains.map((r) => '<label class="chk"><input type="checkbox" data-chg="cpickOne" data-code="' + r[0] + '"' + (chosen.includes(r[0]) ? ' checked' : '') + '> <span>' + pn(r[0]) + (subsOf(r[0]).length ? ' <small>' + plural(subsOf(r[0]).length, 'sub') + '</small>' : '') + '</span></label>' + subsOf(r[0]).map((x) => '<label class="chk" style="padding-left:22px"><input type="checkbox" data-chg="cpickOne" data-code="' + x[0] + '"' + (chosen.includes(x[0]) ? ' checked' : '') + '> <span>↳ ' + esc(nameOf(x[0])) + '</span></label>').join('')).join('') + '</div>' : '') + '</div>';
      const strip = '<div class="pstrip"><span><b>' + chosen.length + ' / ' + S.prio.length + '</b> shown</span><span><b>' + S.prio.length + '</b> scored</span><span><b>' + flaggedAll + '</b> steps flagged</span><span class="' + (w1 > S.plan.capacity ? 'over' : '') + '">Wave 1: <b>' + w1 + ' / ' + S.plan.capacity + '</b></span></div>';
      const stepRows = (r) => {
        const si = stepsInside(r[0]); if (!si.c) return '';
        const open = (UI.openSteps || {})[r[0]], quiet = (UI.openQuiet || {})[r[0]];
        const line = '<tr class="srow"><td></td><td colspan="7"><button class="lnk" type="button" data-act="openSteps" data-code="' + r[0] + '">' + (open ? '▾' : '▸') + ' Steps inside: ' + si.flagged.length + ' flagged · ' + si.noticed.length + ' noticed · ' + si.quiet.length + ' quiet</button></td></tr>';
        if (!open) return line;
        const one = (x) => { const k = stepKey(r[0], x.s.id), f = x.f, own = f && f.own;
          return '<tr class="srow in"><td></td><td><span class="flag' + (f ? ' on' : '') + '">⚑</span> ' + stepNo(si.c, x.s.id) + ' · ' + esc(x.s.label) + (x.n.length ? '<span class="sub">' + esc(x.n.join(' · ')) + '</span>' : '') + (own ? '<span class="sub"><span class="chip gold">Now its own process</span> ' + pn(own) + '</span>' : '') + '</td>' +
            (f ? '<td>' + dotsEd(k, 'imp', f.imp) + '</td><td>' + dotsEd(k, 'cx', f.cx) + '</td><td>' + dotsEd(k, 'risk', f.risk) + '</td><td><b>' + stepScore(f) + '</b></td><td>' + esc(f.why) + '</td><td>' + selD('data-chg="stepWave" data-key="' + k + '" aria-label="Wave"', [['proc', 'With its process'], ['W1', 'Wave 1'], ['W2', 'Wave 2'], ['LATER', 'Later'], ['HIGH', 'Stays high-level']], f.wave) + '<div class="row3" style="margin-top:6px">' + (own ? '' : '<button class="btn sm" type="button" data-act="stepOwn" data-key="' + k + '">Make it a process</button>') + '<button class="btn sm" type="button" data-act="stepFlag" data-key="' + k + '">Unflag</button></div></td>'
              : '<td colspan="5" class="note">Not scored until it is flagged</td><td><button class="btn sm" type="button" data-act="stepFlag" data-key="' + k + '">⚑ Flag</button></td>') + '</tr>'; };
        return line + si.flagged.concat(si.noticed).map(one).join('') + (si.quiet.length ? (quiet ? si.quiet.map(one).join('') : '<tr class="srow in"><td></td><td colspan="7"><button class="lnk" type="button" data-act="openQuiet" data-code="' + r[0] + '">Show the ' + plural(si.quiet.length, 'quiet step') + ', to flag one</button></td></tr>') : '');
      };
      return '<div class="blk" style="margin-bottom:12px"><span class="lbl">What counts, and how much</span><p style="font-size:13px">Importance <b>' + S.plan.weights.imp + '%</b> · Risk if it goes wrong <b>' + S.plan.weights.risk + '%</b> · Complexity <b>' + S.plan.weights.cx + '%</b> · the team runs <b>' + S.plan.capacity + '</b> deep dives at once</p></div>' +
        '<div class="tbar">' + picker + strip + '<span class="sp"></span><button class="btn" type="button" data-act="toast" data-msg="Downloads the scores as Excel, every process, whatever is chosen.">Download as Excel</button><button class="btn" type="button" data-act="toast" data-msg="Downloads one row per flagged step across every process: process, step, role, scores, wave, why, what the map noticed.">Download flagged steps (all processes)</button></div>' +
        '<div class="box tw"><table class="t prio"><thead><tr><th><span>Rank</span></th><th><span>Process</span></th><th><span>Importance</span></th><th><span>Complexity</span></th><th><span>Risk</span></th><th><span>Score</span></th><th><span>Why</span></th><th><span>Decision</span></th></tr></thead><tbody>' +
        rows.map(([r, n, sub, ns]) => '<tr><td>' + n + '</td><td>' + (sub ? '↳ ' : '') + pn(r[0]) + (ns ? ' <button class="lnk" type="button" data-act="openSubs" data-code="' + r[0] + '">' + ((UI.openSubs || {})[r[0]] ? '−' : '+') + ' ' + plural(ns, 'sub') + '</button>' : '') + '</td><td>' + dots(r[1]) + '</td><td>' + dots(r[2]) + '</td><td>' + dots(r[3]) + '</td><td><b>' + prioScore(r) + '</b></td><td>' + esc(r[4]) + '</td><td>' + DEC[r[5]] + '</td></tr>' + stepRows(r)).join('') +
        '</tbody></table>' + (rows.length ? '' : '<p class="empty">No process chosen. Use Choose processes, or Select all.</p>') + '</div><p class="note" style="margin-top:8px">A step’s score never changes its process’s score. Only a flagged step is scored; flagging starts its complexity and risk from the map, and importance is the office’s.</p>';
    }
    if (v === 'rank') return '<div class="box" style="padding:12px 16px">' + ranked.map((r, i) => '<div class="rk"><b>' + (i + 1) + '</b><span>' + pn(r[0]) + '</span><span class="bar"><i style="width:' + prioScore(r) + '%;background:' + (r[5] === 'W1' ? 'var(--gold)' : 'var(--stone)') + '"></i></span><b>' + prioScore(r) + '</b></div>').join('') + '<p class="note" style="margin-top:6px">Gold: Wave 1. Score out of 100, from the weights on Score.</p></div>';
    if (v === 'plan') return '<div class="cols">' + ['W1', 'W2', 'LATER', 'HIGH'].map((k) => { const us = units.filter((u) => u.wave === k); return '<div class="col"><h4>' + DEC[k] + '<span class="note">' + us.length + (k === 'W1' ? ' of ' + S.plan.capacity : '') + '</span></h4>' + us.map((u) => u.kind === 'p' ? '<div class="card">' + pn(u.code) + '<small>Score ' + u.score + ' · ' + esc(byCode(u.code).cat) + '</small></div>' : '<div class="card step"><b>' + esc(u.s.label) + '</b><small>Step of ' + esc(nameOf(u.code)) + ' · score ' + u.score + '</small><small>' + esc(u.why) + '</small></div>').join('') + '</div>'; }).join('') + '</div><p class="note" style="margin-top:8px">A process with flagged steps is in the plan as those steps, each in its own wave.</p>';
    const act = S.plan.state === 'draft' || S.plan.state === 'returned' ? '<button class="btn gold" type="button" data-act="planSend">Send to Yara Kamal for sign-off</button>' : S.plan.state === 'sent' ? '<span class="note">With Yara Kamal. Look as Yara to sign it off.</span>' : '<span class="note">Signed off by Yara Kamal. Wave 1 can start.</span>';
    const unitName = (u) => u.kind === 'p' ? nameOf(u.code) : u.s.label + ' (step of ' + nameOf(u.code) + ')';
    return '<div class="two2"><div class="blk"><span class="lbl">The page the client signs</span><p style="font-size:14px;margin-bottom:6px"><b>Deep-dive plan for Raya Trade</b></p><p class="note">Wave 1 starts now: ' + esc(units.filter((u) => u.wave === 'W1').map(unitName).join(', ')) + '. Wave 2 follows: ' + esc(units.filter((u) => u.wave === 'W2').map(unitName).join(', ')) + '.</p></div><div class="blk"><span class="lbl">Where it is</span><p>' + pill(S.plan.state === 'approved' ? 'good' : S.plan.state === 'returned' ? 'bad' : S.plan.state === 'sent' ? 'attn' : 'q', stateWord) + '</p><div class="row3">' + act + '</div></div></div>';
  }, [[S.prio.length + '/' + S.prio.length, 'Scored'], [flaggedAll, 'Steps flagged'], [units.filter((u) => u.wave === 'W1').length + '/' + S.plan.capacity, 'Wave 1'], [units.filter((u) => u.wave === 'W2').length, 'Wave 2'], [stateWord, 'The plan']]);
};
const toggle = (k, code) => { UI[k] = UI[k] || {}; UI[k][code] = !UI[k][code]; render(); };
ACT.openSteps = (el) => toggle('openSteps', el.dataset.code);
ACT.openQuiet = (el) => toggle('openQuiet', el.dataset.code);
ACT.openSubs = (el) => toggle('openSubs', el.dataset.code);
ACT.cpick = () => { UI.cpick = !UI.cpick; render(); };
ACT.cquick = (el) => { const k = el.dataset.k; UI.chosen = k === 'all' ? null : k === 'none' ? [] : k === 'unscored' ? [] : S.prio.filter((r) => stepsInside(r[0]).flagged.length).map((r) => r[0]); render(); if (k === 'unscored') toast('Every process here is scored, so none is shown.'); };
CHG.cpickOne = (el) => { const all = S.prio.map((r) => r[0]), cur = UI.chosen || all.slice(), code = el.dataset.code, subs = S.prio.filter((r) => byCode(r[0]).parent === code).map((r) => r[0]); let next = el.checked ? cur.concat(code, subs) : cur.filter((x) => x !== code && !subs.includes(x)); next = all.filter((x) => next.includes(x)); UI.chosen = next.length === all.length ? null : next; render(); };
ACT.stepDot = (el) => { S.steps[el.dataset.key][el.dataset.f] = Number(el.dataset.n); render(); };
CHG.stepWave = (el) => { S.steps[el.dataset.key].wave = el.value; render(); toast(el.value === 'proc' ? 'It goes with its process’s wave.' : 'In the plan this step sits in ' + DEC[el.value] + ', on its own.'); };
ACT.stepFlag = (el) => {
  const k = el.dataset.key, [code, sid] = k.split(':'), c = anyC(byCode(code)), s = stepById(c, sid);
  if (S.steps[k]) { dialog({ title: 'Unflag step ' + stepNo(c, sid) + '?', sub: esc(s.label) + ' · ' + esc(nameOf(code)), body: '<p>Its scores and wave are cleared, and the plan shows ' + esc(nameOf(code)) + ' as a whole again if no other step is flagged.</p>', foot: foot2('stepUnflagGo', 'Unflag', ' data-key="' + k + '"') }); return; }
  const lv = { High: 5, Medium: 3, Low: 2 }, risk = Math.max(2, ...controlsOf(c, sid).map((x) => lv[x.level] || 2)), cx = Math.min(5, 2 + (s.type === 'DECISION' ? 1 : 0) + (Object.keys(raciOf(c, sid)).length >= 3 ? 1 : 0) + (s.acts.length >= 5 ? 1 : 0));
  S.steps[k] = { imp: 3, cx, risk, why: noticed(c, s).join(', ') || 'Flagged by the office', wave: 'proc' };
  UI.openSteps = UI.openSteps || {}; UI.openSteps[code] = true; render(); toast('Flagged. Complexity and risk start from the map; set importance, it is the office’s.');
};
ACT.stepUnflagGo = (el) => { delete S.steps[el.dataset.key]; closeLayer(); render(); toast('Unflagged; its scores are cleared.'); };
ACT.stepOwn = (el) => {
  const k = el.dataset.key, [code, sid] = k.split(':'), s = stepById(anyC(byCode(code)), sid);
  dialog({ title: 'Make it a process', sub: 'A draft sub-process under ' + esc(nameOf(code)) + ', branching from step ' + stepNo(anyC(byCode(code)), sid) + '. The step stays where it is, as the link; nothing is deleted or moved.', body: fld('Its name', '<input id="so-name" value="' + esc(s.label) + '">'), foot: foot2('stepOwnGo', 'Create the draft', ' data-key="' + k + '"') });
};
ACT.stepOwnGo = (el) => {
  const n = val('so-name'); if (!n) { toast('Give it a name first.'); return; }
  const k = el.dataset.key, [code, sid] = k.split(':'), parent = byCode(code), s = stepById(anyC(parent), sid), f = S.steps[k];
  const base = (n.replace(/[^A-Za-z]/g, '').slice(0, 3) || 'NEW').toUpperCase(); let num = 100; while (byCode(base + num)) num += 100;
  const ids = s.acts.map((_, i) => 'y' + (i + 1));
  const c = content({ purpose: '', steps: s.acts.map((a, i) => st(ids[i], 'TASK', a, s.role)), conn: chain(ids) });
  const np = { code: base + num, name: n, cat: parent.cat, area: parent.area, owner: parent.owner, approver: parent.approver, parent: code, acks: [], nextReview: null, high: false, sop: false, live: null, inForce: null, publishedAt: null, versions: [], ncs: [], draft: { v: 1, state: 'draft', started: TODAY, note: 'Made from step ' + stepNo(anyC(parent), sid) + ' of ' + parent.name, c } };
  S.processes.push(np); S.prio.push([np.code, f.imp, f.cx, f.risk, f.why, f.wave === 'proc' ? (S.prio.find((r) => r[0] === code) || [])[5] || 'LATER' : f.wave]);
  f.own = np.code; log('Mona Farag made step ' + stepNo(anyC(parent), sid) + ' of ' + parent.name + ' its own process: ' + np.code);
  closeLayer(); render(); toast(np.code + ' ' + n + ' is a draft under ' + parent.name + ', carrying the step’s scores.');
};
ACT.planSend = () => { S.plan.state = 'sent'; log('Mona Farag sent the deep-dive plan to Yara Kamal'); render(); toast('Sent. It lands in Yara Kamal’s To do: look as Yara to sign it off.'); };

/* ── Governance ── */
R.governance = () => {
  const openR = S.risks.filter((r) => r[5] !== 'Closed'), hi = openR.filter((r) => r[4] === 'High').length, done = S.checklist.filter((c) => c[4]).length, over = S.checklist.filter((c) => c[5] && !c[4]).length;
  const lvl = (l) => pill(l === 'High' ? 'bad' : l === 'Medium' ? 'attn' : 'q', l);
  const stage = (s) => pill(s === 'Published' || s === 'Approved' ? 'good' : s === 'In review' ? 'attn' : 'q', s);
  return officePage('governance', (v) => {
    if (v === 'attention') {
      const pub = procs().filter((p) => p.live).sort((a, b) => a.nextReview.localeCompare(b.nextReview));
      const grp = [['Overdue', 'bad-tx', (d) => d < 0], ['Next 30 days', 'attn-tx', (d) => d >= 0 && d <= 30], ['Later', 'ink-2', (d) => d > 30]];
      return '<div class="two2"><div class="blk"><span class="lbl">Process review calendar</span>' + grp.map(([h, c, f]) => { const r = pub.filter((p) => f(reviewDays(p))); return r.length ? '<h4 style="font-size:12px;margin:8px 0 4px;color:var(--' + c + ')">' + h + ' · ' + r.length + '</h4>' + r.map((p) => '<div class="calrow"><span class="note">' + fmt(p.nextReview) + '</span><span>' + pn(p.code) + '</span></div>').join('') : ''; }).join('') + '</div><div class="blk"><span class="lbl">Overdue on the checklist</span>' + (S.checklist.filter((c) => c[5] && !c[4]).map((c) => '<p style="font-size:13.5px"><b>' + esc(c[0]) + '</b></p><p class="note">' + esc(c[2]) + ' · was due ' + c[3] + '</p>').join('') || '<p class="note">Nothing overdue.</p>') + '</div></div>';
    }
    if (v === 'assessment') return '<div class="aspects">' + ['Board structure', 'Risk & controls', 'Ethics', 'Compensation', 'ESG', 'Data integrity', 'Accessibility'].map((a, i) => '<button type="button" class="btn' + (i === 1 ? ' gold' : '') + '" data-act="toast" data-msg="Shows the assessment for ' + a + '.">' + a + '</button>').join('') + '</div><div class="two2" style="margin-bottom:12px"><div class="blk"><span class="lbl">Executive summary · Risk & controls</span><p style="font-size:13px">Risk owners are named for the main processes, but treatment actions are often late. Finance alone reviews the risk register each month. Three high risks sit with one person. Internal audit reports to the CFO rather than to the audit committee.</p><p class="note" style="margin-top:6px">Generated 12 Oct with AI help</p></div><div class="blk"><span class="lbl">Governing policy</span><p style="font-size:13.5px"><b>Risk Management Policy</b> ' + stage('Published') + '</p><p class="note">Effective 1 Sep 2026 · approved by Yara Kamal</p></div></div>' +
      '<div class="cols">' + ['Immediate', 'Near-term', 'Long-term'].map((w) => { const rs = S.checklist.filter((c) => c[1] === w); return '<div class="col"><h4>' + w + '<span class="note">' + rs.length + '</span></h4>' + rs.map((c) => '<label class="chk"><input type="checkbox" data-chg="ck" data-i="' + S.checklist.indexOf(c) + '"' + (c[4] ? ' checked' : '') + '> <span>' + esc(c[0]) + '<small>' + esc(c[2]) + (c[3] ? ' · due ' + c[3] : '') + '</small></span></label>').join('') + '</div>'; }).join('') + '</div>';
    if (v === 'risks') return '<div class="box tw"><table class="t"><thead><tr><th><span>Risk</span></th><th><span>Aspect</span></th><th><span>Likelihood</span></th><th><span>Impact</span></th><th><span>Level</span></th><th><span>Status</span></th><th><span>Owner</span></th></tr></thead><tbody>' + S.risks.map((r) => '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + r[2] + '</td><td>' + r[3] + '</td><td>' + lvl(r[4]) + '</td><td>' + esc(r[5]) + '</td><td>' + esc(r[6]) + '</td></tr>').join('') + '</tbody></table></div>';
    if (v === 'policies') return '<div class="box tw"><table class="t"><thead><tr><th><span>Policy</span></th><th><span>Governs</span></th><th><span>Stage</span></th><th><span>Effective</span></th><th><span>Review due</span></th><th><span>Read by</span></th></tr></thead><tbody>' + S.policies.map((p) => '<tr><td><b>' + esc(p[0]) + '</b></td><td>' + esc(p[1]) + '</td><td>' + stage(p[2]) + '</td><td>' + p[3] + '</td><td>' + p[4] + '</td><td>' + p[5] + '</td></tr>').join('') + '</tbody></table></div>';
    if (v === 'controls') {
      const rows = []; procs().forEach((p) => { const c = anyC(p); if (c) c.controls.forEach((k) => rows.push([p, c, k])); });
      return '<div class="box tw"><table class="t"><thead><tr><th><span>Process</span></th><th><span>Step</span></th><th><span>Risk</span></th><th><span>Control</span></th><th><span>Last test</span></th></tr></thead><tbody>' + rows.map(([p, c, k]) => '<tr><td>' + pn(p.code) + '</td><td>' + stepNo(c, k.step) + ' · ' + esc((stepById(c, k.step) || {}).label) + '</td><td>' + esc(k.risk) + '</td><td>' + (k.control ? esc(k.control) : '<span class="ctl bad">None yet</span>') + '</td><td>' + (k.control ? pill(k.test === 'pass' ? 'good' : k.test === 'fail' ? 'bad' : 'q', k.test === 'pass' ? 'Passed · ' + fmt(k.testedAt) : k.test === 'fail' ? 'Failed · ' + fmt(k.testedAt) : 'Not tested') : pill('bad', 'No control')) + '</td></tr>').join('') + '</tbody></table></div>';
    }
    return '<div class="box">' + S.log.map(([d, t]) => '<div class="trow" style="grid-template-columns:70px minmax(0,1fr)"><span class="note">' + d + '</span><span class="t1">' + esc(t) + '</span></div>').join('') + '</div>';
  }, [[hi, 'High risks', hi ? 'bad' : ''], [openR.length, 'Open risks'], [S.policies.length, 'Policies'], [done + '/' + S.checklist.length, 'Checklist done'], [over, 'Overdue', over ? 'bad' : '']]);
};
CHG.ck = (el) => { S.checklist[Number(el.dataset.i)][4] = el.checked; render(); };

/* ── Export ── */
R.export = () => {
  const n = S.exp.length, over = n > 12;
  return officePage('export', () => '<div class="two2"><div class="blk"><span class="lbl">Pack sections</span>' + ['Cover', 'Contents', 'Executive summary', 'Org structure', 'The processes', 'Appendix: glossary'].map((x) => '<label class="chk"><input type="checkbox" checked> <span>' + x + '</span></label>').join('') + '<span class="lbl" style="margin-top:10px">Inside each process</span>' + ['Executive summary', 'Process map & narrative', 'RACI & authority', 'Governance, controls & metrics'].map((x, i) => '<label class="chk"><input type="checkbox" checked> <span>' + (i + 1) + '.0 ' + x + '</span></label>').join('') + '</div>' +
    '<div><div class="box tw"><table class="t"><thead><tr><th><span><input type="checkbox" data-chg="expAll" aria-label="Tick all"' + (n === procs().length ? ' checked' : '') + '></span></th><th><span>Process</span></th><th><span>Where it is</span></th></tr></thead><tbody>' + procs().map((p) => '<tr><td><input type="checkbox" data-chg="expPick" data-code="' + p.code + '" aria-label="Include ' + esc(p.name) + '"' + (S.exp.includes(p.code) ? ' checked' : '') + '></td><td>' + pn(p.code) + '</td><td>' + stPill(p) + '</td></tr>').join('') + '</tbody></table></div>' +
    '<div class="row3"><button class="btn gold" type="button" data-act="expPreview"' + (n ? '' : ' disabled') + '>Preview report</button><button class="btn" type="button" data-act="toast" data-msg="Opens the SOP for the ticked processes."' + (n ? '' : ' disabled') + '>SOP</button><button class="btn" type="button" data-act="toast" data-msg="Reads the ticked processes end to end and lists the gaps."' + (n && !over ? '' : ' disabled') + ' title="' + (over ? 'The check reads up to 12 processes at a time' : '') + '">Check end to end</button></div>' +
    '<p class="note" style="margin-top:6px' + (over ? ';color:var(--attn-tx);font-weight:600' : '') + '">' + (!n ? 'Tick at least one process.' : over ? 'The check reads up to 12 processes at a time and ' + n + ' are ticked. Untick ' + (n - 12) + ' to run it.' : 'The check is optional, and a warning only: the report opens either way.') + '</p></div></div>', [[n, 'Ticked'], [procs().length, 'Processes']]);
};
CHG.expPick = (el) => { const c = el.dataset.code; S.exp = el.checked ? S.exp.concat(c) : S.exp.filter((x) => x !== c); render(); };
CHG.expAll = (el) => { S.exp = el.checked ? procs().map((p) => p.code) : []; render(); };
ACT.expPreview = () => dialog({ title: 'Raya Trade · Process pack', sub: 'A preview of the report the client receives.', wide: true, body: '<p><b>1. Cover and contents</b></p><p><b>2. Executive summary</b> · ' + plural(S.exp.length, 'process', 'processes') + ' documented</p><p><b>3. Org structure</b> · ' + S.people.filter((x) => !x.office).length + ' people in ' + S.roles.length + ' roles</p>' + S.exp.map((c, i) => { const p = byCode(c), cc = anyC(p); return '<p><b>' + (4 + i) + '. ' + pn(c) + '</b> · ' + (cc ? plural(tasks(cc).length, 'step') + ', ' + plural(cc.controls.length, 'control') : 'not drawn yet, shown as not recorded') + ' · ' + esc(stateOf(p).label) + '</p>'; }).join('') });
