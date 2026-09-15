"""What is waiting on the office — one list, three readers, and no fourth (§356).

§108.10 put a Setup Overview in front of the gear: a list of what is waiting
on the office beside a column summarising the cycle. §148 then drew that SAME
list on the landing (welcome.js reads `attentionRows()` row for row) and §200
put the cycle column beside it in the Overview's own shape — so the page the
gear opened was a second drawing of the page the office lands on at every
sign-in. Spec 054 §9.1, signed off 2026-09-15: the Overview is DELETED, not
hidden (§24), the gear lands on Reporting cycle, and the list stays for the
readers that were never redundant.

WHAT THIS FILE OWNS, then, is what `checks/setup-overview.py` owned minus the
page: the list agrees with its sources, the rail's pills are that list summed
by destination (§108.15), and the page is gone at BOTH ENDS (§94.2) — no def,
no rail entry, and an address that still names it lands on the first page
rather than a blank pane (§61: a bookmark is a door too).

WHAT IT CANNOT SEE FROM file://, AND SAYS SO. The landing's own drawing of
the list is `checks/welcome.py` §5 over HTTP (the welcome never draws over
file://, §148), and the three server-backed rows (inbox, passwords,
declarations) are correctly ABSENT here — asserted absent rather than zero,
§93's distinction. The inbox count reaches the rail's pill through OVQUEUE,
asked whenever the Setup rail is on screen for the office (it used to be
asked on the Overview alone, so deleting the page would have silenced the
pill for ever — a gate keyed on a page that no longer exists does not fail,
§51.11); that half needs a server and is `welcome.py`'s stub.

Run: SMP_CHROME=... python3 qa-run.py checks/attention-rows.py
"""
import os, pathlib, sys
from playwright.sync_api import sync_playwright

URL = "file://" + str(pathlib.Path(os.environ.get("SMP_BUILT") or pathlib.Path(
    pathlib.Path(__file__).resolve().parent.parent,
    "strategy-management-platform.html")).resolve())

fails, errs = [], []


def ck(name, ok, extra=""):
    print(("  ok   " if ok else "  FAIL ") + name + ((" — " + str(extra)) if extra else ""))
    if not ok:
        fails.append(name)


def ev(pg, js, default=None):
    """Every probe degrades rather than dying (§215)."""
    try:
        return pg.evaluate(js)
    except Exception as e:
        errs.append("PROBE: " + str(e)[:160])
        return default


def open_setup(pg, who="smo"):
    pg.select_option("#asWho", who)
    pg.wait_for_timeout(300)
    pg.query_selector('[data-md="setup"]').click()
    pg.wait_for_timeout(500)


def lit(pg):
    return ev(pg, "()=>{const e=document.querySelector('.setuprail .ritem.on .rilab');"
                  "return e ? e.textContent.trim() : null;}")


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1600, "height": 1000})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(URL)
    pg.wait_for_timeout(800)

    print("\n── 1 · the Overview is gone, at both ends ──")
    ck("no Setup def is keyed overview",
       ev(pg, "()=>!setupDefs().some(d=>d.k==='overview')", False))
    ck("no def renders with a function that no longer exists",
       ev(pg, "()=>typeof renderOverview === 'undefined'", False))
    open_setup(pg, "smo")
    ck("the SMO's gear lands on Reporting cycle", lit(pg) == "Reporting cycle", lit(pg))
    # THE FIRST `primary` IN THE LIST IS WHAT THE GEAR PICKS (menuHTML): the
    # register carries its own `primary` for the other half of the old split,
    # so "the only one" would be a claim about a different mechanism (§113.8).
    ck("Reporting cycle is the first def marked primary, which is what the gear picks",
       ev(pg, "()=>setupDefs().filter(d=>d.primary).map(d=>d.k)[0]", "") == "cycle",
       ev(pg, "()=>setupDefs().filter(d=>d.primary).map(d=>d.k)", ""))
    ck("the rail draws no Overview entry",
       ev(pg, "()=>document.querySelectorAll('.setuprail [data-setupgo=\"overview\"]').length", -1) == 0)
    # AN OLD ADDRESS IS A DOOR TOO: /setup/overview in somebody's history must
    # land somewhere, and the shell's own rule (an unknown page falls to the
    # first reachable one) is what it lands on. Asserted rather than assumed.
    ev(pg, "()=>{ currentSub='overview'; paint(); }")
    pg.wait_for_timeout(400)
    ck("an address still naming the Overview lands on Reporting cycle",
       lit(pg) == "Reporting cycle" and ev(pg, "()=>currentSub") == "cycle",
       (lit(pg), ev(pg, "()=>currentSub")))
    ck("…and the pane is not blank",
       (ev(pg, "()=>document.getElementById('panel').textContent.trim().length", 0) or 0) > 40)
    # A NON-OFFICE VIEWER who can open Setup at all lands on the same page —
    # before §108.10 this was the fallback, now it is the rule for everybody.
    other = None
    for who in ev(pg, "()=>[...document.querySelectorAll('#asWho option')].map(o=>o.value)", [])[:40]:
        pg.select_option("#asWho", who)
        pg.wait_for_timeout(150)
        ok = ev(pg, "()=>!inOffice() && reachable(setupDefs(),'group',null).length>0", False)
        if ok:
            other = who
            break
    if other:
        open_setup(pg, other)
        ck("a non-office viewer's gear lands on Reporting cycle too (%s)" % other,
           lit(pg) == "Reporting cycle", lit(pg))
    else:
        ck("a non-office viewer with any Setup page exists in the demo", False, "none found")

    print("\n── 2 · the list agrees with its sources ──")
    open_setup(pg, "smo")
    # MADE, NOT WAITED FOR (§94.2): the demo has every custodian and no claim.
    ev(pg, """()=>{
      window.__arkeep = {roles: JSON.stringify(UNIT_ROLES), claims: JSON.stringify(GROUP.claims||[])};
      const ks = activeKeys().slice(0,2);
      ks.forEach(k=>{ UNIT_ROLES[k] = UNIT_ROLES[k]||{}; UNIT_ROLES[k].custodian = null; });
      GROUP.claims = [{id:"cl-test", state:"open", figure:"f1", set:"s1", by:"smo"}];
      paint();}""")
    pg.wait_for_timeout(400)
    rows = ev(pg, "()=>attentionRows().map(r=>({k:r.k,n:r.n,dest:r.dest,t:r.text}))", []) or []
    src = ev(pg, "()=>({cust:unitsWithoutCustodian().length, claims:openClaimsList().length})", {}) or {}
    by = dict((r["k"], r) for r in rows)
    ck("the custodian row is drawn and agrees with unitsWithoutCustodian()",
       by.get("nocust", {}).get("n") == src.get("cust") and src.get("cust", 0) >= 2, (src, by.get("nocust")))
    ck("the claim row is drawn and agrees with openClaimsList()",
       by.get("claims", {}).get("n") == src.get("claims") == 1, (src, by.get("claims")))
    ck("each row goes to the page that FIXES it",
       by.get("nocust", {}).get("dest") == "people" and by.get("claims", {}).get("dest") == "cycle")
    ck("the three server-backed rows are ABSENT over file://, never zero",
       not any(k in by for k in ("chat", "nopw", "said")), sorted(by))
    ck("a row's sentence carries its own count",
       ("%d units with no custodian" % src.get("cust", -1)) in by.get("nocust", {}).get("t", "")
       and "1 claim request" in by.get("claims", {}).get("t", ""), [r["t"] for r in rows])

    print("\n── 3 · the rail's pills are that list summed by destination (§108.15) ──")
    ev(pg, "()=>paint()")
    pg.wait_for_timeout(300)
    both = ev(pg, """()=>({
      pills: [...document.querySelectorAll('.setuprail .ritem')].map(x=>({
        k: x.dataset.setupgo, n: (x.querySelector('.riwait') || {}).textContent || null })),
      byPage: attentionByPage() })""", {"pills": [], "byPage": {}}) or {"pills": [], "byPage": {}}
    pills, byp = both["pills"], both["byPage"]
    drawn = dict((r["k"], r["n"]) for r in pills if r["n"])
    ck("every pill equals attentionByPage()",
       drawn == dict((k, str(v)) for k, v in byp.items() if v), (drawn, byp))
    ck("the People register's pill is the SUM of its rows",
       byp.get("people") == sum(r["n"] for r in rows if r["dest"] == "people") and byp.get("people", 0) >= 2, byp)
    ck("Reporting cycle carries the claim's pill", byp.get("cycle") == 1, byp)
    quiet = [r["k"] for r in pills if not r["n"]]
    ck("a page with nothing waiting carries no pill",
       all(not byp.get(k) for k in quiet), [k for k in quiet if byp.get(k)])
    ck("and no pill anywhere reads 0", "0" not in [r["n"] for r in pills if r["n"]], pills)
    open_gw = ev(pg, "()=>[...document.querySelectorAll('.setuprail .rgroup:not(.shut) .rgwait')].filter(x=>!x.hidden).length", -1)
    ck("an open group does not repeat its rows' pills", open_gw == 0, open_gw)
    ev(pg, """()=>{const h=document.querySelector('.rgroup[data-railgrp="who"]');
                   if(h && !h.classList.contains('shut')) h.click();}""")
    pg.wait_for_timeout(300)
    gw = ev(pg, "()=>{const e=document.querySelector('.rgroup[data-railgrp=\"who\"] .rgwait');return e?e.textContent.trim():null;}")
    ck("a folded group carries the sum of what is behind it", gw == str(byp.get("people", 0)), (gw, byp))
    ev(pg, """()=>{const h=document.querySelector('.rgroup[data-railgrp="who"]');
                   if(h && h.classList.contains('shut')) h.click();}""")
    pg.wait_for_timeout(250)

    print("\n── 4 · one gap closes, one row goes ──")
    ev(pg, "()=>{ GROUP.claims=[]; paint(); }")
    pg.wait_for_timeout(300)
    left = ev(pg, "()=>attentionRows().map(r=>r.k)", None)
    ck("the answered claim's row is gone, the custodian row stays", left == ["nocust"], left)
    ck("…and its pill with it", not ev(pg, "()=>attentionByPage().cycle", 1))

    # PUT THE TENANT BACK (§94.2).
    ev(pg, """()=>{ const k = window.__arkeep;
      Object.assign(UNIT_ROLES, JSON.parse(k.roles)); GROUP.claims = JSON.parse(k.claims); paint(); }""")
    pg.wait_for_timeout(300)
    ck("the tenant is back as shipped", ev(pg, "()=>attentionRows().length", -1) == 0)

    b.close()

print("")
if errs:
    print("ERRORS:")
    for e in errs:
        print("  " + e)
if fails:
    print("%d FAILED:" % len(fails))
    for f in fails:
        print("  - " + f)
    sys.exit(1)
print("all attention-rows checks passed")
