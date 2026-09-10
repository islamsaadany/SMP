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
/* THE ONE ASSERTION WORTH MAKING ABOUT IT: every icon the manifest names has
   to be one of the files that just crossed, or the manifest points at a 404
   and the page is installable-looking and not installable. */
const man = JSON.parse(readFileSync(join(PUB, "manifest.webmanifest"), "utf8"));
for (const i of man.icons || []) {
  if (!existsSync(join(PUB, i.src.replace(/^\//, "")))) throw new Error("sync-static: the manifest names " + i.src + " and it did not cross");
}
console.log("wrote public/ —", n, "files carried from the repository root;", (man.icons || []).length, "icons the manifest names, all present");
