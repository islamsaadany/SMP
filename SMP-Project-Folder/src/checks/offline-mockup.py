"""THE MOCKUP IS MADE OF THE REAL PLATFORM (§41.9, rule 1c).

Not drawn from the stylesheet — driven. It opens the SHIPPED platform file (the
bytes Islam is looking at, §105.6), writes each candidate sentence into the LIVE
`#refused` element for the BEFORE shots, and mounts the proposed pop-up on the
real page for the AFTER ones. Both sides of every picture are the same build.

THE POP-UP IS BUILT OUT OF THE ONE FLOATING-CARD IDIOM THE PRODUCT HAS: the
chat panel (`.chatpanel`, chat.css) — `--surface`, 1px `--line`, 12px radius,
`0 6px 26px rgba(0,0,0,.18)`, docked 18px from the window's edge. A second card
vocabulary invented for this is exactly §53.5's drift, and it would be
invisible in a mockup that had drawn one.

AND THE CORNER IS ALREADY OCCUPIED. `.chatdock` is `right:18px; bottom:18px`,
which is why placement is a real question and not a preference — so the chat
bubble is FORCED VISIBLE in the placement shots (over `file://` the corner is
deliberately not drawn, §97, so a mockup without it would be a picture of a
window that does not exist).

BOTH PALETTES, because every token here is themed (§130.3).

Writes PNGs into design-mockups/offline-message/shots/ and assembles the page.
It measures nothing and asserts nothing: it is a camera, not a check. The check
comes with the build.
"""
import base64, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
FILE = ROOT / "SMP-Project-Folder/strategy-management-platform-v3.22.html"
OUT = ROOT / "design-mockups/offline-message/shots"
OUT.mkdir(parents=True, exist_ok=True)

# ── WHAT IT SAYS TODAY ───────────────────────────────────────────────────
# `showFailed()` builds two spans: the bold lead plus the reason, then the
# advice. Written in exactly that shape, or the mockup is of a component the
# product does not have — including the missing space between them, which is
# real: `.banner.refused` is display:block (it overrides `.banner`'s flex, and
# its 10px gap with it) and the two spans are concatenated with no whitespace,
# so EVERY failure the platform reports runs its sentences together.
TODAY = ("<span><strong>Not saved.</strong> The platform could not reach the "
         "server (Failed to fetch).</span>"
         "<span>Your change is still on screen and the platform keeps trying. "
         "If it does not clear, reload before typing anything else — what "
         "is on screen has not reached the database.</span>")

# The §184 refusal, which is a DIFFERENT message and stays a banner: it names
# the rows the server objected to and carries two controls. Drawn with the
# product's own classes so the argument for leaving it where it is can be seen
# rather than taken on trust.
REFUSAL = ("<span><strong>Not saved.</strong> A project's milestones (CX) "
           "cannot be changed here — a plan is corrected by the Strategy "
           "Office.</span>"
           "<ul><li>Mystery shopping wave 2 — Due date</li>"
           "<li>Service recovery SLA — Owner</li></ul>"
           "<span style='display:block;margin-top:8px'>"
           "<button class='refused-keep'>Put those two back and save the rest"
           "</button>"
           "<button class='refused-undo'>Discard the change and reload</button>"
           "</span>")

# ── THE POP-UP ───────────────────────────────────────────────────────────
# The chat panel's own box, with one thing added: a 4px `--bad` edge, which is
# the platform's way of saying which kind of message this is without tinting
# the whole card (§41's accent budget — a tinted card is an alarm, an edge is a
# mark). The heading is `--bad-tx`, never `--bad`: a colour that works as a
# fill fails as type (§38.4, and it is measured against `--surface` here).
POP_CSS = """
.savedock { position:fixed; z-index:46; display:flex; }
.savepop { width:360px; max-width:calc(100vw - 36px); background:var(--surface);
           border:1px solid var(--line); border-left:4px solid var(--bad);
           border-radius:12px; box-shadow:0 6px 26px rgba(0,0,0,.18);
           padding:13px 16px 14px; }
.savepop b { display:block; color:var(--bad-tx); font-size:var(--fs-body);
             font-weight:700; line-height:1.3; }
.savepop p { margin:5px 0 0; color:var(--ink-2); font-size:var(--fs-small);
             line-height:1.5; }
"""

# A — §230.2's plain voice: no "server", no "database", short lines, and the
# advice REVERSED, because telling somebody offline to reload is telling them
# to throw the work away.
POP_A = ("<b>You are offline — not saved yet.</b>"
         "<p>Your work is safe on screen. It will save by itself the moment "
         "you are back online. Do not reload while you are offline.</p>")
# B — the same fact in the banner's existing fuller voice.
POP_B = ("<b>Not saved — you are offline.</b>"
         "<p>Your change is still on screen and will be sent as soon as you "
         "are back online. Do not reload while you are offline — what is on "
         "screen has not reached the database yet.</p>")
# The other two ways a save fails. The server's own status STAYS (§171 — a
# number is not jargon to the one person who can act on it); what goes is the
# browser's "Failed to fetch", which names nothing and moves to the console.
POP_UNREACHED = ("<b>Not saved — the server did not answer.</b>"
                 "<p>You are online, so this is the platform, not your "
                 "connection. Your change is still on screen and it keeps "
                 "trying.</p>")
POP_SERVER = ("<b>Not saved — the server answered HTTP 500.</b>"
              "<p>Your change is still on screen and the platform keeps "
              "trying. If it does not clear, tell the Strategy Office that "
              "number.</p>")

# ── THE DIALOG, IN THE MIDDLE OF THE PAGE ────────────────────────────────
# Islam: "I want the location to be in the middle of the page like the error
# popup. it's very critical." So it is the platform's OWN dialog — `.overlay` +
# `.modal` + `.modal-h` + `.modal-b` (group-extra.css), the box the merge
# wizard, the person dialog and the screenshot viewer all open in — and never a
# centred version of the corner card.
#
# THE WIDTH IS MARKED ON THE OVERLAY, NEVER LOOSENED ON `.modal`, which every
# dialog in the platform shares (§122's rule): `.modal` is min(940px,100%) and
# 940px of dialog for three sentences is a wall, not a message.
#
# AND IT NEEDS AN OVERLAY OF ITS OWN, which is the one real cost of putting
# this in the middle: `openModalHtml()` reuses THE overlay — one element, whose
# body it overwrites — so raising this over an open person dialog or merge
# wizard would destroy the dialog somebody was working in (§116.6: every way
# out of a dialog is the same way out). Its own element, above the shared one.
DLG_CSS = """
.overlay.savedlg { display:flex; opacity:1; visibility:visible;
                   pointer-events:auto; z-index:120; }
.overlay.savedlg .modal { width:min(460px, 100%); }
.overlay.savedlg .modal-h { border-bottom:0; padding-bottom:6px; }
.overlay.savedlg .modal-h h3 { color:var(--bad-tx); }
.overlay.savedlg .modal-b { padding-top:0; }
.overlay.savedlg .modal-b p { margin:0 0 12px; color:var(--ink-2);
                              font-size:var(--fs-body); line-height:1.5; }
.overlay.savedlg .waiting { display:flex; align-items:center; gap:8px;
                            font-size:var(--fs-small); color:var(--ink-3);
                            border-top:1px solid var(--line-soft);
                            padding-top:12px; margin-top:2px; }
.overlay.savedlg .dot { width:8px; height:8px; border-radius:50%;
                        background:var(--bad); flex:none; }
.overlay.savedlg .foot { display:flex; justify-content:flex-end;
                         margin-top:14px; }
"""

# The dialog carries the same three sentences the card carried — a bigger box
# is not a licence to say more (§230.2) — plus the one line a centred dialog
# owes somebody it is standing in front of: what it is waiting for.
DLG_A = ("<p>Your work is safe on screen. It will save by itself the moment "
         "you are back online.</p>"
         "<p><strong>Do not reload while you are offline.</strong></p>")
DLG_B = ("<p>Your change is still on screen and will be sent as soon as you "
         "are back online.</p>"
         "<p><strong>Do not reload while you are offline</strong> — what is "
         "on screen has not reached the database yet.</p>")
DLG_UNREACHED = ("<p>You are online, so this is the platform and not your "
                 "connection. Your change is still on screen and it keeps "
                 "trying.</p>")
DLG_SERVER = ("<p>Your change is still on screen and the platform keeps "
              "trying.</p>"
              "<p>If it does not clear, tell the Strategy Office that "
              "number.</p>")

DIALOG = """([css, title, body, wait]) => {
  document.querySelectorAll('.overlay.savedlg, #savedlgcss').forEach(e => e.remove());
  const s = document.createElement('style');
  s.id = 'savedlgcss'; s.textContent = css;
  document.head.appendChild(s);
  const o = document.createElement('div');
  o.className = 'overlay savedlg';
  o.innerHTML =
    '<div class="modal" role="alertdialog" aria-modal="true">' +
      '<div class="modal-h">' +
        '<div><h3>' + title + '</h3></div>' +
        '<button class="modal-x" type="button" aria-label="Close">\\u00D7</button>' +
      '</div>' +
      '<div class="modal-b">' + body +
        (wait ? '<div class="waiting"><span class="dot"></span>' + wait + '</div>' : '') +
        '<div class="foot"><button class="editbtn" type="button">Keep working</button></div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(o);
  return true;
}"""

HIDEDIALOG = """() => {
  document.querySelectorAll('.overlay.savedlg').forEach(e => e.remove());
  return true;
}"""

PLACES = {
    # Clear of the chat corner, and the mirror of it — the product already
    # docks one card 18px off a bottom corner, so this is the same shelf.
    "bl": "left:18px; bottom:18px;",
    # Hardest to miss, and it sits over the middle of the work.
    "bc": "left:50%; transform:translateX(-50%); bottom:18px;",
    # Where the banner used to be, as a card. It lands on the page's own
    # pinned title and controls row (§130).
    "tr": "right:18px; top:88px;",
}

MOUNT = """([css, body, place]) => {
  document.querySelectorAll('.savedock, #savepopcss').forEach(e => e.remove());
  const s = document.createElement('style');
  s.id = 'savepopcss'; s.textContent = css;
  document.head.appendChild(s);
  const d = document.createElement('div');
  d.className = 'savedock';
  d.setAttribute('style', place);
  d.innerHTML = '<div class="savepop">' + body + '</div>';
  document.body.appendChild(d);
  return true;
}"""

# THE CHAT CORNER IS PUT BACK. Over `file://` there is no server, so the corner
# is never created at all (§97) — and a placement shot without it is a picture
# of a corner that is empty in the mockup and occupied in the product, which is
# the whole question. It is mounted from the product's own classes and its own
# path data (chat.js), never a drawn stand-in.
#
# AND THE PROTOTYPE BANNER IS HIDDEN. The yellow "Prototype · group shape" strip
# exists only in the worked example; a real deployment has no such row, so
# leaving it in makes the shot LESS like the screen being decided about, not
# more (§21).
STAGE = """() => {
  const b = document.getElementById('banner');
  if (b) b.hidden = true;
  document.querySelectorAll('.chatdock').forEach(e => e.remove());
  const d = document.createElement('div');
  d.className = 'chatdock';
  d.innerHTML =
    '<button class="chatbtn" type="button" aria-label="Message the Strategy Office">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.7 9.7 0 0 1-2.7-.4L3 21l1.6-4.6A8.2 8.2 0 0 1 ' +
      '3.6 11.5 8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z"/></svg>' +
    '</button>';
  document.body.appendChild(d);
  return true;
}"""

BANNER = """(html) => {
  const el = document.getElementById('refused');
  if (!el) return false;
  el.innerHTML = html;
  el.hidden = false;
  return true;
}"""

HIDEBANNER = """() => {
  const el = document.getElementById('refused');
  if (el) { el.hidden = true; el.innerHTML = ''; }
  return true;
}"""


def card(pg, name, body, theme):
    """The card alone, at true size — what is being decided is the words and
    the box, and the page behind it is not part of that question."""
    pg.evaluate(MOUNT, [POP_CSS, body, PLACES["bl"]])
    pg.wait_for_timeout(80)
    pg.query_selector(".savepop").screenshot(
        path=str(OUT / ("%s-%s.png" % (name, theme))))
    print("  wrote %s-%s.png" % (name, theme))


with sync_playwright() as p:
    br = p.chromium.launch()
    for theme in ("light", "dark"):
        # 1000px is Islam's own laptop (§27.1's sweep exists because of it),
        # and a shot at 2x is read at true size in the mockup rather than
        # scaled down until the sentence being decided is unreadable.
        pg = br.new_page(viewport={"width": 1000, "height": 800},
                         device_scale_factor=2)
        pg.goto(FILE.as_uri())
        pg.wait_for_timeout(400)
        pg.evaluate("(t) => document.documentElement.setAttribute('data-theme', t)",
                    theme)
        pg.evaluate(STAGE)

        # BEFORE: the banner as it is today, and the refusal that stays one.
        pg.evaluate(BANNER, TODAY)
        pg.wait_for_timeout(80)
        pg.query_selector("#refused").screenshot(
            path=str(OUT / ("today-banner-%s.png" % theme)))
        print("  wrote today-banner-%s.png" % theme)
        if theme == "light":
            pg.evaluate(BANNER, REFUSAL)
            pg.wait_for_timeout(80)
            pg.query_selector("#refused").screenshot(
                path=str(OUT / "refusal-banner-light.png"))
            print("  wrote refusal-banner-light.png")
        pg.evaluate(HIDEBANNER)

        # AFTER: the dialog, in the middle of the page, over the real page.
        WAIT = "Waiting to reconnect — checking every few seconds"
        for name, title, body, wait in [
                ("dlg-a", "You are offline", DLG_A, WAIT),
                ("dlg-b", "Not saved — you are offline", DLG_B, WAIT),
                ("dlg-unreached", "Not saved — the server did not answer",
                 DLG_UNREACHED, "Trying again — every few seconds"),
                ("dlg-server", "Not saved — the server answered HTTP 500",
                 DLG_SERVER, "Trying again — every few seconds")]:
            pg.evaluate(DIALOG, [DLG_CSS, title, body, wait])
            pg.wait_for_timeout(120)
            pg.screenshot(path=str(OUT / ("%s-%s.png" % (name, theme))))
            print("  wrote %s-%s.png" % (name, theme))
            # And the box alone, so the words can be read at true size.
            pg.query_selector(".overlay.savedlg .modal").screenshot(
                path=str(OUT / ("%s-box-%s.png" % (name, theme))))
            print("  wrote %s-box-%s.png" % (name, theme))
        pg.evaluate(HIDEDIALOG)

        # WHAT IS LEFT AFTER IT IS CLOSED. The dialog can be dismissed — you
        # have to be able to carry on working, and being offline lasts as long
        # as it lasts — so something quiet has to stay, or the work is unsaved
        # and nothing says so (§171). It is round two's card, in the corner the
        # chat bubble does not occupy.
        card(pg, "pop-a", POP_A, theme)
        if theme == "light":
            pg.evaluate(MOUNT, [POP_CSS, POP_A, PLACES["bl"]])
            pg.wait_for_timeout(120)
            pg.screenshot(path=str(OUT / "place-bl.png"))
            print("  wrote place-bl.png")
        pg.close()
    br.close()

# ── AND THE PAGE IS ASSEMBLED FROM THEM ──────────────────────────────────
# The mockup is ONE self-contained file with the shots inlined, because that is
# what gets published and what stays in `design-mockups/` as the record. The
# template beside it holds the words; this only fills in the pictures, so a
# reworded mockup is a template edit and one command.
TPL = OUT.parent / "_page.html"
PAGE = OUT.parent / "2026-09-02_offline-banner.html"
html = TPL.read_text()
for png in sorted(OUT.glob("*.png")):
    uri = "data:image/png;base64," + base64.b64encode(png.read_bytes()).decode()
    html = html.replace("{{%s}}" % png.stem, uri)
if "{{" in html:
    raise SystemExit("a shot the page asks for was never taken: " +
                     html[html.index("{{"):][:40])
PAGE.write_text(html)
print("  wrote %s (%d KB)" % (PAGE.name, len(html) // 1024))
