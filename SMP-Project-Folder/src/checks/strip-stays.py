"""On a squeezed window the strip of directions stays and the title goes (§609).

Islam, of a unit's Plan page below 1200px: *"the directions are not freezed,
they might be squeezed a bit but stay"*; of the title pinned under them, *"is
it a repetition?"*; and of the strip in the mockup, *"the text needs to wrap
and the highlighting needs to be more clear and the other directions titles
to be dimmed"*. Mockup signed off:
design-mockups/pinned-directions/2026-10-23_directions-stay-in-view.html.

WHAT IS ASSERTED IS THE PROMISE, NOT THE MECHANISM (§94.8):

  1 · THE STRIP STAYS. Scrolled, the strip is where it was at rest — the
      scroll is asserted to have happened first (§113.8), or a page too short
      to scroll passes for the wrong reason.
  2 · THE TITLE GOES. The open direction's band has moved by the scroll, so
      nothing but the strip is held under the chrome; while editing, the head
      that replaces the band goes the same way.
  3 · EVERY DIRECTION IS ON IT. One row, each item inside the strip's own
      box, nothing to scroll sideways to — at 1100, 900 and 760.
  4 · NO NAME IS CUT. Each name's whole text is painted (nothing clamped),
      at every width; and where the strip carries numbers (Performance's
      scores, a report's tallies) the name sits on its own line below them.
  5 · THE OPEN ONE IS FILLED AND THE OTHERS STEP BACK. The open item's ground
      is the section switch's own selected ground and the switch's own type;
      the others' names are the quiet ink. A score on the filled item keeps
      a ground of its own, so its scoring colour is not read on the fill.
  6 · THE CORNERS SHOW THE PAGE. Pinned, a pixel inside each rounded corner
      is the page's ground and not the plan sliding behind — read as PAINT,
      because a pseudo-element is invisible to every DOM probe (band-corner's
      rule). The screenshot is decoded by the browser's own canvas, so the
      suite still needs no image library.
  6b · THE STRIP IS ITS OWN CARD (§611). Pinned, its navy outline is unbroken
      on all four sides and a gutter of page ground lies under it.
  7 · ABOVE 1200 NOTHING MOVES (§94.2). The vertical rail is a list, and the
      band beside it is still pinned once scrolled.

Point it at another build with SMP_BUILT to falsify it; it was run against
the build before §609 (ui-versions/pinned-directions/) and fails there.

Run: python3 qa-run.py checks/strip-stays.py
"""
import base64, os
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
F = os.environ.get("SMP_BUILT",
    os.path.join(os.path.dirname(HERE), "strategy-management-platform.html"))
INIT = ("try{sessionStorage.setItem('smp.welcome.done','1');"
        "sessionStorage.setItem('smp.welcome.seen','1');"
        "sessionStorage.setItem('smp.tour.later','1');"
        "localStorage.setItem('smp.tour.never','1')}catch(e){}")
fails = []


def ok(label, cond, detail=""):
    if cond:
        print("  ok      " + label)
    else:
        fails.append(label)
        print("  FAIL    " + label + ("  — " + str(detail) if detail else ""))


STRIP = r"""() => {
  var r = document.querySelector('.split > .rail');
  if (!r) return null;
  var q = r.getBoundingClientRect(), s = r.querySelector('.sortable') || r;
  var its = [].map.call(r.querySelectorAll('.ritem'), function(b){
    var x = b.getBoundingClientRect(), nm = b.querySelector('b'), cd = b.querySelector('.rcode');
    return { top: Math.round(x.top), left: x.left, right: x.right,
             on: b.classList.contains('on'),
             cut: nm ? nm.scrollHeight > nm.clientHeight + 1 || nm.scrollWidth > nm.clientWidth + 1 : false,
             nameTop: nm ? nm.getBoundingClientRect().top : 0,
             codeBottom: cd ? cd.getBoundingClientRect().bottom : 0,
             bg: getComputedStyle(b).backgroundColor,
             ink: nm ? getComputedStyle(nm).color : '' };
  });
  var tops = {}; its.forEach(function(i){ tops[i.top] = 1; });
  var band = document.querySelector('.split > .pane > .pband, .split > .pane > .ptitle.edhead');
  return { top: q.top, bottom: q.bottom, left: q.left, right: q.right,
           rows: Object.keys(tops).length, n: its.length, items: its,
           sideways: s.scrollWidth - s.clientWidth,
           band: band ? band.getBoundingClientRect().top : null,
           sy: scrollY };
}"""

# The tokens the strip is promised to wear, read off the page as colours, so
# the check follows the palette rather than a typed hex.
TOKENS = r"""() => {
  var p = document.createElement('i'); document.body.appendChild(p);
  var out = {};
  ['--stone', '--surface', '--ink-3', '--ground'].forEach(function(t){
    p.style.color = 'var(' + t + ')'; out[t] = getComputedStyle(p).color; });
  p.remove(); return out;
}"""

SCORE = r"""() => {
  var n = document.querySelector('.split > .rail .ritem.on .rnum');
  return n ? getComputedStyle(n).backgroundColor : null;
}"""

DECODE = r"""async (b64) => {
  var im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
  var c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
  var x = c.getContext('2d'); x.drawImage(im, 0, 0);
  return { w: im.width, data: Array.from(x.getImageData(0, 0, im.width, im.height).data) };
}"""


def rgb(css):
    return tuple(int(v) for v in css[css.index("(") + 1:css.index(")")].split(",")[:3])


def page(b, w, h=760):
    pg = b.new_page(viewport={"width": w, "height": h})
    pg.add_init_script(INIT)
    pg._errs = []
    pg.on("pageerror", lambda e: pg._errs.append(str(e)))
    pg.goto("file://" + F)
    pg.wait_for_timeout(1300)
    return pg


def go(pg, sub=None, sub2=None, oi=None):
    pg.click('[role=tab][data-u="mobile"]'); pg.wait_for_timeout(500)
    if sub:
        pg.click('[role=tab][data-s="%s"]' % sub); pg.wait_for_timeout(600)
    if sub2:
        pg.click('[role=tab][data-sub2="%s"]' % sub2); pg.wait_for_timeout(600)
    if oi is not None:
        pg.click('.split > .rail .ritem[data-oi="%d"]' % oi); pg.wait_for_timeout(500)


def scroll(pg, y):
    pg.mouse.wheel(0, y); pg.wait_for_timeout(600)


def corners(pg, s, ground):
    """The colour of a pixel one in from each of the strip's four corners."""
    shot = pg.screenshot()
    img = pg.evaluate(DECODE, base64.b64encode(shot).decode())
    w = img["w"]
    def px(x, y):
        i = (int(y) * w + int(x)) * 4
        return tuple(img["data"][i:i + 3])
    pts = {"top left": (s["left"] + 1, s["top"] + 1), "top right": (s["right"] - 2, s["top"] + 1),
           "bottom left": (s["left"] + 1, s["bottom"] - 2), "bottom right": (s["right"] - 2, s["bottom"] - 2)}
    return {k: px(*v) for k, v in pts.items()}


def edges(pg, s):
    """§611: the outline on all four sides, and the gutter under the strip."""
    shot = pg.screenshot()
    img = pg.evaluate(DECODE, base64.b64encode(shot).decode())
    w = img["w"]
    def px(x, y):
        i = (int(y) * w + int(x)) * 4
        return tuple(img["data"][i:i + 3])
    mid = s["left"] + (s["right"] - s["left"]) * 0.7      # over a closed item
    midy = s["top"] + (s["bottom"] - s["top"]) / 2
    line = {"top": px(mid, s["top"]), "bottom": px(mid, s["bottom"] - 1),
            "right": px(s["right"] - 1, midy), "left": px(s["left"], s["top"] + 12)}
    gutter = [px(mid, s["bottom"] + d) for d in (3, 8, 13)]
    return line, gutter


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME"))

    # ── 1, 2, 3, 4, 5, 6 · a unit's Plan, reading, at three squeezed widths.
    for w in (1100, 900, 760):
        pg = page(b, w)
        go(pg, sub2="plan")
        rest = pg.evaluate(STRIP)
        if not rest:
            ok("%d · the Plan page has a strip" % w, False); pg.close(); continue
        tok = pg.evaluate(TOKENS)
        ok("%d · every direction is on ONE row" % w, rest["rows"] == 1 and rest["n"] > 1, rest["rows"])
        inside = all(i["left"] >= rest["left"] - 1 and i["right"] <= rest["right"] + 1 for i in rest["items"])
        ok("%d · every direction sits inside the strip, none to scroll to" % w,
           inside and rest["sideways"] <= 1, {"sideways": rest["sideways"]})
        ok("%d · no direction's name is cut" % w, not any(i["cut"] for i in rest["items"]),
           [i["cut"] for i in rest["items"]])
        on = [i for i in rest["items"] if i["on"]]
        off = [i for i in rest["items"] if not i["on"]]
        ok("%d · the open direction wears the section switch's selected ground and type" % w,
           len(on) == 1 and on[0]["bg"] == tok["--stone"] and on[0]["ink"] == tok["--surface"],
           on and (on[0]["bg"], on[0]["ink"], tok["--stone"], tok["--surface"]))
        ok("%d · the other directions step back to the quiet ink" % w,
           off and all(i["ink"] == tok["--ink-3"] and i["bg"] != tok["--stone"] for i in off),
           [(i["ink"], i["bg"]) for i in off])
        scroll(pg, 450)
        s = pg.evaluate(STRIP)
        ok("%d · the page scrolled (so what follows is measured pinned)" % w, s["sy"] > 100, s["sy"])
        ok("%d · the strip stays where it stood" % w, abs(s["top"] - rest["top"]) <= 1,
           {"rest": rest["top"], "now": s["top"]})
        ok("%d · the title went with the plan" % w,
           s["band"] is not None and abs((rest["band"] - s["sy"]) - s["band"]) <= 1,
           {"rest": rest["band"], "now": s["band"], "sy": s["sy"]})
        if w == 1100:
            g = rgb(tok["--ground"])
            c = corners(pg, s, g)
            ok("1100 · pinned, the strip's four corners show the page's ground",
               all(max(abs(a - b2) for a, b2 in zip(v, g)) <= 3 for v in c.values()),
               {"ground": g, **c})
            line, gutter = edges(pg, s)
            st = rgb(tok["--stone"])
            ok("1100 · pinned, the strip's outline runs round all four sides in the navy (§611)",
               all(max(abs(a - b2) for a, b2 in zip(v, st)) <= 40 for v in line.values()),
               {"stone": st, **line})
            ok("1100 · pinned, the plan stops a gutter short of the strip — page ground under it (§611)",
               all(max(abs(a - b2) for a, b2 in zip(v, g)) <= 3 for v in gutter), {"ground": g, "gutter": gutter})
        if pg._errs:
            ok("%d · no page errors" % w, False, pg._errs[:2])
        pg.close()

    # ── 3 again · the open direction at the far end, where it is widest.
    pg = page(b, 760)
    go(pg, sub2="plan", oi=3)
    s = pg.evaluate(STRIP)
    ok("760 · the last direction open: every name still whole, every direction on the strip",
       s and s["rows"] == 1 and not any(i["cut"] for i in s["items"]) and s["sideways"] <= 1,
       s and ([i["cut"] for i in s["items"]], s["sideways"]))
    pg.close()

    # ── 4, 5 · Performance: a strip that carries numbers.
    for w in (1100, 760):
        pg = page(b, w)
        go(pg, sub="performance")
        s = pg.evaluate(STRIP)
        tok = pg.evaluate(TOKENS)
        if not s:
            ok("%d · Performance has a strip" % w, False); pg.close(); continue
        ok("%d · Performance · one row, no name cut" % w,
           s["rows"] == 1 and not any(i["cut"] for i in s["items"]), [i["cut"] for i in s["items"]])
        ok("%d · Performance · each name has its own line under the code and score" % w,
           all(i["nameTop"] >= i["codeBottom"] - 1 for i in s["items"]),
           [(round(i["nameTop"]), round(i["codeBottom"])) for i in s["items"]])
        ok("%d · Performance · the open direction's score keeps a ground of its own" % w,
           pg.evaluate(SCORE) == tok["--surface"], (pg.evaluate(SCORE), tok["--surface"]))
        pg.close()

    # ── 2 · editing: the head that replaces the band goes as well, the strip stays.
    pg = page(b, 1100)
    go(pg, sub2="plan")
    pg.click(".secpen"); pg.wait_for_timeout(800)
    rest = pg.evaluate(STRIP)
    scroll(pg, 700)
    s = pg.evaluate(STRIP)
    ok("editing · the page scrolled", s and s["sy"] > 100, s and s["sy"])
    ok("editing · the strip pins under the chrome and stays",
       s and abs(s["top"] - pg.evaluate("()=>parseFloat(getComputedStyle(document.querySelector('.split > .rail')).top)")) <= 1,
       s and s["top"])
    ok("editing · the head being edited went with the plan",
       s and rest and s["band"] is not None and abs((rest["band"] - (s["sy"] - rest["sy"])) - s["band"]) <= 1,
       s and {"rest": rest["band"], "now": s["band"]})
    ok("editing · the reorder handles sit on the strip's one row",
       s and s["rows"] == 1 and pg.evaluate("()=>document.querySelectorAll('.split > .rail .ritem .grip').length") == s["n"])
    pg.close()

    # ── 7 · a wide window is untouched: a list down the side, the title pinned.
    pg = page(b, 1440, 700)
    go(pg, sub2="plan")
    s = pg.evaluate(STRIP)
    ok("1440 · the side rail is still a list", s and s["rows"] == s["n"], s and s["rows"])
    scroll(pg, 400)
    pinned = pg.evaluate("""() => { var b = document.querySelector('.split > .pane > .pband');
      return [b.getBoundingClientRect().top, parseFloat(getComputedStyle(b).top), scrollY]; }""")
    ok("1440 · scrolled, the title is still pinned beside it",
       pinned[2] > 100 and abs(pinned[0] - pinned[1]) <= 1, pinned)
    pg.close()

    b.close()

print("\n%s — %d failed" % ("strip-stays", len(fails)) if fails else "\nstrip-stays — all good")
