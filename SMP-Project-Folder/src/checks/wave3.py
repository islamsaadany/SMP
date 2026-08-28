"""FIVE VISUAL REFINEMENTS (§155): the landing strip, the captions, the
branding swatches, and one name column.

Each is a reading improvement rather than a repair, so each assertion is about
what a reader can now DO or SEE, never about a pixel (§94.8).

  1 THE LANDING ANSWERS "WHERE NEXT" — the group's first section carries one
    entry per business unit, worst first, each with its own score and each a
    link to that unit. Nothing new is computed: every figure must equal what
    the Business units section already shows for the same unit (§53.5 — a
    summary that can disagree with its own detail is worse than no summary).

  3 THE CAPTION EXPLAINER IS NOT SHOUTING — the noun keeps its capitals, the
    clause after the dash does not, and it is quieter than the noun. Asserted
    as a RELATIONSHIP so the palette may move.

  4 BRANDING TELLS THE TRUTH — an unset picker opens on the colour the
    platform is actually painting, never on a literal from another product.

  5 ONE NAME COLUMN BY DEFAULT — Full Name is off for a fresh viewer and
    still offered in the chooser; turning it on brings it back (both ends,
    §94.2 — a check that only looks for absence cannot see a column that can
    no longer be had).

Run: SMP_CHROME=... python3 qa-run.py checks/wave3.py
"""
import pathlib
from playwright.sync_api import sync_playwright

url = "file://" + str(pathlib.Path("strategy-management-platform.html").resolve())
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


def go_group(pg):
    el = pg.query_selector('#units [data-u="group"]')
    if el and el.is_visible():
        el.click(); pg.wait_for_timeout(450); return
    sm = pg.query_selector("#topsel > summary")
    if sm:
        sm.click(); pg.wait_for_timeout(220)
        g = pg.query_selector('#topsel [data-u="group"]')
        if g: g.click(); pg.wait_for_timeout(450)


def section(pg, word):
    for s in pg.query_selector_all("#secrow-in button"):
        if word.lower() in (s.text_content() or "").strip().lower():
            s.click(); pg.wait_for_timeout(450); return True
    return False


def setup_page(pg, name):
    for bt in pg.query_selector_all("button"):
        t = ((bt.get_attribute("title") or "") + " " + (bt.text_content() or "")).lower()
        if "setup" in t and bt.is_visible():
            bt.click(); pg.wait_for_timeout(500); break
    for g in pg.query_selector_all(".rgroup > summary, .rhead2"):
        try:
            if g.is_visible(): g.click(); pg.wait_for_timeout(40)
        except Exception: pass
    for it in pg.query_selector_all(".ritem, [data-cfg]"):
        if name.lower() in (it.text_content() or "").strip().lower() and it.is_visible():
            it.click(); pg.wait_for_timeout(500); return True
    return False


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(url)
    pg.wait_for_timeout(800)
    who = pg.eval_on_selector_all("#asWho option", "els=>els.map(e=>e.value)")
    pg.select_option("#asWho", who[0])
    pg.wait_for_timeout(300)

    print("— 1 · the landing strip —")
    go_group(pg)
    strip = pg.evaluate("""() => {
      var s = document.querySelector('#panel .ustrip');
      if (!s) return {none: true};
      var items = [...s.querySelectorAll('[data-go]')].map(function(a){
        return {key: a.dataset.go, name: (a.querySelector('.un')||{}).textContent,
                val: parseInt(((a.querySelector('.uv')||{}).textContent||'').replace('%',''),10)};
      });
      return {n: items.length, items: items,
              ordered: items.every(function(x,i){ return i===0 || items[i-1].val <= x.val; })};
    }""")
    ck("the strip is on the landing section", not strip.get("none"), strip)
    ck("it carries every business unit", strip.get("n", 0) >= 9, strip.get("n"))
    ck("worst first", strip.get("ordered"), [i["val"] for i in strip.get("items", [])])
    ck("every entry is a real destination",
       all(i["key"] for i in strip.get("items", [])),
       [i for i in strip.get("items", []) if not i["key"]][:2])

    # The figures must equal the detail section's own — a summary that can
    # disagree with the page it summarises is worse than no summary.
    section(pg, "business units")
    detail = pg.evaluate("""() => {
      var out = {};
      document.querySelectorAll('#panel .gcard').forEach(function(c){
        var n=c.querySelector('.gname'), g=c.querySelector('.gauge');
        if(!n||!g) return;
        var m=(g.textContent||'').trim().match(/\\d+/);
        if(m) out[n.textContent.trim()] = parseInt(m[0],10);
      });
      return out;
    }""")
    mismatch = [i for i in strip.get("items", [])
                if i["name"] in detail and detail[i["name"]] != i["val"]]
    ck("every figure equals the Business units section's own", not mismatch, mismatch[:3])
    ck("the detail section still carries its cards", len(detail) >= 9, len(detail))

    # Pressing one goes there.
    section(pg, "overall")
    first = pg.query_selector("#panel .ustrip [data-go]")
    if first:
        key = first.get_attribute("data-go")
        first.click(); pg.wait_for_timeout(500)
        now = pg.evaluate("document.querySelector('#units [aria-selected=\\'true\\'][data-u]')?.dataset.u")
        ck("pressing an entry opens that unit", now == key, (key, now))
    else:
        ck("there is an entry to press", False)

    print("— 2 · the sentences under the numbers (§156) —")
    go_group(pg)
    cards = pg.evaluate("""() => [...document.querySelectorAll('#panel .scores .card')].map(function(c){
      var big=c.querySelector('.big'), sub=c.querySelector('p.sub');
      return {head:((c.querySelector('.score-h')||{}).textContent||'').trim(),
              val: big ? parseInt((big.textContent||'').replace(/[^0-9-].*$/,''),10) : null,
              sub: sub ? (sub.textContent||'').trim() : '',
              deltaInBig: !!(big && big.querySelector('.delta')),
              deltaInHead: !!(c.querySelector('.score-h .delta')),
              lines: sub ? sub.getClientRects().length : 0};
    })""")
    ck("the three cards are there", len(cards) >= 3, len(cards))
    ck("no sentence lists the unit weights",
       not any("/" in c["sub"] and c["sub"].count("/") > 3 for c in cards),
       [c["sub"][:60] for c in cards if c["sub"].count("/") > 3])
    ck("no sentence says 'variance'",
       not any("variance" in c["sub"].lower() for c in cards),
       [c["sub"][:60] for c in cards if "variance" in c["sub"].lower()])
    # THE ONE THAT MATTERS: the words under a ratio must agree with the ratio.
    ratio = [c for c in cards if "execution" in c["head"].lower()]
    ck("the execution card is found", bool(ratio), [c["head"][:40] for c in cards])
    if ratio:
        c = ratio[0]
        v, sub = c["val"], c["sub"].lower()
        want = ("ahead of plan" if v > 100 else "behind plan" if v < 100 else "exactly on plan")
        ck("its verdict agrees with its own number", want in sub, (v, c["sub"]))
    ck("the delta sits with its number, not in the heading",
       any(c["deltaInBig"] for c in cards) and not any(c["deltaInHead"] for c in cards),
       [(c["deltaInBig"], c["deltaInHead"]) for c in cards])
    rank = pg.evaluate("""() => {
      var r=document.querySelector('.score-h .rank'), p=document.querySelector('.score-h .pill');
      if(!r||!p) return {none:true};
      var rc=getComputedStyle(r), pc=getComputedStyle(p);
      return {rankInk:rc.color, rankBorder:rc.borderTopColor,
              pillInk:pc.color, gold:getComputedStyle(document.documentElement).getPropertyValue('--gold').trim()};
    }""")
    ck("the primary chip is quieter than the status pill beside it",
       rank.get("none") or rank.get("rankInk") != rank.get("pillInk"), rank)

    print("— 3 · the caption explainer —")
    pg.query_selector('#units [data-u="mobile"]').click()
    pg.wait_for_timeout(500)
    caps = pg.evaluate("""() => {
      var out = [];
      document.querySelectorAll('#panel h4.mini').forEach(function(h){
        var em = h.querySelector('em');
        if (!em) return;
        var hc = getComputedStyle(h), ec = getComputedStyle(em);
        out.push({noun: hc.textTransform, clause: ec.textTransform,
                  italic: ec.fontStyle,
                  nounWeight: parseInt(hc.fontWeight,10) || 400,
                  clauseWeight: parseInt(ec.fontWeight,10) || 400,
                  nounSpace: hc.letterSpacing, clauseSpace: ec.letterSpacing,
                  text: (em.textContent||'').trim().slice(0,40)});
      });
      return out;
    }""")
    ck("captions with an explainer exist", len(caps) > 0, len(caps))
    ck("the noun still shouts", all(c["noun"] == "uppercase" for c in caps),
       [c for c in caps if c["noun"] != "uppercase"][:1])
    ck("the clause does not", all(c["clause"] == "none" for c in caps),
       [c["text"] for c in caps if c["clause"] != "none"][:2])
    ck("the clause is not italic", all(c["italic"] == "normal" for c in caps),
       [c["text"] for c in caps if c["italic"] != "normal"][:2])
    # QUIETER IN FORM, NOT IN COLOUR. The noun is already the page's quiet ink;
    # what separates the two is that one is a LABEL (upper, bold, spaced) and
    # the other a SENTENCE. Asserting a colour difference would have forced the
    # explanation fainter than the quietest ink the product has (§38.5's trap
    # from the other side).
    ck("the clause is lighter than the noun it explains",
       all(c["clauseWeight"] < c["nounWeight"] for c in caps),
       [(c["nounWeight"], c["clauseWeight"]) for c in caps][:2])
    ck("and it drops the label's letter-spacing",
       all(c["clauseSpace"] in ("normal", "0px") for c in caps),
       [c["clauseSpace"] for c in caps][:2])

    print("— 4 · the branding swatches —")
    setup_page(pg, "branding")
    sw = pg.evaluate("""() => {
      function hex(v){ v=v.trim(); if(v[0]==='#') return v.toLowerCase();
        var m=v.match(/\\d+/g);
        return m? '#'+m.slice(0,3).map(function(x){return ('0'+(+x).toString(16)).slice(-2)}).join('') : v; }
      var cs=getComputedStyle(document.documentElement);
      var want={accent:hex(cs.getPropertyValue('--gold')), bar:hex(cs.getPropertyValue('--panel'))};
      return [...document.querySelectorAll('input.brandcolor')].map(function(i){
        return {k:i.getAttribute('data-brand'), val:i.value.toLowerCase(), want:want[i.getAttribute('data-brand')]};
      });
    }""")
    ck("both pickers are on the page", len(sw) >= 2, sw)
    ck("no picker opens on a colour the platform never paints",
       all(s["val"] != "#4f46e5" for s in sw), sw)
    ck("each opens on what the platform is actually painting",
       all(s["want"] is None or s["val"] == s["want"] for s in sw), sw)

    print("— 5 · one name column by default —")
    setup_page(pg, "people register")
    cols = pg.evaluate("""() => [...document.querySelectorAll('.peoplecfg thead th')]
      .map(function(t){ return (t.textContent||'').trim(); })""")
    ck("the register is on screen", len(cols) > 4, cols[:4])
    ck("Full Name is not a default column",
       not any(c.lower() == "full name" for c in cols), cols)
    ck("Name still is", any(c.lower() == "name" for c in cols), cols)
    # ...and it can still be had (§94.2: the other end).
    btn = pg.query_selector("[data-colmenu]")
    if btn:
        btn.click(); pg.wait_for_timeout(400)
    offered = pg.evaluate("""() => {
      var cb=document.querySelector('input[data-col="fullname"]');
      if(!cb) return {missing:true};
      if(cb.checked) return {alreadyOn:true};
      cb.click();
      return {clicked:true};
    }""")
    pg.wait_for_timeout(500)
    if offered.get("clicked"):
        back = pg.evaluate("""() => [...document.querySelectorAll('.peoplecfg thead th')]
          .some(function(t){ return /full name/i.test(t.textContent||''); })""")
        ck("turning it on in Columns brings it back", back, offered)
    else:
        ck("Full Name is still offered in the Columns chooser", False, offered)

    ck("no page errors while driving", not errs, errs[:2])
    b.close()

print("wave3: %s" % ("OK" if bad == 0 else "%d FAILURES" % bad))
raise SystemExit(1 if bad else 0)
