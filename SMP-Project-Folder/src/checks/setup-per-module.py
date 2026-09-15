"""Setup per module — a def knows its module, and the rail draws by it
(§356.2, spec 054 §4.2–§4.3, §4.6).

Spec 046 §4.5 built ONE Setup page for the whole client and spec 054 reverses
it at Islam's word: *"the setup and access page should be per module because
each module has its own setup elements including the access and the landing
line."* So every Setup def now carries `mod` — the module that owns the page,
or `client` for the pages that belong to no module — and WHICH RAIL a page is
drawn in is that one field against the document's scope (`data-setup-scope`),
never a second list.

WHAT THIS FILE OWNS, and why each half is here:

  · file://  — the offline copy has no server and therefore no module, so an
    UNSCOPED document draws every page in one rail exactly as it did (§306:
    the handover copy must keep working). The scope is then set the way the
    served router sets it, and the rail is asserted as AGREEMENT with the
    defs' own `mod` (§94.8) — never a list of names, which a page moving
    tomorrow would falsify. Both ends every time (§94.2): a page absent from
    the wrong rail AND present in the right one, or a build that drew an
    empty rail passes half.
  · the page decides the rail (research R2): a page asked for under the
    wrong scope moves the scope to the page's own module, rather than
    being corrected to the first page of the wrong rail (§61: a landing door
    written in the spine form is a request the shell has to honour).
  · the moved pages still WRITE (§96): Roles & access moved group, and the
    knowledge base moved group and rail — a page that renders after a move
    is not a page that saves after one.
  · the fold keys are unchanged (§30.2): `smp.setup.groups` stores group
    keys, and a renamed key would silently unfold every group anybody had
    folded.

  · SERVED (SMP_BASE set) — the half that cannot be seen over file://
    (§94.11): the client's rail at /<client>/setup/…, Strategy's at
    /<client>/strategy/setup/…, the address the shell WRITES for each, the
    landing's spine-form door ending at the module's own address, the gear
    opening the module you stand in, and the way back drawn on the client's
    rail alone. Needs the app built and a database (checks/README in
    smp-app); skipped with a line saying so when SMP_BASE is absent, never
    reported as passed (§54.5).

Run: SMP_CHROME=... python3 qa-run.py checks/setup-per-module.py
     SMP_BASE=http://localhost:3000 SMP_QA_PASSWORD=... to add the served half
"""
import os, pathlib, sys
from playwright.sync_api import sync_playwright

URL = "file://" + str(pathlib.Path(os.environ.get("SMP_BUILT") or pathlib.Path(
    pathlib.Path(__file__).resolve().parent.parent,
    "strategy-management-platform.html")).resolve())
BASE = os.environ.get("SMP_BASE")

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


def rail(pg):
    """The rail as drawn: page keys in order, every group unfolded."""
    return ev(pg, "()=>Array.from(document.querySelectorAll('.setuprail .ritem[data-setupgo]')).map(e=>e.dataset.setupgo)", [])


def defs_of(pg, scope):
    """What the defs themselves say belongs to a scope — the AGREEMENT side."""
    return ev(pg, "()=>reachable(setupDefsFor(%r),'group',null).map(d=>d.k)" % scope, [])


def head(pg):
    return ev(pg, "()=>{const h=document.querySelector('.setuprail .rhead');"
                  "return h ? h.firstChild.textContent.trim() : null;}")


def scope(pg):
    return ev(pg, "()=>document.documentElement.getAttribute('data-setup-scope')")


def set_scope(pg, v, page=None):
    """Scope the document the way the served router does — and, because the
    page decides the rail (§4 below), stand on a page of that rail while
    doing it, or the scope is corrected straight back."""
    goto = ("currentSub=%r; " % page) if page else ""
    ev(pg, "()=>{%s%s; paint();}" % (goto, "document.documentElement.setAttribute('data-setup-scope',%r)" % v if v
                                     else "document.documentElement.removeAttribute('data-setup-scope')"))
    pg.wait_for_timeout(350)


def same(a, b):
    """The rail draws in SETUP_GROUPS order and the defs sit in their own,
    so membership is what is compared — never a list a page moving
    tomorrow would falsify (§94.8)."""
    return bool(a) and sorted(a) == sorted(b)


def unfold_all(pg):
    for g in pg.eval_on_selector_all(".setuprail .rgroup.shut", "els=>els.map(e=>e.dataset.railgrp)"):
        pg.click('.setuprail [data-railgrp="%s"]' % g)
        pg.wait_for_timeout(100)


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1600, "height": 1000})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(URL)
    pg.wait_for_timeout(800)
    pg.select_option("#asWho", "smo")
    pg.wait_for_timeout(300)
    pg.query_selector('[data-md="setup"]').click()
    pg.wait_for_timeout(600)
    unfold_all(pg)

    print("\n── 1 · every def knows its module ──")
    mods = ev(pg, "()=>setupDefsAll().map(d=>[d.k, d.mod||null])", [])
    ck("every Setup def carries `mod`", mods and all(m for _, m in mods), [k for k, m in mods if not m])
    ck("the values are a module word or `client` and nothing else",
       mods and all(m in ("client", "strategy") for _, m in mods), sorted(set(m for _, m in mods)))
    ck("Roles & access is Strategy's (spec 054 §4.4) and in the Access group",
       ev(pg, "()=>{const d=setupDefsAll().find(d=>d.k==='access');return d && d.mod==='strategy' && d.grp==='access';}", False))
    ck("the knowledge base is the client's (spec 054 §2, the sixth door) and in the Help group",
       ev(pg, "()=>{const d=setupDefsAll().find(d=>d.k==='kb');return d && d.mod==='client' && d.grp==='help';}", False))
    ck("the people, the organisation and branding are the client's",
       ev(pg, "()=>['people','mainbu','units','companies','fns','caps','brand'].every(k=>{const d=setupDefsAll().find(d=>d.k===k);return d && d.mod==='client';})", False))
    ck("the cycle, the inbox, the measures and the import are Strategy's",
       ev(pg, "()=>['cycle','chat','history','send','myfig','import','sets','focusset','bands','labels'].every(k=>{const d=setupDefsAll().find(d=>d.k===k);return d && d.mod==='strategy';})", False))
    ck("every group a def names is a group the rail knows (§113.8's silent direction)",
       ev(pg, "()=>setupDefsAll().every(d=>SETUP_GROUPS.some(g=>g.k===d.grp))", False),
       ev(pg, "()=>setupDefsAll().filter(d=>!SETUP_GROUPS.some(g=>g.k===d.grp)).map(d=>d.k)"))

    print("\n── 2 · unscoped (the offline copy) the rail draws every page, as before ──")
    # UNDER SMP_BASE THIS FILE IS RE-POINTED WHOLE (qa-run.py): the goto above
    # signed in and opened a served page, and the gear then scoped the
    # document to its module — so "unscoped" is a state the served app never
    # shows, and this section is measured over file:// alone and SAYS so
    # rather than passing on a rail that was never unscoped (§54.5).
    if BASE:
        print("  (served: the document is never unscoped; the offline half is measured over file://)")
        set_scope(pg, "")
    ck("no scope is set over file://" if not BASE else "cleared by hand, the served document draws everything too",
       scope(pg) is None, scope(pg))
    everything = rail(pg)
    both = defs_of(pg, "")
    ck("the rail is every reachable def, in one list", same(everything, both), (everything, both))
    ck("…drawn in the groups' own order", ev(pg, "()=>{const order=SETUP_GROUPS.map(g=>g.k);"
       "const seen=Array.from(document.querySelectorAll('.setuprail .rgroup')).map(e=>e.dataset.railgrp);"
       "return seen.every((k,i)=>i===0||order.indexOf(k)>order.indexOf(seen[i-1]));}", False))
    ck("…and it holds both a client's page and Strategy's", "people" in everything and "cycle" in everything, everything)
    ck("the head says Setup and nothing more", head(pg) == "Setup", head(pg))
    ck("no way back is drawn — there is no landing to go back to", pg.query_selector(".setuprail .railback") is None)

    print("\n── 3 · scoped, the rail is the module's own — asserted as AGREEMENT, both ends ──")
    set_scope(pg, "strategy", "cycle")
    unfold_all(pg)
    strat = rail(pg)
    ck("Strategy's rail is exactly the defs marked strategy", same(strat, defs_of(pg, "strategy")), (strat, defs_of(pg, "strategy")))
    ck("…and none of the client's", not any(k in strat for k in ("people", "units", "brand", "kb")), strat)
    ck("…its Access group holds Roles & access", "access" in strat)
    ck("the head names the module — absent a label over file://, the word Setup",
       head(pg) in ("Setup", "Strategy · Setup"), head(pg))
    set_scope(pg, "client", "people")
    unfold_all(pg)
    cli = rail(pg)
    ck("the client's rail is exactly the defs marked client", same(cli, defs_of(pg, "client")), (cli, defs_of(pg, "client")))
    ck("…and none of Strategy's", not any(k in cli for k in ("cycle", "bands", "access", "sets")), cli)
    ck("…its Help group holds the knowledge base", "kb" in cli)
    ck("the head says Client · Setup", head(pg) == "Client · Setup", head(pg))
    ck("the two rails between them are the whole list, and share nothing",
       sorted(strat + cli) == sorted(everything) and not set(strat) & set(cli), (len(strat), len(cli), len(everything)))
    ck("the way back is drawn on the client's rail",
       ev(pg, "()=>{const a=document.querySelector('.setuprail .railback');return !!a && /landing/i.test(a.textContent);}", False))
    ck("…and read (§38.5): its ink clears 4.5:1 on its own ground",
       ev(pg, """()=>{const a=document.querySelector('.setuprail .railback'); if(!a) return false;
         const cs=getComputedStyle(a); const bg=getComputedStyle(a.parentElement).backgroundColor;
         function L(c){const m=c.match(/[\\d.]+/g).map(Number); const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);};
           return .2126*f(m[0])+.7152*f(m[1])+.0722*f(m[2]);}
         const l1=L(cs.color), l2=L(bg); return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05) >= 4.5;}""", False))

    print("\n── 4 · the page decides the rail (research R2) ──")
    # A landing door is written /<client>/setup/cycle — the spine form — for
    # a page that is Strategy's. The shell must move the scope to the page's
    # module rather than land on the first client page.
    set_scope(pg, "client", "people")
    ev(pg, "()=>{currentSub='cycle'; paint();}")
    pg.wait_for_timeout(350)
    ck("asked for Reporting cycle under the client's scope, the scope moves to Strategy",
       scope(pg) == "strategy", scope(pg))
    ck("…and the page on screen IS Reporting cycle, not the first client page",
       ev(pg, "()=>currentSub", None) == "cycle" and ev(pg, "()=>!!document.querySelector('.setuprail .ritem.on[data-setupgo=\"cycle\"]')", False))
    ev(pg, "()=>{currentSub='brand'; paint();}")
    pg.wait_for_timeout(350)
    ck("…and back the other way for Branding", scope(pg) == "client", scope(pg))
    # A page NOBODY holds does not move the scope — the correction to the
    # first page of the rail is paint()'s own and is left to it.
    ev(pg, "()=>{currentSub='nosuchpage'; paint();}")
    pg.wait_for_timeout(350)
    ck("an unknown page leaves the scope where it was and lands on the rail's first page",
       scope(pg) == "client" and ev(pg, "()=>currentSub", None) == defs_of(pg, "client")[0], (scope(pg), ev(pg, "()=>currentSub")))

    print("\n── 5 · the gear opens the module's Setup — or everything, offline ──")
    set_scope(pg, "client", "people")
    ev(pg, "()=>{current='mobile'; currentSub='strategy'; paint();}")
    pg.wait_for_timeout(300)
    pg.query_selector('[data-md="setup"]').click()
    pg.wait_for_timeout(500)
    if BASE:
        ck("served, the gear opens the document's own module", scope(pg) == "strategy", scope(pg))
    else:
        ck("over file:// the gear clears the scope (no module word to open)", scope(pg) is None, scope(pg))
    ck("…and lands on Reporting cycle, the primary", ev(pg, "()=>currentSub") == "cycle", ev(pg, "()=>currentSub"))
    # With a module word stamped, the gear opens THAT module's rail.
    ev(pg, "()=>{document.documentElement.setAttribute('data-module','strategy'); current='mobile'; currentSub='strategy'; paint();}")
    pg.wait_for_timeout(300)
    pg.query_selector('[data-md="setup"]').click()
    pg.wait_for_timeout(500)
    ck("stamped strategy, the gear opens Strategy's rail", scope(pg) == "strategy" and "people" not in rail(pg), (scope(pg), rail(pg)))
    ck("…and the gear's landing page is asked of the MODULE's defs, from any rail",
       ev(pg, "()=>{document.documentElement.setAttribute('data-setup-scope','client'); const h=menuHTML(); "
              "document.documentElement.setAttribute('data-setup-scope','strategy'); return /data-ms=\"cycle\"/.test(h);}", False))
    if not BASE:
        ev(pg, "()=>document.documentElement.removeAttribute('data-module')")

    print("\n── 6 · the moved pages still write (§96) ──")
    set_scope(pg, "strategy", "cycle")
    unfold_all(pg)
    pg.click('.setuprail [data-setupgo="access"]')
    pg.wait_for_timeout(400)
    before = ev(pg, "()=>JSON.stringify(ACCESS)")
    wrote = ev(pg, """()=>{const b=document.querySelector(".acgrid button[data-ac]:not(.on)");
                         if(!b) return 'no control'; b.click(); return 'pressed';}""")
    pg.wait_for_timeout(300)
    after = ev(pg, "()=>JSON.stringify(ACCESS)")
    ck("Roles & access, in its new group, still writes the matrix", wrote == "pressed" and before != after, wrote)
    set_scope(pg, "client", "people")
    unfold_all(pg)
    pg.click('.setuprail [data-setupgo="kb"]')
    pg.wait_for_timeout(400)
    ck("the knowledge base, on the client's rail, draws its page",
       ev(pg, "()=>/Knowledge base/.test((document.querySelector('#panel .setupttl')||{}).textContent||'')", False))

    print("\n── 7 · the fold keys are the ones a browser already holds (§30.2) ──")
    # REWRITTEN, NEVER LOOSENED (§218, §214.3): this held the whole list as a
    # literal and §356.4 legitimately added `landing`. What §30.2 needs is that
    # the keys a browser ALREADY HOLDS folds for are still those keys, in
    # place — asserted as the leading four — and that every def's group is a
    # key of the list (agreement, §94.8), so a group added tomorrow stays
    # green and a def pointing at no group goes red.
    keys = ev(pg, "()=>SETUP_GROUPS.map(g=>g.k)")
    ck("the four groups a browser already folds are keyed as before, in place",
       keys[:4] == ["cycle", "who", "run", "meas"], keys)
    ck("...and access, landing and help are among the groups", all(k in keys for k in ("access", "landing", "help")), keys)
    ck("...and every def's group is one of them",
       ev(pg, "()=>setupDefsAll().every(d=>SETUP_GROUPS.some(g=>g.k===d.grp))", False),
       ev(pg, "()=>setupDefsAll().filter(d=>!SETUP_GROUPS.some(g=>g.k===d.grp)).map(d=>d.k)"))

    print("\n── 7b · the Landing line page, offline, says the served platform sets it (§356.4) ──")
    # Over file:// there is no landing and no declaration on the document, so
    # the page must say so rather than draw a list that writes to nothing
    # (§45.2, §61). The served page is driven by smp-app/checks/door-landing.mjs §8.
    set_scope(pg, "strategy", "landing")
    ck("the page is on Strategy's rail", ev(pg, "()=>currentSub", None) == "landing", ev(pg, "()=>currentSub", None))
    ck("with no declaration it says where the line is set",
       ev(pg, "()=>!!document.querySelector('#panel .lnone')", False))
    ck("...and offers nothing to pick", ev(pg, "()=>document.querySelectorAll('[data-landpick]').length", -1) == 0)
    ev(pg, "()=>{localStorage.setItem('smp.setup.groups', JSON.stringify({look:1}));}")
    pg.reload(); pg.wait_for_timeout(800)
    if not BASE:
        pg.select_option("#asWho", "smo"); pg.wait_for_timeout(300)
        pg.query_selector('[data-md="setup"]').click(); pg.wait_for_timeout(500)
    else:
        # served, the reload lands back on the client's rail by its address
        pg.wait_for_function("!document.documentElement.classList.contains('booting')", timeout=20000)
        set_scope(pg, "client", "people")
    ck("a fold stored before this change still folds the same group",
       ev(pg, "()=>{const g=document.querySelector('.rgroup[data-railgrp=\"look\"]');return !!g && g.classList.contains('shut');}", False))
    ev(pg, "()=>localStorage.removeItem('smp.setup.groups')")

    if BASE:
        print("\n── 8 · SERVED: two rails, two addresses ──")
        pg2 = b.new_page(viewport={"width": 1600, "height": 1000})
        pg2.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))
        pg2.goto(BASE + "/raya-trade/sign-in")
        pg2.wait_for_selector(".gate[data-hydrated]", state="attached", timeout=15000)
        pg2.fill("#user", os.environ.get("SMP_QA_EMAIL", "office@forefront.example"))
        pg2.fill("#password", os.environ["SMP_QA_PASSWORD"])
        pg2.click("#loginForm button[type=submit]")
        pg2.wait_for_url("**/raya-trade", timeout=15000)

        def served(path):
            pg2.goto(BASE + path)
            pg2.wait_for_function("!document.documentElement.classList.contains('booting')", timeout=20000)
            pg2.wait_for_timeout(500)
            for g in pg2.eval_on_selector_all(".setuprail .rgroup.shut", "els=>els.map(e=>e.dataset.railgrp)"):
                pg2.click('.setuprail [data-railgrp="%s"]' % g); pg2.wait_for_timeout(100)

        served("/raya-trade/setup/people")
        ck("the client's address draws the client's rail", scope(pg2) == "client" and same(rail(pg2), defs_of(pg2, "client")), (scope(pg2), rail(pg2)))
        ck("…headed Client · Setup, with the way back to the landing",
           head(pg2) == "Client · Setup" and ev(pg2, "()=>{const a=document.querySelector('.setuprail .railback');return a && a.getAttribute('href');}") == "/raya-trade")
        pg2.click('.setuprail [data-setupgo="brand"]'); pg2.wait_for_timeout(400)
        ck("pressing inside it writes the spine form", ev(pg2, "()=>location.pathname") == "/raya-trade/setup/brand", ev(pg2, "()=>location.pathname"))

        served("/raya-trade/strategy/setup/cycle")
        ck("the module's address draws the module's rail", scope(pg2) == "strategy" and same(rail(pg2), defs_of(pg2, "strategy")), (scope(pg2), rail(pg2)))
        ck("…headed with the module's own name from the server's stamp", head(pg2) == "Strategy · Setup", head(pg2))
        ck("…and no way back on it", pg2.query_selector(".setuprail .railback") is None)
        pg2.click('.setuprail [data-setupgo="bands"]'); pg2.wait_for_timeout(400)
        ck("pressing inside it writes the module's form", ev(pg2, "()=>location.pathname") == "/raya-trade/strategy/setup/bands", ev(pg2, "()=>location.pathname"))

        served("/raya-trade/setup/cycle")
        ck("the landing's spine-form door to Reporting cycle ends at Strategy's own address",
           ev(pg2, "()=>location.pathname") == "/raya-trade/strategy/setup/cycle" and scope(pg2) == "strategy" and ev(pg2, "()=>currentSub") == "cycle",
           (ev(pg2, "()=>location.pathname"), scope(pg2)))
        pg2.go_back(); pg2.wait_for_timeout(600)
        ck("…and Back walks off it rather than through a page the product no longer writes",
           not ev(pg2, "()=>location.pathname", "").startswith("/raya-trade/strategy/setup/cycle"), ev(pg2, "()=>location.pathname"))

        served("/raya-trade/strategy/mobile/strategy")
        pg2.click('[data-md="setup"]'); pg2.wait_for_timeout(500)
        ck("the gear from a unit page opens Strategy's Setup at its own address",
           scope(pg2) == "strategy" and ev(pg2, "()=>location.pathname", "").startswith("/raya-trade/strategy/setup/"), ev(pg2, "()=>location.pathname"))
        served("/raya-trade/setup/people")
        pg2.click('[data-md="setup"]'); pg2.wait_for_timeout(500)
        ck("…and from the client's rail the gear still opens the module's", scope(pg2) == "strategy", scope(pg2))
        pg2.close()
    else:
        print("\n── 8 · SERVED half NOT RUN (no SMP_BASE) — this is not a pass ──")

    b.close()

print("\nconsole errors:", errs or "none")
if fails:
    print("\nFAILED: %d" % len(fails))
    for f in fails:
        print("  - " + f)
    sys.exit(1)
print("\nsetup-per-module: all assertions passed" + ("" if BASE else " (file:// half only)"))
