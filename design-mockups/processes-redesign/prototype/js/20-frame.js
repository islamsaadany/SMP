/* ══ FRAME ══════════════════════════════════════════════════════════════
   The drawing band (review controls, never the product), then the product's
   own chrome: SMP's white top bar, the grey section bar (or, as option B, the
   menu down the side), and one page-header shape for every page. */
const LOOKS = { office: 'Strategy Office (consultant)', staff: 'Dalia Sabry · staff, Sales coordinator', approver: 'Yara Kamal · approver, CFO' };
const LOOK_PERSON = { staff: 'p13', approver: 'p1' };
const OPTION_LIST = [
  ['nav', 1, 'Section bar along the top', 'Off shows option B: the left menu, restyled.', (v) => v === 'top', (on) => { OPT.nav = on ? 'top' : 'side'; }],
  ['brand', 1, 'Page titles in the client\'s colour', 'Option B of question 1. Off is SMP\'s plain title.', (v) => v, (on) => { OPT.brand = on; }],
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
function brandVars() { const c = S.ws.colors; return '--brand:' + c[0] + ';--brand-to:' + c[1] + ';'; }
function frame(content, name) {
  lastProductRoute = UI.route.slice();
  const on = activeSection(name), secs = sections();
  const nav = OPT.nav === 'top'
    ? '<nav class="sb" aria-label="Processes sections">' + secs.map(([r, l]) => '<a href="#" data-go="' + r + '"' + (r === on ? ' class="on" aria-current="page"' : '') + '>' + l + (r === 'overview' && urgentCount() ? '<span class="cnt" title="Overdue, waiting to approve, or a risk with no control">' + urgentCount() + '</span>' : '') + '</a>').join('') + langSwitch() + '</nav>'
    : '';
  const side = OPT.nav === 'side'
    ? '<nav class="side" aria-label="Processes sections"><div class="ws">Workspace<b>' + esc(S.ws.name) + '</b></div>' + secs.map(([r, l]) => '<a href="#" data-go="' + r + '"' + (r === on ? ' class="on" aria-current="page"' : '') + '>' + l + '</a>').join('') + '<a href="#" data-go="export"' + (name === 'export' ? ' class="on"' : '') + '>Export Report</a>' + langSwitch() + '</nav>'
    : '';
  return '<div class="frame" style="' + brandVars() + '">' + topBar() + nav + (side ? '<div class="body">' + side + '<div class="pg">' + content + '</div></div>' : '<div class="pg">' + content + '</div>') + '</div>';
}
function phead(title, o) {
  o = o || {};
  return '<div class="phead' + (OPT.brand ? ' brand' : '') + '"><div style="min-width:0"><div class="crumb">' + (o.crumb || '<a href="#" data-go="overview">' + esc(S.ws.name) + ' · Processes</a>') + '</div><h1>' + title + '</h1>' + (o.sub ? '<div class="sub">' + o.sub + '</div>' : '') + '</div>' + (o.acts ? '<div class="acts">' + o.acts + '</div>' : '') + '</div>';
}
function exportMenu(id) {
  return menuBtn(id || 'exp', 'Export', '<button class="mi" type="button" data-go="export">Report for several processes…<small>Pick processes, preview, print</small></button><button class="mi" type="button" data-act="sopAll">SOPs for every process<small>One document each, ready to print</small></button>');
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
