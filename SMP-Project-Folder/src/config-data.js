/* ── CONFIGURATION ────────────────────────────────────────────────────────
   Everything a tenant can configure. The internal name is the contract the
   platform is built on and never changes; the display label is what a tenant
   sees on screen. The SMO manages this, not the client.

   Decisions this file implements:
     · Labels are per TENANT, not per cycle — renaming mid-history would make
       a 2026 report and a 2027 report use different words for one object.
     · Every level of the model is configurable, group and business unit alike.
     · Two entities may never share a display label; the collision is blocked
       at save time rather than discovered in a client demo.
   ──────────────────────────────────────────────────────────────────────── */

var LABELS = {
  scope: "tenant",              /* not per-cycle */
  managedBy: "SMO",
  entries: [
    { key:"theme",       internal:"Theme",              group:"Themes",            bu:"Themes",
      note:"The group's standing columns. Also called pillars or motto elements by clients." },
    { key:"pillar",      internal:"Pillar",             group:"Group capabilities", bu:"Pillars",
      note:"A business unit's direction or capability. Carries key measures and tactics." },
    { key:"keyobj",      internal:"Key Objectives",     group:"Key Objectives",    bu:"Key Objectives",
      note:"A unit's own scorecard. Previously called North Star and Guiding Objectives." },
    { key:"aspiration",  internal:"Winning Aspiration", group:"Vision",            bu:"Winning Aspiration",
      note:"One entity. Vision, End State and Winning Aspiration are display labels for it." },
    { key:"purpose",     internal:"Purpose",            group:"Mission",           bu:"—",
      note:"Held by the top unit only. Business units inherit it." },
    { key:"values",      internal:"Core Values",        group:"Core Values",       bu:"—",
      note:"Group-level only. A unit never declares its own." },
    { key:"measure",     internal:"Key Measure",        group:"Key measures",      bu:"Key measures",
      note:"The measures under a single pillar." },
    { key:"tactic",      internal:"Tactic",             group:"Tactics",           bu:"Tactics",
      note:"The work under a pillar. Spans quarters, has an owner." }
  ]
};

/* ── ROLES, which replaced LEVELS in 3.8 ────────────────────────────
   N-1 / N-2 / N-3 were org DEPTH, invented before anyone knew what the
   platform would need, and the giveaway was already in the code: each level
   carried a `titles` string — "N-1 · Business Unit Head · Group CFO · Group
   COO" — stapling real job titles onto an abstraction to explain what it meant.

   Islam: "the titles should not be relevant in the platform accessibility, the
   activity and visibility should be role based." So the role IS the thing. A
   person's official title (Senior Director, Senior Manager) stays in the
   registry as information ABOUT them and is never consulted for access. Two
   people with the same title can hold different roles, which is correct.

   WHERE A ROLE LIVES depends on what kind of role it is, and this is the whole
   design:

     A role that names a SEAT in the organisation — super user, group CEO,
     company CEO — is a property of the PERSON. Nothing else points at it.

     A role that names RESPONSIBILITY FOR A THING — business unit owner,
     strategy custodian, supporting function head — is a property of the THING.
     Mobile already has a head field and a custodian field; those pointers ARE
     the role, read from the other end.

   So there is one fact, editable from either side, and it cannot disagree with
   itself: setting Mobile's owner on the unit page and setting it in the
   registry are the same write. It also gives multiple roles for free — one
   person can be group CEO and own Care, because those are two records in two
   different places rather than one field fighting itself. */
/* The list itself lives in lib/rules.js — the SAME file api/state.js requires,
   so the roles the screen draws and the roles the server enforces are one
   list, not two (spec 006 §2). */
var ROLES = SMPRules.ROLES;
var ROLE_KEYS = SMPRules.ROLE_KEYS;
function roleName(k){
  var r = ROLES.filter(function(x){ return x.key === k; })[0];
  return r ? r.name : k;
}

/* Every role a person holds, with what each is attached to. Derived, never
   stored: the seat roles come from the person, the responsibility roles from
   whatever points at them. A person who holds nothing gets an empty list and
   therefore no access, which is the honest answer for someone who has been
   added to the registry but not yet given a job. */
/* The world the shared rules answer from — built by the SAME function the
   server uses, from a state-shaped object rather than field by field.

   That is not tidiness. Building it field by field means every rule that
   starts reading a new part of the state needs this list updating too, and
   nothing says so: the client then answers "who may fill this" from a world
   with no sets in it while the server answers from one that has them. It
   happened here twice in one afternoon — once for `sets`, once for `claims` —
   which is twice more than the shared rules file was supposed to allow.
   ONE BUILDER, so there is nowhere for the two to differ. */
function world(){
  return SMPRules.worldOf({
    unitKeys:UNIT_KEYS, units:UNITS, unitRoles:UNIT_ROLES,
    functionKeys:FUNCTION_KEYS, functions:FUNCTIONS,
    companies:COMPANIES, access:ACCESS, group:GROUP
  });
}
function personRoles(p){ return SMPRules.personRoles(world(), p); }
function personRoleKeys(p){ return SMPRules.personRoleKeys(world(), p); }

/* Does the person currently being viewed as hold this role at all? The
   question almost every "can they" check actually wants, and the one place
   that knows a person holds several. */
function hasRole(k){ return personRoleKeys(viewer()).indexOf(k) > -1; }

/* Every page in the platform, and which AREA answers for it (§37). This list
   is the single source: PAGE_AREA is built from it below rather than written
   out beside it, because two lists of the same keys are two lists that will
   disagree. `scope` is what KIND of destination the page belongs to; `area` is
   what decides who may open it.

   "unit" and "fn" as an area mean the answer depends on WHOSE unit — resolved
   per role by areaFor(). "always" means it is not a setting at all. */
var PAGES = SMPRules.PAGES;

/* Foundation and Analysis are static pages that can be put into edit. They
   hold authored content, not reported numbers, so reading is the normal state. */
var EDIT_PAGE = { foundation:false, analysis:false, temple:false };

/* How the objectives box reads. A view preference, not stored on the object —
   it changes nothing about the strategy, only how one box is laid out. */

/* Configuration screens open read-only. Editing is entered deliberately, which
   is what makes a change to a weight or a threshold an act rather than a slip. */
var EDITING = { weights:false, factors:false, bands:false, units:false, people:false, fns:false,
                sets:false };

/* Transient register state. None of this is the tenant's data — it is which
   control happens to be open — so none of it is saved (§25.2: a property of
   the screen never belongs in the state graph).
     ADDROLE      whose "+ role" control is open, by person key
     ADDROLE_KIND which role that control currently shows
     NEWPERSON    what has been typed into the add-a-person row
     PICKING      which assignment picker is open, "<unit>|<role>"
     PICKQ        what has been typed into it */
/* The source-of-figures page: which unit is open, and WHO the marks are being
   made for. All three are properties of the screen, never of the state graph
   (§25.2) — the marks themselves live on the measures. */
/* The fill page's state (§46.5). `unit`, `inw` and `status` are FILTERS now
   rather than a chosen unit — every unit is in the table by default, which is
   the point of a set that crosses them. `q` is the search box; it is stored so
   a repaint (claiming a figure) does not lose what was typed, but typing
   itself never repaints — see renderSourceSetup. */
var SRCSET = { set: null, unit: "", inw: "", status: "", q: "" };
/* What has been typed into the "add a set" row. Screen state, never saved. */
var NEWSET = { name: "", team: "", owner: "", pick: "smo" };

/* ── THE ADD ROW HOLDS THREE FIELDS NOW, AND ONE ANSWER (§87.3) ────
   It was a name and nothing else. `NEWPERSON` is what has been typed into all
   three, and `hit` is the register row the identifier landed on — the stop,
   held here rather than recomputed on every paint, because the person
   answering it may go and look at the row it names and come back. */
var ADDROLE = null, ADDROLE_KIND = "owner";
/* ── WHY THE LAST PICK DID NOT LAND (§110) ────────────────────────────
   `{key, why}`, or null. A property of the screen and never of the person
   (§25.2) — it is the outcome of one press, cleared by the press that
   succeeds, by opening the picker again and by leaving the row. */
var ROLESTOP = null;
/* ── AND WHY A DISMISSAL DID NOT LAND (§180) ──────────────────────────
   `{key, why}`, or null. ROLESTOP's shape and ROLESTOP's reasons: a property
   of the screen and never of the person (§25.2), the outcome of one press,
   cleared by the press that succeeds. A declaration lives outside the state
   graph, so this write does not ride the autosave and has no banner of its
   own to appear in — without this a refused dismissal is silent, which is the
   fault §171 exists to stop. */
var SAIDFAIL = null;
/* ── WHICH PERSON THE DIALOG HAS OPEN, AND WHY (§116) ─────────────────
   `{key, mode, queue, at}` or null. `mode` is "edit", "add" or "queue"; the
   queue carries the LIST IT STARTED WITH and a position in it, rather than
   re-asking attentionQueue() as it goes — fix somebody's declaration and they
   leave the queue, so a queue that recomputed itself would renumber under the
   person working through it and "3 of 7" would count down twice as fast.
   Screen state, never the tenant's (§25.2). */
var PDLG = null;
/* The seat the picker is asking about (§186). STATE, rendered by the person
   dialog's own body — never its own `openModalHtml()`, which the register's
   repaint overwrites the instant anything changes (§116.6: paint() repaints
   the dialog too). ROLESTOP's shape, for ROLESTOP's reason. */
var SEATASK = null;
/* The People render publishes the dialog's builders here (§116) — see the note
   beside the assignment for why they cannot simply be module-level functions. */
var PEOPLEDLG = null;
var NEWPERSON = { name:"", empId:"", email:"", hit:null, hitBy:null, warn:null };
function newPersonReset(){
  NEWPERSON = { name:"", empId:"", email:"", hit:null, hitBy:null, warn:null };
}
/* The same treatment for the BU list's add row, and for the same reason:
   held in a global rather than read off the input at submit time, because
   the repaint any other change causes would otherwise throw away what is
   half typed. */
var NEWMAINBU = "";
/* Which row's action menu is open, by person key (§46.4). ONE key, not a flag
   per row: two menus open at once is a state nobody wants and one that has to
   be closed twice. */
var PMENU = null;
/* THE SAME STATE, FOR THE FUNCTIONS TABLE (§93.14). A single key rather than a
   flag per row, for the reason §46.4 gives: two menus open at once is a state
   nobody wants and one that has to be closed twice. Separate from PMENU because
   the two tables are never on screen together and sharing one would make
   "which table" a third thing to check. */
var FNMENU = null;
/* THE SAME STATE AGAIN, FOR THE BUSINESS UNITS TABLE (§272). Its own key for
   the reason FNMENU has its own: the three tables are never on screen together,
   and one shared key would make "which table" a third thing every reader of it
   has to check. */
var UMENU = null;
/* AND FOR COMPANIES (§272). */
var COMENU = null;

/* ── WHICH SETUP TABLE IS BEING ARRANGED (§272) ─────────────────────
   Islam: *"allow me in the setup to rearrange the business units table so they
   appear in the navigation as per this order."*

   NOT `ARRANGE`, which is the group Performance page's boolean and is scoped to
   that page — §65.9's lesson about a one-word name in a shared namespace, in
   JavaScript rather than in CSS. This holds the TABLE's id (`"units"`,
   `"fns"`), so a page cannot be arranging while another page's band is drawn,
   and one press cannot turn two tables into handles at once.

   SCREEN STATE, NEVER SAVED (§25.2): what is saved is the ORDER, which is the
   list itself and was already stored. */
var SETARRANGE = null;

/* ── WHICH ROW IS OPEN IN THE SETUP DIALOG (§272) ───────────────────
   `{ table, key }`, the register's `PDLG` one table wider. Editing left the row
   for the same reason it left the register (§116): every collision these tables
   have had was a control clicked inside a 150px cell, and none of them survives
   the move. `ROWEDIT` still holds the row and still carries the snapshot Cancel
   restores — what changed is only where the fields are DRAWN. */
var ROWDLG = null;
/* Which person the delete confirmation is open for (§69). Its own key rather
   than a mode on PMENU: the confirmation REPLACES the menu in the same place,
   so the second press lands where the first one did — the same shape the
   clear-plan confirmation already uses (§46.2). */
var PDEL = null;
/* ── ISSUING A PASSWORD, WITHOUT A NATIVE DIALOG (§69.22) ───────────
   `prompt()` was the control, and Islam hit the one failure it has that
   nothing can report: a browser is allowed to SUPPRESS it — Chrome offers
   "prevent this page from creating additional dialogs" after a few — and a
   suppressed prompt returns null, which the handler read as "cancelled" and
   did nothing about. Silently. "I can't set the temp password", with no error
   anywhere, on a code path that works perfectly when driven.

   It was the wrong control for three more reasons that were true all along: a
   password manager cannot see into it, the rules could not be shown until
   after they had been broken, and there was nowhere to put the password
   afterwards — the SMO has to read it out to somebody.

   `pw` is held here rather than read off the input at submit, for §35's
   reason: a repaint caused by anything else must not throw away what is half
   typed. Screen state, never saved (§25.2). */
var PSETPW = { key:null, pw:"", err:"", done:null };
/* Which person's extra roles are unfolded, and which header menu is open.
   Single keys for the same reason PMENU is: two open at once is a state that
   has to be closed twice. */
var PROLES = null;
/* The cycle being described, before it is opened (§47.8). Null when the panel
   is closed. It is NOT the live REVIEW: nothing is replaced until the SMO
   presses Open, or a half-filled form would already have closed the cycle it
   was going to succeed. */
var NEWCYCLE = null;
/* The OPEN cycle being edited (§273). Null when the pen is shut. A draft for
   the same reason NEWCYCLE is one -- nothing reaches REVIEW until Save, so
   Cancel writes nothing -- and it is a SECOND variable rather than a reused
   one because the two panels answer different questions and could otherwise
   only be told apart by which state the cycle happens to be in. */
var CYCLEEDIT = null;
var PCOLMENU = false, PWMENU = false, PFILEMENU = false;
var FNCOLMENU = false;   /* the Functions table's own (§93.14) */
/* Send a message's two header dropdowns (§95). One at a time, like every
   other header menu: two open panels on one row cover each other. */
var PICKING = null, PICKQ = "";

/* ── ACCESS, by ROLE and by AREA ────────────────────────────────────
   Rebuilt again in 3.10, at Islam's direction: *"we just need the roles on the
   left and the types of pages they might see/edit on the horizontal access."*

   The old matrix had a column per role and a ROW PER PAGE — 25 pages × 7 roles,
   drawn as three buttons a cell, so 525 controls on one screen. Nobody reads a
   grid that size; they look up one role, or one page. It answered a question
   nobody asks, at a size nobody can hold.

   Seven AREAS replace the 25 pages. Two of them are the same pages seen from
   different distances — your own unit and everybody else's — which is the
   second half of Islam's design: *"a business unit head and custodian of Mobile
   owns Mobile. A CEO of Retail owns all the units below him. I see this as a
   logic thing not a settings thing."*

   So OWN IS NEVER TYPED IN. It is read from what the role is attached to, by
   roleOwns() below — the same attachment §33 already stores on the thing. A
   Company CEO owns their company's units; the SMO and the Group CEO own
   everything; a function head owns their function and no unit at all.

   Three states, never more (§19). Edit includes view, so they are a ladder
   rather than three independent flags.

   WHAT IS DELIBERATELY NOT HERE, because it is a rule and not a setting:
     · the Knowledge base, which is view for everyone, always. A column whose
       every cell holds the same answer is a question with no second answer —
       and an explanation nobody can open is not an explanation (§30).
     · correcting a PLAN, which is the SMO's alone (§22, §31), whatever this
       matrix says about the unit the plan belongs to.
     · marking a measure as FOCUS, which is the CEO's and the SMO's — it is
       what carries reward, and that is a decision the office makes, not a page
       permission.
   Each of those used to be a cell here. Each is a sentence now. */
var AREAS = SMPRules.AREAS;
var AREA_KEYS = SMPRules.AREA_KEYS;
function areaName(k){
  var a = AREAS.filter(function(x){ return x.key === k; })[0];
  return a ? a.label : k;
}
var PAGE_AREA = SMPRules.PAGE_AREA;

/* The tenant's own map starts as the shipped default and is replaced by
   whatever the database holds. The DEFAULT itself is in lib/rules.js, because
   an absent key falls back to it on both sides (§30.2). */
var ACCESS = JSON.parse(JSON.stringify(SMPRules.ACCESS_DEFAULTS));

/* Who is signed in. Changing this re-renders the whole shell against the
   matrix above, so the grid can be judged by using it rather than reading it. */
var PEOPLE = [
  /* A PERSON, NOT AN OFFICE (Islam, 2026-08-22: "there is no one named Strategy
     Management Office"). It read as a department because it was written before
     the register existed, when `smo` was a level rather than somebody's seat.
     A register whose first row is an office teaches everyone reading it that
     these rows are job boxes; they are people, and one of them holds the SMO
     seat. The KEY is untouched — it is the username, the clean slate keeps the
     row by it, and every seed and session in existence points at it. */
  { key:"smo",     name:"Mohamed Essam", role:"super", unit:"group",  title:"Head of the Strategy Management Office" },
  { key:"ceo",     name:"Group CEO",                  role:"gceo",  unit:"group",  title:"Chief Executive" },
  { key:"mobhead", name:"Ashraf Laithy",              unit:"mobile", title:"Head of Mobile" },
  { key:"loghead", name:"Hazem Roushdy",              unit:"logistics", title:"Head of Logistics" },
  { key:"rethead", name:"Hossam Farid",               unit:"retailstores", title:"Head of Retail Stores" },
  { key:"cfo",     name:"Group CFO",                  unit:"group",  title:"Chief Financial Officer" },
  { key:"b2bhead", name:"Nour Selim",      unit:"b2becomm",            title:"Head of B2B Ecomm" },
  { key:"cehead",  name:"Tarek Nassar",    unit:"consumerelectronics", title:"Head of Consumer Electronics" },
  { key:"oshead",  name:"Sherif Adel",     unit:"onlineshop",          title:"Head of Online Shop" },
  { key:"cohead",  name:"Amr Bakr",        unit:"corporate",           title:"Head of Corporate" },
  { key:"cahead",  name:"Mostafa Deif",    unit:"care",                title:"Head of Care" },
  { key:"ithead",  name:"Yasser Kamal",    unit:"it",                  title:"Head of IT" },
  { key:"nghead",  name:"Chidi Okafor",    unit:"nigeria",             title:"Head of Nigeria" },
  { key:"own_mob", name:"Mennah Farouk",   unit:"mobile",              title:"Strategy custodian, Mobile" },
  { key:"own_ret", name:"Dalia Sabry",     unit:"retailstores",        title:"Strategy custodian, Retail Stores" },
  { key:"own_b2b", name:"Kareem Hafez",    unit:"b2becomm",            title:"Strategy custodian, B2B Ecomm" },
  { key:"own_ce",  name:"Heba Salem",      unit:"consumerelectronics", title:"Strategy custodian, Consumer Electronics" },
  { key:"own_os",  name:"Nadia Fouad",     unit:"onlineshop",          title:"Strategy custodian, Online Shop" },
  { key:"own_co",  name:"Laila Zaki",      unit:"corporate",           title:"Strategy custodian, Corporate" },
  { key:"own_ca",  name:"Rania Fahmy",     unit:"care",                title:"Strategy custodian, Care" },
  { key:"own_it",  name:"Dina Shawky",     unit:"it",                  title:"Strategy custodian, IT" },
  { key:"own_lg",  name:"Mai Sobhy",       unit:"logistics",           title:"Strategy custodian, Logistics" },
  { key:"own_ng",  name:"Amaka Eze",       unit:"nigeria",             title:"Strategy custodian, Nigeria" },
  /* Merchandising's own two (spec 010 §5). It is a FUNCTION, so its people
     attach to it by `fn` — and being its head and its custodian is the whole
     of what lets them run it. Retail reads their numbers and does not type
     them: a pillar's score is Merchandising's answer, and a unit that could
     type it would be reporting its own mark. */
  { key:"mrchead", name:"Sara Helmy",     fn:"merchandising",         title:"Head of Merchandising" },
  { key:"own_mrc", name:"Tamer Fouad",    fn:"merchandising",         title:"Strategy custodian, Merchandising" },
  { key:"fn_fin",  name:"Hossam Abuelenien", unit:null, fn:"finance",   title:"Head of Finance" },
  { key:"fn_hr",   name:"Noran Adel",        unit:null, fn:"hr",        title:"Head of HR" },
  { key:"fn_tre",  name:"Fayad Sobhy",       unit:null, fn:"treasury",  title:"Head of Treasury" },
  { key:"fn_mkt",  name:"Yara Kamal",        unit:null, fn:"marketing", title:"Head of Marketing" },
  { key:"fn_mkt2", name:"Tarek Nour",        unit:null, fn:"marketing", title:"Strategy custodian, Marketing" },
  { key:"dir",     name:"Ramy Behairy",               unit:"mobile", title:"Director, Digital Operations" },
  /* Company CEOs. Attached to a COMPANY rather than a unit — a new kind of
     attachment: the Company CEO role, bounded to their company (§15.13, §33). */
  { key:"co_dist", name:"Company CEO, Distribution", role:"cceo", unit:null, company:"distribution",
    title:"CEO, Distribution" },
  { key:"co_b2c",  name:"Company CEO, B2C",          role:"cceo", unit:null, company:"b2c",
    title:"CEO, B2C" }
];

/* Each unit names two people. The HEAD is accountable for the unit; the OWNER
   holds the same access and does the actual work — entering results, adjusting
   the plan, reporting. Separating them stops "who can edit this" and "whose
   number is this" from being the same question, which they are not. */
/* head = the unit's owner by default; the head IS the owner, so nothing else
   should claim that word. The second role holds the strategy on the head's
   behalf: keeps the plan current, makes the entries, reports, and often
   presents. Custodian says exactly that \u2014 keeps it, does not own it.

   "Owner" survives on pillars and tactics, where it means responsibility for a
   piece of work rather than access to a unit. */
var UNIT_ROLES = {
  mobile:              { head:"mobhead", custodian:"own_mob" },
  retailstores:        { head:"rethead", custodian:"own_ret" },
  b2becomm:            { head:"b2bhead", custodian:"own_b2b" },
  consumerelectronics: { head:"cehead",  custodian:"own_ce"  },
  onlineshop:          { head:"oshead",  custodian:"own_os"  },
  corporate:           { head:"cohead",  custodian:"own_co"  },
  care:                { head:"cahead",  custodian:"own_ca"  },
  it:                  { head:"ithead",  custodian:"own_it"  },
  logistics:           { head:"loghead", custodian:"own_lg"  },
  nigeria:             { head:"nghead",  custodian:"own_ng"  }
};

/* ── TWO NAMES, WHEREVER A PERSON IS NAMED (Islam, §81.4) ─────────────
   "for any placement of the name of people like in the custodian of the unit or
   the function use the first 2 names only."

   Raya's register carries names of five and six words — *Abd El Hamid Mokhtar
   Abd El Hamid Ahmed Abd El Wahab* is eight — and every one of them was being
   printed whole into a table cell, a pill or a chip built for a name.

   IT IS CHANGED HERE, IN THE ONE FUNCTION, and that is the point: all fifteen
   call sites are display sites — a cell, a chip, a pill, a confirmation — and
   none of them stores or exports what it gets. A `personShort()` beside a
   `personName()` would have been fifteen edits and a coin toss on the
   sixteenth.

   THE REGISTER IS NOT ONE OF THEM. It has its own rule (§81.1): three names,
   or as many as it takes to tell two people apart, because that column exists
   to identify somebody and these fifteen exist to remind you who they are.
   `personFullName()` is here for anything that ever needs the whole thing. */
/* ── "ABD EL" IS NOT TWO NAMES, IT IS HALF OF ONE (§81.6) ─────────────
   Counting words gave the Mobile custodian's cell the word **"Abd El"**, which
   names nobody: half of Raya's register begins that way. A particle binds to
   the name after it — *Abd El Hamid* is one given name in three tokens, *Abou
   El Ela* and *Abd El Moniem* likewise — so a NAME is a real word together with
   whatever particles run in front of it.

   This is not a wider reading of what Islam asked for; it is the only reading
   under which "the first 2 names" means two names. It is applied to the
   register's own three-name rule (§81.1) as well, which had the same fault more
   quietly: *Abd El Hamid* was one name spending the whole budget.

   The list is the particles this register actually contains, plus the European
   ones a client could arrive with. A word not on it is a name. */
/* MOVED TO `lib/rules.js` (§130.7), and these are the browser's handles on it.
   The plan stores what the register's Name column shows now, so the SERVER has
   to be able to recognise it too — and a name rule written twice is the drift
   that file exists to prevent (§42). Wrappers rather than renamed call sites:
   five places here ask for a run of somebody's names, and none of them cares
   where the answer is computed. */
var NAME_PARTICLES = SMPRules.NAME_PARTICLES;
function nameWords(name, n){ return SMPRules.nameWords(name, n); }

var NAMED_ELSEWHERE_WORDS = 2;
function personFullName(key){
  var p = PEOPLE.filter(function(x){ return x.key === key; })[0];
  return p ? p.name : null;
}
function personName(key){
  var n = personFullName(key);
  if (!n) return n;
  return nameWords(n, NAMED_ELSEWHERE_WORDS);
}

/* ══════════════════════════════════════════════════════════════════
   BRANDING (§39) — the tenant's own colours, derived from two of them

   A brand is not seven colours. Asking somebody to supply an accent, a darker
   accent for text, an ink to sit on the accent, a glow, a bar, a quiet ink for
   the bar and a hover is asking them to do the work the platform should do.
   So the page takes TWO — the accent and the dark bar — and derives the rest,
   which is also the only way §38.4 can be guaranteed rather than remembered:
   a brand colour that is unreadable as text is DARKENED UNTIL IT IS READABLE
   instead of being accepted and discovered later.

   Stored on GROUP, so it rides in the org row's `extra` jsonb and needs no
   schema change — and so it is TENANT data, autosaved and the same for
   everyone, which is exactly what a brand is and exactly what a theme is not
   (§25.2). A person may still override it on their own screen; the top-bar
   switches write localStorage and localStorage wins.
   ══════════════════════════════════════════════════════════════════ */

function hexRgb(h){
  h = String(h || "").replace("#", "").trim();
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}
function rgbHex(c){
  return "#" + c.map(function(v){
    var n = Math.max(0, Math.min(255, Math.round(v))).toString(16);
    return n.length === 1 ? "0"+n : n;
  }).join("").toUpperCase();
}
function relLum(c){
  var s = c.map(function(v){ v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); });
  return 0.2126*s[0] + 0.7152*s[1] + 0.0722*s[2];
}
/* The WCAG ratio, the same number the contrast sweep measures. */
function contrastOf(a, b){
  var l1 = relLum(a), l2 = relLum(b);
  return (Math.max(l1,l2) + 0.05) / (Math.min(l1,l2) + 0.05);
}
function mixRgb(a, b, t){
  return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
}
/* Black or white, whichever can actually be read on this colour. This is the
   fix for "white on the house gold is 2.4:1" made automatic. */
function inkFor(bg){
  var w = [255,255,255], k = [12,17,26];
  return contrastOf(bg, w) >= contrastOf(bg, k) ? w : k;
}
/* Walk a colour toward black (or toward white, on a dark ground) until it
   clears the ratio a word needs. Returns the colour unchanged if it already
   does — a brand's own accent is used as given wherever it is legible. */
function readableOn(fg, bg, need){
  need = need || 4.5;
  var target = relLum(bg) > 0.5 ? [0,0,0] : [255,255,255];
  for (var t = 0; t <= 1.001; t += 0.04) {
    var c = mixRgb(fg, target, t);
    if (contrastOf(c, bg) >= need) return c;
  }
  return target;
}

/* ── A unit's own mark (§52.9) ───────────────────────────────────────
   Islam: the client's units have their own lockups, and the SMO uploads
   them one at a time.

   PNG, and only PNG — Islam's decision after the trade was put to him.
   AN UPLOADED SVG IS EXECUTABLE CONTENT: it can carry a <script>, and
   this page already runs with 'unsafe-inline' (§43.6), so one uploaded
   file could read every session in the tenant. A PNG cannot do that.
   The price is paid knowingly: raster does not scale as sweetly, which
   is why the cap is generous enough for a projector.

   Stored as a data URI on the unit. No migration and no schema change:
   `units` carries an `extra` JSONB and lib/state-io.js puts every key it
   does not recognise there and reads it straight back.

   READING NEVER CREATES (§50.6, §52). This returns "" for a unit with no
   mark and never writes the field — an accessor that mints what it was
   looking for makes every save carry a change the database never held,
   and every non-SMO save is refused for ever after. */
/* A refusal has to say so ON THE PAGE, not in a console nobody has open
   (§42). Screen state, so it is never saved and never leaves this browser. */
var LOGO_NOTE = "";
var LOGO_MAX_EDGE = 900;    /* the deck's cover mark on a 4K projector */
var LOGO_MAX_BYTES = 220000; /* the data URI, carried in every save */

function unitLogo(u){ return (u && u.logo) || ""; }

/* ── THE GROUP HAS A MARK OF ITS OWN (§259) ───────────────────────────
   Islam: *"where can I upload the raya trade mark so it can be used?"*
   Nowhere, until now. §52.9 gave every UNIT a mark and stopped there, so
   a unit that has none showed its name and a supporting function showed
   nothing at all — and Raya Trade, which is the group, had no home.

   ONE UPLOAD, ON BRANDING. It sits with the accent and the bar rather
   than on Business units, because it is not a unit's fact: it is what
   the organisation looks like, which is the question that page answers.

   THE SAME RULES AS A UNIT'S, through the same `logoIntake()` — PNG
   only, transparent, capped — because a second intake would be a second
   answer to "what may be uploaded" (§53.5).

   `org` carries an `extra` JSONB and lib/state-io.js files every key it
   does not recognise there, so this needs NO migration, exactly as a
   unit's mark needed none. And it READS WITHOUT WRITING (§50.6): "" for
   a group that has set none, never the key. */
function groupLogo(){ return (GROUP && GROUP.logo) || ""; }

/* WHICH MARK A SUBJECT'S DECK WEARS, asked in one place. A unit's own
   if it has one, the group's otherwise — so a tenant that uploads one
   mark has a marked deck everywhere, and a supporting function, which
   can never have a mark of its own, has one for the first time. */
function deckMark(u){ return unitLogo(u) || groupLogo(); }

function logoIntake(file){
  return new Promise(function(resolve, reject){
    if (!file || file.type !== "image/png") {
      reject(new Error("a mark must be a PNG")); return;
    }
    imgToCanvas(file, LOGO_MAX_EDGE, null).then(function(cv){
      /* No ground, so whatever was transparent stays transparent — a mark
         with a white box behind it is unusable on a dark slide, which is
         exactly why the supplied JPEGs could not be used. */
      var png = cv.toDataURL("image/png");
      if (png.length > LOGO_MAX_BYTES) {
        reject(new Error("that mark is " + Math.round(png.length / 1024) +
          "KB after shrinking, and the limit is " +
          Math.round(LOGO_MAX_BYTES / 1024) + "KB. A flat logo should be well under it — " +
          "a photograph or a screenshot will not be."));
        return;
      }
      resolve(png);
    }, reject);
  });
}

/* The tenant's branding. `null` anywhere means "use the shipped palette",
   which is why an untouched tenant carries no branding at all rather than a
   copy of the defaults — a stored copy would silently stop tracking the
   shipped palette the moment it improved. */
var BRAND_DEFAULT = { palette:null, font:null, accent:null, bar:null };
function branding(){
  if (!GROUP.branding) GROUP.branding = {};
  var b = GROUP.branding;
  Object.keys(BRAND_DEFAULT).forEach(function(k){
    if (!(k in b)) b[k] = BRAND_DEFAULT[k];
  });
  return b;
}

/* ══ COMMUNICATION (§72) ═══════════════════════════════════════════
   What the tenant sets about the mail the platform sends: the display name it
   arrives under, where a reply goes, the kicker over the header and the small
   print at the bottom. The ADDRESS is not here — it is tied to the domain
   verified with Resend, so it lives in the deployment's environment
   (`SMP_MAIL_FROM`) where changing it is a deployment decision.

   A READER MUST NEVER CREATE THE FIELD IT WAS LOOKING FOR (§42, §50.6): the
   `branding()` shape above is the one that taught this, by inventing a
   four-null object the database never held and so putting a phantom group
   change in every save. `comms()` hands back a shared FROZEN empty, the
   writing half is its own function, and clearing the last field deletes the
   key again — so a tenant that has set nothing writes nothing. */
var COMMS_EMPTY = Object.freeze({});
/* `headerName` is what the message's HEADER says, and it is not the same
   question as what the tenant is called (Islam, 2026-08-24: "this header
   should be in the edits as well"). It defaults to the organisation's name and
   is separate from it, because renaming the tenant to change what an email says
   would rename it on every screen in the platform. */
var COMMS_FIELDS = ["headerName", "fromName", "replyTo", "eyebrow", "footer"];
function comms(){
  var c = GROUP.comms;
  return (c && typeof c === "object") ? c : COMMS_EMPTY;
}
function commsWritable(){
  if (!GROUP.comms || typeof GROUP.comms !== "object") GROUP.comms = {};
  return GROUP.comms;
}
function commsSet(key, value){
  if (COMMS_FIELDS.indexOf(key) < 0) return;
  var v = String(value == null ? "" : value).trim();
  var c = commsWritable();
  if (v) c[key] = v; else delete c[key];
  if (!Object.keys(c).length) delete GROUP.comms;
}

/* ── THE OFFICE'S CHAT SETTINGS (§98) ─────────────────────────────────────
   Islam: "I will need in the setup page to enable or disable the chat with
   some settings maybe."

   READ THROUGH THE SHARED RULE, never here: `SMPRules.chatCfg` is what the
   server also asks, so what an absent key means is decided once (§42). This
   half only WRITES.

   AND IT NEVER CREATES THE CONTAINER IT WAS LOOKING FOR. §50.6: `branding()`
   invented a four-null object the database never held, so every save carried a
   phantom group change and every non-SMO save would have been refused for
   ever. So a value set back to its default DELETES its key, and the last key
   leaving deletes `GROUP.chat` — a tenant that has never opened the menu, or
   has put everything back, writes nothing at all. */
/* ── The knowledge base's pen (§140) ─────────────────────────────────
   GROUP.kb rides org.extra like GROUP.chat above: { ov: { id: {q,a} },
   add: [ {id,g,q,a} ] }. THE WRITERS DELETE ON DEFAULT (§50.6): an answer
   put back to the shipped wording deletes its key, the last key leaving
   deletes GROUP.kb, so a tenant that has never touched the pen and one that
   touched it and thought better are byte-identical. What the overrides MEAN
   is `SMPRules.kbLook` / `kbAdds` — one precedence rule for the page and
   the assistant both (§103). */
/* THE AUDIENCE IS RESOLVED HERE, NOT READ RAW (§161). An item's `who` may
   be its own or inherited from its group — `recipesFlat()` resolves it and
   this walk did not, so comparing an incoming audience against `item.who`
   would have read `undefined` for every question in the Strategy Office
   group and stored a phantom override on all five. Returns a COPY, so the
   resolution cannot be written back onto the shipped array. */
function kbShipped(id){
  for (var i = 0; i < RECIPES.length; i++){
    var g = RECIPES[i];
    for (var j = 0; j < g.items.length; j++){
      var it = g.items[j];
      if (it.id === id) {
        return { id: it.id, q: it.q, a: it.a, g: g.g,
                 who: SMPRules.kbAudienceWord(it.who || g.who) };
      }
    }
  }
  return null;
}
function kbWritable(){
  if (!GROUP.kb || typeof GROUP.kb !== "object") GROUP.kb = {};
  return GROUP.kb;
}
function kbPrune(){
  var k = GROUP.kb;
  if (!k) return;
  if (k.ov && !Object.keys(k.ov).length) delete k.ov;
  if (k.add && !k.add.length) delete k.add;
  if (!Object.keys(k).length) delete GROUP.kb;
}
/* THE AUDIENCE IS THE THIRD THING AN OVERRIDE CAN CARRY (§161), so it is
   passed and compared exactly like the wording: back to the shipped value
   and the whole override dies with it. `w` is undefined at every existing
   call site, which reads as "leave the audience alone" rather than as
   "set it to nothing" — the distinction matters, because the pen writes
   q and a together and the file writes all three. */
function kbSetOver(id, q, a, w){
  var std = kbShipped(id);
  if (!std) return;
  q = String(q == null ? "" : q).trim();
  a = String(a == null ? "" : a).trim();
  var k = kbWritable();
  var had = (k.ov && k.ov[id]) || null;
  var aud = w === undefined ? (had && had.w) : SMPRules.kbAudienceWord(w);
  var stdAud = SMPRules.kbAudienceWord(std.who);
  if (aud === stdAud) aud = null;
  /* COMPARED CANONICALLY, NEVER AS TWO STRINGS (§145's lesson, §54.5's
     fixed point). The shipped answers separate paragraphs with `|`; the pen
     and the questions file use a blank line, because neither is a place
     anybody would type a pipe. The same prose therefore arrives spelt two
     ways, and a raw `===` would call an untouched download-edit-upload round
     trip a change on all 64 rows — the platform refusing its own export.
     Both sides go through the one paragraph reader before they meet. */
  if (SMPRules.kbSame(q, std.q)) q = "";
  if (SMPRules.kbSame(a, std.a)) a = "";
  /* Emptied or typed back to the shipped words, the override dies — an
     override that stores the standard wording is a phantom change in every
     save (§42, §50.6). The audience joins that test: an entry holding only
     an audience equal to the shipped one is the same phantom. */
  if ((!q || q === std.q) && (!a || a === std.a) && !aud) {
    if (k.ov) delete k.ov[id];
  } else {
    if (!k.ov) k.ov = {};
    var e = { q: q || std.q, a: a || std.a };
    if (aud) e.w = aud;
    k.ov[id] = e;
  }
  kbPrune();
}
function kbResetOver(id){
  if (GROUP.kb && GROUP.kb.ov) delete GROUP.kb.ov[id];
  kbPrune();
}
function kbAddNew(g){
  var k = kbWritable();
  if (!k.add) k.add = [];
  /* Minted outside the shipped namespace: recipe ids are words, these are
     kbx1… — §87's rule about names and identifiers, kept trivially. */
  var n = 1;
  while (k.add.some(function(x){ return x.id === "kbx" + n; })) n++;
  k.add.push({ id: "kbx" + n, g: g, q: "", a: "" });
  return "kbx" + n;
}
function kbSetAdded(id, q, a, w){
  var k = GROUP.kb;
  if (!k || !k.add) return;
  var e = k.add.filter(function(x){ return x.id === id; })[0];
  if (!e) return;
  e.q = String(q == null ? "" : q).trim();
  e.a = String(a == null ? "" : a).trim();
  /* `everyone` is the default, so it is stored as an ABSENCE (§50.6) — a
     tenant who never touches the audience is byte-identical to one who set
     it to Both and back. */
  if (w !== undefined) {
    var aud = SMPRules.kbAudienceWord(w);
    if (aud === "everyone") delete e.w; else e.w = aud;
  }
}
function kbDropAdded(id){
  var k = GROUP.kb;
  if (!k || !k.add) return;
  k.add = k.add.filter(function(x){ return x.id !== id; });
  kbPrune();
}

function chatCfg(){ return SMPRules.chatCfg(GROUP.chat); }
function chatWritable(){
  if (!GROUP.chat || typeof GROUP.chat !== "object") GROUP.chat = {};
  return GROUP.chat;
}
function chatSet(key, value){
  if (!Object.prototype.hasOwnProperty.call(SMPRules.CHAT_DEFAULTS, key)) return;
  var dflt = SMPRules.CHAT_DEFAULTS[key];
  /* THE TYPE COMES FROM THE DEFAULT, not from a list of key names. This read
     `key === "promise" ? string : boolean`, so the moment a second string
     setting existed (`rep`, §104) it would have stored `true` for whoever was
     chosen — silently, and in a way the picker would then show as nobody. A
     list of exceptions is a list somebody has to remember to add to. */
  var isText = typeof dflt === "string";
  /* AND A NUMBER IS A THIRD TYPE, taken from the default like the other two
     (§104.7, §169) — `!!value` on a number setting would have stored `true`
     for every minute anybody typed. The clamp is the shared rule's, asked
     once so the box, the server and this writer cannot disagree. */
  var isNum = typeof dflt === "number";
  var v;
  if (isText) v = String(value == null ? "" : value).trim();
  else if (isNum) {
    /* CLAMPED BY THE SHARED RULE AND NOT BY A NUMBER WRITTEN HERE, and asked
       through a one-key object so this stays true of the NEXT number setting
       without anybody remembering to come back — naming `away` would have
       been the list of exceptions §104.7 exists to avoid. */
    var one = {}; one[key] = value;
    v = SMPRules.chatCfg(one)[key];
  } else v = !!value;
  var c = chatWritable();
  /* The promise is stored only when it differs from the shipped sentence, so
     improving that sentence later reaches every tenant that never wrote one. */
  var isDefault = (key === "promise")
    ? (!v || v === SMPRules.CHAT_PROMISE)
    : (v === dflt);
  if (isDefault) delete c[key]; else c[key] = v;
  if (!Object.keys(c).length) delete GROUP.chat;
}

/* WHAT AN EMAIL ACTUALLY CARRIES, resolved once. The preview on the setup
   page, the test send and every message the platform will send later all read
   THIS — a preview drawn from anywhere else is a picture of an email nobody
   receives. Defaults are computed here rather than stored, for the same reason
   BRAND_DEFAULT is not written into the graph: a stored copy stops tracking
   the shipped one the moment it improves. */
function commsShape(){
  var c = comms(), b = branding();
  return {
    org:      c.headerName || GROUP.org || "",
    fromName: c.fromName || GROUP.org || "Strategy Management Platform",
    replyTo:  c.replyTo || "",
    eyebrow:  c.eyebrow || "Strategy Management Platform",
    footer:   c.footer || COMMS_FOOTER_DEFAULT(),
    accent:   b.accent || "",
    panel:    b.bar || "",
    /* ── WHERE THE PLATFORM IS, ANSWERED ONCE (spec 027) ──────────────
       It was `origin + "/"` here and `origin + location.pathname` in chat.js,
       so the two emails this product sends disagreed about what "Open the
       platform" means: one landed on the sign-in gate, the other on the
       platform itself. §53.5 with an inbox on the end of it. The PATHNAME is
       the right of the two — the platform is served at /raya-trade (§35.6) and
       the root is the gate — and chat.js asks this now rather than keeping its
       own copy.

       EMPTY WHERE THERE IS NO ADDRESS TO GIVE. Opened from a file `origin` is
       the string "null", and a link built on that is worse than no link:
       every caller draws no button rather than a dead one. */
    href:     (typeof location !== "undefined" && location.origin && location.origin !== "null")
                ? location.origin + location.pathname : ""
  };
}
function COMMS_FOOTER_DEFAULT(){
  return "Sent from the Strategy Management Platform" +
         (GROUP.org ? " for " + GROUP.org : "") +
         ". If you were not expecting this, tell your SMO.";
}

/* Every token the two inputs decide, worked out here so the page, the live
   preview and the applied result cannot disagree — one function, three
   readers. Returns {} when the tenant has set nothing. */
function brandTokens(){
  var b = branding(), out = {}, rgb;
  if (b.accent && (rgb = hexRgb(b.accent))) {
    var onLight = [255,255,255];
    out["--gold"] = rgbHex(rgb);
    /* TEXT weight: the accent as a word, on the page's own surface. */
    out["--gold-deep"] = rgbHex(readableOn(rgb, onLight, 4.5));
    /* And the ink that sits ON the accent when it is a fill. */
    out["--on-accent"] = rgbHex(inkFor(rgb));
    out["--accent-glow"] = "rgba(" + rgb.map(Math.round).join(",") + ",.22)";
  }
  if (b.bar && (rgb = hexRgb(b.bar))) {
    out["--panel"] = rgbHex(rgb);
    var ink = inkFor(rgb);
    out["--panel-ink"] = rgbHex(ink);
    /* The bar's own quiet ink and hover — never the page's --ink-3 and
       --surface-2, which is the mistake §38.4 caught. Quiet is the bar mixed
       most of the way to its own ink, so it stays legible ON the bar whatever
       colour the bar is; hover is a step away from the bar toward that ink. */
    out["--panel-quiet"] = rgbHex(mixRgb(rgb, ink, 0.55));
    out["--panel-hover"] = rgbHex(mixRgb(rgb, ink, 0.12));
  }
  return out;
}

/* What the page shows beside each input, and what refuses a save. Reported
   rather than silently corrected: somebody typing their own brand colour is
   entitled to know it needed darkening, and by how much. */
function brandChecks(){
  var b = branding(), t = brandTokens(), out = [];
  var white = [255,255,255];
  if (b.accent && hexRgb(b.accent)) {
    var a = hexRgb(b.accent);
    out.push({ what:"Accent as a fill, with its ink on top",
               ratio:+contrastOf(a, hexRgb(t["--on-accent"])).toFixed(2), need:4.5 });
    out.push({ what:"Accent as text on the page",
               ratio:+contrastOf(hexRgb(t["--gold-deep"]), white).toFixed(2), need:4.5,
               note: t["--gold-deep"].toUpperCase() !== rgbHex(a) ? "darkened to " + t["--gold-deep"] : null });
  }
  if (b.bar && hexRgb(b.bar)) {
    var p = hexRgb(b.bar);
    out.push({ what:"Navigation bar, with its own ink",
               ratio:+contrastOf(p, hexRgb(t["--panel-ink"])).toFixed(2), need:4.5 });
    out.push({ what:"Navigation bar, its quiet ink",
               ratio:+contrastOf(p, hexRgb(t["--panel-quiet"])).toFixed(2), need:4.5 });
  }
  return out;
}

/* ── The register (§16.11, §35) ──────────────────────────────────────
   People are RETIRED, never deleted. A person carries reported history the
   same way a unit does (§30.3): snapshots attribute figures to whoever
   entered them, and removing the row would rewrite a closed cycle into one
   nobody reported. Retired means cannot sign in, cannot hold a role, still
   named wherever they already are.

   `active` and `phone` are not columns — they ride in the people table's
   `extra` jsonb and come back through it. Deliberate: neither has any
   relational meaning, and adding a real column to a table that already exists
   needs a pre-phase migration (§33.5) for nothing gained. */
function personActive(p){ return SMPRules.personActive(p); }
/* The first few words of a name, for a column that has to be narrow (§69.21).
   NEVER stored and never written back — `p.name` keeps whatever the file
   brought, and this is only what the register's frozen first column shows.

   THREE, at Islam's direction (2026-08-24). Two lost the surname on the
   Arabic naming pattern this register is full of: "Mohamed Hamed Ahmed Hamed
   Ahmed" is given name, father, grandfather — so two words name a person and
   their father and nobody's family, which is a worse answer than the long one.
   The count is a NAMED CONSTANT rather than a literal in the slice, because
   the next time it moves it will move for a reason and the reason belongs
   beside the number.

   `split(/\s+/)` on a trimmed string, so a double space between names does not
   produce an empty word and a name of one word is returned whole. A name
   already at or under the limit comes back unchanged, which is why there is no
   "should we shorten this" test at the call site. */
/* ══ ONE ROW OPEN, AND WHAT IT LOOKED LIKE BEFORE (§79.2) ══════════════
   `ROWEDIT` is the key of the single row being edited, or null. `ROWWAS` is a
   copy of that row taken WHEN IT OPENED — Cancel restores from it, never by
   re-reading fields that have already been typed into, which would restore the
   edits it exists to undo.

   The copy is shallow-plus-arrays: a person's `roles` is the only nested thing
   the register writes, and a deep clone of the whole graph per row-open would
   be paid on every press for a case that never needs it. */
/* ── AND THE KEY CARRIES ITS TABLE (§85) ──────────────────────────────
   `ROWEDIT` was a bare row key, which is exactly right while one table has the
   feature and wrong the moment a second does: Business units and Functions both
   have a row keyed `it`, so opening one would have opened the other's too.
   It is `table:key` now.

   `ROWFIND` is how Cancel gets back to the LIVE object. The caller used to pass
   it — `personBy(ROWEDIT)` — which works for one table and becomes six copies
   of "how do I find a row" spread across the shell. One registry, and each
   table says once how to find its own. */
var ROWEDIT = null;
var ROWWAS = null;
var ROWFIND = {
  people:    function(k){ return personBy(k); },
  units:     function(k){ return UNITS[k]; },
  companies: function(k){ return COMPANIES[k]; },
  fns:       function(k){ return FUNCTIONS[k]; },
  caps:      function(k){ return GROUP.capabilities[parseInt(k, 10)]; },
  sets:      function(k){ return setsList().filter(function(s){ return s.id === k; })[0]; },
  /* BY INDEX, NOT BY NAME. A BU row's handle everywhere else is its name — and
     renaming is the first thing the pen is for, so the moment somebody typed a
     character the open row stopped matching itself and closed mid-edit. A row
     that loses its own identity when you edit it cannot be edited (§85.3). */
  mainbu:    function(k){ return mainbus()[parseInt(k, 10)]; }
};
function rowEditIs(table, key){ return ROWEDIT === table + ":" + key; }
function rowEditTable(){ return ROWEDIT ? ROWEDIT.split(":")[0] : null; }
function rowEditKey(){ return ROWEDIT ? ROWEDIT.slice(ROWEDIT.indexOf(":") + 1) : null; }
function rowEditLive(){
  var t = rowEditTable();
  return (t && ROWFIND[t]) ? ROWFIND[t](rowEditKey()) : null;
}
/* ── AND WHAT POINTS AT THE ROW, NOT ONLY WHAT IS IN IT (§110) ───────
   A person's roles are not ON the person: a unit's `head` and a function's
   `custodian` point AT them (§33), and `ROWWAS` is a copy of the row. So Cancel
   restored `p.unit` and left the grant standing — press it after giving
   somebody Business unit owner of Nigeria and they read as its owner while
   sitting at the group. One fact contradicting itself, from one press.

   `ROWHELD` is every one of those pointers as it stood when the row opened.
   Not the person's ROLE LIST, which was the first answer and was not enough:
   granting an owner OVERWRITES whoever held it, so undoing the grant by
   revoking it left the unit with no head at all — the displaced person was
   gone and nothing remembered them. What has to come back is the pointers, and
   they are what is copied.

   Both maps whole, because a grant can move a seat this row never named — a
   custodian handed to a function moves `FUNCTIONS[k].custodian` — and they are
   two small objects (ten units, eight functions, two keys each), which is
   cheaper than working out in advance which of them a press might reach. */
var ROWHELD = null;
function rolePointers(){
  var out = { units:{}, fns:{} };
  UNIT_KEYS.forEach(function(k){
    var r = UNIT_ROLES[k] || {};
    out.units[k] = { head:r.head || null, custodian:r.custodian || null };
  });
  FUNCTION_KEYS.forEach(function(k){
    var f = FUNCTIONS[k] || {};
    out.fns[k] = { head:f.head || null, custodian:f.custodian || null };
  });
  return out;
}
/* PUT BACK IN PLACE, never by replacing the object — the same rule
   rowEditCancel already follows for the person, and for the same reason: an
   open menu or a chip may be holding a reference to the one that is there. */
function restoreRolePointers(was){
  if (!was) return;
  Object.keys(was.units).forEach(function(k){
    var r = unitRolesFor(k);
    r.head = was.units[k].head; r.custodian = was.units[k].custodian;
  });
  Object.keys(was.fns).forEach(function(k){
    var f = FUNCTIONS[k];
    if (!f) return;
    f.head = was.fns[k].head; f.custodian = was.fns[k].custodian;
  });
}
/* WHICH TABLES CAN MOVE A ROLE (§110, widened in §272). A person's roles are
   not ON the person and a unit's head is not ON the unit either: `UNIT_ROLES[k]
   .head` and `FUNCTIONS[k].custodian` are pointers, and `ROWWAS` is a copy of
   the ROW. So Cancel on a unit whose head had just been changed restored the
   unit and left the grant standing — §110's fault exactly, on two tables it had
   not been asked about, and reachable the moment the picker moved into a dialog
   with a Cancel on it.

   A LIST, not a test for one table: §65's rule that a second table joining a
   behaviour by omission is how these drift. Companies is deliberately absent —
   it holds no head and no custodian, and capturing two maps to restore nothing
   would be a cost with no reader. */
var ROLE_BEARING_ROWS = { people:1, units:1, fns:1 };
function rowEditOpen(table, key, obj){
  ROWEDIT = table + ":" + key;
  ROWWAS = obj ? JSON.parse(JSON.stringify(obj)) : null;
  ROWHELD = (ROLE_BEARING_ROWS[table] && obj) ? rolePointers() : null;
}
/* PUT BACK IN PLACE, never by replacing the object. Something else may already
   hold a reference to this person — the viewer switcher, a role chip, an open
   menu — and swapping the object would leave those pointing at the edited one
   while the register showed the restored one. */
/* THE LIVE OBJECT IS LOOKED UP HERE, not handed in (§48.2): the render that
   drew the Cancel button may be several repaints old, and a row found again is
   a row that still exists. */
function rowEditCancel(obj){
  if (obj === undefined) obj = rowEditLive();
  /* The pointers first and the row second, so that a grant's two halves are
     undone in the order they were written: grantPersonRole() writes the
     pointer AND the person's own attachment, and ROWWAS is what puts the
     second one back. */
  restoreRolePointers(ROWHELD);
  if (obj && ROWWAS) {
    Object.keys(obj).forEach(function(k){ if (!(k in ROWWAS)) delete obj[k]; });
    Object.keys(ROWWAS).forEach(function(k){ obj[k] = ROWWAS[k]; });
  }
  ROWEDIT = null; ROWWAS = null; ROWHELD = null;
}
function rowEditClose(){ ROWEDIT = null; ROWWAS = null; ROWHELD = null; }

var SHORT_NAME_WORDS = 3;
function shortName(name){ return nameWords(name, SHORT_NAME_WORDS); }

/* ── NAME AND FULL NAME (§93.8) ───────────────────────────────────────
   Islam: *"we can have it Name and Full Name."*

   The register carries two facts about what somebody is called and they were
   being asked to share one column. **Name** is what the office says out loud —
   two names, most days — and **Full Name** is what the employee file holds,
   which on this register runs to *Abd El Moniem Mohamed Abd El Moniem
   Mahmoud*. §93.6 widened the one column to fit the second; this splits them,
   which is the better answer and gives the 392px back: Name is the frozen
   column and Full Name is an ordinary hideable one.

   STORED, NOT DERIVED, and this is the whole reason it is a field. The first
   two names are a good GUESS and a bad rule — plenty of people go by their
   third name, by a shortening of it, or by something the file never says. A
   derived-only column is one nobody can correct, and correcting it is the
   entire point of having it.

   `known` IS A LABEL AND NEVER AN IDENTIFIER (Islam, same message: "for the
   identifiers keep it for the ID and email only"). Nothing resolves on it —
   not the upload, not the merge, not the door. §87's ladder is Emp ID then
   email and stops, and this adds no rung. Two people really can be "Ahmed
   Mostafa", which is exactly how the twins were made. */
var KNOWN_NAME_WORDS = SMPRules.KNOWN_NAME_WORDS;
/* The guess, used when nobody has said otherwise. Kept separate from the
   reader below so the seeded value and a typed one are never confused. */
function knownGuess(name){ return SMPRules.knownGuess(name); }
/* What the Name column shows: what was typed, or the guess. Never stores as a
   side effect of being read (§50.6's rule — a reader that creates the field it
   was looking for makes every save carry a phantom change). */
/* `dnames` is displayNames()'s map, passed by the two callers that render or
   export the whole register so it is built once rather than per row. Without
   it the guess is the flat two names — right for 31 rows of 33, and the two it
   is wrong for are exactly the pair the map exists to separate, which is why
   the register never omits it. */
function knownName(p, dnames){
  if (!p) return "";
  var k = String(p.known || "").trim();
  if (k) return k;
  var d = dnames && dnames[p.key];
  return (d && d.label) || knownGuess(p.name || "");
}
/* And the writing half, separate for the same reason. Clearing it back to the
   guess DELETES the key rather than storing the guess, or a later correction
   to the full name would leave a stale short one behind. */
function setKnownName(p, v){
  var t = String(v == null ? "" : v).trim();
  if (!t || t === knownGuess(p.name || "")) delete p.known;
  else p.known = t;
}

/* ── ENOUGH NAMES TO TELL TWO PEOPLE APART (§81.1) ────────────────────
   Three names is the column's budget (§69.21) and it is right for 31 of 33
   rows — but Raya's register carries *Ahmed Mostafa Mohamed El Gebely* and
   *Ahmed Mostafa Mohamed Abou El Einen*, and at three names those are the same
   row twice.

   FIXING IT BEATS FLAGGING IT. A warning would say "these two are
   indistinguishable" and leave them indistinguishable; adding the fourth name
   makes them distinguishable, and only for the pair that needs it. Everybody
   else keeps three.

   Computed over the WHOLE register including retired rows: a retired person is
   still on screen when the Retired filter is on, and a display that changes
   depending on a filter is worse than a long one. */
/* §93.8: IT DISAMBIGUATES THE GUESS, NOT THE COLUMN. The register no longer
   renders a truncation — Name is a stored field and Full Name is its own
   column — so what this lengthens is the GUESS shown for anybody who has never
   corrected theirs. The argument is unchanged and so is the need: two people
   whose first two names match would otherwise read as one row for anybody who
   has hidden Full Name. A TYPED value always wins and is never lengthened; the
   SMO wrote exactly what they meant. */
/* ── THE NAME A PERSON IS CALLED, ANYWHERE (§181) ─────────────────────
   Islam: "we need to use the name only across the platform for better
   usability." The register has answered this since §93.8 — a typed short
   name, else the leading words of the full one, lengthened just enough where
   two people would otherwise read alike (§81.1) — and the surfaces that
   NAME somebody in passing were each answering it their own way: the figure
   sets' owner list printed the full legal name, and the chat printed whatever
   the server had stored.

   `knownName()` needs the person and the disambiguation map; this is the
   version for a caller that has only a KEY and, sometimes, a name the server
   sent. It resolves through the register where it can, and falls back to the
   shared name rule where it cannot — a person the register no longer holds
   still reads as a name rather than as a key.

   NOT `shortName()`, which is the SENTENCE form (§93.6): the wizard, the
   picker's prose and the audience list read as prose, and this is the LABEL
   the register itself shows. */
function nameOf(key, fallback){
  var p = null;
  try { p = typeof personBy === "function" ? personBy(key) : null; } catch(e){}
  if (p) return knownName(p, displayNames());
  var raw = String(fallback == null ? "" : fallback).trim();
  if (!raw) return "";
  try { return SMPRules.knownGuess(raw) || raw; } catch(e){ return raw; }
}

/* And the FIRST name alone, for the one place that addresses somebody rather
   than naming them: the chat's reply box. Through `SMPRules.firstName()`, the
   same reader the email greeting uses (§135) — a compound first name is kept
   whole, so this register's "Abd El Moniem" is not greeted as "Abd", and a
   typed short name wins over the guess. */
function firstNameOf(key, fallback){
  var p = null;
  try { p = typeof personBy === "function" ? personBy(key) : null; } catch(e){}
  try {
    if (p) return SMPRules.firstName(p) || "";
    var raw = String(fallback == null ? "" : fallback).trim();
    return raw ? (SMPRules.firstName({ name: raw }) || raw) : "";
  } catch(e){ return String(fallback || "").split(/\s+/)[0] || ""; }
}

function displayNames(){
  var seen = {}, out = {};
  PEOPLE.forEach(function(p){
    var n = KNOWN_NAME_WORDS;
    var typed = String(p.known || "").trim();
    if (typed) { out[p.key] = { full:p.name, at:n, label:typed, typed:true }; return; }
    var label = nameWords(p.name, n);
    (seen[label.toLowerCase()] = seen[label.toLowerCase()] || []).push(p.key);
    out[p.key] = { full: p.name, at: n, label: label };
  });
  Object.keys(seen).forEach(function(k){
    if (seen[k].length < 2) return;
    /* Lengthen every member of the clash together, one name at a time, until
       they differ — or until there is nothing left to add, which is the real
       case of two people with the same full name and needs the flag instead. */
    var keys = seen[k], n = KNOWN_NAME_WORDS, same = true;
    while (same && n < 8) {
      n++;
      var got = {};
      same = false;
      keys.forEach(function(key){
        var lab = nameWords(out[key].full, n).toLowerCase();
        if (got[lab]) same = true;
        got[lab] = 1;
      });
    }
    keys.forEach(function(key){
      out[key].at = n;
      out[key].label = nameWords(out[key].full, n);
    });
  });
  return out;
}

/* ── WHAT IS DUPLICATED, AND WHERE (§81.2) ────────────────────────────
   Islam: "in case of duplication in the registry flag it in the app."

   TWO KINDS, and only one of them is a data fault:

     an EMP ID on two rows  — the people workbook matches on it (§54), so an
       upload would amend one of them and nobody could say which. This is
       broken and it is broken now.
     an ADDRESS on two rows — the door refuses BOTH of them (§69.23), so two
       people who cannot sign in and a message that reaches one inbox twice.

   A repeated NAME is neither: two people really can be called the same thing,
   and `displayNames()` above tells them apart rather than complaining. Only a
   name that cannot be told apart even at eight words is reported.

   §131 AMENDS THAT BY ONE NOTCH, WITHOUT MOVING THE LINE. Two people whose
   NAME COLUMN reads the same — the first two names, or a typed value that
   collides — are still not duplicates and never wear the mark; they are
   QUEUED as something to address (Islam: "notify me as an issue to address if
   2 people their 1st 2 names are the same so I can edit one of them"). The
   `read` groups below feed attentionOf() and nothing else: personDupe()
   deliberately does not read them, because sharing a spoken name is not
   evidence of being one human, and a queue entry is a notice where a mark is
   an accusation.

   RETIRED ROWS ARE EXCLUDED. They cannot sign in and no upload places them, so
   counting them would report a problem nobody has. */
/* What the Name column SAYS for this row, before §81.1 lengthens anything:
   the typed value, or the flat two-name guess. Kept apart from knownName(),
   which answers with the lengthened display label — the collision worth
   flagging is in what was stored or guessed, not in the disambiguation drawn
   over it. And its key: one spelling for both halves of the comparison, or a
   match reads as a difference (§116.9). */
function readName(p){
  return String((p && p.known) || "").trim() || knownGuess((p && p.name) || "");
}
function readKey(p){
  return readName(p).toLowerCase().replace(/\s+/g, " ");
}
function registerDupes(){
  var byId = {}, byAddr = {}, byName = {}, byRead = {};
  PEOPLE.forEach(function(p){
    if (!personActive(p)) return;
    var id = String(p.empId == null ? "" : p.empId).trim();
    if (id) (byId[id] = byId[id] || []).push(p);
    var a = String(p.email == null ? "" : p.email).trim().toLowerCase();
    if (a) (byAddr[a] = byAddr[a] || []).push(p);
    var n = String(p.name == null ? "" : p.name).trim().toLowerCase().replace(/\s+/g, " ");
    if (n) (byName[n] = byName[n] || []).push(p);
    var r = readKey(p);
    if (r) (byRead[r] = byRead[r] || []).push(p);
  });
  function only(m){
    var out = {};
    Object.keys(m).forEach(function(k){ if (m[k].length > 1) out[k] = m[k]; });
    return out;
  }
  return { empId: only(byId), email: only(byAddr), name: only(byName),
           read: only(byRead), likely: likelyDupes() };
}

/* ── THE FOURTH KIND, AND IT IS THE ONE THAT BIT (§87.2) ───────────
   The three above all match on a value the two rows SHARE. The pair that sent
   a message to nobody shared nothing: one row came off the employee file with
   an address and a long legal name, the other was typed into the role picker
   with a shorter spelling of the same name and no identifier at all. Nothing
   matched, so nothing was flagged, and the role sat on the row with no way to
   reach anybody.

   SO THIS ONE IS A RESEMBLANCE, AND IT IS SAID AS ONE. It never merges
   anything and never blocks anything — it puts the pair in front of the SMO,
   who is the only one who can know.

   TWO RULES KEEP IT QUIET ENOUGH TO READ:

     ONE SIDE MUST BE UNIDENTIFIED. Two rows that both carry an employee number
       are two employees, whatever they are called — this tenant really does
       hold two people whose first four names are identical (§81.1), and
       pairing those every time the page paints would teach whoever reads it to
       stop reading it. What is suspicious is a row with NOTHING to identify it
       that looks like somebody already here.
     THE SHORTER NAME MUST RUN THROUGH THE LONGER ONE, in order, for at least
       two names. Arabic names are a chain and the chain's ORDER is part of it:
       "Mirna Gamal Sadek" inside "Mirna Gamal Sadek Soliman" is the same
       person written short; "Mohamed Ali" inside "Ahmed Mohamed Ali" is not.

   Retired rows are excluded for the same reason the other three exclude them:
   they cannot sign in, no upload places them, and a merge of one would be
   tidying a row that is already out of the way. */
/* NOT `nameWords`, WHICH IS SOMEBODY ELSE'S (§87.2, found by the merge).
   §82's `nameWords(name, n)` returns the first n NAMES as a string, counting
   "Abd El Ghany" as one; this returns every WORD as an array, which is what a
   chain comparison needs. Two function declarations of one name in one script
   is one function — the later wins — and the register threw on every paint
   with nothing in either branch looking wrong. §56.7's `var pf`, in a file
   instead of a function: a clean merge is not a working one. */
function nameTokens(v){
  return String(v == null ? "" : v).trim().toLowerCase().split(/\s+/).filter(Boolean);
}
/* Is every word of `few`, in order, somewhere in `many`. Not a similarity
   score: a score needs a threshold, and a threshold is a number nobody can
   defend when it puts two strangers together. */
function nameRunsThrough(few, many){
  if (few.length < 2 || few.length > many.length) return false;
  var i = 0;
  for (var j = 0; j < many.length && i < few.length; j++) {
    if (many[j] === few[i]) i++;
  }
  return i === few.length;
}
function namesLookLikeOne(a, b){
  var x = nameTokens(a), y = nameTokens(b);
  if (!x.length || !y.length) return false;
  if (x[0] !== y[0]) return false;   /* the chain starts with the given name */
  return x.length <= y.length ? nameRunsThrough(x, y) : nameRunsThrough(y, x);
}
function likelyDupes(){
  /* The names are split ONCE. This is the only quadratic walk on the page and
     the client's register is five hundred rows — splitting both sides inside
     the comparison did it a quarter of a million times per paint. */
  var live = [];
  PEOPLE.forEach(function(p){
    if (personActive(p))
      live.push({ p:p, w:nameTokens(p.name), id:personIdentified(p) });
  });
  var out = [];
  live.forEach(function(a){
    if (a.id) return;                         /* one side must be unidentified */
    live.forEach(function(b){
      if (b.p.key === a.p.key) return;
      if (!a.w.length || !b.w.length || a.w[0] !== b.w[0]) return;
      var few = a.w.length <= b.w.length ? a.w : b.w;
      var many = few === a.w ? b.w : a.w;
      if (!nameRunsThrough(few, many)) return;
      /* Both unidentified: report the pair ONCE rather than from each end. */
      if (!b.id && b.p.key < a.p.key) return;
      out.push({ key:a.p.key, other:b.p.key });
    });
  });
  return out;
}
/* Is THIS row part of one, and what should the mark say. One function, so the
   row's mark, the header's count and the filter cannot disagree about who is
   affected (§33's shape: one fact, three surfaces). */
function personDupe(p, d){
  var out = [];
  var id = String(p.empId == null ? "" : p.empId).trim();
  var a = String(p.email == null ? "" : p.email).trim().toLowerCase();
  var n = String(p.name == null ? "" : p.name).trim().toLowerCase().replace(/\s+/g, " ");
  if (id && d.empId[id]) out.push({ kind:"empId", value:id, rows:d.empId[id] });
  if (a && d.email[a]) out.push({ kind:"email", value:a, rows:d.email[a] });
  if (n && d.name[n]) out.push({ kind:"name", value:p.name, rows:d.name[n] });
  var near = (d.likely || []).filter(function(l){
    return l.key === p.key || l.other === p.key;
  }).map(function(l){
    return personBy(l.key === p.key ? l.other : l.key);
  }).filter(Boolean);
  if (near.length) out.push({ kind:"likely", value:p.name, rows:near });
  return out;
}
/* Who this row could be merged with, most likely first. The merge control
   reads it, so the mark and the offer name the same rows. */
/* `dupes` is passed in wherever the caller already has it. The register draws
   this for EVERY row, and registerDupes() walks the whole list — asked afresh
   per row it is the register squared, which on 33 people is invisible and on
   the 500-row client file is the page not painting. */
function mergeCandidates(key, dupes){
  var p = personBy(key);
  if (!p) return [];
  var d = dupes || registerDupes(), seen = {}, out = [];
  personDupe(p, d).forEach(function(x){
    x.rows.forEach(function(q){
      if (!q || q.key === key || seen[q.key]) return;
      seen[q.key] = 1; out.push({ person:q, why:x.kind });
    });
  });
  return out;
}

/* ── THE DRAFT IS A PERSON BEFORE IT IS ON THE REGISTER (§116.3) ─────
   Islam: "adding a new employee as well opens the pop up where I add the
   essential data and any other optional data that I need and save."

   So Add and Edit are one dialog, and the way they stay one is that the thing
   being edited is a person-shaped object either way. `NEWDRAFT` is not in
   PEOPLE — nothing counts it, nothing saves it, no role can point at it — but
   `personBy()` answers for it, so every field handler `wire()` already binds
   (`data-pknown`, `data-pat`, `data-pemail`…) writes to it unchanged. One form,
   one set of handlers, and no second definition of what a person is.

   NOT MINTED INTO PEOPLE AND DELETED ON CANCEL, which was the other way to do
   it: a half-made person that a closed tab leaves behind is a row somebody has
   to clean up, and §69.23 already records what a stale key costs. */
var NEWDRAFT = null;
var NEWDRAFT_KEY = "__draft";
function newDraftStart(){
  NEWDRAFT = { key:NEWDRAFT_KEY, name:"", active:true };
  return NEWDRAFT;
}
function newDraftEnd(){ NEWDRAFT = null; }
function personBy(key){
  if (NEWDRAFT && key === NEWDRAFT.key) return NEWDRAFT;
  return PEOPLE.filter(function(x){ return x.key === key; })[0] || null;
}

/* A person arrives with a name and a role; the key is minted here, the same
   way a plan's codes are minted on arrival rather than typed (§22). Letters
   and digits from the name, then a numeric suffix if that is taken — never a
   silent collision, because the key IS the username. */
function mintPersonKey(name){
  var base = String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 14);
  if (!base) base = "person";
  if (!personBy(base)) return base;
  var n = 2;
  while (personBy(base + n)) n++;
  return base + n;
}

/* ── ADDING SOMEBODY THE REGISTER MAY ALREADY HAVE (§87.3) ─────────
   Both hand-typed doors — the Add row at the foot of the register and the role
   picker's "add new" — took a NAME and nothing else, which is how the three
   twins were made: somebody gave a role to a person who was already here,
   spelled their name a little differently, and got a second row with no
   address on it.

   THE STOP IS ON THE IDENTIFIER, NEVER ON THE NAME. Two people really can
   share a name, so refusing on one would refuse a real colleague; an employee
   number or an address on two rows is always a fault. A resemblance in the
   name is worth SAYING, so it is returned as a warning that does not stop
   anything — the same split the register's marks keep (§87.2).

   AND NEITHER IS REQUIRED. The SMO often knows a name and a role and nothing
   else, and a door that demanded an employee number would mean a unit could
   not be given its head until HR replied. The row is added and MARKED instead:
   an unidentified row is exactly the shape the next upload cannot match, and
   the register says so on the row rather than finding out months later. */
function personAddCheck(o){
  var id = personIdKey(o && o.empId), mail = personMailKey(o && o.email);
  var byId = id ? personByEmpId(id) : null;
  if (byId) return { stop:true, by:"empId", value:id, person:byId };
  var hits = mail ? peopleByEmail(mail) : [];
  if (hits.length) return { stop:true, by:"email", value:mail, person:hits[0] };
  var like = PEOPLE.filter(function(p){
    return personActive(p) && namesLookLikeOne(o && o.name, p.name);
  });
  if (like.length) return { stop:false, by:"name", person:like[0], others:like };
  return { stop:false };
}

/* Create and return the key. `where` follows the same encoding personRoles()
   reports: "group", "co:<company>", "fn:<function>", or a unit key. */
function addPerson(o){
  var key = mintPersonKey(o.name);
  var p = { key: key, name: String(o.name || "").trim(), title: o.title || "" };
  if (o.phone) p.phone = o.phone;
  /* Three facts the employee file brings and the typed Add row does not, so
     all three are optional and none is invented when absent (§54.2). `empId`
     is the client's own employee number and is what a second upload matches
     on — it survives a marriage, a transfer and a new mail domain, none of
     which the name or the address do. `mainbu` is HR's word for their part of
     the business; where that POINTS is read through the BU list rather than
     copied onto the person, so re-pointing the list never leaves a stale
     answer behind on five hundred rows. */
  if (o.empId) p.empId = String(o.empId).trim();
  if (o.email) p.email = String(o.email).trim();
  if (o.mainbu) p.mainbu = String(o.mainbu).trim();
  if (o.where !== undefined && o.where !== null) attachPersonAt(p, o.where);
  PEOPLE.push(p);
  if (o.role) grantPersonRole(key, o.role, o.where);
  return key;
}

/* ── WHO A ROW IS, ASKED IN ONE PLACE (§87.1) ──────────────────────
   Islam: "the name is not the challenge, the identifier really would be the ID
   and the email."

   THE NAME IS NEVER AN IDENTIFIER, and the register proves why twice over: it
   holds *Ahmed Mostafa Mohamed El Gebely* and *Ahmed Mostafa Mohamed Abou El
   Einen* (§81.1), and it holds the same human under two spellings of their own
   name — which is how three people ended up on it twice, each once from the
   employee file with an address and once typed into the role picker with
   nothing. A name tells a PERSON who they are looking at; it must never tell
   the platform.

   THE LADDER IS EMP ID, THEN EMAIL, AND THERE IS NO THIRD RUNG. The employee
   number survives a marriage, a transfer and a new mail domain (§54.2); the
   address survives a tenant that never had employee numbers. Anything below
   those two is a RESEMBLANCE, and a resemblance is something to show the SMO,
   never something to act on.

   AN ADDRESS ON TWO ROWS ANSWERS NOTHING, exactly as it answers nothing at the
   door (§69.23): `personByEmail` returns a person only where the address means
   ONE person, and the caller is told it was ambiguous rather than handed the
   first row. This is §57's rule about a Main BU that holds several, in a
   second place — read past it and you attach somebody to a coincidence. */
function personIdKey(v){ return String(v == null ? "" : v).trim(); }
function personMailKey(v){ return String(v == null ? "" : v).trim().toLowerCase(); }

/* The employee number, matched the way the file will spell it: trimmed, and
   compared as text because a leading zero is part of an employee number and
   102347 read as a number is not the same string as 0102347. */
function personByEmpId(id){
  var want = personIdKey(id);
  if (!want) return null;
  return PEOPLE.filter(function(p){
    return personIdKey(p.empId) === want;
  })[0] || null;
}
function peopleByEmail(email){
  var want = personMailKey(email);
  if (!want) return [];
  return PEOPLE.filter(function(p){ return personMailKey(p.email) === want; });
}
function personByEmail(email){
  var hits = peopleByEmail(email);
  return hits.length === 1 ? hits[0] : null;
}
/* `by` is which rung answered, because every caller has to SAY so: a review
   line reading "matched" tells nobody whether the employee number or the
   address decided, and those are two different things to check. */
function personByIdentity(id, email){
  var byId = personByEmpId(id);
  if (byId) return { person:byId, by:"empId" };
  var hits = peopleByEmail(email);
  if (hits.length === 1) return { person:hits[0], by:"email" };
  if (hits.length > 1) return { person:null, by:"ambiguous", rows:hits };
  return null;
}
/* A row with neither is not a fault — the SMO may know somebody's name and
   nothing else, and refusing to add them would mean a role could not be given
   until HR answered an email (§87.3). It is a row that cannot be matched by
   anything, so it is MARKED, and marking it is what stops it quietly becoming
   somebody's second row. */
function personIdentified(p){
  return !!(p && (personIdKey(p.empId) || personMailKey(p.email)));
}

/* ── One fact, two editing surfaces ─────────────────────────────────
   A SEAT role (super, group CEO, company CEO) is a property of the PERSON and
   is stored on them. RESPONSIBILITY FOR A THING (unit owner, custodian,
   function head) is a property of the THING, so granting it writes the
   thing's pointer — which is the same pointer the Business units page edits.
   That is why the register and the unit page cannot disagree: there is only
   one place the answer lives, and both screens write it (§33, §35).

   A responsibility role is singular by nature — one head per unit — so
   granting it to someone takes it from whoever held it. That is not a side
   effect to guard against; it is what "this is now their unit" means. */
/* A unit and a supporting function may share a name — Care and IT are both,
   in this tenant — and one person is often custodian of each. Unqualified, the
   row then reads "Strategy custodian · Care" twice and looks like a duplicate
   rather than two real roles over two different things. The kind is part of
   the answer, so it is part of the label. */
/* roleWhereLabel() for a cell that may legitimately be EMPTY. It answers "the
   group" for a null, which is right on a role chip (a role is always held over
   something) and wrong in a file column, where blank means "nothing to say"
   and "the group" would be an assertion nobody made (§65). */
function roleWhereLabel2(at){ return at ? roleWhereLabel(at) : ""; }
function roleWhereLabel(at){
  if (!at || at === "group") return "the group";
  if (String(at).indexOf("fn:") === 0) {
    var f = FUNCTIONS[String(at).slice(3)];
    return (f ? f.name : String(at).slice(3)) + " (function)";
  }
  if (String(at).indexOf("co:") === 0) {
    var c = COMPANIES[String(at).slice(3)];
    return c ? c.name : String(at).slice(3);
  }
  return UNITS[at] ? UNITS[at].name : at;
}

/* ── WHAT THE REGISTER CALLS A PLACE (§93.12) ─────────────────────────
   Islam: "for the units name in the people register let's use the navigation
   names, and for the units remove the word function that comes between
   brackets."

   Two changes, and only on the REGISTER. `roleWhereLabel()` is unchanged
   because it is also the people workbook's vocabulary — the Unit column is
   written from it and read back against it (§65), so renaming it would leave
   every file downloaded before today failing to match.

   1 · THE NAVIGATION'S NAME. `navName()` is what the tabs say, and the tabs are
       where somebody learned the word: this tenant's `it` unit is "IT Dist." in
       the navigation and "IT Dist." is what the register should say too.

   2 · "(function)" GOES — EXCEPT WHERE IT IS THE ONLY THING TELLING TWO PLACES
       APART. §65 added that suffix for a reason and the reason is still live:
       this tenant has a unit called **Care** and a supporting function called
       **Care**, with the same navigation name. Dropping it from that one would
       put two different places on the register under one word.

       So it is dropped from the seven that are unambiguous and kept for the one
       that is not — the same shape as §81.1's names and §65's own near-miss
       rule: disambiguate the pair that clashes, leave everybody else alone. */
function placeLabel(at){
  if (!at || at === "group") return "the group";
  if (String(at).indexOf("co:") === 0) {
    var c = COMPANIES[String(at).slice(3)];
    return c ? navName(c) : String(at).slice(3);
  }
  if (String(at).indexOf("fn:") === 0) {
    var fk = String(at).slice(3), f = FUNCTIONS[fk];
    var nm = f ? navName(f) : fk;
    /* Asked of the units by their NAVIGATION name, because that is the name
       being shown — comparing against `.name` would keep the suffix on a
       function whose clash is invisible here, and drop it from one whose
       clash is real. */
    var clash = UNIT_KEYS.some(function(k){
      return UNITS[k] && navName(UNITS[k]) === nm; });
    return clash ? nm + " (function)" : nm;
  }
  return UNITS[at] ? navName(UNITS[at]) : at;
}

/* ── WHO YOU ARE VIEWING AS (§178) ────────────────────────────────────────
   Islam, of a project owner's chrome reading PROJECT OWNER &middot; ALL UNITS:
   *"correct it it should follow the roles and the unit he belongs to."*

   IT WAS KEEPING ITS OWN ANSWER TO A QUESTION THE PLATFORM ALREADY ANSWERS.
   The line read `p.unit` directly and nothing else, so `p.fn` and `p.company`
   were never looked at -- 9 of the 33 people on the demo register were told
   they belong nowhere, every supporting-function person and both company CEOs
   among them. And the DROPDOWN SIX PIXELS TO ITS LEFT had it right the whole
   time: §142 labels each option `knownName(p) + placeLabel(personAt(p))`, so
   Hala's option said *CX* while her note said an em-dash. Two controls on one
   row answering one question two ways is §53.5 exactly, and the fix is to
   delete the copy rather than to teach it about functions.

   AND THE PLACE BELONGS TO THE ROLE, NOT TO THE PERSON. 10 of the 33 hold
   roles in more than one place, and the line named ONE for all of them: Ramy
   owns a project in IT and a pillar in Mobile and it said "Mobile". So each
   role is named with where it is held -- read off `personRoles()`, which is
   the one thing that mints them, never `roleWheres()`, which falls through to
   *every unit* for a derived role (§175).

   THE SELECT CARRIES THE SEAT, SO THIS DOES NOT REPEAT IT. A role held only
   where the person sits needs no place -- the control beside it has just said
   it -- which is what keeps the line to 379px rather than 487px. A role held
   anywhere ELSE is named, and a role held in SEVERAL places names them all,
   including the seat: dropping the seat from a list would read as though they
   held it only in the other place. */
function viewerRoleLine(p){
  var seat = placeLabel(personAt(p));
  var byRole = {}, order = [];
  personRoles(p).forEach(function(r){
    var n = roleName(r.role), where = placeLabel(r.at);
    if (!byRole[n]) { byRole[n] = []; order.push(n); }
    if (byRole[n].indexOf(where) < 0) byRole[n].push(where);
  });
  /* Somebody who holds nothing says so and stops. The seat is on the control
     beside this one, so repeating it here would be the one place the line
     said twice what the select has already said -- the rule is applied
     without an exception rather than with one (§53.5). */
  if (!order.length) return "No role";
  return order.map(function(n){
    var pl = byRole[n];
    if (pl.length === 1 && pl[0] === seat) return n;
    return n + ", " + andList(pl);
  }).join(" \u00b7 ");
}
/* "A", "A and B", "A, B and C" -- the platform says `and` rather than a bare
   comma list, because two places for one role read as one long place name
   otherwise. */
function andList(a){
  return a.length < 2 ? (a[0] || "")
    : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
}

function unitRolesFor(k){
  if (!UNIT_ROLES[k]) UNIT_ROLES[k] = { head:null, custodian:null };
  return UNIT_ROLES[k];
}
var SEAT_AT_GROUP = ["super", "smoteam", "gceo"];
function grantPersonRole(personKey, roleKey, where){
  var p = personBy(personKey);
  if (!p) return;
  var at = where || "group";
  /* THE SEAT ROLES HELD OVER THE GROUP, named once (§89). SMO team joins
     Super user and Group CEO here: a seat is a property of the PERSON (§33),
     and adding it to the list is the whole of what "grant it" means. */
  if (SEAT_AT_GROUP.indexOf(roleKey) > -1) {
    p.role = roleKey; delete p.company; if (!p.unit) p.unit = "group";
  } else if (roleKey === "cceo") {
    p.role = "cceo"; p.company = at.indexOf("co:") === 0 ? at.slice(3) : at; p.unit = null;
  } else if (roleKey === "owner") {
    unitRolesFor(at).head = personKey; p.unit = at;
  } else if (roleKey === "custodian" && at.indexOf("fn:") === 0) {
    FUNCTIONS[at.slice(3)].custodian = personKey; p.fn = at.slice(3);
  } else if (roleKey === "custodian") {
    unitRolesFor(at).custodian = personKey; p.unit = at;
  } else if (roleKey === "fnhead") {
    FUNCTIONS[at.slice(3)].head = personKey; p.fn = at.slice(3);
  } else if (SMPRules.isOwnLinesRole(roleKey)) {
    /* Neither floor role is granted (roleIsGrantable refuses both), but the
       attachment they are read off is the same one thing: which unit this
       person is in. */
    p.unit = at;
  }
}
function revokePersonRole(personKey, roleKey, where){
  var p = personBy(personKey);
  var at = where || "group";
  if (SEAT_AT_GROUP.indexOf(roleKey) > -1 || roleKey === "cceo") {
    if (p) { delete p.role; delete p.company; }
  } else if (roleKey === "owner") {
    if (UNIT_ROLES[at] && UNIT_ROLES[at].head === personKey) UNIT_ROLES[at].head = null;
  } else if (roleKey === "custodian" && at.indexOf("fn:") === 0) {
    var f = FUNCTIONS[at.slice(3)];
    if (f && f.custodian === personKey) f.custodian = null;
  } else if (roleKey === "custodian") {
    if (UNIT_ROLES[at] && UNIT_ROLES[at].custodian === personKey) UNIT_ROLES[at].custodian = null;
  } else if (roleKey === "fnhead") {
    var g = FUNCTIONS[at.slice(3)];
    if (g && g.head === personKey) g.head = null;
  }
  /* contrib is p.unit, which is also how a person is FOUND — clearing it would
     hide them from every unit dropdown, so it stands until they are given
     somewhere else to be. */
}

/* Retiring REVOKES every role the person holds, rather than leaving them
   pointed at while unable to act. The unit then reads "unassigned", which is
   the true state of a unit whose head has left — and it is visible, where a
   retired person still named as head is a unit that looks staffed and is not.
   Reported history is untouched: it lives in snapshots, not in these
   pointers. */
function retirePerson(key){
  var p = personBy(key);
  if (!p) return;
  var held = personRoles(p);
  /* ── RETIRING REMEMBERS WHAT IT TOOK (§49.4) ────────────────────
     Restoring gave none of it back, so a Strategy custodian who was retired
     and brought back returned as a Contributor of their unit — the derived
     role a person attached to a unit and holding nothing else always has. It
     was not a demotion anybody chose; it was a demotion nobody noticed.

     `contrib` is not stored, because it is not granted: it is read off
     `p.unit`, which retiring leaves alone (see revokePersonRole), so it comes
     back by itself. Storing it would make the list say a role was returned
     that was never taken. */
  p.heldRoles = held.filter(function(r){ return !SMPRules.isOwnLinesRole(r.role); })
                    .map(function(r){ return { role:r.role, at:r.at }; });
  if (!p.heldRoles.length) delete p.heldRoles;
  held.forEach(function(r){ revokePersonRole(key, r.role, r.at); });
  p.active = false;
}

/* What retiring took AND that nobody else has taken up since. A seat filled
   while its holder was out is not silently taken back off whoever is in it:
   it is dropped from the offer, and the page says so. */
function personHeldRoles(key){
  var p = personBy(key);
  return ((p && p.heldRoles) || []).map(function(r){
    return { role:r.role, at:r.at, taken:roleHolderAt(r.role, r.at) };
  });
}
function roleHolderAt(roleKey, at){
  if (roleKey === "owner")  return (UNIT_ROLES[at] || {}).head || null;
  if (roleKey === "fnhead") return (FUNCTIONS[String(at).replace(/^fn:/, "")] || {}).head || null;
  if (roleKey === "custodian") {
    return String(at).indexOf("fn:") === 0
      ? (FUNCTIONS[at.slice(3)] || {}).custodian || null
      : (UNIT_ROLES[at] || {}).custodian || null;
  }
  /* A seat is a property of the PERSON, so two people may hold it at once and
     restoring one takes nothing from the other (§33). */
  return null;
}

/* `giveBack` is the SMO's answer to "and their roles?", asked at the moment of
   restoring — never assumed either way. */
function restorePerson(key, giveBack){
  var p = personBy(key);
  if (!p) return;
  delete p.active;
  if (giveBack) {
    personHeldRoles(key).forEach(function(r){
      if (!r.taken) grantPersonRole(key, r.role, r.at);
    });
  }
  delete p.heldRoles;
}

/* ── DELETED, NOT RETIRED — AND THE REFUSAL IS THE FEATURE (§69) ────
   The rule above still stands: retiring is what happens when somebody LEAVES,
   and it is right that it keeps every attribution true. This is the other
   case, and it is the one Islam asked for — a row typed by mistake, a test
   person, somebody imported twice. Those could only ever be retired, so the
   register grew a permanent list of people who were never really there.

   §62's shape, applied to a person: the button is always live, the delete is
   REFUSED while anything still points at the row, and the refusal NAMES what
   and where to go and undo it. What points at a person is a short list and it
   is worth writing down, because each one is a KEY rather than a name:

     UNIT_ROLES[k].head / .custodian      a unit's two seats
     FUNCTIONS[f].head / .custodian       a function's two
     p.role (super / gceo / cceo)         the seats held on the person
     set.owner                            who owns a figure set (§44)
     row.src.by                           who enters one figure (§44 step 3)
     claim.by                             an open request for a figure

   A TYPED NAME IS NOT A POINTER. `t.owner` and `t.collaborators` hold text —
   an imported plan names people who have never been on the register at all
   (§50.2) — so being named on a line does NOT block. It is said in the
   confirmation instead, because the name stays where the plan typed it and
   somebody should know that before pressing Yes.

   NOTHING IN THE STATE GRAPH RECORDS WHO ENTERED A FIGURE. The register's own
   note has promised that since §16.11 and it has never been true: what exists
   is `change_log` (§42), which is OUTSIDE the state graph and is deliberately
   NOT purged — a log that forgets who did something is not a log. The purge is
   the door: credentials, sessions, the BU declaration and any failed sign-ins
   go with the row, server-side, or a key minted again from the same name would
   inherit the deleted person's password (see lib/state-io.js). */
function personBlock(short, full){ return { short:short, full:full }; }
function personDeleteBlockers(key){
  var out = [], p = personBy(key);
  if (!p) return [personBlock("unknown", "no such person")];

  /* A GRANTED role, never a derived one. Contributor and Employee are read off
     `p.unit` and off being named (§55) — they are not pointers, they go with
     the row, and refusing on them would refuse every attached person. */
  var held = personRoles(p).filter(function(r){ return !SMPRules.isOwnLinesRole(r.role); });
  if (held.length) out.push(personBlock(
    plural(held.length, "role"),
    plural(held.length, "role") + " still held (" +
    held.map(function(r){ return roleName(r.role) + " · " + roleWhereLabel(r.at); }).join(", ") +
    ") — take each one off with its × first"));

  var sets = setsList().filter(function(s){ return s.owner === key; })
                       .map(function(s){ return s.name; });
  if (sets.length) out.push(personBlock(
    plural(sets.length, "figure set"),
    plural(sets.length, "figure set") + " owned (" + sets.join(", ") +
    ") — hand each one to somebody else on Setup → Figure sets"));

  var figs = [];
  UNIT_KEYS.concat(FUNCTION_KEYS.map(function(f){ return "fn:" + f; })).forEach(function(t){
    var u = unitLike(t);
    if (!u) return;
    reportItems(u).forEach(function(x){
      if (x.obj && x.obj.src && x.obj.src.by === key) figs.push(u.name + " · " + x.obj.name);
    });
  });
  if (figs.length) out.push(personBlock(
    plural(figs.length, "figure"),
    plural(figs.length, "figure") + " they enter (" + figs.join(", ") +
    ") — clear the naming on that unit’s Strategy → Who enters"));

  var claims = claimsList().filter(function(c){ return c.by === key && c.state === "open"; });
  if (claims.length) out.push(personBlock(
    plural(claims.length, "open request"),
    plural(claims.length, "open request") + " for a figure — answer them on the " +
    "cycle page first, so the request is not left pointing at nobody"));

  return out;
}

/* What goes with the row, so the confirmation can say it rather than asking
   somebody to trust a button (§62, §49.2). Two of these are NOT data the
   platform holds — they are the door — and saying so is the point: deleting a
   person is what makes their password and their open sessions stop existing. */
function personDeleteTakes(key){
  var p = personBy(key), out = [];
  if (!p) return out;
  /* NO ITEM MAY CONTAIN THE WORD "and". The confirmation joins these into one
     sentence, and an item that carries its own conjunction produces "their
     password and their sessions and anything they said" — read on screen
     before it was read in the source. */
  out.push("their row on the register");
  out.push("their password");
  out.push("any sessions they have open");
  out.push("anything they said about where they work");
  return out;
}

/* Where the plan still types their NAME after the row has gone. Not a blocker
   — the plan is text and an imported one names people who were never on the
   register — but the confirmation says how many, because "deleted" reading as
   "scrubbed from the plan" is the wrong expectation to leave somebody with. */
function personNamedLines(key){
  var p = personBy(key);
  if (!p) return 0;
  var n = 0;
  UNIT_KEYS.concat(FUNCTION_KEYS.map(function(f){ return "fn:" + f; })).forEach(function(t){
    var u = unitLike(t);
    if (!u) return;
    reportItems(u).forEach(function(x){
      if (SMPRules.namedOn({ owner:x.owner, collaborators:x.collaborators }, p)) n++;
    });
  });
  /* §147: a project's owner name counts here too — since a project's owner
     is a Contributor of its function now, the confirmation should say how
     many of those namings survive the row as plain words. */
  (GROUP.capabilities || []).forEach(function(c){
    (c.projects || []).forEach(function(pr){
      if (SMPRules.namedOn({ owner: pr.owner }, p)) n++;
    });
  });
  return n;
}

/* Blockers are re-asked HERE and never trusted from the render that drew the
   button (§62, §48.2): a repaint can happen between the two, and a delete
   authorised by a stale screen is the one that takes a unit's head with it. */
function deletePerson(key){
  if (personDeleteBlockers(key).length) return false;
  var i = -1;
  PEOPLE.forEach(function(p, n){ if (p.key === key) i = n; });
  if (i < 0) return false;
  PEOPLE.splice(i, 1);
  return true;
}

/* ══════════════════════════════════════════════════════════════════
   TWO ROWS, ONE PERSON (§87.4)

   Retiring is for somebody who LEFT and deleting is for a row that should
   never have existed (§69). This is the third case and it is neither: two rows
   that were both real entries about the same human, one of which has the
   address and the other of which has the role. Retiring either loses
   something; deleting either is refused, because a row holding a role is a row
   something points at.

   THE SURVIVOR IS CHOSEN, NEVER DERIVED. "Keep the older one" or "keep the one
   with the address" are both defensible and both wrong sometimes, and the cost
   of guessing is a sign-in name changing under somebody who is using it — the
   key is minted from the name (§35) and `credentials` is keyed on it, so the
   row that survives is the password that survives. So the panel asks, and
   names what each row would cost.

   WHAT MOVES IS EVERY POINTER `personDeleteBlockers` REFUSES A DELETE FOR, and
   that is not a coincidence — it is the same list read the other way round. A
   merge is a delete that first hands each pointer to somebody, which is why
   the last thing it does is call deletePerson(): if anything was missed the
   delete refuses and the merge fails LOUDLY rather than dropping a role.

   VALUES ARE NOT POINTERS AND ARE ASKED ABOUT SEPARATELY. A blank on the
   survivor is filled from the other row without asking — there is nothing to
   lose. Where both rows say something and they differ, the SMO picks, and the
   default is the survivor's own, because that is the row they chose to keep
   (§87.5's rule, in the other direction: what is already recorded wins unless
   somebody says otherwise). */
var MERGE_FIELDS = [
  { k:"name",   label:"Full Name" },
  { k:"known",  label:"Name" },
  { k:"empId",  label:"Emp ID" },
  { k:"email",  label:"Email" },
  { k:"title",  label:"Job title" },
  { k:"phone",  label:"Mobile" },
  { k:"mainbu", label:"Official BU" }
];
function mergeVal(p, k){ return String((p && p[k]) == null ? "" : p[k]).trim(); }

/* What would happen, said before it happens. Changes nothing — the same
   contract planPeopleFile() keeps, and for the same reason. */
function personMergePlan(keepKey, dropKey){
  var keep = personBy(keepKey), drop = personBy(dropKey);
  if (!keep || !drop || keep.key === drop.key) return null;
  var plan = { keep:keep, drop:drop, fills:[], picks:[], roles:[], owns:[], seat:null };

  MERGE_FIELDS.forEach(function(f){
    var a = mergeVal(keep, f.k), b = mergeVal(drop, f.k);
    if (!b) return;
    if (!a) { plan.fills.push({ k:f.k, label:f.label, value:b }); return; }
    if (a.toLowerCase() !== b.toLowerCase())
      plan.picks.push({ k:f.k, label:f.label, keep:a, drop:b, take:false });
  });

  /* GRANTED ROLES ONLY. Contributor and Employee are read off an attachment
     and off being named (§55) — they are not held and there is nothing to
     hand over; they arrive by themselves once the survivor sits where the
     other row sat. */
  personRoles(drop).forEach(function(r){
    if (SMPRules.isOwnLinesRole(r.role)) return;
    if (r.role === "super" || r.role === "gceo" || r.role === "cceo") {
      plan.seat = { role:r.role, at:r.at };
      return;
    }
    plan.roles.push({ role:r.role, at:r.at,
                      already: roleHolderAt(r.role, r.at) === keep.key });
  });

  setsList().forEach(function(s){
    if (s.owner === drop.key) plan.owns.push({ kind:"set", name:s.name });
  });
  UNIT_KEYS.concat(FUNCTION_KEYS.map(function(f){ return "fn:" + f; })).forEach(function(t){
    var u = unitLike(t);
    if (!u) return;
    reportItems(u).forEach(function(x){
      if (x.obj && x.obj.src && x.obj.src.by === drop.key)
        plan.owns.push({ kind:"figure", name:u.name + " \u00b7 " + x.obj.name });
    });
  });
  claimsList().forEach(function(c){
    if (c.by === drop.key && c.state === "open")
      plan.owns.push({ kind:"claim", name:"an open request for a figure" });
  });

  /* Where the other row sat, offered only when the survivor sits nowhere —
     moving somebody who already has a unit is a real act and a merge must not
     do it as a side effect (§54.4's rule about the Role column, applied to
     the attachment). */
  var at = personAt(drop);
  if (at && !personAt(keep)) plan.moveTo = at;
  return plan;
}

/* `picks` is a map of field key to true, meaning "take the other row's". The
   panel passes what was ticked; nothing is read back off the DOM here. */
function mergePeople(keepKey, dropKey, picks){
  var plan = personMergePlan(keepKey, dropKey);
  if (!plan) return { ok:false, why:"There is nothing to merge." };
  var keep = plan.keep, drop = plan.drop, took = picks || {};

  plan.fills.forEach(function(f){ keep[f.k] = f.value; });
  plan.picks.forEach(function(f){ if (took[f.k]) keep[f.k] = f.drop; });

  /* THE ATTACHMENT BEFORE THE ROLES, and the survivor’s own kept
     afterwards. grantPersonRole() writes `p.unit` as part of seating somebody
     (that is what "this is now their unit" means, §33) — which is right when a
     picker does it and wrong here, where the survivor already sits somewhere
     and the merge was not asked to move them. */
  if (plan.moveTo) attachPersonAt(keep, plan.moveTo);
  var sat = personAt(keep);

  if (plan.seat && !keep.role) grantPersonRole(keep.key, plan.seat.role, plan.seat.at);
  plan.roles.forEach(function(r){
    revokePersonRole(drop.key, r.role, r.at);
    grantPersonRole(keep.key, r.role, r.at);
  });
  if (sat && personAt(keep) !== sat) attachPersonAt(keep, sat);

  setsList().forEach(function(s){ if (s.owner === drop.key) s.owner = keep.key; });
  UNIT_KEYS.concat(FUNCTION_KEYS.map(function(f){ return "fn:" + f; })).forEach(function(t){
    var u = unitLike(t);
    if (!u) return;
    reportItems(u).forEach(function(x){
      if (x.obj && x.obj.src && x.obj.src.by === drop.key) x.obj.src.by = keep.key;
    });
  });
  claimsList().forEach(function(c){ if (c.by === drop.key) c.by = keep.key; });

  /* AND THE DELETE IS THE CHECK. Anything this function forgot to hand over is
     still pointing at the row, so the delete refuses and the merge reports it
     rather than leaving a role attached to a person who no longer exists. */
  var left = personDeleteBlockers(drop.key);
  if (left.length) return { ok:false, why:left.map(function(b){ return b.full; }).join("; and ") };
  if (!deletePerson(drop.key)) return { ok:false, why:"The second row could not be removed." };
  return { ok:true, keep:keep.key, name:keep.name };
}

/* Where a role can be attached, for the second half of the picker. A role
   whose scope is the group has exactly one answer, and the control says so
   rather than offering a list of one. */
function roleWheres(roleKey){
  if (SEAT_AT_GROUP.indexOf(roleKey) > -1) return [{ v:"group", label:"the group" }];
  if (roleKey === "cceo") {
    /* A retired company is not somewhere a new CEO can be seated (§49.3). An
       existing role pointing at one is left alone — restoring the company
       restores the seat rather than the seat having silently gone. */
    return activeCompanyKeys().map(function(c){ return { v:"co:" + c, label: COMPANIES[c].name }; });
  }
  if (roleKey === "fnhead") {
    return FUNCTION_KEYS.map(function(f){ return { v:"fn:" + f, label: FUNCTIONS[f].name }; });
  }
  var units = UNIT_KEYS.map(function(k){ return { v:k, label: UNITS[k].name }; });
  if (roleKey === "custodian") {
    return units.concat(FUNCTION_KEYS.map(function(f){
      return { v:"fn:" + f, label: FUNCTIONS[f].name + " (function)" };
    }));
  }
  return units;
}

/* ══════════════════════════════════════════════════════════════════
   THE BU LIST (§54, spec 011) — the client's own names for its business

   An employee file arrives with a BU column holding the client's official
   vocabulary: Distribution, Finance, IT, Logistics, Maintenance, Marketing,
   Mazaya, Retail, Risk, Support Function. The platform holds none of those
   words. It holds business units, supporting functions and companies, named
   the way the strategy work named them — "Retail Stores" rather than Retail,
   "Distribution" as a COMPANY holding three units rather than a unit, and
   nothing at all for Maintenance, Risk or Mazaya.

   So the register carries TWO answers and they are different questions:

     Main BU   what the organisation calls the person's part of the business.
               HR's word, straight off the file, never edited by the platform.
     BU        what that points at HERE — the unit, function or company whose
               pages they open and whose plan they may touch. This is the
               attachment access has always been read from; it is what the
               register called "Belongs to" until Islam renamed it, on the
               grounds that a strategy platform's word for a part of the
               business is BU (2026-08-23).

   THE LIST IS THE BRIDGE, AND IT IS STORED ONCE. Ten rows, each pointing at
   one place or at nothing. A row pointing at nothing is a real answer, not an
   omission: Risk employs people and carries no strategy, so they belong to
   Risk and have nothing to open. Naming the person's unit on every one of five
   hundred rows would be the same fact typed five hundred times, and a typo in
   any one of them a person quietly in the wrong place.

   THE VOCABULARY IS `r.at`'s — "group", "co:<company>", "fn:<function>", or a
   unit key — the same strings a role is held at and the same ones
   roleWhereLabel() names. Reusing it is the whole reason a Main BU can point
   at a company: the platform already had somewhere to put "attached to
   Distribution, which is not a unit", because a company CEO is attached that
   way (§23).

   It lives on GROUP, which means it lands in the org row's `extra` and needs
   no migration — the same free ride §44's figure sets took. And like every
   other accessor here it must NEVER CREATE THE FIELD IT WAS LOOKING FOR
   (§50.6): `branding()` invented a four-null object the database never held
   and every non-SMO save would have been refused for ever. The reader returns
   a shared frozen empty; mainbuList() is the writing half; removing the last
   row deletes the key again.
   ══════════════════════════════════════════════════════════════════ */
var NO_MAINBUS = Object.freeze([]);
function mainbus(){ return GROUP.mainbus || NO_MAINBUS; }
function mainbuList(){
  if (!GROUP.mainbus) GROUP.mainbus = [];
  return GROUP.mainbus;
}
/* Matched case- and space-insensitively, because the same name will arrive
   from HR as "Support Function", "support function" and " Support Function"
   in the same file, and three rows for one department is not a list anybody
   can map. The name is STORED as first written — the client's own casing. */
function mainbuKey(name){ return String(name == null ? "" : name).trim().toLowerCase(); }
function mainbuBy(name){
  var want = mainbuKey(name);
  if (!want) return null;
  return mainbus().filter(function(b){ return mainbuKey(b.name) === want; })[0] || null;
}
/* ── A MAIN BU HOLDS SEVERAL (§57) ─────────────────────────────────
   Islam: "map the main BUs list to the BUs and functions … so everyone gets
   to the login with a short list to pick from."

   It pointed at exactly ONE thing until now, which is precisely why it could
   not place anybody in the cases that matter: Distribution is a COMPANY here
   holding three units, and Support Function is the client's word for eight.
   One target could name the company and stop there; several name the actual
   choices, and the sign-in picker offers those and nothing else.

   READS BOTH SHAPES. Every row written before today holds a string, and a
   tenant that has already mapped some of its list must not have to do it
   again — so a string is read as a list of one and written back as a list the
   next time it is touched. There is no migration because `mainbus` lives in
   `org.extra`, which is jsonb and takes an array without being asked. */
/* THE OFFICIAL BU CHOICES FOR ONE ROW (§69.17). The client's own list, plus
   whatever this row already says if the list has never heard of it — a name
   the file brought and nobody has mapped is still this person's true answer,
   and a select that dropped it would silently clear it the first time somebody
   opened the row to change something else. */
function mainbuNamesFor(p){
  var out = mainbus().map(function(b){ return b.name; });
  var have = String((p && p.mainbu) || "").trim();
  if (have && !out.some(function(n){ return mainbuKey(n) === mainbuKey(have); })) out.push(have);
  return out;
}
/* EVERYWHERE A PERSON CAN SIT, in `r.at`'s vocabulary — the same strings a
   role is held at (§54.1), which is what lets somebody be attached to a
   company without inventing anything. Retired units, functions and companies
   are left out: a retired one is not somewhere to be seated (§49.3), and an
   existing attachment to one is left alone because the select keeps whatever
   the row already says (below). */
/* ── WHERE A PERSON'S COMPANY COMES FROM (§135.6) ─────────────────────
   Islam: *"some users belong only to a company not a unit, like how the CEO
   belongs to the group only."*

   A PERSON SITS IN EXACTLY ONE PLACE, and that is built in rather than
   habitual: `attachPersonAt()` clears unit, function and company before
   setting one, and `personAt()` gives one answer. Sign-in, the Official BU
   list, roles and the Overview all rest on it. So a second dropdown that could
   disagree with the first is the pair §110 removed from this very dialog.

   THE ANSWER IS THAT A COMPANY IS SOMETIMES DERIVED AND SOMETIMES STORED, and
   which one it is depends on the unit beside it. Somebody in Mobile is in
   Distribution — the platform already knows, because `units.company` says so
   (§23) — so the field shows it and is read-only. Somebody with no unit is the
   case Islam is describing, and there the field is the answer and is written.
   One stored fact, two fields, and they cannot contradict each other because
   only one of them is ever writable.

   `null` for the group and for a function: neither belongs to a company, and
   answering "—" is the truth rather than a gap. */
function personCompany(p){
  if (!p) return null;
  if (p.company) return COMPANIES[p.company] ? p.company : null;
  if (p.unit && p.unit !== "group") {
    var u = UNITS[p.unit];
    return u && u.company && COMPANIES[u.company] ? u.company : null;
  }
  return null;
}
/* True where the unit beside it has already answered, so the control is shown
   and disabled rather than hidden — a field that appears and disappears as its
   neighbour changes is harder to read than one that greys (§59's rule: shown
   disabled with the reason, never hidden). */
function personCompanyDerived(p){
  return !!(p && p.unit && p.unit !== "group" && UNITS[p.unit] && UNITS[p.unit].company);
}
function companyChoices(){
  return activeCompanyKeys().map(function(c){
    return { v:c, label:COMPANIES[c].name };
  });
}

function personAtChoices(){
  var out = [{ v:"group", label:roleWhereLabel("group") }];
  UNIT_KEYS.forEach(function(k){
    if (UNITS[k].active !== false) out.push({ v:k, label:UNITS[k].name });
  });
  FUNCTION_KEYS.forEach(function(k){
    if (FUNCTIONS[k].active !== false)
      out.push({ v:"fn:" + k, label:FUNCTIONS[k].name + " (function)" });
  });
  /* THE COMPANIES LEFT THIS LIST (§135.6). They are their own field now, so
     offering them here as well would be one answer in two controls — which is
     the fault this whole change exists to avoid, arriving by the back door. */
  return out;
}

function mainbuAts(b){
  if (!b) return [];
  if (Array.isArray(b.at)) return b.at.filter(Boolean);
  return b.at ? [b.at] : [];
}
/* WHERE ONE NAME MEANS ONE PLACE, and null wherever it does not. A Main BU
   holding three units cannot say which of them somebody is in — that is the
   whole reason the question is asked at sign-in — so it answers nothing
   rather than guessing, and the person stays unattached until they say or the
   SMO decides. Callers that resolve a person go through here, so the guess is
   refused in one place rather than in each of them. */
function mainbuAt(name){
  var ats = mainbuAts(mainbuBy(name));
  return ats.length === 1 ? ats[0] : null;
}
function mainbuNames(){ return mainbus().map(function(b){ return b.name; }); }
/* Returns the stored name, so a caller can write back the client's casing
   rather than whatever the file happened to use. */
function addMainbu(name){
  var n = String(name == null ? "" : name).trim();
  if (!n) return null;
  var had = mainbuBy(n);
  if (had) return had.name;
  mainbuList().push({ name:n, at:null });
  return n;
}
/* Add and remove, never "set": the cell is a set of chips now, and a writer
   that took the whole list would make removing the last one indistinguishable
   from a stale screen sending an empty one. The key goes when it is empty, so
   an unmapped row is a row with no `at` rather than one with an empty array
   (§42's rule: a reader must never create the field it was looking for, and
   a writer should not leave an empty container behind either). */
function addMainbuAt(name, at){
  var b = mainbuBy(name);
  if (!b || !at) return false;
  var ats = mainbuAts(b);
  if (ats.indexOf(at) > -1) return false;
  ats.push(at);
  b.at = ats;
  return true;
}
function removeMainbuAt(name, at){
  var b = mainbuBy(name);
  if (!b) return false;
  var ats = mainbuAts(b).filter(function(x){ return x !== at; });
  if (ats.length) b.at = ats; else delete b.at;
  return true;
}
/* A rename carries the people with it. The name IS the key here — unlike a
   unit or a company, which have a key under the label precisely so a rename
   cannot detach anything — because it is the client's own word and arrives
   spelled that way in every file. So the rename has to move `p.mainbu` too,
   or the register would show people belonging to a name the list no longer
   holds. Refused if the new name is already taken: merging two departments is
   a decision, not a typo's side effect. */
function renameMainbu(oldName, newName){
  var b = mainbuBy(oldName);
  var n = String(newName == null ? "" : newName).trim();
  if (!b || !n) return false;
  var clash = mainbuBy(n);
  if (clash && clash !== b) return false;
  var was = b.name;
  b.name = n;
  PEOPLE.forEach(function(p){ if (mainbuKey(p.mainbu) === mainbuKey(was)) p.mainbu = n; });
  return true;
}
function peopleOfMainbu(name){
  var want = mainbuKey(name);
  return PEOPLE.filter(function(p){ return mainbuKey(p.mainbu) === want; });
}
/* REFUSED while people carry it, naming how many — the same contract as
   retiring a company that still holds units (§49.3). A list row is not a
   record of anything, so unlike a person or a unit it is deleted rather than
   retired; what makes that safe is exactly this refusal. */
function removeMainbu(name){
  var b = mainbuBy(name);
  if (!b || peopleOfMainbu(b.name).length) return false;
  var list = mainbuList();
  list.splice(list.indexOf(b), 1);
  if (!list.length) delete GROUP.mainbus;
  return true;
}

/* Where a Main BU may point, grouped the way the picker offers it. Retired
   companies and inactive units are still offered when something already
   points at them, for the same reason a role at a retired company is left
   alone: the pointer is a fact, and hiding it does not unmake it. */
function mainbuWheres(){
  return [
    { label:"The group", opts:[{ v:"group", label:"The group" }] },
    { label:"Business units", opts:UNIT_KEYS.map(function(k){
        return { v:k, label:UNITS[k].name }; }) },
    { label:"Supporting functions", opts:FUNCTION_KEYS.map(function(f){
        return { v:"fn:" + f, label:FUNCTIONS[f].name }; }) },
    { label:"Companies", opts:COMPANY_KEYS.map(function(c){
        return { v:"co:" + c, label:COMPANIES[c].name }; }) }
  ];
}

/* ── WHERE A PERSON SITS, AS ONE FACT ─────────────────────────────
   The register drew this inline and read `p.fn` then `p.unit`, which was
   right until a Main BU could point at a company: a person attached to
   Distribution has neither, and the cell read as a dash for somebody who is
   very much somewhere. It is one function now, in the vocabulary
   roleWhereLabel() already speaks, so the register and the file importer
   cannot answer it differently. */
function personAt(p){
  if (!p) return null;
  if (p.fn) return "fn:" + p.fn;
  if (p.company) return "co:" + p.company;
  if (p.unit) return p.unit;
  return null;
}
/* THE WRITING HALF IS SEPARATE, and it clears all three before setting one —
   a person who moves from a function to a unit and keeps `p.fn` is in two
   places, and personAt() would go on reporting the one they left. Roles are
   NOT touched: a unit head moved to Finance still heads that unit until
   somebody says otherwise, and that is a decision for the People page, not a
   side effect of a spreadsheet column. */
function attachPersonAt(p, at){
  if (!p) return;
  delete p.unit; delete p.fn; delete p.company;
  if (!at) return;
  if (at === "group") p.unit = "group";
  else if (String(at).indexOf("fn:") === 0) p.fn = String(at).slice(3);
  else if (String(at).indexOf("co:") === 0) p.company = String(at).slice(3);
  else p.unit = at;
}
/* Where the person's Main BU says they should be, which is not always where
   they are: the list can be re-pointed after a file was loaded, and somebody
   can be moved by hand afterwards. Neither is wrong, and neither should be
   silently reconciled — the register marks the disagreement and leaves it to
   be answered, because a mapping that quietly moved thirty people the next
   time a row changed would be the worst kind of helpful. */
function mainbuDrift(p){
  if (!p || !p.mainbu) return null;
  /* Only where the name means ONE place. A Main BU holding three units does
     not disagree with somebody sitting in one of the three — it contains
     them — so there is nothing to report. */
  var at = mainbuAt(p.mainbu);
  if (!at) return null;
  return at === personAt(p) ? null : at;
}
/* The short list a Main BU offers at sign-in: what it holds, or nothing when
   it holds nothing. Read on the SERVER as well (api/auth.js builds its own
   from the same stored rows), because a list the client narrowed is a list
   the client chose. */
function mainbuChoices(name){ return mainbuAts(mainbuBy(name)); }

/* ══════════════════════════════════════════════════════════════════
   THE REGISTER AS A FILE (§54.3, spec 011)

   Islam: "you give me a template download and upload for the data in the
   people register tab so I can upload an excel with the agreed on format to
   seed in the users."

   Eight columns, one row per person, and the SAME file both ways: what
   downloads is the register as it stands, so the template is also the export
   and a second upload amends rather than duplicates. That is §22's contract
   for a plan turned round — a plan is AUTHORED by upload because a plan is one
   whole thing, and a register is not: five hundred people arrive in batches,
   from an HR system nobody here controls, and a file that replaced the
   register would retire everybody it forgot to mention.

   SO AN UPLOAD ADDS AND AMENDS, AND NEVER REMOVES. A row not in the file is a
   person the file says nothing about. Retiring is a thing the file can ASK for
   — Status: Retired — and it does exactly what the row's own menu does,
   revoking their roles and closing the door, with the record they are named in
   left true (§35).

   MATCHED ON EMP ID (Islam, asked). Not the name, which two people share and
   one person changes; not the email, which changes with a mail domain. A row
   with no employee number is SKIPPED WITH A NOTICE rather than refused: the
   thirty-three people already in this tenant have no employee number, and a
   template that could be downloaded and not uploaded back is the fault §51.14
   records against the plan file.
   ══════════════════════════════════════════════════════════════════ */
/* TWO BU COLUMNS, AND THEY ARE NOT THE SAME QUESTION (§65). "Official BU" is
   the client's own word for a part of the business (§58); "BU" is what it opens
   HERE — the unit, function or company that decides access. The file carried
   only the first, so the second could be arrived at in one of two ways: the
   Official BU list mapping it to exactly one place, or the person declaring it
   at their first sign-in (§56).

   Islam: "the BU as far as I understand is the relation we have … we need this
   in the download template as if I know some of them I will upload it ready and
   we don't need to get them from the audience." Which is right, and it is the
   register's own vocabulary: the page shows both columns side by side, so the
   file it exports should carry both. */
var PEOPLE_FILE_COLS = ["Emp ID", "Full Name", "Name", "Job title", "Email",
                        "Mobile", "Official BU", "Unit", "Role", "Status"];
/* ── THE FILE CARRIES BOTH, AND THE OLD ONE STILL READS (§93.8) ───────
   Every file downloaded before today has a "Name" column holding the FULL
   name, so the new pair cannot simply take those headers: read blindly, an old
   file would put a five-part legal name into the short column and leave the
   full one empty.

   The rule is §58's, applied a third time — WRITE THE NEW LABEL, READ EITHER —
   with the twist that here the OLD header's meaning depends on what sits
   beside it. "Full Name" present means the file distinguishes the two and
   "Name" is the short one; "Full Name" absent means the file predates the
   split and its "Name" is the full one. That is decidable from the row itself,
   which is what makes it safe. */
function fileFullName(r){
  var full = r["Full Name"];
  if (full != null && String(full).trim() !== "") return full;
  return r["Name"];
}
function fileKnownName(r){
  var full = r["Full Name"];
  /* No "Full Name" column: the file says nothing about what somebody is
     CALLED, and guessing from the full name here would overwrite a short name
     the SMO had typed with the first two words of the legal one. */
  if (full == null || String(full).trim() === "") return "";
  return r["Name"];
}
/* "Unit" is the header the register shows and this file writes. "BU" is read
   as well, and always will be: it was the header for exactly one build of this
   column, and a header is a contract with every file already downloaded — the
   same rule the Official BU rename earned (§58). */
var PEOPLE_FILE_UNIT_WAS = "BU";
function fileUnit(r){
  var v = r["Unit"];
  return (v == null || String(v).trim() === "") ? r[PEOPLE_FILE_UNIT_WAS] : v;
}
/* AND THE OLD HEADER IS STILL READ. "Main BU" became "Official BU" for the
   client's own clarity (§58), and a header is a CONTRACT: somebody is holding
   a file downloaded before the rename with the old word at the top of that
   column, and refusing it would be §54.4's fault — the platform turning away
   its own export — arriving through a relabelling instead of through a rule.
   Written as the new name, read as either. */
var PEOPLE_FILE_BU_WAS = "Main BU";
function fileBu(r){
  var v = r["Official BU"];
  return (v == null || String(v).trim() === "") ? r[PEOPLE_FILE_BU_WAS] : v;
}
/* EVERY PLACE A PERSON CAN SIT, in the words roleWhereLabel() already speaks —
   the same words the Official BU list's chips and the register's BU column
   show, so the file and the screen cannot describe the same thing differently.
   The "(function)" suffix is not decoration: this tenant has a unit called IT
   and a function called IT, and a bare "IT" in a spreadsheet names neither. */
function placeOptions(){
  var out = [];
  mainbuWheres().forEach(function(g){
    g.opts.forEach(function(o){ out.push({ v:o.v, label:roleWhereLabel(o.v) }); });
  });
  return out;
}
/* The reverse, and it REFUSES an ambiguous name rather than picking one. Two
   things sharing a name is the accident this guards, and resolving it by
   whichever came first in the array is the silent wrong answer §61 refused for
   capabilities. Returns one of { at }, { ambiguous:[…] } or { unknown:true }. */
function placeByLabel(name){
  var want = String(name == null ? "" : name).trim().toLowerCase();
  if (!want) return { at:null };
  if (want === "the group" || want === "group") return { at:"group" };
  var opts = placeOptions();
  var exact = opts.filter(function(o){ return o.label.toLowerCase() === want; });
  if (exact.length > 1) return { ambiguous:exact.map(function(o){ return o.label; }) };
  if (exact.length === 1) {
    /* AN EXACT MATCH IS ANSWERED, AND THE NEAR MISS IS NAMED. This tenant has
       a business unit called IT and a supporting function called IT: "IT" is
       the unit's own name and resolving it to the unit is correct, so refusing
       it would turn a right answer into an error message. But somebody typing
       it meaning the FUNCTION gets the unit and is told nothing — the silent
       wrong answer §61 refused for capabilities, arriving where a refusal
       would be wrong. So it resolves AND says what else it could have been,
       as a notice on the review before Apply is pressed. */
    var near = opts.filter(function(o){
      return o.v !== exact[0].v &&
             o.label.replace(/\s*\(function\)$/i, "").toLowerCase() === want;
    });
    return near.length
      ? { at:exact[0].v, alsoCould:near.map(function(o){ return o.label; }),
          chose:exact[0].label }
      : { at:exact[0].v };
  }
  /* A name typed without the suffix the download writes. Accepted where it can
     only mean one thing, refused by name where it cannot. */
  var bare = opts.filter(function(o){
    return o.label.replace(/\s*\(function\)$/i, "").toLowerCase() === want;
  });
  if (bare.length === 1) return { at:bare[0].v };
  if (bare.length > 1) return { ambiguous:bare.map(function(o){ return o.label; }) };
  return { unknown:true };
}

/* Written by the download, ignored by the upload. A person may hold three
   roles and the Role column holds one, so the rest are shown rather than
   silently dropped from the file — what the column cannot carry, the sheet
   still has to say. */
var PEOPLE_FILE_EXTRA = "Also holds";

function fileTxt(v){ return String(v == null ? "" : v).trim(); }

/* The role a name in the file means. Matched on the role's own label, because
   that is what the dropdown offers and what somebody reading the sheet sees —
   "Strategy custodian", never "custodian".

   ── AND IT READS THE NAMES THESE ROLES USED TO HAVE (§116) ──────────
   Islam shortened two of them: "Business unit owner" is BU owner and
   "Supporting function head" is Function head. The workbook WRITES the new
   label and READS EITHER, which is §58's rule and §65's — a header, or here a
   value, is a contract, and somebody is holding a file downloaded before the
   rename. The old spellings live here and nowhere else: they are not roles,
   they are things a file might say.

   Never the other way round. A file saying "BU owner" must not have been
   readable before the name existed, so nothing is added to ROLES; and the
   template's dropdown is built from ROLES, so it offers only the current
   word. */
var ROLE_NAMES_WERE = {
  "business unit owner": "owner",
  "supporting function head": "fnhead"
};
function roleKeyByName(name){
  var want = fileTxt(name).toLowerCase();
  if (!want) return null;
  var hit = ROLES.filter(function(r){ return r.name.toLowerCase() === want; })[0];
  if (hit) return hit.key;
  return ROLE_NAMES_WERE[want] || null;
}
/* Contributor is not granted and never has been: it is what personRoles()
   reads off somebody attached to a unit and holding nothing else (§49.5). A
   file naming it would be asking for a role that arrives by itself, so the
   template does not offer it and the reader says so plainly. */
/* ── AND A SEAT IS NOT OFFERED BY SOMEBODY WHO MAY NOT GIVE ONE (§186) ──
   Islam, from the deployment: "hussein khaled is a custodian and getting the
   super user." The picker offered every role to anybody who could reach it,
   and commits on the `change` event — so the most powerful grant in the
   product was ONE selection with nothing in between, and the only thing that
   ever stopped it was the server refusing the save afterwards.

   THE SAME QUESTION THE SERVER ASKS (§42): `mayEditAccess()`, because
   granting a seat IS changing who may do what, which is why the authoriser
   has always classified it as `access`. Asked of the person doing the
   granting, never of the person receiving it. */
function roleIsGrantable(key, by){
  if (!key || SMPRules.isOwnLinesRole(key)) return false;
  if (!SMPRules.isSeatRole(key)) return true;
  return SMPRules.mayEditAccess(world(), by || viewer());
}
/* ══ WHO NEEDS ATTENTION, IN ONE ORDERED QUEUE (§116) ═════════════════
   Islam: "I want it to become a button at top showing pending requests …
   that opens the profiles that needs attention in the pop up modal that
   fixes and save and move to the next in the same place."

   THE COUNT AND THE QUEUE ARE THE SAME LIST. The register used to carry six
   alarm chips across its header, each naming a number and pointing at rows you
   then had to find by eye — which is the whole of his "I don't know which
   lines I should go and check". A number that cannot take you to what it
   counts is a number that makes work (§16.7's rule, applied to a notice).

   ONE ENTRY PER PERSON, not per problem. Somebody with no password AND no
   email is one stop with two things to fix, because the dialog shows their
   whole row — two entries would mean opening the same person twice.

   WHAT IS DELIBERATELY NOT HERE: units with no custodian. It is a real thing
   to fix and it is not a PERSON, so it cannot be a stop in a queue of people;
   it keeps a line of its own that names the units (§93.4). Putting it in would
   mean a queue entry with nobody to open.

   ORDER IS WORST FIRST, and within a kind by name, so the queue is stable
   between two people looking at it — it is answered top-down and a queue that
   reorders itself under you is one nobody finishes. */
/* `dupes` is passed in, never read off the render's own local (§53.5): the
   register computes `registerDupes()` once per paint and this is called from
   the header inside that same paint, so reaching for its variable would have
   worked by accident and broken the moment anything else asked. */
/* ── AN ATTENTION ITEM YOU CAN ANSWER (§190) ────────────────────────────
   Islam: *"attention items that stays attention item is a problem — always
   give me the option to dismiss."* He was looking at HIS OWN ROW, flagged for
   holding Super user, by §187's rule, which assumed seat holders sit at the
   group and had never met an office that sits in a function. The rule is not
   wrong so much as unknowable: **nothing can tell an intended seat from an
   accidental one**, and §180 had already settled the shape for exactly that
   case — the office looks, and says.

   ONE DISMISS FOR EVERY KIND, not a second special case beside the
   declaration's. That one is its own thing because it lives OUTSIDE the state
   graph (§56 — a save truncates thirty tables and a declaration must survive
   it); every other item is about the register's own row, so the answer rides
   the row.

   A DISMISSAL REMEMBERS WHAT IT ANSWERED, never merely that it was pressed.
   `attnMark()` fingerprints the FACT — which seat, which address, which
   collision — and the item comes back the moment the fingerprint changes. So
   dismissing "they hold Super user" says nothing about the NEXT seat somebody
   is given, which is precisely the fault §186 exists to catch and would
   otherwise be silenced for ever by one press. §180's rule ("saying it again
   clears the answer"), applied to every kind at once.

   STORED AS AN ABSENCE (§50.6): `p.attnOff` exists only while something is
   dismissed, and the last key leaving deletes it — so a register nobody has
   answered and one answered and re-raised are byte-identical, and no save
   carries a phantom change. It rides `people.extra`, so nothing is migrated
   (§177 proved that round trip against a real Postgres).

   THE SERVER NEEDS NOTHING: a change to a person's row that is not their seat
   and is not a removal already classifies as `setup`, which is the office's
   (§42's fall-through doing its job). */
var FROZEN_ATTN = Object.freeze({});
function attnOff(p){ return (p && p.attnOff) || FROZEN_ATTN; }
/* What was answered, as a fact rather than a timestamp. A kind with no
   fingerprint here is one whose facts are simply present or absent, and "" is
   an honest fingerprint for that. */
function attnMark(kind, p){
  if (!p) return "";
  if (kind === "seat") {
    var seat = SMPRules.seatOutOfPlace(world(), p, personAt(p));
    return seat ? seat.role + "@" + seat.at + "|" + (personAt(p) || "") : "";
  }
  if (kind === "noemail" || kind === "noident")
    return String(p.email || "") + "|" + String(p.empId || "");
  /* A COLLISION IS WHO IT IS WITH AND WHAT ON, never a name: two rows sharing
     an address and the same two rows sharing an employee number are two
     different things to look at, and answering one must not answer the other
     (§87). Sorted, so the same pair fingerprints the same way from either
     row. */
  if (kind === "dupe")
    return personDupe(p, registerDupes()).map(function(x){
      return x.kind + ":" + (x.rows || []).map(function(r){
        return r && r.key; }).filter(Boolean).sort().join(","); }).sort().join("|");
  /* A NAME THAT READS THE SAME is answered by amending a Name, so the name is
     the fact. */
  if (kind === "samename")
    return String(readName(p) || p.name || "");
  return "";
}
function attnDismissed(p, kind){
  var was = attnOff(p)[kind];
  return was !== undefined && was === attnMark(kind, p);
}
function setAttnOff(p, kind, on){
  if (!p) return;
  if (on) {
    p.attnOff = p.attnOff || {};
    p.attnOff[kind] = attnMark(kind, p);
    return;
  }
  if (!p.attnOff) return;
  delete p.attnOff[kind];
  if (!Object.keys(p.attnOff).length) delete p.attnOff;
}
/* WHICH BOX THE ISSUE IS ABOUT (§190). Islam: "mark the issue box with some
   sort of surrounding outline to make sure I understand what is the issue."
   The label the dialog draws, so the outline lands on the control that
   answers it — and a kind with no field says so rather than pointing
   somewhere plausible. */
var ATTN_FIELD = {
  seat:     "Roles",
  said:     "Unit or function",
  noident:  "Emp. ID",
  noemail:  "Email",
  dupe:     "Name",
  samename: "Name",
  nopw:     null
};
/* AND THE ONE KIND THAT ALREADY HAD AN ANSWER (§180). A declaration is
   accepted or dismissed on its own note, in the field itself, because it lives
   outside the state graph and its answer goes to the server rather than onto
   the row. It still gets the outline — it is an issue, and the outline is what
   says which box — and deliberately not a second Dismiss beside the one that
   is already there (§53.5: one question, one control). */
var ATTN_OWNCTRL = { said: 1 };

function attentionOf(p, all){
  if (!p || !personActive(p)) return null;
  var why = [];
  /* A COLLISION FIRST: two rows that are one human is the fault that makes
     every other count wrong (§87). */
  var d = all || registerDupes();
  var dupes = personDupe(p, d);
  if (dupes.length) why.push({ kind:"dupe", say: dupeSentence(dupes) });
  /* Then what they SAID about themselves, which is a question waiting on an
     answer rather than a gap (§56). */
  /* §180: read through saidAt()/saidOutstanding(), never out of the map —
     an ANSWERED claim is not waiting on anybody, and the queue, the count and
     the row's mark must not be able to disagree about the same row (§53.5). */
  var said = saidAt(p.key);
  /* ONE VOCABULARY PER SENTENCE (§116.9). This names two places and
     compares them, so both halves must be spelt by the same function or a
     match reads as a difference — `roleWhereLabel` on both, which is what
     the row's own hover already says (§93.12 keeps `placeLabel` for the
     Unit CELL, where there is nothing to compare against). And it is not
     `whereLabel`, which is a LOCAL alias inside renderPeople() and invisible
     from here: the crash needed a declaration AND a register placement that
     disagree, so it lived only over HTTP (§94.11) and only for somebody
     already placed — the one case the queue's own check had not made. */
  /* ── A SEAT SITTING SOMEWHERE ELSE (§186) ─────────────────────────
     Islam, having found a custodian wearing Super user: "this might be
     repeated somewhere else and people are getting super user." So the
     register watches, rather than the answer being a list I read out once.

     THE TEST IS THE PLACE, not "holds a seat and something else": the
     bootstrap SMO holds super@group AND heads the SMO function (§118), so
     the two-roles reading would nag about the one row that is certainly
     right. A seat is held where the person sits; one held somewhere else is
     the shape of an accident, and it is exactly what the chrome's own role
     line already prints with a place beside it (§178).

     IT SORTS ABOVE EVERYTHING BUT A COLLISION. Somebody holding rights
     nobody meant to give them is not a gap to fill in when convenient. */
  var seat = SMPRules.seatOutOfPlace(world(), p, personAt(p));
  if (seat)
    why.push({ kind:"seat", say:"They hold " + roleName(seat.role) + " over " +
      roleWhereLabel(seat.at) + ", and they sit in " +
      (personAt(p) ? roleWhereLabel(personAt(p)) : "no part of the business") +
      ". A seat is the Super user\u2019s to give \u2014 take it off with the \u00d7 " +
      "on the chip if nobody meant to." });
  if (saidOutstanding(p))
    why.push({ kind:"said", say:"They said they work in " + roleWhereLabel(said) +
      (personAt(p) ? " \u2014 the register says " + roleWhereLabel(personAt(p)) : "") + "." });
  /* Then the two gaps. NULL IS NOT ZERO (§93): PWSTATES is null until the
     server has been asked and carries __error when the ask failed, and neither
     is "they have no password" — so neither puts anybody in the queue. */
  if (!personIdentified(p))
    why.push({ kind:"noident", say:"No employee number and no email, so the next " +
      "upload cannot match this row and will add them again." });
  else if (!String(p.email == null ? "" : p.email).trim())
    why.push({ kind:"noemail", say:"No email address, so they cannot sign in with one." });
  /* AND ONLY WHERE THE VIEWER COULD ISSUE ONE (§89, §116.9). The Overview's
     row counts `passwordReach()` and this counted everybody, so a Super user
     with no password put a row in the queue that the person working through
     it has no control to clear — §16.7's fault inside §116.2's own list, and
     two surfaces answering one question differently is the drift §53.5 names.
     Asked through mayIssuePasswordTo(), never by re-testing the roles. */
  if (PWSTATES && !PWSTATES.__error && PWSTATES[p.key] === "none" &&
      personActive(p) && p.key !== viewer().key && mayIssuePasswordTo(p))
    why.push({ kind:"nopw", say:"They have never been issued a password." });
  /* LAST, TWO PEOPLE WHOSE NAME READS THE SAME (§131). Islam: "you normally
     take the first 2 names but you allow me to amend the name in the edit —
     notify me as an issue to address if 2 people their 1st 2 names are the
     same so I can edit one of them." §81.1 lengthens the GUESS so the
     register itself stays readable; this is the other half — the pair still
     reads as one name out loud, and a TYPED value that collides is never
     lengthened at all — so each of them queues until a Name is amended to
     read apart, which is exactly what clears it. NOT a duplicate and last in
     the order: two people really can be "Ahmed Mostafa" (§87). Anybody this
     row already flags as a possible duplicate is left to that flag — telling
     the SMO to RENAME a row that may need MERGING sends them to the wrong
     control, and the identical twins would otherwise be said twice. */
  var reads = (d.read || {})[readKey(p)];
  if (reads && reads.length > 1) {
    var flagged = {};
    dupes.forEach(function(x){ (x.rows || []).forEach(function(r){
      if (r && r.key) flagged[r.key] = 1; }); });
    var others = reads.filter(function(x){
      return x.key !== p.key && !flagged[x.key]; });
    if (others.length)
      why.push({ kind:"samename", say:"They read as \u201c" + readName(p) +
        "\u201d, and so " + (others.length === 1 ? "does " + others[0].name
          : "do " + others.map(function(x){ return x.name; }).join(" and ")) +
        ". Amend a Name so each reads apart." });
  }
  /* ── AND WHAT THE OFFICE HAS ALREADY ANSWERED (§190) ──────────────
     Filtered HERE, at the one place every surface reads — the queue, the
     count, the button, the Overview row and the welcome screen all come
     through `attentionOf()`, so a dismissal that were applied at any one of
     them would leave the others still counting it (§53.5, and §116.2's own
     rule that the count and the queue are the same list).

     EACH ENTRY CARRIES WHERE IT POINTS, so the dialog can outline the control
     that answers it rather than leaving somebody to guess which of nine boxes
     the sentence is about. */
  why = why.filter(function(w){ return !attnDismissed(p, w.kind); })
           .map(function(w){
             w.at = ATTN_FIELD[w.kind] || null;
             w.own = !!ATTN_OWNCTRL[w.kind];
             return w;
           });
  return why.length ? { key:p.key, why:why } : null;
}
/* The sentence a duplicate makes, said once so the chip and the queue cannot
   describe the same pair differently (§53.5). */
function dupeSentence(dupes){
  var WORD = { empId:"employee number", email:"address", name:"name", likely:"name" };
  return dupes.map(function(d){
    var others = (d.rows || []).filter(function(x){ return x.key !== d.key; })
                   .map(function(x){ return x.name; });
    if (d.kind === "likely") {
      var o = personBy(d.other);
      return "This row reads like " + (o ? o.name : d.other) + ". Two people, or one twice?";
    }
    return "The same " + (WORD[d.kind] || d.kind) + " is on another row" +
           (others.length ? " (" + others.join(", ") + ")" : "") + ".";
  }).join(" ");
}
/* §186: `seat` sits directly under `dupe`. A collision is first because it
   makes every other count wrong; rights nobody meant to give are second
   because they are the only entry here that is not a gap to fill in when
   convenient. A row can carry both, and `why[0]` is what it sorts on. */
var ATTN_ORDER = ["dupe", "seat", "said", "noident", "noemail", "nopw", "samename"];
function attentionQueue(){
  var out = [];
  var all = registerDupes();          /* once for the whole queue, not per row */
  PEOPLE.forEach(function(p){
    var a = attentionOf(p, all);
    if (a) out.push(a);
  });
  out.sort(function(a, b){
    var ra = ATTN_ORDER.indexOf(a.why[0].kind), rb = ATTN_ORDER.indexOf(b.why[0].kind);
    if (ra !== rb) return ra - rb;
    var na = (personBy(a.key) || {}).name || "", nb = (personBy(b.key) || {}).name || "";
    return na.localeCompare(nb);
  });
  return out;
}

/* ── THE WORD FOR WHERE A ROLE IS HELD (§110) ─────────────────────────
   For the sentence a refused pick shows, and for nothing else. It is a LABEL,
   not a second rule: `roleWheres()` still decides what may be held where, and
   this only says it in English — so a role whose list changes cannot end up
   with a sentence that contradicts the list.

   Derived from the list rather than written beside it, for the same reason:
   the kinds actually offered are what the person has to pick from. */
function roleAtWord(roleKey){
  var kinds = {};
  roleWheres(roleKey).forEach(function(w){
    kinds[w.v === "group" ? "group"
        : String(w.v).indexOf("fn:") === 0 ? "fn"
        : String(w.v).indexOf("co:") === 0 ? "co" : "unit"] = 1;
  });
  var WORD = { group:"the group", unit:"a business unit",
               fn:"a supporting function", co:"a company" };
  var out = Object.keys(kinds).map(function(k){ return WORD[k]; });
  if (!out.length) return "somewhere that does not exist yet";
  if (out.length === 1) return out[0];
  return out.slice(0, -1).join(", ") + " or " + out[out.length - 1];
}

/* Reads the sheet against the stored world and says what would happen. It
   changes NOTHING — the review step exists so that an upload is looked at
   before it lands, exactly as a plan's is, and a reader that mutated on the
   way past would make the review a report of what had already been done. */
function planPeopleFile(rows){
  var plan = { rows:[], problems:[], notices:[], newBus:[] };
  var seenId = {};
  /* The disambiguated guesses, once for the whole file (§93.8), so a row whose
     Name column repeats what the register already shows is not offered as a
     change to take. */
  var dnames = displayNames();

  /* ── AN ADDRESS MAY ONLY EVER REACH ONE ROW (§83, kept whole) ─────
     Sign-in takes the address on the register, so two people holding one turns
     BOTH of them away (§69.23). A file that hands the same address to two rows
     is therefore refused at the door rather than applied and cleaned up after.

     ORDER MUST NOT DECIDE WHO IS THE IMPOSTOR. Written as a running tally the
     first row to claim an address won it, so a new person listed above the
     person who already holds it took it and the rightful owner was refused
     their own row. The occupancy is worked out for the WHOLE FILE before the
     loop, so no row's verdict depends on where it sits.

     TWO THINGS §87 CHANGED, AND BOTH FOLLOW FROM THE LADDER.

     The holder's own row may carry NO EMPLOYEE NUMBER at all, because a row
     with none is now matched on the address itself — so where exactly one
     claim is ID-less, that claim is the holder's. Two ID-less rows on one
     address say nothing about which is the holder, and both are refused.

     And a SINGLE claim on an address somebody already holds is handed to the
     conflict path instead of refused. It is the one case where the file is not
     contradicting itself but contradicting the register — the row may be that
     person under a new employee number, or a new colleague given a leaver's
     address, and those need a person to tell them apart (§87.5). What the
     conflict does NOT offer is adding a third person, for exactly the reason
     this pre-pass exists. */
  function addrOf(r){ return fileTxt(r["Email"]).toLowerCase(); }
  var addrPlan = {};
  (function(){
    var by = {};
    (rows || []).forEach(function(r, i){
      var a = addrOf(r);
      if (!a) return;
      (by[a] = by[a] || []).push({ at:"Row " + (i + 2), id:fileTxt(r["Emp ID"]) });
    });
    Object.keys(by).forEach(function(a){
      var claims = by[a];
      var holder = PEOPLE.filter(function(x){
        return personActive(x) && personMailKey(x.email) === a;
      })[0];
      var keep = null;
      if (holder) {
        /* The row that IS the holder — by employee number, or by carrying no
           number at all where it is the only such row (§87.1's ladder). */
        var mine = claims.filter(function(c){
          var e = c.id && personByEmpId(c.id);
          return e && e.key === holder.key;
        })[0];
        if (!mine) {
          var idless = claims.filter(function(c){ return !c.id; });
          if (idless.length === 1) mine = idless[0];
        }
        keep = mine ? mine.at : null;
        /* ONE ROW, AND IT IS NOT THEIRS: a question, not a refusal. */
        if (!mine && claims.length === 1) return;
      } else if (claims.length === 1) {
        keep = claims[0].at;
      }
      var refuse = claims.filter(function(c){ return c.at !== keep; })
                         .map(function(c){ return c.at; });
      if (!refuse.length) return;
      addrPlan[a] = { refuse: refuse, msg: function(at){
        if (holder && keep) {
          return "the address " + a + " already belongs to " + holder.name +
            " on the register (" + keep + "). Sign-in takes the address, so a second " +
            "person holding it would turn both of them away.";
        }
        if (holder) {
          return "the address " + a + " already belongs to " + holder.name +
            " on the register. Sign-in takes the address, so giving it to a second " +
            "person would turn both of them away.";
        }
        return "the address " + a + " is on " + claims.length + " rows of this file (" +
          claims.map(function(c){ return c.at; }).join(", ") + "). Sign-in takes the " +
          "address, so nobody sharing one can get in — give each person their own.";
      } };
    });
  })();
  (rows || []).forEach(function(r, i){
    /* THE FILE'S OWN ROW NUMBER, not the index. Whoever fixes a problem is
       looking at Excel, where the header is row 1 and the first person is row
       2 — an off-by-one here sends them to the wrong line, which is worse than
       no line at all. */
    var at = "Row " + (i + 2);
    var id     = fileTxt(r["Emp ID"]);
    var name   = fileTxt(fileFullName(r));
    var known  = fileTxt(fileKnownName(r));
    var email  = fileTxt(r["Email"]);
    var mainbu = fileTxt(fileBu(r));
    var role   = fileTxt(r["Role"]);
    var status = fileTxt(r["Status"]);
    var label  = name || id || email || "this row";

    /* ── THE LADDER, ROW BY ROW (§87.5) ────────────────────────────
       Emp ID, then email, then nothing — personByIdentity()'s rule, asked
       here so the review can SAY which rung answered. A row with neither is
       still left alone: there is nothing to match it on and nothing to add it
       under, and inventing a person from a name is exactly what put three
       humans on this register twice. */
    if (!id && !email) {
      plan.notices.push({ at:at, msg:'"' + label + '" has no employee number and no email, so ' +
        'there is nothing to match them on. Left exactly as they are.' });
      return;
    }
    if (id && seenId[id]) {
      plan.problems.push({ at:at, msg:'employee number ' + id + ' is used twice in this file — ' +
        'also on ' + seenId[id] + '. One row per person.' });
      return;
    }
    if (id) seenId[id] = at;
    /* AN ADDRESS TWO ROWS OF THIS FILE BOTH CLAIM, or one this file gives to
       somebody who is not its holder (§83). Worked out for the whole file
       above, so the verdict does not depend on where a row sits. */
    if (addrPlan[addrOf(r)] && addrPlan[addrOf(r)].refuse.indexOf(at) > -1) {
      plan.problems.push({ at:at, msg:addrPlan[addrOf(r)].msg(at) });
      return;
    }

    /* AN ADDRESS ON TWO ROWS ANSWERS NOTHING, and the file cannot decide which
       of them it meant. It is a problem rather than a question, because the
       fix is on the register and there is now a control for it — the answer
       is to merge those two rows, not to pick one here and leave the pair
       standing (§87.4). */
    var mailHits = peopleByEmail(email);
    if (mailHits.length > 1) {
      plan.problems.push({ at:at, msg:email + ' is on ' + plural(mailHits.length, "row") +
        ' of the register already (' + mailHits.map(function(p){ return p.name; }).join(", ") +
        '). Merge those rows first — the ⋮ menu on either one.' });
      return;
    }
    var byId = personByEmpId(id), byMail = mailHits[0] || null;
    var existing = byId || byMail;
    var matchedBy = byId ? "empId" : (byMail ? "email" : null);

    /* ── THE TWO CONFLICTS, AND NEITHER IS GUESSED (§87.5) ─────────
       Islam: "adding a new person of course should conflict, but the name is
       not the challenge — the identifier really would be the ID and the
       email."

       Both of these are a row whose two identifiers disagree, and the platform
       cannot know which is right: an employee number and an address that point
       at two DIFFERENT people (a recycled address, a mistyped number, or two
       rows that are really one person), and an address already here arriving
       under a number the register has never seen (a new payroll system, or a
       genuinely new colleague given a leaver's address).

       APPLYING EITHER READING SILENTLY IS THE FAULT. Matching on the number
       would quietly move somebody else's address; matching on the address
       would quietly renumber somebody. So the row is set aside, the two
       readings are named with the people they mean, and nothing in the file
       can be applied until every one of them has been answered. */
    var conflict = null;
    if (byId && byMail && byId.key !== byMail.key) {
      conflict = { kind:"twoPeople", byId:byId, byMail:byMail };
    } else if (!byId && id && byMail) {
      conflict = { kind:"newId", byId:null, byMail:byMail };
    }

    if (!existing && !conflict && !name) {
      plan.problems.push({ at:at, msg:(id ? 'employee number ' + id : email) +
        ' is not on the register and the row has no name, so there is nobody to add.' });
      return;
    }

    /* An unknown department is ADDED TO THE BU LIST, unmapped, rather than
       refused. It is how the ten names arrive in the first place: a fresh
       tenant has an empty list, and demanding it be typed before the first
       file can be read is the trap §22 walked into when a locked dropdown
       meant a first plan could not be authored from the template. What the
       name POINTS AT is still the SMO's to say, on the BU list page. */
    var bu = mainbu ? mainbuBy(mainbu) : null;
    if (mainbu && !bu) {
      var already = plan.newBus.filter(function(n){
        return mainbuKey(n) === mainbuKey(mainbu); })[0];
      if (!already) {
        plan.newBus.push(mainbu);
        plan.notices.push({ at:at, msg:'"' + mainbu + '" is not on the BU list yet. It will be ' +
          'added, pointing at nothing until you map it on Setup → Official BU list.' });
      }
    }
    /* The stored spelling wins, so "support function" typed in a hurry does
       not become a second department beside "Support Function". */
    var buName = bu ? bu.name : mainbu;
    /* THROUGH mainbuAt(), NEVER off the row (§57). A Main BU that holds
       several places cannot say which of them somebody is in, so it answers
       nothing and the person arrives unattached — the sign-in picker offers
       them those few and the SMO accepts. Read straight off `bu.at` this
       attached people to the ARRAY, which is not a place at all. */
    var where  = bu ? mainbuAt(bu.name) : null;

    /* THE BU COLUMN WINS WHERE IT IS FILLED (§65). The Official BU is a name
       from the client's own records and only says where somebody sits when it
       maps to exactly ONE place; this column says it outright. Blank means
       "nothing to say", as every other cell in this file does — so leaving it
       empty keeps the Official BU mapping, and leaving BOTH empty keeps
       whatever the person already has. */
    var buCell = fileTxt(fileUnit(r));
    if (buCell) {
      var hit = placeByLabel(buCell);
      if (hit.ambiguous) {
        plan.problems.push({ at:at, msg:'"' + buCell + '" could be ' +
          hit.ambiguous.join(" or ") + '. Write it exactly as the download does, ' +
          'so the row says which.' });
        return;
      }
      if (hit.unknown) {
        plan.problems.push({ at:at, msg:'there is no business unit, supporting function ' +
          'or company called "' + buCell + '". Choose one from the dropdown in the Unit ' +
          'column, or leave it blank to keep where they are.' });
        return;
      }
      /* ONLY WHERE IT WOULD MOVE SOMEBODY. The download writes "IT" for the
         IT business unit, which is exactly what a hand-typed ambiguous "IT"
         looks like — so noticing on the value alone made the platform report
         four notices about its own export, which is §54.4 arriving through a
         warning instead of a refusal. A row that leaves somebody where they
         already are has nothing to warn about. */
      if (hit.alsoCould && (!existing || personAt(existing) !== hit.at)) {
        plan.notices.push({ at:at, msg:'"' + buCell + '" is ' + hit.chose + ' here. There is ' +
          'also ' + hit.alsoCould.join(" and ") + ' \u2014 write that in full if it is what ' +
          'you meant.' });
      }
      where = hit.at;
    }

    var roleKey = null;
    if (role) {
      roleKey = roleKeyByName(role);
      /* A ROLE THEY ALREADY HOLD IS NOT AN ASK (§54.4). Found by the round
         trip and not by reading: the download writes each person's current
         role, so 31 of the demo's 33 rows came back naming a role the file
         then could not place — their Main BU is empty, a role is held over
         their own BU, and the platform refused its own export. A template
         that cannot be uploaded back is the fault §51.14 records against the
         plan file, arriving in a second file.

         The rule that fixes it is the one the column already promised: this
         column GIVES a role, it never takes one away. If they hold it there
         is nothing to give, so there is nothing to check and no BU needed.
         What it will not do is MOVE one — a custodian of Mobile whose BU says
         Retail stays custodian of Mobile, because moving a custodianship is a
         real act and a spreadsheet column that did it as a side effect would
         do it to everybody at once. */
      if (!roleKey) {
        plan.problems.push({ at:at, msg:'"' + role + '" is not one of the roles. Choose from the ' +
          'dropdown in the Role column.' });
        return;
      }
      /* A SEAT NAMED IN A FILE IS THE SAME GRANT BY ANOTHER ROAD (§186), so
         it is refused for the same reason and the sentence says which of the
         two refusals this is — a role that cannot be granted at all, and a
         role this person cannot be the one to grant, send somebody to two
         different places. */
      if (SMPRules.isSeatRole(roleKey) && !roleIsGrantable(roleKey)) {
        plan.problems.push({ at:at, msg:'"' + role + '" is a seat, and seats are ' +
          'the Super user\u2019s to give. Ask them to set this one on the register.' });
        return;
      }
      if (!roleIsGrantable(roleKey)) {
        plan.problems.push({ at:at, msg:'Contributor is not given — it is what somebody attached ' +
          'to a unit and holding nothing else already is. Leave Role blank.' });
        return;
      }
      /* NOT WHILE THE ROW IS A CONFLICT. "They already hold it" is read off
         the person the row was matched to, and a conflict has not been matched
         to anybody yet — dropping the grant on one reading would silently drop
         it on the other (§87.5). */
      var holdsIt = !conflict && existing &&
        personRoles(existing).some(function(r){ return r.role === roleKey; });
      /* Cleared BEFORE anything is asked of it, and the checks below are then
         skipped rather than run against a role nobody is granting. Written the
         other way round first — cleared, then checked — it fell into "is this
         grantable?" holding null and reported every one of those 31 rows as
         asking for Contributor. */
      if (holdsIt) roleKey = null;

      /* A ROLE IS ALWAYS HELD OVER SOMETHING, and the file does not say over
         what: Islam's ruling is that it is always their own BU, which is what
         keeps the template to one column. So a role needs the Main BU to point
         somewhere, and it needs to point at somewhere that role can be held —
         "Business unit owner" of a supporting function is not a thing, and the
         refusal names what the role does admit rather than just saying no. */
      if (roleKey && !where) {
        plan.problems.push({ at:at, msg:'"' + roleName(roleKey) + '" is held over the person’s own ' +
          'BU, and ' + (buName ? '"' + buName + '" points at nothing yet' : 'this row names no BU') +
          '. Map it on Setup → Official BU list, or leave Role blank and give it on the register.' });
        return;
      }
      if (roleKey && !roleWheres(roleKey).some(function(w){ return w.v === where; })) {
        plan.problems.push({ at:at, msg:'"' + roleName(roleKey) + '" cannot be held over ' +
          roleWhereLabel(where) + ', which is what "' + buName + '" points at.' });
        return;
      }
    }

    var wantActive = null;
    if (status) {
      var st = status.toLowerCase();
      if (st === "active") wantActive = true;
      else if (st === "retired") wantActive = false;
      else {
        plan.problems.push({ at:at, msg:'"' + status + '" is not a status. It is Active or Retired.' });
        return;
      }
    }

    /* ── AN ADDRESS ON TWO ROWS, CAUGHT WHERE IT ARRIVES (§83) ────────
       The file was checked for a repeated employee number and never once for a
       repeated ADDRESS, in either direction — against another row of the same
       file, or against somebody already on the register. Both landed silently,
       and the consequence does not show up here at all: the door refuses BOTH
       people with the correct password (§69.23), neither is told why, and the
       only surface that would ever say so is the register's own duplicate mark
       (§81.2) — a page nobody visits after an upload that reported no problems.

       A PROBLEM, NOT A NOTICE: the row is refused rather than applied. An
       address is what somebody signs in with, so importing a collision breaks
       two people who were working — and unlike a missing BU there is no
       sensible half-answer to fall back on.

       ORDER MUST NOT DECIDE WHO IS THE IMPOSTOR (found by the check). Written
       as a running tally, the first row to claim an address won it — so a NEW
       person listed above the person who already holds that address took it,
       and the rightful owner was refused their own row. The occupancy is worked
       out for the whole file BEFORE the loop, so the answer does not depend on
       where a row sits: the person who already holds it keeps it, and if nobody
       holds it the file is ambiguous and every row claiming it is refused —
       §69.23's stance at the door, applied one step earlier. */
    if (addrPlan[addrOf(r)] && addrPlan[addrOf(r)].refuse.indexOf(at) > -1) {
      plan.problems.push({ at:at, msg:addrPlan[addrOf(r)].msg(at) });
      return;
    }

    var row = { at:at, id:id, key:existing ? existing.key : null,
                matchedBy:matchedBy,
                name:name || (existing ? existing.name : ""),
                /* Never falls back to the existing value the way `name` does:
                   blank means the file has nothing to say about it, and a
                   pick is only offered where the file actually says something
                   different (§54's rule, unchanged). */
                known:known,
                title:fileTxt(r["Job title"]), email:email,
                phone:fileTxt(r["Mobile"]), mainbu:buName, where:where,
                role:roleKey, wantActive:wantActive,
                conflict:conflict, choice:null, picks:[] };

    row.action = conflict ? "conflict" : (existing ? "match" : "add");
    /* A conflict is matched to NOBODY until it is answered, so there is
       nothing to compare against and no picks to show. They are built by
       peopleRowChoose() the moment the reading is chosen. */
    peopleRowPicks(row, conflict ? null : existing, dnames);
    plan.rows.push(row);
  });
  return plan;
}

/* ── WHAT THE FILE WOULD OVERWRITE, ONE TICK EACH (§87.6) ──────────
   Islam, asked who wins where the file and the register disagree: the
   register. That is the right way round and it is not the obvious one — the
   file looks newer because it was just uploaded, and it very often is not: it
   is the export somebody downloaded three weeks ago, edited two cells of, and
   sent back. What is on the register is what people have been correcting by
   hand ever since.

   SO A DIFFERENCE IS AN OFFER, NEVER AN INSTRUCTION. Every field the file
   would change is listed with what is recorded beside what would replace it,
   and nothing moves until it is ticked. Take all from the file is one press
   above the list, because a real HR export legitimately changes thirty job
   titles and thirty ticks would make the safe default the unusable one.

   A BLANK CELL IS STILL "NOTHING TO SAY" and never appears here at all — it is
   the rule the whole file is read under (§54) and it did not change. */
var PEOPLE_FILE_PICKS = [
  { k:"name",   label:"Full Name" },
  /* A PICK LIKE ANY OTHER (§93.8). What somebody is CALLED is the field most
     likely to have been typed here by the SMO and left alone in the export, so
     it is exactly the field a file must not overwrite quietly — §87's ruling
     that the register wins by default, applied to the one column that exists
     because a person corrected it. */
  { k:"known",  label:"Name" },
  { k:"title",  label:"Job title" },
  { k:"email",  label:"Email" },
  { k:"phone",  label:"Mobile" },
  { k:"mainbu", label:"Official BU" }
];
function peopleRowPicks(row, existing, dnames){
  row.picks = [];
  if (!existing) return row;
  PEOPLE_FILE_PICKS.forEach(function(f){
    var now = fileTxt(row[f.k]);
    if (!now) return;
    /* WHAT IS ON THE REGISTER, not what is stored under that key (§93.8).
       `known` is absent for anybody who never corrected it, and the register
       shows the GUESS in its place — so comparing against the raw field would
       report a file repeating that guess as a difference, and offer 33 picks
       that change nothing anybody can see. */
    var was = f.k === "known" ? fileTxt(knownName(existing, dnames))
                              : fileTxt(existing[f.k]);
    var same = f.k === "mainbu" ? mainbuKey(was) === mainbuKey(now)
                                : was === now;
    if (same) return;
    /* A blank on the register is not a disagreement — there is nothing to
       lose, so it is filled and not asked about. */
    row.picks.push({ k:f.k, label:f.label, was:was, now:now, take:!was });
  });
  return row;
}
/* WHAT THIS ROW WOULD ACTUALLY DO, read live. The picks are ticked after the
   plan is built, so a tally counted at plan time would be describing a screen
   nobody is looking at any more — and a row whose only differences are all
   untaken changes nothing and must say so. */
function peopleRowChanges(row){
  var out = [];
  var eff = peopleRowEffective(row);
  if (eff.mode === "add") return ["added"];
  if (eff.mode !== "match") return [];
  var was = eff.key ? personBy(eff.key) : null;
  row.picks.forEach(function(f){ if (f.take) out.push(f.label.toLowerCase()); });
  if (was) {
    if (row.where && personAt(was) !== row.where) out.push("unit");
    if (row.role) out.push("role");
    if (row.wantActive === true  && !personActive(was)) out.push("restored");
    if (row.wantActive === false &&  personActive(was)) out.push("retired");
  }
  return out;
}
function peopleFileTally(plan){
  var t = { added:0, updated:0, same:0, roles:0, retired:0, restored:0,
            conflicts:0, undecided:0 };
  (plan.rows || []).forEach(function(row){
    if (row.action === "conflict") {
      t.conflicts++;
      if (!row.choice) { t.undecided++; return; }
      if (row.choice.mode === "skip") return;
    }
    var eff = peopleRowEffective(row);
    if (eff.mode === "skip") return;
    if (eff.mode === "add") { t.added++; if (row.role) t.roles++;
                              if (row.wantActive === false) t.retired++; return; }
    var ch = peopleRowChanges(row);
    if (!ch.length) { t.same++; return; }
    t.updated++;
    if (ch.indexOf("role") > -1) t.roles++;
    if (ch.indexOf("retired") > -1) t.retired++;
    if (ch.indexOf("restored") > -1) t.restored++;
  });
  return t;
}
/* One reading of a row, whatever route it took to get here: a plain match, an
   add, a skip, or the answer somebody gave a conflict. The renderer and the
   applier both ask this, or the review would describe one thing and the Apply
   would do another. */
function peopleRowEffective(row){
  if (row.action === "conflict") {
    if (!row.choice) return { mode:"undecided", key:null };
    if (row.choice.mode === "skip") return { mode:"skip", key:null };
    if (row.choice.mode === "add")  return { mode:"add",  key:null };
    return { mode:"match", key:row.choice.key };
  }
  return row.action === "add" ? { mode:"add", key:null }
                              : { mode:"match", key:row.key };
}
/* Answering a conflict re-reads the row against the person it now means: the
   picks were built against nobody (or against the other reading), and a review
   that went on showing the first reading's differences would be describing a
   decision nobody made. */
function peopleRowChoose(row, choice){
  row.choice = choice;
  var eff = peopleRowEffective(row);
  peopleRowPicks(row, eff.key ? personBy(eff.key) : null, displayNames());
  return row;
}

/* Applies what the plan says, in the one order that works: the department
   before the person, the person's attachment before their role (a role is
   held over their BU, so the BU has to be true first), and retiring LAST —
   retiring revokes roles, so a row that both granted one and retired the
   person would otherwise keep a role on somebody who cannot sign in. */
function applyPeopleFile(plan){
  plan.newBus.forEach(function(n){ addMainbu(n); });

  plan.rows.forEach(function(row){
    var eff = peopleRowEffective(row);
    if (eff.mode === "skip" || eff.mode === "undecided") return;
    var p = eff.key ? personBy(eff.key) : null;
    if (!p) {
      var key = addPerson({ name:row.name, title:row.title, phone:row.phone,
                            empId:row.id, email:row.email, mainbu:row.mainbu,
                            where:row.where });
      p = personBy(key);
      if (!p) return;
      /* Through the setter, so a file that repeats the guess stores nothing
         (§93.8) — otherwise every uploaded row would carry a `known` that
         freezes at whatever the full name was on the day of the upload. */
      if (row.known) setKnownName(p, row.known);
    } else {
      /* ONLY WHAT WAS TICKED (§87.6). Every field the file would change is on
         `row.picks` with its own answer, and a field that is not there is
         either blank in the file or the same on both sides — in neither case
         is there anything to write. The employee number is the exception and
         is not a pick: it is the identity the row was matched ON, or the
         number a conflict was answered by accepting. */
      /* Through setKnownName() for `known`, so taking a value that happens to
         equal the guess stores nothing rather than freezing it (§93.8). */
      row.picks.forEach(function(f){
        if (!f.take) return;
        if (f.k === "known") setKnownName(p, f.now); else p[f.k] = f.now;
      });
      if (row.id) p.empId = row.id;
      /* Only when there is somewhere to put them. A person whose department
         maps to nothing keeps whatever attachment they already had — moving
         them to "nowhere" because Risk has not been mapped yet would take away
         pages they can open today.

         Outside the `if (row.mainbu)` since §65: the BU column stands on its
         own, so a row that fills only that one still moves the person. Inside
         it, filling BU and leaving Official BU blank did nothing at all and
         said nothing about why. */
      if (row.where) attachPersonAt(p, row.where);
    }
    /* Restoring gives NOTHING back by itself (§49.4): what they get is what
       this file says, which is the Role column or nothing. The page asks;
       a file answers by being explicit. */
    if (row.wantActive === true && !personActive(p)) restorePerson(p.key, false);
    if (row.role) grantPersonRole(p.key, row.role, row.where);
    if (row.wantActive === false && personActive(p)) retirePerson(p.key);
  });
}

/* The order a picker offers people in: the ones already attached to this unit
   or function first, then everyone else, retired people never. "Relevant
   names first" was Islam's word for it — the list still holds everyone,
   because a person moving between units is normal and a picker that hides
   them makes the move impossible. */
function peopleFor(where){
  var here = [], rest = [];
  PEOPLE.forEach(function(p){
    if (!personActive(p)) return;
    var mine = String(where || "").indexOf("fn:") === 0
      ? p.fn === String(where).slice(3)
      : p.unit === where;
    (mine ? here : rest).push(p);
  });
  return { here: here, rest: rest };
}

/* The owner reaches the same pages as the head, for the same unit. */
function unitRoleOf(personKey, unitKey){
  var r = UNIT_ROLES[unitKey];
  if (!r) return null;
  if (r.head === personKey) return "head";
  if (r.custodian === personKey) return "custodian";
  return null;
}

/* ── Focus measures ───────────────────────────────────────────────────────
   The CEO marks a few measures per unit as the ones carrying reward. A mark is
   stored against the CYCLE, not against the measure \u2014 every cycle starts
   unmarked, so last year's emphasis cannot quietly become this year's default.

   Where reward begins is one rule for the whole cycle, not a second target on
   each measure. Focus changes no score anywhere: the unit headline, the pillar
   figures and the group compile are computed exactly as before. Unit weights
   already decide how much a unit counts, and letting focus alter scoring would
   count the same emphasis twice. No compensation arithmetic lives here \u2014 the
   platform reports standing; the scheme pays.

   Focus is a business-unit idea only. The group unit carries none. */
var CYCLE = {
  name: "2026",
  rewardAt: 100,     /* percent of target at which reward begins */
  locked: false,     /* true once the cycle opens */
  /* Chosen so the demo carries every standing the rule can produce \u2014 earning,
     short, and one with nothing reported. A board on which every row says the
     same word demonstrates nothing. */
  focus: {
    "mobile-KO2": true, "mobile-P1-M3": true, "mobile-P3-M2": true,
    "retailstores-KO2": true, "retailstores-P1-M2": true,
    "care-KO2": true, "care-P1-M3": true,
    "logistics-KO3": true, "logistics-P2-M1": true
  }
};

/* ── THE FEATURE'S SWITCH, ASKED IN ONE PLACE (§102) ───────────────
   Seven surfaces read focus — the mark beside a measure, the highlighted row
   on two tables, the unit's tally, the Focus board — and every one of them
   goes through isFocus(). So "off means it disappears across the platform"
   (Islam) is one gate here rather than seven conditions that drift apart.

   focusMarked() IS THE RAW MAP and exists for exactly one caller: the Focus
   measures page's own ticks, which must keep showing what is stored while the
   feature is off, or the page would look emptied and turning it back on would
   look like it had lost everything. Nothing else may use it. */
function focusOn(){ return SMPRules.focusOn(world()); }
function focusMarked(id){ return !!CYCLE.focus[id]; }
function isFocus(id){ return focusOn() && focusMarked(id); }

/* Writing it. A value put back to its default deletes its key (§50.6), so a
   tenant that has never been asked and one that turned it off and on again are
   byte-identical — otherwise every save afterwards carries a phantom change. */
function setFocusOn(on){
  if (on) delete GROUP.focusOff; else GROUP.focusOff = true;
}
function toggleFocus(id){
  if (CYCLE.locked) return false;
  if (CYCLE.focus[id]) delete CYCLE.focus[id]; else CYCLE.focus[id] = true;
  return true;
}
function canMarkFocus(){
  var v = viewer();
  return !CYCLE.locked && (inOffice() || hasRole("gceo"));
}

/* Standing is derived from the one rule. Three states at a rule of 100%, four
   above it \u2014 a measure can deliver its commitment without clearing the reward
   line, and that is neither short nor earning. */
function focusStanding(progress){
  if (progress == null) return { key:"none",  label:"Not reported" };
  if (progress >= CYCLE.rewardAt) return { key:"over", label:"Earning" };
  if (progress >= 100) return { key:"met",  label:"Met, not earning" };
  return { key:"short", label:"Short" };
}

/* ── WHAT CAN BE MARKED, BANDED, FOR A UNIT OR A FUNCTION (§135.5) ────
   Islam: *"make it like the navigation rail for units and supporting
   functions."*

   ONE BUILDER, asked with a destination key, because the marking page, the
   unit's own strip and the group's Focus board are three surfaces onto one
   answer and three walks of the data is how they drift (§53.5). It returns the
   BANDS rather than a flat list: every one of the three groups what it shows,
   and a band that is empty is still a band the marking table draws.

   A FUNCTION ANSWERS IN ITS OWN SHAPE, and the two shapes are not a special
   case bolted on — they are what a function IS. Merchandising plans in pillars
   (§59), so `fnAsUnit()` hands over the unit shape and the unit's own bands
   answer unchanged. The other seven plan in capabilities, and their measurable
   rows sit one level down: a capability's key objectives, banded by capability
   exactly as a unit's are banded by pillar. Islam, asked which: *"agreed."*

   THE IDS WERE ALREADY THERE, which is what makes this cheap rather than a
   migration — `renumberCapability()` has minted `cap1-KO1` for every one of
   them since the capability model existed, and a focus mark is nothing but
   that id in `CYCLE.focus`. §96.4's ID-less objectives were the group's, not
   these. */
function unitBands(u){
  if (!u) return [];
  return [{ band:L("keyobj","bu"), src:L("keyobj","bu").toLowerCase(),
            items:u.keyObjectives || [] }]
    .concat((u.items || []).map(function(p, pi){
      return { band:pillarCode(u, pi) + " " + p.name, src:pillarCode(u, pi),
               items:p.measures || [] };
    }));
}
function focusBands(key){
  if (!key) return [];
  /* The prefix test rather than `isFn()`, which is the shell's own local
     helper and not in scope here. */
  if (String(key).indexOf("fn:") === 0) {
    var fk = String(key).slice(3), f = FUNCTIONS[fk];
    if (!f) return [];
    if (f.format === "pillars") return unitBands(fnAsUnit(fk));
    /* THE BAND IS THE CAPABILITY'S NAME, and no code is invented for it. A
       pillar has one because the unit owns a prefix and somebody says "MB01"
       out loud (§51.3); a capability has never had one on any screen, and
       minting one here would be new vocabulary arriving through a marking
       table. */
    return capsOfFunction(fk).map(function(c){
      return { band:c.name, src:c.name, items:c.keyObjectives || [] };
    });
  }
  return unitBands(UNITS[key]);
}
/* Every place a mark could be made, in the navigation's own order. */
function focusSubjects(){
  return { units: activeKeys().map(function(k){
             return { key:k, name:UNITS[k].name }; }),
           fns: activeFunctionKeys().filter(function(k){ return fnShows(k); })
                  .map(function(k){
             return { key:"fn:" + k, name:FUNCTIONS[k].name }; }) };
}
/* Every MARKED item behind a destination. */
function focusIn(key){
  var out = [];
  focusBands(key).forEach(function(b){
    (b.items || []).forEach(function(m){
      if (isFocus(m.id)) out.push({ m:m, src:b.src });
    });
  });
  return out;
}
/* Kept for the unit-shaped callers that hold an object rather than a key. */
function unitFocus(u){
  var out = [];
  unitBands(u).forEach(function(b){
    (b.items || []).forEach(function(m){
      if (isFocus(m.id)) out.push({ m:m, src:b.src });
    });
  });
  return out;
}
function focusTallyOf(items){
  var t = { over:0, met:0, short:0, none:0, total:0, mean:null };
  var vals = [];
  items.forEach(function(x){
    t.total++;
    t[focusStanding(x.m.progress).key]++;
    if (x.m.progress != null) vals.push(x.m.progress);
  });
  t.mean = avg(vals);
  return t;
}
function focusTally(u){ return focusTallyOf(unitFocus(u)); }

/* ── Supporting functions ─────────────────────────────────────────────────
   A capability is cross-cutting: the whole group depends on it, and a supporting
   function improves it through enhancement work. Finance, HR and Treasury are
   not business units and never will be \u2014 they carry no plan and no weight \u2014 so
   they are their own list rather than units in disguise.

   A function has a head and, optionally, one Strategy custodian \u2014 the same two
   roles a business unit has, in the same shape. Where the head does the work
   themselves the slot stays empty: they already have access as head, and a
   second record for the same person would put one person on the board twice. */
/* Version. Counted from the point versioning began rather than from nothing \u2014
   there were roughly eleven build rounds before this, so the first numbered
   release is 1.0. It lives in the FILENAME, not on screen: the platform is shown
   to clients and a version badge in the chrome is noise to them. */
var VERSION = "2.1";

/* A function carries the same fields a unit does, in the same shapes: an
   editable name, a short name for the navigation, a code prefix for numbering
   its work, one head and one Strategy custodian, and a retired flag. Two
   configuration screens that mean the same thing should not behave differently.

   navName is left empty deliberately \u2014 what appears in the navigation is a
   choice for whoever runs the platform, not a default anybody inherits. */
var FUNCTIONS = {
  finance:   { name:"Finance",   navName:null, codePrefix:"FIN", head:"fn_fin",  custodian:null,     active:true },
  hr:        { name:"HR",        navName:null, codePrefix:"HR",  head:"fn_hr",   custodian:null,     active:true },
  treasury:  { name:"Treasury",  navName:null, codePrefix:"TRS", head:"fn_tre",  custodian:null,     active:true },
  marketing: { name:"Marketing", navName:null, codePrefix:"MKT", head:"fn_mkt",  custodian:"fn_mkt2",active:true },
  it:        { name:"IT",        navName:null, codePrefix:"ITF", head:"ithead",  custodian:"own_it", active:true },
  care:      { name:"Care",      navName:null, codePrefix:"CAF", head:"cahead",  custodian:"own_ca", active:true },
  smo:       { name:"Strategy Management Office", navName:null, codePrefix:"SMO", head:"smo", custodian:null, active:true },
  /* A FUNCTION THAT PLANS IN PILLARS, AND SITS UNDER A UNIT (spec 010, §52).
     Islam's own example, and the demo carries it so the feature is visible
     rather than described — a feature that renders nothing looks like a
     feature that was not built (§45.2).

     `format:"pillars"` says it plans the way a business unit does, so it has
     no capabilities and its pages are the unit's. `under:"retailstores"` says
     whose it is; it still appears in the Functions navigation rather than
     nested a third level deep (Islam, asked). Its three pillars produce
     Retail's R04, which names it back — the pointer lives on the PILLAR,
     because Retail's plan is where the consequence is visible.

     Invented content, like every unit but Mobile (B3). */
  merchandising: { name:"Merchandising", navName:null, codePrefix:"MRC",
    head:"mrchead", custodian:"own_mrc", active:true,
    format:"pillars", under:"retailstores",
    items:[
      { code:"M01", name:"Assortment and range", sub:"What we choose to sell",
        kind:"Direction", theme:"VC", owner:"Sara Helmy",
        measures:[
          { name:"Range productivity", dir:"\u2265", target:"1.15", compile:"Latest", actual:"1.06", progress:92 },
          { name:"Slow-moving SKU share", dir:"\u2264", target:"12%", compile:"Latest", actual:"18%", progress:67 }
        ],
        tactics:[
          { name:"Category role definition across the estate", owner:"Sara Helmy",
            collaborators:["Nour"], q1:1, q2:1, q3:0, q4:0, status:"WIP", actual:75 },
          { name:"Quarterly range review with the buying team", owner:"Sara Helmy",
            q1:1, q2:1, q3:1, q4:1, status:"WIP", actual:60 }
        ] },
      { code:"M02", name:"Space and layout", sub:"Where it sits in the store",
        kind:"Direction", theme:"OT", owner:"Tamer Fouad",
        measures:[
          { name:"Sales per square metre", dir:"\u2265", target:"46K EGP", compile:"Latest", actual:"41K EGP", progress:89 }
        ],
        tactics:[
          { name:"Planogram standard for the top five categories", owner:"Tamer Fouad",
            q1:0, q2:1, q3:1, q4:0, status:"WIP", actual:55 },
          { name:"Fixture refresh in the ten largest stores", owner:"Tamer Fouad",
            collaborators:["Hossam"], q1:0, q2:1, q3:1, q4:1, status:"WIP", actual:40 }
        ] },
      { code:"M03", name:"Supplier terms", sub:"What the range costs us",
        kind:"Capability", theme:"VC", owner:"Sara Helmy",
        measures:[
          { name:"Front margin", dir:"\u2265", target:"18%", compile:"Latest", actual:"16.4%", progress:91 },
          { name:"Supplier funding secured", dir:"\u2265", target:"140M EGP", compile:"Sum", actual:"92M EGP", progress:66 }
        ],
        tactics:[
          { name:"Renegotiate the twenty largest supplier agreements", owner:"Sara Helmy",
            collaborators:["Nour", "Hossam"], q1:1, q2:1, q3:1, q4:0, status:"WIP", actual:65 }
        ] }
    ] }
};
/* ── Companies (§15.13) ──────────────────────────────────────────────
   A layer between the group and the business unit. A company is a group of
   business units, and each company has its own CEO.

       Group — Group CEO
         Company — Company CEO        e.g. Distribution, B2C
           Business unit — BU head
             Custodian
       Supporting functions sit beside all of it, at group level

   In this version the company level is for VISIBILITY, not strategy: it
   carries no score and no page of its own. Its purpose is that a company CEO
   can see their own units without wading through everyone else's.

   It does NOT group the navigation row. That was built and taken out in the
   same version — the SMO and the group CEO see everything and already have the
   Units fold, and a company CEO sees only their own three or four units, so
   there was nothing to group. The grouping solved a problem neither viewer had.

   Supporting functions belong to no company. They serve every company and
   therefore every unit, and stay beside the companies rather than inside one.

   Both visibility flags are per company rather than global, because a client
   may want one company CEO measured against the whole and another not.
   ──────────────────────────────────────────────────────────────────── */
var COMPANIES = {
  distribution: { name:"Distribution", ceo:null, seeOthers:false, seeGroup:true },
  b2c:          { name:"B2C",          ceo:null, seeOthers:false, seeGroup:true }
};
var COMPANY_KEYS = ["distribution", "b2c"];

/* A unit belongs to a company or is its own — never neither. "Its own" is a
   decision and is stored as null, which the Setup table names explicitly so an
   empty cell can never read as somebody having forgotten. */
var UNIT_COMPANY = {
  mobile:              "distribution",
  consumerelectronics: "distribution",
  it:                  "distribution",
  retailstores:        "b2c",
  onlineshop:          "b2c",
  care:                "b2c"
};
Object.keys(UNITS).forEach(function(k){
  if (UNITS[k].company === undefined) UNITS[k].company = UNIT_COMPANY[k] || null;
});

/* ── A COMPANY IS CREATED, RENAMED AND RETIRED LIKE ANYTHING ELSE (§49.3) ──
   Until now the page offered two visibility dropdowns per company and nothing
   else: no add, no rename, no retire. There was no `addCompany` anywhere in
   the product. So a client deployed and inherited Distribution and B2C from
   the Raya demo — invented content in a real tenant, which §21 forbids
   outright — with no way to be rid of them. Migration 004 clears the table
   now, and these three give the page the rest of the life every other Setup
   table has had since 1.7. */
function addCompany(){
  var n = 1, key;
  do { key = "newco" + n; n++; } while (COMPANIES[key]);
  COMPANIES[key] = { name:"New company " + (n - 1), ceo:null, seeOthers:false, seeGroup:true };
  COMPANY_KEYS.push(key);
  return key;
}

/* Retired, never deleted — the same contract as a unit or a function, and for
   the same reason: a company key is written into every `cceo` role as
   `co:<key>`, and deleting the row would leave the role pointing at nothing.
   REFUSED while units still belong to it, naming them, rather than quietly
   orphaning a unit into "its own company" behind the SMO's back. */
function companyActive(ck){ return COMPANIES[ck] && COMPANIES[ck].active !== false; }
function activeCompanyKeys(){ return COMPANY_KEYS.filter(companyActive); }
function companyRetireBlockers(ck){
  return unitsOfCompany(ck).map(function(k){ return UNITS[k].name; });
}
function retireCompany(ck){
  var co = COMPANIES[ck];
  if (!co || companyRetireBlockers(ck).length) return false;
  co.active = false;
  return true;
}
function restoreCompany(ck){
  var co = COMPANIES[ck];
  if (!co) return false;
  delete co.active;
  return true;
}

function companyOf(unitKey){
  var u = UNITS[unitKey];
  return u && u.company ? COMPANIES[u.company] : null;
}
function unitsOfCompany(ck){
  return UNIT_KEYS.filter(function(k){ return UNITS[k].company === ck; });
}
/* Units standing alone, in the order they are declared. */
function soloUnits(){
  return UNIT_KEYS.filter(function(k){ return !UNITS[k].company; });
}

/* The ORDER functions appear in, and the only list that decides which exist —
   `FUNCTIONS` is the record, this is the register. Merchandising is last
   because it is the newest, not because a function under a unit ranks below
   one serving the group: `under` says whose it is, position says nothing. */
var FUNCTION_KEYS = ["finance","hr","treasury","marketing","it","care","smo","merchandising"];

/* Each capability is allocated to exactly one function. A function may hold
   more than one \u2014 Marketing carries both Brand Positioning and Product Mindset
   \u2014 which is why a custodian is named after the FUNCTION and never after a
   capability. */
var CAP_FUNCTION = {
  "Operational Excellence":  "treasury",
  "People":                  "hr",
  "Innovation and Tech":     "it",
  "Brand Positioning":       "marketing",
  "Customer Centric":        "care",
  "Product Mindset":         "marketing",
  "Financial Infrastructure":"finance",
  "Strategy":                "smo"
};
GROUP.capabilities.forEach(function(c){ c.fn = CAP_FUNCTION[c.name] || null; });

function functionOf(key){ return FUNCTIONS[key] || null; }
/* WHO HOLDS A LIST OF KEY OBJECTIVES ON A SUPPORTING FUNCTION'S OVERVIEW
   (§213). A capability, or — since that page exists for both formats — the
   FUNCTION itself, addressed as `fn:<key>`. One resolver, because the add and
   the remove each look the holder up and two lookups that must agree are how
   §53.5 gets paid for twice.

   The writing view, always: this is only ever called from a handler that is
   about to push or splice, and `fnAsUnit()`'s shared frozen empty is not a
   list anybody may write to (§50.6). */
/* WHICH FOUNDATION KEY A TARGET IS GATED ON (§212). The group's, a unit's, or
   a function's — named once, because the alternative is the ternary that was
   written at every call site and got a function wrong at two of them. §211's
   fault, and it fails CLOSED: the control renders and the press returns in
   silence.

   §214: AND IT WAS DELETED BY ACCIDENT AND PUT BACK. Removing the dead
   `fnOverviewHas()` by slicing between two anchors took this with it, because
   it had been inserted between them — every clause Add and Remove in the
   product then threw inside its own click handler, which is invisible to a
   page-load error listener and looked exactly like a button that does
   nothing. `checks/plan-builder.py` caught it, on a UNIT, which is the
   argument for running the whole suite rather than the file you edited. */
function foundKeyFor(target){
  var t = String(target || "");
  if (t === "group") return "g_found";
  return t.indexOf("fn:") === 0 ? "k_found" : "u_found";
}
function koHolderById(id){
  var s = String(id || "");
  if (s.indexOf("fn:") === 0) {
    var u = unitLikeWritable(s);
    if (!u) return null;
    return { list: u.keyObjectives, target: s };
  }
  var c = capById(s);
  if (!c) return null;
  return { list: c.keyObjectives, target: c.fn ? "fn:" + c.fn : null, cap: c };
}
function capById(id){
  return GROUP.capabilities.filter(function(c){ return c.id === id; })[0] || null;
}
/* Who reaches a capability: the SMO and CEO see all of them; a function's own
   people see theirs. A unit head has no business in a capability at all. */

/* ── What a capability reads ──────────────────────────────────────────
   Three numbers, never folded into one, and one of them is optional.

   KEY OBJECTIVES — optional. Weighted exactly as a unit's are. A capability
   with none does not show the card at all; it is not shown at zero.

   PROJECT PERFORMANCE — half from the deliverables side, half from the
   outcomes side, PER SIDE and not per row. Four deliverables and one outcome
   still weigh 50/50, because they are two different kinds of evidence that a
   project achieved what it set out to, not six comparable items.

   EXECUTION — milestones completed, and nothing else.

   An outcome whose measurement time has not arrived is absent from the
   arithmetic. It is not a zero. A project that has delivered everything and
   cannot yet be measured reads on its deliverables alone, which is why its
   number can FALL later when the outcomes arrive below target. That is the
   project's real story rather than a defect. */

function capKOScore(c){
  /* Pending confirmation leaves the average (§145), as everywhere. */
  var list = (c.keyObjectives || []).filter(function(m){ return measureScore(m) != null; });
  if (!list.length) return null;
  var tw = 0, sum = 0;
  list.forEach(function(m){ var w = m.weight == null ? 1 : m.weight; tw += w; sum += measureScore(m) * w; });
  return tw ? Math.round(sum / tw) : null;
}

/* A deliverable reads 100 or 0 when it is delivered-or-not, and its own
   percentage when it is a percentage. Nothing reported is absent, not zero. */
/* ── WHAT A STATUS READS AS (§104) ────────────────────────────────────────
   A deliverable and a milestone are reported the same way now: Not started,
   In progress with a per-cent, Delivered (or Completed). The figure follows
   the word at both ends and only the middle is typed, which is why `kind` --
   the plan's old choice between "delivered or not" and "a percentage" -- has
   nothing left to decide and is gone (§24).

   AN IN-PROGRESS ROW WITH NO PER-CENT READS 0, not null. The reporting page
   asks for the number and the tally does not count the row until it has one,
   so this case only arises in data that arrived another way -- and every
   milestone in every tenant is in exactly that state on the day this ships.
   Reading it as 0 is what makes the Execution figure identical to the count
   it replaces; excluding it would raise every tenant's score overnight. */
/* ── AN IN PROGRESS WITH NO NUMBER IS NOT NOUGHT (§104.10) ───────────────
   It returned 0, so the average COUNTED it -- and a project's figure fell the
   instant a dropdown changed, before the person who changed it had said
   anything at all. That is the platform putting a number in somebody's mouth,
   which is precisely why an In progress state with no figure was refused in
   the first place (§99.8): the score would have to invent one.

   It returns NULL, so `sideAvg()` leaves it out the way it already leaves out
   an outcome nobody has measured. The row is not forgiven -- it is
   OUTSTANDING: the tally counts it as unanswered, the pane marks it, and the
   figure beside it is honestly built on what has been said.

   `x.pct === ""` is the case that has to be named: Number("") is 0, not NaN,
   so an empty box would have read as a genuine nought. */
function statusReads(x){
  if (!x || !x.status) return null;
  if (x.status === "done") return 100;
  if (x.status === "todo") return 0;
  if (x.pct == null || x.pct === "") return null;
  var p = Number(x.pct);
  return isNaN(p) ? null : Math.max(0, Math.min(100, p));
}
function delivReads(d){ return statusReads(d); }
function msReads(m){ return statusReads(m); }
/* Reported means ANSWERED, and In progress is not answered without its
   number -- which is the whole of "in progress requires a % of completion".
   ONE QUESTION, asked of the reading: two predicates that had to agree about
   the same row are how "given" and "reads" drift apart. */
function statusGiven(x){ return statusReads(x) != null; }
/* Said something, and did not finish saying it. Not the same as "unanswered":
   a row nobody has touched is silent, this one is halfway through a sentence. */
function statusPending(x){ return !!x && x.status === "wip" && statusReads(x) == null; }
function sideAvg(vals){
  var v = vals.filter(function(x){ return x != null && !isNaN(x); });
  if (!v.length) return null;
  return Math.round(v.reduce(function(a, b){ return a + b; }, 0) / v.length);
}
function projDeliverySide(p){
  return sideAvg(SMPRules.shown(p.deliverables).map(delivReads));
}
function projOutcomeSide(p){
  return sideAvg(SMPRules.shown(p.outcomes).map(function(o){ return o.progress; }));
}
function projPerf(p){
  var d = projDeliverySide(p), o = projOutcomeSide(p);
  if (d == null && o == null) return null;
  if (d == null) return o;
  if (o == null) return d;
  return Math.round(d * 0.5 + o * 0.5);
}
function projMilestones(p){
  var ms = SMPRules.shown(p.milestones), done = 0, wip = 0, todo = 0;
  ms.forEach(function(m){
    if (m.status === "done") done++;
    else if (m.status === "wip") wip++;
    else todo++;
  });
  return { done: done, wip: wip, todo: todo, total: ms.length };
}
/* A milestone whose finish date falls after its project's end date is saved
   exactly as entered. The platform never refuses it \u2014 it says so, and offers
   the two things that might be true. */
/* ── READ THE DATES THE WAY THE PLATFORM READS EVERY OTHER DATE (§179) ──
   This asked `Date.parse` directly, which is the one reader in the product
   that does NOT understand the shapes the product actually stores -- and with
   §179 putting a month picker on Start and End it became actively wrong
   rather than merely deaf: `Date.parse("Jul 26")` is 26 July **2001**, so
   every milestone would have overrun every project, on every pane, from the
   day the picker shipped. A dead warning woken as a false one.

   `monthsOf()` is the reader the rest of the platform uses, and it already
   knows `Jul 26`, `Q4 2026`, `H1 26`, `31 May 2026` and the rest. The END
   takes `last:true`, so a project ending "Q4 2026" ends in DECEMBER rather
   than October -- the same argument `monthsOf` documents for a cycle named
   Q2 covering April to June.

   THE COMPARISON IS MONTHLY, which is the accepted consequence of §177's
   month-only dates: a milestone due in the month the project ends is not an
   overrun. The `timeline` gate is deliberately LEFT AS IT WAS -- §109 removed
   the pill that set it and recorded widening this guard as its own decision,
   and this section is about the reader, not about which projects are asked. */
function projOverruns(p){
  if (p.timeline !== "date" || !p.end) return [];
  var endM = monthsOf(p.end, true);
  if (endM == null) return [];
  return (p.milestones || []).filter(function(m){
    var t = monthsOf(m.finish);
    return t != null && t > endM;
  });
}
function capPerf(c){
  return sideAvg((c.projects || []).map(projPerf));
}
/* EXECUTION IS AN AVERAGE NOW, AND IT IS THE SAME NUMBER (§104). It was
   `done / total`: a milestone in progress counted as nothing. With a per-cent
   on the milestone it is the mean of what each one reads -- 100 done, 0 not
   started, its own figure in between -- and those are identical arithmetic
   while no per-cent has been entered, which is every tenant on day one.
   Measured across all eight capabilities in the worked example before it was
   built: 50/50, 50/50, 50/50, 40/40, 40/40, 33/33, 42/42, 40/40.

   The counts stay beside it. "5 of 12 completed" and "42%" answer two
   different questions and both are worth having. */
function capExec(c){
  var done = 0, total = 0, wip = 0, todo = 0, sum = 0, scored = 0;
  (c.projects || []).forEach(function(p){
    var m = projMilestones(p);
    done += m.done; wip += m.wip; todo += m.todo; total += m.total;
    SMPRules.shown(p.milestones).forEach(function(x){
      /* §104.10: a milestone halfway through a sentence leaves the average
         rather than dragging it down. `|| 0` still stands for a milestone
         NOBODY has touched -- projMilestones() counts that one as Not started,
         so nought is what it is, not what we assumed. */
      if (statusPending(x)) return;
      scored++; sum += msReads(x) || 0;
    });
  });
  return { done: done, wip: wip, todo: todo, total: total,
           pending: total - scored,
           pct: scored ? Math.round(sum / scored) : null };
}
function capDeliverySide(c){ return sideAvg((c.projects || []).map(projDeliverySide)); }
function capOutcomeSide(c){ return sideAvg((c.projects || []).map(projOutcomeSide)); }

/* What a capability asks for this cycle: its key objectives, plus everything in
   its projects whose time has come. An outcome measured at Q4 is not an empty
   box somebody forgot in Q2 \u2014 it is not asked. */
/* ── WHEN A ROW IS DUE (§104) ──────────────────────────────────────────────
   One reader, four written shapes, because the plan is written by people and
   people write dates four ways:

       July 26            a deliverable's or an outcome's due date
       W3 Mar 26          a milestone's, one step finer
       Q3 2026 / Q3       every plan authored before this version
       31 May 2026        the one real project, and every date-timelined plan

   Everything resolves to a MONTH NUMBER since year zero, which is the coarsest
   unit any of them share -- a week inside March is still March, and comparing
   a week to a cycle that runs six months would be precision nobody asked for.

   `Date.parse` is deliberately the LAST resort rather than the first: it reads
   "Q3 2026" as nothing and "W3 Mar 26" as nothing, but it also reads bare
   numbers and stray words as dates in ways that would quietly turn a typo into
   a deadline. The named shapes are matched first and explicitly.

   THE CYCLE IS READ BY THE SAME FUNCTION, which is the part that was broken:
   the old test compared quarter to quarter and answered "due" for EVERYTHING
   when the cycle was called "H1 2026" -- which is what the demo cycle is
   called and what a half-yearly review is always called. A cycle resolves to
   its LAST month, because a cycle asks for everything due by the time it
   closes. */
/* MONTH_KEYS, NOT MONTHS -- there is already a `var MONTHS` in this file
   1,400 lines below, holding the same twelve words CAPITALISED for
   formatting a date. Two `var`s of one name in one scope is one binding, the
   later wins, and this read every month as unknown: `indexOf("jul")` against
   ["Jan",...] is -1. NOTHING THREW. `monthsOf` returned null, `dueThisCycle`
   reads null as "always asked", and every row on every pane quietly read as
   due -- which is the EXACT fault the old quarter-only reader had, restored
   by accident on the day it was removed. §56.7 in a third place, and it
   failed the way that rule says it always does: silently, in the safe
   direction. */
var MONTH_KEYS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
function monthIndex(w){
  var t = String(w || "").slice(0, 3).toLowerCase();
  return MONTH_KEYS.indexOf(t);
}
function fullYear(y){
  var n = +y;
  if (!n && n !== 0) return null;
  /* "26" is 2026, not 26 AD. Two digits are a century short, and a plan is
     never written about the year 26. */
  return n < 100 ? 2000 + n : n;
}
/* Months since year zero, so two dates in different years compare with one
   subtraction. Null when the text is not a time at all -- which is what the
   upload notice reports and what "Done" in a due-date column produces.

   THE READER ITSELF MOVED TO `lib/rules.js` (§184). The server had to be able
   to ask "is this a date" -- a value it cannot read is a GAP, and until §184
   only the browser knew which values those were, so the screen offered a
   filler a control the save then refused. What is left here is the one thing
   the shared rule cannot know: which year an unyeared quarter belongs to,
   which is this tenant's cycle. */
function monthsOf(v, last){
  return SMPRules.whenMonths(v, last, cycleYear());
}
/* THE CYCLE'S OWN CLOSING MONTH, taken from `REVIEW.to` -- which has said
   "Jun 2026" since the review model existed -- rather than parsed out of its
   NAME. The name is a label somebody types ("H1 2026", "Half 1", "First
   half"); `to` is the field that means it. The name is the fallback, not the
   source.

   55 of the 60 milestones in the worked example are a bare quarter with no
   year, so a year has to come from somewhere: it comes from the cycle, which
   is the only year the platform actually knows. */
/* ── SHIFTING A DATE BY A RUN (§115) ─────────────────────────────────────
   A repeating project keeps its rhythm: fieldwork in month 2 of the run stays
   fieldwork in month 2, so when a new cycle opens every date on a marked
   project moves forward by the CLOSED cycle's length. One writer, mirroring
   monthsOf() the reader shape for shape — a shape the reader cannot read is
   returned UNCHANGED, never guessed at, because a date this cannot shift is
   still a date somebody typed. The written style survives the shift: a
   2-digit year stays 2-digit, "Mar" stays short, "March" stays long. */
var MONTH_FULL = ["January","February","March","April","May","June","July",
                  "August","September","October","November","December"];
function shiftWhen(v, by){
  var s0 = String(v == null ? "" : v).trim();
  if (!s0 || !by) return v;
  var yOut = function(orig, ny){
    return orig.length === 2 ? ("0" + (ny % 100)).slice(-2) : String(ny);
  };
  var m;
  /* W3 Mar 26 · March 2026 · Mar 26 */
  if ((m = s0.match(/^([Ww]\d\s+)?([A-Za-z]{3,9})\s+(\d{2}|\d{4})$/))) {
    var mi = monthIndex(m[2]);
    if (mi < 0) return v;
    var t = fullYear(m[3]) * 12 + mi + by;
    var nm = ((t % 12) + 12) % 12, ny = Math.floor(t / 12);
    var word = m[2].length > 3 ? MONTH_FULL[nm]
             : MONTH_FULL[nm].slice(0, 3);
    return (m[1] || "") + word + " " + yOut(m[3], ny);
  }
  /* Q1 2026 · Q3 (a bare quarter shifts only when the shift is whole quarters) */
  if ((m = s0.match(/^([Qq])([1-4])(?:\s+(\d{2}|\d{4}))?$/))) {
    if (by % 3 !== 0) return v;
    var q = +m[2] - 1 + by / 3;
    if (!m[3]) return m[1] + (((q % 4) + 4) % 4 + 1);
    var qy = fullYear(m[3]) + Math.floor(q / 4);
    return m[1] + (((q % 4) + 4) % 4 + 1) + " " + yOut(m[3], qy);
  }
  /* H1 2026 */
  if ((m = s0.match(/^([Hh])([12])(?:\s+(\d{2}|\d{4}))?$/))) {
    if (by % 6 !== 0) return v;
    var h = +m[2] - 1 + by / 6;
    if (!m[3]) return m[1] + (((h % 2) + 2) % 2 + 1);
    var hy = fullYear(m[3]) + Math.floor(h / 2);
    return m[1] + (((h % 2) + 2) % 2 + 1) + " " + yOut(m[3], hy);
  }
  /* 31 May 2026 — the day clamps to the month it lands in, because
     31 November is not a date and losing the row's date to gain a correct
     day count would be the wrong trade. */
  if ((m = s0.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{2}|\d{4})$/))) {
    var mi2 = monthIndex(m[2]);
    if (mi2 < 0) return v;
    var t2 = fullYear(m[3]) * 12 + mi2 + by;
    var nm2 = ((t2 % 12) + 12) % 12, ny2 = Math.floor(t2 / 12);
    var maxDay = new Date(ny2, nm2 + 1, 0).getDate();
    var day = Math.min(+m[1], maxDay);
    var word2 = m[2].length > 3 ? MONTH_FULL[nm2] : MONTH_FULL[nm2].slice(0, 3);
    return day + " " + word2 + " " + yOut(m[3], ny2);
  }
  return v;
}

function cycleYear(){
  var m = /(\d{4})/.exec(String(REVIEW.to || "") + " " + String(REVIEW.name || "") +
                         " " + String(REVIEW.due || ""));
  return m ? +m[1] : null;
}
function cycleMonth(){
  var t = monthsOf(REVIEW.to);
  return t != null ? t : monthsOf(REVIEW.name, true);
}
/* IS THIS ROW ASKED FOR THIS CYCLE? A row with no date is always asked: the
   plan did not say when, so the platform does not get to decide it is early.
   A row whose date cannot be read is also asked, for the same reason -- the
   upload said so at the time, and silently not asking would hide it. */
function dueThisCycle(v){
  var m = monthsOf(v), c = cycleMonth();
  if (m == null || c == null) return true;
  return m <= c;
}
/* A row past its date and not finished. Distinct from not-due and drawn
   differently, because "late" and "not yet" are opposite readings. */
function overdue(v, done){
  if (done) return false;
  var m = monthsOf(v), c = cycleMonth();
  return m != null && c != null && m < c;
}
function outcomeDue(o){ return dueThisCycle(o.measureAt); }
/* THERE IS NO delivDue(). A deliverable used to carry a quarter of its own,
   and one later than the cycle meant "not asked": a row the reporting page
   dimmed and the tally left out. Islam, 2026-08-23: a deliverable belongs to
   the project, and the project's end is when it is delivered. The column went
   (§53.4), and with nothing left to set there is nothing left to gate on — so
   the predicate went too, at all four of its call sites, rather than being
   left behind always answering true (§24). An OUTCOME still has one, because
   a measurement time is a real thing somebody chose. */
/* THE TALLY MEANS "WHAT YOU OWE THIS CYCLE" (§104), not "everything in the
   plan". A deliverable due next December is not an empty box somebody forgot
   in June -- it is not asked, exactly as an outcome measured in Q4 has never
   been asked in Q2. It leaves the count and it leaves the submit gate.

   Submitting therefore gets easier early in a project and no easier late,
   which is the right way round: a unit is chased for what is late, never for
   what has not started. */
function projReported(p){
  var n = 0, total = 0;
  (p.deliverables || []).forEach(function(d){
    if (!dueThisCycle(d.due)) return;
    total++;
    if (statusGiven(d)) n++;
  });
  (p.outcomes || []).forEach(function(o){
    if (!outcomeDue(o)) return;
    total++;
    if (o.actual != null && o.actual !== "") n++;
  });
  (p.milestones || []).forEach(function(m){
    if (!dueThisCycle(m.finish)) return;
    total++;
    if (statusGiven(m)) n++;
  });
  return { done: n, total: total };
}
function capReported(c){
  var n = 0, total = 0;
  (c.keyObjectives || []).forEach(function(m){
    total++;
    if (m.actual != null && m.actual !== "") n++;
  });
  (c.projects || []).forEach(function(p){
    var r = projReported(p);
    n += r.done; total += r.total;
  });
  return { done: n, total: total };
}

function capsReachable(){
  return GROUP.capabilities.filter(function(c){ return reachesCap(c.id); });
}
function capsOfFunction(key){
  return GROUP.capabilities.filter(function(c){ return c.fn === key; });
}
/* Everyone who can act for a function: the head, and the custodian if there is one. */
function functionPeople(key){
  var f = FUNCTIONS[key];
  if (!f) return [];
  return [f.head, f.custodian].filter(Boolean);
}
/* Who can reach a capability: the people of the function that carries it, plus
   the SMO and the CEO. Nobody else \u2014 a business unit has no business in another
   function's improvement work. */
/* Navigation is by FUNCTION, not by capability. The custodian is named after
   the function, a function may carry more than one capability, and the
   capabilities themselves already appear in the temple \u2014 so the row offers the
   organisation you belong to, and the capability names appear inside its
   pages. */
/* A short name for the navigation only. "Consumer Electronics" costs more of
   the row than it earns, and a unit may be known internally by a brand the
   formal name does not carry \u2014 B2B Ecomm trading as Mazaya.

   It is deliberately NOT used anywhere else. Page titles, group cards, the
   deck and every export keep the full name, or a board pack ends up saying
   "CE" to people who have never heard it. */
function navName(x){ return (x && x.navName) ? x.navName : (x ? x.name : ""); }

/* A function is reached by anyone who sees everything, or by whoever is named
   on it — its head, its custodian, or a person carrying its work. */
/* Same rule as reaches(), for a supporting function: the area answering for it
   decides, and "own" is whether they hold a role in that function. */
function reachesFn(key){ return grantAt("k_perf", "fn:" + key) !== "none"; }
/* IS THERE ANYTHING BEHIND THIS FUNCTION (§59). Named once, because it was
   answered in TWO places with the same wrong test — `fnsReachable()` here and
   `myFns()` in the shell, each asking whether the function had capabilities.

   That is right for a function whose whole plan lives in its capabilities and
   wrong for one that plans in PILLARS, whose plan is its own. Merchandising
   was therefore missing from the navigation entirely: built, scored, rolling
   into Retail's pillar, and unreachable — and fixing one of the two copies
   left it exactly as invisible, which is how the second copy was found. */
function fnHasWork(k){
  var f = FUNCTIONS[k];
  if (!f) return false;
  return fnPlansInPillars(f) ? fnItems(f).length > 0 : capsOfFunction(k).length > 0;
}
/* AN EMPTY FUNCTION IS INVISIBLE TO A READER AND REACHABLE BY WHOEVER FILLS
   IT (§61). fnHasWork() alone was the whole gate, which is right for somebody
   coming to READ — an empty page is a dead end — and exactly wrong for the
   people who have to put something there: a function with no plan yet could
   not be opened, so the only way to reach it was to give it a plan first.

   Worst on a fresh tenant, where migration 004 removes every capability: EVERY
   function serving the group was missing from the navigation until somebody
   uploaded something, and there was nowhere to upload it from.

   The test is EDIT, not view — the same grant that decides whether the plan
   and the foundation can be authored at all, asked of the target the tab would
   open. */
function fnCanFill(k){
  return grantAt("k_found", "fn:" + k) === "edit" ||
         grantAt("k_proj",  "fn:" + k) === "edit";
}
/* IS THIS FUNCTION IN THE NAVIGATION AT ALL. Asked once, because §59 has
   already been paid for asking the same question in two places. */
function fnShows(k){
  var f = FUNCTIONS[k];
  return !!f && f.active !== false && (fnHasWork(k) || fnCanFill(k));
}
function fnsReachable(){
  return FUNCTION_KEYS.filter(function(k){ return fnShows(k) && reachesFn(k); });
}
/* RETIRED IS THE DEFAULT; DELETED IS FOR THE ONES THAT NEVER STARTED (§62).
   The rule above stands and is the reason this is not a plain delete: a
   function key is written into `c.fn` on a capability, into `p.by` on a
   pillar, into `p.fn` on a person, into `fn:<key>` in the Official BU list,
   and into every reporting key REVIEW and history hold. Removing the row
   leaves each of those pointing at nothing, and nothing would say so.

   So the delete is REFUSED while anything still points at it, and the refusal
   NAMES what — the same contract as retiring a company that still holds units
   (§49.3). Islam asked for it because a function created by mistake, or one
   the client turned out not to run, could only ever be retired: a permanent
   row in a list of sixteen, and no way to take it back out.

   ANYTHING EVER REPORTED IS A REFUSAL, not a warning. A figure that was
   submitted is a record, and a record whose subject has been deleted is worse
   than a tidy list — that case is what Retire is for, and the refusal says so.
   Its own unsaved plan is NOT a blocker: it is the function's, it goes with
   it, and the confirmation says what goes. */
/* Each blocker carries BOTH lengths. The actions cell has room for four words
   and the refusal has to name what is in the way and where to go and fix it —
   one string cannot be both, and writing the long one twice is how the two
   come to disagree. `short` sits in the row, `full` is the tooltip and the
   sentence the refusal speaks. */
function fnBlock(short, full){ return { short:short, full:full }; }
function fnDeleteBlockers(fk){
  var out = [], f = FUNCTIONS[fk];
  if (!f) return [fnBlock("unknown", "no such function")];
  var caps = capsOfFunction(fk);
  if (caps.length) out.push(fnBlock(
    plural(caps.length, "capability", "capabilities"),
    plural(caps.length, "capability", "capabilities") +
    " improved here (" + caps.map(function(c){ return c.name; }).join(", ") +
    ") \u2014 reallocate them on Setup \u2192 Capabilities"));

  /* A pillar anywhere in the tenant that reads its score from this function.
     Over units AND pillars functions, because a function that plans in
     pillars carries pillars that can name a carrier too (§59). */
  var carried = [];
  UNIT_KEYS.forEach(function(k){
    (UNITS[k].items || []).forEach(function(p){
      if (p.by === fk) carried.push(UNITS[k].name + " \u00b7 " + (p.code || p.name));
    });
  });
  FUNCTION_KEYS.forEach(function(k){
    if (k === fk) return;
    fnItems(FUNCTIONS[k]).forEach(function(p){
      if (p.by === fk) carried.push(FUNCTIONS[k].name + " \u00b7 " + (p.code || p.name));
    });
  });
  if (carried.length) out.push(fnBlock(
    plural(carried.length, "pillar") + " scored from here",
    plural(carried.length, "pillar") + " scored from here (" +
    carried.join(", ") + ") \u2014 clear the pointer on the plan that names it"));

  var here = PEOPLE.filter(function(p){ return p.fn === fk && personActive(p); })
                   .map(function(p){ return p.name; });
  if (here.length) out.push(fnBlock(
    plural(here.length, "person", "people") + " attached",
    plural(here.length, "person", "people") + " attached here (" +
    here.join(", ") + ") \u2014 move them on Setup \u2192 People register"));

  var mb = (GROUP.mainbus || []).filter(function(b){
    return mainbuAts(b).indexOf("fn:" + fk) > -1;
  }).map(function(b){ return b.name; });
  if (mb.length) out.push(fnBlock(
    plural(mb.length, "Official BU") + " pointing here",
    plural(mb.length, "Official BU") + " pointing here (" +
    mb.join(", ") + ") \u2014 unmap it on Setup \u2192 Official BU list"));

  if (fnEverReported(fk)) out.push(fnBlock("reported against",
    "figures have been reported against it \u2014 that is a record, so retire " +
    "it instead of deleting it"));
  return out;
}
/* ── THE CYCLE NOTE IS A LINE SOMEBODY WROTE, OR IT IS NOT THERE (§246) ──
   Islam: *"for functions who already didn't fill the notes an achievments
   slide it's still appearing."*

   §243 MADE THAT SLIDE CONDITIONAL AND THE CONDITION IS RIGHT; what it read
   was not. The deck's own note box is `contenteditable` and wrote
   `box.textContent` straight into `REVIEW.note` on every keystroke — and until
   §243 that box was drawn on EVERY deck — so anybody who clicked into it and
   pressed space, or typed a word and deleted it, left a note made of
   whitespace. Whitespace is truthy, so the slide came back for a note nobody
   had written. §104.10's trap in a third place: the falsy test is not the
   same question as "did somebody say something".

   ONE READER AND ONE WRITER. Five places read this value and two wrote it, and
   a definition of *there is a note* that lives in five places is one that
   disagrees with itself the first time somebody tightens one of them (§53.5).

   TRIMMED ON READ AS WELL AS ON WRITE, so the notes already sitting in a
   client's database behave correctly today and nothing is migrated — and the
   emptied key is DELETED (§50.6), so a note never written and one written and
   cleared are the same absence rather than two states nothing distinguishes. */
function cycleNote(target){
  var v = (REVIEW.note || {})[target];
  return typeof v === "string" ? v.trim() : "";
}
function setCycleNote(target, text){
  if (!REVIEW.note) REVIEW.note = {};
  var v = String(text == null ? "" : text).trim();
  if (v) REVIEW.note[target] = v;
  else delete REVIEW.note[target];
}
/* Has this function ever been part of a cycle. Submitted, noted, snapshotted
   or archived — any one of them makes it history. */
function fnEverReported(fk){
  var t = "fn:" + fk;
  if (REVIEW.submitted && REVIEW.submitted[t]) return true;
  if (cycleNote(t)) return true;
  if (REVIEW.slides && REVIEW.slides[t]) return true;
  if ((ARCHIVES || []).some(function(a){ return a.key === t; })) return true;
  /* A closed cycle carries a score per subject, and a score whose subject has
     been deleted is a column in the history with nothing behind it. */
  if ((HISTORY || []).some(function(h){ return h.units && h.units[t] != null; })) return true;
  var f = FUNCTIONS[fk];
  if (f) {
    var reported = fnItems(f).some(function(p){
      return (p.measures || []).some(function(m){ return m.actual !== "" && m.actual != null; }) ||
             /* §252: `tacticAnswered`, or a function whose tactics all report
                through their outcomes reads as never having reported -- and
                this is what stands between it and being deleted (§62). */
             (p.tactics  || []).some(tacticAnswered);
    });
    if (reported) return true;
  }
  return false;
}
/* What a delete takes with it, so the confirmation can say it rather than
   asking somebody to trust a button (§49.2's lesson, from the other end). */
function fnDeleteTakes(fk){
  var f = FUNCTIONS[fk], out = [];
  if (!f) return out;
  var items = fnItems(f);
  if (items.length) out.push(plural(items.length, L("pillar", "bu").toLowerCase().replace(/s$/, "")));
  if (f.head || f.custodian) out.push(plural((f.head ? 1 : 0) + (f.custodian ? 1 : 0), "named role"));
  return out;
}
function deleteFunction(fk){
  if (!FUNCTIONS[fk] || fnDeleteBlockers(fk).length) return false;
  var i = FUNCTION_KEYS.indexOf(fk);
  if (i > -1) FUNCTION_KEYS.splice(i, 1);
  delete FUNCTIONS[fk];
  return true;
}
/* A function is retired, never deleted \u2014 unless nothing points at it and
   nothing was ever reported against it, which is fnDeleteBlockers() above. */
/* Clearing a capability. Its PLAN is the work it intends \u2014 today measures and
   initiatives, tomorrow enhancement projects. Its PROGRESS is what has been
   reported against that work. The definition is the capability's identity, not
   its plan, so it survives both. */
function clearCapability(cap, what, why){
  if (what === "plan") {
    /* Archived first, exactly as an upload that replaces it would (§49.2). */
    var archived = archiveCapPlan(cap, why);
    /* A capability's plan is its key objectives and its PROJECTS, each
       carrying deliverables, outcomes and milestones. Until 2026-08-20 this
       emptied `cap.measures` and `cap.tactics` — the fields a capability
       stopped having in 1.7 when the project model replaced them. The line
       threw on a missing array, so "Clear all plans" on Supporting functions
       had done nothing at all since then. The definition survives: it is the
       capability's identity, not its plan. */
    if (cap.keyObjectives) cap.keyObjectives.length = 0;
    if (cap.projects) cap.projects.length = 0;
    return archived;
  }
  (cap.keyObjectives || []).forEach(function(m){ m.actual = ""; m.progress = null; m.note = ""; });
  (cap.projects || []).forEach(function(p){
    (p.deliverables || []).forEach(function(d){ d.status = null; d.pct = null; d.note = ""; });
    (p.outcomes || []).forEach(function(o){ o.actual = null; o.progress = null; o.note = ""; });
    (p.milestones || []).forEach(function(m){ m.status = null; m.pct = null; m.note = ""; });
  });
}
/* One function may carry several capabilities \u2014 Marketing carries two \u2014 so
   clearing at the function level names how many it will take with it. */
function clearFunction(fnKey, what, why){
  capsOfFunction(fnKey).forEach(function(c){ clearCapability(c, what, why); });
}
function functionCapCount(fnKey){ return capsOfFunction(fnKey).length; }

function activeFunctionKeys(){
  return FUNCTION_KEYS.filter(function(k){ return FUNCTIONS[k].active !== false; });
}
function reachesCap(cap){ return !!cap.fn && reachesFn(cap.fn); }
function capsReachable(){ return GROUP.capabilities.filter(reachesCap); }
function unitsReachable(){
  return activeKeys().filter(reaches);
}
/* The folds exist for the length problem, and only two roles have one. Someone
   who reaches a single unit never meets the concept. */
function navFolds(){
  return unitsReachable().length > 1 && fnsReachable().length > 1;
}

function functionsOfPerson(personKey){
  return FUNCTION_KEYS.filter(function(k){
    return functionPeople(k).indexOf(personKey) > -1;
  });
}

/* ── The reporting cycle ──────────────────────────────────────────────────
   A window the SMO opens. It becomes a request sitting with each unit's owner,
   and closing it snapshots everything \u2014 which is what finally gives the
   product a past to compare against.

   The window's end is where `as-of` comes from. It was a constant of 2 sitting
   in the data; a review that covers Jan\u2013Jun and one that covers the full year
   cannot both be measured from the same quarter. */
var REVIEW = {
  name: "H1 2026",
  from: "Jan 2026", to: "Jun 2026", due: "15 Jul 2026",
  endsQuarter: 2,
  state: "open",              /* open | closed */
  /* Seeded mid-cycle: most units have reported and submitted, a few are still
     working, one has not begun. A board on which every row says the same thing
     demonstrates nothing \u2014 the same lesson the focus board taught. */
  note: {
    mobile: "Digital work is landing but the app rollout slipped a quarter behind the principal's own launch. Q3 recovery agreed with Ramy.",
    retailstores: "Strong half on revenue per store. New store programme is one site behind, land permits.",
    care: "First-time fix rate now above target for the first time. Headcount is the constraint on the next step."
  },
  submitted: { retailstores:true, care:true, corporate:true, it:true, logistics:true, onlineshop:true },
  cadence: "Half-yearly"
};

/* Prior closes. Only the headline per unit is kept here; a real build snapshots
   every figure and the target it was judged against. Seeded with one earlier
   cycle so deltas have something to read \u2014 these numbers are invented. */
var HISTORY = [
  { name:"H2 2025", group:64,
    units:{ mobile:56, retailstores:79, b2becomm:61, consumerelectronics:58, onlineshop:66,
            corporate:71, care:66, it:63, logistics:69, nigeria:44 } }
];
function lastClose(){ return HISTORY.length ? HISTORY[HISTORY.length - 1] : null; }
/* A TARGET IS A UNIT KEY OR "fn:<key>", and everything that takes one has to
   resolve it the same way (§59). `UNITS[key]` alone was right until spec 010
   let a function be drawn by the unit's pages: `UNITS["fn:merchandising"]` is
   undefined, and the first thing to ask it for a field threw.

   One resolver, so the next caller cannot get it wrong — and it returns null
   rather than a shape for a function that plans in projects, because there is
   no unit-shaped thing there to return. */
function unitLike(target){
  var t = String(target || "");
  if (t.indexOf("fn:") !== 0) return UNITS[t] || null;
  return fnAsUnit(t.slice(3));
}
function deltaFor(key){
  var h = lastClose(); if (!h) return null;
  var u = key === "group" ? null : unitLike(key);
  if (key !== "group" && !u) return null;
  var was = key === "group" ? h.group : h.units[key];
  var now = key === "group" ? groupUnitsObjectives() : unitObjectives(u);
  if (was == null || now == null) return null;
  return { was:was, d:now - was };
}

/* Whether the plan may be edited. Opening a cycle does not freeze the plan
   outright \u2014 it makes changes the SMO's alone for the span, so a mid-cycle
   correction still goes through one accountable hand rather than a unit
   quietly moving its own target while reporting against it. */
function planEditable(){
  return REVIEW.state !== "open" || inOffice();
}

/* Reporting reaches the unit's owner and its head; the owner is the primary
   user. The SMO can enter on anyone's behalf, and enters the group's own
   objectives and capabilities directly \u2014 nobody is asked for those. */
/* Reporting now asks the MATRIX, not a hard-coded list of two role names.
   Before spec 006 this was `head or custodian or SMO`, which meant the
   contributor row of the access page could not do anything even when the SMO
   set it to edit — a control that changes nothing is worse than no control.
   It also means the screen and the server answer from the same function. */
function canReport(unitKey){
  if (REVIEW.state !== "open") return false;
  /* A locked cycle takes no more figures, from anyone but the SMO — the
     server refuses them, so the screen must not offer them (spec 006 §7.1). */
  if (CYCLE.locked && !inOffice()) return false;
  /* A PILLARS FUNCTION'S REPORT PAGE ASKS THE FUNCTION'S OWN GRANT (§147.9).
     This asked `u_report` for every target, and u_report's area is "unit" —
     so for an fn: target the screen read the own-UNIT cell while the server
     has always judged the same save against the own-FUNCTION one (`edits(…,
     "fn", t)`). Invisible for as long as custodian and head shipped with
     both cells at edit; visible the day one is tightened, and the exact
     screen-says-yes / server-says-no drift §42 exists to prevent. */
  var page = String(unitKey).indexOf("fn:") === 0 ? "k_report" : "u_report";
  return grantAt(page, unitKey) === "edit";
}

/* ONE ROW, for the roles that are limited to their own. Everybody else whose
   grant reaches the unit reports all of it; a contributor reports the rows
   that name them, and a PILLAR OWNER reports the pillar whose Owner row
   names them, whole (§147.7). The same reach rule the server uses (§42) —
   offering a field the server will refuse is the fault this is here to
   avoid. `x` is a reportItems() entry; `x.owner` is §55's rule (a measure
   leans on its pillar's owner), `x.pown` is the pillar's own Owner. */
function canReportRow(unitKey, x){
  if (!canReport(unitKey)) return false;
  var area = String(unitKey).indexOf("fn:") === 0 ? "fn" : "unit";
  return SMPRules.mayReportRow(world(), viewer(), area, unitKey,
    { row: { owner: x.owner, collaborators: x.collaborators },
      pillarOwner: x.pown });
}

/* ── The function side of the same two questions (§147) ────────────
   canReport/canReportRow for an fn: target. The whole-function gate is what
   capReportBody always asked inline; it is a function now because the
   bounded questions have to sit on top of it and two spellings of the same
   three gates is §53.5's drift. Since §147.7 the reach is PER ROW, through
   the same mayReportRow() the server asks: a PROJECT OWNER reaches every
   row of their project; a CONTRIBUTOR (a milestone's owner, a stakeholder)
   reaches the rows that name them; the custodian and the head reach it
   all. */
function canReportFn(fk){
  if (REVIEW.state !== "open") return false;
  if (CYCLE.locked && !inOffice()) return false;
  return grantAt("k_report", "fn:" + fk) === "edit";
}
function canReportFnRow(fk, project, rowObj){
  if (!canReportFn(fk)) return false;
  return SMPRules.mayReportRow(world(), viewer(), "fn", "fn:" + fk,
                               { row: rowObj, project: project });
}
/* The project as a whole — what the rail and the checks ask. True for
   anybody unbounded, and for a bounded role whose reach is the project
   itself (its owner; its stakeholders once the Contributor row is opened). */
function canReportFnProject(fk, p){
  if (!canReportFn(fk)) return false;
  return SMPRules.mayReportRow(world(), viewer(), "fn", "fn:" + fk, { project: p });
}
/* A capability's own key objectives belong to no project, so for anybody
   bounded they are read, never entered. */
function canReportFnWhole(fk){
  return canReportFn(fk) &&
         !SMPRules.onlyOwnLines(world(), viewer(), "fn", "fn:" + fk);
}

/* ── Speaking for the whole unit (§50.5) ───────────────────────────
   Three acts are not about a row: SUBMITTING, the cycle NOTE, and the deck's
   PICTURE SLIDES. Each speaks for the unit in front of whoever is reading the
   review, and the server authorises all three under ONE classification
   (`reportState`, spec 006 §7.2) — so the screen offers them under one
   function. Two copies of that answer would drift, and the drift is silent in
   the worst way: a control the server then refuses.

   A CONTRIBUTOR limited to their own lines does none of them. What they may
   say is about their own rows; a picture slide is the unit's.

   A supporting function HAS contributors since §147 — a project's owner is
   one, derived from the project's Owner row — so its half asks the same
   own-lines exclusion the unit's always has. The sentence that stood here
   ("a function has no contributors to exclude") described the code truly and
   stopped being true the day the floor reached the projects. */
function canSpeakFor(target){
  var t = String(target || "");
  if (t.indexOf("fn:") === 0) {
    return canReportFn(t.slice(3)) &&
           !SMPRules.onlyOwnLines(world(), viewer(), "fn", t);
  }
  return canReport(t) && !SMPRules.onlyOwnLines(world(), viewer(), "unit", t);
}

/* ── THE DOT ON THE PERFORMANCE TAB HAS TO MEAN SOMETHING (§69.9) ──
   It was `.tabs button.primary::before` — painted on whichever tab is the
   landing page, always, on every destination. So it said "this is the regular
   view", which the tab being first already says, and it looked exactly like
   the marks the rest of the platform uses for something outstanding.

   Islam: "bring the orange dot beside it in case of an open cycle for
   reporting that hasn't been submitted yet. if not just keep it without the
   dot." So it becomes a state rather than a decoration, and the state is one
   sentence: THIS SUBJECT owes a submission, and you are somebody who could
   make it.

   THREE THINGS IT IS DELIBERATELY NOT:
   · Not the group's and not a company's. Neither submits — a company carries
     no strategy of its own (§68) and the group's cycle is the thing being
     submitted TO — so "has not submitted" is not a state they can be in, and a
     dot there would have to mean something else. One dot, one meaning.
   · Not "somebody, somewhere, has not submitted". That is the SMO's board on
     the group's Performance page, which says it in full; a dot cannot.
   · Not shown to a reader. canSpeakFor() is the same question the Submit
     button asks (§50.4) — asking it differently here is how a screen comes to
     nag somebody who has no control that would clear it. */
function reportPending(target){
  if (!REVIEW || REVIEW.state !== "open") return false;
  var t = String(target || "");
  if (t === "group" || t.indexOf("co:") === 0) return false;
  /* A real subject, asked the way §59 says to ask: a unit key or fn:<key>,
     resolved in ONE place. A function that plans in projects still submits —
     it is `unitLike()` that has nothing unit-shaped to return for it, not the
     cycle — so this checks the thing EXISTS rather than what shape it has. */
  var real = t.indexOf("fn:") === 0 ? !!FUNCTIONS[t.slice(3)] : !!UNITS[t];
  if (!real) return false;
  if (REVIEW.submitted && REVIEW.submitted[t]) return false;
  return canSpeakFor(t);
}

/* ── The source of a figure (§16.7) ────────────────────────────────
   A key objective or a measure may carry `src` — the team that is master of
   the number and the person in it who enters it. Where it does, the UNIT sees
   the figure and does not type it, and the source enters it once for every
   unit that uses it.

   The note is a separate question and always the unit's: the number is the
   source's, the performance is the unit's, and the explanation belongs to
   whoever owns the performance. */
function srcOf(x){ var o = x && (x.obj || x); return SMPRules.isSourced(o) ? o.src : null; }
/* What the UNIT reads beside a figure it does not enter. A SET is named by its
   TEAM — the BU head is reading it to know who to talk to, and "Financial
   Figures" does not answer that while "Finance" does. A figure a unit
   custodian named directly has no team, so it names the person, who there IS
   the answer to "who do I ask". */
function srcLabel(x){
  var o = x && (x.obj || x);
  if (!SMPRules.isSourced(o)) return "";
  if (o.src.set) {
    var set = SMPRules.setById(world(), o.src.set);
    if (!set) return "another set";
    var f = FUNCTIONS[set.team];
    return f ? (f.navName || f.name) : (set.team || set.name || "another set");
  }
  return personName(o.src.by) || o.src.by;
}
function figureAssignee(x){
  var o = x && (x.obj || x);
  return SMPRules.assigneeOf(world(), o);
}
/* May THIS viewer type THIS figure? One function, because a screen that asks
   it in two places will eventually answer differently from the server. */
function canEnterFigure(unitKey, x){
  var who = figureAssignee(x);
  if (!who) return canReportRow(unitKey, x);
  if (inOffice()) return canReport(unitKey);
  return who === viewer().key && REVIEW.state === "open" && !CYCLE.locked;
}
/* The note stays with the unit whatever the figure does. */
function canEnterNote(unitKey, x){
  var who = figureAssignee(x);
  if (who && !inOffice() && who === viewer().key &&
      grantAt("u_report", unitKey) !== "edit") return false;
  return canReportRow(unitKey, x);
}
/* Every figure this person enters, across every unit — resolved through the
   sets, never off the row. Their reporting surface is built from it, and so is
   the answer to "does this person have one at all". */
function mySourceRows(){ return SMPRules.sourcesFor(world(), viewer()); }
function ownsAnySource(){ return mySourceRows().length > 0; }
/* The sets this viewer may open a picking page for. Empty for almost everyone,
   and the page is then not offered — "the owner picks" IS the grant of sight
   over the whole group's figures, so there is no half-view to draw. */
function myPickableSets(){ return SMPRules.pickableSets(world(), viewer()); }
function canPickSets(){ return myPickableSets().length > 0; }
function setsList(){ return (GROUP.sets = GROUP.sets || []); }
function setById(id){ return SMPRules.setById(world(), id); }
/* ── Claim requests (spec 008 §5) ────────────────────────────────── */
function claimsList(){ return (GROUP.claims = GROUP.claims || []); }
function openClaimsList(){ return SMPRules.openClaims(world()); }
function myOpenClaim(figureId, setId){
  return SMPRules.openClaimFor(world(), figureId, setId);
}
/* Ids are minted, not typed — the same rule a plan's codes follow (§22). No
   clock: a repaint must not mint a different id for the same request, and the
   platform has no reliable "now" it can put in the graph anyway. */
function mintClaimId(){
  var n = 1, ids = {};
  claimsList().forEach(function(c){ ids[c.id] = 1; });
  while (ids["cl" + n]) n++;
  return "cl" + n;
}
function claimFigure(c){
  var row = SMPRules.rowById(world(), c.unit, c.figure);
  return row ? row.name : c.figure;
}

/* ── Naming a person against ONE figure (spec 008 §3B) ─────────────
   The second way a figure gets an owner, and the one that needs no set: a
   unit's strategy custodian names somebody against a number on their own
   plan. OFF until the tenant switches it on, and the same switch is read by
   the server — hiding the page would leave the save unguarded (§42). */
function namingOn(){ return SMPRules.namingOn(world()); }
function canName(unitKey){ return SMPRules.mayName(world(), viewer(), unitKey); }
/* Every figure in one unit, in the order the plan reads: the directions
   first, then each pillar's measures. One list, because the page is the
   custodian's own plan with a name against each number, not a search. */
function figuresOf(u){
  var out = [];
  (u.keyObjectives || []).forEach(function(m){
    out.push({ id:m.id, row:m, group:L("keyobj","bu") });
  });
  (u.items || []).forEach(function(p, pi){
    (p.measures || []).forEach(function(m){
      out.push({ id:m.id, row:m, group:pillarCode(u, pi) + " " + p.name });
    });
  });
  return out;
}

function mintSetId(name){
  var base = String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 14) || "set";
  if (!setById(base)) return base;
  var n = 2; while (setById(base + n)) n++;
  return base + n;
}
/* What a unit is still waiting on from somebody else. A blocked Submit with
   no explanation is hostile: the page has to say what is outstanding and who
   owes it (§16.7, settled). */
function outstandingSources(u){
  return askedItems(u).filter(function(x){
    var src = srcOf(x);
    return !!src && (x.obj.actual == null || x.obj.actual === "");
  });
}

/* What this cycle asks a unit for: its objectives, every measure carrying a
   target, and the tactics whose quarters fall inside the window. A tactic
   outside it is not an empty box somebody forgot \u2014 it is not asked. */
function reportItems(u){
  var out = [];
  /* §233: a hidden row is not asked — not counted means not owed, so it
     leaves the ask list, the note rule and the submit gate in one skip. */
  SMPRules.shown(u.keyObjectives).forEach(function(m){
    out.push({ id:m.id, obj:m, kind:"objective", group:L("keyobj","bu"), sub:"" });
  });
  u.items.forEach(function(p, pi){
    var head = pillarCode(u, pi) + " " + p.name;
    /* `owner` travels with the row so canReportRow() can answer without
       walking back up to the pillar. A MEASURE names nobody of its own, so it
       carries its pillar's owner — the nearest thing the data supports until
       a measure has an owner of its own. */
    /* `pown` is the pillar's own Owner, for the pillar-owner role's reach
       (§147.7) — carried beside §55's `owner` lean rather than replacing it,
       so nothing a contributor could reach before the role existed moves. */
    SMPRules.shown(p.measures).forEach(function(m){
      out.push({ id:m.id, obj:m, kind:"measure", group:head, sub:"",
                 owner:p.owner, pown:p.owner });
    });
    SMPRules.shown(p.tactics).forEach(function(t){
      out.push({ id:t.id, obj:t, kind:"tactic", group:head,
                 sub:spanLabel(t), asked:tacticDue(t),
                 owner:t.owner, collaborators:t.collaborators, pown:p.owner });
    });
  });
  return out;
}
function askedItems(u){
  return reportItems(u).filter(function(x){ return x.kind !== "tactic" || x.asked; });
}
/* ── HAS THIS ROW BEEN ANSWERED? (§252) ────────────────────────────
   One predicate, because six places were asking it and five of them were
   asking `x.obj.actual` -- which is the wrong box for a tactic measured by
   its outcome (§248). Measured on Mobile: entering the outcome's figure took
   the report from 41 of 41 to 40 of 41, so the reporting page, the SMO's
   cycle board and the welcome screen all said a unit still owed a figure it
   had just entered, and Submit refused it with "1 figure still to enter".

   The ternary this replaces had the SAME expression in both branches -- the
   tactic branch had been written and then never filled in, which is as close
   to a note saying "this is the one that differs" as code gets. */
function rowAnswered(x){
  var o = x && (x.obj || x);
  if (!o) return false;
  if (x.kind === "tactic") return tacticAnswered(o);
  /* A deliverable and a milestone say how far they have got rather than
     carrying a figure (§104.10) -- unchanged, and gathered here so the
     question has one answer rather than three. */
  if (x.kind === "deliverable" || x.kind === "milestone") return statusGiven(o);
  return o.actual != null && o.actual !== "";
}
function reportedCount(u){
  var a = askedItems(u), n = 0;
  a.forEach(function(x){ if (rowAnswered(x)) n++; });
  return { done:n, total:a.length };
}
/* A note is required where a figure lands in the bottom two bands. A red
   number with no explanation is the thing a review meeting stalls on. */
/* WHAT A ROW READS, whatever kind of row it is. A tactic is a ratio, a
   deliverable and a milestone are a status-and-per-cent (§104.10), and
   everything else carries `progress`. One reader, because the note rule and
   the board both ask and two copies would disagree about a deliverable. */
function rowReads(x){
  /* §252: through `tacticProgress`, or the note rule cannot see an outcome at
     all -- a tactic reporting 2 of a target of 10 read null, so nobody was
     ever asked to explain it and Submit let it through unexplained. */
  if (x.kind === "tactic") return tacticProgress(x.obj);
  if (x.kind === "deliverable" || x.kind === "milestone") return statusReads(x.obj);
  /* §239: the prorated score, so a unit is asked to explain a figure that is
     actually behind rather than one that only looks behind against a whole
     year. The note rule and the Submit gate both hang off this. */
  return measureScore(x.obj);
}
function needsNote(x){
  var p = rowReads(x);
  if (p == null) return false;
  var k = bandOf(p).key;
  /* `warn` IS KEPT ON PURPOSE (§163). The shipped bands are three now and this
     tenant has no `warn`, so the second test is dead here — and a tenant that
     saved the old four still has one, and dropping it would quietly stop
     asking for a note on every figure between 50 and 69 in their deployment.
     The ranges happen to coincide on the new defaults (bad is everything below
     70, which is what bad+warn covered before), so nobody's obligations move. */
  return (k === "bad" || k === "warn") && !(x.obj.note && x.obj.note.trim());
}
function missingNotes(u){ return askedItems(u).filter(needsNote); }

/* ── A SUPPORTING FUNCTION REPORTS AND SUBMITS (§105) ────────────────────
   The same three answers a unit has, over a function's own vocabulary: key
   objectives, deliverables and outcomes, milestones. `reportItems()` could not
   be reused -- a unit's rows hang off pillars and a function's off
   capabilities -- but everything downstream is shared, which is why `kind` is
   the only thing that differs and `rowReads()` above is one function.

   ASKED is per row and per cycle, exactly as `tacticDue()` is for a unit: a
   milestone due in December is not an empty box somebody forgot in June. */
function fnReportItems(fk){
  var out = [];
  capsOfFunction(fk).forEach(function(c){
    /* §233: hidden rows are not asked, exactly as reportItems() skips them. */
    SMPRules.shown(c.keyObjectives).forEach(function(m){
      out.push({ id:m.id, obj:m, kind:"objective", group:c.name, sub:"", asked:true });
    });
    (c.projects || []).forEach(function(p){
      var head = c.name + " \u00b7 " + (p.code || p.name);
      SMPRules.shown(p.deliverables).forEach(function(d){
        out.push({ id:d.id, obj:d, kind:"deliverable", group:head, sub:"",
                   asked:dueThisCycle(d.due), owner:p.owner });
      });
      SMPRules.shown(p.outcomes).forEach(function(o){
        out.push({ id:o.id, obj:o, kind:"outcome", group:head, sub:"",
                   asked:outcomeDue(o), owner:p.owner });
      });
      SMPRules.shown(p.milestones).forEach(function(m){
        out.push({ id:m.id, obj:m, kind:"milestone", group:head, sub:"",
                   asked:dueThisCycle(m.finish), owner:m.owner || p.owner });
      });
    });
  });
  return out;
}
function fnAskedItems(fk){
  return fnReportItems(fk).filter(function(x){ return x.asked; });
}
function fnReportedCount(fk){
  var a = fnAskedItems(fk), n = 0;
  /* §252: the same predicate the unit's count asks. A function has no
     tactics, so nothing here moves -- what goes is the second copy. */
  a.forEach(function(x){ if (rowAnswered(x)) n++; });
  return { done:n, total:a.length };
}
function fnMissingNotes(fk){ return fnAskedItems(fk).filter(needsNote); }

/* ── WHAT STOPS A SUBMISSION, ASKED ONCE FOR BOTH SIDES (§105) ───────────
   A unit and a function are the same product (§53.5), so the refusal is one
   function taking a TARGET rather than two that will drift. It returns the
   rows, never a sentence, because the caller says it in its own words.

   Two rules, and the second is new: a figure in the bottom two bands with no
   note (a red number nobody explained is what a review meeting stalls on),
   and a row that said In progress and never said how far (§104.10 -- the
   score leaves it out, so submitting would file a report with a hole in it). */
/* §220: has this report been closed — submitted, or parked as a draft?
   One reading, so the bar, the lock and the pen cannot disagree (§53.5). */
function reportParked(target){
  return !!((REVIEW.parked || {})[String(target || "")]);
}
function reportClosed(target){
  return reportParked(target) ||
         !!((REVIEW.submitted || {})[String(target || "")]);
}
/* ── WHAT A SUBJECT IS ASKED FOR, BY ITS SHAPE (§242) ────────────────────
   Islam, from a live client: *"the key objectives reporting wasn't done and
   the button of submit to smo was allowed."* Both halves of that were true and
   the second is this function. It asked by PREFIX — every `fn:` target went to
   `fnAskedItems()`, which walks CAPABILITIES — and a function that plans in
   pillars has none. So the submit gate looked at an empty list, found nothing
   owed, and opened the button.

   Measured on Merchandising with every figure stripped:

       the reporting page   0 of 10 entered
       the submit gate      0 of  0  — nothing in the way
       a unit, same state   0 of 41  — "41 figures still to enter"

   §59's rule in the last place still asking by prefix, and the same fault
   §224 fixed on the Present button: THE FORMAT DECIDES, NOT THE PREFIX. A
   pillars function's plan is unit-shaped, so it is asked the unit's question
   through `unitLike()`, exactly as its Report page already draws it.

   It was never only the count. `submitBlockers` reads its ROWS from the same
   list, so the note rule (§105) and the In-progress rule (§104.10) had never
   once run on a function that plans in pillars either.

   ONE READER, because the welcome screen asks the same question one line
   before it asks this one, and two answers to "what does this subject owe"
   is how a screen comes to disagree with the button on it (§53.5).

   A pillars function is never ALSO asked for capabilities: the format cannot
   be switched while the other side holds anything (§59), so the two lists are
   exclusive by construction rather than by a rule here. */
function subjectAsked(target){
  var t = String(target || ""), u = plansInPillars(t) ? unitLike(t) : null;
  if (u) return askedItems(u);
  var fk = fnKeyOfTarget(t);
  return fk && FUNCTIONS[fk] ? fnAskedItems(fk) : [];
}
function subjectReported(target){
  var t = String(target || ""), u = plansInPillars(t) ? unitLike(t) : null;
  if (u) return reportedCount(u);
  var fk = fnKeyOfTarget(t);
  return fk && FUNCTIONS[fk] ? fnReportedCount(fk) : { done:0, total:0 };
}
function submitBlockers(target){
  var t = String(target || "");
  var rows = subjectAsked(t), counted = subjectReported(t);
  return { notes: rows.filter(needsNote),
           pending: rows.filter(function(x){ return statusPending(x.obj); }),
           /* §221, Islam: *"remove the ability of people to submit a report
              that is not complete … until everything is submitted the report
              should be only saved as draft."* Two rules, and the second is
              his too: a plan still missing something is not ready to be
              reported on either. The gap count IGNORES the viewer, or a unit
              head would submit past holes only the office can fill. */
           owed: Math.max(0, counted.total - counted.done),
           gaps: gapTotalAll(t),
           /* §218: `confirms` GOES WITH THE APPROVAL. It named values the
              office had not yet ticked, and there is no tick — a filled
              value is live, so there is nothing for a submission to wait
              on. The two remaining rules are unchanged. */ };
}
/* The refusal in words, or "" when nothing is in the way. Said in ONE place so
   the two Submits cannot explain themselves differently. */
function submitRefusal(target){
  var b = submitBlockers(target), say = [];
  if (b.owed) say.push(plural(b.owed, "figure") +
    " still to enter.");
  if (b.gaps) say.push(plural(b.gaps, "item") +
    " missing in the plan.");
  if (b.pending.length) say.push(plural(b.pending.length, "row") +
    " said In progress and did not say how far. Enter a per-cent for each.");
  if (b.notes.length) say.push(plural(b.notes.length, "figure") +
    " " + (b.notes.length === 1 ? "is" : "are") +
    " at risk or off track with no note. Add a line to each.");
  return say.join("\n\n");
}
/* ── THE SAME REFUSAL, SHORT ENOUGH FOR A HOVER (§221) ──────────────────
   `submitRefusal()` explains at the length a banner can carry; the dimmed
   button has to say it in a bubble. ONE LIST OF REASONS behind both, or the
   control and the explanation start disagreeing about why it is shut. */
function submitWhyShort(target){
  var b = submitBlockers(target), lines = [];
  if (b.owed)  lines.push(plural(b.owed, "figure") + " still to enter");
  if (b.gaps)  lines.push(plural(b.gaps, "item") + " missing in the plan");
  if (b.pending.length) lines.push(plural(b.pending.length, "row") +
    " said In progress with no per-cent");
  if (b.notes.length)   lines.push(plural(b.notes.length, "figure") +
    " at risk with no note");
  if (!lines.length) return "";
  return "Cannot submit yet:\n\u2022 " + lines.join("\n\u2022 ");
}
function unitState(u){ return reportState(reportedCount(u), u.ukey); }
function fnState(fk){ return reportState(fnReportedCount(fk), "fn:" + fk); }
/* One reading of "where has this subject got to", asked of a count and a key,
   so the board cannot describe a function differently from a unit (§53.5). */
function reportState(c, key){
  if (REVIEW.submitted && REVIEW.submitted[key]) return { key:"done", label:"Submitted" };
  if (!c.done) return { key:"late", label:"Not started" };
  return { key:"part", label:"In progress" };
}

/* ── HOW THE CYCLE IS GOING, ASKED ONCE (§108.9) ──────────────────────
   The Reporting cycle page computed this inline, which was right while it was
   the only page that wanted it. The Overview opens on the same four numbers,
   and a second loop over activeKeys() would be two answers to one question —
   the drift §53.5 exists to catch, invited deliberately by a page whose whole
   job is to summarise other pages.

   `progress` is DERIVED rather than counted, and that is the cycle page's own
   arithmetic moved rather than re-reasoned: a unit is in progress when it is
   neither submitted nor untouched, so it is the remainder and can never
   disagree with the other two. */
/* WHICH SUPPORTING FUNCTIONS ARE ON THE BOARD (§105, named once in §108.1).
   The filter was written inline in renderCycle(); the totals need exactly the
   same list, and two copies of it is how a board and its own summary come to
   disagree about how many things were asked for. */
/* ── WHO IS ON THE CYCLE BOARD (§244, placed by §245) ────────────
   Islam, told that a function planning in pillars appears nowhere on the
   board: *"put them on the unit half."* Then, having looked at it:
   *"merch and marketing and cf should be with functions not units"*, and
   *"don't split functions planning in pillars from functions planning in
   projects — they are functions reporting."*

   §244 FOUND THE HOLE AND PUT THE ROWS IN THE WRONG PLACE. They were filtered
   off BOTH halves: the function half asks for capabilities
   (`capsOfFunction(fk).length`), which a pillars function has none of by
   construction (§59), and the unit half read `activeKeys()`, which is units —
   so Consumer Finance could be a week late and the page the office watches
   would carry no row for it. That much was right and is unchanged.

   THE PLACEMENT IS HIS, AND THE COLUMN HEADING IS THE ARGUMENT: that block
   sits under **Business unit**, which a supporting function is not. §244
   reasoned from the three COUNT columns and answered a question nobody was
   asking — this board is scanned for *who owes a report*, and a function owes
   one as a function whatever shape its plan takes.

   AND THE FORMAT IS NOT A GROUPING. Two bands were drawn and he refused them:
   how a function plans is a fact about its own pages, not about its place on
   this board, and splitting the list by it makes somebody looking for
   Marketing decide which half to look in first. ONE band, one list, in the
   register's own order — the shape decides only which counters a row is read
   with, inside the builder, where nobody scanning the page has to know.

   TWO LISTS, because the totals must have exactly the membership the rows
   have: §108.1's miscount is the parts growing while the divisor did not. */
function boardUnitTargets(){
  return activeKeys();
}
/* Every supporting function that can be asked for a report, in ONE list and in
   the register's own order. A pillars function has no capabilities to count, so
   what it must have instead is a plan of its own -- a row for a subject nobody
   can report on is a row nobody can clear (§61). */
function boardFunctionTargets(){
  return boardFunctionKeys().map(function(fk){ return "fn:" + fk; });
}
/* Who the board names against a subject: the custodian, then the head — the
   same order and the same two roles on a unit and on a function (§53.5). */
function boardWho(target){
  var fk = fnKeyOfTarget(target);
  var r = fk ? (FUNCTIONS[fk] || {}) : (UNIT_ROLES[target] || {});
  return personName(r.custodian) || personName(r.head) || "\u2014";
}
function boardFunctionKeys(){
  return Object.keys(FUNCTIONS).filter(function(fk){
    if (!fnShows(fk)) return false;
    return fnPlansInPillars(FUNCTIONS[fk]) ? true : !!capsOfFunction(fk).length;
  });
}
/* Which counters a board row is read with: the FORMAT decides, never the `fn:`
   prefix (§59, and §224's own fault on the Present button). This is the only
   place the shape matters -- the list above and the band below know nothing
   about it, which is what lets the two formats sit in one list (§245). */
function boardPlansLikeUnit(target){
  var fk = fnKeyOfTarget(target);
  return !fk || fnPlansInPillars(FUNCTIONS[fk] || {});
}

/* ── WHAT A CYCLE SAYS ABOUT ITSELF (§120.1) ──────────────────────────
   Islam, on a client tenant whose cycle has no dates: the strip read
   **"to  ·  due  ·  as of Q4"** — three separators and nothing between them,
   because the line was built by gluing the words around three values and the
   punctuation survives when the values do not.

   IT IS NOT THE OVERVIEW'S FAULT AND THAT IS WHY IT LIVES HERE. The identical
   line renders on the Reporting cycle page and has since long before the
   Overview existed; the Overview only made it the first thing anybody sees.
   Two surfaces onto one sentence is exactly how the two come to say it
   differently (§53.5), so the sentence is built ONCE and both read it.

   AN ABSENT DATE IS SAID, NOT PUNCTUATED. A tenant that has not set its dates
   has a real state, and "Dates not set" is what it is — the same argument as
   §93's dash for a password nobody has been asked about, and §108.10's rule
   that a page must be able to say NOTHING is here rather than draw an empty
   shape. The quarter is always known (it is a number, not a date), so it is
   always said. */
/* ── EDITING THE CYCLE THAT IS RUNNING (§273) ─────────────────────────
   Islam: "allow me to edit the cycle name. give me an edit button the cycle to
   edit the date as you already built and the cycel name edit as well" — and
   then, of the two shapes drawn for him: "keep the close cycle inside the
   edit. as it's a critical button to click, the pen should hold everything
   editable so it's kept secured."

   Until now a cycle's name and its three dates were written ONCE, when it was
   opened (§47.8), and were plain text ever after — so a typo in the name, or a
   due date that moved, could only be corrected by CLOSING the cycle and
   opening another, which archives and clears every figure in the tenant
   (§49.1). The review point was the one thing that could be changed while the
   cycle ran (§239), and it was changed in place on the strip.

   THE DRAFT IS A DRAFT, exactly as `NEWCYCLE` is: nothing touches REVIEW until
   Save, so Cancel writes nothing and there is no half-applied state to undo.
   `asOfMonth` is carried only when it is SET, or opening the pen on a cycle
   that never picked one would put an empty key into the draft and saving it
   would write a phantom change into every later save (§50.6, §42's
   `branding()` fault).

   AND THE SECOND HALF IS WHY THE FIRST IS SAFE. With Close now inside the pen
   it sits beside four fields somebody may have typed into, and closing files
   this cycle's figures under its NAME — so `cycleEditDirty()` is what stops a
   press from either quietly saving a rename or quietly throwing one away.
   Compared TRIMMED against the stored cycle, so re-typing the same value with
   a stray space is not a change to hold anybody up over (§96.2 is about what
   is STORED; this is about whether anything moved). */
function cycleDraft(){
  var d = { name:String(REVIEW.name || ""), from:String(REVIEW.from || ""),
            to:String(REVIEW.to || ""), due:String(REVIEW.due || "") };
  if (REVIEW.asOfMonth) d.asOfMonth = REVIEW.asOfMonth;
  return d;
}
function cycleEditDirty(){
  if (!CYCLEEDIT) return false;
  var same = ["name", "from", "to", "due"].every(function(k){
    return String(CYCLEEDIT[k] || "").trim() === String(REVIEW[k] || "").trim();
  });
  return !same || String(CYCLEEDIT.asOfMonth || "") !== String(REVIEW.asOfMonth || "");
}

function cycleMeta(){
  var bits = [];
  var from = String(REVIEW.from || "").trim();
  var to   = String(REVIEW.to   || "").trim();
  var due  = String(REVIEW.due  || "").trim();
  /* BOTH ENDS OR NEITHER: "Jan 2026 to" is worse than saying nothing, and one
     end alone is not a span. A single end is reported on its own terms. */
  if (from && to) bits.push(from + " to " + to);
  else if (from)  bits.push("from " + from);
  else if (to)    bits.push("until " + to);
  if (due) bits.push("due " + due);
  if (!bits.length) bits.push("Dates not set");
  /* §239: THE REVIEW POINT IS NOT PRINTED HERE ANY MORE. It used to read
     "as of Q" + endsQuarter -- the words of `GROUP.asOfQuarter` over the value
     of a different field -- and it is now a control on the strip beside this,
     so printing it here as well would say one thing twice and let the two
     disagree the moment one is edited (§53.5). */
  return bits.join(" \u00b7 ");
}

function cycleTotals(){
  var t = { done:0, total:0, sub:0, none:0, units:0 };
  function add(c, st){
    t.done += c.done; t.total += c.total;
    if (st.key === "done") t.sub++;
    if (st.key === "late") t.none++;
    t.units++;
  }
  /* ONE WALK OVER EXACTLY WHAT THE BOARD DRAWS (§244, §245). Both lists, and
     each subject read with the counters its own row is read with -- the FORMAT
     decides that, never the `fn:` prefix (§59). Leaving a pillars function out
     would say "14 of 15" on a page listing fifteen rows, which is §108.1's
     miscount by another road; counting it twice is the same fault mirrored. */
  boardUnitTargets().concat(boardFunctionTargets()).forEach(function(target){
    if (boardPlansLikeUnit(target)) {
      var u = unitLike(target);
      if (u) add(reportedCount(u), unitState(u));
    } else {
      var fk = fnKeyOfTarget(target);
      if (fk) add(fnReportedCount(fk), fnState(fk));
    }
  });
  /* DERIVED, NEVER COUNTED: in progress is whatever is neither submitted nor
     untouched, so it cannot disagree with the other two. It also FIXES a real
     miscount — the inline version divided by `activeKeys().length` while
     `sub` and `none` had already grown to include the functions, so every
     submitted function took one off "in progress" (§108.1). */
  t.progress = t.units - t.sub - t.none;
  return t;
}

/* Two units are genuinely mid-report: some figures in, some not. Without this
   every row on the SMO's board reads 100% and the screen cannot show what it
   exists to show. */
(function seedPartialReporting(){
  var partial = { consumerelectronics:5, nigeria:99 };
  Object.keys(partial).forEach(function(k){
    var u = UNITS[k], left = partial[k], seen = 0;
    var wipe = function(m){
      seen++;
      if (seen > left) { m.actual = ""; m.progress = null; }
    };
    u.keyObjectives.forEach(wipe);
    u.items.forEach(function(p){ p.measures.forEach(wipe); });
    if (k === "nigeria") {
      u.keyObjectives.forEach(function(m){ m.actual = ""; m.progress = null; });
      u.items.forEach(function(p){
        p.measures.forEach(function(m){ m.actual = ""; m.progress = null; });
        p.tactics.forEach(function(t){ t.actual = null; t.status = "Not started"; });
      });
    }
  });
})();

var VIEWER = "smo";

/* Every caller treats this as a person, not a maybe — `grant`, `reaches`,
   `paint` and the pages all read straight off the result. So it resolves
   rather than returning nothing: if the name being viewed as is no longer in
   the list, the first person stands in and VIEWER is corrected to match, so
   the switcher and the screen cannot disagree. The list changes under a live
   page in two ways — hydration replaces the baked-in example with the tenant's
   own people, and the Demo button swaps the two datasets — and before
   2026-08-20 either one left a departed key selected and threw on the next
   repaint. */
/* ── AND ON A LIVE TENANT IT STANDS NOBODY IN (§206) ──────────────────
   From the deployment: a colleague signed in as themselves and was shown
   "Welcome, <the SMO>" with the Super user chip, and the access to match.

   THIS FUNCTION WAS THE SUBSTITUTION. `VIEWER = PEOPLE[0].key` is right for
   the two cases the note above names — the baked example being replaced by
   the tenant's own people, and the Demo button swapping datasets — where
   the alternative is a throw on the next repaint and nobody is signed in as
   anybody. It is catastrophic for the third case nobody listed: a LIVE
   session whose person the hydrated register does not hold. `grant`,
   `reaches` and `paint` all read straight off this result, so standing in
   the first row of the register hands that person's ROLES to somebody else
   — and the first row of a tenant is very often the bootstrap SMO.

   §69.15 recorded exactly this sentence — "a person the platform could not
   find was shown the FIRST PERSON'S VIEW" — and fixed the two chrome
   controls it had noticed, leaving the substitution itself in place.

   So the fallback survives where it was needed and is closed where it is
   dangerous: with a live session, an unmatched viewer resolves to a
   STRANGER — a person-shaped row holding nothing, so every rule answers no
   — and `sync.js` has already put the "signed in but not on this register"
   note on the page saying so. A value that is dangerous when wrong fails
   closed (§69.15's own rule, on the value rather than on the controls).

   `level` goes with it: §187 stopped deriving a seat from it, so it granted
   nothing, and a dead field spelling "smo" on the one object that stands in
   for a stranger is the last place to leave one (§24). */
function viewer(){
  var v = PEOPLE.filter(function(p){ return p.key === VIEWER; })[0];
  if (v) return v;
  var stranger = { key: VIEWER, name: "\u2014", title: "", unit: null };
  if (!PEOPLE.length) return stranger;
  var liveNow = false;
  try { liveNow = typeof SYNC !== "undefined" && !!SYNC.isLive && SYNC.isLive(); }
  catch (e) { liveNow = false; }
  if (liveNow) return stranger;
  VIEWER = PEOPLE[0].key;
  return PEOPLE[0];
}
/* The access map is stored PER TENANT, in the database, so it only ever holds
   the page keys that existed when that tenant was written. A page added in a
   later version has no row, and "no row" used to read as "none" - so the new
   page was invisible on every existing deployment while working perfectly on a
   fresh one. The knowledge base was the first to hit it (3.5).

   An absent key now falls back to the SHIPPED default for that level, which is
   what the tenant would have got had the page existed when it was seeded.
   Absent means "not answered yet", not "denied": denial is a stored "none",
   and that still wins. */
var ACCESS_DEFAULTS = SMPRules.ACCESS_DEFAULTS;
var STATE_RANK = SMPRules.STATE_RANK;
function grantFor(roleKey, areaKey){ return SMPRules.grantFor(world(), roleKey, areaKey); }

/* ── OWN, and how it is decided ─────────────────────────────────────
   Islam: *"own is always about what they have a role in … I see this as a
   logic thing not a settings thing."*

   So there is no control for it anywhere. roleOwns() reads it off the role's
   attachment, which §33 already stores on the thing being attached to. It
   differs from the old roleReaches() in one deliberate way: reaching and
   OWNING are no longer the same word. A Company CEO whose company may see the
   others REACHES those units — but it does not own them, and the matrix's
   other-units column is what says whether reaching them is allowed at all. */
function roleOwns(r, target){ return SMPRules.roleOwns(world(), r, target); }
function companyAllows(r, target){ return SMPRules.companyAllows(world(), r, target); }
function areaFor(pageKey, target, r){
  return SMPRules.areaFor(PAGE_AREA[pageKey], world(), r, target);
}
function grantAt(pageKey, target){
  return SMPRules.grantAtPage(world(), viewer(), pageKey, target);
}

/* TARGET is what the screen is currently showing — a unit key, "group", or
   "fn:<key>". It is a property of the PAINT, not of the call, which is why it
   is set once at the top of paint() rather than threaded through forty call
   sites that would all pass the same value. Same shape as VIEWER. */
var TARGET = "group";
function grant(pageKey){ return grantAt(pageKey, TARGET); }

/* A person attached to the group reaches every unit; a person attached to a
   unit reaches only their own. This is the whole of scope — no page ever
   renders a trimmed version of itself. */
/* Which units and functions a person reaches. Reaching is now DERIVED from the
   matrix rather than decided beside it: a thing is reachable when the area
   answering for it is not "none". That is what makes "Other business units:
   view" mean something — the unit appears in the navigation, at view.

   roleReaches() is gone. It used to answer both "is this theirs" and "may they
   see it" with one boolean, which is exactly the conflation the area model
   takes apart: roleOwns() answers the first, the matrix answers the second. */
function reaches(unitKey){
  if (unitKey === "setup") return true;
  if (unitKey === "group") return grantAt("g_perf", "group") !== "none";
  return grantAt("u_perf", unitKey) !== "none";
}

/* ── The three rules that are rules, not settings ──────────────────
   Each was a cell in the old 25-row matrix. Each is a sentence now, because
   each is true regardless of what anybody sets. */

/* A plan ARRIVES by upload and is corrected by the SMO alone (§22, §31). A
   unit owner holding edit on their own unit still cannot rewrite the plan they
   are measured against — that is the point of the rule, and it does not depend
   on a grant.

   §94 WIDENED IT TO THE WHOLE STRATEGY TAB, so the sentence above is now one
   case of a general one and this function is that one asked about the plan.
   `SMPRules.mayAuthorPage()` holds the list of pages and the reasoning; the
   answer is the shared file's so the screen and the server cannot drift. */
/* ── ASK THE COLUMN THE SAVE ASKS (§270, closing §217's other half) ──
   §217 fixed the SERVER: `lib/authorize.js` resolves every strategy question
   through `strategyPageOf()`, so a supporting function's plan is judged by the
   FUNCTION's Strategy column. The SCREEN never caught up — it passed the raw
   `u_found` / `u_anal` / `u_plan` at some twenty call sites, which on an `fn:`
   target reads the BUSINESS UNIT's column instead. Two different questions
   about one act, which is the drift `lib/rules.js` exists to prevent (§42).

   MEASURED BEFORE AND AFTER, and today it costs nobody anything: every role's
   two Strategy columns hold the same value on this tenant, so there are zero
   disagreements and editing is the office's in any case. Set them differently
   — which is the whole point of §117's split — and six people are handed an
   Edit pen the save refuses, or refused one it would have accepted. This
   closes the trap before it is armed.

   IN THE WRAPPERS, NOT AT THE CALL SITES. The server resolves at each of its
   six; the browser has twenty and would acquire a twenty-first the day
   somebody adds a `gapCell`. One place, so a call site cannot forget (§104.7).
   `strategyPageOf()` passes an unmapped key through untouched (§270), which is
   what makes it safe to ask of every key rather than of a list somebody keeps.

   NOTHING WIDENS: it can only ever move the screen onto the answer the save
   was already giving. */
function strategyAc(acKey, target){
  return SMPRules.strategyPageOf(target === undefined ? TARGET : target, acKey);
}
function mayAuthor(acKey, target){
  var t = target === undefined ? TARGET : target;
  return SMPRules.mayAuthorPage(world(), viewer(), strategyAc(acKey, t), t);
}
function mayEditPlan(){ return mayAuthor("u_plan"); }
/* MAY THIS PERSON FILL THIS PAGE'S GAPS (§145)? A wrapper, never a second
   copy — lib/rules.js answers, for the person being viewed as, so the
   fill field the screen draws and the save the server accepts cannot
   disagree (§42). */
function mayFill(acKey, target){
  /* §270: the same resolution, because `lib/authorize.js` judges a fill on a
     function through `planPageOf()` (its own `strategyPageOf`) — fixing one
     half and leaving the other is how the two came to disagree in the first
     place (§53.5). */
  var t = target === undefined ? TARGET : target;
  return SMPRules.mayFillPage(world(), viewer(), strategyAc(acKey, t), t);
}
/* §177: the same question about ONE ROW. `ctx` is §147.7's shape -- {row},
   {project} or {pillarOwner} -- so a project owner fills their own project
   and a pillar owner their own pillar, and nobody fills a neighbour's. */
function mayFillRow(acKey, ctx, target){
  var t = target === undefined ? TARGET : target;   /* §270, as mayFill */
  return SMPRules.mayFillRow(world(), viewer(), strategyAc(acKey, t), t, ctx);
}
/* MAY THIS PERSON REORDER WHAT THEY ARE LOOKING AT (§101)? A wrapper, never a
   second copy — the answer is lib/rules.js's, asked for the person being viewed
   as, so the handle the screen draws and the save the server accepts cannot
   disagree. That disagreement is precisely what §94.3 shipped for two versions:
   the drags worked on screen and were refused every time. */
function mayArrangeHere(target){
  return SMPRules.mayArrange(world(), viewer(),
    target === undefined ? TARGET : target);
}

/* ── THE THREE THE SMO TEAM DOES NOT GET (§89) ─────────────────────
   Wrappers, not copies: the answer is `lib/rules.js`'s, asked for the person
   being viewed as. A second implementation here is the drift that file exists
   to prevent, and this is the drift that would hand somebody the platform. */
/* THE OFFICE IS TWO ROLES NOW, AND EVERY OPERATIONAL "is this the SMO" ASKS
   FOR BOTH (§89). Nine places tested `hasRole("super")` to mean "the strategy
   management office" — reporting past a locked cycle, correcting a plan,
   marking a focus measure, sending a message. Every one of them is the job
   the SMO team exists to do, so leaving them on `super` would have shipped a
   role that looks complete on the matrix and cannot run a cycle. The three
   below are the only places the two roles differ. */
function inOffice(){ return SMPRules.isOffice(world(), viewer()); }
function mayEditAccess(){ return SMPRules.mayEditAccess(world(), viewer()); }
function mayDestroy(){ return SMPRules.mayDestroy(world(), viewer()); }
function mayIssuePasswordTo(target){
  return SMPRules.mayIssuePasswordTo(world(), viewer(),
    typeof target === "string" ? personBy(target) : target);
}
/* Who a bulk password action would actually reach. The SCREEN counts them so
   it can say a true number; the SERVER picks the set (§35), so a stale screen
   can only ever issue to fewer people than it thinks. */
function passwordReach(){
  return PEOPLE.filter(function(p){
    return personActive(p) && p.key !== viewer().key && mayIssuePasswordTo(p);
  });
}

/* What carries reward is the office's decision, not a page permission. The
   group CEO marks it and the SMO can too; nobody else, at any grant. */
function mayMarkFocus(){
  var rs = personRoleKeys(viewer());
  return (rs.indexOf("gceo") > -1 || rs.indexOf("super") > -1) && !CYCLE.locked;
}

/* ── Key Objective weights ────────────────────────────────────────────────
   Optional. Unweighted means equal weight, which is the one default nobody
   has to argue for. Where weights are set they must total 100 within the unit.
   ──────────────────────────────────────────────────────────────────────── */

/* Only Mobile has weights set, to show the mechanism. Every other unit is
   equal-weighted, which is the default nobody has to defend. */
var KO_WEIGHTS = { mobile: [40, 25, 20, 15] };

/* ── A FIGURE READ AT ITS TARGET'S SCALE (§243) ─────────────────────────
   Islam, of a unit's objectives table: *"actual revenue is reported in details
   by the unit — it needs to be squeezed to follow the target format like 3.59,
   not the full number."* His row reads target **3.59B EGP** against actual
   **3,590,800,500**. Both are right; they are written at different scales, so
   the row cannot be read across, and on a slide the long one is what the eye
   lands on.

   DISPLAY ONLY. What was reported is stored exactly as it was entered and
   nothing is rounded away — this is a reading of a value, not a rewriting of
   one, so the full figure stays in the hover and in the workbook.

   THE RULE HAS TO NOT MISFIRE ON THE ORDINARY CASE, which is the whole
   difficulty: §199.6 says a bare number inherits its row's unit, so "8"
   against a target of "6 M EGP" means eight MILLION and must be left alone.
   The only reading under which a bare number is a full figure rather than a
   figure in the target's unit is when it is ABSURDLY larger than the target —
   so the gate is **1000x**, which is not a taste: it is one whole magnitude
   step (K, M, B are each 1000 apart), and a figure genuinely a thousand times
   its target would be a performance of 100,000%, which no report contains.
   Below that nothing is touched, so every real figure in the demo is
   unchanged and it is asserted.

   The decimals follow the TARGET's, so the two line up in the column, and the
   unit is rejoined with the target's own spacing (`joinTarget`). A target with
   no magnitude, an actual that carries its own unit, or anything unparseable
   returns the value exactly as stored. */
var FIGURE_MAGNITUDES = { B: 1e9, M: 1e6, K: 1e3 };
function figureScaled(target, actual){
  var raw = actual == null ? "" : String(actual).trim();
  if (!raw) return raw;
  var t = splitTarget(target), a = splitTarget(raw);
  if (a.unit || !t.unit) return raw;                      /* already carries one */
  var mag = FIGURE_MAGNITUDES[t.unit.charAt(0).toUpperCase()];
  if (!mag) return raw;
  var av = parseFloat(a.value.replace(/,/g, ""));
  var tv = parseFloat(String(t.value).replace(/,/g, ""));
  if (isNaN(av) || isNaN(tv) || !tv) return raw;
  if (Math.abs(av) < Math.abs(tv) * 1000) return raw;     /* a figure in the target's own unit */
  var dp = (String(t.value).split(".")[1] || "").length;
  return joinTarget(target, (av / mag).toFixed(dp), t.unit);
}
/* The same figure as a title, so the full number is never lost to the reader
   who wants it — empty when nothing was shortened, which is what lets a caller
   hand it straight to `title=""` without deciding anything. */
function figureFull(target, actual){
  var raw = actual == null ? "" : String(actual).trim();
  return figureScaled(target, raw) === raw ? "" : raw;
}

/* ── WHAT EACH OBJECTIVE WEIGHS (§243) ──────────────────────────────────
   Islam: *"there is no weighting on the objectives in units it needs to be
   added, and in the functions planning as pillars it's there but if it's
   missing it should be considered equally weighted objectives not 0."*

   THE SECOND HALF IS THE BUG, and it is one of the two mechanisms that put a
   dash where a reported figure should be. `koScore()` read
   `weights[i] == null ? 0 : weights[i]` — so a blank weight counted at
   NOTHING, and where every reported row was blank the total came to nought
   and the whole headline returned null. Measured: the same objectives read
   **90%** equally weighted and **a dash** on that weighting.

   THE RULE, IN ONE SENTENCE: a blank weight counts as the average of the
   weights that WERE set; if none were set at all, every objective counts
   equally. So a blank can never be worth nothing, never dominate, and a
   half-filled column behaves like a sensible reading of a half-filled column
   rather than like a scoring decision nobody made.

   TWO PLACES HOLD A WEIGHT AND THAT IS WHY THIS TAKES BOTH. A capability's
   and a function's objectives carry `weight` ON THE ROW; a unit's have lived
   in `KO_WEIGHTS[ukey]` as an array BY POSITION since long before rows had
   ids — which is §48's own hazard (a row removed from the middle shifts every
   weight below it onto the wrong objective). The row wins where it is set, so
   the unit's new column writes the row and the stored array stays readable
   for a tenant that has one. Nothing is migrated and nothing is rewritten. */
function koWeights(list, legacy){
  var raw = (list || []).map(function(m, i){
    var w = (m && m.weight != null && m.weight !== "") ? Number(m.weight) : null;
    if (w == null && legacy && legacy[i] != null) w = Number(legacy[i]);
    return (w == null || isNaN(w)) ? null : w;
  });
  var set = raw.filter(function(w){ return w != null; });
  if (!set.length) return null;                       /* nothing weighted at all */
  var mean = set.reduce(function(a, b){ return a + b; }, 0) / set.length;
  return raw.map(function(w){ return w == null ? mean : w; });
}
/* Whether this list is weighted at all — what a table asks before drawing a
   Weight column nobody has filled in (§243, Islam: *"if there is no weights
   submitted the table shouldn't show weights"*). */
function koWeighted(list, legacy){ return !!koWeights(list, legacy); }
/* ── WHICH OBJECTIVES THE HEADLINE IS MADE OF, NAMED ONCE (§264) ──────
   The card above a list of objectives prints a Highest and a Lowest, and those
   have to be the extremes of EXACTLY the rows koScore() averaged. This test
   lived inside koScore, so the card kept a second one of its own — and a second
   membership test beside a headline is how a "highest" comes to name a row the
   headline never counted (§53.5). `scorableMeasures()` is the same reader for a
   pillar's measures; this is its twin for a list of key objectives. */
function koCounts(m){
  return !SMPRules.isHidden(m) && !m.milestone && measureScore(m) != null;
}
function scorableKOs(list){ return (list || []).filter(koCounts); }
function koScore(list, weights){
  /* §218: an objective counts as soon as it has a figure — nothing waits
     on the office any more. */
  /* §233: hidden is not counted, weighted or not. */
  /* §239 + §243, and NEITHER SIDE ALONE IS RIGHT. main replaced the stored
     `progress` with `measureScore()` — one reader for every average in the
     product, so a headline and the row it expands to cannot disagree — and
     still read `weights[i] == null ? 0`, which is the very fault Islam asked
     to have fixed here: a blank weight counted at NOTHING, so where every
     reported row was blank the total came to nought and the headline returned
     null. The merged version keeps main's reader and this branch's rule. */
  var vals = scorableKOs(list);
  if (!vals.length) return null;
  var flat = function(){
    return Math.round(vals.reduce(function(a, m){ return a + measureScore(m); }, 0) / vals.length);
  };
  var ws = koWeights(list, weights);
  if (!ws) return flat();
  var tot = 0, acc = 0;
  list.forEach(function(m, i){
    if (!koCounts(m)) return;
    acc += measureScore(m) * ws[i]; tot += ws[i];
  });
  /* Every weight that was set is a literal zero — an answer, but not one a
     score can be divided by. Equal weighting rather than a dash: a figure that
     is in must be seen (§243). */
  return tot ? Math.round(acc / tot) : flat();
}

/* ── Weighting factors: configurable from the start ───────────────────────
   Stored as rows rather than four fixed columns, so adding a fifth factor is
   data entry rather than a migration. Each factor declares its own type,
   which decides how its values are captured.

   Per cycle, not per tenant — each year takes insight from the last, so the
   previous cycle's split is carried here to be shown beside the new one.
   ──────────────────────────────────────────────────────────────────────── */

var FACTOR_TYPES = {
  derived:   { label:"Derived",   note:"Read from a stored figure. Not typed by hand." },
  judgement: { label:"Judgement", note:"Set on a scale, carries a written reason." },
  estimate:  { label:"Estimate",  note:"A view, entered as a figure." }
};

var PRIOR_CYCLE = {
  year: 2025,
  factors: [ { key:"rev", weight:45 }, { key:"prof", weight:30 },
             { key:"imp", weight:15 }, { key:"growth", weight:10 } ],
  composite: { Mobile:48, Retail:30, Mazaya:22 }
};

/* Set true once a review cycle has been reported. Any factor change from here
   moves a number that has already been seen, so it warns first. */
var CYCLE_REPORTED = true;

/* Units carry their own key so a render function can look up configuration
   that lives outside the unit object. */
Object.keys(UNITS).forEach(function(k){ UNITS[k].ukey = k; });



/* ── Scoring bands ────────────────────────────────────────────────────────
   ONE scale for every achievement-against-benchmark figure. Performance is
   actual over target; execution is delivered over plan. Both are the same kind
   of number, so both read on the same bands — and the status word is derived
   from the same function as the colour, which is what stops a green figure
   sitting beside a contradicting word.

   Per tenant, one standing scale. Moving a threshold silently rewrites how
   every past report reads, so a change warns the same way a weighting change
   does. 70 and 50 match the platform's existing STATUS_THRESHOLDS so the
   strategy layer and the functional layer never disagree about a colour;
   85 is the added top edge.
   ──────────────────────────────────────────────────────────────────────── */

var BANDS = {
  scope: "tenant",
  /* THREE, NOT FOUR (§163, Islam: "I want the colors to be 3 colors only, red,
     green and yellow" — 90+ green, 70 to 90 yellow, below 70 red).

     FOUR BANDS MEANT FOUR COLOURS AND TWO OF THEM WERE THE SAME WARNING. At
     risk (50-69) and Off track (below 50) both said "this is going wrong" in
     two shades of the same red-orange, and a reader had to know which was
     which to get anything from the difference. Three is the vocabulary people
     already have.

     `warn` LEAVES THE DEFAULT AND NOT THE PRODUCT. The band list is a TENANT
     setting, so a deployment that has saved four bands keeps them and goes on
     working — which is why nothing that reads a band key may assume the key
     is in this list (see `needsNote()` below, which still names `warn`). The
     `--warn` colour token stays too: the SWOT board paints Threats with it and
     that has nothing to do with scoring. */
  bands: [
    { key:"good", floor:90, label:"On track" },
    { key:"attn", floor:70, label:"Needs attention" },
    { key:"bad",  floor:0,  label:"Off track" }
  ]
};

/* ── THE FIVE COLOURS A LEVEL MAY WEAR (§168) ────────────────────────
   Islam: *"for the bands make it editable in the scoring bands table in the
   setup .. to remove or add levels and set the values and colors."*

   These are the product's own scoring colours and there is deliberately no
   sixth: a band's `key` is the CSS token its swatch, its pill and every chart
   segment are painted from, so a colour the platform does not carry would
   render as nothing at all. Picking the colour IS picking the key, which also
   decides whether a figure landing there has to be explained — `needsNote()`
   asks for a note on `bad` and `warn` (§163). */
var BAND_COLOURS = [
  { key:"good", word:"Green" },
  { key:"attn", word:"Amber" },
  { key:"warn", word:"Orange" },
  { key:"bad",  word:"Red" },
  { key:"none", word:"Grey" }
];

/* A LEVEL IS ADDED WHERE THERE IS ROOM FOR ONE, not at an end. The bottom band
   starts at 0 by construction, so the new one goes immediately above it,
   halfway between 0 and the band above — which descends by arithmetic rather
   than by hoping somebody types a number in order. */
function addBand(){
  var b = BANDS.bands;
  var above = b.length > 1 ? b[b.length - 2].floor : 100;
  var used = {};
  b.forEach(function(x){ used[x.key] = 1; });
  var free = BAND_COLOURS.filter(function(c){ return !used[c.key]; })[0];
  b.splice(b.length - 1, 0, {
    key: free ? free.key : "attn",
    floor: Math.max(1, Math.floor(above / 2)),
    label: "New level"
  });
}

/* AND REMOVING ONE PUTS THE FLOOR BACK. Every figure has to land somewhere, so
   whatever ends up last starts at 0 — take the bottom band away and the one
   above it inherits that, or a figure of 12 would belong to no band at all. */
function removeBand(i){
  var b = BANDS.bands;
  if (b.length <= 2) return;
  b.splice(i, 1);
  b[b.length - 1].floor = 0;
}

function bandOf(v){
  if (v == null || isNaN(v)) return { key:"none", label:"No data" };
  var b = BANDS.bands;
  for (var i=0;i<b.length;i++) if (v >= b[i].floor) return b[i];
  return b[b.length-1];
}

/* ── Derived scores ───────────────────────────────────────────────────────
   Nothing below is stored. A pillar's performance comes from its measures and
   its execution from its tactics; a unit compiles from its pillars; the group
   compiles from its units. A row and its expansion can therefore never
   disagree, which is the failure the earlier prototype had built in.
   ──────────────────────────────────────────────────────────────────────── */

/* ── Quarters ─────────────────────────────────────────────────────────────
   A tactic carries a flag per quarter rather than a start and an end, because
   real work skips quarters — a plan can run Q2 and Q4 with nothing in Q3, and
   a span cannot say that.

   This is what finally makes `planned` derived rather than stored. What a
   tactic SHOULD have delivered by now is the share of its own active quarters
   that have already passed. A tactic running Q1–Q2, reviewed at H1, is due at
   100%; one running Q2–Q4 is due at a third.
   ──────────────────────────────────────────────────────────────────────── */

function quartersOf(t){
  return [t.q1, t.q2, t.q3, t.q4].map(function(x){ return x ? 1 : 0; });
}

/* ── THE REVIEW POINT (§239) ──────────────────────────────────────────────
   HOW FAR THROUGH THE PLAN YEAR ARE WE. One answer, asked by everything that
   compares a figure with a benchmark: a measure's prorated target, a tactic's
   expected delivery, and the quarter pips.

   IT IS A MONTH AND NOT A QUARTER, and that is Islam's own case rather than a
   preference: "we might be reporting till month 8 in the year then it's an 8
   months review cycle." A quarter cannot say eight months.

   BEFORE THIS THERE WERE TWO FIELDS AND THEY DISAGREED. `REVIEW.endsQuarter`
   is the quarter the CYCLE ends in and was what `tacticPlanned()` read;
   `GROUP.asOfQuarter` is named for the review point ("H1 means Q1 and Q2 have
   passed") and was read by the pips alone. In the worked example both are 2,
   so they agree and nobody ever saw it. On a year-long cycle reported in-year
   they diverge completely: measured over the 84 demo tactics, a cycle ending
   Q4 makes every single one read "due at 100%" -- one distinct value, a column
   that cannot vary -- while the pips two columns away correctly show Q2. Same
   row, two answers. §53.5, in the arithmetic rather than the layout.

   THE FALLBACK IS WHAT MAKES THIS SAFE TO SHIP. A tenant that has never been
   asked keeps EXACTLY today's behaviour, because an unset review point falls
   back to the quarter the cycle ends in -- which is what this used to mean.
   Nobody's score moves until the office sets a month. And the fallback NEVER
   WRITES: a reader that creates the field it looked for puts a phantom change
   into every save (§42, §50.6). */
function reviewAsOf(){
  var m = REVIEW.asOfMonth ? monthsOf(REVIEW.asOfMonth) : null;
  if (m != null) return m;
  var y = cycleYear();
  if (y == null) return null;
  var q = Number(REVIEW.endsQuarter);
  if (!q || q < 1 || q > 4) q = 4;
  return y * 12 + (q * 3 - 1);   /* the LAST month of that quarter */
}
/* The review point written the way a month is written everywhere else. Falls
   back to the derived quarter-end so a tenant that has never set one still
   reads a true sentence rather than a dash. */
function reviewAsOfLabel(){
  var t = reviewAsOf();
  if (t == null) return "\u2014";
  return monthValue(((t % 12) + 12) % 12, Math.floor(t / 12));
}
/* WHICH YEAR THE REVIEW POINT IS IN (§239.3).

   Islam, from the deployment after §239 shipped: *"I adjusted the reporting
   cycle to august but the ytd is calculating against the full year target ..
   the ytd target in the tactics the target is still the 100%."*

   REPRODUCED, AND IT IS §239.1's OWN FAULT COMMITTED BY §239.1's OWN FIX.
   `reviewAsOf()` reads "Aug 26", which CARRIES ITS OWN YEAR -- and then
   `elapsedMonths()` and `tacticPlanned()` threw that away and asked
   `cycleYear()` instead, which scrapes a four-digit year out of the cycle's
   `to`, `name` and `due`. A cycle written "Annual Plan / Jan / Dec" has none,
   so `cycleYear()` is null, elapsed is null, the share is null, and EVERYTHING
   FALLS BACK: measures stop prorating and every tactic reads 100% again. Two
   fields answering one question, which is the exact fault §239.1 exists to
   have removed.

   The review point is now the authority on its own year and `cycleYear()` is
   only the fallback for a cycle where nobody has picked a month yet. */
function reviewYear(){
  if (REVIEW.asOfMonth) {
    var t = monthsOf(REVIEW.asOfMonth);
    if (t != null) return Math.floor(t / 12);
  }
  return cycleYear();
}
/* Months of the plan year already passed, 1 to 12. The plan year runs January
   to December (Islam, asked outright), so the count is from the cycle's year. */
function elapsedMonths(){
  var a = reviewAsOf(), y = reviewYear();
  if (a == null || y == null) return null;
  return Math.max(0, Math.min(12, a - y * 12 + 1));
}
/* Is this quarter behind us? A quarter counts as passed when its LAST month
   has, which is what `asOfQuarter` meant before it became a month (H1 means Q1
   and Q2 have passed). The quarter fallback is kept for a cycle whose year
   cannot be read, exactly as tacticPlanned() keeps it. */
function quarterPast(i){
  var a = reviewAsOf(), y = reviewYear();
  if (a == null || y == null) return (i + 1) <= (Number(REVIEW.endsQuarter) || 4);
  return y * 12 + i * 3 + 2 <= a;
}
function elapsedShare(){
  var m = elapsedMonths();
  return m == null ? null : m / 12;
}
/* WHICH MEASURES PRORATE, and the plan already answers it. `compile` says what
   kind of number this is: "Sum" adds up across the period, so six months of
   accumulation against twelve months of target is the wrong comparison;
   "Latest" is a rate or a share at a point in time and "Average" is already
   normalised, so neither has anything to prorate -- and with no baseline
   stored, prorating them would be inventing a glide path. Measured on the
   shipped tenant: 32 of 137 rows are Sum.

   §276: ASKED OF THE SHARED RULE, because `Count` joined `Sum` and the list of
   what prorates is now the list of what the workbook validates and the pen
   offers — one place, or the picker offers a rule the scorer does not know. */
function prorates(m){ return SMPRules.prorates(m && m.compile); }
/* The number this row is actually measured against right now.
   PRORATE THE TARGET, THEN COMPARE -- never the ratio. Dividing a score by the
   elapsed share is right for "more is better" and exactly backwards for "less
   is better", so the share goes on the target and one expression serves both
   directions.

   §250: THE SHARE MAY BE SUPPLIED, and that is the whole of this change.
   A key objective and a pillar measure are the YEAR's, so they pass nothing and
   read `elapsedShare()` exactly as they always have. A TACTIC'S OUTCOME belongs
   to the tactic's own window -- April to September is six months, not twelve --
   so it passes `tacticShare()`. One arithmetic, told which period it is
   measuring; a second `outcomeDue()` would be two definitions of proration
   drifting apart the first time either is corrected (§53.5).

   ABSENT AND NULL BOTH MEAN "THE YEAR". A tactic with no quarters at all has no
   window to prorate by, and answering null there rather than falling back would
   empty the column for a plan whose timelines were never filled in. */
function measureDue(m, share){
  if (!m || !m.target) return null;
  /* §264: A YES/NO ROW HAS NOTHING TO BE DUE. It may still be CARRYING a
     figure — picking Y/N keeps whatever number was there and stops counting
     it — so the digits are in the string and `parseFloat` would pull them
     out, printing "due at 100 Y/N" beside a control offering Yes and No.
     The unit decides, not whether a number can be found. */
  if (SMPRules.isYesNo(m.target)) return null;
  /* §251: THE COUNT AND THE SCORE ASK ONE FUNCTION. A target may now hold its
     unit before its number ("%"), so "is there a number in here" decides both
     whether the row is a counted gap and whether it can be scored at all —
     and two definitions of it is how a row comes to be counted as missing
     while quietly being scored (§249's own rule, on the field it named). The
     test is unchanged; what changes is that this asks for it rather than
     carrying its own copy of the same expression. */
  if (!SMPRules.targetHasNumber(m.target)) return null;
  var t = parseFloat(String(m.target).replace(/[^0-9.]/g, ""));
  if (isNaN(t)) return null;
  if (!prorates(m)) return t;
  var s = share == null ? elapsedShare() : share;
  var due = s == null ? t : t * s;
  /* ── A COUNT IS OWED IN WHOLE ONES (§276) ─────────────────────────
     Islam: a target of 2 shops at month 8 "asks for 1.3 stores which is not
     feasible ... it should prorate for the closest integer maybe of the
     lowest". ROUNDED DOWN, his call: a shop is not owed until its whole share
     of the year has passed, so 2 shops owe nothing until June, one from June,
     two in December. Nearest rounding would owe the second shop from
     September — 1.5 read from the other side.

     THE EPSILON IS NOT DECORATION. `3 * (4/12)` is 1 in JavaScript and
     `7 * (3/12)` is 1.7499999999999998, so a floor taken on the raw product
     could owe one fewer than the arithmetic means on the month a whole unit
     falls due; a hair above the product rounds only what is genuinely there.

     DUE CAN NOW BE NOUGHT while the target is not, and that is a real state:
     `measureScore` leaves such a row out of every average (nothing has been
     asked yet — §35, §104.10), `measureDueLabel` says nothing rather than
     printing "0 #", and the Performance page reads "Nothing due yet"
     through `nothingDueYet()` rather than "Not scored". */
  return SMPRules.wholeUnits(m.compile) ? Math.floor(due + 1e-9) : due;
}
/* Is this row a whole-unit count with nothing owed yet? Asked by the
   surfaces that would otherwise print "Not scored" over a row that has simply
   not been asked — the two mean different things (§35). */
function nothingDueYet(m, share){
  return !!(m && SMPRules.wholeUnits(m.compile) && !SMPRules.isYesNo(m.target)
            && SMPRules.targetHasNumber(m.target) && measureDue(m, share) === 0);
}
/* WHAT THE ROW SCORES. Derived, never stored -- `m.progress` goes on holding
   the raw actual-against-the-ANNUAL-target ratio exactly as it always has, so
   every archive and every closed cycle still reads as it did and nothing is
   migrated. The Focus board reads that raw figure on purpose (§239: reward
   stays a year-end judgement); everything else reads this. */
function measureScore(m, share){
  if (!m) return null;
  /* ── A YES OR A NO SCORES 100 OR 0 (§264) ──────────────────────────
     BEFORE the arithmetic, and that ordering is the whole of it: a Y/N
     target carries no number, so `measureDue` answers null and the row
     would fall out of every score unscored. Islam chose 100/0 over "shown
     but never scored", so it lands in the pillar's and the unit's averages
     like any other row.

     NOTHING SAID IS NOT A NO. An unanswered row scores null and leaves every
     average, exactly as an empty number box does — reading silence as a
     failure marks a unit down for a question nobody has been asked yet (§35,
     §104.10). The share is not consulted: there is no partial yes to prorate
     (§250 prorates a TARGET, and this row has no number to prorate). */
  if (SMPRules.isYesNo(m.target)) return SMPRules.ynScore(m.actual);
  var due = measureDue(m, share);
  if (due == null || !due) return null;
  var a = parseFloat(String(m.actual == null ? "" : m.actual).replace(/[^0-9.]/g, ""));
  if (isNaN(a)) return null;
  /* NOUGHT ON A "LESS IS BETTER" MEASURE IS THE BEST POSSIBLE ANSWER, NOT AN
     UNSCORABLE ONE (§239.4). Zero duplicates against a target of "at most 1%"
     is perfect, and the arithmetic divides BY the actual -- so a guard written
     to avoid dividing by zero turned the best result in the table into "Not
     scored". Islam's own row: `Data duplicate rate ≤ 1%, 0%` read 150% before
     §239 and stopped being scored after it. It is the cap, which is where the
     old expression landed anyway (1/0 is Infinity, clamped to 150). */
  if (m.dir === "\u2264" && !a) return 150;
  return Math.max(0, Math.min(150, Math.round((m.dir === "\u2264" ? due / a : a / due) * 100)));
}
/* ── A TACTIC'S OUTCOME (§248) ─────────────────────────────────────
   Islam: a tactic's outcome carries its own direction, target with its unit
   and compile rule, "so it can be reported in the reporting and measured in
   the performance accordingly."

   IT IS SHAPED AS A MEASURE ON PURPOSE, so `measureDue`, `measureScore` and
   `measureDueLabel` serve it unchanged -- one arithmetic for every scored row
   in the product (§53.5). Sum prorates, Latest and Average do not, and the
   direction decides which way the division runs: §239's rule, not a second
   copy of it.

   THE FIGURE IS ITS OWN FIELD, AND THAT IS THE WHOLE MIGRATION STORY.
   `t.actual` has always meant "% delivered" and is what every closed cycle,
   every archive and `figuresSnapshot` hold. Putting an outcome's number in
   that same box would silently reinterpret it: a tactic sitting at 45 that
   gains an outcome of "≥ 6 #" reads 750% against its target the moment the
   target is set, and `pillarExec` would average 45 (a per cent) beside 7 (a
   count). So the outcome reports into `outActual` and nothing stored moves --
   no migration, and last cycle reads exactly as it did.

   These five ride in the tactic's `extra` (§177's road), so there is no
   schema change either. */
function outcomeOf(t){
  /* A NUMBER, not merely a non-empty string. The unit is stored on its own
     while the office is still choosing one — `outTarget` holds "%" before it
     holds "90%" — so a truthiness test would call that a target and start
     scoring a row against nothing.

     §249: ASKED OF THE SHARED RULE, because the same string now decides two
     things — whether this row scores, and whether the plan still owes a
     target — and two definitions of "is there a number in here" is how a
     row comes to be counted as missing while quietly being scored (§53.5,
     §42). The test is unchanged; only its home moved. */
  if (!t || !t.outTarget) return null;
  /* §264: a Y/N outcome is a real target with no number in it, so it is
     admitted here or the tactic goes on being read the old way and the
     answer somebody gave is scored by nothing. `measureScore` takes it from
     here — one arithmetic for every scored row, as §248 settled. And it is
     what makes main's own `tacticAnswered` right for a yes/no row: an
     outcome with no figure scores null, so the row is NOT answered, which
     is Islam's "a dash is not an entry" falling out of a rule already
     there rather than needing a second one. */
  if (!SMPRules.isYesNo(t.outTarget) && !SMPRules.targetHasNumber(t.outTarget)) return null;
  return { dir: t.outDir || "\u2265", target: t.outTarget,
           compile: t.outCompile, actual: t.outActual };
}
/* WHAT THE TACTIC SCORES, and the rule that makes this safe to ship into an
   open cycle: a tactic is read the OLD way until its outcome has both a target
   AND a reported figure. So the office adding an outcome mid-round changes
   nothing -- not the question on the reporting page, not the unit's execution
   -- until somebody actually enters the new number. The switch happens per
   tactic, when a human types, never as a side effect of an edit. */
function tacticOutcomeScore(t){
  var o = outcomeOf(t);
  if (!o || o.actual == null || o.actual === "") return null;
  return measureScore(o, tacticShare(t));
}
function tacticReads(t){
  var s = tacticOutcomeScore(t);
  return s != null ? s : (t && t.actual != null ? t.actual : null);
}
/* What this tactic's figure is compared against, for the quiet half of the
   YTD cell. An outcome answers with its own (prorated) target; everything
   else answers with the share of its plan that is due, exactly as before.
   §250: BOTH HALVES NOW SPEAK OF THE SAME PERIOD -- the share on the left is
   the tactic's own window and so is the one on the right, where before a row
   could read "83% delivered" beside a target prorated across the year. */
function tacticBenchmark(t){
  var o = outcomeOf(t);
  return o ? measureDueLabel(o, tacticShare(t))
           : (tacticPlanned(t) == null ? null : tacticPlanned(t) + "%");
}
/* Is this tactic being measured by its outcome rather than by an estimate?
   Asked by the three panes so none of them decides it separately. */
function onOutcome(t){ return tacticOutcomeScore(t) != null; }

/* ── WHAT A TACTIC READS, AS A PER CENT (§252) ─────────────────────
   Islam, of the review deck: *"presentations doesn't change when the plan
   performance is done."*

   §248 gave a tactic a SECOND box for its figure, and every surface that had
   to be taught about it was taught one at a time. This expression --
   `onOutcome(t) ? tacticReads(t) : tacticRatio(t)` -- was written out in the
   Performance pane and NOWHERE else, so the deck went on asking `tacticRatio`
   alone and printed an em-dash for a row it had already counted in the
   heading three inches above it (§53.5: one product, two surfaces, and they
   must not disagree about one number).

   An outcome answers with its own score against the target due so far; a
   tactic without one answers with the share of its plan it has delivered,
   byte for byte as before. */
/* §254.2: ASKED OF THE OUTCOME'S EXISTENCE, NOT OF ITS SCORE. `onOutcome`
   answers "can this be scored on its outcome", which is the right question for
   the score itself and the wrong one for "which measure is this row on" — and
   the two being different is what put a per cent beside a count. A row that is
   ON its outcome and has not reported one is NOT SCORED, which is what
   `tacticOutcomeScore` already returns. */
function tacticProgress(t){
  return outcomeOf(t) ? tacticOutcomeScore(t) : tacticRatio(t);
}

/* What a prorated row is measured against, written the way the target is --
   drawn as the quiet half of the YTD actual cell. Null where there is nothing
   worth saying. */
function measureDueLabel(m, share){
  var due = measureDue(m, share);
  if (due == null) return null;
  /* §276: a count with nothing owed yet says so in words (`nothingDueYet`),
     never as "/ 0 #" beside a figure — a benchmark of nought is not a
     benchmark. */
  if (due === 0 && SMPRules.wholeUnits(m.compile)) return null;
  /* JOINED THE PLATFORM'S OWN WAY, never by hand: `18B EGP` keeps its spelling,
     so the benchmark reads `9B EGP` beside it rather than `9 B EGP`. One
     joiner, the same one the reporting page uses to put a typed figure back
     together (§53.5). */
  return joinTarget(String(m.target), String(Math.round(due * 100) / 100),
                    splitTarget(String(m.target)).unit || "");
}
/* HOW FAR THROUGH THIS TACTIC'S OWN WINDOW WE ARE, as an exact fraction.
   `elapsedShare()` answers the same question of the YEAR; this answers it of
   the months the tactic actually runs, which is a different period and, for
   64 of the 78 tactics in the worked example, a different number.

   §218: A FILLED QUARTER COUNTS AT ONCE -- this used to return null while the
   quarters waited on the office, so a tactic whose timeline had just been
   filled in read as NOT DUE, vanished from the report under "Not asked --
   outside this cycle", and could never be reported on.

   §239: AND IT COUNTS MONTHS, NOT WHOLE QUARTERS. The review point is a month,
   so a tactic standing in a half-finished quarter gets credit for the part that
   has actually happened (Islam, asked outright). A tactic running Q2-Q4
   reviewed at August has had 5 of its 9 months. Whole quarters would say a
   tactic planned for the quarter we are standing in has not started.

   §250: IT IS A FRACTION, AND `tacticPlanned()` IS IT ROUNDED -- never the
   other way round. Islam: a tactic in Q2 and Q3 "is a 6 months project from
   april till september .. now we are reporting till august", so five of its six
   months have passed. The first build of §250 read the share back OUT of the
   rounded per cent, and 83/100 is not 5/6: a target of 12 read `9.96` instead
   of `10`, and a WHOLE-YEAR tactic -- which must be untouched by this change --
   moved from 88% to 87%. One value, computed once, with the per cent derived
   from it (§53.5).

   The quarter arithmetic is kept as the fallback for a cycle whose year cannot
   be read: returning null there would make every tactic "not asked" and empty
   the reporting page, which is a far worse failure than a coarse answer.
   NULL MEANS "this tactic names no quarters" -- it has no window, so callers
   fall back to the year rather than refusing to score it. */
function tacticShare(t){
  var q = quartersOf(t), y = reviewYear(), a = reviewAsOf();
  if (y == null || a == null) {
    var tot = 0, el = 0;
    for (var j = 0; j < 4; j++) {
      if (!q[j]) continue;
      tot++;
      if (j + 1 <= REVIEW.endsQuarter) el++;
    }
    return tot ? el / tot : null;
  }
  var total = 0, elapsed = 0;
  for (var i = 0; i < 4; i++) {
    if (!q[i]) continue;
    for (var k = 0; k < 3; k++) {
      total++;
      if (y * 12 + i * 3 + k <= a) elapsed++;
    }
  }
  return total ? elapsed / total : null;
}
/* The share of its plan a tactic is expected to have delivered by now, as the
   per cent every surface prints. */
function tacticPlanned(t){
  var s = tacticShare(t);
  return s == null ? null : Math.round(s * 100);
}
/* A tactic whose quarters have not begun is not behind — it is not yet due,
   and averaging a zero into execution would say otherwise. */
function tacticDue(t){ return tacticPlanned(t) > 0; }


/* ── WHERE THE MISSING THINGS ARE (§145.12) ─────────────────────────────
   One map of every place holding gaps, counted through the shared
   `gapMissing()` — the tab badge, the rail counts and the band's chips all
   read THIS list, so a count can never disagree with the fields it points
   at (§116.2: the count and the queue are one list). Each entry names how
   to GET there, in the navigation's own words. */
/* §192: THE SAME MAP COUNTS THE OTHER THING. Islam, as the SMO: *"I'm
   getting this badge but I don't know where they are — I think we need a
   flow like the filling to take me through the confirmation areas so I can
   confirm."* The badge said 3 and pointed nowhere, which is §16.7's rule
   ("a count that cannot take you to what it counts is a count that makes
   work") and the exact fault §177.2 fixed for the gaps.

   ONE MAP, NOT A SECOND ONE BESIDE IT. Every place, how to get there and in
   whose words is already answered here; a `pendMap()` written alongside would
   be a second copy of the navigation and would drift the first time a page
   moved (§53.5). `pend` swaps only what is COUNTED on each row. */
function gapMap(target, all, fillable){
  var t = String(target || ""), out = [];
  /* §177: COUNTED ONLY WHERE THIS VIEWER COULD ACTUALLY CLOSE IT. The map
     feeds the red "N Missing", the per-place chips, the rail's counts and the
     Next-gap walk, so a gap counted here is a promise that pressing the button
     opens something. A bounded role -- a project owner, a pillar owner, a
     contributor -- reaches only its own rows (mayFillRow), so counting the
     whole subject's gaps at them would send them to a field they cannot type
     in: §61's trap wearing the count's clothes. The office authors, so
     everything counts for them, which is the page-level answer. */
  /* §221: AND A MODE THAT IGNORES WHO IS LOOKING. The scoping above is
     right for the counts somebody is asked to clear, and wrong for the
     question "does this plan still owe anything" — a submission gate that
     read the viewer's own reach would let a unit head submit a plan with
     holes in it simply because the holes are the office's to fill. */
  var canAuthor = {}, reach = function(acKey, ctx){
    if (all) return true;
    if (!(acKey in canAuthor)) canAuthor[acKey] = mayAuthor(acKey, target);
    return canAuthor[acKey] || mayFillRow(acKey, ctx, target);
  };
  var G = function(acKey, ctx, kind, row){
    /* §233: a hidden row's blanks are not gaps — it is not counted, not
       asked, and not walked; gapCell() closes the same row's controls, so
       the count and the walk stay one list (§192.4). */
    if (SMPRules.isHidden(row)) return 0;
    if (!reach(acKey, ctx)) return 0;
    /* §223: COUNTED AND FILLABLE ARE TWO QUESTIONS, AND THE DOOR ASKS THE
       SECOND. §214.2 and §214.4 took a function's key objectives and its
       definition OUT of the counted list at Islam's direction — *"should not
       count as missing"* — and left them fillable, which was the right half
       to answer. The half nobody asked was how anybody would then REACH
       them: fill mode is entered from the "Fill in missing elements" button,
       and that button is drawn from the COUNTED total, so a page whose only
       blanks are optional offered no way in at all. Hala, on CX: the
       Definition read as an em-dash with no control anywhere.

       §205's lesson from the other side: that one recorded a cell the screen
       OPENED and the server refused; this is a cell the server ACCEPTS and
       the screen never opens. */
    if (fillable) return SMPRules.gapEmptyFields(kind, row).length;
    return SMPRules.gapMissing(kind, row).length;
  };
  var entry = function(key, label, count, go){
    out.push({ key: key, label: label, count: count, go: go });
  };
  /* ── A UNIT AND A PILLARS FUNCTION ARE THE SAME SHAPE AND NOT THE SAME
     VOCABULARY (§211) ──────────────────────────────────────────────────
     Islam, on Consumer Finance and Merchandising: *"pressing on the CON01 22
     it doesn't take me to the pillars, it's stuck in the overview."*

     This walked a pillars function through `unitLike()` — right, and §59's
     whole point — and then handed out the UNIT's words for the two things
     that are not shared:

       · the SECTION. A unit's plan is `plan`; a function's is `proj`,
         labelled "Plan" for this format (§59). Setting `CURSEC` to a section
         the page does not have leaves the renderer on its first one, which
         is the Overview — the reported symptom exactly.

       · the ACCESS KEY. A unit's are `u_found`/`u_plan`, a function's
         `k_found`/`k_proj`, and `reach()` here is what decides whether a gap
         is COUNTED AT ALL. Measured on the demo's pillars function: its
         custodian, holding the function's Strategy cell at `fill`, answers
         false to both `u_` keys and true to both `k_` ones — so every count
         came out ZERO and no fill control was drawn, for the one person the
         feature is for. It looked right only from the office, who passes
         every key. §61's trap, hidden behind a permission that happened to
         be true for whoever was looking.

     `page` is deliberately NOT in the vocabulary: `EDIT_PAGE.plan` is one
     mode for both (§145, and the note above `mayEditPlan`), and
     `fillPageForSec` already answers for `proj` as well as `plan`. Splitting
     it would be inventing a difference the product does not have. */
  /* `found: null` MEANS THE FOUNDATION IS NOT THIS SUBJECT'S (§211.2).
     Islam: *"they have a missing item banner in the foundation"* — and there
     is nothing behind it. `GAP_FIELDS.unit` is `["aspiration"]`, and a
     function that plans in pillars HAS NO FOUNDATION OF ITS OWN: its
     aspiration, SWOT and key objectives are the parent unit's, which the page
     said in its own words while the count argued with it. Measured:
     `FUNCTIONS.merchandising` carries no `foundation` key at all, `unitLike()`
     returns null for it and so does `unitLikeWritable()` — so the platform was
     asking for a field the subject can never hold, counting it as one missing
     for ever, and drawing a red *Fill in missing elements* over it. Pressed:
     no fill mode, no section change, ZERO fields. §61 exactly, with the
     loudest control on the page the one with nothing behind it.

     THE KEY OBJECTIVES GO WITH IT, and that is deliberate rather than
     incidental: a pillars function's have no authoring surface anywhere in the
     product (§129's own recorded hole), so counting them would promise a
     control that does not exist — the same fault one row down.

     `builder.js` HAD ALREADY DECIDED THIS: `builderSections()` guards the
     Foundation, Objectives and SWOT sections with `route === "unit"`, so the
     plan builder has always treated a pillars function as having no
     foundation of its own. Two parts of the product answering one question
     differently (§53.5) — this is the other one catching up. */
  var UNIT_WORDS = { found: "u_found", plan: "u_plan", sec: "plan" };
  /* NO FOUNDATION HALF FOR A FUNCTION (§213). §211.2 dropped it on a premise
     that was false (this format CAN store all five fields), §212 put it back
     with a unit's foundation page behind it, and Islam corrected the shape:
     a supporting function never authors an aspiration or a SWOT — it inherits
     the unit's — so what it owes is what a CAPABILITY owes, and that is
     counted below as the Overview. Nothing is counted that no page shows
     (§61), and nothing is shown that the subject does not own. */
  var FN_WORDS   = { found: null, plan: "k_proj", sec: "proj" };
  var unitHalf = function(u, w){
    if (!u) return;
    w = w || UNIT_WORDS;
    if (w.found) {
      var found = G(w.found, {}, "unit", u);
      entry("found", "Foundation", found, { sec: "found", page: "foundation" });
      var ko = 0;
      (u.keyObjectives || []).forEach(function(m){ ko += G(w.found, {}, "ko", m); });
      entry("ko", "Objectives", ko, { sec: "found", page: "foundation" });
    }
    (u.items || []).forEach(function(p, i){
      var n = 0, pctx = function(row){ return { pillarOwner: p.owner, row: row }; };
      (p.measures || []).forEach(function(m){ n += G(w.plan, pctx(m), "measure", m); });
      (p.tactics  || []).forEach(function(x){ n += G(w.plan, pctx(x), "tactic", x); });
      entry("p:" + (p.code || i), pillarCode(u, i), n,
            { sec: w.sec, page: "plan", rail: unitRailKey(u), code: p.code });
    });
  };
  if (t.indexOf("fn:") === 0) {
    var fk = t.slice(3), fo = functionOf(fk);
    if (fo && String(fo.format) === "pillars") {
      /* THE SAME OVERVIEW ENTRY A CAPABILITY FUNCTION GETS, because since
         §213 it is the same page, counted from the same field list (§53.5).
         Drawn ahead of the pillars so the band reads down the page. */
      /* §214: the definition first, then each objective — the same two the
         capability branch counts below, from the same field lists. */
      var fov = G("k_found", {}, "cap", fo);
      (unitLike(t).keyObjectives || []).forEach(function(m){
        fov += G("k_found", {}, "capko", m); });
      entry("ov", "Overview", fov, { sec: "found", page: "capfoundation" });
      unitHalf(unitLike(t), FN_WORDS); return out; }
    var caps = capsOfFunction(fk), ov = 0;
    caps.forEach(function(c){
      ov += G("k_found", {}, "cap", c);           /* §214: its definition */
      (c.keyObjectives || []).forEach(function(m){ ov += G("k_found", {}, "capko", m); });
    });
    entry("ov", "Overview", ov, { sec: "found", page: "capfoundation" });
    caps.forEach(function(c){
      (c.projects || []).forEach(function(p){
        /* The projects rail is per CAPABILITY (railKeyFor), and it selects
           by project id — the same pair the rail's own rows write. */
        /* §177: a project's front matter, its outcomes' targets and its
           milestones' owners and due dates are one place — the project — so
           they are one count and one chip, and the walk lands on the pane
           that holds all three. */
        var pctx = function(row){ return { project: p, row: row }; };
        var n = G("k_proj", { project: p }, "project", p);
        (p.outcomes   || []).forEach(function(o){ n += G("k_proj", pctx(o), "outcome", o); });
        (p.milestones || []).forEach(function(m){ n += G("k_proj", pctx(m), "milestone", m); });
        entry("pr:" + p.id, projCode(fk, p), n,
              { sec: "proj", page: "plan", rail: "cap:" + c.id, code: p.id });
      });
    });
  } else {
    unitHalf(UNITS[t]);
  }
  return out;
}
function gapTotal(target){
  return gapMap(target).reduce(function(a, e){ return a + e.count; }, 0);
}
/* Everything the plan owes, whoever is looking (§221) — what Submit waits on. */
function gapTotalAll(target){
  return gapMap(target, true).reduce(function(a, e){ return a + e.count; }, 0);
}
/* What this viewer could fill in, counted or not (§223) — what decides
   whether the door into fill mode is drawn at all. Always at least the
   counted total, because everything counted is also fillable. */
function gapOpenable(target){
  return gapMap(target, false, true).reduce(function(a, e){ return a + e.count; }, 0);
}
/* Who the counts are FOR: somebody who can act on them — the fill grant or
   the office. A plain reader never sees a nag they cannot clear (§69). */
function seesGaps(target){
  var t = target === undefined ? TARGET : target;
  return SMPRules.FILL_PAGES.some(function(pg){
    return mayFill(pg, t) || mayAuthor(pg, t);
  });
}
/* ── AND WHO IS SHOWN WHAT IS MERELY EMPTY (§272) ────────────────────
   Islam, on Mobile and then Care: *"mobile keeps showing filling what's
   missing while we can't find something missing and there is no the side
   badges that identify where the missing part is."*

   Reproduced by MAKING the state rather than by reading it: with every
   counted gap on Mobile filled and the collaborators left alone, `gapTotal`
   is 0 and `gapOpenable` is 22 — §223's door drawn with no count, no chips
   and no rail marks, because those three read the COUNTED list and there is
   nothing in it. Both halves were behaving as decided (§187 ruled a tactic
   nobody supports is not missing; §205 kept the box fillable); nothing
   joined them up, so the way in was drawn and the destination was not.

   THE OFFICE IS NOT SHOWN IT AT ALL, which is the half that answers what he
   was looking at. `mayFillPage` refuses the office outright — their write
   settles, so they hold the pen — and with nothing owed the door is a second
   way into a page they can already edit, wearing a word that does not apply
   to them (§94.15's argument: a control with no audience of its own is a
   duplicate, not a choice). The moment anything is genuinely MISSING the red
   count, the chips and the button come back for everybody exactly as before:
   this narrows one register and touches neither the other nor any count.

   ASKED HERE AND NOWHERE ELSE, so the bar, the rail and the walk cannot
   answer it three ways (§53.5). */
function seesEmpty(target){
  var t = target === undefined ? TARGET : target;
  return SMPRules.FILL_PAGES.some(function(pg){ return mayFill(pg, t); });
}
function tacticRatio(t){
  var p = tacticPlanned(t);
  return p && t.actual != null ? Math.round(t.actual / p * 100) : null;
}
function spanLabel(t){
  var q = quartersOf(t), on = [];
  for (var i = 0; i < 4; i++) if (q[i]) on.push("Q" + (i + 1));
  return on.join(", ");
}

/* Nulls are dropped rather than counted. A measure with no target set is not
   a measure scoring zero \u2014 it is a measure that cannot be scored, and averaging
   a zero in would report a plan as failing because a target was left blank. */
function avg(a){
  var v = a.filter(function(x){ return x != null && !isNaN(x); });
  return v.length ? Math.round(v.reduce(function(x,y){ return x+y; },0)/v.length) : null;
}

/* The code is positional, not an identifier — it references nothing outside
   the platform, so reordering renumbers it. The unit prefix is kept because it
   still says which unit a pillar belongs to when pillars are listed together
   at group level. */
/* ── THE ONE-YEAR TARGET, HIDDEN ON A UNIT'S OBJECTIVES (§51.16) ─────────
   Islam, 2026-08-23: "the key objectives in the units for now hide the 1 year
   view and just keep the 3 years."

   "For now" is why this is a switch and not a deletion. The same shape §29's
   SHOW_KIND took: the field is still stored, still authored, still arrives and
   leaves with the import template, and still scores the unit — only the two
   places that show the two horizons SIDE BY SIDE drop the near one.

   It is the UNIT's objectives, not the group's and not a capability's, so the
   flag is read where the surface knows which it is drawing. And it is not read
   anywhere a figure is measured against that target — Performance's drill-down,
   Reporting, and the deck's "where we stand" all keep it, because an actual
   with nothing to read it against is a number nobody can judge. */
/* NOW A TOGGLE, AND STILL DEFAULTING TO HIDDEN (§66). Islam: "for the key
   objectives for the business units make a toggle to show and hide the 1 year
   view in the foundation page." So "for now" became a control rather than a
   constant, and the answer it starts on is the one it has been giving.

   A SCREEN PREFERENCE, in localStorage and never in the state graph (§25,
   §47.1) — the same shape as the theme, the People page's columns and the
   rail's terse switch. One person deciding to see both horizons must not
   decide it for the whole tenant, and a toggle that autosaved would. */
/* THE KEY IS BUMPED, WHICH IS HOW A DEFAULT ACTUALLY REACHES ANYBODY (§166).
   §145.11 reversed the default to SHOWN and Islam reported it off twice more —
   because a default only ever governs a browser that has never stored a value,
   and every browser that had touched the toggle since §66 was holding an
   explicit "0". Telling him to press the button once per machine is not an
   answer for a tenant with thirty people.

   A NEW KEY IS A ONE-TIME RESET, NOT THE REMOVAL OF THE PREFERENCE. Everybody
   starts from the new default; the toggle still works and a choice made from
   today still wins in both directions (§30.2's shape, deliberately spent
   once). The old key is left where it is rather than deleted — it costs
   nothing, and a reader who finds it can see exactly what was reset and when. */
var KO_YEAR_KEY = "smp.ko.year2";
/* §145.11 REVERSES §66's DEFAULT (Islam: "let the this year objective
   clicked by default so it can be filled as missing as well"): absent now
   reads as SHOWN, so a missing near target is a visible red word instead
   of a hidden column. The toggle stays, and a person's SAVED choice still
   wins in both directions — the stored value is an explicit "1"/"0", so
   nobody who ever pressed the button moves (§30.2's shape). */
var SHOW_KO_THIS_YEAR = (function(){
  try {
    var v = localStorage.getItem(KO_YEAR_KEY);
    return v === null ? true : v === "1";
  } catch (e) { return true; }
})();
function setKoThisYear(on){
  SHOW_KO_THIS_YEAR = !!on;
  try { localStorage.setItem(KO_YEAR_KEY, SHOW_KO_THIS_YEAR ? "1" : "0"); } catch (e) {}
}

function pillarCode(u, i){
  return (u.codePrefix || "") + String(i + 1).padStart(2, "0");
}

/* ── A PROJECT IS THE FUNCTION'S PILLAR, SO IT IS CODED LIKE ONE (§51.3) ──
   On a unit page the rail holds PILLARS and each shows MB01, RS02. On a
   function page the rail holds PROJECTS and they showed nothing at all — so
   the same shelf in the same component was addressable on one page and
   nameless on the next, and there was no way to say "FIN02" in a meeting.

   Same shape as pillarCode and for the same reasons: the function's own
   prefix, then the position, DERIVED and never stored (§46.3 — the code shown
   is derived, the code stored is an identifier). Numbered across the whole
   function rather than within each capability, because the function is what
   owns the prefix and a person saying "FIN02" should not have to say which
   capability first. */
function fnProjects(fk){
  return capsOfFunction(fk).reduce(function(acc, c){
    return acc.concat(c.projects || []);
  }, []);
}
function projCode(fk, p){
  var f = FUNCTIONS[fk];
  if (!f || !p) return "";
  var i = fnProjects(fk).map(function(x){ return x.id; }).indexOf(p.id);
  return i < 0 ? "" : (f.codePrefix || "") + String(i + 1).padStart(2, "0");
}

/* ── A FUNCTION THAT PLANS IN PILLARS (spec 010, §52) ─────────────────────
   Islam: "for some supporting functions plans they built them in the format of
   the Business units", and "the retail has 3 pillars … 1 of them is a pillar
   for merchandizing where the merchandizing took and broke down in to 3
   pillars where their collective performance represents the performance of
   that pillar."

   ONE SENTENCE HOLDS THE WHOLE DESIGN: a pillar is either scored from its own
   measures and tactics, or HANDED to a function whose pillars produce its
   score. Same structure, one level down.

   `format` is a planning TEMPLATE, not a new kind of thing (Islam, asked: "a
   function that plans in pillars is just a planning template, they shouldn't
   count as Units"). So a pillars function carries `items[]` of exactly the
   shape a unit's pillars have and is drawn by the unit's own pages — two
   screens doing the same job are one screen with different content (A13). */
function fnFormat(f){ return (f && f.format === "pillars") ? "pillars" : "projects"; }
function fnPlansInPillars(f){ return fnFormat(f) === "pillars"; }
function fnItems(f){ return (f && Array.isArray(f.items)) ? f.items : []; }

/* A STORED LIST NEVER HOLDS A HOLE (§118). A pillars function's plan rides in
   one JSON blob (functions.extra), and JSON writes an array hole or an
   undefined entry as null — which is how one poisoned reorder commit left a
   null inside a tactics list and the CF page threw on every visit from the
   next hydration on, while the click looked like it did nothing. The commit
   is fixed in arrange.js; this heals what a tenant already saved. It only
   REMOVES — a reader must never create the field it was looking for (§50.6) —
   and the next autosave persists the clean lists, so the poison does not
   outlive one visit. Units need none of this: their plans are stored
   row-by-row and a null cannot survive that road. */
function fnPruneNulls(f){
  if (!f) return f;
  var live = function(x){ return x != null; };
  if (Array.isArray(f.items)) {
    f.items = f.items.filter(live);
    f.items.forEach(function(p){
      if (Array.isArray(p.measures)) p.measures = p.measures.filter(live);
      if (Array.isArray(p.tactics))  p.tactics  = p.tactics.filter(live);
    });
  }
  if (Array.isArray(f.keyObjectives)) f.keyObjectives = f.keyObjectives.filter(live);
  if (f.swot) ["s","w","o","t"].forEach(function(k){
    if (Array.isArray(f.swot[k])) f.swot[k] = f.swot[k].filter(live);
  });
  return f;
}

/* WHICH function carries this pillar, if any. Returns null unless the pointer
   names a function that exists, is active AND plans in pillars — a pointer at a
   projects function or a retired one is a pointer at something that cannot
   produce the two numbers, and a pillar reading from it would score against
   nothing. Absent, never zero (§15.1). */
/* ── A PILLARS FUNCTION, SHAPED LIKE A UNIT (spec 010 §3) ─────────────────
   The unit's Performance, Plan and Report pages already draw exactly this —
   pillars carrying measures and tactics — so a function that plans in pillars
   is drawn BY THOSE PAGES rather than by copies of them (A13: two screens
   doing the same job are one screen with different content). This is the
   adapter that lets it: a unit-shaped view of a function.

   `items` IS THE FUNCTION'S OWN ARRAY, by reference, so an edit made through a
   unit page writes to the function and not to a copy. Everything a pillars
   function does not have yet — key objectives, an aspiration, a SWOT — is a
   SHARED FROZEN EMPTY rather than a fresh container: a reader must never
   create the field it was looking for, and a page writing into a container
   that is about to be dropped is the same fault wearing a different coat
   (§42, §50.6).

   `ukey` carries the "fn:" prefix, which is what every access and reporting
   question already expects for a function (`canSpeakFor`, `grantAt`). */
var FN_NO_ROWS = Object.freeze([]);
var FN_NO_SWOT = Object.freeze({ s:FN_NO_ROWS, w:FN_NO_ROWS, o:FN_NO_ROWS, t:FN_NO_ROWS });
function fnAsUnit(fk){
  var f = FUNCTIONS[fk];
  if (!fnPlansInPillars(f)) return null;
  return { ukey:"fn:" + fk, fnKey:fk, name:f.name, navName:f.navName,
           codePrefix:f.codePrefix, items:fnItems(f),
           keyObjectives:Array.isArray(f.keyObjectives) ? f.keyObjectives : FN_NO_ROWS,
           aspiration:f.aspiration || "", endInMind:f.endInMind || "",
           clauses:Array.isArray(f.clauses) ? f.clauses : FN_NO_ROWS,
           swot:f.swot || FN_NO_SWOT, active:f.active !== false };
}
/* WRITING TO A FUNCTION THAT PLANS IN PILLARS (§61). fnAsUnit() is a READING
   view: it hands out the function's own arrays where they exist and a shared
   frozen empty where they do not, because a reader must never create the field
   it was looking for (§50.6). An import WRITES, so it asks for the containers
   first — here, in the writing half, which is the only place that mints them.

   And the view is a fresh object every call, while clearUnitPlan() ASSIGNS
   `u.items`, `u.keyObjectives` and `u.swot` rather than emptying them in
   place. Assign into a view and the plan is written to an object that is
   thrown away one line later — the import would report the rows it wrote and
   the function would still be empty. fnWriteBack() is the other half of the
   pair, and neither is any use without it. */
/* AND THE TWO SCALARS HAD TO WRITE THROUGH (§212). Minting the containers is
   enough for every ARRAY on this view, because an array is handed out by
   reference and a row edited in place lands in the function itself. The
   aspiration and the end in mind are STRINGS, so `u.aspiration = v` — which is
   exactly what `renderUnitFoundation()`'s setter does, and it is the same
   setter for a unit — would have written to the fresh object `fnAsUnit()`
   returns and been thrown away on the next paint.

   §61's own trap, one field narrower: that section found an IMPORT reporting
   rows it never wrote, and the same shape was still waiting for the first
   screen that let somebody type into these two. Silent, and in the
   safe-looking direction: the field accepts the text, the page redraws, the
   words are gone.

   Fixed HERE rather than at the call site, so every renderer that already
   knows how to write a unit's foundation writes a function's correctly
   without being told which it has (§53.5). `enumerable` so the view still
   stringifies the way the reading one does. */
function fnWritable(fk){
  var f = FUNCTIONS[fk];
  if (!f || !fnPlansInPillars(f)) return null;
  if (!Array.isArray(f.items)) f.items = [];
  if (!Array.isArray(f.clauses)) f.clauses = [];
  if (!Array.isArray(f.keyObjectives)) f.keyObjectives = [];
  if (!f.swot || f.swot === FN_NO_SWOT) f.swot = { s:[], w:[], o:[], t:[] };
  var u = fnAsUnit(fk);
  ["aspiration", "endInMind"].forEach(function(k){
    Object.defineProperty(u, k, {
      enumerable: true, configurable: true,
      get: function(){ return f[k] || ""; },
      set: function(v){ f[k] = v; }
    });
  });
  return u;
}
function fnWriteBack(fk, u){
  var f = FUNCTIONS[fk];
  if (!f || !u) return;
  f.items = u.items;
  f.keyObjectives = u.keyObjectives;
  f.clauses = u.clauses;
  f.swot = u.swot;
  f.aspiration = u.aspiration || "";
  f.endInMind = u.endInMind || "";
}
/* unitLike() for somebody about to write. Same two answers, same one place. */
function unitLikeWritable(target){
  var t = String(target || "");
  if (t.indexOf("fn:") !== 0) return UNITS[t] || null;
  return fnWritable(t.slice(3));
}
function fnKeyOfTarget(target){
  var t = String(target || "");
  return t.indexOf("fn:") === 0 ? t.slice(3) : null;
}

/* Whether a target — a unit key or "fn:<key>" — is drawn by the unit pages. */
function plansInPillars(target){
  var t = String(target || "");
  if (t.indexOf("fn:") !== 0) return !!UNITS[t];
  return fnPlansInPillars(FUNCTIONS[t.slice(3)]);
}

function pillarCarrier(p){
  var f = p && p.by ? FUNCTIONS[p.by] : null;
  if (!f || f.active === false || !fnPlansInPillars(f)) return null;
  return f;
}
/* ONE LEVEL, and the guard is here rather than in a comment. Nothing in the
   model forbids a function handing one of ITS pillars to another function, and
   nothing has asked for it — but a cycle would hang the page rather than draw
   it wrong, so the depth is capped where the recursion is. */
var PILLAR_DEPTH = 0;
function viaCarrier(p, own, roll){
  var f = pillarCarrier(p);
  if (!f || PILLAR_DEPTH > 0) return own();
  PILLAR_DEPTH++;
  try { return roll(f); } finally { PILLAR_DEPTH--; }
}

/* A measure whose target, direction or compile rule is still awaiting the
   office's confirmation is not scored (§145): the comparison is not ready,
   so it leaves the average the way an unmeasured outcome already does
   (§104.10) — the reported actual is kept and shown, only the score waits. */
/* §233: a hidden row leaves every average — the same skip on every reader,
   through the one shared predicate (SMPRules.isHidden), or the deck and the
   page would disagree about one number. */
function scorableMeasures(p){ return (p.measures || []).filter(function(m){ return !SMPRules.isHidden(m) && m.target && measureScore(m) != null; }); }
function pillarPerf(p){
  return viaCarrier(p,
    /* §250: WRAPPED, NEVER PASSED BY NAME. `measureScore` takes an optional
       share now, and `Array.map` hands its callback the INDEX as a second
       argument -- so a bare `.map(measureScore)` would prorate the first
       measure of every pillar by 0 (unscorable), the second by the whole year,
       the third by TWICE the year. Silent, and wrong only for the `Sum` rows,
       which is the half nobody would think to check. */
    function(){ return avg(scorableMeasures(p).map(function(m){ return measureScore(m); })); },
    function(f){ return avg(fnItems(f).map(pillarPerf)); });
}
function dueTactics(p){ return SMPRules.shown(p.tactics).filter(tacticDue); }
/* A tactic that is due but has nothing reported is not delivering zero \u2014 it is
   unreported, and averaging a zero would say the plan is failing. */
/* §248: a tactic measured by its OUTCOME has answered when the outcome's
   figure is in, whichever box it came from. Written as one predicate so the
   three panes, the score and the note rule cannot disagree about whether a
   row has been answered (§53.5). */
/* ── ONE QUESTION DECIDES THE WHOLE ROW (§254.2, narrowing §248) ───────
   Islam, of a tactic reading `2% / 2#` on the deck: *"the ytd is showing 2% /
   2# .. it's not 2% in the performance it's just 2 with a unit of #"*, and
   then, of the cause: *"the reported number is already 2# I don't know why
   it's not reported correctly."*

   NINE STATES WERE PUT THROUGH THE SCORER AND EVERY ONE WITH A FIGURE IN THE
   OUTCOME SCORES. So the figure the deck could see was not in the outcome, and
   there is one path that produces exactly his row: the reporting box asks for
   the OUTCOME's figure only once the outcome has a target, and asks the old
   question — per cent delivered — before that. A figure reported before the
   target was added therefore sits in `actual` for ever, and the moment the
   target appears `tacticBenchmark` starts answering with the outcome's target
   while the figure is still coming from the old field. Two measures in one
   cell, and nobody did anything wrong.

   §248 SWITCHED ON TARGET **AND** FIGURE, deliberately, so that adding an
   outcome mid-round changed nothing until somebody typed. That rule is
   narrowed here at Islam's direction — he was offered three behaviours with
   what each costs and chose this one: **the target alone decides**, and a row
   whose outcome has a target but no figure SAYS IT IS OWED ONE rather than
   quietly reading its old per cent.

   THE COST IS REAL AND WAS STATED BEFORE HE CHOSE: such a row leaves every
   average, stops counting as reported, and refuses Submit until the figure is
   entered — which is one number on the reporting page. It is the only one of
   the three that never states a figure nobody reported (§35), and the two
   alternatives were an invented figure (carrying the old per cent across) and
   an ignored target. */
function tacticAnswered(t){
  if (!t) return false;
  return outcomeOf(t) ? tacticOutcomeScore(t) != null : t.actual != null;
}
function reportedTactics(p){ return dueTactics(p).filter(tacticAnswered); }
/* THE TWO SCORES PASS UP SEPARATELY AND STAY APART (Islam, asked). The child's
   measure performance becomes the pillar's performance and its execution
   becomes the pillar's execution — nothing is blended, so the parent's two
   headline numbers stay comparable across all of its pillars, the handed-over
   one included. `plan` travels with `exec` because the ratio between them is
   what "of plan" means; averaging a ratio of ratios would say something else. */
/* §248: THE AVERAGE READS THE SCORE, NOT THE RAW NUMBER. It averaged
   `t.actual` directly, which is only sound while every tactic reports the same
   0–100 "% delivered" — the moment one is measured in stores or in EGP, an
   average of 45 and 7 means nothing. `tacticReads` returns the outcome's score
   where there is one and the delivery figure where there is not, so on a plan
   with no outcomes this is byte-identical to what it computed before and no
   unit's number moves. */
function pillarExec(p){
  return viaCarrier(p,
    function(){ return avg(reportedTactics(p).map(tacticReads)); },
    function(f){ return avg(fnItems(f).map(pillarExec)); });
}
/* And its partner: `exec / plan` is what "of plan" means, so the two halves
   must be in the same currency. An outcome's score is ALREADY a ratio against
   the target due at this point in the year, so its plan is 100 — not the
   share of its quarters, which would divide a ratio by a ratio and report a
   tactic delivering exactly its target as 138% of plan. */
function tacticPlanShare(t){ return onOutcome(t) ? 100 : tacticPlanned(t); }
function pillarPlan(p){
  return viaCarrier(p,
    function(){ return avg(reportedTactics(p).map(tacticPlanShare)); },
    function(f){ return avg(fnItems(f).map(pillarPlan)); });
}
function pillarRatio(p){ var pl = pillarPlan(p); return pl ? Math.round(pillarExec(p)/pl*100) : null; }

function unitPillars(u){ return avg(u.items.map(pillarPerf)); }
function unitExec(u){ return avg(u.items.map(pillarExec)); }
function unitPlan(u){ return avg(u.items.map(pillarPlan)); }
function unitRatio(u){ var pl = unitPlan(u); return pl ? Math.round(unitExec(u)/pl*100) : null; }

var UNIT_KEYS = ["mobile","retailstores","b2becomm","consumerelectronics","onlineshop",
                 "corporate","care","it","logistics","nigeria"];

/* A unit is identified by its KEY everywhere. The name is display only, the
   same as any other label — so renaming one cannot break a lookup. The
   weighting table used to match on the name string, which meant a rename
   silently detached a unit from its weight with no error anywhere. */
/* THE KEY THE ROW ALREADY CARRIES WINS (§67.6). This line existed to FIX
   name-matching — the note above records that matching on the name meant a
   rename silently detached a unit from its weight — and it added `key` to
   every row and then went on overwriting it FROM THE NAME anyway. So the fault
   it was written against was still live, and worse than silent.

   Renaming a unit on Setup → Business units survives the session, because this
   runs once at load. On the NEXT load the name no longer matches, `row.key`
   becomes null, and `weighting_rows.unit_key` is NOT NULL — so every save from
   that moment on fails with a constraint violation and the tenant cannot write
   anything at all. Found by renaming IT to "IT Dist." and running the round
   trip; nothing else in the product would have said a word.

   The name-match stays as the FALLBACK, for a row written before rows carried
   a key. */
GROUP.weighting.units.forEach(function(row){
  if (row.key && UNITS[row.key]) return;
  row.key = UNIT_KEYS.filter(function(k){ return UNITS[k].name === row.unit; })[0] || null;
});

/* Inactive units keep every pillar, measure, tactic and reported figure. They
   simply stop appearing — retiring a unit must never destroy a cycle's record. */
Object.keys(UNITS).forEach(function(k){ if (UNITS[k].active == null) UNITS[k].active = true; });

/* Seeded at zero and filled by syncWeights() from the factor table. A weight
   stored in the data would be a second source that looks authoritative and is
   overwritten on first render — which is how a stale 45% survived long after
   the composite said 21%. */

/* Every item carries a stable id. Without one, a re-upload cannot tell a
   corrected target from a new measure, and would duplicate a plan every time
   the sheet was loaded. The platform generates these; the template carries
   them; nobody types them. */
function renumberUnit(u){
  var k = u.ukey;
  u.clauses.forEach(function(c, i){ c[2] = k + "-F" + (i + 1); });
  u.keyObjectives.forEach(function(m, i){ m.id = k + "-KO" + (i + 1); });
  u.items.forEach(function(p, pi){
    p.id = k + "-P" + (pi + 1);
    /* A pillar's CODE is what the rail keys off and what its title leads with.
       Baked pillars carry one; a pillar arriving from an upload does not, and
       every one of them then read "undefined" and shared a rail key, so the
       rail could not select between them. Filled in when absent, positionally.
       An existing code is left alone: nine units carry hand-set ones and
       renumbering them would rewrite codes that are already in decks. */
    if (!p.code) p.code = pillarCode(u, pi);
    p.measures.forEach(function(m, mi){ m.id = p.id + "-M" + (mi + 1); });
    p.tactics.forEach(function(t, ti){ t.id = p.id + "-T" + (ti + 1); });
  });
}
UNIT_KEYS.forEach(function(k){ UNITS[k].ukey = k; renumberUnit(UNITS[k]); });
/* AND A FUNCTION THAT PLANS IN PILLARS GETS THEM TOO (§59). Spec 010 gave a
   function the unit's plan shape and the unit's pages, and this loop was left
   running over UNIT_KEYS alone — so Merchandising's three pillars, their
   measures and their tactics all carried `id: undefined`.

   Silent, and it broke two things at once. The rail keys off the id, and the
   AUTHORISER compares plans by id: with every row keyed `undefined`, the
   stored and incoming graphs looked identical and a reported figure classified
   as NOTHING AT ALL. Found by asking the classifier what it made of a figure
   somebody had just typed, which returned an empty list — not by reading it.

   `fnAsUnit()` hands over the same object the pages draw, `items` BY
   REFERENCE, so the ids land on the function's own rows. */
FUNCTION_KEYS.forEach(function(k){
  var asU = fnAsUnit(k);
  if (asU) renumberUnit(asU);
});

/* ── ADDING ONE ROW TO A PLAN (§69.13) ────────────────────────────────────
   Islam: "in the projects and pillars pages I need to have the edit with
   include the arrange and add access, to edit current projects and pillars or
   add one."

   §22 is unchanged and this does not touch it: a plan still ARRIVES by upload,
   codes are still minted on arrival, replacing still archives. This is §31's
   pen doing one more thing — correcting a plan afterwards without re-uploading
   a whole unit — and a pen that can retype every field but cannot add the row
   somebody forgot is half a pen.

   THEY APPEND, ALWAYS, AND THEY NEVER RENUMBER. `renumberUnit()` rewrites
   every id from POSITION, which is right when a whole plan is authored at once
   (import, restoring an archive) and would be quietly destructive here: ids
   are what a reported figure, a focus mark and a cycle snapshot are keyed on
   (§48.1), and reordering deliberately does NOT renumber, so after one drag a
   pillar's position and its id already disagree. Run the renumber on an add
   and every figure in the unit is orphaned. So a new row is appended and given
   an id of its OWN, and arranging afterwards moves it without touching either.

   AND NOT length + 1. After a row has been removed, `-P3` can still be held by
   the last of three — the same collision mintPersonKey() and mintClaimId()
   already scan for. */
function mintRowId(list, prefix){
  var taken = {};
  (list || []).forEach(function(x){ if (x && x.id) taken[x.id] = 1; });
  var n = (list || []).length + 1;
  while (taken[prefix + n]) n++;
  return prefix + n;
}

/* A pillar arrives with every field a reader asks for, present and empty
   (§51.10: the code that CREATES a row has to mint the shape readers expect,
   and a writer minting the old shape is silent until somebody opens the page
   that reads it — which is how adding a capability took the product down for
   eleven versions). `code` is left for pillarCode() to derive positionally,
   the same way an uploaded pillar's is. */
function addPillar(u){
  if (!u || !u.items) return null;
  var it = { id: mintRowId(u.items, u.ukey + "-P"), code: "", name: "", sub: "",
             kind: "", theme: "", owner: "", measures: [], tactics: [] };
  u.items.push(it);
  return it;
}
function addMeasure(it){
  if (!it) return null;
  var m = { id: mintRowId(it.measures, it.id + "-M"), name: "", dir: "\u2265",
            target: "", compile: "Latest", actual: "" };
  it.measures.push(m);
  return m;
}
/* A tactic's quarters are four separate fields, not an array — that is what
   the data has carried since the beginning and what qs() reads. All four off:
   a tactic due in no quarter is asked for in no cycle (§42), which is the
   right starting state for a row nobody has planned yet. */
function addTactic(it){
  if (!it) return null;
  var t = { id: mintRowId(it.tactics, it.id + "-T"), name: "", owner: "",
            q1: 0, q2: 0, q3: 0, q4: 0, status: "", actual: null };
  it.tactics.push(t);
  return t;
}
function addProject(c){
  if (!c || !c.projects) return null;
  var p = { id: mintRowId(c.projects, c.id + "-P"), capId: c.id, name: "", owner: "",
            brief: "", stakeholders: [], timeline: "quarter", start: "", end: "",
            deliverables: [], outcomes: [], milestones: [] };
  c.projects.push(p);
  return p;
}
/* A DELIVERABLE HAS NO DUE AND NO OWNER (§53.4) — it is delivered when the
   project ends and the project's owner owns it — so neither is minted here.
   An outcome keeps measureAt, because a measurement time is a real thing
   somebody chose. */
function addDeliverable(p){
  if (!p) return null;
  var d = { id: mintRowId(p.deliverables, p.id + "-D"), name: "", kind: "binary", actual: "" };
  p.deliverables.push(d);
  return d;
}
function addOutcome(p){
  if (!p) return null;
  var o = { id: mintRowId(p.outcomes, p.id + "-O"), name: "", dir: "\u2265",
            target: "", measureAt: "", actual: "" };
  p.outcomes.push(o);
  return o;
}
function addMilestone(p){
  if (!p) return null;
  var m = { id: mintRowId(p.milestones, p.id + "-M"), name: "", covers: "",
            owner: "", finish: "", status: "" };
  p.milestones.push(m);
  return m;
}

/* Every project in the tenant, and the one with this id. Searched rather than
   addressed through its capability, because the caller has the row's id and
   nothing else — and an id already encodes its parent, so passing the parent
   separately would be a second copy of the same fact for the two to disagree
   about. */
function eachProject(fn){
  (GROUP.capabilities || []).forEach(function(c){
    (c.projects || []).forEach(function(p){ fn(p, c); });
  });
}
function projById(id){
  var hit = null;
  eachProject(function(p){ if (p.id === id) hit = p; });
  return hit;
}
/* WHICH ARRAY A ROW LIVES IN, found by looking rather than by parsing its id.
   An id looks addressable — `mobile-P1-M2` names its unit and its pillar — and
   reading it that way would break the moment a key contains a hyphen, which a
   minted person key cannot but a unit key set by hand certainly can. Scanning
   is O(the plan) and the plan is small; a wrong answer here splices the wrong
   row out of somebody's strategy. */
/* ── THE SIX HIDEABLE KINDS, RESOLVED BY ID (§233) ────────────────────────
   An objective (a unit's, the group's, a capability's), a measure, a tactic,
   a deliverable, an outcome, a milestone — every id is unique across the
   graph (§191), so one resolver serves the one toggle. A pillar, a
   capability and a project are deliberately NOT here: Islam ruled a whole
   slide can never disappear, so the control is never drawn for them and the
   handler cannot reach them either — both ends of the same door. */
function hideableById(id){
  var hit = null;
  var scan = function(list){
    (list || []).forEach(function(x){ if (!hit && x && x.id === id) hit = x; });
  };
  scan(GROUP.keyObjectives);
  GROUP.capabilities.forEach(function(c){ scan(c.keyObjectives); });
  UNIT_KEYS.concat(FUNCTION_KEYS.map(function(f){ return "fn:" + f; })).forEach(function(t){
    var u = unitLike(t);
    if (!u) return;
    scan(u.keyObjectives);
    (u.items || []).forEach(function(p){ scan(p.measures); scan(p.tactics); });
  });
  eachProject(function(p){ scan(p.deliverables); scan(p.outcomes); scan(p.milestones); });
  return hit;
}

function listById(kind, id){
  var out = null;
  var look = function(list){
    if (!out && list && list.some(function(x){ return x && x.id === id; })) out = list;
  };
  if (kind === "measures" || kind === "tactics") {
    UNIT_KEYS.concat(FUNCTION_KEYS.map(function(f){ return "fn:" + f; })).forEach(function(t){
      var u = unitLike(t);
      ((u && u.items) || []).forEach(function(it){ look(it[kind]); });
    });
    return out;
  }
  eachProject(function(p){ look(p[kind]); });
  return out;
}

/* Removing one. By ID, never by index: the render that drew the button and the
   array being spliced are a repaint apart, and an index is the thing that goes
   stale in between (§48.2, the same reason a delete re-asks its blockers).
   Returns whether anything went, so a caller can tell a no-op from a removal. */
function removeRowById(list, id){
  if (!list || !id) return false;
  var i = -1;
  list.forEach(function(x, n){ if (x && x.id === id) i = n; });
  if (i < 0) return false;
  list.splice(i, 1);
  return true;
}

/* The generic template is built against an EMPTY shape, not against a chosen
   unit: the file is the same whichever unit it will end up describing, and the
   only thing that makes it one unit's is the cell chosen on its Read me sheet.
   The clause LABELS come along because they are the group's own skeleton and
   give whoever fills the sheet something to answer. */
function blankUnitShape(){
  return { ukey:"", name:"", codePrefix:"", clauses:GROUP.clauses.map(function(c){ return [c[0], "", ""]; }),
           aspiration:"", endInMind:"", keyObjectives:[], swot:{ s:[], w:[], o:[], t:[] },
           items:[] };
}
function blankCapShape(){
  return { id:"", name:"", def:"", fn:"", keyObjectives:[], projects:[] };
}

/* ── Archived plans (\u00a722) ────────────────────────────────────────────────
   An upload AUTHORS a plan: it writes one from scratch rather than amending
   what is there. That is what let every code leave the template \u2014 there is
   never a row to match \u2014 and it is why replacing has to be safe: the outgoing
   plan, and every figure reported against it, are kept before the new one is
   written. Nothing an upload does is a deletion.

   Kept in the state graph rather than in a corner of the database, so an
   archive travels with everything else: it is saved, read back and shown by
   the same machinery as the plan it came from.
   \u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014 */
var ARCHIVES = [];

function clone(x){ return JSON.parse(JSON.stringify(x)); }

/* A date the SMO would write, not a timestamp nobody reads. */
var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function todayLabel(){
  var d = new Date();
  return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
}
/* Who is acting, not who is being simulated: the signed-in person where there
   is one, and the viewer offline. */
function actingName(){
  var p = (typeof SYNC !== "undefined" && SYNC.person) ? SYNC.person() : null;
  if (p && p.name) return p.name;
  var v = viewer();
  return v ? v.name : "";
}

function unitPlanSnapshot(u){
  return { clauses:clone(u.clauses), aspiration:u.aspiration, endInMind:u.endInMind,
           keyObjectives:clone(u.keyObjectives), swot:clone(u.swot), items:clone(u.items) };
}
function capPlanSnapshot(c){
  return { def:c.def, keyObjectives:clone(c.keyObjectives || []),
           projects:clone(c.projects || []) };
}

/* What the archive HELD, counted once and stored \u2014 so the list reads without
   walking every snapshot, and still reads if the model later grows a field. */
function unitSnapshotCounts(s){
  var m = 0, t = 0, rep = 0;
  (s.items || []).forEach(function(p){
    m += (p.measures || []).length; t += (p.tactics || []).length;
    (p.measures || []).forEach(function(x){ if (x.progress != null) rep++; });
    /* §252: an archived tactic answered by its outcome was reported, and a
       snapshot that says otherwise is a count of the wrong box. */
    (p.tactics  || []).forEach(function(x){ if (tacticAnswered(x)) rep++; });
  });
  (s.keyObjectives || []).forEach(function(x){ if (x.progress != null) rep++; });
  return { pillars:(s.items || []).length, measures:m, tactics:t,
           objectives:(s.keyObjectives || []).length, reported:rep };
}
function capSnapshotCounts(s){
  var d = 0, o = 0, ms = 0, rep = 0;
  (s.projects || []).forEach(function(p){
    d += (p.deliverables || []).length; o += (p.outcomes || []).length;
    ms += (p.milestones || []).length;
    (p.outcomes || []).forEach(function(x){ if (x.progress != null) rep++; });
    (p.deliverables || []).forEach(function(x){ if (x.actual != null) rep++; });
  });
  (s.keyObjectives || []).forEach(function(x){ if (x.progress != null) rep++; });
  return { projects:(s.projects || []).length, deliverables:d, outcomes:o,
           milestones:ms, objectives:(s.keyObjectives || []).length, reported:rep };
}

/* ── A CYCLE'S FIGURES ARE ARCHIVED BEFORE THEY ARE CLEARED (§49.1) ──
   Opening a cycle used to change the name, the dates and the deadline and
   leave every actual, progress mark, tactic status and note exactly where the
   last cycle left them — so 163 of 184 items read "reported" the second it
   opened and a unit head could press Submit without touching a field. The
   page's own copy already claimed the new cycle "asks every unit again".

   Clearing alone was not the fix: HISTORY keeps a SCORE per unit, never the
   raw figures, so a clear with nothing behind it destroys the closed cycle's
   numbers. So opening ARCHIVES first, the same act an import performs on a
   plan it replaces, and the archive carries a Restore.

   The snapshot is keyed BY ID rather than cloned by position, because a plan
   may be edited between the close and the restore and a positional snapshot
   would then put last cycle's number against a different measure. An id that
   is no longer there is dropped on the way back in. */
function figuresSnapshot(){
  var snap = { units:{}, caps:{}, groupCaps:{}, groupKO:{},
               note:clone(REVIEW.note || {}), submitted:clone(REVIEW.submitted || {}),
               /* THE PICTURES GO INTO THE ARCHIVE WITH THE FIGURES (§50.1).
                  They belong to this cycle: a picture is evidence for one
                  review, and one that stayed would present itself as next
                  cycle's until somebody remembered to take it out. Archived
                  rather than dropped, because a restore that gives back the
                  numbers and not the pictures has not restored the review.
                  Absent, not empty: a cycle nobody put a picture in must
                  archive nothing rather than an object the database never
                  held (§42's phantom change). */
               slides:REVIEW.slides ? clone(REVIEW.slides) : undefined };
  var put = function(m, x, fields){
    if (!x || !x.id) return;
    var o = {};
    fields.forEach(function(f){ o[f] = x[f]; });
    m[x.id] = o;
  };
  UNIT_KEYS.forEach(function(k){
    var u = UNITS[k], m = {};
    u.keyObjectives.forEach(function(x){ put(m, x, ["actual","progress","note"]); });
    (u.items || []).forEach(function(p){
      (p.measures || []).forEach(function(x){ put(m, x, ["actual","progress","note"]); });
      (p.tactics  || []).forEach(function(x){ put(m, x, ["actual","status","note"]); });
    });
    snap.units[k] = m;
  });
  (GROUP.keyObjectives || []).forEach(function(x){ put(snap.groupKO, x, ["actual","progress","note"]); });
  /* A capability is ONE object: the group's headline pair (perf/exec) and the
     function's own reporting hang off the same record, so they are taken in
     one pass rather than in two that could disagree. */
  (GROUP.capabilities || []).forEach(function(c){
    var m = {};
    snap.groupCaps[c.id] = { perf:c.perf, exec:c.exec };
    (c.keyObjectives || []).forEach(function(x){ put(m, x, ["actual","progress","note"]); });
    (c.projects || []).forEach(function(p){
      /* status/pct, NOT actual (§115): migration 024 deleted a deliverable's
         `actual` and gave milestones a per-cent, and this snapshot was never
         told — so every archive since the one-row shape stored `undefined`
         for a deliverable and lost the milestone's number. §51.10's rule, in
         the archive: when a field is renamed, find every writer. */
      (p.deliverables || []).forEach(function(x){ put(m, x, ["status","pct","note"]); });
      (p.outcomes    || []).forEach(function(x){ put(m, x, ["actual","progress","note"]); });
      (p.milestones  || []).forEach(function(x){ put(m, x, ["status","pct","note"]); });
    });
    snap.caps[c.id] = m;
  });
  return snap;
}

/* What the archive held, counted once — the same contract as a plan's counts,
   so the Archives table can read every row without walking a snapshot. */
function figuresSnapshotCounts(s){
  var reported = 0, total = 0, notes = 0;
  var walk = function(m){
    Object.keys(m || {}).forEach(function(id){
      var o = m[id]; total++;
      var v = o.actual != null && o.actual !== "" ? o.actual
            : (o.progress != null ? o.progress : (o.status != null ? o.status : null));
      if (v != null && v !== "" && v !== "Not started") reported++;
      if (o.note && String(o.note).trim()) notes++;
    });
  };
  Object.keys(s.units || {}).forEach(function(k){ walk(s.units[k]); });
  Object.keys(s.caps  || {}).forEach(function(k){ walk(s.caps[k]);  });
  walk(s.groupKO);
  return { reported:reported, figures:total, notes:notes,
           units:Object.keys(s.submitted || {}).length };
}

function figuresAreEmpty(counts){ return !counts.reported && !counts.notes && !counts.units; }

/* Returns the archive taken, or null when the cycle recorded nothing worth
   keeping — a first cycle on a fresh tenant archives nothing and says so. */
function archiveFigures(why){
  var snap = figuresSnapshot(), counts = figuresSnapshotCounts(snap);
  if (figuresAreEmpty(counts)) return null;
  var a = { id:archiveId(), kind:"figures", key:"", name:REVIEW.name || "Unnamed cycle",
            at:todayLabel(), by:actingName(), why:why || "cleared when a new cycle opened",
            counts:counts, figures:snap };
  ARCHIVES.unshift(a);
  return a;
}

/* Putting figures back writes ONLY the ids that are still there. A plan edited
   since the archive was taken keeps its shape; the numbers land where they
   still have somewhere to land. */
function applyFiguresSnapshot(s){
  if (!s) return;
  var take = function(m, x){
    if (!x || !x.id || !m || !m[x.id]) return;
    Object.keys(m[x.id]).forEach(function(f){ x[f] = m[x.id][f]; });
  };
  Object.keys(s.units || {}).forEach(function(k){
    var u = UNITS[k]; if (!u) return;
    var m = s.units[k];
    u.keyObjectives.forEach(function(x){ take(m, x); });
    (u.items || []).forEach(function(p){
      (p.measures || []).forEach(function(x){ take(m, x); });
      (p.tactics  || []).forEach(function(x){ take(m, x); });
    });
  });
  (GROUP.keyObjectives || []).forEach(function(x){ take(s.groupKO, x); });
  (GROUP.capabilities || []).forEach(function(c){
    var o = (s.groupCaps || {})[c.id];
    if (o) { c.perf = o.perf; c.exec = o.exec; }
    var m = (s.caps || {})[c.id]; if (!m) return;
    (c.keyObjectives || []).forEach(function(x){ take(m, x); });
    (c.projects || []).forEach(function(p){
      (p.deliverables || []).forEach(function(x){ take(m, x); });
      (p.outcomes    || []).forEach(function(x){ take(m, x); });
      (p.milestones  || []).forEach(function(x){ take(m, x); });
    });
  });
  REVIEW.note = clone(s.note || {});
  REVIEW.submitted = clone(s.submitted || {});
  if (s.slides && Object.keys(s.slides).length) REVIEW.slides = clone(s.slides);
  else delete REVIEW.slides;
}

/* A note explains a figure. Cleared together, or the new cycle opens with last
   cycle's explanation sitting under a blank number. */
function clearAllNotes(){
  UNIT_KEYS.forEach(function(k){
    var u = UNITS[k];
    u.keyObjectives.forEach(function(x){ x.note = ""; });
    (u.items || []).forEach(function(p){
      (p.measures || []).forEach(function(x){ x.note = ""; });
      (p.tactics  || []).forEach(function(x){ x.note = ""; });
    });
  });
  (GROUP.keyObjectives || []).forEach(function(x){ x.note = ""; });
  /* The capabilities left this function in §115 — their new-cycle behaviour
     is a decision per PROJECT now, not a blanket clear, and it lives in
     clearForNewCycle() where the cycle's own length is still readable. */
}

/* Everything a new cycle asks again: the units' figures, the group's, the
   capabilities', the notes beneath them, and who had submitted. */
/* ── WHAT A NEW CYCLE DOES TO A CAPABILITY (§115) ────────────────────────
   Until §115 every project was wiped when a cycle opened — clearCapability's
   "nums" pass, written before anyone had opened a second cycle on real data —
   so the day H2 opened, a DELIVERED project's record would have been erased
   and its Execution read as nought. That clear is now a decision each project
   makes:

   · a project marked `repeats: "cycle"` IS re-asked — figures archived (the
     archive runs first, §49.1) and cleared, and every date it carries shifts
     forward by the closed cycle's length, so the H2 run keeps H1's rhythm.
     The pen can then adjust any date the new run does differently.
   · an unmarked project KEEPS its figures and its notes — delivered is
     delivered, and a note explaining a standing figure stands with it.

   The capability's own key objectives clear every cycle regardless: they are
   per-cycle figures, the function's KPIs, same as a unit's measures. */
/* ── HOW OFTEN A PROJECT REPEATS, IN MONTHS (§196) ─────────────────────
   Islam: *"the repeat might not be each cycle — the repeat might be half
   annual or every quarter, so it's a count of months for repetition."*

   §115 stored ONE WORD, `"cycle"`, and moved every date on by the closed
   cycle's own length. That is exactly right for a project whose rhythm IS
   the cycle's, and it has nothing to say about one that runs quarterly in a
   tenant that reports half-yearly — which is the case he brought.

   `"cycle"` IS STILL READ AND STILL MEANS WHAT IT MEANT (§30.2). A project
   marked before today behaves identically, and the option goes on being
   offered while it is the stored value rather than being quietly rewritten
   to a number that might not be the same one (§96.2). Nothing is migrated,
   because nothing about the old value stopped being true. */
var REPEAT_MONTHS = [3, 6, 12];
function repeatLabel(v){
  if (v === "cycle") return "Each cycle";
  var n = Number(v);
  return n > 0 ? "Every " + plural(n, "month") : "No";
}
function repeatsOn(p){ return !!p && (p.repeats === "cycle" || Number(p.repeats) > 0); }

/* HOW FAR THE DATES MOVE when a cycle opens.

   A repeating project always advances to its NEXT run — the question is only
   how far. A rhythm SHORTER than the cycle advances by however many whole
   runs the closed cycle covered: quarterly across a six-month cycle moves
   six months, not three, or the project lands in the past the moment the
   cycle opens. A rhythm LONGER advances by one full run, which is where its
   next one genuinely falls — an annual project closing a half-yearly cycle
   moves a year, to the same months next year.

   THE LIMIT, SAID RATHER THAN DISCOVERED: opening a cycle is the only moment
   the platform re-asks anything, so a quarterly project is re-asked when the
   cycle opens and not twice inside it. Its DATES keep the quarterly rhythm;
   the asking keeps the cycle's. Anything else needs the product to have a
   notion of time passing between cycles, and it has none. */
function repeatSpan(p, span){
  if (!repeatsOn(p)) return 0;
  if (p.repeats === "cycle") return span;
  var n = Number(p.repeats);
  return Math.max(1, Math.round(span / n)) * n;
}

function capNewCycle(c, span){
  (c.keyObjectives || []).forEach(function(m){ m.actual = ""; m.progress = null; m.note = ""; });
  (c.projects || []).forEach(function(p){
    var by = repeatSpan(p, span);
    if (!by) return;
    (p.deliverables || []).forEach(function(d){
      d.status = null; d.pct = null; d.note = "";
      if (d.due) d.due = shiftWhen(d.due, by);
    });
    (p.outcomes || []).forEach(function(o){
      o.actual = null; o.progress = null; o.note = "";
      if (o.measureAt) o.measureAt = shiftWhen(o.measureAt, by);
    });
    (p.milestones || []).forEach(function(m){
      m.status = null; m.pct = null; m.note = "";
      if (m.finish) m.finish = shiftWhen(m.finish, by);
    });
    if (p.start) p.start = shiftWhen(p.start, by);
    if (p.end)   p.end   = shiftWhen(p.end, by);
  });
}
function clearForNewCycle(){
  /* Computed BEFORE anything clears, while REVIEW is still the cycle being
     closed — the shell replaces REVIEW right after this returns. A cycle
     whose dates the reader cannot parse shifts by six months, the cadence
     this tenant runs. */
  var a = monthsOf(REVIEW.from), b = monthsOf(REVIEW.to);
  var span = (a != null && b != null && b >= a) ? (b - a + 1) : 6;
  (GROUP.capabilities || []).forEach(function(c){ capNewCycle(c, span); });
  clearAllNumbers();
  clearAllNotes();
  REVIEW.note = {};
  REVIEW.submitted = {};
  /* DELETED, not emptied. An empty object is a change against a database that
     never held the field, and every save a non-SMO makes would then be refused
     for the rest of the cycle (§42). */
  delete REVIEW.slides;
}

/* "1 pillars" is the kind of thing that makes a product feel unfinished. */
/* An explicit plural where -s is wrong: "1 capability" / "2 capabilities",
   "1 person" / "2 people". Optional, so every existing call is unchanged —
   and it is here rather than at the call sites because this file already
   records "3 pillarss" as the cost of doing it by hand (§59). */
function plural(n, word, many){
  return n + " " + (n === 1 ? word : (many || word + "s"));
}

/* The horizon is the year a tenant is planning TO, and it is theirs to enter —
   never a default the platform supplies. Until it is entered every page that
   leans on it has to read as though it were not there, rather than trailing a
   dangling "by". */
function horizonSet(){ return !!String(GROUP.horizon == null ? "" : GROUP.horizon).trim(); }
function horizonBy(){ return horizonSet() ? " by " + esc(GROUP.horizon) : ""; }
function horizonLabel(){ return horizonSet() ? esc(GROUP.horizon) : "not set"; }

function planIsEmpty(counts){
  return !counts.pillars && !counts.objectives && !counts.projects;
}

var ARCH_N = 0;
function archiveId(){
  /* Unique against what is already stored, so a restored file cannot collide
     with an archive taken in the same session. */
  do { ARCH_N++; } while (ARCHIVES.some(function(a){ return a.id === "arch" + ARCH_N; }));
  return "arch" + ARCH_N;
}

/* Returns the archive taken, or null when there was nothing worth keeping \u2014
   a first plan for an empty unit archives nothing and says so. */
function archiveUnitPlan(u, why){
  var snap = unitPlanSnapshot(u), counts = unitSnapshotCounts(snap);
  if (planIsEmpty(counts)) return null;
  var a = { id:archiveId(), kind:"unit", key:u.ukey, name:u.name, at:todayLabel(),
            by:actingName(), why:why || "replaced by an upload", counts:counts, plan:snap };
  ARCHIVES.unshift(a);
  return a;
}
function archiveCapPlan(c, why){
  var snap = capPlanSnapshot(c), counts = capSnapshotCounts(snap);
  if (planIsEmpty(counts)) return null;
  var a = { id:archiveId(), kind:"cap", key:c.id, name:c.name, at:todayLabel(),
            by:actingName(), why:why || "replaced by an upload", counts:counts, plan:snap };
  ARCHIVES.unshift(a);
  return a;
}

/* Restoring is the same act in reverse: what is on screen now is archived
   first, so a restore can itself be undone. */
function restoreArchive(id){
  var a = ARCHIVES.filter(function(x){ return x.id === id; })[0];
  if (!a) return false;
  /* Figures are restored INTO whatever plan is standing now — the ids that
     still exist take their numbers back and the rest are dropped (§49.1). The
     current figures are archived on the way, so a restore can itself be
     undone, exactly as a plan restore can. */
  if (a.kind === "figures") {
    archiveFigures("replaced by restoring the " + a.at + " archive");
    applyFiguresSnapshot(a.figures);
  }
  else if (a.kind === "unit") {
    /* unitLikeWritable, never UNITS[] (§232): a pillars FUNCTION archives
       through this same path — the import's replace, Start fresh, and now
       removing a pillar — and its archive is keyed `fn:<key>`, which UNITS
       cannot resolve. Every one of those archives was un-restorable: the
       row said "cannot be restored" for a function still on the platform.
       The view's arrays are ASSIGNED here, so the fn side needs the write
       back — builderStartFresh()'s own pair (§129). */
    var u = unitLikeWritable(a.key);
    if (!u) return false;
    archiveUnitPlan(u, "replaced by restoring the " + a.at + " archive");
    var s = a.plan;
    u.clauses = clone(s.clauses); u.aspiration = s.aspiration; u.endInMind = s.endInMind;
    u.keyObjectives = clone(s.keyObjectives); u.swot = clone(s.swot); u.items = clone(s.items);
    renumberUnit(u);
    var restFk = fnKeyOfTarget(a.key);
    if (restFk) fnWriteBack(restFk, u);
  } else {
    var c = capById(a.key);
    if (!c) return false;
    archiveCapPlan(c, "replaced by restoring the " + a.at + " archive");
    c.def = a.plan.def;
    c.keyObjectives = clone(a.plan.keyObjectives);
    c.projects = clone(a.plan.projects);
    renumberCapability(c);
  }
  ARCHIVES = ARCHIVES.filter(function(x){ return x.id !== id; });
  window.ARCHIVES = ARCHIVES;
  return true;
}

function forgetArchive(id){
  ARCHIVES = ARCHIVES.filter(function(x){ return x.id !== id; });
  window.ARCHIVES = ARCHIVES;
}

/* Emptying a unit so a plan can be loaded fresh. The unit itself survives \u2014
   its name, code, roles and weight are configuration, not plan content. What
   goes is everything a plan template carries, which is exactly what a fresh
   upload will put back. */
/* A theme's code is what every pillar points at. Renaming it has to carry the
   pillars with it, or they silently detach and stop appearing under any theme
   \u2014 the same failure the unit-name rename had before keys were introduced. */
function renameTheme(oldAb, newAb){
  if (!newAb || oldAb === newAb) return;
  UNIT_KEYS.forEach(function(k){
    UNITS[k].items.forEach(function(p){ if (p.theme === oldAb) p.theme = newAb; });
  });
}
function pillarsUsingTheme(ab){
  var n = 0;
  UNIT_KEYS.forEach(function(k){
    UNITS[k].items.forEach(function(p){ if (p.theme === ab) n++; });
  });
  return n;
}

/* Group capabilities carry their own reported figures rather than tactics, so
   clearing progress everywhere has to reach them too or the group page would
   still show numbers after every unit had been emptied. */
/* A new unit must be born with every list a page will read, or the first
   click into it crashes on a missing array. It arrives inactive-in-content
   but active in the nav, weighted at zero until the SMO fills its factor row,
   and with the group's clause labels as a starting skeleton. */
/* THE ONE MINTER FOR A UNIT (§129). It existed argless — "New unit 1", key
   "newunit1" — and the builder gives it the three answers a real unit
   arrives with: its name, its code prefix and its company. Three of its old
   habits are corrected in the same breath, each a §-numbered fault:
   · the key is minted from the NAME the way a function's and a person's are,
     so the graph does not fill with "newunit3"s (§87's spirit);
   · the weighting row's values are minted from the FACTOR LIST, never a
     hardcoded rev/prof/imp/growth — a tenant that renamed a factor got a row
     the composite could not read (§104.7's list-of-exceptions fault);
   · `real` is TRUE: that flag marks DEMO content as illustrative (§21), and
     a unit the SMO just created is the client's own. */
function addBusinessUnit(name, prefix, company){
  var nm = String(name || "").trim(), key;
  if (nm) {
    var base = nm.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 18);
    if (!base) base = "unit";
    key = base;
    var n2 = 2;
    while (UNITS[key]) { key = base + n2; n2++; }
  } else {
    var n = 1;
    do { key = "newunit" + n; nm = "New unit " + n; n++; } while (UNITS[key]);
  }
  UNITS[key] = {
    name: nm,
    codePrefix: (String(prefix || "").trim() || nm.replace(/[^A-Za-z0-9]/g, "").slice(0, 3) || "NU").toUpperCase(),
    weight: 0, real: true, active: true, ukey: key,
    company: company || null,
    clauses: GROUP.clauses.map(function(c, i){ return [c[0], "", key + "-F" + (i + 1)]; }),
    aspiration: "", endInMind: "",
    keyObjectives: [], swot: { s: [], w: [], o: [], t: [] }, items: []
  };
  UNIT_KEYS.push(key);
  UNIT_ROLES[key] = { head: null, custodian: null };
  var wrow = { key: key, unit: nm, why: "" };
  (GROUP.weighting.factors || []).forEach(function(f){ wrow[f.key] = 0; });
  GROUP.weighting.units.push(wrow);
  syncWeights();
  return key;
}

function clearGroupNumbers(){
  GROUP.capabilities.forEach(function(c){ c.perf = null; c.exec = null; });
  GROUP.keyObjectives.forEach(function(m){ m.actual = ""; m.progress = null; });
}
function clearAllNumbers(){ UNIT_KEYS.forEach(function(k){ clearUnitNumbers(UNITS[k]); }); clearGroupNumbers(); }
function clearAllPlans(why){ UNIT_KEYS.forEach(function(k){ clearUnitPlan(UNITS[k], why); }); }

/* ── CLEARING A PLAN ARCHIVES IT FIRST (§49.2) ───────────────────────
   An IMPORT that replaces a plan archived the outgoing one and offered a
   Restore; Clear plan destroyed the identical thing with no archive and no
   undo. Two routes to the same outcome, one of them reversible. They are the
   same act now, through the same function, and the confirmation says so. */
function clearUnitPlan(u, why){
  var archived = archiveUnitPlan(u, why);
  u.items = [];
  u.keyObjectives = [];
  u.swot = { s:[], w:[], o:[], t:[] };
  u.clauses.forEach(function(c){ c[1] = ""; });
  u.aspiration = "";
  u.endInMind = "";
  return archived;
}

/* ── CLEAR PROJECT: THE DEMO WITH NOTHING FILLED IN (§67) ─────────────
   Islam: "another demo data view … Filled Project & Clear Project. The new
   clear project is a project with the same setup but with no uploaded data at
   all, not plans no performance nothing — so I can explain for them the cycle
   there."

   WHAT IT IS: exactly what a client's own deployment looks like on day one.
   That is not a new idea — it is `db/migrations/004-clean-slate.sql`, which has
   run once on every tenant since §21, and this mirrors it statement for
   statement so the screen he shows and the screen they get are the same screen.

   SO THE RISK IS DRIFT, and it is the fault 004 has already been bitten by
   THREE times: §44's figure sets, §54's BU list and spec 010's function pillars
   each arrived somewhere the clean slate was not looking, and each had to be
   added afterwards. A second copy in JavaScript is a fourth place to forget.

   It cannot be avoided — 004 is SQL against thirty tables and this is a graph
   in a browser — so it is ASSERTED instead. `scripts/test-clean-parity.js`
   deploys to a real Postgres, reads back what 004 actually leaves, and compares
   it field by field with what this produces. The two disagreeing is a failing
   test, rather than a client being shown a screen that is not what they will
   get. THE COMMENT IS NOT THE GUARD; THE TEST IS.

   Operates on a GRAPH — the same shape sync.js hydrates from — rather than on
   the globals, so it is a pure function and the test can call it with nothing
   loaded. */
function clearedGraph(g){
  var out = clone(g);

  /* ── Business unit strategy ───────────────────────────────────────── */
  (out.unitKeys || []).forEach(function(k){
    var u = out.units[k]; if (!u) return;
    u.items = [];                 /* pillars, and with them measures + tactics */
    u.keyObjectives = [];
    u.swot = { s:[], w:[], o:[], t:[] };
    u.clauses = [];
    u.aspiration = ""; u.endInMind = "";
    u.real = true;                /* nothing left to mark as illustrative */
    if (u.extra) delete u.extra.perf;
    delete u.perf;
  });

  /* ── Group foundation ─────────────────────────────────────────────── */
  var G = out.group || {};
  G.clauses = []; G.keyObjectives = [];
  G.aspiration = ""; G.endInMind = ""; G.mission = "";
  G.values = [];
  G.horizon = "";
  delete G.portfolio; delete G.themeView; delete G.themePillars;
  delete G.keyObjectivesScore;
  /* §44's sets, §54's BU list — the two that 004 had to be amended for. */
  delete G.sets; delete G.claims; delete G.naming; delete G.mainbus;

  /* ── Capability content (the names and their function stay) ───────── */
  (G.capabilities || []).forEach(function(c){
    c.def = "";
    c.keyObjectives = [];
    c.projects = [];
  });

  /* ── The reporting cycle ──────────────────────────────────────────── */
  out.history = [];
  out.koWeights = {};
  out.cycle = { name:"", rewardAt:100, locked:false, focus:{} };
  out.review = { name:"", from:"", to:"", due:"", endsQuarter:4,
                 state:"closed", cadence:null, note:{}, submitted:{} };
  out.archives = [];

  /* ── People ───────────────────────────────────────────────────────── */
  out.people = (out.people || []).filter(function(p){ return p.key === "smo"; });
  out.unitRoles = {};
  (out.functionKeys || []).forEach(function(k){
    var f = out.functions[k]; if (!f) return;
    f.custodian = null;
    if (f.head !== "smo") f.head = null;
    /* spec 010's pillars, which rode in functions.extra where every DELETE
       above could not reach them — 004's third amendment. */
    delete f.items;
    if (f.extra) delete f.extra.items;
  });

  return out;
}

/* Clearing what was REPORTED, keeping what was COMMITTED TO. This is the start
   of a reporting cycle: the plan stands, the numbers go.

   Cleared means null, never zero. A measure with no actual is unreported, not
   a measure that achieved nothing, and a tactic reset to 0% would read as
   started-and-delivered-nothing rather than not-yet-reported. */
function clearUnitNumbers(u){
  u.keyObjectives.forEach(function(m){ m.actual = ""; m.progress = null; });
  u.items.forEach(function(p){
    p.measures.forEach(function(m){ m.actual = ""; m.progress = null; });
    p.tactics.forEach(function(t){ t.actual = null; t.status = "Not started"; });
  });
}

/* Capabilities never got ids. Every other item has one, which is how a row is
   addressed, reported against and matched on import \u2014 without them a
   capability could be rendered but not written to. Projects, and the three
   lists inside them, are addressed the same way. */
function renumberCapability(c){
  (c.keyObjectives || []).forEach(function(m, i){ m.id = c.id + "-KO" + (i + 1); });
  (c.projects || []).forEach(function(p, pi){
    p.id = c.id + "-P" + (pi + 1);
    p.capId = c.id;
    (p.deliverables || []).forEach(function(d, i){ d.id = p.id + "-D" + (i + 1); });
    (p.outcomes || []).forEach(function(o, i){ o.id = p.id + "-O" + (i + 1); });
    (p.milestones || []).forEach(function(m, i){ m.id = p.id + "-M" + (i + 1); });
  });
}
GROUP.capabilities.forEach(function(c, ci){
  c.id = "cap" + (ci + 1);
  renumberCapability(c);
});

/* ── Minting a capability (§51.11) ────────────────────────────────────────
   THE ONE PLACE A CAPABILITY IS BORN. There was an add button on the Temple
   page that pushed `{ name, def, measures:[], tactics:[] }` — the shape a
   capability had BEFORE §15 replaced measures and tactics with key objectives
   and projects. So the row it made had no id, no function, and neither of the
   two lists every reader expects, and the Capabilities Setup page threw
   `Cannot read properties of undefined` and rendered nothing at all. Adding a
   capability took the product down.

   §24's rule with the sign reversed: when a field is renamed, the code that
   CREATES it has to be found as well as the code that reads it. A reader that
   crashes is at least loud; a writer that mints the old shape is silent until
   somebody opens the page.

   The id must not collide with one already in use, so it is taken from the
   highest number in play rather than from the length — removing a capability
   and adding another would otherwise hand the newcomer a dead row's id. */
function addCapability(fnKey){
  var n = 0;
  GROUP.capabilities.forEach(function(c){
    var m = /^cap(\d+)$/.exec(String(c.id || ""));
    if (m) n = Math.max(n, +m[1]);
  });
  var made = { id:"cap" + (n + 1), name:"New capability", def:"",
               fn:fnKey || null, keyObjectives:[], projects:[] };
  GROUP.capabilities.push(made);
  renumberCapability(made);
  return made;
}
/* What removing one would destroy, in words, or "" when it is an empty row
   somebody added a moment ago. Read from the fields a capability ACTUALLY has
   — the old check read `measures` and `tactics` and threw on every real one,
   so the confirmation never appeared and the removal never happened. */
function capabilityHolds(c){
  if (!c) return "";
  var k = (c.keyObjectives || []).length, p = (c.projects || []).length;
  if (!k && !p) return "";
  return '"' + (c.name || "this capability") + '" with ' +
    plural(k, "key objective") + " and " + plural(p, "project") + " under it";
}

/* Address any row inside a capability by its id: a key objective, or a
   deliverable, outcome or milestone inside one of its projects. Reporting
   needs this to write an entry back — without it a figure could be typed and
   silently lost, which is what happened before the project model landed. */
/* Whether the Report section appears at all, and how loudly.

   Three states, and the middle one is the reason this is a function rather
   than a boolean. While the cycle is OPEN and unsubmitted it is gold: it is the
   only thing on the screen asking for something. Once SUBMITTED it stays, but
   quiet \u2014 somebody who has just sent figures to the SMO will want to see what
   they sent, and if the tab were gone there would be nowhere to look. Once the
   cycle is CLOSED there is genuinely nothing there, and it goes.

   Submission and closure look like one rule and are not: after submitting, the
   cycle is still live and the SMO may reopen it. */
function reportSectionState(){
  if (!REVIEW || REVIEW.state !== "open") return null;
  var submitted = !!(REVIEW.submitted && REVIEW.submitted[CURRENT_REPORT_KEY]);
  return submitted
    ? { cls:"quiet", badge:' <span class="pill good">Submitted</span>' }
    : { cls:"appear", badge:"" };
}
var CURRENT_REPORT_KEY = null;

function capItemById(id){
  var hit = null;
  GROUP.capabilities.forEach(function(c){
    (c.keyObjectives || []).forEach(function(m){ if (m.id === id) hit = { kind:"ko", obj:m, cap:c }; });
    (c.projects || []).forEach(function(p){
      (p.deliverables || []).forEach(function(d){ if (d.id === id) hit = { kind:"deliverable", obj:d, cap:c, proj:p }; });
      (p.outcomes || []).forEach(function(o){ if (o.id === id) hit = { kind:"outcome", obj:o, cap:c, proj:p }; });
      (p.milestones || []).forEach(function(m){ if (m.id === id) hit = { kind:"milestone", obj:m, cap:c, proj:p }; });
    });
  });
  return hit;
}
function capOfProjectId(id){
  var hit = null;
  GROUP.capabilities.forEach(function(c){
    (c.projects || []).forEach(function(p){ if (p.id === id) hit = c; });
  });
  return hit;
}

function findById(u, id){
  var hit = null;
  /* The aspiration is a single field on the unit rather than a row in a list,
     so it needs its own id or a round trip reports it as a new item. */
  if (id === u.ukey + "-ASP1") return { kind:"ASPIRATION", obj:u, which:"aspiration" };
  if (id === u.ukey + "-ASP2") return { kind:"ASPIRATION", obj:u, which:"end" };
  if (id === u.ukey + "-PLAN") return { kind:"PLAN", obj:u };
  var sw = id.match(/^(.+)-([SWOT])(\d+)$/);
  if (sw && sw[1] === u.ukey) {
    var key = { S:"s", W:"w", O:"o", T:"t" }[sw[2]];
    var arr = u.swot[key] || [];
    var idx = +sw[3] - 1;
    if (arr[idx] != null) return { kind:sw[2] === "S" ? "STRENGTH" : sw[2] === "W" ? "WEAKNESS" : sw[2] === "O" ? "OPPORTUNITY" : "THREAT",
                                   obj:{ name:arr[idx] }, swot:{ arr:arr, idx:idx } };
  }
  u.keyObjectives.forEach(function(m){ if (m.id === id) hit = { kind:"OBJECTIVE", obj:m }; });
  u.items.forEach(function(p){
    if (p.id === id) hit = { kind:"PILLAR", obj:p };
    p.measures.forEach(function(m){ if (m.id === id) hit = { kind:"MEASURE", obj:m, pillar:p }; });
    p.tactics.forEach(function(t){ if (t.id === id) hit = { kind:"TACTIC", obj:t, pillar:p }; });
  });
  u.clauses.forEach(function(c){ if (c[2] === id) hit = { kind:"FOUNDATION", obj:c }; });
  return hit;
}
function activeUnits(){ return UNIT_KEYS.filter(function(k){ return UNITS[k].active; }); }

/* A unit's headline is its Key Objectives, optionally weighted. Equal weight
   is the default nobody has to defend. */
function unitObjectives(u){ return koScore(u.keyObjectives, KO_WEIGHTS[u.ukey]); }

/* The group's own scorecard, on the same footing as a unit's: computed from
   the objectives that are actually there, never read from a stored number
   (§5.1). It was a field on GROUP until 2026-08-20 — which agreed with the
   mean while the demo data was the only data, and read "undefined%" the moment
   a tenant had no objectives of its own. Unweighted: weights are a per-unit
   mechanism, and the group has never had a row in the weight table. */
function groupKeyObjectives(){ return koScore(GROUP.keyObjectives); }

/* Themes aggregate from the pillars that actually carry them, across every
   unit — derived rather than a hand-kept list, which is how the earlier
   prototype ended up with a theme table that no longer matched its pillars. */
function themePillars(ab){
  var out = [];
  UNIT_KEYS.forEach(function(k){
    UNITS[k].items.forEach(function(it, i){
      if (it.theme === ab) out.push({ unit: UNITS[k].name, ukey: k, code: pillarCode(UNITS[k], i), it: it });
    });
  });
  return out;
}
function themeStats(ab){
  var list = themePillars(ab);
  return {
    list: list,
    units: list.map(function(x){ return x.unit; }).filter(function(v,i,a){ return a.indexOf(v)===i; }),
    perf: avg(list.map(function(x){ return pillarPerf(x.it); })),
    exec: avg(list.map(function(x){ return pillarExec(x.it); })),
    plan: avg(list.map(function(x){ return pillarPlan(x.it); }))
  };
}

/* Retirement means retirement everywhere. One helper decides which units the
   product is currently about; the nav, the cards, the compile and the
   weighting all ask it, so a retired unit cannot linger in one of them. */
function activeKeys(){
  return UNIT_KEYS.filter(function(k){ return UNITS[k].active !== false; });
}

/* ── THE UNITS NOBODY IS KEEPING (§93.4) ──────────────────────────────
   Islam: "I want as well to leave a note somewhere by how many units that
   doesn't have custodians."

   It belongs on the register, because the register is where the gap is CLOSED:
   a custodian is given from a row here, so a count anywhere else would name a
   problem and point at a different page.

   A RETIRED PERSON IS NOT A CUSTODIAN. The seat is a key on the unit and
   retiring somebody revokes their roles (§35) — but the pointer is still
   written, so asking whether the field is empty would report a unit as covered
   by somebody who cannot sign in. It asks whether a person is there AND
   active, which is the same test `personRoles()` applies from the other end. */
function unitsWithoutCustodian(){
  return activeKeys().filter(function(k){
    var c = ((UNIT_ROLES[k] || {}).custodian) || null;
    var p = c ? personBy(c) : null;
    return !p || !personActive(p);
  });
}

/* ── COMPILING A SET OF UNITS (§68) ───────────────────────────────────
   The four functions below hard-coded UNIT_KEYS, which was right while the
   group was the only thing compiled from units. A company is the same maths
   over a smaller list (Islam, asked and answered): each unit's figure weighted
   by the weight it already carries, RE-NORMALISED so the company's own units
   sum to 100% — which is what dividing by the total of those weights does, and
   is why the group's version needs no change to become general.

   Equal weight was the alternative and it contradicts the Weighting tab: a
   unit counting for 4% of the group would count the same as one counting for
   30%. A second weighting table per company was the other, and nobody has
   asked for two sources of weight that can disagree. */
function weightedOver(keys, of){
  var acc = 0, tot = 0;
  (keys || []).forEach(function(k){
    var u = UNITS[k]; if (!u) return;
    var v = of(u);
    if (v == null) return;
    acc += v * u.weight; tot += u.weight;
  });
  return tot ? Math.round(acc / tot) : null;
}
function groupUnitsObjectives(){ return weightedOver(UNIT_KEYS, unitObjectives); }
/* NULL IS NEVER ZERO (§5.7), and it is never NaN either.

   A tenant with no tactics loaded has nothing delivered and nothing planned,
   so both of these were dividing by a total of zero and groupRatio was doing
   0/0. Math.round(NaN) is NaN, and the group's own front page - the first
   screen anyone opens - read "NaN%" under a "No data" chip, above the words
   "Delivered 0% against 0% planned". Every clean slate showed it; the demo
   dataset never did, which is why it survived to production.

   The honest answer when there is no plan is not zero and not a stack of
   letters: it is nothing, and the card already knows how to say that -
   drillCard renders null as "Not yet measurable", which is what the two cards
   beside it were doing correctly all along. splitCard had the same guard for
   the same reason; this is that guard, one level up. */
function groupExec(){ return weightedOver(UNIT_KEYS, unitExec); }
function groupPlan(){ return weightedOver(UNIT_KEYS, unitPlan); }
function ratioOf(e, p){ return (e == null || !p) ? null : Math.round(e / p * 100); }
function groupRatio(){ return ratioOf(groupExec(), groupPlan()); }

/* A COMPANY'S OWN READING (§68). Islam: "we will need to add a Companies
   performance page that includes the overall performance of the company and
   the general view of the units belonging to them."

   THIS REVERSES §23's "no score, no page", and only that half of it: a company
   still carries no strategy of its own — no plan, no objectives, no foundation.
   What it has is a reading of the units it holds, which is a different claim
   and the one he asked for. Its ACTIVE units only, the same as everywhere
   else: a retired unit keeps its record and stops appearing. */
function companyUnitKeys(ck){
  return unitsOfCompany(ck).filter(function(k){ return UNITS[k].active !== false; });
}
function companyObjectives(ck){ return weightedOver(companyUnitKeys(ck), unitObjectives); }
function companyExec(ck){ return weightedOver(companyUnitKeys(ck), unitExec); }
function companyPlan(ck){ return weightedOver(companyUnitKeys(ck), unitPlan); }
function companyRatio(ck){ return ratioOf(companyExec(ck), companyPlan(ck)); }
/* What share of the GROUP this company is, which is the one number that only
   makes sense at this level — the re-normalised figures above deliberately
   forget it. */
function companyWeight(ck){
  return companyUnitKeys(ck).reduce(function(n, k){ return n + (UNITS[k].weight || 0); }, 0);
}
/* The companies somebody may open, in the order they are declared. */
function companiesReachable(){
  return activeCompanyKeys().filter(function(ck){
    return grantAt("g_perf", "co:" + ck) !== "none" && companyUnitKeys(ck).length;
  });
}
