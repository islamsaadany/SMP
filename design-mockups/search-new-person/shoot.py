"""SENDING TO SOMEBODY WHO HAS NEVER WRITTEN IN — drawn in the REAL corner.

Islam: "in the serach I need to be able to send to a new person as well how do
oy uthink we do this correctly".

DRAWN FROM THE RUNNING PLATFORM, never from the stylesheet (§41.9): the built
file is served, the corner is opened, the search is typed, and only the LIST is
replaced with the proposal. Every pixel of chrome, every token and every box is
the product's own, so what is signed off is what would be built.

AND THE DATA IS THE CLIENT'S SHAPE, NOT THE WORKED EXAMPLE'S (§245): Islam
could not read a mockup populated with Raya's invented names, so these are the
names and places from his own screenshots.
"""
import json, socketserver, threading, http.server, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path("/home/user/SMP")
OUT  = ROOT/"design-mockups/search-new-person"
HTML = (ROOT/"SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
GATE = (ROOT/"index.html").read_bytes(); SW = (ROOT/"sw.js").read_bytes()
SEED = json.loads((ROOT/"db/seed-state.json").read_text())
PERSON = {"key":"smo","name":"Mohamed Essam","role":"super"}

QUEUE = [
 {"person_key":"mobhead","person_name":"Abd El Hamid Mokhtar Abd El Hamid Ahmed Abd El Wahab",
  "last_at":"2026-09-03T11:50:00Z","last_body":"done"},
 {"person_key":"cxcust","person_name":"Hala Abd El Latif Ibrahim Ahmed El Kholy",
  "last_at":"2026-09-02T19:09:00Z","last_body":"hi"},
]
HITS = [
 {"person_key":"mobhead","person_name":"Abd El Hamid Mokhtar Abd El Hamid Ahmed Abd El Wahab",
  "waiting":True,"line":"done","line_at":"2026-09-03T11:50:00Z","from_office":False,"is_last":True},
 {"person_key":"cxcust","person_name":"Hala Abd El Latif Ibrahim Ahmed El Kholy",
  "waiting":False,"line":"I updated the definition and it did not stick.",
  "line_at":"2026-08-28T09:10:00Z","from_office":False,"is_last":False},
]
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
        n=int(self.headers.get("Content-Length") or 0)
        b=json.loads(self.rfile.read(n) or b"{}"); a=b.get("action") or ""
        cfg={"on":True,"shots":True,"promise":"Usually answers the same day",
             "beat":4000,"popup":False,"vapid":""}
        if a=="chatSearch":
            q=(b.get("q") or "").lower()
            self._s(200,json.dumps({"ok":True,"q":q,"hits":[h for h in HITS
              if q in h["line"].lower() or q in h["person_name"].lower()]}).encode(),
              "application/json"); return
        self._s(200,json.dumps({"ok":True,"office":True,"messages":[],"unread":0,
            "thread":None,"waiting":len(QUEUE),"queue":QUEUE,"chat":cfg}).encode(),"application/json")

srv=socketserver.ThreadingTCPServer(("127.0.0.1",0),H); srv.daemon_threads=True
threading.Thread(target=srv.serve_forever,daemon=True).start()
URL="http://127.0.0.1:%d/raya-trade"%srv.server_address[1]

# The proposal, in the corner's OWN classes — nothing new is invented here.
# The proposal, in the corner's OWN classes — nothing new is invented here.
# A person with no conversation carries NO time and NO last line, because they
# have neither: an em-dash in the time slot and "Start a conversation" repeated
# down the column are both the screen saying nothing three times (§35, 1b-ii).
# The row is shorter for it, which is why both groups fit.
PROPOSED = """
<div class="cqfound">2 found in all conversations, waiting or not</div>
<button class="cqrow" type="button">
  <div class="cqr1"><b>Abd El Hamid Mokhtar</b><span class="cqw">Yesterday 11:50</span></div>
  <div class="cqpl">Mobile</div><div class="cqln">done</div></button>
<button class="cqrow" type="button">
  <div class="cqr1"><b>Hala Abd El Latif</b><span class="cqw">Aug 28</span></div>
  <div class="cqpl">CX</div>
  <div class="cqln">I updated the definition and it did not stick.</div>
  <div class="cqhit">found in an earlier message · answered</div></button>
<div class="cqfound">3 more on the register, with no conversation yet</div>
<button class="cqrow" type="button">
  <div class="cqr1"><b>Abdelrahman Fouad</b></div>
  <div class="cqpl">Retail Stores</div></button>
<button class="cqrow" type="button">
  <div class="cqr1"><b>Abd El Rahman Sami</b></div>
  <div class="cqpl">Consumer Finance</div></button>
<button class="cqrow" type="button">
  <div class="cqr1"><b>Nour Abdallah</b></div>
  <div class="cqpl">Merchandising</div></button>
"""

with sync_playwright() as p:
    br=p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
    pg=br.new_page(viewport={"width":1400,"height":950}, device_scale_factor=2)
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    pg.goto(URL,wait_until="networkidle")
    pg.wait_for_selector("#chatdock:not([hidden])",timeout=20000)
    pg.wait_for_timeout(1200)
    pg.click("#chatbtn"); pg.wait_for_timeout(700)
    pg.fill("#cqfind","abd"); pg.wait_for_timeout(900)

    panel = pg.query_selector("#chatpanel")
    panel.screenshot(path=str(OUT/"a-today.png"))

    pg.evaluate("""(html) => {
      const b = document.getElementById('chatbody');
      const foot = b.querySelector('.cqfoot');
      b.innerHTML = html + (foot ? foot.outerHTML : '');
    }""", PROPOSED)
    pg.wait_for_timeout(300)
    panel.screenshot(path=str(OUT/"b-proposed.png"))
    # AND THE WHOLE LIST, because a proposal cut off at the fold cannot be
    # judged — the panel is shot again with the body scrolled to its end.
    pg.evaluate("() => { const b=document.getElementById('chatbody'); b.scrollTop=b.scrollHeight; }")
    pg.wait_for_timeout(250)
    panel.screenshot(path=str(OUT/"c-proposed-scrolled.png"))
    print("shot:", [f.name for f in sorted(OUT.glob('*.png'))])
    br.close()
srv.shutdown()
