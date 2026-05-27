type AnalyticsParamValue = string | number | boolean | null | undefined;
type AnalyticsParams = Record<string, AnalyticsParamValue>;

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

const gaMeasurementId = String(import.meta.env.VITE_GA_MEASUREMENT_ID || '').trim();

let isInitialized = false;

export function initAnalytics() {
  if (!gaMeasurementId || isInitialized) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaMeasurementId)}`;
  document.head.appendChild(script);

  window.gtag('js', new Date());
  window.gtag('config', gaMeasurementId);

  isInitialized = true;
}

export function trackEvent(name: string, params: AnalyticsParams = {}) {
  if (!gaMeasurementId || !window.gtag) {
    return;
  }

  window.gtag('event', name, cleanParams(params));
}

function cleanParams(params: AnalyticsParams) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== null && value !== undefined && value !== ''),
  );
}
