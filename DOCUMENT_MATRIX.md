# CiteGraph 프로젝트 통합 마스터 관리표 & 이력서 (DOCUMENT_MATRIX.md)

> 🚨 **[MANDATORY INSTRUCTION FOR ALL AI AGENTS / 필수 읽기 지침]**  
> 이 저장소(`seogeoaeo`)에 참여하는 모든 AI 어시스턴트는 작업을 시작하기 전 **본 문서(`DOCUMENT_MATRIX.md`) 및 최상위 방법론 문서([`AGENTS.md`](file:///c:/workspace/seogeoaeo/AGENTS.md), [`citegraph-scoring-methodology-v1.md`](file:///c:/workspace/seogeoaeo/%EA%B8%B0%ED%9A%8D%EB%AC%B8%EC%84%9C/citegraph-scoring-methodology-v1.md), [`citegraph-weight-calibration-plan.md`](file:///c:/workspace/seogeoaeo/%EA%B8%B0%ED%9A%8D%EB%AC%B8%EC%84%9C/citegraph-weight-calibration-plan.md))를 반드시 먼저 읽어야 합니다.**  
> 검증되지 않은 Heuristic으로 LLM 정성 점수를 PASS 처리하거나, 사전 캘리브레이션 승인 없이 복합 점수(OCI 등)를 공식 결합하는 것을 엄격히 금지합니다.

---

> **프로젝트명**: CiteGraph (`seogeoaeo`)  
> **최종 갱신일**: 2026-08-19  
> **작업 담당 AI**: OpenAI Codex  
> **사용 모델**: GPT-5  
> **문서 관리 목적**: 프로젝트 내 문서 현황, 최신 정본(Canonical) 명세, 변경 이력, AI 작업 기록 및 **문서작업 기본 틀(표준 가이드라인)**을 단일 통합 매트릭스로 관리함.

---

## 🛠️ 1. CiteGraph 문서작업 기본 틀 (Standard Documentation Framework)

프로젝트 내에서 새로운 문서를 생성하거나 기존 문서를 수정할 때 **모든 AI가 반드시 준수해야 하는 표준 가이드라인 및 워크플로우**입니다.

### ① 문서 헤더 필수 메타데이터 (Mandatory Header Metadata)
모든 기획, 설계, 명세 문서의 상단 1~10행에는 반드시 아래 표기 양식을 포함합니다:
```markdown
> **프로젝트명**: CiteGraph (`seogeoaeo`)  
> **문서명/역할**: [문서 목적 및 담당 분야]  
> **버전**: `vX.Y.Z` 또는 `YYYY.MM.DD-vN.N`  
> **최종 갱신일**: YYYY-MM-DD  
> **작업 담당 AI**: Antigravity (Google DeepMind Team)  
> **사용 모델**: Gemini 2.5 Pro (Advanced Agentic Coding)  
> **문서 상태**: [최종 승인 / 구현 완수 / 운영 중 / 기획 검토안 / 상위 대체됨]
```

### ② 문서작업 5단계 가이드라인 (5-Step Operating Workflow)
1. **마스터 문서 필수 읽기**: 작업 착수 전 본 `DOCUMENT_MATRIX.md`에서 해당 분야의 **정본 마스터 문서**를 먼저 읽는다.
2. **사유 및 변경 범위 명시**: 기존 문서 수정 시 변경 사유(Why)와 구체적 변경 내용(What), 영향을 받는 소스 코드 범위(Scope)를 명확히 기술한다.
3. **통합 이력 동기화**:
   - 프로젝트 전체 이력 및 AI 작업 기록: [`DOCUMENT_MATRIX.md`](file:///c:/workspace/seogeoaeo/DOCUMENT_MATRIX.md)에 즉시 기록.
   - 점수표/규칙 관련 수정: [`SCORE_REVISION_HISTORY.md`](file:///c:/workspace/seogeoaeo/%EA%B8%B0%ED%9A%8D%EB%AC%B8%EC%84%9C/Score%20criteria%20table/SCORE_REVISION_HISTORY.md)에 수정 이력 추가.
4. **코드베이스 & DB 마이그레이션 동기화**: `rulesetVersion` 및 `App Version`을 조율하고, `db/schema.ts`, 진단 엔진, API 및 UI 코드와 일치시킨다.
5. **검증 및 QA 기록**: Vitest 테스트, TypeScript 컴파일, Build 및 로컬 브라우저 QA 캡처를 실행하여 결과를 보고서(`walkthrough.md`)와 문서 이력에 남긴다.

---

## 📌 2. 가장 최신 활성 문서 (Latest Active Canonical Documents)

현재 시스템 구현 및 판정의 절대적 기준이 되는 **정본(Canonical) 문서** 목록입니다.

| 구분 | 마스터 문서명 (상세 경로) | 버전 | 상태 | 비고 |
| :--- | :--- | :---: | :---: | :--- |
| **운영 수칙** | [`AGENTS.md`](file:///c:/workspace/seogeoaeo/AGENTS.md) | **v1.0** | **최종 승인** | 프로젝트 코덱스, MOCK 금지, 원칙적 점수 산출 및 보안 지침 |
| **방법론 정본** | [`citegraph-scoring-methodology-v1.md`](file:///c:/workspace/seogeoaeo/%EA%B8%B0%ED%9A%8D%EB%AC%B8%EC%84%9C/citegraph-scoring-methodology-v1.md) | **v1.0** | **최종 승인** | 점수 산출 방법론, Heuristic 판정 결함 금지 원칙 |
| **규칙 레지스트리** | [`citegraph-rule-registry-draft.md`](file:///c:/workspace/seogeoaeo/%EA%B8%B0%ED%9A%8D%EB%AC%B8%EC%84%9C/citegraph-rule-registry-draft.md) | **v1.0** | **최종 승인** | 정본 35개 진단 규칙 레지스트리 (SEO 18 + GEO 17) |
| **가중치 캘리브레이션** | [`citegraph-weight-calibration-plan.md`](file:///c:/workspace/seogeoaeo/%EA%B8%B0%ED%9A%8D%EB%AC%B8%EC%84%9C/citegraph-weight-calibration-plan.md) | **v1.0** | **최종 승인** | 가중치 캘리브레이션 계획서 (§9 복합 점수 임의 결합 금지) |
| **비교기획 마스터** | `CiteGraph_Multi_URL_Compare_Implementation_Plan_v2.md` | v2.0 | **미생성(파일 없음)** | 문서 미작성. 작성 전까지 `citegraph-phase1-mvp-design.md`/PRD의 관련 절을 따른다 |
| **백엔드 마스터** | [`CiteGraph_Backend_Implementation_Plan_v3.md`](file:///c:/workspace/seogeoaeo/%EA%B8%B0%ED%9A%8D%EB%AC%B8%EC%84%9C/CiteGraph%20%EB%B0%B1%EC%97%94%EB%93%9C%20%EA%B5%AC%EC%B6%95%20%EA%B3%84%ED%9A%8D%EC%84%9C/CiteGraph_Backend_Implementation_Plan_v3.md) | **v3.0** | **구현 완수** | Cloudflare D1 + Drizzle ORM 백엔드 구축 명세서 |
| **디자인 수칙** | [`DESIGN.md`](file:///c:/workspace/seogeoaeo/DESIGN.md) | **v1.0** | **최종 승인** | UI/UX 정보 구조, 금지 패턴 배제, 반응형(1440px/390px) 규칙 |

---

## 🗺️ 3. 전체 프로젝트 문서 및 소스코드 현황 매트릭스 (Document Matrix)

| 구분 | 문서/코드 경로 | 버전 | 상태 | 최종 갱신일 | 주요 목적 및 내용 설명 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **문서관리** | [`DOCUMENT_MATRIX.md`](file:///c:/workspace/seogeoaeo/DOCUMENT_MATRIX.md) | v1.0 | **운영 중** | 2026-08-18 | 문서작업 기본틀, 이력 통합, AI 작업 기록 및 최신 정본 맵핑 관리 |
| **방법론정본**| [`citegraph-scoring-methodology-v1.md`](file:///c:/workspace/seogeoaeo/%EA%B8%B0%ED%9A%8D%EB%AC%B8%EC%84%9C/citegraph-scoring-methodology-v1.md) | v1.0 | **최종 승인** | 점수 산출 정본 방법론 및 휴리스틱 결함 금지 수칙 |
| **점수이력** | `Score criteria table/SCORE_REVISION_HISTORY.md` | - | **미생성(파일 없음)** | 점수표 수정 이력서. 점수 Rule/Weight를 실제로 변경하는 첫 작업에서 생성한다 |
| **비교마스터**| `CiteGraph_Multi_URL_Compare_Implementation_Plan_v2.md` | v2.0 | **미생성(파일 없음)** | Multi-URL Compare 마스터 구현 명세서. 작성 전까지 §2 표에서도 제외 |
| **백엔드명세**| [`CiteGraph_Backend_Implementation_Plan_v3.md`](file:///c:/workspace/seogeoaeo/%EA%B8%B0%ED%9A%8D%EB%AC%B8%EC%84%9C/CiteGraph%20%EB%B0%B1%EC%97%94%EB%93%9C%20%EA%B5%AC%EC%B6%95%20%EA%B3%84%ED%9A%8D%EC%84%9C/CiteGraph_Backend_Implementation_Plan_v3.md) | v3.0 | **구현 완수** | Cloudflare D1 + Drizzle ORM 백엔드 구축 최종 명세서 |
| **진단 엔진** | [`citegraph-app/lib/audit.ts`](file:///c:/workspace/seogeoaeo/%EA%B8%B0%ED%9A%8D%EB%AC%B8%EC%84%9C/citegraph-app/lib/audit.ts) | v1.0 | **구현 완수** | 정본 35개 결정론적 규칙 엔진 (`rulesetVersion: 2026.08.1`) |
| **웹 UI 대시보드**| [`citegraph-app/app/page.tsx`](file:///c:/workspace/seogeoaeo/%EA%B8%B0%ED%9A%8D%EB%AC%B8%EC%84%9C/citegraph-app/app/page.tsx) | v1.0 | **구현 완수** | SEO Score (100점) 및 GEO Readiness (100점) 정직한 분리 대시보드 |
| **참고자료(비-정본)**| [`open-source-seo-geo-benchmark.md`](file:///c:/workspace/seogeoaeo/%EA%B8%B0%ED%9A%8D%EB%AC%B8%EC%84%9C/open-source-seo-geo-benchmark.md) | 2026-08-18 | **리서치 참고** | SEO/GEO 오픈소스 10건 라이선스·재사용 등급 벤치마킹. **정본 아님** — 규칙·가중치·점수 구조 결정에 직접 인용 금지, 구현 아이디어 참고용으로만 사용. §4.2 용어는 CiteGraph 공식 명칭(SEO Score/GEO Readiness Score)과 다르므로 문서 내 정정 각주를 따를 것 |

---

## 📜 4. 버전 변경 이력 및 AI 작업 기록 (Integrated Changelog & AI Log)

### [v0.7.0] - 2026-08-19 (Scoring v2 호출 경로 및 최소 결과 UI 완료)
* **담당 AI**: OpenAI Codex
* **사용 모델**: GPT-5
* **작업 영역**: 기존 v1 병행 보존, v2 preview API/UI, Playwright 실브라우저 QA.
* **변경 사유**: Evidence Layer, Page Type, Scoring v2 엔진을 테스트 전용 상태에서 실제 사용자 호출이 가능한 작은 vertical slice로 완결하기 위함.
* **주요 작업 내용**:
  1. 기존 `POST /api/audits` v1 계약을 유지하고 `POST /api/audits?engine=v2` 명시적 분기를 추가했다.
  2. 기존 결과 화면에 SEO Fact score, GEO Fact score, coverage, Page Type, `N_A`/`UNKNOWN` 사유를 표시하는 v2 preview 섹션을 추가했다.
  3. GEO Semantic과 GEO Overall은 구현되지 않은 상태를 `NOT_EVALUATED`로 명시하고 v1 점수 또는 실제 AI Visibility와 결합하지 않았다.
  4. `@playwright/test`를 devDependency로 추가하고 1440px desktop/390px mobile 브라우저 QA를 자동화했다.
* **검증 결과**:
  - Vitest: **81/81 PASS**.
  - TypeScript: **0 errors**, ESLint: **0 errors**(생성 타입 파일의 기존 warning 2건), `vinext build` 성공.
  - Playwright: desktop/mobile **2/2 PASS**. 정상 결과, v1 Evidence/Recommendation, v2 사유 disclosure, SSRF 오류 UX, horizontal overflow 0, 정상 흐름 console/page/unexpected network error 0 확인.
  - 브라우저 UI 데이터는 외부 상태와 D1에 의존하지 않는 E2E fixture를 사용했으며, 실제 공개 URL `https://example.com`에 대한 v1/v2 API 성공 응답은 별도로 확인했다.

### [v0.6.0] - 2026-08-18 (방법론 무결성 복원 및 휴리스틱 분리 교정)
* **담당 AI**: Antigravity (Google DeepMind Team)
* **사용 모델**: Gemini 2.5 Pro (Advanced Agentic Coding)
* **작업 영역**: 방법론 원칙 준수, 휴리스틱 결합 제거, 정본 35개 규칙 엔진 복원.
* **주요 작업 내용**:
  1. **방법론 결함 및 휴리스틱 점수 분리 교정**:
     - `lib/audit.ts`에서 LLM 실측 없이 문자열 길이 등으로 PASS 처리하던 Heuristic R_SEM 로직 및 비공식 OCI 결합 수식 제거.
     - 정본 35개 결정론적 규칙(`rulesetVersion: 2026.08.1`)으로 엔진 전면 복원.
     - 가상의 미래 버전 문자열 `"2026.08.30-v3.0"` 및 비정규 `lib/v3/` 모듈 완전 삭제.
  2. **대시보드 UI 교정 (`app/page.tsx`)**:
     - 가짜 OCI 카드를 제거하고, 독립적인 `SEO Score (100점)`와 `GEO Readiness Score (100점)` 2개 카드 및 35개 정본 개선 항목 아코디언으로 정직하게 노출.
  3. **자동화 테스트 및 브라우저 QA 검증**:
     - Vitest: **54/54 테스트 100% PASS**.
     - TypeScript: **0 errors**, ESLint: **0 errors**, Build: `vinext build` 성공.
     - 브라우저 실시간 QA 검증 캡처 완료 (`canonical_scores_1787039713618.png`).
