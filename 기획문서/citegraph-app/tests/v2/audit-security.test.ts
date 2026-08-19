import { describe, expect, it } from "vitest";
import { guardUrl } from "../../lib/audit/guard";

describe("CiteGraph SSRF & URL Security Tests", () => {
  it("blocks localhost and loopback IPv4 addresses", async () => {
    await expect(guardUrl("http://localhost/")).rejects.toThrow("SSRF_BLOCKED");
    await expect(guardUrl("http://127.0.0.1/")).rejects.toThrow("SSRF_BLOCKED");
    await expect(guardUrl("http://127.0.0.2/")).rejects.toThrow("SSRF_BLOCKED");
  });

  it("blocks private IPv4 ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16)", async () => {
    await expect(guardUrl("http://10.0.0.1/")).rejects.toThrow("SSRF_BLOCKED");
    await expect(guardUrl("http://172.16.0.1/")).rejects.toThrow("SSRF_BLOCKED");
    await expect(guardUrl("http://192.168.1.1/")).rejects.toThrow("SSRF_BLOCKED");
    await expect(guardUrl("http://169.254.169.254/")).rejects.toThrow("SSRF_BLOCKED");
  });

  it("blocks non-http/https protocols", async () => {
    await expect(guardUrl("ftp://example.com/")).rejects.toThrow("INVALID_URL");
    await expect(guardUrl("file:///etc/passwd")).rejects.toThrow("INVALID_URL");
  });

  it("blocks URL userinfo (credentials)", async () => {
    await expect(guardUrl("http://admin:secret@example.com/")).rejects.toThrow("INVALID_URL");
  });
});
