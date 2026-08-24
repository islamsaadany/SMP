/* WHO A MESSAGE GOES TO (§74).
   ═══════════════════════════════════════════════════════════════════════

   ONE COPY, RUN ON BOTH SIDES, for the same reason lib/rules.js is: the
   composer shows the resolved list so somebody can see who they are about to
   mail, and the server resolves it AGAIN before sending. Two copies of "who
   does 'unit heads in Mobile' mean" would drift, and the drift here is a
   message reaching people the page never named.

   THE BROWSER SENDS CRITERIA, NEVER ADDRESSES. A page that posted a list of
   recipients would be the client deciding who gets mail — §42's rule, one
   surface further out. The criteria are small and checkable; the register they
   resolve against is the stored one, on the server.

   NOTHING IN HERE TOUCHES THE DOM, THE DATABASE OR THE NETWORK. It takes a
   world, a register and a set of criteria, and returns two lists. */

(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) module.exports = factory(
    typeof require === "function" ? require("./rules.js") : null);
  else root.SMPAudience = factory(root.SMPRules);
})(typeof self !== "undefined" ? self : this, function (Rules) {
  "use strict";

  function str(v) { return String(v == null ? "" : v).trim(); }

  /* An address the platform is willing to send to. Deliberately loose — the
     register is filled from a spreadsheet and this is not the place to argue
     with a real address that happens to look unusual. What it does refuse is
     the shapes that are certainly not addresses, so a send does not fail
     halfway down the list on a cell that says "n/a". */
  function addressOf(p) {
    var a = str(p && p.email).toLowerCase();
    return /^[^@\s,;]+@[^@\s,;]+\.[^@\s,;]+$/.test(a) ? a : "";
  }

  /* Where a person SITS, which is not the same as where they hold a role.
     The register's own attachment, in the vocabulary every role already uses
     ("group", "co:…", "fn:…", or a unit key) — §54's rule, so a target can be
     a company without anything being invented for it. */
  function seatOf(p) {
    if (!p) return null;
    if (p.fn) return "fn:" + p.fn;
    if (p.company) return "co:" + p.company;
    if (p.unit) return p.unit;
    return null;
  }

  /* CRITERIA ADD UP; THEY DO NOT NARROW EACH OTHER. "Unit heads" and "everyone
     in Mobile" ticked together means both groups, not the heads of Mobile —
     four boxes that intersected would need a sentence explaining themselves
     every time, and the thing somebody actually wants is a list they can see.
     The resolved list is shown before anything is sent, so the union is
     checkable rather than something to reason about. */
  function matches(world, p, c) {
    if (c.everyone) return true;

    var keys = c.keys || [];
    if (keys.indexOf(p.key) > -1) return true;

    var roles = c.roles || [], targets = c.targets || [];
    if (!roles.length && !targets.length) return false;

    var held = Rules ? Rules.personRoles(world, p) : [];
    var i;
    for (i = 0; i < held.length; i++) {
      if (roles.indexOf(held[i].role) > -1) return true;
      if (targets.indexOf(held[i].at) > -1) return true;
    }
    /* Somebody attached to a place with no role there is still THERE. A unit's
       people are the people in it, not the people with a title in it. */
    var seat = seatOf(p);
    return !!(seat && targets.indexOf(seat) > -1);
  }

  /* SKIPPED PEOPLE ARE NAMED, NOT COUNTED. "3 skipped" tells nobody which
     three, and the fix for every one of them is a different edit on a
     different row. */
  function resolve(world, people, criteria) {
    var c = criteria || {};
    var to = [], skipped = [];
    (people || []).forEach(function (p) {
      if (!p || !p.key) return;
      if (Rules && !Rules.personActive(p)) return;   /* retired: not an omission */
      if (!matches(world, p, c)) return;
      var a = addressOf(p);
      if (!a) { skipped.push({ key: p.key, name: p.name || p.key, why: "no address on the register" }); return; }
      to.push({ key: p.key, name: p.name || p.key, email: a });
    });
    /* TWO ROWS, ONE ADDRESS — the register has never enforced uniqueness
       (§69.23 met it at the door). Here it is harmless and confusing: the same
       inbox would get the same message twice. First row wins, the second is
       named. */
    var seen = {}, out = [];
    to.forEach(function (r) {
      if (seen[r.email]) {
        skipped.push({ key: r.key, name: r.name,
                       why: "shares an address with " + seen[r.email] });
        return;
      }
      seen[r.email] = r.name; out.push(r);
    });
    return { to: out, skipped: skipped };
  }

  return { resolve: resolve, addressOf: addressOf, seatOf: seatOf };
});
