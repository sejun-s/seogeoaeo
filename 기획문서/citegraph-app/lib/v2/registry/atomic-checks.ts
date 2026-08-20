/**
 * Atomic Check Registry — 61개.
 *
 * 원본: 기획문서/citegraph-rule-registry-draft.md §3
 *   SEO 34 + GEO_FACT 12 + GEO_SEMANTIC 15
 *
 * 이 파일에는 weight가 없다. AtomicCheckDef 타입에도 없다.
 * check를 더 잘게 쪼개도 총점이 늘지 않는 이유가 이것이다(방법론 §14.1).
 */

import type { AtomicCheckDef, AtomicCheckStatus, EngineType, EvidenceGrade, FactType, PageType } from "../types";
import { METHODOLOGY_VERSION } from "../types";

interface CheckSpec {
  id: string;
  question: string;
  engine: EngineType;
  grade: EvidenceGrade;
  status: AtomicCheckStatus;
  facts: readonly FactType[];
  appliesTo?: "ALL" | readonly PageType[];
  excludedFrom?: readonly PageType[];
  naReason?: string;
}

function define(specs: readonly CheckSpec[]): AtomicCheckDef[] {
  return specs.map(spec => ({
    atomicCheckId: spec.id,
    question: spec.question,
    engineType: spec.engine,
    appliesTo: spec.appliesTo ?? "ALL",
    excludedFrom: spec.excludedFrom ?? [],
    naReason: spec.naReason ?? null,
    factDependencies: spec.facts,
    evidenceGrade: spec.grade,
    status: spec.status,
    methodologyVersion: METHODOLOGY_VERSION,
  }));
}

export const SEO_ATOMIC_CHECKS: readonly AtomicCheckDef[] = define([
  { id: "AC-SEO-HTTPS", question: "최종 URL이 HTTPS인가", engine: "FACT", grade: "A", status: "ACTIVE", facts: ["url.final", "redirect.chain"] },
  { id: "AC-SEO-CANON-PRESENT", question: "canonical 선언이 있는가", engine: "FACT", grade: "A", status: "ACTIVE", facts: ["document.canonical"], excludedFrom: ["UTILITY_AUTH"], naReason: "정책상 canonical 비적용 utility 화면" },
  { id: "AC-SEO-CANON-VALID", question: "canonical URL이 유효한가", engine: "FACT", grade: "A", status: "ACTIVE", facts: ["document.canonical"] },
  { id: "AC-SEO-ROBOTS-PARSE", question: "robots directive를 파싱할 수 있는가", engine: "FACT", grade: "A", status: "ACTIVE", facts: ["document.robots_directive", "http.header"] },
  { id: "AC-SEO-ROBOTS-CONFLICT", question: "robots 지시가 충돌하는가", engine: "FACT", grade: "A", status: "ACTIVE", facts: ["document.robots_directive"] },
  { id: "AC-SEO-LANG-PRESENT", question: "html lang이 있는가", engine: "FACT", grade: "A", status: "ACTIVE", facts: ["document.language"] },
  { id: "AC-SEO-LANG-VALID", question: "lang code가 유효한가", engine: "FACT", grade: "A", status: "ACTIVE", facts: ["document.language"] },
  { id: "AC-SEO-TITLE-PRESENT", question: "title이 있는가", engine: "FACT", grade: "A", status: "ACTIVE", facts: ["document.title"] },
  { id: "AC-SEO-TITLE-LENGTH", question: "title 길이가 언어·유형 heuristic 범위인가", engine: "FACT", grade: "D", status: "EXPERIMENTAL", facts: ["document.title", "page.type", "document.language"] },
  { id: "AC-SEO-TITLE-UNIQUE", question: "title이 site corpus에서 고유한가", engine: "FACT", grade: "A", status: "DEFERRED_INPUT", facts: ["document.title"] },
  { id: "AC-SEO-TITLE-TOPIC", question: "title이 page topic과 일치하는가", engine: "SEMANTIC", grade: "A", status: "ADVISORY", facts: ["document.title", "heading.node", "content.main_text"] },
  { id: "AC-SEO-META-PRESENT", question: "meta description이 있는가", engine: "FACT", grade: "A", status: "ACTIVE", facts: ["document.meta_description"], excludedFrom: ["UTILITY_AUTH"], naReason: "meta description 비적용 utility 화면" },
  { id: "AC-SEO-META-LENGTH", question: "meta 길이가 언어·유형 heuristic 범위인가", engine: "FACT", grade: "D", status: "EXPERIMENTAL", facts: ["document.meta_description", "page.type", "document.language"] },
  { id: "AC-SEO-META-UNIQUE", question: "meta가 site corpus에서 고유한가", engine: "FACT", grade: "A", status: "DEFERRED_INPUT", facts: ["document.meta_description"] },
  { id: "AC-SEO-META-TOPIC", question: "meta가 본문을 사실적으로 요약하는가", engine: "SEMANTIC", grade: "A", status: "ADVISORY", facts: ["document.meta_description", "content.main_text"] },
  { id: "AC-SEO-H1-PRESENT", question: "대표 H1이 있는가", engine: "FACT", grade: "C", status: "ACTIVE", facts: ["heading.node"], excludedFrom: ["UTILITY_AUTH"], naReason: "H1 비적용 utility 화면" },
  { id: "AC-SEO-H1-COUNT", question: "H1 수가 명확한가", engine: "FACT", grade: "C", status: "EXPERIMENTAL", facts: ["heading.outline"], excludedFrom: ["UTILITY_AUTH"], naReason: "H1 비적용 utility 화면" },
  { id: "AC-SEO-HEADING-LEVEL", question: "heading outline이 구조적으로 유효한가", engine: "FACT", grade: "C", status: "ACTIVE", facts: ["heading.outline"], excludedFrom: ["UTILITY_AUTH"], naReason: "짧은 utility 화면은 heading 구조 불필요" },
  { id: "AC-SEO-HEADING-TOPIC", question: "heading이 section을 대표하는가", engine: "SEMANTIC", grade: "C", status: "ADVISORY", facts: ["heading.node", "content.main_text"], excludedFrom: ["UTILITY_AUTH"], naReason: "짧은 utility 화면은 heading 구조 불필요" },
  { id: "AC-SEO-NOINDEX", question: "effective noindex가 있는가", engine: "FACT", grade: "A", status: "ACTIVE", facts: ["document.robots_directive"] },
  { id: "AC-SEO-INDEX-INTENT", question: "페이지가 색인 대상인가", engine: "VALIDATOR", grade: "C", status: "ACTIVE", facts: ["page.type"] },
  { id: "AC-SEO-NOFOLLOW", question: "effective page nofollow/none이 있는가", engine: "FACT", grade: "A", status: "ACTIVE", facts: ["document.robots_directive"] },
  { id: "AC-SEO-CANON-RELATION", question: "canonical target 관계가 적절한가", engine: "VALIDATOR", grade: "A", status: "CONTEXT_REQUIRED", facts: ["document.canonical", "url.final"], excludedFrom: ["UTILITY_AUTH"], naReason: "canonical 비적용 utility 화면" },
  { id: "AC-SEO-SCHEMA-SYNTAX", question: "structured data 문법이 유효한가", engine: "FACT", grade: "A", status: "ACTIVE", facts: ["schema.block"] },
  { id: "AC-SEO-SCHEMA-TYPE", question: "schema type이 page type과 호환되는가", engine: "VALIDATOR", grade: "A", status: "ACTIVE", facts: ["schema.node", "page.type"] },
  { id: "AC-SEO-SCHEMA-REQUIRED", question: "required property가 완전한가", engine: "VALIDATOR", grade: "A", status: "ACTIVE", facts: ["schema.validation"] },
  { id: "AC-SEO-SCHEMA-VISIBLE", question: "schema가 visible content와 일치하는가", engine: "SEMANTIC", grade: "A", status: "ADVISORY", facts: ["schema.node", "content.main_text"] },
  { id: "AC-SEO-BODY-AMOUNT", question: "page type 대비 main text가 충분한가", engine: "FACT", grade: "D", status: "EXPERIMENTAL", facts: ["content.main_text", "page.type", "document.language"], excludedFrom: ["UTILITY_AUTH"], naReason: "본문 분량이 목적이 아닌 utility 화면" },
  { id: "AC-SEO-INTERNAL-CRAWL", question: "crawlable 내부 링크가 있는가", engine: "FACT", grade: "A", status: "ACTIVE", facts: ["link.internal"], excludedFrom: ["UTILITY_AUTH"], naReason: "독립 terminal utility 화면" },
  { id: "AC-SEO-INTERNAL-CONTEXT", question: "anchor/context가 target을 설명하는가", engine: "SEMANTIC", grade: "A", status: "ADVISORY", facts: ["link.internal"], excludedFrom: ["UTILITY_AUTH"], naReason: "독립 terminal utility 화면" },
  { id: "AC-SEO-ALT-PRESENCE", question: "적용 이미지에 alt 속성이 있는가", engine: "FACT", grade: "A", status: "ACTIVE", facts: ["image.node"], naReason: "이미지가 없거나 모두 장식용" },
  { id: "AC-SEO-ALT-QUALITY", question: "이미지 역할에 alt가 적합한가", engine: "SEMANTIC", grade: "A", status: "ADVISORY", facts: ["image.node", "content.main_text"], naReason: "이미지가 없거나 모두 장식용" },
  { id: "AC-SEO-DATE-APPLICABLE", question: "날짜가 필요한 page type인가", engine: "VALIDATOR", grade: "C", status: "ACTIVE", facts: ["page.type"] },
  { id: "AC-SEO-DATE-PRESENT", question: "필요한 날짜 신호가 존재·유효한가", engine: "FACT", grade: "C", status: "ACTIVE", facts: ["date.signal"], naReason: "시간에 민감하지 않은 page type" },
]);

export const GEO_FACT_ATOMIC_CHECKS: readonly AtomicCheckDef[] = define([
  { id: "AC-GF-QSTRUCT", question: "질문 section candidate가 있는가", engine: "FACT", grade: "D", status: "EXPERIMENTAL", facts: ["content.question_section"], excludedFrom: ["UTILITY_AUTH", "HOMEPAGE"], naReason: "질문 응답 구조가 목적이 아닌 화면" },
  { id: "AC-GF-LISTTABLE", question: "list/table 구조가 추출되는가", engine: "FACT", grade: "C", status: "ACTIVE", facts: ["entity.signal"], excludedFrom: ["UTILITY_AUTH", "HOMEPAGE"], naReason: "비교·단계·열거 정보가 없는 화면" },
  { id: "AC-GF-LANDMARK", question: "main landmark가 핵심 text를 포함하는가", engine: "FACT", grade: "A", status: "ACTIVE", facts: ["landmark.node", "content.main_text"] },
  { id: "AC-GF-RAWCONTENT", question: "raw HTML에 핵심 본문이 있는가", engine: "FACT", grade: "C", status: "ACTIVE", facts: ["content.main_text"], excludedFrom: ["UTILITY_AUTH"], naReason: "비공개 utility 화면" },
  { id: "AC-GF-RENDERDEP", question: "핵심 본문이 rendering에 과도하게 의존하는가", engine: "FACT", grade: "C", status: "EXPERIMENTAL", facts: ["render.diff"] },
  { id: "AC-GF-ACCESS", question: "접근 장벽이 핵심 본문을 막는가", engine: "FACT", grade: "C", status: "ACTIVE", facts: ["access.barrier", "http.status"], excludedFrom: ["UTILITY_AUTH"], naReason: "의도적으로 비공개인 화면" },
  { id: "AC-GF-AUTHOR", question: "저자/검토자 identity가 있는가", engine: "FACT", grade: "C", status: "ACTIVE", facts: ["author.signal"], appliesTo: ["ARTICLE_BLOG", "DOCUMENTATION"], naReason: "저자 책임이 요구되지 않는 page type" },
  { id: "AC-GF-PUBLISHER", question: "publisher identity signal이 있는가", engine: "FACT", grade: "C", status: "ACTIVE", facts: ["publisher.signal"] },
  { id: "AC-GF-CITEURL", question: "citation candidate가 유효 HTTP(S) URL인가", engine: "FACT", grade: "A", status: "ACTIVE", facts: ["link.external_citation"], naReason: "검증 가능한 claim이 없는 화면" },
  { id: "AC-GF-CITEPROX", question: "citation이 claim candidate 가까이에 있는가", engine: "FACT", grade: "D", status: "EXPERIMENTAL", facts: ["citation.relation", "claim.candidate"], naReason: "검증 가능한 claim이 없는 화면" },
  { id: "AC-GF-ENTITY", question: "핵심 entity signals가 추출되는가", engine: "FACT", grade: "C", status: "ACTIVE", facts: ["entity.signal"], excludedFrom: ["UTILITY_AUTH"], naReason: "entity가 핵심이 아닌 화면" },
]);

/**
 * GEO Semantic. v2에서는 어떤 것도 실행하지 않는다.
 * V2_CANDIDATE는 엔진 미실행으로 NOT_EVALUATED,
 * V2_1_DEFERRED는 외부 target fetch가 없어 NOT_EVALUATED다.
 * 둘 다 heuristic PASS로 대체하지 않는다.
 */
export const GEO_SEMANTIC_ATOMIC_CHECKS: readonly AtomicCheckDef[] = define([
  { id: "AC-GS-ANSWER-DIRECT", question: "핵심 질문에 바로 답하는가", engine: "SEMANTIC", grade: "B", status: "V2_CANDIDATE", facts: ["content.question_section", "content.paragraph"] },
  { id: "AC-GS-ANSWER-COMPLETE", question: "답이 핵심 조건을 포함하는가", engine: "SEMANTIC", grade: "B", status: "V2_CANDIDATE", facts: ["content.question_section", "content.paragraph"] },
  { id: "AC-GS-QA-ALIGN", question: "질문 heading과 section이 정렬되는가", engine: "SEMANTIC", grade: "D", status: "V2_CANDIDATE", facts: ["content.question_section", "heading.node"] },
  { id: "AC-GS-STRUCTFIT", question: "list/table 형식이 내용에 적합한가", engine: "SEMANTIC", grade: "C", status: "V2_CANDIDATE", facts: ["entity.signal", "content.main_text"] },
  { id: "AC-GS-METACLARITY", question: "title/meta/H1이 같은 topic/entity를 표현하는가", engine: "SEMANTIC", grade: "C", status: "V2_CANDIDATE", facts: ["document.title", "document.meta_description", "heading.node"] },
  { id: "AC-GS-AUTHOR-ACCOUNT", question: "저자/검토자와 역할이 확인되는가", engine: "SEMANTIC", grade: "C", status: "V2_CANDIDATE", facts: ["author.signal"], appliesTo: ["ARTICLE_BLOG", "DOCUMENTATION"], naReason: "저자 책임이 요구되지 않는 page type" },
  { id: "AC-GS-AUTHOR-EXPERT", question: "저자 전문성이 외부 검증되는가", engine: "SEMANTIC", grade: "C", status: "V2_1_DEFERRED", facts: ["author.signal"] },
  { id: "AC-GS-FRESHNESS", question: "시간 민감도 대비 내용이 최신인가", engine: "SEMANTIC", grade: "C", status: "V2_1_DEFERRED", facts: ["date.signal", "content.main_text"] },
  { id: "AC-GS-PUBLISHER", question: "visible/schema publisher가 일관되는가", engine: "SEMANTIC", grade: "C", status: "V2_CANDIDATE", facts: ["publisher.signal", "entity.signal"] },
  { id: "AC-GS-CLAIMCOVER", question: "주요 claim에 citation 후보가 연결되는가", engine: "SEMANTIC", grade: "B", status: "V2_CANDIDATE", facts: ["claim.candidate", "citation.relation"] },
  { id: "AC-GS-SOURCESUPPORT", question: "target source가 claim을 지지하는가", engine: "SEMANTIC", grade: "B", status: "V2_1_DEFERRED", facts: ["citation.relation"] },
  { id: "AC-GS-SOURCEQUALITY", question: "source가 관련 원출처인가", engine: "SEMANTIC", grade: "B", status: "V2_1_DEFERRED", facts: ["link.external_citation"] },
  { id: "AC-GS-ENTITYCONSIST", question: "signals가 같은 entity를 가리키는가", engine: "SEMANTIC", grade: "C", status: "V2_CANDIDATE", facts: ["entity.signal"] },
  { id: "AC-GS-CLARITY", question: "핵심 문장이 명료한가", engine: "SEMANTIC", grade: "C", status: "V2_CANDIDATE", facts: ["content.paragraph"] },
  { id: "AC-GS-COHERENCE", question: "section이 논리적으로 연결되는가", engine: "SEMANTIC", grade: "C", status: "V2_CANDIDATE", facts: ["heading.node", "content.paragraph"] },
]);

export const ATOMIC_CHECKS: readonly AtomicCheckDef[] = [
  ...SEO_ATOMIC_CHECKS,
  ...GEO_FACT_ATOMIC_CHECKS,
  ...GEO_SEMANTIC_ATOMIC_CHECKS,
];

export const ATOMIC_CHECK_BY_ID: ReadonlyMap<string, AtomicCheckDef> = new Map(
  ATOMIC_CHECKS.map(check => [check.atomicCheckId, check]),
);
