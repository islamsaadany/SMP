"""THE ARROWS GO, AND THE TABLE READS AS FIXED (rule 1c, §41.9).

Islam, of the cell he had just opened: "on opening something the arrow appears,
no need for the arrow. and for the roles as well no need for the arrow showng
the the box is a drop down box .. the table in general should look everything
fixed and not editable until I made the double click which opens the box either
for writing or a drop box as now."

MEASURED BEFORE IT WAS DRAWN, and the measurement is what shaped the proposal:

  · the open drop cell stands at 59.6px where every other row is 38.6 — the
    arrow cannot fit beside the word and falls to a second line, which is
    exactly what he photographed;
  · opening a drop cell takes THREE acts — double-click, press the box that
    appears, pick — so the arrow is announcing a press he has already made;
  · the Roles column draws its box on all 33 rows at rest, the only column in
    the table that looks like a control when nobody is editing anything.

So the proposal is one rule rather than three patches: the double-click opens
the LIST, the arrow goes because it has nothing left to say, and the Roles cell
reads like every other value until it is opened.

NOT DRAWN FROM THE STYLESHEET — DRIVEN (§41.9). It opens the BUILT platform,
walks to Setup › People register the way somebody walks there, and shoots that
one table off ONE build: today, and the same table with the change made. Both
sides are the same pixels.

AND EVERY PROPOSED PART IS THE PLATFORM'S OWN (§53.5): the chips at rest are
the very html the button hands over as its label (`data-sshtml`), and the list
that opens is `SEARCHSEL.openOn()` — the function the roles picker already
calls. Nothing here is a drawing OF a control.

Writes PNGs and a measurements file into design-mockups/client-registry/arrows/.
It asserts nothing: it is a camera with a tape measure.

    python3 checks/registry-arrows-mockup.py
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
OUT = ROOT / "design-mockups/client-registry/arrows"
OUT.mkdir(parents=True, exist_ok=True)
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"

PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
WHO = "cahead"          # Mostafa Deif — three kinds of role at once (§245)


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass

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
        body = {}
        try:
            body = json.loads(self.rfile.read(n) or b"{}")
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

# Real-shaped values, or three of the columns this round is about are empty and
# an empty column never overflows (§116.5).
REAL = """()=>{PEOPLE.filter(p=>!p.forefront).forEach((p,i)=>{
  p.email = p.name.toLowerCase().replace(/[^a-z ]/g,'').trim()
            .split(/ +/).slice(0,2).join('.') + '@rayatrade.com';
  p.phone = '+20 100 1234567';
  p.empId = 'RT-1' + String(1000 + i);}); paint();}"""


def newpage(b, w=1440, h=950):
    """§148's welcome screen covers the viewport and would be photographed
       instead of the register (§167.2) — suppressed in an `add_init_script`,
       because setting the flag after `goto` is one paint too late."""
    pg = b.new_page(viewport={"width": w, "height": h})
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    pg.on("pageerror", lambda e: print("  PAGEERROR:", e))
    return pg


def land(pg):
    if not pg.url.startswith("http"):
        pg.goto(URL)
        pg.wait_for_timeout(400)
    pg.evaluate("try{sessionStorage.setItem('smp.tour.later','1')}catch(e){}")
    pg.evaluate("()=>localStorage.removeItem('smp.people.columns')")
    pg.goto(URL)
    pg.wait_for_timeout(1900)
    pg.evaluate("()=>document.querySelector('[data-md=\"setup\"]').click()")
    pg.wait_for_timeout(400)
    pg.evaluate("()=>document.querySelector('[data-setupgo=\"people\"]').click()")
    pg.wait_for_timeout(1400)
    pg.evaluate(REAL)
    pg.wait_for_timeout(700)


def dark(pg):
    """DARK IS SET BEFORE THE PAGE BOOTS — §27 retired Auto, so `theme.js`
       reads the device ONCE and writes `data-theme` at boot; emulating the
       media afterwards changes nothing and ships a light shot with a dark
       caption."""
    pg.emulate_media(color_scheme="dark")
    pg.evaluate("try{localStorage.setItem('smp.theme','dark')}catch(e){}")
    pg.reload()
    pg.wait_for_timeout(1400)
    got = pg.evaluate("()=>document.documentElement.getAttribute('data-theme')")
    if got != "dark":
        raise SystemExit("dark() did not take: data-theme=%r" % got)
    pg.evaluate("()=>document.querySelector('[data-md=\"setup\"]').click()")
    pg.wait_for_timeout(400)
    pg.evaluate("()=>document.querySelector('[data-setupgo=\"people\"]').click()")
    pg.wait_for_timeout(1200)
    pg.evaluate(REAL)
    pg.wait_for_timeout(600)


def shot(pg, name, pad=10, rows=6, around=None, scrollx=None):
    """THE SHOT IS THE VIEWPORT, CROPPED (§144.8): an element screenshot
       displaces the sticky rows inside it. `around` centres the band on one
       person, because the row this round is about is the fourteenth."""
    if scrollx is not None:
        pg.evaluate("""(x)=>{const b=document.querySelector('.peoplecfg')
          .closest('.tblscroll'); if(b) b.scrollLeft = x < 0 ? b.scrollWidth : x;}""", scrollx)
        pg.wait_for_timeout(250)
    box = pg.evaluate("""(a)=>{
      const e = document.querySelector('.peoplecfg');
      if (!e) return null;
      const sb = e.closest('.tblscroll') || e.parentElement;
      const r = { left: sb.getBoundingClientRect().left,
                  width: sb.getBoundingClientRect().width,
                  top: e.getBoundingClientRect().top };
      const rs = [...e.querySelectorAll('tbody tr')];
      let from = 0;
      if (a.around) {
        const i = rs.findIndex(x => { const k = x.querySelector('[data-pmenu]');
          return k && k.dataset.pmenu === a.around; });
        if (i > -1) from = Math.max(0, i - Math.floor((a.rows - 1) / 2));
      }
      const head = e.querySelector('thead').getBoundingClientRect();
      const to = Math.min(rs.length - 1, from + a.rows - 1);
      const a0 = rs[from].getBoundingClientRect();
      const b0 = rs[to].getBoundingClientRect();
      return { x:r.left, y:head.top, width:r.width, height:(b0.bottom - head.top) };
    }""", {"rows": rows, "around": around})
    if not box:
        print("  (no table for " + name + ")")
        return None
    vw, vh = pg.viewport_size["width"], pg.viewport_size["height"]
    clip = {
        "x": max(0, box["x"] - pad),
        "y": max(0, box["y"] - pad),
        "width": min(vw - max(0, box["x"] - pad), box["width"] + pad * 2),
        "height": min(vh - max(0, box["y"] - pad), box["height"] + pad * 2),
    }
    pg.screenshot(path=str(OUT / (name + ".png")), clip=clip)
    print("  shot " + name + "  " + str(round(clip["width"])) + "x" + str(round(clip["height"])))
    return clip


# ── THE MEASUREMENT THE WHOLE ROUND TURNS ON ───────────────────────────────
# A drop cell opened, measured against the rows either side of it. The arrow
# falls to a second line because §366's open-cell rule set the button to
# `display:block` to answer a percentage-width quirk, and `.ssbtn` is normally
# an inline-flex row — so its two children stopped being flex items.
OPEN_CELL = """(a)=>{
  const t = document.querySelector('.peoplecfg');
  const head = [...t.querySelectorAll('thead th')].map(x=>x.textContent.trim());
  const i = head.indexOf(a.col);
  const row = [...t.querySelectorAll('tbody tr')].find(r => {
    const k = r.querySelector('[data-pmenu]'); return k && k.dataset.pmenu === a.key; });
  if (!row || i < 0) return null;
  const td = row.children[i];
  const ev = new MouseEvent('dblclick', {bubbles:true});
  td.dispatchEvent(ev);
  return true;
}"""

MEASURE_OPEN = """()=>{
  const td = document.querySelector('.peoplecfg td.pcellopen');
  if (!td) return {none:true};
  const row = td.closest('tr');
  const rows = [...document.querySelectorAll('.peoplecfg tbody tr')];
  const others = rows.filter(r=>r!==row).map(r=>Math.round(r.getBoundingClientRect().height));
  const btn = td.querySelector('.ssbtn');
  const out = { openRowH:+row.getBoundingClientRect().height.toFixed(1),
                otherRowH: others.sort((x,y)=>y-x)[0],
                listOpen: !!document.querySelector('.sspop') };
  if (btn) {
    const lab = btn.querySelector('.sslabel'), car = btn.querySelector('.sscar');
    out.arrow = !!(car && car.getClientRects().length);
    if (lab && car && car.getClientRects().length)
      out.arrowOnItsOwnLine =
        Math.abs(lab.getBoundingClientRect().top - car.getBoundingClientRect().top) > 2;
  }
  return out;
}"""

# ── THE CHANGE, MADE IN THE PAGE OUT OF THE PLATFORM'S OWN PARTS ───────────
# 1 · no arrow anywhere in this table
# 2 · the Roles cell reads as its chips — and they are not re-drawn: the html
#     is the one the button already hands over as its label (`data-sshtml`),
#     so there is one builder for what a role looks like, open and shut.
# 3 · a double-click opens the list itself, which is `SEARCHSEL.openOn()` —
#     the function the roles picker already calls (§53.5).
PROPOSE = """()=>{
  if (!document.getElementById('mkNoArrow')) {
    const s = document.createElement('style');
    s.id = 'mkNoArrow';
    s.textContent = '.peoplecfg .sscar{display:none}';
    document.head.appendChild(s);
  }
  /* THE ROLES CELL AT REST. The select is left in the document and hidden —
     what is drawn is the chips it was already handing over. */
  document.querySelectorAll('.peoplecfg tbody td.roles').forEach(td=>{
    const sel = td.querySelector('select[data-proleset]');
    if (!sel) return;
    const btn = td.querySelector('.ssbtn');
    if (btn) btn.hidden = true;
    if (td.querySelector('.mk-chips')) return;
    const span = document.createElement('span');
    span.className = 'mk-chips';
    span.innerHTML = sel.dataset.sshtml || '';
    td.querySelector('.rolebox').appendChild(span);
  });
  const t = document.querySelector('.peoplecfg');
  const box = t.closest('.tblscroll') || t.parentElement;
  const rows = [...t.querySelectorAll('tbody tr')];
  const head = [...t.querySelectorAll('thead th')].map(x=>x.textContent.trim());
  const ci = head.indexOf('Roles');
  return { tableW: Math.round(t.getBoundingClientRect().width),
           boxW: Math.round(box.getBoundingClientRect().width),
           rolesColW: Math.round(t.querySelectorAll('thead th')[ci].getBoundingClientRect().width),
           rowH: rows.map(r=>Math.round(r.getBoundingClientRect().height))
                     .sort((a,b)=>b-a)[0] };
}"""

OPEN_LIST = """()=>{
  const td = document.querySelector('.peoplecfg td.pcellopen');
  const sel = td && td.querySelector('select');
  if (!sel) return false;
  return !!SEARCHSEL.openOn(sel);
}"""

AT_REST = """()=>{
  const t = document.querySelector('.peoplecfg');
  const box = t.closest('.tblscroll') || t.parentElement;
  const head = [...t.querySelectorAll('thead th')].map(x=>x.textContent.trim());
  const ci = head.indexOf('Roles');
  return { tableW: Math.round(t.getBoundingClientRect().width),
           boxW: Math.round(box.getBoundingClientRect().width),
           rolesColW: Math.round(t.querySelectorAll('thead th')[ci].getBoundingClientRect().width),
           boxesDrawn: t.querySelectorAll('tbody td.roles .ssbtn:not([hidden])').length,
           arrowsDrawn: [...t.querySelectorAll('tbody .sscar')]
                          .filter(c=>c.getClientRects().length).length,
           rowH: [...t.querySelectorAll('tbody tr')]
                   .map(r=>Math.round(r.getBoundingClientRect().height))
                   .sort((a,b)=>b-a)[0] };
}"""

M = {}

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME)

    # ── TODAY ──────────────────────────────────────────────────────────────
    pg = newpage(b)
    land(pg)
    M["today_rest"] = pg.evaluate(AT_REST)
    print("today, at rest:", M["today_rest"])
    shot(pg, "today-rest", rows=7, around=WHO, scrollx=-1)

    pg.evaluate(OPEN_CELL, {"key": WHO, "col": "Unit"})
    pg.wait_for_timeout(600)
    M["today_open"] = pg.evaluate(MEASURE_OPEN)
    print("today, a drop cell open:", M["today_open"])
    shot(pg, "today-open", rows=7, around=WHO, scrollx=0)
    # and with its list open, which is what he photographed
    pg.evaluate("()=>{const b=document.querySelector('td.pcellopen .ssbtn'); if(b) b.click();}")
    pg.wait_for_timeout(500)
    shot(pg, "today-open-list", rows=7, around=WHO, scrollx=0)
    pg.close()

    # ── PROPOSED ───────────────────────────────────────────────────────────
    pg = newpage(b)
    land(pg)
    M["now_rest"] = pg.evaluate(PROPOSE)
    M["now_rest_more"] = pg.evaluate(AT_REST)
    print("proposed, at rest:", M["now_rest"], M["now_rest_more"])
    shot(pg, "now-rest", rows=7, around=WHO, scrollx=-1)

    pg.evaluate(OPEN_CELL, {"key": WHO, "col": "Unit"})
    pg.wait_for_timeout(600)
    pg.evaluate(PROPOSE)
    ok = pg.evaluate(OPEN_LIST)
    pg.wait_for_timeout(500)
    M["now_open"] = pg.evaluate(MEASURE_OPEN)
    M["now_open"]["listOpenedOnTheDoubleClick"] = bool(ok)
    print("proposed, a drop cell open:", M["now_open"])
    shot(pg, "now-open", rows=7, around=WHO, scrollx=0)
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(300)
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(400)

    # a writing cell, to show the rule is one rule
    pg.evaluate(PROPOSE)
    pg.evaluate(OPEN_CELL, {"key": WHO, "col": "Job title"})
    pg.wait_for_timeout(500)
    pg.evaluate(PROPOSE)
    M["now_text"] = pg.evaluate(MEASURE_OPEN)
    print("proposed, a writing cell open:", M["now_text"])
    shot(pg, "now-open-text", rows=7, around=WHO, scrollx=0)
    pg.close()

    # ── DARK, one of each ──────────────────────────────────────────────────
    pg = newpage(b)
    land(pg)
    dark(pg)
    shot(pg, "today-rest-dark", rows=7, around=WHO, scrollx=-1)
    pg.evaluate(PROPOSE)
    shot(pg, "now-rest-dark", rows=7, around=WHO, scrollx=-1)
    pg.close()

    b.close()

(OUT / "measurements.json").write_text(json.dumps(M, indent=1))
print("\nwritten to " + str(OUT))
