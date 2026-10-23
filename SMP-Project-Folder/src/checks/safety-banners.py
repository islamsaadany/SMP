"""THE PAGE WARNS BEFORE A SAVE CAN BE LOST (§258).

qa-run: own-server — this check SERVES the built file itself, with a stub it
programs (a failing save, a stale build, a second person landing). The served
app cannot be told to fail on demand, so re-pointing it would measure something
else; the client under test is `sync.js`, carried into the new app verbatim, and
the new app's own end is asserted in smp-app/checks (§316.1).

Islam, after a reporting round in which people lost work twice over: *"can we
have some sort of mid page warning like the error and network issue in case
the person is saving with someone opening the same thing … with clear action
so we can know what to do?"*

Two cautions in the banner slot the refusal already uses (§32, §171):

  1 · A NEWER VERSION IS READY — a tab still running the build from before a
      save-protocol fix is the shape of the live incident (§216/§234, and
      migration 040's reason). The service worker claims its clients on
      activate, so an open tab hears of a deploy through `controllerchange`.
  2 · SOMEBODY ELSE UPDATED THIS PAGE — `change_log` already holds who landed
      what and when (§42); the tab asks about its own page and names them.

WHAT IS ASSERTED IS THE PROBLEM, NOT THE WORDING (§94.8):

  * the tab ASKS the server about its page, scoped to that page and to the
    moment it loaded — a peek that asks about everything is noise;
  * §588: a landing by somebody else is TAKEN IN, not announced — the tab
    fetches the server's copy, their change is on the screen, no caution is
    drawn, and the next peek asks from that landing onward;
  * a line this tab has typed and not yet saved SURVIVES the merge and is
    saved against the new baseline by itself;
  * the same cell changed by both is a CLASH: the screen shows theirs,
    §504's bar asks Keep mine / Keep theirs, and Keep mine puts it back and
    saves it;
  * nothing is merged while a hand is in a field; it is merged on blur;
  * the version caution offers Reload, which saves first and reloads only on
    the server's word; a save that fails keeps the page;
  * the listener for a new worker is armed over HTTP;
  * and over `file://` nothing is drawn and nothing is asked (§94.11 — there
    is no server to be stale against).

THE STUB IS A SERVER, NOT A RECORDING (§100.3): it holds a graph, applies
every change list a POST carries onto it (set, del, rows and §588's lists,
the same way lib/graph-diff.js does) and serves that graph back — because
the merge takes the server's copy, and a stub that forgot what it was sent
would make a correct merge read as a revert.

OVER HTTP WITH A STUB, because none of this exists over `file://`; the stub
records every peek so "it asked" is a measurement and not an inference.

Run: SMP_CHROME=... python3 qa-run.py checks/safety-banners.py
"""
import json, os, re, pathlib, threading, http.server, socketserver, urllib.parse
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
# SMP_HTML points the check at another build — how it is proved able to fail
# against the file shipped before §258 (§94.5).
HTML_PATH = pathlib.Path(os.environ.get("SMP_HTML") or
                         (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html"))
HTML = HTML_PATH.read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
STATE = json.loads(json.dumps(SEED))     # what the stub "stores"; changed mid-run
# §588.1: the stub numbers its saves once MODE["seq"] is on — the full read
# then carries `seq`, a POST appends to SAVES, and `?after=N` answers from it.
MODE = {"seq": False}
SAVES = []
SEQN = [0]


def land(changes, by="Hala Ibrahim", at="2026-09-02T10:00:00.000Z"):
    """Somebody else's save: applied to the stub's graph and numbered."""
    if not changes.get("full"):                # too large to carry: STATE was changed by hand
        apply_changes(STATE, changes)
    SEQN[0] += 1
    SAVES.append({"seq": SEQN[0], "by": by, "byKey": "x", "at": at, "changes": changes})
    return SEQN[0]


def _host(state, at):
    seg = at.split(".")
    return state[seg[0]][seg[1]] if len(seg) == 2 else state[seg[0]]


def _by_id(lst, i):
    for r in lst or []:
        if isinstance(r, dict) and str(r.get("id")) == str(i):
            return r
    return None


def apply_changes(state, ch):
    """lib/graph-diff.js applyChanges, in enough Python for the shapes a check
    sends: part paths, row field edits, and §588's list operations."""
    for pth, v in (ch.get("set") or {}).items():
        parts = pth.split("."); h = state
        for k in parts[:-1]:
            h = h.setdefault(k, {})
        h[parts[-1]] = v
    for op in ch.get("lists") or []:
        h = _host(state, op["at"]); path = op.get("path") or []
        for q in range(0, len(path), 2):
            h = _by_id(h[path[q]], path[q + 1])
        lst = list(h.get(op["list"]) or [])
        drop = set(str(x) for x in (op.get("drop") or []))
        lst = [r for r in lst if str(r.get("id")) not in drop]
        for a in op.get("add") or []:
            if _by_id(lst, a["row"]["id"]):
                continue
            ids = [str(r.get("id")) for r in lst]; after = a.get("after")
            if after is None:
                lst.insert(0, a["row"])
            elif str(after) in ids:
                lst.insert(ids.index(str(after)) + 1, a["row"])
            else:
                lst.append(a["row"])
        if op.get("order"):
            have = {str(r.get("id")): r for r in lst}; nxt = []
            for i in op["order"]:
                if str(i) in have and have[str(i)] not in nxt:
                    nxt.append(have[str(i)])
            nxt += [r for r in lst if r not in nxt]; lst = nxt
        h[op["list"]] = lst
    for e in ch.get("rows") or []:
        h = _host(state, e["at"]); path = e.get("path") or []
        for q in range(0, len(path), 2):
            h = _by_id(h[path[q]], path[q + 1] if q + 1 < len(path) else e.get("id"))
        for k, v in (e.get("set") or {}).items():
            h[k] = v
        for k in e.get("del") or []:
            h.pop(k, None)
    for pth in ch.get("del") or []:
        parts = pth.split("."); h = state
        for k in parts[:-1]:
            h = h.get(k) or {}
        h.pop(parts[-1], None)
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
GATE = b"<!doctype html><title>Sign in</title><h1 id='gate'>Sign in</h1>"

# What the stub answers a peek with, and what it saw. Changed mid-run.
PEEK = {"changed": []}
SEEN = {"peeks": [], "loads": 0, "posts": 0, "post_status": 200}
# The server's clock, deliberately unlike the browser's (§258.1).
STUB_NOW = "2026-09-02T09:00:00.000Z"
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
            if "after" in q:
                after = int(q["after"][0])
                SEEN.setdefault("afters", []).append({"after": after, "q": q})
                page = [x for x in SAVES if x["seq"] > after]
                self._s(200, json.dumps({"ok": True, "seq": page[-1]["seq"] if page else after,
                                         "oldest": SAVES[0]["seq"] if SAVES else None,
                                         "more": False, "changes": page}).encode(), "application/json")
                return
            if "since" in q:
                SEEN["peeks"].append({"since": q["since"][0], "target": q.get("target", [""])[0],
                                      "sync": "sync" in q})
                if "sync" in q:
                    self._s(200, json.dumps({"ok": True, "changed": [], "now": STUB_NOW}).encode(),
                            "application/json")
                    return
                self._s(200, json.dumps({"ok": True, "changed": PEEK["changed"]}).encode(),
                        "application/json")
                return
            SEEN["states"] = SEEN.get("states", 0) + 1
            full = {"ok": True, "state": STATE, "person": PERSON}
            if MODE["seq"]:
                full["seq"] = SEQN[0]
            self._s(200, json.dumps(full).encode(), "application/json")
            return
        if self.path.startswith("/raya-trade"):
            import time; SEEN["loads"] += 1; SEEN["load_at"] = time.time()
            self._s(200, HTML, "text/html; charset=utf-8")
            return
        self._s(200, GATE, "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(n).decode("utf-8", "replace")
        SEEN.setdefault("bodies", []).append(body)
        if not self.path.startswith("/api/state"):
            self._s(200, b'{"ok":true}', "application/json")
            return
        SEEN["posts"] += 1
        # A slow answer, so a reload that does not wait lands mid-flight (§258.2).
        import time; time.sleep(SEEN.get("post_delay", 0))
        SEEN["post_answered"] = time.time()
        if SEEN["post_status"] != 200:
            self._s(SEEN["post_status"], b'{"ok":false,"error":"boom"}', "application/json")
            return
        # The server's own rule (§210): what lands is laid over what is stored.
        try:
            j = json.loads(body)
            if isinstance(j.get("changes"), dict):
                apply_changes(STATE, j["changes"])
            elif isinstance(j.get("state"), dict):
                STATE.clear(); STATE.update(j["state"])
        except Exception as e:  # a body the stub cannot apply is a finding, not a crash
            SEEN.setdefault("apply_errors", []).append(str(e))
        seq = None
        if MODE["seq"] and isinstance(j.get("changes"), dict):
            SEQN[0] += 1; seq = SEQN[0]
            SAVES.append({"seq": seq, "by": PERSON["name"], "byKey": PERSON["key"], "at": "2026-09-02T09:30:00.000Z", "changes": j["changes"]})
        self._s(200, json.dumps({"ok": True, "wrote": "rows", "seq": seq}).encode(), "application/json")


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % PORT
FILE_URL = "file://" + str(HTML_PATH)
INIT = ("try{sessionStorage.setItem('smp.tour.later','1');"
        "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")


def banner(pg):
    return pg.evaluate("""() => {
      const e = document.getElementById('safety');
      return (e && !e.hidden) ? e.textContent.replace(/\\s+/g,' ').trim() : ""; }""")


def unsaved(pg):
    """§504: a failed save is kept on this computer and said on its own amber bar."""
    return pg.evaluate("""() => {
      const e = document.getElementById('unsaved');
      return (e && !e.hidden) ? e.textContent.replace(/\\s+/g,' ').trim() : ""; }""")


def refused(pg):
    return pg.evaluate("""() => {
      const e = document.getElementById('refused');
      return (e && !e.hidden) ? e.textContent.replace(/\\s+/g,' ').trim() : ""; }""")


def press(pg, sel):
    """Press if it is there; a control that is absent is reported by the
       assertion after it, never by a 30s timeout (§215)."""
    try:
        pg.click(sel, timeout=2000)
        return True
    except Exception:
        return False


def last_since():
    return SEEN["peeks"][-1]["since"] if SEEN["peeks"] else None


def peek(pg):
    pg.evaluate("()=>typeof SAFETY!=='undefined'&&SAFETY.peek()")
    pg.wait_for_timeout(600)


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.add_init_script(INIT)
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL, wait_until="networkidle")
    pg.wait_for_timeout(1800)
    ck("the platform hydrated", pg.evaluate("()=>SYNC.isLive()") is True)
    ck("the slot is mounted beside the refusal's",
       pg.evaluate("()=>{const s=document.getElementById('safety');"
                   "return !!s && s.hidden && s.previousElementSibling"
                   " && s.previousElementSibling.id==='refused';}"))
    ck("nothing is drawn on a page nobody else has touched", banner(pg) == "", banner(pg))

    # ── 1 · THE TAB ASKS ABOUT ITS OWN PAGE ──────────────────────────────
    print("\n1 · the tab asks the server about the page it is on")
    # THE FIRST ASK IS THE CLOCK SYNC (§258.1): it fires by itself after
    # hydration, and the tab adopts the SERVER's now, never its own.
    syncs = [p for p in SEEN["peeks"] if p.get("sync")]
    ck("the tab synced its clock to the server by itself", len(syncs) == 1, len(syncs))
    ck("...and is synced", pg.evaluate("()=>typeof SAFETY!=='undefined'&&(SAFETY.synced?SAFETY.synced():null)") is True)
    n0 = len(SEEN["peeks"])
    peek(pg)
    ck("a peek reached the server", len(SEEN["peeks"]) == n0 + 1, len(SEEN["peeks"]) - n0)
    q = SEEN["peeks"][-1] if SEEN["peeks"] else {}
    here = pg.evaluate("()=>TARGET")
    ck("...scoped to the page's own target", q.get("target") == here, (q.get("target"), here))
    # SINCE THE TAB LOADED BY THE SERVER'S CLOCK: a laptop clock running
    # behind would otherwise announce older saves as news.
    ck("...and since the server's own now, not the browser's", q.get("since") == STUB_NOW, q.get("since"))
    ck("...not as a sync", not q.get("sync"))
    ck("nothing drawn when nobody landed anything", banner(pg) == "", banner(pg))

    # ── 1b · A SERVER THAT NUMBERS ITS SAVES IS ASKED THE LIGHTER WAY (§588.1) ──
    print("\n1b · with numbered saves the ask is \"what changed since N\", on every page")
    MODE["seq"] = True
    pg.goto(URL, wait_until="networkidle"); pg.wait_for_timeout(1800)
    ck("the platform hydrated again", pg.evaluate("()=>SYNC.isLive()") is True)
    ck("...holding the number the server sent", pg.evaluate("()=>SYNC.seq()") == SEQN[0], pg.evaluate("()=>SYNC.seq()"))
    def settle(ms=1500):
        pg.wait_for_timeout(ms)
    def states():
        return SEEN.get("states", 0)
    def afters():
        return len(SEEN.get("afters", []))
    n0, a0 = len(SEEN["peeks"]), afters()
    peek(pg)
    ck("the ask names the number it holds and nothing else",
       afters() == a0 + 1 and SEEN["afters"][-1]["after"] == SEQN[0] and "target" not in SEEN["afters"][-1]["q"]
       and "since" not in SEEN["afters"][-1]["q"], SEEN["afters"][-1] if SEEN.get("afters") else None)
    ck("...and the per-target ask is not made", len(SEEN["peeks"]) == n0, len(SEEN["peeks"]) - n0)
    states_at_load = states()
    ck("nothing new costs no graph", states() == states_at_load, states())

    # ── 2 · SOMEBODY ELSE LANDED A CHANGE: TAKEN IN, NOT ANNOUNCED (§588) ──
    print("\n2 · somebody else saved: their change arrives, no caution, no graph fetched")
    states0 = states()
    n = land({"rows": [{"at": "group", "path": [], "id": None, "set": {"org": "Theirs Ltd"}, "del": []}]})
    peek(pg); settle()
    ck("their change is on the screen", pg.evaluate("()=>GROUP.org") == "Theirs Ltd", pg.evaluate("()=>GROUP.org"))
    ck("...drawn, not only held", pg.evaluate("()=>document.getElementById('orgname').textContent") == "Theirs Ltd",
       pg.evaluate("()=>document.getElementById('orgname').textContent"))
    ck("...from the change itself: the graph was not fetched", states() == states0, states() - states0)
    ck("no caution is drawn", banner(pg) == "", banner(pg))
    ck("nothing is left pending", pg.evaluate("()=>SAFETY.pending()") is False)
    ck("the number moved on to that save", pg.evaluate("()=>SYNC.seq()") == n, pg.evaluate("()=>SYNC.seq()"))
    a0 = afters()
    peek(pg); settle(600)
    ck("the next ask starts from it", afters() == a0 + 1 and SEEN["afters"][-1]["after"] == n, SEEN["afters"][-1]["after"])
    ck("the baseline is theirs now: nothing to send", pg.evaluate("()=>{let r=null;SYNC.saveNow(s=>r=s);return r;}") == "clean")

    # ── 3 · A LINE THIS TAB HAS NOT SAVED SURVIVES THE MERGE ──────────────
    # The server is made to fail so the line stays unsaved (§504 keeps it);
    # theirs lands on ANOTHER cell; both must be on the screen afterwards,
    # and the kept line must then save against the new baseline by itself.
    print("\n3 · my unsaved line survives their update, then saves itself; my own save changes nothing")
    SEEN["post_status"] = 500
    pg.evaluate("UNITS.mobile.aspiration = 'mine-1'; paint();")
    settle(1200)
    ck("my change could not be saved and is kept on this computer", "safe on this computer" in unsaved(pg), unsaved(pg) or "(nothing)")
    land({"rows": [{"at": "group", "path": [], "id": None, "set": {"org": "Theirs Two"}, "del": []}]}, at="2026-09-02T10:05:00.000Z")
    states0 = states()
    peek(pg); settle()
    ck("their change arrived", pg.evaluate("()=>GROUP.org") == "Theirs Two", pg.evaluate("()=>GROUP.org"))
    ck("...and my unsaved line is still mine", pg.evaluate("()=>UNITS.mobile.aspiration") == "mine-1", pg.evaluate("()=>UNITS.mobile.aspiration"))
    ck("...without fetching the graph", states() == states0, states() - states0)
    ck("different cells raise no clash", not pg.evaluate("()=>!!document.querySelector('[data-unsaved-clash]')"), unsaved(pg))
    ck("no caution is drawn", banner(pg) == "", banner(pg))
    SEEN["post_status"] = 200
    bodies0 = len(SEEN.get("bodies", []))
    pg.evaluate("()=>SYNC.saveNow()")
    settle(1500)
    sent = [x for x in SEEN.get("bodies", [])[bodies0:] if "mine-1" in x]
    ck("the kept line was then saved", len(sent) >= 1, "%d posts since, none carrying it" % (len(SEEN.get("bodies", [])) - bodies0))
    ck("...carrying only itself, never their cells back at them", sent and not any("Theirs" in x for x in sent), [x[:200] for x in sent])
    ck("...and the server holds both", STATE["units"]["mobile"]["aspiration"] == "mine-1" and STATE["group"]["org"] == "Theirs Two",
       (STATE["units"]["mobile"]["aspiration"], STATE["group"]["org"]))
    ck("the stub applied every body it was sent", not SEEN.get("apply_errors"), SEEN.get("apply_errors"))
    # MY OWN SAVE COMES BACK IN THE STREAM and changes nothing: no repaint, the number moves on.
    mine_seq = SEQN[0]
    ck("the stub numbered my save", bool(SAVES) and SAVES[-1]["byKey"] == "smo", SAVES[-1] if SAVES else None)
    states0 = states(); peek(pg); settle(800)
    ck("my own save, asked back, moves the number and nothing else",
       pg.evaluate("()=>SYNC.seq()") == mine_seq and states() == states0 and pg.evaluate("()=>UNITS.mobile.aspiration") == "mine-1",
       (pg.evaluate("()=>SYNC.seq()"), mine_seq, states() - states0))

    # ── 4 · THE SAME CELL CHANGED BY BOTH: A CLASH, AND THE PERSON DECIDES ──
    print("\n4 · the same cell changed by both: theirs shows, Keep mine puts mine back")
    SEEN["post_status"] = 500
    pg.evaluate("UNITS.mobile.aspiration = 'mine-2'; paint();")
    settle(1200)
    land({"rows": [{"at": "units.mobile", "path": [], "id": None, "set": {"aspiration": "Theirs Three"}, "del": []}]},
         by="Karim Fahmy", at="2026-09-02T10:10:00.000Z")
    peek(pg); settle()
    ck("the screen shows theirs", pg.evaluate("()=>UNITS.mobile.aspiration") == "Theirs Three", pg.evaluate("()=>UNITS.mobile.aspiration"))
    ck("...and the clash bar asks, with both ways out",
       "clash" in unsaved(pg) and pg.evaluate("()=>!!document.querySelector('[data-unsaved-clash=\"mine\"]')"
                                               " && !!document.querySelector('[data-unsaved-clash=\"theirs\"]')"),
       unsaved(pg) or "(nothing)")
    ck("no reload caution is drawn", banner(pg) == "", banner(pg))
    SEEN["post_status"] = 200
    bodies0 = len(SEEN.get("bodies", []))
    press(pg, '[data-unsaved-clash="mine"]')
    settle(1500)
    ck("Keep mine puts my value back", pg.evaluate("()=>UNITS.mobile.aspiration") == "mine-2", pg.evaluate("()=>UNITS.mobile.aspiration"))
    ck("...and saves it", any("mine-2" in x for x in SEEN.get("bodies", [])[bodies0:]), len(SEEN.get("bodies", [])) - bodies0)
    ck("...and the server holds it", STATE["units"]["mobile"]["aspiration"] == "mine-2", STATE["units"]["mobile"]["aspiration"])
    ck("the bar is gone", not pg.evaluate("()=>!!document.querySelector('[data-unsaved-clash]')"), unsaved(pg))

    # ── 5 · NEVER UNDER A HAND IN A FIELD; ON BLUR IT GOES ────────────────
    # A bound field writes on blur into the object it was drawn from (§35),
    # so a merge mid-word would lose the word. A plain input stands in for
    # any field: what is under test is the rule, not a particular control.
    print("\n5 · nothing is merged under a hand in a field; blur, and it is")
    pg.evaluate("()=>{const i=document.createElement('input'); i.id='probe-field'; document.body.appendChild(i); i.focus(); i.value='typing';}")
    ck("a field has the cursor", pg.evaluate("()=>document.activeElement && document.activeElement.id==='probe-field'"))
    held_at = pg.evaluate("()=>SYNC.seq()")
    n = land({"rows": [{"at": "group", "path": [], "id": None, "set": {"org": "Theirs Four"}, "del": []}]}, at="2026-09-02T10:15:00.000Z")
    peek(pg); settle(1200)
    ck("the landing is held, not dropped", pg.evaluate("()=>SAFETY.pending()") is True)
    ck("...the screen is untouched", pg.evaluate("()=>GROUP.org") == "Theirs Two", pg.evaluate("()=>GROUP.org"))
    ck("...the number has not moved", pg.evaluate("()=>SYNC.seq()") == held_at, (pg.evaluate("()=>SYNC.seq()"), held_at, n))
    ck("...and the field keeps what was typed and the cursor",
       pg.evaluate("()=>document.getElementById('probe-field').value==='typing' && document.activeElement.id==='probe-field'"))
    pg.evaluate("()=>{const i=document.getElementById('probe-field'); i.blur(); i.remove();}")
    settle(2000)
    ck("on blur the merge goes", pg.evaluate("()=>GROUP.org") == "Theirs Four" and pg.evaluate("()=>SYNC.seq()") == n,
       (pg.evaluate("()=>GROUP.org"), pg.evaluate("()=>SYNC.seq()")))
    ck("...and nothing is pending", pg.evaluate("()=>SAFETY.pending()") is False)
    ck("no caution was drawn through any of it", banner(pg) == "", banner(pg))

    # ── 5b · ON SETUP THE LIGHTER ASK IS MADE TOO (§588.1; §258.1 asked nothing there) ──
    print("\n5b · Setup asks the lighter way as well; a page still does")
    pg.evaluate("()=>{const g=document.querySelector('[data-s=\"setup\"],[data-setup],button[title=\"Setup\"]'); if(g) g.click();}")
    pg.wait_for_timeout(600)
    ck("Setup opened", pg.evaluate("()=>typeof current!=='undefined' && current==='setup'"))
    a0, n0 = afters(), len(SEEN["peeks"])
    peek(pg)
    ck("...and it asks what changed, by number", afters() == a0 + 1 and len(SEEN["peeks"]) == n0, (afters() - a0, len(SEEN["peeks"]) - n0))
    pg.evaluate("()=>{const b=document.querySelector('button[data-u=\"mobile\"]'); if(b) b.click();}")
    pg.wait_for_timeout(600)
    ck("back on a page", pg.evaluate("()=>TARGET") == "mobile", pg.evaluate("()=>TARGET"))
    a0 = afters(); peek(pg)
    ck("...it asks the same way", afters() == a0 + 1, afters() - a0)

    # ── 5c · A NEW ROW'S ID IS ITS OWN (§588) ─────────────────────────────
    # Two tabs adding a row to the same list in the same minute both counted
    # the same length and minted the same id, so on the merge the second row
    # replaced the first (every row is found by id, §48).
    print("\n5c · two tabs adding a row at once cannot mint the same id")
    r = pg.evaluate("()=>[mintRowId([{id:'x-P1-aaaa'}],'x-P'), mintRowId([{id:'x-P1-aaaa'}],'x-P')]")
    ck("an id still says where it was added, with a tag of its own", all(re.match(r"^x-P2-[0-9a-z]{4}$", x) for x in r), r)
    ck("...and two minted from the same list differ", r[0] != r[1], r)

    # ── 5d · A SAVE TOO LARGE TO CARRY: THE GRAPH IS FETCHED INSTEAD (§588.1) ──
    print("\n5d · a save the server could not carry falls back to fetching the graph")
    STATE["group"]["org"] = "Theirs Five"
    n = land({"full": True, "bytes": 999999}, at="2026-09-02T10:20:00.000Z")
    states0 = states()
    peek(pg); settle(1800)
    ck("the graph was fetched once", states() == states0 + 1, states() - states0)
    ck("...and their change is on the screen", pg.evaluate("()=>GROUP.org") == "Theirs Five", pg.evaluate("()=>GROUP.org"))
    ck("...with the number the fetched copy carries", pg.evaluate("()=>SYNC.seq()") == n, (pg.evaluate("()=>SYNC.seq()"), n))
    ck("no caution is drawn", banner(pg) == "", banner(pg))

    # ── 5f · A NUMBER OLDER THAN THE OLDEST ENTRY KEPT TAKES THE GRAPH (§588.2) ──
    # The list is swept after a week. A tab holding a number from before the
    # oldest entry kept cannot know what was swept between, so it fetches the
    # graph once and carries on from the number that copy holds.
    print("\n5f · a tab older than the oldest kept entry fetches the graph once")
    del SAVES[:-1]                                   # the sweep: one entry left
    STATE["group"]["org"] = "Theirs Six"             # a save that was swept
    pg.evaluate("n=>SYNC.setSeq(n)", max(0, SAVES[0]["seq"] - 3))
    states0 = states()
    peek(pg); settle(1800)
    ck("the graph was fetched once", states() == states0 + 1, states() - states0)
    ck("...and the screen holds what the swept save wrote", pg.evaluate("()=>GROUP.org") == "Theirs Six", pg.evaluate("()=>GROUP.org"))
    ck("...with the number the fetched copy carries", pg.evaluate("()=>SYNC.seq()") == SEQN[0], (pg.evaluate("()=>SYNC.seq()"), SEQN[0]))
    states0 = states(); peek(pg); settle(600)
    ck("the next ask is the light one again", states() == states0, states() - states0)
    n = land({"rows": [{"at": "group", "path": [], "id": None, "set": {"org": "Theirs Seven"}, "del": []}]}, at="2026-09-02T10:25:00.000Z")
    peek(pg); settle()
    ck("...and a landing arrives as a change, as before", pg.evaluate("()=>GROUP.org") == "Theirs Seven" and states() == states0 and pg.evaluate("()=>SYNC.seq()") == n,
       (pg.evaluate("()=>GROUP.org"), states() - states0))

    # ── 5e · THE CLOCK SLOWS WHEN NOBODY IS WORKING HERE (§588.1) ─────────
    print("\n5e · the ask comes every 20s while somebody works here, every 60s once nobody does")
    ck("working here: 20s", pg.evaluate("()=>SAFETY.every()") == 20000, pg.evaluate("()=>SAFETY.every()"))
    pg.evaluate("()=>SAFETY.active(Date.now() - 4*60*1000)")
    ck("four minutes untouched: 60s", pg.evaluate("()=>SAFETY.every()") == 60000, pg.evaluate("()=>SAFETY.every()"))
    pg.keyboard.press("Shift")
    ck("one key, and it is 20s again", pg.evaluate("()=>SAFETY.every()") == 20000, pg.evaluate("()=>SAFETY.every()"))

    # ── 6 · A NEWER VERSION IS READY ─────────────────────────────────────
    print("\n6 · a newer version of the platform")
    ck("the worker listener is armed over HTTP", pg.evaluate("()=>typeof SAFETY!=='undefined'&&SAFETY.isArmed()") is True)
    # A stub cannot install a worker, so the same function `controllerchange`
    # calls is called by name — what is under test is what it draws.
    pg.evaluate("()=>typeof SAFETY!=='undefined'&&SAFETY.newVersion()")
    said = banner(pg)
    ck("the version caution replaces the edit one", "newer version" in said.lower(), said)
    ck("...and tells them to finish what they are typing and that Reload saves first",
       "finish what you are typing" in said.lower() and "saves your work first" in said.lower(), said)
    ck("...with one way out: Reload",
       pg.evaluate("()=>!!document.querySelector('#safety [data-safety-reload]')"
                   " && !document.querySelector('#safety [data-safety-keep]')"))
    PEEK["changed"] = [{"by": "Karim Fahmy", "at": "2026-09-02T12:00:00.000Z"}]
    peek(pg)
    ck("an edit landing does not displace it", "newer version" in banner(pg).lower(), banner(pg))
    # ── 6b · RELOAD SAVES THE FIELD UNDER THE CURSOR FIRST (§258.2) ──────
    # §608: Setup › Terminology STOOD HERE and left Setup. The shape screen's
    # name boxes are the same kind of control — plain bound inputs that write
    # on change — so the check types into one of those instead; the version
    # caution is drawn on Setup too, since a stale build is stale everywhere.
    import time as _time
    press(pg, 'button[title="Setup"]'); pg.wait_for_timeout(500)
    pg.evaluate("()=>{const r=document.querySelector('[data-setupgo=start]'); if(r) r.click();}"); pg.wait_for_timeout(800)
    pg.evaluate("()=>{const b=document.querySelector('.csetup .wzstep[data-step=shape]'); if(b) b.click();}"); pg.wait_for_timeout(900)
    mark = "TYPED-%d" % int(_time.time())
    box = pg.locator(".csetup .stpart input[data-stlw]:visible").first
    ck("a field to type in", box.count() > 0)
    box.click(); box.fill(""); box.type(mark)
    ck("...and it still has the cursor (never blurred)",
       pg.evaluate("()=>document.activeElement && document.activeElement.matches('input[data-stlw]')"))
    ck("the version caution is still up on Setup", "newer version" in banner(pg).lower(), banner(pg))
    SEEN["post_delay"] = 0.9; SEEN["post_answered"] = None
    loads0, posts0 = SEEN["loads"], SEEN["posts"]
    t_press = _time.time()
    press(pg, "#safety [data-safety-reload]")
    pg.wait_for_timeout(300)
    ck("the button says it is saving", "Saving" in pg.evaluate("()=>{const b=document.querySelector('#safety [data-safety-reload]');return b?b.textContent:''}"),
       pg.evaluate("()=>{const b=document.querySelector('#safety [data-safety-reload]');return b?b.textContent:''}"))
    pg.wait_for_load_state("networkidle")
    pg.wait_for_timeout(1500)
    carried = [b for b in SEEN.get("bodies", [])[posts0:] if mark in b]
    ck("the typed value was POSTed", len(carried) >= 1,
       "%d posts, none carrying it: %s" % (SEEN["posts"] - posts0, [b[:160] for b in SEEN.get("bodies", [])[posts0:]]))
    ck("Reload reloads", SEEN["loads"] == loads0 + 1, SEEN["loads"] - loads0)
    ck("...only AFTER the server answered the save",
       SEEN["post_answered"] is not None and SEEN["load_at"] > SEEN["post_answered"] > t_press,
       (SEEN.get("post_answered"), SEEN.get("load_at")))
    SEEN["post_delay"] = 0
    # a failed save keeps the page
    pg.evaluate("()=>typeof SAFETY!=='undefined'&&SAFETY.newVersion()")
    SEEN["post_status"] = 500; loads0 = SEEN["loads"]
    # The reload above returns to Getting started (§173) with the flow on its
    # first step — a step is the flow's own state, never the address — so the
    # shape screen is opened again before its box is typed into.
    pg.wait_for_timeout(800)
    pg.evaluate("()=>{const b=document.querySelector('.csetup .wzstep[data-step=shape]'); if(b) b.click();}")
    pg.wait_for_timeout(900)
    box = pg.locator(".csetup .stpart input[data-stlw]:visible").first
    box.click(); box.fill(""); box.type(mark + "-b")
    press(pg, "#safety [data-safety-reload]")
    pg.wait_for_timeout(2000)
    ck("a save that fails does NOT reload", SEEN["loads"] == loads0, SEEN["loads"] - loads0)
    ck("...the failure is said (§171, §504)", "safe on this computer" in unsaved(pg), unsaved(pg) or "(nothing)")
    ck("...and Reload is live again", pg.evaluate("()=>{const b=document.querySelector('#safety [data-safety-reload]');return !!b && !b.disabled && b.textContent==='Reload';}"))
    SEEN["post_status"] = 200

    # ── 7 · CONTRAST, THE SWEEP'S OWN ARITHMETIC (§95) ───────────────────
    print("\n7 · the caution is readable in both themes")
    # The fallback caution, drawn by name (§588 takes a landing in instead).
    pg.evaluate("()=>{SAFETY.hide(); SAFETY.edited('Hala Ibrahim','2026-09-02T13:00:00.000Z');}")
    pg.wait_for_timeout(200)
    for theme in ("light", "dark"):
        pg.evaluate("t=>{document.documentElement.dataset.theme=t}", theme)
        pg.wait_for_timeout(100)
        r = pg.evaluate("""() => {
          const lum = c => { const m=c.match(/[\\d.]+/g).map(Number);
            const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};
            return .2126*f(m[0])+.7152*f(m[1])+.0722*f(m[2]); };
          const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
          const s=document.getElementById('safety'); if(!s) return null; const bg=getComputedStyle(s).backgroundColor;
          const out=[];
          for (const el of s.querySelectorAll('strong,span,button')) {
            const cs=getComputedStyle(el);
            const g = el.tagName==='BUTTON' && cs.backgroundColor!=='rgba(0, 0, 0, 0)' ? cs.backgroundColor : bg;
            out.push([el.tagName, +ratio(cs.color,g).toFixed(2)]);
          }
          return out; }""")
        low = [x for x in r if x[1] < 4.5] if r else [["no caution drawn", 0]]
        ck("%s: every word on the caution is ≥ 4.5:1" % theme, not low, low or r)
    pg.evaluate("()=>{delete document.documentElement.dataset.theme}")

    ck("no page errors", not errs, errs[:3])

    # ── 8 · AND `file://` DRAWS NOTHING, ASKS NOTHING ────────────────────
    print("\n8 · no server behind the page")
    pg2 = b.new_page(viewport={"width": 1440, "height": 900})
    pg2.add_init_script(INIT)
    n0 = len(SEEN["peeks"])
    pg2.goto(FILE_URL, wait_until="networkidle")
    pg2.wait_for_timeout(2200)
    pg2.evaluate("()=>typeof SAFETY!=='undefined'&&SAFETY.peek()")
    pg2.evaluate("()=>typeof SAFETY!=='undefined'&&SAFETY.edited('Nobody','2026-09-02T00:00:00Z')")
    pg2.wait_for_timeout(300)
    ck("no slot is mounted", pg2.evaluate("()=>!document.getElementById('safety')"))
    ck("nothing is drawn even when asked", pg2.evaluate("()=>!document.getElementById('safety')"))
    ck("the worker listener is not armed", pg2.evaluate("()=>typeof SAFETY!=='undefined'&&SAFETY.isArmed()") is False)
    ck("no peek was sent, the sync included", len(SEEN["peeks"]) == n0, len(SEEN["peeks"]) - n0)
    pg2.close()
    b.close()

print("\n%s" % ("ALL GREEN" if not bad else "%d FAIL" % bad))
raise SystemExit(1 if bad else 0)
