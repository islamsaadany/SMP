"""The test-copy record and the Super user's delete, drawn in the REAL page
(§41.9): the built platform is served with a stub and the proposed rows are
injected into the live list, so what is compared is the product and not a
sketch."""
import json, http.server, socketserver, threading, pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path("/home/user/SMP")
HTML = (ROOT / "SMP-Project-Folder/strategy-management-platform-v3.22.html").read_bytes()
STATE = json.loads((ROOT / "db/seed-state.json").read_text())
OUT = ROOT / "design-mockups/send-record/shots"; OUT.mkdir(parents=True, exist_ok=True)
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}

# A real send, then three test copies of the next one, then a real send.
SENT = [
 {"id":5,"subject":"The Q3 reporting cycle opens on Monday","sent_at":"2026-08-27T09:12",
  "by_name":"Mohamed Essam","audience":{"everyone":True},"total":79,"sent":76,"failed":0},
 {"id":4,"subject":"The Q3 reporting cycle opens on Monday","sent_at":"2026-08-27T09:06",
  "by_name":"Mohamed Essam","audience":None,"total":1,"sent":1,"failed":0,"kind":"test"},
 {"id":3,"subject":"The Q3 reporting cycle opens on Monday","sent_at":"2026-08-27T09:01",
  "by_name":"Mohamed Essam","audience":None,"total":1,"sent":1,"failed":0,"kind":"test"},
 {"id":2,"subject":"Reminder — figures close on Friday","sent_at":"2026-08-20T08:00",
  "by_name":"Mohamed Essam","audience":{"roles":["owner","custodian"]},"total":22,"sent":22,"failed":0},
 {"id":1,"subject":"Welcome to the platform","sent_at":"2026-08-01T10:05",
  "by_name":"Mohamed Essam","audience":{"everyone":True},"total":79,"sent":71,"failed":8},
]
DRAFTS=[{"id":9,"subject":"Q4 planning — what we need from each unit",
         "updated_at":"2026-08-26T17:02","by_name":"Mohamed Essam"}]

class H(http.server.BaseHTTPRequestHandler):
    def log_message(self,*a): pass
    def _s(self,c,b,t):
        self.send_response(c); self.send_header("Content-Type",t)
        self.send_header("Content-Length",str(len(b))); self.end_headers(); self.wfile.write(b)
    def _j(self,o): self._s(200,json.dumps(o).encode(),"application/json")
    def do_GET(self):
        if self.path.startswith("/api/state"): return self._j({"ok":True,"state":STATE,"person":PERSON})
        if self.path.startswith("/raya-trade"): return self._s(200,HTML,"text/html; charset=utf-8")
        return self._s(200,b"<!doctype html><title>Sign in</title>","text/html; charset=utf-8")
    def do_POST(self):
        n=int(self.headers.get("Content-Length") or 0)
        try: b=json.loads(self.rfile.read(n) or b"{}")
        except Exception: b={}
        a=b.get("action")
        if self.path.startswith("/api/mail"):
            if a=="status": return self._j({"ok":True,"key":True,"from":"smp@example.com",
                                            "domain":"example.com","verified":True})
            if a=="draftList": return self._j({"ok":True,"drafts":DRAFTS})
            if a=="history": return self._j({"ok":True,"messages":SENT})
            if a=="audience": return self._j({"ok":True,"to":[],"skipped":[],"active":0,"withAddress":0})
        return self._j({"ok":True})

srv=socketserver.ThreadingTCPServer(("127.0.0.1",0),H); srv.daemon_threads=True
PORT=srv.server_address[1]; threading.Thread(target=srv.serve_forever,daemon=True).start()
URL="http://127.0.0.1:%d/raya-trade"%PORT

# ── THE PROPOSAL, injected with the platform's OWN classes ───────────────
# `.pill` is the platform's own marker, `.linkbu danger` its own destructive
# link — nothing invented, so the picture is what the build would look like.
AFTER = """(scope) => {
  const rows = [...document.querySelectorAll('#msgover table')].pop();
  if (!rows) return 'no table';
  const head = rows.querySelector('thead tr');
  head.insertAdjacentHTML('beforeend', '<th class="cc" style="width:9%"></th>');
  [...rows.querySelectorAll('tbody tr')].forEach((tr, i) => {
    const test = (i === 1 || i === 2);
    /* THE MARK GOES IN THE COLUMN THAT ALREADY ANSWERS "who got it" (§116.4):
       put beside the heading it wrapped the frozen first column onto a second
       line, which is the one thing §88 forbids. Here it costs no height. */
    if (test) {
      const who = tr.children[2];
      if (who) who.innerHTML = '<span class="pill">TEST COPY</span>';
    }
    const may = (scope === 'all') || test;
    tr.insertAdjacentHTML('beforeend',
      '<td class="cc">' + (may ? '<button class="linkbu danger">Delete</button>' : '') + '</td>');
  });
  return 'ok';
}"""

def shot(pg, name, sel="#msgover"):
    el = pg.query_selector(sel)
    box = el.bounding_box()
    pg.screenshot(path=str(OUT/name), clip={"x":box["x"],"y":max(0,box["y"]-8),
                                            "width":box["width"],"height":min(box["height"]+16, 620)})

with sync_playwright() as pw:
    br = pw.chromium.launch()
    pg = br.new_page(viewport={"width":1500,"height":1200})
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    pg.goto(URL); pg.wait_for_selector("nav.units", timeout=15000)
    pg.click('#units [data-md="setup"]'); pg.wait_for_timeout(600)
    pg.evaluate("()=>{current='setup';currentSub='send';paint();}")
    pg.wait_for_timeout(1800)
    for theme in ("light","dark"):
        pg.evaluate("(t)=>document.documentElement.setAttribute('data-theme',t)", theme)
        pg.wait_for_timeout(300)
        pg.evaluate("()=>{SENTLIST=null;paint();}"); pg.wait_for_timeout(1200)
        shot(pg, "before-%s.png" % theme)
        for scope in ("all", "tests"):
            pg.evaluate("()=>{SENTLIST=null;paint();}"); pg.wait_for_timeout(1100)
            print(theme, scope, pg.evaluate(AFTER, scope))
            pg.wait_for_timeout(200)
            shot(pg, "after-%s-%s.png" % (scope, theme))
    br.close()
print("shots written to", OUT)
