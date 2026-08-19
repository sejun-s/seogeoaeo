# CiteGraph 백엔드 구축 계획서 v3

> Cloudflare D1 + Drizzle ORM 최종 구현 기준안  
> 대상 프로젝트: `seogeoaeo` / CiteGraph  
> 문서 상태: 구현 승인안  
> 작성 기준일: 2026-08-18

---

## 1. 개요

CiteGraph의 웹 진단 엔진과 UI를 지속성 백엔드에 연결한다. 백엔드는 기존 `vinext` 기반 Vite·Cloudflare Workers 런타임과 호환되는 **Cloudflare D1 + Drizzle ORM**으로 구축한다.

이번 구축의 핵심은 단순한 진단 결과 저장이 아니라 다음 요구사항을 동시에 충족하는 것이다.

1. 동일한 진단 입력과 동일한 규칙 버전에 대해 결과를 중복 계산·저장하지 않는다.
2. 캐시된 결과를 재사용하더라도 사용자의 실제 실행 이력은 매번 남긴다.
3. 진단 결과와 하위 점수·판정·근거 데이터는 원자적으로 저장한다.
4. 동시 요청이 같은 캐시 키를 생성해도 결과가 중복되거나 외래키 오류가 발생하지 않는다.
5. 실패한 진단도 결과 테이블과 분리하여 실행 이력에 기록한다.
6. SSRF, Redirect 우회, 과도한 응답 크기와 민감 URL 저장을 방지한다.
7. Cloudflare Workers 런타임과 D1 바인딩을 사용하는 통합 테스트로 검증한다.

---

## 2. 결정 사항

### 2.1 기술 스택

| 구분 | 채택 기술 | 용도 |
| --- | --- | --- |
| 웹 프레임워크 | vinext | Next.js 호환 App Router 및 Route Handler |
| 런타임 | Cloudflare Workers | 서버 실행 환경 |
| 데이터베이스 | Cloudflare D1 | 진단 결과·실행 이력 영속 저장 |
| ORM | Drizzle ORM | 스키마·쿼리 타입 안전성 |
| 마이그레이션 | Drizzle Kit + D1 migrations | SQL 생성 및 환경별 적용 |
| 테스트 | Vitest + Cloudflare Workers 통합 | workerd·Miniflare·D1 바인딩 검증 |
| 기본 운영 배포 | ChatGPT Sites | 사이트 버전 저장 및 운영 배포 |

### 2.2 운영 배포 기준

기본 운영 배포 대상은 **ChatGPT Sites**로 한다.

- `.openai/hosting.json`은 Sites 프로젝트 및 D1 바인딩 이름을 선언한다.
- `wrangler.jsonc`는 로컬 D1 시뮬레이션, 타입 생성, 테스트 및 별도의 Cloudflare Workers 직접 배포에 사용한다.
- `wrangler d1 migrations apply DB --remote`는 Sites의 D1을 대상으로 한다고 가정하지 않는다.
- 직접 Cloudflare Workers에 배포하는 경우에만 명시적으로 Cloudflare 계정의 원격 D1 마이그레이션을 실행한다.

두 운영 경로를 동시에 사용하면 서로 다른 D1 데이터베이스가 만들어질 수 있으므로 배포 대상과 마이그레이션 대상을 혼동하지 않아야 한다.

---

## 3. 전체 아키텍처

```text
[POST /api/audits]
        │
        ▼
validateAndNormalizeUrl()
        │
        ▼
fetchAuditDocument()
        │
        ├─ Redirect 목적지 재검증
        ├─ Timeout / 크기 / Content-Type 검사
        └─ HTTP 상태·선택 헤더 수집
        │
        ▼
calculateHtmlHash() + calculateInputHash()
        │
        ▼
findCachedResult()
        │
        ├─ HIT ──> audit_runs만 저장
        │
        └─ MISS ─> evaluateAuditRules()
                       │
                       ▼
                 db.batch() 원자적 저장
                 result + scores + findings
                 + evidence + run
                       │
                       └─ 동시 UNIQUE 충돌 시
                          기존 결과 재조회 후 run만 저장
```

---

## 4. 환경 설정 및 바인딩

### 4.1 `.openai/hosting.json`

Sites 운영 바인딩을 선언한다. `project_id`는 Sites가 프로젝트를 프로비저닝한 뒤 생성한 실제 값을 사용하며 임의로 만들지 않는다.

```json
{
  "project_id": "<SITES_PROJECT_ID>",
  "d1": "DB",
  "r2": null
}
```

프로비저닝 전이라면 `project_id`를 생략할 수 있다. 비밀값이나 Cloudflare API 토큰은 이 파일에 저장하지 않는다.

### 4.2 `wrangler.jsonc`

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "citegraph",
  "compatibility_date": "<APPROVED_COMPATIBILITY_DATE>",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "citegraph-d1",
      "database_id": "<CLOUDFLARE_D1_DATABASE_ID>",
      "migrations_dir": "drizzle"
    }
  ]
}
```

`compatibility_date`와 `database_id`는 실제 프로젝트 환경을 확인한 뒤 확정한다.

### 4.3 `vite.config.ts`

vinext의 RSC·SSR 환경이 workerd에서 실행되도록 Cloudflare Vite 플러그인을 설정한다. 기존 설정이 있다면 중복 플러그인을 추가하지 않고 병합한다.

```typescript
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import vinext from "vinext";

export default defineConfig({
  plugins: [
    vinext(),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
```

### 4.4 런타임 타입과 DB 헬퍼

`wrangler types`로 `worker-configuration.d.ts`를 생성한다. 서비스와 Route Handler가 런타임 바인딩 구현에 직접 결합되지 않도록 DB 생성 함수와 런타임 접근 함수를 분리한다.

```typescript
// lib/db/index.ts
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../../db/schema";

export function createDb(binding: D1Database) {
  return drizzle(binding, { schema });
}

export function getDb() {
  return createDb(env.DB);
}

export type CiteGraphDb = ReturnType<typeof createDb>;
```

테스트에서는 `createDb(testEnv.DB)`와 같이 D1 바인딩을 주입한다.

### 4.5 Drizzle 설정

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
});
```

생성된 `drizzle/*.sql`은 반드시 버전 관리에 포함하고 사람이 검토한다.

### 4.6 패키지 스크립트

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:check": "drizzle-kit check",
    "db:migrate:local": "wrangler d1 migrations apply DB --local",
    "db:migrate:cloudflare": "wrangler d1 migrations apply DB --remote",
    "cf:typegen": "wrangler types"
  }
}
```

`db:migrate:cloudflare`는 직접 Cloudflare Workers 배포를 승인한 경우에만 실행한다.

---

## 5. 데이터 모델

### 5.1 관계 구조

```text
audit_runs (N) ─────> (0..1) audit_results
                                  │
                                  ├──> (N) audit_scores
                                  │
                                  └──> (N) audit_findings ──> (N) audit_evidence
```

- `audit_results`: 캐시 가능한 결정론적 진단 결과
- `audit_runs`: 성공·실패를 포함한 실제 실행 이력
- `audit_scores`: SEO·GEO 카테고리별 점수
- `audit_findings`: 규칙별 PASS·WARN·FAIL 판정
- `audit_evidence`: 판정의 근거 데이터

### 5.2 스키마 구현 기준

```typescript
// db/schema.ts
import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const auditResults = sqliteTable(
  "audit_results",
  {
    id: text("id").primaryKey(),

    // 민감 파라미터와 userinfo를 제거·마스킹한 저장용 URL
    normalizedUrl: text("normalized_url").notNull(),
    finalUrl: text("final_url").notNull(),

    rulesetVersion: text("ruleset_version").notNull(),
    engineVersion: text("engine_version").notNull(),

    htmlHash: text("html_hash").notNull(),
    inputHash: text("input_hash").notNull(),

    status: text("status", {
      enum: ["SUCCESS", "PARTIAL"],
    }).notNull(),

    httpStatus: integer("http_status").notNull(),
    evaluationDurationMs: integer("evaluation_duration_ms").notNull(),

    seoScore: integer("seo_score").notNull(),
    geoScore: integer("geo_score").notNull(),

    extractedJson: text("extracted_json").notNull(),
    extractedTruncated: integer("extracted_truncated", {
      mode: "boolean",
    }).notNull(),
    extractedBytes: integer("extracted_bytes").notNull(),

    createdAt: integer("created_at", {
      mode: "timestamp_ms",
    }).notNull(),
  },
  (t) => [
    uniqueIndex("ux_audit_results_cache").on(
      t.normalizedUrl,
      t.rulesetVersion,
      t.engineVersion,
      t.inputHash,
    ),
    index("idx_audit_results_url_created").on(
      t.normalizedUrl,
      t.createdAt,
    ),
    index("idx_audit_results_created").on(t.createdAt),
    check(
      "ck_audit_results_status",
      sql`${t.status} IN ('SUCCESS', 'PARTIAL')`,
    ),
    check(
      "ck_audit_results_scores",
      sql`${t.seoScore} BETWEEN 0 AND 100 AND ${t.geoScore} BETWEEN 0 AND 100`,
    ),
  ],
);

export const auditScores = sqliteTable(
  "audit_scores",
  {
    id: text("id").primaryKey(),
    auditResultId: text("audit_result_id")
      .notNull()
      .references(() => auditResults.id, { onDelete: "cascade" }),
    scoreType: text("score_type", {
      enum: ["SEO", "GEO"],
    }).notNull(),
    categoryName: text("category_name").notNull(),
    score: real("score").notNull(),
    maxScore: real("max_score").notNull(),
  },
  (t) => [
    uniqueIndex("ux_audit_scores_category").on(
      t.auditResultId,
      t.scoreType,
      t.categoryName,
    ),
    index("idx_audit_scores_result").on(t.auditResultId),
    check(
      "ck_audit_scores_type",
      sql`${t.scoreType} IN ('SEO', 'GEO')`,
    ),
    check(
      "ck_audit_scores_range",
      sql`${t.maxScore} > 0 AND ${t.score} >= 0 AND ${t.score} <= ${t.maxScore}`,
    ),
  ],
);

export const auditFindings = sqliteTable(
  "audit_findings",
  {
    id: text("id").primaryKey(),
    auditResultId: text("audit_result_id")
      .notNull()
      .references(() => auditResults.id, { onDelete: "cascade" }),
    ruleId: text("rule_id").notNull(),
    scoreType: text("score_type", {
      enum: ["SEO", "GEO"],
    }).notNull(),
    category: text("category").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    weight: integer("weight").notNull(),
    result: text("result", {
      enum: ["PASS", "WARN", "FAIL"],
    }).notNull(),
    recommendation: text("recommendation").notNull(),
  },
  (t) => [
    uniqueIndex("ux_audit_findings_rule").on(
      t.auditResultId,
      t.ruleId,
    ),
    index("idx_audit_findings_result").on(t.auditResultId),
    index("idx_audit_findings_rule").on(t.ruleId),
    check(
      "ck_audit_findings_score_type",
      sql`${t.scoreType} IN ('SEO', 'GEO')`,
    ),
    check(
      "ck_audit_findings_result",
      sql`${t.result} IN ('PASS', 'WARN', 'FAIL')`,
    ),
    check("ck_audit_findings_weight", sql`${t.weight} >= 0`),
  ],
);

export const auditEvidence = sqliteTable(
  "audit_evidence",
  {
    id: text("id").primaryKey(),
    findingId: text("finding_id")
      .notNull()
      .references(() => auditFindings.id, { onDelete: "cascade" }),
    evidenceCode: text("evidence_code").notNull(),
    field: text("field").notNull(),
    excerpt: text("excerpt").notNull(),
  },
  (t) => [
    uniqueIndex("ux_audit_evidence_item").on(
      t.findingId,
      t.evidenceCode,
      t.field,
    ),
    index("idx_audit_evidence_finding").on(t.findingId),
  ],
);

export const auditRuns = sqliteTable(
  "audit_runs",
  {
    id: text("id").primaryKey(),

    // Fetch·검증 단계 실패 시 결과가 없으므로 nullable이다.
    auditResultId: text("audit_result_id").references(
      () => auditResults.id,
      { onDelete: "set null" },
    ),

    // 원본 URL이 아니라 마스킹·정규화된 저장용 URL이다.
    requestedUrl: text("requested_url").notNull(),

    // 로그인 또는 세션 기반 소유 범위 식별자. 원본 이메일은 저장하지 않는다.
    actorKey: text("actor_key"),

    status: text("status", {
      enum: ["SUCCESS", "FAILED"],
    }).notNull(),
    cacheHit: integer("cache_hit", { mode: "boolean" }).notNull(),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    durationMs: integer("duration_ms").notNull(),
    requestedAt: integer("requested_at", {
      mode: "timestamp_ms",
    }).notNull(),
  },
  (t) => [
    index("idx_audit_runs_result").on(t.auditResultId),
    index("idx_audit_runs_cursor").on(t.requestedAt, t.id),
    index("idx_audit_runs_actor_cursor").on(
      t.actorKey,
      t.requestedAt,
      t.id,
    ),
    check(
      "ck_audit_runs_status",
      sql`${t.status} IN ('SUCCESS', 'FAILED')`,
    ),
  ],
);
```

### 5.3 ID 정책

- `audit_results.id`: UUID v4 또는 ULID를 사용한다.
- `audit_runs.id`: 실행마다 새로운 UUID v4 또는 ULID를 사용한다.
- 하위 테이블 ID는 평가 결과를 DB 모델로 변환하는 시점에 모두 생성한다.
- 캐시 멱등성은 ID가 아니라 `ux_audit_results_cache`가 보장한다.
- 특정 ID 방식을 선택하면 프로젝트 전체에서 혼용하지 않는다.

### 5.4 실패 데이터 정책

- `audit_results`에는 `SUCCESS`와 `PARTIAL`만 저장한다.
- URL 검증·Fetch·평가·저장 실패는 `audit_runs.status=FAILED`로 기록한다.
- 실패 실행의 `audit_result_id`는 `NULL`일 수 있다.
- 일시적인 네트워크 실패나 타임아웃은 결과 캐시에 저장하지 않는다.
- 사용자 응답에는 내부 Stack Trace나 SQL 오류 전문을 노출하지 않는다.

---

## 6. URL 정규화와 진단 입력 해시

### 6.1 URL 표현 분리

하나의 URL을 다음 세 가지 표현으로 분리한다.

| 표현 | 용도 | 저장 여부 |
| --- | --- | --- |
| `fetchUrl` | 실제 외부 페이지 요청 | 저장·로그 금지 |
| `normalizedUrl` | 캐시 및 진단용 정규화 URL | 민감값 마스킹 후 저장 |
| `displayUrl` | API·UI 표시 | 안전한 값만 저장·응답 |

정규화 시 다음을 적용한다.

- scheme과 hostname을 소문자로 정규화한다.
- fragment를 제거한다.
- 기본 포트 `:80`, `:443`을 제거한다.
- query parameter 순서를 안정적으로 정렬한다.
- URL userinfo를 제거한다.
- `token`, `access_token`, `key`, `api_key`, `secret`, `auth`, `session`, `code`, `signature` 등 민감 파라미터 값은 `<redacted>`로 대체한다.
- 민감값이 포함된 원본 URL은 DB, 로그, 오류 메시지에 남기지 않는다.

### 6.2 HTML 해시

HTML 해시는 Workers Web Crypto API의 SHA-256으로 계산한다.

```typescript
async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
```

비암호학적 Fast Hash는 사용하지 않는다.

### 6.3 진단 입력 해시

HTML이 같아도 Redirect URL, HTTP 상태, 응답 헤더가 다르면 진단 결과가 달라질 수 있다. 따라서 캐시는 `htmlHash`가 아니라 전체 진단 입력을 표현하는 `inputHash`를 사용한다.

```typescript
const inputHash = await sha256Hex(
  stableStringify({
    normalizedUrl,
    finalUrl,
    httpStatus,
    htmlHash,
    headers: {
      contentType,
      xRobotsTag,
      link,
    },
  }),
);
```

`stableStringify()`는 객체 키 순서를 고정해야 한다. 선택 헤더 이름은 소문자로 통일하고 값의 불필요한 공백을 정규화한다.

---

## 7. 진단 파이프라인

### 7.1 단계 정의

```text
1. 요청 파싱 및 URL 형식 검증
2. URL 정규화와 저장용 URL 생성
3. SSRF Guard 실행
4. 수동 Redirect 방식으로 HTML Fetch
5. HTTP 상태·최종 URL·선택 헤더 수집
6. HTML SHA-256 계산
7. 전체 진단 입력 SHA-256 계산
8. 캐시 조회
9. HIT면 실행 이력만 저장
10. MISS면 규칙 평가
11. 결과 크기 제한과 DB 모델 변환
12. 결과·하위 데이터·실행 이력 원자적 저장
13. 동시 캐시 경쟁이면 기존 결과 재조회 후 실행 이력 저장
14. API 응답 반환
```

### 7.2 서비스 인터페이스

```typescript
export interface ExecuteAuditInput {
  url: string;
  actorKey?: string;
}

export interface ExecuteAuditOutput {
  runId: string;
  auditResultId: string;
  cacheHit: boolean;
  result: AuditResultDto;
}

export async function executeAudit(
  input: ExecuteAuditInput,
): Promise<ExecuteAuditOutput>;
```

`auditPage()` 하나에 Fetch와 평가를 모두 넣지 않는다. 최소한 다음 함수 경계를 둔다.

```typescript
validateAndNormalizeUrl()
fetchAuditDocument()
calculateHtmlHash()
calculateInputHash()
findCachedResult()
evaluateAuditRules()
prepareAuditPersistenceModel()
persistNewResultAndRun()
saveSuccessfulRun()
saveFailedRunBestEffort()
```

---

## 8. 캐시 HIT·MISS 및 동시 요청 처리

### 8.1 캐시 HIT

캐시 HIT에서는 기존 결과와 하위 테이블을 다시 저장하지 않는다.

```text
audit_results INSERT 금지
audit_scores INSERT 금지
audit_findings INSERT 금지
audit_evidence INSERT 금지
audit_runs INSERT 실행
```

### 8.2 캐시 MISS

평가를 수행한 뒤 다음 데이터를 하나의 `db.batch()`에 넣는다.

```text
1. audit_results 1행
2. audit_scores 다중 행 청크
3. audit_findings 다중 행 청크
4. audit_evidence 다중 행 청크
5. audit_runs 1행
```

모든 Statement가 성공해야 전체가 Commit된다.

### 8.3 동시 캐시 MISS 경쟁

두 요청이 동시에 캐시를 조회하면 둘 다 MISS를 볼 수 있다. 이 경우 `ux_audit_results_cache` UNIQUE 제약조건을 최종 동시성 제어 장치로 사용한다.

```typescript
try {
  return await persistNewResultAndRun(db, persistenceModel);
} catch (error) {
  const winner = await findCachedResult(db, cacheKey);

  if (!winner) {
    throw error;
  }

  const run = await saveSuccessfulRun(db, {
    auditResultId: winner.id,
    requestedUrl: safeRequestedUrl,
    actorKey,
    cacheHit: true,
    durationMs: elapsedMs(),
  });

  return {
    runId: run.id,
    auditResultId: winner.id,
    cacheHit: true,
    result: winner,
  };
}
```

Batch 실패 후 동일 캐시 키 결과가 존재할 때만 동시 요청 경쟁으로 처리한다. 결과가 없다면 실제 저장 오류이므로 원래 예외를 다시 발생시킨다.

---

## 9. D1 Batch 및 파라미터 청크 처리

D1의 쿼리당 최대 바인딩 파라미터 수는 100개다. 안전 여유를 두고 애플리케이션 바인딩 예산을 90개로 설정한다.

```typescript
const D1_SAFE_BIND_LIMIT = 90;

function calculateChunkSize(columnCount: number): number {
  if (columnCount <= 0) {
    throw new Error("columnCount must be positive");
  }

  return Math.max(1, Math.floor(D1_SAFE_BIND_LIMIT / columnCount));
}
```

현재 스키마 기준 권장 청크 크기는 다음과 같다.

| 테이블 | INSERT 컬럼 수 | 안전 청크 크기 |
| --- | ---: | ---: |
| `audit_scores` | 6 | 15행 |
| `audit_findings` | 10 | 9행 |
| `audit_evidence` | 5 | 18행 |

Finding을 20개씩 저장하면 200개의 파라미터가 필요하므로 금지한다.

Statement 생성 시 빈 배열 INSERT를 만들지 않는다.

```typescript
const statements = [db.insert(auditResults).values(resultRow)];

for (const rows of scoreChunks) {
  statements.push(db.insert(auditScores).values(rows));
}

for (const rows of findingChunks) {
  statements.push(db.insert(auditFindings).values(rows));
}

for (const rows of evidenceChunks) {
  statements.push(db.insert(auditEvidence).values(rows));
}

statements.push(db.insert(auditRuns).values(runRow));

await db.batch(statements);
```

타입 문제를 감추기 위한 광범위한 `as any`는 사용하지 않는다. Drizzle Batch의 이질적 Statement 배열 타입 문제로 제한적 캐스트가 불가피하다면 DB Repository 내부 한 곳에만 격리하고 사유를 주석으로 남긴다.

---

## 10. 데이터 크기 제한

### 10.1 HTML 응답

- 최대 수신 크기: 2MB
- `Content-Length`가 2MB를 초과하면 Body를 읽기 전에 차단한다.
- `Content-Length`가 없거나 신뢰할 수 없는 경우 Stream을 읽으며 누적 바이트를 검사한다.
- `response.text()`로 전체를 먼저 읽은 뒤 검사하지 않는다.

### 10.2 추출 JSON

- 목표 최대 크기: 512KB
- 직렬화된 JSON 문자열을 `slice()`로 자르지 않는다.
- 배열 항목 수·본문 길이·중복 데이터를 단계적으로 줄인 후 다시 직렬화한다.
- 최종 저장 JSON은 항상 `JSON.parse()` 가능한 유효한 JSON이어야 한다.
- 축약 여부와 실제 byte 크기를 `extracted_truncated`, `extracted_bytes`에 기록한다.

```text
원본 추출 데이터
   ↓
불필요 필드 제거
   ↓
대형 배열 항목 수 제한
   ↓
긴 텍스트 필드 축약
   ↓
JSON.stringify()
   ↓
TextEncoder byteLength 검증
```

### 10.3 Evidence

- `excerpt`는 항목당 최대 2,000자로 제한한다.
- 단순 UTF-16 index가 아니라 사용자 문자 경계를 가능한 한 보존한다.
- 원본 페이지 전체 HTML을 Evidence에 저장하지 않는다.

---

## 11. SSRF 및 외부 Fetch 보안

### 11.1 URL 허용 정책

- `http:`와 `https:`만 허용한다.
- URL userinfo를 허용하지 않는다.
- `localhost`, loopback, private, link-local, multicast, unspecified 주소를 차단한다.
- IPv4·IPv6 및 IPv4-mapped IPv6 형식을 검사한다.
- Cloud metadata 주소와 내부 관리 주소를 차단한다.
- IP 우회 표기와 비정상 Host 표현을 테스트한다.

### 11.2 Redirect 정책

자동 Redirect를 사용하지 않는다.

```typescript
fetch(url, {
  redirect: "manual",
  signal,
});
```

- Redirect는 최대 5회 허용한다.
- 각 `Location`을 현재 URL 기준으로 해석한다.
- 모든 Redirect 목적지에 동일한 SSRF Guard를 다시 실행한다.
- Redirect loop를 감지한다.

### 11.3 Timeout 및 Content-Type

- 전체 Fetch 제한: 15초
- AbortController로 요청을 중단한다.
- 허용 Content-Type은 `text/html`, `application/xhtml+xml`을 기본으로 한다.
- HTML이 아닌 응답은 명확한 도메인 오류로 반환한다.

### 11.4 로그 정책

다음 값만 구조화 로그에 기록한다.

```text
runId
auditResultId
safe host
cacheHit
httpStatus
fetchDurationMs
evaluationDurationMs
totalDurationMs
errorCode
```

원본 Query String, 인증 토큰, 응답 HTML, Evidence 전문은 로그에 기록하지 않는다.

---

## 12. API 설계

### 12.1 진단 실행

```http
POST /api/audits
Content-Type: application/json
```

요청:

```json
{
  "url": "https://example.com"
}
```

신규 결과 응답: `201 Created`

```json
{
  "runId": "run_...",
  "auditResultId": "result_...",
  "cacheHit": false,
  "result": {}
}
```

캐시 결과 응답: `200 OK`

```json
{
  "runId": "run_...",
  "auditResultId": "result_...",
  "cacheHit": true,
  "result": {}
}
```

주요 오류 코드:

| HTTP | 오류 코드 예시 | 의미 |
| ---: | --- | --- |
| 400 | `INVALID_URL` | URL 형식 오류 |
| 403 | `SSRF_BLOCKED` | 차단 대상 주소 |
| 413 | `HTML_TOO_LARGE` | 응답 크기 초과 |
| 415 | `UNSUPPORTED_CONTENT_TYPE` | HTML이 아닌 응답 |
| 422 | `AUDIT_NOT_SUPPORTED` | 진단 불가능 페이지 |
| 429 | `RATE_LIMITED` | 요청 제한 초과 |
| 502 | `UPSTREAM_FETCH_FAILED` | 외부 페이지 연결 실패 |
| 504 | `UPSTREAM_TIMEOUT` | 외부 페이지 Timeout |
| 500 | `AUDIT_PERSISTENCE_FAILED` | 저장 또는 내부 처리 실패 |

### 12.2 진단 결과 조회

```http
GET /api/audits/{auditResultId}
```

- 결과·카테고리 점수·Findings·Evidence를 중첩 DTO로 반환한다.
- 존재하지 않으면 `404 NOT_FOUND`를 반환한다.
- 내부 DB 컬럼 구조를 그대로 노출하지 않고 API DTO로 변환한다.

### 12.3 진단 이력 조회

```http
GET /api/history?limit=20&cursor=<opaque-cursor>
```

- 기본 `limit`: 20
- 최소 `limit`: 1
- 최대 `limit`: 50
- 정렬: `requested_at DESC, id DESC`
- 커서 구성 기준: `(requested_at, id)`
- 커서는 Base64URL 등의 불투명 문자열로 인코딩한다.
- 동일 시각의 여러 실행도 누락하거나 중복하지 않아야 한다.
- 개인 이력이라면 반드시 `actor_key` 범위로 제한한다.
- 인증·세션 범위를 확정하지 않았다면 전 사용자 Global History를 공개하지 않는다.
- 응답에 `Cache-Control: no-store`를 적용한다.

---

## 13. 인증·이력 접근 정책

진단 결과 ID를 아는 것만으로 다른 사용자의 이력을 열람할 수 있게 하지 않는다.

구현 시 다음 중 하나를 제품 정책으로 확정한다.

1. ChatGPT Sites의 인증 사용자 식별자를 서버에서 읽어 `actorKey`를 생성한다.
2. 익명 서비스라면 서명된 세션 쿠키 기반의 pseudonymous `actorKey`를 사용한다.
3. 개인 이력 기능을 제공하지 않는다면 `/api/history`를 관리자 전용으로 제한한다.

원본 이메일을 `audit_runs`에 직접 저장하지 않는다. 필요한 경우 서버 비밀값을 사용한 HMAC 기반 식별자를 저장한다.

---

## 14. Repository 및 Service 책임 분리

### `lib/db/index.ts`

- D1 바인딩으로 Drizzle 클라이언트 생성
- 런타임 DB 접근
- 테스트용 DB 주입 지원

### `lib/repositories/audit-repository.ts`

- 캐시 결과 조회
- 신규 결과와 하위 데이터의 Batch 저장
- 성공·실패 실행 이력 저장
- 결과 ID 조회 및 중첩 데이터 복원
- 커서 기반 실행 이력 조회

### `lib/services/audit-service.ts`

- 전체 Fetch → Hash → Cache → Evaluate 파이프라인 조정
- 동시 캐시 경쟁 처리
- 도메인 오류 변환
- 시간 측정 및 결과 DTO 생성

### `lib/audit/*`

- URL 검증·SSRF Guard
- 외부 문서 Fetch
- HTML 추출
- 규칙 평가
- 점수 계산

Route Handler에는 DB 쿼리나 진단 규칙을 직접 작성하지 않는다.

---

## 15. 변경 파일 목록

### 인프라·설정

| 상태 | 파일 | 변경 내용 |
| --- | --- | --- |
| MODIFY | `.openai/hosting.json` | Sites D1 바인딩 `DB` 선언 |
| NEW/MODIFY | `wrangler.jsonc` | D1 로컬·직접 Cloudflare 설정 |
| MODIFY | `vite.config.ts` | vinext·Cloudflare RSC 환경 확인 |
| MODIFY | `package.json` | Drizzle·Wrangler·Vitest 의존성과 스크립트 |
| NEW | `drizzle.config.ts` | SQLite 스키마·마이그레이션 출력 설정 |
| GENERATED | `worker-configuration.d.ts` | `wrangler types` 결과 |
| NEW/MODIFY | `vitest.config.ts` | Cloudflare Workers Vitest 통합 설정 |

### DB·서비스

| 상태 | 파일 | 변경 내용 |
| --- | --- | --- |
| NEW | `db/schema.ts` | 5개 테이블·인덱스·제약조건 정의 |
| GENERATED | `drizzle/*.sql` | 검토된 D1 마이그레이션 |
| NEW | `lib/db/index.ts` | DB 생성·런타임 접근 헬퍼 |
| NEW | `lib/repositories/audit-repository.ts` | 저장·조회·페이지네이션 |
| NEW | `lib/services/audit-service.ts` | 진단 파이프라인·경쟁 처리 |
| MODIFY | `lib/audit.ts` 또는 `lib/audit/*` | Fetch와 Evaluate 단계 분리 |

### API

| 상태 | 파일 | 변경 내용 |
| --- | --- | --- |
| MODIFY | `app/api/audits/route.ts` | POST 진단 실행 및 저장 |
| NEW | `app/api/audits/[id]/route.ts` | 결과 상세 GET |
| NEW | `app/api/history/route.ts` | 소유 범위·커서 기반 History GET |

### 테스트

| 상태 | 파일 | 변경 내용 |
| --- | --- | --- |
| NEW | `tests/v2/db.test.ts` | CRUD·FK·Batch·캐시 경쟁 검증 |
| NEW | `tests/v2/audit-api.test.ts` | POST·GET·History 통합 검증 |
| NEW | `tests/v2/audit-security.test.ts` | SSRF·Redirect·크기·Timeout 검증 |

문서의 파일 링크는 로컬 Windows `file:///` 절대 경로가 아니라 프로젝트 상대 경로를 사용한다.

---

## 16. 테스트 계획

### 16.1 테스트 런타임

- Vitest와 `@cloudflare/vitest-pool-workers`를 사용한다.
- 테스트는 Workers 런타임에서 실행한다.
- `wrangler.jsonc`의 테스트 D1 바인딩을 사용한다.
- 테스트 시작 시 생성된 Drizzle migration을 D1에 적용한다.
- 각 테스트가 다른 테스트의 저장 상태에 의존하지 않도록 격리한다.
- 외부 Fetch는 Workers 테스트 런타임이 지원하는 Outbound Mock을 사용한다.

### 16.2 DB 테스트

1. 결과·점수·Finding·Evidence·Run 전체 저장
2. Finding 저장 실패 시 Batch 전체 롤백
3. Evidence 저장 실패 시 부모 데이터까지 롤백
4. 동일 캐시 키 중복 결과 차단
5. 캐시 HIT 시 결과 수는 유지되고 Run만 증가
6. 동시 MISS 요청에서 결과 1개·Run 2개 생성
7. 결과 삭제 시 Scores·Findings·Evidence CASCADE
8. 결과 삭제 시 Run의 결과 참조 `NULL` 처리
9. CHECK·UNIQUE·FK 제약조건 검증
10. 100개 파라미터 제한을 넘지 않는 청크 생성 검증

### 16.3 API 테스트

1. 신규 POST는 `201`과 `cacheHit=false` 반환
2. 동일 입력 POST는 `200`과 `cacheHit=true` 반환
3. 반환된 ID로 결과 상세 GET 성공
4. 존재하지 않는 결과 ID는 `404`
5. History 정렬·limit·next cursor 검증
6. 동일 requested_at의 여러 Run 페이지 누락 방지
7. 실패한 진단도 `audit_runs`에 기록
8. 내부 Stack Trace와 민감 URL이 응답에 없는지 검증

### 16.4 SSRF·Fetch 테스트

1. localhost 차단
2. IPv4 private·loopback·link-local 차단
3. IPv6 private·loopback 및 IPv4-mapped IPv6 차단
4. cloud metadata 주소 차단
5. 허용 URL에서 사설 주소로 Redirect 시 차단
6. Redirect 5회 초과 차단
7. Redirect loop 차단
8. 15초 Timeout 처리
9. Content-Length 2MB 초과 사전 차단
10. Stream 누적 크기 2MB 초과 차단
11. 지원하지 않는 Content-Type 차단
12. URL credential과 민감 Query가 DB·로그에 남지 않는지 검증

### 16.5 JSON·Evidence 테스트

1. 512KB 이하 JSON 정상 저장
2. 초과 JSON의 구조적 축약
3. 축약 JSON의 `JSON.parse()` 성공
4. `extracted_truncated=true` 및 byte 기록
5. Evidence 2,000자 제한

---

## 17. 검증 명령

권장 실행 순서:

```bash
npm install
npm run cf:typegen
npm run db:generate
npm run db:check
npm run db:migrate:local
npm test
npm run typecheck
npm run lint
npm run build
```

추가 확인:

```bash
npx vinext check
```

마이그레이션 SQL을 생성한 뒤 다음을 사람이 검토한다.

- 모든 테이블이 포함됐는가?
- UNIQUE·CHECK·INDEX가 생성됐는가?
- FK `ON DELETE CASCADE`와 `SET NULL`이 의도대로 생성됐는가?
- 기존 테이블을 의도치 않게 DROP하지 않는가?
- 운영 데이터 손실 가능성이 없는가?

---

## 18. 구현 순서

### 1단계: 설정과 스키마

1. 패키지 설치
2. `wrangler.jsonc`와 Vite 설정 확인
3. 타입 생성
4. Drizzle 스키마 작성
5. Migration 생성·검토·로컬 적용

### 2단계: Repository

1. DB 생성 헬퍼
2. 캐시 조회
3. 파라미터 예산 기반 청크 함수
4. 신규 결과 Batch 저장
5. 성공·실패 Run 저장
6. 결과 상세·History 조회

### 3단계: 진단 파이프라인

1. URL 표현 분리
2. SSRF Guard 강화
3. 수동 Redirect Fetch
4. Stream 크기 제한
5. HTML·입력 Hash
6. Fetch와 Evaluate 분리
7. 캐시 HIT·MISS·경쟁 처리

### 4단계: API

1. POST `/api/audits`
2. GET `/api/audits/[id]`
3. GET `/api/history`
4. 오류 코드·DTO·접근 제어

### 5단계: 테스트와 배포 준비

1. DB 통합 테스트
2. API 통합 테스트
3. SSRF·Fetch 보안 테스트
4. Typecheck·Lint·Build
5. Migration 및 Sites 배포 아티팩트 검토

---

## 19. 완료 기준

다음 조건을 모두 만족해야 백엔드 구축을 완료로 판정한다.

- [ ] 로컬과 운영의 D1 바인딩 역할이 문서와 설정에서 분리되어 있다.
- [ ] 생성된 Migration SQL이 버전 관리에 포함되어 있다.
- [ ] 동일 캐시 키에 대해 `audit_results`가 중복 생성되지 않는다.
- [ ] 캐시 HIT마다 `audit_runs`가 새로 생성된다.
- [ ] 동시 MISS 요청에서 결과 1개와 실행 이력 N개가 생성된다.
- [ ] 실패한 진단도 결과 없이 Run으로 기록할 수 있다.
- [ ] 결과와 하위 데이터는 하나의 Batch로 원자적으로 저장된다.
- [ ] 모든 INSERT가 D1의 100개 바인딩 파라미터 제한을 지킨다.
- [ ] 추출 JSON은 항상 유효한 JSON이며 512KB 정책을 지킨다.
- [ ] Redirect마다 SSRF 검증이 재실행된다.
- [ ] HTML Timeout과 2MB 크기 제한이 Stream 단계에서 적용된다.
- [ ] 원본 민감 URL이 DB·로그·API 응답에 저장되지 않는다.
- [ ] History는 `(requested_at, id)` 복합 커서를 사용한다.
- [ ] History가 사용자 또는 관리자 범위로 제한된다.
- [ ] 기존 및 신규 테스트의 실패·스킵이 0건이다.
- [ ] Typecheck·Lint·Production Build가 모두 성공한다.

---

## 20. 참고 문서

- [OpenAI Sites 공식 문서](https://learn.chatgpt.com/docs/sites)
- [vinext 공식 저장소](https://github.com/cloudflare/vinext)
- [Cloudflare D1 Database API](https://developers.cloudflare.com/d1/worker-api/d1-database/)
- [Cloudflare D1 Limits](https://developers.cloudflare.com/d1/platform/limits/)
- [Cloudflare D1 Foreign Keys](https://developers.cloudflare.com/d1/sql-api/foreign-keys/)
- [Cloudflare Workers Vitest Integration](https://developers.cloudflare.com/workers/testing/vitest-integration/)
- [Drizzle ORM Cloudflare D1](https://orm.drizzle.team/docs/sqlite/connect-cloudflare-d1)
- [Drizzle ORM Batch API](https://orm.drizzle.team/docs/sqlite/batch-api)

