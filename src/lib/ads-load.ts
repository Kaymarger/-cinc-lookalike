type Gtag = (...args: unknown[]) => void;
type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: unknown;
  loaded: boolean;
  version: string;
};

type AdsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: Gtag;
  fbq?: Fbq;
  _fbq?: Fbq;
  __gvhsGtagConfigured?: boolean;
  __gvhsGtagLoading?: boolean;
  __gvhsMetaInited?: boolean;
  __gvhsMetaLoading?: boolean;
  __gvhsAdsOptOut?: boolean;
  __gvhsPageViewId?: string;
};

function adsWindow(): AdsWindow {
  return window as AdsWindow;
}

/** Queue Google commands before gtag.js arrives. The library replays dataLayer once. */
export function installGtagStub(): Gtag {
  const w = adsWindow();
  w.dataLayer = w.dataLayer || [];
  if (typeof w.gtag !== "function") {
    function gtag(this: unknown) {
      w.dataLayer?.push(arguments);
    }
    w.gtag = gtag as unknown as Gtag;
  }
  return w.gtag;
}

export function loadGtagLibrary(id: string) {
  const w = adsWindow();
  if (!id || w.__gvhsAdsOptOut || w.__gvhsGtagLoading) return;
  if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) return;
  w.__gvhsGtagLoading = true;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  script.dataset.gvhsGtag = "1";
  document.head.appendChild(script);
}

export function installFbqStub(): Fbq {
  const w = adsWindow();
  if (w.fbq) return w.fbq;
  function fbq(this: unknown) {
    const fn = fbq as unknown as Fbq;
    if (fn.callMethod) fn.callMethod.apply(fbq, arguments as unknown as unknown[]);
    else fn.queue.push(arguments);
  }
  const queued = fbq as unknown as Fbq;
  queued.push = queued;
  queued.loaded = true;
  queued.version = "2.0";
  queued.queue = [];
  w.fbq = queued;
  if (!w._fbq) w._fbq = queued;
  return queued;
}

export function loadMetaLibrary() {
  const w = adsWindow();
  if (w.__gvhsAdsOptOut || w.__gvhsMetaLoading) return;
  if (document.querySelector('script[src*="connect.facebook.net/en_US/fbevents.js"]')) return;
  w.__gvhsMetaLoading = true;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  script.dataset.gvhsMeta = "1";
  document.head.appendChild(script);
}

export function markGtagConfigured() {
  adsWindow().__gvhsGtagConfigured = true;
}

export function gtagIsConfigured(): boolean {
  return Boolean(adsWindow().__gvhsGtagConfigured);
}

export function markMetaInited() {
  adsWindow().__gvhsMetaInited = true;
}

export function metaIsInited(): boolean {
  return Boolean(adsWindow().__gvhsMetaInited);
}

export function pageViewEventId(): string {
  return adsWindow().__gvhsPageViewId || "";
}
