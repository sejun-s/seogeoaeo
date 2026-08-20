/**
 * Atomic Check 실행기.
 *
 * 순서: SEMANTIC engine check는 항상 NOT_EVALUATED(엔진 미구현) →
 * page-type 기반 applicability(N_A) → evaluator 실행(PASS/WARN/FAIL/UNKNOWN/N_A).
 *
 * LLM 없이 semantic quality를 heuristic PASS로 대체하지 않는다는 계약을
 * 이 실행기가 구조적으로 강제한다: SEMANTIC engineType은 evaluator 유무와
 * 무관하게 무조건 NOT_EVALUATED를 반환한다.
 */

import { resolveApplicability } from "../applicability";
import type { FactIndex } from "../evidence/layer";
import { ATOMIC_CHECK_BY_ID } from "../registry/atomic-checks";
import type { AtomicCheckResult, PageTypeResult } from "../types";
import { GEO_FACT_CHECK_EVALUATORS } from "./geo-fact";
import { SEO_CHECK_EVALUATORS } from "./seo";
import type { CheckEvaluator } from "./types";

const EVALUATORS: Record<string, CheckEvaluator> = { ...SEO_CHECK_EVALUATORS, ...GEO_FACT_CHECK_EVALUATORS };

export function runAtomicCheck(atomicCheckId: string, index: FactIndex, pageType: PageTypeResult): AtomicCheckResult {
  const def = ATOMIC_CHECK_BY_ID.get(atomicCheckId);
  if (!def) {
    return {
      atomicCheckId,
      state: "UNKNOWN",
      rationaleCode: "UNSUPPORTED:unknown-atomic-check-id",
      factIds: [],
      evidenceIds: [],
      engineType: "FACT",
      methodologyVersion: "unknown",
    };
  }

  if (def.engineType === "SEMANTIC") {
    return {
      atomicCheckId,
      state: "NOT_EVALUATED",
      rationaleCode: "semantic-engine-not-implemented",
      factIds: [],
      evidenceIds: [],
      engineType: def.engineType,
      methodologyVersion: def.methodologyVersion,
    };
  }

  const applicability = resolveApplicability(def, pageType);
  if (applicability.status === "N_A") {
    return {
      atomicCheckId,
      state: "N_A",
      rationaleCode: applicability.reason,
      factIds: [],
      evidenceIds: pageType.evidenceIds,
      engineType: def.engineType,
      methodologyVersion: def.methodologyVersion,
    };
  }
  if (applicability.status === "UNCERTAIN") {
    return {
      atomicCheckId,
      state: "UNKNOWN",
      rationaleCode: `CLASSIFICATION_UNCERTAIN:${applicability.reason}`,
      factIds: [],
      evidenceIds: pageType.evidenceIds,
      engineType: def.engineType,
      methodologyVersion: def.methodologyVersion,
    };
  }

  const evaluator = EVALUATORS[atomicCheckId];
  if (!evaluator) {
    return {
      atomicCheckId,
      state: "UNKNOWN",
      rationaleCode: "UNSUPPORTED:evaluator-not-implemented",
      factIds: [],
      evidenceIds: [],
      engineType: def.engineType,
      methodologyVersion: def.methodologyVersion,
    };
  }

  const output = evaluator({ index, pageType });
  return {
    atomicCheckId,
    state: output.state,
    rationaleCode: output.rationaleCode,
    factIds: output.factIds,
    evidenceIds: output.evidenceIds,
    engineType: def.engineType,
    methodologyVersion: def.methodologyVersion,
  };
}

export function runAllAtomicChecks(index: FactIndex, pageType: PageTypeResult): Map<string, AtomicCheckResult> {
  const out = new Map<string, AtomicCheckResult>();
  for (const id of ATOMIC_CHECK_BY_ID.keys()) out.set(id, runAtomicCheck(id, index, pageType));
  return out;
}
