#!/usr/bin/env python3
"""Only the rows open (§320.3, spec 046 §4.6a).

Islam, of two behaviours drawn side by side for the client card: "2" — the
card's name is not pressable, and every way into a client from Forefront's
console names a module.

WHAT THIS ASSERTS IS THE DECISION, NOT THE LAYOUT (§94.8): the top does not
navigate, a row does, and the row goes to that module's address. A later
change to the row's padding or its hover stays green; a build that made the
card a door again does not.

AND BOTH ENDS EVERY TIME (§94.2). "The top is not a door" is satisfied
perfectly by a card with no doors at all, so every absence here is asserted
beside the presence that makes it mean something — and the module's own state
is asserted to appear ONCE on the card, because moving it out of the foot and
forgetting to draw it in the row reads as a tidy-up rather than a loss.

THE ROW IS A REAL BUTTON, asserted by focusing it: a <div> with a click
handler renders identically and cannot be reached from a keyboard (§61).

IT NEEDS NO DATABASE, for platform-cards.py's reason — the page is served as
it is by both stacks, so a stub drives it, and the stub is also the only way
to make the states that matter (a client nobody may open, a module with
nothing to say).

Run:  SMP_CHROME=… python3 SMP-Project-Folder/src/checks/client-card-modules.py
      … --break=card-is-door   # the behaviour before §320.3; must go red
      … --break=no-rows        # the other end; must go red
      SMP_PAGE=smp-app/shell/platform.html …   # the new stack's own copy
"""
import http.server, json, os, re, socketserver, sys, threading
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
REPO = os.path.abspath(os.path.join(ROOT, ".."))
PORT = int(os.environ.get("SMP_CHECK_PORT", "3986"))
BASE = "http://127.0.0.1:%d" % PORT
BREAK = next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--break=")), "")
PAGE = os.environ.get("SMP_PAGE") or os.path.join(REPO, "platform.html")

fails, passes = [], []
def check(what, ok, detail=""):
    if ok:
        passes.append(what); print("  ok   " + what)
    else:
        print("  FAIL " + what + ("  — " + str(detail) if detail else "")); fails.append(what)

STRAT = lambda st: [{"key": "strategy", "label": "Strategy", "state": st}]
CARDS = [
    # a client in flight: Strategy has something to say
    {"key": "raya-trade", "name": "Raya Trade", "industry": "Trade & distribution", "kind": "client",
     "mark": None, "mine": True, "seat": "super", "state": "open", "canOpen": True, "canConfig": True,
     "units": 10, "planned": True, "cycleOpen": True, "unreadable": False, "modules": STRAT("cycle open")},
    # a module with NOTHING to say draws its name alone, never a placeholder
    {"key": "rhi", "name": "RHI", "industry": None, "kind": "client",
     "mark": None, "mine": True, "seat": "smoteam", "state": "open", "canOpen": True, "canConfig": True,
     "units": 4, "planned": True, "cycleOpen": False, "unreadable": False, "modules": STRAT("")},
    # a client this person may NOT open: no way in, so no rows (§61)
    {"key": "el-abd", "name": "El Abd", "industry": None, "kind": "client",
     "mark": None, "mine": False, "seat": None, "state": "open", "canOpen": False, "canConfig": False,
     "units": 0, "planned": False, "cycleOpen": False, "unreadable": False, "modules": STRAT("no plan yet")},
]
DEMO = {"key": "demo", "name": "Demo", "industry": "The worked example", "kind": "demo",
        "mark": None, "mine": True, "seat": None, "state": "open", "canOpen": True, "canConfig": True,
        "units": 10, "planned": True, "cycleOpen": True, "unreadable": False, "modules": STRAT("cycle open")}
SCENE = {"cards": CARDS + [DEMO]}

class Stub(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def _send(self, body, ctype):
        b = body.encode("utf-8")
        self.send_response(200); self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/platform" or path == "/":
            with open(PAGE, encoding="utf-8") as f: self._send(f.read(), "text/html; charset=utf-8")
            return
        # the new stack's copy is GENERATED from this one with the script moved
        # to a file — walking one copy proves one copy (§53.5, A15)
        if path == "/platform-page.js":
            with open(os.path.join(REPO, "smp-app", "public", "platform-page.js"), encoding="utf-8") as f:
                self._send(f.read(), "application/javascript; charset=utf-8")
            return
        # EVERY ADDRESS A ROW CAN SEND US TO ANSWERS, so a press is a real
        # navigation and the URL afterwards is the product's own answer. Only
        # those: anything else 404s, or a stylesheet or script the page asks
        # for comes back as HTML and the run reports the STUB as a page error
        # (§100.3 — a stub that answers everything is answering for the
        # product).
        if re.match(r"^/[a-z0-9][a-z0-9-]*/[a-z]+$", path):
            self._send("<!doctype html><title>opened</title>", "text/html; charset=utf-8")
            return
        self.send_response(404); self.end_headers()
    def do_POST(self):
        n = int(self.headers.get("Content-Length", "0"))
        body = json.loads(self.rfile.read(n) or b"{}")
        act = body.get("action")
        if act == "me":
            out = {"ok": True, "account": {"email": "a@forefront.example", "name": "Admin", "isAdmin": True},
                   "access": {}, "mine": [c["key"] for c in CARDS]}
        elif act == "cards":
            out = dict(SCENE); out.update({"ok": True, "canAdd": True, "canConsultants": True, "canAccess": True})
        else:
            out = {"ok": True}
        self._send(json.dumps(out), "application/json")

# SET BEFORE THE BIND, or it does nothing: my own first build set it on the
# instance afterwards and the check could not be run twice in a row.
socketserver.TCPServer.allow_reuse_address = True
srv = socketserver.TCPServer(("127.0.0.1", PORT), Stub)
threading.Thread(target=srv.serve_forever, daemon=True).start()

BREAKS = {
    # the behaviour before §320.3: the whole card is the door again
    "card-is-door": """
      document.querySelectorAll('.ccard[data-client]').forEach(function (c) {
        c.addEventListener('click', function () { location.assign('/' + c.dataset.client); });
      });""",
    # the other end: the rows are gone, so "the top is not a door" is true of
    # a card nobody can open at all
    "no-rows": "document.querySelectorAll('.mods').forEach(function (m) { m.remove(); });",
}

def main():
    chrome = os.environ.get("SMP_CHROME")
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path=chrome) if chrome else pw.chromium.launch()
        pg = b.new_page(viewport={"width": 1280, "height": 900})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))

        def land():
            pg.goto(BASE + "/platform", wait_until="networkidle")
            pg.wait_for_selector(".ccard[data-client]", timeout=9000)
            if BREAK in BREAKS: pg.evaluate(BREAKS[BREAK])

        print("── 1 · the rows are the doors")
        land()
        shape = pg.evaluate("""() => {
          const c = document.querySelector('.ccard[data-client="raya-trade"]');
          const rows = Array.from(c.querySelectorAll('.mrow'));
          return {
            cardTag: c.tagName,
            cardIsButton: c.tagName === 'BUTTON',
            rows: rows.map(r => ({ tag: r.tagName, mod: r.dataset.module, text: r.textContent.trim() })),
            footText: (c.querySelector('.foot') || {}).textContent || '',
            cardText: c.textContent,
          };
        }""")
        check("a card is not a button — it holds them (§320.3)", not shape["cardIsButton"], shape["cardTag"])
        check("…and it draws one row per module the server sent",
              [r["mod"] for r in shape["rows"]] == ["strategy"], shape["rows"])
        check("…each a real <button>, or a keyboard cannot reach it (§61)",
              all(r["tag"] == "BUTTON" for r in shape["rows"]), shape["rows"])
        check("…named as the server names it", shape["rows"] and shape["rows"][0]["text"].startswith("Strategy"),
              shape["rows"][0]["text"] if shape["rows"] else None)

        # the module's own state moved out of the foot WITH it — said once,
        # never twice (§87) and never nowhere
        check("the module's state is on its row", "cycle open" in (shape["rows"][0]["text"] if shape["rows"] else ""),
              shape["rows"][0]["text"] if shape["rows"] else None)
        check("…and exactly once on the whole card (§87)",
              shape["cardText"].lower().count("cycle open") == 1, shape["cardText"])
        check("…while the seat and the units, which are the client's, stay in the foot",
              "Super user" in shape["footText"] and "10 units" in shape["footText"], shape["footText"])

        print("── 2 · pressing the name does nothing, pressing the row opens the module")
        before = pg.url
        pg.click('.ccard[data-client="raya-trade"] .ctop h2')
        pg.wait_for_timeout(500)
        check("the card's name is not a door", pg.url == before, pg.url)
        pg.click('.ccard[data-client="raya-trade"] .mrow[data-module="strategy"]')
        pg.wait_for_load_state("networkidle")
        check("…and the row opens the client INSIDE that module",
              pg.url.endswith("/raya-trade/strategy"), pg.url)

        print("── 3 · the states the demo cannot show")
        land()
        rhi = pg.evaluate("""() => {
          const c = document.querySelector('.ccard[data-client="rhi"]');
          const r = c.querySelector('.mrow');
          return { text: r.textContent.trim(), hasState: !!r.querySelector('i') };
        }""")
        check("a module with nothing to say draws its name alone (§35: no placeholder)",
              rhi["text"] == "Strategy" and not rhi["hasState"], rhi)
        shut = pg.evaluate("""() => {
          const c = document.querySelector('.ccard[data-client="el-abd"]');
          return { rows: c.querySelectorAll('.mrow').length, text: c.textContent, listed: c.className };
        }""")
        check("a client nobody may open draws no rows — there is no way in (§61)", shut["rows"] == 0, shut["rows"])
        check("…and still says so", "Listed only" in shut["text"], shut["text"][:80])
        demo = pg.evaluate("""() => document.querySelectorAll('.apart .ccard .mrow').length""")
        check("the worked example is opened the same way (§317 left it a card like any other)", demo == 1, demo)

        print("── 4 · Settings is still its own control")
        land()
        before = pg.url
        pg.click('.ccard[data-client="raya-trade"] .ccfg')
        pg.wait_for_timeout(500)
        check("pressing Settings opens the client's configuration and navigates nowhere",
              pg.url == before, pg.url)

        check("no page error on the way", not errs, " | ".join(errs)[:200])
        b.close()
    srv.shutdown()
    # CLOSED, not merely stopped: shutdown() ends the serve loop and leaves the
    # socket bound, so the next run of this file cannot take the port back
    # (platform-cards.py's own note, earned again here).
    srv.server_close()
    print("\n%s  %d ok, %d failed" % ("GREEN" if not fails else "RED  ", len(passes), len(fails)))
    sys.exit(1 if fails else 0)

main()
