#!/usr/bin/env python3
"""The mark and the name on one line (§374).

Islam, of a client whose logo is a roundel: "on addiing a circular logo the
view is not good. plus I'm not sure of the placement of the client name in
case we have the logo." Option C of a signed-off mockup
(design-mockups/client-card-mark/2026-09-20_a-circular-mark.html).

WHAT THIS ASSERTS IS THE PROBLEM, NOT THE LAYOUT (§94.8). The reported fault
is that a SQUARE picture behaved differently from a WIDE one — `.ctop` is a
column flex, so `width:auto` stretched the img to the card and
`object-fit:contain` centred the picture inside that stretched box, leaving a
roundel floating ~52px in from an edge every other line started at. So what
is asserted is AGREEMENT between the three kinds of mark rather than any
figure: same box, same inset, same top, and the name's left edge the same on
every card whatever the mark is. A later change to the slot's size stays
green; a build that lets the shape of the picture decide the layout does not.

AND BOTH ENDS EVERY TIME (§94.2). A build that stopped drawing marks
altogether would satisfy "no mark is wider than another" perfectly, so every
agreement here is asserted beside the presence that makes it mean something:
the logo is a real <img>, the initials are a real block, and both are drawn.

THE THREE FAULTS THE MOCKUP NAMED are each their own assertion, because C as
drawn had all three and C as built must have none: the ragged name inset, the
mark sliding up and down beside a name block of changing height, and the name
squeezed by the Settings chip until it wrapped. The last is measured as the
name's INK against the chip's box (§302: an assertion about a box is not an
assertion about where the words are), at every width the grid makes.

AND THE ARCHIVED CARD HAD THE SAME FAULT, from the same declaration, so it is
measured here too — its mark was 134x36 with a 30px picture adrift in it.

IT NEEDS NO DATABASE. platform.html is served as it is by both stacks, so the
page is driven against a stub — which is also the only way to put a roundel, a
wordmark and no mark at all in one row, a state no real deployment can be made
to hold on demand (§94.11, §255).

Run:  SMP_CHROME=… python3 SMP-Project-Folder/src/checks/client-card-mark.py
      … --break=stretch    # the behaviour before §374; must go red
      … --break=no-row     # the name back under the mark; must go red
      … --break=no-clamp   # a long name free to run; must go red
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
# A roundel and a wordmark: the whole finding is that the old rule treated
# them differently, so a check that had only one of them proves nothing.
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

# A name long enough to need the clamp, beside three ordinary ones.
LONG = "Egyptian Consumer Electronics Holding"
def card(key, name, ind, mark, units):
    return {"key": key, "name": name, "industry": ind, "kind": "client", "mark": mark,
            "mine": True, "seat": "super", "state": "open", "canOpen": True, "canConfig": True,
            "units": units, "planned": True, "cycleOpen": True, "unreadable": False,
            "modules": [{"key": "strategy", "label": "Strategy", "mark": "No plan", "alarm": True},
                        {"key": "tracker", "label": "Internal Tracker"}]}

CARDS = [card("roundel", "ElAbd Foods", "F&B", ROUNDEL, 10),
         card("wordmark", "Raya Trade", "Trade & distribution", WORDMARK, 10),
         card("initials", "RHI Holding", "Real estate", None, 4),
         card("longname", LONG, "Manufacturing", ROUNDEL, 7)]
ARCHIVED = [{"key": "gone", "name": "Nile Retail Group", "industry": "Retail", "kind": "client",
             "mark": ROUNDEL, "canConfig": True, "at": "2026-04-02T10:00:00Z",
             "by": "islam.saadany@forefront.consulting"}]

# ── the falsifications, applied to the PAGE (it is served as it is, and
#    there is no build step to make a broken copy through — §276's rule
#    needs one, this page has none) ─────────────────────────────────────
BREAKS = {
    # the reported fault: the picture decides the layout again
    "stretch": [(".ccard img.cmark{ width:40px; height:40px; flex:none; object-fit:contain; background:#fff;\n    padding:3px; box-sizing:border-box; border-radius:7px }",
                 ".ccard img.cmark{ width:auto; max-width:120px; height:30px; object-fit:contain; background:#fff; padding:3px 7px; box-sizing:content-box }")],
    # the name back on a line of its own under the mark
    "no-row": [(".ccard .idrow{ display:flex; align-items:flex-start; gap:10px }",
                ".ccard .idrow{ display:block }")],
    # a long name free to run, which is what charged a whole grid row 50px
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
# chip's box.
PROBE = """() => {
  const out = [];
  document.querySelectorAll('.ccard[data-client]').forEach(c => {
    const m = c.querySelector('.cmark'), h = c.querySelector('h2');
    const cb = c.getBoundingClientRect(), mb = m.getBoundingClientRect();
    const r = document.createRange(); r.selectNodeContents(h);
    const ink = Array.from(r.getClientRects()).filter(b => b.width > 0);
    const g = c.querySelector('.ccfg');
    const gb = g ? g.getBoundingClientRect() : null;
    out.push({
      key: c.dataset.client, arch: c.classList.contains('arch'), tag: m.tagName,
      markW: Math.round(mb.width * 10) / 10, markH: Math.round(mb.height * 10) / 10,
      markLeft: Math.round((mb.left - cb.left) * 10) / 10,
      markTop: Math.round((mb.top - cb.top) * 10) / 10,
      markDrawn: mb.width > 0 && mb.height > 0 && getComputedStyle(m).display !== 'none',
      nameLeft: ink.length ? Math.round((ink[0].left - cb.left) * 10) / 10 : null,
      nameTop: ink.length ? Math.round((ink[0].top - cb.top) * 10) / 10 : null,
      nameLines: ink.length,
      nameShown: Math.round(h.getBoundingClientRect().height),
      cardW: Math.round(cb.width), cardH: Math.round(cb.height * 10) / 10,
      inkHitsChip: gb ? ink.some(b => !(b.right <= gb.left || gb.right <= b.left
                                     || b.bottom <= gb.top || gb.bottom <= b.top)) : null
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

        # ══ 1 · the three kinds of mark are one box ═══════════════════
        print("\n1 · a roundel, a wordmark and initials are the same slot")
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
        check("…the logo ones are pictures and the third is initials",
              by["roundel"]["tag"] == "IMG" and by["wordmark"]["tag"] == "IMG"
              and by["initials"]["tag"] == "DIV",
              {k: by[k]["tag"] for k in by})

        boxes = {r["key"]: (r["markW"], r["markH"]) for r in live}
        check("the mark's box is the same whatever the picture is — the reported fault",
              len(set(boxes.values())) == 1, boxes)
        check("…and it is square, so a roundel fills it rather than floating in it",
              by["roundel"]["markW"] == by["roundel"]["markH"] > 0, boxes["roundel"])

        lefts = {r["key"]: r["markLeft"] for r in live}
        check("every mark starts at the same distance from the card's edge", 
              len(set(lefts.values())) == 1, lefts)
        tops = {r["key"]: r["markTop"] for r in live}
        check("…and at the same height, so it cannot slide card to card (fault 3)",
              len(set(tops.values())) == 1, tops)

        # ══ 2 · the name is beside it, at one left edge ═══════════════
        print("\n2 · the name is beside the mark, and starts in the same place")
        names = {r["key"]: r["nameLeft"] for r in live}
        check("every name starts at the same x, whatever mark is beside it (fault 1)",
              len(set(names.values())) == 1, names)
        check("…and that is AFTER the mark, not under it",
              all(r["nameLeft"] > r["markLeft"] + r["markW"] - 1 for r in live),
              [(r["key"], r["markLeft"], r["markW"], r["nameLeft"]) for r in live])
        # ON ONE LINE IS A VERTICAL CLAIM AS WELL AS A HORIZONTAL ONE: with
        # the row broken the name sits UNDER the mark and still starts at the
        # same x on every card, so the assertion above passes on it (§113.8).
        check("…and level with it, which is what \"on one line\" means",
              all(r["markTop"] - 1 <= r["nameTop"] <= r["markTop"] + r["markH"] for r in live),
              [(r["key"], r["markTop"], r["markH"], r["nameTop"]) for r in live])
        check("…and the name is still drawn in full weight, not removed",
              all(r["nameLines"] >= 1 and r["nameShown"] > 0 for r in live),
              [(r["key"], r["nameLines"]) for r in live])

        # A card with a logo is never taller than one without (§368's rule).
        heights = {r["key"]: r["cardH"] for r in live}
        check("a client with a logo is no taller than one without (§368)",
              len(set(heights.values())) == 1, heights)

        # ══ 3 · the Settings chip never reaches the name ══════════════
        print("\n3 · the name clears the Settings chip at every width (fault 2)")
        for w in WIDTHS:
            pg.set_viewport_size({"width": w, "height": 950})
            pg.wait_for_timeout(160)
            rows = pg.evaluate(PROBE)
            live = [r for r in rows if not r["arch"]]
            hit = [r["key"] for r in live if r["inkHitsChip"]]
            wrapped = [r["key"] for r in live if r["key"] != "longname" and r["nameLines"] > 1]
            side = pg.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
            check("@%d the name's ink never reaches the chip" % w, hit == [], hit)
            check("@%d an ordinary name still fits on one line" % w, wrapped == [], wrapped)
            # WHAT THE CLAMP BUYS, AND NOT "THE ROW IS LEVEL" — a grid levels
            # every row against its own tallest whatever the cards ask for, so
            # that reads green on any build (§113.8, §356.16's own finding),
            # and at these widths the four cards are not all in one row
            # anyway. The property is that a long name costs AT MOST one extra
            # line: measured as a share of a name that fits on one, never as a
            # pixel count (§94.8).
            one = min(r["nameShown"] for r in live)
            tallest = max(r["nameShown"] for r in live)
            check("@%d a long name costs one extra line at most" % w,
                  one > 0 and tallest <= 2 * one + 1, (one, tallest))
            check("@%d the page gains no sideways scroll" % w, not side)
        pg.set_viewport_size({"width": 1440, "height": 950})
        pg.wait_for_timeout(150)

        # ══ 4 · the archived band had the same fault ══════════════════
        print("\n4 · the archived card, from the same declaration")
        rows = pg.evaluate(PROBE)
        arch = [r for r in rows if r["arch"]]
        check("the archived card is drawn, with its mark", 
              len(arch) == 1 and arch[0]["markDrawn"], arch)
        if arch:
            check("…and its mark is the same square the live cards wear",
                  (arch[0]["markW"], arch[0]["markH"]) == boxes["roundel"],
                  (arch[0]["markW"], arch[0]["markH"], boxes["roundel"]))

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
