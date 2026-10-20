"""A direction's own deck, the company's short review, and who presents
what (§481).

Islam, on the round-2 mockup (design-mockups/direction-decks/): one short
company flow — the foundation, the analysis, the directions & capabilities,
then their performance; NO Present per direction in the menu; the Master
presentation arranges directions, capabilities and functions with the company
last; a direction's owner presses Present and sees only their own slides, and
may add picture slides to their direction.

It MAKES its state (§255) — the worked example plans on its business units —
and asserts BOTH ENDS (§94.2): the owner gets their direction and not the one
beside it, somebody who owns nothing gets no menu, and with the units ON the
group's deck is the full deck it always was. SMP_BUILT points it at another
build (§276).
"""
import os
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or os.path.join(os.path.dirname(__file__), "..", "strategy-management-platform.html")
bad = 0
def ck(name, ok, detail=""):
    global bad
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok else "  — " + str(detail)))
    if not ok: bad += 1
def safe(pg, js, dflt=None):
    try: return pg.evaluate(js)
    except Exception as e: return dflt

MAKE = """()=>{
  GROUP.structure = {bu:{exists:false}, top:{on:SMPRules.STRUCT_COMPONENTS.slice(), temple:true}};
  GROUP.swot = {s:['Brand'], w:['Cost'], o:['Exports'], t:['FX']};
  GROUP.items = [
    {id:'group-P1', code:'EA01', name:'Direction one', sub:'', kind:'', theme:'', owner:'Hazem Roushdy', custodian:'Hossam Farid',
     measures:[{id:'group-P1-M1', name:'Revenue', dir:'\\u2265', target:'100 M EGP', compile:'Sum', actual:''}], tactics:[]},
    {id:'group-P2', code:'EA02', name:'Direction two', sub:'', kind:'', theme:'', owner:'Somebody Else',
     measures:[{id:'group-P2-M1', name:'Share', dir:'\\u2265', target:'10%', compile:'Latest', actual:''}], tactics:[]}];
  paint(); return true}"""

HEADS = """(t)=>{var d=document.createElement('div'); d.innerHTML=deckHtmlFor(t);
  return [...d.querySelectorAll('.dslide')].map(s=>((s.querySelector('h1,h2')||{}).textContent||'').trim())}"""

def menu(pg):
    safe(pg, "()=>{current='group'; currentSub='performance'; paint(); return true}"); pg.wait_for_timeout(300)
    return safe(pg, """()=>{var m=[...document.querySelectorAll('.dlmenu')].find(x=>x.querySelector('[data-present],[data-deckpdf],[data-master]')); if(!m) return null;
      return [...m.querySelectorAll('[role=menuitem]')].map(b=>({t:b.childNodes[0].textContent.trim(),
        present:b.dataset.present||null, pdf:b.dataset.deckpdf||null, pic:b.dataset.pickey||null, master:!!b.dataset.master}))}""")

def as_(pg, key):
    safe(pg, "()=>{switchViewer('%s'); return true}" % key); pg.wait_for_timeout(400)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(800)

    # ── 0. The control: with the units ON the group deck is the full deck ─
    ck("units on: the company review is not on", safe(pg, "()=>companyReviewOn()") is False)
    ck("units on: the company carries no presentation menu of its own", menu(pg) is None, menu(pg))

    ck("the state is made", safe(pg, MAKE) is True)
    ck("units off: the company review is on", safe(pg, "()=>companyReviewOn()") is True)

    # ── 1. The company review is one short flow ───────────────────────
    heads = safe(pg, "()=>(%s)('group')" % HEADS, []) or []
    order = ["Foundation", "Analysis", "where we stand", "stands", "Thank you"]
    pos = [next((i for i, h in enumerate(heads) if k in h), -1) for k in order]
    ck("the review runs foundation, analysis, directions, performance, thank you",
       all(x >= 0 for x in pos) and pos == sorted(pos), heads)
    # REVERSED, BECAUSE THE RULE WAS (§218, §553.9). It read "…and it is
    # short — no per-direction measure slides", which is what §481 built and
    # what Islam undid once he saw Raya's Mobile beside it: *"yes I want
    # elabd as a unit"*. A unit's deck draws every pillar's own slides, and
    # the company's now does the same.
    #
    # ASSERTED AS SAMENESS, NOT AS PRESENCE (§53.5). "There is a measures
    # slide" would pass on a second copy of the markup, which is the drift
    # this whole stage exists to remove. What is asserted is that the slides
    # the company's review draws for a direction ARE the slides that
    # direction's own owner presents — the same builder, the same anchors.
    mine = safe(pg, """()=>{
      var d = document.createElement('div'); d.innerHTML = deckHtmlFor('dir:group-P1');
      var own = [...d.querySelectorAll('.dslide')].map(s=>s.dataset.anchor||'')
        .filter(a => a && a !== 'cover' && a !== 'end' && a !== 'stand');
      var c = document.createElement('div'); c.innerHTML = deckHtmlFor('group');
      var co = [...c.querySelectorAll('.dslide')].map(s=>s.dataset.anchor||'');
      return {own: own, missing: own.filter(a => co.indexOf(a) < 0)};
    }""")
    ck("…and it carries each direction's own slides, from the same builder (§553.9)",
       isinstance(mine, dict) and len(mine.get("own") or []) > 0
       and mine.get("missing") == [], mine)
    # AND IT GROWS BY EXACTLY THOSE SLIDES (§218, §553.9). This line has
    # now been three claims, because the rule behind it moved twice. It was
    # "seven slides at most for any number of directions" — a number
    # somebody had to maintain. §553.6 made it the property that number was
    # a proxy for: the review does not GROW with the plan, because each
    # direction presents its own deck (§481). §553.9 is Islam undoing that
    # premise — the company's review now carries every direction, so it
    # grows, and the claim is HOW MUCH.
    #
    # Still MADE rather than read (§255), and still the stronger form: a
    # build that drew a direction twice, or dropped one, fails it, where
    # "it grows" would pass.
    grew = safe(pg, """()=>{
      var before = GROUP.items.slice();
      var count = function(){ var d=document.createElement('div');
        d.innerHTML = deckHtmlFor('group');
        return d.querySelectorAll('.dslide').length; };
      var n0 = count(), added = 0;
      var proto = JSON.parse(JSON.stringify(GROUP.items[0]));
      var u = topAsUnit();
      for (var i = 0; i < 8; i++) {
        var c = JSON.parse(JSON.stringify(proto));
        c.id = 'group-X' + i; c.code = 'EX0' + i; c.name = 'Extra ' + i;
        c.measures = (c.measures||[]).map(function(m, j){
          return Object.assign({}, m, {id: c.id + '-M' + j}); });
        GROUP.items.push(c);
      }
      paint();
      /* what the eight added pillars cost, asked of the builder itself */
      u = topAsUnit();
      GROUP.items.forEach(function(p, i){
        if (String(p.id).indexOf('group-X') === 0) {
          var d = document.createElement('div');
          d.innerHTML = pillarSlidesOf(u, p, i).join("");
          added += d.querySelectorAll('.dslide').length;
        }
      });
      var n1 = count();
      GROUP.items = before; paint();
      return {two: n0, ten: n1, added: added, back: count()};
    }""")
    ck("…and it grows by exactly what those directions' own slides cost (§553.9)",
       isinstance(grew, dict) and grew.get("added", 0) > 0
       and grew.get("ten") == grew.get("two", 0) + grew.get("added", 0)
       and grew.get("back") == grew.get("two"), grew)

    # ── 2. A direction's own deck ─────────────────────────────────────
    d1 = safe(pg, "()=>(%s)('dir:group-P1')" % HEADS, []) or []
    ck("a direction's deck opens on its own cover and ends on Thank you",
       d1[:1] == ["Direction one"] and d1[-1:] == ["Thank you"], d1)
    ck("…and carries that direction's slides and no other", any("Key measures" in h for h in d1) and not any("Direction two" in h for h in d1), d1)
    who = safe(pg, "()=>{var d=document.createElement('div');d.innerHTML=deckHtmlFor('dir:group-P1');var e=d.querySelector('.dwho');return e?e.textContent:''}")
    ck("…its cover names who presents it", "Hazem Roushdy" in (who or "") and "Hossam Farid" in (who or ""), who)

    # ── 2b. The cover is the only slide that introduces it (§553.4) ───
    # Islam: "the cover page is enough let's remove the 2nd page as the
    # performance appear at the last slide anyway". The title page is drawn
    # by the builder a direction's deck SHARES with the full plan deck, so
    # this asserts the half that is this deck's: it has no title page, and
    # the cover carries what that page carried. The other half — the full
    # plan deck still opening each pillar on its title page — is asserted in
    # `deck-figures`, which runs with the units on and reads the readings
    # off that very slide.
    anchs = safe(pg, """()=>{var d=document.createElement('div');
      d.innerHTML=deckHtmlFor('dir:group-P1');
      return [...d.querySelectorAll('[data-anchor]')].map(e=>e.dataset.anchor)}""", []) or []
    ck("a direction's own deck has no title page of its own (§553.4)",
       len(anchs) > 0 and not [a for a in anchs if a.startswith("p") and a.endswith("d")], anchs)
    # AND NOTHING THAT PAGE CARRIED IS LOST (§96.2). The state is MADE
    # (§255): the live clients set neither a theme nor a subtitle, so read
    # against them this would pass on a cover that dropped both.
    safe(pg, """()=>{var p=GROUP.items.filter(x=>x.id==='group-P1')[0];
      p.theme='Customer first'; p.sub='Stores we already have'; paint(); return true}""")
    cov = safe(pg, """()=>{var d=document.createElement('div');
      d.innerHTML=deckHtmlFor('dir:group-P1');
      var s=d.querySelector('.dslide'); return s?s.textContent.replace(/\s+/g,' '):''}""", "")
    ck("…and the cover carries the theme and the subtitle the title page had",
       "Customer first" in (cov or "") and "Stores we already have" in (cov or ""), cov)
    safe(pg, """()=>{var p=GROUP.items.filter(x=>x.id==='group-P1')[0];
      p.theme=''; p.sub=''; paint(); return true}""")

    # ── 2c. The review follows the running order (§553.10) ───────────
    # Islam: *"the company picker should pick the foundation of the company
    # then I pick the directions arrangement and then the capabilities
    # arranged. and the grouped directions comes before the directions
    # automatically and the capability grouped comes before the capabilities
    # automatically"*.
    #
    # IT MAKES ITS STATE (§255): the worked fixture has two directions and no
    # capability, so the split review this claim is about does not exist
    # until the check builds it. BOTH ENDS (§94.2): a stored order is
    # followed, the kind whose member leads becomes the first group, and
    # CLEARING it puts the plan's own order back — a default that is an
    # absence (§50.6) is only a default if removing the record restores it.
    ord_ = safe(pg, r"""()=>{
      var keepS = JSON.stringify(GROUP.structure), keepI = JSON.stringify(GROUP.items);
      GROUP.structure.top.plan = {split: true};
      GROUP.items[1].kind = SMPRules.PILLAR_CAP;
      paint();
      /* THE CLIENT'S OWN WORDS, never the English ones (§395). The worked
         fixture calls a pillar a "Pillar", so a filter looking for
         "Direction" found only the capabilities' group and reported a
         correct build as one that had lost a slide. */
      var W = {dir: L('pillar','bu'), cap: L('capability','bu')};
      var read = function(){
        var d = document.createElement('div'); d.innerHTML = deckHtmlFor('group');
        return [...d.querySelectorAll('.dslide')]
          .map(s => ((s.querySelector('h1,h2')||{}).textContent||'').replace(/\s+/g,' ').trim())
          .filter(h => h === W.dir || h === W.cap);
      };
      var natural = read();
      GROUP[SMPRules.MASTER_FLOW] = ['dir:group-P2', 'dir:group-P1']; paint();
      var flipped = read();
      delete GROUP[SMPRules.MASTER_FLOW]; paint();
      var back = read();
      GROUP.structure = JSON.parse(keepS); GROUP.items = JSON.parse(keepI); paint();
      return {natural: natural, flipped: flipped, back: back, words: W};
    }""")
    ck("the company's review leads with the group the plan leads with (§553.10)",
       isinstance(ord_, dict) and (ord_.get("natural") or [""])[0] == (ord_.get("words") or {}).get("dir"),
       ord_)
    ck("…and the running order moves the capability's group in front of it",
       isinstance(ord_, dict) and (ord_.get("flipped") or [""])[0] == (ord_.get("words") or {}).get("cap"),
       ord_)
    ck("…and clearing the order puts the plan's own back (§50.6)",
       isinstance(ord_, dict) and ord_.get("back") == ord_.get("natural"), ord_)

    # ── 3. The master flow: directions, capabilities, functions, company last
    # ASKED OF THE ORDER, NOT THE CATALOGUE (§218). It read `masterSubjects()`,
    # which is everything that can be PLACED — and since §553 that list opens
    # with the company's Foundation and Analysis, so the claim failed while
    # the running order it was making was unchanged. `masterOrder()` is what
    # a client with no stored choice actually presents, which is the rule.
    ms = safe(pg, "()=>masterOrder()", []) or []
    ck("the master flow leads with the directions and ends on the company",
       ms[:2] == ["dir:group-P1", "dir:group-P2"] and ms[-1:] == ["group"], ms)
    # AND THE CATALOGUE IS THE WIDER ONE, asserted here rather than left as
    # the thing that quietly broke the claim above (§553): the two company
    # sections can be placed, and they are not in the order until somebody
    # places them.
    subs = safe(pg, "()=>masterSubjects()", []) or []
    ck("…the company's Foundation and Analysis can be placed, and are not placed yet (§553)",
       subs[:2] == ["sec:found", "sec:swot"]
       and not [t for t in ms if t.startswith("sec:")], [subs[:3], ms[:3]])
    kinds = safe(pg, "()=>masterOrder().map(t=>masterKind(t).replace(/<[^>]+>/g,''))", []) or []
    ck("…each kind named in the picker", "DIR" in kinds and kinds[-1] == "CO", kinds)

    # ── 3b. The flow is one presentation (§554.1) ────────────────────
    # Islam, having played it: *"we need a cover slide for the whole
    # presentation as we are presenting elabd q3 strategy review and before
    # the directions I find the grouped directions and same for the
    # capabilities"*.
    #
    # BOTH ENDS (§94.2): the parts are in the list, in front of the right
    # subjects — and they DRAW, because a target the deck cannot build is a
    # gap in the flow, not a slide. The state is MADE: the fixture has no
    # capability until the check writes one (§255).
    fl = safe(pg, r"""()=>{
      var keepS = JSON.stringify(GROUP.structure), keepI = JSON.stringify(GROUP.items);
      GROUP.structure.top.plan = {split: true};
      GROUP.items[1].kind = SMPRules.PILLAR_CAP;
      paint();
      var list = flowWithParts(masterOrder());
      var drew = {};
      list.filter(t => t.indexOf('flow:') === 0).forEach(function(t){
        var d = document.createElement('div'); d.innerHTML = deckHtmlFor(t);
        var s = d.querySelector('.dslide');
        drew[t] = s ? ((s.querySelector('h1,h2')||{}).textContent||'').replace(/\s+/g,' ').trim() : "";
      });
      /* and with nobody of that kind in the flow, no page for it (§45.2) */
      var thin = flowWithParts(['dir:group-P1']);
      /* §554.2: and what the picker CALLS them. A capability of the
         company's is presented as `dir:<id>` exactly as a direction is, so
         the Kind column read DIR for every one of them. The worked
         fixture's own capability is the only place this is reachable —
         the demo client has units, so its picker holds no `dir:` row at
         all, which is why `master-picker` cannot see this. */
      var kinds = {};
      list.filter(t => t.indexOf('dir:') === 0).forEach(function(t){
        kinds[t] = masterKindWord(t);
      });
      /* READ BEFORE THE PUT-BACK. The first draft asked after it, and got
         the fixture's own two directions back — a correct build reported
         as calling a capability a direction. */
      GROUP.structure = JSON.parse(keepS); GROUP.items = JSON.parse(keepI); paint();
      return {list: list, drew: drew, thin: thin, kinds: kinds,
              words: {dir: L('pillar','bu'), cap: L('capability','bu')}};
    }""")
    L_ = (fl or {}).get("list") or []
    W_ = (fl or {}).get("words") or {}
    ck("the flow opens on a cover of its own (§554.1)",
       L_[:1] == ["flow:cover"], L_[:4])
    ck("…with each group's page in front of the first of its members",
       len(L_) > 2 and L_[1].startswith("flow:g")
       and L_[2].startswith("dir:")
       and any(x.startswith("flow:g") for x in L_[3:]), L_[:6])
    ck("…and all three draw a slide, titled as the deck titles them",
       isinstance(fl, dict)
       and (fl.get("drew") or {}).get("flow:cover")
       and sorted(x for x in (fl.get("drew") or {}).values() if x)[:0] == []
       and set(v for k, v in (fl.get("drew") or {}).items() if k != "flow:cover")
           == set([W_.get("dir"), W_.get("cap")]),
       (fl or {}).get("drew"))
    K_ = (fl or {}).get("kinds") or {}
    ck("…and the picker calls a capability a capability, not a direction (§554.2)",
       K_.get("dir:group-P1") == "DIR" and K_.get("dir:group-P2") == "CAP", K_)
    ck("…and a group with nobody in the flow gets no page (§45.2)",
       [x for x in ((fl or {}).get("thin") or []) if x.startswith("flow:g")] ==
       [x for x in L_[1:2] if x.startswith("flow:g")]
       and len([x for x in ((fl or {}).get("thin") or []) if x.startswith("flow:g")]) == 1,
       (fl or {}).get("thin"))

    # ── 4. The office's menu ──────────────────────────────────────────
    m = menu(pg) or []
    # REWRITTEN TO THE NEW RULE (218, 556). "Present the whole company"
    # opened the company's review straight onto the projector, beside a
    # flow that already carries the company last. Islam had it removed:
    # the Master presentation is the one way in, and it is FIRST.
    ck("the office is offered the Master presentation, first and alone",
       bool(m) and m[0].get("master") is True
       and not any(x["present"] == "group" for x in m), m)
    ck("…and no Present per direction", not any((x["present"] or "").startswith("dir:") for x in m), m)
    ck("…and keeps the Master presentation", any(x["master"] for x in m), m)

    # ── 5. The owner's menu: their slides only, no names ──────────────
    key = safe(pg, "()=>(PEOPLE.find(p=>p.name==='Hazem Roushdy')||{}).key")
    as_(pg, key)
    m = menu(pg) or []
    ck("the owner's Present opens their direction only", any(x["t"] == "Present" and x["present"] == "dir:group-P1" for x in m), m)
    ck("…the PDF is the same deck", any(x["pdf"] == "dir:group-P1" for x in m), m)
    # AND NO MANAGE SLIDES BESIDE IT (218, 556.1). Present opens the
    # editor now, so a second entry onto the same screen is a second
    # control for one act. Islam: "why do we still have manage slides?"
    ck("...and no Manage slides beside it, because Present is it",
       not any(x["pic"] for x in m), m)
    ck("…and nothing of the company's", not any(x["present"] == "group" or x["master"] for x in m), m)
    ck("canSpeakFor: their direction yes", safe(pg, "()=>canSpeakFor('dir:group-P1')") is True)
    ck("canSpeakFor: the direction beside it no", safe(pg, "()=>canSpeakFor('dir:group-P2')") is False)

    # ── 6. Somebody who owns no direction gets no menu ────────────────
    other = safe(pg, "()=>(PEOPLE.find(p=>p.key && !SMPRules.mayReportTop(world(), p) && !SMPRules.ownsTopPillar(world(), p))||{}).key")
    as_(pg, other)
    ck("somebody who owns no direction gets no Presentation menu", menu(pg) is None, (other, menu(pg)))

    # ── 7. The owner's slide reaches the deck ─────────────────────────
    as_(pg, key)
    put = safe(pg, """()=>{REVIEW.slides=Object.assign({},REVIEW.slides);
      REVIEW.slides['dir:group-P1']=[{id:'s1',title:'Site visit',at:'end',layout:'1',pics:[{src:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='}]}];
      var d=document.createElement('div'); d.innerHTML=deckBuild('dir:group-P1');
      return [...d.querySelectorAll('.dslide')].map(s=>((s.querySelector('h1,h2')||{}).textContent||'').trim())}""", []) or []
    ck("a picture slide added to the direction is in its deck", "Site visit" in put, put)

    ck("no page errors", not errs, errs[:3])
    b.close()
print(("%d FAILED" % bad) if bad else "all good")
