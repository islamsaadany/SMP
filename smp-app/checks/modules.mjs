/* A MODULE PER CLIENT, AND EVERY MODULE SERVING ITSELF
   (spec 046 §4.5, Islam 2026-09-12; §363).

   Four surfaces have to agree about which modules a client has — the card in
   Forefront's console, the address, the switcher and Setup — and they agree
   by all asking lib/modules.ts (§53.5). So what is asserted here is that ONE
   answer, at both ends every time (§94.2): the module a client holds AND the
   one it does not, the word that is built AND the word that is not, the
   greeting that names the client AND the count it refuses to invent.

   WHAT IS DRIVEN AND WHAT IS READ, said out loud because the difference is
   the strength of the claim (§100.3):
     · §1–§4 RUN the rules and §2b RENDERS every built module's own page,
       with no database — each is asked for a tenant that cannot be reached,
       which is also how its honest degrade is proved;
       (§5 was the trial module's page and went with that module at §363;
       what it proved of ANY module's page is asserted in §2b and §2d, and
       what it proved of the trial alone — a greeting made of a register it
       could not read — went with its subject, said rather than mourned.)
     · §6 READS the sources for the three facts that live in SQL, in the
       console's markup and in the route, because driving those needs a
       database and a browser and they are checked where those exist.

   AND §7 DRIVES THE SWITCHER IN A REAL BROWSER, against the shell's own body
   and its own stylesheet — because whether a control is DRAWN is not a
   question the source can answer (§96: a control that renders and does
   nothing, or does not render at all, reads identically in the code). It
   needs a browser; if there is none it FAILS rather than skips, because a
   check that quietly does not run is a green tick over nothing (§54.5).

     node checks/modules.mjs
     SMP_BREAK=any-module    node checks/modules.mjs   # must go red
     SMP_BREAK=open-address  node checks/modules.mjs   # must go red
     SMP_BREAK=static-hello  node checks/modules.mjs   # must go red
     SMP_BREAK=switch-always node checks/modules.mjs   # must go red
     SMP_BREAK=gate-open     node checks/modules.mjs   # must go red (§4c)      */
import { readFileSync, existsSync } from "node:fs";
import { createServer } from "node:http";
import { chromium } from "playwright-core";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { MODULES, MODULE_DEF, DEFAULT_MODULE, modulesFor, offerable, whereOf, clientHref, moduleRows, moduleMenu, isModule, landingLine, lineDef, NO_FACTS } from "../lib/modules.ts";
import { SERVERS, serverFor } from "../modules/registry.ts";
import { insightsDocument } from "../modules/insights/page.ts";
import { barFrom, BAR_DEFAULT } from "../lib/branding.ts";
import { decideOpen, openingArea } from "../lib/access.ts";

const here = dirname(fileURLToPath(import.meta.url));
const APP = join(here, "..");
const ROOT = join(APP, "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

/* The product reads its breaks from the environment (lib/modules.ts,
   modules/insights/page.ts, lib/shell.ts), so this reads the same one — §7 serves the
   shell itself and has to break with it. */
const BREAK = process.env.SMP_BREAK || "";

/* Derived, never typed: which words are unbuilt is a fact about MODULE_DEF and
   it changes as modules land. */
const UNBUILT = MODULES.filter((k) => !MODULE_DEF[k].built);
const BUILT_EXTRA = MODULES.filter((k) => MODULE_DEF[k].built && k !== DEFAULT_MODULE);
/* A SECOND MODULE, FOUND RATHER THAN NAMED (§214.3, §218). Every line below
   that needs "a module the client has besides the default" used to spell
   `"trial"`, so removing that module (§363) would have meant editing a dozen
   assertions — and adding the next one means editing none. If there is no
   second built module at all the file says so once, here, rather than going
   quietly green over a list of one (§54.5, §113.8). */
const OTHER = BUILT_EXTRA[0] || null;

let ok = 0;
const bad = [];
const check = (what, good, detail) => {
  if (good) { ok++; console.log("  ok   " + what); }
  else { bad.push(what); console.log("  FAIL " + what + (detail ? "  — " + detail : "")); }
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

console.log("1 · which modules a client has");
check("there is a built module besides the default, or half this file proves nothing",
  !!OTHER, MODULES.map((k) => k + ":" + (MODULE_DEF[k].built ? "built" : "-")).join(" "));
check("a client that has been told nothing has the default and only that",
  same(modulesFor(null), [DEFAULT_MODULE]), JSON.stringify(modulesFor(null)));
check("a client given a second module has both", same(modulesFor([OTHER]), [DEFAULT_MODULE, OTHER]), JSON.stringify(modulesFor([OTHER])));
/* THE ORDER IS MODULES', NOT THE ORDER THEY WERE SWITCHED ON — two clients
   holding the same modules must read the same way round, or a row moves under
   somebody because of when it was bought. */
check("the order is the list's, never the order they were turned on",
  same(modulesFor([OTHER, DEFAULT_MODULE]), modulesFor([DEFAULT_MODULE, OTHER])), JSON.stringify(modulesFor([OTHER, DEFAULT_MODULE])));
/* BOTH ENDS (§94.2): dropping the unknown proves nothing unless something
   survives beside it, or a modulesFor() that returned the default always
   would pass every assertion above. */
check("a word the code does not know is dropped and the rest survives",
  same(modulesFor(["banana", OTHER]), [DEFAULT_MODULE, OTHER]), JSON.stringify(modulesFor(["banana", OTHER])));
check("a module that is NOT BUILT is dropped however it got into the list",
  same(modulesFor(UNBUILT), [DEFAULT_MODULE]), JSON.stringify(modulesFor(UNBUILT)));
/* THE OTHER END, and it is what stops the assertion above passing because
   nothing is ever kept (§113.8): a module that IS built and is not the default
   survives the same call. Both halves read MODULE_DEF rather than naming a
   module, so the day Portfolio lands neither has to be edited (§218: rewritten
   when Insights was built, not loosened — the old line named three words and
   asserted a property of all three). */
check("...and a built one that is not the default IS kept",
  BUILT_EXTRA.length === 0 || modulesFor([BUILT_EXTRA[0]]).includes(BUILT_EXTRA[0]),
  BUILT_EXTRA.join(", "));
check("the default survives a list that does not name it",
  modulesFor([OTHER]).includes(DEFAULT_MODULE));
check("and survives a list that names nothing at all", modulesFor([]).includes(DEFAULT_MODULE));

console.log("\n2 · what a consultant may be offered");
check("only built modules are offered", offerable().every((k) => MODULE_DEF[k].built), offerable().join(", "));
check("and the unbuilt ones are still MODULE WORDS, or a unit keyed `portfolio` would claim the address the day it lands",
  MODULES.filter((k) => !MODULE_DEF[k].built).every((k) => isModule(k)));
check("every module says a name and a line, so no surface has to invent one",
  MODULES.every((k) => MODULE_DEF[k].label && MODULE_DEF[k].note));
check("the default is offered, so the drawer can say it is always on rather than leave a gap",
  offerable().includes(DEFAULT_MODULE));

/* ── THE CONTRACT'S SECOND LINE (spec 046 §4.2, §4.4) ─────────────────
   *Its own roles and areas.* This is what makes that line a contract rather
   than a paragraph: a module cannot be marked `built` without having answered
   it, and the answer may be NONE — Strategy's areas are the frozen matrix's
   and a module with nothing to grant separately has none — so what is
   asserted is that every area declared is WELL FORMED and that its shipped
   state is one it offers.

   BOTH ENDS (§94.2): a build that declared no areas anywhere would satisfy
   every assertion about their shape, so one module is asserted to declare
   one — found at runtime rather than named, or this file becomes the second
   place Insights' area is written down (§53.5). */
const WITH_AREAS = MODULES.filter((k) => MODULE_DEF[k].areas.length);
check("every module answers the contract's areas line, even if the answer is none",
  MODULES.every((k) => Array.isArray(MODULE_DEF[k].areas)));
check("...and at least one module declares one, or the shape above proves nothing",
  WITH_AREAS.length > 0, MODULES.map((k) => k + ":" + MODULE_DEF[k].areas.length).join(" "));
check("an area says its key, its label, the line under it and what it offers",
  MODULES.every((k) => MODULE_DEF[k].areas.every((a) =>
    a.key && a.label && a.note && Array.isArray(a.states) && a.states.length >= 2)),
  JSON.stringify(MODULE_DEF.insights.areas));
check("...and the state it SHIPS at is one it offers — a default outside the list is a cell nobody can read",
  MODULES.every((k) => MODULE_DEF[k].areas.every((a) => a.states.includes(a.shipped))),
  MODULES.flatMap((k) => MODULE_DEF[k].areas.map((a) => a.key + "=" + a.shipped)).join(" "));
check("an area key is a key and not a sentence, so it can be a column",
  MODULES.every((k) => MODULE_DEF[k].areas.every((a) => /^[a-z][a-z0-9_]*$/.test(a.key))));
check("no two modules claim the same area key",
  new Set(MODULES.flatMap((k) => MODULE_DEF[k].areas.map((a) => a.key))).size
    === MODULES.flatMap((k) => MODULE_DEF[k].areas).length);
/* THE CARRIED MATRIX IS NOT WHERE THESE LIVE (§335, spec 053 §4.5), and it is
   asserted rather than trusted: `lib/rules.cjs` is byte-identical to its
   frozen twin, so a module's area added there turns generated-in-step red —
   and this says WHY before that happens, in the file somebody would be
   editing. */
check("a module's area is NOT in the client's carried matrix",
  !read("smp-app/lib/rules.cjs").includes("a_insights")
  && !read("lib/rules.js").includes("a_insights"));

/* ── THE CONTRACT'S FIFTH LINE (spec 046 §4.2) ────────────────────────
   *A landing* — somewhere a person holding a role in the module opens. Until
   §354 that was a chain of ifs in the route, so nothing could ask the question
   at all: a module marked `built` with no page behind it read exactly like one
   with a page, right up until somebody opened its address and got the Strategy
   platform wearing another name (§61, which is the whole reason that flag
   exists).

   BOTH ENDS (§94.2), and the second is the one that matters: every built
   module serves itself, AND no unbuilt word does — a page behind `portfolio`
   today would be the door onto the wrong room, arriving quietly. */
console.log("\n2b · every module serves itself");
check("every BUILT module has a page of its own to serve",
  MODULES.filter((k) => MODULE_DEF[k].built).every((k) => typeof serverFor(k) === "function"),
  MODULES.map((k) => k + ":" + (serverFor(k) ? "serves" : "none")).join(" "));
check("...and a word that is NOT built serves nothing, or it is a door onto the wrong room",
  UNBUILT.every((k) => serverFor(k) === null), UNBUILT.join(", "));
check("the table holds nothing that is not a module",
  Object.keys(SERVERS).every((k) => isModule(k)), Object.keys(SERVERS).join(", "));
/* AND THE TABLE IS DRIVEN, never only read (§96: a server wired to the wrong
   module renders perfectly). Each one is CALLED and what comes back has to be
   that module's own document — a registry pointing two words at one page
   would satisfy every assertion above. No database: the tenant cannot be
   reached, which each page degrades through on its own terms. */
const argsFor = (module, rest) => ({
  req: new Request("https://smp.example/raya-trade/" + module + rest.map((r) => "/" + r).join("")),
  slug: "raya-trade", module, tenantId: "not-a-tenant-id", tenantName: "Raya Trade",
  have: offerable(), rest,
  /* WHO IS LOOKING, as the route hands it (spec 046 §4.10) — the office, so
     a module the office alone may open (the Internal Tracker, spec 054) draws
     its page here rather than its refusal. */
  personKey: "islam", seat: "super",
});
const drawnBy = async (k, rest = []) => {
  const res = await serverFor(k)(argsFor(k, rest));
  return { status: res.status, html: res.status === 200 ? await res.text() : "", to: res.headers.get("location") || "" };
};
const drawn = {};
for (const k of offerable()) {
  drawn[k] = await drawnBy(k);
  check("...and " + k + "'s server answers with a page of its own",
    drawn[k].status === 200 && /<html/.test(drawn[k].html),
    drawn[k].status + " " + drawn[k].html.length + " bytes");
}
/* THE TITLES, AND THE FIRST VERSION OF THIS ASSERTION PASSED FOR THE WRONG
   REASON (§113.8, found by falsifying it rather than by reading it). It asked
   whether each document carried `data-module="<k>"` — and the shell stamps
   that from the argument it is HANDED, so a table pointing two words at one
   page drew the Strategy platform wearing the word `insights` and satisfied
   it perfectly: the exact fault, rendering exactly as the assertion demanded.
   A title is written by the page out of its own vocabulary and cannot be
   handed in, so two modules sharing one is two modules sharing a page —
   compared as a SET, naming nothing, so a fourth module is covered. */
const titles = offerable().map((k) => (drawn[k].html.match(/<title>([^<]*)<\/title>/) || ["", ""])[1]);
check("...and no two of them draw the same document — a table cannot point two words at one page",
  new Set(titles).size === titles.length, titles.join(" | "));
/* A module's landing is its landing: an address inside one that it does not
   draw comes BACK to it, which is what every unknown word inside a client
   already gets (lib/modules.ts whereOf) rather than a second refusal. */
for (const k of BUILT_EXTRA) {
  const out = await drawnBy(k, ["nothing-here"]);
  check("...and a word " + k + " does not draw comes back to its landing",
    out.status === 302 && out.to.endsWith(clientHref("raya-trade", k, "")),
    out.status + " " + out.to);
}

/* ── WHAT A MODULE WEARS (spec 046 §4.1, §354) ────────────────────────
   Branding is the SPINE's, so a module should get the client's colour for
   nothing. It was not: Strategy wore it, the trial module read it for itself,
   and Insights carried the shipped navy as a literal — a client who had
   chosen a colour saw it on two screens of three. Nothing could see that,
   because no check ever asked what a module wears.

   BOTH ENDS (§94.2). The rule is worth nothing on its own — a build where
   every module kept its own copy of it would satisfy it perfectly — so the
   modules that draw their own document are asserted to hold NO default and NO
   colour test of their own, which is the drift itself rather than its symptom
   (§53.5). */
console.log("\n2c · the client's colour reaches a module");
check("a colour the client chose is the colour worn", barFrom("#7A1F3D") === "#7A1F3D", barFrom("#7A1F3D"));
check("...and what is not a colour is the shipped default, never painted as it came (§96.2)",
  barFrom("javascript:alert(1)") === BAR_DEFAULT && barFrom("#ABC") === BAR_DEFAULT
  && barFrom(null) === BAR_DEFAULT && barFrom(undefined) === BAR_DEFAULT,
  [barFrom("javascript:alert(1)"), barFrom("#ABC"), barFrom(null)].join(" "));
/* DERIVED, NEVER NAMED (§214.3): the modules that draw a DOCUMENT of their
   own are the built ones carrying a page.ts — Strategy serves the frozen
   shell and has none — so a module added tomorrow is measured the day it
   lands and one removed takes its own line with it (§363). */
const OWN_PAGE = BUILT_EXTRA.filter((k) => existsSync(join(APP, "modules", k, "page.ts")));
check("at least one module draws a document of its own, or the two below prove nothing",
  OWN_PAGE.length > 0, BUILT_EXTRA.join(", "));
for (const name of OWN_PAGE) {
  const src = read("smp-app/modules/" + name + "/page.ts");
  check("the " + name + " module asks the spine for the colour rather than deciding it",
    /lib\/branding\.ts/.test(src));
  check("...and keeps no default and no colour test of its own — " + name,
    !/^const BAR\b/m.test(src) && !/#\[0-9a-fA-F\]\{6\}/.test(src),
    (src.match(/^const BAR\b.*/m) || src.match(/#\[0-9a-fA-F\]\{6\}/) || [""])[0]);
}
/* A COLOUR MAY NEVER STOP A PAGE DRAWING (§231.3 one layer in). The tenant
   cannot be reached here, so this proves the library still draws AND that it
   falls back to the shipped navy rather than to nothing at all. */
const noDb = await insightsDocument("raya-trade", "not-a-tenant-id", "Raya Trade", offerable(), { q: "", category: "" });
check("a client whose database will not answer still gets a page, in the shipped colour",
  noDb.includes("--bar:" + BAR_DEFAULT) && noDb.includes("<title>"),
  (noDb.match(/--bar:[^;]*/) || [""])[0]);

console.log("\n3 · the address");
/* EVERY BUILT MODULE, NEVER ONE NAMED BY HAND (§218, §354). This read
   `["strategy", "trial"]` until Insights landed, so the third module was
   asserted nowhere in this section and the file went on saying two surfaces
   agreed while three had to — the literal outliving the decision (§214.3).
   Both lists are worked out from MODULE_DEF, so the fourth module is covered
   the day it is marked built and this file is not edited. */
const HAVE_BOTH = offerable(), HAVE_ONE = [DEFAULT_MODULE];
for (const k of BUILT_EXTRA) {
  check("a module the client HAS is read as that module — " + k,
    same(whereOf([k], HAVE_BOTH), { module: k, rest: [], legacy: false }), JSON.stringify(whereOf([k], HAVE_BOTH)));
  check("...and one the client does NOT have falls through to the legacy branch, exactly as any other unknown word — " + k,
    same(whereOf([k], HAVE_ONE), whereOf(["banana"], HAVE_ONE).module === DEFAULT_MODULE
      ? { module: DEFAULT_MODULE, rest: [k], legacy: true } : null), JSON.stringify(whereOf([k], HAVE_ONE)));
  check("the address it is written at is the address it is read from — " + k,
    whereOf(clientHref("raya-trade", k, "").split("/").slice(2), HAVE_BOTH).module === k,
    clientHref("raya-trade", k, ""));
}
check("an unbuilt module's word is not an address either",
  whereOf(["portfolio"], modulesFor(["portfolio"])).legacy, JSON.stringify(whereOf(["portfolio"], modulesFor(["portfolio"]))));
check("the client's Setup is the spine's and carries no module (spec 056 §4.1)", same(whereOf(["setup", "people"], HAVE_BOTH), { module: null, rest: ["setup", "people"], legacy: false }));
/* BOTH ENDS (§94.2, §359.2): a module's own Setup reads as that module with
   `setup` inside it, so the route can serve it stamped with the module's
   word — a build that swallowed `setup` after any module word into the spine
   passes the line above alone. */
check("…and a module's own Setup is that module's, with `setup` inside it (spec 056 §4.2)", same(whereOf(["strategy", "setup", "cycle"], HAVE_BOTH), { module: "strategy", rest: ["setup", "cycle"], legacy: false }));
check("the tour is the spine's too", whereOf(["tour"], HAVE_BOTH).module === null);
/* A caller that forgets to say which modules the client has gets the NARROW
   answer, never every module — the safe direction (§42). */
check("asked without a list, only the default is a module", whereOf([OTHER]).legacy && !whereOf([DEFAULT_MODULE]).legacy);
check("and Setup's address carries none", clientHref("raya-trade", null, "setup/people") === "/raya-trade/setup/people");

console.log("\n4 · the card's rows");
const facts = { unreadable: false, cycleOpen: true, planned: true };
const rows = moduleRows(modulesFor(BUILT_EXTRA), facts);
check("one row per module the client has, and no more, in the list's own order",
  same(rows.map((r) => r.key), HAVE_BOTH), rows.map((r) => r.key).join(", "));
/* REWRITTEN, NEVER LOOSENED (§218, §214.3). This asserted `state === "cycle
   open"` — the health word §368 replaced, and half of the pair that said one
   fact twice. What survives is the claim it was making: Strategy is the row
   that speaks about a running cycle, and it now does it as a MARK. */
check("Strategy marks a running cycle", rows[0].mark === "Cycle open", rows[0].mark);
/* A module with nothing to say draws its NAME alone — never a placeholder,
   which would read as a state nobody set (§45.2). Asked of EVERY other row
   rather than of the second one, or a third module could say anything at all
   and this would go on passing (§113.8). */
check("a module with nothing to say says nothing, rather than a placeholder",
  rows.slice(1).every((r) => r.mark === ""),
  rows.slice(1).map((r) => r.key + "=" + JSON.stringify(r.mark)).join(" "));
check("every row carries the label the switcher and the drawer use",
  rows.every((r) => r.label === MODULE_DEF[r.key].label));

/* ── 4a · THE MARK, AND NOTHING WHEN THERE IS NOTHING (§368) ──────────────
   Islam, of the cards: "we don't needs notes that take 2 lines we can just
   have a notificaiton here if something is new to check ... let's make it
   compact." The row's tail says what is OUTSTANDING and is silent otherwise,
   which is where the compactness comes from — so the silence is asserted as
   hard as the marks are, or a build that marked every row would satisfy
   every "it says the right thing" assertion here and be no shorter.

   BOTH ENDS ON EVERY BRANCH (§94.2): each mark is asserted beside the state
   that must NOT draw it. */
const FULL = { cycleOpen: true, cycleName: "H1", due: "30 Sep", total: 10, sub: 7, newReports: 2, latestReport: "Egypt retail outlook, Q3" };
const mk = (f) => moduleRows(modulesFor(BUILT_EXTRA), f);
const markOf = (f, key) => (mk(f).find((r) => r.key === key) || {});
const OWED = markOf({ unreadable: false, cycleOpen: true, planned: true, landing: FULL }, "strategy");
check("what is owed is the mark: how many of how many",
  OWED.mark === "3 of 10", OWED.mark);
check("…and a count is not an alarm, however large", OWED.alarm === false);
check("…and the whole sentence rides with it for the hover",
  OWED.tip === "Cycle open · reports due 30 Sep · 3 of 10 still to submit", OWED.tip);
/* THE OTHER END, and the cost Islam took with it stated where it is
   asserted: a cycle running with every subject in owes nothing, so it marks
   nothing — and therefore reads the same as no cycle at all. That is the
   mark meaning *outstanding* rather than *state*, and it is the decision. */
check("a cycle with every subject in marks nothing",
  markOf({ unreadable: false, cycleOpen: true, planned: true, landing: { ...FULL, sub: 10 } }, "strategy").mark === "");
check("and no cycle open marks nothing at all",
  markOf({ unreadable: false, cycleOpen: false, planned: true, landing: { ...FULL, cycleOpen: false } }, "strategy").mark === "");
/* THE TWO ALARMS, which are what a count can never say and the reason the
   card did not get one number for the whole client (the mockup's option B). */
const NOPLAN = markOf({ unreadable: false, cycleOpen: false, planned: false, landing: FULL }, "strategy");
check("a client with no plan says so, as an alarm",
  NOPLAN.mark === "No plan" && NOPLAN.alarm === true, NOPLAN.mark + " alarm=" + NOPLAN.alarm);
const DEAD = markOf({ unreadable: true, landing: null }, "strategy");
check("a client that did not answer says so, as an alarm",
  DEAD.mark === "Not answering" && DEAD.alarm === true, DEAD.mark + " alarm=" + DEAD.alarm);
check("…and it outranks everything else, because it is why nothing else can be read",
  markOf({ unreadable: true, cycleOpen: true, planned: false, landing: FULL }, "strategy").mark === "Not answering");
/* AN UNREADABLE COUNT IS NOT NOUGHT (§35, §93). A cycle known open whose
   totals cannot be read must not fall through to silence, which is what
   "nothing is owed" looks like. */
check("a cycle open with counts that cannot be read says the cycle is open",
  markOf({ unreadable: false, cycleOpen: true, planned: true, landing: { ...FULL, total: null, sub: null } }, "strategy").mark === "Cycle open");
check("…and says it without an alarm, because nothing is broken",
  markOf({ unreadable: false, cycleOpen: true, planned: true, landing: { ...FULL, total: null, sub: null } }, "strategy").alarm === false);
const NEW = markOf({ unreadable: false, cycleOpen: false, planned: true, landing: FULL }, "insights");
check("Insights marks this month's reports", NEW.mark === "2 new" && NEW.alarm === false, NEW.mark);
check("…one report is singular in the hover, and none marks nothing",
  markOf({ unreadable: false, planned: true, landing: { ...FULL, newReports: 1 } }, "insights").tip === "1 new report this month" &&
  markOf({ unreadable: false, planned: true, landing: { ...FULL, newReports: 0 } }, "insights").mark === "" &&
  markOf({ unreadable: false, planned: true, landing: { ...FULL, newReports: null } }, "insights").mark === "");
/* DECLARED PER MODULE, so a fifth one marks its card by adding an entry
   rather than by editing the console (§53.5, MODULE_DEF's own rule). Asked
   of every module that declares NO mark, so the next one is covered. */
const NOMARK = MODULES.filter((k) => !MODULE_DEF[k].mark);
check("a module that declares no mark never marks anything",
  NOMARK.length > 0 && NOMARK.every((k) => moduleRows([DEFAULT_MODULE, k].filter(isModule), { unreadable: false, cycleOpen: true, planned: false, landing: FULL })
    .filter((r) => r.key === k).every((r) => r.mark === "" && r.alarm === false && r.tip === "")),
  NOMARK.join(", "));
/* THE MARK IS FOREFRONT'S OWN ANSWER, AND THIS IS THE ASSERTION THAT SAYS
   SO (§368, Islam's call with the cost stated). It REVERSES the one that
   stood here — *the card's row carries the picked line, from the one reader*
   (§359.4) — and is written as the reversal rather than deleted, so a build
   that quietly wired the client's pick back into the console goes red.
   `moduleRows` takes no pick at all now, so the guard is that passing one
   cannot change a thing: both spellings of a pick, and a third argument
   ignored outright. */
const PICK_A = moduleRows(modulesFor(BUILT_EXTRA), { unreadable: false, cycleOpen: true, planned: true, landing: FULL }, { strategy: "waiting" });
const PICK_B = moduleRows(modulesFor(BUILT_EXTRA), { unreadable: false, cycleOpen: true, planned: true, landing: FULL }, { strategy: "cycle" });
const PICK_N = moduleRows(modulesFor(BUILT_EXTRA), { unreadable: false, cycleOpen: true, planned: true, landing: FULL });
/* AND THIS ONE IS THE CONTROL RATHER THAN THE ALARM, SAID SO (§113.8):
   `moduleRows` has no pick parameter at all, so today it passes BY
   CONSTRUCTION — which is stronger than a check, and worthless as one. It
   is kept because it is what fails the day somebody gives the function a
   third argument and reads it; the assertion that can fail today is the
   source one further down (*no landing-line pick is handed to it*). */
check("a client's landing-line pick cannot move the mark — it is Forefront's own answer",
  same(PICK_A, PICK_N) && same(PICK_B, PICK_N),
  PICK_A.map((r) => r.key + "=" + JSON.stringify(r.mark)).join(" "));
/* AND THE ROW NO LONGER CARRIES A SENTENCE AT ALL, asserted as an absence
   beside the presence that makes it mean something — a build that kept the
   line and added a mark would pass everything above and be exactly as tall
   as the cards Islam photographed. */
check("no row carries a line or a health word any more",
  PICK_N.every((r) => r.line === undefined && r.state === undefined) && PICK_N.some((r) => r.mark !== ""),
  Object.keys(PICK_N[0]).join(","));

console.log("\n4b · the landing line, declared and read (spec 056 §4.5, §359.4)");
/* EVERY MODULE DECLARES ITS SENTENCES, the first one the default, `none`
   among them so saying nothing is a choice — asked of every module rather
   than the two with sentences, or a third could declare nothing at all
   (§113.8). */
check("every module declares at least one line, keys unique, and Nothing among them",
  MODULES.every((k) => { const ls = MODULE_DEF[k].lines; const keys = ls.map((l) => l.key);
    return ls.length >= 1 && new Set(keys).size === keys.length && keys.includes("none") && ls.every((l) => l.label && l.example && typeof l.read === "function"); }),
  MODULES.map((k) => k + ":" + MODULE_DEF[k].lines.map((l) => l.key).join("|")).join(" "));
check("the two built modules with something to say declare it first, so an unchosen module says something",
  MODULE_DEF.strategy.lines[0].key !== "none" && MODULE_DEF.insights.lines[0].key !== "none",
  MODULE_DEF.strategy.lines[0].key + " / " + MODULE_DEF.insights.lines[0].key);
const F = { cycleOpen: true, cycleName: "H1", due: "30 Sep", total: 10, sub: 7, newReports: 2, latestReport: "Egypt retail outlook, Q3" };
check("an absent or unknown pick is the FIRST declared line, never nothing",
  lineDef("strategy", "").key === MODULE_DEF.strategy.lines[0].key && lineDef("strategy", "no-such").key === MODULE_DEF.strategy.lines[0].key);
check("the cycle's state reads the cycle: open, with the due day",
  landingLine("strategy", "cycle", F) === "Cycle open \u00b7 reports due 30 Sep", landingLine("strategy", "cycle", F));
check("…and closed says so rather than guessing", landingLine("strategy", "cycle", { ...F, cycleOpen: false }) === "No cycle open");
check("what is waiting counts SUBJECTS still to submit",
  landingLine("strategy", "waiting", F) === "3 of 10 still to submit", landingLine("strategy", "waiting", F));
check("…and every subject in says so", landingLine("strategy", "waiting", { ...F, sub: 10 }) === "Every unit has submitted");
check("Insights counts this month's reports and names the latest",
  landingLine("insights", "new", F) === "2 new reports this month" && landingLine("insights", "latest", F) === "Latest: Egypt retail outlook, Q3",
  landingLine("insights", "new", F) + " / " + landingLine("insights", "latest", F));
check("…one report is singular, none is said", landingLine("insights", "new", { ...F, newReports: 1 }) === "1 new report this month" && landingLine("insights", "new", { ...F, newReports: 0 }) === "No new reports this month");
check("Nothing draws no line, on every module", MODULES.every((k) => landingLine(k, "none", F) === ""));
/* A FACT THE READER COULD NOT SEE IS NOT NOUGHT (§35): unreadable facts give
   every line the empty string, never "0 of 0" or "No cycle open". */
check("unreadable facts say nothing rather than a false figure",
  MODULES.every((k) => MODULE_DEF[k].lines.every((l) => landingLine(k, l.key, NO_FACTS) === "")),
  MODULES.map((k) => MODULE_DEF[k].lines.map((l) => JSON.stringify(landingLine(k, l.key, NO_FACTS))).join("|")).join(" "));
/* ONE READER, AND ITS ONE REMAINING CONSUMER (§368). These two assertions
   were written against `moduleRows`' `line`, which §368 removed — the
   console draws Forefront's own mark instead (§4a above). They are REWRITTEN
   onto `landingLine`, never deleted (§218), because the rule they guard is
   still live: it is what the Landing line Setup page previews through
   lib/landing.ts's stamp, and it is the page a client sets. So the claim
   stands, and what changes is which caller it is asked of.

   AND WHAT IS NOT ASSERTED IS SAID (§54.5): with the client's landing gone
   (§360 made `/<client>` a redirect) and the console on its own mark, that
   Setup page's pick is read by its own previewer and by nothing else. It is
   recorded in the decisions log rather than guarded here, because a check
   that froze it would freeze the oddity. */
const UNPICKED = MODULES.filter((k) => k !== "strategy");
check("a module with no pick reads its FIRST DECLARED line",
  UNPICKED.length > 0 && UNPICKED.every((k) => landingLine(k, undefined, F) === lineDef(k, undefined).read(F)),
  UNPICKED.map((k) => k + "=" + JSON.stringify(landingLine(k, undefined, F))).join(" "));
check("…and a pick MOVES it, or the picker would be a control with nothing behind it",
  landingLine("strategy", "waiting", F) !== landingLine("strategy", "cycle", F),
  landingLine("strategy", "waiting", F) + " / " + landingLine("strategy", "cycle", F));
check("a client holding nothing besides the default gets one row", moduleRows(modulesFor([]), facts).length === 1);


/* ── 4c · WHO MAY OPEN A MODULE (§359.5, spec 056 §4.4, research R3) ──────
   The gate in front of a module's address, driven as the PURE decision it
   is (decideOpen — the route's mayOpenModule is that with the graph read
   under the tenant) against the worked example's own graph, with NO
   database: the seed is what a fresh client holds. BOTH ENDS of every rule
   (§94.2): a role shut is refused AND the same role opened again is served,
   the seat is served over a shut role, a module declaring no area is never
   gated, and the landing's list drops a shut module's row while keeping the
   rest — or a gate that opened for everybody (`gate-open`) passes the
   presence half of all of it. */
console.log("\n4c · who may open a module (§359.5)");
{
  const seed = JSON.parse(read("db/seed-state.json"));
  const graphWith = (mutate) => { const g = JSON.parse(JSON.stringify(seed)); mutate(g); return g; };
  const UK = Object.keys(seed.units)[0];
  const head = seed.unitRoles[UK].head, cust = seed.unitRoles[UK].custodian;
  const area = openingArea("insights");
  check("Insights is opened by its first declared area, whose shipped state is view",
    !!area && area.key === "a_insights" && area.shipped === "view", JSON.stringify(area));
  /* DERIVED (§214.3): whichever modules declare no area — Strategy is the
     only one today, and was not the only one yesterday (§363). */
  const NO_AREA = MODULES.filter((k) => !MODULE_DEF[k].areas.length);
  check("a module declaring no area is opened by nobody's grant",
    NO_AREA.length > 0 && NO_AREA.every((k) => openingArea(k) === null), NO_AREA.join(", "));
  /* absent = shipped, never none (§30.2) */
  check("with nothing stored a unit head opens Insights — absent is the shipped state, not a refusal",
    decideOpen("none", "insights", seed, head) === true);
  /* SHUT EVERY ROW THIS PERSON HOLDS, ASKED RATHER THAN TYPED (§218,
     §214.3, §255). Access is the MOST GENEROUS grant across the roles
     somebody holds (§33), so shutting ONE row is not shutting a person —
     and §381 made a tactic's owner a role, so this unit's head derives
     `towner` as well as `owner` and the assertion below started reporting a
     correct build broken. The roles come from the product's own rule
     (personRoles, the one both sides ask — §42), so the row derived by
     whatever somebody is named on NEXT is shut here the day it is added.

     THE CUSTODIAN BESIDE THEM IS WHAT MAKES IT MEAN ANYTHING (§113.8): a
     build that refused everybody passes the line above perfectly, so their
     rows are asserted UNTOUCHED and still open. */
  const rulesOf = createRequire(import.meta.url)(join(ROOT, "lib", "rules.js"));
  const rolesHeldBy = (key) => {
    const w = rulesOf.worldOf(seed);
    const p2 = (seed.people || []).find((x) => x.key === key);
    return Array.from(new Set(rulesOf.personRoles(w, p2).map((r) => r.role)));
  };
  const headRoles = rolesHeldBy(head), custRoles = rolesHeldBy(cust);
  check("the unit head holds more than the one row, so shutting one is not shutting them (§33, §381)",
    headRoles.length >= 2 && headRoles.includes("owner"), JSON.stringify(headRoles));
  const shutOwner = graphWith((g) => { headRoles.forEach((r) => { g.access[r] = g.access[r] || {}; g.access[r].a_insights = "none"; }); });
  check("…and with every row they hold shut, the same person is REFUSED by the decision the route asks",
    decideOpen("none", "insights", shutOwner, head) === false, JSON.stringify(headRoles));
  check("…while the custodian beside them, whose rows are untouched, still opens it (the grant is per role)",
    decideOpen("none", "insights", shutOwner, cust) === true,
    JSON.stringify([custRoles, custRoles.filter((r) => headRoles.includes(r))]));
  const openOwner = graphWith((g) => { g.access.owner.a_insights = "view"; });
  check("…and a stored view opens it", decideOpen("none", "insights", openOwner, head) === true);
  check("THE SEAT OPENS EVERYTHING: the Super user and the SMO team are served over a shut row (spec 046 §4.10)",
    decideOpen("super", "insights", shutOwner, head) === true && decideOpen("smoteam", "insights", shutOwner, head) === true);
  check("a module with no area is never gated, whatever the map says",
    NO_AREA.every((k) => decideOpen("none", k, shutOwner, head) === true), NO_AREA.join(", "));
  /* the floor: somebody on the register holding no role is judged on the
     Everyone-else row (§93) */
  const floor = graphWith((g) => { g.people.push({ key: "nobody_x", name: "Nobody Here", unit: UK, email: "" }); g.access.employee.a_insights = "none"; });
  check("a person holding no role is judged on the Everyone-else row — shut there, refused", decideOpen("none", "insights", floor, "nobody_x") === false);
  const floorOpen = graphWith((g) => { g.people.push({ key: "nobody_x", name: "Nobody Here", unit: UK, email: "" }); });
  check("…and open there by default", decideOpen("none", "insights", floorOpen, "nobody_x") === true);
  check("a person the register does not hold is judged as holding nothing — the shipped state",
    decideOpen("none", "insights", seed, "no-such-key") === true && decideOpen("none", "insights", null, head) === true);
  /* STRATEGY'S MATRIX IS BYTE-IDENTICAL EITHER SIDE OF A MODULE'S GRANT */
  const strip = (g) => JSON.stringify(Object.fromEntries(Object.entries(g.access).map(([r, row]) => [r, Object.fromEntries(Object.entries(row).filter(([k]) => k !== "a_insights"))])));
  check("a module's grant touches no cell of Strategy's matrix", strip(shutOwner) === strip(seed) && strip(openOwner) === strip(seed));
  /* THE CLIENT'S ADDRESS READS THE SAME ANSWER (§360, spec 057): there is
     no landing any more — `/<client>` redirects into the first module the
     person may OPEN, read from openableModules, the one reader the switcher
     and the card already read (§359.5). Asserted off the SOURCE (§6's
     method): a page that only redirects has nothing to render, so the
     thing that can drift is which list it asks. REWRITTEN, never loosened
     (§218): this asserted landingShape()'s module rows, which went with
     the landing. */
  const pageSrc = read("smp-app/app/(platform)/[slug]/page.tsx");
  check("a client's address asks openableModules and redirects into the first, never a second list",
    pageSrc.indexOf("openableModules(") > -1 && /redirect\(clientHref\(slug, open\[0\] \|\| DEFAULT_MODULE/.test(pageSrc) && pageSrc.indexOf("landingShape") < 0);
  check("…and draws no welcome of its own (the frozen welcome.js greets inside Strategy)",
    !/welcomeover|Welcome,|<main|<section/.test(pageSrc) && !read("smp-app/lib/landing.ts").includes("landingShape"));
  /* THE ROUTE ASKS BEFORE THE TABLE, read off the source (§6's method) */
  const routeSrc = read("smp-app/app/(platform)/[slug]/[...rest]/route.ts");
  check("the route asks the gate BEFORE serverFor and before the Setup document (research R3)",
    routeSrc.indexOf("mayOpenModule(") > -1 && routeSrc.indexOf("mayOpenModule(") < routeSrc.indexOf('w.rest[0] === "setup"') && routeSrc.indexOf("mayOpenModule(") < routeSrc.indexOf("serverFor(key)"));
}

console.log("\n5 · what a module's own page owes (driven)");
/* §363 REMOVED THE TRIAL MODULE AND THIS SECTION IS WHAT SURVIVED IT. That
   module existed to prove a module can be turned on for one client and
   opened, and its page was asserted here at length. Most of what was
   asserted was never about the trial at all — it was about ANY page a module
   draws for itself — so it is asked of every such module now, found rather
   than named (OWN_PAGE), and the next module is covered the day it lands.

   WHAT DID GO WITH IT, said rather than quietly dropped (§54.5): the trial's
   greeting was built from the client's REGISTER, so it proved a count the
   page could not read is SAID and never printed as a nought (§35, §93), and
   that a plural is not made by adding an "s" (§107.8). Insights answers the
   first of those in §2c — a library it could not read still draws, in the
   shipped colour — and the second lives in `plural()` in its own page with
   nobody asking it here.

   NO DATABASE ON PURPOSE: the tenant cannot be reached, which is also how
   each page's honest degrade is proved. */
const docOf = async (k, slug, name, have) => {
  const res = await serverFor(k)({ ...argsFor(k, []), slug, tenantName: name, have });
  return res.status === 200 ? await res.text() : "";
};
for (const k of OWN_PAGE) {
  const doc = await docOf(k, "raya-trade", "Raya Trade", HAVE_BOTH);
  const other = await docOf(k, "el-abd", "El Abd", HAVE_BOTH);
  /* THE PAGE NAMES THIS CLIENT, at both ends (§94.2): a page that named
     nobody, and a page that named everybody the same, are two different
     faults and only the second is caught by asking one document. This is
     what SMP_BREAK=static-hello takes away. */
  check("its document names THIS client — " + k,
    /<title>([^<]*)</.test(doc) && doc.includes("Raya Trade"),
    (doc.match(/<title>[^<]*/) || [""])[0]);
  check("...and a different client gets a different document — " + k,
    other.includes("El Abd") && !other.includes("Raya Trade"),
    (other.match(/<title>[^<]*/) || [""])[0]);
  /* THE WAY OUT (§61): a module you can open and not leave is a room with
     no door. The switcher is that door and it is asserted BOTH ways — the
     module you are in marked, and a client holding only Strategy offered no
     door to a module it does not have. */
  check("it offers a door OUT, back to the default module — " + k,
    doc.includes('href="' + clientHref("raya-trade", DEFAULT_MODULE, "") + '"'),
    (doc.match(/href="\/raya-trade\/[a-z]*"/g) || []).join(" "));
  check("...and the module you are IN is marked — " + k,
    new RegExp('aria-current="true">' + MODULE_DEF[k].label).test(doc),
    (doc.match(/aria-current="true">[A-Za-z]+/) || [""])[0]);
  check("a client holding only the default is offered no door it does not have — " + k,
    !(await docOf(k, "raya-trade", "Raya Trade", HAVE_ONE))
      .includes('href="' + clientHref("raya-trade", k, "") + '"'));
  check("there is no row of units — a module brings its own navigation or none (spec 046 §4.2) — " + k,
    !/data-u=|class="units"/.test(doc));
  /* The page is served under the shell's policy, which is `script-src 'self'`
     (lib/shell.ts SHELL_CSP): an inline handler here would render perfectly
     and never run, so the switcher is a <details> and this asserts it stays
     one. */
  check("nothing inline needs a script, or the policy would silence it — " + k,
    !/<script|onclick=/i.test(doc));
}

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
/* REWRITTEN, NEVER LOOSENED (§218): this held the call's exact text with
   `facts.picks` in it, which §368 removed — the mark is Forefront's own
   answer. Both halves of what it was guarding survive: the list is the
   client's own, and NO pick reaches the call, asserted as an absence beside
   it so wiring one back in goes red here as well as in §4a. */
check("the card reads the client's own list rather than a constant", api.includes("moduleRows(modulesFor(row.modules), facts)"));
check("…and no landing-line pick is handed to it", !/moduleRows\([^)]*picks/.test(api));
check("the drawer is told what this client has AND what it could be given", /modules: modulesFor\(row\.modules\)/.test(api) && /offer: offerable\(\)/.test(api));
check("turning one on is gated on the same rule as the rest of the configuration",
  /if \(action === "setModules"\)[\s\S]{0,900}mayConfigureClient/.test(api));
/* THE TWO REFUSALS ARE THE RULE AND NOT THE SCREEN'S (§42, §44): the drawer
   draws neither control, and the server has to refuse both anyway. */
check("the default cannot be switched off, however the request is spelt", /key === DEFAULT_MODULE\) return no\(400/.test(api));
check("and a module that is not built cannot be switched on", /!MODULE_DEF\[key\]\.built\) return no\(400/.test(api));
/* THE FLOW MOVED OUT OF THE CONSOLE (§360, spec 057): the client's set-up
   is one module, SMP-Project-Folder/src/client-setup.js, mounted by the
   frozen shell inside the platform's own Setup rail AND by the console for
   the two acts that stay there (creating a client; bringing an archived one
   back). REWRITTEN, never loosened (§218): every assertion below asked
   platform.html for a band that file no longer draws, and would have gone
   green on a build that drew the band nowhere had it been loosened to
   "somewhere". The band is asserted in the ONE file, and both hosts are
   asserted to LOAD that file — the console by its script tag (which
   build-shell.mjs refuses to build without) and the shell by the placeholder
   build-shell.mjs fills (§53.5). */
const cs = read("SMP-Project-Folder/src/client-setup.js");
const pf = read("platform.html");
check("the set-up flow draws the band under the client's name", cs.includes('el("div", "band")') && cs.includes("Modules this client has"));
check("its rows are the team list's own, so the section adds no vocabulary", /mods[\s\S]{0,700}el\("div", "teamrow"\)/.test(cs));
/* THE SUBJECT MOVED AND THE CHECK DID NOT (§354, §51.11), TWICE: §320.4
   drew this band under the client's name on the settings page, §322 carried
   it onto the set-up flow's first step, and §360 carried the flow itself
   into the platform. Scoped to that step's own text, because the flow builds
   several and an unscoped indexOf would compare it against another step's
   (§100.3, the trap the old note recorded). The band is on step ONE, the
   step about the client itself rather than about its organisation, after
   that step's own fields and before the archive block that ends it. */
const CS = "function clientStep(";
check("the set-up flow still has a step about the client itself to hang it on", cs.includes(CS));
const step = cs.slice(cs.indexOf(CS), cs.indexOf("function modulesBlock("));
check("the modules band is drawn on that step", /box\.appendChild\(modulesBlock\(\)\)/.test(step));
check("...after the client's own fields and before the ending block",
  step.indexOf("The client's name") < step.indexOf("modulesBlock()")
  && step.indexOf("modulesBlock()") < step.indexOf("archiveBlock()"),
  "name at " + step.indexOf("The client's name") + ", band at " + step.indexOf("modulesBlock()")
  + ", end at " + step.indexOf("archiveBlock()"));
check("and drawn ONCE — a band on two steps is two places to set one thing",
  (cs.match(/appendChild\(modulesBlock\(\)\)/g) || []).length === 1,
  String((cs.match(/appendChild\(modulesBlock\(\)\)/g) || []).length));
/* ONE FILE FOR BOTH HOSTS, and each host asserted to load it (§53.5): the
   console by name, the shell through the placeholder build-shell.mjs fills
   with the served copy's address. A build that edited client-setup.js and
   forgot to regenerate would ship the console's copy without the band. */
check("the console loads that one file rather than carrying a flow of its own",
  /<script src="\/client-setup\.js"><\/script>/.test(pf) && !pf.includes("Modules this client has"));
check("…and so does the shell: build.py's own list carries the file, so it is inside the served shell.js",
  /\("CLIENTSETUP",\s*"client-setup\.js"\)/.test(read("SMP-Project-Folder/src/build.py"))
  && /<script src="CLIENTSETUP"><\/script>/.test(read("SMP-Project-Folder/src/shell.html"))
  && read("smp-app/public/shell.js").includes("Modules this client has"));
check("and the copy the app serves was regenerated from it",
  read("smp-app/public/client-setup.js").includes("Modules this client has"));
const route = read("smp-app/app/(platform)/[slug]/[...rest]/route.ts");
check("the address is gated on the client's own list", /whereOf\(rest \|\| \[\], have\)/.test(route));
/* BOTH ENDS (§94.2): the route asks the table, AND it names no module of its
   own. A build that kept the table and left one `if (w.module === "…")` beside
   it would satisfy the first half and be exactly the drift the table removes. */
check("the route dispatches through the table (§354)", /serverFor\(key\)/.test(route));
check("...and names no module itself, so a fourth one does not edit this file",
  !/w\.module === "/.test(route), (route.match(/w\.module === "[a-z]*"/g) || []).join(" "));

console.log("\n7 · the switcher in the platform's top bar (driven)");
/* THE SHELL'S OWN BODY AND STYLESHEET, served over HTTP — `route.js` returns
   at once unless the address looks like /<client>/…, so a file:// page would
   pass every assertion here by never running the code (§94.11). The 3.4MB
   shell.js is deliberately NOT loaded: this asserts the switcher, not the
   platform. It IS mounted from a paint since §380, so the stub carries a
   one-line `paint` for route.js to wrap — the sentence that used to stand
   here said route.js builds it whether or not the app has hydrated, which
   stopped being true the day that moved (§104.8). */
const BODY = readFileSync(join(APP, "shell", "body.html"), "utf8");
const ROUTE = readFileSync(join(APP, "shell", "route.js"), "utf8");
const CSS = readFileSync(join(APP, "public", "platform.css"), "utf8");
/* THE FIXTURE IS THE PRODUCT'S OWN ANSWER (§53.5, §214.3): this was two
   entries typed out, one of them a module that no longer exists (§363). It
   is `moduleMenu()` now — the same function the server stamps the attribute
   from — so what is driven below is the list a real client would be sent,
   and a module added or removed changes this file nowhere. */
const MENU = moduleMenu(offerable());
const attr = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
/* AND THE STUB HAS TO CARRY A `paint`, BECAUSE THE SWITCHER IS A PAINT-TIME
   CONTROL NOW (§380). It was an IIFE built at load, and the comment above
   still said route.js "builds it whether or not the app has hydrated" — true
   until §380 moved it, because the list has to ask whether the tab row
   already reaches the library and at load that question is answered about the
   BAKED viewer. route.js wraps `paint` if there is one, so a stub with none
   never mounts the switcher at all and reported a correct build broken
   (§100.3: a stand-in that models less than the thing it stands in for). It
   is declared BEFORE route.js is parsed — that is when the wrap happens —
   and called after, which is the one paint the real platform makes on boot. */
const doc = (menu) => "<!doctype html>\n<html lang='en' data-module='strategy'" +
  (menu ? " data-modules='" + attr(JSON.stringify(menu)) + "'" : "") +
  (BREAK === "switch-always" ? " data-break='switch-always'" : "") +
  "><head><meta charset='utf-8'><link rel='stylesheet' href='/platform.css'></head><body class='ready'>" +
  BODY + "<script>window.paint = function () {};</script>" +
  "<script src='/route.js'></script><script>paint();</script></body></html>";
const srv = createServer((req, res) => {
  const p = String(req.url).split("?")[0];
  if (p === "/platform.css") { res.writeHead(200, { "Content-Type": "text/css" }); return res.end(CSS); }
  if (p === "/route.js") { res.writeHead(200, { "Content-Type": "application/javascript" }); return res.end(ROUTE); }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  /* THE STUB HONOURS THE SAME BREAK AS THE SERVER: this section serves the
     shell's body itself rather than going through shellDocument(), so
     without this the falsification would break the product and leave the
     check measuring an unbroken stub (§100.3).

     AND ONE MODULE IS A ONE-ENTRY LIST, NOT AN ABSENT ATTRIBUTE (§362.1).
     The stub modelled the server as it was, where `data-modules` carried the
     switcher's rule in its name; it is the LIST now — stamped for every
     client, because the client's own Setup rail reads it to draw the way
     across — and the "a menu of one is a door behind a door" test (§32)
     lives in route.js, which is what this section drives. A stub still
     omitting it would be testing a server that no longer exists. */
  res.end(doc(p.startsWith("/one/") ? [MENU[0]] : MENU));
});
await new Promise((r) => srv.listen(0, "127.0.0.1", r));
const base = "http://127.0.0.1:" + srv.address().port;
let browser = null;
try {
  browser = await chromium.launch({ executablePath: process.env.SMP_CHROME || undefined });
} catch (e) {
  check("a browser to drive the switcher in", false, e.message.split("\n")[0] + " — set SMP_CHROME");
}
if (browser) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 500 } });
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto(base + "/raya-trade/strategy/mobile/plan");
  await page.waitForTimeout(250);
  check("the switcher is drawn in the top bar", (await page.locator(".topmark").count()) === 1);
  /* FIRST IN THE ROW IS THE TOP LEFT (the mockup put it inside `.brand`, which
     is a COLUMN in the product — copied, it would have stranded the mark on a
     line of its own above the name). */
  check("it is the first thing in the row, not inside the brand block",
    (await page.evaluate("document.querySelector('.top .top-in').firstElementChild.className")).includes("topmark"));
  const geo = await page.evaluate(`(() => { const a = document.querySelector('.topmark').getBoundingClientRect(),
      b = document.querySelector('.brand h1').getBoundingClientRect();
      return { w: Math.round(a.width), h: Math.round(a.height), left: Math.round(a.left), titleLeft: Math.round(b.left),
               sameRow: Math.abs((a.top + a.height / 2) - (b.top + b.height / 2)) < 10 }; })()`);
  check("on the same line as the product's name, and before it", geo.sameRow && geo.left < geo.titleLeft, JSON.stringify(geo));
  check("and it is a square", geo.w === geo.h, geo.w + "x" + geo.h);
  /* MEASURED AS PAINT, never as a class (§94.8): a mark styled by nothing
     renders as a bare button and satisfies every assertion about its markup. */
  check("its shape is painted, not merely marked up",
    await page.evaluate("(() => { const s = getComputedStyle(document.querySelector('.topmark > summary')); return s.borderTopWidth === '1px' && s.borderTopStyle === 'solid'; })()"));
  check("the mark is DRAWN and not a font character (§52)", (await page.locator(".topmark > summary svg rect").count()) === 4);
  await page.locator(".topmark > summary").click();
  await page.waitForTimeout(200);
  const items = await page.locator(".topmark .menu button").allInnerTexts();
  check("the menu lists every module this client has",
    items.length === MENU.length && MENU.every((m, i) => items[i].startsWith(m.label)),
    items.map((t) => t.split("\n")[0]).join(", "));
  check("each carries the line the server gave it, never one worked out from the key",
    MENU.every((m, i) => items[i].includes(m.note)), items.map((t) => t.replace(/\n/g, " · ")).join(" | "));
  check("the module you are IN is marked",
    (await page.locator('.topmark .menu button[aria-current="true"]').innerText()).startsWith(MODULE_DEF[DEFAULT_MODULE].label));
  /* THE MENU IS OPEN AND ON SCREEN — a panel positioned off its own edge
     renders perfectly and cannot be read (§90: a control below the fold is a
     control that does nothing). */
  const box = await page.locator(".topmark .menu").boundingBox();
  check("and the open menu is on the page", box && box.x >= 0 && box.y >= 0 && box.width > 200, JSON.stringify(box));
  /* BOTH ENDS (§94.2, §32): a client with one module is offered no menu at
     all — a build that always drew it would pass everything above. */
  const one = await browser.newPage({ viewport: { width: 1400, height: 400 } });
  await one.goto(base + "/one/strategy/mobile");
  await one.waitForTimeout(250);
  check("a client with ONE module gets no switcher — a menu of one is a door behind a door",
    (await one.locator(".topmark").count()) === 0);
  check("no page error from any of it", errs.length === 0, errs.join(" | "));
  await browser.close();
}
srv.close();

console.log("\n%d ok, %d failed", ok, bad.length);
if (bad.length) { console.log("FAILED: " + bad.join("; ")); process.exit(1); }
