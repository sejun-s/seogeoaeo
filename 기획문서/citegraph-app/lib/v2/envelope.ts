/**
 * CiteGraph SaaS Master Plan v1.0 (§4, §5, §12)
 * Core Result Envelope & Opportunity Measurement Types
 * 
 * 원칙: 관측되지 않은 성과를 추정 점수로 포장하지 않으며,
 * 모든 측정값은 측정 유형(Measurement Type), 출처(Provenance),
 * 신뢰도(Confidence), 버전(Version)을 필수 첨부한다.
 */

export type MeasurementType =
  | "deterministic"
  | "semi_deterministic"
  | "llm"
  | "external_observation";

export type ConfidenceBand = "high" | "medium" | "low" | "insufficient";

export type Lifecycle = "readiness" | "performance";

export interface ConfidenceMetadata {
  value: number; // 0.0 ~ 1.0
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

/**
 * 신뢰도(Confidence) 수학적 산출 공식 (Master Plan §5.2)
 * Confidence = Method Reliability × Input Coverage × Evidence Agreement × Sample Adequacy × Freshness
 */
export function calculateConfidence(params: {
  methodReliability: number; // deterministic: 1.0, semi: 0.85, llm: 0.75, observation: 0.9
  inputCoverage: number; // 0.0 ~ 1.0
  evidenceAgreement: number; // 0.0 ~ 1.0 (상충 근거 없을 때 1.0)
  sampleAdequacy: number; // n >= 20이면 1.0, n < 5이면 0.3 등
  freshness: number; // 최신이면 1.0, stale이면 감점
  reasons?: string[];
}): ConfidenceMetadata {
  const value = Math.max(
    0,
    Math.min(
      1.0,
      params.methodReliability *
        params.inputCoverage *
        params.evidenceAgreement *
        params.sampleAdequacy *
        params.freshness,
    ),
  );

  let band: ConfidenceBand = "insufficient";
  if (params.sampleAdequacy < 0.25 || params.inputCoverage < 0.2) {
    band = "insufficient";
  } else if (value >= 0.8) {
    band = "high";
  } else if (value >= 0.6) {
    band = "medium";
  } else {
    band = "low";
  }

  const reasons = params.reasons ? [...params.reasons] : [];
  if (params.inputCoverage < 0.5) reasons.push("입력 데이터 커버리지 부족");
  if (params.sampleAdequacy < 0.5) reasons.push("관측 표본 크기 부족 (n < 20)");
  if (params.freshness < 0.8) reasons.push("오래된 관측 데이터 (Stale)");

  return {
    value: Math.round(value * 1000) / 1000,
    band,
    reasons,
  };
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
