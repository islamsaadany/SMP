"""§600: EVERY SLIDE TABLE'S COLUMNS AS WIDE AS WHAT THEY HOLD.

Islam, of the tactics slide: *"the outcome column is too narrow can we make
things more coherent to the content"*; of the mockup
(design-mockups/tactics-slide-widths/2026-10-23_columns-fit-content.html),
*"yes build it and apply to all slides"*.

What this asserts, both ends every time (§94.2):
  · the sharing rule itself (`deckShare`): shares by weight, a floor held, a
    cap held and what it leaves going back by the caps, nothing when the
    floors alone do not fit;
  · El Abd's shape — six tactics, short notes — MEASURED on the opened deck:
    every heading carries its width, the table is laid out fixed and fills
    the slide, Tactic and Outcome equal and over 200px where the Outcome had
    about 150, the Note no longer a quarter of the slide, every owner's name
    on one line, and all six tactics on one slide;
  · Owner and Collabs switched off: their room goes to Tactic and Outcome;
  · content-led: on the demo's tactics slides, whose notes are paragraphs,
    the Note is wider than on El Abd's, a slide and its continuation carry the
    same widths, and every fitted table on the deck fills its slide;
  · the PowerPoint download gives each column of the tactics table the share
    it has on the slide.

Point it at another build with SMP_BUILT to watch it fail.
"""
import base64, io, os, pathlib, re, zipfile
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
FILE = pathlib.Path(os.environ.get("SMP_BUILT") or (HERE.parent / "strategy-management-platform.html"))
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x != "" else ""))


def ev(pg, js, arg=None):
    try:
        return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    except Exception as e:                                   # noqa: BLE001 — §215
        return {"threw": str(e).split("\n")[0]}


# El Abd's D003 shape: six tactics, owners named, short notes.
MAKE = r"""() => {
  REVIEW.name = "Q3 2026"; REVIEW.to = "Sep " + cycleYear(); REVIEW.endsQuarter = 3;
  const u = UNITS["mobile"], p = u.items[1];
  p.name = "Growing FMCG"; delete p.breakdown;
  const R = SMPRules;
  const T = (name, outcome, qs, act, owner, col, note) => ({ name, outcome, outTarget:"Y/N", outActual:act, outCompile:"",
    q1:qs[0], q2:qs[1], q3:qs[2], q4:qs[3], status:"WIP", actual:null, owner, collaborators:col, note, id:"fit-"+name.slice(0,8) });
  p.tactics = [
    T("Cookies Communication Plan","Communication for cookies and its all categories",[0,0,1,0],R.ynJoin("wip",35),"Mona Adel",["Marketing"],"Cookies only so far"),
    T("Coffee Communication Plan","Communication for the Coffee",[0,0,1,0],R.YN_TODO,"Mona Adel",[],""),
    T("Core & New Category Bundling","Varies products mix",[0,0,1,1],R.YN_TODO,"Karim Samir",["Sales","Trade Marketing"],""),
    T("Current Portfolio Optimization","Relaunching Maamoul with competitive offering",[0,1,1,0],R.ynJoin("wip",90),"Hany Fawzy",["R&D"],"Packaging approved, launch in October"),
    T("Launch Chocolate-coated peanut","Product Launched",[0,0,1,0],R.YN_DONE,"Hany Fawzy",[],""),
    T("Digitalizing Route to Market","10k outlets coverage",[0,0,1,1],R.ynJoin("wip",80),"Ahmed Nabil",["IT","Sales"],"To be finalized Q4")];
  return pillarCode(u, 1);
}"""

# A tactics table on the opened deck, read in the slide's own pixels.
TABLE = """(split) => {
  const ss = [...document.querySelectorAll('#deckroot .deck .dslide')];
  const all = ss.filter(s => s.dataset.split === split || s.dataset.cont === split);
  if (!all.length) return { none: split };
  const s = all[0]; s.classList.add('on');
  const t = s.querySelector('table.zebra'), ths = [...t.querySelectorAll('thead th')];
  const head = ths.map(th => th.textContent.trim()), fw = ths.map(th => th.getAttribute('data-fw'));
  const oi = head.indexOf('Owner');
  const ownerLines = oi < 0 ? [] : [...t.querySelectorAll('tbody tr')].map(tr => tr.children[oi]).filter(Boolean)
    .filter(td => td.textContent.trim()).map(td => { const r = document.createRange(); r.selectNodeContents(td);
      return Math.round(r.getClientRects().length); });
  const out = { slides: all.length, rows: t.querySelectorAll('tbody tr').length, head, fw,
    layout: getComputedStyle(t).tableLayout, tw: t.offsetWidth, sum: fw.reduce((n, x) => n + (+x || 0), 0),
    ownerLines, contFw: all.slice(1).map(c => [...c.querySelectorAll('thead th')].map(th => th.getAttribute('data-fw'))) };
  s.classList.remove('on');
  return out;
}"""


def col(t, name):
    try:
        return int(t["fw"][t["head"].index(name)])
    except (ValueError, TypeError, KeyError, IndexError):
        return None


with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={"width": 1600, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    pg.goto("file://" + str(FILE))
    pg.wait_for_timeout(900)

    print("── 1 · the sharing rule")
    sh = ev(pg, """() => typeof deckShare !== 'function' ? null : {
      even:  deckShare(300, [{w:1, lo:10, hi:999}, {w:2, lo:10, hi:999}]),
      floor: deckShare(300, [{w:1, lo:150, hi:999}, {w:9, lo:10, hi:999}]),
      cap:   deckShare(300, [{w:1, lo:10, hi:50}, {w:1, lo:10, hi:100}]),
      none:  deckShare(100, [{w:1, lo:80, hi:999}, {w:1, lo:80, hi:999}]) }""")
    r = lambda xs: [round(x) for x in xs] if isinstance(xs, list) else xs
    ck("the room is shared by weight", isinstance(sh, dict) and r(sh.get("even")) == [100, 200], sh)
    ck("...a column is never under its floor", isinstance(sh, dict) and r(sh.get("floor")) == [150, 150], sh)
    ck("...nor over its cap, and what the caps leave goes back by the caps",
       isinstance(sh, dict) and r(sh.get("cap")) == [100, 200], sh)
    ck("...and floors that do not fit leave the table its own layout", isinstance(sh, dict) and sh.get("none") is None, sh)

    print("── 2 · El Abd's tactics slide, short notes")
    code = ev(pg, MAKE)
    ev(pg, "() => { current = 'mobile'; RAIL['unit:mobile'] = UNITS.mobile.items[1].id; paint(); }")
    pg.wait_for_timeout(300)
    ev(pg, "() => openDeck(UNITS['mobile'])")
    pg.wait_for_timeout(1000)
    ea = ev(pg, TABLE, str(code) + "T")
    ok = isinstance(ea, dict) and "fw" in ea
    ck("every heading carries its width, laid out fixed",
       ok and all(ea["fw"]) and ea["layout"] == "fixed", ea)
    if ok and all(ea["fw"]):
        ck("...and the columns fill the slide", abs(ea["sum"] - ea["tw"]) <= 4, (ea["sum"], ea["tw"]))
        ck("Tactic and Outcome equal, the Outcome over 200px (it had about 150)",
           col(ea, "Tactic") == col(ea, "Outcome") and col(ea, "Outcome") >= 200, ea["fw"])
        ck("the Note no longer holds a quarter of the slide", col(ea, "Note") < 0.15 * ea["tw"], ea["fw"])
        ck("every owner's name on one line", ea["ownerLines"] and all(n == 1 for n in ea["ownerLines"]), ea["ownerLines"])
        ck("all six tactics on one slide", ea["slides"] == 1 and ea["rows"] == 6, (ea["slides"], ea["rows"]))
    short_note = col(ea, "Note") if ok else None
    ev(pg, "() => { if (typeof closeDeck === 'function') closeDeck(); }")
    pg.wait_for_timeout(300)

    print("── 3 · Owner and Collabs switched off")
    ev(pg, "() => { GROUP.slideColsOff = ['collabs', 'owner']; openDeck(UNITS['mobile']); }")
    pg.wait_for_timeout(1000)
    off = ev(pg, TABLE, str(code) + "T")
    ck("their room goes to Tactic and Outcome, 280px or more each",
       isinstance(off, dict) and "Owner" not in off.get("head", []) and
       (col(off, "Tactic") or 0) >= 280 and (col(off, "Outcome") or 0) >= 280, off)
    ev(pg, "() => { delete GROUP.slideColsOff; if (typeof closeDeck === 'function') closeDeck(); }")
    pg.wait_for_timeout(300)

    print("── 4 · the demo's own deck: long notes, continuations, every table")
    pg.goto("file://" + str(FILE))
    pg.wait_for_timeout(900)
    ev(pg, "() => openDeck(UNITS['mobile'])")
    pg.wait_for_timeout(1200)
    demo = ev(pg, TABLE, "MB01T")
    ck("a slide of long notes gives the Note more room than El Abd's short ones",
       isinstance(demo, dict) and short_note and (col(demo, "Note") or 0) > short_note + 40,
       (demo.get("fw") if isinstance(demo, dict) else demo, short_note))
    ck("...and four tactics on its first slide, where the Note's quarter left three",
       isinstance(demo, dict) and demo.get("rows", 0) >= 4, demo)
    ck("a slide and its continuation carry the same widths",
       isinstance(demo, dict) and demo.get("contFw") and all(c == demo["fw"] for c in demo["contFw"]), demo)
    fills = ev(pg, """() => [...document.querySelectorAll('#deckroot .deck .dslide table.zebra')].filter(t =>
        t.querySelector('thead th[data-fw]')).map(t => { const s = t.closest('.dslide'); s.classList.add('on');
        const v = [t.offsetWidth, [...t.querySelectorAll('thead th')].reduce((n, th) => n + (+th.getAttribute('data-fw') || 0), 0),
          s.scrollWidth <= s.clientWidth]; s.classList.remove('on'); return v; })""")
    ck("every fitted table fills its slide and none runs off its edge",
       isinstance(fills, list) and len(fills) >= 8 and all(abs(a - b) <= 4 and fit for a, b, fit in fills), fills)
    ev(pg, "() => { if (typeof closeDeck === 'function') closeDeck(); }")

    print("── 5 · the PowerPoint download")
    want = ev(pg, """() => { if (typeof deckColFitBox !== 'function') return null;
      const box = document.createElement('div'); box.innerHTML = deckHtmlFor('mobile'); deckColFitBox(box);
      const s = [...box.querySelectorAll('.dslide')].find(x => x.dataset.split === 'MB01T');
      return s ? [...s.querySelectorAll('thead th')].map(th => +th.getAttribute('data-fw')) : null; }""")
    pptx = ev(pg, """() => { const b = buildReviewPptx('mobile');
      let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
      return btoa(s); }""")
    got = None
    if isinstance(pptx, str):
        z = zipfile.ZipFile(io.BytesIO(base64.b64decode(pptx)))
        for n in sorted(z.namelist(), key=lambda n: int((re.findall(r"\d+", n) or ["0"])[0])):
            if not re.match(r"ppt/slides/slide\d+\.xml$", n):
                continue
            xml = z.read(n).decode("utf8")
            if ">Tactic<" in xml and ">Outcome<" in xml:
                got = [int(x) for x in re.findall(r'<a:gridCol w="(\d+)"', xml)]
                break
    ok = isinstance(want, list) and got and len(got) == len(want)
    ck("the file's tactics table has the slide's columns", ok, (want, got))
    if ok:
        ws, gs = sum(want), sum(got)
        drift = max(abs(w / ws - g / gs) for w, g in zip(want, got))
        ck("...each with the share it has on the slide (within 2%)", drift < 0.02, round(drift, 4))

    ck("no page error", not errs, errs[:3])
    b.close()

print("\n" + ("slide-col-fit: all passed" if not bad else "%d FAILED" % bad))
