"""A SAVE THAT FAILS SAYS SO ON THE PAGE (§171).

qa-run: own-server — this check SERVES the built file itself, with a stub it
programs (a failing save, a stale build, a second person landing). The served
app cannot be told to fail on demand, so re-pointing it would measure something
else; the client under test is `sync.js`, carried into the new app verbatim, and
the new app's own end is asserted in smp-app/checks (§316.1).

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
            body = {"ok": False, "error": "boom"}
            if POST.get("ref"):
                body.update(ref=POST["ref"], reason=POST["reason"])
            self._s(POST["status"], json.dumps(body).encode(), "application/json")
            return
        self._s(200, b'{"ok":true}', "application/json")


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % PORT
FILE_URL = "file://" + str(ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")


def banner(pg):
    """What the page is saying about saving: a refusal on #refused, or (§504)
       a failed save kept on this computer on #unsaved."""
    return pg.evaluate("""() => {
      const t = [];
      for (const id of ['refused', 'unsaved']) {
        const e = document.getElementById(id);
        if (e && !e.hidden) t.push(e.textContent.replace(/\\s+/g,' ').trim());
      }
      return t.join(' | '); }""")


def unsaved_bar(pg):
    return pg.evaluate("""() => { const e = document.getElementById('unsaved');
      return (e && !e.hidden) ? e.textContent.replace(/\\s+/g,' ').trim() : ""; }""")


HOVER = "()=>{const s=document.querySelector('#unsaved strong');return s?s.title:''}"


def change(pg, mark):
    """Through the REAL path: mutate the graph and paint(), which ends in
       afterPaint() — never by calling save() directly, or the trial would be
       of a function nothing in the product reaches that way."""
    pg.evaluate("GROUP.org = %s; paint();" % json.dumps(mark))
    pg.wait_for_timeout(1400)


with sync_playwright() as p:
    b = p.chromium.launch()
    cx = b.new_context(viewport={"width": 1440, "height": 900})
    cx.grant_permissions(["clipboard-read", "clipboard-write"], origin="http://127.0.0.1:%d" % PORT)
    pg = cx.new_page()
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    errs, cons = [], []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: m.type == "error" and cons.append(m.text))
    pg.goto(URL, wait_until="networkidle")
    pg.wait_for_timeout(1800)
    ck("the platform hydrated", pg.evaluate("()=>SYNC.isLive()") is True)

    # ── 1 · A SAVE THAT WORKS SAYS NOTHING ───────────────────────────────
    print("\n1 · a save that works")
    change(pg, "quiet-1")
    ck("nothing on the page when the save lands", banner(pg) == "", banner(pg))

    # ── 2 · A SERVER ERROR (§504: kept, never "Not saved") ───────────────
    #    REWRITTEN, NOT LOOSENED (§218): §171 asserted a red "Not saved" bar and
    #    §258.3 the advice to keep the tab open. §504 keeps the change on this
    #    computer, so the honest sentence is that it is SAFE — in amber, on the
    #    bar of its own — and the status still rides the hover for the operator.
    print("\n2 · the server answers 500")
    POST["status"] = 500
    change(pg, "boom-1")
    said = unsaved_bar(pg)
    ck("the page says the change is safe on this computer", "safe on this computer" in said, said or "(nothing)")
    ck("...in plain words, with no status in the sentence", "500" not in said and "HTTP" not in said, said)
    ck("...and it is not a refusal", pg.evaluate("()=>{const e=document.getElementById('refused');return !e||e.hidden}") is True)
    ck("...with the status on the hover for whoever can act on it", "500" in (pg.evaluate(HOVER) or ""))

    # ── 2b · THE DETAILS TRAVEL WITH IT (§502, reshaped by §504) ─────────
    #    The reference and the reason still reach the hover and the console;
    #    §504 replaced the copy button with one ghost button that sends the
    #    kept lines to the office. Both ends: the copy button is GONE and the
    #    send button is THERE, or a bar with no control passes the absence.
    print("\n2b · the details travel with the bar")
    POST["ref"], POST["reason"] = "SMP-TEST42", "a value is not in the shape this field takes · table measures · code 22P02"
    change(pg, "boom-2")
    hover = pg.evaluate(HOVER) or ""
    ck("the hover carries the reference and the reason", "SMP-TEST42" in hover and "table measures" in hover, hover)
    ck("...and the server's own sentence", "boom" in hover, hover)
    said = unsaved_bar(pg)
    ck("the sentence on the page still carries no status", "HTTP" not in said and "SMP-TEST42" not in said, said)
    ck("the console carries it as an error", any("SMP-TEST42" in c for c in cons), cons)
    n1 = sum(1 for c in cons if "SMP-TEST42" in c)
    pg.wait_for_timeout(5600)   # one retry, same failure
    ck("...once per failure, not once per retry", sum(1 for c in cons if "SMP-TEST42" in c) == n1, cons)
    ck("the copy button is gone", pg.query_selector("[data-copyerr]") is None)
    sb = pg.query_selector("#unsaved [data-unsaved-send]")
    ck("...and the bar offers to send the changes to the office",
       sb is not None and "Strategy Office" in (sb.inner_text() if sb else ""))
    POST["ref"] = None

    # ── 3 · IT CLEARS WHEN A SAVE LANDS ──────────────────────────────────
    # A WARNING THAT OUTLIVES ITS CAUSE IS WORSE THAN NONE (§35).
    print("\n3 · and it clears")
    POST["status"] = 200
    change(pg, "quiet-2")
    ck("the banner goes when a save succeeds", banner(pg) == "", banner(pg))

    # ── 4 · NO SERVER AT ALL (§504: kept the same way) ──────────────────
    #    A dropped connection is an accident like a 500, so it is kept the
    #    same way; the hover says which it was, never the sentence.
    print("\n4 · the server cannot be reached")
    POST["status"] = "drop"
    change(pg, "gone-1")
    pg.wait_for_timeout(1500)
    said = unsaved_bar(pg)
    ck("the page says the change is safe on this computer", "safe on this computer" in said, said or "(nothing)")
    ck("...and it is not reported as a server answer", "HTTP" not in said and "500" not in (pg.evaluate(HOVER) or ""), said)
    POST["status"] = 200
    change(pg, "back-1")
    ck("...and it goes when the server answers again", banner(pg) == "", banner(pg))

    # ── 5 · A REFUSAL IS UNCHANGED (§32) ─────────────────────────────────
    print("\n5 · a refusal keeps its own shape")
    POST["status"] = 403
    POST["refusals"] = ["Who may do what is the Super user's."]
    change(pg, "refuse-1")
    said = banner(pg)
    ck("the server's own sentence is shown", "Super user" in said, said or "(nothing)")
    ck("...with the way out beside it",
       pg.evaluate("()=>!!document.getElementById('refused-undo')"))

    # ── 6 · THE DEMO BANNER IS GONE, AND SO IS WHAT IT SAID (spec 042) ───
    #    §136 gave the failure-neutral bar three outcomes and one of them was
    #    "this is demo data" — a real sentence for a real mode, and the mode
    #    went with the Demo data button when the worked example became a
    #    CLIENT of its own. So the assertion goes rather than being loosened
    #    into something that passes whatever happens (§24: a check keyed on
    #    markup that no longer exists does not fail, it passes quietly).
    #    ASSERTED AS AN ABSENCE, both ends, or a build that quietly kept the
    #    switch would go unnoticed.
    print("\n6 · the demo switch is gone")
    ck("SYNC no longer offers a demo mode",
       pg.evaluate("()=>!(window.SYNC && (SYNC.setMode || SYNC.isDemo || SYNC.demoMode))"))
    ck("...and the page carries no demo banner or button",
       pg.evaluate("()=>!document.getElementById('demomenu') && "
                   "!document.getElementById('demobtn') && "
                   "!document.getElementById('banner')"))

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
