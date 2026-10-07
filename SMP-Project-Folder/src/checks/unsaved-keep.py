"""UNSAVED CHANGES ARE KEPT, SENT, RESENT, AND WORKED THROUGH (§504).

qa-run: own-server — this check SERVES the built file itself with a stub it
programs (a failing save, a send that fails, a clash). The served app cannot be
told to fail on demand; the server half is smp-app/checks/unsaved-lines.mjs.

Islam: a save that FAILS (the server or the network, never a refusal) must not
cost the work. Asserted as the problem, never the wording alone (§94.8):

  1  a 500 keeps the changed lines ON THIS COMPUTER and says so in the calm
     amber bar — never the red refusal list — with one ghost button, placed
     right after the message;
  2  the button sends the lines (not the whole plan) and the bar says the
     office has a copy; a send that fails says the platform is down;
  3  a save that lands clears what was kept AND tells the office each report
     landed — and the bar goes (§35: a warning that outlives its cause);
  4  opening the platform again resends what was kept: the next save CARRIES
     it, and a green line says the earlier changes are saved;
  5  a kept line whose place somebody else changed meanwhile is a CLASH: never
     applied silently; Keep mine posts it, Keep theirs drops it;
  6  a kept record belongs to the person who made it — somebody else signing in
     at this computer is not handed it;
  7  the office's page lists the lines, groups two answers to one line as
     "Two people sent this", and Apply / Discard post the line's id;
  8  over file:// none of it exists.

Both ends every time (§94.2). --break is not used: falsify from the SOURCES
(§276) with SMP_BUILT pointing at a doctored build.

Run: SMP_CHROME=... python3 qa-run.py checks/unsaved-keep.py
"""
import json, os, pathlib, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
BUILT = os.environ.get("SMP_BUILT") or str(ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")
HTML = pathlib.Path(BUILT).read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PEOPLE = {"smo": {"key": "smo", "name": "Mohamed Essam", "role": "super"},
          "own_mob": {"key": "own_mob", "name": "Mobile owner", "role": ""}}
GATE = b"<!doctype html><title>Sign in</title><h1 id='gate'>Sign in</h1>"

S = {"who": "smo", "save": 200, "send": 200, "state": None, "lines": []}
POSTS = []
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)[:300]) if not ok and x != "" else ""))


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _s(self, c, b, t="application/json"):
        self.send_response(c)
        self.send_header("Content-Type", t)
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self):
        if self.path.startswith("/api/state"):
            if "unsaved=1" in self.path:
                self._s(200, json.dumps({"ok": True, "lines": S["lines"]}).encode())
                return
            self._s(200, json.dumps({"ok": True, "state": S["state"] or SEED, "person": PEOPLE[S["who"]]}).encode())
            return
        if self.path.startswith("/raya-trade"):
            self._s(200, HTML, "text/html; charset=utf-8")
            return
        if self.path == "/sw.js":
            self._s(200, b"", "application/javascript")
            return
        self._s(200, GATE, "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(n)
        try:
            body = json.loads(raw or b"{}")
        except Exception:
            body = {}
        if not self.path.startswith("/api/state"):
            self._s(200, b'{"ok":true}')
            return
        POSTS.append(body)
        if "unsaved" in body:
            if body["unsaved"] == "send":
                if S["send"] != 200:
                    self._s(S["send"], b'{"ok":false,"error":"down"}')
                    return
                self._s(200, json.dumps({"ok": True, "report": "11111111-1111-1111-1111-111111111111",
                                         "lines": len(body.get("lines") or [])}).encode())
                return
            self._s(200, b'{"ok":true}')
            return
        if S["save"] != 200:
            self._s(S["save"], json.dumps({"ok": False, "error": "boom", "ref": "R1", "reason": "x"}).encode())
            return
        self._s(200, b'{"ok":true}')


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % PORT


def bar(pg):
    return pg.evaluate("""() => { const e = document.getElementById('unsaved');
      if (!e || e.hidden) return null;
      const m = e.querySelector('.safety-msg'), b = e.querySelector('[data-unsaved-send]');
      return { text: e.textContent.replace(/\\s+/g,' ').trim(), done: e.classList.contains('done'),
               clash: e.hasAttribute('data-clash'),
               gap: (m && b) ? Math.round(b.getBoundingClientRect().left - m.getBoundingClientRect().right) : null,
               btn: b ? b.className : null, refused: !document.getElementById('refused').hidden }; }""")


def kept(pg):
    return pg.evaluate("""() => { try { return JSON.parse(localStorage.getItem('smp.unsaved.raya-trade') || 'null'); } catch (e) { return 'ERR'; } }""")


def change(pg, mark):
    pg.evaluate("GROUP.org = %s; paint();" % json.dumps(mark))
    pg.wait_for_timeout(1500)


def press(pg, sel):
    """§215: a press on a control that is not there reports, never dies."""
    try:
        pg.click(sel, timeout=3000)
        return True
    except Exception as e:
        ck("press " + sel, False, str(e).split("\n")[0])
        return False


def record(pg, value, base=None):
    """A kept record made the way the product makes one: SMPDiff splits the
    change and base is what the graph held (or a stated older value)."""
    return pg.evaluate("""([v, b]) => { const g = SYNC.graph(), m = JSON.parse(JSON.stringify(g)); m.group.org = v;
      const lines = SMPDiff.splitLines(SMPDiff.graphChanges(g, m)).map(l => ({ addr: l.addr, change: l.change, mine: l.mine,
        base: b === null ? SMPDiff.valueAt(g, l) : { has: true, value: b } }));
      return { who: 'smo', at: 1, kind: 'server', error: 'x', reports: [], clash: [], lines }; }""", [value, base])


def saves():
    return [p for p in POSTS if "unsaved" not in p]


def fresh(cx):
    pg = cx.new_page()
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto(URL)
    pg.wait_for_function("() => typeof SYNC !== 'undefined' && SYNC.isLive && SYNC.isLive()", timeout=20000)
    pg.wait_for_timeout(600)
    return pg


with sync_playwright() as p:
    b = p.chromium.launch()
    cx = b.new_context(viewport={"width": 1440, "height": 900})
    pg = fresh(cx)

    print("── 1 · a failed save is kept on this computer")
    S["save"] = 500
    change(pg, "Kept org name")
    r = bar(pg)
    ck("the amber bar is up", bool(r), r)
    ck("…saying the changes are safe on this computer", bool(r) and "safe on this computer" in r["text"], r)
    ck("…never the red refusal list", bool(r) and not r["refused"], r)
    ck("…with one ghost button to the office", bool(r) and r["btn"] and "ghost" in r["btn"], r)
    ck("…placed right after the message, not across the bar", bool(r) and r["gap"] is not None and 0 <= r["gap"] <= 40, r and r["gap"])
    k = kept(pg)
    ck("the changed lines are in this computer's storage, for this person",
       isinstance(k, dict) and k.get("who") == "smo" and any("org" in json.dumps(l.get("change")) for l in k.get("lines", [])), k)
    ck("…with what the server held when it was typed", isinstance(k, dict) and all("base" in l for l in k.get("lines", [])), k)

    print("── 2 · sending to the office")
    S["send"] = 200
    press(pg, "[data-unsaved-send]")
    pg.wait_for_timeout(700)
    r = bar(pg)
    ck("a send that lands says the office has a copy", bool(r) and "office has a copy" in r["text"], r)
    ck("…and offers no second send of the same changes", bool(r) and r["btn"] is None, r)
    sent = [x for x in POSTS if x.get("unsaved") == "send"]
    ck("the send carried LINES, never the whole plan",
       bool(sent) and all(set(l) <= {"addr", "change", "base"} for l in sent[-1]["lines"]) and "state" not in sent[-1], sent and sent[-1])
    k = kept(pg)
    ck("…and the report is remembered on this computer", isinstance(k, dict) and k.get("reports"), k)
    # the office's copy does not hold a NEWER change, so the button comes back
    change(pg, "Kept org name 2")
    r = bar(pg)
    ck("a new change brings the button back", bool(r) and r["btn"] is not None and "safe on this computer" in r["text"], r)
    S["send"] = 500
    press(pg, "[data-unsaved-send]")
    pg.wait_for_timeout(700)
    r = bar(pg)
    ck("a send that fails says the platform is down, and keeps the changes", bool(r) and "down right now" in r["text"] and kept(pg), r)
    ck("…and offers no second send to fail again", bool(r) and r["btn"] is None, r)
    change(pg, "Kept org name 3")
    ck("…not even after another change, while it is down", (bar(pg) or {}).get("btn") is None, bar(pg))

    print("── 3 · the save lands")
    S["save"] = 200
    pg.wait_for_timeout(6500)
    r = bar(pg)
    ck("the bar goes once a save lands", r is None, r)
    ck("what was kept is cleared", kept(pg) is None, kept(pg))
    landed = [x for x in POSTS if x.get("unsaved") == "landed"]
    ck("the office is told the report landed", any(x.get("report") == "11111111-1111-1111-1111-111111111111" for x in landed), landed)
    pg.close()

    print("── 4 · opening again resends what was kept")
    pg = cx.new_page()
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto(URL)
    pg.wait_for_function("() => typeof SYNC !== 'undefined' && SYNC.isLive && SYNC.isLive()", timeout=20000)
    rec = record(pg, "From last time")
    ck("the fixture is the product's own line shape", len(rec["lines"]) == 1, rec)
    pg.evaluate("r => localStorage.setItem('smp.unsaved.raya-trade', JSON.stringify(r))", rec)
    before = len(saves())
    pg.reload()
    pg.wait_for_function("() => typeof SYNC !== 'undefined' && SYNC.isLive && SYNC.isLive()", timeout=20000)
    pg.wait_for_timeout(2500)
    after = saves()[before:]
    ck("the next save carries the kept change", any(json.dumps(x).find("From last time") >= 0 for x in after), [json.dumps(x)[:200] for x in after])
    r = bar(pg)
    ck("…and a green line says the earlier change is saved", bool(r) and r["done"] and "earlier change is saved" in r["text"], r)
    ck("…and nothing is left kept", kept(pg) is None, kept(pg))

    print("── 5 · a clash is the person's to decide")
    rec2 = record(pg, "Mine", "Something older")
    pg.evaluate("r => localStorage.setItem('smp.unsaved.raya-trade', JSON.stringify(r))", rec2)
    before = len(saves())
    pg.reload()
    pg.wait_for_function("() => typeof SYNC !== 'undefined' && SYNC.isLive && SYNC.isLive()", timeout=20000)
    pg.wait_for_timeout(2000)
    r = bar(pg)
    ck("a clash is never applied silently", not any("Mine" in json.dumps(x) for x in saves()[before:]), saves()[before:])
    ck("…the bar asks", bool(r) and r["clash"] and "clash" in r["text"], r)
    press(pg, "[data-unsaved-clash=mine]")
    pg.wait_for_timeout(1500)
    ck("Keep mine posts it", any('"Mine"' in json.dumps(x) for x in saves()[before:]), [json.dumps(x)[:160] for x in saves()[before:]])
    pg.evaluate("r => localStorage.setItem('smp.unsaved.raya-trade', JSON.stringify(r))", rec2)
    before = len(saves())
    pg.reload()
    pg.wait_for_function("() => typeof SYNC !== 'undefined' && SYNC.isLive && SYNC.isLive()", timeout=20000)
    pg.wait_for_timeout(1500)
    press(pg, "[data-unsaved-clash=theirs]")
    pg.wait_for_timeout(1500)
    ck("Keep theirs drops it", not any('"Mine"' in json.dumps(x) for x in saves()[before:]) and kept(pg) is None, kept(pg))
    ck("…and the bar goes", bar(pg) is None, bar(pg))

    print("── 6 · somebody else at this computer")
    pg.evaluate("r => localStorage.setItem('smp.unsaved.raya-trade', JSON.stringify(r))", rec)
    S["who"] = "own_mob"
    before = len(saves())
    pg.reload()
    pg.wait_for_timeout(2500)
    ck("another person is not handed the kept change", not any("From last time" in json.dumps(x) for x in saves()[before:]))
    ck("…and is shown no bar for it", bar(pg) is None, bar(pg))
    S["who"] = "smo"
    pg.evaluate("localStorage.removeItem('smp.unsaved.raya-trade')")
    pg.close()

    print("── 7 · the office's page")
    S["lines"] = [
        {"id": "aaaaaaaa-0000-0000-0000-000000000001", "report": "r1", "by": "own_mob", "byName": "Mobile owner",
         "at": "2026-10-07T09:00:00Z", "addr": "p:group.org", "change": {"set": {"group.org": "A"}},
         "mine": {"has": True, "value": "A"}, "base": None, "now": {"has": True, "value": "Now"}, "error": "HTTP 500"},
        {"id": "aaaaaaaa-0000-0000-0000-000000000002", "report": "r2", "by": "smo", "byName": "Mohamed Essam",
         "at": "2026-10-07T09:05:00Z", "addr": "p:group.org", "change": {"set": {"group.org": "B"}},
         "mine": {"has": True, "value": "B"}, "base": None, "now": {"has": True, "value": "Now"}, "error": "HTTP 500"},
        {"id": "aaaaaaaa-0000-0000-0000-000000000003", "report": "r3", "by": "own_mob", "byName": "Mobile owner",
         "at": "2026-10-07T09:06:00Z", "addr": "p:group.aspiration", "change": {"set": {"group.aspiration": "C"}},
         "mine": {"has": True, "value": "C"}, "base": None, "now": {"has": True, "value": "Old"}, "error": "HTTP 500"}]
    pg = fresh(cx)
    has = pg.evaluate("() => SETUP_DEFS ? null : null") if False else None
    pg.evaluate("() => { const b = document.querySelector('[data-setupgo=\"unsaved\"]'); if (b) b.click(); else { current = 'setup'; currentSub = 'unsaved'; paint(); } }")
    pg.wait_for_selector("table.hist.uns", timeout=8000)
    info = pg.evaluate("""() => ({ rows: document.querySelectorAll('table.uns tbody tr[data-uns-row]').length,
      grp: [...document.querySelectorAll('table.uns tr.grp')].map(t => t.textContent),
      use: [...document.querySelectorAll('[data-uns-apply]')].map(b => b.textContent),
      title: (document.querySelector('.setuphead, h2') || {}).textContent || '',
      inRail: !!document.querySelector('[data-setupgo="unsaved"]') })""")
    ck("the page is in the office's rail", info["inRail"], info)
    ck("every open line is a row", info["rows"] == 3, info)
    ck("two answers to one line are one group", len(info["grp"]) == 1 and "Two people sent this" in info["grp"][0], info)
    ck("…each offered as Use <who>", sum(1 for u in info["use"] if u.startswith("Use ")) == 2, info)
    ck("a single line offers Apply", "Apply" in info["use"], info)
    n0 = len(POSTS)
    press(pg, '[data-uns-apply="aaaaaaaa-0000-0000-0000-000000000003"]')
    pg.wait_for_timeout(600)
    ap = [x for x in POSTS[n0:] if x.get("unsaved") == "apply"]
    ck("Apply posts the line's id", ap and ap[0].get("id") == "aaaaaaaa-0000-0000-0000-000000000003", POSTS[n0:])
    n0 = len(POSTS)
    press(pg, "[data-uns-discard-all]")
    pg.wait_for_timeout(600)
    ds = sorted(x.get("id") for x in POSTS[n0:] if x.get("unsaved") == "discard")
    ck("Discard on the group discards both answers", ds == ["aaaaaaaa-0000-0000-0000-000000000001", "aaaaaaaa-0000-0000-0000-000000000002"], ds)
    S["lines"] = []
    pg.evaluate("UNSAVED.load()")
    pg.wait_for_timeout(500)
    ck("an empty list says nothing is waiting", "Nothing is waiting" in pg.inner_text("[data-uns-page]"))
    pg.close()

    print("── 7b · not the office's? no page")
    S["who"] = "own_mob"
    pg = fresh(cx)
    # asked of the product's OWN reachability rule (shell's reachable()), never
    # of the rail, which is not drawn while the person stands somewhere else —
    # an absence over a rail that was never drawn proves nothing (§113.8).
    has = "() => reachable(setupDefsAll(), TARGET).some(d => d.k === 'unsaved')"
    ck("somebody who is not the office has no Unsaved changes page", pg.evaluate(has) is False, pg.evaluate(has))
    S["who"] = "smo"
    pg.close()
    pg = fresh(cx)
    ck("…and the office does (the other end)", pg.evaluate(has) is True, pg.evaluate(has))
    S["who"] = "smo"
    pg.close()

    print("── 8 · over file://")
    pg = cx.new_page()
    pg.goto("file://" + BUILT)
    pg.wait_for_timeout(800)
    pg.evaluate("GROUP.org = 'x'; paint();")
    pg.wait_for_timeout(1200)
    ck("nothing is kept or said over file://", bar(pg) is None and kept(pg) is None, (bar(pg), kept(pg)))
    b.close()

print("all good" if not bad else "%d FAILED" % bad)
