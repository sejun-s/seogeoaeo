# CiteGraph Evidence Schema Draft

> 상태: scoring v2 구현 전 검토안  
> 방법론: `methodology-v2-draft.1`  
> 현재 scoring/UI/LLM API에는 미적용

## 1. 설계 목적

Rule이 raw DOM을 각자 다시 해석하지 않도록, 한 번 관측한 사실을 Evidence Layer에 정규화한다. SEO와 GEO는 동일 Fact를 참조할 수 있지만 Rule 결과와 Weight는 별도로 관리한다.

```text
Fetch Snapshot
→ Extractor
→ EvidenceRecord / FactRecord
→ Applicability
→ FACT Rule 또는 Semantic Rubric
→ RuleResult
```

## 2. 핵심 타입

```ts
type SourceType =
  | "HTTP_REQUEST" | "HTTP_RESPONSE" | "RAW_HTML"
  | "STATIC_DOM" | "RENDERED_DOM" | "STRUCTURED_DATA"
  | "ROBOTS_TXT" | "SITEMAP" | "EXTERNAL_RESOURCE"
  | "DERIVED" | "SEMANTIC_EVALUATION";

type FactType =
  | "url.final" | "redirect.chain" | "http.status" | "http.header"
  | "document.title" | "document.meta_description" | "document.canonical"
  | "document.robots_directive" | "document.language"
  | "heading.node" | "heading.outline" | "landmark.node"
  | "content.main_text" | "content.paragraph" | "content.question_section"
  | "link.node" | "link.internal" | "link.external_citation"
  | "image.node" | "date.signal" | "author.signal" | "publisher.signal"
  | "schema.block" | "schema.node" | "schema.validation"
  | "access.barrier" | "render.diff" | "entity.signal"
  | "claim.candidate" | "citation.relation" | "page.type";

type Provenance = {
  fetchId: string;
  snapshotId: string;
  parentEvidenceIds?: string[];
  derivation?: string;
  provider?: string;
  model?: string;
  promptVersion?: string;
  rubricVersion?: string;
};

interface TextSpan {
  start: number;
  end: number;
  quote: string;
  normalizedTextHash: string;
}

interface EvidenceRecord {
  evidenceId: string;
  factType: FactType;
  sourceUrl: string;
  sourceType: SourceType;
  rawValue: unknown;
  normalizedValue: unknown;
  selector?: string;
  textSpan?: TextSpan;
  observedAt: string;
  extractorVersion: string;
  contentHash: string;
  confidence: number; // 0..1
  provenance: Provenance;
}
```

## 3. Fact와 Evidence의 구분

- `EvidenceRecord`: 원본에서 관측한 한 개 값과 위치. 불변 append-only 기록.
- `FactRecord`: 하나 이상의 evidence를 정규화·병합한 결과.
- `RuleResult`: Fact ID 또는 Evidence ID를 근거로 한 판정. raw DOM을 저장하거나 재해석하지 않는다.

```ts
interface FactRecord {
  factId: string;
  factType: FactType;
  value: unknown;
  status: "PRESENT" | "ABSENT" | "INVALID" | "UNKNOWN";
  evidenceIds: string[];
  confidence: number;
  extractorVersion: string;
  contentHash: string;
}

interface RuleResultV2 {
  ruleId: string;
  methodologyVersion: string;
  engineType: "FACT" | "SEMANTIC" | "HYBRID";
  result: "PASS" | "WARN" | "FAIL" | "N_A" | "UNKNOWN" | "NOT_EVALUATED";
  awardedWeight?: number;
  maxWeight: number;
  factIds: string[];
  evidenceIds: string[];
  rationaleCode: string;
  recommendation: string;
  evaluator?: {
    provider?: string;
    model?: string;
    rubricVersion?: string;
  };
}
```

## 4. ID와 불변성

- `contentHash`: 분석 대상 response body의 SHA-256.
- `evidenceId`: `EV2_<contentHash-prefix>_<factType-code>_<ordinal>`.
- `factId`: `FACT_<contentHash-prefix>_<factType-code>_<normalized-key>`.
- 동일 snapshot, extractorVersion, 정규화 알고리즘에는 동일 Fact ID를 생성한다.
- `observedAt`은 provenance용이며 결정론적 점수 식에 넣지 않는다.
- 수정 대신 새 record와 새 version을 생성한다.

## 5. sourceType별 최소 provenance

| sourceType | 필수 provenance |
|---|---|
| HTTP_REQUEST/RESPONSE | fetchId, snapshotId, redirect hop, request policy version |
| RAW_HTML/STATIC_DOM | fetchId, snapshotId, parser name/version |
| RENDERED_DOM | fetchId, snapshotId, browser/version, render wait policy |
| STRUCTURED_DATA | parent block evidence ID, parser/validator version |
| EXTERNAL_RESOURCE | 별도 fetchId, target contentHash, source URL, status |
| DERIVED | 모든 parentEvidenceIds, deterministic derivation 이름/version |
| SEMANTIC_EVALUATION | input evidence IDs, provider/model, prompt/rubric version |

## 6. 공통 Fact Catalog

| Fact ID prefix | factType | 생산자 | 주요 소비 Rule |
|---|---|---|---|
| FACT-URL-FINAL | url.final | Fetcher | SEO-TECH-HTTPS, canonical 관계 |
| FACT-REDIRECT | redirect.chain | Fetcher | HTTPS, access/render 분석 |
| FACT-TITLE | document.title | Metadata extractor | SEO title atomic Rules, GEO metadata clarity |
| FACT-META-DESC | document.meta_description | Metadata extractor | SEO meta atomic Rules, GEO metadata clarity |
| FACT-CANONICAL | document.canonical | Metadata extractor | canonical 존재/유효/관계 |
| FACT-ROBOTS | document.robots_directive | Header+DOM extractor | robots parse/conflict, noindex/nofollow |
| FACT-LANG | document.language | DOM extractor | SEO lang 존재/유효; GEO는 중복 가산 없이 참조 |
| FACT-HEADING-NODE | heading.node | DOM extractor | H1, outline, GEO question/semantic 평가 |
| FACT-HEADING-OUTLINE | heading.outline | deterministic derivation | SEO heading level; GEO는 중복 fact 재사용 |
| FACT-LANDMARK | landmark.node | DOM extractor | GEO landmark coverage |
| FACT-MAIN-TEXT | content.main_text | Content extractor | body amount, raw availability, semantic 입력 |
| FACT-PARAGRAPH | content.paragraph | Content extractor | answer/readability semantic rubric |
| FACT-LINK | link.node | DOM extractor | internal links, citation 후보 |
| FACT-IMAGE | image.node | DOM extractor | alt coverage/quality |
| FACT-DATE | date.signal | DOM/schema extractor | SEO date applicability, GEO provenance |
| FACT-AUTHOR | author.signal | DOM/schema extractor | GEO author presence/quality |
| FACT-PUBLISHER | publisher.signal | DOM/schema extractor | GEO publisher presence/coherence |
| FACT-SCHEMA-BLOCK | schema.block | Schema extractor | syntax/type/required property |
| FACT-SCHEMA-VALID | schema.validation | Validator | SEO schema atomic Rules |
| FACT-ACCESS | access.barrier | Fetch/render extractor | GEO access barrier |
| FACT-RENDER-DIFF | render.diff | deterministic comparator | raw content/render dependency |
| FACT-ENTITY | entity.signal | Metadata/schema extractor | entity consistency semantic input |
| FACT-CLAIM | claim.candidate | candidate extractor | semantic claim coverage; candidate 자체는 점수 아님 |
| FACT-PAGE-TYPE | page.type | classifier | 모든 applicability gate |

## 7. 부재 Evidence

`ABSENT`도 증거가 필요하다. 단순히 evidence 배열을 비워 두지 않는다.

```ts
{
  evidenceId: "EV2_..._TITLE_ABSENT_1",
  factType: "document.title",
  sourceType: "DERIVED",
  rawValue: null,
  normalizedValue: { status: "ABSENT", searchedSelectors: ["head > title"] },
  provenance: { parentEvidenceIds: ["EV2_..._DOM_ROOT_1"], derivation: "title-extractor@2" }
}
```

부재 판정에는 탐색 범위, sourceType, extractorVersion이 반드시 포함되어야 한다. `해당 요소 없음`이라는 문자열만 저장하지 않는다.

## 8. selector와 textSpan 규칙

- DOM 요소: 안정적인 CSS selector와 동일 tag의 ordinal을 저장한다.
- 본문 의미 판정: normalized main text의 offset과 짧은 quote를 모두 저장한다.
- quote는 입력에 정확히 존재해야 하며 hash로 검증한다.
- 전체 개인정보·긴 본문을 evidence excerpt에 복제하지 않는다.
- selector가 rendered DOM에만 존재하면 sourceType을 `RENDERED_DOM`으로 고정한다.

## 9. confidence 의미

| 범위 | 의미 | Rule 처리 |
|---|---|---|
| 0.95~1.00 | 직접 관측·정확한 parser | FACT 판정 가능 |
| 0.80~0.94 | deterministic derivation이나 일부 정규화 | 판정 가능, 상세에 confidence 표시 |
| 0.60~0.79 | 후보 분류 또는 불완전 입력 | UNKNOWN 우선 |
| <0.60 | 신뢰 불충분 | 점수 판정 금지 |

Semantic evaluator의 confidence는 원문 quote 요구를 대체하지 않는다.

## 10. Page Type Evidence

```ts
type PageType =
  | "HOMEPAGE" | "ARTICLE_BLOG" | "PRODUCT" | "SERVICE"
  | "CATEGORY_LISTING" | "DOCUMENTATION" | "LANDING_PAGE"
  | "CONTACT_ABOUT" | "UTILITY_AUTH" | "UNKNOWN";

interface PageTypeFact {
  primary: PageType;
  assignment: "AUTO_ASSIGNED" | "PROVISIONAL" | "UNKNOWN";
  candidates: Array<{ type: PageType; confidence: number }>;
  evidenceIds: string[];
  classifierVersion: string;
}
```

- confidence ≥0.85는 `AUTO_ASSIGNED`이며 page-type N/A 정책을 자동 적용할 수 있다.
- 0.60~0.84는 `PROVISIONAL`이며 applicability가 유형에 따라 달라지는 Check를 UNKNOWN 처리할 수 있다.
- <0.60은 `UNKNOWN`으로 저장하고 자동 N/A를 금지한다.
- URL path만으로 page type을 확정하지 않는다.

## 11. Semantic Evidence 계약

Semantic 결과는 최소 다음을 포함한다.

```ts
interface SemanticEvidence {
  rubricId: string;
  result: "PASS" | "WARN" | "FAIL" | "UNKNOWN" | "NOT_EVALUATED";
  supportingQuotes: Array<{ evidenceId: string; textSpan: TextSpan }>;
  contradictingQuotes?: Array<{ evidenceId: string; textSpan: TextSpan }>;
  explanation: string;
  prohibitedInferenceCheck: "PASS" | "FAIL";
}
```

- PASS/FAIL은 rubric이 요구한 최소 quote 수를 충족하지 못하면 무효다.
- scoring v2는 외부 citation의 URL·anchor·DOM location Fact까지만 측정한다.
- 외부 출처 품질/claim support는 Semantic v2.1 범위다. target page Evidence가 없으면 UNKNOWN 또는 엔진 미구현 시 NOT_EVALUATED다.
- 저자 전문성은 byline만으로 PASS하지 않는다.
- 생성 모델의 일반지식을 evidence로 취급하지 않는다.

## 12. 보안과 보존

- cookie, authorization, API key, 전체 request header는 저장하지 않는다.
- raw HTML snapshot은 private storage에 두고 UI에는 제한된 excerpt만 제공한다.
- 전화번호·이메일 등 개인정보는 evidence 표시 전에 redaction 정책을 적용한다.
- 외부 페이지 콘텐츠는 출처 URL, fetch 시점, hash와 함께 제한적으로 보존한다.
- prompt injection 문자열은 페이지 데이터로 취급하며 evaluator instruction으로 승격하지 않는다.

## 13. 검증 조건

- 동일 snapshot 재추출 시 Fact ID와 normalizedValue가 동일하다.
- 한 underlying fact가 extractor별로 중복 생성되지 않는다.
- 모든 RuleResult가 최소 하나의 Fact ID 또는 명시적 NOT_EVALUATED 사유를 가진다.
- ABSENT/INVALID/UNKNOWN이 서로 바뀌지 않는다.
- textSpan quote가 contentHash의 normalized text에서 검증된다.
- Semantic PASS/FAIL이 최소 quote requirement를 만족한다.
