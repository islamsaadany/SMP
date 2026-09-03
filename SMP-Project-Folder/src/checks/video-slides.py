"""A VIDEO IN THE REVIEW (§261).

Islam: *"add to the presentation to be able to add a video to play inside the
presentation without overloading the data base"* — answered by keeping the clip
OUT of the state graph and a pointer in it.

WHAT THIS ASSERTS, AND WHAT IT DELIBERATELY CANNOT. Everything about the model,
the rule, the editor, the deck and the ceiling is driven here. The BYTES are
not: there is no blob store on this machine and none can be conjured, so the
upload's transfer is proved only as far as "it asks the server and reports
honestly when there is none". That limit is stated rather than papered over
(§3a) — a check that pretended otherwise would be the more dangerous artefact.

THE DEMO HAS NO VIDEOS, so every assertion here would pass on a build that lost
the feature entirely if it merely looked for what is on screen. The state is
MADE (§94.2), and every gate is asked at BOTH ends (§113.8: "the two ways in
are gone" is true of a build that draws nothing at all).

EVERY PROBE DEGRADES (§215). On a build without `SMPRules.videoLink` the first
evaluate throws, and a check that dies reports nothing — which `grep -c FAIL`
reads as zero, a falsification that looks like a pass. That is the build this
file most has to be able to see.

Run: python3 qa-run.py checks/video-slides.py
"""
import json, pathlib, re, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
FILE = ROOT / "SMP-Project-Folder/src/strategy-management-platform.html"
VERCEL = ROOT / "vercel.json"
RULES = ROOT / "lib/rules.js"
CHROME = "/opt/pw-browsers/chromium"
UNIT = "mobile"

ok = bad = 0
def check(what, cond, got=""):
    global ok, bad
    if cond:
        ok += 1
    else:
        bad += 1
        print("  FAIL  %s%s" % (what, ("  --  " + str(got)) if got != "" else ""))

THREW = "(the page threw)"
_said = set()
def ev(pg, expr, arg=None, default=None):
    """A throw becomes a value the assertions can fail on, reported once."""
    try:
        return pg.evaluate(expr) if arg is None else pg.evaluate(expr, arg)
    except Exception as e:
        msg = str(e).split("\n")[0]
        if msg not in _said:
            _said.add(msg)
            print("  (threw: %s)" % msg)
        return default

def get(d, k, default=None):
    return d.get(k, default) if isinstance(d, dict) else default


with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME,
                           args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1600, "height": 950})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + str(FILE))
    pg.wait_for_timeout(700)

    # ── 1. The rule, asked of the built page ────────────────────────────────
    # Not of lib/rules.js on disk: the platform inlines its own copy, and the
    # whole point of the shared module is that the two are the same answer.
    print("1. which links play, and which are honestly refused")
    kinds = ev(pg, """() => {
      const R = window.SMPRules;
      if (!R || !R.videoLink) return null;
      const at = (u, hosts) => R.videoLink(u, hosts || []).kind;
      return {
        yt:    at('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
        ytb:   at('youtu.be/dQw4w9WgXcQ'),
        vimeo: at('https://vimeo.com/123456789'),
        drive: at('https://drive.google.com/file/d/1AbC-dEf/view'),
        sp:    at('https://raya.sharepoint.com/:v:/s/x/Ab12'),
        file:  at('https://cdn.example.com/opening.mp4'),
        page:  at('https://example.com/some/page'),
        junk:  at('not a link'),
        js:    at('javascript:alert(1)'),
        own:   at('https://videos.raya.com/x', ['videos.raya.com']),
        evil:  at('https://evil-raya.com/x', ['raya.com']),
        play:  R.videoLink('https://vimeo.com/123456789', []).play
      };
    }""")
    if kinds is None:
        check("the platform carries SMPRules.videoLink", False, "absent")
    else:
        for key, want in [("yt", "embed"), ("ytb", "embed"), ("vimeo", "embed"),
                          ("drive", "embed"), ("sp", "embed"), ("file", "file"),
                          ("page", "away"), ("junk", ""), ("js", ""), ("own", "file")]:
            check("%s reads as %s" % (key, want or "not a link"),
                  get(kinds, key) == want, get(kinds, key))
        # The trap that would let somebody else's server play inside our page.
        check("evil-raya.com is NOT matched by an allowed raya.com",
              get(kinds, "evil") == "away", get(kinds, "evil"))
        # A share link is a PAGE: an embed that returned it unchanged would
        # play nothing at all, and every "kind" assertion above would still pass.
        check("a Vimeo link is rewritten to its player",
              "player.vimeo.com" in str(get(kinds, "play", "")), get(kinds, "play"))

    # ── 2. The policy names exactly the hosts the rule knows ────────────────
    # A list spelled twice is §234's fault, and here the second spelling is the
    # one that decides whether anything plays at all.
    print("2. the security policy and the rule agree about the hosts")
    csp = ""
    try:
        vj = json.loads(VERCEL.read_text())
        for block in vj.get("headers", []):
            for h in block.get("headers", []):
                if h.get("key") == "Content-Security-Policy":
                    csp = h.get("value", "")
    except Exception as e:
        print("  (could not read vercel.json: %s)" % e)
    frame = re.search(r"frame-src ([^;]+)", csp)
    frame_hosts = set((frame.group(1).split() if frame else []))
    want_hosts = ev(pg, "() => (window.SMPRules && window.SMPRules.VIDEO_EMBED_HOSTS) || null")
    check("the policy has a frame-src", bool(frame), csp[:60])
    if want_hosts:
        check("every host the rule embeds from is allowed by the policy",
              set(want_hosts) <= frame_hosts, sorted(set(want_hosts) - frame_hosts))
        check("the policy allows nothing the rule does not embed from",
              frame_hosts <= set(want_hosts), sorted(frame_hosts - set(want_hosts)))
    else:
        check("the rule names its embed hosts", False, "VIDEO_EMBED_HOSTS absent")
    check("media may come from the store", "media-src" in csp, csp[:60])
    # Wide-open is the one version Islam ruled against; it must not creep back.
    # ASSERTED OVER THE TOKENS, never as a substring — the first draft of this
    # tested `"frame-src https:" not in csp`, which is true of nothing and
    # false of every correct policy, because a named host STARTS with it.
    check("frame-src names hosts rather than admitting any",
          bool(frame_hosts) and not ({"https:", "*", "https://*"} & frame_hosts),
          sorted(frame_hosts))

    # ── 3. Manage slides: the switch, and both ends of it ───────────────────
    print("3. a slide becomes a video, and gives its pictures back")
    ev(pg, "() => slidesOpen('unit', %s)" % json.dumps(UNIT))
    pg.wait_for_timeout(700)
    check("Manage slides opened", bool(pg.query_selector("#slideroot.on")))
    ev(pg, "() => slidesAdd()")
    pg.wait_for_timeout(400)

    # A picture on it first, so "the pictures came back" is a real measurement
    # rather than two empty lists agreeing (§113.8).
    made = ev(pg, """() => {
      const list = pslidesFor(SLED.target);
      const sl = list[list.length - 1];
      sl.pics = [{ src:'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
                   cap:'a picture', z:1, x:50, y:50 }];
      SLED.sel = 'ps:' + sl.id;
      slidesPaint();
      return sl.id;
    }""")
    check("a picture slide was made", bool(made), made)

    def pane():
        return pg.eval_on_selector("#slidepane", "e => e.innerHTML") or ""

    before = pane()
    check("it starts as pictures", "data-vidfile" not in before and "picslot" in before)

    # Press the REAL switch (§70: a control in the document is not a control
    # anybody can reach).
    pg.query_selector('#slidepane [data-slkind][data-v="video"]').click()
    pg.wait_for_timeout(350)
    onvid = pane()
    check("the two ways in are drawn", "data-vidfile" in onvid and "data-vidlink" in onvid)
    check("the arrangement buttons are not asked about a video",
          "data-piclay" not in onvid)
    check("the slide is stored as a video",
          ev(pg, "() => pslideById(SLED.target, SLED.sel.slice(3)).kind") == "video")

    pg.query_selector('#slidepane [data-slkind][data-v="pics"]').click()
    pg.wait_for_timeout(350)
    backpic = ev(pg, """() => {
      const sl = pslideById(SLED.target, SLED.sel.slice(3));
      return { kind: sl.kind === undefined ? '(absent)' : sl.kind,
               pics: (sl.pics || []).length,
               cap: ((sl.pics || [])[0] || {}).cap || '' };
    }""")
    # §50.6: a slide that has never been a video and one switched back must be
    # the same bytes, or every save carries a difference the database never held.
    check("switching back DELETES the mark rather than writing 'pics'",
          get(backpic, "kind") == "(absent)", get(backpic, "kind"))
    check("the pictures came back untouched",
          get(backpic, "pics") == 1 and get(backpic, "cap") == "a picture", backpic)

    # ── 4. Pasting a link: the verdict is said at the desk ──────────────────
    print("4. the paste box says whether it will play, while they type")
    pg.query_selector('#slidepane [data-slkind][data-v="video"]').click()
    pg.wait_for_timeout(300)

    def paste(v):
        f = pg.query_selector("#slidepane [data-vidlink]")
        f.fill(v)
        pg.wait_for_timeout(200)
        el = pg.query_selector("#slidepane [data-vidsay]")
        return (el.inner_text().strip() if el else "", el.get_attribute("class") if el else "")

    say_ok, cls_ok = paste("https://vimeo.com/123456789")
    check("a playable link says so", "play on the slide" in say_ok.lower(), say_ok)
    check("...and is not dressed as a fault", "vno" not in (cls_ok or ""), cls_ok)
    say_away, cls_away = paste("https://example.com/a/page")
    check("a link that cannot play says it opens in a new tab",
          "new tab" in say_away.lower(), say_away)
    check("...and is a caution, not an alarm",
          "vwarn" in (cls_away or ""), cls_away)
    say_no, _ = paste("this is not a link")
    check("a non-address says so", "web address" in say_no.lower(), say_no)

    # Committing writes the COMPLETED address back into the box (§176, §124).
    f = pg.query_selector("#slidepane [data-vidlink]")
    f.fill("vimeo.com/987654321")
    f.dispatch_event("change")
    pg.wait_for_timeout(400)
    stored = ev(pg, """() => {
      const sl = pslideById(SLED.target, SLED.sel.slice(3));
      return sl && sl.vid ? sl.vid.url : null;
    }""")
    check("the link is stored with its scheme completed",
          stored == "https://vimeo.com/987654321", stored)

    # ── 5. The deck draws it, and each kind its own way ────────────────────
    print("5. the slide as it projects")
    def slide_html():
        return ev(pg, """() => {
          const sl = pslideById(SLED.target, SLED.sel.slice(3));
          return pslideHtml(sl, false);
        }""", default=THREW) or ""

    emb = slide_html()
    check("an embed draws a frame", "<iframe" in emb, emb[:90])
    check("...at the service's player, never the share page",
          "player.vimeo.com" in emb, emb[:120])
    check("...and never autoplays", "autoplay" not in emb, emb[:120])

    ev(pg, """() => {
      const sl = pslideById(SLED.target, SLED.sel.slice(3));
      sl.vid = { url:'https://cdn.example.com/opening.mp4' };
    }""")
    fil = slide_html()
    check("a direct file draws a player", "<video" in fil and "controls" in fil, fil[:90])
    check("...and still never autoplays", "autoplay" not in fil, fil[:120])

    ev(pg, """() => {
      const sl = pslideById(SLED.target, SLED.sel.slice(3));
      sl.vid = { url:'https://example.com/a/page' };
    }""")
    away = slide_html()
    check("a link that cannot play is NOT drawn as a broken player",
          "<iframe" not in away and "<video" not in away, away[:90])
    check("...it says so and offers the way out",
          "new tab" in away.lower() and "<a href" in away, away[:140])

    # A cleared clip keeps its slide and says what happened (§15.1).
    ev(pg, """() => {
      const sl = pslideById(SLED.target, SLED.sel.slice(3));
      sl.vid = { cleared:'3 Sep 26', poster:'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==' };
      sl.vcap = 'Opening morning';
    }""")
    cleared = slide_html()
    check("a cleared clip still draws its slide", "dslide" in cleared, cleared[:80])
    check("...says it was removed to free storage",
          "removed to free storage" in cleared, cleared[:160])
    check("...and keeps the caption", "Opening morning" in cleared, cleared[:200])
    check("...and is not an empty slide", "This slide is empty" not in cleared)

    # ── 6. The ceiling, and it is said before the press ────────────────────
    print("6. three a subject, refused with the reason")
    room = ev(pg, """() => {
      const R = window.SMPRules;
      const list = pslidesFor(SLED.target);
      list.length = 0;
      for (let i = 0; i < R.VIDEO_PER_SUBJECT; i++) {
        list.push({ id:'x' + i, at:'', kind:'video', vid:{ url:'https://vimeo.com/' + (100000 + i) } });
      }
      return { per:R.VIDEO_PER_SUBJECT, room:R.videoRoom(list), held:R.videoSlides(list).length };
    }""")
    check("the ceiling is 3", get(room, "per") == 3, get(room, "per"))
    check("three held leaves no room", get(room, "room") == 0, room)

    # A fourth, through the real control: the refusal must be SAID.
    ev(pg, """() => {
      const list = pslidesFor(SLED.target);
      list.push({ id:'x9', at:'', pics:[] });
      SLED.sel = 'ps:x9';
      slidesPaint();
    }""")
    pg.wait_for_timeout(300)
    pg.query_selector('#slidepane [data-slkind][data-v="video"]').click()
    pg.wait_for_timeout(300)
    err = pg.eval_on_selector("#slidepane", "e => e.innerText") or ""
    check("a fourth is refused", "limit" in err.lower(), err[:130])
    check("...and the slide was NOT made a video anyway",
          ev(pg, "() => (pslideById(SLED.target,'x9')||{}).kind") != "video")

    # ── 7. Nothing reaches a store that is not there ───────────────────────
    # Over file:// there is no server, and the honest answer is to say so
    # rather than to hang (§32, §97.9).
    print("7. no server, no silent hang")
    said = ev(pg, """() => new Promise(r => {
      SYNC.videoSign({ target:'mobile', name:'x.mp4', bytes:10 }, (err) => r(err || 'accepted'));
      setTimeout(() => r('(never answered)'), 3000);
    })""")
    check("an upload with no server is refused, and answers",
          said == "no server here", said)

    # ── 8. Setup › Video storage ───────────────────────────────────────────
    print("8. the section the office clears from")
    # §261.9 MOVED IT: Video storage is the third section of Import & storage,
    # not a rail entry of its own. A check left pointing at the old key would
    # pass quietly having measured nothing (§51.11) — so it walks the section
    # row the way somebody walks it.
    ev(pg, "() => { slidesClose(); current='setup'; currentSub='import'; paint(); }")
    pg.wait_for_timeout(400)
    tabs = pg.eval_on_selector_all(".setuppane .secrow button",
                                   "e => e.map(x => x.textContent.trim())") or []
    check("Import & storage carries three sections",
          ["Import a plan", "Archived plans", "Video storage"] == tabs, tabs)
    vid = [b for b in pg.query_selector_all(".setuppane .secrow button")
           if (b.text_content() or "").strip() == "Video storage"]
    check("...and Video storage is one of them", len(vid) == 1, len(vid))
    if vid:
        vid[0].click()
    pg.wait_for_timeout(500)
    rail = pg.eval_on_selector(".setuprail", "e => e.innerText") if \
           pg.query_selector(".setuprail") else ""
    pane = pg.eval_on_selector(".setuppane", "e => e.innerText") if \
           pg.query_selector(".setuppane") else ""
    check("the rail says Import & storage", "Import & storage" in rail, rail[:140])
    # §24: the old entry is DELETED, not left standing beside its new home —
    # two doors to one page is how a rename becomes a duplicate.
    check("...and there is no second Video storage entry in the rail",
          rail.count("Video storage") == 0, rail[:200])
    check("...and from a file it says there is nothing to ask, rather than asking for ever",
          "opened from a file" in (pane or "").lower(), (pane or "(no pane)")[:200])

    # BOTH ENDS, DRIVEN RATHER THAN READ. The page defs are a closure, not a
    # global, so an earlier draft of this reached for them, threw, and skipped
    # the assertion in silence — twice. Switching the viewer and repainting
    # asks the question the way somebody standing there asks it.
    def sections_now():
        return pg.eval_on_selector_all(".setuppane .secrow button",
                                       "e => e.map(x => x.textContent.trim())") or []

    other = ev(pg, """() => {
      const was = VIEWER;
      const who = (PEOPLE.filter(p => { VIEWER = p.key; const off = inOffice();
                     VIEWER = was; return !off; })[0] || {}).key;
      return who || null;
    }""")
    check("the office sees the Video storage section",
          "Video storage" in sections_now(), sections_now())
    if other:
        ev(pg, "(k) => { VIEWER = k; paint(); }", other)
        pg.wait_for_timeout(400)
        # ASSERTED ON THE PANE, not on the tab row: `c_import` is "view" for the
        # WHOLE register, so a unit head reaches this page — they simply lose
        # two of its three sections (Import a plan wants edit, Video storage
        # wants the office), and one section draws no tab row at all. That is
        # also what makes the gate load-bearing rather than belt-and-braces:
        # without it every unit head would see every unit's clips and sizes.
        pane_them = pg.eval_on_selector(".setuppane", "e => e.innerText") if \
                    pg.query_selector(".setuppane") else ""
        check("...and somebody outside the office does not get Video storage",
              "Video storage" not in pane_them, pane_them[:160])
        # Both ends (§113.8): "it is gone" is true of a build that lost the
        # page, so what they DO keep is asserted in the same breath.
        check("...while the archives they may see are untouched",
              "rchive" in pane_them, pane_them[:160])
        ev(pg, "() => { VIEWER = PEOPLE.filter(p => p.role === 'super')[0].key; paint(); }")
        pg.wait_for_timeout(300)
    else:
        print("  (no non-office person on this register to check the other end)")

    check("no page error anywhere in this run", not errs, errs[:2])
    b.close()

print("\n%d ok, %d FAILED" % (ok, bad))
sys.exit(1 if bad else 0)
