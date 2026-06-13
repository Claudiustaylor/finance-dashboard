export interface StateRule {
  state: string;
  abbrev: string;
  annualReport: {
    required: boolean;
    frequency: "annual" | "biennial";
    dueDate: string; // description of when it's due
    cost: number;
    lateFee: number;
    link: string;
    notes: string;
  };
  franchiseTax?: {
    required: boolean;
    dueDate: string;
    cost: string; // may vary
    link: string;
    notes: string;
  };
  registeredAgent: {
    required: boolean;
    notes: string;
  };
  foreignQualification: {
    required: boolean;
    cost: number;
    link: string;
    notes: string;
  };
  goodStanding: {
    link: string;
    notes: string;
  };
}

export const STATE_RULES: Record<string, StateRule> = {
  AL: {
    state: "Alabama",
    abbrev: "AL",
    annualReport: {
      required: true,
      frequency: "annual",
      dueDate: "By April 15 (LLC) or March 15 (corp)",
      cost: 100,
      lateFee: 100,
      link: "https://www.sos.alabama.gov/government/business-entities",
      notes: "File online via Alabama Secretary of State. LLCs and corps have different deadlines.",
    },
    franchiseTax: { required: false, dueDate: "N/A", cost: "N/A", link: "", notes: "No franchise tax in Alabama." },
    registeredAgent: { required: true, notes: "Must maintain registered agent and office in Alabama." },
    foreignQualification: { required: true, cost: 150, link: "https://www.sos.alabama.gov/government/business-entities", notes: "Foreign entities must register before doing business." },
    goodStanding: { link: "https://www.sos.alabama.gov/government/business-entities", notes: "Request certificate of existence online." },
  },
  AK: {
    state: "Alaska",
    abbrev: "AK",
    annualReport: {
      required: true,
      frequency: "biennial",
      dueDate: "By Jan 2 of filing anniversary year (biennial)",
      cost: 100,
      lateFee: 50,
      link: "https://www.commerce.alaska.gov/web/cbpl/Corporations.aspx",
      notes: "Biennial for LLCs and corps. File via Alaska Division of Corporations.",
    },
    franchiseTax: { required: false, dueDate: "N/A", cost: "N/A", link: "", notes: "No franchise tax." },
    registeredAgent: { required: true, notes: "Required. Must have physical address in Alaska." },
    foreignQualification: { required: true, cost: 350, link: "https://www.commerce.alaska.gov/web/cbpl/Corporations.aspx", notes: "Certificate of good standing required from home state." },
    goodStanding: { link: "https://www.commerce.alaska.gov/web/cbpl/Corporations.aspx", notes: "Search and request certificates online." },
  },
  AZ: {
    state: "Arizona",
    abbrev: "AZ",
    annualReport: {
      required: false,
      frequency: "annual",
      dueDate: "N/A",
      cost: 0,
      lateFee: 0,
      link: "https://azsos.gov/business",
      notes: "No annual report required for LLCs. Corporations file annually.",
    },
    franchiseTax: { required: false, dueDate: "N/A", cost: "N/A", link: "", notes: "No franchise tax." },
    registeredAgent: { required: true, notes: "Required. Statutory agent must have physical address in Arizona." },
    foreignQualification: { required: true, cost: 150, link: "https://azsos.gov/business", notes: "Foreign LLCs and corps must register." },
    goodStanding: { link: "https://azsos.gov/business", notes: "Search records and request certificates online." },
  },
  AR: {
    state: "Arkansas",
    abbrev: "AR",
    annualReport: {
      required: true,
      frequency: "annual",
      dueDate: "By May 1",
      cost: 150,
      lateFee: 25,
      link: "https://www.sos.arkansas.gov/corps/",
      notes: "File online via Arkansas Secretary of State. LLCs and corps both file.",
    },
    franchiseTax: { required: true, dueDate: "May 1", cost: "Varies by capital stock", link: "https://www.dfa.arkansas.gov/", notes: "Franchise tax report due with annual report." },
    registeredAgent: { required: true, notes: "Registered agent required with Arkansas address." },
    foreignQualification: { required: true, cost: 270, link: "https://www.sos.arkansas.gov/corps/", notes: "Certificate of good standing required." },
    goodStanding: { link: "https://www.sos.arkansas.gov/corps/", notes: "Request certificate of good standing online." },
  },
  CA: {
    state: "California",
    abbrev: "CA",
    annualReport: {
      required: true,
      frequency: "biennial",
      dueDate: "LLCs: by 15th day of 4th month after filing anniversary. Corps: annual (by 15th day of anniversary month).",
      cost: 800,
      lateFee: 250,
      link: "https://bizfile.sos.ca.gov/",
      notes: "CA LLCs file biennial Statement of Information ($20). Minimum franchise tax is $800/year for corps and LLCs.",
    },
    franchiseTax: {
      required: true,
      dueDate: "15th day of 4th month after tax year begins",
      cost: "$800 minimum + % of net income",
      link: "https://www.ftb.ca.gov/",
      notes: "All corps and LLCs pay $800 minimum franchise tax. First year may be waived for LLCs.",
    },
    registeredAgent: { required: true, notes: "Agent for service of process required. Can be individual or corporation with CA address." },
    foreignQualification: { required: true, cost: 70, link: "https://bizfile.sos.ca.gov/", notes: "Register within 90 days of commencing intrastate business." },
    goodStanding: { link: "https://bizfile.sos.ca.gov/", notes: "Request Certificate of Status online. $5 fee." },
  },
  CO: {
    state: "Colorado",
    abbrev: "CO",
    annualReport: {
      required: true,
      frequency: "annual",
      dueDate: "By end of filing anniversary month",
      cost: 10,
      lateFee: 50,
      link: "https://www.sos.state.co.us/",
      notes: "File online via Colorado Secretary of State. Very low filing fee.",
    },
    franchiseTax: { required: false, dueDate: "N/A", cost: "N/A", link: "", notes: "No franchise tax." },
    registeredAgent: { required: true, notes: "Required. Must have Colorado address." },
    foreignQualification: { required: true, cost: 100, link: "https://www.sos.state.co.us/", notes: "Statement of Foreign Entity Authority required." },
    goodStanding: { link: "https://www.sos.state.co.us/", notes: "Search and request certificates online." },
  },
  CT: {
    state: "Connecticut",
    abbrev: "CT",
    annualReport: {
      required: true,
      frequency: "annual",
      dueDate: "By end of anniversary month",
      cost: 80,
      lateFee: 50,
      link: "https://portal.ct.gov/sots",
      notes: "File online via Connecticut Secretary of State. LLCs and corps both file.",
    },
    franchiseTax: { required: false, dueDate: "N/A", cost: "N/A", link: "", notes: "Business entity tax repealed. No franchise tax for LLCs." },
    registeredAgent: { required: true, notes: "Registered agent required with Connecticut address." },
    foreignQualification: { required: true, cost: 120, link: "https://portal.ct.gov/sots", notes: "Certificate of legal existence required from home state." },
    goodStanding: { link: "https://portal.ct.gov/sots", notes: "Request certificate of good standing online." },
  },
  DE: {
    state: "Delaware",
    abbrev: "DE",
    annualReport: {
      required: true,
      frequency: "annual",
      dueDate: "LLCs: June 1. Corps: March 1.",
      cost: 300,
      lateFee: 200,
      link: "https://corp.delaware.gov/",
      notes: "Delaware is the most popular incorporation state. Annual franchise tax also required for corps.",
    },
    franchiseTax: {
      required: true,
      dueDate: "March 1 (corps) / June 1 (LLCs)",
      cost: "$300 min for LLCs. Corps: calc by authorized shares or assumed par value.",
      link: "https://corp.delaware.gov/",
      notes: "LLCs pay flat $300 annual tax. Corps pay calculated franchise tax (often $400-200k+).",
    },
    registeredAgent: { required: true, notes: "Required. Must maintain registered agent in Delaware. Most entities use commercial registered agent services." },
    foreignQualification: { required: true, cost: 200, link: "https://corp.delaware.gov/", notes: "Certificate of existence required. Must also maintain DE registered agent." },
    goodStanding: { link: "https://corp.delaware.gov/", notes: "Request certificate of good standing online. $50 fee." },
  },
  FL: {
    state: "Florida",
    abbrev: "FL",
    annualReport: {
      required: true,
      frequency: "annual",
      dueDate: "By May 1 (LLCs and corps)",
      cost: 138.75,
      lateFee: 400,
      link: "https://dos.myflorida.com/sunbiz/",
      notes: "File via Sunbiz. Late fee is steep — $400 after May 1 for LLCs, $400 after 3rd Friday in Sept for corps.",
    },
    franchiseTax: { required: false, dueDate: "N/A", cost: "N/A", link: "", notes: "No franchise tax for LLCs. Corps may owe state income tax." },
    registeredAgent: { required: true, notes: "Required. Must have Florida street address (no PO boxes)." },
    foreignQualification: { required: true, cost: 125, link: "https://dos.myflorida.com/sunbiz/", notes: "Certificate of existence required from home state." },
    goodStanding: { link: "https://dos.myflorida.com/sunbiz/", notes: "Request certificate of status online. $8.75 fee." },
  },
  GA: {
    state: "Georgia",
    abbrev: "GA",
    annualReport: {
      required: true,
      frequency: "annual",
      dueDate: "By April 1 (LLCs and corps)",
      cost: 50,
      lateFee: 25,
      link: "https://ecorp.sos.ga.gov/",
      notes: "File online via Georgia Corporations Division. Corporations also file initial report within 90 days of incorporation.",
    },
    franchiseTax: {
      required: true,
      dueDate: "March 15 (corps) / April 1 (LLCs)",
      cost: "$25 minimum for corps. LLCs: no net worth tax.",
      link: "https://dor.georgia.gov/",
      notes: "Corporations pay net worth tax. LLCs are pass-through and don't pay GA net worth tax directly.",
    },
    registeredAgent: { required: true, notes: "Registered agent with Georgia address required." },
    foreignQualification: { required: true, cost: 225, link: "https://ecorp.sos.ga.gov/", notes: "Certificate of existence from home state required." },
    goodStanding: { link: "https://ecorp.sos.ga.gov/", notes: "Request certificate of existence online. $10 fee." },
  },
  NV: {
    state: "Nevada",
    abbrev: "NV",
    annualReport: {
      required: true,
      frequency: "annual",
      dueDate: "By last day of anniversary month",
      cost: 150,
      lateFee: 100,
      link: "https://www.nvsos.gov/",
      notes: "File via SilverFlume. Annual list of officers/managers also required ($150).",
    },
    franchiseTax: { required: false, dueDate: "N/A", cost: "N/A", link: "", notes: "No franchise tax. No state income tax." },
    registeredAgent: { required: true, notes: "Commercial registered agent very common in Nevada. Must have NV business license." },
    foreignQualification: { required: true, cost: 425, link: "https://www.nvsos.gov/", notes: "Certificate of good standing required. Higher fees than many states." },
    goodStanding: { link: "https://www.nvsos.gov/", notes: "Request certificate of good standing online." },
  },
  NY: {
    state: "New York",
    abbrev: "NY",
    annualReport: {
      required: false,
      frequency: "biennial",
      dueDate: "LLCs: no report required. Corps: biennial statement in filing anniversary month.",
      cost: 9,
      lateFee: 0,
      link: "https://www.dos.ny.gov/",
      notes: "LLCs have no annual/biennial report. Corps file biennial statement ($9) every 2 years.",
    },
    franchiseTax: {
      required: true,
      dueDate: "March 15 (corps) or within 30 days after tax year ends",
      cost: "$25 minimum for S-corp. C-corp: higher. LLCs/LLPs: filing fee varies.",
      link: "https://www.tax.ny.gov/",
      notes: "Corporations pay franchise tax. LLCs and LLPs pay filing fees based on gross income (up to $4,500).",
    },
    registeredAgent: { required: true, notes: "Registered agent required with NY address. LLCs must publish formation notice in 2 newspapers (costs $500-2000)." },
    foreignQualification: { required: true, cost: 225, link: "https://www.dos.ny.gov/", notes: "Certificate of good standing required. LLCs must also publish in NY newspapers." },
    goodStanding: { link: "https://www.dos.ny.gov/", notes: "Request certificate of good standing online. $25 fee." },
  },
  TX: {
    state: "Texas",
    abbrev: "TX",
    annualReport: {
      required: true,
      frequency: "annual",
      dueDate: "May 15 (anniversary month for corps, LLCs due by 15th day of 4th month after tax year ends)",
      cost: 0,
      lateFee: 50,
      link: "https://mycpa.cpa.state.tx.us/",
      notes: "Public Information Report (PIR) filed with franchise tax return. No annual report fee, but franchise tax applies.",
    },
    franchiseTax: {
      required: true,
      dueDate: "May 15",
      cost: "No tax if revenue under $1.23M. Above: 0.375-0.75% of margin.",
      link: "https://comptroller.texas.gov/",
      notes: "No franchise tax if annualized total revenue is below $1.23M (threshold changes). No tax due form still required.",
    },
    registeredAgent: { required: true, notes: "Registered agent required with Texas address." },
    foreignQualification: { required: true, cost: 750, link: "https://mycpa.cpa.state.tx.us/", notes: "Application for registration required. Higher fee than most states." },
    goodStanding: { link: "https://mycpa.cpa.state.tx.us/", notes: "Request certificate of fact/standing online." },
  },
  WY: {
    state: "Wyoming",
    abbrev: "WY",
    annualReport: {
      required: true,
      frequency: "annual",
      dueDate: "First day of filing anniversary month",
      cost: 50,
      lateFee: 25,
      link: "https://wyobiz.wyo.gov/",
      notes: "File online via Wyoming Secretary of State. Very business-friendly state.",
    },
    franchiseTax: { required: false, dueDate: "N/A", cost: "N/A", link: "", notes: "No franchise tax. No state income tax." },
    registeredAgent: { required: true, notes: "Registered agent with Wyoming address required." },
    foreignQualification: { required: true, cost: 100, link: "https://wyobiz.wyo.gov/", notes: "Certificate of good standing required from home state." },
    goodStanding: { link: "https://wyobiz.wyo.gov/", notes: "Search and request certificates online." },
  },
};

// Generic fallback for states not in detailed database
export const GENERIC_RULE: StateRule = {
  state: "",
  abbrev: "",
  annualReport: {
    required: true,
    frequency: "annual",
    dueDate: "Varies by state — typically anniversary month or fixed calendar date",
    cost: 50,
    lateFee: 25,
    link: "",
    notes: "Check your state's Secretary of State website for exact requirements. Most states require annual or biennial reports.",
  },
  franchiseTax: { required: false, dueDate: "", cost: "Varies", link: "", notes: "Some states impose franchise tax. Check with your state's revenue department." },
  registeredAgent: { required: true, notes: "Almost all states require a registered agent with an in-state address." },
  foreignQualification: { required: true, cost: 150, link: "", notes: "Foreign entities generally must register before doing business in a state." },
  goodStanding: { link: "", notes: "Request certificate of good standing from the Secretary of State." },
};

export const ALL_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
];

export function getStateRule(abbrev: string): StateRule {
  return STATE_RULES[abbrev] || { ...GENERIC_RULE, state: ALL_STATES.find((s) => s.value === abbrev)?.label || abbrev, abbrev };
}
