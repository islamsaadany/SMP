/* THE DEMO'S INSIGHTS REPORTS (2026-09-30, point 19).
   Islam: *"don't we have any insights reports in meridian?"*, then "19 yes" to
   five invented reports, one per library category. Everything here is
   ILLUSTRATIVE: no real company, source or figure, and every page says so in
   its footer. The words are also run through the demo's real-name refusal
   (scripts/seed-demo-client.js) by the seeder before anything is uploaded.

   `REPORTS` is what the seeder reads (title, summary, categories, date, file).
   Running this file renders each report to a PDF beside it with the local
   Chromium, and the PDFs are committed: the production build uploads bytes,
   it never needs a browser.

     node scripts/demo-reports/reports.mjs        (from the repository root)
*/
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

export const REPORTS = [
  {
    file: "home-electronics-demand-outlook-h2-2026.pdf",
    title: "Home electronics demand outlook, H2 2026",
    summary: "Demand for large appliances and TVs should recover modestly in the second half as prices settle, with instalment plans carrying a growing share of sales.",
    categories: ["Market"], date: "2026-07-15",
    sections: [
      ["Summary", [
        "Second-half demand for home electronics is expected to grow 4–6% over the first half, after two quarters of price-led softness.",
        "Instalment and buy-now-pay-later plans now fund an estimated one in three large-appliance purchases, up from one in five a year ago.",
        "Premium TVs and inverter air conditioners lead the recovery; small appliances stay flat.",
      ]],
      ["What we see", [
        "Retail prices rose sharply in H1 and are now stabilising, which historically releases deferred purchases within two quarters.",
        "Dealer inventory is lean going into Q4, so availability, not demand, is the more likely constraint on the busy season.",
      ]],
      ["Demand by category, H2 vs H1 (illustrative)", null, [
        ["Category", "H2 vs H1", "Main driver"],
        ["Televisions (55\" and up)", "+9%", "Replacement cycle, sports season"],
        ["Air conditioners (inverter)", "+7%", "Energy running costs"],
        ["Refrigerators", "+4%", "Instalment plans"],
        ["Washing machines", "+3%", "New housing completions"],
        ["Small appliances", "0%", "Price sensitivity"],
      ]],
      ["What it means for Meridian", [
        "Home Electronics should secure Q4 stock for premium TVs and inverter AC now, while principals still have allocation.",
        "Extend the warranty bundles to the instalment channel, where attach rates run highest.",
        "Plan dealer credit limits for a heavier Q4 than the first-half run rate suggests.",
      ]],
    ],
  },
  {
    file: "device-distribution-margins-and-channel-shifts.pdf",
    title: "Device distribution: margins and channel shifts",
    summary: "Distributor margins on devices keep narrowing as brands sell more directly; the durable margin sits in services, accessories and B2B ordering platforms.",
    categories: ["Sector"], date: "2026-06-20",
    sections: [
      ["Summary", [
        "Average distributor gross margin on devices has narrowed by roughly half a point a year for three years.",
        "Brands are shifting volume to their own online stores and to large retailers directly, leaving distributors the long tail of small resellers.",
        "Distributors holding margin are those earning on what surrounds the device: accessories, financing, repair and B2B ordering tools.",
      ]],
      ["Where the margin sits (illustrative)", null, [
        ["Revenue line", "Share of revenue", "Share of gross profit"],
        ["Devices", "82%", "58%"],
        ["Accessories", "9%", "19%"],
        ["Services and warranty", "4%", "13%"],
        ["Financing and B2B platform fees", "5%", "10%"],
      ]],
      ["Channel shifts", [
        "Small resellers increasingly order through B2B apps rather than by phone or in person, which makes ordering data a strategic asset.",
        "Entry and mid-range devices move fastest through these apps; premium stays with large retail.",
      ]],
      ["What it means for Meridian", [
        "Devices should treat TradeLink as the main route to small resellers, not a side channel.",
        "Accessory and service attach targets deserve the same weight as device share in the Devices plan.",
        "A cost-to-serve view per channel would show where volume is being bought at a loss.",
      ]],
    ],
  },
  {
    file: "currency-and-consumer-spending-mid-year-view.pdf",
    title: "Currency and consumer spending, mid-year view",
    summary: "A steadier currency and slowing inflation should ease pressure on household budgets into 2027, but imported goods will stay expensive relative to incomes.",
    categories: ["Macro"], date: "2026-08-10",
    sections: [
      ["Summary", [
        "The currency has traded in a narrow band since the spring, which has let importers plan prices a quarter ahead again.",
        "Headline inflation is slowing but remains in double digits; real incomes are recovering slowly.",
        "Households are trading down within categories rather than leaving them.",
      ]],
      ["Indicators to watch (illustrative)", null, [
        ["Indicator", "Six months ago", "Now", "Direction"],
        ["Headline inflation", "24%", "17%", "Easing"],
        ["Policy interest rate", "25.5%", "23.0%", "Easing"],
        ["Currency volatility (3-month)", "High", "Low", "Steadier"],
        ["Consumer confidence index", "82", "88", "Improving"],
      ]],
      ["Risks", [
        "A renewed currency move would reprice imported stock within weeks.",
        "Rate cuts may be slower than markets expect if inflation stalls.",
      ]],
      ["What it means for Meridian", [
        "Treasury should keep hedging cover high through Q4 while it is cheap to hold.",
        "Financing offers become more attractive to customers as rates fall; Finance and the B2C units should plan for it together.",
        "Price architecture should protect entry price points, where trading down lands.",
      ]],
    ],
  },
  {
    file: "ramadan-2026-in-store-sales-review.pdf",
    title: "Ramadan 2026 in-store sales review",
    summary: "Ramadan lifted in-store revenue by a fifth over a normal month, driven by basket size rather than footfall; evening hours and gifting bundles did the most work.",
    categories: ["Analysis"], date: "2026-04-12",
    sections: [
      ["Summary", [
        "Revenue across the store network during Ramadan ran 21% above an average month.",
        "Footfall rose only 6%; the rest came from a larger basket, led by gifting bundles and small appliances.",
        "Stores that extended evening hours captured most of the uplift.",
      ]],
      ["Results by region (illustrative)", null, [
        ["Region", "Revenue vs normal month", "Basket vs normal", "Footfall vs normal"],
        ["Greater Cairo", "+24%", "+15%", "+8%"],
        ["Alexandria", "+22%", "+14%", "+7%"],
        ["Delta", "+18%", "+13%", "+4%"],
        ["Upper Egypt", "+14%", "+11%", "+3%"],
      ]],
      ["What worked", [
        "Evening opening to midnight: 38% of Ramadan revenue came after 8 pm.",
        "Pre-packed gifting bundles at three price points.",
        "Instalment offers promoted at the till rather than only in advertising.",
      ]],
      ["What it means for Meridian", [
        "Retail should plan Ramadan 2027 staffing around evening hours from the start.",
        "The monthly revenue plan should keep the Ramadan peak; spreading it evenly understates February and March.",
        "Upper Egypt's smaller lift points to store location as much as season, which the site selection work already targets.",
      ]],
    ],
  },
  {
    file: "running-a-half-yearly-strategy-review.pdf",
    title: "Running a half-yearly strategy review",
    summary: "A practical guide to the half-year review: what each unit prepares, how the session runs, and how decisions are followed through.",
    categories: ["Governance"], date: "2026-09-05",
    sections: [
      ["Summary", [
        "A half-yearly review works when figures are in before the meeting, the meeting is spent on decisions, and every decision has an owner and a date.",
        "This guide sets out a four-week rhythm the Strategy Office can run with every unit.",
      ]],
      ["The four-week rhythm", null, [
        ["Week", "What happens", "Who"],
        ["1", "Units report every figure and note on the platform", "Unit custodians"],
        ["2", "The Strategy Office checks completeness and flags off-track rows", "Strategy Office"],
        ["3", "Review sessions: one hour per company, decisions only", "CEOs, unit heads"],
        ["4", "Decisions logged as actions with owners and dates", "Strategy Office"],
      ]],
      ["Rules that keep it honest", [
        "No figure is discussed that is not on the platform.",
        "Every red figure comes with a note before the session, not during it.",
        "The deck is drawn from the platform; nobody builds slides by hand.",
        "A decision without an owner and a date is not a decision.",
      ]],
      ["What it means for Meridian", [
        "The H2 2026 cycle can run to this rhythm with the tools already in place: the reporting cycle, the Focus board and the review deck.",
        "The Internal Tracker holds the decisions from each session, so the next review opens on what was done.",
      ]],
    ],
  },
];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function html(r) {
  const body = r.sections.map(([h, paras, table]) =>
    "<h2>" + esc(h) + "</h2>" +
    (paras ? "<ul>" + paras.map((p) => "<li>" + esc(p) + "</li>").join("") + "</ul>" : "") +
    (table ? "<table><thead><tr>" + table[0].map((c) => "<th>" + esc(c) + "</th>").join("") +
      "</tr></thead><tbody>" + table.slice(1).map((row) =>
        "<tr>" + row.map((c) => "<td>" + esc(c) + "</td>").join("") + "</tr>").join("") +
      "</tbody></table>" : "")).join("");
  const d = new Date(r.date + "T00:00:00Z").toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: A4; margin: 22mm 20mm 24mm; }
    body { font-family: "Source Sans 3", "Helvetica Neue", Arial, sans-serif; color: #1F2733; font-size: 11pt; line-height: 1.5; }
    .band { border-top: 5px solid #16325C; padding-top: 10px; display: flex; justify-content: space-between; align-items: baseline; }
    .band b { color: #16325C; letter-spacing: .14em; font-size: 9pt; text-transform: uppercase; }
    .band span { color: #8A6D1F; font-size: 9pt; letter-spacing: .08em; text-transform: uppercase; }
    h1 { font-size: 22pt; line-height: 1.2; color: #16325C; margin: 18px 0 6px; }
    .date { color: #5B6573; font-size: 10pt; margin-bottom: 14px; }
    .lede { font-size: 12pt; border-left: 3px solid #C9A646; padding-left: 12px; margin: 0 0 18px; }
    h2 { font-size: 12pt; color: #16325C; margin: 20px 0 6px; border-bottom: 1px solid #D9DEE6; padding-bottom: 4px; }
    ul { margin: 6px 0 0; padding-left: 18px; } li { margin: 0 0 5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10pt; font-variant-numeric: tabular-nums; }
    th { background: #16325C; color: #fff; text-align: left; padding: 6px 8px; font-size: 8.5pt; letter-spacing: .06em; text-transform: uppercase; }
    td { padding: 6px 8px; border-bottom: 1px solid #E3E7EE; }
    tr:nth-child(even) td { background: #F5F7FA; }
  </style></head><body>
    <div class="band"><b>Forefront &middot; Insights for Meridian Group</b><span>${esc(r.categories.join(" · "))}</span></div>
    <h1>${esc(r.title)}</h1>
    <div class="date">${esc(d)}</div>
    <p class="lede">${esc(r.summary)}</p>
    ${body}
  </body></html>`;
}

export function reportText(r) {
  return [r.title, r.summary].concat(...r.sections.map(([h, p, t]) => [h].concat(p || [], ...(t || [])))).join("\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { chromium } = await import(join(here, "..", "..", "smp-app", "node_modules", "playwright-core", "index.mjs"));
  const b = await chromium.launch({ executablePath: process.env.SMP_CHROME || "/opt/pw-browsers/chromium" });
  const page = await b.newPage();
  for (const r of REPORTS) {
    await page.setContent(html(r), { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4", printBackground: true, displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: '<div style="width:100%;font-size:7.5pt;color:#6B7480;padding:0 20mm;display:flex;justify-content:space-between;font-family:Arial,sans-serif">' +
        "<span>Demo content &middot; illustrative figures, not a real market source</span>" +
        '<span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>',
      margin: { top: "22mm", bottom: "24mm", left: "20mm", right: "20mm" },
    });
    writeFileSync(join(here, r.file), pdf);
    console.log("wrote " + r.file + " — " + pdf.length + " bytes");
  }
  await b.close();
}
