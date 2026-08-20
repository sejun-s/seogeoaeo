/**
 * Frozen Corpus (원본 HTML 비저장 방식) 재현성 및 무결성 테스트.
 *
 * 근거:
 * - 기획문서/score-reliability-improvement-plan-2026-08-20-v2-final.md §3-1, §5 P5
 * - 기획문서/gemini-prompt-score-reliability-p4-p7.md P5
 *
 * 검증 항목:
 * 1. 동일 HTML + 동일 ruleset = 동일 contentHash + 동일 평가 결과 (결정론적 재현성).
 * 2. 원본 HTML 없이도 FactRecord/EvidenceRecord와 contentHash 기반으로 스냅샷 무결성 검증 가능.
 * 3. 저장소에 타 사이트 원본 HTML 전문을 커밋하지 않고도 신뢰성 있는 회귀 테스트 수행 가능.
 */

import { describe, expect, it } from "vitest";
import { analyzeSnapshotV2 } from "../../lib/v2";
import { createSnapshot } from "../../lib/v2/snapshot";
import { createFrozenSnapshot, verifyFrozenIntegrity } from "../../lib/v2/corpus";

const SAMPLE_HTML = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>Frozen Corpus Test Domain</title>
  <meta name="description" content="Verifying determinism and reproducibility without storing raw HTML.">
  <link rel="canonical" href="https://example.com/frozen-test">
  <script type="application/ld+json">{
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Frozen Corpus Test Domain",
    "author": { "@type": "Person", "name": "Antigravity Team" },
    "datePublished": "2026-08-20"
  }</script>
</head>
<body>
  <article>
    <h1>Frozen Corpus Test Domain</h1>
    <p>본문 텍스트입니다. 결정론적 진단 엔진의 재현성을 증명하기 위해 충분한 길이의 본문을 제공합니다. </p>
    <p>이 코퍼스는 원본 HTML을 공개 저장소에 보관하지 않고도 contentHash와 정규화된 사실 집합으로 정확히 검증됩니다.</p>
  </article>
</body>
</html>`;

describe("P5: Frozen Corpus (원본 HTML 비저장 방식) 및 재현성 검증", () => {
  it("동일한 HTML과 동일한 ruleset 환경에서 항상 동일한 contentHash와 점수를 반환한다", async () => {
    const run1 = await createSnapshot({
      requestUrl: "https://example.com/frozen-test",
      rawHtml: SAMPLE_HTML,
      headers: { "content-type": "text/html; charset=utf-8" },
      fetchedAt: "2026-08-20T10:00:00.000Z",
    });
    const analysis1 = analyzeSnapshotV2(run1);

    const run2 = await createSnapshot({
      requestUrl: "https://example.com/frozen-test",
      rawHtml: SAMPLE_HTML,
      headers: { "content-type": "text/html; charset=utf-8" },
      fetchedAt: "2026-08-20T10:00:00.000Z",
    });
    const analysis2 = analyzeSnapshotV2(run2);

    // contentHash 동일성
    expect(analysis1.contentHash).toBe(analysis2.contentHash);
    expect(analysis1.contentHash).toHaveLength(64);

    // PageType 및 점수 동일성
    expect(analysis1.pageType.type).toBe(analysis2.pageType.type);
    expect(analysis1.pageType.confidence).toBe(analysis2.pageType.confidence);
    expect(analysis1.seo.score).toBe(analysis2.seo.score);
    expect(analysis1.geoFact.score).toBe(analysis2.geoFact.score);
    expect(analysis1.seo.coverage.coverage).toBe(analysis2.seo.coverage.coverage);
    expect(analysis1.geoFact.coverage.coverage).toBe(analysis2.geoFact.coverage.coverage);

    // Fact 및 Evidence 개수 동일성
    expect(analysis1.facts.length).toBe(analysis2.facts.length);
    expect(analysis1.evidence.length).toBe(analysis2.evidence.length);
  });

  it("Frozen Snapshot 레코드를 생성하고 contentHash 기반 무결성을 검증한다", async () => {
    const snapshot = await createSnapshot({
      requestUrl: "https://example.com/frozen-test",
      rawHtml: SAMPLE_HTML,
      headers: { "content-type": "text/html; charset=utf-8" },
      fetchedAt: "2026-08-20T10:00:00.000Z",
    });
    const analysis = analyzeSnapshotV2(snapshot);

    const frozen = createFrozenSnapshot(analysis, "2026-08-20T10:00:00.000Z");

    // Frozen Record 검증
    expect(frozen.contentHash).toBe(analysis.contentHash);
    expect(frozen.summary.factCount).toBe(analysis.facts.length);
    expect(frozen.summary.evidenceCount).toBe(analysis.evidence.length);
    expect(frozen.metadata.storageMode).toBe("FROZEN_RECORD");

    // 동일한 contentHash 검증 시 통과
    const checkPass = verifyFrozenIntegrity(frozen, analysis.contentHash);
    expect(checkPass.valid).toBe(true);

    // 변조된 contentHash 검증 시 실패
    const checkFail = verifyFrozenIntegrity(frozen, "alteredhash12");
    expect(checkFail.valid).toBe(false);
    expect(checkFail.reason).toContain("contentHash mismatch");
  });
});
