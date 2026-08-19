import { describe, expect, it } from "vitest";
import { ATOMIC_CHECKS, ATOMIC_CHECK_BY_ID } from "../../lib/v2/registry/atomic-checks";
import {
  GEO_FACT_SCORING_RULES,
  GEO_SEMANTIC_SCORING_RULES,
  PROVISIONAL_ENVELOPE,
  SCORING_RULES,
  SEO_ADVISORY_RULES,
  SEO_SCORING_RULES,
} from "../../lib/v2/registry/scoring-rules";
import { buildRegistryIntegrityReport } from "../../lib/v2/registry/integrity";

describe("Atomic Check Registry", () => {
  it("61개이며 ID 중복이 없다", () => {
    expect(ATOMIC_CHECKS).toHaveLength(61);
    expect(ATOMIC_CHECK_BY_ID.size).toBe(61);
  });

  it("SEO 34 / GEO_FACT 12 / GEO_SEMANTIC 15로 구성된다", () => {
    const count = (prefix: string) => ATOMIC_CHECKS.filter(check => check.atomicCheckId.startsWith(prefix)).length;
    expect(count("AC-SEO-")).toBe(34);
    expect(count("AC-GF-")).toBe(12);
    expect(count("AC-GS-")).toBe(15);
  });

  it("Atomic Check 정의에 weight 계열 필드가 존재하지 않는다", () => {
    // weight inflation을 막는 구조적 계약. 어떤 check에도 배점 필드가 붙으면 실패한다.
    for (const check of ATOMIC_CHECKS) {
      for (const key of Object.keys(check)) {
        expect(key.toLowerCase()).not.toMatch(/weight|score|point/);
      }
    }
  });

  it("N_A 사유 없이 appliesTo를 좁힌 check가 없다", () => {
    for (const check of ATOMIC_CHECKS) {
      const narrowed = check.appliesTo !== "ALL" || check.excludedFrom.length > 0;
      if (narrowed) expect(check.naReason, check.atomicCheckId).toBeTruthy();
    }
  });
});

describe("Scoring Rule Registry", () => {
  it("SEO Scoring Rule은 18개이고 weight 합이 정확히 100이다", () => {
    expect(SEO_SCORING_RULES).toHaveLength(18);
    expect(SEO_SCORING_RULES.reduce((sum, rule) => sum + rule.maxWeight, 0)).toBe(100);
  });

  it("SEO category envelope가 문서 값과 일치한다", () => {
    const report = buildRegistryIntegrityReport();
    expect(report.seoCategoryTotals).toEqual(PROVISIONAL_ENVELOPE.seoCategories);
  });

  it("SEO Advisory 6개는 모두 weight 0이다", () => {
    expect(SEO_ADVISORY_RULES).toHaveLength(6);
    expect(SEO_ADVISORY_RULES.every(rule => rule.maxWeight === 0)).toBe(true);
  });

  it("GEO Technical 8개의 raw 합은 40이다", () => {
    expect(GEO_FACT_SCORING_RULES).toHaveLength(8);
    expect(GEO_FACT_SCORING_RULES.reduce((sum, rule) => sum + rule.maxWeight, 0)).toBe(40);
  });

  it("GEO Semantic candidate raw 합은 43이고 v2.1 deferred는 weight 0이다", () => {
    const report = buildRegistryIntegrityReport();
    expect(GEO_SEMANTIC_SCORING_RULES).toHaveLength(9);
    expect(report.geoSemanticCandidateRawTotal).toBe(43);
    expect(report.geoSemanticDeferredWeights).toEqual([]);
  });

  it("존재하지 않는 atomic check를 참조하는 rule이 없다", () => {
    expect(buildRegistryIntegrityReport().unknownAtomicCheckRefs).toEqual([]);
  });

  it("어떤 rule도 참조하지 않는 고아 atomic check가 없다", () => {
    expect(buildRegistryIntegrityReport().orphanAtomicCheckIds).toEqual([]);
  });

  it("여러 rule이 공유하는 atomic check는 AC-SEO-INDEX-INTENT 하나뿐이다", () => {
    // 공유 자체가 금지는 아니다. 다만 같은 질문으로 두 번 배점되는지 사람이 반드시
    // 확인해야 하므로 목록을 고정해 조용히 늘어나지 못하게 한다.
    const shared = buildRegistryIntegrityReport().sharedAtomicChecks;
    expect(shared.map(entry => entry.atomicCheckId)).toEqual(["AC-SEO-INDEX-INTENT"]);
    expect(shared[0].ruleIds).toEqual(["SR-SEO-NOINDEX", "SR-SEO-NOFOLLOW"]);
    expect(shared[0].totalWeightExposed).toBe(17);
  });

  it("전체 rule 수는 41개다 (SEO 18 + Advisory 6 + GEO Fact 8 + GEO Semantic 9)", () => {
    expect(SCORING_RULES).toHaveLength(41);
  });
});

describe("중복 배점 통제", () => {
  it("SEO 점수 rule과 GEO 점수 rule이 공유하는 factType이 문서 §5 목록과 일치한다", () => {
    const report = buildRegistryIntegrityReport();
    const shared = report.crossDomainFactTypes.map(entry => entry.factType);
    // 같은 Fact를 참조하는 것은 허용된다. 각 축이 "다른 질문"을 하는지가 검토 지점이며,
    // 목록이 조용히 늘어나면 이 테스트가 깨진다.
    // 실제 교집합은 2개뿐이다. author/entity/external citation은 GEO 축에서만,
    // page.type은 SEO 축에서만 배점에 쓰인다.
    // date.signal은 문서가 "축간 배점 중복 calibration 필수"로 지목한 항목이다.
    expect(shared).toEqual(["content.main_text", "date.signal"]);
  });

  it("공유 factType마다 SEO/GEO의 atomic question이 서로 다르다", () => {
    const report = buildRegistryIntegrityReport();
    for (const entry of report.crossDomainFactTypes) {
      const seoQuestions = entry.seoChecks.map(id => ATOMIC_CHECK_BY_ID.get(id)?.question);
      const geoQuestions = entry.geoChecks.map(id => ATOMIC_CHECK_BY_ID.get(id)?.question);
      for (const question of geoQuestions) {
        expect(seoQuestions, `${entry.factType} 축간 동일 질문 중복`).not.toContain(question);
      }
    }
  });
});
