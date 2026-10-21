import { properties } from "./properties";
import type { Property, SearchFilters } from "./types";

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatSqft(sqft: number): string {
  return `${sqft.toLocaleString("en-CA")} SqFt`;
}

/** Rough Canadian mortgage payment at 20% down, 4.79%, 25-year amort. */
export function estimateMonthlyPayment(
  price: number,
  {
    downPct = 20,
    annualRate = 4.79,
    years = 25,
  }: { downPct?: number; annualRate?: number; years?: number } = {}
): number {
  const loan = Math.max(0, price * (1 - downPct / 100));
  if (loan <= 0 || years <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return loan / n;
  return (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function pricePerSqft(price: number, sqft: number): number {
  if (sqft <= 0) return 0;
  return Math.round(price / sqft);
}

/** Demo key facts — taxes/strata estimated when not on the listing. */
export function listingKeyFacts(property: Property) {
  const attached =
    property.propertyType === "Condo" ||
    property.propertyType === "Apartment" ||
    property.propertyType === "Townhouse";
  const parkingFeature = property.features.find((f) =>
    /park|garage/i.test(f)
  );
  return {
    daysOnMarket: property.listedDaysAgo,
    pricePerSqft: pricePerSqft(property.price, property.sqft),
    annualTax: Math.round(property.price * 0.0028),
    strataFee: attached
      ? Math.round(180 + property.sqft * 0.32)
      : null,
    parking: parkingFeature ?? (attached ? "1 stall" : "Street / driveway"),
  };
}

export function fullAddress(p: Property): string {
  return `${p.address}, ${p.city}, ${p.province} ${p.postalCode}`;
}

export function parseFilters(
  params: Record<string, string | string[] | undefined>
): SearchFilters {
  const get = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const num = (key: string) => {
    const v = get(key);
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const sort = get("sort");
  const validSort =
    sort === "price-asc" ||
    sort === "price-desc" ||
    sort === "newest" ||
    sort === "sqft-desc" ||
    sort === "beds-desc" ||
    sort === "baths-desc" ||
    sort === "year-desc"
      ? sort
      : undefined;

  const openHouse = get("openHouse");
  const newListings = get("newListings");
  const virtualTour = get("virtualTour");

  return {
    q: get("q") || undefined,
    city: get("city") || undefined,
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    beds: num("beds"),
    baths: num("baths"),
    propertyType: get("propertyType") || undefined,
    minSqft: num("minSqft"),
    maxSqft: num("maxSqft"),
    minYear: num("minYear"),
    maxYear: num("maxYear"),
    maxDays: num("maxDays"),
    tag: get("tag") || undefined,
    openHouse:
      openHouse === "1" || openHouse === "true" ? true : undefined,
    newListings:
      newListings === "1" || newListings === "true" ? true : undefined,
    virtualTour:
      virtualTour === "1" || virtualTour === "true" ? true : undefined,
    sort: validSort,
  };
}

export function searchProperties(filters: SearchFilters): Property[] {
  let results = [...properties];

  if (filters.q) {
    const q = filters.q.toLowerCase();
    results = results.filter((p) => {
      const hay = [
        p.address,
        p.city,
        p.postalCode,
        p.mlsNumber,
        p.propertyType,
        p.neighborhood,
        ...(p.tags ?? []),
        p.description,
        p.brokerage,
        ...p.features,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  if (filters.city) {
    results = results.filter(
      (p) => p.city.toLowerCase() === filters.city!.toLowerCase()
    );
  }

  if (filters.minPrice != null) {
    results = results.filter((p) => p.price >= filters.minPrice!);
  }
  if (filters.maxPrice != null) {
    results = results.filter((p) => p.price <= filters.maxPrice!);
  }
  if (filters.beds != null) {
    results = results.filter((p) => p.beds >= filters.beds!);
  }
  if (filters.baths != null) {
    results = results.filter((p) => p.baths >= filters.baths!);
  }
  if (filters.propertyType) {
    results = results.filter(
      (p) =>
        p.propertyType.toLowerCase() === filters.propertyType!.toLowerCase()
    );
  }
  if (filters.minSqft != null) {
    results = results.filter((p) => p.sqft >= filters.minSqft!);
  }
  if (filters.maxSqft != null) {
    results = results.filter((p) => p.sqft <= filters.maxSqft!);
  }
  if (filters.minYear != null) {
    results = results.filter((p) => p.yearBuilt >= filters.minYear!);
  }
  if (filters.maxYear != null) {
    results = results.filter((p) => p.yearBuilt <= filters.maxYear!);
  }
  if (filters.maxDays != null) {
    results = results.filter((p) => p.listedDaysAgo <= filters.maxDays!);
  }
  if (filters.tag) {
    const tag = filters.tag.toLowerCase();
    results = results.filter((p) =>
      (p.tags ?? p.features).some((t) => t.toLowerCase() === tag)
    );
  }
  if (filters.openHouse) {
    results = results.filter((p) => Boolean(p.openHouse));
  }
  if (filters.newListings) {
    results = results.filter((p) => p.listedDaysAgo <= 7);
  }
  if (filters.virtualTour) {
    results = results.filter((p) => Boolean(p.virtualTour));
  }

  switch (filters.sort) {
    case "price-asc":
      results.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      results.sort((a, b) => b.price - a.price);
      break;
    case "sqft-desc":
      results.sort((a, b) => b.sqft - a.sqft);
      break;
    case "beds-desc":
      results.sort((a, b) => b.beds - a.beds);
      break;
    case "baths-desc":
      results.sort((a, b) => b.baths - a.baths);
      break;
    case "year-desc":
      results.sort((a, b) => b.yearBuilt - a.yearBuilt);
      break;
    case "newest":
    default:
      results.sort((a, b) => a.listedDaysAgo - b.listedDaysAgo);
      break;
  }

  return results;
}

export function getPropertyById(id: string): Property | undefined {
  return properties.find((p) => p.id === id);
}

export function getFeaturedProperties(): Property[] {
  return properties.filter((p) => p.featured).slice(0, 6);
}

export function getSimilarProperties(property: Property, limit = 3): Property[] {
  return properties
    .filter(
      (p) =>
        p.id !== property.id &&
        (p.city === property.city || p.propertyType === property.propertyType)
    )
    .sort(
      (a, b) =>
        Math.abs(a.price - property.price) - Math.abs(b.price - property.price)
    )
    .slice(0, limit);
}

export function marketStats(list: Property[]) {
  if (list.length === 0) {
    return { count: 0, avgPrice: 0, avgSqft: 0, avgBeds: 0 };
  }
  const avg = (n: number) => Math.round(n / list.length);
  return {
    count: list.length,
    avgPrice: avg(list.reduce((s, p) => s + p.price, 0)),
    avgSqft: avg(list.reduce((s, p) => s + p.sqft, 0)),
    avgBeds: Math.round((list.reduce((s, p) => s + p.beds, 0) / list.length) * 10) / 10,
  };
}

export function filtersToQuery(filters: SearchFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === "" || value === null) return;
    if (typeof value === "boolean") {
      if (value) params.set(key, "1");
      return;
    }
    params.set(key, String(value));
  });
  const q = params.toString();
  return q ? `?${q}` : "";
}
