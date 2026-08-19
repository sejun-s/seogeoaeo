# CiteGraph Final Rule Registry Draft

> 상태: scoring v2 구현 전 승인 대기  
> 방법론: `methodology-v2-draft.2`  
> 코드/UI/LLM API 미적용

## 1. 핵심 계약

```text
Evidence/Fact 1회 추출
→ Atomic Check: 한 질문에 한 판정, Weight 없음
→ Scoring Rule: 하나 이상의 Atomic Check 조합, Weight 보유
→ SEO Score 또는 GEO Technical/Semantic Readiness
```

- Atomic Check마다 Weight를 부여하지 않는다.
- SEO Score 100에는 FACT/validator Scoring Rule만 포함한다.
- SEO semantic quality는 `SEO_ADVISORY`, Weight 0이다.
- GEO Technical Readiness와 GEO Semantic Readiness는 각각 독립 0~100으로 표시한다.
- Fact 40/Semantic 60 결합은 calibration 가설일 뿐 공식 점수가 아니다.
- 동일 Fact는 Evidence Layer에 한 번만 저장하고 여러 check가 Fact ID를 참조한다.

## 2. Page Type 계약

| type | 설명 |
|---|---|
| HOMEPAGE | 사이트 대표 페이지 |
| ARTICLE_BLOG | 기사·블로그·editorial content |
| PRODUCT | 제품 상세 |
| SERVICE | 서비스 상세 |
| CATEGORY_LISTING | 목록·분류 페이지 |
| DOCUMENTATION | guide·reference·기술 문서 |
| LANDING_PAGE | 캠페인·전환 중심 페이지 |
| CONTACT_ABOUT | 회사·사람·연락 정보 |
| UTILITY_AUTH | 로그인·계정·도구·상태 화면 |
| UNKNOWN | 유형 확정 불가 |

```ts
interface PageTypeResult {
  type: PageType;
  confidence: number;
  assignment: "AUTO_ASSIGNED" | "PROVISIONAL" | "UNKNOWN";
  alternatives: Array<{ type: PageType; confidence: number }>;
  evidenceIds: string[];
}
```

- `>=0.85`: AUTO_ASSIGNED
- `0.60~0.84`: PROVISIONAL. 유형에 따라 applicability가 달라지는 check는 UNKNOWN 가능
- `<0.60`: UNKNOWN. 자동 N/A 금지

## 3. Atomic Check Registry

공통 필드: `methodologyVersion=methodology-v2-draft.2`. `appliesTo=ALL`은 명시적 excludedFrom을 제외한 모든 유형이다. N/A는 appliesTo 밖으로 확정된 경우에만 사용한다.

### 3.1 SEO Atomic Checks — 34개

| atomicCheckId | atomicCheck / Engine | appliesTo · excludedFrom · N/A reason | factDependencies / evidence | PASS · WARN · FAIL | UNKNOWN · NOT_EVALUATED | Grade / status |
|---|---|---|---|---|---|---|
| AC-SEO-HTTPS | 최종 URL이 HTTPS인가 / FACT | ALL · 없음 · N/A 없음 | FACT-URL-FINAL, redirect evidence | HTTPS · redirect policy 경고 · HTTP | fetch 실패 · Fetcher 미실행 | A / ACTIVE |
| AC-SEO-CANON-PRESENT | canonical 선언이 있는가 / FACT | ALL · 정책상 일부 UTILITY · canonical 비적용 | FACT-CANONICAL, ABSENT evidence | 단일 존재 · 복수 · 누락 | page type/context 불명 · extractor 미실행 | A / ACTIVE |
| AC-SEO-CANON-VALID | canonical URL이 유효한가 / FACT | canonical 존재 page · 없음 · 선언 없음은 선행 check | FACT-CANONICAL raw/resolved | valid HTTP(S) · 정규화 경고 · parse/scheme 오류 | base URL 부족 · validator 미실행 | A / ACTIVE |
| AC-SEO-ROBOTS-PARSE | robots directive 파싱 가능한가 / FACT | ALL · 없음 · directive 없음은 정상 기본 상태 | FACT-ROBOTS source/tokens | 모두 valid · unknown token · parse 불가 | header 누락 · parser 미실행 | A / ACTIVE |
| AC-SEO-ROBOTS-CONFLICT | robots 지시가 충돌하는가 / FACT | directive page · directive 없음 · 지시 없음 | FACT-ROBOTS effective UA | 충돌 없음 · 중복 동일 효과 · 충돌 | UA/header 불명 · merger 미실행 | A / ACTIVE |
| AC-SEO-LANG-PRESENT | html lang이 있는가 / FACT | ALL · 없음 · N/A 없음 | FACT-LANG selector/ABSENT | 존재 · 공백 · 누락 | DOM 불완전 · extractor 미실행 | A / ACTIVE |
| AC-SEO-LANG-VALID | lang code가 유효한가 / FACT | lang 존재 page · 없음 · lang 누락은 선행 FAIL | FACT-LANG normalized | BCP47 valid · deprecated normalize 가능 · invalid | parser 불명 · validator 미실행 | A / ACTIVE |
| AC-SEO-TITLE-PRESENT | title이 있는가 / FACT | ALL · 없음 · N/A 없음 | FACT-TITLE selector/ABSENT | non-empty · placeholder · missing | DOM 불완전 · extractor 미실행 | A / ACTIVE |
| AC-SEO-TITLE-LENGTH | title 길이가 언어·유형 heuristic 범위인가 / FACT | title page · 없음 · title 누락은 선행 FAIL | FACT-TITLE length + page type/lang | calibrated range · boundary · extreme | profile 없음 · heuristic 비활성 | D / EXPERIMENTAL |
| AC-SEO-TITLE-UNIQUE | title이 site corpus에서 고유한가 / FACT | site crawl 가능 page · 단일 URL audit · corpus 없음 | FACT-TITLE + corpus IDs | unique · near duplicate · repeated exact | corpus 부족 · site crawl 미실행 | A / DEFERRED_INPUT |
| AC-SEO-TITLE-TOPIC | title이 page topic과 일치하는가 / SEMANTIC | ALL · 없음 · N/A 없음 | TITLE,H1,MAIN quote≥2 | rubric PASS · WARN · FAIL | topic 불명 · semantic 미실행 | A / ADVISORY |
| AC-SEO-META-PRESENT | meta description이 있는가 / FACT | ALL · 일부 UTILITY · meta 비적용 | FACT-META-DESC | non-empty · placeholder · missing | DOM 불완전 · extractor 미실행 | A / ACTIVE |
| AC-SEO-META-LENGTH | meta 길이가 언어·유형 heuristic 범위인가 / FACT | meta page · 없음 · 누락은 선행 FAIL | META length + type/lang | calibrated · boundary · extreme | profile 없음 · heuristic 비활성 | D / EXPERIMENTAL |
| AC-SEO-META-UNIQUE | meta가 site corpus에서 고유한가 / FACT | site crawl 가능 page · 단일 URL audit · corpus 없음 | META + corpus IDs | unique · near duplicate · repeated | corpus 부족 · site crawl 미실행 | A / DEFERRED_INPUT |
| AC-SEO-META-TOPIC | meta가 본문을 사실적으로 요약하는가 / SEMANTIC | meta 적용 page · 없음 · meta N/A | META,MAIN quote≥2 | rubric PASS · WARN · FAIL | content 불명 · semantic 미실행 | A / ADVISORY |
| AC-SEO-H1-PRESENT | 대표 H1이 있는가 / FACT | ALL · 일부 UTILITY · H1 비적용 | FACT-HEADING-NODE | non-empty H1 · empty/multiple-only · missing | rendered DOM 불명 · extractor 미실행 | C / ACTIVE |
| AC-SEO-H1-COUNT | H1 수가 명확한가 / FACT | H1 적용 page · 없음 · H1 N/A | HEADING nodes | one · multiple · none | component scope 불명 · counter 미실행 | C / EXPERIMENTAL |
| AC-SEO-HEADING-LEVEL | heading outline이 구조적으로 유효한가 / FACT | content pages · 짧은 UTILITY · heading 불필요 | FACT-HEADING-OUTLINE | valid · minor skip · unusable | rendered outline 불명 · derivation 미실행 | C / ACTIVE |
| AC-SEO-HEADING-TOPIC | heading이 section을 대표하는가 / SEMANTIC | heading page · 짧은 UTILITY · heading 불필요 | HEADING+SECTION quote pairs | rubric PASS · WARN · FAIL | mapping 실패 · semantic 미실행 | C / ADVISORY |
| AC-SEO-NOINDEX | effective noindex가 있는가 / FACT | ALL · 없음 · N/A 없음 | FACT-ROBOTS effective | 없음 · UA별 혼합 · 있음 | header/UA 불명 · parser 미실행 | A / ACTIVE |
| AC-SEO-INDEX-INTENT | 페이지가 색인 대상인가 / VALIDATOR | ALL · 없음 · N/A 없음 | FACT-PAGE-TYPE + audit intent | intent known · provisional · conflict/invalid manifest | purpose 불명 · applicability 미실행 | C / ACTIVE |
| AC-SEO-NOFOLLOW | effective page nofollow/none이 있는가 / FACT | ALL · 없음 · N/A 없음 | FACT-ROBOTS effective | 없음 · UA별 혼합 · 있음 | header/UA 불명 · parser 미실행 | A / ACTIVE |
| AC-SEO-CANON-RELATION | canonical target 관계가 적절한가 / VALIDATOR | canonical page · canonical N/A · context상 미적용 | CANONICAL,URL,duplicate corpus | representative · review · wrong | duplicate/context 부족 · evaluator 미실행 | A / CONTEXT_REQUIRED |
| AC-SEO-SCHEMA-SYNTAX | structured data 문법이 유효한가 / FACT | markup page · schema 비적용 page · 적용 type 없음 | SCHEMA-BLOCK parser errors | valid · unsupported/partial · parse error | extractor incomplete · parser 미실행 | A / ACTIVE |
| AC-SEO-SCHEMA-TYPE | schema type이 page type과 호환되는가 / VALIDATOR | schema 적용 page · 일부 UTILITY · 적용 type 없음 | SCHEMA-NODE + PAGE-TYPE | compatible · provisional · invalid/incompatible | page type 불명 · validator 미실행 | A / ACTIVE |
| AC-SEO-SCHEMA-REQUIRED | required property가 완전한가 / VALIDATOR | supported type page · type 없음 · schema N/A | SCHEMA-VALIDATION | complete · recommended missing · required missing | validator spec 없음 · validator 미실행 | A / ACTIVE |
| AC-SEO-SCHEMA-VISIBLE | schema가 visible content와 일치하는가 / SEMANTIC | schema page · schema N/A · 적용 없음 | schema+DOM quote≥2 | rubric PASS · WARN · FAIL | mapping 불명 · semantic 미실행 | A / ADVISORY |
| AC-SEO-BODY-AMOUNT | page type 대비 main text가 충분한가 / FACT | public content · UTILITY_AUTH · text 비핵심 | MAIN-TEXT length+type/lang profile | calibrated sufficient · boundary · thin | type/render 불명 · heuristic 미실행 | D / EXPERIMENTAL |
| AC-SEO-INTERNAL-CRAWL | crawlable 내부 링크가 있는가 / FACT | public content · terminal UTILITY · 독립 terminal | LINK-INTERNAL URLs | type profile pass · limited · needed but absent | site boundary 불명 · extractor 미실행 | A / ACTIVE |
| AC-SEO-INTERNAL-CONTEXT | anchor/context가 target을 설명하는가 / SEMANTIC | internal link page · terminal UTILITY · link 불필요 | source+target quote≥2 | rubric PASS · WARN · FAIL | target 없음 · external/semantic 미실행 | A / ADVISORY |
| AC-SEO-ALT-PRESENCE | 적용 이미지에 alt 속성이 있는가 / FACT | image page · 이미지 없음 · no images | FACT-IMAGE selector/role hint/alt | all applicable have attribute · partial · missing critical | role 불명 · extractor 미실행 | A / ACTIVE |
| AC-SEO-ALT-QUALITY | 이미지 역할에 alt가 적합한가 / SEMANTIC | image page · 이미지 없음/전부 장식 · no applicable images | IMAGE+context quote≥2 | rubric PASS · WARN · FAIL | role 불명 · semantic/image 미실행 | A / ADVISORY |
| AC-SEO-DATE-APPLICABLE | 날짜가 필요한 page type인가 / VALIDATOR | ARTICLE_BLOG,DOCUMENTATION 우선; 나머지 조건부 · 시간 비민감 page · 날짜 불필요 | PAGE-TYPE + content intent | applicable/no date need correctly classified · provisional · policy conflict | type 0.60~0.84 · classifier 미실행 | C / ACTIVE |
| AC-SEO-DATE-PRESENT | 필요한 날짜 신호가 존재·유효한가 / FACT | date applicable page · date N/A · 날짜 불필요 | FACT-DATE values/types | valid typed date · partial/inconsistent · missing/invalid | meaning 불명 · extractor 미실행 | C / ACTIVE |

### 3.2 GEO_FACT Atomic Checks — 12개

| atomicCheckId | atomicCheck / Engine | applicability | factDependencies / evidence | PASS · WARN · FAIL | UNKNOWN · NOT_EVALUATED | Grade / status |
|---|---|---|---|---|---|---|
| AC-GF-QSTRUCT | 질문 section candidate가 있는가 / FACT | answer-oriented page; UTILITY와 비질문 page N/A | HEADING/QUESTION selector | exists · weak candidate · absent when applicable | type/lang 불명 · extractor 미실행 | D / EXPERIMENTAL |
| AC-GF-LISTTABLE | list/table 구조가 추출되는가 / FACT | 비교·단계·열거 content; 그 외 N/A | DOM structure+labels | structured · incomplete labels · absent when needed | intent 불명 · extractor 미실행 | C / ACTIVE |
| AC-GF-LANDMARK | main landmark가 핵심 text를 포함하는가 / FACT | public content; 특수 UTILITY 조건부 | LANDMARK+MAIN coverage | high coverage · partial · main unidentified | rendered DOM 불명 · extractor 미실행 | A / ACTIVE |
| AC-GF-RAWCONTENT | raw HTML에 핵심 본문이 있는가 / FACT | public content; private UTILITY N/A | RAW MAIN excerpt/hash | present · partial · shell/absent | core text 불명 · raw extractor 미실행 | C / ACTIVE |
| AC-GF-RENDERDEP | 핵심 본문이 rendering에 과도하게 의존하는가 / FACT | ALL | RENDER-DIFF raw/render ratio | low dependency · medium · high | rendered snapshot 없음 · renderer 미실행 | C / EXPERIMENTAL |
| AC-GF-ACCESS | 접근 장벽이 핵심 본문을 막는가 / FACT | public content; intended private UTILITY N/A | HTTP/redirect/barrier evidence | accessible · partial wall · blocked | region/session 불명 · evaluator 미실행 | C / ACTIVE |
| AC-GF-AUTHOR | 저자/검토자 identity가 있는가 / FACT | ARTICLE_BLOG,DOCUMENTATION; 기타 조건부/N/A | AUTHOR signals | present · incomplete/conflict · absent when applicable | type 불명 · extractor 미실행 | C / ACTIVE |
| AC-GF-DATE | typed date provenance가 있는가 / FACT | time-sensitive page; 나머지 N/A | DATE values/source | present+typed · partial · absent when applicable | type/meaning 불명 · extractor 미실행 | C / ACTIVE |
| AC-GF-PUBLISHER | publisher identity signal이 있는가 / FACT | public content; 개인 content 대체 정책 | PUBLISHER visible/schema IDs | present · partial · absent | identity parse 불명 · extractor 미실행 | C / ACTIVE |
| AC-GF-CITEURL | citation candidate가 유효 HTTP(S) URL인가 / FACT | claim/citation page; claim 없음 N/A | EXTERNAL LINK scheme/anchor/location | valid URL · unresolved · tel/mailto/js/broken syntax | URL parse 불명 · validator 미실행 | A / ACTIVE |
| AC-GF-CITEPROX | citation이 claim candidate 가까이에 있는가 / FACT | claim candidate page; claim 없음 N/A | CLAIM candidate+DOM location | same sentence/paragraph · same section · remote/absent | claim confidence 낮음 · derivation 미실행 | D / EXPERIMENTAL |
| AC-GF-ENTITY | 핵심 entity signals가 추출되는가 / FACT | entity-centered public page; 비핵심 UTILITY N/A | ENTITY signals by source | multi-source · single-source · absent | topic 불명 · extractor 미실행 | C / ACTIVE |

### 3.3 GEO_SEMANTIC Atomic Checks — 15개

외부 target fetch가 필요한 `SOURCE_SUPPORT`, `SOURCE_QUALITY`, 외부 저자 전문성은 v2.1로 연기한다. v2에서는 항상 NOT_EVALUATED이며 Technical/Semantic Readiness 분모에 넣지 않는다.

| atomicCheckId | atomicCheck | applicability / evidence | PASS · WARN · FAIL | UNKNOWN · NOT_EVALUATED | Grade / status |
|---|---|---|---|---|---|
| AC-GS-ANSWER-DIRECT | 핵심 질문에 바로 답하는가 | answer page; question+answer quote≥2 | rubric 결과 | question 불명 · engine 미실행 | B / V2_CANDIDATE |
| AC-GS-ANSWER-COMPLETE | 답이 핵심 조건을 포함하는가 | answer page; question+answer quotes≥3 | rubric 결과 | scope 불명 · engine 미실행 | B / V2_CANDIDATE |
| AC-GS-QA-ALIGN | 질문 heading과 section이 정렬되는가 | question section; quote≥2 | rubric 결과 | boundary 불명 · engine 미실행 | D / EXPERIMENTAL |
| AC-GS-STRUCTFIT | list/table 형식이 내용에 적합한가 | structured candidate; element+context quote≥2 | rubric 결과 | purpose 불명 · engine 미실행 | C / V2_CANDIDATE |
| AC-GS-METACLARITY | title/meta/H1이 같은 topic/entity를 표현하는가 | public content; metadata+body quote≥3 | rubric 결과 | topic 불명 · engine 미실행 | C / V2_CANDIDATE |
| AC-GS-AUTHOR-ACCOUNT | 저자/검토자와 역할이 확인되는가 | author applicable; byline+role quote≥2 | rubric 결과 | identity 불명 · engine 미실행 | C / V2_CANDIDATE |
| AC-GS-AUTHOR-EXPERT | 저자 전문성이 외부 검증되는가 | relevant content; internal+external quote | rubric 결과 | external 부족 · v2 target/external fetch 제외 | C / V2_1_DEFERRED |
| AC-GS-FRESHNESS | 시간 민감도 대비 내용이 최신인가 | time-sensitive; date+content/history quote | rubric 결과 | history 부족 · v2 history engine 제외 시 NE | C / V2_1_DEFERRED |
| AC-GS-PUBLISHER | visible/schema publisher가 일관되는가 | public content; internal identity quote≥2 | rubric 결과 | identity 불명 · engine 미실행 | C / V2_CANDIDATE |
| AC-GS-CLAIMCOVER | 주요 claim에 citation 후보가 연결되는가 | claim page; claim/citation quotes | rubric 결과 | claim detection 낮음 · engine 미실행 | B / V2_CANDIDATE |
| AC-GS-SOURCESUPPORT | target source가 claim을 지지하는가 | citation target snapshot 필수 | rubric 결과 | target 없음 · v2 외부 fetch 제외 | B / V2_1_DEFERRED |
| AC-GS-SOURCEQUALITY | source가 관련 원출처인가 | target provenance 필수 | rubric 결과 | target/provenance 없음 · v2 외부 fetch 제외 | B/C / V2_1_DEFERRED |
| AC-GS-ENTITYCONSIST | signals가 같은 entity를 가리키는가 | entity page; 서로 다른 source quote≥2 | rubric 결과 | resolution 불명 · engine 미실행 | C / V2_CANDIDATE |
| AC-GS-CLARITY | 핵심 문장이 명료한가 | text content; quotes≥2 | rubric 결과 | text/lang 불명 · engine 미실행 | C / V2_CANDIDATE |
| AC-GS-COHERENCE | section이 논리적으로 연결되는가 | multi-section page; section quotes≥2 | rubric 결과 | extraction 불명 · engine 미실행 | C / V2_CANDIDATE |

Atomic Check 총수: **61개**(SEO 34 + GEO_FACT 12 + GEO_SEMANTIC 15). 기존 58개 초안에서 이미지 alt의 속성/의미, noindex Fact/페이지 intent, 날짜 applicability/존재를 각각 분리하면서 3개 증가했다.

## 4. Scoring Rule Registry

### 4.1 SEO Score — FACT/Validator만 100

| ruleId | displayName | scoreDomain / category / engineType | atomicChecks | PASS/WARN/FAIL/N/A/UNKNOWN/NE | maxWeight | Grade / Weight confidence | rationale / recommendation | status |
|---|---|---|---|---|---:|---|---|---|
| SR-SEO-HTTPS | HTTPS 제공 | SEO / Technical / FACT | AC-SEO-HTTPS | check 상태 승계 | 5 | A / Medium | 안전한 최종 URL / HTTPS 전환 | PROVISIONAL_WEIGHT |
| SR-SEO-CANON-DECL | Canonical 선언 건전성 | SEO / Technical / FACT | CANON-PRESENT+VALID | 둘 다 PASS / 일부 WARN / invalid·required missing / non-applicable / context missing / extractor NE | 4 | A / Low | 존재 하나에 고배점 금지 / 단일 유효 canonical | PROVISIONAL_WEIGHT |
| SR-SEO-ROBOTS | Robots 지시 건전성 | SEO / Technical / FACT | ROBOTS-PARSE+CONFLICT | 조합 | 6 | A / Medium | 명시적 directive 오류 방지 | PROVISIONAL_WEIGHT |
| SR-SEO-LANGUAGE | 언어 선언 | SEO / Technical / FACT | LANG-PRESENT+VALID | 조합 | 5 | A / Low | language fact | PROVISIONAL_WEIGHT |
| SR-SEO-TITLE | Title 기본기 | SEO / On-page / FACT | TITLE-PRESENT+LENGTH+UNIQUE | semantic topic 제외; UNKNOWN component는 coverage 감소 | 8 | A/D / Low | 존재·heuristic·site uniqueness / title 개선 | PROVISIONAL_WEIGHT |
| SR-SEO-META | Meta description 기본기 | SEO / On-page / FACT | META-PRESENT+LENGTH+UNIQUE | semantic topic 제외 | 6 | A/D / Low | snippet input / description 개선 | PROVISIONAL_WEIGHT |
| SR-SEO-H1 | H1 기본기 | SEO / On-page / FACT | H1-PRESENT+COUNT | 조합 | 6 | C / Low | 대표 heading signal | PROVISIONAL_WEIGHT |
| SR-SEO-HEADING | Heading 구조 | SEO / On-page / FACT | HEADING-LEVEL | check 승계 | 5 | C / Medium | outline quality, semantic 제외 | PROVISIONAL_WEIGHT |
| SR-SEO-NOINDEX | Indexing gate | SEO / Indexability / HYBRID-validator | NOINDEX+INDEX-INTENT | intent 일치 PASS; provisional WARN; 의도 불일치 FAIL; N/A 없음; intent 부족 UNKNOWN | 12 | A / Medium | 최대 12점 승인 / noindex 의도 정리 | PROVISIONAL_WEIGHT |
| SR-SEO-NOFOLLOW | Page follow 정책 | SEO / Indexability / HYBRID-validator | NOFOLLOW+INDEX-INTENT | 조합 | 5 | A / Low | page-level link policy | PROVISIONAL_WEIGHT |
| SR-SEO-CANON-REL | Canonical 관계 | SEO / Indexability / VALIDATOR | CANON-RELATION | context 부족 UNKNOWN | 5 | A / Low | canonical 총 weight 제한·재검토 | PROVISIONAL_WEIGHT |
| SR-SEO-SCHEMA-SYNTAX | Schema 문법 | SEO / Structured Data / FACT | SCHEMA-SYNTAX | check 승계 | 5 | A / Medium | parser gate | PROVISIONAL_WEIGHT |
| SR-SEO-SCHEMA-TYPE | Schema 유형 | SEO / Structured Data / VALIDATOR | SCHEMA-TYPE | check 승계 | 4 | A / Low | page type compatibility | PROVISIONAL_WEIGHT |
| SR-SEO-SCHEMA-REQUIRED | Schema 필수 속성 | SEO / Structured Data / VALIDATOR | SCHEMA-REQUIRED | check 승계 | 6 | A / Medium | explicit validator result | PROVISIONAL_WEIGHT |
| SR-SEO-BODY | Main text 기본량 | SEO / Content Basics / FACT | BODY-AMOUNT | type/lang profile; uncertain UNKNOWN | 6 | D / Low | hard threshold 금지 | EXPERIMENTAL_WEIGHT |
| SR-SEO-INTERNAL | 내부 탐색 경로 | SEO / Content Basics / FACT | INTERNAL-CRAWL | check 승계 | 5 | A / Low | count hard threshold 금지 | PROVISIONAL_WEIGHT |
| SR-SEO-ALT | Alt 속성 Coverage | SEO / Content Basics / FACT | ALT-PRESENCE | 이미지 없음 N/A; semantic quality 제외 | 4 | A / Low | alt attribute fact | PROVISIONAL_WEIGHT |
| SR-SEO-DATE | 날짜 신호 | SEO / Content Basics / VALIDATOR | DATE-APPLICABLE+DATE-PRESENT | applicable 조합; 불필요 N/A; type 불명 UNKNOWN | 3 | C / Low | page type aware | PROVISIONAL_WEIGHT |

SEO category 합계: Technical 20 + On-page 25 + Indexability 22 + Structured Data 15 + Content Basics 18 = **100**.

### 4.2 SEO Advisory — Weight 0

| advisoryId | Atomic Check | 표시 목적 |
|---|---|---|
| ADV-SEO-TITLE-TOPIC | AC-SEO-TITLE-TOPIC | title 의미 일치 |
| ADV-SEO-META-TOPIC | AC-SEO-META-TOPIC | description 사실성 |
| ADV-SEO-HEADING-TOPIC | AC-SEO-HEADING-TOPIC | heading의 section 대표성 |
| ADV-SEO-SCHEMA-VISIBLE | AC-SEO-SCHEMA-VISIBLE | schema와 visible content 일치 |
| ADV-SEO-INTERNAL-CONTEXT | AC-SEO-INTERNAL-CONTEXT | anchor/target 문맥 |
| ADV-SEO-ALT-QUALITY | AC-SEO-ALT-QUALITY | 이미지 역할과 대안 적합성 |

### 4.3 GEO Technical Readiness — 독립 0~100

12개 Fact check를 8개 Scoring Rule로 묶는다. 아래 raw maxWeight 합 40은 provisional envelope이며 화면에서는 applicable measured weight 기준의 독립 Technical Readiness와 coverage를 표시한다.

| ruleId | Atomic Checks | raw maxWeight | Confidence | 상태 |
|---|---|---:|---|---|
| SR-GF-ANSWER-STRUCT | QSTRUCT+LISTTABLE | 4 | Low | PROVISIONAL |
| SR-GF-LANDMARK | LANDMARK | 4 | Medium | PROVISIONAL |
| SR-GF-RAW-ACCESS | RAWCONTENT+RENDERDEP | 11 | Low | PROVISIONAL |
| SR-GF-BARRIER | ACCESS | 5 | Medium | PROVISIONAL |
| SR-GF-AUTHOR-DATE | AUTHOR+DATE | 5 | Low | PROVISIONAL |
| SR-GF-PUBLISHER | PUBLISHER | 3 | Low | PROVISIONAL |
| SR-GF-CITATION | CITEURL+CITEPROX | 6 | Low | PROVISIONAL |
| SR-GF-ENTITY | ENTITY | 2 | Low | PROVISIONAL |

```text
GEO Technical Readiness = earnedApplicableFactWeight / measuredApplicableFactWeight × 100
coverage = measuredApplicableFactWeight / applicableFactWeight
```

UNKNOWN/NOT_EVALUATED은 measured 분모에서 빠지지만 coverage를 낮춘다. N/A만 applicable 분모에서 제외한다.

### 4.4 GEO Semantic Readiness — 독립 0~100

Semantic v2 범위의 check만 독립 점수 후보가 된다. v2.1 deferred check는 분모에 넣지 않는다. 60 envelope는 calibration 가설이며 확정 공식이 아니다.

| ruleId | Atomic Checks | provisional raw maxWeight | Confidence | v2 상태 |
|---|---|---:|---|---|
| SR-GS-ANSWER | ANSWER-DIRECT+ANSWER-COMPLETE+QA-ALIGN | 12 | Low | CANDIDATE |
| SR-GS-STRUCTURE | STRUCTFIT | 3 | Low | CANDIDATE |
| SR-GS-METADATA | METACLARITY | 3 | Low | CANDIDATE |
| SR-GS-AUTHOR | AUTHOR-ACCOUNT | 4 | Low | CANDIDATE |
| SR-GS-PUBLISHER | PUBLISHER | 4 | Low | CANDIDATE |
| SR-GS-CLAIM-COVER | CLAIMCOVER | 5 | Low | CANDIDATE |
| SR-GS-ENTITY | ENTITYCONSIST | 4 | Low | CANDIDATE |
| SR-GS-CONTENT | CLARITY+COHERENCE | 8 | Low | CANDIDATE |
| SR-GS-EXTERNAL-v2.1 | AUTHOR-EXPERT+FRESHNESS+SOURCESUPPORT+SOURCEQUALITY | 17 | Experimental | DEFERRED, v2 weight 0 |

v2 candidate raw 합은 43이다. `60`으로 재환산해 공식 Overall을 만들지 않는다. Semantic Readiness는 measured candidate check 안에서 독립 0~100과 coverage만 제시한다.

## 5. 중복 Fact 통제

| Fact | 저장 | Scoring 사용 |
|---|---|---|
| title/meta | FACT-TITLE/FACT-META 1회 | SEO Fact Rule; GEO는 semantic 입력만 |
| lang | FACT-LANG 1회 | SEO 점수만; GEO machine input |
| heading | NODE/OUTLINE 1회 | SEO outline 점수; GEO question/section input |
| schema | BLOCK/NODE/VALIDATION 1회 | SEO validator 점수; GEO entity input |
| date | FACT-DATE 1회 | SEO applicability와 GEO provenance가 참조. 두 축 중복 배점 여부 calibration 필수 |
| main text | FACT-MAIN-TEXT 1회 | SEO amount; GEO raw/render라는 다른 질문 |
| external link | FACT-LINK 1회 | GEO citation URL/location만 v2 평가 |

## 6. 확정/미확정 경계

확정:

- Atomic Check와 Scoring Rule 분리
- SEO semantic Advisory화
- page type confidence contract
- external target fetch와 support/authority는 v2.1
- 동일 Fact 1회 저장

아직 calibration 필요:

- 모든 provisional Weight
- GEO Fact 40/Semantic 60 envelope
- 언어·page type별 길이 profile
- date Fact의 축간 배점 중복
- canonical relation 5점

승인 전 scoring v2 코드에 적용하지 않는다.
