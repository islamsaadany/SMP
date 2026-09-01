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

# ── THE TOUR IS NOT WHAT THIS FILE MEASURES (§107, §108.16) ──────────────
# The onboarding tour auto-opens for a first-time viewer over HTTP, and its
# dim layer covers the page — so every click here lands on `#tdim` and times
# out. Suppressed as a RETURNING VIEWER would have it (the tour's own
# "Skip for now" session flag), never by deleting or disabling the tour:
# the tour has its own check, and a suppression that reached into its
# internals would be this file quietly asserting the tour away.
# AND §148's WELCOME SCREEN COVERS THE PAGE THE SAME WAY (§167). It shipped
# after this file and nothing here knew about it, so every click landed on
# `.welcomeover` — which is what "a click at its centre reaches the bubble —
# DIV" had been reporting, and it was read as a product fault for as long as
# it stood. Suppressed as a RETURNING viewer has it, never by reaching into
# the overlay: the welcome screen has its own check.
def _no_tour(pg):
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")


ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}

# What the stub /api/chat answers with, and whether it answers at all.
CHAT = {"status": 200, "messages": [], "unread": 0, "thread": None, "polls": 0, "said": [],
        "test": None,
        "cfg": {"on": True, "shots": True, "promise": "Usually answers the same day",
                "beat": 4000}}

# THE OFFICE'S SIDE NEEDS A CONVERSATION TO LOOK AT, and section 8 measures a
# box that has to be TOO FULL to fit — a thread of three messages fits every
# window and would report a page that cannot scroll as a page that need not.
# Twenty, alternating, so the thread genuinely overflows at the tallest size
# swept and the assertion is about the box rather than about the content.
BOXMSGS = [{"id": i + 1, "at": "2026-08-25T09:%02d:00Z" % i,
            "from_office": bool(i % 2), "by_key": "ceo" if i % 2 else "hend",
            "by_name": "Strategy Office" if i % 2 else "Hend Farouk",
            "body": ("Noted — the March import is what carried it." if i % 2 else
                     "The Q3 target on Active Base still reads 4.2M on our page."),
            "flag": None, "has_shot": False} for i in range(20)]
BOXQUEUE = [{"person_key": "hend", "person_name": "Hend Farouk", "live_name": "Hend Farouk",
             "waiting": True, "last_at": "2026-08-25T09:19:00Z", "here_at": None,
             "unit_key": "mobile", "fn_key": None, "title": "Head of Mobile", "gone": False,
             "unread": 1, "last_body": BOXMSGS[-1]["body"],
             "last_from_office": BOXMSGS[-1]["from_office"],
             "last_by": BOXMSGS[-1]["by_name"], "flagged": 0}]
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
            # §139's echo exists FOR the slow say — with the assistant on the
            # server holds the response for the whole model round-trip, and the
            # check must model that or the in-flight state lasts one frame and
            # nothing here ever measures it.
            if CHAT.get("slow"):
                time.sleep(CHAT["slow"])
            CHAT["said"].append(body)
            # THE STUB HAS TO MODEL THE SERVER, not merely answer. A real `say`
            # comes back with the conversation WAITING, and that is what puts
            # the shut panel on the 15s beat instead of 180s (§99) — a stub
            # that returned `thread: null` made the client behave correctly and
            # the check read it as broken.
            CHAT["thread"] = {"waiting": True}
            CHAT["messages"].append({
                "id": len(CHAT["messages"]) + 1, "at": "2026-08-25T09:00:00Z",
                "from_office": False, "by_key": "smo", "by_name": "Mohamed Essam",
                "body": body.get("body") or "", "page": body.get("page"),
                "target": body.get("target"), "cycle": body.get("cycle"),
                "build": body.get("build"), "flag": None, "has_shot": False})
        if body.get("action") == "assistantTest":
            self._send(200, json.dumps({"ok": True, "steps": CHAT.get("test") or []}).encode(),
                       "application/json")
            return
        if body.get("action") == "queue":
            self._send(200, json.dumps({
                "ok": True, "office": True, "threads": BOXQUEUE, "chat": CHAT["cfg"],
                "waiting": 1, "flagged": 0, "hereMinutes": 5, "mail": False}).encode(),
                "application/json")
            return
        if body.get("action") == "thread":
            self._send(200, json.dumps({
                "ok": True, "person": "hend", "name": "Hend Farouk", "gone": False,
                "unit": "mobile", "fn": None, "title": "Head of Mobile",
                "address": None, "waiting": True, "here": False, "hereAt": None,
                "mail": False, "chatOn": CHAT["cfg"].get("on", True),
                "messages": BOXMSGS}).encode(), "application/json")
            return
        if body.get("action") == "mine":
            CHAT["polls"] += 1
        # THE STUB MODELS THE SERVER (§100.3): the office's `mine` answer also
        # carries how many are waiting, and who wrote last — the only thing
        # that polls on every page, so the only thing that can tell the office
        # a question arrived while they were somewhere else (§225).
        self._send(200, json.dumps({
            "ok": True, "office": True, "messages": CHAT["messages"],
            "unread": CHAT["unread"], "thread": CHAT["thread"],
            "waiting": CHAT.get("owaiting", 0),
            "waitingWho": CHAT.get("owho"), "waitingBody": CHAT.get("obody"),
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
    _no_tour(pg)
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
    # ── NOTHING ABOUT WHERE THEY WERE TRAVELS WITH IT (§99) ──────────
    # This used to assert the opposite — that the page, the cycle and the build
    # were captured and sent. Islam asked for that gone everywhere, so the
    # check is inverted rather than deleted: §94.2's rule, that only a check
    # looking for an ABSENCE can see something that should not be drawn, and
    # the easiest way to bring a removed feature back by accident is to stop
    # asserting it is gone.
    said = CHAT["said"][-1] if CHAT["said"] else {}
    for k in ("page", "target", "cycle", "build"):
        ck("nothing is sent about where they were: %s" % k, not said.get(k), said.get(k))
    ck("and the message itself still arrives whole",
       said.get("body", "").startswith("The Q3 target"))
    ck("no context line is drawn under it",
       pg.eval_on_selector_all(".chctx", "n => n.length") == 0)
    # AND THE FOOTER STOPS PROMISING IT. A sentence that is merely stale is
    # worse than no sentence, because somebody believes it.
    ck("the composer no longer says the page is sent",
       "page you are on" not in pg.inner_text("#chatnote"),
       pg.inner_text("#chatnote"))

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

    # ── 3b · IT MINIMISES, AND A REPLY ANNOUNCES ITSELF (§99) ────────────
    print("\n3b · the corner's two corrections")
    def poll_once(within=8000):
        was, waited = CHAT["polls"], 0
        while CHAT["polls"] == was and waited < within:
            pg.wait_for_timeout(250); waited += 250
        return CHAT["polls"] > was
    if pg.eval_on_selector("#chatpanel", "e => e.hidden"):
        pg.click("#chatbtn")
    pg.wait_for_selector("#chatpanel:not([hidden])")
    lab = pg.eval_on_selector("#chatclose", "e => e.getAttribute('aria-label') || ''")
    ck("the control says minimise, not close", "inimis" in lab or "inimiz" in lab, lab)
    ck("and it is not a cross", "×" not in pg.inner_text("#chatclose"))
    # OPEN, THE BUBBLE IS NOT DRAWN AND THE PANEL SITS AT THE BOTTOM (§100.4).
    ck("the bubble is not drawn while the panel is open",
       pg.eval_on_selector("#chatbtn", "e => e.getClientRects().length === 0"))
    gap = pg.evaluate("""() => {
        const p = document.getElementById('chatpanel').getBoundingClientRect();
        return Math.round(window.innerHeight - p.bottom); }""")
    ck("and the panel reaches the bottom of the window (%dpx)" % gap, gap <= 24, gap)

    pg.click("#chatclose")
    ck("pressing it puts the panel away", pg.eval_on_selector("#chatpanel", "e => e.hidden"))
    ck("and the bubble comes back", pg.eval_on_selector("#chatbtn", "e => e.getClientRects().length > 0"))
    ck("and the conversation is still there afterwards", len(CHAT["messages"]) > 0)

    # CLICKING AWAY MINIMISES IT, AND LOSES NOTHING.
    pg.click("#chatbtn")
    pg.wait_for_selector("#chatpanel:not([hidden])")
    pg.fill("#chatsay", "half written, and I clicked away")
    pg.mouse.click(200, 300)
    pg.wait_for_timeout(300)
    ck("clicking outside minimises it", pg.eval_on_selector("#chatpanel", "e => e.hidden"))
    pg.click("#chatbtn")
    pg.wait_for_timeout(300)
    ck("and the half-typed message survived it",
       pg.input_value("#chatsay") == "half written, and I clicked away",
       pg.input_value("#chatsay"))
    # A CLICK INSIDE IS NOT OUTSIDE.
    pg.click("#chatbody")
    pg.wait_for_timeout(200)
    ck("a click inside the panel leaves it open",
       not pg.eval_on_selector("#chatpanel", "e => e.hidden"))
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(250)
    ck("Escape minimises it from anywhere", pg.eval_on_selector("#chatpanel", "e => e.hidden"))
    pg.fill("#chatsay", "") if not pg.eval_on_selector("#chatpanel", "e => e.hidden") else None

    # A REPLY THAT LANDS WHILE THE PANEL IS SHUT HAS TO SAY SO.
    CHAT["messages"].append({
        "id": 99, "at": "2026-08-25T09:30:00Z", "from_office": True,
        "by_key": "smo", "by_name": "Nada Kamal", "body": "Looking at it now.",
        "flag": None, "has_shot": False})
    CHAT["unread"] = 1
    ck("the client asks again while waiting", poll_once(25000))
    pg.wait_for_timeout(400)
    ck("the count appears on the bubble",
       not pg.eval_on_selector("#chatn", "e => e.hidden") and
       pg.inner_text("#chatn").strip() == "1", pg.inner_text("#chatn"))
    ck("and the bubble announces it rather than changing in silence",
       pg.eval_on_selector("#chatbtn", "e => e.classList.contains('chring')"))
    CHAT["unread"] = 0


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
    _no_tour(pg3)
    pg3.goto(FILE_URL, wait_until="networkidle")
    pg3.wait_for_timeout(2500)
    ck("no bubble with no server behind the page",
       pg3.evaluate("() => !document.getElementById('chatdock')"))
    pg3.close()

    # ── 5 · THE OFFICE'S PAGE IS DRAWN, AND ITS ROWS STAY ONE CARD ───────
    print("\n5 · the office's page")
    pg.click('[data-md="setup"]')
    pg.wait_for_timeout(900)
    ck("the Platform Inbox is in the rail",
       pg.is_visible('[data-setupgo="chat"]'))
    # THE NAME IS ASSERTED HERE AND NOWHERE ELSE (§135.3, shortened). The chat
    # needs a server, so this is the only check that can see the entry at all —
    # `checks/setup-header.py` can assert the old names are gone and no more.
    ck("...and it is called the Platform Inbox, in the rail and on the page",
       pg.eval_on_selector('[data-setupgo="chat"] .rilab',
                           "e=>e.textContent.trim()") == "Platform Inbox")
    pg.click('[data-setupgo="chat"]')
    pg.wait_for_selector("#chinbox", timeout=8000)
    ck("...and the page says the same word the rail does (§121.1)",
       pg.eval_on_selector(".setupttl", "e=>e.textContent.trim()") == "Platform Inbox"
       and "Messages" not in pg.eval_on_selector("#panel", "e=>e.textContent"))
    ck("the inbox drew its two halves",
       pg.is_visible("#chqlist") and pg.is_visible("#chthread"))
    # AND IT OPENS ON SOMEBODY. The office comes here because a conversation is
    # waiting, so an inbox that lands on "pick somebody" with one row on the
    # left has made them press a button to be told what they came to read.
    pg.wait_for_selector(".chqrow", timeout=8000)
    pg.wait_for_selector("#chtbody", timeout=8000)
    ck("and opens on the conversation that is waiting",
       "4.2M" in pg.inner_text("#chtbody"))
    # ONE LINE PER ROW (§88) — a message is arbitrarily long and must not open
    # the queue up into a column of paragraphs.
    hs = pg.eval_on_selector_all(".chqrow", "n => n.map(x => x.getBoundingClientRect().height)")
    ck("a queue row stays one card tall %r" % hs, all(h < 90 for h in hs), hs)

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

    # ── 8 · THE OFFICE'S BOX FITS THE SCREEN (§100.5) ────────────────────
    # Islam: "the chat box requires a scroll up — this shouldn't happen." It
    # stood at a fixed height however tall the window was, so on a short screen
    # the reply box and Send fell below the fold.
    #
    # SWEPT, not checked at one size (§27.1: a layout verified at the height
    # that passes is not verified), and what is asserted is the RELATIONSHIP —
    # Send inside the window, the thread scrolling inside its own box — never a
    # number, so a later change to the chrome keeps it green (§53.5, §94.14).
    print("\n8 · the office's box fits the screen")
    heights = []
    for vh in (1000, 860, 760, 660):
        pg.set_viewport_size({"width": 1400, "height": vh})
        pg.wait_for_timeout(500)
        m = pg.evaluate("""() => {
            const q = s => document.querySelector(s);
            const tb = q('#chtbody'), send = q('[data-chreplysend]');
            if (!tb || !send) return null;
            const r = send.getBoundingClientRect();
            return { sendVisible: r.bottom <= window.innerHeight + 1 && r.top >= 0,
                     threadScrolls: tb.scrollHeight > tb.clientHeight + 2,
                     inbox: Math.round(q('#chinbox').getBoundingClientRect().height) }; }""")
        if not m:
            ck("a conversation is open at %dpx" % vh, False, "no thread")
            continue
        ck("at %dpx the Send button is on screen without scrolling" % vh, m["sendVisible"], m)
        ck("at %dpx the box shrank with the window (%dpx)" % (vh, m["inbox"]),
           m["inbox"] < vh, m["inbox"])
        heights.append(m["inbox"])
    # A FIXED HEIGHT PASSES EVERY ONE OF THOSE ON A TALL WINDOW, which is how
    # this shipped in the first place — the box has to FOLLOW the window, so
    # what is asserted is that it moved, not that it fitted.
    ck("and it follows the window rather than standing at one size %r" % heights,
       len(heights) == 4 and all(heights[i] > heights[i + 1] for i in range(3)), heights)
    # AND THE THREAD IS WHAT SCROLLS, not the page.
    pg.set_viewport_size({"width": 1400, "height": 760})
    # WAIT FOR THE THREAD, NOT FOR A CLOCK. A fixed 400ms here raced the
    # panel's own poll: `drawThread()` rewrites this body every few seconds,
    # and a measurement that lands mid-rewrite reads an EMPTY box and calls a
    # working build broken. Once settled the margin is enormous (1601px of
    # content in a 437px box), so the flake was never about the assertion —
    # it was about measuring before there was anything to measure. The
    # assertion itself is untouched.
    try:
        pg.wait_for_function(
            "() => { const e = document.querySelector('#chtbody');"
            " return e && e.children.length > 1; }", timeout=5000)
    except Exception:
        pass
    pg.wait_for_timeout(200)
    ck("the thread scrolls inside its own box",
       pg.eval_on_selector("#chtbody", "e => e.scrollHeight > e.clientHeight + 2"))
    ck("and the queue has a scroller of its own",
       pg.eval_on_selector("#chqlist", "e => getComputedStyle(e).overflowY === 'auto'"))
    pg.set_viewport_size({"width": 1400, "height": 950})
    pg.wait_for_timeout(300)

    ck("no console errors", not errs, errs[:4])

    # ── 9 · REPLYING MUST NOT MAKE THE CONVERSATION VANISH (§105) ────────
    # Islam: "the chat was a user he sent to me and I replied and the chat
    # disappeared from all places." Nothing was deleted — replying marks a
    # conversation ANSWERED, and the inbox opens on WAITING, which excludes
    # answered ones. So the act of replying removed the row from the list the
    # office was looking at, while its thread sat open beside it.
    #
    # BOTH HALVES ARE ASSERTED, because they fail at different moments: the row
    # you have OPEN staying put (the reply itself), and an empty Waiting list
    # naming where everything went (coming back later, nothing selected yet).
    # A check for only the first would pass on a build where the second is
    # still a dead end.
    print("\n9 · a conversation that has been answered")
    BOXQUEUE[0]["waiting"] = False          # the state a reply leaves behind
    pg.evaluate("()=>{const r=[...document.querySelectorAll('[data-setupgo]')]"
                ".find(x=>x.dataset.setupgo==='chat'); if(r) r.click();}")
    pg.wait_for_timeout(1500)

    open_row = pg.evaluate("""()=>({
        rows: document.querySelectorAll('.chqrow').length,
        thread: !!document.getElementById('chtbody'),
        litTabs: [...document.querySelectorAll('.chqtab')]
                   .filter(t=>t.classList.contains('on')).map(t=>t.dataset.chtab) })""")
    ck("the one you have open stays in the Waiting list once answered",
       open_row["rows"] == 1, open_row)
    ck("and its thread is still there beside it", open_row["thread"], open_row)
    ck("the Waiting tab is still the one lit — the filter did not change",
       open_row["litTabs"] == ["waiting"], open_row)

    # THE FLAGGED TAB WAS SAYING SOMETHING FALSE — "No conversations yet" when
    # there are conversations and none is flagged. Found while reproducing the
    # other fault; the same shape of lie, and the same fix: an empty state
    # describes THIS filter, never the whole product.
    pg.evaluate("()=>{const b=[...document.querySelectorAll('.chqtab')]"
                ".find(x=>x.dataset.chtab==='flagged'); if(b) b.click();}")
    pg.wait_for_timeout(600)
    flag = pg.evaluate("""()=>({
        text: (document.getElementById('chqlist')||{}).innerText || "",
        rows: document.querySelectorAll('.chqrow').length,
        lit: [...document.querySelectorAll('.chqtab')].filter(x=>x.classList.contains('on'))
               .map(x=>x.dataset.chtab) })""")
    ck("an empty Flagged tab never claims there are no conversations",
       "No conversations yet" not in flag["text"], flag)
    # LIT BY VALUE, NOT BY IDENTITY: the empty state's shortcut also carries
    # data-chtab, and the old handler compared nodes — so pressing it would
    # have un-lit all three tabs and left the row with nothing selected.
    ck("exactly one tab is lit, and it is the one pressed",
       flag["lit"] == ["flagged"], flag)
    BOXQUEUE[0]["waiting"] = True
    pg.evaluate("()=>{const b=[...document.querySelectorAll('.chqtab')]"
                ".find(x=>x.dataset.chtab==='waiting'); if(b) b.click();}")
    pg.wait_for_timeout(400)

    # ── 10 · IS THE BOT WORKING? (§123) ──────────────────────────────────
    # Islam, having turned the assistant on and had nothing come back: "I need
    # to understand if the bot is working."
    #
    # THE DEGRADATION WAS CORRECT AND SILENT. §112.2 made every failure land on
    # the chat as it worked before, so no key, a rejected model and a genuine
    # decline all look the same from the office's side. What is asserted is
    # that the diagnostic SEPARATES them — a check of the happy path alone
    # would be the same silence with a button on it.
    print("\n10 · the assistant's diagnostic")
    CHAT["test"] = [
        {"name": "The switch", "state": "ok", "detail": "The assistant answers first"},
        {"name": "The knowledge base", "state": "ok", "detail": "43 how-tos"},
        {"name": "The API key", "state": "fail", "detail": "No GEMINI_API_KEY here."},
    ]
    pg.evaluate("()=>{const r=[...document.querySelectorAll('[data-setupgo]')]"
                ".find(x=>x.dataset.setupgo==='chat'); if(r) r.click();}")
    pg.wait_for_timeout(1200)
    pg.evaluate("()=>{const b=document.querySelector('[data-chsetmenu]'); if(b) b.click();}")
    pg.wait_for_timeout(500)

    btn = pg.evaluate("""()=>{ const b=document.querySelector('[data-chtest]');
        if(!b) return null;
        const r=b.getBoundingClientRect();
        const e=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2);
        return { there:true, hit: e ? (e.closest('[data-chtest]') ? 'button' : e.tagName) : 'nothing' }; }""")
    ck("the office has a way to ask", bool(btn), btn)
    # PRESSABLE, NOT MERELY PRESENT (§70, §93.4) — and it was neither at first:
    # the branch was written into the `change` listener, where a <button> can
    # never reach it, so it rendered perfectly and did nothing (§96).
    ck("and it is pressable, not merely present", bool(btn) and btn["hit"] == "button", btn)

    if btn:
        pg.evaluate("()=>{ document.querySelector('[data-chtest]').click(); }")
        pg.wait_for_timeout(1200)
        stopped = pg.evaluate("""()=>({
            shown: !!document.querySelector('.chtest'),
            head: (document.querySelector('.chtest-h')||{}).textContent || "",
            stopped: [...document.querySelectorAll('.chtest-r')]
                       .filter(r=>r.querySelector('.tdot.bad')).length })""")
        ck("pressing it answers", stopped["shown"], stopped)
        # WHERE IT STOPS IS THE ANSWER. "It is not working" sends somebody to
        # look at everything; naming the step sends them to one page.
        ck("a failure names the step that stopped it",
           "not working" in stopped["head"].lower() and "key" in stopped["head"].lower(), stopped)
        ck("and marks exactly one row as the stopping point", stopped["stopped"] == 1, stopped)
        # AND THE NAME IS NOT SHOUTED DOWN (§124). The headline lowercases the
        # step's name so it reads as a sentence, and lowercasing the WHOLE of
        # it turned "The API key" into "the api key" in the one line somebody
        # reads first. Only the leading article moves.
        ck("an acronym in the step's name survives the headline",
           "the API key" in stopped["head"], stopped)

        # ── PRESENT IS NOT VALID (§124) ──────────────────────────────────
        # The row that says a key is there had said WORKING, off nothing but a
        # non-empty variable — while the row beneath it carried the provider
        # refusing that same key. A state is how a row is DRAWN; what it SAYS
        # about itself is a separate fact, and this is the one row where the
        # two must differ.
        CHAT["test"] = [
            {"name": "The switch", "state": "ok", "detail": "on"},
            {"name": "The knowledge base", "state": "ok", "detail": "43 how-tos"},
            {"name": "The API key", "state": "ok", "word": "present",
             "detail": "Present on this deployment."},
            {"name": "The key itself", "state": "fail",
             "detail": "the provider rejected the key: API key not valid."},
        ]
        pg.evaluate("()=>{ document.querySelector('[data-chtest]').click(); }")
        pg.wait_for_timeout(1200)
        pres = pg.evaluate("""()=>{ const rows=[...document.querySelectorAll('.chtest-r')];
            const find=n=>rows.find(r=>(r.querySelector('.chtest-n')||{}).textContent===n);
            const word=n=>{ const r=find(n); return r ? (r.querySelector('.chtest-s')||{}).textContent : null; };
            return { key: word('The API key'), itself: word('The key itself'),
                     head: (document.querySelector('.chtest-h')||{}).textContent || "" }; }""")
        ck("a present key never claims to be working",
           pres["key"] and "work" not in pres["key"].lower(), pres)
        ck("it says only what it checked", (pres["key"] or "").lower() == "present", pres)
        ck("and the refusal is reported against the key, not the model",
           "key itself" in pres["head"].lower(), pres)

        CHAT["test"] = [
            {"name": "The switch", "state": "ok", "detail": "on"},
            {"name": "The knowledge base", "state": "ok", "detail": "43 how-tos"},
            {"name": "The API key", "state": "ok", "detail": "Set"},
            {"name": "The model (x)", "state": "ok", "detail": "Answered in full"},
            {"name": "A question it should know", "state": "ok", "detail": "From your key objectives."},
        ]
        pg.evaluate("()=>{ document.querySelector('[data-chtest]').click(); }")
        pg.wait_for_timeout(1200)
        good = pg.evaluate("""()=>({
            head: (document.querySelector('.chtest-h')||{}).textContent || "",
            stopped: [...document.querySelectorAll('.chtest-r')]
                       .filter(r=>r.querySelector('.tdot.bad')).length })""")
        # AND THE WORKING CASE MUST READ DIFFERENTLY, or the diagnostic is a
        # decoration that always says the same thing.
        ck("a working assistant says so", good["head"].lower().startswith("it is working"), good)
        ck("and nothing is marked as a stopping point", good["stopped"] == 0, good)
    CHAT["test"] = None

    # ── 11 · A HANDOFF IS SAID OUT LOUD (§125) ───────────────────────────
    # It used to write nothing at all, which left the person looking at a
    # screen identical to the one they would see if the assistant had never
    # run. So what is asserted is that the two states DIFFER on screen — and
    # that saying so did not quietly turn the thread into an answered one.
    print("\n11 · a handoff the person can see")
    CHAT["messages"] = [
        {"id": 1, "at": "2026-08-26T09:00:00Z", "from_office": False, "by_key": "smo",
         "by_name": "Mohamed Essam", "body": "Where do I change the logo?",
         "flag": None, "bot": False, "handoff": False, "has_shot": False},
        {"id": 2, "at": "2026-08-26T09:00:02Z", "from_office": True, "by_key": "assistant",
         "by_name": "Assistant",
         "body": "I could not answer this one from the knowledge base. The office has it.",
         "flag": None, "bot": True, "handoff": True, "has_shot": False},
    ]
    CHAT["thread"] = {"waiting": True}
    # NO REFRESH HOOK, AND DELIBERATELY NOT ADDING ONE. The panel has exactly
    # one way to learn anything — its own poll (§97: nothing here ever calls
    # paint()) — so the check waits for a beat rather than reaching into the
    # module, and is measuring the path the product actually uses.
    # SECTION 10 LEFT THE SETTINGS MENU OPEN, and it covers the corner — the
    # click was refused outright rather than landing somewhere wrong, which is
    # the good failure (§110). Put it away the way a person would.
    pg.evaluate("()=>{const b=document.querySelector('[data-chsetmenu]'); if(b) b.click();}")
    pg.wait_for_timeout(400)
    if pg.eval_on_selector("#chatpanel", "e => e.hidden"):
        pg.click("#chatbtn")
    pg.wait_for_selector("#chatpanel:not([hidden])")
    pg.wait_for_timeout(5600)
    hand = pg.evaluate("""()=>({
        sys:  [...document.querySelectorAll('#chatbody .chsys')].map(x=>x.innerText),
        bub:  document.querySelectorAll('#chatbody .chmsg').length,
        out:  document.querySelectorAll('#chatbody .chout').length,
        named: [...document.querySelectorAll('#chatbody .chsys .chwho')].length })""")
    ck("the person is told the assistant could not answer", len(hand["sys"]) == 1, hand)
    # NOT A MESSAGE. The two sides of this conversation are the person and the
    # office, and a handoff is neither — so it wears no name and no bubble.
    ck("and it is narrated, not spoken by anybody",
       hand["bub"] == 1 and hand["named"] == 0, hand)
    # NO WAY OUT ON IT. That button is for a confident WRONG answer, where the
    # conversation has already left the queue; here somebody is already coming
    # and a control asking for what is happening anyway is worse than none.
    ck("and carries no way out, because one is not needed", hand["out"] == 0, hand)

    # AND THE OTHER STATE MUST LOOK DIFFERENT, or this asserts nothing: a build
    # that drew the line for every bot message would pass every line above.
    CHAT["messages"][1] = dict(CHAT["messages"][1],
                               body="From your key objectives — each actual against its target.",
                               handoff=False, source="headline")
    CHAT["thread"] = {"waiting": False}
    pg.wait_for_timeout(5600)
    ans = pg.evaluate("""()=>({
        sys: document.querySelectorAll('#chatbody .chsys').length,
        bot: document.querySelectorAll('#chatbody .chmsg.chbot').length,
        out: document.querySelectorAll('#chatbody .chout').length })""")
    ck("a real answer is a message, not a narrated line",
       ans["sys"] == 0 and ans["bot"] == 1, ans)
    ck("and it is the answer that carries the way out", ans["out"] == 1, ans)
    CHAT["messages"] = []
    CHAT["thread"] = None

    # ── 12 · THE SETTINGS, RE-SEQUENCED (§127) ───────────────────────────
    # ASSERTS THE PROBLEMS, NEVER THE LAYOUT (§94.8). The faults were: the
    # master switch sat third, under a setting it governs; the two email rows
    # sat five rows apart; the explanations were longer than the controls; and
    # a hover note is unreachable on a touch screen. A check written against
    # "row 4 is Assistant" would have to be rewritten the day anything moves.
    print("\n12 · the settings, in the order somebody decides them")
    pg.evaluate("()=>{const b=document.querySelector('[data-chsetmenu]');"
                " if(b && !document.querySelector('.chset')) b.click();}")
    pg.wait_for_timeout(400)
    # The assistant ON, so Handover email is drawn at all — it is the row that
    # carries the one status that must NOT have become a tooltip.
    pg.evaluate("""()=>{const b=[...document.querySelectorAll('[data-chset="assistant"]')]
        .find(x=>x.dataset.chval==='1' && !x.closest('.seg').classList.contains('lit'));
        if(b) b.click();}""")
    pg.wait_for_timeout(900)
    if not pg.query_selector('[data-chset="notify"]'):
        pg.evaluate("""()=>{const b=[...document.querySelectorAll('[data-chset="assistant"]')]
            .find(x=>x.dataset.chval==='1'); if(b) b.click();}""")
        pg.wait_for_timeout(900)

    seq = pg.eval_on_selector_all(
        ".chset .chset-row .chset-lab", "n=>n.map(x=>x.childNodes[0].textContent.trim())")
    ck("every setting is one or two words", bool(seq) and all(len(w.split()) <= 2 for w in seq), seq)
    # THE MASTER SWITCH GOVERNS EVERY OTHER ROW, so it cannot sit under one.
    ck("the switch that turns the whole thing off comes first",
       seq and seq[0] == "Chat", seq)
    # TWO SETTINGS ABOUT THE SAME ACT BELONG TOGETHER. They were five rows apart.
    if "Handover email" in seq and "Away email" in seq:
        ck("the two email settings are next to each other",
           abs(seq.index("Handover email") - seq.index("Away email")) == 1, seq)
    # ── HOW LONG IS AWAY (§169) ──────────────────────────────────────
    # The box lives on the Away email row and only while that email is ON — a
    # threshold for a send nobody makes is a control with nothing behind it
    # (§61). Asserted here rather than only in `scripts/test-chat.js`, because
    # that one proves the SERVER obeys the number and could go on passing with
    # nothing on screen to set it (§71's fault: the back half built and the
    # control never drawn).
    ck("the away threshold is set on the Away email row",
       pg.evaluate("""()=>{const n=document.querySelector('[data-chaway]');
           const r=n && n.closest('.chset-row');
           return !!r && r.querySelector('[data-chset="mail"]') !== null;}"""), None)
    # AND THE ROW'S OWN SENTENCE READS IT. It said "three minutes" as prose
    # while the server read a constant; a sentence that cannot follow the
    # setting is the second copy of it (§53.5).
    ck("...and the row says the number in force, not a number in the source",
       pg.evaluate("""()=>{const n=document.querySelector('[data-chaway]');
           const r=n && n.closest('.chset-row');
           const t=r && r.querySelector('[data-tip]');
           const tip=t ? t.getAttribute('data-tip') : '';
           return tip.indexOf(n.value + ' minute') > -1;}"""), None)
    # BOTH ENDS (§94.2): turn the away email off and the threshold goes with it.
    pg.evaluate("""()=>{const b=[...document.querySelectorAll('[data-chset="mail"]')]
        .find(x=>x.dataset.chval==='0'); if(b) b.click();}""")
    pg.wait_for_timeout(800)
    ck("with the away email off there is no threshold to set",
       pg.eval_on_selector_all("[data-chaway]", "n=>n.length") == 0)
    pg.evaluate("""()=>{const b=[...document.querySelectorAll('[data-chset="mail"]')]
        .find(x=>x.dataset.chval==='1'); if(b) b.click();}""")
    pg.wait_for_timeout(800)
    ck("...and turning it back on brings it back",
       pg.eval_on_selector_all("[data-chaway]", "n=>n.length") == 1)

    # TEST IS WHERE SOMEBODY STANDS AFTER FLIPPING THE ASSISTANT (§123).
    ck("Test the assistant is in the assistant's own row",
       pg.evaluate("""()=>{const t=document.querySelector('[data-chtest]');
           const r=t && t.closest('.chset-row');
           return !!r && r.querySelector('[data-chset="assistant"]') !== null;}"""), None)

    marks = pg.eval_on_selector_all(".chset .tip", "n=>n.length")
    ck("every setting explains itself behind a mark", marks == len(seq), [marks, len(seq)])
    # A STATUS IS NOT AN EXPLANATION and must not have gone behind a hover: a
    # tooltip cannot say "nobody is chosen" to somebody who never hovers.
    left = pg.eval_on_selector_all(".chset .chset-hint, .chset .chset-cost",
                                   "n=>n.map(x=>x.innerText)")
    ck("the prose is gone from the page", len(left) <= 1, left)
    ck("but the live status is not",
       len(left) == 1 and ("wait" in left[0].lower() or "emailed" in left[0].lower()
                           or "no one is set" in left[0].lower()), left)

    # A TAP OPENS IT. Hover does not exist on a tablet, and every explanation
    # now lives behind one of these — so a mark that answers only a mouse is
    # half the readers of this panel unable to read it.
    opened, outside = [], []
    for i in range(marks):
        # THE BUBBLE IS A ::after AND SO IS NOT AN ELEMENT — it has no
        # getBoundingClientRect, and measuring the ROW instead measures
        # something that is inside the panel by definition, which is a check
        # that cannot fail (§53.7's blind spot, §94.5). Its box is computed
        # from the containing block that `position` actually gives it, so the
        # measurement follows the CSS rather than assuming which rule is live.
        st = pg.evaluate("""(i)=>{const t=[...document.querySelectorAll('.chset .tip')][i];
            t.click();
            const s=getComputedStyle(t,'::after'), own=getComputedStyle(t);
            const cb=(own.position==='static' ? t.closest('.chset-row') : t)
                       .getBoundingClientRect();
            const w=parseFloat(s.width)+parseFloat(s.paddingLeft)+parseFloat(s.paddingRight);
            let left=cb.left+parseFloat(s.left||0);
            const m=/matrix\(([^)]+)\)/.exec(s.transform||"");
            if (m) left += parseFloat(m[1].split(',')[4]||0);
            const panel=document.querySelector('.chset').getBoundingClientRect();
            return { shown: s.display === 'block',
                     text: (t.dataset.tip||'').length,
                     box: [Math.round(left), Math.round(left+w)],
                     panel: [Math.round(panel.left), Math.round(panel.right)],
                     inPanel: left >= panel.left - 1 && left + w <= panel.right + 1,
                     open: document.querySelectorAll('.chset .tip.on').length };}""", i)
        if not st["shown"] or st["text"] < 20: opened.append([i, st])
        if not st["inPanel"] or st["open"] != 1: outside.append([i, st])
    ck("pressing a mark opens its note, and there is something in it", not opened, opened[:2])
    # ONE AT A TIME, and inside the panel — the platform's default centres the
    # bubble on a 14px icon, which hung a 264px note off the side of a 392px
    # dropdown. Anchored to the row instead, so it holds for every row.
    ck("one note at a time, and always inside the panel", not outside, outside[:2])
    # AND ANY OTHER PRESS PUTS IT AWAY, or a note stands over the control that
    # was just pressed.
    pg.evaluate("()=>{const r=document.querySelector('.chset-h'); if(r) r.click();}")
    pg.wait_for_timeout(250)
    ck("and pressing anything else puts it away",
       pg.eval_on_selector_all(".chset .tip.on", "n=>n.length") == 0)

    # ── 13 · THE SEND SAYS WHAT IS HAPPENING (§139) ──────────────────────
    # With the assistant on, `say` holds its response for the model round-trip
    # and the typed message used to sit in the box the whole time — "looked as
    # a glitch at the start" (Islam). The echo puts it in the thread at once;
    # what is asserted is the IN-FLIGHT state, the reconciliation, and that a
    # failure gives the words back.
    print("\n13 · a send in flight says so, and a failed one gives the words back")
    CHAT["cfg"]["assistant"] = True
    CHAT["messages"] = []
    CHAT["thread"] = None
    pg.evaluate("()=>{const p=document.getElementById('chatpanel');"
                " if(p && p.hidden) document.getElementById('chatbtn').click();}")
    pg.wait_for_timeout(800)
    CHAT["slow"] = 1.6
    pg.fill("#chatsay", "An echo, please")
    pg.evaluate("()=>{document.getElementById('chatsend').click();}")
    pg.wait_for_timeout(400)
    mid = pg.evaluate("""()=>({
        box: document.getElementById('chatsay').value,
        echoed: [...document.querySelectorAll('#chatbody .chmsg')]
                  .some(m=>m.innerText.includes('An echo, please')),
        wait: (x=>x?x.innerText:null)(document.querySelector('.chsys.chwait')) })""")
    ck("the message is in the thread the moment Send is pressed", mid["echoed"], mid)
    ck("and the box is already empty", mid["box"] == "", mid)
    ck("and the screen says the assistant is being asked",
       bool(mid["wait"]) and "assistant" in mid["wait"].lower(), mid)
    pg.wait_for_timeout(2200)
    CHAT["slow"] = 0
    fin = pg.evaluate("""()=>({
        wait: !!document.querySelector('.chsys.chwait'),
        echoed: [...document.querySelectorAll('#chatbody .chmsg')]
                  .some(m=>m.innerText.includes('An echo, please')) })""")
    ck("the server's answer replaces the echo and the line goes", fin["echoed"] and not fin["wait"], fin)

    # A FAILED SEND GIVES THE WORDS BACK — the one thing nobody can get back
    # is what they typed, and restoring beats merely not-clearing (§139).
    CHAT["status"] = 500
    pg.fill("#chatsay", "Words that must come back")
    pg.evaluate("()=>{document.getElementById('chatsend').click();}")
    pg.wait_for_timeout(900)
    CHAT["status"] = 200
    rb = pg.evaluate("""()=>({
        box: document.getElementById('chatsay').value,
        ghost: [...document.querySelectorAll('#chatbody .chmsg')]
                 .some(m=>m.innerText.includes('Words that must come back')),
        note: (x=>x?x.innerText:null)(document.getElementById('chatnote')),
        wait: !!document.querySelector('.chsys.chwait') })""")
    ck("the words are back in the box", rb["box"] == "Words that must come back", rb)
    ck("the echo is gone from the thread", not rb["ghost"], rb)
    # The note carries the SERVER'S OWN sentence when there is one (here the
    # stub's terse "no") and the product's "That did not send" only for a
    # network failure — which the abort drive proved and a stub cannot model.
    # What must hold either way: something is said, and the wait line is gone.
    ck("and the failure says so, with the wait line gone",
       bool(rb["note"]) and not rb["wait"], rb)
    CHAT["cfg"]["assistant"] = False
    CHAT["messages"] = []

    # ── 14 · A BOX FROM THE COMPUTER WHEN A REPLY LANDS (§225) ───────────
    # THREE SWITCHES, AND ALL THREE MUST SAY YES: the office's row in Chat
    # settings, this person's own bell, and the browser's permission. Each is
    # asserted at BOTH ENDS (§94.2) — a check that only looks for the box
    # appearing cannot see a build that shows it to somebody who said no, and
    # that is the failure that matters.
    print("\n14 · a box from the computer when a reply lands")

    # THE BROWSER IS MODELLED, NOT REAL. Every reader asks `window.Notification`
    # at call time rather than at load, so the stand-in can be installed here
    # without reloading the page under test — and a stand-in is the only way to
    # read back WHAT was shown, which is most of what wording B claims.
    FAKE_JS = """(perm) => {
            window.__pops = []; window.__asked = 0;
            function N(title, opts){
              window.__pops.push({title: title, body: (opts || {}).body,
                                  tag: (opts || {}).tag});
              this.close = function(){};
            }
            N.permission = perm;
            N.requestPermission = function(){ window.__asked++;
                                              return Promise.resolve(N.permission); };
            window.Notification = N; }"""
    def fake_browser(perm="granted"):
        pg.evaluate(FAKE_JS, perm)
    def pops():
        return pg.evaluate("() => window.__pops || []")
    def reply(body, at):
        """A reply lands from the office, the way the poll would bring it.

        AND THE CLIENT MUST ACTUALLY HAVE ASKED. A shut panel on an answered
        conversation is on the 180s idle beat (§98.1), so a wait that ends
        without a poll leaves every "no box appeared" assertion below passing
        because NOTHING HAPPENED — §94.5's own trap, and it was live here until
        the falsification run found it."""
        CHAT["messages"].append({
            "id": 500 + len(CHAT["messages"]), "at": at, "from_office": True,
            "by_key": "smo", "by_name": "Nada Kamal", "body": body,
            "flag": None, "has_shot": False})
        CHAT["unread"] = CHAT.get("unread", 0) + 1
        got = poll_once(30000)
        pg.wait_for_timeout(400)
        ck("  (the reply reached the browser)", got, "no poll inside 30s")

    # A clean start: sync the client's idea of unread with the stub's, or the
    # first arrival below would not read as an arrival at all.
    CHAT["messages"] = []; CHAT["unread"] = 0
    CHAT["cfg"] = dict(CHAT["cfg"], on=True, beat=4000)
    CHAT["cfg"].pop("popup", None)
    poll_once(25000); pg.wait_for_timeout(300)
    fake_browser("granted")

    # ── THE OFFICE'S SWITCH IS OFF (the shipped default) ─────────────────
    if pg.eval_on_selector("#chatpanel", "e => e.hidden"):
        pg.click("#chatbtn")
    pg.wait_for_selector("#chatpanel:not([hidden])")
    pg.wait_for_timeout(200)
    ck("with the office's switch off there is no bell to press",
       pg.eval_on_selector("#chatbell", "e => e.hidden"))
    pg.click("#chatclose")
    reply("Off for the tenant.", "2026-08-25T10:00:00Z")
    ck("...and no box at all", len(pops()) == 0, pops())

    # ── THE OFFICE TURNS IT ON ───────────────────────────────────────────
    CHAT["cfg"] = dict(CHAT["cfg"], popup=True)
    poll_once(25000); pg.wait_for_timeout(300)
    pg.click("#chatbtn")
    pg.wait_for_selector("#chatpanel:not([hidden])")
    pg.wait_for_timeout(200)
    ck("with it on, the bell is drawn",
       not pg.eval_on_selector("#chatbell", "e => e.hidden"))

    # GROUPED WITH THE MINIMISE, NEVER TWO CONTROLS EACH PUSHED RIGHT. That
    # was the fault the mockup caught: `.chx` carried `margin-left:auto`, so a
    # second one lands a gap apart with the heading squeezed between them.
    # Asserted as the RELATIONSHIP (§94.8) — side by side, on one line, with
    # the minimise still last — never as a pixel position.
    box = pg.evaluate("""() => {
        const b = document.getElementById('chatbell').getBoundingClientRect();
        const c = document.getElementById('chatclose').getBoundingClientRect();
        return {gap: Math.round(c.left - b.right),
                dy: Math.round(Math.abs((b.top + b.height / 2) - (c.top + c.height / 2))),
                order: b.left < c.left}; }""")
    ck("the bell sits beside the minimise (%dpx apart)" % box["gap"],
       0 <= box["gap"] <= 12, box)
    # ONE ROW IS NOT ONE `top` (§122.4) — two controls of two heights on one
    # line have two tops, so the middles are what agree.
    ck("...on the same line", box["dy"] <= 2, box)
    ck("...and the minimise is still the last thing on the row", box["order"], box)

    # ── THE PERSON'S OWN SWITCH, ON THIS DEVICE ──────────────────────────
    st = pg.evaluate("""() => ({
        pressed: document.getElementById('chatbell').getAttribute('aria-pressed'),
        key: localStorage.getItem('smp.chat.popup'),
        tip: document.getElementById('chatbell').title }) """)
    ck("it starts on, and says so", st["pressed"] == "true", st)
    # STORED AS AN ABSENCE (§50.6): on is the state with no key at all, so a
    # browser that has never been asked and one switched back on are identical.
    ck("...with nothing stored while it is on", st["key"] is None, st)
    ck("...and the hover says it is this device",
       "device" in (st["tip"] or "").lower(), st["tip"])

    pg.click("#chatbell")
    pg.wait_for_timeout(200)
    st = pg.evaluate("""() => ({
        pressed: document.getElementById('chatbell').getAttribute('aria-pressed'),
        key: localStorage.getItem('smp.chat.popup'),
        off: document.getElementById('chatbell').classList.contains('belloff') }) """)
    ck("pressing it turns them off", st["pressed"] == "false" and st["off"], st)
    ck("...and that is what is stored", st["key"] == "off", st)

    pg.click("#chatclose")
    reply("Switched off by me.", "2026-08-25T10:05:00Z")
    ck("a reply lands with no box while the person has them off",
       len(pops()) == 0, pops())

    # ── BACK ON, AND THE BOX SAYS WHO AND THE FIRST LINE (wording B) ─────
    pg.click("#chatbtn"); pg.wait_for_timeout(250)
    pg.click("#chatbell"); pg.wait_for_timeout(200)
    ck("pressing it again turns them back on",
       pg.eval_on_selector("#chatbell", "e => e.getAttribute('aria-pressed')") == "true")
    ck("...and the key is removed rather than set to something (§50.6)",
       pg.evaluate("() => localStorage.getItem('smp.chat.popup')") is None)
    pg.click("#chatclose")
    fake_browser("granted")
    reply("The March import is what carried it.", "2026-08-25T10:10:00Z")
    ps = pops()
    ck("a reply now shows exactly one box", len(ps) == 1, ps)
    if len(ps) == 1:
        # THE NAME IS ASSERTED AS AGREEMENT WITH THE THREAD, never as a literal
        # (§53.5, §94.8): `nameOf()` resolves through the register, so a
        # hardcoded name would pass on a build that printed the raw key.
        pg.click("#chatbtn"); pg.wait_for_timeout(300)
        said = pg.evaluate("""() => {
            const w = document.querySelectorAll('#chatbody .chwho span:first-child');
            return w.length ? w[w.length - 1].textContent.trim() : ''; }""")
        ck("...titled with the sender, the same words the thread prints",
           bool(ps[0]["title"]) and said.startswith(ps[0]["title"]),
           {"box": ps[0]["title"], "thread": said})
        ck("...and never the bare person key", ps[0]["title"] != "smo", ps[0]["title"])
        ck("...carrying the first line of the message",
           ps[0]["body"] == "The March import is what carried it.", ps[0]["body"])
        # ONE TAG, so a second reply replaces the first rather than stacking a
        # column of boxes on somebody who has been away from the screen.
        ck("...under one tag, so a second reply replaces it",
           ps[0]["tag"] == "smp-chat", ps[0]["tag"])
        pg.click("#chatclose")

    # ── NOTHING WHILE THE PANEL IS OPEN ──────────────────────────────────
    # The conversation is on screen; a box saying what is already visible is
    # noise, and the arrival guard already reads `!open`.
    pg.click("#chatbtn"); pg.wait_for_timeout(250)
    fake_browser("granted")
    reply("And this one lands while they are reading.", "2026-08-25T10:15:00Z")
    ck("no box while the conversation is open", len(pops()) == 0, pops())
    pg.click("#chatclose")

    # ── A BROWSER THAT HAS REFUSED ───────────────────────────────────────
    # Still drawn, or the silence is inexplicable — and `aria-disabled`, never
    # `disabled`, so the one sentence that explains it can be reached by hover
    # AND by focus (§221, §163).
    fake_browser("denied")
    pg.click("#chatbtn"); pg.wait_for_timeout(300)
    st = pg.evaluate("""() => { const b = document.getElementById('chatbell');
        return {hidden: b.hidden, dis: b.getAttribute('aria-disabled'),
                real: b.disabled, tip: b.title,
                pressed: b.getAttribute('aria-pressed')}; }""")
    ck("a browser that refused still shows the bell", not st["hidden"], st)
    ck("...marked aria-disabled and not disabled",
       st["dis"] == "true" and not st["real"], st)
    ck("...saying the browser is what is blocking it",
       "browser" in (st["tip"] or "").lower(), st["tip"])
    # FORCED, BECAUSE PLAYWRIGHT TREATS `aria-disabled` AS DISABLED (§222) —
    # and this is exactly the path under test: the control still takes a press
    # and still has to refuse it.
    pg.click("#chatbell", force=True); pg.wait_for_timeout(200)
    ck("...and pressing it changes nothing",
       pg.evaluate("() => localStorage.getItem('smp.chat.popup')") is None and
       pg.eval_on_selector("#chatbell", "e => e.getAttribute('aria-disabled')") == "true")
    pg.click("#chatclose")

    # ── THE PERMISSION IS ASKED ON A GESTURE, AND NOWHERE ELSE ───────────
    # Browsers only allow the question after one, and a box thrown at somebody
    # who has not asked for anything is the one people refuse out of reflex.
    fake_browser("default")
    reply("Nobody has opened anything yet.", "2026-08-25T10:20:00Z")
    ck("nothing is asked while the panel is shut",
       pg.evaluate("() => window.__asked") == 0)
    ck("...and no box either, with no permission",
       len(pops()) == 0, pops())
    pg.click("#chatbtn"); pg.wait_for_timeout(400)
    ck("opening the conversation is what asks",
       pg.evaluate("() => window.__asked") >= 1,
       pg.evaluate("() => window.__asked"))
    pg.click("#chatclose")

    # ── AND THE OFFICE IS TOLD WHEN SOMEBODY WRITES TO THEM ─────────────
    # Islam named the office FIRST. Their corner is their own conversation, so
    # nothing above this speaks for the queue — and the Platform Inbox's clock
    # stops the moment they leave that page, which is every page but one.
    # SIGNING IN WITH QUESTIONS ALREADY WAITING MUST NOT THROW A BOX at somebody
    # who has not been away — so this needs a FRESH page with the queue already
    # standing, not a rise from nought on a session that has been open all along
    # (which is a real arrival and correctly announces).
    # The conversation's own unread is cleared first, or its box fires here too
    # and the office's assertions read the wrong one. (The stub's `seen` does
    # not clear it the way the real endpoint does — §100.3, in the small.)
    CHAT["messages"] = []; CHAT["unread"] = 0
    CHAT["owaiting"] = 2
    CHAT["owho"] = "Hend Farouk"
    CHAT["obody"] = "The Q3 target on Active Base still reads 4.2M."
    pg.add_init_script("(" + FAKE_JS + ")('granted');")
    # AND THE RELOAD MUST NOT LAND BACK ON THE INBOX. §173 remembers where you
    # were in `sessionStorage`, so a plain reload from the office's own Platform
    # Inbox — which section 12 leaves the page on — reopens THERE, `#chinbox` is
    # present, and the queue's box correctly stays silent. The product is right;
    # the check was measuring from the one page that silences it, and every
    # office assertion failed while the person's half passed. Forgetting the
    # remembered place is what makes this a fresh session.
    pg.evaluate("() => { try { sessionStorage.removeItem('smp.where'); } catch (e) {} }")
    pg.goto(URL, wait_until="networkidle")
    pg.wait_for_selector("#chatdock:not([hidden])", timeout=10000)
    poll_once(25000); pg.wait_for_timeout(400)
    ck("the first answer of a session never announces a queue that was already there",
       len(pops()) == 0, pops())
    # THE CORNER IS OPENED so this runs on the fast beat — with a conversation
    # that is neither waiting nor unread the shut panel asks every 180s (§98.1)
    # and nothing below would happen inside the wait. It also puts the office's
    # OWN conversation on screen, which must not suppress the queue's box: the
    # two are about different things, and only the Inbox itself silences it.
    pg.click("#chatbtn"); pg.wait_for_timeout(400)
    fake_browser("granted")
    CHAT["owaiting"] = 3
    CHAT["owho"] = "Ramy Behairy"
    CHAT["obody"] = "Mobile's plan will not open for me."
    poll_once(25000); pg.wait_for_timeout(400)
    ps = pops()
    # A FAILURE HERE NAMES ITS CAUSE. Four things have to be true for the box to
    # appear, and an empty list says which of them was not (§123's argument, in
    # a check).
    diag = pg.evaluate("""() => ({
        perm: window.Notification && window.Notification.permission,
        off: localStorage.getItem('smp.chat.popup'),
        bell: !(document.getElementById('chatbell') || {}).hidden,
        inbox: !!document.getElementById('chinbox') })""")
    ck("a question arriving shows the office one box", len(ps) == 1,
       dict(diag, pops=ps))
    if len(ps) == 1:
        ck("...titled with who wrote", ps[0]["title"] == "Ramy Behairy", ps[0]["title"])
        ck("...carrying their first line",
           ps[0]["body"] == "Mobile's plan will not open for me.", ps[0]["body"])
        # ITS OWN TAG, or a question waiting and a reply on the office's own
        # conversation would replace one another.
        ck("...under its own tag, not the conversation's",
           ps[0]["tag"] == "smp-chat-office", ps[0]["tag"])
    # BOTH ENDS (§94.2): a queue that has not grown says nothing at all.
    fake_browser("granted")
    got = poll_once(30000); pg.wait_for_timeout(400)
    ck("  (and it asked again)", got, "no poll inside 30s")
    ck("...and nothing while the number has not moved", len(pops()) == 0, pops())
    # NOR WHILE THEY ARE LOOKING AT THE QUEUE — the page shows the name and the
    # line already, which is the same argument as `!open` one page out.
    pg.click('[data-md="setup"]'); pg.wait_for_timeout(700)
    pg.click('[data-setupgo="chat"]'); pg.wait_for_timeout(900)
    # AND THE CORNER IS OPENED AFTER ARRIVING, not before: a pointerdown outside
    # the dock minimises it (§100.4), so opening it first and then navigating
    # puts it back on the 180s beat — and the assertion below would then pass
    # because no poll ever happened rather than because nothing was shown.
    pg.click("#chatbtn"); pg.wait_for_timeout(500)
    fake_browser("granted")
    CHAT["owaiting"] = 4
    CHAT["owho"] = "Hala Nabil"
    CHAT["obody"] = "CX still refuses my fill."
    got = poll_once(30000); pg.wait_for_timeout(500)
    ck("  (the office's browser asked while on that page)", got, "no poll inside 30s")
    ck("no box while the office is reading the queue itself", len(pops()) == 0, pops())
    CHAT["owaiting"] = 0; CHAT.pop("owho", None); CHAT.pop("obody", None)
    # Back off the Inbox, or everything below measures a page it is not about.
    pg.goto(URL, wait_until="networkidle")
    pg.wait_for_selector("#chatdock:not([hidden])", timeout=10000)
    pg.wait_for_timeout(400)

    # ── A BROWSER WITH NO NOTIFICATIONS AT ALL (an iOS Safari tab) ───────
    # Nothing to decide, so nothing is drawn (§61) — and reading `.permission`
    # off a missing constructor must not throw on the one platform this is
    # least able to serve.
    pg.evaluate("() => { try { delete window.Notification; } catch (e) { window.Notification = undefined; } }")
    pg.click("#chatbtn"); pg.wait_for_timeout(300)
    ck("no bell on a browser that cannot show one",
       pg.eval_on_selector("#chatbell", "e => e.hidden"))
    ck("...and the conversation still works",
       not pg.eval_on_selector("#chatpanel", "e => e.hidden"))
    pg.click("#chatclose")
    fake_browser("granted")
    CHAT["cfg"].pop("popup", None)
    CHAT["messages"] = []; CHAT["unread"] = 0
    poll_once(25000)

    # ── 7 · AND A SESSION THE SERVER REFUSES, LAST ON PURPOSE ────────────
    # A refused session takes the corner away rather than leaving a control
    # that answers every press with a refusal. It runs AFTER the console
    # assertion because flipping the stub to 401 makes the page already open
    # log a resource failure — deliberately. Ordering it last is honest; a
    # filter that swallowed "401" would also swallow a real one.
    print("\n7 · a session the server refuses")
    CHAT["status"] = 401
    pg2 = b.new_page(viewport={"width": 1400, "height": 950})
    _no_tour(pg2)
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
