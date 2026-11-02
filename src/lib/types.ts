export type PropertyType =
  | "Condo"
  | "Townhouse"
  | "House"
  | "Half Duplex"
  | "Apartment";

export type City =
  | "Vancouver"
  | "Burnaby"
  | "North Vancouver"
  | "West Vancouver"
  | "Richmond"
  | "Coquitlam"
  | "Surrey"
  | "New Westminster"
  | "Maple Ridge"
  | "Port Moody";

export interface Property {
  id: string;
  mlsNumber: string;
  price: number;
  address: string;
  city: string;
  province: "BC";
  postalCode: string;
  beds: number;
  baths: number;
  sqft: number;
  propertyType: string;
  yearBuilt: number;
  description: string;
  features: string[];
  images: string[];
  status: "Active" | "Pending" | "Sold";
  listedDaysAgo: number;
  brokerage: string;
  lat: number;
  lng: number;
  /** Neighbourhood / subarea for CINC-style quick searches */
  neighborhood?: string;
  featured?: boolean;
  openHouse?: string;
  virtualTour?: boolean;
  /** IDX-style tags such as Waterfront or Renovated */
  tags?: string[];
  /** Present when the record came from the CREA DDF feed. */
  feed?: "ddf";
  realtorUrl?: string;
}

export interface SearchFilters {
  q?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  propertyType?: string;
  minSqft?: number;
  maxSqft?: number;
  minYear?: number;
  maxYear?: number;
  /** Days on site, inclusive */
  maxDays?: number;
  tag?: string;
  openHouse?: boolean;
  newListings?: boolean;
  virtualTour?: boolean;
  sort?:
    | "price-asc"
    | "price-desc"
    | "newest"
    | "sqft-desc"
    | "beds-desc"
    | "baths-desc"
    | "year-desc";
}
