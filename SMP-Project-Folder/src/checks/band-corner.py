"""The pinned title's corners show the page, not the page behind it (§129.3).

MEASURED IN PIXELS, AND THAT IS NOT A PREFERENCE. §53.7 wrote the rule down
when the strip ABOVE this band was fixed: `elementFromPoint` returns an
element and a `::before` is not one, so a DOM probe calls the broken build
clean. The same is true of the two corners — the fault is a colour showing in a
place, and nothing but the colour in that place answers it.

WHAT IT ASSERTS IS THE PROBLEM, NOT THE MECHANISM (§94.8): inside the 8px
corner box at each top corner of the band, none of what is behind the band may
show through. That stays true if the fill is one day replaced by squaring the
corners, and it fails the moment either is removed.

BOTH POSITIONS, AND THEY WANT OPPOSITE THINGS (§129.6). Pinned, the notch must
be the page's own ground and nothing behind it. AT REST it must be the card's
rounded corner, border arc and all — the first build filled both, because CSS
cannot ask whether a sticky element is pinned, and Islam looked at the result:
*"the corner still has this squared corner."* So the rest assertion is written
POSITIVELY, as the thing that has to be there, and it fails on that build.

AND IT WATCHES FOR A THROW. The one thing CSS cannot ask is answered by an
observer re-armed at the end of paint() — and the first version of that was
declared inside wire(), so `paint()` threw on `pinWatch is not defined` every
time, silently, with the page still on screen (§118). A page-error listener is
part of this check for that reason.

NO DEPENDENCY. Playwright hands back a PNG and the suite has never needed an
image library; `zlib` and forty lines of unfiltering read an 18-pixel square
without adding one, which is cheaper than asking every laptop that runs these
checks to install Pillow.

Run: SMP_CHROME=... python3 qa-run.py checks/band-corner.py
"""
import pathlib, struct, zlib
from playwright.sync_api import sync_playwright

URL = "file://" + str(pathlib.Path(
    pathlib.Path(__file__).resolve().parent.parent,
    "strategy-management-platform.html").resolve())

fails = []
errs = []


def ck(name, ok, extra=""):
    print(("  ok   " if ok else "  FAIL ") + name + ((" — " + str(extra)) if extra else ""))
    if not ok:
        fails.append(name)


def png_pixels(data):
    """(width, height, [(r,g,b), …]) from a non-interlaced 8-bit PNG."""
    assert data[:8] == b"\x89PNG\r\n\x1a\n", "not a PNG"
    i, idat, w, h, ch = 8, b"", 0, 0, 0
    while i < len(data):
        ln = struct.unpack(">I", data[i:i + 4])[0]
        kind = data[i + 4:i + 8]
        body = data[i + 8:i + 8 + ln]
        if kind == b"IHDR":
            w, h, depth, colour, _, _, interlace = struct.unpack(">IIBBBBB", body)
            assert depth == 8 and interlace == 0, "unexpected PNG shape"
            ch = {0: 1, 2: 3, 4: 2, 6: 4}[colour]
        elif kind == b"IDAT":
            idat += body
        elif kind == b"IEND":
            break
        i += 12 + ln
    raw = zlib.decompress(idat)
    out, prev, pos, stride = [], bytearray(w * ch), 0, w * ch
    for _ in range(h):
        f = raw[pos]; pos += 1
        line = bytearray(raw[pos:pos + stride]); pos += stride
        for x in range(stride):
            a = line[x - ch] if x >= ch else 0
            bb = prev[x]
            c = prev[x - ch] if x >= ch else 0
            if f == 1:   line[x] = (line[x] + a) & 255
            elif f == 2: line[x] = (line[x] + bb) & 255
            elif f == 3: line[x] = (line[x] + (a + bb) // 2) & 255
            elif f == 4:
                p = a + bb - c
                pa, pb, pc = abs(p - a), abs(p - bb), abs(p - c)
                pr = a if (pa <= pb and pa <= pc) else (bb if pb <= pc else c)
                line[x] = (line[x] + pr) & 255
        prev = line
        for x in range(w):
            out.append((line[x * ch], line[x * ch + 1], line[x * ch + 2]) if ch >= 3
                       else (line[x], line[x], line[x]))
    return w, h, out


def rgb(css):
    n = [int(v) for v in css.replace("rgba(", "").replace("rgb(", "")
         .rstrip(")").split(",")[:3]]
    return tuple(n)


def near(a, b, tol=5):
    return all(abs(x - y) <= tol for x, y in zip(a, b))


def notch_pixels(pg, scale, side):
    """The pixels DEEP INSIDE one top corner's notch — the wedge outside the
    band's own rounded corner, where what is behind it used to show.

    A MARGIN OFF THE ARC, and it is the difference between a check and a false
    alarm. The first version sampled the whole 8px corner box and asked whether
    any pixel matched the card's surface: green in light, and two failures in
    dark on a build that is correct — because in the dark palette `--surface`
    sits BETWEEN `--ground` and `--surface-2`, so an antialiased pixel where the
    fill meets the band's grey lands on it by arithmetic. Sampling a pixel and
    reading it against a colour it can be blended into is not a measurement
    (§68.10: a correct build reported broken costs what a broken one reported
    clean costs). One pixel of clearance from the arc removes every blend."""
    d = pg.evaluate("""()=>{const b=document.querySelector('.pane > .pband');
      const r=b.getBoundingClientRect();
      const rad=parseFloat(getComputedStyle(b).borderTopLeftRadius)||8;
      return {top:r.top,left:r.left,width:r.width,rad:rad};}""")
    rad = d["rad"]
    x = d["left"] if side == "left" else d["left"] + d["width"] - rad
    shot = pg.screenshot(clip={"x": x, "y": d["top"], "width": rad, "height": rad})
    w, h, px = png_pixels(shot)
    cx = rad * scale if side == "left" else 0.0
    cy = rad * scale
    keep, lim = [], (rad + 1) * scale
    for row in range(h):
        for col in range(w):
            dx, dy = (col + .5) - cx, (row + .5) - cy
            if (dx * dx + dy * dy) ** .5 > lim:
                keep.append(px[row * w + col])
    return keep


with sync_playwright() as p:
    b = p.chromium.launch()
    for theme in ("light", "dark"):
        pg = b.new_page(viewport={"width": 1400, "height": 620}, device_scale_factor=2)
        pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))
        pg.on("console", lambda m: errs.append("CONSOLE: " + m.text)
              if m.type == "error" else None)
        pg.goto(URL); pg.wait_for_timeout(900)
        if theme == "dark":
            pg.evaluate("document.documentElement.setAttribute('data-theme','dark')")
            pg.wait_for_timeout(250)
        pg.select_option("#asWho", "smo"); pg.wait_for_timeout(400)
        el = pg.query_selector('#units [data-u="mobile"]')
        if not (el and el.is_visible()):
            sw = pg.query_selector("#units .navswitch .nsw:not(.on)")
            if sw:
                sw.click(); pg.wait_for_timeout(250)
        pg.click('#units [data-u="mobile"]'); pg.wait_for_timeout(350)
        pg.click('#secrow-in [data-sub2="plan"]'); pg.wait_for_timeout(350)

        tok = pg.evaluate("""()=>{const cs=getComputedStyle(document.documentElement);
          const rd=n=>{const d=document.createElement('div');d.style.color='var('+n+')';
            document.body.appendChild(d);const v=getComputedStyle(d).color;d.remove();return v;};
          return {ground:rd('--ground'), surface:rd('--surface')};}""")
        ground, surface = rgb(tok["ground"]), rgb(tok["surface"])
        print("\n%s · ground %s · surface %s" % (theme, ground, surface))
        ck("[%s] the page's ground and the card's surface are different colours" % theme,
           not near(ground, surface), (ground, surface))

        for state, y in (("at rest", 0), ("pinned", 420)):
            pg.evaluate("window.scrollTo(0,%d)" % y); pg.wait_for_timeout(400)
            where = pg.evaluate("""()=>{const b=document.querySelector('.pane > .pband');
              return {slid: b.getBoundingClientRect().top -
                            b.parentElement.getBoundingClientRect().top > 2,
                      says: b.classList.contains('pinned')};}""")
            # THE BAND HAS TO AGREE WITH ITSELF: where it actually is, and what
            # it says about where it is. An observer that quietly stopped firing
            # leaves the second false while the first is true.
            ck("[%s] %s: the band says where it is" % (theme, state),
               where["says"] == where["slid"], where)
            for side in ("left", "right"):
                px = notch_pixels(pg, 2, side)
                ck("[%s] %s, %s corner: there is a notch to measure"
                   % (theme, state, side), len(px) >= 12, len(px))
                if state == "pinned":
                    wrong = [c for c in px if not near(c, ground)]
                    ck("[%s] pinned, %s corner: the page's own ground, and nothing behind it"
                       % (theme, side), not wrong,
                       "%d of %d notch pixels are not the ground: %s"
                       % (len(wrong), len(px), sorted(set(wrong))[:4]))
                else:
                    # AT REST THE CARD KEEPS ITS CORNER. Written as what must be
                    # PRESENT — the border arc drawn through the notch — because
                    # the build this replaced covered it with ground and every
                    # "nothing shows through" assertion passed on it.
                    # NOT "near the border colour": in light, `--line` and
                    # `--ground` are within 31 of each other, so a tolerance
                    # loose enough to catch the antialiased arc also matches
                    # the ground it is drawn on — the same trap the notch
                    # sampling above already fell into once (§68.10). Asked as
                    # the INVERSE: at rest the notch cannot be all ground.
                    ink = [c for c in px if not near(c, ground, 10)]
                    ck("[%s] at rest, %s corner: the card's own corner is still drawn"
                       % (theme, side), len(ink) >= 3,
                       "%d of %d notch pixels are something other than the page"
                       % (len(ink), len(px)))

        # The fill must not become a lid over the control it sits beside: the
        # pen is in the same corner of the same pane (§93.4, §70). Measured AT
        # REST, because `.paneact` is absolute inside the pane and scrolls away
        # with it — asking at a scroll where the pen is off screen measures
        # nothing and reports it as a failure (§68's three checks, in reverse).
        pg.evaluate("window.scrollTo(0,0)"); pg.wait_for_timeout(300)
        if pg.query_selector(".pane .paneact .penbtn"):
            hit = pg.evaluate("""()=>{const b=document.querySelector('.pane .paneact .penbtn');
              const r=b.getBoundingClientRect();
              if (r.bottom<0||r.top>innerHeight) return "off screen";
              const at=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2);
              return !at ? "nothing there" : (at===b||b.contains(at)||at.contains(b));}""")
            ck("[%s] the pen beside it is still what a click reaches" % theme,
               hit is True, hit)
        ck("[%s] no console errors, and paint() did not throw" % theme, not errs, errs[:3])
        pg.close()
    b.close()

print("\n" + ("FAILED: " + ", ".join(fails) if fails else "all band-corner checks passed"))
raise SystemExit(1 if fails else 0)
