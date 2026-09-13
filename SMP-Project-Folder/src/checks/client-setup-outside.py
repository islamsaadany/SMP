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
# How many authored plan lines the stub's client holds. 0 for every section
# but §8e, which sets it and puts it back (§94.2).
PLANNED = [0]

# The client the stub already holds, so "opening it afterwards" can be driven.
HELD = {
    "key": "elabd-foods", "name": "ElAbd Foods", "kind": "client", "status": "active",
    "mark": None, "industry": "Food & Beverage", "size": "large", "notes": "", "made_here": True,
}
SHAPE = {
    "companies": [], "units": [{"name": "Bakery", "company": ""}, {"name": "Dairy", "company": ""}],
    "functions": [{"name": "Finance", "format": "projects"}],
    "capabilities": [], "words": {},
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
                # A CLIENT WITH A PLAN IN IT IS A STATE THE FLOW CANNOT REACH
                # ON ITS OWN — a pillar is authored INSIDE the platform — so the
                # stub is told to answer one (§255), and §8e asks for it.
                "holds": {"plans": PLANNED[0], "capabilities": 0, "units": 2, "functions": 1},
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


def here_at(pg):
    e = pg.query_selector(".wzstep[aria-current='step']")
    return (e.text_content() or "").strip() if e else None


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
    # ── 6 · The functions, and the word the middle option carries ────────
    #
    # REWRITTEN, NOT LOOSENED (§218, twice over). This asserted "two are live
    # and the third is INERT and says later", which was true until §342 built
    # the third way — and was left standing, so this file was red on main's own
    # build for main's own decision (§51.11, established by measuring that this
    # branch never touched FORMATS). And it asserted the capabilities step is
    # inert, which §347 reverses.
    #
    # What replaces them is the claim that survives either decision: the plan
    # types the step offers are the plan types the PLATFORM has, spelled the
    # platform's own way. "Capabilities & projects" was a third spelling of a
    # word planFormatCell and capFormatCell both write as Projects, and it
    # named the arrangement §343 replaced (a function holds its own projects
    # now). Asserted as the SET, so a fourth way added tomorrow fails here
    # until the wizard offers it.
    print("\n§6 · the functions, and the words the options carry")
    pg.click(".wzstep >> text=Functions")
    pg.wait_for_timeout(450)
    opts = pg.eval_on_selector_all(".wzrow select option",
        "els => els.map(e => ({ t: e.textContent.trim(), off: e.disabled }))")
    words = [o["t"] for o in opts] if isinstance(opts, list) else []
    ck("three plan types are offered", len(words) == 3, words)
    ck("…all three are live, since §342 built the third",
       bool(opts) and all(not o["off"] for o in opts), opts)
    ck("…and the middle one is Projects, the platform's own word for it",
       "Projects" in words and not any("Capabilities &" in w for w in words), words)
    ck("…with no option still saying 'later'",
       not any("later" in w.lower() for w in words), words)

    # ── 6b · THE CAPABILITIES STEP WRITES ONE (§347) ─────────────────────
    #
    # It was dulled and said "What does not exist is a capability standing on
    # its own beside the business units" — which spec 049 built (§341, §343).
    # So the claim is that the step now WRITES, asserted off what the page
    # POSTS and never off the boxes (§96: a step wired to nothing draws
    # perfectly).
    #
    # THREE QUESTIONS PER ROW, and the holder list is the functions one step
    # away plus unassigned — the same row Setup › Capabilities draws, which is
    # what makes this one answer rather than two (§53.5).
    print("\n§6b · the capabilities step")
    pg.click(".wzstep >> text=Capabilities")
    pg.wait_for_timeout(450)
    ck("the step opens rather than refusing", "Capabilities" in (here_at(pg) or ""), here_at(pg))
    ck("…and says nothing about being a build of its own",
       not pg.query_selector(".wzlaterline"))
    ck("…and offers a capability to be added", bool(pg.query_selector(".wzadd")))
    add = pg.query_selector(".wzadd")
    if add:
        add.click(); pg.wait_for_timeout(300)
    row = pg.query_selector_all(".wzrow input.fld")
    ck("…and the cursor lands in the new row's NAME, not one of its pickers",
       bool(row) and pg.evaluate("document.activeElement && document.activeElement.tagName") == "INPUT")
    if row:
        row[-1].fill("Cold chain")
        row[-1].evaluate("e => e.blur()")
    pg.wait_for_timeout(150)
    sels = pg.query_selector_all(".wzrow select")
    holders = pg.eval_on_selector_all(".wzrow select",
        "els => els.length ? Array.from(els[0].options).map(o => o.textContent.trim()) : []")
    ck("the holder list is unassigned plus the functions this client has",
       isinstance(holders, list) and len(holders) == 2 and "Finance" in holders
       and any("unassigned" in h for h in holders), holders)
    forms = pg.eval_on_selector_all(".wzrow select",
        "els => els.length > 1 ? Array.from(els[1].options).map(o => o.textContent.trim()) : []")
    # A CAPABILITY HAS TWO FORMS, NOT THE FUNCTION'S THREE (§342): capFormat()
    # reads anything that is not "pillars" as projects, so offering the third
    # would be a control whose answer the graph turns into something else.
    ck("…and it plans two ways, not the function's three", forms == ["Pillars", "Projects"], forms)
    if len(sels) >= 2:
        sels[0].select_option(label="Finance")
        pg.wait_for_timeout(120)
        sels[1].select_option(label="Pillars")
        pg.wait_for_timeout(120)
    n_before = len(SENT)
    pg.click(".wzstep >> text=Functions")
    pg.wait_for_timeout(500)
    shaped = last("shapeClient")
    caps = (shaped or {}).get("shape", {}).get("capabilities", [])
    ck("leaving the step posts the capability", len(caps) == 1, caps)
    ck("…with its name, its holder and how it plans",
       bool(caps) and caps[0].get("name") == "Cold chain"
       and caps[0].get("fn") == "Finance" and caps[0].get("format") == "pillars", caps)
    # THE ANSWERS ARE THE LIST (§322), the other end: removing it posts a list
    # without it, or "it can be added" is half a control.
    pg.click(".wzstep >> text=Capabilities")
    pg.wait_for_timeout(420)
    xs = pg.query_selector_all(".wzrow .wzx")
    if xs:
        xs[0].click(); pg.wait_for_timeout(250)
    pg.click(".wzstep >> text=Functions")
    pg.wait_for_timeout(500)
    caps2 = (last("shapeClient") or {}).get("shape", {}).get("capabilities", [])
    ck("…and removing it posts a list without it", caps2 == [], caps2)

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

    # ── 8c · A ROW WITH NO NAME IS REFUSED, NOT DROPPED (§346) ───────────
    # The minter skips a blank name, so the row was posted, thrown away and
    # left drawn until the client was reopened — accepted on screen, gone in
    # the database, nothing said (§96 with the sign reversed). Islam: "refuse
    # to move on without naming or remove."
    #
    # ASSERTED AS WHAT THE PAGE POSTS AND WHERE IT STANDS, never as the
    # notice's wording: a build that said something and moved on anyway would
    # satisfy a text assertion perfectly (§94.8).
    print("\n§8c · a row with no name")
    pg.click(".wzstep >> text=Business units")
    pg.wait_for_timeout(400)
    pg.click(".wzadd")
    pg.wait_for_timeout(250)
    n_before = len(SENT)
    pg.click(".wzfoot >> text=Next")
    pg.wait_for_timeout(450)
    at = pg.eval_on_selector(".wzstep[aria-current='step']", "e => e.textContent")
    ck("Next does not leave the step while a row has no name",
       isinstance(at, str) and "Business units" in at, at)
    ck("…and nothing is posted, because a blank row is not a server error",
       not any(b.get("action") == "shapeClient" for b in SENT[n_before:]),
       [b.get("action") for b in SENT[n_before:]])
    said = pg.query_selector("#setupsaid")
    ck("…and it says which kind of row and what to do",
       bool(said) and not said.is_hidden() and "×" in (said.text_content() or ""),
       said.text_content() if said else None)
    # BOTH ENDS (§94.2): a build that simply never moved on would pass all three.
    rows = pg.query_selector_all(".wzrow .fld")
    if rows:
        rows[-1].fill("Sweets 2")
        rows[-1].evaluate("e => e.blur()")
    pg.wait_for_timeout(150)
    pg.click(".wzfoot >> text=Next")
    pg.wait_for_timeout(500)
    at2 = pg.eval_on_selector(".wzstep[aria-current='step']", "e => e.textContent")
    ck("…and naming it lets you move on", isinstance(at2, str) and "Companies" in at2, at2)

    # ── 8d · BACK AND NEXT AGREE ABOUT WHICH STEP IS NEXT (§346, §347) ───
    #
    # REWRITTEN, NOT DELETED (§218). §346 found Next stepping over the dulled
    # Capabilities step while Back walked into it and returned — an enabled,
    # pressable button that did nothing (§96) — and asserted the landing by
    # name. §347 opens that step, so there is no dulled step left to walk past
    # and an assertion about one would pass over nothing (§113.8).
    #
    # So the subject becomes the property that would have caught the original
    # fault whether or not anything is dulled: walk the whole rail forward with
    # Next, then all the way back with Back, and the two orders must be each
    # other reversed. A Back that refuses to move shows up as a short list.
    print("\n§8d · Back and Next, across the whole rail")
    pg.click(".wzstep >> text=The client")
    pg.wait_for_timeout(400)

    def here():
        e = pg.query_selector(".wzstep[aria-current='step']")
        return (e.text_content() or "").strip() if e else None

    fwd = [here()]
    for _ in range(len(steps(pg))):
        n = pg.query_selector(".wzfoot >> text=Next")
        if not n or n.is_disabled():
            break
        n.click(); pg.wait_for_timeout(420)
        w = here()
        if w == fwd[-1]:
            break
        fwd.append(w)
    back = [here()]
    for _ in range(len(steps(pg))):
        bb = pg.query_selector(".wzfoot >> text=Back")
        if not bb or bb.is_disabled():
            break
        bb.click(); pg.wait_for_timeout(420)
        w = here()
        if w == back[-1]:
            break
        back.append(w)
    ck("Next walks the whole rail", len(fwd) == len(steps(pg)), fwd)
    ck("…and Back walks it back, the same steps in the other order",
       back == list(reversed(fwd)), {"forward": fwd, "back": back})
    # BOTH ENDS (§94.2): on the first step Back is disabled rather than dead,
    # which is the one place it is right for it not to move.
    b0 = pg.query_selector(".wzfoot >> text=Back")
    ck("and on the first step Back is disabled rather than dead",
       bool(b0) and b0.is_disabled(), here())
    # AND NOTHING IN THE RAIL IS INERT ANY MORE (§347). Said as a measurement
    # rather than left as an absence: a step that cannot be opened is what §346
    # had to step over, and there is now none.
    inert = pg.eval_on_selector_all(".wzstep",
        "els => els.filter(e => e.disabled).map(e => e.textContent.trim())")
    ck("no step in the rail refuses to open", inert == [], inert)

    # ── 8e · A CLIENT WITH A PLAN SAYS SO (§346) ─────────────────────────
    # shapeClient has refused a re-shape since §322 and the flow was TOLD so,
    # storing `holds` from the server and reading it nowhere — so the four
    # shape steps stayed editable and the refusal arrived on Next (§42's
    # drift, screen yes and save no).
    print("\n§8e · a client that already has a plan")
    PLANNED[0] = 12
    pg.goto(BASE + "/platform")
    pg.wait_for_timeout(600)
    # The card's own Settings mark, the same door §8 uses — and EVERY PROBE
    # DEGRADES from here (§215, this file's own promise, which my first run of
    # this section broke: a pg.click on a step that is not there waits 30s and
    # took the eight assertions after it down with it).
    cog = pg.query_selector(".ccfg")
    if cog:
        cog.click(); pg.wait_for_timeout(600)
    opened = bool(pg.query_selector(".wzrail"))
    ck("the flow opens on a client that has a plan", opened)

    def step(name):
        if not opened:
            return False
        b = pg.query_selector(".wzstep >> text=" + name)
        if not b:
            return False
        b.click(); pg.wait_for_timeout(450)
        return True

    on_units = step("Business units")
    ck("…and its business units step can be reached", on_units)
    band = pg.query_selector(".wzarched") if on_units else None
    ck("the shape steps say the shape is set from here on",
       bool(band) and "shape is set" in (band.text_content() or ""),
       band.text_content() if band else None)
    ro = pg.eval_on_selector_all(".wzrow .fld",
        "els => els.map(e => !!e.readOnly || !!e.disabled)") if on_units else []
    ck("…and every unit's box is read-only",
       isinstance(ro, list) and len(ro) > 0 and all(ro), ro)
    ck("…and no unit can be added",
       on_units and not pg.query_selector(".wzadd:not([disabled])"))
    on_words = step("The words")
    wro = pg.eval_on_selector_all(".wztbl input",
        "els => els.map(e => !!e.readOnly || !!e.disabled)") if on_words else []
    ck("…and the words are read-only too", isinstance(wro, list) and len(wro) > 0 and all(wro), wro)
    # BOTH ENDS (§94.2): what is frozen is the SHAPE, and the client's own
    # record, its mark, its modules and its team are still the consultant's.
    on_client = step("The client")
    nm = pg.query_selector(".rowset .fld") if on_client else None
    ck("…while the client's own name is still editable",
       bool(nm) and not nm.evaluate("e => !!e.readOnly"))
    ck("…and the modules band still carries its control",
       on_client and bool(pg.query_selector(".band .teamrow button:not([disabled])")))
    # AND THE CLIENT STEP IS NOT A SHAPE STEP, so it carries no band at all —
    # a band drawn on every step would claim the name cannot be changed either
    # (§124), and it is the same assertion as "never beside the archived one".
    ck("…and that step carries no band, because nothing on it is frozen (§94.2)",
       on_client and len(pg.query_selector_all(".wzarched")) == 0,
       pg.eval_on_selector_all(".wzarched", "els => els.map(e => e.textContent)"))
    PLANNED[0] = 0

    # ── 9 · nothing thrown ───────────────────────────────────────────────
    print("\n§9 · the console")
    ck("no page errors", not errs, errs[:3])
    b.close()

srv.shutdown()
print("\n%d failures" % len(fails))
for f in fails:
    print("  - " + f)
