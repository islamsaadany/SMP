/* ══ RULES ══════════════════════════════════════════════════════════════
   The module's own rules, restated for the drawing so every screen agrees:
   the six readiness marks, the six step gaps, who acknowledges, the score,
   the code. Pure functions over S; no DOM here. */
const roleById = (id) => S.roles.find((r) => r.id === id);
const roleName = (id) => (roleById(id) || { name: 'Unassigned' }).name;
const personById = (id) => S.people.find((p) => p.id === id);
const personName = (id) => (personById(id) || { name: '' }).name;
const liveRoles = () => S.roles.filter((r) => !r.archived);
const livePeople = () => S.people.filter((p) => !p.archived);
const procs = () => S.processes.filter((p) => !p.deleted);
const byCode = (code) => S.processes.find((p) => p.code === code);
const mains = () => procs().filter((p) => !p.parent || !byCode(p.parent) || byCode(p.parent).deleted).sort((a, b) => a.code.localeCompare(b.code));
const subsOf = (code) => procs().filter((p) => p.parent === code).sort((a, b) => a.code.localeCompare(b.code));
const stepById = (p, id) => p.steps.find((s) => s.id === id);
const workSteps = (p) => p.steps.filter((s) => s.type === 'TASK' || s.type === 'DECISION');
const stepNo = (p, id) => p.steps.findIndex((s) => s.id === id) + 1;

const STATUS = { DRAFT: 'Draft', IN_REVIEW: 'In review', APPROVED: 'Approved', PUBLISHED: 'Published', RETIRED: 'Retired' };
const DEC = { W1: 'Wave 1', W2: 'Wave 2', LATER: 'Later', HIGH: 'Stays high-level' };
const isDeep = (p) => p.prio.dec === 'W1' || p.prio.dec === 'W2';
const inForce = (p) => p.versions.filter((v) => v.published).sort((a, b) => b.n - a.n)[0] || null;
const latestVersion = (p) => p.versions.slice().sort((a, b) => b.n - a.n)[0] || null;
const overdue = (p) => p.status === 'PUBLISHED' && p.nextReview && daysFrom(p.nextReview) < 0;
function statusPill(p) {
  if (overdue(p)) return '<span class="pill bad">Review overdue</span>';
  const v = latestVersion(p), tone = { PUBLISHED: 'good', APPROVED: 'good', IN_REVIEW: 'attn', RETIRED: '', DRAFT: '' }[p.status];
  return '<span class="pill ' + tone + '">' + STATUS[p.status] + (v && p.status !== 'DRAFT' ? ' · v' + (p.status === 'IN_REVIEW' ? v.n + 1 : v.n) : '') + '</span>';
}

/* the six marks, read off the process; nobody ticks them */
function marks(p) {
  return [
    { label: 'Map', done: workSteps(p).length + p.steps.filter((s) => s.type !== 'TASK' && s.type !== 'DECISION').length >= 3, tab: 'map' },
    { label: 'RACI', done: p.raci.final, tab: 'raci' },
    { label: 'Authority', done: p.auth.rules.length > 0, tab: 'authority' },
    { label: 'Controls', done: p.controls.length > 0, tab: 'risks' },
    { label: 'SOP', done: !!(p.doc.version && p.doc.version.trim()), tab: 'lifecycle' },
    { label: 'Approved', done: p.status === 'APPROVED' || p.status === 'PUBLISHED', tab: 'lifecycle' },
  ];
}
const marksDone = (p) => marks(p).filter((m) => m.done).length;
function nextMissing(p) {
  const m = marks(p).find((x) => !x.done);
  if (!m) return null;
  return { Map: ['map', 'map at least three steps'], RACI: ['raci', 'finish the RACI and mark it final'], Authority: ['authority', 'set who approves and when work escalates'], Controls: ['risks', 'record a risk and its control'], SOP: ['lifecycle', 'record the SOP version and effective date'], Approved: ['lifecycle', p.status === 'IN_REVIEW' ? 'wait for ' + personName(p.approver) + ' to approve' : 'send it for review and approval'] }[m.label];
}
function marksHtml(p, withNum) {
  if (!OPT.marksAll && !isDeep(p)) return '<span class="q">High-level</span>';
  if (!p.steps.length) return '<span class="q">Not mapped</span>';
  return '<span class="marks" title="' + marks(p).map((m) => m.label + (m.done ? ' ✓' : '')).join(' · ') + '">' + marks(p).map((m) => '<i' + (m.done ? ' class="on"' : '') + '></i>').join('') + (withNum !== false ? '<b>' + marksDone(p) + '/6</b>' : '') + '</span>';
}

/* RACI */
const raciKey = (rowId, roleId) => rowId + '|' + roleId;
function raciRows(p) {
  const rows = workSteps(p).filter((s) => !p.raci.acts.some((a) => a.step === s.id)).map((s) => ({ id: s.id, label: s.label, type: s.type, step: s.id, act: false }));
  p.raci.acts.forEach((a) => rows.push({ id: a.id, label: a.name, type: 'ACTIVITY', step: a.step, act: true }));
  return rows;
}
function raciRowIssue(p, rowId) {
  if (p.raci.skip.indexOf(rowId) >= 0) return null;
  const letters = Object.keys(p.raci.cells).filter((k) => k.indexOf(rowId + '|') === 0).map((k) => p.raci.cells[k]);
  const a = letters.filter((l) => l === 'A').length, r = letters.filter((l) => l === 'R').length;
  if (a === 0) return 'no accountable';
  if (a > 1) return 'two accountables';
  if (r === 0) return 'no responsible';
  return null;
}
const raciIssues = (p) => raciRows(p).map((r) => ({ row: r, issue: raciRowIssue(p, r.id) })).filter((x) => x.issue);
function raciCols(p) {
  const used = new Set();
  Object.keys(p.raci.cells).forEach((k) => { if (p.raci.cells[k]) used.add(k.split('|')[1]); });
  p.steps.forEach((s) => { if (s.role) used.add(s.role); (s.support || []).forEach((r) => used.add(r)); });
  p.raci.pinned.forEach((r) => used.add(r));
  const ids = liveRoles().map((r) => r.id).filter((id) => used.has(id));
  return ids.length ? ids : liveRoles().map((r) => r.id);
}

/* authority */
const DIR = { gt: 'More than', gte: 'At or above', lt: 'Below', lte: 'At or below', none: 'No rule at all' };
const whoName = (w) => (!w ? '' : w.type === 'role' ? roleName(w.id) : personName(w.id));
function ruleDone(r) { return r.dir === 'none' || (r.value !== '' && r.value != null && !!r.who); }
function ruleSentence(r) {
  if (r.dir === 'none') return 'No approval required — this step proceeds on its own.';
  const v = r.on === 'money' ? money(r.value || 0) : plural(Number(r.value || 0), 'day');
  if (r.then === 'approval') return r.who ? DIR[r.dir] + ' ' + v + ' needs approval from ' + whoName(r.who) + '.' : 'Needs approval, but nobody is assigned.';
  return r.who ? DIR[r.dir] + ' ' + v + ' without a decision escalates to ' + whoName(r.who) + '.' : 'Escalates, but nobody is assigned.';
}
const rulesFor = (p, sid) => p.auth.rules.filter((r) => r.step === sid);
function slaDays(p, sid) { const r = rulesFor(p, sid).find((x) => x.on === 'time' && x.dir !== 'none'); return r ? Number(r.value) : null; }
function gateLine(p, sid) { const r = rulesFor(p, sid).find((x) => x.on === 'money' && x.dir !== 'none'); return r ? DIR[r.dir] + ' ' + money(r.value) : ''; }

/* the six step gaps, the same words the Steps list uses */
function stepGaps(p, s) {
  if (s.type !== 'TASK' && s.type !== 'DECISION') return [];
  const g = [];
  const incoming = p.conn.some((c) => c.to === s.id) || p.ext.some((x) => x.step === s.id);
  if (!incoming && p.steps[0] !== s) g.push('no predecessor');
  const ri = raciRowIssue(p, s.id);
  if (ri && !p.raci.acts.some((a) => a.step === s.id)) g.push(ri);
  const rs = rulesFor(p, s.id);
  if (!rs.length && p.auth.skip.indexOf(s.id) < 0) g.push('no approver');
  if (rs.some((r) => !ruleDone(r))) g.push('an unfinished rule');
  return g;
}
const GAP_SENTENCE = {
  'no predecessor': 'Nothing connects into this step — say which step comes before it.',
  'no accountable': 'No role is accountable for this step — assign an A in the RACI Matrix.',
  'two accountables': 'Two roles are accountable — keep one A in the RACI Matrix.',
  'no responsible': 'Nobody is responsible — assign an R in the RACI Matrix.',
  'no approver': 'No authority rule — add one, or mark the task as needing no approval.',
  'an unfinished rule': 'A rule has no figure or nobody to carry it.',
};

/* who is asked to read and confirm: people holding a role a step is given to */
function expectedReaders(p) {
  const roles = new Set(p.steps.map((s) => s.role).filter(Boolean));
  return livePeople().filter((x) => x.reg && x.roles.some((r) => roles.has(r)));
}

/* the score out of 100 and the rank */
function score(p) {
  const s = p.prio, w = S.plan.weights;
  if (!s.imp || !s.cx || !s.risk) return null;
  const tot = w.imp + w.risk + w.cx;
  if (!tot) return null;
  return Math.round(((s.imp * w.imp + s.risk * w.risk + s.cx * w.cx) / tot) * 20);
}
function ranked() {
  const list = procs().map((p) => ({ p, score: score(p) }));
  list.sort((a, b) => {
    if (a.score == null && b.score == null) return a.p.code.localeCompare(b.p.code);
    if (a.score == null) return 1; if (b.score == null) return -1;
    return b.score - a.score || (b.p.prio.risk - a.p.prio.risk) || (b.p.prio.imp - a.p.prio.imp) || a.p.code.localeCompare(b.p.code);
  });
  let n = 0;
  return list.map((x) => Object.assign(x, { rank: x.score == null ? null : ++n }));
}
const rankOf = (p) => (ranked().find((x) => x.p === p) || {}).rank || null;
function suggestCx(p) {
  if (!p.steps.length) return null;
  const dec = p.steps.filter((s) => s.type === 'DECISION').length, ho = p.steps.reduce((n, s) => n + s.links.length, 0) + p.ext.length, roles = new Set(p.steps.map((s) => s.role).filter(Boolean)).size, n = p.steps.length;
  const v = Math.max(1, Math.min(5, Math.round(n / 3 + dec + ho / 2 + roles / 3 - 1)));
  return { v, why: plural(n, 'step') + ', ' + plural(dec, 'decision') + ', ' + plural(ho, 'hand-over') + ', ' + plural(roles, 'role') };
}
function suggestRisk(p) {
  if (!p.controls.length) return null;
  const hi = p.controls.filter((c) => c.level === 'High').length, md = p.controls.filter((c) => c.level === 'Medium').length;
  return { v: hi >= 2 ? 5 : hi === 1 ? 4 : md ? 3 : 2, why: plural(p.controls.length, 'risk') + ' logged, ' + hi + ' high' };
}

/* the code: first three letters of the name, then the next number from 100 */
function nextCode(name, parentCode) {
  let prefix;
  if (parentCode) prefix = parentCode.replace(/\d+$/, '');
  else { const w = (name.trim().split(/\s+/)[0] || 'NEW').replace(/[^A-Za-z]/g, '').toUpperCase(); prefix = (w + 'XXX').slice(0, 3); }
  const used = S.processes.filter((p) => p.code.replace(/\d+$/, '') === prefix).map((p) => Number(p.code.slice(prefix.length)) || 0);
  return prefix + (used.length ? Math.max.apply(null, used) + 1 : 100);
}

/* the swimlane layout: a lane per role, a column per depth of the flow */
function layout(p) {
  const lanes = [];
  p.steps.forEach((s) => { const k = s.role || '_'; if (lanes.indexOf(k) < 0) lanes.push(k); });
  const depth = {}, order = p.steps.map((s) => s.id);
  order.forEach((id) => { depth[id] = 0; });
  for (let pass = 0; pass < order.length; pass++) {
    p.conn.forEach((c) => {
      if (order.indexOf(c.from) < 0 || order.indexOf(c.to) < 0) return;
      if (order.indexOf(c.to) <= order.indexOf(c.from)) return;   // a loop back is drawn, not laid out
      if (depth[c.to] < depth[c.from] + 1) depth[c.to] = depth[c.from] + 1;
    });
  }
  const taken = {}, pos = {};
  order.forEach((id) => {
    const s = stepById(p, id), lane = lanes.indexOf(s.role || '_');
    let col = depth[id];
    while (taken[lane + ':' + col]) col++;
    taken[lane + ':' + col] = 1; pos[id] = { lane, col };
  });
  const cols = Math.max(1, ...Object.values(pos).map((x) => x.col + 1));
  return { lanes, pos, cols };
}

/* what deleting would take out of view */
function deleteImpact(p) {
  const cellsN = Object.keys(p.raci.cells).filter((k) => p.raci.cells[k]).length;
  const parts = [[p.steps.length, 'step'], [cellsN, 'RACI assignment'], [p.auth.rules.length, 'authority rule'], [p.kpis.length, 'KPI']].filter((x) => x[0]).map((x) => plural(x[0], x[1]));
  const orphans = subsOf(p.code).length, branchers = procs().filter((x) => x.branchFrom && x.branchFrom.code === p.code).length;
  return { parts, orphans, branchers };
}
function log(type, name, what) { S.gov.activity.unshift([todayIso() + ' ' + new Date().toTimeString().slice(0, 5), type, name, what, 'Strategy Office']); }
