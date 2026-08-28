/* THE OFFICE'S RULES — who at Forefront may see and do what, across clients.
   ═══════════════════════════════════════════════════════════════════════

   ONE COPY, RUN ON BOTH SIDES, for the same reason lib/rules.js is: the outer
   platform asks "may this account open that client?" to decide what to DRAW,
   and api/platform.js asks the same question to decide what to ACCEPT. Two
   copies drift, and the drift is silent in the worst way — a card that offers
   a client the server then refuses (constitution IX).

   IT IS §37's TABLE ONE LEVEL UP, and deliberately not a second way of
   expressing permission: roles down, areas across, each cell none/view/edit,
   with MY clients a different column from OTHER clients for §37's own reason —
   the interesting question is almost always whether the thing is yours.

   NOTHING IN HERE TOUCHES THE DOM OR THE DATABASE. Every function takes a
   WORLD — the account, its clients, and the stored access map — and answers
   from it. */

(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) module.exports = factory();
  else root.FFRules = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ── 1 · The roles (Islam, 2026-08-28) ────────────────────────────
     Four, because two cannot tell a new joiner from a partner and five is a
     table nobody reads. The Admin is the platform's own owner — one person
     today. */
  var ROLES = [
    { key:"admin",      name:"Admin",
      note:"Runs the platform: adds clients and consultants, and sets this table." },
    { key:"lead",       name:"Lead",
      note:"Runs the clients they are on, and configures them." },
    { key:"consultant", name:"Consultant",
      note:"Works inside the clients they are on." },
    { key:"observer",   name:"Observer",
      note:"New joiners, and anyone who only reads." }
  ];
  var ROLE_KEYS = ROLES.map(function (r) { return r.key; });

  /* THE ADMIN'S ROW IS NOT WRITABLE, for §89's reason one level up: editing
     this table is editing who may edit this table, so the platform must always
     have somebody who can. Adding clients and managing consultants stay the
     Admin's whatever the table says — which is why mayCreateClient() and
     mayManageConsultants() answer TRUE for an admin before they read a cell. */
  var ADMIN = "admin";

  /* ── 2 · The areas ────────────────────────────────────────────────
     Six. `create_client` is an ACT rather than a page, so it reads none/edit
     and never `view` — a Create button you may look at and not press is
     furniture (§45.2). */
  var AREAS = [
    { key:"my_clients",     name:"My clients",
      note:"The clients whose team I am on." },
    { key:"other_clients",  name:"Other clients",
      note:"Every client I am not on the team of." },
    { key:"client_config",  name:"Client configuration",
      note:"A client's name, industry, notes, mark and team — for the clients I can reach." },
    { key:"consultants",    name:"Consultants",
      note:"Forefront's own people, and their passwords." },
    { key:"create_client",  name:"Add a client", act:true,
      note:"Creating a client's platform." },
    { key:"demo",           name:"Demo",
      note:"The demo client — somewhere real to practise, with no client in it." }
  ];
  var AREA_KEYS = AREAS.map(function (a) { return a.key; });

  var STATE_RANK = { none:0, view:1, edit:2 };

  /* ── 3 · The defaults ─────────────────────────────────────────────
     Proposed by Claude, approved by Islam 2026-08-28, and written down rather
     than left implicit: a default nobody chose is still a decision.

     A stored map is MERGED over these, never substituted (§30.2). */
  var ACCESS_DEFAULTS = {
    admin:      { my_clients:"edit", other_clients:"edit", client_config:"edit",
                  consultants:"edit", create_client:"edit", demo:"edit" },
    lead:       { my_clients:"edit", other_clients:"view", client_config:"edit",
                  consultants:"view", create_client:"none", demo:"edit" },
    consultant: { my_clients:"edit", other_clients:"none", client_config:"view",
                  consultants:"none", create_client:"none", demo:"view" },
    observer:   { my_clients:"view", other_clients:"none", client_config:"none",
                  consultants:"none", create_client:"none", demo:"view" }
  };

  function frozen(o) { return Object.freeze(o); }
  var NO_ACCESS = frozen({});
  var NO_LIST = frozen([]);

  /* ── 4 · Reading the table ────────────────────────────────────────
     A READER NEVER CREATES WHAT IT LOOKED FOR (constitution XII): this returns
     a frozen empty rather than building a map, and the writing half is
     somebody else's job. */
  function storedFor(world, roleKey) {
    var all = (world && world.access) || NO_ACCESS;
    return all[roleKey] || NO_ACCESS;
  }

  /* The one place a cell is answered. Absent means "not asked yet", never
     "denied" — the shipped default answers instead (§30.2). */
  function grantIn(world, roleKey, areaKey) {
    if (!roleKey) return "none";                       /* nothing until granted */
    if (AREA_KEYS.indexOf(areaKey) < 0) return "none"; /* an area nobody declared */
    var stored = storedFor(world, roleKey);
    if (Object.prototype.hasOwnProperty.call(stored, areaKey)) return stored[areaKey];
    var def = ACCESS_DEFAULTS[roleKey];
    return (def && def[areaKey]) || "none";
  }

  function atLeast(grant, want) {
    return (STATE_RANK[grant] || 0) >= (STATE_RANK[want] || 0);
  }

  function roleOf(account) { return (account && account.role) || null; }
  /* A CLIENT'S OWN PERSON IS NOT GOVERNED BY THE OFFICE'S TABLE. They hold
     exactly the client on their row and nothing else — no cards, no other
     client, no page of the outer platform. Asked before the matrix, because
     the matrix has no row that means "not one of us". */
  function isClientPerson(account) { return !!account && account.kind === "client"; }
  function isAdmin(account) { return roleOf(account) === ADMIN; }
  function isActive(account) {
    return !!account && account.status !== "retired";
  }

  /* ── 5 · My clients ───────────────────────────────────────────────
     DERIVED, never a second list: the team on each client's configuration is
     the only statement of who works on it. */
  function myClientKeys(world) {
    var mine = (world && world.mine) || NO_LIST;
    return mine.map(function (m) { return typeof m === "string" ? m : m.client_key; });
  }
  function isMine(world, clientKey) {
    return myClientKeys(world).indexOf(clientKey) > -1;
  }
  function isSuperOf(world, clientKey) {
    var mine = (world && world.mine) || NO_LIST;
    for (var i = 0; i < mine.length; i++) {
      if (mine[i] && mine[i].client_key === clientKey && mine[i].is_super) return true;
    }
    return false;
  }

  /* WHICH COLUMN A CLIENT IS READ THROUGH. The demo client has a column of its
     own — that is what lets a new joiner practise somewhere real while seeing
     no client at all — so it is asked FIRST, or it would fall into
     other_clients and the column would never apply. */
  function areaFor(world, client) {
    if (!client) return "other_clients";
    if (client.kind === "demo") return "demo";
    return isMine(world, client.key) ? "my_clients" : "other_clients";
  }

  function clientGrant(world, account, client) {
    if (!isActive(account)) return "none";
    if (isClientPerson(account)) {
      /* Their own client, always; anybody else's, never — and the office's
         roles never widen or narrow it. */
      return client && isMine(world, client.key) ? "edit" : "none";
    }
    if (isAdmin(account)) return "edit";
    return grantIn(world, roleOf(account), areaFor(world, client));
  }

  function mayOpenClient(world, account, client) {
    return atLeast(clientGrant(world, account, client), "view");
  }
  function mayEditClient(world, account, client) {
    return atLeast(clientGrant(world, account, client), "edit");
  }

  /* CONFIGURATION IS EXERCISED OVER THE CLIENTS THAT ROLE CAN REACH. A Lead
     who may edit configuration edits it for their own clients; it never hands
     them a client their row cannot open. */
  function configGrant(world, account, client) {
    if (!isActive(account) || isClientPerson(account)) return "none";
    if (isAdmin(account)) return "edit";
    if (!mayOpenClient(world, account, client)) return "none";
    return grantIn(world, roleOf(account), "client_config");
  }
  function mayReadConfig(world, account, client) {
    return atLeast(configGrant(world, account, client), "view");
  }
  function mayConfigureClient(world, account, client) {
    return atLeast(configGrant(world, account, client), "edit");
  }

  function consultantsGrant(world, account) {
    if (!isActive(account) || isClientPerson(account)) return "none";
    if (isAdmin(account)) return "edit";
    return grantIn(world, roleOf(account), "consultants");
  }
  function mayReadConsultants(world, account) {
    return atLeast(consultantsGrant(world, account), "view");
  }
  function mayManageConsultants(world, account) {
    return atLeast(consultantsGrant(world, account), "edit");
  }

  function mayCreateClient(world, account) {
    if (!isActive(account) || isClientPerson(account)) return false;
    if (isAdmin(account)) return true;
    return grantIn(world, roleOf(account), "create_client") === "edit";
  }

  /* THE MATRIX IS THE ADMIN'S, and the admin ROW is nobody's. */
  function mayEditAccess(world, account) {
    return isActive(account) && !isClientPerson(account) && isAdmin(account);
  }
  function mayEditAccessRow(world, account, roleKey) {
    return mayEditAccess(world, account) && roleKey !== ADMIN;
  }

  /* ISSUING A PASSWORD: THE TEST IS THE TARGET (§89). The client's people are
     the office's to help; another admin's password is not, because first-issue
     and reset are the same power and splitting them protects nobody. */
  function mayIssuePasswordTo(world, account, target) {
    if (!mayManageConsultants(world, account)) return false;
    if (!target) return false;
    if (target.email === account.email) return false;   /* change your own, don't issue it */
    return roleOf(target) !== ADMIN;
  }

  /* WHAT A CARD MAY SAY. The list the cards draw and the list the server will
     open are the same list, asked once here — a card nobody can open is the
     control-below-the-fold fault (§90) with a nicer face. */
  function visibleClients(world, account, clients) {
    return (clients || NO_LIST).filter(function (c) {
      return c && c.status !== "retired" && mayOpenClient(world, account, c);
    });
  }

  /* THE SEAT AN OFFICE ACCOUNT HOLDS INSIDE A CLIENT. Written into that
     client's register by the outer platform (research.md §4), read by every
     rule in lib/rules.js exactly as any other seat. */
  function seatIn(world, clientKey) {
    return isSuperOf(world, clientKey) ? "super" : "smoteam";
  }

  return {
    ROLES: ROLES, ROLE_KEYS: ROLE_KEYS, AREAS: AREAS, AREA_KEYS: AREA_KEYS,
    ADMIN: ADMIN, STATE_RANK: STATE_RANK, ACCESS_DEFAULTS: ACCESS_DEFAULTS,
    grantIn: grantIn, atLeast: atLeast, areaFor: areaFor,
    roleOf: roleOf, isAdmin: isAdmin, isActive: isActive, isClientPerson: isClientPerson,
    myClientKeys: myClientKeys, isMine: isMine, isSuperOf: isSuperOf,
    clientGrant: clientGrant, mayOpenClient: mayOpenClient, mayEditClient: mayEditClient,
    configGrant: configGrant, mayReadConfig: mayReadConfig,
    mayConfigureClient: mayConfigureClient,
    mayReadConsultants: mayReadConsultants, mayManageConsultants: mayManageConsultants,
    mayCreateClient: mayCreateClient,
    mayEditAccess: mayEditAccess, mayEditAccessRow: mayEditAccessRow,
    mayIssuePasswordTo: mayIssuePasswordTo,
    visibleClients: visibleClients, seatIn: seatIn
  };
});
