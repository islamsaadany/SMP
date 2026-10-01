/* ── WHO IS LOOKING AT THE LIBRARY, AND WHAT THEY HAVE IN IT ─────────────
   Two answers the spine owes every surface that draws the reports: WHO is
   asking (spec 046 §4.10), and — for the tab's filter row — WHICH CATEGORIES
   that person actually has anything under (§385).

   IT IS ONE ANSWER BECAUSE IT WAS THREE. `viewerOf` was written in
   modules/insights/index.ts, copied into lib/landing-facts.ts under a comment
   NAMING the copy (*"modules/insights/index.ts's own rule"*), and the stamp
   below would have been the third. A rule about who may read what, written
   out three times, is §53.5 with a disclosure on the end of it: the day the
   seat list grows or the place lookup changes, two of the three are corrected
   and the third quietly widens. One function, three callers.

   IT LIVES BESIDE `library.ts` RATHER THAN IN IT, deliberately: that file is
   driver-free — it takes a connection and imports nothing — which is what
   lets checks/insights-tab.mjs run its first three sections with no database
   and no `node_modules` at all (§54.5: a section that cannot run is not a
   section that passed). This one opens a tenant connection, so it is its own
   file, the way lib/library-file.ts already is. */
import { withTenant } from "./tenant.ts";
import { categoriesPresent, type Category, type Viewer } from "./library.ts";

/* THE OFFICE READS EVERYTHING, AND IT IS THE SEAT THAT SAYS SO. Whoever holds
   this client's Super user or SMO team seat sees every report whatever its
   list says — which on every client today is us, because there is no
   client-side strategy office (Islam, 2026-09-15). Written against the seat
   rather than against who employs somebody, since the seat is the only one of
   the two the platform holds.

   WHERE THEY SIT IS ASKED OF THE SPINE, never worked out here: the register is
   the client's and no module's (spec 046 §4.1, lib/place.ts).

   NEITHER BRANCH THAT ALREADY KNOWS THE ANSWER ASKS THE DATABASE. A seat that
   sees everything is not asked where it sits, because nothing about the place
   could change what it reads — and it cannot then disagree with the seat.
   Nobody on the register has no place to look up, which is not an optimisation
   but the same answer arrived at without a connection: an office login opening
   a client before `officeRow` has minted them a row (§313.32) is exactly that
   person, and every request they make would otherwise open a tenant connection
   to be told null. Found by checks/modules.mjs, which drives each module's
   server with no database at all and went red on it. */
export async function viewerFor(tenantId: string, seat: string | null | undefined,
                                personKey: string | null | undefined): Promise<Viewer> {
  if (seat === "super" || seat === "smoteam") return { place: null, seesAll: true };
  if (!personKey) return { place: null, seesAll: false };
  const { placeOf } = await import("./place.ts");
  return { place: await withTenant(tenantId, (c) => placeOf(c, personKey)), seesAll: false };
}

/* WHAT THE PLATFORM DOCUMENT CARRIES FOR THE REPORTS TAB (§385), in the shape
   lib/shell.ts stamps: the categories this person has reports under, `[]` for
   a library with nothing filed yet, and **null where there is no library
   behind the tab at all** — a client without the module, or somebody it is
   shut to — which is what draws no tab (§61, the switcher's own rule).

   THE THREE ANSWERS ARE NOT TWO, AND THE MIDDLE ONE IS THE POINT: `[]` still
   draws the tab, because the module IS this client's and an empty library is
   a beginning rather than a fault (§45.2) — it draws no filters, which is the
   whole of what was asked for.

   `have` IS ALREADY THE MODULES THIS PERSON MAY OPEN (openableModules, the
   same list the switcher and the landing read), so this asks no second time
   and cannot answer differently from the row of tabs beside it (§42). */
export async function libraryStampFor(tenantId: string, seat: string | null | undefined,
                                      personKey: string | null | undefined,
                                      have: readonly string[]): Promise<Category[] | null> {
  if (!have.includes("insights")) return null;
  return categoriesFor(tenantId, await viewerFor(tenantId, seat, personKey));
}

/* THE SAME QUESTION THE MODULE'S OWN PAGE ASKS (§385, §53.5). Two hosts draw
   that filter row — the tab inside the platform and the module's page — and
   they must offer the same categories or one of them is lying about the same
   library. One function, so the answer cannot be arrived at twice.

   A LIBRARY WE COULD NOT READ IS NOT A LIBRARY WITH NOTHING IN IT (§93), and
   it is not a reason to withhold the tab either: the pane asks for the rows
   itself and says so in its OWN words when that fails (§231.4). No filters is
   the honest thing to draw while we do not know — never a row of five
   categories we cannot say anything about. */
export async function categoriesFor(tenantId: string, viewer: Viewer): Promise<Category[]> {
  try {
    return await withTenant(tenantId, (c) => categoriesPresent(c, "insights", viewer));
  } catch (e) {
    console.error("library categories:", (e as Error).message);
    return [];
  }
}
