import glob, sys, collections
from playwright.sync_api import sync_playwright
EXE=sorted(glob.glob("/opt/pw-browsers/chromium-*/chrome-linux/chrome"))[0]
URL="file:///home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html"
JS = r"""(root) => {
  const lum=c=>{const s=c.map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)});
    return 0.2126*s[0]+0.7152*s[1]+0.0722*s[2]};
  const parse=s=>{const m=String(s).match(/rgba?\(([^)]+)\)/);if(!m)return null;
    const p=m[1].split(',').map(x=>parseFloat(x));return{c:[p[0],p[1],p[2]],a:p.length>3?p[3]:1}};
  const over=(f,bg)=>f.c.map((v,i)=>v*f.a+bg[i]*(1-f.a));
  const stops=s=>{const o=[];const re=/rgba?\(([^)]+)\)/g;let m;
    while((m=re.exec(s))){const p=m[1].split(',').map(x=>parseFloat(x));
      if(p.length<3||(p.length>3&&p[3]<0.6))continue;o.push([p[0],p[1],p[2]])}return o};
  const bgsOf=el=>{let n=el;
    while(n&&n!==document.documentElement){const cs=getComputedStyle(n);
      const g=stops(cs.backgroundImage||'');if(g.length)return g;
      const b=parse(cs.backgroundColor);if(b&&b.a>0.6)return[b.c];n=n.parentElement}
    const rb=parse(getComputedStyle(document.body).backgroundColor);
    return[rb&&rb.a>0.6?rb.c:[255,255,255]]};
  const out=[];
  /* A MODAL AND A DECK SLIDE ARE NOT A PAGE. Both sit on top of the page
     behind, which is still in the document — so scanning `body *` for them
     counts that page's failures again under a second and a third name, and a
     check that reports one defect three times has stopped saying where the
     defect is. They pass their own root; everything that IS a page passes
     none and scans the document, exactly as before. */
  document.querySelectorAll((root||'body')+' *').forEach(el=>{
    if(el.children.length&&![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))return;
    const t=(el.textContent||'').trim();if(!t)return;
    const r=el.getBoundingClientRect();if(!r.width||!r.height)return;
    const cs=getComputedStyle(el);if(cs.visibility==='hidden'||cs.opacity==='0')return;
    const f=parse(cs.color);if(!f)return;
    let ratio=Infinity;
    bgsOf(el).forEach(bg=>{const fg=over(f,bg);const L1=lum(fg),L2=lum(bg);
      const x=(Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);if(x<ratio)ratio=x});
    const size=parseFloat(cs.fontSize),w=parseInt(cs.fontWeight)||400;
    const need=(size>=24||(size>=18.66&&w>=700))?3:4.5;
    if(ratio<need){const cls=(typeof el.className==='string'?el.className:'')||el.tagName;
      out.push({sel:cls.split(' ').slice(0,3).join('.')||el.tagName,text:t.slice(0,32),ratio:+ratio.toFixed(2),need})}
  });
  return out;
}"""
bad=collections.Counter(); samp={}; scanned=set()
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=EXE)
    for pal in ("slate","forefront"):
      for th in ("light","dark"):
        c=b.new_context(viewport={"width":1440,"height":1200}); pg=c.new_page()
        pg.goto(URL); pg.wait_for_timeout(700)
        # The per-screen palette switch went in 3.12 - the TENANT's branding
        # decides now - so the sweep selects a palette the way branding does
        # rather than through a localStorage key nothing reads any more.
        pg.evaluate("(t)=>localStorage.setItem('smp.theme',t)", th)
        pg.reload(); pg.wait_for_timeout(900)
        pg.evaluate("(p)=>THEME.setBrand({palette:p})", pal)
        pg.wait_for_timeout(400)
        tag=f"{pal}/{th}"
        WHERE=['?']
        def scan(w='?', root=None):
            WHERE[0]=w
            scanned.add(w)
            for r in pg.evaluate(JS, root):
                k=f"{tag} :: {WHERE[0]} :: {r['sel'][:26]}"; bad[k]+=1
                samp.setdefault(k, f"{r['ratio']} < {r['need']}  “{r['text']}”")
        for tab in ["Performance","Foundation","Focus","Temple","Weighting"]:
            pg.evaluate("(t)=>{var x=[...document.querySelectorAll('nav.tabs button')].find(b=>b.textContent.trim()===t);if(x)x.click()}",tab)
            pg.wait_for_timeout(400); scan("group/"+tab)
        # UNITS | FUNCTIONS IS ONE BUTTON (51.9). Both places that used to
        # reach a list did it by matching the text of a button, and the switch's
        # own text is now "UnitsFunctions" — so one of them clicked the switch
        # believing it was opening a fold, and the other matched nothing at all
        # and skipped the function pages in silence. Asked by what is LIT now,
        # and it says so rather than assuming.
        def show(want):
            for _ in range(3):
                lit = pg.eval_on_selector_all("#units .navswitch .nsw.on",
                                              "e=>e.map(x=>x.textContent.trim())")
                if not lit: return False
                if lit[0].lower().startswith(want): return True
                pg.click("#units .navswitch"); pg.wait_for_timeout(200)
            return False

        show("units")
        pg.wait_for_timeout(250)
        # The switch is a state, not a page, and carries a treatment of its own
        # (§41) — so it is scanned while it is on screen rather than assumed.
        scan("group/nav-switch")
        try:
            # A UNIT DOES NOT OPEN ON PERFORMANCE. Since 3.3 it opens on
            # Strategy > Plan, so clicking the unit and calling what appears
            # "unit/perf" measured the PLAN page twice and the Performance page
            # never — for twelve versions, silently and in the safe direction
            # (45.1's fault in a different tree). It is clicked explicitly now,
            # and the label says which page it actually scanned.
            pg.locator('#units button[data-u="mobile"]').click(); pg.wait_for_timeout(500)
            scan("unit/landing")
            pg.evaluate("()=>{var x=[...document.querySelectorAll('nav.tabs button')].find(b=>b.textContent.trim()==='Performance');if(x)x.click()}")
            pg.wait_for_timeout(600); scan("unit/perf")
            pg.evaluate("()=>{var x=[...document.querySelectorAll('nav.tabs button')].find(b=>b.textContent.indexOf('Strategy')>-1);if(x)x.click()}")
            pg.wait_for_timeout(500); scan("unit/strategy")
            # "Who enters" is hidden until the tenant switches naming on (spec
            # 008 3B), and the PICKER is a state rather than a page - the same
            # 41.5 lesson the open fold taught. Both are opened explicitly.
            pg.evaluate("()=>{ GROUP.naming = true; paint(); }")
            pg.wait_for_timeout(300)
            pg.evaluate("()=>{var x=[...document.querySelectorAll('#secrow-in button')].find(b=>b.textContent.trim()==='Who enters');if(x)x.click()}")
            pg.wait_for_timeout(500); scan("unit/who-enters")
            pg.evaluate("()=>{var x=document.querySelector('[data-name-open]');if(x)x.click()}")
            pg.wait_for_timeout(400); scan("unit/who-enters-picker")
            pg.evaluate("()=>{var x=document.querySelector('[data-pick-cancel]');if(x)x.click(); GROUP.naming=false; paint();}")
            pg.wait_for_timeout(300)
            # PICTURE SLIDES (50). Two states, neither of them a page: the
            # editor is a modal and the slide only exists inside the deck. The
            # same 41.5 lesson as the open fold and the naming picker - a state
            # nothing navigates to is a state nothing measures - so both are
            # opened on purpose, with a picture already in place so the crop
            # controls and the caption exist to be measured at all.
            pg.evaluate('''() => {
              var u = UNIT_KEYS[0];
              REVIEW.slides = {}; REVIEW.slides[u] = [{ id:"sweep", layout:2,
                title:"Site visit \u2014 the new fit-out", at:"cover",
                pics:[{ src:"data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
                        cap:"Mall of Egypt, opened 12 June", z:1.4, x:40, y:60 }] }];
              paint(); }''')
            pg.wait_for_timeout(300)
            pg.evaluate("()=>{var x=[...document.querySelectorAll('nav.tabs button')].find(b=>b.textContent.trim()==='Performance');if(x)x.click()}")
            pg.wait_for_timeout(400)
            pg.evaluate("()=>{var x=document.querySelector('[data-picedit]');if(x)x.click()}")
            # MANAGE SLIDES IS A MODE, NOT A MODAL, since 51.8 — so it is
            # scanned at its own root and closed by its own Done. Closing it
            # with the dialog's X did nothing, and the still-open overlay then
            # swallowed every later click: the FIRST thing this sweep did after
            # its own loud failure was point at the line that caused it, which
            # is the whole reason it was made to fail loudly.
            pg.wait_for_timeout(600); scan("unit/manage-slides", "#slideroot")
            pg.click("#slideroot [data-slexit]")
            pg.wait_for_timeout(400)
            pg.evaluate("()=>{var x=document.querySelector('[data-present]');if(x)x.click()}")
            pg.wait_for_timeout(800)
            pg.evaluate('''() => {
              var ss=[...document.querySelectorAll('#deckroot .dslide')];
              var i=ss.findIndex(s=>s.classList.contains('d-pics'));
              if(i>-1) deckShow(i); }''')
            pg.wait_for_timeout(400); scan("deck/picture-slide", ".dslide.d-pics")
            pg.evaluate("()=>{closeDeck(); delete REVIEW.slides; paint();}")
            pg.wait_for_timeout(300)
        except Exception as e: print("   (picture sweep skipped: %s)" % e)
        # A SUPPORTING FUNCTION IS HALF THE PRODUCT AND WAS NEVER SWEPT (51.5).
        # The walk covered the group, one unit and Setup; every function page —
        # Performance, Report, Foundation, Projects — had gone twelve versions
        # unmeasured, which is how a capability band on a navy ground kept the
        # page's own light-mode ink at 1.43:1. 41.5 again: a page nothing
        # navigates to is a page nothing measures.
        try:
            if not show("functions"): raise Exception("the nav switch would not show functions")
            pg.wait_for_timeout(250)
            pg.click('#units button[data-u="fn:finance"]'); pg.wait_for_timeout(500)
            for t in ["Performance", "Strategy"]:
                pg.evaluate("(t)=>{var x=[...document.querySelectorAll('nav.tabs button')].find(b=>b.textContent.trim()===t); if(x)x.click()}", t)
                pg.wait_for_timeout(500); scan("fn/" + t.lower())
                # ...and every section inside it, for the same reason.
                for k2 in pg.eval_on_selector_all("#secrow-in button",
                                                  "els=>els.map(e=>e.textContent.trim())"):
                    pg.evaluate("(k)=>{var x=[...document.querySelectorAll('#secrow-in button')].find(b=>b.textContent.trim()===k); if(x)x.click()}", k2)
                    pg.wait_for_timeout(450); scan("fn/" + t.lower() + "/" + k2.lower())
            show("units")
            pg.wait_for_timeout(250)
        except Exception as e: print("   (function sweep skipped: %s)" % e)

        # "Figures I report" is hidden for anybody named on nothing (16.7), so
        # without this the menu entry does not exist and the sweep walks past
        # it - 41.5's lesson: a page that cannot be reached by navigating is a
        # page nothing measures. One figure is sourced to the viewer and left
        # outstanding, so the unit's waiting note gets measured too.
        pg.evaluate("() => { var u = UNITS[UNIT_KEYS[0]];"
                    "  GROUP.sets = [{ id:'sweep', name:'Swept Figures',"
                    "                  team: FUNCTION_KEYS[0], owner: viewer().key, pick:'owner' }];"
                    "  if (u.keyObjectives[0]) {"
                    "    u.keyObjectives[0].src = { set: 'sweep' };"
                    "    u.keyObjectives[0].actual = null; }"
                    "  paint(); }")
        pg.wait_for_timeout(300)
        # THE BU LIST HAS TO HAVE ROWS IN IT (54.1). Empty it renders one note
        # and a header, so the sweep would walk the page, find nothing to
        # measure and report it clean - the shape of failure 45.2 records
        # against the figure sets. Two rows: one mapped, one not, which is both
        # states the "Points at" cell has. And one person is given a Main BU
        # that disagrees with where they sit, because the drift note in the
        # register's BU cell is quiet ink on a table row and cannot be reached
        # by navigating to it.
        pg.evaluate("() => {"
                    "  GROUP.mainbus = [{ name:'Distribution', at:'co:'+COMPANY_KEYS[0] },"
                    "                   { name:'Risk', at:null }];"
                    "  PEOPLE[2].mainbu = 'Distribution';"
                    "  PEOPLE[3].mainbu = 'Risk';"
                    "  PEOPLE[4].mainbu = 'Not on the list';"
                    "  paint(); }")
        pg.wait_for_timeout(300)
        # SETUP IS ONE DESTINATION AND A RAIL (46.1, merged with Manage in 47.7).
        # The gear used to open a menu of sixteen; it goes straight to the page
        # now, and every one of those sixteen is a rail row. Walking the rail is
        # also the only way its groups and its selected row get measured at all.
        try:
            pg.click('#units [data-md="setup"]'); pg.wait_for_timeout(500)
        except Exception: pass
        # Every group open, or a folded one hides its rows from the sweep -
        # 41.5: a state that cannot be reached by navigating is a state nothing
        # measures.
        for g in pg.eval_on_selector_all(".setuprail .rgroup.shut",
                                         "els=>els.map(e=>e.dataset.railgrp)"):
            try:
                pg.click(f'.setuprail [data-railgrp="{g}"]'); pg.wait_for_timeout(200)
            except Exception: pass
        for key in pg.eval_on_selector_all(".setuprail [data-setupgo]",
                                           "els=>els.map(e=>e.dataset.setupgo)"):
            try:
                pg.click(f'.setuprail [data-setupgo="{key}"]'); pg.wait_for_timeout(420)
                scan("setup/"+key)
                # A Setup page with SECTIONS keeps them inside its own pane, and
                # a section nobody clicks is a page nothing measures (41.5).
                for k2 in pg.eval_on_selector_all(".setuppane .secrow [data-sub2]",
                                                  "els=>els.map(e=>e.dataset.sub2)"):
                    pg.click(f'.setuppane .secrow [data-sub2="{k2}"]'); pg.wait_for_timeout(420)
                    scan("setup/"+key+"/"+k2)
            except Exception: pass
        c.close()
    b.close()
# COUNTED, NOT TYPED (51.11). The number was a literal and went stale the
# first time a page was added - a label that names a page count it never
# measured is the same lie as a label naming a page it never scanned.
print(f"{sum(bad.values())} failing runs across 4 combinations x {len(scanned)} pages and states\n")
for k,n in bad.most_common(24):
    print(f"  {n:4}x  {k}\n           {samp[k]}")
