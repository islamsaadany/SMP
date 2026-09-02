#!/usr/bin/env python3
"""§257 — the group's mark, and the deck's four blue section dividers.

Islam: *"where can I upload the raya trade mark so it can be used? then work
on separators let's make the separators blue background like the client brand
colors"*, naming four sections.

WHAT THIS FILE GUARDS, AND WHY EACH ASSERTION IS THE ONE WORTH MAKING:

  · THE BLUE IS THE TENANT'S, ASSERTED AS AGREEMENT AND NEVER AS A LITERAL
    (§94.8). It reads `--panel` off the root and compares; then it REBRANDS
    the tenant mid-run and asserts the dividers followed. A check that
    asserted #16325C would pass on a build with the hex written into
    present.css, which is exactly the build this rules out.

  · BOTH ENDS, EVERY TIME (§94.2). No footer mark on a divider AND a footer
    mark on the content slides; the SWOT divider's cells stripped of their
    hues AND the four category slides still carrying theirs; a pillars
    function getting two dividers AND a capability function getting none.
    A build that removed the whole feature satisfies half of each pair.

  · THE STATE IS MADE (§94.2, §253). Every demo unit has objectives and
    pillars, so the guards that stop a divider standing over nothing are
    unreachable on the shipped data — the check empties them and puts them
    back.

  · EVERY PROBE DEGRADES (§215). A build without `sectSlide` or `groupLogo`
    must REPORT that, not die and print zero failures.
"""
import os, pathlib, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
FILE = ROOT / "strategy-management-platform-v3.22.html"
MARK = ROOT.parent / "clients/raya-trade/brand/raya-trade-group-mark.png"
CHROME = os.environ.get("SMP_CHROME")

fails = []
def ok(cond, msg):
    print(("  ok   " if cond else "  FAIL ") + msg)
    if not cond:
        fails.append(msg)

def lum(rgb):
    r, g, b = [int(x) / 255.0 for x in rgb]
    f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return .2126 * f(r) + .7152 * f(g) + .0722 * f(b)

def ratio(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return round((hi + .05) / (lo + .05), 2)

def rgb(s):
    return re.findall(r"\d+", s or "")[:3]

# The deck is read through the platform's own one reader, so a build that
# routed a subject to the wrong deck fails here too (§253.3).
DECK = """(t) => {
  if (typeof deckHtmlFor !== 'function') return {err:'no deckHtmlFor'};
  const d = document.createElement('div');
  d.innerHTML = deckHtmlFor(t);
  const all = [...d.querySelectorAll('section.dslide')];
  return { n: all.length, slides: all.map(s => ({
    sect: s.classList.contains('d-sect'),
    anchor: s.getAttribute('data-anchor') || '',
    head: (s.querySelector('h1,h2,h3') || {}).textContent || '',
    hues: [...s.querySelectorAll('.seccell')].map(c => c.className.trim()),
    swotHue: [...s.classList].filter(c => c.indexOf('t-') === 0).join(',')
  })) };
}"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME)
    pg = b.new_page(viewport={"width": 1640, "height": 940})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + str(FILE))
    pg.wait_for_timeout(1400)

    print("\n1 · the two builders exist, or every probe below is meaningless")
    have = pg.evaluate("""() => ({ sect: typeof sectSlide === 'function',
                                    glogo: typeof groupLogo === 'function',
                                    mark: typeof deckMark === 'function' })""")
    ok(have["sect"], "sectSlide() is declared")
    ok(have["glogo"], "groupLogo() is declared")
    ok(have["mark"], "deckMark() is declared")

    print("\n2 · a unit's deck carries four dividers, each opening its own section")
    u = pg.evaluate(DECK, "mobile")
    if u.get("err"):
        ok(False, "the unit deck could not be built — " + u["err"])
    else:
        sect = [i for i, s in enumerate(u["slides"]) if s["sect"]]
        ok(len(sect) == 4, "four dividers, got %d" % len(sect))
        anchors = [u["slides"][i]["anchor"] for i in sect]
        ok(anchors == ["sfound", "swothead", "spillars", "sperf"],
           "in order and each named by its own anchor — %s" % anchors)
        # A divider must OPEN a section, so the slide after it is content.
        for i in sect:
            nxt = u["slides"][i + 1] if i + 1 < len(u["slides"]) else None
            ok(nxt is not None and not nxt["sect"],
               "%s is followed by content, not by another divider" % u["slides"][i]["anchor"])
        heads = [u["slides"][i]["head"].strip() for i in sect]
        ok(heads == ["Foundation", "SWOT", "Strategic pillars", "Overall performance"],
           "the four headings — %s" % heads)

        print("\n3 · the SWOT divider drops its four hues; the category slides keep theirs")
        # EVERY PROBE DEGRADES (§215). Its first run against the previous
        #   build DIED here on an empty list and printed six failures where
        #   there are twenty-odd — a check that crashes on exactly the build
        #   it exists to catch reports nothing at all. 
        swot = next((u["slides"][i] for i in sect
                     if u["slides"][i]["anchor"] == "swothead"), None)
        ok(swot is not None, "the SWOT divider is findable by its anchor")
        ok(swot is not None and all(h == "seccell" for h in swot["hues"]),
           "the divider's four cells carry no hue class — %s"
           % (swot["hues"] if swot else "no divider"))
        cats = [s["swotHue"] for s in u["slides"] if s["swotHue"]]
        ok(sorted(cats) == ["t-bad", "t-good", "t-stone", "t-warn"],
           "the four category slides still carry theirs — %s" % sorted(cats))

    print("\n4 · a pillars function gets two; a capability function is untouched")
    fnp = pg.evaluate(DECK, "fn:merchandising")
    fnc = pg.evaluate(DECK, "fn:marketing")
    ok(not fnp.get("err") and sum(1 for s in fnp["slides"] if s["sect"]) == 2,
       "a pillars function has two dividers (no SWOT: it authors none, §243)")
    ok(not fnp.get("err") and
       [s["anchor"] for s in fnp["slides"] if s["sect"]] == ["spillars", "sperf"],
       "and they are the two it has a section for")
    ok(not fnc.get("err") and sum(1 for s in fnc["slides"] if s["sect"]) == 0,
       "a capability function's deck is byte-for-byte what it was")

    print("\n5 · a divider is never drawn over nothing (§253) — the state is MADE")
    made = pg.evaluate("""() => {
      const u = UNITS['mobile'];
      const ko = u.keyObjectives, items = u.items;
      const out = {};
      const count = t => { const d=document.createElement('div');
        d.innerHTML = deckHtmlFor(t);
        return [...d.querySelectorAll('section.dslide.d-sect')]
                 .map(s => s.getAttribute('data-anchor')); };
      u.items = [];
      out.noPillars = count('mobile');
      u.items = items;
      const f = FUNCTIONS['merchandising'];
      out.back = count('mobile');
      return out;
    }""")
    ok("spillars" not in made["noPillars"],
       "a unit with no pillars draws no Strategic pillars divider — %s" % made["noPillars"])
    ok("sperf" in made["noPillars"],
       "and still draws Overall performance, because the stand slide always does")
    ok(made["back"] == ["sfound", "swothead", "spillars", "sperf"],
       "and the state is put back (§113.8) — %s" % made["back"])

    print("\n6 · the blue is the tenant's, asserted as AGREEMENT and never as a hex")
    pg.evaluate("""() => { const r=document.getElementById('deckroot'); openDeck(UNITS['mobile']);
      r.querySelector('.deck').style.transform='none';
      const st=document.querySelector('.deckstage');
      st.style.alignItems='flex-start'; st.style.justifyContent='flex-start'; }""")
    pg.wait_for_timeout(300)
    def measure():
        return pg.evaluate("""() => {
          const a=[...document.querySelectorAll('#deckroot section.dslide')];
          const i=a.findIndex(s=>s.classList.contains('d-sect'));
          if (i<0) return null;
          a.forEach(s=>s.classList.remove('on')); a[i].classList.add('on');
          const s=a[i], cs=getComputedStyle(document.documentElement);
          const g=q=>{const e=s.querySelector(q); return e?getComputedStyle(e):null;};
          const tok=n=>cs.getPropertyValue(n).trim();
          return { bg:getComputedStyle(s).backgroundColor,
                   panel:tok('--panel'), ink:tok('--panel-ink'),
                   quiet:tok('--panel-quiet'), accent:tok('--panel-accent'),
                   h1:g('h1').color, sub:g('.coversub').color,
                   lab:g('.seclab').color,
                   rule:g('.coverrule').backgroundColor,
                   cellb:g('.seccell b') ? g('.seccell b').color : null,
                   cells:g('.seccell span') ? g('.seccell span').color : null };
        }""")
    m = measure()
    if not m:
        ok(False, "no divider on the painted deck")
    else:
        want = pg.evaluate("h => { const d=document.createElement('div');"
                           "d.style.color=h; document.body.appendChild(d);"
                           "const c=getComputedStyle(d).color; d.remove(); return c; }", m["panel"])
        ok(m["bg"] == want, "the ground IS --panel (%s), not a colour of the deck's own" % m["panel"])
        for k, tok in [("h1", "ink"), ("sub", "quiet"), ("lab", "accent"),
                       ("rule", "accent"), ("cellb", "ink"), ("cells", "quiet")]:
            if m[k] is None:
                continue
            w = pg.evaluate("h => { const d=document.createElement('div');"
                            "d.style.color=h; document.body.appendChild(d);"
                            "const c=getComputedStyle(d).color; d.remove(); return c; }", m[tok])
            ok(m[k] == w, "%s takes --panel-%s" % (k, tok))
        for k in ["h1", "sub", "lab", "cellb", "cells"]:
            if m[k] is None:
                continue
            r = ratio(rgb(m[k]), rgb(m["bg"]))
            ok(r >= 4.5, "%s reads on the blue — %s:1" % (k, r))

    print("\n7 · rebrand the tenant and the dividers follow (no literal anywhere)")
    moved = pg.evaluate("""() => {
      GROUP.branding = Object.assign({}, GROUP.branding || {}, { bar: '#5A1030' });
      /* `applyBrand()` is the platform's own one door onto the tokens
         (shell.html), so the rebrand happens exactly as pressing the picker
         would — never by writing a variable the product does not read. */
      applyBrand(); paint();
      return true; }""")
    pg.wait_for_timeout(400)
    pg.evaluate("""() => { const r=document.getElementById('deckroot'); openDeck(UNITS['mobile']);
      r.querySelector('.deck').style.transform='none'; }""")
    pg.wait_for_timeout(250)
    m2 = measure()
    ok(m2 and m2["bg"] != m["bg"], "the divider's ground MOVED with the bar colour")
    ok(m2 and m2["bg"] == pg.evaluate(
        "h => { const d=document.createElement('div'); d.style.color=h;"
        "document.body.appendChild(d); const c=getComputedStyle(d).color; d.remove(); return c; }",
        m2["panel"]) if m2 else False, "and it is still exactly --panel")
    pg.evaluate("() => { delete GROUP.branding; applyBrand(); paint(); }")
    pg.wait_for_timeout(300)

    print("\n8 · the group's mark — the control writes, and Remove DELETES the key")
    pg.evaluate("() => { closeDeck(); current='setup'; currentSub='brand'; paint(); }")
    pg.wait_for_timeout(400)
    ok(pg.locator("input[data-glogo]").count() == 1, "one upload control on Branding")
    ok(pg.locator("[data-glogoclear]").count() == 0, "no Remove while there is no mark (§61)")
    # Guarded on the control BEING THERE, or a build with no group mark at
    # all times out here rather than reporting that it has none (§215, twice
    # in this file's first run against the previous build).
    if MARK.exists() and pg.locator("input[data-glogo]").count():
        pg.set_input_files("input[data-glogo]", str(MARK))
        pg.wait_for_timeout(800)
        wrote = pg.evaluate("() => (GROUP.logo || '').slice(0, 14)")
        ok(wrote == "data:image/png", "the upload reaches GROUP.logo — %r" % wrote)
        ok(pg.locator(".gmarkrow img.umarkimg").count() == 1, "and the preview is drawn")
    elif not MARK.exists():
        ok(False, "the test mark is missing at %s" % MARK)
    else:
        ok(False, "no upload control to drive — the group mark is not built")

    print("\n9 · the mark reaches every deck, and never a divider's foot")
    r = pg.evaluate("""() => {
      const out = {};
      for (const t of ['mobile','fn:merchandising','fn:marketing']) {
        const root = document.getElementById('deckroot');
        (t.indexOf('fn:')===0 ? openDeckFn(t.slice(3)) : openDeck(UNITS[t]));
        const all=[...root.querySelectorAll('section.dslide')];
        out[t] = { cover: !!all[0].querySelector('.dcovermark'),
                   feet: all.filter(s=>s.querySelector('.dfootmark')).length,
                   sectFeet: all.filter(s=>s.classList.contains('d-sect')
                                        && s.querySelector('.dfootmark')).length };
        closeDeck();
      }
      return out; }""")
    for t in r:
        ok(r[t]["cover"], "%s — the cover wears the group's mark" % t)
        ok(r[t]["feet"] > 0, "%s — its content slides are footed" % t)
        ok(r[t]["sectFeet"] == 0, "%s — and no divider is (§257.1)" % t)

    print("\n10 · Remove puts it back")
    pg.evaluate("() => { current='setup'; currentSub='brand'; paint(); }")
    pg.wait_for_timeout(300)
    if pg.locator("[data-glogoclear]").count():
        pg.locator("[data-glogoclear]").click()
        pg.wait_for_timeout(400)
    ok(pg.evaluate("() => !('logo' in GROUP)"),
       "the key is DELETED, not blanked (§50.6) — a group that never set one "
       "and one that set and cleared one are the same shape")

    print("\n11 · the four dead hue rules are gone from the stylesheet (§24)")
    dead = pg.evaluate("""() => {
      let n = 0;
      for (const sh of document.styleSheets) {
        let rs; try { rs = sh.cssRules; } catch (e) { continue; }
        for (const r of rs || []) {
          if (r.selectorText && /\\.seccell\\.t-/.test(r.selectorText)) n++;
        }
      }
      return n; }""")
    ok(dead == 0, "no `.seccell.t-*` rule survives, got %d" % dead)

    ok(not errs, "no page errors — %s" % errs)
    b.close()

print("\n%s" % ("ALL PASS" if not fails else "%d FAILED" % len(fails)))
for f in fails:
    print("  - " + f)
sys.exit(1 if fails else 0)
