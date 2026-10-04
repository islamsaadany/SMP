"""A company direction's owner and custodian (§469).

Islam, of the owner-and-custodian mockup
(design-mockups/owner-custodian/): *"ok agreed, build it"*. Each direction on
the company's own plan names an owner AND a custodian; both report their own
direction and save it as a draft; where nobody is named the band says the
Strategy office fills it in; and the company's capabilities show their own
Owner and Custodian, read-only.

It MAKES its state (§255) — the worked example plans on its business units, so
no direction exists until the layer is switched off — and asserts BOTH ENDS
(§94.2): the custodian gets the control on their direction and not on the one
beside it, and the office sees the state with no control.
SMP_BUILT points it at another build (§276).
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
    except Exception: return dflt

MAKE = """()=>{
  GROUP.structure = {bu:{exists:false}, top:{on:SMPRules.STRUCT_COMPONENTS.slice(), temple:true}};
  GROUP.items = [
    {id:'group-P1', code:'EA01', name:'Direction one', sub:'', kind:'', theme:'', owner:'Hazem Roushdy', custodian:'Hossam Farid',
     measures:[{id:'group-P1-M1', name:'Revenue', dir:'\\u2265', target:'100 M EGP', compile:'Sum', actual:''}], tactics:[]},
    {id:'group-P2', code:'EA02', name:'Direction two', sub:'', kind:'', theme:'',
     measures:[{id:'group-P2-M1', name:'Share', dir:'\\u2265', target:'10%', compile:'Latest', actual:''}], tactics:[]}];
  return true}"""

def go(pg, sub, sec=None):
    js = "()=>{current='group'; currentSub='%s';%s paint(); return true}" % (sub, (" CURSEC.%s='%s';" % (sub, sec)) if sec else "")
    safe(pg, js); pg.wait_for_timeout(300)

def as_(pg, key):
    safe(pg, "()=>{switchViewer('%s'); return true}" % key); pg.wait_for_timeout(400)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(800)
    ck("the state is made", safe(pg, MAKE) is True)

    # ── 1. The plan band names the two seats, and the empty case ───────
    go(pg, "strategy", "plan")
    bands = []
    for rid in ("group-P1", "group-P2"):
        try: pg.click('[data-urail="group|%s"]' % rid); pg.wait_for_timeout(250)
        except Exception: pass
        bands += safe(pg, "()=>[...document.querySelectorAll('.pband.planband')].map(b=>b.textContent)", []) or []
    joined = " | ".join(bands)
    ck("a direction's band names its owner and its custodian",
       "Hazem Roushdy" in joined and "Hossam Farid" in joined, joined[:300])
    ck("…and a direction with nobody says the office fills it in",
       "Strategy office fills this in" in joined, joined[:300])
    ink = safe(pg, "()=>{var e=document.querySelector('.pbseats.none'); return e?getComputedStyle(e).color:null}")
    ck("…in the attention ink, never the alarm", ink is not None and ink == safe(pg, "()=>{var d=document.createElement('span');d.style.color='var(--attn-tx)';document.body.appendChild(d);var c=getComputedStyle(d).color;d.remove();return c}"), ink)

    # ── 2. The pen sets the custodian, and it reaches the stored plan ──
    try: pg.click('[data-urail="group|group-P1"]'); pg.click('.secpen[data-page="plan"]'); pg.wait_for_timeout(300)
    except Exception: pass
    rows = safe(pg, "()=>[...document.querySelectorAll('.pfrow em')].map(x=>x.textContent.trim())", []) or []
    ck("the pen carries a Custodian row on a direction", any("Custodian" in r for r in rows), rows)
    wrote = safe(pg, """()=>{var s=[...document.querySelectorAll('select')].filter(x=>{var r=x.closest('.pfrow'); return r && /Custodian/.test(r.textContent)})[0];
       if(!s) return 'none'; var o=[...s.options].find(o=>o.value==='Ashraf Laithy'); if(!o) return 'nooption';
       s.value=o.value; s.dispatchEvent(new Event('change',{bubbles:true})); return GROUP.items.map(i=>i.custodian||'')}""")
    ck("…and choosing somebody writes the stored direction", isinstance(wrote, list) and "Ashraf Laithy" in wrote, wrote)
    safe(pg, "()=>{GROUP.items[0].custodian='Hossam Farid'; delete GROUP.items[1].custodian; paint(); return true}")
    try: pg.click('.secpen[data-page="plan"]'); pg.wait_for_timeout(300)
    except Exception: pass

    # ── 3. Save draft is the seat's, on their direction only ──────────
    as_(pg, "rethead")
    go(pg, "report")
    ctl = safe(pg, "()=>[...document.querySelectorAll('[data-rowdone]')].map(b=>b.dataset.rowdone)", []) or []
    ck("the custodian gets Save draft on their own direction", "group-P1|1" in ctl, ctl)
    ck("…and none on the direction beside it", not any(c.startswith("group-P2") for c in ctl), ctl)
    live0 = safe(pg, "()=>document.querySelectorAll('input[data-rep]:not([disabled]),input:not([disabled])').length", 0)
    safe(pg, "()=>{setDoneMark('group-P1', true); paint(); return true}"); pg.wait_for_timeout(300)
    ck("a saved draft shuts the direction for them", safe(pg, "()=>ownDraftShut('group','group-P1')") is True)
    ck("…and the band says Draft saved with Reopen", "group-P1|0" in (safe(pg, "()=>[...document.querySelectorAll('[data-rowdone]')].map(b=>b.dataset.rowdone)", []) or []))
    as_(pg, "smo")
    go(pg, "report")
    ck("the office sees the state and gets no control",
       not (safe(pg, "()=>document.querySelectorAll('[data-rowdone]').length", 1)) and
       "Draft saved" in (safe(pg, "()=>document.body.textContent", "") or ""))
    ck("…and a draft never shuts the office out", safe(pg, "()=>ownDraftShut('group','group-P1')") is False)
    safe(pg, "()=>{setDoneMark('group-P1', false); return true}")

    # ── 4. The company's capabilities show their own seats ────────────
    safe(pg, "()=>{var c=GROUP.capabilities[0]; if(c){c.head='mobhead'; delete c.custodian} return true}")
    go(pg, "strategy", "caps")
    # §482 (rewritten, never loosened, §218): the seats sit on the open
    # capability's band now, not in table columns.
    seats = safe(pg, "()=>[...document.querySelectorAll('[data-topcaps] .pband .topcapseat')].map(s=>[s.querySelector('b').textContent.trim(), s.textContent.replace(s.querySelector('b').textContent,'').trim()])", []) or []
    sd = dict(seats)
    ck("the open capability's band carries Owner and Custodian", "Owner" in sd and "Custodian" in sd, seats)
    if "Owner" in sd and "Custodian" in sd:
        ck("…the owner is read from the capability", sd["Owner"] == safe(pg, "()=>personName('mobhead')"), seats)
        ck("…an empty seat reads a dash", sd["Custodian"] == "—", seats)
    ck("…and offers no control to change them",
       safe(pg, "()=>document.querySelectorAll('[data-topcaps] select, [data-topcaps] input').length", 1) == 0)

    ck("no page errors", not errs, errs[:3])
    b.close()
print(("%d FAILED" % bad) if bad else "all good")
