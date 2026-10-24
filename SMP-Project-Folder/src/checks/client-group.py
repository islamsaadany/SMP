"""THE CLIENT'S OWN PAGES ON THE RAIL (§623).

qa-run: own-server — Profile's Details, Brand and Modules read the client's
record from /api/platform, so this file serves it, and records what is saved.

Islam: *"for the client setup to have them as 3 section under the client on
the side rail rather than 3 pills … for the first pill suggest a better
structure of the page … different navigation elements at the top for basic
info, colors, and modules"*; of the mockup, *"go with your recommendations,
build it but for the colors we have more colors choice called what follows
from them they will be part of the brand tab right? forefront team keep it
under people & Access. key measures is not the default on the foundation, it
should be Key Objectives"*; and, with a picture of the real rail, *"noting
that you got the client settings wrong"* — so the rail is measured as the
client's own rail draws it (the `client` scope), never the offline copy's.

WHAT IS ASSERTED, EACH AT BOTH ENDS WHERE IT HAS TWO (§94.2):

  1 · THE CLIENT'S RAIL: The client first, Profile then The shape; People &
      access holds Forefront team and the register; the Official BU list is
      the organisation's, last.
  2 · PROFILE IN THREE TABS: Details (with archiving at its foot), Brand (the
      mark, the colours, what follows from them, whether it reads), Modules.
  3 · A TAB IS A PLACE: switching tab with a colour not applied asks, and
      Keep editing stays on Brand with the colour still waiting.
  4 · THE WORD IN THE BOX: a client-wide word left by Terminology shows IN the
      box, the product's own word is the hint, and clearing writes the
      product's word for the layer; with no client word the box is empty.
  5 · CAPABILITIES ONLY WHERE THERE IS ONE: the page is on the rail while a
      record exists and off it when none does (and no company pillar is one).
  6 · THE CAPS COLUMN ONLY WHERE A FUNCTION HOLDS ONE — the column and its
      line in the chooser, both ways.

Run: python3 qa-run.py checks/client-group.py
     SMP_BUILT=<another build> …   # prove it can fail (§276)
"""
import json, os, pathlib, threading, time, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = pathlib.Path(os.environ.get("SMP_BUILT") or
                    (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")).read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
SAVES, PLATFORM = [], []
bad = 0
errs = []


def ck(label, cond, detail=""):
    global bad
    if not cond:
        bad += 1
    print(("  ok      " if cond else "  FAIL    ") + label + ((" | " + str(detail)) if detail and not cond else ""))


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
        raw = self.rfile.read(n).decode("utf-8", "replace") or "{}"
        try:
            body = json.loads(raw)
        except Exception:
            body = {}
        if self.path.startswith("/api/platform"):
            if body.get("action") == "client":
                self._s(200, json.dumps({
                    "ok": True,
                    "client": {"key": "raya-trade", "name": "Raya Trade", "status": "active", "made_here": True,
                               "industry": "Retail", "size": "1000+", "notes": "", "mark": None,
                               "modules": ["strategy", "insights"]},
                    "team": [], "seats": [], "canEdit": True, "register": [], "office": [],
                    "shape": None, "holds": None, "goes": None, "canArchive": True, "canDelete": False,
                    "modules": ["strategy", "insights"],
                    "offer": [{"key": "strategy", "label": "Strategy", "note": "", "always": True},
                              {"key": "insights", "label": "Insights", "note": "The library"}]
                }).encode(), "application/json")
                return
            PLATFORM.append(body)
        if self.path.startswith("/api/state"):
            SAVES.append(raw)
        self._s(200, b'{"ok":true}', "application/json")


def ev(pg, js, default=None):
    try:
        return pg.evaluate(js)
    except Exception as e:
        errs.append("PROBE: " + str(e)[:160])
        return default


def click(pg, sel, wait=300):
    """Press through the page's own handler; a missing control reports, never waits (§215)."""
    ok = ev(pg, "()=>{const b=document.querySelector(%s); if(!b) return false; b.click(); return true;}" % json.dumps(sel), False)
    pg.wait_for_timeout(wait)
    return ok


def setup_go(pg, key, wait=900):
    ev(pg, "()=>{const r=document.querySelector('[data-setupgo=\"%s\"]'); if(r) r.click();}" % key)
    pg.wait_for_timeout(wait)


def box(pg):
    return ev(pg, """()=>{const a=document.querySelector('.askbox'); if(!a) return null;
      const r=a.getBoundingClientRect(); return {t:a.innerText.replace(/\\n/g,' | '), w:Math.round(r.width),
      top:Math.round(r.top), left:Math.round(r.left)};}""", None)


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % srv.server_address[1]

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or "/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    pg.goto(URL, wait_until="networkidle")
    pg.wait_for_timeout(1500)
    ck("the platform is live (a server answered)", ev(pg, "()=>SYNC.isLive()") is True)
    try:
        pg.click('button[title="Setup"]', timeout=2500)
    except Exception:
        errs.append("PROBE: no Setup button")
    pg.wait_for_timeout(300)

    # ── 1 · THE CLIENT'S RAIL ───────────────────────────────────────────
    print("\n1 · the client's own rail, as it draws")
    # The gear opens Strategy's rail; a client page asked for moves the scope
    # to the client's (§359.2: the page decides the rail) — as the client
    # settings link does.
    ev(pg, "()=>{current='setup'; currentSub='start'; document.documentElement.setAttribute('data-setup-scope','client'); paint();}")
    pg.wait_for_timeout(1500)
    rail = ev(pg, """()=>[...document.querySelectorAll('.setuprail .rgroup')].map(g=>g.dataset.railgrp+':'+
      [...document.querySelectorAll('.setuprail [data-railitems="'+g.dataset.railgrp+'"] .ritem')].map(r=>r.dataset.setupgo).join(','))""", [])
    ck("The client is first, Profile then The shape", bool(rail) and rail[0] == "client:start,shape", rail)
    ck("People & access holds Forefront team and the register", "who:team,people" in rail, rail)
    ck("the Official BU list is the organisation's, last", any(r.startswith("run:") and r.endswith(",mainbu") for r in rail), rail)
    ck("…and nothing else is on the client's rail", [r.split(":")[0] for r in rail] == ["client", "who", "run"], rail)

    # ── 2 · PROFILE IN THREE TABS ───────────────────────────────────────
    print("\n2 · Profile: Details, Brand, Modules")
    ck("the page is headed Profile", ev(pg, "()=>(document.querySelector('#panel .setupttl')||{}).textContent", "") == "Profile")
    tabs = ev(pg, "()=>[...document.querySelectorAll('.csetup [data-cstab]')].map(t=>t.dataset.cstab+(t.getAttribute('aria-selected')==='true'?'*':''))", [])
    ck("three tabs, Details open", tabs == ["details*", "brand", "modules"], tabs)
    ck("Details holds the name and the address, and archiving at its foot",
       ev(pg, """()=>{const c=document.querySelector('.csetup'); const a=c.querySelector('[data-archive]');
         return /The client.s name/i.test(c.innerText) && /Its address here/i.test(c.innerText) && !!a &&
           /No longer working with/.test(a.closest('.wzend').innerText) && !c.querySelector('[data-brand]') && !c.querySelector('[data-module]');}""", False))
    click(pg, ".csetup [data-cstab=brand]", 800)
    ck("Brand holds the mark and the two colours",
       ev(pg, "()=>!!document.querySelector('.csetup .wzmark') && document.querySelectorAll('.csetup [data-brand]').length===2", False))
    ev(pg, """()=>{const i=document.querySelector('.csetup [data-brand=accent]'); i.value='#1f6f8b';
      i.dispatchEvent(new Event('change',{bubbles:true}));}""")
    pg.wait_for_timeout(700)
    click(pg, "[data-applygo=brand]", 900)
    t = ev(pg, "()=>document.querySelector('.csetup .wzbrand').innerText", "") or ""
    ck("…and, once a colour is set, what follows from it and whether it reads (Islam: part of the Brand tab)",
       "What follows from them" in t and "Is it readable" in t, t[:200])
    ck("…the tab stays Brand after Apply", ev(pg, "()=>CLIENTSETUP.at()") == "brand", ev(pg, "()=>CLIENTSETUP.at()"))
    click(pg, ".csetup [data-cstab=modules]", 800)
    ck("Modules holds the modules, and the tab counts the ones on",
       ev(pg, "()=>document.querySelectorAll('.csetup [data-module]').length>0", False) and
       ev(pg, "()=>/\\d+ on/.test(document.querySelector('.csetup [data-cstab=modules]').textContent)", False))

    # ── 3 · A TAB IS A PLACE ────────────────────────────────────────────
    print("\n3 · switching tab with a colour not applied asks")
    click(pg, ".csetup [data-cstab=brand]", 800)
    ev(pg, """()=>{const i=document.querySelector('.csetup [data-brand=bar]'); i.value='#334455';
      i.dispatchEvent(new Event('change',{bubbles:true}));}""")
    pg.wait_for_timeout(700)
    click(pg, ".csetup [data-cstab=details]", 800)
    strip = ev(pg, "()=>(document.querySelector('.leavestrip')||{}).textContent||''", "")
    ck("the strip asks, naming what waits", "navigation bar" in strip, strip)
    ck("…and the page stays on Brand under it", ev(pg, "()=>CLIENTSETUP.at()") == "brand", ev(pg, "()=>CLIENTSETUP.at()"))
    click(pg, '.leavestrip [data-leave="stay"]', 500)
    ck("Keep editing keeps the colour waiting, on Brand",
       ev(pg, "()=>!document.querySelector('.leavestrip') && brandWaiting().length===1 && CLIENTSETUP.at()==='brand'", False))
    click(pg, "[data-applydrop=brand]", 500)

    # ── 4 · THE WORD IN THE BOX ─────────────────────────────────────────
    print("\n4 · a client-wide word shows in the box; the hint is the product's")
    setup_go(pg, "shape", 1500)
    click(pg, '.csetup [data-shlvl="bu"]', 800)
    BOX = "()=>{const i=document.querySelector('.csetup input[data-stlw=\"bu|keyobj|many\"]'); return i?[i.value,i.placeholder]:null;}"
    ck("with no word of the client's, the box is empty and the hint is Key Objectives", ev(pg, BOX) == ["", "Key Objectives"], ev(pg, BOX))
    ev(pg, "()=>{LABELS.entries.find(e=>e.key==='keyobj').bu='Key Measures'; paint();}")
    pg.wait_for_timeout(700)
    ck("a word left by Terminology shows IN the box, with the product's as the hint",
       ev(pg, BOX) == ["Key Measures", "Key Objectives"], ev(pg, BOX))
    ev(pg, """()=>{const i=document.querySelector('.csetup input[data-stlw="bu|keyobj|many"]'); i.value='';
      i.dispatchEvent(new Event('change',{bubbles:true}));}""")
    pg.wait_for_timeout(600)
    ck("clearing it writes the product's word for the layer, so the pages read Key Objectives",
       ev(pg, "()=>((SMPRules.structureOf(GROUP)||{}).bu||{}).words && SMPRules.structureOf(GROUP).bu.words.keyobj.many") == "Key Objectives" and
       ev(pg, "()=>SMPRules.layerWord(GROUP, UNIT_KEYS[0], 'keyobj', 'many')") == "Key Objectives",
       ev(pg, "()=>JSON.stringify(((SMPRules.structureOf(GROUP)||{}).bu||{}).words||null)"))
    ev(pg, "()=>{LABELS.entries.find(e=>e.key==='keyobj').bu='Key Objectives'; paint();}")

    # ── 5 · CAPABILITIES ONLY WHERE THERE IS ONE ────────────────────────
    print("\n5 · the Capabilities page only where it lists something")
    ck("(fixture) the worked example holds one capability record", ev(pg, "()=>GROUP.capabilities.length") == 1)
    ck("with one, the page is on the rail", ev(pg, "()=>!!document.querySelector('.setuprail [data-setupgo=caps]')", False))
    ev(pg, "()=>{window.__caps=GROUP.capabilities; GROUP.capabilities=[]; paint();}")
    pg.wait_for_timeout(500)
    ck("with none, and no company pillar that is one, it is off the rail",
       ev(pg, "()=>capsAsPillars().length===0 && !document.querySelector('.setuprail [data-setupgo=caps]')", False))
    ck("…and off the list the search and the landing read (one list, §53.5)",
       ev(pg, "()=>!setupDefsAll().some(d=>d.k==='caps')", False))
    ev(pg, "()=>{GROUP.capabilities=window.__caps; paint();}")
    pg.wait_for_timeout(400)

    # ── 6 · THE CAPS COLUMN ONLY WHERE A FUNCTION HOLDS ONE ─────────────
    print("\n6 · the Caps column only where a function holds a capability")
    setup_go(pg, "fns", 1500)
    HEAD = "()=>[...document.querySelectorAll('#panel table thead th')].map(t=>t.textContent.trim().replace(/\\s*[▲▼]$/,'')).filter(Boolean)"
    held = ev(pg, "()=>FUNCTION_KEYS.some(k=>capsOfFunction(k).length>0)", None)
    ck("(fixture) Marketing holds the worked example's one", held is True, held)
    ck("while one does, the column is drawn", any(h.upper().startswith("CAPS") for h in (ev(pg, HEAD, []) or [])), ev(pg, HEAD))
    ev(pg, "()=>{window.__fn=GROUP.capabilities.map(c=>c.fn); GROUP.capabilities.forEach(c=>{c.fn=null;}); paint();}")
    pg.wait_for_timeout(500)
    ck("with none held, the column is gone", not any(h.upper().startswith("CAPS") for h in (ev(pg, HEAD, []) or [])), ev(pg, HEAD))
    click(pg, "[data-fncolmenu]", 400)
    ck("…and so is its line in the column chooser",
       not ev(pg, "()=>!!document.querySelector('[data-fncol=caps]')", True))
    ev(pg, "()=>{GROUP.capabilities.forEach((c,i)=>{c.fn=window.__fn[i];}); paint();}")

    b.close()

ck("no page errors", not [e for e in errs if not e.startswith("PROBE")], errs[:3])
ck("every probe answered (§215)", not [e for e in errs if e.startswith("PROBE")], errs[:3])
print("\n%d failure%s" % (bad, "" if bad == 1 else "s"))
raise SystemExit(1 if bad else 0)
