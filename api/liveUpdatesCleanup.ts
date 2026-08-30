import crypto from "crypto";
import path from "path";
import fs from "fs";

// Constants
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 30 * 60 * 1000; // Run every 30 minutes

interface FirestoreFieldVal {
  stringValue?: string;
  integerValue?: string | number;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  nullValue?: null;
  arrayValue?: { values?: FirestoreFieldVal[] };
  mapValue?: { fields?: Record<string, FirestoreFieldVal> };
}

function parseFirestoreFields(fields: Record<string, FirestoreFieldVal>): Record<string, any> {
  const result: Record<string, any> = {};
  if (!fields || typeof fields !== 'object') return result;

  for (const [key, val] of Object.entries(fields)) {
    if (!val || typeof val !== 'object') continue;
    if ('stringValue' in val) result[key] = val.stringValue;
    else if ('integerValue' in val) result[key] = Number(val.integerValue);
    else if ('doubleValue' in val) result[key] = Number(val.doubleValue);
    else if ('booleanValue' in val) result[key] = val.booleanValue;
    else if ('timestampValue' in val) result[key] = val.timestampValue;
    else if ('nullValue' in val) result[key] = null;
    else if ('arrayValue' in val) {
      result[key] = (val.arrayValue?.values || []).map((v: any) => v.stringValue || v);
    } else if ('mapValue' in val) {
      result[key] = parseFirestoreFields(val.mapValue?.fields || {});
    }
  }
  return result;
}

/**
 * Extracts Cloudinary Public ID from a direct public ID or a Cloudinary asset URL.
 * Example URL: https://res.cloudinary.com/demo/image/upload/v12345/damoh_news/live_updates/img_123.webp
 * Returns: "damoh_news/live_updates/img_123"
 */
export function extractCloudinaryPublicId(urlOrId?: string): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  
  // If already a publicId like "damoh_news/live_updates/xyz"
  if (!urlOrId.startsWith('http://') && !urlOrId.startsWith('https://') && !urlOrId.startsWith('data:')) {
    if (urlOrId.includes('/')) return urlOrId;
    return null;
  }

  if (!urlOrId.includes('res.cloudinary.com')) {
    return null;
  }

  try {
    const cleanUrl = urlOrId.split('?')[0].split('#')[0];
    // Match everything after /upload/(optional transforms/)(optional v[0-9]+/) until file extension
    const match = cleanUrl.match(/\/upload\/(?:[^\/]+\/)*(?:v\d+\/)?([^\.\?\#]+)(?:\.[a-zA-Z0-9]+)?$/);
    if (match && match[1]) {
      // Decode any URI components
      const publicId = decodeURIComponent(match[1]);
      return publicId;
    }
  } catch (err) {
    console.warn("[LiveUpdates Cleanup] Error parsing Cloudinary URL:", err);
  }
  return null;
}

/**
 * Permanently destroys an image asset from Cloudinary CDN storage
 */
export async function destroyCloudinaryImage(publicId: string): Promise<boolean> {
  const apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY || "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || "damoh-daily-news";

  if (!apiKey || !apiSecret || !cloudName || !publicId) {
    return false;
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

    const formData = new URLSearchParams();
    formData.append("public_id", publicId);
    formData.append("api_key", apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString()
    });

    if (res.ok) {
      const data = await res.json();
      const success = data?.result === "ok" || data?.result === "not found";
      console.log(`[LiveUpdates Cleanup] Cloudinary image destroyed: ${publicId} (result: ${data?.result})`);
      return success;
    } else {
      const errText = await res.text().catch(() => "");
      console.warn(`[LiveUpdates Cleanup] Cloudinary destroy failed for ${publicId}:`, errText);
    }
  } catch (err) {
    console.error(`[LiveUpdates Cleanup] Cloudinary destroy network error for ${publicId}:`, err);
  }

  return false;
}

/**
 * Gets Firebase Project ID and API Key from config or environment
 */
function getFirebaseConfig(): { projectId: string; apiKey: string } {
  let projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "damoh-daily-news";
  let apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "";

  try {
    const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, "utf-8");
      const json = JSON.parse(raw);
      if (json.projectId) projectId = json.projectId;
      if (json.apiKey) apiKey = json.apiKey;
    }
  } catch (e) {
    // ignore
  }

  return { projectId, apiKey };
}

export interface CleanupResult {
  success: boolean;
  scannedCount: number;
  deletedCount: number;
  deletedIds: string[];
  deletedImages: string[];
  timestamp: string;
  error?: string;
}

/**
 * Scans Firestore live_updates collection, finds records > 7 days old,
 * deletes associated image files from Cloudinary storage,
 * and permanently deletes the document from Firestore.
 */
export async function performLiveUpdatesCleanup(): Promise<CleanupResult> {
  const result: CleanupResult = {
    success: true,
    scannedCount: 0,
    deletedCount: 0,
    deletedIds: [],
    deletedImages: [],
    timestamp: new Date().toISOString()
  };

  try {
    const { projectId, apiKey } = getFirebaseConfig();
    const now = Date.now();
    const sevenDaysAgoIso = new Date(now - SEVEN_DAYS_MS).toISOString();

    // Query Firestore REST API for documents in 'live_updates' collection
    const queryUrl = apiKey 
      ? `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`
      : `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;

    const requestBody = {
      structuredQuery: {
        from: [{ collectionId: "live_updates" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "publishedAt" },
            op: "LESS_THAN_OR_EQUAL",
            value: { stringValue: sevenDaysAgoIso }
          }
        },
        limit: 100
      }
    };

    const response = await fetch(queryUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.warn(`[LiveUpdates Cleanup] Firestore runQuery returned status ${response.status}: ${errText}`);
      // Fallback: fetch collection documents list to inspect
      return await fallbackPerformCleanup(projectId, apiKey, now);
    }

    const items: Array<{ document?: { name: string; fields: Record<string, FirestoreFieldVal> } }> = await response.json();
    if (!Array.isArray(items)) {
      return result;
    }

    for (const item of items) {
      if (!item.document || !item.document.name) continue;
      result.scannedCount++;

      const docName = item.document.name; // projects/PROJECT_ID/databases/(default)/documents/live_updates/DOC_ID
      // STRICT SAFETY CHECK: Must be inside live_updates collection ONLY
      if (!docName.includes('/documents/live_updates/')) {
        console.warn(`[LiveUpdates Cleanup] SAFETY WARNING: Skipping document outside live_updates: ${docName}`);
        continue;
      }

      const docId = docName.split('/live_updates/')[1];
      if (!docId) continue;

      const fields = parseFirestoreFields(item.document.fields || {});
      const pubTimeStr = fields.publishedAt || fields.createdAt;
      if (!pubTimeStr) continue;

      const pubTime = new Date(pubTimeStr).getTime();
      if (isNaN(pubTime)) continue;

      // STRICT SAFETY CHECK: Age must be strictly >= 7 days (604800000 ms)
      const ageMs = now - pubTime;
      if (ageMs < SEVEN_DAYS_MS) {
        continue; // Not yet 7 days old
      }

      // 1. Delete associated image from Cloudinary storage if present
      const imagePublicId = fields.imagePublicId || extractCloudinaryPublicId(fields.imageUrl);
      if (imagePublicId) {
        try {
          const imgDeleted = await destroyCloudinaryImage(imagePublicId);
          if (imgDeleted) {
            result.deletedImages.push(imagePublicId);
          }
        } catch (imgErr) {
          console.warn(`[LiveUpdates Cleanup] Failed to destroy image ${imagePublicId}:`, imgErr);
        }
      }

      // 2. Permanently delete the Firestore document
      const deleteUrl = apiKey
        ? `https://firestore.googleapis.com/v1/${docName}?key=${apiKey}`
        : `https://firestore.googleapis.com/v1/${docName}`;

      try {
        const delRes = await fetch(deleteUrl, { method: "DELETE" });
        if (delRes.ok || delRes.status === 404) {
          result.deletedCount++;
          result.deletedIds.push(docId);
          console.log(`[LiveUpdates Cleanup] Deleted expired live update document: ${docId} (age: ${(ageMs / (24 * 3600 * 1000)).toFixed(1)} days)`);
        } else {
          const delErrText = await delRes.text().catch(() => "");
          console.warn(`[LiveUpdates Cleanup] Firestore delete returned ${delRes.status} for ${docId}:`, delErrText);
        }
      } catch (delErr) {
        console.error(`[LiveUpdates Cleanup] Network error deleting document ${docId}:`, delErr);
      }
    }

    if (result.deletedCount > 0) {
      console.log(`[LiveUpdates Cleanup] Deletion cycle finished: ${result.deletedCount} expired documents and ${result.deletedImages.length} images permanently deleted.`);
    }

    return result;
  } catch (err: any) {
    console.error("[LiveUpdates Cleanup] Error during cleanup execution:", err);
    result.success = false;
    result.error = err?.message || String(err);
    return result;
  }
}

/**
 * Fallback cleanup that lists documents in live_updates collection and inspects timestamp
 */
async function fallbackPerformCleanup(projectId: string, apiKey: string, now: number): Promise<CleanupResult> {
  const result: CleanupResult = {
    success: true,
    scannedCount: 0,
    deletedCount: 0,
    deletedIds: [],
    deletedImages: [],
    timestamp: new Date().toISOString()
  };

  try {
    const listUrl = apiKey
      ? `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/live_updates?pageSize=100&key=${apiKey}`
      : `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/live_updates?pageSize=100`;

    const res = await fetch(listUrl);
    if (!res.ok) return result;

    const data = await res.json();
    const documents = data?.documents || [];

    for (const doc of documents) {
      if (!doc.name || !doc.name.includes('/documents/live_updates/')) continue;
      result.scannedCount++;

      const docId = doc.name.split('/live_updates/')[1];
      const fields = parseFirestoreFields(doc.fields || {});
      const pubTimeStr = fields.publishedAt || fields.createdAt;
      if (!pubTimeStr) continue;

      const pubTime = new Date(pubTimeStr).getTime();
      if (isNaN(pubTime)) continue;

      const ageMs = now - pubTime;
      if (ageMs < SEVEN_DAYS_MS) continue;

      // Delete associated image
      const imagePublicId = fields.imagePublicId || extractCloudinaryPublicId(fields.imageUrl);
      if (imagePublicId) {
        await destroyCloudinaryImage(imagePublicId).catch(() => {});
        result.deletedImages.push(imagePublicId);
      }

      // Delete document
      const delUrl = apiKey
        ? `https://firestore.googleapis.com/v1/${doc.name}?key=${apiKey}`
        : `https://firestore.googleapis.com/v1/${doc.name}`;

      const delRes = await fetch(delUrl, { method: "DELETE" });
      if (delRes.ok || delRes.status === 404) {
        result.deletedCount++;
        result.deletedIds.push(docId);
      }
    }
  } catch (err: any) {
    result.success = false;
    result.error = err?.message;
  }

  return result;
}

let cleanupTimer: NodeJS.Timeout | null = null;

/**
 * Initializes and starts the background recurring cleanup scheduler on the Node.js server.
 * Runs initially 10 seconds after server startup, then recurring every 30 minutes.
 */
export function startLiveUpdatesCleanupScheduler() {
  if (cleanupTimer) return;

  console.log("[LiveUpdates Cleanup] Starting automated server-side cleanup scheduler (runs every 30 mins, 7-day TTL)...");

  // Initial run after short delay to let server boot cleanly
  setTimeout(() => {
    performLiveUpdatesCleanup().catch(err => {
      console.warn("[LiveUpdates Cleanup] Initial cleanup run error:", err);
    });
  }, 10000);

  // Periodic recurring timer
  cleanupTimer = setInterval(() => {
    performLiveUpdatesCleanup().catch(err => {
      console.warn("[LiveUpdates Cleanup] Periodic cleanup run error:", err);
    });
  }, CLEANUP_INTERVAL_MS);

  if (typeof cleanupTimer.unref === 'function') {
    cleanupTimer.unref();
  }
}
