import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
/* Not built in the new platform yet (spec 043 phases.md: Phase E, Setup — the store).
   Answered in words at 200 — the shell reads `ok`, and a browser prints a console error for every non-2xx (which qa.py counts as the product's) — so the shell's own callers
   land on their refused branch and nothing reads as a broken control. */
const said = { ok: false, error: "This part is not in the new platform yet." };
export async function GET() { return NextResponse.json(said, { status: 200, headers: { "Cache-Control": "no-store" } }); }
export async function POST() { return NextResponse.json(said, { status: 200, headers: { "Cache-Control": "no-store" } }); }
