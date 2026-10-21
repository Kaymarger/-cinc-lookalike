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
  city: City;
  province: "BC";
  postalCode: string;
  beds: number;
  baths: number;
  sqft: number;
  propertyType: PropertyType;
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
