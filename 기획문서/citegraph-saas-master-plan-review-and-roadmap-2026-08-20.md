# CiteGraph SaaS Master Plan 검토 및 3자(Claude·Codex·Gemini) 개발 로드맵

> **문서 버전:** v1.0  
> **작성일:** 2026-08-20  
> **작성 AI:** Gemini 3.7 Flash (Antigravity)  
> **참조 정본:** [`citegraph-saas-master-plan-2026-08-20.md`](file:///c:/workspace/seogeoaeo/%EA%B8%B0%ED%9A%8D%EB%AC%B8%EC%84%9C/citegraph-saas-master-plan-2026-08-20.md)  
> **목적:** 토큰 효율화 및 3자 AI 병렬·순환 협업 체계를 통한 마스터 플랜 단계별 구현 및 점수 신뢰도 고도화

---

## 1. 3자(Claude · Codex · Gemini) 순환 협업 프로토콜 (Tri-Agent Rotation)

사용자 세션 간 토큰 효율을 극대화하고, 신뢰성 있는 품질 게이트를 유지하기 위해 다음 순환 협업 체계를 가동합니다.

```
┌────────────────────────────────────────────────────────┐
│                   1. Claude Sonnet                     │
│  • 전체 아키텍처 설계, 기획/정책 결정, 최종 검수 & Push      │
└───────────────────────────┬────────────────────────────┘
                            │ (설계 및 스펙 인계)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   2. Gemini (Antigravity)              │
│  • 백엔드/프론트엔드 풀스택 구현, UI/UX 완성, 브라우저 QA     │
│  • 자가 점검(Self-Check) 및 로컬 검증 스위트 100% 통과      │
└───────────────────────────┬────────────────────────────┘
                            │ (정밀 알고리즘 및 엣지케이스 인계)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   3. Codex (GPT-5)                     │
│  • 정밀 파서/수학적 알고리즘 검증, 테스트 픽스처 강화      │
│  • 성능/부하 최적화, 엄격한 코드 리뷰 및 정오 대조          │
└───────────────────────────┬────────────────────────────┘
                            │ (수정본/피드백 인계)
                            ▼
           [반복 루프: Claude 최종 게이트 승인 후 Push]
```

### 협업 원칙 및 핸드오버 규칙:
1. **공통 단일 진실 원천(Single Source of Truth)**: 모든 세션은 [`DOCUMENT_MATRIX.md`](file:///c:/workspace/seogeoaeo/DOCUMENT_MATRIX.md)와 [`AGENTS.md`](file:///c:/workspace/seogeoaeo/AGENTS.md)의 최신 기록을 읽고 시작한다.
2. **Fabrication / MOCK 엄격 금지**: 실측되지 않은 데이터를 지어내거나(Fabrication), 의미 없는 테스트 assertion으로 넘어가서는 안 된다.
3. **작업 단위별 로컬 커밋 및 문서 동기화**: 구현이 완료되면 Vitest/TypeScript/ESLint/Playwright 검증을 통과하고, `DOCUMENT_MATRIX.md`에 변경 사유를 기록한 뒤 로컬 커밋한다.

---

## 2. 마스터 플랜에 대한 점수 신뢰도(Score Reliability) 검토 결론

1. **Readiness vs Performance 분리**:
   - 자사 사이트 구조/신호(`Readiness`)와 실제 AI 검색엔진에서의 언급/인용 결과(`Performance`)를 섞지 않고 명확히 분리함으로써 점수 왜곡을 방지함.
2. **4대 측정 유형과 통계적 신뢰도 계약**:
   - `Deterministic`, `Semi-deterministic`, `LLM-evaluated`, `External observation`으로 분류하고 $\text{Confidence}$ 공식을 적용하여 점수 옆에 불확실성을 상시 표시.
3. **5대 Wedge 기능(Opportunity Intelligence)**:
   - 점수 숫자 경쟁 대신, 실제 상업 질의에서 경쟁사가 선택되는 이유(Citation Gap, Recommendation Gap, Claim-Evidence, Entity Conflict, Competitor Reason)를 규명.

---

## 3. 단계별 개발 구현 계획 (Phase 0 ~ Phase 1 Vertical Slice)

### Phase 0: 데이터 계약 및 신뢰도 Envelope 확립 (착수 단계)
- [ ] **Result Envelope 스키마**: 모든 진단 결과에 `provenance`, `ruleVersion`, `methodVersion`, `coverage`, `confidence` 메타데이터 표준화.
- [ ] **Readiness vs Performance 모델 분리**: `SEO/AEO/GEO Readiness` 점수 객체와 `Observation Performance` 객체의 Drizzle DB 스키마 및 인터페이스 정의.
- [ ] **Rule Registry 영구 식별자**: `{DOMAIN}_{AREA}_{NNN}_{NAME}` 네이밍 및 버전 마이그레이션 규칙 적용.

### Phase 1: 첫 번째 Vertical Slice 구현 (핵심 차별화 실증)
```text
상업적 Prompt Cluster 1개 (예: "기업용 온톨로지 AI 플랫폼 추천")
  ↓
Observation Runner (반복 실행 n>=5, 표본/분산 기록)
  ↓
Mention / Recommendation / Citation 파서
  ↓
Competitor Reason Matrix (자사 vs 경쟁사 Claim/Evidence 대조)
  ↓
Action Priority 생성 (Impact × Business Relevance / Effort)
  ↓
UI 반영 및 Recheck 플로우
```

---

## 4. 현재 작업 진행 상태 및 다음 작업
- **2026-08-20 (Gemini)**: 마스터 플랜 v1.0 등록 및 검토 완료. Phase 0 스키마/계약 인터페이스 정의 작업 착수.
