# ── A PICTURE SLIDE CAN TRAVEL THE WHOLE DECK (§235) ─────────────────────
# Islam: "the rearrange of slides doesn't move around the fixed slides of the
# main flow", and, of the gap inside a pillar: "the slide can be set between
# the measures and tactics because that's a valid place to be."
#
# The fault this exists to catch: a stored position is an ANCHOR plus a place
# among that anchor's own slides (§50.3), and the arrows stepped blindly one
# row — so wherever the next row was unanchored the press recomputed the same
# position and repainted in place: a button that does nothing, silently.
# Measured on the pre-§235 build: 25 dead presses of 28 walking Mobile's deck.
#
# So this walks a slide DOWN the whole deck and UP again, on a unit AND a
# function (§53.5), and asserts THE PROBLEM, not a layout (§94.8):
#   - no press is silent until the floor (the slide before Thank you);
#   - the walk parks between a pillar's measures and tactics (his ruling),
#     and between a project's deliverables and milestones on the function;
#   - what is stored survives a repaint (the position is real, not painted);
#   - the fixed slides' own order never changes;
#   - the floor and the ceiling stop the walk rather than wrapping.
import os, sys
from playwright.sync_api import sync_playwright

FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..",
  "..", "strategy-management-platform-v3.22.html"))
fails = []
def ok(name, cond, extra=""):
    print(("ok   " if cond else "FAIL ") + name + ("" if cond else " — " + str(extra)))
    if not cond: fails.append(name)

def rail(pg):
    return pg.evaluate("""[].map.call(
      document.querySelectorAll('#slidelist [data-slgo]'), r=>r.dataset.slgo)""")

def pos(pg):
    for i, k in enumerate(rail(pg)):
        if k.startswith("ps:"): return i
    return -1

# The assembled deck's shape, read the way the editor reads it — data-split
# marks the two halves of a pillar (…M / …T) and of a project (…D / …M).
def shape(pg):
    return pg.evaluate("""() => {
      const box = slidesAssemble();
      return [].map.call(box.querySelectorAll('.dslide'), el => ({
        ed: el.dataset.ed, ps: !!el.getAttribute('data-ps'),
        split: el.getAttribute('data-split') || '',
        anchor: el.dataset.anchor || '' }));
    }""")

def walk(pg, side):
    # add a slide after the cover
    rows = pg.query_selector_all("#slidelist [data-slgo]")
    rows[0].click(); pg.wait_for_timeout(150)
    pg.click("#slidelist [data-sladd]"); pg.wait_for_timeout(250)
    ok(side + ": the new slide sits after the cover", pos(pg) == 1, pos(pg))
    gen_before = [k for k in rail(pg) if not k.startswith("ps:")]

    n = len(rail(pg))
    trail = [pos(pg)]
    for _ in range(n + 5):
        b = pg.query_selector("[data-slmove='1']")
        if not b: break
        b.click(); pg.wait_for_timeout(180)
        p = pos(pg)
        if p == trail[-1]: break          # the floor — or a dead press
        trail.append(p)
    ok(side + ": every press until the floor moved the slide",
       all(b > a for a, b in zip(trail, trail[1:])) and len(trail) > 3, trail)
    ok(side + ": the walk reaches the slide before Thank you",
       trail[-1] == len(rail(pg)) - 2, (trail[-1], len(rail(pg)) - 2))

    # the ruling: somewhere on the way it parked INSIDE a subject's pair —
    # after the …M/…D half, before the …T/…M half of the same code. With the
    # ps slide at rail index p, the fixed slides (whose order never changes)
    # sit at every other index in order: fixed[p-1] above it, fixed[p] below.
    fixed = [s for s in shape(pg) if not s["ps"]]
    def half(s): return s["split"][:-1] if s["split"] else None
    inside = False
    for p in trail:
        a = fixed[p - 1] if 0 < p <= len(fixed) else None
        b = fixed[p] if p < len(fixed) else None
        if a and b and a["split"] and b["split"] and half(a) == half(b):
            inside = True; break
    ok(side + ": it parked between the two halves of one subject "
       "(measures→tactics / deliverables→milestones)", inside,
       [(s["split"], s["anchor"]) for s in fixed])

    # what is stored is real: a full repaint keeps the position
    last = pos(pg)
    pg.evaluate("slidesPaint()"); pg.wait_for_timeout(200)
    ok(side + ": the position survives a repaint", pos(pg) == last, (last, pos(pg)))

    # the fixed slides' own order never moved
    gen_after = [k for k in rail(pg) if not k.startswith("ps:")]
    ok(side + ": the fixed flow is untouched", gen_before == gen_after)

    # and back up: every press moves until the ceiling (after the cover)
    up = [pos(pg)]
    for _ in range(n + 5):
        b = pg.query_selector("[data-slmove='-1']")
        if not b: break
        b.click(); pg.wait_for_timeout(180)
        p = pos(pg)
        if p == up[-1]: break
        up.append(p)
    ok(side + ": the walk climbs back to just after the cover",
       up[-1] == 1 and all(b < a for a, b in zip(up, up[1:])), up)

    # tidy: remove it, and the store forgets the container (§50.6)
    pg.click("[data-picdel]"); pg.wait_for_timeout(250)
    ok(side + ": removing the slide empties the store",
       pg.evaluate("!(REVIEW.slides && REVIEW.slides['%s'])" %
                   ("fn:" + FN[0] if side == "function" else "mobile")))

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1')}catch(e){}")
    pg.goto("file://" + FILE); pg.wait_for_timeout(600)

    # §1 — a unit's deck
    pg.evaluate("slidesOpen('u','mobile')"); pg.wait_for_timeout(400)
    FN = [None]
    walk(pg, "unit")
    pg.evaluate("slidesClose()"); pg.wait_for_timeout(200)

    # §2 — a function's deck: the first function with capabilities behind it
    FN[0] = pg.evaluate("""Object.keys(FUNCTIONS).filter(k =>
      typeof capsOfFunction === 'function' && capsOfFunction(k).length)[0] || null""")
    ok("a function with capabilities exists to test", bool(FN[0]), "none")
    if FN[0]:
        pg.evaluate("slidesOpen('fn', %r)" % FN[0]); pg.wait_for_timeout(400)
        walk(pg, "function")

    ok("no console/page errors", not errs, errs[:3])
    b.close()

print("\n%d failures" % len(fails))
sys.exit(1 if fails else 0)
