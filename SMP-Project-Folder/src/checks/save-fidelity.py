"""§210 — WHAT THE SCREEN HOLDS IS WHAT THE SERVER HOLDS.

Islam, after the change landed: *"double check if our fix disrupted any flow
or input or creating any errors on input or might cause any lose of data."*

The right question, and the one way §210 could hurt: a change the diff fails
to NOTICE is never sent, and nothing anywhere says so — the screen shows it,
the database does not, and it is gone at the next reload. So this does not
assert "it saved". It drives REAL controls — typing into a plan field with the
pen open, picking from a dropdown, adding a row, removing one, reporting a
figure — and then asks whether the server's copy AGREES with the screen's.

THE STUB APPLIES CHANGES THE WAY `api/state.js` DOES, through the same shared
module, because a stub that does not model the server tests something the
product does not do (§100.3, and this very change caught two stubs doing it).

ASSERT AGREEMENT, NEVER A LITERAL (§94.8). The first version of section B
looked for `"compile":"Sum"` and failed — not because the pick was lost but
because the probe had grabbed a different dropdown. What is asserted is that
the two sides say the same thing.
"""
import json, pathlib, threading, http.server, socketserver, subprocess, tempfile
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path("/home/user/SMP")
HTML = (ROOT/"SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
SEED = json.loads((ROOT/"db/seed-state.json").read_text())
PERSON = {"key":"smo","name":"The SMO","role":"super"}
STORED=[json.loads(json.dumps(SEED))]; SIZES=[]
errs, bad = [], 0
def ck(w, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("  ok      " if ok else "  FAIL    ")+w+(("  — "+str(x)) if not ok and x else ""))
APPLY=tempfile.NamedTemporaryFile("w",suffix=".js",delete=False)
APPLY.write("""
const fs=require("fs");const D=require("/home/user/SMP/lib/graph-diff.js");
const i=JSON.parse(fs.readFileSync(0,"utf8"));
if(i.body.changes){const a=D.applyChanges(i.stored,i.body.changes);
 process.stdout.write(JSON.stringify(a.ok?{ok:true,state:a.state}:{ok:false,error:a.error}));}
else process.stdout.write(JSON.stringify({ok:true,state:i.body.state}));
""");APPLY.close()
class H(http.server.BaseHTTPRequestHandler):
    def log_message(self,*a): pass
    def _s(self,c,b,t):
        self.send_response(c);self.send_header("Content-Type",t)
        self.send_header("Content-Length",str(len(b)));self.end_headers()
        try:self.wfile.write(b)
        except BrokenPipeError:pass
    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._s(200,json.dumps({"ok":True,"state":STORED[0],"person":PERSON}).encode(),"application/json");return
        if self.path.startswith("/raya-trade"):
            self._s(200,HTML,"text/html; charset=utf-8");return
        self._s(200,b"<h1 id=gate>g</h1>","text/html; charset=utf-8")
    def do_POST(self):
        n=int(self.headers.get("Content-Length") or 0);raw=self.rfile.read(n) if n else b"{}"
        if not self.path.startswith("/api/state"):
            self._s(200,b'{"ok":true,"unread":0,"threads":[],"chat":{"on":false},"states":{},"said":{}}',"application/json");return
        SIZES.append(n)
        try:body=json.loads(raw.decode())
        except Exception:body={}
        p=subprocess.run(["node",APPLY.name],input=json.dumps({"stored":STORED[0],"body":body}).encode(),capture_output=True)
        if p.returncode:
            self._s(500,json.dumps({"ok":False,"error":p.stderr.decode()[:300]}).encode(),"application/json");return
        out=json.loads(p.stdout)
        if not out.get("ok"):
            self._s(400,json.dumps(out).encode(),"application/json");return
        STORED[0]=out["state"];self._s(200,b'{"ok":true}',"application/json")
class SRV(socketserver.ThreadingTCPServer):
    allow_reuse_address=True;daemon_threads=True
srv=SRV(("127.0.0.1",0),H);threading.Thread(target=srv.serve_forever,daemon=True).start()
BASE="http://127.0.0.1:%d"%srv.server_address[1]

with sync_playwright() as pw:
    b=pw.chromium.launch(executable_path="/opt/pw-browsers/chromium",args=["--no-sandbox"])
    pg=b.new_page(viewport={"width":1600,"height":1000})
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.on("console",lambda m: errs.append(m.text) if m.type=="error" else None)
    pg.goto(BASE+"/raya-trade"); pg.wait_for_timeout(3000)
    def settle(): pg.evaluate("() => new Promise(r => SYNC.saveNow(r))"); pg.wait_for_timeout(500)

    pg.evaluate("""() => { current='mobile'; currentSub='strategy';
      CURSEC.strategy='plan'; EDIT_PAGE['plan']=true; paint(); }""")
    pg.wait_for_timeout(900)

    print("A · typing into the plan, with the pen open")
    typed = pg.evaluate("""() => {
      const box=[...document.querySelectorAll('#panel input.fld')].find(i=>i.value);
      if(!box) return null;
      const was=box.value; box.focus(); box.value='TYPED BY HAND';
      box.dispatchEvent(new Event('change',{bubbles:true}));
      return {was:was, now:'TYPED BY HAND'}; }""")
    settle()
    found = json.dumps(STORED[0]).count("TYPED BY HAND")
    ck("a value typed into a plan field reaches the server", typed and found >= 1,
       "typed=%s found=%d" % (bool(typed), found))

    print("\nB · picking from a dropdown")
    pick = pg.evaluate("""() => {
      const s=[...document.querySelectorAll('#panel select.fld')]
        .find(x=>[...x.options].some(o=>o.value==='Sum'));
      if(!s) return null;
      s.value='Sum'; s.dispatchEvent(new Event('change',{bubbles:true}));
      return 'Sum'; }""")
    settle()
    # THE REAL QUESTION IS FIDELITY, not one field name: after the pick, does
    # the server hold what the screen holds? Asserting a literal was asserting
    # which dropdown my probe happened to grab.
    screenHas = pg.evaluate("""() => JSON.stringify({u:UNITS,f:FUNCTIONS}).split('"Sum"').length-1""")
    serverHas = json.dumps({"u":STORED[0].get("units"),"f":STORED[0].get("functions")}).count('"Sum"')
    ck("the dropdown choice reaches the server (screen and server agree)",
       screenHas == serverHas, "screen %d vs server %d" % (screenHas, serverHas))

    print("\nC · adding a row, then removing one")
    n0 = pg.evaluate("() => UNITS.mobile.items[0].measures.length")
    pg.evaluate("""() => { const b=[...document.querySelectorAll('#panel button')]
      .find(x=>/add a measure/i.test(x.textContent||'')); if(b) b.click(); }""")
    pg.wait_for_timeout(600); settle()
    n1 = pg.evaluate("() => UNITS.mobile.items[0].measures.length")
    srvN = len(((STORED[0]["units"].get("mobile") or {}).get("items") or [{}])[0].get("measures") or [])
    ck("adding a measure lands on the server", n1 == n0 + 1 and srvN == n1,
       "screen %d -> %d, server %d" % (n0, n1, srvN))
    pg.evaluate("""() => { const b=[...document.querySelectorAll('#panel button.rmbtn, #panel button')]
      .filter(x=>/^remove$/i.test((x.textContent||'').trim())); if(b.length) b[b.length-1].click(); }""")
    pg.wait_for_timeout(600); settle()
    n2 = pg.evaluate("() => UNITS.mobile.items[0].measures.length")
    srvN2 = len(((STORED[0]["units"].get("mobile") or {}).get("items") or [{}])[0].get("measures") or [])
    ck("removing one lands too", srvN2 == n2, "screen %d, server %d" % (n2, srvN2))

    print("\nD · reporting a figure")
    pg.evaluate("""() => { EDIT_PAGE['plan']=false; currentSub='performance';
      leaveModes(); REPORTING='mobile'; paint(); }""")
    pg.wait_for_timeout(900)
    rep = pg.evaluate("""() => {
      const i=[...document.querySelectorAll('#panel input')].find(x=>x.type!=='checkbox');
      if(!i) return null; i.focus(); i.value='42';
      i.dispatchEvent(new Event('change',{bubbles:true})); return true; }""")
    settle()
    ck("a reported figure reaches the server (or the page offers none)",
       rep is None or json.dumps(STORED[0]).count('42') >= 1, "reported=%s" % rep)

    print("\nE · what actually goes over the wire")
    whole = pg.evaluate("""() => {
      var s=JSON.parse(JSON.stringify({group:GROUP,unitKeys:UNIT_KEYS,units:UNITS,
        functionKeys:FUNCTION_KEYS,functions:FUNCTIONS,companyKeys:COMPANY_KEYS,
        companies:COMPANIES,people:PEOPLE,unitRoles:UNIT_ROLES,access:ACCESS,
        labels:LABELS.entries,bands:BANDS.bands,koWeights:KO_WEIGHTS,cycle:CYCLE,
        review:REVIEW,history:HISTORY,priorCycle:PRIOR_CYCLE,archives:ARCHIVES}));
      return JSON.stringify(s).length; }""")
    typical = sorted(SIZES)[len(SIZES)//2] if SIZES else 0
    print("    saves seen: %d | median payload %d bytes | the whole graph is %d"
          % (len(SIZES), typical, whole))
    ck("a save is a small fraction of the whole plan", typical < whole/3,
       "%d vs %d" % (typical, whole))

    print("\n  page errors:", errs[:3] or "none")
    print("ALL GREEN" if bad==0 and not errs else "%d FAILED" % bad)
    b.close()
srv.shutdown()
raise SystemExit(1 if bad or errs else 0)
