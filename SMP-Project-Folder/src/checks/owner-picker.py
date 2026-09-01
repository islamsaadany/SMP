"""Owners and collaborators are picked from the register (§130.1).

WHAT THIS ASSERTS IS THAT PRESSING THE CONTROL CHANGES THE DATA, which is the
only question that separates a bound field from a decorative one (§96): the
objectives editor rendered twenty inputs, four Remove buttons and an Add for
eleven versions, all of them wired to nothing, and every check in the suite was
green because every check asked whether the fields were THERE.

So each of the five fields is opened through its real search popup, a value is
picked or ticked, and the STATE GRAPH is read back afterwards.

BOTH ENDS, EVERY TIME (§94.2). A check that only looks for something present
cannot see a control that should not be drawn — so the pen is closed again and
the absence of every select is asserted, or a build that put the owner picker
on a page nobody may author would pass this file.

AND THE CONTROL IS PRESSED WHERE IT SITS. `elementFromPoint` at each button's
own centre must return that button: the register's role picker was present,
enabled, correctly sized and landing under the Email field for a whole version,
and every DOM check passed on it (§93.4, §110).

Run: SMP_CHROME=... python3 qa-run.py checks/owner-picker.py
"""
import pathlib
from playwright.sync_api import sync_playwright

URL = "file://" + str(pathlib.Path(
    pathlib.Path(__file__).resolve().parent.parent,
    "strategy-management-platform.html").resolve())

fails = []
errs = []


def ck(name, ok, extra=""):
    print(("  ok   " if ok else "  FAIL ") + name + ((" — " + str(extra)) if extra else ""))
    if not ok:
        fails.append(name)


def show_units(pg):
    el = pg.query_selector('#units [data-u="mobile"]')
    if el and el.is_visible():
        return
    sw = pg.query_selector("#units .navswitch .nsw:not(.on)")
    if sw:
        sw.click(); pg.wait_for_timeout(250)


def show_fns(pg):
    el = pg.query_selector('#units [data-u="fn:marketing"]')
    if el and el.is_visible():
        return
    sw = pg.query_selector("#units .navswitch .nsw:not(.on)")
    if sw:
        sw.click(); pg.wait_for_timeout(250)


def open_plan(pg):
    show_units(pg)
    pg.click('#units [data-u="mobile"]'); pg.wait_for_timeout(350)
    pg.click('#secrow-in [data-sub2="plan"]'); pg.wait_for_timeout(350)


def pen(pg):
    b = pg.query_selector(".pane .paneact .penbtn")
    assert b, "no pen on the pane"
    b.click(); pg.wait_for_timeout(500)


class Missing(Exception):
    """A control this section is about is not on the page at all."""


def press(pg, handle, what):
    """Open a control's search popup the way a person does — scrolled into view
    and clicked, never dispatched at an element that may be off screen (§70).

    AND IT REFUSES RATHER THAN CRASHES when the control is absent, so a build
    without it FAILS this file with the reason instead of throwing halfway
    through and leaving every later assertion unrun (§51.11's family: a check
    that stops early has quietly measured less than it claims)."""
    if handle is None:
        ck(what + " is on the page at all", False, "no such control")
        raise Missing(what)
    handle.scroll_into_view_if_needed()
    pg.wait_for_timeout(120)
    handle.click()
    pg.wait_for_timeout(300)


def btn_for(pg, selector):
    """The ssbtn a select was given. Held by reference in searchsel.js, so it is
    asked for by walking back from the select rather than guessed at."""
    return pg.evaluate_handle(
        "(s)=>{const el=document.querySelector(s);"
        "return el ? el.previousElementSibling : null;}", selector).as_element()


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1500, "height": 1000})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))
    pg.on("console", lambda m: errs.append("CONSOLE: " + m.text) if m.type == "error" else None)
    pg.goto(URL); pg.wait_for_timeout(900)
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(400)

    # ── 1 · both ends: the pen closed draws none of it ──────────────────
    print("\n1 · with the pen closed")
    open_plan(pg)
    ck("no owner picker without the pen",
       pg.eval_on_selector_all(".pane select.ownersel", "e=>e.length") == 0)
    ck("no collaborators picker without the pen",
       pg.eval_on_selector_all(".pane select.collabsel", "e=>e.length") == 0)
    ck("the owner still READS on the page",
       "Ramy Behairy" in pg.inner_text(".pane"))

    # ── 2 · with the pen on, every owner is a list ──────────────────────
    print("\n2 · with the pen on")
    pen(pg)
    n = pg.evaluate("""()=>{
      const tbl=[...document.querySelectorAll('.pane table')]
        .find(t=>/TACTIC/i.test(t.tHead.textContent));
      const rows=[...tbl.tBodies[0].rows].filter(r=>r.querySelector('[data-oi]')!==null||r.dataset.oi!==undefined);
      return {tactics:rows.length,
              owners:tbl.querySelectorAll('select.ownersel').length,
              collabs:tbl.querySelectorAll('select.collabsel').length,
              typed:tbl.querySelectorAll('td:nth-child(3) input').length,
              pillar:document.querySelectorAll('.pane .pfront.one select.ownersel').length};}""")
    ck("every tactic's owner is a list", n["owners"] == n["tactics"] and n["owners"] > 0, n)
    ck("every tactic's collaborators is a list", n["collabs"] == n["tactics"], n)
    ck("no typed owner box is left behind", n["typed"] == 0, n)
    ck("the pillar's own owner is a list, and there is one", n["pillar"] == 1, n)

    # ── 3 · the list says where each name comes from ────────────────────
    print("\n3 · the list")
    shape = pg.evaluate("""()=>{
      const s=document.querySelector('.pane select.ownersel');
      if (!s) return null;
      const groups=[...s.querySelectorAll('optgroup')].map(g=>g.label);
      const people=[...s.querySelectorAll('optgroup[label="People"] option')].map(o=>o.text);
      const depts=[...s.querySelectorAll('optgroup[label="Departments"] option')].map(o=>o.text);
      const dn=displayNames();
      const reg=PEOPLE.filter(p=>personActive(p)).map(p=>knownName(p,dn));
      return {groups, blank:s.options[0].value==="" , people:people.length,
              regOnly:people.filter(x=>reg.indexOf(x)<0),
              missing:reg.filter(x=>people.indexOf(x)<0),
              depts, sorted:people.slice().sort((a,b)=>a.localeCompare(b)).join("|")===people.join("|")};}""")
    ck("there is a list to look at", shape is not None, "no owner picker at all")
    shape = shape or {"groups": [], "blank": False, "regOnly": ["-"], "missing": ["-"],
                      "depts": [], "sorted": False}
    ck("People and Departments, in that order",
       shape["groups"][:2] == ["People", "Departments"], shape["groups"])
    ck("a single owner can be cleared", shape["blank"])
    # THE REGISTER'S **Name** COLUMN, not the full legal name (§130.7). Every
    # person in the demo has a short full name, so on this data the two are the
    # same string and this assertion cannot tell them apart — section 10 below
    # makes a register where they differ.
    ck("the People group is the register's Name column, exactly",
       not shape["regOnly"] and not shape["missing"],
       {"not on the register": shape["regOnly"], "missing from the list": shape["missing"]})
    ck("the People group is sorted", shape["sorted"])
    ck("the Departments group speaks the navigation's words",
       "Mobile" in shape["depts"] and "IT Dist." in shape["depts"], shape["depts"][:6])
    # ── 3b · where somebody works, beside their name (§130.9) ──────────
    hint = pg.evaluate("""()=>{
      const s=document.querySelector('.pane select.ownersel');
      const os=[...s.querySelectorAll('optgroup[label="People"] option')];
      const dn=displayNames();
      const want={}; PEOPLE.filter(p=>personActive(p)).forEach(p=>{
        const at=personAt(p);
        want[knownName(p,dn)] = (at && at!=="group") ? placeLabel(at) : "";});
      return {wrong: os.filter(o=>(o.dataset.hint||"")!==want[o.text]).map(o=>o.text),
              withPlace: os.filter(o=>o.dataset.hint).length,
              inText: os.filter(o=>/\u2014|\u2013| - /.test(o.text)).length};}""")
    ck("every name carries where that person works, and none carries a wrong one",
       not hint["wrong"], hint["wrong"][:4])
    ck("...and it is actually filled in", hint["withPlace"] > 0, hint)
    ck("the place is NOT part of the name that gets stored",
       hint["inText"] == 0, hint)
    ck("a unit and a function sharing a name stay apart",
       "Care" in shape["depts"] and "Care (function)" in shape["depts"], shape["depts"])

    # ── 4 · pressing it changes the data ────────────────────────────────
    print("\n4 · pressing it")
    try:
        before = pg.evaluate("()=>UNITS.mobile.items[0].tactics[0].owner")
        sel = ".pane table tbody tr:first-child select.ownersel"
        press(pg, btn_for(pg, sel), "the tactic owner picker")
        ck("the popup is the one control, opened", pg.query_selector(".sspop") is not None)
        hit = pg.evaluate("""()=>{const bt=document.querySelector('.pane table tbody tr:first-child select.ownersel')
            .previousElementSibling, r=bt.getBoundingClientRect();
          const at=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2);
          return at===bt||bt.contains(at);}""")
        ck("the owner button is what a click at its centre reaches", hit)
        pg.keyboard.type("Hazem"); pg.wait_for_timeout(250)
        shown = pg.eval_on_selector_all(".sspop .ssrow:not([hidden])", "e=>e.map(x=>x.textContent)")
        ck("typing filters in place", shown and all("hazem" in t.lower() for t in shown), shown)
        ck("an empty group is not left standing over nothing",
           pg.eval_on_selector_all(".sspop .ssgrp:not([hidden])", "e=>e.length") == 1)
        pg.click(".sspop .ssrow:not([hidden])"); pg.wait_for_timeout(350)
        after = pg.evaluate("()=>UNITS.mobile.items[0].tactics[0].owner")
        ck("picking an owner writes it to the plan", after == "Hazem Roushdy" and after != before,
           {"was": before, "now": after})
        # THE HINT IS A HINT (§130.9): what lands in the plan is the name
        # alone, or namedOn() could not resolve it and §130.1 undoes itself.
        ck("the place beside it is not written into the plan",
           after == after.strip() and "Logistics" not in after, after)
        ck("a single pick closes the list", pg.query_selector(".sspop") is None)
        # A HINT YOU CAN SEE AND CANNOT SEARCH FOR IS HALF A CONTROL (§130.9).
        press(pg, btn_for(pg, sel), "the tactic owner picker")
        pg.keyboard.type("Nigeria"); pg.wait_for_timeout(250)
        found = pg.eval_on_selector_all(".sspop .ssrow:not([hidden])",
                                        "e=>e.map(x=>x.childNodes[0].textContent)")
        ck("typing a place finds the people who work there",
           any(t != "Nigeria" for t in found), found[:6])
        pg.keyboard.press("Escape"); pg.wait_for_timeout(200)

    except Missing:
        pass

    # ── 5 · ticking several, and untick to nobody ───────────────────────
    print("\n5 · collaborators")
    try:
        csel = ".pane table tbody tr:first-child select.collabsel"
        press(pg, btn_for(pg, csel), "the collaborators picker")
        ck("the ticking list says so", pg.query_selector(".sspop.ssmany") is not None)
        ck("no em-dash to tick", pg.eval_on_selector_all(
            ".sspop.ssmany .ssrow", "e=>e.filter(r=>r.textContent.trim()==='—').length") == 0)
        names = pg.evaluate("""()=>{const rs=[...document.querySelectorAll('.sspop .ssrow')];
          /* THE ROW'S NAME IS ITS FIRST TEXT NODE. The place beside it is a
             span inside the same button (§130.9), so textContent would read
             "Amaka EzeNigeria" and this would compare it against a stored
             value that is correctly the name alone. */
          const nm=r=>r.childNodes[0].textContent;
          rs[0].click(); rs[2].click(); return [nm(rs[0]), nm(rs[2])];}""")
        pg.wait_for_timeout(300)
        got = pg.evaluate("()=>UNITS.mobile.items[0].tactics[0].collaborators")
        ck("two ticks write two collaborators", got == names, {"ticked": names, "stored": got})
        ck("ticking does NOT close the list", pg.query_selector(".sspop") is not None)
        ck("the cell says who, without a repaint",
           pg.eval_on_selector(csel, "s=>s.previousElementSibling.querySelector('.sslabel').textContent")
           == ", ".join(names))
        pg.evaluate("()=>{const rs=[...document.querySelectorAll('.sspop .ssrow')];rs[0].click();rs[2].click();}")
        pg.wait_for_timeout(300)
        ck("unticking everything DELETES the key, never leaves an empty list (§50.6)",
           pg.evaluate("()=>'collaborators' in UNITS.mobile.items[0].tactics[0]") is False)
        pg.keyboard.press("Escape"); pg.wait_for_timeout(250)
        ck("Escape closes a ticking list", pg.query_selector(".sspop") is None)

    except Missing:
        pass

    # ── 6 · the pillar's owner, and it is not said twice ────────────────
    print("\n6 · the pillar's owner")
    try:
        psel = ".pane .pfront.one select.ownersel"
        was = pg.evaluate("()=>UNITS.mobile.items[0].owner")
        press(pg, btn_for(pg, psel), "the pillar owner picker")
    # A DEPARTMENT NOBODY SITS IN, deliberately: the place now joins what
        # is searched (§130.9), so "Nigeria" would match the people who work
        # there as well as the unit and this would pick whichever came first.
        pg.keyboard.type("Risk"); pg.wait_for_timeout(250)
        pg.click(".sspop .ssrow:not([hidden])"); pg.wait_for_timeout(350)
        now = pg.evaluate("()=>UNITS.mobile.items[0].owner")
        ck("a pillar's owner can be a department", now == "Risk" and now != was, {"was": was, "now": now})
        ck("the meta line above does not repeat it while it is being edited",
           pg.eval_on_selector_all(".pane .ptitle .pmeta", "e=>e.map(x=>x.textContent).join('')").find("Risk") < 0)

    except Missing:
        pass

    # ── 7 · a value already on the plan (§96.2)
    print("\n7 · a value already on the plan (§96.2)")
    try:
        pg.evaluate("""()=>{UNITS.mobile.items[0].tactics[1].owner='Zzz Someone Long Gone'; paint();}""")
        pg.wait_for_timeout(400)
        kept = pg.evaluate("""()=>{const s=[...document.querySelectorAll('.pane table tbody tr')]
            .map(r=>r.querySelector('select.ownersel')).filter(Boolean)[1];
          if (!s) return null;
          const g=[...s.querySelectorAll('optgroup')].map(x=>x.label);
          const o=[...s.options].find(o=>o.selected);
          return {groups:g, chosen:o&&o.text,
                  inKept:!![...s.querySelectorAll('optgroup[label="Already on this plan"] option')]
                    .find(x=>x.text==='Zzz Someone Long Gone')};}""")
        ck("there is a second owner list to look at", kept is not None)
        kept = kept or {"groups": [], "chosen": None, "inKept": False}
        ck("it is kept, in a group that says what it is",
           kept["inKept"] and kept["groups"][:1] == ["Already on this plan"], kept)
        ck("and it is what the cell shows", kept["chosen"] == "Zzz Someone Long Gone", kept)

    except Missing:
        pass

    # ── 8 · the function's side: a project and its milestones ───────────
    print("\n8 · a capability's projects")
    try:
        show_fns(pg)
        pg.click('#units [data-u="fn:marketing"]'); pg.wait_for_timeout(400)
        pg.click('#secrow-in [data-sub2="proj"]'); pg.wait_for_timeout(400)
        pen(pg)
        f = pg.evaluate("""()=>({
          front:document.querySelectorAll('.pane .pfront select.ownersel').length,
          ms:[...document.querySelectorAll('.pane table')]
              .filter(t=>/MILESTONE/i.test(t.tHead.textContent))
              .reduce((n,t)=>n+t.querySelectorAll('select.ownersel').length,0),
          typed:document.querySelectorAll('.pane .pfront input').length});""")
        ck("a project's owner is a list", f["front"] >= 1, f)
        ck("every milestone's owner is a list", f["ms"] >= 1, f)
        psel2 = ".pane .pfront select.ownersel"
        pid = pg.evaluate("()=>{const c=GROUP.capabilities.find(c=>c.fn==='marketing');return c.projects[0].id;}")
        press(pg, btn_for(pg, psel2), "the project owner picker")
        pg.keyboard.type("Dina"); pg.wait_for_timeout(250)
        pg.click(".sspop .ssrow:not([hidden])"); pg.wait_for_timeout(350)
        ck("picking a project's owner writes it",
           pg.evaluate("(id)=>GROUP.capabilities.find(c=>c.fn==='marketing').projects.find(p=>p.id===id).owner", pid)
           == "Dina Shawky")

        # §224: COLLABORATORS BESIDE THE OWNER — the tactic's ticking list on
        # the milestone row, pressed and read back from the DATA (§96: an
        # editor wired to nothing looks identical and discards every tick).
        f2 = pg.evaluate("""()=>({
          mscol:[...document.querySelectorAll('.pane table')]
              .filter(t=>/MILESTONE/i.test(t.tHead.textContent))
              .reduce((n,t)=>n+t.querySelectorAll('select.collabsel').length,0),
          msrows:[...document.querySelectorAll('.pane table')]
              .filter(t=>/MILESTONE/i.test(t.tHead.textContent))
              .reduce((n,t)=>n+t.querySelectorAll('tbody tr:not(.newrow)').length,0)});""")
        ck("every milestone's collaborators is a ticking list",
           f2["mscol"] == f2["msrows"] and f2["mscol"] >= 1, f2)
        msel = ".pane table select.collabsel"
        press(pg, btn_for(pg, msel), "the milestone collaborators picker")
        ck("the ticking list says so (milestone)", pg.query_selector(".sspop.ssmany") is not None)
        mnames = pg.evaluate("""()=>{const rs=[...document.querySelectorAll('.sspop .ssrow')];
          const nm=r=>r.childNodes[0].textContent;
          rs[0].click(); rs[2].click(); return [nm(rs[0]), nm(rs[2])];}""")
        pg.wait_for_timeout(300)
        mgot = pg.evaluate("""(id)=>{const c=GROUP.capabilities.find(c=>c.fn==='marketing');
          const p=c.projects.find(p=>p.id===id); return p.milestones[0].collaborators;}""", pid)
        ck("two ticks write two milestone collaborators", mgot == mnames,
           {"ticked": mnames, "stored": mgot})
        pg.evaluate("()=>{const rs=[...document.querySelectorAll('.sspop .ssrow')];rs[0].click();rs[2].click();}")
        pg.wait_for_timeout(300)
        ck("unticking everything DELETES the milestone's key (§50.6)",
           pg.evaluate("""(id)=>{const c=GROUP.capabilities.find(c=>c.fn==='marketing');
             const p=c.projects.find(p=>p.id===id);
             return 'collaborators' in p.milestones[0];}""", pid) is False)
        pg.keyboard.press("Escape"); pg.wait_for_timeout(250)

    except Missing:
        pass

    # ── 10 · a register whose Name and Full Name differ ─────────────────
    # MADE, because the demo cannot show this (§94.2): all 33 people have a
    # full name of two or three words and nobody has typed a short one, so
    # knownName() returns p.name for every row and a build listing the WRONG
    # one of the two looks identical. This is the tenant Islam is on.
    print("\n10 · a register with long names (made)")
    pg.evaluate("""()=>{
      const a=PEOPLE.filter(p=>personActive(p))[0], b=PEOPLE.filter(p=>personActive(p))[1];
      window.__A=a.key; window.__B=b.key;
      a.__was=a.name; b.__was=b.name; b.__wasKnown=b.known;
      a.name="Abd El Moniem Mohamed Abd El Moniem Mahmoud"; delete a.known;
      b.name="Testcase Longlegal Name Of Somebody"; b.known="Testcase Short";
      paint();}""")
    pg.wait_for_timeout(450)
    open_plan(pg); pen(pg)
    lst = pg.evaluate("""()=>{const s=document.querySelector('.pane select.ownersel');
      return [...s.querySelectorAll('optgroup[label="People"] option')].map(o=>o.text);}""")
    ck("a long full name is listed by its first two names",
       "Abd El Moniem Mohamed" in lst and
       "Abd El Moniem Mohamed Abd El Moniem Mahmoud" not in lst,
       [x for x in lst if x.startswith("Abd")])
    ck("a typed Name wins over the guess",
       "Testcase Short" in lst and "Testcase Longlegal" not in lst,
       [x for x in lst if "Testcase" in x])

    # AND THE RULES MUST RECOGNISE WHAT THE PICKER WRITES — both ends (§94.2).
    # A label the platform cannot match is exactly the fault §130.1 was built
    # to fix: 32 of 78 tactics owned by somebody nobody could resolve.
    try:
        press(pg, btn_for(pg, ".pane table tbody tr:first-child select.ownersel"),
              "the tactic owner picker")
        pg.keyboard.type("Abd El Moniem"); pg.wait_for_timeout(250)
        pg.click(".sspop .ssrow:not([hidden])"); pg.wait_for_timeout(350)
        both = pg.evaluate("""()=>{const t=UNITS.mobile.items[0].tactics[0];
          return {stored:t.owner,
                  rule:SMPRules.namedOn(t, personBy(window.__A)),
                  full:SMPRules.namedOn({owner:personBy(window.__A).name},
                                        personBy(window.__A)),
                  typed:SMPRules.namedOn({owner:"Testcase Short"}, personBy(window.__B)),
                  first:SMPRules.namedOn({owner:"Abd"}, personBy(window.__A))};}""")
        ck("the short name is what is stored", both["stored"] == "Abd El Moniem Mohamed", both)
        ck("...and the shared rule says that names them", both["rule"], both)
        ck("a plan that already holds the FULL name still names them", both["full"], both)
        ck("a typed Name names them too", both["typed"], both)
        ck("one name still names nobody", not both["first"], both)
    except Missing:
        pass
    pg.evaluate("""()=>{const a=personBy(window.__A), b=personBy(window.__B);
      a.name=a.__was; delete a.__was;
      b.name=b.__was; delete b.__was;
      if (b.__wasKnown) b.known=b.__wasKnown; else delete b.known;
      delete b.__wasKnown; paint();}""")
    pg.wait_for_timeout(300)

    ck("no console errors anywhere in this walk", not errs, errs[:4])
    pg.close()

    # ── 9 · a list is wider than a box, and the table must not grow ─────
    # §110.8: `max-width:100%` on a field in an auto-layout table does
    # nothing at all, and the register's rows painted 21px over their
    # neighbours the moment a pen was pressed. The plan's tables have never
    # been asked this, and swapping two typed boxes for two controls that
    # size to a NAME is exactly when to ask (§27.1: at more than one width).
    print("\n9 · opening the pen must not move the table")
    for w in (1500, 1280, 1000):
        pg = b.new_page(viewport={"width": w, "height": 1000})
        pg.goto(URL); pg.wait_for_timeout(900)
        pg.select_option("#asWho", "smo"); pg.wait_for_timeout(400)
        open_plan(pg)
        measure = """()=>{const t=[...document.querySelectorAll('.pane table')]
            .find(x=>/TACTIC/i.test(x.tHead.textContent));
          return {table:Math.round(t.getBoundingClientRect().width),
                  sideways:document.documentElement.scrollWidth >
                           document.documentElement.clientWidth};}"""
        off = pg.evaluate(measure)
        pen(pg)
        on = pg.evaluate(measure)
        ck("at %dpx the tactics table holds its width with the pen on" % w,
           on["table"] == off["table"], {"closed": off["table"], "open": on["table"]})
        ck("at %dpx nothing scrolls sideways" % w, not on["sideways"])
        pg.close()
    b.close()

print("\n" + ("FAILED: " + ", ".join(fails) if fails else "all owner-picker checks passed"))
raise SystemExit(1 if fails else 0)
