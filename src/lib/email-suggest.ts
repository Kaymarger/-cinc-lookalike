const DOMAIN_TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmai.com": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "yahooo.com": "yahoo.com",
  "yaho.com": "yahoo.com",
  "yahoo.co": "yahoo.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outlook.co": "outlook.com",
  "icloud.co": "icloud.com",
  "icoud.com": "icloud.com",
};

/** A corrected address when the typed email has a common typo, otherwise null. */
export function suggestEmail(raw: string): string | null {
  const value = raw.trim().toLowerCase().replace(/\s+/g, "");
  if (!value || !value.includes("@")) return null;
  let next = value
    .replace(/,com$/i, ".com")
    .replace(/,ca$/i, ".ca")
    .replace(/,net$/i, ".net")
    .replace(/,org$/i, ".org")
    .replace(/,co$/i, ".co");
  const at = next.lastIndexOf("@");
  const local = next.slice(0, at);
  let domain = next.slice(at + 1).replace(/,([a-z]{2,})$/i, ".$1");
  if (DOMAIN_TYPOS[domain]) domain = DOMAIN_TYPOS[domain];
  if (!local || local.includes("@") || !domain.includes(".")) return null;
  const suggestion = `${local}@${domain}`;
  return suggestion === value ? null : suggestion;
}

export function emailLooksValid(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim());
}
