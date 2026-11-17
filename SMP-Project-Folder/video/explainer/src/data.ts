/* The demo company. Invented, every name and every figure. */
export const GROUP = "Meridian Group";
export const CYCLE = "H1 2026";
export const UNITS = ["Retail", "Distribution", "E-commerce", "Logistics", "Services"];
export const FUNCTIONS = ["Finance", "HR", "Marketing", "IT"];
export const UNIT = "Retail";
export const SEAT = { name: "Laila Mansour", role: "Head of Retail" };
export const CEO = { name: "Group CEO", role: "Group CEO" };

export const FOUNDATION = {
  whoWeAre: [
    ["We are", "a multi-channel technology retailer"],
    ["We provide", "consumer electronics, appliances and service"],
    ["For", "households and small businesses"],
    ["Across", "120 stores and online"],
    ["We facilitate", "choice, financing and after-sales care"],
  ],
  aspiration:
    "To be the most trusted place to buy and service technology in the region, growing faster than the market, with a store in every major city.",
  endInMind: "To be the region's first choice for technology at home and at work.",
  horizon: "2028",
  objectives: [
    { name: "Revenue", thisYear: "4.2B EGP", horizon: "6.0B EGP" },
    { name: "Market share", thisYear: "18 %", horizon: "24 %" },
    { name: "Stores operating", thisYear: "120", horizon: "160" },
    { name: "Net promoter score", thisYear: "45", horizon: "60" },
  ],
};

export const SWOT = {
  strengths: ["Trusted brand", "Nationwide store network", "Strong vendor relationships", "Own service centres"],
  weaknesses: ["Low online share of sales", "Ageing store systems", "High staff turnover", "Thin accessories range"],
  opportunities: ["Online and app growth", "Trade-in and financing", "Smart-home category", "Regional expansion"],
  threats: ["Marketplace competition", "Grey imports", "Currency pressure", "Rent inflation"],
};

export const PILLARS = [
  { id: "RT01", name: "Omnichannel Growth", score: 74 },
  { id: "RT02", name: "Store Network & Experience", score: 88 },
  { id: "RT03", name: "Service & Loyalty", score: 92 },
  { id: "RT04", name: "Operational Excellence", score: 61 },
];

export const KEY_MEASURES = [
  { name: "Online share of sales", dir: "≥", target: "15 %", compile: "Latest", ytdTarget: "15 %", actual: "11 %", progress: 73 },
  { name: "Click-and-collect orders", dir: "≥", target: "120,000 #", compile: "Sum", ytdTarget: "60,000 #", actual: "52,000 #", progress: 87 },
  { name: "App active users", dir: "≥", target: "400,000 #", compile: "Latest", ytdTarget: "400,000 #", actual: "310,000 #", progress: 78 },
  { name: "Conversion rate", dir: "≥", target: "2.5 %", compile: "Latest", ytdTarget: "2.5 %", actual: "2.2 %", progress: 88 },
];

export const TACTICS = [
  { name: "Launch the new online store", outcome: "Online store live", target: "1 #", owner: "Dina Hassan", quarters: [1, 2], actual: "1", progress: 100 },
  { name: "Click and collect in every store", outcome: "Stores offering pickup", target: "120 #", owner: "Omar Farid", quarters: [2, 3], actual: "74", progress: 62 },
  { name: "Loyalty app relaunch", outcome: "App active users", target: "400,000 #", owner: "Dina Hassan", quarters: [2, 3, 4], actual: "310,000", progress: 78 },
  { name: "Marketplace listings", outcome: "SKUs listed", target: "5,000 #", owner: "Karim Nabil", quarters: [3, 4], actual: "—", progress: 0 },
];

export const REPORT_KO = [
  { name: "Revenue", dir: "≥", ytd: "2.1B EGP", of: "of 4.2B EGP", value: "1.9B", unit: "EGP", note: "" },
  { name: "Market share", dir: "≥", ytd: "18 %", of: "", value: "17", unit: "%", note: "" },
  { name: "Stores operating", dir: "≥", ytd: "120", of: "", value: "116", unit: "", note: "Four openings moved to Q3 while leases are renegotiated." },
  { name: "Net promoter score", dir: "≥", ytd: "45", of: "", value: "47", unit: "", note: "" },
];

export const PERF = { ko: 85, pillars: 79, execution: 62, koDelta: 6 };

export const GROUP_PERF = {
  cards: [
    { title: "Group key objectives", value: 83, sub: "The group's own 5 objectives, each scored against its target." },
    { title: "Business units — performance", value: 81, sub: "All 5 business units' own key objectives.", delta: 4 },
    { title: "Business units — execution", value: 64, sub: "All 5 business units, each on its own execution." },
    { title: "Supporting functions — performance", value: 78, sub: "All 4 supporting functions' own key objectives." },
    { title: "Supporting functions — execution", value: 90, sub: "All 4 supporting functions, each on its own execution." },
  ],
  units: [
    { name: "Logistics", value: 63, exec: 58 },
    { name: "E-commerce", value: 71, exec: 55 },
    { name: "Retail", value: 79, exec: 62 },
    { name: "Services", value: 84, exec: 70 },
    { name: "Distribution", value: 91, exec: 74 },
  ],
  functions: [
    { name: "IT", value: 69 },
    { name: "HR", value: 74 },
    { name: "Marketing", value: 80 },
    { name: "Finance", value: 88 },
  ],
};

export const FOCUS = [
  { where: "Retail", name: "Market share", source: "Key objectives", target: "18%", actual: "17%", progress: 94, earning: true },
  { where: "", name: "Online share of sales", source: "RT01", target: "15%", actual: "11%", progress: 73, earning: false },
  { where: "Distribution", name: "Fill rate", source: "Key objectives", target: "96%", actual: "97%", progress: 101, earning: true },
  { where: "Services", name: "First-time fix rate", source: "SV01", target: "85%", actual: "88%", progress: 104, earning: true },
  { where: "Logistics", name: "On-time delivery", source: "Key objectives", target: "94%", actual: "95%", progress: 101, earning: true },
  { where: "", name: "Cost per drop", source: "LG02", target: "42", actual: "51", progress: 82, earning: false },
];

export const FN = {
  name: "Marketing",
  objectives: [
    { name: "Marketing-qualified leads", thisYear: "12,000", horizon: "20,000" },
    { name: "Cost per acquisition", thisYear: "85 EGP", horizon: "60 EGP" },
  ],
  project: {
    id: "MKT01",
    name: "Brand refresh and campaign",
    owner: "Yara Samir",
    start: "Q1 2026",
    end: "Q3 2026",
    brief: "Establish what the market believes about us today, and agree what we want it to believe instead.",
    deliverables: [
      { name: "Brand guidelines approved", type: "Deliverable", dir: "=", target: "Y/N" },
      { name: "Campaign launched across channels", type: "Deliverable", dir: "=", target: "Y/N" },
      { name: "Unaided brand awareness", type: "Outcome", dir: "≥", target: "40 %" },
    ],
    milestones: [
      { name: "Perception study fielded", owner: "Yara Samir", due: "March 2026" },
      { name: "Creative approved by the board", owner: "Yara Samir", due: "June 2026" },
      { name: "Campaign on air", owner: "Hany Adel", due: "September 2026" },
    ],
  },
};

export const TEMPLE = {
  vision: "To be the region's most trusted technology partner for homes and businesses, growing faster than the market and known for service.",
  objectives: [
    ["Revenue", "6.0B EGP"],
    ["EBITDA", "7.0 %"],
    ["Market share", "24 %"],
  ],
  themes: [
    ["OM", "One Meridian", "New for 2026"],
    ["DS", "Deepen Service", "Standing"],
    ["RE", "Expand Regionally", "Standing"],
  ],
  capabilities: ["Data & Analytics", "People Development"],
};

export const DECK_SLIDES = ["Retail", "Foundation", "Who we are", "What we are aiming at", "Key Objectives — where we stand", "SWOT", "Strengths", "Weaknesses", "Opportunities", "Threats", "Strategic Pillars", "RT01 · Key measures", "RT01 · Tactics", "RT02 · Key measures"];
