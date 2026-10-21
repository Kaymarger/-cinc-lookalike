import type { City, Property, PropertyType } from "./types";

export const LISTING_TAGS = [
  "Waterfront",
  "Renovated",
  "Ocean View",
  "Mountain View",
  "New Build",
  "Family",
  "Investment",
  "Virtual Tour",
  "Open House",
  "Luxury",
] as const;

type Hood = {
  name: string;
  city: City;
  lat: number;
  lng: number;
  postal: string;
  price: number;
};

const HOODS: Hood[] = [
  { name: "Kitsilano", city: "Vancouver", lat: 49.268, lng: -123.168, postal: "V6K", price: 1.28 },
  { name: "Mount Pleasant", city: "Vancouver", lat: 49.263, lng: -123.1, postal: "V5T", price: 1.15 },
  { name: "Yaletown", city: "Vancouver", lat: 49.275, lng: -123.121, postal: "V6B", price: 1.35 },
  { name: "Kerrisdale", city: "Vancouver", lat: 49.234, lng: -123.155, postal: "V6M", price: 1.45 },
  { name: "Dunbar", city: "Vancouver", lat: 49.247, lng: -123.185, postal: "V6S", price: 1.4 },
  { name: "Point Grey", city: "Vancouver", lat: 49.264, lng: -123.205, postal: "V6R", price: 1.75 },
  { name: "Fairview", city: "Vancouver", lat: 49.263, lng: -123.13, postal: "V6H", price: 1.12 },
  { name: "West End", city: "Vancouver", lat: 49.285, lng: -123.132, postal: "V6E", price: 1.18 },
  { name: "Coal Harbour", city: "Vancouver", lat: 49.291, lng: -123.124, postal: "V6C", price: 1.7 },
  { name: "Strathcona", city: "Vancouver", lat: 49.278, lng: -123.088, postal: "V6A", price: 1.05 },
  { name: "Hastings-Sunrise", city: "Vancouver", lat: 49.281, lng: -123.045, postal: "V5K", price: 0.95 },
  { name: "Renfrew", city: "Vancouver", lat: 49.258, lng: -123.045, postal: "V5R", price: 0.92 },
  { name: "Killarney", city: "Vancouver", lat: 49.224, lng: -123.038, postal: "V5S", price: 0.9 },
  { name: "Marpole", city: "Vancouver", lat: 49.21, lng: -123.13, postal: "V6P", price: 0.98 },
  { name: "Oakridge", city: "Vancouver", lat: 49.23, lng: -123.116, postal: "V6P", price: 1.1 },
  { name: "South Granville", city: "Vancouver", lat: 49.246, lng: -123.138, postal: "V6H", price: 1.32 },
  { name: "Shaughnessy", city: "Vancouver", lat: 49.251, lng: -123.138, postal: "V6H", price: 1.9 },
  { name: "Riley Park", city: "Vancouver", lat: 49.245, lng: -123.102, postal: "V5Z", price: 1.08 },
  { name: "Main", city: "Vancouver", lat: 49.248, lng: -123.101, postal: "V5V", price: 1.06 },
  { name: "Fraser", city: "Vancouver", lat: 49.24, lng: -123.09, postal: "V5V", price: 0.96 },
  { name: "Knight", city: "Vancouver", lat: 49.23, lng: -123.078, postal: "V5P", price: 0.94 },
  { name: "Victoria-Fraserview", city: "Vancouver", lat: 49.218, lng: -123.065, postal: "V5P", price: 0.9 },
  { name: "Champlain Heights", city: "Vancouver", lat: 49.215, lng: -123.032, postal: "V5X", price: 0.88 },
  { name: "Collingwood", city: "Vancouver", lat: 49.24, lng: -123.03, postal: "V5N", price: 0.91 },
  { name: "Grandview-Woodland", city: "Vancouver", lat: 49.272, lng: -123.068, postal: "V5L", price: 1.02 },
  { name: "Lonsdale", city: "North Vancouver", lat: 49.32, lng: -123.072, postal: "V7M", price: 1.15 },
  { name: "Lynn Valley", city: "North Vancouver", lat: 49.34, lng: -123.04, postal: "V7J", price: 1.2 },
  { name: "Edgemont", city: "North Vancouver", lat: 49.336, lng: -123.101, postal: "V7R", price: 1.35 },
  { name: "Ambleside", city: "West Vancouver", lat: 49.327, lng: -123.16, postal: "V7T", price: 1.95 },
  { name: "Dundarave", city: "West Vancouver", lat: 49.332, lng: -123.185, postal: "V7V", price: 1.9 },
  { name: "British Properties", city: "West Vancouver", lat: 49.355, lng: -123.15, postal: "V7S", price: 2.15 },
  { name: "Metrotown", city: "Burnaby", lat: 49.226, lng: -123.003, postal: "V5H", price: 0.95 },
  { name: "Brentwood", city: "Burnaby", lat: 49.266, lng: -123.001, postal: "V5C", price: 0.98 },
  { name: "Steveston", city: "Richmond", lat: 49.132, lng: -123.18, postal: "V7E", price: 1.05 },
  { name: "Brighouse", city: "Richmond", lat: 49.166, lng: -123.136, postal: "V6Y", price: 0.92 },
  { name: "Uptown", city: "New Westminster", lat: 49.206, lng: -122.911, postal: "V3L", price: 0.85 },
  { name: "Queensborough", city: "New Westminster", lat: 49.186, lng: -122.945, postal: "V3M", price: 0.82 },
  { name: "Maillardville", city: "Coquitlam", lat: 49.24, lng: -122.865, postal: "V3K", price: 0.88 },
  { name: "Burke Mountain", city: "Coquitlam", lat: 49.29, lng: -122.78, postal: "V3E", price: 0.95 },
  { name: "Guildford", city: "Surrey", lat: 49.19, lng: -122.8, postal: "V3R", price: 0.78 },
  { name: "South Surrey", city: "Surrey", lat: 49.05, lng: -122.78, postal: "V4A", price: 0.9 },
  { name: "Moody Centre", city: "Port Moody", lat: 49.278, lng: -122.845, postal: "V3H", price: 0.92 },
  { name: "Town Centre", city: "Maple Ridge", lat: 49.219, lng: -122.598, postal: "V2X", price: 0.72 },
];

const STREETS = [
  "West 4th Avenue",
  "West Broadway",
  "Cornwall Avenue",
  "Macdonald Street",
  "Trafalgar Street",
  "Arbutus Street",
  "Granville Street",
  "Oak Street",
  "Cambie Street",
  "Main Street",
  "Fraser Street",
  "Knight Street",
  "Victoria Drive",
  "Kingsway",
  "Hastings Street",
  "Commercial Drive",
  "Renfrew Street",
  "Rupert Street",
  "Marine Drive",
  "West 41st Avenue",
  "West 49th Avenue",
  "West 16th Avenue",
  "West 12th Avenue",
  "Davie Street",
  "Robson Street",
  "Alberni Street",
  "Burrard Street",
  "Homer Street",
  "Mainland Street",
  "Hamilton Street",
  "Pacific Street",
  "Beach Avenue",
  "Denman Street",
  "Cardero Street",
  "Haro Street",
  "Barclay Street",
  "Nelson Street",
  "Richards Street",
  "Seymour Street",
  "West Georgia Street",
  "Pender Street",
  "Cordova Street",
  "Venables Street",
  "Grant Street",
  "East 1st Avenue",
  "East 10th Avenue",
  "East 33rd Avenue",
  "Dunbar Street",
  "Collingwood Street",
  "Sasamat Street",
  "Trimble Street",
  "Balaclava Street",
  "Blenheim Street",
  "Yew Street",
  "Vine Street",
  "Cypress Street",
  "Maple Street",
  "Fir Street",
  "Heather Street",
  "Ontario Street",
  "Quebec Street",
  "Prince Edward Street",
  "Windsor Street",
  "Joyce Street",
  "Boundary Road",
  "Nanaimo Street",
  "Clark Drive",
  "Lonsdale Avenue",
  "Esplanade",
  "Chesterfield Avenue",
  "Fromme Road",
  "Edgemont Boulevard",
  "Bellevue Avenue",
  "Marine Drive",
  "Chartwell Drive",
  "Kingsway",
  "Willingdon Avenue",
  "Moncton Street",
  "No. 3 Road",
  "Sixth Street",
  "Ewen Avenue",
  "Austin Avenue",
  "Coast Meridian Road",
  "152 Street",
  "16 Avenue",
  "St Johns Street",
  "Lougheed Highway",
];

const PHOTOS = [
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=80",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80",
  "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1200&q=80",
  "https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=1200&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80",
];

const BROKERAGES = [
  "Exp Realty",
  "Sutton Group",
  "Royal LePage",
  "RE/MAX Select",
  "Oakwyn Realty",
  "Macdonald Realty",
  "eXp Realty",
  "Sotheby's International",
];

const TYPES: PropertyType[] = [
  "Condo",
  "Apartment",
  "Townhouse",
  "House",
  "Half Duplex",
];

const WATER = new Set([
  "Kitsilano",
  "Coal Harbour",
  "West End",
  "Ambleside",
  "Dundarave",
  "Steveston",
  "Yaletown",
]);

function mulberry32(seed: number) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, list: readonly T[]): T {
  return list[Math.floor(rand() * list.length)];
}

function postal(prefix: string, rand: () => number) {
  const digit = 1 + Math.floor(rand() * 9);
  const letters = "ABCEGHJKLMNPRSTVWXYZ";
  const a = letters[Math.floor(rand() * letters.length)];
  const b = letters[Math.floor(rand() * letters.length)];
  const n = Math.floor(rand() * 10);
  return `${prefix} ${digit}${a}${n}`;
}

export function buildInventory(count = 360): Property[] {
  const rand = mulberry32(20261021);
  const listings: Property[] = [];

  for (let i = 0; i < count; i++) {
    const hood = HOODS[i % HOODS.length];
    const type = TYPES[Math.floor(rand() * TYPES.length)];
    const attached = type === "Condo" || type === "Apartment" || type === "Townhouse";
    const beds = attached
      ? 1 + Math.floor(rand() * 3)
      : 3 + Math.floor(rand() * 4);
    const baths = Math.max(1, Math.min(beds, 1 + Math.floor(rand() * (beds + 1))));
    const sqft = attached
      ? 520 + Math.floor(rand() * 1400)
      : 1600 + Math.floor(rand() * 3200);
    const yearBuilt = attached
      ? 1978 + Math.floor(rand() * 47)
      : 1924 + Math.floor(rand() * 101);
    const base =
      type === "House"
        ? 1450000
        : type === "Half Duplex"
          ? 1180000
          : type === "Townhouse"
            ? 890000
            : 620000;
    const price = Math.round((base * hood.price * (0.78 + rand() * 0.7)) / 1000) * 1000;
    const listedDaysAgo = Math.floor(rand() * 120);
    const mls = String(3100001 + i);
    const streetNo = 100 + Math.floor(rand() * 8800);
    const street = STREETS[(i * 3 + Math.floor(rand() * 5)) % STREETS.length];
    const unit = attached && rand() > 0.25 ? ` Unit ${100 + Math.floor(rand() * 800)}` : "";
    const tags: string[] = [];
    if (WATER.has(hood.name) && rand() > 0.45) tags.push(rand() > 0.5 ? "Waterfront" : "Ocean View");
    if (hood.city === "North Vancouver" || hood.name === "British Properties") {
      if (rand() > 0.5) tags.push("Mountain View");
    }
    if (yearBuilt >= 2018 && rand() > 0.4) tags.push("New Build");
    if (rand() > 0.72) tags.push("Renovated");
    if (beds >= 3 && !attached && rand() > 0.4) tags.push("Family");
    if (attached && price < 800000 && rand() > 0.55) tags.push("Investment");
    if (price > 2500000 || hood.price > 1.6) tags.push("Luxury");
    const virtualTour = rand() > 0.72;
    if (virtualTour) tags.push("Virtual Tour");
    const open = rand() > 0.88;
    if (open) tags.push("Open House");
    const uniqueTags = [...new Set(tags)].slice(0, 4);
    const jitterLat = (rand() - 0.5) * 0.012;
    const jitterLng = (rand() - 0.5) * 0.016;
    const photoA = PHOTOS[i % PHOTOS.length];
    const photoB = PHOTOS[(i + 5) % PHOTOS.length];
    const photoC = PHOTOS[(i + 11) % PHOTOS.length];

    listings.push({
      id: `r${mls}`,
      mlsNumber: `R${mls}`,
      price,
      address: `${streetNo} ${street}${unit}`,
      city: hood.city,
      province: "BC",
      postalCode: postal(hood.postal, rand),
      beds,
      baths,
      sqft,
      propertyType: type,
      yearBuilt,
      description: `${beds}-bedroom ${type.toLowerCase()} in ${hood.name}, ${hood.city}. Built in ${yearBuilt}, about ${sqft.toLocaleString("en-CA")} sqft, listed ${listedDaysAgo} day${listedDaysAgo === 1 ? "" : "s"} ago. Sample IDX inventory for Greater Vancouver — not a live board feed.`,
      features: [
        ...uniqueTags,
        attached ? "In-suite laundry" : "Garage",
        "Parking",
        beds >= 3 ? "Family layout" : "Open plan",
      ],
      images: [photoA, photoB, photoC],
      status: rand() > 0.94 ? "Pending" : "Active",
      listedDaysAgo,
      brokerage: BROKERAGES[i % BROKERAGES.length],
      lat: Number((hood.lat + jitterLat).toFixed(5)),
      lng: Number((hood.lng + jitterLng).toFixed(5)),
      neighborhood: hood.name,
      openHouse: open ? "Sat 1–3pm" : undefined,
      virtualTour: virtualTour || undefined,
      tags: uniqueTags,
    });
  }

  return listings;
}
