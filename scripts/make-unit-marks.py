#!/usr/bin/env python3
"""Render the unit lockups to the transparent PNGs the platform stores.

The platform holds a unit's mark as a PNG data URI (§52.9) — PNG because an
uploaded SVG is executable content, and a rule the SMO must obey is a rule the
demo data obeys too. This turns the vector lockups in clients/raya-trade/ into
exactly what an upload would have produced, so the baked demo marks and an
uploaded one are the same kind of thing.

TRANSPARENT, deliberately: `omit_background`. A mark with a ground baked in
paints a rectangle around itself on a dark slide, which is the whole reason the
JPEGs Raya supplied could not be used.

900px on the long edge, matching LOGO_MAX_EDGE in config-data.js — the cover
mark on a 4K projector, and no more.

Writes clients/raya-trade/brand/unit-marks.json - client material and a build
input, NOT db/, which vercel.json bundles into the serverless function.
"""
import base64, io, json, os, re, sys
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UNITS = os.path.join(ROOT, "clients/raya-trade/brand/units")
OUT = os.path.join(ROOT, "clients/raya-trade/brand/unit-marks.json")
MAX_EDGE = 900
CHROME = os.environ.get("CHROME", "/opt/pw-browsers/chromium-1194/chrome-linux/chrome")


def render(slugs):
    marks = {}
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME)
        for slug in slugs:
            f = os.path.join(UNITS, "logo-%s.svg" % slug)
            vb = [float(x) for x in re.search(r'viewBox="([^"]+)"', open(f).read()).group(1).split()]
            w = MAX_EDGE
            h = max(1, round(w * vb[3] / vb[2]))
            # A REAL file:// PAGE, never set_content(). set_content serves from
            # about:blank, and Chromium refuses a file:// subresource there —
            # so every mark came back as the broken-image icon, all ten within
            # 200 bytes of each other and none of them a logo. It cost nothing
            # to spot and would have cost everything to ship, so the ink is
            # counted below rather than trusted.
            host = os.path.join(UNITS, "_render.html")
            open(host, "w").write('<body style="margin:0"><img src="logo-%s.svg" '
                                  'style="display:block;width:%dpx;height:%dpx">' % (slug, w, h))
            pg = b.new_context(viewport={"width": w, "height": h}).new_page()
            pg.goto("file://" + host)
            pg.wait_for_selector("img")
            pg.wait_for_timeout(300)
            png = pg.screenshot(omit_background=True)
            os.remove(host)

            im = Image.open(io.BytesIO(png)).convert("RGBA")
            ink = sum(1 for px in im.getdata() if px[3] > 8)
            share = ink / float(im.width * im.height)
            if share < 0.05:
                raise SystemExit("%s rendered only %.2f%% ink — that is a blank or a "
                                 "broken image, not a lockup" % (slug, share * 100))
            marks[slug] = "data:image/png;base64," + base64.b64encode(png).decode()
            print("  %-13s %4dx%-4d %6.1f KB  ink %.1f%%"
                  % (slug, w, h, len(marks[slug]) / 1024, share * 100))
            pg.context.close()
        b.close()
    return marks


if __name__ == "__main__":
    slugs = sys.argv[1:] or sorted(
        f[5:-4] for f in os.listdir(UNITS) if f.startswith("logo-") and f.endswith(".svg"))
    print("rendering %d lockups at %dpx" % (len(slugs), MAX_EDGE))
    marks = render(slugs)
    json.dump(marks, open(OUT, "w"), indent=0, sort_keys=True)
    print("wrote %s (%.1f KB)" % (OUT, os.path.getsize(OUT) / 1024))
