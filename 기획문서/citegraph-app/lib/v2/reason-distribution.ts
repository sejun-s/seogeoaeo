/**
 * UNKNOWN reason 집계.
 *
 * 근거: 점수 신뢰도 개선 기획안 v2-final(기획문서/score-reliability-improvement-plan-
 * 2026-08-20-v2-final.md) §2-2, §5 P2.
 *
 * coverage 숫자 하나만으로는 "왜 낮은지"를 설명할 수 없다. 같은 UNKNOWN이라도
 * UNCALIBRATED(의도적으로 판단 안 함)와 CLASSIFICATION_UNCERTAIN(판단해야 하는데
 * Page Type이 불확실해서 못 함)은 완전히 다른 문제다. 이 파일은 DomainScore에
 * 이미 있는 atomicResults.rationaleCode에서 taxonomy prefix만 뽑아 집계한다 —
 * 새 데이터를 만들지 않는다.
 */

import { UNKNOWN_REASONS, parseUnknownReason, type DomainScore, type UnknownReason } from "./types";

export interface UnknownReasonDistribution {
  /** state === "UNKNOWN"인 atomic check 결과 총 개수. */
  total: number;
  byReason: Record<UnknownReason, number>;
  /** rationaleCode에 인식 가능한 prefix가 없는 경우. 0이어야 정상이다 —
   *  0보다 크면 taxonomy를 안 붙인 새 unknown() 호출부가 있다는 뜻이다. */
  unclassified: number;
}

function emptyDistribution(): UnknownReasonDistribution {
  const byReason = Object.fromEntries(UNKNOWN_REASONS.map(reason => [reason, 0])) as Record<UnknownReason, number>;
  return { total: 0, byReason, unclassified: 0 };
}

/** 여러 DomainScore(SEO/GEO_FACT/GEO_SEMANTIC)를 한 번에 넣어 진단 전체 분포를 낸다. */
export function computeUnknownReasonDistribution(domainScores: readonly DomainScore[]): UnknownReasonDistribution {
  const dist = emptyDistribution();
  for (const domain of domainScores) {
    for (const rule of domain.rules) {
      for (const atomic of rule.atomicResults) {
        if (atomic.state !== "UNKNOWN") continue;
        dist.total += 1;
        const reason = parseUnknownReason(atomic.rationaleCode);
        if (reason) dist.byReason[reason] += 1;
        else dist.unclassified += 1;
      }
    }
  }
  return dist;
}
