"""THE WELCOME SCREEN (§148, spec 025).

NOT PART OF qa.py, for §94.11's reason: the screen exists only over http(s)
with a signed-in person — over file:// WELCOME.offer declines before drawing
anything, so a build that had lost the whole feature would go green in every
file:// sweep. Served here with a stub /api/state and /api/chat, three
viewers, and the STATE MADE rather than waited for (§94.2): the demo tenant
grants nobody the fill state and every register row has a custodian, so the
gaps row and the office's no-custodian row are exercised on a seed this file
edits before serving.

WHAT IS ASSERTED IS AGREEMENT AND PRESSES, NEVER COPY ALONE (§94.8, §70):
each row's number is compared against the same function its destination page
calls, evaluated in the page itself — and every door is CLICKED, with the
platform's own state (current / currentSub / REPORTING) read back afterwards,
because a control that renders and does nothing has shipped five times.

PROVE IT CAN FAIL (§94.5): run with SMP_WELCOME_HTML pointing at the shipped
pre-§148 file and every section fails from the first assertion — no overlay
is ever drawn there.

Run:  SMP_CHROME=/opt/pw-browsers/chromium python3 qa-run.py checks/welcome.py
"""
import copy, json, os, pathlib, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML_PATH = pathlib.Path(os.environ.get("SMP_WELCOME_HTML") or
                         (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html"))
HTML = HTML_PATH.read_bytes()
BASE = json.loads((ROOT / "db/seed-state.json").read_text())

# Mutable per-section: who is signed in, what state is served, what the chat
# stub answers. A new browser context per section keeps sessionStorage clean.
PERSON = {"key": "own_mob", "name": "Mennah Farouk"}
STATE = BASE
CHATANS = {"unread": 0, "queue": None}
# §179 · §9 signs in through the REAL gate, because "greeted on every sign-in"
# is a property of index.html and the platform together and neither half can
# show it alone. GATEMODE picks which document `/` serves; AUTHGET is what a
# page load finds — a live session (resume) or none (the login card).
GATEMODE = "stub"
AUTHGET = {"ok": False}
# SMP_WELCOME_GATE points §9 at another index.html — which is how "prove it
# can fail" is run for the sign-in half: the fix is half in the gate and half
# in the platform, so swapping only the platform proves nothing.
REALGATE = pathlib.Path(os.environ.get("SMP_WELCOME_GATE") or (ROOT / "index.html")).read_bytes()

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
        if self.path.startswith("/api/auth"):
            self._send(200, json.dumps(AUTHGET).encode(), "application/json")
            return
        if self.path.startswith("/api/state"):
            self._send(200, json.dumps({"ok": True, "state": STATE, "person": PERSON}).encode(),
                       "application/json")
            return
        if self.path.startswith("/raya-trade"):
            self._send(200, HTML, "text/html; charset=utf-8")
            return
        self._send(200, REALGATE if GATEMODE == "real" else GATE,
                   "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(n)
        if self.path.startswith("/api/auth"):
            body = json.loads(raw or b"{}")
            if body.get("action") == "login":
                # A SIGN-IN NAMES THE CLIENT IT LANDS ON (spec 030). The door
                # hands somebody over to what they can OPEN, and with exactly
                # one client that is a straight replace to it — so a stub that
                # answers no client models a person with NO client, who is sent
                # to Forefront's cards instead and never reaches the platform
                # this section is about. §100.3: a stub has to MODEL the
                # server, not merely answer it.
                self._send(200, json.dumps({"ok": True, "person": PERSON,
                                            "client": "raya-trade"}).encode(),
                           "application/json")
            else:
                self._send(200, b'{"ok":true}', "application/json")
            return
        if not self.path.startswith("/api/chat"):
            self._send(200, b'{"ok":true}', "application/json")
            return
        body = json.loads(raw or b"{}")
        if body.get("action") == "mine":
            self._send(200, json.dumps({
                "ok": True, "messages": [], "unread": CHATANS["unread"],
                "thread": ({"waiting": False} if CHATANS["unread"] else None),
                "office": PERSON["key"] == "smo",
                "chat": {"on": True}}).encode(), "application/json")
            return
        if body.get("action") == "queue":
            q = CHATANS["queue"] or {"waiting": 0, "flagged": 0}
            self._send(200, json.dumps({
                "ok": True, "office": True, "threads": [], "chat": {"on": True},
                "waiting": q["waiting"], "flagged": q["flagged"],
                "hereMinutes": 5, "mail": False}).encode(), "application/json")
            return
        self._send(200, b'{"ok":true}', "application/json")


def _no_tour(pg):
    # The tour's auto-offer is suppressed as a returning viewer would have it
    # (its own session flag) — the welcome's card and TOUR.start are gated on
    # neither, so §5's handoff still exercises the real thing.
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');}catch(e){}")


def fresh(browser, port):
    ctx = browser.new_context(viewport={"width": 1440, "height": 950})
    pg = ctx.new_page()
    _no_tour(pg)
    pg.goto("http://127.0.0.1:%d/raya-trade" % port)
    pg.wait_for_selector(".welcomeover", timeout=15000)
    return ctx, pg


def gapped_seed():
    """Mobile owes exactly three elements, and its custodian holds the fill
    state — the two edits that make §145's row reachable on this seed."""
    s = copy.deepcopy(BASE)
    m = s["units"]["mobile"]
    m["items"][0]["measures"][0]["target"] = ""
    m["items"][0]["measures"][1]["target"] = ""
    m["items"][0]["tactics"][0]["owner"] = ""
    s["access"].setdefault("custodian", {})["a_unit_own_strat"] = "fill"
    return s


def main():
    global PERSON, STATE, CHATANS, GATEMODE, AUTHGET
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", 0), H)
    port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()

    with sync_playwright() as p:
        browser = p.chromium.launch()

        # ── 1 · THE CUSTODIAN'S SCREEN AGREES WITH THE DATA ────────────────
        print("§1 the custodian's screen, against the same functions its rows read")
        PERSON = {"key": "own_mob", "name": "Mennah Farouk"}
        STATE = gapped_seed()
        CHATANS = {"unread": 2, "queue": None}
        ctx, pg = fresh(browser, port)
        ck("greeting leads with the register's first name",
           "Welcome, Mennah" in pg.inner_text(".wgreet h2"))
        org = pg.evaluate("GROUP.org")
        ck("the tenant signs the band with its own name",
           pg.inner_text(".wtenant h1") == org, pg.inner_text(".wtenant h1"))
        ck("the Strategy Management Office is named under it",
           "STRATEGY MANAGEMENT OFFICE" in pg.inner_text(".woffice").upper())
        chips = pg.inner_text(".wwho")
        ck("the person's role chip says custodian", "custodian" in chips.lower(), chips)
        rev = pg.evaluate("REVIEW.name")
        ck("the cycle chip carries the cycle's own name", rev in chips, chips)

        acts = pg.inner_text(".wacts")
        # The submission row, against reportedCount + submitBlockers.
        ck("the submit row names the subject and the cycle",
           ("Submit Mobile" in acts) and (rev in acts), acts[:200])
        # The relationship, never the constant (§94.8): the demo's mobile has
        # every figure entered today, and the row must say whichever is true.
        open_n = pg.evaluate(
            "(function(){var c=reportedCount(UNITS.mobile);return c.total-c.done;})()")
        want_open = ("Every figure is entered" if open_n == 0 else
                     ("1 figure still open" if open_n == 1 else
                      "%d figures still open" % open_n))
        ck("figures-still-open agrees with reportedCount", want_open in acts, acts[:300])
        notes_n = pg.evaluate("submitBlockers('mobile').notes.length")
        if notes_n:
            want = ("1 needs a note" if notes_n == 1 else "%d need a note" % notes_n)
            ck("the note debt agrees with submitBlockers", want in acts, acts[:300])
        # The gaps row, against gapTotal — the demo plan owes gaps of its own
        # (§119.1's Missing marks), so the made three only guarantee nonzero;
        # what is asserted is that the row and the function AGREE (§94.8).
        gaps_n = pg.evaluate("gapTotal('mobile')")
        ck("the made state owes gaps at all", gaps_n >= 3, gaps_n)
        ck("the gaps row carries the same number with its noun",
           ("%d missing elements" % gaps_n) in acts, acts[:300])
        # No bare number: every digit on the list sits inside a sentence chip-free.
        ck("no count badge boxes exist (round 3, variation C)",
           pg.locator(".wacts .cnt, .wacts .stchip").count() == 0)
        # The one solid button (§41's budget).
        ck("exactly one solid CTA on the screen",
           pg.locator(".welcomeover .wcta").count() == 1)
        # The reply row arrives when the corner's poll answers.
        try:
            pg.wait_for_selector(".wact-reply", timeout=9000)
            ck("the office's reply announces itself", True)
        except Exception:
            ck("the office's reply announces itself", False, "no .wact-reply within 9s")
        ck("the reply row counts with its noun",
           "2 unread replies" in pg.inner_text(".wacts"))
        # The side column.
        ck("your pages lists Strategy, Performance and Reporting",
           pg.locator(".wpages a").count() == 3, pg.inner_text(".wpages"))
        ck("the intro round is offered to somebody the tour has a story for",
           pg.locator(".wtour").is_visible())

        # ── §202 · AND IT IS SHUT UNTIL SOMEBODY ASKS ─────────────────────
        # Islam: "make the take an intro round a by default collapsed box
        # that expands on a click and collapse on a click as well." Shut it
        # still SAYS the round exists — a fold that hides its own name is a
        # feature nobody finds (§61) — and the state is announced, not only
        # drawn, or a screen reader is told it is open while it is shut.
        fold = pg.evaluate("""(function(){
          var c=document.querySelector('.wtour');
          if(!c) return null;
          var body=c.querySelector('[data-wtourbody]'),
              btn=c.querySelector('[data-wtoggle]');
          return { named: c.textContent.indexOf('Take an intro round') > -1,
                   bodyHidden: !!(body && body.hidden),
                   aria: btn && btn.getAttribute('aria-expanded'),
                   startShown: !!(c.querySelector('[data-wtour]') || {}).offsetParent,
                   h: Math.round(c.getBoundingClientRect().height) };})()""")
        ck("the round's card is CLOSED to begin with",
           fold and fold["bodyHidden"] and fold["aria"] == "false", fold)
        ck("...and still names itself while shut", fold and fold["named"], fold)
        ck("...with nothing to press inside it yet",
           fold and not fold["startShown"], fold)
        shutH = fold["h"] if fold else 0
        pg.click("[data-wtoggle]")
        pg.wait_for_timeout(150)
        op = pg.evaluate("""(function(){
          var c=document.querySelector('.wtour'),
              body=c.querySelector('[data-wtourbody]'),
              btn=c.querySelector('[data-wtoggle]');
          return { bodyHidden: !!body.hidden, aria: btn.getAttribute('aria-expanded'),
                   startShown: !!c.querySelector('[data-wtour]').offsetParent,
                   h: Math.round(c.getBoundingClientRect().height) };})()""")
        ck("one press opens it", op["bodyHidden"] is False and op["aria"] == "true", op)
        ck("...the round is then reachable", op["startShown"], op)
        ck("...and the card actually grew", op["h"] > shutH, (shutH, op["h"]))
        pg.click("[data-wtoggle]")
        pg.wait_for_timeout(150)
        again = pg.evaluate("""(function(){
          var c=document.querySelector('.wtour'),
              body=c.querySelector('[data-wtourbody]'),
              btn=c.querySelector('[data-wtoggle]');
          return { bodyHidden: !!body.hidden, aria: btn.getAttribute('aria-expanded'),
                   h: Math.round(c.getBoundingClientRect().height) };})()""")
        ck("...and the next press closes it again",
           again["bodyHidden"] and again["aria"] == "false"
           and again["h"] == shutH, (again, shutH))
        ctx.close()

        # ── 2 · THE DOORS ARE REAL, AND THE SCREEN IS ONCE PER SESSION ─────
        print("§2 the doors are pressed and the platform is read back")
        ctx, pg = fresh(browser, port)
        pg.click(".welcomeover .wcta")
        pg.wait_for_selector(".welcomeover", state="detached", timeout=5000)
        pg.wait_for_timeout(400)
        ck("Open reporting lands on the unit", pg.evaluate("current") == "mobile",
           pg.evaluate("current"))
        # §222: REPORTING IS ITS OWN TAB, so the door lands there rather than
        # on Performance. The door still presses Performance first, which is
        # the honest fallback when no cycle is open and the Reporting tab is
        # therefore not drawn.
        ck("…on the Reporting tab", pg.evaluate("currentSub") == "report",
           pg.evaluate("currentSub"))
        ck("…with reporting mode entered",
           pg.evaluate("typeof REPORTING!=='undefined' && REPORTING==='mobile'"))
        pg.reload()
        pg.wait_for_timeout(2500)
        ck("a reload in the same session is not greeted twice",
           pg.locator(".welcomeover").count() == 0)
        ctx.close()

        print("§3 Continue names where the platform already is, and steps aside")
        ctx, pg = fresh(browser, port)
        word = pg.inner_text("[data-wcontinue]")
        ck("Continue names the landing place", "Mobile" in word, word)
        # §202: AND SETUP IS A PLACE TOO. Islam saw a bare "Continue"; every
        # unit, function and company already named itself, and Setup — where
        # the house button sits beside the gear (§193.2) — did not. Asserted
        # of every kind, so a build that named none of them fails here too.
        labs = pg.evaluate("""(function(){
          var out={}, mine=PEOPLE.filter(function(x){return x.key==='mobhead';})[0]
                       || PEOPLE[0];
          ['setup','manage','mobile','fn:finance','group'].forEach(function(t){
            WELCOME.dismiss(); current=t; WELCOME.open(mine);
            var e=document.querySelector('[data-wcontinue] .wexlab');
            out[t]=e?e.textContent:null; });
          WELCOME.dismiss(); return out;})()""")
        ck("...Setup names itself rather than reading a bare Continue",
           labs.get("setup") == "Continue to Setup"
           and labs.get("manage") == "Continue to Setup", labs)
        ck("...and a unit, a function and the group each name themselves",
           labs.get("mobile") == "Continue to Mobile"
           and labs.get("fn:finance") == "Continue to Finance"
           and "group" in (labs.get("group") or ""), labs)
        # PUT THE SCREEN BACK THE WAY THE SECTION FOUND IT (§94.2 from the
        # other side): the probe above dismissed the overlay, and everything
        # below measures it. A reload would not do — the screen is once per
        # session, so it would come back to no overlay at all.
        pg.evaluate("""(function(){
          current='mobile';
          WELCOME.open(PEOPLE.filter(function(x){return x.key==='mobhead';})[0]
                       || PEOPLE[0]);})()""")
        pg.wait_for_timeout(200)
        # §159 · THE WAY OUT IS THE SCREEN'S, NOT THE LIST'S. Asserted as the
        # RELATIONSHIP (§94.8): outside the grid, last in the wrap, and as wide
        # as the two columns together — never a pixel count, so a later change
        # to the gutters stays green and a control put back inside the column
        # does not.
        geo = pg.evaluate("""(function(){
          var b=document.querySelector('[data-wcontinue]'),
              w=document.querySelector('.welcomeover .wwrap'),
              c=document.querySelector('.welcomeover .wcols');
          if(!b||!w||!c) return null;
          var rb=b.getBoundingClientRect(), rc=c.getBoundingClientRect();
          return {inCols:!!b.closest('.wcols'), parent:b.parentElement.className,
                  last:w.lastElementChild===b, tag:b.tagName,
                  dl:Math.round(rb.left-rc.left), dr:Math.round(rb.right-rc.right),
                  below:Math.round(rb.top-rc.bottom)};})()""")
        ck("the way out is a real button", geo and geo["tag"] == "BUTTON", geo)
        ck("…outside the list's column", geo and not geo["inCols"], geo)
        ck("…and the last thing in the screen", geo and geo["last"], geo)
        ck("…spanning both columns", geo and abs(geo["dl"]) <= 1 and abs(geo["dr"]) <= 1, geo)
        ck("…and sitting below them", geo and geo["below"] > 0, geo)
        ck("with rows waiting it does NOT wear the fill (§41)",
           pg.locator("[data-wcontinue].wloud").count() == 0)
        pg.click("[data-wcontinue]")
        pg.wait_for_selector(".welcomeover", state="detached", timeout=5000)
        ck("…and the platform under it is on that place",
           pg.evaluate("current") == "mobile", pg.evaluate("current"))
        ctx.close()

        print("§4 the intro round is a handoff to the real tour")
        ctx, pg = fresh(browser, port)
        # §202: THE CARD IS SHUT UNTIL SOMEBODY OPENS IT, so the round is two
        # presses now rather than one. The fold's own assertions are §11.
        pg.click("[data-wtoggle]")
        pg.click("[data-wtour]")
        pg.wait_for_selector(".welcomeover", state="detached", timeout=5000)
        pg.wait_for_timeout(600)
        st = pg.evaluate("TOUR.state()")
        ck("the tour is running once the welcome steps aside",
           bool(st and st.get("running")), st)
        ctx.close()

        # ── 5 · THE OFFICE'S LIST IS THE OVERVIEW'S ────────────────────────
        print("§5 the office sees its own rows, and never the tour")
        PERSON = {"key": "smo", "name": "Mohamed Essam"}
        s = copy.deepcopy(BASE)
        s["unitRoles"]["mobile"]["custodian"] = None
        STATE = s
        CHATANS = {"unread": 0, "queue": {"waiting": 2, "flagged": 0}}
        ctx, pg = fresh(browser, port)
        ck("the office is never offered the intro round (§118)",
           pg.locator(".wtour").count() == 0 or not pg.locator(".wtour").is_visible())
        n_nocust = pg.evaluate("unitsWithoutCustodian().length")
        ck("the made state has a custodian-less unit", n_nocust >= 1, n_nocust)
        acts = pg.inner_text(".wacts")
        ck("the no-custodian row is the Overview's own sentence",
           ("%d unit" % n_nocust) in acts and "no custodian" in acts, acts[:300])
        try:
            pg.wait_for_selector(".wacts >> text=conversation", timeout=9000)
            ck("the inbox's waiting count arrives and is drawn", True)
        except Exception:
            ck("the inbox's waiting count arrives and is drawn", False, "no row in 9s")
        ck("…with its noun", "2 conversations waiting" in pg.inner_text(".wacts"),
           pg.inner_text(".wacts")[:300])
        ck("the office's pages open Setup",
           "Overview" in pg.inner_text(".wpages"), pg.inner_text(".wpages"))
        # A door into Setup: the no-custodian row goes to the People register.
        pg.locator(".wacts .wact", has_text="no custodian").locator("button").click()
        pg.wait_for_selector(".welcomeover", state="detached", timeout=5000)
        pg.wait_for_timeout(600)
        ck("its door lands on the People register",
           pg.evaluate("currentSub") == "people", pg.evaluate("currentSub"))
        ctx.close()

        # ── 6 · NOTHING WAITING SAYS SO ────────────────────────────────────
        print("§6 an empty list says so (§45.2)")
        PERSON = {"key": "own_ret", "name": "Retail Custodian"}
        STATE = BASE          # retailstores is submitted in the seed; no fill grant
        CHATANS = {"unread": 0, "queue": None}
        ctx, pg = fresh(browser, port)
        ck("the empty list says nothing is waiting",
           "Nothing is waiting on you" in pg.inner_text(".wacts"),
           pg.inner_text(".wacts")[:200])
        ck("…and no action row wears the fill",
           pg.locator(".welcomeover .wcta").count() == 0)
        # §159 · and with no other act on the screen the exit is the loud one,
        # which is what the approved round said and the first build did not do.
        # BOTH ENDS, or a build that promoted it always would pass here and
        # fail nothing (the "not loud" half is asserted in §3).
        ck("…so the way out is the loud control instead",
           pg.locator("[data-wcontinue].wloud").count() == 1)
        fill = pg.evaluate("getComputedStyle(document.querySelector('[data-wcontinue]'))"
                           ".backgroundColor")
        ck("…and it is actually painted, not merely classed",
           fill not in ("rgba(0, 0, 0, 0)", "rgb(255, 255, 255)"), fill)
        ctx.close()

        # ── 8 · VIEWING AS, ON THE WELCOME SCREEN (§179) ───────────────────
        # Islam: "the viewing as should be available from the welcome screen."
        # BOTH ENDS, and the closed end is the one that matters: a switcher
        # drawn for somebody who is not the SMO serves them another person's
        # screen under their own name (sync.js §45.3).
        print("§8 viewing as, above the greeting (§179)")
        PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
        STATE = BASE
        CHATANS = {"unread": 0, "queue": None}
        ctx, pg = fresh(browser, port)
        has_bar = pg.locator(".welcomeover .wviewbar select").count() == 1
        ck("the SMO gets the switcher", has_bar)
        # WITHOUT IT THE REST OF §8 IS UNMEASURABLE, so it is SAID rather than
        # crashed through: a check that dies on its first failure hides how
        # many things are wrong, which is the one thing a "prove it can fail"
        # run exists to count (§54.5 — a case nobody measured is named, never
        # passed over).
        if not has_bar:
            print("  ----    the rest of §8 needs the switcher — not measured")
        if has_bar:
            # ABOVE the hero, which is the placement Islam picked of the two drawn
            # — asserted as the RELATIONSHIP, never as a pixel (§94.8).
            order = pg.evaluate("""()=>{const w=document.querySelector('.welcomeover .wwrap');
                const bar=w.querySelector('.wviewbar'), hero=w.querySelector('.whero');
                return [ [...w.children].indexOf(bar), [...w.children].indexOf(hero),
                         Math.round(bar.getBoundingClientRect().bottom) <=
                           Math.round(hero.getBoundingClientRect().top) ];}""")
            ck("…above the greeting, not inside it", order[0] == 0 and order[0] < order[1] and order[2], order)
            # ONE VOCABULARY: the options are the chrome's own (§53.5). Compared as
            # a LIST, so a build that rebuilt them from a second source fails even
            # when the two happen to hold the same people.
            same = pg.evaluate("""()=>{const a=[...document.querySelectorAll('#asWho option')].map(o=>o.textContent);
                const b=[...document.querySelectorAll('#wAsWho option')].map(o=>o.textContent);
                return [a.length, b.length, JSON.stringify(a)===JSON.stringify(b)];}""")
            ck("…listing exactly what the chrome's own switcher lists", same[2] and same[0] > 1, same)
            # NEVER A DUPLICATE ID — a cloned select would put `asWho` in the
            # document twice and getElementById would answer with whichever came
            # first, which is a control that silently drives the wrong thing.
            ck("…and `asWho` still names exactly one element",
               pg.eval_on_selector_all("#asWho", "e=>e.length") == 1)
            # PRESSED, and the platform read back (§70). Switching redraws the
            # screen for that person AND moves the platform underneath.
            pg.select_option("#wAsWho", "own_mob")
            pg.wait_for_timeout(700)
            got = pg.evaluate("""()=>({ viewer: window.VIEWER,
                chrome: document.getElementById('asWho').value,
                greet: (document.querySelector('.welcomeover .wgreet h2')||{}).textContent||'',
                still: !!document.querySelector('.welcomeover') });""")
            ck("switching moves the platform's own viewer", got["viewer"] == "own_mob", got)
            ck("…and the chrome's control follows", got["chrome"] == "own_mob", got)
            ck("…the screen stays up, redrawn for them", got["still"] and "Mennah" in got["greet"], got)
            # A SWITCH IS NOT A DISMISSAL: marking it done would leave the screen
            # unable to come back for the person you were about to look at.
            ck("…and it was not marked as seen",
               pg.evaluate("sessionStorage.getItem('smp.welcome.done')") is None)
        ctx.close()

        # The closed end.
        PERSON = {"key": "own_mob", "name": "Mennah Farouk"}
        ctx, pg = fresh(browser, port)
        ck("somebody who is not the SMO gets NO switcher",
           pg.locator(".welcomeover .wviewbar").count() == 0)
        ctx.close()

        # ── 9 · GREETED ON EVERY SIGN-IN (§179) ────────────────────────────
        # Islam: "When I sign out and sign in I don't get the welcome screen."
        # Signing out only reloads the page in the same tab, so sessionStorage
        # outlives the session it belonged to. Driven through the REAL gate,
        # because neither half shows this alone.
        print("§9 greeted on every sign-in, never on a resume (§179)")
        GATEMODE = "real"
        PERSON = {"key": "own_mob", "name": "Mennah Farouk"}
        STATE = BASE

        AUTHGET = {"ok": False}          # no session -> the login card
        ctx = browser.new_context(viewport={"width": 1440, "height": 950})
        pg = ctx.new_page()
        _no_tour(pg)
        pg.goto("http://127.0.0.1:%d/" % port)
        pg.wait_for_selector("#loginForm", timeout=8000)
        # THE STATE IS MADE (§94.2): a tab that has already been greeted once,
        # which is exactly what a sign-out leaves behind.
        #
        # SET ON THE PAGE, NEVER IN AN INIT SCRIPT: an init script runs on
        # EVERY document the context loads, so it would re-write the flag when
        # the platform loads and quietly undo the thing under test — the check
        # would then fail against a correct build (§68.10's class of fault, in
        # a harness). sessionStorage is per-origin and the gate and the
        # platform share one, so setting it here is what a sign-out leaves.
        pg.evaluate("sessionStorage.setItem('smp.welcome.done','1')")
        pg.fill("#user", "someone@example.com")
        pg.fill("#password", "whatever")
        pg.click("#loginForm button[type=submit]")
        # WAITED FOR, NOT ASSERTED ON A TIMEOUT: the failure this section
        # exists to catch IS "no welcome ever appears", so waiting for the
        # selector would raise instead of reporting, and a "prove it can fail"
        # run would end in a stack trace with nothing counted.
        greeted = False
        for _ in range(30):
            if pg.locator(".welcomeover").count() == 1:
                greeted = True
                break
            pg.wait_for_timeout(500)
        ck("signing in again greets you, with the tab already marked", greeted)
        ctx.close()

        # AND A RESUME IS NOT A SIGN-IN. Opening the gate with a live session
        # bounces straight through, and being re-greeted for walking past your
        # own front door is the fault this replaces, not a fix for it.
        AUTHGET = {"ok": True, "person": PERSON}
        ctx = browser.new_context(viewport={"width": 1440, "height": 950})
        pg = ctx.new_page()
        _no_tour(pg)
        # Walked rather than stubbed: greeted once, dismissed, then back to
        # the front door with the session still live. The gate cannot be
        # evaluated against on this path — it redirects before a script can
        # run — and walking it is the honest reproduction anyway.
        pg.goto("http://127.0.0.1:%d/raya-trade" % port)
        pg.wait_for_selector(".welcomeover", timeout=15000)
        pg.click("[data-wcontinue]")
        pg.wait_for_selector(".welcomeover", state="detached", timeout=5000)
        pg.goto("http://127.0.0.1:%d/" % port)
        pg.wait_for_timeout(2500)
        ck("…but resuming a live session does not",
           pg.locator(".welcomeover").count() == 0)
        ck("…and the memory it was told to keep is still there",
           pg.evaluate("sessionStorage.getItem('smp.welcome.done')") == "1")
        ctx.close()
        GATEMODE = "stub"
        AUTHGET = {"ok": False}

        # ── 7 · THE ABSENCES (§94.2) ───────────────────────────────────────
        print("§7 where the screen must NOT be")
        pg2 = browser.new_page()
        pg2.goto("file://" + str(HTML_PATH))
        pg2.wait_for_timeout(2000)
        ck("over file:// no welcome is ever drawn", pg2.locator(".welcomeover").count() == 0)
        ck("…and offer() itself declines there",
           pg2.evaluate("WELCOME.offer({key:'own_mob',name:'x'})") is False)
        pg2.close()
        PERSON = {"key": "own_mob", "name": "Mennah Farouk"}
        STATE = BASE
        ctx, pg = fresh(browser, port)
        pg.click("[data-wcontinue]")
        pg.wait_for_selector(".welcomeover", state="detached", timeout=5000)
        ck("a projector is never greeted",
           pg.evaluate("(function(){try{sessionStorage.removeItem('smp.welcome.done');}catch(e){}"
                       "document.body.classList.add('presenting');"
                       "return WELCOME.offer({key:'own_mob',name:'x'});})()") is False)
        ctx.close()

        # ══ 10 · THE CYCLE, AND WHO MAY SEE IT (§200) ═══════════════════
        # Islam: "the cycle statistics table is already needed there." Built
        # as Option A of two drawn — the business's own figures, shown only to
        # somebody who could already open the page that holds them.
        #
        # THE GATE IS THE POINT, NOT THE PLACEMENT. `cycleTotals()` counts
        # every unit AND every supporting function (§105), and the Reporting
        # cycle page is gated on `c_cycle`; a unit head does not hold it. So
        # this is asserted from BOTH ENDS (§113.8) — drawn for the office AND
        # withheld from a unit head — because a build that drew it for nobody
        # would satisfy the second half on its own.
        print("\n── 10 · the cycle summary, and its gate")
        PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
        STATE = BASE
        ctx, pg = fresh(browser, port)
        d = pg.evaluate("""() => {
          const c = document.querySelector('.welcomeover .wcyc');
          const t = (typeof cycleTotals === 'function') ? cycleTotals() : null;
          return { grant: grant('c_cycle'),
                   text: c ? (c.innerText||'').replace(/\\s+/g,' ').trim() : null,
                   inSide: !!document.querySelector('.wside .wcyc'),
                   afterPages: !!document.querySelector('.wpagesbox + .wcyc'),
                   heroChip: !!document.querySelector('.welcomeover .wcycle'),
                   totals: t };
        }""")
        ck("the office may open the cycle page", d["grant"] != "none", d["grant"])
        ck("...so the block is drawn", bool(d["text"]), d)
        ck("...in the side column, under Your pages", d["inSide"] and d["afterPages"], d)
        # AGREEMENT WITH THE SOURCE, never a literal (§94.8, §108.10): three
        # surfaces read cycleTotals() and none of them may disagree.
        t = d["totals"]
        ck("...and its figures ARE cycleTotals()",
           t and ("%d of %d" % (t["done"], t["total"])) in d["text"]
             and ("Submitted %d" % t["sub"]) in d["text"], (t, d["text"]))
        # §87's twins: the hero chip said the cycle was open and so does the
        # block — two places saying one thing is how a screen repeats itself.
        ck("...and the hero chip has gone, because the block says it",
           not d["heroChip"], d)
        ctx.close()

        PERSON = {"key": "mobhead", "name": "Ramy Behairy"}
        ctx, pg = fresh(browser, port)
        u = pg.evaluate("""() => ({
          grant: grant('c_cycle'),
          block: !!document.querySelector('.welcomeover .wcyc'),
          heroChip: !!document.querySelector('.welcomeover .wcycle'),
          screen: !!document.querySelector('.welcomeover') })""")
        ck("a unit head may NOT open the cycle page", u["grant"] == "none", u)
        ck("...so the business's figures are not shown to them", not u["block"], u)
        ck("...but they still learn the cycle is open, from the chip",
           u["heroChip"], u)
        ck("...and their welcome screen is otherwise intact", u["screen"], u)
        ctx.close()

        browser.close()
    srv.shutdown()

    print("")
    print("welcome: %s" % ("OK" if bad == 0 else "%d FAILURES" % bad))
    raise SystemExit(0 if bad == 0 else 1)


main()
