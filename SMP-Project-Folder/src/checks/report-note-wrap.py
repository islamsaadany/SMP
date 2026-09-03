"""THE REPORTING NOTE IS PROSE, AND IT HAD ONE LINE TO SAY IT IN (§271).

Islam: *"in the reporting the notes table needs to wrap around the text and
enable multiple lines."*

The note box was an `<input>`, which is ONE LINE by definition — so a real
explanation ran off the end and you scrolled sideways inside it, on the one
field the platform REQUIRES somebody to write (§105: a figure at risk cannot be
submitted without a note). Measured on the shipped build with a three-clause
sentence in it: **404px shown of 1334 needed** at 1500, and **209 of 1334** on a
supporting function at 1100.

WHAT IS ASSERTED, AND WHY IT IS NOT "THERE IS A TEXTAREA":

  · NOTHING IS CLIPPED with real prose in it, on all three shapes (§53.5, A15).
    A unit, a capability function and a function that plans in pillars draw the
    reporting note from two different builders, and a fix to one of them is how
    the halves drift.

  · THE BREAK SURVIVES BEING READ. A newline typed into the box is collapsed to
    a space by HTML, so without `pre-line` the box would promise a paragraph it
    never makes (§161.3, one field over) — asserted on the read-only render AND
    on the deck, which prints the same stored field to a projector.

  · IT REACHES THE ROW. A box that renders perfectly and discards what is typed
    into it looks identical to one that works (§96), and both hooks — `data-note`
    on a unit, `data-cnote` on a capability function — are asked separately,
    because §183 is exactly the fault of one of them resolving nothing.

  · AND A TITLE IS UNTOUCHED. §229 makes Enter COMMIT a one-line prose box, and
    a note is the opposite decision; the two live one class apart, so a build
    that widened either rule to the other is caught here rather than by somebody
    losing a paragraph into a workbook.

PROVE IT CAN FAIL (§94.5): run it against the shipped pre-§271 file —
`SMP_NOTE_HTML=../strategy-management-platform-v3.22.html` — where the clipping,
the newline and the pre-line assertions all go red.

Run:  SMP_CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \\
      python3 qa-run.py checks/report-note-wrap.py
"""
import json, os, pathlib, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = pathlib.Path(os.environ.get("SMP_NOTE_HTML") or
                    (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")).read_bytes()
BASE = json.loads((ROOT / "db/seed-state.json").read_text())
SW = (ROOT / "sw.js").read_bytes()
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
bad = 0

# Real prose, not a wall of x's: what somebody actually writes when a figure is
# off track. Long enough to need four lines in the column it is given.
NOTE = ("Supply was short through Q2 after the Alexandria warehouse move, so the "
        "shortfall is a timing effect rather than lost demand; the recovery plan is "
        "agreed with Distribution and the catch-up lands in Q4.")


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _s(self, body, ctype="application/json"):
        self.send_response(200); self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body))); self.end_headers()
        self.wfile.write(body)
    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._s(json.dumps({"ok": True, "state": BASE, "person": PERSON}).encode()); return
        if self.path.startswith("/api/auth"):
            self._s(json.dumps({"ok": True, "person": PERSON}).encode()); return
        if self.path.startswith("/raya-trade"):
            self._s(HTML, "text/html; charset=utf-8"); return
        # THE STUB SERVES THE WORKER (§231.5, §100.3). The platform registers
        # `sw.js` itself, and a stub answering it as html makes `register()`
        # reject on a content type — a failure of the CHECK that reads exactly
        # like a page error in the product.
        if self.path.startswith("/sw.js"):
            self._s(SW, "text/javascript; charset=utf-8"); return
        self._s(b"<!doctype html><title>gate</title>", "text/html; charset=utf-8")
    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0); self.rfile.read(n)
        self._s(b'{"ok":true,"unread":0,"threads":[],"chat":{"on":false},'
                b'"states":{},"said":{}}')


class S(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


srv = S(("127.0.0.1", 0), H)
port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % port

# The demo's three shapes, named rather than discovered: a seed that loses the
# pillars function fails loudly here instead of quietly dropping the case
# §183 was written for (§54.5). `merchandising` is the only one.
SHAPES = [("a unit", "mobile", "performance", False),
          ("a capability function", "fn:finance", "fnperf", True),
          ("a PILLARS function", "fn:merchandising", "fnperf", True)]


def open_reporting(pg, target, tab, folded):
    pg.goto(URL); pg.wait_for_timeout(2400)
    if folded:
        pg.evaluate("""(t)=>{const f=document.querySelector('#units [data-fold]');
            if(f && !document.querySelector('[data-u="'+t+'"]')) f.click();}""", target)
        pg.wait_for_timeout(400)
    pg.click('[data-u="%s"]' % target); pg.wait_for_timeout(500)
    pg.click('[data-s="%s"]' % tab); pg.wait_for_timeout(600)
    pg.evaluate("()=>{const b=document.querySelector('[data-s=report]'); if(b)b.click();}")
    pg.wait_for_timeout(900)
    return pg.evaluate("REPORTING") == target


with sync_playwright() as pw:
    b = pw.chromium.launch()
    ctx = b.new_context(viewport={"width": 1500, "height": 1000})
    pg = ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');}catch(e){}")

    # ── 1. THE BOX HOLDS WHAT IS WRITTEN IN IT, ON ALL THREE SHAPES ──────
    print("\n── 1. a note box that holds a real sentence")
    for width in (1500, 1100):
        ctx2 = b.new_context(viewport={"width": width, "height": 1000})
        p2 = ctx2.new_page()
        p2.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                           "sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
        for label, target, tab, folded in SHAPES:
            ck("%s: Report mode opens at %dpx" % (label, width),
               open_reporting(p2, target, tab, folded))
            r = p2.evaluate("""(note)=>{
              const el = document.querySelector('#panel [data-note], #panel [data-cnote]');
              if (!el) return {none:true};
              el.value = note;
              el.dispatchEvent(new Event('input', {bubbles:true}));
              el.dispatchEvent(new Event('change', {bubbles:true}));
              return null;}""", NOTE)
            p2.wait_for_timeout(700)
            r = p2.evaluate("""()=>{
              const el = document.querySelector('#panel [data-note], #panel [data-cnote]');
              if (!el) return {none:true};
              const box = el.getBoundingClientRect();
              return { tag: el.tagName,
                       shown: Math.round(box.width), needed: el.scrollWidth,
                       clipped: el.scrollWidth > el.clientWidth + 1,
                       lines: Math.round(box.height / parseFloat(getComputedStyle(el).lineHeight)),
                       scrolls: el.scrollHeight > el.clientHeight + 1 };}""")
            # The measurement is that NOTHING IS OUT OF SIGHT — never a height,
            # which is whatever the sentence and the column between them decide.
            ck("%s at %dpx: nothing is clipped sideways" % (label, width),
               not r.get("none") and not r["clipped"], r)
            ck("%s at %dpx: and it did not hide the rest below the fold of its own box"
               % (label, width), not r.get("none") and not r["scrolls"], r)
            ck("%s at %dpx: so the sentence takes more than one line" % (label, width),
               not r.get("none") and r["lines"] >= 2, r)
        ctx2.close()

    # ── 2. MULTIPLE LINES: ENTER, AND WHAT REACHES THE ROW ───────────────
    # Two halves of one claim. A box that takes a newline and drops it on the
    # way to the row is a box that "enables multiple lines" for as long as
    # nobody looks away (§96, §183).
    print("\n── 2. Enter makes a line, and the line lands on the row")
    for label, target, tab, folded in SHAPES:
        ck("%s: Report mode opens" % label, open_reporting(pg, target, tab, folded))
        hook = pg.evaluate("""()=>{
          const el = document.querySelector('#panel [data-note], #panel [data-cnote]');
          if (!el) return null;
          el.value = 'First line.'; el.focus();
          return { id: el.dataset.note || el.dataset.cnote,
                   hook: el.dataset.note ? 'data-note' : 'data-cnote',
                   h: Math.round(el.getBoundingClientRect().height) };}""")
        ck("%s: a note box is drawn" % label, hook is not None)
        if not hook:
            continue
        # A REAL KEY, not a synthesised value: whether Enter inserts a newline
        # or commits the box is decided by a handler, and only pressing it asks.
        pg.keyboard.press("End")
        pg.keyboard.press("Enter")
        pg.keyboard.type("Second line.")
        pg.wait_for_timeout(400)
        after = pg.evaluate("""(sel)=>{
          const el = document.querySelector('#panel [' + sel + ']');
          if (!el) return null;
          return { v: el.value, focused: document.activeElement === el,
                   h: Math.round(el.getBoundingClientRect().height) };}""", hook["hook"])
        ck("%s: Enter inserts a line rather than committing" % label,
           after and "\n" in after["v"], after)
        ck("%s: the box grows as the line is added" % label,
           after and after["h"] > hook["h"], [hook, after])
        ck("%s: and the cursor stays in it" % label, after and after["focused"], after)
        # ...and the two lines reach the STORED row, through this page's own hook.
        pg.evaluate("""(sel)=>{const el=document.querySelector('#panel ['+sel+']');
            el.dispatchEvent(new Event('change',{bubbles:true}));}""", hook["hook"])
        pg.wait_for_timeout(700)
        stored = pg.evaluate("""(id)=>{
          const subj = unitLike(current);
          let hit = subj ? findById(subj, id) : null;
          if (!hit && typeof capItemById === 'function') hit = capItemById(id);
          return hit ? (hit.obj.note || "") : null;}""", hook["id"])
        ck("%s: both lines reach the row (%s)" % (label, hook["hook"]),
           stored is not None and "\n" in stored, repr(stored))

    # ── 3. THE BREAK SURVIVES BEING READ ─────────────────────────────────
    # The reporting page to somebody without the grant, and every other surface
    # that prints a stored note, go through one builder (§53.5) — so this is
    # asked of the rendering, never of the six call sites.
    print("\n── 3. a break somebody typed survives being read")
    ck("a unit's Report mode opens", open_reporting(pg, "mobile", "performance", False))
    ro = pg.evaluate("""(note)=>{
      const el = document.querySelector('#panel [data-note]');
      el.value = note; el.dispatchEvent(new Event('change', {bubbles:true}));
      canEnterNote = function(){ return false; };
      paint();
      const s = document.querySelector('#panel td.notecol .why');
      if (!s) return null;
      return { ws: getComputedStyle(s).whiteSpace,
               text: s.textContent,
               clipped: s.scrollWidth > s.clientWidth + 1,
               lines: Math.round(s.getBoundingClientRect().height /
                                 parseFloat(getComputedStyle(s).lineHeight)) };}""",
                     "First line.\nSecond line.")
    ck("the read-only note is drawn", ro is not None)
    if ro:
        ck("...and keeps the newline", ro["ws"] in ("pre-line", "pre-wrap", "pre"), ro["ws"])
        ck("...and still wraps rather than running off the cell", not ro["clipped"], ro)
        ck("...so two typed lines read as two", ro["lines"] >= 2, ro)

    # THE DECK reads the same stored field. Rendered into the page rather than
    # into a detached element, because a detached node has no computed style
    # and the question here is exactly what the projector paints (§69).
    deck = pg.evaluate("""()=>{
      const u = UNITS.mobile;
      const m = (u.items[0].measures || [])[0];
      if (!m) return null;
      m.note = 'First line.\\nSecond line.';
      const box = document.createElement('div');
      box.style.cssText = 'position:absolute;left:-9999px;top:0;width:1280px';
      box.innerHTML = deckSlides(u);
      document.body.appendChild(box);
      const cells = [...box.querySelectorAll('td.dnote')]
        .filter(c => c.textContent.indexOf('First line.') >= 0);
      const out = cells.length
        ? { ws: getComputedStyle(cells[0]).whiteSpace, text: cells[0].textContent }
        : { none: true };
      box.remove();
      return out;}""")
    ck("the deck prints that note", deck and not deck.get("none"), deck)
    if deck and not deck.get("none"):
        ck("...with the break kept on the projector too",
           deck["ws"] in ("pre-line", "pre-wrap", "pre"), deck["ws"])

    # ── 4. A TITLE IS NOT A NOTE, AND §229 STILL HOLDS ───────────────────
    # Both ends of one decision. Asserted on the plan's own growing box, which
    # is one class away from the note's: a build that gave every `.grow` box a
    # paragraph key, or took the note's away, fails exactly here.
    print("\n── 4. and a plan title still commits on Enter (§229)")
    pg.goto(URL); pg.wait_for_timeout(2400)
    pg.click('[data-u="mobile"]'); pg.wait_for_timeout(500)
    pg.click('[data-s="strategy"]'); pg.wait_for_timeout(500)
    pg.evaluate("()=>{const b=document.querySelector('[data-sec=plan]'); if(b)b.click();}")
    pg.wait_for_timeout(700)
    pg.evaluate("()=>{const b=document.querySelector('[data-page]'); if(b)b.click();}")
    pg.wait_for_timeout(900)
    t0 = pg.evaluate("""()=>{
      const el = document.querySelector('#panel textarea.fld.grow');
      if (!el) return null;
      el.focus();
      return { v: el.value };}""")
    ck("the plan pen draws a growing title box", t0 is not None)
    if t0:
        pg.keyboard.press("End")
        pg.keyboard.press("Enter")
        t1 = pg.evaluate("""()=>{
          const el = document.querySelector('#panel textarea.fld.grow');
          return { v: el.value, focused: document.activeElement === el };}""")
        ck("a title takes no newline from Enter", "\n" not in t1["v"], repr(t1["v"]))
        ck("...it commits and lets go", not t1["focused"], t1)

    ck("no page error anywhere in the run", not errs, errs[:3])
    ctx.close(); b.close()
srv.shutdown()
print("\n%s  (%d failed)" % ("ALL GREEN" if not bad else "RED", bad))
raise SystemExit(1 if bad else 0)
