/* ══ FRAME ═════════════════════════════════════════════════════════════
   The prototype band, SMP's top bar, the navy band, the tab bar, and the
   pieces both sides share: pills, marks, the flow drawing and a step's detail. */
const LOOKS = [['hend', 'Hend Mourad', 'owner'], ['yara', 'Yara Kamal', 'approver'], ['dalia', 'Dalia Sabry', 'staff'], ['mona', 'Mona Farag', 'office']];
function protoBand() {
  return '<div class="mk"><div class="mk-in"><div class="mk-id"><span class="mk-tag">Prototype</span><b>Processes, rethought</b><span>Nothing is built. Sample data invented for Raya Trade.</span></div>' +
    '<div class="mk-sw" role="group" aria-label="Looking as"><span>Looking as</span>' + LOOKS.map(([k, n, r]) => '<button type="button" class="' + (UI.as === k ? 'on' : '') + '" aria-pressed="' + (UI.as === k) + '" data-go="' + k + '.' + home(k) + '">' + n.split(' ')[0] + ' <small>' + r + '</small></button>').join('') + '</div>' +
    '<button class="mk-b" type="button" data-act="guide">Try this</button><button class="mk-b" type="button" data-act="startOver">Start over</button></div></div>';
}
function topBar() {
  const n = isOffice() ? handleFor().length : todoFor(meId()).length;
  return '<div class="tb"><div class="tb-in"><span class="brand">Raya Trade</span><button class="mod" type="button" data-go="' + UI.as + '.' + home(UI.as) + '">Processes' + (n ? ' <span class="n">' + n + '</span>' : '') + '</button><span class="who">' + esc(me().name) + '</span>' + (isOffice() ? '<span class="seat">Strategy Office</span>' : '') + '<button class="out" type="button" data-act="toast" data-msg="Signing out is not part of this prototype.">Sign out</button></div></div>';
}
ACT.toast = (el) => toast(el.dataset.msg);
const page = (inner) => topBar() + '<div class="pg">' + inner + '</div>';
const tiles = (t) => t.map(([n, l, c]) => '<div class="mtile ' + (c || '') + '"><b>' + n + '</b><span>' + l + '</span></div>').join('');
function mast({ eyebrow, title, sub, acts, tiles: tl, wait, extra }) {
  return '<header class="mast"><div class="mrow"><div style="min-width:0"><p class="wkof">' + eyebrow + '</p><h1>' + title + '</h1>' + (sub ? '<p class="msub">' + sub + '</p>' : '') + (wait ? '<p class="mwait"><b>Waiting on you</b>' + wait + '</p>' : '') + '</div>' +
    '<div class="mside"><div class="macts">' + (acts || '') + '</div><div class="mstrip">' + (tl || '') + '</div></div></div>' + (extra || '') + '</header>';
}
/* the tab bar under the band; a section's own views can ride along under it */
function tabBar(list, cur, sub) {
  return '<div class="vtbar"><div class="vt" role="tablist" aria-label="Views">' + list.map(([k, l, n, hot, g]) => '<button type="button" role="tab" class="' + (k === cur ? 'on' : '') + '" aria-selected="' + (k === cur) + '" data-go="' + g + '">' + l + (n ? ' <span class="ct' + (hot ? ' hot' : '') + '">' + n + '</span>' : '') + '</button>').join('') + '</div>' + (sub ? '<div class="vtsub">' + sub + '</div>' : '') + '</div>';
}
const pill = (k, t) => '<span class="pill ' + k + '">' + esc(t) + '</span>';
const stPill = (p) => { const s = stateOf(p); return pill(s.pill, s.label); };
const pn = (c) => '<span class="code">' + c + '</span> ' + esc(nameOf(c));
const kp = (items) => '<div class="kp">' + items.map(([n, l, c]) => '<div class="' + (c || '') + '"><b>' + n + '</b><span>' + l + '</span></div>').join('') + '</div>';
const marksCell = (p) => '<span class="mk6" title="Map, RACI, Authority, Controls, SOP, Approved">' + ['M', 'R', 'A', 'C', 'S', '✓'].map((L, i) => '<i class="' + (marksOf(p)[i] ? 'on' : '') + '">' + L + '</i>').join('') + '</span>';
const dots = (v) => '<span class="dots" aria-label="' + v + ' of 5">' + '●'.repeat(v) + '<i>' + '●'.repeat(5 - v) + '</i></span>';
const flags = (f) => '<div class="flags">' + f.map(([c, t]) => '<span class="' + c + '">' + esc(t) + '</span>').join('') + '</div>';

/* ── the flow: one lane per role, one column per step ── */
function flowHtml(c, p, opts) {
  const o = opts || {};
  if (!c || !c.steps.length) return '<div class="ph"><b>No steps yet</b>' + (o.edit ? 'Add the first step with + Step.' : 'The office has not drawn this process yet.') + '</div>';
  const lanes = []; c.steps.forEach((s) => { if (lanes.indexOf(s.role) < 0) lanes.push(s.role); });
  const g = o.gaps ? gapsOf(c) : [];
  const sel = o.sel;
  let n = 0;
  const boxes = c.steps.map((s, i) => {
    const isT = s.type === 'TASK' || s.type === 'DECISION';
    if (isT) n += 1;
    const gp = g.filter((x) => x.step === s.id);
    return '<button type="button" class="st' + (s.type === 'DECISION' ? ' dec' : '') + (isT ? '' : ' ends') + (s.id === sel ? ' on' : '') + '" id="fs-' + s.id + '" ' + (isT ? 'data-act="pickStep" data-step="' + s.id + '"' : '') + ' style="grid-row:' + (lanes.indexOf(s.role) + 1) + ';grid-column:' + (i + 2) + '"><span class="n">' + (isT ? 'STEP ' + n : s.type === 'START' ? 'START' : 'END') + '</span><b>' + esc(s.label) + '</b>' + (gp.length ? '<span class="gap" title="' + esc(gp.map((x) => x.text).join('; ')) + '">!</span>' : '') + (o.changes && s.changed ? '<span class="chg">CHANGED</span>' : '') + '</button>';
  }).join('');
  const cols = c.steps.length;
  return '<div class="lanes-wrap"><div class="lanes" data-flow="' + esc(JSON.stringify(c.conn)) + '" style="grid-template-columns:104px repeat(' + cols + ',minmax(116px,1fr));grid-template-rows:repeat(' + lanes.length + ',96px);min-width:' + (104 + cols * 116) + 'px">' +
    lanes.map((r, i) => '<div class="lane-bg' + (i % 2 ? ' z' : '') + '" style="grid-row:' + (i + 1) + '"></div><div class="lane-l" style="grid-row:' + (i + 1) + '">' + esc(roleName(r)) + '</div>').join('') + boxes + '<svg class="edges" aria-hidden="true"></svg></div></div>';
}
/* arrows are measured from the drawn boxes, so they follow any layout */
function drawArrows() {
  $$('.lanes').forEach((L) => {
    if (!L.offsetParent) return;
    const conn = JSON.parse(L.dataset.flow || '[]'), svg = L.querySelector('svg.edges'), o = L.getBoundingClientRect();
    let out = '<defs><marker id="ah-' + (L.id || 'x') + '" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto"><path class="ah" d="M0 0 8 4 0 8z"/></marker></defs>', lab = '';
    conn.forEach(([f, t, l]) => {
      const A = L.querySelector('#fs-' + f), B = L.querySelector('#fs-' + t); if (!A || !B) return;
      const a = A.getBoundingClientRect(), b = B.getBoundingClientRect();
      let d, lx, ly;
      if (b.left > a.right - 2) {
        const sx = a.right - o.left, sy = a.top - o.top + a.height / 2, ex = b.left - o.left - 2, ey = b.top - o.top + b.height / 2, mx = Math.round(sx + Math.min(22, (ex - sx) / 2));
        d = Math.abs(sy - ey) < 2 ? 'M' + sx + ' ' + sy + 'H' + ex : 'M' + sx + ' ' + sy + 'H' + mx + 'V' + ey + 'H' + ex; lx = mx + 5; ly = (sy + ey) / 2 + 4;
      } else {
        const sx = a.left - o.left + a.width / 2, sy = a.bottom - o.top, ex = b.left - o.left + b.width / 2, ey = b.bottom - o.top + 2, low = Math.max(sy, ey) + 18;
        d = 'M' + sx + ' ' + sy + 'V' + low + 'H' + ex + 'V' + ey; lx = (sx + ex) / 2 - 20; ly = low - 4;
      }
      out += '<path d="' + d + '" marker-end="url(#ah-' + (L.id || 'x') + ')"/>';
      if (l) { const w = l.length * 5.7 + 8; lab += '<rect x="' + (lx - 3) + '" y="' + (ly - 11) + '" width="' + w + '" height="15" rx="3"/><text x="' + lx + '" y="' + ly + '">' + esc(l) + '</text>'; }
    });
    svg.innerHTML = out + lab;
  });
}
AFTER.push(() => requestAnimationFrame(drawArrows));
window.addEventListener('resize', () => requestAnimationFrame(drawArrows));

/* a step's detail, read-only */
function stepRead(c, sid, extra) {
  const s = stepById(c, sid); if (!s) return '<p class="note">Pick a step in the flow.</p>';
  const ks = controlsOf(c, sid), appr = apprOf(c, sid), time = timeOf(c, sid), r = raciOf(c, sid);
  return '<span class="note" style="font-family:var(--mono);font-weight:700">STEP ' + stepNo(c, sid) + (s.type === 'DECISION' ? ' · DECISION' : '') + '</span><h3>' + esc(s.label) + '</h3><dl class="dl"><dt>Done by</dt><dd>' + esc(roleName(s.role)) + '</dd>' + (appr ? '<dt>Approval</dt><dd>' + esc(appr) + '</dd>' : '') + (time ? '<dt>Time limit</dt><dd>' + esc(time) + '</dd>' : '') + (Object.keys(r).length ? '<dt>Involved</dt><dd>' + Object.keys(r).map((k) => r[k] + ' · ' + esc(roleName(k))).join('<br>') + '</dd>' : '') + '</dl>' +
    (s.acts.length ? '<ul style="padding-left:18px;font-size:13px">' + s.acts.map((a) => '<li>' + esc(a) + '</li>').join('') + '</ul>' : '') + ks.map((k) => k.control ? '<p class="ctl">Control: ' + esc(k.control) + '</p>' : '<p class="ctl bad">“' + esc(k.risk) + '” has no control</p>').join('') + (extra || '');
}
/* a step as a card, for the Steps tab and the Summary */
function stepCard(c, s, n, opts) {
  const o = opts || {};
  const appr = apprOf(c, s.id), time = timeOf(c, s.id), ks = controlsOf(c, s.id);
  const meta = [appr && '<span><em>Approval</em>' + esc(appr) + '</span>', time && '<span><em>Time limit</em>' + esc(time) + '</span>'].filter(Boolean).join('');
  const noCtl = ks.some((k) => !k.control);
  return '<div class="sc" id="' + (o.prefix || 'sc') + '-' + s.id + '"><span class="num">' + n + '</span><div><h3' + (o.compact ? ' data-act="openCard"' : '') + '>' + esc(s.label) + (s.type === 'DECISION' ? ' <span class="chip">Decision</span>' : '') + (noCtl ? ' <span class="chip bad">No control</span>' : '') + (s.changed && o.changes ? ' <span class="chip gold">Changed in v' + o.changes + '</span>' : '') + (o.mine && o.mine.includes(s.role) ? ' <span class="chip navy">Your step</span>' : '') + '</h3><p class="by">Done by: ' + esc(roleName(s.role)) + '</p>' +
    (s.acts.length ? '<ul>' + s.acts.map((a) => '<li>' + esc(a) + '</li>').join('') + '</ul>' : '') + (meta ? '<div class="meta">' + meta + '</div>' : '') +
    ks.map((k) => '<p class="ctl' + (k.control ? '' : ' bad') + '">Risk: ' + esc(k.risk) + (k.control ? ' · Control: ' + esc(k.control) : ' · no control yet') + '</p>').join('') +
    (o.suggest ? '<div class="sug"><button class="lnk" type="button" data-act="suggest" data-code="' + o.suggest + '" data-step="' + s.id + '">Suggest a change to this step</button></div>' : '') + '</div></div>';
}
ACT.openCard = (el) => el.closest('.sc').classList.toggle('open');
