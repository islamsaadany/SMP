/* ── VIEWING AS SOMEBODY, ON A READ PATH (§383, §185) ────────────────────
   Islam, with the office's own session and the switcher set to a unit's
   custodian: *"karim from mobile is seeing the report while the report is
   made only for the retail and online team in the report settings."*

   HE WAS RIGHT, AND THE NARROWING ITSELF WAS NOT THE FAULT. The Insights
   module resolves who is asking from `ServeArgs.personKey` and `seat` — the
   two facts the DOOR established — and the door answers about the SIGN-IN.
   So with the office signed in, the office's seat answered, the office reads
   every report (spec 046 §4.10), and it did so whoever the switcher was
   pointing at. A person signing in themselves was filtered correctly the
   whole time (checks/insights.mjs).

   WHICH IS WHY IT MATTERS MORE THAN IT LOOKS: view-as is the mirror the
   office checks a narrowing IN. A mirror that shows your own face reports a
   rule that works as broken, and there is no way to tell from the screen.
   §185 is the same fault on the save path, in Islam's words then: *"the
   view-as function is not showing exactly what people see."*

   AT THE SEAM, NEVER INSIDE A MODULE. Every module that reads a person's
   data has this question, and a copy per module is four answers to one
   question (§53.5) — three of which would be written by somebody who had
   not met this section. So the route narrows `personKey` and `seat` once,
   before `mayOpenModule`, `openableModules` and the module itself, and every
   module is right by construction without knowing view-as exists.

   IT CAN ONLY EVER NARROW, which is §185's rule and the whole of why it is
   safe: the gate is the seat the SESSION holds, never one read out of
   anything the request carries, and what comes back is the seat the SIMULATED
   person holds — so the office's `super` becomes a client person's `none` and
   `seesAll` goes false. A session that cannot simulate is judged as itself.

   AN UNKNOWN KEY IS REFUSED, never treated as nobody. "Nobody" is a
   narrowing that hides a mistake instead of reporting it (§185's own words),
   and it would draw an empty library that reads exactly like a client with no
   reports published.

   IT COSTS NOTHING WHEN NOBODY IS SIMULATING: with no `viewAs` on the
   address — which is every request the product makes today except the
   Insights tab's, and that one only while the switcher is showing somebody
   else — this returns before it opens a connection. */
import type { Pool, PoolClient } from "pg";

type Q = Pool | PoolClient;
export type Seat = "super" | "smoteam" | "none" | null;
export type Who = { personKey: string | null; seat: Seat };
export type Narrowed = Who & { simulated?: boolean };

/* The three sentences are the frozen rule's, word for word (lib/rules.js
   actingFor), so a refusal reads the same whichever path met it. */
export const NOT_ALLOWED = "Only the SMO can act through somebody else's view.";
export const NO_SUCH_PERSON = "The register does not hold the person this view belongs to.";
export const NOT_THE_SUPER = "The SMO team cannot act through the Super user's view.";

export function viewAsOf(url: string): string {
  try { return (new URL(url).searchParams.get("viewAs") || "").trim(); } catch { return ""; }
}

/* THE DECISION IS PURE AND THE LOOKUPS ARE NOT (lib/access.ts's own shape,
   §355): every rule above is decided here, with no database and no request,
   so a check can ask it directly rather than standing up a client to find
   out what it thinks (§100.3). `narrowToViewed` is the two lookups and
   this. */
const brk = (): string => (typeof process !== "undefined" ? process.env.SMP_BREAK || "" : "");

/* ── AND THE SMO TEAM HOLDS IT TOO (§554) ─────────────────────────────
   Islam: *"I want to enable the smo team to have the drop down of view as
   for the other users on the platform."*

   THE TEAM ALREADY DOES THE WORK THE CONTROL IS FOR. They hold Setup, the
   register, the access matrix and the reporting cycle (§516.2) — so they are
   the people who set a narrowing and then need the mirror to check it in,
   and until now the mirror was the Super user's alone. A team member asking
   "does Karim actually see this report" had to ask somebody else to look.

   IT STILL ONLY EVER NARROWS, which is §185's rule and the whole of why
   simulating is safe — but "narrows" has a second meaning now that two seats
   can simulate. The view hands you the seat of the person you are looking
   THROUGH (`viewAsDecision` below), so an SMO team member wearing the Super
   user's view would hold the Super user's rights: the one person on a
   client's register who holds MORE than they do. That is not a simulation,
   it is a way up.

   SO THE CEILING IS YOUR OWN SEAT, and with only two office seats that is one
   sentence: the Super user may look through anybody, the SMO team through
   anybody but the Super user. Islam's pick of three put to him with the cost
   of each stated (rule 1c) — the alternatives were the whole register, and a
   view of the Super user that refuses every save, which buys a mirror nobody
   can act in and a second behaviour to explain.

   BOTH ENDS, OR IT IS HALF DONE (§94.2, §61): the lists are filtered to what
   this seat may look through — the frozen bar's (sync.js `maySimulatePerson`),
   the served bar's (modules/insights/index.ts `viewerList`) and the People
   register's row menu — so the refusal below is the backstop for a forged
   address rather than the thing anybody meets by pressing a control. */
export function maySimulate(me: Who): boolean {
  /* A build that let any seat act through somebody else's view. */
  if (brk() === "viewas-any-seat") return true;
  return me.seat === "super" || me.seat === "smoteam";
}

/* WHICH OF THEM, asked of the two seats rather than of a list of people, so
   the three lists and the refusal cannot disagree about one person (§42). */
export function maySimulateSeat(me: Who, theirSeat: Seat): boolean {
  if (!maySimulate(me)) return false;
  /* A build where the team's simulation took the Super user's seat — §185's
     own fault with the sign reversed: a widening rather than a narrowing. */
  if (brk() === "viewas-team-takes-super") return true;
  if (me.seat === "super") return true;
  return theirSeat !== "super";
}

export function viewAsDecision(
  me: Who, want: string, onRegister: boolean, theirSeat: Seat,
): Narrowed | { refuse: string } {
  const k = String(want || "").trim();
  if (!k || k === me.personKey) return me;
  if (!maySimulate(me)) return { refuse: NOT_ALLOWED };
  /* A build that read an unknown key as somebody with nothing — the
     narrowing that hides a mistake instead of reporting it (§185). */
  if (!onRegister && brk() !== "viewas-unknown-ok") return { refuse: NO_SUCH_PERSON };
  /* THE CEILING IS YOUR OWN SEAT (§554) — asked after the register, so an
     SMO team member who names a key that is not there is told THAT, which is
     the mistake they actually made. */
  if (!maySimulateSeat(me, theirSeat)) return { refuse: NOT_THE_SUPER };
  /* THE SEAT THEY HOLD, NOT THE ONE YOU HOLD — this is the narrowing, and
     `none` is the ordinary answer, because nobody on a client's register
     holds a seat unless somebody put them on the account team. */
  /* THE FAULT ITSELF, PUT BACK: a build that narrowed the person and kept
     the OFFICE's seat, so `seesAll` stayed true and every narrowed report
     read as everyone's — which is what Islam was shown. */
  if (brk() === "viewas-keeps-seat") return { personKey: k, seat: me.seat, simulated: true };
  return { personKey: k, seat: theirSeat || "none", simulated: true };
}

export async function narrowToViewed(
  door: Q, tenantId: string, me: Who, viewAs: string,
): Promise<Narrowed | { refuse: string }> {
  const want = String(viewAs || "").trim();
  if (!want || want === me.personKey) return me;
  if (!maySimulate(me)) return viewAsDecision(me, want, false, null);
  /* IMPORTED WHERE IT IS USED, so the rules above can be asked with no
     database and no driver at all (lib/landing-facts.ts's own shape): a
     top-level value import would pull `pg` in through tenant.ts and make a
     pure decision untestable without one (§100.3). */
  const { withTenant } = await import("./tenant.ts");
  const onRegister = await withTenant(tenantId, async (c) => {
    const r = await c.query("SELECT key FROM people WHERE key = $1", [want]);
    return !!r.rowCount;
  });
  /* Ordered so the strongest wins where two accounts somehow point at one
     person: that is the seat a sign-in of theirs could produce, and guessing
     lower would show them less than they actually see. */
  const row = onRegister ? (await door.query(
    "SELECT seat FROM tenant_users WHERE tenant_id = $1 AND person_key = $2 " +
    "ORDER BY CASE seat WHEN 'super' THEN 0 WHEN 'smoteam' THEN 1 ELSE 2 END LIMIT 1",
    [tenantId, want])).rows[0] : null;
  return viewAsDecision(me, want, onRegister, (row && row.seat) || null);
}
