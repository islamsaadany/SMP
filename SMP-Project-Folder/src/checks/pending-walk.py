"""THE PENDING COUNT SAYS WHERE, AND WALKS YOU THERE (§192).

Islam, as the SMO: *"I'm getting this badge but I don't know where they are —
I think we need a flow like the filling to take me through the confirmation
areas so I can confirm."* §16.7's rule: a count that cannot take you to what it
counts is a count that makes work — and it is the exact fault §177.2 fixed for
the gaps, on the other half of the same feature.

AND IT WAS ON THE WRONG ROW. `pendBadge()` drew it in the pillar band's right
slot, which reserves 76px — room for two pen glyphs — while the fill grant's
control beside it is a WORDED button of 138 to 184px. Measured before the fix:
160px of overlap reading and 110px filling, so the count and the button printed
on top of each other. The number was never the pillar's either: it counts the
WHOLE subject, and the row above the pane is where the subject's totals already
live. Islam picked that (option B of the mockup), and the collision goes with it.

WHAT THIS ASSERTS THAT NOTHING ELSE DOES:

  · the count is off the band and on the totals row, and NOTHING in the pane's
    corner overlaps anything — measured in pixels, in both modes, because a
    class assertion goes green on a build where the two sit on each other;
  · the walk reaches every pending value ACROSS PLACES — two pillars and the
    objectives, which is three sections and two rails — and wraps;
  · the map and the stored count AGREE (§116.2: the count and the queue are one
    list), asserted as agreement and never as a number (§94.8);
  · pressing the tick the walk lands on actually confirms, and the count and the
    button's own label both follow.

BOTH ENDS (§113.8): a viewer who may NOT confirm gets the count and no walk —
a button that walked to a tick that is not drawn is §61's trap wearing the
count's clothes.

THE STATE IS MADE (§94.2): the demo has no pending values at all, so every
assertion here would otherwise be about an empty bar.

OVER HTTP, because the fill grant and the marks arrive from the server.
"""
import json, os, pathlib, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = pathlib.Path(os.environ.get("SMP_PEND_HTML") or
                    (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")).read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
UNIT = "logistics"
OFFICE = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
FILLER = {"key": "t192_fill", "name": "Filler 192", "role": None}
MARK = {"by": "someone", "at": "2026-08-29"}

bad = 0
def ck(w, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))

def world():
    s = json.loads(json.dumps(SEED))
    u = s["units"][UNIT]
    # THREE PLACES, so the walk has to cross a rail AND a section.
    u["keyObjectives"][0]["compile"] = "Latest"
    u["keyObjectives"][0]["pend"] = {"compile": MARK}
    for pi in (0, 1):
        for m in u["items"][pi]["measures"][:2]:
            m["compile"] = "Latest"; m["pend"] = {"compile": MARK}
    s["people"].append({"key": FILLER["key"], "name": FILLER["name"],
                        "active": True, "unit": UNIT})
    s["unitRoles"][UNIT]["custodian"] = FILLER["key"]
    s["access"]["custodian"] = dict(s["access"].get("custodian") or {},
                                    a_unit_own_strat="fill")
    return s

STATE = world()
WHO = {"person": OFFICE}

class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _s(self, b, c=200, t="application/json"):
        self.send_response(c); self.send_header("Content-Type", t)
        self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._s(json.dumps({"ok": True, "state": STATE, "person": WHO["person"]}).encode()); return
        if self.path.startswith("/raya-trade"):
            self._s(HTML, 200, "text/html; charset=utf-8"); return
        self._s(b"<!doctype html><title>gate</title>", 200, "text/html; charset=utf-8")
    def do_POST(self):
        # DRAIN THE REQUEST, or the browser reports ERR_CONNECTION_RESET (§210).
        # Answering without reading the body is rude to any client and was
        # survivable while a save was 216KB and went as a plain fetch. Since
        # §210 a save carries only what changed, which is small enough for
        # `flushLeave`'s keepalive path — and a keepalive request answered
        # without being read is reset as the page goes away. The stub was
        # always wrong; the change only made it visible (§100.3).
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

def land(pg):
    pg.goto(URL); pg.wait_for_timeout(2200)
    pg.evaluate("(u)=>document.querySelector('[data-u=\"'+u+'\"]').click()", UNIT)
    pg.wait_for_timeout(800)
    pg.evaluate("()=>{const b=document.querySelector('[data-sec=\"plan\"]'); if(b) b.click();}")
    pg.wait_for_timeout(900)

# WHERE THE CURSOR IS, in the navigation's own words — so a walk that lands on
# the same row twice is visible as such rather than counted as progress.
AT = """()=>{
  const e = document.querySelector('[data-gapat]');
  if (!e) return 'NOTHING';
  const band = document.querySelector('.pane > .pband .pband-code');
  const row = e.closest('tr');
  return CURSEC[currentSub] + '/' + (band ? band.textContent.trim() : '-') + '/' +
         (row ? row.textContent.trim().slice(0, 22) : 'objectives');
}"""

def run(pg):
    print("\n1 · the count is on the totals row, not on the band")
    WHO["person"] = OFFICE
    land(pg)
    ck("the pending count is drawn",
       pg.evaluate("()=>document.querySelectorAll('[data-gapband] .pendcount').length") == 1)
    ck("...and NOT on the pillar band any more",
       pg.evaluate("()=>document.querySelectorAll('.pband .pendcount').length") == 0)
    # A THING THAT IS NOT THERE IS A FAILURE, NOT A CRASH. On the pre-§192
    # build `pendMap` does not exist, and an unguarded call ends the run — so
    # the sections after it never report and the damage reads as smaller than
    # it is (§94.5 wants the whole count).
    ck("it agrees with the stored count (§116.2)",
       pg.evaluate("()=>{ if (typeof pendMap !== 'function') return false;"
                   "return pendMap(TARGET).reduce((a,e)=>a+e.count,0) === gapPendCount(TARGET); }"))
    ck("there is more than one place to walk", len(pg.evaluate(
       "()=>typeof pendMap === 'function' "
       "? pendMap(TARGET).filter(e=>e.count>0).map(e=>e.label) : []")) >= 3)

    print("\n2 · nothing in the corner prints on anything")
    # IN PIXELS. This is the fault reported, and a DOM probe cannot see it: both
    # elements are present and correct on the broken build.
    for mode in ("read mode", "fill mode"):
        r = pg.evaluate("""()=>{
          const boxes = [...document.querySelectorAll(
            '.pane > .pband .pband-r > *, .pane > .pband .pband-name, .pane .paneact > *')]
            .filter(e => e.getClientRects().length)
            .map(e => { const b = e.getBoundingClientRect();
                        return { t: e.textContent.trim().slice(0,24),
                                 l: b.left, r: b.right, y: b.top + b.height/2 }; });
          let worst = 0, pair = null;
          for (let i = 0; i < boxes.length; i++)
            for (let j = i+1; j < boxes.length; j++) {
              const a = boxes[i], b = boxes[j];
              if (Math.abs(a.y - b.y) > 20) continue;
              const over = Math.min(a.r, b.r) - Math.max(a.l, b.l);
              if (over > worst) { worst = over; pair = [a.t, b.t]; }
            }
          return { worst: Math.round(worst), pair: pair, n: boxes.length };}""")
        ck("%s: nothing in the band or the corner overlaps" % mode,
           r["worst"] <= 0, r)
        if mode == "read mode":
            WHO["person"] = FILLER
            land(pg)
            pg.evaluate("()=>{const b=document.querySelector('.fillcta[data-fillcta]'); if(b) b.click();}")
            pg.wait_for_timeout(1200)
    WHO["person"] = OFFICE
    land(pg)

    print("\n3 · the walk reaches every one of them, across places")
    total = pg.evaluate("()=>gapPendCount(TARGET)")
    ck("there are pending values to walk (%d)" % total, total > 0)
    seen = []
    for _ in range(total):
        pg.evaluate("()=>{const b=document.querySelector('[data-nextpend]'); if(b) b.click();}")
        pg.wait_for_timeout(700)
        seen.append(pg.evaluate(AT))
    ck("every press lands on something", "NOTHING" not in seen, seen)
    ck("...and on a DIFFERENT one each time", len(set(seen)) == total, seen)
    # `NOTHING` has no slashes, so these two read it out of the split rather
    # than throwing — a check that dies on the build it exists to reject
    # reports less damage than there is.
    part = lambda x, i: (x.split("/") + ["", "", ""])[i]
    ck("...covering more than one place",
       len(set(part(x, 1) for x in seen)) >= 2, seen)
    ck("...and more than one section",
       len(set(part(x, 0) for x in seen)) >= 2, seen)
    # AND IT WRAPS rather than stopping dead on the last one.
    pg.evaluate("()=>{const b=document.querySelector('[data-nextpend]'); if(b) b.click();}")
    pg.wait_for_timeout(700)
    ck("...and wraps back to the first", pg.evaluate(AT) == seen[0],
       "%s vs %s" % (pg.evaluate(AT), seen[0]))

    print("\n4 · the tick it lands on confirms, and the count follows")
    before = pg.evaluate("()=>gapPendCount(TARGET)")
    ck("the walk landed on a real confirm control",
       pg.evaluate("()=>{const e=document.querySelector('[data-gapat]');"
                   "return !!(e && e.hasAttribute('data-pconf'));}"))
    pg.evaluate("()=>{const e=document.querySelector('[data-gapat]'); if(e) e.click();}")
    pg.wait_for_timeout(900)
    after = pg.evaluate("()=>gapPendCount(TARGET)")
    ck("confirming clears that one", after == before - 1, "%s -> %s" % (before, after))
    ck("...and the button's own label follows",
       str(after) + " left" in (pg.evaluate(
         "()=>{const b=document.querySelector('[data-nextpend]');return b?b.textContent:'';}") or ""))
    ck("...and the count beside it follows",
       str(after) + " awaiting" in (pg.evaluate(
         "()=>{const c=document.querySelector('[data-gapband] .pendcount');"
         "return c?c.textContent:'';}") or ""))

    print("\n5 · both ends — a filler sees the count and no walk")
    WHO["person"] = FILLER
    land(pg)
    ck("the filler is shown the count",
       pg.evaluate("()=>document.querySelectorAll('[data-gapband] .pendcount').length") == 1)
    ck("...and is offered no walk, having no tick to walk to",
       pg.evaluate("()=>document.querySelectorAll('[data-nextpend]').length") == 0)
    ck("...and indeed no confirm control exists for them",
       pg.evaluate("()=>document.querySelectorAll('[data-pconf]').length") == 0)


errs = []
with sync_playwright() as pw:
    br = pw.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = br.new_page(viewport={"width": 1500, "height": 950})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');"
                       "sessionStorage.setItem('smp.tour.later','1')}catch(e){}")
    run(pg)
    br.close()

print("\nconsole: " + (("%d — " % len(errs)) + errs[0] if errs else "clean"))
if errs: bad += 1
print("\n" + ("ALL OK" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
