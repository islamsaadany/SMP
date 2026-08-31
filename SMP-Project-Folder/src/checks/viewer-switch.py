"""§204: SWITCHING THE VIEWER SAVES FIRST, AS YOU.

From the deployment, mid-morning: the SMO team were filling gaps on Consumer
Finance and the save came back with four refusals naming the register, the
archives, a SWOT and a plan — none of which they had touched. Islam: *"we
already fixed that!!!"* — and that fix (a refusal costs only the row it named)
was intact. This is a different fault with the same red banner.

`sync.js` stamps `viewAs` from `window.VIEWER` at the moment a body is POSTED,
not when the change was made, and both switchers set VIEWER and painted with
no flush in between. So anything not yet on the server — the trailing
debounce, a save in flight, and above all a FAILED save, which the 5s interval
keeps re-posting — went up under the newly-chosen identity and was judged as
somebody who may not do it. One 504 earlier in the day leaves work in that
state for minutes.

MEASURED ON THE SHIPPED BUILD: an edit made as the office posted stamped
`ceo`, the person just switched to. On the fixed build the same edit posts
with no name at all.

NOTHING ABOUT WHAT A SIMULATED VIEW SHOWS OR ALLOWS IS CHANGED — that is §185
and it is right. Islam, twice and emphatically: *"view as should show what
this user see and can do"*, *"doesn't block the edit completely"*. A
read-only view-as was proposed here and withdrawn.

It drives the REAL control (the switcher), never the new helper, so it can be
run against a build that does not have the helper — which is how the old
build was proved to carry the fault.
"""
import json, pathlib, threading, http.server, socketserver, time
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path("/home/user/SMP")
HTML = (ROOT/"SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
SEED = json.loads((ROOT/"db/seed-state.json").read_text())
PERSON = {"key":"smo","name":"Mohamed Essam","role":"super"}
GATE = b"<!doctype html><title>Sign in</title><h1 id='gate'>Sign in</h1>"
POSTS = []       # every save the page made: (viewAs, when)
REFUSE_AS = ["__never__"]   # refuse any post whose viewAs equals this
errs, bad = [], 0
def ck(w, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("  ok      " if ok else "  FAIL    ")+w+(("  — "+str(x)) if not ok and x else ""))
class H(http.server.BaseHTTPRequestHandler):
    def log_message(self,*a): pass
    def _s(self,c,b,t):
        self.send_response(c); self.send_header("Content-Type",t)
        self.send_header("Content-Length",str(len(b))); self.end_headers()
        try: self.wfile.write(b)
        except BrokenPipeError: pass
    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._s(200, json.dumps({"ok":True,"state":SEED,"person":PERSON}).encode(),
                    "application/json"); return
        if self.path.startswith("/raya-trade"):
            self._s(200, HTML, "text/html; charset=utf-8"); return
        self._s(200, GATE, "text/html; charset=utf-8")
    def do_POST(self):
        n=int(self.headers.get("Content-Length") or 0)
        raw=self.rfile.read(n)
        if self.path.startswith("/api/state"):
            try: body=json.loads(raw.decode())
            except Exception: body={}
            who = body.get("viewAs")
            POSTS.append(who)
            if who == REFUSE_AS[0]:
                self._s(403, json.dumps({"ok":False,
                  "refusals":["A plan is corrected by the SMO — the unit's plan (mobile) "
                              "cannot be changed here."]}).encode(), "application/json")
                return
            self._s(200, b'{"ok":true}', "application/json"); return
        self._s(200, b'{"ok":true}', "application/json")
class S(socketserver.ThreadingTCPServer):
    allow_reuse_address=True; daemon_threads=True
srv=S(("127.0.0.1",0),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
BASE="http://127.0.0.1:%d"%srv.server_address[1]

with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/opt/pw-browsers/chromium",args=["--no-sandbox"])
    pg=b.new_page(viewport={"width":1500,"height":950})
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(BASE+"/raya-trade"); pg.wait_for_timeout(2500)

    other = pg.evaluate("""() => {
      const p = PEOPLE.find(x => personActive(x) && x.unit && x.key !== 'smo');
      return p ? p.key : null; }""")
    print("switching to:", other)

    print("\n1 · a change made as YOURSELF is saved as YOU before the switch")
    POSTS.clear()
    pg.evaluate("""() => { UNITS.mobile.aspiration = "Edited as the office " + Date.now(); }""")
    pg.wait_for_timeout(60)   # inside the debounce: the save has NOT gone yet
    n_before = len(POSTS)
    pg.evaluate("""(k) => { const s=document.getElementById('asWho');
                if (s) { s.value=k; s.dispatchEvent(new Event('change',{bubbles:true})); }
                else if (typeof switchViewer==='function') switchViewer(k);
                else { VIEWER=k; current=null; currentSub=null; paint(); } }""", other)
    pg.wait_for_timeout(1500)
    ck("the switch produced a save", len(POSTS) > n_before, (n_before, POSTS))
    ck("...and that save carried NOBODY else's name (it went as the office)",
       POSTS[n_before] is None, POSTS)
    ck("...and the view did switch", pg.evaluate("() => VIEWER") == other,
       pg.evaluate("() => VIEWER"))

    print("\n2 · a save that cannot land does NOT switch")
    pg.evaluate("""() => { const s=document.getElementById('asWho');
      if (s) { s.value='smo'; s.dispatchEvent(new Event('change',{bubbles:true})); } }""")
    pg.wait_for_timeout(1200)
    ck("we are the office again", pg.evaluate("() => VIEWER") == "smo",
       pg.evaluate("() => VIEWER"))
    REFUSE_AS[0] = None          # refuse the OFFICE's save (viewAs is None)
    POSTS.clear()
    pg.evaluate("""() => { UNITS.mobile.aspiration = "A refused edit " + Date.now(); }""")
    pg.wait_for_timeout(60)
    pg.evaluate("""(k) => { const s=document.getElementById('asWho');
      if (s) { s.value=k; s.dispatchEvent(new Event('change',{bubbles:true})); } }""", other)
    pg.wait_for_timeout(1800)
    ck("the server was asked", len(POSTS) > 0, POSTS)
    ck("...the view did NOT switch — the work keeps the identity that made it",
       pg.evaluate("() => VIEWER") == "smo", pg.evaluate("() => VIEWER"))
    ck("...and the dropdown was put back, not left showing the refused name",
       pg.evaluate("""() => { const s=document.getElementById('asWho');
                              return s ? s.value : null; }""") == "smo")
    ck("...and no post ever carried the other name",
       all(x is None for x in POSTS), POSTS)
    REFUSE_AS[0] = "__never__"

    print("\n3 · no post ever carries a name for work made as somebody else")
    ck("every post so far is either the office's or the simulated view's, never mixed",
       all(x is None or x == other for x in POSTS), POSTS)
    print("\nposts seen:", POSTS)
    print("errors:", errs or "none")
    print("ALL GREEN" if bad==0 and not errs else "%d FAILED"%bad)
    b.close()
srv.shutdown()
raise SystemExit(1 if bad or errs else 0)
