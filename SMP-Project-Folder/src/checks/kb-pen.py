"""THE KNOWLEDGE BASE'S PEN (§137).

Over HTTP with a stub, because the pen only matters where a server will keep
what it writes — and half of what is asserted is DATA (§96's lesson: an editor
wired to nothing looks identical and discards every keystroke), so every press
is followed by asking GROUP.kb what actually changed. The Postgres round trip
itself is the generic org.extra machinery, proved by test-roundtrip; what this
file owns is the surface: the pen, the cards, the marks, the escape, and the
absences (§94.2 — a check that only looks for something present cannot see a
door that should be shut).
"""
import json, pathlib, threading, http.server, time
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
SEED = json.loads((ROOT / "db/kb.json").read_text()) and json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}

errs, bad = [], 0
def ck(w, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))

class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _send(self, code, body, ctype):
        self.send_response(code); self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body))); self.end_headers()
        self.wfile.write(body)
    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._send(200, json.dumps({"ok": True, "state": SEED, "person": PERSON}).encode(),
                       "application/json"); return
        if self.path.startswith("/raya-trade"):
            self._send(200, HTML, "text/html; charset=utf-8"); return
        self._send(200, b"<!doctype html><h1 id='gate'>Sign in</h1>", "text/html; charset=utf-8")
    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0); self.rfile.read(n)
        self._send(200, b'{"ok":true}', "application/json")

srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), H)
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % srv.server_address[1]
import os
EXE = os.environ.get("SMP_CHROME") or None

def open_kb(pg):
    pg.goto(BASE + "/raya-trade", wait_until="networkidle")
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    pg.evaluate("()=>{ try{ ['custodian','owner','smo','fnhead']"
                ".forEach(k=>localStorage.setItem('smp.tour.'+k,'never')); }catch(e){} }")
    pg.reload(wait_until="networkidle"); pg.wait_for_timeout(2000)
    pg.evaluate("()=>{const b=document.querySelector('[data-md=\"setup\"]'); if(b) b.click();}")
    pg.wait_for_timeout(600)
    pg.evaluate("()=>{const b=document.querySelector('[data-setupgo=\"kb\"]'); if(b) b.click();}")
    pg.wait_for_timeout(900)

with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=EXE, args=["--no-sandbox"])
    pg = b.new_page(viewport={"width": 1400, "height": 1000})
    pg.on("pageerror", lambda e: errs.append(str(e)[:150]))
    open_kb(pg)

    print("1 · the pen, and what pressing it opens")
    ck("the office is offered the pen", pg.evaluate("()=>!!document.querySelector('[data-kbpen]')"))
    pg.evaluate("()=>{document.querySelector('[data-kbpen]').click();}"); pg.wait_for_timeout(700)
    n = pg.evaluate("()=>document.querySelectorAll('.kbed').length")
    g = pg.evaluate("()=>document.querySelectorAll('.kbadd').length")
    ck("every shipped question becomes an editable card", n >= 40, n)
    ck("every group carries its own add row", g >= 6, g)

    print("2 · the edit is DATA, and the read view speaks it")
    pg.evaluate("""()=>{const a=document.querySelector('[data-kba="report-a-figure"]');
        a.value='Tenant wording <img src=x onerror="window.__pwn=1"> here.';
        a.dispatchEvent(new Event('change',{bubbles:true}));}""")
    pg.wait_for_timeout(600)
    kb = pg.evaluate("()=>GROUP.kb && GROUP.kb.ov && GROUP.kb.ov['report-a-figure']")
    ck("pressing the control changes the data (§96)", bool(kb) and "Tenant wording" in kb["a"], kb)
    ck("the edited card wears its mark and its way back",
       pg.evaluate("""()=>{const c=document.querySelector('[data-kba="report-a-figure"]').closest('.kbed');
           return c.classList.contains('on') && !!c.querySelector('[data-kbreset]');}"""))
    pg.evaluate("()=>{document.querySelector('[data-kbpen]').click();}"); pg.wait_for_timeout(700)
    rd = pg.evaluate("""()=>{const r=document.getElementById('kb-r-report-a-figure');
        return { text: r.innerText.indexOf('Tenant wording') > -1,
                 img: !!r.querySelector('img'), pwn: !!window.__pwn };}""")
    ck("read mode shows the tenant's wording", rd["text"], rd)
    ck("and typed text renders as TEXT — no markup, no script (§43)",
       not rd["img"] and not rd["pwn"], rd)

    print("3 · an own question lives and dies whole")
    pg.evaluate("()=>{document.querySelector('[data-kbpen]').click();}"); pg.wait_for_timeout(700)
    pg.evaluate("()=>{document.querySelector('[data-kbadd]').click();}"); pg.wait_for_timeout(600)
    ck("the empty card just minted is on screen to type into (§45.2)",
       pg.evaluate("()=>!!document.querySelector('[data-kbq=\"kbx1\"]')"))
    pg.evaluate("""()=>{const q=document.querySelector('[data-kbq="kbx1"]'),
        a=document.querySelector('[data-kba="kbx1"]');
        q.value='An own question?'; a.value='An own answer.';
        a.dispatchEvent(new Event('change',{bubbles:true}));}""")
    pg.wait_for_timeout(600)
    pg.evaluate("()=>{document.querySelector('[data-kbpen]').click();}"); pg.wait_for_timeout(700)
    ck("it reads like any other entry",
       pg.evaluate("()=>{const r=document.getElementById('kb-r-kbx1'); return !!r && r.innerText.indexOf('An own answer.')>-1;}"))

    print("4 · the way back deletes, and the last key leaving deletes the blob (§50.6)")
    pg.evaluate("()=>{document.querySelector('[data-kbpen]').click();}"); pg.wait_for_timeout(700)
    pg.evaluate("()=>{document.querySelector('[data-kbreset=\"report-a-figure\"]').click();}"); pg.wait_for_timeout(500)
    pg.evaluate("()=>{document.querySelector('[data-kbdel=\"kbx1\"]').click();}"); pg.wait_for_timeout(500)
    ck("reset and remove leave the tenant byte-identical to never having touched it",
       pg.evaluate("()=>GROUP.kb === undefined"), pg.evaluate("()=>JSON.stringify(GROUP.kb||null)"))
    ck("and the shipped wording is back on the page",
       pg.evaluate("""()=>{const c=document.querySelector('[data-kba="report-a-figure"]');
           return c && c.value.indexOf('Performance') > -1;}"""))

    print("5 · no pen for somebody who is not the office (§94.2)")
    PERSON["role"] = ""; PERSON["key"] = "nobody"; PERSON["name"] = "No Role"
    pg2 = b.new_page(viewport={"width": 1400, "height": 1000})
    pg2.on("pageerror", lambda e: errs.append(str(e)[:150]))
    open_kb(pg2)
    onpage = pg2.evaluate("()=>({ pen: !!document.querySelector('[data-kbpen]'),"
                          " kb: !!document.querySelector('.kb-rec') })")
    ck("the page (if reachable at all) offers no pen", not onpage["pen"], onpage)
    pg2.close()

    ck("no console errors", not errs, errs[:3])
    b.close()

srv.shutdown()
print("\n" + ("ALL CLEAR" if bad == 0 else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
