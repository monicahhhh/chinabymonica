import { createHmac, timingSafeEqual } from "node:crypto";

/** Base64url without padding — JWT uses unpadded base64url. */
function b64urlEncode(data: Buffer): string {
  return data
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function b64urlDecodeToBuffer(segment: string): Buffer {
  const pad = (4 - (segment.length % 4)) % 4;
  const b64 = segment.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  return Buffer.from(b64, "base64");
}

export function signSessionJwtHs256(
  claims: { openId: string; appId: string; name: string; exp: number },
  secret: string
): string {
  const header = { alg: "HS256", typ: "JWT" };
  const headerJson = JSON.stringify(header);
  const payloadJson = JSON.stringify(claims);
  const headerPart = b64urlEncode(Buffer.from(headerJson, "utf8"));
  const payloadPart = b64urlEncode(Buffer.from(payloadJson, "utf8"));
  const signingInput = `${headerPart}.${payloadPart}`;
  const sig = createHmac("sha256", secret).update(signingInput).digest();
  return `${signingInput}.${b64urlEncode(sig)}`;
}

export function verifySessionJwtHs256(
  token: string,
  secret: string
): { openId: string; appId: string; name: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  if (!h || !p || !s) return null;

  const signingInput = `${h}.${p}`;
  const expected = createHmac("sha256", secret).update(signingInput).digest();
  let sig: Buffer;
  try {
    sig = b64urlDecodeToBuffer(s);
  } catch {
    return null;
  }
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) {
    return null;
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(Buffer.from(p, "base64url").toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }

  const exp = payload.exp;
  if (typeof exp !== "number" || exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  const { openId, appId, name } = payload;
  if (
    typeof openId !== "string" ||
    typeof appId !== "string" ||
    typeof name !== "string" ||
    openId.length === 0 ||
    appId.length === 0 ||
    name.length === 0
  ) {
    return null;
  }

  return { openId, appId, name };
}
