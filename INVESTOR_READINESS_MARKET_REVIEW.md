# CiteGraph 투자 준비도 및 시장성 점검

> **프로젝트명**: CiteGraph (`seogeoaeo`)  
> **문서명/역할**: 투자 검토 관점의 시장성·제품 격차·증거 기반 개발 우선순위  
> **버전**: `2026.08.19-v1.0`  
> **최종 갱신일**: 2026-08-19  
> **작업 담당 AI**: OpenAI Codex  
> **사용 모델**: GPT-5  
> **문서 상태**: 기획 검토안 — 시장·트랙션 검증 전 잠정 평가

## Executive Summary

- **시장 존재는 확인된다.** Peec AI는 자사 공식 발표에서 2025년 11월 기준 10개월 내 ARR $4M+, 고객 1,300+, $21M Series A를 공개했다. Semrush, Ahrefs, Peec AI, Otterly는 prompt·engine·domain·project 단위의 AI visibility 상품을 운영한다.
- **CiteGraph는 아직 투자 가능한 SaaS가 아니라 신뢰성 있는 기술 prototype이다.** 결정론적 35개 규칙, v2 Evidence/Page Type/Fact/Coverage, 안전한 URL fetch는 자산이지만 workspace, 반복 workflow, usage economics, 고객·매출·retention 증거가 없다.
- **대규모 prompt index를 복제하는 전략은 피해야 한다.** Ahrefs와 Semrush는 수억 개 prompt 데이터와 기존 SEO index를 보유한다. CiteGraph의 방어 가능한 wedge는 한국 대행사를 위한 `Evidence → 수정 → 재검증 → 실제 성과` 운영 루프다.
- **다음 투자 이정표는 기능 출시가 아니라 유료 반복 사용 증명이다.** 5개 design partner, 3개 유료 pilot, 4주 재사용, 보고서 작성시간 절감, verified loop completion, workspace별 gross margin을 계측해야 한다.

## 1. 시장에서 이미 검증된 구매 단위

| 공식 제품 | 확인된 상품 구조 | CiteGraph에 주는 의미 |
|---|---|---|
| Semrush AI Visibility | 연간 결제 기준 domain당 월 $99, 25 custom prompts, 경쟁사·prompt research·AI readiness audit·보고서 add-on | readiness만으로는 부족하며 관측·경쟁·보고까지 묶여야 유료화됨 |
| Ahrefs Brand Radar | 단일 platform 월 $199, 전체 platform 월 $699, custom prompt check 사용량 과금 | AI 관측은 별도 credit/usage 제품이어야 함 |
| Peec AI | 브랜드 Starter $95부터, Agency Essential $245부터; prompt·model·project 중심 | Agency용 project/portfolio와 prompt 원가 단위가 핵심 |
| OtterlyAI | 월 $29부터, prompt 수와 engine coverage로 확장 | 저가 진입 시장이 있어 단순 모니터링만으로는 가격 방어가 어려움 |

공식 자료가 공통으로 판매하는 것은 `실제 관측`, `경쟁 비교`, `반복 추세`, `보고·공유`, `project/workspace`다. AI bot 접근 검사는 Semrush와 Ahrefs가 이미 제공하므로 시장 적합성은 있으나 단독 moat는 아니다.

## 2. 투자 준비도 평가

아래 점수는 외부 실적이 아니라 현재 저장소와 문서를 0~5로 평가한 분석 rubric이다.

| 투자 판단 축 | 점수 | 근거 | 투자자 질문 |
|---|---:|---|---|
| 시장 문제의 존재 | 4 | 유료 경쟁 제품과 Peec AI 성장 공식 발표 | 시장이 아니라 CiteGraph가 이길 이유는 무엇인가? |
| 제품 신뢰 기반 | 3 | 결정론적 규칙, SSRF guard, Evidence/coverage | 실제 고객 데이터에서도 재현되는가? |
| 반복 workflow | 1 | 수정·재검증·이력·task 없음 | 왜 다음 달에도 사용하는가? |
| 트랙션 증거 | 0 | 사용자·workspace·event·고객·매출 데이터 없음 | 누가 얼마나 자주 돈을 내는가? |
| 수익화·unit economics | 1 | UsageLedger·limit·subscription 없음 | 고객당 원가와 margin은 얼마인가? |
| 데이터 moat | 1 | 변경→재검증→성과 corpus 없음 | 시간이 갈수록 무엇이 독점 자산이 되는가? |
| Enterprise/Agency readiness | 1 | tenant·role·report·portfolio 없음 | 고객 데이터를 안전하게 분리할 수 있는가? |
| GTM 집중도 | 2 | Agency ICP는 문서에 있으나 검증 전 | 첫 10개 고객의 동일한 구매 이유는 무엇인가? |

현재 합계는 **13/40**이다. 이 값은 valuation이 아니라 개발 순서가 투자 논리를 얼마나 뒷받침하는지 보는 내부 진단값이다. 가장 큰 약점은 경쟁 기능 수가 아니라 traction과 반복 workflow의 부재다.

## 3. 투자 가능성을 높이는 기능 백로그

### P0 — 투자 실사에 필요한 증거

1. **Product analytics event foundation**
   - `audit_started/completed`, `evidence_opened`, `recommendation_viewed`, `verify_requested/completed`, `report_exported`를 workspace/project/run 기준으로 기록한다.
   - Acceptance: activation, time-to-first-verified-insight, verified loop completion, 4주 reuse를 계산할 수 있다.
2. **Tenant-safe Workspace → Project → Scan**
   - 익명 전역 history를 private workspace 경계로 전환한다.
   - Acceptance: cross-workspace read/write가 integration test에서 거부된다.
3. **v2 Artifact/Evidence/RuleResult 영속화**
   - content hash, final URL, fetch metadata, ruleset/registry/extractor version, evidence provenance를 저장한다.
   - Acceptance: 같은 snapshot을 재분석하고 결과·근거 버전을 감사할 수 있다.
4. **수정 후 재검증과 before/after**
   - Finding에서 verify를 요청하고 동일 rule의 이전·현재 상태와 evidence 변화를 표시한다.
   - Acceptance: issue→evidence→recommendation→verify가 하나의 추적 가능한 loop가 된다.
5. **UsageLedger·estimate·hard limit**
   - static fetch, byte, D1, 향후 render/provider 비용을 immutable event로 기록한다.
   - Acceptance: 재시도 중복 과금이 없고 workspace별 비용·한도·gross margin을 계산할 수 있다.

### P1 — 첫 Agency 매출에 필요한 기능

6. **Versioned JSON/CSV와 공유 가능한 web report** — 고객 납품 시간을 측정할 수 있어야 한다.
7. **AI crawler robots matrix** — GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot 계열의 allow/block/unknown과 evidence를 제공하되 종합점수에 임의 합산하지 않는다.
8. **Sitemap 기반 site scan** — 단일 URL에서 project coverage와 반복 scan으로 확장한다.
9. **GSC·CrUX 연결** — 진단 점수와 실제 노출·클릭·사용자 성능을 분리해 나란히 보여준다.
10. **Owner/status/ignore reason** — 대행사와 고객 사이의 실행 책임을 기록한다.

### P2 — 방어력과 확장 매출

11. **Change-to-Outcome dataset** — 어떤 evidence 기반 수정이 어떤 기간 뒤 성과와 연관됐는지 축적한다.
12. **Recommendation feedback** — 승인·거절·수정·효과 데이터를 규칙별로 축적한다.
13. **Versioned AI observation pilot** — 공식/허용 provider, 고정 question cohort, engine/model/region/time, 반복 표본, cost cap을 갖춘 뒤 별도 credit 상품으로 도입한다.
14. **Agency portfolio·white-label·scheduled report** — 유료 pilot의 반복 납품이 확인된 후 확장한다.

## 4. 만들지 말아야 할 것

- Ahrefs/Semrush와 경쟁하는 자체 대규모 backlink·prompt index
- 실제 관측 없는 citation probability, mention rate, market share
- GEO Readiness와 AI Visibility를 합친 단일 점수
- 근거 캘리브레이션 없이 “AI가 좋아하는 문체”를 점수화하는 기능
- traction과 margin 검증 전 무제한 AI/provider plan
- 사람 승인 없는 자동 게시

## 5. 투자자에게 보여줄 다음 이정표

목표값은 현재 실적이 아니라 내부 PRD의 검증 Gate다.

| 단계 | 최소 증거 | 제품이 증명하는 것 |
|---|---|---|
| Design partner | Agency 10곳 인터뷰, 5곳 pilot | 동일한 pain과 workflow가 반복됨 |
| Paid pilot | 3개 이상 유료 전환 | willingness-to-pay 존재 |
| Activation | 첫 verified insight 10분 이내 | 온보딩 없이 가치 도달 가능 |
| Execution | audit의 30% 이상 verify loop 진입 | 보고서가 실제 행동으로 이어짐 |
| Retention | 4주 차 재사용 조직 50% 이상 | 일회성 audit가 아님 |
| Efficiency | 보고서 작성시간 60% 절감 | Agency ROI가 명확함 |
| Economics | Beta gross margin 60% 이상 | 사용량 기반 원가가 통제됨 |

## 6. 포지셔닝 권고

현재 권장 문구:

> CiteGraph는 SEO·AI Search 대행사가 고객 사이트의 문제를 원문 근거로 검증하고, 수정·재검증·성과 보고까지 반복 운영하게 하는 Evidence-first Optimization Platform이다.

피해야 할 문구:

> 모든 AI 엔진의 노출과 인용을 예측하는 통합 AI 검색 점수 플랫폼.

## 7. 다음 개발 결정

다음 vertical slice는 **v2 Artifact/Evidence 영속화**가 적합하다. 다만 투자 증거를 만들려면 같은 milestone 안에 최소 product event schema를 포함해 “기능을 만들었다”가 아니라 “고객이 evidence를 보고 verify까지 완료했다”를 측정할 수 있어야 한다.

## 8. 출처와 한계

- [Peec AI Series A 공식 발표](https://peec.ai/blog/we-raised-21m-series-a-to-help-brands-win-in-ai-search)
- [Semrush AI Visibility 가격](https://www.semrush.com/pricing/ai/)
- [Semrush AI Visibility 기능](https://www.semrush.com/kb/1626-ai-visibility-features)
- [Ahrefs Brand Radar 공식 도움말](https://help.ahrefs.com/en/articles/11064852-what-is-brand-radar-and-how-to-use-it)
- [Ahrefs Bot Analytics 공식 도움말](https://help.ahrefs.com/en/articles/14297049-about-bot-analytics)
- [Peec AI 가격](https://peec.ai/pricing)
- [OtterlyAI 가격](https://otterly.ai/pricing)
- 저장소 근거: `CURRENT_PRODUCT_MAP.md`, `FEATURE_GAP_MATRIX.md`, `MONETIZATION_AND_UNIT_ECONOMICS.md`, 현재 코드와 테스트.

경쟁사 수치와 가격은 2026-08-19에 확인한 각 회사의 자체 발표다. 독립 감사 재무자료가 아니며 변경될 수 있다. CiteGraph에는 아직 고객·사용·매출 데이터가 없어 product-market fit, retention, CAC, LTV, 실제 gross margin은 평가할 수 없다.
