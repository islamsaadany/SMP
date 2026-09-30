# Mockup shots for spec: the top layer's own plan + a Capabilities card.
# Drives the REAL built platform and rewrites the DOM to show the proposal.
# Not a check; lives beside the mockup it makes.
import pathlib
from playwright.sync_api import sync_playwright
FILE = pathlib.Path("/home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html")
OUT = pathlib.Path(__file__).parent / "shots"
INIT = "try{sessionStorage.setItem('smp.welcome.done','1');sessionStorage.setItem('smp.welcome.seen','1');sessionStorage.setItem('smp.tour.later','1');localStorage.setItem('smp.tour.never','1')}catch(e){}"

AS_TOP = r"""([sel, rename]) => {
  // show a unit page as if it were the top layer's own page
  document.querySelector('#topsel > summary').setAttribute('aria-selected','true');
  document.querySelectorAll('#units [role=tab][data-u]').forEach(b=>b.setAttribute('aria-selected','false'));
  const t = document.getElementById('subtabs');
  const mk = (s, txt, cls) => '<button role="tab" data-s="'+s+'"'+(cls?' class="'+cls+'"':'')+' aria-selected="'+(s===sel)+'">'+txt+'</button>';
  t.innerHTML = mk('strategy','Strategy') + mk('performance','Performance','primary') + mk('focus','Focus') + mk('temple','Temple') + mk('weighting','Weighting')
    + '<button role="tab" data-s="report" class="cta dot" aria-selected="'+('report'===sel)+'">Reporting<i class="tabdot" aria-hidden="true"></i></button>';
  const d = document.querySelector('[data-sub2=drivers]'); if (d) d.remove();
  const walk = n => { if (n.nodeType===3) { n.nodeValue = n.nodeValue.replace(/Mobile/g,'Group').replace(/\bMB0/g,'GR0'); } else n.childNodes.forEach(walk); };
  if (rename) { walk(document.getElementById('panel')); document.querySelectorAll('#panel span, #panel div').forEach(e=>{ if (e.children.length===0 && e.textContent.trim()==='Capability') e.remove(); }); }
}"""

def page(p):
    pg = p.new_page(viewport={"width": 1500, "height": 950})
    pg.add_init_script(INIT)
    pg.goto("file://" + str(FILE)); pg.wait_for_timeout(1500)
    return pg

def go_top(pg):
    pg.click("#topsel > summary"); pg.wait_for_timeout(200)
    pg.click('#topsel [data-u="group"]'); pg.wait_for_timeout(600)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
    # 1. Performance today / proposed
    pg = page(b); go_top(pg)
    pg.screenshot(path=str(OUT/"perf-today.png"), clip={"x":0,"y":0,"width":1500,"height":570})
    pg.evaluate(AS_TOP, ["performance", False])
    pg.evaluate(r"""() => {
      const cards = [...document.querySelectorAll('#panel .card, #panel [class*=card]')].filter(c=>/^\s*group key objectives/i.test(c.textContent)&&c.offsetHeight>150&&c.offsetHeight<300);
      const c1 = cards[cards.length-1]; const grid = c1.parentElement;
      const nc = c1.cloneNode(true);
      const walk = n => { if (n.nodeType===3) n.nodeValue = n.nodeValue
          .replace(/Group key objectives/i,'GROUP PILLARS — OWN PLAN').replace(/GROUP KEY OBJECTIVES/,'GROUP PILLARS — OWN PLAN')
          .replace(/^82$/,'74')
          .replace(/The group.s own/,'The group’s own').replace(/6 objectives, each scored against its target\./,'4 pillars — their key measures and tactics, reported by the SMO team. Not mixed into the units’ score.');
        else n.childNodes.forEach(walk); };
      walk(nc);
      const para=[...nc.querySelectorAll('p,div')].filter(x=>/each scored against/.test(x.textContent)).pop();
      if (para) para.innerHTML='The group’s own <b>4</b> pillars — their key measures and tactics, reported by the SMO team. Kept apart from the units’ score.';
      [...nc.querySelectorAll('*')].filter(x=>x.children.length===0&&/^primary$/i.test(x.textContent.trim())).forEach(x=>x.remove());
      const bar = nc.querySelector('[style*=width]'); if (bar) bar.style.width='74%';
      const pr = [...nc.querySelectorAll('span,em,small')].find(x=>x.textContent.trim()==='PRIMARY'||x.textContent.trim()==='Primary'); if (pr) pr.remove();
      nc.style.outline='3px solid #C9A227'; nc.style.outlineOffset='3px';
      c1.after(nc);
      grid.style.gridTemplateColumns='repeat(4,minmax(0,1fr))';
    }""")
    pg.wait_for_timeout(200)
    pg.screenshot(path=str(OUT/"perf-proposed.png"), clip={"x":0,"y":0,"width":1500,"height":600})
    pg.close()
    # 2-4. Strategy SWOT / Plan / Reporting as the top layer
    for sub, name in (("swot","swot"),("plan","plan")):
        pg = page(b); pg.click('#units [data-u="mobile"]'); pg.wait_for_timeout(500)
        pg.click('[data-sub2=%s]' % sub); pg.wait_for_timeout(500)
        pg.evaluate(AS_TOP, ["strategy", True])
        pg.wait_for_timeout(200)
        pg.screenshot(path=str(OUT/("top-%s.png" % name)))
        pg.close()
    pg = page(b); pg.click('#units [data-u="mobile"]'); pg.wait_for_timeout(500)
    pg.click('[data-s=report]'); pg.wait_for_timeout(700)
    pg.evaluate(AS_TOP, ["report", True])
    pg.wait_for_timeout(200)
    pg.screenshot(path=str(OUT/"top-report.png"))
    pg.close()
    # 5. cycle board with a top layer row
    pg = page(b); pg.click('[data-md=setup]'); pg.wait_for_timeout(400)
    pg.click('[data-setupgo=cycle]'); pg.wait_for_timeout(600)
    pg.evaluate(r"""() => {
      const tb = [...document.querySelectorAll('#panel table')].find(t=>/Business unit/.test(t.tHead&&t.tHead.textContent||''));
      tb.scrollIntoView({block:'start'}); window.scrollBy(0,-160);
      const r = tb.tBodies[0].rows[0].cloneNode(true);
      r.cells[0].innerHTML='<b>Group</b> <span class="why" style="margin:0">top layer</span>';
      r.cells[1].textContent='SMO team';
      r.cells[2].querySelector('i').style.width='71%'; r.cells[2].querySelector('.mono').textContent='15/21';
      r.cells[3].textContent='6/6'; r.cells[4].textContent='5/8'; r.cells[5].textContent='4/7';
      r.style.outline='3px solid #C9A227'; r.style.outlineOffset='-3px';
      tb.tBodies[0].insertBefore(r, tb.tBodies[0].rows[0]);
    }""")
    pg.wait_for_timeout(200)
    pg.screenshot(path=str(OUT/"board-proposed.png"))
    pg.close()
    # 6. Structure step: today and proposed
    pg = page(b); pg.click('[data-md=setup]'); pg.wait_for_timeout(400)
    pg.click('[data-setupgo=start]'); pg.wait_for_timeout(600)
    pg.click('.csetup button:has-text("Structure")'); pg.wait_for_timeout(600)
    def card_shot(fname, idx):
        pg.evaluate("window.scrollTo(0,0)")
        r = pg.evaluate("i=>{const b=document.querySelectorAll('section.stcard')[i].getBoundingClientRect();return [b.x,b.y+scrollY,b.width,b.height]}", idx)
        pg.screenshot(path=str(OUT/fname), full_page=True, clip={"x":r[0]-8,"y":r[1]-8,"width":r[2]+16,"height":r[3]+16})
    card_shot("card-fns-today.png", 3)
    card_shot("card-top-today.png", 0)
    pg.evaluate(r"""() => {
      // the "Carries capabilities" ticks go
      document.querySelectorAll('section.stcard label, section.stcard .stcaps, section.stcard *').forEach(e=>{
        if (e.children.length<=2 && /^Carries capabilities$/.test((e.innerText||'').trim())) { const row = e.closest('label')||e; row.style.display='none'; }
      });
      const cards = document.querySelectorAll('section.stcard');
      const fn = cards[cards.length-1];
      const cap = fn.cloneNode(true);
      const walk = n => { if (n.nodeType===3) n.nodeValue = n.nodeValue
          .replace(/Supporting Functions/g,'Capabilities').replace(/Supporting Function/g,'Capability')
          .replace(/THIS CLIENT HAS THEM/i,'THIS CLIENT HAS THEM').replace(/Off for supporting functions/gi,'Off for capabilities').replace(/Name all three ways here/,'Name both ways here');
        else n.childNodes.forEach(walk); };
      walk(cap);
      cap.querySelectorAll('input').forEach(i=>{ if (i.value==='Supporting Functions') i.value='Capabilities'; if (i.value==='Supporting Function') i.value='Capability'; });
      // capabilities plan in pillars or projects only: drop the objectives-and-actions block
      const hs=[...cap.querySelectorAll('*')].filter(e=>e.children.length===0&&/^if planned in objectives and actions$/i.test(e.textContent.trim()));
      hs.forEach(h=>{ let box=h; while(box.parentElement && !/if planned in pillars/i.test(box.parentElement.textContent)) box=box.parentElement; box.remove(); });
      cap.style.outline='3px solid #C9A227'; cap.style.outlineOffset='3px';
      fn.after(cap);
    }""")
    pg.wait_for_timeout(300)
    card_shot("card-fns-proposed.png", 3)
    card_shot("card-caps-proposed.png", 4)
    card_shot("card-bu-proposed.png", 2)
    card_shot("card-top-proposed.png", 0)
    pg.close()
    b.close()
from PIL import Image
for f in ("card-top-today","card-top-proposed"):
    im = Image.open(OUT/(f+".png")); w,h = im.size; im.crop((0,max(0,h-190),w,h)).save(OUT/(f+"-foot.png"))
print("ok")
