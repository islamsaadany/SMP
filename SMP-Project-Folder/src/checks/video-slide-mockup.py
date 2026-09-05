"""THE MOCKUP IS MADE OF THE REAL MANAGE-SLIDES MODE (§41.9, rule 1c).

Not drawn from the stylesheet — driven. It opens the BUILT platform, walks to a
unit's Manage slides the way somebody walks there, adds a real picture slide
through the real control, and then injects the VIDEO proposal into the live rail
and the live pane. Both sides of every picture are the same build, so what is
signed off is what the product will look like rather than what its CSS could be
made to do (§130.3).

THE CONTROLS ARE THE PLATFORM'S OWN. `.picslot`, `.picdrop`, `.editbtn`,
`.minisw`, `.fld` and `.picsub` are what a picture slide already wears; a video
slide that invented a second idiom for "put something here" would be §53.5's
drift, and it would be invisible in a mockup that had drawn one.

THE FRAME IN THE STAND-IN CLIP IS SYNTHETIC AND SAYS SO. There is no video in
this repository and inventing client footage would be §21. It is a flat drawn
frame with the word STAND-IN across it, so nothing in the shot can be mistaken
for a real review.

Writes PNGs into design-mockups/video-slides/shots/. It measures nothing and
asserts nothing: it is a camera, not a check.
"""
import pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
FILE = ROOT / "SMP-Project-Folder/src/strategy-management-platform.html"
OUT = ROOT / "design-mockups/video-slides/shots"
OUT.mkdir(parents=True, exist_ok=True)
CHROME = "/opt/pw-browsers/chromium"


def shot(page, sel, name):
    el = page.query_selector(sel)
    if not el:
        print("  MISSING", sel, "->", name)
        return
    el.screenshot(path=str(OUT / (name + ".png")))
    print("  shot", name)


# A drawn stand-in frame — never a photograph, never client footage (§21).
POSTER = """
(function(){
  var cv = document.createElement('canvas');
  cv.width = 960; cv.height = 540;
  var cx = cv.getContext('2d');
  cx.fillStyle = '#20344f'; cx.fillRect(0, 0, 960, 540);
  var g2 = cx.createLinearGradient(0, 0, 960, 540);
  g2.addColorStop(0, 'rgba(255,255,255,.10)');
  g2.addColorStop(1, 'rgba(255,255,255,0)');
  cx.fillStyle = g2; cx.fillRect(0, 0, 960, 540);
  cx.strokeStyle = 'rgba(255,255,255,.16)'; cx.lineWidth = 2;
  for (var i = 1; i < 6; i++) {
    cx.beginPath(); cx.moveTo(i * 160, 0); cx.lineTo(i * 160, 540); cx.stroke();
  }
  cx.fillStyle = 'rgba(255,255,255,.55)';
  cx.font = '600 34px system-ui, sans-serif';
  cx.textAlign = 'center';
  cx.fillText('STAND-IN FRAME', 480, 292);
  return cv.toDataURL('image/jpeg', 0.7);
})()
"""

CSS = """
/* ── The video slide, in the platform's own vocabulary ──────────────────── */

/* The rail row. A video's thumbnail is its poster with a play badge, and the
   label says "your video" where a picture slide says "your pictures" — one
   word apart, because they are the same kind of thing to somebody scanning
   the rail and the difference only matters once you are on it. */
.sthumb-in .d-video { position:absolute; inset:0; background:#0d1520; }
.sthumb-in .d-video .vfill { width:100%; height:100%; object-fit:cover; }

.vbadge { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);
  width:44px; height:44px; border-radius:50%; background:rgba(12,20,32,.62);
  border:2px solid rgba(255,255,255,.86); display:flex; align-items:center;
  justify-content:center; }
.vbadge::after { content:""; border-left:13px solid #fff; border-top:8px solid transparent;
  border-bottom:8px solid transparent; margin-left:4px; }
/* On a projector the badge is the presenter's own control, so it is sized for
   a room rather than for a thumbnail. In the build this is a real <video
   controls poster>; the badge is what the poster carries before it plays. */
.vbadge.vbig { width:104px; height:104px; border-width:3px; }
.vbadge.vbig::after { border-left-width:32px; border-top-width:20px;
  border-bottom-width:20px; margin-left:9px; }
.sthumb .vbadge { width:20px; height:20px; border-width:1px; }
.sthumb .vbadge::after { border-left-width:6px; border-top-width:4px; border-bottom-width:4px;
  margin-left:2px; }
.vsecs { position:absolute; right:6px; bottom:5px; background:rgba(12,20,32,.78);
  color:#fff; font-size:10px; font-weight:600; padding:1px 5px; border-radius:3px;
  letter-spacing:.02em; }

/* The slide itself. The clip fills the stage under the title, because a video
   in a box on a slide is a video nobody in the room can see; the caption sits
   under it exactly where a picture's does. */
.d-video { display:flex; flex-direction:column; }
.d-video .vwrap { position:relative; flex:1; min-height:0; background:#0d1520;
  border-radius:6px; overflow:hidden; display:flex; align-items:center;
  justify-content:center; }
.d-video .vwrap img { width:100%; height:100%; object-fit:contain; }
.d-video figcaption { margin-top:14px; }

/* ── The pane: where the clip comes from ────────────────────────────────
   TWO WAYS IN, SIDE BY SIDE AND EQUAL. Islam asked for both, and neither is
   the fallback: a tenant whose video already lives on their own SharePoint
   should not have to download it in order to upload it again. */
/* `align-items:start` matters: `.slctl` is a flex column and a grid left to
   stretch grows the two boxes to whatever is left of the pane — 300px of empty
   dashed rectangle either side of a one-line field. */
.vsrc { display:grid; grid-template-columns:1fr 1fr; gap:12px; align-items:start; }
/* `aspect-ratio:16/10` is right for a picture slot, whose job is to show the
   shape the picture will land in. A source chooser has no shape to preview, and
   at a half-pane width that ratio is a 390px dashed rectangle holding two lines
   of text. Height comes from the content, matched to the link box beside it. */
.vsrc .picdrop { display:flex; flex-direction:column; align-items:center;
  justify-content:center; gap:6px; aspect-ratio:auto; min-height:104px;
  border:1px dashed var(--line); border-radius:8px; background:var(--surface-2);
  cursor:pointer; padding:12px; }
.vsrc .picdrop b { font-size:13px; color:var(--ink); }
.vsrc .picdrop .picsub { margin:0; text-align:center; }
.vlink { display:flex; flex-direction:column; justify-content:center; gap:8px;
  min-height:104px; border:1px solid var(--line); border-radius:8px;
  background:var(--surface-2); padding:12px 14px; }
.vlink b { font-size:13px; }
.vlink .fld { width:100%; }

/* A clip that is here. What it is, how big, who put it there — the four facts
   the storage page is going to be asked about, said where the clip is. */
.vhas { border:1px solid var(--line); border-radius:8px; background:var(--surface-2);
  padding:12px 14px; display:flex; align-items:center; gap:14px; }
.vhas .vthumb { position:relative; width:112px; height:63px; border-radius:5px;
  overflow:hidden; background:#0d1520; flex:none; }
.vhas .vthumb img { width:100%; height:100%; object-fit:cover; }
.vhas .vmeta { flex:1; min-width:0; }
.vhas .vmeta b { display:block; font-size:13px; white-space:nowrap; overflow:hidden;
  text-overflow:ellipsis; }
.vhas .vmeta .picsub { margin:2px 0 0; }
.vhas .vacts { display:flex; gap:6px; flex:none; }
.vcap { margin-top:10px; }
"""


def pane_empty():
    return """
    <div class="slctl-h">
      <input class="fld picttl" value="How the Alexandria store opened"
             placeholder="Slide title — optional" aria-label="Slide title">
      <span class="minisw" role="group" aria-label="What is on the slide">
        <button aria-pressed="false" title="Pictures">Pictures</button>
        <button aria-pressed="true" title="A video">Video</button>
      </span>
      <span class="slmove"><button aria-label="Move this slide up">&#9650;</button>
        <button aria-label="Move this slide down">&#9660;</button></span>
      <button class="editbtn">Remove slide</button>
    </div>
    <div class="vsrc">
      <label class="picdrop">
        <span class="picplus" aria-hidden="true">+</span>
        <b>Upload a clip</b>
        <span class="picsub">Up to 50MB and 2 minutes. MP4.</span>
      </label>
      <div class="vlink">
        <b>Or paste a link</b>
        <input class="fld" placeholder="YouTube, Vimeo or SharePoint address"
               aria-label="Video address">
        <span class="picsub">The clip stays where it is; the review points at it.</span>
      </div>
    </div>
    """


def pane_filled(poster):
    return """
    <div class="slctl-h">
      <input class="fld picttl" value="How the Alexandria store opened"
             placeholder="Slide title — optional" aria-label="Slide title">
      <span class="minisw" role="group" aria-label="What is on the slide">
        <button aria-pressed="false" title="Pictures">Pictures</button>
        <button aria-pressed="true" title="A video">Video</button>
      </span>
      <span class="slmove"><button aria-label="Move this slide up">&#9650;</button>
        <button aria-label="Move this slide down">&#9660;</button></span>
      <button class="editbtn">Remove slide</button>
    </div>
    <div class="vhas">
      <span class="vthumb"><img src="POSTER" alt=""><span class="vbadge"></span></span>
      <span class="vmeta">
        <b>alexandria-opening.mp4</b>
        <span class="picsub">1:12 &middot; 34MB &middot; uploaded by Hala Mansour, 3 Sep</span>
      </span>
      <span class="vacts">
        <button class="editbtn">Replace</button>
        <button class="editbtn">Remove</button>
      </span>
    </div>
    <input class="fld vcap" value="Opening morning, 14 August"
           placeholder="Caption — optional" aria-label="Caption">
    """.replace("POSTER", poster)


with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME,
                           args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1600, "height": 950})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + str(FILE))
    pg.wait_for_timeout(700)

    pg.evaluate("slidesOpen('unit','mobile')")
    pg.wait_for_timeout(700)
    if not pg.query_selector("#slideroot.on"):
        print("Manage slides did not open")
        sys.exit(1)

    # A real picture slide, through the real control — so the "today" shot is
    # the product and not a drawing of it.
    pg.evaluate("slidesAdd()")
    pg.wait_for_timeout(500)

    print("today:")
    shot(pg, "#slidepane", "today-pane")
    shot(pg, "#slidelist", "today-rail")

    poster = pg.evaluate(POSTER)
    pg.add_style_tag(content=CSS)

    # ── The proposal, injected into the live pane ───────────────────────────
    print("proposed:")
    # The empty slide says what THIS slide is waiting for. "until it has a
    # picture" on a video slide is the screen describing the other kind (§45.2).
    pg.evaluate("""(html) => {
      document.querySelector('#slidepane .slctl').innerHTML = html;
      const em = document.querySelector('#slidepane .blankslide em');
      if (em) em.textContent = 'It will not appear in the review until it has a video.';
      slidesFitStage();
    }""", pane_empty())
    pg.wait_for_timeout(250)
    shot(pg, "#slidepane", "video-empty")

    # The slide as it projects — the deck's OWN stage, at the deck's own scale,
    # and the footer mark (§259) kept rather than written over.
    pg.evaluate("""(poster) => {
      const st = document.querySelector('#slidepane .sstage-in .dslide');
      const foot = st.querySelector('.dfoot');
      st.className = 'dslide d-video on';
      st.innerHTML = '<h2>How the Alexandria store opened</h2>' +
        '<div class="vwrap"><img src="' + poster + '"><span class="vbadge vbig"></span>' +
        '<span class="vsecs">1:12</span></div>' +
        '<figcaption>Opening morning, 14 August</figcaption>';
      if (foot) st.appendChild(foot);
    }""", poster)
    pg.wait_for_timeout(250)
    shot(pg, "#slidepane .sstage", "video-stage")

    pg.evaluate("""(html) => {
      document.querySelector('#slidepane .slctl').innerHTML = html;
      slidesFitStage();
    }""", pane_filled(poster))
    pg.wait_for_timeout(250)
    shot(pg, "#slidepane", "video-filled")

    # The rail row for a video slide, beside the generated ones.
    pg.evaluate("""(poster) => {
      const row = document.querySelector('#slidelist .slrow.mine') ||
                  document.querySelector('#slidelist .slrow.on');
      row.querySelector('.sthumb-in').innerHTML =
        '<div class="dslide d-video on" style="position:absolute;inset:0;padding:0">' +
        '<img class="vfill" src="' + poster + '"></div>' +
        '<span class="vbadge"></span><span class="vsecs">1:12</span>';
      row.querySelector('.sthumb').style.position = 'relative';
      row.querySelector('.sl-lab').innerHTML =
        'How the Alexandria store opened<em>your video</em>';
    }""", poster)
    pg.wait_for_timeout(250)
    shot(pg, "#slidelist", "video-rail")
    # The rail and the pane together — a video slide sitting among the deck's
    # own generated ones, which is where it has to read right.
    shot(pg, "#slideroot .slwrap, #slideroot", "video-editor")

    # ── Setup › Video storage (Islam's #3: "a way to clear the storage") ─────
    # Shot in the REAL Setup chrome, with the rail beside it, and built with the
    # platform's OWN `section()` so the heading, the card and the table are the
    # ones every other Setup page wears rather than a second idiom (§53.5).
    #
    # It is its own rail entry under *Running the cycle*, beside Import &
    # archives — clearing clips is cycle hygiene the office does, and Import &
    # archives is about PLANS: a third section there would stretch what that
    # page means.
    #
    # THE TOTAL IS ON THE PAGE, because "am I being overwhelmed" is the question
    # somebody opens it to answer, and a table of rows makes you add them up.
    # A clip still in the OPEN cycle says so and offers no Delete — deleting
    # what a unit is about to present is not storage hygiene (§61).
    print("storage:")
    # Manage slides is a MODE and covers the page — leave it, or the Setup shot
    # is a photograph of the editor.
    pg.evaluate("()=>{ slidesClose(); }")
    pg.wait_for_timeout(400)
    pg.evaluate("()=>{ current='setup'; currentSub='import'; paint(); }")
    pg.wait_for_timeout(600)

    pg.evaluate("""() => {
      const rows = [
        ['Mobile', 'How the Alexandria store opened', 'H1 2026 — open now',
         '1:12', '34MB', 'Hala Mansour, 3 Sep', true],
        ['Retail Stores', 'The new shelf layout', 'H1 2026 — open now',
         '0:48', '21MB', 'Karim Fouad, 1 Sep', true],
        ['B2B Ecomm', 'Customer walkthrough', 'H2 2025 — closed 12 Jan',
         '1:54', '47MB', 'Nadia Sami, 8 Dec', false],
        ['Marketing', 'Campaign film', 'H2 2025 — closed 12 Jan',
         '0:30', '12MB', 'Omar Zaki, 4 Dec', false],
        ['Care', 'Contact centre floor', 'H1 2025 — closed 3 Jul',
         '1:05', '29MB', 'Yara Nabil, 20 Jun', false]
      ].map(r => '<tr><td><b>' + r[0] + '</b><span class="why">' + r[1] + '</span></td>' +
        '<td>' + r[2] + '</td>' +
        '<td class="cc">' + r[3] + '</td>' +
        '<td class="cc">' + r[4] + '</td>' +
        '<td>' + r[5] + '</td>' +
        '<td class="cc">' + (r[6]
          ? '<span class="pill none">In the open cycle</span>'
          : '<button class="rmbtn">Delete the clip</button>') + '</td></tr>').join('');

      const body =
        '<div class="note"><b>143MB</b> in 5 clips. ' +
        '<b>82MB</b> of that is in cycles that have closed.' +
        '<span class="why">Deleting a clip frees the space and leaves the slide in ' +
        'the archive, saying the clip was removed. Nothing else about the archived ' +
        'review changes.</span></div>' +
        '<table><thead><tr><th>Subject</th><th>Cycle</th><th class="cc">Length</th>' +
        '<th class="cc">Size</th><th>Uploaded by</th><th class="cc"></th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table>' +
        '<div class="note"><button class="rmbtn">Delete every clip from closed ' +
        'cycles</button> <span class="why">3 clips, 82MB. The clips in the open ' +
        'cycle are left alone.</span></div>';

      document.querySelector('.setuppane').innerHTML =
        section('', 'Video storage', null, body);

      // ...and the rail entry it is reached from.
      const im = document.querySelector('[data-setupgo="import"]');
      const row = im.cloneNode(true);
      row.classList.remove('on');
      row.querySelector('.rilab').textContent = 'Video storage';
      const g = row.querySelector('.riglyph');
      if (g) g.textContent = '\\u25B7';
      im.parentNode.insertBefore(row, im.nextSibling);
    }""")
    pg.wait_for_timeout(300)
    shot(pg, ".setupsplit", "storage-page")

    if errs:
        print("  page errors:", errs[:3])
    b.close()
print("done ->", OUT)
