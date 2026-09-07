import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import app from "./api/index";
import { startLiveUpdatesCleanupScheduler } from "./api/liveUpdatesCleanup";

const PORT = 3000;

let viteDevServer: any = null;

async function startServer() {
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
  app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Unhandled Express Error:", err?.message || err);
    if (res.headersSent) return;
    if (req.path && req.path.startsWith("/api/")) {
      return res.status(500).json({ success: false, error: "Internal server error" });
    }
    res.status(500).send("Internal Server Error");
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    // Start automated background 7-day Live Updates cleanup scheduler
    startLiveUpdatesCleanupScheduler();
  });
}

startServer();

export default app;
