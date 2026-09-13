#!/usr/bin/env python3
"""The worked example is not one of the clients (§317).

Islam, of Forefront's own page: "the demo should be a separate client on the
platform outside beside the clients." It was IN the client grid — third
across, with the way to add a client after it — so the page counted it as one.

WHAT THIS ASSERTS IS THE PROBLEM, NOT THE LAYOUT (§94.8): the demo is out of
the grid, it is below it, the client count is a count of clients, and the box
that says "Search clients" no longer reaches it. A later change to the band's
spacing or its key stays green; a build that put the demo back does not.

AND BOTH ENDS EVERY TIME (§94.2). A build that simply DELETED the demo card
would satisfy "it is not in the grid" perfectly, so every absence here is
asserted beside the presence that makes it meaningful — the demo is drawn, it
keeps the amber ground and the Demo tag it already wore, and its door still
works.

IT NEEDS NO DATABASE. platform.html is served as it is by both stacks, so the
page is driven against a stub that answers /api/platform — which is also the
only way to make the state that matters: a platform seeded with the worked
example and NO clients yet, which the demo tenant makes unreachable on any
real deployment (§94.11, §255).

Run:  SMP_CHROME=… python3 SMP-Project-Folder/src/checks/platform-cards.py
      … --break=in-grid   # the behaviour before §317; must go red
      SMP_PAGE=smp-app/shell/platform.html …   # the new stack's own copy

WHAT THE BREAK CANNOT REACH, SAID RATHER THAN LEFT AS A GAP: `--break=in-grid`
moves the card in the DOM after the page has drawn, so it cannot put back the
count that READ `j.cards.length`. That half is proved instead by the state in
section 3 — the worked example seeded with no clients — which no real
deployment can be made to show and which the stub makes on purpose (§255).
"""
import http.server, json, os, socketserver, sys, threading
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
REPO = os.path.abspath(os.path.join(ROOT, ".."))
PORT = int(os.environ.get("SMP_CHECK_PORT", "3987"))
BASE = "http://127.0.0.1:%d" % PORT
BREAK = next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--break=")), "")
PAGE = os.environ.get("SMP_PAGE") or os.path.join(REPO, "platform.html")

fails = []
passes = []
def check(what, ok, detail=""):
    if ok:
        passes.append(what)
        print("  ok   " + what)
    else:
        print("  FAIL " + what + ("  — " + str(detail) if detail else ""))
        fails.append(what)

CLIENTS = [
    {"key": "raya-trade", "name": "Raya Trade", "industry": "Trade & distribution", "kind": "client",
     "mark": None, "mine": True, "seat": "super", "state": "open", "canOpen": True, "canConfig": True,
     "units": 10, "planned": True, "cycleOpen": True, "unreadable": False,
     "modules": [{"key": "strategy", "label": "Strategy", "state": "cycle open"}]},
    {"key": "rhi", "name": "RHI", "industry": None, "kind": "client",
     "mark": None, "mine": True, "seat": "super", "state": "open", "canOpen": True, "canConfig": True,
     "units": 0, "planned": False, "cycleOpen": False, "unreadable": False,
     "modules": [{"key": "strategy", "label": "Strategy", "state": "no plan yet"}]},
    {"key": "el-abd", "name": "El Abd", "industry": None, "kind": "client",
     "mark": None, "mine": True, "seat": "super", "state": "open", "canOpen": True, "canConfig": True,
     "units": 0, "planned": False, "cycleOpen": False, "unreadable": False,
     "modules": [{"key": "strategy", "label": "Strategy", "state": "no plan yet"}]},
]
DEMO = {"key": "demo", "name": "Demo", "industry": "The worked example", "kind": "demo",
        "mark": None, "mine": True, "seat": None, "state": "open", "canOpen": True, "canConfig": True,
        "units": 10, "planned": True, "cycleOpen": True, "unreadable": False,
        "modules": [{"key": "strategy", "label": "Strategy", "state": "cycle open"}]}

# The server sorts `ORDER BY kind, name`, so the demo arrives LAST — modelled
# exactly, or the check would be measuring a list the product never receives
# (§100.3: a stub that does not model the server tests something else).
SCENE = {"cards": CLIENTS + [DEMO]}

class Stub(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def _send(self, body, ctype):
        b = body.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)
    def do_GET(self):
        path = self.path.split("?")[0]
        if path in ("/platform", "/"):
            with open(PAGE, encoding="utf-8") as f:
                self._send(f.read(), "text/html; charset=utf-8")
            return
        # BOTH STACKS SERVE THIS PAGE AND MUST NOT DRIFT (§53.5, A15). The new
        # stack's copy is GENERATED from this one with the inline script moved
        # to a file, so SMP_PAGE points the run at it and the script it asks
        # for is served from beside it — walking one copy proves one copy.
        if path == "/platform-page.js":
            with open(os.path.join(REPO, "smp-app", "public", "platform-page.js"), encoding="utf-8") as f:
                self._send(f.read(), "application/javascript; charset=utf-8")
            return
        self.send_response(404); self.end_headers()
    def do_POST(self):
        n = int(self.headers.get("Content-Length", "0"))
        body = json.loads(self.rfile.read(n) or "{}")
        act = body.get("action")
        if act == "me":
            self._send(json.dumps({"ok": True, "account": {
                "email": "islam.saadany@forefront.consulting", "name": "Islam Saadany",
                "isAdmin": True}}), "application/json")
        elif act == "cards":
            self._send(json.dumps({"ok": True, "cards": SCENE["cards"],
                "canAdd": True, "canConsultants": True, "canAccess": True}), "application/json")
        else:
            self._send(json.dumps({"ok": True}), "application/json")

def serve():
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", PORT), Stub)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

# ── the falsification: the behaviour before §317, put back ───────────────
# Applied to the PAGE rather than to the sources, because platform.html is
# hand-written and served as it is — there is no build step to make a broken
# copy through (§276's rule needs one; this page has none).
PUT_IT_BACK = """() => {
  const grid = document.querySelector("[data-grid='clients']");
  const apart = document.querySelector('.apart');
  if (!apart) return false;
  const card = apart.querySelector('.ccard');
  const add = grid.querySelector('.ccard.add');
  grid.insertBefore(card, add || null);
  apart.remove();
  return true;
}"""

def run():
    srv = serve()
    exe = os.environ.get("SMP_CHROME")
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=exe) if exe else p.chromium.launch()
        pg = b.new_page(viewport={"width": 1440, "height": 900})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))

        # ══ 1 · three clients and the demo ══════════════════════════════
        print("\n1 · the clients, and the worked example beneath them")
        SCENE["cards"] = CLIENTS + [DEMO]
        pg.goto(BASE + "/platform")
        pg.wait_for_selector(".ccard", timeout=9000)
        if BREAK == "in-grid":
            pg.evaluate(PUT_IT_BACK)

        shape = pg.evaluate("""() => {
          const grid = document.querySelector("[data-grid='clients']");
          const apart = document.querySelector('.apart');
          const names = e => Array.from(e ? e.querySelectorAll('.ccard[data-client] h2') : [])
            .map(h => h.textContent);
          const g = grid.getBoundingClientRect();
          const a = apart ? apart.getBoundingClientRect() : null;
          const dcard = apart ? apart.querySelector('.ccard') : null;
          const ccard = grid.querySelector('.ccard[data-client]');
          return {
            grid: names(grid),
            apart: names(apart),
            hasApart: !!apart,
            akey: apart ? (apart.querySelector('.akey') || {}).textContent : null,
            addInGrid: !!grid.querySelector('.ccard.add'),
            addLast: grid.lastElementChild ? grid.lastElementChild.classList.contains('add') : false,
            apartBelow: a ? a.top >= g.bottom - 1 : null,
            demoGround: dcard ? getComputedStyle(dcard).backgroundColor : null,
            clientGround: ccard ? getComputedStyle(ccard).backgroundColor : null,
            demoTag: dcard ? !!dcard.querySelector('.tag.demo') : null,
            demoOpens: dcard ? dcard.dataset.client : null,
            demoWidth: dcard ? Math.round(dcard.getBoundingClientRect().width) : null,
            clientWidth: ccard ? Math.round(ccard.getBoundingClientRect().width) : null,
            said: Array.from(document.querySelectorAll('#page .said, #page .err')).map(e => e.textContent)
          };
        }""")

        check("the client grid holds the clients and not the demo",
              shape["grid"] == ["Raya Trade", "RHI", "El Abd"], shape["grid"])
        check("…and the way to add a client comes after the last real one",
              shape["addInGrid"] and shape["addLast"], shape)
        # BOTH ENDS: a build that deleted the demo passes the assertion above.
        check("the demo is still drawn, in a band of its own",
              shape["hasApart"] and shape["apart"] == ["Demo"], shape["apart"])
        check("…and that band is below the client grid",
              shape["apartBelow"] is True, shape["apartBelow"])
        check("…under a key naming what it is",
              (shape["akey"] or "").strip().lower() == "the worked example", shape["akey"])
        # Nothing about the card itself moved (§94.2 from the other side).
        check("the demo card keeps the amber ground it already wore",
              shape["demoGround"] not in (None, shape["clientGround"]),
              (shape["demoGround"], shape["clientGround"]))
        check("…keeps its Demo tag", shape["demoTag"] is True)
        check("…and still opens its own client", shape["demoOpens"] == "demo", shape["demoOpens"])
        # A card grown to the page would read as MORE important than the
        # clients above it, which is the opposite of setting it apart.
        check("…at the grid's own track width, not the page's",
              shape["demoWidth"] is not None and abs(shape["demoWidth"] - shape["clientWidth"]) <= 2,
              (shape["demoWidth"], shape["clientWidth"]))
        check("nothing is said about there being no clients", shape["said"] == [], shape["said"])

        # ══ 2 · the search says "Search clients" and means it ═══════════
        print("\n2 · the search")
        pg.fill(".ptitle .fld", "demo")
        after = pg.evaluate("""() => {
          const grid = document.querySelector("[data-grid='clients']");
          const apart = document.querySelector('.apart');
          const vis = e => Array.from(e ? e.querySelectorAll('.ccard[data-client]') : [])
            .filter(c => !c.hidden).map(c => c.dataset.client);
          return { grid: vis(grid), apart: vis(apart) };
        }""")
        check("a search for the demo turns up no client", after["grid"] == [], after["grid"])
        check("…and does not reach into the band either", after["apart"] == ["demo"], after["apart"])
        pg.fill(".ptitle .fld", "rhi")
        one = pg.eval_on_selector_all(
            "[data-grid='clients'] .ccard[data-client]",
            "els => els.filter(c => !c.hidden).map(c => c.dataset.client)")
        check("…and a search for a client still finds it", one == ["rhi"], one)
        pg.fill(".ptitle .fld", "")

        # ══ 3 · the state a real deployment cannot show (§255) ══════════
        print("\n3 · the worked example seeded, and no clients yet")
        SCENE["cards"] = [DEMO]
        pg.goto(BASE + "/platform")
        pg.wait_for_selector(".ccard", timeout=9000)
        if BREAK == "in-grid":
            pg.evaluate(PUT_IT_BACK)
        empty = pg.evaluate("""() => ({
          said: Array.from(document.querySelectorAll('#page .said, #page .err')).map(e => e.textContent),
          add: !!document.querySelector("[data-grid='clients'] .ccard.add"),
          apart: !!document.querySelector('.apart .ccard[data-client="demo"]'),
          gridClients: document.querySelectorAll("[data-grid='clients'] .ccard[data-client]").length
        })""")
        # THE COUNT READ `j.cards.length`, WHICH INCLUDED THE DEMO — so this
        # sentence never drew and the one person who could add a client was
        # shown a single amber card and no way in (§61).
        check("the page says there are no clients yet",
              any("No clients yet" in s for s in empty["said"]), empty["said"])
        check("…with the way in still drawn", empty["add"] is True)
        check("…and the worked example still in its band",
              empty["apart"] is True and empty["gridClients"] == 0, empty)

        # ══ 4 · the key is words, and words are measured (§38.5) ═══════
        # --ink-3 is set against the quietest ground it sits on and this key
        # sits on --ground in both themes — but a token cleared elsewhere is
        # not thereby cleared here (§40), and this file has walked into that
        # trap by number more than once. Measured, in both palettes.
        print("\n4 · the band's key, read")
        RATIO = """(sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const lin = c => { c = c / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
          const lum = s => { const m = s.match(/[\\d.]+/g).map(Number);
            return 0.2126 * lin(m[0]) + 0.7152 * lin(m[1]) + 0.0722 * lin(m[2]); };
          let g = null;
          for (let n = el; n; n = n.parentElement) {
            const bg = getComputedStyle(n).backgroundColor;
            const a = (bg.match(/[\\d.]+/g) || [0,0,0,0]).map(Number);
            if (bg && bg !== 'rgba(0, 0, 0, 0)' && (a.length < 4 || a[3] > 0)) { g = bg; break; }
          }
          if (!g) return null;
          const a = lum(getComputedStyle(el).color), b = lum(g);
          return Math.round(((Math.max(a,b) + 0.05) / (Math.min(a,b) + 0.05)) * 100) / 100;
        }"""
        SCENE["cards"] = CLIENTS + [DEMO]
        for theme in ("light", "dark"):
            pg.emulate_media(color_scheme=theme)
            pg.goto(BASE + "/platform")
            pg.wait_for_selector(".apart .akey", timeout=9000)
            r = pg.evaluate(RATIO, ".apart .akey")
            check("the key reads in " + theme + " (" + str(r) + ":1)", r is not None and r >= 4.5, r)
        pg.emulate_media(color_scheme="light")

        check("no page error anywhere", errs == [], errs)
        b.close()
    srv.shutdown()
    # CLOSED, not merely stopped: shutdown() ends the serve loop and leaves the
    # listening socket bound, so a second run in the same minute dies on
    # "Address already in use" — a check that cannot be re-run is a check
    # people stop running.
    srv.server_close()

    # COUNTED, NEVER A LITERAL — a written-in total goes stale the day an
    # assertion is added and reports the wrong number for ever (§214.3).
    print("\n%d ok, %d failed" % (len(passes), len(fails)))
    if fails:
        print("FAILED: " + "; ".join(fails))
    return 1 if fails else 0

if __name__ == "__main__":
    sys.exit(run())
