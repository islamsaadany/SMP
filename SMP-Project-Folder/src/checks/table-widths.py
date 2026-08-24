"""Every table on every Setup and Manage page, counted rather than remembered.
§54's rule: check against the tenant, do not assume."""
from playwright.sync_api import sync_playwright
URL="file:///home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html"
JS = """() => {
  const out=[];
  document.querySelectorAll("#panel table").forEach(function(t){
    const head=[].slice.call(t.tHead ? t.tHead.rows[0].cells : []).map(c=>c.innerText.trim());
    const body=t.tBodies[0] ? t.tBodies[0].rows.length : 0;
    out.push({ cls:t.className||"", cols:head.length, rows:body,
               head:head.slice(0,6).join(" | ").slice(0,70),
               kebab: !!t.querySelector("[data-pmenu],[data-rowmenu],.kebab"),
               widerThanBox: (function(){ let b=t.parentElement;
                 while(b && b.scrollWidth<=b.clientWidth+1 && b!==document.body) b=b.parentElement;
                 return !!(b && b.scrollWidth>b.clientWidth+1); })() });
  });
  return out;
}"""
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/opt/pw-browsers/chromium",args=["--no-sandbox","--disable-dev-shm-usage"])
    pg=b.new_page(viewport={"width":1440,"height":950})
    pg.goto(URL); pg.wait_for_timeout(1500)
    pg.click('#units [data-md="setup"]'); pg.wait_for_timeout(400)
    for g in pg.eval_on_selector_all(".setuprail .rgroup.shut","e=>e.map(x=>x.dataset.railgrp)"):
        pg.click('.setuprail [data-railgrp="%s"]'%g); pg.wait_for_timeout(70)
    keys = pg.eval_on_selector_all('.setuprail [data-setupgo]',"e=>e.map(x=>x.dataset.setupgo)")
    tot=0
    for k in keys:
        pg.click('.setuprail [data-setupgo="%s"]'%k); pg.wait_for_timeout(700)
        ts = pg.evaluate(JS)
        tot += len(ts)
        print("── %s  (%d table%s)" % (k, len(ts), "" if len(ts)==1 else "s"))
        for t in ts:
            print("     %2dc %3dr  keb=%-5s wide=%-5s  %s" %
                  (t["cols"], t["rows"], t["kebab"], t["widerThanBox"], t["head"]))
    print("\ntotal tables across %d Setup/Manage pages: %d" % (len(keys), tot))
    b.close()
