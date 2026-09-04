"""HOW BIG SHOULD THE WAY IN BE (§261.2, rule 1c).

Islam, of what §261 shipped: *"the button montthly is big. do you suggest other
options for it's setting or placement?"*

Four treatments injected into the LIVE Key measures table with the pen open —
same build, same row, same width, so what differs between the pictures is the
control and nothing else (§41.9, §130.3: a mockup drawn from the stylesheet is
drawn from what the product COULD look like, not what it does).

EACH IS DRAWN IN BOTH STATES. A row with a monthly plan has to stay visibly
different from one without, or the office cannot see at a glance which of eight
measures carries one — so every option is shot with row 4 lit and the other
seven not. An option that is small and cannot say "this one is set" has not
solved the problem, it has moved it.

Writes PNGs into design-mockups/monthly-chip/shots/ and prints the pixels.
"""
import pathlib, json
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
FILE = ROOT / "SMP-Project-Folder/src/strategy-management-platform.html"
OUT = ROOT / "design-mockups/monthly-chip/shots"
OUT.mkdir(parents=True, exist_ok=True)
CHROME = "/opt/pw-browsers/chromium"
PLAN = [15, 14, 16, 16, 17, 18, 24, 28, 32, 36, 40, 44]

# Twelve cells: four columns, three rows. It says "a year by month" without a
# word, and it is DRAWN rather than a font character — a glyph that is mapped
# and not drawn ships as a blank box (§52, §120.2, §185).
GRID = ('<svg viewBox="0 0 16 14" aria-hidden="true">'
        '<g fill="currentColor">' +
        "".join('<rect x="%d" y="%d" width="3" height="3" rx=".6"/>'
                % (1 + c * 4, 1 + r * 4) for r in range(3) for c in range(4)) +
        '</g></svg>')

CSS = """
/* the cell, shared by every option */
td[data-mp] { display:flex; align-items:center; gap:8px; }
td[data-mp] > input.fld { flex:1; min-width:0; }

/* 1 — TODAY: 72px, bordered, uppercase, on every row */
.opt1 { font-size:10px; letter-spacing:.1em; text-transform:uppercase;
        font-weight:700; color:var(--ink-3); background:none;
        border:1px solid var(--line); border-radius:4px; padding:4px 7px;
        cursor:pointer; white-space:nowrap; }
.opt1.on { color:var(--ink); border-color:var(--ink-3); background:var(--surface-2); }

/* 2 — THE WORD, QUIET: no box, sentence case, the platform's own link button */
.opt2 { font:inherit; font-size:12px; color:var(--ink-3); background:none;
        border:0; padding:2px 0; cursor:pointer; white-space:nowrap;
        text-decoration:underline; text-underline-offset:3px;
        text-decoration-color:var(--line); }
.opt2:hover { color:var(--ink-2); text-decoration-color:var(--ink-3); }
.opt2.on { color:var(--ink); font-weight:600; text-decoration-color:var(--ink-3); }

/* 3 — A MARK, the size of the eye beside the name (24x22, §233's own control) */
.opt3 { width:24px; height:22px; border:1px solid transparent; border-radius:6px;
        background:none; color:var(--ink-3); cursor:pointer; padding:2px 3px;
        display:inline-block; flex:0 0 auto; }
.opt3:hover { background:var(--surface-2); color:var(--ink); }
.opt3.on { background:var(--attn-bg); border-color:var(--attn-bg); color:var(--attn-tx); }
.opt3 svg { width:16px; height:14px; display:block; }

/* 4 — A CARET on the box, the shape a disclosure has everywhere */
.opt4 { font:inherit; font-size:11px; line-height:1; color:var(--ink-3);
        background:none; border:0; padding:4px 3px; cursor:pointer;
        flex:0 0 auto; }
.opt4:hover { color:var(--ink); }
.opt4.on { color:var(--ink); font-weight:700; }
"""

OPTS = [
    ("opt1", "Today — a bordered uppercase chip",
     lambda on: '<button class="opt1%s">Monthly%s</button>' % (" on" if on else "", " ▾" if on else "")),
    ("opt2", "The word, quiet",
     lambda on: '<button class="opt2%s">Monthly</button>' % (" on" if on else "")),
    ("opt3", "A mark, the size of the eye",
     lambda on: '<button class="opt3%s" title="Set a target for each month">%s</button>'
                % (" on" if on else "", GRID)),
    ("opt4", "A caret on the box",
     lambda on: '<button class="opt4%s" title="Set a target for each month">▾</button>'
                % (" on" if on else "")),
]


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
    pg = b.new_page(viewport={"width": 1600, "height": 1100},
                    device_scale_factor=2)
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + str(FILE))
    pg.wait_for_timeout(1300)
    pg.select_option("#asWho", "smo")
    pg.wait_for_timeout(250)
    # A monthly plan on ONE row, so every option can be shot lit and unlit at once.
    pg.evaluate("""(plan) => {
      const m = UNITS.mobile.items.find(p => p.code === '03')
                .measures.find(x => x.name.indexOf('Accessory') === 0);
      m.monthly = plan.slice();
    }""", PLAN)
    pg.click('#units button[data-u="mobile"]')
    pg.wait_for_timeout(450)
    pg.click('.rail [data-urail="mobile|03"]')
    pg.wait_for_timeout(400)
    pg.click('.pane .paneact .penbtn[data-page="plan"]')
    pg.wait_for_timeout(600)
    pg.add_style_tag(content=CSS)

    pg.evaluate("""() => {
      const t = [...document.querySelectorAll('.pane table')]
        .find(x => x.querySelector('thead') &&
                   x.querySelector('thead').textContent.indexOf('Measure') >= 0);
      t.setAttribute('data-mptbl', '1');
      // strip what §261 shipped, so each option is drawn into the same clean row
      t.querySelectorAll('.mpopen').forEach(b => b.remove());
      t.querySelectorAll('td[data-mptgt]').forEach(td => {
        td.removeAttribute('data-mptgt'); td.removeAttribute('data-mplock');
      });
      const dr = t.querySelector('tr.mprow'); if (dr) dr.remove();
    }""")
    TBL = '.pane table[data-mptbl="1"]'

    for cls, label, build in OPTS:
        r = pg.evaluate("""([cls, htmlOff, htmlOn]) => {
          const t = document.querySelector('.pane table[data-mptbl="1"]');
          const rows = [...t.querySelectorAll('tbody tr')]
            .filter(r => !r.classList.contains('newrow'));
          rows.forEach(r => {
            const c = r.querySelector('td:nth-child(5)');
            if (!c || !c.querySelector('input')) return;
            const old = c.querySelector('button'); if (old) old.remove();
            c.setAttribute('data-mp', '1');
            const n = r.querySelector('td:nth-child(2) textarea');
            const lit = n && n.value.indexOf('Accessory') === 0;
            c.insertAdjacentHTML('beforeend', lit ? htmlOn : htmlOff);
          });
          // what it costs, in pixels
          const plain = rows.find(r => {
            const n = r.querySelector('td:nth-child(2) textarea');
            return n && n.value.indexOf('Non-Samsung') === 0; });
          const btn = plain.querySelector('td:nth-child(5) button');
          const box = plain.querySelector('td:nth-child(5) input');
          return { control: Math.round(btn.getBoundingClientRect().width),
                   box: Math.round(box.getBoundingClientRect().width),
                   row: Math.round(plain.getBoundingClientRect().height),
                   table: Math.round(t.getBoundingClientRect().width) };
        }""", [cls, build(False), build(True)])
        pg.wait_for_timeout(200)
        shot(pg, TBL, cls)
        print("  %-6s %-34s control %3dpx · target box %3dpx · row %2dpx"
              % (cls, label, r["control"], r["box"], r["row"]))

    # And with the pen SHUT, so the reading view is on the record too: none of
    # these is drawn there, which is the same on every option and worth showing.
    pg.evaluate("EDIT_PAGE.plan = false; paint();")
    pg.wait_for_timeout(400)
    pg.evaluate("""() => {
      const t = [...document.querySelectorAll('.pane table')]
        .find(x => x.querySelector('thead') &&
                   x.querySelector('thead').textContent.indexOf('Measure') >= 0);
      if (t) t.setAttribute('data-mptbl', '1');
    }""")
    shot(pg, TBL, "reading")

    print("page errors:", errs or "none")
    b.close()
