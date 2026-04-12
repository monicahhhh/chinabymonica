import "./install-globals";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

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
  // So req.protocol / secure cookies match the client when behind Railway, nginx, etc.
  app.set("trust proxy", 1);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Health checks for Railway (config uses /api/health; /health is a common default)
  const healthHandler: express.RequestHandler = (_req, res) =>
    res.status(200).json({ ok: true });
  app.get("/api/health", healthHandler);
  app.get("/health", healthHandler);
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

  // Production: platforms (Railway, etc.) require the exact PORT they inject.
  // Development: always scan for a free port — Vite/dotenv may set PORT=3000 while another
  // process (or a tsx-watch restart) still holds 3000, which would skip findAvailablePort and fail.
  const envPortRaw = process.env.PORT;
  const isProd = process.env.NODE_ENV === "production";
  let port: number;
  if (isProd && envPortRaw) {
    port = parseInt(envPortRaw, 10);
  } else {
    const preferred = envPortRaw ? parseInt(envPortRaw, 10) : 3000;
    const start = Number.isFinite(preferred) && preferred > 0 ? preferred : 3000;
    port = await findAvailablePort(start);
    if (port !== start) {
      console.log(`Port ${start} was busy, using port ${port} instead`);
    }
  }

  server.once("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `[startup] Port ${port} is already in use. Free it or use another port:\n` +
          `  lsof -i :${port}    # find PID\n` +
          `  kill <PID>          # stop it\n` +
          `  # or: PORT=3001 npm run dev`
      );
    }
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(
      `[startup] NODE_ENV=${process.env.NODE_ENV ?? "(unset)"} listening on 0.0.0.0:${port}`
    );
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch(console.error);
