"""ONE LINE ABOVE THE TABLE, AND A DIALOG THAT FITS THE WINDOW (§118).

Islam: "the top part can include the password, the SMO badge remove it and
remove the 77 people active text and the password can come to the same line and
accordingly the whole table should be just below the buttons line", and of the
edit dialog: "that's a very wide design that even require a scroll — make it
compact with no need to scroll."

WHAT THIS ASSERTS IS THE PROBLEM, NOT THE LAYOUT (§94.8). A check written
against the numbers I happened to reach has to be rewritten the next time
somebody changes a label; these are the two things that were actually wrong:

  · the controls did not fit one line, and a count line sat between them and
    the table;
  · the dialog scrolled, and one of its cells was empty.

So it asks whether the row is ONE row and whether the table follows it, never
that the row is 721px; and whether the dialog fits the window with nothing
orphaned, never that it is 860px.

OVER HTTP, because the Passwords menu is `live` — over `file://` it is not
drawn at all, so a build that had left it on a second row would go green at
every width (§94.11). The first version of this file measured over `file://`
and reported a five-control row as passing.

EVERY CONTROL IS PRESSED FOR, NOT COUNTED (§93.4): the register's own history
is controls that were present, enabled, correctly sized and landing under
something else, and three separate versions of this page shipped that way.
"""
import json
import pathlib
import http.server
import socketserver
import threading

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}

errs, bad = [], 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _s(self, c, b, t):
        self.send_response(c)
        self.send_header("Content-Type", t)
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._s(200, json.dumps({"ok": True, "state": SEED, "person": PERSON}).encode(),
                    "application/json")
            return
        if self.path.startswith("/raya-trade"):
            self._s(200, HTML, "text/html; charset=utf-8")
            return
        self._s(200, b"<!doctype html><title>Sign in</title>", "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(n)
        body = {}
        try:
            body = json.loads(raw or b"{}")
        except Exception:
            pass
        if body.get("action") == "passwords":
            st = {p["key"]: ["set", "temporary", "none"][i % 3]
                  for i, p in enumerate(SEED.get("people", []))}
            self._s(200, json.dumps({"ok": True, "states": st}).encode(), "application/json")
            return
        if body.get("action") == "declarations":
            self._s(200, json.dumps({"ok": True, "declarations": {}}).encode(),
                    "application/json")
            return
        self._s(200, b'{"ok":true}', "application/json")


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % PORT

# ONE ROW IS NOT ONE `top` VALUE. The controls in this row have different
# heights, so their boxes start a pixel or two apart even when they are plainly
# side by side — the first version of this file counted three rows on a row that
# was visibly one. Cluster by the middle, with a tolerance well under a row.
ROWS = """(sel)=>{
  const r=document.querySelector(sel);
  const mids=[...r.children].filter(x=>x.getBoundingClientRect().width>0)
     .map(x=>{const b=x.getBoundingClientRect(); return b.top+b.height/2;});
  const cl=[]; mids.forEach(m=>{ if(!cl.some(c=>Math.abs(c-m)<14)) cl.push(m); });
  return cl.length;}"""

# PRESSED FOR, NOT COUNTED (§93.4). elementFromPoint at a control's own centre
# must come back as that control, or something is sitting on top of it.
HITS = """(sel)=>{
  const out=[];
  document.querySelectorAll(sel).forEach(e=>{
    const b=e.getBoundingClientRect();
    if(!b.width) return;
    const h=document.elementFromPoint(Math.round(b.left+b.width/2),
                                      Math.round(b.top+b.height/2));
    out.push({t:(e.textContent||'').trim().slice(0,16),
              ok: !!h && (h===e || e.contains(h))});
  });
  return out;}"""


def land(pg):
    pg.goto(URL)
    pg.wait_for_timeout(1900)
    pg.evaluate("try{sessionStorage.setItem('smp.tour.later','1')}catch(e){}")
    pg.evaluate("()=>document.querySelector('[data-md=\"setup\"]').click()")
    pg.wait_for_timeout(400)
    pg.evaluate("()=>document.querySelector('[data-setupgo=\"people\"]').click()")
    pg.wait_for_timeout(1400)


print("one line above the table — " + URL)

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page()
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)

    # ── 1. THE THREE REMOVALS, AND THE ONE ARRIVAL ───────────────────
    print("\n1. what is gone, and what came up to join the row")
    pg.set_viewport_size({"width": 1512, "height": 900})
    land(pg)
    ck("the SMO badge is gone",
       pg.evaluate("()=>document.querySelectorAll('.phead2 .chip').length") == 0,
       pg.evaluate("()=>[...document.querySelectorAll('.phead2 .chip')].map(x=>x.textContent)"))
    ck("the count line is gone",
       not pg.evaluate("()=>!!document.querySelector('.pcount')"))
    ck("...and no 'people active' text survives anywhere on the page",
       "people active" not in pg.eval_on_selector("#panel", "e=>e.textContent"))
    # THE ARRIVAL IS THE HALF THAT IS NOT A REMOVAL, and it is the half that
    # only exists over HTTP.
    ck("Passwords is drawn at all (it is `live`, so this needs a server)",
       pg.evaluate("""()=>[...document.querySelectorAll('.phead2 .hright *')]
          .some(x=>/password/i.test(x.textContent||''))"""))
    ck("...and it is inside the controls row, not below it",
       pg.evaluate("""()=>{const r=document.querySelector('.phead2 .hright');
          return [...r.children].some(x=>/password/i.test(x.textContent||''));}"""))

    # ── 2. IT IS ONE ROW ─────────────────────────────────────────────
    print("\n2. one row, and the table under it")
    # THE ASK WAS ABOUT THE HEADER, NOT ABOUT `.hright` (§118). `.phead2` wraps
    # too, so when the controls no longer fit beside the title the whole block
    # drops them to a line of their own — and `.hright` then reports ONE row
    # while the header is two. Measuring the inner box alone passed on the
    # build this section replaced, at every width. The height of the WHOLE
    # header is the thing Islam can see, so that is what is asserted, with the
    # inner row asserted under it because it is the one that carried Passwords.
    for w in (1920, 1600, 1400, 1280):
        pg.set_viewport_size({"width": w, "height": 900})
        land(pg)
        hh = pg.evaluate("()=>Math.round(document.querySelector('.phead2')"
                         ".getBoundingClientRect().height)")
        ck("%d: title and controls are one line (header %dpx)" % (w, hh), hh <= 48, hh)
        n = pg.evaluate(ROWS, ".phead2 .hright")
        ck("%d: the controls are one row (%d)" % (w, n), n == 1, n)
        ck("%d: nothing scrolls sideways" % w,
           not pg.evaluate("()=>document.documentElement.scrollWidth>innerWidth+1"))
        # THE TABLE FOLLOWS THE ROW. Not a number — the header's own margin is
        # the gap, and the assertion is that nothing else is between them.
        gap = pg.evaluate("""()=>{const h=document.querySelector('.phead2'),
             t=document.querySelector('.peoplebox');
           return t? Math.round(t.getBoundingClientRect().top -
                                h.getBoundingClientRect().bottom) : -1;}""")
        ck("%d: the table starts directly under it (%dpx)" % (w, gap),
           0 <= gap <= 40, gap)
        hits = pg.evaluate(HITS, ".phead2 .hright > *")
        ck("%d: every control on the row can be pressed (%d)" % (w, len(hits)),
           len(hits) >= 5 and all(h["ok"] for h in hits),
           [h for h in hits if not h["ok"]])

    # AND FURTHER DOWN, THE TITLE MAY TAKE ITS OWN LINE — six controls and a
    # title cannot be made to fit a 1100px window — but the CONTROLS must stay
    # together, because a second control row is what the ask was about.
    for w in (1150, 1100):
        pg.set_viewport_size({"width": w, "height": 900})
        land(pg)
        n = pg.evaluate(ROWS, ".phead2 .hright")
        ck("%d: the controls are still one row (%d)" % (w, n), n == 1, n)
        ck("%d: nothing scrolls sideways" % w,
           not pg.evaluate("()=>document.documentElement.scrollWidth>innerWidth+1"))

    # ── 3. THE MARK THAT MOVED RATHER THAN WENT ──────────────────────
    print("\n3. the one outstanding thing that is not a person (§93.4)")
    pg.set_viewport_size({"width": 1512, "height": 900})
    land(pg)
    # THE DEMO IS CLEAR, so the state is MADE — otherwise this ships
    # unexercised and the chip could be broken for as long as every unit has a
    # custodian (§94.2).
    ck("with every unit covered, no chip is drawn",
       not pg.evaluate("()=>!!document.querySelector('.phead2 .pnocust')"))
    pg.evaluate("""()=>{ const k=Object.keys(UNIT_ROLES)[0];
        UNIT_ROLES[k].custodian = null; paint(); }""")
    pg.wait_for_timeout(500)
    ck("take a custodian away and it appears, on the row",
       pg.evaluate("""()=>{const c=document.querySelector('.phead2 .pnocust');
          return !!c && !!c.closest('.hright');}"""))
    ck("...saying which unit, on the hover",
       len(pg.eval_on_selector(".phead2 .pnocust", "e=>e.title") or "") > 20)
    ck("...and it is still one row with it there",
       pg.evaluate(ROWS, ".phead2 .hright") == 1)
    ck("...and one LINE, like everything else on the row (§88)",
       pg.eval_on_selector(".phead2 .pnocust", """e=>{
         const r=document.createRange(); r.selectNodeContents(e);
         const t=new Set([...r.getClientRects()].filter(x=>x.width>0)
                   .map(x=>Math.round(x.top)));
         return t.size;}""") == 1)

    # ── 4. THE DIALOG FITS THE WINDOW ────────────────────────────────
    print("\n4. the dialog is compact, and nothing is orphaned")
    for w, h in ((1920, 1080), (1512, 860), (1440, 780), (1280, 720), (1280, 640)):
        pg.set_viewport_size({"width": w, "height": h})
        land(pg)
        pg.evaluate("()=>document.querySelector('[data-pmenu=\"smo\"]').click()")
        pg.wait_for_timeout(250)
        pg.evaluate("()=>document.querySelector('[data-pedit=\"smo\"]').click()")
        pg.wait_for_timeout(700)
        d = pg.evaluate("""()=>{
          const bd=document.querySelector('#modal-b'),
                g=document.querySelector('#modal-b .pdlg'),
                m=document.querySelector('#overlay .modal');
          const cells=[...g.children].filter(x=>x.classList.contains('pdf'));
          // AN ORPHAN IS A ROW WITH FEWER CELLS THAN THE GRID HAS TRACKS, and
          // it is only an orphan if a WIDE cell is not what follows.
          const tracks=getComputedStyle(g).gridTemplateColumns.split(' ').length;
          const byRow={};
          [...g.children].forEach(x=>{const t=Math.round(x.getBoundingClientRect().top);
             (byRow[t]=byRow[t]||[]).push(x);});
          const short=Object.values(byRow).filter(v=>
             v.length<tracks && !v.some(x=>x.classList.contains('wide')
                                        || x.classList.contains('pdsect')));
          return {modalW:Math.round(m.getBoundingClientRect().width),
                  tracks:tracks, fields:cells.length,
                  scrolls: bd.scrollHeight>bd.clientHeight+2,
                  orphanRows: short.length,
                  fits: m.getBoundingClientRect().bottom<=innerHeight+1};}""")
        ck("%dx%d: it does not scroll" % (w, h), not d["scrolls"], d)
        ck("%dx%d: and the whole dialog is on screen" % (w, h), d["fits"], d)
        ck("%dx%d: no row leaves a cell empty" % (w, h), d["orphanRows"] == 0, d)
        ck("%dx%d: narrower than the platform's other dialogs" % (w, h),
           d["modalW"] < 940, d["modalW"])

    # ── 5. THE SENTENCE MOVED, IT DID NOT VANISH ─────────────────────
    print("\n5. the sign-in explanation is on the hover, not in the layout")
    ck("the value reads as not-editable",
       pg.evaluate("()=>!!document.querySelector('#modal-b .pdro')"))
    ck("...and it is not an input",
       pg.evaluate("()=>document.querySelector('#modal-b .pdro').tagName") != "INPUT")
    ck("...and the words are still there, in full, on the hover",
       "cannot be changed" in (pg.eval_on_selector("#modal-b .pdro", "e=>e.title") or ""),
       pg.eval_on_selector("#modal-b .pdro", "e=>e.title"))

    # ── 6. AND THE FIELDS STILL WRITE (§96) ──────────────────────────
    # A THREE-COLUMN GRID LOOKS IDENTICAL WHETHER OR NOT ANYTHING IS BOUND.
    # §96 is the whole reason this is asked: an editor wired to nothing renders
    # perfectly and discards every keystroke.
    print("\n6. the fields still write")
    pg.fill('#modal-b [data-ptitle="smo"]', "Chief Strategy Officer II")
    pg.evaluate("()=>document.activeElement.blur()")
    pg.wait_for_timeout(300)
    ck("a field typed into reaches the data",
       pg.evaluate("()=>personBy('smo').title") == "Chief Strategy Officer II",
       pg.evaluate("()=>personBy('smo').title"))
    pg.evaluate("()=>{const b=document.querySelector('[data-pdlg-close]'); if(b) b.click();}")
    pg.wait_for_timeout(500)
    ck("and the width mark comes off when it closes",
       not pg.evaluate("()=>document.getElementById('overlay').classList.contains('pdlg-on')"))

    ck("no console errors", not errs, errs[:3])
    b.close()

print("\n" + ("all good" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
