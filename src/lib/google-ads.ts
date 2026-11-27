/** Public Google Ads tag. An env value wins; otherwise the site tag is used. */
export const GOOGLE_ADS_ID_FALLBACK = "AW-18552742214";
export const GOOGLE_ADS_LEAD_LABEL_FALLBACK = "7Zc_CNnK48AdEMbC0Y5F";

const ADS_ID = /^AW-[A-Za-z0-9]{4,32}$/;
const LEAD_LABEL = /^[A-Za-z0-9_-]{4,64}$/;

export function resolveGoogleAdsId(envValue?: string | null): string {
  const value = (envValue || "").trim();
  return ADS_ID.test(value) ? value : GOOGLE_ADS_ID_FALLBACK;
}

export function resolveGoogleAdsLeadLabel(envValue?: string | null): string {
  const value = (envValue || "").trim();
  return LEAD_LABEL.test(value) ? value : GOOGLE_ADS_LEAD_LABEL_FALLBACK;
}

export function googleAdsId(): string {
  return resolveGoogleAdsId(
    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || process.env.GOOGLE_ADS_ID || ""
  );
}

export function googleAdsLeadLabel(): string {
  return resolveGoogleAdsLeadLabel(
    process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL ||
      process.env.GOOGLE_ADS_LEAD_LABEL ||
      process.env.GOOGLE_ADS_CONVERSION_LABEL ||
      process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL ||
      ""
  );
}

export function googleAdsSendTo(id = googleAdsId(), label = googleAdsLeadLabel()): string {
  return `${id}/${label}`;
}
