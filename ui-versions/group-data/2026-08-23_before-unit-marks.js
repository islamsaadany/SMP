/* ── Data. Plan content for Mobile is transcribed from the Raya deck.
   Retail and Mazaya are invented so the shape can be judged. All reported
   actuals throughout are illustrative. ───────────────────────────────── */

var GROUP = {
  /* The three-year horizon is a field on the strategy, not words inside an
     aspiration. Changing it is one edit, not a rewrite of every unit. */
  /* The organisation's own name. It was written into the page title and the
     footer as literal text, so a second screen that needed it \u2014 the deck cover
     \u2014 had nowhere to read it from. */
  org: "Raya Trade",
  horizon: "2029",
  /* ── The worked example has a figure set (spec 008) ────────────────
     Added 2026-08-22, at Islam's request: the demo shipped with no sets at
     all, so none of the Finance-entry behaviour could be SEEN — the chip on a
     sourced number, the chase note above a unit's report, and the "Figures I
     report" page all render nothing where there is nothing to render, and a
     feature that renders nothing looks like a feature that was not built.

     ONE set, and it claims the money. That is the argument the feature is for:
     revenue and margin exist in Finance before a unit is asked for them, and
     what separates a team's number from the unit's is WHAT IT IS MEASURED IN,
     not what it is called (§16.7a). Every figure whose target is in EGP is in
     it — 44 of them, across every unit — which is why membership lives on the
     figure rather than being listed here.

     `pick: "owner"` deliberately, and it is the security setting (§44): the
     demo is where you show somebody that ticking from the full list is
     reading every number in the group, and you cannot show that with a set
     only the SMO can open. This is the EXAMPLE dataset; the client's own
     tenant starts with no sets and defaults to the SMO. */
  sets: [
    { id: "financialfigures", name: "Financial Figures", team: "finance",
      owner: "fn_fin", pick: "owner" }
  ],
  claims: [],
  /* The review point. H1 means Q1 and Q2 have passed. */
  asOfQuarter: 2,
  aspiration: "To be the most trusted & diversified provider for mobile, consumer electronics, IT products & logistics services in Egypt & Nigeria, delivering innovative offerings and unmatched service excellence that enrich lives, empower businesses, and drive regional growth.",
  /* The group states one aspiration and no end in mind. Not every foundation
     carries both. */
  endInMind: "",
  mission: "To empower our partners and customers with reliable, accessible, and efficient solutions & services across diverse channels through a seamless distribution & logistical network with solid financial infrastructure and exceptional customer experience, fostering trust, innovation & mutual growth.",
  values: [
    { name: "Respect for People",
      def: "An empathetic employee with a socially positive attitude." },
    { name: "Teamwork",
      def: "A key team player who portrays a collaborative mindset and adopts a culture of synergy." },
    { name: "Excellence",
      def: "A proactive, self-developing employee who surpasses expectations and objectives." },
    { name: "Customer Focus",
      def: "A customer-centric employee with an aptitude for business sustainability." }
  ],
  clauses: [
    ["We are", "a diversified holding trade company"],
    ["Offering", "comprehensive (value added) distribution, retail, care, e-commerce for consumer electronics, IT products, and services in addition to logistics services for diverse sizes of packages"],
    ["To", "vendors, retail channels, independent sellers, large enterprises, government sectors, e-commerce platforms and individuals"],
    ["Through", "a seamless network of distribution channels, physical retail locations, e-commerce platforms, logistics hubs, and a dedicated sales force"],
    ["Covering", "all over Egypt and Nigeria"],
    ["Empowered by", "a diversified portfolio, economy of scale, extensive reach, exceptional customer experience, and premium after-sales support (owning the value chain)"]
  ],
  keyObjectives: [
    { name: "Revenue",                group: null,           dir: "≥", target3y: "34B EGP", target: "18B EGP", compile: "Sum",    actual: "7.8B",  progress: 43 },
    { name: "EBITDA",                 group: null,           dir: "≥", target3y: "8.5%", target: "6.5%",    compile: "Latest", actual: "5.1%",  progress: 78 },
    { name: "Earnings concentration", group: null,           dir: "≤", target3y: "30%", target: "40%",     compile: "Latest", actual: "46%",   progress: 87 },
    { name: "Mobile Distribution",    group: "Market share", dir: "≥", target3y: "38%", target: "32%",     compile: "Latest", actual: "28%",   progress: 88 },
    { name: "CE Distribution",        group: "Market share", dir: "≥", target3y: "24%", target: "18%",     compile: "Latest", actual: "14%",   progress: 78 },
    { name: "Retail",                 group: "Market share", dir: "≥", target3y: "18%", target: "12%",     compile: "Latest", actual: "9%",    progress: 75 }
  ],
  themes: [
    { ab: "OT",  name: "One Trade",          note: "New for 2026" },
    { ab: "VC",  name: "Deepen Value Chain", note: "Standing" },
    { ab: "DIV", name: "Diversification",    note: "Standing" }
  ],
  /* A capability carries, at most, three things.

     KEY OBJECTIVES are optional. Some capabilities have interrelated projects
     serving one number at the top; others are a portfolio of unrelated work and
     have none. Where they are absent the card is hidden, never shown at zero.
     They weight exactly as a unit's do.

     PROJECTS are the work. Each carries a brief, its stakeholders, its
     DELIVERABLES (what it hands over) and its OUTCOMES (what changed because of
     it) — the two halves of its performance, half the weight each — and its
     MILESTONES, which are its execution and nothing else.

     An outcome names when it will be measured. Before that time it reads blank,
     never zero: 40 hours a month cannot be saved by a form that does not exist
     yet, and a zero there would be a lie about the project rather than a fact
     about it.

     Vocabulary note. "Key objectives" is deliberately the same word a business
     unit uses — it is the same idea. Everything below it changes word because it
     changes nature: projects not pillars, outcomes and deliverables not key
     measures, milestones not tactics. */
  capabilities: [
    { name: "Operational Excellence",
      def: "Run the core trading engine so reliably that scale stops costing us margin.",
      keyObjectives: [
        { name: "Process cycle time", dir: "≤", target: "12 d", compile: "Latest", actual: "15 d", progress: 80, weight: 40 },
        { name: "Cost-to-serve", dir: "≤", target: "4.2%", compile: "Latest", actual: "5.6%", progress: 75, weight: 60 }
      ],
      projects: [
        { name: "Standardise the core order process across units", owner: "Ashraf Abdelaty",
          brief: "One order process across Mobile, Retail and Mazaya, so a unit's cycle time stops depending on which system it grew up on.",
          stakeholders: ["Operations", "IT"], timeline: "quarter", start: "Q1 2026", end: "Q4 2026",
          deliverables: [
            { name: "Single documented order process", kind: "binary", due: "Q2", owner: "Ashraf Abdelaty", actual: "yes" },
            { name: "Unit-by-unit gap assessment", kind: "binary", due: "Q2", owner: "Hala", actual: "yes" },
            { name: "Process rolled out across the three units", kind: "pct", due: "Q4", owner: "Ashraf Abdelaty", actual: 55 }
          ],
          outcomes: [
            { name: "Order cycle time", dir: "≤", target: "12 d", measureAt: "Q3 2026", actual: "15 d", progress: 80,
              note: "Retail is on the new process; Mobile cuts over in Q3." },
            { name: "First-time-right rate", dir: "≥", target: "95%", measureAt: "Q4 2026", actual: null, progress: null }
          ],
          milestones: [
            { name: "Process design and sign-off", covers: "The target process agreed with all three unit heads", owner: "Ashraf Abdelaty", finish: "Q1", status: "done" },
            { name: "Gap assessment per unit", covers: "What each unit has to change to reach it", owner: "Hala", finish: "Q2", status: "done" },
            { name: "Retail and Mazaya cutover", covers: "Both units running the standard process", owner: "Hala", finish: "Q3", status: "wip" },
            { name: "Mobile cutover", covers: "The last unit, gated on the ERP work", owner: "Ashraf Abdelaty", finish: "Q4", status: "todo" }
          ] },
        { name: "Cost-to-serve model and monthly review", owner: "Fayad Sobhy",
          brief: "A cost-to-serve model that survives contact with a real month, and a standing review that uses it.",
          stakeholders: ["Finance", "Operations"], timeline: "quarter", start: "Q1 2026", end: "Q4 2026",
          deliverables: [
            { name: "Cost-to-serve model built and validated", kind: "binary", due: "Q2", owner: "Fayad Sobhy", actual: "yes" },
            { name: "Monthly review running with all units", kind: "pct", due: "Q3", owner: "Fayad Sobhy", actual: 60 }
          ],
          outcomes: [
            { name: "Cost-to-serve", dir: "≤", target: "4.2%", measureAt: "Q4 2026", actual: null, progress: null }
          ],
          milestones: [
            { name: "Cost driver mapping", covers: "Which activities carry the cost, by unit", owner: "Fayad Sobhy", finish: "Q1", status: "done" },
            { name: "Model build and validation", covers: "Model reconciled against two closed months", owner: "Fayad Sobhy", finish: "Q2", status: "done" },
            { name: "Review cadence embedded", covers: "A standing monthly session with each unit", owner: "Hala", finish: "Q3", status: "wip" }
          ] },
        { name: "First-time-right programme in distribution", owner: "Hala",
          brief: "Cut the rework in distribution by fixing the two failure points that produce most of it.",
          stakeholders: ["Operations"], timeline: "quarter", start: "Q2 2026", end: "Q4 2026",
          deliverables: [
            { name: "Failure analysis on twelve months of orders", kind: "binary", due: "Q2", owner: "Hala", actual: "yes" },
            { name: "Corrective standard operating procedures", kind: "pct", due: "Q3", owner: "Hala", actual: 40 }
          ],
          outcomes: [
            { name: "First-time-right rate", dir: "≥", target: "95%", measureAt: "Q4 2026", actual: "82%", progress: 86 }
          ],
          milestones: [
            { name: "Failure analysis", covers: "Where rework originates and what it costs", owner: "Hala", finish: "Q2", status: "done" },
            { name: "Procedure rewrite", covers: "New procedures for the two main failure points", owner: "Hala", finish: "Q3", status: "wip" },
            { name: "Team retraining", covers: "Distribution teams trained on the new procedures", owner: "Hala", finish: "Q4", status: "todo" }
          ] }
      ] },

    { name: "People",
      def: "Have the right people in the right roles, and keep them.",
      keyObjectives: [
        { name: "Key-role coverage", dir: "≥", target: "90%", compile: "Latest", actual: "62%", progress: 69, weight: 50 },
        { name: "Voluntary attrition", dir: "≤", target: "12%", compile: "Latest", actual: "19%", progress: 63, weight: 50 }
      ],
      projects: [
        { name: "Key-role succession map for every unit", owner: "Noran Adel",
          brief: "Name a successor for every key role in every unit, and know which ones have nobody.",
          stakeholders: ["HR", "Unit heads"], timeline: "quarter", start: "Q1 2026", end: "Q3 2026",
          deliverables: [
            { name: "Key-role definition agreed group-wide", kind: "binary", due: "Q1", owner: "Noran Adel", actual: "yes" },
            { name: "Succession map per unit", kind: "pct", due: "Q3", owner: "Noran Adel", actual: 70 }
          ],
          outcomes: [
            { name: "Key-role coverage", dir: "≥", target: "90%", measureAt: "Q3 2026", actual: "62%", progress: 69,
              note: "Six roles across Retail and Mazaya still have no named successor." }
          ],
          milestones: [
            { name: "Key-role definition", covers: "What counts as a key role, agreed with the units", owner: "Noran Adel", finish: "Q1", status: "done" },
            { name: "Unit-by-unit mapping", covers: "Successors named, gaps recorded", owner: "Noran Adel", finish: "Q2", status: "done" },
            { name: "Gap closure plans", covers: "A plan for every role with no successor", owner: "Noran Adel", finish: "Q3", status: "wip" }
          ] },
        { name: "Retention plan for the top two attrition roles", owner: "Noran Adel",
          brief: "Two roles produce most of the voluntary attrition. Find out why, and change it.",
          stakeholders: ["HR"], timeline: "quarter", start: "Q2 2026", end: "Q4 2026",
          deliverables: [
            { name: "Exit interview analysis", kind: "binary", due: "Q2", owner: "Noran Adel", actual: "yes" },
            { name: "Revised package and progression for both roles", kind: "binary", due: "Q3", owner: "Noran Adel", actual: "no",
              note: "Held pending the compensation review." }
          ],
          outcomes: [
            { name: "Voluntary attrition in the two roles", dir: "≤", target: "12%", measureAt: "Q1 2027", actual: null, progress: null }
          ],
          milestones: [
            { name: "Attrition analysis", covers: "Which roles, which reasons, which managers", owner: "Noran Adel", finish: "Q2", status: "done" },
            { name: "Package redesign", covers: "Pay and progression reworked for both roles", owner: "Noran Adel", finish: "Q3", status: "wip" },
            { name: "Rollout and communication", covers: "Both roles moved onto the new terms", owner: "Noran Adel", finish: "Q4", status: "todo" }
          ] },
        { name: "Group training calendar and delivery", owner: "Hala",
          brief: "One training calendar for the group, published ahead of the year and actually delivered.",
          stakeholders: ["HR", "Unit heads"], timeline: "quarter", start: "Q1 2026", end: "Q4 2026",
          deliverables: [
            { name: "Annual training calendar published", kind: "binary", due: "Q1", owner: "Hala", actual: "yes" },
            { name: "Calendar delivered", kind: "pct", due: "Q4", owner: "Hala", actual: 44 }
          ],
          outcomes: [
            { name: "Training hours per head", dir: "≥", target: "24", measureAt: "Q4 2026", actual: "5", progress: 21,
              note: "Two of nine planned sessions delivered. Q3 and Q4 carry the rest." }
          ],
          milestones: [
            { name: "Needs assessment", covers: "What each unit actually needs, not what it asks for", owner: "Hala", finish: "Q1", status: "done" },
            { name: "Calendar published", covers: "Dates, trainers and places confirmed for the year", owner: "Hala", finish: "Q1", status: "done" },
            { name: "First-half delivery", covers: "Sessions scheduled to Q2 delivered", owner: "Hala", finish: "Q2", status: "wip" },
            { name: "Second-half delivery", covers: "The remaining sessions", owner: "Hala", finish: "Q4", status: "todo" }
          ] }
      ] },

    { name: "Innovation and Tech",
      def: "Consolidate onto systems that let a decision be made from one number, not five.",
      keyObjectives: [
        { name: "Systems consolidated", dir: "≥", target: "6", compile: "Sum", actual: "2", progress: 33, weight: 100 }
      ],
      projects: [
        { name: "Consolidate ERP instances across units", owner: "Abdelhamid",
          brief: "Six ERP instances become one, so a group number does not have to be assembled by hand every month.",
          stakeholders: ["IT", "Finance", "Unit heads"], timeline: "quarter", start: "Q2 2026", end: "Q4 2026",
          deliverables: [
            { name: "Target instance design", kind: "binary", due: "Q2", owner: "Abdelhamid", actual: "yes" },
            { name: "Instances migrated", kind: "pct", due: "Q4", owner: "Abdelhamid", actual: 33,
              note: "Two of six migrated. Mobile's cutover moved to Q3 with the principal." }
          ],
          outcomes: [
            { name: "Systems consolidated", dir: "≥", target: "6", measureAt: "Q4 2026", actual: "2", progress: 33 },
            { name: "Days to close month-end", dir: "≤", target: "5 d", measureAt: "Q1 2027", actual: null, progress: null }
          ],
          milestones: [
            { name: "Instance audit", covers: "What is running where, and what depends on it", owner: "Abdelhamid", finish: "Q2", status: "done" },
            { name: "Target design and sequencing", covers: "One target instance, and the order units move in", owner: "Abdelhamid", finish: "Q2", status: "done" },
            { name: "First two migrations", covers: "Treasury and Care moved across", owner: "Abdelhamid", finish: "Q3", status: "wip" },
            { name: "Remaining migrations", covers: "Mobile, Retail, Mazaya and B2B", owner: "Abdelhamid", finish: "Q4", status: "todo" }
          ] },
        { name: "Group data warehouse and single reporting layer", owner: "Ramy Behairy",
          brief: "One warehouse and one reporting layer, so the same question gets the same answer in every room.",
          stakeholders: ["IT", "Finance"], timeline: "quarter", start: "Q2 2026", end: "Q4 2026",
          deliverables: [
            { name: "Warehouse built and loading nightly", kind: "binary", due: "Q3", owner: "Ramy Behairy", actual: "no" },
            { name: "Reporting layer live for sales and finance", kind: "pct", due: "Q4", owner: "Ramy Behairy", actual: 36 }
          ],
          outcomes: [
            { name: "Dependency on automated reports", dir: "≥", target: "90%", measureAt: "Q4 2026", actual: "58%", progress: 64,
              note: "Power BI live for sales; finance stays manual until the warehouse lands." }
          ],
          milestones: [
            { name: "Model and source mapping", covers: "What the warehouse holds and where it comes from", owner: "Ramy Behairy", finish: "Q2", status: "done" },
            { name: "Warehouse build", covers: "Built, loading nightly, reconciled", owner: "Ramy Behairy", finish: "Q3", status: "wip" },
            { name: "Reporting layer rollout", covers: "Sales and finance reporting moved onto it", owner: "Ramy Behairy", finish: "Q4", status: "todo" }
          ] },
        { name: "Automation backlog and delivery cadence", owner: "Ramy Behairy",
          brief: "A standing backlog of automation candidates, and a cadence that actually clears it.",
          stakeholders: ["IT"], timeline: "quarter", start: "Q1 2026", end: "Q4 2026",
          deliverables: [
            { name: "Backlog built and prioritised", kind: "binary", due: "Q1", owner: "Ramy Behairy", actual: "yes" },
            { name: "Backlog delivered", kind: "pct", due: "Q4", owner: "Ramy Behairy", actual: 52 }
          ],
          outcomes: [
            { name: "Manual hours removed per month", dir: "≥", target: "300", measureAt: "Q4 2026", actual: "140", progress: 47 }
          ],
          milestones: [
            { name: "Candidate assessment", covers: "Every manual process worth automating, sized", owner: "Ramy Behairy", finish: "Q1", status: "done" },
            { name: "Cadence established", covers: "A fortnightly release running", owner: "Ramy Behairy", finish: "Q2", status: "done" },
            { name: "Half the backlog delivered", covers: "The top half by hours removed", owner: "Ramy Behairy", finish: "Q3", status: "wip" }
          ] }
      ] },

    { name: "Brand Positioning",
      def: "Be known for something specific, by the people who decide.",
      keyObjectives: [],
      projects: [
        { name: "Brand audit and positioning statement", owner: "Yara Kamal",
          brief: "Establish what the market currently believes about us, and agree what we want it to believe instead.",
          stakeholders: ["Marketing"], timeline: "quarter", start: "Q1 2026", end: "Q3 2026",
          deliverables: [
            { name: "Market perception study", kind: "binary", due: "Q2", owner: "Yara Kamal", actual: "yes" },
            { name: "Positioning statement agreed by the board", kind: "binary", due: "Q3", owner: "Yara Kamal", actual: "no" }
          ],
          outcomes: [
            { name: "Unaided brand awareness", dir: "≥", target: "45%", measureAt: "Q4 2026", actual: null, progress: null }
          ],
          milestones: [
            { name: "Perception study fielded", covers: "Study run with trade and end customers", owner: "Yara Kamal", finish: "Q2", status: "done" },
            { name: "Positioning workshop", covers: "Options developed and tested with the board", owner: "Yara Kamal", finish: "Q3", status: "wip" }
          ] },
        { name: "Trade communication programme", owner: "Tarek Nour",
          brief: "A standing communication programme aimed at the trade, replacing campaign-by-campaign improvisation.",
          stakeholders: ["Marketing", "Sales"], timeline: "quarter", start: "Q2 2026", end: "Q4 2026",
          deliverables: [
            { name: "Twelve-month communication calendar", kind: "binary", due: "Q2", owner: "Tarek Nour", actual: "yes" },
            { name: "Calendar executed", kind: "pct", due: "Q4", owner: "Tarek Nour", actual: 35 }
          ],
          outcomes: [
            { name: "Trade partner recall", dir: "≥", target: "70%", measureAt: "Q1 2027", actual: null, progress: null }
          ],
          milestones: [
            { name: "Calendar built", covers: "Twelve months of trade communication planned", owner: "Tarek Nour", finish: "Q2", status: "done" },
            { name: "First-half execution", covers: "Q2 and Q3 communication delivered", owner: "Tarek Nour", finish: "Q3", status: "wip" },
            { name: "Second-half execution", covers: "Q4 communication delivered", owner: "Tarek Nour", finish: "Q4", status: "todo" }
          ] }
      ] },

    { name: "Customer Centric",
      def: "Decide from what the customer actually did, not what we assumed.",
      keyObjectives: [
        { name: "Net promoter score", dir: "≥", target: "40", compile: "Latest", actual: "26", progress: 65, weight: 100 }
      ],
      projects: [
        { name: "Voice of customer loop across units", owner: "Mennah Farouk",
          brief: "One feedback loop, running continuously, whose output reaches the people who can act on it.",
          stakeholders: ["Care", "Unit heads"], timeline: "quarter", start: "Q1 2026", end: "Q4 2026",
          deliverables: [
            { name: "Feedback instrument agreed across units", kind: "binary", due: "Q1", owner: "Mennah Farouk", actual: "yes" },
            { name: "Loop running in all units", kind: "pct", due: "Q4", owner: "Mennah Farouk", actual: 50 }
          ],
          outcomes: [
            { name: "Net promoter score", dir: "≥", target: "40", measureAt: "Q4 2026", actual: "26", progress: 65 },
            { name: "Issues closed within SLA", dir: "≥", target: "90%", measureAt: "Q4 2026", actual: "71%", progress: 79 }
          ],
          milestones: [
            { name: "Instrument design", covers: "One question set used by every unit", owner: "Mennah Farouk", finish: "Q1", status: "done" },
            { name: "Pilot in two units", covers: "Retail and Care running the loop", owner: "Mennah Farouk", finish: "Q2", status: "done" },
            { name: "Rollout to remaining units", covers: "Mobile, Mazaya and B2B", owner: "Mennah Farouk", finish: "Q4", status: "wip" }
          ] },
        { name: "Service recovery standard", owner: "Dalia Sabry",
          brief: "A single standard for what happens when we get it wrong, and how quickly.",
          stakeholders: ["Care"], timeline: "quarter", start: "Q2 2026", end: "Q4 2026",
          deliverables: [
            { name: "Recovery standard published", kind: "binary", due: "Q3", owner: "Dalia Sabry", actual: "no" },
            { name: "Care teams trained", kind: "pct", due: "Q4", owner: "Dalia Sabry", actual: 20 }
          ],
          outcomes: [
            { name: "Repeat complaints", dir: "≤", target: "8%", measureAt: "Q1 2027", actual: null, progress: null }
          ],
          milestones: [
            { name: "Standard drafted", covers: "What we owe a customer when we fail, by failure type", owner: "Dalia Sabry", finish: "Q3", status: "wip" },
            { name: "Training and rollout", covers: "Every care team working to the standard", owner: "Dalia Sabry", finish: "Q4", status: "todo" }
          ] }
      ] },

    { name: "Product Mindset",
      def: "Treat what we sell as a portfolio to be shaped, not a catalogue to be carried.",
      keyObjectives: [],
      projects: [
        { name: "Portfolio review cadence", owner: "Tarek Nour",
          brief: "A quarterly review that decides what to add, hold and drop, on evidence rather than relationships.",
          stakeholders: ["Marketing", "Unit heads"], timeline: "quarter", start: "Q1 2026", end: "Q4 2026",
          deliverables: [
            { name: "Review framework and evidence pack", kind: "binary", due: "Q2", owner: "Tarek Nour", actual: "yes" },
            { name: "Quarterly reviews held", kind: "pct", due: "Q4", owner: "Tarek Nour", actual: 50 }
          ],
          outcomes: [
            { name: "Revenue from lines added in the last two years", dir: "≥", target: "25%", measureAt: "Q4 2026", actual: "11%", progress: 44 }
          ],
          milestones: [
            { name: "Framework agreed", covers: "What evidence a line is judged on", owner: "Tarek Nour", finish: "Q2", status: "done" },
            { name: "First two reviews", covers: "Q2 and Q3 reviews held with decisions recorded", owner: "Tarek Nour", finish: "Q3", status: "wip" },
            { name: "Second-half reviews", covers: "Q4 review held", owner: "Tarek Nour", finish: "Q4", status: "todo" }
          ] }
      ] },

    { name: "Financial Infrastructure",
      def: "Know the cash position, the cost of money and the exposure, on the day rather than after it.",
      keyObjectives: [
        { name: "Days to close month-end", dir: "≤", target: "5 d", compile: "Latest", actual: "6 d", progress: 83, weight: 60,
          note: "One sister company closed late in June." },
        { name: "Days sales outstanding", dir: "≤", target: "65", compile: "Latest", actual: "72", progress: 90, weight: 40 }
      ],
      projects: [
        /* Real. Islam's own sample project, carried in as given — its brief,
           deliverables, outcomes and milestones are the actual ones. It is also
           the case that proved the overrun rule: the project ends 30 Apr and two
           of its milestones finish after that, which is recorded rather than
           refused. */
        { name: "Average debt utilisation report automation", owner: "Hossam Abuelenien", real: true,
          brief: "Implementation of an automated debt utilisation report within Oracle, to streamline daily utilisation of debt in banks and factoring companies across sister companies.",
          stakeholders: ["Finance Department", "IT Department"], timeline: "date",
          start: "1 Jan 2026", end: "30 Apr 2026",
          deliverables: [
            { name: "Oracle-based interest utilisation form", kind: "binary", due: "Q1", owner: "IT", actual: "yes" },
            { name: "Tracking interest expense on a daily basis", kind: "binary", due: "Q1", owner: "Finance", actual: "yes" },
            { name: "Real-time data recalculation for corridor interest and pricing", kind: "binary", due: "Q2", owner: "IT", actual: "no",
              note: "Pricing corridor logic reopened with Treasury." },
            { name: "Daily treasury monitoring of debt balances", kind: "pct", due: "Q2", owner: "Treasury", actual: 100 }
          ],
          outcomes: [
            { name: "Reduction of manual work", dir: "≥", target: "40 h", measureAt: "Q2 2026", actual: "20 h", progress: 50,
              note: "Half the manual steps still run outside Oracle." },
            { name: "Improving financial accuracy", dir: "≥", target: "99%", measureAt: "Q4 2026", actual: null, progress: null }
          ],
          milestones: [
            { name: "Solution design", covers: "Treasury requirements and the calculation approach", owner: "Finance", finish: "20 Mar 2026", status: "done" },
            { name: "Oracle form development", covers: "Retrieval and calculation screens built", owner: "IT", finish: "12 Apr 2026", status: "done" },
            { name: "Interest utilisation automation", covers: "Calculation methodology and finance approval", owner: "Finance", finish: "20 Apr 2026", status: "done" },
            { name: "Stakeholder validation", covers: "Treasury validation of the outputs", owner: "Treasury", finish: "10 May 2026", status: "done" },
            { name: "Reporting and analysis embedment", covers: "BI integration of the utilisation report", owner: "IT", finish: "31 May 2026", status: "wip" }
          ] },
        { name: "Credit facility consolidation", owner: "Fayad Sobhy",
          brief: "Consolidation of facilities held across four banks into a single revolving arrangement, to cut arrangement fees and simplify covenant reporting.",
          stakeholders: ["Finance Department", "Treasury"], timeline: "quarter", start: "Q1 2026", end: "Q4 2026",
          deliverables: [
            { name: "Facility term sheet agreed with lead bank", kind: "binary", due: "Q2", owner: "Treasury", actual: null },
            { name: "Covenant reporting pack rebuilt", kind: "pct", due: "Q3", owner: "Finance", actual: null },
            { name: "Legacy facilities closed", kind: "binary", due: "Q4", owner: "Treasury", actual: null }
          ],
          outcomes: [
            { name: "Arrangement and commitment fees", dir: "≤", target: "-18%", measureAt: "Q1 2027", actual: null, progress: null }
          ],
          milestones: [
            { name: "Facility review and bank shortlist", covers: "Every facility held across the four banks, and a shortlist of candidate leads", owner: "Treasury", finish: "Q1", status: "done" },
            { name: "Term sheet negotiation", covers: "Commercial terms agreed with the appointed lead", owner: "Treasury", finish: "Q2", status: "wip" },
            { name: "Legal documentation", covers: "Facility agreement and security package drafted and signed", owner: "Finance", finish: "Q3", status: "todo" },
            { name: "Drawdown and legacy closure", covers: "First drawdown, and the four legacy facilities closed", owner: "Treasury", finish: "Q4", status: "todo" }
          ] },
        { name: "Working capital programme across units", owner: "Hossam Abuelenien",
          brief: "Release cash tied up in receivables and stock, unit by unit, against a target agreed with each.",
          stakeholders: ["Finance Department"], timeline: "quarter", start: "Q3 2026", end: "Q4 2026",
          deliverables: [
            { name: "Working capital baseline per unit", kind: "binary", due: "Q3", owner: "Finance", actual: null },
            { name: "Unit-level release plans agreed", kind: "pct", due: "Q4", owner: "Finance", actual: null }
          ],
          outcomes: [
            { name: "Days sales outstanding", dir: "≤", target: "65", measureAt: "Q4 2026", actual: null, progress: null },
            { name: "Credit facility headroom", dir: "≥", target: "1.5B", measureAt: "Q4 2026", actual: null, progress: null },
            { name: "Stock cover", dir: "≤", target: "45 d", measureAt: "Q1 2027", actual: null, progress: null }
          ],
          milestones: [
            { name: "Baseline per unit", covers: "Receivables and stock position established for each unit", owner: "Finance", finish: "Q3", status: "todo" },
            { name: "Release plans agreed", covers: "A target and a plan agreed with every unit head", owner: "Finance", finish: "Q4", status: "todo" },
            { name: "First review", covers: "Progress against plan reviewed with the CFO", owner: "Finance", finish: "Q4", status: "todo" }
          ] }
      ] },

    { name: "Strategy",
      def: "Run the cycle itself well — plan, review, adjust, on time and on evidence.",
      keyObjectives: [
        { name: "Cycles reviewed on time", dir: "≥", target: "4", compile: "Sum", actual: "2", progress: 50, weight: 50 },
        { name: "Plan adherence", dir: "≥", target: "80%", compile: "Latest", actual: "51%", progress: 64, weight: 50 }
      ],
      projects: [
        { name: "Quarterly review cadence with every unit", owner: "Islam Saadany",
          brief: "A review with every unit every quarter, on the same evidence, in the same shape.",
          stakeholders: ["Strategy Management Office", "Unit heads"], timeline: "quarter",
          start: "Q1 2026", end: "Q4 2026",
          deliverables: [
            { name: "Review format and evidence pack", kind: "binary", due: "Q1", owner: "Islam Saadany", actual: "yes" },
            { name: "Reviews held with every unit", kind: "pct", due: "Q4", owner: "Islam Saadany", actual: 66 }
          ],
          outcomes: [
            { name: "Cycles reviewed on time", dir: "≥", target: "4", measureAt: "Q4 2026", actual: "2", progress: 50 }
          ],
          milestones: [
            { name: "Format agreed", covers: "One review shape used with every unit", owner: "Islam Saadany", finish: "Q1", status: "done" },
            { name: "First-half reviews", covers: "Q1 and Q2 reviews held with all units", owner: "Islam Saadany", finish: "Q2", status: "done" },
            { name: "Second-half reviews", covers: "Q3 and Q4 reviews", owner: "Islam Saadany", finish: "Q4", status: "wip" }
          ] },
        { name: "Plan and progress on the platform for all units", owner: "Islam Saadany",
          brief: "Every unit's plan and every unit's reporting on the platform, so the cycle stops running on spreadsheets.",
          stakeholders: ["Strategy Management Office"], timeline: "quarter", start: "Q2 2026", end: "Q4 2026",
          deliverables: [
            { name: "All units' plans loaded", kind: "pct", due: "Q3", owner: "Islam Saadany", actual: 70 },
            { name: "All units reporting through the platform", kind: "pct", due: "Q4", owner: "Islam Saadany", actual: 40 }
          ],
          outcomes: [
            { name: "Plan adherence", dir: "≥", target: "80%", measureAt: "Q4 2026", actual: "51%", progress: 64 }
          ],
          milestones: [
            { name: "Plans loaded", covers: "Every unit's plan entered and checked", owner: "Islam Saadany", finish: "Q3", status: "wip" },
            { name: "First reporting cycle on the platform", covers: "A full cycle run without spreadsheets", owner: "Islam Saadany", finish: "Q4", status: "todo" }
          ] }
      ] }
  ],
  portfolio: { objectives: 66, exec: 51 },
  /* Weighting model — a proposal. Each factor is either derived from a stored
     figure or a recorded judgement; the composite always normalises to 100. */
  weighting: {
    factors: [
      { key:"rev",  name:"Revenue contribution", kind:"derived",   basis:"FY2025 revenue",        weight:40 },
      { key:"prof", name:"Profit contribution",  kind:"derived",   basis:"FY2025 gross profit",   weight:30 },
      { key:"imp",  name:"Impact on group",      kind:"judgement", basis:"1\u20134, set conceptually", weight:20 },
      { key:"growth", name:"Potential growth",   kind:"estimate",  basis:"our view, next 3 years", weight:10 }
    ],
    units: [
      { key:"mobile", unit:"Mobile", rev:8.2, prof:410, imp:4, growth:12,
        why:"Largest revenue base and the group's route to market for exclusive brands." },
      { key:"retailstores", unit:"Retail Stores", rev:4.6, prof:320, imp:3, growth:18,
        why:"Highest margin pool and the only direct consumer signal the group owns." },
      { key:"b2becomm", unit:"B2B Ecomm", rev:3.0, prof:160, imp:3, growth:35,
        why:"Small today, but the platform every other unit's One Trade work depends on." },
      { key:"consumerelectronics", unit:"Consumer Electronics", rev:5.4, prof:290, imp:4, growth:15,
        why:"Second revenue pillar and the anchor for principal relationships." },
      { key:"onlineshop", unit:"Online Shop", rev:1.8, prof:95, imp:3, growth:40,
        why:"Fastest-growing owned channel and the group's first-party data source." },
      { key:"corporate", unit:"Corporate", rev:0.9, prof:88, imp:4, growth:18,
        why:"Access to enterprise and government demand no other unit can reach." },
      { key:"care", unit:"Care", rev:0.9, prof:130, imp:3, growth:22,
        why:"Disproportionate margin, and the reason principals award us their lines." },
      { key:"it", unit:"IT", rev:2.2, prof:120, imp:2, growth:14,
        why:"Steady contributor; strategically the least differentiated of the lines." },
      { key:"logistics", unit:"Logistics", rev:1.6, prof:180, imp:3, growth:28,
        why:"Serves every other unit and is close to standing alone commercially." },
      { key:"nigeria", unit:"Nigeria", rev:1.1, prof:55, imp:2, growth:45,
        why:"Smallest today; the whole regional thesis rests on it working." }
    ],
  },
  themePillars: {
    OT:  [["Mobile","02 Channel Preference & Development",61,45,50],["Retail","R01 Store Network Expansion",84,78,50],["Mazaya","M01 B2B Platform Scale",38,30,50]],
    VC:  [["Mobile","01 Digital & Data-Driven Operations",null,38,50],["Mobile","04 Asset-Light Model Regional Expansion",33,55,50],["Retail","R02 Omnichannel Experience",71,64,70],["Retail","R03 Retail Operations Excellence",null,71,55],["Mazaya","M03 Platform Reliability",null,36,45]],
    DIV: [["Mobile","03 Portfolio & Value Chain Expansion",52,40,43],["Mazaya","M02 Merchant Financing",44,42,33]]
  },
  themeView: [
    { ab: "OT",  name: "One Trade",          items: 3, units: "Mobile, Retail, Mazaya", outcomes: 86, exec: 51 },
    { ab: "VC",  name: "Deepen Value Chain", items: 5, units: "Mobile, Retail, Mazaya", outcomes: 47, exec: 53 },
    { ab: "DIV", name: "Diversification",    items: 2, units: "Mobile, Mazaya",         outcomes: 55, exec: 41 }
  ]
};

var UNITS = {
  mobile: {
    name: "Mobile", codePrefix: "MB", weight: 0, real: true,
    perf: { objectives: 62, pillars: 49, exec: 45 },
    clauses: [
      ["We are", "consumer electronics distribution company"],
      ["We provide", "distribution services (account management, logistics services, product management)"],
      ["For", "e-commerce, retail, operators, hyper markets, IR and OR"],
      ["All Overall", "Egypt"],
      ["We facilitate", "sell-in, end to end distribution services (logistics cycle, collection)"],
      ["Using", "end to end distribution services to both vendor & channel"]
    ],
    aspiration: "To be the biggest and most diversified distributor in local market through the most developed and advanced tech systems — positioned as one of the recognized regional distributors for consumer electronics.",
    endInMind: "To be positioned as one of the recognized regional distributors for consumer electronics",
    keyObjectives: [
      { src: { set: "financialfigures" }, name: "Distribution revenue", dir: "≥", target3y: "9.0B EGP", target: "6.2B EGP", compile: "Sum", actual: "2.7B", progress: 44 },
      { name: "Mobile market share",  dir: "≥", target3y: "38%", target: "32%",      compile: "Latest", actual: "28%", progress: 88 },
      { name: "Active merchant reach",dir: "≥", target3y: "6,500", target: "4,500",    compile: "Latest", actual: "3,180", progress: 71 },
      { name: "App coverage rate",    dir: "≥", target3y: "75%", target: "50%",      compile: "Latest", actual: "22%", progress: 44, note: "Rollout gated on the merchant app release. Recovery plan agreed with Ramy for Q3." }
    ],
    swot: {
      s: ["Strong brand equity (Raya & i2)", "Diversified & strong brand portfolio", "Over 90% of revenue from local manufacturing", "Nationwide distribution & retail reach", "Integrated Raya Trade ecosystem", "Access to multi-source data"],
      w: ["Limited control over the value chain", "Low margin on devices", "Multiple systems across Raya Trade business units", "Underutilisation of available automation systems", "Underdeveloped presence in accessories market"],
      o: ["Growth in accessories and wearables market", "Local manufacturing expansion", "Migration of 3G user base", "Regional expansion using a scalable proven model", "Dubai free zone multi-branded concept", "Unlocking value through AI & data"],
      t: ["Direct-to-market strategies by vendors", "Margin pressure (global trend)", "Grey market competition on accessories", "Economic pressure on consumption", "Global supply chain disruption", "Irrational competition"]
    },
    items: [
      { code: "01", name: "Digital & Data-Driven Operations", sub: "End-state: unified market intelligence engine",
        kind: "Capability", theme: "VC", owner: "Ramy Behairy", outcomes: null, exec: 38, planned: 50,
        measures: [
          { name: "Data duplicate rate",           dir: "≤", target: "1%",  compile: "Latest", actual: "1.4%", progress: 71 },
          { name: "Orders processed digitally",    dir: "≥", target: "90%", compile: "Latest", actual: "48%", progress: 53, note: "ERP cutover moved to Q3 with the principal. 48% is the pre-cutover ceiling." },
          { name: "App coverage rate",             dir: "≥", target3y: "75%", target: "50%", compile: "Latest", actual: "22%", progress: 44 },
          { name: "Dependency on automated reports", dir: "≥", target: "90%", compile: "Latest", actual: "58%", progress: 64, note: "Power BI live for sales; finance still manual until the warehouse lands." }
        ],
        tactics: [
          { name: "Clean and standardize customer and SKU base", owner: "Ramy Behairy", q1: 0, q2: 1, q3: 1, q4: 0, status: "WIP", actual: 45 },
          { name: "End-to-end order-to-cash digitization",       owner: "Mohamed Rizk",  q1: 0, q2: 1, q3: 1, q4: 0, status: "WIP", actual: 35 },
          { name: "Digitize sales reporting via Power BI",       owner: "Ramy Behairy",  q1: 0, q2: 1, q3: 1, q4: 0, status: "WIP", actual: 40 },
          { name: "Scale Mobile Digital App across merchants",   owner: "Ashraf Laithy", q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 30 },
          { name: "Data integration across business units",      owner: "Abdelhamid",    q1: 0, q2: 0, q3: 1, q4: 1, status: "WIP", actual: 22 }
        ] },
      { code: "02", name: "Channel Preference & Development", sub: "",
        kind: "Direction", theme: "OT", owner: "Mohamed Rizk", outcomes: 61, exec: 45, planned: 50,
        measures: [
          { name: "Average delivery time",              dir: "≤", target: "24 h",  compile: "Latest", actual: "31 h", progress: 77 },
          { name: "Key retailer revenue growth",        dir: "≥", target: "50%",   compile: "Sum", actual: "24%", progress: 48, note: "Two key accounts renegotiated late. Q3 volumes already committed." },
          { name: "Tier 2 merchants enrolled",          dir: "≥", target: "100",   compile: "Latest", actual: "58", progress: 58, note: "Enrolment slowed by the credit check change. 58 of 100 signed." },
          { name: "Tier 2 segment revenue growth",      dir: "≥", target: "100%",  compile: "Sum", actual: "62%", progress: 62 }
        ],
        tactics: [
          { name: "Retailer preference index workshop",        owner: "Karim",         q1: 0, q2: 1, q3: 1, q4: 0, status: "WIP",  actual: 60 },
          { name: "Joint business planning with key retailers",owner: "Mohamed Rizk",  q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP",  actual: 45 },
          { name: "Tier 2 growth acceleration programme",      owner: "Ashraf Laithy", q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP",  actual: 35 },
          { name: "Channel intelligence engine (pilot)",       owner: "Karim",         q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP",  actual: 40 }
        ] },
      { code: "03", name: "Portfolio & Value Chain Expansion", sub: "",
        kind: "Direction", theme: "DIV", owner: "Karim", outcomes: 52, exec: 40, planned: 43,
        measures: [
          { src: { set: "financialfigures" }, name: "Non-Samsung revenue",      dir: "≥", target: "4B EGP",   compile: "Sum", actual: "1.6B", progress: 40 },
          { name: "Samsung market share",     dir: "≥", target: "30%",      compile: "Latest", actual: "31%", progress: 103 },
          { name: "Vivo market share",        dir: "≥", target: "60%",      compile: "Latest", actual: "48%", progress: 80 },
          { src: { set: "financialfigures" }, name: "Accessory revenue",        dir: "≥", target: "300M EGP", compile: "Sum", actual: "96M", progress: 32 },
          { name: "Active Sary merchants",    dir: "≥", target: "800",      compile: "Latest", actual: "310", progress: 39 },
          { src: { set: "financialfigures" }, name: "Sary revenue",             dir: "≥", target: "150M EGP", compile: "Sum", actual: "42M", progress: 28 },
          { name: "Local production devices", dir: "≥", target: "1M",       compile: "Sum", actual: "520K", progress: 52 },
          { name: "Sary app downloads",       dir: "≥", target: "40K",      compile: "Latest", actual: "18.4K", progress: 46 }
        ],
        tactics: [
          { name: "Protect and grow share in existing brands", owner: "Ashraf Abdelaty", q1: 1, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 55 },
          { name: "Expand high-margin categories",             owner: "Fayad",           q1: 1, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 40 },
          { name: "Leverage Sary for entry-to-mid expansion",  owner: "Fayad",           q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 30 },
          { name: "Sary-enabled tailored B2B portfolio",       owner: "Fayad",           q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 25 },
          { name: "Ongoing scanning for tier-1 brands",        owner: "Karim",           q1: 1, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 50 },
          { name: "Build a light ecosystem (limited SKU)",     owner: "Fayad",           q1: 0, q2: 0, q3: 1, q4: 1, status: "WIP", actual: 28 },
          { name: "Market intelligence partner",               owner: "Karim",           q1: 0, q2: 0, q3: 1, q4: 1, status: "WIP", actual: 35 }
        ] },
      { code: "04", name: "Asset-Light Model Regional Expansion", sub: "",
        kind: "Direction", theme: "VC", owner: "Abdelhamid", outcomes: 33, exec: 55, planned: 50,
        measures: [
          { name: "Regional hub revenue",     dir: "≥", target: "2M USD", compile: "Sum", actual: "0.5M", progress: 25, note: "Hub opens in H2 by design \u2014 this is measured at H2, not now." },
          { name: "Export markets activated", dir: "≥", target: "3",      compile: "Latest", actual: "1", progress: 33, note: "One of three live. Nigeria and Libya in regulatory review." },
          { name: "Distribution agreements",  dir: "≥", target: "2",      compile: "Latest", actual: "1", progress: 50 }
        ],
        tactics: [
          { name: "Dubai regional hub multi-branded export concept", owner: "Karim",      q1: 1, q2: 1, q3: 1, q4: 0, status: "WIP",  actual: 60 },
          { name: "Initial agreements with 2–3 tier 2 brands",       owner: "Abdelhamid", q1: 1, q2: 1, q3: 1, q4: 0, status: "WIP",  actual: 55 },
          { name: "Pre-entry market validation",                     owner: "Abdelhamid", q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP",  actual: 50 },
          { name: "Regulatory & entry barriers assessment",          owner: "Fayad",      q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP",  actual: 55 },
          { name: "Entry model design & B2B e-commerce presence",    owner: "Abuelenien", q1: 0, q2: 0, q3: 0, q4: 1, status: "WIP",  actual: 18 },
          { name: "Go / No-Go regional entry risk assessment",       owner: "Karim",      q1: 0, q2: 1, q3: 1, q4: 0, status: "Done", actual: 100 }
        ] }
    ]
  },

  retailstores: {
    name: "Retail Stores", codePrefix: "RS", weight: 0, real: false,
    perf: { objectives: 86, pillars: 78, exec: 71 },
    clauses: [
      ["We are", "a consumer electronics retail chain and e-store"],
      ["We provide", "in-store and online retail, trade-in, care and after-sales services"],
      ["For", "walk-in consumers, online shoppers and corporate buyers"],
      ["All Overall", "Egypt, concentrated in Greater Cairo and Delta"],
      ["We facilitate", "sell-out, instalment plans, and device lifecycle services"],
      ["Using", "an owned store network, the Raya Shop platform, and a national care operation"]
    ],
    aspiration: "To be the most preferred consumer electronics retailer in Egypt — the destination customers choose first, online and on the high street.",
    endInMind: "",
    keyObjectives: [
      { src: { set: "financialfigures" }, name: "Retail revenue",     dir: "≥", target3y: "6.8B EGP", target: "4.5B EGP", compile: "Sum", actual: "3.8B", progress: 84 },
      { name: "Stores operating",   dir: "≥", target3y: "120", target: "88",       compile: "Latest", actual: "91", progress: 103 },
      { name: "E-store share of revenue", dir: "≥", target3y: "38%", target: "25%", compile: "Latest", actual: "21%", progress: 84 },
      { name: "Net promoter score", dir: "≥", target3y: "65", target: "55",       compile: "Latest", actual: "45", progress: 82 }
    ],
    swot: {
      s: ["Established high-street presence", "Direct access to consumer demand signal", "Trade-in and care differentiate on service", "Buying power through the group"],
      w: ["Store economics sensitive to footfall", "E-store still a minority of revenue", "Inventory turns behind category benchmark"],
      o: ["Shift of category spend online", "Instalment penetration still low", "Care services as a margin pool"],
      t: ["Vendor direct-to-consumer channels", "Grey market pricing pressure", "Rental cost inflation on prime locations"]
    },
    items: [
      { code: "R01", name: "Store Network Expansion", sub: "",
        kind: "Direction", theme: "OT", owner: "Hossam", outcomes: 84, exec: 78, planned: 50,
        measures: [
          { name: "New stores opened",     dir: "≥", target: "14",   compile: "Sum", actual: "12", progress: 86 },
          { name: "Revenue per store",     dir: "≥", target: "52M",  compile: "Latest", actual: "55M", progress: 106 },
          { name: "Prime-location share",  dir: "≥", target: "60%",  compile: "Latest", actual: "47%", progress: 78 }
        ],
        tactics: [
          { name: "Site selection model using catchment data", owner: "Hossam", collaborators: ["Dalia", "Nour"], q1: 1, q2: 1, q3: 1, q4: 0, status: "WIP",  actual: 70 },
          { name: "Standard fit-out programme",                owner: "Dalia",  collaborators: ["Hossam"], q1: 1, q2: 1, q3: 1, q4: 1, status: "WIP",  actual: 65 },
          { name: "Landlord framework agreements",             owner: "Hossam", q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP",  actual: 55 }
        ] },
      { code: "R02", name: "Omnichannel Experience", sub: "",
        kind: "Direction", theme: "VC", owner: "Dalia", outcomes: 71, exec: 64, planned: 70,
        measures: [
          { src: { set: "financialfigures" }, name: "E-store revenue",        dir: "≥", target: "1.1B EGP", compile: "Sum", actual: "0.62B", progress: 56 },
          { name: "Click-and-collect share",dir: "≥", target: "30%",      compile: "Latest", actual: "33%", progress: 110 },
          { name: "Unified stock accuracy", dir: "≥", target: "95%",      compile: "Latest", actual: "67%", progress: 71 }
        ],
        tactics: [
          { name: "Single stock view across store and e-store", owner: "Dalia", collaborators: ["Nour", "Sherif"], q1: 1, q2: 1, q3: 0, q4: 0, status: "WIP",  actual: 60 },
          { name: "Click-and-collect rollout",                  owner: "Dalia", q1: 1, q2: 1, q3: 1, q4: 0, status: "WIP",  actual: 55 },
          { name: "Unified loyalty across channels",            owner: "Nour",  collaborators: ["Dalia"], q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP",  actual: 50 }
        ] },
      { code: "R03", name: "Retail Operations Excellence", sub: "Service, stock and store discipline",
        kind: "Capability", theme: "VC", owner: "Nour", outcomes: null, exec: 71, planned: 55,
        measures: [
          { name: "Inventory turns",     dir: "≥", target: "6.0", compile: "Latest", actual: "4.7", progress: 78 },
          { name: "Shrinkage rate",      dir: "≤", target: "0.4%",compile: "Latest", actual: "0.6%", progress: 67 }
        ],
        tactics: [
          { name: "Store operating standard and audit cycle", owner: "Nour", collaborators: ["Hossam", "Dalia"], q1: 1, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 60 },
          { name: "Replenishment automation",                 owner: "Nour", q1: 0, q2: 1, q3: 1, q4: 0, status: "WIP", actual: 50 }
        ] }
    ]
  },

  b2becomm: {
    name: "B2B Ecomm", codePrefix: "BE", weight: 0, real: false,
    perf: { objectives: 48, pillars: 41, exec: 36 },
    clauses: [
      ["We are", "a B2B trade platform for independent retailers"],
      ["We provide", "online ordering, credit facilities and fulfilment for small merchants"],
      ["For", "independent retailers, tier 2 dealers and neighbourhood shops"],
      ["All Overall", "Egypt"],
      ["We facilitate", "assortment access, working capital and next-day delivery"],
      ["Using", "a merchant app, a credit engine and the group's logistics network"]
    ],
    aspiration: "To be the default ordering platform for Egypt's independent electronics retail — the first app a merchant opens each morning.",
    endInMind: "",
    keyObjectives: [
      { src: { set: "financialfigures" }, name: "Platform GMV",         dir: "≥", target3y: "9.5B EGP", target: "900M EGP", compile: "Sum", actual: "310M", progress: 34 },
      { name: "Monthly active merchants", dir: "≥", target3y: "14,000", target: "2,200", compile: "Latest", actual: "980", progress: 45 },
      { name: "Repeat order rate",    dir: "≥", target3y: "72%", target: "65%",      compile: "Latest", actual: "31%", progress: 48 },
      { name: "Credit default rate",  dir: "≤", target3y: "1.5%", target: "2%",       compile: "Latest", actual: "3.1%", progress: 65 }
    ],
    swot: {
      s: ["Access to the group's assortment and logistics", "Existing merchant relationships from distribution", "Credit data from trading history"],
      w: ["Low repeat usage after first order", "Manual onboarding limits reach", "Thin margins on platform transactions"],
      o: ["Digitising an entirely offline ordering habit", "Embedded finance as a revenue line", "Cross-sell from distribution's merchant base"],
      t: ["Well-funded horizontal B2B platforms", "Merchant credit risk in a tight economy", "Vendors bypassing platforms entirely"]
    },
    items: [
      { code: "M01", name: "B2B Platform Scale", sub: "",
        kind: "Direction", theme: "OT", owner: "Abuelenien", outcomes: 38, exec: 30, planned: 50,
        measures: [
          { name: "Merchants onboarded", dir: "≥", target: "2,200",  compile: "Latest", actual: "980", progress: 45 },
          { name: "Platform GMV",        dir: "≥", target3y: "9.5B EGP", target: "900M",   compile: "Sum", actual: "310M", progress: 34 },
          { name: "Orders per merchant", dir: "≥", target: "8",      compile: "Latest", actual: "2.8", progress: 35 }
        ],
        tactics: [
          { name: "Self-serve merchant onboarding",    owner: "Abuelenien", q1: 1, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 35 },
          { name: "Field activation programme",        owner: "Hala",       q1: 1, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 25 }
        ] },
      { code: "M02", name: "Merchant Financing", sub: "",
        kind: "Direction", theme: "DIV", owner: "Hala", outcomes: 44, exec: 42, planned: 33,
        measures: [
          { src: { set: "financialfigures" }, name: "Credit book",         dir: "≥", target: "180M EGP", compile: "Latest", actual: "74M", progress: 41 },
          { name: "Merchants with credit", dir: "≥", target: "600",    compile: "Latest", actual: "285", progress: 48 }
        ],
        tactics: [
          { name: "Credit scoring from trading history", owner: "Hala",  q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 45 },
          { name: "Partner lender agreements",           owner: "Hala",  q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 40 }
        ] },
      { code: "M03", name: "Platform Reliability", sub: "Uptime, fulfilment and support",
        kind: "Capability", theme: "VC", owner: "Mohamed Rizk", outcomes: null, exec: 36, planned: 45,
        measures: [
          { name: "Order fulfilment rate", dir: "≥", target: "97%", compile: "Latest", actual: "88%", progress: 91 },
          { name: "App crash-free rate",   dir: "≥", target: "99%", compile: "Latest", actual: "99.4%", progress: 100 }
        ],
        tactics: [
          { name: "Fulfilment SLA with logistics", owner: "Mohamed Rizk", q1: 1, q2: 1, q3: 1, q4: 0, status: "WIP", actual: 40 },
          { name: "Platform stability programme",  owner: "Mohamed Rizk", q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 32 }
        ] }
    ]
  },
  onlineshop: {
    name: "Online Shop", codePrefix: "OS", weight: 0, real: false,
    clauses: [
      ["We are", "Raya Trade's owned online storefront"],
      ["We sell", "consumer electronics, mobiles, IT and accessories"],
      ["To", "individual consumers across Egypt"],
      ["Through", "web, app and marketplace listings"],
      ["Covering", "all governorates via the group's logistics network"],
      ["Using", "group inventory and shared last-mile capacity"],
    ],
    aspiration: "To be the first destination Egyptians open when they shop electronics online — fastest to deliver, widest assortment, and the easiest returns in the market.",
    endInMind: "",
    keyObjectives: [
      { src: { set: "financialfigures" }, name: "Online revenue", dir: "≥", target3y: "2.6B EGP", target: "1.8B EGP", compile: "Sum", actual: "1.1B", progress: 61 },
      { name: "Site conversion rate", dir: "≥", target3y: "3.2%", target: "2.4%", compile: "Latest", actual: "1.8%", progress: 75 },
      { name: "Repeat purchase rate", dir: "≥", target3y: "40%", target: "28%", compile: "Latest", actual: "19%", progress: 68 },
      { name: "Assortment breadth (live SKUs)", dir: "≥", target3y: "24,000", target: "14,000", compile: "Latest", actual: "9,400", progress: 67 },
    ],
    swot: {
      s: ["Owned traffic and first-party data", "Access to full group assortment"],
      w: ["Thin margins after delivery cost", "Brand awareness behind pure-play rivals"],
      o: ["Marketplace expansion", "Subscription-based delivery"],
      t: ["Aggressive discounting by pure-plays", "Rising paid-acquisition cost"],
    },
    items: [
      { code: "OS01", name: "Assortment & Availability", sub: "",
        kind: "Direction", theme: "OT", owner: "Sherif Adel",
        measures: [
          { name: "Live SKU count", dir: "≥", target: "14,000", compile: "Latest", actual: "9,400", progress: 67 },
          { name: "Out-of-stock rate", dir: "≤", target: "4%", compile: "Latest", actual: "7%", progress: 57 },
          { name: "Supplier lead time", dir: "≤", target: "10 d", compile: "Latest", actual: "14 d", progress: 71 },
        ],
        tactics: [
          { name: "Onboard group assortment to storefront", owner: "Sherif Adel", q1: 1, q2: 1, q3: 1, q4: 0, status: "WIP", actual: 55 },
          { name: "Automated stock sync with warehouses", owner: "Nadia Fouad", q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 40 },
          { name: "Third-party seller pilot", owner: "Sherif Adel", q1: 0, q2: 0, q3: 1, q4: 1, status: "WIP", actual: 25 },
        ] },
      { code: "OS02", name: "Conversion & Retention", sub: "",
        kind: "Direction", theme: "VC", owner: "Nadia Fouad",
        measures: [
          { name: "Conversion rate", dir: "≥", target: "2.4%", compile: "Latest", actual: "1.8%", progress: 75 },
          { name: "Cart abandonment", dir: "≤", target: "62%", compile: "Latest", actual: "71%", progress: 87 },
          { name: "App install base", dir: "≥", target: "900,000", compile: "Latest", actual: "540,000", progress: 60 },
        ],
        tactics: [
          { name: "Checkout redesign and one-tap pay", owner: "Nadia Fouad", q1: 1, q2: 1, q3: 0, q4: 0, status: "WIP", actual: 80 },
          { name: "Loyalty programme launch", owner: "Sherif Adel", q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 45 },
          { name: "Personalised recommendation engine", owner: "Nadia Fouad", q1: 0, q2: 0, q3: 1, q4: 1, status: "WIP", actual: 30 },
        ] },
    ] },
  consumerelectronics: {
    name: "Consumer Electronics", codePrefix: "CE", weight: 0, real: false,
    clauses: [
      ["We are", "the group's consumer electronics distribution arm"],
      ["We provide", "value-added distribution and channel development"],
      ["For", "brand principals, retail chains and independent dealers"],
      ["Through", "a national dealer network and key-account teams"],
      ["Covering", "Egypt, with selected export lines"],
      ["Using", "group logistics, credit facilities and after-sales"],
    ],
    aspiration: "To be the distributor every major appliance and electronics brand chooses first for Egypt, with the deepest retail coverage in the category.",
    endInMind: "",
    keyObjectives: [
      { src: { set: "financialfigures" }, name: "CE distribution revenue", dir: "≥", target3y: "7.8B EGP", target: "5.4B EGP", compile: "Sum", actual: "2.4B", progress: 44 },
      { name: "CE market share", dir: "≥", target3y: "24%", target: "18%", compile: "Latest", actual: "14%", progress: 78 },
      { name: "Active dealer accounts", dir: "≥", target3y: "2,600", target: "1,900", compile: "Latest", actual: "1,410", progress: 74 },
      { name: "Gross margin", dir: "≥", target3y: "9.5%", target: "8.2%", compile: "Latest", actual: "7.1%", progress: 87 },
    ],
    swot: {
      s: ["Long-standing principal relationships", "National dealer coverage"],
      w: ["Heavy working-capital requirement", "Exposure to a few large brands"],
      o: ["Premium appliance segment growth", "Own-label accessories"],
      t: ["Direct-to-retail moves by principals", "Currency volatility on imports"],
    },
    items: [
      { code: "CE01", name: "Brand Portfolio Depth", sub: "",
        kind: "Direction", theme: "DIV", owner: "Tarek Nassar",
        measures: [
          { name: "Principal agreements signed", dir: "≥", target: "4", compile: "Sum", actual: "2", progress: 50 },
          { name: "Revenue from top-2 brands", dir: "≤", target: "55%", compile: "Latest", actual: "64%", progress: 86 },
          { src: { set: "financialfigures" }, name: "New category revenue", dir: "≥", target: "900M EGP", compile: "Sum", actual: "310M", progress: 34 },
        ],
        tactics: [
          { name: "Negotiate two additional principal lines", owner: "Tarek Nassar", q1: 1, q2: 1, q3: 1, q4: 0, status: "WIP", actual: 50 },
          { name: "Own-label accessory range", owner: "Heba Salem", q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 35 },
          { name: "Premium segment entry plan", owner: "Tarek Nassar", q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 45 },
        ] },
      { code: "CE02", name: "Dealer Network Development", sub: "",
        kind: "Direction", theme: "OT", owner: "Heba Salem",
        measures: [
          { name: "Active dealers", dir: "≥", target: "1,900", compile: "Latest", actual: "1,410", progress: 74 },
          { name: "Dealer credit utilisation", dir: "≥", target: "70%", compile: "Latest", actual: "52%", progress: 74 },
          { name: "Dealer churn", dir: "≤", target: "8%", compile: "Latest", actual: "12%", progress: 67 },
        ],
        tactics: [
          { name: "Tiered dealer incentive scheme", owner: "Heba Salem", q1: 1, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 60 },
          { name: "Regional dealer service hubs", owner: "Tarek Nassar", q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 38 },
          { name: "Dealer portal rollout", owner: "Heba Salem", q1: 0, q2: 0, q3: 1, q4: 1, status: "WIP", actual: 28 },
        ] },
    ] },
  corporate: {
    name: "Corporate", codePrefix: "CO", weight: 0, real: false,
    clauses: [
      ["We are", "the group's enterprise and government sales arm"],
      ["We provide", "end-to-end technology supply, integration and support contracts"],
      ["For", "large enterprises, banks, telcos and government entities"],
      ["Through", "direct key-account teams and tender participation"],
      ["Covering", "Egypt"],
      ["Using", "group product access, IT services and financing capacity"],
    ],
    aspiration: "To be the single technology supply partner for Egypt's largest enterprises and government programmes, selling solutions rather than boxes.",
    endInMind: "",
    keyObjectives: [
      { src: { set: "financialfigures" }, name: "Corporate revenue", dir: "≥", target3y: "1.4B EGP", target: "0.9B EGP", compile: "Sum", actual: "0.42B", progress: 47 },
      { src: { set: "financialfigures" }, name: "Contracted recurring revenue", dir: "≥", target3y: "260M EGP", target: "150M EGP", compile: "Sum", actual: "61M", progress: 41 },
      { name: "Tender win rate", dir: "≥", target3y: "35%", target: "26%", compile: "Latest", actual: "19%", progress: 73 },
      { name: "Named enterprise accounts", dir: "≥", target3y: "140", target: "95", compile: "Latest", actual: "72", progress: 76 },
    ],
    swot: {
      s: ["Breadth of product access across the group", "Established government references"],
      w: ["Long cash-conversion cycles", "Thin technical pre-sales bench"],
      o: ["Public digitisation programmes", "Managed-service contracts"],
      t: ["Global integrators entering tenders", "Budget deferrals in public sector"],
    },
    items: [
      { code: "CO01", name: "Solution Selling Capability", sub: "",
        kind: "Capability", theme: "VC", owner: "Amr Bakr",
        measures: [
          { name: "Certified pre-sales engineers", dir: "≥", target: "18", compile: "Latest", actual: "11", progress: 61 },
          { name: "Solution-led deal share", dir: "≥", target: "45%", compile: "Latest", actual: "29%", progress: 64 },
          { src: { set: "financialfigures" }, name: "Average deal size", dir: "≥", target: "3.2M EGP", compile: "Latest", actual: "2.1M", progress: 66 },
        ],
        tactics: [
          { name: "Pre-sales academy and certification", owner: "Amr Bakr", q1: 1, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 55 },
          { name: "Reference architecture library", owner: "Laila Zaki", q1: 0, q2: 1, q3: 1, q4: 0, status: "WIP", actual: 60 },
          { name: "Vendor solution partnerships", owner: "Amr Bakr", q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 42 },
        ] },
      { code: "CO02", name: "Public Sector Programmes", sub: "",
        kind: "Direction", theme: "DIV", owner: "Laila Zaki",
        measures: [
          { name: "Active public contracts", dir: "≥", target: "24", compile: "Latest", actual: "16", progress: 67 },
          { name: "Tender win rate", dir: "≥", target: "26%", compile: "Latest", actual: "19%", progress: 73 },
          { src: { set: "financialfigures" }, name: "Public revenue", dir: "≥", target: "420M EGP", compile: "Sum", actual: "178M", progress: 42 },
        ],
        tactics: [
          { name: "Framework agreement registrations", owner: "Laila Zaki", q1: 1, q2: 1, q3: 1, q4: 0, status: "WIP", actual: 70 },
          { name: "Dedicated bid desk", owner: "Amr Bakr", q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 45 },
          { name: "Compliance and certification programme", owner: "Laila Zaki", q1: 0, q2: 0, q3: 1, q4: 1, status: "WIP", actual: 30 },
        ] },
    ] },
  care: {
    name: "Care", codePrefix: "CA", weight: 0, real: false,
    clauses: [
      ["We are", "the group's after-sales and service organisation"],
      ["We provide", "authorised repair, warranty administration and extended service plans"],
      ["For", "brand principals, group business units and end customers"],
      ["Through", "service centres, pick-up points and on-site teams"],
      ["Covering", "Egypt"],
      ["Using", "certified technicians, parts inventory and the group's logistics network"],
    ],
    aspiration: "To be the after-sales operation brands trust with their reputation — the reason a customer buys the second device from us.",
    endInMind: "",
    keyObjectives: [
      { src: { set: "financialfigures" }, name: "Service revenue", dir: "≥", target3y: "1.3B EGP", target: "0.9B EGP", compile: "Sum", actual: "0.44B", progress: 49 },
      { name: "First-time fix rate", dir: "≥", target3y: "92%", target: "86%", compile: "Latest", actual: "89%", progress: 103 },
      { name: "Average turnaround time", dir: "≤", target3y: "3 d", target: "4 d", compile: "Latest", actual: "6 d", progress: 67 },
      { name: "Extended plan attach rate", dir: "≥", target3y: "22%", target: "15%", compile: "Latest", actual: "9%", progress: 60 },
    ],
    swot: {
      s: ["Authorised status with major brands", "National service footprint"],
      w: ["Parts availability drives turnaround", "Technician attrition"],
      o: ["Extended warranty as a margin pool", "Service for third-party retailers"],
      t: ["Brands insourcing service", "Grey-market repair pricing"],
    },
    items: [
      { code: "CA01", name: "Service Excellence", sub: "",
        kind: "Capability", theme: "OT", owner: "Mostafa Deif",
        measures: [
          { name: "First-time fix rate", dir: "≥", target: "86%", compile: "Latest", actual: "89%", progress: 103 },
          { name: "Turnaround time", dir: "≤", target: "4 d", compile: "Latest", actual: "6 d", progress: 67 },
          { name: "Customer satisfaction", dir: "≥", target: "4.5", compile: "Latest", actual: "4.6", progress: 102 },
        ],
        tactics: [
          { name: "Parts availability programme", owner: "Mostafa Deif", q1: 1, q2: 1, q3: 1, q4: 0, status: "WIP", actual: 65 },
          { name: "Technician certification ladder", owner: "Rania Fahmy", q1: 1, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 50 },
          { name: "Service tracking for customers", owner: "Mostafa Deif", q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 40 },
        ] },
      { code: "CA02", name: "Service Revenue Growth", sub: "",
        kind: "Direction", theme: "DIV", owner: "Rania Fahmy",
        measures: [
          { name: "Extended plan attach rate", dir: "≥", target: "15%", compile: "Latest", actual: "9%", progress: 60 },
          { src: { set: "financialfigures" }, name: "Third-party service revenue", dir: "≥", target: "180M EGP", compile: "Sum", actual: "62M", progress: 34 },
          { src: { set: "financialfigures" }, name: "Out-of-warranty revenue", dir: "≥", target: "240M EGP", compile: "Sum", actual: "112M", progress: 47 },
        ],
        tactics: [
          { name: "Extended plan sales at point of sale", owner: "Rania Fahmy", q1: 1, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 48 },
          { name: "Third-party retailer service contracts", owner: "Mostafa Deif", q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 35 },
          { name: "Service pricing review", owner: "Rania Fahmy", q1: 0, q2: 1, q3: 1, q4: 0, status: "WIP", actual: 70 },
        ] },
    ] },
  it: {
    name: "IT", codePrefix: "IT", weight: 0, real: false,
    clauses: [
      ["We are", "the group's IT products and infrastructure distributor"],
      ["We provide", "distribution, configuration and infrastructure services"],
      ["For", "resellers, system integrators and corporate buyers"],
      ["Through", "a reseller network and direct infrastructure teams"],
      ["Covering", "Egypt"],
      ["Using", "vendor authorisations, technical staff and group logistics"],
    ],
    aspiration: "To be the leading distributor of IT products and infrastructure in Egypt, with services attached to every major hardware line we carry.",
    endInMind: "",
    keyObjectives: [
      { src: { set: "financialfigures" }, name: "IT distribution revenue", dir: "≥", target3y: "3.4B EGP", target: "2.2B EGP", compile: "Sum", actual: "0.98B", progress: 45 },
      { name: "Services attach rate", dir: "≥", target3y: "28%", target: "18%", compile: "Latest", actual: "11%", progress: 61 },
      { name: "Active reseller accounts", dir: "≥", target3y: "900", target: "640", compile: "Latest", actual: "471", progress: 74 },
      { name: "Inventory turns", dir: "≥", target3y: "7.0", target: "5.5", compile: "Latest", actual: "4.2", progress: 76 },
    ],
    swot: {
      s: ["Vendor authorisations across major lines", "Technical configuration capability"],
      w: ["Price-led reseller relationships", "Obsolescence risk on stock"],
      o: ["Cloud and infrastructure services", "Refurbished hardware line"],
      t: ["Vendor direct-to-reseller programmes", "Import duty changes"],
    },
    items: [
      { code: "IT01", name: "Reseller Channel Growth", sub: "",
        kind: "Direction", theme: "OT", owner: "Yasser Kamal",
        measures: [
          { name: "Active resellers", dir: "≥", target: "640", compile: "Latest", actual: "471", progress: 74 },
          { src: { set: "financialfigures" }, name: "Revenue per reseller", dir: "≥", target: "3.4M EGP", compile: "Latest", actual: "2.1M", progress: 62 },
          { name: "Reseller portal adoption", dir: "≥", target: "70%", compile: "Latest", actual: "44%", progress: 63 },
        ],
        tactics: [
          { name: "Reseller tiering and rebate scheme", owner: "Yasser Kamal", q1: 1, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 58 },
          { name: "Self-service ordering portal", owner: "Dina Shawky", q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 42 },
          { name: "Regional reseller events", owner: "Yasser Kamal", q1: 0, q2: 1, q3: 1, q4: 0, status: "WIP", actual: 65 },
        ] },
      { code: "IT02", name: "Infrastructure Services", sub: "",
        kind: "Direction", theme: "VC", owner: "Dina Shawky",
        measures: [
          { src: { set: "financialfigures" }, name: "Services revenue", dir: "≥", target: "400M EGP", compile: "Sum", actual: "178M", progress: 45 },
          { name: "Services attach rate", dir: "≥", target: "18%", compile: "Latest", actual: "11%", progress: 61 },
          { name: "Certified engineers", dir: "≥", target: "24", compile: "Latest", actual: "15", progress: 63 },
        ],
        tactics: [
          { name: "Managed infrastructure offering", owner: "Dina Shawky", q1: 1, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 45 },
          { name: "Engineer certification programme", owner: "Yasser Kamal", q1: 1, q2: 1, q3: 1, q4: 0, status: "WIP", actual: 62 },
          { name: "Cloud partner accreditation", owner: "Dina Shawky", q1: 0, q2: 0, q3: 1, q4: 1, status: "WIP", actual: 28 },
        ] },
    ] },
  logistics: {
    name: "Logistics", codePrefix: "LG", weight: 0, real: false,
    clauses: [
      ["We are", "the group's logistics and fulfilment operation"],
      ["We provide", "warehousing, line-haul, last-mile delivery and cash collection"],
      ["For", "group business units and external e-commerce and retail clients"],
      ["Through", "hubs, spokes and a contracted fleet"],
      ["Covering", "all governorates of Egypt"],
      ["Using", "owned warehousing, routing systems and a managed courier network"],
    ],
    aspiration: "To be a profitable third-party logistics business in its own right, not merely the group's internal delivery arm.",
    endInMind: "",
    keyObjectives: [
      { src: { set: "financialfigures" }, name: "Logistics revenue", dir: "≥", target3y: "2.4B EGP", target: "1.6B EGP", compile: "Sum", actual: "0.71B", progress: 44 },
      { name: "External client revenue share", dir: "≥", target3y: "45%", target: "30%", compile: "Latest", actual: "18%", progress: 60 },
      { name: "On-time delivery rate", dir: "≥", target3y: "96%", target: "92%", compile: "Latest", actual: "94%", progress: 102 },
      { src: { set: "financialfigures" }, name: "Cost per parcel", dir: "≤", target3y: "28 EGP", target: "33 EGP", compile: "Latest", actual: "39 EGP", progress: 85 },
    ],
    swot: {
      s: ["National hub-and-spoke coverage", "Captive group volume as a base load"],
      w: ["Fleet largely contracted, not owned", "Cash-on-delivery reconciliation burden"],
      o: ["Third-party e-commerce fulfilment", "Cross-border into Nigeria"],
      t: ["Well-funded courier startups", "Fuel and fleet cost inflation"],
    },
    items: [
      { code: "LG01", name: "Network Efficiency", sub: "",
        kind: "Capability", theme: "OT", owner: "Hazem Roushdy",
        measures: [
          { name: "On-time delivery", dir: "≥", target: "92%", compile: "Latest", actual: "94%", progress: 102 },
          { src: { set: "financialfigures" }, name: "Cost per parcel", dir: "≤", target: "33 EGP", compile: "Latest", actual: "39 EGP", progress: 85 },
          { name: "Hub utilisation", dir: "≥", target: "82%", compile: "Latest", actual: "68%", progress: 83 },
        ],
        tactics: [
          { name: "Route optimisation system", owner: "Hazem Roushdy", q1: 1, q2: 1, q3: 1, q4: 0, status: "WIP", actual: 72 },
          { name: "Hub capacity rebalancing", owner: "Mai Sobhy", q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 44 },
          { name: "Returns handling redesign", owner: "Hazem Roushdy", q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 38 },
        ] },
      { code: "LG02", name: "Third-Party Client Growth", sub: "",
        kind: "Direction", theme: "DIV", owner: "Mai Sobhy",
        measures: [
          { src: { set: "financialfigures" }, name: "External client revenue", dir: "≥", target: "480M EGP", compile: "Sum", actual: "192M", progress: 40 },
          { name: "Named 3PL clients", dir: "≥", target: "40", compile: "Latest", actual: "23", progress: 58 },
          { name: "Client retention", dir: "≥", target: "85%", compile: "Latest", actual: "74%", progress: 87 },
        ],
        tactics: [
          { name: "3PL commercial proposition and pricing", owner: "Mai Sobhy", q1: 1, q2: 1, q3: 1, q4: 0, status: "WIP", actual: 68 },
          { name: "Client onboarding and SLA framework", owner: "Hazem Roushdy", q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 40 },
          { name: "Fulfilment-as-a-service pilot", owner: "Mai Sobhy", q1: 0, q2: 0, q3: 1, q4: 1, status: "WIP", actual: 26 },
        ] },
    ] },
  nigeria: {
    name: "Nigeria", codePrefix: "NG", weight: 0, real: false,
    clauses: [
      ["We are", "the group's Nigerian distribution operation"],
      ["We provide", "mobile and consumer electronics distribution and retail supply"],
      ["For", "local retail chains, independent dealers and operators"],
      ["Through", "a Lagos hub and regional dealer partners"],
      ["Covering", "Nigeria, focused on Lagos, Abuja and Port Harcourt"],
      ["Using", "group brand relationships and an asset-light local structure"],
    ],
    aspiration: "To have proven the group's distribution model outside Egypt, with Nigeria standing on its own commercially and ready to be repeated elsewhere.",
    endInMind: "",
    keyObjectives: [
      { src: { set: "financialfigures" }, name: "Nigeria revenue", dir: "≥", target3y: "2.2B EGP", target: "1.1B EGP", compile: "Sum", actual: "0.38B", progress: 35 },
      { name: "Local dealer accounts", dir: "≥", target3y: "420", target: "240", compile: "Latest", actual: "138", progress: 58 },
      { name: "Contribution margin", dir: "≥", target3y: "6.0%", target: "4.2%", compile: "Latest", actual: "2.6%", progress: 62 },
      { name: "Working capital cycle", dir: "≤", target3y: "55 d", target: "70 d", compile: "Latest", actual: "91 d", progress: 77 },
    ],
    swot: {
      s: ["Group brand relationships transfer", "Asset-light entry keeps risk contained"],
      w: ["Thin local management bench", "Limited local credit history"],
      o: ["Large underserved dealer base", "Second market as a repeatable template"],
      t: ["Currency convertibility and repatriation", "Regulatory and import unpredictability"],
    },
    items: [
      { code: "NG01", name: "Market Establishment", sub: "",
        kind: "Direction", theme: "DIV", owner: "Chidi Okafor",
        measures: [
          { name: "Dealer accounts", dir: "≥", target: "240", compile: "Latest", actual: "138", progress: 58 },
          { name: "Cities covered", dir: "≥", target: "6", compile: "Latest", actual: "3", progress: 50 },
          { name: "Brand lines carried", dir: "≥", target: "5", compile: "Latest", actual: "3", progress: 60 },
        ],
        tactics: [
          { name: "Lagos hub and warehousing", owner: "Chidi Okafor", q1: 1, q2: 1, q3: 0, q4: 0, status: "WIP", actual: 85 },
          { name: "Regional dealer recruitment", owner: "Amaka Eze", q1: 1, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 52 },
          { name: "Local brand agreements", owner: "Chidi Okafor", q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 40 },
        ] },
      { code: "NG02", name: "Commercial Viability", sub: "",
        kind: "Direction", theme: "VC", owner: "Amaka Eze",
        measures: [
          { name: "Contribution margin", dir: "≥", target: "4.2%", compile: "Latest", actual: "2.6%", progress: 62 },
          { name: "Working capital cycle", dir: "≤", target: "70 d", compile: "Latest", actual: "91 d", progress: 77 },
          { name: "Overhead ratio", dir: "≤", target: "9%", compile: "Latest", actual: "13%", progress: 69 },
        ],
        tactics: [
          { name: "Local credit and collections policy", owner: "Amaka Eze", q1: 1, q2: 1, q3: 1, q4: 0, status: "WIP", actual: 60 },
          { name: "Cost base review", owner: "Chidi Okafor", q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 44 },
          { name: "Repatriation and FX hedging plan", owner: "Amaka Eze", q1: 0, q2: 1, q3: 1, q4: 1, status: "WIP", actual: 36 },
        ] },
    ] }
};
