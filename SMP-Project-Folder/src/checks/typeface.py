"""ONE FACE, AND NO SWITCH (§401; was TWO FACES, §157).

Islam, closing §38.7's open comparison: *"let's make the 2 fonts available are
the system font and the source san3."* Four faces had ridden in every build so
they could be judged in the real product; three now leave the file.

WHAT THIS ASSERTS — the promise, not the implementation:
  1. There is no switch (§401: "remove the font button and keep the font
     source sans across the platform").
  2. Source Sans 3 is what the page renders in with nobody having chosen,
     measured by the width of a real string, since a font that failed to
     decode would leave the metrics of the system stack.
  3. THE FACE IS IN THE FILE, not fetched: the built platform opens from a
     memory stick with no network, so an embedded face must be a data: URI
     and there must be no external font request at all.
  4. THE THREE THAT LEFT ARE GONE — from the switch, from the stylesheet and
     from the file's bytes (§24: a rule for a face the product no longer
     carries is worse than no rule, because nothing tells the next reader it
     is dead).
  5. A BROWSER THAT REMEMBERS A CHOICE IS NOT STRANDED: whatever is stored
     under the old key is cleared on load and the page is in Source Sans
     (§41.6's shape).

Run: SMP_CHROME=... python3 qa-run.py checks/typeface.py
"""
import pathlib, re
from playwright.sync_api import sync_playwright

BUILT = pathlib.Path("strategy-management-platform.html")
url = "file://" + str(BUILT.resolve())
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


# ── the bytes, before any browser opens them
raw = BUILT.read_text(errors="ignore")
ck("Source Sans 3 is embedded as a data: URI",
   "font-family:'Source Sans 3'" in raw and "data:font/woff2;base64" in raw)
# THE ATTRIBUTE KEY IS NOT THE FAMILY NAME, AND THE FIRST VERSION OF THIS LOOP
# DERIVED ONE FROM THE OTHER — `"IBM Plex Sans".split()[0]` is `ibm`, and the
# selector was always `[data-font="plex"]`, so that one assertion looked for a
# string the product had never held and passed on the build it was written to
# reject (§94.5). The pair is written out.
for gone, key in (("Inter", "inter"), ("Manrope", "manrope"), ("IBM Plex Sans", "plex")):
    ck("no @font-face for %s" % gone,
       ("font-family:'%s'" % gone) not in raw)
    ck("no stylesheet block for %s" % gone,
       ('data-font="%s"' % key) not in raw)
ck("no external font is fetched",
   "fonts.googleapis" not in raw and "fonts.gstatic" not in raw)

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1280, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    # A NETWORK THAT REFUSES EVERYTHING, because "opens from a memory stick"
    # is the promise and a face quietly fetched would still render here.
    pg.route("http://**", lambda r: r.abort())
    pg.route("https://**", lambda r: r.abort())
    pg.goto(url)
    pg.wait_for_timeout(900)

    # ── ONE FACE, NO SWITCH (§401) ─────────────────────────────────────
    # Islam: "remove the font button and keep the font source sans across the
    # platform." REWRITTEN, NEVER LOOSENED (§218): the switch assertions of
    # §157 invert into its absence, and the face is asserted as what the page
    # renders WITH NOBODY HAVING CHOSEN — BOTH ENDS (§94.2): the control gone
    # AND the face in force, or a build that dropped the button and left the
    # system stack passes the first half.
    ck("there is no typeface switch in the bar",
       pg.locator("#fontbtn, .fontbtn").count() == 0)

    # AN EMBEDDED FACE IS STILL LOADED LAZILY (a data: URI removes the network,
    # not the asynchrony), so it is loaded and asked for first, and the
    # decoding asserted as its own fact.
    def measure():
        return pg.evaluate("""async () => {
          var out = {};
          try { await document.fonts.load('32px "Source Sans 3"'); } catch (e) {}
          await document.fonts.ready;
          out.decoded = document.fonts.check('32px "Source Sans 3"');
          out.attr = document.documentElement.getAttribute('data-font');
          out.body = getComputedStyle(document.body).fontFamily;
          var s = document.createElement('span');
          s.style.cssText = 'position:absolute;visibility:hidden;font-size:32px;font-family:var(--sans)';
          s.textContent = 'Handgloves 0123';
          document.body.appendChild(s);
          out.page = Math.round(s.getBoundingClientRect().width * 100) / 100;
          s.style.fontFamily = 'var(--sys-sans)';
          out.system = Math.round(s.getBoundingClientRect().width * 100) / 100;
          s.remove();
          return out;
        }""")
    w = measure()
    ck("the embedded face decodes (it is in the file, not merely named)", w.get("decoded"), w)
    ck("the page's own family is Source Sans 3, with no attribute set",
       w.get("body", "").startswith('"Source Sans 3"') and not w.get("attr"), w)
    ck("...and it actually renders (its metrics differ from the system stack)",
       w.get("page") != w.get("system"), w)

    # A CHOICE LEFT IN A BROWSER FROM THE SWITCH'S DAYS strands nobody: the key
    # is cleared and the face is Source Sans whatever was stored (§41.6).
    for stored in ("system", "manrope"):
        pg.evaluate("localStorage.setItem('smp.font', %r)" % stored)
        pg.reload()
        pg.wait_for_timeout(900)
        w = measure()
        key = pg.evaluate("localStorage.getItem('smp.font')")
        ck("a remembered %r is cleared on load" % stored, key is None, key)
        ck("...and the page is still in Source Sans 3",
           w.get("body", "").startswith('"Source Sans 3"') and not w.get("attr"), w)

    ck("no page errors while driving", not errs, errs[:2])
    b.close()

print("typeface: %s" % ("OK" if bad == 0 else "%d FAILURES" % bad))
raise SystemExit(1 if bad else 0)
