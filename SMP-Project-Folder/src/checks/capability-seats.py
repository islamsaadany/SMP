"""§412: a capability has its own owner and custodian, like a business unit.

Islam, fitting the platform to RHI: "the capability, it has owner and custodian
like business unit, and the function is an option." Then, of the mockup:
"approved, yes show pillars count, proceed".

Both ends every time (§94.2), and every control PRESSED with the stored graph
read back (§96, §70):
  · Setup › Capabilities draws Owner and Custodian where it drew the borrowed
    Head, and no longer says "One function each";
  · the Owner picker writes the CAPABILITY's own `head`, and the person then
    derives Capability owner at `cap:<id>` from the shared rule (§42);
  · Held by offers "none", and choosing it keeps the capability with an owner;
  · the count column shows the PILLARS count for a pillars capability and the
    projects count for a projects one;
  · somebody without Setup sees names, not pickers.
It MAKES its state (§255): the demo capability names no owner of its own.
"""
import os
import pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
FILE = pathlib.Path(os.environ.get("SMP_BUILT") or (HERE.parent / "strategy-management-platform.html"))
bad = 0
errs = []


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x != "" else ""))


def ev(pg, js, arg=None):
    try:
        return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    except Exception as e:                                   # noqa: BLE001 — §215
        return {"threw": str(e).split("\n")[0]}


def click(pg, sel):
    return ev(pg, """(s) => { var b = document.querySelector(s); if (!b) return false; b.click(); return true; }""", sel)


with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={"width": 1600, "height": 1000})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + str(FILE))
    pg.wait_for_timeout(900)

    # Make the state: one capability planned in pillars beside the demo's own.
    st = ev(pg, """() => {
      if (typeof addCapability !== 'function') return { threw: 'no addCapability' };
      var c = GROUP.capabilities[0]; if (!c) return { threw: 'no capability' };
      var n = GROUP.capabilities.length;
      addCapability(c.fn || null);
      var p = GROUP.capabilities[n]; if (!p) return { threw: 'add minted nothing' };
      p.name = 'Company Wide'; p.format = 'pillars';
      p.items = [{ id: p.id + '-P1', code: 'CW1', name: 'One', measures: [], tactics: [] },
                 { id: p.id + '-P2', code: 'CW2', name: 'Two', measures: [], tactics: [] },
                 { id: p.id + '-P3', code: 'CW3', name: 'Three', measures: [], tactics: [] }];
      delete c.head; delete c.custodian;
      return { id: c.id, pid: p.id };
    }""")
    ck("the state is made", isinstance(st, dict) and "threw" not in st, st)
    CID = st.get("id") if isinstance(st, dict) else None
    ev(pg, """() => { var g = document.querySelector('button[title="Setup"]'); if (g) g.click(); }""")
    pg.wait_for_timeout(400)
    click(pg, '.setuprail [data-setupgo="caps"]')
    pg.wait_for_timeout(500)

    print("── 1 · the table")
    t = ev(pg, """() => {
      var t = document.querySelector('.setuppane table[data-tktable="caps"]');
      if (!t) return { threw: 'no caps table' };
      var heads = [].map.call(t.tHead.rows[0].cells, c => c.textContent.trim());
      var rows = [].map.call(t.tBodies[0].rows, r => [].map.call(r.cells, c => c.textContent.trim()));
      return { heads: heads, rows: rows, pane: document.querySelector('.setuppane').textContent };
    }""")
    heads = t.get("heads", []) if isinstance(t, dict) else []
    ck("Owner and Custodian columns are drawn", any(h.startswith("Owner") for h in heads) and any(h.startswith("Custodian") for h in heads), heads)
    ck("...and the borrowed Head column is gone", not any(h.startswith("Head") for h in heads), heads)
    ck("'One function each' is gone", isinstance(t, dict) and "One function each" not in t.get("pane", ""), "")
    ci = next((i for i, h in enumerate(heads) if "/" in h), -1)
    rows = t.get("rows", []) if isinstance(t, dict) else []
    last = rows[-1] if rows else []
    first = rows[0] if rows else []
    ck("a pillars capability counts its pillars", ci > -1 and len(last) > ci and last[ci].startswith("3"), (ci, last))
    ck("...and a projects one counts its projects", ci > -1 and len(first) > ci and first[ci] == str(ev(pg, "() => GROUP.capabilities[0].projects.length")), (ci, first))

    print("── 2 · the owner picker writes the capability's own row")
    click(pg, '[data-rowedit="caps|0"]')
    pg.wait_for_timeout(300)
    opened = click(pg, '[data-pick-open="cap:%s|capowner"]' % CID)
    pg.wait_for_timeout(300)
    ck("the Owner picker opens", opened is True, opened)
    set_ = click(pg, '[data-pick-set="cap:%s|capowner|cfo"]' % CID)
    pg.wait_for_timeout(300)
    ck("a person can be picked", set_ is True, set_)
    r = ev(pg, """(id) => { var c = capById(id);
      var p = PEOPLE.filter(x => x.key === 'cfo')[0];
      return { head: c.head, roles: personRoles(p).map(x => x.role + '@' + x.at) }; }""", CID)
    ck("the capability's own head is written", isinstance(r, dict) and r.get("head") == "cfo", r)
    ck("...and they derive Capability owner there", isinstance(r, dict) and ("capowner@cap:" + str(CID)) in r.get("roles", []), r)
    click(pg, '[data-pick-open="cap:%s|custodian"]' % CID)
    pg.wait_for_timeout(300)
    click(pg, '[data-pick-set="cap:%s|custodian|rethead"]' % CID)
    pg.wait_for_timeout(300)
    r = ev(pg, "(id) => capById(id).custodian", CID)
    ck("the Custodian picker writes the capability's custodian", r == "rethead", r)

    print("── 3 · held by nobody")
    opts = ev(pg, """() => { var s = document.querySelector('[data-capfn="0"]');
      return s ? [].map.call(s.options, o => o.textContent.trim()) : null; }""")
    ck("Held by offers none", isinstance(opts, list) and opts and "none" in opts[0], opts)
    ev(pg, """() => { var s = document.querySelector('[data-capfn="0"]'); s.value = ''; s.dispatchEvent(new Event('change', {bubbles:true})); }""")
    pg.wait_for_timeout(300)
    r = ev(pg, "(id) => ({ fn: capById(id).fn || null, head: capById(id).head })", CID)
    ck("the capability keeps its owner with no function", isinstance(r, dict) and not r.get("fn") and r.get("head") == "cfo", r)
    pill = ev(pg, "() => document.querySelector('.setuppane').textContent.indexOf('with no owner') >= 0")
    ck("...and is not counted as having no owner", pill is False, pill)

    print("── 4 · somebody without Setup sees names, not pickers")
    ev(pg, "() => { var c = GROUP.capabilities[0]; VIEWER = 'mobhead'; leaveModes(); paint(); }")
    pg.wait_for_timeout(300)
    n = ev(pg, "() => document.querySelectorAll('[data-pick-open]').length")
    ck("no picker is drawn for them", n == 0, n)

    ck("no page error", not errs, errs)
    b.close()

print("\n" + ("capability-seats: all passed" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
