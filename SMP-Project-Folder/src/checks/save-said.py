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
  * it CLEARS once a save succeeds — a warning that outlives its cause is
    worse than none (§35);
  * a refusal still gets its own list and its Discard button, unchanged;
  * demo data says so at the moment of the change, not only in the standing
    banner;
  * and over `file://` nothing is said at all, because nothing was expected to
    save (§94.11's condition, from the other side).

§253 MOVED THREE OF THOSE OFF THE BANNER, so the sections that read `#refused`
for a FAILURE were rewritten rather than deleted (§218) — a check left asking
for the old element would go green while asserting nothing (§51.11, and this
file is exactly where that would happen next). What they assert is unchanged;
where they look is not.

AND IT GOES GENUINELY OFFLINE. `context.set_offline(True)` is the real thing —
fetch rejects AND `navigator.onLine` turns false — so the one branch the whole
section exists for is measured rather than simulated, and the difference
between "no connection" and "no answer" is proved to be two sentences and not
one. Four things only an offline trial can ask: that the dialog says so, that
closing it leaves the card, that the retry five seconds later does NOT throw
the dialog back at somebody who closed it, and that coming back online clears
everything with nothing pressed.

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
POST = {"status": 200, "refusals": None, "n": 0}
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
        # COUNTED, so "the work reached the server" is a measurement rather
        # than the absence of a warning (§94.2: a check that only looks for
        # something gone cannot see whether anything arrived). While the
        # browser is offline the request never leaves it, so this cannot move.
        POST["n"] += 1
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


def dialog(pg):
    """What the centred dialog says, or "" when there is none (§253)."""
    return pg.evaluate("""() => {
      const d = document.getElementById('savealert');
      return d ? d.textContent.replace(/\\s+/g,' ').trim() : ""; }""")


def card(pg):
    """What is LEFT after the dialog is closed."""
    return pg.evaluate("""() => {
      const c = document.getElementById('savecard');
      return c ? c.textContent.replace(/\\s+/g,' ').trim() : ""; }""")


def said(pg):
    """Wherever the platform says a save did not go. Written as the UNION on
       purpose: what is asserted is that the failure is SAID, and a later
       decision to move it again should not need this file rewritten a third
       time (§94.8) — the section that cares WHERE asks the two above."""
    return (dialog(pg) + " " + card(pg) + " " + banner(pg)).strip()


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
    ck("nothing on the page when the save lands", said(pg) == "", said(pg))

    # ── 2 · A SERVER ERROR ───────────────────────────────────────────────
    print("\n2 · the server answers 500")
    POST["status"] = 500
    change(pg, "boom-1")
    s = said(pg)
    ck("the page says it did not save", "Not saved" in s, s or "(nothing)")
    # THE STATUS IS THE HALF THAT SENDS SOMEBODY SOMEWHERE (§123).
    ck("...and names the status", "500" in s, s)
    # WHERE IT IS SAID (§253). The banner is for a REFUSAL and for demo data;
    # a failure is a dialog in the middle of the page.
    ck("...in the middle of the page, not across the top",
       dialog(pg) != "" and banner(pg) == "", (dialog(pg), banner(pg)))

    # ── 3 · IT CLEARS WHEN A SAVE LANDS ──────────────────────────────────
    # A WARNING THAT OUTLIVES ITS CAUSE IS WORSE THAN NONE (§35).
    print("\n3 · and it clears")
    POST["status"] = 200
    change(pg, "quiet-2")
    ck("it goes when a save succeeds", said(pg) == "", said(pg))

    # ── 4 · NO SERVER AT ALL IS A DIFFERENT ERRAND ───────────────────────
    print("\n4 · the server cannot be reached")
    POST["status"] = "drop"
    change(pg, "gone-1")
    pg.wait_for_timeout(1500)
    s = said(pg)
    ck("the page says it did not save", "Not saved" in s, s or "(nothing)")
    ck("...and it is not reported as a server answer", "HTTP" not in s, s)
    # AND IT DOES NOT CLAIM TO KNOW MORE THAN IT DOES (§253). The connection
    # is up here — only the stub dropped the request — so "you are offline"
    # would be a lie, and this is the assertion that keeps the two apart.
    ck("...and it does not claim we are offline", "offline" not in s.lower(), s)
    ck("...the browser agrees we are online",
       pg.evaluate("()=>navigator.onLine") is True)

    # ── 4b · GENUINELY OFFLINE (§253) ────────────────────────────────────
    print("\n4b · offline, for real")
    POST["status"] = 200          # the server is fine; the connection is not
    pg.context.set_offline(True)
    change(pg, "off-1")
    pg.wait_for_timeout(1200)
    s = dialog(pg)
    ck("the dialog says we are offline", "offline" in s.lower(), s or "(nothing)")
    ck("...and does not send anybody to the server",
       "server" not in s.lower(), s)
    # THE ADVICE IS THE OTHER HALF OF THE FIX. Reloading while offline is what
    # throws the work away, and the old banner recommended it.
    ck("...and it says not to reload", "not reload" in s.lower(), s)
    ck("...the card is not drawn beside it (§231: one box, one source)",
       card(pg) == "", card(pg))
    # ITS OWN OVERLAY, ABOVE THE SHARED ONE — the one real cost of the middle
    # of the page, and the thing that stops it destroying an open dialog.
    ck("...it is not the shared dialog element",
       pg.evaluate("""()=>{const d=document.getElementById('savealert');
          const o=document.getElementById('overlay');
          return !!d && !!o && d!==o && !o.contains(d);}"""))

    print("\n4c · it can be closed, and closing it is not silence")
    pg.click("[data-savealert-ok]")
    pg.wait_for_timeout(200)
    ck("the dialog goes when Keep working is pressed", dialog(pg) == "")
    ck("...and the card stays, still saying we are offline",
       "offline" in card(pg).lower(), card(pg) or "(nothing)")
    # RAISED ONCE PER EPISODE, NOT ONCE PER ATTEMPT. §170 retries every five
    # seconds; a dialog that came back each time would make closing it
    # meaningless, and this is the assertion that says so.
    change(pg, "off-2")
    pg.wait_for_timeout(2000)
    ck("...and the next failed retry does not throw it back", dialog(pg) == "",
       dialog(pg))
    ck("...while the card is still there", card(pg) != "")

    print("\n4d · and coming back online clears everything")
    landed = POST["n"]
    pg.context.set_offline(False)
    pg.wait_for_timeout(7000)     # the 5s retry, plus room for the round trip
    ck("nothing is left once the save lands", said(pg) == "", said(pg))
    ck("...and the work reached the server", POST["n"] > landed,
       (POST["n"], landed))

    # ── 4e · A PROJECTOR NEVER GETS THE DIALOG (§253) ────────────────────
    # The CSS drops it while presenting, the way the chat corner already
    # leaves — and hiding it is NOT enough, which is the whole point of this
    # section: opening it also makes the page INERT, so a save failing
    # mid-presentation would freeze the deck with nothing on screen saying
    # why. `body.presenting` is present.js's own state and is set directly
    # here rather than by opening a deck: what is under test is what the SAVE
    # does while that class is on, not how the class gets there.
    print("\n4e · presenting")
    POST["status"] = "drop"
    pg.evaluate("()=>{document.body.classList.add('presenting');}")
    change(pg, "deck-1")
    pg.wait_for_timeout(1500)
    ck("no dialog is raised on a projector", dialog(pg) == "", dialog(pg))
    ck("...and the page is NOT left inert behind a hidden one",
       pg.evaluate("()=>!document.getElementById('mainwrap').inert"))
    # It is drawn behind the deck rather than skipped, so leaving the
    # presentation lands on a screen that says the work did not save.
    ck("...but the card is there for when the deck closes",
       "offline" in card(pg).lower() or "Not saved" in card(pg),
       card(pg) or "(nothing)")
    pg.evaluate("()=>{document.body.classList.remove('presenting');}")
    POST["status"] = 200
    pg.wait_for_timeout(6500)
    ck("...and it all clears once a save lands", said(pg) == "", said(pg))

    # ── 5 · A REFUSAL IS UNCHANGED (§32) ─────────────────────────────────
    print("\n5 · a refusal keeps its own shape")
    POST["status"] = 403
    POST["refusals"] = ["Who may do what is the Super user's."]
    change(pg, "refuse-1")
    s = banner(pg)
    ck("the server's own sentence is shown", "Super user" in s, s or "(nothing)")
    ck("...with the way out beside it",
       pg.evaluate("()=>!!document.getElementById('refused-undo')"))
    # A REFUSAL IS NOT A FAILURE: the save reached the server and the server
    # said no, so it keeps the banner and raises no dialog.
    ck("...and it is not also reported as a failure", dialog(pg) == "",
       dialog(pg))

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
