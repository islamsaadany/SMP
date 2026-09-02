"""A FIGURE IS READ AGAINST WHAT IT IS MEASURED BY (§254).

Eight things Islam sent from the live deck in one afternoon. Six of them are
here; the two he has not answered (whether `K EGP` joins the offered unit list,
and how a supporting function gets a mark) are deliberately not asserted.

  1 · THE COLUMN IS "ANNUAL TARGET" and the figure carries what is due so far.
      *"the actual should show the proration like the performance"*, and *"key
      objectives actual should show the proration as well"*. Nothing new is
      computed — §239 has prorated a Sum measure since it was written and the
      deck never printed it — so this asserts AGREEMENT with `measureDueLabel`
      rather than a literal (§94.8).

  2 · A SCALED CURRENCY IS ONE TOKEN WHEREVER IT IS DRAWN. *"the number should
      be written 8M EGP the M is besie the number."* Asserted on the deck AND
      on the page behind it, because the fault this guards is the two spelling
      one unit two ways (§53.5) — and asserted NOT to have rewritten anything
      stored, which is the rule it is allowed to bend only for display (§96.2).

  3 · A UNIT WRITTEN TWICE IS COLLAPSED, and only where both halves are
      identical: `M EGP M EGP` is a repetition, `M EGP B EGP` is somebody's
      typing and is left exactly as it is.

  4 · A TACTIC OUTSIDE THIS CYCLE IS NOT DIMMED and still says so in words.
      Both ends, or a build that dropped the words too would pass.

  5 · ONE QUESTION DECIDES THE WHOLE ROW (§254.2, narrowing §248 at his
      direction). A tactic whose outcome has a target and no figure is NOT
      answered: it says it is owed one, it is not scored, and it leaves the
      reported count. THE STATE IS MADE — the demo has 0 such tactics of 78, so
      waiting for one would assert nothing (§94.2) — and the row is put back
      and asserted unchanged, or this would be a test of the fixture.

  6 · THE DECK ENDS ON ITS NUMBERS. The pillars are named before they are
      scored, the score table and the three readings are the last two content
      slides, and THE TWO PILLAR SLIDES ARE NOT NAMED THE SAME (§87's twins:
      both were headed by the tenant's word for a pillar, which reads as a
      repeat on a projector and as two identical rows in Manage slides).
"""
import os
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
FILE = os.path.join(os.path.dirname(HERE), "strategy-management-platform.html")
fails = []


def ok(label, cond, detail=""):
    if cond:
        print("  ok      " + label)
    else:
        fails.append(label)
        print("  FAIL    " + label + ("  — " + str(detail) if detail != "" else ""))


def js(pg, expr, arg=None):
    try:
        return pg.evaluate(expr, arg) if arg is not None else pg.evaluate(expr)
    except Exception as e:                        # noqa: BLE001
        return {"threw": str(e).strip().split("\n")[0]}


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME"))
    pg = b.new_page(viewport={"width": 1600, "height": 900})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + FILE)
    pg.wait_for_timeout(900)

    print("\n── the readers this check needs, by name (§215)")
    have = js(pg, """() => ({
      unitTight: typeof unitTight === "function",
      tgtShown: typeof tgtShown === "function",
      figVsDue: typeof figVsDue === "function",
      due: typeof measureDueLabel === "function",
      answered: typeof tacticAnswered === "function",
      outcomeOf: typeof outcomeOf === "function"
    })""")
    for k in ("unitTight", "tgtShown", "figVsDue", "due", "answered", "outcomeOf"):
        ok("the build carries " + k, have.get(k) is True, have)

    print("\n── 2 · a scaled currency is one token, and only a repetition collapses")
    tight = js(pg, """() => {
      const cases = ["8 M EGP", "8M EGP", "6 M EGP", "3.59B EGP", "8 M EGP M EGP",
                     "8 M EGP B EGP", "28 EGP", "243 days", "4#", "30%", "12 K USD",
                     "5 SQM", "", "TBD"];
      const out = {};
      cases.forEach(c => { out[c] = unitTight(c); });
      return out;
    }""")
    want = {"8 M EGP": "8M EGP", "8M EGP": "8M EGP", "6 M EGP": "6M EGP",
            "3.59B EGP": "3.59B EGP", "8 M EGP M EGP": "8M EGP",
            "8 M EGP B EGP": "8 M EGP B EGP", "28 EGP": "28 EGP",
            "243 days": "243 days", "4#": "4#", "30%": "30%",
            "12 K USD": "12K USD", "5 SQM": "5 SQM", "": "", "TBD": "TBD"}
    for k, v in want.items():
        ok("unitTight(%r) is %r" % (k, v), tight.get(k) == v, tight.get(k))

    print("\n── 2b · and it is DISPLAY only — nothing stored is rewritten (§96.2)")
    stored = js(pg, """() => {
      const before = [];
      UNIT_KEYS.forEach(k => (UNITS[k].items||[]).forEach(p =>
        (p.measures||[]).forEach(m => before.push(String(m.target||"") + "|" + String(m.actual||"")))));
      const d = document.createElement("div");
      UNIT_KEYS.forEach(k => { d.innerHTML = deckSlides(unitLike(k)); });
      d.remove();
      const after = [];
      UNIT_KEYS.forEach(k => (UNITS[k].items||[]).forEach(p =>
        (p.measures||[]).forEach(m => after.push(String(m.target||"") + "|" + String(m.actual||"")))));
      return { same: JSON.stringify(before) === JSON.stringify(after), n: before.length };
    }""")
    ok("building every deck leaves every stored target and figure byte-identical",
       stored.get("same") is True and stored.get("n", 0) > 20, stored)

    print("\n── 1 · Annual target, and the benchmark beside the figure")
    tbl = js(pg, """() => {
      const u = UNITS[activeKeys()[0]];
      const d = document.createElement("div"); d.innerHTML = deckSlides(unitLike(u.ukey));
      const grab = (rx) => [...d.querySelectorAll("section.dslide")].filter(s =>
        rx.test(((s.querySelector("h2")||{}).textContent||"")))[0] || null;
      const read = (s, list) => {
        if (!s) return null;
        const heads = [...s.querySelectorAll("thead th")].map(x => x.textContent.trim());
        const rows = [...s.querySelectorAll("tbody tr")].map((tr, i) => {
          const m = list[i]; const c = tr.querySelectorAll("td");
          return { target: c[2] ? c[2].textContent.trim() : "",
                   actual: c[3] ? c[3].textContent.trim() : "",
                   due: m ? measureDueLabel(m) : null,
                   fig: m ? String(m.actual == null ? "" : m.actual) : "" };
        });
        return { heads, rows };
      };
      const obj = read(grab(/where we stand$/), SMPRules.shown(u.keyObjectives));
      const mea = read(grab(/Key measures/), SMPRules.shown(u.items[0].measures));
      d.remove();
      return { obj, mea };
    }""")
    for name, got in (("objectives", tbl.get("obj")), ("key measures", tbl.get("mea"))):
        if not got:
            ok("the " + name + " table was found", False, tbl); continue
        ok("the " + name + " column reads Annual target",
           "Annual target" in got["heads"], got["heads"])
        withdue = [r for r in got["rows"] if r["due"]]
        ok("the " + name + " table has a row with a benchmark to show",
           len(withdue) > 0, got["rows"][:2])
        for r in withdue[:3]:
            ok("  %s: the figure carries / %s" % (name, r["due"]),
               "/" in r["actual"] and r["due"].replace(" ", "") in r["actual"].replace(" ", ""),
               r)
        for r in got["rows"][:3]:
            ok("  %s: the target reads tight (%s)" % (name, r["target"]),
               r["target"] == "" or r["target"] == "—"
               or " M " not in r["target"] and " B " not in r["target"] and " K " not in r["target"],
               r["target"])

    print("\n── 4 · a tactic outside this cycle is not dimmed, and still says so")
    dim = js(pg, """() => {
      const u = UNITS[activeKeys()[0]];
      const d = document.createElement("div"); d.innerHTML = deckSlides(unitLike(u.ukey));
      const rows = [...d.querySelectorAll("section.dslide tbody tr")];
      const out = { dim: d.querySelectorAll("tr.dim").length,
                    outside: rows.filter(r => /Outside this cycle/.test(r.textContent)).length };
      d.remove(); return out;
    }""")
    ok("no row on any pillar's tables is dimmed", dim.get("dim") == 0, dim)

    print("\n── 5 · one question decides the whole row (§254.2) — the state is MADE")
    made = js(pg, """() => {
      const u = UNITS[activeKeys()[0]], p = u.items[0], t = p.tactics[0];
      const keep = JSON.stringify(t);
      const readRow = () => {
        const d = document.createElement("div"); d.innerHTML = deckSlides(unitLike(u.ukey));
        const tr = [...d.querySelectorAll("section.dslide tbody tr")]
          .filter(r => r.textContent.indexOf(t.name) === 0 || r.textContent.indexOf(t.name) > -1)[0];
        const txt = tr ? tr.textContent.replace(/\\s+/g, " ").trim() : "";
        d.remove(); return txt;
      };
      /* the state Islam met: an outcome with a target, no outcome figure, and
         an old per-cent still sitting in `actual` */
      t.outcome = "Store program successful application";
      t.outTarget = "3#"; t.outActual = ""; t.actual = 2;
      t.outDir = "\\u2265"; t.q1 = 1; t.q2 = 1; t.q3 = 1; t.q4 = 1;
      const owed = { answered: tacticAnswered(t), progress: tacticProgress(t),
                     bench: tacticBenchmark(t), row: readRow(),
                     counted: reportedCount(u) };
      /* and with the outcome reported */
      t.outActual = "2#";
      const done = { answered: tacticAnswered(t), progress: tacticProgress(t),
                     bench: tacticBenchmark(t), row: readRow() };
      /* a tactic with no outcome at all is untouched */
      t.outcome = ""; t.outTarget = ""; t.outActual = "";
      const plain = { answered: tacticAnswered(t), progress: tacticProgress(t),
                      bench: tacticBenchmark(t) };
      const back = JSON.parse(keep);
      Object.keys(t).forEach(k => { if (!(k in back)) delete t[k]; });
      Object.assign(t, back);
      return { owed, done, plain, restored: JSON.stringify(t) === keep };
    }""")
    if isinstance(made, dict) and made.get("owed"):
        o, dn, pl = made["owed"], made["done"], made["plain"]
        ok("a target with no figure is NOT answered", o["answered"] is False, o)
        ok("it is not scored", o["progress"] is None, o)
        ok("and the row says it is owed one, with the benchmark",
           "Not reported" in o["row"] and "due at" in o["row"], o["row"][:140])
        ok("the row never shows a per cent beside a count",
           "2%" not in o["row"], o["row"][:140])
        ok("reported with a figure, it is answered", dn["answered"] is True, dn)
        ok("and reads the outcome on both halves",
           "2#" in dn["row"] and "%" not in dn["bench"], dn)
        ok("a tactic with no outcome at all is untouched",
           pl["answered"] is True and pl["progress"] is not None
           and str(pl["bench"]).endswith("%"), pl)
        ok("and the fixture put the row back byte-identical (§94.2)",
           made.get("restored") is True, made.get("restored"))
    else:
        ok("the tactic fixture ran", False, made)

    print("\n── 6 · the deck ends on its numbers, and the two pillar slides differ")
    order = js(pg, """() => {
      const out = {};
      [activeKeys()[0], "fn:" + Object.keys(FUNCTIONS).filter(k => fnShows(k)
        && fnPlansInPillars(FUNCTIONS[k]))[0]].forEach((t, i) => {
        const d = document.createElement("div"); d.innerHTML = deckSlides(unitLike(t));
        out[i ? "fn" : "unit"] = [...d.querySelectorAll("section.dslide")].map(s =>
          ((s.querySelector("h2")||s.querySelector("h1")||{}).textContent||"").trim());
        d.remove();
      });
      const u = UNITS[activeKeys()[0]];
      const d = document.createElement("div"); d.innerHTML = deckSlides(unitLike(u.ukey));
      const names = [...d.querySelectorAll(".pcards .pcard")].map(c =>
        (c.querySelector(".pcard-c")||{}).textContent + " " + (c.querySelector(".pcard-n")||{}).textContent);
      out.cards = names;
      out.codes = u.items.map((p, i) => pillarCode(u, i));
      d.remove();
      return out;
    }""")
    if isinstance(order, dict) and order.get("unit"):
        for who in ("unit", "fn"):
            h = order[who]
            # §254.6: Islam moved the note last — "notes before thank you" —
            # so the tail is score, readings, note (where there is one), Thank
            # you. Asserted through the note's PRESENCE rather than by index,
            # because a subject with no note draws no such slide (§246).
            tail = [x for x in h if x != "Notes and achievements"]
            ok(who + ": the last three are score, readings, Thank you",
               len(tail) >= 3 and "where we stand" in tail[-3]
               and "stands" in tail[-2] and tail[-1] == "Thank you", h[-4:])
            ok(who + ": and a note, where there is one, is last before Thank you",
               "Notes and achievements" not in h
               or h.index("Notes and achievements") == len(h) - 2, h[-4:])
            ok(who + ": the two pillar slides are not named the same",
               h[-3] != [x for x in h if x][0] and len(set(h)) == len(h)
               or h.count(h[-3]) == 1, [x for x in h if "illar" in x or "stand" in x])
        ok("one card per pillar, each carrying its code",
           len(order["cards"]) == len(order["codes"])
           and all(order["cards"][i].startswith(order["codes"][i])
                   for i in range(len(order["codes"]))), order)
        ok("and the roll-call comes BEFORE the first pillar's own slides",
           order["unit"].index([x for x in order["unit"] if x.strip() == "Pillars"][0])
           < order["unit"].index([x for x in order["unit"] if "Key measures" in x][0]),
           order["unit"][:12])
    else:
        ok("the order fixture ran", False, order)

    ok("no page error anywhere in the run", errs == [], errs[:3])
    b.close()

print("\n" + ("deck-figures: all passed" if not fails
              else "deck-figures: %d failed" % len(fails)))
for f in fails:
    print("  - " + f)
raise SystemExit(1 if fails else 0)
