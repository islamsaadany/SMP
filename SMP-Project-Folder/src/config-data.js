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
var KO_VIEW = "chips";

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

var ADDROLE = null, ADDROLE_KIND = "owner", NEWPERSON = "";
/* The same treatment for the BU list's add row, and for the same reason:
   held in a global rather than read off the input at submit time, because
   the repaint any other change causes would otherwise throw away what is
   half typed. */
var NEWMAINBU = "";
/* Which row's action menu is open, by person key (§46.4). ONE key, not a flag
   per row: two menus open at once is a state nobody wants and one that has to
   be closed twice. */
var PMENU = null;
/* Which person the delete confirmation is open for (§69). Its own key rather
   than a mode on PMENU: the confirmation REPLACES the menu in the same place,
   so the second press lands where the first one did — the same shape the
   clear-plan confirmation already uses (§46.2). */
var PDEL = null;
/* Which person's extra roles are unfolded, and which header menu is open.
   Single keys for the same reason PMENU is: two open at once is a state that
   has to be closed twice. */
var PROLES = null;
/* The cycle being described, before it is opened (§47.8). Null when the panel
   is closed. It is NOT the live REVIEW: nothing is replaced until the SMO
   presses Open, or a half-filled form would already have closed the cycle it
   was going to succeed. */
var NEWCYCLE = null;
var PCOLMENU = false, PWMENU = false;
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

function personName(key){
  var p = PEOPLE.filter(function(x){ return x.key === key; })[0];
  return p ? p.name : null;
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
function personBy(key){
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

/* The employee number, matched the way the file will spell it: trimmed, and
   compared as text because a leading zero is part of an employee number and
   102347 read as a number is not the same string as 0102347. */
function personByEmpId(id){
  var want = String(id == null ? "" : id).trim();
  if (!want) return null;
  return PEOPLE.filter(function(p){
    return String(p.empId == null ? "" : p.empId).trim() === want;
  })[0] || null;
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

function unitRolesFor(k){
  if (!UNIT_ROLES[k]) UNIT_ROLES[k] = { head:null, custodian:null };
  return UNIT_ROLES[k];
}
function grantPersonRole(personKey, roleKey, where){
  var p = personBy(personKey);
  if (!p) return;
  var at = where || "group";
  if (roleKey === "super" || roleKey === "gceo") {
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
  if (roleKey === "super" || roleKey === "gceo" || roleKey === "cceo") {
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

/* Where a role can be attached, for the second half of the picker. A role
   whose scope is the group has exactly one answer, and the control says so
   rather than offering a list of one. */
function roleWheres(roleKey){
  if (roleKey === "super" || roleKey === "gceo") return [{ v:"group", label:"the group" }];
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
function personAtChoices(){
  var out = [{ v:"group", label:roleWhereLabel("group") }];
  UNIT_KEYS.forEach(function(k){
    if (UNITS[k].active !== false) out.push({ v:k, label:UNITS[k].name });
  });
  FUNCTION_KEYS.forEach(function(k){
    if (FUNCTIONS[k].active !== false)
      out.push({ v:"fn:" + k, label:FUNCTIONS[k].name + " (function)" });
  });
  activeCompanyKeys().forEach(function(c){
    out.push({ v:"co:" + c, label:COMPANIES[c].name + " (company)" });
  });
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
var PEOPLE_FILE_COLS = ["Emp ID", "Name", "Job title", "Email", "Mobile",
                        "Official BU", "Unit", "Role", "Status"];
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
   "Strategy custodian", never "custodian". */
function roleKeyByName(name){
  var want = fileTxt(name).toLowerCase();
  if (!want) return null;
  var hit = ROLES.filter(function(r){ return r.name.toLowerCase() === want; })[0];
  return hit ? hit.key : null;
}
/* Contributor is not granted and never has been: it is what personRoles()
   reads off somebody attached to a unit and holding nothing else (§49.5). A
   file naming it would be asking for a role that arrives by itself, so the
   template does not offer it and the reader says so plainly. */
function roleIsGrantable(key){ return !!key && !SMPRules.isOwnLinesRole(key); }

/* Reads the sheet against the stored world and says what would happen. It
   changes NOTHING — the review step exists so that an upload is looked at
   before it lands, exactly as a plan's is, and a reader that mutated on the
   way past would make the review a report of what had already been done. */
function planPeopleFile(rows){
  var plan = { rows:[], problems:[], notices:[], newBus:[],
               added:0, updated:0, retired:0, restored:0, roles:0 };
  var seen = {};
  (rows || []).forEach(function(r, i){
    /* THE FILE'S OWN ROW NUMBER, not the index. Whoever fixes a problem is
       looking at Excel, where the header is row 1 and the first person is row
       2 — an off-by-one here sends them to the wrong line, which is worse than
       no line at all. */
    var at = "Row " + (i + 2);
    var id     = fileTxt(r["Emp ID"]);
    var name   = fileTxt(r["Name"]);
    var mainbu = fileTxt(fileBu(r));
    var role   = fileTxt(r["Role"]);
    var status = fileTxt(r["Status"]);
    var label  = name || id || "this row";

    if (!id) {
      plan.notices.push({ at:at, msg:'"' + label + '" has no employee number, so there is ' +
        'nothing to match them on. Left exactly as they are.' });
      return;
    }
    if (seen[id]) {
      plan.problems.push({ at:at, msg:'employee number ' + id + ' is used twice in this file — ' +
        'also on ' + seen[id] + '. One row per person.' });
      return;
    }
    seen[id] = at;

    var existing = personByEmpId(id);
    if (!existing && !name) {
      plan.problems.push({ at:at, msg:'employee number ' + id + ' is not on the register and the ' +
        'row has no name, so there is nobody to add.' });
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
      if (!roleIsGrantable(roleKey)) {
        plan.problems.push({ at:at, msg:'Contributor is not given — it is what somebody attached ' +
          'to a unit and holding nothing else already is. Leave Role blank.' });
        return;
      }
      var holdsIt = existing &&
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

    var row = { at:at, id:id, key:existing ? existing.key : null,
                name:name || (existing ? existing.name : ""),
                title:fileTxt(r["Job title"]), email:fileTxt(r["Email"]),
                phone:fileTxt(r["Mobile"]), mainbu:buName, where:where,
                role:roleKey, wantActive:wantActive, changes:[] };

    if (!existing) {
      row.action = "add";
      plan.added++;
      if (roleKey) plan.roles++;
      if (wantActive === false) plan.retired++;
    } else {
      row.action = "update";
      /* WHAT ACTUALLY MOVES, field by field. A review saying "31 people
         updated" when 31 rows came back unchanged from the download teaches
         whoever reads it to stop reading it. A blank cell is "nothing to say
         about this", never "clear it" — the file is an amendment, and an
         amendment that erased every field it left empty would empty the
         register on its first round trip. */
      var was = existing;
      var cmp = [["name", "name", row.name], ["title", "job title", row.title],
                 ["email", "email", row.email], ["phone", "mobile", row.phone]];
      cmp.forEach(function(c){
        if (c[2] && fileTxt(was[c[0]]) !== c[2]) row.changes.push(c[1]);
      });
      if (buName && mainbuKey(was.mainbu) !== mainbuKey(buName)) row.changes.push("official BU");
      /* The PLACE, which is the other column and the one that decides access.
         Reported separately or a review saying "BU" could mean either, and the
         two really can move independently. */
      if (where && personAt(was) !== where) row.changes.push("unit");
      if (roleKey) { row.changes.push("role"); plan.roles++; }
      if (wantActive === true  && !personActive(was)) { row.changes.push("restored"); plan.restored++; }
      if (wantActive === false &&  personActive(was)) { row.changes.push("retired");  plan.retired++; }
      if (row.changes.length) plan.updated++; else row.action = "same";
    }
    plan.rows.push(row);
  });
  return plan;
}

/* Applies what the plan says, in the one order that works: the department
   before the person, the person's attachment before their role (a role is
   held over their BU, so the BU has to be true first), and retiring LAST —
   retiring revokes roles, so a row that both granted one and retired the
   person would otherwise keep a role on somebody who cannot sign in. */
function applyPeopleFile(plan){
  plan.newBus.forEach(function(n){ addMainbu(n); });

  plan.rows.forEach(function(row){
    if (row.action === "same") return;
    var p = row.key ? personBy(row.key) : null;
    if (!p) {
      var key = addPerson({ name:row.name, title:row.title, phone:row.phone,
                            empId:row.id, email:row.email, mainbu:row.mainbu,
                            where:row.where });
      p = personBy(key);
      if (!p) return;
    } else {
      if (row.name)  p.name  = row.name;
      if (row.title) p.title = row.title;
      if (row.email) p.email = row.email;
      if (row.phone) p.phone = row.phone;
      p.empId = row.id;
      if (row.mainbu) p.mainbu = row.mainbu;
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

function isFocus(id){ return !!CYCLE.focus[id]; }
function toggleFocus(id){
  if (CYCLE.locked) return false;
  if (CYCLE.focus[id]) delete CYCLE.focus[id]; else CYCLE.focus[id] = true;
  return true;
}
function canMarkFocus(){
  var v = viewer();
  return !CYCLE.locked && (hasRole("super") || hasRole("gceo"));
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

/* Every marked item in a unit, objectives and pillar measures alike. */
function unitFocus(u){
  var out = [];
  u.keyObjectives.forEach(function(m){
    if (isFocus(m.id)) out.push({ m:m, src:L("keyobj","bu").toLowerCase() });
  });
  u.items.forEach(function(p, pi){
    p.measures.forEach(function(m){
      if (isFocus(m.id)) out.push({ m:m, src:pillarCode(u, pi) });
    });
  });
  return out;
}
function focusTally(u){
  var t = { over:0, met:0, short:0, none:0, total:0, mean:null };
  var vals = [];
  unitFocus(u).forEach(function(x){
    t.total++;
    t[focusStanding(x.m.progress).key]++;
    if (x.m.progress != null) vals.push(x.m.progress);
  });
  t.mean = avg(vals);
  return t;
}

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
  var list = (c.keyObjectives || []).filter(function(m){ return m.progress != null; });
  if (!list.length) return null;
  var tw = 0, sum = 0;
  list.forEach(function(m){ var w = m.weight == null ? 1 : m.weight; tw += w; sum += m.progress * w; });
  return tw ? Math.round(sum / tw) : null;
}

/* A deliverable reads 100 or 0 when it is delivered-or-not, and its own
   percentage when it is a percentage. Nothing reported is absent, not zero. */
function delivReads(d){
  if (d.actual == null || d.actual === "") return null;
  if (d.kind === "pct") return Math.max(0, Math.min(100, Number(d.actual)));
  return String(d.actual).toLowerCase() === "yes" ? 100 : 0;
}
function sideAvg(vals){
  var v = vals.filter(function(x){ return x != null && !isNaN(x); });
  if (!v.length) return null;
  return Math.round(v.reduce(function(a, b){ return a + b; }, 0) / v.length);
}
function projDeliverySide(p){
  return sideAvg((p.deliverables || []).map(delivReads));
}
function projOutcomeSide(p){
  return sideAvg((p.outcomes || []).map(function(o){ return o.progress; }));
}
function projPerf(p){
  var d = projDeliverySide(p), o = projOutcomeSide(p);
  if (d == null && o == null) return null;
  if (d == null) return o;
  if (o == null) return d;
  return Math.round(d * 0.5 + o * 0.5);
}
function projMilestones(p){
  var ms = p.milestones || [], done = 0, wip = 0, todo = 0;
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
function projOverruns(p){
  if (p.timeline !== "date" || !p.end) return [];
  var endT = Date.parse(p.end);
  if (isNaN(endT)) return [];
  return (p.milestones || []).filter(function(m){
    var t = Date.parse(m.finish);
    return !isNaN(t) && t > endT;
  });
}
function capPerf(c){
  return sideAvg((c.projects || []).map(projPerf));
}
function capExec(c){
  var done = 0, total = 0, wip = 0, todo = 0;
  (c.projects || []).forEach(function(p){
    var m = projMilestones(p);
    done += m.done; wip += m.wip; todo += m.todo; total += m.total;
  });
  return { done: done, wip: wip, todo: todo, total: total,
           pct: total ? Math.round(done / total * 100) : null };
}
function capDeliverySide(c){ return sideAvg((c.projects || []).map(projDeliverySide)); }
function capOutcomeSide(c){ return sideAvg((c.projects || []).map(projOutcomeSide)); }

/* What a capability asks for this cycle: its key objectives, plus everything in
   its projects whose time has come. An outcome measured at Q4 is not an empty
   box somebody forgot in Q2 \u2014 it is not asked. */
function outcomeDue(o){
  if (!o.measureAt) return true;
  var q = String(o.measureAt).match(/Q([1-4])\s*(\d{4})?/);
  if (!q) return true;
  var cq = String(REVIEW.name || "").match(/Q([1-4])\s*(\d{4})?/);
  if (!cq) return true;
  var oy = q[2] ? +q[2] : 0, cy = cq[2] ? +cq[2] : 0;
  if (oy && cy && oy !== cy) return oy < cy;
  return +q[1] <= +cq[1];
}
/* THERE IS NO delivDue(). A deliverable used to carry a quarter of its own,
   and one later than the cycle meant "not asked": a row the reporting page
   dimmed and the tally left out. Islam, 2026-08-23: a deliverable belongs to
   the project, and the project's end is when it is delivered. The column went
   (§53.4), and with nothing left to set there is nothing left to gate on — so
   the predicate went too, at all four of its call sites, rather than being
   left behind always answering true (§24). An OUTCOME still has one, because
   a measurement time is a real thing somebody chose. */
function projReported(p){
  var n = 0, total = 0;
  (p.deliverables || []).forEach(function(d){
    total++;
    if (d.actual != null && d.actual !== "") n++;
  });
  (p.outcomes || []).forEach(function(o){
    if (!outcomeDue(o)) return;
    total++;
    if (o.actual != null && o.actual !== "") n++;
  });
  (p.milestones || []).forEach(function(m){
    total++;
    if (m.status) n++;
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
/* Has this function ever been part of a cycle. Submitted, noted, snapshotted
   or archived — any one of them makes it history. */
function fnEverReported(fk){
  var t = "fn:" + fk;
  if (REVIEW.submitted && REVIEW.submitted[t]) return true;
  if (REVIEW.note && REVIEW.note[t]) return true;
  if (REVIEW.slides && REVIEW.slides[t]) return true;
  if ((ARCHIVES || []).some(function(a){ return a.key === t; })) return true;
  /* A closed cycle carries a score per subject, and a score whose subject has
     been deleted is a column in the history with nothing behind it. */
  if ((HISTORY || []).some(function(h){ return h.units && h.units[t] != null; })) return true;
  var f = FUNCTIONS[fk];
  if (f) {
    var reported = fnItems(f).some(function(p){
      return (p.measures || []).some(function(m){ return m.actual !== "" && m.actual != null; }) ||
             (p.tactics  || []).some(function(x){ return x.actual != null; });
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
    (p.deliverables || []).forEach(function(d){ d.actual = null; d.note = ""; });
    (p.outcomes || []).forEach(function(o){ o.actual = null; o.progress = null; o.note = ""; });
    (p.milestones || []).forEach(function(m){ m.status = null; m.note = ""; });
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
  return REVIEW.state !== "open" || hasRole("super");
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
  if (CYCLE.locked && !hasRole("super")) return false;
  return grantAt("u_report", unitKey) === "edit";
}

/* ONE ROW, for the one role that is limited to its own. Everybody else whose
   grant reaches the unit reports all of it; a contributor reports the lines
   they are named on. The same two functions the server uses (spec 006 §7.2) —
   offering a field the server will refuse is the fault this is here to avoid. */
function canReportRow(unitKey, x){
  if (!canReport(unitKey)) return false;
  if (!SMPRules.onlyOwnLines(world(), viewer(), "unit", unitKey)) return true;
  return SMPRules.namedOn({ owner: x.owner, collaborators: x.collaborators }, viewer());
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

   A supporting function has no contributors to exclude — its reporting is the
   function's, whole — so its half is the two gates its reporting page already
   applies, asked here rather than restated there. */
function canSpeakFor(target){
  var t = String(target || "");
  if (t.indexOf("fn:") === 0) {
    return REVIEW.state === "open" && !(CYCLE.locked && !hasRole("super")) &&
           grantAt("k_report", t) === "edit";
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
  if (hasRole("super")) return canReport(unitKey);
  return who === viewer().key && REVIEW.state === "open" && !CYCLE.locked;
}
/* The note stays with the unit whatever the figure does. */
function canEnterNote(unitKey, x){
  var who = figureAssignee(x);
  if (who && !hasRole("super") && who === viewer().key &&
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
  u.keyObjectives.forEach(function(m){
    out.push({ id:m.id, obj:m, kind:"objective", group:L("keyobj","bu"), sub:"" });
  });
  u.items.forEach(function(p, pi){
    var head = pillarCode(u, pi) + " " + p.name;
    /* `owner` travels with the row so canReportRow() can answer without
       walking back up to the pillar. A MEASURE names nobody of its own, so it
       carries its pillar's owner — the nearest thing the data supports until
       a measure has an owner of its own. */
    p.measures.forEach(function(m){
      out.push({ id:m.id, obj:m, kind:"measure", group:head, sub:"", owner:p.owner });
    });
    p.tactics.forEach(function(t){
      out.push({ id:t.id, obj:t, kind:"tactic", group:head,
                 sub:spanLabel(t), asked:tacticDue(t),
                 owner:t.owner, collaborators:t.collaborators });
    });
  });
  return out;
}
function askedItems(u){
  return reportItems(u).filter(function(x){ return x.kind !== "tactic" || x.asked; });
}
function reportedCount(u){
  var a = askedItems(u), n = 0;
  a.forEach(function(x){
    var v = x.kind === "tactic" ? x.obj.actual : x.obj.actual;
    if (v != null && v !== "") n++;
  });
  return { done:n, total:a.length };
}
/* A note is required where a figure lands in the bottom two bands. A red
   number with no explanation is the thing a review meeting stalls on. */
function needsNote(x){
  var p = x.kind === "tactic" ? tacticRatio(x.obj) : x.obj.progress;
  if (p == null) return false;
  var k = bandOf(p).key;
  return (k === "bad" || k === "warn") && !(x.obj.note && x.obj.note.trim());
}
function missingNotes(u){ return askedItems(u).filter(needsNote); }
function unitState(u){
  if (REVIEW.submitted[u.ukey]) return { key:"done", label:"Submitted" };
  var c = reportedCount(u);
  if (!c.done) return { key:"late", label:"Not started" };
  return { key:"part", label:"In progress" };
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
function viewer(){
  var v = PEOPLE.filter(function(p){ return p.key === VIEWER; })[0];
  if (v) return v;
  if (!PEOPLE.length) return { key: VIEWER, name: "\u2014", title: "", level: "smo", unit: "group" };
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
   on a grant. */
function mayEditPlan(){
  return hasRole("super") && grant("u_plan") === "edit";
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

function koScore(list, weights){
  var vals = list.filter(function(m){ return !m.milestone && m.progress != null; });
  if (!vals.length) return null;
  if (!weights) {
    return Math.round(vals.reduce(function(a, m){ return a + m.progress; }, 0) / vals.length);
  }
  var tot = 0, acc = 0;
  list.forEach(function(m, i){
    if (m.milestone || m.progress == null) return;
    var w = weights[i] == null ? 0 : weights[i];
    acc += m.progress * w; tot += w;
  });
  return tot ? Math.round(acc / tot) : null;
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
  bands: [
    { key:"good", floor:85, label:"On track" },
    { key:"attn", floor:70, label:"Needs attention" },
    { key:"warn", floor:50, label:"At risk" },
    { key:"bad",  floor:0,  label:"Off track" }
  ]
};

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
function tacticPlanned(t){
  var q = quartersOf(t), total = 0, elapsed = 0;
  for (var i = 0; i < 4; i++) {
    if (!q[i]) continue;
    total++;
    if (i + 1 <= REVIEW.endsQuarter) elapsed++;
  }
  if (!total) return null;
  return Math.round(elapsed / total * 100);
}
/* A tactic whose quarters have not begun is not behind — it is not yet due,
   and averaging a zero into execution would say otherwise. */
function tacticDue(t){ return tacticPlanned(t) > 0; }
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
var KO_YEAR_KEY = "smp.ko.year";
var SHOW_KO_THIS_YEAR = (function(){
  try { return localStorage.getItem(KO_YEAR_KEY) === "1"; } catch (e) { return false; }
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
function fnWritable(fk){
  var f = FUNCTIONS[fk];
  if (!f || !fnPlansInPillars(f)) return null;
  if (!Array.isArray(f.items)) f.items = [];
  if (!Array.isArray(f.clauses)) f.clauses = [];
  if (!Array.isArray(f.keyObjectives)) f.keyObjectives = [];
  if (!f.swot || f.swot === FN_NO_SWOT) f.swot = { s:[], w:[], o:[], t:[] };
  return fnAsUnit(fk);
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

function scorableMeasures(p){ return (p.measures || []).filter(function(m){ return m.target && m.progress != null; }); }
function pillarPerf(p){
  return viaCarrier(p,
    function(){ return avg(scorableMeasures(p).map(function(m){ return m.progress; })); },
    function(f){ return avg(fnItems(f).map(pillarPerf)); });
}
function dueTactics(p){ return (p.tactics || []).filter(tacticDue); }
/* A tactic that is due but has nothing reported is not delivering zero \u2014 it is
   unreported, and averaging a zero would say the plan is failing. */
function reportedTactics(p){ return dueTactics(p).filter(function(t){ return t.actual != null; }); }
/* THE TWO SCORES PASS UP SEPARATELY AND STAY APART (Islam, asked). The child's
   measure performance becomes the pillar's performance and its execution
   becomes the pillar's execution — nothing is blended, so the parent's two
   headline numbers stay comparable across all of its pillars, the handed-over
   one included. `plan` travels with `exec` because the ratio between them is
   what "of plan" means; averaging a ratio of ratios would say something else. */
function pillarExec(p){
  return viaCarrier(p,
    function(){ return avg(reportedTactics(p).map(function(t){ return t.actual; })); },
    function(f){ return avg(fnItems(f).map(pillarExec)); });
}
function pillarPlan(p){
  return viaCarrier(p,
    function(){ return avg(reportedTactics(p).map(tacticPlanned)); },
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
    (p.tactics  || []).forEach(function(x){ if (x.actual != null) rep++; });
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
      (p.deliverables || []).forEach(function(x){ put(m, x, ["actual","note"]); });
      (p.outcomes    || []).forEach(function(x){ put(m, x, ["actual","progress","note"]); });
      (p.milestones  || []).forEach(function(x){ put(m, x, ["status","note"]); });
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
  (GROUP.capabilities || []).forEach(function(c){ clearCapability(c, "nums"); });
}

/* Everything a new cycle asks again: the units' figures, the group's, the
   capabilities', the notes beneath them, and who had submitted. */
function clearForNewCycle(){
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
    var u = UNITS[a.key];
    if (!u) return false;
    archiveUnitPlan(u, "replaced by restoring the " + a.at + " archive");
    var s = a.plan;
    u.clauses = clone(s.clauses); u.aspiration = s.aspiration; u.endInMind = s.endInMind;
    u.keyObjectives = clone(s.keyObjectives); u.swot = clone(s.swot); u.items = clone(s.items);
    renumberUnit(u);
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
function addBusinessUnit(){
  var n = 1, key, name;
  do { key = "newunit" + n; name = "New unit " + n; n++; } while (UNITS[key]);
  UNITS[key] = {
    name: name, codePrefix: "NU", weight: 0, real: false, active: true, ukey: key,
    clauses: GROUP.clauses.map(function(c, i){ return [c[0], "", key + "-F" + (i + 1)]; }),
    aspiration: "", endInMind: "",
    keyObjectives: [], swot: { s: [], w: [], o: [], t: [] }, items: []
  };
  UNIT_KEYS.push(key);
  UNIT_ROLES[key] = { head: null, custodian: null };
  GROUP.weighting.units.push({ key: key, unit: name, rev: 0, prof: 0, imp: 1, growth: 0,
    why: "" });
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
