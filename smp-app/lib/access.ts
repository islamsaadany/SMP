/* ── MAY THIS PERSON OPEN A MODULE (§359.5, spec 056 §4.4, research R3) ──
   The spine's gate in front of a module's address, and the one answer the
   landing's Your modules list and the switcher read too — a module shut to a
   role by its own address must be gone from that person's landing row and
   their switcher (spec 056 §6.4), and three surfaces asking three ways is how
   one of them comes to say yes while the door says no (§53.5).

   THREE RULES, IN ORDER, AND ONLY THE THIRD READS ANYTHING:
     1. A module with no declared area is open to everybody the door let in.
        Strategy declares none (its areas ARE the frozen matrix's, which the
        frozen product enforces page by page).
     2. The seat opens everything (spec 046 §4.10's own rule: whoever holds
        this client's Super user or SMO team seat reads the whole client).
     3. Otherwise the person's roles on the stored graph, through the frozen
        product's OWN reader (config-data.js mayOpenModuleArea, run in
        frozen.cjs) — the same function the module's Access page draws its
        cells from, so the cell and the door cannot disagree. An absent grant
        is the module's shipped state and never "none" (§30.2).

   THE MODULE SERVER NEVER LEARNS ABOUT GRANTS: the route asks this before
   serverFor(), and a refusal is the redirect an unknown module word already
   gets (§320.5 — one behaviour for "not a thing here", so a refused address
   tells nobody the module exists). */
import { createRequire } from "node:module";
import type { PoolClient } from "pg";
import { withTenant } from "./tenant.ts";
import { readState } from "./state-io.ts";
import { copilotGrant, storedCopilotGrant } from "./copilot.ts";
import { MODULE_DEF, modulesFor, isModule, type ModuleKey, type ModuleArea } from "./modules.ts";

const frozen = createRequire(import.meta.url)("./frozen.cjs") as {
  mayOpen: (graph: unknown, personKey: string, area: ModuleArea) => boolean;
};
type Seat = "super" | "smoteam" | "none" | null | undefined;

/* The area that OPENS a module: its first declared one. A module with
   several would still be opened by the first, said here so a second area
   added tomorrow is not read as a second door. */
export function openingArea(module: string): ModuleArea | null {
  if (!isModule(module)) return null;
  return MODULE_DEF[module].areas[0] || null;
}

/* PURE, given the graph — what checks/modules.mjs drives with the seed and
   no database (§100.3). `graph` null is a tenant holding no graph, which
   nobody can open anything of (§316.9): the shipped state answers, as it
   would for a person the register does not hold. */
/* Modules that are the office's by rule rather than by a cell: the Copilot
   (spec 064) and Processes (FFProcess, office only). A client's own person is
   refused them whatever any stored map reads. */
const OFFICE_ONLY = new Set<string>(["copilot", "processes"]);

export function decideOpen(seat: Seat, module: string, graph: unknown, personKey: string | null | undefined): boolean {
  const brk = process.env.SMP_BREAK || "";
  /* THE CHECK'S BREAK (constitution XVI): a gate that opened for everybody
     must turn checks/modules.mjs and checks/door-landing.mjs red before
     their green runs are believed (§94.5). Never set on a deployment. */
  if (brk === "gate-open") return true;
  const area = openingArea(module);
  if (!area) return true;
  /* THE COPILOT IS THE OFFICE'S BY RULE, NOT BY A CELL (spec 064; lib/
     copilot.ts copilotGrant): its one area is a column the client's own rows
     draw as a dash, so a client person is refused here whatever the stored
     map reads — the same answer as an address naming a module the client
     does not hold (§320.5). */
  if (OFFICE_ONLY.has(module)) return seat === "super" || seat === "smoteam";
  if (seat === "super" || seat === "smoteam") return true;
  if (!graph) return area.shipped !== "none";
  return frozen.mayOpen(graph, personKey || "", area);
}

/* ── WHAT A DOCUMENT READS OF ITS TENANT, ONCE (§668) ──────────────────
   The route asked the gate, then the switcher, then the library's stamp,
   and each opened a transaction of its own — the whole graph read TWICE,
   one after the other, before any HTML left. `OnTenant` is one connection
   the request already holds and the graph read at most once on it, shared
   by every reader of that request. `onTenant(c)` is made inside a
   withTenant; `offTenant(tenantId)` is the old shape — each read opens its
   own transaction, exactly as before — for the callers that hold none (the
   client's bare address, the console), so nothing they do changed. */
export type OnTenant = { c: PoolClient | null; graph: () => Promise<unknown>; copilotGrant: (seat: unknown) => Promise<string | null> };
export function onTenant(c: PoolClient): OnTenant {
  let g: Promise<unknown> | null = null;
  return { c, graph: () => (g ??= readState(c)), copilotGrant: (seat) => storedCopilotGrant(c, seat) };
}
function offTenant(tenantId: string): OnTenant {
  return { c: null,
    graph: () => withTenant(tenantId, (c) => readState(c)),
    copilotGrant: (seat) => withTenant(tenantId, (c) => storedCopilotGrant(c, seat)) };
}

export async function mayOpenModuleOn(on: OnTenant, seat: Seat, personKey: string | null | undefined, module: string): Promise<boolean> {
  const area = openingArea(module);
  if (!area || seat === "super" || seat === "smoteam") return decideOpen(seat, module, null, personKey);
  return decideOpen(seat, module, await on.graph(), personKey);
}
export function mayOpenModule(tenantId: string, seat: Seat, personKey: string | null | undefined, module: string): Promise<boolean> {
  return mayOpenModuleOn(offTenant(tenantId), seat, personKey, module);
}

/* The modules this PERSON may open here: the client's own list (modulesFor,
   the registry's reader) narrowed by the grant — one read of the graph for
   all of them, or a client with four modules would open four connections
   per page. */
export async function openableModulesOn(on: OnTenant, seat: Seat, personKey: string | null | undefined, stored: unknown): Promise<ModuleKey[]> {
  let have = modulesFor(stored);
  /* The Copilot's own page is listed on the switcher (§456) for the office
     alone, and not for an office seat whose Copilot cell reads None — a door
     the page would only refuse is not offered (§61, spec 056 §6.4). One
     read, and only on a client that has the module. */
  if (have.includes("copilot")) {
    const office = seat === "super" || seat === "smoteam";
    const g = office ? copilotGrant(seat, await on.copilotGrant(seat)) : "none";
    if (g === "none") have = have.filter((k) => k !== "copilot");
  }
  /* Processes is the office's by rule too (FFProcess carried in, decision
     "office only"): its pages refuse a client's own person, so the switcher
     must not offer them a door that only says no (§61). */
  if (seat !== "super" && seat !== "smoteam") have = have.filter((k) => !OFFICE_ONLY.has(k));
  if (seat === "super" || seat === "smoteam" || !have.some((k) => openingArea(k))) return have;
  const graph = await on.graph();
  return have.filter((k) => decideOpen(seat, k, graph, personKey));
}
export function openableModules(tenantId: string, seat: Seat, personKey: string | null | undefined, stored: unknown): Promise<ModuleKey[]> {
  return openableModulesOn(offTenant(tenantId), seat, personKey, stored);
}
