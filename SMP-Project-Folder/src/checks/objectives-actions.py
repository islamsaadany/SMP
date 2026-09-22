"""OBJECTIVES AND ACTIONS — THE THIRD WAY A FUNCTION PLANS (§342, spec 049).

Islam: *"we need to build the objectives and actions"*, of the third panel in
the mockup he signed off (design-mockups/function-plan-types/) — and, of the
model, *"each function has objectives like the measures we have and actions
like tactics they work on that has due dates."*

Almost nothing here is a new kind of ROW, which is what this file has to keep
honest: an objective is the function's own key objective, a measured row the
platform has scored since it had scores, and an action is a milestone with a
DATE where a tactic has quarters. What is new is a function holding them
directly, with no pillar and no project in between — so every assertion below
is either *the new form reaches the stored graph* or *the two forms that
existed did not move*.

What is asserted, and why each end matters (§94.2):

  - THE FORMAT IS A THIRD VALUE AND IT STICKS. Read back off the stored
    function, never off the select — a control wired to nothing renders
    perfectly (§96, §219);

  - THE SWITCH ARCHIVES WHAT STOOD (§318 §6.2, Islam's *"archvied when type
    changes and create the new apprach"*). This REPLACES §59's refusal for
    this one transition, so both ends are asserted: the archive is taken with
    the outgoing plan's counts in it, AND the new form starts empty;

  - THE THREE PAGES DRAW THE NEW WORK AND NOT THE OLD. The Plan holds actions
    and no project rail; Performance holds the two cards and both tables;
    Reporting asks for both. Asserted beside a PROJECTS function measured
    unchanged, or a build that drew actions everywhere satisfies every
    presence assertion here (§113.8);

  - THE OVERVIEW IS THE ONE A PROJECTS FUNCTION DRAWS, asserted as an
    AGREEMENT key for key rather than against a list of headings (§94.8,
    §213: one page, and a page that asks two questions per format is the
    drift §211 cost a day to undo);

  - EVERY PRESS IS READ BACK OFF THE STORED GRAPH (§96): a name typed, a row
    added, a row removed, a status reported;

  - THE TWO NUMBERS ARE AGREEMENT with `fnObjScore` and `fnActionsTally`,
    never literals — and the mockup's own decision is asserted as an absence:
    *"Actions are counted, not scored into the objectives"*, so moving an
    action must not move the objectives figure;

  - AN ACTION OWES ITS OWNER AND ITS DATE, counted and said, or the page
    prints the red word over a band that counts nought (§223);

  - THE PLAN CAN LEAVE AND COME BACK (§22): the Actions sheet is in the
    workbook, the function is offered as a subject, and the round trip is a
    FIXED POINT — a column the file does not carry is a column the plan loses.

THE STATE IS MADE (§255): the demo holds no function planning this way, so
every assertion here would pass on a build that lost the feature.

Every probe degrades (§215). SMP_BUILT points it at another build, so it can
be run against the build before (§276: a broken build is made from the
SOURCES, because §238's hashed CSP silences an edited built file).
"""
import os, sys, json
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or os.path.join(
    os.path.dirname(__file__), "..", "strategy-management-platform.html")
URL = "file://" + os.path.abspath(BUILT)

good = bad = 0
def ck(w, ok, x=""):
    global good, bad
    if ok: good += 1
    else: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — %s" % (x,)) if not ok and x != "" else ""))

def ev(pg, js, dflt=None, arg=None):
    try:
        return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    except Exception as e:
        return dflt if dflt is not None else {"err": str(e)[:130]}

FK = "hr"          # a projects function in the worked example, switched here
CTRL = "finance"   # and one left alone, as the control (§113.8)

def become(pg, who):
    ev(pg, "(k)=>switchViewer(k)", None, who); pg.wait_for_timeout(600)

def go(pg, fk):
    ev(pg, "()=>{const b=document.querySelector('#units [data-fold=\\\"fns\\\"]');"
           " if (b) b.click();}")
    pg.wait_for_timeout(260)
    try:
        pg.click('#units [data-u="fn:%s"]' % fk, timeout=3500); pg.wait_for_timeout(560)
        return True
    except Exception:
        return False

def sec(pg, k):
    try:
        pg.click('#secrow-in [data-sub2="%s"]' % k, timeout=2500); pg.wait_for_timeout(520)
        return True
    except Exception:
        return False

def tab(pg, k):
    try:
        pg.click('#subtabs button[data-s="%s"]' % k, timeout=2500); pg.wait_for_timeout(620)
        return True
    except Exception:
        return False

def panel(pg):
    return ev(pg, "()=>document.getElementById('panel').innerText", "")

def main():
    with sync_playwright() as pw:
        br = pw.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
        pg = br.new_page(viewport={"width": 1500, "height": 900})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
        pg.on("console", lambda m: errs.append("console: " + m.text[:160])
              if m.type == "error" else None)
        pg.add_init_script("try{localStorage.setItem('smp.welcome.seen','1');"
                           "sessionStorage.setItem('smp.tour.skip','1')}catch(e){}")
        pg.goto(URL); pg.wait_for_timeout(1200)
        become(pg, "smo")

        print("\n§1 the control offers three, and the third one sticks")
        ev(pg, "()=>{ current='setup'; CURSEC={}; paint(); }"); pg.wait_for_timeout(500)
        ev(pg, "k=>{currentSub=k;paint();}", None, "fns"); pg.wait_for_timeout(450)
        ev(pg, "(k)=>openRowDialog('fns', k)", None, FK); pg.wait_for_timeout(500)
        opts = ev(pg, """(k)=>{const s=document.querySelector('[data-fnformat="'+k+'"]');
          return s ? [].map.call(s.options, function(o){ return o.value; }) : [];}""", [], FK)
        ck("the plan-type control offers all three forms",
           sorted(opts) == ["objectives", "pillars", "projects"], opts)
        was = ev(pg, "(k)=>({ fmt: fnFormat(FUNCTIONS[k]),"
                     " projects: (FUNCTIONS[k].projects||[]).length,"
                     " arch: ARCHIVES.length })", {}, FK)
        ck("it starts on the form the worked example gives it",
           was.get("fmt") == "projects" and was.get("projects", 0) > 0, was)

        # A CAPABILITY IS THE ONE THING THE SWITCH CANNOT CARRY (§334), and the
        # refusal says what it does rather than only what is there — asserted at
        # BOTH ENDS, because a build that dropped the sentence and a build that
        # printed it on every function each satisfy one half (§94.2, §62, §221).
        held = ev(pg, """(k)=>{ var c=document.querySelector('.plancell');
          var y=c && c.querySelector('.why');
          return { why: y ? y.textContent : "", caps: capsOfFunction(k).length }; }""", {}, FK)
        ck("a function holding no capability is told nothing",
           held.get("caps") == 0 and not held.get("why"), held)
        cheld = ev(pg, """()=>{ closeRowDialog(true); openRowDialog('fns','marketing');
          var c=document.querySelector('.plancell'), y=c && c.querySelector('.why');
          var s=c && c.querySelector('select');
          if (s) { s.value='objectives'; s.dispatchEvent(new Event('change',{bubbles:true})); }
          return { why: y ? y.textContent : "", fmt: fnFormat(FUNCTIONS.marketing),
                   shown: s ? s.value : "", live: s ? !s.disabled : false,
                   caps: capsOfFunction('marketing').length }; }""", {})
        pg.wait_for_timeout(420)
        ck("one that holds a capability is told the form is held",
           (cheld.get("caps") or 0) > 0 and "cannot change" in (cheld.get("why") or ""), cheld)
        ck("the switch is refused, the select is put back, and it stays LIVE",
           cheld.get("fmt") == "projects" and cheld.get("shown") == "projects"
           and cheld.get("live") is True, cheld)
        ev(pg, "()=>closeRowDialog(true)"); pg.wait_for_timeout(300)
        ev(pg, "(k)=>openRowDialog('fns', k)", None, FK); pg.wait_for_timeout(420)

        print("\n§2 the switch ARCHIVES what stood, and starts the new form empty")
        ev(pg, """(k)=>{const s=document.querySelector('[data-fnformat="'+k+'"]');
          s.value='objectives'; s.dispatchEvent(new Event('change',{bubbles:true}));}""",
           None, FK)
        pg.wait_for_timeout(560)
        said = ev(pg, "()=>{const m=document.getElementById('modal-b');"
                      " return m ? m.innerText.replace(/\\n/g,' ') : '';}", "")
        ck("it asks first, and says what is held", "holds" in said and "archiv" in said.lower(), said[:120])
        ck("and says where the way back is", "Import" in said, said[:160])
        ev(pg, "()=>{const y=document.querySelector('[data-rmyes]'); if(y)y.click();}")
        pg.wait_for_timeout(700)
        now = ev(pg, "(k)=>({ fmt: fnFormat(FUNCTIONS[k]),"
                     " projects: (FUNCTIONS[k].projects||[]).length,"
                     " actions: (FUNCTIONS[k].actions||[]).length,"
                     " arch: ARCHIVES.length, counts: (ARCHIVES[0]||{}).counts })", {}, FK)
        ck("the form is stored as the third value", now.get("fmt") == "objectives", now)
        ck("an archive was taken, carrying what stood",
           now.get("arch") == was.get("arch", 0) + 1 and
           (now.get("counts") or {}).get("projects") == was.get("projects"), now)
        ck("and the new form starts empty",
           now.get("projects") == 0 and now.get("actions") == 0, now)

        # §255/§100.3: the rows are the product's own shapes, minted through the
        # product's own minter where there is one.
        made = ev(pg, """(k)=>{
          var f = FUNCTIONS[k];
          f.keyObjectives = [
            { id:"fn:"+k+"-KO1", name:"Achieve revenue target", dir:"\\u2265",
              target:"100%", compile:"Latest", actual:"96%", weight:50 },
            { id:"fn:"+k+"-KO2", name:"Payroll to sales", dir:"\\u2264",
              target:"7%", compile:"Latest", actual:"8%", weight:50 }
          ];
          var a1 = addAction(k), a2 = addAction(k), a3 = addAction(k);
          a1.name = "Retail academy";  a1.owner = "Amr Hassan"; a1.due = "Mar 26";
          a1.status = "wip"; a1.pct = 70;
          a2.name = "ERP system, live cycle"; a2.owner = "Mohamed Said";
          a2.due = "Mar 26"; a2.status = "done";
          a3.name = "In-house training";   /* owner and due deliberately blank */
          paint();
          return { actions: fnActions(k).map(function(a){ return a.id; }) };
        }""", {}, FK)
        pg.wait_for_timeout(400)
        ck("three actions minted through the product's own minter",
           len(made.get("actions") or []) == 3, made)

        print("\n§3 the three pages draw the new work, and not the old")
        ck("the function opens", go(pg, FK))
        ck("its Plan section is named Plan, not Projects",
           "Projects" not in ev(pg, "()=>[].map.call(document.querySelectorAll("
                                   "'#secrow-in [data-sub2]'), function(x){ return x.textContent.trim(); }).join('|')", ""),
           ev(pg, "()=>[].map.call(document.querySelectorAll('#secrow-in [data-sub2]'),"
                  " function(x){ return x.textContent.trim(); })", []))
        ck("the Plan section opens", sec(pg, "proj"))
        plan = panel(pg)
        # `innerText` is the RENDERED text and the band is uppercased by CSS, so
        # a case-sensitive compare asserts the stylesheet (§301.6, §51.11).
        ck("the Plan page draws the actions",
           "Retail academy" in plan and "actions" in plan.lower(), plan[:140])
        # A function's project rail draws `.ritem` rows — `.rrow` is the UNIT
        # rail's spelling and is nought on both formats, so asking for it passes
        # on the very build this exists to catch (§113.8). Asserted beside §10,
        # where the control function must still HAVE one.
        ck("and no project rail behind it",
           ev(pg, "()=>document.querySelectorAll('#panel .rail .ritem').length", 1) == 0)
        tab(pg, "fnperf"); perf = panel(pg)
        ck("Performance draws both tables",
           "Retail academy" in perf and "Achieve revenue target" in perf, perf[:140])
        ck("and both cards", "Objectives performance" in perf and "Actions" in perf, perf[:140])
        tab(pg, "report"); rep = panel(pg)
        ck("Reporting asks for both",
           "Retail academy" in rep and "Achieve revenue target" in rep, rep[:140])

        print("\n§4 the Overview is the one a projects function draws (§213)")
        # §3 left the report TAB, and the section row belongs to Strategy — a
        # press that cannot land leaves the previous page on screen and every
        # assertion after it measures that (§215, §50.6).
        ck("the Strategy tab comes back", tab(pg, "fnstrat"))
        ck("and the Overview section opens", sec(pg, "found"))
        mine = ev(pg, "()=>[].map.call(document.querySelectorAll('#panel h2,#panel h3,#panel h4'),"
                      " function(x){ return x.textContent.trim(); })", [])
        ck("it draws something", len(mine) > 0, mine)
        ck("the control function opens", go(pg, CTRL))
        ck("its Strategy tab comes back", tab(pg, "fnstrat"))
        ck("and its Overview opens", sec(pg, "found"))
        theirs = ev(pg, "()=>[].map.call(document.querySelectorAll('#panel h2,#panel h3,#panel h4'),"
                        " function(x){ return x.textContent.trim(); })", [])
        # §94.8: the AGREEMENT, never a list of headings a wording change breaks.
        ck("and it is the same page the other format draws", mine == theirs,
           {"objectives": mine, "projects": theirs})

        print("\n§5 every press reaches the STORED graph (§96)")
        go(pg, FK); sec(pg, "proj")
        try:
            pg.click('.secpen[data-page="plan"]', timeout=2500); pg.wait_for_timeout(620)
        except Exception:
            pass
        wrote = ev(pg, """(k)=>{
          var box = document.querySelector('#panel textarea[data-fld], #panel input[data-fld]');
          if (!box) return null;
          box.value = "Retail academy 2027";
          box.dispatchEvent(new Event('change', {bubbles:true}));
          return fnActions(k).map(function(a){ return a.name; });
        }""", None, FK)
        ck("typing a name writes the action",
           bool(wrote) and "Retail academy 2027" in (wrote or []), wrote)
        pg.wait_for_timeout(360)
        added = ev(pg, """(k)=>{ var b=document.querySelector('#panel [data-rowadd]');
          if (!b) return null; b.click(); return fnActions(k).length; }""", None, FK)
        ck("Add mints a fourth", added == 4, added)
        pg.wait_for_timeout(460)
        gone = ev(pg, """(k)=>{ var b=document.querySelector('#panel .xbtn');
          if (!b) return null; b.click(); return fnActions(k).length; }""", None, FK)
        ck("and the × takes one away", gone == 3, gone)
        pg.wait_for_timeout(460)
        tab(pg, "report")
        told = ev(pg, """()=>{ var s=document.querySelector('#panel [data-cpick]');
          if (!s) return null; var id=s.dataset.cpick; s.value='done';
          s.dispatchEvent(new Event('change',{bubbles:true}));
          var hit = holderItemById(id);
          return { id:id, kind:hit && hit.kind, status: hit && hit.obj.status }; }""", None)
        ck("reporting an action writes its own row",
           bool(told) and told.get("kind") == "action" and told.get("status") == "done", told)

        print("\n§6 the two numbers, as AGREEMENT and never as literals (§94.8)")
        nums = ev(pg, """(k)=>{
          var cards = document.getElementById('panel').innerText;
          return { score: fnObjScore(k), tally: fnActionsTally(k) };
        }""", {}, FK)
        ck("the objectives figure is the shared reader's",
           isinstance(nums.get("score"), int), nums)
        before = ev(pg, "(k)=>fnObjScore(k)", None, FK)
        moved = ev(pg, """(k)=>{
          var a = fnActions(k)[0], was = a.status;
          a.status = a.status === "done" ? "todo" : "done";
          var after = fnObjScore(k), t = fnActionsTally(k);
          a.status = was;
          return { after: after, tally: t.done };
        }""", {}, FK)
        # The mockup's own decision: actions are counted, never scored into the
        # objectives — so moving one must not move the objectives figure.
        ck("an action never moves the objectives figure",
           moved.get("after") == before, {"before": before, "after": moved.get("after")})

        print("\n§7 an action owes its owner and its date")
        owed = ev(pg, """(k)=>({
          gaps: gapTotalAll("fn:" + k),
          missing: SMPRules.gapMissing("action", fnActions(k)[2] || {}),
          refusal: submitRefusal("fn:" + k)
        })""", {}, FK)
        ck("the blank row is counted, not merely marked",
           owed.get("gaps", 0) >= 2 and sorted(owed.get("missing") or []) == ["due", "owner"], owed)
        ck("and Submit says so", "missing in the plan" in (owed.get("refusal") or ""), owed.get("refusal"))

        print("\n§8 the plan can leave and come back (§22)")
        wb = ev(pg, """(k)=>{
          var h = fnOwnHolder(k), wb = capPlanWorkbook(h), sh = {};
          wb.forEach(function(s){ sh[s.name] = (s.head ? [s.head] : []).concat(s.rows || []); });
          var rows = capPlanFromWorkbook(fnOwnHolderWritable(k), sh);
          return { sheets: wb.map(function(s){ return s.name; }),
                   offered: projectSubjectNames().indexOf(FUNCTIONS[k].name) > -1,
                   read: rows.filter(function(r){ return r.type === "ACTION"; })
                             .map(function(r){ return r.name + "|" + (r.owner||"") + "|" + (r.finish||""); }),
                   named: fnActions(k).filter(function(a){ return a.name; })
                             .map(function(a){ return a.name + "|" + (a.owner||"") + "|" + (a.due||""); }),
                   blankAction: fnActions(k).some(function(a){ return !a.name; })
                             && !rows.some(function(r){ return r.type === "ACTION" && !r.name; }),
                   blankMilestone: (function(){
                     /* The neighbour, measured rather than assumed: one
                        nameless milestone put through the SAME pair. */
                     var f = fnOwnHolderWritable("finance"), p = (f.projects||[])[0];
                     if (!p) return null;
                     (p.milestones = p.milestones || []).push({ id: p.id + "-Mx", name: "" });
                     var got = capPlanFromWorkbook(f, (function(){
                       var o = {}; capPlanWorkbook(f).forEach(function(s){
                         o[s.name] = (s.head ? [s.head] : []).concat(s.rows || []); });
                       return o; })());
                     p.milestones.pop();
                     return !got.some(function(r){ return r.type === "MILESTONE" && !r.name; });
                   })() };
        }""", {}, FK)
        ck("the workbook carries an Actions sheet", "Actions" in (wb.get("sheets") or []), wb.get("sheets"))
        ck("and the function is offered as a subject", wb.get("offered") is True, wb.get("offered"))
        # §22: a FIXED POINT — out through the builder and back through the
        # reader, field for field, or the plan loses what the file omits.
        #
        # OVER THE ROWS THE FILE CAN ADDRESS, which is the rows that have a
        # name: `child()` opens `if (!r[nameCol]) return;`, so a nameless
        # deliverable, outcome and milestone have all been dropped since the
        # reader was written — a row nobody has named yet cannot be matched in
        # a workbook. Asserted as that AGREEMENT rather than waived, or an
        # action quietly acquiring a rule of its own would read as a pass.
        ck("the round trip is a fixed point over the rows the file carries",
           wb.get("read") == wb.get("named"),
           {"read": wb.get("read"), "named": wb.get("named")})
        ck("and a nameless action is dropped exactly as a nameless milestone is",
           wb.get("blankAction") is True and wb.get("blankMilestone") is True, wb)

        # AND THE PROGRESS ROUTE, WHICH IS THE HALF MOST LIKELY TO BE WRONG.
        # §294.4 is exactly this shape one row kind along: a capability's
        # progress upload read two fields §104 had removed, so a deliverable
        # reported by file said Not started on every screen while the upload
        # looked accepted — and the milestone beside it dropped the per-cent
        # §104.10 REQUIRES. So it is driven end to end rather than read: the
        # file out, a status and a per-cent typed into it, back through the
        # real reader, the real differ and the real apply, and the ROW read.
        prog = ev(pg, """(k)=>{
          var h = fnOwnHolderWritable(k), a = fnActions(k)[0];
          if (!a) return null;
          a.status = "todo"; a.pct = null;
          var wb = capProgressWorkbook(h), sh = {};
          wb.forEach(function(s){ sh[s.name] = (s.head ? [s.head] : []).concat(s.rows || []); });
          /* The Actions sheet, with the reporter's two boxes filled in. */
          var rowsIn = sh["Actions"], head = rowsIn[0];
          var iS = head.indexOf("New status"), iP = head.indexOf("New %"),
              iN = head.indexOf("Note");
          rowsIn[1][iS] = "In progress"; rowsIn[1][iP] = 40;
          rowsIn[1][iN] = "Two cohorts held";
          var read = capProgressFromWorkbook(h, sh);
          var d = diffCapProgress(h, read);
          applyCapProgress(h, d);
          var after = fnActions(k)[0];
          return { sheet: wb.map(function(s){ return s.name; }).indexOf("Actions") > -1,
                   cols: { s: iS, p: iP, n: iN },
                   status: after.status, pct: after.pct, note: after.note,
                   changed: (d.changes || []).length };
        }""", None, FK)
        ck("the progress workbook carries an Actions sheet with the reporter's boxes",
           bool(prog) and prog.get("sheet") is True and
           prog.get("cols", {}).get("s", -1) > -1 and prog.get("cols", {}).get("p", -1) > -1,
           prog)
        # BOTH the status AND the per-cent, or §294.4's own fault is back: a
        # row that reads Not started on every screen off an accepted upload.
        ck("and a figure reported by file reaches the stored row",
           bool(prog) and prog.get("status") == "wip" and prog.get("pct") == 40
           and prog.get("note") == "Two cohorts held", prog)

        print("\n§8b the DOOR resolves the name the dropdown offers (§380)")
        # THE GAP THAT HID A LIVE DEFECT. §8 above asserts the function is
        # OFFERED in the file's own B2 dropdown and then calls
        # `capPlanFromWorkbook` DIRECTLY — so the upload's own resolution, which
        # is what a person actually meets, had never once been asked about this
        # format. It refused: that predicate matched a function with
        # `fnOwnsProjects`, which §342 makes false here, so the template offered
        # a name and the upload answered "no business unit, supporting function
        # or capability called …". A plan that downloads and cannot come back
        # (§22, §61), and §53.5 exactly — one question with two answers.
        #
        # DRIVEN THROUGH THE REAL CONTROL (§96, §70): the blank template is
        # built by the button's own builder, the subject is picked from the
        # file's own dropdown, the bytes are written to disk and handed to the
        # page's file input. Reading the door's predicate would assert it
        # against itself (§113.8).
        # THE BYTES GO STRAIGHT TO THE INPUT, never through a file on disk:
        # `qa-run.py` refuses to sweep a file that mentions `design-mockups`
        # AND writes (§334.14), and this file's own docstring names the mockup
        # it was built from — so writing a temp .xlsx here would take the whole
        # check out of every sweep. Spelling the write differently would be
        # dodging a guard rather than satisfying it; not writing is neither.
        import base64
        b64 = ev(pg, """(k)=>{
          var wb = capPlanWorkbook(blankCapShape(), { fmt:"objectives", only:true });
          var list = wb[0].validations[0].list || [];
          if (list.indexOf(FUNCTIONS[k].name) < 0) return { picked:null, list:list };
          wb[0].rows[1][1] = FUNCTIONS[k].name;        /* chosen from its own list */
          wb[1].rows = [["Time to hire", "\\u2264", "30", "d", "60", "Latest", ""]];
          wb[2].rows = [["Sign the framework agreement", "Hala Nabil", "Jul 2026", ""]];
          var u8 = buildXlsx(wb), s = "";
          for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
          return { picked: FUNCTIONS[k].name, list:list, b64: btoa(s) };
        }""", {}, FK)
        ck("the blank objectives template offers this function",
           bool(b64.get("picked")), b64.get("list"))
        if b64.get("b64"):
            ev(pg, "()=>{ current='setup'; currentSub='import'; CURSEC.import='up'; paint(); }")
            pg.wait_for_timeout(420)
            try:
                pg.set_input_files("#imp-file-plan", {
                    "name": "objectives-plan.xlsx",
                    "mimeType": "application/vnd.openxmlformats-officedocument."
                                "spreadsheetml.sheet",
                    "buffer": base64.b64decode(b64["b64"]) })
                pg.wait_for_timeout(1200)
            except Exception as e:
                ck("the upload control is there", False, e)
            door = ev(pg, """()=>({
              problems: ((IMP.check && IMP.check.problems) || []).map(function(x){ return x.msg; }),
              target: IMP.unit || "", read: !!IMP.summary
            })""", {})
            ck("the upload resolves it rather than refusing by name",
               not any("no business unit" in (m or "") for m in (door.get("problems") or [])),
               door.get("problems"))
            ck("…and it resolves to that function, never to a capability",
               door.get("target") == "fn:" + FK, door.get("target"))
            ck("…and the file was read", door.get("read") is True, door)
            # BOTH ENDS (§94.2): the door must still refuse a name nobody holds,
            # or "it resolved" is true of a build that resolves anything.
            bogus = ev(pg, """()=>{
              var picked = "Nobody At All";
              var uk = UNIT_KEYS.filter(function(x){ return UNITS[x].name === picked; })[0];
              var fk = uk ? null : FUNCTION_KEYS.filter(function(x){
                var f = FUNCTIONS[x];
                return f.active !== false && fnPlansInPillars(f) && f.name === picked; })[0];
              var caps = GROUP.capabilities.filter(function(x){ return x.name === picked; });
              var pfk = projectSubjectFns().filter(function(x){
                return FUNCTIONS[x].name === picked; })[0];
              return !!(uk || fk || pfk || caps.length);
            }""", None)
            ck("…and a name nobody holds is still refused", bogus is False, bogus)

        print("\n§9 the deck says what it holds")
        deck = ev(pg, """(k)=>{
          var d = document.createElement('div'); d.innerHTML = deckHtmlFor("fn:" + k);
          return { heads: [].map.call(d.querySelectorAll('.dslide h1,.dslide h2'),
                     function(x){ return x.textContent.trim(); }),
                   cover: (d.querySelector('.coversub')||{}).textContent || "" };
        }""", {}, FK)
        heads = " | ".join(deck.get("heads") or [])
        ck("it draws an Actions slide", "Actions" in heads, heads)
        ck("and no Projects slide", "Projects" not in heads, heads)
        ck("and the cover counts actions, never projects",
           "action" in (deck.get("cover") or "") and "project" not in (deck.get("cover") or ""),
           deck.get("cover"))

        print("\n§10 and a projects function did not move (§113.8)")
        go(pg, CTRL)
        ck("its Plan section is still Projects",
           "Projects" in ev(pg, "()=>[].map.call(document.querySelectorAll("
                               "'#secrow-in [data-sub2]'), function(x){ return x.textContent.trim(); }).join('|')", ""))
        sec(pg, "proj")
        ck("and it still draws its project rail",
           ev(pg, "()=>document.querySelectorAll('#panel .rail .ritem').length", 0) > 0)
        ctrl = ev(pg, """(k)=>{ var d=document.createElement('div');
          d.innerHTML = deckHtmlFor("fn:" + k);
          return d.querySelectorAll('.dslide').length; }""", 0, CTRL)
        ck("and its deck is the deck it was", ctrl > 4, ctrl)

        ck("no page error anywhere in the run", not errs, errs[:3])
        br.close()

    print("\n%d passed, %d failed" % (good, bad))
    return 1 if bad else 0

sys.exit(main())
