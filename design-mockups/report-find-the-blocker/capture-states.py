"""Produce the four panels for the mockup, drawn out of the running platform.

States 1 (Islam's: one note owed, nothing else) drives Today / A / B.
State 2 (mixed: figures missing, a % missing, a note missing) drives C, because
C's whole claim is that it names every blocker rather than only notes.
"""
import json, pathlib, re
from playwright.sync_api import sync_playwright

SRC = pathlib.Path("/home/user/SMP/SMP-Project-Folder/src")
URL = "file://" + str(SRC / "strategy-management-platform.html")
OUT = pathlib.Path("/tmp/claude-0/-home-user-SMP/24e488c3-befb-57af-9d5b-35e85b22a4fe/scratchpad")
UNIT = "b2becomm"

FILL_ALL = """(u) => {
  const un = UNITS[u];
  (un.keyObjectives||[]).forEach(m => { if (!m.actual) m.actual = m.target; m.note = m.note || "On plan."; });
  (un.items||[]).forEach(p => {
    (p.measures||[]).forEach(m => { if (!m.actual) m.actual = m.target; m.note = m.note || "On plan."; });
    (p.tactics||[]).forEach(t => {
      if (!t.outcome)   t.outcome = "Something measurable";
      if (!t.outTarget) t.outTarget = "6 #";
      t.outActual = t.outTarget;
      if (t.actual == null || t.actual === "") t.actual = 100;
      t.note = t.note || "On plan.";
    });
  });
}"""

STATE1 = """(u) => {
  const un = UNITS[u], last = un.items[un.items.length-1], m = last.measures[0];
  m.actual = String(Math.round((parseFloat(m.target)||100) * 0.3)) +
             (String(m.target).replace(/^[\\d.,\\s]+/, "") || "");
  m.note = "";
}"""

# State 2: the same off-track measure with no note, PLUS two figures never
# entered in the first pillar, plus one key objective left blank.
STATE2 = """(u) => {
  const un = UNITS[u], first = un.items[0];
  first.measures[0].actual = ""; first.measures[0].note = "";
  (first.tactics||[]).forEach((t,i) => { if (i === 0) { t.outActual = ""; t.actual = ""; } });
  un.keyObjectives[1].actual = "";
}"""

# Which places owe a note / owe anything — asked of the product's own rules.
PLACES = """(u) => {
  const un = UNITS[u], out = [];
  const noteOf = (list, kind) => SMPRules.shown(list||[]).filter(o => needsNote({kind:kind, obj:o})).length;
  const owedOf = (list, kind, due) => SMPRules.shown(list||[]).filter(o =>
      (!due || due(o)) && !rowAnswered({kind:kind, obj:o})).length;
  out.push({ key:'ko', label:'Key objectives',
             notes: noteOf(un.keyObjectives, 'objective'),
             owed: owedOf(un.keyObjectives, 'objective') });
  (un.items||[]).forEach((p,i) => out.push({
    key: 'p'+i, label: pillarCode(un, i),
    notes: noteOf(p.measures,'measure') + noteOf(p.tactics,'tactic'),
    owed:  owedOf(p.measures,'measure') + owedOf(p.tactics,'tactic', tacticDue) }));
  return out;
}"""

TRIM = """() => {
  const pan = document.getElementById('panel').cloneNode(true);
  // Trim long tables so four panels fit on one page; the shape is what is
  // being decided, not the row count.
  pan.querySelectorAll('table tbody').forEach(tb => {
    const keep = 2;
    [...tb.rows].slice(keep).forEach(r => r.remove());
  });
  // The owner's-note card at the foot says nothing about this decision.
  const cards = pan.querySelectorAll('h4.mini');
  cards.forEach(h => { if (/note on this cycle/i.test(h.textContent)) {
    const c = h.nextElementSibling; h.remove(); if (c) c.remove(); } });
  return pan.innerHTML;
}"""

def go(pg, unit):
    pg.evaluate("""(u) => { const smo = PEOPLE.filter(p => (p.role||'')==='super')[0];
        VIEWER = smo.key; leaveModes(); current = u; paint(); }""", unit)
    pg.wait_for_timeout(250)
    pg.click('[data-s="performance"]'); pg.wait_for_timeout(350)
    pg.evaluate("() => { const b=document.querySelector('[data-s=report]'); if(b) b.click(); }")
    pg.wait_for_timeout(500)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1500, "height": 950})
    pg.on("pageerror", lambda e: print("PAGEERROR", e))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    pg.goto(URL); pg.wait_for_timeout(1800)
    go(pg, UNIT)

    out = {}

    # ── STATE 1 ────────────────────────────────────────────────────────
    pg.evaluate(FILL_ALL, UNIT); pg.evaluate(STATE1, UNIT)
    pg.evaluate("() => paint()"); pg.wait_for_timeout(600)
    pg.evaluate("""() => { const r = document.querySelectorAll('.rail .ritem');
                           if (r.length && !r[0].classList.contains('on')) r[0].click(); }""")
    pg.wait_for_timeout(500)
    out["places1"] = pg.evaluate(PLACES, UNIT)
    out["blockers1"] = pg.evaluate("(u)=>{const b=submitBlockers(u);"
        "return {notes:b.notes.length,pending:b.pending.length,owed:b.owed,gaps:b.gaps};}", UNIT)
    out["why1"] = pg.evaluate("(u)=>submitWhyShort(u)", UNIT)
    out["today"] = pg.evaluate(TRIM)
    out["bar1"] = pg.evaluate("()=>{const b=document.querySelector('.repchrome');return b?b.outerHTML:'';}")

    # ── STATE 2 (mixed) ────────────────────────────────────────────────
    pg.evaluate(STATE2, UNIT)
    pg.evaluate("() => paint()"); pg.wait_for_timeout(600)
    pg.evaluate("""() => { const r = document.querySelectorAll('.rail .ritem');
                           if (r.length && !r[0].classList.contains('on')) r[0].click(); }""")
    pg.wait_for_timeout(500)
    out["places2"] = pg.evaluate(PLACES, UNIT)
    out["blockers2"] = pg.evaluate("(u)=>{const b=submitBlockers(u);"
        "return {notes:b.notes.length,pending:b.pending.length,owed:b.owed,gaps:b.gaps};}", UNIT)
    out["why2"] = pg.evaluate("(u)=>submitWhyShort(u)", UNIT)
    out["mixed"] = pg.evaluate(TRIM)
    out["bar2"] = pg.evaluate("()=>{const b=document.querySelector('.repchrome');return b?b.outerHTML:'';}")

    (OUT / "panels.json").write_text(json.dumps(out, indent=1))
    print("blockers1", out["blockers1"], "\nplaces1", out["places1"])
    print("blockers2", out["blockers2"], "\nplaces2", out["places2"])
    print("why2", out["why2"])
    b.close()
print("saved", (OUT/'panels.json').stat().st_size)
