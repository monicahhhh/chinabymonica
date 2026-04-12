/**
 * Preload before dist/index.js so globalThis.crypto exists before any bundled
 * dependency (e.g. superjson) runs. esbuild merges imports such that in-bundle
 * crypto setup can run too late; `node --import ./dist/crypto-shim.js` fixes that.
 */
import { webcrypto } from "node:crypto";

const g = globalThis as typeof globalThis & { crypto?: Crypto };

if (g.crypto === undefined) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
    enumerable: true,
    writable: false,
  });
}
