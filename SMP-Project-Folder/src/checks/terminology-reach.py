"""The client's words reach every screen (§395).

§392 made every term a pair the client names once on Setup › Terminology, and
routed the words through the places people see most. This asks the harder
question: rename EVERY term to a word the platform could never produce by
accident ("ZQpillars", "ZQproject"), walk every destination, every tab, every
section — reading AND with the pen open — the review deck, and every Setup
page, and look for the platform's own word still standing in a heading, a
column head, a button, a tab, a placeholder or a label.

WHAT IT DOES NOT ASK, SAID RATHER THAN LEFT AS AN ABSENCE (§54.5):
  * prose — the knowledge base, notes, hovers. A sentence is read, not
    scanned, and the knowledge base describes the PLATFORM (§160);
  * role names (Pillar owner, Project owner), the Focus measures feature's
    own name, and a pillar's kind
    (Direction · Capability) — those are the product's names, not the
    client's vocabulary;
  * the access matrix's column heads ("Own BU", "Other Func.") — Islam's own
    short forms, chosen to fit one line (§174);
  * the tenant's DATA — a pillar named "Solution Selling Capability" is
    their word. Every name the plan holds is removed before matching;
  * Setup › Terminology, which shows the platform's own words on purpose.

BOTH ENDS (§94.2): a build that drew no headings at all would pass every
"nothing left" assertion, so the renamed words are asserted PRESENT on the
places they must reach.

Run through qa-run.py (§320.6b). SMP_BUILT points it at another build (§276).
"""
import os, re, json, sys
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or "strategy-management-platform.html"
URL = "file://" + os.path.abspath(BUILT)
WORDS = ["theme", "pillar", "capabilit", "key objective", "winning aspiration",
         "key measure", "tactic", "business unit", "supporting function", "project"]
# "measure" on its own is a noun here only as a whole word — "measured" is prose.
RX = re.compile(r"\b(" + "|".join(re.escape(w) for w in WORDS) + r"|measures?\b)", re.I)
EXEMPT = re.compile(r"Pillar owner|Project owner|Focus measure|^(Capability|Direction)( · |$)|^(file|https?):", re.I)

SET = """LABELS.entries.forEach(function(e){ e.group = 'ZQ' + e.key; e.bu = 'ZQ' + e.key + 's'; }); paint();"""
NAMES = """(function(){ var n = [];
  function add(x){ if (x && x.name) n.push(String(x.name)); }
  UNIT_KEYS.forEach(function(k){ var u = UNITS[k]; add(u);
    (u.keyObjectives||[]).forEach(add);
    (u.items||[]).forEach(function(p){ add(p); (p.measures||[]).forEach(add); (p.tactics||[]).forEach(add); }); });
  FUNCTION_KEYS.forEach(function(k){ var f = FUNCTIONS[k]; add(f); (f.keyObjectives||[]).forEach(add);
    (f.items||[]).forEach(function(p){ add(p); (p.measures||[]).forEach(add); (p.tactics||[]).forEach(add); });
    (f.projects||[]).forEach(function(p){ add(p); (p.deliverables||[]).forEach(add); (p.outcomes||[]).forEach(add); (p.milestones||[]).forEach(add); }); });
  (GROUP.capabilities||[]).forEach(function(c){ add(c); (c.keyObjectives||[]).forEach(add);
    (c.projects||[]).forEach(function(p){ add(p); (p.deliverables||[]).forEach(add); (p.outcomes||[]).forEach(add); (p.milestones||[]).forEach(add); }); });
  (GROUP.keyObjectives||[]).forEach(add); (GROUP.themes||[]).forEach(add);
  Object.keys(COMPANIES||{}).forEach(function(k){ add(COMPANIES[k]); });
  return n.filter(function(s){ return s.length > 2; }).sort(function(a,b){ return b.length - a.length; }); })()"""
CHROME = """(function(){ var out = [];
  var sel = 'th, h1, h2, h3, h4, button, summary, label, [data-s], [data-sub2], .rhead, .cfg-lab, .secttl, .pband-n, .sec-hint';
  [].forEach.call(document.querySelectorAll(sel), function(el){
    if (!el.getClientRects().length) return;
    if (el.closest('script,style,.welcomeover,#tourdock,.tip,.acgrid')) return;
    var t = (el.innerText || '').replace(/\\s+/g, ' ').trim(); if (t) out.push(t); });
  [].forEach.call(document.querySelectorAll('[placeholder]'), function(el){
    if (el.getClientRects().length) out.push(el.getAttribute('placeholder')); });
  return out; })()"""
DECK = """(function(t){ try { var d = document.createElement('div'); d.innerHTML = deckHtmlFor(t);
  return [].map.call(d.querySelectorAll('h1,h2,h3,th,.eyebrow,.dsub'), function(x){ return x.textContent.replace(/\\s+/g,' ').trim(); }); }
  catch (e) { return ['ERR ' + e]; } })"""

bad = []
left = {}
seen = {"plan": "", "deck": "", "proj": ""}

def ck(label, ok, detail=""):
    print(("  ok   " if ok else "  FAIL ") + label + ("" if ok else "  " + str(detail)[:300]))
    if not ok: bad.append(label)

def scan(tag, items, names):
    for t in items:
        s = t
        for n in names: s = s.replace(n, "")
        if RX.search(s) and not EXEMPT.search(s):
            left.setdefault(t[:110], set()).add(tag)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME"), args=["--no-sandbox"])
    pg = b.new_page(viewport={"width": 1500, "height": 1000})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_timeout(800)
    try:
        pg.evaluate(SET)
        names = pg.evaluate(NAMES)
        dests = pg.evaluate("(function(){var a=['group']; a=a.concat(UNIT_KEYS); FUNCTION_KEYS.forEach(function(k){a.push('fn:'+k)}); (GROUP.capabilities||[]).forEach(function(c){a.push('cap:'+c.id)}); return a})()")
    except Exception as e:
        print("  FAIL cannot continue: " + str(e)[:200]); sys.exit(1)
    for d in dests:
        try:
            pg.evaluate("leaveModes&&leaveModes(); current=%s; currentSub=null; paint()" % json.dumps(d)); pg.wait_for_timeout(100)
            tabs = pg.evaluate("[].map.call(document.querySelectorAll('[data-s]'),function(x){return x.dataset.s})")
        except Exception as e:
            ck("destination %s opens" % d, False, e); continue
        for tb in tabs:
            try:
                pg.evaluate("var b=document.querySelector('[data-s=\"%s\"]'); b&&b.click()" % tb); pg.wait_for_timeout(100)
                secs = pg.evaluate("[].map.call(document.querySelectorAll('[data-sub2]'),function(x){return x.dataset.sub2})") or [None]
                for s in secs:
                    if s: pg.evaluate("var b=document.querySelector('[data-sub2=\"%s\"]'); b&&b.click()" % s); pg.wait_for_timeout(90)
                    tag = "%s/%s/%s" % (d, tb, s)
                    got = pg.evaluate(CHROME); scan(tag, got, names)
                    if d == "mobile" and tb == "strategy" and s == "plan": seen["plan"] = " ".join(got)
                    if d == "fn:finance" and s in ("proj", "plan"): seen["proj"] += " ".join(got)
                    if pg.evaluate("!!document.querySelector('.secpen:not(.on)')"):
                        pg.evaluate("document.querySelector('.secpen:not(.on)').click()"); pg.wait_for_timeout(120)
                        scan(tag + "/EDIT", pg.evaluate(CHROME), names)
                        pg.evaluate("var b=document.querySelector('.secpen.on'); b&&b.click()"); pg.wait_for_timeout(80)
            except Exception as e:
                ck("%s/%s walks" % (d, tb), False, e)
        deck = pg.evaluate(DECK + "(%s)" % json.dumps(d))
        scan(d + "/DECK", deck, names)
        if d == "mobile": seen["deck"] = " ".join(deck)
    pg.evaluate("current='setup'; paint()"); pg.wait_for_timeout(150)
    subs = pg.evaluate("[].map.call(document.querySelectorAll('[data-setupgo]'),function(x){return x.dataset.setupgo})")
    for s in subs:
        if s in ("labels", "kb"): continue
        try:
            pg.evaluate("current='setup'; currentSub=%s; paint()" % json.dumps(s)); pg.wait_for_timeout(120)
            secs = pg.evaluate("[].map.call(document.querySelectorAll('[data-sub2]'),function(x){return x.dataset.sub2})") or [None]
            for sc in secs:
                if sc: pg.evaluate("var b=document.querySelector('[data-sub2=\"%s\"]'); b&&b.click()" % sc); pg.wait_for_timeout(90)
                scan("setup/%s/%s" % (s, sc), pg.evaluate(CHROME), names)
        except Exception as e:
            ck("setup/%s walks" % s, False, e)
    b.close()

print("\n1 · the client's words are there (both ends, §94.2)")
# innerText is the RENDERED text and a heading may be uppercased by CSS
# (§301.6), so presence is asked case-blind.
seen = {k: v.lower() for k, v in seen.items()}
ck("a unit's Plan names the client's word for its pillars", "zqpillars" in seen["plan"], seen["plan"][:200])
ck("…and its key measures and tactics", "zqmeasure" in seen["plan"] and "zqtactic" in seen["plan"], seen["plan"][:200])
ck("a function's projects page names the client's word for a project", "zqproject" in seen["proj"], seen["proj"][:200])
ck("the review deck speaks the client's words", "zq" in seen["deck"], seen["deck"][:200])

print("\n2 · the platform's own word is left nowhere a heading, a button or a label is drawn")
for t in sorted(left):
    print("     left: " + t + "   <= " + ",".join(sorted(left[t]))[:90])
ck("no heading, column, button, tab, label or placeholder keeps the platform's word", not left, "%d places" % len(left))

print("\n3 · renaming broke nothing")
ck("no page error while walking every page", not errs, errs[:3])

print("\n" + ("%d FAILED" % len(bad) if bad else "all good"))
sys.exit(1 if bad else 0)
