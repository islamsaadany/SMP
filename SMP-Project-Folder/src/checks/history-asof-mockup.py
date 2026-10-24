"""THE MOCKUP IS MADE OF THE REAL PLAN PAGE AND THE REAL HISTORY PAGE (rule 1c).

Islam, 2026-10-23, of a drawn mockup: *"I need a real mockup for both to see
properly where the history will be and how it will appear."* So this is a
camera, not a drawing: it opens the BUILT platform over the same stub server
`history-page.py` uses (a fixed change log, the demo seed, the office signed
in), walks to Setup › History and to Mobile's own page the way somebody
walks there, and draws the two proposals INTO the live page:

  1. a removed row's line in the History table, with a working Restore and
     the confirmation that names its old seat;
  2. an "As it stood on…" control beside the Plan page's own "Last changed
     by … · See history" line, and the read-only view it opens — banner, the
     pen put away, a row removed since greyed with its chip.

Both sides of every picture are the same build in the same state, so what is
signed off is what the product will look like (§130.3). It measures nothing
and asserts nothing. Writes PNGs into design-mockups/history/shots/.

Run: python3 qa-run.py checks/history-asof-mockup.py
"""
import datetime, json, os, pathlib, sys, threading, http.server, socketserver, urllib.parse
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
OUT = ROOT / "design-mockups/history/shots"
OUT.mkdir(parents=True, exist_ok=True)
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
TODAY = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")
def _at(h, m): return "%sT%02d:%02d:00.000Z" % (TODAY, h, m)

LOG = [
  {"id": 9, "at": _at(9, 41), "person_key": "smo", "person_name": "Mohamed Essam", "kind": "unitPlan", "target": "mobile", "what": "the unit's plan",
   "rows_": {"count": 1, "moved": [{"id": "mobile-P1-M1", "to": "1.5%", "had": True, "from": "1%", "name": "Data duplicate rate", "field": "target"}]}},
  # the removal — today the log carries the drop by id and nothing else; the
  # proposal is that it carries the row, which is what the injected line shows
  {"id": 8, "at": _at(9, 40), "person_key": "smo", "person_name": "Mohamed Essam", "kind": "unitPlan", "target": "mobile", "what": "the unit's plan", "rows_": None},
  {"id": 7, "at": _at(8, 2), "person_key": "own_mob", "person_name": "Mennah Farouk", "kind": "unitReporting", "target": "mobile", "what": "reported figures",
   "rows_": {"count": 1, "moved": [{"id": "mobile-P1-M2", "to": 64, "had": True, "from": 61, "name": "Orders processed digitally", "field": "actual"}]}},
  {"id": 6, "at": _at(7, 20), "person_key": "smo", "person_name": "Mohamed Essam", "kind": "unitPlan", "target": "mobile", "what": "the unit's plan",
   "rows_": {"count": 1, "moved": [{"id": "mobile-P1-T2", "to": [False, True, True, False], "had": False, "from": None, "name": "End-to-end order-to-cash digitization", "field": "quarters"}]}},
  {"id": 5, "at": _at(7, 5), "person_key": "smo", "person_name": "Mohamed Essam", "kind": "unitPlan", "target": "retailstores", "what": "the unit's plan",
   "rows_": {"count": 1, "moved": [{"id": "retailstores-P2-M1", "to": "Latest", "had": True, "from": "Sum", "name": "E-store revenue", "field": "compile"}]}},
]
GATE = b"<!doctype html><title>Sign in</title><h1>Sign in</h1>"

class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _s(self, c, b, t):
        self.send_response(c); self.send_header("Content-Type", t)
        self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        if self.path.startswith("/api/state"):
            q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            if "log" in q:
                f = {k: q[k][0] for k in ("target", "person", "kind", "limit") if k in q}
                rows = [r for r in LOG if (not f.get("target") or r["target"] == f["target"])
                        and (not f.get("person") or r["person_key"] == f["person"])
                        and (not f.get("kind") or r["kind"] == f["kind"])][: int(f.get("limit") or 200)]
                self._s(200, json.dumps({"ok": True, "office": True, "log": rows}).encode(), "application/json"); return
            if "since" in q:
                self._s(200, json.dumps({"ok": True, "changed": [], "now": _at(10, 0)}).encode(), "application/json"); return
            self._s(200, json.dumps({"ok": True, "state": SEED, "person": PERSON}).encode(), "application/json"); return
        if self.path.startswith("/raya-trade"):
            self._s(200, HTML, "text/html; charset=utf-8"); return
        self._s(200, GATE, "text/html; charset=utf-8")
    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0); self.rfile.read(n)
        self._s(200, b'{"ok":true}', "application/json")

srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % srv.server_address[1]
INIT = ("try{sessionStorage.setItem('smp.tour.later','1');"
        "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")

def shot(pg, sel, name, clip=None):
    el = pg.query_selector(sel)
    if not el: print("  MISSING", sel, "->", name); return
    el.screenshot(path=str(OUT / (name + ".png")))
    print("  shot", name)

STAGE = os.environ.get("STAGE", "all")

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.add_init_script(INIT)
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL, wait_until="networkidle"); pg.wait_for_timeout(1800)

    # ── 1 · Setup › History, as it is today ───────────────────────────────
    pg.click('button[title="Setup"]'); pg.wait_for_timeout(400)
    pg.evaluate("()=>{const r=[...document.querySelectorAll('[data-setupgo]')].find(x=>x.dataset.setupgo==='history'); if(r) r.click();}")
    pg.wait_for_timeout(1200)
    pg.evaluate("()=>{const s=document.querySelector('[data-hist-f=\"when\"]'); if(s){s.value='week'; s.dispatchEvent(new Event('change',{bubbles:true}));}}")
    pg.wait_for_timeout(900)
    shot(pg, "#panel", "history-today")
    if STAGE == "look": sys.exit(0)

    # ── 2 · the removal line, with a working Restore (proposal) ──────────
    pg.evaluate(r"""() => {
      const rows = [...document.querySelectorAll('[data-hist-page] table.hist tbody tr')];
      const drop = rows.find(tr => /no single value|—/.test(tr.textContent) && tr.textContent.indexOf('09:40') > -1) || rows[1];
      /* Date · Time · Who · Where · Kind · Row · Field · From → To · Restore */
      const tds = drop.children;
      tds[4].innerHTML = '<span class="hist-chip">Plan</span>';
      tds[5].innerHTML = 'Orders processed digitally'; tds[5].title = 'mobile-P1-M2';
      tds[6].textContent = 'Row';
      tds[7].innerHTML = 'MB01 · measure 2 of 5 <span class="hist-arr">→</span> <span class="hist-none">removed</span>';
      tds[7].title = 'MB01 · measure 2 of 5 → removed';
      tds[8].innerHTML = '<button type="button" class="hist-rst" data-hist-restore="x">Restore</button>';
      /* the reporting line on the removed row: held until the row is back */
      const rep = rows.find(tr => tr.textContent.indexOf('Orders processed digitally') > -1 && tr !== drop);
      if (rep) rep.children[8].innerHTML = '<button type="button" class="hist-rst hasnote" aria-disabled="true" data-tip="That row is no longer in the plan. Put the row back first, from its own line above.">Restore</button>';
      /* the confirmation, in the page's own box, under the table */
      const box = document.querySelector('[data-hist-page]');
      const c = document.createElement('div');
      c.innerHTML = '<div class="hist-confirm">' +
        '<p><strong>Put back Orders processed digitally on Mobile, as measure 2 of MB01?</strong></p>' +
        '<p>It was removed by Mohamed Essam today at 09:40, with its target, its compile rule, its hidden mark and the figures reported on it this cycle (64 in Q3). It returns to its old place with all of them. Putting it back is an ordinary change: it is saved, authorised and logged like any other, so it can itself be put back.</p>' +
        '<div class="hist-confirm-acts"><button type="button" class="btn ghost" data-hist-cancel>Cancel</button>' +
        '<button type="button" class="btn" data-hist-ok>Put it back</button></div></div>';
      box.appendChild(c.firstChild);
    }""")
    pg.wait_for_timeout(300)
    shot(pg, "#panel", "history-removed-row")

    # ── 3 · Mobile's own page, as it is today ─────────────────────────────
    pg.evaluate("()=>{const b=document.querySelector('button[data-u=\"mobile\"]'); if(b) b.click();}"); pg.wait_for_timeout(1800)
    pg.screenshot(path=str(OUT / "plan-today.png")); print("  shot plan-today")
    if STAGE == "look2": sys.exit(0)

    # ── 4 · the control beside "See history", and the view it opens ──────
    pg.evaluate(r"""() => {
      const line = document.querySelector('.pband-hist');
      if (line) line.insertAdjacentHTML('beforeend',
        ' · <button type="button" class="linkbtn" data-mock-asof>As it stood on…</button>');
    }""")
    pg.wait_for_timeout(200)
    pg.screenshot(path=str(OUT / "plan-control.png")); print("  shot plan-control")

    pg.evaluate(r"""() => {
      /* the control, open on a day */
      const line = document.querySelector('.pband-hist');
      if (line) line.querySelector('[data-mock-asof]').outerHTML =
        '<span class="fld" style="display:inline-block;width:auto;padding:3px 8px;font-size:12px;color:var(--ink);border-color:var(--gold-deep)">As it stood on 15 Sep 2026 ▾</span>';
      /* the pen is put away while an old plan is shown */
      document.querySelectorAll('.secpen, .paneact').forEach(el => { el.style.display = 'none'; });
      /* the banner, above the first pane, in the attention family */
      const first = document.querySelector('.pane');
      const ban = document.createElement('div');
      ban.setAttribute('data-mock-banner', '1');
      ban.style.cssText = 'display:flex;align-items:center;gap:14px;margin:0 0 14px;padding:10px 16px;border-radius:10px;background:var(--attn-bg);color:var(--attn-tx);font-size:13px;line-height:1.45';
      ban.innerHTML = '<span><b>Mobile’s plan as it stood on 15 September 2026.</b> Read only. 11 changes have been made since; the rows and figures below are what the plan held at the end of that day.</span>' +
        '<span style="flex:1"></span><button type="button" class="linkbtn" style="white-space:nowrap;font-weight:600">Back to today</button>';
      /* above the whole plan area (rail and pane together), never inside the
         grid that lays the two out side by side */
      const grid = first.parentNode;
      grid.parentNode.insertBefore(ban, grid);
      /* the values as they were: row 2's old target, a row removed since */
      const rows = [...first.querySelectorAll('table tbody tr')];
      const r1 = rows[0]; if (r1) { const t = r1.children[3]; if (t) t.innerHTML = t.innerHTML.replace(/1(\s*<[^>]*>)?\s*%/, '0.8$1%'); }
      const r2 = rows[1];
      if (r2) {
        r2.classList.add('hiddenrow');
        r2.children[1].insertAdjacentHTML('beforeend', '<span class="hidchip">Removed since</span>');
      }
    }""")
    pg.wait_for_timeout(300)
    pg.screenshot(path=str(OUT / "plan-asof.png")); print("  shot plan-asof")
    b.close()
