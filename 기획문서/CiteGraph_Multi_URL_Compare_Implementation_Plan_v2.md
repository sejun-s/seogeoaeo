# CiteGraph 사이트/URL 대조 비교 기능 구현 계획서 v2

> 기능명: Multi-URL Compare  
> 대상 프로젝트: `seogeoaeo` / CiteGraph  
> 대상 화면: `/compare`  
> 기준 문서: `citegraph-url-comparison-spec.md`, `CiteGraph_Backend_Implementation_Plan_v3.md`  
> 문서 상태: 구현 승인 후보안  
> 작성 기준일: 2026-08-18

---

## 1. 개요

CiteGraph의 Multi-URL Compare는 사용자의 사이트 1개와 경쟁 사이트 1~4개를 동일한 질문 세트와 동일한 진단 조건으로 실행하여 **AI 검색 인용 경쟁력 차이**를 수평 비교하는 기능이다.

비교 대상은 총 2~5개 URL이며, 첫 번째 대상은 `ME`, 나머지는 `COMPETITOR` 역할을 가진다. 각 URL은 기존 진단 파이프라인을 재사용하여 순차 실행한다. 일부 URL 진단이 실패해도 성공한 대상의 결과는 유지하고, 실패 대상은 `ERROR` 상태로 격리한다.

핵심 비교 지표는 다음과 같다.

1. Citation Rate
2. Brand Mention Rate
3. Average Citation Position
4. 플랫폼별 비교 결과
5. 질문별 Winner 및 `ME` 대비 Gap

기존 SEO Score, GEO Readiness Score, 카테고리 점수, Findings Diff는 기술적 원인을 설명하는 **2차 진단 영역**으로 제공한다.

---

## 2. 기존 초안 대비 필수 교정 사항

| 항목 | 기존 초안 | 고도화 기준 |
| --- | --- | --- |
| 비교 개수 | 2~4개 | **2~5개** |
| 역할 | 단순 URL 배열 | `ME` 1개 + `COMPETITOR` 1~4개 |
| 실행 방식 | `Promise.allSettled` 병렬 실행 | **URL 입력 순서에 따른 순차 실행** |
| 질문 조건 | 명시 없음 | 프로젝트의 기존 질문 세트 Snapshot 재사용 |
| 핵심 지표 | SEO/GEO 점수 중심 | Citation·Brand Mention·Citation Position 중심 |
| 세부 비교 | Category·Findings | Platform·Question 비교 추가, Category·Findings는 2차 영역 |
| 화면 위치 | `app/page.tsx` 탭 | **`/compare` 전용 페이지** |
| 실패 처리 | 항목별 ERROR | 부분 성공·비교 불충분 상태와 0점 오인 방지 추가 |
| 저장 | 명시 없음 | 비교 실행·대상 최소 이력 저장 |
| QA | 내부 도구명 중심 | 재현 가능한 브라우저 시나리오·뷰포트·접근성 기준 |

`Promise.allSettled()` 자체가 나쁜 API라서 제외하는 것이 아니다. 승인된 공정 비교 조건을 유지하고, 각 URL 진단 내부에서 발생할 수 있는 다수의 외부 요청을 제어하며, Workers의 동시 연결 및 비용 급증 위험을 피하기 위해 이번 버전은 순차 실행으로 고정한다.

---

## 3. 목표와 제외 범위

### 3.1 목표

- 동일 질문·플랫폼·규칙 버전을 사용한 공정한 사이트 비교
- `ME`와 경쟁 사이트의 인용 경쟁력 차이를 한 화면에서 파악
- 전체 지표에서 질문·플랫폼·기술 규칙까지 원인 탐색 가능
- 일부 URL 실패 시 성공 결과 보존
- 비교 실행과 각 대상 Audit Run의 추적 가능성 확보
- 2개부터 5개까지 데스크톱·모바일에서 안정적인 표시

### 3.2 이번 버전 제외

- 신규 질문 세트 생성기
- 비교 화면에서 질문 세트 편집
- Citation occurrence 전체 원본 목록 또는 원시 응답 전문 노출
- URL별 병렬 실행 또는 사용자 지정 동시성
- SSE·WebSocket 기반 실시간 Target 진행 스트리밍
- PDF·PPT 자동 보고서 생성
- 공개 공유 링크와 외부 공동 편집
- 경쟁사 자동 추천 또는 크롤링

---

## 4. 핵심 불변 조건

비교 결과가 유효하려면 다음 조건을 모든 대상에 동일하게 적용해야 한다.

```text
questionSetId
questionSetVersion
platformSetVersion
rulesetVersion
engineVersion
comparisonAlgorithmVersion
comparisonStartedAt
```

### 필수 원칙

1. 비교 시작 시 프로젝트의 활성 질문 세트를 Snapshot으로 고정한다.
2. 실행 중 프로젝트 질문 세트가 수정돼도 현재 비교에는 영향을 주지 않는다.
3. 모든 대상은 동일한 질문과 플랫폼 집합을 사용한다.
4. 대상별 결과 배열 순서는 입력 순서를 보존한다.
5. 실패 대상의 지표는 `0`이 아니라 `null`과 `ERROR`로 표현한다.
6. 규칙 또는 질문 버전이 다른 캐시 결과는 재사용하지 않는다.
7. UI에서 10개 카테고리와 35개 규칙을 숫자로 하드코딩하지 않는다. 현재 규칙 세트에서 내려온 메타데이터를 사용한다.

---

## 5. 전체 처리 흐름

```text
[사용자 입력]
ME 1개 + Competitor 1~4개
        │
        ▼
POST /api/compare
        │
        ├─ actorKey 서버에서 결정
        ├─ project 접근 권한 확인
        ├─ 역할·개수·중복 URL 검증
        └─ 질문·플랫폼·규칙 Snapshot 생성
        │
        ▼
compare_run + compare_targets 초기화
        │
        ▼
URL 입력 순서대로 executeAudit() 순차 실행
        │
        ├─ 성공: Audit Run/Result 연결
        └─ 실패: 해당 Target만 ERROR 기록
        │
        ▼
성공 결과를 Comparable Snapshot으로 정규화
        │
        ▼
전체 지표·플랫폼·질문·카테고리·Findings 비교 계산
        │
        ▼
compare_run 상태 확정
COMPLETED / PARTIAL / INSUFFICIENT / FAILED
        │
        ▼
CompareResponse 반환
```

---

## 6. 요청 모델

단순 `urls: string[]` 대신 역할이 명시된 Target 배열을 사용한다.

```typescript
export type CompareTargetRole = "ME" | "COMPETITOR";

export interface CompareRequestBody {
  projectId: string;
  targets: Array<{
    role: CompareTargetRole;
    url: string;
    label?: string;
  }>;
}
```

요청 예시:

```json
{
  "projectId": "project_123",
  "targets": [
    {
      "role": "ME",
      "url": "https://my-site.example",
      "label": "우리 사이트"
    },
    {
      "role": "COMPETITOR",
      "url": "https://competitor-a.example",
      "label": "경쟁사 A"
    }
  ]
}
```

### 요청 검증 규칙

- Target 수는 2~5개다.
- `ME`는 정확히 1개다.
- `COMPETITOR`는 1~4개다.
- 첫 번째 Target은 `ME`여야 한다.
- URL은 기존 `validateAndNormalizeUrl()`을 재사용한다.
- 정규화 후 동일 URL이 중복되면 `DUPLICATE_TARGET`으로 거절한다.
- 동일 Origin의 다른 Path는 별도 URL로 허용한다.
- `label`은 선택값이며 길이를 제한하고 HTML로 렌더링하지 않는다.
- `actorKey`는 Request Body에서 받지 않고 인증·세션 정보로 서버가 결정한다.
- 클라이언트가 질문 세트 ID나 규칙 버전을 임의로 지정하지 못하게 한다.

---

## 7. 비교 실행 상태 모델

### 7.1 Compare Run 상태

```typescript
export type CompareRunStatus =
  | "RUNNING"
  | "COMPLETED"
  | "PARTIAL"
  | "INSUFFICIENT"
  | "FAILED"
  | "ABORTED";
```

| 상태 | 의미 |
| --- | --- |
| `RUNNING` | 대상 진단 진행 중 |
| `COMPLETED` | 모든 대상 성공 |
| `PARTIAL` | 2개 이상 성공했으나 일부 실패 |
| `INSUFFICIENT` | 성공 대상이 0~1개라 수평 비교 불가능 |
| `FAILED` | 비교 컨텍스트·DB 등 공통 처리 실패 |
| `ABORTED` | 사용자 연결 중단 또는 전체 제한시간 초과 |

### 7.2 Target 상태

```typescript
export type CompareTargetStatus =
  | "QUEUED"
  | "RUNNING"
  | "SUCCESS"
  | "ERROR"
  | "CANCELLED";
```

Target 오류는 다른 Target의 성공을 취소하지 않는다.

### 7.3 최종 상태 계산

```text
성공 수 == 전체 Target 수       → COMPLETED
성공 수 >= 2, 실패 수 >= 1      → PARTIAL
성공 수 < 2                     → INSUFFICIENT
공통 선행 처리 또는 DB 실패     → FAILED
Request Signal 중단             → ABORTED
```

`INSUFFICIENT`는 실행 자체의 HTTP 오류가 아니라 비교 결과 상태다. Target별 오류 정보를 전달하기 위해 정상 JSON 응답으로 반환한다.

---

## 8. 응답 DTO

```typescript
export interface CompareResponse {
  compareRunId: string;
  status: CompareRunStatus;
  context: {
    projectId: string;
    questionSetId: string;
    questionSetVersion: string;
    platformSetVersion: string;
    rulesetVersion: string;
    engineVersion: string;
    comparisonAlgorithmVersion: string;
    startedAt: string;
    completedAt: string;
  };
  targets: CompareTargetResult[];
  summary: CompareSummary | null;
  platforms: PlatformComparison[];
  questions: QuestionComparison[];
  categories: CategoryComparison[];
  findingsDiff: FindingComparison[];
}

export interface CompareTargetResult {
  targetId: string;
  ordinal: number;
  role: "ME" | "COMPETITOR";
  label: string;
  displayUrl: string;
  status: "SUCCESS" | "ERROR" | "CANCELLED";
  auditRunId: string | null;
  auditResultId: string | null;
  metrics: TargetMetrics | null;
  error: {
    code: string;
    message: string;
    retryable: boolean;
  } | null;
}

export interface TargetMetrics {
  citationRate: number;
  brandMentionRate: number;
  averageCitationPosition: number | null;
  citedObservationCount: number;
  mentionedObservationCount: number;
  eligibleObservationCount: number;
  seoScore: number | null;
  geoReadinessScore: number | null;
}
```

### DTO 원칙

- Target는 항상 요청 순서로 반환한다.
- 실패 Target의 `metrics`는 `null`이다.
- 실패를 점수 0으로 변환하지 않는다.
- 내부 Stack Trace, 원본 Query Token, 외부 플랫폼 원문 응답을 노출하지 않는다.
- 수치는 원본 값과 분모를 함께 제공한다.
- UI에서 재계산하지 않고 서버 DTO의 수치를 표시한다.

---

## 9. 지표 계산 규칙

### 9.1 Eligible Observation

비교 가능한 기본 관측 단위는 다음 조합이다.

```text
Question × Platform
```

플랫폼 오류나 실행 제외 항목은 Eligible 분모에서 제외하며, 제외 수를 별도로 추적한다.

### 9.2 Citation Rate

```text
Citation Rate
= 인용된 Eligible Observation 수
  / 전체 Eligible Observation 수
  × 100
```

분모가 0이면 `0`이 아니라 `null` 처리한다.

### 9.3 Brand Mention Rate

```text
Brand Mention Rate
= 브랜드가 언급된 Eligible Observation 수
  / 전체 Eligible Observation 수
  × 100
```

### 9.4 Average Citation Position

실제 인용이 존재하는 Observation만 평균에 포함한다.

```text
Average Citation Position
= 인용 위치 합계 / 인용된 Observation 수
```

인용이 한 번도 없으면 `null`이며 0으로 표시하지 않는다. 이 지표는 값이 낮을수록 우수하다.

### 9.5 정밀도와 반올림

- 서비스 내부 계산은 원본 정밀도를 유지한다.
- API는 최소 소수점 두 자리까지 안정적으로 표현한다.
- UI 표시 단계에서 한 자리 또는 두 자리로 반올림한다.
- 정렬·Winner 계산은 반올림 전 값으로 수행한다.

---

## 10. Winner 및 Gap 규칙

### 10.1 전체 순위

전체 순위는 다음 우선순위로 계산한다.

1. Citation Rate가 높은 대상
2. Brand Mention Rate가 높은 대상
3. Average Citation Position이 낮은 대상
4. 모든 비교값이 같으면 공동 순위

실패 Target은 순위에서 제외한다.

### 10.2 질문별 Winner

각 질문의 모든 플랫폼 관측을 집계한다.

1. Citation Rate가 높은 대상
2. Citation Rate가 같으면 평균 인용 위치가 낮은 대상
3. 동일하면 공동 Winner
4. 어느 대상도 인용되지 않았다면 Winner는 `NONE`

### 10.3 `ME` 대비 Gap

Gap의 부호가 혼동되지 않도록 모든 값은 **양수일수록 해당 경쟁 Target이 `ME`보다 우수**하도록 통일한다.

```text
Citation Gap
= competitorCitationRate - meCitationRate

Brand Mention Gap
= competitorMentionRate - meMentionRate

Position Advantage
= meAveragePosition - competitorAveragePosition
```

인용 위치가 없는 경우 Position Gap은 `null`이다.

---

## 11. 비교 정규화 계층

기존 Audit 결과 구조를 UI에서 직접 읽지 않는다. 서비스 내부에 비교용 Adapter를 둔다.

```typescript
export interface ComparableAuditSnapshot {
  auditRunId: string;
  auditResultId: string;
  target: {
    displayUrl: string;
    label: string;
  };
  versions: {
    questionSetId: string;
    questionSetVersion: string;
    platformSetVersion: string;
    rulesetVersion: string;
    engineVersion: string;
    comparisonAlgorithmVersion: string;
  };
  overall: TargetMetrics;
  platforms: ComparablePlatformMetric[];
  questions: ComparableQuestionMetric[];
  categories: ComparableCategoryMetric[];
  findings: ComparableFinding[];
}
```

```typescript
export async function toComparableAuditSnapshot(
  audit: ExecuteAuditOutput,
  context: CompareExecutionContext,
): Promise<ComparableAuditSnapshot>;
```

### 정규화 원칙

- Platform은 안정적인 `platformId`로 조인한다.
- Question은 `questionId`로 조인한다.
- Category는 표시명이 아니라 `categoryId`로 조인한다.
- Finding은 배열 index가 아니라 `ruleId`로 조인한다.
- 특정 Target에 항목이 없으면 `MISSING` 또는 `NOT_APPLICABLE`로 표현한다.
- 규칙 수가 변경돼도 UI 코드 수정 없이 동작해야 한다.

---

## 12. 백엔드 서비스

### 12.1 파일

```text
lib/services/compare-service.ts
lib/repositories/compare-repository.ts
lib/compare/contracts.ts
lib/compare/metrics.ts
lib/compare/normalize.ts
```

### 12.2 서비스 인터페이스

```typescript
export interface CompareAuditsInput {
  projectId: string;
  targets: Array<{
    role: "ME" | "COMPETITOR";
    url: string;
    label?: string;
  }>;
  actorKey: string;
  signal?: AbortSignal;
}

export async function compareAudits(
  input: CompareAuditsInput,
): Promise<CompareResponse>;
```

### 12.3 순차 실행

이번 버전에서는 `Promise.all()`, `Promise.allSettled()`를 사용하지 않는다.

```typescript
const results: CompareTargetResult[] = [];

for (const [ordinal, target] of input.targets.entries()) {
  if (input.signal?.aborted) {
    await markQueuedTargetsCancelled(compareRunId, ordinal);
    break;
  }

  await repository.markTargetRunning(compareRunId, ordinal);

  try {
    const audit = await executeAudit({
      url: target.url,
      actorKey: input.actorKey,
      comparisonContext,
      signal: input.signal,
    });

    const snapshot = await toComparableAuditSnapshot(
      audit,
      comparisonContext,
    );

    await repository.markTargetSuccess({
      compareRunId,
      ordinal,
      auditRunId: audit.runId,
      auditResultId: audit.auditResultId,
    });

    results.push(toSuccessTarget(target, ordinal, snapshot));
  } catch (error) {
    const domainError = toPublicCompareTargetError(error);

    await repository.markTargetError({
      compareRunId,
      ordinal,
      errorCode: domainError.code,
    });

    results.push(toErrorTarget(target, ordinal, domainError));
  }
}
```

대상별 오류 저장 자체가 실패하면 구조화 로그를 남기되, 원래 Target 오류를 다른 Target에 전파하지 않는다. 공통 DB 연결 실패처럼 비교 전체의 신뢰성을 잃는 오류만 Run 전체를 `FAILED`로 처리한다.

### 12.4 비교 실행 제한

- URL별 기존 Audit Timeout 정책을 재사용한다.
- 전체 비교는 Request의 `AbortSignal`을 전달받는다.
- 연결 중단 시 아직 실행하지 않은 Target을 `CANCELLED`로 표시한다.
- 전체 최대 실행시간 정책을 명시하고 초과 시 `ABORTED` 처리한다.
- API에 Compare 전용 actor/IP Rate Limit를 적용한다.
- 한 사용자가 동시에 여러 Compare Run을 무제한 시작하지 못하게 한다.

Cloudflare Workers에는 요청당 동시에 응답 헤더를 기다릴 수 있는 외부 연결 수 제한이 있으며, URL별 Audit 내부에서도 복수 외부 연결을 사용할 수 있다. 따라서 URL 수준 병렬화는 별도의 부하 검증과 승인 없이는 도입하지 않는다.

---

## 13. 캐시와 공정성 정책

기존 `executeAudit()`의 캐시·`audit_runs` 정책을 유지한다.

- 캐시 HIT여도 URL별 `audit_runs`는 새로 생성한다.
- Cache Key에는 규칙·엔진 및 진단 입력 버전이 포함되어야 한다.
- 비교 Context의 질문 세트·플랫폼 버전과 다른 결과는 재사용하지 않는다.
- 실패 결과는 캐시하지 않는다.
- 캐시 HIT와 MISS 여부는 Target별로 기록할 수 있지만 승패 계산에는 영향을 주지 않는다.

AI 플랫폼 응답처럼 시간에 민감한 데이터가 포함될 경우 다음 중 프로젝트의 기존 정책을 명시적으로 적용한다.

1. 비교 실행에서는 해당 관측만 Fresh 실행한다.
2. 동일한 Freshness Window 안의 결과만 재사용한다.

서로 다른 관측 시점의 오래된 결과를 단순히 혼합하지 않는다.

---

## 14. 비교 실행 이력 저장

비교 실행을 추적하기 위해 최소한 `compare_runs`, `compare_targets` 두 테이블을 추가한다. 전체 비교 JSON Blob은 저장하지 않고 기존 Audit Result에서 재구성한다. 재조회 시 계산 결과가 달라지지 않도록 `comparison_algorithm_version`을 저장하고 이미 발행된 계산 버전의 하위 호환성을 유지한다.

계산 공식을 변경할 때는 기존 버전을 덮어쓰지 않고 새 `comparisonAlgorithmVersion`을 발행한다. 과거 계산을 더 이상 동일하게 재현할 수 있는 규모의 변경이라면, 제한된 크기의 계산 Snapshot 또는 별도 Snapshot 테이블을 도입하는 후속 Migration을 설계한다.

### 14.1 `compare_runs`

```text
id
actor_key
project_id
question_set_id
question_set_version
platform_set_version
ruleset_version
engine_version
comparison_algorithm_version
status
target_count
success_count
failure_count
started_at
completed_at
```

필수 제약:

```text
CHECK target_count BETWEEN 2 AND 5
CHECK success_count >= 0
CHECK failure_count >= 0
INDEX(actor_key, started_at, id)
INDEX(project_id, started_at, id)
```

### 14.2 `compare_targets`

```text
id
compare_run_id FK -> compare_runs.id ON DELETE CASCADE
ordinal
role
label
requested_url       -- 안전하게 마스킹된 URL
status
audit_run_id        -- nullable, ON DELETE SET NULL
audit_result_id     -- nullable, ON DELETE SET NULL
error_code          -- nullable
started_at          -- nullable
completed_at        -- nullable
```

필수 제약:

```text
UNIQUE(compare_run_id, ordinal)
CHECK ordinal BETWEEN 0 AND 4
CHECK role IN ('ME', 'COMPETITOR')
CHECK status IN ('QUEUED', 'RUNNING', 'SUCCESS', 'ERROR', 'CANCELLED')
INDEX(compare_run_id, ordinal)
INDEX(audit_run_id)
INDEX(audit_result_id)
```

### 14.3 중단 실행 정리

예상 최대 실행시간을 크게 초과한 `RUNNING` 상태는 조회 또는 관리 작업에서 `ABORTED`로 정리한다. 자동 정리 기준시간은 운영 Timeout 정책보다 충분히 길게 설정한다.

---

## 15. API 설계

### 15.1 비교 실행

```http
POST /api/compare
Content-Type: application/json
```

성공 또는 부분 성공:

```http
200 OK
```

이번 버전은 동기식 API다. 모든 URL을 순차 처리한 후 최종 DTO를 반환한다. 비동기 작업·Polling·SSE는 이번 범위에서 제외한다.

### 15.2 비교 결과 재조회

```http
GET /api/compare/{compareRunId}
```

- 기존 Audit Result를 이용해 CompareResponse를 재구성한다.
- 현재 `actorKey`가 소유하거나 접근 가능한 Run만 반환한다.
- 존재하지 않거나 접근할 수 없으면 `404`로 통일해 소유 여부를 노출하지 않는다.
- `RUNNING` 상태가 비정상적으로 오래됐으면 `ABORTED` 정리 규칙을 적용한다.

### 15.3 오류 코드

| HTTP | 코드 | 의미 |
| ---: | --- | --- |
| 400 | `INVALID_COMPARE_REQUEST` | Body 형식 오류 |
| 400 | `INVALID_TARGET_COUNT` | 2~5개 범위 위반 |
| 400 | `INVALID_TARGET_ROLES` | ME·경쟁사 구성 오류 |
| 400 | `DUPLICATE_TARGET` | 정규화 URL 중복 |
| 403 | `PROJECT_ACCESS_DENIED` | 프로젝트 접근 불가 |
| 404 | `PROJECT_NOT_FOUND` | 프로젝트 또는 질문 세트 없음 |
| 409 | `QUESTION_SET_NOT_READY` | 활성 질문 세트 미확정 |
| 429 | `COMPARE_RATE_LIMITED` | 비교 실행 제한 초과 |
| 500 | `COMPARE_INITIALIZATION_FAILED` | Run 초기화 실패 |
| 500 | `COMPARE_FINALIZATION_FAILED` | 결과 확정 실패 |

개별 URL 오류는 HTTP 전체 오류로 올리지 않고 `targets[].error`에 담는다.

---

## 16. UI 정보 구조

### 16.1 라우팅

```text
app/compare/page.tsx
```

기존 단일 진단 화면은 유지한다. `app/page.tsx`는 Compare 진입 링크 또는 공통 내비게이션만 추가한다. Single·Compare 전체를 하나의 거대한 조건부 컴포넌트로 합치지 않는다.

### 16.2 페이지 구성

```text
1. Compare 페이지 헤더
2. URL 입력 폼
3. 실행 상태·부분 실패 안내
4. 핵심 경쟁력 Scoreboard
5. 플랫폼별 비교
6. 질문별 Winner·Gap
7. SEO/GEO 기술 진단
   ├─ 종합 Score
   ├─ 카테고리 Matrix
   └─ Findings Diff
```

### 16.3 입력 폼

- 첫 입력은 `내 사이트`로 고정한다.
- 경쟁사 입력은 1개를 기본 제공한다.
- 경쟁사는 최대 4개까지 추가할 수 있다.
- 경쟁사 제거 시 최소 1개는 유지한다.
- 정규화 중복 URL을 제출 전에 안내한다.
- URL별 Label을 선택적으로 입력할 수 있다.
- Submit 중 중복 제출을 방지한다.
- 입력값은 오류 후에도 유지한다.
- actorKey나 내부 버전값은 Form에 넣지 않는다.

### 16.4 로딩 상태

이번 버전 API는 최종 응답형이므로 실제 Target별 진행률을 추측해 표시하지 않는다.

- 전체 진행 상태를 표시한다.
- Target 개수만큼 Skeleton Column을 먼저 렌더링한다.
- “최대 5개 사이트를 순차 진단 중”이라는 실행 방식을 안내한다.
- 실시간 Target 진행률이 필요한 경우 차기 SSE·비동기 작업으로 분리한다.

---

## 17. 핵심 Scoreboard

각 Target Column에는 다음을 표시한다.

```text
Label
Role Badge (ME / Competitor)
Display URL
Citation Rate
Brand Mention Rate
Average Citation Position
SEO Score (보조)
GEO Readiness Score (보조)
```

### 표시 원칙

- `ME` Column은 색상·Border·Badge로 명확히 구분한다.
- Citation·Mention은 높은 값이 우수하다고 표시한다.
- Citation Position은 낮은 값이 우수하다고 명시한다.
- `null`은 `—` 또는 “인용 없음”으로 표시한다.
- 실패 Target은 점수 카드를 숨기고 오류 카드와 재시도 안내를 표시한다.
- 단순 색상만으로 우열을 표현하지 않고 숫자·라벨·아이콘을 함께 사용한다.

---

## 18. 플랫폼·질문 비교

### 18.1 플랫폼별 비교

각 플랫폼 행에서 Target별 다음 값을 비교한다.

```text
Citation Rate
Brand Mention Rate
Average Citation Position
Eligible / Error Count
```

플랫폼 ID로 정렬하고 UI Label은 메타데이터에서 가져온다.

### 18.2 질문별 Winner·Gap

질문 행에는 다음을 표시한다.

```text
Question Label
Winner
ME 결과
경쟁사별 Citation·Mention·Position
ME 대비 Gap
```

- 질문 원문 노출 정책이 제한된 경우 안전한 Label만 사용한다.
- 공동 Winner를 지원한다.
- 모두 미인용이면 `Winner 없음`으로 표시한다.
- 5개 Target에서 폭이 부족할 경우 가로 스크롤을 사용한다.

---

## 19. 카테고리 및 Findings Diff

### 19.1 카테고리 Matrix

카테고리는 `categoryId` 기준으로 정렬하고 다음 값을 제공한다.

```text
score
maxScore
achievementRate
deltaFromMe
```

```text
achievementRate = score / maxScore × 100
```

`maxScore=0`이면 `null` 처리한다.

### 19.2 Findings Diff

Finding은 `ruleId` 기준으로 조인한다.

```typescript
type CompareFindingStatus =
  | "PASS"
  | "WARN"
  | "FAIL"
  | "NOT_APPLICABLE"
  | "MISSING"
  | "ERROR";
```

| 상태 | 표시 |
| --- | --- |
| PASS | 녹색 + 체크 + PASS 텍스트 |
| WARN | 황갈색 + 경고 아이콘 + WARN 텍스트 |
| FAIL | 적색 + 실패 아이콘 + FAIL 텍스트 |
| NOT_APPLICABLE | 회색 + N/A |
| MISSING | 회색 + 데이터 없음 |
| ERROR | 진단 실패 표시 |

색상만으로 상태를 전달하지 않는다.

---

## 20. 반응형·접근성 기준

### Desktop

- `ME` 또는 Metric Column을 Sticky 처리한다.
- 2~3개 Target은 화면 폭에 맞춰 표시한다.
- 4~5개 Target은 Column 폭을 과도하게 줄이지 않고 가로 스크롤을 허용한다.
- Header와 Matrix Body의 Column 폭이 항상 일치해야 한다.

### Mobile

- 기본 Viewport 검증: `390×844`
- 핵심 Score는 Target별 Stacked Card로 우선 표시한다.
- Matrix는 Sticky 첫 열과 가로 스크롤을 사용한다.
- Target 선택 Chip으로 특정 2개만 집중 비교할 수 있게 할 수 있으나 전체 결과를 숨기지 않는다.
- 터치 영역은 충분한 크기를 확보한다.

### Accessibility

- Form Label을 Placeholder로 대체하지 않는다.
- 오류 메시지는 해당 입력과 `aria-describedby`로 연결한다.
- Tab 순서가 URL 입력 순서와 일치해야 한다.
- Loading 상태는 `aria-live`로 알린다.
- PASS·WARN·FAIL은 텍스트를 함께 제공한다.
- 색 대비와 Focus Ring을 확인한다.

---

## 21. 컴포넌트 설계

```text
app/compare/page.tsx
components/compare/CompareForm.tsx
components/compare/CompareTargetInput.tsx
components/compare/CompareLoadingState.tsx
components/compare/CompareErrorSummary.tsx
components/compare/Scoreboard.tsx
components/compare/PlatformMatrix.tsx
components/compare/QuestionWinnerMatrix.tsx
components/compare/CategoryMatrix.tsx
components/compare/FindingsDiffMatrix.tsx
components/compare/TargetHeader.tsx
components/compare/StatusCell.tsx
```

### 컴포넌트 원칙

- `page.tsx`는 데이터 요청과 화면 상태 조정만 담당한다.
- 계산 로직은 React 컴포넌트에 넣지 않는다.
- Matrix는 공통 Column 정의를 공유한다.
- 배열 index를 React Key로 사용하지 않는다.
- `targetId`, `platformId`, `questionId`, `categoryId`, `ruleId`를 Key로 사용한다.
- 오류 Target을 제거하지 않고 원래 Column 위치를 유지한다.

---

## 22. 오류 및 재시도 UX

부분 실패 시 화면 상단에 다음을 표시한다.

```text
5개 중 4개 사이트 분석 완료
1개 사이트는 응답 시간이 초과되어 비교에서 제외되었습니다.
```

Target 오류 카드에는 다음을 표시한다.

- 안전한 Display URL
- 사용자 친화적 오류 메시지
- 재시도 가능 여부
- 다시 입력하거나 전체 비교를 재실행하는 동작

개별 Target만 재시도하여 기존 비교 Run을 수정하는 기능은 이번 버전에서 제외한다. 재시도는 동일 입력으로 새 Compare Run을 생성한다. 과거 비교 결과를 덮어쓰지 않는다.

---

## 23. 보안 및 비용 통제

- 모든 URL은 기존 SSRF·Redirect 재검증 정책을 통과해야 한다.
- DB에는 민감 Query가 마스킹된 URL만 저장한다.
- `actorKey`는 서버에서 생성한다.
- 프로젝트와 Compare Run 소유권을 서버에서 검증한다.
- Compare API에 사용자·IP 기준 Rate Limit를 적용한다.
- 동시 Compare Run 수를 제한한다.
- Target 수를 서버에서 다시 5개로 제한한다.
- Target 오류에 외부 응답 원문과 Stack Trace를 포함하지 않는다.
- 비교 실행 로그에 원본 질문·원본 URL Query·외부 플랫폼 응답 전문을 남기지 않는다.

---

## 24. 변경 파일 목록

### Backend·Contract

| 상태 | 파일 | 내용 |
| --- | --- | --- |
| NEW | `lib/compare/contracts.ts` | Request·Response·상태 타입 |
| NEW | `lib/compare/metrics.ts` | Rate·Position·Winner·Gap 계산 |
| NEW | `lib/compare/normalize.ts` | Audit → Comparable Snapshot 변환 |
| NEW | `lib/services/compare-service.ts` | 순차 실행·부분 실패·최종 DTO |
| NEW | `lib/repositories/compare-repository.ts` | Compare Run·Target 저장·조회 |
| MODIFY | `lib/services/audit-service.ts` | Compare Context·AbortSignal 전달 지원 |
| MODIFY | `wrangler.jsonc` | Compare API Rate Limit binding과 환경별 한도 설정 |

### Database

| 상태 | 파일 | 내용 |
| --- | --- | --- |
| MODIFY | `db/schema.ts` | `compare_runs`, `compare_targets` 추가 |
| GENERATED | `drizzle/*.sql` | 비교 이력 Migration |

### API

| 상태 | 파일 | 내용 |
| --- | --- | --- |
| NEW | `app/api/compare/route.ts` | POST Compare 실행 |
| NEW | `app/api/compare/[id]/route.ts` | GET Compare 결과 재조회 |

### UI

| 상태 | 파일 | 내용 |
| --- | --- | --- |
| NEW | `app/compare/page.tsx` | Compare 전용 화면 |
| MODIFY | `app/page.tsx` | Compare 진입 링크 또는 공통 내비게이션 |
| NEW | `components/compare/*` | Form·Score·Matrix 컴포넌트 |
| MODIFY | `app/globals.css` | 공통 Token 보완에 한해 수정 |
| NEW | `app/compare/compare.module.css` | Matrix·Responsive 스타일 |

### Tests

| 상태 | 파일 | 내용 |
| --- | --- | --- |
| NEW | `tests/v2/compare-service.test.ts` | 순차 실행·집계·부분 실패 |
| NEW | `tests/v2/compare-metrics.test.ts` | 지표·Winner·Gap 계산 |
| NEW | `tests/v2/compare-repository.test.ts` | D1 저장·상태 전이·소유 범위 |
| NEW | `tests/v2/compare-api.test.ts` | POST·GET API 통합 |
| NEW | `tests/v2/compare-security.test.ts` | SSRF·권한·Rate Limit |
| NEW | 브라우저 QA 시나리오 | Desktop·Mobile·Keyboard·Overflow |

로컬 Windows `file:///` 링크는 구현 문서에서 제거하고 프로젝트 상대 경로를 사용한다.

---

## 25. 테스트 계획

### 25.1 입력 검증

1. Target 1개 거절
2. Target 6개 거절
3. ME 0개 거절
4. ME 2개 거절
5. 첫 Target이 Competitor이면 거절
6. 정규화 후 동일 URL 중복 거절
7. 동일 Origin의 다른 Path 허용
8. 잘못된 URL과 허용하지 않는 Protocol 거절
9. Client actorKey 주입 불가

### 25.2 실행 순서·부분 실패

1. `executeAudit()` 호출 순서가 입력 순서와 동일
2. 동시에 두 URL Audit를 시작하지 않음
3. 두 Target 모두 성공 → `COMPLETED`
4. 3개 중 2개 성공 → `PARTIAL`
5. 3개 중 1개 성공 → `INSUFFICIENT`
6. 전체 Target 실패 → `INSUFFICIENT`
7. 공통 Context 생성 실패 → `FAILED`
8. AbortSignal 중단 → 남은 Target `CANCELLED`, Run `ABORTED`
9. 성공 Target 결과가 실패 Target 때문에 삭제되지 않음

### 25.3 비교 계산

1. Citation Rate 분모·분자 계산
2. Brand Mention Rate 계산
3. Citation이 없을 때 평균 Position `null`
4. 실패 관측이 Eligible 분모에서 처리되는 방식 검증
5. 반올림 전 값으로 정렬
6. 공동 Winner 처리
7. 모든 Target 미인용 시 Winner 없음
8. Citation·Mention Gap 부호
9. Position Advantage 부호
10. 실패 Target 순위 제외

### 25.4 정규화·Version

1. Platform ID 기준 조인
2. Question ID 기준 조인
3. Category ID 기준 조인
4. Rule ID 기준 조인
5. 규칙 배열 순서가 달라도 동일 Matrix 생성
6. 없는 규칙 `MISSING`
7. 비적용 규칙 `NOT_APPLICABLE`
8. 질문 세트 버전 불일치 결과 재사용 차단
9. 플랫폼 버전 불일치 결과 재사용 차단

### 25.5 Repository·D1

1. Compare Run과 Target 초기화
2. Target 상태 `QUEUED → RUNNING → SUCCESS`
3. Target 상태 `QUEUED → RUNNING → ERROR`
4. Audit Run·Result FK 연결
5. Compare 삭제 시 Target CASCADE
6. Audit 삭제 시 Compare Target FK `SET NULL`
7. actorKey별 조회 격리
8. 오래된 RUNNING 상태 ABORTED 정리
9. 최종 success·failure count 일치

### 25.6 API

1. 정상 2개 URL POST
2. 정상 5개 URL POST
3. 부분 성공 응답
4. 비교 불충분 응답
5. GET 재조회와 POST 응답의 계산 결과 일치
6. 다른 actorKey Run 조회 차단
7. 내부 오류·민감 URL 비노출
8. Compare Rate Limit 429

### 25.7 브라우저 QA

Desktop:

- 2개 Target 비교
- 5개 Target 가로 스크롤
- Header·Body Column 정렬
- ME 강조
- 부분 실패 Error Column 유지
- Platform·Question·Category·Finding Section 이동

Mobile `390×844`:

- 입력 추가·삭제
- Submit 버튼 접근
- Score Card Stack
- Matrix Sticky Column
- 가로 스크롤과 페이지 전체 가로 넘침 구분

Accessibility:

- 키보드만으로 입력·추가·삭제·Submit 가능
- Focus 표시
- Screen Reader Label
- Loading `aria-live`
- 색상을 제외해도 PASS·WARN·FAIL 구분 가능

---

## 26. 검증 명령

```bash
npm test
npm run typecheck
npm run lint
npm run build
npx vinext check
```

테스트 개수를 `50+`처럼 문서에 고정하지 않는다. 완료 기준은 다음과 같다.

```text
기존 및 신규 테스트 전체 통과
실패 0건
의도하지 않은 Skip 0건
TypeScript 오류 0건
Lint 오류 0건
Production Build 성공
```

브라우저 QA는 로컬 개발 서버에서 실행하되 특정 내부 Agent 이름을 완료 조건으로 삼지 않는다. 브라우저 자동화 또는 수동 검증으로 동일한 시나리오와 증거를 재현할 수 있어야 한다.

---

## 27. 구현 순서

### 1단계: Contract·Metrics

1. Compare Request·Response 타입
2. 지표 계산 함수
3. Winner·Gap 함수
4. Audit 정규화 Adapter
5. 순수 함수 단위 테스트

### 2단계: DB·Repository

1. Compare Run·Target 스키마
2. Migration 생성·검토
3. 상태 전이 Repository
4. actorKey 범위 조회
5. D1 통합 테스트

### 3단계: Service·API

1. 프로젝트 질문 Snapshot
2. Target 검증
3. 순차 Audit 실행
4. 부분 실패와 Abort 처리
5. Compare DTO 집계
6. POST·GET Route
7. API 통합 테스트

### 4단계: UI

1. `/compare` 입력 화면
2. Loading·Error Summary
3. 핵심 Scoreboard
4. Platform Matrix
5. Question Winner Matrix
6. Category Matrix
7. Findings Diff
8. Responsive·Accessibility

### 5단계: QA·배포

1. 2개·5개·부분 실패 시나리오
2. Mobile·Keyboard QA
3. Typecheck·Lint·Build
4. Migration과 Sites 배포 아티팩트 검토

---

## 28. 완료 기준

- [ ] 비교 대상이 `ME` 1개와 Competitor 1~4개로 제한된다.
- [ ] 2~5개 URL 검증이 Client·Server 모두 적용된다.
- [ ] 정규화 중복 URL이 차단된다.
- [ ] 프로젝트 질문·플랫폼·규칙 Version이 비교 시작 시 고정된다.
- [ ] `comparisonAlgorithmVersion`이 저장되며 과거 Run 재조회 시 동일한 계산 결과가 재현된다.
- [ ] URL별 Audit가 입력 순서대로 순차 실행된다.
- [ ] 일부 URL 실패 시 성공 결과가 유지된다.
- [ ] 실패 Target이 0점으로 계산되지 않는다.
- [ ] Citation·Mention·Position 공식과 분모가 명시대로 계산된다.
- [ ] Platform·Question·Category·Finding이 안정적인 ID로 정렬된다.
- [ ] 질문별 Winner·공동 Winner·Winner 없음이 구분된다.
- [ ] `ME` 대비 Gap 부호가 일관된다.
- [ ] Compare Run과 Target 상태가 D1에 추적된다.
- [ ] actorKey는 서버가 결정하고 Compare 조회가 소유 범위로 제한된다.
- [ ] `/compare`가 단일 진단 페이지와 독립적으로 동작한다.
- [ ] 5개 Target에서 Header와 Matrix가 깨지지 않는다.
- [ ] Mobile `390×844`에서 페이지 전체 Overflow 없이 Matrix 스크롤이 가능하다.
- [ ] PASS·WARN·FAIL이 색상 외 텍스트·아이콘으로도 구분된다.
- [ ] 기존 및 신규 테스트 실패·의도하지 않은 Skip이 0건이다.
- [ ] Typecheck·Lint·Build·vinext check가 성공한다.

---

## 29. 참고 문서

- `citegraph-url-comparison-spec.md`
- `CiteGraph_Backend_Implementation_Plan_v3.md`
- [Cloudflare Workers Limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare Workers Wrangler Configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Cloudflare Workers Vitest Recipes](https://developers.cloudflare.com/workers/testing/vitest-integration/recipes/)
- [Cloudflare Rate Limiting API](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
- [vinext 공식 저장소](https://github.com/cloudflare/vinext)
