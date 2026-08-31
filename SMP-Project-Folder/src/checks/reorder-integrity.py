"""A REORDER COMMIT ACCOUNTS FOR EVERY ROW EXACTLY ONCE (§118).

Islam: "the CF tab is not showing anything while it was showing it a minute
ago." The tab was fine; the PAGE could no longer be drawn. Reordering a
measure or tactic row with the pen on counted the "+ Add" row — a <tr> in the
same tbody with no data-oi — so the committed order carried a NaN, applyOrder
pushed arr[NaN] = undefined, and the autosave wrote it as null into the
pillars function's plan blob. From the next hydration on, every visit to that
function threw mid-paint and the click looked like it did nothing.

Four things, each asserted at BOTH ENDS (§94.2 — a reorder that no longer
poisons but also no longer reorders would pass every absence test):

  1. Reordering by keyboard and by pointer still REORDERS, and the list
     afterwards holds exactly the rows it held before — no null, no
     undefined, no change of length. On the plan tables (which carry the add
     row) and on the rail (which does not — the fix must not break the
     containers that were never broken).
  2. applyOrder refuses a commit that is not a permutation: too short, too
     long, out of range, duplicated — the array is untouched, never
     half-applied.
  3. The hydration door heals a plan a tenant already saved with a null in
     it: served over HTTP with a poisoned functions blob (the fault is
     invisible over file://, §94.11), the function's tab must open and its
     plan must draw.
  4. The tour is never offered to the office (§118, Islam: "stop it to the
     SMO") — and still offered to a custodian, or the fix would be
     indistinguishable from the tour being lost.

Proved able to fail first (§94.5): run with SMP_CHECK_FILE pointing at the
v3.36 build and sections 1 and 3 fail exactly as production did.
"""
import json, os, pathlib, threading, http.server, socketserver, copy
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML_PATH = pathlib.Path(os.environ.get(
    "SMP_CHECK_FILE",
    str(ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")))
URL = HTML_PATH.resolve().as_uri()
CHROME = os.environ.get("SMP_CHROME", "/opt/pw-browsers/chromium")

bad = 0
def ck(w, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""), flush=True)

# A pillars function with two of everything, so a swap is observable. Two
# pillars so the RAIL has two grips; the second pillar carries the tables
# under test.
SEED = r"""
FUNCTIONS['cfx'] = {name:"CFX", navName:null, codePrefix:"CFX", head:null, custodian:null,
  active:true, format:"pillars", clauses:[], aspiration:"Win", endInMind:"",
  keyObjectives:[], swot:{s:[],w:[],o:[],t:[]},
  items:[
    {id:"fn:cfx-P1", name:"First pillar", sub:"", kind:"Direction", theme:"", owner:"A",
     slide:"", notes:"", code:"CFX01",
     measures:[{id:"fn:cfx-P1-M1",name:"M one",dir:"≥",target:"10",compile:"Latest",actual:"",progress:null,slide:"",horizon:"",notes:""},
               {id:"fn:cfx-P1-M2",name:"M two",dir:"≥",target:"20",compile:"Latest",actual:"",progress:null,slide:"",horizon:"",notes:""}],
     tactics:[{id:"fn:cfx-P1-T1",name:"T one",description:"",outcome:"",owner:"A",collaborators:[],q1:1,q2:0,q3:0,q4:0,status:"Not started",actual:null,slide:"",notes:""},
              {id:"fn:cfx-P1-T2",name:"T two",description:"",outcome:"",owner:"B",collaborators:[],q1:0,q2:1,q3:0,q4:0,status:"Not started",actual:null,slide:"",notes:""}]},
    {id:"fn:cfx-P2", name:"Second pillar", sub:"", kind:"Direction", theme:"", owner:"B",
     slide:"", notes:"", code:"CFX02", measures:[], tactics:[]}
  ]};
FUNCTION_KEYS.push('cfx');
paint();
"""

LIST = ("(w) => FUNCTIONS['cfx'].items[0][w].map(" +
        "x => x === undefined ? '<<undefined>>' : (x === null ? '<<null>>' : x.id))")

def open_cfx(pg):
    fold = pg.query_selector('#units [data-fold="caps"]')
    if fold: fold.click(); pg.wait_for_timeout(200)
    pg.evaluate("document.querySelector('#units [data-u=\"fn:cfx\"]').click()")
    pg.wait_for_timeout(400)

def kbd_reorder(pg, kind):
    """ArrowDown on the FIRST grip of the given table — the same commit path a
    pointer drop uses, without the pointer flakiness."""
    pg.evaluate("""(kind) => {
      const g = document.querySelector('[data-kind="' + kind + '"] .grip');
      g.focus();
      g.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowDown', bubbles:true}));
    }""", kind)
    pg.wait_for_timeout(350)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox", "--disable-dev-shm-usage"])

    # ── 1 · the commit, on the live tables ────────────────────────────
    pg = b.new_page(viewport={"width": 1600, "height": 950})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e).split("\n")[0]))
    pg.goto(URL); pg.wait_for_timeout(1200)
    pg.evaluate(SEED); pg.wait_for_timeout(250)
    open_cfx(pg)
    pg.evaluate("document.querySelector('.penbtn').click()"); pg.wait_for_timeout(400)

    for kind in ("tactics", "measures"):
        before = pg.evaluate(LIST, kind)
        rows = pg.evaluate('(k) => document.querySelectorAll(\'[data-kind="\' + k + \'"] tr\').length', kind)
        ck("the %s tbody holds the add row beside the data rows" % kind, rows == 3, rows)
        kbd_reorder(pg, kind)
        after = pg.evaluate(LIST, kind)
        ck("keyboard reorder of %s reorders" % kind, after == [before[1], before[0]], after)
        ck("…and mints nothing (%s)" % kind, len(after) == 2 and "<<null>>" not in after
           and "<<undefined>>" not in after, after)

    # the pointer path — the road Islam actually took
    tb = pg.query_selector('[data-kind="tactics"] .grip')
    if tb:
        before = pg.evaluate(LIST, "tactics")
        src = tb.bounding_box()
        # Drop past the LAST data row's bottom, x past its midline, so place()
        # appends at the end whatever the row heights are — the drop point is
        # computed from the target row, never guessed in pixels.
        last = pg.query_selector('[data-kind="tactics"] tr[data-oi="1"]').bounding_box()
        pg.mouse.move(src["x"] + 5, src["y"] + 5)
        pg.mouse.down()
        pg.mouse.move(last["x"] + last["width"] * 0.8,
                      last["y"] + last["height"] + 6, steps=8)
        pg.mouse.up(); pg.wait_for_timeout(350)
        after = pg.evaluate(LIST, "tactics")
        ck("pointer drag of tactics reorders", after == [before[1], before[0]], after)
        ck("…and mints nothing (pointer)", len(after) == 2 and "<<null>>" not in after
           and "<<undefined>>" not in after, after)

    # the rail, which has no add row: the fix must not have silenced it
    before = pg.evaluate("FUNCTIONS['cfx'].items.map(p => p.id)")
    pg.evaluate("""() => {
      const g = document.querySelector('.rail [data-kind="pillars"] .grip');
      g.focus();
      g.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowDown', bubbles:true}));
    }"""); pg.wait_for_timeout(350)
    after = pg.evaluate("FUNCTIONS['cfx'].items.map(p => p.id)")
    ck("the rail's pillar reorder still works", after == [before[1], before[0]], after)

    ck("no page error during any reorder", not errs, errs)

    # ── 2 · applyOrder refuses a non-permutation ──────────────────────
    r = pg.evaluate("""() => {
      const mk = () => ["a","b","c"];
      const t = (order) => { const a = mk(); applyOrder(a, order); return a.join(""); };
      return {
        good: t([2,0,1]),
        short: t([1,0]), long: t([0,1,2,0]), nan: t([0,1,NaN]),
        range: t([0,1,9]), dupe: t([0,1,1])
      };
    }""")
    ck("applyOrder applies a real permutation", r["good"] == "cab", r)
    for k in ("short", "long", "nan", "range", "dupe"):
        ck("applyOrder refuses a %s commit, untouched" % k, r[k] == "abc", r[k])

    pg.close()

    # ── 3 · the hydration door heals a poisoned blob ──────────────────
    # Served over HTTP because file:// never hydrates (§94.11). The stored
    # state carries what a poisoned tenant actually holds: a null inside a
    # pillars function's tactics.
    BUILT = (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html").read_bytes() \
        if "SMP_CHECK_FILE" not in os.environ else HTML_PATH.read_bytes()
    STATE = copy.deepcopy(json.loads((ROOT / "db/seed-state.json").read_text()))
    fn = {"name": "CFX", "navName": None, "codePrefix": "CFX", "head": None, "custodian": None,
          "active": True, "format": "pillars", "clauses": [], "aspiration": "Win",
          "endInMind": "", "keyObjectives": [], "swot": {"s": [], "w": [], "o": [], "t": []},
          "items": [{"id": "fn:cfx-P1", "name": "First pillar", "sub": "", "kind": "Direction",
                     "theme": "", "owner": "A", "slide": "", "notes": "", "code": "CFX01",
                     "measures": [{"id": "fn:cfx-P1-M1", "name": "M one", "dir": "≥",
                                   "target": "10", "compile": "Latest", "actual": "",
                                   "progress": None, "slide": "", "horizon": "", "notes": ""}],
                     "tactics": [{"id": "fn:cfx-P1-T1", "name": "T one", "description": "",
                                  "outcome": "", "owner": "A", "collaborators": [],
                                  "q1": 1, "q2": 0, "q3": 0, "q4": 0, "status": "Not started",
                                  "actual": None, "slide": "", "notes": ""},
                                 None]}]}
    STATE.setdefault("functions", {})["cfx"] = fn
    STATE.setdefault("functionKeys", []).append("cfx")
    PERSON = {"key": "smo", "name": "SMO", "role": "super"}
    GATE = b"<!doctype html><title>Sign in</title><h1 id='gate'>Sign in</h1>"

    class H(http.server.BaseHTTPRequestHandler):
        def log_message(self, *a): pass
        def _send(self, code, body, ctype):
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        def do_GET(self):
            if self.path.startswith("/api/state"):
                body = json.dumps({"ok": True, "state": STATE, "person": PERSON}).encode()
                self._send(200, body, "application/json"); return
            if self.path.startswith("/raya-trade"):
                self._send(200, BUILT, "text/html; charset=utf-8"); return
            self._send(200, GATE, "text/html; charset=utf-8")
        def do_POST(self):
            n = int(self.headers.get("Content-Length") or 0)
            self.rfile.read(n)
            self._send(200, b'{"ok":true}', "application/json")

    srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
    srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = "http://127.0.0.1:%d" % srv.server_address[1]

    pg = b.new_page(viewport={"width": 1600, "height": 950})
    errs2 = []
    pg.on("pageerror", lambda e: errs2.append(str(e).split("\n")[0]))
    # A returning viewer: the tour's own session flag, same as boot-skeleton.py.
    # §167.2, in a fourth file. The welcome screen (§148) covers the viewport,
    # so every click lands on `.welcomeover` — this suppressed the TOUR and not
    # the welcome, and had been winning a race against it rather than avoiding
    # it. Suppressed as a RETURNING viewer has it, in an init script, and never
    # by reaching into the welcome screen, which has its own check.
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    pg.goto(base + "/raya-trade"); pg.wait_for_timeout(2500)
    healed = pg.evaluate("(FUNCTIONS['cfx'].items[0].tactics || []).map(x => x === null ? '<<null>>' : x.id)")
    ck("hydration healed the stored null", healed == ["fn:cfx-P1-T1"], healed)
    fold = pg.query_selector('#units [data-fold="caps"]')
    if fold: fold.click(); pg.wait_for_timeout(250)
    pg.evaluate("var x=document.querySelector('#units [data-u=\"fn:cfx\"]'); x && x.click()")
    pg.wait_for_timeout(500)
    ck("the poisoned function's tab opens", pg.evaluate("current") == "fn:cfx",
       pg.evaluate("current"))
    ck("…and its plan draws", "First pillar" in (pg.evaluate(
        "(document.getElementById('panel')||{textContent:''}).textContent") or ""), "")
    ck("no page error on the healed tenant", not errs2, errs2)
    srv.shutdown()
    pg.close()

    # ── 4 · the tour and the office ───────────────────────────────────
    pg = b.new_page(viewport={"width": 1600, "height": 950})
    pg.goto(URL); pg.wait_for_timeout(1200)
    r = pg.evaluate("""() => {
      const smo = PEOPLE.filter(p => p.key === 'smo')[0];
      const cust = PEOPLE.filter(p => TOUR.storyFor(p) === 'custodian')[0];
      return { smoStory: smo ? TOUR.storyFor(smo) : '<<no smo>>',
               smoRoles: smo ? personRoles(smo).map(r => r.role) : [],
               custodian: cust ? cust.key : null };
    }""")
    ck("the office is never offered the tour", r["smoStory"] is None, r)
    ck("…while a custodian still is (both ends, §94.2)", bool(r["custodian"]), r)
    pg.close()
    b.close()

print("reorder-integrity: %s" % ("PASS" if bad == 0 else "%d FAILURES" % bad))
raise SystemExit(1 if bad else 0)
