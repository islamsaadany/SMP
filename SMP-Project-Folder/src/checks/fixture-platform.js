/* The fixture behind checks/multi-client.py.
   Run: DATABASE_URL=… node SMP-Project-Folder/src/checks/fixture-platform.js

   THE CHECK USED TO ASSUME A DATABASE SOMEBODY HAD PREPARED BY HAND, which is
   the same fault as a check that measures the state it happens to find (§94.2):
   it passes or fails for reasons nothing in the repository states. This makes
   the three accounts it signs in as, with the passwords it uses, through the
   PRODUCT'S OWN hasher — never a second copy of it (constitution IX).

   It is additive: it never deletes a client, a person or a plan. */

const pg = require("pg");
const path = require("path");
const P = require(path.join(__dirname, "..", "..", "..", "lib", "platform-io.js"));
const auth = require(path.join(__dirname, "..", "..", "..", "lib", "auth.js"));

const PEOPLE = [
  ["islam.saadany@forefront.consulting", "Islam Saadany", "office", true,  "officepw123",  "raya-trade", "super",   "ff_islam"],
  ["omar.alaa@forefront.consulting",     "Omar Alaa",     "office", false, "omarpw12345",  "raya-trade", "smoteam", "ff_omar"],
  ["nadia.fahmy@forefront.consulting",   "Nadia Fahmy",   "office", false, "nadiapw12345", null,         null,      null],
  ["smo@rayatrade.com",                  "Raya SMO",      "client", false, "rayapw123",    "raya-trade", "smoteam", "smo"],
];

async function main() {
  await P.withPlatform(pg, async function (c) {
    await P.ensurePlatformReady(c);
    for (const [email, name, kind, admin, pw, client, seat, key] of PEOPLE) {
      const hash = auth.hashPassword(pw);
      await c.query(
        "INSERT INTO accounts (email, name, kind, is_admin, password_hash, must_change, status) " +
        "VALUES ($1,$2,$3,$4,$5,false,'active') ON CONFLICT (email) DO UPDATE SET " +
        "name = EXCLUDED.name, kind = EXCLUDED.kind, is_admin = EXCLUDED.is_admin, " +
        "password_hash = EXCLUDED.password_hash, must_change = false, status = 'active'",
        [email, name, kind, admin, hash]);
      if (!client) continue;
      /* The super seat is unique per client, so this one is set LAST and the
         others are moved off it first — the database refuses two, which is why
         it exists (spec §7.0a). */
      if (seat === "super") {
        await c.query("UPDATE account_clients SET seat = 'smoteam' WHERE client_key = $1 AND email <> $2",
                      [client, email]);
      }
      await c.query(
        "INSERT INTO account_clients (email, client_key, person_key, seat) VALUES ($1,$2,$3,$4) " +
        "ON CONFLICT (email, client_key) DO UPDATE SET seat = EXCLUDED.seat, person_key = EXCLUDED.person_key",
        [email, client, key, seat]);
    }
    /* Nothing lit is what an untouched platform looks like (§37, §50.6). */
    await c.query("DELETE FROM platform_access");
  });

  /* ── AND THE ROWS THOSE MAPPINGS NAME (§303.32) ────────────────────
     This mapped the two office accounts to `ff_islam` and `ff_omar` and never
     created either row — which was survivable only while a key naming nobody
     silently INVENTED a person. It does not any more: on a client whose
     register the platform did not build, an account the register cannot place
     is refused, so the fixture has to model a placed one.

     WRITTEN AS THE ROWS THE MAPPING ALREADY NAMES rather than by giving the
     accounts a matching address, so nothing here depends on which of the
     client's own 33 people happens to sit where — a check that reads its
     subject out of the demo's data moves every time the demo does.

     Additive and idempotent, like everything else in this file: it adds two
     people and touches nobody who is already there. */
  const rows = [
    ["ff_islam", "Islam Saadany", "islam.saadany@forefront.consulting", "super"],
    ["ff_omar",  "Omar Alaa",     "omar.alaa@forefront.consulting",     "smoteam"],
  ];
  const live = await P.withPlatform(pg, function (c) {
    return c.query("SELECT schema_name FROM clients WHERE key = $1", ["raya-trade"]);
  });
  if (live.rowCount) {
    await P.withSchema(pg, live.rows[0].schema_name, async function (c) {
      for (const [key, name, email, role] of rows) {
        await c.query(
          "INSERT INTO people (key, idx, name, role, extra) " +
          "VALUES ($1, (SELECT COALESCE(MAX(idx),0)+1 FROM people), $2, $3, $4) " +
          /* ASSERTED, NOT SKIPPED. These two rows are the fixture's OWN
             (`ffrow`), and an earlier run may have left one retired — which
             `DO NOTHING` would preserve, so the check would go on measuring
             whatever the last run happened to leave behind (§94.2). It sets
             them exactly as it sets the accounts above, retirement included. */
          "ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name, " +
          "role = EXCLUDED.role, extra = people.extra || EXCLUDED.extra",
          [key, name, role, JSON.stringify({ email: email, forefront: true, ffrow: true, active: true })]);
      }
    });
  }
  await P.getPool(pg).end();
  console.log("fixture ready");
}

main().catch(function (e) { console.error("fixture failed: " + e.message); process.exit(1); });
