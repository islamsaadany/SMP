/* The "Help me understand" library, carried verbatim from the old Strategy
   Copilot (strategy_copilot/lib/data/expanded-explanations.ts), §482.2.
   Islam: "fetch the old library don't write a new one". The text below the
   marker is that file unchanged; what is added after it is only how a SWOT
   question key and a client's industry find their entry. */
// Expanded explanations for analysis questions by industry
// Users can click "Help me understand" to see these explanations

export type Industry = 
  | 'Technology'
  | 'Healthcare'
  | 'Financial Services'
  | 'Manufacturing'
  | 'Retail'
  | 'Professional Services'
  | 'Education'
  | 'Real Estate'
  | 'Energy'
  | 'Transportation'
  | 'Hospitality'
  | 'Media & Entertainment'
  | 'Agriculture'
  | 'Construction'
  | 'Telecommunications'
  | 'Other';

export interface ExpandedExplanation {
  simplerTerms: string;
  thinkAbout: string[];
  exampleResponse: string;
}

/**
 * DESTEP_EXPLANATIONS
 * Focuses on Macro-environmental factors.
 */
export const DESTEP_EXPLANATIONS: Record<string, Record<Industry, ExpandedExplanation>> = {
  demographics: {
    Technology: {
      simplerTerms: "How do workforce and user demographics impact your software adoption?",
      thinkAbout: [
        "Is digital literacy increasing in your target market?",
        "Are remote workers (your potential users) growing?",
        "What's the age distribution of decision-makers buying your product?",
        "Are there enough skilled workers for your clients to implement your solution?"
      ],
      exampleResponse: "Our B2B clients are seeing a workforce shift - 40% now work remotely at least part-time. Decision-makers are getting younger and more open to cloud solutions."
    },
    Healthcare: {
      simplerTerms: "How are changes in your patient population affecting healthcare demand?",
      thinkAbout: [
        "Is the population in your service area aging?",
        "Are younger families moving into or out of your area?",
        "What's the insurance coverage demographic like?",
        "Are there immigrant communities with specific health needs?"
      ],
      exampleResponse: "We're seeing an aging population; 22% are now over 65. This is increasing demand for chronic disease management and home healthcare services."
    },
    "Financial Services": {
      simplerTerms: "How is the changing profile of wealth and age affecting financial needs?",
      thinkAbout: [
        "Are you preparing for the 'Great Wealth Transfer' to younger generations?",
        "Is there a rise in 'unbanked' or 'underbanked' populations in your region?",
        "How is the rise of the 'solopreneur' or gig worker changing loan demands?",
        "Is there a migration of high-net-worth individuals to specific regions?"
      ],
      exampleResponse: "We are seeing a massive shift as Baby Boomers pass assets to Millennial heirs who prefer self-service digital platforms over traditional advisors."
    },
    Manufacturing: {
      simplerTerms: "How are population changes affecting your labor supply and customer demand?",
      thinkAbout: [
        "Is there a skilled labor shortage in your region?",
        "Are workers aging out faster than new ones entering?",
        "Is the population in your distribution areas growing or shrinking?",
        "Are training programs producing the skills you need?"
      ],
      exampleResponse: "We're facing a skilled labor gap; 30% of our technicians will retire in 5 years. Local technical colleges aren't graduating enough replacements."
    },
    Retail: {
      simplerTerms: "How are your potential customers' characteristics changing?",
      thinkAbout: [
        "Which age groups are buying from you most?",
        "Are Gen Z shopping habits different from your current customers?",
        "Is urbanization affecting where you should have stores?",
        "Are income levels in your target areas rising or falling?"
      ],
      exampleResponse: "Our core customers are millennials, but Gen Z is growing to 25% of our sales. They prefer mobile shopping and expect faster delivery."
    },
    "Professional Services": {
      simplerTerms: "How is the talent pool and corporate leadership demographic changing?",
      thinkAbout: [
        "Is there a shift in the age of business owners needing your services?",
        "Are the educational backgrounds of your target clients changing?",
        "Is the 'brain drain' in your specific city affecting your ability to hire?",
        "Are more businesses becoming female- or minority-owned in your sector?"
      ],
      exampleResponse: "More of our consulting clients are now female-led startups, requiring us to tailor our networking and outreach strategies accordingly."
    },
    Education: {
      simplerTerms: "How are changes in the student-age population affecting enrollment?",
      thinkAbout: [
        "Is the birth rate in your region declining (the 'enrollment cliff')?",
        "Are more adults seeking 'upskilling' or non-traditional education?",
        "Is international student migration increasing or decreasing?",
        "Are families moving toward suburban or urban school districts?"
      ],
      exampleResponse: "Local birth rates have dropped 10%, so we are shifting focus from K-12 to adult continuing education and professional certifications."
    },
    "Real Estate": {
      simplerTerms: "Who is moving, and what kind of space do they need?",
      thinkAbout: [
        "Are millennials finally entering the home-buying market?",
        "Is there a 'downsizing' trend among empty-nesters?",
        "Is net migration into your city positive or negative?",
        "Are household sizes shrinking (leading to more demand for 1-bedroom units)?"
      ],
      exampleResponse: "We see high demand for 1-bedroom units because the average household size in this district has dropped to 1.8 people."
    },
    Energy: {
      simplerTerms: "How is population growth or relocation impacting energy demand?",
      thinkAbout: [
        "Are people moving to areas with higher heating or cooling needs?",
        "Is the local population growing faster than the grid can handle?",
        "Are demographics showing a higher preference for 'green' energy users?",
        "Is the workforce for infrastructure maintenance aging?"
      ],
      exampleResponse: "Population growth in the 'Sun Belt' is driving a 15% increase in peak summer cooling demand, forcing us to expand grid capacity."
    },
    Transportation: {
      simplerTerms: "How are movement patterns and population density changing?",
      thinkAbout: [
        "Are people moving back to city centers or further into the suburbs?",
        "Is an aging population requiring more specialized transit services?",
        "Are younger generations choosing not to own cars?",
        "Is migration affecting the availability of commercial drivers?"
      ],
      exampleResponse: "Gen Z in our city is 30% less likely to own a car, increasing the demand for our micro-mobility and ride-sharing integrations."
    },
    Hospitality: {
      simplerTerms: "Who is traveling, and what are their expectations?",
      thinkAbout: [
        "Is there a rise in 'bleisure' (business + leisure) travelers?",
        "Are older travelers looking for more luxury/accessible options?",
        "Is the 'digital nomad' population creating a need for long-term stays?",
        "Are international tourism demographics shifting?"
      ],
      exampleResponse: "We are seeing a 40% increase in guests who stay for 2+ weeks and require high-speed internet and co-working spaces in the lobby."
    },
    "Media & Entertainment": {
      simplerTerms: "How is the age and culture of your audience changing?",
      thinkAbout: [
        "Is your audience 'cord-cutting' based on their age group?",
        "What is the primary language spoken by your fastest-growing audience segment?",
        "Are younger viewers spending more time on short-form vs. long-form content?",
        "Is there an increasing demand for diverse representation?"
      ],
      exampleResponse: "Our primary audience is aging out, while the 13-24 demographic is spending 80% of their media time on social video platforms rather than our site."
    },
    Agriculture: {
      simplerTerms: "How is the farming workforce and consumer base changing?",
      thinkAbout: [
        "Is the average age of farm owners increasing?",
        "Are rural populations moving to cities (reducing local labor)?",
        "Is the consumer demand for organic/local food driven by specific age groups?",
        "Are there enough young people entering agricultural technology?"
      ],
      exampleResponse: "The average farmer in our region is 60 years old. We are seeing a lack of succession, leading to larger corporate farm consolidations."
    },
    Construction: {
      simplerTerms: "How is the need for housing or infrastructure changing based on the population?",
      thinkAbout: [
        "Is there a shortage of skilled tradespeople (plumbers, electricians)?",
        "Is the demand for multi-family housing increasing over single-family homes?",
        "Are people moving to your region, necessitating new schools and roads?",
        "Is an aging population requiring more 'aging-in-place' renovations?"
      ],
      exampleResponse: "The influx of remote workers into this town has created a 20% deficit in available housing, driving a boom in new residential permits."
    },
    Telecommunications: {
      simplerTerms: "Where are people living, and how much data do they need?",
      thinkAbout: [
        "Is the population density in your area increasing (requiring more towers)?",
        "Are remote work trends increasing the need for residential fiber?",
        "What is the smartphone penetration rate in your target demographic?",
        "Is there a 'digital divide' based on income levels in your region?"
      ],
      exampleResponse: "The shift to suburban remote work has moved peak data usage from downtown business districts to residential neighborhoods."
    },
    Other: {
      simplerTerms: "We want to understand how people characteristics in your market are changing.",
      thinkAbout: [
        "Is your customer base getting older or younger?",
        "Are people moving to/from your service areas?",
        "Is the education level of your customers changing?",
        "Are family sizes or household structures shifting?"
      ],
      exampleResponse: "Our customers are mainly 35-55 year olds, but we're seeing more interest from younger demographics (25-34)."
    }
  },
  economic: {
    Technology: {
      simplerTerms: "How are interest rates and IT budgets affecting your sales?",
      thinkAbout: [
        "Are high interest rates making it harder for your customers to get VC funding?",
        "Is inflation causing companies to freeze their software spending?",
        "Are currency exchange rates affecting your international subscription revenue?",
        "Is the cost of cloud computing/hardware rising?"
      ],
      exampleResponse: "Due to high interest rates, our enterprise clients are delaying multi-year contracts and sticking to month-to-month renewals to save cash."
    },
    Healthcare: {
      simplerTerms: "How is the economy affecting patient spending and hospital costs?",
      thinkAbout: [
        "Is inflation driving up the cost of medical supplies and labor?",
        "Are patients deferring elective procedures due to lower disposable income?",
        "How are government reimbursement rates (like Medicare) changing?",
        "Are employer-sponsored insurance premiums becoming unaffordable?"
      ],
      exampleResponse: "Inflation has increased our nursing labor costs by 15%, while government reimbursement rates have remained flat, squeezing our margins."
    },
    "Financial Services": {
      simplerTerms: "How do interest rates and market volatility impact your business?",
      thinkAbout: [
        "Are rising interest rates increasing your net interest margin?",
        "Is a market downturn reducing your assets under management (AUM) fees?",
        "Are inflation levels impacting consumer loan defaults?",
        "Is the cost of capital for your own lending operations rising?"
      ],
      exampleResponse: "While higher interest rates have improved our lending margins, we are seeing a 5% uptick in credit card delinquencies due to inflation."
    },
    Manufacturing: {
      simplerTerms: "How are raw material costs and global trade affecting your factory?",
      thinkAbout: [
        "Is the cost of energy or raw materials (steel, plastic) rising?",
        "Are interest rates making it too expensive to buy new machinery?",
        "How are shipping and freight costs impacting your margins?",
        "Is a strong or weak local currency affecting your exports?"
      ],
      exampleResponse: "The 20% spike in steel prices has forced us to raise our wholesale prices, leading to a slight drop in total order volume."
    },
    Retail: {
      simplerTerms: "How is consumer 'wallet share' changing with the economy?",
      thinkAbout: [
        "Do your customers have less 'disposable income' due to inflation?",
        "Are consumers switching from brand-name to generic labels?",
        "Is the cost of commercial rent for your stores increasing?",
        "Are high credit card rates discouraging big-ticket purchases?"
      ],
      exampleResponse: "Inflation in grocery prices means our customers have less to spend on our 'luxury' home goods, so we are increasing our discount promotions."
    },
    "Professional Services": {
      simplerTerms: "Are businesses cutting back on 'discretionary' services like yours?",
      thinkAbout: [
        "Is a general economic slowdown causing clients to 'insource' work?",
        "Are your hourly rates still competitive given the rising cost of living?",
        "Is it harder for your clients to secure the financing they need to hire you?",
        "Are you seeing more late payments on your invoices?"
      ],
      exampleResponse: "Clients are prioritizing 'must-have' legal compliance work over 'nice-to-have' strategic consulting due to tightening budgets."
    },
    Education: {
      simplerTerms: "How do economic shifts affect tuition payments and funding?",
      thinkAbout: [
        "Is inflation making tuition unaffordable for your target families?",
        "Is a strong labor market causing potential students to work instead of study?",
        "Are government grants or endowments shrinking due to market performance?",
        "Is the cost of facility maintenance and staff salaries rising?"
      ],
      exampleResponse: "As the cost of living rises, we've seen a 12% shift from full-time enrollment to part-time, as students need to work more hours."
    },
    "Real Estate": {
      simplerTerms: "How are interest rates and housing affordability affecting deals?",
      thinkAbout: [
        "Are mortgage rates deterring buyers from entering the market?",
        "Is inflation driving up the cost of property management and repairs?",
        "Are commercial tenants asking for rent concessions due to their own struggles?",
        "Is there a 'liquidity crunch' making it hard to fund new developments?"
      ],
      exampleResponse: "7% mortgage rates have frozen the residential market; sellers don't want to move, and buyers can't afford the monthly payments."
    },
    Energy: {
      simplerTerms: "How are global commodity prices affecting your bottom line?",
      thinkAbout: [
        "Are oil, gas, or coal prices volatile right now?",
        "Is there government subsidization for renewable energy projects?",
        "Is the cost of building new power plants rising due to interest rates?",
        "Are consumers cutting back on usage to save on utility bills?"
      ],
      exampleResponse: "High natural gas prices have increased our operational costs, but federal tax credits for our wind farm project are offsetting the hit."
    },
    Transportation: {
      simplerTerms: "How are fuel prices and economic activity affecting your fleet?",
      thinkAbout: [
        "Is the price of diesel or jet fuel cutting into your profits?",
        "Is a slowdown in consumer spending reducing the volume of freight?",
        "Are vehicle financing costs rising?",
        "Is the 'gig economy' labor cost (drivers) increasing due to inflation?"
      ],
      exampleResponse: "A 10% dip in e-commerce shipping volume, combined with higher fuel surcharges, has made this our tightest quarter in three years."
    },
    Hospitality: {
      simplerTerms: "Are people cutting 'luxury' travel from their budgets?",
      thinkAbout: [
        "Is consumer confidence high enough for people to book vacations?",
        "Are corporate travel budgets being slashed by your B2B clients?",
        "Is the cost of food and labor (hospitality's biggest costs) rising?",
        "Are currency fluctuations making your location too expensive for foreigners?"
      ],
      exampleResponse: "We are seeing a 'bifurcation': luxury bookings remain strong, but our mid-tier rooms are seeing high vacancy as families stay home."
    },
    "Media & Entertainment": {
      simplerTerms: "How is the advertising market and subscription fatigue looking?",
      thinkAbout: [
        "Are companies spending less on ads due to a recession?",
        "Are consumers canceling subscriptions to save $15/month?",
        "Is the cost of content production (actors, crews) inflating?",
        "Are interest rates making it harder to fund big-budget projects?"
      ],
      exampleResponse: "Ad revenue is down 8% across the board, so we're introducing a cheaper, ad-supported tier to prevent subscriber churn."
    },
    Agriculture: {
      simplerTerms: "How are fertilizer, fuel, and global crop prices moving?",
      thinkAbout: [
        "Is the cost of fertilizer and seed rising faster than crop prices?",
        "Are global trade tensions affecting your ability to export your harvest?",
        "Are interest rates on equipment loans becoming a burden?",
        "Are land prices or rents making expansion impossible?"
      ],
      exampleResponse: "Input costs for fertilizer are up 40% due to global supply chain issues, while the price of corn hasn't risen enough to cover the gap."
    },
    Construction: {
      simplerTerms: "How is the cost of materials and borrowing affecting your builds?",
      thinkAbout: [
        "Are developers canceling projects because of high interest rates?",
        "Is the cost of lumber, concrete, or steel fluctuating wildly?",
        "Are you struggling with 'fixed-price' contracts as costs rise?",
        "Is the local employment rate high enough to sustain new housing demand?"
      ],
      exampleResponse: "We've had three major developers pause projects this month because their financing costs have doubled since last year."
    },
    Telecommunications: {
      simplerTerms: "Are consumers and businesses spending on upgrades?",
      thinkAbout: [
        "Are people holding onto their old smartphones longer to save money?",
        "Is the cost of spectrum auctions or 5G rollout becoming too high?",
        "Are businesses cutting back on premium enterprise data packages?",
        "Is inflation forcing you to raise plan prices (and risking churn)?"
      ],
      exampleResponse: "The average device upgrade cycle has lengthened from 24 to 36 months as consumers avoid the high cost of new flagship phones."
    },
    Other: {
      simplerTerms: "What economic factors are currently influencing your business?",
      thinkAbout: [
        "Are interest rates making it harder to borrow money?",
        "Is inflation increasing your operating costs?",
        "Is the unemployment rate affecting your ability to find staff?",
        "Are your customers spending less overall?"
      ],
      exampleResponse: "Inflation has increased our supply costs by 12%, and we are debating whether to pass that cost on to our customers."
    }
  },
  socialCultural: {
    Technology: {
      simplerTerms: "How are changing attitudes toward privacy and AI affecting you?",
      thinkAbout: [
        "Is there a growing 'tech backlash' or concern over screen time?",
        "What is the cultural attitude toward Artificial Intelligence in your sector?",
        "How much do your users value data privacy vs. convenience?",
        "Is 'remote-first' work culture a permanent shift for your users?"
      ],
      exampleResponse: "Users are increasingly skeptical of how we use their data for AI training, so we're having to be much more transparent about our privacy settings."
    },
    Healthcare: {
      simplerTerms: "How are patient expectations for wellness and digital care shifting?",
      thinkAbout: [
        "Is there a shift toward 'preventative' care rather than 'sick' care?",
        "How do your patients feel about telehealth vs. in-person visits?",
        "Is there a growing interest in holistic or alternative medicine?",
        "What are the social attitudes toward mental health in your community?"
      ],
      exampleResponse: "Patients now expect 'on-demand' healthcare; if they can't book an appointment via an app, they often look for another provider."
    },
    "Financial Services": {
      simplerTerms: "How do people feel about debt, crypto, and ethical investing?",
      thinkAbout: [
        "Is there a growing demand for 'ESG' (Environmental, Social, Governance) investing?",
        "Are younger generations more comfortable with digital-only banking?",
        "Is the social stigma around 'Buy Now, Pay Later' debt disappearing?",
        "How is the cultural shift toward 'transparency' affecting your fee structures?"
      ],
      exampleResponse: "70% of our new clients ask about the environmental impact of their portfolios; 'green' investing is no longer a niche request."
    },
    Manufacturing: {
      simplerTerms: "Are consumers demanding ethical production and local sourcing?",
      thinkAbout: [
        "Is there a 'Made in [Country]' movement affecting your sales?",
        "Are workers demanding better work-life balance in factory settings?",
        "How do social views on plastic use affect your packaging choices?",
        "Is there pressure to ensure 'fair labor' throughout your entire supply chain?"
      ],
      exampleResponse: "Social pressure regarding 'fast fashion' has led our clients to demand more durable goods and proof of fair wages in our overseas factories."
    },
    Retail: {
      simplerTerms: "What are the latest lifestyle and shopping trends?",
      thinkAbout: [
        "Is there a shift toward 'conscious consumerism' and sustainability?",
        "Are shoppers prioritizing 'experiences' over physical 'stuff'?",
        "How is the 'influencer' culture driving your product discovery?",
        "Is there a move toward 'second-hand' or resale markets?"
      ],
      exampleResponse: "Our 'pre-owned' section is growing faster than our new arrivals as Gen Z shoppers prioritize sustainability and unique vintage styles."
    },
    "Professional Services": {
      simplerTerms: "How are professional norms and 'purpose-driven' work changing?",
      thinkAbout: [
        "Do your clients care about your firm's diversity and inclusion (DEI) metrics?",
        "Is there a shift toward more casual professional interactions?",
        "Are clients looking for partners with a strong 'social mission'?",
        "How is the 'work-from-anywhere' culture changing how you consult?"
      ],
      exampleResponse: "We lost a bid because our leadership team lacked diversity; clients are now treating DEI as a core requirement for their vendors."
    },
    Education: {
      simplerTerms: "What are the changing views on the 'value' of a degree?",
      thinkAbout: [
        "Is there a growing skepticism about the ROI of traditional college?",
        "How do students feel about 'hybrid' or online-only learning?",
        "Is there an increased focus on mental health support on campus?",
        "Are 'micro-credentials' becoming more socially acceptable than degrees?"
      ],
      exampleResponse: "There's a cultural shift toward 'skills-based' hiring, making our 6-month coding bootcamps more attractive than our 4-year CS degree."
    },
    "Real Estate": {
      simplerTerms: "How are people's living and working preferences evolving?",
      thinkAbout: [
        "Is 'van life' or nomadic living affecting long-term rental demand?",
        "Do people want dedicated home offices in every apartment?",
        "Is there a trend toward 'co-living' or multi-generational housing?",
        "Are 'walkable' neighborhoods becoming more desirable than large yards?"
      ],
      exampleResponse: "The 'death of the office' has led to a massive demand for apartments that have built-in co-working spaces and high-speed fiber."
    },
    Energy: {
      simplerTerms: "What is the public sentiment toward different energy sources?",
      thinkAbout: [
        "Is there strong local opposition to new infrastructure (NIMBYism)?",
        "How is the 'anti-plastic' movement affecting demand for petrochemicals?",
        "Is there a cultural push for 'energy independence' at the household level?",
        "Are people willing to pay a premium for 'clean' energy?"
      ],
      exampleResponse: "Public sentiment has shifted heavily against our proposed natural gas plant, forcing us to pivot toward a solar-plus-storage model."
    },
    Transportation: {
      simplerTerms: "How are attitudes toward travel, safety, and sharing changing?",
      thinkAbout: [
        "Is 'flight shaming' (concern over carbon footprint) affecting travel?",
        "Are people more or less comfortable with public transit after the pandemic?",
        "Is there a cultural shift toward 'active transport' (biking, walking)?",
        "How do people feel about self-driving vehicle safety?"
      ],
      exampleResponse: "A growing 'car-free' culture in the city center has led to a 20% increase in bike-share usage and a drop in parking garage revenue."
    },
    Hospitality: {
      simplerTerms: "What are the new 'vibe' and travel lifestyle trends?",
      thinkAbout: [
        "Is 'slow travel' (staying longer in one place) becoming a trend?",
        "How important is 'Instagrammability' to your venue's success?",
        "Are guests looking for 'authentic' local experiences over standardized luxury?",
        "What are the social attitudes toward 'short-term rentals' (Airbnb) in your area?"
      ],
      exampleResponse: "Guests are skipping our formal dining room in favor of 'authentic' street food tours we've started curating with local guides."
    },
    "Media & Entertainment": {
      simplerTerms: "What are the shifts in how people consume and trust media?",
      thinkAbout: [
        "Is there a 'trust crisis' in traditional news and media?",
        "How is 'cancel culture' affecting the talent or content you produce?",
        "Is there a move toward 'niche' communities over mass-market media?",
        "Are people seeking 'digital detox' experiences (less screen time)?"
      ],
      exampleResponse: "Our audience is moving away from big platforms toward private Discord communities where they feel more 'connected' and less tracked."
    },
    Agriculture: {
      simplerTerms: "How are diet trends and 'food ethics' changing?",
      thinkAbout: [
        "Is the rise of plant-based diets affecting your livestock demand?",
        "Do consumers care about 'regenerative' farming practices?",
        "Is there a trend toward 'ugly produce' or reducing food waste?",
        "Are 'farm-to-table' connections becoming a requirement for high-end buyers?"
      ],
      exampleResponse: "The cultural shift toward oat and almond milks has led us to convert 20% of our dairy pasture into specialty crop production."
    },
    Construction: {
      simplerTerms: "What do people want their buildings to say about them?",
      thinkAbout: [
        "Is there a demand for 'healthy' buildings (air quality, natural light)?",
        "Are 'tiny homes' or modular living becoming socially popular?",
        "How important is 'smart home' technology to your average buyer?",
        "Is there a move toward using traditional or reclaimed materials for aesthetic reasons?"
      ],
      exampleResponse: "Homebuyers now prioritize a 'home office' over a 'formal dining room,' reflecting the permanent shift in professional culture."
    },
    Telecommunications: {
      simplerTerms: "How is the 'always-on' culture impacting usage?",
      thinkAbout: [
        "Is there a push for 'digital well-being' and limiting connectivity?",
        "How is the 'gaming' culture driving the need for low-latency connections?",
        "Are people using video calls as their primary social interaction?",
        "Is '5G' seen as a necessity or a health concern in your community?"
      ],
      exampleResponse: "The rise of high-definition video streaming on social media has increased our average user's data consumption by 50% year-over-year."
    },
    Other: {
      simplerTerms: "What social or cultural trends are impacting your market?",
      thinkAbout: [
        "Are consumer habits changing due to lifestyle shifts?",
        "Are there social movements that support or oppose your industry?",
        "Is the 'vibe' of your product still in style?",
        "Do people trust your industry more or less than they used to?"
      ],
      exampleResponse: "There's a growing trend toward sustainability, so our customers are asking more questions about our packaging and sourcing."
    }
  },
  technological: {
    Technology: {
      simplerTerms: "What new tech is threatening to make your product obsolete?",
      thinkAbout: [
        "How is Generative AI changing how your software is built or used?",
        "Are 'low-code' or 'no-code' platforms letting your customers build it themselves?",
        "Is there a shift from cloud to 'edge computing' in your niche?",
        "Are new cybersecurity threats requiring a total architecture rethink?"
      ],
      exampleResponse: "Generative AI can now automate the basic tasks our software used to do, so we are pivoting to become an 'AI-orchestration' layer."
    },
    Healthcare: {
      simplerTerms: "How are AI, robotics, and wearables changing patient care?",
      thinkAbout: [
        "Can AI help you with faster diagnosis or drug discovery?",
        "Are 'remote monitoring' devices letting you treat patients at home?",
        "Is robotic-assisted surgery becoming the standard in your field?",
        "How is 'genomic' medicine allowing for personalized treatments?"
      ],
      exampleResponse: "We're implementing AI-driven triage that reduced our ER wait times by 25% by identifying high-risk patients instantly."
    },
    "Financial Services": {
      simplerTerms: "How is fintech, blockchain, or AI disrupting banking?",
      thinkAbout: [
        "Is 'Open Banking' (APIs) allowing competitors to access your data?",
        "Can 'DeFi' (Decentralized Finance) replace any of your core services?",
        "Is AI-driven fraud detection becoming a 'must-have' for survival?",
        "How is 'real-time payments' technology changing cash flow for your clients?"
      ],
      exampleResponse: "The move to 'real-time payments' means we can no longer rely on 'float' income; we have to find new ways to monetize our services."
    },
    Manufacturing: {
      simplerTerms: "How are automation, 3D printing, and 'Industry 4.0' helping?",
      thinkAbout: [
        "Can 'cobots' (collaborative robots) work alongside your human staff?",
        "Is 3D printing making it possible to produce parts on-demand?",
        "Are 'Digital Twins' helping you predict when machines will break?",
        "Is 'IoT' (Internet of Things) tracking your supply chain in real-time?"
      ],
      exampleResponse: "We installed IoT sensors on our assembly line, allowing us to predict 80% of breakdowns before they happen, saving us $200k in downtime."
    },
    Retail: {
      simplerTerms: "How is e-commerce tech and 'smart' retail changing the store?",
      thinkAbout: [
        "Are 'cashier-less' checkout systems (like Amazon Go) the future for you?",
        "Can Augmented Reality (AR) let customers 'try on' products virtually?",
        "How is AI-driven personalization affecting your marketing conversion?",
        "Is your inventory management system synced in real-time across all channels?"
      ],
      exampleResponse: "By adding an AR 'virtual mirror' to our site, we've reduced our return rate for sunglasses by 15%."
    },
    "Professional Services": {
      simplerTerms: "How is AI and automation changing 'billable hours'?",
      thinkAbout: [
        "Can AI draft your legal documents or perform basic audits?",
        "Are automated 'self-service' portals replacing your junior-level staff tasks?",
        "How are virtual reality (VR) tools helping you collaborate with clients?",
        "Is your firm using data analytics to predict project outcomes or costs?"
      ],
      exampleResponse: "Our accounting firm now uses AI for the first pass of audits, which has cut manual labor by 40% and allowed us to focus on strategic advice."
    },
    Education: {
      simplerTerms: "How are AI tutors and 'EdTech' changing the classroom?",
      thinkAbout: [
        "Is Generative AI making traditional homework or essays obsolete?",
        "Can VR/AR provide 'immersive' learning experiences (like virtual field trips)?",
        "Are 'Learning Management Systems' (LMS) collecting data to personalize study?",
        "How is high-speed internet access affecting your 'hybrid' class options?"
      ],
      exampleResponse: "We've integrated an AI tutor into our math curriculum that adapts to each student's pace, leading to a 10% increase in test scores."
    },
    "Real Estate": {
      simplerTerms: "How are 'PropTech' and smart buildings changing property value?",
      thinkAbout: [
        "Are 'virtual tours' or 3D walkthroughs now mandatory for your listings?",
        "Is 'smart building' tech (energy saving) a key selling point for your properties?",
        "How is blockchain being used to speed up title transfers or fractional sales?",
        "Are you using AI to predict which neighborhoods will see high growth?"
      ],
      exampleResponse: "Buildings with 'smart' energy management systems are selling for 5% more because buyers want lower utility bills and automated security."
    },
    Energy: {
      simplerTerms: "How is 'Grid Tech' and battery storage changing the market?",
      thinkAbout: [
        "Is 'Smart Grid' tech helping you manage peak demand more efficiently?",
        "Are long-duration batteries making renewable energy more reliable?",
        "Is 'Green Hydrogen' a viable future fuel for your operations?",
        "How is AI optimizing the placement and angle of solar panels or turbines?"
      ],
      exampleResponse: "New battery storage technology has allowed us to store solar energy for nighttime use, reducing our reliance on backup gas turbines."
    },
    Transportation: {
      simplerTerms: "How are EVs, autonomous tech, and 'smart' logistics moving us?",
      thinkAbout: [
        "Is the shift to Electric Vehicles (EVs) changing your maintenance needs?",
        "When will 'level 4' autonomous driving be ready for your fleet?",
        "How is route-optimization AI reducing your fuel consumption?",
        "Are 'drones' or 'delivery robots' a threat to your last-mile logistics?"
      ],
      exampleResponse: "By switching to AI-optimized routing, we've cut our fuel spend by 12% and increased our on-time delivery rate to 98%."
    },
    Hospitality: {
      simplerTerms: "How are mobile keys, kiosks, and 'smart' rooms helping?",
      thinkAbout: [
        "Do your guests want to check in via smartphone and skip the front desk?",
        "Can AI chatbots handle 80% of your guest's 'room service' requests?",
        "Are 'smart' thermostats helping you save on energy costs when rooms are empty?",
        "How is 'big data' helping you set dynamic pricing for your rooms?"
      ],
      exampleResponse: "Implementing mobile-key check-in has reduced our front-desk staffing needs by one person per shift while improving guest satisfaction."
    },
    "Media & Entertainment": {
      simplerTerms: "How is AI content and new streaming tech changing the game?",
      thinkAbout: [
        "Is Generative AI being used to create music, scripts, or visuals in your field?",
        "How is '5G' enabling higher-quality mobile streaming or cloud gaming?",
        "Are 'Deepfakes' or AI-voiceovers a threat or an opportunity for you?",
        "Is 'Interactive Content' (where viewers choose the ending) the next big thing?"
      ],
      exampleResponse: "We're using AI-driven 'personalization engines' to suggest content, which has increased our average session duration by 15 minutes."
    },
    Agriculture: {
      simplerTerms: "How are drones, GPS, and 'AgTech' changing the harvest?",
      thinkAbout: [
        "Are you using 'Precision Ag' (GPS) to use less fertilizer and water?",
        "Can drones monitor crop health from the air more cheaply than humans?",
        "Are 'vertical farms' or 'hydroponics' a threat to your traditional land?",
        "How is 'Gene Editing' (CRISPR) creating more resilient crops for you?"
      ],
      exampleResponse: "Using satellite imagery and GPS-guided tractors, we've reduced our chemical usage by 20% while increasing our yield by 5%."
    },
    Construction: {
      simplerTerms: "How is 3D printing and 'BIM' software building the future?",
      thinkAbout: [
        "Is 'BIM' (Building Information Modeling) reducing errors on your sites?",
        "Can 3D-printed concrete reduce your labor costs and waste?",
        "Are 'wearable sensors' keeping your workers safer on high-risk sites?",
        "Is 'modular' or 'pre-fab' construction speeding up your timelines?"
      ],
      exampleResponse: "Moving to 100% BIM-based design has cut our 'rework' costs by 15% because we catch pipe/wire conflicts before we even start building."
    },
    Telecommunications: {
      simplerTerms: "How is 5G, 6G, and satellite internet changing coverage?",
      thinkAbout: [
        "Is 'Starlink' or satellite internet a threat to your rural wireline business?",
        "How is 'Network Slicing' in 5G creating new revenue from enterprise clients?",
        "Is 'Virtual RAN' (Radio Access Network) making your hardware cheaper?",
        "Are you using AI to manage network congestion in real-time?"
      ],
      exampleResponse: "Our rollout of 5G has allowed us to offer 'Fixed Wireless' home internet, letting us compete with cable companies in dense urban areas."
    },
    Other: {
      simplerTerms: "What technological changes are affecting or could disrupt your industry?",
      thinkAbout: [
        "Is there new software that could do your job better/faster?",
        "Are you falling behind on 'digital transformation'?",
        "Is automation threatening to replace any of your current tasks?",
        "Are your customers using new tech that you haven't adopted yet?"
      ],
      exampleResponse: "We're starting to use AI to handle our customer support tickets, which has cut our response time from 4 hours down to 10 minutes."
    }
  },
  environmental: {
    Technology: {
      simplerTerms: "How is the 'carbon footprint' of your servers and code being judged?",
      thinkAbout: [
        "Are your data center providers using renewable energy?",
        "Is 'green coding' (optimizing code for less power) a priority?",
        "What's your policy for recycling or disposing of old hardware (e-waste)?",
        "Are your enterprise clients demanding carbon-neutral software vendors?"
      ],
      exampleResponse: "Our biggest clients now require us to disclose our AWS carbon footprint; we are moving our workloads to 'greener' server regions."
    },
    Healthcare: {
      simplerTerms: "How are medical waste and 'resilient' hospitals becoming a focus?",
      thinkAbout: [
        "How do you manage the massive amount of single-use plastic in your clinic?",
        "Is your facility prepared for 'extreme weather' (backup power/supplies)?",
        "Are you seeing more 'climate-related' illnesses (heatstroke, respiratory)?",
        "What is your strategy for reducing the carbon footprint of your supply chain?"
      ],
      exampleResponse: "We've implemented a new medical waste recycling program that has diverted 30% of our plastic waste from landfills this year."
    },
    "Financial Services": {
      simplerTerms: "How is 'Climate Risk' affecting your loans and investments?",
      thinkAbout: [
        "Are you exposed to 'stranded assets' (like oil companies that might fail)?",
        "Is flood risk changing how you value the real estate in your loan portfolio?",
        "Do you have a clear 'Net Zero' commitment for your own operations?",
        "Are you offering 'green' financial products (like lower-rate EV loans)?"
      ],
      exampleResponse: "We are phasing out lending to coal-based projects and increasing our 'Green Bond' portfolio by $500M over the next two years."
    },
    Manufacturing: {
      simplerTerms: "How are energy prices and 'circular' production impacting you?",
      thinkAbout: [
        "Is your factory under pressure to reach 'Net Zero' carbon emissions?",
        "Can you use recycled materials instead of 'virgin' raw materials?",
        "Are you facing stricter regulations on air and water emissions?",
        "How is the 'Right to Repair' movement affecting your product design?"
      ],
      exampleResponse: "By redesigning our packaging to be 100% biodegradable, we've reduced our plastic tax liability and appealed to eco-conscious retailers."
    },
    Retail: {
      simplerTerms: "How is 'fast consumption' being challenged by sustainability?",
      thinkAbout: [
        "Are you moving toward 'zero-plastic' packaging?",
        "How do you handle 'returns' (which have a massive carbon footprint)?",
        "Are your customers asking about the 'traceability' of your products?",
        "Is your supply chain ethical and environmentally friendly?"
      ],
      exampleResponse: "We've launched a 'circular' program where customers can return old clothes for store credit, reducing our brand's total textile waste."
    },
    "Professional Services": {
      simplerTerms: "How are 'Scope 3' emissions (travel) and green offices valued?",
      thinkAbout: [
        "Are you reducing billable travel by using high-end video conferencing?",
        "Is your office space certified 'LEED' or 'Green'?",
        "Are you advising clients on their own ESG (Environmental/Social) strategies?",
        "Is your firm 'paperless' yet?"
      ],
      exampleResponse: "We've cut our corporate travel by 50% compared to 2019, which is now a major selling point in our ESG report to stakeholders."
    },
    Education: {
      simplerTerms: "How are schools teaching and practicing sustainability?",
      thinkAbout: [
        "Is your campus moving toward solar power or zero-waste cafeterias?",
        "Are you integrating 'climate literacy' into your curriculum?",
        "Is your school prepared for local climate risks (wildfires, flooding)?",
        "Do your students demand 'divestment' from fossil fuels in your endowment?"
      ],
      exampleResponse: "Our student body successfully campaigned for the university to divest its $100M endowment from fossil fuel companies."
    },
    "Real Estate": {
      simplerTerms: "How is 'Energy Efficiency' and 'Climate Resilience' affecting value?",
      thinkAbout: [
        "Is your property in a high-risk flood or fire zone?",
        "Are you installing EV charging stations to attract modern tenants?",
        "Do your buildings meet 'net-zero' energy standards?",
        "Are you using 'green' building materials like cross-laminated timber?"
      ],
      exampleResponse: "Properties without EV chargers are seeing 10% lower rental demand; we're retrofitting our entire portfolio this year."
    },
    Energy: {
      simplerTerms: "How is the 'Energy Transition' to renewables impacting you?",
      thinkAbout: [
        "Are you being forced to close fossil fuel plants earlier than planned?",
        "How is 'Carbon Capture' tech changing your outlook?",
        "Are you facing lawsuits or protests over environmental damage?",
        "Is 'water scarcity' affecting your ability to cool your power plants?"
      ],
      exampleResponse: "We are pivoting from being an 'Oil & Gas' company to an 'Integrated Energy' company, with 40% of Capex going to offshore wind."
    },
    Transportation: {
      simplerTerms: "How are 'Zero Emission' mandates and fuel efficiency moving you?",
      thinkAbout: [
        "When will your local city ban diesel or gas vehicles in the center?",
        "How are you transitioning your fleet to Electric or Hydrogen?",
        "Are 'Sustainable Aviation Fuels' (SAF) viable for your airline?",
        "Is there a push to move freight from trucks to more efficient rail?"
      ],
      exampleResponse: "We're replacing 50 older trucks with electric models to comply with new 'Clean Air' zones being established in major cities."
    },
    Hospitality: {
      simplerTerms: "How are 'Eco-Tourism' and waste reduction changing the stay?",
      thinkAbout: [
        "Are you eliminating single-use plastics in your guest rooms?",
        "Is 'food waste' in your kitchen being composted or donated?",
        "How are you managing water usage (especially in drought-prone areas)?",
        "Are guests choosing you specifically for your 'Eco-Certified' status?"
      ],
      exampleResponse: "By replacing individual plastic toiletry bottles with refillable wall dispensers, we've cut our plastic waste by 2 tons per year."
    },
    "Media & Entertainment": {
      simplerTerms: "How is the 'Carbon Footprint' of filming and streaming managed?",
      thinkAbout: [
        "Is your film production 'certified green' (no plastic, low travel)?",
        "How much energy does your streaming platform consume?",
        "Are you telling 'environmental stories' to meet audience demand?",
        "Are your physical products (DVDs, Merch) using sustainable materials?"
      ],
      exampleResponse: "We now hire a 'Sustainability Coordinator' for every film set to ensure we are zero-waste and use only solar-powered generators."
    },
    Agriculture: {
      simplerTerms: "How is climate change and 'Regenerative Ag' affecting your soil?",
      thinkAbout: [
        "Are changing weather patterns (droughts/floods) ruining your harvests?",
        "Are you using 'Cover Crops' to sequester carbon in your soil?",
        "Is 'Water Security' your biggest long-term risk?",
        "Are you seeing new pests or diseases due to rising temperatures?"
      ],
      exampleResponse: "A three-year drought has forced us to switch from water-heavy almonds to more drought-resistant olives and grapes."
    },
    Construction: {
      simplerTerms: "How are 'Green Building' codes and 'Embodied Carbon' changing sites?",
      thinkAbout: [
        "Are you being asked to track 'Embodied Carbon' (CO2 in the concrete/steel)?",
        "Is 'Demolition' being replaced by 'Deconstruction' (reusing materials)?",
        "How are you managing 'Runoff' and dust on your construction sites?",
        "Are you using electric heavy machinery instead of diesel?"
      ],
      exampleResponse: "New city regulations require all new builds to be 'Electric-Only' (no gas hookups), forcing us to redesign our HVAC plans."
    },
    Telecommunications: {
      simplerTerms: "How is the 'Energy Hunger' of 5G and data being managed?",
      thinkAbout: [
        "Are your cell towers powered by renewable energy?",
        "How are you handling the massive 'e-waste' from old phone trade-ins?",
        "Is your network equipment cooled efficiently to save power?",
        "Is your infrastructure resilient to rising sea levels (undersea cables)?"
      ],
      exampleResponse: "We've committed to a 100% renewable-powered network by 2030; we're currently at 60% using off-site solar PPAs."
    },
    Other: {
      simplerTerms: "What environmental or sustainability factors affect your business?",
      thinkAbout: [
        "Is there pressure to reduce your waste or plastic use?",
        "Is climate change affecting your supply chain or locations?",
        "Are your customers asking for 'green' options?",
        "Are there new environmental taxes or regulations coming?"
      ],
      exampleResponse: "We are switching to 100% recycled packaging because our customers were complaining about the amount of plastic waste."
    }
  },
  politicalLegal: {
    Technology: {
      simplerTerms: "How are AI laws, Antitrust, and GDPR affecting your code?",
      thinkAbout: [
        "Is the new 'EU AI Act' going to restrict how you use machine learning?",
        "Are 'Antitrust' investigations into big tech affecting your partnerships?",
        "How are 'Data Residency' laws forcing you to store data in specific countries?",
        "Is there a 'Section 230' (liability) change that could hurt your platform?"
      ],
      exampleResponse: "The new privacy regulations in California (CCPA) required us to hire a dedicated compliance officer and rewrite our data handling logic."
    },
    Healthcare: {
      simplerTerms: "How are healthcare reforms and FDA/HIPAA rules changing?",
      thinkAbout: [
        "Is there a change in 'Price Transparency' laws for your services?",
        "How is 'Certificate of Need' legislation affecting your expansion?",
        "Are there new 'Telehealth' reimbursement laws in your state?",
        "What is the impact of changes to the Affordable Care Act (ACA)?"
      ],
      exampleResponse: "A new state law allowing 'Nurse Practitioners' to practice independently has increased competition for our primary care clinics."
    },
    "Financial Services": {
      simplerTerms: "How are 'Basel III', SEC rules, and Crypto laws impacting you?",
      thinkAbout: [
        "Are new 'Capital Requirement' rules forcing you to hold more cash?",
        "How is 'Anti-Money Laundering' (AML) compliance becoming more difficult?",
        "Is the SEC classifying your digital assets as 'securities'?",
        "Are 'Consumer Protection' laws limiting the fees you can charge?"
      ],
      exampleResponse: "The latest 'Know Your Customer' (KYC) regulations have doubled our onboarding time for new business accounts."
    },
    Manufacturing: {
      simplerTerms: "How are 'Trade Tariffs' and labor laws affecting your factory?",
      thinkAbout: [
        "Are 'Tariffs' on imported steel or chips raising your costs?",
        "Is 'Onshoring' (government incentives to build locally) helping you?",
        "Are there new 'Worker Safety' or 'Minimum Wage' laws coming?",
        "How is 'Extended Producer Responsibility' (plastic taxes) affecting you?"
      ],
      exampleResponse: "The 25% tariff on imported components from China has forced us to look for new suppliers in Vietnam and Mexico."
    },
    Retail: {
      simplerTerms: "How are sales taxes, 'junk fee' bans, and labor laws moving?",
      thinkAbout: [
        "Is there a new 'Sales Tax' law for your online out-of-state sales?",
        "Are 'Predictive Scheduling' laws affecting how you staff your stores?",
        "Is the government banning 'Hidden Fees' in your checkout process?",
        "Are 'Import/Export' rules changing for your international brands?"
      ],
      exampleResponse: "The city's new $18 minimum wage law has forced us to implement 'Self-Checkout' to keep our labor costs under 20% of revenue."
    },
    "Professional Services": {
      simplerTerms: "How are licensing, liability, and 'Non-Compete' laws changing?",
      thinkAbout: [
        "Is the government banning 'Non-Compete' agreements for your staff?",
        "Are 'Professional Licensing' requirements becoming stricter?",
        "Is there a shift in 'Liability' laws that increases your insurance costs?",
        "Are there new 'Transparency in Billing' laws for your industry?"
      ],
      exampleResponse: "The FTC's move to ban non-compete clauses has made us rethink our talent retention strategy and equity packages."
    },
    Education: {
      simplerTerms: "How are 'School Choice' laws and student loan policies shifting?",
      thinkAbout: [
        "Is 'Universal Pre-K' or 'Free Community College' being debated in your area?",
        "Are 'Title IX' or 'Diversity' regulations being changed by the government?",
        "Is 'Student Loan Forgiveness' affecting your enrollment numbers?",
        "Are 'Accreditation' standards becoming more focused on job outcomes?"
      ],
      exampleResponse: "Changes in international student visa policies have led to a 20% drop in our graduate program applications this year."
    },
    "Real Estate": {
      simplerTerms: "How are 'Zoning', 'Rent Control', and tax laws impacting you?",
      thinkAbout: [
        "Is your city passing 'Rent Control' laws that limit your profits?",
        "Are 'Zoning' changes allowing for higher density (and more competition)?",
        "Is there a 'Mansion Tax' or a change in 'Property Tax' coming?",
        "Are 'Eviction Moratoriums' still a risk in your jurisdiction?"
      ],
      exampleResponse: "The new 'inclusionary zoning' law requires 15% of our new building to be 'affordable housing,' which is changing our ROI math."
    },
    Energy: {
      simplerTerms: "How are 'Carbon Taxes' and 'Green Subsidies' changing the grid?",
      thinkAbout: [
        "Is the 'Inflation Reduction Act' (or similar) giving you tax credits?",
        "Are 'Permitting' laws making it too slow to build new power lines?",
        "Is there a 'Carbon Tax' being discussed in your country?",
        "Are geopolitical tensions (wars) affecting your supply of oil/gas?"
      ],
      exampleResponse: "Permitting for our new transmission line has been stuck in 'environmental review' for 4 years, delaying our solar project."
    },
    Transportation: {
      simplerTerms: "How are 'Safety Regulations' and 'Autonomous' laws moving?",
      thinkAbout: [
        "Are 'Emissions Standards' (like Euro 7) becoming impossible to meet?",
        "Is the government allowing 'Self-Driving' cars on public roads yet?",
        "Are 'Gig Worker' laws (AB5) forcing you to treat drivers as employees?",
        "Are 'Trade Corridors' or 'Sanctions' changing your shipping routes?"
      ],
      exampleResponse: "The new federal 'Electronic Logging Device' (ELD) mandate has increased our compliance costs but improved driver safety scores."
    },
    Hospitality: {
      simplerTerms: "How are 'Airbnb bans', 'Tourist Taxes', and Visa laws shifting?",
      thinkAbout: [
        "Is your city banning 'Short-Term Rentals' to lower housing costs?",
        "Are 'Visa' requirements making it harder for foreign tourists to visit?",
        "Is there a new 'Tourist Tax' being added to every hotel night?",
        "Are 'Food Safety' or 'Liquor License' laws becoming stricter?"
      ],
      exampleResponse: "A new city-wide ban on 'unhosted' short-term rentals has actually increased our hotel's occupancy by 10% this year."
    },
    "Media & Entertainment": {
      simplerTerms: "How are 'Copyright', 'IP', and 'Censorship' laws changing?",
      thinkAbout: [
        "How is AI 'Copyright' law being decided for the content you use?",
        "Are 'Streaming Quotas' (requiring local content) affecting your library?",
        "Are 'Online Safety' laws making you liable for user comments?",
        "Is 'Net Neutrality' being upheld or repealed in your country?"
      ],
      exampleResponse: "The new 'Online Safety Bill' requires us to implement strict age-verification, which has added $50k in annual software costs."
    },
    Agriculture: {
      simplerTerms: "How are 'Farm Bills', 'Pesticide Bans', and 'Water Rights' moving?",
      thinkAbout: [
        "Is the new 'Farm Bill' changing your crop insurance or subsidies?",
        "Are specific 'Pesticides' (like Glyphosate) being banned in your area?",
        "Is 'Water Rights' litigation threatening your access to irrigation?",
        "Are 'Animal Welfare' laws (like Prop 12) forcing you to rebuild pens?"
      ],
      exampleResponse: "New 'Groundwater Management' laws have capped how much we can pump, forcing us to fallow 10% of our less-productive fields."
    },
    Construction: {
      simplerTerms: "How are 'Building Codes', 'Permits', and 'Safety' laws shifting?",
      thinkAbout: [
        "Are 'Seismic' or 'Fire' codes becoming much more expensive to meet?",
        "Is the 'Permit' process in your city taking 6 months or 2 years?",
        "Are 'Labor Union' laws changing how you hire for public projects?",
        "Is there a 'Local Hire' mandate for your new development?"
      ],
      exampleResponse: "The update to the 'Energy Code' now requires all new homes to have solar panels, adding $15,000 to the base cost of every build."
    },
    Telecommunications: {
      simplerTerms: "How are 'Spectrum Auctions' and 'Privacy' laws moving?",
      thinkAbout: [
        "Is the government 'Auctioning' more 5G or 6G spectrum soon?",
        "Are 'Net Neutrality' rules changing your ability to 'throttle' traffic?",
        "How is 'National Security' (banning specific vendors) affecting your costs?",
        "Are 'Universal Service' requirements forcing you to build in rural areas?"
      ],
      exampleResponse: "The government's ban on 'Huawei' equipment forced us to rip and replace $200M of hardware 5 years earlier than planned."
    },
    Other: {
      simplerTerms: "What political, legal, or regulatory changes are impacting your business?",
      thinkAbout: [
        "Are there new taxes being discussed for your industry?",
        "Is the regulatory environment getting stricter or more relaxed?",
        "Are you waiting on any permits or government approvals?",
        "Could a change in government affect your contracts or funding?"
      ],
      exampleResponse: "The new GDPR-style privacy law in our state has forced us to completely change how we collect customer emails."
    }
  },
};

/**
 * PORTER_EXPLANATIONS
 * Focuses on Micro-environmental (Industry) factors.
 */
export const PORTER_EXPLANATIONS: Record<string, Record<Industry, ExpandedExplanation>> = {
  competitiveRivalry: {
    Technology: {
      simplerTerms: "How many other software companies are going after your customers?",
      thinkAbout: [
        "Are you in a crowded market (many similar tools) or niche?",
        "How often do competitors release new features?",
        "Do you see aggressive pricing or free tiers from competitors?",
        "Are there clear market leaders, or is it fragmented?"
      ],
      exampleResponse: "Our space has 2 dominant players and about 15 smaller ones. Feature releases are constant, and pricing pressure is high."
    },
    Healthcare: {
      simplerTerms: "How crowded is your healthcare market, and how aggressively do providers compete?",
      thinkAbout: [
        "How many hospitals/clinics/practices serve your area?",
        "Do you compete for the same physicians or specialists?",
        "Are competitors expanding services or opening new locations?",
        "Is competition based on reputation, price, convenience, or specialization?"
      ],
      exampleResponse: "There are 2 major hospital systems in our region. Competition for specialists is fierce, and we compete mainly on quality scores."
    },
    "Financial Services": {
      simplerTerms: "How many other banks or fintechs are fighting for your clients' money?",
      thinkAbout: [
        "Are 'neobanks' (mobile-only) stealing your younger customers?",
        "Is the market consolidated into a 'Big 4' or very fragmented?",
        "Is the 'switching cost' for customers getting lower?",
        "Are competitors offering 'loss leaders' (high-interest savings) to get users?"
      ],
      exampleResponse: "Competition is intense; several fintechs are offering 4.5% APY on savings, which is forcing us to raise our own rates and cut margins."
    },
    Manufacturing: {
      simplerTerms: "Are there many other factories making the same things as you?",
      thinkAbout: [
        "Is your product a 'commodity' (competing only on price)?",
        "Do you have high 'fixed costs' that force you to keep producing even in a downturn?",
        "Are international players (lower labor costs) entering your local market?",
        "How fast is the industry growing?"
      ],
      exampleResponse: "There are 5 major manufacturers in our region. Because our fixed costs are so high, we all engage in 'price wars' just to keep the machines running."
    },
    Retail: {
      simplerTerms: "How many other shops (online or physical) sell what you sell?",
      thinkAbout: [
        "Are you competing with 'Amazon' or big-box retailers?",
        "Is there a 'Price War' happening in your category?",
        "Are your competitors spending heavily on social media ads?",
        "Is the physical street you are on getting more or less foot traffic?"
      ],
      exampleResponse: "Our clothing niche is oversaturated. We're competing against 10 local boutiques and hundreds of online brands that use aggressive Instagram ads."
    },
    "Professional Services": {
      simplerTerms: "How many other firms are bidding for the same contracts?",
      thinkAbout: [
        "Are the 'Big 4' or large national firms entering your local niche?",
        "Is the competition based on 'relationships' or 'lowest bid'?",
        "Are there 'automated' digital services competing with your human expertise?",
        "Is it easy for your employees to leave and start their own competing firm?"
      ],
      exampleResponse: "In our law niche, there are 5 local firms. We mostly compete on 'referrals' and 'reputation,' but we're seeing pressure from low-cost online legal platforms."
    },
    Education: {
      simplerTerms: "How many other schools or platforms are your students considering?",
      thinkAbout: [
        "Are 'Online Universities' or 'YouTube' competing for your students?",
        "Is there a local 'Enrollment War' for a shrinking number of kids?",
        "Do competitors have better facilities or higher-ranked programs?",
        "Are you losing teachers/professors to higher-paying neighboring institutions?"
      ],
      exampleResponse: "Our private K-12 school is competing with 3 other private schools and a new high-performing charter school nearby."
    },
    "Real Estate": {
      simplerTerms: "How many other developers or agents are working your area?",
      thinkAbout: [
        "Is there an oversupply of the type of building you are selling?",
        "Are there 'discount' brokerages cutting into your commissions?",
        "Are major institutional investors buying up all the inventory?",
        "Is the 'bidding war' culture for homes cooling off or heating up?"
      ],
      exampleResponse: "The market is flooded with new 'Luxury' apartments right now, so we are all offering '2 months free' just to get tenants to sign."
    },
    Energy: {
      simplerTerms: "Are there many other energy providers or sources in your region?",
      thinkAbout: [
        "Is the market a 'monopoly' or can customers choose their provider?",
        "Are 'Rooftop Solar' companies taking your best customers?",
        "Is there a race to build the most efficient wind/solar farm?",
        "How much 'price transparency' exists for the end user?"
      ],
      exampleResponse: "We are the primary utility, but 'Community Solar' projects are starting to erode our residential revenue by about 3% per year."
    },
    Transportation: {
      simplerTerms: "How many other carriers or transit options exist for your route?",
      thinkAbout: [
        "Are there too many trucks chasing too little freight (low rates)?",
        "Is 'rail' or 'air' a viable competitor for your specific routes?",
        "Are 'Gig-Economy' apps (Uber/Lyft) disrupting your traditional service?",
        "Do you have a 'Niche' route that no one else services?"
      ],
      exampleResponse: "The 'Last-Mile' delivery space is hyper-competitive. We have 4 major rivals, and we're all fighting for the same 3 enterprise retail contracts."
    },
    Hospitality: {
      simplerTerms: "How many other hotels or restaurants are in your 'walkable' area?",
      thinkAbout: [
        "Are you in a 'tourist trap' with 50 similar options?",
        "Is 'Airbnb' your biggest competitor for overnight stays?",
        "Do your rivals have a better 'loyalty program' or brand name?",
        "Are new, 'trendier' venues opening up nearby?"
      ],
      exampleResponse: "Our boutique hotel is surrounded by 3 major chains. We can't beat their prices, so we have to compete on 'local charm' and our rooftop bar."
    },
    "Media & Entertainment": {
      simplerTerms: "Who else is fighting for your audience's limited 'attention span'?",
      thinkAbout: [
        "Are you competing with 'Netflix', 'TikTok', or 'Video Games'?",
        "Is there an oversupply of content in your specific genre?",
        "Are you losing talent (creators) to other platforms?",
        "How hard is it for a user to switch from your platform to a rival?"
      ],
      exampleResponse: "We are a local news site competing for attention against Facebook groups and national news apps. It's a battle for every click."
    },
    Agriculture: {
      simplerTerms: "How many other farmers are growing the same crop as you?",
      thinkAbout: [
        "Are you a 'Price Taker' (you have no control over the market price)?",
        "Is there a global oversupply of your product (e.g., soy or wheat)?",
        "Are corporate 'Mega-Farms' driving down the price you can get?",
        "Is there any 'Brand Loyalty' for your specific farm's produce?"
      ],
      exampleResponse: "As a small berry farmer, I'm competing with massive imports from Mexico that are 30% cheaper. I have to focus on 'Organic' to survive."
    },
    Construction: {
      simplerTerms: "How many other contractors are bidding on the same projects?",
      thinkAbout: [
        "Is the 'General Contractor' market in your city oversaturated?",
        "Are 'Out-of-State' firms underbidding you to enter the market?",
        "Is there enough work for everyone, or are people 'buying jobs' (bidding at a loss)?",
        "How specialized is your work?"
      ],
      exampleResponse: "Residential remodeling is very crowded. We're competing against 20 other licensed contractors and dozens of 'handymen' who undercharge."
    },
    Telecommunications: {
      simplerTerms: "How many other carriers or ISPs serve your specific zip codes?",
      thinkAbout: [
        "Is it a 'Duopoly' (only two choices) or a 'War of many'?",
        "How high is the 'Churn Rate' (customers leaving for a better deal)?",
        "Are 'MVNOs' (low-cost brands like Mint Mobile) stealing your customers?",
        "Do your competitors have better 5G coverage in your area?"
      ],
      exampleResponse: "We have 3 major mobile rivals. They are all offering 'Free iPhone' deals, which makes it very expensive for us to keep our current customers."
    },
    Other: {
      simplerTerms: "Who else does what you do, and how hard are you all fighting for the same customers?",
      thinkAbout: [
        "How many companies offer similar products/services?",
        "Do you compete mainly on price, quality, or something else?",
        "Is the market growing (enough room for everyone) or flat (fighting for share)?",
        "Do competitors frequently launch new products or promotions?"
      ],
      exampleResponse: "We have 3 major competitors and about 10 smaller ones. Competition is intense on price - we see discount campaigns almost monthly."
    }
  },
  threatOfNewEntrants: {
    Technology: {
      simplerTerms: "How easy is it for 'two people in a garage' to build a rival software?",
      thinkAbout: [
        "Are 'Cloud' and 'AI' making it cheaper for startups to launch?",
        "Do you have a 'Network Effect' (more users = better product) that protects you?",
        "Is your software so complex it would take years to rebuild?",
        "How much does it cost for a startup to acquire their first 100 customers?"
      ],
      exampleResponse: "Low. Our software requires complex regulatory certifications that take 2 years to get, which stops new startups from appearing overnight."
    },
    Healthcare: {
      simplerTerms: "What stops a new doctor or clinic from opening across the street?",
      thinkAbout: [
        "Are the 'startup costs' for medical equipment and office space huge?",
        "Is it hard to get 'credentialed' with insurance companies?",
        "Are there 'Certificate of Need' laws that limit new facilities?",
        "How hard is it to find and hire a medical team right now?"
      ],
      exampleResponse: "High. It costs over $2M to set up a surgery center, and the local hospital system has an exclusive contract with the major insurers."
    },
    "Financial Services": {
      simplerTerms: "How hard is it to get a banking license and start a new firm?",
      thinkAbout: [
        "Is the 'Regulatory Burden' (compliance) too high for new startups?",
        "Do customers trust a 'new name' with their life savings?",
        "Is the technology stack for a new bank too expensive to build?",
        "How much 'Capital' does the government require you to have to start?"
      ],
      exampleResponse: "Medium. Fintechs can 'partner' with existing banks to bypass the 3-year license process, which is bringing in a lot of new rivals."
    },
    Manufacturing: {
      simplerTerms: "Could a new competitor build a factory as big as yours?",
      thinkAbout: [
        "How many millions of dollars are needed for land and machinery?",
        "Do you have exclusive 'patents' on your manufacturing process?",
        "Do you have 'Economies of Scale' (you make it so much cheaper than a new guy could)?",
        "Is it hard for a new player to find a distribution network?"
      ],
      exampleResponse: "Low. Our factory cost $50M to build, and we've spent 20 years optimizing our supply chain. A new player couldn't match our unit price."
    },
    Retail: {
      simplerTerms: "How easy is it for someone to open a Shopify store or a new shop?",
      thinkAbout: [
        "Is there a 'low barrier' to entry (can anyone buy and sell your product)?",
        "How much does it cost to get 'brand awareness' today?",
        "Are there 'exclusive' brands you carry that no one else can get?",
        "Is the 'commercial real estate' in your area available or full?"
      ],
      exampleResponse: "High. Anyone can launch an e-commerce store with $500 and a TikTok account, so we're constantly seeing new 'micro-brands' pop up."
    },
    "Professional Services": {
      simplerTerms: "What stops your best employee from quitting and taking your clients?",
      thinkAbout: [
        "Is your business based on 'personal talent' or 'company systems'?",
        "Are there 'Non-Compete' or 'Non-Solicitation' agreements in place?",
        "How much 'specialized software' or 'data' does a new firm need?",
        "Is your brand name strong enough to keep clients loyal to the firm?"
      ],
      exampleResponse: "High. Our senior consultants have deep personal relationships with our clients; if they left, they could start a rival firm in a week."
    },
    Education: {
      simplerTerms: "Could a new school or online course take your students?",
      thinkAbout: [
        "How hard is it to get 'Accredited' or 'Licensed'?",
        "Is your physical campus a 'moat' (barrier) that others can't copy?",
        "How much 'reputation' or 'history' does your institution have?",
        "Can a new player hire away your top faculty or researchers?"
      ],
      exampleResponse: "Medium. While it's hard to build a university, it's very easy for 'Masterclass' or 'Coursera' to launch a rival certificate program."
    },
    "Real Estate": {
      simplerTerms: "Can a new developer easily enter your city or niche?",
      thinkAbout: [
        "Is all the 'prime land' already taken?",
        "Are the 'Permit' and 'Zoning' processes too slow for new players?",
        "Do you have access to cheaper 'Capital' than a newcomer?",
        "Is there a shortage of experienced 'Project Managers' or builders?"
      ],
      exampleResponse: "Low. The city has a 'growth boundary' and it takes 3 years to get a permit, so new developers find it very difficult to enter this market."
    },
    Energy: {
      simplerTerms: "Could a startup start generating and selling power?",
      thinkAbout: [
        "How much 'Capital' is needed for a power plant or solar farm?",
        "Is the 'Grid' owned by a company that blocks new connections?",
        "Are there strict 'Government Regulations' for new energy producers?",
        "Does a new player have a way to store the energy (Batteries)?"
      ],
      exampleResponse: "Low. The multi-billion dollar cost of infrastructure and the decade-long regulatory approval process keep most newcomers out."
    },
    Transportation: {
      simplerTerms: "How hard is it to start a new trucking, airline, or shipping company?",
      thinkAbout: [
        "How much does one truck/plane/ship cost?",
        "Is it hard to get 'landing slots' or 'port access'?",
        "Is there a 'Driver Shortage' that makes it impossible to scale?",
        "Are there 'Safety Certifications' that take a long time to get?"
      ],
      exampleResponse: "Medium. It's easy to buy one truck and start a business, but it's very hard to scale to a 'fleet' that can compete with us on price."
    },
    Hospitality: {
      simplerTerms: "Could a new hotel or restaurant open nearby and steal your crowd?",
      thinkAbout: [
        "Are there any 'empty lots' or 'renovatable buildings' left?",
        "Is it easy to get a new 'Liquor License' or 'Food Permit'?",
        "How much 'Brand Loyalty' do you have with your regulars?",
        "Is there enough 'Labor' in the area to staff a new venue?"
      ],
      exampleResponse: "High. The city is rezoning our district for more commercial use, and 5 new 'concept' restaurants are opening in the next 12 months."
    },
    "Media & Entertainment": {
      simplerTerms: "What stops a YouTuber or new streamer from taking your views?",
      thinkAbout: [
        "Is the 'Equipment' to produce content becoming cheaper?",
        "Do you own 'Intellectual Property' (like Mickey Mouse) that no one can copy?",
        "Is your 'Distribution' network (like cinema chains) exclusive?",
        "How hard is it for a newcomer to 'be found' in the algorithm?"
      ],
      exampleResponse: "High. The 'barrier to entry' for content is zero. However, the 'barrier to success' is high because it's so hard to build an audience from scratch."
    },
    Agriculture: {
      simplerTerms: "Can a new person start farming and compete with you?",
      thinkAbout: [
        "What is the cost per acre of 'Farm Land' right now?",
        "Is 'Water' available for a new farm?",
        "Do you have 'Contractual' relationships with buyers that are exclusive?",
        "How much specialized 'Machinery' is required?"
      ],
      exampleResponse: "Low. Land prices are at an all-time high and there are no new water rights available, making it nearly impossible for new farmers to start."
    },
    Construction: {
      simplerTerms: "How easy is it for a new contractor to start bidding?",
      thinkAbout: [
        "How much 'Insurance' and 'Bonding' is required for the jobs?",
        "Is it easy to find a 'Subcontractor' network?",
        "Does a newcomer need a 'License' that is hard to get?",
        "Do you have 'past performance' records that a newcomer lacks?"
      ],
      exampleResponse: "Medium. For small home projects, new entrants are common. For large government builds, the 'Bonding' requirements keep most newcomers out."
    },
    Telecommunications: {
      simplerTerms: "Could a new company build a cell network or lay fiber?",
      thinkAbout: [
        "How much does it cost to 'buy spectrum' from the government?",
        "Is it hard to get 'Right of Way' to dig up streets for fiber?",
        "Do you have a 'Lock-in' with customers through 2-year contracts?",
        "How many billions of dollars are needed for the initial build?"
      ],
      exampleResponse: "Extremely Low. It costs billions to build a national network and there is limited 'spectrum' available for anyone else to use."
    },
    Other: {
      simplerTerms: "Are there any new companies trying to enter your market?",
      thinkAbout: [
        "Are the startup costs high or low?",
        "Are there complex regulations that a new company would struggle with?",
        "Do customers have a strong loyalty to existing brands?",
        "Is it hard for a new company to get access to suppliers or distributors?"
      ],
      exampleResponse: "It's fairly easy for new small players to enter, but very hard for them to scale because of the high marketing costs needed to be seen."
    }
  },
  threatOfSubstitutes: {
    Technology: {
      simplerTerms: "Can customers solve their problem without software at all?",
      thinkAbout: [
        "Is 'Excel' or 'Email' a viable substitute for your complex tool?",
        "Could a customer hire a 'Human Agency' instead of using your AI?",
        "Is there a 'different kind' of tech (e.g., a wearable vs. a phone app)?",
        "Does the customer even 'need' to solve this problem right now?"
      ],
      exampleResponse: "Our biggest substitute isn't another software, it's 'doing it manually in a spreadsheet' which 50% of our leads still prefer."
    },
    Healthcare: {
      simplerTerms: "What are the non-medical or alternative ways to treat patients?",
      thinkAbout: [
        "Are patients using 'over-the-counter' or 'home remedies' instead?",
        "Is 'preventative wellness' (diet/exercise) reducing the need for your care?",
        "Are 'Retail Clinics' (CVS/Walmart) replacing your primary care visits?",
        "Can a 'Mid-level' provider (NP/PA) do what you do more cheaply?"
      ],
      exampleResponse: "Telehealth-only platforms are a major substitute for our in-person behavioral health services, offering much lower prices and more convenience."
    },
    "Financial Services": {
      simplerTerms: "Could people use 'Crypto', 'Cash', or 'P2P' instead of you?",
      thinkAbout: [
        "Is 'Apple Pay' or 'Google Wallet' replacing your credit cards?",
        "Can people 'self-insure' instead of buying your policy?",
        "Are people using 'stablecoins' for international transfers instead of your bank?",
        "Is 'Social Lending' (borrowing from friends/family) a factor?"
      ],
      exampleResponse: "The biggest substitute for our international wire service is 'Wise' or 'Revolut,' which are faster and use a different technology entirely."
    },
    Manufacturing: {
      simplerTerms: "Can customers use a different 'Material' or 'Process'?",
      thinkAbout: [
        "Could your 'Steel' parts be replaced by 'Carbon Fiber' or 'Plastic'?",
        "Can customers 'Repair' their old machines instead of buying your new one?",
        "Is there a 'Digital' substitute for your physical product?",
        "Can the customer 'Rent' or 'Share' the product instead of owning it?"
      ],
      exampleResponse: "As a plastic packaging maker, our biggest threat is 'Paper Packaging' or 'Reusables' due to new environmental trends."
    },
    Retail: {
      simplerTerms: "Could customers spend their money on something totally different?",
      thinkAbout: [
        "Are people buying 'Digital Goods' instead of your physical clothes?",
        "Is 'Rental' (like Rent the Runway) replacing your 'Purchase' model?",
        "Can the customer 'Do It Themselves' (DIY) instead of buying from you?",
        "Is a different 'Category' of gift replacing yours (e.g., giving a Trip vs. a Watch)?"
      ],
      exampleResponse: "The substitute for our high-end kitchen gadgets is the 'Eating Out' trend. If people don't cook, they don't buy our tools."
    },
    "Professional Services": {
      simplerTerms: "Could the customer use 'AI', 'Software', or 'Templates' instead?",
      thinkAbout: [
        "Can the client use 'LegalZoom' instead of your law firm?",
        "Is 'ChatGPT' writing the content your marketing agency used to write?",
        "Can the client 'In-Source' the role (hire one full-time person)?",
        "Is there a 'different profession' that could do this (e.g., a Coach vs. a Consultant)?"
      ],
      exampleResponse: "Our basic tax preparation service is being substituted by 'TurboTax' and other DIY software, forcing us to move into 'Wealth Planning'."
    },
    Education: {
      simplerTerms: "Can students learn what they need without a school?",
      thinkAbout: [
        "Is 'YouTube' or 'TikTok' providing the skills for free?",
        "Can students get 'On-the-job' training instead of your degree?",
        "Are 'Apprenticeships' becoming a more popular alternative?",
        "Is 'Homeschooling' or 'Unschooling' a rising substitute for your K-12 school?"
      ],
      exampleResponse: "For our language school, the substitute is 'Duolingo.' It's not as good as a teacher, but it's free and 'good enough' for 40% of the market."
    },
    "Real Estate": {
      simplerTerms: "Could people live or work in a totally different way?",
      thinkAbout: [
        "Is 'Remote Work' a substitute for your office building?",
        "Is 'Van Life' or 'Co-Living' a substitute for your traditional apartments?",
        "Are 'Metaverse' or virtual spaces a future substitute for retail shops?",
        "Could people 'Renovate' their current home instead of buying your new one?"
      ],
      exampleResponse: "Our downtown office space is being substituted by 'Coworking memberships' and 'Home offices,' leading to a permanent drop in occupancy."
    },
    Energy: {
      simplerTerms: "Can customers generate their own power or use less?",
      thinkAbout: [
        "Is 'Rooftop Solar' a substitute for your grid power?",
        "Is 'Energy Efficiency' (better insulation) reducing the need for your fuel?",
        "Can 'Heat Pumps' replace the 'Natural Gas' you sell?",
        "Is 'Public Transit' a substitute for the 'Gasoline' you provide for cars?"
      ],
      exampleResponse: "For our natural gas business, 'Electric Heat Pumps' are a major substitute being pushed by government rebates and climate trends."
    },
    Transportation: {
      simplerTerms: "Could the goods or people be moved in a different way?",
      thinkAbout: [
        "Is 'Teleconferencing' a substitute for your business travel (Airlines)?",
        "Can a '3D Printer' at the destination replace the need for 'Shipping'?",
        "Is a 'Bicycle' or 'Walking' a substitute for your bus/train service?",
        "Can 'Pipeline' or 'Rail' move the product instead of your trucks?"
      ],
      exampleResponse: "For our regional airline, the 'High Speed Train' is a major substitute. It takes the same total time when you factor in airport security."
    },
    Hospitality: {
      simplerTerms: "Can people eat, sleep, or meet without your venue?",
      thinkAbout: [
        "Is 'Home Cooking' or 'Meal Kits' a substitute for your restaurant?",
        "Is 'Zoom' a substitute for your 'Conference Room'?",
        "Can people 'Stay with Friends' or 'Couchsurf' instead of your hotel?",
        "Is 'Virtual Reality' travel a future threat to your destination?"
      ],
      exampleResponse: "The substitute for our business-focused hotel is 'Microsoft Teams.' Companies are realizing they don't need to fly people in for a 2-hour meeting."
    },
    "Media & Entertainment": {
      simplerTerms: "What other ways can people spend their 'free time'?",
      thinkAbout: [
        "Is 'Reading a Book' or 'Going for a Walk' a substitute for your app?",
        "Are 'User-Generated Content' (TikTok) a substitute for your pro movies?",
        "Is 'AI-generated music' a substitute for your artist's songs?",
        "Can 'Socializing' in a park replace 'Social Media'?"
      ],
      exampleResponse: "For our movie theater, the substitute is 'Day-and-date streaming' on Netflix. People would rather stay on their couch than drive to us."
    },
    Agriculture: {
      simplerTerms: "Can people eat a different 'Food' to get the same nutrients?",
      thinkAbout: [
        "Is 'Lab-grown meat' a substitute for your cattle ranch?",
        "Are 'Synthetic' fibers (polyester) a substitute for your cotton?",
        "Can people eat 'Grains' instead of your 'Vegetables'?",
        "Is 'Imported' food a substitute for your 'Local' produce?"
      ],
      exampleResponse: "Our sugar beet farm is threatened by 'High-Fructose Corn Syrup' and 'Stevia' which food companies use as cheaper or 'healthier' substitutes."
    },
    Construction: {
      simplerTerms: "Can people get a 'Space' without building one from scratch?",
      thinkAbout: [
        "Is 'Prefab/Modular' a substitute for your 'Custom Build'?",
        "Can a client 'Repurpose' an old container instead of building a shed?",
        "Is 'Virtual Reality' a substitute for building a physical showroom?",
        "Can they 'Repair/Maintain' an old building instead of 'Replacing' it?"
      ],
      exampleResponse: "For our custom home building business, the 'High-end Modular' market is a growing substitute. It's 20% cheaper and twice as fast."
    },
    Telecommunications: {
      simplerTerms: "How can people communicate without a traditional phone plan?",
      thinkAbout: [
        "Is 'Public Wi-Fi' + 'WhatsApp' a substitute for your data plan?",
        "Is 'Satellite' (Starlink) a substitute for your fiber line?",
        "Can 'LoRaWAN' or other private nets replace your IoT services?",
        "Is 'Face-to-Face' or 'Postal Mail' a (very slow) substitute?"
      ],
      exampleResponse: "For our international calling business, 'WhatsApp' and 'FaceTime' are near-perfect substitutes that have made our old service obsolete."
    },
    Other: {
      simplerTerms: "What alternatives do customers have to your product or service?",
      thinkAbout: [
        "Can the customer do it themselves?",
        "Is there a different type of product that solves the same problem?",
        "Could they just not do anything at all and be okay?",
        "Is there a cheaper, lower-quality version that is 'good enough'?"
      ],
      exampleResponse: "Our 'Dog Walking' service is often substituted by 'Automatic Dog Doors' or just neighbors doing it for free."
    }
  },
  supplierPower: {
    Technology: {
      simplerTerms: "How much can 'AWS' or 'Nvidia' screw you by raising prices?",
      thinkAbout: [
        "Are you locked into one 'Cloud Provider' (AWS/Azure)?",
        "Is there a 'Chip Shortage' (Nvidia/Intel) affecting your hardware costs?",
        "How many 'Specialized Engineers' are available for your tech stack?",
        "Do you rely on 'APIs' from companies that could shut you off (like Twitter/X)?"
      ],
      exampleResponse: "High. We are built entirely on OpenAI's API. If they raise prices or change their terms, our entire business model could break overnight."
    },
    Healthcare: {
      simplerTerms: "How much power do 'Pharma' and 'Medical Supply' companies have?",
      thinkAbout: [
        "Is there only one 'Manufacturer' for a drug you need?",
        "How much power do 'Nurses Unions' or 'Staffing Agencies' have?",
        "Are 'Insurance Companies' (your payers) actually your most powerful suppliers?",
        "Are 'Electronic Health Record' (EHR) vendors hard to switch from?"
      ],
      exampleResponse: "High. The nursing shortage has given 'travel nursing agencies' massive power to dictate hourly rates, which are now 3x our usual budget."
    },
    "Financial Services": {
      simplerTerms: "Who provides your 'Capital' and 'Data', and how much do they charge?",
      thinkAbout: [
        "Are you dependent on 'Credit Rating Agencies' (Moody's/S&P)?",
        "How much do 'Payment Processors' (Visa/Mastercard) charge you?",
        "Is your 'Core Banking Software' vendor impossible to leave?",
        "Are 'Central Banks' (interest rates) your most important 'supplier'?"
      ],
      exampleResponse: "Medium. Our 'Core Banking' software is very old, and switching to a new vendor would take 2 years and $5M, so our current vendor has us locked in."
    },
    Manufacturing: {
      simplerTerms: "Do your 'Raw Material' suppliers have you in a corner?",
      thinkAbout: [
        "Are there only 1-2 companies that sell the 'Chemical' or 'Metal' you need?",
        "Could your suppliers 'Integrate Forward' (start making the final product themselves)?",
        "Is 'Energy' a major input, and do you have a choice of provider?",
        "How much does it cost you to switch to a different supplier?"
      ],
      exampleResponse: "High. There is only one local supplier for the high-grade aluminum we need. When they have a strike, our factory has to stop production."
    },
    Retail: {
      simplerTerms: "How much power do the 'Brands' or 'Wholesalers' have over you?",
      thinkAbout: [
        "Do you 'need' a certain brand (e.g., Nike/Apple) to get people in the door?",
        "Are your suppliers starting to sell 'Direct to Consumer' (D2C) on their own sites?",
        "Can you easily switch to a different 'Wholesaler'?",
        "How much 'Shipping/Logistics' power do UPS/FedEx have over you?"
      ],
      exampleResponse: "Medium. We carry 20 different brands, so if one raises prices, we can pivot. But our shipping costs are dictated entirely by FedEx."
    },
    "Professional Services": {
      simplerTerms: "Who provides your 'Talent' and 'Software', and what's their power?",
      thinkAbout: [
        "Is there a 'Talent War' for the specific professionals you hire?",
        "Do you rely on 'Specialized Software' (like Bloomberg or AutoCAD)?",
        "Are your 'Sub-contractors' in high demand?",
        "Do you 'Rent' your office in a building with no other options?"
      ],
      exampleResponse: "High. The 'Talent' is our supplier. Because there's a shortage of senior auditors, they can demand 20% higher salaries and 4-day work weeks."
    },
    Education: {
      simplerTerms: "How much power do 'Publishers' and 'Tenured Faculty' have?",
      thinkAbout: [
        "Are 'Textbook Publishers' (Pearson/McGraw Hill) raising prices?",
        "How much power do 'Teachers' Unions' have in your district?",
        "Are you dependent on 'Government Funding' as your 'supplier' of cash?",
        "Is your 'LMS' (Canvas/Blackboard) too difficult to switch from?"
      ],
      exampleResponse: "Medium. Our faculty have high power due to tenure, and our software vendors have 'locked us in' to 5-year contracts that are hard to break."
    },
    "Real Estate": {
      simplerTerms: "Who controls the 'Land', 'Labor', and 'Materials'?",
      thinkAbout: [
        "Are 'Construction Labor' unions powerful in your city?",
        "Is the 'Steel' or 'Lumber' market a monopoly or competitive?",
        "How much power do the 'Banks' (your supplier of money) have?",
        "Are 'Local Governments' (who supply permits) the real power?"
      ],
      exampleResponse: "High. 'Banks' have all the power right now. They've tightened lending standards so much that we can't get the capital to start new builds."
    },
    Energy: {
      simplerTerms: "Who sells you the 'Fuel' or 'Equipment' to make power?",
      thinkAbout: [
        "Are you buying gas from a country that might stop the supply?",
        "How many companies make 'Wind Turbines' or 'Solar Cells'?",
        "Are 'Grid Operators' charging you high 'Interconnection' fees?",
        "Do you rely on 'Rare Earth Minerals' that are hard to get?"
      ],
      exampleResponse: "High. We depend on a single supplier for our specialized turbine parts. Their lead times have gone from 3 months to 18 months."
    },
    Transportation: {
      simplerTerms: "How much power do 'Fuel', 'Truck Makers', and 'Labor' have?",
      thinkAbout: [
        "Can you choose between different 'Fuel' providers or is it a local monopoly?",
        "How many companies sell the 'Trucks' or 'Planes' you use?",
        "Do the 'Unions' (Teamsters/Pilots) have high bargaining power?",
        "Are 'Toll Road' or 'Port' operators raising fees?"
      ],
      exampleResponse: "High. The 'Pilot Union' just negotiated a 30% raise, and there are only two companies (Boeing/Airbus) that make the planes we need."
    },
    Hospitality: {
      simplerTerms: "Who provides your 'Food', 'Cleaning', and 'Booking' tech?",
      thinkAbout: [
        "How much power do 'OTAs' (Booking.com/Expedia) have over your prices?",
        "Are there only a few 'Food Distributors' (Sysco/US Foods) in your area?",
        "Is there a 'Labor' shortage for housekeepers or chefs?",
        "Does a 'Franchise' brand (Marriott/Hilton) dictate your operations?"
      ],
      exampleResponse: "High. 'Expedia' and 'Booking.com' take a 15-20% commission on every room. We are desperate for them to send us guests, so they have all the power."
    },
    "Media & Entertainment": {
      simplerTerms: "Who provides the 'Talent', 'Content', and 'Tech'?",
      thinkAbout: [
        "Do 'Actors' or 'Writers' Unions' have high power?",
        "Are you dependent on 'Google/Apple' for your app store distribution?",
        "Do 'Copyright Holders' (Music Labels/Studios) charge high fees?",
        "Is there a 'Broadband' monopoly that controls your access to users?"
      ],
      exampleResponse: "High. As a streaming service, the 'Major Labels' have all the power. If we don't pay their price, we lose 80% of our music library."
    },
    Agriculture: {
      simplerTerms: "Who sells you 'Seed', 'Fertilizer', and 'Equipment'?",
      thinkAbout: [
        "Are 'Seed' companies (Bayer/Monsanto) charging high royalties?",
        "Is there only one 'Fertilizer' dealer in your county?",
        "Can you 'Repair' your own tractor or is the 'OEM' (John Deere) in control?",
        "How much power does the 'Water District' have over your supply?"
      ],
      exampleResponse: "High. Three companies control almost all seed and chemical supply. We have very little choice and must pay the market price they set."
    },
    Construction: {
      simplerTerms: "How much power do 'Subcontractors' and 'Material' yards have?",
      thinkAbout: [
        "Are 'Electricians' and 'Plumbers' so busy they can name their price?",
        "Is there only one 'Concrete' plant within driving distance?",
        "How much power do 'Equipment Rental' companies have?",
        "Are 'Labor' unions strong in your specific sector?"
      ],
      exampleResponse: "High. Because there's a shortage of 'Electricians,' they are charging us double what they did 2 years ago, and we have to pay it to finish the job."
    },
    Telecommunications: {
      simplerTerms: "Who sells you the 'Hardware', 'Spectrum', and 'Fiber'?",
      thinkAbout: [
        "How many companies (Nokia/Ericsson) make 5G towers?",
        "Is the 'Government' the only supplier of spectrum?",
        "Do you rely on 'Undersea Cable' owners to get data abroad?",
        "Are 'Smartphone' makers (Apple/Samsung) more powerful than you?"
      ],
      exampleResponse: "Medium. We have a few tower vendors to choose from, but 'Apple' has huge power—they decide which carriers get the best iPhone promos."
    },
    Other: {
      simplerTerms: "How dependent are you on your suppliers?",
      thinkAbout: [
        "Are there many suppliers or just a few?",
        "Is it easy or expensive to switch suppliers?",
        "Can your supplier start doing what you do and become a competitor?",
        "Is the thing they provide unique or a standard item?"
      ],
      exampleResponse: "We have many suppliers to choose from, so if one raises their price, we can easily move to another without much cost."
    }
  },
  buyerPower: {
    Technology: {
      simplerTerms: "Can your customers easily quit and move to a rival software?",
      thinkAbout: [
        "Is it hard for them to 'Export their Data' and leave?",
        "Are you selling to 'Small Businesses' (low power) or 'Fortune 500' (high power)?",
        "Is your product 'Mission Critical' (they can't live without it)?",
        "Can the customer build their own version of your software in-house?"
      ],
      exampleResponse: "Low. Our software is integrated into their daily workflow and it takes 3 months to train a team on a new system, so they rarely switch."
    },
    Healthcare: {
      simplerTerms: "How much power do 'Patients' and 'Insurance Companies' have?",
      thinkAbout: [
        "Do 'Insurance Companies' (Payers) dictate what you can charge?",
        "Can patients easily compare your 'Quality Scores' and 'Prices'?",
        "Is your specialty so 'Rare' that patients have no choice?",
        "Are 'Employers' the ones choosing the healthcare plan for the buyer?"
      ],
      exampleResponse: "High. One major insurance company provides 60% of our patients. If they cut our reimbursement rates by 5%, we have to accept it or lose the patients."
    },
    "Financial Services": {
      simplerTerms: "How easy is it for customers to move their money elsewhere?",
      thinkAbout: [
        "Are 'Switching Costs' low (can they move their balance in an app)?",
        "Are 'Corporate' clients powerful enough to negotiate lower interest rates?",
        "Is there a 'Price Comparison' site for your loans or insurance?",
        "Is your service a 'Commodity' (money is money)?"
      ],
      exampleResponse: "High. With 'Open Banking' and mobile apps, customers can move their savings to a rival in 30 seconds if they see a 0.1% better rate."
    },
    Manufacturing: {
      simplerTerms: "Do your customers (like Walmart or Ford) dictate your price?",
      thinkAbout: [
        "Do you sell to 'Big Box' retailers who have all the power?",
        "Is your product a 'Component' that they can get from 100 other factories?",
        "Can the buyer 'Integrate Backward' (start making the part themselves)?",
        "Does the buyer purchase in 'Huge Volumes'?"
      ],
      exampleResponse: "High. Our biggest customer is a global retailer that buys 70% of our output. They demand 3% price cuts every year, or they'll go to a Chinese rival."
    },
    Retail: {
      simplerTerms: "Can shoppers easily find a better deal elsewhere?",
      thinkAbout: [
        "Is 'Price Transparency' high (can they check Amazon on their phone)?",
        "Is your product 'Unique' or can they find it in 10 other shops?",
        "Are 'Loyalty Programs' actually working to keep them around?",
        "Is there a 'low cost of switching' (it's free to walk out)?"
      ],
      exampleResponse: "High. Customers have no 'loyalty'—if the shop next door is $2 cheaper for the same pair of jeans, they will leave immediately."
    },
    "Professional Services": {
      simplerTerms: "How much can clients negotiate your 'Hourly Rate' or 'Fee'?",
      thinkAbout: [
        "Is your service 'Standard' (like basic bookkeeping) or 'Specialized'?",
        "Are clients using 'Procurement Departments' to beat down your price?",
        "Is it easy for them to 'In-source' (hire their own person)?",
        "Do you have a 'Reputation' that makes them willing to pay any price?"
      ],
      exampleResponse: "Medium. Our small clients pay full price, but our large corporate clients have 'Procurement' teams that force us to discount our rates by 20%."
    },
    Education: {
      simplerTerms: "How much choice do students and parents have?",
      thinkAbout: [
        "Are there 'Other Schools' nearby with better reputations?",
        "Are 'Scholarships' the main way you compete for 'buyers' (students)?",
        "Can students 'Transfer' their credits easily to a rival?",
        "Is there a 'Public' free option that is 'good enough'?"
      ],
      exampleResponse: "High. Because there are 3 other colleges in the city, we have to offer heavy 'Tuition Discounts' to get the best students to choose us."
    },
    "Real Estate": {
      simplerTerms: "Is it a 'Buyer's Market' or a 'Seller's Market'?",
      thinkAbout: [
        "Is there an 'Oversupply' of homes/offices (giving buyers power)?",
        "Can buyers 'Wait' or do they need to move immediately?",
        "How much 'Information' do buyers have (Zillow/Redfin data)?",
        "Are 'Institutional' buyers (Blackrock) taking away power from individuals?"
      ],
      exampleResponse: "Low. Because there's a housing shortage in this city, sellers have all the power. Buyers are waiving inspections just to get a house."
    },
    Energy: {
      simplerTerms: "Can your customers switch or negotiate their rates?",
      thinkAbout: [
        "Is the market 'Deregulated' (can they pick their supplier)?",
        "Are 'Industrial' buyers (factories) powerful enough to get special rates?",
        "Can the customer 'Go Off-Grid'?",
        "Is there a 'Government Regulator' who protects the buyer's price?"
      ],
      exampleResponse: "Low. We are the only utility in town, so residential buyers have zero power. However, the 'Public Utilities Commission' limits how much we can charge."
    },
    Transportation: {
      simplerTerms: "How easily can shippers move to a different carrier?",
      thinkAbout: [
        "Are your 'Contracts' long-term or 'Spot Market' (one-time)?",
        "Is your 'Route' or 'Equipment' unique?",
        "Do you have 'Big Shippers' (like Amazon/Walmart) who dictate terms?",
        "Is there 'Full Transparency' on rates via digital apps?"
      ],
      exampleResponse: "High. Shippers use 'Load Boards' to find the lowest price. If we aren't the cheapest for a route today, they will pick someone else."
    },
    Hospitality: {
      simplerTerms: "How much power do 'TripAdvisor' reviews and 'Price' have?",
      thinkAbout: [
        "Can guests see 'All Prices' on one screen (Google/Expedia)?",
        "Are 'Reviews' more important than your own marketing?",
        "Is it a 'Corporate' or 'Leisure' traveler (leisure is more price-sensitive)?",
        "How much 'Supply' (empty rooms) is there in your city tonight?"
      ],
      exampleResponse: "High. Guests are hyper-sensitive to reviews. If our score drops from 4.5 to 4.2, our booking volume falls by 20% instantly."
    },
    "Media & Entertainment": {
      simplerTerms: "How easily can users 'Cancel' and move to another app?",
      thinkAbout: [
        "Is your content 'Exclusive' (they can't get it anywhere else)?",
        "Is it a 'Monthly Subscription' (easy to cancel) or 'Locked-in'?",
        "Are 'Advertisers' (the real buyers) powerful enough to dictate content?",
        "Are there 'Free' alternatives that are just as entertaining?"
      ],
      exampleResponse: "High. There is no 'cost' to cancel our streaming service. Most users 'churn' as soon as they finish watching the one show they liked."
    },
    Agriculture: {
      simplerTerms: "Do 'Grocery Chains' or 'Food Companies' dictate your price?",
      thinkAbout: [
        "Are there only 2-3 'Grain Elevators' or 'Meat Packers' you can sell to?",
        "Is your product 'Perishable' (you HAVE to sell it today or it rots)?",
        "Are you selling 'Direct-to-Consumer' (giving you more power)?",
        "Is there 'Global Competition' for the same crop?"
      ],
      exampleResponse: "Extremely High. We sell to two major supermarket chains. If we don't agree to their low price, our produce will rot in the field."
    },
    Construction: {
      simplerTerms: "How much 'Bargaining' power do developers or homeowners have?",
      thinkAbout: [
        "Are there 'Other Bids' they can use to push your price down?",
        "Is the client a 'Repeat Buyer' (a developer) or a 'One-Time' homeowner?",
        "How much 'Information' does the client have about your costs?",
        "Is the 'Market' busy (you can say no) or slow (you need the work)?"
      ],
      exampleResponse: "Medium. Homeowners have power because they can get 3 quotes, but because all contractors are busy, we have more power to keep our margins high."
    },
    Telecommunications: {
      simplerTerms: "Can customers 'Port their Number' and leave easily?",
      thinkAbout: [
        "Are there 'Cancellation Fees' that lock them in?",
        "Is 'Number Portability' required by law (making it easy to leave)?",
        "Do you offer 'Bundles' (TV/Home/Mobile) that are hard to unbundle?",
        "How much 'Coverage' difference is there between you and rivals?"
      ],
      exampleResponse: "High. Government laws make it easy to switch and keep your number. We have to offer 'Retention Deals' to 20% of our customers every year."
    },
    Other: {
      simplerTerms: "How much power do your customers have in negotiations?",
      thinkAbout: [
        "Can they easily switch to a competitor?",
        "Do you have a few big customers or many small ones?",
        "Is it easy for them to compare prices?",
        "Could they survive without your product or service?"
      ],
      exampleResponse: "Our customers have high power because there are many similar options and they can switch to a competitor with zero cost or effort."
    }
  }
};

// Helper function to get explanation for a question and industry
export function getExplanation(
  type: 'destep' | 'porter',
  questionKey: string,
  industry: string
): ExpandedExplanation {
  const explanations = type === 'destep' ? DESTEP_EXPLANATIONS : PORTER_EXPLANATIONS
  const questionExplanations = explanations[questionKey]

  if (!questionExplanations) {
    return explanations[Object.keys(explanations)[0]]['Other']
  }

  // Return industry-specific explanation if available, otherwise fallback to 'Other'
  return questionExplanations[industry as Industry] || questionExplanations['Other']
}

/* ── SMP side (§482.2) ─────────────────────────────────────────────── */

/* A SWOT question key → which library and which entry. The sixteen
   internal questions have no entry and keep their short help. */
const KEY_MAP: Record<string, ["destep" | "porter", string]> = {
  rivalry: ["porter", "competitiveRivalry"],
  entrants: ["porter", "threatOfNewEntrants"],
  substitutes: ["porter", "threatOfSubstitutes"],
  suppliers: ["porter", "supplierPower"],
  buyers: ["porter", "buyerPower"],
  demographic: ["destep", "demographics"],
  economic: ["destep", "economic"],
  social: ["destep", "socialCultural"],
  technological: ["destep", "technological"],
  environmental: ["destep", "environmental"],
  political: ["destep", "politicalLegal"],
};

/* The client's industry is a name from the set-up flow's list (§322); the
   library knows sixteen. Anything not named here reads as Other. */
const INDUSTRY_MAP: Record<string, Industry> = {
  "Technology & Software": "Technology",
  "Telecommunications": "Telecommunications",
  "Media & Entertainment": "Media & Entertainment",
  "Banking & Finance": "Financial Services",
  "Insurance": "Financial Services",
  "Investment & Asset Management": "Financial Services",
  "Healthcare & Hospitals": "Healthcare",
  "Pharmaceuticals & Biotech": "Healthcare",
  "Medical Devices & Equipment": "Healthcare",
  "Retail & E-commerce": "Retail",
  "Consumer Goods & FMCG": "Retail",
  "Food & Beverage": "Retail",
  "Fashion & Apparel": "Retail",
  "Hospitality & Tourism": "Hospitality",
  "Restaurants & Food Service": "Hospitality",
  "Sports & Recreation": "Hospitality",
  "Manufacturing": "Manufacturing",
  "Automotive": "Manufacturing",
  "Aerospace & Defense": "Manufacturing",
  "Chemicals": "Manufacturing",
  "Industrial Equipment & Machinery": "Manufacturing",
  "Mining & Metals": "Manufacturing",
  "Printing & Publishing": "Media & Entertainment",
  "Oil & Gas": "Energy",
  "Renewable Energy": "Energy",
  "Utilities (Electric, Water, Gas)": "Energy",
  "Real Estate & Property": "Real Estate",
  "Construction & Engineering": "Construction",
  "Architecture & Design": "Construction",
  "Professional Services & Consulting": "Professional Services",
  "Legal Services": "Professional Services",
  "Accounting & Audit": "Professional Services",
  "Marketing & Advertising": "Professional Services",
  "HR & Recruitment": "Professional Services",
  "Transportation & Logistics": "Transportation",
  "Shipping & Maritime": "Transportation",
  "Aviation & Airlines": "Transportation",
  "Education & Training": "Education",
  "Agriculture & Farming": "Agriculture",
};

export function libraryIndustry(industry: string | null | undefined): Industry {
  return INDUSTRY_MAP[String(industry || "")] || "Other";
}

export type QuestionHelp = ExpandedExplanation & { industry: Industry };

/* The help for one SWOT question in this client's industry, or null for a
   question the library does not cover. */
export function helpFor(key: string, industry: string | null | undefined): QuestionHelp | null {
  const m = KEY_MAP[key];
  if (!m) return null;
  const ind = libraryIndustry(industry);
  return { ...getExplanation(m[0], m[1], ind), industry: ind };
}
