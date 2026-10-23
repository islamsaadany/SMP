/* THE SHARED TOP BAR'S SCRIPT (§444, lib/topbar.ts). Served from the app
   rather than written into public/, because public/ is generated from the
   frozen product and checked to be in step with it (checks/generated-in-step
   .mjs) — a hand-written file there would be the one copy nothing generates.
   A file, never inline: the module pages' policy is `script-src 'self'`. */
import { TOPBAR_SCRIPT, TOPBAR_STAMP } from "../../lib/topbar.ts";

/* §606: the address the pages write carries the script's own hash, and THAT
   address is cached for good; any other (a page from before, a stale hash)
   is asked about every time, as every address was before. */
export function GET(req: Request) {
  const current = new URL(req.url).searchParams.get("v") === TOPBAR_STAMP;
  return new Response(TOPBAR_SCRIPT, {
    status: 200,
    headers: { "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": current ? "public, max-age=31536000, immutable" : "no-cache" },
  });
}
