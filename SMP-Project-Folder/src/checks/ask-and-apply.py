"""SETUP: A CHANGE AS YOU GO, ASKED FIRST, OR APPLIED (§621).

qa-run: own-server — the asking box reports what the SERVER answered (Saved
on the cell), the colours must reach the save only after Apply, and Client
set-up's modules and archive post to /api/platform: all of it needs a server,
so this file is its own, and it records what is posted (§96).

Islam, across one afternoon: *"giving more or less needs the confirmation
… with the impact of the change, as a floating box not a bar"*; *"make the
floating boxes fit the content"*; *"the color shouldn't change before apply;
the undo is just a temp button … and reset can revert it back to shipped
palette"*; *"make this a general rule of colors elements"*; of Client
set-up, *"it should act as per the adjustment unless we are removing
something that has data"*; *"yes remove terminology"*; *"the end in mind
should have a check box as well"*; and *"clean the setup pages from
unnecessary paragraphs"*.

WHAT IS ASSERTED IS EACH PROMISE, BOTH ENDS (§94.2, §113.8):

  1 · ROLES & ACCESS. Giving more and taking away both open the box, beside
      the cell, naming the role, its people and the impact in words; nothing
      is written while it is open; Keep and Esc leave ACCESS byte-identical;
      Change it writes and the cell says Saved once the server answered. The
      box is sized to its sentence — narrower than its cap on a short one.
  2 · THE TENANT'S COLOURS. A pick is held: not in branding(), not on the
      page, not in any POST. Leaving asks and stays; Keep editing keeps it.
      Apply writes, the page wears it, the save carries it, Undo puts it back.
      Reset to the shipped palette waits for Apply too.
  3 · SCORING BANDS. An edit goes to the draft and Done gives way to Apply;
      Apply asks with the count of measures it moves; Keep leaves BANDS;
      Apply writes; Undo restores; floors out of order hold Apply greyed.
  4 · END IN MIND. Its tick on the top and unit cards and not on the
      functions'; unticking where Mobile has one asks and Keep changes
      nothing; Hide it stores an absence-shaped off and takes the line off
      Mobile's Foundation; ticking it again asks nothing and brings it back.
  5 · ASKING ONLY WHERE SOMETHING IS WRITTEN. A part nobody wrote in unticks
      at once, with no box.
  6 · MODULES AND ARCHIVE ask in the box, and Keep posts nothing.
  7 · TERMINOLOGY LEFT SETUP, and the agreed paragraphs left the pages.

EVERY PROBE DEGRADES (§215).

Run: python3 qa-run.py checks/ask-and-apply.py
     SMP_BUILT=<another build> …   # prove it can fail (§276)
"""
import json, os, pathlib, threading, time, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = pathlib.Path(os.environ.get("SMP_BUILT") or
                    (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")).read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
SAVES, PLATFORM = [], []
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
                    "client": {"key": "raya-trade", "name": "Raya Trade", "status": "active", "made_here": True,
                               "industry": "Retail", "size": "1000+", "notes": "", "mark": None,
                               "modules": ["strategy", "insights"]},
                    "team": [], "seats": [], "canEdit": True, "register": [], "office": [],
                    "shape": None, "holds": None, "goes": None, "canArchive": True, "canDelete": False,
                    "modules": ["strategy", "insights"],
                    "offer": [{"key": "strategy", "label": "Strategy", "note": "", "always": True},
                              {"key": "insights", "label": "Insights", "note": "The library"}]
                }).encode(), "application/json")
                return
            PLATFORM.append(body)
        if self.path.startswith("/api/state"):
            SAVES.append(raw)
        self._s(200, b'{"ok":true}', "application/json")


def ev(pg, js, default=None):
    try:
        return pg.evaluate(js)
    except Exception as e:
        errs.append("PROBE: " + str(e)[:160])
        return default


def click(pg, sel, wait=300):
    """Press through the page's own handler; a missing control reports, never waits (§215)."""
    ok = ev(pg, "()=>{const b=document.querySelector(%s); if(!b) return false; b.click(); return true;}" % json.dumps(sel), False)
    pg.wait_for_timeout(wait)
    return ok


def setup_go(pg, key, wait=900):
    ev(pg, "()=>{const r=document.querySelector('[data-setupgo=\"%s\"]'); if(r) r.click();}" % key)
    pg.wait_for_timeout(wait)


def box(pg):
    return ev(pg, """()=>{const a=document.querySelector('.askbox'); if(!a) return null;
      const r=a.getBoundingClientRect(); return {t:a.innerText.replace(/\\n/g,' | '), w:Math.round(r.width),
      top:Math.round(r.top), left:Math.round(r.left)};}""", None)


ACC_ROW = "[...document.querySelectorAll('.acgrid tbody tr')].find(r=>/^\\s*%s/.test(r.children[0].textContent))"

srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % srv.server_address[1]

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or "/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    pg.goto(URL, wait_until="networkidle")
    pg.wait_for_timeout(1500)
    ck("the platform is live (a server answered)", ev(pg, "()=>SYNC.isLive()") is True)
    try:
        pg.click('button[title="Setup"]', timeout=2500)
    except Exception:
        errs.append("PROBE: no Setup button")
    pg.wait_for_timeout(300)

    # ── 1 · ROLES & ACCESS ──────────────────────────────────────────────
    print("\n1 · Roles & access asks first, giving or taking, and says Saved on the cell")
    setup_go(pg, "access")
    acc0 = ev(pg, "()=>JSON.stringify(ACCESS)")
    more = "(" + ACC_ROW % "Custodian" + ").children[2].querySelector('[data-acm$=\"|edit\"]')"
    ev(pg, "()=>{const b=%s; if(b) b.click();}" % more); pg.wait_for_timeout(300)
    bx = box(pg) or {}
    ck("giving more opens the box", bool(bx), bx)
    ck("…naming the role and its people", "Custodian" in bx.get("t", "") and "people" in bx.get("t", ""), bx.get("t"))
    ck("…and the impact in words", "Will be able to read and change their own plan" in bx.get("t", ""), bx.get("t"))
    near = ev(pg, "()=>{const a=document.querySelector('.askbox'), c=%s; if(!a||!c) return null;"
                  "const r=a.getBoundingClientRect(), q=c.getBoundingClientRect();"
                  "return Math.abs(r.top-q.bottom)<40 || Math.abs(q.top-r.bottom)<40;}" % more, None)
    ck("…beside the cell that was pressed", near is True, near)
    ck("…sized to its sentence, within its cap", 0 < bx.get("w", 0) <= 360, bx.get("w"))
    ck("nothing is written while it is open", ev(pg, "()=>JSON.stringify(ACCESS)") == acc0)
    click(pg, ".askbox .askno")
    ck("Keep as it was changes nothing, and closes it",
       ev(pg, "()=>JSON.stringify(ACCESS)") == acc0 and box(pg) is None)
    ev(pg, "()=>{const b=%s; if(b) b.click();}" % more); pg.wait_for_timeout(250)
    pg.keyboard.press("Escape"); pg.wait_for_timeout(250)
    ck("Esc keeps too", ev(pg, "()=>JSON.stringify(ACCESS)") == acc0 and box(pg) is None)
    ev(pg, "()=>{const b=%s; if(b) b.click();}" % more); pg.wait_for_timeout(250)
    saves0 = len(SAVES)
    click(pg, ".askbox .askyes", 1200)
    ck("Change it writes the grant", ev(pg, "()=>grantFor('custodian','a_unit_own_strat')") == "edit",
       ev(pg, "()=>grantFor('custodian','a_unit_own_strat')"))
    ck("…the server received it", len(SAVES) > saves0, len(SAVES) - saves0)
    ck("…and the cell says Saved", ev(pg, "()=>{const c=(%s); return !!c && /Saved/.test(c.children[2].textContent);}" % (ACC_ROW % "Custodian"), False))
    less = "(" + ACC_ROW % "Custodian" + ").children[2].querySelector('[data-acm$=\"|view\"]')"
    ev(pg, "()=>{const b=%s; if(b) b.click();}" % less); pg.wait_for_timeout(300)
    bx = box(pg) or {}
    ck("taking away asks the same way, saying what they lose",
       "only be able to read their own plan" in bx.get("t", "") and "no longer change it" in bx.get("t", ""), bx.get("t"))
    click(pg, ".askbox .askyes", 900)
    ck("…and Change it takes it", ev(pg, "()=>grantFor('custodian','a_unit_own_strat')") == "view")

    # ── 2 · THE TENANT'S COLOURS ────────────────────────────────────────
    print("\n2 · a colour waits for Apply; leaving asks; Undo puts it back")
    setup_go(pg, "start", 1600)
    click(pg, ".csetup [data-cstab=brand]", 800)   # §624: the colours are on Profile's Brand tab
    gold = "()=>getComputedStyle(document.documentElement).getPropertyValue('--gold').trim().toUpperCase()"
    g0, a0, saves0 = ev(pg, gold), ev(pg, "()=>branding().accent"), len(SAVES)
    ev(pg, """()=>{const i=document.querySelector('.csetup [data-brand=accent]'); if(!i) return;
      i.value='#1f6f8b'; i.dispatchEvent(new Event('change',{bubbles:true}));}""")
    pg.wait_for_timeout(1200)
    row = ev(pg, "()=>(document.querySelector('[data-applyrow=brand]')||{}).textContent||''", "")
    ck("a pick is held, and the row says what waits", "1 change not applied yet: the accent" in row, row)
    ck("…not written", ev(pg, "()=>branding().accent") == a0)
    ck("…not worn by the page", ev(pg, gold) == g0, (g0, ev(pg, gold)))
    ck("…and not sent", not any("#1F6F8B" in s.upper() for s in SAVES[saves0:]))
    setup_go(pg, "bands", 700)
    strip = ev(pg, "()=>(document.querySelector('.leavestrip')||{}).textContent||''", "")
    ck("leaving asks, naming what waits", "The tenant’s colours" in strip and "the accent" in strip, strip)
    ck("…and the page stays where the colour is", ev(pg, "()=>currentSub") == "start", ev(pg, "()=>currentSub"))
    click(pg, '.leavestrip [data-leave="stay"]')
    ck("Keep editing keeps it waiting",
       ev(pg, "()=>!document.querySelector('.leavestrip') && brandWaiting().length===1", False))
    click(pg, "[data-applygo=brand]", 1200)
    ck("Apply writes it", ev(pg, "()=>branding().accent") == "#1F6F8B", ev(pg, "()=>branding().accent"))
    ck("…the page wears it", ev(pg, gold) == "#1F6F8B", ev(pg, gold))
    ck("…the save carries it", any("#1F6F8B" in s.upper() for s in SAVES[saves0:]))
    ck("…and the row says Applied, with Undo",
       ev(pg, "()=>{const r=document.querySelector('[data-applyrow=brand]'); return !!r && /Applied/.test(r.textContent) && !!r.querySelector('[data-applyundo]');}", False))
    click(pg, "[data-applyundo=brand]", 800)
    ck("Undo puts back the colour from before", ev(pg, "()=>branding().accent") == a0 and ev(pg, gold) == g0,
       (ev(pg, "()=>branding().accent"), ev(pg, gold)))
    ev(pg, "()=>{branding().accent='#1F6F8B'; applyBrand(); paint();}"); pg.wait_for_timeout(400)
    click(pg, "[data-brandreset]", 400)
    ck("Reset to the shipped palette waits for Apply too",
       ev(pg, "()=>branding().accent") == "#1F6F8B" and "shipped palette" in (ev(pg, "()=>(document.querySelector('[data-applyrow=brand]')||{}).textContent||''", "") or ""))
    click(pg, "[data-applygo=brand]", 500)
    ck("…and Apply resets", ev(pg, "()=>branding().accent") in (None, ""), ev(pg, "()=>branding().accent"))

    # ── 3 · SCORING BANDS ───────────────────────────────────────────────
    print("\n3 · the bands are a colour area: a draft, Apply with its count, Undo")
    setup_go(pg, "bands", 700)
    click(pg, "[data-edit=bands]", 400)
    bands0 = ev(pg, "()=>JSON.stringify(BANDS.bands)")
    ev(pg, """()=>{const i=document.querySelector('input.bfloor'); if(!i) return;
      i.value='80'; i.dispatchEvent(new Event('change',{bubbles:true}));}""")
    pg.wait_for_timeout(400)
    ck("a floor typed goes to the draft; the stored bands are untouched",
       ev(pg, "()=>JSON.stringify(BANDS.bands)") == bands0 and ev(pg, "()=>!!BANDS_DRAFT", False))
    ck("…Done gives way to Apply",
       not ev(pg, "()=>!!document.querySelector('[data-edit=bands]')", True) and
       ev(pg, "()=>!!document.querySelector('[data-applygo=bands]')", False))
    click(pg, "[data-applygo=bands]", 400)
    bx = box(pg) or {}
    ck("Apply asks, counting the measures it would move", "scored measures would show a different band" in bx.get("t", "")
       and any(ch.isdigit() for ch in bx.get("t", "")), bx.get("t"))
    click(pg, ".askbox .askno", 300)
    ck("…Keep leaves the bands as they were", ev(pg, "()=>JSON.stringify(BANDS.bands)") == bands0)
    click(pg, "[data-applygo=bands]", 300)
    click(pg, ".askbox .askyes", 800)
    ck("Apply writes the floor", ev(pg, "()=>BANDS.bands[0].floor") == 80, ev(pg, "()=>BANDS.bands[0].floor"))
    click(pg, "[data-applyundo=bands]", 500)
    ck("Undo restores the bands", ev(pg, "()=>JSON.stringify(BANDS.bands)") == bands0)
    click(pg, "[data-edit=bands]", 300)
    ev(pg, """()=>{const i=document.querySelector('input.bfloor'); if(!i) return;
      i.value='50'; i.dispatchEvent(new Event('change',{bubbles:true}));}""")
    pg.wait_for_timeout(400)
    ck("floors out of order hold Apply greyed, beside the note that says why",
       ev(pg, "()=>{const a=document.querySelector('[data-applygo=bands]'); return !!a && a.disabled;}", False) and
       ev(pg, "()=>/Floors must descend/.test(document.querySelector('#panel').textContent)", False))
    click(pg, "[data-applydrop=bands]", 400)
    ck("…and Discard drops the draft", ev(pg, "()=>BANDS_DRAFT===null", False) and ev(pg, "()=>JSON.stringify(BANDS.bands)") == bands0)
    ck("the threshold paragraph is not on the page any more",
       not ev(pg, "()=>/Changing a threshold rewrites history/.test(document.querySelector('#panel').textContent)", True))
    ck("…and the reward paragraph is the row's hover",
       ev(pg, "()=>!/delivering the commitment earns/.test(document.querySelector('#panel').innerText) && "
              "[...document.querySelectorAll('#panel .tip')].some(t=>/delivering the commitment earns/.test(t.dataset.tip||''))", False))

    # ── 4 · END IN MIND ─────────────────────────────────────────────────
    print("\n4 · End in Mind has a tick of its own, and unticking it where written asks")
    setup_go(pg, "start", 1200)
    click(pg, "[data-setupgo=shape]", 1000)
    ck("the top card has End in Mind, ticked, under Winning Aspiration",
       ev(pg, "()=>{const r=document.querySelector('.csetup [data-steim=top]'); const p=r&&r.previousElementSibling;"
              "return !!r && r.querySelector('.sttick').getAttribute('aria-pressed')==='true' &&"
              " !!p && /^Aspiration/.test((p.querySelector('input')||{getAttribute(){return ''}}).getAttribute('aria-label')||'');}", False))
    click(pg, '.csetup [data-shlvl="fn"]', 700)
    ck("the functions' card has none (a function has no aspiration)",
       not ev(pg, "()=>!!document.querySelector('.csetup [data-steim]')", True))
    click(pg, '.csetup [data-shlvl="bu"]', 800)
    ck("the units' card has it", ev(pg, "()=>!!document.querySelector('.csetup [data-steim=bu]')", False))
    st0 = ev(pg, "()=>JSON.stringify(GROUP.structure||null)")
    click(pg, ".csetup [data-steim=bu] .sttick", 400)
    bx = box(pg) or {}
    ck("unticking where Mobile has one asks, naming Mobile", "Mobile" in bx.get("t", "") and "End in Mind" in bx.get("t", ""), bx.get("t"))
    click(pg, ".askbox .askno", 300)
    ck("…Keep changes nothing", ev(pg, "()=>JSON.stringify(GROUP.structure||null)") == st0)
    click(pg, ".csetup [data-steim=bu] .sttick", 300)
    click(pg, ".askbox .askyes", 600)
    ck("Hide it stores an off, the first section's own shape",
       ev(pg, "()=>JSON.stringify(GROUP.structure&&GROUP.structure.bu&&GROUP.structure.bu.eim)") == '{"on":false}')
    ck("…and takes the line off Mobile's Foundation", "endin" not in (ev(pg, "()=>renderUnitFoundation(UNITS.mobile)", "endin") or "endin"))
    click(pg, ".csetup [data-steim=bu] .sttick", 600)
    ck("ticking it again asks nothing and brings it back",
       box(pg) is None and "endin" in (ev(pg, "()=>renderUnitFoundation(UNITS.mobile)", "") or ""))

    # ── 5 · ASKING ONLY WHERE SOMETHING IS WRITTEN ──────────────────────
    print("\n5 · a part nobody wrote in unticks at once")
    click(pg, '.csetup [data-shlvl="top"]', 700)
    # THE STATE IS MADE (§255): the demo's group has Core Values written, so
    # they are emptied for this one press and put back after (§94.2).
    kept = ev(pg, "()=>JSON.stringify(GROUP.values||[])")
    ev(pg, "()=>{GROUP.values=[]; paint();}"); pg.wait_for_timeout(400)
    if ev(pg, "()=>(document.querySelector('.csetup [data-stcomp=\"top|values\"]')||{}).getAttribute && "
              "document.querySelector('.csetup [data-stcomp=\"top|values\"]').getAttribute('aria-pressed')") != "true":
        click(pg, '.csetup [data-stcomp="top|values"]', 400)          # on never asks
    click(pg, '.csetup [data-stcomp="top|values"]', 400)
    ck("unticking Core Values on the top card, where nothing is written, applies with no box",
       box(pg) is None and "values" not in (ev(pg, "()=>SMPRules.levelComponents(GROUP,'top')", ["values"]) or ["values"]))
    click(pg, '.csetup [data-stcomp="top|values"]', 400)
    ev(pg, "()=>{GROUP.values=%s; paint();}" % kept); pg.wait_for_timeout(300)
    click(pg, '.csetup [data-stcomp="top|values"]', 400)
    ck("…while the same press with Core Values written asks first",
       "Core Values" in ((box(pg) or {}).get("t", "")) or "Values" in ((box(pg) or {}).get("t", "")), box(pg))
    click(pg, ".askbox .askno", 300)

    # ── 6 · MODULES AND ARCHIVE ─────────────────────────────────────────
    print("\n6 · turning a module off, and archiving, ask in the box")
    click(pg, "[data-setupgo=start]", 900)
    click(pg, ".csetup [data-cstab=modules]", 800)   # §624: Profile's Modules tab
    posts0 = len(PLATFORM)
    click(pg, '.csetup [data-module="insights"] button', 400)
    bx = box(pg) or {}
    ck("Turn off asks, saying what it takes away", "Insights" in bx.get("t", "") and "Nothing in it is deleted" in bx.get("t", ""), bx.get("t"))
    click(pg, ".askbox .askno", 300)
    ck("…and Keep posts nothing", len(PLATFORM) == posts0, PLATFORM[posts0:])
    click(pg, ".csetup [data-cstab=details]", 800)   # §624: archiving is at the foot of Details
    click(pg, '.csetup [data-archive="ask"]', 400)
    bx = box(pg) or {}
    ck("Archive asks in the box", "Archive Raya Trade?" in bx.get("t", "") and "Everything they have is kept" in bx.get("t", ""), bx.get("t"))
    click(pg, ".askbox .askno", 300)
    ck("…and Keep posts nothing", len(PLATFORM) == posts0, PLATFORM[posts0:])

    # ── 7 · TERMINOLOGY, AND THE PARAGRAPHS ─────────────────────────────
    print("\n7 · Terminology left Setup, and the agreed paragraphs left the pages")
    ck("no Terminology page on the rail or in the defs",
       ev(pg, "()=>!document.querySelector('[data-setupgo=labels]') && !setupDefsAll().some(d=>d.k==='labels')", False))
    txt = ev(pg, "()=>document.querySelector('.csetup').innerText", "") or ""
    for gone in ["What the platform is named after on the console", "Made from the name and set once",
                 "the door this client's people sign in at", "The tenant’s face is set", "Branding is the tenant’s",
                 "Turning one on gives this client the module", "Archiving takes Raya Trade off"]:
        ck("…gone from Getting started: %s…" % gone[:34], gone not in txt)
    # §624: the facts are split across Profile's tabs now — the name and the
    # address on Details, the mark and the colours on Brand.
    TIPS = "()=>document.querySelectorAll('.csetup .tip, #panel .section-h .tip').length"
    t_details = ev(pg, TIPS, 0) or 0
    click(pg, ".csetup [data-cstab=brand]", 700)
    t_brand = ev(pg, TIPS, 0) or 0
    click(pg, ".csetup [data-cstab=details]", 700)
    ck("…and their facts are hovers, on the tab each belongs to", t_details >= 2 and t_brand >= 2, (t_details, t_brand))
    click(pg, "[data-setupgo=shape]", 900)
    note = ev(pg, "()=>(document.querySelector('.csetup .wzarched')||{}).innerText||''", "") or ""
    ck("the shape's notice is one line", "rows can’t be added here" in note and "§544.14" not in note and len(note) < 140, note)

    b.close()

ck("no page errors", not [e for e in errs if not e.startswith("PROBE")], errs[:3])
ck("every probe answered (§215)", not [e for e in errs if e.startswith("PROBE")], errs[:3])
print("\n%d failure%s" % (bad, "" if bad == 1 else "s"))
raise SystemExit(1 if bad else 0)
