const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1100, height: 760 }, deviceScaleFactor: 2 });
  const errs = []; pg.on('pageerror', e => errs.push(String(e))); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await pg.goto('file://' + path.join(__dirname, '2026-10-24_strip-options-live.html')); await pg.waitForTimeout(800);
  await pg.mouse.wheel(0, 520); await pg.waitForTimeout(500);
  const shot = (n) => pg.screenshot({ path: path.join(__dirname, 'check', n + '.png'), clip: { x: 0, y: 0, width: 1100, height: 470 } });
  await shot('1-default-grey-seg-green');
  await pg.click('#mk input[name=fill][value=brand]'); await pg.waitForTimeout(150); await shot('2-brand-seg');
  await pg.click('#mk input[name=shape][value=cards]'); await pg.waitForTimeout(150); await shot('3-brand-cards');
  await pg.click('#mk .pre[data-bar="#6B1F2A"]'); await pg.waitForTimeout(150);
  await pg.click('#mk input[name=shape][value=seg]'); await pg.click('#mk input[name=fill][value=light]'); await pg.waitForTimeout(150); await shot('4-burgundy-light-seg');
  // press MB03 in the strip
  await pg.click('.rail:not(.setuprail) .ritem:nth-child(3)'); await pg.waitForTimeout(150); await shot('5-pressed-mb03');
  await pg.click('#mk input[name=fill][value=grey]'); await pg.click('#mk-dark'); await pg.waitForTimeout(200); await shot('6-dark-grey');
  await pg.click('#mk .pre[data-bar=""]'); await pg.click('#mk-dark'); await pg.click('#mk input[name=fill][value=today]'); await pg.click('#mk input[name=shape][value=today]'); await pg.waitForTimeout(200); await shot('7-house-today');
  const state = await pg.evaluate(() => ({ attrs: [...document.documentElement.attributes].map(a => a.name + '=' + a.value).join(' '), style: document.documentElement.getAttribute('style') }));
  console.log(state); console.log('errors:', errs.length ? errs : 'none');
  await b.close();
})();
