#!/usr/bin/env python3
"""The mark leads the card, and a logo speaks for itself (§375).

Islam, of the build §374 shipped: "what did you fix? we need a mock up to my
request for the circular it needs to be bigger covering even the line of the
settings button and the raya trade is not good as the name is not relevant as
the logo is saying the name. how about we remove the name and the industry if
the logo is there" — option C of a signed-off mockup
(design-mockups/client-card-mark/2026-09-20_bigger-and-the-name.html).

WHAT THIS ASSERTS IS THE PROBLEM, NOT THE LAYOUT (§94.8). Two things were
reported and they are separate: a mark too small to read, and a wordmark
saying the client's name twice. So what is asserted is that the mark reaches
the line the Settings chip is on and never touches it, and that a card draws
its name EXACTLY where the mark cannot carry it.

AND THIS FILE REVERSES §374 IN TWO PLACES, deliberately and recorded rather
than loosened (§218). That round asserted one square slot for every mark and
the name BESIDE it, and both were right for the shape it shipped: the square
existed so the name would start in the same place on every card when it sat
after a mark whose width varies. With the mark on its own line that problem
is gone — every name starts at the card's own padding — and the square is
what made the wordmark small. So:
  · "the mark's box is the same whatever the picture is"  →  the same HEIGHT,
    with a square picture in a square box and a wide one in a wider box.
  · "the name is AFTER the mark, and level with it"       →  BELOW it, and
    only on a card whose mark cannot say the name.
Neither is dropped; each is replaced by the claim that survives.

AND BOTH ENDS EVERY TIME (§94.2). A build that stopped drawing names at all
would satisfy "no name where there is a logo" perfectly, so the cards with no
logo are asserted to draw theirs in the same run; a build that went back to
one square for everything would satisfy "every mark is the same height", so a
wide picture is asserted to get a wider box.

THE COST ISLAM TOOK IS ASSERTED AS A SAFETY NET RATHER THAN ARGUED WITH: a
logo that is a symbol says no name, so the card carries none on its face —
which is why the picture must carry the client's name as its ALT, or the card
is nameless to a screen reader and blank when the picture fails to load.

THE ARCHIVED BAND IS ASSERTED UNCHANGED, because it was left out on purpose
(rule 1b): its mark shares its line with two controls, and at 40px a logo
does not say the name, which is the whole licence for taking the words away.

IT NEEDS NO DATABASE. platform.html is served as it is by both stacks, so the
page is driven against a stub — which is also the only way to put a roundel, a
wordmark and no mark at all in one row, a state no real deployment can be made
to hold on demand (§94.11, §255).

Run:  SMP_CHROME=… python3 SMP-Project-Folder/src/checks/client-card-mark.py
      … --break=stretch     # §374's square for every mark; must go red
      … --break=names-stay  # the name drawn beside a logo; must go red
      … --break=no-alt      # the picture carrying no name; must go red
      … --break=low-mark    # the mark back below the chip's line; must go red
      … --break=no-cap      # a wide mark free to reach the chip; must go red
      … --break=no-clamp    # a long name free to run; must go red
      SMP_PAGE=smp-app/shell/platform.html …   # the new stack's own copy
"""
import base64, http.server, json, os, socketserver, struct, sys, threading, zlib
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
REPO = os.path.abspath(os.path.join(ROOT, ".."))
PORT = int(os.environ.get("SMP_CHECK_PORT", "3989"))
BASE = "http://127.0.0.1:%d" % PORT
BREAK = next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--break=")), "")


def pagePath():
    """Both spellings of SMP_PAGE, and a page that is not there refused before
    the server starts rather than handed back as a timeout (§369.4)."""
    want = os.environ.get("SMP_PAGE")
    tries = [os.path.abspath(want), os.path.abspath(os.path.join(REPO, want))] if want \
        else [os.path.join(REPO, "platform.html")]
    tries = list(dict.fromkeys(tries))
    for p in tries:
        if os.path.isfile(p):
            return p
    sys.exit("the console page is not there — %s\n  tried: %s"
             % ("SMP_PAGE=%s" % want if want else "no platform.html at the repository root",
                "\n  tried: ".join(tries)))


PAGE = pagePath()

fails, passes = [], []
def check(what, ok, detail=""):
    if ok:
        passes.append(what); print("  ok   " + what)
    else:
        print("  FAIL " + what + ("  — " + str(detail) if detail != "" else "")); fails.append(what)


# ── the two SHAPES that matter, drawn rather than fetched ────────────────
# A roundel and a wordmark: the whole of decision one is that the old rule
# treated them alike, so a check with only one of them proves nothing.
def png(w, h, px):
    raw = b"".join(b"\x00" + b"".join(bytes(px(x, y)) for x in range(w)) for y in range(h))
    def ch(t, d):
        c = t + d
        return struct.pack(">I", len(d)) + c + struct.pack(">I", zlib.crc32(c))
    return (b"\x89PNG\r\n\x1a\n"
            + ch(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
            + ch(b"IDAT", zlib.compress(raw)) + ch(b"IEND", b""))

def uri(b):
    return "data:image/png;base64," + base64.b64encode(b).decode()

ROUNDEL = uri(png(240, 240, lambda x, y: (216, 168, 178, 255)
                  if ((x - 120) ** 2 + (y - 120) ** 2) ** .5 <= 118 else (0, 0, 0, 0)))
WORDMARK = uri(png(480, 120, lambda x, y: (15, 44, 105, 255)
                   if 24 <= y <= 96 and 20 < x < 460 and (x // 56) % 2 == 0 else (0, 0, 0, 0)))

# THE LONG NAME SITS ON A CARD WITH NO LOGO, or the clamp is never exercised:
# a card with a logo draws no name at all now, so a long name behind one would
# assert nothing (§94.5 — the fixture has to be able to reach the rule).
#
# AND IT IS LONGER THAN §374's, WHICH IS THE SAME LESSON ONE STEP ON. That
# name ran to four lines in a 159px column beside the mark and reached the
# clamp easily; with the mark on its own line the name has the card's whole
# width, so the same string fits in two and `--break=no-clamp` came back
# GREEN — a falsification that falsifies nothing reads exactly like a working
# guard (§54.5). The fixture carries a name long enough to reach the rule at
# the widths the grid actually makes.
LONG = ("Egyptian Consumer Electronics and Home Appliances "
        "Manufacturing and Distribution Holding")
def card(key, name, ind, mark, units):
    return {"key": key, "name": name, "industry": ind, "kind": "client", "mark": mark,
            "mine": True, "seat": "super", "state": "open", "canOpen": True, "canConfig": True,
            "units": units, "planned": True, "cycleOpen": True, "unreadable": False,
            "modules": [{"key": "strategy", "label": "Strategy", "mark": "No plan", "alarm": True},
                        {"key": "tracker", "label": "Internal Tracker"}]}

CARDS = [card("roundel", "ElAbd Foods", "F&B", ROUNDEL, 10),
         card("wordmark", "Raya Trade", "Trade & distribution", WORDMARK, 10),
         card("initials", "RHI Holding", "Real estate", None, 4),
         card("longname", LONG, "Manufacturing", None, 7)]
LOGO = ["roundel", "wordmark"]
NOLOGO = ["initials", "longname"]
ARCHIVED = [{"key": "gone", "name": "Nile Retail Group", "industry": "Retail", "kind": "client",
             "mark": ROUNDEL, "canConfig": True, "at": "2026-04-02T10:00:00Z",
             "by": "islam.saadany@forefront.consulting"}]

# ── the falsifications, applied to the PAGE (it is served as it is, and
#    there is no build step to make a broken copy through — §276's rule
#    needs one, this page has none) ─────────────────────────────────────
BREAKS = {
    # §374's square for every mark: the wordmark small again
    "stretch": [(""".ccard .idrow img.cmark{ width:auto; height:56px; max-width:calc(100% - 74px);
    padding:5px; border-radius:11px }""",
                 """.ccard .idrow img.cmark{ width:56px; height:56px; padding:5px; border-radius:11px }""")],
    # the name and the industry drawn beside a logo after all
    "names-stay": [("""      im.alt = c.name; im.title = c.name;
      idrow.appendChild(im);
    } else {
      idrow.appendChild(el("div", "cmark", initials(c.name)));
      var names""",
                    """      im.alt = c.name; im.title = c.name;
      idrow.appendChild(im);
    }
    {
      if (!c.mark) idrow.appendChild(el("div", "cmark", initials(c.name)));
      var names""")],
    # the picture carrying no name: the card nameless where the words are gone
    "no-alt": [("im.alt = c.name; im.title = c.name;", 'im.alt = ""; im.title = c.name;')],
    # the mark back under the Settings chip's line
    "low-mark": [(".ccard .ctop{ display:flex; flex-direction:column; gap:5px; padding:11px 14px 13px }",
                  ".ccard .ctop{ display:flex; flex-direction:column; gap:5px; padding:36px 14px 13px }")],
    # a wide mark with nothing keeping it off the chip
    "no-cap": [("max-width:calc(100% - 74px);", "max-width:none;")],
    # a long name free to run, which is what charges a whole grid row
    "no-clamp": [("-webkit-line-clamp:2; overflow:hidden }", "overflow:visible }")],
}
if BREAK and BREAK not in BREAKS:
    print("  unknown break: " + BREAK); sys.exit(1)

LANDED = []
def doctor(body):
    for old, new in BREAKS.get(BREAK, []):
        if old in body:
            body = body.replace(old, new); LANDED.append(old[:34])
    return body


class Stub(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def _send(self, body, ctype):
        b = body.encode("utf-8")
        self.send_response(200); self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        path = self.path.split("?")[0]
        if path in ("/platform", "/"):
            self._send(doctor(open(PAGE, encoding="utf-8").read()), "text/html; charset=utf-8"); return
        if path == "/platform-page.js":
            with open(os.path.join(REPO, "smp-app", "public", "platform-page.js"), encoding="utf-8") as f:
                self._send(doctor(f.read()), "application/javascript; charset=utf-8"); return
        self.send_response(404); self.end_headers()
    def do_POST(self):
        n = int(self.headers.get("Content-Length", "0"))
        body = json.loads(self.rfile.read(n) or "{}")
        if body.get("action") == "me":
            self._send(json.dumps({"ok": True, "account": {
                "email": "islam.saadany@forefront.consulting", "name": "Islam Saadany",
                "isAdmin": True}}), "application/json")
        elif body.get("action") == "cards":
            self._send(json.dumps({"ok": True, "cards": CARDS, "archived": ARCHIVED,
                                   "canAdd": True, "canConsultants": True, "canAccess": True}),
                       "application/json")
        else:
            self._send(json.dumps({"ok": True}), "application/json")


# Every figure is read off the PAINT: the mark's box, the name's INK (its own
# client rects, never the block's, which a wrapper leaves full width), and the
# box of whatever control sits in the card's top-right corner.
PROBE = """() => {
  const out = [];
  document.querySelectorAll('.ccard[data-client]').forEach(c => {
    const m = c.querySelector('.cmark'), im = c.querySelector('img.cmark');
    const h = c.querySelector('h2');
    const cb = c.getBoundingClientRect(), mb = m.getBoundingClientRect();
    let ink = [];
    if (h) { const r = document.createRange(); r.selectNodeContents(h);
             ink = Array.from(r.getClientRects()).filter(b => b.width > 0); }
    const g = c.querySelector('.ccfg, .cacts');
    const gb = g ? g.getBoundingClientRect() : null;
    out.push({
      key: c.dataset.client, arch: c.classList.contains('arch'), tag: m.tagName,
      markW: Math.round(mb.width * 10) / 10, markH: Math.round(mb.height * 10) / 10,
      markLeft: Math.round((mb.left - cb.left) * 10) / 10,
      markTop: Math.round((mb.top - cb.top) * 10) / 10,
      markBottom: Math.round((mb.bottom - cb.top) * 10) / 10,
      markDrawn: mb.width > 0 && mb.height > 0 && getComputedStyle(m).display !== 'none',
      alt: im ? im.alt : null,
      hasName: !!h, hasInd: !!c.querySelector('.ind'),
      dataName: c.dataset.name || null,
      ctlTop: gb ? Math.round((gb.top - cb.top) * 10) / 10 : null,
      ctlBottom: gb ? Math.round((gb.bottom - cb.top) * 10) / 10 : null,
      markHitsCtl: gb ? !(mb.right <= gb.left || gb.right <= mb.left
                       || mb.bottom <= gb.top || gb.bottom <= mb.top) : null,
      nameLeft: ink.length ? Math.round((ink[0].left - cb.left) * 10) / 10 : null,
      nameTop: ink.length ? Math.round((ink[0].top - cb.top) * 10) / 10 : null,
      nameLines: ink.length,
      nameShown: h ? Math.round(h.getBoundingClientRect().height) : 0,
      inkHitsCtl: gb && ink.length ? ink.some(b => !(b.right <= gb.left || gb.right <= b.left
                                     || b.bottom <= gb.top || gb.bottom <= b.top)) : false,
      cardW: Math.round(cb.width), cardH: Math.round(cb.height * 10) / 10
    });
  });
  return out;
}"""

WIDTHS = [1920, 1440, 1280, 1150, 1024, 900, 760, 430]


def run():
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", PORT), Stub)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    exe = os.environ.get("SMP_CHROME")
    errs = []
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=exe) if exe else p.chromium.launch()

        # ══ 1 · the mark is bigger, and its own shape ═════════════════
        print("\n1 · a square picture, a wide one and initials — one height, three widths")
        pg = b.new_page(viewport={"width": 1440, "height": 950})
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(BASE + "/platform")
        pg.wait_for_selector(".ccard[data-client]", timeout=9000)
        pg.wait_for_timeout(250)
        rows = pg.evaluate(PROBE)
        live = [r for r in rows if not r["arch"]]
        by = {r["key"]: r for r in live}

        # BOTH ENDS FIRST: an empty row agrees with itself perfectly.
        check("all four cards are drawn, and every one of them has a mark",
              len(live) == 4 and all(r["markDrawn"] for r in live),
              [(r["key"], r["markDrawn"]) for r in live])
        check("…the logo ones are pictures and the others are initials",
              all(by[k]["tag"] == "IMG" for k in LOGO)
              and all(by[k]["tag"] == "DIV" for k in NOLOGO),
              {k: by[k]["tag"] for k in by})

        # REWRITTEN FROM §374 (§218): the box used to have to be the same for
        # every picture, and that is what made a wordmark small. What has to
        # agree now is the HEIGHT.
        hs = {r["key"]: r["markH"] for r in live}
        check("every mark is the same height, whatever the picture is",
              len(set(hs.values())) == 1, hs)
        check("…and it is bigger than the 40px §374 shipped", by["roundel"]["markH"] > 40, hs)
        check("…a square picture still gets a square box, so it fills it",
              by["roundel"]["markW"] == by["roundel"]["markH"],
              (by["roundel"]["markW"], by["roundel"]["markH"]))
        # …AND THE OTHER END, or a build back on one square passes the line
        # above perfectly (§113.8) — which is the reported fault itself.
        check("…and a WIDE picture gets a wider box, which is the report",
              by["wordmark"]["markW"] > by["wordmark"]["markH"] * 1.5,
              (by["wordmark"]["markW"], by["wordmark"]["markH"]))
        check("…and the initials keep the square", by["initials"]["markW"] == by["initials"]["markH"],
              (by["initials"]["markW"], by["initials"]["markH"]))

        lefts = {r["key"]: r["markLeft"] for r in live}
        check("every mark starts at the same distance from the card's edge",
              len(set(lefts.values())) == 1, lefts)
        tops = {r["key"]: r["markTop"] for r in live}
        check("…and at the same height, so it cannot slide card to card",
              len(set(tops.values())) == 1, tops)

        # ══ 2 · it covers the Settings chip's line — the ask ══════════
        print("\n2 · the mark reaches the line the Settings chip is on")
        check("the chip's line is found, so there is something to reach",
              all(r["ctlTop"] is not None for r in live),
              [(r["key"], r["ctlTop"], r["ctlBottom"]) for r in live])
        check("the mark starts level with the chip, not below it",
              all(r["markTop"] <= r["ctlTop"] + 1 for r in live),
              [(r["key"], r["markTop"], r["ctlTop"]) for r in live])
        check("…and runs past it, which is what \"covering the line\" means",
              all(r["markBottom"] > r["ctlBottom"] for r in live),
              [(r["key"], r["markBottom"], r["ctlBottom"]) for r in live])

        # ══ 3 · a logo speaks for itself, and only a logo ═════════════
        print("\n3 · the words go exactly where the mark can carry them")
        check("a card with a logo draws no name and no industry",
              all(not by[k]["hasName"] and not by[k]["hasInd"] for k in LOGO),
              [(k, by[k]["hasName"], by[k]["hasInd"]) for k in LOGO])
        # BOTH ENDS (§94.2): a build that stopped drawing names anywhere
        # satisfies the line above perfectly.
        check("…and a card WITHOUT one draws both",
              all(by[k]["hasName"] and by[k]["hasInd"] and by[k]["nameLines"] >= 1
                  for k in NOLOGO),
              [(k, by[k]["hasName"], by[k]["hasInd"], by[k]["nameLines"]) for k in NOLOGO])
        # THE COST ISLAM TOOK, WITH ITS ONE SAFETY NET ASSERTED: a symbol logo
        # says no name, so the picture has to carry it or the card is nameless
        # to a reader and blank when the picture fails.
        check("…and the picture carries the client's name, so the card is never nameless",
              all(by[k]["alt"] == dict((c["key"], c["name"]) for c in CARDS)[k] for k in LOGO),
              [(k, by[k]["alt"]) for k in LOGO])
        # AND WHAT IS SEARCHED DOES NOT MOVE — a client with no words on its
        # card is still found by typing either of them.
        check("…and it is still searchable by its name and its industry",
              all("raya trade" in (by["wordmark"]["dataName"] or "")
                  and "distribution" in (by["wordmark"]["dataName"] or "") for _ in [0]),
              by["wordmark"]["dataName"])

        # REWRITTEN FROM §374 (§218): the name used to be AFTER the mark and
        # level with it. It is under it now, and at the card's own edge.
        named = [by[k] for k in NOLOGO]
        check("every name starts at the card's own left edge, the same on each",
              len(set(r["nameLeft"] for r in named)) == 1,
              [(r["key"], r["nameLeft"]) for r in named])
        check("…which is where the mark starts, not indented past it",
              all(r["nameLeft"] == r["markLeft"] for r in named),
              [(r["key"], r["markLeft"], r["nameLeft"]) for r in named])
        check("…and it sits BELOW the mark, which is what gave the mark its line",
              all(r["nameTop"] >= r["markBottom"] - 1 for r in named),
              [(r["key"], r["markBottom"], r["nameTop"]) for r in named])

        # A card with a logo is never taller than one without (§368's rule).
        heights = {r["key"]: r["cardH"] for r in live}
        check("a client with a logo is no taller than one without (§368)",
              len(set(heights.values())) == 1, heights)

        # ══ 4 · nothing reaches the chip, at every width ══════════════
        print("\n4 · the mark and the name clear the chip at every width")
        for w in WIDTHS:
            pg.set_viewport_size({"width": w, "height": 950})
            pg.wait_for_timeout(160)
            rows = pg.evaluate(PROBE)
            live = [r for r in rows if not r["arch"]]
            named = [r for r in live if r["hasName"]]
            hitM = [r["key"] for r in live if r["markHitsCtl"]]
            hitN = [r["key"] for r in live if r["inkHitsCtl"]]
            wrapped = [r["key"] for r in named if r["key"] != "longname" and r["nameLines"] > 1]
            side = pg.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
            # THE CAP IS ARITHMETIC AND IS NOT TRUSTED (§122.5): a wide mark is
            # held off the chip by `calc(100% - 74px)`, and what is asserted is
            # the two boxes against each other rather than that number.
            check("@%d no mark reaches the chip" % w, hitM == [], hitM)
            check("@%d and no name's ink does either" % w, hitN == [], hitN)
            check("@%d an ordinary name still fits on one line" % w, wrapped == [], wrapped)
            # WHAT THE CLAMP BUYS, AND NOT "THE ROW IS LEVEL" — a grid levels
            # every row against its own tallest whatever the cards ask for, so
            # that reads green on any build (§113.8, §356.16's own finding).
            # The property is that a long name costs AT MOST one extra line:
            # measured as a share of a name that fits on one (§94.8).
            one = min(r["nameShown"] for r in named)
            tallest = max(r["nameShown"] for r in named)
            check("@%d a long name costs one extra line at most" % w,
                  one > 0 and tallest <= 2 * one + 1, (one, tallest))
            check("@%d the page gains no sideways scroll" % w, not side)
        pg.set_viewport_size({"width": 1440, "height": 950})
        pg.wait_for_timeout(150)

        # ══ 5 · the archived band is left exactly as it was ═══════════
        # REWRITTEN FROM §374 (§218), and it is a claim rather than an
        # omission: that band was left out on purpose (rule 1b) because its
        # mark shares a line with two controls and at 40px a logo does not say
        # the name. So it must NOT have followed the live card.
        print("\n5 · the archived card is deliberately unchanged")
        rows = pg.evaluate(PROBE)
        arch = [r for r in rows if r["arch"]]
        check("the archived card is drawn, with its mark",
              len(arch) == 1 and arch[0]["markDrawn"], arch)
        if arch:
            a = arch[0]
            check("…its mark is the 40px square it always was",
                  (a["markW"], a["markH"]) == (40, 40), (a["markW"], a["markH"]))
            check("…so it is NOT the live card's mark, which grew",
                  a["markH"] < by["roundel"]["markH"], (a["markH"], by["roundel"]["markH"]))
            check("…and it keeps its name and its industry, logo or not",
                  a["hasName"] and a["hasInd"], (a["hasName"], a["hasInd"]))

        check("no page error anywhere", errs == [], errs)
        b.close()
    srv.shutdown(); srv.server_close()

    # A BREAK THAT DID NOT LAND IS A FALSIFICATION THAT DID NOT FALSIFY
    # (§344.1, §54.5) — a green run under --break reads exactly like a
    # working guard, so whether the substitution matched is asserted.
    if BREAK:
        check("the break landed (%s)" % BREAK, len(LANDED) > 0, LANDED)

    print("\n%d ok, %d failed" % (len(passes), len(fails)))
    if fails:
        print("FAILED: " + "; ".join(fails))
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(run())
