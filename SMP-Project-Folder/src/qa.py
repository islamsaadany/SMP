from playwright.sync_api import sync_playwright
import pathlib
url="file://"+str(pathlib.Path("strategy-management-platform.html").resolve())
errs=[]

def walk_destinations(pg):
    n=len(pg.query_selector_all("#units button[data-u]"))
    for ui in range(n):
        us=pg.query_selector_all("#units button[data-u]")
        if ui>=len(us): break
        us[ui].click(); pg.wait_for_timeout(120)
        walk_subtabs(pg)
    return n

def walk_subtabs(pg):
    m=len(pg.query_selector_all("#subtabs button"))
    for si in range(m):
        ss=pg.query_selector_all("#subtabs button")
        if si>=len(ss): break
        ss[si].click(); pg.wait_for_timeout(120)

with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={"width":1400,"height":1000})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR: "+str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type=="error" else None)
    pg.goto(url); pg.wait_for_timeout(600)
    people = pg.eval_on_selector_all("#asWho option","els=>els.map(e=>e.value)")
    for v in people:
        pg.select_option("#asWho", v); pg.wait_for_timeout(200)
        # Destinations only. #units also holds the fold buttons, which go
        # nowhere, and — since 2.9 — the Manage menu's entries, which are not
        # visible until it is opened. Each is walked in its own way.
        seen=0
        # UNITS | FUNCTIONS IS ONE BUTTON NOW (51.9), so the row shows one list
        # at a time and the other is reached by PRESSING it rather than by
        # opening a second fold. This walks the list on show, presses, walks the
        # other, and presses again so the switch is left as it was found.
        #
        # It is updated here rather than left to fail, because it would NOT have
        # failed: `.navfold` simply stops matching, the loop iterates nothing,
        # and the sweep reports "ok" having walked half the product. Third time
        # in one session that a check quietly measured less than it claimed.
        if pg.query_selector("#units .navswitch"):
            for _ in range(2):
                seen+=walk_destinations(pg)
                sw=pg.query_selector("#units .navswitch")
                if sw: sw.click(); pg.wait_for_timeout(150)
        else:
            seen+=walk_destinations(pg)
        # The Manage menu: reopened before each entry, because choosing one
        # closes it. Every entry is a destination the two icons used to hold.
        # THE GEAR IS A DESTINATION, NOT A MENU (47.7). Setup and Manage merged
        # into one page whose rail carries all sixteen entries, so the sweep
        # walks the rail — and unfolds every group first, because a folded one
        # hides its rows and a page nothing clicks is a page nothing tests.
        if pg.query_selector('#units [data-md="setup"]'):
            pg.click('#units [data-md="setup"]'); pg.wait_for_timeout(200)
            for g in pg.eval_on_selector_all(".setuprail .rgroup.shut",
                                             "els=>els.map(e=>e.dataset.railgrp)"):
                pg.click('.setuprail [data-railgrp="%s"]'%g); pg.wait_for_timeout(120)
            for key in pg.eval_on_selector_all(".setuprail [data-setupgo]",
                                               "els=>els.map(e=>e.dataset.setupgo)"):
                el=pg.query_selector('.setuprail [data-setupgo="%s"]'%key)
                if not el: continue
                el.click(); pg.wait_for_timeout(160)
                for k2 in pg.eval_on_selector_all(".setuppane .secrow [data-sub2]",
                                                  "els=>els.map(e=>e.dataset.sub2)"):
                    pg.click('.setuppane .secrow [data-sub2="%s"]'%k2); pg.wait_for_timeout(160)
                seen+=1
        print(v,"ok", seen, "destinations")

    # ── THE TEMPLATE MUST SURVIVE A ROUND TRIP (51.14) ───────────────
    # A template downloaded from the product and uploaded back into it was
    # REFUSED: an entirely empty row is not written into an .xlsx at all, so the
    # blank spacer vanished, every row below it shifted up, and a cell read by
    # row NUMBER came back holding the prose underneath it. Nothing caught it —
    # the sweeps walk pages, and this is a file LEAVING the product and coming
    # back. Asserted here on the real writer and the real reader.
    rt = pg.evaluate("""() => {
      /* AND IT MUST BE ROUND-TRIPPED THE WAY EXCEL DOES IT. Writing with our
         own writer and reading with our own reader proves the two AGREE — it
         does not prove the file survives the tool the customer uses. Our writer
         keeps the blank spacer row; Excel does not write an entirely empty row
         at all. The first version of this guard passed on the broken build,
         which is the fault it exists to catch, arriving inside the catcher.
         `asExcel` drops empty rows, which is the whole of what Excel did. */
      const asExcel = sheets => {
        const out = {};
        Object.keys(sheets).forEach(k => {
          out[k] = (sheets[k] || []).filter(r =>
            (r || []).some(c => String(c == null ? "" : c).trim() !== ""));
        });
        return out;
      };
      const u = UNITS[UNIT_KEYS[0]], c = GROUP.capabilities[0];
      return Promise.resolve(readXlsx(buildXlsx(planWorkbook(u)).buffer)).then(us =>
        Promise.resolve(readXlsx(buildXlsx(capPlanWorkbook(c)).buffer)).then(cs => {
          const U = asExcel(us), C = asExcel(cs);
          return { unit: readmePick(U), fn: readmePickFn(U), wantUnit: u.name,
                   cap: readmePick(C), capFn: readmePickFn(C), wantCap: c.name,
                   wantCapFn: (FUNCTIONS[c.fn] || {}).name || "" };
        }));
    }""")
    if rt["unit"] != rt["wantUnit"]:
        errs.append("ROUND TRIP: a unit template comes back naming %r, not %r"
                    % (rt["unit"], rt["wantUnit"]))
    # ONE NAMING IN EACH FILE (51.19). NEITHER template carries a function
    # cell any more — the capability workbook named both and the two had to
    # agree, which refused files for a link the platform owns. So the contract
    # asserted here is that each file names its OWN subject and answers no
    # question about functions. Asserting the contract, not the old shape:
    # a check left asserting what a feature used to do fails on the day the
    # feature is corrected, and gets edited into agreeing rather than read.
    if rt["fn"] or rt["capFn"]:
        errs.append("ROUND TRIP: a template still answers a function question (%r / %r)"
                    % (rt["fn"], rt["capFn"]))
    if rt["cap"] != rt["wantCap"]:
        errs.append("ROUND TRIP: a capability template comes back %r, not %r"
                    % (rt["cap"], rt["wantCap"]))
    print("template round trip: unit=%r | cap=%r | neither names a function"
          % (rt["unit"], rt["cap"]))

    # ── A UNIT AND A FUNCTION MUST MATCH (53.5) ───────────────────────
    # The rule Islam set on 2026-08-23: any change to how something works or
    # how it looks is tested on BOTH sides of the navigation switch, because a
    # unit's page and a function's are the same product and must not drift
    # apart unless something genuinely conflicts. They already had: a unit
    # opened on its Plan and a function on Performance (28, never applied to
    # functions); the unit's rail lost its bare number and its footer in 29.6
    # and the function's kept both; and the function's rail and pane sat 34px
    # narrower, inside a card the unit does not have.
    #
    # Walking both sides would not have caught any of that — the sweep visited
    # every one of those pages and reported "ok". So this MEASURES the two and
    # compares them: the same rail track, the same pane box, the same band,
    # pinned at the same offset. It asserts they AGREE, never what the number
    # is, so a deliberate change to both stays green and a change to one does
    # not.
    def pane_shape(pg):
        return pg.evaluate("""() => {
          const split = document.querySelector('.split');
          if (!split) return { err: 'no .split on this page' };
          const rail = split.querySelector('.rail'), pane = split.querySelector('.pane');
          const band = pane && pane.querySelector(':scope > .pband');
          const nm = band && band.querySelector('.pband-name');
          const panel = document.getElementById('panel');
          const pb = panel.getBoundingClientRect(), rb = pane.getBoundingClientRect();
          const cs = getComputedStyle(pane);
          return {
            railTrack: getComputedStyle(split).gridTemplateColumns.split(' ')[0],
            paneLeft: Math.round(rb.left - pb.left), paneRight: Math.round(pb.right - rb.right),
            panePad: cs.padding,
            railSticky: getComputedStyle(rail).position + ' ' + getComputedStyle(rail).top,
            bandSticky: band ? getComputedStyle(band).position + ' ' + getComputedStyle(band).top : 'no band',
            bandName: nm ? getComputedStyle(nm).fontSize + '/' + getComputedStyle(nm).fontWeight : 'no name',
          };
        }""")

    def goto(pg, key, tab, sec):
        want = "Functions" if key.startswith("fn:") else "Units"
        for _ in range(3):
            on = pg.eval_on_selector_all("#units .navswitch .nsw.on", "e=>e.map(x=>x.textContent.trim())")
            if on and on[0] == want: break
            pg.click("#units .navswitch"); pg.wait_for_timeout(150)
        pg.click('#units button[data-u="%s"]' % key); pg.wait_for_timeout(250)
        pg.evaluate("""(t)=>{const b=[...document.querySelectorAll('#subtabs button')]
            .find(x=>x.textContent.trim()===t); if(b)b.click()}""", tab)
        pg.wait_for_timeout(200)
        pg.evaluate("""(t)=>{const b=[...document.querySelectorAll('#secrow button')]
            .find(x=>x.textContent.trim()===t); if(b)b.click()}""", sec)
        pg.wait_for_timeout(300)
        # THE LABEL MUST SAY WHICH PAGE WAS ACTUALLY SCANNED (50.6). A probe
        # that clicks and does not check reports the page behind under the
        # name of the one it meant to open.
        got = pg.evaluate("""()=>{const a=document.querySelector('#subtabs [aria-selected="true"]'),
            b=document.querySelector('#secrow [aria-selected="true"]');
            return (a?a.textContent.trim():'?') + ' / ' + (b?b.textContent.trim():'?')}""")
        return got

    pg.select_option("#asWho", people[0]); pg.wait_for_timeout(200)
    where_u = goto(pg, "mobile", "Strategy", "Plan")
    unit_shape = pane_shape(pg)
    where_f = goto(pg, "fn:finance", "Strategy", "Projects")
    fn_shape = pane_shape(pg)
    if where_u != "Strategy / Plan":
        errs.append("PARITY: meant to scan a unit's Plan, landed on %r" % where_u)
    if where_f != "Strategy / Projects":
        errs.append("PARITY: meant to scan a function's Projects, landed on %r" % where_f)
    for k in sorted(set(list(unit_shape) + list(fn_shape))):
        if unit_shape.get(k) != fn_shape.get(k):
            errs.append("PARITY %s: unit %r, function %r"
                        % (k, unit_shape.get(k), fn_shape.get(k)))
    print("unit/function parity: %s vs %s \u2014 %s"
          % (where_u, where_f,
             "same shape" if unit_shape == fn_shape else "DIFFERENT"))

    # ── THE STRIP ABOVE A PINNED HEADER IS GROUND (53.7) ──────────────
    # `.pane > .pband::before` and `.split .rail::before` fill the gap between
    # the chrome and the pinned pair with the page's own ground, so the pane's
    # content cannot slide through it. CSS cannot ask whether a sticky element
    # is currently pinned, so they paint at ALL times — which means whatever
    # sits immediately above the split has that much of its bottom painted
    # over. It cost a capability band nine pixels and a key-objectives table
    # twenty-three, and the unit's Report page had it too.
    #
    # `* + .split` leaves the clearance. Asserted here as the distance from the
    # split's top to the LOWEST thing drawn before it in the page — not just
    # its previous sibling, because on a function's Projects page the split is
    # the first child of the capability body and the band is a step further out.
    clear = pg.evaluate("""() => {
      const need = parseInt(getComputedStyle(document.documentElement)
                     .getPropertyValue('--pin-clear')) || 24;
      const panel = document.getElementById('panel');
      const out = [];
      panel.querySelectorAll('.split').forEach(sp => {
        if (!sp.querySelector(':scope > .rail')) return;      /* setup's rail pins nothing */
        const top = sp.getBoundingClientRect().top;
        let lowest = -1e9, who = '(nothing above it)';
        panel.querySelectorAll('*').forEach(el => {
          if (el === sp || sp.contains(el) || el.contains(sp)) return;
          if (!(sp.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING)) return;
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height) return;
          if (r.bottom > lowest && r.bottom <= top) {
            lowest = r.bottom;
            who = (typeof el.className === 'string' && el.className
                   ? '.' + el.className.split(' ')[0] : el.tagName);
          }
        });
        out.push({ who: who, gap: lowest < -1e8 ? null : Math.round(top - lowest), need: need });
      });
      return out;
    }""")
    for c in clear:
        if c["gap"] is not None and c["gap"] < c["need"]:
            errs.append("PIN CLEARANCE: a split sits %dpx under %s, less than the %dpx its "
                        "ground filler paints" % (c["gap"], c["who"], c["need"]))
    print("pin clearance: " + (", ".join("%s +%s" % (c["who"], c["gap"]) for c in clear) or "no railed split here"))

    # A FUNCTION OPENS ON ITS PROJECTS, as a unit opens on its Plan (53.1).
    for key, want in (("mobile", "Strategy / Plan"), ("fn:finance", "Strategy / Projects")):
        w = "Functions" if key.startswith("fn:") else "Units"
        for _ in range(3):
            on = pg.eval_on_selector_all("#units .navswitch .nsw.on", "e=>e.map(x=>x.textContent.trim())")
            if on and on[0] == w: break
            pg.click("#units .navswitch"); pg.wait_for_timeout(150)
        pg.click('#units button[data-u="group"]'); pg.wait_for_timeout(200)
        pg.click('#units button[data-u="%s"]' % key); pg.wait_for_timeout(350)
        got = pg.evaluate("""()=>{const a=document.querySelector('#subtabs [aria-selected="true"]'),
            b=document.querySelector('#secrow [aria-selected="true"]');
            return (a?a.textContent.trim():'?') + ' / ' + (b?b.textContent.trim():'?')}""")
        if got != want:
            errs.append("LANDING: %s opens on %r, not %r" % (key, got, want))
        print("%s opens on %s" % (key, got))
    # ── THE PEOPLE FILE MUST SURVIVE THE SAME ROUND TRIP (54.3) ──────
    # Same fault line as the plan template, and one more: this file is the
    # EXPORT as well as the template, so the register downloaded and uploaded
    # back unchanged has to be a FIXED POINT. If it is not, the first thing
    # anybody does with the feature — download it to see the shape — reports a
    # register full of changes that are not changes.
    #
    # Driven through the real writer, the real reader and the real planner,
    # with `asExcel` dropping empty rows exactly as Excel does. The register is
    # given employee numbers first, because without one every row is skipped
    # and the fixed point would hold by measuring nothing (51.11).
    pf = pg.evaluate("""() => {
      const asExcel = sheets => {
        const out = {};
        Object.keys(sheets).forEach(k => {
          out[k] = (sheets[k] || []).filter(r =>
            (r || []).some(c => String(c == null ? "" : c).trim() !== ""));
        });
        return out;
      };

      /* Numbers on everybody, and one department that maps and one that does
         not — the two cases the BU column has to tell apart. */
      PEOPLE.forEach((p, i) => { p.empId = "E" + (1000 + i); });
      /* Three rows, three answers: a name that means ONE place, a name that
         means NOTHING, and — since 57 — a name that holds SEVERAL. The third
         must not be resolved: a Main BU covering three units cannot say which
         of them somebody is in, which is the whole reason the sign-in asks.
         `at` is written as a STRING on the first two on purpose, because that
         is the shape every row saved before 57 still holds. */
      GROUP.mainbus = [{ name: "Retail", at: UNIT_KEYS[1] }, { name: "Risk", at: null },
                       { name: "Distribution", at: [UNIT_KEYS[0], UNIT_KEYS[2]] }];
      PEOPLE[0].mainbu = "Retail";
      PEOPLE[1].mainbu = "Risk";
      PEOPLE[3].mainbu = "Distribution";

      return Promise.resolve(readXlsx(buildXlsx(peopleWorkbook()).buffer)).then(sh => {
        const rows = peopleFromWorkbook(asExcel(sh));
        const fixed = planPeopleFile(rows);

        /* THE EDIT IS MADE TO THE FILE, NOT TO THE REGISTER. Written the other
           way round first — change the person, download again — it proved
           nothing at all: the download carried the new value too, so both
           sides agreed and the check reported zero changes while passing.
           Measuring the wrong thing passes (50.6). */
        const target = rows.filter(r => r["Emp ID"] === PEOPLE[2].empId)[0];
        target["Job title"] = "Something else entirely";
        const moved = planPeopleFile(rows);
        const movedRow = moved.rows.filter(r => r.id === PEOPLE[2].empId)[0] || null;
        target["Job title"] = "";

        /* And the case the whole feature exists for: somebody the register has
           never met, in a department it has never heard of. */
        /* "Main BU", THE OLD HEADER, ON PURPOSE (58). The column is called
           Official BU since the rename and the download writes that — which
           the fixed point above already proves reads. This row is the file
           somebody downloaded BEFORE the rename and is still holding: a header
           is a contract, and refusing it would be 54.4's fault arriving
           through a relabelling. Do not "tidy" this to the new name; the new
           name is tested three lines up. */
        rows.push({ "Emp ID": "102347", "Name": "A New Joiner",
                    "Job title": "Senior Manager (Sales)", "Email": "new@example.com",
                    "Mobile": "01000000000", "Main BU": "Maintenance",
                    "Role": "", "Status": "Active" });
        const seeded = planPeopleFile(rows);
        const seededRow = seeded.rows.filter(r => r.id === "102347")[0] || null;

        return {
          fixedMoving: fixed.rows.filter(r => r.action !== "same").length,
          fixedProblems: fixed.problems.length,
          fixedSkipped: fixed.notices.length,
          rows: fixed.rows.length,
          people: PEOPLE.length,
          mappedAt: (fixed.rows.filter(r => r.key === PEOPLE[0].key)[0] || {}).where || null,
          unmappedAt: (fixed.rows.filter(r => r.key === PEOPLE[1].key)[0] || {}).where || null,
          severalAt: (fixed.rows.filter(r => r.key === PEOPLE[3].key)[0] || {}).where || null,
          severalChoices: (SMPRules && mainbuChoices("Distribution")) || [],
          movedRows: moved.rows.filter(r => r.action !== "same").length,
          movedWhat: movedRow ? movedRow.changes.join(",") : "(row missing)",
          seededAction: seededRow ? seededRow.action : "(row missing)",
          seededProblems: seeded.problems.length,
          seededNewBus: seeded.newBus.join(",")
        };
      });
    }""")
    if pf["rows"] != pf["people"]:
        errs.append("PEOPLE FILE: %d of %d people came back through the file"
                    % (pf["rows"], pf["people"]))
    if pf["fixedProblems"] or pf["fixedSkipped"]:
        errs.append("PEOPLE FILE: its own download does not read cleanly (%d problems, %d skipped)"
                    % (pf["fixedProblems"], pf["fixedSkipped"]))
    if pf["fixedMoving"]:
        errs.append("PEOPLE FILE: downloading and uploading it back moves %d rows — not a fixed point"
                    % pf["fixedMoving"])
    if pf["mappedAt"] != "retailstores" or pf["unmappedAt"]:
        errs.append("PEOPLE FILE: BU list resolved to %r / %r, wanted 'retailstores' / nothing"
                    % (pf["mappedAt"], pf["unmappedAt"]))
    # A NAME THAT HOLDS SEVERAL PLACES NOBODY (57). It offers the choices to
    # the sign-in picker instead; guessing one of three would put somebody in a
    # unit nobody said they were in, and the whole point of asking is that the
    # file cannot know.
    if pf["severalAt"]:
        errs.append("PEOPLE FILE: a Main BU holding several placed somebody at %r"
                    % pf["severalAt"])
    if len(pf["severalChoices"]) != 2:
        errs.append("PEOPLE FILE: a Main BU holding two offers %r to the picker"
                    % (pf["severalChoices"],))
    if pf["movedRows"] != 1 or pf["movedWhat"] != "job title":
        errs.append("PEOPLE FILE: one changed cell produced %d changed rows (%r)"
                    % (pf["movedRows"], pf["movedWhat"]))
    if pf["seededAction"] != "add" or pf["seededProblems"]:
        errs.append("PEOPLE FILE: a new employee in an unknown BU came back as %r (%d problems)"
                    % (pf["seededAction"], pf["seededProblems"]))
    if pf["seededNewBus"] != "Maintenance":
        errs.append("PEOPLE FILE: an unknown BU was not offered to the BU list (%r)"
                    % pf["seededNewBus"])
    print("people file: %d rows, fixed point %s, one edited cell -> %d row (%s), "
          "new joiner -> %s + BU %r"
          % (pf["rows"], "PASS" if not pf["fixedMoving"] else "FAIL",
             pf["movedRows"], pf["movedWhat"], pf["seededAction"], pf["seededNewBus"]))

    print("ERRORS:", errs if errs else "none")
    b.close()
