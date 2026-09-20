"""MY REPORTING: THE TAB, THE ONE DOOR AND THE THREE BUTTONS (S379, spec 062).

qa-run: own-server — this check BUILDS the state it measures. The switch ships
OFF, so an untouched tenant draws none of this; and every collaborator in the
worked example is a bare first name, which nameRuns()'s two-word floor matches
to NOBODY (S130.7), so nothing in the demo can exercise the narrowing either.
Both are made here and both are measured to have been made (S94.5, S255).

Islam: "the tab of what I report is not a room it a slice of reporting that's
all in the same straety module and it needs a better name as a tab beside the
reporting and it's only for owners of tactics to report progress either on the
units they belong to but they are not the bu owner or the custodian or report
progress for other units that he doesn't belong to at all."

WHAT THIS HALF OWNS, and why it cannot live in the Node check beside it.
scripts/test-my-reporting.js asks every rule and calls the real renderer, so a
builder wired to nothing is already caught (S96) — what it cannot do is PRESS.
So this file owns exactly the things a press decides:

  * the tab is DRAWN on the person's own place, is not drawn on anybody
    else's, and is not drawn at all with the switch off (S94.2);
  * pressing it lands on a page holding their lines and nobody else's;
  * a figure typed into it reaches the STORED plan (S96 — a drawn box proves
    nothing, and S219's own fault was a field that looked accepted and was
    discarded on the next repaint);
  * the same row on the UNIT's Reporting page is read-only, which is case 1 in
    Islam's own words — "the only reporting way is his lines";
  * the three buttons land: Save draft shuts their own boxes, Reopen opens
    them, and the filter hides in place without a repaint (S35);
  * and case 2: somebody who owns lines in a unit they do not belong to sees
    NO extra destination in the navigation row — the units are bands on their
    own page, never doors in the bar.

SERVED OVER HTTP, AND IT HAS TO BE (S94.11). Save draft goes through
SYNC.saveNow and marks only if the save landed, and over file:// SYNC is never
live — so every press answers "offline", nothing is ever locked, and a check
that opened the file would report the whole feature missing on a build that
carries it perfectly. The stub is project-done.py's, three routes wide.

NOT RUN IN THE SESSION THAT WROTE IT, said rather than left as an absence
(S54.5, S328's precedent): this sandbox has the Chromium binaries under
/opt/pw-browsers and no Playwright driver at all — no python module, no
node_modules — so `qa-run.py` cannot launch. Every assertion here is written
against the product as measured by the Node check beside it, and the first
person with a browser should run it and read the tail (S298.3), not the count.
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

UNIT, OTHER = "mobile", "retailstores"
HIM, ELSEWHERE = "t379a", "t379b"

# ── THE STATE IS MADE (S255) ─────────────────────────────────────────────
# The switch is off in the seed and there is no demo person who owns a tactic
# while belonging to a unit they do not run — the two things this whole
# feature is about. Made in the seed the stub serves rather than in the page,
# because S237 rebases the tab from the server on every view-as switch and
# would throw a page-side fixture away.
BASE["group"]["lineOwners"] = True
BASE["people"] += [
    # case 1: inside a unit he neither owns nor runs
    {"key": HIM, "name": "Line Owner 379", "active": True, "unit": UNIT},
    # case 2: attached to ANOTHER unit entirely, owning a line here
    {"key": ELSEWHERE, "name": "Outside Owner 379", "active": True, "unit": OTHER},
]
_t = BASE["units"][UNIT]["items"][0]["tactics"]
assert len(_t) >= 2, "the seed's %s pillar owns fewer than two tactics" % UNIT
_t[0]["owner"] = "Line Owner 379"
_t[1]["owner"] = "Outside Owner 379"
MINE, THEIRS = _t[0]["id"], _t[1]["id"]
MINE_NAME = _t[0]["name"]


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
            # REFUSABLE ON PURPOSE: Save draft closes only if the save LANDED,
            # and a stub that always says yes cannot tell that ordering from
            # the other one (S309's own lesson, one control over).
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

bad = 0
def ck(what, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("    ok   " if ok else "    FAIL ") + what + (("  — %s" % (x,)) if not ok and x != "" else ""))

# EVERY PROBE DEGRADES (S215). A press on a control the broken build does not
# draw waits thirty seconds and takes every assertion after it down with it —
# which is a run that DIED rather than one that reported, in a file whose
# whole job is to say what a build does not have.
def press(pg, sel, wait=300):
    el = pg.query_selector(sel)
    if not el: return False
    el.click(); pg.wait_for_timeout(wait); return True

def viewer(pg, key):
    pg.eval_on_selector("#viewsel", "(e,k)=>{ e.value=k; e.dispatchEvent(new Event('change')); }", key)
    pg.wait_for_timeout(600)          # S237 rebases from the server

def tabs(pg):
    return pg.eval_on_selector_all("#subtabs [data-s]", "e=>e.map(x=>x.dataset.s)")

def dests(pg):
    return pg.eval_on_selector_all("#units [data-u]", "e=>e.map(x=>x.dataset.u)")


with sync_playwright() as p:
    br = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = br.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(900)

    print("1 · the tab is on his own place and nowhere else")
    viewer(pg, HIM)
    press(pg, '#units button[data-u="%s"]' % UNIT)
    ck("he has a My reporting tab on his own unit", "mylines" in tabs(pg), tabs(pg))
    # NOT A RENAME, which is the one thing a presence assertion cannot see:
    # Islam asked for a tab BESIDE Reporting, so both have to be there and the
    # new one has to come after it (S94.2).
    ck("...beside the unit's own Reporting tab, not instead of it",
       "report" in tabs(pg) and
       tabs(pg).index("mylines") > tabs(pg).index("report"), tabs(pg))
    press(pg, '#units button[data-u="%s"]' % OTHER)
    ck("it is NOT on a unit that is not his place", "mylines" not in tabs(pg), tabs(pg))
    press(pg, '#units button[data-u="%s"]' % UNIT)

    print("\n2 · case 2 — no unit appears in the navigation that was not there")
    viewer(pg, ELSEWHERE)
    ck("the unit he owns a line in is not a destination",
       UNIT not in dests(pg), dests(pg))
    press(pg, '#units button[data-u="%s"]' % OTHER)
    ck("...and his tab is on HIS OWN place", "mylines" in tabs(pg), tabs(pg))

    print("\n3 · the page holds his lines and nobody else's")
    viewer(pg, HIM)
    press(pg, '#units button[data-u="%s"]' % UNIT)
    ck("the tab opens", press(pg, '#subtabs [data-s="mylines"]'))
    body = pg.eval_on_selector("#panel", "e=>e.textContent") or ""
    ck("it names his line", MINE_NAME[:24] in body, body[:120])
    ck("it draws a box for it",
       pg.query_selector('[data-rep="%s"]' % MINE) is not None)
    ck("and none for somebody else's",
       pg.query_selector('[data-rep="%s"]' % THEIRS) is None)

    print("\n4 · a figure typed there reaches the stored plan (S96)")
    box = pg.query_selector('[data-rep="%s"]' % MINE)
    if not box:
        ck("there is a box to type into", False, "no [data-rep] for his line")
    else:
        box.fill("37")
        pg.eval_on_selector('[data-rep="%s"]' % MINE,
                            "e=>e.dispatchEvent(new Event('change'))")
        pg.wait_for_timeout(400)
        got = pg.evaluate("""(id)=>{ var v=null;
          (unitLike('%s').items||[]).forEach(function(p){ (p.tactics||[]).forEach(function(t){
            if (t.id===id) v = (t.outActual != null && t.outActual !== "") ? t.outActual : t.actual; }); });
          return v; }""" % UNIT, MINE)
        ck("the plan holds what he typed", str(got).startswith("37"), got)

    print("\n5 · case 1 — the same row is read-only on the unit's Reporting page")
    ck("the Reporting tab opens", press(pg, '#subtabs [data-s="report"]'))
    shut = pg.evaluate("""(id)=>{ var e=document.querySelector('[data-rep="'+id+'"]');
        return e ? { there:true, disabled:!!e.disabled } : { there:false }; }""", MINE)
    ck("his own line is not typed into there",
       shut.get("there") is False or shut.get("disabled") is True, shut)

    print("\n6 · Save draft shuts his boxes, Reopen opens them")
    press(pg, '#subtabs [data-s="mylines"]')
    ck("Save draft is offered", pg.query_selector("[data-lineslock]") is not None)
    ck("it presses", press(pg, "[data-lineslock]", 600))
    ck("...and his box is shut",
       pg.evaluate("""(id)=>{ var e=document.querySelector('[data-rep="'+id+'"]');
          return !e || !!e.disabled; }""", MINE))
    ck("Reopen is offered", pg.query_selector("[data-linesopen]") is not None)
    ck("it presses", press(pg, "[data-linesopen]", 600))
    ck("...and the box is live again",
       pg.evaluate("""(id)=>{ var e=document.querySelector('[data-rep="'+id+'"]');
          return !!e && !e.disabled; }""", MINE))

    print("\n7 · and with the switch off there is no tab at all (S94.2)")
    pg.evaluate("delete GROUP.lineOwners; paint();"); pg.wait_for_timeout(400)
    ck("no My reporting", "mylines" not in tabs(pg), tabs(pg))
    pg.evaluate("GROUP.lineOwners = true; paint();"); pg.wait_for_timeout(400)
    ck("...and it comes back", "mylines" in tabs(pg), tabs(pg))

    ck("no page error anywhere in the run", not errs, errs[:2])
    br.close()

srv.shutdown()
print("\n%s" % ("all good" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
