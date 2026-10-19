"""§554: THE SMO TEAM HOLDS THE VIEWER SWITCHER, UP TO ITS OWN SEAT.

Islam: *"I want to enable the smo team to have the drop down of view as for
the other users on the platform."*

WHY THIS IS A SECOND FILE AND NOT FOUR LINES IN viewer-switch.py. That check
drives the SMO's session and asserts what a switch does to a SAVE (§204); this
one asserts WHO IS OFFERED THE CONTROL AT ALL, which is a different question
with a different failure. A build that drew the switcher for everybody passes
every assertion in viewer-switch.py, because the office's own switching is
untouched by who else can see it.

BOTH ENDS, EVERY TIME (§94.2). The widening is only half the decision and the
half that is easy to get right. The other half is the CEILING: an SMO team
member wearing the Super user's view would hold the Super user's rights — the
one person on a client's register who holds more than they do — so a
simulation would have become a way up. So every "the team gets it" assertion
here is paired with a "and not that row" one, and §4 keeps the gate honest by
proving a seatless session still gets nothing.

AND IT PRESSES, IT DOES NOT READ (§93.4, §70). The fault this replaces was a
MENU ENTRY that was present, enabled and offered to somebody the save would
refuse: Setup is the office's (§516.2), so an SMO team member already reached
the People register's row menu and already got *View the platform as them* —
and pressing it changed what was drawn while their saves went on being judged
as themselves, because `actingAs()` would not stamp a view the chrome had not
drawn a switcher for. That is §185's fault, open on the one path that never
asked. So §3 opens the real menu on two real rows and reads what is in it.

OVER HTTP WITH A STUB, because the whole subject is the SEAT THE SESSION
CARRIES and a file:// copy has no session at all (sync.js `maySimulatePerson`
lists everybody when nobody is signed in, which is the offline copy's own
long-standing behaviour and is asserted in §5).

PROVED ABLE TO FAIL (§94.5), AND IT PRINTS THE FAULT IT WAS WRITTEN FOR. Run
it against the build from before §554 —
  python3 qa-run.py checks/viewas-smoteam.py ../strategy-management-platform-v3.22.html
— and seven assertions across §1–§4 go red. §1 and §2 are the widening that
had not happened: no switcher, and a list holding all 33 rows including the
Super user's. §3 and §4 are the leak, measured rather than argued: the row
menu DOES offer the team *View the platform as them* on the Super user's row,
the view DOES switch when it is pressed — and the save that follows carries
`None`. The screen was somebody else's and the work was theirs.

Run: python3 qa-run.py checks/viewas-smoteam.py
"""
import json, copy, pathlib, sys, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
SRC = pathlib.Path(__file__).resolve().parent.parent
TARGET = sys.argv[1] if len(sys.argv) > 1 else "strategy-management-platform.html"
HTML = (SRC / TARGET).resolve().read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())

# THE TENANT HAS AN SMO TEAM MEMBER, because the seeded example has exactly
# one office row and it is the Super user's. `role` on a register row IS the
# seat (§187) — the same field the server writes from the membership
# (lib/state-api.ts officeRow) and the same one lib/rules.js actingFor
# refuses on — so granting it here is what the platform itself would store.
TEAM_KEY, SUPER_KEY = "cfo", "smo"
STATE = copy.deepcopy(SEED)
for _p in STATE["people"]:
    if _p.get("key") == TEAM_KEY:
        _p["role"] = "smoteam"

SESSION = {"person": {"key": TEAM_KEY, "name": "Group CFO", "role": "smoteam"}}
GATE = b"<!doctype html><title>Sign in</title><h1 id='gate'>Sign in</h1>"
POSTS = []
errs, bad = [], 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def _s(self, c, b, t):
        self.send_response(c); self.send_header("Content-Type", t)
        self.send_header("Content-Length", str(len(b))); self.end_headers()
        try: self.wfile.write(b)
        except BrokenPipeError: pass

    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._s(200, json.dumps({"ok": True, "state": STATE,
                                     "person": SESSION["person"]}).encode(),
                    "application/json"); return
        if self.path.startswith("/raya-trade"):
            self._s(200, HTML, "text/html; charset=utf-8"); return
        self._s(200, GATE, "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(n)
        if self.path.startswith("/api/state"):
            try: body = json.loads(raw.decode())
            except Exception: body = {}
            POSTS.append(body.get("viewAs"))
        self._s(200, b'{"ok":true}', "application/json")


class S(socketserver.ThreadingTCPServer):
    allow_reuse_address = True; daemon_threads = True


srv = S(("127.0.0.1", 0), H)
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % srv.server_address[1]

OPTIONS = """() => Array.prototype.map.call(
  document.getElementById('asWho').options, o => o.value)"""
SWITCHER_SHOWN = """() => {
  const box = document.querySelector('.viewer');
  const sel = document.getElementById('asWho');
  const btn = box && box.querySelector('.ssbtn');
  const lab = box && box.querySelector('label');
  return { sel: !!sel && !sel.hidden, btn: !btn || !btn.hidden,
           label: lab ? lab.textContent.trim() : null }; }"""


def land(pg, who):
    SESSION["person"] = who
    pg.goto(BASE + "/raya-trade")
    pg.wait_for_timeout(2500)


def register_menu(pg, key):
    """Open this row's kebab on the People register and list what is in it."""
    pg.evaluate("()=>document.querySelector('[data-md=\"setup\"]').click()")
    pg.wait_for_timeout(400)
    pg.evaluate("()=>document.querySelector('[data-setupgo=\"people\"]').click()")
    pg.wait_for_timeout(700)
    pg.evaluate("(k)=>document.querySelector('[data-pmenu=\"'+k+'\"]').click()", key)
    pg.wait_for_timeout(300)
    return pg.evaluate("(k)=>!!document.querySelector('[data-as=\"'+k+'\"]')", key)


with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1600, "height": 1000})
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');"
                       "localStorage.setItem('smp.tour.never','1');}catch(e){}")
    pg.on("pageerror", lambda e: errs.append(str(e)))

    print("\n1 · an SMO team session gets the control, not a name in its place")
    land(pg, {"key": TEAM_KEY, "name": "Group CFO", "role": "smoteam"})
    shown = pg.evaluate(SWITCHER_SHOWN)
    ck("the switcher is drawn", shown["sel"] is True, shown)
    ck("...and so is its button — whoever hides a field hides its furniture (§34)",
       shown["btn"] is True, shown)
    ck("...and it still reads 'Viewing as', not 'Signed in as'",
       shown["label"] == "Viewing as", shown)
    ck("no script error on the way in", not errs, errs)

    print("\n2 · the list is the register, minus the one row above them")
    opts = pg.evaluate(OPTIONS)
    active = pg.evaluate("()=>PEOPLE.filter(personActive).map(p=>p.key)")
    ck("the Super user is NOT in it", SUPER_KEY not in opts, opts[:8])
    ck("...their own row IS — or there is no way back to yourself (§61)",
       TEAM_KEY in opts)
    ck("...and so is everybody else on the register",
       sorted(opts) == sorted([k for k in active if k != SUPER_KEY]),
       (len(opts), len(active)))

    print("\n3 · and the register's row menu answers the same (§42)")
    ck("an ordinary row offers 'View the platform as them'",
       register_menu(pg, "mobhead") is True)
    ck("...and the Super user's row does NOT — the save would refuse it",
       register_menu(pg, SUPER_KEY) is False)

    print("\n4 · the simulation itself works, and is stamped as them")
    # Out of the open row menu first — §3 left one down, and a switch is a
    # navigation that would otherwise be made with a menu standing (§63.1).
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(300)
    pg.evaluate("""(k)=>{const s=document.getElementById('asWho');
      s.value=k; s.dispatchEvent(new Event('change',{bubbles:true}));}""", "mobhead")
    pg.wait_for_timeout(1500)
    ck("the view switched", pg.evaluate("()=>VIEWER") == "mobhead",
       pg.evaluate("()=>VIEWER"))
    POSTS.clear()
    pg.evaluate("""()=>{ UNITS.mobile.aspiration = "Edited in a view " + Date.now(); }""")
    pg.wait_for_timeout(100)
    pg.evaluate("()=>new Promise(r=>SYNC.saveNow(r))")
    pg.wait_for_timeout(600)
    ck("the save went", len(POSTS) > 0, POSTS)
    ck("...carrying the person being looked through, never the team member",
       POSTS and all(x == "mobhead" for x in POSTS), POSTS)

    print("\n5 · and the gate did not simply open (§94.5)")
    errs.clear()
    land(pg, {"key": "mobhead", "name": "Ashraf Laithy", "role": ""})
    shown = pg.evaluate(SWITCHER_SHOWN)
    ck("a session with no seat still gets no switcher", shown["sel"] is False, shown)
    ck("...and is told what it is looking at instead",
       shown["label"] == "Signed in as", shown)
    POSTS.clear()
    pg.evaluate("""()=>{ UNITS.mobile.aspiration = "No seat " + Date.now(); }""")
    pg.wait_for_timeout(100)
    pg.evaluate("()=>new Promise(r=>SYNC.saveNow(r))")
    pg.wait_for_timeout(600)
    ck("...and their save carries nobody else's name",
       POSTS and all(x is None for x in POSTS), POSTS)
    ck("no script error", not errs, errs)

    print("\nerrors:", errs or "none")
    print("ALL GREEN" if bad == 0 and not errs else "%d FAILED" % bad)
    b.close()
srv.shutdown()
raise SystemExit(1 if bad or errs else 0)
