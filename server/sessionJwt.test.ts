import { describe, expect, it } from "vitest";
import { signSessionJwtHs256, verifySessionJwtHs256 } from "./_core/sessionJwt";

describe("sessionJwt HS256", () => {
  const secret = "test-secret-key-min-32-chars-long!!";

  it("round-trips claims", () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = signSessionJwtHs256(
      { openId: "admin@test.com", appId: "chinabymonica", name: "Admin", exp },
      secret
    );
    expect(verifySessionJwtHs256(token, secret)).toEqual({
      openId: "admin@test.com",
      appId: "chinabymonica",
      name: "Admin",
    });
  });

  it("rejects wrong secret", () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = signSessionJwtHs256(
      { openId: "a", appId: "chinabymonica", name: "b", exp },
      secret
    );
    expect(verifySessionJwtHs256(token, "other-secret-other-secret-other")).toBeNull();
  });

  it("rejects expired token", () => {
    const exp = Math.floor(Date.now() / 1000) - 10;
    const token = signSessionJwtHs256(
      { openId: "a", appId: "chinabymonica", name: "b", exp },
      secret
    );
    expect(verifySessionJwtHs256(token, secret)).toBeNull();
  });
});
