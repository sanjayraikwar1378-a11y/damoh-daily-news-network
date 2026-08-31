import crypto from "crypto";
import path from "path";
import fs from "fs";

export interface FCMPushPayload {
  id?: string;
  title: string;
  body: string;
  priority?: "normal" | "breaking" | "important" | "urgent";
  category?: "breaking" | "important" | "local" | "live_update";
  articleId?: string;
  articleSlug?: string;
  liveUpdateId?: string;
  targetUrl?: string;
  imageUrl?: string;
}

export interface PushDispatchResult {
  success: boolean;
  totalTokens: number;
  sentCount: number;
  failedCount: number;
  invalidTokensRemoved: number;
  method: "fcm_v1" | "no_tokens" | "unconfigured";
  message: string;
  details?: any;
}

interface FCMTokenRecord {
  docName: string;
  docId: string;
  token: string;
  platform: string;
  active: boolean;
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

// In-memory OAuth2 token cache for FCM v1
let cachedOAuthToken: { token: string; expiresAt: number } | null = null;

/**
 * Generates a Google OAuth2 access token for FCM HTTP v1 using Service Account credentials
 */
async function getFCMAccessToken(serviceAccountJson: any): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedOAuthToken && cachedOAuthToken.expiresAt > now + 60) {
    return cachedOAuthToken.token;
  }

  try {
    const clientEmail = serviceAccountJson.client_email;
    const privateKey = serviceAccountJson.private_key;

    if (!clientEmail || !privateKey) {
      console.warn("[FCM Server] Service account missing client_email or private_key");
      return null;
    }

    const header = { alg: "RS256", typ: "JWT" };
    const claim = {
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
    const encodedClaim = Buffer.from(JSON.stringify(claim)).toString("base64url");
    const unsignedToken = `${encodedHeader}.${encodedClaim}`;

    const signer = crypto.createSign("RSA-SHA256");
    signer.update(unsignedToken);
    const signature = signer.sign(privateKey, "base64url");
    const signedJwt = `${unsignedToken}.${signature}`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: signedJwt
      }).toString()
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text().catch(() => "");
      console.warn(`[FCM Server] OAuth token exchange failed (${tokenRes.status}):`, errText);
      return null;
    }

    const tokenData = await tokenRes.json();
    if (tokenData.access_token) {
      cachedOAuthToken = {
        token: tokenData.access_token,
        expiresAt: now + (tokenData.expires_in || 3600)
      };
      return tokenData.access_token;
    }
  } catch (err) {
    console.error("[FCM Server] Error generating OAuth2 access token:", err);
  }

  return null;
}

/**
 * Fetches all registered device tokens from Firestore fcm_tokens collection
 */
export async function fetchRegisteredFCMTokens(projectId: string, apiKey: string): Promise<FCMTokenRecord[]> {
  const tokens: FCMTokenRecord[] = [];

  try {
    const queryUrl = apiKey 
      ? `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/fcm_tokens?pageSize=300&key=${apiKey}`
      : `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/fcm_tokens?pageSize=300`;

    const res = await fetch(queryUrl);
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.warn(`[FCM Server] Fetching fcm_tokens returned ${res.status}:`, err);
      return tokens;
    }

    const data = await res.json();
    const docs = data.documents || [];

    for (const doc of docs) {
      const docName = doc.name || "";
      const docId = docName.split("/fcm_tokens/")[1] || "";
      const fields = doc.fields || {};

      const token = fields.token?.stringValue || "";
      const active = fields.active ? fields.active.booleanValue !== false : true;
      const platform = fields.platform?.stringValue || "web";

      if (token && token.length > 20 && active) {
        tokens.push({ docName, docId, token, platform, active });
      }
    }
  } catch (err) {
    console.error("[FCM Server] Error retrieving registered tokens from Firestore:", err);
  }

  return tokens;
}

/**
 * Removes or marks inactive an invalid/expired FCM registration token in Firestore
 */
async function invalidateFCMToken(docName: string, apiKey: string): Promise<void> {
  try {
    const url = apiKey ? `https://firestore.googleapis.com/v1/${docName}?key=${apiKey}` : `https://firestore.googleapis.com/v1/${docName}`;
    await fetch(url, { method: "DELETE" });
    console.log(`[FCM Server] Purged stale/invalid token document: ${docName}`);
  } catch (err) {
    console.warn(`[FCM Server] Failed to delete stale token ${docName}:`, err);
  }
}

/**
 * Dispatches a push notification to all registered FCM client tokens
 */
export async function dispatchFCMPushNotification(payload: FCMPushPayload): Promise<PushDispatchResult> {
  const { projectId, apiKey } = getFirebaseConfig();

  // 1. Fetch registered tokens
  const tokenRecords = await fetchRegisteredFCMTokens(projectId, apiKey);
  const uniqueTokensMap = new Map<string, FCMTokenRecord>();
  for (const rec of tokenRecords) {
    if (!uniqueTokensMap.has(rec.token)) {
      uniqueTokensMap.set(rec.token, rec);
    }
  }
  const uniqueRecords = Array.from(uniqueTokensMap.values());

  if (uniqueRecords.length === 0) {
    console.log("[FCM Server] No active registered device tokens found in fcm_tokens collection");
    return {
      success: true,
      totalTokens: 0,
      sentCount: 0,
      failedCount: 0,
      invalidTokensRemoved: 0,
      method: "no_tokens",
      message: "No registered device tokens found to receive push notifications."
    };
  }

  // 2. Format title and content
  const formattedTitle = payload.priority === "urgent"
    ? `🚨 ${payload.title}`
    : payload.priority === "breaking"
    ? `🔴 ब्रेकिंग: ${payload.title}`
    : payload.title;

  const targetUrl = payload.targetUrl || (payload.articleSlug ? `/article/${payload.articleSlug}` : "/");
  const notificationTag = `ddn-${payload.id || Date.now()}`;

function parseServiceAccount(raw: string | undefined): any | null {
  if (!raw) return null;
  try {
    let clean = raw.trim();
    if (clean.startsWith('"') && clean.endsWith('"')) {
      clean = clean.slice(1, -1);
    }
    if (clean.startsWith("{")) {
      const parsed = JSON.parse(clean);
      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
      }
      return parsed;
    }
    // Try base64
    const decoded = Buffer.from(clean, "base64").toString("utf-8");
    if (decoded.trim().startsWith("{")) {
      const parsed = JSON.parse(decoded);
      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
      }
      return parsed;
    }
  } catch (e) {
    console.warn("[FCM Server] Service account parsing failed safely:", e);
  }
  return null;
}

  // 3. Check for Service Account (FCM HTTP v1)
  let serviceAccountJson: any = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS);

  // 4. Method A: FCM HTTP v1 Dispatch
  if (serviceAccountJson) {
    const accessToken = await getFCMAccessToken(serviceAccountJson);
    if (accessToken) {
      console.log(`[FCM Server] Dispatching via FCM HTTP v1 to ${uniqueRecords.length} device tokens...`);
      let sentCount = 0;
      let failedCount = 0;
      let invalidTokensRemoved = 0;

      const fcmV1Url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

      for (const rec of uniqueRecords) {
        const urgencyLevel = payload.priority === "urgent" || payload.priority === "breaking" ? "high" : "normal";
        const messageBody = {
          message: {
            token: rec.token,
            notification: {
              title: formattedTitle,
              body: payload.body,
              image: payload.imageUrl || undefined
            },
            data: {
              id: String(payload.id || `ddn_${Date.now()}`),
              title: String(formattedTitle),
              body: String(payload.body),
              url: String(targetUrl),
              targetUrl: String(targetUrl),
              imageUrl: String(payload.imageUrl || ""),
              icon: "/icon-192-v2.png",
              badge: "/favicon-32x32-v2.png",
              category: String(payload.category || "local"),
              priority: String(payload.priority || "normal"),
              articleId: String(payload.articleId || ""),
              articleSlug: String(payload.articleSlug || ""),
              liveUpdateId: String(payload.liveUpdateId || ""),
              tag: String(notificationTag),
              timestamp: String(Date.now())
            },
            webpush: {
              headers: {
                Urgency: urgencyLevel,
                TTL: "86400" // 24 hours delivery window for sleeping/dozing devices
              },
              notification: {
                icon: "/icon-192-v2.png",
                badge: "/favicon-32x32-v2.png",
                image: payload.imageUrl || undefined,
                tag: notificationTag,
                renotify: true
              },
              fcm_options: {
                link: targetUrl
              }
            }
          }
        };

        try {
          const res = await fetch(fcmV1Url, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(messageBody)
          });

          if (res.ok) {
            sentCount++;
          } else {
            failedCount++;
            const errData = await res.json().catch(() => ({}));
            const errorCode = errData?.error?.details?.[0]?.errorCode || errData?.error?.status || "";
            if (errorCode === "UNREGISTERED" || errorCode === "INVALID_ARGUMENT" || res.status === 404) {
              await invalidateFCMToken(rec.docName, apiKey);
              invalidTokensRemoved++;
            }
          }
        } catch (dispatchErr) {
          failedCount++;
          console.warn(`[FCM Server] Error sending push to token ${rec.token.slice(0, 10)}:`, dispatchErr);
        }
      }

      return {
        success: true,
        totalTokens: uniqueRecords.length,
        sentCount,
        failedCount,
        invalidTokensRemoved,
        method: "fcm_v1",
        message: `FCM v1 push sent to ${sentCount}/${uniqueRecords.length} registered devices.`
      };
    }
  }

  // 5. Unconfigured Status: Tokens are registered in Firestore, awaiting FIREBASE_SERVICE_ACCOUNT server secret
  console.log(`[FCM Server] ${uniqueRecords.length} client tokens are registered in Firestore fcm_tokens.`);
  return {
    success: true,
    totalTokens: uniqueRecords.length,
    sentCount: 0,
    failedCount: 0,
    invalidTokensRemoved: 0,
    method: "unconfigured",
    message: `${uniqueRecords.length} device tokens registered. Configure FIREBASE_SERVICE_ACCOUNT in server environment for external push delivery.`
  };
}
