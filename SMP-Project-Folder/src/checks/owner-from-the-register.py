"""AN OWNER IS PICKED FROM THE REGISTER, NEVER TYPED (§551).

Islam, after the El Abd move turned up a direction owned by "Tamer Abdelhamid"
while the register holds "Tamer Abdelhameed" (§542.6): *"the owner should be
selected from a drop down, generally all the owners shouldn't be written by
hand and only be selected from a list from the registr in a drop down
serachable list."*

THE SCREENS ALREADY PICKED, and this file says so rather than pretending the
whole thing was a gap: the four owner cells on the plan surfaces have been fed
by `ownerChoices` since §130.7. What is asserted here is the three things that
were NOT true:

  * THE COPILOT'S DRAFT TABLE PICKS TOO. It was the one free-text owner box
    left in the product, and that draft is saved into a real plan, so a name
    typed there became a name on the plan matching nobody;
  * A NAME THAT MATCHES NOBODY IS FLAGGED WHERE IT SHOWS, and the name STAYS.
    Islam's choice of the three he was shown. Asserted both ways: a real name
    gets no mark, a stray gets one, AND the stray's own text survives — a
    check that only looked for the mark would be satisfied by deleting the
    name, which is the one outcome the choice forbids;
  * AND THE DROPDOWN STOPPED LYING ABOUT IT. An unknown value was offered back
    under "Already on this plan" — a label that reads as a fact about the plan
    rather than a warning about the name, which is how "Tamer Abdelhamid"
    looked legitimate to everyone who ever opened that cell;
  * THE WORKBOOK'S FIVE OWNER COLUMNS ARE DROPDOWNS OF THE REGISTER. 22
    validations in the two plan files and not one was Owner. Asserted as five
    named ranges pointing at an Owners sheet that is actually in the file —
    §65's rule, a range on a missing sheet being worse than none;
  * IT IS A `from` RANGE AND NOT AN INLINE LIST, because 58 names is far past
    Excel's 255-character limit where a dropdown is silently ignored (§67.5);
  * AND NOTHING IS WRITTEN WHEN THE REGISTER IS EMPTY, which is §380's trap:
    an empty list still applies and refuses every value there is, so the
    column could be neither picked from nor typed into;
  * A TYPED NAME IS REFUSED AT THE UPLOAD, in both plan files, naming the row
    and the name — Islam's choice for this surface. And a BLANK owner is not a
    stray: it is a gap, which the fill walk and the word Missing already own,
    so asserting it raises nothing keeps two complaints off one cell;
  * ONE PLACE ASKS THE QUESTION (§53.5): the flag, the dropdown's grouping and
    the import refusal all go through `ownerKnownSet`, so a name cannot be
    refused at the upload and offered in the pen.

SMP_BUILT points it at another build, so it can be run against the build
before (§276: a broken build is made from the SOURCES).
"""
import os, re
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or os.path.join(
    os.path.dirname(__file__), "..", "strategy-management-platform.html")
URL = "file://" + os.path.abspath(BUILT)

bad = 0
def ck(w, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — %s" % (x,)) if not ok and x != "" else ""))

def ev(pg, js, dflt=None, arg=None):
    try:
        return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    except Exception as e:
        return dflt if dflt is not None else {"err": str(e)[:120]}

print("\n§1 · read out of the build itself")
src = open(os.path.abspath(BUILT), encoding="utf-8").read()
code = re.sub(r"/\*.*?\*/", " ", src, flags=re.S)
code = re.sub(r"(?m)^\s*//.*$", " ", code)
ck("the Copilot's owner cell is a picker, not a text box",
   'data-cop-ex-t="\' + i + \'|owner" aria-label="Owner">' in code
   and '<input class="fld" data-cop-ex-t=\' + i + \'|owner"' not in code)
ck("...and nothing in the product still offers a stray as \"Already on this plan\"",
   "Already on this plan" not in code)
ck("the question is asked in ONE place (§53.5)",
   code.count("function ownerKnownSet(") == 1, code.count("function ownerKnownSet("))
ck("...and the three callers all go through it",
   code.count("ownerKnownSet()") >= 3, code.count("ownerKnownSet()"))
ck("the workbook's owner dropdown is a `from` range, never an inline list (§67.5)",
   "function ownerDV(" in code and "from:OWNERS_RANGE(" in code
   and "list:names" not in code)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1500, "height": 950})
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(2200)

    print("\n§2 · the register is the list, and a stray is known to be one")
    good = ev(pg, "() => PEOPLE.length ? knownName(PEOPLE[0], displayNames()) : null", None)
    ck("(fixture) the register has somebody in it", bool(good), good)
    ck("a name in the register is not a stray",
       ev(pg, "(n) => ownerStrays(n).length", -1, good) == 0, good)
    ck("a name that is not in it IS a stray",
       ev(pg, "() => ownerStrays('Tamer Abdelhamid')", []) == ["Tamer Abdelhamid"])
    ck("...and a BLANK owner is a gap, not a stray",
       ev(pg, "() => ownerStrays('').length + ownerStrays(null).length", -1) == 0)
    ck("a list of names is handled too, not just one",
       ev(pg, "(n) => ownerStrays([n, 'Nobody At All'])", [], good) == ["Nobody At All"])

    print("\n§3 · the dropdown says what a stray is")
    ck("a stray is grouped as NOT IN THE REGISTER",
       ev(pg, "() => ownerChoices('Tamer Abdelhamid', true).map(o => o.group || '')", [])
         == ["", "Not in the register", "People", "Departments"],
       ev(pg, "() => ownerChoices('Tamer Abdelhamid', true).map(o => o.group || '')", []))
    ck("...and a real name adds no such group",
       ev(pg, "(n) => ownerChoices(n, true).some(o => o.group === 'Not in the register')", True, good) is False)
    ck("...while the register's own people are still offered",
       ev(pg, "() => ownerChoices('', true).some(o => o.group === 'People' && o.items.length > 1)", False) is True)

    print("\n§4 · and it is FLAGGED where it shows, with the name kept")
    shown = ev(pg, "() => ownerShown('Tamer Abdelhamid')", "")
    ck("a stray carries a mark", "ownerstray" in (shown or ""), shown)
    ck("...that says, in plain words, that it is not in the register",
       "not in the register" in (shown or ""), shown)
    ck("...on a hover that explains what to do about it",
       "hasnote" in (shown or "") and "data-tip" in (shown or ""), shown)
    ck("...AND THE NAME ITSELF SURVIVES — the mark never replaces it",
       "Tamer Abdelhamid" in (shown or ""), shown)
    ck("a real name is drawn with no mark at all",
       "ownerstray" not in (ev(pg, "(n) => ownerShown(n)", "", good) or "x"))

    print("\n§5 · on the page, on a real row")
    planted = ev(pg, """() => { const t = UNITS.mobile.items[0].tactics[0];
        t.owner = 'Tamer Abdelhamid'; paint(); return true; }""", False)
    ck("(fixture) a stray was put on a real tactic", planted is True)
    ev(pg, "() => { const b = document.querySelector('button[data-u=\"mobile\"]'); if (b) b.click(); }")
    pg.wait_for_timeout(1300)
    ev(pg, "() => { const t = [...document.querySelectorAll('[role=tab]')].find(x => x.textContent.trim() === 'Plan'); if (t) t.click(); }")
    pg.wait_for_timeout(1400)
    cell = ev(pg, """() => { const m = document.querySelector('.ownerstray');
        if (!m) return { no: true };
        const td = m.closest('td') || m.parentNode;
        return { mark: m.textContent.trim(),
                 cell: td.textContent.replace(/\\s+/g, ' ').trim(),
                 tip: !!m.getAttribute('data-tip') }; }""", {})
    ck("the flag is drawn on the plan", not cell.get("no"), cell)
    ck("...beside the name, which is still there",
       "Tamer Abdelhamid" in (cell.get("cell") or ""), cell)
    ck("...and the hover came with it", cell.get("tip") is True, cell)

    print("\n§6 · the workbook's five Owner columns are the register's dropdown")
    plan = ev(pg, """() => { const w = planWorkbook(UNITS.mobile);
        return { sheets: w.map(s => s.name),
                 dv: w.flatMap(s => (s.validations || [])
                      .filter(v => v.from && /^Owners!/.test(v.from))
                      .map(v => s.name + ' ' + v.range)),
                 owners: (w.find(s => s.name === 'Owners') || {}).rows }; }""", {})
    ck("a unit's file carries an Owners sheet", "Owners" in (plan.get("sheets") or []), plan.get("sheets"))
    ck("...listing the register, not a handful",
       len(plan.get("owners") or []) > 5, len(plan.get("owners") or []))
    ck("...and its Pillars and Tactics owner columns point at it",
       plan.get("dv") == ["Pillars D2:D60", "Tactics H2:H400"], plan.get("dv"))
    cap = ev(pg, """() => { const c = (GROUP.capabilities || [])[0]; if (!c) return { no: true };
        const w = capPlanWorkbook(c, {});
        return { sheets: w.map(s => s.name),
                 dv: w.flatMap(s => (s.validations || [])
                      .filter(v => v.from && /^Owners!/.test(v.from))
                      .map(v => s.name + ' ' + v.range)) }; }""", {})
    ck("a function's file carries one too", "Owners" in (cap.get("sheets") or []), cap.get("sheets"))
    ck("...and its Projects, Actions and Milestones columns point at it",
       cap.get("dv") == ["Projects C2:C100", "Actions B2:B400", "Milestones D2:D400"], cap.get("dv"))
    # §65 FOR REAL, AND NOT A RESTATEMENT OF THE TWO ABOVE. The first draft of
    # this assertion was `all("Owners" in sheets for _ in [0])` — which is the
    # two checks above said a third time and could not fail (§113.8). This one
    # reads EVERY `from` range in both files, pulls the sheet name out of it,
    # and demands that sheet be present: it would catch a range pointing at a
    # sheet nobody wrote, which is the fault §65 is about.
    dangling = ev(pg, """() => {
        const c = (GROUP.capabilities || [])[0];
        const books = [planWorkbook(UNITS.mobile)].concat(c ? [capPlanWorkbook(c, {})] : []);
        const out = [];
        books.forEach(w => { const have = w.map(s => s.name);
          w.forEach(s => (s.validations || []).forEach(v => {
            if (!v.from) return;
            const sheet = String(v.from).split('!')[0].replace(/^'|'$/g, '');
            if (have.indexOf(sheet) < 0) out.push(s.name + ' ' + v.range + ' -> ' + v.from);
          })); });
        return out; }""", None)
    ck("no validation in either file points at a sheet that is not in it (§65)",
       dangling == [], dangling)
    # §380: an empty register writes neither the sheet nor the dropdown.
    empty = ev(pg, """() => { const keep = window.ownerListNames;
        window.ownerListNames = function(){ return []; };
        let out;
        try { const w = planWorkbook(UNITS.mobile);
          out = { sheet: w.some(s => s.name === 'Owners'),
                  dv: w.flatMap(s => (s.validations || []).filter(v => v.from && /^Owners!/.test(v.from))).length };
        } finally { window.ownerListNames = keep; }
        return out; }""", {})
    ck("an EMPTY register writes no Owners sheet (§380)", empty.get("sheet") is False, empty)
    ck("...and no dropdown pointing at one that is not there",
       empty.get("dv") == 0, empty)

    print("\n§7 · and a typed name is refused at the upload, by row and by name")
    ref = ev(pg, """(n) => { const rows = [
        { id:'mobile-P1', type:'PILLAR', name:'A pillar', theme:'', kind:'Direction', owner:'Tamer Abdelhamid' },
        { id:'mobile-P2', type:'PILLAR', name:'Another',  theme:'', kind:'Direction', owner:n }];
      return validatePlan(UNITS.mobile, rows).problems
        .filter(p => /owner/.test(p.msg)).map(p => ({ at:p.at, msg:p.msg })); }""", [], good)
    ck("a unit's plan upload refuses the typed name", len(ref) == 1, ref)
    ck("...naming the row it is on", bool(ref) and "A pillar" in ref[0]["at"], ref)
    ck("...and the name itself", bool(ref) and "Tamer Abdelhamid" in ref[0]["msg"], ref)
    ck("...and says what to do instead", bool(ref) and "register" in ref[0]["msg"], ref)
    ck("...while the good name beside it raises nothing", len(ref) == 1, ref)
    ck("a blank owner is not refused",
       ev(pg, """() => validatePlan(UNITS.mobile, [{ id:'mobile-P1', type:'PILLAR',
            name:'A', theme:'', kind:'Direction', owner:'' }])
            .problems.filter(p => /owner/.test(p.msg)).length""", -1) == 0)
    capref = ev(pg, """() => { const c = (GROUP.capabilities || [])[0]; if (!c) return [];
        return validateCapPlan(c, [{ id:'x1', type:'PROJECT', name:'A project', owner:'Nobody Here' }])
          .problems.filter(p => /owner/.test(p.msg)).map(p => p.at + ' | ' + p.msg); }""", [])
    ck("and a function's plan upload refuses it the same way",
       len(capref) == 1 and "A project" in capref[0] and "Nobody Here" in capref[0], capref)

    print("\n§8 · collaborators too, and name by name (§551.1)")
    pair = ev(pg, "(n) => collabShown(n + ', Tamer Abdelhamid')", "", good)
    ck("a list with one stray in it carries ONE mark, not one for the cell",
       (pair or "").count("ownerstray") == 1, (pair or "")[:120])
    ck("...and BOTH names survive it",
       good in (pair or "") and "Tamer Abdelhamid" in (pair or ""), (pair or "")[:120])
    ck("a list of real people carries none",
       "ownerstray" not in (ev(pg, "(n) => collabShown(n)", "", good) or "x"))
    ck("the mark's words are written in ONE place (§53.5)",
       code.count("not in the register</span>") == 1, code.count("not in the register</span>"))
    both = ev(pg, """() => validatePlan(UNITS.mobile, [{ id:'mobile-P1', type:'PILLAR',
        name:'A pillar', theme:'', kind:'Direction', owner:'Ghost One',
        collaborators:['Ghost Two'] }]).problems
        .filter(p => /register/.test(p.msg)).map(p => p.msg); }""".replace("; }", ""), [])
    ck("an upload refuses a collaborator as well as an owner", len(both) == 2, both)
    ck("...and SAYS WHICH FIELD, because a row can be wrong in both at once",
       bool(both) and any(m.startswith('owner "') for m in both)
       and any(m.startswith('collaborator "') for m in both), both)
    ck("...each naming the name itself",
       bool(both) and any("Ghost One" in m for m in both) and any("Ghost Two" in m for m in both), both)
    cc = ev(pg, """() => validateCapPlan((GROUP.capabilities || [])[0],
        [{ id:'x1', type:'MILESTONE', name:'A milestone', collaborators:['Nobody Here'] }])
        .problems.filter(p => /collaborator/.test(p.msg)).length""", -1)
    ck("and a function's file refuses one too", cc == 1, cc)

    print("\n§9 · and the Read me no longer tells you to do what the file refuses")
    rm = ev(pg, """() => { const r = planWorkbook(UNITS.mobile)[0];
        const pick = w => (r.rows.find(x => x[0] === w) || [])[1] || "";
        return { owners: pick("Owners"), collabs: pick("Collaborators") }; }""", {})
    ck("it no longer says to type the owner's name",
       "Type the person's name." not in (rm.get("owners") or ""), rm.get("owners"))
    ck("...it says to pick from the dropdown, and that a stray is refused",
       "dropdown" in (rm.get("owners") or "") and "refused" in (rm.get("owners") or ""), rm.get("owners"))
    ck("...and it says plainly why collaborators have no dropdown",
       "cannot offer a dropdown" in (rm.get("collabs") or ""), rm.get("collabs"))
    ck("...in BOTH workbooks, not just the unit's",
       code.count("Pick the name from the dropdown") == 2, code.count("Pick the name from the dropdown"))

    print("\n§10 · the BUILDER picks too — the surface that actually mattered (§551.2)")
    # Islam: "do not consider the upload through the sheets. Mostly, we build it
    # through the app, through the builder itself." §551 and §551.1 both argued
    # from the workbook being the wide door; it is not, and this section is the
    # one that guards the path plans are really written through.
    ck("all five builder owner fields are declared as pickers, none as a text box",
       code.count('{ k:"owner", label:"Owner", type:"owner" }') == 5,
       code.count('{ k:"owner", label:"Owner", type:"owner" }'))
    ck("...and none of them still carries a placeholder a select cannot draw",
       'k:"owner", label:"Owner", ph:' not in code)
    ck("the builder's list is ownerChoices and not one of its own (§53.5)",
       'f.type === "owner"' in code and "optionsHtml(ownerChoices(v, true)" in code)
    staged = ev(pg, """() => { UNITS.mobile.items = [];
        const b = document.querySelector('button[data-u="mobile"]'); if (b) b.click(); return true; }""", False)
    ck("(fixture) a unit with no plan, so the builder's door is drawn", staged is True)
    pg.wait_for_timeout(1400)
    ev(pg, "() => { const t = [...document.querySelectorAll('[role=tab]')].find(x => x.textContent.trim() === 'Plan'); if (t) t.click(); }")
    pg.wait_for_timeout(1300)
    ev(pg, "() => { const b = document.querySelector('[data-buildplan]'); if (b) b.click(); }")
    pg.wait_for_timeout(1600)
    ev(pg, "() => { const b = [...document.querySelectorAll('button')].find(x => /Pillars/.test(x.textContent)); if (b) b.click(); }")
    pg.wait_for_timeout(1200)
    ev(pg, "() => { const b = [...document.querySelectorAll('button')].find(x => /add the first/i.test(x.textContent)); if (b) b.click(); }")
    pg.wait_for_timeout(1500)
    form = ev(pg, """() => { const s = document.querySelector('[data-bf="owner"]');
        if (!s) return { no: true };
        return { tag: s.tagName, n: s.options ? s.options.length : 0,
                 groups: [...s.querySelectorAll('optgroup')].map(g => g.label) }; }""", {})
    ck("the builder's owner field is drawn as a dropdown, not a box",
       form.get("tag") == "SELECT", form)
    ck("...holding the register and the departments",
       form.get("groups") == ["People", "Departments"] and (form.get("n") or 0) > 10, form)
    wrote = ev(pg, """() => { const s = document.querySelector('select[data-bf="owner"]');
        if (!s) return { no: true };
        const nm = [...s.options].map(o => o.value).filter(Boolean)[0];
        s.value = nm; s.dispatchEvent(new Event('change', { bubbles: true }));
        return { picked: nm, draft: (typeof BFORM !== 'undefined' && BFORM) ? BFORM.draft.owner : null }; }""", {})
    ck("...and PICKING ONE ACTUALLY LANDS IN THE DRAFT, which a select that nobody reads would not",
       bool(wrote.get("picked")) and wrote.get("draft") == wrote.get("picked"), wrote)

    print("\n§11 · and the build is quiet")
    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n%d failure(s)" % bad)
raise SystemExit(1 if bad else 0)
