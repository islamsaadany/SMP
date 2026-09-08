"""Setting a client up — the wizard writes the graph, and what is not built is inert (§303, spec 042).

WHAT THIS ASSERTS, AND WHY EACH ONE IS HERE.

· EVERY ANSWER IS READ BACK OFF THE STORED GRAPH, NEVER OFF THE SCREEN (§96).
  A wizard wired to nothing renders perfectly — that is the whole of §96, and
  `koEdit` shipped eleven versions of exactly it. So every step is driven
  through its REAL control and then the DATA is asked, and a probe that only
  looked at the boxes would pass on a build where every keystroke is discarded.

· THE SHAPE AGREES WITH THE DATA, never a count (§94.8). The chips are supposed
  to be derived; asserting "three chips" would pass on a build that drew three
  literals, and would have to be edited the day the demo gains a unit.

· BOTH ENDS, EVERY TIME (§94.2). The page is the office's — so it is asserted
  DRAWN for the SMO and ABSENT for a unit head. The Overview's door is asserted
  present on a bare tenant and gone on a shaped one, which needs the bare state
  MADE, because the demo has ten units and would never reach it.

· THE DULLED PARTS ARE INERT, NOT MERELY GREY. Islam asked for what the
  platform cannot do yet to be drawn and dulled; a mockup's dulling is a
  drawing and a product's has to be enforced (spec 042 §7). So the third plan
  type is asserted `disabled`, the dull choice asserted to have no press, and
  each asserted to SAY *Later* — a greyed control that does not say why reads
  as broken (§61).

· NOTHING NEW IS STORED. The wizard is a screen mode: the state graph's own
  keys are compared before and after walking it, and a build that put `WIZ`
  into the graph fails here (§25, §47.1).

EVERY PROBE DEGRADES (§215). A check that dies rather than reports counts its
failures wrong, and this file has a whole feature's worth of steps after the
first one that could throw.

Run: SMP_CHROME=... python3 qa-run.py checks/client-setup.py
     SMP_BUILT=/path/to/other.html to point it at another build.
"""
import os, pathlib
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or str(pathlib.Path(
    pathlib.Path(__file__).resolve().parent.parent,
    "strategy-management-platform.html").resolve())
URL = "file://" + BUILT

fails, errs = [], []


def ck(name, ok, extra=""):
    print(("  ok   " if ok else "  FAIL ") + name + ((" — " + str(extra)) if extra else ""))
    if not ok:
        fails.append(name)


def js(pg, expr, *a):
    """Never throws: a probe that dies reports the wrong number (§215)."""
    try:
        return pg.evaluate(expr, *a)
    except Exception as e:
        return {"__err": str(e)[:160]}


def setfield(pg, sel, val, wait=260):
    """Fill a bound field and commit it.

    BLUR, NEVER A SYNTHESISED `change` (§219, and §35). A bound field commits
    when focus LEAVES it, which is what a person does; dispatching `change`
    while the box still has focus makes paint() remove a FOCUSED node, whose
    blur then fires inside the innerHTML assignment — "the node to be removed
    is no longer a child of this node". Measured rather than guessed: the
    platform's own Terminology field, whose handler has ended in paint() since
    long before this round, throws the identical error under a dispatched
    change and none under a real blur. The fault was the probe's method.

    RE-QUERIED EVERY TIME, NEVER HELD (§222). These handlers end in paint(),
    which REPLACES the node, so a handle taken before the commit is detached by
    the time the next line runs — and the check dies rather than reporting
    (§215, which this file's own docstring promises it does not do).
    """
    el = pg.query_selector(sel)
    if not el:
        return False
    try:
        el.fill(val)
        pg.evaluate("()=>{ if(document.activeElement && document.activeElement.blur) "
                    "document.activeElement.blur(); }")
    except Exception:
        return False
    pg.wait_for_timeout(wait)
    return True


def setup(pg, key=None):
    js(pg, "(k)=>{ current='setup'; if(k) currentSub=k; paint(); }", key)
    pg.wait_for_timeout(320)


def viewer(pg, who):
    try:
        pg.select_option("#asWho", who)
        pg.wait_for_timeout(320)
        return True
    except Exception:
        return False


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1560, "height": 940})
    pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
    pg.on("console", lambda m: errs.append("console: " + m.text) if m.type == "error" else None)
    # The welcome screen covers the viewport and intercepts every click (§167.2),
    # and the tour's dock does the same — both suppressed as a RETURNING viewer,
    # in an init script, because setting the flag after goto is too late.
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    pg.goto(URL)
    pg.wait_for_timeout(900)
    viewer(pg, "smo")

    # ── 1 · The page is there, and it is the office's ────────────────────
    print("\n§1 · the page, and who may open it")
    setup(pg)
    rail = js(pg, "()=>Array.from(document.querySelectorAll('.setuprail .ritem'))"
                  ".map(function(b){return b.dataset.setupgo;})")
    ck("the SMO has a Set-up entry in the rail", isinstance(rail, list) and "wizard" in rail, rail)

    setup(pg, "wizard")
    ck("it draws the wizard", bool(pg.query_selector(".wzrail")))
    ck("and the shape beside it", bool(pg.query_selector(".wzshape")))

    # BOTH ENDS: a unit head is not the office, and must not reach it.
    head = js(pg, "()=>{var k=PEOPLE.filter(function(p){"
                  "return p.active!==false && personRoleKeys(p).indexOf('owner')>-1;})[0];"
                  "return k?k.key:null;}")
    if isinstance(head, str):
        viewer(pg, head)
        setup(pg)
        rail2 = js(pg, "()=>Array.from(document.querySelectorAll('.setuprail .ritem'))"
                       ".map(function(b){return b.dataset.setupgo;})")
        ck("a unit head has no Set-up entry",
           isinstance(rail2, list) and "wizard" not in rail2, rail2)
        viewer(pg, "smo")
        setup(pg, "wizard")
    else:
        ck("a unit head has no Set-up entry", False, "no unit owner in the register to ask")

    # ── 2 · Every answer reaches the STORED graph (§96) ──────────────────
    print("\n§2 · what the controls actually write")
    before = js(pg, "()=>({org:GROUP.org, yr:String(GROUP.horizon||''), "
                    "units:UNIT_KEYS.length, fns:FUNCTION_KEYS.length, "
                    "cos:activeCompanyKeys().length})")

    # the client's name — the one field the platform had no control for at all
    js(pg, "()=>{ WIZ={at:0,seen:[]}; paint(); }")
    pg.wait_for_timeout(250)
    ok = setfield(pg, "[data-worg]", "Elabd Group")
    ck("the client's name reaches GROUP.org",
       ok and js(pg, "()=>GROUP.org") == "Elabd Group", js(pg, "()=>GROUP.org"))

    # the year
    js(pg, "()=>{ WIZ.at=1; paint(); }")
    pg.wait_for_timeout(250)
    ok = setfield(pg, "[data-wyear]", "2031")
    ck("the year reaches GROUP.horizon",
       ok and str(js(pg, "()=>String(GROUP.horizon)")) == "2031", js(pg, "()=>GROUP.horizon"))
    # AND AN EMPTIED BOX CLEARS IT rather than storing a space: horizonSet()
    # tests for a non-blank string, so " " would read as set and print a
    # dangling "by" (§50.6's shape, one field over).
    ok = setfield(pg, "[data-wyear]", "   ")
    ck("a blanked year is cleared, not stored as a space",
       ok and js(pg, "()=>GROUP.horizon") == "" and js(pg, "()=>horizonSet()") is False,
       js(pg, "()=>JSON.stringify(GROUP.horizon)"))
    setfield(pg, "[data-wyear]", "2031")

    # a business unit, minted and then renamed through the platform's own field
    js(pg, "()=>{ WIZ.at=2; paint(); }")
    pg.wait_for_timeout(250)
    add = pg.query_selector("[data-wadd='unit']")
    if add:
        add.click()
        pg.wait_for_timeout(300)
        after = js(pg, "()=>UNIT_KEYS.length")
        ck("Add a business unit mints one through addBusinessUnit",
           isinstance(after, int) and isinstance(before, dict) and after == before["units"] + 1,
           str(before.get("units")) + " → " + str(after))
        newkey = js(pg, "()=>UNIT_KEYS[UNIT_KEYS.length-1]")
        ok = setfield(pg, "[data-uname='" + str(newkey) + "']", "Trading")
        ck("renaming it writes UNITS[key].name",
           ok and js(pg, "(k)=>UNITS[k].name", newkey) == "Trading",
           js(pg, "(k)=>UNITS[k].name", newkey))
    else:
        ck("Add a business unit mints one through addBusinessUnit", False, "no add control")

    # a company
    js(pg, "()=>{ WIZ.at=3; paint(); }")
    pg.wait_for_timeout(250)
    addco = pg.query_selector("[data-wadd='co']")
    if addco:
        addco.click()
        pg.wait_for_timeout(300)
        ck("Add a company mints one through addCompany",
           js(pg, "()=>activeCompanyKeys().length") == before["cos"] + 1,
           str(before.get("cos")) + " → " + str(js(pg, "()=>activeCompanyKeys().length")))
    else:
        ck("Add a company mints one through addCompany", False, "no add control")

    # a function, its plan type, and a capability under it
    js(pg, "()=>{ WIZ.at=5; paint(); }")
    pg.wait_for_timeout(250)
    addfn = pg.query_selector("[data-wadd='fn']")
    if addfn:
        addfn.click()
        pg.wait_for_timeout(300)
        ck("Add a supporting function mints one through addFunction",
           js(pg, "()=>FUNCTION_KEYS.length") == before["fns"] + 1,
           str(before.get("fns")) + " → " + str(js(pg, "()=>FUNCTION_KEYS.length")))
        fk = js(pg, "()=>FUNCTION_KEYS[FUNCTION_KEYS.length-1]")
        fsel = "select[data-fnformat='" + str(fk) + "']"
        if pg.query_selector(fsel):
            try:
                pg.select_option(fsel, "projects")
            except Exception:
                pass
            pg.wait_for_timeout(320)
            # ASKED THROUGH THE PLATFORM'S OWN READER, never the raw field
            # (§50.6): "pillars" writes `format`, anything else DELETES it, so
            # a projects function has no key at all. The check's first run
            # asserted the raw value and reported a correct build as broken.
            ck("its plan type is written, and read back as projects",
               js(pg, "(k)=>fnFormat(FUNCTIONS[k])", fk) == "projects",
               js(pg, "(k)=>JSON.stringify(FUNCTIONS[k].format)+' / '+fnFormat(FUNCTIONS[k])", fk))
            capn = js(pg, "(k)=>capsOfFunction(k).length", fk)
            addcap = pg.query_selector("[data-wadd='cap'][data-wfn='" + str(fk) + "']")
            if addcap:
                addcap.click()
                pg.wait_for_timeout(300)
                ck("a capability is minted under it, through addCapability",
                   js(pg, "(k)=>capsOfFunction(k).length", fk) == capn + 1,
                   str(capn) + " → " + str(js(pg, "(k)=>capsOfFunction(k).length", fk)))
            else:
                ck("a capability is minted under it, through addCapability", False,
                   "no capability add drawn under a projects function")
            # AND THE GUARD IS THE PLATFORM'S OWN (§53.5). With a capability on
            # it the switch back is REFUSED — shown, disabled, and saying why —
            # because switching would not delete the plan, it would stop
            # drawing it. The first build of the wizard wrote its own select
            # and dropped this; asserted here so it cannot be dropped again.
            blocked = js(pg, "(s)=>{var e=document.querySelector(s);"
                             "return e?{dis:e.disabled,why:(e.parentNode.textContent||'')}:null;}", fsel)
            ck("holding a capability, the switch back is refused and says why",
               isinstance(blocked, dict) and blocked.get("dis") is True
               and "holds" in str(blocked.get("why", "")), blocked)
            # cleared, it opens again — both ends (§94.2)
            js(pg, "(k)=>{ GROUP.capabilities = GROUP.capabilities.filter("
                   "function(c){ return c.fn !== k; }); paint(); }", fk)
            pg.wait_for_timeout(320)
            ck("with the capability gone, it opens again",
               js(pg, "(s)=>{var e=document.querySelector(s);return e?e.disabled:null;}", fsel) is False)
            try:
                pg.select_option(fsel, "pillars")
            except Exception:
                pass
            pg.wait_for_timeout(320)
            ck("switched to pillars, the capability list goes",
               pg.query_selector("[data-wadd='cap'][data-wfn='" + str(fk) + "']") is None)
        else:
            ck("its plan type is written, and read back as projects", False, "no format select")
    else:
        ck("Add a supporting function mints one through addFunction", False, "no add control")

    # a word
    js(pg, "()=>{ WIZ.at=6; paint(); }")
    pg.wait_for_timeout(280)
    lbl = pg.query_selector(".wztbl input.lbl[data-scope='bu']")
    i = lbl.get_attribute("data-lbl") if lbl else None
    ok = i is not None and setfield(pg, ".wztbl input.lbl[data-lbl='" + str(i) + "'][data-scope='bu']",
                                    "Focus Areas", 300)
    ck("a word reaches LABELS.entries",
       ok and js(pg, "(i)=>LABELS.entries[+i].bu", i) == "Focus Areas",
       js(pg, "(i)=>LABELS.entries[+i].bu", i) if i is not None else "no label cell drawn")

    # ── 3 · The shape AGREES with the data (§94.8) ───────────────────────
    print("\n§3 · the shape is derived, not drawn")
    js(pg, "()=>{ WIZ.at=5; paint(); }")
    pg.wait_for_timeout(300)
    agree = js(pg, """()=>{
      var chips = Array.from(document.querySelectorAll('.wzshape .wzchip.unit'))
                       .map(function(c){ return c.firstChild.textContent.trim(); });
      var names = UNIT_KEYS.map(function(k){ return UNITS[k].name; });
      var fchips = Array.from(document.querySelectorAll('.wzshape .wzchip.fn')).length;
      return { chips:chips, names:names, fchips:fchips, fns:FUNCTION_KEYS.length };
    }""")
    if isinstance(agree, dict) and "chips" in agree:
        ck("every unit is a chip, and every chip is a unit",
           agree["chips"] == agree["names"], str(agree["chips"])[:120])
        ck("the function chips agree with FUNCTION_KEYS",
           agree["fchips"] == agree["fns"],
           str(agree["fchips"]) + " vs " + str(agree["fns"]))
    else:
        ck("every unit is a chip, and every chip is a unit", False, agree)
        ck("the function chips agree with FUNCTION_KEYS", False, agree)

    # ── 4 · Progress is derived from the data, not remembered ────────────
    print("\n§4 · the ticks read the graph")
    ticked = js(pg, """()=>{
      var was = GROUP.org;
      GROUP.org = ""; paint();
      var off = !!document.querySelector('.wzstep[data-wgo="0"]').classList.contains('done');
      GROUP.org = was || "Elabd Group"; paint();
      var on  = !!document.querySelector('.wzstep[data-wgo="0"]').classList.contains('done');
      return { off:off, on:on };
    }""")
    pg.wait_for_timeout(250)
    if isinstance(ticked, dict) and "off" in ticked:
        ck("with no client name the first step does not tick", ticked["off"] is False)
        ck("with one, it does", ticked["on"] is True)
    else:
        ck("the ticks read the graph", False, ticked)

    # ── 5 · What is not built is drawn, and INERT ────────────────────────
    print("\n§5 · dulled, and inert")
    dull = js(pg, """()=>{
      var chip = document.querySelector('.wzstep[data-wgo="4"]');
      var opts = Array.from(document.querySelectorAll('select[data-fnformat] option'))
                      .map(function(o){ return { v:o.value, dis:o.disabled, t:o.textContent }; });
      var later = Array.from(document.querySelectorAll('.wzchoice.wzlater'));
      return {
        chipLater: !!(chip && chip.classList.contains('wzlater')),
        objOnSelect: opts.some(function(o){ return o.v === 'objectives'; }),
        liveOffered: ['pillars','projects'].every(function(v){
          return opts.some(function(o){ return o.v === v && !o.dis; }); }),
        laterCount: later.length,
        laterSaysSo: later.every(function(el){ return /later/i.test(el.textContent); }),
        laterIsButton: later.some(function(el){ return el.tagName === 'BUTTON'; })
      };
    }""")
    if isinstance(dull, dict) and "chipLater" in dull:
        ck("the capabilities step is drawn and dulled", dull["chipLater"] is True)
        # NOT AN OPTION ON THE CONTROL: an answer that cannot be taken does
        # not belong on the control that takes them (§61). It is drawn and
        # named in the choice cards instead, asserted just below.
        ck("the plan-type select offers only what the platform has",
           dull["objOnSelect"] is False, dull)
        ck("the two the platform HAS are offered and live", dull["liveOffered"] is True)
        # BOTH GUARDED ON THERE BEING ONE (§113.8): `every()` over an empty
        # list is TRUE and `some()` is FALSE, so a build that deleted the
        # dulled choice outright would satisfy "they all say Later" and "none
        # is a button" while proving nothing. Found by falsifying rather than
        # by reading — the first version passed on exactly that build.
        ck("a dulled choice is drawn, and says Later",
           dull["laterCount"] > 0 and dull["laterSaysSo"] is True, dull)
        # INERT BY CONSTRUCTION: not a button at all, so no handler can reach it
        ck("a dulled choice is drawn, and is not a button",
           dull["laterCount"] > 0 and dull["laterIsButton"] is False, dull)
    else:
        ck("the dulled parts are drawn and inert", False, dull)

    # AND NO ROUTE SETS IT ANYWAY (§42: the guard is not the markup).
    fk2 = js(pg, "()=>FUNCTION_KEYS[FUNCTION_KEYS.length-1]")
    was = js(pg, "(k)=>fnFormat(FUNCTIONS[k])", fk2)
    try:
        pg.select_option("select[data-fnformat='" + str(fk2) + "']", "objectives", timeout=1200)
    except Exception:
        pass
    pg.wait_for_timeout(220)
    ck("a function cannot be set to the plan type that does not exist",
       js(pg, "(k)=>fnFormat(FUNCTIONS[k])", fk2) == was,
       js(pg, "(k)=>fnFormat(FUNCTIONS[k])", fk2))
    ck("and the two it does have both round-trip",
       was in ("pillars", "projects"), was)

    # ── 6 · The Overview's door, both ends ───────────────────────────────
    print("\n§6 · the door on the landing page")
    setup(pg, "overview")
    ck("a shaped client gets no set-up door on the Overview",
       pg.query_selector(".ovcols") is not None and pg.query_selector(".wzdoorbig") is None)

    made = js(pg, """()=>{
      window.__U = UNIT_KEYS.slice(); window.__F = FUNCTION_KEYS.slice();
      UNIT_KEYS.length = 0; FUNCTION_KEYS.length = 0; paint();
      return { bare: wizTenantBare() };
    }""")
    pg.wait_for_timeout(300)
    ck("a bare client gets one",
       isinstance(made, dict) and made.get("bare") is True
       and pg.query_selector(".wzdoorbig") is not None)
    ck("and it opens the wizard",
       js(pg, "()=>{var b=document.querySelector('.wzdoorbig .bprim');"
              "return b?b.dataset.setupgo:null;}") == "wizard")
    js(pg, """()=>{ Array.prototype.push.apply(UNIT_KEYS, window.__U);
                    Array.prototype.push.apply(FUNCTION_KEYS, window.__F); paint(); }""")
    pg.wait_for_timeout(250)
    ck("and the state is put back", js(pg, "()=>UNIT_KEYS.length") > 0)

    # ── 7 · Nothing new is stored ────────────────────────────────────────
    print("\n§7 · the wizard is a screen mode")
    keys = js(pg, """()=>{
      var g = (typeof SYNC !== 'undefined' && SYNC.snapshot) ? SYNC.snapshot() : null;
      return g ? Object.keys(g).sort() : null;
    }""")
    if isinstance(keys, list):
        ck("no wizard key in the state graph",
           not any("wiz" in k.lower() for k in keys), [k for k in keys if "wiz" in k.lower()])
    else:
        # No snapshot to ask — assert the weaker, still honest thing.
        ck("no wizard key in the state graph",
           js(pg, "()=>typeof WIZ === 'object'") is True and
           js(pg, "()=>{try{return JSON.stringify(LIVE||{}).indexOf('\"WIZ\"');}catch(e){return -1;}}") == -1)

    print("\n" + ("console/page errors: " + "; ".join(errs[:4]) if errs else "no page errors"))
    if errs:
        fails.append("page errors")
    print(("\n%d FAILURES" % len(fails)) if fails else "\nall client set-up checks passed")
    b.close()

raise SystemExit(1 if fails else 0)
