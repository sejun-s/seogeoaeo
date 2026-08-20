/**
 * Sensitivity 및 Monotonicity(단조성) 테스트.
 *
 * 근거:
 * - 기획문서/score-reliability-improvement-plan-2026-08-20-v2-final.md §1-5, §11, §12
 * - 기획문서/gemini-prompt-score-reliability-p4-p7.md P4
 *
 * 원칙:
 * 1. 기존 15개 fixture corpus를 변경하지 않고 테스트 내부에서 createSnapshot으로 baseline과 변형 HTML을 동적 생성한다.
 * 2. 개별 Fact 변경(author, date, citation, canonical, title)에 대한 점수 delta를 측정한다.
 * 3. 점수 변화량은 임의의 수치가 아니라 각 rule의 maxWeight 또는 상식적 상한선(0~100 범위)을 준수해야 한다.
 * 4. Monotonicity: 유익한 Evidence 추가 시 점수는 비감소(non-decreasing)여야 한다 (Page Type 변경으로 applicable set이 달라지는 특수 경우 제외).
 */

import { describe, expect, it } from "vitest";
import { analyzeSnapshotV2 } from "../../lib/v2";
import { createSnapshot } from "../../lib/v2/snapshot";

const FETCHED_AT = "2026-08-20T00:00:00.000Z";
const BASE_URL = "https://example.com/blog/how-to-optimize-seo";

const FILLER_TEXT =
  "Search engine optimization and generative engine optimization are essential practices for modern web content. " +
  "This guide covers technical foundations, semantic markup, high-quality citations, and clear editorial metadata. ".repeat(
    5,
  );

function createHtml(options: {
  title?: string;
  metaDescription?: string;
  canonical?: string;
  author?: string;
  datePublished?: string;
  externalLink?: string;
  h1?: string;
  headings?: string[];
  schema?: object;
}): string {
  const {
    title = "How to Optimize for Search and AI Engines",
    metaDescription = "A comprehensive technical guide to modern search and generative engine optimization.",
    canonical = "https://example.com/blog/how-to-optimize-seo",
    author,
    datePublished,
    externalLink,
    h1 = "How to Optimize for Search and AI Engines",
    headings = ["Understanding the Fundamentals", "Key Implementation Steps", "Frequently Asked Questions?"],
    schema,
  } = options;

  const defaultSchema = schema || {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    ...(author ? { author: { "@type": "Person", "name": author } } : {}),
    ...(datePublished ? { datePublished, dateModified: datePublished } : {}),
  };

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  ${title ? `<title>${title}</title>` : ""}
  ${metaDescription ? `<meta name="description" content="${metaDescription}">` : ""}
  ${canonical ? `<link rel="canonical" href="${canonical}">` : ""}
  <script type="application/ld+json">${JSON.stringify(defaultSchema)}</script>
</head>
<body>
  <header>
    <nav><a href="/">Home</a> / <a href="/blog">Blog</a></nav>
  </header>
  <main>
    <article>
      <h1>${h1}</h1>
      <div class="meta">
        ${author ? `<span class="author">By ${author}</span>` : ""}
        ${datePublished ? `<time datetime="${datePublished}">${datePublished}</time>` : ""}
      </div>
      ${headings.map((h) => `<h2>${h}</h2><p>${FILLER_TEXT}</p>`).join("\n")}
      ${externalLink ? `<p>Reference: <a href="${externalLink}" target="_blank" rel="noopener">Official Standard Documentation</a></p>` : ""}
    </article>
  </main>
</body>
</html>`;
}

async function evaluate(html: string, url = BASE_URL) {
  const snapshot = await createSnapshot({
    requestUrl: url,
    rawHtml: html,
    headers: { "content-type": "text/html; charset=utf-8" },
    fetchedAt: FETCHED_AT,
  });
  return analyzeSnapshotV2(snapshot);
}

describe("P4: Sensitivity / Monotonicity 테스트 인프라", () => {
  describe("개별 Fact 변경에 대한 감도(Sensitivity) 및 상한선 검증", () => {
    it("Author 추가 시 GEO 점수는 비감소하며 상한선을 넘지 않는다", async () => {
      // 검수 중 발견: SR-GF-AUTHOR-DATE는 AC-GF-AUTHOR와 AC-GF-DATE를
      // worst-of(combineGeneric)로 묶는다. 두 변형 모두 datePublished가
      // 없으면 AC-GF-DATE가 항상 FAIL이라 rule 결과가 author 유무와
      // 무관하게 FAIL로 고정되고 delta가 항상 0이 되어(실측 확인) author의
      // 효과를 전혀 검증하지 못했다. 두 변형 모두 date를 PASS로 고정해
      // author만 격리한다.
      const baselineHtml = createHtml({ author: undefined, datePublished: "2026-08-01" });
      const withAuthorHtml = createHtml({ author: "Dr. Alice Smith", datePublished: "2026-08-01" });

      const baseline = await evaluate(baselineHtml);
      const updated = await evaluate(withAuthorHtml);

      const baselineGeo = baseline.geoFact.score ?? 0;
      const updatedGeo = updated.geoFact.score ?? 0;
      const delta = updatedGeo - baselineGeo;

      // author 격리 후에는 실제로 신호가 잡혀야 한다(회귀 시 이 assert가 깨진다).
      expect(delta).toBeGreaterThan(0);
      // Sensitivity 상한선: 단일 author 변경으로 인한 점수 급변(예: 30점 이상 급등) 방지
      expect(delta).toBeLessThanOrEqual(25);
    });

    it("Date(발행일/수정일) 추가 시 SEO 및 GEO 점수는 비감소한다", async () => {
      // 위와 같은 이유로 author를 두 변형 모두 PASS로 고정해 date만 격리한다.
      const baselineHtml = createHtml({ author: "Baseline Author", datePublished: undefined });
      const withDateHtml = createHtml({ author: "Baseline Author", datePublished: "2026-08-15" });

      const baseline = await evaluate(baselineHtml);
      const updated = await evaluate(withDateHtml);

      const baselineSeo = baseline.seo.score ?? 0;
      const updatedSeo = updated.seo.score ?? 0;
      const baselineGeo = baseline.geoFact.score ?? 0;
      const updatedGeo = updated.geoFact.score ?? 0;

      const seoDelta = updatedSeo - baselineSeo;
      const geoDelta = updatedGeo - baselineGeo;

      // Monotonicity: 날짜 정보 추가 시 감점되지 않음
      expect(seoDelta).toBeGreaterThanOrEqual(0);
      // author 격리 후에는 실제로 신호가 잡혀야 한다.
      expect(geoDelta).toBeGreaterThan(0);
      // Sensitivity 상한: 단일 date 변경이 전체 점수를 과도하게 왜곡하지 않음
      expect(seoDelta).toBeLessThanOrEqual(20);
      expect(geoDelta).toBeLessThanOrEqual(25);
    });

    it("외부 신뢰 출처(Citation link) 추가 시 GEO 점수는 비감소한다", async () => {
      const baselineHtml = createHtml({ externalLink: undefined });
      const withCitationHtml = createHtml({
        externalLink: "https://www.w3.org/TR/html52/",
      });

      const baseline = await evaluate(baselineHtml);
      const updated = await evaluate(withCitationHtml);

      const baselineGeo = baseline.geoFact.score ?? 0;
      const updatedGeo = updated.geoFact.score ?? 0;
      const delta = updatedGeo - baselineGeo;

      expect(delta).toBeGreaterThanOrEqual(0);
      expect(delta).toBeLessThanOrEqual(20);
    });

    it("Canonical 태그 제거 시 SEO 점수는 하락한다", async () => {
      // 검수 중 발견: createHtml의 구조분해 기본값(`canonical = "..."`)은
      // 호출부가 `canonical: undefined`를 명시적으로 넘겨도 기본값으로
      // 대체된다(JS 구조분해 기본값 규칙 — 값이 undefined면 기본값이
      // 적용된다). 그 결과 "제거" 변형에도 canonical이 그대로 남아 두
      // HTML이 완전히 동일했고 delta가 항상 0이 되어(실측 확인) 아무것도
      // 검증하지 못했다. title 제거 테스트가 이미 썼던 것과 같은 방식으로
      // 빈 문자열을 넘겨 기본값 대체를 우회한다(템플릿의 `canonical ? ... : ""`
      // 조건이 falsy를 정상적으로 "없음"으로 취급한다).
      const baselineHtml = createHtml({ canonical: "https://example.com/blog/how-to-optimize-seo" });
      const withoutCanonicalHtml = createHtml({ canonical: "" });

      const baseline = await evaluate(baselineHtml);
      const updated = await evaluate(withoutCanonicalHtml);

      const baselineSeo = baseline.seo.score ?? 0;
      const updatedSeo = updated.seo.score ?? 0;
      const delta = updatedSeo - baselineSeo;

      // 실제로 제거된 후에는 감점이 관측돼야 한다(회귀 시 이 assert가 깨진다).
      expect(delta).toBeLessThan(0);
      expect(Math.abs(delta)).toBeLessThanOrEqual(20);
    });

    it("Title 태그 제거 시 SEO 점수는 명확히 하락한다", async () => {
      const baselineHtml = createHtml({ title: "How to Optimize for Search and AI Engines" });
      const withoutTitleHtml = createHtml({ title: "" });

      const baseline = await evaluate(baselineHtml);
      const updated = await evaluate(withoutTitleHtml);

      const baselineSeo = baseline.seo.score ?? 0;
      const updatedSeo = updated.seo.score ?? 0;

      // Title 제거 시 확실하게 감점되어야 함
      expect(updatedSeo).toBeLessThan(baselineSeo);
      expect(baselineSeo - updatedSeo).toBeLessThanOrEqual(30);
    });
  });

  describe("Monotonicity(단조성) 복합 검증", () => {
    it("기본 완성형 문서에 추가 메타데이터가 누적될수록 점수는 단조 증가(non-decreasing)한다", async () => {
      // Step 1: 최소 뼈대
      const step1Html = createHtml({
        author: undefined,
        datePublished: undefined,
        externalLink: undefined,
      });

      // Step 2: 저자 추가
      const step2Html = createHtml({
        author: "John Developer",
        datePublished: undefined,
        externalLink: undefined,
      });

      // Step 3: 저자 + 날짜 추가
      const step3Html = createHtml({
        author: "John Developer",
        datePublished: "2026-08-01",
        externalLink: undefined,
      });

      // Step 4: 저자 + 날짜 + 외부 인용 추가
      const step4Html = createHtml({
        author: "John Developer",
        datePublished: "2026-08-01",
        externalLink: "https://developer.mozilla.org/en-US/",
      });

      const res1 = await evaluate(step1Html);
      const res2 = await evaluate(step2Html);
      const res3 = await evaluate(step3Html);
      const res4 = await evaluate(step4Html);

      const geo1 = res1.geoFact.score ?? 0;
      const geo2 = res2.geoFact.score ?? 0;
      const geo3 = res3.geoFact.score ?? 0;
      const geo4 = res4.geoFact.score ?? 0;

      // GEO 점수는 순차적으로 단조 증가해야 함
      expect(geo2).toBeGreaterThanOrEqual(geo1);
      expect(geo3).toBeGreaterThanOrEqual(geo2);
      expect(geo4).toBeGreaterThanOrEqual(geo3);

      // 점수 범위는 항상 [0, 100] 내에 위치
      expect(geo4).toBeGreaterThanOrEqual(0);
      expect(geo4).toBeLessThanOrEqual(100);
    });
  });
});
