"""THE MOCKUP IS MADE OF THE REAL REPORTING PANE (rule 1c, §41.9).

Not drawn from the stylesheet — driven. It opens the BUILT platform, walks to
Mobile's Reporting tab the way somebody walks there, and shoots the pane twice:
as it is today, and with the proposed cell rewritten USING THE PLATFORM'S OWN
FUNCTIONS (`measureDueLabel`, `tgtShown`) into the markup the tactics table on
that same page already emits (`.subhd` for the "of …" line). Both sides are the
same build, so what is signed off is what the product will look like.

IT MAKES THE AWKWARD ROWS ON PURPOSE (§245, §273.3): a mockup drawn on the one
dataset the layout survives is a mockup that proves nothing. The table carries
a row that prorates flat, a row built by month, a row that does NOT prorate, a
yes/no row and a row with no target — because four of those must come out of
this change completely unchanged, and a picture that only shows the case being
fixed hides the cost.

It also MEASURES (§158: fit, never "and it scrolls").

Writes PNGs and a measurements file into design-mockups/reporting-ytd-target/.
It asserts nothing: it is a camera with a tape measure.
"""
import pathlib, json, os
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path("/home/user/SMP")
FILE = ROOT / "SMP-Project-Folder/src/strategy-management-platform.html"
OUT = ROOT / "design-mockups/reporting-ytd-target/shots"
OUT.mkdir(parents=True, exist_ok=True)
CHROME = "/opt/pw-browsers/chromium"

# A market share climbing to 30 by December — Islam's own case: a % target,
# built by month, compiled by Latest. Month 6 (the cycle's review point) is 29.
SHARE = [25, 26, 27, 27, 28, 29, 29, 30, 30, 30, 30, 30]
# And a seasonal revenue shape, weighted to the second half, adding to the
# row's own real 300M EGP — an ILLUSTRATION, not a claim about Raya's trading.
ACC = [15, 14, 16, 16, 17, 18, 24, 28, 32, 36, 40, 44]

# ── THE PROPOSED CELL, IN THE TACTICS TABLE'S OWN MARKUP ────────────────────
# Line for line what `reportPillarPane`'s tactic row already emits for its
# "YTD Target" column: the benchmark, and under it what that is a part of,
# drawn only when the two DIFFER — so a row that does not prorate keeps
# exactly the one number it shows today (§53.5, no new vocabulary).
PROPOSE = """() => {
  const byName = {};
  UNITS.mobile.keyObjectives.forEach(m => { byName[m.name] = m; });
  UNITS.mobile.items.forEach(p => (p.measures||[]).forEach(m => { byName[m.name] = m; }));
  const out = [];
  [...document.querySelectorAll('#panel table')].forEach(t => {
    const th = [...t.querySelectorAll('thead th')].map(x => x.textContent.trim());
    const col = th.indexOf('Target');
    if (col < 0) return;
    if (!(th.indexOf('Measure') >= 0 || th.indexOf('Key Objectives') >= 0
          || th.indexOf('Objective') >= 0)) return;
    t.querySelectorAll('thead th')[col].textContent = 'YTD Target';
    [...t.querySelectorAll('tbody tr')].forEach(r => {
      const tds = r.querySelectorAll('td');
      if (tds.length <= col) return;
      const nm = tds[1].innerText.trim().split('\\n')[0];
      const m = byName[nm];
      if (!m) return;
      if (!m.target) return;                       /* Missing stays Missing */
      const bench = measureDueLabel(m);            /* the platform's own */
      const due   = measureDue(m);
      const whole = tgtShown(m.target);
      /* THE TEST IS THE VALUE, NEVER THE STRING. `measureDueLabel` rebuilds
         the number through `joinTarget`, which drops a thousands separator —
         so a row that does not prorate at all came out as `4500 of 4,500`,
         a second line saying nothing and a figure re-spelt on the way (the
         §254.1 family). A row whose benchmark IS its annual target is drawn
         byte-identically to today. */
      const num = parseFloat(String(splitTarget(String(m.target)).value)
                    .replace(/,/g, ""));
      const moved = bench != null && due != null && isFinite(num) &&
                    Math.abs(due - num) > 1e-9;
      tds[col].innerHTML = moved
        ? bench + '<span class="subhd">of ' + whole + '</span>' : whole;
      out.push({ row: nm, today: whole, moved: moved,
                 proposed: tds[col].innerText.replace(/\\n/g,' · ') });
    });
  });
  return out;
}"""


def shot(pg, sel, path):
    el = pg.query_selector(sel)
    if el:
        el.screenshot(path=str(path))
        return True
    return False


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME,
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1600, "height": 2100},
                    device_scale_factor=2)
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + str(FILE))
    pg.wait_for_timeout(1500)
    pg.select_option("#asWho", "smo")
    pg.wait_for_timeout(300)

    # ── MAKE THE FIVE SHAPES (§245) ────────────────────────────────────
    made = pg.evaluate("""(d) => {
      const pil = UNITS.mobile.items.find(p => p.code === '03');
      const by = n => pil.measures.find(m => m.name.indexOf(n) === 0);
      /* 1 · built by month, compiled by Latest — Islam's own case */
      const sh = by('Samsung market share');
      sh.monthly = d.share.slice(); sh.compile = 'Latest'; sh.target = '30%';
      /* 2 · built by month, compiled by Sum */
      const ac = by('Accessory revenue');
      ac.monthly = d.acc.slice(); ac.compile = 'Sum'; ac.target = '300M EGP';
      /* 3 · a yes/no row, and 4 · a row with no target — both must come out
         of this unchanged, and the demo carries neither (§255). */
      pil.measures.splice(5, 0,
        { id:'mock-yn', name:'Regional licence secured', dir:'\\u2265',
          target:'Y/N', compile:'Latest', actual:'Yes' },
        { id:'mock-none', name:'Warehouse throughput', dir:'\\u2265',
          target:'', compile:'Sum', actual:'' });
      return { month: monthOfYear(), asOf: reviewAsOfLabel(),
               shareDue: measureDueLabel(sh), accDue: measureDueLabel(ac),
               rows: pil.measures.length };
    }""", {"share": SHARE, "acc": ACC})
    print("made:", made)

    pg.evaluate("() => document.querySelector('#units button[data-u=\"mobile\"]').click()")
    pg.wait_for_timeout(600)
    pg.evaluate("""() => { const b=[...document.querySelectorAll('#subtabs button, .tabs button')]
       .find(x=>/^Reporting/i.test(x.textContent.trim())); if(b) b.click(); }""")
    pg.wait_for_timeout(800)
    pg.evaluate("""() => { const r=document.querySelector('.rail [data-urail="mobile|03"]');
       if(r) r.click(); }""")
    pg.wait_for_timeout(700)

    PANE = '#panel .pane, #panel .split .pane, #panel'
    MTAB = """() => { const t=[...document.querySelectorAll('#panel table')]
        .find(x=>x.querySelector('thead') && /Measure/.test(x.querySelector('thead').textContent));
        return t ? (t.dataset.mk='1', true) : false; }"""
    pg.evaluate(MTAB)

    measure = """() => {
      const t = document.querySelector('[data-mk="1"]');
      if (!t) return { gone: true };
      const pane = t.closest('.pane') || t.parentElement;
      const th = [...t.querySelectorAll('thead th')];
      const col = th.findIndex(x=>/Target/.test(x.textContent));
      return { tableW: Math.round(t.getBoundingClientRect().width),
               paneW: Math.round(pane.getBoundingClientRect().width),
               scrollW: t.scrollWidth, clientW: t.parentElement.clientWidth,
               targetColW: Math.round(th[col].getBoundingClientRect().width),
               nameColW: Math.round(th[1].getBoundingClientRect().width),
               rowH: [...t.querySelectorAll('tbody tr')]
                       .map(r=>Math.round(r.getBoundingClientRect().height)),
               tallest: Math.max(...[...t.querySelectorAll('tbody tr')]
                       .map(r=>r.getBoundingClientRect().height)) };
    }"""
    before = pg.evaluate(measure)
    shot(pg, '[data-mk="1"]', OUT / "today-measures.png")
    shot(pg, PANE.split(",")[0].strip(), OUT / "today-pane.png")

    rows = pg.evaluate(PROPOSE)
    pg.wait_for_timeout(300)
    after = pg.evaluate(measure)
    shot(pg, '[data-mk="1"]', OUT / "proposed-measures.png")
    shot(pg, PANE.split(",")[0].strip(), OUT / "proposed-pane.png")

    # the tactics table on the SAME page, which already does this
    pg.evaluate("""() => { const t=[...document.querySelectorAll('#panel table')]
        .find(x=>x.querySelector('thead') && /YTD Target/.test(x.querySelector('thead').textContent)
                 && /Tactic/.test(x.querySelector('thead').textContent));
        if(t) t.dataset.mk2='1'; }""")
    shot(pg, '[data-mk2="1"]', OUT / "tactics-today.png")

    # dark, because a treatment that only holds in one palette is half a
    # treatment (§38.5) — and the narrow window, because §158 is a rule
    pg.evaluate("() => document.documentElement.setAttribute('data-theme','dark')")
    pg.wait_for_timeout(400)
    shot(pg, '[data-mk="1"]', OUT / "proposed-measures-dark.png")
    pg.evaluate("() => document.documentElement.setAttribute('data-theme','light')")
    pg.wait_for_timeout(300)

    # A RESIZE CAN REPAINT (§267's tail fold watches the window), and a repaint
    # rebuilds the pane — so the marker and the rewrite are re-applied at each
    # width rather than assumed to have survived. The first run of this file
    # died on exactly that.
    fits = {}
    for w in (1600, 1440, 1280, 1100, 1000):
        pg.set_viewport_size({"width": w, "height": 2100})
        pg.wait_for_timeout(500)
        pg.evaluate(MTAB)
        pg.evaluate(PROPOSE)
        pg.wait_for_timeout(200)
        fits[w] = pg.evaluate(measure)
    pg.set_viewport_size({"width": 1600, "height": 2100})
    pg.wait_for_timeout(400)
    shot(pg, '[data-mk="1"]', OUT / "proposed-measures.png")

    (OUT.parent / "measurements.json").write_text(json.dumps(
        {"made": made, "rows": rows, "before": before, "after": after,
         "fits": fits, "errors": errs[:5]}, indent=1))
    print("\nrows:")
    for r in rows:
        print("   %-32s today %-14s proposed %s" % (r["row"], r["today"], r["proposed"]))
    print("\nbefore:", {k: before[k] for k in ("tableW","paneW","targetColW","nameColW","tallest")})
    print("after :", {k: after[k] for k in ("tableW","paneW","targetColW","nameColW","tallest")})
    print("\nfit by width:")
    for w, m in fits.items():
        print("   %d  table %d in pane %d   scroll %s   target col %d" %
              (w, m["tableW"], m["paneW"], m["scrollW"] > m["clientW"], m["targetColW"]))
    print("\nerrors:", errs[:4])
    b.close()


import base64, datetime

# ── AND THE PAGE ITSELF, SELF-CONTAINED (rule 1c) ───────────────────────
# The shots are embedded rather than linked, so the file under
# design-mockups/ is the record on its own. Re-make deliberately:
#   python3 checks/reporting-ytd-target-mockup.py
# A sweep refuses it, because it writes where a signed-off picture lives
# (qa-run.py, §334.14) — detected by CONTENT, so this needed no flag.


ROOT = pathlib.Path("/home/user/SMP/design-mockups/reporting-ytd-target")
SHOTS = ROOT / "shots"
M = json.loads((ROOT / "measurements.json").read_text())


def uri(n):
    return "data:image/png;base64," + base64.b64encode((SHOTS / n).read_bytes()).decode()


rows = M["rows"]
moved = [r for r in rows if r.get("moved")]
same = [r for r in rows if not r.get("moved")]


def rowhtml(r):
    cls = "chg" if r.get("moved") else "same"
    prop = r["proposed"]
    if " · of " in prop:
        a, bpart = prop.split(" · of ", 1)
        cell = '<b>%s</b><span class="of">of %s</span>' % (a, bpart)
    else:
        cell = '<span class="quiet">%s</span>' % prop
    return ('<tr class="%s"><td class="nm">%s</td>'
            '<td class="v"><span class="quiet">%s</span></td>'
            '<td class="v">%s</td>'
            '<td class="mk">%s</td></tr>'
            % (cls, r["row"], r["today"], cell,
               "changes" if r.get("moved") else "unchanged"))


HTML = """<title>Reporting YTD Target</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap">
<style>
/* THE PRODUCT'S OWN TOKENS, copied from src/_shared.css's Forefront block, so
   the page around the screenshots reads as the platform rather than as a
   document about it. */
:root{
  --ground:#F7F8FA; --surface:#FFFFFF; --surface-2:#EFF2F6;
  --line:#D6DCE5; --line-soft:#E6EAF0;
  --ink:#171B22; --ink-2:#414A58; --ink-3:#636C79;
  --panel:#16325C; --panel-ink:#FFFFFF; --panel-quiet:#B7C4D8;
  --gold:#C9A24D; --gold-deep:#8A6B22;
  --good:#2E7D5B; --good-tx:#1F6248; --attn-tx:#7A5D1C;
  --bad:#B04434; --bad-tx:#8C3327; --attn-bg:#F7EFD6;
  --sans:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
  --mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  color-scheme:light;
}
@media (prefers-color-scheme:dark){ :root:not([data-theme="light"]){
  --ground:#14161A; --surface:#1C2027; --surface-2:#242932;
  --line:#333A45; --line-soft:#2A303A;
  --ink:#E9ECF1; --ink-2:#B4BCC8; --ink-3:#949DAA;
  --panel:#0E1014; --panel-ink:#EAF0FA; --panel-quiet:#9AA6B8;
  --gold:#D9B665; --gold-deep:#C9A24D;
  --good:#5FB68C; --good-tx:#8FD3B0; --attn-tx:#E8CA6A;
  --bad:#D97066; --bad-tx:#E79A93; --attn-bg:#332C16;
  color-scheme:dark;
} }
:root[data-theme="dark"]{
  --ground:#14161A; --surface:#1C2027; --surface-2:#242932;
  --line:#333A45; --line-soft:#2A303A;
  --ink:#E9ECF1; --ink-2:#B4BCC8; --ink-3:#949DAA;
  --panel:#0E1014; --panel-ink:#EAF0FA; --panel-quiet:#9AA6B8;
  --gold:#D9B665; --gold-deep:#C9A24D;
  --good:#5FB68C; --good-tx:#8FD3B0; --attn-tx:#E8CA6A;
  --bad:#D97066; --bad-tx:#E79A93; --attn-bg:#332C16;
  color-scheme:dark;
}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--ink);font-family:var(--sans);
     font-size:15px;line-height:1.62;-webkit-font-smoothing:antialiased}
.wrap{max-width:1240px;margin:0 auto;padding:0 24px 96px}
.col{max-width:760px}

/* ── the masthead: the product's navy, one gold rule, nothing else ── */
header{background:var(--panel);color:var(--panel-ink);margin-bottom:52px;
       border-bottom:3px solid var(--gold)}
.mast{max-width:1240px;margin:0 auto;padding:34px 24px 30px}
.kicker{font-family:var(--mono);font-size:10.5px;letter-spacing:.18em;
        text-transform:uppercase;color:var(--gold);margin:0 0 14px;font-weight:500}
h1{font-size:clamp(27px,4vw,38px);line-height:1.14;margin:0 0 12px;font-weight:650;
   letter-spacing:-.016em;text-wrap:balance;max-width:20ch}
.sub{margin:0;color:var(--panel-quiet);font-size:15.5px;max-width:62ch}
/* THREE FACTS, ONE PER LINE. They were a wrapping flex row with `nowrap` on
   each item, and the longest is 409px — so at phone width it ran 25px past
   the page and the leading separator only appeared on some lines. A short
   list of facts is a list; drawn as one it cannot overflow and every line
   carries the same mark. */
.stamp{margin:20px 0 0;font-family:var(--mono);font-size:11px;color:var(--panel-quiet);
       letter-spacing:.06em;display:grid;gap:4px}
.stamp span{display:flex;gap:9px;align-items:baseline}
.stamp span::before{content:"·";color:var(--gold);font-weight:700;flex:none}

section{margin:0 0 58px}
.eyebrow{font-family:var(--mono);font-size:10.5px;letter-spacing:.16em;
         text-transform:uppercase;color:var(--gold-deep);font-weight:700;
         margin:0 0 10px;display:flex;align-items:center;gap:10px}
.eyebrow::after{content:"";flex:1;height:1px;background:var(--line)}
h2{font-size:22px;line-height:1.26;margin:0 0 14px;font-weight:640;letter-spacing:-.012em;
   text-wrap:balance}
h3{font-size:15px;margin:0 0 6px;font-weight:650;letter-spacing:-.004em}
p{margin:0 0 14px;max-width:68ch}
.lede{font-size:17px;color:var(--ink-2);max-width:62ch}
strong{font-weight:650}
em.said{font-style:italic;color:var(--ink-2)}

/* a quote, marked as his words rather than dressed as a pull-quote */
blockquote{margin:0 0 20px;padding:2px 0 2px 18px;border-left:2px solid var(--gold);
           color:var(--ink-2);font-size:16px;max-width:62ch}

/* ── the figure: a screenshot of the real screen, labelled ── */
figure{margin:0 0 26px}
figure img{display:block;width:100%;max-width:100%;height:auto;
           border:1px solid var(--line);border-radius:5px;background:var(--surface)}
figcaption{margin-top:9px;font-size:12.5px;color:var(--ink-3);max-width:74ch}
.figlab{display:flex;align-items:baseline;gap:10px;margin:0 0 9px}
.figlab b{font-family:var(--mono);font-size:11px;letter-spacing:.14em;
          text-transform:uppercase;font-weight:700}
.figlab .now b{color:var(--ink-3)}
.figlab i{font-style:normal;font-size:13px;color:var(--ink-3)}
.now b{color:var(--ink-3)}
.next b{color:var(--good-tx)}

/* ── the cell at reading size: the one thing a 1600px shot cannot show ── */
.cellrow{display:flex;gap:14px;flex-wrap:wrap;margin:4px 0 22px}
.cell{background:var(--surface);border:1px solid var(--line);border-radius:5px;
      padding:15px 22px;min-width:150px;text-align:center}
.cell .lab{font-family:var(--mono);font-size:9.5px;letter-spacing:.14em;
           text-transform:uppercase;color:var(--ink-3);margin-bottom:9px}
.cell .big{font-family:var(--mono);font-size:20px;font-weight:500;color:var(--ink);
           font-variant-numeric:tabular-nums}
.cell .of{display:block;font-family:var(--mono);font-size:11.5px;color:var(--ink-3);
          margin-top:3px}
.cell.is-next{border-color:var(--gold);box-shadow:inset 0 0 0 1px var(--gold)}

/* ── the row table: the page's data core ── */
.rows{width:100%;border-collapse:collapse;margin:6px 0 8px;font-size:13.5px}
.rows th{background:var(--panel);color:var(--panel-ink);text-align:left;
         font-family:var(--mono);font-size:10px;letter-spacing:.13em;
         text-transform:uppercase;font-weight:700;padding:9px 12px;white-space:nowrap}
.rows th:first-child{border-radius:4px 0 0 0}
.rows th:last-child{border-radius:0 4px 0 0}
.rows td{padding:9px 12px;border-bottom:1px solid var(--line-soft);vertical-align:top}
.rows tr:last-child td{border-bottom:0}
.rows .nm{color:var(--ink)}
.rows .v{font-family:var(--mono);font-size:12.5px;white-space:nowrap;
         font-variant-numeric:tabular-nums}
.rows .v b{font-weight:500;color:var(--ink)}
.rows .of{display:block;font-size:10.5px;color:var(--ink-3);margin-top:1px}
.rows .quiet{color:var(--ink-3)}
.rows .mk{font-family:var(--mono);font-size:9.5px;letter-spacing:.11em;
          text-transform:uppercase;color:var(--ink-3);white-space:nowrap;text-align:right}
.rows tr.chg{background:var(--surface)}
.rows tr.chg .mk{color:var(--gold-deep);font-weight:700}
.rows tr.chg .nm{font-weight:600}
.tblwrap{overflow-x:auto;border:1px solid var(--line);border-radius:5px;
         background:var(--surface)}

/* ── the cost, and what is not in it ── */
.notes{display:grid;gap:1px;background:var(--line);border:1px solid var(--line);
       border-radius:5px;overflow:hidden}
.note{background:var(--surface);padding:15px 18px}
.note h3{margin-bottom:4px}
.note p{margin:0;font-size:14px;color:var(--ink-2);max-width:70ch}
.aside{border-left:3px solid var(--bad);background:var(--surface);padding:15px 18px;
       border-radius:0 5px 5px 0;margin-top:14px}
.aside h3{color:var(--bad-tx)}
.aside p{margin:0;font-size:14px;color:var(--ink-2)}
ul{margin:0 0 14px;padding-left:20px;max-width:68ch}
li{margin-bottom:7px}
code{font-family:var(--mono);font-size:.9em;background:var(--surface-2);
     padding:1px 5px;border-radius:3px;color:var(--ink-2)}
.ask{background:var(--attn-bg);border-radius:5px;padding:18px 20px;margin-top:6px}
.ask p{margin:0;color:var(--ink);max-width:66ch}
@media (max-width:640px){ .mast,.wrap{padding-left:16px;padding-right:16px} }
@media (prefers-reduced-motion:reduce){ *{transition:none!important;animation:none!important} }
</style>

<header>
  <div class="mast">
    <p class="kicker">Mockup for sign-off &middot; Reporting</p>
    <h1>The Target column on Reporting says the year</h1>
    <p class="sub">It should say what the row is measured against now &mdash; which the
       platform already works out, already shows on Performance, and already prints in the
       tactics table on this very screen.</p>
    <p class="stamp"><span>13 Sep 2026</span><span>Mobile &rsaquo; Reporting &rsaquo; Portfolio &amp; Value Chain Expansion</span><span>cycle reported as of Jun 2026</span></p>
  </div>
</header>

<div class="wrap">

<section class="col">
  <p class="eyebrow">What you asked</p>
  <blockquote>&ldquo;When I set a target like a % for the annual view and I build it on
    monthly level and set it to latest, if I go to the reporting the target required
    should read from the latest month we are measured against.&rdquo;</blockquote>
  <p class="lede">It does &mdash; everywhere except the screen you were looking at.</p>
  <p>I made your exact case on a real row and measured it: <strong>Samsung market
     share</strong>, a 30% annual target, twelve months typed in, compile rule
     <strong>Latest</strong>, cycle reported as of June. The platform answers
     <strong>29%</strong> &mdash; June's month, exactly as you describe. Performance
     shows it. Reporting prints <strong>30%</strong>, the year.</p>
</section>

<section>
  <p class="eyebrow">Today</p>
  <div class="figlab now"><b>As it is</b><i>Reporting &rsaquo; Key measures</i></div>
  <figure>
    <img src="__TODAY__" alt="The Reporting page's Key measures table as it is today: the column headed Target shows each row's annual target.">
    <figcaption>Row 2 is your case &mdash; 30% in the column headed <em>Target</em>, with 31%
      reported beside it. Row 4, Accessory revenue, is the seasonal one: 300M EGP, with 96M
      reported. Both read as far behind. Neither is.</figcaption>
  </figure>
  <div class="figlab now"><b>And three inches down the same page</b><i>Reporting &rsaquo; Tactics</i></div>
  <figure>
    <img src="__TACTICS__" alt="The tactics table on the same Reporting page: its column is headed YTD Target and shows 50% and 33%, figures to date.">
    <figcaption>The tactics table already calls its column <strong>YTD Target</strong> and
      already shows a figure to date. So the screen contradicts itself: one table says the
      year, the table under it says what is owed by now.</figcaption>
  </figure>
</section>

<section>
  <p class="eyebrow">Proposed</p>
  <div class="figlab next"><b>The change</b><i>the same table, the same build</i></div>
  <figure>
    <img src="__PROPOSED__" alt="The same table with the column headed YTD Target: rows that prorate show the figure owed by now with the annual target beneath it; rows that do not prorate are unchanged.">
    <figcaption>Row 2 now reads <strong>29%</strong> with <em>of 30%</em> under it. Row 4
      reads <strong>96M EGP</strong> of 300M &mdash; the same number that was reported, so the
      row reads as on plan at a glance, which is what the monthly plan was built for.</figcaption>
  </figure>
  <div class="col">
    <h3>The rule, in one line</h3>
    <p>Where the row is measured against something other than its own annual target, show
       that figure with the annual underneath. Everywhere else, show exactly what is shown
       today.</p>
    <p>Nothing here is new arithmetic and nothing is a new design: the number is the one
       Performance already prints, and the two-line cell is the one the tactics table on
       this same page already draws.</p>
  </div>
  <div class="cellrow">
    <div class="cell"><div class="lab">Built by month &middot; Latest</div>
      <div class="big">29%<span class="of">of 30%</span></div></div>
    <div class="cell"><div class="lab">Prorates flat &middot; Sum</div>
      <div class="big">75M EGP<span class="of">of 150M EGP</span></div></div>
    <div class="cell"><div class="lab">Does not prorate</div>
      <div class="big">60%</div></div>
    <div class="cell"><div class="lab">A yes / no row</div>
      <div class="big">Yes / No</div></div>
  </div>
  <p class="col" style="font-size:13px;color:var(--ink-3);margin-top:-8px">The cell at reading
     size. The last two are what a row looks like when nothing changes.</p>
</section>

<section>
  <p class="eyebrow">Every row on that table</p>
  <h2 class="col">__NCHG__ rows change. __NSAME__ do not.</h2>
  <p class="col">Driven on the real table, not typed out &mdash; including a yes/no row and a
     row with no target, which the demo does not carry and which I made on purpose, because a
     picture that only shows the case being fixed hides what it costs everything else.</p>
  <div class="tblwrap">
    <table class="rows">
      <thead><tr><th>Row</th><th>Today</th><th>Proposed</th><th></th></tr></thead>
      <tbody>__ROWS__</tbody>
    </table>
  </div>
  <p class="col" style="font-size:13px;color:var(--ink-3)">The first four are the unit's key
     objectives; the rest are one pillar's key measures. Both tables carry the same column and
     both change together.</p>
</section>

<section class="col">
  <p class="eyebrow">What it costs</p>
  <div class="notes">
    <div class="note"><h3>The column is renamed</h3>
      <p>Target becomes <strong>YTD Target</strong> on four tables &mdash; a unit's key
         objectives, a pillar's key measures, a supporting function's, and a capability's.
         It is the name the tactics table already uses.</p></div>
    <div class="note"><h3>A number people are used to changes</h3>
      <p>Somebody who has been reading 300M EGP in that column will read 96M EGP of 300M EGP.
         That is the point of the change, and it is still a change.</p></div>
    <div class="note"><h3>The row gets 1.5px taller</h3>
      <p>Measured: the tallest row 55px &rarr; 56.5px, the column 154px &rarr; 180px, taken
         out of the slack the name column had. The table still fits its pane with no sideways
         scroll at 1600, 1440, 1280, 1100 and 1000.</p></div>
    <div class="note"><h3>Nothing else moves</h3>
      <p>No score changes, nothing is stored, nothing is migrated, no permission moves, and
         no row that does not prorate is touched. Performance, the deck and the workbooks are
         untouched.</p></div>
  </div>
</section>

<section class="col">
  <p class="eyebrow">Found on the way &mdash; not part of this</p>
  <div class="figlab next"><b>Dark</b><i>the treatment holds</i></div>
  <figure>
    <img src="__DARK__" alt="The proposed table in dark mode. The two-line cell reads correctly; two rows show a pale band left over from an unrelated fault.">
    <figcaption>The two-line cell reads properly in dark. The pale bands on rows 8 and 10 are
      <strong>not this change</strong> &mdash; a row that still owes a note is painted a fixed
      near-white that was never given a dark twin, so light text lands on a light band. I
      reproduced it on the untouched build with nothing made and nothing rewritten:
      <code>#FBF1EF</code> under <code>#E9ECF1</code>, about 1.05:1. Three of four such rows on
      this one pillar.</figcaption>
  </figure>
  <div class="aside"><h3>Separate, and yours to call</h3>
    <p>It is one line of CSS and it affects every table that marks a row as needing a note. I
       have not touched it &mdash; it is a different fault on a different feature, and fixing
       it inside this change would be a second thing riding the first.</p></div>
</section>

<section class="col">
  <p class="eyebrow">Deliberately not in it</p>
  <ul>
    <li><strong>Monthly actuals.</strong> Still one figure per cycle. You turned that down
        when the monthly plan was built and nothing here revisits it.</li>
    <li><strong>The tactics table.</strong> Already correct; untouched.</li>
    <li><strong>Performance and the deck.</strong> Already show the benchmark; untouched.</li>
  </ul>
  <div class="ask"><p><strong>If this is right, say so and I will build it</strong> &mdash;
     with a check that fails on today's build first, and both sides of the navigation switch
     driven, so a unit's page and a function's cannot drift apart.</p></div>
</section>

</div>
"""

out = (HTML.replace("__TODAY__", uri("today-measures.png"))
           .replace("__TACTICS__", uri("tactics-today.png"))
           .replace("__PROPOSED__", uri("proposed-measures.png"))
           .replace("__DARK__", uri("proposed-measures-dark.png"))
           .replace("__ROWS__", "\n".join(rowhtml(r) for r in rows))
           # DERIVED, never typed: the first draft said "Five" over a table of
           # six, because the count was written by hand and the fixture moved.
           .replace("__NCHG__", str(len(moved)))
           .replace("__NSAME__", str(len(same))))

dst = ROOT / ("%s_reporting-ytd-target.html" % datetime.date(2026, 9, 13).isoformat())
dst.write_text(out)
print("wrote", dst, len(out), "bytes;", len(moved), "changed,", len(same), "unchanged")
