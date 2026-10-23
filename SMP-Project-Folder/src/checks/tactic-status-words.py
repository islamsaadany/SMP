"""§419: a tactic's status is RHI's words, and the platform picks them.

Islam, fitting the platform to RHI: Completed · In progress · Delayed ·
Not due, and Not started at 0% -- with Delayed and Not due set by the
platform, never picked by anybody.

§571 MADE DELAYED A MARK, NOT A WORD. Islam, of D003 Growing FMCG: a Q3–Q4
tactic reported Not started at the end of Q3 "should show delayed right?";
then, of Delayed beside "In progress · 35%", "a confusion"; then "for the
delayed the real status is not started. same like the in progress but they
are both delayed ... type delayed somewhere?"; "in progress to stay with it's
color"; "In progress color should be a bit yellow". So the word is the real
status -- Completed · In progress · Not started · Not due -- in its own band
(In progress the yellow one), and a late tactic carries DELAYED under it.

What this asserts, both ends every time (§94.2):
  · each state MADE on one tactic (§255), the word and the mark separately:
    late is the whole window gone unfinished, or a REPORT still at nought
    once the first quarter is wholly behind the review month; inside its
    first quarter, or unreported, nought is Not started and not late; a row
    under way inside its window is In progress and not late, however behind;
  · every Status pill on a unit's Performance page says what
    `tacticStatusWord()` says, in `tacticBand()`'s band, with the Delayed
    mark on exactly the rows `tacticDelayed()` names -- an AGREEMENT (§94.8);
  · Islam's own six rows, as his screen had them, on Performance AND on the
    tactics slide: the words, the marks, and YTD actual as numbers;
  · what is STORED is untouched -- `t.status` still holds the old spelling
    after the page is drawn (§96.2), because a workbook and a closed cycle
    read it.
"""
import os
import pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
FILE = pathlib.Path(os.environ.get("SMP_BUILT") or (HERE.parent / "strategy-management-platform.html"))
bad = 0
WORDS = ["Completed", "In progress", "Not due", "Not started"]


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


def ev(pg, js):
    try:
        return pg.evaluate(js)
    except Exception as e:                                   # noqa: BLE001 — §215
        return {"threw": str(e).split("\n")[0]}


# Islam's D003, as his Performance page had it at the end of Q3 (§255: MADE,
# the demo carries no yes/no outcome at all).
D003 = r"""() => {
  const was = { to: REVIEW.to, tactics: UNITS.mobile.items[1].tactics, name: UNITS.mobile.items[1].name };
  window.__d003 = was;
  REVIEW.to = 'Sep ' + cycleYear();
  const R = SMPRules, p = UNITS.mobile.items[1];
  const T = (name, outcome, q, act) => ({ name, outcome, outTarget:'Y/N', outActual:act, outCompile:'',
    q1:q[0], q2:q[1], q3:q[2], q4:q[3], status:'WIP', actual:null, owner:'', note:'', id:'d3-'+name.slice(0,6) });
  p.name = 'Growing FMCG';
  p.tactics = [
    T('Cookies Communication Plan', 'Communication for cookies', [0,0,1,0], R.ynJoin('wip', 35)),
    T('Coffee Communication Plan', 'Communication for the Coffee', [0,0,1,0], R.YN_TODO),
    T('Core & New Category Bundling', 'Varies products mix', [0,0,1,1], R.YN_TODO),
    T('Current Portfolio Optimization', 'Relaunching Maamoul', [0,1,1,0], R.ynJoin('wip', 90)),
    T('Launch Chocolate-coated peanut', 'Product Launched', [0,0,1,0], R.YN_DONE),
    T('Digitalizing Route to Market', '10k outlets coverage', [0,0,1,1], R.ynJoin('wip', 80))];
  current = 'mobile'; RAIL['unit:mobile'] = p.id; paint();
  return pillarCode(UNITS.mobile, 1);
}"""
UNDO = """() => { const w = window.__d003, p = UNITS.mobile.items[1];
  REVIEW.to = w.to; p.tactics = w.tactics; p.name = w.name; paint(); return REVIEW.to === w.to; }"""
# §572: the figure and the line under it, read apart — "due X" is its own
# line under the figure now (Option B), where it was "/ X" beside it.
WANT = [  # word, delayed, YTD figure, the due line under it
    ("In progress", True,  "35%",  "due 100%"),
    ("Not started", True,  "0%",   ""),
    ("Not started", True,  "0%",   ""),
    ("In progress", True,  "90%",  "due 100%"),
    ("Completed",   False, "100%", ""),
    ("In progress", False, "80%",  "due 50%"),
]

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={"width": 1500, "height": 1000})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + str(FILE))
    pg.wait_for_timeout(900)

    print("── 1 · the rule, each state made on one tactic")
    r = ev(pg, """() => {
      if (typeof tacticStatusWord !== 'function' || typeof tacticDelayed !== 'function')
        return { threw: 'no tacticStatusWord / tacticDelayed' };
      const t = JSON.parse(JSON.stringify(UNITS['mobile'].items[0].tactics[0]));
      delete t.outcome; delete t.outTarget; delete t.outActual;
      const was = REVIEW.to, y = String(cycleYear());
      const at = (to, q, actual, status) => { REVIEW.to = to + ' ' + y;
        t.q1 = q[0]; t.q2 = q[1]; t.q3 = q[2]; t.q4 = q[3];
        t.actual = actual; t.status = status || 'WIP';
        return [tacticStatusWord(t), tacticDelayed(t), tacticBand(t)]; };
      const out = {
        done:      at('Jun', [1,1,0,0], 100, 'Done'),
        doneEarly: at('Jun', [0,0,1,1], 100, 'Done'),
        notdue:    at('Jun', [0,0,1,1], null, 'Not started'),
        late:      at('Jun', [1,1,0,0], 60),
        lateNone:  at('Jun', [1,1,0,0], null, 'Not started'),
        wip:       at('Jun', [0,1,1,0], 20),
        behind:    at('Jun', [1,1,1,1], 5),
        todoNone:  at('Jun', [0,1,1,0], null, 'Not started'),
        islam:     at('Sep', [0,0,1,1], 0, 'Not started'),
        islamNone: at('Sep', [0,0,1,1], null, 'Not started'),
        islamWip:  at('Sep', [0,0,1,1], 20),
        inFirst:   at('Aug', [0,0,1,1], 0, 'Not started'),
        stored:    t.status
      };
      REVIEW.to = was; out.back = REVIEW.to === was;
      return out;
    }""")
    ck("Completed when it is done, whenever that is, and never late",
       r.get("done") == ["Completed", False, "good"] and r.get("doneEarly") == ["Completed", False, "good"], r)
    ck("Not due when its window has not begun, and never late",
       r.get("notdue") == ["Not due", False, "kind"], r)
    ck("its window gone unfinished: the real word, and late",
       r.get("late") == ["In progress", True, "attn"] and r.get("lateNone") == ["Not started", True, "none"], r)
    ck("under way inside its window: In progress, not late, behind or not",
       r.get("wip") == ["In progress", False, "attn"] and r.get("behind") == ["In progress", False, "attn"], r)
    ck("nobody has reported, inside its window: Not started, not late",
       r.get("todoNone") == ["Not started", False, "none"], r)
    ck("§571 · Q3–Q4 reported at nought at the end of Q3: Not started, and late",
       r.get("islam") == ["Not started", True, "none"], r)
    ck("...not before its first quarter is over (August)",
       r.get("inFirst") == ["Not started", False, "none"], r)
    ck("...not on a row nobody has reported, and not on one under way",
       r.get("islamNone") == ["Not started", False, "none"] and
       r.get("islamWip") == ["In progress", False, "attn"], r)
    ck("In progress is the yellow band, never the orange one beside the red",
       r.get("wip", [None, None, None])[2] == "attn", r)
    ck("...and the review month is put back", r.get("back") is True, r)

    print("── 2 · the page says what the rule says, on every row")
    pg.click('#units [data-u="mobile"]')
    pg.wait_for_timeout(500)
    ev(pg, """() => { const b = [...document.querySelectorAll('[data-s]')].find(x => /^Performance/.test(x.textContent.trim())); if (b) b.click(); }""")
    pg.wait_for_timeout(800)
    rows = ev(pg, """() => {
      const out = [], u = UNITS['mobile'];
      const pills = [...document.querySelectorAll('#panel tr[data-oi] td.cc .pill')];
      u.items.forEach(p => (p.tactics || []).forEach(t => out.push({ want: tacticStatusWord(t), stored: t.status })));
      return { pills: pills.map(x => x.textContent.trim()), want: out };
    }""")
    pills = rows.get("pills", []) if isinstance(rows, dict) else []
    drawn = [p for p in pills if p in WORDS]
    ck("the page draws Status pills", len(drawn) > 0, rows)
    ck("every drawn status is one of the four words", all(p in WORDS for p in pills if p != "Not reported"), pills)
    ck("...and none of them is the word Delayed", "Delayed" not in pills, pills)
    wants = set(w["want"] for w in rows.get("want", [])) if isinstance(rows, dict) else set()
    ck("...and the set drawn is the set the rule answers for the shown pillar", set(drawn) <= wants, (drawn, wants))
    ck("nothing drawn still says Done or WIP", "Done" not in pills and "WIP" not in pills, pills)
    stored = [w["stored"] for w in rows.get("want", [])] if isinstance(rows, dict) else []
    ck("what is STORED is the old spelling, untouched", set(stored) <= {"WIP", "Done", "Not started", "Blocked"} and "WIP" in stored, set(stored))

    print("── 3 · a tactic that is not due says so once (§419.1)")
    nd = ev(pg, """() => {
      const p = UNITS['mobile'].items.find(x => (x.tactics||[]).length) , t = p.tactics[0];
      window.__k = JSON.stringify(t);
      t.q1 = false; t.q2 = false; t.q3 = false; t.q4 = true; t.actual = null;
      paint();
      const rows = [...document.querySelectorAll('#panel tr[data-oi]')].filter(r => r.textContent.includes(t.name));
      const txt = rows.map(r => r.textContent.replace(/\\s+/g, ' ')).join(' | ');
      p.tactics[0] = JSON.parse(window.__k); paint();
      return { word: tacticStatusWord(Object.assign({}, t, {q1:false,q2:false,q3:false,q4:true,actual:null})), n: rows.length, txt };
    }""")
    ck("the made tactic is not due and its row is on the page", isinstance(nd, dict) and nd.get("word") == "Not due" and nd.get("n", 0) > 0, nd)
    ck("...Status says Not due", isinstance(nd, dict) and "Not due" in nd.get("txt", ""), nd)
    ck("...and nothing beside it says Not yet due", isinstance(nd, dict) and "Not yet due" not in nd.get("txt", ""), nd)

    print("── 4 · §571 · Islam's D003, on Performance and on the slide")
    code = ev(pg, D003)
    pg.evaluate("() => document.querySelectorAll('.pbody[hidden]').forEach(x => x.hidden = false)")
    pg.wait_for_timeout(300)
    page = ev(pg, """() => {
      const names = UNITS.mobile.items[1].tactics.map(t => t.name);
      return names.map(n => {
        const tr = [...document.querySelectorAll('#panel tr[data-oi]')].filter(r => r.textContent.includes(n)).pop();
        if (!tr) return null;
        const pill = tr.querySelector('td.cc .pill'), mark = tr.querySelector('.latemark');
        const fig = pill ? pill.closest('td').nextElementSibling : null;
        const pr = fig ? fig.nextElementSibling : null, oc = tr.querySelector('td.outc b');
        const dot = mark ? getComputedStyle(mark, '::before') : null;
        return { word: pill ? pill.textContent.trim() : null, cls: pill ? pill.className : '',
                 late: !!mark, markInk: mark ? getComputedStyle(mark).color : null,
                 pillInk: pill ? getComputedStyle(pill).color : null,
                 dot: dot ? dot.backgroundColor : null,
                 markW: mark ? getComputedStyle(mark).fontWeight : null,
                 ytd: fig && fig.querySelector('.pair') ? fig.querySelector('.pair').textContent.trim()
                      : (fig ? fig.textContent.trim() : null),
                 due: fig && fig.querySelector('.pdue') ? fig.querySelector('.pdue').textContent.trim() : '',
                 prog: pr ? parseFloat(getComputedStyle(pr).fontSize) : null,
                 fsz: fig ? parseFloat(getComputedStyle(fig).fontSize) : null,
                 outc: oc ? getComputedStyle(oc).fontWeight : null };
      });
    }""")
    page = page if isinstance(page, list) else []
    ck("all six rows are on the page", len(page) == 6 and all(page), page)
    for i, (word, late, ytd, due) in enumerate(WANT):
        got = page[i] if i < len(page) and page[i] else {}
        ck("  row %d: %s%s, YTD %s%s" % (i + 1, word, " + DELAYED" if late else "", ytd, (" / " + due) if due else ""),
           got.get("word") == word and got.get("late") is late and got.get("ytd") == ytd and
           got.get("due") == due, got)
    lates = [g for g in page if g and g.get("late")]
    ck("...the DELAYED mark is red, and the pill above it is NOT (it keeps its own band)",
       lates and all(g["markInk"] != g["pillInk"] for g in lates) and
       all("bad" not in g["cls"] for g in lates), lates)
    # §572 (Option B on Performance): a red DOT before DELAYED, the outcome in
    # regular weight, and the Progress a size up from the figure beside it.
    ck("§572.1: DELAYED is regular weight, never bold (Islam: \"not bold\")",
       lates and all(g["markW"] in ("400", "normal") for g in lates), [g["markW"] for g in lates])
    ck("...with a red dot before it",
       lates and all(g["dot"] and g["dot"] not in ("rgba(0, 0, 0, 0)", "transparent") for g in lates), lates)
    ck("the outcome is regular weight under the bold tactic",
       page and all(g and g.get("outc") in ("400", "normal") for g in page), [g and g.get("outc") for g in page])
    ck("the Progress is a size up from the figure",
       page and all(g and g.get("prog") and g.get("fsz") and g["prog"] > g["fsz"] for g in page),
       [(g and g.get("prog"), g and g.get("fsz")) for g in page])
    try:
        slide = pg.evaluate("""(c) => {
      const d = document.createElement('div'); d.innerHTML = deckHtmlFor('mobile');
      const s = [...d.querySelectorAll('section.dslide')].filter(x => (x.dataset.split || '').indexOf(c + 'T') === 0);
      if (!s.length) return null;
      const head = [...s[0].querySelectorAll('thead th')].map(x => x.textContent.trim());
      const si = head.indexOf('Status'), yi = head.indexOf('YTD actual');
      const rows = [].concat(...s.map(x => [...x.querySelectorAll('tbody tr')])).map(tr => {
        const td = [...tr.children];
        const st = si >= 0 ? td[si] : null, y = yi >= 0 ? td[yi] : null;
        return { word: st ? (st.querySelector('.dpill') || st.firstChild || {textContent:''}).textContent.trim() : null,
                 pill: !!(st && st.querySelector('.dpill')),
                 late: st ? !!st.querySelector('.dlate') : null,
                 ytd: y ? (y.querySelector('b') || y).textContent.trim() : null,
                 due: y && y.querySelector('.ddue') ? y.querySelector('.ddue').textContent.trim() : '' };
      });
      return { head, rows };
    }""", code if isinstance(code, str) else "")
    except Exception as e:                                   # noqa: BLE001 — §215
        slide = None
    ck("the tactics slide carries a Status column, after Quarters",
       slide and "Status" in slide["head"] and
       slide["head"].index("Status") == slide["head"].index("Quarters") + 1, slide and slide["head"])
    srows = (slide or {}).get("rows", [])
    for i, (word, late, ytd, due) in enumerate(WANT):
        got = srows[i] if i < len(srows) else {}
        ck("  slide row %d: %s%s, YTD %s%s" % (i + 1, word, " + Delayed" if late else "", ytd, (" / " + due) if due else ""),
           got.get("word") == word and got.get("pill") is True and got.get("late") is late and
           got.get("ytd") == ytd and got.get("due") == due, got)
    # §572.2: on the slide DELAYED sits centred under the pill, as Performance's
    # centred cell draws it — measured in the opened deck, as PAINT.
    cen = ev(pg, """() => {
      openDeck(UNITS.mobile);
      const s = [...document.querySelectorAll('#deckroot .deck .dslide')].find(x => x.querySelector('td.dstat .dlate'));
      if (!s) { closeDeck(); return null; }
      s.classList.add('on');
      const out = [...s.querySelectorAll('td.dstat')].filter(td => td.querySelector('.dlate')).map(td => {
        /* the VISIBLE mark — its dot at the box's left edge to its word's
           last letter — never the box: as a block the box spans the pill's
           width while its dot and word sit at the left (the live fault). */
        const p = td.querySelector('.dpill').getBoundingClientRect(), dl = td.querySelector('.dlate');
        const rg = document.createRange(); rg.selectNodeContents(dl);
        const left = dl.getBoundingClientRect().left, right = rg.getBoundingClientRect().right;
        if (!p.width || right <= left) return 999;
        return Math.abs((p.left + p.width / 2) - (left + right) / 2); });
      s.classList.remove('on'); closeDeck();
      return out; }""")
    ck("§572.2: on the slide DELAYED is centred under its pill",
       isinstance(cen, list) and cen and all(x < 2 for x in cen), cen)
    ck("...and D003 is put back", ev(pg, UNDO) is True)

    ck("no page error", not errs, errs)
    b.close()

print("\n" + ("tactic-status-words: all passed" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
