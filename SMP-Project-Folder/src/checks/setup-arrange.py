"""THE SETUP TABLES ARE ARRANGED, AND THEIR ROWS ACT FROM ONE MENU (§261).

Islam: *"allow me in the setup to rearrange the business units table so they
appear in the navigation as per this order and let's clean this table making a
three dots option to actions like the registry file."*

WHAT IS ASSERTED, AND WHY IT IS ASSERTED THAT WAY:

· THE ORDER IS THE NAVIGATION'S. Never a literal list of keys — the point of
  the feature is that two things AGREE (§94.8), so a real drag is performed
  and the destination row is then read off the chrome and compared with
  `UNIT_KEYS`. A build that reordered the table and left the navigation alone
  passes every "the table moved" assertion and fails this one.

· THE ROW HOLDS A STATUS AND A MENU, and the menu's wording is the FUNCTIONS
  page's, because that page already had it (§93.14) and two neighbouring
  pages saying the same thing two ways is the drift §53.5 exists to stop.

· BOTH ENDS (§94.2). Every "it is drawn" has a viewer for whom it must NOT be:
  a check that only looks for something present cannot see a control offered
  to somebody who may not use it.

· THE DIALOG WRITES, AND CANCEL PUTS BACK. Asked of the DATA after pressing,
  never of the screen (§96) — a field wired to nothing looks identical and
  discards every keystroke. Cancel is asked about a ROLE as well as a field,
  because a head is not stored on the unit (§110) and restoring the row alone
  used to leave the grant standing.

· ARRANGING TURNS THE FILTER AND THE SORT OFF. A search HIDES rows rather than
  removing them and a sort REORDERS them in the DOM, so either one makes a
  drop land somewhere other than where it looks — and what it would commit is
  the navigation, for everybody.

PROVED ABLE TO FAIL (§94.5): run with the shipped pre-§261 file as argv[1] and
every section reports.
"""
import sys
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else \
    "file:///home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html"
if not URL.startswith("file:"):
    URL = "file://" + URL
errs = []
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


def head(t):
    print("\n" + t)


# EVERY PROBE DEGRADES (§215). The first run of a check against the build it
# exists to reject must REPORT, not die: a missing function or an empty list
# index throws, `grep -c FAIL` reads zero, and a falsification looks like a
# pass.
SAFE = """(js) => { try { return eval('(' + js + ')')(); } catch (e) { return {__err:String(e)}; } }"""


def ev(pg, js, arg=None):
    try:
        return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    except Exception as e:
        return {"__err": str(e)}


def go(b, page_name, who=None):
    pg = b.new_page(viewport={"width": 1600, "height": 1000})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');"
                       "localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto(URL)
    pg.wait_for_timeout(1400)
    if who:
        pg.evaluate("(w) => { VIEWER = w; leaveModes(); paint(); }", who)
        pg.wait_for_timeout(250)
    pg.evaluate("""() => { var g = document.querySelector('button[title="Setup"]');
                           if (g) g.click(); }""")
    pg.wait_for_timeout(450)
    pg.evaluate("""(n) => { var b = [].filter.call(
        document.querySelectorAll('.setuprail button'),
        x => x.textContent.indexOf(n) >= 0)[0]; if (b) b.click(); }""", page_name)
    pg.wait_for_timeout(500)
    return pg


def drag(pg, from_i, to_i):
    """A REAL POINTER DRAG. `makeSortable` is pointer-based (arrange.js), and
    dispatching a synthetic commit would test the committer rather than the
    control — §70's rule, that a check which never presses cannot see a
    control nobody can reach."""
    box = pg.evaluate("""(i) => {
      var rs = document.querySelectorAll('.setuppane table tbody tr');
      var g = rs[i] && rs[i].querySelector('.grip');
      if (!g) return null;
      var r = g.getBoundingClientRect();
      return { x: r.x + r.width/2, y: r.y + r.height/2 };
    }""", from_i)
    tgt = pg.evaluate("""(i) => {
      var rs = document.querySelectorAll('.setuppane table tbody tr');
      if (!rs[i]) return null;
      var r = rs[i].getBoundingClientRect();
      return { x: r.x + 40, y: r.y + 4 };
    }""", to_i)
    if not box or not tgt:
        return False
    pg.mouse.move(box["x"], box["y"])
    pg.mouse.down()
    pg.mouse.move(tgt["x"], tgt["y"] + 40, steps=6)
    pg.mouse.move(tgt["x"], tgt["y"], steps=6)
    pg.mouse.up()
    pg.wait_for_timeout(400)
    return True


with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])

    # ══ 1. THE UNITS TABLE IS ONE LINE A UNIT ═══════════════════════════
    head("1 · Business units — the row holds a status and a menu")
    pg = go(b, "Business units")
    st = ev(pg, """() => {
      var t = document.querySelector('table.unitcfg');
      if (!t) return { __err: 'no units table' };
      var rows = [].map.call(t.tBodies[0].rows, r => Math.round(r.getBoundingClientRect().height));
      return {
        rows: rows,
        tallest: Math.max.apply(null, rows),
        kebabs: document.querySelectorAll('[data-umenu]').length,
        units: UNIT_KEYS.length,
        pens: document.querySelectorAll('[data-rowedit^="units|"]').length,
        pagePen: document.querySelectorAll('[data-edit="units"]').length,
        eraser: document.querySelectorAll('[data-clearmenu]').length,
        arrange: document.querySelectorAll('[data-setarrange="units"]').length,
        pills: t.querySelectorAll('tbody .pill').length,
        tables: document.querySelectorAll('.setuppane table').length,
        marks: (document.querySelector('.setuppane') || {}).innerHTML &&
               /Unit marks/.test(document.querySelector('.setuppane').innerHTML),
        overflow: t.parentNode.scrollWidth - t.parentNode.clientWidth,
        tableW: Math.round(t.getBoundingClientRect().width),
        paneW: Math.round(document.querySelector('.setuppane').getBoundingClientRect().width)
      };
    }""")
    if st.get("__err"):
        ck("the units table renders", False, st["__err"])
    else:
        ck("one three-dots button a unit", st["kebabs"] == st["units"],
           "%s of %s" % (st["kebabs"], st["units"]))
        ck("no pen left on any row", st["pens"] == 0, st["pens"])
        ck("the page-level pen is gone", st["pagePen"] == 0, st["pagePen"])
        ck("the eraser stays — it is not a pen (§62)", st["eraser"] == 1, st["eraser"])
        ck("Arrange is on the header line", st["arrange"] == 1, st["arrange"])
        ck("every row wears a status pill", st["pills"] == st["units"],
           "%s of %s" % (st["pills"], st["units"]))
        # A ROW IS A LINE. The register's is 39 and this one carries a second
        # line under the name, so the test is that it is nowhere near the 130
        # a stacked actions cell costs — never an exact number, which a font
        # change would break without anything being wrong (§94.8).
        ck("no row is a stack of controls", st["tallest"] < 70, st["tallest"])
        ck("the Unit marks section is gone", not st["marks"], st["marks"])
        ck("one table on the page, not two", st["tables"] == 1, st["tables"])
        # §158: it FITS, never "and it scrolls".
        ck("the table fits its pane", st["overflow"] == 0,
           "%s over (%s in %s)" % (st["overflow"], st["tableW"], st["paneW"]))

    # ══ 2. THE MENU SAYS WHAT THE FUNCTIONS PAGE SAYS ═══════════════════
    head("2 · The menu, in the Functions page's own words (§53.5)")
    pg.evaluate("""() => { var b = document.querySelectorAll('[data-umenu]')[2];
                           if (b) b.click(); }""")
    pg.wait_for_timeout(300)
    items = ev(pg, """() => { var m = document.querySelector('.kmenu');
      return m ? [].map.call(m.children, e => e.tagName === 'HR' ? '---' : e.textContent.trim())
               : []; }""")
    fnitems = None
    ck("Edit details is first", items[:1] == ["Edit details"] if isinstance(items, list) else False,
       items)
    ck("it carries Clear progress and Clear plan",
       isinstance(items, list) and "Clear progress" in items and "Clear plan" in items, items)
    ck("Retire sits below a rule",
       isinstance(items, list) and "---" in items and
       items.index("---") < items.index("Retire this unit")
       if isinstance(items, list) and "Retire this unit" in items else False, items)
    # A UNIT IS RETIRED AND NEVER DELETED (§62): there is no entry whose
    # refusal would have to be written, so its absence is the assertion.
    ck("no Delete on a unit",
       isinstance(items, list) and not any("Delete" in x for x in items), items)

    # ══ 3. EDIT DETAILS WRITES, AND CANCEL PUTS BACK ════════════════════
    head("3 · The dialog writes the plan, and Cancel undoes it (§96, §110)")
    pg.evaluate("""() => { var b = document.querySelector('[data-rowdlg]'); if (b) b.click(); }""")
    pg.wait_for_timeout(450)
    dlg = ev(pg, """() => {
      var m = document.querySelector('.overlay.on .modal');
      if (!m) return { __err: 'no dialog' };
      return { fields: document.querySelectorAll('#modal-b .pdf').length,
               title: document.getElementById('modal-t').textContent,
               narrow: document.getElementById('overlay').classList.contains('pdlg-on'),
               mark: document.querySelectorAll('#modal-b [data-ulogo]').length,
               head: document.querySelectorAll('#modal-b [data-pick-open]').length,
               menuGone: document.querySelectorAll('.kmenu').length };
    }""")
    if dlg.get("__err"):
        ck("Edit details opens a dialog", False, dlg["__err"])
    else:
        ck("Edit details opens a dialog", dlg["fields"] >= 6, dlg["fields"])
        ck("it is the register's narrower dialog (§122)", dlg["narrow"] is True)
        ck("the mark is in it, and only in it", dlg["mark"] == 1, dlg["mark"])
        ck("both people pickers are in it", dlg["head"] == 2, dlg["head"])
        # Found by opening one and looking at it: openModalHtml covers the page,
        # it does not rebuild it, so the menu stood beside the dialog.
        ck("the menu it was chosen from is gone", dlg["menuGone"] == 0, dlg["menuGone"])

    was = ev(pg, """() => { var k = ROWDLG.key;
      return { key: k, name: UNITS[k].name, px: UNITS[k].codePrefix,
               head: (UNIT_ROLES[k]||{}).head }; }""")
    typed = ev(pg, """() => {
      var i = document.querySelector('#modal-b input[data-uname]');
      if (!i) return { __err: 'no name field' };
      i.value = 'Renamed by the check';
      i.dispatchEvent(new Event('change', { bubbles: true }));
      return { stored: UNITS[ROWDLG.key].name };
    }""")
    ck("typing the name reaches the stored unit",
       typed.get("stored") == "Renamed by the check", typed)
    # THE ROLE, NOT ONLY THE FIELD. A head is a pointer AT the person, so a
    # Cancel that restored the row alone left the grant standing (§110).
    moved = ev(pg, """() => {
      var k = ROWDLG.key;
      var other = PEOPLE.filter(p => p.key !== (UNIT_ROLES[k]||{}).head &&
                                     personActive(p))[0];
      grantPersonRole(other.key, 'owner', k);
      return { head: (UNIT_ROLES[k]||{}).head };
    }""")
    ck("a head can be granted from the dialog",
       moved.get("head") and moved.get("head") != was.get("head"), moved)
    pg.evaluate("""() => { var b = document.querySelector('[data-rowdlg-cancel]');
                           if (b) b.click(); }""")
    pg.wait_for_timeout(400)
    back = ev(pg, """(w) => ({ name: UNITS[w.key].name, head: (UNIT_ROLES[w.key]||{}).head,
                               open: !!document.querySelector('.overlay.on') })""", was)
    ck("Cancel puts the name back", back.get("name") == was.get("name"), back)
    ck("Cancel puts the ROLE back too (§110)", back.get("head") == was.get("head"),
       "%s, was %s" % (back.get("head"), was.get("head")))
    ck("Cancel closes the dialog", back.get("open") is False, back)

    # ══ 4. ARRANGING, AND THE NAVIGATION FOLLOWS ════════════════════════
    head("4 · A real drag, and the navigation agrees with the table (§94.8)")
    before = ev(pg, "() => UNIT_KEYS.slice()")
    pg.evaluate("""() => { var b = document.querySelector('[data-setarrange="units"]');
                           if (b) b.click(); }""")
    pg.wait_for_timeout(400)
    on = ev(pg, """() => ({
      grips: document.querySelectorAll('.setuppane table tbody .grip').length,
      band: !!(document.querySelector('.setuppane .cfg-bar.plain') || {}).textContent,
      bandsays: ((document.querySelector('.setuppane .cfg-lab') || {}).textContent || '').trim(),
      search: document.querySelectorAll('[data-tksearch="units"]').length,
      sortable: !!document.querySelector('tbody.sortable[data-kind="units"]'),
      kebabs: document.querySelectorAll('[data-umenu]').length,
      add: document.querySelectorAll('#addunit').length
    })""")
    ck("every row grows a handle", on.get("grips") == len(before), on)
    ck("the tbody is what sorts", on.get("sortable") is True, on)
    ck("the band says the order is the navigation's",
       "navigation" in (on.get("bandsays") or "").lower(), on.get("bandsays"))
    ck("the search is gone while arranging", on.get("search") == 0, on)
    ck("the three dots step aside", on.get("kebabs") == 0, on)
    ck("Add is not offered mid-drag", on.get("add") == 0, on)

    dragged = drag(pg, len(before) - 1, 0)
    ck("the last row can be dragged to the top", dragged is True)
    after = ev(pg, "() => UNIT_KEYS.slice()")
    ck("the stored list moved", isinstance(after, list) and after != before,
       "%s -> %s" % (before[:3] if isinstance(before, list) else before,
                     after[:3] if isinstance(after, list) else after))
    ck("it is the same units, reordered",
       isinstance(after, list) and sorted(after) == sorted(before),
       "%s vs %s" % (len(after) if isinstance(after, list) else after, len(before)))
    ck("the row that was last is now first",
       isinstance(after, list) and after[0] == before[-1],
       "%s, expected %s" % (after[0] if isinstance(after, list) else after, before[-1]))
    # THE WHOLE POINT, AND IT IS AN AGREEMENT (§94.8). The navigation is read
    # off the chrome the viewer sees, not off the list that was just written.
    nav = ev(pg, """() => [].map.call(
      document.querySelectorAll('.units-in [data-u]'), b => b.dataset.u)
      .filter(k => UNITS[k])""")
    ck("the navigation is in the table's order",
       isinstance(nav, list) and isinstance(after, list) and
       nav == [k for k in after if k in nav], "%s vs %s" % (nav, after))
    pg.evaluate("""() => { var b = document.querySelector('[data-setarrange="units"]');
                           if (b) b.click(); }""")
    pg.wait_for_timeout(350)
    off = ev(pg, """() => ({ grips: document.querySelectorAll('.setuppane .grip').length,
                             kebabs: document.querySelectorAll('[data-umenu]').length,
                             search: document.querySelectorAll('[data-tksearch="units"]').length })""")
    ck("Done puts the handles away", off.get("grips") == 0, off)
    ck("Done gives the menu and the search back",
       off.get("kebabs") == len(before) and off.get("search") == 1, off)
    pg.close()

    # ══ 5. BOTH ENDS: SOMEBODY WHO MAY NOT EDIT ═════════════════════════
    head("5 · And none of it is drawn for somebody who may not (§94.2)")
    pg = b.new_page(viewport={"width": 1600, "height": 1000})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');"
                       "localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto(URL)
    pg.wait_for_timeout(1400)
    # A REAL VIEWER, NOT A DOCTORED CELL. The first version of this narrowed
    # `ACCESS.super.c_units` and asserted the absences — and every one of them
    # failed, because the bootstrap SMO holds a second role and `grant()`
    # answers with the MOST GENEROUS across the roles somebody holds. Narrowing
    # one row of the matrix does not narrow the person; picking somebody who
    # genuinely may not edit does, and it is the state a client is actually in.
    shut = ev(pg, """() => {
      /* ASKED OF THE RULE, PERSON BY PERSON, rather than reasoned about from a
         role list: `grant()` answers for the CURRENT viewer and takes the most
         generous across every role they hold, so the only honest way to find
         somebody who cannot edit is to become each of them and ask. The first
         attempt filtered on `personRoles` and landed on the SMO, who holds a
         second role — the check reported the product broken (§94.5's mirror:
         a measurement wrong towards "broken" costs as much as one wrong
         towards "clean"). */
      var was = VIEWER, found = null;
      for (var i = 0; i < PEOPLE.length; i++) {
        VIEWER = PEOPLE[i].key;
        if (grant('c_units') !== 'edit') { found = PEOPLE[i].key; break; }
      }
      if (!found) { VIEWER = was; return { __err: 'everybody may edit' }; }
      leaveModes(); paint();
      return { who: found, grant: grant('c_units'), html: renderUnits() };
    }""")
    if shut.get("__err"):
        ck("the page renders read-only", False, shut["__err"])
    else:
        h = shut.get("html") or ""
        ck("the viewer really cannot edit", shut.get("grant") != "edit",
           "%s reads %s" % (shut.get("who"), shut.get("grant")))
        ck("read-only, so no three dots", "data-umenu" not in h)
        ck("read-only, so no Arrange", "data-setarrange" not in h)
        ck("read-only, so no eraser", "data-clearmenu" not in h)
        ck("but the units are still listed", h.count("<tr") >= 5, h.count("<tr"))
        # BOTH ENDS IN ONE BREATH (§94.2). Every assertion above is an ABSENCE,
        # and on a build where none of these controls exists at all they are
        # every one of them true — which is exactly the build this file exists
        # to reject. The same page rendered WITH the grant is what makes them
        # mean anything.
        opened = ev(pg, """() => {
          VIEWER = PEOPLE.filter(function(p){ return p.role === 'super'; })[0].key;
          leaveModes(); paint(); return renderUnits(); }""")
        o_ = opened if isinstance(opened, str) else ""
        ck("...and all three are there with the grant",
           "data-umenu" in o_ and "data-setarrange" in o_ and "data-clearmenu" in o_,
           [x for x in ("data-umenu", "data-setarrange", "data-clearmenu") if x not in o_])
    pg.close()

    # ══ 6. FUNCTIONS: THE SAME HANDLE, THE SAME WORD FOR EDITING ════════
    head("6 · Functions — arranged the same way, and one word for editing")
    pg = go(b, "Functions")
    fn = ev(pg, """() => ({
      arrange: document.querySelectorAll('[data-setarrange="fns"]').length,
      dlg: document.querySelectorAll('[data-rowdlg^="fns|"]').length,
      old: document.querySelectorAll('[data-rowedit^="fns|"]').length,
      inline: document.querySelectorAll('.setuppane input[data-fname]').length,
      keys: FUNCTION_KEYS.length
    })""")
    ck("Functions has Arrange too", fn.get("arrange") == 1, fn)
    ck("no inline field is left on its rows", fn.get("inline") == 0, fn)
    pg.evaluate("""() => { var b = document.querySelectorAll('[data-fnmenu]')[0];
                           if (b) b.click(); }""")
    pg.wait_for_timeout(300)
    fnitems = ev(pg, """() => { var m = document.querySelector('.kmenu');
      return m ? [].map.call(m.children, e => e.tagName === 'HR' ? '---' : e.textContent.trim())
               : []; }""")
    ck("its menu says Edit details, like the units'",
       isinstance(fnitems, list) and "Edit details" in fnitems, fnitems)
    ck("a function may still be deleted (§62), unlike a unit",
       isinstance(fnitems, list) and any("Delete" in x for x in fnitems), fnitems)
    fbefore = ev(pg, "() => FUNCTION_KEYS.slice()")
    pg.evaluate("""() => { var b = document.querySelector('[data-setarrange="fns"]');
                           if (b) b.click(); }""")
    pg.wait_for_timeout(400)
    fon = ev(pg, """() => ({
      grips: document.querySelectorAll('.setuppane table tbody .grip').length,
      sortable: !!document.querySelector('tbody.sortable[data-kind="fns"]'),
      sortHeads: document.querySelectorAll('[data-tksort]').length,
      search: document.querySelectorAll('[data-tksearch="fns"]').length })""")
    ck("its rows grow handles", fon.get("grips") == len(fbefore), fon)
    # A SORTED TABLE CANNOT BE ARRANGED: tkSort reorders the DOM, so a drop
    # between two visible rows would commit whatever the sort had done.
    ck("sorting is off while arranging", fon.get("sortHeads") == 0, fon)
    ck("search is off while arranging", fon.get("search") == 0, fon)
    drag(pg, len(fbefore) - 1, 0)
    fafter = ev(pg, "() => FUNCTION_KEYS.slice()")
    ck("the functions' stored order moved",
       isinstance(fafter, list) and fafter != fbefore and sorted(fafter) == sorted(fbefore),
       "%s -> %s" % (fbefore, fafter))
    fnav = ev(pg, """() => { NAVSIDE = 'fns'; paint();
      return [].map.call(document.querySelectorAll('.units-in [data-u]'), b => b.dataset.u)
        .filter(k => String(k).indexOf('fn:') === 0).map(k => k.slice(3)); }""")
    ck("the functions in the navigation follow too",
       isinstance(fnav, list) and isinstance(fafter, list) and
       fnav == [k for k in fafter if k in fnav], "%s vs %s" % (fnav, fafter))
    pg.close()

    # ══ 7. COMPANIES: THE MENU, AND THE REFUSAL INSIDE IT ═══════════════
    head("7 · Companies — two entries, and the refusal names what is in the way")
    pg = go(b, "Companies")
    co = ev(pg, """() => ({
      kebabs: document.querySelectorAll('[data-comenu]').length,
      keys: COMPANY_KEYS.length,
      pens: document.querySelectorAll('[data-rowedit^="companies|"]').length,
      chip: /holds \\d+ business unit|holds \\d+ unit/.test(
              document.querySelector('.setuppane').innerHTML),
      grips: document.querySelectorAll('.setuppane .grip').length,
      arrange: document.querySelectorAll('[data-setarrange]').length
    })""")
    ck("one three-dots button a company", co.get("kebabs") == co.get("keys"), co)
    ck("no pen left on its rows", co.get("pens") == 0, co)
    ck("the refusal chip has left the row", co.get("chip") is False, co)
    # A company has no order in the navigation, so a handle would reorder
    # something nobody sees (§45.2).
    ck("no handle, because a company has no order", co.get("arrange") == 0, co)
    pg.evaluate("""() => { var b = document.querySelectorAll('[data-comenu]')[0];
                           if (b) b.click(); }""")
    pg.wait_for_timeout(300)
    coitems = ev(pg, """() => { var m = document.querySelector('.kmenu');
      return m ? [].map.call(m.children, e => e.tagName === 'HR' ? '---' : e.textContent.trim())
               : []; }""")
    ck("its menu is Edit details and Retire",
       isinstance(coitems, list) and "Edit details" in coitems and
       any("Retire" in x for x in coitems), coitems)
    pg.evaluate("""() => { var b = document.querySelector('[data-coclear]'); if (b) b.click(); }""")
    pg.wait_for_timeout(350)
    ref = ev(pg, """() => { var m = document.querySelector('.kconfirm');
      return m ? m.textContent.trim() : ''; }""")
    # §62: the entry stays LIVE and the press names what is in the way, which
    # a dotted chip in the row could never do.
    ck("pressing Retire names the units in the way",
       isinstance(ref, str) and "cannot be retired" in ref and "business unit" in ref, ref[:120])
    pg.close()
    b.close()

print("\nPage errors: %s" % (errs if errs else "none"))
print("FAILURES: %d" % bad)
sys.exit(1 if bad else 0)
