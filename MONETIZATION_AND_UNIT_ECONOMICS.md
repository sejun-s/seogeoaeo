# CiteGraph 수익화 및 Unit Economics 감사

> **프로젝트명**: CiteGraph (`seogeoaeo`)  
> **문서명/역할**: 무료/유료 경계·계량·원가·업셀 감사  
> **버전**: `2026.08.19-v1.0`  
> **최종 갱신일**: 2026-08-19  
> **작업 담당 AI**: OpenAI Codex  
> **사용 모델**: GPT-5  
> **문서 상태**: 기획 검토안 — 가격·결제 승인 전

## 1. 결론

현재 제품에는 subscription, plan, trial, entitlement, UsageLedger, limit, invoice, payment provider가 전혀 없다. 따라서 매출·COGS·gross margin을 실측할 수 없고 유료 기능을 안전하게 열 수 없다. 지금 가능한 것은 무료 단일 URL 감사 acquisition prototype뿐이다.

## 2. 현재 수익화 지도

| 영역 | 상태 | 근거/결손 |
|---|---|---|
| 무료 감사 | PARTIAL | 익명 무제한 단일 URL 요청; email/domain ownership/rate limit 없음 |
| Paywall | MISSING | entitlement middleware 없음 |
| 사용량 계량 | MISSING | URL/fetch byte/render/AI/storage ledger 없음 |
| 비용 상한 | MISSING | 2MB·15초 기술 제한만 있고 tenant budget 없음 |
| Trial activation | MISSING | user/workspace/event 없음 |
| 결제 | MISSING | provider/package/webhook/schema 없음 |
| 좌석/워크스페이스 | MISSING | identity/membership 없음 |
| AI/SERP credit | BLOCKED | provider도 UsageLedger도 없음 |
| 마진 dashboard | MISSING | revenue/unit cost 없음 |
| Agency upsell | MISSING | multi-client/white-label/report delivery 없음 |

## 3. 현재 비용 노출

- 익명 사용자가 공개 URL을 반복 fetch할 수 있다.
- Compare 한 요청이 최대 5개 URL을 순차 fetch하고 D1 write를 발생시킨다.
- rate limit, domain verification, workspace quota, daily cap이 없다.
- cache는 같은 normalized URL/ruleset/input hash에 적용되지만 매 요청 DNS/fetch 후 hash를 계산하므로 origin/network 비용은 먼저 발생한다.
- rendering/LLM/SERP가 아직 없어 고변동비는 낮지만, 이를 추가하기 전에 UsageLedger가 필수다.

## 4. 측정할 원가 단위

```text
static_fetch_count
downloaded_bytes
audit_cpu_ms
d1_reads / d1_writes
artifact_storage_bytes_day
rendered_url_count
lighthouse_run_count
external_api_units(provider, endpoint)
ai_prompt_run(engine, model, repetitions)
report_render_count / delivery_count
support_minutes_estimate
```

```text
Gross Margin per Workspace =
  Recognized Subscription Revenue
  - Crawl/Worker Compute
  - Browser/Lighthouse Compute
  - Provider API Cost
  - LLM Cost
  - Storage/Egress
  - Expected Support Cost
```

현재 값은 모두 미측정이므로 가격표를 확정하면 안 된다.

## 5. 권장 무료/유료 경계

### Free acquisition

- 검증된 1개 도메인, 단일 URL 또는 낮은 월 cap
- v1/v2 Fact 결과의 핵심 issue 3개
- evidence 예시 1개
- 실제 AI Visibility, rendered crawl, 대규모 compare는 제공하지 않음

### Paid core

- 프로젝트와 scan history
- 원본 artifact/evidence 전체
- 수동 재검증과 before/after
- crawl policy, URL cap, usage view
- JSON/CSV export

### Growth/Agency

- 예약·증분 scan
- GSC/CrUX connector
- competitor set과 동등 표본 비교
- 작업 상태와 고객 보고
- white-label/portfolio는 반복 사용이 확인된 뒤

### Credit add-on

- AI/SERP는 `engine × question × repetition` 예상량과 원가를 실행 전에 표시
- hard cap, retry cost, failed-call billing 정책 필수

## 6. 업셀 경로

```text
무료 evidence audit
→ 프로젝트 저장 및 전체 evidence
→ 재검증/이력/예약
→ GSC·CrUX 성과 연결
→ 경쟁사·Agency 보고
→ 검증된 AI Visibility credit
```

## 7. 이탈 위험

1. 높은 점수가 실제 성과로 이어지지 않는다는 불신
2. 합성 citation metric 노출로 인한 신뢰 상실
3. 수정 workflow가 없어 보고서를 보고도 행동하지 못함
4. history/alert가 없어 재방문 이유가 없음
5. 대행사가 고객에게 전달할 durable report가 없음

## 8. 출시 전 Gate

- workspace별 UsageLedger와 immutable usage event
- plan entitlement와 server-side hard limit
- failed/retried usage 정책
- provider별 unit cost version
- abuse/rate limit/domain ownership
- 월별 margin 계산과 alert
- payment failure/grace/cancel test
- AI/SERP 예상 credit 사전 표시

## 9. 권장 실험

1. 대행사/3~20인 팀 10곳 문제 인터뷰
2. 단일 audit→첫 수정→재검증 시간 측정
3. 3개 가격안 willingness-to-pay
4. 실제 fetch/D1/support 원가 계측
5. 8주 retention과 monthly report 전달 여부 확인
