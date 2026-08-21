# Embedded typefaces

Latin subsets of four variable faces, all **SIL Open Font License 1.1**, which
permits embedding. `build.py` inlines each one as a `data:` URI so the single
built file carries them: the platform has to open from a memory stick with no
network, and a linked webfont would break that — as well as putting a request
to a third party on every load of a file holding a client's strategy.

Latin subset only, and VARIABLE rather than one file per weight, which is why
four faces cost 148 KB rather than the several hundred a static family would.

| file | family | woff2 |
|---|---|---|
| `Inter.woff2`         | Inter         | 48 KB |
| `Source_Sans_3.woff2` | Source Sans 3 | 29 KB |
| `Manrope.woff2`       | Manrope       | 25 KB |
| `IBM_Plex_Sans.woff2` | IBM Plex Sans | 46 KB |

Fetched from Google Fonts' `css2` API with a modern user-agent — that is what
selects woff2 and the variable axis — taking only the `/* latin */` block.

**These are here to be chosen between (§38.8).** Once it is settled which face
belongs to which palette, the ones nobody picked come out and the file gets
that weight back.
