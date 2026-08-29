"""THE MATRIX HEADER, AND THE CELLS THAT COULD NEVER COME UP (§174).

Islam, from using Roles & access: *"make the header sticky, and use acronyms to
make it smaller — BU, Func., Support — so the header becomes maximum 2 lines,
and align the header content vertically in the middle in the 1st row."* Then,
separately: *"a project owner has options to edit or fill in a business unit.
Business units have no project owners."*

WHAT IS ASSERTED IS THE PROBLEM, NOT THE WORDING (§94.8). The exact words are
his to change; what must not come back is a heading three or four lines deep, a
head that scrolls away, and a cell offering a choice with nothing behind it.

  * no heading exceeds TWO lines, at four widths — measured with a Range,
    because a table cell returns one client rect however many lines it holds
    (§105.2);
  * the top row is vertically centred;
  * the head STAYS while the rows scroll — and both rows of it, since the head
    is two deep and a second offset would be a hole (§130.10);
  * the box ends inside the window and the head never sits behind the chrome,
    which is what §163.5 un-pinned this table to avoid;
  * the full name survives on the hover of every shortened heading, so
    abbreviating loses nothing (§88's rule for a clipped value, applied to one
    deliberately shortened);
  * a role can never be offered a column it could never hold — asked of the
    DERIVATION through `SMPRules.personRoles`, not of a list copied into this
    file, so a role added later is judged by the same rule the product uses;
  * and the one pair Islam expected to go is asserted to STAY, because a
    supporting function that plans in pillars really does have pillar owners.

Run: SMP_CHROME=... python3 qa-run.py checks/access-header.py
"""
import pathlib
from playwright.sync_api import sync_playwright

URL = "file://" + str(pathlib.Path(
    pathlib.Path(__file__).resolve().parent.parent,
    "strategy-management-platform.html").resolve())

bad = 0
errs = []


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


# A CELL RETURNS ONE RECT HOWEVER MANY LINES IT HOLDS (§105.2): ask a Range
# over its contents and count distinct tops.
HEAD = """()=>{
  const box=document.querySelector('.acgrid'), t=box.querySelector('table');
  const lines=e=>{const r=document.createRange(); r.selectNodeContents(e);
    const rc=[...r.getClientRects()].filter(x=>x.width>0);
    return new Set(rc.map(x=>Math.round(x.top))).size||1;};
  const th=[...t.querySelectorAll('thead th')];
  return {over: th.filter(e=>lines(e)>2).map(e=>e.textContent.trim()),
          height: Math.round(t.querySelector('thead').getBoundingClientRect().height),
          valign: getComputedStyle(th[0]).verticalAlign,
          /* THE AREA COLUMNS ONLY. "Role" names the rows rather than an area,
             was never shortened and has nothing to explain — asserting a
             hover on it would be asserting the check's own assumption. */
          titles: th.filter(e=>e.classList.contains('ac') && e.textContent.trim().length)
                    .map(e=>({t:e.textContent.trim(), has:!!(e.getAttribute('title')||'').trim()})),
          boxBottom: Math.round(box.getBoundingClientRect().bottom),
          chrome: Math.round((document.querySelector('.chrome')||{getBoundingClientRect:()=>({bottom:0})})
                    .getBoundingClientRect().bottom)}; }"""


def open_access(pg):
    pg.evaluate("()=>document.querySelector('[data-md=\"setup\"]').click()")
    pg.wait_for_timeout(450)
    pg.evaluate("()=>document.querySelector('[data-setupgo=\"access\"]').click()")
    pg.wait_for_timeout(1200)


with sync_playwright() as p:
    b = p.chromium.launch()

    # ── 1 · TWO LINES, CENTRED, AT EVERY WIDTH ───────────────────────────
    print("\n1 · the header at four widths")
    for W, H in ((1600, 950), (1400, 900), (1180, 800), (1024, 760)):
        pg = b.new_page(viewport={"width": W, "height": H})
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(URL, wait_until="networkidle")
        pg.wait_for_timeout(2000)
        open_access(pg)
        d = pg.evaluate(HEAD)
        ck("%dx%d: no heading runs past two lines" % (W, H), not d["over"], d["over"])
        ck("%dx%d: the top row is vertically centred" % (W, H), d["valign"] == "middle", d["valign"])
        # THE BOX ENDS INSIDE THE WINDOW. A capped box that overruns is what a
        # guessed constant produces, and the first build of this overran by 5px.
        ck("%dx%d: the box ends inside the window" % (W, H), d["boxBottom"] <= H + 1,
           "%d in %d" % (d["boxBottom"], H))

        # ── 2 · IT STAYS WHILE THE ROWS SCROLL ───────────────────────────
        y0 = pg.evaluate("()=>Math.round(document.querySelector('.acgrid thead th').getBoundingClientRect().top)")
        r0 = pg.evaluate("()=>Math.round(document.querySelector('.acgrid thead tr:nth-child(2) th').getBoundingClientRect().top)")
        moved = pg.evaluate("""()=>{const b=document.querySelector('.acgrid');
            const was=b.scrollTop; b.scrollTop=999; return b.scrollTop>was;}""")
        pg.wait_for_timeout(350)
        y1 = pg.evaluate("()=>Math.round(document.querySelector('.acgrid thead th').getBoundingClientRect().top)")
        r1 = pg.evaluate("()=>Math.round(document.querySelector('.acgrid thead tr:nth-child(2) th').getBoundingClientRect().top)")
        if moved:
            ck("%dx%d: the head holds while the rows scroll" % (W, H), y0 == y1, "%d -> %d" % (y0, y1))
            # BOTH ROWS, or the lower one slides under the upper and the column
            # names stop lining up with the columns (§130.10).
            ck("%dx%d: ...and the second row holds with it" % (W, H), r0 == r1, "%d -> %d" % (r0, r1))
            ck("%dx%d: ...and never behind the chrome" % (W, H), y1 >= d["chrome"] - 1,
               "head %d, chrome ends %d" % (y1, d["chrome"]))
        pg.close()

    # ── 3 · THE FULL NAME IS ONE HOVER AWAY ──────────────────────────────
    print("\n3 · nothing is lost by shortening")
    pg = b.new_page(viewport={"width": 1600, "height": 950})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL, wait_until="networkidle")
    pg.wait_for_timeout(2000)
    open_access(pg)
    d = pg.evaluate(HEAD)
    ck("every heading carries its full name on the hover",
       all(x["has"] for x in d["titles"]),
       [x["t"] for x in d["titles"] if not x["has"]])
    # AND THE SENTENCES DID NOT MOVE WITH THE COLUMN. `label` is what the
    # product says in prose; only the header was shortened.
    ck("the area's spoken name is untouched",
       pg.evaluate("""()=>SMPRules.AREAS.filter(a=>a.short)
           .every(a=>a.label && a.label.length > a.short.length)"""))

    # ── 4 · A COLUMN A ROLE COULD NEVER HOLD IS NOT OFFERED ──────────────
    # ASKED OF THE DERIVATION, not of a list copied here (§53.5): a role is
    # held wherever `personRoles()` can mint it, and nowhere else.
    print("\n4 · cells that could never come up")
    reach = pg.evaluate("""()=>{
      const w = world();
      const out = {};
      (SMPRules.ROLES || []).forEach(r => { out[r.key] = {unit:false, fn:false}; });
      PEOPLE.forEach(p => {
        (SMPRules.personRoles(w, p) || []).forEach(r => {
          if (!out[r.role]) out[r.role] = {unit:false, fn:false};
          if (String(r.at).indexOf('fn:') === 0) out[r.role].fn = true;
          else if (r.at !== 'group' && String(r.at).indexOf('co:') !== 0) out[r.role].unit = true;
        });
      });
      return out; }""")
    offered = pg.evaluate("""()=>{
      const out = {};
      document.querySelectorAll('.acgrid tbody tr').forEach(tr => {
        const name = tr.querySelector('.rolecell b').textContent.trim();
        out[name] = [...tr.querySelectorAll('td.ac')]
          .map(td => !!td.querySelector('[data-ac]'));
      });
      return out; }""")
    # Column order follows AREAS: 0 group, 1 unit-own-strat, 2 unit-own,
    # 3 unit-other, 4 fn-own-strat, 5 fn-own, 6 fn-other, 7 cycle, 8 setup.
    ck("a project owner is offered no OWN business unit column",
       offered.get("Project owner", [True] * 9)[1] is False
       and offered.get("Project owner", [True] * 9)[2] is False,
       offered.get("Project owner"))
    ck("...and the derivation agrees they never hold one",
       reach.get("powner", {}).get("unit") is False, reach.get("powner"))
    ck("a BU owner is offered no OWN supporting function column",
       offered.get("BU owner", [True] * 9)[4] is False
       and offered.get("BU owner", [True] * 9)[5] is False,
       offered.get("BU owner"))
    # ── AND THE ONE THAT MUST STAY (§113.8: assert the absence AND the
    # presence, or a build that dashed the whole table would pass) ────────
    ck("a pillar owner KEEPS the own-function columns",
       offered.get("Pillar owner", [False] * 9)[4] is True
       and offered.get("Pillar owner", [False] * 9)[5] is True,
       offered.get("Pillar owner"))
    ck("...because a pillars function really does derive them",
       reach.get("plowner", {}).get("fn") is True, reach.get("plowner"))
    ck("...and a project owner keeps OTHER business units",
       offered.get("Project owner", [False] * 9)[3] is True,
       offered.get("Project owner"))
    pg.close()
    b.close()

print("\npage errors: %d" % len(errs))
for e in errs[:4]:
    print("   " + e)
print(("\nFAILURES: %d" % bad) if (bad or errs) else "\nall clear")
raise SystemExit(1 if (bad or errs) else 0)
