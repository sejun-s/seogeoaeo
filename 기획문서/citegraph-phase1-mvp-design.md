# CiteGraph Phase 1 MVP 개발 설계

> 기준 문서: `citegraph-final-prd-v2.md`  
> 설계 상태: Phase 1 구현 기준선  
> 원칙: API 키 없이도 핵심 URL 진단은 실제 동작하며, MOCK과 실제 결과를 절대 혼합하지 않는다.

## 1. 핵심 사용자와 핵심 문제

### 핵심 사용자

- 1차 구매자: SEO·콘텐츠·디지털 대행사의 대표 또는 서비스 책임자
- 1차 사용자: SEO 컨설턴트와 콘텐츠 전략가
- 결과 소비자: 대행사 고객사 담당자와 개발 협업자

### 핵심 문제

1. 고객 URL을 진단하고 근거를 모아 보고서로 만드는 데 시간이 많이 든다.
2. 기존 AI 진단은 실행마다 점수가 흔들리고, 왜 문제인지 원문 근거가 부족하다.
3. 수정 권고가 추상적이어서 실제 콘텐츠나 코드 수정으로 이어지지 않는다.
4. GEO 준비도와 실제 AI 검색 인용이 혼동돼 고객에게 과장된 결과를 전달할 위험이 있다.

### Phase 1의 한 문장 가치

> URL 하나를 입력하면 안전하게 페이지를 가져와 Title/H1/Meta/링크/구조화 데이터와 답변 추출 준비도를 재현 가능한 규칙으로 분석하고, 근거·우선순위·수정 예시가 포함된 결과를 보여준다.

## 2. Phase 1 범위

### 반드시 필요한 기능

| 기능 | 동작 방식 | 비용/키 분류 | MVP 처리 |
|---|---|---|---|
| URL 입력과 형식 검증 | http/https, 사용자 정보 URL 거부 | API 키 없이 실제 동작 가능 | REAL |
| 안전한 정적 페이지 수집 | DNS/IP/redirect/크기/시간 제한 후 HTML 수집 | API 키 없이 실제 동작 가능 | REAL |
| HTML 핵심 요소 추출 | title, meta description, H1, canonical, robots, JSON-LD | API 키 없이 실제 동작 가능 | REAL |
| 규칙 기반 SEO 분석 | 누락·길이·중복·구조·링크·schema 규칙 | API 키 없이 실제 동작 가능 | REAL |
| 규칙 기반 GEO Readiness | Answerability를 포함해 기계 판독성, 신뢰 근거, 인용 준비도, 콘텐츠 접근성을 분석 | API 키 없이 실제 동작 가능 | REAL |
| 결정론적 점수와 coverage | 동일 HTML이면 동일 결과 | API 키 없이 실제 동작 가능 | REAL |
| Evidence 표시 | 서버가 발급한 evidence ID와 원문 일부 | API 키 없이 실제 동작 가능 | REAL |
| Findings와 수정 예시 | 규칙 템플릿 기반 text/HTML/JSON-LD 예시 | API 키 없이 실제 동작 가능 | REAL |
| 결과 화면 | SEO/GEO 두 점수, category, rule, 근거, 우선 액션 | API 키 없이 실제 동작 가능 | REAL |
| 분석 실패/부분 성공 표시 | 오류 코드와 측정 불가 항목 표시 | API 키 없이 실제 동작 가능 | REAL |
| 브라우저 E2E 테스트 | URL 입력부터 결과 확인, 오류 감시 | API 키 없이 실제 동작 가능 | REAL |
| 샘플 URL 데모 | 네트워크 차단 시 고정 fixture 분석 | API 키 없이 실제 동작 가능 | MOCK이라고 화면에 표시 |
| Gemini 실제 인용 관측 | provider citation annotation 사용 | API 키가 있어야 동작 | 어댑터만 구현, 기본 비활성 |
| Gemini 관측 화면 예시 | 고정된 샘플 observation | API 키 없이 표시 가능 | 반드시 MOCK 배지 |

### Phase 1 후반에 추가하되 첫 세로 슬라이스에는 제외

| 기능 | 분류 | 이유 |
|---|---|---|
| 로그인·조직·프로젝트 | 무료 외부 서비스로 동작 가능(Supabase Free) | URL 분석 검증 후 붙여도 핵심 계약이 변하지 않음 |
| 감사 결과 영구 저장 | 무료 외부 서비스로 동작 가능(Supabase Free) | 초기에는 메모리/브라우저 세션으로 충분 |
| PDF 보고서 | API 키 없이 실제 동작 가능 | 결과 화면이 안정된 뒤 동일 데이터로 출력 |
| 화이트라벨 설정 | API 키 없이 실제 동작 가능 | 유료 파일럿에 필요하지만 첫 분석에는 불필요 |
| Headless 렌더링 fallback | API 키 없이 실제 동작 가능 | 정적 수집 실패 사례를 확인한 뒤 추가 |
| LLM 의미 평가 | API 키가 있어야 동작 | 결정론적 두 점수와 분리된 보조 분석으로만 추가 |

### Phase 2 이후로 미룰 기능

- 스케줄 실행, queue lease, zombie recovery
- 다중 엔진 GEO 관측과 반복 표본/안정성
- Action Center의 담당자·승인·배포 감지·재진단
- GSC/GA4, WordPress, GitHub, Jira/Linear 연동
- probe credit, 결제, 원가 대시보드
- 벤치마크, 성과 귀속, 다중 고객 포털, SSO
- **콘텐츠 생성(블로그 작성) 지원** — findings/recommendation을 근거로 SEO·GEO
  기준에 맞는 초안을 생성하는 기능. 경쟁 벤치마킹에서 Writesonic 등 일부
  GEO/AEO 툴이 "가시성 추적 + 콘텐츠 생성"을 함께 제공하는 것을 확인했다
  (2026-08-18 벤치마킹). 진단(diagnosis)과 생성(generation)은 별도 기능·별도
  API 키 요구사항이므로, 착수 시 다음을 지켜야 한다.
  - 생성된 콘텐츠는 초안임을 명시하고 REAL(진단 결과 기반 근거 포함)과
    LLM 생성 텍스트를 구분 표시한다.
  - LLM API 키가 없으면 `UNAVAILABLE`로 유지하고 heuristic으로 대체 생성하지
    않는다.
  - 생성 기능이 SEO Score·GEO Readiness Score 계산에 관여하지 않는다
    (진단 점수의 독립성 유지).

## 3. 실제 기능과 MOCK 경계

- `REAL`: 네트워크에서 실제 HTML을 받아 규칙 코드로 계산한 결과다.
- `MOCK`: 화면 및 데이터 계약 검증을 위한 고정 표본이다. 카드·표·응답 모두 `MOCK`을 표시한다.
- `UNAVAILABLE`: API 키가 없는 provider 기능이다. 가짜 성공 결과를 만들지 않고 연결 필요 상태를 보여준다.
- readiness와 observed visibility는 서로 다른 데이터 타입·카드·API 필드로 둔다.
- MOCK 관측값은 진단 총점, 추세, 보고서의 실제 수치에 포함하지 않는다.

## 4. 기술 스택 후보 비교와 결정

### 웹 프레임워크

| 후보 | 장점 | 단점 | 판단 |
|---|---|---|---|
| Next.js App Router | 화면과 서버 API를 한 프로젝트에서 관리, 향후 인증/보고서 확장 용이 | 서버 실행 환경과 캐시 규칙을 이해해야 함 | 선택 |
| Vite + React + 별도 API | 프론트가 단순하고 빠름 | API 서버를 별도로 운영해야 해 초기 구조가 두 개 | 보류 |
| Remix/React Router framework | 데이터 흐름이 명확 | 팀/생태계 선택 비용과 PRD 권장안 차이 | 보류 |

선택: 최신 안정 Next.js App Router + TypeScript strict. 공식 문서상 App Router가 최신 React 기능과 서버 기능을 제공한다. 정확한 버전은 프로젝트 생성 시 lockfile로 고정한다.

### 스타일/UI

| 후보 | 장점 | 단점 | 판단 |
|---|---|---|---|
| Tailwind CSS + 자체 컴포넌트 | 참고 이미지의 밝은 대시보드를 빠르게 재현, 의존성 적음 | 반복 UI를 직접 관리 | 선택 |
| shadcn/ui | 접근성 기반 구성요소가 풍부 | 첫 슬라이스에는 설치량과 생성 파일이 과함 | 필요 시 후속 도입 |
| MUI | 완성된 컴포넌트가 많음 | 디자인 개성이 약해지고 번들/테마가 무거움 | 제외 |

아이콘은 패키지를 바로 추가하지 않고 텍스트/간단한 CSS로 시작한다. 차트도 첫 슬라이스에서는 CSS 막대와 숫자로 표현한다.

### HTML 수집·파싱

| 후보 | 장점 | 단점 | 판단 |
|---|---|---|---|
| Node 내장 fetch + cheerio | 구현이 단순하고 HTML 분석에 적합 | JS 렌더링 페이지는 제한 | 첫 단계 선택 |
| Playwright crawler | 실제 렌더 결과 수집 | 느리고 자원·보안 부담이 큼 | fallback으로 후속 추가 |
| 외부 크롤링 API | 차단 대응이 쉬움 | 비용/API 키/데이터 외부 전송 | MVP 제외 |

### 데이터 저장

| 후보 | 장점 | 단점 | 판단 |
|---|---|---|---|
| 메모리 + fixture | 키 없이 즉시 검증 | 재시작하면 사라짐 | 첫 세로 슬라이스 선택 |
| SQLite | 완전 로컬 영속성 | 이후 Supabase 이전 작업 필요 | 테스트/개발 보조 후보 |
| Supabase Free | Postgres/Auth/RLS/Storage를 한 번에 제공 | 계정과 프로젝트 설정 필요 | Phase 1 후반 선택 |

### 작업 그래프

| 후보 | 장점 | 단점 | 판단 |
|---|---|---|---|
| 작은 명시적 TypeScript pipeline | 추가 패키지 없이 상태·단계를 명확히 검증 | durable resume는 직접 구현 필요 | 첫 슬라이스 선택 |
| LangGraph.js | 상태/조건/loop 확장에 적합 | 키 없는 규칙 분석만으로는 초기 도입 이득이 작음 | 의미 평가 추가 시 도입 |
| 일반 queue worker | 운영 안정성이 좋음 | 초기 환경이 복잡 | Phase 2 |

### 테스트

- 단위 테스트: 프로젝트 기본 테스트 도구를 우선 확인하고, 없으면 Vitest 하나만 추가한다.
- 브라우저 테스트: Playwright Chromium 한 종류부터 사용한다.
- E2E는 console error, page error, 실패한 network response를 테스트 실패로 처리한다.

### 최신 문서 확인 상태

`codex mcp list` 확인 결과 Context7 MCP는 로컬 Codex CLI에 `enabled` 상태로 설치되어 있다. 다만 현재 Desktop 세션의 호출 가능한 도구 목록에는 Context7이 노출되지 않았다. 따라서 이는 **미설치가 아니라 현재 세션의 MCP 가용성/연결 문제**로 분류한다. 세션에서 접근 가능해지면 Context7을 우선 사용하고, 접근할 수 없는 동안에만 각 기술의 공식 문서를 사용한다. 이번 설계 확인은 Next.js App Router, Supabase RLS, Playwright, LangGraph.js 공식 문서로 대체했으며 이 대체 사실을 기록한다.

## 5. MVP 화면 구조

```text
/                         URL 분석 시작
├─ 좌측 내비게이션        Overview / Audits / GEO / Actions / Reports
├─ 상단 상태              Local mode / Provider 미연결 / 최근 분석
├─ URL 입력               URL + 분석 버튼 + 샘플 분석
└─ 최근 또는 안내 카드

/audits/[runId]           분석 결과
├─ 실행 상태              fetch → extract → evaluate → score
├─ 핵심 요약              SEO Score, GEO Readiness Score, coverage, 중요 이슈 수
├─ SEO / GEO 별도 카드     두 점수 사이 합산·가중 없음
├─ Category 목록           category 점수와 적용 rule 수
├─ Rule 상세               PASS/WARN/FAIL, weight
├─ Evidence 패널           evidence ID, selector/필드, 원문 일부
└─ Recommendation          rule별 수정 제안

/geo                      실제 관측과 준비도 분리 설명
├─ Provider 연결 상태     기본 UNAVAILABLE
└─ 데모 observation       MOCK 배지 고정
```

첫 번째 구현은 `/`에서 입력하고 같은 화면 아래에 결과를 표시해 세로 슬라이스를 완성한다. 상세 URL과 보조 화면은 데이터 계약이 검증된 뒤 분리한다.

참고 이미지에서는 밝은 회백색 배경, 흰 카드, 보라/주황/민트 포인트, 큰 요약 지표, 얕은 그림자, 좌측 내비게이션 구조만 차용한다. HR 문구나 수치를 복제하지 않는다.

## 6. 데이터 모델

```ts
type ResultMode = "REAL" | "MOCK";
type RunStatus = "queued" | "fetching" | "extracting" | "evaluating" | "completed" | "partial" | "failed";

interface AuditRun {
  id: string;
  inputUrl: string;
  finalUrl?: string;
  mode: ResultMode;
  status: RunStatus;
  createdAt: string;
  completedAt?: string;
  error?: { code: string; message: string };
}

interface PageSnapshot {
  runId: string;
  statusCode: number;
  contentType: string;
  contentHash: string;
  fetchedAt: string;
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  headings: Array<{ level: number; text: string; evidenceId: string }>;
  links: Array<{ href: string; text: string; internal: boolean }>;
  jsonLd: unknown[];
}

interface Evidence {
  id: string;
  kind: "html" | "header" | "derived";
  field: string;
  excerpt: string;
}

interface Finding {
  stableKey: string;
  scoreType: "SEO" | "GEO";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  rationale: string;
  evidenceIds: string[];
  impact: 1 | 2 | 3 | 4 | 5;
  effort: 1 | 2 | 3 | 4 | 5;
  recommendation: string;
}

interface AxisScore {
  value: number;
  coverage: number;
  measuredWeight: number;
  totalWeight: number;
}

interface AuditResult {
  run: AuditRun;
  scores: { seo: AxisScore; geoReadiness: AxisScore };
  ruleResults: RuleResult[];
  findings: Finding[];
  evidence: Evidence[];
  providerObservation: { status: "UNAVAILABLE" | "MOCK" | "REAL"; data?: unknown };
  rulesetVersion: string;
}
```

### 점수 규칙 계약

```ts
interface RuleResult {
  id: string;
  scoreType: "SEO" | "GEO";
  category: string;
  title: string;
  description: string;
  weight: number;
  result: "PASS" | "WARN" | "FAIL";
  evidence: Evidence[];
  recommendation: string;
}
```

- PASS = 해당 rule weight의 100%
- WARN = 해당 rule weight의 50%
- FAIL = 0%
- `Score = round(sum(weight × resultFactor))`
- SEO rule weight의 합은 100, GEO rule weight의 합도 별도로 100이다.
- SEO 결과는 GEO 계산에 사용하지 않고 GEO 결과도 SEO 계산에 사용하지 않는다.
- 측정 불가 항목이 생기면 결과를 억지로 FAIL 처리하지 않고 coverage로 분리한다. 점수는 측정된 weight를 100점으로 다시 환산하며 잠정 점수임을 표시한다.
- 동일한 정규화 HTML과 동일한 `rulesetVersion`에는 시간, 난수, 외부 AI 결과를 사용하지 않으므로 항상 같은 결과가 나온다.

### SEO Score rules — 총 100

| ID | Category | Rule | Weight | 판정 기준 요약 |
|---|---|---|---:|---|
| SEO-TECH-001 | Technical SEO | HTTPS 사용 | 5 | 최종 URL이 HTTPS면 PASS |
| SEO-TECH-002 | Technical SEO | Canonical 존재 | 5 | 유효한 canonical URL 존재 여부 |
| SEO-TECH-003 | Technical SEO | Robots 지시 명확성 | 5 | 충돌하는 robots 지시가 없는지 |
| SEO-TECH-004 | Technical SEO | 문서 언어 선언 | 5 | `html[lang]` 존재 여부 |
| SEO-ONPAGE-001 | On-page | Title 품질 | 8 | 존재하며 권장 길이 범위인지 |
| SEO-ONPAGE-002 | On-page | Meta description 품질 | 6 | 존재하며 권장 길이 범위인지 |
| SEO-ONPAGE-003 | On-page | 단일 핵심 H1 | 6 | 비어 있지 않은 H1이 정확히 하나인지 |
| SEO-ONPAGE-004 | On-page | Heading 계층 | 5 | H1 이후 수준이 과도하게 건너뛰지 않는지 |
| SEO-INDEX-001 | Indexability | Noindex 차단 없음 | 10 | meta/X-Robots-Tag에 noindex가 없는지 |
| SEO-INDEX-002 | Indexability | Robots 차단 없음 | 5 | 페이지 수준 nofollow/none 차단 여부 |
| SEO-INDEX-003 | Indexability | Canonical 일관성 | 5 | canonical이 최종 URL과 합리적으로 일치하는지 |
| SEO-SCHEMA-001 | Structured Data | JSON-LD 문법 | 8 | 모든 JSON-LD 블록 파싱 가능 여부 |
| SEO-SCHEMA-002 | Structured Data | 인식 가능한 Schema 유형 | 7 | `@context`와 유효 `@type` 존재 여부 |
| SEO-CONTENT-001 | Content Basics | 충분한 본문 | 8 | 가시 텍스트가 최소 기준을 충족하는지 |
| SEO-CONTENT-002 | Content Basics | 내부 링크 | 4 | 탐색 가능한 내부 링크 존재 여부 |
| SEO-CONTENT-003 | Content Basics | 이미지 대체 텍스트 | 4 | 콘텐츠 이미지의 alt 제공 비율 |
| SEO-CONTENT-004 | Content Basics | 콘텐츠 갱신 신호 | 4 | 날짜 메타 또는 time 요소 존재 여부 |

Category 최대점은 Technical SEO 20, On-page 25, Indexability 20, Structured Data 15, Content Basics 20이다.

### GEO Readiness Score rules — 총 100

Answerability는 독립 점수가 아니라 GEO의 하위 category다.

| ID | Category | Rule | Weight | 판정 기준 요약 |
|---|---|---|---:|---|
| GEO-ANSWER-001 | Answerability | 직접 답변 블록 | 8 | 질문/주제 직후 간결한 설명 문단 존재 여부 |
| GEO-ANSWER-002 | Answerability | 질문형 Heading | 6 | 질문 의도를 나타내는 heading 존재 여부 |
| GEO-ANSWER-003 | Answerability | 목록·표 구조 | 6 | 단계·비교·요약을 list/table로 표현하는지 |
| GEO-MACHINE-001 | Machine Readability | Heading 구조 | 6 | 의미 있는 heading 계층 여부 |
| GEO-MACHINE-002 | Machine Readability | 의미 구조 | 6 | main/article/section 등 의미 요소 사용 여부 |
| GEO-MACHINE-003 | Machine Readability | 메타데이터 명확성 | 4 | title과 description이 주제를 명시하는지 |
| GEO-MACHINE-004 | Machine Readability | 구조화 데이터 | 4 | 파싱 가능한 JSON-LD 존재 여부 |
| GEO-TRUST-001 | Evidence & Trust | 저자 정보 | 5 | 저자 이름/author schema 신호 여부 |
| GEO-TRUST-002 | Evidence & Trust | 작성·수정 날짜 | 5 | datePublished/dateModified/time 신호 여부 |
| GEO-TRUST-003 | Evidence & Trust | 외부 근거 링크 | 6 | 설명적 anchor를 가진 외부 출처 링크 여부 |
| GEO-TRUST-004 | Evidence & Trust | 발행 주체 식별 | 4 | Organization/Person/사이트 주체 신호 여부 |
| GEO-CITE-001 | Citation Readiness | 주장과 근거의 근접성 | 8 | 수치·강한 주장 주변에 출처 링크가 있는지 |
| GEO-CITE-002 | Citation Readiness | 출처 링크 품질 | 6 | 비어 있지 않은 anchor와 유효 URL 여부 |
| GEO-CITE-003 | Citation Readiness | 엔티티 명명 일관성 | 6 | title/H1/schema의 핵심 이름이 일치하는지 |
| GEO-ACCESS-001 | Content Accessibility | 초기 HTML 본문 노출 | 8 | JS 실행 없이 의미 있는 본문을 읽을 수 있는지 |
| GEO-ACCESS-002 | Content Accessibility | 읽기 가능한 텍스트 | 5 | 텍스트 길이와 문단 구조가 최소 기준을 충족하는지 |
| GEO-ACCESS-003 | Content Accessibility | 접근 차단 요소 없음 | 3 | 로그인/쿠키벽 문구만 있는 shell이 아닌지 |
| GEO-ACCESS-004 | Content Accessibility | 언어 식별 가능 | 4 | lang 속성 또는 충분한 언어 신호 여부 |

각 GEO category의 최대점은 20점이다. 이 점수는 실제 Gemini, ChatGPT Search, Perplexity 노출이나 인용률이 아니라 페이지의 AI Search/Generative Search 준비도만 나타낸다.

### Drill-down 계약

사용자는 반드시 다음 순서로 점수의 원인을 확인할 수 있다.

```text
SEO Score 또는 GEO Readiness Score
→ Category
→ Rule
→ Evidence
→ Recommendation
```

향후 실제 엔진 관측은 `AI Visibility`라는 별도 도메인으로 추가한다. `ObservationSet`, `ProbeRun`, `Citation`은 Audit/RuleResult와 별도 테이블 및 API를 사용하며 GEO Readiness 점수 계산에 들어가지 않는다.

영구 DB를 붙일 때는 `organizations → projects → audits → findings`를 기본 관계로 하고, `observations`는 별도 도메인으로 유지한다. 모든 조직 데이터에는 `organization_id`를 포함하고 RLS를 활성화한다.

## 7. 주요 API 구조

| 메서드/경로 | 역할 | 초기 구현 |
|---|---|---|
| `POST /api/audits` | URL 검증, 수집, 추출, 규칙 평가, 결과 반환 | REAL |
| `GET /api/audits/:id` | 실행 결과 조회 | 첫 단계에서는 메모리, 재시작 시 소멸 |
| `GET /api/demo-audit` | 고정 fixture 결과 | MOCK |
| `GET /api/providers` | provider 연결 및 capability 상태 | Gemini `UNAVAILABLE` |
| `POST /api/observations` | GEO provider 실행 | 어댑터 계약만, 키 없으면 명확한 오류 |

`POST /api/audits` 요청:

```json
{ "url": "https://example.com", "locale": "ko-KR", "renderMode": "static" }
```

응답은 `AuditResult` 하나로 통일한다. 첫 구현은 요청-응답 방식으로 시작하고 제한 시간을 짧게 둔다. 장기 실행·이벤트 스트림은 Phase 2 queue 도입 시 추가한다.

Provider 계약:

```ts
interface ObservationProvider {
  id: string;
  capabilities: {
    citationAnnotations: boolean;
    region: boolean;
    language: boolean;
  };
  isConfigured(): boolean;
  observe(input: ObservationInput): Promise<ObservationResult>;
}
```

## 8. 보안 위험과 필수 방어

### 매우 높음: SSRF와 내부망 접근

- http/https 이외 프로토콜 거부
- URL의 사용자명/비밀번호 거부
- 최초 요청과 모든 redirect에서 hostname을 다시 resolve
- loopback, private, link-local, multicast, metadata IP 차단
- redirect 최대 5회, 응답 본문 최대 2MB(초기값), 전체 15초 제한
- 허용 content-type만 파싱
- DNS 검사 이후 연결 대상이 바뀌는 DNS rebinding 위험을 테스트 fixture에 포함

### 높음: 악성 HTML과 프롬프트 인젝션

- HTML은 데이터로만 취급하고 script 실행 금지
- evidence ID는 서버가 생성
- 향후 LLM에 전달할 때 페이지 텍스트와 시스템 지시를 분리
- 페이지에 없는 통계·저자·리뷰를 수정안에 생성하지 않음

### 높음: 리소스 고갈

- timeout, 최대 byte, 최대 heading/link/schema 개수 제한
- 동시 요청 제한과 동일 URL 재요청 제한을 운영 배포 전에 추가

### 높음: 테넌트 데이터 유출

- Supabase 도입 시 public 테이블 전체 RLS
- service role과 provider secret은 서버에서만 사용
- cross-tenant SELECT/WRITE 거부 테스트를 배포 gate로 설정

### 중간: 잘못된 신뢰 표현

- GEO Readiness는 실제 인용이 아님을 화면에 고정 표시
- MOCK/REAL/UNAVAILABLE 배지를 데이터와 UI 양쪽에 강제
- partial 결과의 누락 항목을 0점으로 가장하지 않고 N/A 처리

## 9. 구현 순서

첫 세로 슬라이스를 아래 8개 작업으로만 완성한다.

1. **프로젝트 기반과 계약**: 기존 파일 재확인, 최소 Next.js 생성, 결과 타입과 REAL/MOCK 구분 규칙 확정
2. **안전한 URL Guard**: 프로토콜/DNS/IP/redirect/timeout/크기 제한과 보안 단위 테스트
3. **실제 페이지 fetch**: 정적 HTML 요청, 응답 상태·최종 URL·content-type 처리
4. **핵심 요소 추출**: title, meta description, H1, canonical, robots, JSON-LD schema와 evidence ID 추출
5. **결정론적 진단**: 규칙 기반 SEO/GEO Readiness 분석, findings, 수정 제안, coverage와 두 점수 계산
6. **결과 화면**: URL 입력 → 분석 실행 → SEO/GEO 두 점수 → category/rule/evidence/recommendation 렌더링
7. **실제 브라우저 QA**: 정상 URL·잘못된 URL 흐름, console/page/network error 검사 후 오류 수정 및 재시험
8. **품질 게이트**: build, lint, 단위/E2E 재실행, git diff와 불필요 패키지 검토

이 8개 작업이 모두 끝나기 전에는 다음 기능을 구현하지 않는다.

- Supabase 인증, 조직, 권한, RLS 또는 영구 저장
- PDF와 화이트라벨 보고서
- Gemini, GEO provider adapter 또는 관측 MOCK 화면
- WordPress/GitHub 등 외부 연동
- 결제와 probe credit
- Worker, queue 또는 LangGraph
- Headless Playwright crawler

## 10. 첫 구현 완료 기준

- API 키 없이 공개 URL 하나를 실제 분석한다.
- Title/Meta description/H1/Canonical/Robots/JSON-LD를 실제 HTML에서 추출한다.
- SEO Score와 GEO Readiness Score가 서로 독립적이고 결정론적으로 계산된다.
- 모든 high/critical finding이 서버 발급 evidence ID를 참조한다.
- 첫 슬라이스에는 Gemini와 관측 MOCK 자체를 넣지 않는다.
- SSRF 기본 차단 테스트를 통과한다.
- build, lint, 단위 테스트, Playwright Chromium 테스트가 통과한다.
- 브라우저 console error, page error, 실패한 내부 network 요청이 없다.
- 최종 git diff에서 PRD와 무관한 변경 및 불필요한 패키지가 없다.

## 확정 결정

- Phase 1의 첫 제품은 로그인 없는 단일 URL Audit이다.
- 규칙 기반 실제 분석을 먼저 완성하고 LLM은 선택적 adapter로 남긴다.
- 첫 슬라이스는 저장 기능 없이 요청 결과만 화면에 유지하고, Phase 1 후반에 Supabase Free를 검토한다.
- Headless 크롤링, LangGraph, 차트 라이브러리는 필요가 입증될 때 추가한다.
- 외부 GEO 관측은 키가 생기기 전까지 `UNAVAILABLE`; 데모가 필요할 때만 명시적 `MOCK`을 제공한다.
