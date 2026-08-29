"""A SETUP PAGE THAT FITS DOES NOT SCROLL, AND THE RAIL'S HEAD STAYS PUT (§167).

Islam, using the Platform Inbox: *"on scrolling up the messaging header is
lost, the side rail of the messages header is lost as well, and the setup rail
header and search are lost — all of this is supposed to be sticky."*

THEY ARE ALL STICKY, AND §135.9 MEASURED THEM HOLDING at eleven window sizes.
What is not sticky is `.setuprail` ITSELF on a page where the rail is the
tallest thing in its row: a sticky box cannot travel past its containing block,
so with no travel `top:97px` never engages and the rail scrolls away with the
page, taking its own pinned head and search with it. Measured on the Inbox at
1440x760 before the fix: at scroll 60 the rail sat at y=37 and its head at
y=38, behind a chrome whose bottom is 75.

AND THE 60px OF SCROLL WAS A GUESSED CONSTANT GOING STALE (§122.5). `.wrap`
ends the page with `padding-bottom:80px`; the rail's cap, the register's
`.panefill` and the inbox box each reserved `20px`. So a page whose content
already fitted the window still ran 60px past it, for nothing — and those 60px
are exactly what slid the rail under the chrome.

WHAT IS ASSERTED IS THE PROBLEM, NOT THE NUMBER (§94.8):

  * a Setup page whose content fits does not scroll the page AT ALL;
  * ...and one whose content does not fit still scrolls, or the fix would have
    been to cap the page rather than to reserve the right space;
  * nothing that is supposed to be pinned ends up behind the chrome, at the
    bottom of the page, at three window sizes, with a conversation OPEN and
    its body scrolled to the end;
  * the capped boxes still end inside the window — reserving too MUCH would
    pass every "not lost" assertion while wasting a strip of every screen.

OVER HTTP WITH A STUB, because the Platform Inbox does not exist over `file://`
(§94.11) and the thread header is only drawn once a conversation is open.

Run: SMP_CHROME=... python3 qa-run.py checks/setup-sticky.py
"""
import json, pathlib, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}

# A conversation long enough that the thread body genuinely scrolls, or the
# assertion "the header held while the body scrolled" measures nothing.
MSGS = [{"id": i + 1, "at": "2026-08-29T09:%02d:00Z" % i,
         "from_office": bool(i % 2), "by_key": "smo" if i % 2 else "hend",
         "by_name": "Strategy Office" if i % 2 else "Hend Farouk",
         "body": "Line %d of a conversation long enough to scroll." % (i + 1),
         "flag": None, "has_shot": False} for i in range(24)]
QUEUE = [{"person_key": "hend", "person_name": "Hend Farouk", "live_name": "Hend Farouk",
          "waiting": True, "last_at": "2026-08-29T09:23:00Z", "here_at": None,
          "unit_key": "mobile", "fn_key": None, "title": "Head of Mobile", "gone": False,
          "unread": 1, "last_body": MSGS[-1]["body"], "last_from_office": True,
          "last_by": "Strategy Office", "flagged": 0}]
CFG = {"on": True, "shots": True, "promise": "Usually answers the same day", "beat": 4000}

bad = 0
errs = []


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


GATE = b"<!doctype html><title>Sign in</title><h1 id='gate'>Sign in</h1>"


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _send(self, code, body, ctype):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._send(200, json.dumps({"ok": True, "state": SEED, "person": PERSON}).encode(),
                       "application/json")
            return
        if self.path.startswith("/raya-trade"):
            self._send(200, HTML, "text/html; charset=utf-8")
            return
        self._send(200, GATE, "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        body = json.loads(self.rfile.read(n) or b"{}")
        if not self.path.startswith("/api/chat"):
            self._send(200, b'{"ok":true}', "application/json")
            return
        a = body.get("action")
        if a == "queue":
            self._send(200, json.dumps({"ok": True, "office": True, "threads": QUEUE,
                                        "chat": CFG, "waiting": 1, "flagged": 0,
                                        "hereMinutes": 5, "mail": False}).encode(),
                       "application/json")
            return
        if a == "thread":
            self._send(200, json.dumps({
                "ok": True, "person": "hend", "name": "Hend Farouk", "gone": False,
                "unit": "mobile", "fn": None, "title": "Head of Mobile", "address": None,
                "waiting": True, "here": False, "hereAt": None, "mail": False,
                "chatOn": True, "messages": MSGS}).encode(), "application/json")
            return
        self._send(200, json.dumps({"ok": True, "office": True, "messages": [],
                                    "unread": 0, "thread": None, "chat": CFG}).encode(),
                   "application/json")


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % PORT
print("serving the built file at " + URL)

# THE PAGES ARE PICKED FOR THEIR SHAPE, NOT FOR THEIR CONTENT: two whose pane
# is shorter than the rail (so the rail is the tallest thing and the fault
# lives) and one whose pane is far taller (so the rail has travel and pins the
# ordinary way). Asserting only the short ones would pass on a build that
# capped the page and stopped it scrolling anywhere at all.
SHORT = ["chat", "people"]
TALL = ["kb"]

# Everything on a Setup page that is supposed to hold. `.chqtop`/`.chthead`
# exist only on the Inbox; a page without them asserts nothing about them
# rather than failing (§61 — a missing element here is a page shape, not a
# fault), and section 3 asserts they were seen at least once so an inbox that
# stopped drawing them cannot pass by absence (§113.8).
PINNED = [("the rail's SETUP bar", ".setuprail .rhead"),
          ("the rail's search", ".setuprail .railfind"),
          ("the page's own title", ".setuphead"),
          ("the conversation list's search", ".chqtop"),
          ("the messaging header", ".chthead")]

SEEN = set()


def measure(pg):
    return pg.evaluate("""(sels) => {
      const ch = document.querySelector('.chrome');
      const cb = ch ? ch.getBoundingClientRect().bottom : 0;
      const out = {chrome: Math.round(cb), seen: []};
      sels.forEach(function(s){
        const e = document.querySelector(s);
        if (!e || !e.getClientRects().length) return;
        const r = e.getBoundingClientRect();
        out.seen.push(s);
        out[s] = {y: Math.round(r.top), b: Math.round(r.bottom),
                  behind: r.top < cb - 1};
      });
      return out; }""", [s for _, s in PINNED])


def open_setup(pg, key):
    pg.click('[data-md="setup"]')
    pg.wait_for_timeout(600)
    pg.click('[data-setupgo="%s"]' % key)
    pg.wait_for_timeout(1400)


with sync_playwright() as p:
    b = p.chromium.launch()
    for W, H in ((1440, 760), (1280, 700), (1600, 900)):
        print("\n%dx%d" % (W, H))
        pg = b.new_page(viewport={"width": W, "height": H})
        pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
        pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
        pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
        pg.goto(URL, wait_until="networkidle")
        pg.wait_for_timeout(2200)
        ex = pg.query_selector(".welcomeover button")
        if ex:
            ex.click()
            pg.wait_for_timeout(700)

        # ── 1 · A PAGE THAT FITS DOES NOT SCROLL ──────────────────────────
        for key in SHORT:
            open_setup(pg, key)
            if key == "chat":
                pg.wait_for_selector(".chqrow", timeout=8000)
                pg.click(".chqrow")
                pg.wait_for_selector("#chtbody", timeout=8000)
                pg.wait_for_timeout(900)
                # THE BODY IS SCROLLED TO THE END, or "the header held" is a
                # claim about a body that never moved.
                pg.evaluate("""() => { const e = document.getElementById('chtbody');
                    if (e) e.scrollTop = e.scrollHeight; }""")
            sc = pg.evaluate(
                "()=>Math.max(0, document.documentElement.scrollHeight - innerHeight)")
            ck("%s · the page does not scroll" % key, sc == 0, "%dpx of scroll" % sc)

            # ── 2 · NOTHING PINNED ENDS UP BEHIND THE CHROME ──────────────
            pg.evaluate("()=>window.scrollTo(0, 99999)")
            pg.wait_for_timeout(350)
            m = measure(pg)
            SEEN.update(m["seen"])
            for word, sel in PINNED:
                if sel not in m:
                    continue
                ck("%s · %s stays clear of the chrome" % (key, word),
                   not m[sel]["behind"], "%s at y=%d, chrome ends %d"
                   % (sel, m[sel]["y"], m["chrome"]))
                ck("%s · %s is inside the window" % (key, word),
                   m[sel]["b"] <= H + 1, "%s ends at %d, window %d" % (sel, m[sel]["b"], H))

            # RESERVING TOO MUCH PASSES EVERY ASSERTION ABOVE while wasting a
            # strip of every screen, so the capped box has to REACH the foot.
            box = pg.evaluate("""() => {
                const e = document.querySelector('.setuprail');
                if (!e) return null;
                const r = e.getBoundingClientRect();
                return {b: Math.round(r.bottom)}; }""")
            if box:
                ck("%s · the rail reaches the foot of the window" % key,
                   H - box["b"] <= 90, "%dpx of empty page below it" % (H - box["b"]))

        # ── 3 · A LONG PAGE STILL SCROLLS, AND THE RAIL PINS ──────────────
        for key in TALL:
            open_setup(pg, key)
            sc = pg.evaluate(
                "()=>Math.max(0, document.documentElement.scrollHeight - innerHeight)")
            ck("%s · a page longer than the window still scrolls" % key, sc > 200, sc)
            pg.evaluate("()=>window.scrollTo(0, 99999)")
            pg.wait_for_timeout(350)
            m = measure(pg)
            for word, sel in PINNED[:3]:
                if sel not in m:
                    continue
                ck("%s · %s stays clear of the chrome" % (key, word),
                   not m[sel]["behind"], "%s at y=%d, chrome ends %d"
                   % (sel, m[sel]["y"], m["chrome"]))
        pg.close()
    b.close()

# THE TWO INBOX-ONLY ELEMENTS WERE ACTUALLY SEEN (§113.8): every assertion
# about them is skipped when they are absent, so without this a build that
# stopped drawing the thread header would pass by never being asked.
print("\nthe inbox's own headers were measured")
for word, sel in PINNED[3:]:
    ck("%s was drawn at least once" % word, sel in SEEN, sel)

print("\nconsole errors: %d" % len(errs))
for e in errs[:5]:
    print("   " + e)
print(("\nFAILURES: %d" % bad) if bad or errs else "\nall clear")
raise SystemExit(1 if (bad or errs) else 0)
