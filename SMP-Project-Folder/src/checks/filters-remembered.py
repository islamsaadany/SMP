"""THE CHANGE LOG'S FILTERS COME BACK AS YOU LEFT THEM (§550).

qa-run: own-server — §316.1. The History page reads the log off the server, so
there is nothing to draw over file://; the stub here serves a fixed log and
RECORDS EVERY ASK, which is the half that matters — a screen that shows
"Nadia" while asking the server for everyone has remembered nothing.

Usability audit, heuristic 7: "no saved views, no default filters". The four
dropdowns went back to Everyone / Everywhere / Every kind / Today on every
visit, so somebody who checks one person's changes every Monday set all four
again every Monday.

WHAT IS ASSERTED, AND WHY EACH END MATTERS (§94.2):

  * BOTH ENDS OF REMEMBERING. After a full reload the four dropdowns read what
    they were left at AND the first ask to the server carries the same four.
    Either alone is the bug: the screen agreeing with nothing, or the server
    being asked for a slice nobody can see;
  * THE SEARCH BOX IS NOT REMEMBERED. The one judgement in §550: choosing a
    person and a window is a position you took, half a word left in a search
    box is not. Coming back to a page silently filtered by text you do not
    remember typing reads as a bug, so `q` is written nowhere and the box is
    empty on arrival;
  * A REMEMBERED FILTER NOBODY CAN SEE IS DROPPED. A saved person who has left
    the register matches no option, so the dropdown would read "Everyone" with
    nothing selected while the page went on asking for them. Asserted by
    planting a key that does not exist: the dropdown must read Everyone, the
    ask must carry no person, and the stored value must be GONE — not merely
    ignored this once;
  * AND AN EMPTY LIST PRUNES NOTHING. Before the state lands there are no
    people to compare against, and pruning then would throw away a good
    filter. Read out of the product's own code, because the only way to stage
    it in a browser is to stage the thing being measured.

Run: SMP_CHROME=... python3 qa-run.py checks/filters-remembered.py
SMP_HTML points it at another build, so it can be run against the build
before (§276: a broken build is made from the SOURCES).
"""
import datetime, json, os, pathlib, re, threading, http.server, socketserver, urllib.parse
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML_PATH = pathlib.Path(os.environ.get("SMP_HTML") or (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html"))
HTML = HTML_PATH.read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
GATE = b"<!doctype html><title>Sign in</title><h1 id='gate'>Sign in</h1>"

TODAY = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")
def _at(sec): return "%sT05:16:%02d.000Z" % (TODAY, sec)

# One row per person the filters will be pointed at, so a filtered ask has
# something to come back with. Shaped exactly as the real save path writes.
LOG = [
  {"id": 2, "at": _at(6), "person_key": "smo", "person_name": "Mohamed Essam",
   "kind": "unitPlan", "target": "mobile", "what": "the unit's plan",
   "rows_": {"count": 1, "moved": [{"id": "mobile-P1-M1", "to": "1%", "had": True,
                                    "from": "0.8%", "name": "Data duplicate rate",
                                    "field": "target"}]}},
  {"id": 1, "at": _at(5), "person_key": "own_mob", "person_name": "Mennah Farouk",
   "kind": "unitReporting", "target": "mobile", "what": "reported figures",
   "rows_": {"count": 1, "moved": [{"id": "mobile-P1-T1", "to": 60, "had": True,
                                    "from": 45, "name": "Clean and standardize customer and SKU base",
                                    "field": "actual"}]}},
]
SEEN = {"asks": []}
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x != "" else ""))


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def _s(self, c, b, t):
        self.send_response(c); self.send_header("Content-Type", t)
        self.send_header("Content-Length", str(len(b))); self.end_headers()
        self.wfile.write(b)

    def do_GET(self):
        if self.path.startswith("/api/state"):
            q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            if "log" in q:
                f = {k: q[k][0] for k in ("target", "person", "kind", "from", "to", "limit") if k in q}
                SEEN["asks"].append(f)
                rows = [r for r in LOG if (not f.get("target") or r["target"] == f["target"])
                        and (not f.get("person") or r["person_key"] == f["person"])
                        and (not f.get("kind") or r["kind"] == f["kind"])]
                self._s(200, json.dumps({"ok": True, "office": True, "log": rows}).encode(), "application/json")
                return
            if "since" in q:
                self._s(200, json.dumps({"ok": True, "changed": [], "now": _at(0)}).encode(), "application/json")
                return
            self._s(200, json.dumps({"ok": True, "state": SEED, "person": PERSON}).encode(), "application/json")
            return
        if self.path.startswith("/raya-trade"):
            self._s(200, HTML, "text/html; charset=utf-8"); return
        self._s(200, GATE, "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        self.rfile.read(n)
        self._s(200, b'{"ok":true}', "application/json")


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % srv.server_address[1]
INIT = ("try{sessionStorage.setItem('smp.tour.later','1');"
        "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")

print("\n§1 · what is written down, read out of the product's own code")
src = HTML_PATH.read_text(encoding="utf-8")
code = re.sub(r"/\*.*?\*/", " ", src, flags=re.S)
code = re.sub(r"(?m)^\s*//.*$", " ", code)
ck("the filters are written under one key, not four", code.count('"smp.hist.filters"') == 1,
   code.count('"smp.hist.filters"'))
ck("...and the pattern is the people table's own, not a second one (§47.1)",
   '"smp.people.columns"' in code)
kept = re.search(r"localStorage\.setItem\(FKEY,[^;]*?\}\)\)", code, re.S)
ck("(fixture) what gets written down was found to read", bool(kept), kept)
ck("...and the search text is not in it", bool(kept) and "q:" not in kept.group(0)
   and "q :" not in kept.group(0), kept.group(0)[:160] if kept else "")
ck("an empty list prunes nothing, so a good filter survives a cold start",
   "!F[p[0]] || !p[1].length) return" in code)
ck("...and the pruning runs BEFORE the first read, not after it",
   bool(re.search(r"function toolsHtml\(\)\{\s*prune\(\);", code)))


def open_history(pg):
    try: pg.click('button[title="Setup"]', timeout=2000)
    except Exception: pass
    pg.wait_for_timeout(400)
    pg.evaluate("()=>{const r=[...document.querySelectorAll('[data-setupgo]')]"
                ".find(x=>x.dataset.setupgo==='history'); if(r) r.click();}")
    pg.wait_for_timeout(1200)


def shown(pg):
    return pg.evaluate("""()=>{const o={};['person','target','kind','when'].forEach(k=>{
        const s=document.querySelector('[data-hist-f="'+k+'"]');
        o[k]=s?{v:s.value,label:(s.selectedOptions[0]||{}).text||null}:null;});
      const q=document.querySelector('[data-hist-q]');
      o.q=q?q.value:null; return o;}""")


def pick(pg, k, v):
    pg.select_option('[data-hist-f="%s"]' % k, v, timeout=2000)
    pg.wait_for_timeout(500)


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.add_init_script(INIT)
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL, wait_until="networkidle"); pg.wait_for_timeout(1800)
    ck("the platform hydrated", pg.evaluate("()=>SYNC.isLive()") is True)

    print("\n§2 · the four start where they always did, and can be set")
    open_history(pg)
    first = shown(pg)
    ck("a fresh browser opens on Everyone / Everywhere / Every kind / Today",
       first.get("person", {}).get("v") == "" and first.get("target", {}).get("v") == ""
       and first.get("kind", {}).get("v") == "" and first.get("when", {}).get("v") == "today", first)
    opts = pg.evaluate("""()=>{const o={};['person','target','kind'].forEach(k=>{
        const s=document.querySelector('[data-hist-f="'+k+'"]');
        o[k]=s?[...s.options].map(x=>x.value).filter(Boolean):[];}); return o;}""")
    ck("(fixture) there is a person, a place and a kind to choose",
       all(len(opts.get(k) or []) for k in ("person", "target", "kind")), opts)
    WANT = {"person": opts["person"][0], "target": opts["target"][0],
            "kind": opts["kind"][0], "when": "week"}
    for k in ("person", "target", "kind", "when"): pick(pg, k, WANT[k])
    SEEN["asks"] = []
    pg.wait_for_timeout(400)

    print("\n§3 · after a full reload, the screen AND the ask carry them back")
    pg.goto(URL, wait_until="networkidle"); pg.wait_for_timeout(1800)
    SEEN["asks"] = []
    open_history(pg)
    back = shown(pg)
    for k in ("person", "target", "kind", "when"):
        ck("%s came back as it was left" % k, (back.get(k) or {}).get("v") == WANT[k],
           ((back.get(k) or {}).get("v"), WANT[k]))
    ck("...and the dropdown SHOWS it, rather than reading Everyone over it",
       (back.get("person") or {}).get("label") not in (None, "", "Everyone"), back.get("person"))
    ask = SEEN["asks"][0] if SEEN["asks"] else {}
    ck("(fixture) the page asked the server", bool(ask), SEEN["asks"])
    ck("...for that person", ask.get("person") == WANT["person"], ask)
    ck("...in that place", ask.get("target") == WANT["target"], ask)
    ck("...of that kind", ask.get("kind") == WANT["kind"], ask)
    ck("...and over the window chosen, not today",
       bool(ask.get("from")) and ask["from"][:10] < TODAY, ask)

    print("\n§4 · the search box is not remembered")
    pg.fill("[data-hist-q]", "duplicate", timeout=2000); pg.wait_for_timeout(400)
    ck("(fixture) something was typed into it",
       pg.evaluate("()=>document.querySelector('[data-hist-q]').value") == "duplicate")
    ck("...and nothing of it was written down",
       "duplicate" not in (pg.evaluate("()=>localStorage.getItem('smp.hist.filters')") or ""),
       pg.evaluate("()=>localStorage.getItem('smp.hist.filters')"))
    pg.goto(URL, wait_until="networkidle"); pg.wait_for_timeout(1800)
    open_history(pg)
    ck("...so it is empty on arrival", shown(pg).get("q") == "", shown(pg))

    print("\n§5 · a remembered person who has left is dropped, not carried on with")
    pg.evaluate("""()=>localStorage.setItem('smp.hist.filters', JSON.stringify(
        { person:'nobody_at_all', target:'', kind:'', when:'today' }))""")
    pg.goto(URL, wait_until="networkidle"); pg.wait_for_timeout(1800)
    SEEN["asks"] = []
    open_history(pg)
    gone = shown(pg)
    ck("the dropdown reads Everyone", (gone.get("person") or {}).get("v") == ""
       and (gone.get("person") or {}).get("label") == "Everyone", gone.get("person"))
    ask = SEEN["asks"][0] if SEEN["asks"] else {}
    ck("...and the ask carries NO person, so the count is everyone's",
       bool(ask) and not ask.get("person"), ask)
    ck("...and it was forgotten, not merely ignored this once",
       (json.loads(pg.evaluate("()=>localStorage.getItem('smp.hist.filters')") or "{}")
        .get("person")) == "",
       pg.evaluate("()=>localStorage.getItem('smp.hist.filters')"))

    print("\n§6 · and the build is quiet")
    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n%d failure(s)" % bad)
raise SystemExit(1 if bad else 0)
