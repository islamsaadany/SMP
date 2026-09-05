"""THE SETTINGS PANEL SCROLLS INSIDE ITSELF (§294).

Islam: *"there is no scrolling inside the settings pan while there is a uselss
scrolling in the main page."*

WHY THIS CANNOT BE PART OF `qa.py`. The chat does not exist over `file://` at
all — `CHAT.mount()` refuses without a server (§94.11) — so the panel this file
is about cannot be opened there, and a build that had lost the whole feature
would go green every time. It is served over HTTP with a stub, like
`checks/office-chat.py`, which is the only condition under which the control
exists.

AND THE STRIP IS MEASURED IN PIXELS, NEVER WITH `elementFromPoint`. The pinned
heading covers the panel's own 6px of padding with a BOX-SHADOW, and a shadow
paints without hit-testing — so a DOM probe returns the row sliding behind it
and calls a correct build broken. §53.7 records exactly this about a `::before`,
and this file walked into it once before it was written down here too.

Run: SMP_CHROME=/opt/pw-browsers/chromium python3 qa-run.py checks/chat-settings-scroll.py
     SMP_BUILT=/path/to/other.html  points it at another build.
"""
import base64, io, json, os, pathlib, threading, http.server, socketserver, sys
from playwright.sync_api import sync_playwright
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[3]
BUILT = os.environ.get("SMP_BUILT") or str(
    ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")
HTML = pathlib.Path(BUILT).read_bytes()
SW = (ROOT / "sw.js").read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
VAPID = base64.urlsafe_b64encode(b"\x04" + bytes(range(64))).decode().rstrip("=")

CFG = {"on": True, "shots": True, "promise": "Usually answers the same day",
       "beat": 4000, "assistant": False, "popup": True, "notify": False, "away": 10}
QUEUE = [{"person_key": "hend", "person_name": "Hend Farouk", "live_name": "Hend Farouk",
          "waiting": True, "last_at": "2026-08-25T09:19:00Z", "here_at": None,
          "unit_key": "mobile", "fn_key": None, "title": "Head of Mobile", "gone": False,
          "unread": 1, "last_body": "A line.", "last_from_office": False,
          "last_by": "Hend Farouk", "flagged": 0}]
# THE PANEL AT ITS TALLEST IS THE PANEL THIS IS ABOUT. It stands at 521px until
# the two diagnostics have been run and 725px after — the state Islam sent —
# so the check RUNS them rather than measuring the short panel and passing.
TEST = [{"name": "The switch", "state": "ok", "detail": "The assistant answers first"},
        {"name": "The knowledge base", "state": "ok", "detail": "43 how-tos"},
        {"name": "The API key", "state": "fail", "detail": "No GEMINI_API_KEY here."}]
PUSHSTEPS = [{"name": "The chat", "state": "ok", "detail": "ON"},
             {"name": "Notifications", "state": "ok", "detail": "Switched on for the company."},
             {"name": "The sending library", "state": "ok", "detail": "LOADED"},
             {"name": "The signing key", "state": "ok", "detail": "PRESENT"},
             {"name": "This browser", "state": "ok", "detail": "Allowed and registered"},
             {"name": "The send", "state": "ok", "detail": "1 of 1 device took it"}]
GATE = b"<!doctype html><title>Sign in</title><h1 id='gate'>Sign in</h1>"

bad = [0]


def ck(w, ok, x=""):
    if not ok:
        bad[0] += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def _s(self, c, b, t):
        self.send_response(c); self.send_header("Content-Type", t)
        self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)

    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._s(200, json.dumps({"ok": True, "state": SEED, "person": PERSON}).encode(),
                    "application/json"); return
        # §231.5: the worker is a real file, served as the gate serves it, or
        # `register()` rejects on the content type and reads as the product
        # throwing (§100.3).
        if self.path.startswith("/sw.js"):
            self._s(200, SW, "application/javascript"); return
        if self.path.startswith("/raya-trade"):
            self._s(200, HTML, "text/html; charset=utf-8"); return
        self._s(200, GATE, "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        body = json.loads(self.rfile.read(n) or b"{}")
        if not self.path.startswith("/api/chat"):
            self._s(200, b'{"ok":true}', "application/json"); return
        a = body.get("action")
        if a == "assistantTest":
            self._s(200, json.dumps({"ok": True, "steps": TEST}).encode(), "application/json"); return
        if a == "pushTest":
            self._s(200, json.dumps({"ok": True, "steps": PUSHSTEPS}).encode(), "application/json"); return
        if a == "queue":
            self._s(200, json.dumps({"ok": True, "office": True, "threads": QUEUE,
                                     "chat": CFG, "waiting": 1, "flagged": 0,
                                     "hereMinutes": 5, "mail": False}).encode(),
                    "application/json"); return
        self._s(200, json.dumps({"ok": True, "chat": CFG, "vapid": VAPID,
                                 "messages": [], "unread": 0, "thread": None}).encode(),
                "application/json")


class S(socketserver.ThreadingTCPServer):
    allow_reuse_address = True; daemon_threads = True


srv = S(("127.0.0.1", 0), H)
URL = "http://127.0.0.1:%d/raya-trade" % srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()


def drive(pg, theme="light"):
    # The tour and the welcome screen each cover the page, so every click here
    # would land on their overlay (§167). Suppressed as a RETURNING viewer has
    # it — never by reaching into either, which both have their own checks.
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    pg.goto(URL, wait_until="networkidle"); pg.wait_for_timeout(2500)
    if theme == "dark":
        pg.evaluate("()=>{try{THEME.set('dark')}catch(e){"
                    "document.documentElement.setAttribute('data-theme','dark')}}")
        pg.wait_for_timeout(400)
    pg.click('[data-md="setup"]'); pg.wait_for_timeout(900)
    pg.click('[data-setupgo="chat"]'); pg.wait_for_selector("#chinbox", timeout=8000)
    pg.wait_for_timeout(800)


def openpanel(pg):
    pg.evaluate("()=>{const b=document.querySelector('[data-chsetmenu]');"
                "if(b && b.getAttribute('aria-expanded')!=='true') b.click();}")
    pg.wait_for_timeout(400)
    for sel in ("[data-chtest]", "[data-pushtest]"):
        pg.evaluate("(s)=>{const b=document.querySelector(s); if(b) b.click();}", sel)
        pg.wait_for_timeout(700)


PANEL = """() => {
  const p = document.querySelector('.hmenu-panel.chset');
  if (!p) return { none:true };
  const r = p.getBoundingClientRect(), cs = getComputedStyle(p), d = document.documentElement;
  return { h:Math.round(r.height), top:Math.round(r.top), bottom:Math.round(r.bottom),
           width:Math.round(r.width), off:Math.round(r.bottom - innerHeight),
           inside:p.scrollHeight - p.clientHeight,
           sideways:p.scrollWidth - p.clientWidth,
           page:d.scrollHeight - d.clientHeight, ov:cs.overflowY };
}"""

with sync_playwright() as pw:
    b = pw.chromium.launch()

    # ── 1 · IT SCROLLS INSIDE ITSELF, AND THE PAGE DOES NOT ──────────────
    # The two halves of the report are one fact: the panel had no scroll of
    # its own, so its overrun became the page's. Both ends are asserted, or a
    # build that merely made the panel shorter would satisfy the second.
    print("\n1 · the panel scrolls inside itself, and the page does not")
    pg = b.new_page(viewport={"width": 1400, "height": 760})
    drive(pg); openpanel(pg)
    m = pg.evaluate(PANEL)
    ck("the panel is there and open", not m.get("none"), m)
    ck("it has a scroll of its own", m["inside"] > 0 and m["ov"] == "auto", m)
    ck("it ends inside the window", m["off"] <= 0, m)
    ck("and the page carries no scroll at all", m["page"] == 0, m)
    # AND IT MUST NOT HAVE GAINED A SIDEWAYS ONE. Setting `overflow-y` to a
    # non-visible value computes `overflow-x:auto` too, so a child one pixel
    # too wide would now scroll horizontally where before it simply hung out.
    ck("and it did not gain a sideways scroll", m["sideways"] == 0, m)
    pg.close()

    # ── 2 · THE STRIP ABOVE THE PINNED HEADING, IN PIXELS ────────────────
    # `.hmenu-panel` carries 6px of padding and a sticky box sticks to the
    # PADDING edge, so the heading covers that strip with a box-shadow. A
    # shadow paints without hit-testing, so this is read off the painted
    # pixels — a DOM probe returns the row behind it and calls this broken.
    print("\n2 · nothing shows above the pinned heading, or below the fade")
    for theme in ("light", "dark"):
        pg = b.new_page(viewport={"width": 1400, "height": 760})
        drive(pg, theme); openpanel(pg)
        pg.evaluate("()=>{document.querySelector('.chset').scrollTop=180;}")
        pg.wait_for_timeout(300)
        g = pg.evaluate("""()=>{const p=document.querySelector('.chset'),
          pr=p.getBoundingClientRect(), h=p.querySelector('.chset-h').getBoundingClientRect();
          const cs=getComputedStyle(p);
          return {L:pr.left,T:pr.top,R:pr.right,HT:h.top,
                  pos:getComputedStyle(p.querySelector('.chset-h')).position,
                  fade:getComputedStyle(p,'::after').height,
                  bg:cs.backgroundColor,
                  pad:parseFloat(cs.paddingTop), bord:parseFloat(cs.borderTopWidth)};}""")
        ck("[%s] the heading is genuinely pinned" % theme, g["pos"] == "sticky", g)
        ck("[%s] the fade is drawn" % theme, g["fade"] == "22px", g)
        # THE STRIP EXISTS BECAUSE THE PADDING DOES — asserted as the two
        # AGREEING (§94.8), so zeroing one without the other goes red here
        # rather than silently leaving a gap.
        ck("[%s] the heading sits exactly the panel's padding down" % theme,
           abs((g["HT"] - g["T"]) - (g["pad"] + g["bord"])) <= 1, g)
        strip_h = int(round(g["HT"] - g["T"] - g["bord"]))
        if strip_h > 0:
            # Inset from the sides so the panel's own rounded corners, which
            # are legitimately not the surface colour, are not sampled.
            shot = pg.screenshot(clip={"x": g["L"] + 14, "y": g["T"] + g["bord"],
                                       "width": g["R"] - g["L"] - 28, "height": strip_h})
            im = Image.open(io.BytesIO(shot)).convert("RGB")
            want = tuple(int(v) for v in g["bg"].strip("rgb()").split(",")[:3])
            offs = [c for n, c in (im.getcolors(100000) or [])
                    if max(abs(a - bq) for a, bq in zip(c, want)) > 3]
            ck("[%s] the strip is the panel's own surface, every pixel" % theme,
               not offs, offs[:3])
        else:
            ck("[%s] the strip is the panel's own surface, every pixel" % theme,
               True, "no padding, so no strip")
        pg.close()

    # ── 3 · THE FOOT IS REACHABLE (§108.6's own recorded fault) ──────────
    # That section gave the fade's height back with a negative margin, which
    # took it off the SCROLLABLE range and stranded the last rows — this
    # element's own fault arriving by the other road. So the last row, and
    # the note behind its mark, are both asserted reachable.
    print("\n3 · the foot of the panel is reachable")
    pg = b.new_page(viewport={"width": 1400, "height": 760})
    drive(pg); openpanel(pg)
    r = pg.evaluate("""()=>{const p=document.querySelector('.chset');
      p.scrollTop=p.scrollHeight; const pr=p.getBoundingClientRect();
      const rows=[...p.querySelectorAll('.chset-row')];
      const last=rows[rows.length-1].getBoundingClientRect();
      const lastOK = last.bottom<=pr.bottom+1 && last.top>=pr.top-1;
      const tips=[...p.querySelectorAll('.tip')]; const t=tips[tips.length-1];
      t.click(); p.scrollTop=p.scrollHeight;
      const row=t.closest('.chset-row').getBoundingClientRect();
      const s=getComputedStyle(t,'::after');
      const top=row.bottom+7,
        h=parseFloat(s.height)+parseFloat(s.paddingTop)+parseFloat(s.paddingBottom);
      return { lastRow:lastOK, note: top>=pr.top-1 && top+h<=pr.bottom+1,
               nrows:rows.length };}""")
    ck("the last row scrolls fully into view", r["lastRow"], r)
    ck("...and so does the note behind its mark", r["note"], r)
    pg.close()

    # ── 4 · THE PAGE THAT NEEDS NO SCROLL STILL HAS NONE ─────────────────
    # Swept, because the fault only showed below a certain height and a check
    # at one window would have passed on the shipped build (§27.1).
    print("\n4 · at every height where the page needs no scroll, it has none")
    for w, hh in ((1600, 1000), (1400, 900), (1400, 800), (1400, 760), (1280, 700)):
        pg = b.new_page(viewport={"width": w, "height": hh})
        drive(pg)
        shut = pg.evaluate("()=>{const d=document.documentElement;"
                           "return d.scrollHeight-d.clientHeight;}")
        openpanel(pg)
        m = pg.evaluate(PANEL)
        ck("%dx%d: shut %dpx, open %dpx — the panel adds nothing"
           % (w, hh, shut, m["page"]), shut == 0 and m["page"] == 0, m)
        pg.close()

    # ── 4b · THE LABEL SAYS THE UNIT, NOT THE NUMBER (§296) ─────────────
    # Islam: *"it should say minuites oly as the 10 is identified in the box."*
    # BOTH ENDS: the words beside the box lose the count, and the SENTENCE on
    # the hover keeps it — a label beside a field and a rule being explained
    # are two jobs, and a build that stripped the number from both would
    # satisfy half of this and read wrongly (§87's twins, one row apart).
    print("\n4b · the minutes label")
    pg = b.new_page(viewport={"width": 1400, "height": 950})
    drive(pg); openpanel(pg)
    lab = pg.evaluate("""()=>{const s=document.querySelector('.chset-away .chset-unit');
      const n=document.querySelector('[data-chaway]');
      const r=[...document.querySelectorAll('.chset-row')].find(x=>/Email after/.test(x.textContent));
      const t=r&&r.querySelector('[data-tip]');
      return { unit:s?s.textContent.trim():null, box:n?n.value:null,
               tip:t?t.getAttribute('data-tip'):null };}""")
    ck("the words beside the box are the unit alone",
       lab["unit"] in ("minute", "minutes"), lab)
    ck("...and the box is still the thing holding the number", lab["box"], lab)
    ck("the hover sentence keeps its number",
       bool(lab["tip"]) and (lab["box"] + " minute") in lab["tip"], (lab["tip"] or "")[:80])
    pg.close()

    # ── 4c · THE DIAGNOSTIC ARRIVES FOLDED (§296, Islam's B) ─────────────
    # MEASURED AS PAINT, NOT AS A DOM QUERY. `getClientRects()` returns boxes
    # for the children of a CLOSED <details> in Chromium, so a probe asking
    # that reports three visible steps over a block 39px tall and calls a
    # correct build broken — the same fault as §294.1's box-shadow, by another
    # road. `checkVisibility()` and the block's own height are the truth.
    print("\n4c · the diagnostic folds")
    pg = b.new_page(viewport={"width": 1400, "height": 950})
    drive(pg); openpanel(pg)
    st = pg.evaluate("""()=>{const d=document.querySelector('details.chtest');
      if(!d) return {none:true};
      const p=document.querySelector('.chset'), sum=d.querySelector('summary.chtest-h');
      const rows=[...d.querySelectorAll('.chtest-r')];
      const shut={open:d.open, h:Math.round(d.getBoundingClientRect().height),
        seen:rows.filter(r=>r.checkVisibility&&r.checkVisibility()).length,
        verdict:sum?sum.textContent.trim():null,
        content:p.scrollHeight, mustScroll:p.scrollHeight-p.clientHeight};
      sum.click();
      const open={open:d.open, h:Math.round(d.getBoundingClientRect().height),
        seen:rows.filter(r=>r.checkVisibility&&r.checkVisibility()).length,
        content:p.scrollHeight};
      return {shut, open, steps:rows.length};}""")
    ck("the result is a real disclosure", not st.get("none"), st)
    ck("it arrives FOLDED", st["shut"]["open"] is False, st["shut"])
    ck("the verdict still reads while folded", bool(st["shut"]["verdict"]), st["shut"])
    ck("and not one step is painted", st["shut"]["seen"] == 0, st["shut"])
    ck("pressing the verdict shows every step",
       st["open"]["open"] is True and st["open"]["seen"] == st["steps"], st["open"])
    # THE REASON IT MATTERS TO §294: folded, the panel stops needing a scroll.
    ck("folded, the panel needs no scroll at all", st["shut"]["mustScroll"] == 0, st["shut"])
    ck("...and opening it is what makes the scroll necessary",
       st["open"]["content"] > st["shut"]["content"], st)
    pg.close()

    # ── 5 · AND WHERE THE PAGE LEGITIMATELY SCROLLS, IT STILL DOES ───────
    # Below ~1100px the Setup rail stops being a side column and stacks above
    # the pane, so the page scrolls by design (§167) — and that scroll is the
    # only way to reach the rest of it. A build that capped the page would
    # pass every assertion above and put half the Inbox out of reach, so the
    # presence of that scroll is asserted rather than assumed (§94.2).
    print("\n5 · and the scroll that is useful is still there")
    # REWRITTEN, NOT DELETED (§218). This asserted 1000x900, where the page
    # scrolled 414px — and §296 established that was the REGRESSION rather than
    # the design: `.setupsplit` wears `.split`, so it was stacking at 1200 and
    # at 1000 the page now correctly scrolls nothing. The PROPERTY is unchanged
    # — where the page legitimately stacks, its scroll must survive — and the
    # width where that is true is below Setup's own 900px band.
    pg = b.new_page(viewport={"width": 860, "height": 880})
    drive(pg)
    shut = pg.evaluate("()=>{const d=document.documentElement;"
                       "return d.scrollHeight-d.clientHeight;}")
    ck("860x880: the stacked page still scrolls with the panel shut", shut > 0, shut)
    pg.close()
    b.close()

srv.shutdown()
print("\n%d failures" % bad[0])
sys.exit(1 if bad[0] else 0)
