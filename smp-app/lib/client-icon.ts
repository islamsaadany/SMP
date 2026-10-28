/* WHICH PICTURE STANDS FOR A CLIENT IN A SMALL SQUARE (§629)

   Forefront's Home draws each client in a 30px square. A square mark reads
   there; a wide one (El Abd's word-mark) shrinks to a strip nobody can read.
   So a client may carry an icon of its own, and where it has none the square
   uses the mark only if the mark is not wide — otherwise the console draws the
   client's initials, which at least say who it is.

   ONE derivation, here, asked by the cards (what Home draws) and by the
   client's own details (what the Brand tab warns about), so the page never
   says "this mark is too wide" about a mark Home is happily drawing, or the
   reverse. The size is read from the PNG's own header rather than decoded:
   the width and height are bytes 16–23 of every PNG, so the first 32 base64
   characters (24 bytes) carry them. */

/** Wider than this, a mark is a strip in a square. 3:2 — a square-ish badge
    with a little lettering under it still reads; a word-mark does not. */
const WIDE = 1.5;

export function pngSize(uri: string | null | undefined): { w: number; h: number } | null {
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]{32})/.exec(String(uri || ""));
  if (!m) return null;
  const b = Buffer.from(m[1], "base64");
  if (b.length < 24 || b.toString("latin1", 12, 16) !== "IHDR") return null;
  const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
  return w > 0 && h > 0 ? { w, h } : null;
}

/** True only when the mark is known to be wide; an unreadable mark is not
    called wide, because the warning would then be a guess. */
export function markIsWide(mark: string | null | undefined): boolean {
  const s = pngSize(mark);
  return !!s && s.w / s.h > WIDE;
}

/** The picture for the small square, or null for initials. */
export function squareFor(row: { mark: string | null; icon?: string | null }): string | null {
  if (row.icon) return row.icon;
  if (row.mark && !markIsWide(row.mark)) return row.mark;
  return null;
}
