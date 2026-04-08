import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getDb } from "../db";
import { articles } from "../../drizzle/schema";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Simple health check for Railway
  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  // One-time migration: import articles from old Manus deployment
  app.get("/api/migrate-from-manus", async (req, res) => {
    const token = req.query.token as string;
    if (token !== "migrate-chinabymonica-2024") {
      res.status(403).json({ error: "Invalid token" });
      return;
    }
    try {
      const response = await fetch(
        "https://chinabymon-dufsqgj3.manus.space/api/trpc/article.list?input=%7B%22json%22%3A%7B%22language%22%3A%22zh%22%2C%22limit%22%3A200%7D%7D"
      );
      const data = (await response.json()) as any;
      const oldArticles = data.result.data.json as any[];
      const db = await getDb();
      if (!db) { res.status(500).json({ error: "DB not available" }); return; }
      let imported = 0, skipped = 0;
      for (const a of oldArticles) {
        try {
          await db.insert(articles).values({
            slug: a.slug,
            category: a.category,
            titleZH: a.titleZH,
            titleEN: a.titleEN,
            subtitleZH: a.subtitleZH ?? null,
            subtitleEN: a.subtitleEN ?? null,
            contentZH: a.contentZH,
            contentEN: a.contentEN,
            coverImage: a.coverImage ?? null,
            author: a.author ?? "Monica Wang",
            published: a.published ?? false,
            featured: a.featured ?? false,
            sortOrder: a.sortOrder ?? 0,
            publishedAt: a.publishedAt ? new Date(a.publishedAt) : null,
          });
          imported++;
        } catch {
          skipped++; // likely duplicate slug
        }
      }
      res.json({ success: true, imported, skipped, total: oldArticles.length });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
