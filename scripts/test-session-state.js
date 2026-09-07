/* Nothing session-level on the pooled connection (§289.2).

   Production talks to Neon through PgBouncer in transaction mode: a statement
   sent outside a transaction may run on any backend, and whatever session
   state it leaves — a session advisory lock, a SET, a LISTEN, a PREPARE, a
   temp table — stays on THAT backend and is handed to somebody else's request.
   §289 is what that cost the bootstrap (two cold starts, one migration, a
   sign-in page saying "Something went wrong"); §289.1 found the chat's
   `SET lock_timeout` doing the same to every backend it touched.

   THIS IS THE RULE MADE EXECUTABLE. It reads every server file, drops the
   comments, joins each run of concatenated string literals back into the SQL
   it becomes, and fails on any statement that starts with one of the
   session-level words. `pg_advisory_xact_lock` and `SET LOCAL` are the
   transaction-scoped forms and pass — a misplaced SET LOCAL outside a
   transaction is a WARNING that does nothing, which is the safe way to be
   wrong. No database, no network: it reads source.

     node scripts/test-session-state.js */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const DIRS = ["api", "lib"];
const BAD = [
  [/\bpg_advisory_lock\s*\(/i,        "pg_advisory_lock — a SESSION lock; use pg_advisory_xact_lock inside a transaction"],
  [/\bpg_advisory_unlock(_all)?\s*\(/i,"pg_advisory_unlock — pairs with a session lock that cannot be held"],
  [/^\s*SET\s+(?!LOCAL\b)[\w.]+\s*(=|\bTO\b)/i, "SET — a session setting that stays on the backend; use SET LOCAL inside a transaction"],
  [/^\s*LISTEN\b/i,                    "LISTEN — session-level, never reaches the right backend"],
  [/^\s*PREPARE\b/i,                   "PREPARE — a session-level statement; use parameterised queries"],
  [/\bCREATE\s+(GLOBAL\s+|LOCAL\s+)?TEMP(ORARY)?\s+TABLE\b/i, "a temp table — lives on one backend"],
];
const STR = /(?:"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)/;
const RUN = new RegExp(STR.source + "(?:\\s*\\+\\s*" + STR.source + ")*", "g");

function stripComments(src) {
  /* newlines kept, so a finding's line number is the file's own */
  return src.replace(/\/\*[\s\S]*?\*\//g, function (c) { return c.replace(/[^\n]/g, " "); })
            .replace(/^\s*\/\/.*$/gm, " ");
}
function literalText(tok) {
  /* the SQL a run of literals becomes: each literal unquoted, joined */
  return tok.replace(/\s*\+\s*/g, "").replace(/["'`]/g, " ");
}
let findings = [];
for (const dir of DIRS) {
  for (const f of fs.readdirSync(path.join(ROOT, dir)).filter(function (f) { return /\.js$/.test(f); })) {
    const file = dir + "/" + f;
    const src = stripComments(fs.readFileSync(path.join(ROOT, file), "utf8"));
    let m;
    while ((m = RUN.exec(src))) {
      const sql = literalText(m[0]);
      const line = src.slice(0, m.index).split("\n").length;
      for (const stmt of sql.split(";")) {
        for (const [re, why] of BAD) {
          if (re.test(stmt)) findings.push(file + ":" + line + "  " + stmt.trim().slice(0, 60) + "  — " + why);
        }
      }
    }
  }
}
for (const x of findings) console.log("FAIL " + x);
console.log(findings.length ? findings.length + " FAILED" : "ok   nothing session-level on the pooled connection (" + DIRS.join(", ") + ")");
process.exit(findings.length ? 1 : 0);
