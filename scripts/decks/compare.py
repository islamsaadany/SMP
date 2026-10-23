"""── WHERE THE THREE DECK BUILDERS DISAGREE (spec 066 stage 5) ──────────

Islam, asked how much the decks may move when three builders become one:
*"show me where they differ, then I decide"*.

So this decides nothing. It renders EVERY box's deck in a real browser,
reads the slides out of the deck itself rather than out of a description of
it, and lines the three builders up side by side: which slides each one
makes for a box, in what order, and what each slide actually says.

WHAT A "BUILDER" IS HERE, because the fork is not where a reader expects:
`deckHtmlFor` picks by how a box PLANS, not by what kind of box it is —
`deckSlides` for a pillars plan, `deckSlidesFn` for projects or objectives
and actions, `dirDeckHtml` for one direction. So a unit and a function
planning the same way get the same deck, and the same unit planning two
ways gets two different ones. That is the thing being compared.

READ OFF THE SLIDES, NEVER OFF A LIST BESIDE THEM (§94.8, and the deck's
own `deckAnchors` does the same): a slide names itself with `data-anchor`,
and a slide the office may hide also carries `data-sec` and
`data-sec-name`. A catalogue built from anything else would describe a deck
nobody renders.

  python3 scripts/decks/compare.py                 # the demo's own clients
  python3 scripts/decks/compare.py <state.json>    # a real client's state
  python3 scripts/decks/compare.py <state.json> --shots <dir>

It writes nothing to the product and changes no state it does not put back.
"""
import os, io, sys, json, re
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or os.path.join(
    os.path.dirname(__file__), "..", "..", "SMP-Project-Folder", "src",
    "strategy-management-platform.html")
# A flag's VALUE is not a positional, which the first draft got wrong: it
# read `--shots <dir>` and then tried to open <dir> as the client's state.
FLAGS = {"--shots", "--only"}
args, skip = [], False
for a in sys.argv[1:]:
    if skip: skip = False; continue
    if a in FLAGS: skip = True; continue
    if a.startswith("--"): continue
    args.append(a)
STATE = io.open(args[0], encoding="utf-8").read() if args else None
SHOTS = None
if "--shots" in sys.argv:
    SHOTS = sys.argv[sys.argv.index("--shots") + 1]
    os.makedirs(SHOTS, exist_ok=True)
# --only narrows the pictures to named boxes, so a side-by-side is two decks
# rather than twelve. The REPORT above always covers every box.
ONLY = (sys.argv[sys.argv.index("--only") + 1].split(",")
        if "--only" in sys.argv else None)

# Every box this client has, with the builder its plan sends it to.
SUBJECTS = """()=>{
  var out = [];
  var add = function(target, what){
    var way = "";
    try { way = SMPRules.plansInPillars(target) ? "pillars"
                 : (typeof unitWayOf === "function" ? "" : ""); } catch(e){}
    out.push({ target: target, what: what });
  };
  add("group", "the company");
  (UNIT_KEYS||[]).forEach(function(k){ add(k, "unit"); });
  (FUNCTION_KEYS||[]).forEach(function(k){ add("fn:"+k, "function"); });
  ((GROUP&&GROUP.capabilities)||[]).forEach(function(c){ add("cap:"+c.id, "capability"); });
  ((GROUP&&GROUP.items)||[]).forEach(function(p){
    if (p && p.id && SMPRules.pillarIsCap && !SMPRules.pillarIsCap(p)) add("dir:"+p.id, "direction");
  });
  return out;
}"""

# The slides of one deck, read out of the deck.
SLIDES = """(t)=>{
  /* Every id a slide anchor can carry, longest first so `cap7-P1` is
     replaced before `cap7`. Read off the client, not invented. */
  var IDS = [];
  var push = function(v){ v = String(v||"").trim(); if (v) IDS.push(v); };
  ((GROUP&&GROUP.capabilities)||[]).forEach(function(c){
    push(c.id);
    (c.projects||[]).forEach(function(p){ push(p.id); });
    (c.items||[]).forEach(function(p){ push(p.id); });
  });
  (UNIT_KEYS||[]).forEach(function(k){
    push(k);
    ((UNITS[k]||{}).items||[]).forEach(function(p){ push(p.id); push(p.code); });
    ((UNITS[k]||{}).projects||[]).forEach(function(p){ push(p.id); });
  });
  (FUNCTION_KEYS||[]).forEach(function(k){
    push("fn:"+k); push(k);
    ((FUNCTIONS[k]||{}).projects||[]).forEach(function(p){ push(p.id); });
    ((FUNCTIONS[k]||{}).items||[]).forEach(function(p){ push(p.id); push(p.code); });
  });
  ((GROUP&&GROUP.items)||[]).forEach(function(p){ push(p.id); push(p.code); });
  IDS = IDS.filter(function(v,i){ return IDS.indexOf(v) === i; })
           .sort(function(a,b){ return b.length - a.length; });
  var box = document.createElement("div");
  try { box.innerHTML = deckHtmlFor(t); } catch(e){ return { threw: String(e && e.message || e) }; }
  /* `plansInPillars` is a global of the product's, not a rule on SMPRules —
     asked the way `deckHtmlFor` itself asks it, so the answer is the one the
     fork actually uses (§42). */
  var which = "?";
  try {
    var r = boxRef(t);
    which = r.kind === "dir" ? "dirDeckHtml"
          : (plansInPillars(t) ? "deckSlides" : "deckSlidesFn");
  } catch(e){ which = "? (" + String(e && e.message || e).slice(0,40) + ")"; }
  var S = [].slice.call(box.querySelectorAll(".dslide")).map(function(el, i){
    var h = el.querySelector("h1,h2,h3");
    /* A SLIDE ABOUT ONE THING CARRIES ITS ID (§310, and `anch("cap"+c.id)`
       and friends): `pMB01`, `prjcap7-P1`, `capfn:finance`. Compared raw,
       every box looks unique and the real differences drown.
       NORMALISED BY THE REAL IDS, NEVER BY A PATTERN THAT LOOKS LIKE ONE —
       the first draft used `^(cap|dir|prj|obj|ms)…` and quietly turned the
       literal anchor `objectives` into `obj<n>`, which is a slide the
       comparison would then have reported as two. The ids are read off the
       client and replaced exactly, longest first. */
    var raw = el.getAttribute("data-anchor") || "";
    var norm = raw;
    for (var q = 0; q < IDS.length; q++) {
      if (norm.indexOf(IDS[q]) >= 0) { norm = norm.split(IDS[q]).join("<n>"); break; }
    }
    return { at: i + 1,
             anchor: norm,
             rawAnchor: raw,
             label:  el.getAttribute("data-anchor-label") || "",
             sec:    el.getAttribute("data-sec") || "",
             secName:el.getAttribute("data-sec-name") || "",
             cls:    (el.className || "").replace("dslide","").trim(),
             head:   h ? h.textContent.trim().slice(0, 60) : "",
             words:  (el.textContent || "").replace(/\\s+/g," ").trim().length };
  });
  return { builder: which, n: S.length, slides: S };
}"""

def shape_of(d):
    """A deck's SHAPE: its slides in order, with the per-pillar run collapsed.

       A pillars plan emits the same CYCLE of slides once per pillar —
       `p<pillar>d`, `p<pillar>m`, `p<pillar>` — so a box with four pillars
       and a box with two look like different decks when all that differs is
       how much they hold. The run is folded to its cycle and a count, which
       is what makes two boxes comparable at all."""
    anch = [(x["anchor"] or x["cls"] or "?") for x in d["slides"]]
    out, i = [], 0
    while i < len(anch):
        if "<n>" in anch[i]:
            j = i
            while j < len(anch) and "<n>" in anch[j]: j += 1
            run = anch[i:j]
            cycle = []
            for a in run:
                if a in cycle: break
                cycle.append(a)
            n = len(run) // len(cycle) if cycle else 0
            exact = cycle * n == run
            out.append("per item [ %s ]  × %d%s"
                       # Scoped to the fold, so it cannot reach a literal anchor the way the
                       # first draft's global pattern reached `objectives`: inside a
                       # per-item run, a leftover code prefix is part of the id.
                       % (" + ".join(re.sub(r"[A-Z]{1,4}(?=<n>)", "", c).replace("<n>", "·")
                                     for c in cycle),
                          n, "" if exact else "  (+ odd ones out)"))
            i = j
        else:
            k = i
            while k < len(anch) and anch[k] == anch[i]: k += 1
            out.append(anch[i] if k - i == 1 else "%s  × %d" % (anch[i], k - i))
            i = k
    return out


def main():
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1600, "height": 1000})
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                           "localStorage.setItem('smp.tour.never','1')}catch(e){}")
        pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(1000)
        if STATE:
            pg.evaluate("(s)=>{SYNC.hydrate(JSON.parse(s)); paint();}", STATE)
            pg.wait_for_timeout(500)
        client = pg.evaluate("()=>GROUP.org") or "(unnamed)"
        subs = pg.evaluate(SUBJECTS)

        decks = []
        for s in subs:
            d = pg.evaluate(SLIDES, s["target"])
            if d.get("threw"):
                print("  !! %-22s threw: %s" % (s["target"], d["threw"])); continue
            d.update(s); decks.append(d)

        print("CLIENT: %s  —  %d boxes with a deck\n" % (client, len(decks)))

        # 1 · who goes to which builder
        by = {}
        for d in decks: by.setdefault(d["builder"], []).append(d)
        print("1 · WHICH BUILDER EACH BOX GOES TO")
        for k in sorted(by):
            names = ", ".join(sorted(set(x["what"] for x in by[k])))
            print("    %-14s %2d boxes  (%s)" % (k, len(by[k]), names))

        # 2 · the slide list each builder makes, in order
        print("\n2 · THE SLIDES EACH BUILDER MAKES, IN ORDER")
        shapes = {}
        for k in sorted(by):
            seqs = {}
            for d in by[k]:
                # how MANY pillars a box has is not a difference in the
                # deck's shape — strip the counts for grouping, keep them
                # in what is printed. 
                key = re.sub(r"  × \d+", "  × n", " > ".join(shape_of(d)))
                seqs.setdefault(key, []).append(d["what"] + " " + d["target"])
            shapes[k] = seqs
            print("\n  %s — %d different slide orders across its boxes" % (k, len(seqs)))
            for i, (key, who) in enumerate(sorted(seqs.items(), key=lambda kv: -len(kv[1])), 1):
                print("    %d) %d box(es): %s" % (i, len(who), ", ".join(who[:3]) +
                                                  (" …" if len(who) > 3 else "")))
                for j, a in enumerate(key.split(" > "), 1):
                    print("         %2d. %s" % (j, a))

        # 3 · the differences, which is the point
        #
        # SPLIT STRUCTURAL FROM PER-ITEM, or the answer drowns. A deck makes
        # one slide per pillar and one per project, so a client with 14
        # pillars contributes 14 "differences" that are all the same
        # difference. What a reader has to decide about is the slides a box
        # gets ONCE — its Foundation, its SWOT, its results — and those are
        # the anchors with no id in them.
        def structural(aset): return sorted(x for x in aset if "<n>" not in x)
        def peritem(aset):    return sorted(x for x in aset if "<n>" in x)

        allanch = {}
        for k in sorted(by):
            acc = set()
            for d in by[k]:
                for x in d["slides"]: acc.add(x["anchor"] or x["cls"] or "?")
            allanch[k] = acc
        ks = sorted(allanch)

        print("3 · THE SLIDES A BOX GETS ONCE  (the ones to decide about)")
        every = sorted(set().union(*[set(structural(v)) for v in allanch.values()])) if allanch else []
        w = max([len(x) for x in every] + [6])
        print("    %-*s  %s" % (w, "slide", "  ".join("%-14s" % k for k in ks)))
        for x in every:
            cells = []
            for k in ks:
                cells.append("%-14s" % ("yes" if x in allanch[k] else "—"))
            mark = "" if all(x in allanch[k] for k in ks) else "   <<< differs"
            print("    %-*s  %s%s" % (w, x, "  ".join(cells), mark))

        print("\n4 · THE SLIDES IT MAKES ONE OF PER THING")
        for k in ks:
            print("    %-14s %s" % (k, ", ".join(peritem(allanch[k])) or "(none)"))

        if SHOTS:
            print("\n5 · PICTURES  → %s" % SHOTS)
            shot(pg, decks, SHOTS)

        print("\npage errors: %s" % (errs[:2] if errs else "none"))
        b.close()

def shot(pg, decks, out):
    """One picture per slide, for the boxes that show each builder's shape."""
    seen = set(); made = 0
    if ONLY: decks = [d for d in decks if d["target"] in ONLY]
    for d in decks:
        key = d["builder"] + "|" + " > ".join((x["anchor"] or x["cls"] or "?") for x in d["slides"])
        if key in seen: continue
        seen.add(key)
        pg.evaluate("""(t)=>{ var w = document.getElementById('cmp-deck');
          if (w) w.remove();
          w = document.createElement('div'); w.id = 'cmp-deck';
          w.style.cssText = 'position:fixed;left:0;top:0;width:1600px;background:#fff;z-index:99999';
          w.innerHTML = deckHtmlFor(t); document.body.appendChild(w); }""", d["target"])
        pg.wait_for_timeout(300)
        els = pg.query_selector_all("#cmp-deck .dslide")
        safe = re.sub(r"[^a-z0-9]+", "-", (d["builder"] + "-" + d["target"]).lower()).strip("-")
        for i, el in enumerate(els, 1):
            a = el.get_attribute("data-anchor") or "slide"
            try:
                el.screenshot(path=os.path.join(out, "%s__%02d_%s.png" % (safe, i, a)))
                made += 1
            except Exception:
                pass
        pg.evaluate("()=>{var w=document.getElementById('cmp-deck'); if(w) w.remove();}")
    print("    %d pictures" % made)

main()
