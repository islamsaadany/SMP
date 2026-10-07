"""WHAT ADDING SOMEBODY NEEDS, MARKED AND KEPT (§506).

Islam: "for the client register adding users. please mark the essential fields
with an astrict" — and, of what counts as essential, Full name + Email, with the
form refusing to add somebody without an address: they sign in with it and are
written to there.

WHAT THIS ASSERTS, AND WHY EACH HALF:

  · the star is on exactly those two boxes and on no other — and on the ADD
    form only, because editing somebody already here is not held to it (a build
    that starred every form satisfies "the stars are there" perfectly, §94.2);
  · the footer says what the star means, and no longer says the old rule;
  · nothing is ringed before anybody has pressed Add;
  · a press with a needed box empty REFUSES and SAYS SO under the box it is
    about — the old refusal was SILENT, `NEWPERSON.err` drawn nowhere, so the
    saying is asserted and not only the count (§32, §171);
  · what was typed is still there after the refusal, and the cursor is in the
    first empty box;
  · the ring is OUT OF FLOW: a refused field still shares its grid row with its
    neighbour, measured as boxes (§190's note on why that matters);
  · clearing the name box after typing in it leaves the draft with NO name, or
    Add goes ahead with a name the form is not showing;
  · both filled, they are added with the address that was typed;
  · the words read in both palettes, measured off the paint (§38.5).

OVER HTTP with a stub, the way people-dialog.py runs, so the build under test is
a path (SMP_BUILT) and falsifying never means overwriting the built file in the
tree (§343.9, §276).
"""
import json
import os
import pathlib
import re
import http.server
import socketserver
import threading

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = pathlib.Path(os.environ.get("SMP_BUILT") or
                    (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")
                    ).read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}

errs, bad = [], 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x != "" else ""))


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
        self.rfile.read(n)
        self._s(200, b'{"ok":true}', "application/json")


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % srv.server_address[1]

# Every probe degrades rather than throwing (§215): a build that lost the thing
# under test must REPORT that, not take the rest of the file down with it.
LABELS = """()=>[].slice.call(document.querySelectorAll('#modal-b .pdf > .pdfl'))
  .map(l=>({t:(l.firstChild?l.firstChild.textContent:'').trim(),
            star:!!l.querySelector('.reqmark')}))"""
RINGS = """()=>[].slice.call(document.querySelectorAll('#modal-b .pdf.reqmiss > .pdfl'))
  .map(l=>(l.firstChild?l.firstChild.textContent:'').trim())"""
SAYS = """()=>[].slice.call(document.querySelectorAll('#modal-b .pdf .reqsay'))
  .map(e=>e.textContent.trim())"""
FOOT = """()=>{const f=document.querySelector('#modal-b .pdfoot .why');
  return f?f.textContent.replace(/\\s+/g,' ').trim():''}"""


def setv(pg, attr, v):
    pg.evaluate("""([a,v])=>{const i=document.querySelector('#modal-b [data-'+a+']');
      if(!i) return; i.value=v; i.dispatchEvent(new Event('change',{bubbles:true}));}""",
                [attr, v])
    pg.wait_for_timeout(120)


def press_add(pg):
    pg.evaluate("()=>{const b=document.querySelector('[data-pdlg-add]'); if(b) b.click();}")
    pg.wait_for_timeout(450)


def land(pg):
    pg.goto(URL)
    pg.wait_for_timeout(1900)
    pg.evaluate("()=>{const b=document.querySelector('[data-md=\"setup\"]'); if(b) b.click();}")
    pg.wait_for_timeout(400)
    pg.evaluate("()=>{const b=document.querySelector('[data-setupgo=\"people\"]'); if(b) b.click();}")
    pg.wait_for_timeout(1100)


def open_add(pg):
    pg.evaluate("()=>{const b=document.querySelector('[data-padd-open]'); if(b) b.click();}")
    pg.wait_for_timeout(600)


def lum(c):
    m = re.findall(r"[\d.]+", c or "")
    if len(m) < 3:
        return None
    out = []
    for x in m[:3]:
        v = float(x) / 255
        out.append(v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4)
    return 0.2126 * out[0] + 0.7152 * out[1] + 0.0722 * out[2]


def ratio(a, b):
    la, lb = lum(a), lum(b)
    if la is None or lb is None:
        return 0
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def ground(pg, sel):
    """The first opaque background at or above the element — measured, never a
    token name (§94.8)."""
    return pg.evaluate("""(s)=>{let e=document.querySelector(s);
      while(e){const b=getComputedStyle(e).backgroundColor;
        const m=b.match(/[\\d.]+/g)||[]; if(m.length>=3 && (m.length<4||+m[3]>0.9)) return b;
        e=e.parentElement;}
      return 'rgb(255,255,255)';}""", sel)


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or
                          "/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    pg.on("pageerror", lambda e: errs.append(str(e)))

    # ── 1. THE STARS, ON THE ADD FORM AND NOWHERE ELSE ──────────────────
    print("1. the add form marks what it needs")
    land(pg)
    n0 = pg.evaluate("PEOPLE.length")
    open_add(pg)
    labs = pg.evaluate(LABELS)
    starred = [x["t"] for x in labs if x["star"]]
    ck("the add form is open", bool(labs), labs)
    ck("Full name and Email carry a star, and nothing else does",
       starred == ["Full name", "Email"], starred)
    star_col = pg.evaluate("""()=>{const s=document.querySelector('#modal-b .pdfl .reqmark');
      if(!s) return null; const r=s.getBoundingClientRect();
      return {w:r.width, c:getComputedStyle(s).color, txt:s.textContent}}""")
    ck("...and the star is DRAWN, not merely present", bool(star_col) and star_col["w"] > 2
       and star_col["txt"] == "*", star_col)
    ck("both boxes tell a screen reader they are needed",
       pg.evaluate("""()=>['pname','pemail'].every(a=>{const i=document.querySelector(
          '#modal-b [data-'+a+']'); return i && i.getAttribute('aria-required')==='true';})"""))
    ck("...and no other box claims to be",
       pg.evaluate("document.querySelectorAll('#modal-b [aria-required]').length") == 2)
    foot = pg.evaluate(FOOT)
    ck("the footer says what the star means",
       foot == "* needed to add them. Everything else can wait.", foot)
    ck("...and no longer says the old rule", "Only a name" not in foot, foot)
    ck("nothing is ringed before anybody presses Add", pg.evaluate(RINGS) == [],
       pg.evaluate(RINGS))

    # ── 2. A PRESS WITH NOTHING IN IT ───────────────────────────────────
    print("2. pressing Add with both empty")
    # Something typed that is NOT needed, to prove the refusal keeps it.
    setv(pg, "ptitle", "Senior analyst")
    # The row neighbour of Email, measured at rest, to prove the ring is out
    # of flow once it is drawn.
    tops = pg.evaluate("""()=>[].slice.call(document.querySelectorAll('#modal-b .pdlg > .pdf'))
      .map(f=>({t:(f.querySelector('.pdfl')&&f.querySelector('.pdfl').firstChild
                  ?f.querySelector('.pdfl').firstChild.textContent:'').trim(),
               top:Math.round(f.getBoundingClientRect().top)}))""")
    etop = [x["top"] for x in tops if x["t"] == "Email"]
    mates = [x["t"] for x in tops if etop and x["top"] == etop[0] and x["t"] != "Email"]
    ck("Email shares its row with another field at rest", bool(mates), tops)
    press_add(pg)
    ck("nobody is added", pg.evaluate("PEOPLE.length") == n0)
    ck("the form stays open", pg.evaluate("!!document.querySelector('#modal-b .pdlg')"))
    ck("both needed boxes are ringed", pg.evaluate(RINGS) == ["Full name", "Email"],
       pg.evaluate(RINGS))
    ck("and the reason is said under each, in Islam's words",
       pg.evaluate(SAYS) == ["A full name is needed to add them.",
                             "An email is needed — it is what they sign in with."],
       pg.evaluate(SAYS))
    ck("what was typed is still there",
       pg.evaluate("(document.querySelector('#modal-b [data-ptitle]')||{}).value") ==
       "Senior analyst")
    ck("the cursor is in the first empty box",
       pg.evaluate("document.activeElement && document.activeElement.hasAttribute('data-pname')"))
    ck("the refused boxes say so to a screen reader",
       pg.evaluate("document.querySelectorAll('#modal-b [aria-invalid=\"true\"]').length") == 2)
    ring = pg.evaluate("""()=>{const f=document.querySelector('#modal-b .pdf.reqmiss');
      if(!f) return null; const s=getComputedStyle(f);
      return {style:s.outlineStyle, w:parseFloat(s.outlineWidth)}}""")
    ck("the ring is PAINTED, not just a class", bool(ring) and ring["style"] == "solid"
       and ring["w"] >= 2, ring)
    after = pg.evaluate("""(m)=>{const all=[].slice.call(document.querySelectorAll('#modal-b .pdlg > .pdf'));
      const top=t=>{const f=all.filter(f=>{const l=f.querySelector('.pdfl');
        return l&&l.firstChild&&l.firstChild.textContent.trim()===t;})[0];
        return f?Math.round(f.getBoundingClientRect().top):null;};
      return {email:top('Email'), mates:m.map(top)};}""", mates)
    ck("...and OUT OF FLOW: the refused Email still shares its row",
       bool(mates) and all(t == after["email"] for t in after["mates"]), after)

    # ── 3. A NAME, AND NO EMAIL ─────────────────────────────────────────
    print("3. a name and no email")
    setv(pg, "pname", "Nour Hassan")
    press_add(pg)
    ck("still refused", pg.evaluate("PEOPLE.length") == n0)
    ck("the name is no longer ringed, the email still is", pg.evaluate(RINGS) == ["Email"],
       pg.evaluate(RINGS))
    ck("the cursor goes to the email box",
       pg.evaluate("document.activeElement && document.activeElement.hasAttribute('data-pemail')"))
    ck("the name typed is still in its box",
       pg.evaluate("(document.querySelector('#modal-b [data-pname]')||{}).value") == "Nour Hassan")

    # ── 4. CLEARING THE NAME CLEARS THE NAME ────────────────────────────
    print("4. a name typed and then emptied")
    setv(pg, "pname", "")
    setv(pg, "pemail", "nour.hassan@example.com")
    press_add(pg)
    ck("an emptied name box is refused, not added under the old name",
       pg.evaluate("PEOPLE.length") == n0,
       pg.evaluate("PEOPLE.slice(-1)[0].name"))
    ck("...and it is the NAME that is ringed", pg.evaluate(RINGS) == ["Full name"],
       pg.evaluate(RINGS))

    # ── 5. CONTRAST, IN BOTH PALETTES (§38.5) ───────────────────────────
    print("5. the refusal reads in both palettes")
    for theme in ("light", "dark"):
        pg.evaluate("(t)=>{try{localStorage.setItem('smp.theme',t)}catch(e){};"
                    "document.documentElement.setAttribute('data-theme',t)}", theme)
        pg.wait_for_timeout(250)
        say_c = pg.evaluate("""()=>{const e=document.querySelector('#modal-b .reqsay');
          return e?getComputedStyle(e).color:''}""")
        r1 = ratio(say_c, ground(pg, "#modal-b .reqsay"))
        ck("%s: the sentence under the box reads (%.2f)" % (theme, r1), r1 >= 4.5)
        star_c = pg.evaluate("""()=>{const e=document.querySelector('#modal-b .pdfoot .reqmark');
          return e?getComputedStyle(e).color:''}""")
        r2 = ratio(star_c, ground(pg, "#modal-b .pdfoot .reqmark"))
        ck("%s: the footer's star reads (%.2f)" % (theme, r2), r2 >= 4.5)
        lab_c = pg.evaluate("""()=>{const e=document.querySelector('#modal-b .pdf:not(.reqmiss) .pdfl .reqmark');
          return e?getComputedStyle(e).color:''}""")
        r3 = ratio(lab_c, ground(pg, "#modal-b .pdf:not(.reqmiss) .pdfl .reqmark"))
        ck("%s: a star on an unringed field reads (%.2f)" % (theme, r3), r3 >= 4.5)
    pg.evaluate("()=>{try{localStorage.removeItem('smp.theme')}catch(e){};"
                "document.documentElement.removeAttribute('data-theme')}")

    # ── 6. BOTH FILLED ──────────────────────────────────────────────────
    print("6. both filled")
    setv(pg, "pname", "Nour Hassan")
    press_add(pg)
    ck("they are added", pg.evaluate("PEOPLE.length") == n0 + 1)
    ck("...with the address that was typed",
       pg.evaluate("!!PEOPLE.filter(p=>p.name==='Nour Hassan'&&p.email==='nour.hassan@example.com')[0]"))
    ck("...and the dialog closed", pg.evaluate("!PDLG"))

    # ── 7. THE EDIT FORM IS NOT HELD TO IT ──────────────────────────────
    print("7. editing somebody already here")
    k = pg.evaluate("(PEOPLE.filter(p=>!p.forefront && p.key!=='smo')[0]||{}).key")
    pg.evaluate("""(k)=>{const p=personBy(k); if(p) delete p.email; openPersonDialog({key:k, mode:'edit'});}""", k)
    pg.wait_for_timeout(600)
    elabs = pg.evaluate(LABELS)
    ck("the edit form is open", bool(elabs), elabs)
    ck("...and it draws no star", not [x for x in elabs if x["star"]],
       [x["t"] for x in elabs if x["star"]])
    ck("...claims no box is required",
       pg.evaluate("document.querySelectorAll('#modal-b [aria-required]').length") == 0)
    ck("...and its footer is not the add form's",
       "needed to add them" not in pg.evaluate("""()=>{const f=document.querySelector('#modal-b .pdfoot');
          return f?f.textContent:''}"""))
    ck("...and rings nothing for an address it does not hold", pg.evaluate(RINGS) == [])

    ck("no page errors", not errs, errs[:3])
    b.close()

print(("all good" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
