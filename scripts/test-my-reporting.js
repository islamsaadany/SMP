/* ── MY REPORTING, ASKED OF THE PRODUCT'S OWN READERS (§382, spec 062) ──
   No browser and no database: the frozen sources are evaluated in a vm the
   way `smp-app/lib/frozen.cjs` and `scripts/extract-kb.js` already do, so the
   rules under this feature are exercised against the BAKED worked example —
   the same data the page draws from.

   WHAT THIS CAN AND CANNOT SEE, SAID RATHER THAN LEFT AS AN ABSENCE (§54.5):
   it asks every rule and calls the real renderer, so a builder wired to
   nothing is caught (§96); it cannot press a control, so the tab appearing on
   the row and the three buttons landing are NOT asserted here — that is
   `checks/my-reporting.py`'s half, and this sandbox has no Playwright.

   BOTH ENDS OF EVERY CLAIM (§94.2). The switch is the subject: with it off
   the product must answer byte for byte what it answered before, or "nothing
   on Roles & access moves" is a promise rather than a measurement. */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const SRC = path.join(__dirname, "..", "SMP-Project-Folder", "src");

/* THE LIST IS BUILD.PY'S OWN, NEVER A TYPED COPY (§53.5). A source added to
   the platform tomorrow is loaded here that day, and one this harness cannot
   evaluate turns the run red rather than going quietly missing — which is how
   the first version of this file met `joinTarget is not defined` from
   `templates.js`, a file it had simply never been told about. */
const BUILD = fs.readFileSync(path.join(SRC, "build.py"), "utf8");
const FILES = [...BUILD.match(/for tag, f in \[([\s\S]*?)\]:/)[1]
                     .matchAll(/\("[A-Z]+"\s*,\s*"([^"]+)"\)/g)].map((m) => m[1]);

/* THE SOURCES THAT NEED A BROWSER, NAMED RATHER THAN SKIPPED (§54.5). Each
   reaches for `document` at its top level, so it cannot be evaluated with no
   DOM — and a stand-in document would model less than a browser and report a
   working build broken (§100.3). None of them draws My reporting. The set is
   ASSERTED below, so a file growing that dependency is a failure here rather
   than a silent omission.

   AND IT DID EXACTLY THAT AT THE MERGE (2026-09-21). §385's Insights tab
   added `insights.js`, which wires its own listeners at load, and this
   assertion went red on the merged tree — the check working, not breaking.
   REWRITTEN rather than loosened (§218, §214.3): the file is NAMED here with
   its reason, and the sentence below no longer says "the three", which was
   the literal that moved. Both ends still hold, so a source that quietly
   stops loading is still a failure. */
/* AND AGAIN AT §403 (2026-09-24): Home moved under the chrome, so
   `welcome.js` wires its own listeners at load now — named here with that
   reason, the same rewrite as insights.js above (§218). */
const NEEDS_A_DOCUMENT = ["history.js", "insights.js", "safety.js", "sync.js", "welcome.js"];
const threw = [];

const ctx = vm.createContext({ console, JSON, Math, Date, Intl, setTimeout });
vm.runInContext("var window = this, document = undefined, localStorage = undefined;", ctx);
FILES.forEach(function (f) {
  try {
    vm.runInContext(fs.readFileSync(path.join(SRC, f), "utf8"), ctx, { filename: f });
  } catch (e) {
    threw.push(path.basename(f) + " — " + e.message);
  }
});
const run = (code) => vm.runInContext(code, ctx);

let ok = 0, bad = 0;
function ck(name, cond, detail) {
  if (cond) { ok++; console.log("  ok   " + name); }
  else { bad++; console.log("  FAIL " + name + (detail !== undefined ? "  — " + JSON.stringify(detail) : "")); }
}
function sec(n) { console.log("\n" + n); }

/* ── 0 · the harness itself ───────────────────────────────────────── */
sec("0 · every source build.py names is loaded here");
ck("build.py's list was read, not typed", FILES.length > 20, FILES.length);
ck("only the sources named as needing a browser are missing",
   threw.length === NEEDS_A_DOCUMENT.length &&
   NEEDS_A_DOCUMENT.every(function (f) { return threw.some(function (t) { return t.indexOf(f) === 0; }); }),
   threw);
ck("and the shared rules are the browser's own copy, not a second require",
   run("typeof SMPRules === 'object' && typeof SMPRules.namedOn === 'function'"));

/* ── 1 · the switch is off until somebody turns it on ─────────────── */
sec("1 · off is what an untouched tenant already is");
ck("the shipped graph carries no switch", run("GROUP.lineOwners === undefined"));
ck("so the rule answers off", run("SMPRules.lineOwnersOn(world()) === false"));
ck("and nobody owns a line", run("(VIEWER='dir', myLineRows().length)") === 0,
   run("(VIEWER='dir', myLineRows().length)"));
ck("the tab is offered to nobody", run(`PEOPLE.every(function(p){ VIEWER = p.key; return !ownsAnyLine(); })`));

/* The subject: the worked example names Ramy Behairy on two Mobile tactics. */
const HIS = run(`(function(){ GROUP.lineOwners = true; VIEWER = "dir";
  return myLineRows().map(function(r){ return r.target + "|" + r.obj.name; }); })()`);
sec("2 · switched on, the lines are the ones the plan names");
ck("Ramy Behairy owns two lines", HIS.length === 2, HIS);
ck("both are Mobile's", HIS.every(function (h) { return h.indexOf("mobile|") === 0; }), HIS);
ck("and they are the plan's own rows, not a copy",
   run(`(VIEWER="dir", myLineRows().every(function(r){
          var subj = unitLike(r.target), found = false;
          (subj.items||[]).forEach(function(p){ (p.tactics||[]).forEach(function(x){ if (x === r.obj) found = true; }); });
          return found; }))`));
ck("somebody the plan names nowhere owns none",
   run(`(VIEWER="ceo", myLineRows().length) === 0`));

/* ── 3 · one door: he types on My reporting and nowhere else ──────── */
sec("3 · one door");
const ROW = `(function(){ var r = (VIEWER="dir", myLineRows()[0]); return r; })()`;
ck("he enters it on My reporting",
   run(`(function(){ var r = ${ROW}; return canEnterFigure(r.target, r, "mine"); })()`));
ck("and NOT on the unit's Reporting page",
   run(`(function(){ var r = ${ROW}; return canEnterFigure(r.target, r, "unit"); })()`) === false);
ck("the custodian cannot type it either",
   run(`(function(){ VIEWER="dir"; var r = myLineRows()[0]; VIEWER="own_mob";
        return canEnterFigure(r.target, r, "unit") || canEnterFigure(r.target, r, "mine"); })()`) === false);
ck("the office still can",
   run(`(function(){ VIEWER="dir"; var r = myLineRows()[0]; VIEWER="smo";
        return canEnterFigure(r.target, r, "unit"); })()`));
/* THE STATE IS MADE, BECAUSE THE DEMO CANNOT HOLD IT (§255). Measured: all
   83 tactics in the worked example name an owner, so an unowned row is a
   shape this plan never takes — and every assertion about it would pass on a
   build that had lost the fallback entirely. It is made on a real row and PUT
   BACK (§94.2), asserted to have been made, or a fixture that changed nothing
   proves nothing (§94.5). */
ck("the demo names an owner on every tactic, so this one is made",
   run(`(function(){ var n = 0;
        myLineTargets().forEach(function(t){ var s = unitLike(t); if (!s) return;
          (s.items||[]).forEach(function(p){ (p.tactics||[]).forEach(function(x){
            if (!SMPRules.lineOwnerName(x)) n++; }); }); });
        return n; })()`) === 0);
ck("a tactic with NO owner is the unit's exactly as before",
   run(`(function(){
        var r = (VIEWER="dir", myLineRows()[0]), had = r.obj.owner;
        r.obj.owner = "";
        var made = !SMPRules.lineOwnerName(r.obj);
        VIEWER = "own_mob";
        var answer = canEnterFigure(r.target, { kind:"tactic", id:r.obj.id, obj:r.obj }, "unit");
        r.obj.owner = had;
        return made && answer === true; })()`));

/* ── 3b · §387: ONE QUESTION, AND IT IS "DO I RUN THIS ONE?" ───────
   Islam picked option A of two drawn: the switch decides, and §384's Tactic
   owner row comes off Roles & access. The rule that replaces the two controls
   is asked once per subject, and three of its four answers REVERSE something
   §382 built — so a file that only measured the unchanged half would be green
   on a build that had not made the change at all (§94.2).

   §3 ABOVE IS THE UNCHANGED HALF AND STAYS EXACTLY AS IT WAS: `dir` runs
   nothing, so his line is his on My reporting and nobody else's anywhere.
   What follows is every state that person cannot be in. */
sec("3b · §387 — a subject I run, and a name that reaches nobody");
/* THE STATE IS FOUND, NOT MADE, AND IT IS ASSERTED TO HAVE BEEN FOUND
   (§94.5): one demo tactic on Mobile is owned by the unit's own head, which
   is the case §382 never had to think about. */
const RUNS = `(function(){ var hit = null;
  (UNITS.mobile.items||[]).forEach(function(p){ (p.tactics||[]).forEach(function(x){
    if (SMPRules.ownedBy(x, personBy("mobhead"))) hit = hit || x; }); });
  return hit; })()`;
ck("the demo names the unit's own head on a tactic there",
   run(`${RUNS} !== null`));
ck("he runs Mobile", run(`(VIEWER="mobhead", canReport("mobile"))`));
ck("...so he types his own line on the unit's Reporting page",
   run(`(function(){ var x = ${RUNS}; VIEWER = "mobhead";
        return canEnterFigure("mobile", { kind:"tactic", id:x.id, obj:x }, "unit"); })()`));
ck("...and My reporting draws him no row for it",
   run(`(function(){ VIEWER = "mobhead";
        return myLineRows().filter(function(r){ return r.target === "mobile"; }).length; })()`) === 0);
/* AND A NAME THAT REACHES NOBODY IS NOT AN OWNER — a DIFFERENT state from
   §3's "no owner at all", and the one that actually occurs: 32 of the worked
   example's 83 tactics name somebody the register does not hold, because a
   plan is typed by a custodian and a register is filled from HR. Classified
   as its owner's, such a row is refused to everybody, since there is nobody
   to be them (§61). Made on a real row and PUT BACK (§94.2). */
ck("the demo really does hold names the register does not",
   run(`(function(){ var n = 0, w = world();
        myLineTargets().forEach(function(t){ var s = unitLike(t); if (!s) return;
          (s.items||[]).forEach(function(p){ (p.tactics||[]).forEach(function(x){
            if (SMPRules.lineOwnerName(x) && !SMPRules.lineOwnerIsHere(w, x)) n++; }); }); });
        return n; })()`) > 0);
ck("a line whose owner names nobody is the unit's",
   run(`(function(){ var x = ${RUNS}, had = x.owner;
        x.owner = "Abdelrahim";                      /* one word: the floor is two (§130.7) */
        var made = SMPRules.lineOwnerName(x) && !SMPRules.lineOwnerIsHere(world(), x);
        VIEWER = "own_mob";
        var answer = canEnterFigure("mobile", { kind:"tactic", id:x.id, obj:x }, "unit");
        x.owner = had;
        return made && answer === true; })()`));
ck("...and the fixture put the name back", run(`${RUNS} !== null`));

/* ── 3c · AND THE ROLE THAT WAS HERE FOR TWO DAYS IS GONE (§384 → §387) ──
   §384 gave a tactic's Owner a row on Roles & access; option A takes it off,
   and `scripts/test-tactic-owner.js` goes with it, because its whole subject
   was that role (§24). ONE of its claims survives the removal and is carried
   here rather than lost with the file (§218, §301.7's rule): that section had
   to exempt its own role from the Contributor floor, since the floor fires
   only for somebody holding NO role at all and a Tactic owner with every cell
   at none would have taken away the floor it stood on. With the role gone the
   exemption goes too, and what must be true again is what was true before
   §384 — a tactic's owner named nowhere else is a Contributor, with the view
   the floor gives. The state is MADE, because nobody in the worked example
   stands on the floor at all (§255). */
sec("3c · §387 — the role is gone, and the floor it stood on is back");
const REGISTER_WAS = run("PEOPLE.length");
ck("no role on the table is a tactic owner's",
   run(`SMPRules.ROLES.filter(function(r){ return r.key === "towner"; }).length`) === 0);
ck("...and the table is not simply empty", run("SMPRules.ROLES.length") > 5);
ck("nothing derives one either",
   run(`(function(){ var w = world(), n = 0;
        PEOPLE.forEach(function(p){ (SMPRules.personRoles(w, p)||[]).forEach(function(r){
          if (r.role === "towner") n++; }); });
        return n; })()`) === 0);
ck("somebody whose only name on the plan is a tactic's Owner is a Contributor",
   run(`(function(){
        var x = (UNITS.mobile.items[0].tactics||[])[0], had = x.owner;
        var p = { key:"t385", name:"Floor Person 385", active:true, unit:"mobile" };
        PEOPLE.push(p); x.owner = p.name;
        var roles = SMPRules.personRoles(world(), p) || [];
        var only = roles.length === 1 && roles[0].role === "contrib" && roles[0].at === "mobile";
        x.owner = had; PEOPLE.pop();
        return only; })()`));
/* AND THE FIRST DRAFT OF THIS LINE COULD NOT FAIL — `PEOPLE.length ===
   PEOPLE.length`, which is true of every build there has ever been (§113.8,
   written into this file by the section that quotes it). The count is taken
   BEFORE the fixture runs and compared against it. */
ck("...and the fixture put the register back", run("PEOPLE.length") === REGISTER_WAS,
   [run("PEOPLE.length"), REGISTER_WAS]);

/* ── 4 · the note stays the unit's ────────────────────────────────── */
sec("4 · you enter the figure, the unit writes the note");
ck("the owner gets no note box",
   run(`(function(){ var r = ${ROW}; return canEnterNote(r.target, r); })()`) === false);
ck("the custodian keeps it",
   run(`(function(){ VIEWER="dir"; var r = myLineRows()[0]; VIEWER="own_mob";
        return canEnterNote(r.target, r); })()`));

/* ── 5 · the lock is per subject, and stored as an absence ────────── */
sec("5 · Save draft locks his lines, per subject");
ck("nothing is locked to begin with", run(`(VIEWER="dir", lineLockShut("mobile"))`) === false);
run(`(VIEWER="dir", setLineLock("mobile", true))`);
ck("locked, his box shuts",
   run(`(function(){ var r = ${ROW}; return canEnterFigure(r.target, r, "mine"); })()`) === false);
ck("and it is HIS key, so another owner is untouched",
   run(`(function(){ VIEWER="mobhead"; return lineLockShut("mobile"); })()`) === false);
run(`(VIEWER="dir", setLineLock("mobile", false))`);
ck("reopened, the box is live again",
   run(`(function(){ var r = ${ROW}; return canEnterFigure(r.target, r, "mine"); })()`));
ck("and the map is GONE, not left empty (§50.6)", run("REVIEW.lines === undefined"),
   run("JSON.stringify(REVIEW.lines)"));

/* ── 6 · the collaborator narrowing, both ends ────────────────────── */
sec("6 · only an owner reports");
/* THE STATE IS MADE, AND THE MEASUREMENT THAT SAYS SO IS THE FINDING (§255).
   Eight demo tactics carry collaborators and every one of those names is a
   bare first name — "Nour", "Dalia", "Hossam" — which matches NOBODY on the
   register, because `nameRuns()` has a two-word floor (§130.7: a lone first
   name would hand a reporting right to whoever shares it). So not one of the
   eight has that right today, and a fixture that used them would have watched
   a refusal that was already a refusal and called the narrowing proved.

   Three things have to be made, each measured rather than assumed: a
   collaborator the register can recognise, a person whose own unit is the one
   the plan names them in (the Contributor floor asks `p.unit`), and the cell
   at edit — §147.7's first condition, without which nothing here is reachable
   at all. All three are put back (§94.2). */
const NOBODY_MATCHES = run(`(function(){ var named = 0, matched = 0;
  myLineTargets().forEach(function(t){ var s = unitLike(t); if (!s) return;
    (s.items||[]).forEach(function(p){ (p.tactics||[]).forEach(function(x){
      var c = Array.isArray(x.collaborators) ? x.collaborators : [];
      c.forEach(function(n){ named++;
        if (PEOPLE.some(function(pp){ return SMPRules.namedOn({owner:n}, pp); })) matched++; }); }); }); });
  return [named, matched]; })()`);
ck("the demo's own collaborators match nobody, so this one is made",
   NOBODY_MATCHES[0] > 0 && NOBODY_MATCHES[1] === 0, NOBODY_MATCHES);

const NARROW = run(`(function(){
  GROUP.lineOwners = true; VIEWER = "dir";
  var lr = myLineRows(), r = lr[1] || lr[0];
  var them = PEOPLE.filter(function(p){ return !SMPRules.personRoles(world(), p).length; })[0];
  if (!them) return { made:false };
  var hadC = r.obj.collaborators, hadU = them.unit, hadA = ACCESS.contrib && ACCESS.contrib.a_unit_own;
  r.obj.collaborators = [them.name];
  them.unit = r.target;
  ACCESS.contrib = ACCESS.contrib || {};
  ACCESS.contrib.a_unit_own = "edit";
  VIEWER = them.key;
  var row = reportItems(unitLike(r.target)).filter(function(x){ return x.id === r.id; })[0];
  var out = {
    made: !!row && (row.collaborators || []).indexOf(them.name) > -1,
    theyAreNotTheOwner: !SMPRules.ownedBy({ owner: r.obj.owner }, them),
    floor: SMPRules.personRoles(world(), them).map(function(x){ return x.role; }).join(",")
  };
  GROUP.lineOwners = true;  out.on  = canEnterFigure(r.target, row, "unit");
  delete GROUP.lineOwners;  out.off = canEnterFigure(r.target, row, "unit");
  GROUP.lineOwners = true;
  VIEWER = "dir";
  out.ownerKeepsIt = canEnterFigure(r.target, myLineRows().filter(function(x){ return x.id === r.id; })[0], "mine");
  r.obj.collaborators = hadC;
  them.unit = hadU;
  if (hadA === undefined) delete ACCESS.contrib.a_unit_own; else ACCESS.contrib.a_unit_own = hadA;
  return out; })()`);

ck("the state was made — they are a collaborator and not the owner",
   NARROW.made && NARROW.theyAreNotTheOwner, NARROW);
ck("and being named is what makes them a Contributor", NARROW.floor === "contrib", NARROW.floor);
ck("with the switch OFF they enter it exactly as they do today", NARROW.off === true, NARROW.off);
ck("with it ON they enter nothing", NARROW.on === false, NARROW.on);
ck("and the OWNER of that same line still enters it on his own tab",
   NARROW.ownerKeepsIt === true, NARROW.ownerKeepsIt);
ck("the fixture put the plan back", run(`(function(){
   var lr = (VIEWER="dir", myLineRows()), r = lr[1] || lr[0];
   return !(r.obj.collaborators && r.obj.collaborators.length); })()`));

/* ── 7 · where the tab sits ───────────────────────────────────────── */
sec("7 · the tab sits on the person's own place");
ck("a unit's person — their unit", run(`(VIEWER="dir", myLinesHome())`) === "mobile",
   run(`(VIEWER="dir", myLinesHome())`));
ck("a function's person — their function", run(`(VIEWER="fn_fin", myLinesHome())`) === "fn:finance",
   run(`(VIEWER="fn_fin", myLinesHome())`));
ck("somebody at the group — the group", run(`(VIEWER="smo", myLinesHome())`) === "group",
   run(`(VIEWER="smo", myLinesHome())`));
ck("and it is drawn on that place and no other",
   run(`(VIEWER="dir", [myLinesHere("mobile"), myLinesHere("retailstores"), myLinesHere("group")])`)
     .join(",") === "true,false,false",
   run(`(VIEWER="dir", [myLinesHere("mobile"), myLinesHere("retailstores"), myLinesHere("group")])`));

/* ── 8 · the page is BUILT, not merely defined (§96) ──────────────── */
sec("8 · the page draws");
const html = run(`(VIEWER="dir", renderMyLines())`);
ck("it renders", typeof html === "string" && html.length > 200, (html || "").slice(0, 120));
ck("it names his own line", html.indexOf("Clean and standardize") > -1);
ck("it names his unit", html.indexOf("Mobile") > -1);
ck("it carries a live box addressed to that unit", /data-rep=/.test(html) && /data-repu="mobile"/.test(html),
   (html.match(/data-repu="[^"]*"/g) || []).slice(0, 3));
ck("it offers Save draft", html.indexOf("data-lineslock=") > -1);
ck("with one unit it draws no filter", html.indexOf("data-linesf=") < 0);
ck("it draws no other unit's tactic",
   html.indexOf("Site selection model") < 0 && html.indexOf("Self-serve merchant") < 0);

/* THE FILTER'S OTHER END (§94.2). One unit draws no chips — asserted above —
   and a build that simply never drew them would pass that. The demo names
   him on one unit only, so the second is MADE (§255): a tactic somewhere else
   given his name, the page drawn, and the plan put back. */
const TWO = run(`(function(){
  var other = null;
  myLineTargets().forEach(function(t){
    if (other || t === "mobile") return;
    var s = unitLike(t); if (!s) return;
    (s.items||[]).forEach(function(p){ (p.tactics||[]).forEach(function(x){
      if (!other) other = { t:t, x:x, had:x.owner }; }); });
  });
  if (!other) return { made:false };
  var me = PEOPLE.filter(function(p){ return p.key === "dir"; })[0];
  other.x.owner = me.name;
  VIEWER = "dir";
  var out = { made:true, where:other.t, units: myLineRows().map(function(r){ return r.target; }) };
  var h = renderMyLines();
  out.chips = (h.match(/data-linesf="[^"]*"/g) || []);
  out.bothDrawn = h.indexOf(other.x.name.slice(0, 20)) > -1;
  /* and the filter narrows to one of them */
  MYLINEF = other.t;
  var h2 = renderMyLines();
  out.filtered = h2.indexOf(other.x.name.slice(0, 20)) > -1 &&
                 h2.indexOf("Clean and standardize") < 0;
  MYLINEF = "";
  other.x.owner = other.had;
  return out; })()`);
ck("the second unit was made", TWO.made && TWO.units.length > 2, TWO);
ck("with two units it draws a chip per unit and an All",
   TWO.chips.length >= 3, TWO.chips);
ck("...and both units' lines are on the page", TWO.bothDrawn, TWO.bothDrawn);
ck("...and picking one narrows to it", TWO.filtered, TWO.filtered);
ck("the fixture put that plan back",
   run(`(VIEWER="dir", myLineRows().length) === 2`),
   run(`(VIEWER="dir", myLineRows().length)`));
const off = run(`(function(){ delete GROUP.lineOwners; var h = renderMyLines(); GROUP.lineOwners = true; return h; })()`);
ck("and with the switch off it says there is nothing", off.indexOf("No line is yours") > -1,
   off.slice(0, 100));

/* ── 9 · what is waiting on the person who owns lines ─────────────── */
sec("9 · the welcome screen's row");
/* `welcome.js` is one of the three files that reach for `document` at load,
   so the ROW cannot be built here and the browser check owns that half
   (§54.5 — said, not left as an absence). What CAN be asked without a DOM is
   the number the row is made of, which is the part that could be wrong: it
   counts a line only where the product would let this person type into it,
   so the switch, a closed cycle, a locked cycle and their own saved draft all
   answer through `canEnterFigure()` rather than through a second rule. */
const OWED = `(function(){ var n = 0;
  myLineRows().forEach(function(r){
    if (lineAnswered(r)) return;
    if (!canEnterFigure(r.target, r, "mine")) return;
    n++; });
  return n; })()`;
run(`GROUP.lineOwners = true; VIEWER = "dir";`);
const before = run(OWED);
ck("he is owed a number the row could state", typeof before === "number", before);
ck("and it is never more lines than he holds", before <= run("myLineRows().length"),
   [before, run("myLineRows().length")]);
run(`(VIEWER="dir", setLineLock("mobile", true))`);
ck("a saved draft stops his lines waiting on him", run(OWED) === 0, run(OWED));
run(`(VIEWER="dir", setLineLock("mobile", false))`);
ck("reopened, they wait again", run(OWED) === before, [run(OWED), before]);
run("delete GROUP.lineOwners;");
ck("and with the switch off nothing waits", run(OWED) === 0, run(OWED));
run("GROUP.lineOwners = true;");

console.log("\n" + ok + " passed, " + bad + " failed");
process.exit(bad ? 1 : 0);
