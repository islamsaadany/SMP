#!/usr/bin/env python3
"""§231 — the save says so in the corner, a refusal is a dialog with two doors,
and the group's card says how the units spread.

WHAT IS ASSERTED, AND WHY IT IS NOT A LIST OF PIXELS (§94.8):

  · THE SAVE SPEAKS AND THE GOOD NEWS LEAVES. A save that works says "Saved"
    and takes itself away; a save that FAILS says so and does NOT, because the
    whole finding behind §171 was that a failure looking like a success is the
    worst thing this platform can do — and a red message that tidied itself
    away would be exactly that with a longer fuse. Both halves are measured,
    or a build that showed nothing at all would satisfy "it does not linger".

  · THE STRIP AGREES WITH THE PAGE IT IS ON. The counts are asserted against
    `unitObjectives()` band by band — never against a number — so a tenant
    with different bands, different units or a different scale stays green and
    a strip that starts inventing its own arithmetic does not. The same rule
    the `whereNext()` check already follows (§155).

  · EVERY NAME IN THE PANEL IS A DOOR. A count somebody cannot act on makes
    work (§16.7), so each name carries `data-go` — the attribute wired
    document-wide — and the panel is PRESSED rather than read, because a
    control that renders and does nothing passes every assertion short of a
    click (§96, §150.1).

  · THE PANEL IS REACHABLE, NOT MERELY PRESENT. `elementFromPoint` at its own
    corner must return the panel: §93.4's discipline, three times learned, and
    the one that catches a popup clipped by an overflow ancestor or covered by
    the card above it.

PROVED ABLE TO FAIL (§94.5): run against the pre-§231 build it reports NINE
failures — no `#savetoast` at all, the refusal drawn in the banner rather than
the dialog, and no `.uspread` anywhere. Sections 1, 2 and 3 each go red, which
is the point: three separate claims, three separate ways to notice they have
stopped being true.
"""
import json, os, sys, threading, http.server, socketserver
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[3]
PLATFORM = ROOT / "SMP-Project-Folder/strategy-management-platform-v3.22.html"
STATE = json.loads((ROOT / "db/seed-state.json").read_text())

FAILED = []
def ck(what, cond, detail=""):
    print(("  ok      " if cond else "  FAIL    ") + what +
          ("" if cond else "  — " + str(detail)[:200]))
    if not cond: FAILED.append(what)

# The refusal the server sends, in the shape api/state.js actually answers with
# (§100.3: a stub that does not model the server tests something the product
# does not do).
REFUSAL = {"ok": False,
           "refusals": ["A project’s milestones (marketing) cannot be changed here."],
           "refusedChanges": [{"why": "capPlan", "kind": "milestone",
                               "target": "fn:marketing",
                               "rows": [{"id": "MKT01-M1",
                                         "name": "Perception study fielded",
                                         "field": "finish"}]}],
           "undoable": True}

MODE = {"post": 200}


class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=str(ROOT), **k)
    def log_message(self, *a): pass
    def _json(self, code, body):
        b = json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        if self.path.startswith("/api/state"):
            return self._json(200, {"ok": True, "state": STATE,
                                    "person": {"key": "smo", "name": "Mohamed Essam",
                                               "role": "super"}})
        if self.path.startswith("/api/chat"):
            return self._json(200, {"ok": True, "messages": [], "unread": 0,
                                    "state": "open", "cfg": {"on": True}})
        if self.path == "/raya-trade":
            self.path = "/" + str(PLATFORM.relative_to(ROOT))
        return super().do_GET()
    def do_POST(self):
        ln = int(self.headers.get("Content-Length") or 0)
        self.rfile.read(ln)
        if self.path.startswith("/api/chat"):
            return self._json(200, {"ok": True, "messages": [], "unread": 0,
                                    "state": "open"})
        if MODE["post"] == 403: return self._json(403, REFUSAL)
        if MODE["post"] != 200: return self._json(MODE["post"], {"ok": False})
        return self._json(200, {"ok": True})


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % PORT


def toast(pg):
    return pg.evaluate("""()=>{const t=document.getElementById('savetoast');
        return t && !t.hidden ? (t.className + '|' + t.textContent) : "";}""")


def touch(pg, mark):
    """Through the real path — the graph, then paint(), which ends in
       afterPaint(). Never save() directly (§94.5's own example)."""
    pg.evaluate("GROUP.org = %s; paint();" % json.dumps(mark))
    pg.wait_for_timeout(1500)


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    # The welcome screen covers the viewport, so every click lands on it and
    # every probe reads it instead of the page (§167.2). Suppressed as a
    # RETURNING viewer does, in an init script — after goto is too late.
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');"
                       "sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    pg.goto(URL); pg.wait_for_timeout(2600)
    pg.evaluate("()=>{try{WELCOME.dismiss()}catch(e){}}")
    pg.wait_for_timeout(400)
    ck("the platform hydrated", pg.evaluate("()=>SYNC.isLive()") is True)

    # ── 1 · THE SAVE'S OWN WORD ──────────────────────────────────────────
    print("\n1 · the save says so, and the good news leaves")
    touch(pg, "spread-ok-1")
    said = toast(pg)
    ck("a save that lands says Saved", "Saved" in said and "ok" in said, said or "(nothing)")
    pg.wait_for_timeout(2900)
    ck("...and takes itself away", toast(pg) == "", toast(pg))

    MODE["post"] = 500
    touch(pg, "spread-bad-1")
    said = toast(pg)
    ck("a save that fails says so", "Not saved" in said and "bad" in said, said or "(nothing)")
    ck("...and says the work is still here", "still on this page" in said, said)
    pg.wait_for_timeout(3200)
    ck("...and does NOT take itself away", "Not saved" in toast(pg), toast(pg))
    pg.evaluate("()=>{const b=document.querySelector('[data-toast-why]'); if(b) b.click();}")
    pg.wait_for_timeout(300)
    ck("...and the status is one press away", "500" in toast(pg), toast(pg))

    # ── 2 · THE REFUSAL IS A DIALOG WITH TWO DOORS ───────────────────────
    print("\n2 · a refusal stops the work and offers a way on")
    MODE["post"] = 403
    touch(pg, "spread-refuse-1")
    pg.wait_for_timeout(1200)
    ck("the dialog is open", pg.evaluate("()=>!!document.querySelector('.overlay.on')"))
    body = pg.evaluate("()=>{const m=document.getElementById('modal-b');return m?m.innerText:'';}")
    ck("...carrying the server's own sentence",
       "cannot be changed here" in body, body[:160])
    ck("...and naming the refused line", "Perception study fielded" in body, body[:200])
    ck("...with Put back still offered",
       pg.evaluate("()=>!!document.getElementById('refused-keep')"))
    ck("...and Discard still offered",
       pg.evaluate("()=>!!document.getElementById('refused-undo')"))
    ck("...and both new doors drawn",
       pg.evaluate("()=>!!document.getElementById('refused-ask')") and
       pg.evaluate("()=>!!document.getElementById('refused-bug')"))
    # PRESSED, not read: a button that renders and does nothing passes every
    # assertion short of a click (§96).
    pg.click("#refused-ask"); pg.wait_for_timeout(900)
    ck("Ask closes the dialog",
       not pg.evaluate("()=>!!document.querySelector('.overlay.on')"))
    msg = pg.evaluate("()=>{const t=document.getElementById('chatsay');return t?t.value:'';}")
    ck("...and loads the corner with a message", bool(msg.strip()), msg[:80])
    ck("...that names the line refused", "Perception study fielded" in msg, msg[:200])
    ck("...and names where they were", "Performance" in msg or "Strategy" in msg, msg[:200])
    # THE MESSAGE IS LOADED, NEVER SENT: writing in somebody's name without
    # their reading it is how a person asks for something they did not mean.
    ck("...and nothing was sent on their behalf",
       pg.evaluate("""()=>{const n=document.querySelectorAll('.chmsg,.chatmsg').length;
           return n === 0;}"""), "messages already in the thread")
    ck("...and no navigation furniture leaked into it",
       "▾" not in msg and "▸" not in msg, msg[:120])

    # ── 3 · HOW THE UNITS SPREAD ─────────────────────────────────────────
    print("\n3 · the group's card says how the units spread")
    MODE["post"] = 200
    pg.evaluate("()=>{location.hash='';}")
    pg.goto(URL); pg.wait_for_timeout(2600)
    pg.evaluate("()=>{try{WELCOME.dismiss()}catch(e){}}"); pg.wait_for_timeout(400)
    ck("the strip is drawn", pg.evaluate("()=>!!document.querySelector('.uspread')"))
    # THE AGREEMENT, NEVER THE NUMBER. Asked of the platform's own function, so
    # a tenant with other bands, units or a different scale stays green.
    truth = pg.evaluate("""()=>{
        const out = {};
        UNIT_KEYS.forEach(function(k){
          const u = UNITS[k]; if(!u) return;
          const v = unitObjectives(u); if(v == null) return;
          const b = band(v); out[b] = (out[b]||0) + 1;
        });
        return out;}""")
    drawn = pg.evaluate("""()=>{
        const out = {};
        document.querySelectorAll('.uspread-seg').forEach(function(s){
          const n = parseInt(s.querySelector('.uspread-bar').textContent, 10);
          const names = s.querySelectorAll('.uspread-pop button').length;
          out[s.querySelector('.uspread-bar').style.background] = [n, names];
        });
        return out;}""")
    total_drawn = sum(v[0] for v in drawn.values())
    total_names = sum(v[1] for v in drawn.values())
    ck("every unit with a score is in the strip",
       total_drawn == sum(truth.values()), (total_drawn, truth))
    ck("...and every one of them is named in a panel",
       total_names == total_drawn, (total_names, total_drawn))
    ck("...and a band holding nobody is not drawn",
       len(drawn) == len([k for k in truth if truth[k]]), (list(drawn), truth))

    seg = pg.query_selector(".uspread-seg")
    seg.hover(); pg.wait_for_timeout(350)
    # REACHABLE, NOT MERELY PRESENT (§93.4): a panel clipped by an overflow
    # ancestor renders perfectly and cannot be pressed.
    ck("the panel opens on hover and is reachable",
       pg.evaluate("""()=>{const p=document.querySelector('.uspread-pop');
           if(!p || getComputedStyle(p).display==='none') return false;
           const r=p.getBoundingClientRect();
           const el=document.elementFromPoint(r.left+10, r.top+10);
           return !!(el && p.contains(el));}"""))
    ck("...and stays inside the window",
       pg.evaluate("""()=>{const p=document.querySelector('.uspread-pop');
           const r=p.getBoundingClientRect();
           return r.left >= 0 && r.right <= innerWidth;}"""))
    # PRESSED: `data-go` is the attribute wired document-wide; `data-u` is
    # scoped to the chrome and would look navigable and do nothing (§155.1).
    want = pg.evaluate("""()=>{const b=document.querySelector('.uspread-pop button');
        return b ? b.getAttribute('data-go') : null;}""")
    pg.evaluate("()=>{const b=document.querySelector('.uspread-pop button'); b.click();}")
    pg.wait_for_timeout(1200)
    ck("a name in the panel opens that unit",
       pg.evaluate("()=>current") == want, (pg.evaluate("()=>current"), want))

    # No sideways scroll at any width — a strip that pushed the page out would
    # drag every sticky element with it (§27.2).
    print("\n4 · at every width")
    # §173 REMEMBERS WHERE YOU WERE, so the reload after section 3's click
    # lands on that UNIT and the group's card — the one under test — is not on
    # the page at all. Put the state back before measuring (§94.2), which is
    # the check's job and not a fault in the product.
    for w in (1920, 1440, 1180, 1000, 860):
        pg.set_viewport_size({"width": w, "height": 900})
        pg.goto(URL); pg.wait_for_timeout(1800)
        pg.evaluate("()=>{try{WELCOME.dismiss()}catch(e){}}"); pg.wait_for_timeout(300)
        pg.evaluate("""()=>{const b=document.querySelector('#units [data-go="group"]')
            || document.querySelector('#units [data-u="group"]');
            if(b) b.click();}""")
        pg.wait_for_timeout(900)
        s = pg.query_selector(".uspread-seg:last-child")
        if s: s.hover(); pg.wait_for_timeout(250)
        ck("%d: the strip holds, the panel stays in, nothing scrolls sideways" % w,
           pg.evaluate("""()=>{const st=document.querySelector('.uspread');
               if(!st) return false;
               const pops=[...document.querySelectorAll('.uspread-pop')]
                 .filter(p=>getComputedStyle(p).display!=='none');
               const inside = !pops.length || pops.every(function(p){
                 const r=p.getBoundingClientRect();
                 return r.left >= 0 && r.right <= innerWidth; });
               const d=document.documentElement;
               return inside && d.scrollWidth <= d.clientWidth + 1;}"""))

    ck("nothing threw", not errs, errs[:2])
    b.close()

srv.shutdown()
print("\nFAILURES: %d" % len(FAILED) if FAILED else "\nsave-and-spread: OK")
sys.exit(1 if FAILED else 0)
