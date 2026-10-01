"""A console tab shows what it last showed, then catches up (§400.2).

Islam: "when I switch between the tabs of the platform like my work and clients
everytime it loads. saying it's loading." — and, of two answers, the one that is
always current: the kept copy is drawn AT ONCE and the tab reads again BEHIND it,
the fresh copy swapped in when the answer lands.

Every answer the stub gives carries a counter, so KEPT and FRESH are two
different words on the screen and the swap is visible rather than inferred
(§94.8). No database: the page is served as it is by both stacks (§94.11).

  §1  back to a tab: its kept copy is on screen at once, never "Reading…", the
      tab still ASKS, and the fresh answer replaces the kept one
  §2  a hand on the kept copy wins: typing into the kept search box stops the
      re-read, so the box and its filter are not swapped away (§35)
  §3  every other way in reads fresh — changing whose work you look at says
      "Reading…" as it always did (§369, §48.2)
  §4  a tab left mid-re-read does not write into the next one
  §5  a refresh starts clean: nothing is kept across a page load

Run:  SMP_CHROME=… python3 qa-run.py checks/tab-keep.py [--break=no-keep|no-refresh|no-hand]
      SMP_PAGE=smp-app/shell/platform.html …   # the new stack's copy
"""
import http.server, json, os, re, socketserver, sys, threading, time
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
REPO = os.path.abspath(os.path.join(ROOT, ".."))
BREAK = next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--break=")), "")


def pagePath():
    """WHERE THE PAGE IS, SAID RATHER THAN HANDED BACK AS A BROWSER ERROR.

    `SMP_PAGE` is documented relative to the REPOSITORY ROOT, and every
    browser check in this project is run through `qa-run.py`, which lives in
    `SMP-Project-Folder/src` (§320.6b) — so the spelling that is documented is
    relative to one directory and typed from another. Both are accepted: as
    given, then against the repo root.

    AND A PAGE THAT IS NOT THERE IS REFUSED BEFORE THE SERVER STARTS, never
    opened inside the request thread. That is §369.3's own fault one line
    over: a failure raised in the server thread kills only that thread, so the
    page is never served and the run comes back `ERR_EMPTY_RESPONSE`, naming
    neither the file nor the directory it was looked for in (§54.5, §123).
    """
    want = os.environ.get("SMP_PAGE")
    tries = [os.path.abspath(want), os.path.abspath(os.path.join(REPO, want))] if want \
        else [os.path.join(REPO, "platform.html")]
    tries = list(dict.fromkeys(tries))
    for p in tries:
        if os.path.isfile(p):
            return p
    sys.exit("the console page is not there — %s\n  tried: %s"
             % ("SMP_PAGE=%s" % want if want else "no platform.html at the repository root",
                "\n  tried: ".join(tries)))


PAGE = pagePath()
PORT = int(os.environ.get("SMP_CHECK_PORT", "3993"))
BREAKS = {
    "no-keep": [("var kept = fromTabRow ? KEPT[tab] : null;", "var kept = null;")],
    "no-refresh": [("    page = rv.next;\n    redraw();\n    ONLIST = tab;", "    ONLIST = tab; REVAL = null;")],
    "no-hand": [('    SHOWN.addEventListener(ev, revalStop, true);', '    void ev;')],
}
if BREAK and BREAK not in BREAKS:
    print("  unknown break: " + BREAK); sys.exit(1)
APPLIED = set()
def doctor(text):
    if not BREAK: return text
    for i, (old, new) in enumerate(BREAKS[BREAK]):
        if old in text:
            text = text.replace(old, new, 1); APPLIED.add(i)
    return text

fails = []
def check(what, ok, detail=""):
    if ok: print("  ok   " + what)
    else:
        print("  FAIL " + what + ("  — " + str(detail) if detail else "")); fails.append(what)

N = {"mywork": 0, "cards": 0}
HITS = []
LAG = 0.7

class Stub(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def _send(self, body, ctype):
        b = body.encode("utf-8")
        self.send_response(200); self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        p = self.path.split("?")[0]
        if p in ("/platform", "/"):
            with open(PAGE, encoding="utf-8") as f: self._send(doctor(f.read()), "text/html; charset=utf-8")
            return
        # the new stack's copy is GENERATED from this one with the script moved
        # to a file — walking one copy proves one copy (§53.5, A15)
        for name in ("platform-page.js", "memory-split.js", "client-setup.js"):
            if p == "/" + name:
                fp = os.path.join(REPO, "smp-app", "public", name)
                if os.path.exists(fp):
                    with open(fp, encoding="utf-8") as f:
                        # doctored too, or a break run against the generated
                        # copy applies to nothing and reports 0 red (§54.5)
                        body = f.read()
                        self._send(doctor(body) if name == "platform-page.js" else body,
                                   "application/javascript; charset=utf-8")
                else:
                    self._send("", "application/javascript; charset=utf-8")
                return
        # a row's address answers, so a press is a real navigation; anything
        # else 404s rather than the stub answering for the product (§100.3)
        if re.match(r"^/[a-z0-9][a-z0-9-]*/[a-z]+$", p):
            self._send("<!doctype html><title>opened</title>", "text/html; charset=utf-8"); return
        self.send_response(404); self.end_headers()
    def do_POST(self):
        n = int(self.headers.get("Content-Length", "0"))
        body = json.loads(self.rfile.read(n) or b"{}")
        act = body.get("action")
        HITS.append(act)
        time.sleep(LAG)
        if act == "me":
            out = {"ok": True, "account": {"email": "a@f.example", "name": "Admin", "isAdmin": True},
                   "access": {}, "mine": ["raya-trade"]}
        elif act == "cards":
            N["cards"] += 1
            out = {"ok": True, "canConsultants": True, "canAccess": True, "cards": [
                {"key": "raya-trade", "name": "Raya Trade", "industry": "Trade", "kind": "client",
                 "mark": None, "mine": True, "seat": "super", "state": "open", "canOpen": True,
                 "canConfig": True, "units": 10, "planned": True, "cycleOpen": True,
                 "unreadable": False, "modules": []},
                {"key": "rhi", "name": "RHI answer%d" % N["cards"], "industry": "Retail", "kind": "client",
                 "mark": None, "mine": True, "seat": "super", "state": "open", "canOpen": True,
                 "canConfig": True, "units": 3, "planned": True, "cycleOpen": False,
                 "unreadable": False, "modules": []}]}
        elif act == "mywork":
            N["mywork"] += 1
            out = {"ok": True, "people": [{"email": "a@f.example", "name": "Admin"}, {"email": "b@f.example", "name": "Bee"}],
                   "who": {"self": True}, "stats": {"open": 1, "late": 0, "dueWeek": 1, "clients": 1},
                   "unanswered": [], "rows": [{"bucket": "week", "client": "raya-trade", "clientName": "Raya Trade",
                   "title": "Action answer%d" % N["mywork"], "when": "This week", "late": False, "statusWord": "Open"}]}
        else:
            out = {"ok": True}
        self._send(json.dumps(out), "application/json")

class TS(socketserver.ThreadingMixIn, http.server.HTTPServer): daemon_threads = True
srv = TS(("127.0.0.1", PORT), Stub)
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % PORT

def text(pg): return pg.evaluate("() => document.getElementById('page').innerText")
def tab(pg, k): pg.click("#nav [data-tab='%s']" % k)
def wait_for(pg, needle, ms=6000):
    t = time.time()
    while time.time() - t < ms / 1000:
        if needle in text(pg): return True
        time.sleep(0.05)
    return False

with sync_playwright() as pw:
    br = pw.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = br.new_page(viewport={"width": 1440, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(BASE + "/platform")
    check("the console opens on My work with its first answer", wait_for(pg, "Action answer1"), text(pg)[:120])
    tab(pg, "clients")
    check("Clients arrives fresh the first time", wait_for(pg, "RHI answer"), text(pg)[:120])

    print("§1 · back to a tab: kept at once, then caught up")
    asked = HITS.count("mywork")
    tab(pg, "mywork")
    pg.wait_for_timeout(120)
    now = text(pg)
    check("the kept copy is on screen at once", "Action answer1" in now, now[:160])
    check("and it does not say it is reading", "Reading" not in now, now[:160])
    pg.wait_for_timeout(100)
    check("the tab still asks the server", HITS.count("mywork") == asked + 1, HITS)
    check("the fresh answer replaces the kept one", wait_for(pg, "Action answer2"), text(pg)[:160])
    check("and the kept one is gone, not beside it", "Action answer1" not in text(pg), text(pg)[:160])

    print("§2 · a hand on the kept copy wins")
    tab(pg, "clients")
    pg.wait_for_timeout(120)
    kept = text(pg)
    check("Clients comes back kept", "RHI answer" in kept and "Reading" not in kept, kept[:160])
    pg.click("#page input.fld"); pg.keyboard.type("raya")
    pg.wait_for_timeout(int(LAG * 1000) + 800)
    v = pg.evaluate("() => { const i = document.querySelector('#page input.fld'); return i ? i.value : null; }")
    check("the search box being typed into is not swapped away", v == "raya", v)
    hidden = pg.evaluate("() => [...document.querySelectorAll('.ccard[data-name]')].filter(c => c.hidden).map(c => c.dataset.name)")
    check("and its filter still works on the kept cards", any("rhi" in h for h in hidden), hidden)

    print("§3 · every other way in reads fresh")
    tab(pg, "mywork"); wait_for(pg, "Action answer")
    pg.wait_for_timeout(int(LAG * 1000) + 300)
    pg.select_option("select[data-workwho]", "b@f.example")
    pg.wait_for_timeout(100)
    check("changing whose work you look at says Reading, as before", "Reading your actions" in text(pg), text(pg)[:120])
    wait_for(pg, "Action answer")

    print("§4 · a tab left mid-re-read does not write into the next")
    pg.wait_for_timeout(int(LAG * 1000) + 300)
    tab(pg, "clients"); pg.wait_for_timeout(60); tab(pg, "mywork")
    pg.wait_for_timeout(int(LAG * 1000) * 2 + 500)
    t4 = text(pg)
    check("My work is on screen, not the clients' late answer", "Action answer" in t4 and "RHI answer" not in t4, t4[:160])

    print("§5 · a refresh starts clean")
    pg.reload(); wait_for(pg, "Action answer")
    tab(pg, "clients"); pg.wait_for_timeout(120)
    check("after a reload Clients reads fresh, nothing kept", "Reading your clients" in text(pg) or not "RHI" in text(pg), text(pg)[:120])

    check("no page errors", not errs, errs)
    br.close()

if BREAK:
    missed = [i for i in range(len(BREAKS[BREAK])) if i not in APPLIED]
    if missed: print("  break %s did not land: %s" % (BREAK, missed)); sys.exit(2)
print(("%d FAILED" % len(fails)) if fails else "tab-keep: all good")
sys.exit(1 if fails else 0)
