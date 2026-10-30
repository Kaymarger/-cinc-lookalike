export type OfficeSettings = {
  sellerEnabled: boolean;
  sellerLabel: string;
  crmConnectEnabled: boolean;
  crmConnectUrl: string;
  websiteName: string;
  websiteIdx: boolean;
  autoLabelEnabled: boolean;
  autoLabel: string;
  autoSearchEnabled: boolean;
  autoSearchFrequency: string;
  welcomeEnabled: boolean;
  welcomeSubject: string;
  welcomeBody: string;
  searchBudget: number;
  listcastBudget: number;
  sellerSearches: "Enabled" | "Disabled";
  crmLabel: string;
  crmWelcome: "Enabled" | "Disabled";
  homeBanner: string;
  softenCover: boolean;
  showHome: boolean;
  showSearch: boolean;
  showMap: boolean;
  showFeatured: boolean;
  showAbout: boolean;
  showContact: boolean;
  showBlog: boolean;
  showSeller: boolean;
  showHomeValue: boolean;
  logoHeader: boolean;
  logoFooter: boolean;
  cobrand: boolean;
  homeValueTagLine: string;
  homeSearchUrl: string;
  facebook: string;
  googlePage: string;
  pinterest: string;
  twitter: string;
  instagram: string;
  youtube: string;
  linkedin: string;
  googlePlace: string;
  propertyAlertBody: string;
  mailerCampaigns: boolean;
  reassignEnabled: "Enabled" | "Disabled";
  reassignAmount: string;
  reassignUnit: "minute(s)" | "hour(s)" | "day(s)";
  reassignFrom: string;
  reassignTo: string;
  aiSeoNotes: string;
  customSources: string[];
  sourceMap: Record<string, string>;
  labelCatalog: { category: string; name: string }[];
};

export const EMPTY_SETTINGS: OfficeSettings = {
  sellerEnabled: false,
  sellerLabel: "-- None --",
  crmConnectEnabled: false,
  crmConnectUrl: "",
  websiteName: "Greater Vancouver Area Home Search",
  websiteIdx: false,
  autoLabelEnabled: false,
  autoLabel: "-- None --",
  autoSearchEnabled: false,
  autoSearchFrequency: "Daily (Best for default search)",
  welcomeEnabled: false,
  welcomeSubject: "Welcome",
  welcomeBody: "Hi [FIRSTNAME], welcome.",
  searchBudget: 0,
  listcastBudget: 0,
  sellerSearches: "Disabled",
  crmLabel: "-- None --",
  crmWelcome: "Disabled",
  homeBanner: "",
  softenCover: false,
  showHome: true,
  showSearch: true,
  showMap: true,
  showFeatured: true,
  showAbout: true,
  showContact: true,
  showBlog: false,
  showSeller: true,
  showHomeValue: true,
  logoHeader: true,
  logoFooter: true,
  cobrand: false,
  homeValueTagLine: "",
  homeSearchUrl: "",
  facebook: "",
  googlePage: "",
  pinterest: "",
  twitter: "",
  instagram: "",
  youtube: "",
  linkedin: "",
  googlePlace: "",
  propertyAlertBody: "",
  mailerCampaigns: false,
  reassignEnabled: "Disabled",
  reassignAmount: "1",
  reassignUnit: "hour(s)",
  reassignFrom: "12:00 AM (Midnight)",
  reassignTo: "11:00 PM",
  aiSeoNotes: "",
  customSources: [],
  sourceMap: {},
  labelCatalog: [],
};

function clip(value: unknown, max: number): string {
  return String(value ?? "").slice(0, max);
}

export function sanitizeSettings(input: unknown): OfficeSettings {
  const raw = (input && typeof input === "object" ? input : {}) as Partial<OfficeSettings>;
  const budget = (value: unknown) => Math.max(0, Math.round(Number(value) || 0));
  return {
    sellerEnabled: Boolean(raw.sellerEnabled),
    sellerLabel: clip(raw.sellerLabel, 80) || EMPTY_SETTINGS.sellerLabel,
    crmConnectEnabled: Boolean(raw.crmConnectEnabled),
    crmConnectUrl: clip(raw.crmConnectUrl, 300),
    websiteName: clip(raw.websiteName, 120) || EMPTY_SETTINGS.websiteName,
    websiteIdx: Boolean(raw.websiteIdx),
    autoLabelEnabled: Boolean(raw.autoLabelEnabled),
    autoLabel: clip(raw.autoLabel, 80) || EMPTY_SETTINGS.autoLabel,
    autoSearchEnabled: Boolean(raw.autoSearchEnabled),
    autoSearchFrequency: clip(raw.autoSearchFrequency, 80) || EMPTY_SETTINGS.autoSearchFrequency,
    welcomeEnabled: Boolean(raw.welcomeEnabled),
    welcomeSubject: clip(raw.welcomeSubject, 160),
    welcomeBody: clip(raw.welcomeBody, 4000),
    searchBudget: budget(raw.searchBudget),
    listcastBudget: budget(raw.listcastBudget),
    sellerSearches: raw.sellerSearches === "Enabled" ? "Enabled" : "Disabled",
    crmLabel: clip(raw.crmLabel, 80) || "-- None --",
    crmWelcome: raw.crmWelcome === "Enabled" ? "Enabled" : "Disabled",
    homeBanner: clip(raw.homeBanner, 300),
    softenCover: Boolean(raw.softenCover),
    showHome: raw.showHome !== false,
    showSearch: raw.showSearch !== false,
    showMap: raw.showMap !== false,
    showFeatured: raw.showFeatured !== false,
    showAbout: raw.showAbout !== false,
    showContact: raw.showContact !== false,
    showBlog: Boolean(raw.showBlog),
    showSeller: raw.showSeller !== false,
    showHomeValue: raw.showHomeValue !== false,
    logoHeader: raw.logoHeader !== false,
    logoFooter: raw.logoFooter !== false,
    cobrand: Boolean(raw.cobrand),
    homeValueTagLine: clip(raw.homeValueTagLine, 200),
    homeSearchUrl: clip(raw.homeSearchUrl, 300),
    facebook: clip(raw.facebook, 300),
    googlePage: clip(raw.googlePage, 300),
    pinterest: clip(raw.pinterest, 300),
    twitter: clip(raw.twitter, 300),
    instagram: clip(raw.instagram, 300),
    youtube: clip(raw.youtube, 300),
    linkedin: clip(raw.linkedin, 300),
    googlePlace: clip(raw.googlePlace, 300),
    propertyAlertBody: clip(raw.propertyAlertBody, 2000),
    mailerCampaigns: Boolean(raw.mailerCampaigns),
    reassignEnabled: raw.reassignEnabled === "Enabled" ? "Enabled" : "Disabled",
    reassignAmount: clip(raw.reassignAmount, 3) || "1",
    reassignUnit: raw.reassignUnit === "minute(s)" || raw.reassignUnit === "day(s)" ? raw.reassignUnit : "hour(s)",
    reassignFrom: clip(raw.reassignFrom, 40) || EMPTY_SETTINGS.reassignFrom,
    reassignTo: clip(raw.reassignTo, 40) || EMPTY_SETTINGS.reassignTo,
    aiSeoNotes: clip(raw.aiSeoNotes, 2000),
    customSources: (Array.isArray(raw.customSources) ? raw.customSources : []).map((item) => clip(item, 80)).filter(Boolean).slice(0, 40),
    sourceMap: mapSources(raw.sourceMap),
    labelCatalog: catalog(raw.labelCatalog),
  };
}

function catalog(value: unknown): { category: string; name: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const row = item && typeof item === "object" ? (item as { category?: unknown; name?: unknown }) : {};
      return { category: clip(row.category, 40), name: clip(row.name, 40) };
    })
    .filter((item) => item.category && item.name)
    .slice(0, 200);
}

function mapSources(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, string> = {};
  for (const [key, mapped] of Object.entries(value as Record<string, unknown>)) {
    const name = clip(key, 80);
    const target = clip(mapped, 80);
    if (name) out[name] = target;
  }
  return out;
}

export function rate(part: number, whole: number): number | null {
  if (!whole) return null;
  return Math.round((part / whole) * 100);
}
