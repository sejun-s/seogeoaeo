import { expect, test } from "@playwright/test";

test("비교 화면은 실제 관측 없는 AI Visibility를 UNAVAILABLE로 표시한다", async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const unexpectedResponses: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) unexpectedResponses.push(`${response.status()} ${response.url()}`);
  });

  const targets = [
    { targetId: "target-me", ordinal: 1, role: "ME", label: "자사 사이트 (ME)", displayUrl: "https://example.com/", status: "SUCCESS", auditRunId: "run-me", auditResultId: "result-me", error: null, metrics: { aiVisibilityStatus: "UNAVAILABLE", aiVisibilityReason: "AI 관측 provider와 질문 세트가 연결되지 않았습니다.", citationRate: null, brandMentionRate: null, averageCitationPosition: null, citedObservationCount: 0, mentionedObservationCount: 0, eligibleObservationCount: 0, seoScore: 82, geoReadinessScore: 68 } },
    { targetId: "target-competitor", ordinal: 2, role: "COMPETITOR", label: "경쟁사 1", displayUrl: "https://iana.org/", status: "SUCCESS", auditRunId: "run-competitor", auditResultId: "result-competitor", error: null, metrics: { aiVisibilityStatus: "UNAVAILABLE", aiVisibilityReason: "AI 관측 provider와 질문 세트가 연결되지 않았습니다.", citationRate: null, brandMentionRate: null, averageCitationPosition: null, citedObservationCount: 0, mentionedObservationCount: 0, eligibleObservationCount: 0, seoScore: 76, geoReadinessScore: 61 } },
  ];

  await page.route("**/api/compare**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      compareRunId: "compare-e2e", status: "COMPLETED",
      context: { projectId: "default_project", questionSetId: "none", questionSetVersion: "none", platformSetVersion: "none", rulesetVersion: "2026.08.1", engineVersion: "v1.0.0", comparisonAlgorithmVersion: "v1", startedAt: "2026-08-19T00:00:00Z", completedAt: "2026-08-19T00:00:01Z" },
      targets, summary: null, platforms: [], questions: [],
      categories: [{ categoryName: "Technical SEO", scoreType: "SEO", maxScore: 35, scores: { "https://example.com/": 30, "https://iana.org/": 27 } }],
      findingsDiff: [{ ruleId: "SEO_TITLE", title: "Title 확인", scoreType: "SEO", category: "On-page", weight: 8, results: { "https://example.com/": "PASS", "https://iana.org/": "WARN" } }],
    }) });
  });

  await page.goto("/compare");
  await page.waitForLoadState("networkidle");

  // Shell UI 일관성 검증 (CG 로고, Local workspace, 사이드바 nav)
  await expect(page.locator(".brand i")).toHaveText("CG");
  await expect(page.locator(".brand strong")).toHaveText("CiteGraph");
  await expect(page.getByText("LOCAL WORKSPACE", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Site Compare" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "URL Audit" })).not.toHaveAttribute("aria-current", "page");

  await page.getByRole("button", { name: "Compare Sites" }).click();

  await expect(page.getByText("AI Visibility · UNAVAILABLE")).toBeVisible();
  await expect(page.getByText("실제 AI 엔진 관측과 질문 세트가 연결되지 않아")).toBeVisible();
  await expect(page.getByText("AI 관측 provider와 질문 세트가 연결되지 않았습니다.").first()).toBeVisible();
  await expect(page.getByText("Citation Rate", { exact: false })).toHaveCount(0);
  await expect(page.getByText("SEO Score", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("GEO Readiness", { exact: true }).first()).toBeVisible();

  const overflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    body: document.body.scrollWidth - document.body.clientWidth,
  }));
  expect(overflow.document).toBeLessThanOrEqual(0);
  expect(overflow.body).toBeLessThanOrEqual(0);

  await page.screenshot({ path: testInfo.outputPath(`compare-trust-${testInfo.project.name}.png`), fullPage: false });

  // 사이드바에서 URL Audit 클릭하여 메인 페이지로 이동 확인
  await page.getByRole("link", { name: "URL Audit" }).click();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "SEO & AI Search audit" })).toBeVisible();
  await expect(page.getByRole("link", { name: "URL Audit" })).toHaveAttribute("aria-current", "page");

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(unexpectedResponses).toEqual([]);
});
