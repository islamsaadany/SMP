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
| `logo-black.jpg` | The lockup in the brand navy, 633 × 81 |
| `logo-white.jpg` | The reversed lockup, 633 × 81 |

**Neither is usable in the product as it stands.** They are JPEGs, so they have
no transparency: `logo-black.jpg` carries an opaque `#D9D9D9` ground and
`logo-white.jpg` an opaque `#F6F6F6` one — the white lockup on a near-white
rectangle is invisible, and either one dropped onto the sign-in card paints a
grey box around itself. A logo needs an alpha channel or a vector; these are
the record of what was supplied, not the asset to ship.

`reference/subsidiary-lockups.pdf` holds the same mark as **vector paths**
(56 of them, no embedded images), which is where a real asset should come from.

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
