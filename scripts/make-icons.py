"""Renders the app icons from the same Strategy Temple drawing as favicon.svg,
via Chromium — there is no rsvg/cairo in this container, and hand-writing PNG
bytes for a shape like this is not something to do twice.

Two shapes, deliberately:
  any      — the mark as it is, rounded corners and all, on its navy tile.
  maskable — the SAME drawing, full-bleed navy with no corner radius and the
             temple pulled in to ~62%, because a maskable icon is cropped by
             the platform to whatever shape it likes (circle on Android) and
             anything outside the 80% safe zone can be cut off.
Change favicon.svg and this has to be re-run."""
import os, pathlib
from playwright.sync_api import sync_playwright

TEMPLE = """
  <path d="M16 5.2 27.4 12H4.6z" fill="#C9A24D"/>
  <rect x="5.2" y="13.2" width="21.6" height="2.4" fill="#C9A24D"/>
  <rect x="7.2"  y="17" width="3.2" height="7.4" fill="#C9A24D"/>
  <rect x="14.4" y="17" width="3.2" height="7.4" fill="#C9A24D"/>
  <rect x="21.6" y="17" width="3.2" height="7.4" fill="#C9A24D"/>
  <rect x="4.4" y="25.6" width="23.2" height="2.8" rx="0.6" fill="#C9A24D"/>
"""
def svg(size, maskable):
    if maskable:
        # 32 * (1/0.62) = 51.6 viewBox, temple centred in it.
        pad = (51.6 - 32) / 2
        inner = f'<g transform="translate({pad},{pad})">{TEMPLE}</g>'
        return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" '
                f'viewBox="0 0 51.6 51.6"><rect width="51.6" height="51.6" fill="#16325C"/>{inner}</svg>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" '
            f'viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#16325C"/>{TEMPLE}</svg>')

OUT = pathlib.Path(__file__).resolve().parent.parent / "icons"
OUT.mkdir(exist_ok=True)
jobs = [(192, False, "icon-192.png"), (512, False, "icon-512.png"),
        (512, True, "icon-maskable-512.png"), (180, False, "apple-touch-icon.png")]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("CHROMIUM", "/opt/pw-browsers/chromium"))
    for size, mask, name in jobs:
        pg = b.new_page(viewport={"width": size, "height": size},
                        device_scale_factor=1)
        pg.set_content('<body style="margin:0;background:transparent">' + svg(size, mask) + '</body>')
        pg.wait_for_timeout(120)
        pg.screenshot(path=str(OUT / name), omit_background=True)
        pg.close()
        print("  wrote", name, size, "maskable" if mask else "")
    b.close()
