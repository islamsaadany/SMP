# Video — the client explainer

A motion explanatory video for clients: what their people see as a plan, how
they report, and the performance, dashboards and review deck that follow. The
office's own pages are left out on purpose. Everything on screen is an
invented demo company, Meridian Group, with invented figures.

| Path | What it is |
|---|---|
| `renders/SMP-explainer-3min.mp4` | The full cut (about 3:30 with the two-beat opening), 1920×1080, AI voice with captions. Shown in meetings. |
| `renders/SMP-explainer-1min.mp4` | The short cut (1:11): the long video's opening, whole, then one benefit-led sentence each on the plan, the reporting, the performance, the group page and the deck. No technicalities. Replaced the 90-second cut on Islam's word. |
| `explainer/` | The Remotion project the two cuts render from (below). |
| `2026-11-17_explainer-storyboard-v1.html` | Storyboard v1 and the narration, scene by scene, with the real screen each was drawn from. Published as an artifact; Islam's five decisions (2026-11-17) are what the project builds: demo company, AI voice with captions, English, both cuts, 16:9. Changed after the first renders, on Islam's word: crossfades between scenes, and the opening is two beats, the strategy and what it meets after the workshop, then the platform as the answer (`src/script.ts` is the narration as built). |
| `reference-screens/` | The real platform screens the storyboard cites, captured at 1600×900 from the built file. |
| `capture-screens.js` | The Playwright script that took them. |

## The Remotion project (`explainer/`)

```bash
cd explainer && npm install
npx remotion studio                    # preview and scrub every scene
npx remotion render Full  ../renders/SMP-explainer-3min.mp4
npx remotion render Short ../renders/SMP-explainer-1min.mp4
```

- `src/data.ts` — the demo company. Change a name or a figure here and every scene follows.
- `src/script.ts` — the narration, split into caption lines. The voice reads the join of each scene's lines.
- `src/scenes/` — one file per scene, drawn with the platform's own tokens and type (`src/theme.ts`, `src/ui.tsx`).
- `src/planned.ts` — the pace each scene was drawn for; `src/timings.ts` and `src/cues.ts` are **generated** from the measured voice and never edited by hand. Story time stretches each scene to its narration (`src/anim.ts`).
- `public/voice/` — one MP3 per scene per cut, copied from `voice/cache/`, where every finished scene is kept under the hash of its words and voice with its word timings in a `.json`. A changed or inserted scene re-does only itself.

### The voice

`scripts/make-voice.py` synthesises the narration with a free neural voice
(Microsoft Edge, `en-US-AndrewNeural`, through the `edge-tts` package),
measures every scene, and writes `timings.ts` and `cues.ts`. Changing the
words in `script.ts` and running it again re-does only the scenes that
changed. The service refuses a request now and then; the script retries and
resumes. To try another voice: `--voice en-GB-SoniaNeural` (`edge-tts
--list-voices` lists them). A recorded human voice can replace it: drop the
per-scene MP3s into `public/voice/<cut>/` and write their durations into
`timings.ts` (word cues then fall back to the lines spread by word count).

Descript's agent could not generate speech from the session (2026-11-17), so
it was not used; the project does not depend on it.

### Behind the session proxy

`edge-tts` pins its own certificate list, so append the proxy's bundle to it
once: `cat /root/.ccr/ca-bundle.crt >> <venv>/lib/python3.*/site-packages/certifi/cacert.pem`.
The render itself needs no network: the font is the platform's own file.
