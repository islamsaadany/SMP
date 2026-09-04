#!/usr/bin/env python3
"""Forefront's own platform, measured (spec 030, T054-T055).

TWO THINGS NOTHING ELSE ASKS. The contrast sweep and the width sweep both walk
the CLIENT's platform, which is a different file served at a different address
— so the door and /platform have never been measured at all, and a page that
failed either would go green every time (§94.11's shape).

Contrast is measured with qa.py's OWN function, read out of its source rather
than copied (§67, and checks/send-message.py's precedent): a second
implementation of a WCAG ratio is a second thing to get wrong.

Run:  DATABASE_URL=…  SMP_CHROME=…  python3 SMP-Project-Folder/src/checks/platform-look.py
"""
import os, re, subprocess, sys, time, urllib.request
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
REPO = os.path.abspath(os.path.join(ROOT, ".."))
PORT = int(os.environ.get("SMP_CHECK_PORT", "3995"))
BASE = "http://127.0.0.1:%d" % PORT
OFFICE = ("islam.saadany@forefront.consulting", "officepw123")

WIDTHS = [1920, 1500, 1280, 1000]

# TEXT PAINTED BY ITS BACKGROUND IS TEXT THE SWEEP CANNOT SEE, and it reports
# it as the WORST possible failure: `-webkit-text-fill-color: transparent`
# makes `color` transparent, so the ratio comes out as exactly 1 against
# whatever is behind. The door's hero line uses that technique deliberately —
# the half of the sentence carrying the idea is a gold gradient on the navy
# wall — so this is a correct build reported broken, which is §68.10's fault
# and costs as much as the other direction.
#
# MEASURED BY HAND INSTEAD, ONCE, AND WRITTEN DOWN: the two stops are #F5A623
# and #ffc25c, and the darkest navy behind them is #0F2C69 — 6.54:1 and
# 8.28:1, against the 3:1 that large text needs.
#
# ASKED OF THE PAGE, NOT OF THE TAG NAME. The first version excluded an <em>
# reading exactly 1, which is the words again wearing a selector: it would
# have gone on excusing that element the day somebody removed the gradient and
# left it genuinely invisible. The page is asked which elements are painted
# this way, and only those are set aside.
CLIP_JS = """() => Array.from(document.querySelectorAll('*'))
  .filter(e => {
    const cs = getComputedStyle(e);
    return (cs.webkitTextFillColor === 'rgba(0, 0, 0, 0)' ||
            cs.webkitTextFillColor === 'transparent') &&
           cs.backgroundImage && cs.backgroundImage !== 'none' &&
           (cs.webkitBackgroundClip === 'text' || cs.backgroundClip === 'text');
  })
  .map(e => (e.textContent || '').trim().slice(0, 32))"""


def not_clip_painted(findings, painted):
    """The sweep truncates its `text` to a prefix, so a finding is set aside
    when it is a prefix of something the page says it paints this way."""
    out = []
    for f in findings or []:
        t = (f.get("text") or "").strip()
        if any(t and p.startswith(t[:24]) for p in painted):
            continue
        out.append(f)
    return out


fails, checks = [], 0
def check(name, cond, extra=""):
    global checks
    checks += 1
    if not cond:
        fails.append(name + ("  — " + str(extra) if extra else ""))


def wait_up(tries=40):
    for _ in range(tries):
        try:
            urllib.request.urlopen(BASE + "/api/auth", timeout=1); return True
        except Exception: time.sleep(0.3)
    return False


def contrast_js():
    """THE SWEEP'S OWN FUNCTION, lifted out of `scripts/contrast-sweep.py`
    rather than reimplemented — the way checks/send-message.py already does it,
    and the way test-clean-parity.js reads `clearedGraph()` out of the platform
    (§67). Two contrast rules would drift, and the one that drifts is always
    the one nobody is looking at."""
    src = open(os.path.join(REPO, "scripts", "contrast-sweep.py"), encoding="utf-8").read()
    m = re.search(r'JS = r"""(.*?)"""', src, re.S)
    if not m:
        raise SystemExit("contrast-sweep.py no longer holds `JS` — this check reads it, "
                         "and a copy here would be the second definition (§51.11)")
    return m.group(1)


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
        CJS = contrast_js()
        chrome = os.environ.get("SMP_CHROME", "/opt/pw-browsers/chromium")
        with sync_playwright() as pw:
            b = pw.chromium.launch(executable_path=chrome, args=["--no-sandbox", "--disable-dev-shm-usage"])
            pg = b.new_page(viewport={"width": 1400, "height": 900})
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))

            # Sign in once; the pages below are all behind it.
            pg.goto(BASE + "/", wait_until="networkidle")
            pg.fill("#user", OFFICE[0]); pg.fill("#password", OFFICE[1])
            pg.click("#loginForm button[type=submit]")
            pg.wait_for_url("**/platform", timeout=9000)
            pg.wait_for_selector(".ccard", timeout=9000)

            # ── 1 · no sideways scroll, at four widths, on every page ──
            # §27.2: a page that scrolls sideways drags every sticky element
            # with it, so this is not a cosmetic assertion.
            pages = [("the cards", lambda: pg.click("#nav button[data-tab='clients']")),
                     ("consultants", lambda: pg.click("#nav button[data-tab='consultants']")),
                     ("who sees what", lambda: pg.click("#nav button[data-tab='access']"))]
            for w in WIDTHS:
                pg.set_viewport_size({"width": w, "height": 900})
                for name, go in pages:
                    go(); pg.wait_for_timeout(700)
                    over = pg.evaluate("""() => ({
                      doc: document.documentElement.scrollWidth,
                      win: window.innerWidth })""")
                    check("%s does not scroll sideways at %dpx" % (name, w),
                          over["doc"] <= over["win"] + 1, over)
                # And the door, which is the one page nobody has to sign in for.
                pg2 = b.new_page(viewport={"width": w, "height": 900})
                pg2.goto(BASE + "/", wait_until="networkidle")
                over = pg2.evaluate("""() => ({
                  doc: document.documentElement.scrollWidth, win: window.innerWidth })""")
                check("the door does not scroll sideways at %dpx" % w,
                      over["doc"] <= over["win"] + 1, over)
                pg2.close()

            # ── 2 · contrast, in both themes ───────────────────────────
            pg.set_viewport_size({"width": 1440, "height": 950})
            for theme in ("light", "dark"):
                pg.evaluate("(t) => document.documentElement.setAttribute('data-theme', t)", theme)
                pg.wait_for_timeout(200)
                for name, go in pages:
                    go(); pg.wait_for_timeout(700)
                    bad = pg.evaluate(CJS, None)
                    check("%s reads in %s (%d failures)" % (name, theme, len(bad or [])),
                          not bad, (bad or [])[:4])
                # The door carries its own palette and its own wall.
                pg3 = b.new_page(viewport={"width": 1440, "height": 950})
                pg3.goto(BASE + "/", wait_until="networkidle")
                pg3.evaluate("(t) => document.documentElement.setAttribute('data-theme', t)", theme)
                pg3.wait_for_timeout(300)
                painted = pg3.evaluate(CLIP_JS)
                bad = not_clip_painted(pg3.evaluate(CJS, None), painted)
                check("the door's gradient heading IS painted that way",
                      len(painted) >= 1, painted)
                check("the door reads in %s (%d failures)" % (theme, len(bad)),
                      not bad, bad[:4])
                pg3.close()

            check("no page errors anywhere", not errs, errs)
            b.close()
    finally:
        dev.terminate()

    print("%d checks, %d failed" % (checks, len(fails)))
    for f in fails:
        print("  FAIL  " + f)
    sys.exit(1 if fails else 0)

main()
