/**
 * Client-side IndexNow Integration Utility
 * Automatically notifies search engines (Microsoft Bing, Yandex, Seznam, Naver)
 * and purges server feed cache whenever news articles are published or updated on Damoh Daily News.
 */

export interface IndexNowClientResult {
  success: boolean;
  urls?: string[];
  error?: string;
}

/**
 * Triggers instant server cache invalidation for sitemaps and RSS feeds.
 * Non-blocking and safe.
 */
export async function purgeServerFeedCache(): Promise<void> {
  try {
    fetch("/api/cache/purge", { method: "POST" }).catch(() => {});
  } catch {}
}

/**
 * Dispatches an asynchronous IndexNow indexing request to the backend.
 * Completely non-blocking and safe: failures are gracefully caught and logged,
 * ensuring article creation/update flows in the UI never crash or get delayed.
 */
export async function notifyIndexNow(
  urlOrSlug: string | string[]
): Promise<IndexNowClientResult> {
  // Trigger immediate feed cache purge so sitemap reflects newest data instantly
  purgeServerFeedCache();

  if (!urlOrSlug) {
    return { success: true, urls: [] };
  }

  const rawList = Array.isArray(urlOrSlug) ? urlOrSlug : [urlOrSlug];
  const list = rawList.filter(Boolean);

  if (list.length === 0) {
    return { success: true, urls: [] };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const response = await fetch("/api/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        urls: list,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      console.warn(`[IndexNow] Non-200 HTTP status from server: ${response.status}`);
      return { success: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    console.log("[IndexNow] Successfully notified search engines:", data);
    return { success: data.success ?? true, urls: data.urls };
  } catch (err: any) {
    // Non-blocking catch to ensure UI never fails on network hiccups
    console.warn("[IndexNow] Background notification warning:", err?.message || err);
    return { success: false, error: err?.message || "Request timed out" };
  }
}

