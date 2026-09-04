"""THE MOCKUP IS MADE OF THE REAL PLAN PANE (§41.9, rule 1c).

Not drawn from the stylesheet — driven. It opens the BUILT platform, walks to
Mobile's Strategy › Plan the way somebody walks there, opens the pen, and
injects each candidate into the LIVE Key measures table. Both sides of every
picture are the same build, so what is signed off is what the product will look
like rather than what its CSS could be made to do (§130.3's lesson).

THE CONTROLS ARE THE PLATFORM'S OWN. The boxes are `.fld.mono` — what the
target box already wears; the drawer is a full-width row inside a table, which
is `tr.dxband`'s own shape (§99); the key beside a target is `.repnote`'s
(§255); a target the platform now derives is DRAWN AND DISABLED, never merely
dimmed (§257, §220).

It also MEASURES, because the one question a picture cannot answer is whether
twelve boxes fit a pane that already runs out of room below 1100 (§158).

Writes PNGs into design-mockups/monthly-plan/shots/. It asserts nothing: it is
a camera with a tape measure. The check comes with the build.
"""
import pathlib, json
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
FILE = ROOT / "SMP-Project-Folder/src/strategy-management-platform.html"
OUT = ROOT / "design-mockups/monthly-plan/shots"
OUT.mkdir(parents=True, exist_ok=True)
CHROME = "/opt/pw-browsers/chromium"

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
# An ILLUSTRATION of one seasonal shape, not a claim about Raya's own trading:
# accessories weighted to the second half. It adds to the row's real 300M EGP.
PLAN = [15, 14, 16, 16, 17, 18, 24, 28, 32, 36, 40, 44]

# ── the styles the proposal would add, written in the platform's own tokens ──
CSS = """
tr.mprow > td { background:var(--surface-2); border-top:0; }
.mpwrap { padding:4px 2px 8px; }
.mphead { font-size:10px; letter-spacing:.12em; text-transform:uppercase;
          font-weight:700; color:var(--ink-3); margin:0 0 10px; }
.mphead em { font-style:normal; letter-spacing:0; text-transform:none;
             font-weight:500; font-size:12px; margin-left:8px; }
.mpgrid { display:flex; flex-wrap:wrap; gap:8px 6px; }
.mpm { display:flex; flex-direction:column; gap:3px; width:72px; }
.mpm span { font-size:10px; letter-spacing:.08em; text-transform:uppercase;
            color:var(--ink-3); text-align:center; }
.mpm input { width:72px !important; min-width:0 !important; text-align:right; }
.mpfoot { margin-top:11px; font-size:12px; color:var(--ink-3);
          display:flex; gap:14px; align-items:baseline; flex-wrap:wrap; }
.mpfoot b { color:var(--ink); font-weight:600; }
.mpfoot .part { color:var(--attn); font-weight:600; }
.mpbtn { font-size:11px; letter-spacing:.06em; text-transform:uppercase;
         font-weight:700; color:var(--ink-3); background:none;
         border:1px solid var(--line); border-radius:4px; padding:3px 8px;
         cursor:pointer; }
/* INLINE, so it costs the row no height. A button under the box would add
   ~24px to EVERY measure in the table (eight rows, ~190px on this pane); the
   target column has the width to give and the row has no height to spare. */
td.mptgt { display:flex; align-items:center; gap:8px; }
td.mptgt > input { flex:1; min-width:0; }
.mpopen { font-size:10px; letter-spacing:.1em; text-transform:uppercase;
          font-weight:700; color:var(--ink-3); background:none;
          border:1px solid var(--line); border-radius:4px; padding:4px 7px;
          cursor:pointer; white-space:nowrap; }
.mpopen.on { color:var(--ink); border-color:var(--ink-3);
             background:var(--surface-2); }
.mpkey { display:block; margin-top:5px; padding-left:8px;
         border-left:2px solid var(--line); font-size:10px; letter-spacing:.12em;
         text-transform:uppercase; font-weight:700; color:var(--ink-3);
         text-align:left; }
.mppanel { position:fixed; z-index:60; background:var(--surface);
           border:1px solid var(--line); border-radius:8px; padding:14px 16px;
           box-shadow:0 10px 30px rgba(0,0,0,.18); }
"""


def boxes(vals):
    out = ""
    for i, m in enumerate(MONTHS):
        v = "" if vals[i] is None else str(vals[i])
        out += ('<label class="mpm"><span>%s</span>'
                '<input class="fld mono" value="%s"></label>' % (m, v))
    return out


def drawer(vals, title):
    got = len([v for v in vals if v is not None])
    total = sum(v for v in vals if v is not None)
    if got == 12:
        foot = ('<b>12 of 12 months set</b>'
                '<span>Adds up to <b>300M EGP</b> &mdash; the annual target</span>'
                '<button class="mpbtn">Clear the monthly plan</button>')
    else:
        foot = ('<span class="part">%d of 12 months set &mdash; not in force yet</span>'
                '<span>Until all twelve are filled the target is still spread '
                'evenly. So far: %dM EGP</span>'
                '<button class="mpbtn">Clear the monthly plan</button>' % (got, total))
    return ('<tr class="mprow"><td class="idx"></td><td colspan="5">'
            '<div class="mpwrap"><div class="mphead">%s'
            '<em>in M EGP, the target’s own unit</em></div>'
            '<div class="mpgrid">%s</div><div class="mpfoot">%s</div></div>'
            '</td></tr>' % (title, boxes(vals), foot))


def shot(pg, sel, name):
    el = pg.query_selector(sel)
    if not el:
        print("  MISSING", sel, "->", name)
        return
    el.screenshot(path=str(OUT / (name + ".png")))
    print("  shot", name)


with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME,
                           args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1500, "height": 1200},
                    device_scale_factor=2)
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + str(FILE))
    pg.wait_for_timeout(1200)
    pg.select_option("#asWho", "smo")
    pg.wait_for_timeout(250)
    pg.click('#units button[data-u="mobile"]')
    pg.wait_for_timeout(500)

    # Pillar 03 carries the Sum revenue measures this proposal is about.
    pg.click('.rail [data-urail="mobile|03"]')
    pg.wait_for_timeout(400)
    pg.add_style_tag(content=CSS)

    # ── what the row reads TODAY, before the pen: the flat benchmark ────────
    print("today, reading:")
    here = pg.evaluate("""() => {
      const m = UNITS.mobile.items.find(p => p.code === '03')
                .measures.find(x => x.name.indexOf('Accessory') === 0);
      return { target:m.target, actual:m.actual, due:measureDueLabel(m),
               score:measureScore(m), elapsed:elapsedMonths(),
               asOf:reviewAsOfLabel() };
    }""")
    print("  ", json.dumps(here))

    pen = pg.query_selector('.pane .paneact .penbtn[data-page="plan"]')
    if not pen:
        print("no plan pen"); raise SystemExit(1)
    pen.click()
    pg.wait_for_timeout(600)

    # The Key measures table is the second miniTable in the pane (objectives
    # are on Foundation; this pane is measures then tactics).
    TBL = ".pane .scroll:has(table) table"
    tables = pg.query_selector_all(".pane table")
    print("  tables in pane:", len(tables))

    pg.evaluate("""() => {
      const t = [...document.querySelectorAll('.pane table')]
        .find(x => (x.querySelector('thead')||{}).textContent
                   && x.querySelector('thead').textContent.indexOf('Measure') >= 0);
      if (t) t.setAttribute('data-mp', 'measures');
    }""")
    MT = '.pane table[data-mp="measures"]'
    shot(pg, MT, "today-measures-edit")
    print("  before, one row:", json.dumps(pg.evaluate("""() => {
      const t = document.querySelector('.pane table[data-mp="measures"]');
      const row = [...t.querySelectorAll('tbody tr')]
        .find(r => { const i = r.querySelector('td:nth-child(2) textarea');
                     return i && i.value.indexOf('Non-Samsung') === 0; });
      const box = row.querySelector('td:nth-child(5) input');
      return { targetBox:Math.round(box.getBoundingClientRect().width),
               rowHeight:Math.round(row.getBoundingClientRect().height) };
    }""")))

    # Which row is Accessory revenue.
    idx = pg.evaluate("""() => {
      const t = document.querySelector('.pane table[data-mp="measures"]');
      const rows = [...t.querySelectorAll('tbody tr')];
      return rows.findIndex(r => {
        const i = r.querySelector('td:nth-child(2) textarea');
        return i && i.value.indexOf('Accessory') === 0;
      });
    }""")
    print("  accessory row index:", idx)

    # ── OPTION A — the drawer, complete ────────────────────────────────────
    pg.evaluate("""([html, i]) => {
      const t = document.querySelector('.pane table[data-mp="measures"]');
      const rows = [...t.querySelectorAll('tbody tr')];
      // EVERY measure gets the way in, or the first one could never be made
      // (§61) — so the cost of the control is visible on the whole table and
      // not only on the row that happens to use it.
      rows.forEach(r => {
        if (r.classList.contains('newrow')) return;
        const c = r.querySelector('td:nth-child(5)');
        if (!c || !c.querySelector('input')) return;
        c.classList.add('mptgt');
        c.insertAdjacentHTML('beforeend', '<button class="mpopen">Monthly</button>');
      });
      const row = rows[i];
      // The target box becomes the SUM, drawn and disabled (§257, §220), with
      // a key saying why — a value that changed shape has to say so.
      const tgt = row.querySelector('td:nth-child(5)');
      const inp = tgt.querySelector('input');
      // `.off` is what §257 already dims a target with — one idiom for "the
      // platform is answering this now", not a second one invented here.
      if (inp) { inp.value = '300M EGP'; inp.disabled = true;
                 inp.classList.add('off'); }
      // THE WAY IN IS IN THE TARGET CELL, because the monthly plan IS the
      // target — under Compiled it read as a second compile rule, and a key
      // beside it then said the same thing twice (§87's twins).
      const btn = tgt.querySelector('.mpopen');
      if (btn) { btn.classList.add('on'); btn.textContent = 'Monthly ▾'; }
      row.insertAdjacentHTML('afterend', html);
    }""", [drawer(PLAN, "Monthly plan &mdash; Accessory revenue"), idx])
    pg.wait_for_timeout(300)
    shot(pg, MT, "optionA-drawer-open")

    # WHAT THE CONTROL COSTS THE ROW, in pixels rather than in adjectives.
    print("  cost of the way in:", json.dumps(pg.evaluate("""() => {
      const t = document.querySelector('.pane table[data-mp="measures"]');
      const row = [...t.querySelectorAll('tbody tr')]
        .find(r => { const i = r.querySelector('td:nth-child(2) textarea');
                     return i && i.value.indexOf('Non-Samsung') === 0; });
      const chip = row.querySelector('.mpopen');
      const box = row.querySelector('td:nth-child(5) input');
      return { chip:Math.round(chip.getBoundingClientRect().width),
               targetBox:Math.round(box.getBoundingClientRect().width),
               rowHeight:Math.round(row.getBoundingClientRect().height),
               drawerHeight:Math.round(
                 document.querySelector('tr.mprow').getBoundingClientRect().height) };
    }""")))

    # ── the incomplete state, same drawer ──────────────────────────────────
    part = PLAN[:5] + [None] * 7
    pg.evaluate("""([html]) => {
      const old = document.querySelector('tr.mprow');
      old.insertAdjacentHTML('afterend', html);
      old.remove();
      // While it is not in force the annual target stays the AUTHORED one and
      // stays live — the whole point of "not in force" is that nothing has
      // been taken over yet (§61: never a box nobody can type in for a state
      // nobody chose).
      const row = document.querySelector('tr.mprow').previousElementSibling;
      const inp = row.querySelector('td:nth-child(5) input');
      if (inp) { inp.value = '300M EGP'; inp.disabled = false;
                 inp.classList.remove('off'); }
    }""", [drawer(part, "Monthly plan &mdash; Accessory revenue")])
    pg.wait_for_timeout(250)
    shot(pg, MT, "optionA-incomplete")

    # ── OPTION B — the floating panel, over the same table ─────────────────
    pg.evaluate("""([html]) => {
      document.querySelector('tr.mprow').remove();
      const row = [...document.querySelectorAll('.pane table[data-mp="measures"] tbody tr')]
        .find(r => { const i = r.querySelector('td:nth-child(2) textarea');
                     return i && i.value.indexOf('Accessory') === 0; });
      const inp = row.querySelector('td:nth-child(5) input');
      if (inp) { inp.value = '300M EGP'; inp.disabled = true;
                 inp.classList.add('off'); }
      const cell = row.querySelector('td:nth-child(5)');
      const r = cell.getBoundingClientRect();
      const p = document.createElement('div');
      p.className = 'mppanel';
      p.style.top = (r.bottom + 6) + 'px';
      p.style.left = Math.max(12, r.right - 470) + 'px';
      p.style.width = '470px';
      p.innerHTML = html;
      document.body.appendChild(p);
    }""", ['<div class="mphead">Monthly plan &mdash; Accessory revenue'
           '<em>in M EGP</em></div><div class="mpgrid">' + boxes(PLAN) +
           '</div><div class="mpfoot"><b>12 of 12 months set</b>'
           '<span>Adds up to <b>300M EGP</b></span>'
           '<button class="mpbtn">Clear</button></div>'])
    pg.wait_for_timeout(250)
    pg.screenshot(path=str(OUT / "optionB-panel.png"),
                  clip=pg.evaluate("""() => {
                    const t = document.querySelector('.pane table[data-mp="measures"]');
                    const r = t.getBoundingClientRect();
                    const p = document.querySelector('.mppanel').getBoundingClientRect();
                    const bot = Math.max(r.bottom, p.bottom) + 10;
                    return { x:r.x - 6, y:r.y - 6, width:r.width + 12,
                             height:Math.min(bot - r.y + 12, 1180 - r.y) };
                  }"""))
    print("  shot optionB-panel")

    # ── WHAT IT DOES TO THE READING (Performance) ──────────────────────────
    # The seasonal YTD target for the six months that have passed.
    ytd = sum(PLAN[:here["elapsed"]])
    pg.evaluate("""() => {
      const p = document.querySelector('.mppanel'); if (p) p.remove();
    }""")
    pg.evaluate("EDIT_PAGE.plan = false; paint();")
    pg.wait_for_timeout(400)
    pg.evaluate("""() => {
      const b = [...document.querySelectorAll('[data-sub], [data-sub2], .tabs button')]
        .find(x => (x.textContent || '').trim().indexOf('Performance') === 0);
      if (b) b.click();
    }""")
    pg.wait_for_timeout(600)
    pg.evaluate("""([ytd]) => {
      const t = [...document.querySelectorAll('.pane table, .capbody table')]
        .find(x => x.textContent.indexOf('Accessory revenue') >= 0);
      if (!t) return;
      t.setAttribute('data-mp', 'perf');
      const row = [...t.querySelectorAll('tbody tr')]
        .find(r => r.textContent.indexOf('Accessory revenue') >= 0);
      if (!row) return;
      row.setAttribute('data-mp', 'perfrow');
    }""", [ytd])
    shot(pg, '[data-mp="perf"]', "today-performance")
    pg.evaluate("""([ytd, pct]) => {
      const row = document.querySelector('[data-mp="perfrow"]');
      if (!row) return;
      const tds = row.querySelectorAll('td');
      const act = tds[tds.length - 2], fin = tds[tds.length - 1];
      act.innerHTML = '<span class="pair"><b>96M</b> <i>/ ' + ytd + 'M EGP</i></span>';
      fin.textContent = pct + '%';
      fin.style.color = 'var(--good)';
      // THE KEY GOES UNDER THE TARGET, NOT UNDER THE NAME. It is the target
      // whose meaning changed, and `.subhd` is already the platform's "a
      // second line in a data cell" (§254) — a `.repnote` under the name would
      // stack under a reporter's own note on any row that has one (§255).
      const tgt = tds[3];
      tgt.insertAdjacentHTML('beforeend',
        '<span class="subhd">by month</span>');
    }""", [ytd, round(96 / ytd * 100)])
    pg.wait_for_timeout(200)
    shot(pg, '[data-mp="perf"]', "after-performance")
    print("  seasonal YTD target at %s: %dM EGP  (flat: 150M) -> %d%% vs %d%%"
          % (here["asOf"], ytd, round(96 / ytd * 100), here["score"]))

    # ── DOES IT FIT (§158) ─────────────────────────────────────────────────
    print("fit, at four widths:")
    for w in (1600, 1500, 1280, 1100):
        pg.set_viewport_size({"width": w, "height": 1200})
        pg.wait_for_timeout(250)
        pg.evaluate("""() => {
          const b = [...document.querySelectorAll('[data-sub], [data-sub2], .tabs button')]
            .find(x => (x.textContent || '').trim().indexOf('Plan') === 0);
          if (b) b.click();
        }""")
        pg.wait_for_timeout(400)
        m = pg.evaluate("""() => {
          const pane = document.querySelector('.pane');
          if (!pane) return null;
          const t = [...pane.querySelectorAll('table')]
            .find(x => x.querySelector('thead') &&
                       x.querySelector('thead').textContent.indexOf('Measure') >= 0);
          const box = t ? t.parentElement : null;
          // twelve boxes of 72 with 6px gutters, plus the # column's indent
          const need = 12 * 72 + 11 * 6 + 40;
          return { pane:Math.round(pane.getBoundingClientRect().width),
                   table:t ? Math.round(t.getBoundingClientRect().width) : null,
                   box:box ? Math.round(box.clientWidth) : null,
                   overflows:t ? t.scrollWidth > box.clientWidth + 1 : null,
                   need:need };
        }""")
        rows = 1 if m and m["box"] and m["box"] >= m["need"] else 2
        print("   %5dpx  pane %s  table %s  table overflows: %s  "
              "twelve boxes need %s -> %d row%s"
              % (w, m["pane"], m["table"], m["overflows"], m["need"],
                 rows, "" if rows == 1 else "s"))

    print("page errors:", errs or "none")
    b.close()
