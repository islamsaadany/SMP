"""What a direction owner sees of the plan — the half eye (§517).

Islam, of El Abd (business units off, directions with owners): *"when they
open they see the full plan … can we make in the roles and access in the plan
visibility to have 2 visibility buttons one for the full plan and one only for
their part"*, then *"1. keep foundation 2. directions only for now 3. agreed"*
and, of the mockup, *"ok for the half eye, build it"*.

It MAKES its state (§255): the worked example plans on its business units, so
the units are switched off and two directions are written, one owned by a
person MADE for the check whose only road to the company is that direction.

  1 · the table: the Part owner row's Group / Company cell carries the half eye
      beside the eye, and the legend explains it — nowhere else (§94.2).
  2 · the press: the half eye writes GROUP.dirScope, lights itself and shows
      the eye unlit; the eye pressed again DELETES the key (§50.6).
  3 · what they see with it on: their own direction on Plan, Reporting and
      Performance and NOT the other one; the Foundation kept; the SWOT gone.
  4 · BOTH ENDS: with it off the same person sees both directions, and with it
      on the office still sees both.
  5 · §520: a capability's owner is a part owner too — their own capability's
      section and the Foundation, and nothing else; the caps section is the
      one thing the half eye may NOT hide, because with the units off a
      capability is never a destination (§61). Both ends again.
  5b · §520.6: and they REPORT — the company Reporting tab, their own
      capability's rows live and nobody else's, no Submit; a direction owner
      as the control; the office the lot. Both ends.
  5c · §520.7: a capability planned in PILLARS reports its measures and
       tactics there, through the body a direction reports through — the
       owner types, a direction owner gets no section, the office types too.

SMP_BUILT points it at another build (§276). Every probe degrades (§215).
"""
import os
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or os.path.join(os.path.dirname(__file__), "..", "strategy-management-platform.html")
bad = 0
def ck(name, ok, detail=""):
    global bad
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok else "  — " + str(detail)))
    if not ok: bad += 1
def safe(pg, js, dflt=None, arg=None):
    try: return pg.evaluate(js) if arg is None else pg.evaluate(js, arg)
    except Exception: return dflt

MAKE = """()=>{
  GROUP.structure = {bu:{exists:false}, top:{on:SMPRules.STRUCT_COMPONENTS.slice(), temple:true}};
  PEOPLE.push({key:'t517', name:'Testcase Part Reader', unit:'group'});
  GROUP.items = [
    {id:'group-P1', code:'EA01', name:'Direction one', sub:'', kind:'', theme:'', owner:'Testcase Part Reader',
     measures:[{id:'group-P1-M1', name:'Revenue', dir:'\\u2265', target:'100 M EGP', compile:'Sum', actual:''}], tactics:[]},
    {id:'group-P2', code:'EA02', name:'Direction two', sub:'', kind:'', theme:'', owner:'Somebody Else Entirely',
     measures:[{id:'group-P2-M1', name:'Share', dir:'\\u2265', target:'10%', compile:'Latest', actual:''}], tactics:[]}];
  delete GROUP[SMPRules.DIR_SCOPE];
  return true}"""

def go(pg, sub, sec=None):
    js = "()=>{current='group'; currentSub='%s';%s paint(); return true}" % (sub, (" CURSEC.%s='%s';" % (sub, sec)) if sec else "")
    safe(pg, js); pg.wait_for_timeout(300)
def as_(pg, key):
    safe(pg, "()=>{switchViewer('%s'); return true}" % key); pg.wait_for_timeout(400)
#  §520.5: THE GROUP'S PERFORMANCE DRAWS ONE SECTION AT A TIME (`SECS[GSEC]`),
#  so a read at `GSEC = 0` is a read of whichever section happens to come
#  first — the capabilities one for a narrowed part owner, the headline for
#  the office, which is how this file's own first run reported a correct
#  build broken (§100.3). The section is selected BY ITS OWN TITLE
#  (`GROUP_SECTIONS` is what the shell builds the section row from), so the
#  assertion is about that section rather than about which fixture ran
#  (§113.8) — and a null answer means it was never drawn, which the caller
#  has to tell apart from a section drawn holding nothing.
def perfcaps(pg):
    go(pg, "performance")
    hit = safe(pg, """()=>{var i = GROUP_SECTIONS.indexOf(L('capability','bu'));
      if (i < 0) return false; GSEC = i; paint(); return true}""")
    pg.wait_for_timeout(300)
    if not hit: return None
    return safe(pg, "()=>document.getElementById('panel').textContent", "") or ""
RAIL = "()=>[...document.querySelectorAll('[data-urail]')].map(b=>b.dataset.urail)"
#  §520: WHAT THE GROUP DESTINATION OFFERS, asked of the product rather than
#  of the markup. `allowed()` is the one answer the shell's own tab row and
#  section row are built from (§53.5), so this holds whether or not a button
#  is drawn — and `capsReachable()` is the matrix's answer for the caps rail.
OFFERED = """()=>{var d = SUBS.group.filter(x=>x.k==='strategy')[0];
  return {secs: allowed(d.sections(),'group').map(s=>s.k),
          tabs: allowed(SUBS.group,'group').map(x=>x.k),
          caps: capsReachable().map(c=>c.id)}}"""
def cell(pg):
    return safe(pg, """()=>{var tr=[...document.querySelectorAll('.acgrid tbody tr')].find(t=>/Part owner/.test(t.textContent));
      if(!tr) return null; var td=tr.querySelectorAll('td.ac')[0];
      return {half: !!td.querySelector('[data-dirscope]'), halfOn: !!td.querySelector('[data-dirscope].on'),
              eyeOn: !!td.querySelector('.stbtn.on[data-acm$="|none"]') && td.querySelector('.stbtn').classList.contains('on'),
              order: [...td.querySelectorAll('.stbtn')].map(b=>b.dataset.dirscope?'half':(b.dataset.acm||'').split('|')[1])}}""")

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(800)
    ck("the state is made", safe(pg, MAKE) is True)

    # ── 1. The table ─────────────────────────────────────────────────
    safe(pg, "()=>{var g=document.querySelector('[data-md=\"setup\"]'); if(g) g.click(); return true}"); pg.wait_for_timeout(300)
    safe(pg, "()=>{var a=document.querySelector('[data-setupgo=\"access\"]'); if(a) a.click(); return true}"); pg.wait_for_timeout(400)
    c = cell(pg) or {}
    ck("the Part owner's Group / Company cell carries the half eye", c.get("half") is True, c)
    ck("…straight after the eye", (c.get("order") or [None, None])[:2] in (["none", "half"], ["view", "half"]), c)
    n = safe(pg, "()=>document.querySelectorAll('.acgrid [data-dirscope]').length", -1)
    ck("…and in no other cell", n == 1, n)
    leg = safe(pg, "()=>(document.querySelector('.chart-legend')||{}).textContent||''", "")
    ck("the legend explains it", "their part only" in leg, leg[:200])

    # ── 2. The press ─────────────────────────────────────────────────
    # §621: every press on Roles & access asks first; this file is about what
    # the press does, so it answers Change it (ask-and-apply.py tests the box).
    try: pg.click(".acgrid [data-dirscope]"); pg.wait_for_timeout(300); pg.click(".askbox .askyes"); pg.wait_for_timeout(300)
    except Exception: pass
    ck("pressing it writes their-part-only", safe(pg, "()=>GROUP[SMPRules.DIR_SCOPE]") == "part")
    c = cell(pg) or {}
    ck("…lights the half eye and shows the eye unlit", c.get("halfOn") is True and not c.get("eyeOn"), c)
    try: pg.click(".acgrid tbody tr:has(td.ac [data-dirscope]) td.ac .stbtn >> nth=0"); pg.wait_for_timeout(300); pg.click(".askbox .askyes"); pg.wait_for_timeout(300)
    except Exception: pass
    ck("pressing the eye gives them the full plan again (the key is DELETED)",
       safe(pg, "()=>(SMPRules.DIR_SCOPE in GROUP)", True) is False)
    ck("…and the cell still reads 'may read'", safe(pg, "()=>grantFor('dirowner','a_group')") == "view")

    # ── 3. What they see with it on ──────────────────────────────────
    safe(pg, "()=>{GROUP[SMPRules.DIR_SCOPE]='part'; return true}")
    as_(pg, "t517")
    ck("the rule says they read their part only", safe(pg, "()=>partOnly()") is True)
    go(pg, "strategy", "plan")
    r = safe(pg, RAIL, []) or []
    ck("Plan lists their own direction", any("group-P1" in x for x in r), r)
    ck("…and not the other one", not any("group-P2" in x for x in r), r)
    go(pg, "report")
    r = safe(pg, RAIL, []) or []
    ck("Reporting lists their own direction and not the other", any("group-P1" in x for x in r) and not any("group-P2" in x for x in r), r)
    #  §520: "perf" IS NOT THE GROUP'S PERFORMANCE TAB AND NEVER WAS — the key
    #  is `performance` (shell.html's own def), so `paint()` fell back to the
    #  first tab with CURSEC preserved and this block has been re-measuring the
    #  PLAN section it asserted two lines above. It passed for the wrong reason
    #  (§113.8), which means §517's own Performance filter has never once been
    #  measured (§54.5). REWRITTEN, never loosened (§218).
    go(pg, "performance")
    txt = safe(pg, "()=>document.getElementById('panel').textContent", "") or ""
    ck("Performance shows their direction and not the other", "Direction one" in txt and "Direction two" not in txt, txt[:200])
    #  WHAT THE PRODUCT OFFERS, never the button row (§100.3): §211.2 draws no
    #  section button at all where a tab has one section, so `[data-sub2]`
    #  reports a rendered Foundation as absent. `allowed()` is the shell's own
    #  answer and holds at one section too.
    secs = (safe(pg, OFFERED, {}) or {}).get("secs") or []
    ck("the Foundation is kept", "found" in secs, secs)
    ck("the SWOT is not offered", "swot" not in secs, secs)
    #  §520.5: AND THE GATE, MEASURED ON THE PERSON WHO REACHES NO
    #  CAPABILITY. A direction owner is a part owner and reaches none, so
    #  `capsHere()` is empty for them — asserted FIRST, or this says nothing
    #  about the gate and everything about which fixture ran (§113.8). Without
    #  the gate the caps heading is pushed over nought cards (§45.2,
    #  §520.2's own fault one section along).
    ck("§520.5: a direction owner reaches no capability", safe(pg, "()=>capsHere().length") == 0)
    ck("§520.5: …so the capabilities section is not drawn for them", "caps" not in secs, secs)
    #  AND NOT ON PERFORMANCE EITHER, which is a different gate and had to be
    #  asserted separately: the line above reads the Strategy tab's sections,
    #  and breaking the Performance one left this whole file GREEN (§54.5).
    #  The capability exists on this tenant and this person reaches none of
    #  them, so the section must not be pushed at all — a heading over nought
    #  cards (§520.2, §45.2).
    ck("§520.5: …nor on Performance, where they would read a heading over nothing",
       safe(pg, "()=>SMPRules.capExists(GROUP)") is True and perfcaps(pg) is None)
    # ── 4. Both ends ─────────────────────────────────────────────────
    safe(pg, "()=>{delete GROUP[SMPRules.DIR_SCOPE]; paint(); return true}")
    go(pg, "strategy", "plan")
    r = safe(pg, RAIL, []) or []
    ck("with it off the same person sees both directions", any("group-P1" in x for x in r) and any("group-P2" in x for x in r), r)
    safe(pg, "()=>{GROUP[SMPRules.DIR_SCOPE]='part'; return true}")
    as_(pg, "smo")
    go(pg, "strategy", "plan")
    r = safe(pg, RAIL, []) or []
    ck("with it on the office still sees both", any("group-P1" in x for x in r) and any("group-P2" in x for x in r), r)

    # ── 5. §520: a capability's owner is a part owner ──────────────
    #  Islam: "a capability owner is a part owner and it's set to see only his
    #  capability like the pillars owners but still he sees everything. his
    #  access hsould match the direction owner like Amr hassan only seeing his
    #  directions plus the corporate foundation". A capability sits INSIDE a
    #  function, so it was on the wrong drawn row — and the half eye lives on
    #  the PART OWNER row, which is why it could not reach them.
    #  The state is MADE again (§255): the worked example's one capability
    #  carries no head, so it derives no capowner — and a SECOND capability is
    #  made beside it, or "they reach their own and not the other" is asserted
    #  over a list that could only ever hold one (§113.8).
    ck("the capability state is made", safe(pg, """()=>{
      PEOPLE.push({key:'t520', name:'Testcase Capability Owner', unit:'group'});
      var c = (GROUP.capabilities||[])[0]; if(!c) return false;
      c.head = 't520';
      //  §520.6: A KEY OBJECTIVE IS MADE, because the demo's capability holds
      //  none (§333) and the capability's OWN rows are the only ones gated by
      //  `canReportFnWhole(holderCodeOwner(c))` — a project's rows ask per
      //  project. Without this row that line is under no measurement at all,
      //  which is how its falsification first came back green (§54.5).
      c.keyObjectives.push({id: c.id + '-KO1', name: 'Testcase objective', dir: '\u2265', target: '10%', weight: 1});
      GROUP.capabilities.push({id:'capZZ', name:'Second capability', fn:c.fn, def:'',
                               keyObjectives:[], projects:[], items:[]});
      GROUP[SMPRules.DIR_SCOPE] = 'part';
      return true}""") is True)
    as_(pg, "t520")
    ck("§520: the rule reaches a capability's owner", safe(pg, "()=>partOnly()") is True)
    ck("§520: …and they own no direction", safe(pg, "()=>partMine()") is False)
    o = safe(pg, OFFERED, {}) or {}
    secs, tabs, reach = o.get("secs") or [], o.get("tabs") or [], o.get("caps") or []
    ck("§520: the corporate Foundation is offered", "found" in secs, secs)
    #  …and RENDERED, not merely offered (§96): the word is read off the
    #  product's own label rather than typed (§94.8).
    go(pg, "strategy", "found")
    fw = safe(pg, "()=>L('brief')", "") or "\u0000"
    ck("§520: …and the Foundation is drawn",
       fw in (safe(pg, "()=>document.getElementById('panel').textContent", "") or ""), fw)
    for k, word in (("swot", "the SWOT"), ("compete", "Competitive Discipline"),
                    ("plan", "the directions rail")):
        ck("§520: %s is not offered" % word, k not in secs, secs)
    for k, word in (("focus", "Focus"), ("temple", "the Temple")):
        ck("§520: the %s tab is not offered" % word, k not in tabs, tabs)
    #  §61: AND THE ONE THING THEY SHOULD SEE IS STILL REACHED. With the
    #  business units off `capAtTop` is true outright, so a capability is
    #  always a SECTION of this tab and never a destination — which is what
    #  made `!partOnly()` on that section the one thing the half eye may not
    #  do: it left them the Foundation and no way to their own part at all.
    #  The narrowing is the MATRIX's (`capsReachable`), never the half eye's.
    cid = safe(pg, "()=>(GROUP.capabilities||[])[0].id", "")
    mine520 = safe(pg, "()=>(GROUP.capabilities||[])[0].name", "\u0000") or "\u0000"
    ck("§520: their own capability's section is offered", "caps" in secs, secs)
    ck("§520: …listing theirs and not the other", reach == [cid], {"want": [cid], "got": reach})
    #  §520.11: AND THEY LAND ON IT. Islam: "the capability default opens on
    #  the perfromance which is wrong it should open on the capbility page
    #  itself". `entrySub("group")` landed on Strategy only when the directions
    #  list was offered (§449), and the half eye hides that list from a
    #  capability's owner (§520.2) — so they fell to Performance while the
    #  Capabilities section was offered and never considered. The rule is asked
    #  directly (§94.8) with TOPCAP first pointed at the OTHER capability, or
    #  "TOPCAP is theirs" passes on a build that never set it (§113.8); then
    #  the page is painted the way a landing paints it and read.
    LAND = """()=>{current=null; currentSub=null; TOPCAP='capZZ';
      try{sessionStorage.removeItem('smp.where')}catch(e){}
      var s = entrySub('group'); return {sub:s, sec:CURSEC.strategy, topcap:TOPCAP}}"""
    ld = safe(pg, LAND, {}) or {}
    ck("§520.11: a capability's owner lands on Strategy", ld.get("sub") == "strategy", ld)
    ck("§520.11: …on the Capabilities section", ld.get("sec") == "caps", ld)
    ck("§520.11: …with their own capability selected", ld.get("topcap") == cid, {"want": cid, "got": ld})
    go(pg, "strategy", "caps")
    lit = safe(pg, "()=>{var b=document.querySelector('[data-topcap].on'); return b ? b.dataset.topcap : null}")
    ck("§520.11: …and the drawn rail lights theirs", lit == cid, {"want": cid, "got": lit})
    ptxt = safe(pg, "()=>document.getElementById('panel').textContent", "") or ""
    ck("§520.11: …and the pane holds their capability", mine520 in ptxt, ptxt[:200])
    #  BOTH ENDS (§94.2): a direction's owner under the same half eye still
    #  lands on the directions list, the office still lands there, and a part
    #  owner offered NEITHER list still lands on Performance — or a build that
    #  sent everybody to the capabilities section passes the three above.
    as_(pg, "t517")
    l2 = safe(pg, LAND, {}) or {}
    ck("§520.11: a direction's owner still lands on the directions list",
       l2.get("sub") == "strategy" and l2.get("sec") == "plan", l2)
    as_(pg, "smo")
    l3 = safe(pg, LAND, {}) or {}
    ck("§520.11: …and so does the office",
       l3.get("sub") == "strategy" and l3.get("sec") == "plan", l3)
    #  The "neither" state is MADE honestly: removing their capability head
    #  leaves them holding no part at all, and somebody reaching no part has
    #  no group destination (entrySub answers null), which is a different
    #  state. What the office CAN do is shut the Capability owner row's own
    #  Performance cell — then the capability is not reachable, so Capabilities
    #  is not offered, while the group's Foundation still is.
    as_(pg, "t520")
    safe(pg, "()=>{ACCESS.capowner=ACCESS.capowner||{}; ACCESS.capowner.a_fn_own='none'; paint(); return true}")
    l4 = safe(pg, LAND, {}) or {}
    ck("§520.11: …and a part owner offered neither list still lands on Performance",
       l4.get("sub") == "performance", l4)
    safe(pg, "()=>{delete ACCESS.capowner.a_fn_own; if(!Object.keys(ACCESS.capowner).length) delete ACCESS.capowner; paint(); return true}")
    as_(pg, "t520")
    #  §520.5: AND GROUP PERFORMANCE DRAWS THEIR OWN CAPABILITY'S FIGURES.
    #  Islam: "a capability doesn't see a group performance same like the
    #  direction owner." §520 drew every capability there (the section read
    #  `GROUP.capabilities` whole) and then §517's filter kept only the
    #  directions sections, which a capability owner has none of — so the page
    #  read "Nothing to show yet." REWRITTEN, never loosened (§218): the claim
    #  that survives is that they read THEIRS and nobody else's.
    mine = safe(pg, "()=>(GROUP.capabilities||[])[0].name", "\u0000") or "\u0000"
    txt = perfcaps(pg)
    ck("§520.5: Performance draws the capabilities section at all", txt is not None)
    txt = txt or ""
    ck("§520.5: Performance draws their own capability", mine in txt, {"want": mine, "got": txt[:200]})
    ck("§520.5: …and not the other one", "Second capability" not in txt, txt[:200])
    ck("§520: …and never the other direction", "Direction two" not in txt, txt[:200])
    ck("§520.5: …and never the empty-handed note", "Nothing to show yet." not in txt, txt[:200])
    #  THE TABLE VIEW IS THE SAME LIST READ A SECOND WAY (§53.5), so a
    #  narrowing reaching the cards alone leaks every capability through it.
    safe(pg, "()=>{GVIEW.caps='table'; paint(); return true}"); pg.wait_for_timeout(300)
    tv = safe(pg, "()=>document.getElementById('panel').textContent", "") or ""
    ck("§520.5: the table view narrows too",
       mine in tv and "Second capability" not in tv, tv[:200])
    safe(pg, "()=>{GVIEW.caps='cards'; paint(); return true}"); pg.wait_for_timeout(200)
    #  BOTH ENDS (§94.2): with the half eye off the same person is offered
    #  the lot — or a build that simply deleted those sections passes above.
    safe(pg, "()=>{delete GROUP[SMPRules.DIR_SCOPE]; paint(); return true}")
    o2 = safe(pg, OFFERED, {}) or {}
    secs2 = o2.get("secs") or []
    ck("§520: with the half eye off the SWOT comes back", "swot" in secs2, secs2)
    ck("§520: …and the directions rail", "plan" in secs2, secs2)
    #  AND THE GROUP'S PERFORMANCE DRAWS ONE SECTION AT A TIME (`SECS[GSEC]`),
    #  so the panel's text is not the page's contents: the first draft asserted
    #  both directions in the panel with the half eye off and was reading the
    #  HEADLINE section — the very section §517's filter exists to hide — so it
    #  reported a correct build broken (§100.3). The section is pressed by its
    #  own name (§94.8), which is also what says it is offered at all.
    go(pg, "performance")
    pressed = safe(pg, """()=>{var w = L('pillar','bu');
      var b = [...document.querySelectorAll('[data-sec]')].find(x=>x.textContent.trim()===w);
      if(!b) return false; b.click(); return true}""")
    pg.wait_for_timeout(300)
    txt2 = safe(pg, "()=>document.getElementById('panel').textContent", "") or ""
    ck("§520: …and Performance offers the directions section again", pressed is True)
    ck("§520: …drawing both directions",
       "Direction one" in txt2 and "Direction two" in txt2, txt2[:200])
    safe(pg, "()=>{GSEC = 0; return true}")
    #  THE WEIGHTING TAB IS MEASURED IN THE SHAPE THAT HAS ONE (§113.8): the
    #  fixture switches the business units OFF, and with them off `buExists()`
    #  is false and that tab can never be offered — so asserting its absence
    #  there could not fail on any build, and my own gate went unmeasured
    #  (§54.5). Units back on for two assertions, then put back (§94.2).
    safe(pg, "()=>{GROUP.structure.bu.exists = true; GROUP[SMPRules.DIR_SCOPE]='part'; paint(); return true}")
    tw = (safe(pg, OFFERED, {}) or {}).get("tabs") or []
    ck("§520: with the units on the Weighting tab is still not offered", "weighting" not in tw, tw)
    safe(pg, "()=>{delete GROUP[SMPRules.DIR_SCOPE]; paint(); return true}")
    tw2 = (safe(pg, OFFERED, {}) or {}).get("tabs") or []
    ck("§520: …and with the half eye off it comes back", "weighting" in tw2, tw2)
    safe(pg, "()=>{GROUP.structure.bu.exists = false; GROUP[SMPRules.DIR_SCOPE]='part'; paint(); return true}")
    # ── 5b. §520.6: a capability's owner reports their own capability ──
    #  Islam: "why ehab doesn't have the reporting part? like Amr in the retail
    #  he should see the foundation like the direction owner and see the
    #  reporting … the capability owner is treated like the direction owner".
    #  `canReport("group")` admits `ownsTopCapability` now, so the company's
    #  Reporting tab is offered to them, and the page draws THEIR capability's
    #  rows (one section per reachable capability, `capsHere()` — the same
    #  list the Strategy and Performance pages read, §53.5) and no direction's.
    #  Submitting stays the office's and the CEO's (`canSpeakFor`).
    REPORT = """()=>{current='group'; REPORTING='group'; currentSub='report'; paint();
      var p = document.getElementById('panel');
      //  THE REPORT CHROME (the count, the bar, Submit) is drawn on the tab
      //  row and never inside the pane, so Submit is asked of the DOCUMENT —
      //  the first draft asked the pane and reported the office's as absent.
      var boxes = [...p.querySelectorAll('.capbody input, .capbody select, .capbody textarea')];
      return {tabs: allowed(SUBS.group,'group').map(x=>x.k),
              heads: [...p.querySelectorAll('h2, .secttl')].map(e=>e.textContent.trim()),
              //  §520.8: the capabilities are a RAIL and one pane, so "both
              //  drawn" is the rail's rows and never a count of panes (§113.8).
              caps: p.querySelectorAll('[data-repcaprail] .ritem[data-topcap]').length,
              railNames: [...p.querySelectorAll('[data-repcaprail] .ritem[data-topcap]')].map(b=>b.textContent),
              pane: p.querySelectorAll('[data-repcaps] .capbody').length,
              capBoxes: boxes.length, capEnabled: boxes.filter(b=>!b.disabled).length,
              //  THE OBJECTIVE'S OWN BOX, BY ITS ID — a project's outcomes draw
              //  `data-crep` too, so an unscoped query went green on the very
              //  break this exists for (§113.8, found by falsifying).
              koBox: !!p.querySelector('.capbody [data-crep="' + GROUP.capabilities[0].id + '-KO1"]'),
              dirBoxes: p.querySelectorAll('[data-rep], [data-note]').length,
              submit: !!document.querySelector('[data-submit]'), speak: canSpeakFor('group'),
              text: p.textContent}}"""
    #  §576.2: A RED FIGURE WITH NO NOTE LOCKS THE PAGE (§576.1) for whoever can
    #  write that note, and the worked example's own cap6 holds one — so "its
    #  boxes live" read a correctly LOCKED page (16 boxes, 3 open), red on
    #  `main` since §576.1 went live. The company's rows and every
    #  capability's are explained first, through the same two rules Submit
    #  asks (`subjectAsked`, `needsNote`), so these claims measure the reach
    #  they are about and not the lock (§94.2: the state is made).
    EXPLAIN = """()=>{var n=0;
      ['group'].concat((GROUP.capabilities||[]).map(function(c){ return 'cap:'+c.id; }))
        .forEach(function(t){ subjectAsked(t).forEach(function(x){
          if (needsNote(x)) { x.obj.note = 'Explained for the check.'; n++; } }); });
      paint(); return n;}"""
    safe(pg, EXPLAIN, 0)
    as_(pg, "t520")
    rp = safe(pg, REPORT, {}) or {}
    ck("§520.6: the company Reporting tab is offered to a capability's owner", "report" in (rp.get("tabs") or []), rp.get("tabs"))
    #  §520.6 asserted a heading carrying the capability's NAME; §520.8 removed
    #  that heading at Islam's word (a name at the top of the page is wrong), so
    #  the claim is REWRITTEN, never loosened (§218): the section is headed in
    #  the PLURAL capability word and the owner's capability is a row on the
    #  rail — the two things a build that lost the section cannot satisfy.
    capw = safe(pg, "()=>L('capability','bu')", "") or "\u0000"
    ck("§520.6/§520.8: …and it draws the capabilities section, headed in the client's word",
       any(h.startswith(capw) for h in (rp.get("heads") or [])), rp.get("heads"))
    ck("§520.8: …with their own capability named on its rail",
       any(mine in n for n in (rp.get("railNames") or [])), rp.get("railNames"))
    ck("§520.6: …with its boxes live", (rp.get("capBoxes") or 0) > 0 and rp.get("capEnabled") == rp.get("capBoxes"),
       {"boxes": rp.get("capBoxes"), "enabled": rp.get("capEnabled")})
    #  The capability's OWN row — the one gated by holderCodeOwner (§520.6),
    #  asked of `cap:<id>` and never of the holding function, which answers
    #  no for this owner (measured: fn false, cap true).
    ck("§520.6: …the capability's own key objective takes a figure from its owner", rp.get("koBox") is True, rp.get("koBox"))
    ck("§520.6: …and ONLY theirs — one section, never the other capability",
       rp.get("caps") == 1 and "Second capability" not in (rp.get("text") or ""), rp.get("caps"))
    ck("§520.6: …and no direction's box", rp.get("dirBoxes") == 0, rp.get("dirBoxes"))
    ck("§520.6: …and no Submit, because submitting speaks for the company",
       rp.get("submit") is False and rp.get("speak") is False, {"submit": rp.get("submit"), "speak": rp.get("speak")})
    ck("§520.6: the Foundation is still offered beside it",
       "found" in ((safe(pg, OFFERED, {}) or {}).get("secs") or []))
    #  THE DIRECTION OWNER IS THE CONTROL (§113.8): the same page, their own
    #  direction's boxes and no capability section — or a build drawing every
    #  capability for every part owner passes everything above.
    as_(pg, "t517")
    rq = safe(pg, REPORT, {}) or {}
    ck("§520.6: a direction owner's Reporting page draws their direction", (rq.get("dirBoxes") or 0) > 0, rq.get("dirBoxes"))
    ck("§520.6: …and no capability section", rq.get("caps") == 0, rq.get("caps"))
    ck("§520.6: …and no Submit either", rq.get("submit") is False and rq.get("speak") is False)
    #  BOTH ENDS (§94.2): with the half eye off nobody's REPORTING moves — a
    #  capability's owner still reports on the company page (the right is the
    #  rule's, not the half eye's), and the sweep below asserts the office.
    safe(pg, "()=>{delete GROUP[SMPRules.DIR_SCOPE]; return true}")
    as_(pg, "t520")
    ro = safe(pg, REPORT, {}) or {}
    ck("§520.6: with the half eye off the owner still reaches the company Reporting tab",
       "report" in (ro.get("tabs") or []) and (ro.get("capBoxes") or 0) > 0, {"tabs": ro.get("tabs"), "boxes": ro.get("capBoxes")})
    safe(pg, "()=>{GROUP[SMPRules.DIR_SCOPE]='part'; return true}")
    #  …and with it on the office is untouched.
    as_(pg, "smo")
    o3 = safe(pg, OFFERED, {}) or {}
    secs3, reach3 = o3.get("secs") or [], o3.get("caps") or []
    ck("§520: with it on the office still sees the SWOT and the plan",
       "swot" in secs3 and "plan" in secs3, secs3)
    ck("§520: …and both capabilities", len(reach3) == 2, reach3)
    #  §520.5 BOTH ENDS (§94.2): with the half eye ON the office's own
    #  Performance still draws every capability — or a build that narrowed the
    #  section for EVERYBODY passes every assertion above.
    to = perfcaps(pg) or ""
    ck("§520.5: …and Performance draws both for the office",
       mine in to and "Second capability" in to, to[:200])
    #  §520.6 BOTH ENDS: the office's Reporting page draws BOTH capabilities,
    #  the directions AND Submit — or a build that narrowed everybody passes.
    rs = safe(pg, REPORT, {}) or {}
    ck("§520.6: …and the office's Reporting page lists both capabilities on the rail",
       rs.get("caps") == 2 and rs.get("pane") == 1 and "Second capability" in (rs.get("text") or ""),
       {"rail": rs.get("caps"), "pane": rs.get("pane")})
    ck("§520.6: …the directions", (rs.get("dirBoxes") or 0) > 0, rs.get("dirBoxes"))
    ck("§520.6: …and Submit", rs.get("submit") is True and rs.get("speak") is True, {"submit": rs.get("submit"), "speak": rs.get("speak")})
    # ── 5c. §520.7: a capability planned in PILLARS reports its measures ──
    #  Islam, with Ehab's two capabilities on screen: "how does ehab has
    #  nothing to erport while he owns 2 capabilities". §520.6 drew every
    #  capability through the PROJECTS body, so one planned in pillars printed
    #  "No Projects to report on." over rows the count was already asking for
    #  — and §520.6's own fixture made only a projects capability (§94.5).
    #  The state is MADE: the SECOND capability becomes the same owner's and
    #  plans in pillars, which is Ehab's shape exactly (two owned, one of
    #  them pillars). A pillars capability goes through `renderReport(
    #  capAsUnit(c.id), {paneOnly:true})`, the body a direction reports
    #  through (§53.5, §59), so its measures and tactics get the same boxes.
    #  §520.8 (Islam, of the first build: "the name of the cpability is
    #  wrtte n at teh top of the page which is wrong and another line sayd
    #  directions key measures and tactics which is wrong"): the two sit on
    #  ONE rail in the capability word, the selected one in ONE pane, no
    #  "Capability — name" heading and no directions rail inside the pane —
    #  so the second is reached by PRESSING its rail row, which is what a
    #  person does, and the probe takes the capability to look at.
    ck("§520.7: a pillars-format capability is made for the same owner", safe(pg, """()=>{
      var c = GROUP.capabilities.find(x=>x.id==='capZZ'); if(!c) return false;
      c.head = 't520'; c.format = 'pillars';
      c.items = [{id:'capZZ-P1', code:'', name:'Cap pillar', owner:'',
        measures:[{id:'capZZ-P1-M1', name:'Cap measure', dir:'\u2265', target:'10%', compile:'Latest'}],
        tactics:[{id:'capZZ-P1-T1', name:'Cap tactic', owner:'', q1:1, q2:1, q3:1, q4:1}]}];
      return capPlansInPillars(c) === true}""") is True)
    PILL = """(id)=>{current='group'; REPORTING='group'; currentSub='report'; paint();
      var p = document.getElementById('panel');
      var row = p.querySelector('[data-repcaprail] .ritem[data-topcap="' + id + '"]');
      if (row && !row.classList.contains('on')) { row.click(); p = document.getElementById('panel'); }
      //  THE PILLARS CAPABILITY'S OWN BOXES, by their ids — a measure's figure
      //  and a tactic's — never an unscoped count, which the first
      //  capability's objective box already satisfies (§113.8).
      var m = p.querySelector('.capbody [data-rep="capZZ-P1-M1"]');
      var t = p.querySelector('.capbody [data-rep="capZZ-P1-T1"]');
      var sec = [...p.querySelectorAll('h2')].map(e=>e.textContent.trim()).filter(h=>/Key measures and Tactics/i.test(h));
      return {caps: p.querySelectorAll('[data-repcaprail] .ritem[data-topcap]').length,
              pane: p.querySelectorAll('[data-repcaps] .capbody').length,
              on: [...p.querySelectorAll('[data-repcaprail] .ritem.on')].map(b=>b.dataset.topcap),
              heads: sec,
              capHeading: /Capability\s+\u2014/.test(p.textContent),
              innerRail: p.querySelectorAll('[data-repcaps] .capbody .rhead').length,
              noProjects: /No Projects to report on/.test(p.textContent),
              measure: !!m, measureLive: !!(m && !m.disabled),
              tactic: !!t, tacticLive: !!(t && !t.disabled),
              words: /Cap measure/.test(p.textContent) && /Cap tactic/.test(p.textContent)}}"""
    safe(pg, EXPLAIN, 0)
    as_(pg, "t520")
    rpp = safe(pg, PILL, {}, "capZZ") or {}
    ck("§520.7: the owner's Reporting page lists BOTH their capabilities on the rail", rpp.get("caps") == 2, rpp.get("caps"))
    #  §520.8 BOTH ENDS (§94.2): one section headed in the CAPABILITY word
    #  with no "Directions — …" twin, one pane, the pressed row lit and its
    #  pane drawn with no "Capability — name" heading and no rail of
    #  directions inside it.
    ck("§520.8: one section, headed in the capability word",
       len(rpp.get("heads") or []) == 1 and (rpp.get("heads") or [""])[0].startswith("Capabilities"), rpp.get("heads"))
    ck("§520.8: …no capability's name as a heading over the block", rpp.get("capHeading") is False, rpp.get("capHeading"))
    ck("§520.8: …one pane, the pressed capability lit", rpp.get("pane") == 1 and rpp.get("on") == ["capZZ"], {"pane": rpp.get("pane"), "on": rpp.get("on")})
    ck("§520.8: …and no rail of directions inside it", rpp.get("innerRail") == 0, rpp.get("innerRail"))
    ck("§520.7: …and never says a pillars capability has no projects to report on",
       rpp.get("noProjects") is False, rpp.get("noProjects"))
    ck("§520.7: …its measure and its tactic are on the page", rpp.get("words") is True, rpp.get("words"))
    ck("§520.7: …with the measure's box live for its owner", rpp.get("measureLive") is True, {"box": rpp.get("measure"), "live": rpp.get("measureLive")})
    ck("§520.7: …and the tactic's", rpp.get("tacticLive") is True, {"box": rpp.get("tactic"), "live": rpp.get("tacticLive")})
    #  A TYPED FIGURE REACHES THE STORED PLAN (§96): the box is the real bound
    #  field, so the figure is read back off GROUP, never off the screen.
    typed = safe(pg, """()=>{var p=document.getElementById('panel');
      var m = p.querySelector('.capbody [data-rep="capZZ-P1-M1"]'); if(!m) return null;
      m.focus(); m.value='7'; m.dispatchEvent(new Event('change',{bubbles:true})); m.blur();
      return GROUP.capabilities.find(x=>x.id==='capZZ').items[0].measures[0].actual}""")
    ck("§520.7: …and a typed figure reaches the stored plan", typed == "7%", typed)
    #  §576.2: 7% is in the red, so it locks the page until it is explained —
    #  explained here, before the other viewers' boxes are asked whether they
    #  are live.
    safe(pg, EXPLAIN, 0)
    #  BOTH ENDS (§94.2): a direction owner is drawn no capability section at
    #  all, and the office is drawn the same two boxes.
    as_(pg, "t517")
    rq2 = safe(pg, PILL, {}, "capZZ") or {}
    ck("§520.7: a direction owner is drawn no capability section", rq2.get("caps") == 0 and rq2.get("measure") is False, rq2)
    as_(pg, "smo")
    rs2 = safe(pg, PILL, {}, "capZZ") or {}
    ck("§520.7: …and the office is drawn the pillars capability's boxes too",
       rs2.get("caps") == 2 and rs2.get("measureLive") is True and rs2.get("tacticLive") is True and rs2.get("noProjects") is False, rs2)
    #  ── §520.10: THE BAR SAYS THEIR OWN PROGRESS ─────────────────────────
    #  Islam, adding figures as a capability owner: "the counter at the top is
    #  still counting 0" — the 42 is the COMPANY's own rows and a part's never
    #  join it (option 2 was refused: double-counting, and it widens Submit).
    #  So a part owner reads one §301 chip PER PART with its own tally,
    #  "C002 · 1 of 2 entered", and never "0 of 42 · View only". Both ends
    #  (§94.2): the office keeps the company count and Submit with no chip,
    #  and a direction owner reads their direction's chip and no capability's.
    CHIP = """()=>{current='group'; REPORTING='group'; currentSub='report'; paint();
      var r = document.querySelector('.repchrome'); if(!r) return null;
      return {chips:[...r.querySelectorAll('.rc-state')].map(e=>e.textContent.trim()),
              submit: !!r.querySelector('[data-submit]'),
              viewOnly: /View only/.test(r.textContent),
              rowsOnly: !!r.querySelector('.pill.none'),
              count: (r.textContent.match(/(\\d+) of (\\d+)/)||[]).slice(1,3)}}"""
    as_(pg, "t520")
    ch = safe(pg, CHIP) or {}
    chips = ch.get("chips") or []
    ck("§520.10: a capability owner's bar holds one chip per capability they hold",
       len(chips) == 2 and all(" · " in c for c in chips), chips)
    ck("§520.10: …each a tally of its own figures, never 'View only' or 'Your rows only'",
       all((" entered" in c or c.endswith("Done")) for c in chips) and ch.get("viewOnly") is False and ch.get("rowsOnly") is False, ch)
    ck("§520.10: …and no Submit for them", ch.get("submit") is False, ch.get("submit"))
    #  THE TALLY MOVES WITH A FIGURE (§96): the tactic's box on capZZ is still
    #  empty (only the measure was typed above), so entering it takes that
    #  capability's chip from "1 of 2 entered" to Done — read off the chrome
    #  the product draws again, never computed here.
    before = [c for c in chips if c.startswith("C")]
    moved = safe(pg, """()=>{var p=document.getElementById('panel');
      var row = p.querySelector('[data-repcaprail] .ritem[data-topcap="capZZ"]');
      if (row && !row.classList.contains('on')) { row.click(); p = document.getElementById('panel'); }
      var t = p.querySelector('.capbody [data-rep="capZZ-P1-T1"]'); if(!t) return null;
      t.focus(); t.value='50'; t.dispatchEvent(new Event('change',{bubbles:true})); t.blur(); paint();
      var r = document.querySelector('.repchrome');
      return [...r.querySelectorAll('.rc-state')].map(e=>e.textContent.trim())}""")
    ck("§520.10: …and the chip MOVES when a figure is entered", moved is not None and moved != chips and any(c.endswith("Done") for c in (moved or [])), {"before": chips, "after": moved})
    as_(pg, "t517")
    ch2 = safe(pg, CHIP) or {}
    #  THE CODE IS THE ONE THE PAGE DRAWS (§482: a company's direction reads
    #  D001…), asked of `pillarCode` rather than typed from the fixture's
    #  stored EA01 — which is how this section's first run called a correct
    #  build broken (§100.3).
    code1 = safe(pg, "()=>pillarCode(topAsUnit(), 0)")
    ck("§520.10: a direction owner reads their own direction's chip and no capability's",
       (ch2.get("chips") or []) and all(c.startswith(code1 + " · ") for c in ch2.get("chips")) and ch2.get("submit") is False, {"chips": ch2.get("chips"), "code": code1})
    as_(pg, "smo")
    ch3 = safe(pg, CHIP) or {}
    ck("§520.10: …and the office keeps the company's own count and Submit, with no chip",
       ch3.get("submit") is True and not ch3.get("chips") and len(ch3.get("count") or []) == 2, ch3)
    ck("no page errors", not errs, errs[:3])
    b.close()
print(("%d FAILED" % bad) if bad else "all good")
