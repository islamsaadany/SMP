"""── THE TWO DECKS, SLIDE BY SLIDE, SIDE BY SIDE (spec 066 stage 5) ─────

Islam: *"show me where they differ, then I decide"*, and *"I need things
visually"*. `compare.py` says WHICH slides differ across every box; this
shows WHAT they look like, for one box of each kind, as pictures on one
page.

Two decks only, on purpose: `compare.py` already proved every pillars box
makes the same shape and every projects box makes the same shape, so a
third picture of the same shape teaches nothing and costs a minute.

  python3 scripts/decks/side-by-side.py                      # the demo
  python3 scripts/decks/side-by-side.py <state.json>
  python3 scripts/decks/side-by-side.py --left mobile --right fn:finance
"""
import os, io, sys, re, html
from playwright.sync_api import sync_playwright

HERE  = os.path.dirname(os.path.abspath(__file__))
BUILT = os.environ.get("SMP_BUILT") or os.path.join(
    HERE, "..", "..", "SMP-Project-Folder", "src", "strategy-management-platform.html")
OUT   = os.environ.get("SMP_OUT") or os.path.join(HERE, "out")
def flag(n, d):
    return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d
LEFT, RIGHT = flag("--left", "mobile"), flag("--right", "fn:finance")
pos = [a for i, a in enumerate(sys.argv[1:], 1)
       if not a.startswith("--") and sys.argv[i - 1] not in ("--left", "--right")]
STATE = io.open(pos[0], encoding="utf-8").read() if pos else None

SLIDES = """(t)=>{
  var w = document.getElementById('sbs'); if (w) w.remove();
  w = document.createElement('div'); w.id = 'sbs';
  w.style.cssText = 'position:fixed;left:0;top:0;width:1500px;background:#fff;z-index:99999';
  try { w.innerHTML = deckHtmlFor(t); } catch(e){ w.innerHTML = ''; }
  document.body.appendChild(w);
  return [].slice.call(w.querySelectorAll('.dslide')).map(function(el){
    var h = el.querySelector('h1,h2,h3');
    return { anchor: el.getAttribute('data-anchor') || '',
             label:  el.getAttribute('data-anchor-label') || '',
             head:   h ? h.textContent.trim().slice(0,70) : '' };
  });
}"""

def grab(pg, target, tag):
    meta = pg.evaluate(SLIDES, target)
    pg.wait_for_timeout(250)
    els = pg.query_selector_all("#sbs .dslide")
    shots = []
    for i, el in enumerate(els):
        f = "%s_%02d.png" % (tag, i + 1)
        try:
            el.screenshot(path=os.path.join(OUT, f))
            shots.append(f)
        except Exception:
            shots.append(None)
    pg.evaluate("()=>{var w=document.getElementById('sbs'); if(w) w.remove();}")
    return list(zip(meta, shots))

def main():
    os.makedirs(OUT, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1500, "height": 1000})
        pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                           "localStorage.setItem('smp.tour.never','1')}catch(e){}")
        pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(1000)
        if STATE:
            pg.evaluate("(s)=>{SYNC.hydrate(JSON.parse(s)); paint();}", STATE)
            pg.wait_for_timeout(500)
        client = pg.evaluate("()=>GROUP.org") or "this client"
        nameOf = pg.evaluate("""(t)=>{ try { var u = unitLike(t);
            return (u && u.name) || t; } catch(e){ return t; } }""", LEFT)
        nameOf2 = pg.evaluate("""(t)=>{ try { var u = unitLike(t);
            return (u && u.name) || t; } catch(e){ return t; } }""", RIGHT)
        L = grab(pg, LEFT, "left")
        R = grab(pg, RIGHT, "right")
        b.close()
    write(client, (nameOf, L), (nameOf2, R))
    print("%d slides left, %d right  →  %s" % (len(L), len(R), os.path.join(OUT, "index.html")))

def write(client, left, right):
    """Lined up by the slide a box gets ONCE. A per-item slide is folded to
       one row that says how many, because fourteen pillars make fourteen
       rows of the same decision (compare.py §4)."""
    def rows(pairs):
        out, i = [], 0
        while i < len(pairs):
            m, f = pairs[i]
            a = m["anchor"]
            if re.search(r"\d", a):                       # carries an id
                j = i
                while j < len(pairs) and re.search(r"\d", pairs[j][0]["anchor"]): j += 1
                out.append({"per": True, "n": j - i, "shots": [x[1] for x in pairs[i:j]][:3],
                            "label": m["label"]})
                i = j
            else:
                out.append({"per": False, "a": a, "label": m["label"], "head": m["head"], "shot": f})
                i += 1
        return out
    (ln, L), (rn, R) = left, right
    lr, rr = rows(L), rows(R)
    keys = []
    for r in lr: keys.append(("per" if r["per"] else r["a"]))
    for r in rr:
        k = "per" if r["per"] else r["a"]
        if k not in keys: keys.append(k)
    byl = {("per" if r["per"] else r["a"]): r for r in lr}
    byr = {("per" if r["per"] else r["a"]): r for r in rr}

    def cell(r):
        if not r: return '<td class="none"><span>not in this deck</span></td>'
        if r["per"]:
            imgs = "".join('<img src="%s">' % s for s in r["shots"] if s)
            return ('<td><p class="lab">one set per item — %d slides</p>%s</td>' % (r["n"], imgs))
        return ('<td><p class="lab">%s</p>%s</td>'
                % (html.escape(r["label"] or r["a"]),
                   ('<img src="%s">' % r["shot"]) if r["shot"] else ""))

    body = []
    for k in keys:
        a, bb = byl.get(k), byr.get(k)
        differs = (a is None) != (bb is None)
        body.append('<tr class="%s"><th>%s</th>%s%s</tr>'
                    % ("differs" if differs else "", html.escape(k), cell(a), cell(bb)))

    io.open(os.path.join(OUT, "index.html"), "w", encoding="utf-8").write("""<!doctype html>
<meta charset="utf-8"><title>Two decks, slide by slide</title>
<style>
 body{font:15px/1.5 system-ui,sans-serif;margin:0;background:#f6f6f7;color:#1a1a1a}
 header{padding:28px 32px;background:#fff;border-bottom:1px solid #e3e3e6}
 h1{margin:0 0 6px;font-size:26px} header p{margin:0;color:#555;max-width:70ch}
 table{border-collapse:collapse;width:100%;margin:0}
 th,td{vertical-align:top;padding:14px 16px;border-bottom:1px solid #e3e3e6;background:#fff}
 th{width:150px;text-align:left;font:600 13px ui-monospace,monospace;color:#555;background:#fafafa}
 td{width:calc(50% - 75px)}
 tr.differs th{background:#fdeaea;color:#8a1c1c}
 tr.differs td.none{background:#fdeaea}
 td.none span{display:inline-block;padding:10px 12px;color:#8a1c1c;font-style:italic}
 img{max-width:100%;border:1px solid #ddd;border-radius:6px;display:block;margin:0 0 8px}
 .lab{margin:0 0 8px;font:600 12px system-ui;color:#666;text-transform:uppercase;letter-spacing:.04em}
 thead th{font:600 15px system-ui;color:#1a1a1a;background:#fff}
</style>
<header>
  <h1>Two decks, slide by slide</h1>
  <p><b>%s.</b> A box that plans in <b>pillars</b> on the left, a box that plans in
  <b>projects</b> on the right — the two builders stage 5 is merging into one.
  Rows marked red are slides one deck makes and the other does not.</p>
</header>
<table>
 <thead><tr><th></th><th>%s &mdash; pillars</th><th>%s &mdash; projects</th></tr></thead>
 <tbody>%s</tbody>
</table>
""" % (html.escape(client), html.escape(ln), html.escape(rn), "".join(body)))

main()
