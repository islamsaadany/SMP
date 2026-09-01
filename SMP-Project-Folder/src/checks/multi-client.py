#!/usr/bin/env python3
"""The door, the platform, and a seat held on a client (spec 024, US2-US3b).

WHY THIS CANNOT LIVE IN qa.py: every screen check opens the built file over
file://, where there is no server, no session and no client — so the whole
feature is invisible to it and a build that had lost it would go green every
time (§94.11). This serves the real files over HTTP against a real database.

THE DOOR IS A DOOR (Islam, 2026-08-29): the front page holds sign-in and
nothing else — no tabs, no cards, no tables. Everything Forefront does lives
at /platform, behind the sign-in.

A ROLE IS A SEAT ON A CLIENT (Islam, 2026-08-29): the platform has one admin;
what somebody may do about a client is the seat they hold ON it, written on
that client's configuration and READ everywhere else.

Run:  DATABASE_URL=…  node SMP-Project-Folder/src/checks/fixture-platform.js
      DATABASE_URL=…  SMP_CHROME=…  python3 SMP-Project-Folder/src/checks/multi-client.py
"""
import os, subprocess, sys, time, urllib.request
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
REPO = os.path.abspath(os.path.join(ROOT, ".."))
PORT = int(os.environ.get("SMP_CHECK_PORT", "3994"))
BASE = "http://127.0.0.1:%d" % PORT

OFFICE = ("islam.saadany@forefront.consulting", "officepw123")     # the platform admin
CONSULT = ("omar.alaa@forefront.consulting", "omarpw12345")        # SMO team, Raya only
CLIENTP = ("smo@rayatrade.com", "rayapw123")                       # Raya's own person

fails, checks = [], 0
def check(name, cond, extra=""):
    global checks
    checks += 1
    if not cond:
        fails.append(name + ("  — " + str(extra) if extra else ""))

def wait_up(tries=40):
    for _ in range(tries):
        try:
            urllib.request.urlopen(BASE + "/api/auth", timeout=1)
            return True
        except Exception:
            time.sleep(0.3)
    return False

def sign_in(pg, who):
    pg.goto(BASE + "/", wait_until="networkidle")
    pg.fill("#user", who[0]); pg.fill("#password", who[1])
    pg.click("#loginForm button[type=submit]")

def api(pg, body):
    return pg.evaluate("""async (b) => {
      const r = await fetch('/api/platform', {method:'POST', cache:'no-store',
        headers:{'Content-Type':'application/json'}, body: JSON.stringify(b)});
      const j = await r.json().catch(() => ({}));
      return Object.assign({ __status: r.status }, j); }""", body)

def main():
    fixture = subprocess.run(["node", os.path.join(ROOT, "src", "checks", "fixture-platform.js")],
                             cwd=REPO, capture_output=True, text=True)
    if fixture.returncode:
        print("fixture failed:\n" + fixture.stderr); sys.exit(1)

    dev = subprocess.Popen(["node", os.path.join(REPO, "scripts", "dev-server.js"), str(PORT)],
                           cwd=REPO, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        if not wait_up():
            print("dev-server never came up"); sys.exit(1)
        chrome = os.environ.get("SMP_CHROME", "/opt/pw-browsers/chromium")
        with sync_playwright() as pw:
            b = pw.chromium.launch(executable_path=chrome, args=["--no-sandbox", "--disable-dev-shm-usage"])

            # ── 1 · the door holds nothing but sign-in (T063) ───────
            pg = b.new_page(viewport={"width": 1400, "height": 900})
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/", wait_until="networkidle")
            check("the door asks for an email", "Email" in pg.inner_text("#accessLabel"),
                  pg.inner_text("#accessLabel"))
            check("no client's name is on the door",
                  "raya" not in pg.inner_text("body").lower(), "a client is named on the front door")
            # ASSERTED AS ABSENCES, because the fault this guards is the office's
            # pages LEAKING BACK onto the front page, where anybody can read them
            # (§94.2 from the negative side: a check that only looks for
            # something present cannot see something that should not be drawn).
            shape = pg.evaluate("""() => ({
              cards: document.querySelectorAll('.ccard').length,
              tabs: document.querySelectorAll('[data-tab], [data-off], #cardTabs button').length,
              tables: document.querySelectorAll('table').length })""")
            check("the door draws no client cards", shape["cards"] == 0, shape)
            check("the door draws no office tabs", shape["tabs"] == 0, shape)
            check("the door draws no tables", shape["tables"] == 0, shape)
            words = pg.inner_text("body")
            for w in ("Consultants", "Who sees what", "Clients"):
                check("the door does not name '%s'" % w, w not in words)

            # A PERSON KEY IS NOT A WAY IN ANY MORE (Islam, 2026-08-28).
            pg.fill("#user", "smo"); pg.fill("#password", CLIENTP[1])
            pg.click("#loginForm button[type=submit]")
            pg.wait_for_timeout(1200)
            # REPORTED, NOT CRASHED. Written first as "is the error showing",
            # which on a build that ACCEPTS the key navigates away — and the next
            # section then timed out waiting for a field on a page it was no
            # longer on. A test that dies says only that something went wrong.
            got_in = not pg.url.rstrip("/").endswith(str(PORT))
            check("signing in with a person key is refused",
                  (not got_in) and pg.is_visible("#error"),
                  "the door accepted 'smo' as a name and opened " + pg.url if got_in
                  else "no refusal was shown")
            if got_in:
                pg.evaluate("""() => fetch('/api/auth', {method:'POST',
                    headers:{'Content-Type':'application/json'},
                    body: JSON.stringify({action:'logout'})})""")
                pg.wait_for_timeout(400)

            # ── 2 · sign-in lands on the platform, and the cards ────
            sign_in(pg, OFFICE)
            pg.wait_for_url("**/platform", timeout=9000)
            check("signing in lands on the platform, not on the door",
                  pg.url.rstrip("/").endswith("/platform"), pg.url)
            pg.wait_for_selector(".ccard", timeout=9000)
            names = pg.eval_on_selector_all(".ccard[data-client] h2", "els => els.map(e => e.textContent)")
            check("the admin sees every client", len(names) >= 3, names)
            # WHAT IS DRAWN IS WHAT THE SERVER WILL OPEN — asked of the server,
            # not inferred from the screen (§94.2, both ends).
            j = api(pg, {"action": "cards"})
            check("the cards on screen are the cards the server names",
                  sorted([c["name"] for c in j["cards"]]) == sorted(names),
                  str(sorted(names)) + " vs " + str(sorted([c["name"] for c in j["cards"]])))
            # THE CARD SAYS THE SEAT, because that is what decides what they can
            # do when they arrive — and the admin's own seat on Raya is super.
            raya = [c for c in j["cards"] if c["key"] == "raya-trade"][0]
            check("the card carries this person's seat on this client",
                  raya["seat"] == "super", raya.get("seat"))
            # ASKED CASE-INSENSITIVELY: the tag is uppercased in CSS, so the
            # rendered text is SUPER USER and the source says Super user —
            # asserting the rendering asserts a stylesheet, not the fact.
            seat_shown = pg.inner_text(".ccard[data-client='raya-trade']").lower()
            check("…and the card says it in words", "super user" in seat_shown, seat_shown)

            # ── 3 · opening one, and the way back ───────────────────
            pg.click(".ccard[data-client='raya-trade']")
            pg.wait_for_load_state("networkidle")
            check("a card opens the client's own address", pg.url.endswith("/raya-trade"), pg.url)
            pg.wait_for_timeout(2600)
            back = pg.query_selector("#clientback")
            check("the client's name is in the chrome", bool(back) and back.is_visible())
            if back and back.is_visible():
                check("…and it says which client", "Raya Trade" in back.inner_text(), back.inner_text())
                # PRESSED, not merely present (§70): a control nothing can hit
                # is a control that does not exist.
                box = pg.evaluate("""() => { const e = document.getElementById('clientback');
                  const r = e.getBoundingClientRect();
                  const hit = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2);
                  return { hit: hit ? (hit.id || hit.className) : null, w: Math.round(r.width) }; }""")
                check("…and the press lands on it", "clientback" in str(box["hit"]), box)
                check("…and the client's name is not also printed beside it",
                      pg.eval_on_selector(".brand", "e => e.innerText").count("Raya Trade") == 0,
                      pg.eval_on_selector(".brand", "e => e.innerText"))
                pg.click("#clientback")
                pg.wait_for_load_state("networkidle")
                pg.wait_for_selector(".ccard", timeout=9000)
                check("…and it goes back to the platform's cards",
                      pg.url.rstrip("/").endswith("/platform"), pg.url)

            # ── 4 · one destination is not a question (§32) ─────────
            pg2 = b.new_page(viewport={"width": 1200, "height": 800})
            sign_in(pg2, CONSULT)
            pg2.wait_for_load_state("networkidle"); pg2.wait_for_timeout(1500)
            check("somebody with one client opens it, with no card in the way",
                  pg2.url.endswith("/raya-trade"), pg2.url)

            # ── 5 · a client's own person ───────────────────────────
            pg3 = b.new_page(viewport={"width": 1200, "height": 800})
            sign_in(pg3, CLIENTP)
            pg3.wait_for_load_state("networkidle"); pg3.wait_for_timeout(2600)
            check("a client's own person lands in their client", pg3.url.endswith("/raya-trade"), pg3.url)
            cb = pg3.query_selector("#clientback")
            check("…and is offered no way to any other client", not (cb and cb.is_visible()))
            refused = api(pg3, {"action": "cards"})
            check("…and the outer platform refuses them on the server too",
                  refused["__status"] == 403, refused.get("__status"))

            # ── 6 · a client they may not open ──────────────────────
            other = pg2.evaluate("""async () => {
              const r = await fetch('/api/state?client=rhi', {cache:'no-store'});
              const j = await r.json();
              return { status: r.status, error: j.error }; }""")
            check("a client this account may not open is refused", other["status"] == 404, other)
            check("…in the platform's own words, naming nothing",
                  other["error"] == "That client is not available.", other)

            # ── 7 · the office's pages live on the platform ─────────
            pg.goto(BASE + "/platform", wait_until="networkidle")
            pg.wait_for_selector("#nav button", timeout=9000)
            tabs = pg.eval_on_selector_all("#nav button", "els => els.map(e => e.textContent)")
            check("the admin is offered the office's pages",
                  "Consultants" in tabs and "Who sees what" in tabs, tabs)

            pg.click("#nav button[data-tab='consultants']")
            pg.wait_for_selector("table tbody tr", timeout=8000)
            rows = pg.eval_on_selector_all("table tbody tr td:first-child",
                                           "els => els.map(e => e.textContent)")
            check("the consultants list draws Forefront's people", len(rows) >= 3, rows)
            # AND NOBODY ELSE'S: account_clients maps a client's own people too —
            # that is how their account knows which client it is — so a list read
            # without `kind = 'office'` offers to make Raya's SMO its super user.
            mails = pg.eval_on_selector_all("table tbody tr td:nth-child(2)",
                                            "els => els.map(e => e.textContent)")
            check("…and nobody who belongs to a client",
                  all(m.endswith("@forefront.consulting") for m in mails), mails)

            # THE SEAT IS READ HERE AND WRITTEN ON THE CLIENT (§53.5). Asserted
            # at BOTH ENDS below — read-only here, editable there — because
            # "one place writes it" is a claim about two screens.
            seatcells = pg.evaluate("""() => {
              const tds = Array.from(document.querySelectorAll('table tbody tr td.seats'));
              return { rows: tds.length, buttons: tds.reduce((n,td) => n + td.querySelectorAll('button').length, 0),
                       words: tds.map(td => td.innerText).join(' | ') }; }""")
            check("a person's seats are listed on the consultants page", seatcells["rows"] >= 3, seatcells)
            check("…and cannot be changed there", seatcells["buttons"] == 0, seatcells)
            check("…and name the client they are held on",
                  "Raya Trade" in seatcells["words"] or "raya" in seatcells["words"].lower(), seatcells)

            # ISSUING A PASSWORD IS PRESSED, and the outcome read from the page
            # (§70: a control nothing can hit is a control that does not exist).
            btn = pg.query_selector("table tbody tr td:last-child button")
            check("a password can be issued from the list", bool(btn))
            if btn:
                btn.click()
                pg.wait_for_selector(".said", timeout=8000)
                said = pg.inner_text(".said")
                check("…and a temporary password is said once, on the page",
                      "said once" in said, said)

            # THE ADMIN CANNOT CHANGE THEIR OWN ADMIN RIGHTS — asked of the
            # server, not of the disabled-looking cell (§42).
            own = api(pg, {"action": "saveConsultant", "email": OFFICE[0], "isAdmin": False})
            check("the admin may not take away their own admin rights",
                  own["__status"] == 403, own)

            # ── 8 · who sees what, and its teeth on the server ──────
            pg.click("#nav button[data-tab='access']")
            pg.wait_for_selector("table tbody .cell", timeout=8000)
            rowcount = pg.eval_on_selector_all("table tbody tr", "els => els.length")
            check("the table asks one question of every consultant", rowcount == 1, rowcount)
            heads = pg.eval_on_selector_all("table thead th", "els => els.map(e => e.textContent)")
            check("…and no platform-wide role is named",
                  not any(h in heads for h in ("Lead", "Consultant", "Observer")), heads)

            # A CELL PUT BACK TO ITS DEFAULT LEAVES NOTHING STORED (§50.6), so a
            # table that has been set and unset is byte-identical to one nobody
            # has touched. THE DEFAULT IS ASKED OF THE SERVER, never written in
            # here: the first run pressed `hidden` — a real setting, correctly
            # stored — and called the product broken for storing it.
            defs = api(pg, {"action": "access"})["defaults"]
            stored = pg.evaluate("""async ([other, back]) => {
              const set = (g) => fetch('/api/platform', {method:'POST', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({action:'saveAccess', area:'other_clients', grant:g})});
              const read = async () => (await (await fetch('/api/platform', {method:'POST',
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify({action:'access'})})).json()).stored.other_clients;
              await set(other);
              const mid = await read();
              await set(back);
              return { set: mid, back: await read() }; }""",
              ["open" if defs["other_clients"] != "open" else "listed", defs["other_clients"]])
            check("a cell that is set is stored", stored["set"] is not None, stored)
            check("…and put back to its default stores nothing", stored["back"] is None, stored)

            # A NON-ADMIN MAY NOT WRITE IT, whatever seat they hold: editing who
            # may see what is editing who may edit it (§89's rule, one level out).
            byteam = api(pg2, {"action": "saveAccess", "area": "other_clients", "grant": "open"})
            check("a consultant may not set who sees what", byteam["__status"] == 403, byteam)

            # ── 9 · a client's configuration writes the seats ───────
            pg.click("#nav button[data-tab='clients']")
            pg.wait_for_selector(".ccard .ccfg", timeout=8000)
            pg.click(".ccard[data-client='raya-trade'] .ccfg")
            pg.wait_for_selector(".teamrow", timeout=8000)
            team = pg.eval_on_selector_all(".teamrow .em", "els => els.map(e => e.textContent)")
            check("the team is Forefront's people and nobody else's",
                  team and all(t.endswith("@forefront.consulting") for t in team), team)
            editable = pg.eval_on_selector_all(".teamrow .cell button", "els => els.length")
            check("…and the seat IS written here", editable >= 2, editable)

            # ONE SUPER USER PER CLIENT, AND THE SECOND MOVES THE FIRST rather
            # than being refused: the database's unique index is the floor, and
            # a screen that made somebody choose who to demote first would be
            # asking a question the answer already implies.
            moved = api(pg, {"action": "setTeam", "key": "raya-trade",
                             "email": CONSULT[0], "seat": "super"})
            check("a second super user is accepted", moved.get("ok") is True, moved)
            after = api(pg, {"action": "client", "key": "raya-trade"})
            supers = [m["email"] for m in after["team"] if m.get("seat") == "super"]
            check("…and there is exactly one super user afterwards", len(supers) == 1, supers)
            check("…and it is the person just given it", supers[:1] == [CONSULT[0]], supers)
            # PUT BACK, because a check that leaves the fixture changed is one
            # whose next run measures something else (§94.2).
            api(pg, {"action": "setTeam", "key": "raya-trade", "email": OFFICE[0], "seat": "super"})

            # ── 10 · the office's row on the client's register ──────
            pg.goto(BASE + "/raya-trade", wait_until="networkidle")
            pg.wait_for_timeout(2800)
            reg = pg.evaluate("""async () => {
              const r = await fetch('/api/state?client=raya-trade', {cache:'no-store'});
              const j = await r.json();
              const ff = (j.state.people || []).filter(p => p.forefront);
              return ff.map(p => ({ key: p.key, role: p.role })); }""")
            check("the office appears on the client's own register", len(reg) >= 1, reg)
            check("…holding the seat its configuration gives them",
                  all(p["role"] in ("super", "smoteam") for p in reg), reg)

            # ── 11 · the Demo client, and the button that went ──────
            # THE DEMO DATA BUTTON IS GONE FOR EVERY VIEWER (spec 024 §6.1):
            # the worked example is a CLIENT now, with its own schema and its
            # own address, and it saves — which is the whole reason Islam
            # asked for it. Asserted as an ABSENCE on the client's own
            # platform, for every one of the three viewers, because a control
            # left drawn for one of them is exactly what nobody would notice.
            for who, p in (("the admin", pg), ("a consultant", pg2), ("a client's own person", pg3)):
                p.goto(BASE + "/raya-trade", wait_until="networkidle")
                p.wait_for_timeout(2400)
                gone = p.evaluate("""() => ({
                  menu: !!document.getElementById('demomenu'),
                  btn:  !!document.getElementById('demobtn'),
                  ban:  !!document.getElementById('banner'),
                  mode: !!(window.SYNC && SYNC.setMode) })""")
                check("the Demo data control is gone for " + who,
                      not gone["menu"] and not gone["btn"], gone)
                check("…and its banner with it, for " + who, not gone["ban"], gone)
                check("…and there is no way to switch datasets at all, for " + who,
                      not gone["mode"], gone)

            check("no page errors anywhere", not errs, errs)
            b.close()
    finally:
        dev.terminate()

    print("%d checks, %d failed" % (checks, len(fails)))
    for f in fails:
        print("  FAIL  " + f)
    sys.exit(1 if fails else 0)

main()
