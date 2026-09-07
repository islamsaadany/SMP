"""THE SETUP PAGE IS NOT A UNIT'S PLAN PAGE (§296).

Islam, of Setup at a squeezed window: *"the whole settings page look like that
when squeezed can we fix this?"*

WHY IT NEEDS ITS OWN FILE RATHER THAN A LINE IN `qa.py`. What is asserted here
is a RELATIONSHIP between two pages that share two class names — Setup's rail
and a unit's pillar rail are both `.rail` inside a `.split` — so the check has
to walk BOTH and assert they now behave differently. A sweep that visits each
page alone cannot see that, which is how the regression shipped.

AND THE UNIT'S PAGE IS THE CONTROL, not an afterthought: §267.2's decision to
send a unit's pillars across at 1200px is argued and measured, and the fix here
is a scoping precisely so that nothing about it moves. A build that "fixed"
Setup by moving the breakpoint back would pass every Setup assertion in this
file and quietly undo that section — which is why section 3 exists.

Run: SMP_CHROME=/opt/pw-browsers/chromium python3 qa-run.py checks/setup-squeezed.py
     SMP_BUILT=/path/to/other.html  points it at another build.
"""

import base64, io, json, os, pathlib, threading, http.server, socketserver, sys
from playwright.sync_api import sync_playwright
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[3]
BUILT = os.environ.get("SMP_BUILT") or str(
    ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")
HTML = pathlib.Path(BUILT).read_bytes()
SW = (ROOT / "sw.js").read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
VAPID = base64.urlsafe_b64encode(b"\x04" + bytes(range(64))).decode().rstrip("=")

CFG = {"on": True, "shots": True, "promise": "Usually answers the same day",
       "beat": 4000, "assistant": False, "popup": True, "notify": False, "away": 10}
QUEUE = [{"person_key": "hend", "person_name": "Hend Farouk", "live_name": "Hend Farouk",
          "waiting": True, "last_at": "2026-08-25T09:19:00Z", "here_at": None,
          "unit_key": "mobile", "fn_key": None, "title": "Head of Mobile", "gone": False,
          "unread": 1, "last_body": "A line.", "last_from_office": False,
          "last_by": "Hend Farouk", "flagged": 0}]
# THE PANEL AT ITS TALLEST IS THE PANEL THIS IS ABOUT. It stands at 521px until
# the two diagnostics have been run and 725px after — the state Islam sent —
# so the check RUNS them rather than measuring the short panel and passing.
TEST = [{"name": "The switch", "state": "ok", "detail": "The assistant answers first"},
        {"name": "The knowledge base", "state": "ok", "detail": "43 how-tos"},
        {"name": "The API key", "state": "fail", "detail": "No GEMINI_API_KEY here."}]
PUSHSTEPS = [{"name": "The chat", "state": "ok", "detail": "ON"},
             {"name": "Notifications", "state": "ok", "detail": "Switched on for the company."},
             {"name": "The sending library", "state": "ok", "detail": "LOADED"},
             {"name": "The signing key", "state": "ok", "detail": "PRESENT"},
             {"name": "This browser", "state": "ok", "detail": "Allowed and registered"},
             {"name": "The send", "state": "ok", "detail": "1 of 1 device took it"}]
GATE = b"<!doctype html><title>Sign in</title><h1 id='gate'>Sign in</h1>"

bad = [0]


def ck(w, ok, x=""):
    if not ok:
        bad[0] += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def _s(self, c, b, t):
        self.send_response(c); self.send_header("Content-Type", t)
        self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)

    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._s(200, json.dumps({"ok": True, "state": SEED, "person": PERSON}).encode(),
                    "application/json"); return
        # §231.5: the worker is a real file, served as the gate serves it, or
        # `register()` rejects on the content type and reads as the product
        # throwing (§100.3).
        if self.path.startswith("/sw.js"):
            self._s(200, SW, "application/javascript"); return
        if self.path.startswith("/raya-trade"):
            self._s(200, HTML, "text/html; charset=utf-8"); return
        self._s(200, GATE, "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        body = json.loads(self.rfile.read(n) or b"{}")
        if not self.path.startswith("/api/chat"):
            self._s(200, b'{"ok":true}', "application/json"); return
        a = body.get("action")
        if a == "assistantTest":
            self._s(200, json.dumps({"ok": True, "steps": TEST}).encode(), "application/json"); return
        if a == "pushTest":
            self._s(200, json.dumps({"ok": True, "steps": PUSHSTEPS}).encode(), "application/json"); return
        if a == "queue":
            self._s(200, json.dumps({"ok": True, "office": True, "threads": QUEUE,
                                     "chat": CFG, "waiting": 1, "flagged": 0,
                                     "hereMinutes": 5, "mail": False}).encode(),
                    "application/json"); return
        self._s(200, json.dumps({"ok": True, "chat": CFG, "vapid": VAPID,
                                 "messages": [], "unread": 0, "thread": None}).encode(),
                "application/json")


class S(socketserver.ThreadingTCPServer):
    allow_reuse_address = True; daemon_threads = True


srv = S(("127.0.0.1", 0), H)
URL = "http://127.0.0.1:%d/raya-trade" % srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()


def drive(pg, theme="light"):
    # The tour and the welcome screen each cover the page, so every click here
    # would land on their overlay (§167). Suppressed as a RETURNING viewer has
    # it — never by reaching into either, which both have their own checks.
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    pg.goto(URL, wait_until="networkidle"); pg.wait_for_timeout(2500)
    if theme == "dark":
        pg.evaluate("()=>{try{THEME.set('dark')}catch(e){"
                    "document.documentElement.setAttribute('data-theme','dark')}}")
        pg.wait_for_timeout(400)
    pg.click('[data-md="setup"]'); pg.wait_for_timeout(900)
    pg.click('[data-setupgo="chat"]'); pg.wait_for_selector("#chinbox", timeout=8000)
    pg.wait_for_timeout(800)


def openpanel(pg):
    pg.evaluate("()=>{const b=document.querySelector('[data-chsetmenu]');"
                "if(b && b.getAttribute('aria-expanded')!=='true') b.click();}")
    pg.wait_for_timeout(400)
    for sel in ("[data-chtest]", "[data-pushtest]"):
        pg.evaluate("(s)=>{const b=document.querySelector(s); if(b) b.click();}", sel)
        pg.wait_for_timeout(700)


PANEL = """() => {
  const p = document.querySelector('.hmenu-panel.chset');
  if (!p) return { none:true };
  const r = p.getBoundingClientRect(), cs = getComputedStyle(p), d = document.documentElement;
  return { h:Math.round(r.height), top:Math.round(r.top), bottom:Math.round(r.bottom),
           width:Math.round(r.width), off:Math.round(r.bottom - innerHeight),
           inside:p.scrollHeight - p.clientHeight,
           sideways:p.scrollWidth - p.clientWidth,
           page:d.scrollHeight - d.clientHeight, ov:cs.overflowY };
}"""


NOOVERLAY = ("try{sessionStorage.setItem('smp.tour.later','1');"
             "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")


def setup(pg):
    pg.add_init_script(NOOVERLAY)
    pg.goto(URL, wait_until="networkidle"); pg.wait_for_timeout(2200)
    pg.click('[data-md="setup"]'); pg.wait_for_timeout(800)
    pg.click('[data-setupgo="chat"]'); pg.wait_for_timeout(1500)


MEASURE = """() => {
  const q=s=>document.querySelector(s), d=document.documentElement;
  const bx=e=>{const r=e.getBoundingClientRect();
    return [Math.round(r.width), Math.round(r.height)];};
  const box=q('#chinbox');
  return { rail:bx(q('.setuprail')), pane:bx(q('.setuppane')),
    chinbox: box ? bx(box) : [0,0],
    titleTop: Math.round(q('.setupttl').getBoundingClientRect().top + scrollY),
    scroll: d.scrollHeight - d.clientHeight };
}"""

with sync_playwright() as pw:
    b = pw.chromium.launch()

    # ── 1 · THE RAIL IS A RAIL, NOT THE WHOLE PAGE ──────────────────────
    # §267.2 moved the shared `.split` from stacking at 820px to 1200px for a
    # UNIT's pillar rail and did not scope it — and `.setupsplit` wears that
    # same class. Between 900 and 1200 the Setup rail became a full-width,
    # window-tall scrolling COLUMN with the page pushed under it. §158's own
    # trap (".pane INCLUDES SETUP") one component over.
    print("\n1 · the Setup page at the widths where it used to stack")
    for w in (1250, 1100, 1000, 950):
        pg = b.new_page(viewport={"width": w, "height": 880})
        setup(pg)
        m = pg.evaluate(MEASURE)
        ck("%d: the rail is a column of its own width" % w, m["rail"][0] == 196, m)
        ck("%d: the page's own title is on screen" % w, m["titleTop"] < 160, m)
        ck("%d: and the page needs no scroll" % w, m["scroll"] == 0, m)
        # THE BOX FILLS THE WINDOW RATHER THAN SITTING ON ITS FLOOR. `--chin-top`
        # is measured at paint (§100.5), so a stacked rail put the Inbox 934px
        # down the document and the calc fell through to its 340px minimum —
        # which is what "the chat part is not full page" was.
        ck("%d: the Inbox fills the window, not its 340px floor" % w,
           m["chinbox"][1] > 400, m)
        pg.close()

    # ── 2 · AND BELOW 900 THE DESIGNED BAND IS STILL THE BAND ───────────
    # Setup's own narrow treatment is unchanged and must stay reachable: a
    # build that kept two columns all the way down would pass every assertion
    # above and squeeze the page at 760px (§94.2).
    print("\n2 · below 900 the band is still the band")
    for w in (860, 760):
        pg = b.new_page(viewport={"width": w, "height": 880})
        setup(pg)
        d = pg.evaluate("()=>getComputedStyle(document.querySelector('.setuprail')).flexDirection")
        m = pg.evaluate(MEASURE)
        ck("%d: the rail reads across, as designed" % w,
           d == "row" and m["rail"][0] > 400, [d, m["rail"]])
        pg.close()

    # ── 3 · A UNIT'S PLAN PAGE IS UNTOUCHED (§267.2) ────────────────────
    # THE CONTROL CASE, and the whole reason the fix is a scoping rather than
    # a breakpoint change: §267.2 is a decision about a unit's pillar rail,
    # argued and measured, and nothing here may move it.
    print("\n3 · a unit's pillar rail still goes across at 1200")
    for w in (1200, 1100, 1000):
        pg = b.new_page(viewport={"width": w, "height": 880})
        pg.add_init_script(NOOVERLAY)
        pg.goto(URL, wait_until="networkidle"); pg.wait_for_timeout(2200)
        pg.click('[data-u="mobile"]'); pg.wait_for_timeout(1500)
        m = pg.evaluate("""()=>{const r=document.querySelector('.split .rail');
          const rr=r.getBoundingClientRect();
          return { w:Math.round(rr.width), h:Math.round(rr.height),
                   disp:getComputedStyle(r).display, pos:getComputedStyle(r).position,
                   cols:getComputedStyle(document.querySelector('.split')).gridTemplateColumns };}""")
        ck("%d: the unit's rail is still the across strip" % w,
           m["disp"] == "flex" and m["pos"] == "static" and m["h"] < 120, m)
        pg.close()
    b.close()

srv.shutdown()
print("\n%d failures" % bad[0])
sys.exit(1 if bad[0] else 0)
