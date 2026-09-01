/* THE OFFICE'S RULES — who at Forefront may do what.
   ═══════════════════════════════════════════════════════════════════════

   TWO LEVELS, AND THEY ANSWER DIFFERENT QUESTIONS (Islam, 2026-08-29:
   "the consultants roles are not general across the multitenants — the roles
   are on the client level").

     1 · THE PLATFORM has one ADMIN. Adding clients, adding consultants, and
         setting the table below. Nothing else lives at this level.
     2 · A CLIENT gives a SEAT — `super` or `smoteam`, the client's own two
         (§89) — set on that client's configuration. It decides everything
         that person may do inside that client, and it is the seat written
         into that client's own register, so no rule in lib/rules.js changes.

   Somebody can be Raya's Super user, on RHI's SMO team, and nothing at all on
   El Abd. This REVERSES the four platform roles (Admin · Lead · Consultant ·
   Observer) built on 28 August: they were a fair reading of "we need an
   accessibility table" and they are wrong about the thing that matters —
   what somebody may do depends on the client in front of them.

   ONE COPY, RUN ON BOTH SIDES (constitution IX): the platform draws from this
   and api/platform.js accepts from it, so a card can never offer a client the
   next request refuses. Nothing here touches the DOM or the database. */

(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) module.exports = factory();
  else root.FFRules = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ── 1 · The seats a client gives ─────────────────────────────────
     The client's own two, so the mapping into their register is exact and
     nothing new has to be learnt. */
  var SEATS = [
    { key: "super",   name: "Super user",
      note: "This client's access matrix, retiring people, issuing passwords." },
    { key: "smoteam", name: "SMO team",
      note: "Runs cycles and corrects plans in this client." }
  ];
  var SEAT_KEYS = SEATS.map(function (s) { return s.key; });

  /* ── 2 · The platform's own questions ─────────────────────────────
     What is left once the seat answers everything about a client. Asked of
     everybody who is not the admin — there is no second rank. */
  var AREAS = [
    { key: "other_clients", name: "Clients they hold no seat on",
      states: ["hidden", "listed", "open"],
      note: "Hidden entirely, listed by name so the office knows what Forefront runs, or open to read." },
    { key: "consultants",   name: "Consultants list", states: ["none", "view", "edit"],
      note: "Forefront's own people, and their passwords." },
    { key: "create_client", name: "Add a client", states: ["none", "yes"], act: true,
      note: "Creating a client's platform." },
    { key: "demo",          name: "Demo", states: ["none", "view", "edit"],
      note: "The demo client — somewhere real to practise, with no client in it." }
  ];
  var AREA_KEYS = AREAS.map(function (a) { return a.key; });

  /* Everyone who is not the admin is one row, because there is nobody else to
     tell apart: a consultant on no client already sees nothing, and a
     partner's standing is the seats they hold. */
  var EVERYONE = "everyone";

  var ACCESS_DEFAULTS = {
    everyone: { other_clients: "listed", consultants: "view", create_client: "none", demo: "edit" }
  };

  var RANK = { none: 0, hidden: 0, view: 1, listed: 1, edit: 2, open: 2, yes: 2 };

  function frozen(o) { return Object.freeze(o); }
  var NO_MAP = frozen({});
  var NO_LIST = frozen([]);

  /* A READER NEVER CREATES WHAT IT LOOKED FOR (constitution XII). */
  function storedFor(world) {
    var all = (world && world.access) || NO_MAP;
    return all[EVERYONE] || NO_MAP;
  }

  /* Absent means "not answered yet", never "denied": the shipped default
     answers instead (§30.2), so an area added later is not silently closed to
     everybody who ever touched the table. */
  function grantIn(world, areaKey) {
    if (AREA_KEYS.indexOf(areaKey) < 0) return "none";
    var stored = storedFor(world);
    if (Object.prototype.hasOwnProperty.call(stored, areaKey)) return stored[areaKey];
    return ACCESS_DEFAULTS[EVERYONE][areaKey] || "none";
  }

  function atLeast(state, want) { return (RANK[state] || 0) >= (RANK[want] || 0); }

  function isActive(account) { return !!account && account.status !== "retired"; }
  function isAdmin(account) { return isActive(account) && !!account.is_admin && !isClientPerson(account); }
  /* A CLIENT'S OWN PERSON IS NOT ONE OF US. They hold exactly the client on
     their row and no page of this platform, and the question is asked before
     anything else — a stray flag must not promote somebody who is not
     Forefront. */
  function isClientPerson(account) { return !!account && account.kind === "client"; }

  /* ── 3 · The seat somebody holds on a client ──────────────────────
     `world.mine` is `account_clients` read for this account: one row per
     client, carrying the seat. It is the ONE statement of what somebody is on
     a client — the cards, the endpoints and the row written into that client's
     register all answer from it. */
  function seatOn(world, clientKey) {
    var mine = (world && world.mine) || NO_LIST;
    for (var i = 0; i < mine.length; i++) {
      if (mine[i] && mine[i].client_key === clientKey) return mine[i].seat || "smoteam";
    }
    return null;
  }
  function myClientKeys(world) {
    return ((world && world.mine) || NO_LIST).map(function (m) { return m.client_key; });
  }
  function isMine(world, clientKey) { return seatOn(world, clientKey) != null; }
  function isSuperOf(world, clientKey) { return seatOn(world, clientKey) === "super"; }

  /* ── 4 · What that means for a client ─────────────────────────────
     A seat opens the client. No seat falls to the platform's own setting for
     clients you hold no seat on — hidden, listed, or open to read. */
  function clientState(world, account, client) {
    if (!isActive(account) || !client) return "hidden";
    if (isClientPerson(account)) return isMine(world, client.key) ? "open" : "hidden";
    if (isAdmin(account)) return "open";
    if (isMine(world, client.key)) return "open";
    /* The demo client has a column of its own, so a new joiner can practise
       somewhere real while reaching no client at all — asked BEFORE the
       no-seat setting, or the column would never apply. */
    if (client.kind === "demo") {
      var d = grantIn(world, "demo");
      return d === "none" ? "hidden" : "open";
    }
    return grantIn(world, "other_clients");
  }
  function mayListClient(world, account, client) {
    return atLeast(clientState(world, account, client), "listed");
  }
  function mayOpenClient(world, account, client) {
    return atLeast(clientState(world, account, client), "open");
  }
  /* WHAT THEY MAY DO INSIDE IS THE SEAT, and the client's own rules take it
     from there — this only says whether they arrive holding one. */
  function seatFor(world, account, client) {
    if (!client) return null;
    if (isClientPerson(account)) return null;
    var held = seatOn(world, client.key);
    if (held) return held;
    /* The admin reaches every client; arriving without a seat they hold the
       client's own Super user seat, because somebody has to be able to open a
       client nobody is on yet — the one they just created. */
    if (isAdmin(account)) return "super";
    return null;
  }

  /* ── 5 · A client's configuration ─────────────────────────────────
     The admin, and that client's own Super user — the person who already
     holds its access matrix, its retirements and its passwords. Nobody else
     names who works on a client. */
  function mayReadConfig(world, account, client) {
    return mayOpenClient(world, account, client) &&
           (isAdmin(account) || isSuperOf(world, client && client.key));
  }
  function mayConfigureClient(world, account, client) {
    return mayReadConfig(world, account, client);
  }

  /* ── 6 · The platform's own pages ─────────────────────────────────
     Everything here is the admin's outright, or what the table says for
     everybody else. */
  function consultantsState(world, account) {
    if (!isActive(account) || isClientPerson(account)) return "none";
    if (isAdmin(account)) return "edit";
    return grantIn(world, "consultants");
  }
  function mayReadConsultants(world, account) { return atLeast(consultantsState(world, account), "view"); }
  function mayManageConsultants(world, account) { return atLeast(consultantsState(world, account), "edit"); }

  function mayCreateClient(world, account) {
    if (!isActive(account) || isClientPerson(account)) return false;
    if (isAdmin(account)) return true;
    return grantIn(world, "create_client") === "yes";
  }

  /* The table is the admin's, and the ADMIN'S OWN ROW is nobody's — editing
     this table is editing who may edit it (§89). Here that row is not even
     drawn as editable: there is one admin flag, and it is set on the
     consultants page, deliberately, so the two acts stay apart. */
  function mayEditAccess(world, account) { return isAdmin(account); }

  /* ISSUING A PASSWORD: THE TEST IS THE TARGET (§89). */
  function mayIssuePasswordTo(world, account, target) {
    if (!mayManageConsultants(world, account)) return false;
    if (!target || target.email === account.email) return false;
    return !target.is_admin;
  }
  /* And the admin flag itself is the admin's to give, never to take from
     themselves: a platform with no admin cannot be run. */
  function maySetAdmin(world, account, target) {
    return isAdmin(account) && !!target && target.email !== account.email;
  }

  /* WHAT THE CARDS DRAW is what the endpoints will open — asked once, here. */
  function visibleClients(world, account, clients) {
    return (clients || NO_LIST).filter(function (c) {
      return c && c.status !== "retired" && mayListClient(world, account, c);
    });
  }

  return {
    SEATS: SEATS, SEAT_KEYS: SEAT_KEYS, AREAS: AREAS, AREA_KEYS: AREA_KEYS,
    EVERYONE: EVERYONE, ACCESS_DEFAULTS: ACCESS_DEFAULTS, RANK: RANK,
    grantIn: grantIn, atLeast: atLeast,
    isActive: isActive, isAdmin: isAdmin, isClientPerson: isClientPerson,
    seatOn: seatOn, seatFor: seatFor, myClientKeys: myClientKeys,
    isMine: isMine, isSuperOf: isSuperOf,
    clientState: clientState, mayListClient: mayListClient, mayOpenClient: mayOpenClient,
    mayReadConfig: mayReadConfig, mayConfigureClient: mayConfigureClient,
    mayReadConsultants: mayReadConsultants, mayManageConsultants: mayManageConsultants,
    mayCreateClient: mayCreateClient, mayEditAccess: mayEditAccess,
    mayIssuePasswordTo: mayIssuePasswordTo, maySetAdmin: maySetAdmin,
    visibleClients: visibleClients
  };
});
