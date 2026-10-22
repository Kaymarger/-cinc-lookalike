/** Sample CINC-style CRM data for the agent demo (not real leads). */

export type CrmPipeline =
  | "New"
  | "Attempted"
  | "Contacted"
  | "Showing"
  | "Nurture"
  | "Closed";

export type CrmLeadType = "Buyer" | "Seller" | "Partial" | "Recruit";

export type CrmLead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  rating: number;
  type: CrmLeadType;
  pipeline: CrmPipeline;
  registeredAgo: string;
  source: string;
  price: string;
  city: string;
  timeframe: string;
  lastLogin: string;
  logins: number;
  lastTouch: string;
  nextReminder: string;
  reminderOverdue?: boolean;
  views: number;
  saved: number;
  fav: number;
  inq: number;
  assignedTo: string;
  verified?: boolean;
  initials: string;
  activity: CrmActivity[];
  propertySnippet?: {
    address: string;
    price: string;
    image: string;
    message: string;
    kind: string;
  };
};

export type CrmActivity = {
  id: string;
  at: string;
  kind: "note" | "assignment" | "inquiry" | "showing" | "system" | "call" | "text" | "email" | "task";
  title: string;
  body?: string;
  actor?: string;
};

export type CrmDeal = {
  id: string;
  stage: "showing" | "offer" | "contract" | "closed";
  title: string;
  address: string;
  price: string;
  client: string;
  potential: string;
};

export type CrmMessage = {
  id: string;
  sender: string;
  preview: string;
  time: string;
  unread?: boolean;
};

export type CrmAutoTrack = {
  id: string;
  name: string;
  category: "General" | "Buyer" | "Listing" | "Nurture" | "Past Client" | "My AutoTracks";
  status: "active" | "paused" | "draft";
};

export type CrmProperty = {
  id: string;
  address: string;
  mls: string;
  status: string;
  price: string;
  beds: number;
  baths: number;
  sqft: number;
  updated: string;
  image: string;
  feature: string;
};

const IMG = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=200&q=80",
];

export const CRM_AGENT = {
  name: "Casey Archibald",
  initials: "CA",
  greetingName: "Casey",
};

export const CRM_LEADS: CrmLead[] = [
  {
    id: "crm-1",
    name: "Morgan Ellis",
    email: "morgan.ellis@example.com",
    phone: "(604) 555-0188",
    rating: 4.0,
    type: "Seller",
    pipeline: "Contacted",
    registeredAgo: "20 hours",
    source: "Referral Exchange",
    price: "$ n/a",
    city: "Vancouver",
    timeframe: "6-12 months",
    lastLogin: "18 hours",
    logins: 3,
    lastTouch: "12 hours",
    nextReminder: "-3 days",
    reminderOverdue: true,
    views: 14,
    saved: 2,
    fav: 1,
    inq: 3,
    assignedTo: "Casey Archibald",
    verified: true,
    initials: "MH",
    activity: [
      {
        id: "a1",
        at: "10/18/2026 at 2:10 pm",
        kind: "note",
        title: "Note Added",
        body: "Already in contact with an agent.",
        actor: "Casey Archibald",
      },
      {
        id: "a2",
        at: "10/18/2026 at 9:02 am",
        kind: "assignment",
        title: "Lead Was Assigned To Casey Archibald (Buyer's Agent)",
      },
    ],
    propertySnippet: {
      address: "2072 Kitchener St, Vancouver, BC V5L 2W8",
      price: "$1,999,999",
      image: IMG[0],
      message: "I want more info about this home",
      kind: "Property Inquiry",
    },
  },
  {
    id: "crm-2",
    name: "Jordan Blake",
    email: "jordan.blake@example.com",
    phone: "(778) 555-0144",
    rating: 3.5,
    type: "Buyer",
    pipeline: "Contacted",
    registeredAgo: "3 days",
    source: "Referral Exchange",
    price: "$1,200,000",
    city: "Burnaby",
    timeframe: "0-3 months",
    lastLogin: "2 days",
    logins: 7,
    lastTouch: "2 days",
    nextReminder: "Today",
    views: 28,
    saved: 5,
    fav: 3,
    inq: 2,
    assignedTo: "Casey Archibald",
    verified: true,
    initials: "JA",
    activity: [
      {
        id: "b1",
        at: "10/18/2026 at 4:22 pm",
        kind: "note",
        title: "Note Added",
        body: "Already in contact with an agent.",
        actor: "Casey Archibald",
      },
      {
        id: "b2",
        at: "10/17/2026 at 11:05 am",
        kind: "assignment",
        title: "Lead Was Assigned To Casey Archibald (Buyer's Agent)",
      },
      {
        id: "b3",
        at: "10/17/2026 at 10:58 am",
        kind: "assignment",
        title: "Lead Was Assigned To Demo ISA (Buyer's Agent)",
      },
    ],
    propertySnippet: {
      address: "405 4189 Cambie Street, Vancouver, BC V5Z 2Y2",
      price: "$1,299,000",
      image: IMG[1],
      message: "Can we see this Saturday afternoon?",
      kind: "Showing Request",
    },
  },
  {
    id: "crm-3",
    name: "Avery Quinn",
    email: "avery.quinn@example.com",
    phone: "(604) 555-0190",
    rating: 5.0,
    type: "Buyer",
    pipeline: "New",
    registeredAgo: "4 days",
    source: "IDX Registration",
    price: "$1,800,000",
    city: "West Vancouver",
    timeframe: "3-6 months",
    lastLogin: "4 days",
    logins: 1,
    lastTouch: "—",
    nextReminder: "Tomorrow",
    views: 6,
    saved: 0,
    fav: 0,
    inq: 1,
    assignedTo: "UNASSIGNED",
    verified: true,
    initials: "AK",
    activity: [
      {
        id: "c1",
        at: "10/17/2026 at 6:14 pm",
        kind: "inquiry",
        title: "Property Inquiry",
        body: "I want more info about this home",
      },
    ],
    propertySnippet: {
      address: "810 235 Keith Road, West Vancouver, BC V7T 1L5",
      price: "$2,149,000",
      image: IMG[2],
      message: "I want more info about this home",
      kind: "Property Inquiry",
    },
  },
  {
    id: "crm-4",
    name: "Devon Patel",
    email: "devon.p@example.com",
    phone: "(250) 555-0133",
    rating: 2.5,
    type: "Buyer",
    pipeline: "Attempted",
    registeredAgo: "1 week",
    source: "Facebook Lead Ad",
    price: "$900,000",
    city: "Richmond",
    timeframe: "6-12 months",
    lastLogin: "5 days",
    logins: 2,
    lastTouch: "5 days",
    nextReminder: "In 2 days",
    views: 9,
    saved: 1,
    fav: 0,
    inq: 0,
    assignedTo: "Casey Archibald",
    initials: "DP",
    activity: [
      {
        id: "d1",
        at: "10/15/2026 at 9:40 am",
        kind: "system",
        title: "Outbound call attempted — no answer",
      },
    ],
  },
  {
    id: "crm-5",
    name: "Sam Rivera",
    email: "sam.r@example.com",
    phone: "(604) 555-0171",
    rating: 4.5,
    type: "Seller",
    pipeline: "Showing",
    registeredAgo: "2 weeks",
    source: "Home Valuation",
    price: "$2,400,000",
    city: "Vancouver",
    timeframe: "0-3 months",
    lastLogin: "1 day",
    logins: 11,
    lastTouch: "1 day",
    nextReminder: "Fri",
    views: 4,
    saved: 0,
    fav: 0,
    inq: 2,
    assignedTo: "Casey Archibald",
    verified: true,
    initials: "SR",
    activity: [
      {
        id: "e1",
        at: "10/19/2026 at 1:00 pm",
        kind: "showing",
        title: "Showing Request",
        body: "Please book a CMA walkthrough this week.",
      },
    ],
    propertySnippet: {
      address: "1482 Robson St Unit 1202, Vancouver, BC",
      price: "$1,189,000",
      image: IMG[3],
      message: "Interested in listing after renovations",
      kind: "Showing Request",
    },
  },
  {
    id: "crm-6",
    name: "Priya Sharma",
    email: "priya.s@email.com",
    phone: "778-555-0198",
    rating: 3.0,
    type: "Buyer",
    pipeline: "Nurture",
    registeredAgo: "26 hours",
    source: "Search Alert",
    price: "$1,200,000",
    city: "Vancouver",
    timeframe: "3-6 months",
    lastLogin: "20 hours",
    logins: 4,
    lastTouch: "8 hours",
    nextReminder: "Mon",
    views: 19,
    saved: 4,
    fav: 2,
    inq: 1,
    assignedTo: "Casey Archibald",
    initials: "PS",
    activity: [
      {
        id: "f1",
        at: "10/20/2026 at 10:12 am",
        kind: "inquiry",
        title: "Search alert signup",
        body: "Vancouver · 2+ beds · under $1,200,000",
      },
    ],
  },
];

const SAMPLE_FIRST = ["Alex", "Blake", "Cameron", "Drew", "Eden", "Finn", "Gray", "Harper", "Indigo", "Jules", "Kai", "Lane", "Milan", "Noel", "Oakley", "Parker", "Quinn", "Reese", "Sage", "Taylor"];
const SAMPLE_LAST = ["Adler", "Brooks", "Cho", "Diaz", "Frost", "Gupta", "Hayes", "Ito", "Jones", "Khan", "Lopez", "Meyer", "Nguyen", "Ortiz", "Park", "Ross", "Shah", "Tran", "Walsh", "Young"];
const SAMPLE_CITIES = ["Vancouver", "Burnaby", "Richmond", "Surrey", "Coquitlam", "North Vancouver"];
const SAMPLE_PIPES: CrmPipeline[] = ["New", "Attempted", "Contacted", "Showing", "Nurture", "Closed"];
const SAMPLE_TYPES: CrmLeadType[] = ["Buyer", "Seller", "Partial", "Recruit"];
for (let i = 0; i < 120; i++) {
  const first = SAMPLE_FIRST[i % SAMPLE_FIRST.length];
  const last = SAMPLE_LAST[Math.floor(i / SAMPLE_FIRST.length) % SAMPLE_LAST.length];
  const hour = 8 + (i % 10);
  const minute = String(i % 60).padStart(2, "0");
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  CRM_LEADS.push({
    id: `crm-s${i + 1}`,
    name: `${first} ${last}`,
    email: `${first}.${last}${i}@example.com`.toLowerCase(),
    phone: `(604) 555-${String(2000 + i).slice(-4)}`,
    rating: 2 + (i % 4),
    type: SAMPLE_TYPES[i % SAMPLE_TYPES.length],
    pipeline: SAMPLE_PIPES[i % SAMPLE_PIPES.length],
    registeredAgo: `${(i % 20) + 1} days`,
    source: i % 2 ? "IDX Registration" : "Referral Exchange",
    price: i % 5 === 0 ? "$ n/a" : `$${800 + (i % 12) * 90}k`,
    city: SAMPLE_CITIES[i % SAMPLE_CITIES.length],
    timeframe: ["0-3 months", "3-6 months", "6-12 months"][i % 3],
    lastLogin: `${(i % 9) + 1} hours`,
    logins: (i % 12) + 1,
    lastTouch: i % 4 === 0 ? "—" : `${(i % 6) + 1} hours`,
    nextReminder: i % 7 === 0 ? "-2 days" : "n/a",
    reminderOverdue: i % 7 === 0,
    views: i % 15,
    saved: i % 4,
    fav: i % 3,
    inq: i % 5,
    assignedTo: i % 4 === 0 ? "UNASSIGNED" : "Casey Archibald",
    verified: i % 3 !== 0,
    initials: `${first[0]}${last[0]}`,
    activity: [
      {
        id: `sa${i}`,
        at: `10/21/2026 at ${h12}:${minute} ${ampm}`,
        kind: "assignment",
        title: "Lead Was Assigned To Casey Archibald (Buyer's Agent)",
        actor: "Casey Archibald",
      },
    ],
    propertySnippet: i < 100
      ? {
          address: `${100 + i} Sample St, ${SAMPLE_CITIES[i % SAMPLE_CITIES.length]}`,
          price: `$${(700 + (i % 20) * 50).toLocaleString()},000`,
          image: IMG[i % IMG.length],
          message: i % 2 ? "Showing requested for 2026/10/21" : "I want more info about this home",
          kind: i % 2 ? "Showing Request" : "Property Inquiry",
        }
      : undefined,
  });
}

export const CRM_TODAY_FEED = CRM_LEADS.filter((l) => l.propertySnippet).map(
  (l) => ({
    id: l.id,
    name: l.name,
    at: l.activity[0]?.at ?? "Recently",
    verified: l.verified,
    kind: l.propertySnippet!.kind,
    message: l.propertySnippet!.message,
    address: l.propertySnippet!.address,
    price: l.propertySnippet!.price,
    image: l.propertySnippet!.image,
  })
);

export const CRM_DEALS: CrmDeal[] = [
  {
    id: "deal-1",
    stage: "showing",
    title: "Kitsilano condo tour",
    address: "2020 Cornwall Ave",
    price: "$1,149,000",
    client: "Jordan Blake",
    potential: "$1.15M",
  },
  {
    id: "deal-2",
    stage: "offer",
    title: "Westside offer package",
    address: "405 4189 Cambie St",
    price: "$1,299,000",
    client: "Avery Quinn",
    potential: "$1.30M",
  },
  {
    id: "deal-3",
    stage: "contract",
    title: "Burnaby townhome",
    address: "5888 Olive Ave",
    price: "$1,088,000",
    client: "Devon Patel",
    potential: "$1.09M",
  },
];

export const CRM_MESSAGES: CrmMessage[] = [
  {
    id: "m1",
    sender: "System",
    preview:
      "Lead Morgan Ellis has been reassigned to you. http://mycinc.com/app_m/… STOP=EndMsgs",
    time: "9:42 AM",
    unread: true,
  },
  {
    id: "m2",
    sender: "System",
    preview:
      "Lead Jordan Blake has been reassigned to you. http://mycinc.com/app_m/… STOP=EndMsgs",
    time: "9:41 AM",
    unread: true,
  },
  {
    id: "m3",
    sender: "System",
    preview:
      "Lead Avery Quinn has been reassigned to you. http://mycinc.com/app_m/… STOP=EndMsgs",
    time: "9:40 AM",
  },
  {
    id: "m4",
    sender: "System",
    preview:
      "Lead Devon Patel has been reassigned to you. http://mycinc.com/app_m/… STOP=EndMsgs",
    time: "Yesterday",
  },
  {
    id: "m5",
    sender: "System",
    preview:
      "Lead Sam Rivera has been reassigned to you. http://mycinc.com/app_m/… STOP=EndMsgs",
    time: "Yesterday",
  },
];

export const CRM_AUTOTRACKS: CrmAutoTrack[] = [
  { id: "at1", name: "New Buyer Welcome", category: "Buyer", status: "active" },
  { id: "at2", name: "Seller CMA Follow-up", category: "Listing", status: "active" },
  { id: "at3", name: "Long-term Nurture", category: "Nurture", status: "active" },
  { id: "at4", name: "Past Client Anniversary", category: "Past Client", status: "paused" },
  { id: "at5", name: "IDX Registration Day 1-7", category: "General", status: "active" },
  { id: "at6", name: "Open House Attendee", category: "Buyer", status: "paused" },
  { id: "at7", name: "Sphere Monthly Market", category: "My AutoTracks", status: "active" },
  { id: "at8", name: "Price Drop Alert Path", category: "Buyer", status: "active" },
  { id: "at9", name: "Listing Live Blast", category: "Listing", status: "paused" },
  { id: "at10", name: "Contract to Close", category: "General", status: "active" },
  { id: "at11", name: "Cold Lead Reheat", category: "Nurture", status: "paused" },
  { id: "at12", name: "Holiday Check-in", category: "Past Client", status: "paused" },
  { id: "at13", name: "Home Estimate Capture", category: "Listing", status: "active" },
  { id: "at14", name: "Showing No-Show Recovery", category: "Buyer", status: "active" },
  { id: "at15", name: "Custom Westside Buyers", category: "My AutoTracks", status: "paused" },
  { id: "at16", name: "Recruit Mentorship", category: "General", status: "draft" },
];

export const CRM_PROPERTIES: CrmProperty[] = [
  {
    id: "p1",
    address: "5628 Birney Ave Unit 101, Vancouver",
    mls: "R2391990",
    status: "Active",
    price: "$1,298,000",
    beds: 3,
    baths: 3,
    sqft: 1215,
    updated: "2 hours ago",
    image: IMG[1],
    feature: "General Listing",
  },
  {
    id: "p2",
    address: "7305 Coronado Dr, Burnaby",
    mls: "R2389012",
    status: "Active",
    price: "$868,800",
    beds: 3,
    baths: 3,
    sqft: 1840,
    updated: "Yesterday",
    image: IMG[0],
    feature: "General Listing",
  },
  {
    id: "p3",
    address: "1416 Purcell Dr, Coquitlam",
    mls: "R2391044",
    status: "Active",
    price: "$1,149,000",
    beds: 4,
    baths: 3,
    sqft: 2100,
    updated: "3 days ago",
    image: IMG[2],
    feature: "General Listing",
  },
  {
    id: "p4",
    address: "5888 Olive Ave, Burnaby",
    mls: "R2392201",
    status: "Active",
    price: "$1,800 per month",
    beds: 1,
    baths: 1,
    sqft: 564,
    updated: "5 days ago",
    image: IMG[3],
    feature: "General Listing",
  },
  {
    id: "p5",
    address: "1188 Richards St Unit 2102, Vancouver",
    mls: "R2401188",
    status: "Active",
    price: "$3,995 per month",
    beds: 2,
    baths: 2,
    sqft: 1552,
    updated: "Oct 21, 2026",
    image: IMG[0],
    feature: "General Listing",
  },
  {
    id: "p6",
    address: "4488 Juneau St, Burnaby",
    mls: "R2402204",
    status: "Active",
    price: "$1,588,000",
    beds: 4,
    baths: 3,
    sqft: 2410,
    updated: "Oct 20, 2026",
    image: IMG[2],
    feature: "General Listing",
  },
];

export const CRM_OPEN_HOUSES = [
  {
    id: "oh1",
    address: "5628 Birney Ave Unit 101, Vancouver",
    mls: "R2391990",
    price: "$1,298,000",
    beds: 3,
    baths: 3,
    sqft: 1215,
    updated: "Oct 21, 2026",
    image: IMG[1],
    when: "Wednesday, October 21, 12:00 PM to 05:00 PM",
  },
  {
    id: "oh2",
    address: "7305 Coronado Dr, Burnaby",
    mls: "R2389012",
    price: "$868,800",
    beds: 3,
    baths: 3,
    sqft: 1840,
    updated: "Oct 20, 2026",
    image: IMG[0],
    when: "Saturday, October 24, 1:00 PM to 3:00 PM",
  },
  {
    id: "oh3",
    address: "1416 Purcell Dr, Coquitlam",
    mls: "R2391044",
    price: "$1,149,000",
    beds: 4,
    baths: 3,
    sqft: 2100,
    updated: "Oct 19, 2026",
    image: IMG[2],
    when: "Sunday, October 25, 2:00 PM to 4:00 PM",
  },
];

export function getCrmLead(id: string) {
  return CRM_LEADS.find((l) => l.id === id);
}
