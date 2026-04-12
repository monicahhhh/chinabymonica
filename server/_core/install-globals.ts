/**
 * Load env before any other module reads process.env (ESM hoists imports, so
 * dotenv cannot run after imports in index.ts — routers/env would see empty JWT_SECRET).
 */
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { webcrypto } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Dev: this file lives in server/_core → two levels up. Prod bundle: dist/index.js → one level up.
const projectRoot =
  path.basename(__dirname) === "dist"
    ? path.resolve(__dirname, "..")
    : path.resolve(__dirname, "../..");
dotenv.config({ path: path.join(projectRoot, ".env") });
dotenv.config({ path: path.join(projectRoot, ".env.local"), override: true });

/**
 * Web Crypto on globalThis (some deps use globalThis.crypto; Node 18 needs this).
 * Bare identifier `crypto` in ESM on Node 18 is fixed by Node 20+ or
 * NODE_OPTIONS=--experimental-global-webcrypto (see package.json scripts).
 */

const g = globalThis as typeof globalThis & { crypto?: Crypto };

if (g.crypto === undefined) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
    enumerable: true,
    writable: false,
  });
}
