/* THE TRIAL MODULE (spec 046, Islam 2026-09-12: "let's create a very simple
   another module something even for the trial. to manage the flow of adding
   a new module to the client").

   It exists to prove the FLOW, not to do anything: turned on for one client
   in that client's Settings, it grows a row on the client's card, opens at
   /<client>/trial, and hands the person back to Strategy. That is the whole
   feature, and everything it draws is in service of proving one of those
   steps really happened.

   WHY IT SAYS THE CLIENT'S NAME (Islam's own instruction, and it is the
   argument for the whole page): a static "hello" would look identical on a
   page that never reached the client at all — it would pass on a build where
   the module resolved, the tenant was never opened, and nothing was read.
   A greeting that knows WHICH client it is cannot. So this page makes three
   claims, and each of them is a thing that can fail visibly:

     · the NAME comes from the registry row the address resolved to;
     · the COUNT comes from that client's own graph, read under withTenant as
       smp_app — so it proves the module crossed the tenant boundary, not
       merely that a route matched;
     · the BAR is in that client's own colours, which a module gets for
       nothing because branding is the SPINE's (spec 046 §4.1) — an untouched
       tenant carries no branding at all (config-data.js's BRAND_DEFAULT), so
       the shipped navy here is the absence of a choice and never a copy of
       one (§50.6).

   NO ROW OF UNITS, deliberately. A module brings its own navigation or none
   (spec 046 §4.2), and this one has no subjects — so the Strategy platform's
   navigation not appearing here is the contract holding rather than an
   omission.

   NO INLINE SCRIPT: the shell's policy is `script-src 'self'` (lib/shell.ts
   SHELL_CSP), which this page is served under, so the module switcher is a
   <details> and not a handler — which is what E1 draws anyway. */
import { withTenant } from "./tenant.ts";
import { readState } from "./state-io.ts";
import { clientHref, MODULE_DEF, type ModuleKey } from "./modules.ts";

const esc = (s: unknown) =>
  String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/* The shipped navigation navy, which is what a tenant that has chosen no bar
   colour wears everywhere else in the product. */
const BAR = "#16325C";
/* THE PLURAL IS GIVEN, NEVER DERIVED (§107.8's family, found by RENDERING
   the page against a real tenant: a rule that adds "s" reads "3 persons").
   The platform's own plural() takes the second form for the same reason
   (§62). */
const plural = (n: number, one: string, many: string) => n + " " + (n === 1 ? one : many);

/* THE ONE SENTENCE UNDER THE GREETING, exported because it is the only claim
   on this page that needs a database to reach — so the check drives it here
   rather than leaving it unasserted (§94.11, §100.3), at both ends: a count
   it HAS and a register it could not read. Absent is not zero (§35, §93:
   counting an error as absence reports everybody as having none). */
export function registerLine(count: number | null): string {
  return count == null
    ? "This client holds no plan yet, so there was no register to read."
    : "It read this client's own register: <b>" + plural(count, "person", "people") + "</b>";
}

type Graph = { people?: unknown[]; group?: { branding?: { bar?: string | null } | null } | null };

/* A colour is written into a style attribute, so only a value this page can
   stand behind may reach it: the tenant's own bar if it is a plain hex, the
   shipped navy otherwise. Never the stored string as it comes (§96.2 is
   about not rewriting what somebody wrote; this is about not PAINTING with
   something nobody checked). */
function barOf(g: Graph | null): string {
  const b = g && g.group && g.group.branding ? g.group.branding.bar : null;
  return typeof b === "string" && /^#[0-9a-fA-F]{6}$/.test(b) ? b : BAR;
}

/* Active is the absence of a no, which is how the register stores it
   everywhere else (§50.6, and the console's own `COALESCE(extra->>'active',
   'true') <> 'false'`). */
function peopleOf(g: Graph | null): number {
  const rows = g && Array.isArray(g.people) ? g.people : [];
  return rows.filter((p) => String((p as { active?: unknown }).active ?? "true") !== "false").length;
}

/* The module switcher — E1, signed off 2026-09-11: the four-square mark
   before the product's name, opening a list of the modules THIS CLIENT has
   with the one it is in marked. It is drawn from `have`, so a module the
   client does not hold has no door here and the address would refuse it
   anyway (lib/modules.ts whereOf): the menu and the address cannot disagree.

   AND IT IS THIS PAGE'S WAY OUT (§61). The trial module is reached from the
   client's card in the console; without this, the only way back to Strategy
   would be the address bar. Strategy's own shell does not carry the switcher
   yet — that is E1 in the frozen file and its own slice — so today the road
   runs one way and this is the return. */
function switcher(slug: string, have: ModuleKey[], here: ModuleKey): string {
  const items = have.map((k) =>
    k === here
      ? '<span class="mi on" aria-current="true">' + esc(MODULE_DEF[k].label) +
        '<i>' + esc(MODULE_DEF[k].note) + '</i></span>'
      : '<a class="mi" href="' + esc(clientHref(slug, k, "")) + '">' + esc(MODULE_DEF[k].label) +
        '<i>' + esc(MODULE_DEF[k].note) + '</i></a>').join("");
  return '<details class="msw"><summary title="Modules" aria-label="Modules">' +
    '<svg viewBox="0 0 20 20" aria-hidden="true"><g stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none">' +
    '<rect x="3.2" y="3.2" width="5.6" height="5.6" rx="1.2"/><rect x="11.2" y="3.2" width="5.6" height="5.6" rx="1.2"/>' +
    '<rect x="3.2" y="11.2" width="5.6" height="5.6" rx="1.2"/><rect x="11.2" y="11.2" width="5.6" height="5.6" rx="1.2"/>' +
    '</g></svg></summary><div class="mmenu">' + items + '</div></details>';
}

export async function trialDocument(slug: string, tenantId: string, tenantName: string, have: ModuleKey[]): Promise<string> {
  /* A CLIENT WITH NO GRAPH IS NOT A FAILURE HERE. The state API answers 404
     for one (§316.9) and this page has nothing to refuse over — it says what
     it could not read rather than printing a nought, because absent is not
     zero (§35). */
  let graph: Graph | null = null;
  try { graph = (await withTenant(tenantId, (c) => readState(c))) as Graph | null; }
  catch (e) { console.error("trial: reading " + slug + "'s graph:", (e as Error).message); }
  /* THE CHECK'S BREAK: a build whose greeting stopped naming the client —
     which is the whole of what this page proves (§94.5) — must go red.
     Never set on a deployment. */
  const name = process.env.SMP_BREAK === "static-hello" ? "there" : tenantName;
  const bar = barOf(graph);
  const proof = registerLine(graph ? peopleOf(graph) : null);

  return "<!doctype html>\n<html lang='en' data-module='trial'>\n<head>\n<meta charset='utf-8'>\n" +
    "<meta name='viewport' content='width=device-width,initial-scale=1'>\n" +
    "<title>" + esc(tenantName) + " — Trial</title>\n" +
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg">\n' +
    '<meta name="theme-color" content="' + esc(bar) + '">\n' +
    "<style>\n" +
    ":root{--bar:" + bar + ";--ink:#141C2B;--ink-3:#5E6E85;--line:#D8DEE8;--ground:#F5F6F9;--surface:#FFF}\n" +
    "@media (prefers-color-scheme:dark){:root{--ink:#E7EBF2;--ink-3:#8590A3;--line:#333B4A;--ground:#12151C;--surface:#1A1F29}}\n" +
    "*{box-sizing:border-box}body{margin:0;background:var(--ground);color:var(--ink);" +
    "font:400 15px/1.55 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased}\n" +
    ".bar{background:var(--bar);color:#EAF0FA;display:flex;align-items:center;gap:10px;padding:11px 16px;flex-wrap:wrap}\n" +
    ".bar h1{margin:0;font-size:14.5px;font-weight:600}\n" +
    ".bar .org{color:#A9BBD8;font-size:13px}.bar .org b{color:#EAF0FA;font-weight:600}\n" +
    ".msw{position:relative;flex:none}\n" +
    ".msw>summary{list-style:none;width:26px;height:26px;border-radius:7px;display:grid;place-items:center;" +
    "border:1px solid rgba(234,240,250,.28);cursor:pointer;color:#EAF0FA}\n" +
    ".msw>summary::-webkit-details-marker{display:none}\n" +
    ".msw>summary:hover,.msw>summary:focus-visible{background:rgba(234,240,250,.14);outline:none}\n" +
    ".msw svg{width:17px;height:17px;display:block}\n" +
    ".mmenu{position:absolute;top:34px;left:0;z-index:9;min-width:290px;background:var(--surface);color:var(--ink);" +
    "border:1px solid var(--line);border-radius:11px;box-shadow:0 8px 26px rgba(20,28,43,.16);overflow:hidden}\n" +
    ".mi{display:block;padding:10px 15px;text-decoration:none;color:inherit;font-size:14px;font-weight:600;" +
    "border-bottom:1px solid var(--line)}\n" +
    ".mi:last-child{border-bottom:0}.mi:hover,.mi:focus-visible{background:var(--ground);outline:none}\n" +
    ".mi.on{background:var(--ground);cursor:default}\n" +
    ".mi i{display:block;font-style:normal;font-weight:400;font-size:12px;color:var(--ink-3);margin-top:2px}\n" +
    ".pg{max-width:640px;margin:0 auto;padding:64px 20px 80px;text-align:center}\n" +
    ".hi{font-size:clamp(24px,5vw,31px);font-weight:600;margin:0 0 9px;letter-spacing:-.015em}\n" +
    ".sub{color:var(--ink-3);font-size:13.5px;margin:0}\n" +
    ".proof{display:inline-block;margin:24px 0 0;padding:9px 14px;border:1px solid var(--line);border-radius:9px;" +
    "background:var(--surface);font-size:12.5px;color:var(--ink-3)}\n" +
    ".proof b{color:var(--ink);font-weight:600}\n" +
    ".back{display:inline-block;margin:26px 0 0;font-size:13px;color:var(--ink-3)}\n" +
    ".back a{color:inherit}\n" +
    "</style>\n</head>\n<body>\n" +
    '<header class="bar">' + switcher(slug, have, "trial") +
    "<h1>Strategy Management Platform</h1>" +
    '<span class="org">&middot; ' + esc(tenantName) + ' <b>&rsaquo; ' + esc(MODULE_DEF.trial.label) + "</b></span></header>\n" +
    '<main class="pg">\n' +
    '<p class="hi">Hello, ' + esc(name) + ".</p>\n" +
    '<p class="sub">This is the Trial module. It does nothing else &mdash; it exists to prove one can be added.</p>\n' +
    '<p class="proof">' + proof + "</p>\n" +
    '<p class="back"><a href="' + esc(clientHref(slug, null, "")) + '">Back to ' + esc(tenantName) + "</a></p>\n" +
    "</main>\n</body>\n</html>\n";
}
