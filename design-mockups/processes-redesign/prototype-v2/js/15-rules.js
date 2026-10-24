/* ══ RULES ═════════════════════════════════════════════════════════════
   Everything the screens read is worked out here from the data: what a
   process looks like in force or in draft, its gaps and marks, its state,
   what waits on each person and what waits on the office. */
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmt = (iso) => { if (!iso) return '—'; const d = new Date(iso + 'T00:00:00'); return d.getDate() + ' ' + MON[d.getMonth()] + (d.getFullYear() !== 2026 ? ' ' + d.getFullYear() : ''); };
const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 864e5);
const plusYear = (iso) => { const d = new Date(iso + 'T00:00:00'); d.setFullYear(d.getFullYear() + 1); return d.toISOString().slice(0, 10); };
const money = (n) => '$' + n.toLocaleString('en-US');
const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many || one + 's');

const person = (id) => S.people.find((p) => p.id === id) || { id, name: 'No one', roles: [] };
const roleName = (id) => (S.roles.find((r) => r.id === id) || { name: '—' }).name;
const meId = () => AS[UI.as];
const me = () => person(meId());
const isOffice = () => UI.as === 'mona';
const procs = () => S.processes;
const byCode = (c) => S.processes.find((p) => p.code === c);
const nameOf = (c) => (byCode(c) || { name: c }).name;

/* the version a person reads, the draft the office edits, and whatever exists at all */
const live = (p) => p.live;
const draftC = (p) => (p.draft ? p.draft.c : null);
const anyC = (p) => p.live || draftC(p);
const tasks = (c) => (c ? c.steps.filter((s) => s.type === 'TASK' || s.type === 'DECISION') : []);
const stepById = (c, id) => (c ? c.steps.find((s) => s.id === id) : null);
const stepNo = (c, id) => tasks(c).findIndex((s) => s.id === id) + 1;
const raciOf = (c, sid) => (c.raci[sid] || {});
const rulesOf = (c, sid) => c.auth.filter((r) => r.step === sid);
const ruleText = (r) => (r.kind === 'money' ? 'At or above ' + money(r.n) + ' the ' + roleName(r.role) + ' approves' : 'After ' + plural(r.n, 'day') + ' it goes to the ' + roleName(r.role));
const apprOf = (c, sid) => rulesOf(c, sid).filter((r) => r.kind === 'money').map(ruleText).join('; ');
const timeOf = (c, sid) => rulesOf(c, sid).filter((r) => r.kind === 'time').map(ruleText).join('; ');
const controlsOf = (c, sid) => c.controls.filter((k) => k.step === sid);

function gapsOf(c) {
  if (!c) return [];
  const g = [];
  tasks(c).forEach((s) => {
    const l = Object.values(raciOf(c, s.id)), a = l.filter((x) => x === 'A').length;
    if (!a) g.push({ step: s.id, kind: 'noA', text: 'No one is accountable for this step' });
    else if (a > 1) g.push({ step: s.id, kind: 'twoA', text: 'Two people are accountable for this step' });
    /* the role in the lane does the work; when it is also the accountable one, that counts */
    if (!l.includes('R') && raciOf(c, s.id)[s.role] !== 'A') g.push({ step: s.id, kind: 'noR', text: 'No one is named to do this step' });
  });
  c.controls.forEach((k) => { if (!k.control) g.push({ step: k.step, kind: 'noControl', text: '“' + k.risk + '” has no control' }); });
  return g;
}
/* the six readiness marks: Map, RACI, Authority, Controls, SOP, Approved */
function marksOf(p) {
  const c = anyC(p);
  if (!c) return [0, 0, 0, 0, 0, 0];
  const g = gapsOf(c);
  return [tasks(c).length >= 3 ? 1 : 0, tasks(c).length && !g.some((x) => x.kind !== 'noControl') ? 1 : 0, c.auth.length ? 1 : 0, c.controls.some((k) => k.control) ? 1 : 0, p.live && p.sop ? 1 : 0, p.live || (p.draft && p.draft.state === 'approved') ? 1 : 0];
}
const reviewDays = (p) => (p.nextReview ? daysBetween(TODAY, p.nextReview) : 9999);
function stateOf(p) {
  const d = p.draft;
  if (!anyC(p) || !tasks(anyC(p)).length) return { label: 'Not started', pill: 'q', rank: 6 };
  if (d && d.state === 'returned') return { label: 'Returned by the approver', pill: 'bad', rank: 1 };
  if (d && d.state === 'approved') return { label: 'Approved, ready to publish', pill: 'attn', rank: 2 };
  if (p.live && reviewDays(p) < 0) return { label: 'Review late', pill: 'bad', rank: 2 };
  if (d && d.state === 'in-review') return { label: 'Waiting for approval', pill: 'attn', rank: 3 };
  if (p.live) return { label: 'In force · v' + p.inForce + (d ? ' · draft v' + d.v + ' open' : ''), pill: 'good', rank: d ? 4 : 7 };
  return { label: 'Being drawn', pill: 'q', rank: 5 };
}
/* who has a step: everyone whose role does one of the steps in force */
function readersOf(p) {
  const c = p.live; if (!c) return [];
  const rs = new Set(tasks(c).map((s) => s.role));
  return S.people.filter((x) => !x.office && x.roles.some((r) => rs.has(r))).map((x) => x.id);
}
const myStepsIn = (c, pid) => (c ? tasks(c).filter((s) => person(pid).roles.includes(s.role)) : []);
const changedSteps = (c) => tasks(c).filter((s) => s.changed);
const log = (text) => S.log.unshift([fmt(TODAY), text]);
const doneFor = (pid, text) => { (S.done[pid] = S.done[pid] || []).unshift(text + ' · ' + fmt(TODAY)); };

/* what waits on a person, on the reading side */
function todoFor(pid) {
  const out = [];
  procs().forEach((p) => {
    const d = p.draft;
    if (p.approver === pid && d && d.state === 'in-review') out.push({ kind: 'Approve', code: p.code, what: 'Version ' + d.v + ' is ready for your approval', meta: 'Sent by ' + (d.sentBy || 'the Strategy Office') + ' on ' + fmt(d.sentAt) + (d.note ? ' · ' + d.note : ''), why: 'You approve this process.', act: 'Open and approve', go: [UI.as, 'p', p.code, 'flow'].join('.') });
    if (p.owner === pid && p.live && reviewDays(p) <= 30) out.push({ kind: 'Review', code: p.code, what: reviewDays(p) < 0 ? 'The yearly review was due on ' + fmt(p.nextReview) : 'The yearly review is due on ' + fmt(p.nextReview), meta: 'Say whether it still describes how the work is done', why: 'You own it.', act: 'Review it', go: [UI.as, 'p', p.code, 'summary'].join('.') });
    if (p.live && readersOf(p).includes(pid) && !p.acks.includes(pid)) {
      const ch = changedSteps(p.live).filter((s) => person(pid).roles.includes(s.role));
      out.push({ kind: 'Read', code: p.code, what: 'Version ' + p.inForce + ' is in force since ' + fmt(p.publishedAt), meta: ch.length ? 'Your step changed: ' + ch.map((s) => s.label).join(', ') : 'Your step: ' + myStepsIn(p.live, pid).map((s) => s.label).join(', '), why: 'You have a step in it.', act: 'Read it', go: [UI.as, 'p', p.code, 'steps'].join('.') });
    }
  });
  S.suggestions.filter((s) => s.by === pid && s.state === 'answered').forEach((s) => {
    const c = anyC(byCode(s.code)), stp = stepById(c, s.step);
    out.push({ kind: 'Answer', code: s.code, what: 'The office answered your suggestion' + (stp ? ' on step ' + stepNo(c, s.step) + ', ' + stp.label : ''), meta: person(s.answer.by).name + ', Strategy Office · ' + fmt(s.answer.at), quote: s.answer.text, why: 'You suggested a change.', act: 'Reply', actName: 'reply', id: s.id });
  });
  if (S.plan.state === 'sent' && S.plan.approver === pid) out.push({ kind: 'Approve', code: 'PLAN', name: 'Deep-dive plan', what: 'The Strategy Office sent the plan for your sign-off', meta: 'Which processes the office takes deep first, and in what order', why: 'You sign off the plan.', act: 'Open the plan', actName: 'planOpen' });
  return out;
}
/* what waits on the office, in the builder */
function handleFor() {
  const out = [];
  S.suggestions.filter((s) => s.state === 'new' || s.state === 'replied').forEach((s) => out.push({ kind: s.state === 'new' ? 'Suggestion' : 'Reply', s }));
  procs().forEach((p) => {
    if (p.draft && p.draft.state === 'returned') out.push({ kind: 'Returned', p });
    if (p.draft && p.draft.state === 'approved') out.push({ kind: 'Approved', p });
  });
  if (S.plan.state === 'returned') out.push({ kind: 'Plan' });
  const drawnGaps = procs().filter((p) => !p.live && anyC(p) && gapsOf(anyC(p)).length);
  if (drawnGaps.length) out.push({ kind: 'Gaps', list: drawnGaps });
  return out;
}
const totalGaps = () => procs().reduce((n, p) => n + gapsOf(anyC(p)).length, 0);
