# CiteGraph Fixture Corpus Plan

> 상태: 실제 corpus 구축 완료, scoring v2 구현 전 검토 대기  
> 기준: `methodology-v2-draft.2`

계획 단계의 fixture 목록은 실제 로컬 corpus 15개로 전환되었다.

- Corpus index: [`fixtures/v2/README.md`](fixtures/v2/README.md)
- Expected outcomes: [`fixture-expected-outcomes.md`](fixture-expected-outcomes.md)
- Weight calibration: [`citegraph-weight-calibration-plan.md`](citegraph-weight-calibration-plan.md)

## 검증 순서

1. 사람 검토자가 15개 HTML과 expected outcomes를 비교한다.
2. Page type, N/A, UNKNOWN, PASS/WARN/FAIL ordering을 승인한다.
3. Registry의 Atomic Check와 Scoring Rule 조합을 승인한다.
4. Weight calibration plan의 Stage 0 결과를 기록한다.
5. 승인 전에는 scoring v2 코드를 구현하지 않는다.

## Corpus 완료 조건

- 필수 15개 유형 존재
- semantic 실행은 NOT_EVALUATED로 유지
- 임의의 정확한 점수 미사용
- noindex, canonical, schema, JS rendering, thin content의 실패 원인이 독립적으로 확인 가능
- clean/problematic 및 strong SEO/weak GEO ordering을 사람이 검토 가능
