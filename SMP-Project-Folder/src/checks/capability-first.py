"""THEIRS IS THE CAPABILITY THAT LEADS (S310).

Islam: "the porject owner should open the capability by defaut on his
project."

MEASURED IN HIS SHAPE FIRST: a project owner whose only project sits in the
SECOND of a function's two capabilities lands at the top of the page on
somebody ELSE'S capability, where he correctly has 0 controls (S147.7), with
his own starting 705px down and his twelve boxes below the fold on a 900px
window. S301.4 chose the right project inside each capability's rail and never
chose which capability leads.

WHAT THIS ASSERTS, both ends each time (S94.2):

  * on Projects, Reporting and Performance the capability holding his project
    is drawn FIRST -- asserted as AGREEMENT with a running order this file
    works out for itself from the data, never against a literal (S94.8);
  * his own project's band is above the fold and its controls are live, which
    is the complaint itself and not merely a reordering;
  * NOTHING IS HIDDEN: the same number of capabilities is drawn, and the other
    one is still there below his;
  * THE CODES DO NOT MOVE. A project's code is its POSITION across the whole
    function, so reordering the stored list renames every project for that
    viewer -- measured while this was being drawn, MKT03 became MKT01 on his
    screen while the deck and everybody else went on saying MKT03. The code he
    sees is asserted to equal the code the OFFICE sees, on all three pages;
  * the OFFICE is untouched: all four pages in the tenant's stored order, or a
    build that reordered for everybody would pass every assertion above;
  * the OVERVIEW keeps the stored order for him too -- the stated decision
    (its rows belong to no project), so a build that swept all four pages
    fails here rather than quietly widening the change;
  * and an owner whose project is in the FIRST capability sees the stored
    order unchanged, which is the identity case a "put mine first" rule must
    not disturb.

THE STATE IS MADE, not found: no demo person is named as a project's Owner
while attached to nothing else, and the fixture deliberately puts his project
in the SECOND capability -- if "his" and "the first one" coincide the whole
file proves nothing (S113.8).

SERVED OVER HTTP because S237 rebases the tab from the server on every view-as
switch and would throw a page-side fixture away. The stub is
project-done.py's, three routes wide.
"""
import json, os, pathlib, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = pathlib.Path(HERE).resolve().parents[2]
HTML = pathlib.Path(os.environ.get("SMP_BUILT") or
                    (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")).read_bytes()
SW = (ROOT / "sw.js").read_bytes()
BASE = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}

# Marketing is the one function in the worked example carrying TWO
# capabilities, which is the whole shape under test.
FN, FDEST = "marketing", "fn:marketing"
SECOND, FIRST = "Second Cap Owner 303", "First Cap Owner 303"

BASE["access"]["powner"] = dict(BASE["access"].get("powner") or {}, a_fn_own="edit")
BASE["people"] += [
    {"key": "t303b", "name": SECOND, "active": True},
    {"key": "t303a", "name": FIRST, "active": True},
]
_caps = [c for c in BASE["group"]["capabilities"] if c.get("fn") == FN]
assert len(_caps) >= 2, "the fixture needs a function with two capabilities"
_caps[1]["projects"][0]["owner"] = SECOND   # his is NOT the one drawn first
_caps[0]["projects"][0]["owner"] = FIRST    # the identity case


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _s(self, body, ctype="application/json"):
        self.send_response(200); self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body))); self.end_headers()
        self.wfile.write(body)
    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._s(json.dumps({"ok": True, "state": BASE, "person": PERSON}).encode()); return
        if self.path.startswith("/api/auth"):
            self._s(json.dumps({"ok": True, "person": PERSON}).encode()); return
        # S231.5: served as the gate serves it, or register() rejects on the
        # content type and reads here as the product throwing.
        if self.path.startswith("/sw.js"):
            self._s(SW, "application/javascript"); return
        if self.path.startswith("/raya-trade"):
            self._s(HTML, "text/html; charset=utf-8"); return
        self._s(b"<!doctype html><title>gate</title>", "text/html; charset=utf-8")
    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        self.rfile.read(n)
        if self.path.startswith("/api/state"): self._s(b'{"ok":true}'); return
        self._s(b'{"ok":true,"unread":0,"threads":[],"chat":{"on":false},"states":{},"said":{}}')


class S(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


srv = S(("127.0.0.1", 0), H)
URL = "http://127.0.0.1:%d/raya-trade" % srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()

bad = 0
def ck(what, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("    ok   " if ok else "    FAIL ") + what + (("  — %s" % (x,)) if not ok and x != "" else ""))

# ── WHAT THE PAGE DREW ───────────────────────────────────────────────────
# The capability names in the order they are painted, the project codes with
# them, and where his own band sits. Read as data so a failure can name what
# it saw rather than "not found" (S215: every probe degrades).
DREW = """()=>{
  var caps = [...document.querySelectorAll('#panel .capline')].map(function(e){
    var t = e.querySelector('.capnm');
    return (t ? t.textContent : e.textContent).trim();
  });
  var bands = [...document.querySelectorAll('#panel .pband')].map(function(e){
    var c = e.querySelector('.pband-code'), r = e.getBoundingClientRect();
    return { code: c ? c.textContent.trim() : null, top: Math.round(r.top) };
  });
  return { caps: caps, bands: bands, winH: window.innerHeight };
}"""

# The running order this file expects, worked out from the DATA rather than
# from the product's own helper — asking capsShown() would be asking the thing
# under test whether it agrees with itself.
WANT = """(who)=>{
  var caps = (GROUP.capabilities||[]).filter(c => c.fn === '%s');
  var mine = caps.filter(c => (c.projects||[]).some(p => p.owner === who));
  var rest = caps.filter(c => mine.indexOf(c) < 0);
  return { stored: caps.map(c => c.name),
           mineFirst: mine.concat(rest).map(c => c.name),
           mineCode: mine.length ? projCode('%s', mine[0].projects
                       .filter(p => p.owner === who)[0]) : null };
}""" % (FN, FN)


def to_fn(pg):
    for _ in range(3):
        if not pg.query_selector("#units .navswitch"): break
        on = pg.eval_on_selector_all("#units .navswitch .nsw.on",
                                     "e=>e.map(x=>x.textContent.trim())")
        if on and on[0] == "Functions": break
        pg.click("#units .navswitch"); pg.wait_for_timeout(150)
    d = pg.query_selector('#units button[data-u="%s"]' % FDEST)
    if d: d.click()
    pg.wait_for_timeout(500)
    return bool(d)


def sub(pg, word):
    """Open a page tab by the word it starts with; False rather than a throw."""
    got = pg.evaluate("""(w)=>{const b=[...document.querySelectorAll('#subtabs button')]
        .find(x=>x.textContent.trim().indexOf(w)===0); if(b){b.click();return true;} return false;}""", word)
    pg.wait_for_timeout(550)
    return got


def sect(pg, word):
    """A function's Overview and Projects are SECTIONS of the Strategy tab,
    not page tabs, and they are addressed by KEY (`found` / `proj`) — a check
    that asks #subtabs for them, or matches the word on the button, reports a
    page that is plainly there as missing."""
    got = pg.evaluate("""(k)=>{const b=document.querySelector('[data-sub2="'+k+'"]');
        if(b){b.click();return true;} return false;}""", word)
    pg.wait_for_timeout(500)
    return got


def as_person(pg, name):
    val = pg.evaluate("""(n)=>{var o=[...document.querySelectorAll('#asWho option')]
        .find(x=>x.textContent.indexOf(n.split(' ').slice(0,2).join(' '))===0
                 || x.textContent.indexOf(n)>=0);
        return o ? o.value : null;}""", name)
    if not val: return False
    pg.select_option("#asWho", val); pg.wait_for_timeout(1600)
    return True


with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=os.environ.get("SMP_CHROME", "/opt/pw-browsers/chromium"),
                           args=["--no-sandbox", "--disable-dev-shm-usage"])
    # 900 tall on purpose: the complaint is that his work is below the fold.
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    pg.goto(URL); pg.wait_for_timeout(2600)
    ck("the stub is live", pg.evaluate("SYNC.isLive()"))

    print("\n§1 the fixture is the shape this file is about")
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(250)
    want_b = pg.evaluate(WANT, SECOND)
    want_a = pg.evaluate(WANT, FIRST)
    ck("the function carries two capabilities", len(want_b["stored"]) >= 2, want_b["stored"])
    # S113.8: if HIS capability is already the first one, every assertion below
    # passes on a build that does nothing at all.
    ck("his is NOT the one stored first",
       want_b["mineFirst"] and want_b["mineFirst"][0] != want_b["stored"][0],
       [want_b["stored"], want_b["mineFirst"]])
    ck("the identity case's IS the one stored first",
       want_a["mineFirst"] and want_a["mineFirst"][0] == want_a["stored"][0],
       want_a["mineFirst"])

    print("\n§2 the office sees the tenant's own order, on all four pages")
    ck("the function opens", to_fn(pg))
    office = {}
    for word, key in (("Strategy", "projects"), ("Reporting", "report"),
                      ("Performance", "perf"), ("Strategy", "overview")):
        if not sub(pg, word):
            ck("the office can open %s" % word, False); continue
        if key == "projects" and not sect(pg, "proj"):
            ck("the office can open Projects", False); continue
        if key == "overview" and not sect(pg, "found"):
            ck("the office can open Overview", False); continue
        d = pg.evaluate(DREW)
        office[key] = d
        ck("%s: stored order" % key, d["caps"] == want_b["stored"], [key, d["caps"]])

    print("\n§3 the owner opens on his own capability — and nothing is hidden")
    ck("the viewer switches to him", as_person(pg, SECOND))
    ck("the function opens for him", to_fn(pg))
    his = {}
    for word, key in (("Strategy", "projects"), ("Reporting", "report"),
                      ("Performance", "perf")):
        if not sub(pg, word):
            ck("he can open %s" % word, False); continue
        if key == "projects" and not sect(pg, "proj"):
            ck("he can open Projects", False); continue
        d = pg.evaluate(DREW)
        his[key] = d
        ck("%s: his capability leads" % word,
           d["caps"] == want_b["mineFirst"], [word, d["caps"]])
        ck("%s: every capability is still drawn" % word,
           key in office and len(d["caps"]) == len(office[key]["caps"]),
           [word, d["caps"]])

    print("\n§4 his own work is on the first screen, and live")
    d = his.get("report")
    if not d:
        ck("Reporting was read", False)
    else:
        mine = [x for x in d["bands"] if x["code"] == want_b["mineCode"]]
        ck("his band is drawn", bool(mine), [want_b["mineCode"], d["bands"]])
        if mine:
            ck("his band is above the fold",
               0 < mine[0]["top"] < d["winH"], [mine[0], d["winH"]])
        sub(pg, "Reporting")
        live = pg.evaluate("""(code)=>{
          var band = [...document.querySelectorAll('#panel .pband')].find(function(e){
            var c = e.querySelector('.pband-code');
            return c && c.textContent.trim() === code; });
          if (!band) return -1;
          var live = 0, n = band.nextElementSibling;
          while (n && !n.classList.contains('pband')) {
            n.querySelectorAll('[data-crep],[data-cpick],[data-cnote],[data-rep],[data-note]')
             .forEach(function(e){ if (!e.disabled) live++; });
            n = n.nextElementSibling; }
          return live; }""", want_b["mineCode"])
        ck("and its controls are his to use", live > 0, live)

    print("\n§5 the codes do not move (S48: a code is a POSITION)")
    for key in ("projects", "report", "perf"):
        if key not in his or key not in office:
            ck("%s: both sides were read" % key, False); continue
        ck("%s: he reads the same codes the office does" % key,
           sorted(x["code"] for x in his[key]["bands"]) ==
           sorted(x["code"] for x in office[key]["bands"]),
           [key, [x["code"] for x in his[key]["bands"]],
            [x["code"] for x in office[key]["bands"]]])
    ck("and his own project keeps the code the stored order gives it",
       his.get("report") and want_b["mineCode"] in
       [x["code"] for x in his["report"]["bands"]], want_b["mineCode"])

    print("\n§6 the Overview keeps the tenant's order — the stated decision")
    if not (sub(pg, "Strategy") and sect(pg, "found")):
        ck("he can open Overview", False)
    else:
        d = pg.evaluate(DREW)
        ck("Overview: stored order", d["caps"] == want_b["stored"], d["caps"])

    print("\n§7 an owner already first sees nothing move")
    ck("the viewer switches", as_person(pg, FIRST))
    ck("the function opens", to_fn(pg))
    if not sub(pg, "Reporting"):
        ck("Reporting opens", False)
    else:
        d = pg.evaluate(DREW)
        ck("Reporting: stored order, unchanged", d["caps"] == want_a["stored"], d["caps"])

    ck("no page error anywhere", not errs, errs[:3])
    b.close()

print("\n%d failed" % bad)
raise SystemExit(1 if bad else 0)
