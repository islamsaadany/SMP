"""THE COMPANY'S CORE VALUES CAN BE WRITTEN, AND ITS CAPABILITIES CAN BE STARTED (§606).

Islam, on the company level: *"the core values is not being able to be
added"* and *"I added capabilities as well but nothing appeared to add the
capabilities"*. Both reproduced before anything changed:

  · the top layer's and a company's Core Values box, pen open, drew the
    values already there and let only their definitions be rewritten — no
    name box, no ×, no "+ Add a value" — so a company with none could never
    have one. A unit's box (§478) had all three the whole time;
  · the company's Capabilities section was drawn only while it held a
    capability, and its "+ Add" lives inside it, so a client that switched
    capabilities on and had none was offered no way to the first one there.

So the top layer and a company draw the unit's own list with the pen open
(one builder, §53.5), and the Capabilities section stands empty — "No
capabilities yet" and its Add — once the office has SAID the client has
capabilities. BOTH ENDS (§94.2): read mode is what it was; a viewer who may
not author gets no add and a forged press writes nothing (§48.2); unsaid,
the group page is §428.2's (no section); switched off, none; a part owner,
none (§517); and a client whose capabilities are pillars of the company's
plan (stage 3b) gets no second Capabilities section beside `plancap`.
Every press is read back from the DATA (§96).

SMP_BUILT points it at another build (falsified from the SOURCES, §276).
"""
import os, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
BUILT = os.environ.get("SMP_BUILT") or str(ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")
bad, errs = 0, []


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


def press(pg, sel):
    """A real press, then the wait the shell's click guard asks for: a paint
    called while a press is in progress is HELD until it ends (CLICKING).
    A control that is not there is a False, never a crash, so a broken build
    is reported in words (§2b)."""
    el = pg.query_selector(sel)
    if not el:
        return False
    el.click()
    pg.wait_for_timeout(200)
    return True


def safe(pg, js, arg=None, dflt=None):
    try:
        return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    except Exception as e:
        return dflt if dflt is not None else "ERR " + str(e)


SET = """([sel, v]) => { const e = document.querySelector(sel); if (!e) return false; e.value = v;
  e.dispatchEvent(new Event('change', { bubbles: true })); return true; }"""
VALS = """() => ({
  box: !!document.querySelector('#panel .valbox'),
  add: [...document.querySelectorAll('#panel [data-uvaladd]')].map((b) => b.dataset.uvaladd),
  rows: document.querySelectorAll('#panel .valbox .uvrow').length,
  read: [...document.querySelectorAll('#panel .valbox .valcard summary')].map((s) => s.textContent)
})"""
SECS = "()=>allowed(allowed(SUBS.group,'group').filter(d=>d.k==='strategy')[0].sections(),'group').map(d=>d.k).join(',')"
TOP_ON = ["brief", "purpose", "aspiration", "keyobj", "theme", "capability", "values"]

with sync_playwright() as pw:
    ex = os.environ.get("SMP_CHROME") or None
    br = pw.chromium.launch(executable_path=ex) if ex else pw.chromium.launch()
    pg = br.new_page(viewport={"width": 1440, "height": 900})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + BUILT)
    pg.wait_for_function("() => typeof paint === 'function' && typeof GROUP === 'object'")
    pg.wait_for_timeout(400)

    # ── 1. THE TOP LAYER'S CORE VALUES ───────────────────────────────────
    print("The top layer's Core Values")
    pg.evaluate("""(on) => { GROUP.structure = { top: { on: on, temple: true } };
      GROUP.values = [{ name: 'Integrity', def: 'We do what we say.' }];
      current = 'group'; currentSub = 'strategy'; CURSEC.strategy = 'found';
      EDIT_PAGE.foundation = false; paint(); }""", TOP_ON)
    r = pg.evaluate(VALS)
    ck("read mode draws the values as before, with no add", r["box"] and r["read"] == ["Integrity"] and not r["add"], r)
    pg.evaluate("() => { EDIT_PAGE.foundation = true; paint(); }")
    r = pg.evaluate(VALS)
    ck("the pen draws the unit's list: a row per value and + Add a value", r["rows"] == 1 and r["add"] == ["group"], r)
    press(pg, '#panel [data-uvaladd="group"]')
    ck("+ Add a value adds an empty value to the group", safe(pg, "() => GROUP.values") ==
       [{"name": "Integrity", "def": "We do what we say."}, {"name": "", "def": ""}])
    pg.evaluate(SET, ["#panel .valbox .uvrow:nth-child(2) input", "Customer first"])
    pg.evaluate(SET, ["#panel .valbox .uvrow:nth-child(2) textarea", "Every decision starts with the customer."])
    ck("its name and definition are stored", safe(pg, "() => GROUP.values[1]") ==
       {"name": "Customer first", "def": "Every decision starts with the customer."})
    pg.evaluate(SET, ["#panel .valbox .uvrow:nth-child(1) input", "Honesty"])
    ck("an existing value's NAME can be changed now too", safe(pg, "() => GROUP.values[0].name") == "Honesty")
    pg.evaluate("() => { EDIT_PAGE.foundation = false; paint(); }")
    r = pg.evaluate(VALS)
    ck("read mode shows both", r["read"] == ["Honesty", "Customer first"], r)
    pg.evaluate("() => { EDIT_PAGE.foundation = true; paint(); }")
    press(pg, '#panel [data-uvalrm="group|0"]')
    ck("× removes that value and only that one", safe(pg, "() => GROUP.values.map(v => v.name)") == ["Customer first"])
    pg.evaluate("() => { GROUP.values = []; paint(); }")
    r = pg.evaluate(VALS)
    ck("a company with no values gets + Add a value (the reported fault)", r["add"] == ["group"] and r["rows"] == 0, r)
    press(pg, '#panel [data-uvaladd="group"]')
    ck("...and the first one is added", safe(pg, "() => GROUP.values.length") == 1)

    # Somebody who may not author: no add drawn, and a forged press is refused
    # on the click (§48.2) — the handler re-asks, never the drawn state.
    r = safe(pg, """() => { const keep = window.mayAuthor; window.mayAuthor = () => false;
      paint(); const drawn = !!document.querySelector('#panel [data-uvaladd]');
      const b = document.createElement('button'); b.dataset.uvaladd = 'group';
      document.body.appendChild(b); window.mayAuthor = keep; paint(); window.mayAuthor = () => false;
      const n0 = GROUP.values.length;
      document.querySelectorAll('[data-uvaladd]').forEach((x) => x.click());
      const rm = document.querySelector('[data-uvalrm]'); if (rm) rm.click();
      const n1 = GROUP.values.length; window.mayAuthor = keep; b.remove(); paint();
      return { drawn: drawn, n0: n0, n1: n1 }; }""")
    ck("a viewer who may not author is drawn no add", isinstance(r, dict) and r["drawn"] is False, r)
    ck("...and a press without the right writes nothing", isinstance(r, dict) and r["n0"] == r["n1"], r)

    # ── 2. A COMPANY'S CORE VALUES (the second layer's own Foundation) ────
    print("A company's Core Values")
    co = safe(pg, "() => Object.keys(COMPANIES)[0]")
    pg.evaluate("""(on) => { GROUP.structure = { top: { on: on, temple: true },
        mid: { exists: true, on: ['brief', 'aspiration', 'keyobj', 'values'] } };
      delete GROUP.coFound; EDIT_PAGE.foundation = false; paint(); }""", TOP_ON)
    pg.evaluate("(k) => { current = 'co:' + k; currentSub = 'foundation'; paint(); }", co)
    r = pg.evaluate(VALS)
    ck("read mode draws the company's box and creates nothing (§42)", r["box"] and not r["add"] and
       safe(pg, "() => !GROUP.coFound") is True, r)
    pg.evaluate("() => { EDIT_PAGE.foundation = true; paint(); }")
    r = pg.evaluate(VALS)
    ck("the pen offers + Add a value on the company", r["add"] == ["co:" + co], r)
    press(pg, '#panel [data-uvaladd="co:%s"]' % co)
    pg.evaluate(SET, ["#panel .valbox .uvrow input", "Ownership"])
    ck("...which writes the company's own record, not the group's",
       safe(pg, "(k) => GROUP.coFound[k].values", co) == [{"name": "Ownership", "def": ""}] and
       safe(pg, "() => GROUP.values.length") == 1)
    press(pg, '#panel [data-uvalrm="co:%s|0"]' % co)
    ck("× removes it again", safe(pg, "(k) => GROUP.coFound[k].values", co) == [])
    pg.evaluate("() => { delete GROUP.coFound; EDIT_PAGE.foundation = false; current = 'group'; currentSub = 'strategy'; paint(); }")

    # ── 3. THE CAPABILITIES SECTION, EMPTY ───────────────────────────────
    print("The company's Capabilities section")
    had = safe(pg, "() => { const c = GROUP.capabilities.slice(); GROUP.capabilities.length = 0; return JSON.stringify(c); }")
    pg.evaluate("() => { delete GROUP.structure; paint(); }")
    ck("unsaid, with no capabilities, the Strategy tab is Foundation alone (§428.2 unmoved)",
       safe(pg, SECS) == "found", safe(pg, SECS))
    pg.evaluate("(on) => { GROUP.structure = { top: { on: on, temple: true }, cap: { exists: false } }; paint(); }", TOP_ON)
    ck("capabilities switched off: no section", "caps" not in safe(pg, SECS), safe(pg, SECS))
    pg.evaluate("() => { GROUP.structure.cap.exists = true; paint(); }")
    ck("switched on with none yet: the section is offered (the reported fault)",
       "caps" in safe(pg, SECS).split(","), safe(pg, SECS))
    pg.evaluate("() => { delete GROUP.structure.cap; paint(); }")
    ck("...as it is when only the top level's own tick says so",
       "caps" in safe(pg, SECS).split(","), safe(pg, SECS))
    pg.evaluate("() => { CURSEC.strategy = 'caps'; EDIT_PAGE.plan = false; paint(); }")
    body = safe(pg, "() => document.querySelector('#panel').innerText", dflt="")
    ck("it reads that there are none yet", "No " in body and "yet" in body, body[:200])
    pg.evaluate("() => { EDIT_PAGE.plan = true; paint(); }")
    ck("with the pen open it carries + Add", safe(pg, "() => !!document.querySelector('#panel [data-topcapadd]')") is True)
    press(pg, "#panel [data-topcapadd]")
    pg.wait_for_timeout(100)
    ck("pressing it adds the first capability", safe(pg, "() => GROUP.capabilities.length") == 1)
    ck("...and the section now shows it on its rail",
       safe(pg, "() => document.querySelectorAll('#panel [data-topcap]').length") == 1)
    pg.evaluate("() => { GROUP.capabilities.length = 0; EDIT_PAGE.plan = false; paint(); }")

    r = safe(pg, "() => { const keep = window.partOnly; window.partOnly = () => true; const s = (" + SECS + ")(); window.partOnly = keep; return s; }")
    ck("a part owner is not shown the empty section (§517)", "caps" not in str(r).split(","), r)

    pg.evaluate("""() => { GROUP.items = [{ id: 'T-C1', name: 'Data', kind: SMPRules.PILLAR_CAP || 'Capability',
        measures: [], tactics: [] }]; paint(); }""")
    ck("capabilities held as pillars of the company's plan: no second section (stage 3b)",
       "caps" not in safe(pg, SECS).split(","), safe(pg, SECS))
    pg.evaluate("() => { delete GROUP.items; paint(); }")

    pg.evaluate("(h) => { GROUP.capabilities.push.apply(GROUP.capabilities, JSON.parse(h)); delete GROUP.structure; paint(); }", had or "[]")
    ck("with a capability held, the section is drawn as before, said or unsaid",
       "caps" in safe(pg, SECS).split(","), safe(pg, SECS))

    ck("no page errors", not errs, errs[:3])
    br.close()

print(("PASS" if not bad else "FAIL — %d" % bad))
raise SystemExit(1 if bad else 0)
