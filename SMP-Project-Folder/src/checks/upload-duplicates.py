"""An upload carrying duplicate addresses — the case the plan never looked at."""
from playwright.sync_api import sync_playwright
URL="file:///home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html"
bad=0; errs=[]
def ck(w, ok, x=""):
    global bad
    if not ok: bad+=1
    print(("  ok      " if ok else "  FAIL    ")+w+(("  — "+str(x)) if not ok and x else ""))
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/opt/pw-browsers/chromium",args=["--no-sandbox","--disable-dev-shm-usage"])
    pg=b.new_page(viewport={"width":1440,"height":900})
    pg.on("pageerror",lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(1500)
    # give somebody on the register an address, so the second case has something to hit
    pg.evaluate("PEOPLE[1].email='taken@rayacorp.com'; PEOPLE[1].empId='OLD1';")
    out = pg.evaluate("""() => {
      const plan = planPeopleFile([
        {"Emp ID":"N1","Name":"New One","Email":"same@rayacorp.com"},
        {"Emp ID":"N2","Name":"New Two","Email":"SAME@rayacorp.com"},
        {"Emp ID":"N3","Name":"New Three","Email":"taken@rayacorp.com"},
        {"Emp ID":"N4","Name":"New Four","Email":"fine@rayacorp.com"},
        {"Emp ID":"OLD1","Name":"The Existing One","Email":"taken@rayacorp.com","Job title":"Amended"}
      ]);
      return { added: plan.added, updated: plan.updated,
               problems: plan.problems.map(x=>x.at+": "+x.msg) };
    }""")
    for x in out["problems"]: print("     " + x[:118])
    # ASSERT THE CONTRACT, NOT THE WORDING (Constitution XVI). The first draft
    # of these checked for the phrase "also on Row 2" and for "Row 6" being
    # absent — both of which changed when the RULE was fixed, while the thing
    # they were meant to guarantee did not. What matters is which rows are
    # refused and which get through.
    refused = set(x.split(":")[0] for x in out["problems"])
    ck("both rows sharing a brand-new address are refused",
       {"Row 2","Row 3"} <= refused, refused)
    ck("...and the message names every row involved",
       all("Row 2, Row 3" in x for x in out["problems"] if x.startswith("Row 2")),
       out["problems"])
    ck("a row taking an address somebody already holds is refused",
       "Row 4" in refused, refused)
    ck("...and it names who holds it",
       any("already belongs to" in x for x in out["problems"]))
    ck("THE RIGHTFUL HOLDER IS NOT REFUSED, wherever they sit in the file",
       "Row 6" not in refused, refused)
    ck("...and is still amended", out["updated"]>=1, out)
    ck("the clean row still goes in", out["added"]>=1, out)
    print("errors:", errs or "none")
    print("ALL GREEN" if bad==0 and not errs else str(bad)+" FAILED")
    b.close()
