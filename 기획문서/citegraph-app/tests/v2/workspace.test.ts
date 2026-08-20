import { describe, expect, it } from "vitest";
import { normalizeDomainLabel, readWorkspaceId, workspaceCookie } from "../../lib/workspace";

describe("local workspace boundary", () => {
  it("accepts only UUID v4 cookie identifiers", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect(readWorkspaceId(new Request("https://example.test", { headers: { cookie: `x=1; citegraph_workspace=${id}` } }))).toBe(id);
    expect(readWorkspaceId(new Request("https://example.test", { headers: { cookie: "citegraph_workspace=predictable" } }))).toBeNull();
  });

  it("keeps the identifier out of URLs and marks the cookie httpOnly", () => {
    const value = workspaceCookie("11111111-1111-4111-8111-111111111111");
    expect(value).toContain("HttpOnly");
    expect(value).toContain("SameSite=Lax");
    expect(value).not.toContain("Domain=");
  });

  it("treats domain registration as a normalized label only", () => {
    expect(normalizeDomainLabel("HTTPS://WWW.Example.COM/path")).toBe("www.example.com");
    expect(() => normalizeDomainLabel("ftp://example.com")).toThrow("INVALID_DOMAIN");
  });
});
