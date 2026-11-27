/**
 * One switch for advertising tags.
 * true: Meta, Google, and Conversions API wait until the visitor accepts.
 * false: those tags run unless the visitor opts out.
 */
export const ADS_CONSENT_REQUIRED = false;

export const ADS_CONSENT_KEY = "gvhs-cookies";
export const ADS_CONSENT_GRANTED = "all";

export function adsChoiceOptedOut(choice: string | null | undefined): boolean {
  return choice === "essential" || choice === "opt-out";
}

export function cookieValue(header: string | null | undefined, name: string): string {
  if (!header) return "";
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = header.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`));
  if (!match?.[1]) return "";
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/** Server-side check. Opt-out always wins. Otherwise tags run when consent is not required. */
export function consentGrantedFromHeader(cookieHeader: string | null | undefined): boolean {
  const choice = cookieValue(cookieHeader, ADS_CONSENT_KEY);
  if (adsChoiceOptedOut(choice)) return false;
  if (!ADS_CONSENT_REQUIRED) return true;
  return choice === ADS_CONSENT_GRANTED;
}

/** Browser check. Same flag and opt-out rule as the server. */
export function consentGrantedInBrowser(): boolean {
  if (typeof localStorage === "undefined") return !ADS_CONSENT_REQUIRED;
  try {
    const choice = localStorage.getItem(ADS_CONSENT_KEY);
    if (adsChoiceOptedOut(choice)) return false;
    if (!ADS_CONSENT_REQUIRED) return true;
    return choice === ADS_CONSENT_GRANTED;
  } catch {
    return !ADS_CONSENT_REQUIRED;
  }
}

export function writeConsentCookie(choice: "all" | "essential" | "opt-out") {
  if (typeof document === "undefined") return;
  document.cookie = `${ADS_CONSENT_KEY}=${choice};path=/;max-age=31536000;samesite=lax`;
}
