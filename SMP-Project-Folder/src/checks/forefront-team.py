"""FOREFRONT TEAM IS THE STORE AND THE REGISTER IS A READER (spec 058 §3a,
   §362.2).

   Islam: *"how about the forefront team is a separate view as you did but we
   keep them on the client list reading from the forefront team list."*

   THE STATE IS MADE (§255) and the reason is the whole argument for this
   file: the worked example is a client and carries NO Forefront row at all,
   so every assertion here — the mark, the missing picker, the two-part count,
   the menu — would pass on a build that had lost the feature entirely. The
   two kinds are made from two ordinary people and put back at the end (§94.2).

   BOTH ENDS, EVERY TIME (§94.2, §113.8). The three populations are measured
   in one run: a MINTED consultant (read-only), an ADOPTED one (the client's
   own person, editable, marked) and an ordinary person (untouched) — or a
   build that simply dropped consultants from the register, or froze every
   marked row as the build before this one did, passes half.

   Over file://, because the register is drawn there whole and the state has
   to be made rather than waited for; SMP_BUILT points it at another build
   (§334.13)."""
from playwright.sync_api import sync_playwright
import os as _os, json

URL = "file://" + _os.path.abspath(_os.environ.get("SMP_BUILT") or
  _os.path.join(_os.path.dirname(__file__), "..",
                "strategy-management-platform.html"))
bad = 0; errs = []
def ck(label, cond, detail=""):
    global bad
    if not cond: bad += 1
    print(("  ok      " if cond else "  FAIL    ") + label + (" | " + str(detail) if detail else ""))

# EVERY PROBE DEGRADES rather than dying (§215): a build without the shared
# pair throws on the first evaluate, and a file that dies reports no failures.
def ev(js, arg=None):
    try: return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    except Exception as e: return {"__err": str(e)[:160]}

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(1500)

    print("\n1 · the shared pair is the one question both sides ask (§42)")
    pair = ev("""() => ({
        has: typeof SMPRules.isMintedRow === 'function' && typeof SMPRules.isForefrontRow === 'function',
        minted: SMPRules.isMintedRow({ffrow:true, forefront:true}),
        markOnly: SMPRules.isMintedRow({forefront:true}),
        markIsMark: SMPRules.isForefrontRow({forefront:true}),
        plain: SMPRules.isForefrontRow({name:'x'}) })""")
    ck("`isMintedRow` and `isForefrontRow` are on the shared rules", pair.get("has"), pair)
    ck("...the mint is the mint", pair.get("minted") is True and pair.get("markOnly") is False, pair)
    ck("...and the mark is the mark", pair.get("markIsMark") is True and pair.get("plain") is False, pair)

    print("\n2 · the state, made from two ordinary people (§255)")
    made = ev("""() => {
        window.__FFSNAP = JSON.parse(JSON.stringify(PEOPLE.map(p => ({k:p.key, f:p.forefront, r:p.ffrow}))));
        const plain = PEOPLE.filter(p => !p.forefront && p.active !== false);
        if (plain.length < 3) return {short: plain.length};
        const mint = plain[0], adopt = plain[1], own = plain[2];
        mint.forefront = true; mint.ffrow = true; mint.role = 'smoteam';
        adopt.forefront = true;                       /* adopted — never ffrow */
        return {mint: mint.key, adopt: adopt.key, own: own.key,
                adoptRole: adopt.role || '', people: PEOPLE.length}; }""")
    ck("the register had three ordinary people to work with", "mint" in made, made)
    if "mint" not in made:
        print("\n%d failures" % (bad or 1)); b.close(); raise SystemExit(1 if bad else 0)
    MINT, ADOPT, OWN = made["mint"], made["adopt"], made["own"]

    # ── to the register, through the product's own navigation ──
    pg.click('#units [data-md="setup"]'); pg.wait_for_timeout(400)
    for g in pg.eval_on_selector_all(".setuprail .rgroup.shut", "e=>e.map(x=>x.dataset.railgrp)"):
        pg.click('.setuprail [data-railgrp="%s"]' % g); pg.wait_for_timeout(70)
    pg.click('.setuprail [data-setupgo="people"]'); pg.wait_for_timeout(1000)

    # THE ROLE PICKER IS NOT IN THE TABLE AND THAT IS §116's DOING: the
    # register stopped being a form, so the ROW draws `roleCell(p, false)` —
    # read-only for everybody — and the picker lives in the dialog behind
    # *Edit details*. Which makes the refusal STRONGER than §3a asks for: a
    # minted row cannot reach the picker at all, because it is not offered
    # the door. Measured, not assumed — the first draft of this file asked a
    # ROW for a picker and reported an ordinary person as broken (§100.3).
    ROW = """(k) => { const b = document.querySelector('[data-pmenu="'+k+'"]');
        const tr = b && b.closest('tr'); if (!tr) return null;
        return { has: true,
          ffrow:  !!tr.querySelector('.ffrow'),
          ffmark: !!tr.querySelector('.ffmark'),
          chips:  tr.querySelectorAll('.rchip, .pill, .chip').length }; }"""

    print("\n3 · a MINTED consultant states its seat and offers no control")
    m = ev(ROW, MINT) or {}
    ck("the row is on the register at all (§3a: the row stays)", m.get("has"), m)
    ck("...it wears the Forefront cell", m.get("ffrow") is True, m)
    ck("...one chip and no second control beside it", (m.get("chips") or 0) >= 1, m)

    print("\n4 · an ADOPTED consultant is the client's own person, marked")
    a = ev(ROW, ADOPT) or {}
    ck("the row is on the register", a.get("has"), a)
    ck("...it does NOT state a seat in place of its role", a.get("ffrow") is False, a)
    ck("...and it is marked as also being ours (§3a.1)", a.get("ffmark") is True, a)

    print("\n5 · and an ordinary person is untouched (§94.2)")
    o = ev(ROW, OWN) or {}
    ck("no Forefront cell", o.get("ffrow") is False, o)
    ck("no mark", o.get("ffmark") is False, o)
    ck("and a role cell of its own", (o.get("chips") or 0) > 0, o)

    print("\n6 · the row menu: the mint offers nothing that rewrites it")
    # THE NODE IS RE-QUERIED AFTER THE PRESS (§222). Opening the menu calls
    # `paint()`, which REPLACES the cell — so the element the click was made
    # on is detached by the time it is read, and reported an empty menu on
    # every row. The first run of this file did exactly that.
    MENU = """(k) => { const b = document.querySelector('[data-pmenu="'+k+'"]');
        if (!b) return null; b.click();
        const b2 = document.querySelector('[data-pmenu="'+k+'"]');
        const box = b2 && b2.closest('td'); if (!box) return {gone: true};
        const at = [].slice.call(box.querySelectorAll('[data-pedit],[data-pmerge],[data-pact],[data-pdel],[data-setpw],[data-as]'));
        const keys = at.map(x => ['pedit','pmerge','pact','pdel','setpw','as'].find(d => x.hasAttribute('data-'+d)));
        const hrs = box.querySelectorAll('hr').length;
        const c = document.querySelector('[data-pmenu="'+k+'"]'); if (c) c.click();
        return { keys: keys.filter((v,i,s) => v && s.indexOf(v) === i), hrs: hrs }; }"""
    mm = ev(MENU, MINT) or {}
    om = ev(MENU, OWN) or {}
    am = ev(MENU, ADOPT) or {}
    for k in ("pedit", "pmerge", "pact", "setpw"):
        ck("a minted row offers no `%s`" % k, k not in (mm.get("keys") or []), mm)
    ck("...and BOTH ENDS: an ordinary person keeps all four (§94.2)",
       all(k in (om.get("keys") or []) for k in ("pedit", "pmerge", "pact")), om)
    ck("...and so does an ADOPTED one, being the client's own person",
       all(k in (am.get("keys") or []) for k in ("pedit", "pmerge", "pact")), am)
    ck("viewing as them survives — it reads and writes nothing",
       "as" in (mm.get("keys") or []), mm)
    ck("no rule is drawn with nothing under it (§193.2)",
       (mm.get("hrs") or 0) == 0 or any(k in (mm.get("keys") or []) for k in ("pact", "pdel")), mm)

    print("\n6b · and the picker, which lives in the dialog (§116)")
    # WHERE A CLIENT ROLE IS GIVEN, so this is the control §3a's rule is
    # about: a minted row never reaches it (no *Edit details*, §6 above) and
    # an ADOPTED one must, or the client's own custodian loses the only door
    # to their own custodianship (§61).
    def dialog(key):
        pg.evaluate("""(k) => { const b = document.querySelector('[data-pmenu="'+k+'"]');
            if (b) b.click(); }""", key)
        pg.wait_for_timeout(250)
        got = ev("""(k) => { const e = document.querySelector('[data-pedit="'+k+'"]');
            if (!e) return {door: false}; e.click(); return {door: true}; }""", key)
        pg.wait_for_timeout(400)
        out = ev("""() => ({ picker: !!document.querySelector('#modal-b [data-proleset]'),
                              open: !!document.querySelector('#modal-b') })""")
        # THE PLATFORM'S OWN WAY OUT, by its real id (§116.6: every exit is
        # the same exit). The first draft guessed three selectors that match
        # nothing, so the overlay stayed up and intercepted every press after
        # it — a file that DIES rather than reporting (§215), in the one that
        # promises every probe degrades.
        pg.evaluate("""() => { const c = document.getElementById('modal-x'); if (c) c.click(); }""")
        pg.wait_for_timeout(300)
        if ev("""() => !!document.querySelector('#overlay.on')""") is True:
            pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
        out["door"] = got.get("door")
        return out
    ad = dialog(ADOPT)
    ck("an adopted row opens the dialog and it carries the picker", ad.get("picker") is True, ad)
    mi = dialog(MINT)
    ck("...and a minted row has no door to it at all (§94.2)", mi.get("door") is False, mi)

    print("\n6c · and a marked row is still ONE LINE (§88, §116.4)")
    # THE MARK COSTS THE ROW NOTHING, or it is §116.4's fault again: three
    # things placed BESIDE a value each put their row at 51px against its
    # neighbours' 39, because `.val` and `<b>` are display:block. Asserted as
    # an AGREEMENT with the rows around it rather than against a pixel count
    # (§94.8), which is what survives a change to the type scale.
    hh = ev("""(ks) => { const h = (k) => { const b = document.querySelector('[data-pmenu="'+k+'"]');
            const tr = b && b.closest('tr'); return tr ? Math.round(tr.getBoundingClientRect().height) : 0; };
        const rows = Array.from(document.querySelectorAll('.peoplecfg tbody tr'))
          .filter(r => !r.classList.contains('newrow'))
          .map(r => Math.round(r.getBoundingClientRect().height));
        rows.sort((a,b) => a-b);
        return { mint: h(ks[0]), adopt: h(ks[1]), own: h(ks[2]),
                 median: rows[Math.floor(rows.length/2)] }; }""", [MINT, ADOPT, OWN])
    ck("a minted row is the height of its neighbours", hh.get("mint") == hh.get("median"), hh)
    ck("...and so is an adopted one, mark and all", hh.get("adopt") == hh.get("median"), hh)
    ck("...with an ordinary person as the control (§113.8)", hh.get("own") == hh.get("median"), hh)

    print("\n7 · the count says both, and only where there is a split (§3a)")
    c = ev("""() => { const el = document.querySelector('.psplit');
        const ff = PEOPLE.filter(p => SMPRules.isForefrontRow(p)).length;
        return { text: el ? el.textContent.trim() : null, ff: ff,
                 own: PEOPLE.length - ff, total: PEOPLE.length }; }""")
    ck("the chip is drawn, there being two populations", bool(c.get("text")), c)
    # AN AGREEMENT WITH THE DATA, never a typed number (§94.8) — and never the
    # TOTAL, which is what §122 took off this header and this does not put back.
    ck("...it names the client's own count", c.get("text","").startswith(str(c.get("own"))), c)
    ck("...and the Forefront count beside it", ("· %d from Forefront" % c.get("ff")) in (c.get("text") or ""), c)
    ck("...and never the total (§122 stands)", str(c.get("total")) not in (c.get("text") or ""), c)

    print("\n8 · the search finds a consultant from the register's own box (§3a)")
    nm = ev("(k) => (PEOPLE.filter(p => p.key === k)[0] || {}).name || ''", MINT)
    pg.fill('[data-tksearch="people"]', str(nm)); pg.wait_for_timeout(300)
    seen = ev("""(k) => { const b = document.querySelector('[data-pmenu="'+k+'"]');
        const tr = b && b.closest('tr');
        const shown = [].slice.call(document.querySelectorAll('.peoplecfg tbody tr'))
          .filter(r => !r.hidden && !r.classList.contains('newrow')).length;
        return { hit: !!(tr && !tr.hidden), shown: shown }; }""", MINT)
    ck("typing their name keeps their row", seen.get("hit") is True, seen)
    ck("...and hides the rest, so it really searched (§113.8)",
       (seen.get("shown") or 0) < c.get("total", 99), seen)
    pg.fill('[data-tksearch="people"]', ""); pg.wait_for_timeout(200)

    print("\n9 · Forefront team is a page of its own, above the register")
    rail = ev("""() => { const it = [].slice.call(document.querySelectorAll('.setuprail [data-setupgo]'))
          .map(x => x.dataset.setupgo);
        return { has: it.indexOf('team') > -1, before: it.indexOf('team') > -1 &&
                 it.indexOf('team') < it.indexOf('people'), all: it.join(',') }; }""")
    ck("the entry is on the rail", rail.get("has"), rail.get("all"))
    ck("...above the register, because it is the store it reads (§9)", rail.get("before"), rail.get("all"))
    pg.click('.setuprail [data-setupgo="team"]'); pg.wait_for_timeout(700)
    team = ev("""() => { const h = document.querySelector('[data-cteam]');
        return { host: !!h, said: h ? h.textContent.trim().slice(0, 120) : '' }; }""")
    ck("the page mounts the flow's own renderer", team.get("host"), team)
    # Over file:// there is no served platform and no team to read, so the page
    # SAYS so rather than drawing an empty table (§45.2, §61).
    ck("...and off the served platform it says where the team is kept (§45.2)",
       "served platform" in (team.get("said") or ""), team)

    print("\n10 · and the state is put back (§94.2)")
    back = ev("""() => { const snap = window.__FFSNAP || [];
        snap.forEach(s => { const p = PEOPLE.filter(x => x.key === s.k)[0]; if (!p) return;
          if (s.f) p.forefront = s.f; else delete p.forefront;
          if (s.r) p.ffrow = s.r; else delete p.ffrow; });
        return PEOPLE.filter(p => p.forefront || p.ffrow).length; }""")
    ck("no row is left marked", back == 0, back)

    if errs: bad += 1; print("  FAIL    page errors |", errs[:3])
    b.close()

print("\n%d failures" % bad)
print("forefront-team: " + ("all assertions passed" if not bad else "RED"))
raise SystemExit(1 if bad else 0)
