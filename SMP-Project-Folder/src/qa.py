from playwright.sync_api import sync_playwright
import pathlib
url="file://"+str(pathlib.Path("strategy-management-platform.html").resolve())
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={"width":1400,"height":1000})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR: "+str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type=="error" else None)
    pg.goto(url); pg.wait_for_timeout(600)
    people = pg.eval_on_selector_all("#asWho option","els=>els.map(e=>e.value)")
    for v in people:
        pg.select_option("#asWho", v); pg.wait_for_timeout(200)
        n=len(pg.query_selector_all("#units button"))
        for ui in range(n):
            us=pg.query_selector_all("#units button")
            if ui>=len(us): break
            us[ui].click(); pg.wait_for_timeout(120)
            m=len(pg.query_selector_all("#subtabs button"))
            for si in range(m):
                ss=pg.query_selector_all("#subtabs button")
                if si>=len(ss): break
                ss[si].click(); pg.wait_for_timeout(120)
        print(v,"ok")
    print("ERRORS:", errs if errs else "none")
    b.close()
