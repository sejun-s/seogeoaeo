/**
 * Atomic Check evaluator 공통 타입.
 *
 * evaluator는 N_A를 반환할 수 있다(선행 Fact가 없어 판정이 무의미한 경우,
 * 예: canonical이 없으면 canonical 유효성은 판정 대상이 아님). 이는
 * `resolveApplicability`가 다루는 "page type 기반 N_A"와는 다른, "Fact 기반
 * 동적 N_A"다. NOT_EVALUATED는 evaluator가 반환하지 않는다 — SEMANTIC engine
 * check에서만 실행기 상단에서 고정으로 부여한다.
 */

import type { FactIndex } from "../evidence/layer";
import type { PageTypeResult, UnknownReason } from "../types";

export interface CheckEvalInput {
  index: FactIndex;
  pageType: PageTypeResult;
}

export type CheckEvalState = "PASS" | "WARN" | "FAIL" | "UNKNOWN" | "N_A";

export interface CheckEvalOutput {
  state: CheckEvalState;
  rationaleCode: string;
  factIds: string[];
  evidenceIds: string[];
}

export type CheckEvaluator = (input: CheckEvalInput) => CheckEvalOutput;

/**
 * UNKNOWN을 반환하되 정확한 사유를 강제한다.
 *
 * reason은 UnknownReason taxonomy 중 하나여야 한다(점수 신뢰도 개선 기획안
 * v2-final §2-2). detail은 사람이 읽을 구체적 설명이다. rationaleCode는
 * `${reason}:${detail}` 형태로 합쳐져서 문자열 하나로도 기존 호환성을 유지하고,
 * 리포트에서는 parseUnknownReason으로 prefix만 뽑아 집계한다.
 */
export function unknown(reason: UnknownReason, detail: string, factIds: string[] = [], evidenceIds: string[] = []): CheckEvalOutput {
  return { state: "UNKNOWN", rationaleCode: `${reason}:${detail}`, factIds, evidenceIds };
}

export function na(rationaleCode: string, factIds: string[] = [], evidenceIds: string[] = []): CheckEvalOutput {
  return { state: "N_A", rationaleCode, factIds, evidenceIds };
}

export function result(
  state: Exclude<CheckEvalState, "UNKNOWN" | "N_A">,
  rationaleCode: string,
  factIds: string[],
  evidenceIds: string[],
): CheckEvalOutput {
  return { state, rationaleCode, factIds, evidenceIds };
}
