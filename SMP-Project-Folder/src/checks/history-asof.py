"""A REMOVED ROW COMES BACK IN ITS SEAT, AND THE PLAN AS IT STOOD ON A DAY (§598).

qa-run: own-server — the same stub `history-page.py` runs: a fixed change
log, the demo seed, the office signed in. Both ends throughout (§94.2), and
the DATA is read after every press (§96).

Islam, 2026-10-23: *"old position, and on screen is enough"* and *"the
history of the plans should be on the plans page for the smo to see and
review"*; of the pictures made of the real pages: *"yes build both"*.

  1. a removal line in Setup › History reads the row, the field Row and its
     seat ("MB01 · measure 2 of 5 → removed"), with a LIVE Restore;
  2. a value on that removed row is held, saying to put the row back first;
  3. Put it back re-seats the row at its old index in the DATA, with its
     contents, and a save is posted; the line then reads "back already";
  4. an added row's line keeps today's greyed button; a removal logged
     before the contents were kept keeps its greyed button too;
  5. Mobile's Plan page carries "As it stood on…" for the office, after See
     history; picking a day draws the banner, puts the pen away, shows the
     target as it was, re-seats the removed row greyed with "Removed since",
     and the LIVE graph is untouched; Back to today restores the page;
  6. the day view is read only: mayAuthor() answers no for the subject and
     yes again after Back to today.

Run: SMP_WRITE_MOCKUPS unneeded — python3 qa-run.py checks/history-asof.py
"""
import datetime, json, os, pathlib, threading, http.server, socketserver, urllib.parse
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML_PATH = pathlib.Path(os.environ.get("SMP_HTML") or (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html"))
HTML = HTML_PATH.read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
GATE = b"<!doctype html><title>Sign in</title><h1 id='gate'>Sign in</h1>"
TODAY = datetime.datetime.now(datetime.timezone.utc)
def _at(days_ago, h, m):
    d = TODAY - datetime.timedelta(days=days_ago)
    return d.strftime("%Y-%m-%d") + "T%02d:%02d:00.000Z" % (h, m)

# The removed row is a REAL row of the seed, taken out of a COPY of the seed
# the stub serves: the log says it left seat 1 of MB01's measures, and the
# served plan no longer holds it — exactly what a removal leaves behind.
GONE = json.loads(json.dumps(SEED["units"]["mobile"]["items"][0]["measures"][1]))
SERVED = json.loads(json.dumps(SEED))
SERVED["units"]["mobile"]["items"][0]["measures"].pop(1)
PILLAR_ID = SEED["units"]["mobile"]["items"][0]["id"]
N_MEASURES = len(SEED["units"]["mobile"]["items"][0]["measures"])
FIRST = SEED["units"]["mobile"]["items"][0]["measures"][0]
# and the first measure's target was changed AFTER the chosen day
SERVED["units"]["mobile"]["items"][0]["measures"][0]["target"] = "1.5%"

# ── §598.1: AND A FUNCTION, AND THE COMPANY ──────────────────────────────
# finance plans in projects: its first project's first milestone left seat 0.
FN_P = json.loads(json.dumps(SEED["functions"]["finance"]["projects"][0]))
FN_MS = json.loads(json.dumps(FN_P["milestones"][0]))
FN_N = len(FN_P["milestones"])
SERVED["functions"]["finance"]["projects"][0]["milestones"].pop(0)
# the demo company has no plan of its own: give the served copy one direction,
# cloned from Mobile's first pillar under the company's own ids, with its
# second measure removed and its first measure's target moved since the day.
def reid(o, a, b):
    return json.loads(json.dumps(o).replace(a, b))
G_P = reid(SEED["units"]["mobile"]["items"][0], "mobile-P1", "group-P1")
G_GONE = json.loads(json.dumps(G_P["measures"][1]))
G_N = len(G_P["measures"])
G_FIRST = G_P["measures"][0]
G_SERVED = json.loads(json.dumps(G_P)); G_SERVED["measures"].pop(1); G_SERVED["measures"][0]["target"] = "7%"
SERVED["group"]["items"] = [G_SERVED]
# ...and the tab is offered only where the Structure switches the company's pillars on
SERVED["group"].setdefault("structure", {}).setdefault("over", {}).setdefault("group", {})["pillar"] = True

LOG = [
  {"id": 9, "at": _at(0, 9, 41), "person_key": "smo", "person_name": "Mohamed Essam", "kind": "unitPlan", "target": "mobile", "what": "the unit's plan",
   "rows_": {"count": 1, "moved": [{"id": FIRST["id"], "to": "1.5%", "had": True, "from": FIRST.get("target"), "name": FIRST["name"], "field": "target"}]}},
  {"id": 8, "at": _at(0, 9, 40), "person_key": "smo", "person_name": "Mohamed Essam", "kind": "unitPlan", "target": "mobile", "what": "the unit's plan",
   "rows_": {"count": 1, "moved": [{"id": GONE["id"], "name": GONE["name"], "field": "row", "had": True,
                                    "from": {"in": PILLAR_ID, "list": "measures", "at": 1, "of": N_MEASURES, "row": GONE}, "to": None}]}},
  {"id": 7, "at": _at(1, 8, 2), "person_key": "own_mob", "person_name": "Mennah Farouk", "kind": "unitReporting", "target": "mobile", "what": "reported figures",
   "rows_": {"count": 1, "moved": [{"id": GONE["id"], "to": 64, "had": True, "from": 61, "name": GONE["name"], "field": "actual"}]}},
  # an added row: removed from the Plan page, never restored from here
  {"id": 6, "at": _at(1, 7, 20), "person_key": "smo", "person_name": "Mohamed Essam", "kind": "unitPlan", "target": "mobile", "what": "the unit's plan",
   "rows_": {"count": 1, "moved": [{"id": "mobile-P1-T99", "name": "A new tactic", "field": "row", "had": False, "from": None,
                                    "to": {"in": PILLAR_ID, "list": "tactics", "at": 5, "of": 6, "row": {"id": "mobile-P1-T99", "name": "A new tactic"}}}]}},
  # a removal logged BEFORE §598: no rows at all
  {"id": 5, "at": _at(2, 7, 5), "person_key": "smo", "person_name": "Mohamed Essam", "kind": "unitPlan", "target": "mobile", "what": "the unit's plan", "rows_": None},
  # §598.1: a function's milestone that left its project, and the company's own plan
  {"id": 4, "at": _at(0, 9, 30), "person_key": "smo", "person_name": "Mohamed Essam", "kind": "capPlan", "target": "fn:finance", "what": "a project's milestones",
   "rows_": {"count": 1, "moved": [{"id": FN_MS["id"], "name": FN_MS["name"], "field": "row", "had": True,
                                    "from": {"in": FN_P["id"], "list": "milestones", "at": 0, "of": FN_N, "row": FN_MS}, "to": None}]}},
  {"id": 3, "at": _at(0, 9, 20), "person_key": "smo", "person_name": "Mohamed Essam", "kind": "unitPlan", "target": "group", "what": "the unit's plan",
   "rows_": {"count": 1, "moved": [{"id": G_FIRST["id"], "to": "7%", "had": True, "from": G_FIRST.get("target"), "name": G_FIRST["name"], "field": "target"}]}},
  {"id": 2, "at": _at(0, 9, 10), "person_key": "smo", "person_name": "Mohamed Essam", "kind": "unitPlan", "target": "group", "what": "the unit's plan",
   "rows_": {"count": 1, "moved": [{"id": G_GONE["id"], "name": G_GONE["name"], "field": "row", "had": True,
                                    "from": {"in": G_P["id"], "list": "measures", "at": 1, "of": G_N, "row": G_GONE}, "to": None}]}},
]
SEEN = {"asks": [], "posts": []}
bad = 0
def ck(w, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x != "" else ""))

class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _s(self, c, b, t):
        self.send_response(c); self.send_header("Content-Type", t)
        self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        if self.path.startswith("/api/state"):
            q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            if "log" in q:
                f = {k: q[k][0] for k in ("target", "person", "kind", "from", "limit") if k in q}
                SEEN["asks"].append(f)
                rows = [r for r in LOG if (not f.get("target") or r["target"] == f["target"])
                        and (not f.get("from") or r["at"] >= f["from"])][: int(f.get("limit") or 200)]
                self._s(200, json.dumps({"ok": True, "office": True, "log": rows}).encode(), "application/json"); return
            if "since" in q:
                self._s(200, json.dumps({"ok": True, "changed": [], "now": _at(0, 10, 0)}).encode(), "application/json"); return
            self._s(200, json.dumps({"ok": True, "state": SERVED, "person": PERSON}).encode(), "application/json"); return
        if self.path.startswith("/raya-trade"):
            self._s(200, HTML, "text/html; charset=utf-8"); return
        self._s(200, GATE, "text/html; charset=utf-8")
    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(n).decode("utf-8", "replace")
        if self.path.startswith("/api/state"): SEEN["posts"].append(body)
        self._s(200, b'{"ok":true}', "application/json")

srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % srv.server_address[1]
INIT = ("try{sessionStorage.setItem('smp.tour.later','1');"
        "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")

def press(pg, sel):
    try: pg.click(sel, timeout=2000); return True
    except Exception: return False

def rows(pg, scope="[data-hist-page]"):
    return pg.evaluate("""s=>[...document.querySelectorAll(s+' table.hist tbody tr')].map(tr=>({
      text:tr.textContent.replace(/\\s+/g,' ').trim(),
      fld:(tr.querySelector('.hist-fld')||{}).textContent||'',
      fromto:(tr.querySelector('.hist-fromto')||{}).textContent||'',
      live:!!tr.querySelector('[data-hist-restore]'),
      why:(tr.querySelector('.hist-rst')||{}).getAttribute ? (tr.querySelector('.hist-rst').getAttribute('data-tip')||'') : ''}))""", scope)

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.add_init_script(INIT)
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL, wait_until="networkidle"); pg.wait_for_timeout(1800)
    ck("the platform hydrated", pg.evaluate("()=>SYNC.isLive()") is True)
    ck("the served plan no longer holds the removed row",
       pg.evaluate("id=>!UNITS.mobile.items[0].measures.some(m=>m.id===id)", GONE["id"]))

    # ── 1 · the removal line ─────────────────────────────────────────────
    print("\n1 · Setup › History: a removal is a line with a seat and a live Restore")
    press(pg, 'button[title="Setup"]'); pg.wait_for_timeout(400)
    pg.evaluate("()=>{const r=[...document.querySelectorAll('[data-setupgo]')].find(x=>x.dataset.setupgo==='history'); if(r) r.click();}")
    pg.wait_for_timeout(900)
    pg.evaluate("()=>{const s=document.querySelector('[data-hist-f=\"when\"]'); if(s){s.value='week'; s.dispatchEvent(new Event('change',{bubbles:true}));}}")
    pg.wait_for_timeout(900)
    rs = rows(pg)
    rem = [r for r in rs if r["fld"] == "Row" and "removed" in r["fromto"] and GONE["name"] in r["text"] and "Mobile" in r["text"]]
    ck("Mobile's removal reads Row … → removed", len(rem) == 1, [r["fromto"] for r in rs])
    gl = [r for r in rs if r["fld"] == "Row" and G_GONE["name"] in r["text"] and "Mobile" not in r["text"]]
    ck("the company's removal names its pillar's code (§598.1)", bool(gl) and ("C001" in gl[0]["fromto"] or "D001" in gl[0]["fromto"]) and "measure 2 of 4" in gl[0]["fromto"], gl and gl[0]["fromto"])
    ck("...naming the seat: the pillar's code, 'measure 2 of %d'" % N_MEASURES,
       bool(rem) and ("measure 2 of %d" % N_MEASURES) in rem[0]["fromto"] and "MB01" in rem[0]["fromto"], rem and rem[0]["fromto"])
    ck("...with a LIVE Restore", bool(rem) and rem[0]["live"], rem)
    val = [r for r in rs if r["fld"] == "Actual" and GONE["name"] in r["text"]]
    ck("the figure reported on that row is held, saying to put the row back first",
       bool(val) and not val[0]["live"] and "Put the row back first" in val[0]["why"], val)
    added = [r for r in rs if r["fld"] == "Row" and "A new tactic" in r["text"]]
    ck("an added row's line is held: removed from the Plan page",
       bool(added) and not added[0]["live"] and "added" in added[0]["why"], added)
    old = [r for r in rs if r["fld"] == "" and "the unit's plan" in r["text"]]
    ck("a removal logged before §598 keeps today's greyed button",
       bool(old) and not old[0]["live"] and "no single value" in old[0]["why"], old)

    # ── 2 · Put it back ──────────────────────────────────────────────────
    print("\n2 · Put it back re-seats the row at its old index, with its contents")
    idx = next((i for i, r in enumerate(rs) if r["fld"] == "Row" and "removed" in r["fromto"]), -1)
    pg.evaluate("i=>{const tr=document.querySelectorAll('[data-hist-page] table.hist tbody tr')[i];const b=tr&&tr.querySelector('[data-hist-restore]');if(b)b.click()}", idx)
    pg.wait_for_timeout(400)
    conf = pg.evaluate("()=>{const c=document.querySelector('.hist-confirm');return c?c.textContent.replace(/\\s+/g,' ').trim():''}")
    ck("the confirmation names the row and its old seat", GONE["name"] in conf and "measure 2 of MB01" in conf, conf[:160])
    n_posts = len(SEEN["posts"])
    press(pg, "[data-hist-ok]"); pg.wait_for_timeout(1800)
    back = pg.evaluate("""id=>{const ms=UNITS.mobile.items[0].measures; const i=ms.findIndex(m=>m.id===id);
      return {i, n:ms.length, name:i>-1?ms[i].name:null, target:i>-1?ms[i].target:null, compile:i>-1?ms[i].compile:null};}""", GONE["id"])
    ck("the row is back in the DATA at index 1 — its old seat", back["i"] == 1, back)
    ck("...with its name, target and compile rule", back["name"] == GONE["name"] and back["target"] == GONE.get("target") and back["compile"] == GONE.get("compile"), (back, GONE.get("target"), GONE.get("compile")))
    ck("...and the plan is one row longer, nothing else moved", back["n"] == N_MEASURES, back)
    ck("a save was posted", len(SEEN["posts"]) > n_posts, len(SEEN["posts"]))
    pg.wait_for_timeout(2200)
    rs2 = rows(pg)
    rem2 = [r for r in rs2 if r["fld"] == "Row" and "removed" in r["fromto"]]
    ck("the line now says the row is back already", bool(rem2) and not rem2[0]["live"] and "back in the plan already" in rem2[0]["why"], rem2)
    val2 = [r for r in rs2 if r["fld"] == "Actual" and GONE["name"] in r["text"]]
    ck("...and the figure's own Restore is live again", bool(val2) and val2[0]["live"], val2)
    # put the data back as it arrived (§94.2), for the day view below
    pg.evaluate("id=>{const ms=UNITS.mobile.items[0].measures; const i=ms.findIndex(m=>m.id===id); if(i>-1) ms.splice(i,1);}", GONE["id"])

    # ── 3 · the Plan page, as it stood on a day ──────────────────────────
    print("\n3 · Mobile's Plan page: As it stood on…")
    pg.evaluate("()=>{const b=document.querySelector('button[data-u=\"mobile\"]'); if(b) b.click();}"); pg.wait_for_timeout(1800)
    # the Plan TAB, never the pen (`.secpen` also carries data-page="plan")
    pg.evaluate("()=>{const b=[...document.querySelectorAll('.tabs button')].find(x=>x.textContent.trim()==='Plan' && !x.classList.contains('secpen')); if(b) b.click();}")
    pg.wait_for_timeout(1200)
    if pg.evaluate("()=>!!document.querySelector('.secpen.on')"):
        pg.evaluate("()=>document.querySelector('.secpen.on').click()"); pg.wait_for_timeout(800)
    ck("the band carries See history and, after it, As it stood on…",
       pg.evaluate("()=>{const s=document.querySelector('.pband-hist');return !!s && !!s.querySelector('[data-hist-open]') && !!s.querySelector('[data-asof-pick]') && /See history.*As it stood on/.test(s.textContent);}"),
       pg.evaluate("()=>{const s=document.querySelector('.pband-hist');return {line:s?s.textContent:null, office:(typeof inOffice==='function')?inOffice():'nofn', subj:(typeof unitLikeWritable==='function')?!!(unitLikeWritable('mobile')||{}).items:'nofn', target:TARGET, current:current};}"))
    ck("the pen is offered today", pg.evaluate("()=>!!document.querySelector('.secpen') && mayAuthor('u_plan','mobile')"))
    ck("today's target reads 1.5%", pg.evaluate("()=>UNITS.mobile.items[0].measures[0].target") == "1.5%")
    before = pg.evaluate("()=>JSON.stringify(UNITS.mobile)")
    # A build with no link must FAIL here, never die (§215): the press and the
    # fill are guarded, and the view's assertions below then read red.
    pg.evaluate("()=>{const b=document.querySelector('[data-asof-pick]'); if(b) b.click(); return !!b;}"); pg.wait_for_timeout(400)
    opened = pg.evaluate("()=>!!document.querySelector('[data-asof-day]') && !!document.querySelector('[data-asof-go]')")
    ck("the picker opened with a day field and Show the plan", opened)
    day = (TODAY - datetime.timedelta(days=3)).strftime("%Y-%m-%d")
    if opened: pg.fill("[data-asof-day]", day)
    n_asks = len(SEEN["asks"])
    press(pg, "[data-asof-go]"); pg.wait_for_timeout(1500)
    ask = SEEN["asks"][n_asks:] and SEEN["asks"][-1] or {}
    ck("it asked the log for Mobile's changes after that day, capped", ask.get("target") == "mobile" and ask.get("from", "") > day and ask.get("limit") == "500", ask)
    ck("the banner names the day and the changes since",
       pg.evaluate("()=>{const b=document.querySelector('[data-asof-bar]');return !!b && /as it stood on/.test(b.textContent) && /5 changes have been made since/.test(b.textContent) && !!b.querySelector('[data-asof-off]');}"),
       pg.evaluate("()=>{const b=document.querySelector('[data-asof-bar]');return b?b.textContent:null}"))
    ck("...and says one change could not be replayed (the pre-§598 removal)",
       pg.evaluate("()=>/1 of them could not be replayed/.test((document.querySelector('[data-asof-bar]')||{}).textContent||'')"))
    ck("the band's control now reads the day", pg.evaluate("()=>{const c=document.querySelector('.pband-hist .asof-on');return !!c && /As it stood on/.test(c.textContent);}"))
    ck("the pen is put away and mayAuthor answers no for Mobile",
       pg.evaluate("()=>!document.querySelector('.secpen') && !mayAuthor('u_plan','mobile') && document.body.classList.contains('asof')"))
    ck("...but yes for another unit", pg.evaluate("()=>mayAuthor('u_plan','retailstores')"))
    drawn = pg.evaluate("""()=>{const trs=[...document.querySelectorAll('.pane table tbody tr')];
      return trs.map(tr=>({t:tr.textContent.replace(/\\s+/g,' ').trim(), gone:tr.classList.contains('hiddenrow'), chip:(tr.querySelector('.hidchip')||{}).textContent||''}));}""")
    gone_rows = [r for r in drawn if GONE["name"] in r["t"]]
    ck("the removed row is drawn, in its seat, greyed, wearing Removed since",
       bool(gone_rows) and gone_rows[0]["gone"] and gone_rows[0]["chip"] == "Removed since" and drawn.index(gone_rows[0]) == 1, gone_rows and (drawn.index(gone_rows[0]), gone_rows[0]))
    ck("the first measure's target reads as it did then (%s), not 1.5%%" % FIRST.get("target"),
       bool(drawn) and FIRST.get("target", "").replace("%", "") in drawn[0]["t"] and "1.5" not in drawn[0]["t"], drawn and drawn[0]["t"])
    ck("the LIVE graph is untouched", pg.evaluate("()=>JSON.stringify(UNITS.mobile)") == before)
    ck("no row of the live plan reads Removed since on the live data",
       pg.evaluate("()=>typeof TRAIL.asof === 'function' && TRAIL.asof().unit !== UNITS.mobile"))
    press(pg, "[data-asof-off]"); pg.wait_for_timeout(800)
    ck("Back to today: the banner is gone, the pen is back, today's target shows",
       pg.evaluate("()=>!document.querySelector('[data-asof-bar]') && !!document.querySelector('.secpen') && mayAuthor('u_plan','mobile') && !document.body.classList.contains('asof')"))
    ck("...and the removed row is not drawn", not pg.evaluate("n=>[...document.querySelectorAll('.pane table tbody tr')].some(tr=>tr.textContent.indexOf(n)>-1)", GONE["name"]))
    ck("the live graph is still untouched", pg.evaluate("()=>JSON.stringify(UNITS.mobile)") == before)

    # ── 4 · a unit head gets no link ─────────────────────────────────────
    print("\n4 · the link is the office's")
    pg.select_option("#asWho", "mobhead"); pg.wait_for_timeout(1200)
    ck("a unit head sees See history and no As it stood on…",
       pg.evaluate("()=>{const s=document.querySelector('.pband-hist'); return !!s && !!s.querySelector('[data-hist-open]') && !s.querySelector('[data-asof-pick]');}"),
       pg.evaluate("()=>(document.querySelector('.pband-hist')||{}).textContent||null"))
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(600)

    # ── 5 · a function that plans in projects (§598.1) ──────────────────
    print("\n5 · finance's projects page: As it stood on…")
    pg.evaluate("()=>{const f=document.querySelector('#units [data-fold=\"fns\"]'); if(f) f.click();}"); pg.wait_for_timeout(400)
    pg.evaluate("()=>{const b=document.querySelector('#units button[data-u=\"fn:finance\"]'); if(b) b.click();}"); pg.wait_for_timeout(1800)
    pg.evaluate("()=>{const b=[...document.querySelectorAll('.tabs button')].find(x=>!x.classList.contains('secpen') && /^(Projects?|Plan)$/.test(x.textContent.trim())); if(b) b.click();}")
    pg.wait_for_timeout(1200)
    if pg.evaluate("()=>!!document.querySelector('.secpen.on')"):
        pg.evaluate("()=>document.querySelector('.secpen.on').click()"); pg.wait_for_timeout(800)
    ck("the milestone is not on today's page", not pg.evaluate("n=>[...document.querySelectorAll('.capbody table tbody tr')].some(tr=>tr.textContent.indexOf(n)>-1)", FN_MS["name"]))
    ck("finance's band carries As it stood on…",
       pg.evaluate("()=>{const s=document.querySelector('.pband-hist');return !!s && !!s.querySelector('[data-asof-pick]');}"),
       pg.evaluate("()=>({line:(document.querySelector('.pband-hist')||{}).textContent||null, target:TARGET, sub:currentSub})"))
    before_fn = pg.evaluate("()=>JSON.stringify(FUNCTIONS.finance)")
    pg.evaluate("()=>{const b=document.querySelector('[data-asof-pick]'); if(b) b.click();}"); pg.wait_for_timeout(400)
    if pg.evaluate("()=>!!document.querySelector('[data-asof-day]')"): pg.fill("[data-asof-day]", day)
    press(pg, "[data-asof-go]"); pg.wait_for_timeout(1500)
    ck("the banner names finance and the day",
       pg.evaluate("()=>{const b=document.querySelector('[data-asof-bar]');return !!b && /as it stood on/.test(b.textContent) && /Finance/i.test(b.textContent);}"),
       pg.evaluate("()=>(document.querySelector('[data-asof-bar]')||{}).textContent||null"))
    ck("the pen is put away and mayAuthor answers no for finance",
       pg.evaluate("()=>!document.querySelector('.secpen') && !mayAuthor('k_proj','fn:finance')"))
    fdrawn = pg.evaluate("n=>{const tr=[...document.querySelectorAll('.capbody table tbody tr')].find(x=>x.textContent.indexOf(n)>-1); return tr ? {gone:tr.classList.contains('hiddenrow'), chip:(tr.querySelector('.hidchip')||{}).textContent||'', first: tr.parentNode.firstElementChild === tr} : null;}", FN_MS["name"])
    ck("the removed milestone is drawn first in its table, greyed, wearing Removed since",
       bool(fdrawn) and fdrawn["gone"] and fdrawn["chip"] == "Removed since" and fdrawn["first"], fdrawn)
    ck("the LIVE function is untouched", pg.evaluate("()=>JSON.stringify(FUNCTIONS.finance)") == before_fn)
    press(pg, "[data-asof-off]"); pg.wait_for_timeout(800)
    ck("Back to today on finance: banner gone, pen back, milestone not drawn",
       pg.evaluate("n=>!document.querySelector('[data-asof-bar]') && !!document.querySelector('.secpen') && ![...document.querySelectorAll('.capbody table tbody tr')].some(tr=>tr.textContent.indexOf(n)>-1)", FN_MS["name"]))
    ck("...and the live function is still untouched", pg.evaluate("()=>JSON.stringify(FUNCTIONS.finance)") == before_fn)

    # ── 6 · the company's own plan (§598.1) ─────────────────────────────
    print("\n6 · the company's Plan page: As it stood on…")
    pg.evaluate("()=>{const b=document.querySelector('#topsel [data-u=\"group\"], #units [data-u=\"group\"]'); if(b) b.click();}"); pg.wait_for_timeout(1800)
    pg.evaluate("()=>{const b=[...document.querySelectorAll('.tabs button')].find(x=>!x.classList.contains('secpen') && /^(Plan|Pillars|Directions?|Strategic pillars)$/.test(x.textContent.trim())); if(b) b.click();}")
    pg.wait_for_timeout(1200)
    if pg.evaluate("()=>!!document.querySelector('.secpen.on')"):
        pg.evaluate("()=>document.querySelector('.secpen.on').click()"); pg.wait_for_timeout(800)
    ck("the company page is open on its plan, today's target reads 7%",
       pg.evaluate("()=>current==='group' && currentSub==='strategy' && GROUP.items[0].measures[0].target==='7%'"),
       pg.evaluate("()=>({current, currentSub})"))
    ck("the company's band carries See history and As it stood on…",
       pg.evaluate("()=>{const s=document.querySelector('.pband-hist');return !!s && !!s.querySelector('[data-hist-open]') && !!s.querySelector('[data-asof-pick]');}"),
       pg.evaluate("()=>({line:(document.querySelector('.pband-hist')||{}).textContent||null, band:!!document.querySelector('.pane .pband')})"))
    before_g = pg.evaluate("()=>JSON.stringify(GROUP.items)")
    pg.evaluate("()=>{const b=document.querySelector('[data-asof-pick]'); if(b) b.click();}"); pg.wait_for_timeout(400)
    if pg.evaluate("()=>!!document.querySelector('[data-asof-day]')"): pg.fill("[data-asof-day]", day)
    n_asks = len(SEEN["asks"])
    press(pg, "[data-asof-go]"); pg.wait_for_timeout(1500)
    ask = SEEN["asks"][n_asks:] and SEEN["asks"][-1] or {}
    ck("it asked the log for the company's changes", ask.get("target") == "group", ask)
    ck("the banner names the day and 2 changes since",
       pg.evaluate("()=>{const b=document.querySelector('[data-asof-bar]');return !!b && /2 changes have been made since/.test(b.textContent);}"),
       pg.evaluate("()=>(document.querySelector('[data-asof-bar]')||{}).textContent||null"))
    ck("the pen is put away and mayAuthor answers no for the company",
       pg.evaluate("()=>!document.querySelector('.secpen') && !mayAuthor('g_found','group')"))
    gdrawn = pg.evaluate("()=>[...document.querySelectorAll('.pane table tbody tr')].map(tr=>({t:tr.textContent.replace(/\\s+/g,' ').trim(), gone:tr.classList.contains('hiddenrow'), chip:(tr.querySelector('.hidchip')||{}).textContent||''}))")
    ggone = [r for r in gdrawn if G_GONE["name"] in r["t"]]
    ck("the removed measure is drawn second, greyed, wearing Removed since",
       bool(ggone) and ggone[0]["gone"] and ggone[0]["chip"] == "Removed since" and gdrawn.index(ggone[0]) == 1, ggone and (gdrawn.index(ggone[0]), ggone[0]))
    ck("the first measure's target reads as it did then (%s), not 7%%" % G_FIRST.get("target"),
       bool(gdrawn) and G_FIRST.get("target", "").replace("%", "") in gdrawn[0]["t"] and "7%" not in gdrawn[0]["t"], gdrawn and gdrawn[0]["t"])
    ck("the LIVE company plan is untouched", pg.evaluate("()=>JSON.stringify(GROUP.items)") == before_g)
    press(pg, "[data-asof-off]"); pg.wait_for_timeout(800)
    ck("Back to today on the company: banner gone, pen back, row not drawn",
       pg.evaluate("n=>!document.querySelector('[data-asof-bar]') && !!document.querySelector('.secpen') && ![...document.querySelectorAll('.pane table tbody tr')].some(tr=>tr.textContent.indexOf(n)>-1)", G_GONE["name"]))
    ck("...and the live company plan is still untouched", pg.evaluate("()=>JSON.stringify(GROUP.items)") == before_g)

    ck("no console errors", not errs, errs[:2])
    b.close()
print("\n" + ("%d FAILED" % bad if bad else "all passed"))
raise SystemExit(1 if bad else 0)
