/* ── THE WHOLE WAY IN, FOR EVERY KIND OF PERSON (§77) ─────────────────────
   Islam: "can you test the login cycle of multiple roles now to make sure that
   they login?"

   Not "does the password verify" — the WHOLE cycle, in the order a real person
   meets it, for one holder of each of the eight roles:

     1 the SMO issues them a temporary password
     2 they sign in with their EMAIL (§69.23), not the person key nobody has
     3 /api/state REFUSES them while the password is still temporary (§43.2) —
       this is the step that is invisible on screen and the one that silently
       stopped mattering if it broke
     4 they choose their own password
     5 /api/state now answers, and answers AS THEM
     6 the sign-in asks where they work, and the list is the SHORT one narrowed
       from their Official BU on the server (§56, §57)
     7 the pages they can reach are their role's, not everybody's

   EVERY ROLE, because seven of the eight have never been signed in as. The one
   that matters most is the one nobody would think to test: a person whose row
   holds no seat at all, who is an Employee or a Contributor by derivation
   (§55) — they still have to get through the door.

   DATABASE_URL=... node scripts/test-login-cycle.js                          */
const pg = require("pg");
const io = require("../lib/state-io.js");
const R = require("../lib/rules.js");
const authApi = require("../api/auth.js");
const stateApi = require("../api/state.js");

let pass = 0, fail = 0;
function check(what, ok, extra) {
  if (ok) { pass++; console.log("    ok   " + what); }
  else { fail++; console.log("    FAIL " + what + (extra ? "  — " + extra : "")); }
}

/* A request the handlers accept, carrying a cookie jar the way a browser does. */
function req(body, jar, ip) {
  return { method: "POST", body: body, socket: { remoteAddress: ip || "10.0.0.7" },
           headers: { cookie: jar.cookie || "", "x-forwarded-for": ip || "10.0.0.7" },
           on: function () {} };
}
function res(jar) {
  const r = { statusCode: 0, body: null,
    setHeader(k, v) {
      if (String(k).toLowerCase() === "set-cookie") {
        jar.cookie = String(v).split(";")[0];
      }
    },
    end(s) { r.body = JSON.parse(s); } };
  return r;
}
async function call(handler, body, jar, ip) {
  const rs = res(jar);
  await handler(req(body, jar, ip), rs);
  return rs;
}
async function get(handler, jar) {
  const rs = res(jar);
  await handler({ method: "GET", headers: { cookie: jar.cookie || "" },
                  socket: {}, on: function () {} }, rs);
  return rs;
}

(async function () {
  const pool = io.getPool(pg);
  const client = await pool.connect();
  await io.ensureReady(client);

  /* A REGISTER TO SIGN IN FROM. A deployed tenant is clean-slated down to the
     SMO (migration 004), which is right for a client and useless here: with one
     person there is one role and seven of the eight are never tested. So the
     test writes the worked example's register in — people only, into the state
     the platform already holds — and that is the whole reason this needs a
     throwaway database rather than a live one. */
  {
    const base = await io.readState(client);
    if ((base.people || []).length < 5) {
      const demo = require("../db/seed-state.json");
      base.people = demo.people;
      base.unitRoles = demo.unitRoles;
      Object.keys(demo.functions || {}).forEach(function (k) {
        if (base.functions && base.functions[k]) {
          base.functions[k].head = demo.functions[k].head;
          base.functions[k].custodian = demo.functions[k].custodian;
        }
      });
      await io.writeState(client, base);
      console.log("seeded the register with " + base.people.length + " people\n");
    }
  }

  /* Everybody needs an address, because signing in BY ADDRESS is the thing
     under test. The demo register carries none (§74's finding), so the test
     gives each of its subjects one — in the test database only. */
  const stored = await io.readState(client);
  const w = R.worldOf(stored);
  /* NOT THE SMO. They are the person issuing, and a reset deliberately
     excludes whoever asked for it (§46.4) — so picking them as a subject tests
     the guard rather than the cycle. Their own way in is the password they
     already hold, which every other step here depends on and is therefore
     proved by the run itself. */
  const holders = {};
  (stored.people || []).forEach(function (p) {
    if (p.key === "smo") return;
    R.personRoles(w, p).forEach(function (r) {
      if (!holders[r.role]) holders[r.role] = { key: p.key, name: p.name, at: r.at };
    });
  });
  const subjects = R.ROLE_KEYS.filter(function (k) { return holders[k]; })
                              .map(function (k) { return { role: k, ...holders[k] }; });
  console.log("signing in as one holder of each of " + subjects.length + " roles");
  /* WHICH ROLES THIS RUN COULD NOT REACH, SAID OUT LOUD. A deployed tenant is
     clean-slated, so there are no plan lines and therefore nobody is a
     Contributor — `namedInUnit` is what makes one (§55), and it reads the plan.
     Reporting "6 roles, all green" without this is a green run that quietly
     covered less than it looks like. */
  const missing = R.ROLE_KEYS.filter(function (k) { return !holders[k] && k !== "super"; });
  if (missing.length) {
    console.log("NOT covered by this run: " + missing.join(", ") +
                " \u2014 nobody in this register holds them. Contributor needs a plan " +
                "line naming somebody, and a clean-slate tenant has no plan.");
  }
  console.log("");

  /* AND THE NARROWING NEEDS SOMETHING TO NARROW BY. The demo ships the ten
     Official BU names with NOTHING mapped (§54, A4) — deliberately, so a client
     never inherits Raya's departments — which means every subject falls through
     the "no Official BU" branch and the shortlist Islam reported twice as
     broken is never exercised at all. A test that only walks the empty case
     reports green on the half nobody uses.

     So two names are pointed somewhere and the subjects are given one each:
     Distribution at the COMPANY, which is the interesting branch (it expands to
     the units the company holds), and Marketing at a single function. */
  {
    const g = await io.readState(client);
    g.group = g.group || {};
    const co = Object.keys(g.companies || {})[0];
    const fn = Object.keys(g.functions || {})[0];
    g.group.mainbus = [
      { name: "Distribution", at: co ? "co:" + co : null },
      { name: "Marketing",    at: fn ? "fn:" + fn : null }
    ];
    g.people = (g.people || []).map(function (p, i) {
      if (p.key === "smo") return p;
      return Object.assign({}, p, { mainbu: i % 2 ? "Distribution" : "Marketing" });
    });
    await io.writeState(client, g);
    console.log("Official BU: Distribution \u2192 " + (co ? "co:" + co : "nothing") +
                " · Marketing \u2192 " + (fn ? "fn:" + fn : "nothing") + "\n");
  }

  for (const s of subjects) {
    s.email = s.key + "@test.example";
    await client.query(
      "UPDATE people SET extra = COALESCE(extra,'{}'::jsonb) || $2::jsonb WHERE key = $1",
      [s.key, JSON.stringify({ email: s.email })]);
  }

  /* The SMO's own session, to issue the temporary passwords from. */
  const smo = {};
  let r = await call(authApi, { action: "login", user: "smo", password: "1234" }, smo);
  if (!r.body || !r.body.ok) { console.log("could not sign the SMO in:", JSON.stringify(r.body)); process.exit(1); }
  if (r.body.person.mustChange) {
    await call(authApi, { action: "change", current: "1234", password: "Smo_2026_cycle" }, smo);
  }
  const SMO_PW = r.body.person.mustChange ? "Smo_2026_cycle" : "1234";

  for (const s of subjects) {
    console.log("── " + R.ROLES.filter(x => x.key === s.role)[0].name +
                " · " + s.name + " (" + s.email + ")");
    const jar = {};
    const ip = "10.0.0." + (10 + subjects.indexOf(s));   /* per person: the rate limiter counts by address */

    /* 1 · the SMO issues a temporary password TO THIS PERSON.
       `setPassword`, not `issueTemporary`: the second is the BULK one behind
       the Passwords header menu and takes no list of people at all — written
       against it, the first subject silently issued to the whole register and
       every subject after reported nothing issued while signing in perfectly.
       A check aimed at the wrong endpoint fails in the one direction that
       looks like a product bug. */
    let x = await call(authApi, { action: "setPassword", person: s.key,
                                  password: "Temp_2026_x" }, smo);
    check("the SMO can issue them a temporary password",
          x.body && x.body.ok, JSON.stringify(x.body));

    /* 2 · they sign in with their ADDRESS */
    x = await call(authApi, { action: "login", user: s.email, password: "Temp_2026_x" }, jar, ip);
    check("they sign in with their email address", x.body && x.body.ok, JSON.stringify(x.body));
    check("...and are told to choose their own password", x.body && x.body.person &&
          x.body.person.mustChange === true);

    /* 3 · and the SERVER refuses them until they do */
    let st = await get(stateApi, jar);
    check("the tenant's data is refused while the password is temporary",
          st.statusCode === 403 && st.body && st.body.mustChange === true,
          st.statusCode + " " + JSON.stringify(st.body && st.body.error));

    /* 4 · they choose one */
    x = await call(authApi, { action: "change", current: "Temp_2026_x",
                              password: "Ownpw_2026_" + s.role }, jar, ip);
    check("they can choose their own", x.body && x.body.ok, JSON.stringify(x.body));

    /* 5 · now the platform opens, as them */
    st = await get(stateApi, jar);
    check("the platform opens for them", st.statusCode === 200 && st.body && st.body.ok,
          st.statusCode + " " + JSON.stringify(st.body && st.body.error));
    check("...and it knows who they are", st.body && st.body.person &&
          st.body.person.key === s.key, JSON.stringify(st.body && st.body.person));

    /* 6 · THE SHORT LIST, NARROWED ON THE SERVER (§57).
       Islam reported twice that the whole list appeared instead of the few his
       Official BU points at, so "it answered ok" is not the check — `near` is,
       and it has to be a PROPER SUBSET of everything on offer or the narrowing
       is decoration. Somebody whose row names no Official BU legitimately gets
       no shortlist, so that case is allowed and reported rather than failed. */
    x = await call(authApi, { action: "whereList" }, jar, ip);
    check("they are offered somewhere to say they work", x.body && x.body.ok,
          JSON.stringify(x.body));
    if (x.body && x.body.ok) {
      const all = (x.body.units || []).length + (x.body.functions || []).length;
      const near = (x.body.near || []).length;
      check("the list the server builds is not empty", all > 0, "offered " + all);
      if (near) {
        check("...and the shortlist is SHORTER than it (" + near + " of " + all + ")",
              near < all);
        const offered = (x.body.units || []).map(u => u.at)
          .concat((x.body.functions || []).map(f => f.at));
        check("...and every name on it is one the list actually offers",
              (x.body.near || []).every(a => offered.indexOf(a) > -1),
              JSON.stringify(x.body.near));
      } else {
        console.log("         (no shortlist: this person's row names no Official BU — " +
                    "the full list of " + all + " is the honest answer)");
      }
    }

    /* 7 · they can reach something, and it is theirs */
    const me = (stored.people || []).filter(p => p.key === s.key)[0];
    const reach = R.PAGES.filter(function (pg2) {
      return R.grantAtPage(w, me, pg2.key, s.at) !== "none"; }).length;
    check("they can open at least one page", reach > 0, "pages: " + reach);

    /* 8 · signing in again with the new password works, and the old one does not */
    const jar2 = {};
    x = await call(authApi, { action: "login", user: s.email,
                              password: "Ownpw_2026_" + s.role }, jar2, ip);
    check("they can sign in again with the password they chose", x.body && x.body.ok);
    check("...and it is no longer temporary", x.body && x.body.person &&
          !x.body.person.mustChange);
    x = await call(authApi, { action: "login", user: s.email, password: "Temp_2026_x" }, {}, ip);
    check("the temporary one no longer works", x.body && !x.body.ok);
    console.log("");
  }

  console.log(pass + " passed, " + fail + " failed");
  client.release();
  await pool.end();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
