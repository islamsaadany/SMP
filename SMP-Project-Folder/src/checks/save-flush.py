"""THE LAST EDIT SURVIVES LEAVING THE PAGE (§138, closing §126.1).

WHAT WAS BROKEN, recorded not fixed since §126.1: the autosave is debounced
800ms (`afterPaint()` in sync.js), so an edit made and the tab closed or
hidden inside that window was never sent — the screen showed the new value,
the database never received it. Every page shares this path: branding,
terminology, the access matrix, a figure.

WHY THIS CANNOT BE PART OF qa.py: over `file://` nothing hydrates and `live`
stays false, so the whole save path does not exist (§94.11). The built file is
served over HTTP with a stub `/api/state` that records every POST — the
office-chat check's pattern. What is measured is the CLIENT half: that the
bytes leave the browser when the page goes away. The server half of a save is
unchanged by §138 and stays `test-roundtrip.js`'s.

THE SHAPE OF THE TRIAL, and why each piece is there:
  - An edit is made through the real path (a field's setter ends in paint(),
    and paint() ends in afterPaint()) — then the tab is HIDDEN 150ms later,
    inside the debounce window, and navigated away 400ms after that, which
    kills the 800ms timer the way a real close does.
  - On the pre-§138 build the timer dies unfired and the stub records
    NOTHING: the check fails, which is §126.1 reproduced end to end.
  - On this build `flushLeave()` fires on visibilitychange and the stub holds
    a POST whose body carries the edited value.
  - A second trial asserts the flush is not a firehose: with nothing changed,
    hiding the tab sends nothing.

Run: SMP_CHROME=... python3 qa-run.py checks/save-flush.py
"""
import json, pathlib, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
GATE = b"<!doctype html><title>Sign in</title><h1 id='gate'>Sign in</h1>"

POSTS = []
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


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
        raw = self.rfile.read(n)
        if self.path.startswith("/api/state"):
            POSTS.append(raw.decode("utf-8", "replace"))
        self._send(200, b'{"ok":true}', "application/json")


def no_tour(pg):
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');}catch(e){}")


srv = socketserver.TCPServer(("127.0.0.1", 0), H)
port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()

MARK = "FLUSH-CHECK-9Q4"

with sync_playwright() as p:
    b = p.chromium.launch()

    print("— an edit made, the tab hidden inside the debounce window —")
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    no_tour(pg)
    pg.goto("http://127.0.0.1:%d/raya-trade" % port)
    pg.wait_for_timeout(1500)
    live = pg.evaluate("typeof SYNC !== 'undefined' && SYNC.isLive()")
    ck("the platform hydrated from the stub", live is True, live)
    # The edit goes through the REAL becoming-a-save path: mutate the graph
    # and paint(), which ends in afterPaint() and arms the 800ms timer.
    pg.evaluate("GROUP.org = %s; paint();" % json.dumps(MARK))
    pg.wait_for_timeout(150)
    # Hide the tab — a switch-away or a close both pass through here.
    pg.evaluate("""() => {
      Object.defineProperty(document, "hidden", {configurable: true, get: () => true});
      Object.defineProperty(document, "visibilityState", {configurable: true, get: () => "hidden"});
      document.dispatchEvent(new Event("visibilitychange"));
    }""")
    pg.wait_for_timeout(400)
    # Leaving kills the debounce timer the way a real close does — so on a
    # build with no flush, nothing can arrive after this line either.
    pg.goto("about:blank")
    pg.wait_for_timeout(600)
    sent = [x for x in POSTS if MARK in x]
    ck("the edit reached the server before the page went away", bool(sent),
       "%d posts, none carrying the mark" % len(POSTS))
    pg.close()

    # ── A CHANGE IS SENT AT THE MOMENT IT IS MADE (§170) ────────────────
    # WHAT THIS DOES *NOT* DO IS DRIVE A RELOAD, and that is the finding. The
    # first version of this section pressed, reloaded 150ms later and asserted
    # the POST arrived — and it PASSED on the pre-§170 build, because this stub
    # answers in under a millisecond, so even the plain fetch `flushLeave()`
    # issues at `pagehide` lands before the navigation can tear it down. A real
    # server parsing 216KB, authorising it and writing thirty tables does not,
    # which is why the loss reproduces against `scripts/dev-server.js` and a
    # real Postgres and cannot reproduce here (§94.5: a check that cannot fail
    # is not a check).
    #
    # So what is asserted is the PROPERTY that fixes it and that this harness
    # can see honestly: a change is on the wire straight away rather than 800ms
    # later. Whether it then survives a hard navigation is the server's
    # problem, and it only has a body to work with if it was sent.
    print("— a change is sent at once, not in 800ms —")
    POSTS.clear()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    no_tour(pg)
    pg.goto("http://127.0.0.1:%d/raya-trade" % port)
    pg.wait_for_timeout(1500)
    POSTS.clear()
    MARK2 = "AT-ONCE-7T2"
    pg.evaluate("GROUP.org = %s; paint();" % json.dumps(MARK2))
    pg.wait_for_timeout(250)          # well inside the 800ms the old build waited
    early = [x for x in POSTS if MARK2 in x]
    ck("the change is on the wire inside 250ms", bool(early),
       "%d posts after 250ms" % len(POSTS))
    # AND IT IS NOT A FIREHOSE. A leading edge that bought durability by
    # posting the whole 216KB graph once per click would be a bad trade; the
    # trailing timer is what stops it, and this is the regression guard on it
    # rather than a reproduction of anything.
    pg.wait_for_timeout(1200)
    POSTS.clear()
    pg.evaluate("""() => { for (var i = 0; i < 5; i++) { GROUP.org = "burst-" + i; paint(); } }""")
    pg.wait_for_timeout(2200)
    ck("five changes in one burst cost at most two saves", len(POSTS) <= 2,
       "%d posts" % len(POSTS))
    ck("...and the LAST of them is what the server ends up with",
       bool(POSTS) and "burst-4" in POSTS[-1], POSTS[-1][:60] if POSTS else "nothing")
    pg.close()

    print("— nothing changed: hiding the tab sends nothing —")
    POSTS.clear()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    no_tour(pg)
    pg.goto("http://127.0.0.1:%d/raya-trade" % port)
    pg.wait_for_timeout(1500)
    pg.evaluate("""() => {
      Object.defineProperty(document, "hidden", {configurable: true, get: () => true});
      Object.defineProperty(document, "visibilityState", {configurable: true, get: () => "hidden"});
      document.dispatchEvent(new Event("visibilitychange"));
    }""")
    pg.wait_for_timeout(400)
    ck("a clean state sends no save on leave", not POSTS, "%d posts" % len(POSTS))
    pg.close()
    b.close()

srv.shutdown()
print("save-flush: %s" % ("OK" if bad == 0 else "%d FAILURES" % bad))
raise SystemExit(1 if bad else 0)
