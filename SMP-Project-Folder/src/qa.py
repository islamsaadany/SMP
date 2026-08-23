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
    print("ERRORS:", errs if errs else "none")
    b.close()
