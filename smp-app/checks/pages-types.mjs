/* THE STRATEGY PAGES AND THE CONSOLE, READ BY TYPESCRIPT'S CHECKER (§589, §594, §596) — no browser, no
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
   reach and throw on. AND SINCE §596 THE CONSOLE'S PATHS ARE WALKED (see
   consolePaths below): from the console's own calls into the set-up flow,
   every strategy-page name reachable must be guarded — which a list of
   names could never say, because §467's crash was a new path to an old one.

   A NEW FINDING IS READ BEFORE IT IS RECORDED. Fix it if it is real; if it
   is noise, `--write` records it — never to make a red check green unread.

   --red makes each fault below in a copy and asserts a NEW finding lands in
   the broken file. On the strategy pages: a rule the pages call misspelt, a
   rule called one argument short, the world and the viewer swapped, a
   function from another file misspelt, a misspelt property on a page
   element, a misspelt global. On the console: a function, a variable, the
   splitter and an element's method misspelt, and the create piece reaching
   for the strategy page's GROUP; and on the console's PATHS, §467 itself
   (its guard taken out), the word lookup unguarded, a strategy name read as
   the file loads, and the one declared doorway rewired. SINCE §599 THE OBJECTS THE PAGES BUILD ARE CLOSED TOO (closeObjects,
   below): `CLIENTSETUP.mountCreat`, `SEARCHSEL.openOnn` and `MY_TAB.kk` are
   findings, and --red asserts all three. Still open, on both pages: an
   object holding only data, and anything reached by a computed name
   (`ROWFIND[t]`), which no checker can spell-check.

     node checks/pages-types.mjs          # run from smp-app/
     node checks/pages-types.mjs --red    # every break must go red
     node checks/pages-types.mjs --write  # record today's findings, after reading them */
import { readFileSync, writeFileSync, copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";
import { tmpdir } from "node:os";
import * as acorn from "acorn";
import * as walk from "acorn-walk";

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
const CLOSER = `declare function __closed<T>(o: T): { [K in keyof T]: T[K] };\n`;
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
const STRATEGY_GLOBALS = CLOSER + `type Closed<T> = { [K in keyof T]: T[K] };
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
const CONSOLE_GLOBALS = CLOSER + `type Closed<T> = { [K in keyof T]: T[K] };
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
  /* §599: a member of an object a page builds itself, misspelt */
  "own-object-member-misspelt": ["shell-inline.js", "if (!SEARCHSEL.openOn(rsel)) PROLEPICK = null;", "if (!SEARCHSEL.openOnn(rsel)) PROLEPICK = null;"],
  /* §599: a plain object of behaviour — a `{ … }` holding functions — read wrongly */
  "plain-object-member-misspelt": ["shell-inline.js", ': null, def.k === MY_TAB.k) : null;', ': null, def.k === MY_TAB.kk) : null;'],
};

const CONSOLE_BREAKS = {
  "function-misspelt": ["console-inline.js", 'function mpost(body) { return send("/api/memory", body); }',
                        'function mpost(body) { return sendd("/api/memory", body); }'],
  "variable-misspelt": ["console-inline.js", 'return TABS_KNOWN.indexOf(h) >= 0 ? h : "mywork";',
                        'return TABS_KNOW.indexOf(h) >= 0 ? h : "mywork";'],
  "splitter-misspelt": ["console-inline.js", "var out = window.MemorySplit.split(text);", "var out = window.MemorySplit.splitt(text);"],
  "element-method-misspelt": ["console-inline.js", 'document.getElementById("signout").addEventListener("click"',
                              'document.getElementById("signout").addEventListner("click"'],
  /* §599: the set-up flow's own object, misspelt where the console calls it */
  "setup-object-misspelt": ["console-inline.js", 'CLIENTSETUP.mountCreate(host, { door: "/" });', 'CLIENTSETUP.mountCreat(host, { door: "/" });'],
  /* §467's class: the set-up flow's CREATE piece, which the console mounts,
     reaching for a strategy-page name the console does not have. */
  "setup-reaches-strategy-name": ["client-setup.js", 'var draft = { name:"", industry:"", size:"", notes:"" };',
                                  'var draft = { name:"", industry:"", size:"", notes:"", group: GROUP };'],
};

/* CLOSE WHAT THE PAGES BUILD (§599). A page script that builds its own
   object as it loads — `var SYNC = (function () { … return { … }; })();` —
   hands the checker an object written in JavaScript, which is open, so
   `CLIENTSETUP.mountCreat(…)` read as `any`. In the COPY the checker reads,
   and nowhere else, each such load is wrapped `__closed(…)` — an identity
   declared to return a mapped copy of the same keys, which is closed (the
   library names' answer, §589). The wrap sits on the same lines, so every
   finding keeps its line; the pages themselves are not touched, so nothing
   a browser receives changes. Found by parsing (acorn), never by a list, so
   an object a page gains tomorrow is closed without an edit here. */
function closeObjects(dir, files) {
  const closed = [];
  for (const f of files) {
    if (!f.endsWith(".js")) continue;
    const p = join(dir, f);
    let src = readFileSync(p, "utf8");
    const ast = acorn.parse(src, { ecmaVersion: "latest", sourceType: "script" });
    const at = [];
    walk.simple(ast, { VariableDeclarator(d) {
      if (d.id.type !== "Identifier" || !d.init) return;
      const built = d.init.type === "CallExpression" && /Function/.test(d.init.callee.type);
      /* a plain `{ … }` that holds functions is an object of behaviour too;
         one holding only data stays open, because data gains keys as it runs */
      const behaviour = d.init.type === "ObjectExpression" && d.init.properties.some((q) => q.value && /Function/.test(q.value.type));
      if (built || behaviour) { at.push(d.init); closed.push(f + ":" + d.id.name); }
    } });
    /* each mark on its own, latest first, so an object built inside another
       one cannot shift the marks still to be made (§599's first run broke
       copilot.js doing them a pair at a time) */
    const marks = at.flatMap((e) => [[e.start, "__closed("], [e.end, ")"]]).sort((x, y) => y[0] - x[0]);
    for (const [pos, text] of marks) src = src.slice(0, pos) + text + src.slice(pos);
    /* the copy must still parse — a wrap misplaced is this step's fault,
       said in its own words rather than as the checker's syntax errors */
    try { acorn.parse(src, { ecmaVersion: "latest", sourceType: "script" }); }
    catch (e) { throw new Error("pages-types: closing the objects broke " + f + " — " + e.message); }
    writeFileSync(p, src);
  }
  return closed;
}

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
  const files = ["globals.d.ts", ...scripts, "theme.js", "shell-inline.js", "route.js"];
  return { dir, files, closed: closeObjects(dir, files) };
}

/* THE CONSOLE (platform.html, served unchanged by lib/shell.ts): its script
   tags, read off the page rather than listed here, each mapped to the file
   build-shell.mjs copies to that address — a script added to the page that
   this does not know is a refusal, never a page quietly checked without it —
   and its own inline script. */
/* §620: /navskel.js is KNOWN and left out of the page read: it is the
   press drawing (lib/navskel.ts), one closed function that names nothing of
   the console's and that the console names nothing of — the same script
   every client page loads — so it is not part of the console's page. */
const CONSOLE_SRC = { "/memory-split.js": join(APP, "lib", "memory-split.cjs"), "/client-setup.js": join(SRC, "client-setup.js"), "/navskel.js": null };
function assembleConsole() {
  const dir = mkdtempSync(join(tmpdir(), "console-types-"));
  const page = readFileSync(join(REPO, "platform.html"), "utf8");
  const files = ["globals.d.ts"];
  for (const m of page.matchAll(/<script src="([^"]+)"><\/script>/g)) {
    if (!(m[1] in CONSOLE_SRC)) throw new Error("pages-types: platform.html loads " + m[1] + ", which this check does not know");
    if (CONSOLE_SRC[m[1]] === null) continue;
    const name = basename(m[1]);
    copyFileSync(CONSOLE_SRC[m[1]], join(dir, name));
    if (name !== "memory-split.js") files.push(name);
  }
  const m = /<script>\n([\s\S]*)<\/script>\s*<\/body>/.exec(page);
  if (!m) throw new Error("pages-types: platform.html's own script was not found");
  writeFileSync(join(dir, "console-inline.js"), m[1]);
  writeFileSync(join(dir, "globals.d.ts"), CONSOLE_GLOBALS);
  files.push("console-inline.js");
  return { dir, files, closed: closeObjects(dir, files) };
}

/* ── THE CONSOLE'S PATHS INTO THE SET-UP FLOW (§596) ─────────────────────
   §594 counts NAMES, and §467's crash was a new PATH to an old one: typing in
   Add a client ran a change handler that asked canShape(), which reached
   GROUP on a page that has none. So this walks the calls. It starts where
   the console calls into the flow (CLIENTSETUP's members its own script
   calls, and any top-level name of the flow's file it uses, read off the
   page), plus whatever the file runs as it loads, and follows every function
   a reached one names — called, passed as a callback, stored. Inline
   callbacks are reached with the function they sit in, since an event can
   fire them.

   EVERY STRATEGY-PAGE NAME IT CAN REACH MUST BE GUARDED. The names are the
   ones the checker cannot find on the console (§594's list, so a name
   added tomorrow is in it without an edit here). Guarded means only run
   when the strategy page is there: under `typeof X !== "undefined"` (or
   `=== "function"`), after an early `if (typeof X === "undefined") return`,
   on the right of an `&&` that tests presence, or in a function that is
   only ever reached through such guarded calls. The strategy page's names
   arrive together, so a test on any one of them guards all of them.

   A DOORWAY THE CONSOLE NEVER PASSES, WHERE NO typeof SAYS SO, IS DECLARED
   BELOW WITH ITS REASON. It is matched by the function it sits in and the
   call it gates, and a doorway that no longer exists fails the check, so
   a declaration cannot outlive the code it describes. */
const DOORWAYS = [
  { in: "wordCommit", call: "redraw",
    why: "`if (!canShape()) redraw()` — canShape() is true on the console: S is null on the create piece, and holdsNow() reads zeros there (§467). redraw() would draw the whole set-up flow into the console's HOST." },
];
function consolePaths(dir, list) {
  const STRATEGY = new Set(list.filter((f) => f.file === "client-setup.js" && /^TS(2304|2552)$/.test(f.code))
    .map((f) => (/name '([^']+)'/.exec(f.message) || [])[1]).filter(Boolean));
  const src = readFileSync(join(dir, "client-setup.js"), "utf8");
  const page = readFileSync(join(dir, "console-inline.js"), "utf8");
  const ast = acorn.parse(src, { ecmaVersion: "latest", sourceType: "script", locations: true });
  const isFn = (n) => n && /^(FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/.test(n.type);
  const parent = new Map();
  (function link(n, p) {
    if (!n || typeof n.type !== "string") return;
    parent.set(n, p);
    for (const v of Object.values(n)) {
      if (Array.isArray(v)) v.forEach((c) => c && typeof c.type === "string" && link(c, n));
      else if (v && typeof v.type === "string") link(v, n);
    }
  })(ast, null);
  const scopeOf = (n) => { let p = parent.get(n); while (p && !isFn(p) && p.type !== "Program") p = parent.get(p); return p; };
  const decls = new Map();
  walk.full(ast, (n) => {
    let name = null, fn = null;
    if (n.type === "FunctionDeclaration" && n.id) { name = n.id.name; fn = n; }
    if (n.type === "VariableDeclarator" && n.id.type === "Identifier" && isFn(n.init)) { name = n.id.name; fn = n.init; }
    if (!name) return;
    const s = scopeOf(n);
    if (!decls.has(s)) decls.set(s, new Map());
    decls.get(s).set(name, fn);
  });
  const resolve = (id) => {
    for (let s = scopeOf(id); s; s = s.type === "Program" ? null : scopeOf(s))
      if (decls.has(s) && decls.get(s).has(id.name)) return decls.get(s).get(id.name);
    return null;
  };
  const nameOf = (f) => f.id ? f.id.name : parent.get(f).type === "VariableDeclarator" ? parent.get(f).id.name : "(anonymous)";
  const isRef = (id) => { const p = parent.get(id);
    if (p.type === "MemberExpression" && p.property === id && !p.computed) return false;
    if (p.type === "Property" && p.key === id && !p.computed && !p.shorthand) return false;
    if ((p.type === "FunctionDeclaration" || p.type === "FunctionExpression") && p.id === id) return false;
    if (p.type === "VariableDeclarator" && p.id === id) return false;
    return true; };
  const typeofOf = (n) => n && n.type === "UnaryExpression" && n.operator === "typeof" && n.argument.type === "Identifier" && STRATEGY.has(n.argument.name);
  /* what an expression being TRUE says about the strategy page */
  function says(n) {
    if (!n) return null;
    if (n.type === "UnaryExpression" && n.operator === "!") { const t = says(n.argument); return t === "present" ? "absent" : t === "absent" ? "present" : null; }
    if (n.type === "BinaryExpression" && /^[!=]==?$/.test(n.operator)) {
      const [t, lit] = typeofOf(n.left) ? [n.left, n.right] : typeofOf(n.right) ? [n.right, n.left] : [null, null];
      if (!t || lit.type !== "Literal") return null;
      const eq = n.operator[0] === "=";
      if (lit.value === "undefined") return eq ? "absent" : "present";
      return eq ? "present" : null;
    }
    if (n.type === "LogicalExpression" && n.operator === "&&") return says(n.left) === "present" || says(n.right) === "present" ? "present" : null;
    if (n.type === "LogicalExpression" && n.operator === "||") return says(n.left) === "absent" || says(n.right) === "absent" ? "absent" : null;
    return null;
  }
  const exits = (s) => s && (s.type === "ReturnStatement" || s.type === "ThrowStatement" ||
    (s.type === "BlockStatement" && s.body.length > 0 && exits(s.body[s.body.length - 1])));
  function guarded(n, top) {
    for (let c = n, p = parent.get(c); p && c !== top; c = p, p = parent.get(p)) {
      if ((p.type === "ConditionalExpression" || p.type === "IfStatement") &&
          ((c === p.consequent && says(p.test) === "present") || (c === p.alternate && says(p.test) === "absent"))) return true;
      if (p.type === "LogicalExpression" && c === p.right &&
          ((p.operator === "&&" && says(p.left) === "present") || (p.operator === "||" && says(p.left) === "absent"))) return true;
      if (p.type === "BlockStatement" || p.type === "Program")
        for (const s of p.body.slice(0, p.body.indexOf(c)))
          if (s.type === "IfStatement" && says(s.test) === "absent" && exits(s.consequent)) return true;
    }
    return false;
  }
  /* reachability, each function in a guarded context or not (open wins) */
  const ctx = new Map(), via = new Map(), queue = [];
  const reach = (fn, g, from) => { if (!fn || (ctx.has(fn) && (ctx.get(fn) === false || g))) return; ctx.set(fn, g); via.set(fn, from); queue.push(fn); };
  const iifes = [];
  walk.simple(ast, { CallExpression(n) { if (n.callee.type === "FunctionExpression" && scopeOf(n).type === "Program") iifes.push(n.callee); } });
  const top = decls.get(ast) || new Map();
  const entries = [];
  for (const m of page.matchAll(/CLIENTSETUP\.(\w+)\s*\(/g)) if (!entries.includes(m[1])) entries.push(m[1]);
  for (const name of top.keys()) if (new RegExp("\\b" + name.replace(/\$/g, "\\$") + "\\b").test(page)) entries.push(name);
  const api = iifes.map((f) => decls.get(f)).filter(Boolean);
  for (const e of entries) {
    if (top.has(e)) reach(top.get(e), false, "the console uses " + e);
    for (const m of api) if (m.has(e)) reach(m.get(e), false, "the console calls CLIENTSETUP." + e);
  }
  const open = [], used = new Set();
  function scan(body, g, owner) {
    walk.fullAncestor(body, (n) => {
      if (n.type !== "Identifier" || !isRef(n)) return;
      for (let a = parent.get(n); a && a !== body; a = parent.get(a))
        if (a.type === "FunctionDeclaration" || (a.type === "FunctionExpression" && parent.get(a).type === "VariableDeclarator") || iifes.includes(a)) return;
      const g2 = g || guarded(n, body);
      if (STRATEGY.has(n.name) && !(parent.get(n).type === "UnaryExpression" && parent.get(n).operator === "typeof") && !g2)
        open.push({ name: n.name, line: n.loc.start.line, fn: owner });
      const door = DOORWAYS.find((d) => d.in === owner && d.call === n.name);
      if (door) { used.add(door); return; }
      const f = resolve(n);
      if (f && f !== parent.get(body)) reach(f, g2, owner + " (line " + n.loc.start.line + ")");
    });
  }
  /* load time: the file's own statements and each IIFE's, less the IIFE's
     `return {…}` — the API it hands the page, named there and not called */
  for (const r of [ast, ...iifes]) {
    const body = r === ast ? r.body : r.body.body;
    for (const s of body) if (s.type !== "FunctionDeclaration" && !(r !== ast && s.type === "ReturnStatement")) scan(s, false, "(as the file loads)");
  }
  while (queue.length) { const f = queue.shift(); scan(f.body, ctx.get(f), nameOf(f)); }
  const chain = (fname) => { const out = []; for (let f = [...ctx.keys()].find((k) => nameOf(k) === fname), i = 0; f && i < 12; i++) { out.push(nameOf(f)); const v = via.get(f) || ""; const nx = [...ctx.keys()].find((k) => nameOf(k) === v.split(" ")[0] && k !== f); if (!nx) { out.push(v); break; } f = nx; } return out.join(" ← "); };
  const seen = new Set();
  return {
    entries, reached: ctx.size, names: STRATEGY.size,
    open: open.filter((u) => { const k = u.fn + u.line + u.name; return seen.has(k) ? false : seen.add(k); })
      .map((u) => u.name + " at client-setup.js:" + u.line + ", in " + chain(u.fn)),
    stale: DOORWAYS.filter((d) => !used.has(d)).map((d) => d.in + " → " + d.call),
  };
}

/* Each must leave a strategy-page name open on the console's paths, or a
   declared doorway gone. The first is §467 itself, its guard taken out. */
const CONSOLE_PATH_BREAKS = {
  "the-467-crash": ["client-setup.js", '  if (typeof GROUP === "undefined") return { plans: 0, capabilities: 0, units: 0, functions: 0 };\n', ""],
  "word-lookup-unguarded": ["client-setup.js", 'return typeof labelWord === "function" ? labelWord(k, form === "one" ? "group" : "bu") : fb;',
                            'return labelWord(k, form === "one" ? "group" : "bu");'],
  "read-as-the-file-loads": ["client-setup.js", "function __smpHoldsNow() {", "var CS_AT_LOAD = UNITS;\nfunction __smpHoldsNow() {"],
  "doorway-rewired": ["client-setup.js", 'i.addEventListener("change", function () { if (!canShape()) redraw(); });',
                      'i.addEventListener("change", function () { if (!canShape()) HOST && render(); });'],
};
const SUBJECTS = {
  strategy: { title: "the strategy pages", known: join(here, "pages-types.known.json"),
              note: "Read before recorded: none of these is a fault (§589). Rewrite with --write only after reading every new one.",
              assemble: assembleStrategy, breaks: STRATEGY_BREAKS, minFiles: 30, own: "shell-inline.js" },
  console: { title: "the console page", known: join(here, "console-types.known.json"),
             note: "Read before recorded (§594). The console's own are noise. The rest are the set-up flow's STRATEGY-PAGE names, which the console page does not have: on its two entry points (Add a client, an archived client) each is behind a typeof guard or on a path the console never takes, and client-setup-outside.py drives both with no page error. A NEW one here is a name the console may reach and throw on (§467's fault): confirm it is guarded or unreachable from the console BEFORE recording it with --write.",
             assemble: assembleConsole, breaks: CONSOLE_BREAKS, pathBreaks: CONSOLE_PATH_BREAKS, minFiles: 2, own: "console-inline.js" },
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
    for (const [n, [file, a, b]] of Object.entries(sub.pathBreaks || {})) {
      const asm = sub.assemble();
      try {
        const src = readFileSync(join(asm.dir, file), "utf8");
        if (src.split(a).length !== 2) { console.log("BREAK DID NOT MATCH ONCE: " + sub.title + " / " + n); bad++; continue; }
        writeFileSync(join(asm.dir, file), src.replace(a, b));
        const p = consolePaths(asm.dir, findings(asm));
        if (!p.open.length && !p.stale.length) { console.log("NOT RED: " + sub.title + " / paths / " + n); bad++; }
        else console.log("red: " + sub.title + " / paths / " + n + " (" + (p.open.length ? p.open.length + " open" : "") + (p.stale.length ? (p.open.length ? ", " : "") + "a doorway gone" : "") + ")");
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
    check(asm.closed.length + " objects the page builds itself, closed for the checker (§599)", asm.closed.length > 0,
      "       none found — the closing step has stopped matching how the pages build their objects");
    const extra = beyond(list, rec);
    check("no finding beyond the " + total + " recorded ones, each read", !extra.length,
      extra.map((f) => "       " + f.file + ":" + f.line + "  " + f.code + "  " + f.message).join("\n"));
    const gone = [...rec].filter(([k, n]) => (now.get(k) || 0) < n).map(([k]) => k.split("\u0000").join("  "));
    check("every recorded finding is still there, so the list stays exact", !gone.length,
      gone.map((g) => "       " + g).join("\n") + "\n       — fixed or moved: run with --write to record the shorter list");
    if (sub.pathBreaks) {
      const p = consolePaths(asm.dir, list);
      check("from the console's calls into the set-up flow (" + p.entries.join(", ") + "), " + p.reached +
        " functions reached, and none uses one of the " + p.names + " strategy-page names unguarded", p.reached > 5 && !p.open.length,
        p.open.map((o) => "       " + o).join("\n"));
      check("every doorway declared as never passed on the console is still in the code", !p.stale.length,
        p.stale.map((d) => "       " + d + " — gone: re-read what the console reaches, then update DOORWAYS").join("\n"));
    }
  } finally { rmSync(asm.dir, { recursive: true, force: true }); }
}
console.log(`\n${ok} ok, ${fails.length} failed`); process.exit(fails.length ? 1 : 0);
