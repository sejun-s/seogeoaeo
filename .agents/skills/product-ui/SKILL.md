---
name: product-ui
description: CiteGraph를 generic AI SaaS dashboard가 아닌 전문 SEO·AI Search 분석 제품으로 설계하고 검수하는 프로젝트 전용 UI/UX workflow. 화면 설계, UI 구현, 반응형 개선, 디자인 리뷰, screenshot QA 요청에 사용한다.
---

# CiteGraph Product UI Workflow

## 제품 관점

CiteGraph의 사용자는 고객 사이트를 반복 진단하고 근거와 수정안을 납품하는 SEO 컨설턴트와 콘텐츠 전문가다. 화면은 “멋진 AI 도구”보다 “빠르게 훑고, 원인을 검증하고, 다음 행동을 정하는 전문 분석 도구”처럼 보여야 한다.

UI의 우선순위는 다음과 같다.

```text
정확한 상태와 범위
→ 분석 데이터
→ Evidence
→ Recommendation
→ 시각적 장식
```

## 작업 전 필수 확인

UI를 설계하거나 수정하기 전에 다음을 읽는다.

1. `기획문서/citegraph-final-prd-v2.md`의 제품 원칙, IA, 보고서 신뢰 표기
2. `기획문서/citegraph-phase1-mvp-design.md`의 화면 구조, 점수 계약, REAL/MOCK 경계
3. `DESIGN.md`
4. 현재 화면 컴포넌트와 스타일

Phase 1 최신 계약을 우선한다.

- 최상위 점수는 SEO Score와 GEO Readiness Score 두 개다.
- 두 점수는 합산하거나 서로의 계산에 사용하지 않는다.
- Answerability는 GEO 하위 category다.
- GEO Readiness는 실제 AI 노출 또는 인용률이 아니다.
- 실제 Gemini, ChatGPT Search, Perplexity 관측은 향후 `AI Visibility`라는 별도 영역이다.

## 기본 디자인 원칙

- 정보 중심, 높은 가독성, 적절한 정보 밀도
- typography, spacing, alignment, divider로 계층 형성
- 장식보다 데이터, evidence, recommendation 우선
- 데이터 종류가 다르면 시각 구조와 용어도 분리
- partial, failed, stale, MOCK, UNAVAILABLE을 성공처럼 보이지 않게 표시
- 색상만으로 상태를 전달하지 않고 텍스트를 함께 사용
- Expert 사용자가 빠르게 scan할 수 있는 table/list 우선

## Generic AI SaaS 방지 규칙

다음을 기본값으로 사용하지 않는다.

- 모든 영역을 둥근 카드로 감싸는 dashboard grid
- card 안의 card
- 장식 목적 gradient와 glow
- 큰 shadow와 과도한 border radius
- 의미 없는 아이콘과 일러스트
- 모든 상태를 pill/badge로 처리
- 사용자 행동과 무관한 KPI 카드
- 거대한 hero heading과 마케팅 문구
- 데이터 사이의 과도한 whitespace
- 보라색 중심의 범용 AI SaaS 시각 언어
- 근거 없이 생성된 차트와 데모 수치

카드는 정보 단위에 명확한 독립성이나 상호작용이 있을 때만 사용한다. 먼저 heading, table, list, definition list, divider로 해결할 수 있는지 검토한다.

## 결과 화면 정보 구조

첫 vertical slice에서는 아래 순서를 유지한다.

```text
URL과 분석 범위
→ SEO Score
→ SEO category breakdown
→ GEO Readiness Score
→ GEO category breakdown
→ Findings
→ Evidence
→ Recommendation
```

### 점수

- 점수는 명확하게 보이되 여러 KPI 카드로 쪼개지 않는다.
- 점수 가까이에 설명, ruleset version, coverage 또는 한계를 둔다.
- SEO와 GEO에 색을 사용한다면 제한된 accent만 사용한다.
- GEO 영역에는 실제 AI 노출값이 아니라 readiness임을 명시한다.

### Category

- category명, 획득점/최대점, 비교 가능한 meter를 한 행에 둔다.
- 장식적 donut chart보다 정확한 수치와 수평 비교를 우선한다.
- category에서 관련 rule로 이동하거나 펼칠 수 있게 한다.

### Findings

- table/list를 기본으로 한다.
- 한 행에서 score type, rule, category, weight, PASS/WARN/FAIL을 빠르게 읽을 수 있어야 한다.
- 우선순위는 severity/impact/weight 같은 실제 기준으로 정렬한다.
- 행을 펼치면 같은 맥락에서 Evidence와 Recommendation을 보여준다.
- Evidence ID와 원문 excerpt를 숨기지 않는다.

## 문구 원칙

- 과장된 “AI 최적화 완료”, “시장 점유율” 같은 표현을 사용하지 않는다.
- `GEO Readiness Score`와 `AI Visibility`를 혼용하지 않는다.
- readiness가 인용을 보장하지 않는다는 점을 가까운 위치에서 설명한다.
- 오류는 원인과 사용자가 할 수 있는 다음 행동을 함께 설명한다.
- MOCK은 데이터와 화면 모두에서 문자로 명시한다.
- 사용자에게 필요 없는 내부 구현 용어는 노출하지 않는다.

## 접근성과 반응형

- semantic heading 순서를 지킨다.
- form input에는 label, disclosure에는 `aria-expanded`, 상태에는 텍스트를 제공한다.
- 주요 동작은 키보드로 사용할 수 있어야 한다.
- 기본 본문은 14px 이상, 보조 표 정보는 12px 이상을 목표로 한다.
- 1440px에서는 표의 비교 가능성과 정렬선을 보존한다.
- 390px에서는 가로 스크롤 없이 핵심 필드를 두 줄 또는 세로 구조로 재배치한다.
- 모바일이라고 rule ID, 결과, evidence 접근을 제거하지 않는다.
- touch target은 충분한 높이를 확보한다.

## 구현 workflow

### 1. 정보 설계

- 사용자가 이 화면에서 내려야 할 결정을 한 문장으로 적는다.
- 중요한 데이터 순서와 drill-down을 텍스트 구조로 먼저 만든다.
- card 없이 표현할 수 있는 table/list/section 구조를 먼저 검토한다.

### 2. 시각 구현

- 중성 배경, 제한된 accent, 1px divider를 기본으로 한다.
- 4px 기반 spacing scale을 사용하고 section·row 간격을 일관되게 한다.
- radius는 입력·버튼 등 필요한 요소에만 작게 사용한다.
- shadow와 gradient는 기능적 이유가 없으면 사용하지 않는다.
- 새로운 아이콘 패키지나 chart 패키지는 필요성이 입증되기 전 설치하지 않는다.

### 3. 실제 데이터 상태 확인

최소한 다음 상태를 확인한다.

- 분석 전
- 분석 중
- 실제 결과
- 입력 오류 또는 fetch 실패
- 긴 URL, 긴 title, 빈 metadata
- 많은 findings와 펼쳐진 evidence
- MOCK 또는 UNAVAILABLE이 도입된 경우 명확한 구분

### 4. Playwright screenshot QA

실제 브라우저에서 다음 viewport를 검증한다.

- Desktop: 1440px 너비
- Mobile: 390px 너비

각 viewport에서 결과 데이터가 표시된 상태를 screenshot으로 확인한다. full-page 캡처가 sticky header 때문에 반복되거나 왜곡되면 viewport screenshot과 DOM/overflow 측정을 함께 사용한다.

비판적으로 검사한다.

- visual hierarchy가 제품 정보 구조와 일치하는가
- information density가 분석 업무에 적합한가
- spacing과 정렬 기준선이 일관적인가
- typography가 작은 표에서도 읽기 쉬운가
- 불필요한 card, pill, shadow, gradient, icon이 남았는가
- 지나친 빈 공간 또는 거대한 제목이 있는가
- 긴 문자열과 펼친 상세 내용이 overflow를 만드는가
- 390px에서 중요한 데이터가 사라지는가
- 전형적인 AI-generated SaaS dashboard처럼 보이는가

문제를 발견하면 수정하고 같은 viewport에서 다시 캡처한다. screenshot 파일만 만들고 검토를 생략하지 않는다.

### 5. 품질 게이트

- 1440px와 390px 모두 horizontal overflow 없음
- console error, page error, 예상하지 않은 network error 없음
- Findings → Evidence → Recommendation disclosure 정상
- build와 lint 통과
- `git diff --check` 통과
- `DESIGN.md`와 충돌하는 스타일 없음

## 리뷰 결과 보고

“예쁘게 만들었다”는 식으로 보고하지 않는다. 다음을 구체적으로 설명한다.

1. 정보 구조가 어떻게 개선됐는지
2. 제거한 generic SaaS 패턴
3. desktop/mobile에서 발견하고 수정한 문제
4. 남은 UX 한계
5. 검증 screenshot과 관련 파일
