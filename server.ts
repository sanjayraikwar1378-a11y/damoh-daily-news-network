import express from "express";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // API Route for Cloudinary Signed Uploads
  app.post("/api/cloudinary-sign", (req, res) => {
    try {
      const { folder, upload_preset, timestamp } = req.body;
      const apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY || "";
      const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || "damoh-daily-news";

      if (!apiSecret) {
        return res.status(200).json({ 
          signed: false, 
          message: "CLOUDINARY_API_SECRET not set on server. Falling back to unsigned mode or client preset." 
        });
      }

      const paramsToSign: Record<string, string> = {};
      if (folder) paramsToSign.folder = folder;
      if (timestamp) paramsToSign.timestamp = String(timestamp);
      if (upload_preset) paramsToSign.upload_preset = upload_preset;

      // Sort parameters alphabetically as required by Cloudinary specification
      const sortedKeys = Object.keys(paramsToSign).sort();
      const stringToSign = sortedKeys.map(key => `${key}=${paramsToSign[key]}`).join("&") + apiSecret;

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
      console.error("Cloudinary sign error:", err);
      res.status(200).json({ signed: false, error: err.message || "Failed to generate Cloudinary signature" });
    }
  });

  // Serve firebase-applet-config.json explicitly if requested
  app.get("/firebase-applet-config.json", (_req, res) => {
    const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      res.setHeader("Content-Type", "application/json");
      res.sendFile(configPath);
    } else {
      res.status(404).json({ error: "Config not found" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Unhandled Express Error:", err);
    res.status(200).send("OK");
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
