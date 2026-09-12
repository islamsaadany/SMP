"""A PROJECT OWNER REPORTS, AND THE BAR STOPS SAYING VIEW ONLY (S287).

qa-run: own-server — this check BUILDS the state it measures and serves it from
a stub of its own: people the register does not hold, a capability ordering
chosen so "his" and "the first one" cannot coincide. The served app cannot be
made to hold that graph, and its subject is what the CLIENT draws given a
stored one — carried into the app verbatim, so the code under test is the same
either way (§316.1).

Islam, from the running platform: "a project owner is not able to report,
despite being the project owner and in the roles and access I allowed this."

He could. Measured on the shipped build: twelve live, ENABLED controls on his
own project, a press writing the row, the server accepting the save -- and the
bar above all of it reading **View only**, with no Submit and no Save draft, so
nothing on the screen acknowledged that anything had been entered.

`repChrome`'s pill is drawn from canSpeakFor(), which asks whether this person
may SUBMIT. Rightly false for a bounded role, and the wrong two words to
describe everything they can do.

WHAT THIS ASSERTS, both ends each time (S94.2, S42):

  * the bar no longer says View only to somebody who reports here, and says
    what is true instead -- their own container, named by the code the rail
    shows, with the tally the rail shows;
  * the finished mark is a CONTROL on the project's own band, and PRESSING it
    changes REVIEW.done and nothing else (S96 -- a drawn control proves
    nothing);
  * it is the container's OWNER's: the project beside theirs offers no mark;
  * a plain reader still reads View only, and the custodian still gets Submit
    -- a build that simply deleted the pill would pass every assertion above;
  * both sides of the switch: a unit's pillar owner meets the same bar and the
    same control (S53.5), and the two are asserted to AGREE rather than to
    match a literal (S94.8);
  * the shared rule answers the same way the screen renders;
  * a CLOSED report says so to them too (S287.2) -- asserted with the lock, or
    a build saying "Submitted" over live boxes would pass;
  * and NO fill door on a plan that owes nothing (S287.3, reversing S223) --
    both ends, because a build that simply deleted the bar would pass the
    first half.

THE STATE IS MADE, not found: no demo person is named as a project's Owner
while attached to nothing else, so waiting for one means shipping this
unexercised (S94.2).

AND SINCE S309 THE MARK IS A LOCK: pressing it saves, closes the container to
the person who pressed it, and Reopen is the way back -- so this also asserts
that their own rows really do go read-only, that the neighbouring container
does not, and that the CUSTODIAN keeps every one of theirs (a build that
froze the pane would pass every "it is shut" assertion and be a second lock
nobody asked for).

SERVED OVER HTTP, AND SINCE S309 IT HAS TO BE (S94.11). The button says
"Save draft" now and CLOSES the container, so the press goes through
SYNC.saveNow and marks only if the save landed -- and over file:// SYNC is
never live, so every press answers "offline" and nothing is ever closed. A
check that opened the file would report the whole feature missing on a build
that carries it perfectly. The stub is report-saves.py's, three routes wide.
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
REFUSE = {"on": False}
FN, FDEST = "it", "fn:it"
UNIT = "mobile"

# ── THE STATE IS MADE, IN THE SEED THE STUB SERVES (S94.2) ───────────────
# No demo person is named as a project's Owner while attached to nothing
# else, so waiting for one means shipping this unexercised. It is done here
# rather than in the page because S237 rebases the tab from the server on
# every view-as switch and would throw a page-side fixture away.
BASE["access"]["powner"] = dict(BASE["access"].get("powner") or {}, a_fn_own="edit")
BASE["access"]["plowner"] = dict(BASE["access"].get("plowner") or {}, a_unit_own="edit")
# A GENUINE READER, and the demo has none: this tenant's floor is `none` on a
# unit, so somebody holding nothing has no Reporting tab at all and never
# meets the pill. Opened to VIEW, which is a real tenant's configuration and
# the one state "View only" describes.
BASE["access"]["employee"] = dict(BASE["access"].get("employee") or {}, a_unit_own="view")
BASE["people"] += [
    {"key": "t287p", "name": "Project Owner 287", "active": True},
    {"key": "t287l", "name": "Pillar Owner 287", "active": True},
    {"key": "t287r", "name": "Plain Reader 287", "active": True, "unit": UNIT},
]
# THE FUNCTION'S OWN PROJECT (§322, §330). Every `capsOfFunction(FN)[0]`
# below is `fnOwnHolder(FN)` for the same reason: it is the holder of the work
# this file is about, and it is the one a projects function has had since
# stage 1 (§53.5 — one reader, not a second answer to *whose project is this*). This reached into
# `group.capabilities` for one held by IT — true of the worked example until
# the demo was finished, and the seed now holds ONE capability, Marketing's, so
# the file died on an index rather than reporting (§214.3, §215). A supporting
# function owns its projects directly since stage 1, and that is the ordinary
# case this check is about; a capability's own owner is asserted in
# `capability-entry.py` and `milestone-fill.py`.
_own = (BASE["functions"][FN].get("projects") or [])
assert _own, "the seed's %s owns no project — this check needs one" % FN
_own[0]["owner"] = "Project Owner 287"
BASE["units"][UNIT]["items"][0]["owner"] = "Pillar Owner 287"


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
        # content type and this file's own listener counts it as the product
        # throwing.
        if self.path.startswith("/sw.js"):
            self._s(SW, "application/javascript"); return
        if self.path.startswith("/raya-trade"):
            self._s(HTML, "text/html; charset=utf-8"); return
        self._s(b"<!doctype html><title>gate</title>", "text/html; charset=utf-8")
    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        self.rfile.read(n)
        if self.path.startswith("/api/state"):
            # REFUSABLE ON PURPOSE (§309): the press saves and closes only if
            # the save LANDED, and a stub that always says yes cannot tell
            # that ordering from the other one.
            if REFUSE["on"]:
                self.send_response(500); self.send_header("Content-Length", "2")
                self.end_headers(); self.wfile.write(b"{}"); return
            self._s(b'{"ok":true}'); return
        self._s(b'{"ok":true,"unread":0,"threads":[],"chat":{"on":false},"states":{},"said":{}}')


class S(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


srv = S(("127.0.0.1", 0), H)
URL = "http://127.0.0.1:%d/raya-trade" % srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()

# ── LIVE CONTROLS INSIDE ONE PROJECT'S BAND (§309) ───────────────────────
# Scoped by walking from the band bearing the project's CODE to the next
# band. The first draft of this counted every control in the pane, which on
# a function drawing EVERY capability at once can never reach zero while any
# other project is open — so it passed on a build that froze the custodian
# too, which is the one thing these two assertions exist to tell apart
# (§94.5, §113.8). Addressed by the code the band SHOWS, because the
# custodian is drawn no `data-rowdone` to address by.
INBAND = """(code)=>{
  var band = [...document.querySelectorAll('.pane .pband')].find(function(e){
    var c = e.querySelector('.pband-code');
    return c && c.textContent.trim() === code;
  });
  if (!band) return { found:false };
  var live = 0, all = 0, n = band.nextElementSibling;
  while (n && !n.classList.contains('pband')) {
    n.querySelectorAll('[data-crep],[data-cpick],[data-cnote],[data-rep],[data-note]')
     .forEach(function(e){ all++; if (!e.disabled) live++; });
    n = n.nextElementSibling;
  }
  return { found:true, live:live, all:all,
           state:[...band.querySelectorAll('.pbdone')].map(e=>e.textContent.trim()),
           buttons:band.querySelectorAll('[data-rowdone]').length };
}"""

bad = 0
def ck(what, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("    ok   " if ok else "    FAIL ") + what + (("  — %s" % (x,)) if not ok and x != "" else ""))

def to_fn_reporting(pg):
    for _ in range(3):
        if not pg.query_selector("#units .navswitch"): break
        on = pg.eval_on_selector_all("#units .navswitch .nsw.on", "e=>e.map(x=>x.textContent.trim())")
        if on and on[0] == "Functions": break
        pg.click("#units .navswitch"); pg.wait_for_timeout(150)
    d = pg.query_selector('#units button[data-u="%s"]' % FDEST)
    if d: d.click(); pg.wait_for_timeout(300)
    open_report(pg)

def to_unit_reporting(pg):
    for _ in range(3):
        if not pg.query_selector("#units .navswitch"): break
        on = pg.eval_on_selector_all("#units .navswitch .nsw.on", "e=>e.map(x=>x.textContent.trim())")
        if on and on[0] == "Units": break
        pg.click("#units .navswitch"); pg.wait_for_timeout(150)
    d = pg.query_selector('#units button[data-u="%s"]' % UNIT)
    if d: d.click(); pg.wait_for_timeout(300)
    open_report(pg)

def open_report(pg):
    pg.evaluate("""()=>{const b=[...document.querySelectorAll('#subtabs button')]
        .find(x=>x.textContent.trim().indexOf('Performance')===0); if(b)b.click()}""")
    pg.wait_for_timeout(250)
    r = pg.query_selector('[data-s=report]')
    if r: r.click(); pg.wait_for_timeout(400)
    return bool(r)

# The bar, and what the bands offer. Read as data so an assertion can name what
# it saw rather than "not found".
BAR = """()=>{
  var box = document.querySelector('.repchrome');
  return {
    text: box ? box.innerText.replace(/\\n/g,' | ') : null,
    viewOnly: !!(box && box.querySelector('.pill.none') &&
                 /View only/.test(box.querySelector('.pill.none').textContent)),
    ownChip: box && box.querySelector('.rc-state')
               ? box.querySelector('.rc-state').textContent.trim() : null,
    submit: !!document.querySelector('[data-submit]'),
    marks: [...document.querySelectorAll('[data-rowdone]')].map(e=>e.dataset.rowdone),
    /* §309: THE WORD MOVED AND THE ASSERTION IS REWRITTEN, NOT DELETED
       (§218). It was a `.pill.good` reading "Done" while the mark was a
       signal; the mark is a LOCK now and the band says the bar's own word,
       `Draft saved`, beside a Reopen. Both are read, so a build that drew
       neither fails here rather than quietly satisfying a looser test. */
    bandState: [...document.querySelectorAll('.pband .pbdone')].map(e=>e.textContent.trim()),
    bandReopen: [...document.querySelectorAll('.pband .editbtn.reopen')].map(e=>e.textContent.trim())
  };
}"""

with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=os.environ.get("SMP_CHROME", "/opt/pw-browsers/chromium"),
                           args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1500, "height": 1400})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    # S167.2: the welcome overlay covers the viewport and eats every click,
    # and it must be suppressed BEFORE goto, not after.
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    pg.goto(URL); pg.wait_for_timeout(2600)
    ck("the stub is live, so a save can be seen at all", pg.evaluate("SYNC.isLive()"))
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(250)

    # THE FIXTURE IS IN THE SERVED STATE, NOT INJECTED INTO THE PAGE. S237
    # rebases the tab on every view-as switch — one GET, hydrate(), the
    # server's graph becomes the tab's truth — so anything written into
    # ACCESS or PEOPLE here is thrown away by the very first `#asWho`. It
    # went unnoticed while this file opened the built HTML over file://,
    # where there is no server to rebase from. So the state is made in the
    # SEED the stub serves, and survives every switch.
    ids = pg.evaluate("""() => {
      var cap = fnOwnHolder("%s");
      var u = UNITS["%s"];
      return { own: cap.projects[0].id, other: cap.projects[1].id,
               ownCode: projCode("%s", cap.projects[0]),
               otherCode: projCode("%s", cap.projects[1]),
               pillar: u.items[0].id, pillarCode: pillarCode(u, 0),
               cust: FUNCTIONS["%s"].custodian };
    }""" % (FN, UNIT, FN, FN, FN))
    print("  fixture: project %(own)s (%(ownCode)s) · beside it %(other)s (%(otherCode)s) · "
          "pillar %(pillar)s (%(pillarCode)s) · custodian %(cust)s" % ids)

    # ── 1 · THE PROJECT OWNER ────────────────────────────────────────────
    print("-- the project owner, on a supporting function")
    pg.select_option("#asWho", "t287p"); pg.wait_for_timeout(400)
    to_fn_reporting(pg)
    st = pg.evaluate(BAR)
    ck("the bar no longer says View only", not st["viewOnly"], st["text"])
    ck("it names their own project and its tally instead",
       st["ownChip"] is not None and ids["ownCode"] in (st["ownChip"] or "") and
       "entered" in (st["ownChip"] or ""), st["ownChip"])
    ck("Submit is still not drawn for them", not st["submit"])
    mine = [m for m in st["marks"] if m.split("|")[0] == ids["own"]]
    theirs = [m for m in st["marks"] if m.split("|")[0] == ids["other"]]
    ck("their own project's band carries the mark", len(mine) == 1, st["marks"])
    ck("the project beside theirs carries none — it is the owner's",
       len(theirs) == 0, st["marks"])

    # PRESSING IT, and the DATA read back (§96).
    # §215: A CHECK THAT DIES REPORTS NOTHING. The first run of this file
    # against the pre-§301 build crashed on `mine[0]` and printed 3 failures
    # where there are 8 — a falsification that undercounts itself. Everything
    # below depends on a control that build does not draw, so each is reported
    # as failing rather than allowed to raise.
    def press(addr):
        # §215: EVERY PRESS DEGRADES. A control that is not there raises after
        # thirty seconds and takes every assertion below it with it — which is
        # how this file's first run against the pre-§301 build reported three
        # failures where there are eight.
        el = pg.query_selector('[data-rowdone="%s"]' % addr)
        if not el: return False
        el.click(); pg.wait_for_timeout(500); return True

    if not mine:
        for w in ["pressing it WRITES the mark against this function",
                  "the mark records who and when",
                  "the bar now reads Done for that project",
                  "the band shows the Done pill and a way back",
                  "undoing DELETES the mark — the key goes, and the map with it"]:
            ck(w, False, "no mark control is drawn")
    else:
        before = pg.evaluate("()=>JSON.stringify(REVIEW.done||null)")
        open_all = (pg.evaluate(INBAND, ids["ownCode"]) or {}).get("all", 0)
        press(mine[0])
        after = pg.evaluate("""(id)=>({ mark: JSON.parse(JSON.stringify(
            (REVIEW.done||{})[id] || null)),
            keys: Object.keys(REVIEW.done||{}) })""", ids["own"])
        ck("pressing it WRITES the mark, keyed by the project itself",
           bool(after["mark"]) and after["keys"] == [ids["own"]],
           "before=%s after=%s" % (before, after))
        ck("the mark records who and when",
           bool(after["mark"]) and after["mark"].get("by") == "t287p" and
           bool(after["mark"].get("at")), after["mark"])
        st2 = pg.evaluate(BAR)
        ck("the bar now reads Done for that project",
           "Done" in (st2["ownChip"] or ""), st2["ownChip"])
        ck("the band says a draft was saved, and offers the way back",
           "Draft saved" in st2["bandState"] and "Reopen" in st2["bandReopen"] and
           any(m.endswith("|0") for m in st2["marks"]), st2)
        # §309: AND THE PROJECT IS REALLY SHUT — to them, and to them only.
        # A build that merely changed the word passes every assertion above.
        frz = pg.evaluate(INBAND, ids["ownCode"])
        locked = pg.evaluate("()=>!!document.querySelector('#panel.replocked')")
        # AGAINST WHAT THE BAND HELD BEFORE THE PRESS, never against zero: a
        # shut cell draws a READ-ONLY value rather than a disabled control,
        # so "no live controls" is also true of a band that has none — the
        # assertion would pass on a build that lost the whole table (§113.8).
        ck("their own project's boxes are shut — that is what the press does",
           frz.get("found") and open_all > 0 and frz["all"] == 0, 
           "before=%s after=%s" % (open_all, frz))
        ck("...and the report around it is NOT closed (§220 is the bar's, not this)",
           not locked, locked)

        # ── A SAVE THAT DID NOT LAND CLOSES NOTHING (§309) ───────────
        # §220's own first build parked before it knew, and drew a tidy
        # "Draft saved" over work that never left the browser. Worse here,
        # because the boxes go read-only behind it. Reopen first, refuse the
        # next save, and press.
        back0 = [m for m in pg.evaluate(BAR)["marks"] if m.split("|")[0] == ids["own"]]
        if back0: press(back0[0])
        REFUSE["on"] = True
        # AND THERE HAS TO BE SOMETHING TO SAVE, or `save()` answers "clean"
        # before it ever reaches the server and the press is right to close.
        # That is the product behaving correctly and it is not this case.
        pg.evaluate("()=>{ REVIEW.note = Object.assign({}, REVIEW.note);"
                    "  REVIEW.note['t302dirt'] = 'unsaved'; }")
        again = [m for m in pg.evaluate(BAR)["marks"] if m.split("|")[0] == ids["own"]]
        if again: press(again[0])
        pg.wait_for_timeout(900)
        ref = pg.evaluate(INBAND, ids["ownCode"])
        ck("a save that did not land closes nothing, and says so",
           pg.evaluate("()=>REVIEW.done===undefined") is True and
           ref.get("all", 0) > 0 and ref.get("buttons") == 1,
           ref)
        REFUSE["on"] = False
        # The 500 this section asked for is not the product throwing (§128).
        errs[:] = [e for e in errs if "500" not in e]
        pg.evaluate("()=>{ delete REVIEW.note['t302dirt']; }")

        # UNDO deletes the key rather than storing a false (§50.6). The
        # marks are RE-READ here: the refused press above deliberately left
        # the project open, so a list captured before it names a control that
        # is no longer on the page.
        st3 = pg.evaluate(BAR)
        if not any(m.endswith("|0") for m in st3["marks"]):
            m0 = [m for m in st3["marks"] if m.split("|")[0] == ids["own"]]
            if m0: press(m0[0])
            st3 = pg.evaluate(BAR)
        back = [m for m in st3["marks"] if m.split("|")[0] == ids["own"] and m.endswith("|0")]
        ck("undoing DELETES the mark — the key goes, and the map with it",
           bool(back) and press(back[0]) and
           pg.evaluate("()=>REVIEW.done===undefined") is True,
           pg.evaluate("()=>JSON.stringify(REVIEW.done||null)"))

    # ── 2 · BOTH ENDS: the shared rule ───────────────────────────────────
    # Guarded for the same reason as the presses above: on a build without the
    # shared rule this evaluate THROWS, and a check that throws reports nothing.
    both = pg.evaluate("""(o)=>({
      has: typeof SMPRules.mayMarkDone === 'function'})""", ids)
    if not both.get("has"):
        ck("both ends: the rule says theirs yes, the other no", False,
           "SMPRules.mayMarkDone does not exist")
        ck("both ends: the platform reads them as a bounded reporter", False,
           "SMPRules.mayMarkDone does not exist")
    else:
      both = pg.evaluate("""(o)=>({
        mineRule: SMPRules.mayMarkDone(world(), viewer(), 'fn', '%s',
                    fnOwnHolder('%s').projects.find(p=>p.id===o.own).owner),
        otherRule: SMPRules.mayMarkDone(world(), viewer(), 'fn', '%s',
                    fnOwnHolder('%s').projects.find(p=>p.id===o.other).owner),
        bounded: boundedHere('%s'), reports: boundedReporter('%s')
      })""" % (FDEST, FN, FDEST, FN, FDEST, FDEST), ids)
      ck("both ends: the rule says theirs yes, the other no",
         both["mineRule"] is True and both["otherRule"] is False, both)
      ck("both ends: the platform reads them as a bounded reporter",
         both["bounded"] is True and both["reports"] is True, both)

    # ── 3 · THE CUSTODIAN, unchanged ─────────────────────────────────────
    print("-- the custodian, unchanged")
    pg.select_option("#asWho", ids["cust"]); pg.wait_for_timeout(400)
    to_fn_reporting(pg)
    st = pg.evaluate(BAR)
    ck("Submit is still drawn for them", st["submit"], st["text"])
    ck("no View only pill, and no own-project chip either",
       not st["viewOnly"] and st["ownChip"] is None, st["text"])
    # ── §309: AN OWNER'S DRAFT DOES NOT SHUT THE CUSTODIAN OUT ───────────
    # The lock is the owner's own act. The custodian holds the bar's Save
    # draft for the whole function, and a second lock inside it would be two
    # ways to close one report (§53.5) — so they keep every control on that
    # project. And they SEE the state, because the signal this control exists
    # for is exactly "which projects are finished": the word, no button.
    pg.evaluate("""(id)=>{ REVIEW.done = {}; REVIEW.done[id] = {by:"t287p", at:"2026-09-07"};
        paint(); }""", ids["own"])
    pg.wait_for_timeout(300)
    cst = pg.evaluate(INBAND, ids["ownCode"])
    ck("the owner's saved draft leaves every one of the custodian's controls live",
       cst.get("found") and cst["all"] > 0 and cst["live"] == cst["all"], cst)
    ck("...and they SEE it said, with no button to press",
       "Draft saved" in cst["state"] and cst["buttons"] == 0, cst)
    pg.evaluate("()=>{ REVIEW.done = undefined; paint(); }"); pg.wait_for_timeout(250)

    # ── 4 · A PLAIN READER still reads View only ─────────────────────────
    print("-- a plain reader")
    pg.select_option("#asWho", "t287r"); pg.wait_for_timeout(400)
    to_unit_reporting(pg)
    st = pg.evaluate(BAR)
    ck("View only is still what a reader is told",
       st["viewOnly"] is True, st["text"])
    ck("and they are offered no mark", st["marks"] == [], st["marks"])

    # ── 5 · THE UNIT SIDE: a pillar owner (§53.5) ────────────────────────
    print("-- the pillar owner, on a business unit")
    pg.select_option("#asWho", "t287l"); pg.wait_for_timeout(400)
    to_unit_reporting(pg)
    st = pg.evaluate(BAR)
    ck("the bar does not say View only here either", not st["viewOnly"], st["text"])
    ck("it names their own pillar and its tally",
       st["ownChip"] is not None and ids["pillarCode"] in (st["ownChip"] or "") and
       "entered" in (st["ownChip"] or ""), st["ownChip"])
    umine = [m for m in st["marks"] if m.split("|")[0] == ids["pillar"]]
    ck("their pillar's band carries the mark", len(umine) == 1, st["marks"])
    ck("and no other pillar's does",
       len(st["marks"]) == len(umine), st["marks"])
    if umine: press(umine[0])
    ck("pressing it writes the pillar's own key",
       bool(umine) and pg.evaluate("()=>Object.keys(REVIEW.done||{})") == [ids["pillar"]],
       pg.evaluate("()=>JSON.stringify(REVIEW.done||null)"))

    # ── 6 · A CLOSED REPORT SAYS SO TO THEM TOO (§301.2) ─────────────────
    # §220 disables every control the moment the custodian submits, and the
    # word explaining it lives in the branch a bounded role never reaches —
    # so the page went grey with nothing saying why. Asserted with the LOCK,
    # or a build that said "Submitted" over live boxes would pass.
    # THE STATE IS MADE AFTER THE SWITCH, NEVER BEFORE IT. S237 rebases the
    # tab on the switch -- the server's graph becomes the tab's truth -- so a
    # "set it as the SMO, then look as them" fixture is thrown away in the
    # hop. It went unnoticed while this file opened the built HTML over
    # file://, where there is no server to rebase from. Every mid-run fixture
    # below is written while ALREADY viewing as the person it is about; none
    # needs the SMO's rights to write, because they are plain globals.
    print("-- the project owner, once the custodian has submitted")
    pg.select_option("#asWho", "t287p"); pg.wait_for_timeout(400)
    pg.evaluate("""()=>{ REVIEW.submitted = Object.assign({}, REVIEW.submitted);
        REVIEW.submitted["%s"] = true; paint(); }""" % FDEST)
    to_fn_reporting(pg)
    st = pg.evaluate(BAR)
    shut = pg.evaluate("""()=>({
      locked: !!document.querySelector('#panel.replocked'),
      liveLeft: [...document.querySelectorAll('#panel [data-cpick],#panel [data-crep],#panel [data-rowdone]')]
                  .filter(e=>!e.disabled).length })""")
    ck("the bar says the report was submitted", "Submitted" in (st["ownChip"] or ""),
       st["text"])
    ck("...and never a second word for it beside Close (§87)",
       "Closed" not in (st["text"] or ""), st["text"])
    ck("the pane really is locked, mark included",
       shut["locked"] and shut["liveLeft"] == 0, shut)

    # ── 7 · NO DOOR WHEN NOTHING IS OWED (§301.3, reversing §223) ────────
    # Islam: "it requires him to fill something empty and there is nothing
    # empty." Measured in his shape: 0 counted, 0 red Missing on the page,
    # and a red "Fill in what is empty" button — opened by milestone
    # COLLABORATORS, the one field he ruled must never count (§187, §227).
    #
    # BOTH ENDS, or a build that simply deleted the bar would pass: with a
    # real gap made, the door must still be there.
    print("-- the fill door, on a plan that owes nothing")
    pg.evaluate("""()=>{
      ACCESS.powner = Object.assign({}, ACCESS.powner, { a_fn_own_strat:"fill" });
      REVIEW.submitted = {};              /* §6 closed it; reopen for this */
      REVIEW.done = undefined;            /* §309: and its own draft too */
      paint(); }""")
    pg.wait_for_timeout(300)
    for _ in range(3):
        if not pg.query_selector("#units .navswitch"): break
        on = pg.eval_on_selector_all("#units .navswitch .nsw.on", "e=>e.map(x=>x.textContent.trim())")
        if on and on[0] == "Functions": break
        pg.click("#units .navswitch"); pg.wait_for_timeout(150)
    dd = pg.query_selector('#units button[data-u="%s"]' % FDEST)
    if dd: dd.click(); pg.wait_for_timeout(400)
    DOOR = """()=>({
      counted: gapTotal('%s'),
      redOnPage: document.querySelectorAll('#panel .missing').length,
      bar: !!document.querySelector('.missbar'),
      cta: (document.querySelector('.fillcta')||{}).textContent || null,
      blanks: (fnOwnHolder('%s').projects[0].milestones||[])
                .filter(m => SMPRules.gapEmpty('collaborators', m)).length
    })""" % (FDEST, FN)
    d1 = pg.evaluate(DOOR)
    ck("his shape is reproduced: optional blanks, nothing counted",
       d1["counted"] == 0 and d1["blanks"] > 0, d1)
    ck("nothing on the page reads Missing", d1["redOnPage"] == 0, d1)
    ck("...so there is no bar and no button asking him to fill anything",
       not d1["bar"] and d1["cta"] is None, d1)
    # AND THE OTHER END: a real gap, and the door comes back.
    pg.evaluate("""()=>{ var m = fnOwnHolder('%s').projects[0].milestones[0];
        delete m.finish; paint(); }""" % FN)
    pg.wait_for_timeout(350)
    d2 = pg.evaluate(DOOR)
    ck("a real gap brings the door back", d2["counted"] > 0 and d2["bar"] and
       "missing" in (d2["cta"] or "").lower(), d2)

    # ── 8 · THEIRS OPENS, NOT THE FIRST ONE (§301.4) ─────────────────────
    # Islam: "when the user login he should land on his project by default"
    # and "abdel azim still can't edit" — ONE fault. The pane opened on the
    # first project in the rail, which for a bounded role is somebody else's,
    # so the page he landed on was correctly read-only with nothing saying
    # why. THE FIXTURE PUTS HIS SECOND, or "his" and "the first" coincide and
    # the assertion proves nothing (§113.8).
    print("-- landing: the project that opens")
    second = pg.evaluate("""()=>{
      var cap = fnOwnHolder("%s");
      cap.projects[0].owner = "Somebody Else";        /* first is NOT his */
      cap.projects[1].owner = "Project Owner 287";    /* his is second */
      REVIEW.submitted = {};
      /* WHAT A FRESH SIGN-IN IS: nothing picked. §301.4's fallback only
         decides where the pane opens when the rail holds nothing, so a rail
         an earlier section left set would make this assertion vacuous. */
      RAIL = {};
      paint();
      return { id: cap.projects[1].id, code: projCode("%s", cap.projects[1]),
               firstCode: projCode("%s", cap.projects[0]) };
    }""" % (FN, FN, FN))
    to_fn_reporting(pg)
    land = pg.evaluate("""()=>({
      pane: (document.querySelector('.pane .pband')||{}).innerText || null,
      controls: [...document.querySelectorAll('[data-cpick],[data-crep],[data-cnote]')]
                  .filter(e=>!e.disabled).length })""")
    ck("his project opens, not the first one",
       bool(land["pane"]) and second["code"] in land["pane"] and
       second["firstCode"] not in land["pane"], land)
    ck("...so the page he lands on actually takes his figures",
       land["controls"] > 0, land)
    # AND NOTHING MOVED FOR ANYBODY UNBOUNDED — the office and the custodian
    # reach every row, so "theirs" names nothing and the first still opens.
    pg.select_option("#asWho", ids["cust"]); pg.wait_for_timeout(400)
    to_fn_reporting(pg)
    cust = pg.evaluate("()=>(document.querySelector('.pane .pband')||{}).innerText || null")
    ck("the custodian still opens on the first project — nothing moved for them",
       bool(cust) and second["firstCode"] in cust, cust)

    # ── 9 · THE UNIT MATCHES THE FUNCTION (§301.5) ───────────────────────
    # Islam, of a project owner frozen on a function: "check the behavior of
    # the units. to match." Measured on the unit's Reporting page with a
    # pillar owner: 0 entry controls, 8 read-only cells — because the pane
    # built its rows WITHOUT owner/pown, which canReportRow() reads, while
    # reportItems() (the other builder, same file) has carried them since
    # §147.7. Asserted as the two sides AGREEING, never as a count (§94.8).
    print("-- the unit side reports too, and matches the function")
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(250)
    pg.evaluate("""()=>{ REVIEW.parked = {}; REVIEW.submitted = {}; paint(); }""")
    pg.select_option("#asWho", "t287l"); pg.wait_for_timeout(400)
    to_unit_reporting(pg)
    un = pg.evaluate("""()=>({
      boxes: document.querySelectorAll('#panel [data-rep]').length,
      enabled: [...document.querySelectorAll('#panel [data-rep]')].filter(e=>!e.disabled).length,
      readOnly: document.querySelectorAll('.pane .mono').length,
      pane: (document.querySelector('.pane .pband')||{}).innerText || null })""")
    ck("the pillar owner is given entry controls on their own pillar",
       un["enabled"] > 0, un)
    ck("...and none of its cells is left read-only", un["readOnly"] == 0, un)
    # BOTH ENDS: a pillar they do NOT own still gives them nothing.
    other = pg.evaluate("""()=>{
      var u = UNITS["%s"], p = u.items.find(function(x){ return x.owner !== "Pillar Owner 287"; });
      if (!p) return null;
      RAIL[unitRailKey(u)] = p.code; paint();
      return { code: p.code,
               boxes: document.querySelectorAll('#panel [data-rep]').length }; }""" % UNIT)
    ck("the pillar beside theirs still offers nothing — the reach is per row",
       other is None or other["boxes"] == 0, other)

    # ── 10 · A SAVED DRAFT IS THEIRS TO REOPEN (§301.6) ──────────────────
    # Islam: "project owner can reopen eventually he can only report or fill
    # missing for his own project." A park froze every bounded owner with no
    # way out but the custodian. Nothing was sent, so nothing is retracted.
    # BOTH ENDS: a submission is deliberately NOT offered to them.
    print("-- a saved draft, and the way out of it")
    pg.select_option("#asWho", "t287p"); pg.wait_for_timeout(400)
    pg.evaluate("""()=>{ REVIEW.submitted = {};
        REVIEW.parked = Object.assign({}, REVIEW.parked); REVIEW.parked["%s"] = true;
        paint(); }""" % FDEST)
    to_fn_reporting(pg)
    shut = pg.evaluate("""()=>({
      bar: (document.querySelector('.repchrome')||{}).innerText.replace(/\\n/g,' | '),
      reopen: !!document.querySelector('[data-unsubmit]'),
      locked: !!document.querySelector('#panel.replocked'),
      live: [...document.querySelectorAll('#panel [data-cpick],#panel [data-crep]')]
              .filter(e=>!e.disabled).length })""")
    # innerText is the RENDERED text and .rc-state is uppercased by CSS, so
    # the comparison is case-insensitive or it asserts the stylesheet.
    ck("the bar says a draft was saved, and offers the way out",
       "draft saved" in (shut["bar"] or "").lower() and shut["reopen"], shut)
    ck("...and until it is pressed the pane really is shut",
       shut["locked"] and shut["live"] == 0, shut)
    if shut["reopen"]:
        pg.click("[data-unsubmit]"); pg.wait_for_timeout(400)
    opened = pg.evaluate("""()=>({
      parked: reportParked("%s"),
      locked: !!document.querySelector('#panel.replocked'),
      live: [...document.querySelectorAll('#panel [data-cpick],#panel [data-crep]')]
              .filter(e=>!e.disabled).length })""" % FDEST)
    ck("pressing it takes the lock off and his figures come back",
       shut["reopen"] and not opened["parked"] and not opened["locked"] and
       opened["live"] > 0, opened)
    # THE OTHER END: a SUBMITTED report offers them no way back.
    pg.evaluate("""()=>{ REVIEW.parked = {};
        REVIEW.submitted = Object.assign({}, REVIEW.submitted); REVIEW.submitted["%s"] = true;
        paint(); }""" % FDEST)
    pg.wait_for_timeout(300)
    to_fn_reporting(pg)
    sent = pg.evaluate("""()=>({
      bar: (document.querySelector('.repchrome')||{}).innerText.replace(/\\n/g,' | '),
      reopen: !!document.querySelector('[data-unsubmit]') })""")
    ck("a SUBMITTED report says so and offers them no way back",
       "submitted" in (sent["bar"] or "").lower() and not sent["reopen"], sent)

    ck("no console errors", not errs, "; ".join(errs[:3]))
    b.close()

print("\n" + ("all passed" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
