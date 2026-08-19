/**
 * Scoring v2 진입점.
 *
 * v1(`lib/audit.ts`, rulesetVersion 2026.08.1)을 대체하지 않는다. import 하지도 않는다.
 * 두 엔진은 별도 함수로 호출되고 결과 타입도 겹치지 않는다.
 *
 * Phase A: snapshot → Evidence/Fact → Page Type.
 * Phase B(이 파일): Atomic Check 실행 → Scoring Rule 조합 → SEO/GEO Fact
 * DomainScore. GEO Semantic은 엔진이 없어 전부 NOT_EVALUATED이고, 그래서
 * GEO Overall은 산출하지 않는다(방법론 §14.3).
 */

import { runAllAtomicChecks } from "./checks";
import { classifyPageType } from "./page-type";
import { extractEvidence } from "./evidence/extract";
import type { PageSnapshot } from "./snapshot";
import { ATOMIC_CHECKS } from "./registry/atomic-checks";
import {
  GEO_FACT_SCORING_RULES,
  GEO_SEMANTIC_SCORING_RULES,
  SCORING_RULES,
  SEO_ADVISORY_RULES,
  SEO_SCORING_RULES,
} from "./registry/scoring-rules";
import { computeDomainScore, computeRuleResult } from "./scoring";
import { METHODOLOGY_VERSION, REGISTRY_VERSION, EXTRACTOR_VERSION } from "./types";
import type { AtomicCheckResult, DomainScore, EvidenceRecord, FactRecord, PageTypeResult, RuleResultV2 } from "./types";

export interface AnalysisV2 {
  methodologyVersion: string;
  registryVersion: string;
  extractorVersion: string;
  snapshotId: string;
  contentHash: string;
  finalUrl: string;
  pageType: PageTypeResult;
  facts: readonly FactRecord[];
  evidence: readonly EvidenceRecord[];
  registry: {
    atomicCheckCount: number;
    scoringRuleCount: number;
  };
  atomicResults: Map<string, AtomicCheckResult>;
  seo: DomainScore;
  seoAdvisory: RuleResultV2[];
  geoFact: DomainScore;
  geoSemantic: DomainScore;
  /**
   * GEO Overall(Fact+Semantic 결합)은 v2에서 산출하지 않는다. Semantic Engine이
   * 없어 결합 공식(40/60 provisional envelope)을 실제 값에 적용할 근거가 없다
   * (weight-calibration-plan.md §9: "calibration 전에는 두 readiness를 결합해
   * 단일 공식 점수라고 표현하지 않는다").
   */
  geoOverall: { state: "NOT_EVALUATED"; reason: string };
}

export function analyzeSnapshotV2(snapshot: PageSnapshot): AnalysisV2 {
  const { index } = extractEvidence(snapshot);
  const pageType = classifyPageType(index);
  const atomicResults = runAllAtomicChecks(index, pageType);

  const seoRules = SEO_SCORING_RULES.map(def => computeRuleResult(def, atomicResults, pageType));
  const seoAdvisory = SEO_ADVISORY_RULES.map(def => computeRuleResult(def, atomicResults, pageType));
  const geoFactRules = GEO_FACT_SCORING_RULES.map(def => computeRuleResult(def, atomicResults, pageType));
  const geoSemanticRules = GEO_SEMANTIC_SCORING_RULES.map(def => computeRuleResult(def, atomicResults, pageType));

  return {
    methodologyVersion: METHODOLOGY_VERSION,
    registryVersion: REGISTRY_VERSION,
    extractorVersion: EXTRACTOR_VERSION,
    snapshotId: snapshot.snapshotId,
    contentHash: snapshot.contentHash,
    finalUrl: snapshot.finalUrl,
    pageType,
    facts: index.facts,
    evidence: index.evidence,
    registry: {
      atomicCheckCount: ATOMIC_CHECKS.length,
      scoringRuleCount: SCORING_RULES.length,
    },
    atomicResults,
    seo: computeDomainScore("SEO", seoRules),
    seoAdvisory,
    geoFact: computeDomainScore("GEO_FACT", geoFactRules),
    geoSemantic: computeDomainScore("GEO_SEMANTIC", geoSemanticRules),
    geoOverall: { state: "NOT_EVALUATED", reason: "semantic-engine-not-implemented" },
  };
}

export { createSnapshot } from "./snapshot";
export type { PageSnapshot } from "./snapshot";
export * from "./types";
export { buildRegistryIntegrityReport } from "./registry/integrity";
