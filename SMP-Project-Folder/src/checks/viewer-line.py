"""WHO YOU ARE VIEWING AS — THE ROLES, AND WHERE EACH IS HELD (§178).

Islam, of a project owner's chrome reading PROJECT OWNER · ALL UNITS:
*"correct it it should follow the roles and the unit he belongs to."*

The line had its own private answer to "where does this person sit" — it read
`p.unit` and nothing else — while the DROPDOWN beside it asked `personAt()`
and `placeLabel()` and got it right (§142). Two controls on one row answering
one question two ways (§53.5).

WHAT IS ASSERTED, and why each is here:

· NOBODY READS AN EM-DASH. The old line said one for every supporting-function
  person and both company CEOs, so this is asserted of EVERY active person on
  the register rather than of a sample — the fault was invisible on the nine
  people nobody thought to switch to.

· THE LINE AGREES WITH `personRoles()`. Every role the rule mints is named,
  and no role that it does not mint appears. Asserted as an AGREEMENT with the
  shared rule (§53.5, §94.8), never against a literal string, so renaming a
  role or a unit keeps this green.

· A PLACE THAT DIFFERS FROM THE SEAT IS NAMED, AND ONE THAT MATCHES IS NOT.
  Both ends (§94.2): a check that only proved places appear would pass on a
  build that printed every place twice, and one that only proved they are
  absent would pass on a build that printed none.

· IT IS ONE LINE, AND THE WHOLE OF IT IS ON A HOVER. The strip clips with an
  ellipsis, and the half that gets cut is the place — so the title has to
  carry it (§88's shape).

PROVED ABLE TO FAIL (§94.5): against the pre-§178 build it fails on the
em-dashes, on every role held away from the seat, and on the hover.
"""
import sys
from playwright.sync_api import sync_playwright

URL = "file:///home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html"
errs = []
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1600, "height": 1000})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    # §167.2: a returning viewer, or the welcome overlay covers the strip
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');"
                       "localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto(URL)
    pg.wait_for_timeout(1500)

    # THE LINE, HOWEVER THE BUILD MAKES IT. A build with no shared builder is
    # measured by what it PUTS ON THE STRIP, so every assertion below still
    # runs and still reports (§94.8: assert the problem, not the
    # implementation; §54.5: name what is unmeasured, never stop at it).
    pg.evaluate("""() => {
      window.__line = function(p){
        if (typeof viewerRoleLine === "function") return viewerRoleLine(p);
        var keep = VIEWER; VIEWER = p.key; paint();
        var t = document.getElementById("viewerNote").textContent.trim();
        VIEWER = keep; paint();
        return t;
      };
    }""")
    ck("the line has one builder rather than a copy in the shell",
       pg.evaluate("() => typeof viewerRoleLine === 'function'"))

    # ── 1 · NOBODY BELONGS NOWHERE ───────────────────────────────────────
    print("\n1 · every person on the register reads as something")
    rows = pg.evaluate("""() => PEOPLE.filter(personActive).map(p => ({
      key: p.key,
      seat: placeLabel(personAt(p)),
      line: window.__line(p),
      roles: SMPRules.personRoles(world(), p).map(r => ({
        name: roleName(r.role), at: placeLabel(r.at) }))
    }))""")
    ck("there is a register to measure", len(rows) > 10, len(rows))
    dashes = [r["key"] for r in rows if "—" in r["line"]]
    ck("nobody's line contains an em-dash", not dashes, dashes)
    empty = [r["key"] for r in rows if not r["line"].strip()]
    ck("nobody's line is empty", not empty, empty)
    noroles = [r for r in rows if not r["roles"]]
    ck("somebody holding nothing says so",
       all(r["line"] == "No role" for r in noroles),
       [r["line"] for r in noroles])

    # ── 2 · IT AGREES WITH THE RULE THAT MINTS THE ROLES ─────────────────
    print("\n2 · the line says the roles the shared rule mints, and no others")
    missing, extra = [], []
    for r in rows:
        names = sorted(set(x["name"] for x in r["roles"]))
        for n in names:
            if n not in r["line"]:
                missing.append(r["key"] + " lacks " + n)
        # a role nobody holds must not appear
        for n in set(x for x in ["Super user", "Group CEO", "Company CEO", "BU owner",
                                 "Strategy custodian", "Function head", "Project owner",
                                 "Pillar owner"]) - set(names):
            if n in r["line"]:
                extra.append(r["key"] + " claims " + n)
    ck("every role the rule mints is on the line", not missing, missing[:4])
    ck("...and no role it does not", not extra, extra[:4])

    # ── 3 · THE PLACE IS NAMED WHERE IT DIFFERS, AND ONLY THERE ──────────
    print("\n3 · a place away from the seat is named; the seat itself is not")
    away_named, seat_repeated = [], []
    for r in rows:
        seat = r["seat"]
        byrole = {}
        for x in r["roles"]:
            byrole.setdefault(x["name"], set()).add(x["at"])
        for n, places in byrole.items():
            if places == {seat}:
                # the select beside it already said the seat
                if (n + ", " + seat) in r["line"]:
                    seat_repeated.append(r["key"] + " repeats " + seat + " for " + n)
            else:
                for pl in places:
                    if pl not in r["line"]:
                        away_named.append(r["key"] + " hides " + pl + " for " + n)
    ck("a role held away from the seat names where", not away_named, away_named[:4])
    ck("...and a role held only at the seat does not repeat it",
       not seat_repeated, seat_repeated[:4])
    # both ends: at least one of each case must EXIST on this register, or the
    # two assertions above are true of nothing (§113.8)
    cases_away = [r["key"] for r in rows
                  if any(x["at"] != r["seat"] for x in r["roles"])]
    cases_seat = [r["key"] for r in rows
                  if r["roles"] and all(x["at"] == r["seat"] for x in r["roles"])]
    ck("the register holds somebody with a role away from their seat",
       len(cases_away) > 0, cases_away[:3])
    ck("...and somebody whose roles are all where they sit",
       len(cases_seat) > 0, cases_seat[:3])

    # ── 4 · THE STRIP AND THE DROPDOWN TELL ONE STORY ────────────────────
    print("\n4 · the strip agrees with the control beside it")
    same = pg.evaluate("""() => {
      const p = PEOPLE.filter(personActive).filter(x => x.fn)[0]
             || PEOPLE.filter(personActive)[0];
      VIEWER = p.key; paint();
      const note = document.getElementById("viewerNote");
      const btn = document.querySelector(".viewer .sslabel") ||
                  document.querySelector("#asWho option:checked");
      return { who: p.key,
               select: (btn ? btn.textContent : "").trim(),
               note: note.textContent.trim(),
               title: (note.title || "").trim(),
               seat: placeLabel(personAt(p)) };
    }""")
    ck("the dropdown names the person's place", same["seat"] in same["select"], same)
    ck("the line is what the builder says",
       same["note"] == pg.evaluate("(k) => window.__line(personBy(k))", same["who"]), same)
    ck("the whole line is on a hover, because the strip clips it",
       same["title"] == same["note"] and same["title"] != "", same)

    # ── 5 · ONE LINE AT EVERY WIDTH (§27.1) ──────────────────────────────
    print("\n5 · one line, and never a sideways scroll")
    for w in (1920, 1600, 1440, 1280, 1100, 1000):
        pg.set_viewport_size({"width": w, "height": 900})
        pg.wait_for_timeout(250)
        r = pg.evaluate("""() => {
          let worst = null, wl = -1;
          PEOPLE.filter(personActive).forEach(p => {
            const t = window.__line(p);
            if (t.length > wl) { wl = t.length; worst = p.key; } });
          VIEWER = worst; paint();
          const n = document.getElementById("viewerNote");
          const cs = getComputedStyle(n);
          const lines = Math.round(n.getBoundingClientRect().height /
                                   parseFloat(cs.lineHeight || 16));
          return { lines: lines,
                   scrollX: document.documentElement.scrollWidth >
                            document.documentElement.clientWidth,
                   titled: !!n.title };
        }""")
        ck("%d: one line, no page scroll, hover intact" % w,
           r["lines"] == 1 and not r["scrollX"] and r["titled"], r)

print("")
if errs:
    print("PAGE ERRORS: " + " | ".join(errs[:4]))
print("%d failed" % bad if bad else "all good")
sys.exit(1 if bad or errs else 0)
