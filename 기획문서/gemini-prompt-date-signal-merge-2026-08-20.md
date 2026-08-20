> 이 파일은 Gemini(Antigravity)에게 그대로 전달할 작업 프롬프트다. **1순위
> (`gemini-prompt-category-listing-signal-2026-08-20.md`) 작업이 끝나고
> Claude가 검수·push한 뒤에 시작해라.** 이 작업은 Page Type이 아니라
> Scoring Rule Registry 구조를 건드리기 때문에 순서를 지켜야 한다 — 두
> 작업이 겹치면 registry 관련 테스트가 어느 쪽 변경 때문에 깨졌는지
> 구분하기 어려워진다.
>
> 실행 전에 먼저 읽을 것(순서대로):
> 1. `registry-fact-dependency-audit-2026-08-20.md` (이 작업이 고치는
>    문제의 원본 발견 기록)
> 2. `score-reliability-improvement-plan-2026-08-20-v2-final.md` §3-3
> 3. `lib/v2/registry/{atomic-checks,scoring-rules}.ts`,
>    `lib/v2/checks/{seo,geo-fact,index}.ts`, `lib/v2/scoring.ts` 전체
> 4. `tests/v2/registry.test.ts` (지금 뭘 고정해두고 있는지 반드시 확인)

---

# Gemini에게: date.signal 사고형 중복 정리 (Rule Registry 구조 변경)

## 이게 왜 다른 작업보다 조심스러운가

1순위(Page Type)는 신호를 추가/분기하는 작업이라 잘못되면 confidence
숫자만 바뀐다. 이번 작업은 **Scoring Rule Registry의 atomicChecks 배열과
atomic check 개수 자체를 바꾼다** — `tests/v2/registry.test.ts`가 고정해둔
불변식(SEO 34개, GEO_FACT 12개, 전체 61개, SEO weight 합 100, GEO_FACT
raw 합 40 등)을 건드릴 수 있다. **이 숫자들이 왜 바뀌는지 설명 못 하면
바꾸면 안 된다.**

## 문제 재확인

`registry-fact-dependency-audit-2026-08-20.md`가 코드 대조로 확인한 것:

| | SEO 축 | GEO_FACT 축 |
|---|---|---|
| Atomic Check | `AC-SEO-DATE-PRESENT` | `AC-GF-DATE` |
| 적용 범위 | ARTICLE_BLOG/DOCUMENTATION만(evaluator 내부 분기로 처리) | ARTICLE_BLOG/DOCUMENTATION만(`appliesTo` 필드로 registry 레벨에서 처리) |
| PRESENT/INVALID/ABSENT → 상태 | PASS/WARN/FAIL | PASS/WARN/FAIL (완전히 동일) |
| 소속 Rule | `SR-SEO-DATE`(weight 3) | `SR-GF-AUTHOR-DATE`(weight 5, `AC-GF-AUTHOR`와 worst-of) |

두 check가 같은 `date.signal` Fact를 놓고 완전히 같은 질문(존재·유효성)을
완전히 같은 판정 로직(PRESENT→PASS/INVALID→WARN/ABSENT→FAIL)으로 두 번
계산한다. 적용 페이지 범위도 같다. **question 문구만 다를 뿐 사고형
중복이다.**

## Claude(PO)의 결정 — 이대로 구현해라

옵션을 스스로 고르지 마라. 다음 설계로 확정한다:

**`AC-GF-DATE`를 제거하고, `SR-GF-AUTHOR-DATE`가 `AC-GF-AUTHOR`와
`AC-SEO-DATE-PRESENT`(SEO 축의 기존 check를 그대로 재사용)를 묶도록
바꾼다. Weight는 건드리지 않는다** — `SR-GF-AUTHOR-DATE`는 여전히 5점,
`SR-SEO-DATE`도 여전히 3점이다. 로직을 하나로 합칠 뿐 배점 재분배는
하지 않는다(재분배는 calibration 없이 하지 않는다는 원칙 유지).

### 왜 이 방향인가

- "SEO_FACT 축 하나에서만 배점하고 GEO_FACT는 그 결과를 참조하는 구조가
  더 정직하다"는 기획안 §3-3의 권고를 그대로 따른다.
- Weight를 안 건드리면 SEO 100점/GEO_FACT raw 40점 총합이 그대로
  유지된다 — 가장 리스크가 낮은 변경이다.
- `AC-SEO-DATE-PRESENT`가 이미 있는 유일한 date 판정 로직이 되고, GEO는
  그 결과를 재사용만 한다. 로직이 한 곳에만 존재하게 된다.

## 구현 단계

### 1. `SR-GF-AUTHOR-DATE`의 atomicChecks 변경

`lib/v2/registry/scoring-rules.ts`:
```ts
// 기존
atomicChecks: ["AC-GF-AUTHOR", "AC-GF-DATE"],
// 변경
atomicChecks: ["AC-GF-AUTHOR", "AC-SEO-DATE-PRESENT"],
```

### 2. `AC-GF-DATE`를 atomic-checks.ts에서 제거

`lib/v2/registry/atomic-checks.ts`의 `GEO_FACT_ATOMIC_CHECKS`에서
`AC-GF-DATE` 항목을 삭제한다. `lib/v2/checks/geo-fact.ts`의
`GEO_FACT_CHECK_EVALUATORS["AC-GF-DATE"]` evaluator도 삭제한다(더 이상
어떤 rule도 참조하지 않으므로 orphan이 되면 안 된다 — 완전히 제거).

### 3. 적용성(applicability) 메커니즘 차이를 반드시 확인해라

**이게 이 작업에서 가장 위험한 지점이다.** `AC-GF-DATE`는 registry의
`appliesTo: ["ARTICLE_BLOG", "DOCUMENTATION"]` 필드로 `resolveApplicability()`
가 자동으로 N_A/UNCERTAIN 처리했다. 반면 `AC-SEO-DATE-PRESENT`는 registry
필드에 `appliesTo` 제한이 없고(`"ALL"`), evaluator 함수 내부에서
`pageType.type === "UNKNOWN"` → UNKNOWN 반환, 그 외 `dateRelevant` 계산
후 아니면 `na(...)` 반환하는 방식으로 **직접** 처리한다.

두 메커니즘이 같은 결과를 내는지 직접 실행해서 확인해라 — 특히:
- Page Type이 `PROVISIONAL`인 경우(AUTO_ASSIGNED 아님): `AC-GF-DATE`는
  `resolveApplicability`가 무조건 UNCERTAIN(→UNKNOWN)을 반환했다.
  `AC-SEO-DATE-PRESENT`의 evaluator는 `pageType.type`이 PROVISIONAL이어도
  `pageType.type === "UNKNOWN"`이 아니므로(타입 자체는 정해져 있음)
  내부 `dateRelevant` 분기를 그대로 타서 다른 결과를 낼 수 있다. **이
  차이를 실제로 재현해서(합성 HTML로 PROVISIONAL 페이지를 만들어서) 확인
  하고, 만약 결과가 달라지면 어느 쪽이 옳은지 판단해서 보고해라** —
  임의로 아무 쪽이나 골라서 조용히 넘어가지 마라.

### 4. Registry 불변식 테스트 갱신

`tests/v2/registry.test.ts`에서 다음이 바뀐다 — **왜 바뀌는지 주석으로
남기고 숫자만 조용히 고치지 마라**:
- `ATOMIC_CHECKS`가 61개 → 60개(AC-GF-DATE 제거)
- `AC-GF-` prefix count가 12개 → 11개
- `crossDomainFactTypes`(§"중복 배점 통제" describe 블록)에서
  `date.signal`이 더 이상 SEO/GEO 양쪽에서 별도 atomic check로 잡히는
  케이스가 아니게 될 수 있다 — `buildRegistryIntegrityReport()`의
  `crossDomainFactTypes` 계산 로직(`lib/v2/registry/integrity.ts`)이
  `seoScoredCheckIds`/`geoScoredCheckIds`를 어떻게 구성하는지 먼저
  읽어봐라. `AC-SEO-DATE-PRESENT`가 이제 GEO_FACT rule에서도 참조되므로
  이 check가 "SEO에서만 쓰이는지 GEO에서도 쓰이는지" 판단하는 로직
  자체를 다시 봐야 할 수 있다. 여기서 무슨 값이 나오든 **왜 그런
  결과가 나오는지 설명 가능해야** 테스트를 그 값으로 고정해라.
- `sharedAtomicChecks` 목록에 `AC-SEO-DATE-PRESENT`가 새로 추가될 수
  있다(이제 `SR-SEO-DATE`와 `SR-GF-AUTHOR-DATE` 두 rule이 참조하므로).
  기존 테스트("여러 rule이 공유하는 atomic check는 AC-SEO-INDEX-INTENT
  하나뿐이다")가 이걸 잡아낼 것이다 — 목록에 추가하고 `totalWeightExposed`
  값을 실제로 계산해서(3+5=8이어야 한다) 갱신해라.

### 5. 기존 fixture 15개 + Vitest 전체 회귀 확인

특히 date 관련 fixture(F03 article 등 datePublished/dateModified가 있는
fixture)의 SEO/GEO_FACT 점수가 바뀌는지 확인해라. Weight를 안 바꿨으니
로직이 정말 동일하다면 점수가 안 바뀌어야 한다 — 만약 바뀐다면 3번에서
발견한 적용성 메커니즘 차이 때문일 가능성이 높다.

## 반드시 지켜야 할 것

이전 두 라운드에서 반복해서 걸린 패턴이다 — `gemini-feedback-p4-p7-review-
2026-08-20.md` 참고:

1. **테스트가 실제로 격리해서 검증하는지 값을 찍어서 먼저 확인해라.**
2. **fixture corpus에 새 파일을 추가하지 마라**(evidence.test.ts:20이
   15개로 고정).
3. **재실행 결과라고 쓰려면 진짜 재실행해라.**
4. **이번 작업 고유 규칙: registry 불변식 테스트의 숫자를 고칠 때마다
   "왜 이 숫자로 바뀌는지"를 주석 또는 커밋 메시지에 한 문장으로
   남겨라.** 테스트를 통과시키려고 숫자만 바꾸는 건 이 프로젝트에서
   가장 나쁜 패턴이다(registry.test.ts 자체가 "숫자가 조용히 늘어나지
   못하게 막는" 목적으로 존재한다).

## 완료 기준

1. `AC-GF-DATE` 완전 제거(registry + evaluator), orphan 없음.
2. Registry 불변식 테스트 전부 갱신 + 왜 바뀌었는지 주석.
3. 3번(적용성 메커니즘 차이) 검증 결과를 커밋 메시지 또는 별도 노트에
   구체적으로 남긴다 — 차이가 있었는지 없었는지, 있었다면 어떻게
   처리했는지.
4. Vitest 전체 + fixture 15개 회귀 없음(또는 회귀가 있다면 왜인지 설명).
5. TypeScript/ESLint/vinext build 통과.
6. DOCUMENT_MATRIX.md에 변경 사유 기록.

## push 금지 — 이번엔 특히 더 중요하다

Rule Registry 구조 변경이라 **로컬 커밋까지만 하고 절대 push하지 마라.**
Claude가 3번(적용성 메커니즘 차이) 검증 결과를 직접 재확인하고, 필요하면
사용자에게 최종 확인을 받은 뒤에 push한다.
