import { chromium } from "playwright-core";

const base = "https://cinc-lookalike.vercel.app";
const dir = "/opt/cursor/artifacts/ux-after";
const browser = await chromium.launch({
  executablePath: "/opt/google/chrome/chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(20000);

async function shot(name, url) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  const accept = page.locator("#accept-cookie-notification");
  if (await accept.count()) await accept.click().catch(() => {});
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${dir}/${name}.png` });
  console.log("ok", name);
}

await shot("home", `${base}/`);
await shot("search", `${base}/search`);
await shot("listing", `${base}/homedetails/bc/sun-peaks/30470266/7000-mcgillivray-lake-drive-unit-16-sun-peaks-bc-v0e5n0`);
await shot("landing", `${base}/lp/home-search`);
await shot("register", `${base}/account/register`);
await shot("login", `${base}/account/login`);
await shot("account", `${base}/account`);
await shot("alerts", `${base}/alerts`);
await shot("favorites", `${base}/my-properties`);
await shot("agent-login", `${base}/agent/login`);
await browser.close();
