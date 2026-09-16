"""The console's three doors (§357, spec 055).

Islam: "the client either we open a module or we go to the client settings
page where we find a rail with the client settings" — and, of which chrome
draws that rail, "A": the client platform's own Setup. So the set-up flow
that lived on this page from §322 to §352 is GONE from the console, and what
the console keeps is exactly what a client's own address cannot draw:

  · a LIVE card's Settings is a door — one press to /<client>/setup, the
    client's own Setup rail, with nothing drawn between the card and it;
  · Add a client draws the CREATE piece (client-setup.js `mountCreate`): a
    name, the standard industry list, a size band and notes, no step rail —
    because a client has no address until it exists — and the press posts
    `createClient` and then goes INTO the client at /<key>/setup/start;
  · an ARCHIVED card's Settings draws the archived piece on this page
    (`mountArchived`, §323): bring back, and delete — because an archived
    client's address answers nobody (§61).

WHAT THIS ASSERTS, AND WHY EACH ONE IS HERE.

· THE OLD FLOW IS ASSERTED GONE, AT BOTH ENDS (§94.2, §24): no `.wzstep` on
  the console page after any press, and the console's SOURCE holds no step
  flow — read off the file, because a flow left in the page and merely not
  mounted is the drift this move exists to end (§53.5).

· WHAT THE PAGE POSTS, NOT WHAT IT DRAWS (§96): the stub RECORDS every
  request, so Add a client is judged by the `createClient` body that left —
  a form wired to nothing renders perfectly.

· WHERE THE PAGE GOES, NOT WHERE IT SAYS IT GOES: a door is a NAVIGATION,
  so the stub answers every unknown address with a page that carries the
  path it was asked for, and the assertion reads `location.pathname` after
  the press. A `location.assign` stubbed out in an init script would pass on
  a build that assigned nothing at all.

· THE ARCHIVED PIECE IS ON THIS PAGE, and a live client's is not: the same
  press on the two kinds of card does two different things, both asserted,
  or a build that navigated for every card passes the live half.

· ONE MODULE, TWO HOSTS (§53.5): the page loads /client-setup.js, the same
  file the platform mounts, and the stub serves the copy that belongs to
  the page under test — the root copy for the root page, smp-app/public's
  for the generated one (SMP_PAGE).

EVERY PROBE DEGRADES (§215): a press that finds nothing reports rather than
waiting thirty seconds and taking the count down with it.

Run: SMP_CHROME=... python3 qa-run.py checks/client-setup-outside.py
     SMP_PAGE=smp-app/shell/platform.html …   # the new stack's own copy
     SMP_PAGE=<a doctored copy> …             # prove it can fail (§276)
"""
import copy, http.server, json, os, re, socketserver, threading
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
REPO = os.path.abspath(os.path.join(ROOT, ".."))
PORT = int(os.environ.get("SMP_CHECK_PORT", "3991"))
BASE = "http://127.0.0.1:%d" % PORT
PAGE = os.path.abspath(os.environ.get("SMP_PAGE") or os.path.join(REPO, "platform.html"))
# THE COPY THAT BELONGS TO THE PAGE UNDER TEST (§53.5): the generated page
# is served beside the generated script; the root page beside the source.
CSJS = (os.path.join(REPO, "smp-app", "public", "client-setup.js")
        if "smp-app" in PAGE.replace("\\", "/") else
        os.path.join(ROOT, "src", "client-setup.js"))

fails = []
def ck(what, ok, detail=""):
    print(("  ok   " if ok else "  FAIL ") + what + (("  — " + str(detail)) if detail and not ok else ""))
    if not ok:
        fails.append(what)

SENT, GOT = [], []
ME = "islam.saadany@forefront.consulting"

# ── the world the stub holds: one live client, one archived ─────────────
LIVE = {"key": "elabd-foods", "name": "ElAbd Foods", "kind": "client", "status": "active",
        "mark": None, "industry": "Food & Beverage", "size": "large", "notes": "", "made_here": True,
        "archived_at": None, "archived_by": None}
GONE = {"key": "nile-mills", "name": "Nile Mills", "kind": "client", "status": "retired",
        "mark": None, "industry": "Food & Beverage", "size": "medium", "notes": "", "made_here": True,
        "archived_at": "2026-09-12T10:04:00.000Z", "archived_by": ME}
GOES = {"units": 4, "functions": 3, "plans": 11, "capabilities": 0, "people": 18, "conversations": 9}
WORLD = {"elabd-foods": copy.deepcopy(LIVE), "nile-mills": copy.deepcopy(GONE)}


def slug(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


class Stub(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

    def _send(self, body, ctype, code=200):
        b = body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def _file(self, path, ctype):
        with open(path, encoding="utf-8") as f:
            self._send(f.read(), ctype)

    def do_GET(self):
        path = self.path.split("?")[0]
        if path in ("/platform", "/"):
            return self._file(PAGE, "text/html; charset=utf-8")
        if path == "/platform-page.js":
            return self._file(os.path.join(REPO, "smp-app", "public", "platform-page.js"), "application/javascript; charset=utf-8")
        if path == "/memory-split.js":
            return self._file(os.path.join(REPO, "smp-app", "public", "memory-split.js"), "application/javascript; charset=utf-8")
        if path == "/client-setup.js":
            return self._file(CSJS, "application/javascript; charset=utf-8")
        if path in ("/favicon.svg", "/favicon.png"):
            f = os.path.join(REPO, path.lstrip("/"))
            if os.path.exists(f):
                with open(f, "rb") as fh:
                    raw = fh.read()
                self.send_response(200)
                self.send_header("Content-Type", "image/svg+xml" if path.endswith(".svg") else "image/png")
                self.send_header("Content-Length", str(len(raw)))
                self.end_headers()
                self.wfile.write(raw)
                return
        # EVERY OTHER ADDRESS IS A DOOR THE CONSOLE OPENED: answered with a
        # page that names the path, so a navigation can be READ rather than
        # inferred from a stubbed `location.assign`.
        GOT.append(path)
        self._send('<!doctype html><html><head><title>landed</title></head>'
                   '<body data-landed="%s"></body></html>' % path, "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length", "0"))
        body = json.loads(self.rfile.read(n) or "{}")
        act = body.get("action")
        SENT.append(body)
        if act == "me":
            out = {"ok": True, "account": {"email": ME, "name": "Islam Saadany", "isAdmin": True}}
        elif act == "cards":
            live, arch = [], []
            for row in WORLD.values():
                if row["status"] == "retired":
                    arch.append({"key": row["key"], "name": row["name"], "industry": row["industry"],
                                 "kind": row["kind"], "mark": row["mark"], "at": row["archived_at"],
                                 "by": row["archived_by"], "canConfig": True})
                else:
                    live.append(dict(row, mine=True, seat="super", state="open", canOpen=True,
                                     canConfig=True, units=2, planned=False, cycleOpen=False,
                                     unreadable=False, modules=[{"key": "strategy", "label": "Strategy"}]))
            out = {"ok": True, "canAdd": True, "canConsultants": True, "canAccess": True,
                   "cards": live, "archived": arch}
        elif act == "client":
            row = WORLD.get(body.get("key"))
            if not row:
                out = {"ok": False, "error": "That client is not available."}
            else:
                arch = row["status"] == "retired"
                out = {"ok": True, "client": row, "team": [], "seats": [], "canEdit": True,
                       "register": [], "office": [], "modules": ["strategy"], "offer": [],
                       "holds": {"plans": 0, "capabilities": 0, "units": 2, "functions": 1},
                       "canArchive": True, "canDelete": arch, "goes": dict(GOES) if arch else None}
        elif act == "createClient":
            key = slug(body.get("name") or "")
            WORLD[key] = dict(LIVE, key=key, name=body.get("name"), industry=body.get("industry", ""),
                              size=body.get("size", ""), notes=body.get("notes", ""))
            out = {"ok": True, "key": key}
        elif act == "archiveClient":
            row = WORLD.get(body.get("key"))
            if not row:
                out = {"ok": False, "error": "That client is not available."}
            elif body.get("on") is False:
                row["status"] = "active"; row["archived_at"] = None; row["archived_by"] = None
                out = {"ok": True, "status": "active"}
            else:
                row["status"] = "retired"; row["archived_at"] = "2026-09-12T10:04:00.000Z"; row["archived_by"] = ME
                out = {"ok": True, "status": "retired"}
        elif act == "deleteClient":
            row = WORLD.get(body.get("key"))
            if not row or row["status"] != "retired":
                out = {"ok": False, "error": "Archive it first."}
            elif str(body.get("confirm", "")).strip() != row["name"]:
                out = {"ok": False, "error": "Type the client's name exactly as it is written to confirm."}
            else:
                WORLD.pop(row["key"], None)
                out = {"ok": True, "deleted": row["key"]}
        else:
            out = {"ok": True}
        self._send(json.dumps(out), "application/json")


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


def count(action):
    return len([b for b in SENT if b.get("action") == action])


def q(pg, sel):
    try:
        return pg.query_selector(sel)
    except Exception:
        return None


def press(pg, sel, wait=400):
    """Degrades (§215): a control that is not there is a False, never a
    thirty-second wait that kills the file."""
    el = q(pg, sel)
    if not el:
        return False
    try:
        el.click(); pg.wait_for_timeout(wait); return True
    except Exception as e:
        print("    (could not press %s: %s)" % (sel, str(e)[:90]))
        return False


def ev(pg, js, default=None):
    try:
        return pg.evaluate(js)
    except Exception as e:
        print("    (probe: %s)" % str(e)[:90])
        return default


def path(pg):
    return ev(pg, "()=>location.pathname", None)


def console(pg):
    pg.goto(BASE + "/platform"); pg.wait_for_timeout(600)


srv = serve()
with open(PAGE, encoding="utf-8") as f:
    SRC = f.read()

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 980})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append("console: " + m.text) if m.type == "error" else None)
    console(pg)

    # ── 1 · THE FLOW IS GONE FROM THE CONSOLE, AND THE MODULE IS LOADED ──
    print("\n§1 · the flow is not on the console any more (§357)")
    ck("the console's source holds no step flow — no STEPS, no step rail, no Back/Next foot",
       not re.search(r"\bvar STEPS\b|wzstep|data-wzback|data-wznext", SRC),
       [m.group(0) for m in re.finditer(r"\bvar STEPS\b|wzstep|data-wzback|data-wznext", SRC)][:4])
    ck("…and loads the one client set-up module instead", '<script src="/client-setup.js">' in SRC)
    ck("…which the page holds, with the console's two pieces and the platform's one on it",
       ev(pg, "()=>typeof CLIENTSETUP==='object' && ['mount','mountCreate','mountArchived'].every(k=>typeof CLIENTSETUP[k]==='function')", False))
    ck("the clients grid is drawn, with the live card and the archived band",
       bool(q(pg, '[data-grid="clients"] .ccard[data-client="elabd-foods"]')) and
       bool(q(pg, '[data-grid="archived"] .ccard[data-client="nile-mills"]')))
    ck("and no step rail is on the page", q(pg, ".wzstep") is None and q(pg, ".wzrail") is None)

    # ── 2 · A LIVE CARD'S SETTINGS IS A DOOR ─────────────────────────────
    print("\n§2 · a live card's Settings opens the client's own Setup")
    posted = len(SENT)
    ck("the live card carries Settings", bool(q(pg, '.ccard[data-client="elabd-foods"] .ccfg')))
    pressed = press(pg, '.ccard[data-client="elabd-foods"] .ccfg', 700)
    ck("pressing it LEAVES the console for the client's own Setup rail — /<client>/setup",
       pressed and path(pg) == "/elabd-foods/setup", path(pg))
    ck("…as a navigation the server saw", "/elabd-foods/setup" in GOT, GOT[-3:])
    ck("…with nothing drawn between the card and it — no request, no flow on the console first",
       len(SENT) == posted, SENT[posted:])
    # BOTH ENDS (§94.2): Enter on the focused control is the same door.
    console(pg)
    cog = q(pg, '.ccard[data-client="elabd-foods"] .ccfg')
    if cog:
        cog.focus(); pg.keyboard.press("Enter"); pg.wait_for_timeout(700)
    ck("…and the keyboard opens the same door", bool(cog) and path(pg) == "/elabd-foods/setup", path(pg))

    # ── 3 · ADD A CLIENT DRAWS THE CREATE PIECE, POSTS, AND GOES IN ──────
    print("\n§3 · Add a client")
    console(pg)
    ck("the clients page offers Add a client", bool(q(pg, ".ccard.add")))
    ck("pressing it draws the create piece on this page", press(pg, ".ccard.add") and bool(q(pg, ".csetup")) and path(pg) == "/platform", path(pg))
    ck("…the client's name is asked", bool(q(pg, ".csetup .rowset input.fld")))
    ck("…the industry is the searchable standard list", bool(q(pg, ".csetup .wzpick .fld")))
    bands = pg.eval_on_selector_all(".csetup .wzband button", "els => els.map(e => e.textContent)")
    ck("…size is a band of five, carrying the people counts",
       isinstance(bands, list) and len(bands) == 5 and any("201" in x for x in bands), bands)
    ck("…notes are asked", bool(q(pg, ".csetup textarea.fld")))
    ck("…and there is NO step rail: a client has no address until it exists, so the rest is set up inside it",
       q(pg, ".csetup .wzstep") is None and q(pg, ".csetup .wzrail") is None)
    ck("…with one control, that creates it", bool(q(pg, ".csetup [data-wznext]")) and q(pg, ".csetup [data-wzdone]") is None
       and q(pg, ".csetup [data-wzback]") is None)
    ck("…and a way back to the cards", bool(pg.query_selector("text=Cancel")))
    # NOTHING WITHOUT A NAME: refused in words, and nothing leaves.
    n0 = count("createClient")
    press(pg, ".csetup [data-wznext]", 300)
    said = (q(pg, ".csetup [data-cssaid]").inner_text() if q(pg, ".csetup [data-cssaid]") else "")
    ck("with no name the press is refused in words", "name" in said.lower(), said[:90])
    ck("…and nothing is posted", count("createClient") == n0 and path(pg) == "/platform")
    # the answers, then the press
    nm = q(pg, ".csetup .rowset input.fld")
    if nm:
        nm.fill("Delta Sugar"); nm.dispatch_event("change"); pg.wait_for_timeout(120)
    pick = q(pg, ".csetup .wzpick .fld")
    if pick:
        pick.click(); pg.wait_for_timeout(150); pick.fill("food"); pg.wait_for_timeout(200)
        opts = pg.eval_on_selector_all(".csetup .wzpanel .opt", "els => els.map(e => e.textContent)")
        ck("typing narrows the industry list to the standard entries",
           isinstance(opts, list) and "Food & Beverage" in opts and 2 <= len(opts) <= 6, opts)
        press(pg, ".csetup .wzpanel .opt >> text=Food & Beverage", 150)
    press(pg, ".csetup .wzband button >> text=Large", 150)
    ta = q(pg, ".csetup textarea.fld")
    if ta:
        ta.fill("Sugar refiner, Upper Egypt"); pg.wait_for_timeout(100)
    n0 = count("createClient")
    press(pg, ".csetup [data-wznext]", 900)
    made = last("createClient")
    ck("the press posts createClient — once", count("createClient") == n0 + 1, count("createClient") - n0)
    ck("…carrying the name typed", bool(made) and made.get("name") == "Delta Sugar", made)
    ck("…the industry from the standard list", bool(made) and made.get("industry") == "Food & Beverage", made)
    ck("…the size band", bool(made) and made.get("size") == "large", made)
    ck("…and the notes", bool(made) and made.get("notes") == "Sugar refiner, Upper Egypt", made)
    ck("and then goes INTO the client, at its own Getting started page — /<key>/setup/start",
       path(pg) == "/delta-sugar/setup/start" and "/delta-sugar/setup/start" in GOT, path(pg))

    # ── 4 · AN ARCHIVED CARD'S SETTINGS STAYS HERE ───────────────────────
    print("\n§4 · an archived card's Settings draws the archived piece, on this page")
    console(pg)
    n_client = count("client")
    ck("the archived card carries Settings beside Bring back",
       bool(q(pg, '[data-grid="archived"] .ccard[data-client="nile-mills"] .ccfg')) and
       bool(q(pg, '[data-grid="archived"] .ccard[data-client="nile-mills"] .cback')))
    press(pg, '[data-grid="archived"] .ccard[data-client="nile-mills"] .ccfg', 700)
    ck("pressing it STAYS on the console — an archived address answers nobody (§61)", path(pg) == "/platform", path(pg))
    ck("…reads the client", count("client") == n_client + 1 and last("client").get("key") == "nile-mills", last("client"))
    ck("…and draws the archived piece", bool(q(pg, ".csetup")) and bool(q(pg, ".wzarched")))
    said = q(pg, ".wzarched").inner_text() if q(pg, ".wzarched") else ""
    ck("…saying it is archived, when, and by whom", "archived" in said.lower() and "Sep" in said and ME in said, said[:120])
    kws = pg.eval_on_selector_all(".csetup .wzendkey", "e => e.map(x => x.textContent.trim())")
    ck("two blocks: the way back, then the way out", kws == ["Bringing them back", "Deleting"], kws)
    ck("Bring back is offered, and Delete", bool(q(pg, ".csetup [data-unarchive]")) and bool(q(pg, '.csetup [data-delete="ask"]')))
    ck("…and no step rail, no fields, no Archive control: this is not the set-up flow",
       q(pg, ".csetup .wzstep") is None and q(pg, ".csetup .rowset") is None and q(pg, '[data-archive="ask"]') is None)
    ck("…with a way back to the cards", bool(pg.query_selector("text=Back to clients")))
    # Delete is DRIVEN in checks/client-archive.py; here the door is the subject.
    n_arch = count("archiveClient")
    press(pg, ".csetup [data-unarchive]", 800)
    sent = last("archiveClient")
    ck("Bring back posts archiveClient with on false, for this client",
       count("archiveClient") == n_arch + 1 and bool(sent) and sent.get("key") == "nile-mills" and sent.get("on") is False, sent)
    ck("…and lands back on the cards, with the client in the live grid and the band gone",
       bool(q(pg, '[data-grid="clients"] .ccard[data-client="nile-mills"]')) and q(pg, '[data-grid="archived"]') is None)
    WORLD["nile-mills"] = copy.deepcopy(GONE)

    # ── 5 · nothing thrown ───────────────────────────────────────────────
    print("\n§5 · the console")
    ck("no page errors", not errs, errs[:3])
    b.close()

srv.shutdown()
print("\n%d failures" % len(fails))
for f in fails:
    print("  - " + f)
