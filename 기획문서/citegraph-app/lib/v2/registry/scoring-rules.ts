/**
 * Scoring Rule Registry.
 *
 * 원본: 기획문서/citegraph-rule-registry-draft.md §4
 *   SEO Scoring Rule 18 (합계 100) + SEO Advisory 6 (weight 0)
 *   GEO Technical 8 (raw envelope 40) + GEO Semantic 9 (v2 candidate raw 43 + v2.1 deferred 17)
 *
 * Weight는 전부 provisional이다. calibration 승인 전까지 공식 성능 지표로 쓰지 않는다.
 */

import type { ScoringRuleDef } from "../types";
import { METHODOLOGY_VERSION } from "../types";

const base = { methodologyVersion: METHODOLOGY_VERSION, appliesTo: "ALL" as const, excludedFrom: [] };

export const SEO_SCORING_RULES: readonly ScoringRuleDef[] = [
  {
    ...base, ruleId: "SR-SEO-HTTPS", displayName: "HTTPS 제공", scoreDomain: "SEO", category: "Technical SEO", engineType: "FACT",
    atomicChecks: ["AC-SEO-HTTPS"], maxWeight: 5, evidenceGrade: "A", weightConfidence: "Medium", status: "PROVISIONAL_WEIGHT",
    rationale: "안전한 최종 URL", recommendation: "HTTPS로 전환하세요.",
  },
  {
    ...base, ruleId: "SR-SEO-CANON-DECL", displayName: "Canonical 선언 건전성", scoreDomain: "SEO", category: "Technical SEO", engineType: "FACT",
    atomicChecks: ["AC-SEO-CANON-PRESENT", "AC-SEO-CANON-VALID"], maxWeight: 4, evidenceGrade: "A", weightConfidence: "Low", status: "PROVISIONAL_WEIGHT",
    rationale: "존재 하나에 고배점을 주지 않는다", recommendation: "단일 유효 canonical을 선언하세요.",
  },
  {
    ...base, ruleId: "SR-SEO-ROBOTS", displayName: "Robots 지시 건전성", scoreDomain: "SEO", category: "Technical SEO", engineType: "FACT",
    atomicChecks: ["AC-SEO-ROBOTS-PARSE", "AC-SEO-ROBOTS-CONFLICT"], maxWeight: 6, evidenceGrade: "A", weightConfidence: "Medium", status: "PROVISIONAL_WEIGHT",
    rationale: "명시적 directive 오류 방지", recommendation: "robots 지시의 충돌을 제거하세요.",
  },
  {
    ...base, ruleId: "SR-SEO-LANGUAGE", displayName: "언어 선언", scoreDomain: "SEO", category: "Technical SEO", engineType: "FACT",
    atomicChecks: ["AC-SEO-LANG-PRESENT", "AC-SEO-LANG-VALID"], maxWeight: 5, evidenceGrade: "A", weightConfidence: "Low", status: "PROVISIONAL_WEIGHT",
    rationale: "language fact", recommendation: "유효한 html lang을 선언하세요.",
  },
  {
    ...base, ruleId: "SR-SEO-TITLE", displayName: "Title 기본기", scoreDomain: "SEO", category: "On-page", engineType: "FACT",
    atomicChecks: ["AC-SEO-TITLE-PRESENT", "AC-SEO-TITLE-LENGTH", "AC-SEO-TITLE-UNIQUE"], maxWeight: 8, evidenceGrade: "A/D", weightConfidence: "Low", status: "PROVISIONAL_WEIGHT",
    rationale: "존재·heuristic·site uniqueness. semantic topic은 Advisory로 분리", recommendation: "title을 페이지 주제에 맞게 정리하세요.",
  },
  {
    ...base, ruleId: "SR-SEO-META", displayName: "Meta description 기본기", scoreDomain: "SEO", category: "On-page", engineType: "FACT",
    atomicChecks: ["AC-SEO-META-PRESENT", "AC-SEO-META-LENGTH", "AC-SEO-META-UNIQUE"], maxWeight: 6, evidenceGrade: "A/D", weightConfidence: "Low", status: "PROVISIONAL_WEIGHT",
    rationale: "snippet input", recommendation: "본문을 요약하는 description을 작성하세요.",
  },
  {
    ...base, ruleId: "SR-SEO-H1", displayName: "H1 기본기", scoreDomain: "SEO", category: "On-page", engineType: "FACT",
    atomicChecks: ["AC-SEO-H1-PRESENT", "AC-SEO-H1-COUNT"], maxWeight: 6, evidenceGrade: "C", weightConfidence: "Low", status: "PROVISIONAL_WEIGHT",
    rationale: "대표 heading signal", recommendation: "대표 H1을 하나 두세요.",
  },
  {
    ...base, ruleId: "SR-SEO-HEADING", displayName: "Heading 구조", scoreDomain: "SEO", category: "On-page", engineType: "FACT",
    atomicChecks: ["AC-SEO-HEADING-LEVEL"], maxWeight: 5, evidenceGrade: "C", weightConfidence: "Medium", status: "PROVISIONAL_WEIGHT",
    rationale: "outline quality. semantic 대표성은 Advisory", recommendation: "heading 단계를 순서대로 구성하세요.",
  },
  {
    ...base, ruleId: "SR-SEO-NOINDEX", displayName: "Indexing gate", scoreDomain: "SEO", category: "Indexability", engineType: "HYBRID",
    atomicChecks: ["AC-SEO-NOINDEX", "AC-SEO-INDEX-INTENT"], maxWeight: 12, evidenceGrade: "A", weightConfidence: "Medium", status: "PROVISIONAL_WEIGHT",
    rationale: "blocking gate 상한 12점 승인", recommendation: "색인 의도와 robots 지시를 일치시키세요.",
  },
  {
    ...base, ruleId: "SR-SEO-NOFOLLOW", displayName: "Page follow 정책", scoreDomain: "SEO", category: "Indexability", engineType: "HYBRID",
    atomicChecks: ["AC-SEO-NOFOLLOW", "AC-SEO-INDEX-INTENT"], maxWeight: 5, evidenceGrade: "A", weightConfidence: "Low", status: "PROVISIONAL_WEIGHT",
    rationale: "page-level link policy", recommendation: "불필요한 none/nofollow를 제거하세요.",
  },
  {
    ...base, ruleId: "SR-SEO-CANON-REL", displayName: "Canonical 관계", scoreDomain: "SEO", category: "Indexability", engineType: "VALIDATOR",
    atomicChecks: ["AC-SEO-CANON-RELATION"], maxWeight: 5, evidenceGrade: "A", weightConfidence: "Low", status: "PROVISIONAL_WEIGHT",
    rationale: "canonical 총 weight 제한. context 부족 시 UNKNOWN", recommendation: "중복 페이지의 대표 URL을 정리하세요.",
  },
  {
    ...base, ruleId: "SR-SEO-SCHEMA-SYNTAX", displayName: "Schema 문법", scoreDomain: "SEO", category: "Structured Data", engineType: "FACT",
    atomicChecks: ["AC-SEO-SCHEMA-SYNTAX"], maxWeight: 5, evidenceGrade: "A", weightConfidence: "Medium", status: "PROVISIONAL_WEIGHT",
    rationale: "parser gate", recommendation: "유효한 JSON-LD를 제공하세요.",
  },
  {
    ...base, ruleId: "SR-SEO-SCHEMA-TYPE", displayName: "Schema 유형", scoreDomain: "SEO", category: "Structured Data", engineType: "VALIDATOR",
    atomicChecks: ["AC-SEO-SCHEMA-TYPE"], maxWeight: 4, evidenceGrade: "A", weightConfidence: "Low", status: "PROVISIONAL_WEIGHT",
    rationale: "page type compatibility", recommendation: "페이지 성격에 맞는 @type을 선언하세요.",
  },
  {
    ...base, ruleId: "SR-SEO-SCHEMA-REQUIRED", displayName: "Schema 필수 속성", scoreDomain: "SEO", category: "Structured Data", engineType: "VALIDATOR",
    atomicChecks: ["AC-SEO-SCHEMA-REQUIRED"], maxWeight: 6, evidenceGrade: "A", weightConfidence: "Medium", status: "PROVISIONAL_WEIGHT",
    rationale: "explicit validator result", recommendation: "필수 property를 채우세요.",
  },
  {
    ...base, ruleId: "SR-SEO-BODY", displayName: "Main text 기본량", scoreDomain: "SEO", category: "Content Basics", engineType: "FACT",
    atomicChecks: ["AC-SEO-BODY-AMOUNT"], maxWeight: 6, evidenceGrade: "D", weightConfidence: "Low", status: "EXPERIMENTAL_WEIGHT",
    rationale: "hard threshold 금지. type/lang profile 필요", recommendation: "페이지 목적에 맞는 고유 본문을 보강하세요.",
  },
  {
    ...base, ruleId: "SR-SEO-INTERNAL", displayName: "내부 탐색 경로", scoreDomain: "SEO", category: "Content Basics", engineType: "FACT",
    atomicChecks: ["AC-SEO-INTERNAL-CRAWL"], maxWeight: 5, evidenceGrade: "A", weightConfidence: "Low", status: "PROVISIONAL_WEIGHT",
    rationale: "count hard threshold 금지", recommendation: "관련 내부 링크를 연결하세요.",
  },
  {
    ...base, ruleId: "SR-SEO-ALT", displayName: "Alt 속성 Coverage", scoreDomain: "SEO", category: "Content Basics", engineType: "FACT",
    atomicChecks: ["AC-SEO-ALT-PRESENCE"], maxWeight: 4, evidenceGrade: "A", weightConfidence: "Low", status: "PROVISIONAL_WEIGHT",
    rationale: "alt attribute fact. 의미 적합성은 Advisory", recommendation: "정보성 이미지에 alt를 제공하세요.",
  },
  {
    ...base, ruleId: "SR-SEO-DATE", displayName: "날짜 신호", scoreDomain: "SEO", category: "Content Basics", engineType: "VALIDATOR",
    atomicChecks: ["AC-SEO-DATE-APPLICABLE", "AC-SEO-DATE-PRESENT"], maxWeight: 3, evidenceGrade: "C", weightConfidence: "Low", status: "PROVISIONAL_WEIGHT",
    rationale: "page type aware", recommendation: "작성·수정일을 명시하세요.",
  },
];

export const SEO_ADVISORY_RULES: readonly ScoringRuleDef[] = (
  [
    ["ADV-SEO-TITLE-TOPIC", "AC-SEO-TITLE-TOPIC", "title 의미 일치"],
    ["ADV-SEO-META-TOPIC", "AC-SEO-META-TOPIC", "description 사실성"],
    ["ADV-SEO-HEADING-TOPIC", "AC-SEO-HEADING-TOPIC", "heading의 section 대표성"],
    ["ADV-SEO-SCHEMA-VISIBLE", "AC-SEO-SCHEMA-VISIBLE", "schema와 visible content 일치"],
    ["ADV-SEO-INTERNAL-CONTEXT", "AC-SEO-INTERNAL-CONTEXT", "anchor/target 문맥"],
    ["ADV-SEO-ALT-QUALITY", "AC-SEO-ALT-QUALITY", "이미지 역할과 대안 적합성"],
  ] as const
).map(([ruleId, atomicCheckId, purpose]) => ({
  ...base,
  ruleId,
  displayName: purpose,
  scoreDomain: "SEO_ADVISORY" as const,
  category: "Advisory",
  engineType: "SEMANTIC" as const,
  atomicChecks: [atomicCheckId],
  // Advisory는 SEO 100점에 들어가지 않는다. maxWeight 0이 그 계약이다.
  maxWeight: 0,
  evidenceGrade: "A",
  weightConfidence: "Experimental" as const,
  status: "ADVISORY_ZERO_WEIGHT" as const,
  rationale: "SEO 점수에서 제외된 의미 품질 관찰",
  recommendation: "Evidence와 함께 참고 정보로만 사용하세요.",
}));

export const GEO_FACT_SCORING_RULES: readonly ScoringRuleDef[] = [
  { ...base, ruleId: "SR-GF-ANSWER-STRUCT", displayName: "질문·목록 구조", scoreDomain: "GEO_FACT", category: "Answer Structure", engineType: "FACT", atomicChecks: ["AC-GF-QSTRUCT", "AC-GF-LISTTABLE"], maxWeight: 4, evidenceGrade: "C/D", weightConfidence: "Low", status: "PROVISIONAL_WEIGHT", rationale: "구조 추출 가능성", recommendation: "질문과 단계를 구조화하세요." },
  { ...base, ruleId: "SR-GF-LANDMARK", displayName: "Main landmark", scoreDomain: "GEO_FACT", category: "Machine Readability", engineType: "FACT", atomicChecks: ["AC-GF-LANDMARK"], maxWeight: 4, evidenceGrade: "A", weightConfidence: "Medium", status: "PROVISIONAL_WEIGHT", rationale: "본문 경계 식별", recommendation: "main landmark로 본문을 감싸세요." },
  { ...base, ruleId: "SR-GF-RAW-ACCESS", displayName: "Raw 본문과 렌더 의존", scoreDomain: "GEO_FACT", category: "Content Accessibility", engineType: "FACT", atomicChecks: ["AC-GF-RAWCONTENT", "AC-GF-RENDERDEP"], maxWeight: 11, evidenceGrade: "C", weightConfidence: "Low", status: "PROVISIONAL_WEIGHT", rationale: "raw HTML 본문 확보", recommendation: "핵심 본문을 초기 HTML에 포함하세요." },
  { ...base, ruleId: "SR-GF-BARRIER", displayName: "접근 장벽", scoreDomain: "GEO_FACT", category: "Content Accessibility", engineType: "FACT", atomicChecks: ["AC-GF-ACCESS"], maxWeight: 5, evidenceGrade: "C", weightConfidence: "Medium", status: "PROVISIONAL_WEIGHT", rationale: "본문 접근 가능성", recommendation: "로그인 없이 핵심 설명을 제공하세요." },
  { ...base, ruleId: "SR-GF-AUTHOR-DATE", displayName: "저자·날짜 provenance", scoreDomain: "GEO_FACT", category: "Provenance", engineType: "FACT", atomicChecks: ["AC-GF-AUTHOR", "AC-SEO-DATE-PRESENT"], maxWeight: 5, evidenceGrade: "C", weightConfidence: "Low", status: "PROVISIONAL_WEIGHT", rationale: "책임 주체와 시점", recommendation: "저자와 작성·수정일을 표시하세요." },
  { ...base, ruleId: "SR-GF-PUBLISHER", displayName: "발행 주체", scoreDomain: "GEO_FACT", category: "Provenance", engineType: "FACT", atomicChecks: ["AC-GF-PUBLISHER"], maxWeight: 3, evidenceGrade: "C", weightConfidence: "Low", status: "PROVISIONAL_WEIGHT", rationale: "publisher identity", recommendation: "Organization 또는 Person 정보를 제공하세요." },
  { ...base, ruleId: "SR-GF-CITATION", displayName: "Citation 구조", scoreDomain: "GEO_FACT", category: "Citation Readiness", engineType: "FACT", atomicChecks: ["AC-GF-CITEURL", "AC-GF-CITEPROX"], maxWeight: 6, evidenceGrade: "A/D", weightConfidence: "Low", status: "PROVISIONAL_WEIGHT", rationale: "URL 유효성과 구조적 근접성까지만 측정", recommendation: "주장 가까이에 원출처 링크를 두세요." },
  { ...base, ruleId: "SR-GF-ENTITY", displayName: "Entity signal", scoreDomain: "GEO_FACT", category: "Machine Readability", engineType: "FACT", atomicChecks: ["AC-GF-ENTITY"], maxWeight: 2, evidenceGrade: "C", weightConfidence: "Low", status: "PROVISIONAL_WEIGHT", rationale: "entity 추출 가능성", recommendation: "핵심 이름을 일관되게 노출하세요." },
];

export const GEO_SEMANTIC_SCORING_RULES: readonly ScoringRuleDef[] = [
  { ...base, ruleId: "SR-GS-ANSWER", displayName: "답변 직접성·완결성", scoreDomain: "GEO_SEMANTIC", category: "Answerability", engineType: "SEMANTIC", atomicChecks: ["AC-GS-ANSWER-DIRECT", "AC-GS-ANSWER-COMPLETE", "AC-GS-QA-ALIGN"], maxWeight: 12, evidenceGrade: "B/D", weightConfidence: "Low", status: "CANDIDATE", rationale: "v2 candidate", recommendation: "질문 직후 직접 답변을 배치하세요." },
  { ...base, ruleId: "SR-GS-STRUCTURE", displayName: "구조 적합성", scoreDomain: "GEO_SEMANTIC", category: "Answerability", engineType: "SEMANTIC", atomicChecks: ["AC-GS-STRUCTFIT"], maxWeight: 3, evidenceGrade: "C", weightConfidence: "Low", status: "CANDIDATE", rationale: "v2 candidate", recommendation: "내용에 맞는 목록·표를 사용하세요." },
  { ...base, ruleId: "SR-GS-METADATA", displayName: "메타데이터 명료성", scoreDomain: "GEO_SEMANTIC", category: "Machine Readability", engineType: "SEMANTIC", atomicChecks: ["AC-GS-METACLARITY"], maxWeight: 3, evidenceGrade: "C", weightConfidence: "Low", status: "CANDIDATE", rationale: "v2 candidate", recommendation: "title/meta/H1의 주제를 일치시키세요." },
  { ...base, ruleId: "SR-GS-AUTHOR", displayName: "저자 설명 책임", scoreDomain: "GEO_SEMANTIC", category: "Trust", engineType: "SEMANTIC", atomicChecks: ["AC-GS-AUTHOR-ACCOUNT"], maxWeight: 4, evidenceGrade: "C", weightConfidence: "Low", status: "CANDIDATE", rationale: "v2 candidate", recommendation: "저자와 역할을 설명하세요." },
  { ...base, ruleId: "SR-GS-PUBLISHER", displayName: "발행 주체 일관성", scoreDomain: "GEO_SEMANTIC", category: "Trust", engineType: "SEMANTIC", atomicChecks: ["AC-GS-PUBLISHER"], maxWeight: 4, evidenceGrade: "C", weightConfidence: "Low", status: "CANDIDATE", rationale: "v2 candidate", recommendation: "publisher 표기를 일관되게 유지하세요." },
  { ...base, ruleId: "SR-GS-CLAIM-COVER", displayName: "Claim 근거 연결", scoreDomain: "GEO_SEMANTIC", category: "Citation Readiness", engineType: "SEMANTIC", atomicChecks: ["AC-GS-CLAIMCOVER"], maxWeight: 5, evidenceGrade: "B", weightConfidence: "Low", status: "CANDIDATE", rationale: "v2 candidate", recommendation: "주요 주장에 근거를 연결하세요." },
  { ...base, ruleId: "SR-GS-ENTITY", displayName: "Entity 일관성", scoreDomain: "GEO_SEMANTIC", category: "Machine Readability", engineType: "SEMANTIC", atomicChecks: ["AC-GS-ENTITYCONSIST"], maxWeight: 4, evidenceGrade: "C", weightConfidence: "Low", status: "CANDIDATE", rationale: "v2 candidate", recommendation: "동일 entity 표기를 통일하세요." },
  { ...base, ruleId: "SR-GS-CONTENT", displayName: "명료성·응집성", scoreDomain: "GEO_SEMANTIC", category: "Content Quality", engineType: "SEMANTIC", atomicChecks: ["AC-GS-CLARITY", "AC-GS-COHERENCE"], maxWeight: 8, evidenceGrade: "C", weightConfidence: "Low", status: "CANDIDATE", rationale: "v2 candidate", recommendation: "문장과 섹션 흐름을 정리하세요." },
  {
    ...base, ruleId: "SR-GS-EXTERNAL-v2.1", displayName: "외부 출처·전문성·최신성", scoreDomain: "GEO_SEMANTIC", category: "Deferred", engineType: "SEMANTIC",
    atomicChecks: ["AC-GS-AUTHOR-EXPERT", "AC-GS-FRESHNESS", "AC-GS-SOURCESUPPORT", "AC-GS-SOURCEQUALITY"],
    // v2에서 weight 0. deferredRawWeight 17은 문서상의 v2.1 후보값이며 분모에 넣지 않는다.
    maxWeight: 0, evidenceGrade: "B/C", weightConfidence: "Experimental", status: "DEFERRED_V2_1",
    rationale: "외부 target fetch 필요. v2 분모 제외", recommendation: "v2.1에서 target snapshot과 함께 평가합니다.",
  },
];

export const SCORING_RULES: readonly ScoringRuleDef[] = [
  ...SEO_SCORING_RULES,
  ...SEO_ADVISORY_RULES,
  ...GEO_FACT_SCORING_RULES,
  ...GEO_SEMANTIC_SCORING_RULES,
];

export const SCORING_RULE_BY_ID: ReadonlyMap<string, ScoringRuleDef> = new Map(
  SCORING_RULES.map(rule => [rule.ruleId, rule]),
);

/** 문서에 기록된 provisional envelope. 코드가 이 값을 계산식으로 쓰지는 않는다. */
export const PROVISIONAL_ENVELOPE = {
  seoTotal: 100,
  seoCategories: { "Technical SEO": 20, "On-page": 25, Indexability: 22, "Structured Data": 15, "Content Basics": 18 },
  geoFactRaw: 40,
  geoSemanticRawHypothesis: 60,
  geoSemanticV2CandidateRaw: 43,
  geoSemanticV21DeferredRaw: 17,
} as const;
