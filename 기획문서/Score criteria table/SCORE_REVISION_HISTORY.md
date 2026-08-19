# CiteGraph 점수표 수정 및 정본 복원 이력서 (Score Table Revision History)

> **점수표 위치**: `C:\workspace\seogeoaeo\기획문서\Score criteria table\`  
> **정본 방법론 문서**: [`citegraph-scoring-methodology-v1.md`](file:///c:/workspace/seogeoaeo/%EA%B8%B0%ED%9A%8D%EB%AC%B8%EC%84%9C/citegraph-scoring-methodology-v1.md)  
> **정본 규칙 레지스트리**: [`citegraph-rule-registry-draft.md`](file:///c:/workspace/seogeoaeo/%EA%B8%B0%ED%9A%8D%EB%AC%B8%EC%84%9C/citegraph-rule-registry-draft.md)  
> **최종 갱신일**: 2026-08-18  
> **작업 담당 AI**: Antigravity (Google DeepMind Team)  
> **사용 모델**: Gemini 2.5 Pro (Advanced Agentic Coding)

---

## 📜 점수표 버전 변경 및 정본 복원 이력

### 🟢 [2026.08.1] - 2026-08-18 (방법론 무결성 복원 및 35개 정본 규칙 확립) — **[현재 정본 적용 중]**

* **조치 배경 및 목적**:
  * `AGENTS.md`, `citegraph-scoring-methodology-v1.md`, `citegraph-weight-calibration-plan.md` 원칙에 따라, **LLM 실측 없이 문자열 길이 등으로 단순 판정하던 Heuristic 점수와 임의의 OCI 가설 공식을 프로덕션 코드에서 전면 제거**하고 데이터의 무결성을 복원함.
* **핵심 교정 내용**:
  1. **임의 규칙 및 비정규 모듈 삭제**:
     * `lib/v3/rules.ts` 및 가상의 미래 버전 문자열 `"2026.08.30-v3.0"` 완전 제거.
  2. **정본 35개 결정론적 규칙 엔진 복원**:
     * **`SEO Score` (전통 SEO 100점)**: HTTPS, Canonical, Robots, Lang, Title, Meta, H1, Headings, Noindex, Schema 등 17개 결정론적 규칙.
     * **`GEO Readiness Score` (기술적/구조적 준비도 100점)**: Answer Capsule 신호, 구조화 데이터, Heading 구조, 근거 링크 품질, 엔티티 명명 등 18개 결정론적 기술 규칙.
     * OCI 단일 강제 결합을 제거하고 독립적인 2개 점수 카드로 분리.
  3. **코드 및 대시보드 UI 반영**:
     * `lib/audit.ts` (`rulesetVersion: 2026.08.1`), `lib/services/audit-service.ts`, `app/page.tsx`.

---

### 🔴 [v3.0 가설안 검토 및 철회] - 2026-08-18 (임시 가설 및 휴리스틱 결함으로 프로덕션 제외)
* **내용**: `CiteGraph_v3.0_설계노트.md` 기반의 28개 규칙 및 OCI 수식(`0.4 * R_TECH + 0.6 * R_SEM`).
* **철회 사유**: LLM 실측 없이 Heuristic으로 Semantic 점수를 판정하고, 캘리브레이션 전의 가설 수식을 확정 점수처럼 결합하는 결함이 확인되어 프로덕션 코드에서 제외함.
