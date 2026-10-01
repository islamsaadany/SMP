/* EVERY RELEASE CHANGES /sw.js, SO AN OPEN TAB IS OFFERED THE RELOAD (§397).

   §258's banner learns of a release only through the browser seeing /sw.js
   change. From spec 054 until §397 the served worker was byte-identical in
   every release, so the banner never fired and nothing noticed, because
   nothing asserted that it could. This does, with no browser and no
   database:

     1. the served worker carries a release stamp, and it is the stamp of
        the files as they are now (a stale stamp is a release nobody hears);
     2. changing ANY file a tab holds changes the stamp, asked of every one
        of them in a scratch copy, never of one sample (§94.2);
     3. the stamp does not depend on the worker itself, or it could never
        settle, and it is the same on two builds of the same sources, or
        generated-in-step would call every commit stale;
     4. server code a tab does not hold is not in it (a reload offered for
        an endpoint change teaches people to dismiss the banner).

     node checks/release-stamp.mjs
     SMP_BREAK=no-stamp node scripts/build-sw.mjs && node checks/release-stamp.mjs   (must go red)
*/
import { readFileSync, mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { releaseStamp, stampedFiles } from "../scripts/release-stamp.mjs";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");
let ok = 0, bad = 0;
const ck = (cond, what, detail) => {
  if (cond) { ok++; console.log("  ok   " + what); }
  else { bad++; console.log("  FAIL " + what + (detail !== undefined ? "  — " + JSON.stringify(detail) : "")); }
};

const files = stampedFiles();
const sw = readFileSync(join(APP, "public", "sw.js"), "utf8");
const m = sw.match(/\/\* release ([0-9a-f]{16}) /);
const now = releaseStamp();

console.log("\n§1 · the served worker carries this release's stamp");
ck(!!m, "public/sw.js carries a release stamp", sw.slice(0, 120));
ck(m && m[1] === now, "and it is the stamp of the files as they are now (else run scripts/build-sw.mjs)", { served: m && m[1], now });

console.log("\n§2 · every file a tab holds moves the stamp");
ck(files.length >= 10, "the stamp covers the served files (a list of none would pass everything below)", files.length);
ck(files.includes("public/shell.js") && files.includes("public/platform.css") && files.includes("shell/body.html") && files.includes("lib/shell.ts"),
   "the four the platform page is made of are in it");
const tmp = mkdtempSync(join(tmpdir(), "smp-stamp-"));
try {
  for (const r of files) { mkdirSync(dirname(join(tmp, r)), { recursive: true }); copyFileSync(join(APP, r), join(tmp, r)); }
  mkdirSync(join(tmp, "public"), { recursive: true });
  writeFileSync(join(tmp, "public", "sw.js"), "one worker");
  const base = releaseStamp(tmp);
  ck(base === now, "a copy of the same files gives the same stamp (it is content, never the commit)", { base, now });
  const still = [];
  for (const r of files) {
    const p = join(tmp, r), was = readFileSync(p);
    writeFileSync(p, Buffer.concat([was, Buffer.from("\n")]));
    if (releaseStamp(tmp) === base) still.push(r);
    writeFileSync(p, was);
  }
  ck(!still.length, "changing any one of them changes the stamp", still);
  writeFileSync(join(tmp, "public", "sw.js"), "another worker");
  ck(releaseStamp(tmp) === base, "changing the worker itself does not (it cannot depend on itself)");
} finally { rmSync(tmp, { recursive: true, force: true }); }

console.log("\n§3 · what a tab does not hold is not in it");
ck(!files.some((r) => r.startsWith("lib/") && r !== "lib/shell.ts"), "no server module but the one that writes the document",
   files.filter((r) => r.startsWith("lib/")));
ck(!files.includes("public/sw.js"), "the worker is not in its own stamp");

console.log("\n" + ok + " ok, " + bad + " failed");
if (bad) { console.log("release-stamp: FAILED"); process.exit(1); }
console.log("release-stamp: all clear");
