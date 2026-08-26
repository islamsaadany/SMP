# Quickstart: validating the onboarding tour

How to prove the feature works, in the order a reviewer should run it. Paths
are relative to `SMP-Project-Folder/src/` unless noted.

## Prerequisites

- The repo, Python 3, and this image's Chromium (checks run through the
  wrapper: `SMP_CHROME=/opt/pw-browsers/chromium python3 qa-run.py <file>`).
- No database or server is needed — the tour is client-only and the checks
  open the built file over `file://`.

## 1 · Build

```bash
cd SMP-Project-Folder/src
python3 build.py
```

Expect: the build writes `strategy-management-platform.html`. Copy it over
the shipped versioned file only when the version is being bumped; otherwise
compare — a build that differs from the shipped file in anything but this
feature's lines means something is out of step (Constitution III).

## 2 · The tour's own check — and prove it can fail FIRST

```bash
SMP_CHROME=/opt/pw-browsers/chromium python3 qa-run.py checks/tour.py
```

Before believing a green run (§94.5), make it red twice:

1. Misspell one step's target selector in `tour.js` → the check must name
   that story, that step and that selector, and fail.
2. Change one step's `sec` to a section it does not open → the check must
   fail on the page-not-where-the-step-says assertion.

Restore both, then expect green: every story × every role it can be offered
to, every step's page/tab/section correct, every target present and visibly
boxed, no card overlapping a hole, Back working from every step, all three
close-prompt buttons behaving, and the pre-tour mode restored on exit.

## 3 · The whole product still walks

```bash
SMP_CHROME=/opt/pw-browsers/chromium python3 qa-run.py qa.py
```

Expect: no console errors, and the unit/function agreement assertions (§53.5)
unchanged. A tour that leaves a listener or a shade behind shows up here as
much as in its own check.

## 4 · By hand, over `file://`

Open the built file. There is no sign-in, so the tour must NOT auto-offer.
Open **Knowledge base** and press the replay entry:

- The tour starts on the welcome card, the demo banner appears.
- Next walks all nine custodian steps; each dims the page and lights exactly
  what the step names — one button for the navigation steps, a section button
  plus its content for the strategy steps, the Performance tab plus the three
  headline numbers for step 7.
- Back retraces, restoring each step's page and section.
- × (and Escape) opens the prompt; *Keep the tour* returns to the same step.
- Finishing or either close choice returns the platform to the dataset it was
  showing before the tour, with no shade or card left behind.

## 5 · By hand, over http(s) — the first-sign-in path

```bash
node scripts/dev-server.js            # from the repo root, with a DATABASE_URL
```

Sign in as a person holding the strategy custodian role, in a browser profile
that has never seen the tour:

- The tour offers itself once the platform has landed — never over the boot
  skeleton.
- *Skip for now* → sign out and in again → it offers once more.
- *Don't show again* → sign out and in again → no offer; the Knowledge base
  entry still starts it.
- With the browser set to block site data, no offer appears and nothing
  throws (failing quiet, spec edge case).

## 6 · What a reviewer should see and NOT see

- **Not** on a projector: start Presentation → no bubble, no shade, nothing.
- **Not** writing: run a full tour on a live tenant, then confirm the stored
  state is byte-identical to before (`/api/state` GET before and after).
- **Not** offering to somebody whose roles map to no story.
