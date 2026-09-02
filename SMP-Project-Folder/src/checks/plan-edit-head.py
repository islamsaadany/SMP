"""EDITING KEEPS ITS HEAD, AND THE NAME GETS THE LINE (§194).

Islam: *"when I edit a plan or a pillar it loses its design and the name box
becomes very small — it can be along the line … and on editing we still need to
maintain the pillar Code and name fixed so on scrolling down I can still see
that save button."* And, on the third box: *"hide the note bar for now."*

MEASURED BEFORE ANYTHING WAS WRITTEN, on Mobile's plan at 1500px with the pen
open: the name box was **228px** inside a pane over a thousand wide, and at
480px of scroll the code, the name AND the Done tick were all off screen
(top −211). Reading has kept its band pinned since §53.7 — editing had no
equivalent, which is exactly what "loses its design" is.

WHAT THIS ASSERTS THAT NOTHING ELSE DOES:

  · the name box takes most of the pane rather than a fixed slice — asserted as
    a RATIO of the pane, never a pixel count, so a later change to the gutters
    stays green and a box pinned back to a slice does not (§94.8);
  · the code, the name and the Done tick are all ON SCREEN after scrolling —
    which is the complaint, measured as the complaint;
  · reading is UNTOUCHED: its own band still pins, at the same offset, so the
    two modes hold the page at the same line (§53.5 — one question per mode,
    and switching must not jump);
  · the note bar is gone, and gone in BOTH modes.

BOTH ENDS (§113.8): the head is only pinned while the pen is open, or a build
that pinned every pane heading would pass.
"""
import json, os, pathlib, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = pathlib.Path(os.environ.get("SMP_PE_HTML") or
                    (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")).read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
OFF = {"key": "smo", "name": "Mohamed Essam", "role": "super"}

bad = 0
def ck(w, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))

class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _s(self, b, c=200, t="application/json"):
        self.send_response(c); self.send_header("Content-Type", t)
        self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._s(json.dumps({"ok": True, "state": SEED, "person": OFF}).encode()); return
        if self.path.startswith("/raya-trade"):
            self._s(HTML, 200, "text/html; charset=utf-8"); return
        self._s(b"<!doctype html><title>gate</title>", 200, "text/html; charset=utf-8")
    def do_POST(self):
        # DRAIN THE REQUEST (§210, and pending-walk.py hit this first). A save
        # now carries only what changed, which is small enough for
        # `flushLeave`'s keepalive path — and a keepalive request answered
        # without being read is reset as the page goes away, which the browser
        # reports as a console error. Always was wrong; only now visible.
        try:
            n = int(self.headers.get("Content-Length") or 0)
            if n: self.rfile.read(n)
        except Exception:
            pass
        self._s(b'{"ok":true,"unread":0,"threads":[],"chat":{"on":false},"states":{},"said":{}}')

class SRV(socketserver.ThreadingTCPServer): allow_reuse_address = True
srv = SRV(("127.0.0.1", 0), H)
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % srv.server_address[1]

# ON SCREEN AFTER SCROLLING — the complaint, asked of the three things named in
# it. `onScreen` and not merely "present": every one of them was in the
# document the whole time, 211px above the top of the window.
SEEN = """(sel)=>{
  const e = document.querySelector(sel);
  if (!e) return { missing: true };
  const r = e.getBoundingClientRect();
  return { top: Math.round(r.top), onScreen: r.bottom > 0 && r.top < innerHeight };
}"""

def land(pg, unit="mobile", sec="plan"):
    pg.goto(URL); pg.wait_for_timeout(2200)
    pg.evaluate("(u)=>document.querySelector('[data-u=\"'+u+'\"]').click()", unit)
    pg.wait_for_timeout(800)
    pg.evaluate("(s)=>{const b=document.querySelector('[data-sec=\"'+s+'\"]'); if(b) b.click();}", sec)
    pg.wait_for_timeout(900)

def run(pg):
    print("\n1 · reading is untouched")
    land(pg)
    ck("reading pins its own band",
       pg.evaluate("()=>{const b=document.querySelector('.pane > .pband');"
                   "return !!b && getComputedStyle(b).position === 'sticky';}"))
    read_top = pg.evaluate("()=>{const b=document.querySelector('.pane > .pband');"
                           "return b ? getComputedStyle(b).top : null;}")
    ck("...and no note bar is drawn while reading",
       pg.evaluate("()=>document.querySelectorAll('.pane p.sub textarea').length") == 0)
    ck("...and the head is NOT pinned, because there is no head",
       pg.evaluate("()=>document.querySelectorAll('.pane .ptitle.edhead').length") == 0)

    print("\n2 · the pen opens, and the name takes the line")
    pg.evaluate("()=>{const b=document.querySelector('#secrow-in .secpen'); if(b) b.click();}")
    pg.wait_for_timeout(1400)
    ck("the pen is open", pg.evaluate("()=>!!EDIT_PAGE.plan"))
    d = pg.evaluate("""()=>{
      const t = document.querySelector('.pane .ptitle');
      const box = t && t.querySelector('.ptname');
      const pane = document.querySelector('.pane');
      return { edhead: !!(t && t.classList.contains('edhead')),
               nameW: box ? box.getBoundingClientRect().width : 0,
               paneW: pane ? pane.getBoundingClientRect().width : 0,
               tag: box ? box.tagName : null };}""")
    ck("the editing head is marked", d["edhead"], d)
    # A RATIO, NOT A PIXEL COUNT (§94.8). Before: 228 of 1225 — 19%.
    share = (d["nameW"] / d["paneW"]) if d["paneW"] else 0
    ck("the name box takes most of the pane (%d%%)" % round(share * 100), share > 0.7,
       "%d of %d" % (round(d["nameW"]), round(d["paneW"])))
    ck("...and it is still the growing box §189 gave it", d["tag"] == "TEXTAREA", d["tag"])
    ck("...and no note bar is drawn while editing either",
       pg.evaluate("()=>document.querySelectorAll('.pane p.sub textarea').length") == 0)

    print("\n3 · and it all stays put when you scroll")
    pg.evaluate("()=>window.scrollTo(0, 700)")
    pg.wait_for_timeout(400)
    scrolled = pg.evaluate("()=>Math.round(window.scrollY)")
    ck("the page really scrolled (%dpx)" % scrolled, scrolled > 200, scrolled)
    # §248: THE WAY TO SAVE MOVED AND THE REQUIREMENT DID NOT. Islam's ask
    # was *"so on scrolling down I can still see that save button"* — the
    # button is `Done editing` on the section line now, which pins HIGHER than
    # this head and does not move when the section changes. So the assertion
    # is the same assertion, pointed at where the control lives; the head is
    # still asserted to pin, because it carries the code, the name field and
    # Remove (§232).
    for what, sel in (("the head", ".pane .ptitle.edhead"),
                      ("the code", ".pane .ptitle.edhead .ptcode"),
                      ("the name", ".pane .ptitle.edhead .ptname"),
                      ("the way to save", "#secrow-in .secpen.on")):
        r = pg.evaluate(SEEN, sel)
        ck("%s is on screen" % what, r.get("onScreen") is True, r)
    ck("...and the head pins at the same line reading does",
       pg.evaluate("()=>{const t=document.querySelector('.pane .ptitle.edhead');"
                   "return t ? getComputedStyle(t).top : null;}") == read_top,
       read_top)
    # AND IT IS OPAQUE, or rows slide through it (§53.7).
    ck("...on a ground of its own",
       "rgba(0, 0, 0, 0)" not in (pg.evaluate(
         "()=>{const t=document.querySelector('.pane .ptitle.edhead');"
         "return t ? getComputedStyle(t).backgroundColor : '';}") or "rgba(0, 0, 0, 0)"))

    print("\n4 · both ends — closing the pen puts it back")
    pg.evaluate("()=>window.scrollTo(0,0)")
    pg.evaluate("()=>{const b=document.querySelector('#secrow-in .secpen'); if(b) b.click();}")
    pg.wait_for_timeout(1200)
    ck("the pen is closed", not pg.evaluate("()=>!!EDIT_PAGE.plan"))
    ck("...and nothing is pinned that was not before",
       pg.evaluate("()=>document.querySelectorAll('.pane .ptitle.edhead').length") == 0)
    ck("...and reading's band is back",
       pg.evaluate("()=>!!document.querySelector('.pane > .pband')"))

    print("\n5 · a project's band — the name gets the line there too (§228)")
    # The other side of the switch (A15): §194 fixed the pillar's head and
    # the project BAND kept the fault — Islam's FIN01 screenshot, a title on
    # three lines in a shrunk box beside an empty band. Same assertion shape:
    # a RATIO of the band, never a pixel count (§94.8), and ONE line.
    pg.evaluate("()=>{const s=document.querySelector('#units .navswitch .nsw:not(.on)');"
                "if(s) s.click();}")
    pg.wait_for_timeout(500)
    pg.evaluate("()=>{const b=document.querySelector('[data-u=\"fn:finance\"]'); if(b) b.click();}")
    pg.wait_for_timeout(900)
    pg.evaluate("()=>{const b=document.querySelector('#secrow-in [data-sub2=\"proj\"]'); if(b) b.click();}")
    pg.wait_for_timeout(700)
    pg.evaluate("()=>{const b=document.querySelector('#secrow-in .secpen'); if(b) b.click();}")
    pg.wait_for_timeout(1400)
    e = pg.evaluate("""()=>{
      const band = document.querySelector('.pane .pband.edband');
      const box = band && band.querySelector('.pband-name textarea.fld.grow');
      const lh = box ? (parseFloat(getComputedStyle(box).lineHeight) || 20) : 1;
      return { band: band ? Math.round(band.getBoundingClientRect().width) : 0,
               boxW: box ? Math.round(box.getBoundingClientRect().width) : 0,
               lines: box ? Math.round((box.getBoundingClientRect().height - 4) / lh) : 0 };}""")
    ck("the project band is in edit mode", e["band"] > 0, e)
    share2 = (e["boxW"] / e["band"]) if e["band"] else 0
    ck("the band's name box takes most of the band (%d%%)" % round(share2 * 100),
       share2 > 0.6, "%d of %d" % (e["boxW"], e["band"]))
    ck("...and the title sits on ONE line", e["lines"] == 1, e["lines"])

errs = []
with sync_playwright() as pw:
    br = pw.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = br.new_page(viewport={"width": 1500, "height": 900})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1')}catch(e){}")
    run(pg)
    br.close()

print("\nconsole: " + (("%d — " % len(errs)) + errs[0] if errs else "clean"))
if errs: bad += 1
print("\n" + ("ALL OK" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
