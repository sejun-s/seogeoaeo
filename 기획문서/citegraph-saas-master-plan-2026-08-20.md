# CiteGraph SaaS Master Plan for Claude

> **문서 성격:** Product Strategy + PRD + Measurement Specification + Delivery Standard  
> **주 독자:** Claude (메인 기획자/아키텍트), Codex / Gemini (공동 개발자/검증자), Product, Engineering, Data, SEO/AEO/GEO Marketing  
> **문서 버전:** v1.0  
> **기준일:** 2026-08-20  
> **상태:** 공식 기획 기준안 (개발 착수 승인)  
> **핵심 원칙:** 관측되지 않은 성과를 추정 점수로 포장하지 않는다.

---

## 0. 문서의 목적과 사용법

이 문서는 기존 `스마트마인드AI SEO-GEO 작업리스트`, SEO/AEO/GEO 평가기준 초안, CiteGraph SaaS 제품 기획 및 시장성 재비판을 하나의 개발 기준으로 통합한다. 단순 요약문이 아니라 다음 결정을 고정하는 실행 문서다.

1. 무엇을 제품으로 만들고 무엇을 만들지 않을지
2. 어떤 데이터를 어떤 방식과 신뢰도로 측정할지
3. 점수와 권고가 어떻게 재현되고 설명될지
4. MVP부터 장기 방어력까지 어떤 순서로 구현할지
5. 개발 완료와 출시 승인을 무엇으로 판단할지

이 문서에서 **MUST**는 출시 필수, **SHOULD**는 특별한 사유가 없으면 적용, **MAY**는 후속 선택 사항을 뜻한다.

### 0.1 전제와 제한

- 스마트마인드AI 작업리스트에서 확인된 대표 문제군(동일한 sitemap `lastmod`, 구/신 URL 경쟁, JS 렌더링 검증, ThanoSQL→Qurify 관계, 국내 채용·투자 플랫폼의 회사 정보 불일치, 플랫폼별 AI 인용 관측)을 일반화했다.
- 검색엔진·AI 플랫폼의 내부 랭킹 로직은 알 수 없다. CiteGraph는 이를 안다고 주장하지 않는다.
- AI 응답은 확률적이다. 단일 실행을 보편적 사실로 표현하지 않는다.
- 외부 API/플랫폼 정책은 변한다. Connector와 Rule은 버전 및 관측 시각을 가져야 한다.

---

## 1. Executive Decision

### 1.1 제품 정의

**CiteGraph는 기업이 검색과 생성형 AI에서 놓치고 있는 상업적 질문을 발견하고, 경쟁사가 선택·추천·인용되는 이유를 증거 수준까지 설명하며, 가장 가치 높은 개선 행동을 우선순위화하고 그 결과를 반복 관측하는 Search & AI Opportunity Intelligence SaaS다.**

핵심 질문은 “우리 점수는 몇 점인가?”가 아니다.

> 어떤 고객 질문에서 기회를 잃고 있는가? 왜 경쟁사가 선택되는가? 무엇을 고치면 되는가? 실제 결과가 변했는가?

### 1.2 시장 포지셔닝

| 구분 | 전통 SEO Audit | AI Visibility Tracker | CiteGraph |
|---|---|---|---|
| 주 출력 | 오류와 점수 | 언급·인용 횟수 | 손실 기회, 원인, 행동, 검증 |
| 분석 단위 | URL/도메인 | Prompt/브랜드 | Query–Intent–Answer–Citation–Evidence–Conversion 그래프 |
| 설명 | 무엇이 잘못됐는가 | 어디에 나왔는가 | 왜 선택/배제됐고 무엇을 해야 하는가 |
| 성과 확인 | 재크롤링 | 재측정 | 재측정 + First-party 유입/전환 연결 |
| 차별화 | 기술 규칙 수 | 플랫폼 수 | Citation/Recommendation Gap, Claim-Evidence, Entity Conflict, 경쟁 이유 분석 |

### 1.3 초기 ICP와 구매자

**1차 ICP:** 한국의 B2B SaaS·AI·IT 기업 중 제품 설명이 복잡하고, 비교·추천 질의의 가치가 높으며, 고객사례·기술근거·외부 엔티티 관리가 중요한 팀.

- Economic buyer: CMO, Head of Growth, 대표/사업책임자
- Champion: SEO/Growth/Content lead
- Daily user: SEO, Content, Product Marketing, PR/Brand
- Secondary user: Web/Frontend developer, Data analyst, Agency

초기에는 음식점, 개인 블로그, 범용 쇼핑몰까지 한 번에 지원하지 않는다. 가격제(Starter/Agency/Enterprise)는 ICP 정의가 아니다.

### 1.4 North Star와 핵심 제품 지표

**North Star:** `Business-weighted Opportunity Coverage`

```text
Σ(관측된 유효 노출 또는 해결된 기회 × Intent business weight × Confidence)
──────────────────────────────────────────────────────────────────────
Σ(추적 대상 기회 × Intent business weight)
```

보조 지표:

- Commercial Prompt Coverage
- Recommendation Inclusion Probability
- Citation Coverage 및 Owned Citation Share
- High-priority Gap Resolution Rate
- Entity Conflict Resolution Rate
- Supported Claim Coverage
- AI Referral Sessions / Leads / Conversion (연동 시)
- Recommendation Adoption 및 Recheck Completion

### 1.5 마케터 코멘트

> **SEO 마케터:** SEO Audit은 데이터 기반이지만 전면 상품은 아니다. 기존 도구와 정면 경쟁하지 말고 검색 수요·페이지·성과 데이터를 Opportunity 진단의 입력으로 사용해야 한다.

> **AEO 마케터:** “답변 가능성 72점”보다 어느 질문에 답이 없고, 답이 있어도 조건·제한·근거가 무엇이 부족한지 보여줘야 실행된다.

> **GEO 마케터:** Mention/Citation 모니터링은 기본재가 된다. CiteGraph의 가치는 경쟁사가 선택된 이유를 Entity·Claim·Evidence·Source 수준에서 설명하는 데 있다.

---

## 2. 왜 점수기가 아니라 Opportunity Intelligence인가

### 2.1 점수기 모델의 한계

단일 총점은 다음 서로 다른 사실을 섞는다.

- 사이트가 기술적으로 발견 가능한가
- 질문에 답할 콘텐츠가 있는가
- 주장을 검증할 근거가 있는가
- 외부 세계에서 엔티티가 일관되는가
- 실제 AI 응답에서 언급·추천·인용되는가
- 유입과 전환이 발생하는가

`SEO 82 / AEO 68 / GEO 57`은 비교에는 편하지만 구매·실행 결정을 만들지 못한다. 더 나쁜 경우, 크롤러 허용이나 schema 존재를 실제 AI 노출로 오인하게 만든다.

### 2.2 제품 출력의 우선순위

1. **Opportunity:** 놓친 질문과 예상 비즈니스 관련성
2. **Observation:** 실제 플랫폼·지역·시각·샘플에서 관측된 결과
3. **Reason:** 경쟁사 대비 원인과 증거
4. **Action:** 담당자·난이도·예상 영향·검증 방법이 있는 조치
5. **Score:** 요약 및 추세 표시용 보조 신호

대표 홈 화면 문구:

```text
AI Search Opportunities
42개 주요 질문에서 기회를 놓치고 있습니다.

17  경쟁사만 인용되는 질문
 8  구매 의도가 높은 추천 질문
13  근거가 부족한 핵심 주장
 4  외부 출처의 핵심 엔티티 충돌

이번 주 최우선 행동
1. 고객사례에 측정 조건과 원자료 추가
2. “기업용 온톨로지 플랫폼 비교” 전용 페이지 생성
3. 공식 사이트와 국내 채용 플랫폼의 제품명 정합화
```

### 2.3 Product Loop

```text
Discover → Observe → Diagnose → Prioritize → Assign → Fix → Re-observe → Attribute → Learn
```

이 루프가 월별 재사용 이유를 만든다. 일회성 Audit 완료가 제품 사용 종료가 되어서는 안 된다.

---

## 3. 평가 아키텍처: Domain × Lifecycle × Criterion

### 3.1 3개 Domain

| Domain | 제품 내 정의 | 대표 질문 |
|---|---|---|
| SEO | 검색엔진이 콘텐츠를 발견·해석하고 적절한 질의와 연결할 기반 | 찾고 색인하고 수요와 연결할 수 있는가? |
| AEO | 사용자의 질문에 명확·완결·조건부·비교 가능한 답을 제공하는 능력 | 답변 단위로 이해하고 사용할 수 있는가? |
| GEO | 생성형 검색이 엔티티와 주장을 신뢰·선택·인용·추천하는 관측과 기반 | 선택·인용·추천되며 그 이유가 설명되는가? |

Domain은 배타적이지 않다. 한 Criterion이 SEO/AEO 또는 AEO/GEO에 걸칠 수 있으나, Rule에는 `primary_domain` 하나와 `secondary_domains[]`를 지정한다.

### 3.2 상위 평가영역

- **SEO Readiness:** Crawlability, Indexability/Rendering, Canonical/URL Integrity, Sitemap, Internal Link, Metadata, Query-Page Match, Performance Signals
- **AEO Readiness:** Direct Answer, Question Coverage, Entity Definition, Comparison/Selection, Conditions/Limitations, Claim Verifiability, Source Attribution
- **GEO Readiness:** AI Access Policy, Citation Readiness, Claim-Evidence Strength, Entity Consistency, External Authority, Information Gain, Freshness
- **Performance:** Search Demand(GSC), AI Mention/Recommendation, Citation Coverage, Answer Accuracy, Referral/Conversion

### 3.3 점수 원칙

- 총점은 기본 의사결정 수단이 아니다.
- **Domain score**, **Readiness score**, **Performance metric**을 분리한다.
- `Not measured`를 0으로 처리하지 않는다.
- 표본이 부족하면 숫자보다 범위와 confidence를 우선 표시한다.
- 점수에는 `score_version`, `rule_version`, `data_as_of`, `coverage`, `confidence`가 항상 따라야 한다.

---

## 4. Readiness와 Performance의 강제 분리

**Readiness:** 자사 사이트 및 확인 가능한 외부 정보가 검색·답변·인용에 적합한 상태인지 진단한 입력/구조 지표.  
**Performance:** 특정 플랫폼·질문·지역·시각·계정/모델 조건에서 실제로 관측되거나 First-party 데이터로 확인된 결과.

```json
{
  "metric_key": "geo.observed_recommendation_probability",
  "lifecycle": "performance",
  "value": 0.11,
  "unit": "probability",
  "coverage": 0.93,
  "confidence": "medium",
  "sample_size": 45,
  "observed_from": "2026-07-21T00:00:00Z",
  "observed_to": "2026-08-20T00:00:00Z",
  "score_version": null,
  "method_version": "prompt-observation-v1.2"
}
```

---

## 5. 측정 유형과 Confidence 계약

### 5.1 네 가지 측정 유형

1. **Deterministic:** 동일 입력/버전 시 100% 동일 결과 (Status, Canonical, Robots, Schema 문법) → High Confidence
2. **Semi-deterministic:** 렌더링·휴리스틱 경계값 민감 (Soft 404, 본문 판독, 의도 매칭) → Medium–High
3. **LLM-evaluated:** LLM 추출/판단 (Claim 추출, 답변 완결성) → Rubric/Temperature=0 고정, Medium
4. **External observation:** 외부 검색/AI/API 시점별 실제 결과 (Mention, Citation, Recommendation) → 표본에 따라 Low–High

$$\text{Confidence} = \text{Method Reliability} \times \text{Input Coverage} \times \text{Evidence Agreement} \times \text{Sample Adequacy} \times \text{Freshness}$$

---

## 6. 핵심 차별화 5대 기능 (Wedge)

1. **Citation Gap Intelligence:** 경쟁사는 인용되지만 자사는 누락되는 질문 탐지 및 차이 요인 증거 분석
2. **Recommendation Gap:** 상업적 추천 질문에서 경쟁사 대비 배제 요인 분석
3. **Claim–Evidence Graph:** 페이지 내 성과 주장의 근거(원자료, 방법론, 고객 확인, 독립 출처) 연결
4. **Entity Conflict:** 리브랜딩, 공식/외부 플랫폼 간 회사·제품 정보 불일치 탐지 및 해결
5. **Competitor Reason Analysis:** 단순 점수 비교가 아닌 고객증거·독립출처·비교기준 수준의 원인 매트릭스 제공

---

## 7. 개발 순서 및 Vertical Slice

### 핵심 원칙: Vertical Slice 우선 (§21.3)
```text
상업적 Prompt Cluster 1개
 → 플랫폼 반복 관측 (n>=20)
 → 경쟁사 추천/인용 확인
 → cited page와 claim/evidence 추출
 → 자사 대응 page와 비교
 → reason matrix
 → priority action 생성
 → 완료 후 recheck
```

이 slice가 raw evidence부터 UI까지 작동한 뒤 범위를 넓힌다.

---

## 8. Definition of Done & Go/No-Go

- **No-Go 조건:** 핵심 성과 점수가 single-run, 출처 없는 LLM 판단, Readiness/Performance 혼합, 또는 재현 불가능한 가중치에 의존하는 경우 출시 불가.
- **DoD:**
  - `source → raw evidence → normalized entity → finding → UI` 전수 추적 가능.
  - 모든 점수와 finding에 `version`, `coverage`, `confidence` 필수 첨부.
  - "이유가 무엇인가?"에 제품 내 evidence로 답변 가능률 100%.
