import type { IncomingMessage, ServerResponse } from "http";
import crypto from "crypto";

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
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
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
    const apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY || "";
    const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || "damoh-daily-news";

    if (!apiSecret) {
      res.status(200).json({
        signed: false,
        message: "CLOUDINARY_API_SECRET not set on server. Falling back to unsigned mode or client preset."
      });
      return;
    }

    const paramsToSign: Record<string, string> = {};
    if (folder) paramsToSign.folder = folder;
    if (timestamp) paramsToSign.timestamp = String(timestamp);
    if (upload_preset) paramsToSign.upload_preset = upload_preset;

    const sortedKeys = Object.keys(paramsToSign).sort();
    const stringToSign = sortedKeys.map((key) => `${key}=${paramsToSign[key]}`).join("&") + apiSecret;

    const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

    res.status(200).json({
      signed: true,
      signature,
      timestamp,
      apiKey,
      cloudName,
      uploadPreset: upload_preset
    });
  } catch (err: any) {
    res.status(200).json({ signed: false, error: err?.message || "Failed to generate Cloudinary signature" });
  }
}
