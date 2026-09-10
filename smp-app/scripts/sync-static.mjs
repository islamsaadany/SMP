/* THE INSTALLABLE HALF, CARRIED (spec 043 Phase J, §26).

   The frozen deployment serves a manifest and four icons from the repository
   root, and both the gate and the platform link them: that is what lets
   somebody add SMP to a home screen, and on an iPhone being on the home
   screen is the ONLY way a push notification is ever delivered (§282.2's own
   note about Apple). Islam answered stop point C with *notifications keep
   working*, so the manifest crosses with the worker or the answer is only
   true on a laptop.

   THE OFFLINE COPY DOES NOT COME WITH IT, and that is the plan's line 47
   standing: the worker has no fetch handler, so nothing is held on disk and
   Chrome will not offer its own install prompt (it wants one). What survives
   is *Add to Home Screen*, which is the route that matters here.

   The manifest needs no editing — it was already client-neutral, `start_url`
   and `scope` both "/" — so it is COPIED, byte for byte, rather than
   rewritten: the two must not drift while both deployments exist.

     node scripts/sync-static.mjs      (re-run if the manifest or icons change)
*/
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..", "..");
const PUB = join(here, "..", "public");
const FILES = ["manifest.webmanifest", "favicon.svg", "favicon.png",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png"];

mkdirSync(join(PUB, "icons"), { recursive: true });
let n = 0;
for (const f of FILES) {
  const from = join(ROOT, f);
  if (!existsSync(from)) throw new Error("sync-static: " + f + " is not at the repository root — nothing is guessed at");
  writeFileSync(join(PUB, f), readFileSync(from));
  n++;
}
/* ── AND THE SECURITY HEADERS CROSS WITH THEM (§317.6) ─────────────────
   `next.config.ts` read the frozen `vercel.json` at `../vercel.json`,
   relative to its own file — which is right on a laptop and wrong on Vercel,
   because Next COMPILES the config into a different directory before running
   it, so "one above" is somewhere else. It found *a* vercel.json without a
   `headers` key and fell over on `Cannot read properties of undefined`, three
   steps into a build that had just applied the schema.

   So the header block is CARRIED INTO THE APP here, beside the manifest and
   the icons and for the same reason: a file the build needs is a file the
   build writes into `smp-app/`, never one it reaches out of the folder for at
   a moment it does not control. Read once, asserted here where the failure
   can name itself, and written where the config can only find one file.

   §43.6's rule is unchanged and this is what keeps it: the headers are still
   the frozen file's, never retyped. */
const HEADERS_OUT = join(here, "..", "security-headers.json");
const EIGHT = ["Content-Security-Policy", "X-Frame-Options", "X-Content-Type-Options", "Referrer-Policy",
               "Strict-Transport-Security", "Permissions-Policy", "Cross-Origin-Opener-Policy", "X-DNS-Prefetch-Control"];
const complete = (sec) => sec && sec.all && sec.all.headers &&
  EIGHT.every((k) => sec.all.headers.some((h) => h.key.toLowerCase() === k.toLowerCase())) &&
  sec.sw && sec.manifest;

/* THE FROZEN vercel.json IS NOT READABLE DURING A VERCEL BUILD, and that is a
   fact about the host rather than a bug to route around (§317.7). With a Root
   Directory set, the `vercel.json` sitting at the build root is VERCEL'S OWN
   resolved config — it has no `headers` — so both the config's read of
   `../vercel.json` (§317.6) and this one found a file of that name carrying
   nothing. Moving the read earlier did not help, because it is the same file.

   SO THE CARRY HAPPENS WHERE THE SOURCE EXISTS AND THE RESULT IS COMMITTED,
   the way public/platform-page.js already is. On a laptop this regenerates
   from the frozen file and any drift lands in the diff; on Vercel the source
   is absent and the committed file is used as it stands. §43.6's rule is
   intact either way — the headers are the frozen file's and are never
   retyped; what moved is WHEN they are read.

   AND THE BUILD STILL REFUSES A FILE THAT IS MISSING OR SHORT. That is the
   assertion worth keeping: a header dropped from the frozen file reaches this
   through the regenerate-and-commit step, and a build that somehow has no
   carried file at all stops here rather than serving a site with no policy on
   it — which is what §316.10 measured and what this whole block exists for. */
let SECURITY = null;
try {
  const vj = JSON.parse(readFileSync(join(ROOT, "vercel.json"), "utf8"));
  const block = (source) => (vj.headers || []).find((h) => h.source === source);
  const from = { all: block("/(.*)"), sw: block("/sw.js"), manifest: block("/manifest.webmanifest") };
  if (complete(from)) SECURITY = from;
} catch { /* not readable here — the committed file is the answer */ }

if (SECURITY) {
  writeFileSync(HEADERS_OUT,
    JSON.stringify({ _: "GENERATED by scripts/sync-static.mjs from the repository root's vercel.json (§43.6, §317.6). Committed, because the source is not readable during a Vercel build (§317.7). Do not edit.", ...SECURITY }, null, 2) + "\n");
  console.log("wrote security-headers.json — the eight §43.6 headers, from the repository root's vercel.json");
} else {
  let carried = null;
  try { carried = JSON.parse(readFileSync(HEADERS_OUT, "utf8")); } catch { /* named below */ }
  if (!complete(carried))
    throw new Error("sync-static: the frozen vercel.json is not readable here AND smp-app/security-headers.json is missing or short — run `node scripts/sync-static.mjs` where the repository root's vercel.json exists, and commit the result (§43.6, §317.7)");
  console.log("carried security-headers.json as committed — the frozen vercel.json is not readable in this build context (§317.7)");
}
n++;

/* THE ONE ASSERTION WORTH MAKING ABOUT IT: every icon the manifest names has
   to be one of the files that just crossed, or the manifest points at a 404
   and the page is installable-looking and not installable. */
const man = JSON.parse(readFileSync(join(PUB, "manifest.webmanifest"), "utf8"));
for (const i of man.icons || []) {
  if (!existsSync(join(PUB, i.src.replace(/^\//, "")))) throw new Error("sync-static: the manifest names " + i.src + " and it did not cross");
}
console.log("wrote public/ —", n, "files carried from the repository root;", (man.icons || []).length, "icons the manifest names, all present");
