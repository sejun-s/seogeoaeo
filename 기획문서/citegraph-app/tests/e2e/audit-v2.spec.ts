import { expect, test } from "@playwright/test";

test("v1과 v2 결과, evidence, 오류 상태를 실제 브라우저에서 검증한다", async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const unexpectedResponses: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400 && !response.url().includes("/api/audits")) {
      unexpectedResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.route("**/api/audits**", async (route) => {
    const body = route.request().postDataJSON() as { url: string };
    if (body.url.includes("127.0.0.1")) {
      await route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ error: "SSRF_BLOCKED", message: "SSRF_BLOCKED: 허용되지 않는 로컬/사설 네트워크 주소입니다." }) });
      return;
    }
    if (new URL(route.request().url()).searchParams.get("engine") === "v2") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        engine: "v2-preview", methodologyVersion: "methodology-v2-dev", registryVersion: "registry-v2-draft.2", extractorVersion: "extractor-v2.0.0",
        snapshotId: "SNAP_ff67a9d764d6", contentHash: "ff67a9d764d6", finalUrl: "https://example.com/",
        pageType: { type: "UNKNOWN", confidence: 0.5714, assignment: "UNKNOWN", alternatives: [], evidenceIds: [] },
        registry: { atomicCheckCount: 61, scoringRuleCount: 41 },
        seoFact: { domain: "SEO", score: 88, state: "SCORED", coverage: { applicableWeight: 86, measuredWeight: 21, earnedWeight: 18.5, coverage: 0.244, counts: { PASS: 3, WARN: 1, FAIL: 0, N_A: 3, UNKNOWN: 11, NOT_EVALUATED: 0 } }, categories: [], rules: [] },
        geoFact: { domain: "GEO_FACT", score: 75, state: "SCORED", coverage: { applicableWeight: 40, measuredWeight: 8, earnedWeight: 6, coverage: 0.2, counts: { PASS: 1, WARN: 0, FAIL: 0, N_A: 0, UNKNOWN: 4, NOT_EVALUATED: 0 } }, categories: [], rules: [] },
        geoSemantic: { domain: "GEO_SEMANTIC", score: null, state: "NOT_EVALUATED", coverage: { applicableWeight: 60, measuredWeight: 0, earnedWeight: 0, coverage: 0, counts: { PASS: 0, WARN: 0, FAIL: 0, N_A: 0, UNKNOWN: 0, NOT_EVALUATED: 9 } }, categories: [], rules: [] },
        geoOverall: { state: "NOT_EVALUATED", reason: "semantic-engine-not-implemented" },
        exclusions: [{ ruleId: "SR-SEO-TITLE", domain: "SEO", result: "UNKNOWN", rationaleCode: "no-calibrated-length-profile" }, { ruleId: "SR-SEO-ALT", domain: "SEO", result: "N_A", rationaleCode: "no-applicable-images" }],
      }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      runId: "run-e2e", auditResultId: "result-e2e", cacheHit: false, finalUrl: "https://example.com/", rulesetVersion: "2026.08.1", engineVersion: "v1.0.0",
      extracted: { title: "Example Domain", metaDescription: "Example fixture", h1: ["Example Domain"], canonical: "https://example.com/", robots: "index,follow", schemaTypes: [], lang: "en" },
      scores: { seo: { score: 82, categories: [{ name: "Technical SEO", score: 30, maxScore: 35 }] }, geoReadiness: { score: 68, categories: [{ name: "Answerability", score: 18, maxScore: 30 }] } },
      findings: [{ id: "finding-1", ruleId: "SEO_TITLE", scoreType: "SEO", category: "On-page", title: "Title 확인", description: "Title 규칙 설명", weight: 8, result: "WARN", recommendation: "명확한 title을 사용하세요.", evidence: [{ id: "evidence-1", evidenceCode: "TITLE", field: "title", excerpt: "Example Domain" }] }],
    }) });
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "URL analysis" })).toBeVisible();
  await page.getByLabel("URL").fill("https://example.com");
  await page.getByRole("button", { name: "Analyze" }).click();

  await expect(page.getByRole("heading", { name: "Fact score와 측정 범위" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("SEO Fact score")).toBeVisible();
  await expect(page.getByText("GEO Fact score")).toBeVisible();
  await expect(page.getByText("Coverage", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("NOT_EVALUATED", { exact: false })).toBeVisible();

  await page.getByText("N_A / UNKNOWN 사유", { exact: false }).click();
  await expect(page.locator(".v2-reason-list")).toBeVisible();

  const firstFinding = page.locator(".finding-row").first();
  await firstFinding.click();
  await expect(firstFinding).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".finding-detail").first().getByRole("heading", { name: "Evidence" })).toBeVisible();
  await expect(page.locator(".finding-detail").first().getByRole("heading", { name: "Recommendation" })).toBeVisible();

  const overflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    body: document.body.scrollWidth - document.body.clientWidth,
  }));
  expect(overflow.document).toBeLessThanOrEqual(0);
  expect(overflow.body).toBeLessThanOrEqual(0);

  await page.screenshot({ path: testInfo.outputPath(`audit-v2-${testInfo.project.name}.png`), fullPage: false });

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(unexpectedResponses).toEqual([]);

  await page.getByLabel("URL").fill("http://127.0.0.1/");
  await page.getByRole("button", { name: "Analyze" }).click();
  await expect(page.getByRole("alert")).toContainText("SSRF_BLOCKED");
  await expect(page.getByRole("button", { name: "Analyze" })).toBeEnabled();

  expect(pageErrors).toEqual([]);
  expect(unexpectedResponses).toEqual([]);
});
