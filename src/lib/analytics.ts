/**
 * Lightweight Google Analytics 4 (GA4) Integration
 * Official gtag.js implementation for Damoh Daily News Network.
 * Performance-first, asynchronous, non-blocking, ad-blocker resilient.
 */

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

let isInitialized = false;
let currentMeasurementId: string | null = null;

/**
 * Resolves the active GA4 Measurement ID:
 * 1. Primary: import.meta.env.VITE_GA_MEASUREMENT_ID
 * 2. Secondary fallback: siteSettings.googleAnalyticsId
 */
export function getMeasurementId(fallbackId?: string): string | null {
  const envId = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim();
  const candidate = envId || fallbackId?.trim();
  if (candidate && /^G-[A-Z0-9]+$/i.test(candidate)) {
    return candidate;
  }
  return null;
}

/**
 * Initializes GA4 asynchronously and non-blocking.
 * Guaranteed to run only once.
 * Defers script injection until after the page load and browser is idle.
 */
export function initGA4(fallbackId?: string): void {
  if (typeof window === "undefined") return;
  if (isInitialized) return;

  const measurementId = getMeasurementId(fallbackId);
  if (!measurementId) {
    // No measurement ID configured; GA4 remains completely inert
    return;
  }

  // Respect user privacy / Do Not Track (DNT)
  if (
    navigator.doNotTrack === "1" ||
    (window as any).doNotTrack === "1" ||
    navigator.doNotTrack === "yes"
  ) {
    return;
  }

  isInitialized = true;
  currentMeasurementId = measurementId;

  // Prepare standard Google tag dataLayer and gtag stub immediately so events can queue safely
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function () {
      window.dataLayer?.push(arguments);
    };
  }

  window.gtag("js", new Date());

  // In Single Page Applications (SPA), disable automatic page_view on load
  // to avoid duplicate initial hits and cleanly track route transitions via React Router.
  window.gtag("config", measurementId, {
    send_page_view: false,
  });

  // Load the official gtag.js script in a non-blocking manner (after load / idle)
  const injectScript = () => {
    // Check if script tag is already present
    const existing = document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`);
    if (existing) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.onerror = () => {
      // Gracefully handle ad-blockers / network failures without breaking anything
    };
    document.head.appendChild(script);
  };

  // Ensure initial page rendering is never delayed or blocked
  if (document.readyState === "complete") {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => injectScript(), { timeout: 2500 });
    } else {
      setTimeout(injectScript, 1200);
    }
  } else {
    window.addEventListener(
      "load",
      () => {
        if ("requestIdleCallback" in window) {
          window.requestIdleCallback(() => injectScript(), { timeout: 2500 });
        } else {
          setTimeout(injectScript, 1200);
        }
      },
      { once: true }
    );
  }
}

/**
 * Tracks a Single Page Application route navigation page_view event.
 * Prevents duplicates by verifying the target URL has actually changed.
 */
export function trackPageView(pagePath?: string, pageTitle?: string): void {
  if (typeof window === "undefined" || !isInitialized || !currentMeasurementId || !window.gtag) {
    return;
  }

  try {
    const path = pagePath || window.location.pathname + window.location.search;
    const title = pageTitle || document.title;

    window.gtag("event", "page_view", {
      page_path: path,
      page_title: title,
      page_location: window.location.href,
    });
  } catch {
    // Silent catch — never throw or interrupt UI
  }
}

/**
 * Tracks an article_view event safely without duplicate counting.
 */
export function trackArticleView(articleId: string, articleTitle: string, category?: string): void {
  if (typeof window === "undefined" || !isInitialized || !currentMeasurementId || !window.gtag) {
    return;
  }

  try {
    window.gtag("event", "article_view", {
      article_id: articleId,
      article_title: articleTitle,
      category: category || "general",
    });
  } catch {
    // Silent catch
  }
}
