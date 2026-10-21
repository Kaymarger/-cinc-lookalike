import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const src = path.join(root, "src");

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

function appRoutes() {
  const app = path.join(src, "app");
  const routes = [];
  for (const file of walk(app)) {
    if (!file.endsWith(`${path.sep}page.tsx`) && !file.endsWith(`${path.sep}page.ts`)) continue;
    let rel = path.relative(app, path.dirname(file)).split(path.sep).join("/");
    if (rel === ".") rel = "";
    const segments = rel.split("/").filter(Boolean).map((seg) => {
      if (seg.startsWith("[[...") && seg.endsWith("]]")) return { kind: "optional", name: seg };
      if (seg.startsWith("[...") && seg.endsWith("]")) return { kind: "catch", name: seg };
      if (seg.startsWith("[") && seg.endsWith("]")) return { kind: "dyn", name: seg };
      return { kind: "static", name: seg };
    });
    routes.push(segments);
  }
  return routes;
}

function matches(segments, parts) {
  let i = 0;
  let j = 0;
  while (i < segments.length) {
    const seg = segments[i];
    if (seg.kind === "optional") {
      if (j < parts.length) j += 1;
      i += 1;
      continue;
    }
    if (seg.kind === "catch") {
      return true;
    }
    if (j >= parts.length) return false;
    if (seg.kind === "static" && seg.name !== parts[j]) return false;
    i += 1;
    j += 1;
  }
  return j === parts.length;
}

function routeExists(routes, href) {
  const clean = href.split("?")[0].split("#")[0];
  if (!clean.startsWith("/")) return true;
  const parts = clean.split("/").filter(Boolean);
  return routes.some((segments) => matches(segments, parts));
}

const REQUIRED = [
  "/",
  "/search",
  "/featured",
  "/about",
  "/contact",
  "/seller/homeestimate",
  "/terms",
  "/privacy",
  "/faq",
  "/disclaimer",
  "/dashboard",
  "/seller/homepulse",
  "/notebook",
  "/account/settings",
  "/account/login",
  "/account/register",
  "/account/forgotpassword",
  "/savedhomes",
  "/my-properties",
  "/alerts",
  "/compare",
  "/mortgage",
  "/recently-viewed",
  "/agent",
  "/agent/launchpad/agent",
  "/agent/launchpad/dialersummary",
  "/agent/leads/export",
  "/agent/leads/dialer-history",
  "/agent/deals/purchases",
  "/agent/deals/listings",
  "/agent/inbox",
  "/agent/inbox/sent",
  "/agent/inbox/drafts",
  "/agent/inbox/trashed",
  "/agent/inbox/templates",
  "/agent/automations/autotracks",
  "/agent/automations/behavioralcomms",
  "/agent/properties/textresponder",
  "/agent/properties/openhouses",
  "/agent/properties/virtualopenhouses",
  "/agent/properties/add",
  "/agent/sellersuite",
  "/agent/landing",
  "/agent/landing/buyers",
  "/agent/landing/sellers",
  "/agent/landing/contact",
  "/agent/settings/profile",
  "/agent/settings/settings",
  "/agent/settings/customlinks",
  "/agent/plans",
  "/agent/settings",
  "/agent/settings/team",
  "/agent/settings/routing",
  "/agent/settings/notifications",
  "/agent/settings/phone",
  "/agent/settings/email",
  "/agent/settings/website",
  "/agent/settings/idx",
  "/agent/settings/integrations",
  "/agent/settings/sources",
  "/agent/settings/tags",
  "/agent/settings/fields",
  "/agent/settings/billing",
  "/agent/automations",
  "/agent/automations/templates",
  "/agent/automations/lists",
  "/agent/automations/alerts",
  "/agent/automations/assign",
  "/agent/automations/behavioral",
  "/agent/automations/ai",
  "/agent/leads",
  "/agent/dialer",
  "/agent/calendar",
  "/agent/tasks",
  "/agent/marketing",
  "/agent/reports",
  "/agent/deals",
  "/agent/communications",
  "/agent/properties",
  "/agent/website",
];

const routes = appRoutes();
const files = walk(src).filter((f) => /\.(tsx|ts|jsx|js|mjs)$/.test(f));
const hrefs = new Set(REQUIRED);
const problems = [];

const hrefRe = /href\s*=\s*["'`]([^"'`]+)["'`]/g;
const pushRe = /(?:push|replace)\(\s*["'`](\/[^"'`]+)["'`]/g;

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  for (const re of [hrefRe, pushRe]) {
    re.lastIndex = 0;
    let match;
    while ((match = re.exec(text))) {
      const href = match[1];
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
      if (href === "#" || href === "") {
        problems.push(`${path.relative(root, file)}: empty href`);
        continue;
      }
      if (href.startsWith("http://") || href.startsWith("https://")) continue;
      if (!href.startsWith("/")) continue;
      if (href.includes("${")) continue;
      hrefs.add(href);
    }
  }
}

for (const href of hrefs) {
  if (!routeExists(routes, href)) {
    problems.push(`missing route for ${href}`);
  }
}

if (problems.length) {
  console.error(`Link check failed (${problems.length}):`);
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log(`Link check passed (${hrefs.size} internal links, ${routes.length} pages).`);
