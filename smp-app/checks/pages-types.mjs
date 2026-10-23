/* THE STRATEGY PAGES, READ BY TYPESCRIPT'S CHECKER (§589) — no browser, no
   database, and nothing in the pages is edited. §585 described the shared
   rules; this lets the pages see that description. They are plain scripts
   sharing one page, so the checker is handed them the way the browser runs
   them: build.py's own list read out of build.py (§53.5), the shell's inline
   script, theme.js and route.js, with the names the library files put on the
   page (SMPRules and the rest) declared as what those files export. Every
   page call into the rules is then checked against the rules' own types.

   THE PAGES ARE NOT CLEAN AND THIS DOES NOT PRETEND THEY ARE. Today the
   checker reports 97 findings, every one READ and none a fault (§589 names
   the kinds): spreadsheet layouts built from mixed pieces, a number written
   into page text, a property added to a list. They are recorded in
   pages-types.known.json — file, code and message, never a line, so an edit
   above one does not move it — and the check fails on any finding beyond
   them, or on a recorded one that has gone (the list stays exact, or it
   stops meaning anything).

   A NEW FINDING IS READ BEFORE IT IS RECORDED. Fix it if it is real; if it
   is noise, `--write` records it — never to make a red check green unread.

   --red makes each fault below in a copy and asserts a NEW finding lands in
   the broken file: a rule the pages call misspelt, a rule called one
   argument short, the world and the viewer swapped, a function from another
   file misspelt, a misspelt property on a page element, a misspelt global.

     node checks/pages-types.mjs          # run from smp-app/
     node checks/pages-types.mjs --red    # every break must go red
     node checks/pages-types.mjs --write  # record today's findings, after reading them */
import { readFileSync, writeFileSync, copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const APP = join(here, "..");
const REPO = join(APP, "..");
const SRC = join(REPO, "SMP-Project-Folder", "src");
const TSC = join(APP, "node_modules", "typescript", "bin", "tsc");
const KNOWN = join(here, "pages-types.known.json");

/* WHAT THE PAGE HAS THAT THE CHECKER CANNOT SEE. Written into the copy the
   check runs on, never into smp-app/ — a .d.ts there would widen the Next
   app's own DOM types in `npm run typecheck`.
   · The library files are modules to the checker (they also export for
     Node), so the names they put on the page are declared as their exports
     — CLOSED: an object written in JavaScript is open to the checker, so
     `SMPRules.mayDestory` read as `any` and no misspelt rule was ever a
     finding (--red caught that). A mapped copy of the same keys is closed.
     recipes.js is the same shape.
   · Three helpers the shell puts on `window` and calls bare, and the
     test hooks and browser extras the pages read off `window`.
   · The element properties the pages read off a lookup. The checker types
     `querySelector` as a bare Element, which has no `value` or `dataset`; the
     pages know what they looked up. Named one by one rather than opened with
     an index signature, so `el.datset` is still a finding (--red asserts it). */
const GLOBALS = `type Closed<T> = { [K in keyof T]: T[K] };
declare var SMPRules: Closed<typeof import("./rules.js")>;
declare var SMPDiff: Closed<typeof import("./graph-diff.js")>;
declare var SMPAudience: Closed<typeof import("./audience.js")>;
declare var MAIL: Closed<typeof import("./mail-html.js")>;
declare var RECIPES: typeof import("./recipes.js").RECIPES;
declare var recipeCount: typeof import("./recipes.js").recipeCount;
declare var recipesFlat: typeof import("./recipes.js").recipesFlat;
declare var focusNoScroll: (f: any) => void;
declare var wirePersonFields: (root: any) => void;
declare var wirePersonDialogControls: (root: any) => void;
interface Window {
  focusNoScroll: (f: any) => void; wirePersonFields: (root: any) => void; wirePersonDialogControls: (root: any) => void;
  __copWaitMs: number; __copWork: any; __copSize: any; __smpRefresh: any;
  getScreenDetails: () => Promise<any>; clipboardData: any; msCrypto: Crypto;
}
interface Screen { isExtended: boolean; }
interface Element {
  dataset: DOMStringMap; value: any; hidden: boolean | "until-found"; focus(options?: FocusOptions): void;
  style: any; click(): void; disabled: boolean; blur(): void; title: string; select(): void;
  files: FileList | null; offsetHeight: number; offsetWidth: number; offsetLeft: number;
  inert: boolean; checked: boolean; tBodies: any; setSelectionRange(start: number | null, end: number | null, direction?: any): void;
  selectionStart: number | null; selectionEnd: number | null; open: any; placeholder: string;
  options: any; multiple: boolean; isContentEditable: boolean; src: string;
}
interface EventTarget {
  closest(selectors: string): any; matches(selectors: string): boolean; getAttribute(name: string): string | null;
  isContentEditable: boolean; blur(): void; value: any; tagName: string; open: any; id: string; checked: boolean;
}
interface Event {
  key: string; code: string; altKey: boolean; shiftKey: boolean; metaKey: boolean; ctrlKey: boolean;
  pointerId: number; clientX: number; clientY: number; button: number;
}
`;

const BREAKS = {
  "rule-misspelt": ["config-data.js", "function mayDestroy(){ return SMPRules.mayDestroy(world(), viewer()); }",
                    "function mayDestroy(){ return SMPRules.mayDestory(world(), viewer()); }"],
  "rule-short": ["config-data.js", "return SMPRules.grantAtPage(world(), viewer(), pageKey, target);",
                 "return SMPRules.grantAtPage(world(), viewer(), pageKey);"],
  "world-viewer-swapped": ["config-data.js", "function inOffice(){ return SMPRules.isOffice(world(), viewer()); }",
                           "function inOffice(){ return SMPRules.isOffice(viewer(), world()); }"],
  "function-misspelt": ["present.js", 'var aspOn = compOn("group", "aspiration");', 'var aspOn = compOm("group", "aspiration");'],
  "element-property-misspelt": ["shell-inline.js", "pop.dataset.ddpop", "pop.datset.ddpop"],
  "global-misspelt": ["present.js", 'var asp = aspOn ? String(GROUP.aspiration || "").trim() : ""',
                      'var asp = aspOn ? String(GRUOP.aspiration || "").trim() : ""'],
};

/* The pages as the browser runs them, in a scratch directory. */
function assemble() {
  const dir = mkdtempSync(join(tmpdir(), "pages-types-"));
  const buildPy = readFileSync(join(SRC, "build.py"), "utf8");
  const list = [...buildPy.matchAll(/\("([A-Z]+)","([^"]+)"\)/g)].map((m) => m[2]);
  if (list.length < 20) throw new Error("pages-types: build.py's list was not read (" + list.length + " entries)");
  const scripts = [];
  for (const f of list) {
    copyFileSync(join(SRC, f), join(dir, basename(f)));
    if (!f.startsWith("../../lib/")) scripts.push(basename(f));
  }
  copyFileSync(join(SRC, "theme.js"), join(dir, "theme.js"));
  copyFileSync(join(APP, "shell", "route.js"), join(dir, "route.js"));
  const m = /<script>\n([\s\S]*)<\/script>\s*$/.exec(readFileSync(join(SRC, "shell.html"), "utf8"));
  if (!m) throw new Error("pages-types: the shell's inline script was not found");
  writeFileSync(join(dir, "shell-inline.js"), m[1]);
  writeFileSync(join(dir, "globals.d.ts"), GLOBALS);
  return { dir, files: ["globals.d.ts", ...scripts, "theme.js", "shell-inline.js", "route.js"] };
}

/* LOOSE, as §585's check is: TypeScript 7 defaults to strict with no
   tsconfig, and --ignoreConfig because smp-app's own would otherwise make it
   refuse a run on named files — a refusal --red would count as a catch. */
function findings({ dir, files }) {
  const r = spawnSync(process.execPath, [TSC, "--ignoreConfig", "--noEmit", "--allowJs", "--checkJs", "--skipLibCheck",
    "--strict", "false", "--target", "es2022", "--module", "commonjs", "--lib", "es2022,dom,dom.iterable",
    "--types", "node", "--typeRoots", join(APP, "node_modules", "@types"), ...files], { cwd: dir, encoding: "utf8" });
  const out = r.stdout + r.stderr, list = [];
  for (const l of out.split("\n")) {
    const f = /^([^\s(]+)\((\d+),\d+\): error (TS\d+): (.*)$/.exec(l);
    if (f) list.push({ file: f[1], line: +f[2], code: f[3], message: f[4] });
  }
  if (r.status !== 0 && !list.length) throw new Error("pages-types: the checker did not run\n" + out.trim());
  return list;
}
const keyOf = (f) => f.file + "\u0000" + f.code + "\u0000" + f.message;
function tally(list) { const t = new Map(); for (const f of list) t.set(keyOf(f), (t.get(keyOf(f)) || 0) + 1); return t; }
function known() {
  const t = new Map();
  for (const k of JSON.parse(readFileSync(KNOWN, "utf8")).findings) t.set(keyOf(k), k.count);
  return t;
}
/* The findings beyond what is recorded, by key: every line carrying an
   over-count key is printed, because which of them is the new one cannot be
   told from a count. */
function beyond(list, rec) {
  const now = tally(list), extra = [];
  for (const [k, n] of now) if (n > (rec.get(k) || 0)) extra.push(...list.filter((f) => keyOf(f) === k));
  return extra;
}

if (process.argv.includes("--write")) {
  const a = assemble();
  try {
    const t = tally(findings(a));
    const out = [...t].map(([k, count]) => { const [file, code, message] = k.split("\u0000"); return { file, code, message, count }; })
      .sort((x, y) => (x.file + x.code + x.message).localeCompare(y.file + y.code + y.message));
    writeFileSync(KNOWN, JSON.stringify({ note: "Read before recorded: none of these is a fault (§589). Rewrite with --write only after reading every new one.", findings: out }, null, 1) + "\n");
    console.log("recorded " + out.reduce((s, f) => s + f.count, 0) + " findings under " + out.length + " keys");
  } finally { rmSync(a.dir, { recursive: true, force: true }); }
  process.exit(0);
}

if (process.argv.includes("--red")) {
  const rec = known(); let bad = 0;
  for (const [n, [file, a, b]] of Object.entries(BREAKS)) {
    const asm = assemble();
    try {
      const src = readFileSync(join(asm.dir, file), "utf8");
      if (src.split(a).length !== 2) { console.log("BREAK DID NOT MATCH ONCE: " + n); bad++; continue; }
      writeFileSync(join(asm.dir, file), src.replace(a, b));
      const hit = beyond(findings(asm), rec).filter((f) => f.file === file);
      if (!hit.length) { console.log("NOT RED: " + n); bad++; }
      else console.log("red: " + n + " (" + [...new Set(hit.map((f) => f.code))].join(", ") + ")");
    } finally { rmSync(asm.dir, { recursive: true, force: true }); }
  }
  process.exit(bad ? 1 : 0);
}

let ok = 0; const fails = [];
const check = (w, g, d) => { if (g) { ok++; console.log("  ok   " + w); } else { fails.push(w); console.log("  FAIL " + w + (d ? "\n" + d : "")); } };
const asm = assemble();
try {
  const list = findings(asm), rec = known(), now = tally(list);
  const total = [...rec.values()].reduce((s, n) => s + n, 0);
  check("the pages are read as one page: " + (asm.files.length - 1) + " scripts, the shell's own among them",
    asm.files.length > 30 && asm.files.includes("shell-inline.js"));
  const extra = beyond(list, rec);
  check("no finding beyond the " + total + " recorded ones (each read, none a fault)", !extra.length,
    extra.map((f) => "       " + f.file + ":" + f.line + "  " + f.code + "  " + f.message).join("\n"));
  const gone = [...rec].filter(([k, n]) => (now.get(k) || 0) < n).map(([k]) => k.split("\u0000").join("  "));
  check("every recorded finding is still there, so the list stays exact", !gone.length,
    gone.map((g) => "       " + g).join("\n") + "\n       — fixed or moved: run with --write to record the shorter list");
} finally { rmSync(asm.dir, { recursive: true, force: true }); }
console.log(`\n${ok} ok, ${fails.length} failed`); process.exit(fails.length ? 1 : 0);
