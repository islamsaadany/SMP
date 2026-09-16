/* ── WHAT THE CLIENT WEARS, ASKED ONCE (spec 046 §4.1, §354) ─────────────
   Branding is the SPINE's: a module should get the client's colour for
   nothing, the way it gets the door and the session. It was not getting it.
   Measured before this file existed: Strategy wore the tenant's bar colour,
   the trial module read it for itself, and Insights carried the shipped navy
   as a literal with no reader at all — so a client who had chosen a colour
   saw it on two screens out of three, and the third was not wrong by accident
   but by there being nowhere to ask.

   ONE ANSWER, TWO WAYS OF GETTING IT, and the difference is where the graph
   already is rather than what the rule is (§53.5):
     · `barFrom(value)` is the rule — what counts as a colour and what a
       client who has chosen none wears. Every caller ends here.
     · `barFor(tenantId)` is that rule plus the one small read, for a module
       that has no reason to load the whole graph. Insights lists a library;
       loading thirty tables for a colour would be a page slower for nothing.
   A module holding the graph already (the trial module reads it for its
   count) asks `barFrom` and makes no second query.

   THE DEFAULT IS THE ABSENCE OF A CHOICE, never a copy of one (§50.6): it is
   what config-data.js's BRAND_DEFAULT ships, so a tenant that has never opened
   Branding wears this everywhere, and a tenant that HAS wears theirs
   everywhere. Neither is a module's decision.

   AND A COLOUR MAY NEVER STOP A PAGE DRAWING. A database that will not answer
   gives the default and the library still lists (§231.3's rule, one layer in:
   a dependency must not be able to take down the feature it decorates). */
import { withTenant } from "./tenant.ts";

export const BAR_DEFAULT = "#16325C";

/* Six hex digits and nothing else. A stored value outside that is not
   corrected and not drawn — it is simply not a colour, and the client wears
   what they wear when they have chosen none (§96.2: nothing stored is
   rewritten, here or anywhere). */
export function barFrom(value: unknown): string {
  /* THE CHECK'S BREAK: a build that wore the shipped navy whatever the client
     chose is the fault this file was written for, and it must turn
     checks/modules.mjs red (§94.5). Never set on a deployment. */
  if ((typeof process !== "undefined" ? process.env.SMP_BREAK || "" : "") === "module-own-colour") return BAR_DEFAULT;
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value : BAR_DEFAULT;
}

/* One column of one row, under the client's own tenant setting — never
   `readState`, which is the whole graph. `org` is a singleton keyed by
   tenant alone (§316.7), so there is no id to name and no row is a real
   answer: a client with no plan yet has no org row and wears the default. */
export async function barFor(tenantId: string): Promise<string> {
  try {
    const bar = await withTenant(tenantId, async (c) => {
      const r = await c.query("SELECT extra->'branding'->>'bar' AS bar FROM org");
      return r.rows[0] ? r.rows[0].bar : null;
    });
    return barFrom(bar);
  } catch {
    return BAR_DEFAULT;
  }
}
