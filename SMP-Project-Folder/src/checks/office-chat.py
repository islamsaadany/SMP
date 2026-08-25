"""TALKING TO THE STRATEGY OFFICE (§97).

TWO REASONS THIS CANNOT BE PART OF `qa.py`, and they are the two lessons the
suite has already learned the hard way.

FIRST, THE WHOLE FEATURE IS INVISIBLE OVER `file://`. Every other check opens
the built file straight off the disk, where there is no server to carry a
message and `CHAT.mount()` deliberately refuses — so a build that had lost the
corner entirely would go green every time. §94.11's trap, walked into knowingly
for the second time. So this serves the built file over HTTP with a stub
`/api/chat`, which is the only condition under which the thing exists at all.

SECOND, HALF OF WHAT IS WORTH ASSERTING IS AN ABSENCE. §94.2: a check that only
looks for something PRESENT cannot see a control that should not be drawn. The
bubble must NOT be there over `file://`, must NOT be there while the platform
is on a projector, and must NOT be there for somebody the server has turned
away — and each of those is a state in which "no bubble" is the pass.

The stub is deliberately not a database. What is being measured here is the
CLIENT half: that the corner appears and can be pressed, that a poll does not
destroy what somebody is typing, and that the three absences hold. The server
half — who may read whose conversation, and what a reply does — is
`scripts/test-chat.js`, against a real Postgres, because that is where those
questions are actually answered.
"""
import json, pathlib, threading, http.server, socketserver, time
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}

# What the stub /api/chat answers with, and whether it answers at all.
CHAT = {"status": 200, "messages": [], "unread": 0, "thread": None, "polls": 0, "said": [],
        "cfg": {"on": True, "shots": True, "promise": "Usually answers the same day",
                "beat": 4000}}
errs, bad = [], 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


GATE = b"<!doctype html><title>Sign in</title><h1 id='gate'>Sign in</h1>"


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
        if not self.path.startswith("/api/chat"):
            self._send(200, b'{"ok":true}', "application/json")
            return
        body = json.loads(raw or b"{}")
        if CHAT["status"] != 200:
            self._send(CHAT["status"], b'{"ok":false,"error":"no"}', "application/json")
            return
        if body.get("action") == "say":
            CHAT["said"].append(body)
            CHAT["messages"].append({
                "id": len(CHAT["messages"]) + 1, "at": "2026-08-25T09:00:00Z",
                "from_office": False, "by_key": "smo", "by_name": "Mohamed Essam",
                "body": body.get("body") or "", "page": body.get("page"),
                "target": body.get("target"), "cycle": body.get("cycle"),
                "build": body.get("build"), "flag": None, "has_shot": False})
        if body.get("action") == "mine":
            CHAT["polls"] += 1
        self._send(200, json.dumps({
            "ok": True, "office": True, "messages": CHAT["messages"],
            "unread": CHAT["unread"], "thread": CHAT["thread"],
            "chat": CHAT["cfg"]}).encode(), "application/json")


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % PORT
URL = BASE + "/raya-trade"
print("serving the built file at " + URL)

FILE_URL = "file://" + str(ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1400, "height": 950})
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))

    # ── 1 · THE CORNER IS THERE, AND CAN BE PRESSED ──────────────────────
    print("\n1 · the corner")
    pg.goto(URL, wait_until="networkidle")
    pg.wait_for_selector("#chatdock:not([hidden])", timeout=10000)
    r = pg.eval_on_selector("#chatbtn", "e => e.getBoundingClientRect()")
    ck("the bubble has a real box", r["width"] > 40 and r["height"] > 40, r)
    # PRESENT IS NOT PRESSABLE (§70, §93.4 — twice, both found by a person
    # trying to use the product rather than by a check asking `is not None`).
    hit = pg.evaluate("""() => { const r = document.getElementById('chatbtn').getBoundingClientRect();
        const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return e && e.closest('#chatbtn') ? 'chatbtn' : (e ? e.tagName : 'nothing'); }""")
    ck("a click at its centre reaches the bubble", hit == "chatbtn", hit)
    ck("no count while nothing is waiting", pg.eval_on_selector("#chatn", "e => e.hidden"))

    # THE BUBBLE WEARS THE TENANT'S BAR COLOUR, NOT THE ACCENT (§41.10). The
    # value is never asserted — only that it is the SAME colour as the
    # navigation bar, so a tenant changing their branding stays green and a
    # bubble quietly restyled to the accent does not.
    # Asked of a PROBE wearing `background:var(--panel)`, not of whichever
    # element happens to be navy today: `.chrome` computes to `--surface` and
    # only the rows inside it carry the bar colour, so naming an element would
    # be asserting the layout while claiming to assert the colour.
    same = pg.evaluate("""() => {
        const probe = document.createElement('div');
        probe.style.background = 'var(--panel)';
        document.body.appendChild(probe);
        const want = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return [want, getComputedStyle(document.getElementById('chatbtn')).backgroundColor]; }""")
    ck("the bubble wears the tenant's bar colour", same[0] == same[1], same)

    # ── 2 · WRITING, AND WHAT IS SENT WITH IT ────────────────────────────
    print("\n2 · writing")
    pg.click("#chatbtn")
    pg.wait_for_selector("#chatpanel:not([hidden])")
    ck("the first-time state invites a question", "Ask us anything" in pg.inner_text("#chatbody"))
    pg.fill("#chatsay", "The Q3 target here does not match our plan.")
    pg.click("#chatsend")
    pg.wait_for_timeout(900)
    ck("the message is in the conversation", "does not match" in pg.inner_text("#chatbody"))
    said = CHAT["said"][-1] if CHAT["said"] else {}
    # CAPTURED, NOT TYPED (§71) — and in the NAVIGATION'S OWN WORDS, never the
    # tab key, which put "the group › performance" on a message where the
    # screen said "Group › Performance" (§93.12, §94.6).
    ck("where they were was sent with it", bool(said.get("page")), said.get("page"))
    ck("and it is the navigation's own words, not a key",
       said.get("page", "").split(" › ")[0][:1].isupper(), said.get("page"))
    ck("the build went with it", bool(said.get("build")), said.get("build"))
    ck("and the cycle", bool(said.get("cycle")), said.get("cycle"))

    # ── 3 · A POLL MUST NOT EAT WHAT SOMEBODY IS TYPING ──────────────────
    # The rule this whole file is built around (§35, §71.2, §30.1). The panel
    # polls every 4s; this waits longer than that on purpose.
    print("\n3 · typing survives the clock")
    before = CHAT["polls"]
    pg.fill("#chatsay", "half a sentence I have not finished")
    pg.wait_for_timeout(5200)
    ck("the panel really did poll while we waited", CHAT["polls"] > before,
       (before, CHAT["polls"]))
    ck("and the half-typed message is untouched",
       pg.input_value("#chatsay") == "half a sentence I have not finished",
       pg.input_value("#chatsay"))
    pg.fill("#chatsay", "")

    # ── 4 · THE THREE ABSENCES ───────────────────────────────────────────
    print("\n4 · where the corner must NOT be")
    pg.evaluate("() => document.body.classList.add('presenting')")
    pg.wait_for_timeout(120)
    shown = pg.evaluate("""() => {
        const d = document.getElementById('chatdock');
        return !!d && getComputedStyle(d).display !== 'none' && d.getClientRects().length > 0; }""")
    ck("no bubble on a projector", not shown, shown)
    pg.evaluate("() => document.body.classList.remove('presenting')")

    # NOT FROM `file://`, WHERE THERE IS NO SERVER TO CARRY A MESSAGE.
    pg3 = b.new_page(viewport={"width": 1400, "height": 950})
    pg3.goto(FILE_URL, wait_until="networkidle")
    pg3.wait_for_timeout(2500)
    ck("no bubble with no server behind the page",
       pg3.evaluate("() => !document.getElementById('chatdock')"))
    pg3.close()

    # ── 5 · THE OFFICE'S PAGE IS DRAWN, AND ITS ROWS STAY ONE CARD ───────
    print("\n5 · the office's page")
    pg.click('[data-md="setup"]')
    pg.wait_for_timeout(900)
    ck("Messages is in Running the cycle",
       pg.is_visible('[data-setupgo="chat"]'))
    pg.click('[data-setupgo="chat"]')
    pg.wait_for_selector("#chinbox", timeout=8000)
    ck("the inbox drew its two halves",
       pg.is_visible("#chqlist") and pg.is_visible("#chthread"))
    ck("and says what to do when nothing is picked",
       "Pick somebody" in pg.inner_text("#chthread"))

    # ── 6 · THE SETTINGS THE OFFICE HAS SET REACH THE CORNER (§98) ───────
    # Asserted from the PERSON's side, because that is the side the settings
    # are for — the office's own menu writes to the state graph, which this
    # stub does not carry, and `scripts/test-chat.js` covers that end.
    #
    # THE PANEL HAS TO BE OPEN, AND OPENING IT IS NOT A CLICK. It was left
    # open by section 2, so a blind press CLOSED it — and a closed panel polls
    # every three minutes, which made every assertion below read a stale value
    # while the cadence check passed for the wrong reason. Ask, then act.
    print("\n6 · what the office has set reaches the corner")
    if pg.eval_on_selector("#chatpanel", "e => e.hidden"):
        pg.click("#chatbtn")
    pg.wait_for_selector("#chatpanel:not([hidden])")

    def next_poll(within=8000):
        """Wait for the client to actually ask again, rather than guessing."""
        was = CHAT["polls"]
        waited = 0
        while CHAT["polls"] == was and waited < within:
            pg.wait_for_timeout(250); waited += 250
        return CHAT["polls"] > was

    CHAT["cfg"] = {"on": True, "shots": True, "beat": 4000,
                   "promise": "We answer 9-5, within two working days"}
    ck("the client asks again on its own", next_poll())
    pg.wait_for_timeout(300)
    ck("the panel wears the office's own promise",
       "9-5" in pg.inner_text("#chatsub"), pg.inner_text("#chatsub"))
    # AND IT IS STILL THERE WITH SOMETHING OUTSTANDING, which is the moment
    # somebody actually wants it — the status is the DOT, not the words.
    ck("and it is still there while a message is waiting",
       "9-5" in pg.inner_text("#chatsub") and len(CHAT["messages"]) > 0)

    CHAT["cfg"] = dict(CHAT["cfg"], shots=False)
    next_poll(); pg.wait_for_timeout(300)
    ck("screenshots off takes the attach control away",
       pg.eval_on_selector("#chatpic", "e => e.hidden"))

    # THE CADENCE IS A NUMBER THE CLIENT USES, not a label. Counted over a
    # window long enough that 4s and 15s cannot be confused for one another.
    CHAT["cfg"] = dict(CHAT["cfg"], beat=15000)
    next_poll()                       # the change itself has to land first
    before = CHAT["polls"]
    pg.wait_for_timeout(9000)
    slow = CHAT["polls"] - before
    ck("Relaxed really slows the clock (%d polls in 9s, Live would be 2)" % slow,
       slow <= 1, slow)

    # AND OFF MEANS GONE — the third absence, arriving by a setting rather
    # than by a refusal.
    CHAT["cfg"] = dict(CHAT["cfg"], on=False)
    ck("and the client asks once more", next_poll(20000))
    pg.wait_for_timeout(400)
    ck("turning the chat off takes the corner down",
       pg.eval_on_selector("#chatdock", "e => e.hidden"))
    ck("and closes the panel with it",
       pg.eval_on_selector("#chatpanel", "e => e.hidden"))
    CHAT["cfg"] = dict(CHAT["cfg"], on=True, beat=4000)

    ck("no console errors", not errs, errs[:4])

    # ── 7 · AND A SESSION THE SERVER REFUSES, LAST ON PURPOSE ────────────
    # A refused session takes the corner away rather than leaving a control
    # that answers every press with a refusal. It runs AFTER the console
    # assertion because flipping the stub to 401 makes the page already open
    # log a resource failure — deliberately. Ordering it last is honest; a
    # filter that swallowed "401" would also swallow a real one.
    print("\n7 · a session the server refuses")
    CHAT["status"] = 401
    pg2 = b.new_page(viewport={"width": 1400, "height": 950})
    pg2.goto(URL, wait_until="networkidle")
    pg2.wait_for_timeout(2500)
    ck("no bubble for somebody the server turned away",
       pg2.evaluate("""() => { const d = document.getElementById('chatdock');
           return !d || d.hidden; }"""))
    pg2.close()
    CHAT["status"] = 200
    b.close()

srv.shutdown()
print("\n%s" % ("ALL CLEAR" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
