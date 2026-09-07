"""THE OFFICE'S CORNER, SPLIT — drawn in the REAL chat panel (§41.9).

Four states, injected into the built platform driven to a real page and the
corner opened as the SMO, so every pixel around the proposal is the product's
own: the panel's box, its header, its composer, the tenant's palette.

People are taken from the register the deployment actually holds (§245: a
mockup populated with names the client cannot recognise is a screen nobody
can sign off).
"""
import base64, json, socketserver, threading, http.server, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path("/home/user/SMP")
HTML = (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
GATE = (ROOT / "index.html").read_bytes()
SW   = (ROOT / "sw.js").read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}

class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _s(self, c, b, t):
        self.send_response(c); self.send_header("Content-Type", t)
        self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        if self.path.startswith("/sw.js"): self._s(200, SW, "application/javascript"); return
        if self.path.startswith("/api/state"):
            self._s(200, json.dumps({"ok": True, "state": SEED, "person": PERSON}).encode(),
                    "application/json"); return
        if self.path.startswith("/raya-trade"): self._s(200, HTML, "text/html; charset=utf-8"); return
        self._s(200, GATE, "text/html; charset=utf-8")
    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0); self.rfile.read(n)
        cfg = {"on": True, "shots": True, "promise": "Usually answers the same day",
               "beat": 4000, "popup": True, "vapid": ""}
        self._s(200, json.dumps({"ok": True, "office": True, "messages": [], "unread": 0,
            "thread": None, "waiting": 4, "chat": cfg}).encode(), "application/json")

srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % srv.server_address[1]

CSS = """
/* ── THE SPLIT: two segments under the header ─────────────────────── */
.mkseg { display:flex; margin:0 14px 10px; border:1px solid var(--line);
         border-radius:8px; overflow:hidden; background:var(--surface); }
.mkseg button { flex:1 1 0; border:0; background:transparent; cursor:pointer;
                font:inherit; font-size:var(--fs-note); font-weight:600;
                color:var(--ink-3); padding:7px 6px; line-height:1.2;
                display:inline-flex; align-items:center; justify-content:center; gap:6px; }
.mkseg button + button { border-left:1px solid var(--line); }
.mkseg button.on { background:var(--panel); color:var(--panel-ink); }
.mkseg .mkc { display:inline-block; min-width:17px; padding:1px 5px; border-radius:9px;
              background:var(--gold); color:var(--on-accent); font-size:10.5px;
              font-weight:700; line-height:1.5; }
.mkseg button.on .mkc { background:var(--panel-ink); color:var(--panel); }

/* ── THE WAITING LIST ─────────────────────────────────────────────── */
.mkfind { margin:0 14px 8px; }
.mkfind input { width:100%; box-sizing:border-box; border:1px solid var(--line);
                border-radius:8px; padding:7px 10px; font:inherit;
                font-size:var(--fs-note); background:var(--surface); color:var(--ink); }
.mklist { flex:1 1 auto; overflow-y:auto; padding:0 8px; }
.mkrow { display:block; width:100%; text-align:left; border:0; border-radius:9px;
         background:transparent; cursor:pointer; font:inherit; padding:9px 10px;
         border-bottom:1px solid var(--line); }
.mkrow:last-child { border-bottom:0; }
.mkrow:hover { background:var(--surface-2); }
.mkr1 { display:flex; align-items:baseline; gap:8px; }
.mkr1 b { font-size:var(--fs-note); font-weight:650; color:var(--ink); }
.mkr1 .mkw { margin-left:auto; font-size:var(--fs-micro); color:var(--ink-3);
             white-space:nowrap; }
.mkpl { font-size:var(--fs-micro); color:var(--ink-3); margin-top:1px; }
.mkln { font-size:var(--fs-note); color:var(--ink-2); margin-top:4px;
        overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.mkln mark { background:var(--gold-glow, #F7EFD6); color:inherit; border-radius:2px; }
.mkhit { font-size:var(--fs-micro); color:var(--ink-3); margin-top:3px; font-style:italic; }
.mkfoot { border-top:1px solid var(--line); padding:9px 14px; }
.mkfoot a { font-size:var(--fs-note); color:var(--gold-deep); text-decoration:none;
            font-weight:600; cursor:pointer; }
.mkfoot a:hover { text-decoration:underline; }
.mkfound { padding:7px 14px 3px; font-size:var(--fs-micro); color:var(--ink-3); }
.mkzero { padding:26px 18px; text-align:center; color:var(--ink-3);
          font-size:var(--fs-note); }

/* ── A CONVERSATION OPEN INSIDE THE CORNER ────────────────────────── */
.mkback { display:inline-flex; align-items:center; gap:7px; border:0; padding:0;
          background:transparent; cursor:pointer; font:inherit; color:inherit; }
.mkback svg { width:15px; height:15px; flex:none; }
"""

BACK = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" '
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        '<path d="M15 6l-6 6 6 6"/></svg>')

ROWS = [
  ("Ashraf Laithy", "Mobile &middot; Head", "9:41",
   "The Q3 target on Active Base still reads 4.2M on our page."),
  ("Hala Nabil", "CX &middot; Strategy custodian", "9:12",
   "I updated the definition and it did not stick — is that me?"),
  ("Hossam Farid", "Retail Stores &middot; Head", "Yesterday 16:20",
   "Can we reopen the report? One figure went in wrong."),
  ("Mennah Adel", "Finance &middot; Strategy custodian", "Yesterday 11:05",
   "Who should own the revenue lines now that Omar has moved?"),
]

def rows_html(hits=False):
    out = []
    for n, pl, w, ln in ROWS:
        line = ln
        extra = ""
        if hits:
            continue
        out.append(
          '<button class="mkrow" type="button">'
          '<div class="mkr1"><b>%s</b><span class="mkw">%s</span></div>'
          '<div class="mkpl">%s</div><div class="mkln">%s</div>%s</button>'
          % (n, w, pl, line, extra))
    return "".join(out)

SEARCH_ROWS = """
<button class="mkrow" type="button">
  <div class="mkr1"><b>Hala Nabil</b><span class="mkw">14 Aug 10:22</span></div>
  <div class="mkpl">CX &middot; Strategy custodian</div>
  <div class="mkln">…so the <mark>target</mark> we agreed in March is the one on the page.</div>
  <div class="mkhit">found in an earlier message</div>
</button>
<button class="mkrow" type="button">
  <div class="mkr1"><b>Ashraf Laithy</b><span class="mkw">9:41</span></div>
  <div class="mkpl">Mobile &middot; Head</div>
  <div class="mkln">The Q3 <mark>target</mark> on Active Base still reads 4.2M on our page.</div>
</button>
<button class="mkrow" type="button">
  <div class="mkr1"><b>Karim Sabry</b><span class="mkw">2 Aug 15:40</span></div>
  <div class="mkpl">IT Dist. &middot; Head</div>
  <div class="mkln">The <mark>target</mark> column was empty when I opened it.</div>
  <div class="mkhit">found in an earlier message &middot; answered</div>
</button>
"""

THREAD = """
<div class="chatday">Today</div>
<div class="chmsg">
  <div class="chwho"><span>Ashraf Laithy</span><span>09:41</span></div>
  <div class="chbod">The Q3 target on Active Base still reads 4.2M on our page.
    We agreed 4.6M in the March review.</div>
</div>
<div class="chmsg">
  <div class="chwho"><span>Ashraf Laithy</span><span>09:42</span></div>
  <div class="chbod">Happy to be wrong — but the deck we signed says 4.6.</div>
</div>
"""

def seg(active, n):
    a = ' class="on"' if active == "wait" else ""
    b = ' class="on"' if active == "mine" else ""
    return ('<div class="mkseg">'
            '<button type="button"%s>Waiting <span class="mkc">%d</span></button>'
            '<button type="button"%s>My messages</button></div>' % (a, n, b))

FOOT = '<div class="mkfoot"><a>Open the Platform Inbox &rsaquo;</a></div>'

STATES = {
 "list": ("The queue, in the corner", """() => {
    const p = document.getElementById('chatpanel');
    const head = p.querySelector('.chathead');
    head.insertAdjacentHTML('afterend', SEG + FIND);
    document.getElementById('chatbody').outerHTML =
      '<div class="mklist" id="chatbody">' + ROWS + '</div>' + FOOT;
    p.querySelector('.chatfoot').hidden = true;
  }"""),
 "open": ("A conversation, opened in place", """() => {
    const p = document.getElementById('chatpanel');
    const t = p.querySelector('.cht');
    t.innerHTML = '<button class="mkback" type="button">' + BACK +
                  '<span>Ashraf Laithy</span></button>';
    p.querySelector('.chs').textContent = 'Mobile · Head · waiting since 9:41';
    document.getElementById('chatbody').innerHTML = THREAD;
    document.getElementById('chatsay').placeholder = 'Reply to Ashraf…';
  }"""),
 "search": ("Searching, across the whole history", """() => {
    const p = document.getElementById('chatpanel');
    const head = p.querySelector('.chathead');
    head.insertAdjacentHTML('afterend', SEG + FIND);
    document.querySelector('.mkfind input').value = 'target';
    document.getElementById('chatbody').outerHTML =
      '<div class="mklist" id="chatbody">' +
      '<div class="mkfound">3 found in all conversations, waiting or not</div>' +
      SEARCH + '</div>' + FOOT;
    p.querySelector('.chatfoot').hidden = true;
  }"""),
 "clear": ("Nobody waiting", """() => {
    const p = document.getElementById('chatpanel');
    const head = p.querySelector('.chathead');
    head.insertAdjacentHTML('afterend', SEG0 + FIND);
    document.getElementById('chatbody').outerHTML =
      '<div class="mklist" id="chatbody"><div class="mkzero">' +
      'Nobody is waiting on the office.</div></div>' + FOOT;
    p.querySelector('.chatfoot').hidden = true;
  }"""),
}

FIND = ('<div class="mkfind"><input type="search" '
        'placeholder="Search a name or a word…"></div>')

shots = {}
with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
    for key, (label, js) in STATES.items():
        pg = br.new_page(viewport={"width": 1280, "height": 900})
        pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                           "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
        pg.goto(URL, wait_until="networkidle")
        pg.wait_for_selector("#chatdock:not([hidden])", timeout=20000)
        pg.click("#chatbtn"); pg.wait_for_timeout(1200)
        pg.add_style_tag(content=CSS)
        pg.evaluate("([seg, seg0, find, rows, search, foot, back, thread]) => {"
                    " window.SEG=seg; window.SEG0=seg0; window.FIND=find;"
                    " window.ROWS=rows; window.SEARCH=search; window.FOOT=foot;"
                    " window.BACK=back; window.THREAD=thread; }",
                    [seg("wait", 4), seg("wait", 0), FIND, rows_html(),
                     SEARCH_ROWS, FOOT, BACK, THREAD])
        pg.evaluate(js)
        pg.wait_for_timeout(400)
        box = pg.evaluate("""() => { const e = document.getElementById('chatpanel');
            const r = e.getBoundingClientRect();
            return {x:r.x-14, y:r.y-14, w:r.width+28, h:r.height+28}; }""")
        raw = pg.screenshot(clip={"x": max(0, box["x"]), "y": max(0, box["y"]),
                                  "width": box["w"], "height": box["h"]})
        shots[key] = {"label": label, "png": base64.b64encode(raw).decode()}
        print(key, len(raw), "bytes")
        pg.close()
    br.close()
srv.shutdown()
pathlib.Path("/tmp/cornershots.json").write_text(json.dumps(shots))
print("written")
