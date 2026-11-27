import Script from "next/script";
import { AdsLibraries } from "@/components/ads-libraries";
import { MetaPixelGate } from "@/components/meta-pixel-gate";
import { ADS_CONSENT_REQUIRED } from "@/lib/ads-consent";
import { googleAdsId, googleAdsLeadLabel } from "@/lib/google-ads";
import { metaPixelId } from "@/lib/meta-pixel";

const ATTRIBUTION_BOOTSTRAP = `
function gvhsCaptureAds() {
  try {
    var params = new URLSearchParams(location.search);
    var keys = ["utm_source","utm_medium","utm_campaign","utm_term","utm_content","gclid","gbraid","wbraid","fbclid"];
    var found = {};
    for (var i = 0; i < keys.length; i++) {
      var value = params.get(keys[i]);
      if (value) found[keys[i]] = value.slice(0, 300);
    }
    var prev = {};
    try { prev = JSON.parse(sessionStorage.getItem("gvhs-attribution") || "{}"); } catch (e) {}
    var adClick = found.gclid || found.gbraid || found.wbraid || found.fbclid || found.utm_source;
    var stored = "";
    try { stored = localStorage.getItem("gvhs-cookies") || ""; } catch (e) {}
    var optedOut = stored === "essential" || stored === "opt-out" || document.cookie.indexOf("gvhs-cookies=essential") !== -1 || document.cookie.indexOf("gvhs-cookies=opt-out") !== -1;
    var consentRequired = ${ADS_CONSENT_REQUIRED ? "true" : "false"};
    var trackAds = !optedOut && (!consentRequired || stored === "all");
    window.__gvhsAdsOptOut = !trackAds;
    if (optedOut && document.cookie.indexOf("gvhs-cookies=") === -1) {
      document.cookie = "gvhs-cookies=opt-out;path=/;max-age=31536000;samesite=lax";
    }
    if (stored === "all" && document.cookie.indexOf("gvhs-cookies=") === -1) {
      document.cookie = "gvhs-cookies=all;path=/;max-age=31536000;samesite=lax";
    }
    function cookie(name) {
      var match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
      return match ? decodeURIComponent(match[1]) : "";
    }
    var next = {
      utmSource: found.utm_source || prev.utmSource || "",
      utmMedium: found.utm_medium || prev.utmMedium || "",
      utmCampaign: found.utm_campaign || prev.utmCampaign || "",
      utmTerm: found.utm_term || prev.utmTerm || "",
      utmContent: found.utm_content || prev.utmContent || "",
      gclid: found.gclid || prev.gclid || "",
      gbraid: found.gbraid || prev.gbraid || "",
      wbraid: found.wbraid || prev.wbraid || "",
      fbclid: found.fbclid || prev.fbclid || "",
      fbc: trackAds ? (cookie("_fbc") || prev.fbc || "") : "",
      fbp: trackAds ? (cookie("_fbp") || prev.fbp || "") : "",
      landingPath: adClick ? (location.pathname + location.search).slice(0, 500) : (prev.landingPath || (location.pathname + location.search).slice(0, 500)),
      landingUrl: adClick ? location.href.slice(0, 500) : (prev.landingUrl || location.href.slice(0, 500)),
      referrer: prev.referrer || document.referrer || "",
      device: window.matchMedia && window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop"
    };
    sessionStorage.setItem("gvhs-attribution", JSON.stringify(next));
    document.cookie = "gvhs_attr=" + encodeURIComponent(JSON.stringify(next)) + ";path=/;max-age=7776000;samesite=lax";
  } catch (e) {}
}
window.__gvhsCaptureAds = gvhsCaptureAds;
gvhsCaptureAds();
`;

function ga4Id() {
  const value = process.env.GA4_ID || process.env.NEXT_PUBLIC_GA4_ID || "";
  return /^G-[A-Z0-9]{4,20}$/.test(value.trim()) ? value.trim() : "";
}

/** Stores ad click parameters and loads Meta / Google tags. Opt-out turns both off. */
export function AdPixels() {
  const google = googleAdsId();
  const ga4 = ga4Id();
  const label = googleAdsLeadLabel();
  const meta = metaPixelId();
  const tagId = google || ga4;
  const config = JSON.stringify({ google, ga4, label, meta });
  const consentAndConfig = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;window.__gvhsGtagConfigured=true;var adsChoice=window.__gvhsAdsOptOut?"denied":"granted";gtag("consent","default",{ad_storage:adsChoice,ad_user_data:adsChoice,ad_personalization:adsChoice,analytics_storage:adsChoice});gtag("js",new Date());${ga4 ? `gtag("config",${JSON.stringify(ga4)});` : ""}${google ? `gtag("config",${JSON.stringify(google)},{allow_enhanced_conversions:true});` : ""}`;

  return (
    <>
      <link rel="preconnect" href="https://ddfcdn.realtor.ca" crossOrigin="" />
      <script dangerouslySetInnerHTML={{ __html: ATTRIBUTION_BOOTSTRAP }} />
      <script dangerouslySetInnerHTML={{ __html: `window.__gvhsAds=${config};` }} />
      {tagId ? <script dangerouslySetInnerHTML={{ __html: consentAndConfig }} /> : null}
      <AdsLibraries tagId={tagId} />
      <MetaPixelGate />
    </>
  );
}
