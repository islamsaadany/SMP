"""THE FOREFRONT TEAM AS A SETUP TABLE (§364).

qa-run: own-server — §316.1. The page is `client-setup.js`'s own renderer
over the client's record, and that record is `/api/platform`'s: over file://
there is no server, so the page correctly says the team is kept by the
served platform and there is nothing to measure (§94.11). A stub answers
`action:"client"` and RECORDS what is posted back, which is the only way to
make the two states this file needs — a client whose register came across,
and one the platform built — and the only way to read what a press WROTE
rather than what it drew (§96).

Islam, of the page §362.2 shipped: *"forefront team is damaged it needs to
be a table looks like the people register wiht the required columns."*

WHAT IS ASSERTED IS THE PROBLEM, NEVER THE LAYOUT (§94.8):

  * THE BOX FITS ITS PANE. The fault was one class — the rows were wrapped
    in `.wzstep`, which is what the step CHIPS wear, and under it the flow's
    own `.teamrow`, written for a 760px column: on a full-width page they
    laid out side by side and wanted 2471px in a 1323px box. So what is
    measured is `scrollWidth == clientWidth` at four widths with the table
    asserted PRESENT beside it (§94.2) — a build that drew nothing at all
    fits perfectly.

  * ONE LINE PER ROW (§88), and the hover is MEASURED rather than written:
    absent at 1600 where the address fits, and equal to the address at 1100
    where it does not. Both ends, or a build that titled every cell always
    passes half.

  * A CELL THAT HOLDS A CONTROL HAS NO HOVER. `clipTitles()` falls back to
    the cell when it finds no value inside it, and a `<select>`'s text is
    every option it holds — the first build's hover read "a row of their
    ownMohamed Essam · …Ashraf…Mennah…".

  * THE REGISTER COLUMN IS DRAWN EXACTLY WHERE IT CAN BE ANSWERED (§61), in
    the head AND in the cells: on a client the platform built the seat IS
    the register row and there is nothing to pick. Measured on BOTH client
    shapes in one run (§113.8).

  * THE CONTROLS WRITE. A seat pressed and Remove pressed are read off what
    the stub RECEIVED, because a table wired to nothing renders perfectly
    (§96) — and this table is new markup around handlers that were not.

  * ONE RENDERER, TWO HOSTS (§53.5). The flow's seventh step draws the same
    table inside `.wzcol`'s 760px and must fit it too; its note is the
    flow's quiet line and the page's is the family's bordered `.note`, which
    is the one difference and is the caller's, not a flag inside the
    renderer.

EVERY PROBE DEGRADES (§215): a press that finds nothing reports rather than
waiting thirty seconds and taking the count down with it.

Run: SMP_CHROME=... python3 qa-run.py checks/team-page.py
     SMP_BUILT=<another build> …   # prove it can fail, from the SOURCES (§276)
"""
import json, os, pathlib, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = pathlib.Path(os.environ.get("SMP_BUILT") or
                    (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")).read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}

SEATS = [{"key": "super", "name": "Super user",
          "note": "This client's access matrix, retiring people, issuing passwords."},
         {"key": "smoteam", "name": "SMO team",
          "note": "Runs cycles and corrects plans in this client."}]
# Three consultants, and a long address on purpose: the hover is only worth
# asserting on a value that can actually outgrow its column (§255).
TEAM = [
    {"email": "islam.saadany@forefront.consulting", "name": "Islam Saadany",
     "seat": "super", "person_key": "ff_islam"},
    {"email": "noran.essam@forefront.consulting", "name": "Noran Essam",
     "seat": "smoteam", "person_key": "smo"},
    {"email": "omar.abdelhamid@forefront.consulting", "name": "Omar Abdel Hamid",
     "seat": "smoteam", "person_key": None},
]
REG = [{"key": "smo", "name": "Mohamed Essam", "email": "mohamed.essam@rayatrade.example"},
       {"key": "mobhead", "name": "Ashraf Laithy", "email": "ashraf.laithy@rayatrade.example"},
       {"key": "own_mob", "name": "Mennah Farouk", "email": "mennah.farouk@rayatrade.example"}]
OFFICE = [{"email": "islam.saadany@forefront.consulting", "name": "Islam Saadany", "is_admin": True},
          {"email": "noran.essam@forefront.consulting", "name": "Noran Essam", "is_admin": False},
          {"email": "omar.abdelhamid@forefront.consulting", "name": "Omar Abdel Hamid", "is_admin": False},
          {"email": "hana.zaki@forefront.consulting", "name": "Hana Zaki", "is_admin": False}]

# The two client shapes, switched between runs — `made_here` is what decides
# whether the register can be answered at all (§313.32).
STATE = {"made_here": False, "canEdit": True, "posts": []}
bad = 0
errs = []


def ck(label, cond, detail=""):
    global bad
    if not cond:
        bad += 1
    print(("  ok      " if cond else "  FAIL    ") + label + ((" | " + str(detail)) if detail and not cond else ""))


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
            self._s(200, json.dumps({"ok": True, "state": SEED, "person": PERSON}).encode(), "application/json")
            return
        if self.path.startswith("/raya-trade"):
            self._s(200, HTML, "text/html; charset=utf-8")
            return
        self._s(200, b"<!doctype html><title>Sign in</title>", "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(n).decode("utf-8", "replace") or "{}"
        try:
            body = json.loads(raw)
        except Exception:
            body = {}
        if self.path.startswith("/api/platform"):
            if body.get("action") == "client":
                self._s(200, json.dumps({
                    "ok": True,
                    "client": {"key": "raya-trade", "name": "Raya Trade", "status": "active",
                               "made_here": STATE["made_here"], "industry": "Retail", "size": "1000+",
                               "notes": "", "mark": None, "modules": ["strategy"]},
                    "team": TEAM, "seats": SEATS, "canEdit": STATE["canEdit"], "register": REG,
                    "office": OFFICE, "shape": None, "holds": None, "goes": None,
                    "canArchive": True, "canDelete": False, "modules": ["strategy"],
                    "offer": [{"key": "strategy", "label": "Strategy", "note": "", "always": True}]
                }).encode(), "application/json")
                return
            STATE["posts"].append(body)
        self._s(200, b'{"ok":true}', "application/json")


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % srv.server_address[1]
INIT = ("try{sessionStorage.setItem('smp.tour.later','1');"
        "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")

MEASURE = """() => {
  const host = document.querySelector('[data-cteam]');
  if (!host) return { no: 'host' };
  const box = host.firstElementChild;
  const cfg = host.querySelector('.cfg');
  const t = cfg && cfg.querySelector('table.teamcfg');
  const cells = [...host.querySelectorAll('table td')];
  const lines = (e) => new Set([...e.getClientRects()].filter(r => r.width > 0)
                                .map(r => Math.round(r.top))).size;
  const clipped = (e) => e.scrollWidth - e.clientWidth > 1;
  return {
    boxClass: box ? box.className : null,
    table: !!t,
    fits: cfg ? (cfg.scrollWidth <= cfg.clientWidth) : null,
    cfgScroll: cfg ? cfg.scrollWidth : null, cfgClient: cfg ? cfg.clientWidth : null,
    heads: t ? [...t.querySelectorAll('thead th')].map(h => h.textContent.trim()) : null,
    names: t ? [...t.querySelectorAll('tbody td.tmname b')].map(e => e.textContent.trim()) : null,
    mails: t ? [...t.querySelectorAll('tbody td.tmmail')].map(e => e.textContent.trim()) : null,
    mailTitles: t ? [...t.querySelectorAll('tbody td.tmmail')]
                     .map(e => ({ clipped: clipped(e), title: e.title || '' })) : null,
    asCells: t ? t.querySelectorAll('tbody td.tmas').length : 0,
    asTitles: t ? [...t.querySelectorAll('tbody td.tmas')].map(e => e.title || '') : [],
    seatTitles: t ? [...t.querySelectorAll('tbody td.tmseat')].map(e => e.title || '') : [],
    multi: cells.filter((c) => lines(c) > 1).length,
    rowH: t ? [...t.querySelectorAll('tbody tr')].map(r => Math.round(r.getBoundingClientRect().height)) : [],
    add: host.querySelectorAll('.row.tmadd').length,
    addSelects: host.querySelectorAll('.row.tmadd select').length,
    note: (() => { const p = host.querySelector('p'); return p ? p.className : null; })(),
    wzstep: host.querySelectorAll('.wzstep').length,
    teamrow: host.querySelectorAll('.teamrow').length,
    pageScroll: Math.round(document.documentElement.scrollWidth),
    win: window.innerWidth
  };
}"""

SCROLLBOX = """() => {
  const cfg = document.querySelector('[data-cteam] .cfg');
  const t = cfg && cfg.querySelector('table.teamcfg');
  if (!cfg || !t) return { no: 1 };
  cfg.scrollLeft = 9999;
  const reached = cfg.scrollLeft;
  const lines = (e) => new Set([...e.getClientRects()].filter(r => r.width > 0)
                                .map(r => Math.round(r.top))).size;
  return { wider: cfg.scrollWidth > cfg.clientWidth,
           canScroll: getComputedStyle(cfg).overflowX === 'auto',
           reached: reached, need: cfg.scrollWidth - cfg.clientWidth,
           multi: [...t.querySelectorAll('td')].filter(c => lines(c) > 1).length,
           page: Math.round(document.documentElement.scrollWidth),
           win: window.innerWidth };
}"""


def open_team(pg):
    pg.goto(URL, wait_until="networkidle")
    pg.wait_for_timeout(1500)
    try:
        pg.click('button[title="Setup"]', timeout=2500)
    except Exception:
        errs.append("PROBE: no Setup button")
    pg.wait_for_timeout(400)
    pg.evaluate("()=>{const r=[...document.querySelectorAll('[data-setupgo]')]"
                ".find(x=>x.dataset.setupgo==='team'); if(r) r.click();}")
    pg.wait_for_timeout(1300)


def ev(pg, js, default=None):
    try:
        return pg.evaluate(js)
    except Exception as e:
        errs.append("PROBE: " + str(e)[:160])
        return default if default is not None else {}


with sync_playwright() as p:
    b = p.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])

    # ── 1 · THE SHAPE, ON A CLIENT WHOSE REGISTER CAME ACROSS ───────────
    print("\n1 · the page is the setup tables' own shape")
    pg = b.new_page(viewport={"width": 1600, "height": 950})
    pg.add_init_script(INIT)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    open_team(pg)
    m = ev(pg, MEASURE)
    ck("the team page draws a table", m.get("table") is True, m)
    ck("...inside the setup tables' own box, and it fits its pane",
       m.get("fits") is True, {"scroll": m.get("cfgScroll"), "client": m.get("cfgClient")})
    ck("...with nothing left wearing the step chip's class (§65.9)",
       m.get("wzstep") == 0 and m.get("boxClass") == "", m.get("boxClass"))
    ck("...and none of the flow's narrow-column rows",
       m.get("teamrow") == 0, m.get("teamrow"))
    ck("five columns, named", m.get("heads") == ["Name", "Email", "Seat on this client",
                                                 "On this register as", ""], m.get("heads"))
    ck("every consultant is a row, by name and address",
       (m.get("names") or []) == ["Islam Saadany", "Noran Essam", "Omar Abdel Hamid"]
       and all("@" in x for x in (m.get("mails") or [])), {"n": m.get("names"), "m": m.get("mails")})
    ck("every cell is one line (§88)", m.get("multi") == 0, m.get("multi"))
    ck("...so every row is one row high",
       len(set(m.get("rowH") or [0, 1])) <= 2 and max(m.get("rowH") or [99]) < 56, m.get("rowH"))
    ck("the add row is under the table, two answers and a press",
       m.get("add") == 1 and m.get("addSelects") == 2, {"add": m.get("add"), "sel": m.get("addSelects")})
    ck("the note is the family's own, not the flow's quiet line",
       m.get("note") == "note", m.get("note"))
    ck("the page gained no sideways scroll",
       m.get("pageScroll", 0) <= m.get("win", 0), {"page": m.get("pageScroll"), "win": m.get("win")})

    # ── 2 · THE HOVER IS MEASURED, AT BOTH ENDS ─────────────────────────
    # THE RULE, NEVER A WIDTH (§94.8). "At 1600 the address fits" is a fact
    # about one cap and three fixture addresses and would go stale the day
    # either moved; what §88 actually says is that a value carries its hover
    # EXACTLY when it did not fit. Asserted as that agreement, with the
    # fixture holding one address that fits and one that does not, or a
    # build that titled every cell always passes half (§113.8).
    print("\n2 · the hover is measured, never written (§88)")

    def hover_rule(rows):
        return rows and all((c["title"] != "") == c["clipped"] for c in rows) \
            and all(("@forefront.consulting" in c["title"]) for c in rows if c["clipped"])

    ck("at 1600, a hover exactly where the address did not fit",
       hover_rule(m.get("mailTitles")), m.get("mailTitles"))
    ck("...and the fixture holds one of each, so the rule is exercised both ways",
       len({c["clipped"] for c in (m.get("mailTitles") or [])}) == 2, m.get("mailTitles"))
    ck("a cell holding a control carries no hover at all",
       all(x == "" for x in (m.get("asTitles") or []) + (m.get("seatTitles") or [])),
       {"as": m.get("asTitles"), "seat": m.get("seatTitles")})
    pg.close()

    pg = b.new_page(viewport={"width": 1100, "height": 950})
    pg.add_init_script(INIT)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    open_team(pg)
    n = ev(pg, MEASURE)
    ck("at 1100 every address clips, and every one is on its own hover",
       hover_rule(n.get("mailTitles"))
       and all(c["clipped"] for c in (n.get("mailTitles") or [])), n.get("mailTitles"))
    ck("...and a control cell still carries none",
       all(x == "" for x in (n.get("asTitles") or []) + (n.get("seatTitles") or [])),
       {"as": n.get("asTitles"), "seat": n.get("seatTitles")})
    pg.close()

    # ── 3 · IT FITS AT EVERY WIDTH (§158) ───────────────────────────────
    print("\n3 · it fits, at every width — never 'and it scrolls'")
    for w in (1600, 1440, 1280, 1100):
        pg = b.new_page(viewport={"width": w, "height": 950})
        pg.add_init_script(INIT)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        open_team(pg)
        r = ev(pg, MEASURE)
        ck("%d — the table is in its box, one line a row" % w,
           r.get("table") is True and r.get("fits") is True and r.get("multi") == 0,
           {"scroll": r.get("cfgScroll"), "client": r.get("cfgClient"), "multi": r.get("multi")})
        pg.close()

    # ── 4 · THE CONTROLS WRITE (§96) ────────────────────────────────────
    print("\n4 · the new markup is around handlers that write")
    STATE["posts"] = []
    pg = b.new_page(viewport={"width": 1600, "height": 950})
    pg.add_init_script(INIT)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    open_team(pg)
    ok_press = ev(pg, """()=>{
       const btns=[...document.querySelectorAll('[data-cteam] tbody tr')][1];
       if(!btns) return false;
       const b=[...btns.querySelectorAll('td.tmseat button')].find(x=>x.textContent.trim()==='Super user');
       if(!b) return false; b.click(); return true; }""", False)
    pg.wait_for_timeout(700)
    seat = [p for p in STATE["posts"] if p.get("action") == "setTeam" and p.get("seat")]
    ck("pressing a seat posts that seat for that person",
       ok_press is True and len(seat) == 1 and seat[0].get("email") == "noran.essam@forefront.consulting"
       and seat[0].get("seat") == "super", {"pressed": ok_press, "posts": STATE["posts"]})
    STATE["posts"] = []
    ok_rm = ev(pg, """()=>{
       const tr=[...document.querySelectorAll('[data-cteam] tbody tr')][2];
       const b=tr && tr.querySelector('td.tmrm button');
       if(!b) return false; b.click(); return true; }""", False)
    pg.wait_for_timeout(700)
    rm = [p for p in STATE["posts"] if p.get("action") == "setTeam" and p.get("on") is False]
    ck("Remove posts that person off this client",
       ok_rm is True and len(rm) == 1 and rm[0].get("email") == "omar.abdelhamid@forefront.consulting",
       {"pressed": ok_rm, "posts": STATE["posts"]})
    pg.close()

    # ── 5 · THE OTHER END: A CLIENT THE PLATFORM BUILT ──────────────────
    print("\n5 · the register column is drawn only where it can be answered (§61)")
    STATE["made_here"] = True
    pg = b.new_page(viewport={"width": 1600, "height": 950})
    pg.add_init_script(INIT)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    open_team(pg)
    o = ev(pg, MEASURE)
    ck("a client the platform built draws four columns, not five",
       o.get("heads") == ["Name", "Email", "Seat on this client", ""], o.get("heads"))
    ck("...the head follows the cells — neither is there",
       o.get("asCells") == 0, o.get("asCells"))
    ck("...and its add row asks one question, not two",
       o.get("addSelects") == 1, o.get("addSelects"))
    ck("...while the table itself is unchanged and still fits",
       o.get("table") is True and o.get("fits") is True and o.get("multi") == 0, o)
    pg.close()
    STATE["made_here"] = False

    # ── 6 · ONE RENDERER, TWO HOSTS (§53.5) ─────────────────────────────
    print("\n6 · the flow's own step draws the same table, in its own column")
    pg = b.new_page(viewport={"width": 1600, "height": 950})
    pg.add_init_script(INIT)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL, wait_until="networkidle")
    pg.wait_for_timeout(1500)
    try:
        pg.click('button[title="Setup"]', timeout=2500)
    except Exception:
        errs.append("PROBE: no Setup button")
    pg.wait_for_timeout(400)
    pg.evaluate("()=>{const r=[...document.querySelectorAll('[data-setupgo]')]"
                ".find(x=>x.dataset.setupgo==='start'); if(r) r.click();}")
    pg.wait_for_timeout(1200)
    pg.evaluate("()=>{const s=[...document.querySelectorAll('.wzrail .wzstep')];"
                " if(s.length) s[s.length-1].click();}")
    pg.wait_for_timeout(1000)
    f = ev(pg, """() => {
      const host = document.querySelector('[data-csetup]');
      const cfg = host && host.querySelector('.cfg');
      const t = cfg && cfg.querySelector('table.teamcfg');
      const col = host && host.querySelector('.wzcol');
      const lines = (e) => new Set([...e.getClientRects()].filter(r => r.width > 0)
                                    .map(r => Math.round(r.top))).size;
      return { at: (typeof CLIENTSETUP !== 'undefined') ? CLIENTSETUP.at() : null,
               table: !!t,
               colW: col ? Math.round(col.getBoundingClientRect().width) : null,
               fits: cfg ? (cfg.scrollWidth <= cfg.clientWidth) : null,
               multi: [...(t ? t.querySelectorAll('td') : [])].filter(c => lines(c) > 1).length,
               notes: [...(host ? host.querySelectorAll('p.wzwhy') : [])].map(p => p.className) };
    }""")
    ck("the flow stands on its office step", f.get("at") == "office", f.get("at"))
    ck("...and draws the very same table", f.get("table") is True, f)
    ck("...inside the flow's own column, fitting it",
       f.get("fits") is True and (f.get("colW") or 0) <= 760, {"fits": f.get("fits"), "col": f.get("colW")})
    ck("...one line a row there too", f.get("multi") == 0, f.get("multi"))
    ck("...and its note is the flow's quiet line, not the page's block",
       len(f.get("notes") or []) >= 1, f.get("notes"))
    pg.close()

    # ── 7 · BELOW THE WIDTH IT FITS AT, IT SCROLLS RATHER THAN CUTS ─────
    # The five minima come to 802px, so under ~1080 no cap can make it fit —
    # and a table overflowing a box with `overflow:visible` is the reported
    # fault one size down. BOTH ENDS (§94.2): the box must be able to scroll
    # AND the whole table must be reachable inside it.
    print("\n7 · below the width it fits at, the box scrolls (§88)")
    pg = b.new_page(viewport={"width": 1000, "height": 950})
    pg.add_init_script(INIT)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    open_team(pg)
    sc = ev(pg, SCROLLBOX)
    ck("at 1000 the table is wider than its box", sc.get("wider") is True, sc)
    ck("...so the box scrolls, and the last column can be reached",
       sc.get("canScroll") is True and sc.get("reached", 0) >= sc.get("need", 1), sc)
    ck("...every row still one line, and the PAGE gains no sideways scroll",
       sc.get("multi") == 0 and sc.get("page", 0) <= sc.get("win", 0), sc)
    pg.close()

    b.close()

if errs:

    print("\nprobe notes: " + " | ".join(errs[:6]))
print("\n%s" % ("%d failures" % bad if bad else "all team-page checks passed"))
raise SystemExit(1 if bad else 0)
