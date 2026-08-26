"""Capture the Arrange-control candidates FROM THE REAL PLATFORM (§41.9).

A mockup drawn from the stylesheet is drawn from what the product COULD look
like, not from what it does — §41.9 records a whole round of fold mockups that
contained an element the product no longer had. So every image on
`2026-08-26_arrange-in-the-pen-slot.html` is the built file, driven to a unit's
Strategy › Plan pane, with each candidate injected into the live pane and
screenshotted. Both sides of the comparison are the same build.

Two things this had to get right, and both were wrong first:

  · PLAN IS A SECTION, NOT A TAB. The tabs are `strategy` and `performance`
    (`[data-s]`); Plan is a section row under Strategy (`[data-sub2]`). Clicking
    a tab called "plan" silently found nothing and captured the Performance
    page under the Plan page's name — §50.6's fault, one more time.

  · THE ACTION SLOT DOES NOT EXIST FOR THE PEOPLE THIS IS FOR. `.paneact` is
    rendered only `if (mayEditPlan())`, so for a unit head there is nothing to
    inject into and the first run wrote six identical screenshots of an empty
    corner. It is created here — which is itself the finding: giving them the
    control means rendering the slot, not just filling it.

    python3 capture.py     (writes the PNGs beside this file)
"""
from playwright.sync_api import sync_playwright
import pathlib
F = "file:///home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html"
OUT = pathlib.Path("/home/user/SMP/design-mockups/plan-arrange")
EXE = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"

GRIP = ('<svg viewBox="0 0 20 20" aria-hidden="true">'
        '<rect x="4" y="5.5" width="12" height="1.8" rx=".9" fill="currentColor"/>'
        '<rect x="4" y="9.1" width="12" height="1.8" rx=".9" fill="currentColor"/>'
        '<rect x="4" y="12.7" width="12" height="1.8" rx=".9" fill="currentColor"/></svg>')
ARROWS = ('<svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" '
          'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'
          '<path d="M7 7L10 4l3 3M13 13l-3 3-3-3M10 4.6v10.8"/></svg>')

with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=EXE, args=["--no-sandbox"])
    pg = b.new_page(viewport={"width": 1500, "height": 950}, device_scale_factor=2)
    pg.goto(F, wait_until="load"); pg.wait_for_timeout(2500)

    def plan_as(key):
        pg.evaluate("""(k)=>{ VIEWER=k; current='mobile'; paint(); }""", key)
        pg.wait_for_timeout(600)
        # make sure we are on Strategy > Plan
        pg.evaluate("""()=>{ const t=[...document.querySelectorAll('[data-s]')]
            .find(x=>x.dataset.s==='strategy'); if(t) t.click(); }""")
        pg.wait_for_timeout(700)
        pg.evaluate("""()=>{ const r=[...document.querySelectorAll('[data-sub2]')]
            .find(x=>x.dataset.sub2==='plan'); if(r) r.click(); }""")
        pg.wait_for_timeout(900)

    def shot(name, clip_sel=".pane"):
        el = pg.query_selector(clip_sel)
        r = el.bounding_box()
        pg.screenshot(path=str(OUT/(name+".png")),
                      clip={"x": r["x"], "y": r["y"], "width": r["width"], "height": min(r["height"], 330)})
        print("wrote", name, int(r["width"]), "x", int(min(r["height"],330)))

    plan_as("smo")
    print("smo pen present:", pg.eval_on_selector_all(".pane .paneact .penbtn", "n=>n.length"))
    shot("today-smo")

    plan_as("mobhead")
    print("unit head pen present:", pg.eval_on_selector_all(".pane .paneact .penbtn", "n=>n.length"))
    shot("today-unithead")

    for name, svg, title in [("a-grip", GRIP, "Arrange"), ("b-arrows", ARROWS, "Arrange")]:
        for state in ("off", "on"):
            pg.evaluate("""([svg,title,state])=>{
                let act = document.querySelector('.pane .paneact');
                if(!act){ act=document.createElement('div'); act.className='paneact';
                          const pane=document.querySelector('.pane');
                          const band=pane.querySelector('.pband');
                          band ? band.after(act) : pane.prepend(act); }
                act.querySelectorAll('.mockbtn').forEach(n=>n.remove());
                const btn = document.createElement('button');
                btn.className = 'penbtn mockbtn' + (state==='on' ? ' on' : '');
                btn.title = title; btn.setAttribute('aria-label', title);
                btn.innerHTML = svg; act.appendChild(btn); }""", [svg, title, state])
            pg.wait_for_timeout(250)
            shot(name + "-" + state)

    # C — the group's existing text button, relocated into the pane's action slot
    for state in ("off","on"):
        pg.evaluate("""(state)=>{
            let act = document.querySelector('.pane .paneact');
                if(!act){ act=document.createElement('div'); act.className='paneact';
                          const pane=document.querySelector('.pane');
                          const band=pane.querySelector('.pband');
                          band ? band.after(act) : pane.prepend(act); }
            act.querySelectorAll('.mockbtn').forEach(n=>n.remove());
            const btn = document.createElement('button');
            btn.className='editbtn mockbtn'; btn.textContent = state==='on' ? 'Done' : 'Arrange';
            if(state==='on'){ btn.style.background='var(--gold)'; btn.style.borderColor='var(--gold)';
                              btn.style.color='var(--panel)'; }
            act.appendChild(btn); }""", state)
        pg.wait_for_timeout(250)
        shot("c-text-" + state)
    b.close()
