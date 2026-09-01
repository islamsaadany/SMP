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
  await P.getPool(pg).end();
  console.log("fixture ready");
}

main().catch(function (e) { console.error("fixture failed: " + e.message); process.exit(1); });
