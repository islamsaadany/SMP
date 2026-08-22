import glob, sys, collections
from playwright.sync_api import sync_playwright
EXE=sorted(glob.glob("/opt/pw-browsers/chromium-*/chrome-linux/chrome"))[0]
URL="file:///home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html"
JS = r"""() => {
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
  document.querySelectorAll('body *').forEach(el=>{
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
bad=collections.Counter(); samp={}
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
        def scan(w='?'):
            WHERE[0]=w
            for r in pg.evaluate(JS):
                k=f"{tag} :: {WHERE[0]} :: {r['sel'][:26]}"; bad[k]+=1
                samp.setdefault(k, f"{r['ratio']} < {r['need']}  “{r['text']}”")
        for tab in ["Performance","Foundation","Focus","Temple","Weighting"]:
            pg.evaluate("(t)=>{var x=[...document.querySelectorAll('nav.tabs button')].find(b=>b.textContent.trim()===t);if(x)x.click()}",tab)
            pg.wait_for_timeout(400); scan("group/"+tab)
        pg.evaluate("()=>{var f=[...document.querySelectorAll('#units button')].find(b=>b.textContent.trim().indexOf('Units')===0);if(f)f.click()}")
        pg.wait_for_timeout(250)
        # The OPEN fold is a state, not a page — it has to be scanned while it is
        # open or the treatment it carries is never measured (§41).
        scan("group/units-fold-open")
        try:
            pg.locator('#units button[data-u="mobile"]').click(); pg.wait_for_timeout(500); scan("unit/perf")
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
        except Exception: pass
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
print(f"{sum(bad.values())} failing runs across 4 combinations x 25 pages and states\n")
for k,n in bad.most_common(24):
    print(f"  {n:4}x  {k}\n           {samp[k]}")
