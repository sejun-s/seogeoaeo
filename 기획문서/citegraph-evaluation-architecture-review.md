# CiteGraph 평가 아키텍처 재검토

> 상태: 설계 검토안  
> 기준 구현: `citegraph-app/lib/audit.ts`  
> 변경 범위: 문서만 작성. 현재 Rule, Weight, 판정식, 점수 로직은 변경하지 않음.

## 1. 결론

현재 SEO/GEO 평가는 모두 HTML에서 추출한 신호를 규칙식에 넣는 단일 엔진이다. 이 방식은 존재 여부, 개수, 길이, HTTP/DOM 상태처럼 관찰 가능한 사실에는 적합하지만, 답변의 직접성, 출처의 권위, 주장과 근거의 관계처럼 의미를 이해해야 하는 항목까지 신뢰성 있게 판정할 수는 없다.

권장 구조는 다음과 같다.

- **SEO Score**는 가능한 한 DETERMINISTIC으로 유지한다. 검색엔진이 실제로 선택한 canonical이나 색인 여부처럼 HTML 한 장만으로 확정할 수 없는 값은 외부 관측 데이터가 없으면 `UNKNOWN`으로 남긴다.
- **GEO Readiness**는 Fact와 Semantic 평가를 분리한다. LLM이 없는 상태에서는 `GEO Fact Readiness`만 확정하고, 의미 품질이 필요한 항목을 HTML 휴리스틱으로 PASS 처리하지 않는다.
- 최종 점수는 Rule 결과보다 먼저 Evidence를 저장하고, 판정은 저장된 Evidence를 참조한다. 모든 점수는 `Score → Category → Rule → Evidence → Recommendation`으로 추적 가능해야 한다.
- 향후 LLM은 사실 추출 엔진을 대체하지 않는다. 정규화된 본문과 Fact Engine의 결과를 입력받아 명시적 rubric에 따라 의미 평가만 담당한다.

## 2. 분류 기준

| 종류 | 정의 | 예시 |
|---|---|---|
| DETERMINISTIC | 동일한 HTML/HTTP/DOM 입력이면 코드만으로 동일한 결과가 나오는 평가 | HTTPS, `lang`, title 존재/길이, JSON-LD 파싱 성공 |
| SEMANTIC | 문장의 의미, 품질, 관련성 또는 신뢰성을 이해해야 하는 평가 | 답변이 질문에 직접 답하는가, 출처가 주장을 실제로 뒷받침하는가 |
| HYBRID | 객관적 사실 확인과 의미 판단이 모두 필요한 평가 | 저자 표시는 존재하지만 신뢰 가능한 저자인가, 구조화 데이터가 존재하며 본문과 일치하는가 |

`DETERMINISTIC`은 곧 “검색 성과를 확정적으로 예측한다”는 뜻이 아니다. 입력에서 신호를 재현 가능하게 측정할 수 있다는 뜻이다. 반대로 LLM을 사용해도 실제 검색엔진 노출이나 인용을 직접 관측하지 않은 이상 그것을 사실로 단정할 수 없다.

위험 표기: **낮음 / 중간 / 높음**. 재현성 위험은 같은 페이지의 반복 평가가 달라질 가능성, hallucination 위험은 입력에 없는 사실을 평가기가 만들어낼 가능성이다.

## 3. SEO Rule 분류

SEO는 17개 Rule 모두 코드 기반 측정을 유지할 수 있다. 다만 “존재”와 “품질”, “페이지 신호”와 “검색엔진의 실제 처리 결과”를 구분해야 한다.

| Rule ID | 분류 | 현재 평가 방식 | 권장 평가 방식 | Deterministic 가능 | LLM | 필요한 입력 데이터 | Rubric | 재현성 | Hallucination |
|---|---|---|---|---|---|---|---|---|---|
| SEO-TECH-001 | DETERMINISTIC | 최종 URL protocol이 HTTPS면 PASS | redirect chain의 각 hop과 최종 HTTPS, mixed-content는 별도 Rule로 측정 | 전체 | 불필요 | 요청 URL, redirect chain, 최종 URL, 선택적으로 DOM resource URL | 불필요 | 낮음 | 낮음 |
| SEO-TECH-002 | DETERMINISTIC | canonical 문자열이 있으면 PASS | 존재, URL 유효성, 절대/상대 URL 해석, fetch URL과의 관계를 각각 사실로 기록. 검색엔진 선택 canonical은 별도 외부 관측 | 부분: 선언은 가능, 선택 결과는 불가 | 불필요 | HTML canonical, base URL, 최종 URL | 불필요 | 낮음 | 낮음 |
| SEO-TECH-003 | DETERMINISTIC | robots 문자열에 단순 상충 정규식이 없으면 PASS. 값이 없어도 PASS | meta/X-Robots-Tag directive를 token 단위로 파싱하고 적용 UA 및 충돌을 판정. 미설정은 `NOT_PRESENT`, robots.txt는 별도 fetch | 전체(페이지 지시), 부분(robots.txt 미포함) | 불필요 | meta robots, HTTP X-Robots-Tag, UA, robots.txt | 불필요 | 낮음 | 낮음 |
| SEO-TECH-004 | DETERMINISTIC | `html[lang]`이 비어 있지 않으면 PASS | BCP 47 형식 유효성과 선언 언어를 측정. 실제 본문 언어 일치는 별도 HYBRID 검사로 분리 가능 | 전체 | 불필요. 본문 일치 확인에는 선택적 모델/언어 감지기 | `html[lang]`, 본문 표본 | 형식 검사는 불필요 | 낮음 | 낮음 |
| SEO-ONPAGE-001 | DETERMINISTIC | title 20~65자 PASS, 그 밖의 존재는 WARN | 존재, 공백 정규화 길이, 중복/boilerplate를 분리. 고정 길이는 heuristic임을 표시. SERP title 선택은 Search Console 없이는 UNKNOWN | 전체(페이지 신호) | 불필요 | title, 사이트/프로젝트 내 다른 title(중복 검사 시) | 불필요 | 낮음 | 낮음 |
| SEO-ONPAGE-002 | DETERMINISTIC | meta description 70~170자 PASS | 존재와 길이를 사실로 측정하되 고정 길이는 권고 신호로만 사용. 검색결과 snippet 채택 여부는 외부 관측 | 전체(페이지 신호) | 불필요 | meta description | 불필요 | 낮음 | 낮음 |
| SEO-ONPAGE-003 | DETERMINISTIC | H1이 정확히 1개면 PASS | H1 개수와 텍스트를 측정. 복수 H1을 자동 결함으로 확정할지 방법론에서 별도 결정 | 전체 | 불필요 | DOM H1 목록 | 불필요 | 낮음 | 낮음 |
| SEO-ONPAGE-004 | DETERMINISTIC | heading이 2개 이상이고 level skip이 없으면 PASS | heading 순서, 빈 heading, level transition을 각각 측정. 의미상 올바른 문서 개요인지는 별도 SEMANTIC 항목으로 분리 | 구조는 전체, 의미는 불가 | 구조에는 불필요 | H1~H6 순서와 텍스트 | 구조는 불필요 | 낮음 | 낮음 |
| SEO-INDEX-001 | DETERMINISTIC | robots 문자열에 `noindex`가 없으면 PASS | meta와 header의 유효 directive를 파싱. “noindex 지시 없음”과 “실제 index 가능/색인됨”을 구분 | 지시 확인 전체, 실제 색인 불가 | 불필요 | meta robots, X-Robots-Tag, HTTP status, robots.txt, 선택적으로 Search Console | 불필요 | 낮음 | 낮음 |
| SEO-INDEX-002 | DETERMINISTIC | robots 문자열에 `none`/`nofollow`가 없으면 PASS | directive token을 정확히 파싱하고 `none`을 확장. 링크 crawl 결과나 robots.txt 차단과 혼동하지 않음 | 전체(페이지 지시) | 불필요 | meta robots, X-Robots-Tag | 불필요 | 낮음 | 낮음 |
| SEO-INDEX-003 | DETERMINISTIC | canonical hostname이 최종 URL hostname과 같으면 PASS | canonical URL 정규화 후 exact/near/self/cross-domain 관계를 사실로 반환. 올바른 canonical인지는 중복 페이지 집합 없이는 UNKNOWN | 관계는 전체, 적절성은 부분 | 불필요 | canonical, 최종 URL, 중복 후보 페이지/사이트 crawl(적절성 판단 시) | 불필요 | 낮음 | 낮음 |
| SEO-SCHEMA-001 | DETERMINISTIC | JSON-LD가 있고 전부 JSON parse되면 PASS, 없으면 WARN | JSON 문법, `@context`, schema vocabulary, 필수/권장 속성, DOM과의 일치를 단계별 분리. Microdata/RDFa도 추출 | 문법/형식 전체, 내용 일치는 부분 | DOM 일치의 복잡한 경우에만 선택적 | JSON-LD, Microdata, RDFa, DOM 가시 콘텐츠 | validator 기준 필요 | 낮음 | 낮음 |
| SEO-SCHEMA-002 | HYBRID | 파싱된 JSON-LD에 아무 `@type`이나 있으면 PASS | type 존재/지원 여부는 deterministic, 페이지 유형 적합성과 속성의 실제 콘텐츠 일치는 semantic 또는 type별 validator | 부분 | 적합성/일치에 권장, 단순 지원 type 검사는 불필요 | schema graph, DOM 본문, page type | 필요 | 중간 | 중간 |
| SEO-CONTENT-001 | DETERMINISTIC | 본문 600자 이상 PASS, 250자 이상 WARN | 추출 가능한 본문 길이를 사실로 제공. 길이를 곧 품질로 보지 않고 템플릿 대비 main-content 비율 등을 별도 측정 | 전체(길이), 품질은 불가 | SEO 기본 점수에는 불필요 | main/article/body 정규화 text, boilerplate 정보 | 불필요 | 낮음 | 낮음 |
| SEO-CONTENT-002 | DETERMINISTIC | 내부 링크 2개 이상 PASS | 유효한 crawlable HTTP(S) 내부 링크, 고유 destination, anchor 존재를 분리. 페이지 유형별 N/A 정책 필요 | 전체 | 불필요 | base URL, 링크 href/anchor/rel, page type | N/A 기준만 필요 | 낮음 | 낮음 |
| SEO-CONTENT-003 | DETERMINISTIC | 수집된 img의 alt 비율 100% PASS, 이미지가 0개여도 100% | 이미지 없음은 N/A. `alt` 속성 없음과 `alt=""`를 구분하고 decorative/functional/informative 분류 후 평가 | 속성은 전체, alt 적절성은 부분 | alt 의미 적절성에는 권장 | img src/alt/role, 주변 텍스트, 링크/버튼 문맥 | 이미지 역할별 필요 | 중간 | 중간 |
| SEO-CONTENT-004 | DETERMINISTIC | time/meta/JSON 텍스트에서 date 신호가 하나라도 있으면 PASS | 날짜 종류, 파싱 가능성, visible date와 schema 일치, page type별 N/A를 분리. 최신성/정확성은 별도 | 존재/형식 전체, 적절성 부분 | 불필요. 의미상 날짜 종류가 불명확할 때만 선택적 | time, article meta, schema datePublished/dateModified, page type | N/A 기준 필요 | 낮음 | 낮음 |

## 4. GEO Rule 분류

현재 GEO 18개 중 **순수 DETERMINISTIC으로 최종 판정 가능한 것은 6개**, 의미를 포함한 **HYBRID가 10개**, 본질적으로 **SEMANTIC인 항목이 2개**다. 다만 HYBRID Rule의 fact 부분은 지금도 안전하게 측정할 수 있다.

| Rule ID | 분류 | 현재 평가 방식 | 권장 평가 방식 | Deterministic 가능 | LLM | 필요한 입력 데이터 | Rubric | 재현성 | Hallucination |
|---|---|---|---|---|---|---|---|---|---|
| GEO-ANSWER-001 | SEMANTIC | 40~320자 paragraph가 하나라도 있으면 “직접 답변” PASS | 대표 질문/heading과 답변 후보를 연결하고, 핵심 답을 앞부분에서 직접 제공하는지 평가. 길이는 후보 추출 신호일 뿐 점수 근거가 아님 | 아니오 | 필요 | heading, 인접 paragraph, 문서 주제, 문장 위치 | 필요 | 높음 | 중간 |
| GEO-ANSWER-002 | HYBRID | heading에 `?`가 있거나 일부 한/영 의문사로 시작하면 PASS | 질문형 heading 존재는 fact로 측정하고, 해당 질문이 검색 의도와 관련되며 뒤 콘텐츠가 실제 답하는지는 semantic 평가 | 부분 | 권장 | heading 순서, 인접 section, page topic | 필요 | 중간 | 중간 |
| GEO-ANSWER-003 | HYBRID | `li`와 `table` selector 합이 2개 이상이면 PASS | 목록/표 존재와 규모는 fact. 답변을 더 명확하게 구조화하는지, 값과 label이 해석 가능한지는 semantic 평가 | 부분 | 권장 | list/table DOM, caption/header, 주변 heading/text | 필요 | 중간 | 중간 |
| GEO-MACHINE-001 | DETERMINISTIC | heading 2개 이상이고 level skip이 없으면 PASS | heading 구조 사실만 판정. 논리적 개요 품질은 별도 semantic sub-check로 분리 | 전체(구조) | 불필요 | heading level/order/text | 불필요 | 낮음 | 낮음 |
| GEO-MACHINE-002 | DETERMINISTIC | main/article/section 중 하나라도 있으면 PASS | landmark 존재, nesting, main 개수, main text coverage를 측정. 태그 존재만으로 semantic quality를 주장하지 않음 | 전체 | 불필요 | DOM landmarks와 text coverage | 불필요 | 낮음 | 낮음 |
| GEO-MACHINE-003 | HYBRID | title과 meta가 모두 존재하면 “metadata clarity” PASS | 존재/길이/중복은 fact, 페이지 주제를 정확하고 명료하게 요약하는지는 semantic 평가 | 부분 | 권장 | title, meta, H1, main-content summary | 필요 | 중간 | 중간 |
| GEO-MACHINE-004 | HYBRID | 유효 JSON-LD가 하나라도 있으면 PASS | syntax/type/required properties는 fact, DOM과의 일치·엔터티 표현의 충실성은 semantic/validator 평가 | 부분 | 권장 또는 type별 validator | 전체 schema graph, DOM, visible entity facts | 필요 | 중간 | 중간 |
| GEO-TRUST-001 | HYBRID | author signal이 하나라도 있으면 PASS | 저자 표시/URL/Person schema는 fact. 저자와 콘텐츠 연결, 자격·책임성·식별 가능성은 semantic/외부 관측 | 부분 | 권장. 외부 검증은 별도 데이터 필요 | author DOM/schema, bio URL, page type, 선택적으로 외부 identity data | 필요 | 중간 | 높음 |
| GEO-TRUST-002 | HYBRID | 날짜 신호가 하나라도 있으면 PASS | 날짜 존재/형식/일치는 fact. 최신성이 필요한 문서인지와 내용이 실제 갱신됐는지는 semantic/외부 history 평가 | 부분 | 권장 | date signals, page type, content, 선택적으로 crawl history | 필요 | 중간 | 중간 |
| GEO-TRUST-003 | HYBRID | anchor 4자 이상인 외부 링크가 하나라도 있으면 PASS | HTTP(S) 외부 인용 링크와 claim 인접성은 fact로 후보화. 출처의 권위·관련성·실제 뒷받침 여부는 semantic 및 대상 페이지 확인 | 부분 | 필요 | claim 문장, link URL/anchor/position/rel, 대상 페이지 content/status | 필요 | 높음 | 높음 |
| GEO-TRUST-004 | HYBRID | schema type에 Organization/Person/NewsMediaOrganization이 있으면 PASS | publisher entity 선언/식별자는 fact. 실제 발행 주체와의 일치, 연락 가능성, 책임성은 semantic/외부 entity 검증 | 부분 | 권장 | publisher schema, logo/url/sameAs, visible organization data, 외부 entity data | 필요 | 중간 | 높음 |
| GEO-CITE-001 | SEMANTIC | 숫자형 claim이 없거나 외부 링크가 하나라도 있으면 PASS | 검증 가능한 claim을 식별하고 각 claim에 근거가 연결되는지, 근거가 해당 claim을 지지하는지 평가. claim 없음은 PASS가 아니라 N/A | 아니오 | 필요 | 문장 단위 본문, citation/link 위치, source content, claim type | 필요 | 높음 | 높음 |
| GEO-CITE-002 | HYBRID | anchor 4자 이상 외부 링크가 하나라도 있으면 PASS | citation 후보의 접근성/HTTP 상태/anchor/rel은 fact. 출처 품질, 원출처성, 관련성은 semantic 및 외부 페이지 평가 | 부분 | 필요 | outbound URL, anchor/context, target content/metadata, source-type signals | 필요 | 높음 | 높음 |
| GEO-CITE-003 | HYBRID | title에 H1 앞 20자가 포함되면 PASS | title/H1/schema entity의 문자열·ID 일치는 fact. 동일 엔터티를 일관되게 지칭하는지와 모호성이 없는지는 semantic 평가 | 부분 | 권장 | title, H1, canonical, schema `@id`/name/url, main topic | 필요 | 중간 | 중간 |
| GEO-ACCESS-001 | DETERMINISTIC | 초기 HTML body text 120자 이상이면 PASS | raw response와 렌더 전 main text 양, JS 의존 여부를 측정. 접근 가능성과 의미 품질을 분리 | 전체 | 불필요 | raw HTML, parsed text, 선택적으로 rendered DOM 차이 | 불필요 | 낮음 | 낮음 |
| GEO-ACCESS-002 | HYBRID | body 600자 이상이며 paragraph 3개 이상 PASS, 250자 이상 WARN | 추출 가능한 본문/문단 구조는 fact. 문장 명료성, 난이도, 중복, coherence는 semantic 또는 언어별 검증 | 부분 | 권장 | main text, paragraphs, language, page type | 필요 | 중간 | 중간 |
| GEO-ACCESS-003 | DETERMINISTIC | body 180자 미만이며 로그인/JS 문구가 있을 때만 FAIL | HTTP status, auth wall/cookie wall/robots, DOM text, rendered-vs-raw 차이를 별도 fact로 측정. 미탐지는 “확실한 접근 가능”과 구분 | 부분: 관측 환경 내에서는 가능 | 불필요 | HTTP status/headers, raw DOM, rendered DOM, redirect chain, robots.txt | 불필요 | 중간 | 낮음 |
| GEO-ACCESS-004 | DETERMINISTIC | `html[lang]`이 있으면 PASS | lang 존재와 BCP 47 유효성 측정. 본문 실제 언어는 deterministic language detector로 보조 가능 | 전체 | 불필요 | html lang, 본문 표본 | 불필요 | 낮음 | 낮음 |

## 5. 현재 GEO Score에서 신뢰할 수 있는 범위

### 5.1 LLM 없이 신뢰성 있게 평가 가능한 것

아래는 “AI 검색 노출 가능성” 자체가 아니라 페이지에서 객관적으로 관측한 **GEO Fact Readiness** 신호로 신뢰할 수 있다.

- heading의 존재, 순서, level skip
- main/article/section landmark 존재와 main text coverage
- title/meta의 존재와 기계적 길이
- 구조화 데이터의 문법 파싱, type 및 필드 존재
- 저자·날짜·publisher 표식의 존재 여부
- 외부 HTTP(S) 링크의 존재, 위치, anchor, 상태 코드
- 초기 HTML의 텍스트 양과 client rendering 의존도
- HTTP 상태, redirect, 접근 차단 표식
- 문단·목록·표의 존재와 DOM 구조
- `lang` 선언과 형식 유효성

이 신호는 모두 동일 입력에 동일 결과를 낼 수 있지만, 존재만으로 답변 품질·신뢰성·인용 가능성을 증명하지 않는다.

### 5.2 LLM 또는 외부 데이터 없이 신뢰성 있게 평가할 수 없는 것

- 문단이 사용자 질문에 직접적이고 충분한 답을 제공하는지
- 질문 heading 뒤 내용이 실제로 그 질문에 답하는지
- 목록/표가 정보를 이해하기 쉽게 구조화하는지
- metadata가 본문 주제를 정확하고 명료하게 대표하는지
- schema가 가시 콘텐츠와 의미상 일치하는지
- 저자와 publisher가 실제로 식별 가능하고 신뢰할 수 있는지
- 날짜가 콘텐츠의 실제 최신성을 반영하는지
- 어떤 문장이 검증 가능한 claim인지
- citation이 특정 claim을 실제로 뒷받침하는지
- 외부 링크가 권위 있는 원출처인지
- title/H1/schema가 같은 엔터티를 일관되게 설명하는지
- 본문이 명료하고 응집력 있으며 읽기 쉬운지

따라서 현재의 **GEO 0~100 전체 점수는 Fact와 heuristic이 섞인 readiness 추정치**다. 현재 Rule을 바꾸기 전까지 UI와 문서에서는 이 한계를 명시해야 한다. 향후에는 의미 평가가 없는 실행에서 semantic Rule을 자동 PASS/FAIL하지 않고 `NOT_EVALUATED`로 표시하는 것이 바람직하다.

## 6. 권장 평가 아키텍처

### 6.1 Technical / Fact Engine

역할은 “관측한 사실”을 재현 가능하게 만드는 것이다.

- SSRF 방어가 적용된 URL fetch, redirect 추적, HTTP status/header 수집
- raw HTML과 선택적 rendered DOM을 분리 저장
- title, meta, canonical, robots, lang, heading, link, image, schema, author/date/publisher 추출
- normalized main content와 DOM 위치/span 생성
- type-safe fact schema와 parser version 저장
- `PRESENT / ABSENT / INVALID / UNKNOWN / NOT_APPLICABLE` 상태 지원
- deterministic Rule 실행 및 입력 hash 기반 재현성 보장
- robots.txt, sitemap, Search Console 같은 외부 관측은 출처와 수집 시점을 분리 저장

출력 예시:

```text
Fact: outbound_link
value: https://example.org/research
location: main > section[2] > p[3]
anchor: 원문 연구
source: raw_html
observedAt: ...
extractorVersion: ...
```

### 6.2 Semantic Evaluation Engine

아직 구현하지 않는다. 향후 API 키가 준비되었을 때 adapter로 추가한다.

- 입력은 전체 raw HTML이 아니라 Fact Engine이 만든 main content, section 구조, claim/citation 후보
- Rule별 고정 rubric과 허용된 enum 결과 사용
- PASS/WARN/FAIL마다 최소 하나의 원문 quote/span을 강제
- “근거 없음”, “판단 불가”, “외부 확인 필요”를 정상 결과로 허용
- model/provider/prompt/rubric version, temperature, 실행 시점 저장
- 구조화된 JSON schema 검증 실패 시 점수에 반영하지 않음
- 중요한 trust/citation 평가는 링크 대상 콘텐츠 또는 공식 외부 데이터가 없으면 확정하지 않음
- LLM의 자유로운 추천과 점수 판정을 분리

LLM 출력은 확률적이므로 같은 입력의 완전한 결정론을 보장할 수 없다. 낮은 temperature, 고정 rubric, evidence quote, 재시도 합의 또는 평가 모델 고정으로 변동을 줄이되, 결과에 model/version을 반드시 표시한다.

### 6.3 Scoring Methodology

권장 원칙은 다음과 같다.

1. **SEO Score**: deterministic Rule 중심. 외부 관측이 필요한 항목은 데이터가 없으면 UNKNOWN/N/A이며 자동 PASS가 아니다.
2. **GEO Fact Readiness**: Technical/Fact Engine만으로 계산 가능한 하위 점수.
3. **GEO Semantic Readiness**: rubric 기반 Semantic/Hybrid Rule 점수. Semantic Engine 미실행 시 `평가하지 않음`.
4. **GEO Readiness Score**: Fact와 Semantic이 모두 유효할 때만 방법론에 정의된 weight로 합성. 의미 평가가 빠진 상태에서 100점 만점으로 확대 환산하지 않는다.
5. **AI Visibility**: Gemini/ChatGPT Search/Perplexity 실제 노출 관측 영역. GEO Readiness와 완전히 별도 모델로 유지한다.
6. Rule 결과에는 `confidence`, `applicability`, `engineType`, `methodologyVersion`을 저장한다.
7. N/A는 분모에서 제외할 수 있지만, 페이지 유형 판정과 제외 이유를 노출한다. UNKNOWN/NOT_EVALUATED는 임의로 제외해 높은 점수를 만들지 않고 coverage를 함께 표시한다.

권장 표시 예시:

```text
GEO Readiness
- Fact Readiness: 82 / 100 (coverage 100%)
- Semantic Readiness: 평가하지 않음 (LLM 미연결)
- Overall: 산출 보류
```

이는 낮은 점수를 숨기는 방식이 아니라, 측정하지 않은 품질을 측정한 것처럼 보이지 않게 하는 방식이다.

### 6.4 Evidence Layer

Evidence Layer는 모든 엔진이 공유하는 감사 추적 계층이다.

- 각 evidence에 원본 URL, fetch 시점, source type, DOM selector 또는 text span, raw/normalized value 저장
- Rule은 evidence ID를 참조하며 사람이 원문 위치까지 drill-down 가능
- 외부 출처는 URL, HTTP 상태, 제목, 수집 시점과 함께 저장
- Semantic 판정은 supporting quote와 contradicting/insufficient evidence를 구분
- 민감한 header, cookie, token, 개인식별정보는 저장 전 제거
- HTML과 모델 입력/출력에는 hash 및 version을 붙여 재평가 가능하게 유지
- 추천은 판정 근거와 분리하되 어떤 실패 evidence에서 생성되었는지 연결

## 7. 엔진 배치 요약

| Engine | 즉시 포함할 Rule/부분 | 향후 포함할 Rule/부분 |
|---|---|---|
| Technical/Fact Engine | SEO의 모든 기계 측정, GEO-MACHINE-001/002, GEO-ACCESS-001/003/004, 모든 HYBRID Rule의 존재·구조·위치·형식 fact | rendered DOM 비교, robots.txt/sitemap/Search Console, 외부 링크 fetch |
| Semantic Evaluation Engine | 현재는 구현하지 않음 | GEO-ANSWER-001, GEO-CITE-001, HYBRID Rule의 관련성·명료성·신뢰성·일치성 평가 |
| Scoring Methodology | 현재 score를 변경하지 않고 version 1로 기록 | Fact/Semantic coverage, N/A/UNKNOWN, versioned weights 및 합성 정책 |
| Evidence Layer | 기존 evidence를 확장 가능한 공통 모델로 정의 | DOM span, source snapshot, LLM quote, 외부 관측 provenance |

## 8. 현재 구현에서 특히 경계할 오판

- 짧은 paragraph 하나가 있다는 이유로 “직접 답변”을 PASS 처리한다.
- 전화 링크나 임의 외부 링크도 출처 링크로 분류될 수 있어 Evidence & Trust와 Citation Readiness가 동시에 올라간다.
- 숫자형 claim이 하나도 감지되지 않으면 claim/evidence 관계를 측정하지 않았는데 PASS가 된다.
- author, date, publisher 표식의 존재를 신뢰성 자체로 취급한다.
- JSON-LD가 parse되고 아무 type이 있으면 기계 가독성과 내용 적합성을 모두 만족한 것처럼 보인다.
- body 길이와 paragraph 수로 읽기 쉬운 콘텐츠인지 판정한다.
- title과 H1의 앞 문자열 일치만으로 entity consistency를 판정한다.

이 항목들은 현재 구현의 버그 수정 목록이 아니라, 다음 방법론 버전에서 Fact와 Semantic 판정을 분리해야 하는 설계 근거다.

## 9. 다음 의사결정 항목

코드 변경 전에 아래를 확정해야 한다.

1. GEO 화면에서 Fact/Semantic 하위 점수를 별도로 표시할지
2. LLM 미연결 시 GEO Overall을 `산출 보류`할지, Fact-only 별도 이름으로 표시할지
3. `N/A`, `UNKNOWN`, `NOT_EVALUATED`가 분모와 coverage에 미치는 영향
4. 페이지 유형 분류 방식과 Rule 적용 대상
5. Semantic Rule별 rubric, evidence quote 요구사항, 허용 오차
6. 외부 링크 원문 fetch와 authority 판단의 Phase 범위
7. 기존 0~100 결과와 새 methodology version의 호환/마이그레이션 정책

이 문서는 평가 아키텍처 검토안이며, 승인 전에는 현재 scoring system을 변경하지 않는다.
