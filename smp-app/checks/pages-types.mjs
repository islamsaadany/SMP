/* THE STRATEGY PAGES AND THE CONSOLE, READ BY TYPESCRIPT'S CHECKER (§589, §594) — no browser, no
   database, and nothing in the pages is edited. §585 described the shared
   rules; this lets the pages see that description. They are plain scripts
   sharing one page, so the checker is handed them the way the browser runs
   them: build.py's own list read out of build.py (§53.5), the shell's inline
   script, theme.js and route.js, with the names the library files put on the
   page (SMPRules and the rest) declared as what those files export. Every
   page call into the rules is then checked against the rules' own types.

   THE PAGES ARE NOT CLEAN AND THIS DOES NOT PRETEND THEY ARE. Today the
   checker reports 98 findings, every one READ and none a fault (§589 names
   the kinds): spreadsheet layouts built from mixed pieces, a number written
   into page text, a property added to a list. They are recorded in
   pages-types.known.json — file, code and message, never a line, so an edit
   above one does not move it — and the check fails on any finding beyond
   them, or on a recorded one that has gone (the list stays exact, or it
   stops meaning anything).

   AND THE CONSOLE PAGE (§594), read the same way as a second subject with
   its own list (console-types.known.json): platform.html's own script, plus
   the two scripts its tags load — the debrief splitter, declared closed
   like the library files, and the set-up flow (client-setup.js), which the
   console mounts for Add a client and an archived client. Most of the
   console's findings are the set-up flow naming STRATEGY-PAGE data the
   console does not have. Each is guarded or never reached there today, and
   that is the point of listing them: a NEW one is a name the console may
   reach and throw on, which is how §467's crash came about.

   A NEW FINDING IS READ BEFORE IT IS RECORDED. Fix it if it is real; if it
   is noise, `--write` records it — never to make a red check green unread.

   --red makes each fault below in a copy and asserts a NEW finding lands in
   the broken file. On the strategy pages: a rule the pages call misspelt, a
   rule called one argument short, the world and the viewer swapped, a
   function from another file misspelt, a misspelt property on a page
   element, a misspelt global. On the console: a function, a variable, the
   splitter and an element's method misspelt, and the create piece reaching
   for the strategy page's GROUP. NOT caught, on either page: a misspelt
   member of an object a page script builds itself (CLIENTSETUP.mountCreat)
   — an object written in JavaScript is open, and only the library names
   are declared closed.

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
const DOM = `interface Element {
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
const STRATEGY_GLOBALS = `type Closed<T> = { [K in keyof T]: T[K] };
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
` + DOM;
/* The console loads the debrief splitter, a module to the checker for the
   library files' reason, and nothing else of the frozen product's but the
   set-up flow — whose strategy-page names it does NOT have (§594). */
const CONSOLE_GLOBALS = `type Closed<T> = { [K in keyof T]: T[K] };
declare var MemorySplit: Closed<typeof import("./memory-split.js")>;
` + DOM;

const STRATEGY_BREAKS = {
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

const CONSOLE_BREAKS = {
  "function-misspelt": ["console-inline.js", 'function mpost(body) { return send("/api/memory", body); }',
                        'function mpost(body) { return sendd("/api/memory", body); }'],
  "variable-misspelt": ["console-inline.js", 'return TABS_KNOWN.indexOf(h) >= 0 ? h : "mywork";',
                        'return TABS_KNOW.indexOf(h) >= 0 ? h : "mywork";'],
  "splitter-misspelt": ["console-inline.js", "var out = window.MemorySplit.split(text);", "var out = window.MemorySplit.splitt(text);"],
  "element-method-misspelt": ["console-inline.js", 'document.getElementById("signout").addEventListener("click"',
                              'document.getElementById("signout").addEventListner("click"'],
  /* §467's class: the set-up flow's CREATE piece, which the console mounts,
     reaching for a strategy-page name the console does not have. */
  "setup-reaches-strategy-name": ["client-setup.js", 'var draft = { name:"", industry:"", size:"", notes:"" };',
                                  'var draft = { name:"", industry:"", size:"", notes:"", group: GROUP };'],
};

/* The pages as the browser runs them, in a scratch directory. */
function assembleStrategy() {
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
  writeFileSync(join(dir, "globals.d.ts"), STRATEGY_GLOBALS);
  return { dir, files: ["globals.d.ts", ...scripts, "theme.js", "shell-inline.js", "route.js"] };
}

/* THE CONSOLE (platform.html, served unchanged by lib/shell.ts): its script
   tags, read off the page rather than listed here, each mapped to the file
   build-shell.mjs copies to that address — a script added to the page that
   this does not know is a refusal, never a page quietly checked without it —
   and its own inline script. */
const CONSOLE_SRC = { "/memory-split.js": join(APP, "lib", "memory-split.cjs"), "/client-setup.js": join(SRC, "client-setup.js") };
function assembleConsole() {
  const dir = mkdtempSync(join(tmpdir(), "console-types-"));
  const page = readFileSync(join(REPO, "platform.html"), "utf8");
  const files = ["globals.d.ts"];
  for (const m of page.matchAll(/<script src="([^"]+)"><\/script>/g)) {
    if (!CONSOLE_SRC[m[1]]) throw new Error("pages-types: platform.html loads " + m[1] + ", which this check does not know");
    const name = basename(m[1]);
    copyFileSync(CONSOLE_SRC[m[1]], join(dir, name));
    if (name !== "memory-split.js") files.push(name);
  }
  const m = /<script>\n([\s\S]*)<\/script>\s*<\/body>/.exec(page);
  if (!m) throw new Error("pages-types: platform.html's own script was not found");
  writeFileSync(join(dir, "console-inline.js"), m[1]);
  writeFileSync(join(dir, "globals.d.ts"), CONSOLE_GLOBALS);
  files.push("console-inline.js");
  return { dir, files };
}

const SUBJECTS = {
  strategy: { title: "the strategy pages", known: join(here, "pages-types.known.json"),
              note: "Read before recorded: none of these is a fault (§589). Rewrite with --write only after reading every new one.",
              assemble: assembleStrategy, breaks: STRATEGY_BREAKS, minFiles: 30, own: "shell-inline.js" },
  console: { title: "the console page", known: join(here, "console-types.known.json"),
             note: "Read before recorded (§594). The console's own are noise. The rest are the set-up flow's STRATEGY-PAGE names, which the console page does not have: on its two entry points (Add a client, an archived client) each is behind a typeof guard or on a path the console never takes, and client-setup-outside.py drives both with no page error. A NEW one here is a name the console may reach and throw on (§467's fault): confirm it is guarded or unreachable from the console BEFORE recording it with --write.",
             assemble: assembleConsole, breaks: CONSOLE_BREAKS, minFiles: 2, own: "console-inline.js" },
};

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
function known(path) {
  const t = new Map();
  for (const k of JSON.parse(readFileSync(path, "utf8")).findings) t.set(keyOf(k), k.count);
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
  for (const sub of Object.values(SUBJECTS)) {
    const a = sub.assemble();
    try {
      const t = tally(findings(a));
      const out = [...t].map(([k, count]) => { const [file, code, message] = k.split("\u0000"); return { file, code, message, count }; })
        .sort((x, y) => (x.file + x.code + x.message).localeCompare(y.file + y.code + y.message));
      writeFileSync(sub.known, JSON.stringify({ note: sub.note, findings: out }, null, 1) + "\n");
      console.log(sub.title + ": recorded " + out.reduce((n, f) => n + f.count, 0) + " findings under " + out.length + " keys");
    } finally { rmSync(a.dir, { recursive: true, force: true }); }
  }
  process.exit(0);
}

if (process.argv.includes("--red")) {
  let bad = 0;
  for (const sub of Object.values(SUBJECTS)) {
    const rec = known(sub.known);
    for (const [n, [file, a, b]] of Object.entries(sub.breaks)) {
      const asm = sub.assemble();
      try {
        const src = readFileSync(join(asm.dir, file), "utf8");
        if (src.split(a).length !== 2) { console.log("BREAK DID NOT MATCH ONCE: " + sub.title + " / " + n); bad++; continue; }
        writeFileSync(join(asm.dir, file), src.replace(a, b));
        const hit = beyond(findings(asm), rec).filter((f) => f.file === file);
        if (!hit.length) { console.log("NOT RED: " + sub.title + " / " + n); bad++; }
        else console.log("red: " + sub.title + " / " + n + " (" + [...new Set(hit.map((f) => f.code))].join(", ") + ")");
      } finally { rmSync(asm.dir, { recursive: true, force: true }); }
    }
  }
  process.exit(bad ? 1 : 0);
}

let ok = 0; const fails = [];
const check = (w, g, d) => { if (g) { ok++; console.log("  ok   " + w); } else { fails.push(w); console.log("  FAIL " + w + (d ? "\n" + d : "")); } };
for (const sub of Object.values(SUBJECTS)) {
  console.log("── " + sub.title);
  const asm = sub.assemble();
  try {
    const list = findings(asm), rec = known(sub.known), now = tally(list);
    const total = [...rec.values()].reduce((n, c) => n + c, 0);
    check(sub.title + " read as one page: " + (asm.files.length - 1) + " scripts, its own among them",
      asm.files.length - 1 >= sub.minFiles && asm.files.includes(sub.own));
    const extra = beyond(list, rec);
    check("no finding beyond the " + total + " recorded ones, each read", !extra.length,
      extra.map((f) => "       " + f.file + ":" + f.line + "  " + f.code + "  " + f.message).join("\n"));
    const gone = [...rec].filter(([k, n]) => (now.get(k) || 0) < n).map(([k]) => k.split("\u0000").join("  "));
    check("every recorded finding is still there, so the list stays exact", !gone.length,
      gone.map((g) => "       " + g).join("\n") + "\n       — fixed or moved: run with --write to record the shorter list");
  } finally { rmSync(asm.dir, { recursive: true, force: true }); }
}
console.log(`\n${ok} ok, ${fails.length} failed`); process.exit(fails.length ? 1 : 0);
