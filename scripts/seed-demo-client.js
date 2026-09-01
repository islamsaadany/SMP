/* The Demo client's content (spec 024 §6.3).
   Run: DATABASE_URL=…  node scripts/seed-demo-client.js [--dry-run]

   Islam asked for a Demo client on the cards: somewhere real to practise, and
   somewhere to build a plan for a prospect. It is seeded from the worked
   example the product already carries (`db/seed-state.json`) with the company,
   the units, the people and every mention of them RENAMED to invented ones.

   REAL NUMBERS AGAINST A REAL CLIENT'S NAME IS THE ONE THING A DEMO MUST NOT
   BE, and the marks are the same fact: every unit in the example carries the
   client's own lockup as a PNG (§52), so the logos are DROPPED rather than
   renamed — there is nothing to rename a picture to.

   THE LAST STEP IS A REFUSAL, NOT A REPORT. A substitution pass that misses a
   string produces a file that looks perfect and names a real client in one
   sentence nobody scrolled to — §52.10's lesson, where a font subset MAPPED
   more characters than it DREW and shipped `B B` without complaining. So this
   scans the finished graph for every forbidden word and THROWS, naming the
   path it found it at.

   THE NAMES ARE CONTENT, NOT CODE. They live in one table below, drafted for
   Islam to approve; changing one is an edit here and a re-run, and nothing is
   shown to a client either way — Demo is its own schema and no client can
   reach it. */

const fs = require("fs");
const path = require("path");
const pg = require("pg");
const io = require("../lib/state-io.js");
const P = require("../lib/platform-io.js");

const CLIENT_KEY = "demo";

/* ── The invented world ──────────────────────────────────────────
   Longest first, because "Raya Trade" must be replaced before "Raya" or the
   short rule eats the long one and leaves " Trade" behind. */
const PLACES = [
  ["Raya Trade", "Meridian Group"],
  ["Raya Shop", "Meridian Shop"],
  ["Raya & i2", "Meridian & Nova"],
  ["Raya", "Meridian"],
  ["Mazaya", "B2B Online"],
  ["Consumer Electronics", "Home Electronics"],
  ["B2B Ecomm", "B2B Online"],
  ["IT Dist.", "IT Distribution"],
  ["Mobile", "Devices"],
  ["Care", "Customer Care"],
];

/* THE UNIT NAMES ARE THE SAME TABLE READ BY KEY, so a unit cannot end up
   called one thing and described as another (§53.5). */
const UNIT_NAMES = {
  mobile: "Devices", care: "Customer Care", it: "IT Distribution",
  b2becomm: "B2B Online", consumerelectronics: "Home Electronics",
};

/* The 33 people, by KEY — a name is never an identifier (§87), and two of
   these rows are placeholders whose "name" is a job description. The shape is
   kept (two words, one compound first name, one non-Egyptian pair for the
   Nigeria rows) because the register's own reader depends on it: §93.8's
   short-name guess, §81.1's clashing pair, §130.7's `nameRuns`. */
const PEOPLE = {
  smo: "Farida Anwar",         ceo: "Group CEO",            mobhead: "Bassem Haddad",
  loghead: "Wadih Srour",      rethead: "Sami Doura",       cfo: "Group CFO",
  b2bhead: "Lina Kassab",      cehead: "Fadi Aoun",         oshead: "Nabil Chami",
  cohead: "Fares Zeidan",      cahead: "Ghassan Tabet",     ithead: "Ziad Maroun",
  nghead: "Obinna Adeyemi",    own_mob: "Salma Chidiac",    own_ret: "Yasmin Turk",
  own_b2b: "Marwan Mansour",   own_ce: "Rana Sleiman",      own_os: "Hanan Trad",
  own_co: "Maya Bitar",        own_ca: "Layal Nader",       own_it: "Noura Ghanem",
  own_lg: "Zeina Abboud",      own_ng: "Chioma Balogun",    mrchead: "Dana Khoury",
  own_mrc: "Omar Sayegh",      fn_fin: "Abd El Rahman Wazir", fn_hr: "Reem Daher",
  fn_tre: "Basil Fakhry",      fn_mkt: "Nadine Chalhoub",   fn_mkt2: "Wissam Ghali",
  dir: "Elias Barakat",        co_dist: "Company CEO, Distribution",
  co_b2c: "Company CEO, B2C",
};

/* A PLAN NAMES PEOPLE WHO ARE NOT ON THE REGISTER — §130.1 measured it: 32 of
   the 78 tactics here are owned by a spelling that matches nobody. They are
   still real people, so they need invented names too, and there is no key to
   hang them on. This pool is drawn from in the order the graph first mentions
   them, so the result is the same every run. */
const SPARE = ["Hadi Nakhle", "Malak Tueni", "Rida Rahme", "Rita Achkar", "Jad Bustani",
               "Nayla Hitti", "Talal Nassif", "Rima Zoghbi", "Mira Ashkar", "Sana Debs",
               "Nabih Fattal", "Lara Hamdan", "Rody Antoun", "Sahar Massaad", "Nizar Chehab"];

/* Owner cells that are not a person at all. The plan puts a DEPARTMENT in this
   field where the line belongs to a team rather than a name (§130.1's
   `ownerChoices` offers exactly these), and one row carries a person KEY. They
   are left exactly as they are: renaming them would be inventing a fault. */
const NOT_A_PERSON = ["Finance", "IT", "Treasury", "HR", "Marketing", "Logistics",
                      "Group", "SMO", "fn_fin", "fn_hr", "fn_tre", "fn_mkt"];

const MAIL_DOMAIN = "meridian.example";

/* Anything that must not survive, whatever route it took. Checked
   case-insensitively against every string in the finished graph INCLUDING the
   ones this file wrote — a rename table with a typo in it would otherwise pass
   its own guard. */
const FORBIDDEN = ["raya", "mazaya", "rayatrade", "i2"];

/* ── Reading the real names out of the example ────────────────────
   Never typed out again here: a copy would drift the day somebody edits the
   seed, and typing thirty-three real names into a source file is the thing
   this script exists to avoid. */
function stringsAt(graph, want) {
  const out = [];
  (function walk(n) {
    if (Array.isArray(n)) return n.forEach(walk);
    if (n && typeof n === "object") {
      Object.keys(n).forEach(function (k) {
        const v = n[k];
        if (typeof v === "string") { if (want(k)) out.push(v.trim()); }
        else walk(v);
      });
    }
  })(graph);
  return out;
}

function realNames(seed) {
  const reg = (seed.people || []).map(function (p) { return p.name; });
  const owned = stringsAt(seed, function (k) { return k === "owner" || k === "collaborators"; })
    .join(",").split(/[,;]/);
  const all = reg.concat(owned).map(function (s) { return String(s || "").trim(); })
    .filter(function (s) { return s && NOT_A_PERSON.indexOf(s) < 0 && !/^(Group|Company) /.test(s); });
  return Array.from(new Set(all)).sort(function (a, b) { return b.length - a.length; });
}

/* ── The pass ────────────────────────────────────────────────── */

/* ONE SWEEP, NOT A SEQUENCE OF THEM. Applied one after another, a rule rewrites
   what the rule before it produced: `care -> Customer Care` then `Care ->
   Customer Care` gave "Customer Customer Care", and it read as plausible. One
   alternation consumes each position once, so nothing this pass writes can be
   read by it again. */
function sweeper(pairs) {
  const from = pairs.map(function (p) { return p[0]; })
    .sort(function (a, b) { return b.length - a.length; });
  if (!from.length) return function (s) { return s; };
  /* AND ON WORD BOUNDARIES, or a short spelling eats the middle of an
     ordinary word: "Mai" (a real person, and a label the plan owns lines by)
     turned the department "Maintenance" into "Zeinantenance", which is
     nonsense that renders perfectly. Lookarounds rather than \b, because some
     of these end in a full stop ("IT Dist.") and \b would then demand a letter
     after it. */
  const rx = new RegExp("(?<![A-Za-z])(?:" + from.map(function (w) {
    return w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("|") + ")(?![A-Za-z])", "g");
  const map = {};
  pairs.forEach(function (p) { map[p[0]] = p[1]; });
  return function (s) { return String(s).replace(rx, function (m) { return map[m]; }); };
}

function walk(node, fn) {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      if (typeof node[i] === "string") node[i] = fn(node[i]);
      else walk(node[i], fn);
    }
  } else if (node && typeof node === "object") {
    Object.keys(node).forEach(function (k) {
      if (typeof node[k] === "string") node[k] = fn(node[k]);
      else walk(node[k], fn);
    });
  }
}

function mailFor(name, key) {
  const words = String(name).toLowerCase().replace(/[^a-z ]/g, "").trim().split(/\s+/);
  const stem = words.length > 1 ? words[0] + "." + words[words.length - 1] : (words[0] || key);
  return stem + "@" + MAIL_DOMAIN;
}

/* A SHORT SPELLING MUST FOLLOW ITS PERSON. The plan owns lines by "Hossam" and
   by "Hossam Abuelenien" and both are one человек, so the map carries every
   leading run of the real name AND its last word, each pointing at the matching
   part of the invented one — the set of labels the register can show (§130.7).
   Without it the long form is renamed, the short one survives, and the demo
   names a real employee in the one column somebody reads down. */
function namePairs(real, invented) {
  const r = String(real).split(/\s+/), i = String(invented).split(/\s+/);
  const out = [[real, invented]];
  for (let n = 1; n < r.length; n++) {
    out.push([r.slice(0, n).join(" "), i.slice(0, Math.min(n, i.length)).join(" ")]);
  }
  if (r.length > 1) out.push([r[r.length - 1], i[i.length - 1]]);
  return out;
}

function demoGraph() {
  const seed = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "seed-state.json"), "utf8"));
  const real = realNames(seed);

  /* 1 · every real name gets an invented one — by KEY where the register
     knows the person, from the pool where the plan named somebody it never
     put on the register. */
  const invented = {};
  (seed.people || []).forEach(function (p) {
    if (!PEOPLE[p.key]) throw new Error("no invented name for person '" + p.key + "' — add one to PEOPLE");
    invented[p.name] = PEOPLE[p.key];
  });
  let spare = 0;
  real.forEach(function (n) {
    if (invented[n]) return;
    /* A short spelling of somebody the register DOES hold is that person, not
       a new one — resolved before the pool is reached, or two labels for one
       human become two strangers. */
    /* `endsWith`, NOT an indexOf compared against an arithmetic position: the
       first version read `full.indexOf(" " + n) === full.length - n.length - 1`,
       which is TRUE by accident whenever indexOf returns -1 and the arithmetic
       also lands on -1 — that is, for every register name exactly as long as
       the word. So "Abdelhamid" matched "Sara Helmy", was treated as a short
       spelling of somebody already covered, and went through the whole pass
       untouched. The refusal is what said so. */
    const owner = Object.keys(invented).filter(function (full) {
      return full !== n && (full.startsWith(n + " ") || full.endsWith(" " + n));
    })[0];
    if (owner) return;                       /* namePairs below covers it */
    if (spare >= SPARE.length) throw new Error("the spare-name pool is too small — add to SPARE");
    invented[n] = SPARE[spare++];
  });

  /* 2 · the pairs, places and people together, so ONE sweep does all of it. */
  let pairs = PLACES.slice();
  Object.keys(invented).forEach(function (n) {
    pairs = pairs.concat(namePairs(n, invented[n]));
  });
  /* A later pair may repeat an earlier key (two people sharing a first name).
     First wins, and it is stable because `real` is sorted longest-first. */
  const seen = {};
  pairs = pairs.filter(function (p) {
    if (p[0].length < 3 || seen[p[0]]) return false;
    seen[p[0]] = true; return true;
  });
  const sweep = sweeper(pairs);

  /* 3 · the marks go: a picture of a client's lockup cannot be made to say
     something else (§52). */
  Object.keys(seed.units || {}).forEach(function (k) {
    delete seed.units[k].logo;
    delete seed.units[k].navName;
  });

  walk(seed, sweep);

  /* 4 · and the unit names are set by KEY afterwards, so the table above is
     what decides them whatever the prose pass did. */
  Object.keys(seed.units || {}).forEach(function (k) {
    if (UNIT_NAMES[k]) seed.units[k].name = UNIT_NAMES[k];
  });
  (seed.people || []).forEach(function (p) {
    p.name = PEOPLE[p.key];
    /* AN ADDRESS IS HOW SOMEBODY SIGNS IN NOW (spec 024 §5), so a demo whose
       register has none cannot demonstrate the thing it exists to
       demonstrate. Nothing here is a platform account: these are register
       rows in the demo's own schema. */
    if (!p.email) p.email = mailFor(p.name, p.key);
  });
  seed.group.org = "Meridian Group";
  return seed;
}

/* ── The refusal (§52.10) ────────────────────────────────────────
   A substitution pass that misses a string produces a file that looks perfect
   and names a real client, or a real employee, in one sentence nobody scrolled
   to. So the last step throws rather than reports.

   IT LOOKS FOR WORDS, NOT ONLY FOR WHOLE NAMES, and that is the half the first
   version got wrong: it scanned for the register's 33 names and passed a graph
   whose tactic owners still read "Mohamed Rizk", "Ashraf Abdelaty" and
   "Abuelenien" — real people the register had never held (§130.1). Every word
   of every real name is forbidden on its own. */
function forbiddenWords(real) {
  const words = {};
  real.forEach(function (n) {
    String(n).split(/[^A-Za-z]+/).forEach(function (w) {
      if (w.length >= 3 && NOT_A_PERSON.indexOf(w) < 0) words[w.toLowerCase()] = n;
    });
  });
  FORBIDDEN.forEach(function (w) { words[w] = w; });
  return words;
}

function refuseIfAnySurvives(graph, real) {
  const words = forbiddenWords(real);
  const bad = [];
  (function scan(node, at) {
    if (Array.isArray(node)) node.forEach(function (v, i) { scan(v, at + "[" + i + "]"); });
    else if (node && typeof node === "object") Object.keys(node).forEach(function (k) { scan(node[k], at + "/" + k); });
    else if (typeof node === "string") {
      /* A PICTURE IS ITS OWN RULE. Every mark in the example is the client's
         own lockup (§52), so a demo carries none at all — and saying so here
         is better than what happened when it was left to the word scan, which
         did refuse the logos, by matching "eZe" inside a base64 blob. It
         caught the right thing for the wrong reason, and the same accident
         would refuse an innocent picture on a demo that was allowed one. */
      if (/^data:/.test(node)) {
        bad.push(at + " :: a picture survived (" + node.length + " characters) — " +
                 "a demo carries no mark of the client's");
        return;
      }
      String(node).split(/[^A-Za-z]+/).forEach(function (w) {
        const hit = words[w.toLowerCase()];
        if (hit) bad.push(at + " :: …" + node.slice(0, 90) + (node.length > 90 ? "…" : "") +
                          "   (" + w + ", from " + hit + ")");
      });
    }
  })(graph, "");
  if (bad.length) {
    throw new Error("the demo still names the client or a real person in " + bad.length +
                    " place(s):\n  " + bad.slice(0, 12).join("\n  ") +
                    (bad.length > 12 ? "\n  …and " + (bad.length - 12) + " more" : ""));
  }
}

async function main() {
  const dry = process.argv.indexOf("--dry-run") > -1;
  const real = realNames(JSON.parse(fs.readFileSync(
    path.join(__dirname, "..", "db", "seed-state.json"), "utf8")));
  const graph = demoGraph();
  refuseIfAnySurvives(graph, real);

  const units = Object.keys(graph.units || {}).length;
  const people = (graph.people || []).length;
  console.log("Demo content: " + graph.group.org + " · " + units + " units · " + people +
              " people · no marks, no real names.");
  if (dry) { console.log("--dry-run: nothing written."); return; }

  const row = await P.withPlatform(pg, function (c) { return P.clientByKey(c, CLIENT_KEY); });
  if (!row || !row.key) {
    throw new Error("there is no '" + CLIENT_KEY + "' client — create it on the platform first");
  }
  await P.withSchema(pg, row.schema_name, async function (c) {
    await io.ensureReady(c, row.schema_name, { seed: false, orgName: graph.group.org });
    await io.writeState(c, graph);
    const back = await io.readState(c);
    /* READ BACK AND CHECKED, because a write that half-landed is a demo with
       a plan and no people, and nothing would say so. */
    refuseIfAnySurvives(back, real);
    console.log("Written and read back: " + (back.group && back.group.org) + " · " +
                Object.keys(back.units || {}).length + " units · " +
                (back.people || []).length + " people.");
  });
  await P.getPool(pg).end();
}

/* REQUIRABLE, SO IT CAN BE ASKED WHAT IT WOULD WRITE without a database:
   checks/multi-client.py and the eye both need the renamed graph, and a
   script that can only be run cannot be inspected. */
module.exports = { demoGraph, refuseIfAnySurvives, realNames, CLIENT_KEY };

if (require.main === module) {
  main().catch(function (e) { console.error(e.message); process.exit(1); });
}
