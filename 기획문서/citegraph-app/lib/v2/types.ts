/**
 * Scoring v2 domain types.
 *
 * 기준: 기획문서/citegraph-scoring-methodology-v1.md §2, §14
 *       기획문서/citegraph-rule-registry-draft.md §1~§4
 *       기획문서/citegraph-evidence-schema-draft.md §2~§4
 *
 * v1(`lib/audit.ts`, rulesetVersion 2026.08.1)과 공유하는 타입은 없다.
 * 두 엔진은 결과 타입까지 완전히 분리된다.
 */

export const METHODOLOGY_VERSION = "methodology-v2-dev";
export const EXTRACTOR_VERSION = "extractor-v2.0.0";
export const REGISTRY_VERSION = "registry-v2-draft.2";

/** 방법론 §2 공통 상태 계약. v1의 3-상태를 확장한다. */
export type CheckState = "PASS" | "WARN" | "FAIL" | "N_A" | "UNKNOWN" | "NOT_EVALUATED";

/** 점수에 산입되는 상태만 true. N_A/UNKNOWN/NOT_EVALUATED는 measured 분모에서 빠진다. */
export const MEASURED_STATES: readonly CheckState[] = ["PASS", "WARN", "FAIL"];

/** PASS 100%, WARN 50%, FAIL 0%. Rule별 예외를 두지 않는다(방법론 §2). */
export const STATE_FACTOR: Readonly<Record<CheckState, number>> = {
  PASS: 1,
  WARN: 0.5,
  FAIL: 0,
  N_A: 0,
  UNKNOWN: 0,
  NOT_EVALUATED: 0,
};

export type ScoreDomain = "SEO" | "SEO_ADVISORY" | "GEO_FACT" | "GEO_SEMANTIC";

export type EngineType = "FACT" | "VALIDATOR" | "HYBRID" | "SEMANTIC";

export type EvidenceGrade = "A" | "B" | "C" | "D";

export type WeightConfidence = "Experimental" | "Low" | "Medium" | "High";

export type PageType =
  | "HOMEPAGE"
  | "ARTICLE_BLOG"
  | "PRODUCT"
  | "SERVICE"
  | "CATEGORY_LISTING"
  | "DOCUMENTATION"
  | "LANDING_PAGE"
  | "CONTACT_ABOUT"
  | "UTILITY_AUTH"
  | "UNKNOWN";

export const ALL_PAGE_TYPES: readonly PageType[] = [
  "HOMEPAGE",
  "ARTICLE_BLOG",
  "PRODUCT",
  "SERVICE",
  "CATEGORY_LISTING",
  "DOCUMENTATION",
  "LANDING_PAGE",
  "CONTACT_ABOUT",
  "UTILITY_AUTH",
  "UNKNOWN",
];

/** Registry §2 page type confidence 계약. */
export type PageTypeAssignment = "AUTO_ASSIGNED" | "PROVISIONAL" | "UNKNOWN";

export interface PageTypeResult {
  type: PageType;
  confidence: number;
  assignment: PageTypeAssignment;
  alternatives: Array<{ type: PageType; confidence: number }>;
  evidenceIds: string[];
}

/* ------------------------------------------------------------------ */
/* Evidence / Fact                                                     */
/* ------------------------------------------------------------------ */

export type SourceType =
  | "HTTP_REQUEST"
  | "HTTP_RESPONSE"
  | "RAW_HTML"
  | "STATIC_DOM"
  | "RENDERED_DOM"
  | "STRUCTURED_DATA"
  | "ROBOTS_TXT"
  | "SITEMAP"
  | "EXTERNAL_RESOURCE"
  | "DERIVED"
  | "SEMANTIC_EVALUATION";

export type FactType =
  | "url.final"
  | "redirect.chain"
  | "http.status"
  | "http.header"
  | "document.title"
  | "document.meta_description"
  | "document.canonical"
  | "document.robots_directive"
  | "document.language"
  | "heading.node"
  | "heading.outline"
  | "landmark.node"
  | "content.main_text"
  | "content.paragraph"
  | "content.question_section"
  | "link.node"
  | "link.internal"
  | "link.external_citation"
  | "image.node"
  | "date.signal"
  | "author.signal"
  | "publisher.signal"
  | "schema.block"
  | "schema.node"
  | "schema.validation"
  | "access.barrier"
  | "render.diff"
  | "entity.signal"
  | "claim.candidate"
  | "citation.relation"
  | "page.type";

export interface Provenance {
  fetchId: string;
  snapshotId: string;
  parentEvidenceIds?: string[];
  derivation?: string;
  provider?: string;
  model?: string;
  promptVersion?: string;
  rubricVersion?: string;
}

export interface TextSpan {
  start: number;
  end: number;
  quote: string;
  normalizedTextHash: string;
}

export interface EvidenceRecord {
  evidenceId: string;
  factType: FactType;
  sourceUrl: string;
  sourceType: SourceType;
  rawValue: unknown;
  normalizedValue: unknown;
  selector?: string;
  textSpan?: TextSpan;
  /** provenance 전용. 결정론적 점수 식에 넣지 않는다(evidence schema §4). */
  observedAt: string;
  extractorVersion: string;
  contentHash: string;
  confidence: number;
  provenance: Provenance;
}

export type FactStatus = "PRESENT" | "ABSENT" | "INVALID" | "UNKNOWN";

export interface FactRecord {
  factId: string;
  factType: FactType;
  value: unknown;
  status: FactStatus;
  evidenceIds: string[];
  confidence: number;
  extractorVersion: string;
  contentHash: string;
}

/* ------------------------------------------------------------------ */
/* Registry                                                            */
/* ------------------------------------------------------------------ */

export type AtomicCheckStatus =
  | "ACTIVE"
  | "EXPERIMENTAL"
  | "ADVISORY"
  | "CONTEXT_REQUIRED"
  | "DEFERRED_INPUT"
  | "V2_CANDIDATE"
  | "V2_1_DEFERRED";

/**
 * Atomic Check 정의.
 *
 * Weight 필드가 존재하지 않는다. 이것이 weight inflation을 구조적으로 막는
 * 유일한 장치이므로 이 인터페이스에 weight/score 계열 필드를 추가하면 안 된다.
 * (Registry §1, 방법론 §14.1)
 */
export interface AtomicCheckDef {
  atomicCheckId: string;
  question: string;
  engineType: EngineType;
  /** "ALL"이면 excludedFrom을 제외한 모든 page type에 적용된다. */
  appliesTo: "ALL" | readonly PageType[];
  excludedFrom: readonly PageType[];
  /** N_A로 판정할 때 결과에 표시할 사유. 사유 없이 N_A를 쓰지 않는다. */
  naReason: string | null;
  factDependencies: readonly FactType[];
  evidenceGrade: EvidenceGrade;
  status: AtomicCheckStatus;
  methodologyVersion: string;
}

export type ScoringRuleStatus =
  | "PROVISIONAL_WEIGHT"
  | "EXPERIMENTAL_WEIGHT"
  | "ADVISORY_ZERO_WEIGHT"
  | "CANDIDATE"
  | "DEFERRED_V2_1";

export interface ScoringRuleDef {
  ruleId: string;
  displayName: string;
  scoreDomain: ScoreDomain;
  category: string;
  engineType: EngineType;
  /** 이 Rule이 조합하는 Atomic Check ID 목록. */
  atomicChecks: readonly string[];
  appliesTo: "ALL" | readonly PageType[];
  excludedFrom: readonly PageType[];
  maxWeight: number;
  evidenceGrade: string;
  weightConfidence: WeightConfidence;
  status: ScoringRuleStatus;
  rationale: string;
  recommendation: string;
  methodologyVersion: string;
}

/* ------------------------------------------------------------------ */
/* Results                                                             */
/* ------------------------------------------------------------------ */

export interface AtomicCheckResult {
  atomicCheckId: string;
  state: CheckState;
  /** 상태를 그렇게 판정한 이유 코드. UNKNOWN/N_A는 반드시 값이 있어야 한다. */
  rationaleCode: string;
  factIds: string[];
  evidenceIds: string[];
  engineType: EngineType;
  methodologyVersion: string;
}

export interface RuleResultV2 {
  ruleId: string;
  methodologyVersion: string;
  scoreDomain: ScoreDomain;
  category: string;
  engineType: EngineType;
  result: CheckState;
  /** measured 상태일 때만 숫자. 그 외에는 null이며 분모에도 넣지 않는다. */
  awardedWeight: number | null;
  maxWeight: number;
  atomicResults: AtomicCheckResult[];
  factIds: string[];
  evidenceIds: string[];
  rationaleCode: string;
  recommendation: string;
}

export interface Coverage {
  /** N_A를 제외한 적용 대상 weight 합. */
  applicableWeight: number;
  /** PASS/WARN/FAIL로 실제 판정된 weight 합. */
  measuredWeight: number;
  earnedWeight: number;
  /** measuredWeight / applicableWeight. applicableWeight가 0이면 null. */
  coverage: number | null;
  counts: Record<CheckState, number>;
}

export interface DomainScore {
  domain: ScoreDomain;
  /** measured 분모 기준 0~100. 측정 가능한 rule이 없으면 null. */
  score: number | null;
  state: "SCORED" | "UNKNOWN" | "NOT_EVALUATED";
  coverage: Coverage;
  categories: Array<{ name: string; earnedWeight: number; applicableWeight: number; measuredWeight: number }>;
  rules: RuleResultV2[];
}
