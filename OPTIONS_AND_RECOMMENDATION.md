# CiteGraph 실행 옵션 및 권고

> **프로젝트명**: CiteGraph (`seogeoaeo`)  
> **문서명/역할**: 채택·보류·폐기 결정 및 3단계 실행계획  
> **버전**: `2026.08.19-v1.2`  
> **최종 갱신일**: 2026-08-19  
> **작업 담당 AI**: OpenAI Codex  
> **사용 모델**: GPT-5  
> **문서 상태**: 기획 검토안 — 사용자 승인 대기

## 1. 권고 결론

Option A를 순차 수행한다. **합성 AI metric 제거는 완료**됐으며 다음은 v2 evidence 영속화, workspace 경계, 재검증 workflow, usage cap이다. 이 기반 없이 Stage 2/3 기능을 추가하면 신뢰와 gross margin을 동시에 잃는다.

## 2. 가장 큰 매출·신뢰성 병목 10개

| 순위 | 병목 | 영향 |
|---:|---|---|
| 완료 | Compare의 합성 citation/mention/position | null + UNAVAILABLE 및 순위 제외 적용 |
| 2 | 사용자/workspace/tenant 경계 없음 | 유료 SaaS와 데이터 보호 불가 |
| 3 | UsageLedger/limit 없음 | 원가 폭주와 가격 설계 불가 |
| 4 | v2 Evidence 원본·영속화 없음 | 제품 차별화 핵심인 Evidence Graph 불완전 |
| 5 | 수정→재검증 workflow 없음 | 고객 행동과 retention 부재 |
| 6 | history/scan/project UI 없음 | 반복 사용 이유 부족 |
| 7 | robots/sitemap/render 미수집 | 기술 감사 coverage 제한 |
| 8 | GSC/CrUX 실제 성과 없음 | 점수와 outcome 연결 불가 |
| 9 | report/export/share 없음 | 대행사 납품 가치 부족 |
| 10 | legacy OCI schema·starter README | 운영 계약 혼란과 migration 위험 |

## 3. 채택/보류/폐기

### ADOPT NOW

- Compare 합성 metric 제거 및 UNAVAILABLE 계약
- Product analytics event foundation과 투자 Gate 지표
- COL-02, COL-09~11의 최소형
- v2 Artifact/Evidence/RuleResult 영속화
- tenant-safe Project/Scan foundation
- ACT-02, ACT-06의 수동 재검증 slice
- BUS-03, BUS-04, BUS-10 최소형
- REP-06 JSON export

### PILOT

- robots.txt AI crawler matrix
- rendered DOM 선택 실행
- sitemap URL discovery
- GSC, CrUX connector
- 예약·증분 scan
- assignment/status와 regression alert

### BUY/CONNECT

- CrUX/GSC/GA4 공식 API
- SERP/rank/backlink dataset
- 결제 provider
- email delivery

### LAB ONLY

- llms.txt syntax 검사
- Semantic Readiness
- entity/claim/source quality model
- AI response monitoring 전부(질문 cohort·반복·cost cap 이후)

### REJECT

- AI 전용 schema 점수
- AI 선호 문체 점수
- 단일 citation probability
- 자체 글로벌 backlink index
- 사람 승인 없는 자동 게시
- readiness와 observed performance 통합 단일점수

## 4. Option A — 최소 변경으로 판매 가능한 Evidence Audit

### 범위(권장 3~5주, 1~2명 기준의 planning estimate)

1. 완료 — 합성 citation/mention/position 제거; Compare를 SEO/GEO Readiness category 비교로 한정
2. audit/evidence/recommendation/verify/report event 최소 schema와 activation·loop 지표
3. Project + Scan + Artifact + v2 RuleResult 최소 schema
4. actor/workspace boundary와 private result 조회
5. raw HTML/header artifact hash와 retention
6. scan estimate/usage ledger/static fetch cap
7. Finding 상세에서 재검증 요청과 before/after
8. version 포함 JSON export

### 제외

결제, scheduler, render, GSC, AI engine, PDF/white-label.

### 변경 예상

- DB: workspace/project/scan/artifact/v2 result/usage event additive migration
- API: project scan estimate/create/result/evidence/verify/export
- UI: project 선택, audit history, v2 evidence, verify action
- Analytics: activation, time-to-first-verified-insight, verify loop completion, report export event
- Worker: 초기에는 동기 실행 유지하되 idempotency key 적용

### 위험/rollback

- legacy v1 API는 유지하고 신규 `/v2` 또는 project route를 additive 도입
- legacy OCI column은 이 단계에서 drop하지 않음
- feature flag로 v2 persistence/compare 교체 가능

### 수용 테스트

- workspace 교차 접근 차단
- 동일 snapshot 재분석 결정론
- artifact hash 재검증
- 합성 AI metric 0건 — 자동 테스트와 실브라우저 QA 통과
- usage hard cap 초과 시 fetch 전 차단
- issue→evidence→recommendation→verify 3클릭 이내
- workspace별 activation·4주 reuse·verified loop completion 산출 가능

## 5. Option B — 8~12주 성장형

Option A 이후:

- robots/sitemap discovery, 선택적 render
- queue/lease/partial retry/schedule
- GSC + CrUX connector
- change annotation과 before/after outcome
- owner/status/due/ignore reason
- CSV/JSON + share link + scheduled web report
- plan entitlement와 payment pilot

운영비: render와 connector sync가 추가되므로 URL/render/API 단위 ledger 필요. 목표 gross margin 검증 전 무제한 plan 금지.

## 6. Option C — 차별화형

Option B의 8주 retention과 margin 확인 후:

- versioned question cohort
- 공식/허용 provider 기반 다중 AI engine
- engine/model/region/time/raw response/citation 원본
- 최소 3회 반복과 stability
- competitor citation gap/source network
- Agency portfolio와 white-label

AI Visibility는 별도 credit add-on으로 운영하며 Readiness와 합산하지 않는다.

## 7. 3단계 실행계획

### 단계 1 — 신뢰 복구

- 완료 — 합성 AI metric 제거
- v2 persistence + artifact
- tenant boundary + usage cap
- acceptance/security integration tests

### 단계 2 — 매출 강화

- project/history/reverify
- GSC/CrUX
- task/report/export
- entitlement/payment pilot

### 단계 3 — 차별화

- Evidence Graph
- Change-to-Outcome
- 검증된 AI Visibility credit
- Agency OS

## 8. 승인 요청사항

코드 변경 전에 다음을 사용자가 결정해야 한다.

1. Option A 승인 여부
2. 완료 — Compare 합성 AI metric 즉시 제거 및 UNAVAILABLE 전환
3. identity를 Sites header 기반으로 시작할지 별도 auth provider를 쓸지
4. raw HTML artifact 보존기간과 민감정보 정책
5. v1 API/DB의 유지 기간
6. 첫 유료 ICP를 Agency로 확정할지
