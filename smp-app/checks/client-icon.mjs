/* ── WHICH PICTURE STANDS FOR A CLIENT IN A SMALL SQUARE (§629) ─────────────
 * No database, no browser: lib/client-icon.ts is pure. The pictures are REAL
 * PNGs written here (a header, one IDAT, an IEND) so the size is read the way
 * the server reads a stored mark, never from a hand-typed byte string.
 * Both ends every time (§94.2): a wide mark IS refused the square and a square
 * one is NOT; an icon wins over either; an unreadable mark is never called
 * wide (a warning that is a guess is worse than none).
 *   node --experimental-strip-types checks/client-icon.mjs          the check
 *   node --experimental-strip-types checks/client-icon.mjs --red    each break
 *       made in a COPY (§276) must turn this red; each asserts it matched first.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { deflateSync, crc32 } from "node:zlib";

const here = dirname(fileURLToPath(import.meta.url));
const real = join(here, "../lib/client-icon.ts");

const BREAKS = {
  "never-wide": ["return !!s && s.w / s.h > WIDE;", "return false;"],
  "mark-always": ["if (row.mark && !markIsWide(row.mark)) return row.mark;", "if (row.mark) return row.mark;"],
  "icon-ignored": ["if (row.icon) return row.icon;", ""],
  "guess-wide": ["return !!s && s.w / s.h > WIDE;", "return !s || s.w / s.h > WIDE;"],
  "height-for-width": ["const w = b.readUInt32BE(16), h = b.readUInt32BE(20);", "const h = b.readUInt32BE(16), w = b.readUInt32BE(20);"],
};

if (process.argv.includes("--red")) {
  const dir = join(process.env.TMPDIR || "/tmp", "client-icon-red");
  mkdirSync(dir, { recursive: true });
  const src = readFileSync(real, "utf8");
  let notRed = 0;
  for (const [name, [from, to]] of Object.entries(BREAKS)) {
    if (!src.includes(from)) { console.log("BREAK DID NOT MATCH: " + name); notRed++; continue; }
    const f = join(dir, name + ".ts");
    writeFileSync(f, src.replace(from, to));
    const r = spawnSync(process.execPath, ["--experimental-strip-types", fileURLToPath(import.meta.url)],
      { env: { ...process.env, ICON_MODULE: f }, encoding: "utf8" });
    const n = (r.stdout.match(/^ {2}FAIL/gm) || []).length;
    if (r.status === 0) { console.log("NOT RED: " + name); notRed++; } else console.log("red " + n + ": " + name);
  }
  process.exit(notRed ? 1 : 0);
}

const { pngSize, markIsWide, squareFor } = await import(process.env.ICON_MODULE || real);

let ok = 0; const bad = [];
const check = (what, good, detail) => {
  if (good) { ok++; console.log("  ok   " + what); }
  else { bad.push(what); console.log("  FAIL " + what + (detail ? "  — " + detail : "")); }
};

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td) >>> 0);
  return Buffer.concat([len, td, crc]);
}
function png(w, h) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;                    // 8-bit RGBA
  const rows = Buffer.alloc((w * 4 + 1) * h);  // every row: filter 0, transparent
  return "data:image/png;base64," + Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr), chunk("IDAT", deflateSync(rows)), chunk("IEND", Buffer.alloc(0)),
  ]).toString("base64");
}

const WIDE = png(640, 120), SQUARE = png(200, 200), BADGE = png(150, 100), JUST = png(151, 100), TALL = png(100, 400);
const ICON = png(256, 256);

console.log("1 · the size is read from the picture's own header");
const s = pngSize(WIDE);
check("a 640×120 mark reads as 640 wide and 120 high", s && s.w === 640 && s.h === 120, JSON.stringify(s));
check("…and so does a tall one, the other way round", JSON.stringify(pngSize(TALL)) === JSON.stringify({ w: 100, h: 400 }));
check("nothing stored reads as no size", pngSize(null) === null);
check("a picture that is not a PNG reads as no size", pngSize("data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJ") === null);

console.log("2 · wide is wide, and only wide");
check("a word-mark is wide", markIsWide(WIDE) === true);
check("a square mark is not", markIsWide(SQUARE) === false);
check("a 3:2 badge is not (the line itself)", markIsWide(BADGE) === false);
check("…a hair past it is", markIsWide(JUST) === true);
check("a tall mark is not wide", markIsWide(TALL) === false);
check("no mark is not wide", markIsWide(null) === false);
check("an unreadable mark is never CALLED wide", markIsWide("data:image/png;base64,AAAA") === false);

console.log("3 · what the small square draws");
check("its own icon, whatever the mark", squareFor({ mark: WIDE, icon: ICON }) === ICON);
check("…even with a square mark beside it", squareFor({ mark: SQUARE, icon: ICON }) === ICON);
check("a square mark, where there is no icon", squareFor({ mark: SQUARE, icon: null }) === SQUARE);
check("NOT a wide mark — initials instead", squareFor({ mark: WIDE, icon: null }) === null);
check("nothing at all — initials", squareFor({ mark: null, icon: null }) === null);
check("an icon on a client with no mark", squareFor({ mark: null, icon: ICON }) === ICON);

console.log("\n" + ok + " ok, " + bad.length + " failing");
if (bad.length) process.exit(1);
