/** Feed credentials stay on the server. Never include them in logs or responses. */
export function ddfCredentials(): { username: string; password: string } | null {
  const username = process.env.DDF_USERNAME?.trim() || "";
  const password = process.env.DDF_PASSWORD?.trim() || "";
  if (!username || !password) return null;
  return { username, password };
}

export function ddfConfigured(): boolean {
  return ddfCredentials() !== null;
}

export function safeDdfError(status: number, body: string): string {
  const scrubbed = body
    .replace(/client_id=[^&\s]+/gi, "client_id=[redacted]")
    .replace(/client_secret=[^&\s]+/gi, "client_secret=[redacted]")
    .replace(/password=[^&\s]+/gi, "password=[redacted]")
    .replace(/access_token["']?\s*[:=]\s*["'][^"']+/gi, "access_token:[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
  return `DDF HTTP ${status}${scrubbed ? `: ${scrubbed}` : ""}`;
}
