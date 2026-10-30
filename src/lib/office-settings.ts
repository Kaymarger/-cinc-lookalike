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
};

export const EMPTY_SETTINGS: OfficeSettings = {
  sellerEnabled: false,
  sellerLabel: "Placeholder — Seller",
  crmConnectEnabled: false,
  crmConnectUrl: "",
  websiteName: "Greater Vancouver Area Home Search",
  websiteIdx: false,
  autoLabelEnabled: false,
  autoLabel: "Placeholder — New Lead",
  autoSearchEnabled: false,
  autoSearchFrequency: "Daily (Best for default search)",
  welcomeEnabled: false,
  welcomeSubject: "Welcome",
  welcomeBody: "Hi [FIRSTNAME], welcome.",
  searchBudget: 0,
  listcastBudget: 0,
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
  };
}

export function rate(part: number, whole: number): number | null {
  if (!whole) return null;
  return Math.round((part / whole) * 100);
}
