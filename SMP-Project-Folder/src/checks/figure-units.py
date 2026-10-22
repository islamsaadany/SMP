"""§573: THE UNIT A LITTLE SMALLER THAN ITS NUMBER, IN DARK GREY, AND DOLLARS
IN FRONT.

Islam: *"make the units in general always smaller than the number"*, *"a bit
bigger and maybe make it dark grey to be differentiated from the number"*,
and *"it should be $8m and $10b"* -- written `$8M`, the scale in capitals.

What this asserts, both ends every time (§94.2):
  · the writer: a word unit carries its own space (`6.2B EGP` still reads so
    as text), a symbol sits tight (`14%`), a dollar row reads `$2M` with the
    sign in front, the scale letter stays in the number, a bare scale is
    part of the amount, and anything without a unit is untouched;
  · Performance and the key measures slide, MEASURED: the unit is about four
    fifths of its number's size and in --ink-2, the K/M/B is full size, the
    `$` comes first, and inside the grey due line the unit takes the line's
    own ink;
  · the PowerPoint download: each figure is one word (`$2M`, `13.4%`,
    `322 EGP`, never `$ 2M` or `13.4 %`) and the unit is its own run,
    smaller and in dark grey.

The unit list itself (SQM, d and h off it, the four dollars on it, labelled
$ $K $M $B) is asserted in objective-unit.py beside the rest of the picker.

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


# A pillar of Mobile carrying one of each kind of unit.
MAKE = r"""() => {
  REVIEW.name = "Q3 2026"; REVIEW.to = "Sep 2026"; REVIEW.endsQuarter = 3;
  const u = UNITS["mobile"], p = u.items[1];
  const M = (name, target, actual) => ({ name, dir:"≥", target, compile:"Latest", actual, note:"",
                                         id:"fu-" + name.slice(0, 6) });
  p.measures = [M("Same-Store Sales Growth", "14%", "13.4%"),
                M("Average Transaction Value", "300 EGP", "322 EGP"),
                M("Store Revenue", "6.2B EGP", "3.1B EGP"),
                M("Export Sales", "2M USD", "1.4M USD"),
                M("New Shop Openings", "13#", "14#")];
  current = "mobile"; RAIL["unit:mobile"] = p.id;
  return pillarCode(u, 1);
}"""

# Each cell of a row that carries a unit: its figure as text, and the unit
# measured against the element it sits in.
CELLS = """(a) => {
  const scope = document.querySelector(a.scope);
  if (!scope) return { noScope: a.scope };
  const rows = [...scope.querySelectorAll('tr')].filter(r => r.textContent.includes(a.name));
  const r = rows[rows.length - 1];
  if (!r) return { noRow: a.name };
  return [...r.children].filter(td => td.querySelector('.fu')).map(td => {
    const c = td.cloneNode(true);
    c.querySelectorAll('.pdue, .ddue').forEach(x => x.remove());
    const fu = [...td.querySelectorAll('.fu')].find(x => !x.closest('.pdue, .ddue'));
    const host = fu.parentElement, cs = getComputedStyle(fu);
    const probe = document.createElement('span'); probe.style.color = 'var(--ink-2)'; host.appendChild(probe);
    const ink2 = getComputedStyle(probe).color; probe.remove();
    const due = td.querySelector('.pdue, .ddue'), dfu = due && due.querySelector('.fu');
    return { text: c.textContent.replace(/\\s+/g, ' ').trim(),
             unit: fu.textContent, pre: fu.classList.contains('pre'),
             first: host.firstChild === fu,
             ratio: Math.round(parseFloat(cs.fontSize) / parseFloat(getComputedStyle(host).fontSize) * 100) / 100,
             color: cs.color, ink2: ink2, numColor: getComputedStyle(host).color,
             due: due ? due.textContent.replace(/\\s+/g, ' ').trim() : null,
             dueInk: due ? getComputedStyle(due).color : null,
             dueUnitInk: dfu ? getComputedStyle(dfu).color : null };
  });
}"""


def figure_cells(pg, scope, name, label):
    got = ev(pg, CELLS, {"scope": scope, "name": name})
    ok = isinstance(got, list) and len(got) >= 2
    ck(label + ": the row's target and its figure both carry a unit apart", ok, got)
    return got if ok else []


def looks(cells, label, texts, unit, pre=False):
    ck(label + ": the figures read " + " and ".join(texts),
       [c["text"] for c in cells[:2]] == texts, [c.get("text") for c in cells])
    ck(label + ": the unit is " + repr(unit) + (", in front" if pre else ", after the number"),
       all(c["unit"].strip() == unit and c["pre"] == pre and c["first"] == pre for c in cells[:2]),
       [(c.get("unit"), c.get("pre"), c.get("first")) for c in cells])
    ck(label + ": a little smaller than its number (0.82)",
       all(abs(c["ratio"] - 0.82) < 0.02 for c in cells[:2]), [c.get("ratio") for c in cells])
    ck(label + ": in dark grey (--ink-2), apart from the number's own ink",
       all(c["color"] == c["ink2"] and c["color"] != c["numColor"] for c in cells[:2]),
       [(c.get("color"), c.get("ink2"), c.get("numColor")) for c in cells])


with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={"width": 1600, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    pg.goto("file://" + str(FILE))
    pg.wait_for_timeout(900)

    print("── 1 · the writer")
    w = ev(pg, """() => ({
      word: tgtShown("6.2B EGP"), plain: tgtShown("300 EGP"), pct: tgtShown("14%"),
      usd: tgtShown("2M USD"), bare: tgtShown("500 USD"), scale: tgtShown("5 M"),
      none: tgtShown("TBD"), yn: tgtShown("Y/N"), esc: tgtShown("1 <x>"),
      fig: typeof figHtml === 'function' ? figHtml("1.4M USD") : null })""")
    ck("a word unit is set apart and carries its own space",
       w.get("word") == '6.2B<span class="fu w"> EGP</span>' and
       w.get("plain") == '300<span class="fu w"> EGP</span>', w)
    ck("...the scale letter stays in the number, full size", "6.2B<" in str(w.get("word")), w.get("word"))
    ck("a symbol sits tight against its number", w.get("pct") == '14<span class="fu">%</span>', w.get("pct"))
    ck("a dollar row reads $2M, the sign in front",
       w.get("usd") == '<span class="fu pre">$</span>2M' and
       w.get("bare") == '<span class="fu pre">$</span>500', w)
    ck("...and a reported figure the same way ($1.4M)",
       w.get("fig") == '<span class="fu pre">$</span>1.4M', w.get("fig"))
    ck("a bare scale is part of the amount: 5M", w.get("scale") == "5M", w.get("scale"))
    ck("anything with no unit is untouched, and a yes/no row still says so",
       w.get("none") == "TBD" and w.get("yn") == "Yes / No", w)
    ck("...and a unit is escaped like everything else", w.get("esc") == '1<span class="fu">&lt;x&gt;</span>',
       w.get("esc"))

    print("── 2 · Performance, measured")
    code = ev(pg, MAKE)
    ev(pg, "() => paint()")
    pg.wait_for_timeout(300)
    ev(pg, """() => { const b = document.querySelector("[data-s='performance']"); if (b) b.click(); }""")
    pg.wait_for_timeout(600)
    ev(pg, "() => document.querySelectorAll('.pbody[hidden]').forEach(x => x.hidden = false)")
    pg.wait_for_timeout(300)
    rev = figure_cells(pg, "#panel", "Store Revenue", "Store Revenue")
    if rev:
        looks(rev, "Store Revenue", ["6.2B EGP", "3.1B EGP"], "EGP")
        ck("...and inside the grey due line the unit takes the line's own ink",
           rev[1]["due"] == "due 6.2B EGP" and rev[1]["dueUnitInk"] == rev[1]["dueInk"], rev[1])
    usd = figure_cells(pg, "#panel", "Export Sales", "Export Sales")
    if usd:
        looks(usd, "Export Sales", ["$2M", "$1.4M"], "$", pre=True)
        ck("...its due line reads due $2M", usd[1]["due"] == "due $2M", usd[1].get("due"))
    pct = figure_cells(pg, "#panel", "Same-Store Sales Growth", "Same-Store Sales Growth")
    if pct:
        looks(pct, "Same-Store Sales Growth", ["14%", "13.4%"], "%")

    print("── 3 · the key measures slide, measured")
    ev(pg, "() => openDeck(UNITS['mobile'])")
    pg.wait_for_timeout(800)
    idx = ev(pg, "s => [...document.querySelectorAll('#deckroot .deck .dslide')].findIndex(x => x.dataset.split === s)",
             str(code) + "M")
    if isinstance(idx, int) and idx > -1:
        ev(pg, "n => deckShow(n)", idx)
        pg.wait_for_timeout(400)
    srev = figure_cells(pg, "#deckroot .deck", "Store Revenue", "slide · Store Revenue")
    if srev:
        looks(srev, "slide · Store Revenue", ["6.2B EGP", "3.1B EGP"], "EGP")
        ck("slide · the due line's unit takes the line's own ink",
           srev[1]["dueUnitInk"] == srev[1]["dueInk"], srev[1])
    susd = figure_cells(pg, "#deckroot .deck", "Export Sales", "slide · Export Sales")
    if susd:
        looks(susd, "slide · Export Sales", ["$2M", "$1.4M"], "$", pre=True)
    ev(pg, "() => { if (typeof closeDeck === 'function') closeDeck(); }")

    print("── 4 · the PowerPoint download")
    pptx = ev(pg, """() => { const b = buildReviewPptx('mobile');
      let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
      return btoa(s); }""")
    if isinstance(pptx, str):
        z = zipfile.ZipFile(io.BytesIO(base64.b64decode(pptx)))
        paras, unit_runs = [], []
        for n in z.namelist():
            if not re.match(r"ppt/slides/slide\d+\.xml$", n):
                continue
            xml = z.read(n).decode("utf8")
            for p in re.findall(r"<a:p>.*?</a:p>", xml):
                runs = re.findall(r'<a:rPr lang="en" sz="(\d+)"[^>]*>.*?<a:srgbClr val="([0-9A-F]+)"/>.*?<a:t>([^<]*)</a:t>', p)
                paras.append("".join(r[2] for r in runs))
                for i, r in enumerate(runs):
                    if r[2].strip() in ("EGP", "$", "%") and i + 1 <= len(runs):
                        nb = runs[i - 1] if i else (runs[i + 1] if i + 1 < len(runs) else None)
                        unit_runs.append((r, nb))
        want = ["$2M", "$1.4M", "13.4%", "322 EGP", "6.2B EGP"]
        ck("each figure is one word in the file: " + ", ".join(want),
           all(x in paras for x in want), [x for x in want if x not in paras])
        ck("...never split by a stray space ($ 2M, 13.4 %)",
           not any(x in paras for x in ["$ 2M", "13.4 %", "14 %"]),
           [x for x in paras if x in ("$ 2M", "13.4 %", "14 %")])
        ck("the unit is a run of its own, smaller than its figure and in dark grey",
           unit_runs and all(r[1] == "334155" and nb and int(r[0]) < int(nb[0]) for r, nb in unit_runs),
           unit_runs[:4])
    else:
        ck("the PowerPoint download could be built", False, pptx)

    ck("no page error", not errs, errs[:3])
    b.close()

print("\n" + ("figure-units: all passed" if not bad else "%d FAILED" % bad))
