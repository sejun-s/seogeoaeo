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
import type { PageTypeResult } from "../types";

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

/** UNKNOWN을 반환하되 정확한 사유를 강제한다. */
export function unknown(rationaleCode: string, factIds: string[] = [], evidenceIds: string[] = []): CheckEvalOutput {
  return { state: "UNKNOWN", rationaleCode, factIds, evidenceIds };
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
