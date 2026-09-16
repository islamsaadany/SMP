"""Archiving a client, and deleting one (§323, spec 047 — and §357, spec 055,
which moved the archiving act INTO the client).

Islam: "we need an option to remove the client" — then, of the two acts drawn
for him, "both, demo client is not removable, and the name is Archive not put
aside".

WHAT THIS ASSERTS, AND WHY EACH ONE IS HERE.

· WHAT THE PAGE POSTS, NOT WHAT IT DRAWS (§96). A button wired to nothing
  renders perfectly, so the stub RECORDS every request and the assertions are
  made against those bodies. It also HOLDS the state and flips it, so the
  round trip — the band, bring back, the grid — is driven rather than staged.

· §357 MOVED THE ARCHIVE BLOCK OFF THIS PAGE (rewritten to the new truth,
  never loosened — §218): a live client's Settings is a DOOR to the client's
  own Setup rail, and the Archiving block sits on that rail's first step,
  where only a served platform can draw it (client-setup.js archiveBlock
  reads the registry). So the act itself is measured by smp-app's own
  checks, and here the console is asserted to draw NEITHER block for a live
  client — the door, and nothing between the card and it — while the
  archived state is MADE by telling the stub (§255), because it is a state
  the console can no longer reach on its own.

· BOTH ENDS, EVERY TIME (§94.2). With nothing archived there is no band at
  all; with something archived there is one. Delete is ABSENT on a live
  client's card and on the console for one; on an archived client it is
  drawn. Asserting only the presences passes on a build that draws every
  control always, which is the worse fault here.

· DELETE IS REACHABLE FROM AN ARCHIVED CLIENT AND NOWHERE ELSE. That is the
  guard rather than a second confirmation — the archived card's Settings is
  the one screen the console still draws for a client (§357), and it is
  asserted as the only place the control exists.

· THE NAME MUST MATCH EXACTLY. A near miss keeps the button shut; the exact
  name opens it; and what is POSTED carries the typed value, because the
  server asks again and a request that never sent it would be refused with
  nobody able to see why.

· THE COUNTS ARE THE SERVER'S, asserted as AGREEMENT with what the stub sent
  rather than as literals (§94.8) — a sentence typed into the page would pass
  a literal check and lie to the one person about to press this.

· THE WORKED EXAMPLE IS NEVER IN THE BAND, and somebody who is not the
  platform's admin sees no band and no way back (§61: not drawn, rather than
  drawn and refusing).

· AND THE CONFIRMATION'S WORD IS READ (§38.4). Its first build was `#fff` on
  --bad — 2.90:1, measured — with a dark-mode override written outside its
  media query, so it applied in LIGHT. Measured as PAINT in both palettes on
  the one confirming button this page still draws (Delete), because that is
  the fault, not the class name.

· THE MODULES BAND (§322.1, §11b before this) is on the client's own first
  step now and is not on this page: measured there, not here.

EVERY PROBE DEGRADES (§215): this file drives two clients through three
screens, and a step that throws must report rather than take the count down
with it.

Run: SMP_CHROME=... python3 qa-run.py checks/client-archive.py
     SMP_PAGE=smp-app/shell/platform.html …   # the new stack's own copy
"""

import copy, http.server, json, os, socketserver, threading
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
REPO = os.path.abspath(os.path.join(ROOT, ".."))
PORT = int(os.environ.get("SMP_CHECK_PORT", "3993"))
BASE = "http://127.0.0.1:%d" % PORT
PAGE = os.environ.get("SMP_PAGE") or os.path.join(REPO, "platform.html")
# WHO IS LOOKING, and the harness can change it — §12 needs a platform where
# this account is NOT the admin, which is a state the product can be in and a
# fixture cannot otherwise reach (§255: the check MAKES the state). A door in
# the STUB, never in the page.
ADMIN = [os.environ.get("SMP_CHECK_ADMIN", "1") != "0"]

fails = []
def ck(what, ok, detail=""):
    print(("  ok   " if ok else "  FAIL ") + what + (("  — " + str(detail)) if detail and not ok else ""))
    if not ok:
        fails.append(what)

SENT = []

# ── the world the stub holds ────────────────────────────────────────────
LIVE = {
    "key": "elabd-foods", "name": "ElAbd Foods", "kind": "client", "status": "active",
    "mark": None, "industry": "Food Products", "size": "large", "notes": "", "made_here": True,
    "archived_at": None, "archived_by": None,
}
DEMO = {
    "key": "demo", "name": "Raya Trade (demo)", "kind": "demo", "status": "active",
    "mark": None, "industry": "Distributors", "size": "", "notes": "", "made_here": False,
    "archived_at": None, "archived_by": None,
}
SHAPE = {"companies": [], "units": [{"name": "Bakery", "company": ""}],
         "functions": [{"name": "Finance", "format": "projects"}], "words": {}}
GOES = {"units": 4, "functions": 3, "plans": 11, "capabilities": 0,
        "people": 18, "conversations": 9}
WORLD = {"elabd-foods": copy.deepcopy(LIVE), "demo": copy.deepcopy(DEMO)}
ME = "islam.saadany@forefront.consulting"


def may_archive(row):
    """The screen is told this by the server; the stub answers the same way
    the rules module does, or it is testing a world the product cannot be in."""
    return ADMIN[0] and row.get("kind") != "demo"


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
        if path == "/platform-page.js":
            with open(os.path.join(REPO, "smp-app", "public", "platform-page.js"), encoding="utf-8") as f:
                self._send(f.read(), "application/javascript; charset=utf-8")
            return
        if path == "/memory-split.js":
            with open(os.path.join(REPO, "smp-app", "public", "memory-split.js"), encoding="utf-8") as f:
                self._send(f.read(), "application/javascript; charset=utf-8")
            return
        if path == "/__admin0":
            ADMIN[0] = False
            self._send("{}", "application/json"); return
        # THE STATE IS MADE (§255, §357): archiving is pressed inside the
        # client now, on a served platform, so the stub is told.
        if path.startswith("/__archive/"):
            row = WORLD.get(path.split("/", 2)[2])
            if row and may_archive(row):
                row["status"] = "retired"; row["archived_at"] = "2026-09-12T10:04:00.000Z"; row["archived_by"] = ME
            self._send("{}", "application/json"); return
        # ONE MODULE, TWO HOSTS (§357): the page loads the client set-up
        # module; the copy served is the one that belongs to the page under
        # test — smp-app/public's beside the generated page, the source
        # beside the root one.
        if path == "/client-setup.js":
            src = (os.path.join(REPO, "smp-app", "public", "client-setup.js")
                   if "smp-app" in os.path.abspath(PAGE).replace("\\", "/")
                   else os.path.join(ROOT, "src", "client-setup.js"))
            with open(src, encoding="utf-8") as f:
                self._send(f.read(), "application/javascript; charset=utf-8")
            return
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
        # EVERY OTHER ADDRESS IS A DOOR THE CONSOLE OPENED (§357): answered
        # with a page naming the path, so a navigation is READ off
        # location.pathname rather than inferred.
        self._send('<!doctype html><html><head><title>landed</title></head>'
                   '<body data-landed="%s"></body></html>' % path, "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length", "0"))
        body = json.loads(self.rfile.read(n) or "{}")
        act = body.get("action")
        SENT.append(body)
        if act == "me":
            out = {"ok": True, "account": {"email": ME, "name": "Islam Saadany", "isAdmin": ADMIN[0]}}
        elif act == "cards":
            live, arch = [], []
            for row in WORLD.values():
                if row["status"] == "retired":
                    if may_archive(row):
                        arch.append({"key": row["key"], "name": row["name"], "industry": row["industry"],
                                     "kind": row["kind"], "mark": row["mark"],
                                     "at": row["archived_at"], "by": row["archived_by"], "canConfig": True})
                else:
                    live.append(dict(row, mine=True, seat="super", state="open", canOpen=True,
                                     canConfig=True, units=4, planned=False, cycleOpen=False,
                                     unreadable=False))
            out = {"ok": True, "canAdd": ADMIN[0], "canConsultants": True, "canAccess": ADMIN[0],
                   "cards": live, "archived": arch}
        elif act == "client":
            row = WORLD.get(body.get("key"))
            if not row:
                out = {"ok": False, "error": "That client is not available."}
            else:
                arch = row["status"] == "retired"
                out = {"ok": True, "client": row, "team": [], "seats": [
                            {"key": "super", "name": "Super user", "note": "holds the access matrix"},
                            {"key": "smoteam", "name": "SMO team", "note": "runs cycles"}],
                       "canEdit": True, "register": [], "office": [], "shape": SHAPE,
                       "holds": {"plans": 0, "capabilities": 0, "units": 1, "functions": 1},
                       "canArchive": may_archive(row),
                       "canDelete": may_archive(row) and arch,
                       "goes": dict(GOES) if (may_archive(row) and arch) else None,
                       # §322.1's band reads both of these off the server; it is
                       # here so §12 can ask what an ARCHIVED client's copy of it
                       # offers (§94.2 — "no buttons" means nothing unless the
                       # live client's same band is asserted to have one).
                       "modules": ["strategy"], "offer": [
                           {"key": "strategy", "label": "Strategy", "note": "Plans, cycles and reviews.", "always": True},
                           {"key": "trial", "label": "Trial", "note": "A module with a page of its own.", "always": False}]}
        elif act == "archiveClient":
            row = WORLD.get(body.get("key"))
            if not row or not may_archive(row):
                out = {"ok": False, "error": "Archiving a client is the platform admin's."}
            elif body.get("on") is False:
                row["status"] = "active"; row["archived_at"] = None; row["archived_by"] = None
                out = {"ok": True, "status": "active"}
            else:
                row["status"] = "retired"
                row["archived_at"] = "2026-09-12T10:04:00.000Z"
                row["archived_by"] = ME
                out = {"ok": True, "status": "retired"}
        elif act == "deleteClient":
            row = WORLD.get(body.get("key"))
            if not row or not may_archive(row) or row["status"] != "retired":
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


def q(pg, sel):
    try:
        return pg.query_selector(sel)
    except Exception:
        return None


def press(pg, sel, wait=350):
    el = q(pg, sel)
    if not el:
        return False
    try:
        el.click(); pg.wait_for_timeout(wait); return True
    except Exception as e:
        print("    (could not press %s: %s)" % (sel, str(e)[:90]))
        return False


def open_settings(pg, key):
    """Open a live client's Settings, by its own card."""
    el = q(pg, '.ccard[data-client="%s"] .ccfg' % key)
    if not el:
        return False
    el.click(); pg.wait_for_timeout(450)
    return True


srv = serve()
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 1000})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append("console: " + m.text) if m.type == "error" else None)

    def ev(js, default=None):
        try:
            return pg.evaluate(js)
        except Exception as e:
            print("    (probe: %s)" % str(e)[:90])
            return default

    def path():
        return ev("()=>location.pathname")

    def console():
        pg.goto(BASE + "/platform"); pg.wait_for_timeout(600)

    def archive(key):
        """§255: the act is inside the client now; the console is TOLD."""
        pg.evaluate("(k)=>fetch('/__archive/'+k)", key); pg.wait_for_timeout(250)

    console()

    # ── 1 · WITH NOTHING ARCHIVED THERE IS NO BAND ──────────────────────
    print("\n§1 · nothing archived")
    ck("the clients grid is drawn", bool(q(pg, '[data-grid="clients"]')))
    ck("and no Archived band at all", q(pg, '[data-grid="archived"]') is None,
       "a band with nothing in it is furniture (§61)")
    heads = pg.eval_on_selector_all(".apart > .akey", "e => e.map(x => x.textContent)")
    ck("…so nothing on the page says Archived", "Archived" not in heads, heads)

    # ── 2 · A LIVE CLIENT'S SETTINGS IS A DOOR, AND NEITHER BLOCK IS HERE ─
    # REWRITTEN TO THE NEW TRUTH (§218, §357): the Archiving block moved into
    # the client's own Setup with the flow; on the console a live client's
    # Settings draws nothing and LEAVES.
    print("\n§2 · a live client's Settings")
    n_client = len([x for x in SENT if x.get("action") == "client"])
    ck("the console draws no Archive control anywhere for a live client",
       q(pg, '[data-archive="ask"]') is None and q(pg, '[data-delete="ask"]') is None and q(pg, "[data-unarchive]") is None)
    ck("the client's Settings leaves for the client's own Setup rail",
       open_settings(pg, "elabd-foods") and path() == "/elabd-foods/setup", path())
    ck("…with nothing drawn on the console first — no flow, no read of the client",
       len([x for x in SENT if x.get("action") == "client"]) == n_client)

    # ── 3 · THE BAND, AND WHAT IT SAYS ──────────────────────────────────
    print("\n§3 · the Archived band")
    archive("elabd-foods")
    console()
    band = q(pg, '[data-grid="archived"]')
    ck("the Archived band is drawn", bool(band))
    heads = pg.eval_on_selector_all(".apart > .akey", "e => e.map(x => x.textContent)")
    ck("…under its own heading", "Archived" in heads, heads)
    ck("the client is no longer in the clients grid",
       q(pg, '[data-grid="clients"] .ccard[data-client="elabd-foods"]') is None)
    card = q(pg, '[data-grid="archived"] .ccard[data-client="elabd-foods"]')
    ck("…and is in the archived one", bool(card))
    if card:
        # `inner_text` is the RENDERED text and `.tag` is uppercased by CSS,
        # so a case-sensitive compare asserts the stylesheet rather than the
        # sentence (§301.6, and this check's own first run did exactly that).
        txt = card.inner_text()
        low = txt.lower()
        ck("the card says when it was archived", "archived" in low and "sep" in low, txt.replace("\n", " · "))
        ck("…and who did it", ME.lower() in low, txt.replace("\n", " · "))
        ck("the card has no door", card.get_attribute("disabled") is not None
           or pg.evaluate("(e)=>e.disabled", card) is True)
        ck("…and carries Bring back, and Settings", bool(q(pg, '[data-grid="archived"] .cback'))
           and bool(q(pg, '[data-grid="archived"] .ccard[data-client="elabd-foods"] .ccfg')))
        # AND THE LIVE TAGS ARE GONE: a seat or an open cycle on a card
        # nobody can open reads as a client you could still walk into.
        ck("…and none of the live tags", "Cycle open" not in txt and "Super user" not in txt,
           txt.replace("\n", " · "))

    # ── 4 · BRING BACK, FROM THE CARD ───────────────────────────────────
    print("\n§4 · bringing them back from the band")
    n_before = len([x for x in SENT if x.get("action") == "archiveClient"])
    press(pg, '[data-grid="archived"] .cback', 700)
    sent = last("archiveClient")
    ck("Bring back posts archiveClient",
       len([x for x in SENT if x.get("action") == "archiveClient"]) > n_before)
    ck("…with on false", bool(sent) and sent.get("on") is False, sent)
    ck("the band is gone", q(pg, '[data-grid="archived"]') is None)
    ck("…and the client is back in the grid",
       bool(q(pg, '[data-grid="clients"] .ccard[data-client="elabd-foods"]')))
    ck("…with its door back", pg.evaluate(
        '()=>{var c=document.querySelector(\'[data-grid="clients"] .ccard[data-client="elabd-foods"]\');'
        'return !!c && !c.disabled;}') is True)

    # ── 5 · THE BAND SURVIVES A FRESH VISIT ─────────────────────────────
    print("\n§5 · a fresh visit")
    archive("elabd-foods")
    pg.goto(BASE + "/platform"); pg.wait_for_timeout(550)
    ck("the band is drawn on a page loaded from cold",
       bool(q(pg, '[data-grid="archived"] .ccard[data-client="elabd-foods"]')))

    # ── 6 · THE WORKED EXAMPLE IS NEITHER ────────────────────────────────
    print("\n§6 · the worked example")
    archive("demo")
    console()
    # The demo sits in its own band under the grid (§317), never in the
    # archived one: the server refuses to archive it, and the stub answers
    # as the rules module does.
    ck("told to archive the demo, it is still drawn as the worked example and never in the Archived band",
       bool(q(pg, '.ccard[data-client="demo"]')) and
       q(pg, '[data-grid="archived"] .ccard[data-client="demo"]') is None,
       "Islam: the demo client is not removable")
    ck("…and its Settings is the same door as any client's",
       open_settings(pg, "demo") and path() == "/demo/setup", path())

    # ── 7 · DELETING, FROM AN ARCHIVED CLIENT'S SETTINGS ─────────────────
    # REWRITTEN (§218, §357): the archived piece is drawn ON THIS PAGE by
    # client-setup.js `mountArchived` — bring back, then delete — and it is
    # the one screen the console still draws for a client.
    print("\n§7 · deleting")
    console()
    cfg = q(pg, '[data-grid="archived"] .ccard[data-client="elabd-foods"] .ccfg')
    ck("an archived card carries Settings as well as Bring back", bool(cfg),
       "without it Delete is unreachable — §61, and this assertion found that")
    opened = False
    if cfg:
        cfg.click(); pg.wait_for_timeout(600)
        opened = bool(q(pg, ".wzarched")) and path() == "/platform"
    ck("…and it STAYS here, saying the client is archived", opened, path())

    if opened:
        said = q(pg, ".wzarched").inner_text()
        ck("…naming when and who", "Sep" in said and ME in said, said[:110])
        kws = pg.eval_on_selector_all(".wzendkey", "e => e.map(x => x.textContent.trim())")
        ck("two blocks: the way back, then the way out",
           kws == ["Bringing them back", "Deleting"], kws)
        ck("Bring back is offered", bool(q(pg, "[data-unarchive]")))
        ck("…and so is Delete", bool(q(pg, '[data-delete="ask"]')))
        ck("Archive is not offered twice", q(pg, '[data-archive="ask"]') is None)
        ck("and no set-up flow, no fields: an archived client is not edited here (§323)",
           q(pg, ".wzstep") is None and q(pg, ".rowset") is None)
        ck("…with the way back to the clients page", bool(pg.query_selector("text=Back to clients")))

        press(pg, '[data-delete="ask"]')
        ask = q(pg, '[data-ask="delete"]')
        ck("Delete asks", bool(ask))
        if ask:
            # THE COUNTS ARE THE SERVER'S (§94.8) — agreement, never literals.
            goes = q(pg, "[data-goes]")
            txt = goes.inner_text() if goes else ""
            want = [str(GOES["units"]), str(GOES["functions"]), str(GOES["people"]),
                    str(GOES["plans"]), str(GOES["conversations"])]
            ck("…naming what goes, from the numbers the server sent",
               all(w in txt for w in want), txt.replace("\n", " · "))
            ck("…and saying there is no way back",
               "cannot be undone" in ask.inner_text().lower(), ask.inner_text()[:110])

            # THE WORD ON THE CONFIRMATION IS READ (§38.4) — measured as PAINT,
            # in both palettes, because this is the fault the mockup caught: a
            # fill asked to carry type, and a dark rule with no theme around it.
            RATIO = """(sel)=>{
              const el = document.querySelector(sel); if (!el) return null;
              const f = v => { v/=255; return v <= .03928 ? v/12.92 : Math.pow((v+.055)/1.055, 2.4); };
              const lum = c => { const m = c.match(/[\\d.]+/g).map(Number); return .2126*f(m[0]) + .7152*f(m[1]) + .0722*f(m[2]); };
              let n = el, bg = null;
              while (n && n !== document.documentElement) {
                const c = getComputedStyle(n).backgroundColor, m = c.match(/[\\d.]+/g);
                if (m && (m.length < 4 || Number(m[3]) > 0)) { bg = c; break; }
                n = n.parentElement;
              }
              const L1 = lum(getComputedStyle(el).color), L2 = lum(bg || 'rgb(255,255,255)');
              return Math.round(((Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05))*100)/100;
            }"""
            for theme in ("light", "dark"):
                pg.emulate_media(color_scheme=theme)
                pg.wait_for_timeout(80)
                r = ev("(" + RATIO + ")('[data-delete=\"do\"]')")
                ck("the confirming button's word reads in " + theme,
                   isinstance(r, (int, float)) and r >= 4.5, r)
            pg.emulate_media(color_scheme="light")

            btn = q(pg, '[data-delete="do"]')
            ck("the button starts shut", bool(btn) and btn.is_disabled())
            box = q(pg, "[data-confirm]")
            ck("the name is asked for", bool(box))
            ck("Cancel puts the block back, sending nothing",
               press(pg, '[data-delete="cancel"]') and bool(q(pg, '[data-delete="ask"]')) and last("deleteClient") is None)
            press(pg, '[data-delete="ask"]')
            btn = q(pg, '[data-delete="do"]'); box = q(pg, "[data-confirm]")
            if box and btn:
                box.fill("ElAbd Food"); pg.wait_for_timeout(120)
                ck("a near miss keeps it shut", btn.is_disabled(), "ElAbd Food")
                box.fill("elabd foods"); pg.wait_for_timeout(120)
                ck("…and so does the wrong case", btn.is_disabled(), "elabd foods")
                box.fill("ElAbd Foods"); pg.wait_for_timeout(120)
                ck("the exact name opens it", not btn.is_disabled())
                btn.click(); pg.wait_for_timeout(800)
                sent = last("deleteClient")
                ck("it posts deleteClient", bool(sent) and sent.get("key") == "elabd-foods", sent)
                ck("…carrying the typed name", bool(sent) and sent.get("confirm") == "ElAbd Foods", sent)
                ck("and it lands on the clients page", bool(q(pg, '[data-grid="clients"]')) and path() == "/platform")
                ck("…with the client gone from both bands",
                   q(pg, '.ccard[data-client="elabd-foods"]') is None)

    # ── 8 · BRING BACK, FROM THE ARCHIVED SETTINGS ──────────────────────
    print("\n§8 · bringing them back from Settings")
    WORLD["elabd-foods"] = copy.deepcopy(LIVE)
    archive("elabd-foods")
    console()
    n_before = len([x for x in SENT if x.get("action") == "archiveClient"])
    if open_settings(pg, "elabd-foods"):
        press(pg, "[data-unarchive]", 800)
        sent = last("archiveClient")
        ck("Bring back in the block posts archiveClient with on false",
           len([x for x in SENT if x.get("action") == "archiveClient"]) > n_before and bool(sent)
           and sent.get("key") == "elabd-foods" and sent.get("on") is False, sent)
        ck("…and lands on the clients page with the client live again",
           bool(q(pg, '[data-grid="clients"] .ccard[data-client="elabd-foods"]')) and q(pg, '[data-grid="archived"]') is None)

    # ── 9 · SOMEBODY WHO IS NOT THE PLATFORM'S ADMIN ────────────────────
    #  §94.2's other end, and the one that matters most here: adding a client
    #  can be handed to a consultant through the access table and removing one
    #  cannot, so for them there must be no band and no card control — not a
    #  greyed one, which invites a press and then explains itself.
    print("\n§9 · not the admin")
    WORLD["elabd-foods"] = copy.deepcopy(LIVE)
    archive("elabd-foods")
    console()
    ck("(fixture) a client is archived", bool(q(pg, '[data-grid="archived"]')))
    pg.evaluate("()=>fetch('/__admin0')"); pg.wait_for_timeout(200)
    console()
    ck("no Archived band for them", q(pg, '[data-grid="archived"]') is None,
       "a row of clients they can do nothing with is furniture (§94.15)")
    ck("…and no way to bring one back, and no Delete anywhere",
       q(pg, ".cback") is None and q(pg, "[data-unarchive]") is None and q(pg, '[data-delete="ask"]') is None)

    # ── 10 · the console ────────────────────────────────────────────────
    print("\n§10 · the console")
    ck("no page errors", not errs, errs[:3])

    b.close()

srv.shutdown()
print("\n%d failures" % len(fails))
for f in fails:
    print("  - " + f)
