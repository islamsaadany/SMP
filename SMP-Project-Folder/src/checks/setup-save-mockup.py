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
  pinned: function(btn, words){
    var pane = document.querySelector('#panel') || document.body, r = pane.getBoundingClientRect();
    var d = document.createElement('div');
    d.className = 'mk-pinned';
    d.setAttribute('style', 'position:fixed;z-index:9998;bottom:18px;left:' + (r.left + 24) + 'px;right:96px;' +
      'display:flex;flex-wrap:wrap;align-items:center;gap:10px 12px;padding:10px 14px;border-radius:10px;' +
      'border:1px solid var(--line);background:var(--surface);box-shadow:0 6px 24px rgba(0,0,0,.12)');
    d.innerHTML = this.row(btn, 'dirty', words).replace('margin-top:14px', 'margin:0');
    document.body.appendChild(d);
  },
  savedTag: function(){
    return '<span class="mk-saved" style="display:inline-flex;align-items:center;gap:5px;margin-left:8px;' +
      'font:600 11px/1 var(--sans);color:var(--good-tx);vertical-align:middle">' + this.dot('--good') + 'Saved</span>';
  },
  askRow: function(tr, text, yes){
    var n = tr.children.length;
    var row = document.createElement('tr');
    row.className = 'mk-ask';
    row.innerHTML = '<td colspan="' + n + '" style="padding:10px 14px;border:1px solid var(--attn);background:var(--attn-bg)">' +
      '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;font:var(--fs-small)/1.45 var(--sans);color:var(--ink)">' +
      '<div style="flex:1 1 320px;min-width:0">' + text + '</div>' +
      '<div style="display:flex;gap:8px">' + this.solid(yes) + this.plain('Keep as it was') + '</div></div></td>';
    tr.after(row);
  },
  floatBox: function(anchor, title, text, yes, no){
    var r = anchor.getBoundingClientRect(), W = 380;
    var left = Math.max(16, Math.min(window.innerWidth - W - 16, r.left + r.width / 2 - 48));
    var top = r.bottom + 12 + window.pageYOffset;
    var d = document.createElement('div');
    d.className = 'mk-float';
    d.setAttribute('style', 'position:absolute;z-index:9999;top:' + top + 'px;left:' + (left + window.pageXOffset) + 'px;width:' + W + 'px;' +
      'box-sizing:border-box;padding:14px 16px;border-radius:10px;border:1px solid var(--attn);background:var(--surface);' +
      'box-shadow:0 12px 32px rgba(0,0,0,.18);font:var(--fs-small)/1.5 var(--sans);color:var(--ink)');
    var ax = r.left + r.width / 2 - left - 7;
    d.innerHTML = '<span style="position:absolute;top:-8px;left:' + ax + 'px;width:14px;height:14px;transform:rotate(45deg);' +
      'background:var(--surface);border-left:1px solid var(--attn);border-top:1px solid var(--attn)"></span>' +
      '<div style="font-weight:700;color:var(--attn-tx);margin-bottom:4px">' + title + '</div>' +
      '<div style="margin-bottom:12px">' + text + '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px">' + this.solid(yes) + this.plain(no) + '</div>';
    document.body.appendChild(d);
  },
  tip: function(anchor, text){
    var r = anchor.getBoundingClientRect();
    var d = document.createElement('div');
    d.className = 'mk-tip';
    d.setAttribute('style', 'position:absolute;z-index:9999;top:' + (r.bottom + 8 + window.pageYOffset) + 'px;left:' + (r.left + window.pageXOffset) + 'px;' +
      'max-width:420px;padding:8px 11px;border-radius:7px;background:var(--ink);color:var(--surface);' +
      'font:12px/1.45 var(--sans);box-shadow:0 6px 18px rgba(0,0,0,.2)');
    d.textContent = text;
    document.body.appendChild(d);
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

    # 4 · Roles & access: giving MORE asks first too, in a floating box with the impact (round 5)
    setup_go(pg, "access")
    pg.evaluate(JS_PIECES)
    def access_row(name):
        return "[...document.querySelectorAll('#panel table tbody tr')].find(r => /^\\s*" + name + "/.test(r.children[0].textContent))"
    pg.evaluate("""()=>{
      const tr = """ + access_row("Custodian") + """;
      const td = tr.children[2];                            /* Their own · Plan */
      const pen = td.querySelector('[data-acm$="|edit"]') || td.querySelectorAll('button')[td.querySelectorAll('button').length - 1];
      td.style.outline = '2px solid var(--attn)'; td.style.outlineOffset = '-3px';
      const who = (tr.children[0].querySelector('span, small, .why') || {}).textContent || '';
      __mk.floatBox(pen, 'Custodian' + (who ? ' \u00b7 ' + who : ''),
        'Will be able to <span style="font-weight:700">change</span> their own plan, not only read it.',
        'Change it', 'Keep as it was');
    }""")
    pg.wait_for_timeout(300)
    shot(pg, "access-more-asks.png")

    # 5 · taking AWAY asks the same way
    pg.evaluate("""()=>{
      document.querySelectorAll('.mk-float').forEach(e => e.remove());
      document.querySelectorAll('#panel td').forEach(td => td.style.outline = '');
      const tr = """ + access_row("Owner") + """;
      const td = tr.children[3];                            /* Their own · Reporting */
      const eye = td.querySelector('button');
      td.style.outline = '2px solid var(--attn)'; td.style.outlineOffset = '-3px';
      const who = (tr.children[0].querySelector('span, small, .why') || {}).textContent || '';
      __mk.floatBox(eye, 'Owner' + (who ? ' \u00b7 ' + who : ''),
        'Will only be able to <span style="font-weight:700">read</span> their own reporting, and no longer change it.',
        'Change it', 'Keep as it was');
    }""")
    pg.wait_for_timeout(300)
    shot(pg, "access-less-asks.png")

    # 6 · after Change it: saved, and said on the cell
    pg.evaluate("""()=>{
      document.querySelectorAll('.mk-float').forEach(e => e.remove());
      document.querySelectorAll('#panel td').forEach(td => td.style.outline = '');
      const tr = """ + access_row("Custodian") + """;
      const b = tr && tr.children[2].querySelector('[data-acm$="|edit"]');
      if (b) b.click();
    }""")
    pg.wait_for_timeout(700)
    pg.evaluate(JS_PIECES)
    pg.evaluate("""()=>{
      const tr = """ + access_row("Custodian") + """;
      tr.children[2].querySelector('.stset').insertAdjacentHTML('afterend', __mk.savedTag());
    }""")
    pg.wait_for_timeout(300)
    shot(pg, "access-saved.png")

    # 7 · Client set-up: no Save; unticking a part that HOLDS DATA asks in the same box
    setup_go(pg, "start")
    pg.wait_for_timeout(800)
    pg.evaluate("()=>{const b=[...document.querySelectorAll('.csetup .wzstep')].find(x=>x.dataset.step==='shape'); if(b) b.click();}")
    pg.wait_for_timeout(1200)
    pg.evaluate("()=>{const b=document.querySelector('.csetup [data-shlvl=\"bu\"]'); if(b) b.click();}")
    pg.wait_for_timeout(1000)
    pg.evaluate(JS_PIECES)
    pg.evaluate("""()=>{
      const asp = [...document.querySelectorAll('.csetup .stpart')]
        .find(r => { const i = r.querySelector('input'); return i && /^Aspiration/.test(i.getAttribute('aria-label') || ''); });
      if (!asp) return;
      const row = asp.cloneNode(true);
      row.classList.remove('off');
      row.querySelectorAll('input').forEach(i => { i.value = ''; i.placeholder = 'End in Mind'; });
      asp.after(row);
      row.scrollIntoView({block:'center'});
      const tick = row.firstElementChild;
      tick.style.outline = '2px solid var(--attn)'; tick.style.outlineOffset = '2px'; tick.style.borderRadius = '4px';
      __mk.floatBox(tick, 'Business units \u00b7 End in Mind',
        '<span style="font-weight:700">Mobile</span> has one written. Unticking hides it on Mobile\u2019s Strategy page and in its presentation. ' +
        'The words are kept and come back when you tick it again.', 'Untick', 'Keep');
    }""")
    pg.wait_for_timeout(400)
    shot(pg, "shape-untick-asks.png")
    pg.evaluate("()=>{ document.querySelectorAll('.mk-float').forEach(e => e.remove()); }")

    # 8 · where End in Mind shows when ticked: Mobile's Strategy page, the aspiration card
    pg.evaluate("""()=>{ const u = document.querySelector('#units [data-u="mobile"]'); if (u) u.click(); }""")
    pg.wait_for_timeout(900)
    pg.evaluate("""()=>{ const t = document.querySelector('[data-s="strategy"]'); if (t) t.click(); }""")
    pg.wait_for_timeout(900)
    pg.evaluate("""()=>{
      const go = [...document.querySelectorAll('button, a')].find(b => /^\\s*Foundation\\s*$/.test(b.textContent));
      if (go) go.click();
    }""")
    pg.wait_for_timeout(900)
    pg.evaluate("""()=>{
      const lab = [...document.querySelectorAll('.endin .boxlab')][0];
      if (!lab) return;
      const box = lab.closest('.endin');
      box.style.outline = '2px dashed var(--attn)'; box.style.outlineOffset = '4px'; box.style.borderRadius = '6px';
      box.scrollIntoView({block:'center'});
    }""")
    pg.wait_for_timeout(400)
    shot(pg, "mobile-endinmind.png")

    # 9 · Getting started with the paragraphs taken out; one fact shown on its hover
    pg.click('button[title="Setup"]')
    pg.wait_for_timeout(400)
    setup_go(pg, "start")
    pg.wait_for_timeout(1200)
    pg.evaluate("()=>{const b=document.querySelector('.csetup .wzstep[data-step=client]'); if(b) b.click();}")
    pg.wait_for_timeout(1000)
    pg.evaluate(JS_PIECES)
    gone = pg.evaluate("""()=>{
      const out = [/^What the platform is named after/, /^Made from the name/, /^Shown on /, /^The tenant.s face is set/,
                   /^Branding is the tenant/, /^Turning one on gives this client/, /^Archiving takes/];
      let n = 0;
      document.querySelectorAll('#panel p, #panel .note, #panel .wzendwhy').forEach(e => {
        const t = e.textContent.trim();
        if (out.some(r => r.test(t))) { e.style.display = 'none'; n++; }
      });
      /* a heading left with nothing under it goes with its note (the Typeface block) */
      [...document.querySelectorAll('#panel h2, #panel h3')].forEach(h => {
        if (/^Typeface$/.test(h.textContent.trim())) { const sec = h.closest('section, .sec, div'); if (sec) sec.style.display = 'none'; }
      });
      window.scrollTo(0, 0);
      const lab = [...document.querySelectorAll('.csetup .lab')].find(l => /mark/i.test(l.textContent));
      if (lab) { lab.style.textDecoration = 'underline dotted'; __mk.tip(lab,
        'Shown on the sign-in page and on the presentations: large on the cover, small in every slide\u2019s footer. PNG with a transparent background.'); }
      return n;
    }""")
    print("paragraphs taken out:", gone)
    pg.wait_for_timeout(400)
    shot(pg, "client-clean.png")
    pg.evaluate("()=>{ document.querySelectorAll('.mk-tip').forEach(e => e.remove()); }")

    # 10 · the shape step cleaned the same way: the notice one line, the how-to lines on hovers
    pg.evaluate("()=>{const b=document.querySelector('.csetup .wzstep[data-step=shape]'); if(b) b.click();}")
    pg.wait_for_timeout(1200)
    pg.evaluate("()=>{const b=document.querySelector('.csetup [data-shlvl=\"top\"]') || document.querySelector('.csetup .shtoprow button'); if(b) b.click();}")
    pg.wait_for_timeout(900)
    pg.evaluate(JS_PIECES)
    gone2 = pg.evaluate("""()=>{
      let n = 0;
      const notice = [...document.querySelectorAll('.csetup .wzarched')].find(e => /shape is set from here on/.test(e.textContent));
      if (notice) { notice.textContent = 'This client has a plan, so rows can\u2019t be added here. Names and switches still change.'; n++; }
      document.querySelectorAll('.csetup .wzwhy').forEach(e => { e.style.display = 'none'; n++; });
      window.scrollTo(0, 0);
      return n;
    }""")
    print("shape lines taken out or shortened:", gone2)
    pg.wait_for_timeout(400)
    shot(pg, "shape-clean.png")
    b.close()
