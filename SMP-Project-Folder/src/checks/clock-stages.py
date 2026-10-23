"""The presenter's clock as time runs out (§580).

Islam's stages, round 3 signed off ("quarter is fine, build it"): grey above
five minutes left; amber and a third bigger from five; on its light amber
ground, 1.6x and a slow pulse in the last minute; red, twice the size and
pulsing once over; from four over the pulse twice as fast and the slide a
quarter dark; from five over the slide black with the clock still on it.
T holds it and lifts the dark, T again brings it back; the next subject
starts its own time and clears everything. Only the clock moves.

Measured, not looked at: the scale off the computed transform, the pulse off
the computed animation, the dark off the veil's computed opacity once its
ease has run. BOTH ENDS (§94.2) at every boundary. SMP_BUILT points it at
another build (§276).
"""
import os, re
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or os.path.join(os.path.dirname(__file__), "..", "strategy-management-platform.html")
bad = 0
def ck(name, ok, detail=""):
    global bad
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok else "  — " + str(detail)))
    if not ok: bad += 1
def safe(pg, js, arg=None, dflt=None):
    try: return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    except Exception as e: return dflt

MAKE = """()=>{
  var src=UNITS.mobile.items;
  GROUP.structure = {bu:{exists:false}, top:{on:SMPRules.STRUCT_COMPONENTS.slice(), temple:true}};
  GROUP.items = ['Maximizing Current Stores','New Store Expansion'].map(function(n,i){
    var p=JSON.parse(JSON.stringify(src[i])), id='group-P'+(i+1);
    p.id=id; p.name=n; p.code=''; p.owner='Owner '+(i+1); p.sub=''; p.theme=''; p.kind='';
    (p.measures||[]).forEach(function(m,k){ m.id=id+'-M'+(k+1); });
    (p.tactics||[]).forEach(function(t,k){ t.id=id+'-T'+(k+1); });
    return p; });
  GROUP.presentMins = {'dir:group-P1':15, 'dir:group-P2':10};
  SYNC.refresh = function(done){ done(true, false); };
  current='group'; currentSub='performance'; paint(); return true}"""
# Where the clock stands, set as a time left (negative: over), running.
AT = """(left)=>{ var c = DECK.clock; c.ran = c.mins*60000 - left; c.from = Date.now(); clockPaint(); return true }"""
READ = """()=>{ var e = document.getElementById('dclock'), v = document.querySelector('#deckroot .dveil');
  var cs = getComputedStyle(e), m = cs.transform, k = 1;
  if (m && m !== 'none') { var n = m.match(/matrix\\(([^,]+)/); if (n) k = parseFloat(n[1]); }
  return { cls: e.className, scale: Math.round(k * 100) / 100,
           anim: cs.animationName === 'none' ? '' : cs.animationName,
           dur: parseFloat(cs.animationDuration) || 0,
           bg: cs.backgroundColor, veil: v ? v.className : null,
           dark: v ? parseFloat(getComputedStyle(v).opacity) : -1,
           clockOnTop: v ? +getComputedStyle(e).zIndex > +getComputedStyle(v).zIndex : null,
           text: e.querySelector('.dctime').textContent }; }"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1600, "height": 900})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(800)
    office = safe(pg, "()=>(PEOPLE.find(p=>SMPRules.mayMasterPresent(world(), p))||{}).key")
    safe(pg, "()=>{switchViewer('%s'); return true}" % office); pg.wait_for_timeout(300)
    safe(pg, MAKE); pg.wait_for_timeout(300)
    safe(pg, "()=>{openDeckWith('t', flowWithParts(['dir:group-P1','dir:group-P2'])); deckGoFull(); return true}"); pg.wait_for_timeout(500)
    # onto the first direction's own slides, where its fifteen minutes run
    for _ in range(12):
        if safe(pg, "()=>clockSubject()") == "dir:group-P1": break
        pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(120)
    ck("the first direction's clock runs, fifteen minutes", safe(pg, "()=>DECK.clock && DECK.clock.mins") == 15, safe(pg, "()=>DECK.clock"))

    def at(left, settle=200):
        safe(pg, AT, left); pg.wait_for_timeout(settle)
        return safe(pg, READ) or {}

    # ── 1. The stages, each boundary from both sides ─────────────────────
    s = at(6 * 60000, 800)
    ck("6:00 left: grey, its own size, still, the slide clear",
       "near" not in s["cls"] and "over" not in s["cls"] and s["scale"] == 1 and not s["anim"] and s["dark"] == 0, s)
    s = at(5 * 60000 + 2000, 800)
    ck("5:02 left: not yet amber", "near" not in s["cls"] and s["scale"] == 1, s)
    s = at(5 * 60000 - 1000, 800)
    ck("4:59 left: amber and a third bigger, still", "near" in s["cls"] and s["scale"] == 1.3 and not s["anim"], s)
    s = at(61000, 800)
    ck("1:01 left: still the amber stage", "last" not in s["cls"] and s["scale"] == 1.3, s)
    s = at(59000, 800)
    ck("0:59 left: the last minute, 1.6x on its light amber ground, pulsing slowly",
       "last" in s["cls"] and s["scale"] == 1.6 and s["anim"] == "dclockPulse" and 2.5 <= s["dur"] <= 3.1
       and s["bg"] == safe(pg, "()=>{var d=document.createElement('i'); d.style.color='var(--attn-bg)'; document.body.appendChild(d); var c=getComputedStyle(d).color; d.remove(); return c}"), s)
    ck("…not red", "over" not in s["cls"], s)
    s = at(-2000, 800)
    ck("+0:02: red, twice the size, pulsing every 1.4 seconds, the slide still clear",
       "over" in s["cls"] and s["scale"] == 2 and s["anim"] == "dclockPulse" and abs(s["dur"] - 1.4) < .05 and s["dark"] == 0, s)
    s = at(-(4 * 60000 - 2000), 1500)
    ck("+3:58: the slide still clear, the pulse unchanged", s["dark"] == 0 and abs(s["dur"] - 1.4) < .05 and "fast" not in s["cls"], s)
    s = at(-(4 * 60000 + 2000), 1500)
    ck("+4:02: the slide a quarter dark", "dim" in (s["veil"] or "") and abs(s["dark"] - .25) < .01, s)
    ck("…and the pulse twice as fast", "fast" in s["cls"] and abs(s["dur"] - .7) < .05, s)
    ck("…the clock above the dark, at twice the size", s["clockOnTop"] is True and s["scale"] == 2, s)
    s = at(-(5 * 60000 - 2000), 1500)
    ck("+4:58: still a quarter, not black", abs(s["dark"] - .25) < .01, s)
    s = at(-(5 * 60000 + 2000), 1500)
    ck("+5:02: the slide black", "dark" in (s["veil"] or "") and s["dark"] == 1, s)
    ck("…with the clock still on it, pulsing fast", s["clockOnTop"] is True and "fast" in s["cls"] and s["anim"] == "dclockPulse", s)
    ck("…counting on", str(s["text"]).startswith("+5:0"), s["text"])
    shot_dark = pg.screenshot()

    # ── 2. T lifts it and brings it back ─────────────────────────────────
    pg.keyboard.press("t"); pg.wait_for_timeout(1500)
    s = safe(pg, READ)
    ck("T: held, the dark lifted at once", "paused" in s["cls"] and s["dark"] == 0 and "dark" not in s["veil"], s)
    ck("…the clock still, still red, saying Paused", not s["anim"] and "over" in s["cls"] and
       safe(pg, "()=>!document.querySelector('#dclock .dcw').hidden") is True, s)
    pg.keyboard.press("t"); pg.wait_for_timeout(1500)
    s = safe(pg, READ)
    ck("T again: the black comes back, the pulse with it", s["dark"] == 1 and s["anim"] == "dclockPulse" and "paused" not in s["cls"], s)
    s = at(-(4 * 60000 + 30000), 1500)
    pg.keyboard.press("t"); pg.wait_for_timeout(1500)
    held = safe(pg, READ)
    pg.keyboard.press("t"); pg.wait_for_timeout(1500)
    back = safe(pg, READ)
    ck("held in the dimmed minute it lifts, and comes back a quarter", held["dark"] == 0 and abs(back["dark"] - .25) < .01, (held, back))

    # ── 3. Y starts the time again, and the dark goes with it ────────────
    s = at(-(5 * 60000 + 30000), 1500)
    pg.keyboard.press("y"); pg.wait_for_timeout(1500)
    s = safe(pg, READ)
    ck("Y: the time starts again, grey, the slide clear", s["dark"] == 0 and "over" not in s["cls"] and s["scale"] == 1, s)

    # ── 4. The next direction clears everything ──────────────────────────
    s = at(-(5 * 60000 + 30000), 1500)
    for _ in range(40):
        if safe(pg, "()=>clockSubject()") == "dir:group-P2": break
        pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(100)
    pg.wait_for_timeout(1500)
    s = safe(pg, READ)
    ck("moving on to the next direction starts its own ten minutes, the slide clear",
       safe(pg, "()=>DECK.clock && DECK.clock.mins") == 10 and s["dark"] == 0 and "over" not in s["cls"] and s["scale"] == 1, s)

    # ── 5. Without minutes, nothing; not on paper; held still for those who ask
    s = at(-(5 * 60000 + 30000), 1500)
    safe(pg, "()=>{DECK.clock=null; clockPaint(); return true}"); pg.wait_for_timeout(1500)
    ck("a subject with no time set: no clock and no dark", safe(pg, "()=>document.getElementById('dclock').hidden") is True and
       (safe(pg, READ) or {}).get("dark") == 0, safe(pg, READ))
    safe(pg, "()=>{DECK.clock={t:clockSubject(), mins:10, ran:0, from:Date.now()}; return true}")
    s = at(-(5 * 60000 + 30000), 1500)
    pg.emulate_media(media="print"); pg.wait_for_timeout(200)
    ck("on paper there is no dark", safe(pg, "()=>getComputedStyle(document.querySelector('#deckroot .dveil')).display") == "none")
    pg.emulate_media(media="screen", reduced_motion="reduce"); pg.wait_for_timeout(300)
    s = at(-(4 * 60000 + 30000), 300)
    ck("asked for less motion: the clock does not pulse, the stage still shows", not s["anim"] and "fast" in s["cls"] and s["scale"] == 2, s)
    pg.emulate_media(reduced_motion="no-preference")

    # ── 6. Two screens: the laptop is told ───────────────────────────────
    words = safe(pg, """()=>{ var a = {on:true, label:'x', n:1, total:2, full:true};
      var out = [];
      [['', 'dimmed'], ['', 'dark'], ['', '']].forEach(function(d){
        a.clock = {text:'+4:30', over:true, near:false, paused:false, dark:d[1]};
        ROOM = {at:a}; out.push(roomStripText()); });
      ROOM = null; return out; }""") or ["", "", ""]
    ck("on two screens the laptop's strip says when the room's slide is dimmed, and when it is dark",
       "dimmed" in words[0] and "dark, T lifts it" in words[1] and "dimmed" not in words[2] and "dark" not in words[2], words)
    safe(pg, "()=>{closeDeck(); return true}")
    ck("no page errors", not errs, errs[:3])
    b.close()
print("FAILED" if bad else "all green", bad)
raise SystemExit(1 if bad else 0)
