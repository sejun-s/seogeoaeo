# CiteGraph Scoring Methodology v1

> 문서 상태: 검토안 — 코드 미적용  
> 방법론 버전: `methodology-v1-draft`  
> 기준 구현: `citegraph-app/lib/audit.ts` (`rulesetVersion: 2026.08.1`)  
> 범위: SEO Score 및 GEO Readiness Score  
> 중요: 이 문서는 다음 scoring 버전을 위한 공식 검토 기준이다. 현재 Rule, Weight, PASS/WARN/FAIL 계산식은 변경하지 않았다.

## 1. 목적과 해석 원칙

CiteGraph는 점수보다 관측 사실과 판정 근거를 우선한다. 사용자는 모든 결과를 다음 순서로 추적할 수 있어야 한다.

```text
Score → Category → Rule → Evidence → Recommendation
```

- **SEO Score**는 가능한 한 FACT Engine의 결정론적 측정으로 구성한다.
- **GEO Readiness Score**는 페이지가 AI Search/Generative Search에 기술적·의미적으로 준비된 정도다. Gemini, ChatGPT Search, Perplexity 등의 실제 노출·인용 측정값이 아니다.
- `존재한다`와 `품질이 좋다`를 같은 판정으로 취급하지 않는다.
- FACT 판정은 동일 snapshot과 extractor version에서 동일해야 한다.
- SEMANTIC 판정은 고정 rubric, 인용 가능한 원문 span, model/prompt version 없이는 점수에 포함하지 않는다.
- HYBRID Rule은 Fact sub-check와 Semantic sub-check를 각각 보존한다.

## 2. 공통 상태 계약

현재 코드는 `PASS / WARN / FAIL`만 지원한다. 아래 세 상태는 방법론 v1의 **차기 적용안**이며 아직 코드와 점수에 반영되지 않았다.

| 상태 | 정의 | 점수 처리 제안 |
|---|---|---|
| PASS | 필요한 입력을 관측했고 기준을 충족 | 배점 100% |
| WARN | 필요한 입력을 관측했지만 일부 기준만 충족 | 배점 50%; Rule별 예외 금지 |
| FAIL | 필요한 입력을 관측했고 기준을 명확히 위반 | 0% |
| N/A | 페이지 유형상 Rule을 적용할 이유가 없음 | 분모 제외, 제외 이유 표시 |
| UNKNOWN | 적용 대상이지만 필요한 입력이나 외부 관측이 부족 | 점수 미산입, coverage 감소 |
| NOT_EVALUATED | 필요한 엔진이 실행되지 않음 | 점수 미산입, engine/실행 사유 표시 |

`UNKNOWN`이나 `NOT_EVALUATED`를 분모에서 조용히 제외해 점수를 100점으로 확대하지 않는다. 점수 옆에 measured weight와 coverage를 함께 표시한다.

## 3. 엔진과 근거 등급

| 값 | 의미 |
|---|---|
| FACT | HTML, HTTP, DOM 또는 외부 API의 명시적 값만으로 재현 가능 |
| SEMANTIC | 문장 의미, 관련성, 품질, 신뢰성 판단이 핵심 |
| HYBRID | Fact와 Semantic/Validator 판정이 모두 필요 |

| 등급 | 의미 |
|---|---|
| A | 검색엔진 공식 문서 또는 웹 표준 |
| B | peer-reviewed 논문 또는 학술·실증 연구 |
| C | 업계 best practice |
| D | CiteGraph 자체 heuristic |

등급은 Rule의 **현재 판정식 전체**를 기준으로 한다. 목적이 공식 문서로 지지되더라도 임의 길이·개수 threshold가 판정을 지배하면 D로 평가한다.

## 4. 근거 출처 목록

- **S1** — [Google: Title links](https://developers.google.com/search/docs/appearance/title-link): 페이지별 title, 간결하고 설명적인 제목, 고정 길이 제한 없음.
- **S2** — [Google: Search snippets와 meta description](https://developers.google.com/search/docs/appearance/snippet): 관련성 있고 고유한 설명 권장, 고정 길이 제한 없음.
- **S3** — [Google: Canonical URL](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls): canonical 신호와 구현 방법.
- **S4** — [Google: Robots meta와 X-Robots-Tag](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag): index/follow 기본값, 제한 directive와 충돌 처리.
- **S5** — [Google: Crawlable links와 anchor text](https://developers.google.com/search/docs/crawling-indexing/links-crawlable): HTTP 링크, 내부 링크, 설명적 anchor.
- **S6** — [Google: Structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies): 문법뿐 아니라 가시 콘텐츠와의 일치·정확성 필요.
- **S7** — [Google: Structured data introduction](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data): JSON-LD, Microdata, RDFa 지원과 required property.
- **S8** — [WHATWG HTML Standard](https://html.spec.whatwg.org/): HTML 요소와 `lang` 등 문서 의미 표준.
- **S9** — [W3C WAI: Image text alternatives](https://www.w3.org/WAI/tutorials/images/): 이미지 역할별 대체 텍스트.
- **S10** — [W3C WAI: Decorative images](https://www.w3.org/WAI/tutorials/images/decorative/): 장식 이미지는 `alt=""`가 올바른 구현.
- **S11** — [Google: Helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content): 저자·출처·전문성·사실성에 대한 자기점검 지침.
- **S12** — [GEO: Generative Engine Optimization, KDD 2024](https://dl.acm.org/doi/10.1145/3637528.3671900): 인용·통계·권위 있는 표현 등 콘텐츠 수정과 생성형 응답 visibility의 실증 연구.
- **S13** — [GEO 논문 공개본](https://arxiv.org/abs/2311.09735): S12의 공개 원문.

## 5. SEO Rule 명세

### SEO-TECH-001 — HTTPS 사용

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | SEO · Technical SEO |
| Engine Type | FACT |
| 평가 목적 | 전송 구간 보안과 표준 웹 접근 기반 확인 |
| 필요한 입력 | 요청 URL, redirect chain, 최종 URL protocol |
| 측정 방법 | 현재는 최종 URL이 `https:`인지 확인. 차기에는 모든 redirect hop과 최종 URL을 기록 |
| PASS / WARN / FAIL | PASS: 최종 URL HTTPS · WARN: HTTP에서 HTTPS로 정상 redirect하나 중간 위험 신호 존재 시 검토 · FAIL: 최종 URL HTTP |
| N/A / UNKNOWN / NOT_EVALUATED | N/A 없음 · UNKNOWN: 최종 URL 확인 실패 · NOT_EVALUATED: fetch 미실행 |
| 최대 배점 | 5 |
| Weight 이유 | 기본 기술 안전성에 의미 있는 비중. 순위 효과의 크기를 직접 뜻하지 않음 |
| Evidence 요구 | 최초/최종 URL, protocol, redirect chain, HTTP status |
| Recommendation | HTTPS 적용, HTTP→HTTPS 영구 redirect 및 내부 URL 정리 |
| 근거 | A · HTTPS는 표준 보안 기반. 구체적 5점은 D |
| 위험 | 재현성 낮음 · Hallucination 낮음 |
| 상태 | **현재 유지**. redirect evidence 확장 필요 |

### SEO-TECH-002 — Canonical 존재

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | SEO · Technical SEO |
| Engine Type | FACT |
| 평가 목적 | 페이지가 선호 URL 신호를 선언하는지 확인 |
| 필요한 입력 | HTML/HTTP canonical, base URL, 최종 URL |
| 측정 방법 | 현재는 canonical 문자열 존재만 확인. 차기에는 URL 유효성·중복 선언·해석 결과 분리 |
| PASS / WARN / FAIL | PASS: 단일 유효 canonical · WARN: 상대 URL, 복수/불완전 선언 또는 self-canonical 없음 · FAIL: 적용 대상인데 누락/무효 |
| N/A / UNKNOWN / NOT_EVALUATED | N/A: canonical이 필수라고 정의하지 않은 특수 문서 · UNKNOWN: 중복 페이지 집합 없어 적절성 미확정 · NOT_EVALUATED: HTML/header 미수집 |
| 최대 배점 | 5 |
| Weight 이유 | 중복 URL 관리에 중요하나 존재만으로 적절성을 증명하지 않아 현 weight 재검토 |
| Evidence 요구 | raw href, resolved URL, 선언 위치, 개수 |
| Recommendation | 대표 URL을 가리키는 단일 canonical 선언 |
| 근거 | A · S3 |
| 위험 | 재현성 낮음 · Hallucination 낮음 |
| 상태 | **수정 필요** — 존재와 적절성 분리 |

### SEO-TECH-003 — Robots 지시 명확성

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | SEO · Technical SEO |
| Engine Type | FACT |
| 평가 목적 | 페이지 수준 crawler directive의 모순·오류 탐지 |
| 필요한 입력 | meta robots/googlebot, X-Robots-Tag, user-agent |
| 측정 방법 | 현재는 단순 정규식이며 값이 없어도 PASS. 차기에는 directive token과 적용 UA별 병합 |
| PASS / WARN / FAIL | PASS: 유효하고 모순 없는 directive 또는 명시적 기본 상태 · WARN: 선언 없음/중복이나 결과는 명확 · FAIL: 유효 directive가 실제로 충돌 |
| N/A / UNKNOWN / NOT_EVALUATED | N/A 없음 · UNKNOWN: header 미수집 또는 UA 적용 불명 · NOT_EVALUATED: fetch 미실행 |
| 최대 배점 | 5 |
| Weight 이유 | 잘못된 지시는 치명적일 수 있으나 현재 판정식이 너무 쉬워 weight 대비 검증 부족 |
| Evidence 요구 | 각 directive 원문, source(meta/header), UA, effective value |
| Recommendation | 중복/충돌 지시 제거 및 의도한 crawler 정책 명시 |
| 근거 | A · S4 |
| 위험 | 현재 재현성 낮음(문자열 순서 의존) · Hallucination 낮음 |
| 상태 | **수정 필요** |

### SEO-TECH-004 — 문서 언어 선언

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | SEO · Technical SEO |
| Engine Type | FACT |
| 평가 목적 | 문서 기본 언어를 기계가 식별할 수 있는지 확인 |
| 필요한 입력 | `html[lang]`, 선택적으로 본문 언어 감지 결과 |
| 측정 방법 | 현재는 비어 있지 않은 lang. 차기에는 BCP 47 형식과 본문 일치 분리 |
| PASS / WARN / FAIL | PASS: 유효한 lang · WARN: 선언은 있으나 형식/본문 불일치 의심 · FAIL: 누락 또는 명백히 무효 |
| N/A / UNKNOWN / NOT_EVALUATED | N/A 없음 · UNKNOWN: 본문 부족으로 일치 확인 불가 · NOT_EVALUATED: DOM 미파싱 |
| 최대 배점 | 5 |
| Weight 이유 | 기계 판독·접근성 기반. SEO 기여도 대비 5점은 재검토 가능 |
| Evidence 요구 | raw lang, normalized language, 본문 감지 결과/신뢰도 |
| Recommendation | 페이지 주 언어와 일치하는 유효 lang 선언 |
| 근거 | A · S8 |
| 위험 | 재현성 낮음 · Hallucination 낮음 |
| 상태 | **현재 유지**, 형식 validator 추가 |

### SEO-ONPAGE-001 — Title 품질

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | SEO · On-page |
| Engine Type | HYBRID |
| 평가 목적 | 페이지를 설명하는 title의 존재와 기본 품질 확인 |
| 필요한 입력 | title, H1, 페이지 본문, 사이트 내 title 집합 |
| 측정 방법 | 현재 20~65자 PASS. 차기 FACT: 존재/길이/중복, SEMANTIC: 설명성·주제 일치 |
| PASS / WARN / FAIL | PASS: title 존재 + 중복 아님 + 의미 rubric 충족 · WARN: 존재하나 지나치게 일반적/중복/장황 · FAIL: 누락 또는 비어 있음 |
| N/A / UNKNOWN / NOT_EVALUATED | N/A 없음 · UNKNOWN: 사이트 중복 데이터 부족 · NOT_EVALUATED: semantic engine 미실행 시 품질 부분 |
| 최대 배점 | 8 |
| Weight 이유 | 검색결과 이해·선택에 중요. 고정 길이만으로 8점 전체 판정은 과도 |
| Evidence 요구 | title 원문/길이, H1·본문 대비, 중복 URL 목록 |
| Recommendation | 고유하고 간결하며 페이지 주제를 정확히 설명하는 title 작성 |
| 근거 | 현재 D; 목적 A · S1 |
| 위험 | FACT 낮음, semantic 중간 · Hallucination 중간 |
| 상태 | **분리 필요** — 존재/길이는 FACT, 품질은 SEMANTIC |

### SEO-ONPAGE-002 — Meta description 품질

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | SEO · On-page |
| Engine Type | HYBRID |
| 평가 목적 | 검색 사용자가 페이지 내용을 이해할 수 있는 요약 신호 확인 |
| 필요한 입력 | meta description, main content, 사이트 내 description 집합 |
| 측정 방법 | 현재 70~170자 PASS. 차기 FACT: 존재/길이/중복, SEMANTIC: 정확성·고유성 |
| PASS / WARN / FAIL | PASS: 존재하고 페이지별로 정확한 요약 · WARN: 존재하나 중복/일반적/부정확 · FAIL: 누락/비어 있음 |
| N/A / UNKNOWN / NOT_EVALUATED | N/A: 제품 정책상 snippet을 의도적으로 통제하는 특수 페이지 검토 · UNKNOWN: 중복 집합 부족 · NOT_EVALUATED: semantic 미실행 |
| 최대 배점 | 6 |
| Weight 이유 | snippet 후보로 유용하지만 Google은 본문을 주로 사용하며 고정 길이 제한 없음 |
| Evidence 요구 | 원문/길이, 본문 요약 일치 evidence, 중복 URL |
| Recommendation | 페이지별로 고유하고 사실적인 한두 문장 설명 작성 |
| 근거 | 현재 D; 목적 A · S2 |
| 위험 | FACT 낮음, semantic 중간 · Hallucination 중간 |
| 상태 | **분리 필요 / 수정 필요** |

### SEO-ONPAGE-003 — 단일 핵심 H1

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | SEO · On-page |
| Engine Type | FACT |
| 평가 목적 | 가시적인 주제 heading의 존재와 명확성 확인 |
| 필요한 입력 | H1 목록과 텍스트 |
| 측정 방법 | 현재 정확히 하나면 PASS |
| PASS / WARN / FAIL | PASS: 비어 있지 않은 대표 H1 존재 · WARN: 복수 H1 또는 H1이 있으나 빈/중복 · FAIL: H1 없음 |
| N/A / UNKNOWN / NOT_EVALUATED | N/A 없음 · UNKNOWN: rendered DOM 미확인으로 JS 삽입 가능 · NOT_EVALUATED: DOM 미파싱 |
| 최대 배점 | 6 |
| Weight 이유 | 문서 주제 식별에 유용하나 “정확히 하나”는 공식 ranking requirement가 아님 |
| Evidence 요구 | 모든 H1 원문, DOM 순서, selector |
| Recommendation | 대표 주제를 명확히 나타내는 H1을 제공하고 불필요한 복수 H1 정리 |
| 근거 | C; title 생성 참고는 S1 |
| 위험 | 재현성 낮음 · Hallucination 낮음 |
| 상태 | **수정 필요** — 복수 H1 자동 감점 강도 재검토 |

### SEO-ONPAGE-004 — Heading 계층

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | SEO · On-page |
| Engine Type | HYBRID |
| 평가 목적 | 문서 구조가 기계와 사용자에게 탐색 가능한지 확인 |
| 필요한 입력 | heading level/order/text, section 본문 |
| 측정 방법 | 현재 heading 2개 이상이고 level skip이 없으면 PASS |
| PASS / WARN / FAIL | FACT PASS: 유효 순서/빈 heading 없음 · semantic PASS: heading이 section을 정확히 대표 · WARN: 경미한 skip/불명확 heading · FAIL: 구조 없음 또는 심각한 무질서 |
| N/A / UNKNOWN / NOT_EVALUATED | N/A: 극단적으로 짧은 utility page · UNKNOWN: rendered DOM 불명 · NOT_EVALUATED: semantic 부분 미실행 |
| 최대 배점 | 5 |
| Weight 이유 | 구조 가독성에 유용하지만 의미 품질과 단순 level 규칙이 혼합됨 |
| Evidence 요구 | 전체 heading outline, 문제 transition, 관련 section excerpt |
| Recommendation | 내용 구조에 맞는 heading 순서와 설명적 heading 사용 |
| 근거 | A/C · S8 |
| 위험 | FACT 낮음, semantic 중간 · Hallucination 중간 |
| 상태 | **분리 필요** |

### SEO-INDEX-001 — Noindex 차단 없음

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | SEO · Indexability |
| Engine Type | FACT |
| 평가 목적 | 페이지가 명시적으로 색인 제외를 요청하는지 확인 |
| 필요한 입력 | meta robots, X-Robots-Tag, UA, HTTP status |
| 측정 방법 | 현재 문자열에 `noindex`가 없으면 PASS |
| PASS / WARN / FAIL | PASS: effective directive에 noindex 없음 · WARN: UA별 결과가 다르거나 의도 확인 필요 · FAIL: 색인 대상 페이지에 effective noindex |
| N/A / UNKNOWN / NOT_EVALUATED | N/A: 의도적 비색인 페이지 · UNKNOWN: header/UA/페이지 목적 불명 · NOT_EVALUATED: fetch 미실행 |
| 최대 배점 | 10 |
| Weight 이유 | 의도하지 않은 noindex는 치명적. 페이지 목적 없이 10점 자동 감점하면 오판 가능 |
| Evidence 요구 | directive source와 effective value, page intent |
| Recommendation | 색인 대상이면 noindex 제거, 비색인 의도라면 N/A 사유 기록 |
| 근거 | A · S4 |
| 위험 | 재현성 낮음 · Hallucination 낮음 |
| 상태 | **현재 유지 / 수정 필요** — intent/N/A 도입 |

### SEO-INDEX-002 — Robots 차단 없음

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | SEO · Indexability |
| Engine Type | FACT |
| 평가 목적 | page-level nofollow/none 지시 확인 |
| 필요한 입력 | meta robots, X-Robots-Tag, UA |
| 측정 방법 | 현재 `none|nofollow` 문자열 포함 여부 |
| PASS / WARN / FAIL | PASS: effective nofollow 없음 · WARN: UA별/중복 지시 · FAIL: 의도치 않은 effective nofollow/none |
| N/A / UNKNOWN / NOT_EVALUATED | N/A: 의도적으로 링크 추적을 제한하는 페이지 · UNKNOWN: header/intent 불명 · NOT_EVALUATED: 미수집 |
| 최대 배점 | 5 |
| Weight 이유 | 링크 발견성에 영향 가능하나 실제 indexability와 동일하지 않음 |
| Evidence 요구 | tokenized directive, source, effective UA result |
| Recommendation | 의도하지 않은 nofollow/none 제거 |
| 근거 | A · S4 |
| 위험 | 재현성 낮음 · Hallucination 낮음 |
| 상태 | **수정 필요** — 이름과 category 적합성 검토 |

### SEO-INDEX-003 — Canonical 일관성

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | SEO · Indexability |
| Engine Type | FACT |
| 평가 목적 | 선언 canonical과 fetch URL의 관계 확인 |
| 필요한 입력 | resolved canonical, 최종 URL, 중복 후보 URL 집합 |
| 측정 방법 | 현재 hostname이 같으면 PASS. 차기에는 exact/self/near/cross-domain 관계 분류 |
| PASS / WARN / FAIL | PASS: 페이지 목적에 맞는 canonical · WARN: same-host지만 path/query 불일치 또는 cross-domain 의도 확인 필요 · FAIL: 무효/명백히 잘못된 target |
| N/A / UNKNOWN / NOT_EVALUATED | N/A: canonical 비적용 문서 · UNKNOWN: 중복 집합/의도 부족 · NOT_EVALUATED: canonical/final URL 미수집 |
| 최대 배점 | 5 |
| Weight 이유 | 중요한 신호지만 hostname 일치만으로 적절성을 판단할 수 없음 |
| Evidence 요구 | raw/resolved canonical, URL diff, target status, duplicate context |
| Recommendation | 페이지의 대표 버전을 정확히 가리키는 canonical 설정 |
| 근거 | A · S3 |
| 위험 | 현재 판정 재현성은 낮으나 정확성 위험 높음 · Hallucination 낮음 |
| 상태 | **분리 필요 / 수정 필요** |

### SEO-SCHEMA-001 — JSON-LD 문법

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | SEO · Structured Data |
| Engine Type | FACT |
| 평가 목적 | 구조화 데이터가 기계적으로 파싱 가능한지 확인 |
| 필요한 입력 | 모든 JSON-LD, Microdata, RDFa, parser errors |
| 측정 방법 | 현재 JSON-LD JSON parse만 검사하고 없으면 WARN |
| PASS / WARN / FAIL | PASS: 발견된 markup이 문법적으로 유효 · WARN: 적용 대상이나 markup 없음/권장 속성 누락 · FAIL: 발견된 markup이 파싱 불가 |
| N/A / UNKNOWN / NOT_EVALUATED | N/A: 적용할 구조화 데이터가 없는 page type · UNKNOWN: page type 미확정 · NOT_EVALUATED: markup extractor 미실행 |
| 최대 배점 | 8 |
| Weight 이유 | 파싱 실패는 명확한 결함이나 JSON-LD 없음과 유효성은 별개. 8점 단일 Rule은 과대 |
| Evidence 요구 | block 위치, parser error, format, raw excerpt |
| Recommendation | 오류 블록 수정 및 지원 format validator 통과 |
| 근거 | A · S6, S7 |
| 위험 | 재현성 낮음 · Hallucination 낮음 |
| 상태 | **분리 필요** — syntax / completeness / format coverage |

### SEO-SCHEMA-002 — Schema 유형

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | SEO · Structured Data |
| Engine Type | HYBRID |
| 평가 목적 | 명시된 entity/type이 유효하고 페이지 내용과 일치하는지 확인 |
| 필요한 입력 | schema graph, `@context`, `@type`, required properties, visible content, page type |
| 측정 방법 | 현재 아무 schema type이 있으면 PASS |
| PASS / WARN / FAIL | FACT: 유효 context/type/required field · semantic: 가시 콘텐츠와 일치 · WARN: type은 있으나 불완전/적합성 불명 · FAIL: 무효 또는 명백히 오해를 유발 |
| N/A / UNKNOWN / NOT_EVALUATED | N/A: 적용 type 없음 · UNKNOWN: page type/DOM 일치 불명 · NOT_EVALUATED: semantic/validator 미실행 |
| 최대 배점 | 7 |
| Weight 이유 | 의미 표현에 중요하지만 type 존재만으로 7점은 과도 |
| Evidence 요구 | schema node/property, validation error, 대응 DOM quote |
| Recommendation | 페이지 유형에 맞는 type과 필수 속성을 사용하고 가시 콘텐츠와 일치시킴 |
| 근거 | A · S6, S7 |
| 위험 | 재현성 중간 · Hallucination 중간 |
| 상태 | **분리 필요** — Fact Validator + Semantic/DOM consistency |

### SEO-CONTENT-001 — 충분한 본문

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | SEO · Content Basics |
| Engine Type | FACT |
| 평가 목적 | 분석 가능한 main text가 최소한 존재하는지 확인 |
| 필요한 입력 | normalized main text, visible/rendered text, page type |
| 측정 방법 | 현재 600자 PASS, 250자 WARN |
| PASS / WARN / FAIL | PASS/WARN threshold는 page type별 기준 필요 · FAIL: 적용 대상인데 실질 본문 없음 |
| N/A / UNKNOWN / NOT_EVALUATED | N/A: 로그인/utility/contact 등 긴 본문이 목적이 아닌 페이지 · UNKNOWN: JS 렌더/추출 실패 · NOT_EVALUATED: text extraction 미실행 |
| 최대 배점 | 8 |
| Weight 이유 | 얇은 페이지 탐지 신호이나 문자 수는 품질이 아니며 고정 8점은 D |
| Evidence 요구 | main text length, extraction source, page type, excerpt |
| Recommendation | 페이지 목적을 충족하는 고유하고 유용한 핵심 정보 보강 |
| 근거 | D; 품질 목적은 S11 |
| 위험 | 재현성 중간(추출기 의존) · Hallucination 낮음 |
| 상태 | **수정 필요** — page type/N/A와 boilerplate 분리 |

### SEO-CONTENT-002 — 내부 링크

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | SEO · Content Basics |
| Engine Type | FACT |
| 평가 목적 | 사이트 내 관련 페이지 발견과 탐색 경로 확인 |
| 필요한 입력 | base URL, 모든 link href/anchor/rel, unique destination |
| 측정 방법 | 현재 내부 링크 2개 이상 PASS, 1개 WARN |
| PASS / WARN / FAIL | PASS: 적용 대상에서 관련 crawlable 내부 링크 존재 · WARN: 수가 적거나 anchor 불명확 · FAIL: 필요한 문맥인데 없음/비 crawlable |
| N/A / UNKNOWN / NOT_EVALUATED | N/A: 독립 utility/terminal page · UNKNOWN: 사이트 구조와 relevance 불명 · NOT_EVALUATED: links 미추출 |
| 최대 배점 | 4 |
| Weight 이유 | 발견성과 문맥에 유용하나 임의 개수 threshold는 D |
| Evidence 요구 | URL, anchor, rel, crawlability, DOM 위치 |
| Recommendation | 사용자에게 도움이 되는 관련 내부 페이지를 설명적 anchor로 연결 |
| 근거 | 현재 D; 목적 A · S5 |
| 위험 | 재현성 낮음 · Hallucination 낮음 |
| 상태 | **수정 필요** — 개수보다 crawlability/context 중심 |

### SEO-CONTENT-003 — 이미지 대체 텍스트

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | SEO · Content Basics |
| Engine Type | HYBRID |
| 평가 목적 | 정보성/기능성 이미지의 텍스트 대안 확인 |
| 필요한 입력 | img src/alt/role, link/button 문맥, 주변 text, image role |
| 측정 방법 | 현재 alt truthy 비율; 이미지 0개는 PASS, `alt=""`는 결함 취급 가능 |
| PASS / WARN / FAIL | FACT: alt 속성 유무 · semantic: 이미지 역할에 맞는 대안. PASS는 적용 이미지 모두 적합 · WARN 일부 불명 · FAIL 정보성/기능성 이미지 핵심 대안 누락 |
| N/A / UNKNOWN / NOT_EVALUATED | N/A: 이미지 없음 또는 전부 장식 · UNKNOWN: 이미지 역할 판단 불가 · NOT_EVALUATED: image/semantic 분석 미실행 |
| 최대 배점 | 4 |
| Weight 이유 | 접근성과 image anchor 이해에 중요. 현재 비율식은 표준과 충돌 가능 |
| Evidence 요구 | element selector, src, alt 원문, inferred role과 주변 문맥 |
| Recommendation | 정보성 이미지는 의미 대안, 장식 이미지는 `alt=""` 사용 |
| 근거 | A · S5, S9, S10 |
| 위험 | 재현성 중간 · Hallucination 중간 |
| 상태 | **분리 필요 / 수정 필요** |

### SEO-CONTENT-004 — 콘텐츠 갱신 신호

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | SEO · Content Basics |
| Engine Type | HYBRID |
| 평가 목적 | 날짜가 필요한 콘텐츠에서 발행·수정 시점 확인 |
| 필요한 입력 | visible time, article meta, schema dates, page type, crawl history |
| 측정 방법 | 현재 어떤 날짜 신호든 있으면 PASS |
| PASS / WARN / FAIL | PASS: 적용 대상에서 해석 가능하고 상호 일치하는 날짜 · WARN: 하나만 있거나 불일치 · FAIL: 필요한 콘텐츠인데 없음/무효 |
| N/A / UNKNOWN / NOT_EVALUATED | N/A: evergreen homepage/utility 등 날짜 불필요 · UNKNOWN: 날짜 의미/실제 갱신 불명 · NOT_EVALUATED: date extraction 미실행 |
| 최대 배점 | 4 |
| Weight 이유 | 일부 질의·페이지에는 중요하지만 전 페이지 일괄 점수는 부적절 |
| Evidence 요구 | 날짜 값, type(published/modified), source, visible 여부, 일치 결과 |
| Recommendation | 날짜가 중요한 콘텐츠에 정확하고 가시적인 발행/수정일 제공 |
| 근거 | C; 신뢰성 원칙 S11 |
| 위험 | 재현성 낮음 · Hallucination 중간 |
| 상태 | **수정 필요** — page type/N/A 필수 |

## 6. GEO Rule 명세

GEO Rule은 Fact 존재와 의미 품질을 분리한다. 아래 `PASS`는 HYBRID Rule의 두 부분이 모두 평가된 경우를 뜻한다. Semantic Engine이 없으면 의미 부분은 `NOT_EVALUATED`다.

### GEO-ANSWER-001 — 직접 답변 블록

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | GEO · Answerability |
| Engine Type | SEMANTIC |
| 평가 목적 | 페이지가 핵심 질문에 직접적이고 충분한 답을 제공하는지 평가 |
| 필요한 입력 | 대표 질문/heading, 인접 paragraph, page topic, section 위치 |
| 측정 방법 | 현재 40~320자 문단 존재. 차기에는 질문-답변 pair와 directness/completeness rubric |
| PASS / WARN / FAIL | PASS: 질문 직후 정확한 핵심 답 · WARN: 관련되나 간접적/불완전 · FAIL: 답하지 않거나 모순 |
| N/A / UNKNOWN / NOT_EVALUATED | N/A: 질문 답변 목적이 아닌 utility page · UNKNOWN: 대표 질문/주제 불명 · NOT_EVALUATED: Semantic Engine 미실행 |
| 최대 배점 | 8 |
| Weight 이유 | answerability 핵심이나 문자 길이로 8점 판정은 근거 부족 |
| Evidence 요구 | 질문과 답변 원문 span, section 위치, rubric별 설명 |
| Recommendation | 핵심 질문 바로 뒤에 간결하고 사실적인 직답 추가 |
| 근거 | 현재 D; 연구 방향 B · S12, S13 |
| 위험 | 재현성 높음 · Hallucination 중간 |
| 상태 | **Semantic Engine 이동** |

### GEO-ANSWER-002 — 질문형 Heading

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | GEO · Answerability |
| Engine Type | HYBRID |
| 평가 목적 | 사용자 질문을 명시적으로 구조화하고 답변과 연결하는지 확인 |
| 필요한 입력 | heading text/order, 인접 section, page topic/intent |
| 측정 방법 | 현재 `?` 또는 일부 의문사 prefix. 차기 FACT: 질문형 heading, SEMANTIC: intent 관련성과 실제 답변 여부 |
| PASS / WARN / FAIL | PASS: 관련 질문 heading과 충분한 답 · WARN: 질문은 있으나 답 불완전/주변적 · FAIL: 적용 대상인데 질문 구조 없음 또는 답 불일치 |
| N/A / UNKNOWN / NOT_EVALUATED | N/A: 질문 구조가 불필요한 page type · UNKNOWN: intent 불명 · NOT_EVALUATED: semantic 미실행 |
| 최대 배점 | 6 |
| Weight 이유 | 특정 콘텐츠 형식에는 유용하나 모든 페이지에 요구할 근거 없음 |
| Evidence 요구 | heading span, 연결 section span, intent label |
| Recommendation | 실제 검색 의도와 연결되는 질문 heading과 바로 이어지는 답변 작성 |
| 근거 | D |
| 위험 | 재현성 중간 · Hallucination 중간 |
| 상태 | **분리 필요** |

### GEO-ANSWER-003 — 목록·표 구조

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | GEO · Answerability |
| Engine Type | HYBRID |
| 평가 목적 | 단계·비교·열거 정보를 추출 가능한 구조로 표현하는지 확인 |
| 필요한 입력 | list/table DOM, header/caption, 주변 heading, content intent |
| 측정 방법 | 현재 `li`와 table selector 합 2개 이상. 차기 FACT: 구조 존재, SEMANTIC: 내용과 형식의 적합성 |
| PASS / WARN / FAIL | PASS: 구조가 해당 정보를 정확히 표현 · WARN: 구조는 있으나 label/header 불완전 · FAIL: 구조가 필요한 내용인데 평문으로만 혼재/표가 해석 불가 |
| N/A / UNKNOWN / NOT_EVALUATED | N/A: 열거·비교·단계가 없는 문서 · UNKNOWN: content intent 불명 · NOT_EVALUATED: semantic 미실행 |
| 최대 배점 | 6 |
| Weight 이유 | 추출 친화성 가설은 타당하나 단순 개수 threshold는 D |
| Evidence 요구 | DOM 구조, caption/header, 관련 section excerpt |
| Recommendation | 단계는 list, 비교 데이터는 header가 있는 table로 구조화 |
| 근거 | D; 방향성 B/C · S12 |
| 위험 | 재현성 중간 · Hallucination 중간 |
| 상태 | **분리 필요** |

### GEO-MACHINE-001 — Heading 구조

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | GEO · Machine Readability |
| Engine Type | FACT |
| 평가 목적 | section 경계를 기계적으로 파악할 수 있는 heading outline 확인 |
| 필요한 입력 | heading level/order/text |
| 측정 방법 | 현재 SEO heading 계층과 사실상 동일 |
| PASS / WARN / FAIL | PASS: 유효한 outline · WARN: 경미한 skip/빈 heading · FAIL: 적용 콘텐츠에 구조 없음/심각한 오류 |
| N/A / UNKNOWN / NOT_EVALUATED | N/A: 매우 짧은 utility page · UNKNOWN: rendered DOM 불명 · NOT_EVALUATED: DOM 미파싱 |
| 최대 배점 | 6 |
| Weight 이유 | machine segmentation에 유용하나 SEO Rule과 같은 사실을 중복 배점 |
| Evidence 요구 | heading outline과 transition |
| Recommendation | 논리적인 heading 순서와 설명적 section title 사용 |
| 근거 | A/C · S8 |
| 위험 | 재현성 낮음 · Hallucination 낮음 |
| 상태 | **삭제 검토** — SEO-ONPAGE-004 Fact와 공통 Fact로 통합 후 축별 재사용 여부 결정 |

### GEO-MACHINE-002 — 의미 구조

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | GEO · Machine Readability |
| Engine Type | FACT |
| 평가 목적 | main content와 section 경계를 semantic HTML로 식별 가능한지 확인 |
| 필요한 입력 | main/article/section landmarks, nesting, text coverage |
| 측정 방법 | 현재 해당 태그 하나만 있어도 PASS |
| PASS / WARN / FAIL | PASS: 단일 main과 합리적 landmark/text coverage · WARN: 태그 존재하나 구조 불완전 · FAIL: main content 식별 불가 |
| N/A / UNKNOWN / NOT_EVALUATED | N/A 거의 없음 · UNKNOWN: rendered DOM 미확인 · NOT_EVALUATED: DOM 미파싱 |
| 최대 배점 | 6 |
| Weight 이유 | fact 신호는 유효하나 태그 하나 존재만으로 6점은 쉬움 |
| Evidence 요구 | landmark selector, nesting, 포함 text 비율 |
| Recommendation | 주요 콘텐츠를 main/article/section으로 명확히 구분 |
| 근거 | A · S8 |
| 위험 | 재현성 낮음 · Hallucination 낮음 |
| 상태 | **수정 필요** |

### GEO-MACHINE-003 — 메타데이터 명확성

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | GEO · Machine Readability |
| Engine Type | HYBRID |
| 평가 목적 | metadata가 페이지 주제를 기계와 사용자에게 정확히 요약하는지 확인 |
| 필요한 입력 | title, meta description, H1, main content |
| 측정 방법 | 현재 title+meta 존재만으로 PASS. 차기 FACT 존재와 SEMANTIC 명확성 분리 |
| PASS / WARN / FAIL | PASS: 둘 다 존재하고 주제를 정확히 대표 · WARN: 일부 누락 또는 의미 불일치 · FAIL: 둘 다 없거나 오해를 유발 |
| N/A / UNKNOWN / NOT_EVALUATED | N/A 없음 · UNKNOWN: 본문 추출 실패 · NOT_EVALUATED: semantic 미실행 |
| 최대 배점 | 4 |
| Weight 이유 | machine summary 신호로 유용하나 SEO title/meta와 중복 |
| Evidence 요구 | title/meta/H1 원문, main topic 대비 근거 span |
| Recommendation | metadata가 페이지 핵심 주제와 엔터티를 정확히 설명하도록 수정 |
| 근거 | A/C · S1, S2 |
| 위험 | 재현성 중간 · Hallucination 중간 |
| 상태 | **분리 필요 / 삭제 검토** — SEO Fact 중복 제거 |

### GEO-MACHINE-004 — 구조화 데이터

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | GEO · Machine Readability |
| Engine Type | HYBRID |
| 평가 목적 | 명시적 entity graph가 유효하고 페이지 의미를 정확히 표현하는지 확인 |
| 필요한 입력 | 모든 structured data, validator result, visible DOM |
| 측정 방법 | 현재 유효 JSON-LD 하나면 PASS. 차기 FACT syntax/type, SEMANTIC/Validator consistency 분리 |
| PASS / WARN / FAIL | PASS: 유효·완전하며 가시 콘텐츠와 일치 · WARN: 존재하나 불완전/일치 불명 · FAIL: 무효 또는 명백한 불일치 |
| N/A / UNKNOWN / NOT_EVALUATED | N/A: 적용 type 없음 · UNKNOWN: page type 불명 · NOT_EVALUATED: semantic/validator 미실행 |
| 최대 배점 | 4 |
| Weight 이유 | machine readability에 유용하나 SEO schema와 동일 사실 중복 |
| Evidence 요구 | schema node/property, validator error, 대응 DOM quote |
| Recommendation | 페이지 entity와 일치하는 완전하고 유효한 schema 제공 |
| 근거 | A · S6, S7 |
| 위험 | 재현성 중간 · Hallucination 중간 |
| 상태 | **분리 필요 / 삭제 검토** — 공통 Fact 재사용 |

### GEO-TRUST-001 — 저자 정보

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | GEO · Evidence & Trust |
| Engine Type | HYBRID |
| 평가 목적 | 콘텐츠 책임 주체가 식별되고 해당 주제에 대한 신뢰 근거가 있는지 평가 |
| 필요한 입력 | author DOM/schema/byline/bio URL, page type, 외부 identity data |
| 측정 방법 | 현재 author 표식 하나면 PASS. 차기 FACT 존재/연결과 SEMANTIC/External 신뢰성 분리 |
| PASS / WARN / FAIL | FACT PASS: 명확한 저자 식별 · semantic PASS: 저자-콘텐츠 연결과 검증 근거 충분 · WARN: 식별되나 검증 부족 · FAIL: 필요한 콘텐츠에 책임 주체 없음/오인 |
| N/A / UNKNOWN / NOT_EVALUATED | N/A: 작성자 표기가 부적절한 utility/product page · UNKNOWN: 외부 검증 부족 · NOT_EVALUATED: semantic/external 미실행 |
| 최대 배점 | 5 |
| Weight 이유 | trust에 중요할 수 있으나 author 존재는 신뢰성 자체가 아님 |
| Evidence 요구 | byline/schema 원문, bio link, 외부 검증 source와 시점 |
| Recommendation | 작성자와 역할을 명확히 표시하고 검증 가능한 소개/자격 정보 연결 |
| 근거 | C/A 가이드 · S11 |
| 위험 | 재현성 중간 · Hallucination 높음 |
| 상태 | **분리 필요** — Author existence FACT / trust SEMANTIC·EXTERNAL |

### GEO-TRUST-002 — 작성·수정 날짜

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | GEO · Evidence & Trust |
| Engine Type | HYBRID |
| 평가 목적 | 시간 민감 콘텐츠의 발행·갱신 시점과 최신성 신뢰 확인 |
| 필요한 입력 | visible/schema/meta dates, page type, crawl history, content change |
| 측정 방법 | 현재 날짜 신호 존재만으로 PASS |
| PASS / WARN / FAIL | FACT: 날짜 존재·일치 · semantic/external: 실제 최신성. WARN 불일치/검증 부족 · FAIL 명백한 허위/필수 날짜 누락 |
| N/A / UNKNOWN / NOT_EVALUATED | N/A: 날짜가 가치에 영향 없는 evergreen/utility page · UNKNOWN: 실제 갱신 불명 · NOT_EVALUATED: history/semantic 미실행 |
| 최대 배점 | 5 |
| Weight 이유 | 일부 질의에는 중요하지만 전 페이지 동일 5점은 부적절 |
| Evidence 요구 | 각 날짜/source, visible 여부, history diff |
| Recommendation | 필요한 문서에 정확한 발행·수정일을 표시하고 schema와 일치시킴 |
| 근거 | C · S11 |
| 위험 | 재현성 중간 · Hallucination 중간 |
| 상태 | **분리 필요 / 수정 필요** |

### GEO-TRUST-003 — 외부 근거 링크

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | GEO · Evidence & Trust |
| Engine Type | HYBRID |
| 평가 목적 | 외부 근거가 존재하며 주요 주장을 실제로 뒷받침하는지 평가 |
| 필요한 입력 | HTTP(S) 외부 링크, anchor/rel/위치, claim 문장, target content/status |
| 측정 방법 | 현재 anchor 4자 이상 외부 링크 하나면 PASS; `tel:` 등도 오분류 가능 |
| PASS / WARN / FAIL | FACT: 유효 외부 citation 존재 · semantic: source가 claim을 지지. PASS 둘 다 충족 · WARN 후보는 있으나 관계/품질 불명 · FAIL 필요한 claim에 근거 없음/무관 source |
| N/A / UNKNOWN / NOT_EVALUATED | N/A: 외부 근거가 필요 없는 페이지/claim 없음 · UNKNOWN: target fetch 실패 · NOT_EVALUATED: semantic/source 검사 미실행 |
| 최대 배점 | 6 |
| Weight 이유 | 연구상 citations는 유의미하지만 임의 링크 존재만으로 6점은 과도 |
| Evidence 요구 | claim span, link URL/anchor/DOM 위치, target quote/status |
| Recommendation | 핵심 주장 가까이에 해당 주장을 직접 뒷받침하는 원출처 연결 |
| 근거 | 현재 D; 방향 B · S12, S13 |
| 위험 | 재현성 높음 · Hallucination 높음 |
| 상태 | **분리 필요** — link existence FACT / support quality SEMANTIC |

### GEO-TRUST-004 — 발행 주체 식별

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | GEO · Evidence & Trust |
| Engine Type | HYBRID |
| 평가 목적 | 페이지를 책임지는 조직/개인이 명시되고 실제 identity와 일치하는지 확인 |
| 필요한 입력 | publisher schema, visible organization, URL/logo/sameAs, 외부 entity data |
| 측정 방법 | 현재 Organization/Person/NewsMediaOrganization type 존재만으로 PASS |
| PASS / WARN / FAIL | FACT: publisher entity 선언 · semantic/external: 실제 주체와 일치 · WARN 불완전/검증 부족 · FAIL 오인/충돌 |
| N/A / UNKNOWN / NOT_EVALUATED | N/A 제한적 · UNKNOWN: 외부 identity 불명 · NOT_EVALUATED: semantic/external 미실행 |
| 최대 배점 | 4 |
| Weight 이유 | provenance에 유용하지만 schema type 하나로 신뢰를 확정할 수 없음 |
| Evidence 요구 | schema entity/ID, visible name/contact, external identity source |
| Recommendation | 일관된 조직명·URL·식별자를 schema와 가시 영역에 제공 |
| 근거 | A/C · S6, S11 |
| 위험 | 재현성 중간 · Hallucination 높음 |
| 상태 | **분리 필요** |

### GEO-CITE-001 — 주장과 근거의 근접성

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | GEO · Citation Readiness |
| Engine Type | SEMANTIC |
| 평가 목적 | 검증 가능한 claim에 대응 근거가 연결되고 실제로 지지하는지 평가 |
| 필요한 입력 | 문장 단위 본문, claim type, citation 위치, target content |
| 측정 방법 | 현재 숫자 claim이 없거나 외부 링크가 하나라도 있으면 PASS. 실제 근접성 미측정 |
| PASS / WARN / FAIL | PASS: 주요 claim마다 인접한 supporting source · WARN: 일부 claim만 지원/관계 불명 · FAIL: 핵심 claim이 무근거이거나 source가 반박 |
| N/A / UNKNOWN / NOT_EVALUATED | N/A: 검증 가능한 claim 없음 · UNKNOWN: source fetch 실패 · NOT_EVALUATED: Semantic Engine 미실행 |
| 최대 배점 | 8 |
| Weight 이유 | citation readiness 핵심이나 현재 PASS가 지나치게 쉬워 8점 위험이 가장 큼 |
| Evidence 요구 | claim span, citation span, target supporting quote, 관계 판정 |
| Recommendation | 검증 가능한 주장 직후에 직접 뒷받침하는 출처를 연결 |
| 근거 | 현재 D; 방향 B · S12, S13 |
| 위험 | 재현성 높음 · Hallucination 높음 |
| 상태 | **Semantic Engine 이동** |

### GEO-CITE-002 — 출처 링크 품질

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | GEO · Citation Readiness |
| Engine Type | HYBRID |
| 평가 목적 | citation 후보가 접근 가능하며 설명적이고 권위·관련성이 있는지 평가 |
| 필요한 입력 | URL scheme/status/canonical, anchor/context, source content/type/provenance |
| 측정 방법 | 현재 GEO-TRUST-003과 같은 외부 링크/anchor 조건 |
| PASS / WARN / FAIL | FACT: 유효·접근 가능한 source URL · semantic/external: 원출처성·관련성·권위. WARN 일부 불명 · FAIL 무관/깨진/조작 source |
| N/A / UNKNOWN / NOT_EVALUATED | N/A: citation 필요 없음 · UNKNOWN: target/authority data 부족 · NOT_EVALUATED: source semantic 미실행 |
| 최대 배점 | 6 |
| Weight 이유 | source quality는 중요하나 현행은 TRUST-003과 중복 배점 |
| Evidence 요구 | target status/title/canonical, anchor/context, authority 판단 출처 |
| Recommendation | 설명적 anchor로 접근 가능한 원출처 또는 공식 자료 연결 |
| 근거 | 현재 D; 링크 기본 A S5, GEO 방향 B S12 |
| 위험 | 재현성 높음 · Hallucination 높음 |
| 상태 | **분리 필요 / 삭제 검토** — TRUST-003과 단일 citation source Rule로 통합 검토 |

### GEO-CITE-003 — 엔티티 명명 일관성

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | GEO · Citation Readiness |
| Engine Type | HYBRID |
| 평가 목적 | title/H1/schema가 동일한 핵심 entity를 일관되게 지칭하는지 확인 |
| 필요한 입력 | title, H1, canonical, schema name/@id/url, main topic |
| 측정 방법 | 현재 title에 H1 앞 20자가 포함되는지 확인 |
| PASS / WARN / FAIL | FACT: normalized name/ID 일치 · semantic: 같은 entity와 topic을 지칭 · WARN 별칭/부분 불일치 · FAIL 서로 다른 entity 또는 핵심 신호 충돌 |
| N/A / UNKNOWN / NOT_EVALUATED | N/A: 명시 entity가 없는 page type · UNKNOWN: entity resolution 불충분 · NOT_EVALUATED: semantic 미실행 |
| 최대 배점 | 6 |
| Weight 이유 | entity clarity는 유용하지만 20자 substring은 한국어/영어·별칭에 취약 |
| Evidence 요구 | 각 name/ID 원문, normalized mapping, 불일치 span |
| Recommendation | 핵심 조직·제품·인물 이름과 식별자를 metadata/schema/본문에서 일관되게 사용 |
| 근거 | D; structured data 원칙 S6 |
| 위험 | 재현성 중간 · Hallucination 중간 |
| 상태 | **분리 필요 / 수정 필요** |

### GEO-ACCESS-001 — 초기 HTML 본문 노출

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | GEO · Content Accessibility |
| Engine Type | FACT |
| 평가 목적 | JavaScript 실행 전에도 의미 있는 본문을 수집할 수 있는지 확인 |
| 필요한 입력 | raw HTML text, rendered DOM text, main-content diff |
| 측정 방법 | 현재 raw body 120자 이상 PASS |
| PASS / WARN / FAIL | PASS: raw HTML에 핵심 main content 존재 · WARN: 일부만 존재/렌더 후 크게 증가 · FAIL: raw shell만 존재 |
| N/A / UNKNOWN / NOT_EVALUATED | N/A 제한적 · UNKNOWN: rendered comparison 미실행 · NOT_EVALUATED: raw fetch 미실행 |
| 최대 배점 | 8 |
| Weight 이유 | 수집 가능성에 중요하지만 120자 threshold만으로 핵심 본문 여부를 알 수 없음 |
| Evidence 요구 | raw/rendered text length, diff, main excerpt, fetch mode |
| Recommendation | 핵심 콘텐츠를 서버 HTML에 제공하거나 안정적인 렌더링 경로 마련 |
| 근거 | C; crawler 접근 원칙 S5 |
| 위험 | 재현성 중간 · Hallucination 낮음 |
| 상태 | **수정 필요** — rendered comparison 필요 |

### GEO-ACCESS-002 — 읽기 가능한 텍스트

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | GEO · Content Accessibility |
| Engine Type | HYBRID |
| 평가 목적 | 추출 가능한 텍스트가 있고 의미적으로 명료·응집력 있는지 평가 |
| 필요한 입력 | main text, paragraphs, language, page type, section structure |
| 측정 방법 | 현재 600자+3문단 PASS, 250자 WARN |
| PASS / WARN / FAIL | FACT: text/paragraph 추출 가능 · semantic: 명료성/응집성 rubric 충족 · WARN 일부 어려움 · FAIL 읽을 본문 없음 또는 심각한 비문/파편 |
| N/A / UNKNOWN / NOT_EVALUATED | N/A: 텍스트 설명이 핵심이 아닌 utility page · UNKNOWN: extraction/language 불명 · NOT_EVALUATED: semantic 미실행 |
| 최대 배점 | 5 |
| Weight 이유 | accessibility/readability에 중요하나 길이는 품질 대용치가 아님 |
| Evidence 요구 | paragraph span, length facts, rubric별 quote와 판정 |
| Recommendation | 핵심 내용을 명확한 문단과 일관된 용어로 작성 |
| 근거 | 현재 D |
| 위험 | 재현성 높음 · Hallucination 중간 |
| 상태 | **분리 필요** |

### GEO-ACCESS-003 — 접근 차단 요소 없음

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | GEO · Content Accessibility |
| Engine Type | FACT |
| 평가 목적 | 인증벽·JS shell·차단 응답으로 핵심 콘텐츠가 가려지는지 확인 |
| 필요한 입력 | HTTP status/headers, redirect, raw/rendered DOM, auth/paywall/cookie-wall indicators |
| 측정 방법 | 현재 body 180자 미만 + 제한된 로그인/JS 문구일 때만 FAIL |
| PASS / WARN / FAIL | PASS: 관측 환경에서 핵심 콘텐츠 접근 가능 · WARN: 일부 차단/동의/렌더 의존 · FAIL: 접근 불가 또는 shell만 반환 |
| N/A / UNKNOWN / NOT_EVALUATED | N/A: 비공개 페이지로 명시된 audit · UNKNOWN: bot/지역/세션별 상태 불명 · NOT_EVALUATED: fetch/render 미실행 |
| 최대 배점 | 3 |
| Weight 이유 | 중요한 기본 gate이나 현재 탐지 범위가 좁아 PASS가 너무 쉬움 |
| Evidence 요구 | status, redirects, 차단 문구, raw/rendered excerpt, fetch identity |
| Recommendation | 공개 핵심 콘텐츠가 인증·스크립트 없이 접근되도록 제공 |
| 근거 | C; crawler 접근 원칙 S5 |
| 위험 | 재현성 중간 · Hallucination 낮음 |
| 상태 | **수정 필요** |

### GEO-ACCESS-004 — 언어 식별 가능

| 필드 | 방법론 v1 |
|---|---|
| SEO/GEO · Category | GEO · Content Accessibility |
| Engine Type | FACT |
| 평가 목적 | 처리 시스템이 문서 언어를 명시적으로 식별할 수 있는지 확인 |
| 필요한 입력 | html lang, 본문 언어 감지 |
| 측정 방법 | 현재 lang 존재. SEO-TECH-004와 동일 사실 |
| PASS / WARN / FAIL | PASS: 유효 lang과 본문 언어 일치 · WARN: 형식/일치 의심 · FAIL: 누락/명백한 불일치 |
| N/A / UNKNOWN / NOT_EVALUATED | N/A 없음 · UNKNOWN: 본문 부족 · NOT_EVALUATED: DOM/언어 감지 미실행 |
| 최대 배점 | 4 |
| Weight 이유 | machine parsing에 유용하나 SEO와 동일 사실을 중복 배점 |
| Evidence 요구 | lang 원문, normalized value, 감지 언어/신뢰도 |
| Recommendation | 실제 본문 주 언어와 일치하는 유효 lang 선언 |
| 근거 | A · S8 |
| 위험 | 재현성 낮음 · Hallucination 낮음 |
| 상태 | **삭제 검토** — 공통 Fact를 GEO technical coverage에 재사용하되 중복 Rule 제거 검토 |

## 7. Rule 조치 요약

| 조치 | Rule |
|---|---|
| 현재 유지 | SEO-TECH-001, SEO-TECH-004, SEO-INDEX-001(의도/N/A 추가), GEO-MACHINE-001 Fact 자체, GEO-ACCESS-004 Fact 자체 |
| 수정 필요 | SEO-TECH-002/003, SEO-ONPAGE-003, SEO-INDEX-002/003, SEO-CONTENT-001/002/004, GEO-MACHINE-002, GEO-ACCESS-001/003 |
| 분리 필요 | SEO-ONPAGE-001/002/004, SEO-SCHEMA-001/002, SEO-CONTENT-003/004, GEO-ANSWER-002/003, GEO-MACHINE-003/004, GEO-TRUST-001~004, GEO-CITE-002/003, GEO-ACCESS-002 |
| Semantic Engine 이동 | GEO-ANSWER-001, GEO-CITE-001; 각 HYBRID Rule의 의미 품질 sub-check |
| 삭제/통합 검토 | GEO-MACHINE-001 ↔ SEO-ONPAGE-004 Fact, GEO-MACHINE-003 ↔ SEO title/meta Facts, GEO-MACHINE-004 ↔ SEO schema Facts, GEO-CITE-002 ↔ GEO-TRUST-003, GEO-ACCESS-004 ↔ SEO-TECH-004 |

삭제 검토는 underlying Fact를 버린다는 뜻이 아니다. Evidence Layer에 한 번 저장한 Fact를 여러 평가 축에서 중복 배점하지 않도록 Rule 경계를 재설계한다는 뜻이다.

## 8. 제안 배점안 — 코드 미적용

### 8.1 SEO Score 100

SEO는 FACT 중심으로 유지한다. Semantic 품질은 recommendation이나 별도 보조 평가로 제공하고, SEO 100점의 핵심 분모에 확률적 LLM 판단을 넣지 않는 안을 권장한다.

| Category | 제안 배점 | 설계 이유 |
|---|---:|---|
| Technical SEO | 20 | protocol, directives, language, canonical 선언 등 기술 기반 |
| On-page | 25 | title/meta/H1/heading의 관측 가능한 기본 품질 |
| Indexability | 25 | noindex, page directive, canonical 관계, status/crawl gate의 높은 영향 |
| Structured Data | 15 | syntax/type/required property validator. 의미 일치는 별도 coverage |
| Content Basics | 15 | main text, 내부 링크, image alt fact, 날짜 적용성 |
| **합계** | **100** | GEO 점수와 독립 계산 |

Weight 변경 전 필요한 작업:

1. page type과 N/A 규칙 정의
2. 중복 Rule 제거 후 weight 재분배
3. robots/header/rendered DOM 입력 확장
4. 고정 문자 수·개수 threshold의 실증 calibration
5. fixture corpus에서 false positive/negative 검토

### 8.2 GEO Readiness 100 — Fact와 Semantic 분리

GEO Overall은 Fact와 Semantic 양쪽 coverage가 충족될 때만 산출한다. Semantic Engine이 없으면 `GEO Fact Readiness`만 표시하고 Overall을 100점으로 확대하지 않는다.

#### GEO Technical / Fact Readiness — 40점

| Category | 배점 | 포함 범위 |
|---|---:|---|
| Machine Readability Facts | 15 | heading/landmark, metadata 존재, schema syntax/type facts |
| Content Accessibility Facts | 15 | raw/rendered content, 접근 차단, language, extractability |
| Identity & Evidence Facts | 10 | author/date/publisher 표식, valid citation URL과 DOM 위치 |
| **Fact subtotal** | **40** | 동일 snapshot에 결정론적 |

#### GEO Semantic Readiness — 60점

| Category | 배점 | 포함 범위 |
|---|---:|---|
| Answerability | 20 | 질문-답변 관련성, directness, completeness, 구조 적합성 |
| Evidence & Trust Quality | 20 | 저자/발행 주체 신뢰 근거, 날짜 적절성, 출처 관련성 |
| Citation Readiness Quality | 20 | claim 식별, claim-source support, 원출처성, entity consistency |
| **Semantic subtotal** | **60** | rubric·quote·model version 필수 |

```text
GEO Readiness Score = Fact subtotal(최대 40) + Semantic subtotal(최대 60)
```

산출 조건 제안:

- Fact coverage 90% 미만: Overall `UNKNOWN`
- Semantic coverage 80% 미만 또는 engine 미실행: Overall `NOT_EVALUATED`
- N/A는 page type과 제외 이유가 있을 때만 분모에서 제외
- UNKNOWN/NOT_EVALUATED를 제외한 나머지를 100점으로 재환산하지 않음
- 실제 AI 엔진 노출은 별도 `AI Visibility` 도메인으로 유지

## 9. 승인 전 검토 항목

1. SEO category를 `20/25/25/15/15`로 재배분할지
2. GEO Overall에서 Fact 40 / Semantic 60 비중을 채택할지
3. 중복 Fact를 한 축에서만 배점할지, 축별 목적에 따라 제한적으로 재사용할지
4. page type taxonomy와 각 Rule의 N/A 허용 목록
5. Semantic Rule별 rubric과 최소 evidence quote 수
6. 외부 source fetch·authority 확인을 GEO v1 범위에 포함할지
7. 기존 `rulesetVersion 2026.08.1` 결과를 보존하고 새 방법론을 별도 version으로 시작할지

이 문서가 승인되기 전에는 scoring 코드와 기존 결과를 변경하지 않는다.

## 10. 현행 Rule Registry — `rulesetVersion 2026.08.1`

이 절은 차기 제안이 아니라 **현재 코드가 실제로 수행하는 판정**을 고정한 기록이다. 현행 코드에는 N/A가 없으며 모든 Rule의 `최대 점수 = 현재 Weight`다. WARN은 Weight의 50%, PASS는 100%, FAIL은 0점을 얻는다.

### 10.1 SEO 현행 규칙

| Rule ID / Rule name | Category | 무엇을 측정 / 측정 방법 | 현재 PASS / WARN / FAIL / N/A | 최대 / Weight | 실제 Evidence | 점수 이유 / 사용자 Recommendation | Grade |
|---|---|---|---|---:|---|---|---|
| SEO-TECH-001 · HTTPS 사용 | Technical SEO | 최종 URL protocol이 `https:`인지 | HTTPS / 없음 / HTTP / 미지원 | 5 / 5 | 최종 URL | 안전한 HTTPS 제공 / HTTPS 적용 | A |
| SEO-TECH-002 · Canonical 존재 | Technical SEO | 첫 canonical 문자열 존재 | 존재 / 없음 / 누락 / 미지원 | 5 / 5 | canonical href | 대표 URL 신호 / canonical 추가 | A |
| SEO-TECH-003 · Robots 지시 명확성 | Technical SEO | 합쳐진 robots 문자열에 `noindex…index` 또는 `index…noindex` 정규식 충돌이 없는지 | 충돌 정규식 없음(빈 값 포함) / 사실상 도달 불가 / 충돌 / 미지원 | 5 / 5 | meta robots+X-Robots-Tag 또는 `해당 요소 없음` | crawler 지시 오류 방지 / 충돌 지시 정리 | A(현 판정식 D) |
| SEO-TECH-004 · 문서 언어 선언 | Technical SEO | `html[lang]` 비어 있지 않음 | 존재 / 없음 / 누락 / 미지원 | 5 / 5 | lang 원문 | 언어 식별 / lang 선언 | A |
| SEO-ONPAGE-001 · Title 품질 | On-page | title 문자열 길이 | 20~65자 / 존재하나 범위 밖 / 누락 / 미지원 | 8 / 8 | title 원문 | 검색결과 제목 기본기 / 20~65자 title 권고 | D |
| SEO-ONPAGE-002 · Meta description 품질 | On-page | meta description 길이 | 70~170자 / 존재하나 범위 밖 / 누락 / 미지원 | 6 / 6 | description 원문 | snippet 후보 / 70~170자 설명 권고 | D |
| SEO-ONPAGE-003 · 단일 핵심 H1 | On-page | H1 개수 | 정확히 1 / 2개 이상 / 0개 / 미지원 | 6 / 6 | H1 목록 | 대표 heading / H1 하나로 정리 | C |
| SEO-ONPAGE-004 · Heading 계층 | On-page | heading 개수와 level skip | 2개 이상+skip 없음 / 1개 이상이나 조건 미달 / 0개 / 미지원 | 5 / 5 | H1~H6 앞부분 | 문서 구조 / heading 순서 정리 | C |
| SEO-INDEX-001 · Noindex 차단 없음 | Indexability | robots 문자열에 `noindex` 포함 여부 | 없음(robots 미선언 포함) / 없음 / 포함 / 미지원 | 10 / 10 | robots 원문 또는 `해당 요소 없음` | 의도치 않은 색인 제외 방지 / noindex 제거 | A |
| SEO-INDEX-002 · Robots 차단 없음 | Indexability | robots 문자열에 `none|nofollow` 포함 여부 | 없음(미선언 포함) / 없음 / 포함 / 미지원 | 5 / 5 | robots 원문 또는 `해당 요소 없음` | 링크 추적 제한 방지 / none·nofollow 검토 | A |
| SEO-INDEX-003 · Canonical 일관성 | Indexability | canonical을 resolve한 hostname이 최종 URL hostname과 같은지 | 같은 host / canonical 있으나 다른 host·해석 실패 / canonical 없음 / 미지원 | 5 / 5 | canonical URL | canonical 관계 / 최종 URL과 일치 권고 | D |
| SEO-SCHEMA-001 · JSON-LD 문법 | Structured Data | JSON-LD block 수와 JSON.parse 오류 | 1개 이상+오류 0 / JSON-LD 없음+오류 0 / 오류 1개 이상 / 미지원 | 8 / 8 | `유효 n개 / 오류 n개` | 기계 파싱 / JSON-LD 문법 수정 | A |
| SEO-SCHEMA-002 · Schema 유형 | Structured Data | JSON-LD에서 추출한 `@type` 존재 | 아무 type 존재 / 없음 / type 없음 / 미지원 | 7 / 7 | schema type 목록 | entity type 제공 / schema type 추가 | A(현 판정식 D) |
| SEO-CONTENT-001 · 충분한 본문 | Content Basics | 정규화 body text 문자 수 | 600자 이상 / 250~599자 / 250자 미만 / 미지원 | 8 / 8 | `n자` | 얇은 본문 탐지 / 핵심 정보 보강 | D |
| SEO-CONTENT-002 · 내부 링크 | Content Basics | 최종 hostname과 같은 link 수 | 2개 이상 / 1개 / 0개 / 미지원 | 4 / 4 | `n개` | 내부 발견성 / 관련 내부 링크 추가 | D |
| SEO-CONTENT-003 · 이미지 대체 텍스트 | Content Basics | 수집된 img 중 truthy alt 비율. 수집 이미지 0개면 비율 100% | 100% / 70~99% / 70% 미만 / 미지원 | 4 / 4 | alt 비율 | 이미지 대안 / 누락 alt 작성 | A(현 계산 D) |
| SEO-CONTENT-004 · 콘텐츠 갱신 신호 | Content Basics | time/meta/schema/raw regex 중 날짜 하나 존재 | 존재 / 없음 / 누락 / 미지원 | 4 / 4 | `날짜 신호 발견` 또는 없음 | 최신성 신호 / 발행·수정일 제공 | C |

### 10.2 GEO 현행 규칙

| Rule ID / Rule name | Category | 무엇을 측정 / 측정 방법 | 현재 PASS / WARN / FAIL / N/A | 최대 / Weight | 실제 Evidence | 점수 이유 / 사용자 Recommendation | Grade |
|---|---|---|---|---:|---|---|---|
| GEO-ANSWER-001 · 직접 답변 블록 | Answerability | 40~320자인 paragraph가 하나라도 있는지 | 있음 / 없음 / 없음 / 미지원 | 8 / 8 | 첫 조건 충족 paragraph | 직답 가능성 / 간결한 설명 문단 추가 | D |
| GEO-ANSWER-002 · 질문형 Heading | Answerability | heading에 `?` 또는 제한된 의문사 prefix | 있음 / 없음 / 없음 / 미지원 | 6 / 6 | heading 목록 | 질문 구조 / 질문형 heading 추가 | D |
| GEO-ANSWER-003 · 목록·표 구조 | Answerability | `ul li, ol li, table` selector 합계 | 2개 이상 / 없음 / 2개 미만 / 미지원 | 6 / 6 | `n개 목록 / n개 표` | 구조화 답변 / list·table 사용 | D |
| GEO-MACHINE-001 · Heading 구조 | Machine Readability | SEO heading 계층과 같은 계산 | 2개 이상+skip 없음 / heading 있으나 조건 미달 / 없음 / 미지원 | 6 / 6 | heading 목록 | section 추출 / heading 계층 정리 | C |
| GEO-MACHINE-002 · 의미 구조 | Machine Readability | main/article/section element 합계 | 1개 이상 / 없음 / 0개 / 미지원 | 6 / 6 | element 개수 | semantic DOM / 의미 요소 사용 | A(현 PASS D) |
| GEO-MACHINE-003 · 메타데이터 명확성 | Machine Readability | title과 meta description 존재 | 둘 다 / 하나만 / 둘 다 없음 / 미지원 | 4 / 4 | title + meta 원문 | 주제 명시 / title·description 정리 | C |
| GEO-MACHINE-004 · 구조화 데이터 | Machine Readability | 파싱 성공한 JSON-LD 하나 이상 | 있음 / 없음 / 없음·오류만 / 미지원 | 4 / 4 | schema type 또는 유효 block | 기계 판독 / 유효 JSON-LD 제공 | A(품질은 미측정) |
| GEO-TRUST-001 · 저자 정보 | Evidence & Trust | rel/itemprop/meta/raw JSON author 신호 | 존재 / 없음 / 없음 / 미지원 | 5 / 5 | 저자 신호 또는 없음 | 책임 주체 / 저자와 전문성 표시 | C |
| GEO-TRUST-002 · 작성·수정 날짜 | Evidence & Trust | SEO date signal과 같은 값 | 존재 / 없음 / 없음 / 미지원 | 5 / 5 | `발견` 또는 없음 | 시간 신뢰 / 작성·수정일 제공 | C |
| GEO-TRUST-003 · 외부 근거 링크 | Evidence & Trust | 외부 hostname + anchor 4자 이상인 링크 하나 | 있음 / 외부 링크만 있음 / 없음 / 미지원 | 6 / 6 | 외부 링크 수 | 출처 근거 / 설명적 출처 링크 추가 | D |
| GEO-TRUST-004 · 발행 주체 식별 | Evidence & Trust | schema type이 Organization/Person/NewsMediaOrganization | 있음 / 없음 / 없음 / 미지원 | 4 / 4 | schema type | publisher 신호 / 발행 주체 schema 추가 | C |
| GEO-CITE-001 · 주장과 근거의 근접성 | Citation Readiness | 숫자 claim regex 수와 외부 링크 존재를 조합 | claim 0개 또는 외부 링크 있음 / claim>0+외부 링크 없음 / 사실상 도달 불가 / 미지원 | 8 / 8 | `n개 주장 / n개 외부 링크` | 근거 연결 / 주장 가까이 출처 추가 | D |
| GEO-CITE-002 · 출처 링크 품질 | Citation Readiness | TRUST-003과 같은 설명적 외부 링크 하나 | 있음 / 외부 링크만 있음 / 없음 / 미지원 | 6 / 6 | 첫 anchor text | 출처 품질 / 설명적 anchor 사용 | D |
| GEO-CITE-003 · 엔티티 명명 일관성 | Citation Readiness | title에 H1 앞 20자 포함 | 포함 / title·H1은 있으나 불포함 / 둘 중 하나 없음 / 미지원 | 6 / 6 | title + 첫 H1 | entity consistency / 핵심 이름 통일 | D |
| GEO-ACCESS-001 · 초기 HTML 본문 노출 | Content Accessibility | 정규화 raw body text 길이 | 120자 이상 / 없음 / 120자 미만 / 미지원 | 8 / 8 | `n자` | raw 수집 가능성 / 초기 HTML에 본문 제공 | D |
| GEO-ACCESS-002 · 읽기 가능한 텍스트 | Content Accessibility | body 길이와 paragraph 수 | 600자 이상+3문단 이상 / 250자 이상 / 250자 미만 / 미지원 | 5 / 5 | `n자 / n문단` | 읽기 가능성 / 문단 구조와 내용 보강 | D |
| GEO-ACCESS-003 · 접근 차단 요소 없음 | Content Accessibility | body<180자이면서 로그인/enable JS 문구인지 | 조건 아님 / 없음 / 조건 충족 / 미지원 | 3 / 3 | `본문 접근 가능` 또는 차단 문구 | 접근성 gate / 인증·JS shell 제거 | D |
| GEO-ACCESS-004 · 언어 식별 가능 | Content Accessibility | SEO lang과 같은 값 | lang 존재 / 없음 / 누락 / 미지원 | 4 / 4 | lang 원문 | 언어 식별 / lang 선언 | A |

## 11. SmartMind AI 계산 감사 — SEO 97 / GEO 92

### 11.1 분석 기준

- 입력 URL: `https://smartmind-ai.io/`
- 최종 URL: `https://smartmind-ai.io/`
- Ruleset: `2026.08.1`
- 재확인 결과: SEO 97, GEO 92
- 아래 획득점은 `PASS=weight`, `WARN=weight×0.5`, `FAIL=0`으로 계산했다.

### 11.2 SEO 97점 전체 계산

#### Technical SEO — 20 / 20

| Rule | 결과 | 계산 | 실제 Evidence |
|---|---:|---:|---|
| SEO-TECH-001 HTTPS 사용 | PASS | 5×1 = **5** | `https://smartmind-ai.io/` |
| SEO-TECH-002 Canonical 존재 | PASS | 5×1 = **5** | `https://smartmind-ai.io` |
| SEO-TECH-003 Robots 지시 명확성 | PASS | 5×1 = **5** | `해당 요소 없음` |
| SEO-TECH-004 문서 언어 선언 | PASS | 5×1 = **5** | `ko` |

#### On-page — 22 / 25

| Rule | 결과 | 계산 | 실제 Evidence |
|---|---:|---:|---|
| SEO-ONPAGE-001 Title 품질 | PASS | 8×1 = **8** | `SmartMind AI — 온톨로지 기반 AI로 기업의 일하는 방식을 바꿉니다` |
| SEO-ONPAGE-002 Meta description 품질 | WARN | 6×0.5 = **3** | `Qurify 온톨로지 플랫폼을 기반으로 … AI 솔루션을 제공합니다.` |
| SEO-ONPAGE-003 단일 핵심 H1 | PASS | 6×1 = **6** | `온톨로지 기반 AI로기업의 일하는 방식을 바꿉니다` |
| SEO-ONPAGE-004 Heading 계층 | PASS | 5×1 = **5** | H1→H2→H3→H4 heading 목록 |

#### Indexability — 20 / 20

| Rule | 결과 | 계산 | 실제 Evidence |
|---|---:|---:|---|
| SEO-INDEX-001 Noindex 차단 없음 | PASS | 10×1 = **10** | `해당 요소 없음` |
| SEO-INDEX-002 Robots 차단 없음 | PASS | 5×1 = **5** | `해당 요소 없음` |
| SEO-INDEX-003 Canonical 일관성 | PASS | 5×1 = **5** | `https://smartmind-ai.io` |

#### Structured Data — 15 / 15

| Rule | 결과 | 계산 | 실제 Evidence |
|---|---:|---:|---|
| SEO-SCHEMA-001 JSON-LD 문법 | PASS | 8×1 = **8** | `1개 유효 / 0개 오류` |
| SEO-SCHEMA-002 Schema 유형 | PASS | 7×1 = **7** | `Organization` |

#### Content Basics — 20 / 20

| Rule | 결과 | 계산 | 실제 Evidence |
|---|---:|---:|---|
| SEO-CONTENT-001 충분한 본문 | PASS | 8×1 = **8** | `1907자` |
| SEO-CONTENT-002 내부 링크 | PASS | 4×1 = **4** | `38개` |
| SEO-CONTENT-003 이미지 대체 텍스트 | PASS | 4×1 = **4** | `100%` |
| SEO-CONTENT-004 콘텐츠 갱신 신호 | PASS | 4×1 = **4** | `날짜 신호 발견` |

```text
SEO = Technical 20 + On-page 22 + Indexability 20
    + Structured Data 15 + Content Basics 20
    = 97 / 100
```

### 11.3 GEO 92점 전체 계산

#### Answerability — 20 / 20

| Rule | 결과 | 계산 | 실제 Evidence |
|---|---:|---:|---|
| GEO-ANSWER-001 직접 답변 블록 | PASS | 8×1 = **8** | `데이터를 지식 자산으로 구조화하고… 산업에 맞는 AI 솔루션을 제공합니다.` |
| GEO-ANSWER-002 질문형 Heading | PASS | 6×1 = **6** | `기업 데이터 활용, 아직도 이렇게 일하고 계신가요?` 포함 heading 목록 |
| GEO-ANSWER-003 목록·표 구조 | PASS | 6×1 = **6** | `12개 목록 / 0개 표` |

#### Machine Readability — 20 / 20

| Rule | 결과 | 계산 | 실제 Evidence |
|---|---:|---:|---|
| GEO-MACHINE-001 Heading 구조 | PASS | 6×1 = **6** | H1→H2→H3→H4 heading 목록 |
| GEO-MACHINE-002 의미 구조 | PASS | 6×1 = **6** | `7개` main/article/section 요소 |
| GEO-MACHINE-003 메타데이터 명확성 | PASS | 4×1 = **4** | title + meta description 원문 |
| GEO-MACHINE-004 구조화 데이터 | PASS | 4×1 = **4** | `Organization` |

#### Evidence & Trust — 15 / 20

| Rule | 결과 | 계산 | 실제 Evidence |
|---|---:|---:|---|
| GEO-TRUST-001 저자 정보 | FAIL | 5×0 = **0** | `없음` |
| GEO-TRUST-002 작성·수정 날짜 | PASS | 5×1 = **5** | `발견` |
| GEO-TRUST-003 외부 근거 링크 | PASS | 6×1 = **6** | `1개` |
| GEO-TRUST-004 발행 주체 식별 | PASS | 4×1 = **4** | `Organization` |

#### Citation Readiness — 17 / 20

| Rule | 결과 | 계산 | 실제 Evidence |
|---|---:|---:|---|
| GEO-CITE-001 주장과 근거의 근접성 | PASS | 8×1 = **8** | `4개 주장 / 1개 외부 링크` |
| GEO-CITE-002 출처 링크 품질 | PASS | 6×1 = **6** | `전화 070-7151-9357` |
| GEO-CITE-003 엔티티 명명 일관성 | WARN | 6×0.5 = **3** | title과 H1 문자열 불일치 |

#### Content Accessibility — 20 / 20

| Rule | 결과 | 계산 | 실제 Evidence |
|---|---:|---:|---|
| GEO-ACCESS-001 초기 HTML 본문 노출 | PASS | 8×1 = **8** | `1907자` |
| GEO-ACCESS-002 읽기 가능한 텍스트 | PASS | 5×1 = **5** | `1907자 / 36문단` |
| GEO-ACCESS-003 접근 차단 요소 없음 | PASS | 3×1 = **3** | `본문 접근 가능` |
| GEO-ACCESS-004 언어 식별 가능 | PASS | 4×1 = **4** | `ko` |

```text
GEO = Answerability 20 + Machine Readability 20 + Evidence & Trust 15
    + Citation Readiness 17 + Content Accessibility 20
    = 92 / 100
```

## 12. 현행 방법론 문제 감사

### 12.1 너무 쉽게 PASS되는 Rule

- `SEO-TECH-003`: robots가 아예 없어도 “명확성” PASS. WARN 분기가 사실상 도달하지 않는다.
- `SEO-INDEX-001/002`: directive 미선언은 표준 기본값상 index/follow이므로 기술적으로 정상일 수 있지만, Evidence가 `해당 요소 없음`인데 각각 10점·5점의 확정 PASS로 보이는 표현은 오해를 만든다.
- `SEO-SCHEMA-002`: 아무 `@type` 하나면 7점. context, required property, 본문 일치를 측정하지 않는다.
- `GEO-ANSWER-001`: 어떤 40~320자 문단 하나만 있어도 “직접 답변” 8점.
- `GEO-MACHINE-002`: main/article/section 하나만 있어도 “의미 구조” 6점.
- `GEO-MACHINE-003`: title과 meta가 존재하면 내용의 명확성을 읽지 않고 PASS.
- `GEO-ACCESS-003`: 180자 미만의 매우 좁은 차단 문구 패턴만 FAIL하므로 대부분 PASS.

### 12.2 근거 없이 높은 Weight

- `SEO-ONPAGE-001` 8점: 20~65자 threshold는 Google의 고정 제한이 아닌 CiteGraph heuristic.
- `SEO-CONTENT-001` 8점: 600자 이상을 품질로 보는 실증 근거가 없다.
- `SEO-SCHEMA-001` 8점과 `SEO-SCHEMA-002` 7점: JSON parse/type 존재만으로 Structured Data 15점 전체를 얻는다.
- `GEO-ANSWER-001` 8점: directness를 측정하지 않고 paragraph 길이만 측정.
- `GEO-CITE-001` 8점: claim-source 근접성을 측정하지 않는데 높은 배점.
- `GEO-ACCESS-001` 8점: 120자 threshold만으로 핵심 콘텐츠 접근성을 확정.

### 12.3 중복 Rule과 SEO/GEO 중복 평가

| 동일하거나 강하게 겹치는 사실 | 관련 Rule |
|---|---|
| Heading 계층 | SEO-ONPAGE-004 ↔ GEO-MACHINE-001 |
| title/meta 존재 | SEO-ONPAGE-001/002 ↔ GEO-MACHINE-003 |
| JSON-LD/type 존재 | SEO-SCHEMA-001/002 ↔ GEO-MACHINE-004 |
| 날짜 신호 | SEO-CONTENT-004 ↔ GEO-TRUST-002 |
| lang 존재 | SEO-TECH-004 ↔ GEO-ACCESS-004 |
| body text 길이 | SEO-CONTENT-001 ↔ GEO-ACCESS-001/002 |
| 외부 링크/anchor | GEO-TRUST-003 ↔ GEO-CITE-002 |
| author/publisher schema | GEO-TRUST-001/004 일부 중복 |

동일 Fact를 Evidence Layer에서 재사용하는 것은 바람직하지만, 서로 다른 품질을 측정하지 않으면서 여러 Rule에서 반복 배점하는 것은 재검토해야 한다.

### 12.4 측정하지 않았는데 PASS된 항목

- SmartMind의 `SEO-TECH-003`, `SEO-INDEX-001`, `SEO-INDEX-002`: 실제 evidence가 모두 `해당 요소 없음`인데 20점을 획득.
- `SEO-CONTENT-003`: 이미지가 0개로 수집되면 alt 비율을 자동 100%로 만든다. 이미지 없음은 PASS보다 N/A가 적절하다.
- `GEO-CITE-001`: claim이 0개면 source 관계를 측정하지 않아도 자동 PASS.
- SmartMind의 `GEO-CITE-002`: `전화 070-7151-9357`이 출처 품질 PASS evidence다. `tel:` 링크를 외부 citation으로 잘못 분류한다.
- `GEO-ACCESS-003`: 제한된 차단 문자열이 없다는 사실만으로 일반적인 접근 가능성을 확정한다.

### 12.5 HTML만 보고 판단할 수 없는 항목

- 검색엔진이 실제로 선택한 canonical과 실제 색인 상태
- robots.txt, crawler별 접근 결과, 지역·세션·렌더링 조건
- title/meta가 검색결과에서 실제 채택되는지
- 저자와 publisher의 실제 신원·전문성·신뢰성
- 날짜가 실제 콘텐츠 갱신을 반영하는지
- 외부 출처의 권위·원출처성·정확성
- source가 특정 claim을 실제로 뒷받침하는지
- 문단이 질문에 직접적이고 충분한 답을 제공하는지
- schema가 가시 콘텐츠의 의미와 사실적으로 일치하는지
- 실제 Gemini/ChatGPT Search/Perplexity 노출 및 인용 여부

### 12.6 N/A가 필요한 항목

- 저자: homepage, contact, utility, 일부 product page
- 작성·수정 날짜: evergreen homepage와 날짜 의미가 없는 페이지
- 질문형 heading: 질문 응답 구조가 목적이 아닌 transactional/utility page
- 목록·표: 비교·단계·열거 정보가 없는 페이지
- 외부 citation: 외부 근거가 필요 없는 navigational/transactional page
- claim-source 관계: 검증 가능한 claim이 없는 페이지
- 이미지 alt: 이미지가 없거나 모든 이미지가 장식용인 경우
- 내부 링크: 독립 terminal/utility page
- canonical: 명시적 적용 정책에서 제외되는 특수 문서
- 충분한 본문/읽기 가능한 텍스트: 긴 설명이 목적이 아닌 도구·로그인·contact page

### 12.7 Heuristic을 확정적 사실처럼 처리하는 항목

- title 20~65자, meta 70~170자
- 본문 600자, 초기 HTML 120자, 차단 shell 180자
- 내부 링크 2개, 목록/table selector 2개
- 40~320자 paragraph를 direct answer로 간주
- anchor 4자 이상이면 evidence/source quality로 간주
- 숫자 regex를 claim 전체로 간주
- 외부 링크 하나면 모든 claim에 근거가 있다고 간주
- H1 앞 20자가 title에 포함되면 entity consistency로 간주
- main/article/section 하나면 의미 구조가 충분하다고 간주
- author/date/schema type 존재를 trust quality로 간주

## 13. 검토 결론

SmartMind AI의 `SEO 97 / GEO 92`는 현행 코드 계산상 정확하다. 그러나 점수가 페이지의 실제 품질을 같은 수준으로 증명하지는 않는다. 특히 GEO 92에는 전화 링크를 출처로 인정한 6점, 실제 claim-source 관계를 확인하지 않은 8점, title/meta/schema/HTML 요소의 존재를 품질로 확대 해석한 점수가 포함되어 있다.

따라서 이 결과는 현재 `rulesetVersion 2026.08.1`의 재현 가능한 출력으로 보존하되, 방법론 승인 전에는 scoring 코드를 수정하지 않는다.

## 14. Scoring v2 의사결정 기록 — 2026-08-18

> 이 절은 v2 설계의 승인된 원칙이다. 앞 절의 현행 `2026.08.1` 계산을 소급 변경하지 않는다.

### 14.1 Atomic Check와 Scoring Rule

- **Atomic Check**는 한 사실 또는 한 판정 질문에만 답하며 Weight를 갖지 않는다.
- **Scoring Rule**은 하나 이상의 Atomic Check를 명시적으로 조합하고 실제 Weight를 갖는다.
- Atomic Check 분해로 Rule 수가 늘어도 category나 score domain의 Weight 총량은 증가하지 않는다.
- 하나의 복합 Rule을 4개 check로 나누었다고 점수가 4배가 되지 않는다.

### 14.2 SEO

- SEO Score 100에는 FACT/validator 결과만 포함한다.
- title/meta/topic alignment, heading 대표성, schema-visible 의미 일치, anchor 문맥, alt 의미 적합성은 `SEO Advisory`다.
- Advisory는 Evidence와 Recommendation을 제공하지만 SEO 점수 Weight는 0이다.
- title/meta/body 길이는 official hard threshold가 아니다. page type/language aware heuristic으로 관리하고 Weight Confidence는 기본 Low다.

### 14.3 GEO

- `GEO Technical Readiness`와 `GEO Semantic Readiness`를 각각 독립적으로 산출한다.
- Fact 40 / Semantic 60은 calibration용 provisional envelope이며 확정 Overall 공식이 아니다.
- calibration 전에는 두 readiness를 결합해 단일 공식 점수라고 표현하지 않는다.
- Semantic Engine 미실행 시 Semantic Readiness는 NOT_EVALUATED이며 Technical 점수를 100점 Overall로 대체하지 않는다.

### 14.4 중복 Fact

- date, lang, heading, schema, title, meta, main text 등은 Evidence Layer에 한 번만 저장한다.
- SEO/GEO check는 동일 Fact ID를 참조할 수 있다.
- 같은 사실에 같은 질문으로 두 번 Weight를 주지 않는다.
- 서로 다른 평가 목적이라고 주장하는 경우 Registry에 atomic question 차이를 명시해야 한다.

### 14.5 Indexability

- Noindex/indexing gate는 최대 12점까지 허용한다.
- Canonical 존재 자체에는 높은 Weight를 주지 않는다.
- Canonical declaration/validity/relation을 분리한다.
- 중복 page context나 대표 URL 의도를 알 수 없으면 canonical 적절성은 UNKNOWN이다.

### 14.6 Page Type Confidence

```text
confidence >= 0.85  → AUTO_ASSIGNED
0.60~0.84          → PROVISIONAL
confidence < 0.60  → UNKNOWN
```

결과에는 `type`, `confidence`, `alternatives`, `evidenceIds`를 저장한다. PROVISIONAL/UNKNOWN 유형 때문에 applicability가 달라지면 자동 N/A 대신 UNKNOWN을 허용한다.

### 14.7 External Citation

- scoring v2에서는 citation URL scheme, anchor, DOM location, claim candidate와의 구조적 근접성까지만 측정한다.
- citation target fetch, 실제 claim support, authority·원출처성 평가는 Semantic v2.1로 연기한다.
- target snapshot 없이 support/authority를 PASS 또는 FAIL하지 않는다.

### 14.8 버전 관계

- 현행: `rulesetVersion 2026.08.1` — 코드에 구현된 35개 Rule
- 설계: `methodology-v2-draft.2` — 61 Atomic Check와 별도 Scoring Rule Registry
- v2 Registry와 fixture 기대 결과가 승인되기 전에는 scoring 코드를 변경하지 않는다.
