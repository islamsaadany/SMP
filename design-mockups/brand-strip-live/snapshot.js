// Dumps the real built page, rendered on Mobile > Plan with the welcome and
// tour dismissed, as script-free HTML: every <style> and the DOM as it stands,
// so the interactive mockup is the platform's own CSS on the platform's own
// markup. Also reports which rule paints the open Plan switch.
const { chromium } = require('playwright');
const fs = require('fs');
const FILE = '/home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html';
const INIT = "try{sessionStorage.setItem('smp.welcome.done','1');sessionStorage.setItem('smp.welcome.seen','1');sessionStorage.setItem('smp.tour.later','1');localStorage.setItem('smp.tour.never','1')}catch(e){}";
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1100, height: 760 } });
  await pg.addInitScript(INIT);
  await pg.goto('file://' + FILE); await pg.waitForTimeout(1400);
  await pg.click('[role=tab][data-u="mobile"]'); await pg.waitForTimeout(500);
  await pg.click('[role=tab][data-sub2="plan"]'); await pg.waitForTimeout(800);
  const info = await pg.evaluate(() => {
    const sel = document.querySelector('[role=tab][data-sub2="plan"][aria-selected="true"]');
    const out = { cls: sel && sel.parentElement.className, parent: sel && sel.parentElement.parentElement.className, rules: [] };
    for (const ss of document.styleSheets) {
      let rules; try { rules = ss.cssRules; } catch (e) { continue; }
      const walk = (rs) => { for (const r of rs) { if (r.cssRules) walk(r.cssRules); else if (r.selectorText && sel && sel.matches(r.selectorText) && /background/.test(r.cssText)) out.rules.push(r.cssText.slice(0, 200)); } };
      walk(rules);
    }
    document.querySelectorAll('script').forEach(s => s.remove());
    return { ...out, html: '<!doctype html>\n' + document.documentElement.outerHTML };
  });
  fs.writeFileSync('snapshot.html', info.html);
  console.log(info.cls, '|', info.parent); info.rules.forEach(r => console.log(' -', r));
  console.log('bytes', info.html.length);
  await b.close();
})();
