# Video — the client explainer

A motion explanatory video for clients: what their people see as a plan, how
they report, and the performance, dashboards and review deck that follow. The
office's own pages are left out on purpose.

| File | What it is |
|---|---|
| `2026-11-17_explainer-storyboard-v1.html` | Storyboard and narration, scene by scene, with the real screen each is drawn from. Published as an artifact for sign-off (A1, A17). |
| `reference-screens/` | The screens the storyboard cites, captured from the built platform at 1600×900 on `file://`, as a unit head and as the group CEO. |
| `capture-screens.js` | The Playwright script that took them (edit the output path; it dismisses the reading window with Escape). |

## Status

Storyboard v1 awaits Islam's five decisions (whose company is on screen, voice,
language, length, where it is shown). Nothing is built until they are given.

## Production path, once agreed

Remotion renders in the cloud session: `remotion@4.0.544` installs from npm and
a 1080p test clip rendered in about twenty seconds with the pre-installed
Chromium. One composition per scene, the platform's own type (Source Sans 3)
and tokens, output 1920×1080 MP4. The project source will live beside this
file so the video can be re-rendered when the product changes.
