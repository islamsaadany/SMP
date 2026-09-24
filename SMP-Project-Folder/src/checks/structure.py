"""The client's structure: levels, and the components each carries (§404).

Islam: "when I start the setup of the company we need to set the structure,
the levels and the components in each level from the start", and "components
can be applied for all as a start and later the smo can adjust the components
of each unit or function". Off HIDES and never deletes (his "yes hide not
delete"); a client that never touched the structure opens exactly as before.

Asserted at BOTH ENDS (§94.2): every absence here is paired with the presence
the same run measured before the switch, or a build that never drew the SWOT
satisfies "off hides the SWOT" perfectly. The controls are PRESSED (§70) and
the stored graph read back (§96). The state is MADE (§255): the worked example
stores no structure. SMP_BUILT points it at another build.
"""
import os, sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
BUILT = os.environ.get("SMP_BUILT") or os.path.join(HERE, "..", "strategy-management-platform.html")
CHROME = os.environ.get("SMP_CHROME") or None
fails = []
def ck(name, ok, detail=""):
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok else "  — " + str(detail)))
    if not ok: fails.append(name)

def safe(pg, js, dflt=None):
    try: return pg.evaluate(js)
    except Exception as e: return dflt       # §215: degrade, never die

def press(pg, sel):
    try:
        pg.click(sel, timeout=4000); pg.wait_for_timeout(200); return True
    except Exception:
        return False

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME) if CHROME else p.chromium.launch()
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(800)

    unit = safe(pg, "()=>activeKeys()[0]")
    co = safe(pg, "()=>(COMPANY_KEYS||[])[0]")
    ck("the worked example has a unit and a company", bool(unit) and bool(co), [unit, co])
    ck("the worked example stores NO structure (§255: the state is made here)",
       safe(pg, "()=>!SMPRules.structureOf(GROUP)") is True)

    def secs(target):
        return safe(pg, "()=>allowed(SUBS.unit[0].sections(UNITS['%s']), '%s').map(d=>d.k)" % (target, target), [])
    def tabs(kind, target):
        return safe(pg, "()=>allowed(SUBS['%s'], '%s').map(d=>d.k)" % (kind, target), [])

    # ── 1. Nothing stored: everything as before ───────────────────────
    s0 = secs(unit)
    ck("unstored: a unit offers Foundation and SWOT", "found" in s0 and "swot" in s0, s0)
    g0 = tabs("group", "group")
    ck("unstored: the group offers Foundation and Temple", "foundation" in g0 and "temple" in g0, g0)
    c0 = tabs("co", "co:" + str(co))
    ck("unstored: a company offers NO Foundation tab (existing clients unchanged)", "foundation" not in c0, c0)

    # ── 2. Setup › Structure: one item's SWOT, pressed ────────────────
    ok = press(pg, '[data-md="setup"]') and press(pg, '.ritem[data-setupgo="structure"]')
    ck("Setup › Structure opens from the rail", ok)
    dots = safe(pg, "()=>document.querySelectorAll('[data-stover]').length", 0)
    ck("it draws a pressable box per item and component", (dots or 0) >= 9 * 3, dots)
    hdr = safe(pg, "()=>[...document.querySelectorAll('table.stadj thead th')].map(t=>t.textContent)", [])
    ck("its columns are headed with the client's own words",
       safe(pg, "()=>labelWord('keyobj','bu')") in (hdr or []), hdr)
    ck("pressing the unit's SWOT box", press(pg, '[data-stover="%s|swot"]' % unit))
    ck("…stores ONE adjustment, off (§96)",
       safe(pg, "()=>GROUP.structure&&GROUP.structure.over&&GROUP.structure.over['%s'].swot" % unit) is False)
    ck("…and the box wears the differs ring",
       safe(pg, "()=>document.querySelector('[data-stover=\"%s|swot\"]').classList.contains('diff')" % unit) is True)
    s1 = secs(unit)
    ck("OFF: that unit offers no SWOT section", "swot" not in s1, s1)
    other = safe(pg, "()=>activeKeys()[1]")
    ck("…while the unit beside it still does", "swot" in (secs(other) or []), other)
    ck("OFF HIDES AND NEVER DELETES: the SWOT items are still stored",
       safe(pg, "()=>Object.values(UNITS['%s'].swot||{}).some(l=>l&&l.length)" % unit) is True)
    deck = safe(pg, "()=>/d-swot/.test(deckHtmlFor('%s'))" % unit)
    ck("OFF: the deck draws no SWOT slides for it", deck is False, deck)
    ck("…and a unit left on still does", safe(pg, "()=>/d-swot/.test(deckHtmlFor('%s'))" % other) is True)
    press(pg, '[data-stover="%s|swot"]' % unit)
    ck("pressing it back DELETES the adjustment and the empty structure (§50.6)",
       safe(pg, "()=>!('structure' in GROUP)") is True)
    ck("…and the SWOT section is back", "swot" in (secs(unit) or []))

    # ── 3. A level's components, as the set-up step writes them ───────
    safe(pg, """()=>{GROUP.structure={top:{on:['brief','purpose','aspiration','keyobj','values'],temple:true},
        mid:{exists:true,on:['brief','aspiration','keyobj'],temple:false},
        bu:{on:['brief','aspiration','keyobj','pillar']},fn:{on:['brief']}};}""")
    g1 = tabs("group", "group")
    ck("Temple needs the themes: with them off there is no Temple tab", "temple" not in g1, g1)
    ck("…the Foundation stays", "foundation" in g1, g1)
    ck("a level without SWOT: no unit offers a SWOT section", "swot" not in (secs(other) or []))
    c1 = tabs("co", "co:" + str(co))
    ck("the second layer SAID its components: a company offers a Foundation tab", "foundation" in c1, c1)
    ck("a function with its North Star off offers its Overview on the brief alone",
       safe(pg, "()=>compOn('fn:'+FUNCTION_KEYS[0],'keyobj')") is False)

    # ── 4. The company's own Foundation, drawn and written ────────────
    try:
        safe(pg, "()=>{current='co:%s'; currentSub='foundation'; paint();}" % co); pg.wait_for_timeout(250)
    except Exception: pass
    body = safe(pg, "()=>document.querySelector('#panel').innerText", "") or ""
    ck("the company's Foundation draws its brief and aspiration",
       safe(pg, "()=>labelWord('brief','bu')") in body and safe(pg, "()=>labelWord('aspiration','group')") in body, body[:300])
    ck("…and not the group's purpose, which that level does not carry",
       safe(pg, "()=>labelWord('purpose','group')") not in body)
    ck("reading it created nothing (§42)", safe(pg, "()=>!GROUP.coFound") is True)
    ck("the writer mints the company's own record",
       safe(pg, "()=>{var o=coFoundWritable('%s'); o.aspiration='Lead the region'; return GROUP.coFound['%s'].aspiration}" % (co, co)) == "Lead the region")
    ck("…and a company's objective id carries the company (§96.2)",
       safe(pg, "()=>{var o=coFoundWritable('%s'); var m=koMint(o.keyObjectives, koPrefixOf(o)); return m.id}" % co) == "co-%s-KO1" % co)
    safe(pg, "()=>{delete GROUP.coFound;}")

    # ── 5. The set-up flow's Structure step ──────────────────────────
    safe(pg, "()=>{delete GROUP.structure;}")
    ok = press(pg, '[data-md="setup"]') and (press(pg, '.ritem[data-setupgo="start"]') or press(pg, '[data-setupgo="start"]'))
    ck("the set-up flow opens", ok)
    ck("its second step is Structure",
       safe(pg, "()=>[...document.querySelectorAll('.wzstep')].map(b=>b.dataset.step)[1]") == "structure")
    ck("pressing it", press(pg, '.wzstep[data-step="structure"]'))
    chips = safe(pg, "()=>document.querySelectorAll('[data-stcomp]').length", 0)
    ck("four levels of nine components are drawn", chips == 36, chips)
    ck("nothing is stored until something is pressed", safe(pg, "()=>!('structure' in GROUP)") is True)
    ck("pressing the business units' SWOT", press(pg, '[data-stcomp="bu|swot"]'))
    st = safe(pg, "()=>JSON.stringify(GROUP.structure)", "") or ""
    ck("…materialises the structure with SWOT off at that level only",
       safe(pg, "()=>GROUP.structure.bu.on.indexOf('swot')<0 && GROUP.structure.top.on.length===9 && GROUP.structure.top.temple===true") is True, st)
    ck("the functions' default plan type is pressed and stored",
       press(pg, '.stcard:last-of-type .wzband button:nth-child(2)') and
       safe(pg, "()=>GROUP.structure.fn.format") == "projects")

    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n%s" % ("all good" if not fails else "%d FAILED" % len(fails)))
sys.exit(1 if fails else 0)
