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
  it("60개이며 ID 중복이 없다 (AC-GF-DATE 제거)", () => {
    // date.signal 사고형 중복 정리에 따라 AC-GF-DATE가 제거되고
    // SR-GF-AUTHOR-DATE가 AC-SEO-DATE-PRESENT를 재사용하므로 60개다.
    expect(ATOMIC_CHECKS).toHaveLength(60);
    expect(ATOMIC_CHECK_BY_ID.size).toBe(60);
  });

  it("SEO 34 / GEO_FACT 11 / GEO_SEMANTIC 15로 구성된다", () => {
    // AC-GF-DATE 제거로 AC-GF- prefix는 12개에서 11개로 감소.
    const count = (prefix: string) => ATOMIC_CHECKS.filter(check => check.atomicCheckId.startsWith(prefix)).length;
    expect(count("AC-SEO-")).toBe(34);
    expect(count("AC-GF-")).toBe(11);
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

  it("여러 rule이 공유하는 atomic check는 AC-SEO-INDEX-INTENT와 AC-SEO-DATE-PRESENT 2개다", () => {
    // 공유 자체가 금지는 아니다. 다만 같은 질문으로 두 번 배점되는지 사람이 반드시
    // 확인해야 하므로 목록을 고정해 조용히 늘어나지 못하게 한다.
    // AC-SEO-DATE-PRESENT는 SR-SEO-DATE(3)와 SR-GF-AUTHOR-DATE(5)가 공유한다 (합 8pt).
    const shared = buildRegistryIntegrityReport().sharedAtomicChecks;
    expect(shared.map(entry => entry.atomicCheckId).sort()).toEqual(["AC-SEO-DATE-PRESENT", "AC-SEO-INDEX-INTENT"]);
    
    const indexIntent = shared.find(s => s.atomicCheckId === "AC-SEO-INDEX-INTENT")!;
    expect(indexIntent.ruleIds).toEqual(["SR-SEO-NOINDEX", "SR-SEO-NOFOLLOW"]);
    expect(indexIntent.totalWeightExposed).toBe(17);

    const datePresent = shared.find(s => s.atomicCheckId === "AC-SEO-DATE-PRESENT")!;
    expect(datePresent.ruleIds).toEqual(["SR-SEO-DATE", "SR-GF-AUTHOR-DATE"]);
    expect(datePresent.totalWeightExposed).toBe(8);
  });

  it("전체 rule 수는 41개다 (SEO 18 + Advisory 6 + GEO Fact 8 + GEO Semantic 9)", () => {
    expect(SCORING_RULES).toHaveLength(41);
  });
});

describe("중복 배점 통제", () => {
  it("SEO 점수 rule과 GEO 점수 rule이 공유하는 factType이 문서 §5 목록과 일치한다", () => {
    const report = buildRegistryIntegrityReport();
    const shared = report.crossDomainFactTypes.map(entry => entry.factType);
    // content.main_text(다각도 사용)와 date.signal(단일 check 공유) 2개다.
    expect(shared).toEqual(["content.main_text", "date.signal"]);
  });

  it("공유 factType에서 별도 check를 쓸 때는 question이 다르고, 같은 질문이면 동일 check를 공유한다", () => {
    const report = buildRegistryIntegrityReport();
    for (const entry of report.crossDomainFactTypes) {
      // SEO와 GEO가 서로 다른 check ID를 쓰는 경우에만 question 차이를 검증한다 (사고형 중복 방지).
      // 동일 check ID를 공유하는 경우(date.signal)는 sharedAtomicChecks 계약으로 통제된다.
      const differentCheckPairs = entry.seoChecks.flatMap(sId =>
        entry.geoChecks.filter(gId => gId !== sId).map(gId => ({ sId, gId })),
      );
      for (const { sId, gId } of differentCheckPairs) {
        const sQ = ATOMIC_CHECK_BY_ID.get(sId)?.question;
        const gQ = ATOMIC_CHECK_BY_ID.get(gId)?.question;
        expect(sQ, `${entry.factType} 서로 다른 check(${sId} vs ${gId})의 질문 중복`).not.toBe(gQ);
      }
    }
  });
});
