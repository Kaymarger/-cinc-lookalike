export type DdfPhoto = { url: string; order: number };

export type DdfFloorPlan = { url: string; label: string };

export type DdfOpenHouse = {
  date: string;
  start: string;
  end: string;
  remarks: string;
};

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
  officeKey: string;
  realtorUrl: string;
  latitude: number;
  longitude: number;
  listedAt: string | null;
  modifiedAt: string | null;
  photos: DdfPhoto[];
  neighbourhood: string;
  virtualTourUrl: string;
  videoUrl: string;
  floorPlans: DdfFloorPlan[];
  openHouses: DdfOpenHouse[];
  /** True only after a detail read that asked for media and open houses. */
  detailsSynced: boolean;
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

function mediaUrl(row: Record<string, unknown>): string {
  return text(row.MediaURL) || text(row.PhotoURL) || text(row.LargePhotoURL) || text(row.url);
}

function mediaKind(row: Record<string, unknown>, url: string): "photo" | "video" | "tour" | "floor" | "skip" {
  const category = `${text(row.MediaCategory)} ${text(row.MediaType)} ${text(row.ShortDescription)} ${text(row.LongDescription)}`.toLowerCase();
  if (/floor/.test(category)) return "floor";
  if (/virtual|3d tour|matterport|unbranded virtual|branded virtual/.test(category)) return "tour";
  if (/video/.test(category)) return "video";
  if (/youtube\.com|youtu\.be|vimeo\.com/i.test(url)) return "video";
  if (/matterport|virtualtour|myvisuallistings/i.test(url)) return "tour";
  if (/\.pdf(\?|$)/i.test(url)) return /floor|plan/i.test(category) ? "floor" : "skip";
  const image = /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url) || url.includes("/highres/") || url.includes("/listing/");
  if ((!category.trim() || /photo|image/.test(category)) && image) return "photo";
  return "skip";
}

export function mediaFromRecord(record: Record<string, unknown>): {
  photos: DdfPhoto[];
  virtualTourUrl: string;
  videoUrl: string;
  floorPlans: DdfFloorPlan[];
} {
  const media = record.Media ?? record.Photo ?? record.Photos;
  const list = Array.isArray(media) ? media : [];
  const photos: DdfPhoto[] = [];
  const floorPlans: DdfFloorPlan[] = [];
  let virtualTourUrl = text(record.VirtualTourURLUnbranded) || text(record.VirtualTourURLBranded);
  let videoUrl = "";
  list.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const row = item as Record<string, unknown>;
    const url = mediaUrl(row);
    if (!url.startsWith("http")) return;
    const kind = mediaKind(row, url);
    if (kind === "photo") photos.push({ url, order: num(row.Order ?? row.SequenceId) || index });
    else if (kind === "tour" && !virtualTourUrl) virtualTourUrl = url;
    else if (kind === "video" && !videoUrl) videoUrl = url;
    else if (kind === "floor") floorPlans.push({ url, label: text(row.ShortDescription) || text(row.LongDescription) || "Floor plan" });
  });
  photos.sort((a, b) => a.order - b.order);
  const seen = new Set<string>();
  return {
    photos: photos.filter((photo) => {
      if (seen.has(photo.url)) return false;
      seen.add(photo.url);
      return true;
    }),
    virtualTourUrl,
    videoUrl,
    floorPlans: floorPlans.filter((plan) => {
      if (seen.has(plan.url)) return false;
      seen.add(plan.url);
      return true;
    }),
  };
}

function clock(value: unknown): string {
  const raw = text(value);
  if (!raw) return "";
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime()) && /t|\d{4}-/i.test(raw)) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Vancouver",
      hour: "numeric",
      minute: "2-digit",
    }).format(parsed);
  }
  return raw;
}

export function openHousesFromRecord(record: Record<string, unknown>): DdfOpenHouse[] {
  const media = record.OpenHouse ?? record.OpenHouses;
  const list = Array.isArray(media) ? media : [];
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Vancouver",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const houses: DdfOpenHouse[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const date = text(row.OpenHouseDate).slice(0, 10);
    if (date && date < today) continue;
    const start = clock(row.OpenHouseStartTime);
    const end = clock(row.OpenHouseEndTime);
    if (!date && !start) continue;
    houses.push({
      date,
      start,
      end,
      remarks: text(row.OpenHouseRemarks) || text(row.OpenHouseType),
    });
  }
  return houses;
}

export function neighbourhoodOf(record: Record<string, unknown>): string {
  return text(record.CityRegion) || text(record.SubdivisionName) || text(record.MLSAreaMinor);
}

function officeName(record: Record<string, unknown>): string {
  const direct = text(record.ListOfficeName) || text(record.OfficeName);
  if (direct) return direct;
  const office = record.ListOffice;
  if (office && typeof office === "object" && !Array.isArray(office)) {
    const row = office as Record<string, unknown>;
    const nested = text(row.OfficeName) || text(row.ListOfficeName);
    if (nested) return nested;
  }
  for (const [key, value] of Object.entries(record)) {
    if (/office.?name$/i.test(key) && text(value)) return text(value);
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
  const media = mediaFromRecord(record);
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
    officeKey: text(record.ListOfficeKey),
    realtorUrl: realtorUrl(record) || (listingKey ? `https://www.realtor.ca/real-estate/${listingKey}` : ""),
    latitude: num(record.Latitude),
    longitude: num(record.Longitude),
    listedAt: when(record.ListingContractDate ?? record.OriginalEntryTimestamp ?? record.OnMarketDate),
    modifiedAt: when(record.ModificationTimestamp),
    photos: media.photos.slice(0, 24),
    neighbourhood: neighbourhoodOf(record),
    virtualTourUrl: media.virtualTourUrl,
    videoUrl: media.videoUrl,
    floorPlans: media.floorPlans.slice(0, 8),
    openHouses: openHousesFromRecord(record).slice(0, 6),
    detailsSynced: false,
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
    officeKey: xmlText(block, "ListOfficeKey"),
    realtorUrl: xmlText(block, "MoreInformationLink") || xmlText(block, "ListingURL"),
    latitude: num(xmlText(block, "Latitude")),
    longitude: num(xmlText(block, "Longitude")),
    listedAt: when(xmlText(block, "ListingContractDate")),
    modifiedAt: when(xmlText(block, "LastUpdated") || xmlText(block, "ModificationTimestamp")),
    photos: photoUrls.filter((url) => url.startsWith("http")).map((url, order) => ({ url, order })),
    neighbourhood: xmlText(block, "CityRegion") || xmlText(block, "SubdivisionName"),
    virtualTourUrl: xmlText(block, "VirtualTourURL") || xmlText(block, "VirtualTourURLUnbranded"),
    videoUrl: xmlText(block, "VideoURL"),
    floorPlans: [],
    openHouses: [],
    detailsSynced: false,
  };
}
