/* ══ FRAME ══════════════════════════════════════════════════════════════
   The drawing band (review controls, never the product), then the product's
   own chrome: SMP's white top bar, the grey section bar (or, as option B, the
   menu down the side), and one page-header shape for every page. */
const LOOKS = { office: 'Strategy Office (consultant)', staff: 'Dalia Sabry · staff, Sales coordinator', approver: 'Yara Kamal · approver, CFO' };
const LOOK_PERSON = { staff: 'p13', approver: 'p1' };
const OPTION_LIST = [
  ['nav', 2, 'Sections as tabs in the band', 'Off shows option B: the left menu, restyled.', (v) => v === 'top', (on) => { OPT.nav = on ? 'top' : 'side'; }],
  ['brand', 1, 'The band in the client\'s own colour', 'Option B of question 1, as Portfolio does. Off is the house navy the Tracker wears.', (v) => v, (on) => { OPT.brand = on; }],
  ['landscape', 3, 'Helicopter View and Value Chain as one section', 'Off shows them as two sections.', (v) => v, (on) => { OPT.landscape = on; }],
  ['oldTabs', 4, 'Keep the seven tabs signed off on 14 October', 'On brings back People, Compliance and Connections.', (v) => v, (on) => { OPT.oldTabs = on; }],
  ['marksAll', 5, 'Readiness marks on every process', 'Off shows them on deep dives only.', (v) => v, (on) => { OPT.marksAll = on; }],
  ['rail', 6, 'The list of processes beside a process', 'Off removes the rail.', (v) => v, (on) => { OPT.rail = on; }],
  ['aiPanel', 7, 'Check with AI as a side panel', 'Off makes it a tab of its own.', (v) => v, (on) => { OPT.aiPanel = on; }],
];

function band() {
  const r0 = UI.route[0], rv = r0 === 'review' ? UI.route[1] : null;
  const opts = UI.menu === 'opts' ? '<div class="mk-pop" role="dialog" aria-label="Options under review"><h4>Options the team is comparing</h4><p class="note">Each one is a question on the Decisions page. The recommended answer is what you see with these as they start.</p>' +
    OPTION_LIST.map(([k, q, label, small, isOn]) => '<label class="opt-row"><input type="checkbox" data-chg="opt" data-k="' + k + '"' + (isOn(OPT[k]) ? ' checked' : '') + '><span><span class="d">Q' + q + '</span>' + label + '<small>' + small + '</small></span></label>').join('') +
    '<div style="margin-top:8px"><button class="lnk" type="button" data-act="optReset">Back to the recommended answers</button></div></div>' : '';
  return '<div class="mk"><div class="mk-in">' +
    '<div class="mk-id"><span class="mk-tag">Mockup</span><b>Processes in SMP\'s look</b><span>Nothing here is built. Every name, process and figure is invented sample data for Raya Trade.</span></div>' +
    '<div class="mk-ctl">' +
    '<label class="mk-look">Looking as ' + sel('look', Object.keys(LOOKS).map((k) => [k, LOOKS[k]]), UI.look, { chg: 'look' }) + '</label>' +
    '<div class="menu-wrap" style="position:relative"><button class="mk-btn' + (UI.menu === 'opts' ? ' on' : '') + '" type="button" data-act="menu" data-id="opts" aria-expanded="' + (UI.menu === 'opts') + '">Options <span class="dn">▾</span></button>' + opts + '</div>' +
    '<button class="mk-btn' + (rv === 'screens' ? ' on' : '') + '" type="button" data-go="review~screens">Every screen</button>' +
    '<button class="mk-btn' + (rv === 'assessment' ? ' on' : '') + '" type="button" data-go="review~assessment">Today\'s problems</button>' +
    '<button class="mk-btn' + (rv === 'decisions' ? ' on' : '') + '" type="button" data-go="review~decisions">Decisions</button>' +
    (r0 === 'review' ? '<button class="mk-btn" type="button" data-act="backToProduct">Back to the product</button>' : '') +
    '<button class="mk-btn" type="button" data-act="startOver" title="Puts every sample back as it started">Start over</button>' +
    '</div></div></div>';
}
CHG.opt = (el) => { const o = OPTION_LIST.find((x) => x[0] === el.dataset.k); o[5](el.checked); UI.menu = 'opts'; render(); };
CHG.look = (el) => { UI.look = el.value; UI.menu = null; go(UI.look === 'office' ? 'overview' : 'read'); };
ACT.optReset = () => { Object.assign(OPT, { nav: 'top', brand: false, rail: true, oldTabs: false, marksAll: true, landscape: true, aiPanel: true }); UI.menu = 'opts'; render(); };
ACT.startOver = () => { try { history.replaceState(null, '', '#overview'); } catch (e) {} location.reload(); };
let lastProductRoute = ['overview'];
ACT.backToProduct = () => go(lastProductRoute);

/* the product's sections */
function sections() {
  const s = [['overview', 'Overview'], ['processes', 'Processes'], ['priorities', 'Priorities']];
  if (OPT.landscape) s.push(['landscape', 'Landscape']); else s.push(['landscape~rails', 'Helicopter View'], ['landscape~chain', 'Value Chain']);
  s.push(['governance', 'Governance'], ['org', 'Org directory']);
  return s;
}
function activeSection(name) {
  if (name === 'p' || name === 'deleted' || name === 'sop') return 'processes';
  if (name === 'landscape' && !OPT.landscape) return UI.route[1] === 'chain' ? 'landscape~chain' : 'landscape~rails';
  return name;
}
const langSwitch = () => '<span class="lang"><button type="button" class="on" data-act="toast" data-msg="English is on.">English</button>·<button type="button" lang="ar" data-act="toast" data-msg="العربية: the module keeps its Arabic translation and right-to-left layout. Not drawn in this mockup.">العربية</button></span>';
const THEME_ICON = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="3.7" fill="currentColor"/><g stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M10 1.6v2.2M10 16.2v2.2M18.4 10h-2.2M3.8 10H1.6"/><path d="M15.9 4.1l-1.6 1.6M5.7 14.3l-1.6 1.6M15.9 15.9l-1.6-1.6M5.7 5.7L4.1 4.1"/></g></svg>';
ACT.theme = () => { const r = document.documentElement, cur = r.getAttribute('data-theme'); const dark = cur ? cur === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; r.setAttribute('data-theme', dark ? 'light' : 'dark'); render(); };

function topBar() {
  const mods = mi('Strategy', 'soon', 'data-what="Strategy"') + mi('Portfolio', 'soon', 'data-what="Portfolio"') + '<button class="mi here" type="button" data-go="overview">Processes</button>' + mi('Internal Tracker', 'soon', 'data-what="Internal Tracker"') + mi('Insights', 'soon', 'data-what="Insights"') + mi('Meeting Notes', 'soon', 'data-what="Meeting Notes"') +
    '<div class="rule"></div><button class="mi" type="button" data-go="settings">Processes settings<small>Logo and colours, industry, governance profile, language</small></button>' + mi('Client settings', 'soon', 'data-what="Client settings"');
  return '<div class="tb"><div class="trail"><span class="ff">Platform</span><span class="sep">›</span>' +
    '<span class="step client"><button type="button" data-act="soon" data-what="The client menu">' + esc(S.ws.name) + ' <span class="dn">▾</span></button></span><span class="sep">›</span>' +
    '<span class="step">' + menuBtn('mod', 'Processes', mods, { cls: 'tstep', left: true, w: 280 }) + '</span></div>' +
    '<div class="tbacts"><button class="tbtheme" type="button" data-act="theme" aria-label="Light or dark">' + THEME_ICON + '</button><button class="tbout" type="button" data-act="soon" data-what="Sign out">Sign out</button></div></div>';
}
/* THE BAND'S INKS, the platform's own rule (lib/branding.ts barInks, §498):
   white or near-black ink, whichever reads on the bar; quiet words walked to
   4.5:1; the house gold walked the same way; a late red that reads. So the
   client's own colour (option B) stays legible however light it is. */
function barInks(bar) {
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const hex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
  const lum = (c) => { const x = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * x[0] + 0.7152 * x[1] + 0.0722 * x[2]; };
  const con = (a, b) => { const l1 = lum(rgb(a)), l2 = lum(rgb(b)); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const W = [255, 255, 255], D = [12, 17, 26], light = con('#FFFFFF', bar) >= con(hex(D), bar), ink = light ? W : D;
  const readable = (fg, need) => { const tg = light ? W : [0, 0, 0]; for (let t = 0; t <= 1.001; t += 0.04) { const c = hex(mix(fg, tg, t)); if (con(c, bar) >= need) return c; } return hex(tg); };
  return { ink: hex(ink), quiet: readable(mix(ink, rgb(bar), 0.3), 4.5), accent: readable(rgb('#E8A33A'), 4.5), late: readable(rgb(light ? '#FF9B8F' : '#A23123'), 4.5), hover: light ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.07)' };
}
function brandVars() {
  const c = S.ws.colors, bar = OPT.brand && /^#[0-9a-fA-F]{6}$/.test(c[0]) ? c[0] : '#16325C', i = barInks(bar);
  return '--brand:' + c[0] + ';--brand-to:' + c[1] + ';--bar:' + bar + ';--bar-ink:' + i.ink + ';--bar-quiet:' + i.quiet + ';--bar-accent:' + i.accent + ';--bar-late:' + i.late + ';--bar-hover:' + i.hover + ';';
}
function frame(content, name) {
  lastProductRoute = UI.route.slice();
  UI.section = activeSection(name);
  const side = OPT.nav === 'side'
    ? '<nav class="side" aria-label="Processes sections"><div class="ws">Workspace<b>' + esc(S.ws.name) + '</b></div>' + sections().map(([r, l]) => '<a href="#" data-go="' + r + '"' + (r === UI.section ? ' class="on" aria-current="page"' : '') + '>' + l + '</a>').join('') + '<a href="#" data-go="export"' + (name === 'export' ? ' class="on"' : '') + '>Export Report</a>' + langSwitch() + '</nav>'
    : '';
  return '<div class="frame" style="' + brandVars() + '">' + topBar() + (side ? '<div class="body">' + side + '<div class="pg">' + content + '</div></div>' : '<div class="pg">' + content + '</div>') + '</div>';
}
/* the module's sections, as the masthead's own tabs (the Tracker's views row) */
function moduleTabs() {
  return sections().map(([r, l]) => '<a href="#" data-go="' + r + '"' + (r === UI.section ? ' class="on" aria-current="page"' : '') + '>' + l + (r === 'overview' && urgentCount() ? '<span class="cnt" title="Overdue, waiting to approve, or a risk with no control">' + urgentCount() + '</span>' : '') + '</a>').join('');
}
/* THE MASTHEAD, the Internal Tracker's band class for class (modules/tracker/page.ts .mast):
   navy, a gold rule under it, the gold line above the name, the counts on the
   right, and the views as tabs inside the band. Every page opens with one. */
function phead(title, o) {
  o = o || {};
  const tiles = o.tiles && o.tiles.length ? '<div class="mstrip">' + o.tiles.map((t) => { const [n, l, late, go] = t, tag = go ? 'button' : 'div', at = go ? ' type="button" ' + (go.indexOf('act:') === 0 ? 'data-act="' + go.slice(4) + '"' : 'data-go="' + go + '"') : ''; return '<' + tag + ' class="mtile' + (late ? ' late' : '') + '"' + at + '><b>' + n + '</b><span>' + l + '</span></' + tag + '>'; }).join('') + '</div>' : '';
  const tabs = o.tabs !== undefined ? o.tabs : (OPT.nav === 'top' ? moduleTabs() : '');
  const acts = o.acts || '';
  return '<header class="mast' + (tabs || acts ? '' : ' flat') + '"><div class="mrow"><div style="min-width:0"><p class="wkof">' + (o.eyebrow || esc(S.ws.name) + ' · Processes') + '</p><h1>' + title + '</h1>' + (o.sub ? '<p class="msub">' + o.sub + '</p>' : '') + '</div>' + tiles + '</div>' +
    (o.extra || '') + (tabs || acts ? '<nav class="mcats" aria-label="' + (o.tabsLabel || 'Processes sections') + '">' + tabs + '<span class="sp"></span><span class="mact">' + acts + '</span></nav>' : '') + '</header>';
}
function exportMenu(id) {
  return menuBtn(id || 'exp', 'Export', '<button class="mi" type="button" data-go="export">Report for several processes…<small>Pick processes, preview, print</small></button><button class="mi" type="button" data-act="sopAll">SOPs for every process<small>One document each, ready to print</small></button>', { cls: 'bq' });
}
ACT.sopAll = () => { UI.f.sopCodes = procs().filter((p) => p.steps.length).map((p) => p.code); go('sop~pack'); };
const newBtn = () => menuBtn('new', '+ New process', mi('Blank process', 'newProcess', '', 'Name, category, where it sits') + mi('Draft with AI', 'aiDraft', '', 'From your notes and the org chart\'s roles') + mi('Import from Excel', 'importXls', '', 'A whole process from the template'), { cls: 'btn gold' });

const urgentCount = () => attention().filter((x) => x.chip === 'bad' || x.chip === 'navy').length;
/* what needs attention: read off the data, used by the Overview and the section bar's count */
function attention() {
  const a = [];
  procs().forEach((p) => {
    if (overdue(p)) a.push({ chip: 'bad', word: 'Review overdue', p, line: 'Review was due ' + dt(p.nextReview) + ', ' + plural(-daysFrom(p.nextReview), 'day') + ' ago · owner ' + personName(p.owner), tab: 'lifecycle', w: 0 });
    if (p.status === 'IN_REVIEW') a.push({ chip: 'navy', word: 'Waiting to approve', p, line: 'v' + ((latestVersion(p) || { n: 0 }).n + 1) + ' sent to ' + personName(p.approver) + ' on ' + dt(p.sentAt) + ' · ' + plural(-daysFrom(p.sentAt), 'day'), tab: 'lifecycle', w: 1 });
    if (p.status === 'APPROVED') a.push({ chip: 'gold', word: 'Ready to publish', p, line: 'v' + latestVersion(p).n + ' approved by ' + latestVersion(p).by + ' on ' + dt(latestVersion(p).approvedAt) + '; staff still read v' + ((inForce(p) || { n: '—' }).n), tab: 'lifecycle', w: 2 });
    p.controls.filter((c) => !c.control).forEach((c) => a.push({ chip: 'bad', word: 'No control', p, line: (c.step ? 'Step ' + stepNo(p, c.step) + ' ' + stepById(p, c.step).label + ': ' : '') + '“' + c.risk + '” has no control', tab: 'risks', w: 3 }));
    const ri = raciIssues(p);
    if (!p.raci.final && ri.length && isDeep(p)) a.push({ chip: 'attn', word: 'RACI draft', p, line: plural(ri.length, 'activity', 'activities') + ' with ' + ri[0].issue + (ri.length > 1 ? ' and more' : ''), tab: 'raci', w: 4 });
    const f = inForce(p);
    if (f && (p.status === 'PUBLISHED' || p.status === 'APPROVED')) { const exp = expectedReaders(p), left = exp.filter((x) => p.acks.indexOf(x.id) < 0); if (left.length) a.push({ chip: 'attn', word: 'Not read', p, line: left.length + ' of ' + exp.length + ' have not confirmed v' + f.n, tab: 'lifecycle', w: 5 }); }
  });
  if (S.plan.status === 'SENT') a.push({ chip: 'navy', word: 'Plan with client', p: null, line: 'Deep-dive plan sent to ' + personName(S.plan.approver) + ' on ' + dt(S.plan.sentAt), go: 'priorities~signoff', w: 1 });
  return a.sort((x, y) => x.w - y.w);
}
