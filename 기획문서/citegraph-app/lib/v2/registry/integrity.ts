/**
 * Registry 자체 검증.
 *
 * weight inflation과 중복 배점은 사람이 표를 눈으로 봐서 막을 수 없다.
 * 여기서 기계적으로 확인하고, 테스트가 이 결과를 검사한다.
 */

import type { FactType, ScoringRuleDef } from "../types";
import { ATOMIC_CHECKS, ATOMIC_CHECK_BY_ID } from "./atomic-checks";
import {
  GEO_FACT_SCORING_RULES,
  GEO_SEMANTIC_SCORING_RULES,
  PROVISIONAL_ENVELOPE,
  SCORING_RULES,
  SEO_ADVISORY_RULES,
  SEO_SCORING_RULES,
} from "./scoring-rules";

export interface RegistryIntegrityReport {
  atomicCheckCount: number;
  duplicateAtomicCheckIds: string[];
  unknownAtomicCheckRefs: Array<{ ruleId: string; atomicCheckId: string }>;
  orphanAtomicCheckIds: string[];
  /** 두 개 이상의 Scoring Rule이 참조하는 check. 중복 배점 후보이므로 반드시 검토 대상이다. */
  sharedAtomicChecks: Array<{ atomicCheckId: string; ruleIds: string[]; totalWeightExposed: number }>;
  seoWeightTotal: number;
  seoCategoryTotals: Record<string, number>;
  advisoryNonZeroWeights: string[];
  geoFactRawTotal: number;
  geoSemanticCandidateRawTotal: number;
  geoSemanticDeferredWeights: string[];
  /** SEO 점수 rule과 GEO 점수 rule이 함께 쓰는 factType. 같은 질문이면 중복 배점이다. */
  crossDomainFactTypes: Array<{ factType: FactType; seoChecks: string[]; geoChecks: string[] }>;
}

function sumWeights(rules: readonly ScoringRuleDef[]): number {
  return rules.reduce((total, rule) => total + rule.maxWeight, 0);
}

export function buildRegistryIntegrityReport(): RegistryIntegrityReport {
  const ids = ATOMIC_CHECKS.map(check => check.atomicCheckId);
  const seen = new Set<string>();
  const duplicateAtomicCheckIds = ids.filter(id => (seen.has(id) ? true : (seen.add(id), false)));

  const unknownAtomicCheckRefs: Array<{ ruleId: string; atomicCheckId: string }> = [];
  const referencedBy = new Map<string, string[]>();
  for (const rule of SCORING_RULES) {
    for (const atomicCheckId of rule.atomicChecks) {
      if (!ATOMIC_CHECK_BY_ID.has(atomicCheckId)) unknownAtomicCheckRefs.push({ ruleId: rule.ruleId, atomicCheckId });
      referencedBy.set(atomicCheckId, [...(referencedBy.get(atomicCheckId) ?? []), rule.ruleId]);
    }
  }

  const orphanAtomicCheckIds = ids.filter(id => !referencedBy.has(id));

  const sharedAtomicChecks = [...referencedBy.entries()]
    .filter(([, ruleIds]) => ruleIds.length > 1)
    .map(([atomicCheckId, ruleIds]) => ({
      atomicCheckId,
      ruleIds,
      totalWeightExposed: ruleIds.reduce(
        (total, ruleId) => total + (SCORING_RULES.find(rule => rule.ruleId === ruleId)?.maxWeight ?? 0),
        0,
      ),
    }));

  const seoCategoryTotals: Record<string, number> = {};
  for (const rule of SEO_SCORING_RULES) {
    seoCategoryTotals[rule.category] = (seoCategoryTotals[rule.category] ?? 0) + rule.maxWeight;
  }

  const seoScoredCheckIds = new Set(SEO_SCORING_RULES.flatMap(rule => rule.atomicChecks));
  const geoScoredCheckIds = new Set(GEO_FACT_SCORING_RULES.flatMap(rule => rule.atomicChecks));
  const factUsage = new Map<FactType, { seo: Set<string>; geo: Set<string> }>();
  for (const check of ATOMIC_CHECKS) {
    const inSeo = seoScoredCheckIds.has(check.atomicCheckId);
    const inGeo = geoScoredCheckIds.has(check.atomicCheckId);
    if (!inSeo && !inGeo) continue;
    for (const factType of check.factDependencies) {
      const entry = factUsage.get(factType) ?? { seo: new Set<string>(), geo: new Set<string>() };
      if (inSeo) entry.seo.add(check.atomicCheckId);
      if (inGeo) entry.geo.add(check.atomicCheckId);
      factUsage.set(factType, entry);
    }
  }

  const crossDomainFactTypes = [...factUsage.entries()]
    .filter(([, entry]) => entry.seo.size > 0 && entry.geo.size > 0)
    .map(([factType, entry]) => ({ factType, seoChecks: [...entry.seo].sort(), geoChecks: [...entry.geo].sort() }))
    .sort((a, b) => a.factType.localeCompare(b.factType));

  return {
    atomicCheckCount: ids.length,
    duplicateAtomicCheckIds,
    unknownAtomicCheckRefs,
    orphanAtomicCheckIds,
    sharedAtomicChecks,
    seoWeightTotal: sumWeights(SEO_SCORING_RULES),
    seoCategoryTotals,
    advisoryNonZeroWeights: SEO_ADVISORY_RULES.filter(rule => rule.maxWeight !== 0).map(rule => rule.ruleId),
    geoFactRawTotal: sumWeights(GEO_FACT_SCORING_RULES),
    geoSemanticCandidateRawTotal: sumWeights(GEO_SEMANTIC_SCORING_RULES.filter(rule => rule.status === "CANDIDATE")),
    geoSemanticDeferredWeights: GEO_SEMANTIC_SCORING_RULES.filter(
      rule => rule.status === "DEFERRED_V2_1" && rule.maxWeight !== 0,
    ).map(rule => rule.ruleId),
    crossDomainFactTypes,
  };
}

export { PROVISIONAL_ENVELOPE };
