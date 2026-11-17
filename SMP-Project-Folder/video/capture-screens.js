const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  const errs=[]; pg.on('pageerror', e=>errs.push(String(e)));
  await pg.goto('file:///home/user/SMP/SMP-Project-Folder/strategy-management-platform-v3.22.html');
  await pg.waitForTimeout(1200);
  const tabs = async () => pg.evaluate(()=>[...document.querySelectorAll('#subtabs button, #secrow-in button')].map(e=>e.textContent.trim()+(e.getAttribute('aria-selected')==='true'?'*':'')));
  const clickTab = async (t) => { const el = await pg.$(`#subtabs button:text-is("${t}")`); if (el) { await el.click(); await pg.waitForTimeout(500); return true;} return false; };
  const shot = async (n) => { await pg.screenshot({ path: `shots/${n}.png` }); console.log('shot', n, JSON.stringify(await tabs())); };
  const viewAs = async (label, n) => {
    await pg.selectOption('#asWho', { label }); await pg.waitForTimeout(900);
    const reading = await pg.evaluate(()=>{const r=document.getElementById('readroot'); return !!(r&&r.classList.contains('on'));});
    if (reading) { await shot(n+'-reading'); 
      const rt = await pg.evaluate(()=>[...document.querySelectorAll('#readroot [data-rtab]')].map(e=>e.dataset.rtab+'|'+e.textContent.trim()));
      console.log('reading tabs', rt);
      for (const t of rt.map(x=>x.split('|')[0])) { await pg.click(`#readroot [data-rtab="${t}"]`); await pg.waitForTimeout(400); await shot(n+'-reading-'+t); }
      await pg.keyboard.press('Escape'); await pg.waitForTimeout(400); }
  };
  await viewAs('Ashraf Laithy — Mobile', '10-mobile');
  await pg.click('#units button[data-u="mobile"]'); await pg.waitForTimeout(500);
  await shot('10-mobile-strategy');
  for (const t of ['Performance','Focus','Temple','Reporting']) { if (await clickTab(t)) await shot('11-mobile-'+t.toLowerCase()); }
  await clickTab('Strategy');
  const secs = await pg.evaluate(()=>[...document.querySelectorAll('#secrow-in button')].map(e=>e.textContent.trim()));
  console.log('secrow', secs);
  for (const s of secs) { const el = await pg.$(`#secrow-in button:text-is("${s}")`); if (el) { await el.click(); await pg.waitForTimeout(500); await shot('12-mobile-sec-'+s.toLowerCase().replace(/[^a-z]+/g,'')); } }
  await viewAs('Group CEO — the group', '20-ceo');
  await pg.click('#topsel > summary').catch(()=>{}); await pg.waitForTimeout(200);
  await pg.click('#topsel [data-u="group"]').catch(e=>console.log('group fail', e.message)); await pg.waitForTimeout(600);
  await shot('20-group-strategy');
  for (const t of ['Performance','Focus']) { if (await clickTab(t)) await shot('21-group-'+t.toLowerCase()); }
  const fold = await pg.$('#units [data-fold="fns"]'); if (fold) { await fold.click(); await pg.waitForTimeout(400); }
  const fns = await pg.evaluate(()=>[...document.querySelectorAll('#units button[data-u]')].filter(e=>e.checkVisibility&&e.checkVisibility()).map(e=>e.dataset.u+'|'+e.textContent.trim()));
  console.log('fns', fns);
  await shot('30-functions-list');
  await viewAs('Mohamed Essam — the group', '40-office');
  await shot('40-office');
  console.log('errs', errs);
  await b.close();
})();
