"""HISTORY: WHO CHANGED WHAT, AND A WAY BACK (§262).

Islam: *"how about a history saving and recovery feature to track the changes
per user and per unit and function to ensure nothing is lost?"* — agreed from
a mockup drawn out of real log rows.

WHAT IS ASSERTED IS THE PROBLEM, NOT THE LAYOUT (§94.8):

  * the page is in the Setup rail for the office over HTTP, and nowhere over
    file:// (there is no log to read, §94.11);
  * it ASKS the server for a slice — never the graph — and every filter
    changes what is asked, read off the stub's own record;
  * one line per changed FIELD, each carrying who, when, where, the row, the
    field, and the value before and after;
  * the search filters in place and never repaints (§35);
  * a row that cannot be put back says why on a greyed control (§61), and a
    row that can opens a confirmation naming what goes back to what;
  * "Put it back" writes the OLD value into the live graph — read off the
    DATA — and a save is scheduled (a POST reaches the stub);
  * the unit's own page carries the last change and a door, and the door
    opens the same table scoped to that unit; a custodian (no Setup) still
    gets the line and the door.

OVER HTTP WITH A STUB whose log rows were produced by the REAL save path
(scripts/test-history-read.js drives the same shapes against Postgres).

Run: SMP_CHROME=... python3 qa-run.py checks/history-page.py
"""
import json, os, pathlib, threading, http.server, socketserver, urllib.parse
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML_PATH = pathlib.Path(os.environ.get("SMP_HTML") or (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html"))
HTML = HTML_PATH.read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
GATE = b"<!doctype html><title>Sign in</title><h1 id='gate'>Sign in</h1>"

# Rows in the exact shape the real save path writes (see scripts/test-history-read.js).
LOG = [
  {"id": 6, "at": "2026-09-03T05:16:06.000Z", "person_key": "smo", "person_name": "Mohamed Essam", "kind": "unitPlan", "target": "mobile", "what": "the unit's plan",
   "rows_": {"count": 1, "moved": [{"id": "mobile-P1-T2", "to": [False, True, True, False], "had": False, "from": None, "name": "End-to-end order-to-cash digitization", "field": "quarters"}]}},
  {"id": 5, "at": "2026-09-03T05:16:06.000Z", "person_key": "smo", "person_name": "Mohamed Essam", "kind": "unitPlan", "target": "retailstores", "what": "the unit's plan",
   "rows_": {"count": 1, "moved": [{"id": "retailstores-P2-M1", "to": "Latest", "had": True, "from": "Sum", "name": "E-store revenue", "field": "compile"}]}},
  {"id": 4, "at": "2026-09-03T05:16:06.000Z", "person_key": "fn_mkt", "person_name": "Yara Kamal", "kind": "capReporting", "target": "fn:marketing", "what": "project milestones",
   "rows_": {"count": 1, "moved": [{"id": "cap4-P1-M1", "to": 100, "had": False, "from": None, "name": "Perception study fielded", "field": "pct"}]}},
  {"id": 3, "at": "2026-09-03T05:16:05.000Z", "person_key": "mobhead", "person_name": "Ashraf Laithy", "kind": "reportState", "target": "mobile", "what": "submitting the report", "rows_": None},
  {"id": 2, "at": "2026-09-03T05:16:05.000Z", "person_key": "own_mob", "person_name": "Mennah Farouk", "kind": "unitReporting", "target": "mobile", "what": "reported figures",
   "rows_": {"count": 2, "moved": [{"id": "mobile-P1-T1", "to": 60, "had": True, "from": 45, "name": "Clean and standardize customer and SKU base", "field": "actual"},
                                    {"id": "mobile-P1-T1", "to": "Two stores opened in Q2, the third slipped to July", "had": True, "from": "", "name": "Clean and standardize customer and SKU base", "field": "note"}]}},
  {"id": 1, "at": "2026-09-03T05:16:05.000Z", "person_key": "smo", "person_name": "Mohamed Essam", "kind": "unitPlan", "target": "mobile", "what": "the unit's plan",
   "rows_": {"count": 1, "moved": [{"id": "mobile-P1-M1", "to": "1%", "had": True, "from": "0.8%", "name": "Data duplicate rate", "field": "target"}]}},
]
SEEN = {"asks": [], "posts": [], "office": True}
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
            if "log" in q:
                f = {k: q[k][0] for k in ("target", "person", "kind", "from", "limit") if k in q}
                SEEN["asks"].append(f)
                rows = [r for r in LOG if (not f.get("target") or r["target"] == f["target"])
                        and (not f.get("person") or r["person_key"] == f["person"])
                        and (not f.get("kind") or r["kind"] == f["kind"])]
                if f.get("from") and f["from"] > "2026-09-03T06:00:00":
                    rows = []
                rows = rows[: int(f.get("limit") or 200)]
                self._s(200, json.dumps({"ok": True, "office": SEEN["office"], "log": rows}).encode(), "application/json")
                return
            if "since" in q:
                self._s(200, json.dumps({"ok": True, "changed": [], "now": "2026-09-03T05:00:00.000Z"}).encode(), "application/json")
                return
            self._s(200, json.dumps({"ok": True, "state": SEED, "person": PERSON}).encode(), "application/json")
            return
        if self.path.startswith("/raya-trade"):
            self._s(200, HTML, "text/html; charset=utf-8")
            return
        self._s(200, GATE, "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(n).decode("utf-8", "replace")
        if self.path.startswith("/api/state"):
            SEEN["posts"].append(body)
        self._s(200, b'{"ok":true}', "application/json")


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % srv.server_address[1]
FILE_URL = "file://" + str(HTML_PATH)
INIT = ("try{sessionStorage.setItem('smp.tour.later','1');"
        "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")


def press(pg, sel):
    try:
        pg.click(sel, timeout=2000)
        return True
    except Exception:
        return False


def pick(pg, sel, value):
    """Choose if the control is there; an absent control is reported by the
       assertion after it, never by a 30s timeout (§215)."""
    try:
        pg.select_option(sel, value, timeout=2000)
    except Exception:
        pass


def fill(pg, sel, value):
    try:
        pg.fill(sel, value, timeout=2000)
    except Exception:
        pass


def rail_has_history(pg):
    return pg.evaluate("()=>[...document.querySelectorAll('[data-setupgo]')].some(r=>r.dataset.setupgo==='history')")


def open_history(pg):
    press(pg, 'button[title="Setup"]')
    pg.wait_for_timeout(400)
    pg.evaluate("()=>{const r=[...document.querySelectorAll('[data-setupgo]')].find(x=>x.dataset.setupgo==='history'); if(r) r.click();}")
    pg.wait_for_timeout(900)


def rows(pg):
    return pg.evaluate("()=>[...document.querySelectorAll('[data-hist-page] table.hist tbody tr')].map(tr=>({hidden:tr.hidden, text:tr.textContent.replace(/\\s+/g,' ').trim(), rst:(()=>{const b=tr.querySelector('.hist-rst');return b?{disabled:b.disabled,title:b.title}:null})()}))")


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.add_init_script(INIT)
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL, wait_until="networkidle")
    pg.wait_for_timeout(1800)
    ck("the platform hydrated", pg.evaluate("()=>SYNC.isLive()") is True)

    # ── 1 · THE PAGE IS THE OFFICE'S, OVER HTTP ──────────────────────────
    print("\n1 · the page is in the rail for the office")
    press(pg, 'button[title="Setup"]'); pg.wait_for_timeout(400)
    ck("History is in the Setup rail", rail_has_history(pg))
    open_history(pg)
    ck("the page opened", pg.evaluate("()=>typeof current!=='undefined' && current==='setup' && !!document.querySelector('[data-hist-page]')"))
    ck("...named once, in the rail's word", pg.evaluate("()=>document.querySelectorAll('.setupttl').length===1 && /history/i.test(document.querySelector('.setupttl').textContent)"))

    # ── 2 · IT ASKS FOR A SLICE, AND DRAWS ONE LINE PER FIELD ────────────
    print("\n2 · it asks the server for a slice and draws one line per field")
    asks = [a for a in SEEN["asks"] if "target" not in a]
    ck("the page asked the server", len(asks) >= 1, SEEN["asks"])
    ck("...for today, with a cap, never the graph", asks and asks[-1].get("from") and asks[-1].get("limit"), asks[-1] if asks else None)
    r = rows(pg)
    ck("one line per changed field: 7 lines from 6 entries", len(r) == 7, len(r))
    ck("...each naming who and where", all(("Mohamed Essam" in x["text"] or "Mennah Farouk" in x["text"] or "Yara Kamal" in x["text"] or "Ashraf Laithy" in x["text"]) and ("Mobile" in x["text"] or "Retail" in x["text"] or "Marketing" in x["text"]) for x in r), [x["text"][:60] for x in r])
    ck("...the target's before and after", any("0.8%" in x["text"] and "1%" in x["text"] for x in r), [x["text"] for x in r][-1:])
    ck("...and the field in words, never a key", any("Compile rule" in x["text"] for x in r) and not any("compile " in x["text"] for x in r))
    ck("the quarters draw as four boxes", pg.evaluate("()=>document.querySelectorAll('[data-hist-page] i.hist-q').length===4 && document.querySelectorAll('[data-hist-page] i.hist-q.on').length===2"))
    # ONE ROW IS NOT ONE TOP (§122.4): a chip and a quarter box sit on the line
    # at different offsets, so tops are clustered — two lines are >8px apart.
    # §262.2: EVERY cell wraps and nothing is cut — asserted as "no cell holds
    # more than it shows", at the page's width and at a laptop's.
    ck("no cell is cut: every cell shows all it holds (§262.2)", pg.evaluate("()=>[...document.querySelectorAll('[data-hist-page] table.hist td')].every(td=>td.scrollWidth<=td.clientWidth+1)"))
    pg.set_viewport_size({"width": 1180, "height": 800}); pg.wait_for_timeout(300)
    cut = pg.evaluate("()=>[...document.querySelectorAll('[data-hist-page] table.hist td')].filter(td=>td.scrollWidth>td.clientWidth+1).map(td=>td.textContent.trim().slice(0,30))")
    ck("...and at a laptop's width too (1180)", not cut, cut)
    ck("...with a time never split across lines", pg.evaluate("()=>[...document.querySelectorAll('[data-hist-page] table.hist td.hist-t')].every(td=>{const rg=document.createRange();rg.selectNodeContents(td);const t=[...rg.getClientRects()].filter(r=>r.width>0).map(r=>r.top);return !t.length || Math.max(...t)-Math.min(...t)<=8;})"))
    pg.set_viewport_size({"width": 1440, "height": 900}); pg.wait_for_timeout(300)
    ck("Date and Time are two columns and the last is headed Restore", pg.evaluate("()=>{const h=[...document.querySelectorAll('[data-hist-page] table.hist th')].map(t=>t.textContent.trim());return h[0]==='Date'&&h[1]==='Time'&&h[h.length-1]==='Restore';}"))
    ck("Who is the register's Name, the full name on the hover", pg.evaluate("()=>{const td=[...document.querySelectorAll('[data-hist-page] table.hist tbody tr')].map(tr=>tr.children[2]);return td.some(c=>c.textContent.trim()===knownName(PEOPLE.find(p=>p.key==='smo'), displayNames()) && c.title==='Mohamed Essam');}"))
    ck("the table fits the pane and every Restore sits whole inside its cell (§158)", pg.evaluate("()=>{const t=document.querySelector('[data-hist-page] table.hist');if(!t) return false;const p=t.closest('#panel')||document.body;return t.getBoundingClientRect().right<=p.getBoundingClientRect().right+0.5 && [...t.querySelectorAll('.hist-rst')].every(b=>{const c=b.closest('td').getBoundingClientRect(),r=b.getBoundingClientRect();return r.right<=c.right+0.5;});}"))

    # ── 3 · THE FILTERS ASK AGAIN; THE SEARCH DOES NOT ───────────────────
    print("\n3 · a filter asks again, the search filters in place")
    pg.evaluate("()=>{window.__p=0;const o=window.paint;window.paint=function(){window.__p++;return o.apply(this,arguments)};return 0}")
    n0 = len(SEEN["asks"])
    pick(pg, "[data-hist-f='target']", "mobile"); pg.wait_for_timeout(700)
    ck("picking a place asks the server for that place", len(SEEN["asks"]) == n0 + 1 and (SEEN["asks"][-1].get("target") if SEEN["asks"] else None) == "mobile", SEEN["asks"][-1:])
    ck("...and the table is that place's (5 lines)", len(rows(pg)) == 5, len(rows(pg)))
    pick(pg, "[data-hist-f='person']", "own_mob"); pg.wait_for_timeout(700)
    ck("picking a person narrows further (2 lines)", len(rows(pg)) == 2 and (SEEN["asks"][-1].get("person") if SEEN["asks"] else None) == "own_mob", (len(rows(pg)), SEEN["asks"][-1:]))
    pick(pg, "[data-hist-f='person']", ""); pick(pg, "[data-hist-f='target']", ""); pg.wait_for_timeout(700)
    n1 = len(SEEN["asks"]); p1 = pg.evaluate("()=>window.__p")
    fill(pg, "[data-hist-q]", "retail"); pg.wait_for_timeout(300)
    r = rows(pg)
    shown = [x for x in r if not x["hidden"]]
    ck("typing filters the rows in place", len(shown) == 1 and "Retail" in shown[0]["text"], [(x["hidden"], x["text"][:30]) for x in r])
    ck("...asks the server nothing", len(SEEN["asks"]) == n1, len(SEEN["asks"]) - n1)
    ck("...and never repaints (§35)", pg.evaluate("()=>window.__p") == p1)
    fill(pg, "[data-hist-q]", ""); pg.wait_for_timeout(200)
    pick(pg, "[data-hist-f='when']", "all"); pg.wait_for_timeout(700)
    ck("All time asks with no window", bool(SEEN["asks"]) and "from" not in SEEN["asks"][-1], SEEN["asks"][-1:])

    # ── 4 · RESTORE: WHAT CANNOT, SAYS WHY; WHAT CAN, GOES BACK ──────────
    print("\n4 · Restore")
    r = rows(pg)
    sub = [x for x in r if "Submitted" in x["text"] or "submitting" in x["text"]]
    ck("a submission's Restore is greyed with the reason", sub and sub[0]["rst"] and sub[0]["rst"]["disabled"] and "Reporting tab" in sub[0]["rst"]["title"], sub and sub[0]["rst"])
    tgt = [i for i, x in enumerate(r) if "Data duplicate rate" in x["text"] and "0.8%" in x["text"]]
    ck("the target's Restore is live", bool(tgt) and r[tgt[0]]["rst"] and not r[tgt[0]]["rst"]["disabled"])
    before = pg.evaluate("()=>UNITS.mobile.items[0].measures[0].target")
    ck("the plan holds the CURRENT value before the press (the seed's own 1%)", before == "1%", before)
    pg.evaluate("i=>{const tr=document.querySelectorAll('[data-hist-page] table.hist tbody tr')[i];const b=tr&&tr.querySelector('[data-hist-restore]');if(b)b.click()}", tgt[0] if tgt else -1)
    pg.wait_for_timeout(300)
    conf = pg.evaluate("()=>{const c=document.querySelector('.hist-confirm');return c?c.textContent.replace(/\\s+/g,' ').trim():''}")
    ck("a confirmation opens naming the row, the value going back and who set the current one",
       "Data duplicate rate" in conf and "0.8%" in conf and "1%" in conf and "Mohamed Essam" in conf, conf[:160] or "(nothing)")
    ck("...and says it is an ordinary change", "ordinary change" in conf, conf[:200])
    press(pg, "[data-hist-cancel]"); pg.wait_for_timeout(200)
    ck("Cancel changes nothing", pg.evaluate("()=>UNITS.mobile.items[0].measures[0].target") == before and not pg.evaluate("()=>!!document.querySelector('.hist-confirm')"))
    pg.evaluate("i=>{const tr=document.querySelectorAll('[data-hist-page] table.hist tbody tr')[i];const b=tr&&tr.querySelector('[data-hist-restore]');if(b)b.click()}", tgt[0] if tgt else -1)
    pg.wait_for_timeout(300)
    posts0 = len(SEEN["posts"])
    press(pg, "[data-hist-ok]"); pg.wait_for_timeout(1500)
    ck("Put it back writes the OLD value into the plan", pg.evaluate("()=>UNITS.mobile.items[0].measures[0].target") == "0.8%", pg.evaluate("()=>UNITS.mobile.items[0].measures[0].target"))
    ck("...and a save went to the server carrying it", any("0.8%" in x for x in SEEN["posts"][posts0:]), len(SEEN["posts"]) - posts0)
    ck("...and the confirmation closed", not pg.evaluate("()=>!!document.querySelector('.hist-confirm')"))
    # a value that was ABSENT before goes back to absent
    pg.wait_for_timeout(2200)
    r = rows(pg)
    qi = [i for i, x in enumerate(r) if "order-to-cash" in x["text"]]
    pg.evaluate("i=>{const tr=document.querySelectorAll('[data-hist-page] table.hist tbody tr')[i];const b=tr&&tr.querySelector('[data-hist-restore]');if(b)b.click()}", qi[0] if qi else -1); pg.wait_for_timeout(300)
    press(pg, "[data-hist-ok]"); pg.wait_for_timeout(1200)
    ck("a field that was absent before goes back to absent", pg.evaluate("()=>!('quarters' in UNITS.mobile.items[0].tactics[1])"), pg.evaluate("()=>JSON.stringify(UNITS.mobile.items[0].tactics[1].quarters)"))

    # ── 5 · THE UNIT'S OWN LINE, AND THE DOOR ────────────────────────────
    print("\n5 · the unit's own page: the last change, and a door")
    pg.evaluate("()=>{const b=document.querySelector('button[data-u=\"mobile\"]'); if(b) b.click();}"); pg.wait_for_timeout(1500)
    line = pg.evaluate("()=>{const s=document.querySelector('.pband-hist');return s?s.textContent.replace(/\\s+/g,' ').trim():''}")
    ck("Mobile's band says who last changed it", "Last changed by" in line and "Mohamed Essam" in line, line or "(nothing)")
    ck("...asked for ONE row of that unit only", any(a.get("target") == "mobile" and a.get("limit") == "1" for a in SEEN["asks"]), SEEN["asks"][-2:])
    ck("...and the band is still one line", pg.evaluate("()=>{const b=document.querySelector('.pane .pband');return b && b.getBoundingClientRect().height<56;}"))
    press(pg, "[data-hist-open]"); pg.wait_for_timeout(900)
    mrows = pg.evaluate("()=>document.querySelectorAll('[data-hist-modal] table.hist tbody tr').length")
    ck("the door opens the unit's history in a dialog (5 lines)", mrows == 5, mrows)
    ck("...with no Where column, it is all one place", pg.evaluate("()=>![...document.querySelectorAll('[data-hist-modal] th')].some(t=>t.textContent.trim()==='Where')"))
    ck("...and every Restore sits whole inside its cell (§158: fit, never cut)", pg.evaluate("()=>[...document.querySelectorAll('[data-hist-modal] .hist-rst')].every(b=>{const c=b.closest('td').getBoundingClientRect(),r=b.getBoundingClientRect();return r.right<=c.right+0.5 && r.left>=c.left-0.5;})"))
    pg.keyboard.press("Escape"); pg.wait_for_timeout(300)

    # ── 6 · A CUSTODIAN HAS NO SETUP, AND STILL HAS THE LINE ─────────────
    print("\n6 · a custodian: no History in Setup, the line and the door on their unit")
    SEEN["office"] = False
    pg.evaluate("()=>switchViewer('own_mob')"); pg.wait_for_timeout(2200)
    ck("viewing as Mobile's custodian", pg.evaluate("()=>viewer() && viewer().key")=="own_mob", pg.evaluate("()=>viewer() && viewer().key"))
    ck("no History page for them", not pg.evaluate("()=>typeof SUBS!=='undefined' && SUBS.setup.concat(SUBS.manage).some(d=>d.k==='history' && (!d.when || d.when()))"))
    pg.evaluate("()=>{const b=document.querySelector('button[data-u=\"mobile\"]'); if(b) b.click();}"); pg.wait_for_timeout(1500)
    line = pg.evaluate("()=>{const s=document.querySelector('.pband-hist');return s?s.textContent.replace(/\\s+/g,' ').trim():''}")
    ck("their unit's line is drawn", "Last changed by" in line, line or "(nothing)")
    ck("no page errors", not errs, errs[:3])

    # ── 7 · file:// DRAWS NOTHING ────────────────────────────────────────
    print("\n7 · no server behind the page")
    pg2 = b.new_page(viewport={"width": 1440, "height": 900}); pg2.add_init_script(INIT)
    n0 = len(SEEN["asks"])
    pg2.goto(FILE_URL, wait_until="networkidle"); pg2.wait_for_timeout(2000)
    press(pg2, 'button[title="Setup"]'); pg2.wait_for_timeout(400)
    ck("History is not in the rail", not rail_has_history(pg2))
    pg2.evaluate("()=>{const b=document.querySelector('button[data-u=\"mobile\"]'); if(b) b.click();}"); pg2.wait_for_timeout(1200)
    ck("no line on a unit's band", not pg2.evaluate("()=>!!document.querySelector('.pband-hist')"))
    ck("nothing was asked", len(SEEN["asks"]) == n0)
    pg2.close(); b.close()

print("\n%s" % ("ALL GREEN" if not bad else "%d FAIL" % bad))
raise SystemExit(1 if bad else 0)
