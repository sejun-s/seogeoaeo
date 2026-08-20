# CiteGraph 데이터 신뢰성 감사

> **프로젝트명**: CiteGraph (`seogeoaeo`)  
> **문서명/역할**: 점수·Evidence·재현성·실패 처리 감사  
> **버전**: `2026.08.19-v1.1`  
> **최종 갱신일**: 2026-08-19  
> **작업 담당 AI**: OpenAI Codex  
> **사용 모델**: GPT-5  
> **문서 상태**: 기획 검토안 — 구현 승인 전 읽기 전용 감사

## 1. 결론

v2 Fact Engine의 결정론·6상태·coverage 계약은 현재 가장 신뢰도가 높은 자산이다. v1 저장 모델은 evidence provenance와 coverage가 부족하다. 감사에서 발견한 Compare 합성 AI 관측 지표는 2026-08-19 신뢰 복구 slice에서 제거되어 실제 관측 없이는 `UNAVAILABLE`이다.

## 2. 신뢰성 표

| 항목 | 상태 | 근거 | 판단 |
|---|---|---|---|
| v1 결정론 | COMPLETE | ruleset/hash/cache, v1 보존 테스트 | 같은 입력·version 재현 가능 |
| v1 Evidence | PARTIAL | excerpt 중심 DB | 원본 artifact/hash/provenance 부족 |
| v1 실패 상태 | PARTIAL | API error mapping | `audit_runs` failed 저장이 route 오류 경로와 연결되지 않음 |
| v2 Fact/Evidence | COMPLETE(메모리 범위) | 15 fixture, deterministic ID/hash | provenance 구조와 absence/invalid 보존 우수 |
| v2 coverage/N_A/UNKNOWN | COMPLETE(계산 범위) | scoring tests | 미측정을 실패/성공으로 흡수하지 않음 |
| v2 persistence | MISSING | preview DTO만 반환 | 재조회·감사로그·비교 불가 |
| GEO Semantic | BLOCKED | 전부 NOT_EVALUATED | 사람 합의 corpus/provider 없음 |
| GEO Overall | NOT_NEEDED 현재 | 명시적 미산출 | calibration 전 결합 금지 준수 |
| Compare SEO category/finding | PARTIAL | v1 snapshot 수평 비교 | page type/표본 동등성 통제 없음 |
| Compare AI metrics | UNAVAILABLE | `lib/compare/normalize.ts` | 합성치 제거; 실제 provider observation 없음 |

## 3. Critical 신뢰성 결함

### DR-01 — 합성 citation/mention 지표 (해결 완료)

```ts
citationRate = GEO PASS count / 15
brandMentionRate = GEO Readiness Score
averageCitationPosition = citationRate > 0 ? 1.5 : null
```

기존에는 실제 AI response, question cohort, engine, model, region, timestamp, citation URL이 없는데도 Citation Rate로 표시하고 winner ranking에 사용했다. 현재는 세 지표가 null이며 데이터/UI에 `UNAVAILABLE`을 명시하고 순위 계산에서 제외한다.

결정: 비교 화면의 해당 지표와 winner를 제거하거나 `UNAVAILABLE`로 격리하기 전까지 Compare는 AI Visibility 기능으로 판매 금지.

### DR-02 — v1 DB에 폐기된 복합점수 컬럼 잔존

`audit_results`에 `s_seo_score`, `r_tech_score`, `r_sem_score`, `oci_score`, `tier0_*`가 존재하고 default 0으로 생성된다. 현행 정본은 OCI 결합을 금지하며 서비스는 이 필드를 사용하지 않는다. schema와 migration이 과거 설계를 계속 암시한다.

결정: migration/rollback 승인 후 deprecate 또는 별도 legacy table로 격리. 이번 감사에서는 변경하지 않음.

### DR-03 — v2 Evidence가 영속되지 않음

v2 `EvidenceRecord`는 source type, hash, observedAt, tool version에 가까운 구조를 가지지만 API 응답 이후 사라진다. 동일 결과 재조회와 사용자 evidence drill-down이 불가능하다.

### DR-04 — redirect provenance 손실

redirect마다 guard는 재실행하지만 `FetchedDocument`에 hop list가 없고 v2 snapshot `redirectChain`도 빈 배열이다. TSEO-01의 redirect chain evidence를 충족하지 못한다.

## 4. 계산식 감사

### v1

- PASS=1, WARN=0.5, FAIL=0의 35개 정본 규칙
- SEO/GEO 각각 100점 envelope
- 결정론적이나 현행 방법론 문서가 이미 heuristic 과대 PASS 가능성을 기록함
- DB에는 score만 있고 coverage/confidence가 없음

### v2

- measured score = earnedWeight / measuredWeight
- coverage = measuredWeight / applicableWeight
- N_A만 applicableWeight에서 제외; UNKNOWN/NOT_EVALUATED는 coverage를 낮춤
- SEO Fact 18 rules/100, GEO Fact raw 40, Semantic NOT_EVALUATED
- provisional weight이므로 공식 성능 보장으로 판매 금지

## 5. 데이터 출처와 원본 보존

현재 출처는 HTTP response header 일부와 static HTML뿐이다. HTML은 hash 계산에 사용되지만 원문 artifact 자체는 저장하지 않는다. DB evidence는 excerpt만 저장한다. robots.txt, sitemap, rendered DOM, Lighthouse, CrUX, GSC, SERP, AI response 원본은 없다.

필수 보완 계약:

```text
Artifact(uri, sha256, kind, collectedAt, tool, toolVersion, retentionUntil, accessScope)
Evidence(artifactId, selector/jsonPath, excerpt, sourceUrl, status)
RuleResult(ruleVersion, state, confidence, coverageContribution, evidenceIds)
```

## 6. 실패·부분 성공

- fetch timeout 15초, HTML 2MB, content-type, redirect 5회 제한은 존재한다.
- Compare는 URL별 실패를 PARTIAL/INSUFFICIENT로 표현한다.
- 단일 audit의 schema는 PARTIAL을 허용하지만 현재 service는 성공 결과만 저장하며 실패 run persistence가 route catch와 연결돼 있지 않다.
- 외부 데이터가 없으므로 `UNAVAILABLE` 모델이 제품 전반에 아직 정착하지 않았다.

## 7. Confidence 평가

현재 v2 UI의 coverage는 실제 계산값이다. 그러나 별도 confidence 공식은 구현되지 않았다. `coverage < 0.8`에서 High Confidence 금지 규칙을 UI와 export에 강제할 모델이 없다. v1 결과에는 coverage 자체가 없다.

## 8. 수용 테스트

1. 같은 snapshot/version을 반복 분석하면 Fact, Evidence ID, rule state, score, coverage가 동일하다.
2. raw HTML artifact SHA-256과 저장 artifact 재계산값이 같다.
3. redirect 각 hop의 status/from/to와 guard 결과를 재조회할 수 있다.
4. N_A/UNKNOWN/NOT_EVALUATED는 이유 없이 생성되지 않는다.
5. AI observation이 없으면 citation/mention/position은 숫자가 아니라 UNAVAILABLE이다.
6. coverage 80% 미만 결과는 High Confidence로 표시되지 않는다.
7. 제품 update와 site content update의 score delta를 구분한다.
