/**
 * PROVISIONAL page type에서 확정 판정(FAIL/WARN)을 내리면 안 된다는 계약을
 * 검증한다. date.signal 검수 중 발견한 버그(AC-SEO-DATE-PRESENT가
 * pageType.assignment를 안 보고 type만 봄)를 고치면서 같은 패턴을 전체
 * evaluator에서 grep해 AC-SEO-SCHEMA-TYPE에도 동일 결함이 있음을 확인하고
 * 함께 고쳤다. 근거: applicability.ts의 "confidence >= 0.85일 때만 확정
 * 판정한다" 계약.
 */

import { describe, expect, it } from "vitest";
import { analyzeSnapshotV2 } from "../../lib/v2";
import { createSnapshot } from "../../lib/v2/snapshot";

const FETCHED_AT = "2026-08-20T00:00:00.000Z";
const FILLER = "본문을 채우는 문장입니다. ".repeat(30);

async function analyze(url: string, html: string) {
  const snapshot = await createSnapshot({
    requestUrl: url,
    rawHtml: html,
    headers: { "content-type": "text/html; charset=utf-8" },
    fetchedAt: FETCHED_AT,
  });
  return analyzeSnapshotV2(snapshot);
}

describe("AC-SEO-SCHEMA-TYPE: PROVISIONAL page type에서 불일치를 확정 WARN하지 않는다", () => {
  it("스키마 type이 후보 page type과 안 맞아도 PROVISIONAL이면 UNKNOWN이다", async () => {
    // 경로 신호(3점)만으로 PROVISIONAL ARTICLE_BLOG를 만들고, schema는
    // PRODUCT를 선언해 명백한 불일치를 준다.
    const html = `<!doctype html><html lang="en"><head><title>T</title>
      <script type="application/ld+json">${JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Widget",
      })}</script>
      </head><body><p>${FILLER}</p></body></html>`;

    const result = await analyze("https://fixtures.test/blog/some-slug", html);
    const rule = result.seo.rules.find(r => r.ruleId === "SR-SEO-SCHEMA-TYPE");
    const atomic = rule?.atomicResults.find(a => a.atomicCheckId === "AC-SEO-SCHEMA-TYPE");

    expect(result.pageType.assignment).not.toBe("AUTO_ASSIGNED");
    expect(atomic?.state).toBe("UNKNOWN");
    expect(atomic?.rationaleCode).toContain("CLASSIFICATION_UNCERTAIN");
  });

  it("일치(compatible)는 AUTO_ASSIGNED가 아니어도 그대로 PASS로 인정한다", async () => {
    // 위와 같은 PROVISIONAL 강도의 신호이지만 schema가 Article이라 실제로 맞는 경우 —
    // 이건 확정 판정이 아니라 근거 확인이라 confidence와 무관하게 PASS여야 한다.
    const html = `<!doctype html><html lang="en"><head><title>T</title>
      <script type="application/ld+json">${JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "T",
      })}</script>
      </head><body><p>${FILLER}</p></body></html>`;

    const result = await analyze("https://fixtures.test/blog/some-slug", html);
    const rule = result.seo.rules.find(r => r.ruleId === "SR-SEO-SCHEMA-TYPE");
    const atomic = rule?.atomicResults.find(a => a.atomicCheckId === "AC-SEO-SCHEMA-TYPE");

    expect(atomic?.state).toBe("PASS");
  });
});
