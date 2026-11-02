export type DdfPhoto = { url: string; order: number };

export type DdfListing = {
  listingKey: string;
  listingId: string;
  price: number;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  beds: number;
  baths: number;
  sqft: number;
  propertyType: string;
  remarks: string;
  brokerage: string;
  realtorUrl: string;
  latitude: number;
  longitude: number;
  listedAt: string | null;
  modifiedAt: string | null;
  photos: DdfPhoto[];
};

function text(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function num(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function provinceOf(record: Record<string, unknown>): string {
  return (
    text(record.StateOrProvince) ||
    text(record.Province) ||
    text(record.StateProvince) ||
    ""
  ).toUpperCase();
}

export function isBritishColumbia(record: Record<string, unknown>): boolean {
  const province = provinceOf(record);
  if (!province) return true;
  return province === "BC" || province === "BRITISH COLUMBIA";
}

function realtorUrl(record: Record<string, unknown>): string {
  for (const key of ["ListingURL", "MoreInformationLink", "MoreInformationURL", "RealtorCaURL"]) {
    const value = text(record[key]);
    if (value.startsWith("http")) return value;
  }
  for (const value of Object.values(record)) {
    if (typeof value === "string" && /https?:\/\/[^"'\s]*realtor\.ca\//i.test(value)) {
      return value.trim();
    }
  }
  return "";
}

function photosOf(record: Record<string, unknown>): DdfPhoto[] {
  const media = record.Media ?? record.Photo ?? record.Photos;
  const list = Array.isArray(media) ? media : [];
  const photos: DdfPhoto[] = [];
  list.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const row = item as Record<string, unknown>;
    const url = text(row.MediaURL) || text(row.PhotoURL) || text(row.LargePhotoURL) || text(row.url);
    if (!url.startsWith("http")) return;
    const order = num(row.Order ?? row.SequenceId ?? row.PreferredPhotoYN) || index;
    photos.push({ url, order });
  });
  photos.sort((a, b) => a.order - b.order);
  const seen = new Set<string>();
  return photos.filter((photo) => {
    if (seen.has(photo.url)) return false;
    seen.add(photo.url);
    return true;
  });
}

function officeName(record: Record<string, unknown>): string {
  const direct = text(record.ListOfficeName);
  if (direct) return direct;
  const office = record.ListOffice;
  if (office && typeof office === "object") {
    const row = office as Record<string, unknown>;
    return text(row.OfficeName) || text(row.ListOfficeName);
  }
  return "";
}

function addressOf(record: Record<string, unknown>): string {
  const unparsed = text(record.UnparsedAddress) || text(record.Address);
  if (unparsed) return unparsed;
  return [record.StreetNumber, record.StreetDirPrefix, record.StreetName, record.StreetSuffix, record.StreetDirSuffix]
    .map(text)
    .filter(Boolean)
    .join(" ");
}

function when(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/** Keep feed text as provided. Missing numbers stay zero and are omitted in the UI. */
export function listingFromOData(record: Record<string, unknown>): DdfListing | null {
  if (!isBritishColumbia(record)) return null;
  const listingKey = text(record.ListingKey) || text(record.ListingKeyNumeric);
  const address = addressOf(record);
  if (!listingKey || !address) return null;
  const baths = num(record.BathroomsTotalInteger ?? record.BathroomsTotalDecimal ?? record.BathroomsFull);
  return {
    listingKey,
    listingId: text(record.ListingId) || listingKey,
    price: Math.round(num(record.ListPrice)),
    address,
    city: text(record.City),
    province: "BC",
    postalCode: text(record.PostalCode),
    beds: Math.round(num(record.BedroomsTotal)),
    baths,
    sqft: Math.round(num(record.LivingArea ?? record.BuildingAreaTotal)),
    propertyType: text(record.PropertySubType) || text(record.PropertyType),
    remarks: text(record.PublicRemarks),
    brokerage: officeName(record),
    realtorUrl: realtorUrl(record),
    latitude: num(record.Latitude),
    longitude: num(record.Longitude),
    listedAt: when(record.ListingContractDate ?? record.OriginalEntryTimestamp ?? record.OnMarketDate),
    modifiedAt: when(record.ModificationTimestamp),
    photos: photosOf(record).slice(0, 24),
  };
}

export function xmlBlocks(xml: string, tag: string): string[] {
  const blocks: string[] = [];
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml))) blocks.push(match[1]);
  return blocks;
}

function xmlText(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  if (!match) return "";
  return match[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

export function listingFromRetsXml(block: string): DdfListing | null {
  const province = (xmlText(block, "Province") || xmlText(block, "StateOrProvince")).toUpperCase();
  if (province && province !== "BC" && province !== "BRITISH COLUMBIA") return null;
  const listingKey = xmlText(block, "ID") || xmlText(block, "ListingKey");
  const address =
    xmlText(block, "Address") ||
    [xmlText(block, "StreetAddress"), xmlText(block, "StreetNumber"), xmlText(block, "StreetName")]
      .filter(Boolean)
      .join(" ");
  if (!listingKey || !address) return null;
  const photoUrls = [...block.matchAll(/<PhotoURL>([^<]+)<\/PhotoURL>/gi)].map((match) => match[1].trim());
  return {
    listingKey,
    listingId: xmlText(block, "ListingID") || listingKey,
    price: Math.round(num(xmlText(block, "Price") || xmlText(block, "ListPrice"))),
    address,
    city: xmlText(block, "City"),
    province: "BC",
    postalCode: xmlText(block, "PostalCode"),
    beds: Math.round(num(xmlText(block, "BedroomsTotal"))),
    baths: num(xmlText(block, "BathroomTotal") || xmlText(block, "BathroomsTotalInteger")),
    sqft: Math.round(num(xmlText(block, "SizeInterior") || xmlText(block, "LivingArea"))),
    propertyType: xmlText(block, "Type") || xmlText(block, "PropertyType"),
    remarks: xmlText(block, "PublicRemarks"),
    brokerage: xmlText(block, "OfficeName") || xmlText(block, "ListOfficeName"),
    realtorUrl: xmlText(block, "MoreInformationLink") || xmlText(block, "ListingURL"),
    latitude: num(xmlText(block, "Latitude")),
    longitude: num(xmlText(block, "Longitude")),
    listedAt: when(xmlText(block, "ListingContractDate")),
    modifiedAt: when(xmlText(block, "LastUpdated") || xmlText(block, "ModificationTimestamp")),
    photos: photoUrls.filter((url) => url.startsWith("http")).map((url, order) => ({ url, order })),
  };
}
