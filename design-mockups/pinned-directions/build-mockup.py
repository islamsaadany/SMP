# Builds the mockup page from the shots (crops them and embeds them).
import base64, io, pathlib
from PIL import Image
HERE = pathlib.Path(__file__).parent
S = HERE / "shots"
def img(name, h, alt):
    im = Image.open(S / name)
    im = im.crop((0, 0, im.width, min(im.height, h * 2)))
    buf = io.BytesIO(); im.save(buf, "PNG", optimize=True)
    return '<img alt="%s" src="data:image/png;base64,%s">' % (alt, base64.b64encode(buf.getvalue()).decode())

page = """<title>Directions Stay in View</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
  /* Layout: photographs of the real platform, one per point, with a sentence each.
     The platform's own light tokens, so the captions sit beside the pictures
     without competing with them. */
  :root{ --gold-deep:#8A6B22; --ground:#F7F8FA; --surface:#FFFFFF; --line:#D6DCE5;
    --ink:#171B22; --ink-2:#414A58; --ink-3:#636C79;
    --sans:"Source Sans 3",-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif; }
  @media (prefers-color-scheme:dark){ :root:not([data-theme="light"]){ --gold-deep:#D9B665; --ground:#14161A; --surface:#1C2027; --line:#333A45;
    --ink:#E9ECF1; --ink-2:#B4BCC8; --ink-3:#949DAA; color-scheme:dark; } }
  :root[data-theme="dark"]{ --gold-deep:#D9B665; --ground:#14161A; --surface:#1C2027; --line:#333A45;
    --ink:#E9ECF1; --ink-2:#B4BCC8; --ink-3:#949DAA; color-scheme:dark; }
  html,body{margin:0}
  body{background:var(--ground); color:var(--ink); font:14px/1.5 var(--sans);
       padding-block:34px 60px; padding-left:max(16px, env(safe-area-inset-left, 0px)); padding-right:max(16px, env(safe-area-inset-right, 0px));}
  .wrap{max-width:1180px; margin:0 auto;}
  h1{font:650 21px/1.3 var(--sans); letter-spacing:-.012em; margin:0 0 4px; text-wrap:balance;}
  .sub{color:var(--ink-3); font-size:13px; margin:0 0 30px; max-width:78ch;}
  h2{font:600 11px/1 var(--sans); letter-spacing:.11em; text-transform:uppercase; color:var(--gold-deep); margin:38px 0 10px;}
  p.cap{font-size:13.5px; color:var(--ink-2); margin:0 0 12px; max-width:80ch;}
  figure{margin:0; background:var(--surface); border:1px solid var(--line); border-radius:10px; padding:8px; min-width:0;}
  figure img{display:block; max-width:100%; height:auto; border-radius:6px;}
  figcaption{font-size:12px; color:var(--ink-3); padding:6px 4px 0;}
  .two{display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; align-items:start;}
  @media (max-width:760px){ .two{grid-template-columns:1fr;} }
  .stack{display:grid; gap:14px;}
  .decis{background:var(--surface); border:1px solid var(--line); border-radius:12px; padding:16px 18px; margin:0;}
  .decis dt{font:600 13px/1.4 var(--sans); margin:10px 0 2px;} .decis dt:first-child{margin-top:0;}
  .decis dd{margin:0; font-size:13px; color:var(--ink-2); max-width:80ch;}
</style>
<div class="wrap">
  <h1>The directions stay in view on a narrow window</h1>
  <p class="sub">Every picture is the real Plan page (Mobile), photographed, with the proposal drawn into the live page.</p>

  <h2>1&nbsp;&middot;&nbsp;Today</h2>
  <p class="cap">Below 1200px the directions go across the top. Scroll down and they scroll away. Only the open direction's title stays, so switching means scrolling back up.</p>
  <div class="stack">
    <figure>{{t_top}}<figcaption>1100px wide, top of the page</figcaption></figure>
    <figure>{{t_scr}}<figcaption>1100px wide, scrolled down: the strip is gone</figcaption></figure>
  </div>
  <p class="cap" style="margin-top:14px">And on a narrower window the last direction runs off the end of the strip.</p>
  <figure>{{t_900}}<figcaption>900px wide: MB04 is cut off</figcaption></figure>

  <h2>2&nbsp;&middot;&nbsp;Proposed: only the strip stays</h2>
  <p class="cap">The strip sticks under the top bar, on one line. The open direction is the highlighted one, so its title does not need to stay as well: it scrolls away with the plan. Any direction is one click away, wherever you are on the page.</p>
  <figure>{{p_1100}}<figcaption>1100px wide, scrolled down</figcaption></figure>

  <h2>3&nbsp;&middot;&nbsp;Squeezed, nothing is lost</h2>
  <p class="cap">When the whole names don't fit, they shorten with &ldquo;&hellip;&rdquo;. The codes never shorten, and the open direction keeps its name longest. Pointing at a direction shows its full name. Every direction stays on the strip.</p>
  <div class="stack">
    <figure>{{p_900}}<figcaption>900px wide, MB01 open</figcaption></figure>
    <figure>{{p_760}}<figcaption>760px wide, MB04 open</figcaption></figure>
  </div>

  <h2>4&nbsp;&middot;&nbsp;While editing</h2>
  <p class="cap">The same strip, with the reorder handles on the line and <i>+ Add a Pillar</i> at its end. <i>Done editing</i> is already in the top bar, so the title scrolls away here too.</p>
  <figure>{{p_edit}}<figcaption>1100px wide, editing, scrolled down to the tactics</figcaption></figure>

  <h2>5&nbsp;&middot;&nbsp;At the top of the page</h2>
  <p class="cap">Before scrolling it is the same strip, now on one line instead of two, so the plan starts a little higher than today.</p>
  <figure>{{p_top}}<figcaption>1100px wide, top of the page</figcaption></figure>

  <h2>What changes</h2>
  <dl class="decis">
    <dt>Only on a narrow window</dt>
    <dd>Above 1200px the side list stays exactly as it is, with the title held at the top beside it, as today.</dd>
    <dt>The title</dt>
    <dd>On a narrow window it scrolls away with the plan, reading or editing. The same goes for a project's title on Capabilities.</dd>
    <dt>What it costs</dt>
    <dd>Nothing in height. Scrolled down, you see about 10px more of the plan than today. At the top of the page, 22px more.</dd>
    <dt>A unit with many directions</dt>
    <dd>Up to ten fit on the strip even at the narrowest window, shortened to their codes. Past that, the strip scrolls sideways.</dd>
  </dl>
</div>
"""
subs = {
  "t_top": img("today-1100-top.png", 560, "Plan page today, top"),
  "t_scr": img("today-1100-scrolled.png", 560, "Plan page today, scrolled: no directions strip"),
  "t_900": img("today-900-top.png", 360, "Directions strip today at 900px, MB04 cut off"),
  "p_1100": img("proposed-1100-scrolled.png", 560, "Proposed: only the strip pinned, on one line"),
  "p_edit": img("proposed-1100-edit-scrolled.png", 560, "Proposed while editing: strip pinned with reorder handles"),
  "p_900": img("proposed-900-scrolled.png", 520, "Proposed at 900px: names shortened"),
  "p_760": img("proposed-760-mb04-scrolled.png", 520, "Proposed at 760px with MB04 open"),
  "p_top": img("proposed-1100-top.png", 560, "Proposed, top of the page"),
}
out = page
for k, v in subs.items(): out = out.replace("{{%s}}" % k, v)
(HERE / "2026-10-23_directions-stay-in-view.html").write_text(out)
print(len(out))
