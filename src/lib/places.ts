import type { City } from "./types";

export type PlaceKind = "neighbourhood" | "city";

export type Place = {
  label: string;
  city: City;
  kind: PlaceKind;
};

/** Type-ahead places for the public search box. */
export const PLACES: Place[] = [
  { label: "Kitsilano", city: "Vancouver", kind: "neighbourhood" },
  { label: "Mount Pleasant", city: "Vancouver", kind: "neighbourhood" },
  { label: "Yaletown", city: "Vancouver", kind: "neighbourhood" },
  { label: "Kerrisdale", city: "Vancouver", kind: "neighbourhood" },
  { label: "Dunbar", city: "Vancouver", kind: "neighbourhood" },
  { label: "Point Grey", city: "Vancouver", kind: "neighbourhood" },
  { label: "Fairview", city: "Vancouver", kind: "neighbourhood" },
  { label: "West End", city: "Vancouver", kind: "neighbourhood" },
  { label: "Coal Harbour", city: "Vancouver", kind: "neighbourhood" },
  { label: "Strathcona", city: "Vancouver", kind: "neighbourhood" },
  { label: "Hastings-Sunrise", city: "Vancouver", kind: "neighbourhood" },
  { label: "Renfrew", city: "Vancouver", kind: "neighbourhood" },
  { label: "Killarney", city: "Vancouver", kind: "neighbourhood" },
  { label: "Marpole", city: "Vancouver", kind: "neighbourhood" },
  { label: "Oakridge", city: "Vancouver", kind: "neighbourhood" },
  { label: "South Granville", city: "Vancouver", kind: "neighbourhood" },
  { label: "Shaughnessy", city: "Vancouver", kind: "neighbourhood" },
  { label: "Riley Park", city: "Vancouver", kind: "neighbourhood" },
  { label: "Main", city: "Vancouver", kind: "neighbourhood" },
  { label: "Fraser", city: "Vancouver", kind: "neighbourhood" },
  { label: "Knight", city: "Vancouver", kind: "neighbourhood" },
  { label: "Victoria-Fraserview", city: "Vancouver", kind: "neighbourhood" },
  { label: "Champlain Heights", city: "Vancouver", kind: "neighbourhood" },
  { label: "Collingwood", city: "Vancouver", kind: "neighbourhood" },
  { label: "Grandview-Woodland", city: "Vancouver", kind: "neighbourhood" },
  { label: "Downtown Vancouver", city: "Vancouver", kind: "neighbourhood" },
  { label: "Lonsdale", city: "North Vancouver", kind: "neighbourhood" },
  { label: "Lynn Valley", city: "North Vancouver", kind: "neighbourhood" },
  { label: "Edgemont", city: "North Vancouver", kind: "neighbourhood" },
  { label: "Ambleside", city: "West Vancouver", kind: "neighbourhood" },
  { label: "Dundarave", city: "West Vancouver", kind: "neighbourhood" },
  { label: "British Properties", city: "West Vancouver", kind: "neighbourhood" },
  { label: "Metrotown", city: "Burnaby", kind: "neighbourhood" },
  { label: "Brentwood", city: "Burnaby", kind: "neighbourhood" },
  { label: "Steveston", city: "Richmond", kind: "neighbourhood" },
  { label: "Brighouse", city: "Richmond", kind: "neighbourhood" },
  { label: "Uptown", city: "New Westminster", kind: "neighbourhood" },
  { label: "Queensborough", city: "New Westminster", kind: "neighbourhood" },
  { label: "Maillardville", city: "Coquitlam", kind: "neighbourhood" },
  { label: "Burke Mountain", city: "Coquitlam", kind: "neighbourhood" },
  { label: "Guildford", city: "Surrey", kind: "neighbourhood" },
  { label: "South Surrey", city: "Surrey", kind: "neighbourhood" },
  { label: "Moody Centre", city: "Port Moody", kind: "neighbourhood" },
  { label: "Town Centre", city: "Maple Ridge", kind: "neighbourhood" },
  { label: "Vancouver", city: "Vancouver", kind: "city" },
  { label: "North Vancouver", city: "North Vancouver", kind: "city" },
  { label: "North Van", city: "North Vancouver", kind: "city" },
  { label: "West Vancouver", city: "West Vancouver", kind: "city" },
  { label: "West Van", city: "West Vancouver", kind: "city" },
  { label: "Burnaby", city: "Burnaby", kind: "city" },
  { label: "Richmond", city: "Richmond", kind: "city" },
  { label: "New Westminster", city: "New Westminster", kind: "city" },
  { label: "New West", city: "New Westminster", kind: "city" },
  { label: "Coquitlam", city: "Coquitlam", kind: "city" },
  { label: "Surrey", city: "Surrey", kind: "city" },
  { label: "Port Moody", city: "Port Moody", kind: "city" },
  { label: "Maple Ridge", city: "Maple Ridge", kind: "city" },
];

export function suggestPlaces(query: string, limit = 8): Place[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];
  const starts: Place[] = [];
  const contains: Place[] = [];
  for (const place of PLACES) {
    const label = place.label.toLowerCase();
    if (label.startsWith(q)) starts.push(place);
    else if (label.includes(q) || place.city.toLowerCase().includes(q)) contains.push(place);
  }
  return [...starts, ...contains].slice(0, limit);
}
