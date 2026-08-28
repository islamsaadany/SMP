# The embedded typeface

A Latin subset of **Source Sans 3**, **SIL Open Font License 1.1**, which
permits embedding. `build.py` inlines it as a `data:` URI so the single built
file carries it: the platform has to open from a memory stick with no network,
and a linked webfont would break that — as well as putting a request to a third
party on every load of a file holding a client's strategy.

Latin subset only, and VARIABLE rather than one file per weight, which is why
the whole family costs 28 KB rather than the several hundred a static family
would.

| file | family | woff2 |
|---|---|---|
| `Source_Sans_3.woff2` | Source Sans 3 | 28 KB |

Fetched from Google Fonts' `css2` API with a modern user-agent — that is what
selects woff2 and the variable axis — taking only the `/* latin */` block.

**The comparison is over (§147).** §38.7 carried four faces here so they could
be judged in the real product rather than on a specimen sheet; Islam picked the
two the product offers — the system stack and this one — and Inter, Manrope and
IBM Plex Sans came out, with 116 KB of every handover. Adding a face back means
adding it in three places that must agree: this folder, `FACES` in `build.py`,
and `FONTS` in `theme.js` (which is also the sanitiser for a remembered
choice).
