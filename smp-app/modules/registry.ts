/* ── WHO DRAWS A MODULE'S PAGE (spec 046 §4.2, closing §345's open item) ──
   The route used to choose with a chain of ifs, under a comment saying why:
   *a branch rather than a table because there are two of them; a third makes
   the table worth having.* Insights made three, and the branch grew an eighth
   line underneath that sentence — so the file said one thing and did another
   (§104.8's family). This is the table the sentence promised.

   WHAT IT BUYS IS NOT TIDINESS. A chain answers "what happens at this
   address" by being read top to bottom, and every module added is another
   reader of the route's own file — which is how the fourth module comes to
   need the route edited, the switcher edited and Setup edited for one thing
   (§53.5). Here a module says how it serves itself IN ITS OWN FOLDER, and the
   route asks.

   WHAT A MODULE IS GIVEN, and nothing else (spec 046 §5's first open point,
   answered as far as this seam goes): the request, the client's slug, its
   tenant id, its name, the modules it has, the address INSIDE the module, and
   WHO IS LOOKING — their key on this client's register and the seat they hold
   on it. It is handed no pool, no session and no registry row — a module
   reaches the client's data through `withTenant` like everything else, so the
   tenant boundary stays the one line it has always been (§313, §314).

   THE LIST GREW BY TWO ON PURPOSE (spec 046 §4.10, 2026-09-15) and that is
   worth saying out loud, because a list that grows without anybody noticing
   stops being a boundary. A report may be narrowed to one function or three,
   so Insights has to know who is reading — and it is given the KEY and the
   SEAT rather than the person's row, because those are the two facts the door
   has already established and everything else about that person is the
   register's to answer (lib/place.ts). A module that wanted more would be a
   module asking the spine to hand over its own subject.

   THE LIST IS PARTIAL ON PURPOSE. Only a BUILT module has a server; Portfolio
   and Processes are words the address reserves and nothing more (lib/modules.ts
   MODULE_DEF). That the two lists agree — every built module serves itself,
   and no unbuilt one claims to — is asserted in checks/modules.mjs rather than
   trusted, because a module marked built with nothing to draw is precisely the
   door onto the wrong room that flag exists to stop (§61). */
import type { ModuleKey } from "../lib/modules.ts";
import { serve as strategy } from "./strategy/index.ts";
import { serve as insights } from "./insights/index.ts";
import { serve as trial } from "./trial/index.ts";

export type ServeArgs = {
  req: Request;
  slug: string;
  /* The module being served. A SPINE segment (`setup`, `tour`) has none and
     arrives here as the default, because the frozen platform is where Setup
     is drawn today — which is the spine/module line still being implicit, and
     is named here rather than hidden (spec 046 §5). */
  module: ModuleKey;
  tenantId: string;
  tenantName: string;
  /* The modules THIS PERSON may open here (§356.5): the client's own list
     narrowed by each module's grant (lib/access.ts openableModules), which is
     what a switcher may list — a module shut to somebody by its address is
     not offered to them either (spec 054 §6.4). */
  have: ModuleKey[];
  /* The path INSIDE the module, the module's word already taken off. */
  rest: string[];
  /* WHO IS LOOKING, as the door answered it. `personKey` is their row on THIS
     client's register and is null for somebody the register has not placed —
     an office login opening a client by rule, before `officeRow` has minted
     them one (§313.32, §316.9). `seat` is `super`, `smoteam` or `none` on this
     client, and null where the door resolved no membership at all. */
  personKey: string | null;
  seat: "super" | "smoteam" | "none" | null;
};
export type ModuleServer = (a: ServeArgs) => Promise<Response>;

/* THE CHECK'S BREAK (constitution XVI, lib/modules.ts's own shape): a module
   marked built with nothing to draw must turn checks/modules.mjs red before
   its green run is believed (§94.5). Never set on a deployment. */
const BREAK = typeof process !== "undefined" ? process.env.SMP_BREAK || "" : "";

export const SERVERS: Partial<Record<ModuleKey, ModuleServer>> =
  BREAK === "no-server" ? { strategy, trial }
  /* Two words pointing at one page — the door onto the wrong room, wired
     rather than guessed at. It renders perfectly, which is why the check
     DRIVES each server rather than reading the table (§96). */
  : BREAK === "wrong-server" ? { strategy, insights: strategy, trial }
  : { strategy, insights, trial };

/* Null is "nothing here draws that", which the route answers as Not found
   rather than falling back to the Strategy shell: a module word that resolved
   to somebody else's platform is the fault above, arriving quietly (§42 fails
   closed). It cannot happen from a browser — `whereOf` only ever returns a
   module the client holds, and `modulesFor` only returns built ones — so this
   guards the day somebody marks a module built before it has a page. */
export function serverFor(key: ModuleKey): ModuleServer | null {
  return SERVERS[key] || null;
}
