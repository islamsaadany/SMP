"""THE MOCKUP IS MADE OF THE REAL SETUP PAGES (rule 1c).

Islam, 2026-10-23, after the colours on Client set-up went nowhere: *"can we
make save or apply buttons beside the areas of change?"* — then, of HR_ERP:
*"it has a very strong logic on adjusting and saving to make sure things are
applied well"*, and *"all Setup pages first"*. So this photographs the BUILT
platform over a stub server (the demo seed, the office signed in), walks to
Getting started and to Terminology the way somebody walks there, and draws
HR_ERP's saving into the live page:

  1. a colour changed: the page previews it, and the area says in amber that
     it is not saved yet, beside Save and Discard changes;
  2. the same area a moment after Save: Save greyed, a green "Saved";
  3. a word changed on Terminology, the same line under its table;
  4. leaving with that unsaved: the gold strip — Save and continue, Discard
     changes, Keep editing.

It measures nothing and asserts nothing. Writes PNGs into
design-mockups/setup-save/shots/.

qa-run: own-server
Run: python3 qa-run.py checks/setup-save-mockup.py
"""
import json, os, pathlib, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = pathlib.Path(os.environ.get("SMP_BUILT") or
                    (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")).read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
OUT = ROOT / "design-mockups/setup-save/shots"
OUT.mkdir(parents=True, exist_ok=True)
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}


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
            self._s(200, json.dumps({"ok": True, "state": SEED, "person": PERSON}).encode(), "application/json")
            return
        if self.path.startswith("/raya-trade"):
            self._s(200, HTML, "text/html; charset=utf-8")
            return
        self._s(200, b"<!doctype html><title>Sign in</title>", "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        body = json.loads(self.rfile.read(n) or b"{}")
        if self.path.startswith("/api/platform") and body.get("action") == "client":
            self._s(200, json.dumps({
                "ok": True,
                "client": {"key": "raya-trade", "name": "Raya Trade", "status": "active", "made_here": True,
                           "industry": "Retail", "size": "1000+", "notes": "", "mark": None,
                           "modules": ["strategy"]},
                "team": [], "seats": [], "canEdit": True, "register": [], "office": [],
                "shape": None, "holds": None, "goes": None, "canArchive": True, "canDelete": False,
                "modules": ["strategy"],
                "offer": [{"key": "strategy", "label": "Strategy", "note": "", "always": True}]
            }).encode(), "application/json")
            return
        self._s(200, b'{"ok":true}', "application/json")


# The proposal's pieces, in the platform's own tokens. A SAVE ROW sits at the
# foot of the area it saves; the LEAVE STRIP is pinned to the bottom of the
# window over the pane, so it is in view wherever the page is scrolled.
JS_PIECES = r"""
window.__mk = {
  dot: function(c){ return '<span style="width:7px;height:7px;border-radius:50%;flex:none;background:var(' + c + ')"></span>'; },
  solid: function(t, off){
    return '<button type="button" style="font:600 var(--fs-small)/1.3 var(--sans);padding:7px 16px;border-radius:7px;' +
      'border:1px solid var(--panel);background:var(--panel);color:var(--panel-ink);cursor:pointer' +
      (off ? ';opacity:.45;cursor:default' : '') + '"' + (off ? ' disabled' : '') + '>' + t + '</button>';
  },
  plain: function(t){
    return '<button type="button" style="font:600 var(--fs-small)/1.3 var(--sans);padding:7px 14px;border-radius:7px;' +
      'border:1px solid var(--line);background:var(--surface);color:var(--ink);cursor:pointer">' + t + '</button>';
  },
  row: function(state, words){
    var line = state === 'dirty'
      ? '<span style="display:inline-flex;align-items:center;gap:7px;font:600 var(--fs-small)/1.3 var(--sans);color:var(--attn-tx)">' +
          this.dot('--attn') + words + '</span>'
      : '<span style="display:inline-flex;align-items:center;gap:7px;font:600 var(--fs-small)/1.3 var(--sans);color:var(--good-tx)">' +
          this.dot('--good') + 'Saved</span>';
    return '<div class="mk-save" style="display:flex;flex-wrap:wrap;align-items:center;gap:10px 12px;margin-top:14px">' +
      this.solid('Save', state !== 'dirty') + (state === 'dirty' ? this.plain('Discard changes') : '') + line + '</div>';
  },
  strip: function(what, unsaved){
    var pane = document.querySelector('#panel') || document.body, r = pane.getBoundingClientRect();
    var d = document.createElement('div');
    d.className = 'mk-strip';
    d.setAttribute('style', 'position:fixed;z-index:9999;bottom:18px;left:' + (r.left + 24) + 'px;right:96px;' +
      'display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;padding:12px 16px;border-radius:10px;' +
      'border:1px solid var(--attn);background:var(--attn-bg);color:var(--ink);' +
      'box-shadow:0 6px 24px rgba(0,0,0,.14);font:var(--fs-small)/1.45 var(--sans)');
    d.innerHTML = '<div style="flex:1 1 280px;min-width:0"><b style="color:var(--attn-tx)">“' + what +
      '” has changes that aren’t saved:</b> ' + unsaved + '.</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px">' + this.solid('Save and continue') +
      this.plain('Discard changes') + this.plain('Keep editing') + '</div>';
    document.body.appendChild(d);
  }
};
"""


def setup_go(pg, key):
    pg.evaluate("(k)=>{const r=document.querySelector('[data-setupgo=\"'+k+'\"]'); if(r) r.click();}", key)
    pg.wait_for_timeout(900)


def shot(pg, name):
    pg.screenshot(path=str(OUT / name))
    print("wrote", OUT / name)


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % srv.server_address[1]

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or "/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    pg.goto(URL, wait_until="networkidle")
    pg.wait_for_timeout(1500)
    pg.click('button[title="Setup"]')
    pg.wait_for_timeout(400)
    setup_go(pg, "start")
    pg.wait_for_timeout(800)
    pg.evaluate(JS_PIECES)
    # Setup pages stop saving on their own under this proposal, so the corner's
    # "Saved" (which the preview below would otherwise trigger) is not drawn.
    pg.add_style_tag(content="#savetip{display:none !important}")

    # 1 · a colour changed: previewed on the page, not saved yet
    pg.evaluate("""()=>{
      const acc = '#1F6F8B';
      branding().accent = acc; applyBrand();            /* the preview: the page wears it */
      const pick = document.querySelector('.csetup [data-brand=accent]');
      const hex = document.querySelector('.csetup [data-brandhex=accent]');
      pick.value = acc.toLowerCase(); hex.value = acc;
      const cfg = pick.closest('.cfg');
      cfg.insertAdjacentHTML('afterend', __mk.row('dirty', '1 change not saved yet: the accent'));
      cfg.scrollIntoView({block:'center'});
    }""")
    pg.wait_for_timeout(400)
    shot(pg, "colours-unsaved.png")

    # 2 · the moment after Save
    pg.evaluate("""()=>{
      const old = document.querySelector('.csetup .mk-save');
      old.outerHTML = __mk.row('saved');
    }""")
    pg.wait_for_timeout(300)
    shot(pg, "colours-saved.png")

    # 3 · Terminology, one word changed (typed, never sent: nothing is written)
    pg.evaluate("()=>{ branding().accent = null; applyBrand(); }")
    setup_go(pg, "labels")
    pg.evaluate(JS_PIECES)
    pg.evaluate("""()=>{
      const boxes = document.querySelectorAll('input.lbl[data-scope=group]');
      const box = boxes[boxes.length - 1];               /* the last row, so it and its Save share the view */
      const was = box.value;
      box.value = 'Legacy'; box.style.outline = '2px solid var(--attn)'; box.style.outlineOffset = '1px';
      const cfg = box.closest('.cfg');
      cfg.insertAdjacentHTML('afterend', __mk.row('dirty', '1 change not saved yet: the word for ' + was));
      window.__mkWas = was;
      document.querySelector('.mk-save').scrollIntoView({block:'center'});
    }""")
    pg.wait_for_timeout(400)
    shot(pg, "terminology-unsaved.png")

    # 4 · trying to leave with it unsaved: the rail item pressed, the strip asks
    pg.evaluate("""()=>{
      const it = document.querySelector('.setuprail [data-setupgo=bands]');
      if (it) { it.style.outline = '2px dashed var(--attn)'; it.style.outlineOffset = '-2px'; }
      __mk.strip('Terminology', 'the word for ' + window.__mkWas);
    }""")
    pg.wait_for_timeout(300)
    shot(pg, "terminology-leave.png")
    b.close()
