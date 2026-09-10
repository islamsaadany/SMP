"""THE HOME MARK: QUIET, GOLD, AND CENTRED (§197.2).

qa-run: own-server — this check SERVES the built file itself, with a stub it
programs (a failing save, a stale build, a second person landing). The served
app cannot be told to fail on demand, so re-pointing it would measure something
else; the client under test is `sync.js`, carried into the new app verbatim, and
the new app's own end is asserted in smp-app/checks (§316.1).

Islam, twice. First *"the home button is damaged"* — measured: the row is
`align-items:stretch`, every sibling is its full 46px, and the mark asks for
a fixed height, so it sat at the row's TOP EDGE with twelve pixels of nothing
beneath it. Then *"it can be option E when there is no actions waiting and it
turns gold when there is action required, so the SMO or any other team can
notice the difference and go for actions."*

Then a third time (§302) — *"the home icon is not centered in the top box"* —
and this time the BUTTON was innocent: 6.00px above and below in the bar,
6.50px on all four sides of the drawing, every assertion below green. Two
things were measured off it. +0.50px across, from 13px of slack that cannot
halve into whole pixels; and the painted house sitting 2.06px low, because a
house has a pointed roof and so carries nearly all its ink in its lower half —
its bounding box centres and its MASS does not.

SO THE INK IS MEASURED NOW, NOT ONLY THE ELEMENT. The four gaps below were
exactly right on the build Islam reported: an assertion about where the SVG
sits cannot see a drawing that is off-centre inside it, which is the whole
reason this pass exists. Read off the PAINTED PIXELS at 8× (§185, §294.1) and
asserted as AGREEMENT with the square's own centre (§94.8).

AND WHICH READING IS ASSERTED IS ISLAM'S CALL, NOT AN ARITHMETIC ONE (§302.3).
§302 centred the MASS and he ruled against it — *"we need to center the
drawing in the box not the weight"* — so the assertion is the drawing's own
BOUNDING BOX, and the centroid is measured beside it and merely printed. The
two cannot both be nought, so asserting the one is choosing against the other,
and that choice belongs in the decisions log rather than in a tolerance.

WHAT IS ASSERTED, and none of it is a colour literal (§94.8):

  · CENTRED in its row, at every width — the reported damage.
  · AND THE DRAWING'S OWN BOX CENTRED IN THE SQUARE, which is a different
    question from where the SVG element sits and is the one that was wrong.
  · THE SLACK HALVES INTO WHOLE PIXELS, so nothing is left for the browser
    to snap — asserted as "a whole number", never as the 20px that produces
    it, or a later mark size fails for being different rather than wrong.
  · THE TWO STATES DIFFER, and differ in the FILL: quiet has no ground at
    all, gold has one. Asserted as "these must not be equal" rather than as
    two hex values, so a rebrand stays green (§53.5) and a build where both
    collapsed to one look fails (§113.8).
  · THE BOX DOES NOT CHANGE between them. A mark that grew when something
    arrived would shift every destination name on the row (§41.8).
  · THE MARK AGREES WITH THE SCREEN IT OPENS (§16.7). Gold exactly when
    `WELCOME.waiting()` is above zero — never a literal count, because the
    demo's own queue changes as the plan does.
  · IT CAN BE PRESSED. Present-and-unreachable is this project's recurring
    fault (§70, §93.4, §110), so the click is a real one and the welcome
    screen must actually open.

INVISIBLE OVER file:// (§94.11): `welcomeBtnHTML()` returns nothing there,
because the welcome screen cannot exist without a server. Served over HTTP.

PROVE IT CAN FAIL (§94.5): against main's build the centring and the quiet
state both fail — the mark is gold always and sits at y=29 in a row of 46.

Run:  SMP_CHROME=/opt/pw-browsers/chromium python3 qa-run.py checks/home-mark.py
"""
import io, json, pathlib, threading, http.server, socketserver
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
GATE = b"<!doctype html><title>Sign in</title><h1 id='gate'>Sign in</h1>"
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _send(self, c, b, t):
        self.send_response(c); self.send_header("Content-Type", t)
        self.send_header("Content-Length", str(len(b))); self.end_headers()
        try:
            self.wfile.write(b)
        except BrokenPipeError:
            pass

    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._send(200, json.dumps({"ok": True, "state": SEED, "person": PERSON}).encode(),
                       "application/json"); return
        if self.path.startswith("/raya-trade"):
            self._send(200, HTML, "text/html; charset=utf-8"); return
        self._send(200, GATE, "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0); self.rfile.read(n)
        self._send(200, json.dumps({"ok": True, "messages": [], "unread": 0, "thread": None,
                                    "office": True,
                                    "chat": {"on": True, "shots": True, "beat": 4000,
                                             "promise": "Usually the same day"}}).encode(),
                   "application/json")


class S(socketserver.ThreadingTCPServer):
    allow_reuse_address = True; daemon_threads = True


srv = S(("127.0.0.1", 0), H)
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % srv.server_address[1]

READ = """() => {
  const h = document.querySelector('.homemark');
  if (!h) return { missing:true };
  const cs = getComputedStyle(h), r = h.getBoundingClientRect();
  const row = document.getElementById('units').getBoundingClientRect();
  const svg = h.querySelector('svg'), sr = svg && svg.getBoundingClientRect();
  const hit = document.elementFromPoint(r.x + r.width/2, r.y + r.height/2);
  let n = 0; try { n = WELCOME.waiting(viewer()); } catch(e){ n = 'no fn'; }
  return { gold: h.classList.contains('homemark-on'),
           bg: cs.backgroundColor, ink: cs.color, title: h.title,
           w: Math.round(r.width), h: Math.round(r.height),
           mid: Math.round(r.y + r.height/2), rowMid: Math.round(row.y + row.height/2),
           svgW: sr ? Math.round(sr.width) : null,
           /* §202: THE MARK'S OWN MARGINS INSIDE THE BOX. The button box
              can be a perfect square with the house jammed against one
              edge — measured 1px left, 12px right — so the square is not
              the assertion, the four gaps are. */
           padL: sr ? Math.round(sr.left - r.left) : null,
           padR: sr ? Math.round(r.right - sr.right) : null,
           padT: sr ? Math.round(sr.top - r.top) : null,
           padB: sr ? Math.round(r.bottom - sr.bottom) : null,
           /* §302: and the slack must HALVE into whole pixels, or the
              browser snaps the drawing half a pixel sideways. Unrounded,
              because the rounded pair above reports 6.5/6.5 as 7/7 and
              would call the reported build clean. */
           slackX: sr ? (r.width - sr.width) / 2 : null,
           slackY: sr ? (r.height - sr.height) / 2 : null,
           first: document.getElementById('units').firstElementChild === h,
           reaches: !!(hit && h.contains(hit)), waiting: n };
}"""

def rgb(css):
    return tuple(int(float(v)) for v in
                 str(css)[str(css).index("(") + 1:str(css).index(")")].split(",")[:3])


def ink_where(page, box, ink, ground):
    """Two readings of the painted house against the centre of its square.

    `box` — the outermost ink on each side, so where the DRAWING's own
    bounding box sits. This is what "centred in the box" means and it is what
    §302.3 asserts, at Islam's direction.

    `weight` — the ALPHA-WEIGHTED centroid: each pixel scored by how far it
    has been carried from the ground toward the stroke, so a half-covered edge
    counts for half and nothing is thrown away by a threshold. Reported and
    deliberately NOT asserted (§302.3): a pointed roof puts nearly all its ink
    low, so the two readings cannot both be nought, and which one is centred is
    a decision rather than a defect. Printed so the trade stays visible in the
    run instead of looking like a thing nobody paid for.

    Sampled INSIDE the drawing's own box (§302): the square's stroke colour and
    the bar behind it are one navy, so its rounded corners read as house ink
    and the mark measures a perfect 34×34. That reported a correct build clean
    twice while this was being written (§294.1's family).
    """
    shot = page.screenshot(clip={"x": box["x"], "y": box["y"],
                                 "width": box["w"], "height": box["h"]})
    im = Image.open(io.BytesIO(shot)).convert("RGB")
    px, (W, H) = im.load(), im.size
    s = W / box["w"]
    lo, hi = int(5.5 * s), int(28.5 * s)
    nx = ny = tot = 0.0
    x0 = y0 = 10 ** 9
    x1 = y1 = -1
    for x in range(lo, hi):
        for y in range(lo, hi):
            p = px[x, y]
            di = sum((a - b) ** 2 for a, b in zip(p, ink)) ** .5
            dg = sum((a - b) ** 2 for a, b in zip(p, ground)) ** .5
            a = max(0.0, ((dg / (di + dg)) - .5) * 2) if (di + dg) else 0.0
            nx += a * (x + .5); ny += a * (y + .5); tot += a
            # Half covered or more is an EDGE. The centroid needs every scrap
            # of antialiasing; the bounding box needs to stop somewhere, or a
            # single stray pixel of blur decides where the drawing ends.
            if a >= .5:
                x0 = min(x0, x); x1 = max(x1, x)
                y0 = min(y0, y); y1 = max(y1, y)
    if not tot or x1 < 0:
        return None
    return {"box": (round(((x0 + x1 + 1) / 2 - W / 2) / s, 3),
                    round(((y0 + y1 + 1) / 2 - H / 2) / s, 3)),
            "weight": (round(((nx / tot) - W / 2) / s, 3),
                       round(((ny / tot) - H / 2) / s, 3))}


# A ground that is any flavour of fully transparent counts as "no fill" —
# never a string compare, which is how §108.15's sweep measured everything
# against black (`'rgba(0,0,0,0)'` vs `'rgba(0, 0, 0, 0)'` is a spelling).
def filled(css):
    m = str(css).replace(" ", "")
    if m.startswith("rgba("):
        try:
            return float(m[5:-1].split(",")[3]) > 0.01
        except Exception:
            return True
    return m not in ("transparent", "none", "")


with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={"width": 1500, "height": 950})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    pg.goto(BASE + "/raya-trade"); pg.wait_for_timeout(1800)

    print("\n── 1 · it leads the row, and it is centred in it")
    d = pg.evaluate(READ)
    ck("the mark is drawn", not d.get("missing"), d)
    ck("...first on the row (§193.2)", d.get("first"), d)
    ck("...vertically centred — the reported damage",
       abs(d["mid"] - d["rowMid"]) <= 1, (d["mid"], d["rowMid"]))
    # §200.2: AND SQUARE AT EVERY WIDTH. The row is flex, and with nothing
    # saying this box may not shrink it was a 24×34 gold RECTANGLE at 1000px —
    # "still damaged", the day after the centring fix. Asserted narrow, where
    # the squeeze happened, never only wide.
    pg.set_viewport_size({"width": 1000, "height": 950}); pg.wait_for_timeout(400)
    sq = pg.evaluate(READ)
    ck("...and still a 34px SQUARE at 1000px — the row may not squeeze it",
       sq["w"] == sq["h"] == 34, (sq["w"], sq["h"]))
    # §202: AND THE HOUSE IS CENTRED INSIDE THAT SQUARE. `.navmenu-btn` is a
    # worded pill — align-items:center with the text starting at the left —
    # so the box was square and the mark sat hard against one edge (1px left,
    # 12px right, at every width, in both states). The four gaps are the
    # assertion; a square box alone passes on the build that was reported.
    ck("...with the house CENTRED in it at 1000px, not against an edge",
       abs(sq["padL"] - sq["padR"]) <= 1 and abs(sq["padT"] - sq["padB"]) <= 1,
       (sq["padL"], sq["padR"], sq["padT"], sq["padB"]))
    pg.set_viewport_size({"width": 1500, "height": 950}); pg.wait_for_timeout(400)
    d = pg.evaluate(READ)
    ck("...and a click at its centre reaches it", d.get("reaches"), d)
    ck("...and centred at 1500 too", abs(d["padL"] - d["padR"]) <= 1
       and abs(d["padT"] - d["padB"]) <= 1,
       (d["padL"], d["padR"], d["padT"], d["padB"]))
    # §302: AND THE SLACK HALVES INTO WHOLE PIXELS. 13px of it cannot, so the
    # browser snapped the drawing half a pixel sideways — measured +0.50 at
    # every width and zoom alike, which is what said it was arithmetic and not
    # layout. Asserted as "a whole number", never as the mark size that gives
    # one, so a later size fails for being wrong rather than for being new.
    ck("...and the slack halves into whole pixels, so nothing snaps",
       d["slackX"] % 1 == 0 and d["slackY"] % 1 == 0, (d["slackX"], d["slackY"]))

    print("\n── 1b · and the DRAWING's own box is centred in the square")
    # THE ASSERTION NEITHER BUILD BEFORE THIS ONE WOULD PASS (§94.5), and it
    # was REWRITTEN rather than deleted (§218). §302 asserted the ink's centre
    # of MASS and shipped a build whose drawing sat 1.438px HIGH; the build
    # Islam first reported had it 2.06px LOW. Both fail this line, which is
    # what makes it worth having — a box assertion on the ELEMENT passed on
    # both, because the element was never what was off. Measured at 8× in the
    # state the page opens in: one drawing serves both states by construction,
    # and §4 below asserts the mark does not change between them, so measuring
    # it twice would measure the same pixels under two names.
    big = b.new_page(viewport={"width": 1500, "height": 950}, device_scale_factor=8)
    big.on("pageerror", lambda e: errs.append(str(e)))
    big.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                        "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    big.goto(BASE + "/raya-trade"); big.wait_for_timeout(1800)
    for w in (1500, 1000):
        big.set_viewport_size({"width": w, "height": 950}); big.wait_for_timeout(400)
        cs = big.evaluate("""() => { const h = document.querySelector('.homemark');
            const s = getComputedStyle(h), r = h.getBoundingClientRect();
            return { ink: s.color, bg: s.backgroundColor,
                     bar: getComputedStyle(document.getElementById('units')).backgroundColor,
                     box: {x:r.x, y:r.y, w:r.width, h:r.height} }; }""")
        off = ink_where(big, cs["box"], rgb(cs["ink"]),
                        rgb(cs["bg"] if filled(cs["bg"]) else cs["bar"]))
        ck("at %dpx the drawing's box sits on the square's centre" % w,
           off is not None and abs(off["box"][0]) <= .35 and abs(off["box"][1]) <= .35,
           off)
    big.close()

    print("\n── 2 · GOLD, because this office has something waiting")
    ck("something is waiting", isinstance(d["waiting"], int) and d["waiting"] > 0, d["waiting"])
    ck("...so the mark is gold", d["gold"], d)
    ck("...with a real fill", filled(d["bg"]), d["bg"])
    ck("...and the title says how many", "waiting on you" in (d["title"] or ""), d["title"])
    gold = dict(d)

    print("\n── 3 · QUIET, when nothing is")
    # MAKE the state (§94.2): this office heads the SMO function and owes it a
    # submission, which is real and is why §2 above has anything to measure.
    pg.evaluate("""() => { if (FUNCTIONS.smo) FUNCTIONS.smo.head = '';
                           UNIT_KEYS.forEach(k => { if (UNIT_ROLES[k] && !UNIT_ROLES[k].custodian)
                             UNIT_ROLES[k].custodian = PEOPLE[1] && PEOPLE[1].key; });
                           OVQUEUE = { waiting: 0 }; paint(); }""")
    pg.wait_for_timeout(600)
    q = pg.evaluate(READ)
    ck("nothing is waiting now", q["waiting"] == 0, q["waiting"])
    ck("...so the mark is not gold", not q["gold"], q)
    ck("...and carries NO fill at all", not filled(q["bg"]), q["bg"])
    ck("...but is still drawn and still reachable", q.get("reaches"), q)
    ck("...and its title asks rather than announces",
       "waiting on you" not in (q["title"] or ""), q["title"])

    print("\n── 4 · the two states differ, and only in the fill")
    ck("the grounds are NOT the same", gold["bg"] != q["bg"], (gold["bg"], q["bg"]))
    ck("the box does not change size (§41.8)",
       (gold["w"], gold["h"]) == (q["w"], q["h"]), (gold["w"], gold["h"], q["w"], q["h"]))
    ck("...nor does the mark inside it", gold["svgW"] == q["svgW"], (gold["svgW"], q["svgW"]))

    print("\n── 5 · it opens the screen it is about (§16.7)")
    pg.click(".homemark"); pg.wait_for_timeout(700)
    ck("the welcome screen opened",
       pg.evaluate("() => !!document.querySelector('.welcomeover')"))
    ck("no page errors", not errs, errs[:2])

srv.shutdown()
print("\n" + ("all passed" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
