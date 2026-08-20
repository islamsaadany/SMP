from playwright.sync_api import sync_playwright
import pathlib
url="file://"+str(pathlib.Path("strategy-management-platform.html").resolve())
errs=[]

def open_menu(pg):
    b=pg.query_selector("#navmenu-btn")
    if b and b.get_attribute("aria-expanded") != "true":
        b.click(); pg.wait_for_timeout(80)

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
        # Folds first: a unit inside a closed fold is unreachable until it opens.
        for fk in pg.eval_on_selector_all("#units .navfold","els=>els.map(e=>e.dataset.fold)"):
            f=pg.query_selector('#units .navfold[data-fold="%s"]'%fk)
            if f and f.get_attribute("aria-expanded") != "true":
                f.click(); pg.wait_for_timeout(120)
            seen+=walk_destinations(pg)
        if not pg.query_selector("#units .navfold"):
            seen+=walk_destinations(pg)
        # The Manage menu: reopened before each entry, because choosing one
        # closes it. Every entry is a destination the two icons used to hold.
        if pg.query_selector("#navmenu-btn"):
            open_menu(pg)
            keys=pg.eval_on_selector_all("#units .navmenu-panel button",
                                         "els=>els.map(e=>e.dataset.md+'|'+e.dataset.ms)")
            for k in keys:
                d,sub=k.split("|")
                open_menu(pg)
                e=pg.query_selector('#units .navmenu-panel button[data-md="%s"][data-ms="%s"]'%(d,sub))
                if not e: continue
                e.click(); pg.wait_for_timeout(140)
                walk_subtabs(pg)
                seen+=1
        print(v,"ok", seen, "destinations")
    print("ERRORS:", errs if errs else "none")
    b.close()
