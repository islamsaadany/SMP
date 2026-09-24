"""THE NAVIGATION CHROME (Plan page redesign, signed off round 7, §399).

Islam: *"the blue banner at the top is only usable for the SMO, other units
see only their units"*, then *"A+B for the navy row"*, *"the line of mobile
H1 needs to be a navy line to show distinction for people who are not the
smo"*, *"we had a separator between the unit name and the tabs"* and *"the
separator space from the left side of the page should be stable and the name
of the unit to be centered within this space"*.

WHAT IS ASSERTED, BOTH ENDS EVERY TIME (§94.2):

  1. the row of units is DRAWN for somebody who works across units (the
     office) and STOOD DOWN for somebody with one place of business — and for
     the second, every place they could open is still reachable through the
     top line's switcher, or hiding the row would have taken the group away
     (§61). Asked of the product's own reach, never of a list typed here.
  2. the office's pin folds the row and the choice survives a reload; folded,
     the switcher appears, and unfolding brings the row back.
  3. the navy unit bar leads with the place's NAME, and the rule after it
     stands at the SAME x on a short name, a long name and at two widths —
     the property, never the pixel (§94.8): the rule's x agrees with the
     pillars rail's right edge on a unit's plan.
  4. a long name is set smaller rather than clipped; a short one is not.
  5. the sections line starts under the tabs, not at the page's gutter.
  6. the Reporting tab keeps its orange as TYPE and reads on the navy
     (measured with the sweep's own arithmetic, §95), and the selected tab is
     underlined in gold.
  7. the tour's "You are here" step points at something that is on the
     screen — the row it used to point at is hidden for exactly the people the
     tour is for.

Run: SMP_CHROME=... python3 qa-run.py checks/nav-chrome.py
     SMP_BUILT=<path> points it at another build (§276).
"""
import os, pathlib
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or str(pathlib.Path(
    pathlib.Path(__file__).resolve().parent.parent,
    "strategy-management-platform.html").resolve())
URL = "file://" + BUILT

bad = 0
errs = []


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x != "" else ""))


def js(pg, src, arg=None, dflt=None):
    """Every probe degrades (§215): a build without the feature answers None
    rather than killing the run and every assertion after it."""
    try:
        return pg.evaluate(src, arg) if arg is not None else pg.evaluate(src)
    except Exception as e:
        return dflt


def lum(c):
    def ch(v):
        v = v / 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2])


def ratio(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def rgb(s):
    s = (s or "").strip()
    if not s.startswith("rgb"):
        return None
    n = [float(x) for x in s[s.index("(") + 1:s.index(")")].split(",")[:3]]
    return n


def viewer(pg, key):
    js(pg, "k=>switchViewer(k)", key)
    pg.wait_for_timeout(500)


def go(pg, key):
    js(pg, """k=>{ var b=document.querySelector('#units [data-u="'+k+'"]'); if(b) b.click(); }""", key)
    pg.wait_for_timeout(400)


def to_plan(pg):
    js(pg, """()=>{ var t=document.querySelector('#subtabs [data-s="strategy"]'); if(t) t.click(); }""")
    pg.wait_for_timeout(250)
    js(pg, """()=>{ var s=document.querySelector('#secrow-in [data-sub2="plan"]'); if(s) s.click(); }""")
    pg.wait_for_timeout(300)


STATE = """()=>{
  var nav=document.querySelector('nav.units'), top=document.getElementById('topnav');
  var sw=[].slice.call(document.querySelectorAll('#topnav .navswitcher [data-u]')).map(function(b){return b.dataset.u;});
  return { rowShown: !!(nav && nav.checkVisibility && nav.checkVisibility()),
           pin: !!document.querySelector('[data-navpin]'),
           switcher: sw,
           reach: Array.from(new Set([].slice.call(document.querySelectorAll('#units [data-u]')).map(function(b){return b.dataset.u;}))),
           topShown: !!(top && !top.hidden) };
}"""

with sync_playwright() as p:
    br = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = br.new_page(viewport={"width": 1440, "height": 900})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');"
                       "if(!sessionStorage.getItem('navchrome.fresh')){localStorage.removeItem('smp.nav.folded');"
                       "sessionStorage.setItem('navchrome.fresh','1');}}catch(e){}")
    # ONCE per tab, never per document: clearing it on every load would clear
    # the very fold section 2 reloads to find (the check's own first run did
    # exactly that and reported the product broken, §100.3).
    pg.goto(URL)
    pg.wait_for_timeout(1200)

    print("1 · the row is for somebody who works across units")
    viewer(pg, "smo")
    s = js(pg, STATE, dflt={}) or {}
    ck("the office sees the row of units", s.get("rowShown"), s)
    ck("...and the pin that folds it", s.get("pin"), s)
    viewer(pg, "mobhead")
    s = js(pg, STATE, dflt={}) or {}
    ck("a unit head, whose business is one unit, does NOT see the row",
       s.get("rowShown") is False, s)
    reach = [k for k in (s.get("reach") or []) if k not in ("setup", "manage")]
    ck("...and more than one place is open to them, or the switcher proves nothing",
       len(reach) > 1, reach)
    ck("...and every place they could open is on the top line's switcher",
       reach and sorted(s.get("switcher") or []) == sorted(reach),
       {"reach": reach, "switcher": s.get("switcher")})
    ck("...and they get no pin — there is nothing to fold",
       s.get("pin") is False, s)

    print("\n2 · the office's pin folds the row, and the choice lasts")
    viewer(pg, "smo")
    js(pg, "()=>{ var b=document.querySelector('[data-navpin]'); if(b) b.click(); }")
    pg.wait_for_timeout(300)
    s = js(pg, STATE, dflt={}) or {}
    ck("pressed, the row goes", s.get("rowShown") is False, s)
    ck("...and the switcher takes its place", len(s.get("switcher") or []) > 1, s)
    pg.reload()
    pg.wait_for_timeout(1200)
    viewer(pg, "smo")
    s = js(pg, STATE, dflt={}) or {}
    ck("folded survives a reload", s.get("rowShown") is False, s)
    js(pg, "()=>{ var b=document.querySelector('[data-navpin]'); if(b) b.click(); }")
    pg.wait_for_timeout(300)
    s = js(pg, STATE, dflt={}) or {}
    ck("pressed again, the row comes back", s.get("rowShown") is True, s)
    ck("...and the switcher goes with the fold", not s.get("switcher"), s)

    print("\n3/4 · the name leads the navy bar; the rule stands still")
    xs = {}
    for w in (1440, 1280):
        pg.set_viewport_size({"width": w, "height": 900})
        for dest in ("mobile", "consumerelectronics"):
            go(pg, dest)
            to_plan(pg)
            m = js(pg, """()=>{
              var n=document.querySelector('#tabrow.unitbar .unitname');
              if(!n) return null;
              var r=n.getBoundingClientRect(), sp=n.firstChild.getBoundingClientRect();
              var rail=document.querySelector('.split .rail');
              var rr=rail?rail.getBoundingClientRect():null;
              var tab=document.querySelector('#subtabs [data-s]').getBoundingClientRect();
              var sec=document.querySelector('#secrow-in [data-sub2]');
              return { rule:r.right, spanMid:(sp.left+sp.right)/2, boxMid:(r.left+r.right)/2,
                       long:n.classList.contains('long'), text:n.textContent,
                       clipped: n.firstChild.scrollWidth > n.firstChild.clientWidth+1,
                       font: getComputedStyle(n).fontFamily,
                       bg: getComputedStyle(document.getElementById('tabrow')).backgroundColor,
                       railRight: rr ? rr.right : null, tabLeft: tab.left,
                       secLeft: sec ? sec.getBoundingClientRect().left : null };
            }""")
            if not m:
                ck("the navy bar leads with the place's name (%s at %d)" % (dest, w), False, m)
                continue
            xs[(w, dest)] = m
            ck("%s at %d: the bar is navy and its name is %r" % (dest, w, m["text"]),
               rgb(m["bg"]) and lum(rgb(m["bg"])) < 0.1, m["bg"])
            ck("...centred in its column", abs(m["spanMid"] - m["boxMid"]) < 1.5, m)
            ck("...not clipped", not m["clipped"], m)
            ck("...in the title face", "Source Serif 4" in (m["font"] or ""), m["font"])
            if m["railRight"] is not None:
                ck("...and the rule after it agrees with the pillars rail's right edge",
                   abs(m["rule"] - m["railRight"]) < 1.5, m)
            ck("...the tabs start after the rule", m["tabLeft"] > m["rule"], m)
            if m["secLeft"] is not None:
                ck("...and the sections line starts under the tabs, not at the gutter",
                   abs(m["secLeft"] - m["tabLeft"]) < 20, m)
    rules = sorted(set(round(v["rule"]) for v in xs.values()))
    ck("the rule stands at ONE x for a short name, a long name and two widths",
       len(xs) == 4 and len(rules) == 1, rules)
    short, longn = xs.get((1440, "mobile")), xs.get((1440, "consumerelectronics"))
    ck("a long name is set smaller", bool(longn and longn["long"]), longn)
    ck("...and a short one is not", bool(short and not short["long"]), short)

    print("\n6 · the tabs on navy")
    pg.set_viewport_size({"width": 1440, "height": 900})
    go(pg, "mobile")
    t = js(pg, """()=>{
      var bar=getComputedStyle(document.getElementById('tabrow')).backgroundColor;
      var sel=document.querySelector('#subtabs [data-s][aria-selected="true"]');
      var rep=document.querySelector('#subtabs [data-s="report"]');
      return { bar:bar, sel: sel?getComputedStyle(sel).color:null,
               selLine: sel?getComputedStyle(sel).borderBottomColor:null,
               rep: rep?getComputedStyle(rep).color:null,
               repBg: rep?getComputedStyle(rep).backgroundColor:null,
               gold: getComputedStyle(document.documentElement).getPropertyValue('--gold').trim() };
    }""", dflt={}) or {}
    bar = rgb(t.get("bar"))
    for k, lab in (("sel", "the selected tab"), ("rep", "the Reporting tab")):
        c = rgb(t.get(k))
        ck("%s reads on the navy (%s)" % (lab, t.get(k)),
           bool(bar and c and ratio(bar, c) >= 4.5), round(ratio(bar, c), 2) if bar and c else t)
    rep = rgb(t.get("rep"))
    ck("Reporting is orange TYPE, not a fill",
       bool(rep and rep[0] > rep[2] + 60) and (t.get("repBg") or "").endswith(", 0)"), t)
    ck("the selected tab is underlined in gold",
       rgb(t.get("selLine")) is not None and rgb(t.get("selLine")) != bar, t)

    print("\n7 · the tour's 'You are here' points at something on the screen")
    viewer(pg, "mobhead")
    go(pg, "mobile")
    vis = js(pg, """()=>{ var e=document.querySelector('#tabrow .unitname');
                         return !!(e && e.checkVisibility && e.checkVisibility()); }""")
    ck("the unit's name is on the screen for a unit head", vis is True, vis)
    old = js(pg, """()=>{ var e=document.querySelector('#units [data-u="mobile"]');
                         return !!(e && e.checkVisibility && e.checkVisibility()); }""")
    ck("...where the row the tour used to point at is not", old is False, old)

    ck("no page errors", not errs, errs[:3])
    br.close()

print("\nnav-chrome: all good" if not bad else "\nnav-chrome: %d FAILED" % bad)
