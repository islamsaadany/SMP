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
import json, os, sys
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
    # §428: the group's Foundation now lives inside its Strategy tab, as a unit's does.
    def gsecs():
        return safe(pg, "()=>allowed(SUBS.group[0].sections(), 'group').map(d=>d.k)", [])
    ck("unstored: the group offers Foundation (inside Strategy) and Temple",
       "strategy" in g0 and "found" in (gsecs() or []) and "temple" in g0, [g0, gsecs()])
    c0 = tabs("co", "co:" + str(co))
    ck("unstored: a company offers NO Foundation tab (existing clients unchanged)", "foundation" not in c0, c0)

    # ── 1b. A function carries no brief and no themes, ever ───────────
    # Islam, 2026-09-24. BOTH ENDS (§94.2): a function refuses them, a unit
    # and a capability beside it keep them, and a stored "on" cannot bring
    # them back (a toggle the rule refuses would be decoration, §42).
    fk = safe(pg, "()=>FUNCTION_KEYS[0]")
    ck("unstored: a function carries no brief", safe(pg, "()=>compOn('fn:%s','brief')" % fk) is False)
    ck("…and no themes", safe(pg, "()=>compOn('fn:%s','theme')" % fk) is False)
    ck("…but keeps its North Star", safe(pg, "()=>compOn('fn:%s','keyobj')" % fk) is True)
    # §427: a unit's Foundation draws no themes, purpose or values, so they
    # read OFF whatever is stored — both ends, the brief still ON beside them.
    ck("a unit keeps its brief, and its themes are not available (§427)",
       safe(pg, "()=>compOn('%s','brief')===true && compOn('%s','theme')===false" % (unit, unit)) is True)
    # REWRITTEN, never loosened (§218): §478 gave a unit's Purpose and Core
    # Values a page, so a stored 'on' brings them back now (§479) — themes and
    # a company's SWOT still cannot be, and unsaid the two stay off.
    ck("a stored 'on' cannot bring a unit's themes or a company's SWOT back, but does bring its purpose (§427, §479)",
       safe(pg, "()=>{GROUP.structure={over:{'%s':{purpose:true,theme:true},'co:x':{swot:true}}}; var r=[compOn('%s','theme'),compOn('%s','purpose'),compOn('co:x','swot'),compOn('co:x','brief')]; delete GROUP.structure; r.push(compOn('%s','purpose'),compOn('%s','values')); return r.join(',')}" % (unit, unit, unit, unit, unit)) == "false,true,false,true,false,false")
    ck("a capability keeps its brief (§334's definition)",
       safe(pg, "()=>compOn('cap:x','brief')") is True)
    ck("a stored per-function 'on' cannot bring the brief back",
       safe(pg, "()=>{GROUP.structure={over:{'fn:%s':{brief:true}}}; var r=compOn('fn:%s','brief'); delete GROUP.structure; return r}" % (fk, fk)) is False)
    ck("the function's Overview draws no 'What it is' card",
       safe(pg, "()=>{var h=holderOverview('fn:%s'); return typeof h==='string' && !/What it is/.test(h)}" % fk) is True)

    # ── 2. One item's SWOT, pressed in Client set-up › Structure (§435) ──
    # §435 MOVED the per-item exceptions off their own Setup page into an
    # "Except for" box at the foot of each layer's card; the claims below are
    # §404's, asserted where the control lives now (§218: rewritten, never
    # loosened), plus the page asserted GONE at both ends (§94.2).
    ok = press(pg, '[data-md="setup"]')
    ck("Setup opens", ok)
    ck("Setup's rail no longer carries a Structure page (§435)",
       safe(pg, "()=>!document.querySelector('[data-setupgo=\"structure\"]')") is True)
    ok = (press(pg, '.ritem[data-setupgo="start"]') or press(pg, '[data-setupgo="start"]')) and press(pg, '.wzstep[data-step="structure"]')
    ck("Client set-up › Structure opens", ok)
    ck("every card below the top carries an Except for box",
       safe(pg, "()=>['mid','bu','fn','cap'].every(k=>!!document.querySelector('[data-stexcept=\"'+k+'\"]'))") is True)
    ck("…the business units' box starts empty and says so",
       safe(pg, "()=>{var x=document.querySelector('[data-stexcept=\"bu\"]'); return !!x.querySelector('.stxnone') && !x.querySelector('[data-stxitem]')}") is True)
    def pick(k, v):
        try:
            pg.select_option('[data-stexcept="%s"] select.stxadd' % k, v); pg.wait_for_timeout(250); return True
        except Exception: return False
    ck("picking the unit in 'Make an exception for…'", pick("bu", unit))
    ck("…draws its row and stores NOTHING yet (§50.6)",
       safe(pg, "()=>!!document.querySelector('[data-stxitem=\"%s\"]') && !SMPRules.structureOf(GROUP)" % unit) is True)
    ck("pressing the unit's SWOT chip", press(pg, '[data-stxover="%s|swot"]' % unit))
    ck("…stores ONE adjustment, off (§96)",
       safe(pg, "()=>GROUP.structure&&GROUP.structure.over&&GROUP.structure.over['%s'].swot" % unit) is False)
    ck("…and the chip wears the differs ring",
       safe(pg, "()=>document.querySelector('[data-stxover=\"%s|swot\"]').classList.contains('diff')" % unit) is True)
    s1 = secs(unit)
    ck("OFF: that unit offers no SWOT section", "swot" not in s1, s1)
    other = safe(pg, "()=>activeKeys()[1]")
    ck("…while the unit beside it still does", "swot" in (secs(other) or []), other)
    ck("OFF HIDES AND NEVER DELETES: the SWOT items are still stored",
       safe(pg, "()=>Object.values(UNITS['%s'].swot||{}).some(l=>l&&l.length)" % unit) is True)
    deck = safe(pg, "()=>/d-swot/.test(deckHtmlFor('%s'))" % unit)
    ck("OFF: the deck draws no SWOT slides for it", deck is False, deck)
    ck("…and a unit left on still does", safe(pg, "()=>/d-swot/.test(deckHtmlFor('%s'))" % other) is True)
    press(pg, '[data-stxover="%s|swot"]' % unit)
    ck("pressing it back DELETES the adjustment and the empty structure (§50.6)",
       safe(pg, "()=>!('structure' in GROUP)") is True)
    ck("…the row leaves the list once it follows the layer again",
       safe(pg, "()=>!document.querySelector('[data-stxitem=\"%s\"]')" % unit) is True)
    ck("…and the SWOT section is back", "swot" in (secs(unit) or []))
    # §436 (Islam, 2026-09-30): a function's first section is its description;
    # its key objectives belong to how it plans, so no chip. REWRITTEN, never
    # loosened (§218) — both ends: the description offered, the rest not.
    # §437: the key objectives are a function's option again (Islam: *"keep
    # them in the first section as an option"*), so the row offers them
    # beside the description — asserted PRESENT, never merely not-absent.
    ck("a function's row offers its description and key objectives chips and no brief, themes or values chip",
       pick("fn", "fn:" + str(fk)) and safe(pg, "()=>!['brief','theme','values','purpose'].some(c=>document.querySelector('[data-stxover=\"fn:%s|'+c+'\"]')) && !!document.querySelector('[data-stxover=\"fn:%s|desc\"]') && !!document.querySelector('[data-stxover=\"fn:%s|keyobj\"]')" % (fk, fk, fk)) is True)
    ck("…and a unit's row offers a brief but no themes (§427)",
       pick("bu", unit) and safe(pg, "()=>!!document.querySelector('[data-stxover=\"%s|brief\"]') && !document.querySelector('[data-stxover=\"%s|theme\"]')" % (unit, unit)) is True)
    ck("…Remove takes a row off without storing anything",
       press(pg, '[data-stxitem="%s"] .linkbu' % unit) and safe(pg, "()=>!document.querySelector('[data-stxitem=\"%s\"]') && !SMPRules.structureOf(GROUP)" % unit) is True)

    # ── 3. A level's components, as the set-up step writes them ───────
    safe(pg, """()=>{GROUP.structure={top:{on:['brief','purpose','aspiration','keyobj','values'],temple:true},
        mid:{exists:true,on:['brief','aspiration','keyobj'],temple:false},
        bu:{on:['brief','aspiration','keyobj','pillar']},fn:{on:['brief','aspiration']}};}""")
    g1 = tabs("group", "group")
    ck("Temple needs the themes: with them off there is no Temple tab", "temple" not in g1, g1)
    ck("…the Foundation stays", "strategy" in g1 and "found" in (gsecs() or []), [g1, gsecs()])
    ck("a level without SWOT: no unit offers a SWOT section", "swot" not in (secs(other) or []))
    c1 = tabs("co", "co:" + str(co))
    ck("the second layer SAID its components: a company offers a Foundation tab", "foundation" in c1, c1)
    ck("a function with its North Star off (and the brief never on) has it off",
       safe(pg, "()=>compOn('fn:'+FUNCTION_KEYS[0],'keyobj')") is False)
    ck("…even with the brief stored on its level, a function's brief stays off",
       safe(pg, "()=>compOn('fn:'+FUNCTION_KEYS[0],'brief')") is False)

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
    # §418 REWROTE THIS STEP INTO THREE SECTIONS PER LAYER, so the chips are
    # asserted as the sections' own rows now (§218: rewritten, never
    # loosened). The first section's parts are the rule's own list, filtered
    # for a function by the same compOffered the pages ask (§42, §94.8).
    # §436/§437: every layer but the functions offers every part but a
    # function's own description; the functions offer that and their key
    # objectives.
    want = safe(pg, "()=>({top:SMPRules.SEC_FOUND_PARTS.filter(c=>SMPRules.compOffered('group',c)).length, fn:SMPRules.SEC_FOUND_PARTS.filter(c=>SMPRules.compOffered('fn:',c)).length})", {})
    got = safe(pg, "()=>['top','mid','bu','fn'].map(k=>SMPRules.SEC_FOUND_PARTS.filter(c=>document.querySelector('[data-stcomp=\"'+k+'|'+c+'\"]')).length)", [])
    ck("every layer's first section offers its parts, the functions' fewer (§404.1)",
       bool(want) and got == [want.get("top")] * 3 + [want.get("fn")], [got, want])
    ck("…the functions' level offers no Brief, Themes, Pillars, Capabilities or Values chip",
       safe(pg, "()=>!['brief','theme','pillar','capability','values'].some(c=>document.querySelector('[data-stcomp=\"fn|'+c+'\"]'))") is True)
    ck("…offers its Description AND its key objectives, with its SWOT a section switch (§436, §437)",
       safe(pg, "()=>!!document.querySelector('[data-stcomp=\"fn|desc\"]') && !!document.querySelector('[data-stcomp=\"fn|keyobj\"]') && !!document.querySelector('[data-stsec=\"fn|swot\"]')") is True)
    ck("the capabilities' first section offers the brief and the North Star, as the directions do (§436)",
       safe(pg, "()=>SMPRules.SEC_FOUND_PARTS.filter(c=>document.querySelector('[data-stcomp=\"cap|'+c+'\"]')).join(',')") == "brief,keyobj",
       safe(pg, "()=>SMPRules.SEC_FOUND_PARTS.filter(c=>document.querySelector('[data-stcomp=\"cap|'+c+'\"]')).join(',')"))
    # §426: Purpose and Aspiration are never offered to a function — no page of
    # a function draws either, so a tick there would do nothing. Both ends: a
    # unit's row still offers them (asserted just below).
    ck("…and no Purpose or Aspiration chip on the functions' row (§426)",
       safe(pg, "()=>!['purpose','aspiration'].some(c=>document.querySelector('[data-stcomp=\"fn|'+c+'\"]'))") is True)
    ck("…and draws no 'Plan in, by default' row (§404.2: chosen per function later)",
       safe(pg, "()=>![...document.querySelectorAll('.stcard .lab')].some(x=>/Plan in/.test(x.textContent))") is True)
    ck("the default words are singular but for Objectives, Pillars, Capabilities, Values (and Themes)",
       safe(pg, "()=>['purpose','aspiration'].map(k=>labelDefault(k).many).join('|')") == "Mission|Winning Aspiration",
       safe(pg, "()=>['purpose','aspiration','theme','keyobj'].map(k=>labelDefault(k).many).join('|')"))
    # §427 (Islam: *"leave them ticked off and greyed … not able to tick on
    # and off"*): both ends — the parts a unit's page draws stay pressable,
    # the three it does not are drawn, off and disabled.
    ck("…while the business units' level offers a live brief and aspiration",
       safe(pg, "()=>['brief','aspiration'].every(c=>{var t=document.querySelector('[data-stcomp=\"bu|'+c+'\"]'); return t&&!t.disabled})") is True)
    ck("…and draws themes off, greyed and unpressable (§427)",
       safe(pg, "()=>['theme'].every(c=>{var t=document.querySelector('[data-stcomp=\"bu|'+c+'\"]'); return t&&t.disabled&&!t.classList.contains('on')&&!!t.closest('.dummy')})") is True)
    ck("…while purpose and values are live ticks, off until pressed (§479)",
       safe(pg, "()=>['purpose','values'].every(c=>{var t=document.querySelector('[data-stcomp=\"bu|'+c+'\"]'); return t&&!t.disabled&&!t.classList.contains('on')})") is True)
    ck("the second layer's themes tick is greyed and off, its brief live (§427)",
       safe(pg, "()=>['theme'].every(c=>{var t=document.querySelector('[data-stcomp=\"mid|'+c+'\"]'); return t&&t.disabled&&!t.classList.contains('on')}) && !document.querySelector('[data-stcomp=\"mid|brief\"]').disabled") is True)
    ck("…its SWOT and plan switches are greyed with Off lit and cannot be pressed (§427)",
       safe(pg, "()=>['mid|swot','mid|plan'].every(k=>{var w=document.querySelector('[data-stsec=\"'+k+'\"]'); if(!w||!w.classList.contains('dummy')) return false; var b=[...w.querySelectorAll('button')]; return b.every(x=>x.disabled) && b.some(x=>x.textContent==='Off'&&x.getAttribute('aria-pressed')==='true')})") is True)
    ck("…and its Temple switch is greyed, off and disabled (§427)",
       safe(pg, "()=>{var b=document.querySelector('[data-sttemple=\"mid\"]'); return !!b&&b.disabled&&b.getAttribute('aria-pressed')==='false'&&!!b.closest('.dummy')}") is True)
    ck("…while the top level's SWOT and plan switches stay live",
       safe(pg, "()=>['top|swot','top|plan'].every(k=>{var w=document.querySelector('[data-stsec=\"'+k+'\"]'); return w&&!w.classList.contains('dummy')&&[...w.querySelectorAll('button')].every(x=>!x.disabled)})") is True)
    ck("each layer draws three sections",
       safe(pg, "()=>[...document.querySelectorAll('.stsecs')].map(x=>x.querySelectorAll(':scope > .stsec').length).join(',')") == "3,3,3,3,3",
       safe(pg, "()=>[...document.querySelectorAll('.stsecs')].map(x=>x.querySelectorAll(':scope > .stsec').length).join(',')"))
    # §428: the fifth card is the capabilities', and its plan names two ways, never three.
    ck("the capabilities card names pillars and projects only",
       safe(pg, "()=>[...document.querySelectorAll('[data-stway^=\"cap|\"]')].map(x=>x.dataset.stway.split('|')[1]).sort().join(',')") == "pillars,projects",
       safe(pg, "()=>[...document.querySelectorAll('[data-stway^=\"cap|\"]')].map(x=>x.dataset.stway).join(',')"))
    ck("…and no card carries a 'Carries capabilities' tick",
       safe(pg, "()=>!document.querySelector('[data-stcomp$=\"|capability\"]')") is True)
    ck("the plan section names all three ways on units and functions, pillars alone above them",
       safe(pg, "()=>['top','mid','bu','fn'].map(k=>[...document.querySelectorAll('[data-stway^=\"'+k+'|\"]')].length).join(',')") == "1,0,3,3",
       safe(pg, "()=>['top','mid','bu','fn'].map(k=>[...document.querySelectorAll('[data-stway^=\"'+k+'|\"]')].length).join(',')"))
    ck("the sections sit side by side on a wide window",
       safe(pg, "()=>{var s=[...document.querySelector('.stsecs').children].map(x=>Math.round(x.getBoundingClientRect().top)); return new Set(s).size===1}") is True)
    ck("nothing is stored until something is pressed", safe(pg, "()=>!('structure' in GROUP)") is True)
    # §428.2: what the top card SHOWS unsaid is what the press stores for it —
    # the top layer's own SWOT and Plan start off, so it is not all nine.
    topShown = safe(pg, "()=>SMPRules.levelComponents(GROUP,'top').join(',')", "")
    ck("§428.2: unsaid, the top level carries neither its own SWOT nor its own Plan",
       ",swot" not in ","+topShown and ",pillar" not in ","+topShown and len(topShown.split(",")) == 7, topShown)
    ck("pressing the business units' SWOT off", press(pg, '[data-stsec="bu|swot"] button:nth-child(2)'))
    st = safe(pg, "()=>JSON.stringify(GROUP.structure)", "") or ""
    ck("…materialises the structure with SWOT off at that level only",
       safe(pg, "()=>GROUP.structure.bu.on.indexOf('swot')<0 && GROUP.structure.top.on.join(',')===" + json.dumps(topShown) + " && GROUP.structure.top.temple===true") is True, st)
    ck("…and the section says it is hidden rather than drawing its boxes",
       safe(pg, "()=>{var s=document.querySelectorAll('.stcard')[2].querySelectorAll('.stsec')[1]; return !!s.querySelector('.sthid') && !s.querySelector('.stquad')}") is True)
    # §418.1: a key this step does not draw survives a press (another
    # session's Plan details switches ride the same object). BOTH ENDS: it
    # is there before the press and still there after.
    safe(pg, "()=>{GROUP.structure.details={overview:true}}")
    ck("a key the step does not draw is there before a press", safe(pg, "()=>GROUP.structure.details.overview") is True)
    press(pg, '[data-stsec="bu|swot"] button:nth-child(1)')
    ck("…and survives the press (§418.1)", safe(pg, "()=>!!(GROUP.structure.details&&GROUP.structure.details.overview===true)") is True,
       safe(pg, "()=>JSON.stringify(GROUP.structure.details)"))
    ck("…while the press itself landed", safe(pg, "()=>GROUP.structure.bu.on.indexOf('swot')>=0") is True)
    safe(pg, "()=>{delete GROUP.structure.details}")
    press(pg, '[data-stsec="bu|swot"] button:nth-child(2)')
    ck("the structure stores no functions' plan type (§404.2)",
       safe(pg, "()=>!('format' in (GROUP.structure.fn||{}))") is True)

    # ── 6. A client WITH A PLAN can still rename (§417) ──────────────
    # Islam, on El Abd: the name boxes were read-only once a plan existed, so
    # "Strategic Directions" could not be changed here. The worked example
    # holds plans — the state he was in — asserted first, or the rest passes
    # on a client whose shape is still open (§113.8).
    ck("the worked example holds a plan, so its shape is frozen",
       safe(pg, "()=>{var h=__smpHoldsNow(); return !!(h.plans||h.capabilities)}") is True)
    was = safe(pg, "()=>labelWord('unitword','bu')", "")
    wasP = safe(pg, "()=>labelWord('pillar','bu')", "")
    ro = safe(pg, "()=>[...document.querySelectorAll('input[data-stword],input[data-stlw],input[data-sttitle]')].filter(i=>i.readOnly).length", -1)
    ck("no word box on the step is read-only", ro == 0, ro)
    for sel, val in (('input[data-stword="unitword|many"]', "Strategic Directions"),
                     ('input[data-stlw="bu|pillar|many"]', "Themes of work")):
        try:
            pg.fill(sel, val); pg.press(sel, "Tab"); pg.wait_for_timeout(250)
        except Exception as e:
            ck("typing into " + sel, False, str(e)[:120])
    ck("the business units' word is stored on the client's own labels",
       safe(pg, "()=>labelWord('unitword','bu')") == "Strategic Directions",
       safe(pg, "()=>labelWord('unitword','bu')"))
    # §418: a part's name is the LAYER's, so it lands on the structure and
    # is read on a unit's page, never on the client's labels — asserted at
    # both ends, or a build writing it everywhere passes (§94.2).
    ck("…and the pillars' word is the business units' layer's own",
       safe(pg, "()=>SMPRules.layerWord(GROUP,'%s','pillar','many')" % unit) == "Themes of work",
       safe(pg, "()=>JSON.stringify(GROUP.structure&&GROUP.structure.bu)"))
    ck("…read on a unit's pages",
       safe(pg, "()=>{var t=TARGET,s=TARGET_SETUP; TARGET='%s'; TARGET_SETUP=false; var w=L('pillar'); TARGET=t; TARGET_SETUP=s; return w}" % unit) == "Themes of work")
    ck("…while a function's page keeps the client's word",
       safe(pg, "()=>{var t=TARGET,s=TARGET_SETUP; TARGET='fn:%s'; TARGET_SETUP=false; var w=L('pillar'); TARGET=t; TARGET_SETUP=s; return w}" % fk) == wasP)
    ck("…without the shape being rewritten (no unit lost, nothing refused)",
       safe(pg, "()=>UNIT_KEYS.length>0 && !/shape is not rewritten from here/.test(document.body.innerText)") is True)
    ck("the old 'changed on Terminology' line is gone",
       safe(pg, "()=>!/changed on Setup › Terminology/.test(document.body.innerText)") is True)
    safe(pg, "()=>{var f=function(k,v){var e=LABELS.entries.filter(x=>x.key===k)[0]; e.bu=v;}; f('unitword',%r); f('pillar',%r); paint();}" % (was, wasP))

    # ── 6b. …and the top level's and second layer's word too (§421) ──
    # Islam: "I'm trying to adjust the top level type to company but I
    # can't". Both sets of name buttons were greyed on a client with a
    # plan, with nothing saying why. PRESSED and read back (§70, §96), and
    # the lit button asserted to FOLLOW, or a press that stored the word
    # still reads as a press that did nothing.
    wasT = safe(pg, "()=>labelWord('topword','group')", "")
    dis = safe(pg, "()=>[...document.querySelectorAll('.stcard .wzband button')].filter(b=>b.disabled && /^(Group|Company|Holding|Division|Sector|Another name…)$/.test(b.textContent)).length", -1)
    ck("no name button on the step is greyed", dis == 0, dis)
    try:
        pg.click('.stcard .wzband button:has-text("Company")', timeout=4000); pg.wait_for_timeout(250)
    except Exception as e:
        ck("pressing Company", False, str(e)[:120])
    ck("the top level's word is now Company, on the client's own labels",
       safe(pg, "()=>labelWord('topword','group')") == "Company", safe(pg, "()=>labelWord('topword','group')"))
    ck("…and Company is the button lit",
       safe(pg, "()=>{var b=[...document.querySelectorAll('.stcard')][0].querySelector('.wzband button[aria-pressed=true]'); return b&&b.textContent}") == "Company")
    ck("the step says what is still changeable on a client with a plan",
       safe(pg, "()=>/Every name and switch on this step can still be changed/.test(document.body.innerText)") is True)
    safe(pg, "()=>{var e=LABELS.entries.filter(x=>x.key==='topword')[0]; e.group=e.bu=%r; paint();}" % wasT)

    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n%s" % ("all good" if not fails else "%d FAILED" % len(fails)))
sys.exit(1 if fails else 0)
