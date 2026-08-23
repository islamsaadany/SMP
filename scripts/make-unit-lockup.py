#!/usr/bin/env python3
"""Draw a RAYA sub-brand lockup in the client's own construction.

The seven lockups Raya supplied cover seven subsidiaries; SMP has business
units they do not name, so a few have to be DRAWN. Nothing here is invented:
the RAYA wordmark and its flag are the client's own vector artwork lifted from
their brand manual, the name is set in the manual's own headline face
(JetBrains Mono Regular; the manual embeds only a 36-glyph subset with no
digits at all, so the full open-licensed release is used and PROVED to be the
same drawing by the check below), and
every measurement is taken off a supplied lockup rather than eyeballed:

    wordmark            x 0        .. 56.72     (its own artwork)
    rule                x 62.91,   0.424 wide, from 7.63 above the wordmark
                        top down to its baseline
    name                x 68.575,  JetBrains Mono Regular at 10pt,
                        letter-spacing 0.9pt (advance 6.9 against the face's
                        own 6.0), baseline 4.35 above the wordmark's foot
    ink                 #001780 wordmark and name, #225FAC flag, rule stroked

The generator is checked by REDRAWING A SUPPLIED LOCKUP and diffing it against
the real one — a construction that cannot reproduce RETAIL has no business
drawing CORPORATE.
"""
import re, sys, os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
UNITS = os.path.join(ROOT, "clients/raya-trade/brand/units")
FONT = os.path.join(ROOT, "clients/raya-trade/brand/JetBrainsMono-Regular.ttf")
SOURCE = os.path.join(UNITS, "logo-retail.svg")   # any supplied one; the wordmark is identical

SIZE, ADVANCE, LEAD = 10.0, 6.9, 9.83
X_TEXT = 68.575
WORD_BOTTOM = 171.81 - 142.93
INK, FLAG = "#001780", "#225fac"

# Measured off the supplied artwork, not derived from a formula: a single-line
# name sits 4.35 above the wordmark's foot (RETAIL), and a two-line one
# straddles it at 9.783 above and 0.047 below (SMART CARE). Anything longer
# keeps the same 9.83 lead centred on the two-line midpoint.
def baselines(n):
    if n == 1: return [WORD_BOTTOM - 4.35]
    mid = WORD_BOTTOM - 4.868
    return [mid + (i - (n - 1) / 2.0) * LEAD for i in range(n)]


def wordmark():
    """The RAYA wordmark, its flag and the rule, straight from a supplied file."""
    s = open(SOURCE).read()
    body = s[s.index("</defs>") + 7:]
    els = re.findall(r"<(?:use|path)\b[^>]*/>", body)
    return ([e for e in els if e.startswith("<path") and 'fill="%s"' % INK in e],
            [e for e in els if 'fill="%s"' % FLAG in e],
            [e for e in els if "stroke=" in e])


def glyph_paths(lines):
    """The name as outlines, so the file needs no font to render it."""
    f = TTFont(FONT)
    gs, upem = f.getGlyphSet(), f["head"].unitsPerEm
    cmap, k = f.getBestCmap(), SIZE / f["head"].unitsPerEm
    out, right, ys = [], X_TEXT, baselines(len(lines))
    for line, y in zip(lines, ys):
        x = X_TEXT
        for ch in line:
            gname = cmap.get(ord(ch))
            if gname is None:
                raise SystemExit("the face has no glyph for %r" % ch)
            pen = SVGPathPen(gs)
            gs[gname].draw(pen)
            d = pen.getCommands()
            # A SUBSET MAPS MORE THAN IT DRAWS. The manual's embedded font
            # carries a cmap entry for every ASCII character and an OUTLINE for
            # only 36 of them - no digits at all - so "B2B" came out as "B B"
            # and nothing complained. A space is the one character allowed to
            # draw nothing; anything else missing is an error, loudly.
            if not d and ch != " ":
                raise SystemExit("the face has no OUTLINE for %r - it is a subset" % ch)
            if d:
                out.append('<path transform="matrix(%g,0,0,%g,%g,%g)" d="%s" fill="%s"/>'
                           % (k, -k, x, y, d, INK))
            x += ADVANCE
        right = max(right, x - ADVANCE + SIZE * 0.6)
    return out, right


def build(name, slug, label):
    """`name` may carry a newline: a two-word name is set on two lines, which
    is how the supplied SMART CARE lockup does it."""
    marks, flag, rule = wordmark()
    glyphs, right = glyph_paths(name.split("\n"))
    w = round(right + 1.0, 2)     # the same 1-unit pad the supplied files carry
    h = 30.88                                    # every supplied lockup is this tall
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" version="1.1" '
           'viewBox="0 0 %s %s" role="img" aria-label="%s">\n<title>%s</title>\n'
           % (w, h, label, label))
    svg += "".join("  " + e + "\n" for e in marks + flag + rule + glyphs)
    svg += "</svg>\n"
    path = os.path.join(UNITS, "logo-%s.svg" % slug)
    open(path, "w").write(svg)
    return path, w


if __name__ == "__main__":
    if len(sys.argv) != 4:
        raise SystemExit("usage: make-unit-lockup.py <TEXT> <slug> <label>")
    p, w = build(sys.argv[1], sys.argv[2], sys.argv[3])
    print("wrote %s (%.2f wide)" % (p, w))
