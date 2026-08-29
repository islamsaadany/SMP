"""A SAVE THAT FAILS SAYS SO ON THE PAGE (§171).

Islam, twice: *"the roles and access are not saving."* It saves in every
configuration this repository can build — the demo tenant, a CLEARED tenant
(what a real deployment is, §67), and a refresh 150ms after the press — read
back from `access_grants` each time. So whatever happens on his deployment is
not visible from here, and THAT is the fault worth fixing: a save that fails
wrote one line to a console nobody has open.

§32 made a REFUSED save (403) say so on the page and stopped there; §160.4
recorded the other half and left it. Left, a 500, a dropped connection or a
timeout look exactly like a save that worked — the screen holds the new value,
the database does not, and the next reload silently reverts.

WHAT IS ASSERTED IS THE PROBLEM, NOT THE WORDING (§94.8):

  * a save the server rejects with a 500 leaves something on the page;
  * ...naming the status, because "500" and "could not reach" send somebody to
    two different places (§123);
  * a save that cannot reach the server at all says a DIFFERENT thing;
  * the banner CLEARS once a save succeeds — a warning that outlives its cause
    is worse than none (§35);
  * a refusal still gets its own list and its Discard button, unchanged;
  * demo data says so at the moment of the change, not only in the standing
    banner;
  * and over `file://` nothing is said at all, because nothing was expected to
    save (§94.11's condition, from the other side).

OVER HTTP WITH A STUB, because none of this exists over `file://` (§94.11) —
and the stub can be told to fail, which is the whole trial.

Run: SMP_CHROME=... python3 qa-run.py checks/save-said.py
"""
import json, pathlib, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
GATE = b"<!doctype html><title>Sign in</title><h1 id='gate'>Sign in</h1>"

# What the stub does with a POSTed state. Changed mid-run, which is the trial.
POST = {"status": 200, "refusals": None}
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _s(self, c, b, t):
        self.send_response(c)
        self.send_header("Content-Type", t)
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._s(200, json.dumps({"ok": True, "state": SEED, "person": PERSON}).encode(),
                    "application/json")
            return
        if self.path.startswith("/raya-trade"):
            self._s(200, HTML, "text/html; charset=utf-8")
            return
        self._s(200, GATE, "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        self.rfile.read(n)
        if not self.path.startswith("/api/state"):
            self._s(200, b'{"ok":true}', "application/json")
            return
        if POST["status"] == 403:
            self._s(403, json.dumps({"ok": False, "refusals": POST["refusals"] or
                                     ["A plan is corrected by the SMO."]}).encode(),
                    "application/json")
            return
        # "CANNOT REACH" IS MODELLED BY DROPPING THE CONNECTION, not by killing
        # the server: a closed listener cannot be rebound inside one run (the
        # port sits in TIME_WAIT) and a merely shut-down one leaves the socket
        # listening, so the fetch hangs instead of rejecting. Dropping is also
        # the more faithful shape — a reset mid-request is what a real network
        # failure looks like to fetch().
        if POST["status"] == "drop":
            try:
                self.connection.close()
            except Exception:
                pass
            return
        if POST["status"] != 200:
            self._s(POST["status"], b'{"ok":false,"error":"boom"}', "application/json")
            return
        self._s(200, b'{"ok":true}', "application/json")


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % PORT
FILE_URL = "file://" + str(ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")


def banner(pg):
    return pg.evaluate("""() => {
      const e = document.getElementById('refused');
      return (e && !e.hidden) ? e.textContent.replace(/\\s+/g,' ').trim() : ""; }""")


def change(pg, mark):
    """Through the REAL path: mutate the graph and paint(), which ends in
       afterPaint() — never by calling save() directly, or the trial would be
       of a function nothing in the product reaches that way."""
    pg.evaluate("GROUP.org = %s; paint();" % json.dumps(mark))
    pg.wait_for_timeout(1400)


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

    # ── 1 · A SAVE THAT WORKS SAYS NOTHING ───────────────────────────────
    print("\n1 · a save that works")
    change(pg, "quiet-1")
    ck("nothing on the page when the save lands", banner(pg) == "", banner(pg))

    # ── 2 · A SERVER ERROR ───────────────────────────────────────────────
    print("\n2 · the server answers 500")
    POST["status"] = 500
    change(pg, "boom-1")
    said = banner(pg)
    ck("the page says it did not save", "Not saved" in said, said or "(nothing)")
    # THE STATUS IS THE HALF THAT SENDS SOMEBODY SOMEWHERE (§123).
    ck("...and names the status", "500" in said, said)

    # ── 3 · IT CLEARS WHEN A SAVE LANDS ──────────────────────────────────
    # A WARNING THAT OUTLIVES ITS CAUSE IS WORSE THAN NONE (§35).
    print("\n3 · and it clears")
    POST["status"] = 200
    change(pg, "quiet-2")
    ck("the banner goes when a save succeeds", banner(pg) == "", banner(pg))

    # ── 4 · NO SERVER AT ALL IS A DIFFERENT ERRAND ───────────────────────
    print("\n4 · the server cannot be reached")
    POST["status"] = "drop"
    change(pg, "gone-1")
    pg.wait_for_timeout(1500)
    said = banner(pg)
    ck("the page says it did not save", "Not saved" in said, said or "(nothing)")
    ck("...and it is not reported as a server answer",
       "reach" in said.lower() and "HTTP" not in said, said)

    # ── 5 · A REFUSAL IS UNCHANGED (§32) ─────────────────────────────────
    print("\n5 · a refusal keeps its own shape")
    POST["status"] = 403
    POST["refusals"] = ["Who may do what is the Super user's."]
    change(pg, "refuse-1")
    said = banner(pg)
    ck("the server's own sentence is shown", "Super user" in said, said or "(nothing)")
    ck("...with the way out beside it",
       pg.evaluate("()=>!!document.getElementById('refused-undo')"))

    # ── 6 · DEMO DATA SAYS SO WHEN SOMETHING CHANGES ─────────────────────
    print("\n6 · demo data")
    POST["status"] = 200
    POST["refusals"] = None
    pg.evaluate("()=>SYNC.setMode('demo')")
    pg.wait_for_timeout(1500)
    change(pg, "demo-1")
    said = banner(pg)
    ck("changing demo data says it is not saved", "demo data" in said.lower(),
       said or "(nothing)")

    # ── 7 · AND `file://` SAYS NOTHING, BECAUSE NOTHING WAS EXPECTED TO ──
    print("\n7 · no server behind the page")
    pg2 = b.new_page(viewport={"width": 1440, "height": 900})
    pg2.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                        "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    pg2.goto(FILE_URL, wait_until="networkidle")
    pg2.wait_for_timeout(2200)
    change(pg2, "offline-1")
    ck("nothing is claimed when there is no server", banner(pg2) == "", banner(pg2))
    pg2.close()
    b.close()
srv.shutdown()

print("\npage errors: %d" % len(errs))
for e in errs[:4]:
    print("   " + e)
print(("\nFAILURES: %d" % bad) if (bad or errs) else "\nall clear")
raise SystemExit(1 if (bad or errs) else 0)
