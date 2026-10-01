/* WHAT RELEASE THIS IS, AS A FACT ABOUT WHAT THE BROWSER RECEIVES (§397).

   §258's "A newer version of the platform is ready" hears about a release
   only through the browser noticing that /sw.js has CHANGED. The served
   worker is generated from the frozen one with its version name dropped
   (§316.10), so from spec 054 on it was byte-identical in every release,
   and the banner never fired for anybody (§365, §367 and §379 each recorded
   it as residue). The fix is to stamp the worker with THIS: a hash of every
   file a tab holds on to, so a release that changes any of them changes
   /sw.js, and a release that changes none of them does not offer a reload
   nobody needs.

   CONTENT, NEVER THE COMMIT: `public/sw.js` is tracked and
   checks/generated-in-step.mjs regenerates and compares it, so the stamp
   must come out the same every time the same sources are built. A commit
   id would change on every commit, including one that only edits the
   record, and every such commit would read as stale.

   WHAT A TAB HOLDS: every file in public/ except the worker itself (which
   would make the stamp depend on itself), the shell's own pieces in shell/,
   and lib/shell.ts, which writes the document around them. Server code a
   tab does not hold is left out on purpose: a release that only changes an
   endpoint needs no reload, and offering one anyway teaches people to
   dismiss the banner. */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir, out){
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

export function stampedFiles(root = APP){
  return [...walk(join(root, "public"), []), ...walk(join(root, "shell"), []), join(root, "lib", "shell.ts")]
    .map((p) => relative(root, p).split("\\").join("/"))
    .filter((r) => r !== "public/sw.js")
    .sort();
}

export function releaseStamp(root = APP){
  const h = createHash("sha256");
  for (const r of stampedFiles(root)) {
    h.update(r); h.update("\0");
    h.update(readFileSync(join(root, r))); h.update("\0");
  }
  return h.digest("hex").slice(0, 16);
}
