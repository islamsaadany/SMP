"""THE MOCKUP IS MADE OF THE REAL MANAGE-SLIDES MODE (§41.9, rule 1c).

Not drawn from the stylesheet — driven. It opens the BUILT platform, walks to a
unit's Performance › Presentation › Manage slides the way somebody walks there,
and injects each candidate into the LIVE rail and the LIVE pane. Both sides of
every picture are the same build, so what is signed off is what the product will
look like rather than what its CSS could be made to do (§130.3's lesson: a
mockup drawn from the stylesheet is drawn from what the product COULD look
like, not from what it does).

THE CONTROLS ARE THE PLATFORM'S OWN. `.editbtn` and `.minisw` are what the
pane's Remove slide and its 1|2|3|4 arrangement already wear; inventing a
second idiom for "hide this" is §53.5's drift, and it would be invisible in a
mockup that had drawn one.

Writes PNGs into design-mockups/hide-slides/shots/. It measures nothing and
asserts nothing: it is a camera, not a check. The check comes with the build.
"""
import pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
FILE = ROOT / "SMP-Project-Folder/src/strategy-management-platform.html"
OUT = ROOT / "design-mockups/hide-slides/shots"
OUT.mkdir(parents=True, exist_ok=True)
CHROME = "/opt/pw-browsers/chromium"


def shot(page, sel, name):
    el = page.query_selector(sel)
    if not el:
        print("  MISSING", sel, "->", name)
        return
    el.screenshot(path=str(OUT / (name + ".png")))
    print("  shot", name)


with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME,
                           args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1600, "height": 950})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + str(FILE))
    pg.wait_for_timeout(600)

    # Manage slides is a mode; open it the way the product does.
    pg.evaluate("slidesOpen('unit','mobile')")
    pg.wait_for_timeout(700)
    if not pg.query_selector("#slideroot.on"):
        print("Manage slides did not open"); sys.exit(1)

    # Stand on the slide the proposal hides, BEFORE either shot — both sides of
    # every picture are then the same build in the same state, so what differs
    # between them is the change and nothing else.
    rows = pg.query_selector_all("#slidelist .slrow")
    rows[3].click()
    pg.wait_for_timeout(400)

    print("today:")
    shot(pg, "#slidelist", "today-rail")
    shot(pg, "#slidepane", "today-pane")

    # ── The proposal, injected into the live rail and the live pane ──────────
    # A generated slide's row gains an eye; a hidden row is dimmed and KEEPS ITS
    # PLACE in the list (§61 — a slide you cannot find is a slide you cannot
    # bring back). The line at the top says how many are hidden and offers the
    # way back for all of them at once.
    #
    # THE TAG SITS OUTSIDE `.sl-lab`, which is `-webkit-line-clamp:2` — the
    # first draft put it inside and a two-line label ATE IT, so the state was
    # invisible on exactly the rows whose names are longest. (The existing
    # `em` — "your pictures" — is inside that clamp and has the same fault;
    # recorded, not fixed here.)
    #
    # QUIET, NOT AMBER (§187). Hidden slides are a decision somebody made on
    # purpose, not something outstanding, and an alarm ground over a healthy
    # state is how a product cries wolf. The way back is a quiet text button,
    # never a second gold pill beside Add slide after (§41's budget).
    pg.add_style_tag(content="""
      .slrow { position:relative; }
      .slhide { position:absolute; top:4px; right:4px; width:24px; height:24px;
        display:none; align-items:center; justify-content:center; padding:0;
        border:1px solid var(--line); border-radius:6px; background:var(--surface);
        color:var(--ink-3); cursor:pointer; }
      .slrow:hover .slhide, .slrow.on .slhide, .slrow.off .slhide { display:flex; }
      .slrow.off .sthumb { opacity:.3; filter:grayscale(1); }
      .slrow.off .sl-lab { color:var(--ink-3); }
      .slrow.off .slhide { color:var(--ink-2); border-color:var(--ink-3); }
      .slrow.strike.off .sl-lab { text-decoration:line-through; }
      .sl-off { grid-column:2; font-size:var(--fs-micro); font-weight:700;
        letter-spacing:var(--track); text-transform:uppercase; color:var(--ink-2);
        margin-top:2px; }
      .sl-hidden { display:flex; align-items:center; justify-content:space-between;
        gap:6px; margin:0 0 6px; padding:5px 6px; border-radius:var(--r-sm);
        background:var(--surface-2); font-size:var(--fs-micro); color:var(--ink-2); }
      .sl-hidden .lnk { background:none; border:0; padding:0; cursor:pointer;
        font:inherit; color:var(--ink-2); text-decoration:underline; }
    """)

    EYE_OFF = ("<svg viewBox='0 0 20 20' width='14' height='14' fill='none' "
               "stroke='currentColor' stroke-width='1.6' aria-hidden='true'>"
               "<path d='M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5Z'/>"
               "<circle cx='10' cy='10' r='2.2'/><path d='M3 3l14 14'/></svg>")
    EYE = ("<svg viewBox='0 0 20 20' width='14' height='14' fill='none' "
           "stroke='currentColor' stroke-width='1.6' aria-hidden='true'>"
           "<path d='M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5Z'/>"
           "<circle cx='10' cy='10' r='2.2'/></svg>")

    pg.evaluate("""([eye, eyeOff]) => {
      const list = document.getElementById('slidelist');
      const rows = [...list.querySelectorAll('.slrow')];
      // Two hidden, chosen to be what an office actually prunes: a table it
      // does not want on the projector, and a divider it does not need.
      const off = [rows[3], rows[6]].filter(Boolean);
      rows.forEach(r => {
        const b = document.createElement('button');
        b.className = 'slhide';
        b.innerHTML = eye;
        b.title = 'Hide this slide from the review';
        r.appendChild(b);
      });
      off.forEach(r => {
        r.classList.add('off');
        r.querySelector('.slhide').innerHTML = eyeOff;
        r.querySelector('.slhide').title = 'Show this slide again';
        r.insertAdjacentHTML('beforeend', '<span class="sl-off">Hidden</span>');
      });
      const add = list.querySelector('.sl-add');
      add.insertAdjacentHTML('afterend',
        '<div class="sl-hidden"><span>2 slides hidden</span>' +
        '<button class="lnk">Show all</button></div>');
    }""", [EYE, EYE_OFF])
    pg.wait_for_timeout(200)
    print("proposed:")
    shot(pg, "#slidelist", "rail-a-dimmed")

    # B — the same, with the label struck through as well.
    pg.evaluate("() => [...document.querySelectorAll('.slrow')]"
                ".forEach(r => r.classList.add('strike'))")
    pg.wait_for_timeout(150)
    shot(pg, "#slidelist", "rail-b-struck")
    pg.evaluate("() => [...document.querySelectorAll('.slrow')]"
                ".forEach(r => r.classList.remove('strike'))")

    # The pane, on a hidden generated slide: the read-only note the pane already
    # shows for a generated slide, plus the one control and what it costs.
    pg.evaluate("""() => {
      const pane = document.getElementById('slidepane');
      const st = pane.querySelector('.sstage-in .dslide');
      if (st) { st.style.opacity = '.4'; st.style.filter = 'grayscale(1)'; }
      const ctl = pane.querySelector('.slctl-read');
      ctl.innerHTML =
        '<div class="slctl-h" style="margin:0"><b style="font-size:var(--fs-small)">' +
        'Hidden from the review</b>' +
        '<button class="editbtn" style="margin-left:auto">Show this slide</button></div>' +
        '<p class="picsub" style="margin:8px 0 0">It is skipped when the deck is ' +
        'presented. Nothing else changes \\u2014 the figures on it are still ' +
        'reported, still scored and still on the page.</p>';
    }""")
    pg.wait_for_timeout(200)
    shot(pg, "#slidepane", "proposed-pane")

    print("page errors:", errs or "none")
    b.close()
print("shots ->", OUT)
