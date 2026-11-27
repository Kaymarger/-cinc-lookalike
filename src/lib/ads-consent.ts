/**
 * One switch for advertising tags.
 * true: Meta pixel and Conversions API run only after the visitor accepts cookies.
 * false: both run without waiting for that choice.
 */
export const ADS_CONSENT_REQUIRED = true;

export const ADS_CONSENT_KEY = "gvhs-cookies";
export const ADS_CONSENT_GRANTED = "all";

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

/** Server-side check. Reads the cookie the banner sets when the visitor chooses Accept. */
export function consentGrantedFromHeader(cookieHeader: string | null | undefined): boolean {
  if (!ADS_CONSENT_REQUIRED) return true;
  return cookieValue(cookieHeader, ADS_CONSENT_KEY) === ADS_CONSENT_GRANTED;
}

/** Browser check. Same flag as the server. */
export function consentGrantedInBrowser(): boolean {
  if (!ADS_CONSENT_REQUIRED) return true;
  try {
    return localStorage.getItem(ADS_CONSENT_KEY) === ADS_CONSENT_GRANTED;
  } catch {
    return false;
  }
}

export function writeConsentCookie(choice: "all" | "essential") {
  if (typeof document === "undefined") return;
  document.cookie = `${ADS_CONSENT_KEY}=${choice};path=/;max-age=31536000;samesite=lax`;
}
