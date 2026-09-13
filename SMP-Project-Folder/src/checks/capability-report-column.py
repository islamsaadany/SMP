"""A CAPABILITY'S REPORT IS JUDGED IN THE FUNCTION'S COLUMN (§337).

Islam, on §336's finding put to him in plain words: *"yes we need to fix
that."* The fault, measured on the SHIPPED demo with no access cell tightened
at all: on a capability that plans in PILLARS — drawn by the unit's own pages
(§334) — the head of the function that holds it was given ONE live box where
the custodian beside her was given SEVENTEEN, under a live *Submit to the SMO*.

`canReport()` picked its access page with an inline `indexOf("fn:")` test, so
a `cap:` target fell through to `u_report`, whose area is "unit" — and a
function head owns no business unit. `canSpeakFor()` one screen over already
asked `canReportFn()`, which resolves the same target through
`SMPRules.reportPageOf()` and gets `k_report`. So the bar and the boxes were
built from two different columns: §104.8's family, and §61's trap — the SERVER
has accepted these saves since §334.6, so the screen was refusing what the
save allows, which is the one direction a check driving only the office can
never see.

What is asserted, and why each end matters (§94.2):

  - THE HEAD REACHES HER OWN CAPABILITY'S REPORT, asserted as AGREEMENT with
    the CUSTODIAN's count rather than as a literal (§94.8) — the two hold the
    same function and must be offered the same page, and a build that shut
    both would satisfy any "she has boxes" assertion written as a number;

  - THE BAR AND THE BOXES AGREE, asserted as a PAIR — Submit drawn AND the
    figures live. The fault is precisely the two disagreeing, so an assertion
    about either alone passes on the build this exists to catch;

  - EVERY PERSON IN THE REGISTER IS ASKED, and `canReport` must agree with
    `canSpeakFor` about who may enter a figure at all on that target. The
    property, never a list of names, so a role added tomorrow is covered;

  - SOMEBODY THE RULE REFUSES IS STILL REFUSED: the group CEO reads the page
    and is given nothing, and a business unit's head has no destination at all
    — or a build that opened the column to everybody passes everything above;

  - A BUSINESS UNIT IS THE CONTROL (§113.8): the same measurements on a unit,
    asserted unchanged, because `reportPageOf` answers "u_report" there and a
    build that started sending every target to the function's column would be
    invisible to every assertion about the capability.

THE STATE IS MADE (§255): the demo holds ONE capability and it plans in
projects, so none of this is reachable on the shipped data — and the pillar it
is given is CLONED from a real one (§100.3), never a shape typed out here.

Every probe degrades (§215). SMP_BUILT points it at another build, so it can
be run against the build before (§276: a broken build is made from the
SOURCES, because §238's hashed CSP silences an edited built file).
"""
import os, sys
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or os.path.join(
    os.path.dirname(__file__), "..", "strategy-management-platform.html")
URL = "file://" + os.path.abspath(BUILT)

good = bad = 0
def ck(w, ok, x=""):
    global good, bad
    if ok: good += 1
    else: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — %s" % (x,)) if not ok and x != "" else ""))

def ev(pg, js, dflt=None, arg=None):
    try:
        return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    except Exception as e:
        return dflt if dflt is not None else {"err": str(e)[:120]}

# §255/§100.3: the capability plans in pillars, and its pillar is the product's
# own — cloned from Mobile's first and re-addressed, never a shape invented
# here, or the fixture is measuring itself.
MAKE = """()=>{
  const c = GROUP.capabilities[0];
  c.format = "pillars";
  const src = JSON.parse(JSON.stringify(UNITS.mobile.items[0]));
  src.id = "cap6-P1"; src.code = ""; src.name = "Own the product story";
  (src.measures||[]).forEach(function(m,i){ m.id = "cap6-P1-M"+(i+1); m.actual = ""; });
  (src.tactics||[]).forEach(function(t,i){ t.id = "cap6-P1-T"+(i+1); t.actual = ""; t.outActual = ""; });
  c.items = [src]; c.keyObjectives = [];
  if (typeof renumberCapability === "function") renumberCapability(c);
  paint();
  return { cap: "cap:" + c.id, fn: c.fn,
           measures: (src.measures||[]).length, tactics: (src.tactics||[]).length };
}"""

READ = """()=>{
  const p = document.getElementById('panel');
  const f = [].slice.call(p.querySelectorAll('input,select,textarea'));
  const bar = document.querySelector('.tabacts');
  return { enabled: f.filter(function(x){ return !x.disabled && !x.readOnly; }).length,
           drawn: f.length,
           submit: !!document.querySelector('.tabacts [data-submit]'),
           bar: bar ? bar.innerText.replace(/\\n/g, ' | ') : null };
}"""

def become(pg, who):
    ev(pg, "(k)=>switchViewer(k)", None, who); pg.wait_for_timeout(700)

def open_report(pg, dest):
    """The destination through the navigation's own controls, never by
       assigning `current` (§266): a capability lives behind the third side of
       the switch, and `data-fold` is absent exactly when that side is lit."""
    ev(pg, "(s)=>{const b=document.querySelector('#units [data-fold=\\\"'+s+'\\\"]');"
           " if (b) b.click();}", None,
       "caps" if dest.startswith("cap:") else "units")
    pg.wait_for_timeout(280)
    try:
        pg.click('#units [data-u="%s"]' % dest, timeout=3000); pg.wait_for_timeout(560)
    except Exception:
        return None
    try:
        pg.click('#subtabs button[data-s="report"]', timeout=2500); pg.wait_for_timeout(700)
    except Exception:
        return False
    return ev(pg, READ, {})

def main():
    with sync_playwright() as pw:
        br = pw.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
        pg = br.new_page(viewport={"width": 1500, "height": 900})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
        pg.add_init_script("try{localStorage.setItem('smp.welcome.seen','1');"
                           "sessionStorage.setItem('smp.tour.skip','1')}catch(e){}")
        pg.goto(URL); pg.wait_for_timeout(1200)

        made = ev(pg, MAKE, {})
        cap = made.get("cap"); fk = made.get("fn")
        print("\n§1 the state is MADE — a capability that plans in pillars")
        ck("the fixture stands up", bool(cap) and made.get("measures", 0) > 0, made)
        if not cap:
            print("\ncannot continue"); br.close(); return 1

        head = ev(pg, "(k)=>FUNCTIONS[k] && FUNCTIONS[k].head", None, fk)
        cust = ev(pg, "(k)=>FUNCTIONS[k] && FUNCTIONS[k].custodian", None, fk)
        ck("the holding function has a head AND a custodian to compare",
           bool(head) and bool(cust) and head != cust, {"head": head, "cust": cust})

        print("\n§2 the head reaches her own capability's report")
        become(pg, cust); asCust = open_report(pg, cap) or {}
        become(pg, head); asHead = open_report(pg, cap) or {}
        ck("the custodian is offered live figure boxes (the control)",
           asCust.get("enabled", 0) > 0, asCust)
        # §94.8: the AGREEMENT, never a number — the two hold the same function.
        ck("the head is offered exactly what the custodian is",
           asHead.get("enabled") == asCust.get("enabled") and asHead.get("enabled", 0) > 0,
           {"head": asHead.get("enabled"), "custodian": asCust.get("enabled")})
        # THE PAIR, AND IT IS THE CUSTODIAN'S COUNT ON THE OTHER SIDE OF THE
        # AND — not `> 0`, which is what the first draft wrote and which PASSED
        # on the broken build (§113.8): there the head is left one live control
        # (the cycle note), so "Submit is drawn and something is live" is true
        # of exactly the state this check exists to catch.
        ck("Submit is drawn AND the whole report is live, for the head",
           bool(asHead.get("submit")) and asHead.get("enabled") == asCust.get("enabled"),
           {"head": asHead, "custodian": asCust.get("enabled")})

        print("\n§3 the two questions answer together, for everybody")
        rows = ev(pg, """(t)=>{
          const was = viewer().key, out = [];
          PEOPLE.forEach(function(p){
            switchViewer(p.key);
            out.push({ k: p.key, report: canReport(t), speak: canSpeakFor(t),
                       note: canEnterNote(t, {}) });
          });
          switchViewer(was);
          return out;
        }""", [], cap)
        ck("every person in the register was asked", len(rows) > 20, len(rows))
        # canSpeakFor is canReportFn + the own-lines exclusion, so it can only
        # ever narrow: nobody may speak for the capability without reporting it.
        odd = [r["k"] for r in rows if r.get("speak") and not r.get("report")]
        ck("nobody is offered Submit on a report they cannot enter", not odd, odd)
        # THE NOTE'S OWN LINE, and it needs a SOURCED figure to reach at all:
        # `canEnterNote` only consults a column when the figure belongs to
        # somebody by name and that somebody is the viewer (§44). Asked of an
        # ordinary row it falls through to `canReportRow` and measures the
        # assertion above a second time — which is what the first draft did,
        # and it passed on the broken build for that reason (§113.8).
        note = ev(pg, """(a)=>{
          const was = viewer().key;
          const c = GROUP.capabilities[0];
          const m = c.items[0].measures[0];
          m.src = { by: a.head };
          switchViewer(a.head);
          const mine = canEnterNote(a.cap, { obj: m });
          switchViewer(a.cust);
          const theirs = canEnterNote(a.cap, { obj: m });
          delete m.src;
          switchViewer(was);
          return { mine: mine, theirs: theirs };
        }""", {}, {"cap": cap, "head": head, "cust": cust})
        ck("the person a figure belongs to may write its note on a capability",
           note.get("mine") is True, note)

        print("\n§4 and it refuses, or the column is open to everybody")
        may = [r["k"] for r in rows if r.get("report")]
        ck("not everybody may report it", 0 < len(may) < len(rows), {"may": may})
        ck("the head and the custodian may", head in may and cust in may, may)
        ck("the group CEO may not", "ceo" not in may, may)
        become(pg, "ceo"); asCeo = open_report(pg, cap) or {}
        ck("and reads the page with nothing to type in",
           asCeo.get("enabled", 1) == 0, asCeo)
        unit_head = ev(pg, "()=>{const u=UNIT_ROLES && UNIT_ROLES.mobile;"
                           " return u && (u.head || u.owner) || null;}", None)
        if unit_head:
            become(pg, unit_head)
            ck("a business unit's head has no route to it at all",
               open_report(pg, cap) is None, unit_head)

        print("\n§5 a business unit is the control (§113.8)")
        become(pg, "smo"); uSmo = open_report(pg, "mobile") or {}
        ck("the office reports a unit exactly as before",
           uSmo.get("enabled", 0) > 0, uSmo)
        upair = ev(pg, """()=>{
          const was = viewer().key, out = {};
          switchViewer("ceo");
          out.ceo = { report: canReport("mobile"), speak: canSpeakFor("mobile") };
          switchViewer(was);
          return out;
        }""", {})
        ck("and a unit's column still answers for itself",
           upair.get("ceo", {}).get("report") == upair.get("ceo", {}).get("speak"),
           upair)

        ck("no page error anywhere in the run", not errs, errs[:3])
        br.close()

    print("\n%d passed, %d failed" % (good, bad))
    return 1 if bad else 0

sys.exit(main())
