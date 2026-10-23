"""THE MOCKUP IS MADE OF THE REAL SETUP PAGES (rule 1c).

Islam, 2026-10-23, after the colours on Client set-up went nowhere: *"can we
make save or apply buttons beside the areas of change?"* — then, of HR_ERP:
*"it has a very strong logic on adjusting and saving to make sure things are
applied well"*, and *"all Setup pages first"*. So this photographs the BUILT
platform over a stub server (the demo seed, the office signed in), walks to
Getting started and to Scoring bands the way somebody walks there, and draws
HR_ERP's saving into the live page:

  1. a colour picked: the boxes show it and the page does NOT (Islam: "the
     color shouldn't change before apply"), the area says in amber that it
     is not applied yet, beside Apply and Discard;
  2. the moment after Apply: the page wears it, a green "Applied", and Undo
     for a few seconds ("a temp button that appears shortly after the
     application so the user can get back"); Reset to the shipped palette
     stays where it was;
  3. a floor changed on Scoring bands, the same row under its table with
     Save;
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
  row: function(btn, state, words){
    var dirty = state === 'dirty';
    var line = dirty
      ? '<span style="display:inline-flex;align-items:center;gap:7px;font:600 var(--fs-small)/1.3 var(--sans);color:var(--attn-tx)">' +
          this.dot('--attn') + words + '</span>'
      : '<span style="display:inline-flex;align-items:center;gap:7px;font:600 var(--fs-small)/1.3 var(--sans);color:var(--good-tx)">' +
          this.dot('--good') + words + '</span>';
    return '<div class="mk-save" style="display:flex;flex-wrap:wrap;align-items:center;gap:10px 12px;margin-top:14px">' +
      this.solid(btn, !dirty) + (dirty ? this.plain('Discard') : '') + line +
      (state === 'applied' ? this.plain('Undo') : '') + '</div>';
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

    # 1 · a colour picked: the boxes show it, the page does not — not yet applied
    pg.evaluate("""()=>{
      const acc = '#1F6F8B';
      const pick = document.querySelector('.csetup [data-brand=accent]');
      const hex = document.querySelector('.csetup [data-brandhex=accent]');
      pick.value = acc.toLowerCase(); hex.value = acc;
      const cfg = pick.closest('.cfg');
      cfg.insertAdjacentHTML('afterend', __mk.row('Apply', 'dirty', '1 change not applied yet: the accent'));
      cfg.scrollIntoView({block:'center'});
    }""")
    pg.wait_for_timeout(400)
    shot(pg, "colours-unapplied.png")

    # 2 · the moment after Apply: the page wears it, Undo for a few seconds
    pg.evaluate("""()=>{
      branding().accent = '#1F6F8B'; applyBrand();
      const old = document.querySelector('.csetup .mk-save');
      old.outerHTML = __mk.row('Apply', 'applied', 'Applied');
      const row = document.querySelector('.csetup .mk-save');
      if (!document.querySelector('.csetup [data-brandreset]'))
        row.insertAdjacentHTML('afterend', '<div style="margin-top:12px"><button class="linkbu" type="button">Reset to the shipped palette</button></div>');
    }""")
    pg.wait_for_timeout(300)
    shot(pg, "colours-applied.png")

    # 3 · Scoring bands: a band's colour picked — a colour area, so Apply (round 3)
    pg.evaluate("()=>{ branding().accent = null; applyBrand(); }")
    setup_go(pg, "bands")
    pg.evaluate("()=>{ EDITING.bands = true; paint(); }")   # the page's own Edit, pressed
    pg.wait_for_timeout(500)
    pg.evaluate(JS_PIECES)
    pg.evaluate("""()=>{
      const rows = [...document.querySelectorAll('table.bandtbl tbody tr')];
      const row = rows[1];                                  /* the second band */
      const name = row.querySelector('input.blabel').value;
      const cols = row.querySelector('.bcols');
      cols.querySelectorAll('.bcol').forEach(c => { c.classList.remove('on'); c.removeAttribute('aria-pressed'); });
      const pick = cols.querySelector('[data-bcol$="|warn"]') || cols.querySelectorAll('.bcol')[2];
      pick.classList.add('on'); pick.setAttribute('aria-pressed', 'true');
      cols.style.outline = '2px solid var(--attn)'; cols.style.outlineOffset = '3px'; cols.style.borderRadius = '6px';
      document.querySelectorAll('button').forEach(b => { if (/^\\s*done\\s*$/i.test(b.textContent)) b.style.visibility = 'hidden'; });
      const add = document.querySelector('[data-badd]');
      const foot = (add && add.closest('.cfg-bar')) || row.closest('.cfg');
      foot.insertAdjacentHTML('afterend', __mk.row('Apply', 'dirty', '1 change not applied yet: the colour for ' + name));
      row.closest('.cfg').scrollIntoView({block:'center'});
    }""")
    pg.wait_for_timeout(400)
    shot(pg, "bands-colour-unapplied.png")

    # 4 · Roles & access: one cell changed, the Save row under the matrix (round 3)
    setup_go(pg, "access")
    pg.evaluate(JS_PIECES)
    cell = pg.evaluate("""()=>{
      const tr = [...document.querySelectorAll('#panel table tbody tr')]
        .find(r => /^\\s*Owner/.test(r.children[0].textContent));
      const td = tr && tr.children[3];                      /* Their own · Reporting */
      const b = td && td.querySelector('button');
      if (b) b.click();
      return !!b;
    }""")
    pg.wait_for_timeout(600)
    pg.evaluate(JS_PIECES)
    pg.evaluate("""()=>{
      const tr = [...document.querySelectorAll('#panel table tbody tr')]
        .find(r => /^\\s*Owner/.test(r.children[0].textContent));
      const td = tr.children[3];
      td.style.outline = '2px solid var(--attn)'; td.style.outlineOffset = '-3px';
      const cfg = td.closest('.cfg');
      cfg.insertAdjacentHTML('afterend', __mk.row('Save', 'dirty', '1 change not saved yet: Owner \u00b7 their own reporting'));
    }""")
    pg.wait_for_timeout(300)
    shot(pg, "access-unsaved.png")

    # 5 · leaving Roles & access with it unsaved: the strip asks (agreed in round 2)
    pg.evaluate("""()=>{
      const it = document.querySelector('.setuprail [data-setupgo=units]');
      if (it) { it.style.outline = '2px dashed var(--attn)'; it.style.outlineOffset = '-2px'; }
      __mk.strip('Roles & access', 'Owner \u00b7 their own reporting');
    }""")
    pg.wait_for_timeout(300)
    shot(pg, "access-leave.png")
    pg.evaluate("()=>{ const s=document.querySelector('.mk-strip'); if(s) s.remove(); }")

    # 6 · the shape screen names End in Mind, under Winning Aspiration (Terminology goes)
    setup_go(pg, "start")
    pg.wait_for_timeout(800)
    pg.evaluate("()=>{const b=[...document.querySelectorAll('.csetup .wzstep')].find(x=>x.dataset.step==='shape'); if(b) b.click();}")
    pg.wait_for_timeout(1200)
    pg.evaluate("""()=>{
      const asp = [...document.querySelectorAll('.csetup .stpart')]
        .find(r => /^Aspiration/.test((r.querySelector('input') || {}).getAttribute ? r.querySelector('input').getAttribute('aria-label') : ''));
      if (!asp) return;
      const row = asp.cloneNode(true);
      const tick = row.firstElementChild; tick.replaceWith(document.createElement('span'));
      row.classList.remove('off');
      row.querySelectorAll('input').forEach(i => { i.value = ''; i.placeholder = 'End in Mind'; });
      row.style.outline = '2px dashed var(--attn)'; row.style.outlineOffset = '3px'; row.style.borderRadius = '6px';
      asp.after(row);
      row.scrollIntoView({block:'center'});
    }""")
    pg.wait_for_timeout(400)
    shot(pg, "shape-endinmind.png")
    b.close()
