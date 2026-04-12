import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import { signSessionJwtHs256, verifySessionJwtHs256 } from "./sessionJwt";

class SDKServer {
  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) return new Map<string, string>();
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const exp = Math.floor((issuedAt + expiresInMs) / 1000);
    const secret = ENV.cookieSecret;
    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }

    return signSessionJwtHs256(
      {
        openId,
        appId: "chinabymonica",
        name: options.name ?? "",
        exp,
      },
      secret
    );
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<{ openId: string; appId: string; name: string } | null> {
    if (!cookieValue) return null;

    const secret = ENV.cookieSecret;
    if (!secret) return null;

    return verifySessionJwtHs256(cookieValue, secret);
  }

  async authenticateRequest(req: Request): Promise<User> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) throw ForbiddenError("Invalid session cookie");

    const user = await db.getUserByOpenId(session.openId);
    if (!user) throw ForbiddenError("User not found");

    try {
      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
    } catch (err) {
      console.warn("[auth] lastSignedIn update skipped:", err);
    }

    return user;
  }
}

export const sdk = new SDKServer();
