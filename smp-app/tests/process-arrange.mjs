/* How the process library is arranged. Run: node --experimental-strip-types tests/process-arrange.mjs
   Pure functions, no database. */
import * as A from "../ffp/lib/domain/process-arrange.ts";

let pass = 0, fail = 0;
const check = (name, cond) => { if (cond) { pass++; return; } fail++; console.log("  FAIL  " + name); };
const P = (id, code, name, o = {}) => ({ id, parentProcessId: null, code, name, sortOrder: null, dept: null, state: 4, steps: 0, updated: 0, ...o });
const ids = (rows) => rows.map((r) => r.process.id).join(",");

const list = [
  P("fin", "FIN100", "Finance", { dept: "Finance", steps: 4, updated: 30, state: 5 }),
  P("hr", "HRX100", "HR", { dept: "HR processes", steps: 9, updated: 10 }),
  P("hr3", "HRX103", "Appraisal", { parentProcessId: "hr", dept: "HR processes", steps: 2, updated: 50 }),
  P("hr1", "HRX101", "Onboarding", { parentProcessId: "hr", dept: "HR processes", steps: 7, updated: 20 }),
  P("it", "ITX100", "IT", { dept: "IT", steps: 1, updated: 40 }),
  P("rhi", "ETE100", "RHI", { dept: null, steps: 24, updated: 5 }),
];

check("by code is the order the list always had: a main, its subs, the next main", ids(A.arrangeProcessTree(list, "code")) === "rhi,fin,hr,hr1,hr3,it");
check("every process appears exactly once whatever the key", A.ARRANGE_KEYS.every((k) => A.arrangeProcessTree(list, k).length === list.length));
check("subs stay under their own main whatever the key", A.ARRANGE_KEYS.every((k) => { const r = A.arrangeProcessTree(list, k); const i = r.findIndex((x) => x.process.id === "hr"); return r.slice(i + 1, i + 3).every((x) => x.depth === 1 && x.process.parentProcessId === "hr"); }));
check("by name sorts each level on its own", ids(A.arrangeProcessTree(list, "name")) === "fin,hr,hr3,hr1,it,rhi");
check("by name reversed", ids(A.arrangeProcessTree(list, "name", true)) === "rhi,it,hr,hr1,hr3,fin");
check("by number of steps: fewest first at each level", ids(A.arrangeProcessTree(list, "steps")) === "it,fin,hr,hr3,hr1,rhi");
check("by last changed, newest first when reversed", ids(A.arrangeProcessTree(list, "updated", true)) === "it,fin,hr,hr3,hr1,rhi");
check("a process with no department goes last by department", A.arrangeProcessTree(list, "dept").at(-1).process.id === "rhi");
check("by where it is: the ones that need the office first (a lower rank), ties by code", ids(A.arrangeProcessTree(list, "state")) === "rhi,hr,hr1,hr3,it,fin");

// My order
const placed = list.map((p) => (p.id === "it" ? { ...p, sortOrder: 0 } : p.id === "fin" ? { ...p, sortOrder: 1 } : p));
check("my order: placed ones first, in their order, then the rest by code", ids(A.arrangeProcessTree(placed, "mine")) === "it,fin,rhi,hr,hr1,hr3");
check("my order with nothing placed is the code order", ids(A.arrangeProcessTree(list, "mine")) === ids(A.arrangeProcessTree(list, "code")));
check("a tie falls back to the code, so the order never shifts between loads", ids(A.arrangeProcessTree([P("b", "B", "Same"), P("a", "A", "Same")], "name")) === "a,b");

// a process whose main is not in the list stands as a main; a cycle cannot lose anyone
check("a sub whose main is not listed is not lost", ids(A.arrangeProcessTree([P("x", "X1", "X", { parentProcessId: "gone" })], "code")) === "x");
check("a cycle cannot lose or double anyone", A.arrangeProcessTree([P("a", "A", "A", { parentProcessId: "b" }), P("b", "B", "B", { parentProcessId: "a" })], "code").length === 2);

// Grouping
const g = A.groupBlocks(A.arrangeProcessTree(list, "code"), (p) => ({ "HR processes": 0, Finance: 1, IT: 2 })[p.dept] ?? 3);
check("grouping moves whole blocks: HR with its subs, then Finance, IT, and the rest", ids(g) === "hr,hr1,hr3,fin,it,rhi");
check("grouping keeps each block's own order", ids(A.groupBlocks(A.arrangeProcessTree(list, "name"), () => 0)) === ids(A.arrangeProcessTree(list, "name")));

// Moving
check("move up swaps with the one above", A.moveWithin(["a", "b", "c"], "b", "UP").join() === "b,a,c");
check("move down swaps with the one below", A.moveWithin(["a", "b", "c"], "b", "DOWN").join() === "a,c,b");
check("moving the first up, or the last down, changes nothing", A.moveWithin(["a", "b"], "a", "UP").join() === "a,b" && A.moveWithin(["a", "b"], "b", "DOWN").join() === "a,b");
check("an unknown id changes nothing", A.moveWithin(["a", "b"], "z", "UP").join() === "a,b");
check("an unknown key is the default", A.parseArrange("nonsense") === "code" && A.parseArrange("mine") === "mine");

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
