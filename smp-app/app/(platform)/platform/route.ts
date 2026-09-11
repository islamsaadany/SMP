import { platformDocument, shellHeaders } from "../../../lib/shell.ts";

export const dynamic = "force-dynamic";

/* Forefront's own platform — platform.html served as it is (§313.3). The
   page asks /api/platform who is signed in and sends a stranger to the door
   itself, exactly as the frozen static file did; nothing is decided here. */
export async function GET() {
  return new Response(platformDocument(), { status: 200, headers: shellHeaders() });
}
