/* ── THE CLIENT'S PROJECTS, ONCE, FOR ALL FOUR DRAWINGS ─────────────────────
   Spec 056 §5.2: two screens of one project that disagree is the fault this
   spec spends its length on, and §9.8 is the record of it happening — two
   figures typed onto the charter, both wrong.

   The plan, Progress, Analytics and the landing all read this. It is SPLICED
   into each file by `sync-rows.py` rather than copied by hand, because four
   hand-kept copies is the same fault wearing a tidier coat. Edit this file and
   run the script; never edit the block inside an HTML file.

   IT CARRIES THE ROLL-UP TOO, AND THAT IS THE POINT RATHER THAN TIDINESS: a
   phase percentage worked out two ways is exactly §5.2, so there is one
   `roll()` and every drawing calls it. It is a superset — the figure, the
   window, the status word and the done-of-total count — and each drawing reads
   what it needs.

   A row's fields, and which drawing reads each:
     lvl      0 phase · 1 work package · 2 activity      all four
     n, t     number and name                            all four
     who      the assignee, "" for nobody                all four
     s, e     planned start and end                      all four
     st       done · wip · not · sign                    plan, progress
     pct      0–100, activities only; phases derive      plan, analytics, landing
     ms       a milestone — a commitment, not a task     plan, analytics, landing
     ran      when the work actually finished, or was
              marked done and is awaiting sign-off       plan (overrun), progress
     off      when a Lead signed it off. ABSENT until
              they do, which is what makes "marked done"
              and "completed" two different things       progress, analytics, landing
     dep      the one activity that must finish first    plan
     blocked  its dependency has not finished            plan, progress
     pick     the row the plan drawing opens on          plan

   SIX MILESTONES ON NINE ACTIVITIES in the first project is not a realistic
   plan and is deliberate: there is one in every state the tracker can draw, so
   all six are visible at once (§255 — a drawing that cannot show the state it
   is about proves nothing). A real project has far fewer.

   THE FOUR PROJECTS AFTER THE FIRST EXIST FOR THE LANDING, so they are short
   plans rather than furniture: the landing derives every figure on every row
   from these rows, which is what stops a row disagreeing with the project
   behind it. One of them has NO PLAN AT ALL, deliberately — it is the state
   every project is in on its first day, and it is the one the landing is most
   likely to draw wrong.
   ────────────────────────────────────────────────────────────────────────── */
  var TODAY = "2026-03-10", FROM = "2026-01-01", TO = "2026-08-31";

  /* HOW MUCH WARNING A COMMITMENT GETS — the one number in the drawing set
     somebody chose rather than derived, so it is named once and both the
     Analytics page and the landing read it. The landing first wrote 30 while
     Analytics already had 14: two numbers for one idea, which is §5.2 arriving
     in a field instead of a row. It decides a COLOUR and never a word — the
     distance in days is always printed. */
  var SOON = 14;

  var PLAN = [
  { key:"culture", name:"Culture Transformation", lead:"Rania Mounir", rows:[
    {lvl:0, n:"1",     t:"Culture audit and stakeholder interviews",   who:"Rania Mounir"},
    {lvl:2, n:"1.1",   t:"Attribute survey across the ten units",      who:"Hend Sabry",   s:"2026-01-05", e:"2026-01-16", st:"done", pct:100, ran:"2026-01-16", off:"2026-01-16", by:"Rania Mounir"},
    {lvl:2, n:"1.2",   t:"Leadership interviews",                      who:"Rania Mounir", s:"2026-01-19", e:"2026-01-29", st:"done", pct:100, ms:true, ran:"2026-01-29", off:"2026-01-29", by:"Rania Mounir"},
    {lvl:0, n:"2",     t:"Strategy-alignment workshops and blueprint", who:"Rania Mounir"},
    {lvl:2, n:"2.1",   t:"Executive alignment workshop",               who:"Rania Mounir", s:"2026-02-02", e:"2026-02-06", st:"done", pct:100, ms:true, ran:"2026-02-11", off:"2026-02-11", by:"Rania Mounir"},
    {lvl:2, n:"2.2",   t:"Behavioural blueprint, first draft",         who:"Omar Tarek",   s:"2026-02-09", e:"2026-02-20", st:"sign", pct:100, ms:true, ran:"2026-02-24", dep:"2.1", pick:true},
    {lvl:2, n:"2.3",   t:"Blueprint review with the unit heads",       who:"Omar Tarek",   s:"2026-02-23", e:"2026-02-27", st:"not",  pct:0, ms:true, dep:"2.2", blocked:true},
    {lvl:0, n:"3",     t:"Company-wide activation and leadership rollout", who:"Hend Sabry"},
    {lvl:1, n:"3.1",   t:"Activation toolkit",                         who:"Hend Sabry"},
    {lvl:2, n:"3.1.1", t:"Leadership communication guide",             who:"Hend Sabry",   s:"2026-03-02", e:"2026-03-20", st:"wip",  pct:40, ms:true},
    {lvl:2, n:"3.1.2", t:"Employee engagement resources",              who:"",             s:"2026-03-23", e:"2026-04-10", st:"not",  pct:0},
    {lvl:1, n:"3.2",   t:"Leadership-led rollout",                     who:"Rania Mounir"},
    {lvl:2, n:"3.2.1", t:"Unit-by-unit activation sessions",           who:"",             s:"2026-04-01", e:"2026-07-31", st:"not",  pct:0},
    {lvl:2, n:"3.2.2", t:"Embed behaviours in the performance cycle",  who:"",             s:"2026-08-28", e:"2026-08-28", st:"not",  pct:0, ms:true}
  ]},

  { key:"opmodel", name:"Operating Model Redesign", lead:"Hend Sabry", rows:[
    {lvl:0, n:"1",   t:"Current-state assessment",                     who:"Hend Sabry"},
    {lvl:2, n:"1.1", t:"Process mapping across the ten units",         who:"Karim Fouad",  s:"2025-11-03", e:"2025-12-19", st:"done", pct:100, ran:"2025-12-19", off:"2025-12-19", by:"Hend Sabry"},
    {lvl:2, n:"1.2", t:"Spans and layers analysis",                    who:"Karim Fouad",  s:"2026-01-05", e:"2026-01-23", st:"done", pct:100, ms:true, ran:"2026-01-30", off:"2026-01-30", by:"Hend Sabry"},
    {lvl:0, n:"2",   t:"Target model design",                          who:"Hend Sabry"},
    {lvl:2, n:"2.1", t:"Design principles workshop",                   who:"Hend Sabry",   s:"2026-02-02", e:"2026-02-13", st:"done", pct:100, ms:true, ran:"2026-02-13", off:"2026-02-13", by:"Hend Sabry"},
    {lvl:2, n:"2.2", t:"Target structure, first cut",                  who:"Karim Fouad",  s:"2026-02-16", e:"2026-02-27", st:"wip",  pct:60},
    {lvl:2, n:"2.3", t:"Role and mandate definitions",                 who:"Karim Fouad",  s:"2026-03-02", e:"2026-03-27", st:"not",  pct:0},
    {lvl:2, n:"2.4", t:"Governance and decision rights",               who:"Hend Sabry",   s:"2026-03-02", e:"2026-03-13", st:"sign", pct:100, ran:"2026-03-09"},
    {lvl:0, n:"3",   t:"Transition planning",                          who:"Hend Sabry"},
    {lvl:2, n:"3.1", t:"Migration sequencing",                         who:"",             s:"2026-04-01", e:"2026-05-29", st:"not",  pct:0, ms:true},
    {lvl:2, n:"3.2", t:"Change and communication plan",                who:"",             s:"2026-06-01", e:"2026-07-31", st:"not",  pct:0}
  ]},

  { key:"digital", name:"Digital Commerce Launch", lead:"Mona Rashad", rows:[
    {lvl:0, n:"1",   t:"Platform selection",                           who:"Mona Rashad"},
    {lvl:2, n:"1.1", t:"Requirements and vendor longlist",             who:"Mona Rashad",  s:"2026-03-02", e:"2026-03-20", st:"wip",  pct:55},
    {lvl:2, n:"1.2", t:"Vendor demonstrations",                        who:"Omar Tarek",   s:"2026-03-23", e:"2026-04-10", st:"not",  pct:0, ms:true},
    {lvl:0, n:"2",   t:"Build and integrate",                          who:"Mona Rashad"},
    {lvl:2, n:"2.1", t:"Catalogue and pricing integration",            who:"",             s:"2026-04-13", e:"2026-07-31", st:"not",  pct:0},
    {lvl:2, n:"2.2", t:"Go live in two units",                         who:"",             s:"2026-09-01", e:"2026-09-30", st:"not",  pct:0, ms:true}
  ]},

  { key:"sales", name:"Sales Capability Build", lead:"Mona Rashad", rows:[
    /* NOTHING. A charter filled in and no plan yet is what EVERY project looks
       like on its first day, and a card reading 0% over "0 of 0 activities"
       reads as a broken card rather than a new project (§45.2) — so the landing
       has to be drawn with one in it (§255). */
  ]},

  { key:"procure", name:"Procurement Cost Programme", lead:"Rania Mounir", rows:[
    {lvl:0, n:"1",   t:"Spend analysis",                               who:"Rania Mounir"},
    {lvl:2, n:"1.1", t:"Spend cube and category tree",                 who:"Nadia Halim",  s:"2026-01-05", e:"2026-01-30", st:"done", pct:100, ran:"2026-01-30", off:"2026-01-30", by:"Rania Mounir"},
    {lvl:2, n:"1.2", t:"Savings opportunity sizing",                   who:"Nadia Halim",  s:"2026-02-02", e:"2026-02-20", st:"done", pct:100, ms:true, ran:"2026-02-18", off:"2026-02-18", by:"Rania Mounir"},
    {lvl:0, n:"2",   t:"Negotiation and award",                        who:"Rania Mounir"},
    {lvl:2, n:"2.1", t:"Supplier negotiations, top ten categories",    who:"Nadia Halim",  s:"2026-02-23", e:"2026-03-06", st:"done", pct:100, ms:true, ran:"2026-03-06", off:"2026-03-06", by:"Rania Mounir"}
  ]}
  ];

  /* the three project drawings are all about the first one */
  var ROWS = PLAN[0].rows;

  /* ── the roll-up, one level at a time, and the ONE copy of it ──────────────
     An activity's figure comes from its sub-activities; a phase's from its
     activities; a project's from its phases. Equal weights unless somebody
     sets them — this platform's own shape at every level above an activity
     (§9.8). Nothing is stored: the reference's two columns for this are never
     written, and its own analytics derives it too. */
  var DAY = 864e5;
  function d(s){ return new Date(s + "T00:00:00Z").getTime(); }

  function kids(rows, i){
    var lvl = rows[i].lvl, out = [], j;
    for (j = i + 1; j < rows.length && rows[j].lvl > lvl; j++){
      if (rows[j].lvl === lvl + 1) out.push(j);
    }
    if (!out.length){
      for (j = i + 1; j < rows.length && rows[j].lvl > lvl; j++) out.push(j);
    }
    return out;
  }

  function roll(rows){
    for (var i = rows.length - 1; i >= 0; i--){
      var r = rows[i];
      if (r.lvl === 2) continue;
      var ks = kids(rows, i).map(function(j){ return rows[j]; });
      r.pct = Math.round(ks.reduce(function(a,x){ return a + (x.pct || 0); }, 0) / ks.length);
      r.s = ks.reduce(function(a,x){ return !a || d(x.s) < d(a) ? x.s : a; }, null);
      r.e = ks.reduce(function(a,x){ return !a || d(x.e) > d(a) ? x.e : a; }, null);
      r.st = r.pct === 100 ? "done" : r.pct > 0 ? "wip" : "not";
      /* how many of the activities underneath are finished */
      var acts = [], j;
      for (j = i + 1; j < rows.length && rows[j].lvl > r.lvl; j++){
        if (rows[j].lvl === 2) acts.push(rows[j]);
      }
      r.total = acts.length;
      r.done = acts.filter(function(x){ return x.pct === 100; }).length;
    }
    return rows;
  }

  PLAN.forEach(function(p){ roll(p.rows); });
