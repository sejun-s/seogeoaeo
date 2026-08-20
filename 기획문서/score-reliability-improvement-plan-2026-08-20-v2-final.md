> **문서 상태**: 기획 최종안 — 코드 반영 전, 개발 착수용
> 이력: v1(Claude 제출) → 코덱스 검토 → 이 문서(Claude, 검토 반영 + 코드 검증 + 재판단)
> 이 문서가 v1을 대체한다. v1은 히스토리로만 남긴다.

# 점수 신뢰도 개선 기획안 (최종)

작성일: 2026-08-20

## 0. 이 문서의 성격

코덱스 검토를 항목별로 그대로 수용하지 않았다. 세 갈래로 나눴다.

1. **그대로 수용** — 타당하고, 근거가 명확하고, 지금 착수해도 안전한 것
2. **정정해서 수용** — 방향은 맞지만 전제가 틀렸거나(코드로 확인함) 범위가
   과하거나 부족한 것
3. **보류/거부** — 지금 이 라운드의 목표(점수 신뢰도의 상업적 근거 확보)에
   비해 시기상조이거나, 코덱스도 스스로 §17에서 자기비판한 것

목표는 하나다: **점수 신뢰도를 상업성 있게 만드는 것.** 그 기준으로
모든 항목을 다시 걸렀다.

## 1. 그대로 수용한다

### 1-1. 4계층 신뢰도 분리 (코덱스 §0)

Measurement → Classification → Scoring → External Validity. 지금 CiteGraph는
1~3만 다루고 있고, 4(외부 타당성)를 검증하지 않은 채 점수를 "실제 검색/AI
인용 성과의 예측값"처럼 보여주면 안 된다는 지적은 정확하다. 이건 세션
초반에 이미 한 번 겪은 실수(v3 R_SEM/OCI — 검증 없는 "semantic" 점수를
합쳐서 하나의 지수로 판 것)와 같은 패턴이다. **수용**하고, 이 4계층을
이후 모든 논의의 공통 어휘로 쓴다.

### 1-2. UNKNOWN 감소 ≠ 정확도 향상 (코덱스 §1.1)

내 원안(v1)의 완료 기준이 "UNKNOWN 68% → ?"만 측정하도록 돼 있었던 건
실제 결함이다. UNKNOWN이 줄어도 그게 PRODUCT를 ARTICLE로 잘못 분류한
결과라면 개선이 아니라 악화다. **수용**하고, 사람이 라벨링한 최소 벤치마크를
1차 개발 범위에 넣는다(단, 규모는 조정 — §4 참고).

### 1-3. Signal Family — 상관 신호의 confidence 중복 상승 방지 (코덱스 §2)

이건 이번 검토에서 가장 날카로운 지적이다. 그리고 실제로 이 프로젝트가
이미 한 번 겪었던 문제의 재발 패턴이다 — 세션 초반에 "article+multi-h2+
paragraphs" 신호를 추가했을 때 기존 schema 기반 신호와 충돌해서 F08이
DOCUMENTATION → UNKNOWN으로 역행한 적이 있고, `schemaTypes.length === 0`
가드로 겨우 막았다. 그때는 "신호 하나가 다른 신호를 잠식하는" 사고였는데,
코덱스가 지적한 건 그 사고의 더 일반화된 원인이다 — `/blog/` 경로 +
Article schema + `<article>` + `og:type=article`이 사실 CMS 하나가
같은 사실을 4번 표현한 것뿐인데 이걸 4개의 독립 증거로 세면 confidence가
부풀려진다. **수용**하고 2-A의 핵심 설계 원칙으로 삼는다.

### 1-4. Frozen Real-World Corpus + Live Validation 분리 (코덱스 §14)

"우리 코드가 변했나, 사이트가 변했나"를 구분 못 하면 회귀 판정 자체가
불가능하다. 실제 20개 URL은 이번 검증 이후 이미 살아있는 사이트라 다음 달
재실행하면 HTML이 바뀌어 있을 수 있다. **수용** — 단 실행 방법은 조정한다
(§4 참고: 공개 저장소라는 제약 때문).

### 1-5. Sensitivity / Monotonicity Test (코덱스 §11, §12)

"author 하나 추가했더니 GEO가 22점 뛴다" 같은 건 rule weight가 아니라
버그 후보다. 이건 코드 몇 줄이 아니라 테스트 인프라라서 리스크가 거의
없다. **수용**, 1차 개발에 포함.

### 1-6. GEO Score → GEO Readiness 네이밍 재검토 (코덱스 §16)

외부 타당성이 검증되지 않은 지수를 "Score"라고 부르면 사용자가 실제 검색
성과의 예측치로 오인할 수 있다. **수용** — 단 시점 조정: 지금 UI 문자열을
건드리면 Gemini가 진행 중인 UI 통일 작업과 충돌한다. Gemini 작업 완료·
검수 후에 반영한다.

## 2. 정정해서 수용한다 (코드로 확인한 사실과 다른 부분)

### 2-1. Applicable Coverage — 이미 구현돼 있다

코덱스 §5는 "coverage가 raw coverage(전체 rule 대비)로 계산되고 있어서
Applicable Coverage를 새로 정의해야 한다"고 썼다. **틀렸다.**
[`lib/v2/scoring.ts:125-129`](citegraph-app/lib/v2/scoring.ts)를 보면:

```
coverage = measuredWeight / applicableWeight
applicableWeight = N_A를 제외한 rule의 maxWeight 합
```

이미 "Applicable Coverage"다. 어제 실전 검증 리포트에 적힌 "SEO coverage
40%, GEO coverage 30%"도 이미 이 정의로 계산된 값이다 — raw coverage가
아니다. **P3(Applicable Coverage 정의)는 할 일 목록에서 제거한다.** 이미
있는 걸 다시 만들면 시간 낭비다.

실제로 없는 것은 코덱스 §5의 두 번째 절반, **UNKNOWN Reason Distribution**
뿐이다. 이건 2-2와 합쳐서 처리한다.

### 2-2. UNKNOWN Reason Taxonomy — 절반은 이미 있다

`AtomicCheckResult.rationaleCode`가 이미 모든 UNKNOWN/N_A에 사유를 강제
부여하고 있다(`types.ts:242` 주석: "UNKNOWN/N_A는 반드시 값이 있어야 한다").
`AtomicCheckStatus`(`EXPERIMENTAL`/`ADVISORY`/`CONTEXT_REQUIRED`/
`DEFERRED_INPUT` 등)도 이미 check 단위로 미확정 사유를 구분하고 있다.

**진짜 빠진 것**: `rationaleCode`가 자유 문자열(`"AC-GF-AUTHOR:no-author-signal"`
같은 형태)이라 집계가 안 된다. 코덱스가 제안한 5개 reason
(`UNCALIBRATED`/`EXTRACTION_FAILURE`/`CLASSIFICATION_UNCERTAIN`/
`INSUFFICIENT_EVIDENCE`/`UNSUPPORTED`)을 **rationaleCode 앞에 붙는 고정
prefix enum**으로 표준화하고, 리포트에서 이 prefix로 집계만 하면 된다.
새 필드를 추가하는 게 아니라 기존 문자열 규약을 좁히는 정도의 작업이다.
**범위를 축소해서 수용.**

### 2-3. Explainability — 데이터 계층은 이미 있다

코덱스 §13은 "Score → Category → Rule → Fact → Evidence 추적 구조가
필요하다"고 제안했는데, `RuleResultV2`/`AtomicCheckResult`에
`factIds`/`evidenceIds`/`rationaleCode`가 이미 있어서 데이터 계층은
**이미 존재한다.** 없는 건 이걸 사람이 읽을 수 있게 리포트/UI로
뽑아내는 부분뿐이다. 이건 UI 작업이라 Gemini 이후 순서로 미룬다(1-6과
동일한 이유). **1차 개발에서는 "이미 있는 데이터로 리포트 스크립트만
작성" 수준으로 축소.**

## 3. 보완한다 (코덱스 문서에 없던 것, 내가 추가)

### 3-1. Frozen Corpus의 저작권/ToS 문제 — 코덱스가 놓친 부분

이 저장소는 **공개(public)** 저장소다(`github.com/sejun-s/seogeoaeo`).
코덱스 §14가 제안한 "실제 페이지 HTML snapshot을 저장한다"를 그대로
따르면 `stripe.com`, `wikipedia.org`, `musinsa.com` 등 타 사이트의
원본 HTML 전체를 공개 git 저장소에 영구히 커밋하게 된다. 이건 저작권/ToS
리스크다.

**대안**: 원본 HTML 전체가 아니라 다음만 저장한다.
- 추출된 Fact/Evidence의 정규화된 값(`FactRecord`/`EvidenceRecord`,
  이미 v2 타입에 존재)
- `contentHash`(재현성 검증용 — 같은 해시면 같은 HTML이었다는 걸 증명하되
  원문은 없어도 됨)
- 필요하면 `.gitignore` 처리된 로컬 전용 디렉터리에만 원본 HTML을 두고,
  저장소에는 커밋하지 않는다

이렇게 하면 "동일 HTML+동일 ruleset=동일 결과" 검증은 그대로 되면서
공개 저장소에 타 사이트 콘텐츠를 통째로 복제하는 문제를 피한다.

### 3-2. Signal Family 설계는 SATURATION_FLOOR 재유도가 필요하다 — 단순 작업이 아니다

코덱스 §2가 제안한 "family당 상한을 두고, family 간 합산만 confidence를
올린다"는 방향은 맞지만, 지금 `page-type.ts`의 confidence 공식은:

```
confidence = share × saturation
share = topPoints / totalPoints
saturation = min(1, topPoints / SATURATION_FLOOR)  // SATURATION_FLOOR = 7
```

이 공식은 "포인트"가 개별 신호의 합이라는 전제로 만들어졌다. family cap을
넣으면 "포인트"의 의미 자체가 바뀌므로(개별 신호 총합이 아니라 family별
상한 적용 후 합) `SATURATION_FLOOR=7`이라는 숫자가 여전히 유효한 기준인지
다시 계산해야 한다. **이건 신호 추가보다 큰 작업 — Page Type 분류기
재설계에 가깝다.** 1차 개발 일정에 이 사실을 명시하고, "그냥 신호 몇 개
추가"보다 시간이 더 걸릴 수 있음을 미리 알린다.

### 3-3. Aggregate Influence Control에 "진짜 중복"과 "다각도 사용"을 구분하는 기준 추가

코덱스 §6은 "One Fact = One Axis"를 폐기하고 "누적 영향력만 관리하자"고
제안했는데, 이것도 맞지만 한 가지가 빠졌다. 실전 검증에서 발견한
`GEO-TRUST-002`/`SEO-CONTENT-004` 쌍을 직접 뜯어보면, 이건 "하나의
Fact를 SEO는 freshness로, GEO는 temporal context로 다르게 해석"하는
게 아니라 **둘 다 문자 그대로 "datePublished/dateModified가 존재하는가"
를 같은 방식으로 묻는 중복 로직**이다. 즉:

- **다각도 사용** (유지, 영향력만 관리): 같은 Fact를 다른 질문으로 씀
- **사고형 중복** (제거/병합 대상): 같은 Fact를 같은 질문으로 두 번 씀

Registry audit 결과가 나오면 이 두 유형으로 먼저 분류하고, 사고형
중복은 아무리 aggregate influence가 낮아도 병합하는 걸 원칙으로 한다.
**코덱스 원안에 이 구분 기준을 추가해서 수용.**

### 3-4. B4 Shadow Mode는 사실 지금도 이미 절반 존재한다

코덱스 §9는 B4를 "새 전략"으로 제안했는데, 사실 이 프로젝트는 세션 초반
지시("기존 rulesetVersion 2026.08.1 동작은 보존해. scoring v2는 새
버전으로 병행 구현해")부터 이미 v1=공식, v2=병행 계산 구조로 만들어져
있다. `/api/audits?engine=v2`가 이미 별도 엔드포인트로 존재한다.
**B4는 새로 만드는 게 아니라 이미 있는 구조를 공식적으로 "이게 우리
migration 전략이다"라고 이름 붙이고, 여기에 두 가지만 추가하면 된다**:
1. v1 vs v2 vs (있다면) 사람 평가를 나란히 보는 비교 리포트
2. 무기한이 아니라 승격 Gate가 있는 임시 단계라는 걸 문서로 명시(코덱스
   §17 자기비판 D와 동일한 결론)

**작업량이 코덱스 문서가 암시하는 것보다 훨씬 작다** — 이미 있는 인프라
위에 리포트 스크립트 하나 얹는 정도. 이것도 1차 범위에 포함 가능.

## 4. 보류한다 (지금 하지 않는다 — 이유 포함)

| 항목 | 이유 |
|---|---|
| Human-labeled benchmark 50~100 URL 신규 구축 | 코덱스 §17 자기비판 A가 스스로 인정하듯 라벨 품질이 먼저다. **대신**: 이미 있는 실전 검증 20개 URL에 사람 라벨 컬럼만 먼저 추가한다(추가 크롤링 없음, 반나절 작업). 이게 "너와 내가 SEO/GEO 전문가가 된다"는 사용자 목표와도 가장 직접적으로 맞다 — 직접 라벨링하면서 판단 기준을 체득하는 것 자체가 전문성 확보다. Phase 2에서 40~60개 규모로 확장할지는 1차 결과를 보고 결정. |
| Precision ≥ 90% / UNKNOWN < 15~20% 같은 hard gate 수치 | 코덱스 §17 자기비판 B가 스스로 인정한 대로 근거 없는 숫자다. 1차 benchmark 결과가 나오기 전엔 목표 수치를 정하지 않는다. |
| GEO External Validation (AI citation 상관관계 연구) | 코덱스 §17 자기비판 C와 동일 판단 — Page Type도 안정 안 된 상태에서 시기상조. Phase 3으로 명시적으로 미룬다. |
| Page Purpose classifier | 코덱스 §3/자기비판 E와 동일 — 지금 만들면 불확실성이 두 배가 된다. 인터페이스만 확장 가능하게 열어두고 구현은 안 한다. |
| v1 rule 로직 변경, v2 공식 승격, Citation scoring 정책 변경 | 전부 검증 결과가 먼저 나와야 결정 가능. |
| 업계 benchmark 평균/중앙값 제공, Recommendation Engine 확장 | 데이터도 없고, 신뢰도 기반도 없는 상태에서 만들면 잘못된 값을 자신 있게 보여주는 꼴이다. |

## 5. 1차 개발 승인 범위 (최종 확정)

```
[승인]
P1. Page Type classifier — Signal Family 설계
     (SATURATION_FLOOR 재유도 포함, §3-2 명시된 대로 규모 있는 작업으로 취급)
P2. UNKNOWN reason prefix 표준화
     (신규 필드 아님 — 기존 rationaleCode 문자열 규약 표준화 + 집계 리포트)
P3. Registry Fact Dependency Audit
     (Fact → Rule → Axis → 누적 영향력 리포트 생성. §3-3 기준으로
      "다각도 사용" vs "사고형 중복" 분류까지 포함. Rule Weight 즉시 수정 금지 —
      리포트까지만)
P4. Sensitivity / Monotonicity Test 인프라
P5. Frozen Corpus (§3-1 방식 — Fact/Evidence + contentHash만, 원본 HTML 비저장)
P6. 실전 검증 20개 URL에 사람 라벨 컬럼 추가 (신규 크롤링 없음)
P7. v1/v2/사람 라벨 비교 리포트 (Shadow Mode 공식화, §3-4)

[조건부 — 결과 리포트까지만, 코드 반영은 별도 승인]
Registry Audit에서 나온 "사고형 중복" 병합 여부

[미승인]
v1 rule 로직 변경
v2 공식 승격
Weight/Citation scoring 정책 변경
GEO Score → Readiness 등 UI 문자열 변경 (Gemini 작업 완료·검수 후로 순서만 미룸,
  거부 아님)
Page Purpose, External Validation, 업계 benchmark, Recommendation Engine
```

## 6. 완료 기준

- Vitest 전체 통과, typecheck/lint/build 통과, fixture 15개 critical
  regression 없음
- 실전 검증 20 URL 재실행 + Frozen Corpus 재실행 결과 비교(코드 변화 vs
  사이트 변화 구분)
- Page Type: UNKNOWN 비율 변화 **+ 사람 라벨 대비 정오표**(정확도를
  UNKNOWN rate와 분리해서 보고 — 코덱스 §1.1 지적 반영)
- Coverage: `measuredWeight/applicableWeight`(기존 정의 유지) +
  UNKNOWN reason prefix별 분포
- Registry Audit 리포트: Fact별 누적 영향력, 다각도/중복 분류 결과
- Sensitivity test: 대표 fixture에서 Fact 1개 변경 시 score delta 표
- v1/v2/사람 라벨 비교 리포트 1건
- 원 기획안(v1) §1의 5개 문제 각각 "해결/부분 해결/미해결" 재보고

## 7. Codex에게 다시 확인 요청

앞선 20개 질문 중 지금 범위와 관련 없는 것(External Validation, Page
Purpose 등)은 제외하고 다음만 남긴다.

1. §3-2 Signal Family cap을 넣을 때 `SATURATION_FLOOR=7`을 그대로 둘지,
   family cap 도입과 함께 재유도할지 — 구체적 계산식 초안이 있는가?
2. §3-3 "다각도 사용" vs "사고형 중복" 분류 기준에 놓친 제3의 유형이
   있는가? (예: 지금은 다각도 사용이지만 향후 병합해야 할 애매한 경계
   케이스)
3. §5 P1(Signal Family)이 P2~P7보다 명백히 크다 — 이것만 먼저 진행하고
   나머지를 병렬로 가도 괜찮은 작업 순서인가, 아니면 P1 결과가 나머지에
   영향을 주는가?
4. §4에서 보류한 것 중 지금 미루면 리스크가 되는 게 있는가?

이 문서에 대한 검토 의견을 받은 뒤 실제 개발을 시작한다.
