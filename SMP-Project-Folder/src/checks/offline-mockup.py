"""THE MOCKUP IS MADE OF THE REAL BANNER (§41.9, rule 1c).

Not drawn from the stylesheet — driven. It opens the SHIPPED platform file (the
bytes Islam is looking at, §105.6) and writes each candidate sentence into the
LIVE `#refused` element, which is the same element `showFailed()` writes into
and wears `.banner.refused` with its real tokens. So every picture is the same
build, and what is agreed is what the product will look like rather than what
its CSS could be made to say.

THE BANNER IS SHOT ALONE, deliberately. It spans the page, so an element shot
is the whole control at its real width — and the page behind it is the baked
worked example, whose invented units and names have no business in a mockup
shown to a client (§245).

BOTH PALETTES, because `--bad-bg` and `--bad-tx` are themed and a sentence
measured in one is not measured in the other (§130.3).

Writes PNGs into design-mockups/offline-message/shots/. It measures nothing and
asserts nothing: it is a camera, not a check. The check comes with the build.
"""
import base64, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
FILE = ROOT / "SMP-Project-Folder/strategy-management-platform-v3.22.html"
OUT = ROOT / "design-mockups/offline-message/shots"
OUT.mkdir(parents=True, exist_ok=True)

# ── THE SENTENCES ────────────────────────────────────────────────────────
# `showFailed()` builds two spans: the bold lead plus the reason, then the
# advice. These are written in exactly that shape, or the mockup is of a
# component the product does not have.
TODAY = ("<span><strong>Not saved.</strong> The platform could not reach the "
         "server (Failed to fetch).</span>"
         "<span>Your change is still on screen and the platform keeps trying. "
         "If it does not clear, reload before typing anything else — what "
         "is on screen has not reached the database.</span>")

# ── AND THE TWO SENTENCES RUN INTO EACH OTHER TODAY ──────────────────────
# `.banner.refused` is `display:block` (it overrides `.banner`'s flex, which
# carried the 10px gap), and `showFailed()` concatenates `</span><span>` with
# no whitespace between them — so every failure the platform has ever reported
# reads "(Failed to fetch).Your change is still on screen". It is in Islam's
# own screenshot. The advice is a second line here, which is the shape the
# banner already implies: what happened, then what to do.
WHY = '<span class="nsy" style="display:block;margin-top:3px">'

# A — the plain voice §230.2 settled for the boot wall: no "server", no
# "database", short lines, and the advice REVERSED, because telling somebody
# offline to reload is telling them to throw the work away.
OFFLINE_A = ("<span><strong>You are offline — not saved yet.</strong></span>"
             + WHY + "Your work is safe on screen. It will save by itself the "
             "moment you are back online. Do not reload while you are "
             "offline.</span>")

# B — the same fact in the banner's existing fuller voice, keeping the words
# the other two failures use.
OFFLINE_B = ("<span><strong>Not saved — you are offline.</strong></span>"
             + WHY + "Your change is still on screen and will be sent as soon "
             "as you are back online. Do not reload while you are offline — "
             "what is on screen has not reached the database yet.</span>")

# The other two ways a save fails, so the set is seen together. The server's
# own status stays (§171: a number is not jargon to the one person who can act
# on it); what goes is the browser's `Failed to fetch`, which names nothing.
UNREACHED = ("<span><strong>Not saved.</strong> The platform reached the "
             "internet but the server did not answer.</span>"
             + WHY + "Your change is still on screen and the platform keeps "
             "trying. If it does not clear, reload before typing anything else "
             "— what is on screen has not reached the database.</span>")

SERVER = ("<span><strong>Not saved.</strong> The server answered HTTP 500."
          "</span>"
          + WHY + "Your change is still on screen and the platform keeps "
          "trying. If it does not clear, reload before typing anything else "
          "— what is on screen has not reached the database.</span>")

SHOTS = [("today-offline", TODAY), ("offline-a", OFFLINE_A),
         ("offline-b", OFFLINE_B), ("unreached", UNREACHED), ("server", SERVER)]

SHOW = """(html) => {
  const el = document.getElementById('refused');
  if (!el) return false;
  el.innerHTML = html;
  el.hidden = false;
  return true;
}"""

with sync_playwright() as p:
    br = p.chromium.launch()
    for theme in ("light", "dark"):
        # 1000px is Islam's own laptop (§27.1's sweep exists because of it), and
        # a banner shot at 2x is read at true size in the mockup rather than
        # scaled down until the sentence being decided is unreadable.
        pg = br.new_page(viewport={"width": 1000, "height": 800},
                         device_scale_factor=2)
        pg.goto(FILE.as_uri())
        pg.wait_for_timeout(400)
        pg.evaluate("(t) => document.documentElement.setAttribute('data-theme', t)",
                    theme)
        for name, html in SHOTS:
            if not pg.evaluate(SHOW, html):
                print("  MISSING #refused")
                break
            pg.wait_for_timeout(80)
            el = pg.query_selector("#refused")
            el.screenshot(path=str(OUT / ("%s-%s.png" % (name, theme))))
            print("  wrote %s-%s.png" % (name, theme))
        pg.close()
    br.close()

# ── AND THE PAGE IS ASSEMBLED FROM THEM ──────────────────────────────────
# The mockup is ONE self-contained file with the shots inlined, because that is
# what gets published and what stays in `design-mockups/` as the record. The
# template beside it holds the words; this only fills in the pictures, so a
# reworded mockup is a template edit and one command.
TPL = OUT.parent / "_page.html"
PAGE = OUT.parent / "2026-09-02_offline-banner.html"
html = TPL.read_text()
for png in sorted(OUT.glob("*.png")):
    uri = "data:image/png;base64," + base64.b64encode(png.read_bytes()).decode()
    html = html.replace("{{%s}}" % png.stem, uri)
if "{{" in html:
    raise SystemExit("a shot the page asks for was never taken: " +
                     html[html.index("{{"):][:40])
PAGE.write_text(html)
print("  wrote %s (%d KB)" % (PAGE.name, len(html) // 1024))
