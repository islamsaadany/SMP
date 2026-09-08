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
  /* A SESSION `SET` NEVER HAS A `WHERE` (§303.34). An interpolated table name
     breaks a run of literals, so `"UPDATE " + T + " SET x = $1 " + "WHERE …"`
     hands this rule a fragment that genuinely BEGINS with the word SET while
     the statement does not — a false positive that would be answered by
     contorting the SQL, which leaves the blind spot for the next person.
     Narrowed rather than loosened (§218): what it stops matching is an UPDATE's
     SET clause, and an UPDATE with no WHERE at all is still flagged, which is
     the safe way to be wrong. */
  [/^\s*SET\s+(?!LOCAL\b)[\w.]+\s*(=|\bTO\b)(?![\s\S]*\bWHERE\b)/i, "SET — a session setting that stays on the backend; use SET LOCAL inside a transaction"],
  /* A `SET ROLE` has neither `=` nor `TO`, so the rule above walks past it —
     and it is session state exactly as search_path is (§303.35). Named here
     so the one line that wears a badge has to carry a named exception. */
  [/^\s*SET\s+ROLE\b/i,                "SET ROLE — a session role that stays on the backend; only on a direct connection, and reset at release"],
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
const rawLines = {};
for (const dir of DIRS) {
  for (const f of fs.readdirSync(path.join(ROOT, dir)).filter(function (f) { return /\.js$/.test(f); })) {
    const file = dir + "/" + f;
    const raw = fs.readFileSync(path.join(ROOT, file), "utf8");
    rawLines[file] = raw.split("\n");
    const src = stripComments(raw);
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
/* ── A DELIBERATE EXCEPTION IS NAMED AT THE LINE, AND PRINTED (§303.34) ──
   One statement in the product is session-level ON PURPOSE and argued for:
   `pointAt()` selects a client's schema, and §303.34 answers it by pointing the
   pool at the DIRECT connection, where a checked-out client is one backend for
   the life of the checkout and the hazard does not exist. This file reads
   source and cannot see which endpoint a deployment is configured with, so the
   exception has to be declared where the statement is.

   IT IS NOT A WAY TO SILENCE A FINDING. The marker must NAME a section, it sits
   on the line itself so it is read by whoever edits it, and every exception
   honoured is PRINTED on every run — a check that quietly forgives is worse
   than one that is red (§280.1: a check that can never go green is one people
   learn to scroll past, and it takes the honest ones with it). */
const OKMARK = /\/\*\s*session-state-ok:\s*(§[\d.]+[^*]*?)\*\//;
const excused = [];
const real = [];
for (const f of findings) {
  const m = /^([^:]+):(\d+)/.exec(f);
  const line = m ? (rawLines[m[1]] || [])[Number(m[2]) - 1] || "" : "";
  const mark = OKMARK.exec(line);
  if (mark) excused.push(f + "\n       allowed: " + mark[1].trim());
  else real.push(f);
}
for (const x of excused) console.log("ALLOWED " + x);
for (const x of real) console.log("FAIL " + x);
console.log(real.length ? real.length + " FAILED"
  : "ok   nothing session-level on the pooled connection (" + DIRS.join(", ") + ")"
    + (excused.length ? ", " + excused.length + " named exception" + (excused.length > 1 ? "s" : "") : ""));
process.exit(real.length ? 1 : 0);
