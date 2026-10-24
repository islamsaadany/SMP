/* §620 — THE NEXT PAGE'S SHAPE, DRAWN AT THE PRESS (lib/navskel.ts), for the
   two documents that do not load the shared top bar: the console and the
   Strategy document. Served from the app rather than written into public/,
   for /topbar.js's own reason (app/topbar.js/route.ts). The address the
   pages write carries the script's hash and THAT address is cached for good;
   any other is asked about every time. */
import { NAVSKEL_SCRIPT, NAVSKEL_STAMP } from "../../lib/navskel.ts";

export function GET(req: Request) {
  const current = new URL(req.url).searchParams.get("v") === NAVSKEL_STAMP;
  return new Response(NAVSKEL_SCRIPT, {
    status: 200,
    headers: { "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": current ? "public, max-age=31536000, immutable" : "no-cache" },
  });
}
