"""REMOVING A PILLAR OR A PROJECT (§232).

Islam asked for an option for the SMO to delete a pillar or a project; the
mockup (design-mockups/pillar-project-remove/) was signed off 2026-09-01.

What is asserted, and why each end matters (§94.2 — a check that only looks
for something present cannot see a control that should not be drawn):

  - read mode draws NO remove control, and a unit head sees none either;
  - the pen draws the worded control in the pinned editing head, hittable
    at its own centre (§93.4 — present-and-unreachable has shipped before);
  - pressing it opens the platform's own confirmation naming what the thing
    holds and what has been reported against it this cycle;
  - Cancel costs nothing;
  - Confirm archives FIRST, then removes — the row gone from the DATA, the
    archive holding it, and the surviving rows keeping their ids, because
    renumbering would hand one pillar's history to another (§69.13);
  - the archive restores from the real Setup control — including for a
    pillars FUNCTION, whose `fn:` archives §232 found un-restorable
    (UNITS[] cannot resolve them), which mattered the moment removal
    started writing them.
"""
import os
from playwright.sync_api import sync_playwright

URL = "file://" + os.path.abspath(os.path.join(os.path.dirname(__file__), "..",
      "strategy-management-platform.html"))
bad = 0
def ck(w, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — %s" % (x,)) if not ok and x != "" else ""))

def press(pg, sel):
    el = pg.query_selector(sel)
    if el: el.click(); return True
    ck("press " + sel, False, "not drawn"); return False

def to_functions(pg):
    for _ in range(3):
        on = pg.eval_on_selector_all("#units .navswitch .nsw.on",
                                     "e=>e.map(x=>x.textContent.trim())")
        if on and on[0] == "Functions": return
        pg.click("#units .navswitch"); pg.wait_for_timeout(150)

def to_units(pg):
    for _ in range(3):
        on = pg.eval_on_selector_all("#units .navswitch .nsw.on",
                                     "e=>e.map(x=>x.textContent.trim())")
        if on and on[0] == "Units": return
        pg.click("#units .navswitch"); pg.wait_for_timeout(150)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1500, "height": 2400})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(URL); pg.wait_for_timeout(1500)

    # ── 1 · the closed ends: read mode, and a viewer with no pen ────────
    pg.select_option("#asWho", "mobhead"); pg.wait_for_timeout(250)
    pg.click('#units button[data-u="mobile"]'); pg.wait_for_timeout(500)
    ck("a unit head sees no remove control anywhere",
       pg.evaluate("() => document.querySelectorAll('.rmplan').length") == 0)

    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(250)
    pg.click('#units button[data-u="mobile"]'); pg.wait_for_timeout(500)
    ck("the office, pen OFF: no remove control either",
       pg.evaluate("() => document.querySelectorAll('.rmplan').length") == 0)

    # ── 2 · the pen draws it, in the head that pins, and it is hittable ─
    pen = pg.query_selector('#secrow-in .secpen[data-page="plan"]')
    ck("the plan pen is there", bool(pen))
    pen.click(); pg.wait_for_timeout(500)
    seat = pg.evaluate("""() => {
      const btn = document.querySelector('.ptitle.edhead .rmplan');
      if (!btn) return { none: true };
      const r = btn.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2);
      return { word: btn.textContent.trim(),
               hittable: hit === btn || btn.contains(hit) };
    }""")
    ck("pen ON: the worded control sits in the editing head",
       not seat.get("none") and seat["word"].startswith("Remove this "), seat)
    ck("...and it is hittable at its own centre",
       not seat.get("none") and seat["hittable"], seat)

    # ── 3 · pressing opens the confirmation; Cancel costs nothing ───────
    before = pg.evaluate("""() => ({
      n: UNITS.mobile.items.length,
      ids: UNITS.mobile.items.map(x => x.id),
      arch: ARCHIVES.length })""")
    press(pg, '.ptitle.edhead .rmplan'); pg.wait_for_timeout(400)
    dlg = pg.evaluate("""() => {
      const ov = document.querySelector('.overlay.on .rmconfirm');
      if (!ov) return { none: true };
      const rep = ov.querySelector('.repline');
      return { sub: document.getElementById('modal-s').textContent,
               holds: ov.querySelector('p').textContent,
               rep: rep ? rep.textContent : null,
               arch: ov.querySelector('.archline').textContent };
    }""")
    ck("the confirmation opens, naming the pillar",
       not dlg.get("none") and "MB01" in dlg["sub"], dlg)
    ck("...says what it holds", not dlg.get("none")
       and "measure" in dlg["holds"] and "tactic" in dlg["holds"], dlg)
    # Mobile's first pillar carries reported actuals in the demo, so the
    # amber line must be there and must carry a count.
    ck("...and warns what has been reported this cycle",
       not dlg.get("none") and dlg["rep"] and "reported this cycle" in dlg["rep"]
       and any(c.isdigit() for c in dlg["rep"]), dlg)
    ck("...and names the way back", not dlg.get("none")
       and "archived first" in dlg["arch"], dlg)
    press(pg, '.rmconfirm [data-rmno]'); pg.wait_for_timeout(300)
    after_cancel = pg.evaluate("""() => ({
      n: UNITS.mobile.items.length, arch: ARCHIVES.length,
      open: !!document.querySelector('.overlay.on') })""")
    ck("Cancel: dialog closed, nothing removed, nothing archived",
       not after_cancel["open"] and after_cancel["n"] == before["n"]
       and after_cancel["arch"] == before["arch"], (before, after_cancel))

    # ── 4 · Confirm: archive first, row gone, survivors keep their ids ──
    press(pg, '.ptitle.edhead .rmplan'); pg.wait_for_timeout(400)
    press(pg, '.rmconfirm [data-rmyes]'); pg.wait_for_timeout(500)
    after = pg.evaluate("""() => ({
      n: UNITS.mobile.items.length,
      ids: UNITS.mobile.items.map(x => x.id),
      arch: ARCHIVES.length,
      top: ARCHIVES[0] ? { kind: ARCHIVES[0].kind, key: ARCHIVES[0].key,
                           why: ARCHIVES[0].why,
                           pillars: (ARCHIVES[0].counts || {}).pillars } : null })""")
    ck("Confirm: the pillar is gone from the data",
       after["n"] == before["n"] - 1, (before["n"], after["n"]))
    ck("...the archive was taken first, of the WHOLE standing plan",
       after["arch"] == before["arch"] + 1 and after["top"]
       and after["top"]["kind"] == "unit" and after["top"]["key"] == "mobile"
       and after["top"]["pillars"] == before["n"], after["top"])
    ck("...and its why names what was removed", bool(after["top"])
       and "removed" in (after["top"]["why"] or ""), after["top"])
    ck("...and the survivors keep their ids — nothing renumbered",
       after["ids"] == before["ids"][1:], (before["ids"], after["ids"]))

    # ── 5 · the way back, through the real Setup control ────────────────
    arch_id = pg.evaluate("() => ARCHIVES[0] ? ARCHIVES[0].id : null")
    pg.evaluate("()=>document.querySelector('[data-md=\"setup\"]').click()")
    pg.wait_for_timeout(400)
    pg.evaluate("()=>document.querySelector('[data-setupgo=\"import\"]').click()")
    pg.wait_for_timeout(400)
    # the page is two sections (§108.4); the archives are the second
    pg.evaluate("""()=>{ const b=[...document.querySelectorAll('.secrow button')]
      .find(x=>x.textContent.includes('Archived')); if (b) b.click(); }""")
    pg.wait_for_timeout(400)
    rbtn = arch_id and pg.query_selector('[data-restore="%s"]' % arch_id)
    ck("the archive row offers Restore", bool(rbtn))
    if rbtn:
        rbtn.click(); pg.wait_for_timeout(500)
    restored = pg.evaluate("() => UNITS.mobile.items.length")
    ck("restoring puts the pillar back", restored == before["n"], restored)

    # ── 6 · a project, on a function ────────────────────────────────────
    to_functions(pg)
    pg.click('#units button[data-u="fn:finance"]'); pg.wait_for_timeout(500)
    pen = pg.query_selector('#secrow-in .secpen[data-page="plan"]')
    ck("the projects pen is there", bool(pen))
    pen.click(); pg.wait_for_timeout(500)
    pb = pg.evaluate("""() => {
      const btn = document.querySelector('.pband.edband .rmplan');
      if (!btn) return { none: true };
      const r = btn.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2);
      const id = btn.dataset.rmrow.split('|')[1];
      const c = capOfProjectId(id);
      return { word: btn.textContent.trim(), id, capId: c.id,
               n: c.projects.length, ids: c.projects.map(x => x.id),
               rail: RAIL[railKeyFor(c)] || null,
               arch: ARCHIVES.length,
               hittable: hit === btn || btn.contains(hit) };
    }""")
    ck("the project band carries its own worded control, hittable",
       not pb.get("none") and pb["word"] == "Remove this project"
       and pb["hittable"], pb)
    press(pg, '.pband.edband .rmplan'); pg.wait_for_timeout(400)
    pdlg = pg.evaluate("""() => {
      const ov = document.querySelector('.overlay.on .rmconfirm');
      if (!ov) return { none: true };
      return { holds: ov.querySelector('p').textContent };
    }""")
    ck("the project confirmation counts its three lists",
       not pdlg.get("none") and "deliverable" in pdlg["holds"]
       and "outcome" in pdlg["holds"] and "milestone" in pdlg["holds"], pdlg)
    press(pg, '.rmconfirm [data-rmyes]'); pg.wait_for_timeout(500)
    pafter = pg.evaluate("""(spec) => {
      const cap = GROUP.capabilities.filter(x => x.id === spec.capId)[0];
      return { n: cap.projects.length, ids: cap.projects.map(x => x.id),
               rail: RAIL[railKeyFor(cap)] || null,
               arch: ARCHIVES.length,
               top: ARCHIVES[0] ? { kind: ARCHIVES[0].kind } : null };
    }""", pb)
    ck("Confirm: the project is gone, id-stable, archive taken",
       pafter["n"] == pb["n"] - 1 and pafter["ids"] == [i for i in pb["ids"] if i != pb["id"]]
       and pafter["arch"] == pb["arch"] + 1 and pafter["top"]["kind"] == "cap", (pb, pafter))
    ck("...and the rail is not holding the removed project",
       pafter["rail"] != pb["id"], pafter)

    # ── 7 · a pillars FUNCTION: the archive §232 made restorable ────────
    pk = pg.evaluate("""() => FUNCTION_KEYS.filter(k =>
      fnPlansInPillars(FUNCTIONS[k]) && (fnAsUnit(k).items || []).length)[0] || null""")
    ck("the demo holds a pillars function with a plan", bool(pk), pk)
    if pk:
        pg.click('#units button[data-u="fn:%s"]' % pk); pg.wait_for_timeout(500)
        pen = pg.query_selector('#secrow-in .secpen[data-page="plan"]')
        if pen: pen.click(); pg.wait_for_timeout(500)
        fn_before = pg.evaluate("(k) => fnAsUnit(k).items.length", pk)
        ck("the pillars function draws the control too",
           bool(pg.query_selector('.ptitle.edhead .rmplan')))
        press(pg, '.ptitle.edhead .rmplan'); pg.wait_for_timeout(400)
        press(pg, '.rmconfirm [data-rmyes]'); pg.wait_for_timeout(500)
        fnr = pg.evaluate("""(k) => ({
          n: fnAsUnit(k).items.length,
          top: ARCHIVES[0] ? { kind: ARCHIVES[0].kind, key: ARCHIVES[0].key,
                               id: ARCHIVES[0].id } : null })""", pk)
        ck("the pillar is gone and the archive is keyed fn:",
           fnr["n"] == fn_before - 1 and fnr["top"]
           and fnr["top"]["key"] == "fn:" + pk, fnr)
        # The restore road — broken for every fn: archive before §232.
        pg.evaluate("()=>document.querySelector('[data-md=\"setup\"]').click()")
        pg.wait_for_timeout(400)
        pg.evaluate("()=>document.querySelector('[data-setupgo=\"import\"]').click()")
        pg.wait_for_timeout(400)
        pg.evaluate("""()=>{ const b=[...document.querySelectorAll('.secrow button')]
          .find(x=>x.textContent.includes('Archived')); if (b) b.click(); }""")
        pg.wait_for_timeout(400)
        rbtn = pg.query_selector('[data-restore="%s"]' % fnr["top"]["id"])
        ck("a pillars function's archive offers Restore (the §232 fix)",
           bool(rbtn))
        if rbtn:
            rbtn.click(); pg.wait_for_timeout(500)
        ck("...and restoring puts the function's pillar back",
           pg.evaluate("(k) => fnAsUnit(k).items.length", pk) == fn_before)

    ck("no console errors", not errs, errs[:3])
    b.close()
print(("\n%d FAILED" % bad) if bad else "\nall passed")
raise SystemExit(1 if bad else 0)
