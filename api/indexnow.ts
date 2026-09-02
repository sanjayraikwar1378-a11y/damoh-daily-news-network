// IndexNow Automatic Search Engine Indexing Submitter
// Complies with IndexNow protocol (Microsoft Bing, Yandex, Seznam, Naver)

export const INDEXNOW_KEY = "2710f5ce0d40420ca1296b880592e549";
export const INDEXNOW_HOST = "www.damohdailynewsnetwork.in";
export const INDEXNOW_KEY_LOCATION = `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`;

export interface IndexNowSubmitResult {
  success: boolean;
  urls: string[];
  statusCode?: number;
  response?: string;
  endpoints?: { endpoint: string; status: number; message?: string }[];
  error?: string;
}

/**
 * Normalizes URL or slug into a full canonical URL for www.damohdailynewsnetwork.in
 */
export function normalizeIndexNowUrl(urlOrSlug: string, defaultHost = INDEXNOW_HOST): string {
  if (!urlOrSlug) return `https://${defaultHost}/`;
  const clean = urlOrSlug.trim();
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    // If it's a localhost or preview URL, transform to production domain for IndexNow
    if (clean.includes("localhost") || clean.includes("127.0.0.1") || clean.includes("run.app") || clean.includes("vercel.app")) {
      try {
        const parsed = new URL(clean);
        return `https://${defaultHost}${parsed.pathname}${parsed.search}`;
      } catch {
        return `https://${defaultHost}/`;
      }
    }
    return clean;
  }
  if (clean.startsWith("/")) {
    return `https://${defaultHost}${clean}`;
  }
  if (clean.startsWith("article/")) {
    return `https://${defaultHost}/${clean}`;
  }
  // Assume it is an article slug
  return `https://${defaultHost}/article/${clean}`;
}

/**
 * Submits single or batch URLs to IndexNow (Bing, Yandex, etc.)
 * Safe with timeout and robust error catching so calling processes are never interrupted.
 */
export async function submitToIndexNow(
  urls: string | string[],
  customHost?: string
): Promise<IndexNowSubmitResult> {
  let host = customHost || INDEXNOW_HOST;
  if (!host || host.includes("localhost") || host.includes("127.0.0.1") || host.includes("run.app") || host.includes("vercel.app")) {
    host = INDEXNOW_HOST;
  }

  const rawList = Array.isArray(urls) ? urls : [urls];
  const urlList = Array.from(
    new Set(
      rawList
        .filter(Boolean)
        .map(u => normalizeIndexNowUrl(u, host))
    )
  );

  if (urlList.length === 0) {
    return {
      success: true,
      urls: [],
      error: "No valid URLs provided for IndexNow submission"
    };
  }

  const payload: Record<string, any> = {
    host,
    key: INDEXNOW_KEY,
    keyLocation: `https://${host}/${INDEXNOW_KEY}.txt`,
    urlList
  };

  const endpoints = [
    "https://api.indexnow.org/indexnow",
    "https://www.bing.com/indexnow"
  ];

  const results: { endpoint: string; status: number; message?: string }[] = [];
  let atLeastOneSuccess = false;

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s safe timeout

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const status = res.status;
      let text = "";
      try {
        text = await res.text();
      } catch {}

      // IndexNow returns 200 (OK) or 202 (Accepted) on successful receipt
      if (status === 200 || status === 202) {
        atLeastOneSuccess = true;
      }

      results.push({
        endpoint,
        status,
        message: text || (status === 200 || status === 202 ? "Accepted" : `HTTP ${status}`)
      });
    } catch (err: any) {
      console.warn(`[IndexNow] Error submitting to ${endpoint}:`, err?.message || err);
      results.push({
        endpoint,
        status: 0,
        message: err?.message || "Network request failed"
      });
    }
  }

  return {
    success: atLeastOneSuccess,
    urls: urlList,
    endpoints: results
  };
}

/**
 * Serverless / Express handler for Vercel and Express server
 */
export default async function handler(req: any, res: any) {
  // CORS support
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // GET: Health / Status check
  if (req.method === "GET") {
    return res.status(200).json({
      service: "IndexNow Submitter",
      host: INDEXNOW_HOST,
      keyLocation: INDEXNOW_KEY_LOCATION,
      status: "active"
    });
  }

  // POST: Submit URLs
  if (req.method === "POST") {
    try {
      const body = req.body || {};
      const urls = body.urls || body.url || body.slug || body.urlList || [];
      const host = body.host || INDEXNOW_HOST;

      const result = await submitToIndexNow(urls, host);
      return res.status(result.success ? 200 : 207).json(result);
    } catch (err: any) {
      console.warn("[IndexNow API] Uncaught handler error:", err);
      return res.status(200).json({
        success: false,
        error: err?.message || "Internal error in IndexNow submission handler",
        urls: []
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
