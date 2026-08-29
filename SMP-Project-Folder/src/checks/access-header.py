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

    # ── 4 · EVERY CELL THE TABLE OFFERS CAN ACTUALLY BE REACHED ──────────
    # THE GENERAL FORM, not a list of the pairs somebody noticed. `areaFor()`
    # decides which column a page consults; if a role can never make the table
    # answer with a given column, that cell is a control with nothing behind
    # it. Asked of the RESOLVER for every role, so a role added later, or a
    # change to who owns what, is judged the day it lands — which is exactly
    # what did NOT happen when `roleOwns()` and the matrix each kept their own
    # idea of who owns everything (§175).
    #
    # A UNIT PAGE ASKS THE UNIT AREAS AND A FUNCTION PAGE THE FUNCTION ONES.
    # Crossing every area with every target asks "what is the unit grant for a
    # function page", which nothing in the product ever does — and it made a
    # function head look as though they reached `a_unit_own`.
    print("\n4 · every cell offered is a cell that can be reached")
    reach = pg.evaluate("""()=>{
      const R = SMPRules, w = world();
      const pairs = [['unit', UNIT_KEYS], ['unit_strat', UNIT_KEYS],
                     ['fn', FUNCTION_KEYS.map(k=>'fn:'+k)],
                     ['fn_strat', FUNCTION_KEYS.map(k=>'fn:'+k)]];
      /* Granted roles say where they may sit; the derived ones never can —
         `roleWheres()` falls through to "every unit" for them, which is simply
         untrue — so their places come from what `personRoles()` actually
         mints on this register. */
      const DERIVED = {powner:1, plowner:1, contrib:1};
      const derived = {};
      PEOPLE.forEach(p => { (R.personRoles(w, p) || []).forEach(r => {
        (derived[r.role] = derived[r.role] || {})[r.at] = 1; }); });
      const out = {};
      (R.ROLES || []).forEach(role => {
        let ws;
        if (DERIVED[role.key]) ws = Object.keys(derived[role.key] || {});
        else { try { ws = roleWheres(role.key).map(x => x.v); } catch (e) { ws = []; } }
        const hit = {};
        ws.forEach(at => {
          const r = { role: role.key, at: at };
          pairs.forEach(pr => pr[1].forEach(t => { hit[R.areaFor(pr[0], w, r, t)] = 1; }));
        });
        out[role.key] = { places: ws.length, reaches: Object.keys(hit) };
      });
      return out; }""")
    offered = pg.evaluate("""()=>{
      const keys = SMPRules.AREAS.map(a => a.key);
      const out = {};
      document.querySelectorAll('.acgrid tbody tr').forEach(tr => {
        const row = {};
        [...tr.querySelectorAll('td.ac')].forEach((td, i) => {
          /* `td.ac` IS ALREADY ONLY THE AREA CELLS — the role's name is a
             `td.rolecell` and is not in this list — so the first of them is
             AREAS[0], not AREAS[1]. The off-by-one reported every role as
             offering columns it does not and withholding ones it does. */
          row[keys[i]] = !!td.querySelector('[data-ac]'); });
        out[tr.getAttribute('data-role') || tr.querySelector('.rolecell b').textContent.trim()] = row;
      });
      return out; }""")
    names = pg.evaluate("()=>{const o={}; (SMPRules.ROLES||[]).forEach(r=>o[r.key]=r.name); return o;}")
    SPLIT = ["a_unit_own_strat", "a_unit_own", "a_unit_other",
             "a_fn_own_strat", "a_fn_own", "a_fn_other"]
    unmeasured = []
    for key, info in reach.items():
        name = names.get(key, key)
        row = offered.get(name)
        if row is None:
            continue
        # NOT SKIPPED IN SILENCE (§54.5). A role nobody on this register holds
        # has no places to derive, so nothing here can be measured for it — and
        # saying so is the honest outcome, not passing it over.
        if not info["places"]:
            unmeasured.append(name)
            continue
        dead = [a for a in SPLIT if a not in info["reaches"] and row.get(a)]
        ck("%s: no column is offered that this role can never reach" % name,
           not dead, dead)
        # BOTH ENDS (§113.8): a build that dashed the whole table would satisfy
        # every assertion above and be useless.
        live = [a for a in SPLIT if a in info["reaches"] and not row.get(a)]
        ck("%s: ...and every column it CAN reach is offered" % name, not live, live)
    print("  (not measurable on this register: %s)" %
          (", ".join(unmeasured) if unmeasured else "none"))

    # ── 5 · THE THREE ISLAM NAMED, BY NAME ───────────────────────────────
    # The general assertion above covers these, and they are written out as
    # well because the report they came from is worth keeping legible — and
    # because the third is one where the derivation disagreed with him.
    print("\n5 · the pairs that were reported")
    ck("a project owner is offered no OWN business unit column",
       not offered["Project owner"]["a_unit_own"]
       and not offered["Project owner"]["a_unit_own_strat"])
    ck("a BU owner is offered no OWN supporting function column",
       not offered["BU owner"]["a_fn_own"]
       and not offered["BU owner"]["a_fn_own_strat"])
    ck("a pillar owner KEEPS the own-function columns",
       offered["Pillar owner"]["a_fn_own"] and offered["Pillar owner"]["a_fn_own_strat"])
    ck("...because a pillars function really does derive them",
       any(str(a).startswith("fn:") for a in
           pg.evaluate("""()=>{const w=world(); const s={};
             PEOPLE.forEach(p=>(SMPRules.personRoles(w,p)||[]).forEach(r=>{
               if (r.role==='plowner') s[r.at]=1; })); return Object.keys(s);}""")))
    # AND THE OFFICE ROWS READ THE SAME COLUMNS (§175), which is the whole of
    # what the SMO team row was getting wrong.
    same = pg.evaluate("""()=>{const R=SMPRules, w=world(),
        u=UNIT_KEYS[0], f='fn:'+FUNCTION_KEYS[0];
      const one=k=>R.areaFor('unit',w,{role:k,at:'group'},u)+'|'+
                   R.areaFor('fn',w,{role:k,at:'group'},f);
      return {super:one('super'), smoteam:one('smoteam'), gceo:one('gceo')};}""")
    ck("the Super user and the SMO team read the same columns",
       same["super"] == same["smoteam"], same)
    ck("...and it is the OWN pair, not the other one",
       same["smoteam"] == "a_unit_own|a_fn_own", same)

    pg.close()
    b.close()

print("\npage errors: %d" % len(errs))
for e in errs[:4]:
    print("   " + e)
print(("\nFAILURES: %d" % bad) if (bad or errs) else "\nall clear")
raise SystemExit(1 if (bad or errs) else 0)
