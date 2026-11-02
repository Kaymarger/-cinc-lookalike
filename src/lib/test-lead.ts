/** Addresses used for checks. They must not reach a real agent or an alert. */
export function isTestLeadEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1] || "";
  if (!domain || domain.includes(" ")) return false;
  return (
    domain === "example.com" ||
    domain.endsWith(".example.com") ||
    domain === "example.org" ||
    domain.endsWith(".example.org") ||
    domain === "example.net" ||
    domain.endsWith(".example.net")
  );
}
