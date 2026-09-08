"""THE REVIEW DECK AS A POWERPOINT, MADE TO READ LIKE THE DECK (§311).

Islam, of a file downloaded from his own tenant: *"the presentations design
look bad is there a way to make it look better? matching what we present?"* —
and, of three ways forward, **B**: fix the faults AND match the deck's look.

THE FILE IS BUILT AND READ BACK, never described. The check drives the real
`buildReviewPptx()` in the running platform, unzips what it returns and reads
the slide XML — so it measures the artefact somebody opens rather than the
code that writes it, which is the only way a converter can be checked at all
(§96: a builder wired to nothing renders perfectly).

WHAT IS ASSERTED, and why each one can fail:

  1 · THE NEW READERS ARE ASKED FOR BY NAME FIRST (§215). A build without
      them throws inside the builder, and a check that dies reports nothing,
      which reads exactly like a pass.

  2 · WHERE THE UNIT STANDS CARRIES ITS THREE FIGURES. The worst fault of
      the round: the slide printed three headings and no numbers, because
      the figures are `<b>` inside a `.headcell` and the lead reader was
      looking for `.dlab` and paragraphs. Asserted as AGREEMENT with what
      the deck's own HTML holds, never as three literals (§94.8).

  3 · NOTHING RUNS TOGETHER. A pillar's name and its grey sub-line, and a
      SWOT item's number and its first word, are separated on the screen by
      layout and were one word in the file. Both ends: the joined form is
      absent AND the two halves are present.

  4 · A FIGURE IS RIGHT-ALIGNED, ITS SCORE WEARS ITS BAND, AND THE
      BENCHMARK IS THE QUIETER HALF OF ITS OWN CELL. The three things that
      make a column readable from the back of a room, and all three were
      plain black hard left.

  5 · A HEADING FITS ITS OWN COLUMN. Shares alone gave a numeric column half
      a prose one whatever it was called, so PowerPoint broke the headings
      as "Progres s". Checked against every column of every table.

  6 · THE HEADLINE PAIR IS IN THE HEAD, NOT IN THE LEAD. Both ends, or a
      build that simply deleted the four stray lines would pass.

  7 · THE PILLARS ROLL-CALL IS CARDS. It fell through to the leaf-text
      fallback and became one line per code and one per name.

  8 · THE MARK IS IN THE PACKAGE AND ON THE CONTENT SLIDES ONLY — with the
      media part, the png content type and the per-slide relationship that
      carrying a picture costs. Absent from the cover and the dividers,
      which is `deckFootMarks()`'s own rule (§259.1).

  9 · A TABLE IS THE CONTENT OF ITS SLIDE. The row height and the type size
      grew together, and the rows a slide holds are derived from the row
      height rather than restated (§122.5).

 10 · AND THE PLAN DOWNLOAD IS UNTOUCHED (§94.2). It shares every primitive
      changed here, so a build that moved its row height, its type size or
      its head would pass everything above and would have altered a second
      artefact nobody asked about.
"""
import base64
import io
import os
import re
import zipfile

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
FILE = os.environ.get("SMP_BUILT") or os.path.join(
    os.path.dirname(HERE), "strategy-management-platform.html")
fails = []

BANDS = {"2E7D5B", "B8860B", "CC6B3D", "B04434", "676C73"}
ROW_H = "457200"
HEAD_CH, CELL_PAD = 63500, 144000


def ok(label, cond, got=None):
    if cond:
        print("  ok   " + label)
    else:
        fails.append(label)
        print("  FAIL " + label + ("" if got is None else "  — %s" % (got,)))


def js(pg, expr, arg=None):
    """Every probe degrades rather than dying (§215)."""
    try:
        return pg.evaluate(expr, arg) if arg is not None else pg.evaluate(expr)
    except Exception as e:                                    # noqa: BLE001
        return {"threw": str(e).strip().split("\n")[0][:160]}


B64 = """(t)=>{
  const b = buildReviewPptx(t);
  let s = ''; const CH = 0x8000;
  for (let i = 0; i < b.length; i += CH)
    s += String.fromCharCode.apply(null, b.subarray(i, i + CH));
  return btoa(s);
}"""

# The deck's OWN answer for the same slide, so the file is compared with the
# thing it is a conversion of rather than with three numbers typed here.
DECKFACTS = """(t)=>{
  const box = document.createElement('div');
  box.innerHTML = deckHtmlFor(t);
  const txt = e => (e && e.textContent || '').replace(/\\s+/g,' ').trim();
  const stand = [...box.querySelectorAll('.headcell')].map(c => ({
    k: txt(c.querySelector('.dlab')), v: txt(c.querySelector('b')) }));
  const cards = [...box.querySelectorAll('.pcard')].map(c => ({
    c: txt(c.querySelector('.pcard-c')), n: txt(c.querySelector('.pcard-n')) }));
  const dirs = [...box.querySelectorAll('td.dirname')].map(td => ({
    main: txt(td.querySelector('b')), sub: txt(td.querySelector('.dsub')) }));
  const swot = [...box.querySelectorAll('ol.dswot li')].map(li => ({
    n: txt(li.querySelector('.n')),
    t: txt([...li.children].filter(x => !x.classList.contains('n'))[0]) }));
  /* THE PAIR IS PER SLIDE, and asking the whole deck for `.dstats > span`
     returned all eight — two pillars, two tables each — so the count could
     never match one slide's. The first slide that has one is the one the
     measures slide below is compared against. */
  const one = box.querySelector('.dstats');
  const stats = one ? [...one.children].map(s => ({
    k: txt(s.querySelector('i')), v: txt(s.querySelector('b')) })) : [];
  return { stand, cards, dirs, swot, stats,
           slides: box.querySelectorAll('.dslide').length };
}"""


def texts(xml):
    return [re.sub(r"\s+", " ", t).strip()
            for t in re.findall(r"<a:t>(.*?)</a:t>", xml, re.S)]


def unesc(s):
    return (s.replace("&amp;", "&").replace("&lt;", "<")
             .replace("&gt;", ">").replace("&quot;", '"').replace("&#39;", "'"))


def load(pg, target):
    b = js(pg, B64, target)
    if not isinstance(b, str):
        return None
    z = zipfile.ZipFile(io.BytesIO(base64.b64decode(b)))
    names = z.namelist()
    slides = {}
    for n in names:
        m = re.match(r"ppt/slides/slide(\d+)\.xml$", n)
        if m:
            slides[int(m.group(1))] = z.read(n).decode("utf-8")
    return {"z": z, "names": names, "slides": slides,
            "order": [slides[k] for k in sorted(slides)]}


def find(pkg, needle):
    for xml in pkg["order"]:
        if needle in unesc(xml):
            return xml
    return None


def main():
    with sync_playwright() as p:
        chrome = os.environ.get("SMP_CHROME")
        b = (p.chromium.launch(executable_path=chrome) if chrome
             else p.chromium.launch())
        pg = b.new_page(viewport={"width": 1500, "height": 900})
        pg.goto("file://" + FILE)
        pg.wait_for_timeout(1200)

        print("\n§1 · the readers this depends on exist")
        have = js(pg, """()=>['deckCellSpec','deckHeadCells','deckCards','deckStats',
          'deckPieces','pngSize','dataUriBytes','reviewPptxMark','buildReviewPptx']
          .filter(n => typeof window[n] === 'function')""")
        ok("all nine readers are declared", isinstance(have, list) and len(have) == 9, have)
        if not (isinstance(have, list) and len(have) == 9):
            print("\n%d failures" % len(fails))
            b.close()
            return

        facts = js(pg, DECKFACTS, "care")
        pkg = load(pg, "care")
        ok("the file builds and holds slides",
           bool(pkg) and len(pkg["slides"]) > 0,
           None if pkg else "no bytes came back")
        if not pkg:
            print("\n%d failures" % len(fails))
            b.close()
            return

        # ── §2 ───────────────────────────────────────────────────────────
        print("\n§2 · Where the unit stands carries its figures")
        stand = find(pkg, "Where the unit stands")
        ok("the slide is in the file", stand is not None)
        if stand:
            ts = [unesc(t) for t in texts(stand)]
            want = facts.get("stand") or []
            ok("the deck itself has three readings here", len(want) == 3, len(want))
            missing = [c["v"] for c in want if c["v"] not in ts]
            ok("every figure the deck shows is on the slide", not missing, missing)
            labs = [c["k"].upper() for c in want]
            ok("and so is every label", all(l in ts for l in labs), labs)
            ok("the figures are set large",
               any('sz="5400"' in seg for seg in stand.split("<a:t>")), None)

        # ── §3 ───────────────────────────────────────────────────────────
        print("\n§3 · nothing runs together")
        dirs = facts.get("dirs") or []
        # MATCHED ON THE ROW, NEVER ON THE TITLE. "where we stand" is the
        # deck's own phrasing for TWO slides (§254.5's own note about them
        # being named apart), so searching for it found the objectives
        # table and reported a correct build broken. 
        score = find(pkg, dirs[0]["sub"]) if dirs else None
        ok("the deck's score table has rows with a sub-line",
           len(dirs) > 0 and all(d["sub"] for d in dirs), len(dirs))
        if score and dirs:
            ts = [unesc(t) for t in texts(score)]
            glued = [d["main"] + d["sub"] for d in dirs]
            # ASKED OF ONE RUN, NEVER OF THE WHOLE SLIDE. The two halves are
            # consecutive <a:t> elements in a correct file, so joining every
            # run and searching the result finds the glued form on every
            # build — an assertion that could only ever fail (§94.5, with
            # the sign reversed).
            ok("the name and its sub-line are not one string",
               not any(g in t for t in ts for g in glued),
               [g for g in glued if any(g in t for t in ts)][:1])
            ok("both halves are present, as their own runs",
               all(d["main"] in ts and d["sub"] in ts for d in dirs),
               [d["main"] for d in dirs if d["main"] not in ts][:2])
        sw = facts.get("swot") or []
        ok("the deck has SWOT items to convert", len(sw) > 0, len(sw))
        if sw:
            allt = " || ".join(unesc(t) for xml in pkg["order"] for t in texts(xml))
            glued = [s["n"] + s["t"] for s in sw if s["n"] and s["t"]]
            ok("a SWOT item's number is not stuck to its words",
               not any(g in allt for g in glued),
               [g[:40] for g in glued if g in allt][:1])
            # REWRITTEN, NOT LOOSENED (§218, §214.3). This asked for the
            # number and the words as ONE run with a space between them,
            # which was the first build's shape; §311 then gave the number
            # its own run in the accent, as the signed-off mockup drew it.
            # The claim is unchanged — the item is there AND it is numbered
            # — and it is now asserted of the two runs rather than of one
            # spelling of them.
            swtxt = [unesc(t) for xml in pkg["order"] for t in texts(xml)]
            ok("and the item is still there, numbered",
               all(s["t"] in swtxt and any(x.strip() == s["n"] for x in swtxt)
                   for s in sw if s["n"] and s["t"]),
               [s["t"][:40] for s in sw if s["t"] not in swtxt][:2])

        # ── §4 ───────────────────────────────────────────────────────────
        print("\n§4 · a figure is aligned, banded, and carries its benchmark")
        meas = find(pkg, "Key measures")
        ok("a measures slide is in the file", meas is not None)
        if meas:
            cells = re.findall(r"<a:tc>(.*?)</a:tc>", meas, re.S)
            right = [c for c in cells if 'algn="r"' in c]
            ok("figures are right-aligned", len(right) >= 3, len(right))
            banded = [c for c in cells
                      if any(('val="%s"' % h) in c for h in BANDS) and 'b="1"' in c]
            ok("a score wears its band, in bold", len(banded) >= 1, len(banded))
            two = [c for c in cells if c.count("<a:r>") == 2 and 'i="1"' in c]
            ok("the benchmark is a second, italic run in the same cell",
               len(two) >= 1, len(two))
            ok("and it is the quieter of the two",
               any('val="5E6E88"' in c for c in two), None)

        # ── §5 ───────────────────────────────────────────────────────────
        print("\n§5 · a heading fits its own column")
        bad = []
        for xml in pkg["order"]:
            for tbl in re.findall(r"<a:tbl>(.*?)</a:tbl>", xml, re.S):
                ws = [int(w) for w in re.findall(r'<a:gridCol w="(\d+)"', tbl)]
                first = re.search(r"<a:tr .*?</a:tr>", tbl, re.S)
                if not first or not ws:
                    continue
                heads = [unesc(t) for t in texts(first.group(0))]
                if len(heads) != len(ws):
                    continue
                for h, w in zip(heads, ws):
                    if h and h != "#" and w < len(h) * HEAD_CH + CELL_PAD:
                        bad.append((h, w, len(h) * HEAD_CH + CELL_PAD))
        ok("every heading has room for itself", not bad, bad[:3])

        # ── §6 ───────────────────────────────────────────────────────────
        print("\n§6 · the headline pair is in the head, not the lead")
        stats = facts.get("stats") or []
        ok("the deck draws a pair on a pillar's tables", len(stats) >= 2, len(stats))
        if meas and stats:
            pair = re.findall(r'<a:off x="(\d+)" y="388620"/>', meas)
            ok("the pair is drawn in the head band", len(pair) == len(stats), pair)
            ok("right-aligned there",
               meas.count('algn="r"') >= 2 * len(stats), meas.count('algn="r"'))
            body = meas.split("<p:graphicFrame")[0]
            lead = re.findall(r'<a:off x="640080" y="1381125"/>', body)
            ok("and not stacked above the table as lead prose", not lead, lead)
            ok("the pair's values are the deck's own",
               all(s["v"] in [unesc(t) for t in texts(meas)] for s in stats),
               [s["v"] for s in stats])

        # ── §7 ───────────────────────────────────────────────────────────
        print("\n§7 · the pillars roll-call is cards")
        cards = facts.get("cards") or []
        ok("the deck draws cards", len(cards) >= 2, len(cards))
        roll = None
        for xml in pkg["order"]:
            ts = [unesc(t) for t in texts(xml)]
            if cards and all(c["n"] in ts for c in cards) and "Where" not in " ".join(ts):
                roll = xml
                break
        ok("the roll-call slide is in the file", roll is not None)
        if roll and cards:
            plates = re.findall(r'<a:srgbClr val="F2F5F9"/>', roll)
            ok("each name sits on a card", len(plates) >= len(cards), len(plates))
            rules = re.findall(r'<a:srgbClr val="C9A24D"/>', roll)
            ok("with the accent rule across its top",
               len(rules) >= len(cards), len(rules))
            ok("the code and the name are one shape, in two weights",
               all(('<a:t>%s</a:t>' % c["c"]) in roll for c in cards), None)

        # ── §8 ───────────────────────────────────────────────────────────
        print("\n§8 · the mark travels with the file")
        has_mark = js(pg, "(t)=>!!reviewPptxMark(t)", "care")
        ok("this subject has a mark to carry", has_mark is True, has_mark)
        if has_mark is True:
            ok("the package holds the media part",
               "ppt/media/mark.png" in pkg["names"], None)
            ct = pkg["z"].read("[Content_Types].xml").decode("utf-8")
            ok("and declares the png content type",
               'Extension="png"' in ct, None)
            rel = pkg["z"].read("ppt/slides/_rels/slide2.xml.rels").decode("utf-8")
            ok("a slide links to it",
               "/image" in rel and "media/mark.png" in rel, None)
            if meas:
                ok("a content slide draws it", "<p:pic>" in meas, None)
            cover = pkg["order"][0]
            ok("the cover does not — it wears the mark large already",
               "<p:pic>" not in cover, None)
            sect = find(pkg, "Strategic")
            if sect:
                ok("nor does a section divider (§259.1)",
                   "<p:pic>" not in sect, None)

        # ── §9 ───────────────────────────────────────────────────────────
        print("\n§9 · a table is the content of its slide")
        if meas:
            hs = set(re.findall(r'<a:tr h="(\d+)"', meas))
            ok("the review's rows are the taller ones", hs == {ROW_H}, sorted(hs))
            ok("and its type is set larger than the plan's",
               'sz="1200"' in meas and 'sz="1100"' not in meas.split("<a:tbl>")[-1],
               None)

        # ── §10 ──────────────────────────────────────────────────────────
        print("\n§10 · and the plan download is untouched (§94.2)")
        plan = js(pg, """(t)=>{
          const b = buildPlanPptx(t);
          let s = ''; const CH = 0x8000;
          for (let i = 0; i < b.length; i += CH)
            s += String.fromCharCode.apply(null, b.subarray(i, i + CH));
          return btoa(s);
        }""", "care")
        if isinstance(plan, str):
            pz = zipfile.ZipFile(io.BytesIO(base64.b64decode(plan)))
            pxml = "".join(pz.read(n).decode("utf-8") for n in pz.namelist()
                           if n.startswith("ppt/slides/slide"))
            hs = set(re.findall(r'<a:tr h="(\d+)"', pxml))
            ok("the plan's rows are still 335280", hs == {"335280"}, sorted(hs))
            ok("its cells are still 11pt", 'sz="1100"' in pxml, None)
            ok("and it carries no media part",
               "ppt/media/mark.png" not in pz.namelist(), None)
        else:
            ok("the plan download still builds", False, plan)

        # ── a supporting function builds too (§53.5, A15) ────────────────
        print("\n§11 · both sides of the switch")
        for t in ["fn:marketing", "fn:merchandising"]:
            fp = load(pg, t)
            ok("%s builds" % t, bool(fp) and len(fp["slides"]) > 2,
               None if fp else "no bytes")

        errs = js(pg, "()=>window.__errs || []")
        ok("no page errors", errs == [] or errs == {"threw": None}, errs)
        b.close()

    print("\n%d failures" % len(fails))
    raise SystemExit(1 if fails else 0)


main()
