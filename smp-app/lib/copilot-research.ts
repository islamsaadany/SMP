/* ══ THE DEEP RESEARCH PROMPTS (§480), CARRIED VERBATIM ════════════════
   Copied unchanged from the original Copilot
   (strategy-formulation/lib/prompts/deep-research-prompts.ts). Islam's rule:
   the questions and prompts are the original's, word for word — never
   rewritten here. The SWOT flow downloads one of these as a .txt, the
   person runs it outside the platform, and uploads the answer as a source.
   Everything below this comment is the original file. ══════════════════ */
/**
 * Deep Research Prompts for Porter's 5 Forces and DESTEP Analysis
 * These prompts are designed for use with AI research tools like ChatGPT Deep Research, Perplexity, etc.
 */

export interface CompanyContext {
  companyName: string
  industry: string
  whoWeAre: string
  purpose: string
  winningAspiration: string
  northStar: string
  region?: string
}

/**
 * Porter's Five Forces - Comprehensive Deep Research Prompt
 */
export function generatePorterResearchPrompt(context: CompanyContext): string {
  return `PORTER'S FIVE FORCES – COMPREHENSIVE DEEP RESEARCH PROMPT

Role & Mindset

You are a senior strategy consultant conducting a decision-grade Porter's Five Forces analysis to support executive-level strategic planning.

Your analysis must be:
- Evidence-based and skeptical
- Industry-first, not company-biased
- Forward-looking (3–5 years)
- Action-oriented, not theoretical
- Free of generic MBA phrasing

Explicitly state assumptions where data is uncertain.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 1 – COMPANY & STRATEGIC CONTEXT (INTERPRETIVE LENS)

Company Context:
• Company: ${context.companyName}
• Industry: ${context.industry}
• Who We Are: ${context.whoWeAre || 'Not defined'}
• Purpose: ${context.purpose || 'Not defined'}
• Winning Aspiration: ${context.winningAspiration || 'Not defined'}
• North Star: ${context.northStar || 'Not defined'}

Instruction: Use this information only when interpreting implications and strategic options, not when defining industry structure or force strength.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 2 – INDUSTRY DEFINITION & BOUNDARIES

Clearly define:
• Industry scope (what is included / excluded)
• Position in the value chain
• Key customer segments
• Adjacent or overlapping industries

Call out:
• Boundary assumptions
• Regional or regulatory nuances
• Any ambiguity that may distort force analysis

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 3 – PORTER'S FIVE FORCES (DEEP ANALYSIS)

Analyze each force independently using the structure below.

─────────────────────────────────────────────────────────────
1. THREAT OF NEW ENTRANTS
─────────────────────────────────────────────────────────────

Industry Entry Structure
• What are the minimum requirements to enter this industry (capital, licenses, capabilities, technology)?
• Which barriers are structural vs artificial?

Economics & Scale
• How strong are economies of scale or scope?
• At what point does scale become defensible?

Access & Control
• How difficult is access to:
  - Distribution channels?
  - Key customers?
  - Critical inputs or proprietary assets?

Regulation & Policy
• What regulatory constraints limit entry today?
• Are these tightening or loosening?

Recent Evidence
• Who has entered or exited in the last 3–5 years?
• What does this indicate about entry feasibility?

Forward-Looking Risk
• What types of entrants are most likely next (tech-enabled, regional, adjacent-industry players)?

Force Strength Assessment
• Rate the threat: Very Weak / Weak / Moderate / Strong / Very Strong
• Justify explicitly.

─────────────────────────────────────────────────────────────
2. BARGAINING POWER OF SUPPLIERS
─────────────────────────────────────────────────────────────

Supplier Landscape
• Who are the critical suppliers?
• How concentrated or fragmented are they?

Input Criticality
• Which inputs materially impact cost, quality, or differentiation?
• How substitutable are these inputs?

Switching Costs
• What are the real costs (financial, operational, time) of switching suppliers?

Forward Integration Risk
• Can suppliers realistically move downstream?

Cost Pass-Through
• How easily do suppliers pass cost increases to industry players?

Trends
• Are suppliers consolidating, fragmenting, or being disrupted by technology?

Force Strength Assessment
• Rate the power of suppliers and justify.

─────────────────────────────────────────────────────────────
3. BARGAINING POWER OF BUYERS
─────────────────────────────────────────────────────────────

Buyer Concentration
• How concentrated are buyers relative to industry players?

Buyer Sophistication
• How informed, price-sensitive, and demanding are buyers?

Switching Behavior
• What are the true switching costs (financial, operational, emotional)?

Backward Integration Risk
• Can buyers realistically integrate upstream?

Price vs Value Orientation
• Do buyers primarily compete on price or on differentiated value?

Segment Differences
• Which customer segments exert the most pressure—and why?

Force Strength Assessment
• Rate buyer power and justify.

─────────────────────────────────────────────────────────────
4. THREAT OF SUBSTITUTES
─────────────────────────────────────────────────────────────

Functional Alternatives
• What alternative solutions satisfy the same underlying customer need?

Relative Value Proposition
• How do substitutes compare on:
  - Price
  - Convenience
  - Performance
  - Risk

Switching Triggers
• What events or conditions cause customers to switch?

Technology & Business Model Shifts
• Are new substitutes emerging due to technology or platform models?

Adoption Speed
• How fast could substitutes scale realistically?

Force Strength Assessment
• Rate substitution threat and justify.

─────────────────────────────────────────────────────────────
5. INTENSITY OF COMPETITIVE RIVALRY
─────────────────────────────────────────────────────────────

Competitive Set
• Who are the true direct competitors?
• How concentrated is the market (CR3 / CR5 where possible)?

Basis of Competition
• Is rivalry driven by price, innovation, brand, access, speed, or scale?

Cost Structure
• How do fixed costs, capacity utilization, and exit barriers affect behavior?

Growth Dynamics
• Is market growth sufficient to avoid zero-sum competition?

Recent Competitive Moves
• Price wars, aggressive expansion, M&A, capability arms races?

Future Outlook
• Is rivalry likely to intensify, stabilize, or rationalize—and why?

Force Strength Assessment
• Rate rivalry intensity and justify.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4 – INTERDEPENDENCIES BETWEEN FORCES

• How do forces reinforce or weaken each other?
• Identify second-order and non-obvious effects.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 – OVERALL INDUSTRY ATTRACTIVENESS

Synthesize all five forces into a coherent view.

Under what conditions is the industry:
• Attractive to enter?
• Attractive to scale?
• Primarily defensive?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 – STRATEGIC IMPLICATIONS & WHITE SPACES

Using the company context:
• Which positions are defensible?
• Which positions are structurally fragile?
• Where do white spaces exist?
• What strategic moves are enabled or constrained?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 – EXECUTIVE SUMMARY (1-PAGE STYLE)

• Key insight per force
• 3–5 non-obvious takeaways
• Clear "So What?" for leadership

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OUTPUT RULES

• Use real company names and data where possible
• Cite sources (preferably 2024–2026)
• Flag assumptions and uncertainty
• No generic textbook language
• Write for senior executives and strategy leaders`
}

/**
 * DESTEP Analysis - Comprehensive Deep Research Prompt
 */
export function generateDestepResearchPrompt(context: CompanyContext): string {
  return `DESTEP ANALYSIS – COMPREHENSIVE DEEP RESEARCH PROMPT

Role & Mindset

You are a senior strategy consultant conducting a DESTEP macro-environment analysis to support executive strategic planning and long-term decision-making.

Your analysis must:
- Focus on material forces only (not a laundry list)
- Be forward-looking (3–5 years)
- Identify signals, trends, and uncertainties
- Translate macro factors into strategic implications
- Avoid generic or purely descriptive PEST commentary

Explicitly state assumptions and uncertainty.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 1 – COMPANY & STRATEGIC CONTEXT (INTERPRETIVE LENS)

Company Context:
• Company: ${context.companyName}
• Industry: ${context.industry}
• Who We Are: ${context.whoWeAre || 'Not defined'}
• Purpose: ${context.purpose || 'Not defined'}
• Winning Aspiration: ${context.winningAspiration || 'Not defined'}
• North Star: ${context.northStar || 'Not defined'}

Instruction: Use this context only to interpret impact and implications, not to select or exaggerate macro trends.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 2 – SCOPE & TIME HORIZON

• Geography: ${context.region || 'Primary operating markets'}
• Industry scope: ${context.industry}
• Time horizon: Current state + 3–5 years
• Exclusions (if any): As appropriate

Clarify what does not matter as much as what does.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 3 – DESTEP FACTORS (DEEP ANALYSIS)

Analyze each DESTEP dimension independently using the structure below.

─────────────────────────────────────────────────────────────
D – DEMOGRAPHIC FACTORS
─────────────────────────────────────────────────────────────

Population Dynamics
• How are population size, growth, and age structure changing?
• Urbanization vs rural shifts?

Workforce & Talent
• Labor availability, skills, participation rates?
• Migration or brain drain effects?

Household & Social Structure
• Household size, income distribution, dependency ratios?

Demand Implications
• How do these shifts affect demand size, mix, and expectations?

Forward Signals (3–5 Years)
• What demographic trends are locked-in vs uncertain?

Strategic Implications
• Which business models benefit or suffer?

─────────────────────────────────────────────────────────────
E – ECONOMIC FACTORS
─────────────────────────────────────────────────────────────

Macro Conditions
• GDP growth, inflation, interest rates, FX stability?

Income & Purchasing Power
• Real income trends and consumer/business spending power?

Cost Structures
• Energy, labor, logistics, financing costs?

Capital Availability
• Access to credit, investment appetite, funding trends?

Economic Cyclicality
• Sensitivity to downturns or shocks?

Forward Outlook
• Expected macro scenarios and their likelihood?

Strategic Implications
• Pricing power, investment timing, risk exposure?

─────────────────────────────────────────────────────────────
S – SOCIO-CULTURAL FACTORS
─────────────────────────────────────────────────────────────

Values & Attitudes
• Shifts in consumer expectations, trust, ethics, sustainability?

Behavioral Changes
• Buying behavior, loyalty, digital adoption, risk tolerance?

Lifestyle & Work Patterns
• Remote work, convenience orientation, wellness focus?

Cultural Constraints
• Social norms or taboos affecting adoption?

Emerging Signals
• Early behavioral shifts worth monitoring?

Strategic Implications
• Brand positioning, value propositions, experience design?

─────────────────────────────────────────────────────────────
T – TECHNOLOGICAL FACTORS
─────────────────────────────────────────────────────────────

Technology Landscape
• Key technologies affecting the industry?

Adoption Curve
• Early-stage, scaling, or mature?

Cost & Accessibility
• Is technology becoming cheaper or more complex?

Disruption Risk
• Which technologies could invalidate current models?

Enablers vs Threats
• Where does tech create advantage vs commoditization?

Time Horizon
• What is realistic within 3–5 years?

Strategic Implications
• Capability investments, partnerships, obsolescence risk?

─────────────────────────────────────────────────────────────
E – ENVIRONMENTAL FACTORS
─────────────────────────────────────────────────────────────

Regulatory & Policy Pressure
• Environmental regulations or standards tightening?

Resource Availability
• Water, energy, raw material constraints?

Climate & Physical Risks
• Exposure to climate events or disruptions?

Sustainability Expectations
• Stakeholder pressure on ESG performance?

Cost & Compliance Impact
• Cost of compliance vs cost of inaction?

Forward Outlook
• Likely escalation areas?

Strategic Implications
• Operational resilience, compliance strategy, differentiation?

─────────────────────────────────────────────────────────────
P – POLITICAL & LEGAL FACTORS
─────────────────────────────────────────────────────────────

Political Stability
• Stability, governance quality, policy predictability?

Regulatory Environment
• Industry-specific regulation, licensing, compliance burden?

Trade & Geopolitics
• Tariffs, sanctions, regional conflicts?

Legal Framework
• Contract enforcement, labor laws, data/privacy laws?

Policy Direction
• Likely policy shifts affecting the industry?

Strategic Implications
• Risk mitigation, localization, structural constraints?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4 – CROSS-FACTOR INSIGHTS & INTERACTIONS

• Where do DESTEP factors reinforce or contradict each other?
• Identify compounding risks or amplifying opportunities.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 – MATERIALITY ASSESSMENT

Which 5–7 macro factors matter most?
Which are noise?

Rank factors by:
• Impact
• Uncertainty
• Urgency

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 – STRATEGIC IMPLICATIONS & OPTIONS

Using the company context:
• What must the company adapt to?
• What can it exploit?
• What must it hedge against?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 – EXECUTIVE SUMMARY (1-PAGE STYLE)

• Key macro shifts
• Critical uncertainties
• Strategic "So What?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OUTPUT RULES

• Focus on material insights only
• Use evidence and recent data where possible (2024–2026)
• Explicitly flag assumptions
• No generic macro commentary
• Write for executives and strategy leaders`
}
