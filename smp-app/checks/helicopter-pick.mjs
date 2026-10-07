/* HELICOPTER PICKER (§493) — pure rules, no browser. --red makes each break in a copy. */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const here = dirname(fileURLToPath(import.meta.url));
const real = join(here, "../ffp/lib/domain/helicopter-pick.ts");
const BREAKS = {
  "main-alone": ["for (const p of [group.main, ...group.subs]) {\n    if (on)", "for (const p of [group.main]) {\n    if (on)"],
  "no-indeterminate": ['n === ids.length ? "all" : "some"', 'n === ids.length ? "all" : "none"'],
  "always-all": ["shownCount === total ?", "true ?"],
  "origin-ignored": ["if (shown.has(p.branchFrom.processId)) continue;", ""],
  "new-hidden": ["allIds.filter((id) => !h.has(id))", "allIds.filter((id) => false)"],
};
if (process.argv.includes("--red")) {
  const dir = join(process.env.TMPDIR || "/tmp", "hp-red"); mkdirSync(dir, { recursive: true });
  const src = readFileSync(real, "utf8"); let bad = 0;
  for (const [n, [a, b]] of Object.entries(BREAKS)) {
    if (!src.includes(a)) { console.log("BREAK DID NOT MATCH: " + n); bad++; continue; }
    const f = join(dir, n + ".ts"); writeFileSync(f, src.replace(a, b));
    const r = spawnSync(process.execPath, ["--experimental-strip-types", fileURLToPath(import.meta.url)], { env: { ...process.env, HP_MODULE: f }, encoding: "utf8" });
    const k = (r.stdout.match(/^ {2}FAIL/gm) || []).length;
    if (r.status === 0) { console.log("NOT RED: " + n); bad++; } else console.log("red " + k + ": " + n);
  }
  process.exit(bad ? 1 : 0);
}
const M = await import(process.env.HP_MODULE || real);
let ok = 0; const fails = [];
const check = (w, g, d) => { if (g) { ok++; console.log("  ok   " + w); } else { fails.push(w); console.log("  FAIL " + w + (d ? " — " + d : "")); } };
const P = [
  { id: "1", code: "ADM1", name: "Admin", parentCode: null },
  { id: "2", code: "ADM101", name: "Sub a", parentCode: "ADM1" },
  { id: "3", code: "ADM102", name: "Sub b", parentCode: "ADM1" },
  { id: "4", code: "FIN1", name: "Finance", parentCode: null },
];
const g = M.groupProcesses(P);
check("two groups, subs under their main", g.length === 2 && g[0].subs.length === 2 && g[1].subs.length === 0);
const all = new Set(["1", "2", "3", "4"]);
const off = M.toggleGroup(all, g[0], false);
check("unticking a main hides its subs", !off.has("1") && !off.has("2") && !off.has("3") && off.has("4"));
check("ticking a main shows its subs", M.toggleGroup(new Set(), g[0], true).size === 3);
check("a sub alone changes only itself", !M.toggleOne(all, "2").has("2") && M.toggleOne(all, "2").has("3"));
check("main with some subs is indeterminate", M.groupState(new Set(["1", "2"]), g[0]) === "some");
check("none and all states", M.groupState(new Set(), g[0]) === "none" && M.groupState(all, g[0]) === "all");
check("label all", M.pickLabel(4, 4) === "All (4)");
check("label some", M.pickLabel(1, 4) === "1 of 4");
const procs = [{ id: "3", branchFrom: { processId: "2" } }, { id: "4", branchFrom: null }];
const codes = new Map(P.map((p) => [p.id, p.code]));
check("link to hidden origin is noted", M.hiddenOrigins(procs, codes, new Set(["3", "4"]))["3"] === "ADM101");
check("no note when origin shown", Object.keys(M.hiddenOrigins(procs, codes, all)).length === 0);
check("a hidden process gets no note of its own", Object.keys(M.hiddenOrigins(procs, codes, new Set(["4"]))).length === 0);
const s = M.shownFromHidden(["1", "2", "9"], ["2"]);
check("remembered hidden stays hidden, new ones show", !s.has("2") && s.has("1") && s.has("9"));
console.log(`\n${ok} ok, ${fails.length} failed`); process.exit(fails.length ? 1 : 0);
