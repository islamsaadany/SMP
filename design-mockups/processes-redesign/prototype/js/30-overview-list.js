/* ══ OVERVIEW · PROCESSES LIST · DELETED ════════════════════════════════ */
const openP = (code, tab) => 'p~' + code + '~' + (tab || 'overview');

R.overview = () => {
  const all = procs(), m = mains(), deep = all.filter(isDeep), w1 = all.filter((p) => p.prio.dec === 'W1'), w2 = all.filter((p) => p.prio.dec === 'W2');
  const due = all.filter((p) => p.status === 'PUBLISHED' && p.nextReview && daysFrom(p.nextReview) <= 60), late = due.filter(overdue);
  let exp = 0, done = 0;
  all.forEach((p) => { if (inForce(p) && (p.status === 'PUBLISHED' || p.status === 'APPROVED')) { const e = expectedReaders(p); exp += e.length; done += e.filter((x) => p.acks.indexOf(x.id) >= 0).length; } });
  const att = attention();
  const wave1 = ranked().filter((x) => x.p.prio.dec === 'W1');
  const pct = exp ? Math.round(done / exp * 100) : 0;
  return phead('Overview', { eyebrow: esc(S.ws.name) + ' · Processes · ' + dt(todayIso()), acts: exportMenu() + newBtn(), tiles: [[all.length, 'Processes', 0, 'processes'], [deep.length, 'Deep dives', 0, 'priorities~plan'], [due.length, 'Reviews due', 0, 'governance~attention'], [late.length, 'Overdue', late.length > 0, 'governance~attention'], [pct + '%', 'Read by staff']] }) +
    '<div class="ovgrid"><div>' +
    '<div class="sect">Needs attention <span>· ' + plural(att.length, 'thing') + ', most urgent first</span></div>' +
    '<div class="box">' + (att.length ? att.map((x) => '<div class="att"><span class="chip ' + x.chip + '">' + x.word + '</span><div class="what">' + (x.p ? '<span class="code">' + x.p.code + '</span> <b>' + esc(x.p.name) + '</b>' : '<b>Deep-dive priorities</b>') + '<span class="w2">' + esc(x.line) + '</span></div>' +
      '<a class="btn sm" href="#" data-go="' + (x.go || openP(x.p.code, x.tab)) + '">' + (x.go ? 'Sign-off' : { lifecycle: 'Lifecycle', risks: 'Risks', raci: 'RACI' }[x.tab]) + ' →</a></div>').join('') : '<div class="empty"><b>Nothing needs you today</b>Reviews, approvals and gaps will show here as they come up.</div>') + '</div>' +
    '</div><div>' +
    '<div class="sect">Deep dives · Wave 1 <span>· ' + esc(S.plan.timing.W1) + '</span><span class="r"><a class="lnk" href="#" data-go="priorities~plan">Priorities →</a></span></div>' +
    '<div class="box">' + (wave1.length ? wave1.map((x) => '<div class="dd" data-go="' + openP(x.p.code) + '"><div><span class="code">' + x.p.code + '</span> <b>' + esc(x.p.name) + '</b></div>' + marksHtml(x.p) + '<div class="asp">' + marks(x.p).map((k) => '<span' + (k.done ? ' class="ok"' : '') + '>' + k.label + (k.done ? ' ✓' : '') + '</span>').join('') + '</div></div>').join('') : '<div class="empty">No process is in Wave 1 yet. Decide on the Priorities page.</div>') + '</div>' +
    '<div class="sect" style="margin-top:16px">Recently changed</div>' +
    '<div class="box feed"><ul>' + S.feed.slice(0, 5).map(([d, t]) => '<li><time>' + dshort(d) + '</time> ' + t + '</li>').join('') + '</ul></div>' +
    '</div></div>';
};

/* ── the list ─────────────────────────────────────────────────────── */
UI.open.ORD100 = true;
const LIST_CHIPS = [['all', 'All', () => true], ['deep', 'Deep dive', isDeep], ['review', 'In review', (p) => p.status === 'IN_REVIEW'], ['overdue', 'Review overdue', overdue], ['noowner', 'No owner', (p) => !p.owner]];
function listMatches(p, q) {
  if (!q) return true;
  q = q.toLowerCase();
  return [p.name, p.code, p.cat || ''].concat(p.steps.map((s) => s.label)).concat(p.raci.acts.map((a) => a.name)).some((t) => t.toLowerCase().indexOf(q) >= 0);
}
function listRow(p, depth) {
  const subs = subsOf(p.code), parent = p.parent && byCode(p.parent);
  const toggle = !depth && subs.length && !UI.f.q && (UI.f.chip || 'all') === 'all'
    ? '<button class="fold" type="button" data-act="fold" data-code="' + p.code + '" aria-label="' + (UI.open[p.code] ? 'Hide' : 'Show') + ' sub-processes">' + (UI.open[p.code] ? '▾' : '▸') + '</button>' : '';
  const indent = depth ? 'padding-left:' + (34 + depth * 4) + 'px' : (toggle ? '' : 'padding-left:34px');
  const rank = rankOf(p);
  const review = p.status === 'PUBLISHED' && p.nextReview ? '<span class="num">' + dt(p.nextReview) + '</span>' + (overdue(p) ? '<span class="psub bad">' + plural(-daysFrom(p.nextReview), 'day') + ' late</span>' : daysFrom(p.nextReview) <= 60 ? '<span class="psub attn">in ' + plural(daysFrom(p.nextReview), 'day') + '</span>' : '') : '<span class="q">—</span>';
  const subline = [p.cat, !depth && subs.length ? plural(subs.length, 'sub-process', 'sub-processes') : null, parent && (UI.f.q || (UI.f.chip || 'all') !== 'all') ? 'sub-process of ' + parent.code : null].filter(Boolean).join(' · ');
  return '<tr class="hov' + (depth ? ' sub' : '') + '" data-go="' + openP(p.code) + '"><td style="' + indent + '">' + toggle + '<span class="code">' + p.code + '</span></td>' +
    '<td><a class="pname" href="#" data-go="' + openP(p.code) + '">' + esc(p.name) + '</a>' + (subline ? '<span class="psub">' + esc(subline) + '</span>' : '') + (p.branchFrom ? '<span class="psub br">↰ branches from ' + p.branchFrom.code + ' · step ' + stepNo(byCode(p.branchFrom.code), p.branchFrom.step) + ' ' + esc(stepById(byCode(p.branchFrom.code), p.branchFrom.step).label) + '</span>' : '') + '</td>' +
    '<td>' + (p.owner ? esc(personName(p.owner)) : '<span class="q">No owner</span>') + '</td><td>' + statusPill(p) + '</td>' +
    '<td>' + (isDeep(p) ? '<span class="chip gold">' + DEC[p.prio.dec] + (rank ? ' · rank ' + rank : '') + '</span>' : '<span class="q">' + (p.prio.dec === 'LATER' ? 'Later' : 'High-level') + '</span>') + '</td>' +
    '<td>' + marksHtml(p) + '</td><td>' + review + '</td>' +
    '<td class="r">' + menuBtn('row-' + p.code, '⋯', mi('Open', 'openProc', 'data-code="' + p.code + '"') + mi('Edit details', 'editProcess', 'data-code="' + p.code + '"') + mi('Clone', 'cloneProcess', 'data-code="' + p.code + '"') + '<div class="rule"></div>' + mi('Delete…', 'deleteProcess', 'bad data-code="' + p.code + '"'), { cls: 'dots', noCaret: true, aria: 'More for ' + esc(p.name), w: 170 }) + '</td></tr>';
}
R.processes = () => {
  const all = procs(), chip = UI.f.chip || 'all', q = UI.f.q || '', flat = q || chip !== 'all';
  let rows = '';
  if (flat) {
    const f = LIST_CHIPS.find((c) => c[0] === chip)[2];
    const hits = all.filter((p) => f(p) && listMatches(p, q)).sort((a, b) => a.code.localeCompare(b.code));
    rows = hits.map((p) => listRow(p, 0)).join('') || '<tr><td colspan="8"><div class="empty">No processes match' + (q ? ' “' + esc(q) + '”' : '') + '.</div></td></tr>';
  } else {
    mains().forEach((p) => { rows += listRow(p, 0); if (UI.open[p.code]) subsOf(p.code).forEach((s) => { rows += listRow(s, 1); }); });
  }
  const deleted = S.processes.filter((p) => p.deleted).length, anyClosed = mains().some((p) => subsOf(p.code).length && !UI.open[p.code]);
  const inRev = all.filter((p) => p.status === 'IN_REVIEW').length, od = all.filter(overdue).length;
  return phead('Processes', { sub: 'Every process has its own code and can sit under a main process.', acts: exportMenu() + newBtn(), tiles: [[all.length, 'Processes', 0, 'act:listChipAll'], [all.filter(isDeep).length, 'Deep dive', 0, 'act:listChipDeep'], [inRev, 'In review', 0, 'act:listChipReview'], [od, 'Overdue', od > 0, 'act:listChipOverdue']] }) +
    '<div class="filters">' + searchBox('q-list', 'Search by name, code, category, step or task', q, 'listQ') +
    '<span class="filters" style="margin:0">' + LIST_CHIPS.map(([k, l, f]) => '<button type="button" class="fchip' + (chip === k ? ' on' : '') + (k === 'overdue' ? ' bad' : '') + '" data-act="listChip" data-k="' + k + '">' + l + '<b>' + all.filter(f).length + '</b></button>').join('') + '</span>' +
    '<span style="margin-left:auto;display:flex;gap:14px;align-items:center">' + (flat ? '' : '<button class="lnk" type="button" data-act="openAll">' + (anyClosed ? 'Open all' : 'Fold all') + '</button>') + '<a class="lnk" href="#" data-go="deleted">Deleted (' + deleted + ')</a></span></div>' +
    '<div class="tw"><table class="t"><thead><tr><th>Code</th><th>Process</th><th>Owner</th><th>Stage</th><th>Depth</th><th>Ready for staff</th><th>Next review</th><th class="r"><span class="q" style="color:inherit">⋯</span></th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<p class="note" style="margin-top:8px">Click a row to open the process. The six marks are Map · RACI · Authority · Controls · SOP · Approved, filled in by the work itself.</p>';
};
INP.listQ = (el) => { UI.f.q = el.value; render(); };
ACT.listChip = (el) => { UI.f.chip = el.dataset.k; render(); };
ACT.listChipAll = () => { UI.f.chip = 'all'; render(); };
ACT.listChipDeep = () => { UI.f.chip = 'deep'; render(); };
ACT.listChipReview = () => { UI.f.chip = 'review'; render(); };
ACT.listChipOverdue = () => { UI.f.chip = 'overdue'; render(); };
ACT.fold = (el) => { UI.open[el.dataset.code] = !UI.open[el.dataset.code]; render(); };
ACT.openAll = () => { const any = mains().some((p) => subsOf(p.code).length && !UI.open[p.code]); mains().forEach((p) => { UI.open[p.code] = any; }); render(); };
ACT.openProc = (el) => go(openP(el.dataset.code));

/* ── new, edit, clone, delete ─────────────────────────────────────── */
function procFields(p, isNew) {
  const all = procs().filter((x) => !p || x.code !== p.code);
  const withSteps = all.filter((x) => x.steps.length);
  const bf = UI.f.bfCode !== undefined ? UI.f.bfCode : (p && p.branchFrom ? p.branchFrom.code : '');
  const bfp = bf && byCode(bf);
  return '<div class="frm two">' + fld('Name', inp('f-name', p ? p.name : '', { ph: 'e.g. Sales Order Fulfillment', max: 120 }), { req: true, full: !isNew ? false : true }) +
    (isNew ? '' : fld('Process code', inp('f-code', p.code, { max: 20 }), { req: true, hint: 'Follows the name when you rename the process. Change it here to set your own.' })) +
    (isNew ? '' : fld('Description', area('f-desc', p.desc, { rows: 2 }), { full: true })) +
    fld('Category', sel('f-cat', [['', '— none —']].concat(S.categories.map((c) => [c, c])), p ? p.cat || '' : ''), { hint: '<button class="lnk" type="button" data-act="newCategory">+ New category</button>' }) +
    fld('Main process', sel('f-parent', [['', '— top-level —']].concat(all.map((x) => [x.code, x.code + ' — ' + x.name])), p ? p.parent || '' : (UI.f.newParent || ''))) +
    fld('Branches from', sel('f-bf', [['', '— starts on its own —']].concat(withSteps.map((x) => [x.code, x.code + ' — ' + x.name])), bf, { chg: 'bfPick' })) +
    (bfp ? fld('Starts at step', sel('f-bfstep', [['', '— pick a step —']].concat(bfp.steps.map((s, i) => [s.id, (i + 1) + ' · ' + s.label])), p && p.branchFrom ? p.branchFrom.step : '')) : '') +
    '</div>';
}
CHG.bfPick = (el) => { UI.f.bfCode = el.value; const keep = { name: val('f-name'), code: val('f-code'), desc: val('f-desc'), cat: val('f-cat'), parent: val('f-parent') }; render(); Object.keys(keep).forEach((k) => { const e = document.getElementById('f-' + k); if (e && keep[k]) e.value = keep[k]; }); };
ACT.newCategory = () => { const n = 'New category ' + (S.categories.length + 1); S.categories.push(n); toast('Added “' + n + '”. Rename it in Processes settings.'); const keep = val('f-name'); render(); const e = $('#f-name'); if (e) e.value = keep; const c = $('#f-cat'); if (c) c.value = n; };
ACT.newProcess = (el) => {
  UI.f.bfCode = undefined; UI.f.newParent = el && el.dataset && el.dataset.parent || '';
  dialog({ title: 'New process', sub: 'The code is made from the name: the first three letters, then the next number.', body: () => procFields(null, true),
    foot: '<button class="btn" type="button" data-act="close">Cancel</button><button class="btn gold" type="button" data-act="createProcess">Create process</button>' });
};
ACT.createProcess = () => {
  const name = val('f-name');
  if (!name) { toast('Give the process a name first.'); return; }
  const parent = val('f-parent') || null, code = nextCode(name, parent), bf = val('f-bf');
  const p = blankProcess(code, name, { cat: val('f-cat') || null, parent, branchFrom: bf && val('f-bfstep') ? { code: bf, step: val('f-bfstep') } : null });
  S.processes.push(p); S.feed.unshift([todayIso(), 'New process <b>' + esc(name) + '</b> created as ' + code]);
  if (parent) UI.open[parent] = true;
  toast('Created as ' + code + '.'); go(openP(code, 'map'));
};
function blankProcess(code, name, x) {
  return Object.assign({ code, name, desc: '', cat: null, parent: null, branchFrom: null, owner: null, status: 'DRAFT', approver: null, reviewers: [], sentBy: null, sentAt: null, changeNote: '', returnReason: '', reviewMonths: 12, nextReview: null, purpose: '', inScope: [], outScope: [], entities: [], kpis: [], doc: { version: '', effective: '', owner: '', approvedBy: '' }, revisions: [], steps: [], conn: [], ext: [], raci: { final: false, finalAt: null, cells: {}, skip: [], acts: [], pinned: [], dots: [] }, auth: { rules: [], skip: [] }, controls: [], ncs: [], versions: [], acks: [], prio: { imp: null, cx: null, risk: null, why: '', dec: null }, proposals: [], findings: null, deleted: null }, x || {});
}
ACT.editProcess = (el) => {
  const p = byCode(el.dataset.code); UI.f.bfCode = undefined;
  dialog({ title: 'Edit “' + esc(p.name) + '”', body: () => procFields(p, false), foot: '<button class="btn" type="button" data-act="close">Cancel</button><button class="btn gold" type="button" data-act="saveProcess" data-code="' + p.code + '">Save</button>' });
};
ACT.saveProcess = (el) => {
  const p = byCode(el.dataset.code), code = val('f-code').toUpperCase();
  if (!val('f-name') || code.length < 2) { toast('A name and a code of 2 to 20 characters are needed.'); return; }
  if (code !== p.code && byCode(code)) { toast('Process Code “' + code + '” is already used in this workspace.'); return; }
  const old = p.code;
  Object.assign(p, { name: val('f-name'), desc: val('f-desc'), cat: val('f-cat') || null, parent: val('f-parent') || null, branchFrom: val('f-bf') && val('f-bfstep') ? { code: val('f-bf'), step: val('f-bfstep') } : null, code });
  if (old !== code) S.processes.forEach((x) => { if (x.parent === old) x.parent = code; if (x.branchFrom && x.branchFrom.code === old) x.branchFrom.code = code; });
  UI.layer = null; toast('Saved.');
  if (UI.route[0] === 'p') go(['p', code, UI.route[2] || 'overview'], { keepScroll: true }); else render();
};
ACT.cloneProcess = (el) => {
  const p = byCode(el.dataset.code);
  dialog({ title: 'Clone “' + esc(p.name) + '”', sub: 'Copies its steps, connections, cross-process links and RACI assignments into a new process with its own code.',
    body: '<div class="frm">' + fld('New process name', inp('f-name', p.name + ' (Copy)'), { req: true }) + fld('Main process', sel('f-parent', [['', '— top-level —']].concat(procs().map((x) => [x.code, x.code + ' — ' + x.name])), p.parent || '')) + '</div>',
    foot: '<button class="btn" type="button" data-act="close">Cancel</button><button class="btn gold" type="button" data-act="doClone" data-code="' + p.code + '">Clone</button>' });
};
ACT.doClone = (el) => {
  const p = byCode(el.dataset.code), name = val('f-name') || p.name + ' (Copy)', parent = val('f-parent') || null, code = nextCode(name, parent);
  const c = JSON.parse(JSON.stringify(p));
  Object.assign(c, { code, name, parent, status: 'DRAFT', versions: [], acks: [], deleted: null, approver: null, reviewers: [], sentBy: null, nextReview: null, doc: { version: '', effective: '', owner: '', approvedBy: '' }, revisions: [], findings: null, proposals: [], prio: { imp: null, cx: null, risk: null, why: '', dec: null } });
  c.raci.final = false;
  S.processes.push(c); if (parent) UI.open[parent] = true;
  UI.layer = null; toast('Cloned as ' + code + '.'); render();
};
ACT.deleteProcess = (el) => {
  const p = byCode(el.dataset.code), im = deleteImpact(p);
  dialog({ title: 'Delete “' + p.code + ' · ' + esc(p.name) + '”?', body:
    (im.parts.length ? '<p>It holds <b>' + im.parts.join(', ') + '</b>, which will stop appearing in reports, exports and the value chain.</p>' : '<p>This process is empty — there is nothing recorded against it yet.</p>') +
    (im.orphans ? '<p class="banner attn">' + plural(im.orphans, 'sub-process', 'sub-processes') + ' will be left without a main process.</p>' : '') +
    (im.branchers ? '<p class="banner attn">' + plural(im.branchers, 'process', 'processes') + ' branching from its steps will lose the starting point they name.</p>' : '') +
    '<p class="note">Nothing is destroyed. You can bring this process back, exactly as it is now, from <b>Deleted processes</b> on the Processes page.</p>',
    foot: '<button class="btn" type="button" data-act="close">Cancel</button><button class="btn danger solid" type="button" data-act="doDelete" data-code="' + p.code + '">Delete process</button>' });
};
ACT.doDelete = (el) => { const p = byCode(el.dataset.code); p.deleted = todayIso(); UI.layer = null; toast(p.code + ' deleted. Restore it from Deleted processes.'); if (UI.route[0] === 'p') go('processes'); else render(); };

/* ── draft with AI, and import ────────────────────────────────────── */
ACT.aiDraft = (el) => {
  const into = el && el.dataset && el.dataset.into ? byCode(el.dataset.into) : null;
  UI.f.draft = null;
  const body = () => {
    if (UI.f.draft) {
      const d = UI.f.draft;
      return '<p><b>' + esc(d.name) + '</b></p><div class="sect">Process map</div><ol style="padding-left:18px;display:grid;gap:4px">' + d.steps.map(([t, l, r, isNew]) => '<li><span class="chip">' + t + '</span> ' + esc(l) + ' · <span style="color:var(--' + (isNew ? 'attn' : 'good') + '-tx);font-weight:600">' + esc(r) + '</span></li>').join('') + '</ol>' +
        '<p class="note">Green is a role already in your org chart. Amber is not in it yet, and is added as a new role when you use the draft.</p>';
    }
    return '<div class="frm">' + fld('Process to draft', inp('f-dname', into ? into.name : '', { ph: 'e.g. Employee Onboarding, Procure to Pay', max: 120, ro: !!into }), { req: true }) +
      fld('How it works today', area('f-dnotes', '', { ph: 'e.g. HR raises the request, the line manager approves, Finance sets up payroll…', rows: 4 }), { hint: 'Optional. The draft follows your notes over generic practice.' }) +
      '<label class="checks"><label><input type="checkbox" id="f-droles" checked> Use the roles in our org chart</label></label>' +
      '<p class="note">Uses this client\'s industry and background notes for context. A starting point you refine afterwards, not a finished process.</p></div>';
  };
  const foot = () => UI.f.draft
    ? '<button class="btn l" type="button" data-act="aiDraftGo" data-into="' + (into ? into.code : '') + '">Regenerate</button><button class="btn" type="button" data-act="close">Cancel</button><button class="btn gold" type="button" data-act="aiDraftUse" data-into="' + (into ? into.code : '') + '">' + (into ? 'Put this draft in the process →' : 'Use this draft →') + '</button>'
    : '<button class="btn" type="button" data-act="close">Cancel</button><button class="btn gold" type="button" data-act="aiDraftGo" data-into="' + (into ? into.code : '') + '">Generate draft</button>';
  dialog({ title: into ? 'Draft it with AI' : 'Draft a process with AI', body, foot });
};
ACT.aiDraftGo = (el) => {
  const name = (UI.f.draft && UI.f.draft.name) || val('f-dname');
  if (!name) { toast('Say which process to draft.'); return; }
  UI.f.draft = { name, steps: [['START', 'Request received', 'Customer service agent', false], ['TASK', 'Log and classify the request', 'Customer service agent', false], ['DECISION', 'Can it be solved on the first call?', 'Customer service agent', false], ['TASK', 'Escalate to the specialist team', 'Customer service lead', false], ['TASK', 'Agree the fix with the customer', 'Customer care specialist', true], ['TASK', 'Close and survey the customer', 'Customer service agent', false], ['END', 'Request closed', 'Customer service agent', false]] };
  render();
};
ACT.aiDraftUse = (el) => {
  const d = UI.f.draft, into = el.dataset.into ? byCode(el.dataset.into) : null;
  const p = into || blankProcess(nextCode(d.name), d.name);
  let newRole = null;
  p.steps = d.steps.map(([t, l, r, isNew], i) => {
    let role = S.roles.find((x) => x.name === r);
    if (!role) { role = { id: uid('r'), name: r, archived: false }; S.roles.push(role); newRole = r; }
    return { id: uid('s'), type: t, label: l, role: role.id, actions: [], risk: '', inputs: '', output: '', errors: '', links: [], milestone: false, phase: null, support: [], requiresAll: false, note: '' };
  });
  p.conn = p.steps.slice(1).map((s, i) => ({ from: p.steps[i].id, to: s.id, label: i === 3 ? 'No' : '' }));
  p.conn.push({ from: p.steps[2].id, to: p.steps[5].id, label: 'Yes' });
  workSteps(p).forEach((s) => { p.raci.cells[s.id + '|' + s.role] = 'R'; });
  if (!into) S.processes.push(p);
  UI.f.draft = null; UI.layer = null;
  toast((into ? 'Draft put in ' + p.code : 'Created ' + p.code) + (newRole ? '. New role added: ' + newRole : '') + '.');
  go(openP(p.code, 'map'));
};
ACT.importXls = () => {
  UI.f.imp = 0;
  const body = () => UI.f.imp === 1
    ? '<div class="banner good"><b>This is what will be created.</b> In this drawing any file gives the template\'s own example.</div>' +
      '<div class="cells c3" style="margin:0">' + [['Process', 'Purchase Requisition'], ['Steps', 6], ['Connections', 6], ['RACI assignments', 11], ['Authority rules', 2], ['KPIs / entities', '2 / 1']].map(([k, v]) => '<div class="cell"><div class="k">' + k + '</div><div class="v" style="font-size:18px">' + v + '</div></div>').join('') + '</div>' +
      '<div class="two"><div><div class="sect">Roles already here</div><p>Procurement officer · Finance manager · CFO</p></div><div><div class="sect" style="color:var(--attn-tx)">Roles that will be created</div><p>Budget holder</p></div></div>'
    : '<p>Download the template, fill it in, and upload it — the whole process is created in one go.</p>' +
      '<div class="acts"><button class="btn" type="button" data-act="toast" data-msg="The template downloads as an Excel file in the product.">Download template</button></div>' +
      fld('Filled-in template (.xlsx)', '<input type="file" id="f-file" accept=".xlsx">', { hint: 'Uploading shows you what will be created. Nothing is added until you confirm it.' });
  const foot = () => UI.f.imp === 1
    ? '<button class="btn" type="button" data-act="close">Cancel</button><button class="btn gold" type="button" data-act="impCreate">Create Purchase Requisition</button>'
    : '<button class="btn" type="button" data-act="close">Cancel</button><button class="btn gold" type="button" data-act="impCheck">Upload and check</button>';
  dialog({ title: 'Build a process from a spreadsheet', body, foot });
};
ACT.impCheck = () => { UI.f.imp = 1; render(); };
ACT.impCreate = () => {
  const code = nextCode('Purchase Requisition');
  let bh = S.roles.find((r) => r.name === 'Budget holder'); if (!bh) { bh = { id: uid('r'), name: 'Budget holder', archived: false }; S.roles.push(bh); }
  const p = blankProcess(code, 'Purchase Requisition', { cat: 'Supply Chain', owner: 'p5', purpose: 'Turn a need into an approved request that Procurement can buy against.' });
  const L = [['START', 'Need identified', bh.id], ['TASK', 'Write the requisition', bh.id], ['DECISION', 'Over the budget holder\'s limit?', 'r3'], ['TASK', 'Finance approval', 'r3'], ['TASK', 'Send to Procurement', 'r6'], ['END', 'Requisition accepted', 'r6']];
  p.steps = L.map(([t, l, r]) => ({ id: uid('s'), type: t, label: l, role: r, actions: [], risk: '', inputs: '', output: '', errors: '', links: [], milestone: false, phase: null, support: [], requiresAll: false, note: '' }));
  p.conn = [[0, 1, ''], [1, 2, ''], [2, 3, 'Yes'], [2, 4, 'No'], [3, 4, ''], [4, 5, '']].map(([a, b, l]) => ({ from: p.steps[a].id, to: p.steps[b].id, label: l }));
  S.processes.push(p); UI.layer = null; toast('Created Purchase Requisition (' + code + ') — 6 steps.'); go(openP(code, 'map'));
};

/* ── deleted processes ────────────────────────────────────────────── */
R.deleted = () => {
  const del = S.processes.filter((p) => p.deleted).sort((a, b) => b.deleted.localeCompare(a.deleted));
  return phead('Deleted processes', { eyebrow: '<a href="#" data-go="processes">' + esc(S.ws.name) + ' · Processes</a> › Deleted', sub: 'Deleting a process hides it — it never destroys anything. Restore one to bring it back exactly as it was.', tiles: [[del.length, 'Deleted']], acts: goBtn('processes', '← Back to Processes', 'bq') }) +
    '<div class="tw"><table class="t"><thead><tr><th>Code</th><th>Process</th><th>Steps</th><th>Deleted</th><th class="r"></th></tr></thead><tbody>' +
    (del.length ? del.map((p) => '<tr><td><span class="code">' + p.code + '</span></td><td><b>' + esc(p.name) + '</b>' + (p.parent && byCode(p.parent) && !byCode(p.parent).deleted ? '<span class="psub">sub-process of ' + p.parent + '</span>' : '') + '</td><td class="num">' + p.steps.length + '</td><td class="num">' + dt(p.deleted) + '</td><td class="r"><button class="btn sm" type="button" data-act="restore" data-code="' + p.code + '">Restore</button></td></tr>').join('')
      : '<tr><td colspan="5"><div class="empty"><b>Nothing has been deleted</b>Every process in this workspace is still on the Processes list.</div></td></tr>') + '</tbody></table></div>';
};
ACT.restore = (el) => { byCode(el.dataset.code).deleted = null; toast(el.dataset.code + ' is back on the list.'); render(); };
