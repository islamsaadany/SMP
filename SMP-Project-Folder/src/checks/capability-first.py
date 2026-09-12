"""THEIRS IS THE CAPABILITY THEY OPEN ON (§310, rewritten at §330).

qa-run: own-server — this check BUILDS the state it measures and serves it
from a stub of its own: people the register does not hold, and a function
carrying a capability that is theirs beside one that is not. The served app
cannot be made to hold that graph, and its subject is what the CLIENT does
given a stored one — carried into the app verbatim, so the code under test is
the same either way (§316.1).

Islam: *"the porject owner should open the capability by defaut on his
project."*

MEASURED IN HIS SHAPE FIRST (§310): a project owner whose only project sat in
the SECOND of a function's two capabilities landed at the top of the page on
somebody ELSE'S capability, where he correctly has 0 controls (§147.7), with
his own starting 705px down and his twelve boxes below the fold on a 900px
window.

§330 MOVED THE ANSWER RATHER THAN RETIRING THE QUESTION, and this file moves
with it (§274: switch the subject rather than wait for it, and say so out
loud). §310 answered it by SORTING the capabilities a function's pages drew,
so his came first; stage 2 made a capability a DESTINATION of its own, so a
function's pages draw the function's own work and there is no list left to
sort — `capsShown()`'s sort is deleted as dead code (§24) and the answer now
lives in `entryDest`/`capForBounded`, which OPENS the capability holding his
project rather than a function page with nothing of his on it. Every claim
below is §310's, asserted where §330 keeps it.

WHAT THIS ASSERTS, both ends each time (§94.2):

  * he LANDS on the capability holding his project — asserted against a
    landing this file works out for itself from the data, never a literal
    (§94.8);
  * his own project's band is on the first screen and its controls are live,
    which is the complaint itself and not merely a destination;
  * NOTHING IS HIDDEN: every capability he may reach is still a destination in
    the navigation, the other one included;
  * THE CODES DO NOT MOVE. A project's code is its POSITION in the thing that
    HOLDS it (§310, §330), so the code he reads is asserted to equal the code
    the OFFICE reads;
  * the OFFICE is untouched: it lands where a person with no bounded role
    lands, or a build that opened everybody on a capability would pass every
    assertion above;
  * an owner whose project is the FUNCTION'S OWN lands on the function — the
    identity case a "open theirs" rule must not disturb;
  * and an owner with TWO capabilities under one function lands on the
    FUNCTION, which is the stated cost of the rule rather than a defect: there
    is no one answer to *which of mine*, so the honest landing is the page both
    are one press from.

THE STATE IS MADE, not found (§255): the worked example holds ONE capability
since §329, and no demo person is named as a project's Owner while attached to
nothing else. The fixture deliberately gives the function a capability that is
NOT his beside the one that is — if his were the only one every assertion here
would pass on a build that opens the first box it finds (§113.8).

SERVED OVER HTTP because §237 rebases the tab from the server on every view-as
switch and would throw a page-side fixture away.
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

# Marketing is the function the worked example leaves a capability on (§330),
# so the fixture adds ONE beside it rather than inventing both — the shape
# under test is a box that is his next to a box that is not.
FN, FDEST = "marketing", "fn:marketing"
SECOND = "Second Cap Owner 303"   # his project is in a capability
FIRST  = "First Cap Owner 303"    # his project is the FUNCTION's own
BOTH   = "Both Caps Owner 330"    # a project in each — the stated cost

BASE["access"]["powner"] = dict(BASE["access"].get("powner") or {}, a_fn_own="edit")
# ATTACHED TO THE FUNCTION, because `entryDest` asks `personAt(viewer())`
# first and a person the register has placed NOWHERE has no landing to test:
# it falls through to "the first destination", which is a different rule.
BASE["people"] += [
    {"key": "t303b", "name": SECOND, "active": True, "fn": FN},
    {"key": "t303a", "name": FIRST, "active": True, "fn": FN},
    {"key": "t330c", "name": BOTH, "active": True, "fn": FN},
]

_fn = BASE["functions"][FN]
_caps = [c for c in BASE["group"]["capabilities"] if c.get("fn") == FN]
assert _caps, "the worked example must leave one capability on " + FN
assert _fn.get("projects"), FN + " must own projects of its own"

# A SECOND BOX, made out of a project the FUNCTION owns — so the fixture moves
# rows rather than inventing them, and every id, figure and milestone in it is
# the tenant's own (§100.3: a hand-typed graph tests the fixture).
_moved = _fn["projects"].pop()
_moved["capId"] = "cap-probe-330"
BASE["group"]["capabilities"].append({
    "id": "cap-probe-330", "fn": FN, "name": "Probe Capability 330",
    "def": "Made by checks/capability-first.py.", "keyObjectives": [],
    "projects": [_moved],
})
assert _fn["projects"], FN + " must still own one project after the move"

# HIS is the box the tenant already held; the made one is somebody else's, so
# the landing cannot be "the first box under this function".
_caps[0]["projects"][0]["owner"] = SECOND
_moved["owner"] = "Somebody Else 330"
_fn["projects"][0]["owner"] = FIRST


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
        # §231.5: served as the gate serves it, or register() rejects on the
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

# WHERE THIS VIEWER WOULD LAND, worked out from the DATA rather than from the
# product's own helper — asking `capForBounded()` would be asking the thing
# under test whether it agrees with itself (§94.8).
WANT = """(who)=>{
  var caps = (GROUP.capabilities||[]).filter(c => c.fn === '%s');
  var own  = fnOwnHolder('%s');
  var mineIn = function(h){ return !!(h && (h.projects||[])
      .some(function(p){ return p.owner === who; })); };
  var mine = caps.filter(mineIn);
  return { caps: caps.map(c => c.id),
           ownIsMine: mineIn(own),
           mine: mine.map(c => c.id),
           land: mineIn(own) ? 'fn:%s'
               : mine.length === 1 ? 'cap:' + mine[0].id : 'fn:%s',
           code: mine.length === 1
             ? projCode('cap:' + mine[0].id,
                 mine[0].projects.filter(p => p.owner === who)[0]) : null };
}""" % (FN, FN, FN, FN)

# WHAT THE PAGE DREW. Read as data so a failure names what it saw rather than
# "not found" (§215: every probe degrades).
DREW = """()=>({
  bands: [...document.querySelectorAll('#panel .pband')].map(function(e){
    var c = e.querySelector('.pband-code'), r = e.getBoundingClientRect();
    return { code: c ? c.textContent.trim() : null, top: Math.round(r.top) };
  }),
  dests: [...document.querySelectorAll('#units [data-u]')].map(b=>b.dataset.u),
  winH: window.innerHeight
})"""


def side(pg, name):
    """§330: PRESS THE SIDE, NEVER THE CONTROL. The switch has three sides once
    a capability exists, so cycling it no longer toggles and a check that does
    hangs for thirty seconds on a build behaving exactly as decided (§214.3).
    `data-fold` names the side in BOTH shapes and is absent exactly when that
    side is already lit."""
    pg.evaluate("(s)=>{const b=document.querySelector('#units [data-fold=\"'+s+'\"]');"
                " if (b) b.click();}", name)
    pg.wait_for_timeout(260)


def landed(pg):
    """WHERE THE PLATFORM PUTS THEM, asked as a FRESH landing every time.
    `current` survives a viewer switch whenever the new viewer can reach
    where the old one was standing — so reading it after the office has
    navigated to his capability answers "his capability" on a build that
    decides nothing at all (§113.8, and it did: this file passed §3 for the
    wrong reason until this line existed). Nulling it is what `paintUnits()`
    itself does for an unreachable destination, so the branch under test is
    the product's own."""
    return pg.evaluate("()=>{ current = null; currentSub = null;"
                       " paint(); return current; }")


def sub(pg, word):
    """Open a page tab by the word it starts with; False rather than a throw."""
    got = pg.evaluate("""(w)=>{const b=[...document.querySelectorAll('#subtabs button')]
        .find(x=>x.textContent.trim().indexOf(w)===0); if(b){b.click();return true;} return false;}""", word)
    pg.wait_for_timeout(550)
    return got


def sect(pg, key):
    """A Strategy page's Overview and Projects are SECTIONS addressed by KEY —
    a check that asks #subtabs for them reports a page plainly there as
    missing."""
    got = pg.evaluate("""(k)=>{const b=document.querySelector('[data-sub2="'+k+'"]');
        if(b){b.click();return true;} return false;}""", key)
    pg.wait_for_timeout(500)
    return got


def as_person(pg, name):
    val = pg.evaluate("""(n)=>{var o=[...document.querySelectorAll('#asWho option')]
        .find(x=>x.textContent.indexOf(n.split(' ').slice(0,2).join(' '))===0
                 || x.textContent.indexOf(n)>=0);
        return o ? o.value : null;}""", name)
    if not val: return False
    pg.select_option("#asWho", val); pg.wait_for_timeout(1800)
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
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(400)
    want_b = pg.evaluate(WANT, SECOND)
    want_a = pg.evaluate(WANT, FIRST)
    ck("the function carries two capabilities", len(want_b["caps"]) == 2, want_b["caps"])
    # §113.8: if his were the only capability under the function, the landing
    # could be "the first box" and every assertion below would pass on a build
    # that does nothing at all.
    ck("exactly ONE of them is his", len(want_b["mine"]) == 1, want_b)
    ck("...and it is not the only box under the function",
       want_b["mine"][0] in want_b["caps"] and len(want_b["caps"]) > 1, want_b)
    ck("the identity case's project is the FUNCTION'S own, not a box's",
       want_a["ownIsMine"] and not want_a["mine"], want_a)

    print("\n§2 the office lands where somebody with no bounded role lands")
    office_land = landed(pg)
    ck("the office does not open on a capability",
       not str(office_land).startswith("cap:"), office_land)
    # and the capabilities are all reachable, which is what "nothing is
    # hidden" has to mean once a box is a destination rather than a band.
    side(pg, "caps")
    office_dests = pg.evaluate("()=>[...document.querySelectorAll('#units [data-u]')]"
                               ".map(b=>b.dataset.u).filter(x=>x.indexOf('cap:')===0)")
    ck("the office reaches every capability",
       sorted(office_dests) == sorted("cap:" + c for c in want_b["caps"]),
       [office_dests, want_b["caps"]])
    # THE OFFICE'S CODES, read on the box that is his — the comparison §5 makes.
    ck("the office opens his capability", pg.evaluate(
        "(k)=>{const b=document.querySelector('#units [data-u=\"'+k+'\"]');"
        " if(b){b.click();return true;} return false;}", want_b["land"]))
    pg.wait_for_timeout(600)
    office = {}
    for word, key in (("Strategy", "projects"), ("Reporting", "report"),
                      ("Performance", "perf")):
        if not sub(pg, word):
            ck("the office can open %s" % word, False); continue
        if key == "projects" and not sect(pg, "proj"):
            ck("the office can open Projects", False); continue
        office[key] = pg.evaluate(DREW)

    print("\n§3 the owner OPENS on the capability holding his project")
    ck("the viewer switches to him", as_person(pg, SECOND))
    his_land = landed(pg)
    ck("he lands on his own capability, not the function and not somebody "
       "else's box", his_land == want_b["land"], [his_land, want_b["land"]])
    ck("...and nothing is hidden — every capability is still a destination",
       sorted(x for x in pg.evaluate(DREW)["dests"] if x.startswith("cap:")) ==
       sorted("cap:" + c for c in want_b["caps"]) or
       # the caps side may not be the lit one after a switch; press it and ask
       (side(pg, "caps") or sorted(x for x in pg.evaluate(DREW)["dests"]
                                   if x.startswith("cap:")) ==
        sorted("cap:" + c for c in want_b["caps"])),
       pg.evaluate(DREW)["dests"])

    print("\n§4 his own work is on the first screen, and live")
    his = {}
    ck("he is on his capability", landed(pg) == want_b["land"], landed(pg))
    for word, key in (("Strategy", "projects"), ("Reporting", "report"),
                      ("Performance", "perf")):
        if not sub(pg, word):
            ck("he can open %s" % word, False); continue
        if key == "projects" and not sect(pg, "proj"):
            ck("he can open Projects", False); continue
        his[key] = pg.evaluate(DREW)
    d = his.get("report")
    if not d:
        ck("Reporting was read", False)
    else:
        mine = [x for x in d["bands"] if x["code"] == want_b["code"]]
        ck("his band is drawn", bool(mine), [want_b["code"], d["bands"]])
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
          return live; }""", want_b["code"])
        ck("and its controls are his to use", live > 0, live)

    print("\n§5 the codes do not move (§48, §330: a code is a POSITION)")
    for key in ("projects", "report", "perf"):
        if key not in his or key not in office:
            ck("%s: both sides were read" % key, False); continue
        ck("%s: he reads the same codes the office does" % key,
           sorted(x["code"] for x in his[key]["bands"]) ==
           sorted(x["code"] for x in office[key]["bands"]),
           [key, [x["code"] for x in his[key]["bands"]],
            [x["code"] for x in office[key]["bands"]]])
    ck("and his own project keeps the code its holder gives it",
       bool(his.get("report")) and want_b["code"] in
       [x["code"] for x in his["report"]["bands"]], want_b["code"])

    print("\n§6 the capability's Overview is the capability's")
    if not (sub(pg, "Strategy") and sect(pg, "found")):
        ck("he can open Overview", False)
    else:
        keys = pg.evaluate("()=>[...document.querySelectorAll('.clause dt')]"
                           ".map(d=>d.textContent.trim())")
        ck("it names the CAPABILITY, not the function",
           keys[:2] == ["Capability", "Held by"], keys)

    print("\n§7 an owner whose project is the function's own opens on the function")
    ck("the viewer switches", as_person(pg, FIRST))
    ck("he lands on the function", landed(pg) == want_a["land"],
       [landed(pg), want_a["land"]])

    print("\n§8 and two boxes of his own land on the function — the stated cost")
    # MADE HERE rather than in the fixture, so §3's shape is the one measured
    # above and this is the exception to it (§94.2) — and made AFTER the
    # switch, because §237 rebases the tab from the server on every view-as and
    # throws a page-side fixture away. §8 read `current: null` until it moved,
    # which is this file's own docstring coming true a line too early.
    ck("the viewer switches", as_person(pg, BOTH))
    pg.evaluate("""(who)=>{ (GROUP.capabilities||[])
        .filter(c=>c.fn==='%s').forEach(function(c){
          if (c.projects && c.projects[0]) c.projects[0].owner = who; });
        (FUNCTIONS['%s'].projects||[]).forEach(function(p){ p.owner = 'Nobody 330'; });
      }""" % (FN, FN), BOTH)
    pg.wait_for_timeout(200)
    both_land = landed(pg)
    ck("two of his own under one function: the function, not a guess",
       both_land == FDEST, both_land)

    ck("no page error anywhere", not errs, errs[:3])
    b.close()

print("\n%d failed" % bad)
raise SystemExit(1 if bad else 0)
