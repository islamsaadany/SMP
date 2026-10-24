"""ONE PILLAR LIST, SHOWN AS ONE OR AS TWO (§540) — THE PERMANENT CHECK.

Islam, 2026-10-15, authorising stage 3b (a): *"go ahead with a"*, under the
requirement he set for the whole of stage 3b: *"ok noting that nothing will
change for the users this is just a structural change"*.

scripts/test-pillar-split.js measures the RULE — which pillar lands in which
half, and that the two halves are a partition. This file measures the PAGES,
which is the half that requirement is actually about: the control the office
presses, the tab it adds, and the units it must leave alone.

What is asserted, both ends each time (§94.2):

  - THE CONTROL EXISTS WHERE THE PLAN DOES. One row beside "Plans in" in a
    unit's dialog, two options, named from the CLIENT'S OWN WORDS — the check
    renames the labels and reads the control again, because a control that
    hard-coded "Directions and Capabilities" would pass a test that only ever
    read the default vocabulary;

  - AND NOWHERE ELSE. A unit that plans in projects is not offered it: there
    are no pillars on screen to join or to split (§61);

  - IT STORES AN ABSENCE. Set apart writes `pillarSplit`; set back DELETES it,
    so the unit is byte for byte the unit it was (§50.6);

  - THE TAB FOLLOWS THE SETTING, NOT THE CONTENT. Six of the worked example's
    ten units hold a pillar marked Capability. Not one of them is offered a
    second Plan tab until it is set apart — which is the whole of *nothing
    changes for the users*, and is the assertion a build that split on the
    kind alone would fail;

  - THE TWO TABS DRAW A PARTITION OF ONE RAIL. Every pillar on exactly one of
    them, in the stored order, with the codes unchanged by the split;

  - A UNIT LEFT ALONE IS BYTE-IDENTICAL beside it, in the same run, or every
    presence assertion above would pass on a build that split everything.

THE STATE IS MADE (§255): no box in the worked example is set apart, so every
assertion here would pass on a build that lost the feature.

PROVED ABLE TO FAIL (§113.8), with what was counted rather than expected:
  · `boxHasHalf` ignoring the setting                   → 2 of 46 red
  · the option label written as a literal               → 2 of 46 red
  · the row drawn for a unit that plans in projects     → 1 of 46 red
  · both controls writing `false` instead of deleting   → 1 of 46 red
  · the unit's control alone writing `false`            → 1 of 46 red
The fourth and fifth are why §6b exists: §6 sets and clears the KEY, and a
handler that wrote `false` where it should delete satisfied every assertion
in it. §6b presses the control.

Every probe degrades (§215). SMP_BUILT points it at another build (§276).
"""
import os, sys, json
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or os.path.join(
    os.path.dirname(__file__), "..", "strategy-management-platform.html")
URL = "file://" + os.path.abspath(BUILT)
CHROME = os.environ.get("SMP_CHROME") or "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"

good = bad = 0
def ck(w, ok, x=""):
    global good, bad
    if ok: good += 1
    else: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — %s" % (x,)) if not ok and x != "" else ""))

def ev(pg, js, dflt=None):
    try:
        return pg.evaluate(js)
    except Exception as e:
        return dflt if dflt is not None else {"err": str(e)[:160]}

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME)
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_timeout(1300)

    print("§0  which units hold both kinds, read off the worked example")
    mixed = ev(pg, """() => UNIT_KEYS.filter(k =>
        (UNITS[k].items || []).some(p => SMPRules.pillarIsCap(p)) &&
        (UNITS[k].items || []).some(p => !SMPRules.pillarIsCap(p)))""")
    ck("the worked example has units carrying both kinds", isinstance(mixed, list) and len(mixed) >= 2, mixed)
    SPL = mixed[0] if mixed else "mobile"      # the one that will be set apart
    CTL = mixed[1] if len(mixed or []) > 1 else "mobile"   # measured beside it, never set

    print("§1  the control, before anything is set")
    c0 = ev(pg, """() => { var h = ROWDLG_SPECS.units.body(UNITS['%s'], '%s');
        return { row: /data-usplit="%s"/.test(h),
                 opts: (h.match(/data-usplit="%s"[\\s\\S]*?<\\/select>/) || [''])[0]
                         .split('<option').slice(1).map(s => (s.match(/>([^<]*)</) || ['',''])[1]),
                 sel: /data-usplit="%s"[\\s\\S]*?value="one" selected/.test(h) }; }"""
        % (SPL, SPL, SPL, SPL, SPL))
    ck("a pillars unit's dialog carries the row", c0.get("row") is True, c0)
    ck("it offers exactly two answers", len(c0.get("opts") or []) == 2, c0.get("opts"))
    ck("and opens on One list, which is what the unit reads today", c0.get("sel") is True, c0)
    ck("the second is named from the client's own words",
       (c0.get("opts") or ["", ""])[1] == ev(pg, '() => L("pillar","bu") + " and " + L("capability","bu") + " apart"'),
       c0.get("opts"))
    # The same control after the client renames both words: a label built from
    # a literal would read the same either way, so this is the assertion that
    # the control takes the box's OWN words rather than the platform's.
    ren = ev(pg, """() => { var set = (k, w) => { var e = LABELS.entries.filter(x => x.key === k)[0];
          if (e) { e.__was = e.bu; e.bu = w; } };
        set('pillar', 'Thrusts'); set('capability', 'Muscles');
        var h = ROWDLG_SPECS.units.body(UNITS['%s'], '%s');
        return (h.match(/data-usplit="%s"[\\s\\S]*?<\\/select>/) || [''])[0]
                 .split('<option').slice(1).map(s => (s.match(/>([^<]*)</) || ['',''])[1]); }"""
        % (SPL, SPL, SPL))
    ck("renamed, the control reads the client's new words", ren == ["One list", "Thrusts and Muscles apart"], ren)
    ck("the rename really reached the labels (§94.2: or the line above proves nothing)",
       ev(pg, '() => L("pillar","bu") + "/" + L("capability","bu")') == "Thrusts/Muscles",
       ev(pg, '() => L("pillar","bu") + "/" + L("capability","bu")'))
    ev(pg, """() => { LABELS.entries.forEach(e => { if ('__was' in e) { e.bu = e.__was; delete e.__was; } });
        return true; }""")
    ck("and the words are put back", ev(pg, '() => L("pillar","bu")') == "Pillars",
       ev(pg, '() => L("pillar","bu")'))

    print("§2  and nowhere there are no pillars to split")
    norow = ev(pg, """() => { UNITS['%s'].format = 'projects';
        var h = ROWDLG_SPECS.units.body(UNITS['%s'], '%s');
        delete UNITS['%s'].format;
        var back = ROWDLG_SPECS.units.body(UNITS['%s'], '%s');
        return { projects: /data-usplit/.test(h), pillars: /data-usplit/.test(back) }; }"""
        % (SPL, SPL, SPL, SPL, SPL, SPL))
    ck("a projects unit is not offered it", norow.get("projects") is False, norow)
    ck("and the row is back the moment it plans in pillars again", norow.get("pillars") is True, norow)

    print("§3  the tab follows the SETTING, never the content")
    before = ev(pg, """() => { var o = {};
        UNIT_KEYS.forEach(k => { o[k] = SUBS.unit[0].sections(UNITS[k])
            .filter(s => !s.when || s.when(k)).map(s => s.k); });
        return o; }""")
    withcap = [k for k, v in (before or {}).items() if "plancap" in v]
    ck("not one of the " + str(len(mixed or [])) + " units holding an internal pillar has a second Plan tab",
       withcap == [], withcap)
    ck("and every one of them does have its one Plan tab",
       all("plan" in (before or {}).get(k, []) for k in (mixed or [])), before)

    print("§4  set apart, and only that unit moves")
    ctl0 = ev(pg, "() => JSON.stringify(UNITS['%s'])" % CTL)
    after = ev(pg, """() => { UNITS['%s'][SMPRules.PILLAR_SPLIT] = true;
        var o = {};
        UNIT_KEYS.forEach(k => { o[k] = SUBS.unit[0].sections(UNITS[k])
            .filter(s => !s.when || s.when(k)).map(s => s.k); });
        return o; }""" % SPL)
    ck("the unit set apart gains the second Plan tab", "plancap" in (after or {}).get(SPL, []), (after or {}).get(SPL))
    moved = [k for k in (after or {}) if (after[k] != (before or {}).get(k)) and k != SPL]
    ck("and not one other unit's tabs changed", moved == [], moved)
    ck("the unit measured beside it is byte-identical",
       ev(pg, "() => JSON.stringify(UNITS['%s'])" % CTL) == ctl0, "changed")
    lbl = ev(pg, """() => SUBS.unit[0].sections(UNITS['%s'])
        .filter(s => s.k === 'plancap').map(s => s.label)[0]""" % SPL)
    ck("the new tab wears the client's word for a capability",
       lbl == ev(pg, '() => L("capability")'), lbl)

    print("§5  the two tabs are a partition of the one rail")
    halves = ev(pg, """() => { var u = UNITS['%s'];
        var ids = h => { CURSEC.strategy = h; var html = drawHalf(h === 'plancap' ? 'cap' : 'dir',
            function(){ return renderUnitPlan(u); });
            return (html.match(/data-urail="[^|]*\\|([^"]*)"/g) || [])
                     .map(s => s.replace(/.*\\|/, '').replace('"', '')); };
        return { dir: ids('plan'), cap: ids('plancap'),
                 all: u.items.map(p => p.id || p.code),
                 kinds: u.items.map(p => SMPRules.pillarIsCap(p)) }; }""" % SPL)
    d, c, allp = halves.get("dir") or [], halves.get("cap") or [], halves.get("all") or []
    ck("both tabs draw something, so neither assertion below is vacuous", len(d) > 0 and len(c) > 0, halves)
    ck("between them they draw every pillar, none twice", sorted(d + c) == sorted(allp), halves)
    ck("the internal tab draws exactly the pillars marked Capability",
       c == [allp[i] for i in range(len(allp)) if (halves.get("kinds") or [])[i]], halves)
    ck("and each tab keeps the order the one list stores",
       d == [x for x in allp if x in d] and c == [x for x in allp if x in c], halves)
    codes = ev(pg, """() => { var u = UNITS['%s'];
        var seen = h => { var html = drawHalf(h, function(){ return renderUnitPlan(u); });
          return (html.match(/class="rcode">[^<]*/g) || []).map(s => s.slice(13)); };
        return { joined: (delete u[SMPRules.PILLAR_SPLIT], seen('')),
                 dir: (u[SMPRules.PILLAR_SPLIT] = true, seen('dir')), cap: seen('cap') }; }""" % SPL)
    ck("the split renumbers nothing — every code is the code it was joined",
       sorted((codes.get("dir") or []) + (codes.get("cap") or [])) == sorted(codes.get("joined") or []), codes)

    print("§6  the setting is stored as an absence")
    rt = ev(pg, """() => { var u = UNITS['%s'];
        var set = SMPRules.PILLAR_SPLIT in u;
        delete u[SMPRules.PILLAR_SPLIT];
        return { set: set, cleared: SMPRules.PILLAR_SPLIT in u,
                 split: SMPRules.pillarsSplit(u) }; }""" % SPL)
    ck("set apart, the key is on the unit", rt.get("set") is True, rt)
    ck("set back, the key is GONE rather than false", rt.get("cleared") is False, rt)
    ck("and the unit reads as one list again", rt.get("split") is False, rt)
    endtabs = ev(pg, """() => SUBS.unit[0].sections(UNITS['%s'])
        .filter(s => !s.when || s.when('%s')).map(s => s.k)""" % (SPL, SPL))
    ck("the second tab is gone with it", "plancap" not in (endtabs or []), endtabs)
    ck("and the unit is the unit it started as",
       endtabs == (before or {}).get(SPL), [(before or {}).get(SPL), endtabs])

    print("§6b  and the unit's control is driven, not just its key")
    # §6 above sets and clears the KEY; this presses the CONTROL, because the
    # two can disagree — a handler writing `false` where it should delete
    # satisfies every assertion in §6 and leaves a key on a unit that reads
    # as one list. Found by breaking exactly that.
    def press(sel):
        try: pg.click(sel, timeout=4000); pg.wait_for_timeout(250); return True
        except Exception: return False
    opened = (press('[data-md="setup"]') and press('.setuprail [data-setupgo="units"]'))
    ck("the Business units page opens", opened)
    ck("and the unit's dialog with it",
       ev(pg, """() => { var b = document.querySelector('[data-umenu="%s"]'); if (!b) return false;
           b.click(); return true; }""" % SPL) is True and
       (pg.wait_for_timeout(300) or ev(pg, """() => { var d = document.querySelector('[data-rowdlg^="units|"]');
           if (!d) return false; d.click(); return true; }""") is True))
    pg.wait_for_timeout(400)
    sel0 = ev(pg, """() => { var s = document.querySelector('select[data-usplit="%s"]');
        return s ? { v: s.value, n: s.options.length } : null; }""" % SPL)
    ck("the control is on the dialog, opening on One list",
       (sel0 or {}).get("v") == "one" and (sel0 or {}).get("n") == 2, sel0)
    ev(pg, """() => { var s = document.querySelector('select[data-usplit="%s"]');
        s.value = 'split'; s.dispatchEvent(new Event('change')); return true; }""" % SPL)
    pg.wait_for_timeout(400)
    ck("pressing apart sets the unit apart",
       ev(pg, "() => SMPRules.pillarsSplit(UNITS['%s']) === true" % SPL) is True,
       ev(pg, "() => JSON.stringify(UNITS['%s'][SMPRules.PILLAR_SPLIT])" % SPL))
    ev(pg, """() => { var s = document.querySelector('select[data-usplit="%s"]');
        if (s) { s.value = 'one'; s.dispatchEvent(new Event('change')); } return true; }""" % SPL)
    pg.wait_for_timeout(400)
    ck("and pressing it back DELETES the key rather than writing false",
       ev(pg, "() => !(SMPRules.PILLAR_SPLIT in UNITS['%s'])" % SPL) is True,
       ev(pg, "() => JSON.stringify(UNITS['%s'][SMPRules.PILLAR_SPLIT])" % SPL))

    print("§7  the company carries the same row on the Structure step")
    co = ev(pg, """() => { var g = GROUP.structure && GROUP.structure.top;
        return { reader: typeof SMPRules.topSplit === 'function',
                 off: SMPRules.topSplit(GROUP),
                 on: (function(){ GROUP.structure = GROUP.structure || {};
                      GROUP.structure.top = GROUP.structure.top || {};
                      GROUP.structure.top.plan = GROUP.structure.top.plan || {};
                      GROUP.structure.top.plan.split = true;
                      var r = SMPRules.topSplit(GROUP) && SMPRules.pillarsSplit(topAsUnit());
                      delete GROUP.structure.top.plan.split; return r; })(),
                 back: SMPRules.topSplit(GROUP) }; }""")
    ck("the company has a reader of its own", co.get("reader") is True, co)
    ck("which reads One list while nothing is written", co.get("off") is False, co)
    ck("apart once the Structure step writes it, through topAsUnit()", co.get("on") is True, co)
    ck("and One list again when it is deleted", co.get("back") is False, co)
    # THE CONTROL ITSELF, on the page rather than in the source. The company's
    # plan starts OFF for a client that never saved a Structure (§428.2), so
    # the card is opened the way structure.py opens it and the plan switched
    # on first — the row is drawn only where there is a plan in pillars to
    # join or split, which is the same guard the unit's dialog applies.
    # §6b left a dialog open on the Business units page; close it first.
    press('[data-rowdlg-close]') or press('[data-rowdlg-cancel]')
    # §544: the Structure step is the shape screen now, and the top level's
    # card opens from the tree.
    opened = ((press('.setuprail [data-setupgo="start"]') or press('[data-setupgo="start"]')) and
              press('[data-setupgo="shape"]') and press('[data-shlvl="top"]'))
    ck("the shape screen's top level opens", opened)
    ck("with the company's plan off, no row is drawn",
       ev(pg, "() => !document.querySelector('[data-wztopsplit]')", None) is True)
    ck("switching the company's plan on", press('[data-stsec="top|plan"] button:nth-child(1)'))
    drawn = ev(pg, """() => { var s = document.querySelector('[data-wztopsplit]');
        return s ? { opts: [...s.options].map(o => o.textContent), sel: s.value,
                     label: (s.closest('.wzrt').querySelector('.wzsub') || {}).textContent } : null; }""")
    ck("the row is drawn beside Plans in", bool(drawn), drawn)
    ck("it offers two answers, in the client's own words",
       (drawn or {}).get("opts") == ["One list",
         ev(pg, '() => L("pillar","bu")') + " and " + ev(pg, '() => L("capability","bu")') + " apart"],
       (drawn or {}).get("opts"))
    ck("and opens on One list", (drawn or {}).get("sel") == "one", drawn)
    ck("its label is the client's word for a pillar",
       (drawn or {}).get("label") == ev(pg, '() => L("pillar","bu")') + " show as", drawn)
    ck("pressing apart", ev(pg, """() => { var s = document.querySelector('[data-wztopsplit]');
        s.value = 'split'; s.dispatchEvent(new Event('change')); return true; }""") is True)
    pg.wait_for_timeout(250)
    ck("writes the company's own key, and nothing else",
       ev(pg, "() => SMPRules.topSplit(GROUP) === true && SMPRules.pillarsSplit(topAsUnit()) === true") is True,
       ev(pg, "() => JSON.stringify((SMPRules.structureOf(GROUP) || {}).top)"))
    ck("setting it back deletes the key rather than writing false",
       ev(pg, """() => { var s = document.querySelector('[data-wztopsplit]');
           s.value = 'one'; s.dispatchEvent(new Event('change'));
           var t = (SMPRules.structureOf(GROUP) || {}).top || {};
           return !(t.plan && 'split' in t.plan) && SMPRules.topSplit(GROUP) === false; }""") is True,
       ev(pg, "() => JSON.stringify((SMPRules.structureOf(GROUP) || {}).top)"))

    ck("no page error", not errs, errs)
    b.close()

print("\n%d passed, %d failed" % (good, bad))
sys.exit(1 if bad else 0)
