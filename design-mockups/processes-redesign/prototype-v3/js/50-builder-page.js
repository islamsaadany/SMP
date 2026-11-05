/* ══ THE BUILDER PAGE ══════════════════════════════════════════════════
   One process at a time. The band names it (the name is a picker) and carries
   the next step for its draft; Save and exit sits just under the band and stays
   in view. The menu on the left lists the ten sections, each with a status dot.
   Only an open draft can change: what is in force, or with the approver, reads. */
const BSECS = [['map', 'Map'], ['raci', 'RACI'], ['auth', 'Authority'], ['risks', 'Risks & controls'], ['quality', 'Quality'], ['life', 'Lifecycle'], ['people', 'People'], ['compliance', 'Compliance'], ['conn', 'Connections'], ['ai', 'Check with AI']];
const BDESC = {
  map: 'The flow: lanes are roles. Pick a step to fill it in.', raci: 'Who does each step (R), who answers for it (A), who is asked (C) and who is told (I).',
  auth: 'Approval levels by amount, and time limits before a step moves up.', risks: 'What could go wrong at each step, and the control that holds it.',
  quality: 'The measures that say whether the process works, and the non-conformances raised on it.', life: 'Where this version is, who approves it, every version so far and the next review.',
  people: 'Who fills each role on this process, by name, and who covers for them.', compliance: 'The laws, standards and policies this process must meet, and the evidence that it does.',
  conn: 'The systems this process uses, and the processes it picks work up from and hands it to.', ai: 'Reads the draft and lists what looks missing. Nothing changes until you press a button.',
};
const editable = (p) => !!(p.draft && (p.draft.state === 'draft' || p.draft.state === 'returned'));
const bContent = (p) => (p.draft ? p.draft.c : p.live);
const bp = () => byCode(UI.args[0]);
const selD = (attrs, opts, cur) => '<select ' + attrs + '>' + opts.map(([v, l]) => '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(l) + '</option>').join('') + '</select>';
const fdiv = (label, inner) => '<div class="fld"><span>' + label + '</span>' + inner + '</div>';
const roleOpts = () => S.roles.map((r) => [r.id, r.name]);
const stepOpts = (c, all) => (all ? c.steps : tasks(c)).map((s) => [s.id, (s.type === 'START' || s.type === 'END' ? s.type.charAt(0) + s.type.slice(1).toLowerCase() : 'Step ' + stepNo(c, s.id)) + ' · ' + s.label]);
const lookFor = (pid) => Object.keys(AS).find((k) => AS[k] === pid);
const DSTATE = { draft: ['q', 'Draft'], returned: ['bad', 'Sent back'], 'in-review': ['attn', 'With the approver'], approved: ['good', 'Approved'] };

/* every change to a draft goes through here: it can be undone, and it marks what changed */
function edit(fn, msg) {
  const p = bp();
  if (!editable(p)) { toast(p.draft ? 'It is with the approver. Take it back to change it.' : 'Start a draft to change it.'); return; }
  UI.undo.push({ code: p.code, c: clone(p.draft.c) }); if (UI.undo.length > 40) UI.undo.shift();
  fn(p.draft.c, p);
  p.draft.saved = true;
  render(); if (msg) toast(msg);
}
const touch = (p, s) => { if (p.live && s) s.changed = true; };
ACT.undo = () => {
  const p = bp(), i = UI.undo.map((u) => u.code).lastIndexOf(p.code);
  if (i < 0 || !editable(p)) { toast('Nothing to undo.'); return; }
  p.draft.c = UI.undo.splice(i, 1)[0].c; render(); toast('Undone.');
};

/* the next step for this process, on the band and in Lifecycle */
function nextAct(p, cls) {
  const d = p.draft, b = cls || 'bgold';
  if (!d) return '<button class="' + b + '" type="button" data-act="bStart">' + (p.live ? 'Start draft v' + (p.inForce + 1) : 'Start the first draft') + '</button>';
  if (d.state === 'draft' || d.state === 'returned') return '<button class="' + b + '" type="button" data-act="sendAppr">' + (d.state === 'returned' ? 'Send for approval again' : 'Send for approval') + '</button>';
  if (d.state === 'approved') return '<button class="' + b + '" type="button" data-act="publish" data-code="' + p.code + '">Publish v' + d.v + '</button>';
  return '<button class="' + (cls ? 'btn' : 'bq') + '" type="button" data-act="takeBack">Take it back to edit</button>';
}

/* what Check with AI finds: worked out from the content, applied only on a press */
const CTL_IDEAS = [[/proof of delivery/i, 'The invoice is raised only from a signed proof photo'], [/price/i, 'Price list signed off before use'], [/credit note/i, 'The ERP blocks a second credit note on one invoice'], [/split/i, 'Weekly report of orders just under a threshold'], [/shrinkage|stock/i, 'A second count, signed by the supervisor']];
const ctlIdea = (risk) => (CTL_IDEAS.find(([re]) => re.test(risk)) || [0, 'A second person checks it before the work moves on'])[1];
const STEP_IDEAS = { ORD100: ['o5', 'Handle a refused delivery', 'r4', 'refused', 'A delivery the customer refuses has no step'], STO100: ['t3', 'Record the difference', 'r7', 'no', ''], INV100: ['i3', 'Recount before adjusting', 'r13', 'yes', ''] };
function insertStep(c, anchor, type, label, role, edgeLabel, p, why) {
  let n = c.steps.length + 1, id; do { id = 'x' + n++; } while (stepById(c, id));
  const s = st(id, type, label, role); if (p.live) s.changed = true;
  if (why) { s.proposed = true; s.why = why; } /* from Check with AI: proposed until confirmed */
  const ai = anchor ? c.steps.findIndex((x) => x.id === anchor) : -1;
  if (ai < 0) { const e = c.steps.findIndex((x) => x.type === 'END'); c.steps.splice(e < 0 ? c.steps.length : e, 0, s); }
  else {
    c.steps.splice(ai + 1, 0, s);
    const outs = c.conn.filter((e) => e[0] === anchor);
    if (edgeLabel == null && outs.length === 1) outs[0][0] = id; /* a plain + Step goes into the line */
    c.conn.push([anchor, id, edgeLabel || '']);
  }
  return id;
}
function aiFindings(p, c) {
  const out = []; if (!c) return out;
  const ownerRole = person(p.owner).roles[0];
  gapsOf(c).forEach((g) => {
    const s = stepById(c, g.step);
    if (g.kind === 'noA') out.push({ step: g.step, text: 'No one is accountable', why: 'Every step needs one role that answers for it. The owner’s role is the usual choice.', btn: 'Make the ' + roleName(ownerRole) + ' accountable', fn: (cc) => { (cc.raci[g.step] = cc.raci[g.step] || {})[ownerRole] = 'A'; } });
    if (g.kind === 'twoA') { const as = Object.keys(raciOf(c, g.step)).filter((r) => raciOf(c, g.step)[r] === 'A'); out.push({ step: g.step, text: 'Two roles are accountable', why: 'When two answer for a step, neither does. Keep one, and consult the other.', btn: 'Keep the ' + roleName(as[0]) + ' accountable', fn: (cc) => as.slice(1).forEach((r) => { cc.raci[g.step][r] = 'C'; }) }); }
    if (g.kind === 'noR') out.push({ step: g.step, text: 'No one is named to do it', why: 'The role in its lane does the work, so it should carry the R.', btn: 'Make the ' + roleName(s.role) + ' responsible', fn: (cc) => { (cc.raci[g.step] = cc.raci[g.step] || {})[s.role] = 'R'; } });
  });
  c.controls.forEach((k, i) => { if (!k.control) { const idea = ctlIdea(k.risk); out.push({ step: k.step, text: '“' + k.risk + '” has no control', why: 'A risk with no control is the first thing an auditor asks about.', btn: 'Add a control: ' + idea, fn: (cc) => { cc.controls[i].control = idea; } }); } });
  const idea = STEP_IDEAS[p.code];
  tasks(c).filter((s) => s.type === 'DECISION' && c.conn.filter((e) => e[0] === s.id).length < 2).forEach((s) => {
    const mine = idea && idea[0] === s.id, label = mine ? idea[1] : 'Handle the other answer';
    if (c.steps.some((x) => x.label === label)) return;
    out.push({ step: s.id, text: 'A decision with only one way out', why: 'Say what happens on the other answer, or each person decides it for themselves.', btn: 'Add as a step: ' + label, add: true, fn: (cc) => { UI.sel = insertStep(cc, s.id, 'TASK', label, mine ? idea[2] : s.role, mine ? idea[3] : 'no', p, 'Say what happens on the other answer of step ' + stepNo(c, s.id) + '.'); } });
  });
  if (idea && idea[4] && stepById(c, idea[0]) && !c.steps.some((x) => x.label === idea[1])) out.push({ step: idea[0], text: 'A missing step: ' + idea[4].charAt(0).toLowerCase() + idea[4].slice(1), why: 'Similar processes name who takes the goods back and what happens to the order.', btn: 'Add as a step: ' + idea[1], add: true, fn: (cc) => { UI.sel = insertStep(cc, idea[0], 'TASK', idea[1], idea[2], idea[3], p, idea[4] + '.'); } });
  if (tasks(c).length && !c.kpis.length) out.push({ step: null, text: 'No measure says whether it works', why: 'One measure is enough to start: how long it takes from start to finish.', btn: 'Add a measure: time from start to finish', fn: (cc) => { cc.kpis.push(['Time from start to finish', 'Set a target', 'Monthly']); } });
  return out;
}

function secDot(k, p, c) {
  if (['people', 'compliance', 'conn'].includes(k)) return 'q';
  if (k === 'life') return p.live ? '' : 'q';
  if (!c || !tasks(c).length) return 'q';
  const g = gapsOf(c);
  if (k === 'map') return g.length ? 'bad' : '';
  if (k === 'raci') return g.some((x) => x.kind !== 'noControl') ? 'bad' : '';
  if (k === 'auth') return c.auth.length ? '' : 'q';
  if (k === 'risks') return c.controls.some((x) => !x.control) ? 'bad' : c.controls.length ? '' : 'q';
  if (k === 'quality') return c.kpis.length ? '' : 'q';
  return aiFindings(p, c).length ? 'bad' : '';
}

R.b = (args) => {
  if (!isOffice()) return R.list();
  const p = byCode(args[0]); if (!p) return R.all();
  const sec = BSECS.some((x) => x[0] === args[1]) ? args[1] : 'map';
  UI.bsec = sec;
  const c = bContent(p), ed = editable(p), d = p.draft, g = gapsOf(c), rd = readersOf(p);
  const fromS = d ? S.suggestions.find((s) => s.code === p.code && s.draftV === d.v) : null;
  const ds = d ? DSTATE[d.state] : null;
  const title = '<button class="tpick" type="button" data-act="pick" aria-haspopup="true" aria-expanded="' + UI.pick + '" title="Open another process">' + esc(p.name) + ' <i aria-hidden="true">▾</i></button>' + (d ? pill(ds[0], ds[1] === 'With the approver' ? 'With ' + person(p.approver).name : ds[1] + ' · v' + d.v) : p.live ? pill('good', 'In force · v' + p.inForce) : pill('q', 'Not started'));
  const sub = (d ? 'Draft v' + d.v + (fromS ? ' · started from ' + esc(person(fromS.by).name) + '’s suggestion' + (fromS.step && stepById(d.c, fromS.step) ? ' on step ' + stepNo(d.c, fromS.step) : '') : d.note ? ' · ' + esc(d.note) : '') : p.live ? 'In force · v' + p.inForce + ' since ' + fmt(p.publishedAt) + ' · no draft open' : 'Not drawn yet') + ' · Owner <b>' + esc(person(p.owner).name) + '</b> · Approver <b>' + esc(person(p.approver).name) + '</b>';
  const band = mast({ eyebrow: 'Raya Trade · Processes · Builder › ' + p.code + ' · ' + esc(p.cat), title, sub,
    acts: (c && tasks(c).length ? '<button class="bq" type="button" data-go="mona.preview.' + p.code + '">Preview as manager</button>' : '') + nextAct(p),
    tiles: tiles([[tasks(c).length, 'Steps'], [g.length, 'Gaps', g.length ? 'late' : ''], [marksOf(p).reduce((a, b) => a + b, 0) + '/6', 'Ready']].concat(p.live ? [[rd.filter((x) => p.acks.includes(x)).length + '/' + rd.length, 'Have read v' + p.inForce]] : [])),
    extra: '<div class="pmenu" id="pmenu"' + (UI.pick ? '' : ' hidden') + '><input type="search" placeholder="Find a process" data-inp="pq" aria-label="Find a process" autocomplete="off"><div class="pl" role="list">' + pickList('') + '</div></div>' });
  const saved = ed ? (d.saved ? 'Saved just now' : 'All changes saved') + ' · draft v' + d.v : d ? 'Draft v' + d.v + ' · ' + ds[1].toLowerCase() + ' · nothing to save' : p.live ? 'In force v' + p.inForce + ' · no draft open' : 'Not started';
  const exitbar = '<div class="exitbar"><span class="note">' + saved + '</span><button class="btn gold" type="button" data-act="exit">Save and exit</button></div>';
  let strip = '';
  if (!d) strip = '<div class="strip navy"><b>' + (p.live ? 'In force' : 'Not started') + '</b><span>' + (p.live ? 'You are looking at version ' + p.inForce + ', as everyone reads it. Start draft v' + (p.inForce + 1) + ' to change it; readers keep v' + p.inForce + ' until the new one is published.' : 'Start the first draft to draw it with ' + esc(person(p.owner).name) + '’s team.') + '</span><span class="acts">' + nextAct(p, 'btn gold') + '</span></div>';
  else if (d.state === 'returned') strip = '<div class="strip"><b>Sent back</b><span>' + esc(person(p.approver).name) + ' sent v' + d.v + ' back on ' + fmt(d.returnedAt) + ': “' + esc(d.returnedNote) + '” Make the change, then send it again.</span></div>';
  else if (d.state === 'in-review') strip = '<div class="strip navy"><b>With the approver</b><span>Sent to ' + esc(person(p.approver).name) + ' on ' + fmt(d.sentAt) + '. Nothing changes while it is with them' + (lookFor(p.approver) ? ': look as ' + esc(person(p.approver).name.split(' ')[0]) + ' to approve it' : '') + '.</span><span class="acts">' + nextAct(p, 'btn') + '</span></div>';
  else if (d.state === 'approved') strip = '<div class="strip"><b>Approved</b><span>' + esc(d.approvedBy || person(p.approver).name) + ' approved v' + d.v + ' on ' + fmt(d.approvedAt) + '. Publishing puts it in force and asks ' + plural(new Set(tasks(d.c).map((s) => s.role)).size, 'role') + ' with a step to read it.</span><span class="acts">' + nextAct(p, 'btn gold') + '</span></div>';
  const rail = '<nav class="box rail" aria-label="Sections">' + BSECS.map(([k, l], i) => (i === 6 || i === 9 ? '<span class="sep"></span>' : '') + '<button type="button" class="' + (k === sec ? 'on' : '') + '" aria-current="' + (k === sec) + '" data-go="mona.b.' + p.code + '.' + k + '"><span>' + l + (k === 'ai' && aiFindings(p, c).length ? ' · ' + aiFindings(p, c).length : '') + '</span><span class="dot ' + secDot(k, p, c) + '"></span></button>').join('') + '</nav>';
  const body = { map: bMap, raci: bRaci, auth: bAuth, risks: bRisks, quality: bQuality, life: bLife, ai: bAi }[sec];
  const head = '<div class="bh"><span class="note">' + BDESC[sec] + '</span></div>';
  const inner = body ? (c || sec === 'life' ? body(p, c, ed) : notDrawn(p)) : '<div class="ph"><b>Nothing recorded yet</b>' + BDESC[sec] + ' It stays in the menu on every process, as signed off on 14 Oct, and fills in once there is something to hold.</div>';
  return page(band + exitbar + strip + '<div class="bld">' + rail + '<div style="min-width:0">' + head + inner + '</div></div>');
};
const notDrawn = (p) => '<div class="ph"><b>Not drawn yet</b>Start the first draft, then draw the flow on Map. <div class="row3">' + nextAct(p, 'btn gold') + '</div></div>';

/* ── the picker on the process name ── */
function pickList(q) {
  const s = q.toLowerCase(), cur = UI.args[0], sec = UI.bsec || 'map';
  const list = procs().filter((p) => !s || (p.code + ' ' + p.name).toLowerCase().indexOf(s) >= 0);
  return list.map((p) => '<button type="button" role="listitem" class="' + (p.code === cur ? 'on' : '') + '" data-go="mona.b.' + p.code + '.' + sec + '"><span class="code">' + p.code + '</span><span>' + esc(p.name) + '<br><small class="note">' + esc(stateOf(p).label) + '</small></span></button>').join('') || '<p class="note" style="padding:6px 8px">No process matches.</p>';
}
ACT.pick = () => {
  UI.pick = !UI.pick; const m = $('#pmenu'); if (!m) return;
  m.hidden = !UI.pick; $('.tpick').setAttribute('aria-expanded', UI.pick);
  if (UI.pick) { const i = m.querySelector('input'); i.value = ''; m.querySelector('.pl').innerHTML = pickList(''); i.focus(); }
};
INP.pq = (el) => { $('#pmenu .pl').innerHTML = pickList(el.value); };
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('#pmenu input')) { const b = $('#pmenu .pl button'); if (b) go(b.dataset.go); } });

/* ── Map ── */
function bMap(p, c, ed) {
  const s0 = UI.sel && (tasks(c).some((s) => s.id === UI.sel) || (stepById(c, UI.sel) || {}).proposed) ? UI.sel : (tasks(c)[0] || {}).id;
  const froms = p.draft ? S.suggestions.filter((s) => s.code === p.code && s.draftV === p.draft.v) : [];
  const from = froms.map((s) => { const at = s.step && stepById(c, s.step); return '<div class="from">From <b>' + esc(person(s.by).name) + '</b>’s suggestion' + (at ? ' on step ' + stepNo(c, s.step) + ', <button class="lnk" type="button" data-act="pickStep" data-step="' + s.step + '">' + esc(at.label) + '</button>' : '') + ' · ' + fmt(s.at) + '<br>“' + esc(s.text) + '”' + (s.answer ? '<br><span class="note">The office asked: ' + esc(s.answer.text) + '</span>' : '') + (s.reply ? '<br>' + esc(person(s.by).name.split(' ')[0]) + ' replied: “' + esc(s.reply.text) + '”' : s.state === 'answered' ? '<br><span class="note">No reply yet.</span>' : '') + '</div>'; }).join('');
  const hasUndo = UI.undo.some((u) => u.code === p.code);
  const tool = ed ? '<div class="ftool"><button class="btn" type="button" data-act="addStep" data-type="TASK">+ Step</button><button class="btn" type="button" data-act="addStep" data-type="DECISION">+ Decision</button><button class="btn" type="button" data-act="connect"' + (c.steps.length > 1 ? '' : ' disabled') + '>Connect two steps</button><button class="btn" type="button" data-act="undo"' + (hasUndo ? '' : ' disabled') + '>Undo</button><span class="sp"></span><span class="note">Saved as you type · a red mark is a gap</span></div>' : '';
  return (from ? '<div style="display:grid;gap:6px;margin-bottom:10px">' + from + '</div>' : '') + tool + '<div class="agrid">' + flowHtml(c, p, { sel: s0, gaps: true, changes: !!p.live, edit: ed }) + '<aside class="box drawer" aria-live="polite">' + (ed ? stepForm(p, c, s0) : stepRead(c, s0)) + '</aside></div>';
}
function stepForm(p, c, sid) {
  const s = stepById(c, sid); if (!s) return '<p class="note">Add a step with + Step, then pick it to fill it in.</p>';
  if (s.proposed) return '<span class="note" style="font-family:var(--mono);font-weight:700;color:var(--gold-deep)">PROPOSED · FROM AI REVIEW</span><h3>' + esc(s.label) + '</h3><p class="note">' + esc(s.why || 'Check with AI proposed it.') + ' Done by: ' + esc(roleName(s.role)) + '.</p><p style="font-size:13px">It is not a step until you confirm it: readers, the RACI and the gaps ignore it until then.</p><div class="row3"><button class="btn gold" type="button" data-act="propOk" data-step="' + s.id + '">Confirm</button><button class="btn" type="button" data-act="propDel" data-step="' + s.id + '">Delete</button></div>';
  const r = raciOf(c, sid), gp = gapsOf(c).filter((x) => x.step === sid);
  const ks = c.controls.map((k, i) => [k, i]).filter(([k]) => k.step === sid), rules = c.auth.map((x, i) => [x, i]).filter(([x]) => x.step === sid);
  const ds = ' data-step="' + sid + '"';
  return '<span class="note" style="font-family:var(--mono);font-weight:700">STEP ' + stepNo(c, sid) + (s.type === 'DECISION' ? ' · DECISION' : '') + '</span>' + gp.map((x) => '<p class="ctl bad">' + esc(x.text) + '</p>').join('') +
    fld('Step', '<input data-chg="sLabel"' + ds + ' value="' + esc(s.label) + '">') +
    fld('Who does it', selD('data-chg="sRole"' + ds, roleOpts(), s.role)) +
    fld('What they do, one line each' + (s.changed && p.live ? ' <span class="chip gold">Changed in v' + p.draft.v + '</span>' : ''), '<textarea data-chg="sActs"' + ds + '>' + esc(s.acts.join('\n')) + '</textarea>') +
    fdiv('Who is involved · click a letter to change it', '<div class="row">' + Object.keys(r).map((k) => '<span class="rcr"><button type="button" class="rc ' + r[k] + '" data-act="cyc"' + ds + ' data-role="' + k + '" aria-label="' + esc(roleName(k)) + ': ' + r[k] + '">' + r[k] + '</button>' + esc(roleName(k)) + '</span>').join('') + '</div>' + selD('data-chg="raciAdd"' + ds + ' aria-label="Add a role"', [['', '+ Add a role']].concat(S.roles.filter((x) => !r[x.id]).map((x) => [x.id, x.name])), '')) +
    fdiv('Approval and time limit', (rules.length ? rules.map(([x, i]) => '<div class="row"><span style="flex:1;font-size:13px">' + esc(ruleText(x)) + '</span><button class="xdel" type="button" data-act="ruleDel" data-i="' + i + '" aria-label="Remove this rule">×</button></div>').join('') : '<span class="note">None.</span>') + '<div class="row"><button class="btn sm" type="button" data-act="ruleNew"' + ds + '>+ Add a rule</button></div>') +
    fdiv('Risk and control', (ks.length ? ks.map(([k, i]) => '<div class="kbox"><span>Risk: ' + esc(k.risk) + '</span><input data-chg="kCtl" data-i="' + i + '" value="' + esc(k.control) + '" placeholder="No control yet: say how the risk is held" aria-label="Control for ' + esc(k.risk) + '"></div>').join('') : '<span class="note">No risk recorded on this step.</span>') + '<div class="row"><button class="btn sm" type="button" data-act="ctlNew"' + ds + '>+ Add a control</button></div>') +
    '<div><button class="lnk" type="button" data-act="sDel"' + ds + '>Remove this step</button></div>';
}
const stepOf = (c, el) => stepById(c, el.dataset.step);
CHG.sLabel = (el) => edit((c, p) => { const s = stepOf(c, el); s.label = el.value.trim() || s.label; touch(p, s); });
CHG.sRole = (el) => edit((c, p) => { const s = stepOf(c, el); s.role = el.value; touch(p, s); }, 'Moved to the ' + roleName(el.value) + ' lane.');
CHG.sActs = (el) => edit((c, p) => { const s = stepOf(c, el); s.acts = el.value.split('\n').map((x) => x.trim()).filter(Boolean); touch(p, s); });
ACT.cyc = (el) => edit((c, p) => {
  const o = c.raci[el.dataset.step] = c.raci[el.dataset.step] || {}, order = ['', 'R', 'A', 'C', 'I'], nx = order[(order.indexOf(o[el.dataset.role] || '') + 1) % 5];
  if (nx) o[el.dataset.role] = nx; else delete o[el.dataset.role];
  touch(p, stepOf(c, el));
});
CHG.raciAdd = (el) => { if (!el.value) return; const role = el.value; edit((c, p) => { const o = c.raci[el.dataset.step] = c.raci[el.dataset.step] || {}, l = Object.values(o); o[role] = !l.includes('R') ? 'R' : !l.includes('A') ? 'A' : 'I'; touch(p, stepOf(c, el)); }); };
ACT.ruleDel = (el) => edit((c, p) => { const [x] = c.auth.splice(Number(el.dataset.i), 1); touch(p, stepById(c, x.step)); }, 'Rule removed.');
CHG.kCtl = (el) => edit((c, p) => { const k = c.controls[Number(el.dataset.i)]; k.control = el.value.trim(); touch(p, stepById(c, k.step)); });
ACT.addStep = (el) => {
  const p = bp(), c = bContent(p), dec = el.dataset.type === 'DECISION';
  const anchor = UI.sel && tasks(c).some((s) => s.id === UI.sel) ? UI.sel : (tasks(c).slice(-1)[0] || {}).id;
  const role = anchor ? stepById(c, anchor).role : person(p.owner).roles[0];
  edit((cc) => { UI.sel = insertStep(cc, anchor, el.dataset.type, dec ? 'New decision' : 'New step', role, null, p); }, (dec ? 'Decision' : 'Step') + ' added' + (anchor ? ' after step ' + stepNo(c, anchor) : '') + '. Name it in the form' + (window.innerWidth > 1240 ? ' on the right.' : ' under the flow.'));
};
ACT.sDel = (el) => edit((c) => {
  const id = el.dataset.step, ins = c.conn.filter((e) => e[1] === id), outs = c.conn.filter((e) => e[0] === id);
  c.conn = c.conn.filter((e) => e[0] !== id && e[1] !== id);
  if (ins.length === 1 && outs.length === 1) c.conn.push([ins[0][0], outs[0][1], ins[0][2]]);
  c.steps = c.steps.filter((s) => s.id !== id); delete c.raci[id];
  c.auth = c.auth.filter((x) => x.step !== id); c.controls = c.controls.filter((x) => x.step !== id);
  UI.sel = null;
}, 'Step removed. Undo brings it back.');
ACT.connect = () => {
  const c = bContent(bp());
  dialog({ title: 'Connect two steps', sub: 'An arrow from one step to another. Label it when it is one answer of a decision.', body: fld('From', sel('cn-f', stepOpts(c, true), UI.sel)) + fld('To', sel('cn-t', stepOpts(c, true), '')) + fld('Label (optional)', '<input id="cn-l" placeholder="For example: over limit">'), foot: foot2('connectGo', 'Connect') });
};
ACT.connectGo = () => {
  const f = val('cn-f'), t = val('cn-t'), l = val('cn-l');
  if (f === t) { toast('Pick two different steps.'); return; }
  closeLayer(); edit((c) => { if (!c.conn.some((e) => e[0] === f && e[1] === t)) c.conn.push([f, t, l]); }, 'Connected.');
};
ACT.ruleNew = (el) => {
  const p = bp(); if (!editable(p)) { edit(() => {}); return; }
  const c = p.draft.c;
  dialog({ title: 'Add a rule', sub: 'An approval level by amount, or a time limit before the step moves up.', body: (el.dataset.step ? '' : fld('Step', sel('ru-step', stepOpts(c), UI.sel))) + fld('Kind', sel('ru-kind', [['money', 'Approval at or above an amount'], ['time', 'Time limit before it moves up']], 'money')) + fld('Amount in $, or number of days', '<input id="ru-n" type="number" min="1" value="50000">') + fld('Goes to', sel('ru-role', roleOpts(), person(p.owner).roles[0])), foot: foot2('ruleGo', 'Add the rule', ' data-step="' + (el.dataset.step || '') + '"') });
};
ACT.ruleGo = (el) => {
  const n = Number(val('ru-n')); if (!(n > 0)) { toast('Give a number above zero.'); return; }
  const step = el.dataset.step || val('ru-step'), kind = val('ru-kind'), role = val('ru-role');
  closeLayer(); edit((c, p) => { c.auth.push(rule(step, kind, n, role)); touch(p, stepById(c, step)); }, 'Rule added.');
};
ACT.ctlNew = (el) => {
  const p = bp(); if (!editable(p)) { edit(() => {}); return; }
  dialog({ title: 'Add a risk and its control', sub: el.dataset.step ? 'On step ' + stepNo(p.draft.c, el.dataset.step) + ', ' + esc(stepById(p.draft.c, el.dataset.step).label) + '.' : 'Pinned to a step.', body: (el.dataset.step ? '' : fld('Step', sel('kn-step', stepOpts(p.draft.c), UI.sel))) + fld('What could go wrong', '<input id="kn-risk" placeholder="For example: goods released before payment">') + fld('How serious', sel('kn-lvl', [['High', 'High'], ['Medium', 'Medium'], ['Low', 'Low']], 'Medium')) + fld('The control (leave empty if there is none yet)', '<input id="kn-ctl" placeholder="For example: the ERP blocks the release">'), foot: foot2('ctlGo', 'Add', ' data-step="' + (el.dataset.step || '') + '"') });
};
ACT.ctlGo = (el) => {
  const risk = val('kn-risk'); if (!risk) { toast('Say what could go wrong first.'); return; }
  const step = el.dataset.step || val('kn-step'), lvl = val('kn-lvl'), k = val('kn-ctl');
  closeLayer(); edit((c, p) => { c.controls.push(ctl(step, risk, lvl, k)); touch(p, stepById(c, step)); }, k ? 'Risk and control added.' : 'Risk added. It shows as a gap until it has a control.');
};

/* ── RACI ── */
function bRaci(p, c, ed) {
  if (!tasks(c).length) return notDrawn(p);
  const roles = []; tasks(c).forEach((s) => { [s.role].concat(Object.keys(raciOf(c, s.id))).forEach((r) => { if (!roles.includes(r)) roles.push(r); }); });
  const g = gapsOf(c).filter((x) => x.kind !== 'noControl');
  const word = { noA: 'No one accountable', twoA: 'Two accountable', noR: 'No one doing it' };
  return '<div class="box raci-wrap"><table class="raci"><thead><tr><th>Step</th>' + roles.map((r) => '<th>' + esc(roleName(r)) + '</th>').join('') + '</tr></thead><tbody>' +
    tasks(c).map((s, i) => { const gp = g.filter((x) => x.step === s.id); return '<tr><td' + (gp.length ? ' class="gaprow"' : '') + '>' + (i + 1) + '. ' + esc(s.label) + gp.map((x) => ' <span class="chip bad">' + word[x.kind] + '</span>').join('') + '</td>' + roles.map((r) => { const l = raciOf(c, s.id)[r] || ''; return '<td>' + (ed ? '<button type="button" class="rc ' + (l || 'empty') + '" data-act="cyc" data-step="' + s.id + '" data-role="' + r + '" aria-label="' + esc(roleName(r)) + ' on ' + esc(s.label) + ': ' + (l || 'none') + '">' + l + '</button>' : '<span class="rc ' + (l || 'empty') + '">' + l + '</span>') + '</td>'; }).join('') + '</tr>'; }).join('') +
    '</tbody></table></div><p class="note" style="margin-top:8px">One A per step. ' + (ed ? 'Click a cell to change it: none, R, A, C, I. Add a role from a step’s form on Map.' : 'Start a draft to change it.') + '</p>';
}

/* ── Authority ── */
function bAuth(p, c, ed) {
  return '<div class="box tw"><table class="t"><thead><tr><th><span>Step</span></th><th><span>Kind</span></th><th><span>Rule</span></th>' + (ed ? '<th><span><span class="sr">Remove</span></span></th>' : '') + '</tr></thead><tbody>' +
    c.auth.map((x, i) => '<tr><td>' + stepNo(c, x.step) + ' · ' + esc((stepById(c, x.step) || {}).label) + '</td><td>' + (x.kind === 'money' ? 'Approval by amount' : 'Time limit') + '</td><td>' + esc(ruleText(x)) + '</td>' + (ed ? '<td><button class="xdel" type="button" data-act="ruleDel" data-i="' + i + '" aria-label="Remove this rule">×</button></td>' : '') + '</tr>').join('') +
    '</tbody></table>' + (c.auth.length ? '' : '<p class="empty">No rules yet.</p>') + '</div>' + (ed ? '<div class="row3"><button class="btn" type="button" data-act="ruleNew" data-step="">+ Add a rule</button></div>' : '');
}

/* ── Risks & controls ── */
function bRisks(p, c, ed) {
  const lv = [['High', 'High'], ['Medium', 'Medium'], ['Low', 'Low']];
  return '<div class="box tw"><table class="t"><thead><tr><th><span>Step</span></th><th><span>Risk</span></th><th><span>Level</span></th><th><span>Control</span></th><th><span>Last test</span></th>' + (ed ? '<th><span><span class="sr">Remove</span></span></th>' : '') + '</tr></thead><tbody>' +
    c.controls.map((k, i) => '<tr><td>' + stepNo(c, k.step) + ' · ' + esc((stepById(c, k.step) || {}).label) + '</td><td>' + esc(k.risk) + '</td><td>' + (ed ? selD('data-chg="kLvl" data-i="' + i + '" aria-label="Level"', lv, k.level) : pill(k.level === 'High' ? 'bad' : k.level === 'Medium' ? 'attn' : 'q', k.level)) + '</td><td>' + (ed ? '<input data-chg="kCtl" data-i="' + i + '" value="' + esc(k.control) + '" placeholder="No control yet" aria-label="Control">' : k.control ? esc(k.control) : '<span class="ctl bad">None yet</span>') + '</td><td>' + (!k.control ? pill('bad', 'No control') : pill(k.test === 'pass' ? 'good' : k.test === 'fail' ? 'bad' : 'q', k.test === 'pass' ? 'Passed · ' + fmt(k.testedAt) : k.test === 'fail' ? 'Failed · ' + fmt(k.testedAt) : 'Not tested')) + '</td>' + (ed ? '<td><button class="xdel" type="button" data-act="ctlDel" data-i="' + i + '" aria-label="Remove this risk">×</button></td>' : '') + '</tr>').join('') +
    '</tbody></table>' + (c.controls.length ? '' : '<p class="empty">No risks recorded yet.</p>') + '</div>' + (ed ? '<div class="row3"><button class="btn" type="button" data-act="ctlNew" data-step="">+ Add a risk and its control</button></div>' : '');
}
CHG.kLvl = (el) => edit((c) => { c.controls[Number(el.dataset.i)].level = el.value; });
ACT.ctlDel = (el) => edit((c) => { c.controls.splice(Number(el.dataset.i), 1); }, 'Removed.');

/* ── Quality ── */
function bQuality(p, c, ed) {
  const ncs = p.ncs || [];
  return '<div class="sect" style="margin-top:0"><span class="lbl">Measures</span></div><div class="box tw"><table class="t"><thead><tr><th><span>Measure</span></th><th><span>Target</span></th><th><span>How often</span></th>' + (ed ? '<th><span><span class="sr">Remove</span></span></th>' : '') + '</tr></thead><tbody>' +
    c.kpis.map((k, i) => '<tr>' + k.map((v, f) => '<td>' + (ed ? '<input data-chg="kpi" data-i="' + i + '" data-f="' + f + '" value="' + esc(v) + '" aria-label="' + ['Measure', 'Target', 'How often'][f] + '">' : esc(v)) + '</td>').join('') + (ed ? '<td><button class="xdel" type="button" data-act="kpiDel" data-i="' + i + '" aria-label="Remove this measure">×</button></td>' : '') + '</tr>').join('') +
    '</tbody></table>' + (c.kpis.length ? '' : '<p class="empty">No measures yet.</p>') + '</div>' + (ed ? '<div class="row3"><button class="btn" type="button" data-act="kpiAdd">+ Add a measure</button></div>' : '') +
    '<div class="sect"><span class="lbl">Non-conformances</span><span class="note">raised on this process, from the client’s register</span></div>' +
    (ncs.length ? '<div class="box tw"><table class="t"><thead><tr><th><span>Ref</span></th><th><span>What happened</span></th><th><span>Action</span></th><th><span>Owner</span></th><th><span>Raised</span></th><th><span>Status</span></th></tr></thead><tbody>' + ncs.map((n) => '<tr><td><span class="code">' + n.ref + '</span></td><td>' + esc(n.title) + '</td><td>' + esc(n.action) + '</td><td>' + esc(n.owner) + '</td><td>' + fmt(n.raised) + '</td><td>' + pill(n.status === 'Closed' ? 'good' : 'attn', n.status) + '</td></tr>').join('') + '</tbody></table></div>' : '<div class="ph"><b>None raised</b>Non-conformances raised against this process show here.</div>');
}
CHG.kpi = (el) => edit((c) => { c.kpis[Number(el.dataset.i)][Number(el.dataset.f)] = el.value.trim(); });
ACT.kpiAdd = () => edit((c) => { c.kpis.push(['New measure', 'Set a target', 'Monthly']); }, 'Measure added. Name it and set its target.');
ACT.kpiDel = (el) => edit((c) => { c.kpis.splice(Number(el.dataset.i), 1); }, 'Removed.');

/* ── Lifecycle ── */
function bLife(p, c) {
  const d = p.draft, rd = readersOf(p), st8 = d ? d.state : 'live';
  const at = { draft: 0, returned: 0, 'in-review': 1, approved: 2, live: 3 }[st8];
  const life = '<div class="life">' + ['Drawing', 'With the approver', 'Approved', 'In force'].map((l, i) => '<span class="' + (i < at ? 'done' : i === at ? 'now' : '') + '">' + l + (i === 0 && d && d.state === 'returned' ? ' · sent back' : '') + '</span>').join('') + '</div>';
  const ppl = S.people.filter((x) => !x.office);
  return life + '<div class="two2"><div class="blk"><span class="lbl">This process</span><dl class="dl"><dt>In force</dt><dd>' + (p.live ? 'v' + p.inForce + ' since ' + fmt(p.publishedAt) : 'Not yet') + '</dd><dt>Draft</dt><dd>' + (d ? 'v' + d.v + ' · ' + DSTATE[d.state][1].toLowerCase() : 'None open') + '</dd><dt>Owner</dt><dd>' + esc(person(p.owner).name) + '</dd><dt>Approver</dt><dd>' + selD('data-chg="approver" aria-label="Approver"' + (d && d.state === 'in-review' ? ' disabled' : ''), ppl.map((x) => [x.id, x.name + ' · ' + roleName(x.roles[0])]), p.approver) + '</dd><dt>Next review</dt><dd>' + (p.nextReview ? fmt(p.nextReview) + (reviewDays(p) < 0 ? ' <span class="chip bad">Late</span>' : '') : 'Set when it is published') + '</dd>' + (p.live ? '<dt>Read by</dt><dd>' + rd.filter((x) => p.acks.includes(x)).length + ' of ' + rd.length + ' with a step</dd>' : '') + '</dl><div class="row3">' + nextAct(p, 'btn gold') + '</div></div>' +
    '<div class="blk"><span class="lbl">Versions</span>' + (p.versions.length ? '<div class="tw"><table class="t"><thead><tr><th><span>Version</span></th><th><span>Published</span></th><th><span>Approved by</span></th><th><span>What changed</span></th></tr></thead><tbody>' + p.versions.map((v) => '<tr><td>v' + v.v + (v.v === p.inForce ? ' <span class="chip gold">In force</span>' : '') + '</td><td>' + fmt(v.date) + '</td><td>' + esc(v.by) + '</td><td>' + esc(v.note) + '</td></tr>').join('') + '</tbody></table></div>' : '<p class="note">No version published yet.</p>') + '</div></div>';
}
CHG.approver = (el) => { const p = bp(); p.approver = el.value; log('Mona Farag made ' + person(el.value).name + ' the approver of ' + p.name); render(); toast(person(el.value).name + ' approves ' + p.name + ' from now on.'); };

/* ── Check with AI ── */
function bAi(p, c, ed) {
  const f = aiFindings(p, c);
  if (!tasks(c).length) return notDrawn(p);
  const why = ed ? '' : p.draft ? 'It is with the approver: take it back to apply a suggestion.' : 'This is the version in force: start draft v' + (p.inForce + 1) + ' to apply a suggestion.';
  return '<div class="box" style="padding:4px 16px">' + (f.length ? f.map((x, i) => '<div class="aif"><b>' + (x.step ? 'Step ' + stepNo(c, x.step) + ' · ' + esc(stepById(c, x.step).label) : 'The whole process') + '</b><span>' + esc(x.text) + '</span><span class="note">' + esc(x.why) + '</span><div class="row3" style="margin-top:2px"><button class="btn" type="button" data-act="aiApply" data-i="' + i + '"' + (ed ? '' : ' disabled') + '>' + esc(x.btn) + '</button>' + (x.step ? '<button class="lnk" type="button" data-act="aiShow" data-step="' + x.step + '">Show it on the map</button>' : '') + '</div></div>').join('') : '<div class="aif"><b>Nothing found</b><span>Every step has a role and one accountable, every risk has a control, and every decision has two ways out.</span></div>') + '</div>' +
    '<p class="note" style="margin-top:8px">' + (why ? esc(why) + ' ' : '') + 'Reads ' + (p.draft ? 'draft v' + p.draft.v : 'v' + p.inForce) + ' as it stands now. A sample: in the product the suggestions come from AI and say where they come from.</p>';
}
ACT.aiApply = (el) => {
  const p = bp(), f = aiFindings(p, bContent(p))[Number(el.dataset.i)]; if (!f) return;
  if (f.add) { edit((c) => f.fn(c)); go('mona.b.' + p.code + '.map'); toast('Proposed on the map, in gold. Confirm makes it a step; Delete takes it away.'); return; }
  edit((c) => { f.fn(c); if (f.step) touch(p, stepById(c, f.step)); }, 'Done: ' + f.btn.charAt(0).toLowerCase() + f.btn.slice(1) + '. Undo on Map takes it back.');
};
ACT.propOk = (el) => edit((c) => { const s = stepById(c, el.dataset.step); delete s.proposed; delete s.why; }, 'Confirmed. It is a step now; fill it in.');
ACT.propDel = (el) => edit((c) => { c.steps = c.steps.filter((s) => s.id !== el.dataset.step); c.conn = c.conn.filter((e) => e[0] !== el.dataset.step && e[1] !== el.dataset.step); UI.sel = null; }, 'Deleted. Nothing was changed.');
ACT.aiShow = (el) => { UI.sel = el.dataset.step; go('mona.b.' + UI.args[0] + '.map'); };

/* ── the band's actions ── */
ACT.bStart = () => { const p = bp(), d = startDraft(p); render(); toast('Draft v' + d.v + ' is open. Readers keep ' + (p.live ? 'v' + p.inForce : 'nothing') + ' until it is published.'); };
ACT.sendAppr = () => {
  const p = bp(), d = p.draft, g = gapsOf(d.c), who = person(p.approver).name;
  if (!tasks(d.c).length) { toast('Draw at least one step first.'); return; }
  const prop = d.c.steps.find((s) => s.proposed); if (prop) { UI.sel = prop.id; go('mona.b.' + p.code + '.map'); toast('Confirm or delete the proposed step first.'); return; }
  dialog({ title: 'Send v' + d.v + ' for approval', sub: 'It goes to ' + esc(who) + ', who approves ' + esc(p.name) + ', and lands in their To do.', body: (g.length ? '<p class="ctl bad">' + plural(g.length, 'gap is', 'gaps are') + ' still open. You can send it anyway: ' + esc(who) + ' sees them in the Summary.</p>' : '<p class="ctl">No gaps.</p>') + fld('A note for ' + esc(who), '<textarea id="sa-note">' + esc(d.note || '') + '</textarea>'), foot: foot2('sendApprGo', 'Send to ' + esc(who)) });
};
ACT.sendApprGo = () => {
  const p = bp(), d = p.draft, who = person(p.approver).name, k = lookFor(p.approver);
  d.state = 'in-review'; d.sentAt = TODAY; d.sentBy = 'Mona Farag'; d.note = val('sa-note') || d.note;
  log('Mona Farag sent ' + p.name + ' v' + d.v + ' to ' + who + ' for approval');
  closeLayer(); render(); toast('Sent to ' + who + '.' + (k ? ' Look as ' + who.split(' ')[0] + ' to approve it.' : ''));
};
ACT.takeBack = () => { const p = bp(); p.draft.state = 'draft'; log('Mona Farag took ' + p.name + ' v' + p.draft.v + ' back to edit'); render(); toast('Taken back. It is a draft again; send it once you are done.'); };
ACT.exit = () => {
  const p = bp(), back = UI.from || 'mona.all';
  const where = /\.p\./.test(back) ? 'the process page' : /\.handle/.test(back) ? 'To handle' : /^mona\.all/.test(back) ? 'All processes' : 'where you were';
  go(back); toast((editable(p) ? 'Saved. Draft v' + p.draft.v + ' waits in the builder. ' : '') + 'Back on ' + where + '.');
};

/* ── Preview as manager: the draft exactly as the owner will read it ── */
R.preview = (args) => {
  const p = byCode(args[0]); if (!p || !isOffice()) return R[home(UI.as)]([]);
  const c = bContent(p); if (!c) return R.b([p.code]);
  const d = p.draft, tab = ['flow', 'steps', 'summary'].includes(args[1]) ? args[1] : window.innerWidth < 640 ? 'steps' : 'flow';
  const owner = person(p.owner), noCtl = c.controls.filter((k) => !k.control).length, changes = d && p.live ? d.v : 0;
  const strip = '<div class="strip"><b>Preview</b><span>' + (d ? 'Draft v' + d.v : 'Version ' + p.inForce) + ' as ' + esc(owner.name) + ', the owner, will read it' + (d ? ' once it is published' : '') + '. Buttons show what they will see, and do nothing here.</span><span class="acts"><button class="btn gold" type="button" data-go="mona.b.' + p.code + '.' + (UI.bsec || 'map') + '">Back to the builder</button></span></div>';
  const inert = (l, gold) => '<button class="' + (gold ? 'bgold' : 'bq') + '" type="button" data-act="toast" data-msg="In the preview this does nothing. ' + esc(owner.name) + ' will have it.">' + l + '</button>';
  const band = mast({ eyebrow: 'Raya Trade · Processes › ' + p.code + ' · ' + esc(p.cat), title: esc(p.name) + ' ' + (d ? pill('attn', 'Draft v' + d.v + ' · preview') : pill('good', 'In force · v' + p.inForce)) + '<span class="own">You own this</span>',
    sub: (c.purpose ? esc(c.purpose.split(',')[0]) + ' · ' : '') + 'Owner <b>' + esc(owner.name) + '</b> · Approver <b>' + esc(person(p.approver).name) + '</b>', acts: inert('Download SOP') + inert('Print') + inert('Suggest a change', true),
    tiles: tiles([[tasks(c).length, 'Steps'], [new Set(tasks(c).map((s) => s.role)).size, 'Roles'], [noCtl, 'Risk, no control', noCtl ? 'late' : '']]) });
  const tabs = tabBar([['flow', 'Flow', '', '', 'mona.preview.' + p.code + '.flow'], ['steps', 'Steps', tasks(c).length, '', 'mona.preview.' + p.code + '.steps'], ['summary', 'Summary', '', '', 'mona.preview.' + p.code + '.summary']], tab);
  let body;
  if (tab === 'flow') { const s0 = UI.sel && tasks(c).some((s) => s.id === UI.sel) ? UI.sel : (tasks(c)[0] || {}).id; body = '<p class="note" style="margin-bottom:10px">Lanes are roles. Click a step for its detail.</p><div class="agrid">' + flowHtml(c, p, { sel: s0, changes }) + '<aside class="box drawer">' + stepRead(c, s0) + '</aside></div>'; }
  else if (tab === 'steps') body = '<div class="box">' + tasks(c).map((s, i) => stepCard(c, s, i + 1, { changes, mine: owner.roles })).join('') + '</div>';
  else body = summaryHtml(p, c, { mode: 'draft' }, []).split('data-go="mona.p.' + p.code).join('data-go="mona.preview.' + p.code);
  return page(strip + band + tabs + body);
};
