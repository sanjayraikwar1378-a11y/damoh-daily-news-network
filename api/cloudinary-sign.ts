import type { IncomingMessage, ServerResponse } from "http";
import crypto from "crypto";
import { verifyAdminAuth } from "./auth.js";

interface ExtendedRequest extends IncomingMessage {
  body?: any;
}

interface ExtendedResponse extends ServerResponse {
  status: (statusCode: number) => ExtendedResponse;
  json: (data: any) => void;
}

export default async function handler(req: ExtendedRequest, res: ExtendedResponse) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-admin-key, x-admin-secret");

  if (req.method === "OPTIONS") {
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "Method not allowed. Only POST is accepted." });
    return;
  }

  // Enforce Admin Authorization
  const authCheck = await verifyAdminAuth(req);
  if (!authCheck.authorized) {
    res.status(authCheck.status || 401).json({
      success: false,
      signed: false,
      error: authCheck.error || "Unauthorized: Admin authorization required"
    });
    return;
  }

  try {
    let body = req.body;

    // Parse body if stream
    if (!body || typeof body === "string") {
      const buffers: Buffer[] = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const data = Buffer.concat(buffers).toString();
      try {
        body = JSON.parse(data);
      } catch {
        body = {};
      }
    }

    const { folder, upload_preset, timestamp } = body || {};

    // Validate inputs
    if (folder && (typeof folder !== "string" || folder.includes("..") || folder.length > 150 || !/^[a-zA-Z0-9_\-\/]+$/.test(folder))) {
      res.status(400).json({ success: false, signed: false, error: "Invalid folder parameter" });
      return;
    }

    if (upload_preset && (typeof upload_preset !== "string" || upload_preset.length > 100 || !/^[a-zA-Z0-9_\-]+$/.test(upload_preset))) {
      res.status(400).json({ success: false, signed: false, error: "Invalid upload_preset parameter" });
      return;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const parsedTs = Number(timestamp);
    if (!timestamp || isNaN(parsedTs) || Math.abs(nowSec - parsedTs) > 900) {
      res.status(400).json({ success: false, signed: false, error: "Invalid or expired timestamp" });
      return;
    }

    const apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY || "";
    const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || "damoh-daily-news";

    if (!apiSecret) {
      res.status(500).json({
        success: false,
        signed: false,
        error: "Server configuration missing: CLOUDINARY_API_SECRET"
      });
      return;
    }

    const paramsToSign: Record<string, string> = {};
    if (folder) paramsToSign.folder = folder;
    paramsToSign.timestamp = String(parsedTs);
    if (upload_preset) paramsToSign.upload_preset = upload_preset;

    const sortedKeys = Object.keys(paramsToSign).sort();
    const stringToSign = sortedKeys.map((key) => `${key}=${paramsToSign[key]}`).join("&") + apiSecret;

    const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

    res.status(200).json({
      success: true,
      signed: true,
      signature,
      timestamp: parsedTs,
      apiKey,
      cloudName,
      uploadPreset: upload_preset
    });
  } catch (err: any) {
    console.warn("[Cloudinary Sign Error]:", err?.message || err);
    res.status(500).json({ success: false, signed: false, error: "Failed to generate Cloudinary signature" });
  }
}
