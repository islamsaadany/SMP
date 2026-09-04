"""THE OFFICE'S CORNER CARRIES THE QUEUE (§285), AND SURVIVES THE WALK (§284).

Islam: "the chat bubble of the SMO team shouldn't be something to be sent to
the smo, that is redundancy" — for the office it was a conversation with
themselves — and "we need the chat to sustain the navigation so it's open
while me navigating across the different pages."

OVER HTTP AGAINST A STUB, because the whole surface is invisible from file://
(§94.11): the corner is not drawn without a server to answer it.

WHAT IT ASSERTS IS THE AGREEMENT, not the numbers (§94.8): the badge is the
LENGTH of the list rather than a second count of the same thing, and the email
a reply carries is the one the Platform Inbox builds rather than a lesser copy
made here — the two would otherwise drift the first time either improved
(§53.5).

AND IT LISTENS FOR PAGE ERRORS, because the fault this found while being
written was a throw inside the poll's own callback: the body kept the class it
had just been given and its contents stayed empty, so the corner rendered as a
blank box with nothing on the console of a page that had not reloaded. A DOM
probe that only asked "is the panel there" would have called it clean.
"""
import json, socketserver, threading, http.server, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path("/home/user/SMP")
HTML = (ROOT/"SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
GATE = (ROOT/"index.html").read_bytes(); SW = (ROOT/"sw.js").read_bytes()
SEED = json.loads((ROOT/"db/seed-state.json").read_text())
PERSON = {"key":"smo","name":"Mohamed Essam","role":"super"}
QUEUE = [
 {"person_key":"mobhead","person_name":"Ashraf Laithy","last_at":"2026-09-03T09:41:00Z",
  "last_body":"The Q3 target on Active Base still reads 4.2M."},
 {"person_key":"cxcust","person_name":"Hala Nabil","last_at":"2026-09-03T09:12:00Z",
  "last_body":"I updated the definition and it did not stick."},
]
HITS = [
 {"person_key":"rethead","person_name":"Hossam Farid","waiting":False,
  "line":"...so the target we agreed in March is the one on the page.",
  "line_at":"2026-08-14T10:22:00Z","from_office":False,"is_last":False},
 {"person_key":"mobhead","person_name":"Ashraf Laithy","waiting":True,
  "line":"The Q3 target on Active Base still reads 4.2M.",
  "line_at":"2026-09-03T09:41:00Z","from_office":False,"is_last":True},
]
POSTED=[]
class H(http.server.BaseHTTPRequestHandler):
    def log_message(self,*a): pass
    def _s(self,c,b,t):
        self.send_response(c); self.send_header("Content-Type",t)
        self.send_header("Content-Length",str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        if self.path.startswith("/sw.js"): self._s(200,SW,"application/javascript"); return
        if self.path.startswith("/api/state"):
            self._s(200,json.dumps({"ok":True,"state":SEED,"person":PERSON}).encode(),"application/json"); return
        if self.path.startswith("/raya-trade"): self._s(200,HTML,"text/html; charset=utf-8"); return
        self._s(200,GATE,"text/html; charset=utf-8")
    def do_POST(self):
        n=int(self.headers.get("Content-Length") or 0); raw=self.rfile.read(n)
        b=json.loads(raw or b"{}"); a=b.get("action") or ""
        POSTED.append(b)
        cfg={"on":True,"shots":True,"promise":"Usually answers the same day",
             "beat":4000,"popup":False,"vapid":""}
        if a=="chatSearch":
            q=(b.get("q") or "").lower()
            self._s(200,json.dumps({"ok":True,"q":q,
              "hits":[h for h in HITS if q in h["line"].lower() or q in h["person_name"].lower()]
              }).encode(),"application/json"); return
        if a=="thread":
            who=b.get("person")
            nm={"mobhead":"Ashraf Laithy","cxcust":"Hala Nabil","rethead":"Hossam Farid"}.get(who,who)
            self._s(200,json.dumps({"ok":True,"person":who,"name":nm,"waiting":True,
              "messages":[{"id":1,"at":"2026-09-03T09:41:00Z","from_office":False,
                           "by_key":who,"by_name":nm,"body":"The Q3 target still reads 4.2M.",
                           "flag":None}],"mail":False,"chatOn":True}).encode(),"application/json"); return
        if a=="reply":
            self._s(200,json.dumps({"ok":True,"mailed":None}).encode(),"application/json"); return
        self._s(200,json.dumps({"ok":True,"office":True,"messages":[],"unread":0,
            "thread":None,"waiting":len(QUEUE),"queue":QUEUE,"chat":cfg}).encode(),"application/json")
srv=socketserver.ThreadingTCPServer(("127.0.0.1",0),H); srv.daemon_threads=True
threading.Thread(target=srv.serve_forever,daemon=True).start()
URL="http://127.0.0.1:%d/raya-trade"%srv.server_address[1]
ok=[0]; bad=[0]
def ck(w,c,d=""):
    if c: ok[0]+=1; print("  ok    "+w+(("  ("+str(d)+")") if d else ""))
    else: bad[0]+=1; print("  FAIL  "+w+(("  — "+str(d)) if d else ""))
with sync_playwright() as p:
    br=p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
    pg=br.new_page(viewport={"width":1400,"height":950})
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)[:160]))
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    pg.goto(URL,wait_until="networkidle")
    pg.wait_for_selector("#chatdock:not([hidden])",timeout=20000)
    pg.wait_for_timeout(1500)

    print("\nTHE BADGE COUNTS PEOPLE WAITING")
    ck("the badge is shown before opening",
       not pg.eval_on_selector("#chatn","e=>e.hidden"))
    ck("...and it is the length of the list",
       pg.eval_on_selector("#chatn","e=>e.textContent")==str(len(QUEUE)),
       pg.eval_on_selector("#chatn","e=>e.textContent"))

    pg.click("#chatbtn"); pg.wait_for_timeout(900)
    print("\nTHE SPLIT")
    ck("the two segments are drawn", pg.query_selector_all(".cqseg button").__len__()==2)
    ck("Waiting is the one lit", pg.eval_on_selector(".cqseg button","e=>e.classList.contains('on')"))
    ck("the search box is there", pg.query_selector("#cqfind") is not None)

    print("\nTHE QUEUE")
    rows=pg.query_selector_all(".cqrow")
    ck("one row per waiting conversation", len(rows)==len(QUEUE), len(rows))
    ck("the first row names the person",
       "Ashraf Laithy" in (rows[0].inner_text() if rows else ""), rows[0].inner_text()[:40] if rows else "")
    ck("a click at its centre reaches the row",
       pg.evaluate("""() => { const r=document.querySelector('.cqrow').getBoundingClientRect();
         const e=document.elementFromPoint(r.x+r.width/2, r.y+r.height/2);
         return !!(e && e.closest('.cqrow')); }"""))
    ck("the way through to the Inbox is there", pg.query_selector(".cqinbox") is not None)

    print("\nOPENING ONE IN PLACE")
    rows[0].click(); pg.wait_for_timeout(900)
    ck("the header becomes the person",
       "Ashraf" in pg.eval_on_selector("#chatpanel .cht","e=>e.textContent"),
       pg.eval_on_selector("#chatpanel .cht","e=>e.textContent"))
    ck("there is a way back", pg.query_selector("[data-cqback]") is not None)
    ck("the messages are drawn", len(pg.query_selector_all("#chatbody .chmsg"))>0)
    ck("the search box steps aside", pg.query_selector("#cqfind") is None)
    ck("the composer invites a reply to them",
       "Ashraf" in pg.eval_on_selector("#chatsay","e=>e.placeholder"),
       pg.eval_on_selector("#chatsay","e=>e.placeholder"))

    print("\nREPLYING FROM THE CORNER")
    POSTED.clear()
    pg.fill("#chatsay","Looking at it now."); pg.click("#chatsend"); pg.wait_for_timeout(1200)
    rep=[b for b in POSTED if b.get("action")=="reply"]
    ck("it posts a reply", len(rep)==1, [b.get("action") for b in POSTED])
    ck("...naming the person", rep and rep[0].get("person")=="mobhead")
    ck("...with the words typed", rep and rep[0].get("body")=="Looking at it now.")
    ck("...and the SAME email the Inbox builds, not a lesser one",
       bool(rep and rep[0].get("html") and "Open the platform" in rep[0]["html"]),
       (rep[0].get("html") or "")[:60] if rep else "")

    print("\nBACK, AND THE OTHER HALF")
    pg.click("[data-cqback]"); pg.wait_for_timeout(700)
    ck("back returns to the list", len(pg.query_selector_all(".cqrow"))==len(QUEUE))
    ck("...and the header is the office again",
       "Strategy Office" in pg.eval_on_selector("#chatpanel .cht","e=>e.textContent"))
    pg.click("[data-cqside='mine']"); pg.wait_for_timeout(700)
    ck("My messages shows their own conversation, not the queue",
       pg.query_selector(".cqrow") is None and pg.query_selector("#chatbody") is not None)
    ck("...and the composer writes to the office again",
       "office" in pg.eval_on_selector("#chatsay","e=>e.placeholder").lower(),
       pg.eval_on_selector("#chatsay","e=>e.placeholder"))
    pg.click("[data-cqside='wait']"); pg.wait_for_timeout(700)

    print("\nSEARCHING ALL HISTORY")
    POSTED.clear()
    pg.fill("#cqfind","target"); pg.wait_for_timeout(1400)
    ck("it asks the server", any(b.get("action")=="chatSearch" for b in POSTED),
       [b.get("action") for b in POSTED])
    ck("the count says the scope out loud",
       "all conversations" in (pg.eval_on_selector(".cqfound","e=>e.textContent") or ""),
       pg.eval_on_selector(".cqfound","e=>e.textContent") if pg.query_selector(".cqfound") else "no line")
    ck("a match in an older message says so",
       any("earlier message" in (h.inner_text() or "") for h in pg.query_selector_all(".cqrow")))
    ck("...and an answered conversation is reachable",
       any("Hossam" in (h.inner_text() or "") for h in pg.query_selector_all(".cqrow")))
    ck("the search box still holds what was typed",
       pg.eval_on_selector("#cqfind","e=>e.value")=="target",
       pg.eval_on_selector("#cqfind","e=>e.value"))

    print("\nAND IT SURVIVES MOVING ABOUT (§284)")
    tabs=[e for e in pg.query_selector_all("[data-s]") if e.is_visible()]
    if tabs:
        tabs[-1].click(); pg.wait_for_timeout(800)
        ck("still open after changing page",
           not pg.eval_on_selector("#chatpanel","e=>e.hidden"))
        ck("...and still on the queue with the search kept",
           pg.query_selector("#cqfind") is not None and
           pg.eval_on_selector("#cqfind","e=>e.value")=="target")
    print("\npage errors:", errs or "none")
    if errs: bad[0]+=1
    br.close()
srv.shutdown()
print("\n%d ok, %d FAILED" % (ok[0], bad[0]))

import sys
sys.exit(1 if bad[0] else 0)
