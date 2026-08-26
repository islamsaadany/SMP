# Drive the built platform, screenshot the Roles & access matrix as it is,
# inject the proposed Strategy|Reporting split, screenshot again; then a
# unit's Plan pane with the proposed Download-slides button injected.
import os, sys
from playwright.sync_api import sync_playwright

ROOT = "/home/user/SMP/SMP-Project-Folder"
OUT  = "/tmp/claude-0/-home-user-SMP/3392ed96-e42d-57c1-a4fe-d50f1f2bcccc/scratchpad"
URL  = "file://" + ROOT + "/strategy-management-platform-v3.22.html"
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"

# Proposed defaults for the split halves: [unit_strategy, unit_reporting, fn_strategy, fn_reporting]
SPLIT = {
  "super":     ["edit","edit","edit","edit"],
  "smoteam":   ["edit","edit","edit","edit"],
  "gceo":      ["view","view","view","view"],
  "cceo":      ["view","view","view","view"],
  "owner":     ["view","edit","view","view"],
  "custodian": ["view","edit","view","edit"],
  "fnhead":    [None,  None,  "view","edit"],   # no business unit
  "contrib":   ["view","view","view","view"],
  "employee":  ["view","view","view","view"],
}

INJECT_SPLIT = """
(SPLIT) => {
  const table = document.querySelector('.cfg.acgrid table');
  const theadRow = table.querySelector('thead tr');
  const ths = [...theadRow.children];           // Role, a_group, unit_own, unit_other, fn_own, fn_other, cycle, setup
  const mk = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
  const sub = document.createElement('tr');
  const subCell = (title) => mk('<th class="ac" style="font-size:10.5px;letter-spacing:.04em" title="'+title+'">'+(title.split(' \\u2014 ')[0])+'</th>');
  ths.forEach((th, i) => {
    if (i === 2 || i === 4) {                    // Own business unit / Own supporting function
      th.colSpan = 2;
      sub.appendChild(subCell('Strategy \\u2014 Foundation \\u00b7 Analysis & SWOT \\u00b7 Plan' + (i===4 ? ' \\u00b7 a capability\\u2019s definition & projects' : '')));
      sub.appendChild(subCell('Reporting \\u2014 enter figures \\u00b7 save drafts \\u00b7 submit'));
    } else {
      th.rowSpan = 2;
    }
  });
  theadRow.after(sub);

  const rows = [...table.querySelectorAll('tbody tr')];
  const tmpl = { };
  for (const tr of rows) for (const td of [...tr.children].slice(1)) {
    const lit = td.querySelector('.stbtn.on');
    const key = td.querySelector('.stset') ? (lit ? (lit.classList.contains('st-edit') ? 'edit' : 'view') : 'none')
                                           : 'na';
    if (!tmpl[key]) tmpl[key] = td.cloneNode(true);
  }
  const order = ['super','smoteam','gceo','cceo','owner','custodian','fnhead','contrib','employee'];
  rows.forEach((tr, ri) => {
    const conf = SPLIT[order[ri]];
    if (!conf) return;
    const cells = [...tr.children];              // 0 role, 1 group, 2 unit_own, 3 unit_other, 4 fn_own, ...
    const put = (oldCell, states) => {
      const a = (states[0] ? tmpl[states[0]] : tmpl['na']).cloneNode(true);
      const b = (states[1] ? tmpl[states[1]] : tmpl['na']).cloneNode(true);
      oldCell.replaceWith(a); a.after(b);
    };
    put(cells[4], [conf[2], conf[3]]);           // fn first so unit index stays valid
    put(cells[2], [conf[0], conf[1]]);
  });
  return rows.length;
}
"""

INJECT_BTN = """
() => {
  const slot = document.querySelector('.paneact');
  if (!slot) return 'no paneact';
  const b = document.createElement('button');
  b.className = 'penbtn';
  b.setAttribute('title', 'Download the plan as slides (.pptx)');
  b.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3v9M6.5 8.5L10 12l3.5-3.5M4 15.5h12"/></svg>';
  slot.prepend(b);
  return 'ok';
}
"""

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME)
    pg = browser.new_page(viewport={"width":1700,"height":1150})
    pg.goto(URL); pg.wait_for_timeout(1200)

    # -- Roles & access --
    pg.click('#units [data-md="setup"]'); pg.wait_for_timeout(300)
    pg.click('.setuprail [data-setupgo="access"]'); pg.wait_for_timeout(400)
    sec = pg.query_selector('.cfg.acgrid')
    sec.scroll_into_view_if_needed(); pg.wait_for_timeout(200)
    sec.screenshot(path=OUT+"/matrix-before.png")
    r = pg.evaluate(INJECT_SPLIT, SPLIT)
    pg.wait_for_timeout(200)
    pg.query_selector('.cfg.acgrid').screenshot(path=OUT+"/matrix-after.png")
    print("matrix rows:", r)

    # -- A unit's Plan pane with the download button --
    u = "mobile"
    pg.click('#units [data-u="'+u+'"]'); pg.wait_for_timeout(500)
    r2 = pg.evaluate(INJECT_BTN)
    print("unit:", u, "button:", r2)
    pane = pg.query_selector('.pane')
    pane.scroll_into_view_if_needed(); pg.wait_for_timeout(200)
    pg.screenshot(path=OUT+"/plan-pane.png", clip={"x":0,"y":0,"width":1700,"height":760})
    browser.close()
print("done")
