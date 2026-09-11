/* THE DIRECT CONNECTION IS PREFERRED, AND NOTHING ELSE ASSERTS THAT (§313.34).

   Every client's tables live in a schema of their own and a request is pointed
   at one with `SET search_path`. A transaction pooler does not keep a session
   setting between statements, so on a POOLED endpoint that select can land on
   a backend the SET never reached. `getPool()`'s list of environment variable
   names is therefore an ORDER rather than a spelling — and an order nobody
   asserts is one that drifts back the next time somebody tidies the list
   (§51.11's family).

   BOTH ENDS EVERY TIME (§94.2): a build that answered "direct" always, or that
   refused to start without one, passes half of this and is wrong.

   No database, no network: it reads the environment.
     node scripts/test-db-url-choice.js */
const path = require("path");
const io = require(path.join(__dirname, "..", "lib", "state-io.js"));

let pass = 0; const fails = [];
function ok(name, cond, extra) {
  if (cond) { pass++; return; }
  fails.push(name + (extra !== undefined ? "  — " + JSON.stringify(extra) : ""));
}

/* The process's own settings are put back, so running this leaves nothing
   behind for whatever runs next in the same shell (§94.2). */
const NAMES = ["DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING",
               "DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL", "NEON_DATABASE_URL"];
const held = {};
for (const n of NAMES) held[n] = process.env[n];
function only(set) {
  for (const n of NAMES) delete process.env[n];
  for (const n of Object.keys(set)) process.env[n] = set[n];
  return io.pickDbUrl();
}

try {
  /* ── 1 · the direct name wins over the pooled one ─────────────────── */
  let p = only({ DATABASE_URL: "postgres://pooled", DATABASE_URL_UNPOOLED: "postgres://direct" });
  ok("both set: the direct one is taken", p && p.url === "postgres://direct", p);
  ok("...and it says so", p && p.direct === true, p);
  ok("...and names which setting answered", p && p.name === "DATABASE_URL_UNPOOLED", p);

  /* Neon's other spelling of the same thing. */
  p = only({ DATABASE_URL: "postgres://pooled", POSTGRES_URL_NON_POOLING: "postgres://direct2" });
  ok("the other direct spelling wins too", p && p.url === "postgres://direct2" && p.direct === true, p);

  /* ── 2 · the pooled one is still a working fallback ───────────────── */
  /*    A deployment that has only the pooled name must still start: refusing
        would turn a risk into an outage (§230.2's rule about walls). */
  p = only({ DATABASE_URL: "postgres://pooled" });
  ok("pooled alone: it is still used", p && p.url === "postgres://pooled", p);
  ok("...and is NOT reported as direct", p && p.direct === false, p);

  for (const n of ["POSTGRES_URL", "POSTGRES_PRISMA_URL", "NEON_DATABASE_URL"]) {
    const q = only({ [n]: "postgres://" + n });
    ok(n + " is still read", q && q.url === "postgres://" + n && q.direct === false, q);
  }

  /* ── 3 · nothing set is nothing, never a guess ────────────────────── */
  ok("no setting at all: no url", only({}) === null);
} finally {
  for (const n of NAMES) {
    if (held[n] === undefined) delete process.env[n]; else process.env[n] = held[n];
  }
}

for (const f of fails) console.log("  FAIL " + f);
console.log("\n" + pass + " passed, " + fails.length + " failed");
process.exit(fails.length ? 1 : 0);
