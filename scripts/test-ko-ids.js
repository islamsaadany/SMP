/* ── AN OBJECTIVE THE PLATFORM CAN NAME — migration 039 (§240) ────────────
   Islam: *"the input there wasn't saved."* The control that adds a key
   objective to a capability or to a pillars function's Overview minted no id,
   so the reporting box carried the string "undefined", `findById()` matched
   nothing, and the figure was discarded in silence. The control is fixed; 039
   is for the rows already in a client's database.

   THIS RUNS THE REAL SQL AGAINST A REAL POSTGRES, because the properties that
   matter are the ones a fixture cannot fake:

     · every blank gets an id, and the row's own content is untouched;
     · a row that ALREADY has one keeps exactly that id — rewriting one orphans
       the figure, focus mark and cycle snapshot keyed on it (§48.1);
     · the numbering continues past the highest already present rather than
       counting from position, which is the duplicate §191 nearly shipped;
     · other keys in `extra` survive, and a function with no objectives at all
       is not touched;
     · a second run changes nothing at all.

   Usage:  DATABASE_URL=… node scripts/test-ko-ids.js
   It creates its own tables from db/schema.sql if they are not there, works in
   a transaction, and ROLLS BACK — nothing it does survives the run. */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const SQL = fs.readFileSync(
  path.join(__dirname, "..", "db", "migrations",
            "039-an-objective-the-platform-can-name.sql"), "utf8");

let pass = 0;
const fails = [];
function ok(label, cond, detail) {
  if (cond) { pass++; console.log("  ok      " + label); }
  else { fails.push(label); console.log("  FAIL    " + label +
    (detail === undefined ? "" : "  — " + JSON.stringify(detail))); }
}

/* The fixture, and every row of it is a case:
     cf      — the client's shape: every objective id-less
     mix     — two named (one of them KO7, so the count must not collide with
               it), one blank, one holding the EMPTY STRING, which is a
               different absence and reads the same to every JS reader
     clean   — nothing to do
     nokos   — no objectives at all, and other keys in extra to preserve */
const FIXTURE = [
  ["cf", 1, "Consumer Finance", {
    format: "pillars", under: "retail", keyObjectives: [
      { name: "Grow book", dir: "≥", target: "90%", actual: "12" },
      { name: "Cut cost", dir: "≤", target: "5%" },
      { name: "NPS", dir: "≥", target: "40" }] }],
  ["mix", 2, "Mixed", {
    format: "pillars", keyObjectives: [
      { id: "fn:mix-KO1", name: "Already named", actual: "7" },
      { name: "Blank one" },
      { id: "fn:mix-KO7", name: "High number" },
      { id: "", name: "Empty string id" }] }],
  ["clean", 3, "Clean", { keyObjectives: [{ id: "fn:clean-KO1", name: "Fine" }] }],
  ["nokos", 4, "No objectives", { format: "pillars", under: "mobile" }]
];

(async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error("DATABASE_URL is not set"); process.exit(2); }
  const c = new Client({ connectionString: url });
  await c.connect();
  await c.query("BEGIN");
  try {
    /* The one table this migration touches. `IF NOT EXISTS`, so a database
       that already carries the schema is used as it stands. */
    await c.query(`CREATE TABLE IF NOT EXISTS functions (
      key text PRIMARY KEY, idx int NOT NULL, name text NOT NULL DEFAULT '',
      nav_name text, code_prefix text, head text, custodian text,
      active boolean NOT NULL DEFAULT true, extra jsonb NOT NULL DEFAULT '{}')`);
    await c.query("DELETE FROM functions WHERE key = ANY($1)",
                  [FIXTURE.map(f => f[0])]);
    for (const [k, i, n, extra] of FIXTURE) {
      await c.query("INSERT INTO functions (key, idx, name, extra) VALUES ($1,$2,$3,$4)",
                    [k, i, n, JSON.stringify(extra)]);
    }

    const read = async () => {
      const r = await c.query(
        "SELECT key, extra FROM functions WHERE key = ANY($1) ORDER BY idx",
        [FIXTURE.map(f => f[0])]);
      const out = {};
      r.rows.forEach(x => { out[x.key] = x.extra; });
      return out;
    };
    const before = await read();

    console.log("\n── migration 039");
    await c.query(SQL);
    const after = await read();

    console.log("\n── 1 · every blank gets an id");
    const cf = after.cf.keyObjectives;
    ok("the client's shape — all three are named",
       cf.every(m => !!m.id), cf.map(m => m.id));
    ok("...in the product's own spelling, numbered from one",
       cf.map(m => m.id).join(",") === "fn:cf-KO1,fn:cf-KO2,fn:cf-KO3",
       cf.map(m => m.id));
    ok("...the order is unchanged",
       cf.map(m => m.name).join(",") === "Grow book,Cut cost,NPS",
       cf.map(m => m.name));
    ok("...and nothing else on the row moved",
       cf[0].actual === "12" && cf[0].target === "90%" && cf[0].dir === "≥", cf[0]);

    console.log("\n── 2 · an id already written is never rewritten (§48.1)");
    const mix = after.mix.keyObjectives;
    ok("the named row keeps exactly its id", mix[0].id === "fn:mix-KO1", mix[0]);
    ok("...and its figure", mix[0].actual === "7", mix[0]);
    ok("...and the high number is left where it was",
       mix[2].id === "fn:mix-KO7", mix[2]);

    console.log("\n── 3 · the numbering continues past the highest present (§191)");
    ok("the blank row is numbered above KO7, not from its position",
       mix[1].id === "fn:mix-KO8", mix[1]);
    ok("...and the EMPTY STRING is treated as an absence, not as an id",
       mix[3].id === "fn:mix-KO9", mix[3]);
    ok("...so no two objectives in the function share an id",
       new Set(mix.map(m => m.id)).size === mix.length, mix.map(m => m.id));

    console.log("\n── 4 · what it must not touch");
    ok("a function whose objectives are all named is byte-identical",
       JSON.stringify(after.clean) === JSON.stringify(before.clean), after.clean);
    ok("a function with no objectives at all is byte-identical",
       JSON.stringify(after.nokos) === JSON.stringify(before.nokos), after.nokos);
    ok("...and the other keys in extra survive the rewrite",
       after.cf.format === "pillars" && after.cf.under === "retail", after.cf);

    console.log("\n── 5 · idempotent");
    await c.query(SQL);
    const twice = await read();
    ok("a second run changes nothing at all",
       JSON.stringify(twice) === JSON.stringify(after));

    /* PROVED ABLE TO FAIL (§94.5): with the fixture put back to its broken
       state and the migration NOT run, the assertions above must not pass. */
    console.log("\n── 6 · and the trial can fail");
    await c.query("UPDATE functions SET extra = $2 WHERE key = $1",
                  ["cf", JSON.stringify(FIXTURE[0][3])]);
    const un = (await read()).cf.keyObjectives;
    ok("with the migration not run, the ids are absent — which is the fault",
       un.every(m => m.id === undefined), un.map(m => m.id));
  } finally {
    await c.query("ROLLBACK");
    await c.end();
  }
  console.log("\n" + pass + " passed, " + fails.length + " failed");
  fails.forEach(f => console.log("  FAIL  " + f));
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
