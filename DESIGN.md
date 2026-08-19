# CiteGraph UI 원칙

## 제품 인상

CiteGraph는 범용 SaaS 대시보드가 아니라 전문 SEO·AI Search 분석 도구다. 화면은 장식보다 데이터, 판정 근거, 수정 행동을 우선하며 사용자가 빠르게 훑고 깊게 확인할 수 있어야 한다.

## 기본 원칙

- 정보 중심: 첫 화면과 결과 화면 모두 핵심 분석 작업을 중심에 둔다.
- 높은 가독성: 본문 14px 이상, 표·보조 정보 12px 이상을 기본으로 한다.
- 적절한 밀도: 관련 정보는 가까이 배치하되 행 높이와 구분선을 일관되게 사용한다.
- 절제된 표현: 흰 배경, 중성 회색, 제한된 의미 색상만 사용한다.
- 계층: 글자 크기·굵기·간격·구분선으로 만든다.
- Evidence first: 장식적 KPI보다 rule 판정과 근거를 먼저 보여준다.

## 금지 패턴

- 카드 안의 카드, 대시보드 전체를 카드 격자로 구성하는 방식
- 장식 목적의 gradient, 큰 shadow, 과도한 radius
- 메뉴 의미를 설명하지 못하는 아이콘
- 모든 상태를 badge나 pill로 표현하는 방식
- 의미 없는 KPI 카드와 거대한 제목
- 데이터 사이에 과도한 빈 공간
- 일반적인 AI SaaS 랜딩 페이지처럼 보이는 hero 문구와 장식

## 정보 구조

결과는 아래 순서를 유지한다.

```text
URL
→ SEO Score
→ SEO category breakdown
→ GEO Readiness Score
→ GEO category breakdown
→ Findings
→ Evidence
→ Recommendation
```

- SEO와 GEO는 하나의 비교 가능한 score section 안에서 보여주되 서로 합산하지 않는다.
- category는 수평 막대와 수치로 빠르게 비교할 수 있게 한다.
- findings는 table/list가 기본이며 severity·score type·rule·weight·판정이 한 행에 보여야 한다.
- 행을 펼치면 같은 위치에서 Evidence와 Recommendation을 확인한다.
- `GEO Readiness`는 실제 AI 엔진 노출이 아니라 준비도임을 가까운 위치에서 명시한다.

## 시각 규칙

- 기본 radius: 0~6px. 입력·버튼에만 제한적으로 사용한다.
- shadow: 사용하지 않는다.
- surface: 페이지 배경과 1px 구분선으로 구조화한다.
- 색상: SEO는 청록, GEO는 보라, FAIL은 적색, WARN은 황갈색, PASS는 녹색이다.
- 상태 표시는 색상만 의존하지 않고 텍스트를 병기한다.
- spacing은 4px 단위로 운용하며 section 간격 32px, 내부 간격 8~16px을 기본으로 한다.
- 데스크톱 최대 콘텐츠 폭은 약 1200px이며 좌측 정렬한다.

## 반응형 규칙

- 1440px: URL, 두 점수, category breakdown, findings 표가 한 흐름으로 읽혀야 한다.
- 390px: 메뉴는 단순한 상단 브랜드 행으로 축소하고 점수는 세로 배치한다.
- 모바일 findings는 표 열을 숨기지 않고 핵심 필드를 두 줄 구조로 재배치한다.
- 가로 스크롤을 만들지 않는다.

## QA 체크리스트

- visual hierarchy가 URL → 점수 → category → findings 순서와 일치하는가
- 정보가 지나치게 분산되거나 빽빽하지 않은가
- 4px 기반 spacing이 일관적인가
- 본문과 보조 문구의 typography가 읽기 쉬운가
- 불필요한 card, shadow, gradient, pill, icon이 없는가
- 정렬 기준선이 유지되는가
- 1440px와 390px에서 overflow가 없는가
- 전형적인 AI-generated SaaS dashboard처럼 보이는 요소가 남아 있지 않은가
