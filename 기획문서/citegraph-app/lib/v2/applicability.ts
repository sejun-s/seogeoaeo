/**
 * Page Type 기반 applicability 판정.
 *
 * 방법론 §14.6 / Registry §2:
 *   confidence >= 0.85 (AUTO_ASSIGNED)일 때만 excludedFrom/appliesTo로 N_A를
 *   확정한다. PROVISIONAL/UNKNOWN이면 적용성을 확신할 수 없는 Rule을
 *   자동으로 N_A 처리하지 않는다.
 *
 * "자동 N/A 금지"를 "그냥 적용된다고 가정하고 평가"로 구현하면 안 된다 —
 * page type이 불확실한 상태에서 억지로 FAIL을 내면 신뢰도를 더 해친다
 * (실제로 F04/F06/F07 등 PROVISIONAL 판정 fixture에서 author/date처럼
 * page-type 종속 Fact가 대량 FAIL로 오판되는 회귀가 있었다). 대신 적용성
 * 자체가 불확실하다는 사실을 UNKNOWN으로 정직하게 표시한다 — N_A처럼
 * applicableWeight에서 조용히 빠지지 않고 남아서 coverage만 낮춘다.
 */

import type { AtomicCheckDef, PageTypeResult } from "./types";

export type Applicability =
  | { status: "APPLICABLE" }
  | { status: "N_A"; reason: string }
  | { status: "UNCERTAIN"; reason: string };

export function resolveApplicability(check: AtomicCheckDef, pageType: PageTypeResult): Applicability {
  const pageTypeIndependent = check.appliesTo === "ALL" && check.excludedFrom.length === 0;
  if (pageTypeIndependent) return { status: "APPLICABLE" };

  if (pageType.assignment !== "AUTO_ASSIGNED") {
    return { status: "UNCERTAIN", reason: `page type ${pageType.assignment.toLowerCase()}(confidence ${pageType.confidence})라 적용성을 확정할 수 없음` };
  }

  const type = pageType.type;
  const inAppliesTo = check.appliesTo === "ALL" || check.appliesTo.includes(type);
  const excluded = check.excludedFrom.includes(type);
  if (excluded || !inAppliesTo) {
    return { status: "N_A", reason: check.naReason ?? `page type ${type}에는 적용되지 않음` };
  }
  return { status: "APPLICABLE" };
}
