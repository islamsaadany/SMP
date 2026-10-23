/* ══ LANDSCAPE ══════════════════════════════════════════════════════════
   The whole company's processes at once: milestone rails, process cards with
   their connections, and the value chain board. As option B the first two are
   "Helicopter View" and the board is "Value Chain", two sections. */
function procEdges() {
  const e = [], seen = {};
  procs().forEach((o) => { if (o.branchFrom && byCode(o.branchFrom.code) && !byCode(o.branchFrom.code).deleted) e.push({ kind: 'branch', from: o.branchFrom.code, to: o.code, step: o.branchFrom.step }); });
  procs().forEach((a) => a.steps.forEach((s) => s.links.forEach((c) => { const b = byCode(c); if (!b || b.deleted) return; const k = a.code + '>' + c; if (seen[k]) { seen[k].steps.push(s.id); return; } seen[k] = { kind: 'link', from: a.code, to: c, steps: [s.id] }; e.push(seen[k]); })));
  procs().forEach((b) => b.ext.forEach((x) => { const a = byCode(x.code); if (!a || a.deleted) return; const k = x.code + '>' + b.code; if (seen[k]) { if (seen[k].steps.indexOf(x.stepId) < 0) seen[k].steps.push(x.stepId); return; } seen[k] = { kind: 'link', from: x.code, to: b.code, steps: [x.stepId] }; e.push(seen[k]); }));
  return e;
}
function edgeSentence(ed) {
  const a = byCode(ed.from), b = byCode(ed.to);
  if (ed.kind === 'branch') return esc(b.name) + ' picks up from step ' + stepNo(a, ed.step) + ', ' + esc(stepById(a, ed.step).label) + ', of ' + esc(a.name);
  return esc(a.name) + ' links to ' + esc(b.name) + ' from ' + ed.steps.map((id) => esc((stepById(a, id) || { label: '?' }).label)).join(', ');
}
const visibleProcs = () => procs().filter((p) => !(UI.f.hidden || {})[p.code]);
function pickerMenu() {
  const h = UI.f.hidden || {}, n = procs().length, shown = n - Object.keys(h).filter((k) => h[k]).length;
  const items = '<div style="padding:8px 14px" class="filters"><button class="lnk" type="button" data-act="pickAll" data-v="1">Select all</button><button class="lnk" type="button" data-act="pickAll" data-v="0">Select none</button></div><div class="rule"></div>' +
    mains().map((m) => '<label class="mi"><input type="checkbox" data-chg="pick" data-code="' + m.code + '"' + (h[m.code] ? '' : ' checked') + '> <span class="code">' + m.code + '</span> ' + esc(m.name) + '</label>' + subsOf(m.code).map((s) => '<label class="mi" style="padding-left:34px"><input type="checkbox" data-chg="pick" data-code="' + s.code + '"' + (h[s.code] ? '' : ' checked') + '> <span class="code">' + s.code + '</span> ' + esc(s.name) + '</label>').join('')).join('');
  return menuBtn('picker', 'Processes: ' + (shown === n ? 'All (' + n + ')' : shown + ' of ' + n), '<div style="max-height:340px;overflow:auto">' + items + '</div>', { w: 300 });
}
CHG.pick = (el) => { UI.f.hidden = UI.f.hidden || {}; UI.f.hidden[el.dataset.code] = !el.checked; UI.menu = 'picker'; render(); };
ACT.pickAll = (el) => { UI.f.hidden = {}; if (el.dataset.v === '0') procs().forEach((p) => { UI.f.hidden[p.code] = true; }); UI.menu = 'picker'; render(); };

R.landscape = (args) => {
  const view = ['rails', 'cards', 'chain'].indexOf(args[0]) >= 0 ? args[0] : 'rails';
  const helicopter = view !== 'chain', E = procEdges(), br = E.filter((e) => e.kind === 'branch').length, ln = E.filter((e) => e.kind === 'link').length;
  const title = OPT.landscape ? 'Landscape' : helicopter ? 'Helicopter View' : 'Value Chain';
  const sub = helicopter || OPT.landscape ? 'How ' + esc(S.ws.name) + '\'s processes connect — ' + [plural(procs().length, 'process', 'processes'), br && plural(br, 'branch', 'branches'), ln && plural(ln, 'step link')].filter(Boolean).join(' · ') + '.' : 'How work moves through ' + esc(S.ws.name) + ', phase by phase, across every process.';
  const seg = (OPT.landscape ? [['rails', 'Milestones'], ['cards', 'Cards'], ['chain', 'Value chain']] : helicopter ? [['rails', 'Milestones'], ['cards', 'Cards']] : []).map(([k, l]) => '<button type="button" class="' + (k === view ? 'on' : '') + '" data-go="landscape~' + k + '">' + l + '</button>').join('');
  return phead(title, { sub }) + '<div class="filters">' + (seg ? '<div class="seg">' + seg + '</div>' : '') + (helicopter ? pickerMenu() + '<button class="btn sm" type="button" data-act="toast" data-msg="Downloads the picture as a PNG in the product." style="margin-left:auto">⬇ PNG</button>' : '') + '</div>' +
    (view === 'rails' ? railsView() : view === 'cards' ? cardsView() : chainView()) +
    (helicopter ? connectionsList(E) : '');
};
function railsView() {
  const vis = visibleProcs(); if (!vis.length) return '<div class="box"><div class="empty">No processes chosen — tick at least one to see the picture.</div></div>';
  const order = []; mains().forEach((m) => { if (vis.indexOf(m) >= 0) order.push(m); subsOf(m.code).forEach((s) => { if (vis.indexOf(s) >= 0) order.push(s); }); });
  const marked = procs().reduce((n, p) => n + p.steps.filter((s) => s.milestone).length, 0);
  const isJunction = (p, s) => s.links.length || procs().some((o) => (o.branchFrom && o.branchFrom.code === p.code && o.branchFrom.step === s.id) || o.ext.some((x) => x.code === p.code && x.stepId === s.id)) || p.ext.some((x) => x.step === s.id);
  return '<p class="note" style="margin-bottom:10px">' + (marked ? plural(marked, 'milestone') + ' marked · steps another process depends on are always shown' : 'No milestones marked yet — open a process\'s Steps list and use ★ to put a step on its rail.') + '</p><div class="rails">' + order.map((p) => {
    const beads = p.steps.filter((s) => s.milestone || isJunction(p, s));
    return '<div class="railrow"><div><span class="code">' + p.code + '</span> <a class="pname" href="#" data-go="' + openP(p.code, 'map') + '">' + esc(p.name) + '</a>' + (isDeep(p) ? ' <span class="chip gold">Deep dive</span>' : '') + '<span class="psub">' + plural(p.steps.length, 'step') + (p.branchFrom ? ' · <span style="color:var(--attn-tx)">↰ from ' + p.branchFrom.code + ' · step ' + stepNo(byCode(p.branchFrom.code), p.branchFrom.step) + '</span>' : '') + '</span></div>' +
      '<div class="box"><div class="railline"' + (p.branchFrom ? ' style="--dash:1"' : '') + '>' + (beads.length ? beads.map((s) => {
        const chips = procs().filter((o) => o.branchFrom && o.branchFrom.code === p.code && o.branchFrom.step === s.id).map((o) => '<span class="chip attn">↳ ' + o.code + '</span>').concat(s.links.map((c) => '<span class="chip gold">→ ' + c + '</span>'));
        return '<div class="ms' + (s.type === 'DECISION' ? ' dec' : '') + (!s.milestone ? ' ho' : '') + '" title="' + esc(s.label) + '"><i></i><b style="font-size:12px;display:block;line-height:1.25">' + esc(s.label) + '</b><span class="q">step ' + stepNo(p, s.id) + '</span>' + (chips.length ? '<div style="margin-top:3px">' + chips.join(' ') + '</div>' : '') + '</div>';
      }).join('') : '<p class="note" style="padding:6px 12px;position:relative">' + (p.steps.length ? 'No milestones marked — ★ a step in its Steps list' : 'No steps mapped yet') + '</p>') + '</div></div></div>';
  }).join('') + '</div>';
}
function cardsView() {
  const vis = visibleProcs(); if (!vis.length) return '<div class="box"><div class="empty">No processes chosen — tick at least one to see the picture.</div></div>';
  const E = procEdges().filter((e) => vis.indexOf(byCode(e.from)) >= 0 && vis.indexOf(byCode(e.to)) >= 0), depth = {};
  vis.forEach((p) => { depth[p.code] = 0; });
  for (let i = 0; i < vis.length; i++) E.forEach((e) => { if (depth[e.to] < depth[e.from] + 1 && depth[e.from] < 6) depth[e.to] = depth[e.from] + 1; });
  const cols = Math.max(1, ...Object.values(depth).map((d) => d + 1)), rowsAt = {};
  const nodes = vis.slice().sort((a, b) => a.code.localeCompare(b.code)).map((p) => { const c = depth[p.code], r = rowsAt[c] = (rowsAt[c] || 0) + 1; return '<button type="button" class="lnode' + (isDeep(p) ? ' deep' : '') + '" id="ln-' + p.code + '" style="grid-column:' + (c + 1) + ';grid-row:' + r + (p.branchFrom ? ';border-style:dashed;border-color:var(--attn)' : '') + '" data-go="' + openP(p.code, 'map') + '"><span class="code">' + p.code + '</span> ' + (isDeep(p) ? '<span class="chip gold">Deep dive</span> ' : '') + '<span class="chip">' + plural(p.steps.length, 'step') + '</span><b>' + esc(p.name) + '</b>' + (p.parent ? '<span class="s">under ' + p.parent + '</span>' : '') + (p.branchFrom ? '<span class="s" style="color:var(--attn-tx)"> · ↰ from ' + p.branchFrom.code + '</span>' : '') + '</button>'; }).join('');
  AFTER.push(() => drawArrows($('#lgrid'), $('#edges-land'), E.map((e) => ({ from: 'ln-' + e.from, to: 'ln-' + e.to, dash: e.kind === 'branch', label: e.kind === 'branch' ? '↰ step ' + stepNo(byCode(e.from), e.step) : e.steps.length > 1 ? '🔗 ×' + e.steps.length : '🔗' }))));
  return '<div class="tw" style="padding:0"><div class="lgrid" id="lgrid" style="grid-template-columns:repeat(' + cols + ',minmax(190px,1fr));min-width:' + (cols * 230) + 'px">' + nodes + '<svg class="edges" id="edges-land" aria-hidden="true"></svg></div></div>' +
    '<div class="legend" style="margin-top:8px"><span><svg width="26" height="8"><path d="M0 4h26" style="stroke:var(--ink-3);stroke-dasharray:4 3"/></svg>branches from — picks up mid-flow</span><span><svg width="26" height="8"><path d="M0 4h26" style="stroke:var(--ink-3)"/></svg>step link — hands off to</span><span>Click a card to open its map.</span></div>';
}
function connectionsList(E) {
  return '<div class="sect" style="margin-top:18px">Connections <span>· ' + E.length + '</span></div><div class="box">' + (E.length ? E.map((e) => '<div class="att" style="grid-template-columns:96px minmax(0,1fr);box-shadow:inset 3px 0 0 var(--' + (e.kind === 'branch' ? 'attn' : 'stone') + ')"><span class="chip ' + (e.kind === 'branch' ? 'attn' : 'navy') + '">' + (e.kind === 'branch' ? 'Branch' : 'Step link') + '</span><span>' + edgeSentence(e) + '</span></div>').join('')
    : '<div class="empty">Nothing connects these processes yet. Link a step to another process from its map, or set a process to branch from a step of another when you create or edit it.</div>') + '</div>';
}

/* the value chain board: every step of every process, in the client's phases */
function activities() { const a = []; procs().forEach((p) => workSteps(p).forEach((s) => a.push({ p, s }))); return a; }
function chainView() {
  const by = UI.f.vcBy || 'phase', q = (UI.f.vcQ || '').toLowerCase(), own = UI.f.vcOwner || '';
  const all = activities(), hit = all.filter(({ p, s }) => (!q || [s.label, roleName(s.role), (s.support || []).map(roleName).join(' '), s.actions.join(' ')].join(' ').toLowerCase().indexOf(q) >= 0) && (!own || s.role === own));
  const depts = new Set(all.map((x) => x.s.role).filter(Boolean));
  let cols;
  if (by === 'phase') { cols = S.phases.map((ph) => ({ id: ph.id, name: ph.name, color: ph.color, items: hit.filter((x) => x.s.phase === ph.id), phase: true })); const un = hit.filter((x) => !x.s.phase); if (un.length) cols.push({ id: '', name: 'Unphased', color: 'var(--field-line)', items: un }); }
  else { const r = {}; hit.forEach((x) => { const k = x.s.role || ''; (r[k] = r[k] || []).push(x); }); cols = Object.keys(r).sort((a, b) => (a === '') - (b === '') || r[b].length - r[a].length).map((k) => ({ id: k, name: k ? roleName(k) : 'Unassigned', color: 'var(--stone)', items: r[k] })); }
  const card = ({ p, s }) => { const g = stepGaps(p, s); return '<div class="vcard"><div class="top"><a class="code" href="#" data-go="' + openP(p.code, 'map') + '" style="text-decoration:none">' + p.code + '</a>' + (s.milestone ? '<span style="color:var(--gold-deep)">★</span>' : '') + '<span class="r"><button class="btn sm ghost" type="button" data-act="vcEdit" data-code="' + p.code + '" data-id="' + s.id + '">Edit</button></span></div><b>' + esc(s.label) + '</b>' + (s.actions[0] ? '<span class="q">' + esc(s.actions[0]) + '</span>' : '') + '<span>' + (s.role ? esc(roleName(s.role)) : '<span class="q">No owner yet</span>') + '</span>' + (s.support.length ? '<span class="q">Support: ' + s.support.map(roleName).map(esc).join(', ') + '</span>' : '') + (g.length ? '<span><span class="chip attn">⚠ ' + g.join(' · ') + '</span></span>' : '') + (s.links.length ? '<span>' + s.links.map((c) => '<span class="chip gold">🔗 ' + c + '</span>').join(' ') + '</span>' : '') + (by === 'phase' ? sel('vp-' + s.id, [['', '— unphased —']].concat(S.phases.map((x) => [x.id, x.name])), s.phase || '', { chg: 'vcPhase', data: 'data-code="' + p.code + '" data-id="' + s.id + '" aria-label="Phase"' }) : '') + '</div>'; };
  return '<div class="filters"><button class="btn sm" type="button" data-act="phaseAdd">Add a phase</button><button class="btn sm" type="button" data-act="vcImport">Import from spreadsheet</button></div>' +
    '<div class="cells c3"><div class="cell"><div class="k">Activities</div><div class="v">' + all.length + '</div></div><div class="cell"><div class="k">Phases</div><div class="v">' + S.phases.length + '</div></div><div class="cell"><div class="k">Departments</div><div class="v">' + depts.size + '</div></div></div>' +
    '<div class="filters">' + searchBox('vc-q', 'Search activity, owner, support…', UI.f.vcQ, 'vcQ') + sel('vc-own', [['', 'All departments']].concat([...depts].map((r) => [r, roleName(r)])), own, { chg: 'vcOwner' }) + '<div class="seg"><button type="button" class="' + (by === 'phase' ? 'on' : '') + '" data-act="vcBy" data-v="phase">By phase</button><button type="button" class="' + (by === 'owner' ? 'on' : '') + '" data-act="vcBy" data-v="owner">By owner</button></div></div>' +
    '<p class="note" style="margin-bottom:8px">' + (q || own ? hit.length + ' of ' + all.length + ' activities match. ' : '') + (by === 'phase' ? 'Click Edit to change a card; move it with its phase box, or use ← → to order the phases.' : 'Grouped by department — switch to By phase to move activities.') + '</p>' +
    '<div class="vcb">' + cols.map((c, i) => '<div class="vcc"><div class="vcc-h"><span class="vdot" style="background:' + c.color + '"></span><b>' + esc(c.name) + '</b><span class="n">' + c.items.length + '</span>' + (c.phase ? '<span class="ctl"><button class="btn sm ghost" type="button" data-act="phaseMove" data-id="' + c.id + '" data-d="-1" aria-label="Earlier"' + (i ? '' : ' disabled') + '>←</button><button class="btn sm ghost" type="button" data-act="phaseMove" data-id="' + c.id + '" data-d="1" aria-label="Later"' + (i < S.phases.length - 1 ? '' : ' disabled') + '>→</button>' + menuBtn('ph-' + c.id, '⋯', mi('Rename', 'phaseRename', 'data-id="' + c.id + '"') + mi('Delete…', 'phaseDelete', 'bad data-id="' + c.id + '"'), { cls: 'btn sm ghost', noCaret: true, w: 150 }) + '<button class="btn sm ghost" type="button" data-act="vcAdd" data-ph="' + c.id + '" aria-label="Add an activity">+</button></span>' : '') + '</div>' + (c.items.length ? c.items.map(card).join('') : '<p class="note" style="padding:6px">Nothing here</p>') + '</div>').join('') + '</div>';
}
INP.vcQ = (el) => { UI.f.vcQ = el.value; render(); };
CHG.vcOwner = (el) => { UI.f.vcOwner = el.value; render(); };
ACT.vcBy = (el) => { UI.f.vcBy = el.dataset.v; render(); };
CHG.vcPhase = (el) => { stepById(byCode(el.dataset.code), el.dataset.id).phase = el.value || null; render(); };
ACT.phaseMove = (el) => { const i = S.phases.findIndex((x) => x.id === el.dataset.id), j = i + Number(el.dataset.d); if (j < 0 || j >= S.phases.length) return; const t = S.phases[i]; S.phases[i] = S.phases[j]; S.phases[j] = t; render(); };
const PH_COLORS = ['#4F46E5', '#0E7490', '#B45309', '#7C3AED', '#047857', '#BE185D', '#475569', '#A16207'];
ACT.phaseAdd = () => dialog({ title: 'Add a phase', sub: S.phases.length ? S.phases.map((x) => esc(x.name)).join(' → ') : 'The stages of the value chain. The first one becomes a column on the board.', body: fld('New phase', inp('ph-name', '', { ph: 'e.g. Initiation' })), foot: '<button class="btn" type="button" data-act="close">Cancel</button><button class="btn gold" type="button" data-act="phaseSave">Add phase</button>' });
ACT.phaseSave = () => { const n = val('ph-name'); if (!n) return; S.phases.push({ id: uid('ph'), name: n, color: PH_COLORS[S.phases.length % 8] }); UI.layer = null; render(); };
ACT.phaseRename = (el) => { const ph = S.phases.find((x) => x.id === el.dataset.id); dialog({ title: 'Rename phase', body: fld('Phase name', inp('ph-name', ph.name)), foot: '<button class="btn" type="button" data-act="close">Cancel</button><button class="btn gold" type="button" data-act="phaseRenameGo" data-id="' + ph.id + '">Save</button>' }); };
ACT.phaseRenameGo = (el) => { const n = val('ph-name'); if (n) S.phases.find((x) => x.id === el.dataset.id).name = n; UI.layer = null; render(); };
ACT.phaseDelete = (el) => { const ph = S.phases.find((x) => x.id === el.dataset.id); dialog({ title: 'Delete phase?', body: '<p>“' + esc(ph.name) + '” goes. Its activities stay on their processes and move to Unphased.</p>', foot: '<button class="btn" type="button" data-act="close">No</button><button class="btn danger solid" type="button" data-act="phaseDeleteGo" data-id="' + ph.id + '">Yes, delete</button>' }); };
ACT.phaseDeleteGo = (el) => { S.phases = S.phases.filter((x) => x.id !== el.dataset.id); procs().forEach((p) => p.steps.forEach((s) => { if (s.phase === el.dataset.id) s.phase = null; })); UI.layer = null; render(); };
ACT.vcEdit = (el) => {
  const p = byCode(el.dataset.code), s = stepById(p, el.dataset.id);
  dialog({ title: 'Edit activity', sub: p.code + ' ' + esc(p.name) + ' · step ' + stepNo(p, s.id), body: '<div class="frm">' + fld('Activity', inp('va-label', s.label)) + fld('Owner', sel('va-role', [['', '— none yet —']].concat(liveRoles().map((r) => [r.id, r.name])), s.role || '')) + fld('Description', area('va-desc', s.actions.join('\n'), { rows: 3 })) +
    fld('Supporting departments', '<div class="checks" style="max-height:150px;overflow:auto">' + liveRoles().map((r) => '<label><input type="checkbox" name="va-sup" value="' + r.id + '"' + (s.support.indexOf(r.id) >= 0 ? ' checked' : '') + '> ' + esc(r.name) + '</label>').join('') + '</div>') + '</div>',
    foot: '<button class="btn danger l" type="button" data-act="vcDel" data-code="' + p.code + '" data-id="' + s.id + '">Delete</button><button class="btn" type="button" data-act="close">Cancel</button><button class="btn gold" type="button" data-act="vcSave" data-code="' + p.code + '" data-id="' + s.id + '">Save</button>' });
};
ACT.vcSave = (el) => { const s = stepById(byCode(el.dataset.code), el.dataset.id); s.label = val('va-label') || s.label; s.role = val('va-role') || null; s.actions = lines(val('va-desc')); s.support = checkedVals('va-sup'); UI.layer = null; toast('Saved — it is the same step on the process map.'); render(); };
ACT.vcDel = (el) => { CUR = byCode(el.dataset.code); ACT.stepDoDelete({ dataset: { id: el.dataset.id } }); };
ACT.vcAdd = (el) => {
  const ph = S.phases.find((x) => x.id === el.dataset.ph);
  dialog({ title: 'New activity', body: '<div class="frm">' + fld('Activity in ' + esc(ph.name), inp('vn-label', '', { ph: 'e.g. Offer submission' })) + fld('On process', sel('vn-proc', procs().map((p) => [p.code, p.code + ' — ' + p.name]), 'ORD100')) + fld('Owner', sel('vn-role', [['', '— none yet —']].concat(liveRoles().map((r) => [r.id, r.name])), '')) + '</div>',
    foot: '<button class="btn" type="button" data-act="close">Cancel</button><button class="btn gold" type="button" data-act="vcAddGo" data-ph="' + ph.id + '">Add activity</button>' });
};
ACT.vcAddGo = (el) => { const n = val('vn-label'); if (!n) return; const p = byCode(val('vn-proc')), last = workSteps(p).slice(-1)[0], s = { id: uid('s'), type: 'TASK', label: n, role: val('vn-role') || null, actions: [], risk: '', inputs: '', output: '', errors: '', links: [], milestone: false, phase: el.dataset.ph, support: [], requiresAll: false, note: '' }; p.steps.push(s); if (last) p.conn.push({ from: last.id, to: s.id, label: '' }); UI.layer = null; toast('Added as a step on ' + p.code + '.'); render(); };
ACT.vcImport = () => dialog({ title: 'Import a value chain', sub: '.xlsx with a Phase column and a Step / Activity column; Primary Owner, Supporting Departments and Description optional. Nothing is overwritten.', body: '<div class="frm">' + fld('Spreadsheet', '<input type="file" accept=".xlsx">') + fld('Land the activities on', sel('vi-on', [['', '— a new process —']].concat(procs().map((p) => [p.code, p.code + ' — ' + p.name])), '')) + fld('New process name', inp('vi-name', '', { ph: 'e.g. Integrated Value Chain' })) + '</div>',
  foot: '<button class="btn" type="button" data-act="close">Cancel</button><button class="btn gold" type="button" data-act="toast" data-msg="In the product this previews what will be imported before anything is added.">Preview</button>' });
