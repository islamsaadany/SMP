"""TAKING THE QUESTIONS AWAY AND BRINGING THEM BACK (§161).

Islam asked to export and import the knowledge base's questions. What is
asserted here is the PROBLEM rather than the layout (§94.8):

  · THE ROUND TRIP IS A FIXED POINT. A file downloaded and uploaded untouched
    must classify as no change at all — the shipped answers separate
    paragraphs with `|` and a spreadsheet cell uses a blank line, so the same
    prose arrives spelt two ways and a raw compare would report all 64 rows
    as changed. §54.5's fault: the platform refusing its own export.
  · AND IT IS STILL A FIXED POINT AFTER APPLYING, which is the assertion that
    catches a writer storing something the reader then reads differently.
  · BOTH ENDS of the audience: what the file sets is what the page shows and
    what the corpus filter obeys.
  · A row that cannot be applied SAYS SO and applies nothing.

    python3 checks/kb-file.py     (or via qa-run.py in the cloud image)
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
          (("  — " + str(extra)) if not ok and extra != "" else ""))


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1500, "height": 950})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:180]))
    pg.on("console", lambda m: errs.append(m.text[:180]) if m.type == "error" else None)
    pg.goto(FILE, wait_until="load")
    pg.wait_for_timeout(2500)

    def open_kb(role="super"):
        pg.evaluate("(r)=>{ VIEWER=PEOPLE.filter(p=>p.role===r)[0].key; paint(); "
                    "document.querySelector('[data-md=\"setup\"]').click(); }", role)
        pg.wait_for_timeout(600)
        pg.evaluate("()=>{const r=[...document.querySelectorAll('[data-setupgo]')]"
                    ".find(x=>x.dataset.setupgo==='kb'); if(r) r.click();}")
        pg.wait_for_timeout(700)

    open_kb()
    pg.evaluate("()=>{const t=document.querySelector('[data-kbtab=qa]'); if(t) t.click();}")
    pg.wait_for_timeout(600)

    print("\n1 · the door, and the two places it must not be")
    ck("the office gets a Questions file menu on the answers tab",
       pg.evaluate("()=>!!document.querySelector('[data-kbfilemenu]')"))
    pg.evaluate("()=>{const t=document.querySelector('[data-kbtab=how]'); if(t) t.click();}")
    pg.wait_for_timeout(500)
    ck("and NOT on the explanations tab, which the file does not carry",
       not pg.evaluate("()=>!!document.querySelector('[data-kbfilemenu]')"))
    pg.evaluate("()=>{const t=document.querySelector('[data-kbtab=qa]'); if(t) t.click();}")
    pg.wait_for_timeout(500)
    # PRESSED, not merely present (§70, §93.4): a menu drawn under something
    # else answers every DOM query and opens for nobody.
    pg.evaluate("()=>document.querySelector('[data-kbfilemenu]').click()")
    pg.wait_for_timeout(400)
    hit = pg.evaluate("""()=>{const el=document.querySelector('[data-dlkb]');
        if(!el) return 'missing';
        const r=el.getBoundingClientRect();
        const t=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2);
        return el.contains(t)||t===el ? 'ok' : (t?t.tagName+'.'+t.className:'nothing');}""")
    ck("pressing the menu reveals a Download that can actually be clicked",
       hit == "ok", hit)
    ck("and an upload control beside it",
       pg.evaluate("()=>!!document.getElementById('kb-file')"))

    print("\n2 · the file")
    m = pg.evaluate("""()=>{const s=kbWorkbook();
        const q=s.find(x=>x.name==='Questions');
        return {sheets:s.map(x=>x.name), head:q.head, rows:q.rows.length,
                locked:q.lockedCols||[], vals:(q.validations||[]).length,
                cells:q.rows[0].length,
                corpus:RECIPES.reduce((n,g)=>n+g.items.length,0)
                       + SMPRules.kbAllAdds(GROUP.kb).length};}""")
    ck("a Read me and a Questions sheet", m["sheets"] == ["Read me", "Questions"], m["sheets"])
    ck("Id is the first column, because the question text is editable and cannot be the key",
       m["head"][0] == "Id", m["head"])
    ck("one row per question (%d)" % m["rows"], m["rows"] == m["corpus"], m)
    # Islam, looking at the first build: "remove the standard answer from the
    # sheet not to be confused." Asserted as an ABSENCE, and of the ROWS as
    # well as the head — a column dropped from the heading and still written
    # into every row is a sheet whose columns are one out (§113.8).
    ck("no Standard answer column — every column on the sheet is editable",
       "Standard answer" not in m["head"] and m["cells"] == len(m["head"]),
       {"head": m["head"], "cells": m["cells"]})
    ck("the audience is a dropdown, not free text", m["vals"] >= 1, m)

    print("\n3 · THE ROUND TRIP IS A FIXED POINT")
    r = pg.evaluate("""()=>{const q=kbWorkbook().find(x=>x.name==='Questions');
        const c=kbFromWorkbook({Questions:[q.head].concat(q.rows)});
        return {total:kbChangeCount(c), unknown:c.unknown.length};}""")
    ck("a file downloaded and uploaded untouched changes nothing",
       r["total"] == 0 and r["unknown"] == 0, r)

    print("\n4 · every kind of change is classified, and one is refused")
    r = pg.evaluate("""()=>{const q=kbWorkbook().find(x=>x.name==='Questions');
        const rows=q.rows.map(x=>x.slice());
        rows[0][3]='A new answer.\\n\\nIn two paragraphs.';
        const i=rows.findIndex(x=>x[0]==='colours'); rows[i][4]='Strategy Office only';
        rows.push(['','Reporting','Who signs off the reward line?','The CEO does.',
                   'Strategy Office only','']);
        rows.push(['reward-lien','Reporting','Typo','Some answer','Both','']);
        const c=kbFromWorkbook({Questions:[q.head].concat(rows)});
        return {reword:c.reword.map(x=>x.id), aud:c.audience.map(x=>[x.id,x.from,x.w]),
                add:c.add.map(x=>x.w), unknown:c.unknown.map(x=>x.id)};}""")
    ck("a reworded answer is a rewording", r["reword"] == ["report-a-figure"], r)
    ck("an audience change alone is its own kind, and names what it was",
       r["aud"] == [["colours", "everyone", "office"]], r)
    ck("a row with no Id is a new question, carrying its audience",
       r["add"] == ["office"], r)
    ck("an unrecognised id is NAMED and adds nothing",
       r["unknown"] == ["reward-lien"] and not r["add"] == [], r)

    print("\n5 · applying writes, and the DATA reads back (§96)")
    r = pg.evaluate("""()=>{const q=kbWorkbook().find(x=>x.name==='Questions');
        const rows=q.rows.map(x=>x.slice());
        rows[0][3]='Reworded through the file.\\n\\nSecond paragraph.';
        const i=rows.findIndex(x=>x[0]==='colours'); rows[i][4]='Strategy Office only';
        rows.push(['','Reporting','Who signs off the reward line?','The CEO does.',
                   'Strategy Office only','']);
        kbApply(kbFromWorkbook({Questions:[q.head].concat(rows)}));
        const ov=SMPRules.kbLook(GROUP.kb,'report-a-figure');
        return {paras:SMPRules.kbParas(ov.a).length,
                colours:SMPRules.kbAudience(GROUP.kb,'colours',null),
                added:SMPRules.kbAllAdds(GROUP.kb).map(x=>x.w)};}""")
    ck("the blank line survived as a real paragraph break", r["paras"] == 2, r)
    ck("the audience the file set is the audience the platform holds",
       r["colours"] == "office", r)
    ck("and a question added by the file keeps its audience", r["added"] == ["office"], r)

    print("\n5b · APPLYING AN UNCHANGED FILE STORES NOTHING")
    # The assertion that catches the WRITER's compare rather than the reader's.
    # Section 3 proves the classifier sees no change; this proves that applying
    # one anyway writes no override — the two are different code and drifted
    # apart once already (§53.5).
    r = pg.evaluate("""()=>{
        const before=JSON.stringify(GROUP.kb||null);
        const q=kbWorkbook().find(x=>x.name==='Questions');
        kbApply(kbFromWorkbook({Questions:[q.head].concat(q.rows)}));
        return {before:before, after:JSON.stringify(GROUP.kb||null)};}""")
    ck("the tenant is byte-identical after re-applying its own file",
       r["before"] == r["after"], r)
    # And directly of the writer, so a classifier that quietly stopped
    # classifying could not carry this assertion on its own (§113.8).
    r = pg.evaluate("""()=>{
        const std=kbShipped('dash-not-zero');
        const before=JSON.stringify(GROUP.kb||null);
        kbSetOver('dash-not-zero', std.q, SMPRules.kbParas(std.a).join('\\n\\n'));
        return {before:before, after:JSON.stringify(GROUP.kb||null)};}""")
    ck("and the shipped answer re-typed with blank lines stores no override",
       r["before"] == r["after"], r)

    print("\n6 · and it is STILL a fixed point after applying")
    r = pg.evaluate("""()=>{const q=kbWorkbook().find(x=>x.name==='Questions');
        const c=kbFromWorkbook({Questions:[q.head].concat(q.rows)});
        return {total:kbChangeCount(c), rows:q.rows.length};}""")
    ck("re-uploading what the platform now holds changes nothing", r["total"] == 0, r)
    ck("and the added question is in the file (%d rows)" % r["rows"],
       r["rows"] == m["rows"] + 1, r)

    print("\n7 · what the file set is what the page and the corpus obey")
    pg.evaluate("()=>paint()")
    pg.wait_for_timeout(500)
    r = pg.evaluate("""()=>{
        const seg=[...document.querySelectorAll('.kb-rec')];
        const chip=id=>{const el=document.getElementById('kb-r-'+id);
          const c=el&&el.querySelector('.pill.kind'); return c?c.textContent.trim():null;};
        return {colours:chip('colours'), report:chip('report-a-figure'),
                everyoneChips:seg.filter(e=>{const c=e.querySelector('.pill.kind');
                  return c && c.textContent.trim()==='Both';}).length};}""")
    ck("the retagged question wears its audience on the page",
       r["colours"] == "Strategy Office only", r)
    ck("a Both answer wears no chip — it is the default on most of them (§41)",
       r["everyoneChips"] == 0 and r["report"] is None, r)
    r = pg.evaluate("""()=>{const w='office';
        return {officeSees:SMPRules.kbSees(w,true), otherSees:SMPRules.kbSees(w,false),
                othersToOffice:SMPRules.kbSees('others',true),
                othersToOther:SMPRules.kbSees('others',false)};}""")
    ck("Strategy Office only reaches the office and nobody else",
       r["officeSees"] and not r["otherSees"], r)
    ck("Everyone else reaches everybody but the office",
       r["othersToOther"] and not r["othersToOffice"], r)

    print("\n8 · a file that is not this file says so")
    r = pg.evaluate("""()=>{const c=kbFromWorkbook({People:[['Emp ID'],['1']]});
        return kbChangeCount(c);}""")
    ck("a workbook with no Questions sheet yields no changes", r == 0, r)

    ck("no console errors", not errs, errs[:3])
    b.close()

print(("\n%d FAILED\n" % bad) if bad else "\nALL CLEAR\n")
sys.exit(1 if bad else 0)
