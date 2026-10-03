"""WHAT A ROW IS MEASURED AGAINST, IN THE COLUMN BESIDE THE BOX (§344).

Islam: *"when I set a target like a % for the annual view and I build it on
monthly level and set it to latest if I go to the reporting the target required
should read from the latest month we are measured against."*

WHAT THIS ASSERTS, AND WHY EACH ONE IS HERE:

  · THE BENCHMARK IS ASSERTED AS AGREEMENT WITH `measureDueLabel`, never as a
    literal (§94.8). A check holding "29%" passes on a build that prints the
    right number for the wrong reason and goes red the day the review point
    moves — and the review point is the one thing about this that moves.

  · BOTH ENDS, EVERY TIME (§94.2). Four of the five row shapes must come out of
    this COMPLETELY UNCHANGED, and a file that only looked at the case being
    fixed would pass on a build that rewrote every cell in the product. So a
    row that does not prorate, a yes/no row, a row with no target and a count
    with nothing owed yet are each asserted against what they drew before.

  · IT MAKES THE ROWS IT MEASURES (§255, §245). The worked example carries no
    monthly plan, no yes/no measure, no blank target and no `Count` row — so
    every assertion here would pass on a build that had lost the feature
    entirely if it waited for the demo to show it one.

  · BOTH SIDES OF THE NAVIGATION SWITCH (§53.5, A15). A unit's Reporting page
    and a supporting function's are two builders onto one decision, and this
    project has twice paid for only one of them being kept up (§211, §301.5).
    The capability side is driven too, and its key objectives are MADE,
    because §333 left the demo with one capability holding none.

  · PERFORMANCE AND THE DECK ARE ASSERTED UNCHANGED. They have shown the
    benchmark since §239 and §254; this changes the REPORTING page and must
    not leak, and "we did not touch it" is a claim rather than a measurement.

  · THE TABLE STILL FITS ITS PANE (§158: fit, never "and it scrolls").

RUN: python3 qa-run.py checks/reporting-ytd-target.py
     SMP_BUILT=/path/to/other.html python3 checks/reporting-ytd-target.py
"""
import os
from playwright.sync_api import sync_playwright

URL = "file://" + os.environ.get("SMP_BUILT", os.path.abspath(os.path.join(
      os.path.dirname(__file__), "..", "strategy-management-platform.html")))

# A market share climbing to 30 by December. Month 6 — the cycle's own review
# point — is 29, which is neither the year (30) nor a flat half of it (15), so
# the three candidate answers are told apart by their value.
SHARE = [25, 26, 27, 27, 28, 29, 29, 30, 30, 30, 30, 30]
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w +
          (("  — %s" % (x,)) if not ok and x != "" else ""))


def ev(pg, js, arg=None):
    """Every probe degrades rather than dying (§215): a check that throws
    reports FEWER failures than the build has, and a count of FAIL lines then
    reads as something close to success."""
    try:
        return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    except Exception as e:
        return {"threw": str(e)[:200]}


def press(pg, sel):
    try:
        el = pg.query_selector(sel)
        if not el:
            return False
        el.click()
        return True
    except Exception:
        return False


def go_report(pg, key, rail=None):
    """Walk to a subject's Reporting tab the way somebody walks there.

    THE SIDE IS PRESSED FIRST. `data-fold` names a side and is ABSENT exactly
    when that side is already lit (§334.17), so the guard is "if it is there,
    press it" — without this the file walked to a function and then could not
    walk back to a unit, and every later assertion answered about a page it
    was never on.

    AND THERE ARE THREE SIDES, not two: §334 made a capability a destination of
    its own under a `caps` fold, so `fn:marketing` draws that FUNCTION's own
    projects (§326) and the capability's own Reporting page is `cap:<id>`.
    Asking the function for it found the project's deliverables table and no
    key objectives at all."""
    side = ("caps" if key.startswith("cap:")
            else "fns" if key.startswith("fn:") else "units")
    pg.evaluate("""(s) => { const f=document.querySelector('#units [data-fold="'+s+'"]');
        if(f) f.click(); }""", side)
    pg.wait_for_timeout(400)
    pg.evaluate("""(k) => { const b=[...document.querySelectorAll('#units button')]
        .find(x=>x.dataset.u===k); if(b) b.click(); }""", key)
    pg.wait_for_timeout(650)
    pg.evaluate("""() => { const b=[...document.querySelectorAll('#subtabs button, .tabs button')]
        .find(x=>/^Reporting/i.test(x.textContent.trim())); if(b) b.click(); }""")
    pg.wait_for_timeout(800)
    if rail:
        press(pg, '.rail [data-urail="%s"]' % rail)
        pg.wait_for_timeout(600)


# WHAT THE PAGE DREW, read as the heading plus each row's own cell. The cell is
# read as TEXT and as the two halves separately, because "29% of 30%" and a
# build that merely renamed the column both contain "30%".
READ = """(nm) => {
  const out = { tables: [] };
  [...document.querySelectorAll('#panel table')].forEach(t => {
    const th = [...t.querySelectorAll('thead th')].map(x => x.textContent.trim());
    const col = th.findIndex(h => /Target/.test(h));
    if (col < 0) return;
    const kind = th[1] === 'Tactic' ? 'tactic'
               : th[1] === L1('measure') ? 'measure'   /* §395: the client's word (§218) */
               : /objective/i.test(th[1] || '') ? 'objective' : null;
    if (!kind) return;
    const rows = {};
    [...t.querySelectorAll('tbody tr')].forEach(r => {
      const tds = r.querySelectorAll('td');
      if (tds.length <= col) return;
      const name = tds[1].innerText.trim().split('\\n')[0];
      const cell = tds[col];
      const sub = cell.querySelector('.subhd');
      rows[name] = { text: cell.innerText.replace(/\\s+/g, ' ').trim(),
                     head: (sub ? cell.firstChild && cell.firstChild.textContent
                                : cell.innerText).toString().trim(),
                     of: sub ? sub.innerText.trim() : null,
                     html: cell.innerHTML,
                     missing: !!cell.querySelector('.missing'),
                     nobody: !!cell.querySelector('.nobody') };
    });
    out.tables.push({ kind: kind, headings: th, targetHead: th[col], rows: rows });
  });
  return out;
}"""


def table(read, kind):
    for t in read.get("tables", []):
        if t["kind"] == kind:
            return t
    return None


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME",
                          "/opt/pw-browsers/chromium"),
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1600, "height": 1800})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append("console: " + m.text) if m.type == "error" else None)
    pg.goto(URL)
    pg.wait_for_timeout(1500)

    # The readers this whole file leans on, asked BY NAME first — without them
    # every probe below answers `threw` and the run reports nothing (§215).
    have = ev(pg, """() => ({
      builder: typeof repTargetCell === "function",
      head:    typeof REP_TGT_HEAD === "string",
      due:     typeof measureDueLabel === "function" && typeof measureDue === "function",
      notdue:  typeof nothingDueYet === "function" })""")
    ck("the one builder and the one heading exist",
       have.get("builder") and have.get("head"), have)
    ck("...over the readers that already answer this",
       have.get("due") and have.get("notdue"), have)

    pg.select_option("#asWho", "smo")
    pg.wait_for_timeout(300)

    # ── MAKE THE FIVE SHAPES (§255) ────────────────────────────────────
    made = ev(pg, """(share) => {
      const pil = UNITS.mobile.items.find(p => p.code === '03');
      const by  = n => pil.measures.find(m => m.name.indexOf(n) === 0);
      /* 1 · ISLAM'S OWN CASE: a % for the year, built by month, Latest. */
      const sh = by('Samsung market share');
      sh.target = '30%'; sh.compile = 'Latest'; sh.monthly = share.slice();
      /* 2 · prorates flat (Sum, no monthly plan) — untouched, the demo's own */
      const ac = by('Accessory revenue');
      /* 3 · does NOT prorate: Latest with no monthly plan */
      const vv = by('Vivo market share');
      delete vv.monthly; vv.compile = 'Latest';
      /* 4 · a yes/no row, 5 · a row with no target, 6 · a Count with nothing
         owed yet — a target of 2 at month 6 owes 1, so 12 owes nought until
         later in the year (§276). None of the three is in the demo. */
      pil.measures.push(
        { id:'ck-yn',   name:'ZZ licence secured', dir:'\\u2265', target:'Y/N',
          compile:'Latest', actual:'' },
        { id:'ck-none', name:'ZZ throughput',      dir:'\\u2265', target:'',
          compile:'Sum',    actual:'' },
        { id:'ck-cnt',  name:'ZZ shops opened',    dir:'\\u2265', target:'1 #',
          compile:'Count',  actual:'' },
        { id:'ck-cnt2', name:'ZZ stores opened',   dir:'\\u2265', target:'12 #',
          compile:'Count',  actual:'' },
        { id:'ck-unit', name:'ZZ unit only',       dir:'\\u2265', target:'%',
          compile:'Sum',    actual:'' });
      /* and the capability side, which §333 left holding none */
      const cap = GROUP.capabilities[0];
      cap.keyObjectives = cap.keyObjectives || [];
      cap.keyObjectives.push(
        { id:'ck-cko', name:'ZZ capability reach', dir:'\\u2265',
          target:'80%', compile:'Sum', actual:'' });
      /* and a PILLARS function, the other side of the switch */
      const pf = Object.keys(FUNCTIONS).find(k => FUNCTIONS[k].format === 'pillars');
      const fm = pf && (FUNCTIONS[pf].items||[])[0] &&
                 (FUNCTIONS[pf].items[0].measures||[])[0];
      if (fm) { fm.target = '30%'; fm.compile = 'Latest'; fm.monthly = share.slice(); }
      return { month: monthOfYear(), asOf: reviewAsOfLabel(),
               shareBench: measureDueLabel(sh), shareDue: measureDue(sh),
               accBench: measureDueLabel(ac), accTarget: ac.target,
               vvBench: measureDueLabel(vv), vvTarget: vv.target,
               capFn: cap.fn, capId: cap.id, capName: cap.name,
               cntDue: measureDue(by('ZZ shops opened')),
               /* ASKED OF THE PLATFORM, never typed: `tgtShown` tightens
                  `1 #` to `1#` (§254.1), and an assertion holding the typed
                  spelling calls a correct build broken — which is the fault
                  this file's own docstring warns about, walked into while
                  writing it. */
               cntWhole: tgtShown(by('ZZ shops opened').target),
               cnt2Bench: measureDueLabel(by('ZZ stores opened')),
               pillarsFn: pf, pillarsMeasure: fm ? fm.name : null,
               pillarsBench: fm ? measureDueLabel(fm) : null };
    }""", SHARE)
    ck("the state is MADE, and the review point is a month the demo can show",
       made.get("month") == 6 and made.get("shareDue") == 29, made)
    ck("...and the seam already answers the latest month (this is not new arithmetic)",
       made.get("shareBench") == "29%", made)

    # ── PERFORMANCE FIRST, so it can be asserted UNCHANGED afterwards ──
    go_report(pg, "mobile")
    pg.evaluate("""() => { const b=[...document.querySelectorAll('#subtabs button, .tabs button')]
        .find(x=>/^Performance/i.test(x.textContent.trim())); if(b) b.click(); }""")
    pg.wait_for_timeout(700)
    press(pg, '.rail [data-urail="mobile|mobile-P3"]')
    pg.wait_for_timeout(500)
    perf = ev(pg, """() => {
      const t=[...document.querySelectorAll('.pane table')]
        .find(x=>x.querySelector('thead') && /Annual target/i.test(x.querySelector('thead').textContent));
      if(!t) return null;
      const o={}; [...t.querySelectorAll('tbody tr')].forEach(r=>{
        const td=r.querySelectorAll('td');
        o[td[1].innerText.trim().split('\\n')[0]] = [...td].map(x=>x.innerText.trim()).join('|'); });
      return { head:[...t.querySelectorAll('thead th')].map(x=>x.textContent.trim()), rows:o };
    }""")
    ck("PERFORMANCE still says Annual target and is untouched by this (§94.2)",
       perf and "Annual target" in (perf.get("head") or [])
       and "29%" in (perf.get("rows", {}).get("Samsung market share") or ""), perf)

    # ── 1 · A UNIT'S REPORTING PAGE ────────────────────────────────────
    go_report(pg, "mobile", "mobile|mobile-P3")
    read = ev(pg, READ)
    ms = table(read, "measure") or {}
    ob = table(read, "objective") or {}
    tc = table(read, "tactic") or {}
    r = ms.get("rows", {})

    ck("the measures column is headed YTD Target",
       ms.get("targetHead") == "YTD Target", ms.get("headings"))
    ck("...and so is the key objectives column",
       ob.get("targetHead") == "YTD Target", ob.get("headings"))
    ck("...and the tactics column, which already was, is unchanged",
       tc.get("targetHead") == "YTD Target", tc.get("headings"))

    # ISLAM'S CASE — asserted as AGREEMENT with the seam, never as "29%"
    sam = r.get("Samsung market share") or {}
    ck("HIS CASE: the cell reads the latest month, not the year",
       sam.get("head") == made.get("shareBench") and sam.get("head") != "30%", sam)
    ck("...with the annual under it, so nothing is lost from the screen",
       sam.get("of") == "of 30%", sam)

    acc = r.get("Accessory revenue") or {}
    ck("a row that prorates flat reads its benchmark too",
       acc.get("head") == made.get("accBench") and acc.get("of") == "of 300M EGP", acc)

    # ── BOTH ENDS: the four shapes that must not move ──────────────────
    vv = r.get("Vivo market share") or {}
    ck("A ROW THAT DOES NOT PRORATE IS UNCHANGED — one line, no 'of'",
       vv.get("text") == "60%" and vv.get("of") is None, vv)
    yn = r.get("ZZ licence secured") or {}
    ck("a yes/no row still reads Yes / No and nothing else",
       yn.get("text") == "Yes / No" and yn.get("of") is None, yn)
    no = r.get("ZZ throughput") or {}
    ck("a row with no target still says Missing, in the alarm ink",
       no.get("missing") is True and no.get("of") is None, no)
    # A SEPARATOR IS WHY THE GUARD IS ON THE VALUE (§254.1). `measureDueLabel`
    # rebuilds the number through `joinTarget`, which drops the comma — so a
    # string compare calls `4500` different from `4,500` and prints a second
    # line saying nothing over a figure re-spelt on the way. The demo's own
    # `Active merchant reach` is `4,500`, `Latest`, no monthly plan: it does
    # not prorate, so it must be untouched. Without this row the string-compare
    # build passes every other assertion in this file (§94.5, found by
    # falsifying rather than by reading).
    amr = (ob.get("rows") or {}).get("Active merchant reach") or {}
    ck("a row whose target carries a thousands separator is not re-spelt",
       amr.get("text") == "4,500" and amr.get("of") is None, amr)

    uo = r.get("ZZ unit only") or {}
    ck("a target holding only its unit is unchanged (§251)",
       uo.get("text") == "%" and uo.get("of") is None, uo)
    cnt = r.get("ZZ shops opened") or {}
    ck("A COUNT WITH NOTHING OWED YET does not claim the year is due (§276)",
       made.get("cntDue") == 0 and cnt.get("nobody") is True
       and cnt.get("of") == "of " + (made.get("cntWhole") or ""), cnt)
    # ...and the other end, or the em-dash could be drawn for every Count row
    # and this file would applaud it (§113.8).
    cnt2 = r.get("ZZ stores opened") or {}
    ck("...while a count that IS owed some reads its own benchmark",
       cnt2.get("nobody") is not True
       and cnt2.get("head") == made.get("cnt2Bench"), cnt2)

    # ── 2 · A PILLARS FUNCTION — the other side of the switch ──────────
    if made.get("pillarsFn"):
        go_report(pg, "fn:" + made["pillarsFn"])
        fread = ev(pg, READ)
        fms = table(fread, "measure") or {}
        fr = (fms.get("rows") or {}).get(made.get("pillarsMeasure")) or {}
        ck("A SUPPORTING FUNCTION'S PAGE AGREES WITH THE UNIT'S — heading",
           fms.get("targetHead") == "YTD Target", fms.get("headings"))
        ck("...and cell, asserted against its own seam",
           fr.get("head") == made.get("pillarsBench") and fr.get("of") == "of 30%", fr)

    # ── 3 · A CAPABILITY FUNCTION ──────────────────────────────────────
    if made.get("capId"):
        go_report(pg, "cap:" + made["capId"])
        cread = ev(pg, READ)
        cob = table(cread, "objective") or {}
        cr = (cob.get("rows") or {}).get("ZZ capability reach") or {}
        ck("A CAPABILITY'S key objectives carry the same heading",
           cob.get("targetHead") == "YTD Target", cob.get("headings"))
        ck("...and the same cell",
           cr.get("of") == "of 80%" and cr.get("head") not in (None, "", "80%"), cr)

    # ── 4 · THE TABLE STILL FITS ITS PANE (§158) ───────────────────────
    go_report(pg, "mobile", "mobile|mobile-P3")
    fits = {}
    for w in (1600, 1440, 1280, 1100, 1000):
        pg.set_viewport_size({"width": w, "height": 1800})
        pg.wait_for_timeout(500)
        fits[w] = ev(pg, """() => {
          const t=[...document.querySelectorAll('#panel table')]
            .find(x=>x.querySelector('thead') && x.querySelector('thead').textContent.indexOf(L1('measure')) > -1 /* §395: the client's word (§218) */);
          if(!t) return {gone:true};
          const box = t.closest('.scroll') || t.parentElement;
          return { over: t.scrollWidth - box.clientWidth,
                   w: Math.round(t.getBoundingClientRect().width) };
        }""")
    over = {w: m.get("over") for w, m in fits.items()}
    ck("the table fits its pane at every width — never 'and it scrolls'",
       all(isinstance(v, (int, float)) and v <= 0 for v in over.values()), over)
    pg.set_viewport_size({"width": 1600, "height": 1800})
    pg.wait_for_timeout(400)

    ck("no page errors", not errs, errs[:3])
    print(("\n  %d failed" % bad) if bad else "\n  all reporting-ytd-target checks passed")
    b.close()
