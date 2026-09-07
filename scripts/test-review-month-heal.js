#!/usr/bin/env node
/* ── ONE MONTH, ONE MEANING — THE HEAL (§307) ────────────────────────────
   Islam: *"the cycle ending is the reporting as of so that's what the
   proration depend on this is a critical change so take care what you will
   remove and what to adjust."*

   Two fields answered one question and a tenant could hold them disagreeing —
   his did. `review.extra.asOfMonth` is gone and its month moves into `to`.

   THE DIRECTION IS WHAT THIS ASSERTS. Every score is computed from the review
   point TODAY, so carrying that month into `to` moves NO SCORE — and that is
   checked here rather than reasoned about: the review point read before the
   heal and after it must be the same month.

   RUN: DATABASE_URL=... node scripts/test-review-month-heal.js               */
const { readState, writeState, ensureReady, forgetReady, getPool } = require("../lib/state-io.js");
const R = require("../lib/rules.js");
const pg = require("pg");

let pass = 0, fail = 0;
function ck(name, ok, detail) {
  console.log((ok ? "  ok    " : "  FAIL  ") + name + (ok ? "" : "   -> " + JSON.stringify(detail)));
  ok ? pass++ : fail++;
}
/* The one function every score on the platform goes through, modelled here
   from the shared rule rather than from a copy of the arithmetic: what is
   asserted is that this month does not move. */
const asOf = (rv) => R.whenMonths(rv.to, false, null);

(async function () {
  const pool = getPool(pg);
  const c = await pool.connect();
  try {
    await ensureReady(c);

    /* ── the state a tenant can actually be in ─────────────────────── */
    const s = await readState(c);
    s.review = Object.assign({}, s.review, {
      name: "Cycle 2", from: "Jan 2027", to: "Jun 2027",
      due: "15 Jul 2027", asOfMonth: "Aug 26",
    });
    await writeState(c, s);
    await c.query("DELETE FROM _sql_migrations WHERE name LIKE '043-%'");

    const before = await readState(c);
    ck("the tenant holds both fields, disagreeing",
       before.review.to === "Jun 2027" && before.review.asOfMonth === "Aug 26", before.review);
    const scoredAgainst = R.whenMonths(before.review.asOfMonth, false, null);

    /* ── the heal ──────────────────────────────────────────────────── */
    forgetReady();
    await ensureReady(c);
    const after = await readState(c);

    ck("the review point is now the cycle's end", after.review.to === "Aug 2026", after.review);
    ck("...and it is the SAME MONTH every score was measured against before",
       asOf(after.review) === scoredAgainst, [asOf(after.review), scoredAgainst]);
    ck("the second field is gone from the stored graph",
       !Object.prototype.hasOwnProperty.call(after.review, "asOfMonth"), after.review);
    /* Four digits, or `cycleYear()` loses `to` as a year source (§239.3). */
    ck("...written with a four-digit year", /\d{4}$/.test(after.review.to), after.review.to);
    ck("nothing else about the cycle moved",
       after.review.name === "Cycle 2" && after.review.from === "Jan 2027" &&
       after.review.due === "15 Jul 2027", after.review);

    /* ── ONCE (§172's shape): a second boot writes nothing ──────────── */
    forgetReady();
    await ensureReady(c);
    const again = await readState(c);
    ck("a second boot changes nothing", JSON.stringify(again.review) === JSON.stringify(after.review),
       again.review);

    /* ── AND A TENANT THAT NEVER HAD ONE IS UNTOUCHED ──────────────── */
    const t = await readState(c);
    t.review = Object.assign({}, t.review, { to: "Jun 2026" });
    delete t.review.asOfMonth;
    await writeState(c, t);
    await c.query("DELETE FROM _sql_migrations WHERE name LIKE '043-%'");
    forgetReady();
    await ensureReady(c);
    const clean = await readState(c);
    ck("a cycle that never carried a second month is left exactly as it was",
       clean.review.to === "Jun 2026", clean.review);

    /* ── AND A MONTH THE PLATFORM CANNOT READ IS NOT WRITTEN OVER `to` ─
       §96.2: what somebody stored is never replaced by something the platform
       could not parse in the first place. The key still goes, because nothing
       reads it any more. */
    const u = await readState(c);
    u.review = Object.assign({}, u.review, { to: "Jun 2026", asOfMonth: "On-going" });
    await writeState(c, u);
    await c.query("DELETE FROM _sql_migrations WHERE name LIKE '043-%'");
    forgetReady();
    await ensureReady(c);
    const odd = await readState(c);
    ck("an unreadable month does not overwrite the cycle's end",
       odd.review.to === "Jun 2026" &&
       !Object.prototype.hasOwnProperty.call(odd.review, "asOfMonth"), odd.review);
  } finally {
    c.release();
    await pool.end();
  }
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
