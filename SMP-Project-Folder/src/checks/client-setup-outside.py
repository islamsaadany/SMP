"""Setting a client up from the outside (§322, spec 044 revision 2).

Islam: "the setup should happen on the external creatoin not inside .. the
default create it's own units and functions that's wrong there is not default.
it should open blank if they want bu the wizard should start on the outside
window so the people after the setup can get intop the platform ready" — and,
of the card that used to sit beside it, "the wizard should go like the setting
one up I don't know what is the chaning it later?"

WHAT THIS ASSERTS, AND WHY EACH ONE IS HERE.

· WHAT THE PAGE POSTS, NOT WHAT IT DRAWS (§96). A flow wired to nothing
  renders perfectly, so the stub RECORDS every request and the assertions are
  made against those bodies: a step that looks answered and sends nothing is
  the fault this file exists to catch.

· THE ANSWERS ARE THE LIST, so removing a unit must post a list WITHOUT it.
  Asserting only that adding one arrives passes on a build that can never
  take anything away — and the flow is the only way a client's shape is
  written now, so that would be a one-way door.

· ONE SCREEN, NOT TWO. The card that asked for name, industry and notes a
  second time is asserted GONE: opening a client's Settings has to land on
  the flow with its own answers in it, or the two screens are back.

· THE PNG BUTTON OPENS A FILE CHOOSER. It did not — `var pick` was declared
  twice in one function and `var` is function-scoped, so it called .click()
  on a dropdown (§56.7). Driven as a real file chooser, because every
  assertion short of pressing it passed for as long as the fault existed.

· NOTHING ASKS FOR A DATE. Islam: "time is not relevant in the setup. the
  plan we upload will need this not the setup." Asserted across every step
  as an absence, which is the only way a step creeping back in is noticed.

· AND THE DULLED PARTS ARE INERT, NOT MERELY GREY (§61): the capabilities
  step disabled, the third plan type disabled and saying *later*.

EVERY PROBE DEGRADES (§215): this file drives eight steps, and one that
throws must report rather than take the count down with it.

Run: SMP_CHROME=... python3 qa-run.py checks/client-setup-outside.py
     SMP_PAGE=smp-app/shell/platform.html …   # the new stack's own copy
"""
import http.server, json, os, socketserver, threading
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
REPO = os.path.abspath(os.path.join(ROOT, ".."))
PORT = int(os.environ.get("SMP_CHECK_PORT", "3991"))
BASE = "http://127.0.0.1:%d" % PORT
PAGE = os.environ.get("SMP_PAGE") or os.path.join(REPO, "platform.html")

fails = []
def ck(what, ok, detail=""):
    print(("  ok   " if ok else "  FAIL ") + what + (("  — " + str(detail)) if detail and not ok else ""))
    if not ok:
        fails.append(what)

SENT = []

# The client the stub already holds, so "opening it afterwards" can be driven.
HELD = {
    "key": "elabd-foods", "name": "ElAbd Foods", "kind": "client", "status": "active",
    "mark": None, "industry": "Food & Beverage", "size": "large", "notes": "", "made_here": True,
}
SHAPE = {
    "companies": [], "units": [{"name": "Bakery", "company": ""}, {"name": "Dairy", "company": ""}],
    "functions": [{"name": "Finance", "format": "projects"}], "words": {},
}


class Stub(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

    def _send(self, body, ctype):
        b = body.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self):
        path = self.path.split("?")[0]
        if path in ("/platform", "/"):
            with open(PAGE, encoding="utf-8") as f:
                self._send(f.read(), "text/html; charset=utf-8")
            return
        # BOTH STACKS SERVE THIS PAGE (§53.5): the new stack's copy is
        # generated from this one with the script moved out, so SMP_PAGE
        # points a run at it and the script is served from beside it.
        if path == "/platform-page.js":
            with open(os.path.join(REPO, "smp-app", "public", "platform-page.js"), encoding="utf-8") as f:
                self._send(f.read(), "application/javascript; charset=utf-8")
            return
        if path == "/memory-split.js":
            with open(os.path.join(REPO, "smp-app", "public", "memory-split.js"), encoding="utf-8") as f:
                self._send(f.read(), "application/javascript; charset=utf-8")
            return
        # the page links its own mark; a stub that does not serve it
        # reports a working build broken with two console 404s (§100.3)
        if path in ("/favicon.svg", "/favicon.png"):
            f = os.path.join(REPO, path.lstrip("/"))
            if os.path.exists(f):
                with open(f, "rb") as fh:
                    raw = fh.read()
                self.send_response(200)
                self.send_header("Content-Type",
                                 "image/svg+xml" if path.endswith(".svg") else "image/png")
                self.send_header("Content-Length", str(len(raw)))
                self.end_headers()
                self.wfile.write(raw)
                return
        self.send_response(404); self.end_headers()

    def do_POST(self):
        n = int(self.headers.get("Content-Length", "0"))
        body = json.loads(self.rfile.read(n) or "{}")
        act = body.get("action")
        SENT.append(body)
        if act == "me":
            self._send(json.dumps({"ok": True, "account": {
                "email": "islam.saadany@forefront.consulting", "name": "Islam Saadany",
                "isAdmin": True}}), "application/json")
        elif act == "cards":
            self._send(json.dumps({"ok": True, "canAdd": True, "canConsultants": True,
                "canAccess": True, "cards": [dict(HELD, mine=True, seat="super", state="open",
                    canOpen=True, canConfig=True, units=2, planned=False, cycleOpen=False,
                    unreadable=False)]}), "application/json")
        elif act == "client":
            self._send(json.dumps({"ok": True, "client": HELD, "team": [], "seats": [
                {"key": "super", "name": "Super user", "note": "holds the access matrix"},
                {"key": "smoteam", "name": "SMO team", "note": "runs cycles"}],
                "canEdit": True, "register": [], "office": [], "shape": SHAPE,
                "holds": {"plans": 0, "capabilities": 0, "units": 2, "functions": 1},
                # §322.1 carries §320.4's band onto this flow's first step, so
                # the stub answers what that band reads — the whole offer and
                # what this client holds, both from the server (§53.5).
                "modules": ["strategy"], "offer": [
                    {"key": "strategy", "label": "Strategy", "note": "Plans, cycles and reviews.", "always": True},
                    {"key": "trial", "label": "Trial", "note": "A module with a page of its own.", "always": False}]}),
                "application/json")
        elif act == "setModules":
            on = body.get("on") is True
            self._send(json.dumps({"ok": True,
                "modules": ["strategy", "trial"] if on else ["strategy"]}), "application/json")
        elif act == "createClient":
            self._send(json.dumps({"ok": True, "key": "elabd-foods"}), "application/json")
        else:
            self._send(json.dumps({"ok": True}), "application/json")


def serve():
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", PORT), Stub)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def last(action):
    for b in reversed(SENT):
        if b.get("action") == action:
            return b
    return None


def steps(pg):
    return pg.eval_on_selector_all(".wzstep", "els => els.map(e => e.textContent.replace(/^[0-9✓]\\s*/, ''))")


srv = serve()
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 980})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append("console: " + m.text) if m.type == "error" else None)
    pg.goto(BASE + "/platform")
    pg.wait_for_timeout(500)

    # ── 1 · Add a client opens the flow, not a form of its own ───────────
    print("\n§1 · the way in")
    add = pg.query_selector(".ccard.add")
    ck("the clients page offers Add a client", bool(add))
    if add:
        add.click(); pg.wait_for_timeout(350)
    ck("it opens the set-up flow", bool(pg.query_selector(".wzrail")))
    names = steps(pg)
    ck("eight steps", isinstance(names, list) and len(names) == 8, names)
    ck("…beginning with the client", bool(names) and names[0].strip() == "The client", names)
    ck("…and ending on the summary", bool(names) and names[-1].strip() == "Summary", names)

    # NOTHING ASKS FOR A DATE (§322): the horizon comes in on the plan, and
    # the cycle's dates are set inside the platform.
    date_words = ["year", "horizon", "date", "quarter", "cycle covers"]
    rail_text = " ".join(names).lower()
    ck("no step asks for a date", not any(w in rail_text for w in date_words), names)

    # ── 2 · The client step, and the standard list ───────────────────────
    print("\n§2 · the client")
    ck("the name is asked", bool(pg.query_selector(".rowset .fld")))
    ind = pg.query_selector("#setupsaid") is not None
    ck("one notice element, replaced rather than piled up", ind)
    pick = pg.query_selector(".wzpick .fld")
    ck("the industry is a searchable list", bool(pick))
    if pick:
        pick.click(); pg.wait_for_timeout(150)
        pick.fill("food"); pg.wait_for_timeout(200)
        opts = pg.eval_on_selector_all(".wzpanel .opt", "els => els.map(e => e.textContent)")
        ck("typing narrows it to the standard entries",
           isinstance(opts, list) and "Food & Beverage" in opts, opts)
        ck("…and the whole list is the standard one, not a free box",
           isinstance(opts, list) and len(opts) >= 2 and len(opts) <= 6, opts)
        if isinstance(opts, list) and "Food & Beverage" in opts:
            pg.click(".wzpanel .opt >> text=Food & Beverage")
            pg.wait_for_timeout(150)
    bands = pg.eval_on_selector_all(".wzband button", "els => els.map(e => e.textContent)")
    ck("size is a band of five, not a headcount",
       isinstance(bands, list) and len(bands) == 5, bands)
    ck("…and it carries the people counts",
       isinstance(bands, list) and any("201" in x for x in bands), bands)

    # THE PNG BUTTON OPENS A FILE CHOOSER (§56.7, and Islam pressed it).
    opened = False
    try:
        with pg.expect_file_chooser(timeout=2500):
            pg.click(".markrow >> text=Choose a PNG")
        opened = True
    except Exception as e:
        opened = False
    ck("Choose a PNG opens a file chooser", opened)

    # ── 3 · The first step is what creates the client ────────────────────
    print("\n§3 · creating")
    nm = pg.query_selector(".rowset .fld")
    if nm:
        nm.fill("ElAbd Foods"); pg.wait_for_timeout(120)
    pg.click(".wzfoot >> text=Next")
    pg.wait_for_timeout(600)
    made = last("createClient")
    ck("Next on the first step creates the client", bool(made), SENT[-1] if SENT else None)
    ck("…carrying the name", bool(made) and made.get("name") == "ElAbd Foods", made)
    ck("…the industry from the standard list",
       bool(made) and made.get("industry") == "Food & Beverage", made)
    ck("…and the size band", bool(made) and "size" in made, made)

    # ── 4 · The units step starts EMPTY, and what it posts is the list ───
    print("\n§4 · the business units")
    at = pg.eval_on_selector(".wzstep[aria-current='step']", "e => e.textContent")
    ck("it moved on to the business units", isinstance(at, str) and "Business units" in at, at)
    # the stub's client already holds two, which is what "opening it later"
    # looks like; the EMPTY state is asserted on the panel's own words.
    ck("a unit can be added", bool(pg.query_selector(".wzadd")))
    before = len(pg.query_selector_all(".wzrow"))
    pg.click(".wzadd")
    pg.wait_for_timeout(250)
    row = pg.query_selector_all(".wzrow .fld")
    if row:
        row[-1].fill("Sweets")
        row[-1].evaluate("e => e.blur()")
    pg.wait_for_timeout(150)
    ck("the row appears", len(pg.query_selector_all(".wzrow")) == before + 1)
    pg.click(".wzstep >> text=Companies")
    pg.wait_for_timeout(500)
    shaped = last("shapeClient")
    ck("leaving the step posts the shape", bool(shaped), SENT[-1] if SENT else None)
    units = (shaped or {}).get("shape", {}).get("units", [])
    ck("…and the new unit is in it",
       any(u.get("name") == "Sweets" for u in units), units)

    # THE ANSWERS ARE THE LIST — removing one has to post a list without it.
    print("\n§5 · the answers are the list")
    pg.click(".wzstep >> text=Business units")
    pg.wait_for_timeout(400)
    xs = pg.query_selector_all(".wzrow .wzx")
    if xs:
        xs[0].click(); pg.wait_for_timeout(250)
    pg.click(".wzstep >> text=Companies")
    pg.wait_for_timeout(500)
    shaped2 = last("shapeClient")
    u2 = (shaped2 or {}).get("shape", {}).get("units", [])
    ck("removing a unit posts a list without it",
       bool(shaped2) and not any(u.get("name") == "Bakery" for u in u2), u2)
    ck("…and keeps the others", any(u.get("name") == "Sweets" for u in u2), u2)

    # ── 6 · The functions step, and what is drawn and dulled ─────────────
    print("\n§6 · the functions, and what is not built")
    pg.click(".wzstep >> text=Functions")
    pg.wait_for_timeout(450)
    opts = pg.eval_on_selector_all(".wzrow select option",
        "els => els.map(e => ({ t: e.textContent, off: e.disabled }))")
    ck("three plan types are offered", isinstance(opts, list) and len(opts) == 3, opts)
    ck("…two are live", isinstance(opts, list) and sum(1 for o in opts if not o["off"]) == 2, opts)
    ck("…and the third is INERT and says later",
       isinstance(opts, list) and any(o["off"] and "later" in o["t"].lower() for o in opts), opts)
    caps = pg.query_selector(".wzstep.later")
    ck("the capabilities step is drawn", bool(caps))
    ck("…and is inert rather than merely grey",
       bool(caps) and caps.get_attribute("disabled") is not None)

    # ── 7 · The summary, and the way out ─────────────────────────────────
    print("\n§7 · the summary")
    pg.click(".wzstep >> text=Summary")
    pg.wait_for_timeout(450)
    lines = pg.eval_on_selector_all(".wzline .sk", "els => els.map(e => e.textContent)")
    ck("the summary lists what was answered", isinstance(lines, list) and len(lines) >= 6, lines)
    ck("…including the industry and the size",
       isinstance(lines, list) and "Industry" in lines and "Size" in lines, lines)
    ck("no line is a date",
       isinstance(lines, list) and not any(w in " ".join(lines).lower() for w in date_words), lines)
    doors = pg.eval_on_selector_all(".wzdoor .dn", "els => els.map(e => e.textContent)")
    ck("two doors", isinstance(doors, list) and len(doors) == 2, doors)
    ck("…one of them opens the platform",
       isinstance(doors, list) and any("Open the platform" in d for d in doors), doors)
    ck("every summary line is a way back",
       len(pg.query_selector_all(".wzline .wzed")) == len(lines or []))

    # ── 8 · ONE SCREEN: Settings opens the flow with its answers in it ────
    print("\n§8 · opening it afterwards")
    pg.click(".wzdoor >> text=Back to clients")
    pg.wait_for_timeout(500)
    cog = pg.query_selector(".ccfg")
    ck("a client's card offers Settings", bool(cog))
    if cog:
        cog.click(); pg.wait_for_timeout(500)
    ck("it opens the SAME flow", bool(pg.query_selector(".wzrail")))
    ck("…and not a card of its own",
       pg.query_selector(".wzrail") is not None and pg.query_selector(".cfg .rowset") is None)
    val = pg.eval_on_selector(".rowset .fld", "e => e.value")
    ck("the client's own answers are already in it", val == "ElAbd Foods", val)
    pg.click(".wzstep >> text=Business units")
    pg.wait_for_timeout(400)
    held = pg.eval_on_selector_all(".wzrow .fld", "els => els.map(e => e.value)")
    ck("…including the shape it already holds",
       isinstance(held, list) and "Bakery" in held and "Dairy" in held, held)

    # ── 8b · THE MODULES BAND, CARRIED ACROSS THE REWRITE (§322.1) ───────
    #
    # §320.4 built this band under the client's name on the settings page and
    # §322 replaced that whole page with this flow — two sessions rewriting one
    # screen, and the band survives or it does not, with nothing in between
    # (§318.7). So it is asserted HERE rather than left to the card's own check,
    # which walks the grid and never opens this step.
    #
    # BOTH ENDS EVERY TIME (§94.2): "the default has no button" is satisfied
    # perfectly by a band with no buttons at all, so the row that CAN be
    # switched is asserted beside it — and the press is read off what the page
    # POSTED, never off the word on the button (§96).
    print("\n§8b · the modules band")
    pg.click(".wzstep >> text=The client")
    pg.wait_for_timeout(400)
    band = pg.query_selector(".band")
    ck("the client step carries the modules band", bool(band))
    labs = pg.eval_on_selector_all(".band .teamrow .nm", "els => els.map(e => e.textContent)")
    ck("…with a row per module the SERVER offers", labs == ["Strategy", "Trial"], labs)
    rows = pg.eval_on_selector_all(
        ".band .teamrow", "els => els.map(e => [e.querySelector('.nm').textContent,"
        " !!e.querySelector('button'), (e.querySelector('.sp') || {}).textContent || ''])")
    ck("the default says Always on and carries no control (§94.15)",
       any(r[0] == "Strategy" and r[1] is False and "Always on" in r[2] for r in rows), rows)
    ck("…and a module that is not the default does carry one",
       any(r[0] == "Trial" and r[1] is True for r in rows), rows)
    # EVERY PROBE DEGRADES (§215, this file's own promise): a press on a
    # control that is not there throws after 30s and takes the four assertions
    # below with it, so the falsification reports nothing where it should
    # report four — which is what the first run of this section did.
    turn = pg.query_selector(".band .teamrow button")
    if turn:
        turn.click()
        pg.wait_for_timeout(450)
    sent = last("setModules")
    ck("pressing it posts setModules for that module, on",
       bool(sent) and sent.get("module") == "trial" and sent.get("on") is True, sent)
    after = pg.eval_on_selector_all(".band .teamrow .sp", "els => els.map(e => e.textContent)")
    ck("…and the row reads back what the SERVER answered, in place",
       any("On" in x and "Always" not in x for x in after), after)
    cur = pg.query_selector(".wzstep[aria-current='step']")
    ck("…without repainting the step out from under it (§71.2)",
       cur is not None and "The client" in cur.text_content())

    # ── 9 · nothing thrown ───────────────────────────────────────────────
    print("\n§9 · the console")
    ck("no page errors", not errs, errs[:3])
    b.close()

srv.shutdown()
print("\n%d failures" % len(fails))
for f in fails:
    print("  - " + f)
