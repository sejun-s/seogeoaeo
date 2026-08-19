# CiteGraph Weight Calibration Plan

> 상태: scoring v2 구현 전 계획  
> 대상: `methodology-v2-draft.2` Scoring Rules  
> 현재 provisional Weight를 공식 방법론으로 확정하지 않음

## 1. 목표

Weight는 “공식 문서에 언급되었다”는 이유만으로 결정하지 않는다. 다음 세 질문을 분리한다.

1. Rule 목적이 근거로 지지되는가? → Evidence Grade
2. Rule 결과를 재현 가능하게 측정하는가? → Measurement reliability
3. 해당 Rule에 몇 점을 배정해야 하는가? → Weight Confidence

Evidence Grade A라도 Weight Confidence는 Low일 수 있다.

## 2. Weight Inflation 방지

- Atomic Check는 Weight 0.
- Weight는 Scoring Rule에만 존재한다.
- Atomic Check 분할 전후 category envelope는 고정한다.
- 한 Fact를 여러 Rule이 참조할 경우 같은 질문으로 중복 가산하는지 검토한다.
- 새 Rule 추가는 기존 category envelope 안에서 재배분하며 총점을 늘리지 않는다.
- SEO Advisory와 v2.1 deferred semantic check는 Weight 0.

## 3. 현재 Provisional Envelope

### SEO

| Category | Envelope | 상태 |
|---|---:|---|
| Technical SEO | 20 | provisional |
| On-page | 25 | provisional |
| Indexability | 22 | noindex 최대 12 승인, 나머지 calibration |
| Structured Data | 15 | provisional |
| Content Basics | 18 | provisional |
| 합계 | 100 | FACT/validator only |

### GEO

- Technical Fact raw envelope: 40 — provisional
- Semantic raw envelope: 60 — calibration 가설
- v2 candidate Semantic check의 실제 raw 합: 43
- v2.1 external/history check raw 후보: 17, v2 Weight 0
- 제품에는 Technical/Semantic Readiness를 각각 독립 0~100+coverage로 표시
- calibration 전 결합 Overall을 공식 점수로 사용하지 않음

## 4. Calibration Dataset 단계

### Stage 0 — 설계 fixture 15개

- 목적: 상태 계약과 명백한 상대 ordering 검증
- 사용: PASS/FAIL/N/A/UNKNOWN/NE, 중복 Fact, weight inflation 검출
- 제한: 15개 fixture로 통계적 Weight를 확정하지 않음

### Stage 1 — Curated 100 pages

- page type별 최소 10개, 언어별 한국어/영어 균형
- 의도적 변이 pair 포함: canonical만 변경, author만 제거, date만 제거 등
- 전문가 2명 독립 평가 + disagreement adjudication
- 목표: threshold profile, false positive/negative, Rule 간 상관 확인

### Stage 2 — Real-world 500 pages

- 업종·CMS·렌더 방식·사이트 규모 다양화
- Search Console/validator 등 이용 가능한 외부 관측은 별도 ground truth로만 사용
- 실제 노출 성과를 readiness와 인과로 단정하지 않음
- 목표: page type별 적용률, coverage, score distribution, ceiling/floor effect 확인

### Stage 3 — Outcome calibration

- 기술 결함 수정 전후의 재검사 결과
- 전문가가 정한 issue priority와 Rule weight ordering 비교
- 실제 AI Visibility는 별도 관측값으로 사용하고 GEO readiness 공식에 직접 학습시키지 않음

## 5. 사람 Labeling 계약

각 page는 다음을 독립 기록한다.

- page type과 confidence
- Rule applicability
- Atomic Check expected state
- issue severity: blocking / major / moderate / minor
- 수정 우선순위
- quote/evidence
- reviewer confidence

합의 지표:

- FACT Rule: reviewer agreement ≥0.95 목표
- Applicability/N/A: Cohen's kappa ≥0.80 목표
- Semantic rubric: weighted kappa ≥0.70을 v2 실험 최소 기준으로 검토
- 합의 미달 Rule은 Weight Confidence를 Experimental로 유지

## 6. Weight 산정 방법

초기에는 설명 가능한 constrained 방식만 사용한다.

1. Category envelope 고정
2. Blocking gate(noindex 등) 상한 정책 적용
3. 전문가 pairwise priority 비교
4. Rule 중복·상관 분석
5. 한 Rule 변화의 score sensitivity 측정
6. bootstrap으로 순위 안정성 확인
7. 소수점 Weight보다 사람이 설명 가능한 정수 우선

금지:

- 15개 fixture에 맞춰 점수를 임의 튜닝
- 검색 순위·AI 인용과 단순 상관만으로 인과 Weight 부여
- UNKNOWN/NE가 많은 Rule을 낮은 실패율로 오해
- 동일 Fact를 복수 축에서 반복 가산
- semantic model 출력에 과적합

## 7. Threshold Calibration

Title/meta/body 길이는 hard limit가 아니다.

```ts
interface HeuristicProfile {
  metric: "titleLength" | "metaLength" | "mainTextLength";
  pageType: PageType;
  language: string;
  warnBand: { min?: number; max?: number };
  failBand?: { min?: number; max?: number };
  sampleSize: number;
  calibrationVersion: string;
  confidence: "Low" | "Medium" | "High";
}
```

- profile이 없으면 UNKNOWN 또는 Advisory만 제공한다.
- 언어별 문자 수를 동일 의미 길이로 간주하지 않는다.
- page type별 목적을 반영한다.
- sampleSize가 기준 미만이면 Weight Confidence Low 유지.

## 8. Sensitivity Test

각 Scoring Rule에 대해 다음을 계산한다.

- 단일 Rule FAIL→PASS 시 총점 변화
- category 내 최대 영향 비율
- page type별 적용률
- N/A/UNKNOWN/NE 비율
- 다른 Rule과 결과 상관
- fixture ordering 역전 여부

검토 gate:

- 한 비차단 Rule이 전체 SEO의 10%를 넘으면 재검토
- 동일 Fact 기반 Rule 상관이 지나치게 높으면 통합/weight 축소
- 적용률이 20% 미만인 Rule은 전체 공통 Weight 대신 page-type module 검토
- UNKNOWN이 30%를 넘으면 input 개선 전 Weight 확정 금지

## 9. GEO Calibration

Technical과 Semantic은 별도로 검증한다.

### Technical Readiness

- deterministic repeatability 100%
- raw/rendered snapshot source가 명시됨
- page type별 N/A 합의
- citation URL에서 `tel:`, `mailto:`, SNS profile을 source로 오인하지 않음

### Semantic Readiness

- rubric별 사람 합의 corpus 필요
- 최소 quote requirement 위반률 0%
- hallucinated quote rate 0%를 release gate로 설정
- provider/model version 변화에 따른 label drift 측정
- v2.1 external source 평가와 v2 same-page semantic 평가를 섞지 않음

40/60을 검토하려면 각 독립 readiness의 reliability와 사용자 의사결정 유용성이 먼저 입증돼야 한다. 비율 자체를 먼저 최적화하지 않는다.

## 10. 승인 Gate

Weight를 `Low → Medium`으로 올리려면:

- 최소 100개 curated page
- page type별 적용성 합의
- 재현성 및 false-positive 검토
- sensitivity와 중복 분석
- 변경 이유와 dataset version 문서화

`Medium → High`는 real-world corpus와 수정 전후 검증이 추가로 필요하다.

## 11. 산출물

- `calibration-dataset-version`
- page-type/language heuristic profiles
- Rule별 Evidence Grade와 Weight Confidence 변경 기록
- score distribution과 coverage report
- pairwise ordering 결과
- false-positive/negative 사례집
- methodology changelog

Calibration 결과가 승인되기 전 provisional Weight를 공식 성능 지표나 보장값으로 표현하지 않는다.
