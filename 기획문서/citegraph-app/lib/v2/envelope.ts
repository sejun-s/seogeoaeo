/**
 * CiteGraph SaaS Master Plan (§4, §5, §12)
 * Core Result Envelope & Confidence 계약.
 *
 * 근거: 기획문서/citegraph-saas-master-plan-2026-08-20.md §5(v1.1, Claude PO 수정)
 *
 * v1.0 → v1.1 변경 이유(Claude 검토):
 * v1.0의 `calculateConfidence`는 Method Reliability × Input Coverage ×
 * Evidence Agreement × Sample Adequacy × Freshness를 곱해 confidence 값
 * 하나를 만들었다. 이 다섯 계수 중 Method Reliability(deterministic=1.0,
 * semi=0.85, llm=0.75, observation=0.9)는 이 저장소 어디에도 근거가 없는
 * 임의 상수였다 — `citegraph-weight-calibration-plan.md`에도 없다. 이건
 * 마스터 플랜 §8이 스스로 금지한 "재현 불가능한 가중치"를 정확히 재현한
 * 것이었고, 세션 초반 리버트된 v3 R_SEM/OCI(검증 안 된 heuristic을 하나의
 * 지수로 합성)와 같은 패턴이다.
 *
 * v1.1은 곱셈 공식을 버리고, 이 코드베이스가 이미 쓰고 있는 방식을 그대로
 * 따른다 — `page-type.ts`의 PageTypeAssignment(AUTO_ASSIGNED/PROVISIONAL/
 * UNKNOWN)와 `types.ts`의 CheckState처럼, **관측 가능한 값에 대한 명시적
 * 규칙**으로 band를 정한다. "여러 개의 추정 계수를 곱해서 정밀해 보이는
 * 숫자 하나를 만드는 것"과 "관측된 값(표본 크기, coverage, 측정 방식,
 * 최신성) 각각에 대해 개별적으로 설명 가능한 규칙을 적용해 등급을 매기는
 * 것"은 다르다 — 후자만 이 프로젝트의 계약을 지킨다.
 */

export type MeasurementType =
  | "deterministic"
  | "semi_deterministic"
  | "llm"
  | "external_observation";

export type ConfidenceBand = "high" | "medium" | "low" | "insufficient";

export type Lifecycle = "readiness" | "performance";

export interface ConfidenceMetadata {
  /** band의 대표값(정렬·표시용 근사치일 뿐 — 계산식으로 도출한 정밀값이 아니다). */
  value: number;
  band: ConfidenceBand;
  reasons: string[];
}

export interface ResultProvenance {
  inputHash: string;
  ruleId?: string;
  ruleVersion?: string;
  methodKey: string;
  methodVersion: string;
  executedAt: string;
  evidenceRefs: string[];
}

/**
 * 모든 점수와 관측 지표의 표준 래퍼 (Master Plan §4.3 & §5.3)
 */
export interface ResultEnvelope<T = number | null> {
  id: string;
  metricKey: string;
  lifecycle: Lifecycle;
  measurementType: MeasurementType;
  value: T;
  unit: "score" | "probability" | "ratio" | "count";
  coverage: number; // 0.0 ~ 1.0
  confidence: ConfidenceMetadata;
  sampleSize?: number;
  observedFrom?: string;
  observedTo?: string;
  scoreVersion?: string | null;
  provenance: ResultProvenance;
  limitations: string[];
}

/** band 대표값. 정밀 계산값이 아니라 정렬·시각화 편의를 위한 근사치임을 항상 이 상수와 함께 문서화한다. */
const BAND_REPRESENTATIVE_VALUE: Readonly<Record<ConfidenceBand, number>> = {
  high: 0.9,
  medium: 0.65,
  low: 0.35,
  insufficient: 0.1,
};

/**
 * 측정 방식별 "도달 가능한 최고 band"(ceiling).
 *
 * deterministic/semi_deterministic은 근거가 code로 재현 가능하므로 high까지
 * 갈 수 있다. llm은 rubric·temperature=0으로 고정해도 agreement 데이터가
 * 없는 한 medium을 넘지 않는다(마스터 플랜 §5.1 "Medium"과 일치, 임의로
 * 올리지 않는다). external_observation은 표본 크기에 전적으로 의존하므로
 * ceiling 없이 아래 규칙으로만 결정한다.
 */
const METHOD_CEILING: Readonly<Record<MeasurementType, ConfidenceBand | null>> = {
  deterministic: "high",
  semi_deterministic: "high",
  llm: "medium",
  external_observation: null, // 표본 규칙이 전적으로 결정한다
};

function downgrade(band: ConfidenceBand): ConfidenceBand {
  if (band === "high") return "medium";
  if (band === "medium") return "low";
  return "insufficient";
}

function bandRank(band: ConfidenceBand): number {
  return { high: 3, medium: 2, low: 1, insufficient: 0 }[band];
}

/**
 * Confidence band 결정 (Master Plan §5.2, v1.1).
 *
 * 여러 계수를 곱하지 않는다. 대신:
 * 1. 표본 크기·coverage가 하한 미만이면 무조건 insufficient(다른 조건과
 *    무관하게 강등 — "정직한 데이터 부족" 표시가 최우선이라는 뜻).
 * 2. 측정 방식이 ceiling을 정한다(§ METHOD_CEILING).
 * 3. coverage·표본·최신성이 기준에 못 미치면 ceiling에서 한 단계씩만
 *    낮춘다(곱하지 않는다 — 여러 결함이 있어도 한 단계 이상 동시에 낮추지
 *    않는 게 이유를 하나씩 설명 가능하게 유지하는 방법이다).
 */
export function determineConfidenceBand(params: {
  measurementType: MeasurementType;
  inputCoverage: number; // 0.0 ~ 1.0
  sampleSize?: number;
  /** 관측 시점으로부터 경과 일수. 없으면 최신성 판단을 건너뛴다(deterministic 등 최신성 무관 측정에 해당). */
  staleDays?: number;
  reasons?: string[];
}): ConfidenceMetadata {
  const reasons = params.reasons ? [...params.reasons] : [];

  // 1. 하한 미달 → 무조건 insufficient
  if (params.inputCoverage < 0.2) {
    reasons.push("입력 데이터 커버리지가 20% 미만");
    return { value: BAND_REPRESENTATIVE_VALUE.insufficient, band: "insufficient", reasons };
  }
  if (params.measurementType === "external_observation" && (params.sampleSize ?? 0) < 5) {
    reasons.push("관측 표본 크기가 5 미만 (external_observation)");
    return { value: BAND_REPRESENTATIVE_VALUE.insufficient, band: "insufficient", reasons };
  }

  // 2. 측정 방식이 ceiling을 정한다. external_observation은 표본 크기로만 시작 band를 정한다.
  let band: ConfidenceBand;
  const ceiling = METHOD_CEILING[params.measurementType];
  if (ceiling) {
    band = ceiling;
  } else {
    const n = params.sampleSize ?? 0;
    band = n >= 20 ? "high" : n >= 10 ? "medium" : "low";
    reasons.push(`관측 표본 크기 n=${n} 기준으로 시작 band 결정`);
  }

  // 3. coverage 부족 → 한 단계 강등
  if (params.inputCoverage < 0.5) {
    band = downgrade(band);
    reasons.push("입력 데이터 커버리지 50% 미만");
  }

  // 4. 표본 부족(20 미만) → 한 단계 강등. external_observation은 이미 위에서 표본으로
  //    시작 band를 정했으므로 이중 적용하지 않는다.
  if (ceiling && (params.sampleSize ?? Infinity) < 20 && params.sampleSize !== undefined) {
    band = downgrade(band);
    reasons.push("관측 표본 크기 부족 (n < 20)");
  }

  // 5. 최신성 부족(90일 초과) → 한 단계 강등
  if (params.staleDays !== undefined && params.staleDays > 90) {
    band = downgrade(band);
    reasons.push(`관측 후 ${params.staleDays}일 경과 (Stale)`);
  }

  // ceiling보다 높아지지 않도록 최종 clamp(강등만 하는 로직이라 이론상 불필요하지만 방어적으로 유지)
  if (ceiling && bandRank(band) > bandRank(ceiling)) band = ceiling;

  return { value: BAND_REPRESENTATIVE_VALUE[band], band, reasons };
}

/**
 * @deprecated v1.0의 곱셈 공식. 근거 없는 Method Reliability 상수에 의존해
 * 마스터 플랜 §8 No-Go 조건("재현 불가능한 가중치")을 스스로 어겼다.
 * 새 코드에서는 `determineConfidenceBand`를 쓴다. 이 함수는 과거 커밋과의
 * 히스토리 추적을 위해서만 남겨둔다 — 호출하면 예외를 던진다.
 */
export function calculateConfidence(): never {
  throw new Error(
    "calculateConfidence()는 v1.1에서 제거됐다. determineConfidenceBand()를 사용하세요. " +
      "(사유: 기획문서/citegraph-saas-master-plan-2026-08-20.md §5 v1.1 변경 이력 참고)",
  );
}

/**
 * Opportunity & Gap Data Models (Master Plan §6, §7, §12)
 */
export type GapType =
  | "citation_gap"
  | "recommendation_gap"
  | "unsupported_claim"
  | "entity_conflict";

export interface CompetitorReasonFactor {
  factor: string; // 예: "Customer Evidence", "Dedicated Page", "Original Data"
  ourStatus: "PASS" | "WARN" | "FAIL" | "N_A";
  competitorStatus: "PASS" | "WARN" | "FAIL" | "N_A";
  description: string;
  evidenceRef?: string;
}

export interface OpportunityAction {
  actionId: string;
  title: string;
  ownerRole: "Content Marketing" | "SEO Engineering" | "Product Marketing" | "PR/Brand";
  priorityType: "opportunity" | "compliance";
  priorityScore: number; // 0 ~ 100
  severity: "low" | "medium" | "high" | "critical";
  impact: number; // 1 ~ 5
  effort: number; // 1 ~ 5
  businessRelevance: number; // 1 ~ 5
  confidence: number;
  acceptanceCriteria: string[];
  validationPlan: string;
}

export interface OpportunityItem {
  id: string;
  promptCluster: {
    id: string;
    canonicalPrompt: string;
    variants: string[];
    intentStage: "commercial_recommendation" | "comparison" | "informational" | "navigational";
    businessWeight: number; // 1.0 ~ 5.0
  };
  gapType: GapType;
  observationSummary: {
    platform: string;
    sampleSize: number;
    ourMentionProbability: number;
    ourRecommendationProbability: number;
    competitorRecommendationProbability: number;
    confidence: ConfidenceMetadata;
  };
  competitorReasons: CompetitorReasonFactor[];
  action: OpportunityAction;
}
