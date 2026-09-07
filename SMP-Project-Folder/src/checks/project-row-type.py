"""A PROJECT ROW'S TYPE IS A PICKER, AND ITS DIRECTION OPENS (§292).

Islam, from the live product: *"on a creation of a project I couldn't set the
direction and we need to make the add deliverable or outcome more of an options
in the type rather than 2 buttons of add deliverable or outcome that I get
confused between them."*

WHAT THIS ASSERTS IS THE BEHAVIOUR, NEVER THE LAYOUT (§94.8). It does not ask
where the picker sits or how wide it is. It asks:

  * is there ONE way to add a row, and does pressing it add a DELIVERABLE —
    the kind that owes nothing, so adding a row never adds a missing item;
  * does the Type picker MOVE the row between the two lists, read back off the
    stored plan rather than off the screen (§96), with a new id and the name
    and the hidden mark carried across;
  * does a row that has been REPORTED against draw the word and no control,
    with the reason reachable — and does an unreported row in the same table
    still draw the picker, or a build that locked everything would pass;
  * does an outcome's direction write, and does a deliverable's `=` stay
    printed;
  * is READ mode byte-for-byte what it was, and are the other two panes —
    which print the same word from the same builder — untouched;
  * and does the table still FIT its pane (§158: fit, never "and it scrolls").

Every probe degrades rather than throwing (§215): a run against a build without
the feature must REPORT its failures, not die on the third one and print two.

`SMP_BUILT` points it at another build, which is how it was proved able to fail
— 24 red against the build before it.
"""
from playwright.sync_api import sync_playwright
import pathlib, os

BUILT = os.environ.get("SMP_BUILT") or str(
    pathlib.Path(__file__).resolve().parent.parent / "strategy-management-platform.html")
URL = "file://" + BUILT
DEST = "fn:finance"

bad = 0


def ck(what, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("    ok   " if ok else "    FAIL ") + what + (("  — " + str(x)) if not ok and x else ""))


def ev(pg, js, arg=None):
    """Evaluate, and answer with the failure rather than dying on it (§215)."""
    try:
        return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    except Exception as e:
        return {"__err": str(e)[:160]}


def err(v):
    return isinstance(v, dict) and "__err" in v


def open_pane(pg, edit=True):
    pg.goto(URL)
    pg.wait_for_timeout(800)
    pg.evaluate("()=>{var w=document.querySelector('.welcomeover'); if(w) w.remove();}")
    for _ in range(3):
        on = pg.eval_on_selector_all("#units .navswitch .nsw.on", "e=>e.map(x=>x.textContent.trim())")
        if on and on[0] == "Functions":
            break
        pg.click("#units .navswitch")
        pg.wait_for_timeout(150)
    pg.click('#units button[data-u="%s"]' % DEST)
    pg.wait_for_timeout(300)
    pg.evaluate("""()=>{const b=[...document.querySelectorAll('#subtabs button')]
        .find(x=>x.textContent.trim().indexOf('Strategy')===0); if(b)b.click()}""")
    pg.wait_for_timeout(250)
    pg.evaluate("""()=>{const b=[...document.querySelectorAll('#secrow button')]
        .find(x=>x.textContent.trim().indexOf('Projects')===0); if(b)b.click()}""")
    pg.wait_for_timeout(250)
    if edit:
        pg.evaluate("""()=>{const b=[...document.querySelectorAll('[data-page]')]
            .find(x=>/Edit/.test(x.textContent)); if(b)b.click()}""")
        pg.wait_for_timeout(400)


# The project the rail is standing on, read off the stored graph — never off
# the screen, because a screen that draws nothing answers every question about
# what it drew (§96).
PROJ = """()=>{
  var p = null;
  (GROUP.capabilities||[]).forEach(function(c){ (c.projects||[]).forEach(function(x){
    if (!p && document.querySelector('[data-rowadd*="'+x.id+'"]')) p = x; }); });
  if (!p) return null;
  return { id:p.id,
           d:(p.deliverables||[]).map(function(x){ return {id:x.id,name:x.name,hide:x.hide===true,status:x.status||""}; }),
           o:(p.outcomes||[]).map(function(x){ return {id:x.id,name:x.name,hide:x.hide===true,dir:x.dir||"",target:x.target||"",actual:x.actual||""}; }) };
}"""

# The deliverables-and-outcomes table, and what each row's Type cell holds.
TBL = """()=>{
  var T=[...document.querySelectorAll('.pane table')]
    .find(t=>/Deliverables/.test(t.querySelector('th:nth-child(2)').textContent));
  if(!T) return null;
  var rows=[...T.querySelectorAll('tbody tr')].filter(r=>!r.classList.contains('newrow'));
  var add=[...T.querySelectorAll('tr.newrow [data-rowadd]')];
  return {
    adds: add.map(b=>b.textContent.trim()),
    rows: rows.map(function(r){
      var t=r.children[2], d=r.children[3];
      var s=t.querySelector('select');
      return { word:t.innerText.trim(),
               pick: s ? [...s.options].map(o=>o.textContent.trim()) : null,
               tip: (t.querySelector('[data-tip]')||{}).dataset ?
                    t.querySelector('[data-tip]').dataset.tip : null,
               dirPick: d.querySelector('select') ?
                    [...d.querySelector('select').options].map(o=>o.textContent.trim()) : null,
               dirWord: d.innerText.trim() };
    })
  };
}"""


def set_select(pg, row_i, cell_i, label):
    """Pick a value in a row's cell by its LABEL, and fire the change the
       platform's own handler listens for."""
    return ev(pg, """([i,c,label])=>{
      var T=[...document.querySelectorAll('.pane table')]
        .find(t=>/Deliverables/.test(t.querySelector('th:nth-child(2)').textContent));
      var rows=[...T.querySelectorAll('tbody tr')].filter(r=>!r.classList.contains('newrow'));
      var s=rows[i] && rows[i].children[c].querySelector('select');
      if(!s) return 'no select';
      var o=[...s.options].find(x=>x.textContent.trim()===label);
      if(!o) return 'no option '+label;
      s.value=o.value; s.dispatchEvent(new Event('change',{bubbles:true}));
      return 'ok';
    }""", [row_i, cell_i, label])


with sync_playwright() as pw:
    br = pw.chromium.launch(executable_path=os.environ.get("SMP_CHROME", "/opt/pw-browsers/chromium"),
                            args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = br.new_page(viewport={"width": 1600, "height": 1100})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');"
                       "localStorage.setItem('smp.welcome.seen','1');}catch(e){}")
    pg.on("pageerror", lambda e: print("    PAGE ERROR — " + str(e)[:140]))

    # ── 1. one way in ──────────────────────────────────────────────────
    print("\n1. ONE WAY TO ADD A ROW")
    open_pane(pg)
    t = ev(pg, TBL)
    ck("the table is drawn with the pen open", bool(t) and not err(t), t)
    adds = (t or {}).get("adds") or [] if not err(t) else []
    ck("exactly one add control under it", len(adds) == 1, adds)
    ck("and it does not say 'Add a deliverable' or 'Add an outcome'",
       not any(a in ("Add a deliverable", "Add an outcome") for a in adds), adds)

    before = ev(pg, PROJ)
    pg.evaluate("""()=>{var b=document.querySelector('.pane tr.newrow [data-rowadd]');
                      if(b) b.click();}""")
    pg.wait_for_timeout(350)
    after = ev(pg, PROJ)
    ok = bool(before) and bool(after) and not err(before) and not err(after)
    ck("pressing it adds a DELIVERABLE, not an outcome",
       ok and len(after["d"]) == len(before["d"]) + 1 and len(after["o"]) == len(before["o"]),
       (len(before["d"]), len(after["d"]), len(before["o"]), len(after["o"])) if ok else "unreadable")

    # ── 2. the picker, and what it moves ───────────────────────────────
    print("\n2. THE TYPE PICKER MOVES THE ROW")
    t = ev(pg, TBL)
    rows = (t or {}).get("rows") or [] if not err(t) else []
    picks = [r["pick"] for r in rows if r["pick"]]
    st0 = ev(pg, PROJ)
    # reported, row by row, in the order the table draws them (§99: deliverables
    # then outcomes) — and asked the way `reportedAny` asks it.
    rep = ([bool(x["status"]) for x in st0["d"]] +
           [x["actual"] != "" for x in st0["o"]]) if not err(st0) else []
    ck("a row is a picker EXACTLY when it has not been reported against",
       len(rep) == len(rows) and all((r["pick"] is not None) != rep[n] for n, r in enumerate(rows)),
       list(zip([r["pick"] is not None for r in rows], rep)))
    ck("and the demo holds an example of each, or the line above proves nothing",
       any(rep) and not all(rep), rep)
    ck("offering exactly Deliverable and Outcome",
       bool(picks) and all(p == ["Deliverable", "Outcome"] for p in picks), picks[:2])

    # the row just added is the LAST deliverable — name it, then convert it
    ev(pg, """()=>{var p=null;(GROUP.capabilities||[]).forEach(function(c){(c.projects||[]).forEach(function(x){
        if(!p && document.querySelector('[data-rowadd*="'+x.id+'"]')) p=x;});});
        var d=p.deliverables[p.deliverables.length-1]; d.name='SWITCH ME'; d.hide=true; paint();}""")
    pg.wait_for_timeout(300)
    st = ev(pg, PROJ)
    i = next((n for n, r in enumerate(st["d"]) if r["name"] == "SWITCH ME"), -1) if not err(st) else -1
    oldid = st["d"][i]["id"] if i >= 0 else None
    print("   " + str(set_select(pg, i, 2, "Outcome")))
    pg.wait_for_timeout(350)
    st = ev(pg, PROJ)
    moved = [r for r in (st.get("o") or []) if r["name"] == "SWITCH ME"] if not err(st) else []
    ck("it leaves the deliverables",
       not err(st) and not any(r["name"] == "SWITCH ME" for r in st["d"]),
       [r["name"] for r in st.get("d", [])][-3:] if not err(st) else st)
    ck("and arrives in the outcomes, with its name", len(moved) == 1, moved)
    ck("under a NEW id, which says which kind it is",
       len(moved) == 1 and moved[0]["id"] != oldid and moved[0]["id"].rsplit("-", 1)[-1][0] == "O",
       (oldid, moved[0]["id"] if moved else None))
    ck("carrying the hidden mark (§233)", len(moved) == 1 and moved[0]["hide"] is True, moved)
    ck("and its direction defaults to ≥", len(moved) == 1 and moved[0]["dir"] == "≥", moved)

    # ── 3. the direction opens ─────────────────────────────────────────
    print("\n3. AN OUTCOME'S DIRECTION OPENS, A DELIVERABLE'S DOES NOT")
    t = ev(pg, TBL)
    rows = (t or {}).get("rows") or [] if not err(t) else []
    delivs = [r for r in rows if r["word"].startswith("Deliverable") or r["pick"] and False]
    # a row is a deliverable/outcome by which value its picker holds; read the data instead
    st = ev(pg, PROJ)
    nd, no = (len(st["d"]), len(st["o"])) if not err(st) else (0, 0)
    dirpicks = [r["dirPick"] for r in rows]
    ck("every outcome row has a direction picker",
       nd + no == len(rows) and all(p == ["≥", "≤"] for p in dirpicks[nd:]) and no > 0,
       dirpicks)
    ck("and no deliverable row has one", all(p is None for p in dirpicks[:nd]) and nd > 0, dirpicks[:nd])
    ck("a deliverable still prints =", all(r["dirWord"] == "=" for r in rows[:nd]),
       [r["dirWord"] for r in rows[:nd]])
    print("   " + str(set_select(pg, nd, 3, "≤")))
    pg.wait_for_timeout(300)
    st2 = ev(pg, PROJ)
    ck("picking ≤ reaches the stored plan",
       not err(st2) and st2["o"][0]["dir"] == "≤", st2["o"][0] if not err(st2) else st2)

    # ── 4. a reported row is not a picker ──────────────────────────────
    print("\n4. A REPORTED ROW IS NOT A PICKER (both ends)")
    ev(pg, """()=>{var p=null;(GROUP.capabilities||[]).forEach(function(c){(c.projects||[]).forEach(function(x){
        if(!p && document.querySelector('[data-rowadd*="'+x.id+'"]')) p=x;});});
        p.outcomes[0].actual='42'; paint();}""")
    pg.wait_for_timeout(300)
    t = ev(pg, TBL)
    rows = (t or {}).get("rows") or [] if not err(t) else []
    st = ev(pg, PROJ)
    nd = len(st["d"]) if not err(st) else 0
    r = rows[nd] if len(rows) > nd else {}
    ck("the reported row draws the word and no control", r.get("pick") is None, r)
    ck("with the reason reachable on it", bool(r.get("tip")), r.get("tip"))
    ck("and an unreported row in the SAME table still has its picker",
       any(x["pick"] for n, x in enumerate(rows) if n != nd),
       [x["pick"] for x in rows])

    # ── 5. read mode, and the other two panes ──────────────────────────
    print("\n5. READ MODE AND THE OTHER PANES ARE UNTOUCHED")
    pg.evaluate("""()=>{const b=[...document.querySelectorAll('[data-page]')]
        .find(x=>/Done editing/.test(x.textContent)); if(b)b.click()}""")
    pg.wait_for_timeout(400)
    t = ev(pg, TBL)
    rows = (t or {}).get("rows") or [] if not err(t) else []
    ck("no Type picker with the pen shut", all(r["pick"] is None for r in rows), rows[:2])
    ck("no direction picker either", all(r["dirPick"] is None for r in rows), rows[:2])
    ck("and the words still print", bool(rows) and all(r["word"] in ("Deliverable", "Outcome") for r in rows),
       [r["word"] for r in rows])
    ck("no add row either", (t or {}).get("adds") == [] if not err(t) else False, (t or {}).get("adds"))

    for tab in ("Performance", "Reporting"):
        pg.evaluate("""(t)=>{const b=[...document.querySelectorAll('#subtabs button')]
            .find(x=>x.textContent.trim().indexOf(t)===0); if(b)b.click()}""", tab)
        pg.wait_for_timeout(350)
        n = ev(pg, """()=>{var T=[...document.querySelectorAll('.pane table')]
            .filter(t=>t.querySelector('th:nth-child(2)') &&
                       /Deliverables/.test(t.querySelector('th:nth-child(2)').textContent));
            return { tables:T.length,
                     sel:T.reduce((a,t)=>a+[...t.querySelectorAll('tbody tr')]
                            .filter(r=>r.children[2] && r.children[2].querySelector('select')).length,0),
                     words:T.length?[...T[0].querySelectorAll('tbody tr')].map(r=>r.children[2]?r.children[2].innerText.trim():'').filter(Boolean):[] };}""")
        ok = not err(n) and n["tables"] > 0
        ck(tab + " still prints the word", ok and all(w in ("Deliverable", "Outcome") for w in n["words"]),
           n if not ok else n["words"])
        ck(tab + " draws no TYPE picker (its own controls are its own)", ok and n["sel"] == 0, n)

    # ── 6. it still fits (§158) ────────────────────────────────────────
    print("\n6. THE TABLE FITS ITS PANE, PEN OPEN")
    open_pane(pg)
    for w in (1600, 1280, 1100):
        pg.set_viewport_size({"width": w, "height": 1100})
        pg.wait_for_timeout(200)
        m = ev(pg, """()=>{var T=[...document.querySelectorAll('.pane table')]
            .find(t=>/Deliverables/.test(t.querySelector('th:nth-child(2)').textContent));
            if(!T) return null;
            var box=T.closest('.tblscroll')||T.parentElement;
            return {tbl:Math.round(T.scrollWidth), box:Math.round(box.clientWidth)};}""")
        ck("fits at %dpx" % w, bool(m) and not err(m) and m["tbl"] <= m["box"] + 1, m)

    br.close()

print("\n%d failures" % bad)
