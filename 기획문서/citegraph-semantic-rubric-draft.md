# CiteGraph Semantic Rubric Draft

> 상태: scoring v2 구현 전 검토안  
> Semantic/Hybrid Rule의 의미 평가 계약  
> LLM API 미구현 — 현재 모든 rubric 결과는 `NOT_EVALUATED`

## 1. 공통 실행 계약

- 허용 출력: `PASS | WARN | FAIL | UNKNOWN | NOT_EVALUATED`.
- N/A는 page-type Applicability Engine이 먼저 결정하며 Semantic Engine이 임의로 만들지 않는다.
- PASS와 FAIL은 rubric별 최소 원문 quote 수를 반드시 충족한다.
- quote는 Evidence Layer의 `evidenceId + textSpan`으로 검증 가능해야 한다.
- 입력에 없는 사실, 모델의 일반지식, 브랜드 평판 추측, 실제 AI 노출 추측을 금지한다.
- 외부 자료가 필요한 rubric은 target snapshot이 없으면 UNKNOWN이다.
- provider/model/prompt/rubric version을 결과에 저장한다.

Scoring v2에서는 외부 citation target을 fetch하지 않는다. `AUTHOR-EXPERTISE`, `DATE-FRESH`, `SOURCE-SUPPORT`, `SOURCE-QUALITY`처럼 외부 snapshot/history가 필수인 rubric은 **Semantic v2.1 DEFERRED**이며 v2 실행 결과는 `NOT_EVALUATED`다.

## 2. SEO Hybrid Rubric

### RUB-SEO-TITLE-TOPIC — Title과 페이지 주제 일치

- 목적: title이 main topic을 정확히 식별하는지 평가
- 입력: title, H1, main-content 첫 section, page type
- PASS: title이 핵심 entity와 page purpose를 정확히 표현
- WARN: 관련 있으나 일반적이거나 핵심 entity/purpose 일부 누락
- FAIL: 본문과 다른 주제, 오해 유발, keyword stuffing으로 의미 훼손
- UNKNOWN: main topic 추출 불가 또는 혼합 목적 페이지
- NOT_EVALUATED: Semantic Engine 미실행
- 최소 quote: 2개(title 1 + 본문/H1 1)
- 허용 enum: PASS/WARN/FAIL/UNKNOWN/NOT_EVALUATED
- 금지 추론: 검색 순위·CTR·Google이 선택할 title 예측

### RUB-SEO-META-TOPIC — Meta description과 페이지 주제 일치

- 목적: meta description이 페이지를 사실적으로 요약하는지 평가
- 입력: meta description, title, H1, main-content 요약
- PASS: 핵심 목적·entity를 정확히 요약하고 본문으로 검증 가능
- WARN: 관련 있으나 지나치게 일반적 또는 핵심 정보 누락
- FAIL: 본문에 없는 혜택/사실 주장, 다른 페이지 설명
- UNKNOWN: main content 부족
- NOT_EVALUATED: Semantic Engine 미실행
- 최소 quote: 2개(meta 1 + 본문 1)
- 금지 추론: snippet 채택·CTR 예측

### RUB-SEO-HEADING-TOPIC — Heading의 section 대표성

- 목적: heading이 뒤따르는 section의 내용을 정확히 대표하는지 평가
- 입력: heading과 각 section 첫 문단
- PASS: 주요 heading이 section 주제를 구체적으로 대표
- WARN: 일부 heading이 일반적/중복이지만 전체 탐색 가능
- FAIL: 다수 heading이 내용과 불일치하거나 구조를 오도
- UNKNOWN: section mapping 실패
- NOT_EVALUATED: Semantic Engine 미실행
- 최소 quote: PASS 2쌍, WARN/FAIL 문제 heading-section 1쌍 이상
- 금지 추론: heading keyword가 ranking을 보장한다는 주장

### RUB-SEO-SCHEMA-VISIBLE — Schema와 가시 콘텐츠 일치

- 목적: structured data entity/property가 사용자에게 보이는 콘텐츠와 일치하는지 평가
- 입력: validated schema nodes, 대응 DOM text, page type
- PASS: 핵심 type/name/date/author/product 값이 가시 콘텐츠와 일치
- WARN: 핵심 값은 일치하나 일부 권장 속성 검증 불가
- FAIL: 핵심 entity/type/value가 가시 콘텐츠와 명백히 충돌
- UNKNOWN: 대응 DOM 또는 page type 불명
- NOT_EVALUATED: validator/semantic engine 미실행
- 최소 quote: schema evidence 1 + DOM quote 1
- 금지 추론: rich result 표시 보장, 숨겨진 값을 사실로 인정

### RUB-SEO-INTERNAL-CONTEXT — 내부 링크 문맥 적합성

- 목적: 내부 링크가 사용자에게 관련 자료를 설명적으로 연결하는지 평가
- 입력: anchor, 주변 문장, target title/summary
- PASS: 주요 내부 링크의 anchor와 문맥이 target을 정확히 설명
- WARN: crawlable하지만 anchor가 일반적이거나 문맥 일부 불명
- FAIL: 링크가 기만적/무관하거나 핵심 탐색을 방해
- UNKNOWN: target snapshot 없음
- NOT_EVALUATED: Semantic Engine/target fetch 미실행
- 최소 quote: source context 1 + target title/본문 1
- 금지 추론: 링크 equity·ranking 효과 수치 예측

### RUB-SEO-IMAGE-ALT — 이미지 역할과 alt 적합성

- 목적: 정보성·기능성 이미지의 alt가 같은 목적을 수행하는지 평가
- 입력: img alt/role/src, 주변 text, link/button context, 선택적으로 image description
- PASS: 정보/기능 이미지는 적절한 대안, 장식 이미지는 빈 alt
- WARN: 역할이 불명확하거나 일부 alt가 일반적
- FAIL: 핵심 정보/기능 이미지 대안 누락 또는 오해 유발
- UNKNOWN: 이미지 역할을 입력만으로 판정 불가
- NOT_EVALUATED: Semantic/Image Engine 미실행
- 최소 quote: element evidence 1 + 주변 문맥 1
- 금지 추론: 이미지를 보지 않고 시각 내용을 만들어냄

### RUB-SEO-DATE-APPLICABILITY — 날짜 신호의 의미 적합성

- 목적: 날짜가 필요한 콘텐츠인지, 표시 날짜들이 같은 의미로 일치하는지 평가
- 입력: page type, visible/schema/meta dates, main topic
- PASS: 날짜가 필요한 문서에 의미와 값이 명확·일치
- WARN: 날짜는 있으나 published/modified 의미가 모호하거나 일부 불일치
- FAIL: 필수 날짜가 명백히 누락되거나 가시/schema 값 충돌
- UNKNOWN: page type 또는 날짜 의미 불명
- NOT_EVALUATED: Semantic Engine 미실행
- 최소 quote: date evidence 1 + page-purpose quote 1
- 금지 추론: 실제 업데이트 여부를 snapshot 하나로 단정

## 3. GEO Semantic Rubric

### RUB-GEO-ANSWER-DIRECT — 답변 직접성

- 목적: 핵심 질문 직후에 결론을 우회 없이 제공하는지 평가
- 입력: 질문/heading, 인접 answer candidate, page topic
- PASS: 첫 1~2문장에서 질문의 핵심 답을 명시
- WARN: 관련 답이 있으나 긴 도입·간접 표현 뒤에 위치
- FAIL: 질문을 반복하거나 답을 제공하지 않음
- UNKNOWN: 대표 질문 또는 answer section 불명
- NOT_EVALUATED: Semantic Engine 미실행
- 최소 quote: 질문 1 + 답변 1
- 금지 추론: 문단 길이만으로 판정, 정답 사실성을 외부 검증 없이 보장

### RUB-GEO-ANSWER-COMPLETE — 답변 충분성

- 목적: 질문 범위에 필요한 핵심 조건·제약·정의를 빠뜨리지 않는지 평가
- 입력: 질문, answer section 전체, page topic
- PASS: 질문의 핵심 범위를 충족하고 중요한 제약을 포함
- WARN: 기본 답은 있으나 중요한 조건/맥락 일부 누락
- FAIL: 답이 부분적이어서 결론이 잘못 해석될 가능성이 큼
- UNKNOWN: 질문 범위 정의 불가
- NOT_EVALUATED: Semantic Engine 미실행
- 최소 quote: 질문 1 + 답변 2
- 금지 추론: 페이지 밖 정보를 보충해 completeness를 PASS 처리

### RUB-GEO-QA-ALIGN — 질문과 후속 section 정렬

- 목적: 질문형 heading과 뒤 콘텐츠가 실제 같은 질문에 답하는지 평가
- 입력: question heading, section text
- PASS: section이 heading의 질문에 일관되게 답함
- WARN: 일부 관련되나 다른 주제로 분산
- FAIL: 질문과 section이 불일치
- UNKNOWN: section boundary 불명
- NOT_EVALUATED: Semantic Engine 미실행
- 최소 quote: heading 1 + section 1
- 금지 추론: `?` 존재만으로 PASS

### RUB-GEO-STRUCTURE-FIT — 목록·표 구조 적합성

- 목적: 정보 유형에 맞는 list/table 구조가 해석을 개선하는지 평가
- 입력: list/table DOM, header/caption, 주변 문맥
- PASS: 단계·비교·열거가 적합한 구조와 label로 표현됨
- WARN: 구조는 적합하나 label/header 일부 부족
- FAIL: 구조가 내용을 왜곡하거나 table/list를 해석할 수 없음
- UNKNOWN: 구조의 목적 불명
- NOT_EVALUATED: Semantic Engine 미실행
- 최소 quote: 구조 element 1 + 주변 heading/text 1
- 금지 추론: element 개수만으로 품질 판정

### RUB-GEO-METADATA-CLARITY — Metadata 의미 명확성

- 목적: title/meta/H1이 동일한 page topic과 entity를 명료하게 표현하는지 평가
- 입력: title, meta, H1, main topic
- PASS: 세 신호가 명확하고 상호 일관됨
- WARN: 관련 있으나 일부 일반적/불완전
- FAIL: 주요 신호가 서로 다른 주제/entity를 지칭
- UNKNOWN: main topic 불명
- NOT_EVALUATED: Semantic Engine 미실행
- 최소 quote: metadata 2 + 본문/H1 1
- 금지 추론: 실제 생성형 엔진 이해·노출 보장

### RUB-GEO-AUTHOR-ACCOUNT — 저자 책임성

- 목적: 누가 콘텐츠를 작성·검토했는지 사람이 확인 가능한지 평가
- 입력: byline, author schema, bio/contact link, page type
- PASS: 저자/검토자와 역할이 명확하고 페이지에 연결됨
- WARN: 이름은 있으나 역할·소개 연결 부족
- FAIL: 적용 대상인데 책임 주체가 없거나 충돌
- UNKNOWN: page type/identity 불명
- NOT_EVALUATED: Semantic/External Engine 미실행
- 최소 quote: byline/author 1 + 역할/bio 1
- 금지 추론: 이름만으로 전문성·실존성 보장

### RUB-GEO-AUTHOR-EXPERTISE — 저자 전문성 근거

- 목적: 주제와 관련된 검증 가능한 전문성 근거 평가
- 입력: author bio, 자격/경력 원문, 외부 identity evidence, page topic
- PASS: 관련 전문성이 내부·외부 evidence로 검증됨
- WARN: 관련 경험 표시는 있으나 독립 검증 부족
- FAIL: 명백한 자격 허위/주제와 무관한 권위 주장
- UNKNOWN: 외부 검증 데이터 부족
- NOT_EVALUATED: External/Semantic Engine 미실행
- 최소 quote: 내부 1 + 외부 1
- 금지 추론: 직함·브랜드 인지도만으로 신뢰 판정

### RUB-GEO-DATE-FRESH — 최신성 적합성

- 목적: 시간 민감성에 비해 콘텐츠가 적절히 최신인지 평가
- 입력: page topic/type, visible/schema dates, crawl history, changed content
- PASS: 시간 민감 콘텐츠가 최근 검토·갱신 evidence를 가짐
- WARN: 날짜는 있으나 실제 변경 근거 부족 또는 일부 오래됨
- FAIL: 명백히 만료된 사실을 현재 정보처럼 제시
- UNKNOWN: history/외부 사실 검증 부족
- NOT_EVALUATED: Semantic/History Engine 미실행
- 최소 quote: 시간 민감 claim 1 + date/history 1
- 금지 추론: dateModified만으로 실제 갱신 단정

### RUB-GEO-PUBLISHER-COHERENCE — 발행 주체 일관성

- 목적: 가시 publisher와 schema/entity identity가 같은 주체인지 평가
- 입력: visible publisher, schema, logo/name/url/sameAs, 외부 entity evidence
- PASS: 핵심 식별자가 일관되고 검증 가능
- WARN: 동일 주체로 보이나 일부 식별자 누락
- FAIL: 이름/URL/@id가 서로 다른 주체를 가리킴
- UNKNOWN: 외부 identity 부족
- NOT_EVALUATED: Semantic/External Engine 미실행
- 최소 quote: visible identity 1 + schema/external 1
- 금지 추론: schema type 존재만으로 신뢰 보장

### RUB-GEO-CLAIM-COVERAGE — 주요 Claim의 근거 Coverage

- 목적: 검증 가능한 주요 claim이 citation을 갖는 비율과 누락의 중요도 평가
- 입력: claim candidates, claim span, citation relation candidates
- PASS: 주요 검증 가능 claim이 모두 근거와 연결
- WARN: 일부 비핵심 claim만 근거 누락
- FAIL: 핵심 수치·비교·효능 claim에 근거 없음
- UNKNOWN: claim 식별 신뢰도 부족
- NOT_EVALUATED: Semantic Engine 미실행
- 최소 quote: PASS는 claim-source pair 2개 또는 전체 claim이 1개면 1개; WARN/FAIL은 미지원 claim 1개
- 금지 추론: 숫자 없는 문장을 claim이 아니라고 단정, claim 0개를 PASS 처리

### RUB-GEO-SOURCE-SUPPORT — 출처의 Claim 지지 여부

- 목적: 연결된 target source가 해당 claim을 실제로 뒷받침하는지 평가
- 입력: source claim/context, target page 원문, citation relation
- PASS: target quote가 claim을 직접 지지
- WARN: 관련되나 간접적이거나 범위가 더 좁음
- FAIL: target이 claim을 지지하지 않거나 반박
- UNKNOWN: target fetch/본문 없음
- NOT_EVALUATED: External/Semantic Engine 미실행
- 최소 quote: source claim 1 + target quote 1
- 금지 추론: anchor·도메인 이름만으로 support 판정

### RUB-GEO-SOURCE-QUALITY — 출처 품질

- 목적: source의 원출처성·책임 주체·관련성 평가
- 입력: target publisher/author/date/content, source type, claim
- PASS: 관련 공식/원 연구/직접 데이터 출처이며 식별 가능
- WARN: 관련 보조 출처이나 원출처 아님 또는 provenance 일부 부족
- FAIL: 무관·깨진·익명·조작 가능성이 명백한 source
- UNKNOWN: target/provenance 부족
- NOT_EVALUATED: External/Semantic Engine 미실행
- 최소 quote: target identity 1 + target content 1
- 금지 추론: 유명 도메인이라는 이유만으로 PASS, `tel:`/mailto를 source로 인정

### RUB-GEO-ENTITY-CONSIST — 핵심 Entity 일관성

- 목적: title/H1/schema/body가 같은 조직·제품·인물을 지칭하는지 평가
- 입력: entity signals, aliases, schema @id/name/url, main topic
- PASS: 핵심 entity와 허용 alias가 일관됨
- WARN: 표현 차이는 있으나 동일 entity로 확인 가능
- FAIL: 핵심 신호가 서로 다른 entity를 가리킴
- UNKNOWN: entity resolution 근거 부족
- NOT_EVALUATED: Semantic Engine 미실행
- 최소 quote: 서로 다른 source type의 entity evidence 2개
- 금지 추론: 앞 20자 substring만으로 동일성 확정

### RUB-GEO-CONTENT-CLARITY — 문장 명료성

- 목적: 핵심 문장이 불필요한 모호성 없이 이해 가능한지 평가
- 입력: main-content 핵심 paragraph, language, page type
- PASS: 핵심 용어가 정의되고 문장 관계가 명확
- WARN: 일부 전문용어/장문/모호한 지시어가 이해를 방해
- FAIL: 핵심 주장을 해석하기 어렵거나 서로 모순
- UNKNOWN: 추출 text 품질/언어 불명
- NOT_EVALUATED: Semantic Engine 미실행
- 최소 quote: PASS 2개, WARN/FAIL 문제 문장 1개
- 금지 추론: 문자 수·문단 수만으로 clarity 판정

### RUB-GEO-CONTENT-COHERENCE — 문서 응집성

- 목적: section들이 한 page purpose를 중심으로 논리적으로 연결되는지 평가
- 입력: section heading과 section summaries, page topic
- PASS: 주요 section이 주제를 지원하고 전개가 논리적
- WARN: 일부 반복/주제 이탈이 있으나 전체 목적 유지
- FAIL: 핵심 section이 상충하거나 문서 목적을 식별하기 어려움
- UNKNOWN: section extraction 실패/복합 페이지
- NOT_EVALUATED: Semantic Engine 미실행
- 최소 quote: 서로 다른 section 2개
- 금지 추론: heading hierarchy만으로 coherence 판정

## 4. Semantic 품질 게이트

- enum 외 출력이 있으면 전체 결과 무효.
- quote가 입력 Evidence에 없으면 hallucination으로 기록하고 NOT_EVALUATED.
- 금지 추론 위반 시 점수 미산입.
- 동일 입력 2회 평가 결과가 PASS↔FAIL로 바뀌면 UNKNOWN 또는 human review.
- high-impact Rule은 model 단일 응답만으로 확정하지 않고 critic/validator 또는 human sample review가 필요하다.
