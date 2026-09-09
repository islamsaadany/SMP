import { NextResponse } from "next/server";
import { doorPool } from "../../../../lib/auth.ts";
import { memberships } from "../../../../lib/door.ts";
import { withTenant } from "../../../../lib/tenant.ts";
import { requestUser } from "../../../../lib/session.ts";

/* THE DOOR'S OWN QUESTION (§56, §57, §93.13): where does this person say they
   work. GET builds the list under the person's one tenant — their own
   Official BU's units and functions first, everything else under it, and
   `settled` when the register has already placed them, so the card asks
   nothing. POST stores the declaration, which grants nothing (the SMO
   accepts it on People); validated against the same list. api/auth.js's
   whereList and declareWhere, ported, and the one route added beside
   contracts §2's four. */
async function tenantOf(user: { id: string; kind: string }): Promise<{ id: string; personKey: string } | null> {
  if (user.kind !== "client") return null;
  const mine = await memberships(doorPool(), user.id);
  return mine.length === 1 ? { id: mine[0].tenant_id, personKey: mine[0].person_key } : null;
}
type Item = { at: string; name: string };
async function listFor(t: { id: string; personKey: string }) {
  return withTenant(t.id, async (c) => {
    const us = (await c.query("SELECT key, name, company FROM units WHERE active ORDER BY idx")).rows;
    const fs = (await c.query("SELECT key, name FROM functions WHERE active ORDER BY idx")).rows;
    const mine = (await c.query("SELECT at FROM bu_declarations WHERE person_key = $1", [t.personKey])).rows[0];
    const mb = (await c.query("SELECT extra->'mainbus' AS mainbus FROM org LIMIT 1")).rows[0];
    const rows: { name: string; at: unknown }[] = (mb && mb.mainbus) || [];
    const who = (await c.query("SELECT extra->>'mainbu' AS mainbu, unit_key, fn_key, extra->>'company' AS company FROM people WHERE key = $1", [t.personKey])).rows[0];
    const norm = (x: unknown) => String(x == null ? "" : x).trim().toLowerCase();
    const row = rows.filter((b) => norm(b.name) === norm(who && who.mainbu))[0];
    const raw: string[] = !row ? [] : (Array.isArray(row.at) ? row.at : row.at ? [row.at] : []).filter(Boolean) as string[];
    /* A company is not somewhere you say you work (§69.14): it stands for
       the units it holds. */
    const ats: string[] = [];
    raw.forEach((a) => {
      if (a.startsWith("co:")) { us.filter((u: any) => u.company === a.slice(3)).forEach((u: any) => { if (!ats.includes(u.key)) ats.push(u.key); }); return; }
      if (!ats.includes(a)) ats.push(a);
    });
    const units: Item[] = us.map((r: any) => ({ at: r.key, name: r.name }));
    const functions: Item[] = fs.map((r: any) => ({ at: "fn:" + r.key, name: r.name }));
    const offered = units.concat(functions).map((x) => x.at);
    const near = ats.filter((a) => offered.includes(a));
    const placed = !!(who && ((who.unit_key && who.unit_key !== "group") || who.fn_key || who.company));
    return { units, functions, offered, mainbu: (row && row.name) || null, near, settled: placed, mine: mine ? mine.at : null };
  });
}

export async function GET(req: Request) {
  const user = await requestUser(req);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const t = await tenantOf(user);
  if (!t) return NextResponse.json({ ok: true, settled: true });
  const l = await listFor(t);
  return NextResponse.json({ ok: true, units: l.units, functions: l.functions, mainbu: l.mainbu, near: l.near, settled: l.settled, mine: l.mine });
}
export async function POST(req: Request) {
  const user = await requestUser(req);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  const at = String(body.at || "").trim();
  const t = await tenantOf(user);
  if (!t || !at) return NextResponse.json({ ok: false, message: "Nothing to declare." }, { status: 400 });
  const l = await listFor(t);
  if (!l.offered.includes(at)) return NextResponse.json({ ok: false, message: "That is not a unit or a function here." }, { status: 400 });
  await withTenant(t.id, (c) => c.query(
    "INSERT INTO bu_declarations (person_key, at) VALUES ($1, $2) ON CONFLICT (tenant_id, person_key) DO UPDATE SET at = EXCLUDED.at, declared_on = now(), dismissed_on = NULL, dismissed_by = NULL",
    [t.personKey, at]));
  return NextResponse.json({ ok: true });
}
