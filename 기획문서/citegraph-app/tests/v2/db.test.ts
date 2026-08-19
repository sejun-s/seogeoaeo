import { describe, expect, it } from "vitest";
import { validateAndNormalizeUrl } from "../../lib/audit/guard";
import { calculateInputHash, sha256Hex } from "../../lib/audit/hash";
import { decodeCursor, encodeCursor } from "../../lib/repositories/audit-repository";

describe("CiteGraph Backend Guard & Hash Tests", () => {
  it("normalizes scheme, hostname and redacts sensitive query params", async () => {
    const input = "HTTPS://Example.COM:443/test?api_key=secret123&q=search#section";
    const res = await validateAndNormalizeUrl(input);

    expect(res.normalizedUrl).toBe("https://example.com/test?api_key=%3Credacted%3E&q=search");
  });

  it("calculates deterministic SHA-256 hex digest", async () => {
    const hash1 = await sha256Hex("hello world");
    const hash2 = await sha256Hex("hello world");
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it("calculates stable input hash regardless of key insertion order", async () => {
    const input1 = {
      normalizedUrl: "https://example.com/",
      finalUrl: "https://example.com/",
      httpStatus: 200,
      htmlHash: "abc",
      headers: { contentType: "text/html", xRobotsTag: "" },
    };

    const input2 = {
      finalUrl: "https://example.com/",
      normalizedUrl: "https://example.com/",
      httpStatus: 200,
      htmlHash: "abc",
      headers: { xRobotsTag: "", contentType: "text/html" },
    };

    const hash1 = await calculateInputHash(input1);
    const hash2 = await calculateInputHash(input2);

    expect(hash1).toBe(hash2);
  });

  it("encodes and decodes composite cursor for pagination", () => {
    const now = new Date();
    const id = "run_123456";
    const encoded = encodeCursor(now, id);
    const decoded = decodeCursor(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded?.requestedAt.getTime()).toBe(now.getTime());
    expect(decoded?.id).toBe(id);
  });
});
