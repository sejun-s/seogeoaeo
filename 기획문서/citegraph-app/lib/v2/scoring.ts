/**
 * Scoring v2 계산기.
 *
 * 원칙 (방법론 §14, Registry §4.3~4.4):
 * - measured 분모 기준 점수 = earnedWeight / measuredWeight × 100.
 *   applicableWeight(=measured+UNKNOWN/NOT_EVALUATED)로 나누지 않는다 —
 *   측정하지 못한 항목을 실패로도 성공으로도 조용히 취급하지 않기 위해서다.
 * - coverage = measuredWeight / applicableWeight. 따로 표시해서 "얼마나
 *   확인했는지"와 "확인한 것이 얼마나 좋은지"를 분리한다.
 * - N_A만 applicableWeight에서 제외한다. UNKNOWN/NOT_EVALUATED는
 *   applicableWeight에는 남고 measuredWeight에서만 빠진다(coverage 하락).
 * - GEO Semantic은 v2에서 항상 NOT_EVALUATED이므로 GEO Overall은 산출하지 않는다.
 */

import type { AtomicCheckResult, CheckState, Coverage, DomainScore, PageTypeResult, RuleResultV2, ScoringRuleDef } from "./types";
import { MEASURED_STATES, STATE_FACTOR } from "./types";

type Combiner = (parts: AtomicCheckResult[], pageType: PageTypeResult) => CheckState;

function combineGeneric(parts: AtomicCheckResult[]): CheckState {
  if (parts.length === 0) return "UNKNOWN";
  if (parts.every(p => p.state === "N_A")) return "N_A";
  if (parts.every(p => p.state === "NOT_EVALUATED")) return "NOT_EVALUATED";
  const relevant = parts.filter(p => p.state !== "N_A" && p.state !== "NOT_EVALUATED");
  if (relevant.length === 0) return "UNKNOWN";
  if (relevant.some(p => p.state === "FAIL")) return "FAIL";
  if (relevant.some(p => p.state === "UNKNOWN")) return "UNKNOWN";
  if (relevant.some(p => p.state === "WARN")) return "WARN";
  return "PASS";
}

/**
 * indexing/follow intent gate: AC-SEO-INDEX-INTENT는 정보성 판정(항상 PASS/
 * UNKNOWN)이라 일반 combiner에 섞으면 결과를 오염시킨다. FACT check(노출 여부)와
 * intent를 직접 비교해서 별도로 판정한다.
 */
function intentGate(factCheckId: string): Combiner {
  return (parts, pageType) => {
    const factResult = parts.find(p => p.atomicCheckId === factCheckId);
    if (!factResult) return "UNKNOWN";
    if (pageType.type === "UNKNOWN") return "UNKNOWN";
    const blocked = factResult.state === "FAIL"; // FAIL = noindex/nofollow present
    const intent = pageType.type === "UTILITY_AUTH" ? "NOT_INDEX_TARGET" : "PUBLIC_INDEX_TARGET";
    const matches = (intent === "PUBLIC_INDEX_TARGET" && !blocked) || (intent === "NOT_INDEX_TARGET" && blocked);
    if (matches) return "PASS";
    // page type이 PROVISIONAL이면 불일치를 확정 FAIL로 보지 않는다(방법론 §14.6과
    // 같은 원칙: 불확실한 근거로 확정적 판정을 내리지 않는다).
    return pageType.assignment === "AUTO_ASSIGNED" ? "FAIL" : "WARN";
  };
}

/** DATE-APPLICABLE은 정보성 판정이라 무시하고 DATE-PRESENT 결과를 그대로 쓴다. */
const datePassthrough: Combiner = parts => {
  const presentResult = parts.find(p => p.atomicCheckId === "AC-SEO-DATE-PRESENT");
  return presentResult?.state ?? "UNKNOWN";
};

const CUSTOM_COMBINERS: Record<string, Combiner> = {
  "SR-SEO-NOINDEX": intentGate("AC-SEO-NOINDEX"),
  "SR-SEO-NOFOLLOW": intentGate("AC-SEO-NOFOLLOW"),
  "SR-SEO-DATE": datePassthrough,
};

export function computeRuleResult(
  ruleDef: ScoringRuleDef,
  atomicResults: Map<string, AtomicCheckResult>,
  pageType: PageTypeResult,
): RuleResultV2 {
  const parts = ruleDef.atomicChecks
    .map(id => atomicResults.get(id))
    .filter((x): x is AtomicCheckResult => x !== undefined);

  const combiner = CUSTOM_COMBINERS[ruleDef.ruleId] ?? combineGeneric;
  const state = combiner(parts, pageType);

  const factIds = [...new Set(parts.flatMap(p => p.factIds))];
  const evidenceIds = [...new Set(parts.flatMap(p => p.evidenceIds))];
  const measured = (MEASURED_STATES as readonly CheckState[]).includes(state);
  const awardedWeight = measured ? Math.round(ruleDef.maxWeight * STATE_FACTOR[state] * 100) / 100 : null;

  return {
    ruleId: ruleDef.ruleId,
    methodologyVersion: ruleDef.methodologyVersion,
    scoreDomain: ruleDef.scoreDomain,
    category: ruleDef.category,
    engineType: ruleDef.engineType,
    result: state,
    awardedWeight,
    maxWeight: ruleDef.maxWeight,
    atomicResults: parts,
    factIds,
    evidenceIds,
    rationaleCode: parts.map(p => `${p.atomicCheckId}:${p.rationaleCode}`).join("; "),
    recommendation: ruleDef.recommendation,
  };
}

const EMPTY_COUNTS = (): Record<CheckState, number> => ({
  PASS: 0, WARN: 0, FAIL: 0, N_A: 0, UNKNOWN: 0, NOT_EVALUATED: 0,
});

export function computeDomainScore(domain: DomainScore["domain"], rules: RuleResultV2[]): DomainScore {
  const counts = EMPTY_COUNTS();
  let applicableWeight = 0;
  let measuredWeight = 0;
  let earnedWeight = 0;
  const categoryTotals = new Map<string, { earnedWeight: number; applicableWeight: number; measuredWeight: number }>();

  for (const rule of rules) {
    counts[rule.result] += 1;
    const cat = categoryTotals.get(rule.category) ?? { earnedWeight: 0, applicableWeight: 0, measuredWeight: 0 };
    if (rule.result !== "N_A") {
      applicableWeight += rule.maxWeight;
      cat.applicableWeight += rule.maxWeight;
      if (rule.result !== "UNKNOWN" && rule.result !== "NOT_EVALUATED") {
        measuredWeight += rule.maxWeight;
        cat.measuredWeight += rule.maxWeight;
        earnedWeight += rule.awardedWeight ?? 0;
        cat.earnedWeight += rule.awardedWeight ?? 0;
      }
    }
    categoryTotals.set(rule.category, cat);
  }

  const coverage: Coverage = {
    applicableWeight,
    measuredWeight,
    earnedWeight: Math.round(earnedWeight * 100) / 100,
    coverage: applicableWeight > 0 ? Math.round((measuredWeight / applicableWeight) * 1000) / 1000 : null,
    counts,
  };

  const allNotEvaluated = rules.length > 0 && rules.every(rule => rule.result === "NOT_EVALUATED" || rule.result === "N_A") &&
    rules.some(rule => rule.result === "NOT_EVALUATED");

  return {
    domain,
    score: measuredWeight > 0 ? Math.round((earnedWeight / measuredWeight) * 100) : null,
    state: measuredWeight > 0 ? "SCORED" : allNotEvaluated ? "NOT_EVALUATED" : "UNKNOWN",
    coverage,
    categories: [...categoryTotals.entries()].map(([name, totals]) => ({ name, ...totals })),
    rules,
  };
}
