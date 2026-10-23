/* WHO MAY KEEP UP A WORKSPACE, AND HOW MANY PROCESSES THE PACK CHECK READS —
   the rule a save asks is the rule its button asks. Pure rules, plus the source
   of the places that must read them rather than a copy of them. --red makes
   each break in a copy and expects this check to fail on it. */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
const here = dirname(fileURLToPath(import.meta.url));
const shell = "../app/(ffp)/[slug]/processes/(shell)/";
const FILES = {
  access: "../ffp/lib/domain/access-control.ts",
  pack: "../ffp/lib/domain/pack-check.ts",
  org: "../ffp/lib/actions/organization.ts",
  action: "../ffp/lib/actions/pack-check.ts",
  hook: shell + "workspace-access.tsx",
  profile: shell + "workspace-profile.tsx",
  branding: shell + "workspace-branding.tsx",
  picker: shell + "export/export-picker-form.tsx",
};
const pathOf = (k) => process.env["UP_" + k.toUpperCase()] || join(here, FILES[k]);
const BREAKS = {
  "editor-may": ["access", 'WORKSPACE_UPKEEP_LEVEL: AccessLevel = "ADMIN"', 'WORKSPACE_UPKEEP_LEVEL: AccessLevel = "EDITOR"'],
  "card-asks-edit": ["profile", "const canKeepUp = useCanKeepUpWorkspace();", "const canKeepUp = useCanEdit();"],
  "branding-asks-edit": ["branding", "const canKeepUp = useCanKeepUpWorkspace();", "const canKeepUp = useCanEdit();"],
  "hook-own-rule": ["hook", "mayKeepUpWorkspace(access.accessLevel)", 'access.accessLevel === "ADMIN"'],
  "save-own-level": ["org", "requireWorkspaceAccess(parsed.data.workspaceId, WORKSPACE_UPKEEP_LEVEL);", 'requireWorkspaceAccess(parsed.data.workspaceId, "ADMIN");'],
  "no-ceiling": ["pack", "if (ticked > PACK_CHECK_MAX) {", "if (false) {"],
  "button-ignores": ["picker", "disabled={checking || checkBlocked !== null}", "disabled={checking || picked.size === 0}"],
  "action-own-max": ["action", ".max(PACK_CHECK_MAX)", ".max(12)"],
};
if (process.argv.includes("--red")) {
  const dir = join(process.env.TMPDIR || "/tmp", "upkeep-red"); mkdirSync(dir, { recursive: true });
  let bad = 0;
  for (const [n, [k, a, b]] of Object.entries(BREAKS)) {
    const src = readFileSync(pathOf(k), "utf8");
    if (!src.includes(a)) { console.log("BREAK DID NOT MATCH: " + n); bad++; continue; }
    const f = join(dir, n + "." + FILES[k].split(".").pop()); writeFileSync(f, src.replace(a, b));
    const r = spawnSync(process.execPath, ["--experimental-strip-types", fileURLToPath(import.meta.url)], { env: { ...process.env, ["UP_" + k.toUpperCase()]: f }, encoding: "utf8" });
    const fails = (r.stdout.match(/^ {2}FAIL/gm) || []).length;
    if (r.status === 0) { console.log("NOT RED: " + n); bad++; } else console.log("red " + fails + ": " + n);
  }
  process.exit(bad ? 1 : 0);
}
let ok = 0; const fails = [];
const check = (w, g) => { if (g) { ok++; console.log("  ok   " + w); } else { fails.push(w); console.log("  FAIL " + w); } };
const src = (k) => readFileSync(pathOf(k), "utf8");

const A = await import(pathToFileURL(pathOf("access")).href);
check("an Admin may change the profile and branding", A.mayKeepUpWorkspace("ADMIN") === true);
check("an Editor may not", A.mayKeepUpWorkspace("EDITOR") === false);
check("a Viewer may not", A.mayKeepUpWorkspace("VIEWER") === false);

const org = src("org");
const fn = (name) => (org.match(new RegExp("export async function " + name + "\\b[\\s\\S]*?\\n}\\n")) || [""])[0];
check("the profile save asks the shared level", /requireWorkspaceAccess\([^)]*WORKSPACE_UPKEEP_LEVEL\)/.test(fn("updateWorkspaceProfile")));
check("the branding save asks the shared level", /requireWorkspaceAccess\([^)]*WORKSPACE_UPKEEP_LEVEL\)/.test(fn("updateWorkspaceBranding")));
check("the hook asks the shared rule", src("hook").includes("mayKeepUpWorkspace(access.accessLevel)"));
for (const k of ["profile", "branding"]) {
  const s = src(k);
  check("the " + k + " card asks the upkeep hook, not the edit hook", s.includes("useCanKeepUpWorkspace()") && !/useCanEdit\(/.test(s));
}

const P = await import(pathToFileURL(pathOf("pack")).href);
check("the check reads up to 12 at a time", P.PACK_CHECK_MAX === 12);
check("nothing ticked: blocked, and says so", typeof P.packCheckBlocked(0) === "string");
check("one ticked: runs", P.packCheckBlocked(1) === null);
check("twelve ticked: runs", P.packCheckBlocked(12) === null);
const thirteen = P.packCheckBlocked(13);
check("thirteen ticked: blocked, naming the count and how many to untick", typeof thirteen === "string" && thirteen.includes("13 are ticked") && thirteen.includes("Untick 1"));
const action = src("action");
check("the server refuses above the shared limit, with no number of its own", action.includes(".max(PACK_CHECK_MAX)") && !/\.max\(\d+\)/.test(action.replace(/\.max\(200\)|\.max\(120\)/g, "")) && !/MAX_PROCESSES/.test(action));
const picker = src("picker");
check("the button is disabled by the shared rule", picker.includes("const checkBlocked = packCheckBlocked(picked.size);") && picker.includes("disabled={checking || checkBlocked !== null}"));
check("too many ticked is said in words, not only on hover", /picked\.size > PACK_CHECK_MAX && <p[^>]*>\{checkBlocked\}<\/p>/.test(picker));

console.log(`\n${ok} ok, ${fails.length} failed`); process.exit(fails.length ? 1 : 0);
