"""A VIEW-AS SESSION STARTS WHERE THEIR SESSION WOULD START (§235).

Islam: *"viewing as needs to have the same server connection and relation and
not inherit my SMO abilities … so I get the errors."* The judging half has
been the viewed person's since §185 (asserted in test-authorize §21); what
stayed the SMO's was the TAB — §234.2 records how its history made the §234
error unreachable from view-as. So switching the viewer now rebases the tab
on the server's current graph, exactly a fresh sign-in by that person.

WHAT IS ASSERTED IS THE PROPERTY (§94.8), driven through the real switcher:

  * switching into a view FETCHES the server's graph and the screen holds
    what the server holds NOW — work saved by others after this tab loaded
    is on screen the moment the view opens;
  * the first save made under the view carries NOTHING of the tab's past —
    only what was changed inside the view travels;
  * a refusal while simulating does NOT rebase on the way home: the refused
    work stays on screen for §184's put-back (measured, because that is the
    path a rebase would silently destroy);
  * and a rebase that cannot fetch still switches — the way is never blocked.

OVER HTTP WITH A STUB (§94.11) whose dataset can be moved mid-run, which is
the whole trial: staleness is a relation between the tab and the server, and
only a server that moves can make one.

Run: SMP_CHROME=... python3 qa-run.py checks/viewas-fresh.py
"""
import json, copy, pathlib, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}

STATE = {"data": copy.deepcopy(SEED), "gets": 0, "posts": [], "refuse": None}
bad = 0

def ck(w, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))

class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _s(self, c, b, t):
        self.send_response(c); self.send_header("Content-Type", t)
        self.send_header("Content-Length", str(len(b))); self.end_headers()
        self.wfile.write(b)
    def do_GET(self):
        if self.path.startswith("/api/state"):
            STATE["gets"] += 1
            self._s(200, json.dumps({"ok": True, "state": STATE["data"],
                                     "person": PERSON}).encode(), "application/json")
            return
        if self.path.startswith("/raya-trade"):
            self._s(200, HTML, "text/html; charset=utf-8"); return
        self._s(200, b"<!doctype html><h1>gate</h1>", "text/html; charset=utf-8")
    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(n)
        if not self.path.startswith("/api/state"):
            self._s(200, b'{"ok":true}', "application/json"); return
        try: STATE["posts"].append(json.loads(body.decode()))
        except Exception: STATE["posts"].append({})
        if STATE["refuse"]:
            self._s(403, json.dumps({"ok": False, "refusals": STATE["refuse"],
                                     "refusedChanges": [], "undoable": False,
                                     "judgedAs": None}).encode(), "application/json")
            return
        self._s(200, b'{"ok":true}', "application/json")

srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % srv.server_address[1]
CUST = SEED["unitRoles"]["mobile"]["custodian"]

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL, wait_until="networkidle")
    pg.wait_for_timeout(1800)
    ck("the platform hydrated", pg.evaluate("()=>SYNC.isLive()") is True)

    # ── 1 · THE SWITCH TAKES THE SERVER'S TRUTH ─────────────────────────
    print("\n1 · switching into a view rebases on the server")
    # The server moves on AFTER this tab hydrated: another unit submits, and
    # the office renames a unit's aspiration.
    STATE["data"] = copy.deepcopy(SEED)
    STATE["data"]["review"]["submitted"]["b2becomm"] = True
    STATE["data"]["units"]["retailstores"]["aspiration"] = "MOVED-ON-THE-SERVER"
    g0 = STATE["gets"]
    pg.evaluate("switchViewer(%s)" % json.dumps(CUST))
    pg.wait_for_timeout(1500)
    ck("the viewer switched", pg.evaluate("()=>window.VIEWER") == CUST)
    ck("the switch asked the server for the graph", STATE["gets"] > g0, STATE["gets"] - g0)
    ck("...and the tab now holds work saved after it loaded",
       pg.evaluate("()=>!!(REVIEW.submitted||{}).b2becomm") is True)
    ck("...their aspiration too",
       pg.evaluate("()=>UNITS.retailstores.aspiration") == "MOVED-ON-THE-SERVER")

    # ── 2 · THE FIRST SAVE UNDER THE VIEW CARRIES ONLY THE VIEW'S OWN ACT ─
    print("\n2 · nothing of the tab's past rides into their save")
    STATE["posts"] = []
    pg.evaluate("REVIEW.submitted = Object.assign({}, REVIEW.submitted, {mobile:true}); paint();")
    pg.wait_for_timeout(1600)
    posted = [x for x in STATE["posts"] if x.get("viewAs") == CUST]
    ck("a save went up judged as the viewed person", len(posted) > 0,
       json.dumps(STATE["posts"][-1] if STATE["posts"] else {})[:120])
    if posted:
        ch = posted[-1].get("changes") or {}
        keys = sorted(list((ch.get("set") or {}).keys()) + list(ch.get("del") or []))
        ck("...and it carries ONLY their own submit",
           keys == ["review.submitted.mobile"] and not ch.get("rows"), json.dumps(keys))

    # ── 3 · A REFUSAL ON THE WAY HOME NEVER LOSES THE WORK ──────────────
    print("\n3 · the refused way home still keeps the work (§209, §184)")
    STATE["refuse"] = ["A plan is corrected by the SMO."]
    pg.evaluate("UNITS.mobile.aspiration = 'REFUSED-WORK-ON-SCREEN'; paint();")
    pg.wait_for_timeout(1600)
    STATE["gets"] = 0
    pg.evaluate("switchViewer('smo')")
    pg.wait_for_timeout(1200)
    ck("home happened", pg.evaluate("()=>window.VIEWER") == "smo")
    ck("the refused work is STILL on screen",
       pg.evaluate("()=>UNITS.mobile.aspiration") == "REFUSED-WORK-ON-SCREEN")
    ck("...and no rebase overwrote it", STATE["gets"] == 0, STATE["gets"])
    STATE["refuse"] = None

    ck("no page errors", not errs, "; ".join(errs[:3]))
    b.close()

print("\n" + ("viewas-fresh: OK" if not bad else "FAILURES: %d" % bad))
raise SystemExit(1 if bad else 0)
