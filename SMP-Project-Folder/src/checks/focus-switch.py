"""FOCUS MEASURES HAVE A SWITCH, AND OFF MEANS EVERYWHERE (§102).

Islam: "give me the option to turn off in the product settings in general to
verify with the CEO later, and off means it disappears across the platform" —
and, asked whether off should also forget, "off and on brings back history yes."

So there are three things to prove and they fail differently:

  · OFF HIDES EVERY SURFACE. Seven read focus and all seven go through
    isFocus(), which is why this is one gate — but a check that measured only
    the mark beside a measure would pass on a build where the highlighted rows
    survived.

  · OFF NEVER DELETES. The marks stay in `cycle.focus` and come back whole.
    Measured as a NUMBER before and after, not as "it still works".

  · THE PAGE CARRYING THE SWITCH STAYS REACHABLE (§61's trap): if turning focus
    off removed the page with the switch on it, the only way back on would be
    to turn it on first.

    python3 checks/focus-switch.py     (or via qa-run.py in the cloud image)
"""
import pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
FILE = "file://" + str(ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")
bad = 0


def ck(what, ok, extra=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + what +
          (("  — " + str(extra)) if not ok and extra else ""))


def read(pg):
    """Every surface that reads focus, plus what is stored behind them."""
    return pg.evaluate("""()=>{
        VIEWER='smo'; current='mobile'; paint();
        const t=[...document.querySelectorAll('[data-s]')].find(x=>x.dataset.s==='performance');
        if(t) t.click();
        const stored = Object.keys(CYCLE.focus||{});
        return { marks: document.querySelectorAll('.fmark').length,
                 rows:  document.querySelectorAll('.focusrow').length,
                 stored: stored.length,
                 saidYes: stored.filter(id=>isFocus(id)).length,
                 rule: SMPRules.focusOn(world()),
                 key: ('focusOff' in (GROUP||{})) ? GROUP.focusOff : 'absent' }; }""")


def setup_page(pg):
    pg.evaluate("()=>{ VIEWER='smo'; paint(); "
                "document.querySelector('[data-md=\"setup\"]').click(); }")
    pg.wait_for_timeout(700)
    pg.evaluate("()=>{const r=[...document.querySelectorAll('[data-setupgo]')]"
                ".find(x=>x.dataset.setupgo==='focusset'); if(r) r.click();}")
    pg.wait_for_timeout(700)


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1500, "height": 950})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:160]))
    pg.on("console", lambda m: errs.append(m.text[:160]) if m.type == "error" else None)
    pg.goto(FILE, wait_until="load")
    pg.wait_for_timeout(2500)

    print("\n1 · on, which is what a tenant that was never asked already has")
    on = read(pg)
    ck("the key is absent rather than written `false` (§50.6)", on["key"] == "absent", on)
    ck("the rule says on", on["rule"] is True, on)
    ck("there are marks to hide (%d) and rows to unhighlight (%d)" % (on["marks"], on["rows"]),
       on["marks"] > 0 and on["rows"] > 0 and on["stored"] > 0, on)

    print("\n2 · off hides every surface, and keeps every mark")
    pg.evaluate("()=>{ setFocusOn(false); paint(); }")
    pg.wait_for_timeout(400)
    off = read(pg)
    ck("no marks anywhere", off["marks"] == 0, off)
    ck("no highlighted rows anywhere", off["rows"] == 0, off)
    ck("isFocus() answers no for every stored id", off["saidYes"] == 0, off)
    # THE ASSERTION THE WHOLE THING TURNS ON.
    ck("and all %d marks are still stored" % on["stored"], off["stored"] == on["stored"], off)
    ck("the switch is written only when off", off["key"] is True, off)

    print("\n3 · on again brings the history back, whole")
    pg.evaluate("()=>{ setFocusOn(true); paint(); }")
    pg.wait_for_timeout(400)
    back = read(pg)
    ck("marks are back, exactly as many (%d)" % on["marks"], back["marks"] == on["marks"], back)
    ck("rows are back, exactly as many (%d)" % on["rows"], back["rows"] == on["rows"], back)
    ck("and the key is deleted rather than set to `false`", back["key"] == "absent", back)

    print("\n4 · the page carrying the switch survives being switched off (§61)")
    pg.evaluate("()=>{ setFocusOn(false); paint(); }")
    pg.wait_for_timeout(300)
    setup_page(pg)
    s = pg.evaluate("""()=>({
        switch: !!document.querySelector('[data-focusswitch]'),
        pressable: (()=>{ const b=document.querySelector('[data-focusswitch]'); if(!b) return null;
            const r=b.getBoundingClientRect();
            const e=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2);
            return e ? (e.closest('[data-focusswitch]') ? 'switch' : e.tagName) : 'nothing'; })(),
        ticks: document.querySelectorAll('.fmark-btn.on').length,
        saysWhatIsKept: /being kept/.test(document.body.innerText) })""")
    ck("the switch is on the page", s["switch"], s)
    ck("and PRESSABLE, not merely present (§70, §93.4)", s["pressable"] == "switch", s)
    # The page reads the RAW map, or turning it off would look like losing it.
    ck("the marks are still ticked on it (%s)" % s["ticks"], s["ticks"] > 0, s)
    ck("and it says what is being kept", s["saysWhatIsKept"], s)
    pg.evaluate("()=>{ setFocusOn(true); paint(); }")

    ck("no console errors", not errs, errs[:3])
    b.close()

print("\n%s" % ("ALL CLEAR" if not bad else "%d FAILED" % bad))
sys.exit(1 if bad else 0)
