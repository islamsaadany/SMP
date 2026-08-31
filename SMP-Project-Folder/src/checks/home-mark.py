"""THE HOME MARK: QUIET, GOLD, AND CENTRED (§197.2).

Islam, twice. First *"the home button is damaged"* — measured: the row is
`align-items:stretch`, every sibling is its full 46px, and the mark asks for
a fixed height, so it sat at the row's TOP EDGE with twelve pixels of nothing
beneath it. Then *"it can be option E when there is no actions waiting and it
turns gold when there is action required, so the SMO or any other team can
notice the difference and go for actions."*

WHAT IS ASSERTED, and none of it is a colour literal (§94.8):

  · CENTRED in its row, at every width — the reported damage.
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
import json, pathlib, threading, http.server, socketserver
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
           first: document.getElementById('units').firstElementChild === h,
           reaches: !!(hit && h.contains(hit)), waiting: n };
}"""

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
    ck("...and a click at its centre reaches it", d.get("reaches"), d)

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
