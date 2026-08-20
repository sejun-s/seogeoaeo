> **문서 상태**: 검증 결과 (비-정본) — Registry 코드에 대한 관측 기록이다.
> 이 문서 자체가 Weight나 Rule을 바꾸지 않는다. `score-reliability-improvement-
> plan-2026-08-20-v2-final.md` §5 P3(조건부 승인: 리포트까지만)의 산출물이다.

# Registry Fact Dependency Audit

작성일: 2026-08-20 · 대상: `lib/v2/registry/{atomic-checks,scoring-rules}.ts`

## 방법

`lib/v2/registry/integrity.ts`의 `buildRegistryIntegrityReport()`가 이미
SEO 점수 rule과 GEO_FACT 점수 rule이 공유하는 FactType을 계산해서
`crossDomainFactTypes`로 반환하고 있었다(코드 확인 완료, 새로 만든 게 아니다).
이 리포트는 그 결과 2건 각각을 실제 evaluator 코드까지 열어서 "다각도 사용"과
"사고형 중복"으로 분류한다(기획안 §3-3 기준).

```
실측: crossDomainFactTypes = ["content.main_text", "date.signal"]
(tests/v2/registry.test.ts가 이 목록을 고정 — 3번째 항목이 생기면 테스트가 깨진다)
```

## 1. `date.signal` — 사고형 중복 (판정: 병합 검토 대상)

| | SEO 축 | GEO_FACT 축 |
|---|---|---|
| Atomic Check | `AC-SEO-DATE-PRESENT` | `AC-GF-DATE` |
| Question | "필요한 날짜 신호가 존재·유효한가" | "typed date provenance가 있는가" |
| 적용 범위 | ARTICLE_BLOG/DOCUMENTATION만 (evaluator 내부 분기) | ARTICLE_BLOG/DOCUMENTATION만 (`appliesTo`로 Registry 레벨 제한) |
| PRESENT | PASS | PASS |
| INVALID | WARN | WARN |
| ABSENT | FAIL | FAIL |
| 소속 Rule | `SR-SEO-DATE`(maxWeight 3) | `SR-GF-AUTHOR-DATE`(maxWeight 5, `AC-GF-AUTHOR`와 worst-of 결합) |

**판정**: 처음엔 "GEO 쪽은 page type 게이팅이 없다"고 잘못 판단했다가
`atomic-checks.ts:86`을 다시 읽고 정정했다 — `AC-GF-DATE`도 `appliesTo:
["ARTICLE_BLOG", "DOCUMENTATION"]`으로 이미 제한돼 있다. 즉 두 check는
**적용 페이지 범위, 판정 상태 매핑(PRESENT/INVALID/ABSENT → PASS/WARN/FAIL)이
완전히 동일하다.** question 문구만 다를 뿐 "같은 질문을 두 번 하는" 경우다.
`tests/v2/registry.test.ts`의 기존 안전장치("공유 factType마다 SEO/GEO의
atomic question이 서로 다르다")는 **question 문자열만 비교**하기 때문에 이
중복을 못 잡는다 — 문구가 다르면 통과하는 얕은 검증이었다는 게 이번 감사의
핵심 발견이다.

**주의 — v1 실측 데이터를 여기 근거로 쓰지 않는다**: 실전 검증 리포트가
"작성일 신호 하나가 없으면 SEO와 GEO 점수가 동시에 깎인다(19개 중 14개
동시 실패)"고 관측한 건 **v1의 `GEO-TRUST-002`/`SEO-CONTENT-004`**다. 이건
v2의 `SR-SEO-DATE`/`SR-GF-AUTHOR-DATE`와 이름이 다른 별개 코드 경로이며,
아직 이 조합으로 실제 실전 데이터를 뽑아본 적이 없다. 위 표의 판정은
**정적 코드 대조만으로 내린 것**이지 v2의 실측 co-failure율로 확인한 게
아니다. 이 구분을 흐리면 안 된다.

**권고**: 지금 병합/제거는 안 한다(1차 개발 범위 아님). 다음 라운드에서:
1. 실전 검증을 v2로 재실행해 `SR-SEO-DATE`/`SR-GF-AUTHOR-DATE`의 실제
   co-failure율을 측정한다
2. `AC-GF-AUTHOR`와 `AC-GF-DATE`가 같은 rule(worst-of)에 묶여 있어서
   date.signal 하나의 실제 "단독 영향력"이 5pt 전부인지 일부인지 애매하다 —
   이것도 분리해서 다시 봐야 한다
3. 병합한다면 "같은 Fact를 두 축에서 별도 rule로 배점"이 아니라 "SEO_FACT
   축 하나에서만 배점하고 GEO_FACT는 그 결과를 참조"하는 구조가 더 정직하다

## 2. `content.main_text` — 다각도 사용 (판정: 유지)

| Atomic Check | 축 | Question | 판정 로직 |
|---|---|---|---|
| `AC-SEO-BODY-AMOUNT` | SEO | "page type 대비 main text가 **충분**한가" | 항상 UNCALIBRATED(계산 안 함) |
| `AC-GF-RAWCONTENT` | GEO_FACT | "raw HTML에 핵심 본문이 **있는가**" | 길이 ≥250자 PASS, 0<길이<250 WARN, 0 FAIL (shell 탐지) |
| `AC-GF-LANDMARK` | GEO_FACT | "main landmark가 핵심 text를 **포함**하는가" | landmark 내부 text 비율 |

**판정**: 세 check가 묻는 질문이 실제로 다르다 — 충분성(현재 미계산) vs
존재 여부(shell 탐지) vs 구조적 포함 관계. 코드 레벨에서 로직이 중복되지
않는다. **다각도 사용으로 유지한다. 조치 불필요.**

## 3. Registry 안전장치 자체의 약점 (이번 감사에서 발견)

`tests/v2/registry.test.ts`의 "공유 factType마다 SEO/GEO의 atomic question이
서로 다르다" 테스트는 §1처럼 question 문구만 다르고 실제 판정 로직이 동일한
경우를 잡지 못한다. 이건 이번 라운드에서 고치지 않는다(테스트 로직 변경은
scope 밖) — 다만 다음 라운드에서 "판정 상태 매핑이 동일한가"까지 비교하는
더 엄격한 테스트로 보강할 필요가 있다는 것만 여기 기록해둔다.

## 4. 결론

| Fact | 판정 | 조치 |
|---|---|---|
| `date.signal` | 사고형 중복 (병합 검토 대상) | 이번 라운드 미조치 — v2 실측 후 재논의 |
| `content.main_text` | 다각도 사용 | 조치 불필요 |

기획안 §5 P3 범위(리포트까지만, Rule Weight 즉시 수정 금지)를 그대로
지켰다 — 이 문서는 코드를 바꾸지 않았다.
