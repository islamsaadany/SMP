/* THE SHARED TOP BAR'S SCRIPT (§444, lib/topbar.ts). Served from the app
   rather than written into public/, because public/ is generated from the
   frozen product and checked to be in step with it (checks/generated-in-step
   .mjs) — a hand-written file there would be the one copy nothing generates.
   A file, never inline: the module pages' policy is `script-src 'self'`. */
import { TOPBAR_SCRIPT } from "../../lib/topbar.ts";

export function GET() {
  return new Response(TOPBAR_SCRIPT, {
    status: 200,
    headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
