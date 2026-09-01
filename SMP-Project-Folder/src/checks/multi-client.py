#!/usr/bin/env python3
"""The door, the cards, and the client's name in the chrome (spec 024, US2).

WHY THIS CANNOT LIVE IN qa.py: every screen check opens the built file over
file://, where there is no server, no session and no client — so the whole
feature is invisible to it and a build that had lost it would go green every
time (§94.11). This serves the real files over HTTP against a real database.

Run:  DATABASE_URL=…  SMP_CHROME=…  python3 qa-run.py checks/multi-client.py
"""
import json, os, re, subprocess, sys, time, urllib.request
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
REPO = os.path.abspath(os.path.join(ROOT, ".."))
PORT = int(os.environ.get("SMP_CHECK_PORT", "3994"))
BASE = "http://127.0.0.1:%d" % PORT

OFFICE = ("islam.saadany@forefront.consulting", "officepw123")     # Admin
CONSULT = ("omar.alaa@forefront.consulting", "omarpw12345")        # Consultant, Raya only
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

def main():
    dev = subprocess.Popen([sys.executable and "node", os.path.join(REPO, "scripts", "dev-server.js"), str(PORT)],
                           cwd=REPO, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        if not wait_up():
            print("dev-server never came up"); sys.exit(1)
        chrome = os.environ.get("SMP_CHROME", "/opt/pw-browsers/chromium")
        with sync_playwright() as pw:
            b = pw.chromium.launch(executable_path=chrome, args=["--no-sandbox", "--disable-dev-shm-usage"])

            # ── 1 · the door ────────────────────────────────────────
            pg = b.new_page(viewport={"width": 1400, "height": 900})
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/", wait_until="networkidle")
            check("the door asks for an email", "Email" in pg.inner_text("#accessLabel"),
                  pg.inner_text("#accessLabel"))
            check("no client's name is on the door",
                  "raya" not in pg.inner_text("body").lower(), "a client is named on the front door")

            # A PERSON KEY IS NOT A WAY IN ANY MORE (Islam, 2026-08-28).
            pg.fill("#user", "smo"); pg.fill("#password", CLIENTP[1])
            pg.click("#loginForm button[type=submit]")
            pg.wait_for_timeout(1200)
            # REPORTED, NOT CRASHED. Written first as "is the error showing",
            # which on a build that ACCEPTS the key navigates into the client —
            # and the next section then timed out waiting for a field on a page
            # it was no longer on. A test that dies says only that something
            # went wrong; this one names it and carries on.
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

            # ── 2 · the cards ───────────────────────────────────────
            sign_in(pg, OFFICE)
            pg.wait_for_selector(".ccard", timeout=9000)
            names = pg.eval_on_selector_all(".ccard h3", "els => els.map(e => e.textContent)")
            check("the Admin sees every client", len(names) >= 3, names)
            # WHAT IS DRAWN IS WHAT THE SERVER WILL OPEN — asked of the server,
            # not inferred from the screen (§94.2, both ends).
            api = pg.evaluate("""async () => {
              const r = await fetch('/api/platform', {method:'POST', headers:{'Content-Type':'application/json'},
                                                      body: JSON.stringify({action:'cards'})});
              return await r.json(); }""")
            check("the cards on screen are the cards the server names",
                  sorted([c["name"] for c in api["cards"]]) == sorted(names),
                  str(sorted(names)) + " vs " + str(sorted([c["name"] for c in api["cards"]])))

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
                check("…and it goes back to the cards", pg.url.rstrip("/").endswith(str(PORT)), pg.url)

            # ── 4 · one destination is not a question (§32) ─────────
            pg2 = b.new_page(viewport={"width": 1200, "height": 800})
            sign_in(pg2, CONSULT)
            pg2.wait_for_load_state("networkidle"); pg2.wait_for_timeout(1200)
            check("somebody with one client opens it, with no card in the way",
                  pg2.url.endswith("/raya-trade"), pg2.url)

            # ── 5 · a client's own person ───────────────────────────
            pg3 = b.new_page(viewport={"width": 1200, "height": 800})
            sign_in(pg3, CLIENTP)
            pg3.wait_for_load_state("networkidle"); pg3.wait_for_timeout(2600)
            check("a client's own person lands in their client", pg3.url.endswith("/raya-trade"), pg3.url)
            cb = pg3.query_selector("#clientback")
            check("…and is offered no way to any other client", not (cb and cb.is_visible()))
            refused = pg3.evaluate("""async () => {
              const r = await fetch('/api/platform', {method:'POST', headers:{'Content-Type':'application/json'},
                                                      body: JSON.stringify({action:'cards'})});
              return r.status; }""")
            check("…and the outer platform refuses them on the server too", refused == 403, refused)

            # ── 6 · a client they may not open ──────────────────────
            other = pg2.evaluate("""async () => {
              const r = await fetch('/api/state?client=rhi', {cache:'no-store'});
              const j = await r.json();
              return { status: r.status, error: j.error }; }""")
            check("a client this account may not open is refused", other["status"] == 404, other)
            check("…in the platform's own words, naming nothing",
                  other["error"] == "That client is not available.", other)

            check("no page errors anywhere", not errs, errs)
            b.close()
    finally:
        dev.terminate()

    print("%d checks, %d failed" % (checks, len(fails)))
    for f in fails:
        print("  FAIL  " + f)
    sys.exit(1 if fails else 0)

main()
