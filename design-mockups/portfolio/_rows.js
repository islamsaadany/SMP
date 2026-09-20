/* ── THE PLAN, ONCE, FOR ALL THREE DRAWINGS ─────────────────────────────────
   Spec 056 §5.2: two screens of one project that disagree is the fault this
   spec spends its length on, and §9.8 is the record of it happening — two
   figures typed onto the charter, both wrong.

   The plan drawing, Progress and Analytics all read these rows. They are
   SPLICED into each file by `sync-rows.py` rather than copied by hand, because
   three hand-kept copies is the same fault wearing a tidier coat. Edit this
   file and run the script; never edit the block inside an HTML file.

   A row's fields, and which drawing reads each:
     lvl      0 phase · 1 work package · 2 activity      all three
     n, t     number and name                            all three
     who      the assignee, "" for nobody                all three
     s, e     planned start and end                      all three
     st       done · wip · not · sign                    plan, progress
     pct      0–100, activities only; phases derive      plan, analytics
     ms       a milestone — a commitment, not a task     plan, analytics
     ran      when the work actually finished, or was
              marked done and is awaiting sign-off       plan (overrun), progress
     off      when a Lead signed it off. ABSENT until
              they do, which is what makes "marked done"
              and "completed" two different things       progress, analytics
     dep      the one activity that must finish first    plan
     blocked  its dependency has not finished            plan, progress
     pick     the row the plan drawing opens on          plan

   SIX MILESTONES ON NINE ACTIVITIES IS NOT A REALISTIC PLAN and is deliberate:
   there is one in every state the tracker can draw, so all six are visible at
   once (§255 — a drawing that cannot show the state it is about proves
   nothing). A real project has far fewer.
   ────────────────────────────────────────────────────────────────────────── */
  var TODAY = "2026-03-10", FROM = "2026-01-01", TO = "2026-08-31";
  var ROWS = [
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
  ];
