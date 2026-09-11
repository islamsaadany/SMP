"""REMOVING A CAPABILITY: two answers, not one (§320).

Islam, trying to take a wrapper off one of his own functions: "when I try to
remove the capability it will remove the projects with it." It did — a splice
behind the BROWSER's own confirm, with no archive — while removing a pillar or
a project has archived and been restorable since §232. The mockup
(design-mockups/capability-remove/) was signed off 2026-09-11: two rows, each
saying what it does.

What is asserted, and why each end matters (§94.2):

  - the browser's dialog is GONE and the platform's own is drawn, with two
    answers rather than one — a check that only looked for the new dialog
    would pass on a build that raised both;
  - Cancel costs nothing;
  - KEEP THE PROJECTS moves them and keeps their ids AND THEIR CODES — the
    codes are the promise the dialog makes in words, and they are a POSITION
    across the whole function (§310), so a naive append renumbers them;
  - the figures inside the moved projects survive, read back from the DATA
    rather than from the screen (§96);
  - REMOVE EVERYTHING takes them, and the archive holds the way back —
    the half that did not exist at all before this;
  - the only-capability case SAYS why it cannot move them rather than
    hiding the row (§45.2, §61), and holds the button with `aria-disabled`
    so the reason stays reachable (§221, §163);
  - and the TEMPLE's own Remove — the second door onto the same act — opens
    the same dialog, because a fix that reaches one copy of a control leaves
    the other (§272.7).

SMP_BUILT points it at another build, so it can be run against the build
before (§276: a broken build is made from the SOURCES).
"""
import os
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or os.path.join(
    os.path.dirname(__file__), "..", "strategy-management-platform.html")
URL = "file://" + os.path.abspath(BUILT)

bad = 0
def ck(w, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — %s" % (x,)) if not ok and x != "" else ""))

def ev(pg, js, dflt=None):
    """Every probe degrades (§215): a build without the feature must REPORT,
       never die partway and leave later sections unmade."""
    try: return pg.evaluate(js)
    except Exception as e: return dflt if dflt is not None else {"err": str(e)[:90]}

def to_caps(pg):
    """Setup › Capabilities, from wherever the page is."""
    try:
        pg.click('[data-md="setup"]', timeout=3000); pg.wait_for_timeout(400)
        pg.click('.ritem[data-setupgo="caps"]', timeout=3000); pg.wait_for_timeout(400)
        return True
    except Exception:
        return False

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1500, "height": 2200})
    errs, natives = [], []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    # A NATIVE confirm() is auto-dismissed and RECORDED — the old build raised
    # one here, and "no browser dialog" is half of what this file asserts.
    pg.on("dialog", lambda d: (natives.append(d.message), d.dismiss()))
    pg.goto(URL); pg.wait_for_timeout(1500)
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(300)

    print("\n§1 · the platform's own dialog, with two answers")
    ck("Setup › Capabilities opens", to_caps(pg))
    start = ev(pg, """() => ({
      caps: GROUP.capabilities.map(c => c.id),
      mkt:  GROUP.capabilities.filter(c => c.fn === 'marketing').map(c => c.id) })""")
    ck("the worked example still holds Marketing's two capabilities (the only pair)",
       isinstance(start, dict) and start.get("mkt") == ["cap4", "cap6"], start)

    # the codes BEFORE, read off the product's own reader
    codes0 = ev(pg, """() => {
      const o = {};
      fnProjects('marketing').forEach(p => { o[p.id] = projCode('marketing', p); });
      return o; }""", {})
    ck("Marketing's project codes read before the move", len(codes0) == 3, codes0)

    try:
        pg.click('[data-caprm="cap4"]', timeout=3000); pg.wait_for_timeout(400)
    except Exception:
        ck("Remove is addressed by the capability's id", False, "no [data-caprm=cap4]")
    ck("no browser dialog is raised", not natives, natives)
    dlg = ev(pg, """() => {
      const ov = document.querySelector('.overlay.on .rmconfirm');
      if (!ov) return { none: true };
      const picks = [...ov.querySelectorAll('.pick')];
      return { picks: picks.length,
               titles: picks.map(x => (x.querySelector('.t')||{}).textContent),
               safe: picks.filter(x => x.classList.contains('safe')).length,
               keep: !!ov.querySelector('[data-capkeep]'),
               all:  !!ov.querySelector('[data-caprmall]'),
               cancel: !!ov.querySelector('[data-rmno]'),
               dest: (ov.querySelector('[data-capkeep]')
                      ? ov.querySelector('.pick .d').textContent : ''),
               sel: !!ov.querySelector('[data-capdest]') }; }""")
    ck("pressing Remove opens the platform's own confirmation",
       not dlg.get("none") and dlg.get("picks") == 2, dlg)
    ck("...with both answers and a Cancel",
       dlg.get("keep") and dlg.get("all") and dlg.get("cancel"), dlg)
    ck("...the two answers say what they do",
       dlg.get("titles") == ["Keep the projects", "Remove everything"], dlg)
    ck("...exactly one of them is the safe one",
       dlg.get("safe") == 1, dlg)
    ck("...and with ONE sibling the destination is NAMED, not a picker",
       (not dlg.get("sel")) and "Product Mindset" in (dlg.get("dest") or ""), dlg)

    print("\n§2 · Cancel costs nothing")
    try: pg.click('[data-rmno]', timeout=3000)
    except Exception: pass
    pg.wait_for_timeout(300)
    after_cancel = ev(pg, "() => GROUP.capabilities.map(c => c.id)", [])
    ck("Cancel leaves every capability standing",
       after_cancel == start.get("caps"), after_cancel)

    print("\n§3 · Keep the projects — the box goes, the work stays")
    before = ev(pg, """() => {
      const c = capById('cap4');
      return { ids: (c.projects||[]).map(p => p.id),
               arch: ARCHIVES.length,
               figs: (c.projects||[]).reduce((n,p) =>
                 n + (p.outcomes||[]).filter(o => o.actual != null && o.actual !== '').length, 0) }; }""")
    # The figures of the MOVED rows, counted where they land — comparing a
    # capability's total before with the destination's total after compares
    # unlike things and reports a working move as broken (§100.3).
    moved_ids = before.get("ids") or []
    try:
        pg.click('[data-caprm="cap4"]', timeout=3000); pg.wait_for_timeout(350)
        pg.click('[data-capkeep]', timeout=3000); pg.wait_for_timeout(600)
    except Exception as e:
        ck("Keep the projects can be pressed", False, str(e)[:80])
    import json as _json
    JSON = _json.dumps(moved_ids)
    kept = ev(pg, """() => {
      const gone = !capById('cap4'), to = capById('cap6');
      const o = {};
      fnProjects('marketing').forEach(p => { o[p.id] = projCode('marketing', p); });
      return { gone: gone,
               held: to ? (to.projects||[]).map(p => p.id) : null,
               capIds: to ? (to.projects||[]).map(p => p.capId) : null,
               codes: o,
               arch: ARCHIVES.length,
               figs: to ? (to.projects||[]).filter(p => IDS.indexOf(p.id) > -1)
                 .reduce((n,p) => n + (p.outcomes||[])
                   .filter(x => x.actual != null && x.actual !== '').length, 0) : 0 }; }""".replace("IDS", JSON))
    ck("the capability is gone", kept.get("gone") is True, kept)
    ck("...its projects are held by the other capability, ids untouched",
       kept.get("held") is not None and
       all(i in (kept.get("held") or []) for i in (before.get("ids") or [])), kept)
    ck("...each moved project now names its new holder",
       kept.get("capIds") is not None and len(set(kept["capIds"])) == 1
       and kept["capIds"][0] == "cap6", kept)
    ck("...AND EVERY CODE IS WHAT IT WAS (§310 — a code is a position)",
       kept.get("codes") == codes0, {"was": codes0, "now": kept.get("codes")})
    ck("...the figures inside them survive",
       kept.get("figs") == before.get("figs"), {"was": before.get("figs"), "now": kept.get("figs")})
    ck("...and the grouping is archived, so the way back exists",
       (kept.get("arch") or 0) > (before.get("arch") or 0), kept)

    print("\n§4 · the only capability of its function")
    pg.reload(); pg.wait_for_timeout(1400)
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(250)
    to_caps(pg)
    try:
        pg.click('[data-caprm="cap7"]', timeout=3000); pg.wait_for_timeout(400)
    except Exception:
        ck("Finance's capability opens the dialog", False, "no [data-caprm=cap7]")
    lone = ev(pg, """() => {
      const ov = document.querySelector('.overlay.on .rmconfirm');
      if (!ov) return { none: true };
      const keep = ov.querySelector('[data-capkeep]');
      const row = keep ? keep.closest('.pick') : null;
      return { drawn: !!keep,
               held: keep ? keep.getAttribute('aria-disabled') : null,
               hard: keep ? keep.hasAttribute('disabled') : null,
               why: row ? row.querySelector('.d').textContent : '',
               safe: row ? row.classList.contains('safe') : null,
               all: !!ov.querySelector('[data-caprmall]') }; }""")
    ck("the row is DRAWN rather than hidden", lone.get("drawn") is True, lone)
    ck("...and says why it cannot move them",
       "only capability" in (lone.get("why") or ""), lone)
    ck("...held with aria-disabled, never `disabled` (the reason stays reachable)",
       lone.get("held") == "true" and lone.get("hard") is False, lone)
    ck("...and it is not dressed as the safe answer", lone.get("safe") is False, lone)
    ck("...while Remove everything is still offered", lone.get("all") is True, lone)

    print("\n§5 · pressing Keep there changes nothing")
    was = ev(pg, "() => GROUP.capabilities.map(c => c.id)", [])
    try: pg.click('[data-capkeep]', timeout=2000)
    except Exception: pass
    pg.wait_for_timeout(400)
    ck("a held answer does nothing when pressed",
       ev(pg, "() => GROUP.capabilities.map(c => c.id)", []) == was)
    try: pg.click('[data-rmno]', timeout=2000)
    except Exception: pass
    pg.wait_for_timeout(250)

    print("\n§6 · Remove everything, and the way back")
    before2 = ev(pg, """() => ({
      pr: (capById('cap7')||{}).projects ? capById('cap7').projects.length : 0,
      arch: ARCHIVES.length })""")
    try:
        pg.click('[data-caprm="cap7"]', timeout=3000); pg.wait_for_timeout(350)
        pg.click('[data-caprmall]', timeout=3000); pg.wait_for_timeout(600)
    except Exception as e:
        ck("Remove everything can be pressed", False, str(e)[:80])
    gone = ev(pg, """() => ({
      cap: !!capById('cap7'),
      pr: fnProjects('finance').length,
      arch: ARCHIVES.length })""")
    ck("the capability is gone", gone.get("cap") is False, gone)
    ck("...and its projects with it", gone.get("pr") == 0, gone)
    ck("...archived first, so it can be restored",
       (gone.get("arch") or 0) > (before2.get("arch") or 0), gone)

    print("\n\u00a77 \u00b7 the second door \u2014 the Temple's own Remove")
    pg.reload(); pg.wait_for_timeout(1400)
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(250)
    natives.clear()
    # Reached through the product's own navigation and its own pen, never by
    # assigning EDIT_PAGE \u2014 a control reached by setting a flag is a control
    # nobody proved a person can reach (\u00a7266's own lesson).
    try:
        pg.click('[data-s="temple"]', timeout=3000); pg.wait_for_timeout(500)
        pg.click('[data-page="temple"]', timeout=3000); pg.wait_for_timeout(500)
    except Exception as e:
        ck("the Temple's pen opens", False, str(e)[:80])
    ck("the Temple's table draws a Remove per capability",
       len(pg.query_selector_all('[data-trm^="cap|"]')) ==
       len(ev(pg, "() => GROUP.capabilities.map(c => c.id)", [])))
    was7 = ev(pg, "() => GROUP.capabilities.map(c => c.id)", [])
    try:
        pg.click('[data-trm="cap|3"]', timeout=3000); pg.wait_for_timeout(450)
    except Exception as e:
        ck("the Temple's Remove can be pressed", False, str(e)[:80])
    temple = ev(pg, """() => {
      const ov = document.querySelector('.overlay.on .rmconfirm');
      if (!ov) return { none: true };
      return { picks: ov.querySelectorAll('.pick').length,
               keep: !!ov.querySelector('[data-capkeep]') }; }""")
    ck("...and it opens the SAME dialog, not the browser's",
       temple.get("picks") == 2 and temple.get("keep") is True, temple)
    ck("...raising no browser dialog", not natives, natives)
    ck("...and having removed nothing yet",
       ev(pg, "() => GROUP.capabilities.map(c => c.id)", []) == was7)
    try: pg.click('[data-rmno]', timeout=2000)
    except Exception: pass
    pg.wait_for_timeout(250)

    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n%d failure(s)" % bad)
