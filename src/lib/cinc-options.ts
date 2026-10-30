/** Exact option text from the Oct 28 2026 CINC back-office capture. */

export const ENGAGEMENTS = [
  "T/Th (Best for personalized search)",
  "Daily (Best for default search)",
  "M/W/F",
  "Weekdays",
  "Weekends",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Bi-Weekly",
  "Monthly",
  "Never",
] as const;

export const CINC_PROPERTY_TYPES = [
  "Condominium",
  "Land/Lot",
  "Manufactured/Mobile",
  "Multi-Family",
  "Rental",
  "Single Family",
  "Townhouse",
] as const;

export const LISTING_STATUSES = ["Active", "Active Under Contract"] as const;

export const DAYS_ON_SITE = [
  "Any",
  "New Listings (since yesterday)",
  "< 3 days",
  "< 7 days",
  "< 14 days",
  "< 30 days",
  "< 90 days",
  "< 6 months",
  "< 12 months",
] as const;

export const SPACE_OPTIONS = ["Any", "1+ space", "2+ spaces", "3+ spaces", "4+ spaces", "5+ spaces"] as const;

export const STORIES_MIN = ["Any", "1+", "1 Story Only", "2+", "3+", "4+"] as const;
export const STORIES_EXACT = ["Any", "1", "2", "3", "4", "5"] as const;
export const FIREPLACES = ["Any", "1+", "2+", "3+"] as const;

export const OWNERSHIP_TYPES = [
  "Freehold Nonstrata",
  "Freehold Strata",
  "Leasehold Not Prepaid-Nonstrata",
  "Leasehold Not Prepaid-Strata",
  "Leasehold Prepaid-Nonstrata",
  "Leasehold Prepaid-Strata",
  "Shares In Co-Operative",
  "Time Share",
  "Undivided Interest",
] as const;

export const HOME_STYLES = [
  "1 1/2 Storey",
  "1 1/2 Storey,2 Storey",
  "1 Storey",
  "1 Storey,basement Entry",
  "1 Storey,corner Unit",
  "1 Storey,ground Level Unit",
  "1 Storey,rancher/Bungalow",
  "1 Storey,rancher/Bungalow W/Loft",
  "1 Storey,upper Unit",
  "2 Storey",
  "2 Storey W/Bsmt.",
  "2 Storey W/Bsmt.,3 Storey",
  "2 Storey W/Bsmt.,4 Level Split",
  "2 Storey W/Bsmt.,basement Entry",
  "2 Storey W/Bsmt.,carriage/Coach House",
  "2 Storey W/Bsmt.,corner Unit",
  "2 Storey W/Bsmt.,end Unit",
  "2 Storey W/Bsmt.,laneway House",
  "2 Storey W/Bsmt.,split Entry",
  "2 Storey,2 Storey W/Bsmt.",
  "2 Storey,basement Entry",
  "2 Storey,carriage/Coach House",
  "2 Storey,corner Unit",
  "2 Storey,end Unit",
  "2 Storey,other",
  "2 Storey,penthouse",
  "2 Storey,rancher/Bungalow W/Bsmt.",
  "2 Storey,split Entry",
  "3 Level Split",
  "3 Level Split,ground Level Unit",
  "3 Storey",
  "3 Storey,basement Entry",
  "3 Storey,corner Unit",
  "3 Storey,laneway House",
  "3 Storey,rancher/Bungalow W/Bsmt.",
  "3 Storey,upper Unit",
  "4 Level Split",
  "5 Plus Level",
  "5 Plus Level,ground Level Unit",
  "Basement Entry",
  "Basement Entry,end Unit",
  "Carriage/Coach House",
  "Corner Unit",
  "Corner Unit,end Unit",
  "Corner Unit,upper Unit",
  "End Unit",
  "End Unit,ground Level Unit",
  "End Unit,penthouse",
  "End Unit,upper Unit",
  "Floating Home",
  "Ground Level Unit",
  "Ground Level Unit,inside Unit",
  "Inside Unit",
  "Inside Unit,other",
  "Inside Unit,upper Unit",
  "Live/Work Studio",
  "Loft/Warehouse Conv.",
  "Manufactured/Mobile",
  "Penthouse",
  "Penthouse,upper Unit",
  "Rancher/Bungalow",
  "Rancher/Bungalow W/Bsmt.",
  "Rancher/Bungalow W/Loft",
  "Rancher/Bungalow,split Entry",
  "Split Entry",
  "Upper Unit",
] as const;

export const SEARCH_TAGS = [
  "Air Conditioning",
  "Any View",
  "Balcony",
  "Basement",
  "Bay View",
  "Central AC",
  "Central Heating",
  "City View",
  "Club House",
  "Community Park",
  "Cul-de-sac Lot",
  "Elevator",
  "Finished Basement",
  "Full Basement",
  "Gas Heating",
  "Gated Community",
  "Golf Course",
  "Golf Lot",
  "Golf View",
  "Has Utilities",
  "Homeowner Association",
  "Lagoon View",
  "Lake View",
  "Laundry Room",
  "Manufactured",
  "Marina View",
  "Mountain View",
  "Ocean View",
  "Partial Basement",
  "Pets Allowed",
  "Pool",
  "Recreational Facilities",
  "Reduced Price",
  "Rentals",
  "River View",
  "RV/Boat Parking",
  "Security Features",
  "Senior Community",
  "Shop",
  "Unfinished Basement",
  "Walkout Basement",
  "Water View",
  "Waterfront Lot",
] as const;

export const LABEL_GROUPS: { name: string; labels: string[] }[] = [
  {
    name: "Miscellaneous",
    labels: [
      "A - HOT LEAD",
      "ARCHIVE",
      "Cassie Stats",
      "Dora",
      "Exclude From Team Newsletter",
      "Follow Up Reminders",
      "Lancaster",
      "Latin Fest",
      "LinkedIn Spanish",
      "Listing Lead",
      "Market Reports",
      "Monthly",
      "Pause Autotrack",
      "Ray",
      "REMOVE",
      "REW",
      "Spanish Lead",
      "Training Leads",
      "Weekly",
      "X",
    ],
  },
  {
    name: "Uncategorized",
    labels: [
      "Already Bought",
      "Already Sold",
      "Bad Phone",
      "Foreign Buyers",
      "Has a Realtor",
      "Kevin Referral Exchange",
      "No Answer",
      "Not Interested",
      "Open House",
      "Property Management",
      "Wrong Number",
    ],
  },
];

export const ACTIVITY_FILTER_GROUPS: { name: string; items: string[] }[] = [
  {
    name: "Communications",
    items: [
      "Artificial Intelligence (AI)",
      "AutoTracks",
      "Behavioral Communication",
      "Calls",
      "Direct Mailers",
      "Emails",
      "Property Alerts",
      "Text Conversations",
    ],
  },
  {
    name: "Lead Activity",
    items: ["Favorites", "Inquiries", "Logins", "Property Views", "Registration Date", "Searches", "Unsubscribes"],
  },
  {
    name: "Team Activity",
    items: ["Appointments", "Assigned Agent", "Label", "Notes", "Pipeline", "Reminders"],
  },
  {
    name: "Updates",
    items: ["Lead Info Updates", "Saved Search", "Status History"],
  },
];

export const OFFICE_ROSTER = [
  "Anastasiia Borovyk",
  "Ann-Marie Copping",
  "Casey Archibald",
  "Cassie Kang",
  "Chantel Machnik",
  "Denisse Moran",
  "Doris Stratoberdha",
  "Kayla Gerak",
  "Kevin Barrett",
] as const;

export const REMINDER_TIMING = [
  "Never",
  "On Time",
  "15 minutes early",
  "30 minutes early",
  "45 minutes early",
  "1 hour early",
  "2 hours early",
] as const;

export function clockTimes(): string[] {
  const times: string[] = [];
  for (let hour = 12; hour <= 12; hour += 1) {
    for (const minute of [0, 15, 30, 45]) times.push(`${hour}:${String(minute).padStart(2, "0")}`);
  }
  for (let hour = 1; hour <= 11; hour += 1) {
    for (const minute of [0, 15, 30, 45]) times.push(`${hour}:${String(minute).padStart(2, "0")}`);
  }
  return times;
}

export const AUTOTRACK_LEAD_TYPES = ["Everyone", "Buyer", "Seller", "Buyer & Seller", "Recruit"] as const;

export const AUTOTRACK_PIPELINES = [
  "Lead: Attempted Contact",
  "Lead: Contacted",
  "Lead: Appt Set",
  "Lead: Appt Met",
  "Lead: Active Client",
  "Lead: Pending Client",
  "Lead: Past Client",
] as const;

export const AUTOTRACK_LANDING_PAGES = [
  "General Landing Page",
  "Buyer Landing Page",
  "Seller Landing Page",
  "Affiliate Landing Page",
  "Contact Landing Page",
] as const;

export const MERGE_TAGS = [
  "[FIRSTNAME]",
  "[LASTNAME]",
  "[FULLNAME]",
  "[CELLPHONE]",
  "[EMAIL]",
  "[FAVORITE CITY]",
  "[ADDRESS]",
  "[SECONDARY CONTACT]",
  "[WEBSITE]",
  "[TIMEOFDAY]",
  "[AGENT FIRSTNAME]",
  "[AGENT LASTNAME]",
  "[AGENT CELLPHONE]",
  "[AGENT CINC NUMBER]",
  "[AGENT EMAIL]",
  "[AGENT LICENSENUMBER]",
  "[LISTINGAGENT FIRSTNAME]",
  "[LISTINGAGENT LASTNAME]",
  "[LISTINGAGENT CELLPHONE]",
  "[LISTINGAGENT EMAIL]",
  "[PARTNER FIRSTNAME]",
  "[PARTNER LASTNAME]",
  "[PARTNER CELLPHONE]",
  "[PARTNER EMAIL]",
  "[PARTNER COMPANY]",
  "[PARTNER WEBSITE]",
  "[PARTNER LICENSE]",
  "[DAYOFWEEK]",
  "[MARKETREPORTLINK]",
  "[CHANGE_SETTINGS_LINK]",
  "[APPURL]",
  "[LOAN_APP_URL]",
] as const;

export const BLANK_TEMPLATES = ["Blank Calendar Template", "Blank Checklist Template", "Blank Template"] as const;

export const EMAIL_TEMPLATES = ["Select Email Template...", "Welcome", "Market Update", "Showing Follow Up"] as const;
