/* ══ THE READING SIDE ══════════════════════════════════════════════════
   What a client's own people see: two tabs, Processes and To do. Processes is
   one page with filters: All (what is in force, as before), Yours (what you own
   or approve) and You have a step in. A filter shows only when it has rows.
   A process page opens on its flow with Steps and Summary as tabs. They see the
   version in force; an approver also reads the draft sent to them. */
function myParts(pid) {
  const yours = procs().filter((p) => p.owner === pid || p.approver === pid);
  const step = procs().filter((p) => yours.indexOf(p) < 0 && readersOf(p).includes(pid));
  return { yours, step };
}
function readingBand() {
  const pid = meId(), t = todoFor(pid), parts = myParts(pid);
  const own = parts.yours.filter((p) => p.owner === pid).length, appr = parts.yours.filter((p) => p.approver === pid).length;
  const noCtl = parts.yours.reduce((n, p) => n + (anyC(p) ? anyC(p).controls.filter((k) => !k.control).length : 0), 0);
  return mast({
    eyebrow: 'Raya Trade · Processes', title: 'Processes',
    sub: esc(me().name) + ' · ' + esc(roleName(me().roles[0])) + ' · <b>' + own + '</b> you own · <b>' + appr + '</b> you approve · <b>' + parts.step.length + '</b> you have a step in',
    wait: t.length && UI.scr !== 'todo' ? '<span>' + plural(t.length, 'thing') + ' waiting</span><button type="button" data-go="' + addr('todo') + '">See them</button>' : '',
    acts: '<button class="bgold" type="button" data-act="askNew">Ask for a new process</button>',
    tiles: tiles([[own, 'You own'], [appr, 'You approve'], [t.length, 'Waiting on you', t.length ? 'hot' : ''], [noCtl, 'Risk, no control', noCtl ? 'late' : '']]),
  });
}
function readingTabs(cur) {
  const t = todoFor(meId()).length, n = procs().filter((p) => p.live).length;
  return tabBar([['list', 'Processes', n, '', addr('list')], ['todo', 'To do', t || '', true, addr('todo')]], cur);
}
/* the buttons a row carries: whatever waits on this person for this process */
function rowActs(code) {
  return todoFor(meId()).filter((x) => x.code === code).map((x) => x.actName ? '<button class="btn' + (x.kind === 'Approve' ? ' gold' : '') + '" type="button" data-act="' + x.actName + '" data-id="' + (x.id || '') + '">' + esc(x.act) + '</button>' : '<button class="btn' + (x.kind === 'Approve' ? ' gold' : '') + '" type="button" data-go="' + x.go + '">' + esc(x.kind === 'Review' ? 'Review by ' + fmt(byCode(code).nextReview) : x.act) + '</button>').join('');
}
function yourFlags(p) {
  const f = [], c = anyC(p), d = p.draft;
  if (c) { const n = c.controls.filter((k) => !k.control).length; if (n) f.push(['bad', plural(n, 'risk') + ' with no control']); }
  if (p.live) { const r = readersOf(p), a = r.filter((x) => p.acks.includes(x)).length; f.push([a < r.length ? 'warn' : '', a + ' of ' + r.length + ' have read it']); const rd = reviewDays(p); f.push(rd < 0 ? ['bad', 'Review late'] : rd <= 30 ? ['warn', 'Review in ' + plural(rd, 'day')] : ['', 'Review ' + fmt(p.nextReview)]); }
  if (d && d.state === 'draft') f.push(['', 'Draft v' + d.v + ' with the office']);
  if (d && d.state === 'in-review') f.push(['warn', p.approver === meId() ? 'Your approval' : 'With ' + person(p.approver).name]);
  if (d && d.state === 'approved') f.push(['good', 'v' + d.v + ' approved; the office publishes it next']);
  if (d && d.state === 'returned') f.push(['warn', 'v' + d.v + ' sent back to the office']);
  return f;
}

/* ── Processes: one page, three filters ── */
const FILTERS = [['all', 'All'], ['yours', 'Yours'], ['step', 'You have a step in']];
R.list = () => {
  const pid = meId(), { yours, step } = myParts(pid);
  const n = { all: procs().filter((p) => p.live).length, yours: yours.length, step: step.length };
  const f = UI.filt && n[UI.filt] ? UI.filt : 'all';
  const chips = '<div class="chips" role="group" aria-label="Show">' + FILTERS.filter(([k]) => k === 'all' || n[k]).map(([k, l]) => '<button type="button" class="' + (k === f ? 'on' : '') + '" aria-pressed="' + (k === f) + '" data-act="filt" data-f="' + k + '">' + l + ' <span>' + n[k] + '</span></button>').join('') + '</div>';
  let body;
  if (f === 'yours') {
    /* the Yours table, as My processes had it */
    const rowY = (p) => { const a = rowActs(p.code); return '<tr><td><span class="code">' + p.code + '</span> <button class="pn" type="button" data-go="' + addr('p', p.code) + '">' + esc(p.name) + '</button><span class="sub">' + esc(p.cat) + '</span></td><td><span class="chip ' + (p.owner === pid ? 'gold' : 'navy') + '">' + (p.owner === pid ? 'Owner' : 'Approver') + '</span></td><td>' + stPill(p) + '</td><td>' + flags(yourFlags(p)) + (a ? '<div class="inl">' + a + '</div>' : '') + '</td></tr>'; };
    body = '<div class="box tw"><table class="t cards"><thead><tr><th><span>Process</span></th><th><span>Your part</span></th><th><span>Where it is</span></th><th><span>Needs attention</span></th></tr></thead><tbody>' + yours.map(rowY).join('') + '</tbody></table></div><p class="note" style="margin-top:8px">You own or approve these, in any state.</p>';
  } else if (f === 'step') {
    /* the You have a step in table, as My processes had it */
    const rowS = (p) => { const a = rowActs(p.code), mine = myStepsIn(p.live, pid); return '<tr><td><span class="code">' + p.code + '</span> <button class="pn" type="button" data-go="' + addr('p', p.code) + '">' + esc(p.name) + '</button><span class="sub">Owner ' + esc(person(p.owner).name) + '</span></td><td>' + esc(mine.map((s) => s.label).join(', ')) + '</td><td>' + stPill(p) + '</td><td>' + flags([p.acks.includes(pid) ? ['good', 'Read · v' + p.inForce] : ['warn', changedSteps(p.live).some((s) => me().roles.includes(s.role)) ? 'Your step changed: read it' : 'Not read yet']]) + (a ? '<div class="inl">' + a + '</div>' : '') + '</td></tr>'; };
    body = '<div class="box tw"><table class="t cards"><thead><tr><th><span>Process</span></th><th><span>Your step</span></th><th><span>Where it is</span></th><th><span>For you</span></th></tr></thead><tbody>' + step.map(rowS).join('') + '</tbody></table></div><p class="note" style="margin-top:8px">Someone else owns these; your role does part of the work.</p>';
  } else body = allTable();
  return page(readingBand() + readingTabs('list') + chips + body);
};
R.mine = R.list; R.map = R.list;
ACT.filt = (el) => { UI.filt = el.dataset.f; render(); };

R.todo = () => {
  const pid = meId(), t = todoFor(pid);
  const group = (k, title) => { const items = t.filter((x) => x.kind === k); return items.length ? '<div class="tgroup"><div class="sect" style="margin:0 0 2px"><span class="lbl">' + title + '</span><span class="note">' + items.length + '</span></div>' + items.map((x) => '<div class="tcard"><div><h3>' + (x.code === 'PLAN' ? '' : '<span class="code">' + x.code + '</span> ') + esc(x.name || nameOf(x.code)) + '</h3><p>' + esc(x.what) + '</p><p class="note">' + esc(x.meta) + ' · ' + esc(x.why) + '</p>' + (x.quote ? '<blockquote>' + esc(x.quote) + '</blockquote>' : '') + '</div><div class="acts">' + (x.actName ? '<button class="btn gold" type="button" data-act="' + x.actName + '" data-id="' + (x.id || '') + '">' + esc(x.act) + '</button>' : '<button class="btn gold" type="button" data-go="' + x.go + '">' + esc(x.act) + '</button>') + '</div></div>').join('') + '</div>' : ''; };
  const done = (S.done[pid] || []);
  return page(readingBand() + readingTabs('todo') + '<div class="cgrid"><div>' +
    (t.length ? group('Approve', 'To approve') + group('Review', 'To review') + group('Read', 'To read') + group('Answer', 'Answers to your suggestions') : '<div class="ph"><b>You are up to date</b>Nothing is waiting on you. New approvals, reviews and versions to read show up here.</div>') +
    '</div><div><div class="box done" style="padding:12px 14px"><span class="lbl">Done lately</span>' + (done.length ? '<ul>' + done.slice(0, 6).map((d) => '<li>' + esc(d) + '</li>').join('') + '</ul>' : '<p class="note" style="margin-top:6px">Nothing yet.</p>') + '</div></div></div>');
};

/* the All filter: the All processes table, as it was */
function allTable() {
  const pid = meId(), q = UI.rq.toLowerCase();
  const part = (p) => (p.owner === pid ? 'Owner' : p.approver === pid ? 'Approver' : readersOf(p).includes(pid) ? 'Your step' : '');
  const KEY = { name: (p) => p.name, owner: (p) => person(p.owner).name, since: (p) => p.publishedAt || '', part: (p) => part(p) || 'zz' };
  const [k, dir] = UI.rsort;
  const rows = procs().filter((p) => p.live && (!q || (p.code + ' ' + p.name + ' ' + person(p.owner).name).toLowerCase().indexOf(q) >= 0)).sort((a, b) => KEY[k](a).localeCompare(KEY[k](b)) * dir || a.name.localeCompare(b.name));
  const th = (key, label) => '<th' + (k === key ? ' aria-sort="' + (dir > 0 ? 'ascending' : 'descending') + '"' : '') + '><button type="button" data-act="rsort" data-k="' + key + '">' + label + ' <i>' + (k === key ? (dir > 0 ? '↑' : '↓') : '↕') + '</i></button></th>';
  return '<div class="tbar"><label class="srch"><span class="sr">Search processes</span><input type="search" id="rq" value="' + esc(UI.rq) + '" placeholder="Search by code, name or owner" data-inp="rq" autocomplete="off"></label><span class="note">' + rows.length + ' in force · processes still being drawn show once they are published</span></div>' +
    '<div class="box tw"><table class="t cards"><thead><tr>' + th('name', 'Process') + th('owner', 'Owner') + th('since', 'In force since') + th('part', 'Your part') + '<th><span><span class="sr">Open</span></span></th></tr></thead><tbody>' +
    rows.map((p) => '<tr><td><span class="code">' + p.code + '</span> <button class="pn" type="button" data-go="' + addr('p', p.code) + '">' + esc(p.name) + '</button></td><td>' + esc(person(p.owner).name) + '</td><td>v' + p.inForce + ' · ' + fmt(p.publishedAt) + '</td><td>' + (part(p) ? '<span class="chip ' + (part(p) === 'Your step' ? 'navy' : 'gold') + '">' + part(p) + '</span>' : '<span class="note">—</span>') + '</td><td><button class="btn" type="button" data-go="' + addr('p', p.code) + '">Open</button></td></tr>').join('') +
    '</tbody></table>' + (rows.length ? '' : '<p class="empty">No process in force matches “' + esc(UI.rq) + '”.</p>') + '</div>';
}
INP.rq = (el) => { UI.rq = el.value; const pos = el.selectionStart; render(); const n = $('#rq'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } };
ACT.rsort = (el) => { const k = el.dataset.k; UI.rsort = UI.rsort[0] === k ? [k, -UI.rsort[1]] : [k, 1]; render(); };

/* ── a process ── */
function readView(p) {
  const pid = meId();
  if (isOffice()) return { c: p.live || draftC(p), mode: p.live ? 'live' : 'draft' };
  if (p.approver === pid && p.draft && p.draft.state === 'in-review') return { c: draftC(p), mode: 'approve' };
  if (p.live) return { c: p.live, mode: 'live' };
  if (p.owner === pid || p.approver === pid) return { c: draftC(p), mode: 'notyet' };
  return { c: null, mode: 'none' };
}
R.p = (args) => {
  const p = byCode(args[0]);
  if (!p) return R[home(UI.as)]([]);
  const pid = meId(), v = readView(p), c = v.c;
  const tab = ['flow', 'steps', 'summary'].indexOf(args[1]) >= 0 ? args[1] : window.innerWidth < 640 ? 'steps' : 'flow';
  const t = todoFor(pid).filter((x) => x.code === p.code);
  const d = p.draft, rd = readersOf(p), acked = rd.filter((x) => p.acks.includes(x)).length;
  const part = p.owner === pid ? 'You own this' : p.approver === pid ? 'You approve this' : rd.includes(pid) ? 'Your step' : '';
  const verPill = v.mode === 'approve' ? pill('attn', 'Draft v' + d.v + ' · for your approval') : p.live ? pill('good', 'In force · v' + p.inForce) : pill('q', stateOf(p).label);
  const dnote = d ? (d.state === 'draft' ? ' · draft v' + d.v + ' with the office' : d.state === 'in-review' ? ' · v' + d.v + ' with ' + esc(person(p.approver).name) + ' for approval' : d.state === 'approved' ? ' · v' + d.v + ' approved, waiting for the office to publish' : ' · v' + d.v + ' sent back to the office') : '';
  const first = t.find((x) => x.kind !== 'Approve');
  const chg = c ? changedSteps(c) : [];
  const wait = first ? '<span>' + esc(first.kind === 'Read' ? 'Read version ' + p.inForce + (chg.length ? ': ' + (chg.length === 1 ? 'step ' : 'steps ') + chg.map((s) => stepNo(c, s.id)).join(' and ') + ' changed' : '') : first.what) + '</span>' + (first.kind === 'Review' ? '<button type="button" data-go="' + addr('p', p.code, 'summary') + '">Open the summary</button>' : first.kind === 'Read' ? '<button type="button" data-act="ack" data-code="' + p.code + '">I have read it</button>' : first.kind === 'Answer' ? '<button type="button" data-act="reply" data-id="' + first.id + '">Reply</button>' : '') : '';
  const noCtl = c ? c.controls.filter((k) => !k.control).length : 0;
  const acts = isOffice()
    ? '<button class="bq" type="button" data-act="toast" data-msg="Downloads the SOP in the product.">Download SOP</button><button class="bgold" type="button" data-go="mona.b.' + p.code + '.map">Open in builder</button>'
    : '<button class="bq" type="button" data-act="toast" data-msg="Downloads the SOP in the product.">Download SOP</button><button class="bq" type="button" data-act="toast" data-msg="Prints the page in the product.">Print</button>' + (c ? '<button class="bgold" type="button" data-act="suggest" data-code="' + p.code + '" data-step="">Suggest a change</button>' : '');
  const band = mast({ eyebrow: 'Raya Trade · Processes › ' + p.code + ' · ' + esc(p.cat), title: esc(p.name) + ' ' + verPill + (part ? '<span class="own">' + part + '</span>' : ''),
    sub: (c && c.purpose ? esc(c.purpose.split(',')[0]) + ' · ' : '') + 'Owner <b>' + esc(person(p.owner).name) + '</b> · Approver <b>' + esc(person(p.approver).name) + '</b>' + dnote, wait, acts,
    tiles: tiles([[tasks(c).length, 'Steps'], [c ? new Set(tasks(c).map((s) => s.role)).size : 0, 'Roles']].concat(p.live ? [[acked + '/' + rd.length, 'Have read it']] : []).concat([[noCtl, 'Risk, no control', noCtl ? 'late' : '']]).concat(p.live ? [[Math.max(0, reviewDays(p)), reviewDays(p) < 0 ? 'Review late' : 'Days to review', reviewDays(p) < 0 ? 'late' : '']] : [])) });
  let strip = '';
  if (v.mode === 'approve') strip = '<div class="strip"><b>For your approval</b><span>You are reading draft v' + d.v + ', sent by ' + esc(d.sentBy || 'the Strategy Office') + ' on ' + fmt(d.sentAt) + '. ' + esc(d.note || '') + '</span><span class="acts"><button class="btn" type="button" data-act="sendBack" data-code="' + p.code + '">Send back with a note</button><button class="btn gold" type="button" data-act="approve" data-code="' + p.code + '">Approve v' + d.v + '</button></span></div>';
  else if (v.mode === 'notyet') strip = '<div class="strip navy"><b>Not in force yet</b><span>' + (d.state === 'approved' ? 'Version ' + d.v + ' is approved; the office publishes it next.' : d.state === 'in-review' ? 'Version ' + d.v + ' is with ' + esc(person(p.approver).name) + ' for approval.' : 'The Strategy Office is drawing it with your team. This is the draft so far.') + '</span></div>';
  if (v.mode === 'none') return page(band + '<div class="ph"><b>Not published yet</b>This process is still being drawn by the Strategy Office. It shows here once it is in force.</div>');
  const sumCount = healthRows(p, c).filter((h) => h[0] !== 'ok').length;
  const tabs = tabBar([['flow', 'Flow', '', '', addr('p', p.code, 'flow')], ['steps', 'Steps', tasks(c).length, '', addr('p', p.code, 'steps')], ['summary', 'Summary', sumCount ? sumCount + ' to look at' : '', '', addr('p', p.code, 'summary')]], tab);
  const sug = !isOffice() && v.mode !== 'approve' ? p.code : '';
  const changes = v.mode === 'live' && p.live && changedSteps(c).length ? p.inForce : v.mode !== 'live' && d ? d.v : 0;
  let body = '';
  if (tab === 'flow') {
    const s0 = UI.sel && stepById(c, UI.sel) ? UI.sel : (tasks(c)[0] || {}).id;
    body = '<p class="note" style="margin-bottom:10px">Lanes are roles. Click a step for its detail.</p><div class="agrid">' + flowHtml(c, p, { sel: s0, changes }) + '<aside class="box drawer" aria-live="polite">' + stepRead(c, s0, sug ? '<div><button class="btn" type="button" data-act="suggest" data-code="' + p.code + '" data-step="' + s0 + '">Suggest a change to this step</button></div>' : '') + '</aside></div>';
  } else if (tab === 'steps') {
    body = '<div class="sgrid"><nav class="box sidx" aria-label="Steps"><span class="lbl">The steps</span><ol>' + tasks(c).map((s, i) => '<li><button type="button" data-act="jumpStep" data-step="' + s.id + '"><i>' + (i + 1) + '</i>' + esc(s.label) + '<span>' + esc(roleName(s.role)) + '</span></button></li>').join('') + '</ol></nav><div class="box">' + tasks(c).map((s, i) => stepCard(c, s, i + 1, { suggest: sug, changes, mine: isOffice() ? null : me().roles })).join('') + '</div></div>';
  } else body = summaryHtml(p, c, v, t);
  return page(band + strip + tabs + body);
};
ACT.pickStep = (el) => { UI.sel = el.dataset.step; render(); };
ACT.jumpStep = (el) => { const n = document.getElementById('sc-' + el.dataset.step); if (n) n.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

function healthRows(p, c) {
  const h = [], d = p.draft, pid = meId();
  if (d) h.push(d.state === 'approved' ? ['ok', 'Version ' + d.v + ' is approved', 'The office publishes it next; staff are then asked to read it.'] : d.state === 'in-review' ? ['warn', 'Version ' + d.v + ' is with ' + person(p.approver).name + ' for approval', 'Sent on ' + fmt(d.sentAt) + '.'] : d.state === 'returned' ? ['warn', 'Version ' + d.v + ' was sent back to the office', d.returnedNote || ''] : ['ok', 'Draft v' + d.v + ' is with the office', d.note || '']);
  const g = gapsOf(c).filter((x) => x.kind !== 'noControl');
  if (g.length) g.forEach((x) => h.push(['bad', 'Step ' + stepNo(c, x.step) + ', ' + stepById(c, x.step).label + ': ' + x.text.toLowerCase(), '']));
  else if (tasks(c).length) h.push(['ok', 'Every step has a role, and someone accountable', '']);
  c.controls.filter((k) => !k.control).forEach((k) => h.push(['bad', 'Step ' + stepNo(c, k.step) + ', ' + (stepById(c, k.step) || {}).label + ': “' + k.risk + '” has no control', '', !isOffice() ? '<button class="lnk" type="button" data-act="suggest" data-code="' + p.code + '" data-step="' + k.step + '">Suggest one</button>' : '']));
  if (p.live) {
    const rd = readersOf(p), left = rd.filter((x) => !p.acks.includes(x));
    h.push([left.length ? 'warn' : 'ok', (rd.length - left.length) + ' of ' + rd.length + ' have read v' + p.inForce, left.length ? 'Still to read: ' + left.map((x) => person(x).name).join(', ') : '', left.length && p.owner === pid ? '<button class="lnk" type="button" data-act="toast" data-msg="A reminder goes to ' + esc(left.map((x) => person(x).name).join(', ')) + '.">Remind</button>' : '']);
    if (!p.sop) h.push(['warn', 'The SOP has no version or effective date yet', '']);
    if (reviewDays(p) < 0) h.push(['bad', 'The yearly review was due on ' + fmt(p.nextReview), '']);
  }
  return h;
}
function summaryHtml(p, c, v, t) {
  const pid = meId(), review = t.find((x) => x.kind === 'Review'), read = t.find((x) => x.kind === 'Read');
  const mySug = S.suggestions.filter((s) => s.code === p.code && s.by === pid);
  const sugState = (s) => ({ new: 'With the Strategy Office', answered: 'The office answered: reply on your To do', replied: 'You replied; the office has it', 'in-draft': 'In draft v' + s.draftV, closed: 'Done' }[s.state] || '');
  const wait = review ? '<div class="wait"><b>Waiting on you: ' + esc(review.what.charAt(0).toLowerCase() + review.what.slice(1)) + '</b><p class="note" style="margin-top:2px">Read it through and say whether it still describes how the work is done.</p><div class="acts"><button class="btn gold" type="button" data-act="stillRight" data-code="' + p.code + '">It is still right</button><button class="btn" type="button" data-act="suggest" data-code="' + p.code + '" data-step="">Suggest a change</button></div></div>'
    : read ? '<div class="wait"><b>Waiting on you: read version ' + p.inForce + '</b><p class="note" style="margin-top:2px">' + esc(read.meta) + '</p><div class="acts"><button class="btn gold" type="button" data-act="ack" data-code="' + p.code + '">I have read it</button></div></div>' : '';
  return '<div class="sumgrid"><div class="box cb"><span class="lbl">What it is for</span><p style="font-size:14.5px">' + esc(c.purpose || 'Not written yet.') + '</p>' +
    (c.inScope.length || c.outScope.length ? '<div class="scope">' + c.inScope.map((x) => '<span>' + esc(x) + '</span>').join('') + c.outScope.map((x) => '<span class="out">Not: ' + esc(x) + '</span>').join('') + '</div>' : '') +
    (c.kpis.length ? '<div class="sect" style="margin-top:14px"><span class="lbl">Measures</span><span class="note">targets agreed for this process</span></div><div class="kpis">' + c.kpis.map(([m, tg, f]) => '<div class="kpi"><div class="k">' + esc(m) + '</div><div class="v">' + esc(tg) + '</div><div class="w">checked ' + esc(f.toLowerCase()) + '</div></div>').join('') + '</div>' : '') + '</div>' +
    '<div class="box cb"><span class="lbl">Is it in good shape?</span><div class="health">' + healthRows(p, c).map(([k, tx, sm, b]) => '<div class="hrow"><i class="' + k + '">' + (k === 'ok' ? '✓' : '!') + '</i><span>' + esc(tx) + (sm ? '<small>' + esc(sm) + '</small>' : '') + '</span><span>' + (b || '') + '</span></div>').join('') + '</div>' + wait +
    (mySug.length ? '<div class="sect" style="margin-top:14px"><span class="lbl">Your suggestions</span></div>' + mySug.map((s) => '<p style="font-size:13px">“' + esc(s.text) + '”</p><p class="note" style="margin-bottom:6px">' + esc(sugState(s)) + '</p>').join('') : '') + '</div></div>' +
    '<div class="box cb" style="margin-bottom:14px"><div class="sect" style="margin:0 0 4px"><span class="lbl">The flow at a glance</span><span class="r"><button class="lnk" type="button" data-go="' + addr('p', p.code, 'flow') + '">See the full flow →</button></span></div><div class="fstrip">' +
    tasks(c).map((s, i) => (i ? '<span class="arr" aria-hidden="true">→</span>' : '') + '<button type="button" class="sn' + (s.type === 'DECISION' ? ' dec' : '') + '" data-act="openStepCard" data-step="' + s.id + '">' + (controlsOf(c, s.id).some((k) => !k.control) ? '<span class="chip bad warn">No control</span>' : '') + '<span class="code">' + (i + 1) + '</span><b>' + esc(s.label) + '</b><span class="r">' + esc(roleName(s.role)) + '</span></button>').join('') + '</div></div>' +
    '<div class="sect"><span class="lbl">The steps</span><span class="note">click a step to open it</span></div><div class="box compact">' + tasks(c).map((s, i) => stepCard(c, s, i + 1, { compact: true, prefix: 'cs', suggest: !isOffice() && v.mode !== 'approve' ? p.code : '' })).join('') + '</div>';
}
ACT.openStepCard = (el) => { const n = document.getElementById('cs-' + el.dataset.step); if (n) { n.classList.add('open'); n.scrollIntoView({ behavior: 'smooth', block: 'center' }); } };

/* ── what a reader can do ── */
ACT.suggest = (el) => {
  const p = byCode(el.dataset.code), c = readView(p).c;
  dialog({ title: 'Suggest a change', sub: 'It goes to the Strategy Office, pinned to the step. Their answer comes back on this page and in your To do.',
    body: fld('Where', sel('sg-where', [['', 'The whole process']].concat(tasks(c).map((s, i) => [s.id, 'Step ' + (i + 1) + ' · ' + s.label])), el.dataset.step || '')) + fld('What should change', '<textarea id="sg-what" placeholder="For example: since August the warehouse sends the proof of delivery by photo."></textarea>') + fld('Why (optional)', '<textarea id="sg-why" style="min-height:52px"></textarea>'),
    foot: foot2('suggestGo', 'Send to the Strategy Office', ' data-code="' + p.code + '"') });
};
ACT.suggestGo = (el) => {
  const what = val('sg-what'); if (!what) { toast('Write what should change first.'); return; }
  const p = byCode(el.dataset.code), step = val('sg-where'), why = val('sg-why');
  S.suggestions.push({ id: 's' + (S.suggestions.length + 1), by: meId(), code: p.code, step: step || null, text: what + (why ? ' (' + why + ')' : ''), at: TODAY, state: 'new' });
  log(me().name + ' suggested a change to ' + p.name + (step ? ', step ' + stepNo(readView(p).c, step) : ''));
  doneFor(meId(), 'You suggested a change to ' + p.name);
  closeLayer(); render(); toast('Sent to the Strategy Office' + (step ? ', pinned to step ' + stepNo(readView(p).c, step) : '') + '. Look as Mona to see it arrive.');
};
ACT.askNew = () => dialog({ title: 'Ask for a new process', sub: 'The Strategy Office draws it with you.', body: fld('What is it called?', '<input id="an-name" placeholder="For example: Supplier onboarding">') + fld('What should it cover?', '<textarea id="an-what"></textarea>'), foot: foot2('askNewGo', 'Send to the Strategy Office') });
ACT.askNewGo = () => {
  const n = val('an-name'); if (!n) { toast('Give it a name first.'); return; }
  S.suggestions.push({ id: 's' + (S.suggestions.length + 1), by: meId(), code: null, step: null, text: n + (val('an-what') ? ': ' + val('an-what') : ''), at: TODAY, state: 'new' });
  log(me().name + ' asked for a new process: ' + n); closeLayer(); render(); toast('Sent to the Strategy Office.');
};
ACT.reply = (el) => {
  const s = S.suggestions.find((x) => x.id === el.dataset.id);
  dialog({ title: 'Reply to the Strategy Office', sub: esc(nameOf(s.code)) + ' · your suggestion: “' + esc(s.text) + '”', body: '<blockquote style="margin:0;padding:8px 10px;border-left:3px solid var(--gold);background:var(--over-bg);font-size:13.5px">' + esc(s.answer.text) + '<br><span class="note">' + esc(person(s.answer.by).name) + ', ' + fmt(s.answer.at) + '</span></blockquote>' + fld('Your reply', '<textarea id="rp-text" placeholder="For example: the photo replaces the paper; drivers no longer carry forms."></textarea>'), foot: foot2('replyGo', 'Send reply', ' data-id="' + s.id + '"') });
};
ACT.replyGo = (el) => {
  const tx = val('rp-text'); if (!tx) { toast('Write your reply first.'); return; }
  const s = S.suggestions.find((x) => x.id === el.dataset.id);
  s.reply = { text: tx, at: TODAY }; s.state = 'replied';
  log(me().name + ' replied to the office on ' + nameOf(s.code)); doneFor(meId(), 'You replied to the office on ' + nameOf(s.code));
  closeLayer(); render(); toast('Sent. The office sees your reply in To handle.');
};
ACT.approve = (el) => {
  const p = byCode(el.dataset.code), d = p.draft;
  d.state = 'approved'; d.approvedAt = TODAY; d.approvedBy = me().name;
  log(me().name + ' approved ' + p.name + ' v' + d.v); doneFor(meId(), 'You approved ' + p.name + ' v' + d.v);
  render(); toast('Approved. The office publishes v' + d.v + ' next, and staff with a step are asked to read it.');
};
ACT.sendBack = (el) => dialog({ title: 'Send back with a note', sub: 'The draft goes back to the Strategy Office with your note.', body: fld('What needs to change?', '<textarea id="sb-note"></textarea>'), foot: foot2('sendBackGo', 'Send back', ' data-code="' + el.dataset.code + '"') });
ACT.sendBackGo = (el) => {
  const note = val('sb-note'); if (!note) { toast('Say what needs to change first.'); return; }
  const p = byCode(el.dataset.code), d = p.draft;
  d.state = 'returned'; d.returnedAt = TODAY; d.returnedNote = note;
  log(me().name + ' sent ' + p.name + ' v' + d.v + ' back'); doneFor(meId(), 'You sent ' + p.name + ' v' + d.v + ' back');
  closeLayer(); render(); toast('Sent back to the Strategy Office with your note.');
};
ACT.ack = (el) => {
  const p = byCode(el.dataset.code);
  if (!p.acks.includes(meId())) p.acks.push(meId());
  log(me().name + ' read ' + p.name + ' v' + p.inForce); doneFor(meId(), 'You read ' + p.name + ' v' + p.inForce);
  render(); toast('Recorded: you have read version ' + p.inForce + '.');
};
ACT.stillRight = (el) => {
  const p = byCode(el.dataset.code);
  p.nextReview = plusYear(TODAY);
  log(me().name + ' confirmed ' + p.name + ' is still right'); doneFor(meId(), 'You confirmed ' + p.name + ' is still right');
  render(); toast('Recorded: still right. The next review is on ' + fmt(p.nextReview) + '.');
};
ACT.planOpen = () => {
  const W = S.plan.weights, sc = (r) => Math.round((r[1] * W.imp + r[3] * W.risk + r[2] * W.cx) / 5);
  const by = (k) => S.prio.filter((r) => r[5] === k).sort((a, b) => sc(b) - sc(a)).map((r) => nameOf(r[0])).join(', ') || 'None';
  dialog({ title: 'Deep-dive plan for Raya Trade', sub: 'Sent by the Strategy Office for your sign-off.', body: '<p><b>Wave 1, now:</b> ' + esc(by('W1')) + '</p><p><b>Wave 2, next:</b> ' + esc(by('W2')) + '</p><p><b>Later:</b> ' + esc(by('LATER')) + '</p><p class="note">Weighed on importance ' + W.imp + '%, risk ' + W.risk + '%, complexity ' + W.cx + '%. The team runs ' + S.plan.capacity + ' deep dives at once.</p>',
    foot: '<button class="btn" type="button" data-act="close">Not now</button><button class="btn" type="button" data-act="planBack">Send back</button><button class="btn gold" type="button" data-act="planApprove">Sign off the plan</button>' });
};
ACT.planApprove = () => { S.plan.state = 'approved'; log(me().name + ' signed off the deep-dive plan'); doneFor(meId(), 'You signed off the deep-dive plan'); closeLayer(); render(); toast('Signed off. The office starts Wave 1.'); };
ACT.planBack = () => { S.plan.state = 'returned'; log(me().name + ' sent the deep-dive plan back'); doneFor(meId(), 'You sent the deep-dive plan back'); closeLayer(); render(); toast('Sent back to the Strategy Office.'); };
