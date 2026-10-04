"""A CONTROL IS BIG ENOUGH TO HIT, AND ITS EDGE CAN BE SEEN (§484).

qa-run: file — the subject is the built platform's own CSS, which is the same
CSS the served app is handed verbatim by `scripts/sync-css.mjs`, so opening the
built file measures what both stacks paint.

ISLAM ASKED FOR TWO FIXES AND THIS IS THE THIRD THING THE AUDIT FOUND: there
are 180-odd checks on this platform and not one of them had ever measured how
big a control is, or how far it is from the one beside it, or whether the edge
of a box can be seen at all. That is exactly why the × on a plan row could go
19.7px → 15px wide and ship: no CSS changed, nothing threw, every check stayed
green, and the only way anybody would have found it is by missing the button
with a thumb (§51.11's family — a whole CLASS with no check rather than a
selector that moved).

WHAT IS ASSERTED

 §1 THE PAIR THAT WAS REPORTED, by name. The eye that hides a row and the ×
    that removes it, on a unit's Plan with the pen open. Asserted at BOTH ENDS
    (§94.2): the pair must be FOUND first, or a build that drew neither button
    satisfies every distance assertion perfectly (§113.8).

 §2 THE SPACING RULE ITSELF, over every visible control on five pages — the
    standard's own test rather than a list of the controls we happen to know
    about, so a button added next month is measured the day it is added
    (§104.7). An undersized target is allowed, exactly as the standard allows
    it, as long as its 24px circle reaches nothing else; the eye is 24×22 and
    passes that way, which is why this is not "every control must be 24×24".

 §3 THE EDGE OF A BOX, both sides of it. A field's border against the surface
    INSIDE it and against the ground it SITS ON, ≥3:1 (WCAG 1.4.11). Measuring
    both is what moved the shipped colour: the value signed off on the mockup
    cleared the inside and missed the zebra stripe that 90 of these sit on.

 §4 AND THE FIX DID NOT REACH FURTHER THAN THE FAULT. A table's gridline is
    still a hairline — `--line` is a border in 332 places and darkening it
    would have turned every table in the product into a grid. Asserted as the
    CONTROL (§113.8): without it a build that swept every border to the new
    colour would pass §3 with full marks.

 §5 BOTH PALETTES. Dark needed its own measurement rather than a mirror of the
    light one (§38.5, eighth time), so it is measured rather than assumed.

NOT ASSERTED, AND SAID RATHER THAN LEFT AS AN ABSENCE (§54.5): buttons
bordered with `--line` (`.eqcta`, `.segsw`, `.cbtns button`, the wizard's and
the flow's) have the same shortfall and are deliberately out of §3's subject —
Islam's picture was of FIELDS, and widening to them without one is a quiet
restyle of every page (rule 1b). The list is printed on every run so the cost
stays visible rather than disappearing into a green tick.

PROVE IT CAN FAIL (§94.5): SMP_BUILT at the build before this one goes **9 red**
— §1 twice, printing `× [15, 14]` and `23.5` apart; §2 naming both buttons and
the distance; §3 twice at 1.38 and 1.23; §4 once, because `--field-line` does
not exist there to resolve; and §5 three times. **§4's OTHER TWO ARE SKIPPED ON
THAT BUILD, and they SAY SO** — they compare the two tokens, and a build with
one of them has no subject for the comparison; a check that quietly measures
nothing reads exactly like one that passed (§54.5). Two drafts of this
paragraph were wrong about this very run — the first said all of §4 stayed
green, the second said those two were green — both corrected by reading the
output rather than the code (§104.8, §93.11's habit: ask the thing).

Run:  SMP_CHROME=/opt/pw-browsers/chromium python3 qa-run.py checks/control-targets.py
"""
import json, os, pathlib

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
BUILT = os.environ.get("SMP_BUILT") or str(
    ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")
CHROME = os.environ.get("SMP_CHROME") or None

bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


# ── the standard's own two tests, run in the page ───────────────────────────
MEASURE = r"""() => {
  const SEL = 'button, a[href], input:not([type=hidden]), select, textarea,'
            + ' [role="button"], [tabindex]:not([tabindex="-1"]), summary';
  const num = s => { const m = String(s||'').match(/-?[\d.]+/g); return m ? m.map(Number) : null; };
  const lin = c => { c /= 255; return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); };
  const L = a => 0.2126*lin(a[0]) + 0.7152*lin(a[1]) + 0.0722*lin(a[2]);
  const ratio = (a,b) => { const x=L(a), y=L(b), hi=Math.max(x,y), lo=Math.min(x,y);
                           return Math.round(((hi+0.05)/(lo+0.05))*100)/100; };
  const opaque = s => { const a = num(s); return a && (a.length < 4 || a[3] > 0.5) ? a.slice(0,3) : null; };
  const under = el => { let p = el.parentElement;
    while (p) { const c = opaque(getComputedStyle(p).backgroundColor); if (c) return c; p = p.parentElement; }
    return opaque(getComputedStyle(document.body).backgroundColor) || [255,255,255]; };
  const hex = a => '#' + a.map(v => Math.round(v).toString(16).padStart(2,'0')).join('').toUpperCase();

  // every visible, ENABLED, HITTABLE control. Three exclusions, each earned:
  //  · disabled — the standard exempts an inactive control, and `.fld.off` is
  //    a field the row's own unit has deliberately switched off (§251).
  //  · opacity 0 — `checkVisibility()` does NOT look at opacity unless asked,
  //    so the default call counts a control that is deliberately invisible.
  //  · pointer-events:none — `.ss-native` is the real <select> that searchsel
  //    hides IN PLACE (§45.5) so every existing handler keeps working. It is
  //    1×1, clipped and unhittable, and the first run of this check reported
  //    it as an 18×12 target sitting on top of the field beside it: a probe
  //    that models less than the thing it measures calls a correct build
  //    broken (§100.3).
  const live = [];
  for (const el of document.querySelectorAll(SEL)) {
    if (!el.checkVisibility || !el.checkVisibility({ opacityProperty: true,
                                                     visibilityProperty: true })) continue;
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;
    if (getComputedStyle(el).pointerEvents === 'none') continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    live.push({ el: el, r: r });
  }

  // ── 2.5.8, with the spacing exception as the standard words it ───────────
  const small = [];
  for (let i = 0; i < live.length; i++) {
    const a = live[i].r;
    if (a.width >= 24 && a.height >= 24) continue;
    const ax = a.left + a.width/2, ay = a.top + a.height/2;
    let clash = null;
    for (let j = 0; j < live.length && !clash; j++) {
      if (i === j) continue;
      const b = live[j].r;
      const bSmall = b.width < 24 || b.height < 24;
      if (bSmall) {
        // circle vs circle: centres closer than 24 means they intersect
        const bx = b.left + b.width/2, by = b.top + b.height/2;
        const d = Math.hypot(ax-bx, ay-by);
        if (d < 24) clash = { how: 'circle', d: Math.round(d*10)/10,
                              other: live[j].el.className || live[j].el.tagName };
      } else {
        // circle vs the other target's own box
        const nx = Math.max(b.left, Math.min(ax, b.right));
        const ny = Math.max(b.top,  Math.min(ay, b.bottom));
        const d = Math.hypot(ax-nx, ay-ny);
        if (d < 12) clash = { how: 'box', d: Math.round(d*10)/10,
                              other: live[j].el.className || live[j].el.tagName };
      }
    }
    if (clash) small.push({ cls: String(live[i].el.className||'').slice(0,34),
                            tag: live[i].el.tagName.toLowerCase(),
                            w: Math.round(a.width*10)/10, h: Math.round(a.height*10)/10,
                            clash: clash });
  }

  // ── 1.4.11, both sides of the edge ───────────────────────────────────────
  const edges = [];
  for (const q of live) {
    const cs = getComputedStyle(q.el);
    if (cs.borderTopStyle === 'none' || parseFloat(cs.borderTopWidth) < 0.5) continue;
    const bc = opaque(cs.borderTopColor); if (!bc) continue;
    const inside = opaque(cs.backgroundColor) || under(q.el);
    const outside = under(q.el);
    edges.push({ cls: String(q.el.className||'').slice(0,34), tag: q.el.tagName.toLowerCase(),
                 border: hex(bc), inside: ratio(bc, inside), outside: ratio(bc, outside),
                 insideHex: hex(inside), outsideHex: hex(outside) });
  }

  // ── the control: the hairline is NOT the control boundary ────────────────
  // Read the two TOKENS rather than a table cell. The first draft measured a
  // `thead th`, which §41.10 paints navy — so it reported the header's own
  // white rule at 1.00 and would have gone on reporting it whatever happened
  // to `--line` (§113.8: an assertion that passes for the wrong reason).
  const root = getComputedStyle(document.documentElement);
  // a token's value is a HEX string, not an rgb() — the first draft fed it to
  // the rgb parser and read `--line` as "#0605" with a ratio of NaN, which the
  // "they are NOT the same colour" assertion happily passed (§113.8 again).
  const tok = n => { const v = root.getPropertyValue(n).trim();
    const m = v.match(/^#([0-9a-f]{6})$/i);
    return m ? [0,2,4].map(i => parseInt(m[1].slice(i,i+2),16)) : opaque(v); };
  const line = tok('--line'), field = tok('--field-line'), surf = tok('--surface') || [255,255,255];
  const tokens = { line: line && hex(line), field: field && hex(field),
                   lineOnSurface: line && ratio(line, surf),
                   fieldOnSurface: field && ratio(field, surf) };
  return { count: live.length, small: small, edges: edges, tokens: tokens };
}"""

PAIR = r"""() => {
  const eye = [...document.querySelectorAll('button.eyebtn')].filter(e => e.checkVisibility())[0];
  if (!eye) return { missing: 'no eye' };
  const row = eye.closest('tr');
  const x = row && [...row.querySelectorAll('button.xbtn')].filter(e => e.checkVisibility())[0];
  if (!x) return { missing: 'no cross beside it' };
  const a = eye.getBoundingClientRect(), b = x.getBoundingClientRect();
  const d = Math.hypot((a.left+a.width/2)-(b.left+b.width/2), (a.top+a.height/2)-(b.top+b.height/2));
  let pairs = 0;
  for (const e of document.querySelectorAll('button.eyebtn')) {
    if (!e.checkVisibility()) continue;
    const r = e.closest('tr');
    if (r && [...r.querySelectorAll('button.xbtn')].some(q => q.checkVisibility())) pairs++;
  }
  return { eye: [Math.round(a.width), Math.round(a.height)],
           x: [Math.round(b.width), Math.round(b.height)],
           dist: Math.round(d*10)/10, pairs: pairs };
}"""


def go(pg, unit, sub=None):
    pg.evaluate("(k)=>{const b=document.querySelector('[data-u=\"'+k+'\"]');if(b)b.click();}", unit)
    pg.wait_for_timeout(380)
    if sub:
        pg.evaluate("(k)=>{const b=document.querySelector('[data-s=\"'+k+'\"]');if(b)b.click();}", sub)
        pg.wait_for_timeout(380)


def open_pen(pg):
    pg.evaluate("()=>{const b=document.querySelector('.secpen,.penbtn');if(b)b.click();}")
    pg.wait_for_timeout(700)


def read(pg):
    """Every probe degrades rather than dying (§215)."""
    try:
        return pg.evaluate(MEASURE)
    except Exception as e:
        return {"count": 0, "small": [], "edges": [], "tokens": {}, "threw": str(e)[:90]}


print("measuring:", BUILT)

with sync_playwright() as pw:
    launch = {}
    if CHROME:
        launch["executable_path"] = CHROME
    b = pw.chromium.launch(**launch)
    ctx = b.new_context(viewport={"width": 1440, "height": 900})
    ctx.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                        "sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    pg = ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + BUILT)
    pg.wait_for_timeout(900)

    # ══ 1 · the pair Islam reported ═════════════════════════════════════════
    print("\n── 1 · the eye and the × on a plan row (the reported fault)")
    go(pg, "mobile")
    open_pen(pg)
    try:
        p = pg.evaluate(PAIR)
    except Exception as e:
        p = {"missing": str(e)[:60]}
    ck("the pair is on the page at all (§94.2)", not p.get("missing"), p.get("missing"))
    if not p.get("missing"):
        print("          eye %s · × %s · %s apart · %d such rows"
              % (p["eye"], p["x"], p["dist"], p["pairs"]))
        ck("the × that removes a row is at least 24 × 24",
           p["x"][0] >= 24 and p["x"][1] >= 24, p["x"])
        ck("...and its centre is at least 24px from the eye's", p["dist"] >= 24, p["dist"])
        ck("...on more than one row, so this is the shape and not one row",
           p["pairs"] > 1, p["pairs"])

    # ══ 2 · the spacing rule, over five pages ═══════════════════════════════
    print("\n── 2 · every control, by the standard's own spacing test")
    pages = [("the plan, pen open", None, None, True),
             ("a unit's performance", "mobile", "perf", False),
             ("a unit's reporting", "mobile", "report", False),
             ("a function's projects", "fn:finance", None, False),
             ("the landing", "group", None, False)]
    seen, total = {}, 0
    for name, u, s, penned in pages:
        if u:
            go(pg, u, s)
        d = read(pg)
        total += d["count"]
        if d.get("threw"):
            ck("%s — measured" % name, False, d["threw"])
            continue
        for t in d["small"]:
            seen["%s.%s %sx%s" % (t["tag"], t["cls"], t["w"], t["h"])] = dict(t, where=name)
        print("          %-24s %3d controls, %d too close" % (name, d["count"], len(d["small"])))
    ck("enough controls were actually measured (§113.8)", total > 200, total)
    # THE ONE NAMED, PRINTED EXCEPTION (§313.34's shape). The drag handle is
    # 20×26 and sits INSIDE the rail row it moves, so its circle reaches that
    # row by construction. It is the same class of fault as the × and it is
    # NOT this round's to fix: widening it to 24 moves the handle column in
    # every sortable table in the product, which wants a picture first (rule
    # 1b). Named rather than filtered by shape, so anything else that clashes
    # still goes red — and printed on every run, or the cost disappears into
    # a green tick (§54.5).
    waived = {k: v for k, v in seen.items() if v["cls"].split()[:1] == ["grip"]}
    rest = {k: v for k, v in seen.items() if k not in waived}
    ck("no control's 24px circle reaches another target, the handle aside",
       not rest, list(rest.values())[:4])
    ck("...and the handle IS still the only one waived (§113.8)",
       len(waived) >= 1, len(waived))
    if waived:
        print("          waived, recorded not fixed: the drag handle — %d kind, 20×26"
              % len(waived))

    # ══ 3 · the edge of a box, both sides ═══════════════════════════════════
    print("\n── 3 · the edge of a box reads against what is on either side of it")
    go(pg, "mobile")
    open_pen(pg)
    d = read(pg)
    fields = [e for e in d["edges"]
              if e["tag"] in ("input", "select", "textarea") or "fld" in e["cls"]
              or "ssbtn" in e["cls"] or "monthbtn" in e["cls"] or "entry" in e["cls"]]
    ck("there are fields on this page to measure (§94.2)", len(fields) >= 10, len(fields))
    thin_in = [e for e in fields if e["inside"] < 3.0]
    thin_out = [e for e in fields if e["outside"] < 3.0]
    if fields:
        print("          %d fields · worst inside %.2f · worst against its ground %.2f"
              % (len(fields), min(e["inside"] for e in fields),
                 min(e["outside"] for e in fields)))
    ck("every field's edge reads 3:1 against the surface inside it",
       not thin_in, [(e["cls"], e["inside"], e["border"], e["insideHex"]) for e in thin_in[:3]])
    ck("...and 3:1 against the ground it sits on",
       not thin_out, [(e["cls"], e["outside"], e["border"], e["outsideHex"]) for e in thin_out[:3]])

    # ══ 4 · and it did not reach the gridlines ══════════════════════════════
    print("\n── 4 · the control: the hairline is still a hairline")
    tk = d.get("tokens") or {}
    ck("both tokens resolve — a typo would make the border an inherited colour",
       bool(tk.get("line")) and bool(tk.get("field")), tk)
    if tk.get("line") and tk.get("field"):
        print("          --line %s reads %.2f · --field-line %s reads %.2f"
              % (tk["line"], tk["lineOnSurface"], tk["field"], tk["fieldOnSurface"]))
        ck("...and they are NOT the same colour", tk["line"] != tk["field"], tk)
        ck("...the hairline is still quiet, under 3:1 (the fix did not sweep it)",
           tk["lineOnSurface"] < 3.0, tk)
    else:
        # §54.5: a check that quietly measures nothing reads exactly like one
        # that passed. On a build with no `--field-line` the two assertions
        # above have no subject, so they are SKIPPED and say so, under a
        # failure that already names the cause.
        print("     skip the two comparisons below need both tokens, and this "
              "build has %d of 2 — not measured"
              % (bool(tk.get("line")) + bool(tk.get("field"))))

    # ══ 5 · dark ════════════════════════════════════════════════════════════
    print("\n── 5 · and the same measurements in dark")
    pg.evaluate("()=>document.documentElement.setAttribute('data-theme','dark')")
    pg.wait_for_timeout(350)
    d2 = read(pg)
    f2 = [e for e in d2["edges"]
          if e["tag"] in ("input", "select", "textarea") or "fld" in e["cls"]
          or "ssbtn" in e["cls"] or "monthbtn" in e["cls"] or "entry" in e["cls"]]
    ck("there are fields to measure in dark too (§94.2)", len(f2) >= 10, len(f2))
    if f2:
        print("          %d fields · worst inside %.2f · worst against its ground %.2f"
              % (len(f2), min(e["inside"] for e in f2), min(e["outside"] for e in f2)))
    ck("every field's edge reads 3:1 inside, in dark",
       not [e for e in f2 if e["inside"] < 3.0],
       [(e["cls"], e["inside"]) for e in f2 if e["inside"] < 3.0][:3])
    ck("...and against its ground, in dark",
       not [e for e in f2 if e["outside"] < 3.0],
       [(e["cls"], e["outside"]) for e in f2 if e["outside"] < 3.0][:3])
    dark_rest = [t for t in d2["small"] if t["cls"].split()[:1] != ["grip"]]
    ck("no control's 24px circle reaches another target in dark, the handle aside",
       not dark_rest, dark_rest[:3])
    ck("no page errors", not errs, errs[:2])

    b.close()

print("\n  RECORDED, NOT FIXED — printed every run so neither disappears into a")
print("  green tick (§54.5), and both want a picture before they move (rule 1b):")
print("    · the DRAG HANDLE is 20×26 and sits inside the row it moves, so it")
print("      cannot satisfy the spacing rule. Waived by name in §2 and §5.")
print("    · BUTTONS bordered with --line (.eqcta, .segsw, .cbtns button,")
print("      .ustrip button, .qual button, the wizard's and the flow's) have")
print("      the same shortfall as the fields. Islam's picture was of FIELDS.")
print("\n" + ("all passed" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
