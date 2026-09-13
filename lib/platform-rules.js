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

   ONE COPY (constitution IX): api/platform.js and api/auth.js accept from
   this, and platform.html draws only what those endpoints answer — so a card
   can never offer a client the next request refuses. Written as a module a
   page could load too, though none does today. Nothing here touches the DOM
   or the database. */

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

  /* WHAT THE CARDS DRAW is what the endpoints will open — asked once, here.
     A retired client is out of this list by design; §323's band draws those,
     and only for whoever can do something about them. */
  function visibleClients(world, account, clients) {
    return (clients || NO_LIST).filter(function (c) {
      return c && c.status !== "retired" && mayListClient(world, account, c);
    });
  }

  /* ── ARCHIVING A CLIENT, AND DELETING ONE (§323) ────────────────────
     Islam: "we need an option to remove the client" — "both, demo client is
     not removable, and the name is Archive not put aside".

     ONE RIGHT, BOTH DIRECTIONS. Whoever may put a client away may take it
     out again: two rules would mean a platform where somebody can archive a
     client and then not reach the control that undoes it (§61), which is the
     worst shape a reversible act can have.

     THE ADMIN'S ALONE, and that is a narrowing of `mayCreateClient` rather
     than a copy of it: adding a client can be handed to a consultant through
     the access table, and removing one cannot. §89's rule — destruction is
     the super user's — read at the platform's own level.

     AND THE WORKED EXAMPLE IS NEITHER ARCHIVED NOR DELETED (Islam's, asked
     and answered before anything was built): it is the practice ground, it
     is reseeded rather than removed, and `kind` is what says so — never its
     key, which is a client's key like any other (§317). */
  function mayArchiveClient(world, account, client) {
    if (!isActive(account) || isClientPerson(account)) return false;
    if (!client || client.kind === "demo") return false;
    return isAdmin(account);
  }

  /* DELETING NEEDS THE CLIENT TO BE ARCHIVED ALREADY, and that is the guard
     rather than a second confirmation: archiving closes the door, so nobody
     is working inside a client while it is being deleted, and the two presses
     are separated by a state somebody had to choose. Asked of the STORED row
     on the server as well as here, or it is a rule the screen keeps and the
     save does not (§42). */
  function mayDeleteClient(world, account, client) {
    return mayArchiveClient(world, account, client) && !!client && client.status === "retired";
  }

  /* The band under the grid, and who sees it. NOT everybody `visibleClients`
     would list: a consultant shown a row of clients they can neither open nor
     bring back has been given furniture (§94.15). */
  function archivedClients(world, account, clients) {
    return (clients || NO_LIST).filter(function (c) {
      return c && c.status === "retired" && mayArchiveClient(world, account, c);
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
    visibleClients: visibleClients,
    mayArchiveClient: mayArchiveClient, mayDeleteClient: mayDeleteClient,
    archivedClients: archivedClients
  };
});
