# The unit lockup on the review deck — mockup

Drawn to be looked at before it is built, at Islam's request. **Not built**:
the sources are reverted, so `build.py` still produces the shipped file
byte-for-byte. `deck-unit-logo.patch` re-applies it.

Islam's brief: *"the logo placement should appear on the cover and in the
footer as an example of all the slides."*

## What the screenshots show

| File | Slide |
|---|---|
| `1-cover-light.png` | The cover — the mark large, in place of the group's name |
| `2-table-dark.png` | A figures table, dark — the reversed mark in the footer |
| `3-divider-light.png` | The SWOT section divider |
| `4-table-light.png` | The same figures table, light |
| `5-pillars-light.png` | The pillars table, the densest slide in the deck |

## Three things it settles

**A slide that wears the mark large does not wear it small as well.** Written
first as *skip the footer on `.d-cover`*, which silently took the footer off
five more slides than intended — the SWOT divider, the four pillar dividers and
Thank you all carry that class. Asking whether the mark is already on the slide
cannot make that mistake. Measured: 27 slides, 1 large, 26 footed, 0 missed.

**The footer is OUT OF FLOW.** A footer inside the flex column would shorten
every slide's content box, which changes how many rows a table fits and
therefore how many continuation slides `deckFitPass()` mints. The space is
reserved as padding and the mark placed into it. **Measured across five units:
27 / 22 / 19 / 19 / 19 slides before, and exactly the same after.** No content
overlaps the footer on any slide tested.

**It is appended in ONE place**, not at twenty `push()` calls — after the
picture slides are inserted, so a custodian's own slide is footed too, and
before `deckFitPass()`, so a split slide carries the footer into every
continuation.

## What is deliberately NOT solved here

Where an uploaded mark is stored, how `build.py` inlines it, and who is allowed
to set one. The symbol is a literal in `present.js` for now, and only
Distribution exists — mapped to Mobile, IT and Consumer Electronics, which is
exactly the set of units whose company is `distribution`.

The unresolved decision is still the upload format: **an uploaded SVG is
executable content** in a page already running `'unsafe-inline'` (§43.6).
