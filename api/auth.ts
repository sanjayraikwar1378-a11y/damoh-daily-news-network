import type { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";

export interface AuthCheckResult {
  authorized: boolean;
  status: 401 | 403 | 200;
  error?: string;
  user?: {
    uid: string;
    email?: string;
    admin?: boolean;
  };
}

// In-memory token verification cache (TTL: 5 minutes for success, 15s for failures)
const tokenCache = new Map<string, { result: AuthCheckResult; expiresAt: number }>();

function getFirebaseApiKey(): string {
  let apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "";
  try {
    const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, "utf-8");
      const json = JSON.parse(raw);
      if (json.apiKey) apiKey = json.apiKey;
    }
  } catch {
    // ignore
  }
  return apiKey;
}

/**
 * Validates whether an email belongs to an authorized admin account.
 * Exactly matches the pattern enforced in firestore.rules.
 */
export function isAllowedAdminEmail(email?: string | null): boolean {
  if (!email || typeof email !== "string") return false;
  const normalized = email.toLowerCase().trim();
  return (
    normalized === "sanjayraikwar1378@gmail.com" ||
    normalized.endsWith("@damohdaily.com") ||
    normalized.endsWith("@damohdailynews.com")
  );
}

/**
 * Server-side admin authentication and authorization verification.
 * Supports:
 *  1. Firebase ID Token (Bearer <idToken>) verified via Google Identity Toolkit
 *  2. Server secret key headers (x-admin-key, x-admin-secret, or Bearer <secret>)
 */
export async function verifyAdminAuth(req: Request | any): Promise<AuthCheckResult> {
  const headers = req.headers || {};
  const authHeader = headers.authorization || headers.Authorization;
  const adminKey = headers["x-admin-key"] || headers["x-admin-secret"];

  // 1. Check Server Environment Admin Keys / Cron Secret
  const validSecrets = [
    process.env.ADMIN_API_KEY,
    process.env.ADMIN_SECRET,
    process.env.CRON_SECRET
  ].filter((s): s is string => Boolean(s && s.length >= 8));

  if (adminKey && typeof adminKey === "string" && validSecrets.includes(adminKey)) {
    return {
      authorized: true,
      status: 200,
      user: { uid: "system-secret", email: "system@admin", admin: true }
    };
  }

  // 2. Extract Bearer Token
  let token = "";
  if (typeof authHeader === "string") {
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (authHeader.startsWith("bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) {
    return {
      authorized: false,
      status: 401,
      error: "Unauthorized: Missing admin authentication token"
    };
  }

  // Check if Bearer matches server secret
  if (validSecrets.includes(token)) {
    return {
      authorized: true,
      status: 200,
      user: { uid: "system-secret", email: "system@admin", admin: true }
    };
  }

  // Check in-memory verification cache
  const cached = tokenCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  // 3. Verify Firebase ID Token via Google Identity Toolkit REST API
  const apiKey = getFirebaseApiKey();
  if (!apiKey) {
    return {
      authorized: false,
      status: 401,
      error: "Authentication service misconfigured"
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    if (!lookupRes.ok) {
      const resData = await lookupRes.json().catch(() => ({}));
      const errMsg = resData?.error?.message || "Invalid or expired authentication token";
      const result: AuthCheckResult = {
        authorized: false,
        status: 401,
        error: `Unauthorized: ${errMsg}`
      };
      tokenCache.set(token, { result, expiresAt: Date.now() + 15000 });
      return result;
    }

    const data = await lookupRes.json();
    const user = data?.users?.[0];
    if (!user) {
      const result: AuthCheckResult = {
        authorized: false,
        status: 401,
        error: "Unauthorized: User account not found"
      };
      tokenCache.set(token, { result, expiresAt: Date.now() + 15000 });
      return result;
    }

    // Check custom claims
    let hasAdminClaim = false;
    if (user.customAttributes) {
      try {
        const claims = JSON.parse(user.customAttributes);
        if (claims.admin === true || claims.role === "admin") {
          hasAdminClaim = true;
        }
      } catch {
        // ignore
      }
    }

    const isEmailAdmin = isAllowedAdminEmail(user.email);

    if (!hasAdminClaim && !isEmailAdmin) {
      const result: AuthCheckResult = {
        authorized: false,
        status: 403,
        error: "Forbidden: Admin privileges required"
      };
      tokenCache.set(token, { result, expiresAt: Date.now() + 60000 });
      return result;
    }

    const successResult: AuthCheckResult = {
      authorized: true,
      status: 200,
      user: {
        uid: user.localId,
        email: user.email,
        admin: true
      }
    };

    // Cache successful verification for 5 minutes
    tokenCache.set(token, { result: successResult, expiresAt: Date.now() + 5 * 60 * 1000 });
    return successResult;
  } catch (err: any) {
    console.warn("[AdminAuth] Token verification network or abort error:", err?.message || err);
    return {
      authorized: false,
      status: 401,
      error: "Unauthorized: Authentication verification failed"
    };
  }
}

/**
 * Express middleware to enforce admin-only access on routes.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const result = await verifyAdminAuth(req);
  if (!result.authorized) {
    return res.status(result.status).json({
      success: false,
      error: result.error || "Unauthorized"
    });
  }
  (req as any).user = result.user;
  next();
}
