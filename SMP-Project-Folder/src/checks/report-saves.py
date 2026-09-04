"""REPORTING SAVES — ON A UNIT AND ON BOTH SHAPES OF FUNCTION (§183).

Islam: *"for the supporting functions the reporting doesn't autosave."*

He was right, and the fault was total: on a function that plans in PILLARS the
reporting page is drawn by the unit's own renderer, so its fields carry
`data-rep` and `data-note` — and both handlers resolved the subject with
`UNITS[current]`, which for "fn:merchandising" is **undefined**. `findById`
then read `u.ukey` off nothing and threw, so every figure and every note typed
there was discarded in silence: the value never reached the row, no save was
ever scheduled, and the only witness was a console nobody has open.

WHY NOTHING CAUGHT IT, and it is the reason this file exists:

  · `qa.py` asserts "performance/report/arrange (function): one page, a Report
    mode, and 3 sortables all bound" — which is true, and is about the page
    RENDERING. A15's own rule: walking a page proves it renders, and this was
    never a rendering fault.

  · A SAVE CANNOT BE SEEN OVER file:// AT ALL. `SYNC` is not live there, so
    `afterPaint()` posts nothing and "did it save" is unaskable — which is why
    this is served over HTTP with a stub that COUNTS THE POSTS (§94.11).

  · And the demo's only pillars function is `merchandising`. A check that
    tried one function would have picked a capability one and passed.

SO WHAT IS ASSERTED IS THE AGREEMENT, on all three shapes (§53.5, A15): typing
a figure reaches the row AND schedules a save, on a unit, on a capability
function, and on a pillars function. Never a count of controls — the fault
left every control in place.

PROVE IT CAN FAIL (§94.5): put `UNITS[...]` back in either handler in
shell.html, rebuild, and the pillars rows fail on both the value and the save.

Run:  SMP_CHROME=/opt/pw-browsers/chromium python3 qa-run.py checks/report-saves.py
"""
import json, os, pathlib, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = pathlib.Path(os.environ.get("SMP_REPORT_HTML") or
                    (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")).read_bytes()
SW = (ROOT / "sw.js").read_bytes()
BASE = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
POSTS = []
bad = 0


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
        # §231.5: THE WORKER IS A REAL FILE, SERVED AS THE GATE SERVES IT.
        # The platform registers `sw.js` itself now, so a stub that answers the
        # catch-all `text/html` makes `register()` reject on the content type —
        # a console error this file's own listener then counts as the product
        # throwing while reporting. It had been red for exactly that, on a
        # build that reports perfectly. `checks/office-chat.py` already carries
        # these three lines; this is that fix, in the file that needed it too.
        if self.path.startswith("/sw.js"):
            self._s(SW, "application/javascript"); return
        if self.path.startswith("/raya-trade"):
            self._s(HTML, "text/html; charset=utf-8"); return
        self._s(b"<!doctype html><title>gate</title>", "text/html; charset=utf-8")
    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(n)
        if self.path.startswith("/api/state"):
            POSTS.append(1); self._s(b'{"ok":true}'); return
        self._s(b'{"ok":true,"unread":0,"threads":[],"chat":{"on":false},"states":{},"said":{}}')


class S(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


srv = S(("127.0.0.1", 0), H)
port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % port

# The demo's three shapes. `merchandising` is the ONLY pillars function on this
# seed — named rather than discovered, so a seed that loses it fails loudly
# here instead of quietly dropping the case this file exists for (§54.5).
SHAPES = [
    ("a unit", "mobile", "performance", False),
    ("a capability function", "fn:finance", "fnperf", True),
    ("a PILLARS function", "fn:merchandising", "fnperf", True),
]

with sync_playwright() as pw:
    b = pw.chromium.launch()
    ctx = b.new_context(viewport={"width": 1500, "height": 980})
    pg = ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');}catch(e){}")

    pg.goto(URL); pg.wait_for_timeout(2600)
    ck("the stub is live, so a save can be seen at all", pg.evaluate("SYNC.isLive()"))
    ck("...and the demo still carries a function that plans in pillars",
       pg.evaluate("!!(FUNCTIONS.merchandising && fnPlansInPillars(FUNCTIONS.merchandising))"))

    for label, target, tab, folded in SHAPES:
        print("\n── %s (%s)" % (label, target))
        errs.clear()
        pg.goto(URL); pg.wait_for_timeout(2400)
        if folded:
            # The fold only exists where both lists are worth offering; a viewer
            # who sees one side has no switch to press.
            pg.evaluate("""(t)=>{const f=document.querySelector('#units [data-fold]');
                if(f && !document.querySelector('[data-u="'+t+'"]')) f.click();}""", target)
            pg.wait_for_timeout(400)
        pg.click('[data-u="%s"]' % target); pg.wait_for_timeout(500)
        pg.click('[data-s="%s"]' % tab); pg.wait_for_timeout(600)
        pg.evaluate("()=>{const b=document.querySelector('[data-s=report]'); if(b)b.click();}")
        pg.wait_for_timeout(900)
        ck("Report mode opens", pg.evaluate("REPORTING") == target, pg.evaluate("REPORTING"))

        # ── A FIGURE ──────────────────────────────────────────────────────
        # Which hook a page uses is the page's business (a unit and a pillars
        # function use `data-rep`, a capability function `data-crep`); what is
        # asserted is that whichever it draws, typing into it LANDS.
        POSTS.clear()
        got = pg.evaluate("""()=>{
          const el = document.querySelector('#panel [data-rep], #panel [data-crep]');
          if (!el) return null;
          const id = el.dataset.rep || el.dataset.crep;
          el.value = '77';
          el.dispatchEvent(new Event('change', {bubbles:true}));
          return { id: id, hook: el.dataset.rep ? 'data-rep' : 'data-crep' };}""")
        ck("a figure field is drawn", got is not None)
        if got:
            pg.wait_for_timeout(2400)
            val = pg.evaluate("""(id)=>{
              /* Asked of the STORED graph, never of the screen: the whole
                 fault was a screen that accepted a value and stored none. */
              let found = '(row not found)';
              const look = (rows, f) => (rows||[]).forEach(r => { if (r.id === id) found = r[f]; });
              (window.UNIT_KEYS||[]).forEach(k => { const u = UNITS[k] || {};
                look(u.keyObjectives, 'actual');
                (u.items||[]).forEach(p => { look(p.measures,'actual'); look(p.tactics,'actual'); }); });
              (window.FUNCTION_KEYS||[]).forEach(k => { const f = FUNCTIONS[k] || {};
                look(f.keyObjectives, 'actual');
                (f.items||[]).forEach(p => { look(p.measures,'actual'); look(p.tactics,'actual'); }); });
              (GROUP.capabilities||[]).forEach(c => { look(c.keyObjectives,'actual');
                (c.projects||[]).forEach(p => { look(p.deliverables,'actual');
                  look(p.outcomes,'actual'); look(p.milestones,'actual'); }); });
              return found;}""", got["id"])
            ck("...typing in it reaches the stored plan (%s)" % got["hook"],
               str(val).startswith("77"), "id=%s value=%r" % (got["id"], val))
            ck("...and a save is scheduled", len(POSTS) >= 1, len(POSTS))

        # ── AND THE NOTE BESIDE IT ────────────────────────────────────────
        # Not a second copy of the same assertion: the note is the half a
        # reporter MUST write when a figure is off track (§105's refusal), so
        # losing it silently makes that refusal impossible to satisfy.
        POSTS.clear()
        nid = pg.evaluate("""()=>{
          const el = document.querySelector('#panel [data-note], #panel [data-cnote]');
          if (!el) return null;
          const id = el.dataset.note || el.dataset.cnote;
          el.value = 'a note from the check';
          el.dispatchEvent(new Event('change', {bubbles:true}));
          return id;}""")
        if nid:
            pg.wait_for_timeout(2400)
            note = pg.evaluate("""(id)=>{
              let found = '(row not found)';
              const look = (rows) => (rows||[]).forEach(r => { if (r.id === id) found = r.note; });
              (window.UNIT_KEYS||[]).forEach(k => { const u = UNITS[k] || {};
                look(u.keyObjectives);
                (u.items||[]).forEach(p => { look(p.measures); look(p.tactics); }); });
              (window.FUNCTION_KEYS||[]).forEach(k => { const f = FUNCTIONS[k] || {};
                look(f.keyObjectives);
                (f.items||[]).forEach(p => { look(p.measures); look(p.tactics); }); });
              (GROUP.capabilities||[]).forEach(c => { look(c.keyObjectives);
                (c.projects||[]).forEach(p => { look(p.deliverables);
                  look(p.outcomes); look(p.milestones); }); });
              return found;}""", nid)
            ck("a note reaches the stored plan too", note == "a note from the check",
               "id=%s value=%r" % (nid, note))
            ck("...and it too schedules a save", len(POSTS) >= 1, len(POSTS))

        # THE FAULT ANNOUNCED ITSELF ONLY HERE, so it is asserted here.
        ck("nothing threw while reporting", not errs, errs[:1])

        # ── AND SAVE DRAFT ANSWERS (§183) ─────────────────────────────────
        # Islam: *"saving to draft keep saying saving and nothing happens but
        # when I exit and come back the entered number saved."* Both halves
        # were true. `save()` answered "busy" the instant Save draft was
        # pressed inside the autosave's flight, and the button drew "Saving…"
        # for it — a word with no follow-up. Since §170 made the autosave
        # leading-edge this is the ORDINARY case, not a rare race: the button
        # people reach for after typing is the one that lands mid-flight.
        #
        # Pressed IMMEDIATELY after the figure above, with no wait, so the
        # collision is made rather than hoped for (§94.2).
        pg.evaluate("""()=>{const el=document.querySelector('#panel [data-rep], #panel [data-crep]');
            if(el){ el.value='91'; el.dispatchEvent(new Event('change',{bubbles:true})); }}""")
        pressed = pg.evaluate("""()=>{const b=document.querySelector('[data-repsave]');
            if(!b) return false; b.click(); return true;}""")
        if pressed:
            word = "Saving\u2026"
            for _ in range(20):
                pg.wait_for_timeout(400)
                word = pg.evaluate("""()=>{const s=document.querySelector('[data-savesay]');
                    return s ? s.textContent.trim() : '(none)';}""")
                if word != "Saving\u2026":
                    break
            ck("Save draft answers rather than sitting on \u201cSaving\u2026\u201d",
               word != "Saving\u2026", word)
            # §220: THE ANSWER MOVED FROM A WORD TO THE BAR. Save draft now
            # CLOSES the report, so the repaint after a successful save turns
            # the bar into "Draft saved · Reopen" — which says the same thing
            # and, unlike a word beside a button the repaint replaces, is
            # still there a second later (§63.2's own reason, reversed).
            #
            # ASSERTED AS A PAIR, or a build that simply stopped answering
            # satisfies either half alone: parked in the DATA, and said on
            # the screen.
            landed = pg.evaluate("""()=>({
                parked: !!(REVIEW.parked || {})[REPORTING || ''] ||
                        Object.keys(REVIEW.parked || {}).length > 0,
                state: (document.querySelector('.rc-state') || {}).textContent || ''
              })""")
            ck("...and the answer is that it parked the report",
               landed["parked"] is True, landed)
            ck("...and the bar says Draft saved",
               "Draft saved" in landed["state"], landed)

    b.close()
srv.shutdown()

print(("\n%d FAILED" % bad) if bad else "\nreport-saves: OK")
raise SystemExit(1 if bad else 0)
