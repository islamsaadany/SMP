"""THE COLOURS ON CLIENT SET-UP WRITE ON A SERVED PLATFORM (§600), ON APPLY (§608).

qa-run: own-server — the fault only exists where there is a server. The
first step of Client set-up draws the two colour controls and the shell's
wire() binds them; a moment later the client's record lands from
`/api/platform` and the step is drawn again. Over file:// there is no record
to wait for, so `checks/client-setup.py` §3 — which presses the same control
— was green the whole time the served page was not.

Islam, of the page: *"when I change something in the clients setting like
color it doesn't change and I have no save button somewhere."* There is no
save button on purpose (the graph autosaves, §39); the change never reached
the graph, because the redraw put back pickers wired to nothing (§96).

WHAT IS ASSERTED IS THE PROBLEM (§94.8):

  * THE LATE DRAW HAPPENED. The stub answers the record after a delay and
    the accent picker drawn BEFORE it is marked; after it lands the mark must
    be gone. Without this a build that never redrew would pass every line
    below and prove nothing (§113.8).
  * THE PICKER, THE HEX FIELD AND CLEAR are wired: a pick is held and the
    row under the colours says so (§608: nothing is written, worn or sent
    before Apply); Apply writes `branding()` and the page wears it; Discard
    leaves it as it was.
  * THE SAVE CARRIES IT. What the stub RECEIVED on /api/state is read, never
    what the page drew (§96).

EVERY PROBE DEGRADES (§215).

Run: python3 qa-run.py checks/brand-served.py
     SMP_BUILT=<another build> …   # prove it can fail (§276)
"""
import json, os, pathlib, threading, time, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = pathlib.Path(os.environ.get("SMP_BUILT") or
                    (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")).read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
LATE = 0.8            # seconds the record takes, so the first draw is wired before it lands
SAVES = []
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
        if self.path.startswith("/api/platform") and body.get("action") == "client":
            time.sleep(LATE)
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
        if self.path.startswith("/api/state"):
            SAVES.append(raw)
        self._s(200, b'{"ok":true}', "application/json")


def ev(pg, js, default=None):
    try:
        return pg.evaluate(js)
    except Exception as e:
        errs.append("PROBE: " + str(e)[:160])
        return default


def put(pg, sel, value):
    """Set a control's value and fire `change`, as a closed picker or a field left does."""
    return ev(pg, """()=>{const i=document.querySelector(%s); if(!i) return 'no control';
      i.value=%s; i.dispatchEvent(new Event('change',{bubbles:true})); return 'set';}"""
              % (json.dumps(sel), json.dumps(value)), "probe")


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

    print("\n1 · the first step is drawn, and drawn again when the record lands")
    ck("the platform is live (a server answered)", ev(pg, "()=>SYNC.isLive()") is True)
    try:
        pg.click('button[title="Setup"]', timeout=2500)
    except Exception:
        errs.append("PROBE: no Setup button")
    pg.wait_for_timeout(300)
    ev(pg, "()=>{const r=document.querySelector('[data-setupgo=start]'); if(r) r.click();}")
    pg.wait_for_timeout(150)
    marked = ev(pg, "()=>{const i=document.querySelector('.csetup [data-brand=accent]');"
                    "if(!i) return false; i.__beforeRecord=1; return true;}", False)
    ck("the colour controls are on the step before the record lands", marked)
    pg.wait_for_timeout(int(LATE * 1000) + 900)
    ck("…and the record landed and redrew the step (the case this file is about)",
       ev(pg, "()=>{const i=document.querySelector('.csetup [data-brand=accent]');"
              "return !!i && !i.__beforeRecord && !!document.querySelector('.csetup [data-doormark]');}", False))

    print("\n2 · the controls the redraw left are wired — and a pick WAITS for Apply (§608)")
    before = ev(pg, "()=>branding().accent")
    gold0 = (ev(pg, "()=>getComputedStyle(document.documentElement).getPropertyValue('--gold')", "") or "").strip().upper()
    picked = put(pg, ".csetup [data-brand=accent]", "#123456") == "set"
    pg.wait_for_timeout(300)
    ck("…a picked accent is HELD: the row under the colours says it waits (the wiring §600 restored)",
       picked and "not applied yet" in (ev(pg, "()=>(document.querySelector('[data-applyrow=brand]')||{}).textContent", "") or ""),
       ev(pg, "()=>(document.querySelector('[data-applyrow=brand]')||{}).textContent"))
    ck("…and nothing is written before Apply (§608: the colour shouldn't change before apply)",
       ev(pg, "()=>branding().accent") == before, ev(pg, "()=>branding().accent"))
    ck("…nor worn by the page",
       (ev(pg, "()=>getComputedStyle(document.documentElement).getPropertyValue('--gold')", "") or "").strip().upper() == gold0)
    ck("…while the hex field beside it shows the pick",
       (ev(pg, "()=>(document.querySelector('.csetup [data-brandhex=accent]')||{}).value", "") or "").upper() == "#123456")
    ck("…and nothing waiting reached the server", not any("#123456" in s for s in SAVES), "%d saves" % len(SAVES))
    ev(pg, "()=>{const a=document.querySelector('[data-applygo=brand]'); if(a) a.click();}")
    pg.wait_for_timeout(500)
    ck("Apply WRITES the tenant's branding (§96)", ev(pg, "()=>branding().accent") == "#123456",
       ev(pg, "()=>branding().accent"))
    ck("…and the page wears it",
       (ev(pg, "()=>getComputedStyle(document.documentElement).getPropertyValue('--gold')", "") or "").strip().upper() == "#123456")
    ck("…and the row says Applied, with Undo",
       ev(pg, "()=>{const r=document.querySelector('[data-applyrow=brand]'); return !!r && /Applied/.test(r.textContent) && !!r.querySelector('[data-applyundo]');}", False))
    bar_set = put(pg, ".csetup [data-brandhex=bar]", "#654321") == "set"
    pg.wait_for_timeout(300)
    ev(pg, "()=>{const a=document.querySelector('[data-applygo=brand]'); if(a) a.click();}")
    pg.wait_for_timeout(400)
    bar_set = bar_set and ev(pg, "()=>branding().bar") == "#654321"
    ck("a typed bar colour applies too", bar_set, ev(pg, "()=>branding().bar"))
    ev(pg, "()=>{const c=document.querySelector('.csetup [data-brandclear=bar]'); if(c) c.click();}")
    pg.wait_for_timeout(300)
    ck("…Clear waits like any other change", bar_set and ev(pg, "()=>branding().bar") == "#654321",
       ev(pg, "()=>branding().bar"))
    ev(pg, "()=>{const a=document.querySelector('[data-applydrop=brand]'); if(a) a.click();}")
    pg.wait_for_timeout(300)
    ck("…and Discard leaves it as it was", bar_set and ev(pg, "()=>branding().bar") == "#654321"
       and not ev(pg, "()=>!!document.querySelector('[data-applygo=brand]')", True))

    print("\n3 · the save carries what was applied — there is no save button to press")
    pg.wait_for_timeout(3500)
    ck("a save reached the server carrying the new accent", any("#123456" in s for s in SAVES),
       "%d saves" % len(SAVES))

    # put back (§94.2)
    ev(pg, "()=>{branding().accent=%s; branding().bar=null; applyBrand(); paint();}" % json.dumps(before))
    b.close()

ck("no page errors", not [e for e in errs if not e.startswith("PROBE")], errs[:3])
ck("every probe answered (§215)", not [e for e in errs if e.startswith("PROBE")], errs[:3])
print("\n%d failure%s" % (bad, "" if bad == 1 else "s"))
raise SystemExit(1 if bad else 0)
