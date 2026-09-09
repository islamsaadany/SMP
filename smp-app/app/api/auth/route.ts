import { NextResponse } from "next/server";
import { doorPool, signOut } from "../../../lib/auth.ts";
import { requestToken } from "../../../lib/session.ts";

export const dynamic = "force-dynamic";

/* THE FROZEN SPELLING OF THE DOOR'S ACTIONS. sync.js posts `{action}` to
   /api/auth (the frozen api/auth.js's one-endpoint shape). The door itself
   is the routes beside this (contracts §2); this answers the shell's own
   spelling. `logout` is the one the shell needs to run at all (Sign out on
   the chrome); the register's actions — setPassword, issueTemporary,
   passwordStates, dismissWhere, declarations — are Setup's, Phase E, and
   until then are refused IN WORDS rather than left to a 404 that reads as a
   broken button (§171). */
const json = (code: number, body: unknown) => NextResponse.json(body, { status: code, headers: { "Cache-Control": "no-store" } });
const LATER = new Set(["setPassword", "issueTemporary", "passwordStates", "dismissWhere", "declarations"]);

export async function POST(req: Request) {
  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  const action = String(body.action || "");
  if (action === "logout") {
    await signOut(doorPool(), requestToken(req));
    return json(200, { ok: true });
  }
  if (LATER.has(action)) return json(200, { ok: false, error: "The People register's " + action + " is not in the new platform yet — it opens with the Setup screen group." });
  return json(400, { ok: false, error: "Unknown action." });
}
