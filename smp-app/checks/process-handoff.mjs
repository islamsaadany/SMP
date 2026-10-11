/* Cross-process hand-overs: the pure rules. No database, no browser.
 *   node --experimental-strip-types checks/process-handoff.mjs         the check
 *   node --experimental-strip-types checks/process-handoff.mjs --red   each break made in a COPY
 * Both ends every time: each refusal AND the allowed case. */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const real = join(here, "../ffp/lib/domain/step-handoff.ts");

const BREAKS = {
  "same-process-ok": ['if (fromProcess === toProcess) return "SAME_PROCESS";', ""],
  "no-duplicate": ['return "DUPLICATE";', "return null;"],
  "no-loop": ['return "LOOP";', "return null;"],
  "loop-ignores-connections": ["reaches(toStepId, fromStepId, [...connections, ...handoffs])", "reaches(toStepId, fromStepId, [...handoffs])"],
  "self-ok": ['if (fromStepId === toStepId) return "SAME_STEP";', ""],
  "reconcile-keeps-deleted": ["if (!seen.has(h.id)) deletes.push", "if (false) deletes.push"],
  "reconcile-recreates-unchanged": ["if (d.fromStepId === matched.fromStepId && d.label === (matched.label ?? \"\")) continue;", ""],
  "reconcile-create-first": ["return [...deletes, ...creates];", "return [...creates, ...deletes];"],
  "unknown-ok": ['return "UNKNOWN_STEP";', "return null;"],
  "loop-everything": ["reaches(toStepId, fromStepId, [...connections, ...handoffs])", "true"],
};

if (process.argv.includes("--red")) {
  const dir = join(process.env.TMPDIR || "/tmp", "handoff-red");
  mkdirSync(dir, { recursive: true });
  const src = readFileSync(real, "utf8");
  let notRed = 0;
  for (const [name, [from, to]] of Object.entries(BREAKS)) {
    if (!src.includes(from)) { console.log("BREAK DID NOT MATCH: " + name); notRed++; continue; }
    const f = join(dir, name + ".ts");
    writeFileSync(f, src.replace(from, to));
    const r = spawnSync(process.execPath, ["--experimental-strip-types", fileURLToPath(import.meta.url)],
      { env: { ...process.env, HANDOFF_MODULE: f }, encoding: "utf8" });
    const n = (r.stdout.match(/^ {2}FAIL/gm) || []).length;
    if (r.status === 0) { console.log("NOT RED: " + name); notRed++; } else console.log("red " + n + ": " + name);
  }
  process.exit(notRed ? 1 : 0);
}

const { judgeHandoff, reaches, reconcileHandoffDrafts } = await import(process.env.HANDOFF_MODULE || real);
let ok = 0; const bad = [];
const check = (what, good, detail) => {
  if (good) { ok++; console.log("  ok   " + what); }
  else { bad.push(what); console.log("  FAIL " + what + (detail ? "  — " + detail : "")); }
};

// IT: it1 -> it2.  HR: hr1 -> hr2.  FIN: f1.
const procOf = new Map([["it1","IT"],["it2","IT"],["hr1","HR"],["hr2","HR"],["f1","FIN"]]);
const conns = [{ fromStepId: "it1", toStepId: "it2" }, { fromStepId: "hr1", toStepId: "hr2" }];
const j = (a, b, h = []) => judgeHandoff({ fromStepId: a, toStepId: b }, procOf, conns, h);

check("a step in another process is allowed", j("it1", "hr2") === null, j("it1", "hr2"));
check("the reverse direction is a different link and is allowed", j("hr2", "f1") === null);
check("the same step is refused", j("it1", "it1") === "SAME_STEP");
check("two steps of one process are refused", j("it1", "it2") === "SAME_PROCESS");
check("an unknown step is refused", j("it1", "nope") === "UNKNOWN_STEP");
const existing = [{ fromStepId: "it2", toStepId: "hr1" }];
check("a duplicate is refused", j("it2", "hr1", existing) === "DUPLICATE");
// it2 -> hr1 exists, hr1 -> hr2 inside HR. Proposing hr2 -> it1 closes IT -> HR -> IT.
check("a circle through the other process's own connections is refused", j("hr2", "it1", existing) === "LOOP", j("hr2", "it1", existing));
check("a circle through hand-overs alone is refused", judgeHandoff({ fromStepId: "f1", toStepId: "it2" }, procOf, conns, [{ fromStepId: "it2", toStepId: "f1" }]) === "LOOP");
check("a link that closes no circle is still allowed next to existing ones", j("it1", "hr2", existing) === null);
check("reaches follows both kinds of edge", reaches("it2", "hr2", [...conns, ...existing]) === true);
check("reaches is false when nothing leads there", reaches("hr2", "it1", conns) === false);

const ex = [{ id: "h1", fromStepId: "it1", label: null }, { id: "h2", fromStepId: "f1", label: "Yes" }];
const rec = (st) => reconcileHandoffDrafts(ex, st);
check("an untouched list changes nothing", rec([{ handoffId: "h1", fromStepId: "it1", label: "" }, { handoffId: "h2", fromStepId: "f1", label: "Yes" }]).length === 0);
check("a box left out is removed", JSON.stringify(rec([{ handoffId: "h1", fromStepId: "it1", label: "" }])) === JSON.stringify([{ kind: "delete", handoffId: "h2" }]));
check("a box cleared is removed", rec([{ handoffId: "h1", fromStepId: "", label: "" }, { handoffId: "h2", fromStepId: "f1", label: "Yes" }])[0]?.handoffId === "h1");
const changed = rec([{ handoffId: "h1", fromStepId: "it2", label: "" }, { handoffId: "h2", fromStepId: "f1", label: "Yes" }]);
check("a changed step is a delete then a create, delete first", changed.length === 2 && changed[0].kind === "delete" && changed[1].kind === "create" && changed[1].fromStepId === "it2");
check("a new box is a create; an unset new box is nothing", rec([{ handoffId: "h1", fromStepId: "it1", label: "" }, { handoffId: "h2", fromStepId: "f1", label: "Yes" }, { handoffId: null, fromStepId: "hr1", label: "" }, { handoffId: null, fromStepId: "", label: "" }]).length === 1);

console.log(bad.length ? `\n${bad.length} FAILED` : `\nall ${ok} passed`);
process.exit(bad.length ? 1 : 0);
