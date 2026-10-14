"""A ROLE OVER ITS OWN THING NAMES ITSELF AND STOPS (§534).

Islam's ask, of the chips under the name on Home: a capability's owner and a
direction's owner should read the ROLE and nothing after it, and — his second
sentence, after the first build covered only the owners — a capability's
CUSTODIAN with them.

qa-run: own-server — modelled on checks/welcome.py, for the same reason: the
strip exists only over http(s) with a signed-in person, so a file:// sweep
would go green on a build that had lost the whole screen (§94.11). The states
are MADE here rather than waited for (§94.2): the demo tenant names nobody on
its one capability and has its business units on, so neither a capability seat
nor a direction owner exists on the shipped seed at all.

WHAT IS ASSERTED, and why each is here:

· BOTH ENDS, WHICH IS THE WHOLE POINT (§94.2). A check that only proved the
  place is gone would pass on a build that printed no place for anybody, and
  one that only proved places appear would pass on the build from before this
  change. §3 reads ONE person holding a capability seat AND a unit custodian
  role, so the two readings sit side by side on one screen: one chip stops at
  the role, the other still names its unit.

· THE ROLE WORD IS ASKED OF THE RULE, never typed here (§94.8, viewer-line's
  own shape). `SMPRules.ROLES` is what names a role, so renaming one keeps
  this green; what is asserted is the PLACE's presence or absence.

· AND THE PLACE-NAMING FUNCTIONS ARE UNTOUCHED (§5). The fix drops the place
  in the one line that prints it, so `roleWhereLabel()` must still name a
  capability by its own title — that is the word the cycle board, the
  register's Unit column, the role chips and the switcher's dropdown read, and
  a "fix" that had changed it there would have moved five screens nobody
  asked about. Asserted directly, because it is the half that must NOT move.

· THE TOP LEVEL ANSWERS TO THE CLIENT'S WORD, AND STILL TO THE OLD ONE (§5).
  §534's other half: `topword` has been a terminology row since §404 and these
  functions said "the group" as a literal. With the row set to "Company" the
  place reads "the company" — and `placeByLabel()` still resolves "the group",
  which is what keeps a people workbook downloaded before today landing (§65).

PROVE IT CAN FAIL (§94.5): point SMP_CHIP_HTML at the build from before this
change and §1, §2 and §4 fail on the place that is still printed, while §3's
unit-custodian end and §5's capability name stay green — which is the shape
of the fault, not just its presence.

Run:  SMP_CHROME=/opt/pw-browsers/chromium python3 qa-run.py checks/role-chip-own-thing.py
"""
import copy, json, os, pathlib, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML_PATH = pathlib.Path(os.environ.get("SMP_CHIP_HTML") or
                         (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html"))
HTML = HTML_PATH.read_bytes()
BASE = json.loads((ROOT / "db/seed-state.json").read_text())

# The Mobile custodian on the shipped seed — the person §3 gives a capability
# seat to as well, so one screen carries both readings.
CUST = {"key": "own_mob", "name": "Mennah Farouk"}

PERSON = dict(CUST)
STATE = BASE

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
        try:
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            # The page navigates away mid-response on a context teardown, and a
            # stub server that dies of it reports a fault in the product that
            # is not there (welcome.py's own noise, §344.1's family).
            pass

    def do_GET(self):
        if self.path.startswith("/api/auth"):
            self._send(200, json.dumps({"ok": False}).encode(), "application/json")
            return
        if self.path.startswith("/api/state"):
            self._send(200, json.dumps({"ok": True, "state": STATE, "person": PERSON}).encode(),
                       "application/json")
            return
        if self.path.startswith("/raya-trade"):
            self._send(200, HTML, "text/html; charset=utf-8")
            return
        self._send(200, GATE, "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(n)
        if self.path.startswith("/api/chat"):
            body = json.loads(raw or b"{}")
            if body.get("action") == "mine":
                self._send(200, json.dumps({
                    "ok": True, "messages": [], "unread": 0, "thread": None,
                    "office": False, "chat": {"on": True}}).encode(), "application/json")
                return
        self._send(200, b'{"ok":true}', "application/json")


def fresh(browser, port):
    ctx = browser.new_context(viewport={"width": 1440, "height": 950})
    pg = ctx.new_page()
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    pg.goto("http://127.0.0.1:%d/raya-trade" % port)
    pg.wait_for_selector(".welcomeover", timeout=15000)
    return ctx, pg


def jseval(pg, expr, miss="<not in this build>"):
    """`topWord()` does not exist before §534, and a check run against that
    build has to go RED rather than die on a ReferenceError — a crash reports
    nothing about the shape of the fault, which is the whole point of running
    it there (§94.5)."""
    try:
        return pg.evaluate(expr)
    except Exception:
        return miss


def chips(pg):
    """Every role chip under the name, as text. The cycle chip is not a role
    and carries its own class, so it is left out rather than matched around."""
    return pg.eval_on_selector_all(
        ".wwho .wchip:not(.wcycle)", "els => els.map(e => e.textContent.trim())")


def chip_for(pg, role_key):
    """The chip whose role word is the one the RULE gives for this key — asked
    of SMPRules rather than typed, so a renamed role keeps this green."""
    name = pg.evaluate(
        "k => (SMPRules.ROLES.filter(function(r){return r.key===k;})[0]||{}).name", role_key)
    if not name:
        return None, None
    for c in chips(pg):
        if c.startswith(name):
            return c, name
    return None, name


def cap_seat(seat, person_key):
    """The seed's one capability (cap6, Product Mindset), with this person in
    one of its two seats — read off the capability by KEY, as §412 reads it."""
    s = copy.deepcopy(BASE)
    s["group"]["capabilities"][0][seat] = person_key
    return s


def direction_seed(owner_name):
    """A company that plans its own directions: the business units OFF, which
    is the only shape in which the top layer's pillars ARE directions (§505,
    `ownsTopPillar`), and one direction this person owns by NAME (§130.1)."""
    s = copy.deepcopy(BASE)
    s["group"].setdefault("structure", {})["bu"] = {"exists": False}
    s["group"]["items"] = [
        {"id": "dir1", "name": "One Trade", "owner": owner_name, "custodian": None,
         "measures": [], "tactics": []}]
    return s


def topword_seed(word):
    """The terminology row for the top level set to the client's own word."""
    s = copy.deepcopy(BASE)
    for e in s["labels"]:
        if e.get("key") == "topword":
            e["group"] = word
            e["bu"] = word
    return s


def main():
    global PERSON, STATE
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", 0), H)
    port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()

    with sync_playwright() as p:
        browser = p.chromium.launch()

        # ── 1 · A CAPABILITY'S OWNER ──────────────────────────────────────
        print("§1 a capability's owner reads the role and stops")
        PERSON = dict(CUST)
        STATE = cap_seat("head", CUST["key"])
        ctx, pg = fresh(browser, port)
        held = pg.evaluate("personRoles(personBy('%s'))" % CUST["key"])
        ck("the rule mints the capability owner role, held at the capability",
           any(r["role"] == "capowner" and str(r.get("at", "")).startswith("cap:")
               for r in held), held)
        chip, name = chip_for(pg, "capowner")
        ck("the chip is drawn, with the rule's own word for the role", bool(chip), chips(pg))
        ck("...and it stops there — no capability named after it",
           chip is not None and "·" not in chip, chip)
        ck("...and the capability's title is not on it either",
           chip is not None and "Product Mindset" not in chip, chip)
        ctx.close()

        # ── 2 · A CAPABILITY'S CUSTODIAN — THE LINE THE OWNERS' FIX MISSED ─
        print("§2 a capability's custodian reads the role and stops")
        PERSON = dict(CUST)
        STATE = cap_seat("custodian", CUST["key"])
        ctx, pg = fresh(browser, port)
        held = pg.evaluate("personRoles(personBy('%s'))" % CUST["key"])
        ck("the rule seats them as custodian AT the capability",
           any(r["role"] == "custodian" and str(r.get("at", "")).startswith("cap:") for r in held),
           held)
        caps = [c for c in chips(pg) if "Product Mindset" in c]
        ck("no chip names the capability", not caps, caps)
        ctx.close()

        # ── 3 · BOTH ENDS ON ONE SCREEN (§94.2) ───────────────────────────
        print("§3 the same person's unit role still names its unit")
        PERSON = dict(CUST)
        STATE = cap_seat("head", CUST["key"])
        ctx, pg = fresh(browser, port)
        held = pg.evaluate("personRoles(personBy('%s'))" % CUST["key"])
        unit_cust = [r for r in held if r["role"] == "custodian"
                     and not str(r.get("at", "")).startswith("cap:")]
        ck("the register still holds their unit custodian role", bool(unit_cust), held)
        cust_chip, _ = chip_for(pg, "custodian")
        ck("its chip is drawn", bool(cust_chip), chips(pg))
        ck("...and it DOES still name where it is held",
           cust_chip is not None and "·" in cust_chip, cust_chip)
        if unit_cust:
            where = pg.evaluate("a => roleWhereLabel(a)", unit_cust[0]["at"])
            ck("...with the word roleWhereLabel() gives for that place",
               cust_chip is not None and where in cust_chip, (cust_chip, where))
        cap_chip, _ = chip_for(pg, "capowner")
        ck("both readings are on the one screen at once",
           bool(cap_chip) and bool(cust_chip) and "·" not in (cap_chip or "·")
           and "·" in (cust_chip or ""), chips(pg))
        ctx.close()

        # ── 4 · A DIRECTION'S OWNER ───────────────────────────────────────
        print("§4 a direction's owner reads the role and stops")
        PERSON = dict(CUST)
        STATE = direction_seed(CUST["name"])
        ctx, pg = fresh(browser, port)
        held = pg.evaluate("personRoles(personBy('%s'))" % CUST["key"])
        ck("the rule mints the direction owner role, held at the top level",
           any(r["role"] == "dirowner" and r.get("at") == "group" for r in held), held)
        chip, name = chip_for(pg, "dirowner")
        ck("the chip is drawn, with the rule's own word for the role", bool(chip), chips(pg))
        ck("...and it stops there — the top level is not named after it",
           chip is not None and "·" not in chip, chip)
        top = jseval(pg, "topWord()")
        ck("...and the top level's own word is not on it",
           chip is not None and top not in chip, (chip, top))
        ctx.close()

        # ── 5 · WHAT MUST NOT MOVE, AND THE WORD FOR THE TOP LEVEL ────────
        print("§5 the place-naming functions are untouched, and read the client's word")
        PERSON = dict(CUST)
        STATE = topword_seed("Company")
        ctx, pg = fresh(browser, port)
        capname = pg.evaluate("roleWhereLabel('cap:cap6')")
        ck("roleWhereLabel() still names a capability by its own title",
           "Product Mindset" in capname, capname)
        ck("...and still says which kind of thing it is", "capab" in capname.lower(), capname)
        ck("placeLabel() still names it too", "Product Mindset" in pg.evaluate("placeLabel('cap:cap6')"),
           pg.evaluate("placeLabel('cap:cap6')"))
        ck("the top level reads the client's own word, not 'the group'",
           pg.evaluate("roleWhereLabel('group')") == "the company",
           pg.evaluate("roleWhereLabel('group')"))
        ck("...on placeLabel() as well", pg.evaluate("placeLabel('group')") == "the company",
           pg.evaluate("placeLabel('group')"))
        # A SEAT ROLE, not `dirowner`. `dirowner` is derived and never granted
        # by hand (§505), so it is not in SEAT_AT_GROUP and `roleWheres()`
        # hands it the ordinary unit list — measured, not assumed, after this
        # check first asked it of the wrong role. The roles whose ONE answer is
        # the top level are the seats: Super user, SMO team, Group CEO.
        ck("...and on the one answer the switcher offers for a seat role",
           pg.evaluate("roleWheres('gceo')[0].label") == "the company",
           pg.evaluate("roleWheres('gceo')"))
        ck("...and in the sentence a refused pick shows for one",
           "the company" in pg.evaluate("roleAtWord('gceo')"),
           pg.evaluate("roleAtWord('gceo')"))
        # The round-trip §65 is about: a workbook downloaded before today.
        ck("a file still saying 'the group' resolves to the top level",
           pg.evaluate("placeByLabel('the group').at") == "group",
           pg.evaluate("placeByLabel('the group')"))
        ck("...and so does the bare 'group'",
           pg.evaluate("placeByLabel('group').at") == "group",
           pg.evaluate("placeByLabel('group')"))
        ck("...and so does the client's own word, which is what it now writes",
           pg.evaluate("placeByLabel('the company').at") == "group",
           pg.evaluate("placeByLabel('the company')"))
        ctx.close()

        browser.close()
    srv.shutdown()

    print()
    print("role-chip-own-thing: " + ("all good" if not bad else "%d FAILED" % bad))
    raise SystemExit(1 if bad else 0)


main()
