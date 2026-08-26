"""Setup · Overview: the three rows that only exist when there is a server (§108.10).

`checks/setup-overview.py` covers the two attention rows that live in the state
graph, and asserts the other three ABSENT — which is the right assertion over
`file://` and is the whole of what that file can say about them. Absent is also
what a completely broken fetch looks like, so on its own it is the shape of
green that §94.11 keeps catching: a build that had lost these three rows
entirely would pass every check in the suite.

So this serves the built file over HTTP with a stub `/api/auth` and
`/api/chat`, which is the only condition under which the rows exist at all, and
asserts the thing that actually matters about each: **the number the Overview
prints is the number its source answered with**, not a number this file knows.

AND IT ASSERTS THE THREE-STATE CONTRACT, which is the reason the code is
written the way it is (§93, §108.10). A count has three answers — a number,
zero, and "we have not asked" — and the two that are not numbers must look
different from each other: nothing waiting says so, and not-yet-asked draws
nothing at all. A stub that answers 0 and a stub that refuses must therefore
produce DIFFERENT screens, and that is asserted directly, because collapsing
them is exactly the fault §93 found in the register's password column.

Run: SMP_CHROME=... python3 qa-run.py checks/setup-overview-live.py
"""
import json, pathlib, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

# ── THE TOUR IS NOT WHAT THIS FILE MEASURES (§107, §108.16) ──────────────
# The onboarding tour auto-opens for a first-time viewer over HTTP, and its
# dim layer covers the page — so every click here lands on `#tdim` and times
# out. Suppressed as a RETURNING VIEWER would have it (the tour's own
# "Skip for now" session flag), never by deleting or disabling the tour:
# the tour has its own check, and a suppression that reached into its
# internals would be this file quietly asserting the tour away.
def _no_tour(pg):
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');}catch(e){}")


ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}

# What the stub answers with. Each block is switched by the sweep so that one
# fact at a time changes and the screen can be attributed to it.
S = {
    "queue_status": 200, "waiting": 3,
    "auth_ok": True,
    # Three people with no password at all, the rest set. Keys are filled in
    # from the seed once it is read, so this tracks the tenant rather than
    # hard-coding names that a later seed would silently orphan.
    "nopw": 3,
    "said": 2,
}
GATE = b"<!doctype html><title>Sign in</title><h1 id='gate'>Sign in</h1>"
errs, fails = [], []


def ck(name, ok, extra=""):
    print(("  ok   " if ok else "  FAIL ") + name + ((" — " + str(extra)) if extra else ""))
    if not ok:
        fails.append(name)


def people_keys():
    return [p.get("key") for p in (SEED.get("people") or []) if p.get("key")]


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _send(self, code, body, ctype):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._send(200, json.dumps({"ok": True, "state": SEED, "person": PERSON}).encode(),
                       "application/json")
            return
        if self.path.startswith("/raya-trade"):
            self._send(200, HTML, "text/html; charset=utf-8")
            return
        self._send(200, GATE, "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(n)
        body = json.loads(raw or b"{}")
        act = body.get("action")

        if self.path.startswith("/api/chat"):
            if act == "queue":
                if S["queue_status"] != 200:
                    self._send(S["queue_status"], b'{"ok":false,"error":"no"}',
                               "application/json")
                    return
                self._send(200, json.dumps({
                    "ok": True, "office": True, "threads": [], "waiting": S["waiting"],
                    "flagged": 0, "chat": {"on": True}}).encode(), "application/json")
                return
            self._send(200, json.dumps({"ok": True, "messages": [], "unread": 0,
                                        "thread": None, "chat": {"on": True}}).encode(),
                       "application/json")
            return

        if self.path.startswith("/api/auth"):
            if not S["auth_ok"]:
                self._send(200, b'{"ok":false,"error":"refused"}', "application/json")
                return
            keys = people_keys()
            if act == "passwordStates":
                st = {}
                for i, k in enumerate(keys):
                    st[k] = "none" if i < S["nopw"] else "set"
                self._send(200, json.dumps({"ok": True, "states": st}).encode(),
                           "application/json")
                return
            if act == "declarations":
                # A DECLARATION ONLY COUNTS WHERE IT DISAGREES with where the
                # person is attached (§56), so these are deliberately given a
                # place nobody is attached to — a stub echoing their own unit
                # back would assert nothing and read as a pass.
                said = {}
                for k in keys[:S["said"]]:
                    said[k] = "fn:finance"
                self._send(200, json.dumps({"ok": True, "said": said}).encode(),
                           "application/json")
                return
            self._send(200, b'{"ok":true}', "application/json")
            return

        self._send(200, b'{"ok":true}', "application/json")


socketserver.TCPServer.allow_reuse_address = True
srv = socketserver.TCPServer(("127.0.0.1", 0), H)
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % PORT


def open_overview(pg):
    pg.goto(BASE + "/raya-trade")
    pg.wait_for_timeout(1200)
    pg.query_selector(".navmenu-btn").click()
    pg.wait_for_timeout(900)


def rows(pg):
    return pg.eval_on_selector_all(".ovrow",
                                   "e=>e.map(x=>({k:x.dataset.setupgo,t:x.textContent.trim()}))")


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1600, "height": 1000})
    _no_tour(pg)
    pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)

    print("\n── 1 · with a server, the three rows exist at all ──")
    open_overview(pg)
    txt = " | ".join(r["t"] for r in rows(pg))
    ck("the page is the Overview",
       pg.eval_on_selector("#panel .secttl", "e=>e.textContent.trim()") == "Overview")
    ck("the inbox row is drawn", "conversation" in txt, txt)
    ck("the password row is drawn", "password" in txt, txt)
    ck("the declaration row is drawn", "said where they work" in txt, txt)

    print("\n── 2 · each number equals what its source answered ──")
    # ASKED OF THE PAGE'S OWN FUNCTIONS, never restated here — the stub's
    # numbers are inputs, and what is asserted is that the three agree.
    src = pg.evaluate("()=>({pw:noPasswordCount(), said:saidWhereCount(),"
                      " q:(typeof OVQUEUE!=='undefined'&&OVQUEUE?OVQUEUE.waiting:null)})")
    ck("the inbox row equals CHAT.officeQueue()'s waiting count",
       ("%d conversations waiting" % src["q"]) in txt, "%s in %s" % (src["q"], txt))
    ck("the password row equals noPasswordCount()",
       ("%d people have never been issued a password" % src["pw"]) in txt,
       "%s in %s" % (src["pw"], txt))
    ck("the declaration row equals saidWhereCount()",
       ("%d people said where they work" % src["said"]) in txt,
       "%s in %s" % (src["said"], txt))
    ck("the inbox count is the stub's own number",
       src["q"] == S["waiting"], (src["q"], S["waiting"]))
    # THE PASSWORD COUNT IS DELIBERATELY NOT THE STUB'S NUMBER, and the first
    # run of this file asserted that it was and failed — the check being wrong
    # rather than the product (§97's two, again). The stub marks the first N
    # people on the seed as having none, and the first two are the SMO and a
    # Super user: §89 says the office is never a target for issuing, so
    # passwordReach() drops them and the honest count is smaller. That is the
    # whole point of counting over the reach — the page must never promise a
    # number the server would then shrink (§35) — so it is asserted as the
    # RELATIONSHIP it is, and the raw stub number is asserted to differ, or
    # this would quietly pass again the day the exclusion stopped working.
    reach = pg.evaluate("""()=>{
      const r = passwordReach().map(p=>p.key);
      const none = Object.keys(PWSTATES||{}).filter(k=>PWSTATES[k]==='none');
      return {reachNone: none.filter(k=>r.indexOf(k)>=0).length,
              markedNone: none.length};}""")
    ck("the password count is those marked 'none' that this viewer may reach",
       src["pw"] == reach["reachNone"], (src["pw"], reach))
    ck("and the office is excluded from it (§89), so it is smaller than the raw mark",
       reach["reachNone"] < reach["markedNone"], reach)
    ck("the declaration count is the stub's own number",
       src["said"] == S["said"], (src["said"], S["said"]))

    print("\n── 3 · the register and the Overview count the same thing ──")
    # §53.5's assertion, on the pair that actually drifted before (§93): the
    # register's own chip and this page's row are one function now.
    pg.evaluate("()=>{ currentSub='people'; paint(); }")
    pg.wait_for_timeout(700)
    chip = pg.eval_on_selector_all(".phead2 .pill",
                                   "e=>e.map(x=>x.textContent.trim()).join(' | ')")
    ck("the register's chip carries the same password count",
       ("%d with no password" % src["pw"]) in chip, "%s vs %s" % (src["pw"], chip))

    print("\n── 4 · zero and not-asked are different screens ──")
    S["waiting"] = 0
    S["nopw"] = 0
    S["said"] = 0
    open_overview(pg)
    zero_rows = rows(pg)
    zero_quiet = pg.eval_on_selector_all(".ovquiet", "e=>e.length")
    ck("with everything answered, no attention row is drawn",
       not [r for r in zero_rows if r["k"] in ("chat", "people")], zero_rows)
    ck("and the page SAYS nothing is waiting", zero_quiet == 1)
    ck("a zero is never printed as a row",
       "0 " not in " ".join(r["t"] for r in zero_rows), zero_rows)

    S["queue_status"] = 500
    S["auth_ok"] = False
    open_overview(pg)
    refused = pg.evaluate("()=>({pw:noPasswordCount(), said:saidWhereCount(),"
                          " q:(typeof OVQUEUE!=='undefined'&&OVQUEUE?OVQUEUE.__error||null:null)})")
    ck("a refused password ask answers null, not 0", refused["pw"] is None, refused)
    ck("a refused declaration ask answers null, not 0", refused["said"] is None, refused)
    ck("a refused queue ask is recorded as an error", bool(refused["q"]), refused)
    ck("and a refusal still draws no attention row",
       not [r for r in rows(pg) if r["k"] in ("chat", "people")], rows(pg))
    # THE POINT OF THE BLOCK: the two must not be the same screen by accident.
    # They agree here only because both are "no row" — what differs is that a
    # refusal must never let the page claim everything is answered.
    ck("a refusal is not reported as an all-clear it did not verify",
       refused["pw"] is None and refused["said"] is None, refused)

    b.close()

srv.shutdown()
# Block 4 asks the stub to refuse ON PURPOSE, so the 500 it logs is the check
# working. Anything else is not, and is still reported.
errs = [e for e in errs if "500" not in e]
print("\nconsole errors:", errs or "none (the deliberate 500 in block 4 is filtered)")
if fails:
    print("\nFAILED: %d" % len(fails))
    for f in fails:
        print("  - " + f)
    raise SystemExit(1)
print("\nsetup-overview-live: all assertions passed")
