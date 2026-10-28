/* ══ PRIORITIES ═════════════════════════════════════════════════════════
   Score, rank, plan and sign-off for choosing which processes to take deep.
   Wording, weights, suggestions and the lock follow the built page. */
const PSTEPS = [['score', '1 · Score', 'Importance, complexity, risk'], ['rank', '2 · Rank', 'See them side by side'], ['plan', '3 · Plan', 'Waves and progress'], ['signoff', '4 · Sign-off', 'One page for the client']];
const planLocked = () => S.plan.status !== 'DRAFT';
R.priorities = (args) => {
  const step = PSTEPS.some((s) => s[0] === args[0]) ? args[0] : 'score';
  const n = procs().length;
  const scored = procs().filter((p) => score(p) != null).length;
  return phead('Deep-dive priorities', { sub: 'Which of the ' + plural(n, 'high-level process', 'high-level processes') + ' do we take deep next: full steps, RACI, controls and an SOP?', tiles: [[scored + '/' + n, 'Scored', 0, 'priorities~score'], [procs().filter((p) => p.prio.dec === 'W1').length, 'Wave 1', 0, 'priorities~plan'], [procs().filter((p) => p.prio.dec === 'W2').length, 'Wave 2', 0, 'priorities~plan'], [{ DRAFT: 'Draft', SENT: 'With client', APPROVED: 'Approved' }[S.plan.status], 'The plan', 0, 'priorities~signoff']] }) +
    '<div class="steps4" role="tablist">' + PSTEPS.map(([k, t, s]) => '<button type="button" role="tab" aria-selected="' + (k === step) + '" class="' + (k === step ? 'on' : '') + '" data-go="priorities~' + k + '"><b>' + t + '</b><span>' + s + '</span></button>').join('') + '</div>' +
    (planLocked() && step !== 'signoff' ? '<div class="banner attn">The plan ' + (S.plan.status === 'SENT' ? 'is with the client' : 'is approved') + ', so scores, weights and decisions are locked. Reopen it on the Sign-off step, with a reason, to change it.</div>' : '') +
    ({ score: pScore, rank: pRank, plan: pPlan, signoff: pSignoff }[step])();
};
const decSel = (p, id) => sel(id || 'dec-' + p.code, [['', 'Not decided'], ['W1', 'Wave 1'], ['W2', 'Wave 2'], ['LATER', 'Later'], ['HIGH', 'Stays high-level']], p.prio.dec || '', { chg: 'prioDec', data: 'data-code="' + p.code + '"', dis: planLocked() });
function dots(p, k, cls) {
  const v = p.prio[k];
  return '<span class="dotsc ' + cls + '" role="radiogroup" aria-label="' + { imp: 'Importance', cx: 'Complexity', risk: 'Risk' }[k] + ' of ' + esc(p.name) + '">' + [1, 2, 3, 4, 5].map((i) => '<button type="button" class="' + (v && i <= v ? 'on' : '') + '" data-act="prioDot" data-code="' + p.code + '" data-k="' + k + '" data-v="' + i + '" aria-label="' + i + '"' + (planLocked() ? ' disabled' : '') + '></button>').join('') + '</span>';
}
function pScore() {
  const w = S.plan.weights, lk = planLocked();
  const rng = (k, label) => '<div><div style="display:flex;justify-content:space-between;font-size:13px"><span>' + label + '</span></div><div class="range"><input type="range" min="0" max="100" step="5" id="w-' + k + '" value="' + w[k] + '" data-inp="prioW" data-chg="prioWr" data-k="' + k + '"' + (lk ? ' disabled' : '') + ' aria-label="' + label + '"><b>' + w[k] + '%</b></div></div>';
  const rows = ranked().map(({ p, score: sc, rank }) => {
    const sx = !p.prio.cx && suggestCx(p), sr = !p.prio.risk && suggestRisk(p);
    return '<tr><td class="num"><b>' + (rank || '—') + '</b></td><td style="min-width:170px"><a class="pname" href="#" data-go="' + openP(p.code) + '">' + esc(p.name) + '</a><span class="psub code" style="font-size:11px">' + p.code + '</span></td><td>' + esc(p.cat || '—') + '</td>' +
      '<td>' + dots(p, 'imp', 'imp') + '</td><td>' + dots(p, 'cx', 'cx') + (sx ? '<span class="sugg">suggested ' + sx.v + ': ' + esc(sx.why) + (lk ? '' : ' · <button type="button" data-act="prioUse" data-code="' + p.code + '" data-k="cx" data-v="' + sx.v + '">use</button>') + '</span>' : '') + '</td>' +
      '<td>' + dots(p, 'risk', 'rk') + (sr ? '<span class="sugg">suggested ' + sr.v + ': ' + esc(sr.why) + (lk ? '' : ' · <button type="button" data-act="prioUse" data-code="' + p.code + '" data-k="risk" data-v="' + sr.v + '">use</button>') + '</span>' : '') + '</td>' +
      '<td class="num"><b style="font-size:15px">' + (sc == null ? '—' : sc) + '</b></td>' +
      '<td style="min-width:200px"><input class="inp" id="why-' + p.code + '" value="' + esc(p.prio.why) + '" maxlength="200" placeholder="One line" data-chg="prioWhy" data-code="' + p.code + '"' + (lk ? ' disabled' : '') + '></td><td>' + decSel(p) + '</td></tr>';
  }).join('');
  return '<div class="blk" style="margin-bottom:14px"><div class="blk-h"><span class="lbl">What counts, and how much</span><span class="note">Agree this with the client first.</span></div>' +
    '<div class="three">' + rng('imp', 'Importance to the business') + rng('risk', 'Risk if it goes wrong') + rng('cx', 'Complexity') + '</div>' +
    (w.imp + w.risk + w.cx === 0 ? '<p class="banner bad" style="margin:8px 0 0">At least one weight must be above zero.</p>' : '') +
    '<div class="filters" style="margin:12px 0 0"><label class="fld" style="grid-template-columns:auto 80px;align-items:center;gap:8px"><span>Deep dives the team can run at once</span><input type="number" id="cap" min="1" max="20" value="' + S.plan.capacity + '" data-chg="prioCap"' + (lk ? ' disabled' : '') + '></label>' +
    '<span style="margin-left:auto" class="acts"><button class="btn sm" type="button" data-act="prioFill"' + (lk ? ' disabled' : '') + '>Fill the empty complexity and risk from the map</button><button class="btn sm" type="button" data-act="prioSuggest"' + (lk ? ' disabled' : '') + '>Suggest waves from the ranking</button></span></div>' +
    '<p class="note" style="margin-top:8px">Click the dots to score 1 to 5. The score out of 100 and the rank follow the weights.</p></div>' +
    '<div class="tw"><table class="t"><thead><tr><th>Rank</th><th>Process</th><th>Department</th><th>Importance</th><th>Complexity</th><th>Risk</th><th>Score</th><th>Why (one line)</th><th>Decision</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<p class="banner attn" style="margin-top:12px">Office-only working view. The suggestions come from the process map and the risks already logged. You accept or change them, and none of this is printed in anything the client receives except the sign-off page.</p>';
}
INP.prioW = (el) => { S.plan.weights[el.dataset.k] = Number(el.value); el.nextElementSibling.textContent = el.value + '%'; };
CHG.prioWr = () => render();
CHG.prioCap = (el) => { S.plan.capacity = Math.max(1, Math.min(20, Number(el.value) || 4)); render(); };
CHG.prioWhy = (el) => { byCode(el.dataset.code).prio.why = el.value.trim(); };
CHG.prioDec = (el) => { byCode(el.dataset.code).prio.dec = el.value || null; render(); };
ACT.prioDot = (el) => { const p = byCode(el.dataset.code), k = el.dataset.k, v = Number(el.dataset.v); p.prio[k] = p.prio[k] === v ? null : v; render(); };
ACT.prioUse = (el) => { byCode(el.dataset.code).prio[el.dataset.k] = Number(el.dataset.v); render(); };
ACT.prioFill = () => { let n = 0; procs().forEach((p) => { let did = false; const sx = suggestCx(p), sr = suggestRisk(p); if (!p.prio.cx && sx) { p.prio.cx = sx.v; did = true; } if (!p.prio.risk && sr) { p.prio.risk = sr.v; did = true; } if (did) n++; }); toast('Filled ' + plural(n, 'process', 'processes') + ' from the map and the risks logged. Importance is always yours to give.'); render(); };
ACT.prioSuggest = () => {
  const cap = S.plan.capacity; let n = 0, i = 0;
  const free = ranked().filter((x) => x.score != null && !x.p.prio.dec);
  ranked().filter((x) => x.score != null).forEach((x) => { if (x.p.prio.dec) { i++; return; } });
  const taken = { W1: procs().filter((p) => p.prio.dec === 'W1').length, W2: procs().filter((p) => p.prio.dec === 'W2').length };
  free.forEach((x) => { const d = taken.W1 < cap ? 'W1' : taken.W2 < cap ? 'W2' : n < 3 + (2 * cap) ? 'LATER' : 'HIGH'; if (d === 'W1' || d === 'W2') taken[d]++; x.p.prio.dec = d; n++; });
  toast('Set ' + plural(n, 'decision') + ' from the ranking. Nothing you decided was changed.'); render();
};

function pRank() {
  const list = ranked(), scored = list.filter((x) => x.score != null), selP = byCode(UI.sel.prio) || (scored[0] && scored[0].p);
  const W = 600, H = 410, L = 54, T = 26, Rr = 78, B = 46, sx = (v) => L + (v - 1) / 4 * (W - L - Rr), sy = (v) => H - B - (v - 1) / 4 * (H - B - T);
  const seen = {};
  const circles = scored.map(({ p }) => {
    const key = p.prio.imp + ':' + p.prio.risk, k = seen[key] = (seen[key] || 0) + 1, off = -(k - 1) * 26;
    const cls = { W1: 'w1', W2: 'w2', LATER: 'later', HIGH: 'high' }[p.prio.dec] || 'none';
    return '<circle class="' + cls + (p === selP ? ' sel' : '') + '" cx="' + (sx(p.prio.imp) + off) + '" cy="' + sy(p.prio.risk) + '" r="' + (5 + p.prio.cx * 2.4) + '" fill-opacity=".82" data-act="prioSel" data-code="' + p.code + '"><title>' + esc(p.name) + ' · score ' + score(p) + '</title></circle>' +
      (k === 1 ? '<text x="' + (sx(p.prio.imp) + 8 + p.prio.cx * 2.4) + '" y="' + (sy(p.prio.risk) + 4) + '">' + scored.filter((y) => y.p.prio.imp === p.prio.imp && y.p.prio.risk === p.prio.risk).map((y) => y.p.code).join(', ') + '</text>' : '');
  }).join('');
  const grid = [1, 2, 3, 4, 5].map((v) => '<line class="ax" x1="' + sx(v) + '" y1="' + T + '" x2="' + sx(v) + '" y2="' + (H - B) + '"/><line class="ax" x1="' + L + '" y1="' + sy(v) + '" x2="' + (W - Rr) + '" y2="' + sy(v) + '"/><text x="' + sx(v) + '" y="' + (H - B + 16) + '" text-anchor="middle">' + v + '</text><text x="' + (L - 10) + '" y="' + (sy(v) + 4) + '" text-anchor="end">' + v + '</text>').join('');
  const svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Bubble chart of importance against risk"><rect class="q1" x="' + sx(3) + '" y="' + T + '" width="' + (W - Rr - sx(3)) + '" height="' + (sy(3) - T) + '"/>' + grid +
    '<text class="ql" x="' + (sx(3) + 6) + '" y="' + (T + 16) + '">Start here</text><text class="ql" x="' + (L + 6) + '" y="' + (T + 16) + '">Risky, less central</text><text class="ql" x="' + (W - Rr - 6) + '" y="' + (H - B - 8) + '" text-anchor="end">Central, lower risk</text><text class="ql" x="' + (L + 6) + '" y="' + (H - B - 8) + '">Leave high-level</text>' +
    circles + '<text x="' + ((L + W - Rr) / 2) + '" y="' + (H - 8) + '" text-anchor="middle">Importance →</text><text x="14" y="' + ((T + H - B) / 2) + '" text-anchor="middle" transform="rotate(-90 14 ' + ((T + H - B) / 2) + ')">Risk →</text></svg>';
  const unscored = list.filter((x) => x.score == null).map((x) => x.p.name);
  return '<div class="ovgrid"><div class="blk"><div class="blk-h"><span class="lbl">Importance across, risk up — a bigger circle is more complex</span></div><div class="bubble">' + svg + '</div>' +
    '<div class="legend" style="margin-top:6px"><span><svg width="12" height="12"><circle cx="6" cy="6" r="5" style="fill:var(--stone)"/></svg>Wave 1</span><span><svg width="12" height="12"><circle cx="6" cy="6" r="5" style="fill:var(--gold)"/></svg>Wave 2</span><span><svg width="12" height="12"><circle cx="6" cy="6" r="5" style="fill:var(--ink-3)"/></svg>Later</span><span><svg width="12" height="12"><circle cx="6" cy="6" r="5" style="fill:var(--line);stroke:var(--field-line)"/></svg>Stays high-level</span><span><svg width="12" height="12"><circle cx="6" cy="6" r="5" style="fill:var(--surface);stroke:var(--field-line);stroke-dasharray:2 2"/></svg>Not decided</span></div>' +
    (unscored.length ? '<p class="note" style="margin-top:6px">Not scored yet, so not on the chart: ' + unscored.map(esc).join(', ') + '.</p>' : '') + '</div>' +
    '<div class="stack">' + (selP ? '<div class="blk"><div class="blk-h"><span class="lbl">Selected</span></div><b style="font-size:16px">' + esc(selP.name) + '</b><p class="note">' + selP.code + ' · ' + esc(selP.cat || 'No department') + '</p>' +
      '<div class="cells" style="margin:10px 0;grid-template-columns:repeat(4,minmax(0,1fr))">' + [['Importance', selP.prio.imp], ['Risk', selP.prio.risk], ['Complexity', selP.prio.cx], ['Score', score(selP)]].map(([k, v]) => '<div class="cell" style="padding:8px 10px"><div class="k">' + k + '</div><div class="v" style="font-size:20px">' + (v == null ? '—' : v) + '</div></div>').join('') + '</div>' +
      '<p>' + (selP.prio.why ? esc(selP.prio.why) : '<span class="q">No reason written yet.</span>') + '</p><div class="filters" style="margin-top:10px"><span class="note">Decision</span>' + decSel(selP, 'dec-sel') + '<a class="lnk" href="#" data-go="' + openP(selP.code) + '" style="margin-left:auto">Open process →</a></div></div>' : '') +
    '<div class="box"><table class="t"><thead><tr><th>#</th><th>Ranked</th><th>Score</th><th>Decision</th></tr></thead><tbody>' + scored.map((x) => '<tr class="hov' + (x.p === selP ? ' sel' : '') + '" data-act="prioSel" data-code="' + x.p.code + '"><td class="num">' + x.rank + '</td><td>' + esc(x.p.name) + '</td><td class="num"><b>' + x.score + '</b></td><td>' + (x.p.prio.dec ? '<span class="chip' + (isDeep(x.p) ? ' gold' : '') + '">' + DEC[x.p.prio.dec] + '</span>' : '<span class="chip dash">Not decided</span>') + '</td></tr>').join('') + '</tbody></table></div></div></div>';
}
ACT.prioSel = (el) => { UI.sel.prio = el.dataset.code; render(); };

function pPlan() {
  const cap = S.plan.capacity, list = ranked(), w1 = list.filter((x) => x.p.prio.dec === 'W1');
  const col = (k, label) => {
    const items = list.filter((x) => x.p.prio.dec === k);
    return '<div class="col"><div class="col-h"><b>' + label + '</b><span class="n">' + items.length + '</span></div>' +
      (k === 'HIGH' ? '<div class="timing" style="cursor:default">no deep dive planned</div>' : '<input class="timing" id="tm-' + k + '" value="' + esc(S.plan.timing[k]) + '" maxlength="60" data-chg="prioTiming" data-k="' + k + '" aria-label="When ' + label + ' runs"' + (planLocked() ? ' disabled' : '') + '>') +
      items.map((x) => { const m = marks(x.p); return '<div class="card" data-go="' + openP(x.p.code) + '"><b>' + esc(x.p.name) + '</b><div class="s">' + x.p.code + ' · ' + esc(x.p.cat || 'No department') + (x.rank ? ' · rank ' + x.rank : '') + '</div>' + (k === 'HIGH' ? '' : '<div class="seg6">' + m.map((y) => '<i class="' + (y.done ? 'on' : '') + '" title="' + y.label + '"></i>').join('') + '</div><div class="s">Deep dive ' + marksDone(x.p) + ' of 6 · Open process →</div>') + '</div>'; }).join('') +
      (items.length ? '' : '<p class="note" style="padding:6px 4px">Nothing here.</p>') + '</div>';
  };
  const undecided = list.filter((x) => !x.p.prio.dec).map((x) => x.p.name);
  return '<div class="banner ' + (w1.length > cap ? 'bad' : 'good') + '">Team capacity: ' + plural(cap, 'deep dive') + ' at a time. Wave 1 holds ' + w1.length + ' — ' + (w1.length > cap ? 'too many to run together; move one to Wave 2.' : 'fits.') + '</div>' +
    '<div class="board">' + col('W1', 'Wave 1') + col('W2', 'Wave 2') + col('LATER', 'Later') + col('HIGH', 'Stays high-level') + '</div>' +
    (undecided.length ? '<p class="note" style="margin-top:10px">Not decided yet: ' + undecided.map(esc).join(', ') + '. Decide them on the <a class="lnk" href="#" data-go="priorities~score">Score</a> step.</p>' : '') +
    '<p class="note" style="margin-top:4px">The six marks are Map · RACI · Authority · Controls · SOP · Approved. They fill in by themselves as the work is done on the process.</p>';
}
CHG.prioTiming = (el) => { S.plan.timing[el.dataset.k] = el.value.trim() || S.plan.timing[el.dataset.k]; };

function planDoc(snap, status) {
  const d = snap || { weights: S.plan.weights, rows: ranked().map((x) => ({ code: x.p.code, name: x.p.name, cat: x.p.cat, why: x.p.prio.why, dec: x.p.prio.dec, rank: x.rank })), timing: S.plan.timing, n: procs().length };
  const wave = (k) => { const r = d.rows.filter((x) => x.dec === k); return r.length ? '<h2>' + DEC[k] + ' — ' + esc(d.timing[k]) + ' · ' + plural(r.length, 'process', 'processes') + '</h2><div class="tw"><table class="t"><tbody>' + r.map((x) => '<tr><td class="num" style="width:40px">' + (x.rank || '—') + '</td><td><b>' + esc(x.name) + '</b></td><td>' + esc(x.cat || '') + '</td><td>' + esc(x.why) + '</td></tr>').join('') + '</tbody></table></div>' : ''; };
  const rest = d.rows.filter((x) => x.dec === 'LATER' || x.dec === 'HIGH');
  const chosen = d.rows.filter((x) => x.dec === 'W1' || x.dec === 'W2').length;
  return '<div class="paper"><div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between"><h1>Deep-dive priorities — ' + esc(S.ws.name) + '</h1>' + status + '</div>' +
    '<p style="margin-top:10px">From ' + plural(d.n, 'high-level process', 'high-level processes') + ' we propose to go deep on ' + chosen + ', in this order. They were chosen on three things, weighted as shown.</p>' +
    '<div class="meta" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div><em>Importance</em><b style="font-size:20px">' + d.weights.imp + '%</b></div><div><em>Risk</em><b style="font-size:20px">' + d.weights.risk + '%</b></div><div><em>Complexity</em><b style="font-size:20px">' + d.weights.cx + '%</b></div></div>' +
    wave('W1') + wave('W2') + (rest.length ? '<h2>Later, or stays high-level</h2><p>' + rest.map((x) => esc(x.name) + ' (' + (x.dec === 'LATER' ? 'Later' : 'stays high-level') + ')').join(' · ') + '</p>' : '') +
    '<div class="sig"><div>Approved for ' + esc(S.ws.name) + ' — name, role, date</div><div>Strategy Office — ' + (S.plan.sentBy ? esc(S.plan.sentBy) : 'name, date') + '</div></div></div>';
}
function pSignoff() {
  const P = S.plan, st = P.status;
  const pill = st === 'DRAFT' ? '<span class="pill">Draft</span>' : st === 'SENT' ? '<span class="pill attn">Waiting for approval</span>' : '<span class="pill good">Approved by ' + esc(personName(P.approver)) + ', ' + dt(P.approvedAt) + '</span>';
  const chosen = procs().filter(isDeep), unscored = chosen.filter((p) => score(p) == null);
  let panel;
  if (st === 'DRAFT') {
    panel = fld('Who signs for the client', sel('pl-appr', approverOptions(), P.approver || '', { chg: 'planAppr' }), { hint: 'Their name goes on the signature line. They approve from their own reading page.' }) +
      (unscored.length ? '<p class="banner bad" style="margin:0">Score every chosen process first: ' + unscored.map((p) => esc(p.name)).join(', ') + '.</p>' : '') +
      '<div class="acts"><button class="btn gold" type="button" data-act="planSend"' + (!P.approver || !chosen.length || unscored.length ? ' disabled' : '') + '>Send to client for approval</button></div>' + (!chosen.length ? '<p class="note">Choose at least one process for Wave 1 or Wave 2 first.</p>' : '');
  } else {
    panel = (st === 'SENT' ? '<p>Waiting for <b>' + esc(personName(P.approver)) + '</b> (' + esc(personById(P.approver).roles.map(roleName).join(', ')) + ') to approve. They approve from their own reading page; the link is on the Governance page.</p><div class="acts"><button class="btn sm" type="button" data-act="seePlanAsApprover">See what ' + esc(personName(P.approver).split(' ')[0]) + ' sees</button></div>'
      : '<p>Approved. Changing it from here needs a reason, which is kept on record.</p>') +
      fld(st === 'SENT' ? 'Withdraw, or reopen to change it' : 'Reopen to change it', '<input class="inp" id="pl-why" maxlength="500" placeholder="Why">') + '<div class="acts"><button class="btn" type="button" data-act="planReopen">' + (st === 'SENT' ? 'Withdraw' : 'Reopen') + '</button></div>';
  }
  return (P.returned && st === 'DRAFT' ? '<div class="banner attn"><b>Sent back:</b> ' + esc(P.returned) + '</div>' : '') +
    '<div class="ovgrid"><div>' + planDoc(st === 'DRAFT' ? null : P.snapshot, pill) + '</div><div class="stack"><div class="blk"><div class="blk-h"><span class="lbl">Send for sign-off</span></div><div class="frm">' + panel + '</div></div>' +
    '<div class="blk"><div class="blk-h"><span class="lbl">One page</span></div><p class="note">Opens the page on its own, ready to print or save as PDF.</p><div class="acts" style="margin-top:8px"><button class="btn" type="button" data-act="toast" data-msg="Opens the one-page sign-off on its own, ready to print.">Export one page</button></div></div>' +
    '<div class="blk"><div class="blk-h"><span class="lbl">Record</span></div>' + (P.record.length ? '<ul style="padding-left:16px">' + P.record.map((r) => '<li>' + dshort(r[0]) + ' · <b>' + esc(r[1]) + '</b> — ' + esc(r[2]) + (r[3] ? ' (“' + esc(r[3]) + '”)' : '') + '</li>').join('') + '</ul>' : '<p class="none">Nothing yet.</p>') + '</div></div></div>';
}
CHG.planAppr = (el) => { S.plan.approver = el.value || null; render(); };
ACT.planSend = () => {
  const P = S.plan;
  P.snapshot = { weights: Object.assign({}, P.weights), rows: ranked().map((x) => ({ code: x.p.code, name: x.p.name, cat: x.p.cat, why: x.p.prio.why, dec: x.p.prio.dec, rank: x.rank })), timing: Object.assign({}, P.timing), n: procs().length };
  P.status = 'SENT'; P.sentBy = 'Strategy Office'; P.sentAt = todayIso(); P.returned = null;
  P.record.unshift([todayIso(), 'Strategy Office', 'Sent to ' + personName(P.approver) + ' (' + personById(P.approver).roles.map(roleName).join(', ') + ') for approval']);
  toast('Sent. ' + personName(P.approver) + ' sees it on their reading page.'); render();
};
ACT.planReopen = () => { const why = val('pl-why'); if (!why) { toast('Say why first.'); return; } const P = S.plan, was = P.status; P.status = 'DRAFT'; P.approvedAt = null; P.record.unshift([todayIso(), 'Strategy Office', was === 'SENT' ? 'Sent the plan back to draft' : 'Reopened the plan (it was approved)', why]); toast('Back to draft.'); render(); };
ACT.seePlanAsApprover = () => { UI.look = 'approver'; go('plan-signoff'); };
