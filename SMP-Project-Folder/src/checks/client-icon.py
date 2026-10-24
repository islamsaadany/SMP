"""A CLIENT'S ICON: CHOSEN ON THE BRAND TAB, DRAWN IN HOME'S SQUARES (§625).

qa-run: own-server — both ends need a server: the Brand tab reads the client's
record from /api/platform and writes through saveClient, and Forefront's Home
draws from the `cards` answer. Each is served from a stub this file programs,
so the states that matter can be made (§255): a WIDE mark with no icon, the
same mark with an icon, a square mark, and a save that is refused.

Islam: *"in the client brand, give me another thing beside the client mark to
upload an icon or use the mark as an icon. and this icon view appears in the
dashboard of your clients as some clients have a wide mark that doesn't fit in
that view"* — then, of the mockup, *"ok for the client icon"*.

WHAT IS ASSERTED IS THE PROBLEM (§94.8):

  * THE WIDE MARK IS SAID AND SHOWN. The line warns, and draws the mark
    squeezed beside what Home will draw (its initials), so the difference is
    seen before choosing.
  * AN UPLOAD IS A SQUARE. What the stub RECEIVED is decoded and its own PNG
    header read — never what the page drew (§96) — and a picture that is not
    square arrives padded to one, not cropped.
  * USE THE MARK TAKES THE ICON OFF, and a REFUSED save puts the choice back
    rather than leaving a radio that claims something the server never kept.
  * A SQUARE MARK NEEDS NO WORDS: no warning, no squeezed tile, the mark itself.
  * HOME DRAWS `square`: an icon where the answer carries one, initials where
    it carries none — even for a client whose MARK is on the card. Both ends
    (§94.2): a build that kept drawing the mark fails the second; a build that
    drew nothing fails the first.

EVERY PROBE DEGRADES (§215).

Run: python3 qa-run.py checks/client-icon.py
     SMP_BUILT=<another build> SMP_CONSOLE=<another platform.html> …   # prove it can fail (§276)
"""
import base64, json, os, pathlib, struct, threading, zlib, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = pathlib.Path(os.environ.get("SMP_BUILT") or
                    (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")).read_bytes()
CONSOLE = pathlib.Path(os.environ.get("SMP_CONSOLE") or (ROOT / "platform.html")).read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
SCRATCH = pathlib.Path(os.environ.get("TMPDIR") or "/tmp") / "client-icon-check"
SCRATCH.mkdir(parents=True, exist_ok=True)
bad = 0
errs = []


def ck(label, cond, detail=""):
    global bad
    if not cond:
        bad += 1
    print(("  ok      " if cond else "  FAIL    ") + label + ((" | " + str(detail)) if detail and not cond else ""))


def png(w, h, rgba=(200, 40, 70, 255)):
    """A real PNG, filled, so the browser draws it and the header is genuine."""
    def chunk(t, d):
        c = struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
        return struct.pack(">I", len(d)) + t + d + c
    row = b"\x00" + bytes(rgba) * w
    raw = row * h
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)) +
            chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b""))


def uri(b):
    return "data:image/png;base64," + base64.b64encode(b).decode()


def size_of(data_uri):
    try:
        b = base64.b64decode(data_uri.split(",", 1)[1])
        return struct.unpack(">II", b[16:24]) if b[12:16] == b"IHDR" else None
    except Exception:
        return None


WIDE = uri(png(600, 100))
SQUARE = uri(png(120, 120, (20, 50, 100, 255)))
STATE = {"mark": WIDE, "markWide": True, "icon": None, "refuse": False}
SAVES = []
CARDS = []


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
        path = self.path.split("?")[0]
        if path.startswith("/api/state"):
            self._s(200, json.dumps({"ok": True, "state": SEED, "person": PERSON}).encode(), "application/json")
        elif path.startswith("/raya-trade"):
            self._s(200, HTML, "text/html; charset=utf-8")
        elif path in ("/platform", "/"):
            self._s(200, CONSOLE, "text/html; charset=utf-8")
        else:
            self._s(404, b"", "text/plain")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(n).decode("utf-8", "replace") or "{}"
        try:
            body = json.loads(raw)
        except Exception:
            body = {}
        act = body.get("action")
        js = lambda o: self._s(200, json.dumps(o).encode(), "application/json")
        if not self.path.startswith("/api/platform"):
            js({"ok": True})
        elif act == "client":
            js({"ok": True,
                "client": {"key": "raya-trade", "name": "Raya Trade", "status": "active", "made_here": True,
                           "industry": "Retail", "size": "1000+", "notes": "", "mark": STATE["mark"],
                           "icon": STATE["icon"], "markWide": STATE["markWide"], "modules": ["strategy"]},
                "team": [], "seats": [], "canEdit": True, "register": [], "office": [],
                "shape": None, "holds": None, "goes": None, "canArchive": True, "canDelete": False,
                "modules": ["strategy"],
                "offer": [{"key": "strategy", "label": "Strategy", "note": "", "always": True}]})
        elif act == "saveClient":
            SAVES.append(body)
            if STATE["refuse"] and "icon" in body:
                self._s(403, json.dumps({"ok": False, "error": "This client's configuration is not yours to change."}).encode(),
                        "application/json")
                return
            if "icon" in body:
                STATE["icon"] = body["icon"] or None
            js({"ok": True, "markWide": STATE["markWide"]})
        elif act == "me":
            js({"ok": True, "account": {"email": "islam.saadany@forefront.consulting", "name": "Islam Saadany",
                                         "isAdmin": True}})
        elif act == "cards":
            js({"ok": True, "cards": CARDS, "archived": [], "canAdd": True, "canConsultants": True, "canAccess": True})
        else:
            js({"ok": True})


def ev(pg, js, default=None):
    try:
        return pg.evaluate(js)
    except Exception as e:
        errs.append("PROBE: " + str(e)[:160])
        return default


LINE = """()=>{const b=document.querySelector('.csetup [data-wzicon]'); if(!b) return null;
  const r=[...b.querySelectorAll('input[type=radio]')];
  return {use: r[0]&&r[0].checked, own: r[1]&&r[1].checked,
          said: (b.querySelector('.iconsaid')||{}).textContent||'',
          tiles: [...b.querySelectorAll('.icontile')].map(t=>({cap:t.querySelector('figcaption').textContent,
                  img: !!t.querySelector('img'), init: (t.querySelector('.iconinit')||{}).textContent||''})),
          up: (b.querySelector('[data-iconup]')||{}).textContent||''};}"""


def to_brand(pg):
    pg.goto(URL, wait_until="networkidle")
    pg.wait_for_timeout(1200)
    try:
        pg.click('button[title="Setup"]', timeout=2500)
    except Exception:
        errs.append("PROBE: no Setup button")
    pg.wait_for_timeout(300)
    ev(pg, "()=>{const r=document.querySelector('[data-setupgo=start]'); if(r) r.click();}")
    pg.wait_for_timeout(900)
    ev(pg, "()=>{const t=document.querySelector('.csetup [data-cstab=brand]'); if(t) t.click();}")
    pg.wait_for_timeout(400)


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % srv.server_address[1]
URL = BASE + "/raya-trade"

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or "/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")

    print("\n1 · a wide mark and no icon: said, and shown squeezed beside the initials")
    to_brand(pg)
    l = ev(pg, LINE) or {}
    ck("the Brand tab carries an icon line under the mark", bool(l), l)
    ck("…'Use the mark' is the choice, there being no icon", l.get("use") is True and l.get("own") is False, l)
    ck("…it says the mark is too small to read in the square", "too small to read" in l.get("said", ""), l.get("said"))
    ck("…and what Home does meanwhile", "Home shows its initials" in l.get("said", ""), l.get("said"))
    t = l.get("tiles") or []
    ck("what Home draws is first: the client's initials", len(t) == 2 and t[0].get("init") == "RT"
       and t[0].get("cap") == "Its initials", t)
    ck("…beside the mark squeezed into the same square", len(t) == 2 and t[1].get("img")
       and t[1].get("cap") == "The mark, squeezed", t)
    pg.locator(".csetup [data-wzicon]").screenshot(path=str(SCRATCH / "icon-wide-none.png"))

    print("\n2 · an upload arrives as a square, padded and not cropped")
    up = SCRATCH / "upload.png"
    up.write_bytes(png(300, 200, (30, 140, 90, 255)))
    try:
        pg.set_input_files(".csetup [data-iconfile]", str(up))
    except Exception as e:
        errs.append("PROBE: " + str(e)[:160])
    pg.wait_for_timeout(900)
    sent = [s for s in SAVES if s.get("icon")]
    got = size_of(sent[-1]["icon"]) if sent else None
    ck("the server was sent an icon", bool(sent), len(SAVES))
    ck("…as a 256px square, though the picture was 300×200", got == (256, 256), got)
    ck("…and nothing else rode with it (the mark is not touched)", bool(sent) and "mark" not in sent[-1], sent[-1:] and list(sent[-1]))
    l = ev(pg, LINE) or {}
    ck("the choice now reads 'Its own icon'", l.get("own") is True and l.get("use") is False, l)
    ck("…its button says Replace", l.get("up") == "Replace", l.get("up"))
    t = l.get("tiles") or []
    ck("…and Home's tile is the icon", bool(t) and t[0].get("cap") == "Its icon" and t[0].get("img"), t)
    ck("…with the line saying an icon is clearer", "An icon of its own is clearer" in l.get("said", ""), l.get("said"))
    pg.locator(".csetup [data-wzicon]").screenshot(path=str(SCRATCH / "icon-wide-own.png"))

    print("\n3 · 'Use the mark' takes the icon off")
    n0 = len(SAVES)
    ev(pg, "()=>{const r=document.querySelectorAll('.csetup [data-wzicon] input[type=radio]')[0]; r.click();}")
    pg.wait_for_timeout(700)
    ck("the server was told to drop it", any(s.get("icon") == "" for s in SAVES[n0:]), SAVES[n0:])
    l = ev(pg, LINE) or {}
    ck("…and Home's tile is the initials again", (l.get("tiles") or [{}])[0].get("init") == "RT", l)

    print("\n4 · a refused save puts the choice back")
    STATE["refuse"] = True
    up.write_bytes(png(64, 64))
    try:
        pg.set_input_files(".csetup [data-iconfile]", str(up))
    except Exception as e:
        errs.append("PROBE: " + str(e)[:160])
    pg.wait_for_timeout(900)
    l = ev(pg, LINE) or {}
    ck("the choice stays 'Use the mark'", l.get("use") is True and l.get("own") is False, l)
    ck("…and the refusal is said on the page",
       "not yours to change" in (ev(pg, "()=>document.querySelector('.csetup').textContent", "") or ""))
    STATE["refuse"] = False

    print("\n5 · a square mark needs no words")
    STATE.update({"mark": SQUARE, "markWide": False, "icon": None})
    to_brand(pg)
    l = ev(pg, LINE) or {}
    ck("no warning is drawn", l.get("said", "x") == "", l.get("said"))
    t = l.get("tiles") or []
    ck("…and Home's tile is the mark itself, alone", len(t) == 1 and t[0].get("img") and t[0].get("cap") == "The mark", t)
    pg.locator(".csetup [data-wzicon]").screenshot(path=str(SCRATCH / "icon-square.png"))

    print("\n6 · Home's small squares draw `square`, and initials where it is empty")
    base = {"industry": None, "kind": "client", "mine": True, "seat": "super", "state": "open", "canOpen": True,
            "canConfig": True, "units": 0, "planned": False, "cycleOpen": False, "unreadable": False,
            "modules": [{"key": "strategy", "label": "Strategy", "state": "no plan yet"}]}
    ICON = uri(png(256, 256, (210, 60, 90, 255)))
    CARDS[:] = [dict(base, key="el-abd", name="El Abd Foods", mark=WIDE, square=ICON),
                dict(base, key="wander", name="Wander", mark=WIDE, square=None)]
    hp = b.new_page(viewport={"width": 1440, "height": 900})
    hp.on("pageerror", lambda e: errs.append(str(e)))
    hp.goto(BASE + "/platform", wait_until="networkidle")
    try:
        hp.wait_for_selector(".hocl", timeout=9000)
    except Exception:
        errs.append("PROBE: Home drew no client rows")
    sq = ev(hp, """()=>Object.fromEntries([...document.querySelectorAll('.hocl')].map(r=>{const m=r.querySelector('.cmk');
          return [r.getAttribute('data-client'), m ? {img: m.tagName==='IMG', src: m.tagName==='IMG' ? m.src.slice(0,60) : '', text: m.textContent} : null];}))""") or {}
    ck("a client with an icon is drawn with it", (sq.get("el-abd") or {}).get("img") is True
       and (sq.get("el-abd") or {}).get("src") == ICON[:60], sq.get("el-abd"))
    ck("…and one whose wide mark is all it has gets its initials, not the strip",
       (sq.get("wander") or {}).get("img") is False and (sq.get("wander") or {}).get("text") == "WA", sq.get("wander"))
    try:
        hp.locator('[data-home="clients"]').screenshot(path=str(SCRATCH / "home-squares.png"))
    except Exception:
        pass
    b.close()

ck("no page errors", not [e for e in errs if not e.startswith("PROBE")], errs[:3])
ck("every probe answered (§215)", not [e for e in errs if e.startswith("PROBE")], errs[:3])
print("\n%d failure%s" % (bad, "" if bad == 1 else "s"))
raise SystemExit(1 if bad else 0)
