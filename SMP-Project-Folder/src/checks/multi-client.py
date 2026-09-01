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
            # A MARK IS NOT TEXT, AND THIS ASSERTION ONLY READ TEXT (§147.15).
            # It passed for as long as the door carried Raya Trade's lockup —
            # a <use href="#raya-trade"> says nothing to inner_text — so the
            # one client whose door it was NOT went on being named on it, in
            # the loudest way a screen can. §113.8's blind spot in my own
            # check: I asserted the words and the fault was a picture.
            named = pg.evaluate("""() => {
              const txt = (document.body.innerText || '').toLowerCase();
              const attr = (e, n) => (e.getAttribute(n) || '');
              const marks = Array.from(document.querySelectorAll('use, img, svg, symbol'))
                .map(e => [attr(e,'href'), attr(e,'xlink:href'), attr(e,'src'),
                           attr(e,'aria-label'), attr(e,'id')].join(' ').toLowerCase())
                .filter(x => x.trim());
              const ids = Array.from(document.querySelectorAll('[id]'))
                .map(e => String(e.id).toLowerCase());
              return { txt, marks, ids }; }""")
            for client in ("raya", "rhi", "el-abd"):
                check("no client is named on the door in words (%s)" % client,
                      client not in named["txt"], named["txt"][:120])
                check("…nor drawn on it (%s)" % client,
                      not any(client in m for m in named["marks"]), named["marks"])
                check("…nor left in its markup (%s)" % client,
                      not any(client in i for i in named["ids"]), named["ids"])
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

            # AND THE DOOR ANSWERS ON A DEPLOYMENT THAT IS NOT SET UP YET
            # (§147.13). Signing in is not about a client — identity is shared
            # — so the door's own four questions must never be refused for a
            # client reason. Asked of a client that certainly is not in the
            # registry: the answer must be about the SIGN-IN, never about a
            # client, or the one screen somebody needs in order to fix
            # anything is the screen that turns them away (§16.7).
            door = pg.evaluate("""async () => {
              const r = await fetch('/api/auth?client=no_such_client_at_all',
                { cache: 'no-store' });
              const j = await r.json().catch(() => ({}));
              return { status: r.status, ok: j.ok, error: j.error || '' }; }""")
            check("the door answers even when the client cannot be resolved",
                  door["ok"] is True, door)
            check("…and never refuses a sign-in for a client reason",
                  "client" not in (door["error"] or "").lower(), door)

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
            # ── FOREFRONT'S PEOPLE LAND ON FOREFRONT'S PLATFORM (§147.24) ──
            # This asserted the opposite until Islam signed in: "the access
            # opens directly in raya trade! what are you doing?" §32's rule —
            # one destination is not a question — is about a door in front of a
            # destination, and the platform is not that: it IS where the
            # office's work lives. And a landing that changes with the number
            # of rows in a table is not a design.
            landed = pg2.url.rstrip("/").endswith("/platform")
            check("somebody at Forefront lands on Forefront's platform", landed, pg2.url)
            # REPORTED, NOT CRASHED — the rule this file already carries. On a
            # build with the old landing there is no card to wait for, and a
            # test that dies says only that something went wrong.
            if landed:
                pg2.wait_for_selector(".ccard[data-client]", timeout=9000)
                check("…with the client they hold on it",
                      "Raya Trade" in pg2.inner_text("#page"), pg2.inner_text("#page")[:120])
                pg2.click(".ccard[data-client='raya-trade']")
                pg2.wait_for_load_state("networkidle"); pg2.wait_for_timeout(2500)
                check("…and pressing it opens the client", pg2.url.endswith("/raya-trade"), pg2.url)
            # AND THE WAY BACK IS NOT A LOOP (§147.23). It went to "/", and the
            # door hands somebody over to what they can OPEN — so for exactly
            # this person, holding one client, the way back walked out of the
            # client and straight back into it. INVISIBLE on the admin above,
            # who has several: the door sends them to the cards anyway, so the
            # assertion in §3 passed for the wrong reason the whole time.
            b2 = pg2.query_selector("#clientback")
            check("a consultant with one client is still offered the way back", bool(b2))
            if b2:
                b2.click()
                pg2.wait_for_load_state("networkidle"); pg2.wait_for_timeout(1800)
                check("…and it reaches the platform rather than looping back in",
                      pg2.url.rstrip("/").endswith("/platform"), pg2.url)
                pg2.goto(BASE + "/raya-trade", wait_until="networkidle")
                pg2.wait_for_timeout(2000)

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
            # A CELL'S WORDS MAY LIVE IN A FIELD (§147.27). The name and the
            # address are editable now, so `textContent` on those two columns
            # is empty — the check has to read what a person would read, which
            # is the input's value where there is one.
            mails = pg.eval_on_selector_all("table tbody tr td:nth-child(2)",
                "els => els.map(e => { const i = e.querySelector('input'); "
                "return i ? i.value : e.textContent; })")
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

            # THE PLATFORM'S ROLE IS SUPER USER, IN A COLUMN THAT SAYS WHERE
            # (Islam's option B, 2026-09-01). The word alone would collide with
            # the seat of the same name held on a CLIENT, so the assertion is
            # about the PAIR: the column carries the where, the chip the what,
            # and the row reads Platform · Super user beside Raya Trade · Super
            # user. Asked at both ends — the old wording gone AND the new one
            # drawn — because a build that lost the column entirely would
            # satisfy half of it (§113.8).
            role = pg.evaluate("""() => {
              const heads = Array.from(document.querySelectorAll('table thead th'))
                .map(e => e.textContent.trim());
              const read = e => { const i = e.querySelector('input'); return i ? i.value : e.innerText.trim(); };
              const mine = Array.from(document.querySelectorAll('table tbody tr'))
                .filter(tr => Array.from(tr.querySelectorAll('td')).some(td => read(td).indexOf('islam.saadany@') > -1))[0];
              const cells = mine ? Array.from(mine.querySelectorAll('td')).map(read) : [];
              const chip = mine ? mine.querySelector('td .cell button') : null;
              const box = chip ? chip.getBoundingClientRect() : null;
              return { heads, cells,
                       chip: chip ? chip.textContent.trim() : null,
                       cls: chip ? String(chip.className) : null,
                       lit: chip ? chip.classList.contains('on') : false,
                       locked: mine ? !!mine.querySelector('td .cell.locked') : false,
                       /* A RANGE OVER THE TEXT, NEVER THE BOX'S HEIGHT
                          DIVIDED BY A LINE (§88, §105.2). The chip has 5px of
                          padding top and bottom, so 25px over a 14.7px line
                          rounds to TWO and called a perfectly good one-line
                          chip a wrapped one. Count the DISTINCT TOPS among the
                          rects the text actually occupies. */
                       lines: (function () {
                         if (!chip || !chip.firstChild) return 0;
                         const r = document.createRange();
                         r.selectNodeContents(chip);
                         const tops = new Set(Array.from(r.getClientRects())
                           .filter(x => x.width > 0).map(x => Math.round(x.top)));
                         return tops.size;
                       })(),
                       who: (document.getElementById('who') || {}).textContent || '' }; }""")
            check("the platform's role sits in a column that says where",
                  "Platform" in role["heads"] and "Platform admin" not in role["heads"], role["heads"])
            check("…and the chip says what it is", role["chip"] == "Super user", role)
            check("…lit on the person who holds it", role["lit"] is True, role)
            # NOBODY CHANGES THEIR OWN STANDING — which is also what stops the
            # platform's last super user locking themselves out of it.
            check("…and drawn quiet on their own row", role["locked"] is True, role)
            check("…and the chrome says the same word", "Super user" in role["who"], role["who"])
            # A SETUP TABLE ROW IS ONE LINE (§88): "Super user" is longer than
            # the "Yes" it replaced, so the cell is measured rather than assumed.
            check("…on one line", role["lines"] <= 1, role)
            # AND THE NAME IS READ OFF THE ADDRESS, not written into the code.
            check("the bootstrap account carries a name, not the company",
                  role["cells"] and role["cells"][0] and role["cells"][0] != "Forefront",
                  role["cells"][:2])

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

            # A CLIENT MAY HOLD TWO SUPER USERS (§147.26, Islam: "a project might
            # have 2 super users"). This asserted the opposite — a second MOVED
            # the seat off the first, enforced by a unique index — which was
            # tidy about a table and wrong about the work.
            moved = api(pg, {"action": "setTeam", "key": "raya-trade",
                             "email": CONSULT[0], "seat": "super"})
            check("a second super user is accepted", moved.get("ok") is True, moved)
            after = api(pg, {"action": "client", "key": "raya-trade"})
            supers = [m["email"] for m in after["team"] if m.get("seat") == "super"]
            check("…and BOTH hold it, neither demoted", len(supers) == 2, supers)
            check("…including the one just given it", CONSULT[0] in supers, supers)
            check("…and the one who already had it", OFFICE[0] in supers, supers)
            # PUT BACK, because a check that leaves the fixture changed is one
            # whose next run measures something else (§94.2).
            api(pg, {"action": "setTeam", "key": "raya-trade", "email": CONSULT[0], "seat": "smoteam"})

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

            # ── 12 · a client nobody has been put on (§147.20) ──────
            # THE ADMIN REACHES EVERY CLIENT, and `seatFor()` says so in as
            # many words — "somebody has to be able to open a client nobody is
            # on yet — the one they just created". `getSession` asked for a
            # seat row BEFORE the rules and turned them away first, so making
            # a client from the cards produced one that could not be opened.
            # Asked at BOTH ENDS, because the card said yes the whole time.
            seatless = api(pg, {"action": "cards"})
            spare = [c for c in seatless["cards"] if c["key"] != "raya-trade" and c["canOpen"]]
            check("there is a client the admin holds no seat on", bool(spare),
                  [(c["key"], c.get("seat"), c["canOpen"]) for c in seatless["cards"]])
            if spare:
                key = spare[0]["key"]
                check("…and the card says they may open it", spare[0].get("seat") is None, spare[0])
                got = pg.evaluate("""async (k) => {
                  const r = await fetch('/api/state?client=' + k, { cache: 'no-store' });
                  const j = await r.json();
                  return { status: r.status, ok: !!j.ok,
                           seat: j.person && j.person.seat, error: j.error || '' }; }""", key)
                check("…and the server opens it too", got["ok"] is True, got)
                # ARRIVING WITHOUT A SEAT THEY HOLD THE CLIENT'S OWN SUPER USER
                # SEAT — the rule's answer, not a row that does not exist.
                check("…holding the seat the rule gives them", got["seat"] == "super", got)

            # ── 13 · nothing yet is not a dead end (§147.18, §61) ───
            # The Add card was appended AFTER the empty-state returned, so the
            # one person who can create a client was the one shown a dead end
            # — and told to ask the platform's super user, which is who they
            # are. The list is emptied on the wire rather than in the
            # database, so the fixture the rest of this file measures is
            # untouched.
            pg.route("**/api/platform", lambda route: (
                route.fulfill(status=200, content_type="application/json",
                              body='{"ok":true,"cards":[],"canAdd":true,'
                                   '"canConsultants":true,"canAccess":true}')
                if b'"cards"' in (route.request.post_data_buffer or b'') else route.continue_()))
            pg.goto(BASE + "/platform", wait_until="networkidle")
            pg.wait_for_timeout(1400)
            empty = pg.evaluate("""() => ({
              add: document.querySelectorAll('.ccard.add').length,
              words: (document.getElementById('page') || {}).innerText || '' })""")
            check("with no clients at all, the way in is still drawn", empty["add"] == 1, empty)
            check("…and the words say what this reader can do about it",
                  "Add the first one" in empty["words"], empty["words"][:140])
            check("…and do not send the super user to ask themselves",
                  "Ask the platform" not in empty["words"], empty["words"][:140])
            pg.unroute("**/api/platform")

            # ── 14 · editing a consultant, and a silent refresh (§147.27–28) ──
            pg.click("#nav button[data-tab='consultants']")
            pg.wait_for_selector("table tbody tr", timeout=9000)
            # THE NAME AND THE ADDRESS ARE FIELDS, and they COMMIT — asked of
            # the data afterwards, because a field that looks accepted and
            # discards every keystroke is the fault §96 exists for.
            idx = pg.evaluate("""(a) => Array.from(document.querySelectorAll('table tbody tr'))
              .findIndex(r => { const i = r.querySelector('td:nth-child(2) input');
                                return i && i.value === a; })""", CONSULT[0])
            check("a consultant's row carries editable fields", idx >= 0, idx)
            if idx >= 0:
                row = "table tbody tr:nth-child(%d)" % (idx + 1)
                # A SILENT REFRESH (§147.28): the pane must not blank or say
                # "Reading…" while it updates — the fault Islam reported.
                blanked = pg.evaluate("""(sel) => new Promise(resolve => {
                  let sawEmpty = false;
                  const el = document.getElementById('page');
                  const ob = new MutationObserver(() => {
                    if (!el.textContent.trim() || /Reading/.test(el.textContent)) sawEmpty = true;
                  });
                  ob.observe(el, { childList: true, subtree: true, characterData: true });
                  const f = document.querySelector(sel + ' td:nth-child(1) input');
                  f.value = 'Omar A. Alaa';
                  f.dispatchEvent(new Event('change', { bubbles: true }));
                  setTimeout(() => { ob.disconnect(); resolve(sawEmpty); }, 2200);
                })""", row)
                check("the page updates without blanking or saying Reading…", blanked is False, blanked)
                back = api(pg, {"action": "consultants"})
                who = [x for x in back["people"] if x["email"] == CONSULT[0]]
                check("…and the typed name reached the data",
                      who and who[0]["name"] == "Omar A. Alaa", who[:1])
                api(pg, {"action": "saveConsultant", "email": CONSULT[0], "name": "Omar Alaa"})

            check("no page errors anywhere", not errs, errs)
            b.close()
    finally:
        dev.terminate()

    print("%d checks, %d failed" % (checks, len(fails)))
    for f in fails:
        print("  FAIL  " + f)
    sys.exit(1 if fails else 0)

main()
