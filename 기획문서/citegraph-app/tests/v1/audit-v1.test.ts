/**
 * v1 회귀 테스트.
 *
 * `lib/audit.ts`(rulesetVersion 2026.08.1)는 독립적으로 동작하고,
 * SSRF guard가 살아 있음을 확인한다. 네트워크를 사용하지 않는다.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { auditPage } from "../../lib/audit";

const here = dirname(fileURLToPath(import.meta.url));
const auditSource = readFileSync(join(here, "..", "..", "lib", "audit.ts"), "utf8");

describe("v1 보존", () => {
  it("rulesetVersion 2026.08.1이 유지된다", () => {
    expect(auditSource).toContain('rulesetVersion: "2026.08.1"');
  });

  it("v1 Rule 정의 수가 35개로 유지된다", () => {
    const ids = auditSource.match(/"(SEO|GEO)-[A-Z]+-\d{3}"/g) ?? [];
    expect(new Set(ids).size).toBe(35);
  });
});

describe("v1 SSRF guard", () => {
  it("http/https 이외 scheme을 거부한다", async () => {
    await expect(auditPage("javascript:alert(1)")).rejects.toThrow();
    await expect(auditPage("file:///etc/passwd")).rejects.toThrow();
  });

  it("credential URL을 거부한다", async () => {
    await expect(auditPage("https://user:pass@example.com/")).rejects.toThrow();
  });

  it("loopback과 사설 주소를 거부한다", async () => {
    await expect(auditPage("http://localhost/")).rejects.toThrow();
    await expect(auditPage("http://127.0.0.1/")).rejects.toThrow();
    await expect(auditPage("http://169.254.169.254/")).rejects.toThrow();
    await expect(auditPage("http://10.0.0.1/")).rejects.toThrow();
  });

  it("잘못된 URL 형식을 거부한다", async () => {
    await expect(auditPage("not a url")).rejects.toThrow();
  });
});
