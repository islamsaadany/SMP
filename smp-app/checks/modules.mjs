/* A MODULE PER CLIENT, AND THE TRIAL THAT PROVES ONE CAN BE ADDED
   (spec 046 §4.5, Islam 2026-09-12).

   Four surfaces have to agree about which modules a client has — the card in
   Forefront's console, the address, the switcher and Setup — and they agree
   by all asking lib/modules.ts (§53.5). So what is asserted here is that ONE
   answer, at both ends every time (§94.2): the module a client holds AND the
   one it does not, the word that is built AND the word that is not, the
   greeting that names the client AND the count it refuses to invent.

   WHAT IS DRIVEN AND WHAT IS READ, said out loud because the difference is
   the strength of the claim (§100.3):
     · §1–§4 RUN the rules and §5 RENDERS the trial page, with no database —
       the page is asked for a tenant that cannot be reached, which is also
       how its honest degrade is proved;
     · §6 READS the sources for the three facts that live in SQL, in the
       console's markup and in the route, because driving those needs a
       database and a browser and they are checked where those exist.

     node checks/modules.mjs
     SMP_BREAK=any-module    node checks/modules.mjs   # must go red
     SMP_BREAK=open-address  node checks/modules.mjs   # must go red
     SMP_BREAK=static-hello  node checks/modules.mjs   # must go red            */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { MODULES, MODULE_DEF, DEFAULT_MODULE, modulesFor, offerable, whereOf, clientHref, moduleRows, isModule } from "../lib/modules.ts";
import { trialDocument, registerLine } from "../lib/trial.ts";

const here = dirname(fileURLToPath(import.meta.url));
const APP = join(here, "..");
const ROOT = join(APP, "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

let ok = 0;
const bad = [];
const check = (what, good, detail) => {
  if (good) { ok++; console.log("  ok   " + what); }
  else { bad.push(what); console.log("  FAIL " + what + (detail ? "  — " + detail : "")); }
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

console.log("1 · which modules a client has");
check("a client that has been told nothing has the default and only that",
  same(modulesFor(null), [DEFAULT_MODULE]), JSON.stringify(modulesFor(null)));
check("a client given the trial has both", same(modulesFor(["trial"]), ["strategy", "trial"]), JSON.stringify(modulesFor(["trial"])));
/* THE ORDER IS MODULES', NOT THE ORDER THEY WERE SWITCHED ON — two clients
   holding the same modules must read the same way round, or a row moves under
   somebody because of when it was bought. */
check("the order is the list's, never the order they were turned on",
  same(modulesFor(["trial", "strategy"]), modulesFor(["strategy", "trial"])), JSON.stringify(modulesFor(["trial", "strategy"])));
/* BOTH ENDS (§94.2): dropping the unknown proves nothing unless something
   survives beside it, or a modulesFor() that returned the default always
   would pass every assertion above. */
check("a word the code does not know is dropped and the rest survives",
  same(modulesFor(["banana", "trial"]), ["strategy", "trial"]), JSON.stringify(modulesFor(["banana", "trial"])));
check("a module that is NOT BUILT is dropped however it got into the list",
  same(modulesFor(["portfolio", "insights", "processes"]), [DEFAULT_MODULE]),
  JSON.stringify(modulesFor(["portfolio", "insights", "processes"])));
check("the default survives a list that does not name it",
  modulesFor(["trial"]).includes(DEFAULT_MODULE));
check("and survives a list that names nothing at all", modulesFor([]).includes(DEFAULT_MODULE));

console.log("\n2 · what a consultant may be offered");
check("only built modules are offered", offerable().every((k) => MODULE_DEF[k].built), offerable().join(", "));
check("and the unbuilt ones are still MODULE WORDS, or a unit keyed `portfolio` would claim the address the day it lands",
  MODULES.filter((k) => !MODULE_DEF[k].built).every((k) => isModule(k)));
check("every module says a name and a line, so no surface has to invent one",
  MODULES.every((k) => MODULE_DEF[k].label && MODULE_DEF[k].note));
check("the default is offered, so the drawer can say it is always on rather than leave a gap",
  offerable().includes(DEFAULT_MODULE));

console.log("\n3 · the address");
const HAVE_BOTH = ["strategy", "trial"], HAVE_ONE = ["strategy"];
check("a module the client HAS is read as that module",
  same(whereOf(["trial"], HAVE_BOTH), { module: "trial", rest: [], legacy: false }), JSON.stringify(whereOf(["trial"], HAVE_BOTH)));
check("a module the client does NOT have falls through to the legacy branch, exactly as any other unknown word",
  same(whereOf(["trial"], HAVE_ONE), whereOf(["banana"], HAVE_ONE).module === "strategy"
    ? { module: "strategy", rest: ["trial"], legacy: true } : null), JSON.stringify(whereOf(["trial"], HAVE_ONE)));
check("an unbuilt module's word is not an address either",
  whereOf(["portfolio"], modulesFor(["portfolio"])).legacy, JSON.stringify(whereOf(["portfolio"], modulesFor(["portfolio"]))));
check("Setup is the spine's and carries no module", same(whereOf(["setup", "people"], HAVE_BOTH), { module: null, rest: ["setup", "people"], legacy: false }));
check("the tour is the spine's too", whereOf(["tour"], HAVE_BOTH).module === null);
/* A caller that forgets to say which modules the client has gets the NARROW
   answer, never every module — the safe direction (§42). */
check("asked without a list, only the default is a module", whereOf(["trial"]).legacy && !whereOf(["strategy"]).legacy);
check("the address a module is written at is the address it is read from",
  whereOf(clientHref("raya-trade", "trial", "").split("/").slice(2), HAVE_BOTH).module === "trial",
  clientHref("raya-trade", "trial", ""));
check("and Setup's address carries none", clientHref("raya-trade", null, "setup/people") === "/raya-trade/setup/people");

console.log("\n4 · the card's rows");
const facts = { unreadable: false, cycleOpen: true, planned: true };
const rows = moduleRows(modulesFor(["trial"]), facts);
check("one row per module the client has, and no more", rows.length === 2 && same(rows.map((r) => r.key), ["strategy", "trial"]),
  rows.map((r) => r.key).join(", "));
check("Strategy still says what it said", rows[0].state === "cycle open", rows[0].state);
/* A module with nothing to say draws its NAME alone — never a placeholder,
   which would read as a state nobody set (§45.2). */
check("a module with nothing to say says nothing, rather than a placeholder", rows[1].state === "", JSON.stringify(rows[1].state));
check("every row carries the label the switcher and the drawer use",
  rows.every((r) => r.label === MODULE_DEF[r.key].label));
check("a client without the trial gets one row", moduleRows(modulesFor([]), facts).length === 1);

console.log("\n5 · the trial module's page");
/* NO DATABASE ON PURPOSE. The tenant cannot be reached, which proves the two
   things worth proving at once: the greeting comes from the REGISTRY row and
   is there whatever the graph does, and a count it could not read is SAID and
   never printed as a nought (§35, §93: counting an error as absence reports
   everybody as having none). */
const html = await trialDocument("raya-trade", "not-a-tenant-id", "Raya Trade", HAVE_BOTH);
check("the greeting names THIS client", /<p class="hi">Hello, Raya Trade\.<\/p>/.test(html),
  (html.match(/<p class="hi">[^<]*/) || [""])[0]);
check("and a different client gets a different greeting — the whole point of the module",
  /Hello, El Abd\./.test(await trialDocument("el-abd", "not-a-tenant-id", "El Abd", HAVE_BOTH)));
check("a register it could not read is said, never counted as nought",
  /no plan yet, so there was no register to read/.test(html) && !/\b0 people\b/.test(html));
/* THE SENTENCE IS DRIVEN, not left to a database (§94.11). Rendering the page
   against a real tenant is what found "3 persons" — a plural derived by
   adding an "s" to a word that does not take one (§107.8's family) — and it
   was unreachable from here until the sentence became a function of its own. */
check("one person reads as one person", registerLine(1) === "It read this client's own register: <b>1 person</b>", registerLine(1));
check("and three read as three PEOPLE, not three persons", registerLine(3).includes("3 people"), registerLine(3));
check("a count it does not have is a sentence, never a nought", registerLine(null) === "This client holds no plan yet, so there was no register to read." && !/0/.test(registerLine(null)), registerLine(null));
check("the switcher lists the client's own modules, current one marked",
  /class="mi on"[^>]*>Strategy|aria-current="true"/.test(html) === false
    ? /aria-current="true">Trial/.test(html) : /aria-current="true">Trial/.test(html),
  (html.match(/aria-current="true">[A-Za-z]+/) || [""])[0]);
check("and it offers a door OUT of the trial, back to Strategy (§61)",
  html.includes('href="/raya-trade/strategy"'), (html.match(/href="\/raya-trade\/[a-z]*"/g) || []).join(" "));
check("a client holding only Strategy is offered no door it does not have",
  !(await trialDocument("raya-trade", "not-a-tenant-id", "Raya Trade", HAVE_ONE)).includes('href="/raya-trade/trial"'));
check("there is no row of units — a module brings its own navigation or none (spec 046 §4.2)",
  !/data-u=|class="units"/.test(html));
/* The page is served under the shell's policy, which is `script-src 'self'`
   (lib/shell.ts SHELL_CSP): an inline handler here would render perfectly and
   never run, so the switcher is a <details> and this asserts it stayed one. */
check("nothing inline needs a script, or the policy would silence it", !/<script|onclick=/i.test(html));
check("the client's own name is the document's title too", /<title>Raya Trade — Trial<\/title>/.test(html));

console.log("\n6 · what lives in SQL, in the console and in the route (read, not driven)");
const schema = read("smp-app/db/schema.sql");
check("a fresh database's tenants table carries the column", /modules\s+jsonb NOT NULL DEFAULT '\["strategy"\]'/.test(schema));
const mig = read("smp-app/db/migrations/005-a-module-per-client.sql");
/* schema.sql runs ONCE and is recorded, so a database already up never sees a
   column added there — the migration is not a duplicate of it, it is the only
   way an existing deployment ever gets one (§33.5). */
check("and a database already up gets it by migration", /ADD COLUMN IF NOT EXISTS modules jsonb/.test(mig));
check("the migration can be run twice", /IF NOT EXISTS/.test(mig));
const api = read("smp-app/lib/platform-api.ts");
check("the card reads the client's own list rather than a constant", api.includes("moduleRows(modulesFor(row.modules), facts)"));
check("the drawer is told what this client has AND what it could be given", /modules: modulesFor\(row\.modules\)/.test(api) && /offer: offerable\(\)/.test(api));
check("turning one on is gated on the same rule as the rest of the configuration",
  /if \(action === "setModules"\)[\s\S]{0,900}mayConfigureClient/.test(api));
/* THE TWO REFUSALS ARE THE RULE AND NOT THE SCREEN'S (§42, §44): the drawer
   draws neither control, and the server has to refuse both anyway. */
check("the default cannot be switched off, however the request is spelt", /key === DEFAULT_MODULE\) return no\(400/.test(api));
check("and a module that is not built cannot be switched on", /!MODULE_DEF\[key\]\.built\) return no\(400/.test(api));
const pf = read("platform.html");
check("the drawer draws the band under the client's name", pf.includes('el("div", "band")') && pf.includes("Modules this client has"));
check("its rows are the team list's own, so the section adds no vocabulary", /mods[\s\S]{0,700}el\("div", "teamrow"\)/.test(pf));
/* SCOPED TO THE DRAWER'S OWN FUNCTION. `page.appendChild(grid)` appears
   twice in this file — the clients list builds one too — so an unscoped
   indexOf compared the band against ANOTHER page's grid and called a correct
   build broken (§100.3, found by this assertion failing first). */
const drawer = pf.slice(pf.indexOf("function drawClient("));
check("the band is drawn BEFORE the two columns, which is placement B",
  drawer.indexOf("page.appendChild(mods)") > 0 &&
  drawer.indexOf("page.appendChild(mods)") < drawer.indexOf("page.appendChild(grid)"),
  "mods at " + drawer.indexOf("page.appendChild(mods)") + ", grid at " + drawer.indexOf("page.appendChild(grid)"));
/* The console is ONE source for both stacks; the app serves a generated copy,
   so a build that edited platform.html and forgot to regenerate would ship a
   drawer without the section (§53.5). */
check("and the copy the app serves was regenerated from it",
  read("smp-app/public/platform-page.js").includes("Modules this client has"));
const route = read("smp-app/app/(platform)/[slug]/[...rest]/route.ts");
check("the address is gated on the client's own list", /whereOf\(rest \|\| \[\], have\)/.test(route));
check("and the trial module serves itself rather than the Strategy shell",
  /w\.module === "trial"[\s\S]{0,200}trialDocument/.test(route));

console.log("\n%d ok, %d failed", ok, bad.length);
if (bad.length) { console.log("FAILED: " + bad.join("; ")); process.exit(1); }
