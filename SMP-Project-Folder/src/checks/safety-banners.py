"""THE PAGE WARNS BEFORE A SAVE CAN BE LOST (§258).

Islam, after a reporting round in which people lost work twice over: *"can we
have some sort of mid page warning like the error and network issue in case
the person is saving with someone opening the same thing … with clear action
so we can know what to do?"*

Two cautions in the banner slot the refusal already uses (§32, §171):

  1 · A NEWER VERSION IS READY — a tab still running the build from before a
      save-protocol fix is the shape of the live incident (§216/§234, and
      migration 040's reason). The service worker claims its clients on
      activate, so an open tab hears of a deploy through `controllerchange`.
  2 · SOMEBODY ELSE UPDATED THIS PAGE — `change_log` already holds who landed
      what and when (§42); the tab asks about its own page and names them.

WHAT IS ASSERTED IS THE PROBLEM, NOT THE WORDING (§94.8):

  * the tab ASKS the server about its page, scoped to that page and to the
    moment it loaded — a peek that asks about everything is noise;
  * a landing by somebody else draws the caution and NAMES them;
  * the same landing is never announced twice; a newer one is;
  * Dismiss hides it; "Reload & keep mine" FLUSHES this tab's own change
    FIRST and reloads only when it landed (§210 lays it over theirs);
  * a flush that fails does NOT reload — the failure banner (§171) is left
    standing, because reloading over it would discard the explanation;
  * the version caution offers Reload and outranks the edit caution;
  * the listener for a new worker is armed over HTTP;
  * and over `file://` nothing is drawn and nothing is asked (§94.11 — there
    is no server to be stale against).

OVER HTTP WITH A STUB, because none of this exists over `file://`; the stub
records every peek so "it asked" is a measurement and not an inference.

Run: SMP_CHROME=... python3 qa-run.py checks/safety-banners.py
"""
import json, os, pathlib, threading, http.server, socketserver, urllib.parse
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
# SMP_HTML points the check at another build — how it is proved able to fail
# against the file shipped before §258 (§94.5).
HTML_PATH = pathlib.Path(os.environ.get("SMP_HTML") or
                         (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html"))
HTML = HTML_PATH.read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
GATE = b"<!doctype html><title>Sign in</title><h1 id='gate'>Sign in</h1>"

# What the stub answers a peek with, and what it saw. Changed mid-run.
PEEK = {"changed": []}
SEEN = {"peeks": [], "loads": 0, "posts": 0, "post_status": 200}
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


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
            q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            if "since" in q:
                SEEN["peeks"].append({"since": q["since"][0], "target": q.get("target", [""])[0]})
                self._s(200, json.dumps({"ok": True, "changed": PEEK["changed"]}).encode(),
                        "application/json")
                return
            self._s(200, json.dumps({"ok": True, "state": SEED, "person": PERSON}).encode(),
                    "application/json")
            return
        if self.path.startswith("/raya-trade"):
            SEEN["loads"] += 1
            self._s(200, HTML, "text/html; charset=utf-8")
            return
        self._s(200, GATE, "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        self.rfile.read(n)
        if not self.path.startswith("/api/state"):
            self._s(200, b'{"ok":true}', "application/json")
            return
        SEEN["posts"] += 1
        if SEEN["post_status"] != 200:
            self._s(SEEN["post_status"], b'{"ok":false,"error":"boom"}', "application/json")
            return
        self._s(200, b'{"ok":true,"wrote":"full"}', "application/json")


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % PORT
FILE_URL = "file://" + str(HTML_PATH)
INIT = ("try{sessionStorage.setItem('smp.tour.later','1');"
        "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")


def banner(pg):
    return pg.evaluate("""() => {
      const e = document.getElementById('safety');
      return (e && !e.hidden) ? e.textContent.replace(/\\s+/g,' ').trim() : ""; }""")


def refused(pg):
    return pg.evaluate("""() => {
      const e = document.getElementById('refused');
      return (e && !e.hidden) ? e.textContent.replace(/\\s+/g,' ').trim() : ""; }""")


def press(pg, sel):
    """Press if it is there; a control that is absent is reported by the
       assertion after it, never by a 30s timeout (§215)."""
    try:
        pg.click(sel, timeout=2000)
        return True
    except Exception:
        return False


def last_since():
    return SEEN["peeks"][-1]["since"] if SEEN["peeks"] else None


def peek(pg):
    pg.evaluate("()=>typeof SAFETY!=='undefined'&&SAFETY.peek()")
    pg.wait_for_timeout(600)


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.add_init_script(INIT)
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL, wait_until="networkidle")
    pg.wait_for_timeout(1800)
    ck("the platform hydrated", pg.evaluate("()=>SYNC.isLive()") is True)
    ck("the slot is mounted beside the refusal's",
       pg.evaluate("()=>{const s=document.getElementById('safety');"
                   "return !!s && s.hidden && s.previousElementSibling"
                   " && s.previousElementSibling.id==='refused';}"))
    ck("nothing is drawn on a page nobody else has touched", banner(pg) == "", banner(pg))

    # ── 1 · THE TAB ASKS ABOUT ITS OWN PAGE ──────────────────────────────
    print("\n1 · the tab asks the server about the page it is on")
    n0 = len(SEEN["peeks"])
    peek(pg)
    ck("a peek reached the server", len(SEEN["peeks"]) == n0 + 1, len(SEEN["peeks"]) - n0)
    q = SEEN["peeks"][-1] if SEEN["peeks"] else {}
    here = pg.evaluate("()=>TARGET")
    ck("...scoped to the page's own target", q.get("target") == here, (q.get("target"), here))
    # SINCE THE TAB LOADED, never since the dawn of time: a peek that asks
    # about everything would announce last week's work as news.
    ck("...and since the tab loaded", bool(q.get("since")) and q["since"].endswith("Z"), q.get("since"))
    ck("nothing drawn when nobody landed anything", banner(pg) == "", banner(pg))

    # ── 2 · SOMEBODY ELSE LANDED A CHANGE ────────────────────────────────
    print("\n2 · somebody else updated this page")
    PEEK["changed"] = [{"by": "Hala Ibrahim", "at": "2026-09-02T10:00:00.000Z"}]
    peek(pg)
    said = banner(pg)
    ck("the caution is drawn", said != "", "(nothing)")
    ck("...and NAMES who", "Hala Ibrahim" in said, said)
    ck("...with the two ways out",
       pg.evaluate("()=>!!document.querySelector('#safety [data-safety-keep]')"
                   " && !!document.querySelector('#safety [data-safety-dismiss]')"))
    # THE NEXT PEEK ASKS ONLY ABOUT WHAT IS NEWER (§35: the same fact is not
    # news twice).
    peek(pg)
    ck("the next peek asks from that landing onward",
       last_since() == "2026-09-02T10:00:00.000Z", last_since())

    # ── 3 · DISMISS, AND A NEWER LANDING RETURNS IT ──────────────────────
    print("\n3 · dismiss hides it; a newer landing brings it back")
    press(pg, "#safety [data-safety-dismiss]")
    pg.wait_for_timeout(200)
    ck("Dismiss hides the caution", banner(pg) == "", banner(pg))
    peek(pg)
    ck("the SAME landing is not announced again", banner(pg) == "", banner(pg))
    PEEK["changed"] = [{"by": "Karim Fahmy", "at": "2026-09-02T10:05:00.000Z"}]
    peek(pg)
    ck("a NEWER landing by somebody else is", "Karim Fahmy" in banner(pg), banner(pg) or "(nothing)")

    # ── 4 · RELOAD & KEEP MINE FLUSHES FIRST ─────────────────────────────
    print("\n4 · Reload & keep mine sends this tab's change before reloading")
    loads0, posts0 = SEEN["loads"], SEEN["posts"]
    # A real pending change through the real path (paint → afterPaint).
    pg.evaluate("GROUP.org = 'mine-1'; paint();")
    pg.wait_for_timeout(50)
    press(pg, "#safety [data-safety-keep]")
    pg.wait_for_load_state("networkidle")
    pg.wait_for_timeout(1500)
    ck("the page reloaded", SEEN["loads"] == loads0 + 1, SEEN["loads"] - loads0)
    ck("...and this tab's change was POSTed first", SEEN["posts"] >= posts0 + 1, SEEN["posts"] - posts0)
    ck("the reloaded page hydrated", pg.evaluate("()=>SYNC.isLive()") is True)
    ck("...and draws nothing until told", banner(pg) == "", banner(pg))

    # ── 5 · A FLUSH THAT FAILS DOES NOT RELOAD ───────────────────────────
    # Reloading over §171's banner would throw away the one explanation.
    print("\n5 · a failed flush stays on the page")
    PEEK["changed"] = [{"by": "Hala Ibrahim", "at": "2026-09-02T11:00:00.000Z"}]
    peek(pg)
    ck("the caution is back on the fresh tab", "Hala Ibrahim" in banner(pg), banner(pg) or "(nothing)")
    SEEN["post_status"] = 500
    loads0 = SEEN["loads"]
    pg.evaluate("GROUP.org = 'mine-2'; paint();")
    pg.wait_for_timeout(50)
    press(pg, "#safety [data-safety-keep]")
    pg.wait_for_timeout(2500)
    ck("no reload happened", SEEN["loads"] == loads0, SEEN["loads"] - loads0)
    ck("the failure is said in its own banner (§171)", "Not saved" in refused(pg), refused(pg) or "(nothing)")
    ck("the caution keeps its control live",
       pg.evaluate("()=>{const k=document.querySelector('#safety [data-safety-keep]');"
                   "return !!k && !k.disabled;}"))
    SEEN["post_status"] = 200

    # ── 6 · A NEWER VERSION IS READY ─────────────────────────────────────
    print("\n6 · a newer version of the platform")
    ck("the worker listener is armed over HTTP", pg.evaluate("()=>typeof SAFETY!=='undefined'&&SAFETY.isArmed()") is True)
    # A stub cannot install a worker, so the same function `controllerchange`
    # calls is called by name — what is under test is what it draws.
    pg.evaluate("()=>typeof SAFETY!=='undefined'&&SAFETY.newVersion()")
    said = banner(pg)
    ck("the version caution replaces the edit one", "newer version" in said.lower(), said)
    ck("...and says the work is safe", "safe" in said.lower(), said)
    ck("...with one way out: Reload",
       pg.evaluate("()=>!!document.querySelector('#safety [data-safety-reload]')"
                   " && !document.querySelector('#safety [data-safety-keep]')"))
    PEEK["changed"] = [{"by": "Karim Fahmy", "at": "2026-09-02T12:00:00.000Z"}]
    peek(pg)
    ck("an edit landing does not displace it", "newer version" in banner(pg).lower(), banner(pg))
    loads0 = SEEN["loads"]
    press(pg, "#safety [data-safety-reload]")
    pg.wait_for_load_state("networkidle")
    pg.wait_for_timeout(1200)
    ck("Reload reloads", SEEN["loads"] == loads0 + 1, SEEN["loads"] - loads0)

    # ── 7 · CONTRAST, THE SWEEP'S OWN ARITHMETIC (§95) ───────────────────
    print("\n7 · the caution is readable in both themes")
    PEEK["changed"] = [{"by": "Hala Ibrahim", "at": "2026-09-02T13:00:00.000Z"}]
    peek(pg)
    for theme in ("light", "dark"):
        pg.evaluate("t=>{document.documentElement.dataset.theme=t}", theme)
        pg.wait_for_timeout(100)
        r = pg.evaluate("""() => {
          const lum = c => { const m=c.match(/[\\d.]+/g).map(Number);
            const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};
            return .2126*f(m[0])+.7152*f(m[1])+.0722*f(m[2]); };
          const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
          const s=document.getElementById('safety'); if(!s) return null; const bg=getComputedStyle(s).backgroundColor;
          const out=[];
          for (const el of s.querySelectorAll('strong,span,button')) {
            const cs=getComputedStyle(el);
            const g = el.tagName==='BUTTON' && cs.backgroundColor!=='rgba(0, 0, 0, 0)' ? cs.backgroundColor : bg;
            out.push([el.tagName, +ratio(cs.color,g).toFixed(2)]);
          }
          return out; }""")
        low = [x for x in r if x[1] < 4.5] if r else [["no caution drawn", 0]]
        ck("%s: every word on the caution is ≥ 4.5:1" % theme, not low, low or r)
    pg.evaluate("()=>{delete document.documentElement.dataset.theme}")

    ck("no page errors", not errs, errs[:3])

    # ── 8 · AND `file://` DRAWS NOTHING, ASKS NOTHING ────────────────────
    print("\n8 · no server behind the page")
    pg2 = b.new_page(viewport={"width": 1440, "height": 900})
    pg2.add_init_script(INIT)
    n0 = len(SEEN["peeks"])
    pg2.goto(FILE_URL, wait_until="networkidle")
    pg2.wait_for_timeout(2200)
    pg2.evaluate("()=>typeof SAFETY!=='undefined'&&SAFETY.peek()")
    pg2.evaluate("()=>typeof SAFETY!=='undefined'&&SAFETY.edited('Nobody','2026-09-02T00:00:00Z')")
    pg2.wait_for_timeout(300)
    ck("no slot is mounted", pg2.evaluate("()=>!document.getElementById('safety')"))
    ck("nothing is drawn even when asked", pg2.evaluate("()=>!document.getElementById('safety')"))
    ck("the worker listener is not armed", pg2.evaluate("()=>typeof SAFETY!=='undefined'&&SAFETY.isArmed()") is False)
    ck("no peek was sent", len(SEEN["peeks"]) == n0, len(SEEN["peeks"]) - n0)
    pg2.close()
    b.close()

print("\n%s" % ("ALL GREEN" if not bad else "%d FAIL" % bad))
raise SystemExit(1 if bad else 0)
