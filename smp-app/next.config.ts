import type { NextConfig } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* THE SECURITY HEADERS CROSS TO THE NEW STACK, READ AND NEVER RETYPED
   (§43.6, spec 043 Phase J). The frozen deployment sets eight headers on
   every path from `vercel.json`, and the rule that came with them is that
   they are written once and read from there — `scripts/dev-server.js` has
   read that same block since §43.6 rather than keeping a copy. Measured on
   the built app before this existed: the door, the landing, `/sw.js` and
   every stylesheet came back with NONE of them, because the only surface
   setting any was the shell's own route (lib/shell.ts). A cutover that
   quietly dropped HSTS and the policy from the sign-in page would be a
   security regression arriving as a deployment detail.

   TWO SETS, BECAUSE TWO OF THE EIGHT ARE PER SURFACE, and they are kept
   DISJOINT rather than layered: what is set here is never set by the route
   that serves the same path.
     · The six that are the same everywhere go on `/(.*)`, and the shell's
       own route stops repeating them (lib/shell.ts).
     · `Content-Security-Policy` and `Referrer-Policy` go on the DOOR and the
       LANDING only — the React surfaces, which have no route handler of
       their own and need `'unsafe-inline'` for Next's own bootstrap script.
       The shell and Forefront's page set both themselves: a stricter
       `script-src` (§315.3) and `same-origin`, which is how the state API
       learns which client is asking (lib/shell.ts's own note).
   WHICH WINS WHEN BOTH SET ONE IS NOT RELIED ON. Measured here a config
   header replaced a route's rather than joining it — one header out, not
   two — and it did not read the same way for every key, which is exactly
   why a POLICY is the wrong place to lean on an internal precedence: an
   unscoped policy here would either replace the shell's stricter one or be
   intersected with it, and both readings end with the shell losing
   something it set on purpose. So the two sets do not overlap, and
   checks/shell.mjs asserts each surface carries every header exactly once
   and the RIGHT policy.
   The slug pattern is the frozen file's, with `platform` excluded by name,
   because that path is a route handler with a policy of its own. */
const frozen = JSON.parse(readFileSync(join(import.meta.dirname, "..", "vercel.json"), "utf8"));
const all = frozen.headers.find((h: { source: string }) => h.source === "/(.*)");
if (!all) throw new Error("next.config: vercel.json no longer carries the /(.*) header block — nothing is guessed at");
const named = (k: string) => {
  const h = all.headers.find((x: { key: string }) => x.key.toLowerCase() === k.toLowerCase());
  if (!h) throw new Error("next.config: vercel.json no longer sets " + k);
  return h;
};
const PER_SURFACE = ["content-security-policy", "referrer-policy"];
const EVERYWHERE = all.headers.filter((h: { key: string }) => !PER_SURFACE.includes(h.key.toLowerCase()));
const DOOR = PER_SURFACE.map(named);
const SLUG = "/:slug((?!platform$)[a-z0-9][a-z0-9-]{0,48})";
/* The worker is revalidated on every navigation or it is the cache-by-name
   trap wearing a different hat (§91); the frozen file says so and this reads
   it from there too. */
const sw = frozen.headers.find((h: { source: string }) => h.source === "/sw.js");
if (!sw) throw new Error("next.config: vercel.json no longer carries the /sw.js block");
/* And the manifest's own type, from the same file: a manifest served as
   something else is ignored, and a page that links one and is not installable
   looks exactly like a page that never linked it (§26, Phase J). */
const man = frozen.headers.find((h: { source: string }) => h.source === "/manifest.webmanifest");
if (!man) throw new Error("next.config: vercel.json no longer carries the /manifest.webmanifest block");

const nextConfig: NextConfig = {
  /* The Prisma client and the pg driver must stay server-side. */
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  /* lib/frozen.cjs reads the frozen product's sources at runtime (D4): they
     are part of the server's files wherever it is packed. */
  outputFileTracingIncludes: { "/**": ["../SMP-Project-Folder/src/*.js", "./lib/rules.cjs", "./shell/body.html", "./shell/platform.html", "../db/seed-state.json"] },
  async headers() {
    return [
      { source: "/(.*)", headers: EVERYWHERE },
      { source: "/", headers: DOOR },
      { source: SLUG, headers: DOOR },
      { source: SLUG + "/sign-in", headers: DOOR },
      { source: "/sw.js", headers: sw.headers.filter((h: { key: string }) => h.key.toLowerCase() === "cache-control") },
      { source: "/manifest.webmanifest", headers: man.headers },
    ];
  },
};

export default nextConfig;
