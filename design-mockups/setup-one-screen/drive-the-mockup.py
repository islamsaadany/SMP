"""The stage-4 shape mockup, driven. Replaces three earlier suites written
against the single-shared-layer model Islam replaced: each bottom kind now
carries its own layer above, created by the kind that needs one."""
import sys
from playwright.sync_api import sync_playwright
URL="file:///home/user/SMP/design-mockups/setup-one-screen/2026-10-18_the-shape-interactive.html"
bad=0
def ck(w, ok, x=""):
    global bad
    if not ok: bad+=1
    print(("  ok    " if ok else "  FAIL  ")+w+(("  — "+str(x)) if not ok and x!="" else ""))
def rows(pg): return [" ".join(t.split()) for t in pg.locator(".lvl").all_inner_texts()]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
    pg=b.new_page(viewport={"width":1200,"height":1100}); errs=[]
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(400)

    print("1 · El Abd — the functions have a layer, the units do not")
    r=rows(pg)
    ck("four rows", len(r)==4, r)
    ck("units at Layer 2, offered a layer", r[1].startswith("LAYER 2 BUSINESS UNITS") and "GROUP THESE" in r[1].upper(), r[1])
    ck("the functions' own layer above them", r[2].startswith("LAYER 2 DIVISIONS 3") and "ABOVE THE FUNCTIONS" in r[2].upper(), r[2])
    ck("functions at Layer 3, all 22", r[3].startswith("LAYER 3 FUNCTIONS 22"), r[3])
    pg.locator('.box', has_text="Operations").first.click(); pg.wait_for_timeout(200)
    ck("pressing a division filters to its eight", pg.locator('[data-box^="fn-"]').count()==8,
       pg.locator('[data-box^="fn-"]').count())
    ck("and the heading counts both", "(8 UNDER OPERATIONS)" in rows(pg)[3].upper(), rows(pg)[3])
    ck("the panel is that division", "OPERATIONS" in pg.locator(".ptitle").first.inner_text().upper())

    print("2 · editing reaches the picture")
    pg.locator('.add').last.click(); pg.wait_for_timeout(150)
    pg.locator('#newin').fill("Maintenance"); pg.keyboard.press("Enter"); pg.wait_for_timeout(200)
    ck("typing adds it", pg.locator('.box', has_text="Maintenance").count()>=1)
    ck("the field stays open for the next", pg.locator('#newin').count()==1)
    pg.keyboard.press("Escape"); pg.wait_for_timeout(150)
    pg.locator('.box', has_text="Maintenance").first.click(); pg.wait_for_timeout(150)
    pg.locator('[data-f="name"]').fill("Maintenance & Utilities"); pg.wait_for_timeout(200)
    ck("renaming in the panel renames on the picture", pg.locator('.box', has_text="Maintenance & Utilities").count()>=1)
    pg.locator('#rm').click(); pg.wait_for_timeout(200)
    ck("removing takes it off", pg.locator('.box', has_text="Maintenance & Utilities").count()==0)
    pg.locator('[data-lvl="fn"]').click(); pg.wait_for_timeout(150)
    pg.locator('[data-lw="many"]').fill("Departments"); pg.wait_for_timeout(200)
    ck("the level's word reaches the heading", "DEPARTMENTS" in rows(pg)[3].upper(), rows(pg)[3])
    pg.locator('[data-part="swot"]').click(); pg.wait_for_timeout(150)
    ck("a part switches on", pg.locator('[data-part="swot"]').get_attribute("aria-pressed")=="true")

    print("3 · Raya — the other way round, and the gaps are named")
    pg.locator('[data-client="raya"]').click(); pg.wait_for_timeout(300)
    r=rows(pg)
    ck("units at Layer 3 under their own layer", r[1].startswith("LAYER 2 DIVISIONS") and r[2].startswith("LAYER 3 BUSINESS UNITS"), r[:3])
    ck("functions at Layer 2, ungrouped", r[3].startswith("LAYER 2 SUPPORTING FUNCTIONS"), r[3])
    ck("four units need one", pg.locator(".box.orphan").count()==4, pg.locator(".box.orphan").count())
    pg.locator(".box.orphan").first.click(); pg.wait_for_timeout(200)
    ck("the panel leads with '— needs one —'", "needs one" in pg.locator('[data-f="parent"]').inner_text())
    pg.locator('[data-f="parent"]').select_option(index=1); pg.wait_for_timeout(250)
    ck("assigning clears that one", pg.locator(".box.orphan").count()==3)

    print("4 · both kinds with a layer at once")
    pg.locator('[data-group="fn"]').click(); pg.wait_for_timeout(200)
    pg.locator('#newin').fill("Clusters"); pg.keyboard.press("Enter"); pg.wait_for_timeout(250)
    ck("naming the layer moves on to naming its first box", pg.locator('#newin').count()==1)
    pg.locator('#newin').fill("Shared Services"); pg.keyboard.press("Enter"); pg.wait_for_timeout(250)
    pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    r=rows(pg)
    ck("two Layer-2 rows, one above each kind", len([x for x in r if x.startswith("LAYER 2")])==2, r)
    ck("with different names", "DIVISIONS" in r[1].upper() and "CLUSTERS" in r[3].upper(), r)
    ck("both kinds at Layer 3", len([x for x in r if x.startswith("LAYER 3")])==2, r)
    ck("the eight functions are flagged", pg.locator(".needs").last.inner_text().upper().startswith("8 NEED A CLUSTER"),
       pg.locator(".needs").last.inner_text())

    print("5 · removing a layer, and putting it back")
    pg.locator('[data-ungroup="fn"]').click(); pg.wait_for_timeout(250)
    ck("the functions return to Layer 2", rows(pg)[3].startswith("LAYER 2 SUPPORTING FUNCTIONS"), rows(pg)[3])
    ck("nothing is flagged any more", pg.locator(".needs").count()<=1)
    pg.locator('[data-group="fn"]').click(); pg.wait_for_timeout(200)
    pg.locator('#newin').fill("Clusters"); pg.keyboard.press("Enter"); pg.wait_for_timeout(250)
    pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    ck("re-grouping brings the old layer's box back", pg.locator('.box', has_text="Shared Services").count()>=1)

    print("6 · a new client has neither, and builds bottom-up")
    pg.locator('[data-client="fresh"]').click(); pg.wait_for_timeout(300)
    r=rows(pg)
    ck("three rows, nothing in them", len(r)==3 and pg.locator(".box").count()==1, [len(r), pg.locator(".box").count()])
    ck("both kinds offer to create a layer; none exists",
       pg.locator("[data-group]").count()==2 and pg.locator("[data-ungroup]").count()==0)
    ck("everything is Layer 1 or 2", all(x.startswith("LAYER 1") or x.startswith("LAYER 2") for x in r), r)
    pg.locator('.add').last.click(); pg.wait_for_timeout(150)
    pg.locator('#newin').fill("Finance"); pg.keyboard.press("Enter"); pg.wait_for_timeout(200)
    pg.keyboard.press("Escape"); pg.wait_for_timeout(150)
    ck("a function added first sits at Layer 2", rows(pg)[2].startswith("LAYER 2 FUNCTIONS 1"), rows(pg)[2])
    pg.locator('[data-group="fn"]').click(); pg.wait_for_timeout(200)
    pg.locator('#newin').fill("Divisions"); pg.keyboard.press("Enter"); pg.wait_for_timeout(250)
    pg.locator('#newin').fill("Commercial"); pg.keyboard.press("Enter"); pg.wait_for_timeout(250)
    pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    r=rows(pg)
    ck("grouping them creates the layer and drops them to Layer 3",
       r[2].startswith("LAYER 2 DIVISIONS 1") and r[3].startswith("LAYER 3 FUNCTIONS 1"), r)
    ck("and Finance is waiting for a Division", pg.locator(".box.orphan").count()==1)
    ck("the units are untouched at Layer 2", rows(pg)[1].startswith("LAYER 2 BUSINESS UNITS 0"), rows(pg)[1])
    print("7 \u00b7 the navigation, derived \u2014 held to what the live platform answers")
    def sides(pg): return [t.strip() for t in pg.locator("#navrow .t").all_inner_texts()]
    def inside(pg): return [t.strip() for t in pg.locator("#navrow2 .t").all_inner_texts()]
    pg.locator('[data-client="elabd"]').click(); pg.wait_for_timeout(300)
    ck("El Abd's sides are its divisions \u2014 navSides() answers the same today",
       sides(pg)==["ElAbd","Commercial","Operations","Corporate Support"], sides(pg))
    ck("and inside is the first division's five functions",
       inside(pg)==["Retail","External Sales","E-Commerce","Marketing","Customer Experience"], inside(pg))
    pg.locator('[data-client="raya"]').click(); pg.wait_for_timeout(300)
    ck("Raya's sides are the two KINDS, not its divisions \u2014 as today",
       sides(pg)==["Raya Trade","Business units","Supporting Functions"], sides(pg))
    ck("its divisions group the units inside their own side",
       any("Distribution" in x for x in inside(pg)), inside(pg))
    pg.locator('[data-client="fresh"]').click(); pg.wait_for_timeout(300)
    ck("a new client has no sides at all", sides(pg)==["New client"], sides(pg))
    ck("no script errors anywhere", not errs, errs[:2])
    pg.screenshot(path="/tmp/claude-0/-home-user-SMP/a7f5ef4d-11bc-512f-b7f0-b2913a11888a/scratchpad/shape.png")
    b.close()
print("\nALL GOOD" if not bad else "\n%d FAILED"%bad)
sys.exit(1 if bad else 0)
