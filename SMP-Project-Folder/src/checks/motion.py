"""MOTION: SEVEN SMALL THINGS, EACH THE SAME WAY (§750).

qa-run: own-server — the asking box and Apply need a server that answers,
so this serves the built file itself, as ask-and-apply.py does.

Islam, handed the list "20 ways to make beautiful AI animations" and asked
which fit: seven did, shown before/after in design-mockups/motion/
2026-11-06_seven-motion-changes.html, and *"ok go ahead and apply all
seven"*. What is asserted is each promise, read off the built page's own
computed styles and classes, never by eye (§94.2):

  1 · THE DETAILS BOX eases out in over 180ms and settles up from 8px below.
  4 · …and goes out 20% quicker (140ms, ease-in) — the rule for every
      opening thing here, the dropdown and the asking box included.
  2 · THE DROPDOWN grows from .95 at the corner nearest its button; pressed
      again, or an entry pressed, the <details> is held open for the 140ms
      exit and shut after.
  3 · THE ASKING BOX grows from its own arrow's tip (the transform-origin
      askPlace sets); Keep sends it back in 140ms, taking no press meanwhile;
      a second ask replaces the first at once.
  6 · APPLIED's green dot rings once, on the press — a repaint inside the
      Undo window does not ring again.
  7 · A PRESS IS FELT: a held button sits at .97, released it is back to
      size, a disabled one does not sink.
  8 · REDUCED MOTION holds all of it still, and the asking box does not
      linger for an exit that is not running.
  (5 · no bounce — nothing changed, nothing to assert.)

  python3 qa-run.py checks/motion.py
"""
import json, os, pathlib, threading, http.server, socketserver, sys
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = pathlib.Path(os.environ.get("SMP_BUILT") or (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")).read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
bad = 0; errs = []
def ck(label, cond, detail=""):
    global bad
    if not cond: bad += 1
    print(("  ok      " if cond else "  FAIL    ") + label + ((" | " + str(detail)) if detail and not cond else ""))
class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _s(self, c, b, t):
        self.send_response(c); self.send_header("Content-Type", t); self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._s(200, json.dumps({"ok": True, "state": SEED, "person": PERSON}).encode(), "application/json"); return
        if self.path.startswith("/raya-trade"):
            self._s(200, HTML, "text/html; charset=utf-8"); return
        self._s(200, b"<!doctype html><title>Sign in</title>", "text/html; charset=utf-8")
    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0); self.rfile.read(n)
        self._s(200, b'{"ok":true}', "application/json")
def ev(pg, js, default=None):
    try: return pg.evaluate(js)
    except Exception as e: errs.append("PROBE: " + str(e)[:200]); return default
srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % srv.server_address[1]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium", args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    pg.goto(URL, wait_until="networkidle"); pg.wait_for_timeout(1500)
    ck("the platform is live", ev(pg, "()=>SYNC.isLive()") is True)

    print("\n1+4 · the details box eases out in, is 20% quicker out, and settles up 8px")
    st = ev(pg, """()=>{const o=document.querySelector('.overlay'), m=o&&o.querySelector('.modal'); if(!o||!m) return null;
      const co=getComputedStyle(o), cm=getComputedStyle(m);
      return {offDur:co.transitionDuration, offTf:co.transitionTimingFunction, mT:cm.transform, mDur:cm.transitionDuration};}""")
    ck("closed: overlay out 140ms ease-in, box held 8px below", st and st["offDur"].startswith("0.14s") and "ease-in" in st["offTf"] and st["mT"]=="matrix(1, 0, 0, 1, 0, 8)", st)
    st2 = ev(pg, """()=>{const o=document.querySelector('.overlay'); o.classList.add('on'); const m=o.querySelector('.modal');
      const co=getComputedStyle(o), cm=getComputedStyle(m); const r={onDur:co.transitionDuration, onTf:co.transitionTimingFunction, mTf:cm.transitionTimingFunction, mDur:cm.transitionDuration};
      o.classList.remove('on'); return r;}""")
    ck("open: overlay in 180ms ease-out, box eases to place in 180ms", st2 and st2["onDur"].startswith("0.18s") and "cubic-bezier(0, 0, 0.2, 1)" in st2["onTf"] and st2["mDur"].startswith("0.18s"), st2)

    print("\n2+4 · the header dropdown grows from its button and goes back into it")
    pg.click('button[title="Setup"]', timeout=2500); pg.wait_for_timeout(600)
    pg.goto(URL, wait_until="networkidle"); pg.wait_for_timeout(1200)
    has = ev(pg, "()=>!!document.querySelector('details.dlmenu > summary')")
    ck("a dropdown is on the page", has)
    if has:
        pg.click("details.dlmenu > summary >> nth=0"); pg.wait_for_timeout(60)
        o = ev(pg, """()=>{const d=document.querySelector('details.dlmenu[open]'); if(!d) return null; const m=d.querySelector(':scope > .menu');
          return {open:d.open, anim:getComputedStyle(m).animationName, dur:getComputedStyle(m).animationDuration, origin:getComputedStyle(m).transformOrigin};}""")
        ck("pressed: open, entering over 180ms with menuin", o and o["open"] and o["anim"]=="menuin" and o["dur"]=="0.18s", o)
        pg.click("details.dlmenu[open] > summary"); pg.wait_for_timeout(30)
        c = ev(pg, """()=>{const d=document.querySelector('details.dlmenu[open]'); if(!d) return {open:false}; const m=d.querySelector(':scope > .menu');
          return {open:d.open, closing:m.classList.contains('closing'), anim:getComputedStyle(m).animationName, dur:getComputedStyle(m).animationDuration, pe:getComputedStyle(m).pointerEvents};}""")
        ck("pressed again: held open for the exit, menuout 140ms, taking no press", c and c["open"] and c["closing"] and c["anim"]=="menuout" and c["dur"]=="0.14s" and c["pe"]=="none", c)
        pg.wait_for_timeout(220)
        ck("…and shut after it", ev(pg, "()=>!document.querySelector('details.dlmenu[open]')"))
        # an entry pressed closes through the same road
        pg.click("details.dlmenu > summary >> nth=0"); pg.wait_for_timeout(250)
        ev(pg, "()=>{const b=document.querySelector('details.dlmenu[open] > .menu button'); if(b) closeDlMenu(b);}")
        pg.wait_for_timeout(30)
        ck("an entry pressed: exit runs", ev(pg, "()=>!!document.querySelector('details.dlmenu[open] > .menu.closing')"))
        pg.wait_for_timeout(220)
        ck("…then shut", ev(pg, "()=>!document.querySelector('details.dlmenu[open]')"))

    print("\n3+4 · the asking box comes out of the control and goes back into it")
    ev(pg, "()=>askFirst(document.querySelector('button[title=\"Setup\"]'), {title:'Probe', body:'Probe body', go:function(){}})")
    pg.wait_for_timeout(60)
    a = ev(pg, """()=>{const a=document.querySelector('.askbox'); if(!a) return null; const ar=a.querySelector('.askarrow');
      return {anim:getComputedStyle(a).animationName, dur:getComputedStyle(a).animationDuration, origin:a.style.transformOrigin, arrow:ar.style.left, above:a.classList.contains('above')};}""")
    ok = a and a["anim"]=="askin" and a["dur"]=="0.18s" and a["origin"] and (a["origin"].endswith(" 0px") if not a["above"] else a["origin"].endswith("100%"))
    ck("opens from its arrow's tip over 180ms", ok, a)
    if a:
        ck("…the origin's x is the arrow's tip", abs(float(a["origin"].split("px")[0]) - (float(a["arrow"].replace("px","")) + 7)) < 0.6, a)
    ev(pg, "()=>document.querySelector('.askbox .askno').click()"); pg.wait_for_timeout(30)
    c = ev(pg, """()=>{const a=document.querySelector('.askbox'); if(!a) return null;
      return {closing:a.classList.contains('closing'), anim:getComputedStyle(a).animationName, dur:getComputedStyle(a).animationDuration, pe:getComputedStyle(a).pointerEvents};}""")
    ck("Keep: goes back in 140ms, taking no press", c and c["closing"] and c["anim"]=="askout" and c["dur"]=="0.14s" and c["pe"]=="none", c)
    pg.wait_for_timeout(200)
    ck("…and is gone", ev(pg, "()=>!document.querySelector('.askbox')"))
    ev(pg, "()=>askFirst(document.querySelector('button[title=\"Setup\"]'), {title:'P1', body:'b', go:function(){}})"); pg.wait_for_timeout(30)
    ev(pg, "()=>askFirst(document.querySelector('button[title=\"Setup\"]'), {title:'P2', body:'b', go:function(){}})"); pg.wait_for_timeout(30)
    ck("a second ask replaces the first at once (one box)", ev(pg, "()=>document.querySelectorAll('.askbox').length") == 1)
    ev(pg, "()=>askClose(true)")

    print("\n6 · Applied rings once, on the press, not on a repaint")
    pg.click('button[title="Setup"]', timeout=2500); pg.wait_for_timeout(600)
    ev(pg, "()=>{const r=document.querySelector('[data-setupgo=\"start\"]'); if(r) r.click();}"); pg.wait_for_timeout(1400)
    ev(pg, "()=>{const b=document.querySelector('.csetup [data-cstab=brand]'); if(b) b.click();}"); pg.wait_for_timeout(800)
    ev(pg, """()=>{const i=document.querySelector('.csetup [data-brand=accent]'); if(!i) return;
      i.value='#1f6f8b'; i.dispatchEvent(new Event('change',{bubbles:true}));}"""); pg.wait_for_timeout(900)
    ck("the row waits for Apply", ev(pg, "()=>!!document.querySelector('[data-applygo=brand]')"))
    ev(pg, "()=>document.querySelector('[data-applygo=brand]').click()"); pg.wait_for_timeout(120)
    r = ev(pg, """()=>{const d=document.querySelector('[data-applyrow=brand] .applydone'); if(!d) return null;
      return {pulse:d.classList.contains('pulse'), anim:getComputedStyle(d,'::before').animationName, dur:getComputedStyle(d,'::before').animationDuration};}""")
    ck("Applied's dot rings once over 1s", r and r["pulse"] and r["anim"]=="okring" and r["dur"]=="1s", r)
    ev(pg, "()=>paint()"); pg.wait_for_timeout(100)
    r2 = ev(pg, "()=>{const d=document.querySelector('[data-applyrow=brand] .applydone'); return d? d.classList.contains('pulse') : null;}")
    ck("a repaint inside the Undo window does not ring again", r2 is False, r2)
    ev(pg, "()=>{const u=document.querySelector('[data-applyundo=brand]'); if(u) u.click();}"); pg.wait_for_timeout(300)

    print("\n7 · a press is felt")
    bb = pg.locator('button[title="Setup"]').bounding_box()
    pg.mouse.move(bb["x"]+bb["width"]/2, bb["y"]+bb["height"]/2); pg.mouse.down(); pg.wait_for_timeout(40)
    t = ev(pg, "()=>getComputedStyle(document.querySelector('button[title=\"Setup\"]')).transform")
    ck("held: the button sits at .97", t == "matrix(0.97, 0, 0, 0.97, 0, 0)", t)
    pg.mouse.up(); pg.wait_for_timeout(200)
    t2 = ev(pg, "()=>getComputedStyle(document.querySelector('button[title=\"Setup\"]')).transform")
    ck("released: back to size", t2 == "none" or t2 == "matrix(1, 0, 0, 1, 0, 0)", t2)
    ck("a disabled button does not sink", ev(pg, "()=>{const b=document.createElement('button'); b.disabled=true; document.body.appendChild(b); const m=b.matches(':active'); b.remove(); return !m;}"))

    print("\n8 · reduced motion holds everything still")
    pg.emulate_media(reduced_motion="reduce")
    rm = ev(pg, """()=>{const o=document.querySelector('.overlay'); const m=o.querySelector('.modal'); const r={modal:getComputedStyle(m).transform};
      askFirst(document.querySelector('button[title="Setup"]'), {title:'P', body:'b', go:function(){}}); const a=document.querySelector('.askbox'); r.ask=getComputedStyle(a).animationName;
      askClose(); r.askGone=!document.querySelector('.askbox'); return r;}""")
    ck("box held still, asking box neither enters nor lingers", rm and rm["modal"]=="none" and rm["ask"]=="none" and rm["askGone"], rm)
    pg.emulate_media(reduced_motion="no-preference")
    print("\n  page errors:", errs or "none")
    ck("no page errors", not [e for e in errs if not e.startswith("PROBE")])
    b.close()
print("\n%d failures" % bad); sys.exit(1 if bad else 0)
