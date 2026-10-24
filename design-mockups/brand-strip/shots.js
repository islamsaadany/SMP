// Mockup shots: the squeezed strip of directions wears the TENANT'S colours
// and shows where one direction ends and the next begins. Drives the REAL
// built platform, paints a tenant brand the way the Branding page does (the
// same eight tokens brandTokens() writes), and adds each option's CSS to the
// live page. Not a check; lives beside the mockup it makes.
const { chromium } = require('playwright');
const path = require('path');
const FILE = '/home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html';
const OUT = path.join(__dirname, 'shots');
const INIT = "try{sessionStorage.setItem('smp.welcome.done','1');sessionStorage.setItem('smp.welcome.seen','1');sessionStorage.setItem('smp.tour.later','1');localStorage.setItem('smp.tour.never','1')}catch(e){}";

// A tenant whose bar is green and whose accent is amber — far from the house
// navy, so the strip's borrowed navy is unmistakable.
const BRAND = { '--panel':'#1F5C3F', '--panel-ink':'#FFFFFF', '--panel-quiet':'#9DC2AE', '--panel-hover':'#2E6A4E',
  '--gold':'#D08A1E', '--gold-deep':'#8A5A0E', '--on-accent':'#14161A', '--accent-glow':'rgba(208,138,30,.22)' };

const R = '.split:not(.setupsplit) > .rail:not(.setuprail)';
const M = (css) => `@media (max-width:1200px){${css}}`;

// The colour fix every option but C shares: the open item and the outer line
// take the tenant's bar, not the palette's --stone.
const BRANDFILL = M(`
  ${R} { border-color:var(--panel); }
  ${R} button.ritem.on, ${R} button.ritem.on:hover { background:var(--panel); border-bottom-color:var(--gold); }
  ${R} .ritem.on .rcode, ${R} .ritem.on b { color:var(--panel-ink); }
  ${R} .ritem.on .grip i { background:var(--panel-ink); }`);

// A · one card, segmented: a hairline between neighbours, full height.
const A = BRANDFILL + M(`
  ${R} .sortable { gap:0; }
  ${R} .sortable > button.ritem:not(:first-child) { border-left:1px solid var(--line); }
  ${R} .sortable > button.ritem.on, ${R} .sortable > button.ritem.on + button.ritem { border-left-color:transparent; }`);

// A2 · as A, the hairline inset top and bottom (a tab-bar reading).
const A2 = BRANDFILL + M(`
  ${R} .sortable { gap:0; }
  ${R} .sortable > button.ritem:not(:first-child)::before { content:""; position:absolute; left:0; top:9px; bottom:9px; width:1px; background:var(--line); }
  ${R} .sortable > button.ritem.on::before, ${R} .sortable > button.ritem.on + button.ritem::before { display:none; }`);

// B · each direction its own card on the page's ground; the open one filled.
const B = M(`
  ${R} { border-color:transparent; background:var(--ground); }
  ${R} .sortable { gap:8px; }
  ${R} .sortable > button.ritem { border:1px solid var(--line); border-radius:var(--r); background:var(--surface); }
  ${R} .sortable > button.ritem:hover { background:var(--surface-2); }
  ${R} .sortable > button.ritem.on, ${R} .sortable > button.ritem.on:hover { background:var(--panel); border-color:var(--panel); box-shadow:inset 0 -3px 0 var(--gold); }
  ${R} .ritem.on .rcode, ${R} .ritem.on b { color:var(--panel-ink); }
  ${R} .ritem.on .grip i { background:var(--panel-ink); }`);

// C · no fill: the open one is the tenant's bar colour as TYPE, on its own
// white, under a 3px edge in the accent; hairlines between all.
const C = M(`
  ${R} { border-color:var(--line); }
  ${R} .sortable { gap:0; }
  ${R} .sortable > button.ritem:not(:first-child) { border-left:1px solid var(--line); }
  ${R} button.ritem.on, ${R} button.ritem.on:hover { background:var(--surface); border-bottom-color:var(--gold); }
  ${R} .ritem.on .rcode, ${R} .ritem.on b { color:var(--panel); }
  ${R} .ritem.on b { font-weight:700; }
  ${R} .ritem.on .rnum:not(:has(.rtally)), ${R} .ritem.on .rgap { background:var(--surface-2); }`);

// D · the ACCENT as the fill (the tenant's second colour), as separate cards.
const D = M(`
  ${R} { border-color:transparent; background:var(--ground); }
  ${R} .sortable { gap:8px; }
  ${R} .sortable > button.ritem { border:1px solid var(--line); border-radius:var(--r); background:var(--surface); }
  ${R} .sortable > button.ritem.on, ${R} .sortable > button.ritem.on:hover { background:var(--gold); border-color:var(--gold); box-shadow:none; }
  ${R} .ritem.on .rcode, ${R} .ritem.on b { color:var(--on-accent); }`);

// E · a NEUTRAL dark grey as the fill (the palette's second ink), with the
// tenant showing only in the accent edge and the chrome around it.
const SEG = M(`
  ${R} .sortable { gap:0; }
  ${R} .sortable > button.ritem:not(:first-child) { border-left:1px solid var(--line); }
  ${R} .sortable > button.ritem.on, ${R} .sortable > button.ritem.on + button.ritem { border-left-color:transparent; }`);
const E = SEG + M(`
  ${R} { border-color:var(--ink-2); }
  ${R} button.ritem.on, ${R} button.ritem.on:hover { background:var(--ink-2); border-bottom-color:var(--gold); }
  ${R} .ritem.on .rcode, ${R} .ritem.on b { color:var(--surface); }
  ${R} .ritem.on .grip i { background:var(--surface); }`);
// E2 · as E, the outer line left as the quiet hairline it is today.
const E2 = SEG + M(`
  ${R} { border-color:var(--line); }
  ${R} button.ritem.on, ${R} button.ritem.on:hover { background:var(--ink-2); border-bottom-color:var(--gold); }
  ${R} .ritem.on .rcode, ${R} .ritem.on b { color:var(--surface); }
  ${R} .ritem.on .grip i { background:var(--surface); }`);
// F · a LIGHT grey fill, dark type: the quietest filled reading.
const F = SEG + M(`
  ${R} { border-color:var(--line); }
  ${R} button.ritem.on, ${R} button.ritem.on:hover { background:color-mix(in srgb, var(--ink) 11%, var(--surface)); border-bottom-color:var(--gold); }
  ${R} .ritem.on .rcode, ${R} .ritem.on b { color:var(--ink); }
  ${R} .ritem.on b { font-weight:700; }
  ${R} .ritem.on .grip i { background:var(--ink); }`);
const OPTIONS = { 'e-darkgrey': E, 'e2-darkgrey-hairline': E2, 'f-lightgrey': F, today: '', 'a-segmented': A, 'a2-inset': A2, 'b-cards': B, 'c-underline': C, 'd-accent': D };

async function open(b, w, sub, h = 760) {
  const pg = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await pg.addInitScript(INIT);
  await pg.goto('file://' + FILE); await pg.waitForTimeout(1400);
  await pg.click('[role=tab][data-u="mobile"]'); await pg.waitForTimeout(500);
  if (sub) { await pg.click('[role=tab][data-s="' + sub + '"]'); }
  else { await pg.click('[role=tab][data-sub2="plan"]'); }
  await pg.waitForTimeout(600);
  await pg.evaluate((t) => { for (const k in t) document.documentElement.style.setProperty(k, t[k]); }, BRAND);
  return pg;
}
async function shoot(pg, name, y = 520) {
  if (y) { await pg.mouse.wheel(0, y); await pg.waitForTimeout(700); }
  const w = pg.viewportSize().width;
  await pg.screenshot({ path: path.join(OUT, name + '.png'), clip: { x: 0, y: 0, width: w, height: 470 } });
}
(async () => {
  const b = await chromium.launch();
  const only = process.argv[2];
  for (const [key, css] of Object.entries(OPTIONS)) {
    if (only && !key.startsWith(only)) continue;
    const sizes = key === 'today' ? [[1100, null]] : [[1100, null], [760, null]];
    if (key === 'a-segmented') sizes.push([1100, 'performance']);
    for (const [w, sub] of sizes) {
      const pg = await open(b, w, sub);
      if (css) { await pg.addStyleTag({ content: css }); await pg.waitForTimeout(250); }
      await shoot(pg, `${key}-${sub || 'plan'}-${w}`);
      await pg.close();
    }
  }
  await b.close(); console.log('done');
})();
