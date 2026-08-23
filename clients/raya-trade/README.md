# Raya Trade — client material

Everything in here belongs to the **client**, not to SMP. It is reference and
brand material for the tenant the prototype demonstrates against, kept out of
`SMP-Project-Folder/` deliberately: that folder is the product, it travels as a
zip, and a 19 MB brand manual does not belong in the thing you carry.

A second client is a sibling folder — `clients/<client>/` — not a rewrite of
this one.

## brand/

The Raya Trade wordmark, as supplied.

| File | What it is |
|---|---|
| `logo-raya-trade.svg` | **The asset.** The lockup in the brand's own colours, vector |
| `logo-raya-trade-white.svg` | The same lockup reversed, for a dark ground |
| `logo-black.jpg` | As supplied over WhatsApp, 633 × 81 |
| `logo-white.jpg` | As supplied over WhatsApp, 633 × 81 |

The two SVGs were extracted from the vector artwork on **page 24 of the brand
manual** (Chapter 03, *Sub-brands - Online / Full Name*) — which is the version
the manual itself specifies for screens, and the same lockup that was supplied
as JPEG. The manual draws it over a pale construction grid in `#CDDDF0`; those
paths are guides, not the mark, and are dropped. Colours are read off the
artwork rather than sampled from a screenshot: `#282E76` for the wordmark and
the word TRADE, `#3A67B1` for the flag. The reversed file is the same drawing
with both set to white, which is how the client supplies it.

There are two other Raya Trade lockups in the manual, deliberately not used
here: the *offline* sub-brand (page 31, RAYA over a filled TRADE bar) and the
co-branding lockup (page 33, used when Raya Trade appears beside a line of
business).

**Neither JPEG is usable in the product.** They are JPEGs, so they have
no transparency: `logo-black.jpg` carries an opaque `#D9D9D9` ground and
`logo-white.jpg` an opaque `#F6F6F6` one — the white lockup on a near-white
rectangle is invisible, and either one dropped onto the sign-in card paints a
grey box around itself. A logo needs an alpha channel or a vector; these are
the record of what was supplied, not the asset to ship.

They are kept as the record of what was handed over. The SVGs above are what
the product draws.

## brand/units/

The seven subsidiary lockups, extracted the same way from
`reference/subsidiary-lockups.pdf`.

| File | Reads |
|---|---|
| `logo-distribution.svg` | RAYA \| DISTRIBUTION |
| `logo-retail.svg` | RAYA \| RETAIL |
| `logo-electronics.svg` | RAYA \| ELECTRONICS |
| `logo-smart-care.svg` | RAYA \| SMART CARE |
| `logo-logistics.svg` | RAYA \| LOGISTICS |
| `logo-nigeria.svg` | RAYA \| NIGERIA |
| `logo-digital.svg` | RAYA \| DIGITAL |

Three of them are **drawn**, not supplied — Raya's seven cover their
subsidiaries, and SMP has business units Raya does not name:

| File | Reads | Source |
|---|---|---|
| `logo-corporate.svg` | RAYA \| CORPORATE | drawn |
| `logo-online-shop.svg` | RAYA \| ONLINE SHOP | drawn, two lines |
| `logo-b2b-ecomm.svg` | RAYA \| B2B ECOMM | drawn, two lines |

`scripts/make-unit-lockup.py` draws them, and **nothing about them is
invented**: the RAYA wordmark, its flag and the rule are the client's own
vector artwork lifted from a supplied lockup, the name is set in the manual's
own headline face, and every measurement is taken off supplied artwork —
the rule at x 62.91, the name at x 68.575 in JetBrains Mono Regular at 10pt
with the advance stretched from 6.0 to 6.9, a single-line name 4.35 above the
wordmark's foot and a two-line one straddling it, exactly as SMART CARE does.

**The generator is checked by REDRAWING A SUPPLIED LOCKUP and diffing it
against the real one** — RETAIL for one line, SMART CARE for two, both at
**0 differing pixels**. A construction that cannot reproduce RETAIL has no
business drawing CORPORATE.

The face is the full open-licensed JetBrains Mono (`JetBrainsMono-Regular.ttf`,
OFL, licence beside it) rather than the manual's embedded copy, and that is a
correction rather than a convenience: **a subset maps far more than it draws.**
The manual's copy carries a cmap entry for every ASCII character and an outline
for only 36 of them, **no digits at all** — so `B2B` came out as `B B` and
nothing complained. The generator now refuses a character it cannot draw, and
a space is the only one allowed to draw nothing. The full font was proved to be
the same drawing by the same 0-pixel diff before being used.

**This is a different lockup from the group's, deliberately.** The group wears
the *online* mark (`RAYA` + flag + `TRADE`); a unit wears the *with-line* mark
(`RAYA` + rule + name). Islam settled it: two different things, two different
uses. Do not mix them.

The divider rule is a **stroked black line**, not a filled shape, and it
reaches above the wordmark — so it is the one part of these files that a
colour filter drops silently and a redaction set to remove anything it touches
takes away with the neighbouring rows. Both faults happened; both were caught
by rendering the result rather than reading it.

`#001780` navy and `#225FAC` blue here, against the group mark's `#282E76` and
`#3A67B1` — the two lockups are drawn in different blues, which is the artwork
and not a mistake in the extraction.

## reference/

| File | What it is |
|---|---|
| `brand-identity-manual-v01-2024-07.pdf` | Raya Brand Identity Manual, Volume 01, July 2024 — 52 pages: logo colours and misuses, clear space and minimum size, co-branding with subsidiaries, colour palette, typography (JetBrains Mono for headlines, Inter for text) |
| `subsidiary-lockups.pdf` | One page, vector: the RAYA lockup for seven subsidiaries — DISTRIBUTION, RETAIL, ELECTRONICS, SMART CARE, LOGISTICS, NIGERIA, DIGITAL |

Two brand colours read straight off the vector paths in `subsidiary-lockups.pdf`:

- `#001780` — the navy the wordmark is set in
- `#225FAC` — the blue of the three triangles

Both are candidates for Setup › Branding (`accent` and `bar`), and both should
be confirmed against the manual's own colour palette (page 35) before being
typed in as the tenant's brand.

## What is NOT settled

The seven subsidiary lockups do not map one-to-one onto the platform's ten
units (Mobile, Retail Stores, B2B Ecomm, Online Shop, Consumer Electronics,
Corporate, Care, IT, Logistics, Nigeria). Some pairs are obvious — RETAIL,
ELECTRONICS, LOGISTICS, NIGERIA, SMART CARE — and some are not: which unit
DISTRIBUTION and DIGITAL belong to is Islam's call, not a guess to be made
here. Nothing in the platform reads these files yet.
