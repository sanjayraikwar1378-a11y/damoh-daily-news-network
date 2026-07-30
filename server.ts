import express from "express";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { 
  getArticleBySlug, 
  injectArticleMetaTags, 
  injectDefaultMetaTags,
  generateSitemapXml,
  generateRobotsTxt,
  generateRssFeedXml
} from "./src/server/meta";

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
      return res.status(400).json({ 
        signed: false, 
        error: "CLOUDINARY_API_SECRET is required on server for secure signed uploads." 
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
    res.status(500).json({ signed: false, error: err.message || "Failed to generate Cloudinary signature" });
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

let viteDevServer: any = null;

async function startServer() {
  // SEO Routes for Google Search Console, Google News, and Web Crawlers
  app.get("/robots.txt", (req, res) => {
    const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
    const protocol = req.headers["x-forwarded-proto"] || (req.headers["x-forwarded-ssl"] === "on" ? "https" : "http");
    const baseUrl = `${protocol}://${host}`;
    const text = generateRobotsTxt(baseUrl);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send(text);
  });

  app.get("/sitemap.xml", async (req, res) => {
    try {
      const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
      const protocol = req.headers["x-forwarded-proto"] || (req.headers["x-forwarded-ssl"] === "on" ? "https" : "http");
      const baseUrl = `${protocol}://${host}`;
      const xml = await generateSitemapXml(baseUrl);
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.status(200).send(xml);
    } catch (err) {
      console.error("Error generating sitemap.xml:", err);
      res.status(500).send("Error generating sitemap");
    }
  });

  app.get(["/rss.xml", "/feed.xml", "/rss"], async (req, res) => {
    try {
      const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
      const protocol = req.headers["x-forwarded-proto"] || (req.headers["x-forwarded-ssl"] === "on" ? "https" : "http");
      const baseUrl = `${protocol}://${host}`;
      const xml = await generateRssFeedXml(baseUrl);
      res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
      res.status(200).send(xml);
    } catch (err) {
      console.error("Error generating RSS feed:", err);
      res.status(500).send("Error generating RSS feed");
    }
  });

  // Intercept /article/:slug for dynamic Open Graph & SEO meta tags (WhatsApp, FB, Telegram, X)
  app.get(["/article/:slug", "/article/:slug/*"], async (req, res, next) => {
    try {
      const slug = req.params.slug;
      const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
      const protocol = req.headers["x-forwarded-proto"] || (req.headers["x-forwarded-ssl"] === "on" ? "https" : "http");
      const fullUrl = `${protocol}://${host}/article/${slug}`;

      const article = await getArticleBySlug(slug);

      let templatePath = process.env.NODE_ENV === "production"
        ? path.join(process.cwd(), "dist", "index.html")
        : path.join(process.cwd(), "index.html");

      if (!fs.existsSync(templatePath)) {
        templatePath = path.join(process.cwd(), "index.html");
      }

      if (fs.existsSync(templatePath)) {
        let html = fs.readFileSync(templatePath, "utf-8");

        if (viteDevServer) {
          html = await viteDevServer.transformIndexHtml(req.originalUrl, html);
        }

        if (article) {
          html = injectArticleMetaTags(html, article, fullUrl);
        } else {
          html = injectDefaultMetaTags(html, fullUrl);
        }

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(200).send(html);
      }
    } catch (err) {
      console.error("Error serving article SSR meta tags:", err);
    }
    next();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    viteDevServer = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(viteDevServer.middlewares);
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

export default app;

