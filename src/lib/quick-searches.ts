import type { SearchFilters } from "./types";

export type QuickSearch = {
  id: string;
  slug: string;
  label: string;
  title: string;
  description: string;
  filters: SearchFilters;
};

/** Home-page Quick Searches — IDs/slugs match live GVHS CINC routes. */
export const QUICK_SEARCHES: QuickSearch[] = [
  {
    id: "PDQVLZZZ5CVB3945D",
    slug: "duplexes-for-sale-in-vancouver",
    label: "Duplexes For Sale in Vancouver",
    title: "Duplexes for Sale in Vancouver",
    description:
      "Browse half-duplex homes for sale across Vancouver with live filters and map view.",
    filters: { city: "Vancouver", propertyType: "Half Duplex" },
  },
  {
    id: "PDQVLZZZVVRYWSCBY",
    slug: "homes-for-sale-in-arbutus",
    label: "Homes for Sale in Arbutus",
    title: "Homes for Sale in Arbutus",
    description: "Arbutus neighbourhood listings in Vancouver.",
    filters: { city: "Vancouver", q: "Arbutus" },
  },
  {
    id: "PDQVLZZZ5N5W1LPMJ",
    slug: "homes-for-sale-in-cambie",
    label: "Homes for Sale in Cambie",
    title: "Homes for Sale in Cambie",
    description: "Cambie corridor homes for sale.",
    filters: { city: "Vancouver", q: "Cambie" },
  },
  {
    id: "PDQVLZZZTNSN6V464",
    slug: "homes-for-sale-in-coal-harbour",
    label: "Homes for Sale in Coal Harbour",
    title: "Homes for Sale in Coal Harbour",
    description: "Coal Harbour condos and homes for sale.",
    filters: { city: "Vancouver", q: "Coal Harbour" },
  },
  {
    id: "PDQVLZZZW5Z6W862T",
    slug: "homes-for-sale-in-downtown-vancouver",
    label: "Homes for Sale in Downtown Vancouver",
    title: "Homes for Sale in Downtown Vancouver",
    description: "Downtown Vancouver real estate listings.",
    filters: { city: "Vancouver", q: "downtown" },
  },
  {
    id: "PDQVLZZZWSB1JWYJ4",
    slug: "homes-for-sale-in-dunbar",
    label: "Homes for Sale in Dunbar",
    title: "Homes for Sale in Dunbar",
    description: "Dunbar family homes and listings.",
    filters: { city: "Vancouver", q: "Dunbar" },
  },
  {
    id: "PDQVLZZZ4M1YVS0VM",
    slug: "homes-for-sale-in-east-vancouver",
    label: "Homes for Sale in East Vancouver",
    title: "Homes for Sale in East Vancouver",
    description: "East Vancouver homes for sale.",
    filters: { city: "Vancouver", q: "East" },
  },
  {
    id: "PDQVLZZZT3D6CXQJR",
    slug: "homes-for-sale-in-edgemont",
    label: "Homes for Sale in Edgemont",
    title: "Homes for Sale in Edgemont",
    description: "Edgemont Village and surrounding North Vancouver listings.",
    filters: { city: "North Vancouver", q: "Edgemont" },
  },
  {
    id: "PDQVLZZZ5N5W1L6RD",
    slug: "homes-for-sale-in-fairview",
    label: "Homes for Sale in Fairview",
    title: "Homes for Sale in Fairview",
    description: "Fairview homes and condos for sale.",
    filters: { city: "Vancouver", q: "Fairview" },
  },
  {
    id: "PDQVLZZZ52P2NMR2W",
    slug: "homes-for-sale-in-false-creek",
    label: "Homes for Sale in False Creek",
    title: "Homes for Sale in False Creek",
    description: "False Creek waterfront and nearby listings.",
    filters: { city: "Vancouver", q: "False Creek" },
  },
  {
    id: "PDQVLZZZV7YD8ZVV9",
    slug: "homes-for-sale-in-kitsilano",
    label: "Homes for Sale in Kitsilano",
    title: "Homes for Sale in Kitsilano",
    description: "Kitsilano homes for sale near the beach and Broadway.",
    filters: { city: "Vancouver", q: "Kitsilano" },
  },
  {
    id: "PDQVLZZZT3D6CXP0D",
    slug: "homes-for-sale-in-lynn-valley",
    label: "Homes for Sale in Lynn Valley",
    title: "Homes for Sale in Lynn Valley",
    description: "Lynn Valley North Vancouver listings.",
    filters: { city: "North Vancouver", q: "Lynn Valley" },
  },
  {
    id: "PDQVLZZZ5X2JKPS06",
    slug: "homes-for-sale-in-mount-pleasant",
    label: "Homes for Sale in Mount Pleasant",
    title: "Homes for Sale in Mount Pleasant",
    description: "Mount Pleasant homes and condos for sale.",
    filters: { city: "Vancouver", q: "Mount Pleasant" },
  },
  {
    id: "PDQVLZZZ4RY0VTJP8",
    slug: "homes-for-sale-in-north-vancouver",
    label: "Homes For Sale In North Vancouver",
    title: "Homes for Sale in North Vancouver",
    description: "North Vancouver houses, townhomes, and condos.",
    filters: { city: "North Vancouver" },
  },
  {
    id: "PDQVLZZZ5PTP25XLX",
    slug: "homes-for-sale-in-point-grey",
    label: "Homes for Sale in Point Grey",
    title: "Homes for Sale in Point Grey",
    description: "Point Grey Westside homes for sale.",
    filters: { city: "Vancouver", q: "Point Grey" },
  },
  {
    id: "PDQVLZZZW5Z626339",
    slug: "homes-for-sale-in-vancouver",
    label: "Homes for Sale in Vancouver",
    title: "Homes for Sale in Vancouver",
    description: "All sample Vancouver listings on this demo IDX site.",
    filters: { city: "Vancouver" },
  },
  {
    id: "PDQVLZZZTVJ9NPJ99",
    slug: "homes-for-sale-in-vancouver-west",
    label: "Homes for Sale in Vancouver West",
    title: "Homes for Sale in Vancouver West",
    description: "Vancouver Westside homes for sale.",
    filters: { city: "Vancouver", q: "West" },
  },
  {
    id: "PDQVLZZZT32YTVSR3",
    slug: "homes-for-sale-in-west-vancouver",
    label: "Homes for Sale in West Vancouver",
    title: "Homes for Sale in West Vancouver",
    description: "West Vancouver luxury and family homes.",
    filters: { city: "West Vancouver" },
  },
  {
    id: "PDQVLZZZT3D6CX8LY",
    slug: "homes-for-sale-in-yaletown",
    label: "Homes for Sale in Yaletown",
    title: "Homes for Sale in Yaletown",
    description: "Yaletown condos and lofts for sale.",
    filters: { city: "Vancouver", q: "Yaletown" },
  },
  {
    id: "PDQVLZZZ3DW1JBZMV",
    slug: "luxury-homes-for-sale-in-vancouver",
    label: "Luxury Homes For Sale In Vancouver",
    title: "Luxury Homes for Sale in Vancouver",
    description: "Vancouver listings priced from $2,000,000.",
    filters: { city: "Vancouver", minPrice: 2000000 },
  },
  {
    id: "PDQVLZZZWM1R0L1Q0",
    slug: "new-homes-for-sale-in-vancouver",
    label: "New Homes for Sale in Vancouver",
    title: "New Homes for Sale in Vancouver",
    description: "Recently listed Vancouver homes (new this week).",
    filters: { city: "Vancouver", newListings: true },
  },
  {
    id: "PDQVLZZZW2J6S7VM6",
    slug: "open-houses-in-vancouver",
    label: "Open Houses in Vancouver",
    title: "Open Houses in Vancouver",
    description: "Vancouver listings currently hosting an open house.",
    filters: { city: "Vancouver", openHouse: true },
  },
  {
    id: "PDQVLZZZ3BBD9TC2Y",
    slug: "condos-for-sale-in-vancouver",
    label: "Condos for Sale in Vancouver",
    title: "Condos for Sale in Vancouver",
    description: "Vancouver condominium listings.",
    filters: { city: "Vancouver", propertyType: "Condo" },
  },
  {
    id: "PDQVLZZZ32K4DQTY6",
    slug: "townhomes-for-sale-in-vancouver",
    label: "Townhomes for Sale in Vancouver",
    title: "Townhomes for Sale in Vancouver",
    description: "Vancouver townhouse listings.",
    filters: { city: "Vancouver", propertyType: "Townhouse" },
  },
];

export function quickSearchHref(qs: QuickSearch): string {
  return `/search/quick/${qs.id}/${qs.slug}`;
}

export function getQuickSearch(
  id: string,
  slug?: string
): QuickSearch | undefined {
  return QUICK_SEARCHES.find(
    (q) => q.id === id && (!slug || q.slug === slug)
  );
}

export function getQuickSearchBySlug(slug: string): QuickSearch | undefined {
  return QUICK_SEARCHES.find((q) => q.slug === slug);
}
