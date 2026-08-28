"""TWO FACES, AND ONLY TWO (§147).

Islam, closing §38.7's open comparison: *"let's make the 2 fonts available are
the system font and the source san3."* Four faces had ridden in every build so
they could be judged in the real product; three now leave the file.

WHAT THIS ASSERTS — the promise, not the implementation:
  1. The switch offers exactly two, and cycles between them.
  2. Both actually WORK: choosing Source Sans 3 really changes the face the
     page renders in (measured by the width of a real string, since a font
     that failed to decode would leave the metrics of the system stack).
  3. THE FACE IS IN THE FILE, not fetched: the built platform opens from a
     memory stick with no network, so an embedded face must be a data: URI
     and there must be no external font request at all.
  4. THE THREE THAT LEFT ARE GONE — from the switch, from the stylesheet and
     from the file's bytes (§24: a rule for a face the product no longer
     carries is worse than no rule, because nothing tells the next reader it
     is dead).
  5. A BROWSER THAT REMEMBERS A REMOVED FACE IS NOT STRANDED: a stored
     "manrope" lands on the system stack and the switch still works, rather
     than leaving an attribute no stylesheet answers (§30.2's shape).

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

    offered = pg.evaluate("() => (typeof THEME !== 'undefined' && THEME.font) ? true : false")
    ck("the theme module is there", offered)

    # The switch itself: two names, and pressing it returns to where it began.
    seen = pg.evaluate("""() => {
      var b = document.getElementById('fontbtn');
      if (!b) return {none:true};
      var out = [], guard = 0;
      var first = b.textContent.trim();
      do { out.push(b.textContent.trim()); b.click(); guard++; }
      while (b.textContent.trim() !== first && guard < 8);
      return {names: out};
    }""")
    ck("the switch exists", not seen.get("none"), seen)
    names = seen.get("names", [])
    ck("it offers exactly two faces", len(names) == 2, names)
    ck("and they are the two agreed",
       sorted(n.lower() for n in names) == ["source sans", "system"], names)

    # Both are real: the rendered metrics must differ, or the embedded face
    # never decoded and the switch is decoration.
    #
    # AN EMBEDDED FACE IS STILL LOADED LAZILY, AND THE FIRST VERSION OF THIS
    # ASSERTION REPORTED A CORRECT BUILD BROKEN. A data: URI removes the
    # network and not the asynchrony: the face sits `unloaded` until something
    # asks for it, `font-display:swap` paints the fallback meanwhile, and a
    # width measured in the same frame as the attribute is set is therefore
    # the SYSTEM stack's width under the right family name — identical
    # numbers, correct `font-family`, and a green-looking product called
    # broken. `await document.fonts.load()` first, and assert the load
    # SUCCEEDED as its own fact, or a face that never decodes would leave two
    # equal widths and no explanation of why.
    widths = pg.evaluate("""async () => {
      var out = {};
      document.documentElement.setAttribute('data-font', 'source');
      try { await document.fonts.load('32px "Source Sans 3"'); } catch (e) {}
      await document.fonts.ready;
      out.decoded = document.fonts.check('32px "Source Sans 3"');
      var s = document.createElement('span');
      s.style.cssText = 'position:absolute;visibility:hidden;font-size:32px;font-family:var(--sans)';
      s.textContent = 'Handgloves 0123';
      document.body.appendChild(s);
      out.source = Math.round(s.getBoundingClientRect().width * 100) / 100;
      out.family = getComputedStyle(s).fontFamily;
      document.documentElement.removeAttribute('data-font');
      out.system = Math.round(s.getBoundingClientRect().width * 100) / 100;
      s.remove();
      return out;
    }""")
    ck("the embedded face decodes (it is in the file, not merely named)",
       widths.get("decoded"), widths)
    ck("Source Sans 3 actually renders (its metrics differ from the system stack)",
       widths.get("system") != widths.get("source"), widths)
    ck("...and it is the family the page asks for",
       "Source Sans 3" in (widths.get("family") or ""), widths.get("family"))

    # A remembered face that no longer exists must not strand anybody.
    pg.evaluate("localStorage.setItem('smp.font','manrope')")
    pg.reload()
    pg.wait_for_timeout(900)
    after = pg.evaluate("""() => ({
      attr: document.documentElement.getAttribute('data-font'),
      label: (document.getElementById('fontbtn')||{}).textContent,
      family: getComputedStyle(document.body).fontFamily
    })""")
    ck("a remembered Manrope falls back to the system stack",
       after.get("attr") in (None, ""), after)
    ck("...and the switch still names a face it has",
       (after.get("label") or "").strip().lower() in ("system", "source sans"), after)
    ck("...and nothing asks for Manrope",
       "Manrope" not in (after.get("family") or ""), after)

    ck("no page errors while driving", not errs, errs[:2])
    b.close()

print("typeface: %s" % ("OK" if bad == 0 else "%d FAILURES" % bad))
raise SystemExit(1 if bad else 0)
