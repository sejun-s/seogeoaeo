# CiteGraph 현재 제품 지도

> **프로젝트명**: CiteGraph (`seogeoaeo`)  
> **문서명/역할**: Stage 0 현재 제품 구조 및 실제 작동 경로 감사  
> **버전**: `2026.08.19-v1.2`  
> **최종 갱신일**: 2026-08-19  
> **작업 담당 AI**: OpenAI Codex  
> **사용 모델**: GPT-5  
> **문서 상태**: 기획 검토안 — 구현 승인 전 읽기 전용 감사

## 1. 감사 범위와 결론

감사 대상은 `기획문서/citegraph-app`의 UI, API, 서비스, D1 schema/migration, worker, 테스트와 최상위 정본 문서다. 현재 제품은 **익명 단일 URL 감사와 2~5 URL 비교가 동작하는 기술 prototype**이다. 프로젝트·조직·권한·예약·connector·작업관리·보고서 delivery·결제·사용량 원가 계측은 없다. 따라서 “가입→프로젝트→수정→재측정→결제” SaaS 루프는 아직 존재하지 않는다.

## 2. 현재 구성

| 영역 | 실제 구현 | 상태 | 근거 |
|---|---|---|---|
| Web UI | URL Audit, Multi-URL Compare | PARTIAL | `app/page.tsx`, `app/compare/page.tsx` |
| Audit API | v1 영속 감사, 명시적 v2 preview | PARTIAL | `POST /api/audits`, `POST /api/audits?engine=v2` |
| 조회 API | audit/history/compare 단건·목록 | PARTIAL | `app/api/**/route.ts` |
| v1 Engine | 정본 35개 결정론 규칙 | COMPLETE(현행 정본 범위) | `lib/audit.ts`, `tests/v1/audit-v1.test.ts` |
| v2 Engine | Evidence, Page Type, SEO/GEO Fact, coverage | PARTIAL | `lib/v2/**`, `tests/v2/**`; semantic·영속화 없음 |
| 수집 | 공개 static HTML fetch | PARTIAL | `lib/audit/guard.ts`; robots.txt·sitemap·render 없음 |
| 저장 | Cloudflare D1 + Drizzle | PARTIAL | `db/schema.ts`, `drizzle/*.sql` |
| 비교 | v1 SEO/GEO Readiness 수평 비교 | PARTIAL | 합성 citation/mention 제거 완료; 관측 범위에 따라 REAL/PARTIAL/UNAVAILABLE 표시 |
| Worker | vinext request/image 진입점 | PARTIAL | `worker/index.ts`; queue/scheduler 없음 |
| 인증/테넌시 | 없음 | MISSING | membership/workspace table 및 route guard 없음 |
| 외부 연동 | 없음 | MISSING | GSC/GA4/CrUX/SERP/AI provider 없음 |
| 결제/계량 | 없음 | MISSING | Subscription/UsageLedger/limit 없음 |
| 보고서/협업 | 화면 drill-down만 존재 | PARTIAL | export, share, delivery, owner/status 없음 |

## 3. 화면 지도

### `/` — URL Audit

- 공개 URL 입력
- v1 SEO Score와 GEO Readiness Score 표시
- category breakdown, Finding→Evidence→Recommendation disclosure
- 동일 제출에서 v2 preview를 병행 호출해 SEO Fact, GEO Fact, coverage, Page Type, N_A/UNKNOWN 사유 표시
- 로그인, 저장된 프로젝트 선택, 과거 이력 UI, 비용 예상, 재검증 작업 생성은 없음

### `/compare` — Multi-URL Compare

- ME 1개와 competitor 1~4개 입력
- 각 URL을 순차 감사하고 category/finding matrix 표시
- 실제 질문/플랫폼 관측이 없으므로 `citationRate`, `brandMentionRate`, `averageCitationPosition`은 null이며 AI Visibility를 `UNAVAILABLE`로 표시함
- SEO Score와 GEO Readiness만 수평 비교하며 관측 없는 대상은 AI Visibility 승자 순위에서 제외함

## 4. API 지도

| Method/Route | 역할 | 영속화 | 인증 | 주요 한계 |
|---|---|---:|---:|---|
| `POST /api/audits` | v1 URL 감사 | O | X | actorKey를 route에서 전달하지 않음 |
| `POST /api/audits?engine=v2` | v2 preview | X | X | Fact/evidence 결과 재조회 불가 |
| `GET /api/audits/:id` | v1 결과 조회 | 읽기 | X | 모든 ID 전역 접근 가능 |
| `GET /api/history` | 전체 audit run 이력 | 읽기 | X | workspace/actor filter 없음 |
| `POST /api/compare` | 2~5 URL 순차 비교 | O | X | AI Visibility UNAVAILABLE, 동기 실행, 원가 상한 없음 |
| `GET /api/compare/:id` | 비교 실행 조회 | 읽기 | X | 전역 접근 가능 |
| `GET /api/compare/history` | 비교 이력 | 읽기 | X | 전역 목록 가능 |

## 5. 데이터 지도

| Table | 역할 | 핵심 결손 |
|---|---|---|
| `audit_results` | URL/hash/version/총점/cache | raw artifact URI·retention·workspace 없음; 폐기된 OCI 계열 컬럼 잔존 |
| `audit_scores` | v1 category 점수 | confidence/coverage 없음 |
| `audit_findings` | v1 rule 결과·권고 | 3상태뿐; owner/status/exception 없음 |
| `audit_evidence` | evidence code/field/excerpt | source URL/type/hash/tool/version/수집시각 없음 |
| `audit_runs` | 요청·성공/실패·cache | 실패 저장 경로 불완전; actor nullable |
| `compare_runs` | 비교 실행 context | 실제 question/platform observation 없음 |
| `compare_targets` | 비교 대상·audit 연결 | workspace 경계 없음 |

없는 핵심 모델: `Workspace`, `Membership`, `Project`, `CrawlPolicy`, `Artifact`, `RuleDefinition`, `Issue`, `Recommendation`, `UsageLedger`, `Subscription`, `Connector`, `PerformanceObservation`, `ChangeAnnotation`, `Report`, `AuditEvent`.

## 6. 실제 작동 경로

```text
익명 방문
  → URL 입력
  → URL/DNS/SSRF guard
  → 공개 static HTML fetch
  → v1 35-rule 평가
  → D1 cache/result/finding/evidence 저장
  → 동시에 v2 static snapshot Fact 평가(미저장)
  → 화면 결과와 disclosure
```

```text
익명 비교 방문
  → ME + competitor URL 입력
  → compare run/target 저장
  → URL을 순차 v1 감사
  → category/finding matrix 생성
  → 실제 관측 없는 AI Visibility를 UNAVAILABLE로 반환
  → SEO/GEO Readiness category와 finding만 비교
```

요청한 SaaS 경로의 현황:

```text
가입(MISSING)
→ 프로젝트 생성(MISSING; default_project 상수만 존재)
→ 스캔(PARTIAL)
→ 결과(PARTIAL)
→ 수정 작업(MISSING)
→ 재측정(MISSING; 수동 재실행만 가능)
→ 결제(MISSING)
```

## 7. 운영 기반

- Cloudflare D1 local/hosting binding은 구성돼 있으나 실제 production database ID는 placeholder다.
- queue, cron, durable workflow, retry lease, cancel/resume worker가 없다.
- README는 `vinext-starter` 기본 문서로 실제 제품, migration, 운영 절차와 불일치한다.
- 환경파일과 외부 credential은 발견되지 않았다.
- Git은 `main`, tag `v0.2`, tracked file 128개이며 감사 시작 시 clean이었다.

## 8. 검증 기준선

- Vitest: 8 files, 81/81 PASS
- TypeScript: 0 errors
- ESLint: 0 errors, 생성된 `worker-configuration.d.ts` warning 2건
- Build: `vinext build` PASS
- E2E spec은 존재하며 API fixture로 UI flow를 확인한다. 실제 외부 URL, D1, redirect chain을 한 번에 통과시키는 production-like E2E는 없음.

## 9. 즉시 판단

현재 판매 가능한 핵심은 “근거가 보이는 단일 URL 기술 감사 prototype”과 SEO/GEO Readiness 기술 비교다. 합성 AI 지표는 제거됐지만 workspace 경계·원본 artifact·사용량 상한·재검증 workflow가 생기기 전에는 유료 SaaS 또는 AI Visibility 제품으로 표현하면 안 된다.
