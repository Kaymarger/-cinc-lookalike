import Script from "next/script";

const ATTRIBUTION_BOOTSTRAP = `
try {
  var params = new URLSearchParams(location.search);
  var keys = ["utm_source","utm_medium","utm_campaign","utm_term","utm_content","gclid","fbclid"];
  var found = {};
  for (var i = 0; i < keys.length; i++) {
    var value = params.get(keys[i]);
    if (value) found[keys[i]] = value.slice(0, 300);
  }
  var raw = sessionStorage.getItem("gvhs-attribution");
  var prev = raw ? JSON.parse(raw) : {};
  var hasCampaign = Object.keys(found).length > 0;
  var next = {
    utmSource: hasCampaign ? (found.utm_source || "") : (prev.utmSource || ""),
    utmMedium: hasCampaign ? (found.utm_medium || "") : (prev.utmMedium || ""),
    utmCampaign: hasCampaign ? (found.utm_campaign || "") : (prev.utmCampaign || ""),
    utmTerm: hasCampaign ? (found.utm_term || "") : (prev.utmTerm || ""),
    utmContent: hasCampaign ? (found.utm_content || "") : (prev.utmContent || ""),
    gclid: hasCampaign ? (found.gclid || "") : (prev.gclid || ""),
    fbclid: hasCampaign ? (found.fbclid || "") : (prev.fbclid || ""),
    landingPath: hasCampaign ? (location.pathname + location.search) : (prev.landingPath || location.pathname + location.search),
    referrer: prev.referrer || document.referrer || ""
  };
  sessionStorage.setItem("gvhs-attribution", JSON.stringify(next));
} catch (e) {}
`;

function metaId() {
  const value = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
  return /^\d{8,20}$/.test(value.trim()) ? value.trim() : "";
}

function googleId() {
  const value = process.env.GOOGLE_ADS_ID || process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "";
  return /^AW-[A-Za-z0-9]{4,32}$/.test(value.trim()) ? value.trim() : "";
}

function conversionLabel() {
  const value =
    process.env.GOOGLE_ADS_CONVERSION_LABEL ||
    process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL ||
    "";
  return /^[A-Za-z0-9_-]{4,64}$/.test(value.trim()) ? value.trim() : "";
}

/** Stores ad click parameters and loads Meta / Google tags only when IDs are set. */
export function AdPixels() {
  const meta = metaId();
  const google = googleId();
  const label = conversionLabel();
  const config = JSON.stringify({ meta, google, label });

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: ATTRIBUTION_BOOTSTRAP }} />
      <script dangerouslySetInnerHTML={{ __html: `window.__gvhsAds=${config};` }} />
      {meta ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(meta)});fbq('track','PageView');`}
        </Script>
      ) : null}
      {google ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${google}`}
            strategy="afterInteractive"
          />
          <Script id="google-ads" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config',${JSON.stringify(google)});`}
          </Script>
        </>
      ) : null}
    </>
  );
}
