# Fixture Expected Outcomes

> 검토 기준: `methodology-v2-draft.2`  
> Corpus: `fixtures/v2/html/*.html`  
> 정확한 점수는 calibration 전이므로 임의 확정하지 않음

## 공통 원칙

- SEO는 FACT/validator Scoring Rule만 예상한다.
- SEO Advisory와 GEO Semantic은 LLM 미구현 상태에서 `NOT_EVALUATED`다. 아래 semantic 기대는 향후 사람 rubric label이다.
- 점수는 숫자 하나 대신 `HIGH / MEDIUM / LOW`, 범위, fixture 간 ordering을 사용한다.
- canonical relation처럼 site context가 없으면 UNKNOWN이다.
- page type PROVISIONAL/UNKNOWN이면 type-dependent N/A를 자동 적용하지 않는다.

## F01 Clean Homepage

- 파일: `01-clean-homepage.html`
- Page type: HOMEPAGE / 예상 confidence ≥0.85 / AUTO_ASSIGNED
- Expected facts: HTTPS fixture URL, title/meta/canonical/lang, H1, valid Organization schema, main landmark, internal links, publisher `Acme`
- Expected N/A: author, published/modified date, 질문/list 기반 answerability
- Expected UNKNOWN: canonical relation은 duplicate corpus가 없으면 UNKNOWN; title/meta uniqueness도 site corpus 없으면 UNKNOWN
- Expected PASS: HTTPS, canonical present/valid, lang, title/meta presence, H1, heading level, schema syntax/type, main content, internal crawl, GEO landmark/raw/publisher/entity
- Expected WARN/FAIL: 필수 FAIL 없음; 길이 heuristic은 profile에 따라 PASS 또는 WARN만 허용
- Expected score: SEO HIGH, GEO Technical HIGH. GEO Semantic NOT_EVALUATED
- 판단 이유: 대표 홈페이지 기본 신호가 충분하며 article 전용 신호는 N/A여야 함

## F02 Problematic Homepage

- 파일: `02-problematic-homepage.html`
- Page type: HOMEPAGE / ≥0.85
- Expected facts: lang absent, title `Home`, robots conflict, javascript canonical, invalid JSON-LD, H1 absent, heading starts H3, thin main text, img alt absent, non-crawlable pseudo-link
- Expected N/A: author/date
- Expected UNKNOWN: canonical relation은 canonical validity FAIL 이후 UNKNOWN 가능
- Expected PASS: page fetch 자체만 PASS 가능
- Expected WARN: title length/topic Advisory 후보, page type profile에 따른 body boundary
- Expected FAIL: robots conflict, canonical valid, lang present, H1 present, heading structure, schema syntax, internal crawl, alt presence, thin body
- Expected score: SEO LOW; 반드시 F01보다 낮음. GEO Technical LOW; Semantic NOT_EVALUATED
- 판단 이유: 부재·무효 Fact가 명시적으로 재현됨

## F03 Article

- 파일: `03-article.html`
- Page type: ARTICLE_BLOG / ≥0.85
- Expected facts: Article schema, author, published/modified date, question heading, direct answer candidate, ordered list, valid citation URL/location
- Expected N/A: 없음(대부분 article applicability)
- Expected UNKNOWN: citation target support/authority는 v2.1; title/meta uniqueness와 canonical relation은 corpus 없으면 UNKNOWN
- Expected PASS: metadata basics, H1/heading, schema syntax/type/required, body/internal links/date, GEO question/list/landmark/raw/author/date/citation URL/proximity/entity
- Expected WARN/FAIL: 없음이 기본; external target 관련은 FAIL이 아니라 NOT_EVALUATED/UNKNOWN
- Expected score: SEO HIGH, GEO Technical HIGH; 향후 GEO Semantic human label HIGH
- 판단 이유: provenance와 answer structure가 모두 있는 정상 article 기준점

## F04 Article Without Author

- 파일: `04-article-without-author.html`
- Page type: ARTICLE_BLOG / ≥0.85
- Expected facts: Article/date 존재, author Fact ABSENT
- Expected N/A: author는 N/A 금지 — article 적용 대상
- Expected UNKNOWN: author expertise v2.1 NOT_EVALUATED; canonical relation/uniqueness UNKNOWN
- Expected PASS: F03과 동일한 기술 기본기 대부분
- Expected WARN: publisher identity가 별도로 없으면 WARN 또는 FAIL 정책 검토
- Expected FAIL: AC-GF-AUTHOR 및 author 기반 Technical scoring component
- Expected score: SEO는 F03과 유사; GEO Technical은 F03보다 낮음. Semantic NOT_EVALUATED
- 판단 이유: SEO metadata를 저자 부재 때문에 감점하지 않되 GEO provenance에서 차이를 보여야 함

## F05 Article Without Date

- 파일: `05-article-without-date.html`
- Page type: ARTICLE_BLOG / ≥0.85
- Expected facts: author 존재, typed date ABSENT
- Expected N/A: date N/A 금지 — article 적용 대상
- Expected UNKNOWN: 실제 freshness는 v2.1 NOT_EVALUATED
- Expected PASS: author, metadata, structure, raw content
- Expected WARN: schema required property 정책에서 date 누락 WARN/FAIL은 validator spec에 따름
- Expected FAIL: SEO-DATE-PRESENT, GEO-F-DATE
- Expected score: SEO < F03; GEO Technical < F03. Semantic NOT_EVALUATED
- 판단 이유: 날짜 존재 Fact와 실제 최신성 의미를 분리

## F06 Product

- 파일: `06-product.html`
- Page type: PRODUCT / ≥0.85
- Expected facts: Product/Offer, visible product name/price, table, internal category link
- Expected N/A: author, article date, 질문 구조(필수 아님), claim citation(검증 claim 없음)
- Expected UNKNOWN: schema-visible semantic Advisory와 entity semantic은 엔진 미실행
- Expected PASS: metadata, canonical valid, lang, H1, schema syntax/type/required, internal crawl, GEO list/table/landmark/raw/publisher/entity
- Expected WARN/FAIL: 필수 FAIL 없음
- Expected score: SEO HIGH, GEO Technical MEDIUM~HIGH. Semantic NOT_EVALUATED
- 판단 이유: product를 article author/date 기준으로 감점하지 않음

## F07 Service

- 파일: `07-service.html`
- Page type: SERVICE / ≥0.85
- Expected facts: Service schema, question/answer candidate, process list, Organization provider, internal case link, unsupported numeric claim
- Expected N/A: author/date는 기본 N/A 가능
- Expected UNKNOWN: 숫자 claim의 target support는 v2.1; claim 의미 분류 confidence가 낮으면 UNKNOWN
- Expected PASS: SEO technical/on-page/schema basics, GEO question/list/raw/landmark/publisher/entity
- Expected WARN: claim-citation proximity는 citation 없음으로 FAIL 가능; semantic claim coverage는 NOT_EVALUATED
- Expected FAIL: GEO citation URL/proximity는 claim applicable로 확정되면 FAIL
- Expected score: SEO HIGH; GEO Technical은 F06보다 낮거나 같음. Semantic NOT_EVALUATED
- 판단 이유: 구조는 좋지만 “95%” claim에 근거가 없음

## F08 Documentation

- 파일: `08-documentation.html`
- Page type: DOCUMENTATION / ≥0.85
- Expected facts: TechArticle, modified date, maintainer text, question answer, list/code, internal docs link
- Expected N/A: 개인 author는 maintainer 대체 정책에 따라 N/A 또는 PASS 후보
- Expected UNKNOWN: maintainer를 author로 인정하는 정책 미확정이면 AC-GF-AUTHOR UNKNOWN
- Expected PASS: metadata, heading, schema, body/internal/date, question/list/landmark/raw
- Expected WARN: publisher/author identity가 구조화되지 않아 WARN 가능
- Expected FAIL: 필수 없음
- Expected score: SEO HIGH; GEO Technical MEDIUM~HIGH. Semantic NOT_EVALUATED
- 판단 이유: documentation의 maintainer/date/절차 구조를 article과 다른 applicability로 평가

## F09 Utility/Contact

- 파일: `09-utility-contact.html`
- Page type: CONTACT_ABOUT / ≥0.85
- Expected facts: contact title/meta/H1/address/form/mailto, main content
- Expected N/A: author, date, question/list, citation, long body, article schema
- Expected UNKNOWN: canonical relation/uniqueness
- Expected PASS: HTTPS fixture, canonical/lang/title/meta/H1/main landmark, page content availability
- Expected WARN: structured data type는 ContactPage/Organization가 없으므로 schema applicability 정책에 따라 WARN 또는 N/A
- Expected FAIL: 없음이 기본
- Expected score: SEO MEDIUM~HIGH with high coverage after N/A; GEO Technical MEDIUM. Semantic NOT_EVALUATED
- 판단 이유: 짧은 contact page를 thin content로 실패시키지 않음

## F10 Noindex Page

- 파일: `10-noindex-page.html`
- Page type: ARTICLE_BLOG / ≥0.85, audit intent=`PUBLIC_INDEX_TARGET`
- Expected facts: effective noindex=true, otherwise valid article-like content
- Expected N/A: author/date는 content policy에 따라 missing issue가 별도 발생 가능
- Expected UNKNOWN: canonical relation corpus 없음
- Expected PASS: robots parse/conflict, metadata/heading/body basics
- Expected WARN: 없음
- Expected FAIL: SR-SEO-NOINDEX — public index intent와 noindex 충돌
- Expected score: SEO가 F03보다 명확히 낮음; noindex gate 영향은 최대 12. GEO Technical은 noindex 자체로 감점하지 않음
- 판단 이유: noindex 존재와 intent 적합성을 결합한 Scoring Rule 검증

## F11 Invalid Canonical

- 파일: `11-invalid-canonical.html`
- Page type: CATEGORY_LISTING 또는 LANDING_PAGE / confidence 0.60~0.84 / PROVISIONAL
- Expected facts: canonical present, scheme `javascript:` invalid, comparison table와 internal links
- Expected N/A: author/date; 질문은 content intent에 따라 N/A
- Expected UNKNOWN: page type dependent body/question; canonical relation은 validity FAIL로 평가 불가 → UNKNOWN
- Expected PASS: canonical presence, title/meta/lang/H1/table/internal crawl
- Expected WARN: page type result PROVISIONAL
- Expected FAIL: canonical validity
- Expected score: SEO < 동일 HTML의 valid canonical variant; 임의 숫자 금지. GEO Semantic NOT_EVALUATED
- 판단 이유: canonical 존재에 높은 점수를 주지 않고 유효성/관계를 분리

## F12 Invalid Structured Data

- 파일: `12-invalid-structured-data.html`
- Page type: PRODUCT / ≥0.85
- Expected facts: JSON syntax error, visible product name `Acme Meter`, schema block parse failure
- Expected N/A: author/date/citation
- Expected UNKNOWN: schema type/required/visible checks는 parse 실패 때문에 UNKNOWN 또는 선행 FAIL 전파 정책 필요
- Expected PASS: metadata/canonical/lang/H1/body
- Expected WARN: 없음
- Expected FAIL: schema syntax
- Expected score: SEO < F06. GEO Technical은 schema 존재 중복 배점 없이 raw/entity extraction 범위에서 평가
- 판단 이유: syntax/type/required/visible을 하나의 결과로 뭉개지 않음

## F13 JS-heavy

- 파일: `13-js-heavy.html`
- Page type: raw 기준 UNKNOWN(<0.60), rendered 기준 SERVICE PROVISIONAL/AUTO 후보
- Expected facts: raw body는 JS 안내 shell, script 실행 후 main content 생성 가능
- Expected N/A: 자동 N/A 금지 — raw page type UNKNOWN
- Expected UNKNOWN: rendered snapshot이 없으면 page type과 content-dependent checks UNKNOWN
- Expected PASS: raw title/meta/canonical/lang
- Expected WARN: access partial 가능
- Expected FAIL: GEO-F-RAWCONTENT, RENDERDEP는 rendered diff 확보 시 FAIL
- Expected score: SEO coverage 낮음 또는 partial; GEO Technical LOW. Semantic NOT_EVALUATED
- 판단 이유: raw와 rendered Evidence를 섞지 않고 JS dependency를 독립 측정

## F14 Thin Content

- 파일: `14-thin-content.html`
- Page type: LANDING_PAGE PROVISIONAL(0.60~0.84)
- Expected facts: 매우 짧은 title/meta/body, H1, canonical/lang, 내부 contact link
- Expected N/A: author/date/citation; question/list 조건부
- Expected UNKNOWN: type-dependent body threshold는 PROVISIONAL profile이면 UNKNOWN 허용
- Expected PASS: canonical/lang/H1/internal crawl
- Expected WARN: title/meta/body heuristic
- Expected FAIL: body amount는 landing profile에서도 명백히 부족하다고 calibration 합의된 경우만 FAIL
- Expected score: SEO < F01; GEO Technical < F01. Semantic NOT_EVALUATED
- 판단 이유: hard character threshold 없이도 극단적으로 얇은 fixture를 calibration 기준점으로 사용

## F15 Strong SEO / Weak GEO Content

- 파일: `15-strong-seo-weak-geo.html`
- Page type: SERVICE 또는 LANDING_PAGE / PROVISIONAL
- Expected facts: metadata/canonical/lang/H1/schema/heading/list/internal link 모두 존재, 숫자 claim과 무관한 social 외부 링크
- Expected N/A: author/date 조건부
- Expected UNKNOWN: external source support/authority는 v2.1; page type dependent checks 일부
- Expected PASS: SEO FACT 대부분, GEO Fact landmark/raw/list/entity
- Expected WARN: citation URL은 HTTP(S)이지만 claim proximity가 멀어 WARN/FAIL 후보
- Expected FAIL: v2 FACT에서 명백한 실패가 적을 수 있음
- Expected score: SEO HIGH; GEO Technical MEDIUM~HIGH; GEO Semantic NOT_EVALUATED. 향후 human rubric에서는 ANSWER-DIRECT/COMPLETE, CLAIMCOVER, CLARITY가 FAIL/WARN
- 판단 이유: 기술적 준비와 의미 품질이 독립임을 증명

## Expected Ordering

```text
SEO:
F01 clean home > F02 problematic home
F03 article > F05 article without date
F03 article ≈ or > F04 article without author (SEO는 author를 직접 가산하지 않음)
F06 product > F12 invalid structured data
F03 article > F10 noindex article
F11 valid-canonical variant > F11 invalid canonical
F15 strong-SEO/weak-GEO > F14 thin content

GEO Technical:
F03 article > F04 no-author article
F03 article > F05 no-date article
F01 clean home > F02 problematic home
F13 JS-heavy < comparable server-rendered service

GEO Semantic:
모든 현재 실행 = NOT_EVALUATED
향후 human label: F03 article > F15 strong-SEO/weak-GEO
```

## 검토 체크리스트

- N/A가 page type 때문에 발생했는가, 단순 누락을 숨기지 않는가?
- UNKNOWN이 입력 부족을 정확히 나타내는가?
- 부재 Evidence가 FAIL과 연결되는가?
- SEO Advisory가 SEO Score에 들어가지 않는가?
- 같은 Fact가 SEO/GEO에서 중복 Weight를 얻지 않는가?
- 정확한 점수보다 fixture ordering이 합리적인가?
