import { describe, it, expect } from "vitest";

/**
 * Tests for OAuth state encoding/decoding compatibility.
 * The state parameter can be in two formats:
 * 1. Legacy: base64(redirectUri) - just the callback URL
 * 2. New: base64(JSON.stringify({ redirectUri, returnPath })) - with return path
 *
 * Both formats must be handled correctly.
 */

function decodeState(state: string): { redirectUri: string; returnPath?: string } {
  const decoded = atob(state);
  try {
    const parsed = JSON.parse(decoded);
    return {
      redirectUri: parsed.redirectUri || decoded,
      returnPath: parsed.returnPath,
    };
  } catch {
    // Legacy format
    return { redirectUri: decoded };
  }
}

function encodeStateLegacy(redirectUri: string): string {
  return btoa(redirectUri);
}

function encodeStateNew(redirectUri: string, returnPath?: string): string {
  const payload = returnPath
    ? JSON.stringify({ redirectUri, returnPath })
    : JSON.stringify({ redirectUri });
  return btoa(payload);
}

describe("OAuth state encoding/decoding", () => {
  const callbackUrl = "https://www.chinabymonica.com/api/oauth/callback";

  it("decodes legacy state format (plain base64 URL)", () => {
    const state = encodeStateLegacy(callbackUrl);
    const result = decodeState(state);
    expect(result.redirectUri).toBe(callbackUrl);
    expect(result.returnPath).toBeUndefined();
  });

  it("decodes new state format without returnPath", () => {
    const state = encodeStateNew(callbackUrl);
    const result = decodeState(state);
    expect(result.redirectUri).toBe(callbackUrl);
    expect(result.returnPath).toBeUndefined();
  });

  it("decodes new state format with returnPath", () => {
    const state = encodeStateNew(callbackUrl, "/admin/articles");
    const result = decodeState(state);
    expect(result.redirectUri).toBe(callbackUrl);
    expect(result.returnPath).toBe("/admin/articles");
  });

  it("handles returnPath with query parameters", () => {
    const state = encodeStateNew(callbackUrl, "/admin/articles?page=2");
    const result = decodeState(state);
    expect(result.redirectUri).toBe(callbackUrl);
    expect(result.returnPath).toBe("/admin/articles?page=2");
  });

  it("validates returnPath is a relative path (security)", () => {
    const state = encodeStateNew(callbackUrl, "/admin/articles");
    const result = decodeState(state);
    // returnPath must start with / and not //
    const isValidPath = result.returnPath
      ? result.returnPath.startsWith("/") && !result.returnPath.startsWith("//")
      : true;
    expect(isValidPath).toBe(true);
  });

  it("rejects absolute URL as returnPath", () => {
    const state = encodeStateNew(callbackUrl, "https://evil.com");
    const result = decodeState(state);
    const isValidPath = result.returnPath
      ? result.returnPath.startsWith("/") && !result.returnPath.startsWith("//")
      : true;
    expect(isValidPath).toBe(false);
  });

  it("rejects protocol-relative URL as returnPath", () => {
    const state = encodeStateNew(callbackUrl, "//evil.com");
    const result = decodeState(state);
    const isValidPath = result.returnPath
      ? result.returnPath.startsWith("/") && !result.returnPath.startsWith("//")
      : true;
    expect(isValidPath).toBe(false);
  });
});
