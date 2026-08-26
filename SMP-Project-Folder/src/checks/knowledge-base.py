"""THE RECIPES ON THE PAGE, AND THE CORPUS THAT MUST MATCH THEM (§103).

The knowledge base explained how things WORK and barely how to DO them — four
mentions of pressing anything across 693 lines of PAGE_INFO. These are the
missing half, and they are DATA (`recipes.js`) so that the words a person reads
here and the words the assistant answers from are the same words.

WHAT IS ASSERTED IS THE AGREEMENT, not the number (§53.5, §94.14): the page and
`db/kb.json` must draw from one source, so adding a recipe keeps this green and
letting the two drift does not. The counts are read from both sides and
compared; nothing here hard-codes 43.

    python3 checks/knowledge-base.py     (or via qa-run.py in the cloud image)
"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
FILE = "file://" + str(ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")
CORPUS = json.loads((ROOT / "db/kb.json").read_text())
bad = 0


def ck(what, ok, extra=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + what +
          (("  — " + str(extra)) if not ok and extra else ""))


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1500, "height": 950})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:160]))
    pg.on("console", lambda m: errs.append(m.text[:160]) if m.type == "error" else None)
    pg.goto(FILE, wait_until="load")
    pg.wait_for_timeout(2500)

    # THE OFFICE, SINCE §119. This ran as a unit head on the argument that the
    # knowledge base was everyone's (§37) and a check run as the SMO could not
    # see it being withheld — which was the right reader until Islam closed the
    # page to everybody but the Super user and the SMO team. The withholding is
    # asserted in checks/strategy-split.py §4, of the page def itself and for
    # four roles; this file measures the PAGE, so it opens it as somebody who
    # can (§51.11: when a control changes shape, fix every check that held the
    # old shape, not only the one that failed first).
    pg.evaluate("()=>{ VIEWER=PEOPLE.filter(p=>p.role==='super')[0].key; paint(); "
                "document.querySelector('[data-md=\"setup\"]').click(); }")
    pg.wait_for_timeout(700)
    pg.evaluate("()=>{const r=[...document.querySelectorAll('[data-setupgo]')]"
                ".find(x=>x.dataset.setupgo==='kb'); if(r) r.click();}")
    pg.wait_for_timeout(900)

    print("\n1 · the page")
    m = pg.evaluate("""()=>({
        sections: document.querySelectorAll('.kb-sec').length,
        howGroups: document.querySelectorAll('.kb-how').length,
        recipes: document.querySelectorAll('.kb-rec').length,
        tocLinks: document.querySelectorAll('.kb-toc a').length,
        tocBroken: [...document.querySelectorAll('.kb-toc a')]
                     .filter(a=>!document.querySelector(a.getAttribute('href')))
                     .map(a=>a.textContent),
        emptyAnswers: [...document.querySelectorAll('.kb-rec')]
                        .filter(r=>!r.querySelector('.kb-p') ||
                                   !r.querySelector('.kb-p').textContent.trim())
                        .map(r=>r.id),
        unsubstituted: /\\{pillar/.test(document.body.innerText),
        officeMarks: document.querySelectorAll('.kb-rec .pill').length })""")
    ck("a unit head can open it at all", m["sections"] > 0, m)
    ck("every how-to group is drawn (%d)" % m["howGroups"], m["howGroups"] > 0, m)
    ck("every recipe has an answer", not m["emptyAnswers"], m["emptyAnswers"])
    ck("no {pillar} left unsubstituted", not m["unsubstituted"], m)

    # THE TOC WAS A HAND-KEPT SECOND COPY AND WAS ALREADY WRONG — nine sections,
    # eight links, the people register missing since the day it was added. It is
    # derived now, so this asserts the property rather than the count (§42).
    print("\n2 · the table of contents, which used to be a second copy")
    ck("one link per section (%d links, %d sections)" % (m["tocLinks"], m["sections"]),
       m["tocLinks"] == m["sections"], m)
    ck("and every link lands on something", not m["tocBroken"], m["tocBroken"])

    print("\n3 · the page and the assistant's corpus draw from one source")
    ck("the same number of recipes on the page as in db/kb.json (%d / %d)"
       % (m["recipes"], len(CORPUS["recipes"])),
       m["recipes"] == len(CORPUS["recipes"]), m)
    ck("the corpus carries the knowledge-base sections too (%d)" % len(CORPUS["sections"]),
       len(CORPUS["sections"]) > 0, CORPUS["sections"][:1])
    ck("and every page's Info panel (%d)" % len(CORPUS["pages"]),
       len(CORPUS["pages"]) > 0)
    # `who` IS RELEVANCE, NEVER PERMISSION (spec 016 §3): an office recipe is
    # marked on the page rather than withheld, so the two counts must agree.
    office = [r for r in CORPUS["recipes"] if r.get("who") == "office"]
    ck("office recipes are MARKED on the page, not withheld (%d / %d)"
       % (m["officeMarks"], len(office)),
       m["officeMarks"] == len(office), (m["officeMarks"], len(office)))

    print("\n4 · nothing in the corpus is empty or duplicated")
    ids = [r["id"] for r in CORPUS["recipes"]]
    ck("every recipe id is unique", len(set(ids)) == len(ids))
    ck("every recipe has a question and an answer",
       all(r.get("q") and r.get("a") for r in CORPUS["recipes"]))
    ck("every section has at least one block",
       all(s.get("blocks") for s in CORPUS["sections"] + CORPUS["pages"]))

    ck("no console errors", not errs, errs[:3])
    b.close()

print("\n%s" % ("ALL CLEAR" if not bad else "%d FAILED" % bad))
sys.exit(1 if bad else 0)
