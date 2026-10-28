/* ══ ONE PROCESS ════════════════════════════════════════════════════════
   One header, one readiness line, one row of tabs — the same on all of them.
   The rail beside it lists every process; switching keeps the tab. */
const TABS = [['overview', 'Overview'], ['map', 'Map'], ['raci', 'RACI'], ['authority', 'Authority'], ['risks', 'Risks & controls'], ['quality', 'Quality'], ['lifecycle', 'Lifecycle']];
function tabsFor() {
  let t = TABS.slice();
  if (OPT.oldTabs) t = t.concat([['people', 'People'], ['compliance', 'Compliance'], ['connections', 'Connections']]);
  if (!OPT.aiPanel) t.push(['ai', 'AI review']);
  return t;
}
let CUR = null; // the process on screen

R.p = (args) => {
  const p = byCode(args[0]);
  if (!p) return phead('Not found') + '<div class="box"><div class="empty"><b>That process does not exist.</b><div class="acts">' + goBtn('processes', '← All processes') + '</div></div></div>';
  if (p.deleted) return phead(esc(p.name)) + '<div class="box"><div class="empty"><b>This process was deleted on ' + dt(p.deleted) + '.</b>Nothing in it was destroyed.<div class="acts"><button class="btn gold" type="button" data-act="restore" data-code="' + p.code + '">Restore it</button>' + goBtn('processes', 'All processes') + '</div></div></div>';
  CUR = p;
  const tab = tabsFor().some((t) => t[0] === args[1]) ? args[1] : 'overview';
  const railOff = !OPT.rail || (UI.railHidden === null ? tab === 'map' : UI.railHidden);
  return processBand(p, tab, railOff) + '<div class="pwrap' + (railOff ? ' railoff' : '') + '">' + (OPT.rail ? rail(p, tab) : '') + '<div class="pane"><div class="pane-b">' + tabBody(p, tab) + '</div></div></div>';
};
function rail(p, tab) {
  const q = (UI.f.railQ || '').toLowerCase();
  const item = (x, sub) => {
    const d = marksDone(x), deep = isDeep(x), od = overdue(x);
    const fr = !x.steps.length || (!deep && !OPT.marksAll) ? '—' : d + '/6';
    return '<button class="ri' + (sub ? ' sub' : '') + (x === p ? ' on' : '') + '" type="button" data-go="' + openP(x.code, tab) + '"' + (x === p ? ' aria-current="true"' : '') + '><span class="code">' + x.code + '</span><span class="nm">' + esc(x.name) + '</span><span class="fr' + (od ? ' bad' : d === 6 ? ' good' : x === p && deep ? ' good' : '') + '"' + (od ? ' title="Review overdue"' : '') + '>' + fr + '</span></button>';
  };
  let list = '';
  mains().forEach((m) => {
    const subs = subsOf(m.code), mHit = !q || (m.code + ' ' + m.name).toLowerCase().indexOf(q) >= 0, sHits = subs.filter((s) => !q || (s.code + ' ' + s.name).toLowerCase().indexOf(q) >= 0);
    if (mHit || sHits.length) list += item(m);
    if (q) sHits.forEach((s) => { list += item(s, true); });
    else if (m === p || subs.indexOf(p) >= 0) subs.forEach((s) => { list += item(s, true); });
  });
  return '<aside class="rail" aria-label="Processes"><div class="rail-h">Processes <span class="n">' + procs().length + '</span><button type="button" data-act="railHide" aria-label="Fold the list away" title="Fold the list away"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4h12M2 8h9M2 12h12" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg></button></div>' +
    '<div class="rail-s">' + searchBox('q-rail', 'Find a process', UI.f.railQ, 'railQ') + '</div><div class="rail-l">' + (list || '<p class="note" style="padding:6px">No process matches.</p>') + '</div>' +
    '<div class="rail-f">Click one: you stay on the ' + esc((tabsFor().find((t) => t[0] === tab) || ['', ''])[1]) + ' tab. “—” is high-level.</div></aside>';
}
INP.railQ = (el) => { UI.f.railQ = el.value; render(); };
ACT.railHide = () => { UI.railHidden = true; render(); };
ACT.railShow = () => { UI.railHidden = false; render(); };

/* the process's own band: the Tracker's masthead, holding the process — its
   name and stage, the six marks, its counts and its seven tabs */
function processBand(p, tab, railOff) {
  const f = inForce(p), rank = rankOf(p), nx = nextMissing(p), showMarks = OPT.marksAll || isDeep(p), parent = p.parent && byCode(p.parent);
  const noCtl = p.controls.filter((c) => !c.control).length, openNc = p.ncs.filter((n) => n.status !== 'Closed').length;
  const primary = p.status === 'DRAFT' ? '<button class="btn gold sm" type="button" data-act="lcSendOpen">Send for review</button>'
    : p.status === 'APPROVED' ? '<button class="btn gold sm" type="button" data-act="lcPublish">Publish v' + latestVersion(p).n + ' to staff</button>'
    : p.status === 'IN_REVIEW' ? '<span class="pill navy">Waiting on ' + esc(personName(p.approver)) + '</span>' : '';
  const exp = menuBtn('pexp', 'Export', '<div class="mh">This process</div><button class="mi" type="button" data-go="sop~' + p.code + '">SOP document</button>' + mi('Process map, printed', 'toast', 'data-msg="Opens the printed map in Flow or Roles layout, ready to print."') + mi('RACI matrix · PDF or Excel', 'toast', 'data-msg="Downloads the RACI matrix in the product."') + mi('Authority matrix · PDF or Excel', 'toast', 'data-msg="Downloads the authority matrix in the product."') + '<div class="rule"></div><button class="mi" type="button" data-go="export">Report for several processes…</button>', { cls: 'bq' });
  const more = menuBtn('pmore', '⋯', mi('Edit details', 'editProcess', 'data-code="' + p.code + '"', 'Name, code, category, where it sits') + mi('Clone', 'cloneProcess', 'data-code="' + p.code + '"') + mi('Add a sub-process', 'newProcess', 'data-parent="' + p.code + '"') + '<div class="rule"></div>' + mi('Delete…', 'deleteProcess', 'bad data-code="' + p.code + '"'), { cls: 'bq', noCaret: true, aria: 'More', w: 220 });
  const ready = showMarks
    ? '<div class="mready"><span class="rl">Ready for staff <b>' + marksDone(p) + ' of 6</b></span>' + marks(p).map((m) => '<button type="button" class="mk2' + (m.done ? '' : ' no') + '" data-go="' + openP(p.code, m.tab) + '">' + m.label + '</button>').join('') +
      (nx ? '<span class="mnext">Next: <a data-go="' + openP(p.code, nx[0]) + '">' + nx[1] + '</a></span>' : '<span class="mnext">Ready. Every mark is done.</span>') + '</div>'
    : '<div class="mready"><span class="rl">High-level process</span><span class="mnext">No deep dive planned. Decide on <a data-go="priorities">Priorities</a>.</span></div>';
  const tabs = tabsFor().map(([k, l]) => '<a href="#" data-go="' + openP(p.code, k) + '"' + (k === tab ? ' class="on" aria-current="page"' : '') + (['people', 'compliance', 'connections'].indexOf(k) >= 0 ? ' style="font-style:italic"' : '') + '>' + l + tabCount(p, k) + '</a>').join('');
  const title = esc(p.name) + ' ' + statusPill(p) + (isDeep(p) ? '<a class="chip gold" href="#" data-go="priorities~plan">' + DEC[p.prio.dec] + (rank ? ' · rank ' + rank : '') + '</a>' : '');
  const sub = 'Owner <b>' + (p.owner ? esc(personName(p.owner)) : 'none yet') + '</b>' + (p.approver ? ' · Approver <b>' + esc(personName(p.approver)) + '</b>' : '') + (f && p.status !== 'PUBLISHED' ? ' · v' + f.n + ' in force for staff' : '');
  const tiles = (showMarks ? [[marksDone(p) + '/6', 'Ready', 0, openP(p.code, nx ? nx[0] : 'lifecycle')]] : []).concat([[p.steps.length, 'Steps', 0, openP(p.code, 'map')], [p.controls.length, 'Risks', 0, openP(p.code, 'risks')]]).concat(noCtl ? [[noCtl, 'No control', true, openP(p.code, 'risks')]] : []).concat([[openNc, 'Open issues', openNc > 0, openP(p.code, 'quality')]]);
  return phead(title, { eyebrow: '<a href="#" data-go="processes">' + esc(S.ws.name) + ' · Processes</a>' + (parent ? ' › <a href="#" data-go="' + openP(parent.code, tab) + '">' + parent.code + '</a>' : '') + ' › ' + p.code + (p.cat ? ' · ' + esc(p.cat) : ''), sub, tiles, extra: ready, tabs, tabsLabel: 'Views of this process',
    acts: (OPT.rail && railOff ? '<button class="bq" type="button" data-act="railShow">☰ Processes</button>' : '') + (OPT.aiPanel ? '<button class="bq" type="button" data-act="aiOpen">Check with AI</button>' : '') + exp + more + primary });
}
function tabCount(p, k) {
  const n = { map: p.steps.length, risks: p.controls.length, quality: p.ncs.filter((x) => x.status !== 'Closed').length }[k];
  return n ? ' <span class="c">' + n + '</span>' : '';
}
function tabBody(p, tab) {
  return ({ overview: tabOverview, map: tabMap, raci: tabRaci, authority: tabAuthority, risks: tabRisks, quality: tabQuality, lifecycle: tabLifecycle, ai: (x) => aiBody(x, true),
    people: () => '<div class="box"><div class="empty">Who reads and acknowledges this process is not recorded yet.</div></div>',
    compliance: () => '<div class="box"><div class="empty">Compliance coverage is not recorded yet for this process.</div></div>',
    connections: () => '<div class="box"><div class="empty">Connections to pillars, Tracker actions and systems are not recorded yet. The step-level hand-overs live on the map.</div></div>' }[tab])(p);
}

/* ── Overview ─────────────────────────────────────────────────────── */
function handovers(p) {
  const ins = [], outs = [];
  if (p.branchFrom) { const s = byCode(p.branchFrom.code); ins.push('<span class="chip">Branch</span><span class="code">' + s.code + '</span> ' + esc(s.name) + ' · step ' + stepNo(s, p.branchFrom.step) + ' <span class="arrow">→</span> starts here'); }
  p.ext.forEach((x) => { const s = byCode(x.code); if (s) ins.push('<span class="chip">In</span><span class="code">' + s.code + '</span> ' + esc(stepById(s, x.stepId).label) + ' <span class="arrow">→</span> step ' + stepNo(p, x.step) + ' ' + esc(stepById(p, x.step).label)); });
  p.steps.forEach((s) => s.links.forEach((c) => { const t = byCode(c); if (t && !t.deleted) outs.push('<span class="chip">Out</span>step ' + stepNo(p, s.id) + ' ' + esc(s.label) + ' <span class="arrow">→</span> <span class="code">' + t.code + '</span> ' + esc(t.name)); }));
  procs().forEach((o) => o.ext.forEach((x) => { if (x.code === p.code && !p.steps.find((s) => s.id === x.stepId && s.links.indexOf(o.code) >= 0)) outs.push('<span class="chip">Out</span>step ' + stepNo(p, x.stepId) + ' <span class="arrow">→</span> <span class="code">' + o.code + '</span> ' + esc(o.name) + ' · ' + esc(stepById(o, x.step).label)); }));
  procs().forEach((o) => { if (o.branchFrom && o.branchFrom.code === p.code) outs.push('<span class="chip">Branch</span>step ' + stepNo(p, o.branchFrom.step) + ' <span class="arrow">→</span> <span class="code">' + o.code + '</span> ' + esc(o.name) + ' picks up here'); });
  return { ins, outs };
}
function tabOverview(p) {
  const ho = handovers(p), roles = {}, exp = expectedReaders(p);
  p.steps.forEach((s) => { if (s.role) roles[s.role] = (roles[s.role] || 0) + 1; });
  const list = (a) => a.length ? '<ul>' + a.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '<p class="none">None recorded.</p>';
  return '<div class="stack">' +
    (p.desc ? '<p class="q" style="font-size:13.5px">' + esc(p.desc) + '</p>' : '') +
    '<div class="blk"><div class="blk-h"><span class="lbl">Purpose</span><button class="pen" type="button" data-act="docEdit">Edit</button></div>' + (p.purpose ? '<p>' + esc(p.purpose) + '</p>' : '<p class="none">No purpose recorded yet. It opens the SOP and the report.</p>') + '</div>' +
    '<div class="two"><div class="blk"><div class="blk-h"><span class="lbl">In scope</span><button class="pen" type="button" data-act="docEdit">Edit</button></div>' + list(p.inScope) + '</div>' +
    '<div class="blk"><div class="blk-h"><span class="lbl">Out of scope</span><button class="pen" type="button" data-act="docEdit">Edit</button></div>' + list(p.outScope) + '</div></div>' +
    '<div class="blk"><div class="blk-h"><span class="lbl">External entities <span class="n">' + p.entities.length + '</span></span><button class="pen" type="button" data-act="docEdit">Edit</button></div>' + (p.entities.length ? '<div class="flow">' + p.entities.map((e) => '<div><b>' + esc(e.name) + '</b> — ' + esc(e.desc) + '</div>').join('') + '</div>' : '<p class="none">None recorded.</p>') + '</div>' +
    '<div class="blk"><div class="blk-h"><span class="lbl">Measures <span class="n">' + p.kpis.length + '</span></span><button class="pen" type="button" data-act="kpiEdit">Edit</button></div>' + (p.kpis.length ? '<div class="tw"><table class="t"><thead><tr><th>Measure</th><th>Target</th><th>How often</th></tr></thead><tbody>' + p.kpis.map((k) => '<tr><td>' + esc(k.metric) + '</td><td class="num">' + esc(k.target) + '</td><td>' + esc(k.freq) + '</td></tr>').join('') + '</tbody></table></div>' : '<p class="none">No measures recorded yet.</p>') + '</div>' +
    (OPT.oldTabs ? '' : '<div class="two"><div class="blk"><div class="blk-h"><span class="lbl">Hand-overs</span><a class="lnk r" href="#" data-go="' + openP(p.code, 'map') + '">Set on the map →</a></div>' + (ho.ins.length + ho.outs.length ? '<div class="flow">' + ho.ins.concat(ho.outs).map((x) => '<div>' + x + '</div>').join('') + '</div>' : '<p class="none">Nothing hands over to or from another process yet.</p>') + '</div>' +
    '<div class="blk"><div class="blk-h"><span class="lbl">Who is involved</span></div>' + (Object.keys(roles).length ? '<div class="roles">' + Object.keys(roles).map((r) => '<span><b>' + esc(roleName(r)) + '</b> · ' + plural(roles[r], 'step') + '</span>').join('') + '</div><p class="note" style="margin-top:8px">' + plural(exp.length, 'person', 'people') + ' on the People register hold these roles. They are the ones asked to read and confirm each published version.</p>' : '<p class="none">No step has a role yet.</p>') + '</div></div>') +
    '</div>';
}
ACT.docEdit = () => {
  const p = CUR;
  dialog({ title: 'Purpose, scope and entities', sub: 'These open the SOP and each process page of the report.', wide: true, body: '<div class="frm">' + fld('Purpose', area('f-purpose', p.purpose, { rows: 3 })) +
    '<div class="frm two">' + fld('In scope', area('f-in', p.inScope.join('\n'), { rows: 4 }), { hint: 'One per line' }) + fld('Out of scope', area('f-out', p.outScope.join('\n'), { rows: 4 }), { hint: 'One per line' }) + '</div>' +
    fld('External entities', area('f-ent', p.entities.map((e) => e.name + ' — ' + e.desc).join('\n'), { rows: 3 }), { hint: 'One per line, as “Name — one sentence on its role”' }) + '</div>',
    foot: '<button class="btn" type="button" data-act="close">Cancel</button><button class="btn gold" type="button" data-act="docSave">Save</button>' });
};
const lines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);
ACT.docSave = () => { const p = CUR; p.purpose = val('f-purpose'); p.inScope = lines(val('f-in')); p.outScope = lines(val('f-out')); p.entities = lines(val('f-ent')).map((l) => { const [n, ...d] = l.split('—'); return { name: n.trim(), desc: d.join('—').trim() }; }).filter((e) => e.name && e.desc); UI.layer = null; toast('Saved.'); render(); };
ACT.kpiEdit = () => {
  const p = CUR, rows = p.kpis.concat([{ metric: '', target: '', freq: '' }]);
  dialog({ title: 'Measures', sub: 'Operational KPIs and SLAs. They print on the SOP and on Governance.', wide: true, body: '<div class="tw"><table class="t"><thead><tr><th>Metric</th><th>Target</th><th>Frequency</th></tr></thead><tbody>' + rows.map((k, i) => '<tr><td>' + inp('k-m' + i, k.metric).replace('<input', '<input class="inp"') + '</td><td>' + inp('k-t' + i, k.target).replace('<input', '<input class="inp"') + '</td><td>' + inp('k-f' + i, k.freq).replace('<input', '<input class="inp"') + '</td></tr>').join('') + '</tbody></table></div><p class="note">Leave a row empty to remove it. The last row is a new one.</p>',
    foot: '<button class="btn" type="button" data-act="close">Cancel</button><button class="btn gold" type="button" data-act="kpiSave" data-n="' + rows.length + '">Save</button>' });
};
ACT.kpiSave = (el) => {
  const out = [];
  for (let i = 0; i < Number(el.dataset.n); i++) { const m = val('k-m' + i), t = val('k-t' + i), f = val('k-f' + i); if (m && !t) { toast('Row ' + (i + 1) + ' is missing a target — fill it in, or remove the row, then save again.'); return; } if (m) out.push({ metric: m, target: t, freq: f }); }
  CUR.kpis = out; UI.layer = null; toast('Saved.'); render();
};

/* ── Map ──────────────────────────────────────────────────────────── */
function stepChips(p, s) {
  const c = [];
  const sla = slaDays(p, s.id); if (sla) c.push('<span class="chip">SLA ' + sla + 'd</span>');
  s.links.forEach((l) => c.push('<span class="chip gold">→ ' + l + '</span>'));
  procs().filter((o) => o.branchFrom && o.branchFrom.code === p.code && o.branchFrom.step === s.id).forEach((o) => c.push('<span class="chip attn">↳ ' + o.code + '</span>'));
  p.ext.filter((x) => x.step === s.id).forEach((x) => c.push('<span class="chip attn">← ' + x.code + '</span>'));
  return c.join(' ');
}
function tabMap(p) {
  const view = UI.f.mapView || 'diagram', selId = UI.sel.step && stepById(p, UI.sel.step) ? UI.sel.step : null;
  const bar = '<div class="mapbar"><div class="seg"><button type="button" class="' + (view === 'diagram' ? 'on' : '') + '" data-act="mapView" data-v="diagram">Diagram</button><button type="button" class="' + (view === 'list' ? 'on' : '') + '" data-act="mapView" data-v="list">Steps list</button></div>' +
    '<button class="btn gold sm" type="button" data-act="stepAdd">+ Add step</button><button class="btn sm" type="button" data-act="stepBulk">Add several</button>' +
    (p.steps.length ? '' : '<button class="btn sm" type="button" data-act="aiDraft" data-into="' + p.code + '">Draft it with AI</button>') +
    (view === 'list' && p.steps.length > 1 ? '<button class="btn sm" type="button" data-act="arrange">↓↑ Arrange by flow</button>' : '') +
    '<span class="r"><button class="btn sm" type="button" data-act="toast" data-msg="Downloads the map as a picture in the product.">⬇ PNG</button><button class="btn sm" type="button" data-act="toast" data-msg="Opens the printed map, ready to print.">Print</button></span></div>';
  const props = p.proposals.length ? '<div class="stack" style="margin-bottom:10px">' + p.proposals.map((x) => '<div class="banner attn" style="margin:0;display:flex;flex-wrap:wrap;gap:8px;align-items:center;border-style:dashed"><span><b>Proposed · from Check with AI</b> · ' + esc(x.label) + ' · ' + (x.after ? 'after “' + esc((stepById(p, x.after) || { label: '?' }).label) + '”' : 'not placed yet — it will be added at the end') + (x.notes ? ' · ' + esc(x.notes) : '') + '</span><span class="acts" style="margin-left:auto"><button class="btn sm gold" type="button" data-act="propConfirm" data-id="' + x.id + '">Confirm</button><button class="btn sm" type="button" data-act="propDelete" data-id="' + x.id + '">Delete</button></span></div>').join('') + '</div>' : '';
  if (!p.steps.length) return bar + props + '<div class="box"><div class="empty"><b>No steps yet</b>Draw the process step by step, paste a list, or let AI draft it from your notes.<div class="acts"><button class="btn gold" type="button" data-act="aiDraft" data-into="' + p.code + '">Draft it with AI</button><button class="btn" type="button" data-act="stepAdd">Add the first step</button><button class="btn" type="button" data-act="stepBulk">Add several at once</button></div></div></div>';
  return bar + props + '<div class="mapgrid' + (selId ? '' : ' nodrawer') + '"><div style="min-width:0">' + (view === 'diagram' ? diagram(p, selId) : stepList(p, selId)) +
    '<p class="note" style="margin-top:8px">Click a step to see what RACI, Authority and Risks say about it, and to edit it.</p></div>' + (selId ? drawer(p, stepById(p, selId)) : '') + '</div>';
}
function diagram(p, selId) {
  const L = layout(p), lanes = L.lanes.length, cols = L.cols;
  let h = '<div class="lanes-wrap"><div class="lanes" id="lanes" style="grid-template-columns:132px repeat(' + cols + ',minmax(172px,1fr));grid-template-rows:repeat(' + lanes + ',122px);min-width:' + (132 + cols * 172) + 'px">';
  L.lanes.forEach((r, i) => { h += '<div class="lane-bg' + (i === 0 ? ' first' : '') + (i % 2 ? ' z' : '') + '" style="grid-row:' + (i + 1) + '"></div><div class="lane-l" style="grid-row:' + (i + 1) + '">' + esc(r === '_' ? 'Unassigned' : roleName(r)) + '</div>'; });
  p.steps.forEach((s, i) => {
    const pos = L.pos[s.id], gaps = stepGaps(p, s), gate = s.type === 'DECISION' ? gateLine(p, s.id) : '';
    h += '<button type="button" class="st' + (s.type === 'DECISION' ? ' dec' : '') + (s.type === 'START' || s.type === 'END' ? ' ends' : '') + (s.id === selId ? ' on' : '') + '" id="st-' + s.id + '" data-act="stepPick" data-id="' + s.id + '" style="grid-row:' + (pos.lane + 1) + ';grid-column:' + (pos.col + 2) + '">' +
      (gaps.length ? '<span class="chip bad flag" title="' + esc(gaps.map((g) => GAP_SENTENCE[g]).join(' ')) + '">⚠ ' + gaps.length + '</span>' : '') +
      (s.type === 'START' || s.type === 'END' ? '<span class="n">' + s.type + '</span><b>' + esc(s.label) + '</b>' :
        '<span class="n">STEP ' + (i + 1) + (s.type === 'DECISION' ? ' · DECISION' : '') + '</span>' + (s.milestone ? '<span title="Milestone" style="position:absolute;top:6px;right:8px;color:var(--gold-deep);font-size:12px">★</span>' : '') + '<b>' + esc(s.label) + '</b>' + (gate ? '<span class="k">' + esc(gate) + '</span>' : s.output ? '<span class="k">' + esc(s.output.length > 34 ? s.output.slice(0, 32) + '…' : s.output) + '</span>' : '') + (stepChips(p, s) ? '<span class="ho">' + stepChips(p, s) + '</span>' : '')) + '</button>';
  });
  h += '<svg class="edges" id="edges-map" aria-hidden="true"></svg></div></div>';
  AFTER.push(() => drawArrows($('#lanes'), $('#edges-map'), p.conn.map((c) => ({ from: 'st-' + c.from, to: 'st-' + c.to, label: c.label, dash: p.steps.findIndex((s) => s.id === c.to) <= p.steps.findIndex((s) => s.id === c.from) }))));
  return h;
}
function stepList(p, selId) {
  return '<div class="tw"><table class="t"><thead><tr><th>#</th><th>Step</th><th>Who</th><th>Connects from</th><th>Rule</th><th>Gaps</th><th class="r"></th></tr></thead><tbody>' +
    p.steps.map((s, i) => {
      const from = p.conn.filter((c) => c.to === s.id).map((c) => esc(stepById(p, c.from).label) + (c.label ? ' (' + esc(c.label) + ')' : '')).concat(p.ext.filter((x) => x.step === s.id).map((x) => 'waits on ' + x.code));
      const gaps = stepGaps(p, s), rules = rulesFor(p, s.id);
      const props = p.proposals.filter((x) => x.after === s.id).map((x) => '<tr class="prop"><td></td><td colspan="6"><b>Proposed · from Check with AI</b> · ' + esc(x.label) + ' <span class="acts" style="display:inline-flex;margin-left:8px"><button class="btn sm gold" type="button" data-act="propConfirm" data-id="' + x.id + '">Confirm</button><button class="btn sm" type="button" data-act="propDelete" data-id="' + x.id + '">Delete</button></span></td></tr>').join('');
      return '<tr class="hov' + (s.id === selId ? ' sel' : '') + '" data-act="stepPick" data-id="' + s.id + '"><td class="num">' + (s.type === 'START' || s.type === 'END' ? '<span class="q">' + s.type.toLowerCase() + '</span>' : i + 1) + '</td>' +
        '<td><b>' + esc(s.label) + '</b> ' + (s.type === 'DECISION' ? '<span class="chip">Decision</span> ' : '') + (s.milestone ? '<span class="chip gold">★ Milestone</span> ' : '') + (s.actions.length || s.inputs || s.output ? '<span class="chip good">Documented</span>' : '') + (stepChips(p, s) ? '<span class="psub">' + stepChips(p, s) + '</span>' : '') + '</td>' +
        '<td>' + (s.role ? esc(roleName(s.role)) : '<span class="q">No role</span>') + '</td><td>' + (from.length ? from.join(', ') : '<span class="q">' + (i === 0 ? 'Entry point' : '—') + '</span>') + '</td>' +
        '<td>' + (rules.length ? rules.map((r) => esc(ruleSentence(r))).join('<br>') : p.auth.skip.indexOf(s.id) >= 0 ? '<span class="q">No approval needed</span>' : '<span class="q">—</span>') + '</td>' +
        '<td>' + (gaps.length ? '<span class="chip bad" title="' + esc(gaps.map((g) => GAP_SENTENCE[g]).join(' ')) + '">⚠ ' + gaps.join(' · ') + '</span>' : '') + '</td>' +
        '<td class="r" style="white-space:nowrap"><button class="btn sm ghost" type="button" data-act="stepMove" data-id="' + s.id + '" data-d="-1" aria-label="Move up">▲</button><button class="btn sm ghost" type="button" data-act="stepMove" data-id="' + s.id + '" data-d="1" aria-label="Move down">▼</button></td></tr>' + props;
    }).join('') + '</tbody></table></div>';
}
function drawer(p, s) {
  const rules = rulesFor(p, s.id), ctls = p.controls.filter((c) => c.step === s.id), gaps = stepGaps(p, s);
  const raci = Object.keys(p.raci.cells).filter((k) => k.indexOf(s.id + '|') === 0 && p.raci.cells[k]).map((k) => p.raci.cells[k] + ' ' + roleName(k.split('|')[1]));
  const part = (t, body) => '<div class="part"><span class="lbl">' + t + '</span>' + body + '</div>';
  const isEnd = s.type === 'START' || s.type === 'END';
  return '<aside class="drawer" aria-label="Step detail"><div class="drawer-h"><div><div class="n">' + (isEnd ? s.type : 'STEP ' + stepNo(p, s.id) + (s.type === 'DECISION' ? ' · DECISION' : '')) + '</div><h3>' + esc(s.label) + '</h3></div><button class="x" type="button" data-act="stepClose" aria-label="Close">×</button></div>' +
    '<div class="drawer-b"><dl class="dl"><dt>Who</dt><dd>' + (s.role ? esc(roleName(s.role)) : '<span class="miss">No role</span>') + '</dd>' + (isEnd ? '' : '<dt>Takes in</dt><dd>' + (s.inputs ? esc(s.inputs) : '<span class="q">—</span>') + '</dd><dt>Hands on</dt><dd>' + (s.output ? esc(s.output) : '<span class="q">—</span>') + '</dd>') + '</dl>' +
    (gaps.length ? '<div class="banner bad" style="margin:0">' + gaps.map((g) => GAP_SENTENCE[g]).join('<br>') + '</div>' : '') +
    (isEnd ? '' : part('Detailed action', s.actions.length ? '<ol style="padding-left:18px;font-size:13px;margin-top:3px">' + s.actions.map((a) => '<li>' + esc(a) + '</li>').join('') + '</ol>' : '<p class="q">Not written yet.</p>') +
      part('From Authority', '<p>' + (rules.length ? rules.map((r) => esc(ruleSentence(r))).join('<br>') : p.auth.skip.indexOf(s.id) >= 0 ? 'No approval needed.' : '<span class="q">No rule yet.</span>') + '</p>') +
      part('From Risks &amp; controls', '<p>' + (ctls.length ? ctls.map((c) => esc(c.risk) + ': ' + (c.control ? esc(c.control) : '<b style="color:var(--bad-tx)">no control</b>')).join('<br>') : '<span class="q">No risk recorded on this step.</span>') + '</p>') +
      part('From RACI', '<p>' + (raci.length ? esc(raci.join(' · ')) : '<span class="q">Nobody assigned yet.</span>') + '</p>') +
      (s.risk ? part('Risk if mishandled', '<p>' + esc(s.risk) + '</p>') : '') + (s.errors ? part('Common errors', '<p>' + esc(s.errors) + '</p>') : '') +
      (s.links.length ? part('Hands over to', '<p>' + s.links.map((c) => '<a class="lnk" href="#" data-go="' + openP(c, 'map') + '">' + c + ' ' + esc((byCode(c) || {}).name || '') + '</a>').join('<br>') + '</p>') : '')) + '</div>' +
    '<div class="drawer-f"><button class="btn sm gold" type="button" data-act="stepEdit" data-id="' + s.id + '">Edit step</button>' + (isEnd ? '' : '<button class="btn sm" type="button" data-act="stepStar" data-id="' + s.id + '">' + (s.milestone ? '★ Milestone' : '☆ Make a milestone') + '</button>') + '<button class="btn sm danger" type="button" data-act="stepDelete" data-id="' + s.id + '" style="margin-left:auto">Delete</button></div></aside>';
}
ACT.mapView = (el) => { UI.f.mapView = el.dataset.v; render(); };
ACT.stepPick = (el) => { UI.sel.step = el.dataset.id; render(); };
ACT.stepClose = () => { UI.sel.step = null; render(); };
ACT.stepStar = (el) => { const s = stepById(CUR, el.dataset.id); s.milestone = !s.milestone; toast(s.milestone ? 'On the Helicopter View rails now.' : 'Taken off the rails.'); render(); };
ACT.stepMove = (el) => { const a = CUR.steps, i = a.findIndex((s) => s.id === el.dataset.id), j = i + Number(el.dataset.d); if (j < 0 || j >= a.length) return; const t = a[i]; a[i] = a[j]; a[j] = t; render(); };
ACT.arrange = () => { const p = CUR, L = layout(p); p.steps.sort((a, b) => L.pos[a.id].col - L.pos[b.id].col); toast('Renumbered so each step follows whatever connects into it.'); render(); };
ACT.stepDelete = (el) => {
  const s = stepById(CUR, el.dataset.id);
  dialog({ title: 'Delete this step?', body: '<p>“' + esc(s.label) + '” and its connections, RACI cells and authority rules go. Steps after it keep their place.</p>', foot: '<button class="btn" type="button" data-act="close">No</button><button class="btn danger solid" type="button" data-act="stepDoDelete" data-id="' + s.id + '">Yes, delete</button>' });
};
ACT.stepDoDelete = (el) => {
  const p = CUR, id = el.dataset.id;
  p.steps = p.steps.filter((s) => s.id !== id); p.conn = p.conn.filter((c) => c.from !== id && c.to !== id); p.ext = p.ext.filter((x) => x.step !== id);
  Object.keys(p.raci.cells).forEach((k) => { if (k.indexOf(id + '|') === 0) delete p.raci.cells[k]; }); p.auth.rules = p.auth.rules.filter((r) => r.step !== id);
  UI.sel.step = null; UI.layer = null; toast('Step deleted.'); render();
};
ACT.stepBulk = () => dialog({ title: 'Add several steps at once', body: fld('Steps', area('f-bulk', '', { rows: 7, ph: 'One step per line' }), { hint: 'Each line is added as a Task, chained to the one before it.' }), foot: '<button class="btn" type="button" data-act="close">Cancel</button><button class="btn gold" type="button" data-act="stepBulkGo">Add steps</button>' });
ACT.stepBulkGo = () => {
  const p = CUR, ls = lines(val('f-bulk')); if (!ls.length) { toast('Write at least one step.'); return; }
  let prev = p.steps.length ? p.steps[p.steps.length - 1].id : null;
  ls.forEach((l) => { const s = { id: uid('s'), type: 'TASK', label: l, role: null, actions: [], risk: '', inputs: '', output: '', errors: '', links: [], milestone: false, phase: null, support: [], requiresAll: false, note: '' }; p.steps.push(s); if (prev) p.conn.push({ from: prev, to: s.id, label: '' }); prev = s.id; });
  UI.layer = null; toast('Added ' + plural(ls.length, 'step') + ' — give each a role next.'); render();
};

/* the step form: one shape for adding and editing; a working copy keeps typed values across re-draws */
function stepForm() {
  const p = CUR, e = UI.f.edit, others = p.steps.filter((s) => s.id !== e.id);
  const optsSteps = [['', '— entry point —']].concat(others.map((s) => [s.id, '[' + s.type[0] + s.type.slice(1).toLowerCase() + '] ' + s.label]));
  const extOpts = [['', '— pick a step —']]; procs().filter((x) => x !== p && x.steps.length).forEach((x) => x.steps.forEach((s, i) => extOpts.push([x.code + '|' + s.id, x.code + ' · ' + (i + 1) + '. ' + s.label])));
  return '<div class="frm">' + '<div class="frm two">' + fld('Step name', inp('e-label', e.label, { ph: 'e.g. Confirm delivery' }), { req: true }) + fld('Type', sel('e-type', [['TASK', 'Task'], ['DECISION', 'Decision'], ['START', 'Start'], ['END', 'End']], e.type, { chg: 'editSync' })) +
    fld('Assigned role', sel('e-role', [['', '— none —']].concat(liveRoles().map((r) => [r.id, r.name])), e.role || ''), { hint: 'Also sets the swimlane.' }) +
    (e.isNew ? fld('Insert', sel('e-after', [['', 'at the end of the list']].concat(p.steps.map((s) => [s.id, 'after ' + s.label])), e.after || '')) : fld('Value chain phase', sel('e-phase', [['', '— unphased —']].concat(S.phases.map((x) => [x.id, x.name])), e.phase || ''))) + '</div>' +
    '<div class="blk"><div class="blk-h"><span class="lbl">Connects from</span><button class="btn sm r" type="button" data-act="editAddPred">+ Add predecessor</button></div><div class="stack">' +
    e.preds.map((x, i) => '<div class="frm two" style="grid-template-columns:minmax(0,1fr) minmax(0,140px) auto;align-items:end">' + fld('Step', sel('e-pf' + i, optsSteps, x.from)) + fld('Connector label', inp('e-pl' + i, x.label, { ph: 'Yes / No' })) + '<button class="btn sm" type="button" data-act="editDelPred" data-i="' + i + '">Remove</button></div>').join('') +
    (e.preds.length > 1 ? '<label class="checks"><label><input type="checkbox" id="e-all"' + (e.requiresAll ? ' checked' : '') + '> Requires all predecessors (every incoming step must finish first)</label></label>' : '') + '</div></div>' +
    '<div class="blk"><div class="blk-h"><span class="lbl">Waits on a step in another process</span><button class="btn sm r" type="button" data-act="editAddExt">+ Add one</button></div><div class="stack">' +
    (e.ext.length ? e.ext.map((x, i) => '<div class="frm two" style="grid-template-columns:minmax(0,1fr) minmax(0,140px) auto;align-items:end">' + fld('Step', sel('e-xf' + i, extOpts, x.key)) + fld('Label', inp('e-xl' + i, x.label)) + '<button class="btn sm" type="button" data-act="editDelExt" data-i="' + i + '">Remove</button></div>').join('') : '<p class="note">None. Use this when this step cannot start until a step in another process is done.</p>') + '</div></div>' +
    (e.type === 'DECISION' ? '<div class="blk"><div class="blk-h"><span class="lbl">Branches</span><button class="btn sm r" type="button" data-act="editAddBr">+ Add another outcome</button></div><div class="stack">' + e.branches.map((b, i) => '<div class="frm two" style="grid-template-columns:minmax(0,120px) minmax(0,1fr) auto;align-items:end">' + fld('Outcome', inp('e-bl' + i, b.label)) + fld('Goes to', sel('e-bt' + i, [['', '— not set yet —']].concat(others.map((s) => [s.id, s.label])), b.to)) + '<button class="btn sm" type="button" data-act="editDelBr" data-i="' + i + '">Remove</button></div>').join('') + '</div></div>' : '') +
    fld('Detailed action', area('e-actions', e.actions.join('\n'), { rows: 3 }), { hint: 'One action per line. Prints on the report and the SOP.' }) +
    '<div class="frm two">' + fld('Inputs, tools and systems', area('e-inputs', e.inputs, { rows: 2 })) + fld('Expected output', area('e-output', e.output, { rows: 2 })) + fld('Risk if mishandled', area('e-risk', e.risk, { rows: 2 })) + fld('Common errors and exceptions', area('e-errors', e.errors, { rows: 2 })) + '</div>' +
    '<div class="blk"><div class="blk-h"><span class="lbl">Hands over to another process</span></div><div class="checks">' + procs().filter((x) => x !== p).map((x) => '<label><input type="checkbox" name="e-links" value="' + x.code + '"' + (e.links.indexOf(x.code) >= 0 ? ' checked' : '') + '> ' + x.code + ' — ' + esc(x.name) + '</label>').join('') + '</div></div>' +
    '<p class="note">The SLA and the approval limit come from the Authority tab. The AI note is set only by Check with AI.</p></div>';
}
function editSync() {
  const e = UI.f.edit; if (!e || !$('#e-label')) return;
  e.label = val('e-label'); e.type = val('e-type'); e.role = val('e-role') || null; e.after = val('e-after'); e.phase = val('e-phase') || null;
  e.preds = e.preds.map((x, i) => ({ from: val('e-pf' + i), label: val('e-pl' + i) })); e.requiresAll = !!val('e-all');
  e.ext = e.ext.map((x, i) => ({ key: val('e-xf' + i), label: val('e-xl' + i) }));
  e.branches = (e.branches || []).map((b, i) => ({ label: $('#e-bl' + i) ? val('e-bl' + i) : b.label, to: $('#e-bt' + i) ? val('e-bt' + i) : b.to }));
  e.actions = lines(val('e-actions')); e.inputs = val('e-inputs'); e.output = val('e-output'); e.risk = val('e-risk'); e.errors = val('e-errors'); e.links = checkedVals('e-links');
}
CHG.editSync = () => { editSync(); if (UI.f.edit.type === 'DECISION' && !UI.f.edit.branches.length) UI.f.edit.branches = [{ label: 'Yes', to: '' }, { label: 'No', to: '' }]; render(); };
ACT.editAddPred = () => { editSync(); UI.f.edit.preds.push({ from: '', label: '' }); render(); };
ACT.editDelPred = (el) => { editSync(); UI.f.edit.preds.splice(Number(el.dataset.i), 1); render(); };
ACT.editAddExt = () => { editSync(); UI.f.edit.ext.push({ key: '', label: '' }); render(); };
ACT.editDelExt = (el) => { editSync(); UI.f.edit.ext.splice(Number(el.dataset.i), 1); render(); };
ACT.editAddBr = () => { editSync(); UI.f.edit.branches.push({ label: '', to: '' }); render(); };
ACT.editDelBr = (el) => { editSync(); UI.f.edit.branches.splice(Number(el.dataset.i), 1); render(); };
function openStepSheet(e) {
  UI.f.edit = e;
  sheet({ title: e.isNew ? 'Add a step' : 'Edit step', sub: e.isNew ? CUR.code + ' ' + esc(CUR.name) : 'Step ' + stepNo(CUR, e.id) + ' of ' + CUR.code, body: stepForm, foot: '<button class="btn" type="button" data-act="close">Cancel</button><button class="btn gold" type="button" data-act="stepSave">' + (e.isNew ? '+ Add step' : 'Save') + '</button>' });
}
ACT.stepAdd = () => {
  const p = CUR, last = p.steps[p.steps.length - 1];
  openStepSheet({ isNew: true, id: null, label: '', type: 'TASK', role: (last && last.role) || '', after: '', phase: null, preds: last ? [{ from: last.id, label: '' }] : [], ext: [], branches: [], requiresAll: false, actions: [], inputs: '', output: '', risk: '', errors: '', links: [] });
};
ACT.stepEdit = (el) => {
  const p = CUR, s = stepById(p, el.dataset.id);
  openStepSheet({ isNew: false, id: s.id, label: s.label, type: s.type, role: s.role, phase: s.phase, preds: p.conn.filter((c) => c.to === s.id).map((c) => ({ from: c.from, label: c.label })), ext: p.ext.filter((x) => x.step === s.id).map((x) => ({ key: x.code + '|' + x.stepId, label: x.label })),
    branches: s.type === 'DECISION' ? p.conn.filter((c) => c.from === s.id).map((c) => ({ label: c.label, to: c.to })) : [], requiresAll: s.requiresAll, actions: s.actions.slice(), inputs: s.inputs, output: s.output, risk: s.risk, errors: s.errors, links: s.links.slice() });
};
ACT.stepSave = () => {
  editSync();
  const p = CUR, e = UI.f.edit;
  if (!e.label) { toast('A step needs a name.'); return; }
  let s;
  if (e.isNew) {
    s = { id: uid('s'), milestone: false, support: [], note: '', phase: null };
    const at = e.after ? p.steps.findIndex((x) => x.id === e.after) + 1 : p.steps.length;
    p.steps.splice(at, 0, s);
  } else s = stepById(p, e.id);
  Object.assign(s, { label: e.label, type: e.type, role: e.role, actions: e.actions, inputs: e.inputs, output: e.output, risk: e.risk, errors: e.errors, links: e.links, requiresAll: e.requiresAll });
  if (!e.isNew) s.phase = e.phase;
  p.conn = p.conn.filter((c) => c.to !== s.id && !(e.type === 'DECISION' && c.from === s.id));
  e.preds.filter((x) => x.from).forEach((x) => p.conn.push({ from: x.from, to: s.id, label: x.label }));
  if (e.type === 'DECISION') e.branches.filter((b) => b.to).forEach((b) => p.conn.push({ from: s.id, to: b.to, label: b.label }));
  p.ext = p.ext.filter((x) => x.step !== s.id).concat(e.ext.filter((x) => x.key).map((x) => ({ step: s.id, code: x.key.split('|')[0], stepId: x.key.split('|')[1], label: x.label })));
  UI.sel.step = s.id; UI.layer = null; UI.f.edit = null; toast(e.isNew ? 'Step added.' : 'Step saved.'); render();
};
ACT.propConfirm = (el) => {
  const p = CUR, x = p.proposals.find((y) => y.id === el.dataset.id), s = { id: uid('s'), type: 'TASK', label: x.label, role: null, actions: x.notes ? [x.notes] : [], risk: '', inputs: '', output: '', errors: '', links: [], milestone: false, phase: null, support: [], requiresAll: false, note: '' };
  const at = x.after ? p.steps.findIndex((y) => y.id === x.after) + 1 : p.steps.length;
  p.steps.splice(at, 0, s);
  if (x.after) { p.conn.filter((c) => c.from === x.after).forEach((c) => { c.from = s.id; }); p.conn.push({ from: x.after, to: s.id, label: '' }); }
  p.proposals = p.proposals.filter((y) => y !== x); if (x.finding) x.finding.status = 'Integrated';
  toast('Added as step ' + (at + 1) + '.'); render();
};
ACT.propDelete = (el) => { const p = CUR, x = p.proposals.find((y) => y.id === el.dataset.id); p.proposals = p.proposals.filter((y) => y !== x); if (x.finding) x.finding.status = 'New'; toast('Proposal removed; the finding is open again.'); render(); };

/* ── RACI ─────────────────────────────────────────────────────────── */
const CYCLE = { '': 'R', R: 'A', A: 'C', C: 'I', I: '' };
function tabRaci(p) {
  const rows = raciRows(p), cols = raciCols(p), issues = raciIssues(p), fin = p.raci.final, sug = UI.f.sug || {};
  if (!rows.length) return '<div class="box"><div class="empty"><b>Map the steps first</b>Every task and decision on the map becomes a row here.<div class="acts">' + goBtn(openP(p.code, 'map'), 'Go to the map') + '</div></div></div>';
  const bar = '<div class="filters">' + (fin ? '<span class="chip good">Final · ' + dt(p.raci.finalAt) + '</span><button class="btn sm" type="button" data-act="raciReopen">Reopen to change</button>'
      : '<span class="chip">Draft</span><button class="btn sm gold" type="button" data-act="raciFinal"' + (issues.length ? ' disabled title="Give every task one A and at least one R first"' : '') + '>Mark final</button><button class="btn sm" type="button" data-act="raciFill">Fill from step owners</button><button class="btn sm" type="button" data-act="raciSuggest">Suggest</button>' +
        menuBtn('raci-add', '+ Add title', liveRoles().filter((r) => cols.indexOf(r.id) < 0).map((r) => mi(esc(r.name), 'raciPin', 'data-id="' + r.id + '"')).join('') || '<p class="note" style="padding:8px 14px">Every title is already a column.</p>', { cls: 'btn sm', w: 220 })) +
    '<span style="margin-left:auto" class="legend"><span><span class="rc R">R</span> does it</span><span><span class="rc A">A</span> answers for it</span><span><span class="rc C">C</span> is asked</span><span><span class="rc I">I</span> is told</span></span></div>';
  const banner = fin ? '' : issues.length ? '<div class="banner bad">' + plural(issues.length, 'task') + ' missing an Accountable or Responsible — finalisation blocked.</div>' : '<div class="banner good">Ready to finalise — every task has exactly one Accountable and at least one Responsible.</div>';
  const body = rows.map((r) => {
    const skipped = p.raci.skip.indexOf(r.id) >= 0, issue = raciRowIssue(p, r.id);
    return '<tr' + (skipped ? ' style="opacity:.55"' : '') + '><td style="' + (issue ? 'box-shadow:inset 3px 0 0 var(--bad);' : '') + 'min-width:220px">' + (skipped ? '<s>' + esc(r.label) + '</s>' : esc(r.label)) + '<span class="psub">' + (r.act ? 'Activity' + (r.step ? ' · step ' + stepNo(p, r.step) : '') : r.type === 'DECISION' ? 'Decision · step ' + stepNo(p, r.id) : 'Step ' + stepNo(p, r.id)) + (issue ? ' · <span style="color:var(--bad-tx);font-weight:600">' + issue + '</span>' : '') + '</span></td>' +
      cols.map((c) => {
        const k = raciKey(r.id, c), v = p.raci.cells[k] || '', sg = !v && sug[k];
        if (skipped) return '<td class="c"><span class="rc x">—</span></td>';
        if (sg) return '<td class="c"><button class="rc sug" type="button" data-act="raciAccept" data-k="' + k + '" title="Suggested from the org chart: the owner\'s manager. Click to accept.">' + sg + '</button></td>';
        return '<td class="c">' + (fin ? '<span class="rc ' + (v || 'x') + '">' + (v || '·') + '</span>' : '<button class="rc ' + (v || 'x') + '" type="button" data-act="raciCycle" data-k="' + k + '" aria-label="' + esc(r.label) + ', ' + esc(roleName(c)) + ': ' + (v || 'empty') + '">' + (v || '·') + '</button>') + (p.raci.dots.indexOf(k) >= 0 ? '<span style="color:var(--stone);font-size:9px;vertical-align:top">●</span>' : '') + '</td>';
      }).join('') +
      '<td class="r" style="white-space:nowrap">' + (fin ? '' : r.act ? '<button class="btn sm ghost" type="button" data-act="raciDelAct" data-id="' + r.id + '">Delete</button>' : '<button class="btn sm ghost" type="button" data-act="raciSkip" data-id="' + r.id + '">' + (skipped ? 'Skipped ✕' : 'Skip') + '</button>') + '</td></tr>';
  }).join('');
  return bar + banner + '<div class="tw"><table class="t"><thead><tr><th>Task</th>' + cols.map((c) => '<th class="c" style="white-space:normal;min-width:84px">' + esc(roleName(c)) + '</th>').join('') + '<th></th></tr></thead><tbody>' + body + '</tbody></table></div>' +
    (fin ? '<p class="note" style="margin-top:8px">Final. Reopen it to change a letter. PDF and Excel are in Export, in the header.</p>' : '<div class="filters" style="margin-top:12px">' + '<input class="inp" id="raci-act" placeholder="New activity, e.g. Reconcile the statement" style="max-width:340px" data-enter="raciAddAct">' + sel('raci-act-step', [['', 'Freestanding']].concat(workSteps(p).map((s) => [s.id, 'Under step ' + stepNo(p, s.id) + ' ' + s.label])), '') + '<button class="btn sm" type="button" data-act="raciAddAct">Add activity</button><span class="note">Click a cell to cycle R → A → C → I → empty.</span></div>');
}
ACT.raciCycle = (el) => { const p = CUR, k = el.dataset.k, v = p.raci.cells[k] || ''; p.raci.cells[k] = CYCLE[v]; if (!p.raci.cells[k]) delete p.raci.cells[k]; p.raci.dots = p.raci.dots.filter((x) => x !== k); render(); };
ACT.raciFill = () => { const p = CUR; let n = 0; workSteps(p).forEach((s) => { if (!s.role) return; const k = raciKey(s.id, s.role); if (!p.raci.cells[k]) { p.raci.cells[k] = 'R'; p.raci.dots.push(k); n++; } }); toast(n ? n + ' empty cells filled · existing entries untouched' : 'Nothing to fill — every owner already has a letter.'); render(); };
ACT.raciSuggest = () => {
  const p = CUR, sug = {}, cols = raciCols(p);
  raciRows(p).forEach((r) => {
    if (raciRowIssue(p, r.id) !== 'no accountable') return;
    const s = stepById(p, r.step || r.id); if (!s || !s.role) return;
    const holders = livePeople().filter((x) => x.roles.indexOf(s.role) >= 0 && x.mgr), mroles = {};
    holders.forEach((h) => (personById(h.mgr) || { roles: [] }).roles.filter((x) => x !== s.role).forEach((x) => { mroles[x] = (mroles[x] || 0) + 1; }));
    const best = Object.keys(mroles).sort((a, b) => mroles[b] - mroles[a] || a.localeCompare(b))[0];
    if (best && cols.indexOf(best) >= 0 && !p.raci.cells[raciKey(r.id, best)]) sug[raciKey(r.id, best)] = 'A';
  });
  UI.f.sug = sug; toast(Object.keys(sug).length ? 'Suggestions shown — nothing saved yet' : 'Nothing to suggest'); render();
};
ACT.raciAccept = (el) => { CUR.raci.cells[el.dataset.k] = UI.f.sug[el.dataset.k]; delete UI.f.sug[el.dataset.k]; toast('Accepted and saved'); render(); };
ACT.raciFinal = () => { const p = CUR; if (raciIssues(p).length) return; p.raci.final = true; p.raci.finalAt = todayIso(); UI.f.sug = {}; S.feed.unshift([todayIso(), 'RACI of <b>' + esc(p.name) + '</b> marked final']); toast('Marked final. The RACI mark is done.'); render(); };
ACT.raciReopen = () => { CUR.raci.final = false; toast('Reopened. Mark it final again when it is right.'); render(); };
ACT.raciSkip = (el) => { const p = CUR, i = p.raci.skip.indexOf(el.dataset.id); if (i >= 0) p.raci.skip.splice(i, 1); else p.raci.skip.push(el.dataset.id); render(); };
ACT.raciPin = (el) => { CUR.raci.pinned.push(el.dataset.id); UI.menu = null; render(); };
ACT.raciAddAct = () => { const n = val('raci-act'); if (!n) { toast('Name the activity first.'); return; } CUR.raci.acts.push({ id: uid('act'), name: n, step: val('raci-act-step') || null }); render(); };
ACT.raciDelAct = (el) => { const p = CUR; p.raci.acts = p.raci.acts.filter((a) => a.id !== el.dataset.id); Object.keys(p.raci.cells).forEach((k) => { if (k.indexOf(el.dataset.id + '|') === 0) delete p.raci.cells[k]; }); render(); };

/* ── Authority ────────────────────────────────────────────────────── */
function tabAuthority(p) {
  const tasks = workSteps(p);
  if (!tasks.length) return '<div class="box"><div class="empty"><b>Map the steps first</b>Each task gets its own rules here.</div></div>';
  const open = p.auth.rules.filter((r) => !ruleDone(r)).length + tasks.filter((s) => !rulesFor(p, s.id).length && p.auth.skip.indexOf(s.id) < 0).length;
  return '<p class="note" style="margin-bottom:10px;font-size:13px">Each task carries as many rules as it needs. A rule turns on an amount of money or the time that has passed, and says what happens then: the task needs approval, or it escalates.</p>' +
    (open ? '<div class="banner attn">' + plural(open, 'task or rule', 'tasks or rules') + ' still need finishing — give each one a figure and somebody to carry it, or mark the task as needing no approval.</div>' : '<div class="banner good">Every task has its rules, or is marked as needing no approval.</div>') +
    '<div class="tw"><table class="t"><thead><tr><th>Task</th><th>Rules</th><th class="r"></th></tr></thead><tbody>' + tasks.map((s) => {
      const rs = rulesFor(p, s.id), skipped = p.auth.skip.indexOf(s.id) >= 0;
      return '<tr><td style="min-width:200px' + (stepGaps(p, s).some((g) => g === 'no approver' || g === 'an unfinished rule') ? ';box-shadow:inset 3px 0 0 var(--attn)' : '') + '"><b>' + esc(s.label) + '</b><span class="psub">' + (s.type === 'DECISION' ? 'Decision · ' : '') + 'step ' + stepNo(p, s.id) + ' · ' + esc(roleName(s.role)) + '</span></td>' +
        '<td>' + (skipped ? '<span class="q">Skipped — no authority rules apply.</span>' : rs.length ? rs.map((r) => '<div style="display:flex;gap:8px;align-items:center;padding:2px 0"><span class="chip ' + (r.then === 'approval' ? 'navy' : 'attn') + '">' + (r.dir === 'none' ? 'None' : r.then === 'approval' ? 'Approval' : 'Escalates') + '</span><span' + (ruleDone(r) ? '' : ' style="color:var(--attn-tx);font-weight:600"') + '>' + esc(ruleSentence(r)) + '</span><button class="btn sm ghost" type="button" data-act="ruleEdit" data-id="' + r.id + '">Edit</button><button class="x" type="button" data-act="ruleDel" data-id="' + r.id + '" aria-label="Delete rule">×</button></div>').join('') : '<span class="q">No rules yet.</span>') + '</td>' +
        '<td class="r" style="white-space:nowrap">' + (skipped ? '<button class="btn sm" type="button" data-act="authSkip" data-id="' + s.id + '">Unskip</button>' : '<button class="btn sm" type="button" data-act="ruleNew" data-step="' + s.id + '">+ ' + (rs.length ? 'Add another' : 'Add a rule') + '</button>' + (rs.length ? '' : ' <button class="btn sm ghost" type="button" data-act="authSkip" data-id="' + s.id + '">No approval needed</button>')) + '</td></tr>';
    }).join('') + '</tbody></table></div><p class="note" style="margin-top:8px">The first time rule shows on the map as the step\'s SLA; the first money rule becomes a decision\'s gate line.</p>';
}
function ruleDialog(r, isNew) {
  const who = r.who ? r.who.type + ':' + r.who.id : '';
  dialog({ title: isNew ? 'Add a rule' : 'Edit rule', sub: esc(stepById(CUR, r.step).label), body: '<div class="frm two">' + fld('Turns on', sel('r-on', [['money', 'Money'], ['time', 'Time']], r.on)) + fld('Value', inp('r-val', r.value, { type: 'number', min: 0 }), { hint: 'Dollars, or days' }) +
    fld('Direction', sel('r-dir', Object.keys(DIR).map((k) => [k, DIR[k]]), r.dir)) + fld('Then', sel('r-then', [['approval', 'Needs approval'], ['escalate', 'Escalates']], r.then)) +
    fld('Who carries it', '<select id="r-who"><option value="">— nobody yet —</option><optgroup label="Roles">' + liveRoles().map((x) => '<option value="role:' + x.id + '"' + (who === 'role:' + x.id ? ' selected' : '') + '>' + esc(x.name) + '</option>').join('') + '</optgroup><optgroup label="People">' + livePeople().map((x) => '<option value="person:' + x.id + '"' + (who === 'person:' + x.id ? ' selected' : '') + '>' + esc(x.name) + '</option>').join('') + '</optgroup></select>', { full: true }) + '</div>',
    foot: '<button class="btn" type="button" data-act="close">Cancel</button><button class="btn gold" type="button" data-act="ruleSave" data-id="' + (isNew ? '' : r.id) + '" data-step="' + r.step + '">Done</button>' });
}
ACT.ruleNew = (el) => ruleDialog({ step: el.dataset.step, on: 'money', value: '', dir: 'gt', then: 'approval', who: null }, true);
ACT.ruleEdit = (el) => ruleDialog(CUR.auth.rules.find((r) => r.id === el.dataset.id), false);
ACT.ruleSave = (el) => {
  const p = CUR, w = val('r-who'), d = { on: val('r-on'), value: val('r-val') === '' ? '' : Number(val('r-val')), dir: val('r-dir'), then: val('r-then'), who: w ? { type: w.split(':')[0], id: w.split(':')[1] } : null };
  if (el.dataset.id) Object.assign(p.auth.rules.find((r) => r.id === el.dataset.id), d); else p.auth.rules.push(Object.assign({ id: uid('ru'), step: el.dataset.step }, d));
  p.auth.skip = p.auth.skip.filter((x) => x !== el.dataset.step);
  UI.layer = null; toast(ruleDone(d) ? 'Rule saved.' : 'Saved, but it still needs a figure and somebody to carry it.'); render();
};
ACT.ruleDel = (el) => { CUR.auth.rules = CUR.auth.rules.filter((r) => r.id !== el.dataset.id); render(); };
ACT.authSkip = (el) => { const p = CUR, i = p.auth.skip.indexOf(el.dataset.id); if (i >= 0) p.auth.skip.splice(i, 1); else p.auth.skip.push(el.dataset.id); render(); };

/* ── Risks & controls ─────────────────────────────────────────────── */
function tabRisks(p) {
  const covered = new Set(p.controls.filter((c) => c.control && c.step).map((c) => c.step)), noCtl = workSteps(p).filter((s) => !covered.has(s.id));
  return '<div class="cells c3"><div class="cell"><div class="k">Risks recorded</div><div class="v">' + p.controls.length + '</div></div><div class="cell' + (p.controls.some((c) => !c.control) ? ' bad' : '') + '"><div class="k">With no control</div><div class="v">' + p.controls.filter((c) => !c.control).length + '</div></div><div class="cell' + (noCtl.length ? ' attn' : '') + '"><div class="k">Steps with no control</div><div class="v">' + noCtl.length + '</div><div class="w">' + (noCtl.length ? 'Steps ' + noCtl.map((s) => stepNo(p, s.id)).join(', ') : 'Every step is covered') + '</div></div></div>' +
    '<div class="sect">Risks and their controls<span class="r"><button class="btn sm gold" type="button" data-act="riskAdd">+ Add a risk</button></span></div>' +
    '<div class="tw"><table class="t"><thead><tr><th>Step</th><th>Risk</th><th>Level</th><th>Control</th><th>Type</th><th>Last test</th><th></th></tr></thead><tbody>' +
    (p.controls.length ? p.controls.map((c) => '<tr><td>' + (c.step ? stepNo(p, c.step) + ' · ' + esc(stepById(p, c.step).label) : 'Whole process') + '</td><td>' + esc(c.risk) + '</td><td><span class="pill ' + ({ High: 'bad', Medium: 'attn', Low: '' }[c.level]) + '">' + c.level + '</span></td>' +
      '<td>' + (c.control ? esc(c.control) + '<span class="psub">' + esc([c.owner, c.freq, c.evidence && 'evidence: ' + c.evidence].filter(Boolean).join(' · ')) + '</span>' : '<b style="color:var(--bad-tx)">No control</b> <button class="lnk" type="button" data-act="riskEdit" data-id="' + c.id + '">Add one</button>') + '</td><td>' + (c.type || '<span class="q">—</span>') + '</td>' +
      '<td>' + sel('t-' + c.id, [['not_tested', 'Not tested'], ['pass', 'Pass'], ['fail', 'Fail']], c.test, { chg: 'riskTest', data: 'data-id="' + c.id + '"' }) + (c.testedAt ? '<span class="psub">' + dt(c.testedAt) + '</span>' : '') + '</td>' +
      '<td class="r" style="white-space:nowrap"><button class="btn sm ghost" type="button" data-act="riskEdit" data-id="' + c.id + '">Edit</button><button class="x" type="button" data-act="riskDel" data-id="' + c.id + '" aria-label="Remove">×</button></td></tr>').join('')
      : '<tr><td colspan="7"><div class="empty"><b>No risks recorded yet</b>Add what could go wrong at each step and the control that stops it. Check with AI can suggest them.</div></td></tr>') + '</tbody></table></div>';
}
function riskDialog(c, isNew) {
  dialog({ title: isNew ? 'Add a risk and its control' : 'Edit risk and control', wide: true, body: '<div class="frm two">' + fld('Risk', inp('k-risk', c.risk, { max: 300 }), { req: true, full: true }) + fld('Step', sel('k-step', [['', 'Whole process']].concat(workSteps(CUR).map((s) => [s.id, stepNo(CUR, s.id) + ' · ' + s.label])), c.step || '')) + fld('Risk level', sel('k-level', ['Low', 'Medium', 'High'], c.level)) +
    fld('Control', inp('k-control', c.control, { max: 300 }), { full: true }) + fld('Control type', sel('k-type', [['', 'Not set'], 'Preventive', 'Detective', 'Corrective'], c.type || '')) + fld('Last test', sel('k-test', [['not_tested', 'Not tested'], ['pass', 'Pass'], ['fail', 'Fail']], c.test)) +
    fld('Frequency', inp('k-freq', c.freq, { max: 60 })) + fld('Owner', inp('k-owner', c.owner, { max: 80 })) + fld('Evidence', inp('k-ev', c.evidence, { max: 200 }), { full: true }) + '</div>',
    foot: '<button class="btn" type="button" data-act="close">Cancel</button><button class="btn gold" type="button" data-act="riskSave" data-id="' + (isNew ? '' : c.id) + '">' + (isNew ? 'Add risk and control' : 'Save') + '</button>' });
}
ACT.riskAdd = () => riskDialog({ risk: '', step: UI.sel.step || '', level: 'Medium', control: '', type: '', test: 'not_tested', freq: '', owner: '', evidence: '' }, true);
ACT.riskEdit = (el) => riskDialog(CUR.controls.find((c) => c.id === el.dataset.id), false);
ACT.riskSave = (el) => {
  if (!val('k-risk')) { toast('Could not save. Check that a risk is written and try again.'); return; }
  const d = { risk: val('k-risk'), step: val('k-step') || null, level: val('k-level'), control: val('k-control'), type: val('k-type'), test: val('k-test'), freq: val('k-freq'), owner: val('k-owner'), evidence: val('k-ev') };
  if (d.test !== 'not_tested') d.testedAt = todayIso();
  if (el.dataset.id) Object.assign(CUR.controls.find((c) => c.id === el.dataset.id), d); else CUR.controls.push(Object.assign({ id: uid('c') }, d));
  UI.layer = null; toast('Saved.'); render();
};
ACT.riskDel = (el) => { CUR.controls = CUR.controls.filter((c) => c.id !== el.dataset.id); render(); };
CHG.riskTest = (el) => { const c = CUR.controls.find((x) => x.id === el.dataset.id); c.test = el.value; c.testedAt = el.value === 'not_tested' ? null : todayIso(); render(); };

/* ── Quality ──────────────────────────────────────────────────────── */
function tabQuality(p) {
  return '<div class="cells c3"><div class="cell' + (p.ncs.some((n) => n.status !== 'Closed') ? ' attn' : '') + '"><div class="k">Open non-conformances</div><div class="v">' + p.ncs.filter((n) => n.status !== 'Closed').length + '</div></div><div class="cell"><div class="k">Closed</div><div class="v">' + p.ncs.filter((n) => n.status === 'Closed').length + '</div></div><div class="cell' + (p.controls.some((c) => c.test === 'fail') ? ' bad' : '') + '"><div class="k">Failed control tests</div><div class="v">' + p.controls.filter((c) => c.test === 'fail').length + '</div></div></div>' +
    '<div class="sect">Non-conformances<span class="r"><button class="btn sm gold" type="button" data-act="ncAdd">+ Record one</button></span></div>' +
    '<div class="tw"><table class="t"><thead><tr><th>Ref</th><th>What went wrong</th><th>Corrective action</th><th>Owner</th><th>Raised</th><th>Status</th></tr></thead><tbody>' +
    (p.ncs.length ? p.ncs.map((n) => '<tr><td><span class="code">' + n.ref + '</span></td><td><b>' + esc(n.title) + '</b>' + (n.detail ? '<span class="psub">' + esc(n.detail) + '</span>' : '') + '</td><td>' + (esc(n.action) || '<span class="q">—</span>') + '</td><td>' + (esc(n.owner) || '<span class="q">—</span>') + '</td><td class="num">' + dt(n.raised) + '</td><td>' + sel('nc-' + n.id, ['Open', 'In progress', 'Closed'], n.status, { chg: 'ncStatus', data: 'data-id="' + n.id + '"' }) + '</td></tr>').join('')
      : '<tr><td colspan="6"><div class="empty">No non-conformances recorded yet for this process.</div></td></tr>') + '</tbody></table></div>';
}
ACT.ncAdd = () => dialog({ title: 'Record a non-conformance', body: '<div class="frm">' + fld('What went wrong', inp('n-title', '', { max: 200 }), { req: true }) + fld('Detail', area('n-detail', '', { rows: 3 })) + '<div class="frm two">' + fld('Corrective action', inp('n-action', '', { max: 500 })) + fld('Action owner', inp('n-owner', '', { max: 80 })) + '</div></div>', foot: '<button class="btn" type="button" data-act="close">Cancel</button><button class="btn gold" type="button" data-act="ncSave">Record non-conformance</button>' });
ACT.ncSave = () => { if (!val('n-title')) { toast('Could not save. Check that a title is written and try again.'); return; } const p = CUR; p.ncs.unshift({ id: uid('nc'), ref: 'NC-' + String(8 + p.ncs.length).padStart(2, '0'), title: val('n-title'), detail: val('n-detail'), action: val('n-action'), owner: val('n-owner'), raised: todayIso(), status: 'Open' }); UI.layer = null; toast('Recorded.'); render(); };
CHG.ncStatus = (el) => { CUR.ncs.find((n) => n.id === el.dataset.id).status = el.value; render(); };

/* ── Lifecycle ────────────────────────────────────────────────────── */
const LC = ['DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'RETIRED'];
function approverOptions(cur) {
  return [['', '— choose from the People register —']].concat(livePeople().map((x) => { const why = !x.reg ? 'not on the register' : !x.email ? 'no email on the register' : !x.roles.length ? 'no role' : ''; return [x.id, x.name + ' — ' + (x.roles.map(roleName).join(', ') || 'no role') + (why ? ' (' + why + ')' : ''), !!why]; }));
}
function tabLifecycle(p) {
  const i = LC.indexOf(p.status), v = latestVersion(p), f = inForce(p);
  const track = '<div class="track">' + LC.map((s, j) => (j ? '<i>›</i>' : '') + '<span class="' + (j < i ? 'done' : j === i ? 'now' : '') + '">' + STATUS[s] + '</span>').join('') + '</div>';
  let panel = '';
  if (p.status === 'DRAFT') {
    panel = (p.returnReason ? '<div class="banner attn"><b>Sent back:</b> ' + esc(p.returnReason) + '</div>' : '') + '<p style="margin-bottom:10px">This is a draft. Pick who approves it and say what changed, then send it for review.</p>' +
      '<div class="frm two">' + fld('Approver', sel('lc-appr', approverOptions(), p.approver || ''), { req: true, hint: 'They approve from their own reading page.' }) +
      fld('Reviewers', '<div class="checks" style="max-height:120px;overflow:auto;border:1px solid var(--line);border-radius:6px;padding:6px 8px">' + livePeople().filter((x) => x.reg).map((x) => '<label><input type="checkbox" name="lc-rev" value="' + x.id + '"' + (p.reviewers.indexOf(x.id) >= 0 ? ' checked' : '') + '> ' + esc(x.name) + '</label>').join('') + '</div>', { hint: 'Optional' }) +
      fld('What changed', area('lc-note', p.changeNote, { rows: 2 }), { req: true, full: true }) + '</div><div class="acts" style="margin-top:10px"><button class="btn gold" type="button" data-act="lcSend">Send for review</button></div>';
  } else {
    const sum = '<dl class="dl" style="margin-bottom:10px"><dt>Approver</dt><dd>' + esc(personName(p.approver)) + '</dd><dt>Reviewers</dt><dd>' + (p.reviewers.length ? p.reviewers.map(personName).map(esc).join(', ') : 'None named') + '</dd><dt>Sent by</dt><dd>' + esc(p.sentBy || '—') + (p.sentAt ? ' · ' + dt(p.sentAt) : '') + '</dd><dt>What changed</dt><dd>' + esc(p.changeNote || '—') + '</dd></dl>';
    const back = '<details style="margin-top:10px"><summary class="lnk" style="display:inline">Send back to draft</summary><div class="filters" style="margin-top:8px"><input class="inp" id="lc-why" placeholder="Why" style="max-width:420px"><button class="btn sm" type="button" data-act="lcBack">Send back</button></div><p class="note">Only the approver or the person who sent it can send it back.</p></details>';
    if (p.status === 'IN_REVIEW') panel = sum + '<p>Waiting for <b>' + esc(personName(p.approver)) + '</b> to approve. They approve from their own reading page, so send them the link.</p><div class="copyrow" style="margin-top:8px"><code>/raya/processes/read/' + p.code.toLowerCase() + '</code><button class="btn sm" type="button" data-act="copy" data-text="/raya/processes/read/' + p.code.toLowerCase() + '">Copy link</button><button class="btn sm" type="button" data-act="seeAsApprover" data-code="' + p.code + '">See what ' + esc(personName(p.approver).split(' ')[0]) + ' sees</button></div>' + back;
    if (p.status === 'APPROVED') panel = sum + '<p>Approved. Publishing makes it the official version and starts the review clock.</p><div class="acts" style="margin-top:10px"><button class="btn gold" type="button" data-act="lcPublish">Publish v' + v.n + ' to staff</button></div>' + back;
    if (p.status === 'PUBLISHED') panel = sum + '<div class="filters"><span>Review every</span><input class="inp" id="lc-months" type="number" min="1" max="60" value="' + p.reviewMonths + '" style="width:76px" data-chg="lcMonths"><span>months · next review <b>' + dt(p.nextReview) + '</b>' + (overdue(p) ? ' <span class="pill bad">' + plural(-daysFrom(p.nextReview), 'day') + ' overdue</span>' : ' <span class="q">in ' + plural(daysFrom(p.nextReview), 'day') + '</span>') + '</span><button class="btn sm" type="button" data-act="lcRetire" style="margin-left:auto">Retire…</button></div>';
    if (p.status === 'RETIRED') panel = '<p>Retired. It stays on record but is no longer in force.</p>';
  }
  const exp = expectedReaders(p), left = exp.filter((x) => p.acks.indexOf(x.id) < 0);
  return '<div class="stack"><div class="blk"><div class="blk-h"><span class="lbl">' + (p.status === 'DRAFT' ? 'Send for review' : 'Where v' + (p.status === 'IN_REVIEW' ? (v ? v.n + 1 : 1) : v ? v.n : 1) + ' stands') + '</span></div>' + track + '<div style="margin-top:12px">' + panel + '</div></div>' +
    '<div class="two"><div class="blk"><div class="blk-h"><span class="lbl">Document control</span><button class="pen" type="button" data-act="dcEdit">Edit</button></div><dl class="dl">' + [['SOP version', p.doc.version], ['Effective from', p.doc.effective && dt(p.doc.effective)], ['Owner', p.doc.owner], ['Approved by', p.doc.approvedBy]].map(([k, x]) => '<dt>' + k + '</dt><dd' + (x ? '' : ' class="miss"') + '>' + (x ? esc(x) : 'Missing') + '</dd>').join('') + '</dl><p class="note" style="margin-top:8px">Edited here. Publishing fills in the version, approver and date by itself.</p></div>' +
    '<div class="blk"><div class="blk-h"><span class="lbl">Read and confirmed' + (f ? ' · v' + f.n : '') + '</span>' + (f && left.length ? '<button class="btn sm r" type="button" data-act="toast" data-msg="A reminder goes to the ' + left.length + ' who have not confirmed.">Remind the ' + left.length + '</button>' : '') + '</div>' +
    (!f ? '<p class="none">Nothing is published yet, so nobody is asked to read it.</p>' : !exp.length ? '<p class="q">No step is given to a role anybody on the People register holds, so nobody is expected to acknowledge yet.</p>' : '<p><b class="num">' + (exp.length - left.length) + '</b> of ' + exp.length + ' have confirmed they have read the version in force.</p><div class="bar"><i class="good" style="width:' + Math.round((exp.length - left.length) / exp.length * 100) + '%"></i></div>' + (left.length ? '<p class="note">Still to read: ' + left.map((x) => esc(x.name)).join(', ') + '.</p>' : '<p class="note">Everyone has confirmed.</p>')) +
    (f ? '<div class="blk-h" style="margin:12px 0 6px"><span class="lbl">Link for staff</span></div><div class="copyrow"><code>/raya/processes/read/' + p.code.toLowerCase() + '</code><button class="btn sm" type="button" data-act="copy" data-text="/raya/processes/read/' + p.code.toLowerCase() + '">Copy link</button></div><p class="note" style="margin-top:4px">They sign in as usual and need to be on the People register. They see only the published version.</p>' : '') + '</div></div>' +
    '<div><div class="sect">Approved versions</div><div class="tw"><table class="t"><thead><tr><th>Version</th><th>Approved</th><th>What changed</th><th>Published</th></tr></thead><tbody>' +
    (p.versions.length ? p.versions.slice().sort((a, b) => b.n - a.n).map((x) => '<tr><td><span class="code">v' + x.n + '</span>' + (f && x.n === f.n ? ' <span class="pill navy">In force</span>' : '') + '</td><td>' + dt(x.approvedAt) + ' by ' + esc(x.by) + (x.role ? ' (' + esc(x.role) + ')' : '') + '</td><td>' + esc(x.note) + (x.sentBy ? '<span class="psub">sent by ' + esc(x.sentBy) + '</span>' : '') + '</td><td>' + (x.published ? dt(x.published) : '<span class="q">Not published</span>') + '</td></tr>').join('') : '<tr><td colspan="4"><div class="empty">Nothing has been approved yet.</div></td></tr>') + '</tbody></table></div></div>' +
    '<div><div class="sect">Revision history</div><div class="tw"><table class="t"><thead><tr><th>Version</th><th>Date</th><th>By</th><th>What changed</th></tr></thead><tbody>' + (p.revisions.length ? p.revisions.map((r) => '<tr><td class="code">' + esc(r.v) + '</td><td class="num">' + dt(r.date) + '</td><td>' + esc(r.by) + '</td><td>' + esc(r.change) + '</td></tr>').join('') : '<tr><td colspan="4"><div class="empty">No revisions recorded.</div></td></tr>') + '</tbody></table></div></div></div>';
}
ACT.lcSendOpen = () => go(openP(CUR.code, 'lifecycle'), { keepScroll: true });
ACT.lcSend = () => {
  const p = CUR, a = val('lc-appr'), note = val('lc-note');
  if (!a || !note) { toast('Pick an approver and say what changed first.'); return; }
  Object.assign(p, { status: 'IN_REVIEW', approver: a, reviewers: checkedVals('lc-rev').filter((x) => x !== a), changeNote: note, sentBy: 'Strategy Office', sentAt: todayIso(), returnReason: '' });
  S.feed.unshift([todayIso(), '<b>' + esc(p.name) + '</b> sent to ' + esc(personName(a)) + ' for approval']); toast('Sent to ' + personName(a) + '.'); render();
};
ACT.lcBack = () => { const p = CUR, why = val('lc-why'); if (!why) { toast('Say why it is sent back.'); return; } p.status = 'DRAFT'; p.returnReason = why; toast('Sent back to draft.'); render(); };
ACT.lcPublish = () => {
  const p = CUR, v = latestVersion(p); if (p.status !== 'APPROVED') { go(openP(p.code, 'lifecycle')); return; }
  v.published = todayIso(); p.status = 'PUBLISHED'; p.nextReview = addMonths(todayIso(), p.reviewMonths); p.acks = [];
  p.doc.version = v.n + '.0'; p.doc.approvedBy = v.by; p.doc.effective = todayIso(); p.revisions.unshift({ v: v.n + '.0', date: todayIso(), by: v.by, change: v.note.replace(/\.$/, '') });
  S.feed.unshift([todayIso(), '<b>' + esc(p.name) + '</b> v' + v.n + ' published to staff']); toast('Published. Staff are asked to read v' + v.n + '; the review clock has started.'); render();
};
CHG.lcMonths = (el) => { const p = CUR, m = Math.max(1, Math.min(60, Number(el.value) || 12)); p.reviewMonths = m; p.nextReview = addMonths(inForce(p).published, m); render(); };
ACT.lcRetire = () => dialog({ title: 'Retire this process?', body: '<p>It stays on record but is no longer in force. Staff stop seeing it on their reading page.</p>', foot: '<button class="btn" type="button" data-act="close">Keep it</button><button class="btn danger solid" type="button" data-act="lcDoRetire">Retire</button>' });
ACT.lcDoRetire = () => { CUR.status = 'RETIRED'; UI.layer = null; toast('Retired.'); render(); };
ACT.seeAsApprover = (el) => { UI.look = 'approver'; go('approve~' + el.dataset.code); };
ACT.dcEdit = () => {
  const p = CUR;
  dialog({ title: 'Document control', sub: 'Printed at the top of the SOP. An empty field prints as a red Missing.', body: '<div class="frm two">' + fld('SOP version', inp('dc-v', p.doc.version, { ph: 'e.g. 3.0' })) + fld('Effective from', inp('dc-e', p.doc.effective, { type: 'date' })) + fld('Owner', inp('dc-o', p.doc.owner)) + fld('Approved by', inp('dc-a', p.doc.approvedBy)) + '</div>',
    foot: '<button class="btn" type="button" data-act="close">Cancel</button><button class="btn gold" type="button" data-act="dcSave">Save</button>' });
};
ACT.dcSave = () => { Object.assign(CUR.doc, { version: val('dc-v'), effective: val('dc-e'), owner: val('dc-o'), approvedBy: val('dc-a') }); UI.layer = null; toast('Saved.' + (CUR.doc.version ? ' The SOP mark is done.' : '')); render(); };
ACT.copy = (el) => { const t = el.dataset.text; const ok = () => toast('Copied.'); try { navigator.clipboard.writeText(t).then(ok, () => toast('Could not copy. Select the address and copy it.')); } catch (e) { toast('Could not copy. Select the address and copy it.'); } };

/* ── Check with AI ────────────────────────────────────────────────── */
function findingsFor(p) {
  if (p.findings) return p.findings;
  const f = [];
  p.controls.filter((c) => !c.control).forEach((c) => f.push({ id: uid('fi'), cat: 'GAP', area: 'Risks & controls', sev: 'high', title: (c.step ? 'Step ' + stepNo(p, c.step) + ' ' + stepById(p, c.step).label : 'The process') + ' has a risk with no control', desc: '“' + c.risk + '” is recorded with nothing that stops it.', rec: 'Add a control and say who runs it and how often.', kind: 'control', ref: c.id, status: 'New' }));
  workSteps(p).forEach((s) => stepGaps(p, s).forEach((g) => { if (f.length < 5) f.push({ id: uid('fi'), cat: 'GAP', area: g.indexOf('accountable') >= 0 || g === 'no responsible' ? 'RACI Matrix' : g === 'no predecessor' ? 'Process Map' : 'Authority Matrix', sev: 'medium', title: 'Step ' + stepNo(p, s.id) + ' ' + s.label + ': ' + g, desc: GAP_SENTENCE[g], rec: 'Fix it on the ' + (g.indexOf('accountable') >= 0 || g === 'no responsible' ? 'RACI' : g === 'no predecessor' ? 'Map' : 'Authority') + ' tab.', kind: 'tab', tab: g.indexOf('accountable') >= 0 || g === 'no responsible' ? 'raci' : g === 'no predecessor' ? 'map' : 'authority', status: 'New' }); }));
  if (p.steps.length >= 3) f.push({ id: uid('fi'), cat: 'RISK', area: 'Process Map', sev: 'low', title: 'No reminder before an overdue item escalates', desc: 'Most processes like this one send a reminder before handing an overdue item on.', rec: 'Send a reminder', kind: 'step', status: 'New' });
  p.findings = f; return f;
}
function aiBody(p, asPage) {
  const f = findingsFor(p), open = f.filter((x) => x.status !== 'Integrated' && x.status !== 'Removed');
  return (asPage ? '<p class="note" style="margin-bottom:10px;font-size:13px">Reviews the map, RACI and authority against how this kind of process usually runs, and lists gaps and risks you can act on.</p>' : '') +
    '<div class="filters"><span class="chip">Reviewed against ' + esc(S.ws.industry) + ' norms</span><span class="note">' + open.length + ' open · ' + f.filter((x) => x.status === 'Integrated').length + ' integrated</span><button class="btn sm" type="button" data-act="aiRun" style="margin-left:auto">Run the check again</button></div>' +
    (f.length ? f.filter((x) => x.status !== 'Removed').map((x) => '<div class="aif' + (x.status === 'Integrated' ? ' done' : '') + '"><div class="filters" style="margin:0;gap:4px"><span class="chip ' + ({ high: 'bad', medium: 'attn', low: '' }[x.sev]) + '">' + x.sev + ' severity</span><span class="chip">' + x.cat + '</span><span class="chip">' + esc(x.area) + '</span>' + (x.status !== 'New' ? '<span class="chip good">' + x.status + '</span>' : '') + '</div><b>' + esc(x.title) + '</b><span>' + esc(x.desc) + '</span><span class="q">→ ' + esc(x.rec) + '</span>' +
      (x.status === 'New' ? '<div class="acts">' + (x.kind === 'control' ? '<button class="btn sm gold" type="button" data-act="aiControl" data-id="' + x.id + '">Add a control</button>' : x.kind === 'tab' ? '<button class="btn sm gold" type="button" data-act="aiGoTab" data-tab="' + x.tab + '">Open ' + x.tab.toUpperCase().replace('AUTHORITY', 'Authority').replace('MAP', 'Map') + '</button>' : '<button class="btn sm gold" type="button" data-act="aiStep" data-id="' + x.id + '">Add as a step</button>') + '<button class="btn sm" type="button" data-act="aiRemove" data-id="' + x.id + '">Remove</button></div>' : x.status === 'Proposed' ? '<span class="note">Proposed · waiting on the map</span>' : '') + '</div>').join('')
      : '<div class="empty">No gaps or risks found.</div>');
}
ACT.aiOpen = () => sheet({ title: 'Check with AI', sub: CUR.code + ' ' + esc(CUR.name) + ' · opens over whichever tab you are on', body: () => aiBody(CUR, false), foot: '<button class="btn" type="button" data-act="close">Close</button>' });
ACT.aiRun = () => { CUR.findings = null; findingsFor(CUR); toast('Checked again. Removed findings do not come back.'); render(); };
ACT.aiRemove = (el) => { CUR.findings.find((x) => x.id === el.dataset.id).status = 'Removed'; render(); };
ACT.aiGoTab = (el) => { UI.layer = null; go(openP(CUR.code, el.dataset.tab)); };
ACT.aiControl = (el) => { const x = CUR.findings.find((y) => y.id === el.dataset.id); x.status = 'Integrated'; UI.layer = null; riskDialog(CUR.controls.find((c) => c.id === x.ref), false); };
ACT.aiStep = (el) => {
  const x = CUR.findings.find((y) => y.id === el.dataset.id), p = CUR;
  dialog({ title: 'Add as a step', sub: 'It waits on the map as a proposal until you confirm it.', body: '<div class="frm">' + fld('Step text', inp('ai-label', x.rec)) + fld('Place it after', sel('ai-after', [['', 'At the end']].concat(p.steps.map((s) => [s.id, s.label])), (workSteps(p)[workSteps(p).length - 2] || {}).id || '')) + fld('Notes', inp('ai-notes', ''), { hint: 'Optional' }) + '</div>',
    foot: '<button class="btn" type="button" data-act="close">Cancel</button><button class="btn gold" type="button" data-act="aiStepGo" data-id="' + x.id + '">Add to the process (proposed)</button>' });
};
ACT.aiStepGo = (el) => { const x = CUR.findings.find((y) => y.id === el.dataset.id); CUR.proposals.push({ id: uid('pr'), label: val('ai-label') || x.rec, after: val('ai-after') || null, notes: val('ai-notes'), finding: x }); x.status = 'Proposed'; UI.layer = null; toast('Proposed on the map. Confirm it there.'); go(openP(CUR.code, 'map')); };

/* ── the SOP document ─────────────────────────────────────────────── */
const MISS = '<span class="miss">Missing</span>';
function sopDoc(p) {
  const roles = [...new Set(p.steps.map((s) => s.role).filter(Boolean))];
  const missing = [p.doc.version, p.doc.effective, p.doc.owner, p.doc.approvedBy].filter((x) => !x).length + (p.purpose ? 0 : 1) + workSteps(p).reduce((n, s) => n + (!s.role) + (!s.actions.length) + (!s.inputs) + (!s.output), 0);
  return '<div class="paper"><div class="crumb">' + esc(S.ws.name.toUpperCase()) + ' · STANDARD OPERATING PROCEDURE</div><h1>' + esc(p.name) + ' <span class="q" style="font-weight:600">' + p.code + '</span></h1>' + (missing ? '<p class="miss" style="margin-top:4px">' + plural(missing, 'item') + ' still Missing</p>' : '') +
    '<h2>Document control</h2><div class="meta">' + [['Version', p.doc.version], ['Effective date', p.doc.effective && dt(p.doc.effective)], ['Owner', p.doc.owner], ['Approved by', p.doc.approvedBy]].map(([k, x]) => '<div><em>' + k + '</em>' + (x ? esc(x) : MISS) + '</div>').join('') + '</div>' +
    '<h2>Purpose and scope</h2><p>' + (p.purpose ? esc(p.purpose) : MISS) + '</p>' + (p.inScope.length || p.outScope.length ? '<div class="two" style="margin-top:8px"><div><h3>In scope</h3><ul>' + p.inScope.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div><div><h3>Out of scope</h3><ul>' + p.outScope.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div></div>' : '') +
    '<h2>Who is involved</h2><p>' + (roles.length ? roles.map(roleName).map(esc).join(' · ') : MISS) + '</p>' +
    '<h2>Procedure</h2>' + (workSteps(p).length ? '<div class="tw"><table class="t"><thead><tr><th>#</th><th>Step and who</th><th>How</th><th>In / out</th><th>Approval, hand-over</th></tr></thead><tbody>' + workSteps(p).map((s) => '<tr><td class="num">' + stepNo(p, s.id) + '</td><td><b>' + esc(s.label) + '</b><span class="psub">' + (s.role ? esc(roleName(s.role)) : MISS) + '</span></td><td>' + (s.actions.length ? '<ol style="padding-left:16px">' + s.actions.map((a) => '<li>' + esc(a) + '</li>').join('') + '</ol>' : MISS) + (s.errors ? '<span class="psub">Common errors: ' + esc(s.errors) + '</span>' : '') + '</td><td>In: ' + (s.inputs ? esc(s.inputs) : MISS) + '<br>Out: ' + (s.output ? esc(s.output) : MISS) + '</td><td>' + (rulesFor(p, s.id).map((r) => esc(ruleSentence(r))).join('<br>') || '—') + (s.links.length ? '<br>→ ' + s.links.join(', ') : '') + '</td></tr>').join('') + '</tbody></table></div>' : '<p>' + MISS + '</p>') +
    '<h2>Controls and KPIs</h2>' + (p.controls.length || p.kpis.length ? '<ul>' + p.controls.filter((c) => c.control).map((c) => '<li>' + esc(c.control) + '</li>').join('') + p.kpis.map((k) => '<li>' + esc(k.metric) + ' — target ' + esc(k.target) + ', ' + esc(k.freq.toLowerCase()) + '</li>').join('') + '</ul>' : '<p>' + MISS + '</p>') +
    '<h2>Revision history</h2>' + (p.revisions.length ? '<div class="tw"><table class="t"><thead><tr><th>Version</th><th>Date</th><th>By</th><th>What changed</th></tr></thead><tbody>' + p.revisions.map((r) => '<tr><td>' + esc(r.v) + '</td><td>' + dt(r.date) + '</td><td>' + esc(r.by) + '</td><td>' + esc(r.change) + '</td></tr>').join('') + '</tbody></table></div>' : '<p class="q">No revisions recorded.</p>') +
    '<p class="note" style="margin-top:22px">Forefront Consulting</p></div>';
}
R.sop = (args) => {
  const list = args[0] === 'pack' ? (UI.f.sopCodes || []).map(byCode).filter(Boolean) : [byCode(args[0])].filter(Boolean);
  const back = args[0] === 'pack' ? goBtn('export', '← Back to Export') : goBtn(openP(args[0], 'lifecycle'), '← Back to ' + args[0]);
  return '<div class="toolbar">' + back + '<span class="note">' + plural(list.length, 'SOP') + ' · ' + esc(S.ws.name) + '</span><span class="r"><label class="checks"><label><input type="checkbox" checked> One continuous page</label></label><button class="btn gold" type="button" data-act="toast" data-msg="In the product this opens the browser\'s print dialog, ready to save as PDF.">Print / save as PDF</button></span></div>' +
    list.map(sopDoc).join('<div style="height:18px"></div>');
};
