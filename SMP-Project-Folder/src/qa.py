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

    print("ERRORS:", errs if errs else "none")
    b.close()
