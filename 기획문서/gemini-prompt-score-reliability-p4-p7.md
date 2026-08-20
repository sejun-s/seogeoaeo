> 이 파일은 Gemini(Antigravity)에게 그대로 전달할 작업 프롬프트다. 실행 전에
> 먼저 읽어야 할 문서: `score-reliability-improvement-plan-2026-08-20-v2-final.md`
> (전체, 특히 §5), `registry-fact-dependency-audit-2026-08-20.md`.

---

# Gemini에게: 점수 신뢰도 개선 2차 구현 (P4~P7)

Claude가 같은 기획안의 P1~P3(Page Type Signal Family, UNKNOWN reason
taxonomy, Registry Fact Dependency Audit)을 이미 구현해서 `main`에 push했다
(커밋 `e60afb9`). 이번 작업 전에 반드시 `git pull`로 그 위에서 시작할 것 —
`lib/v2/types.ts`, `lib/v2/checks/*.ts`, `lib/v2/page-type.ts`가 이미
바뀌어 있다.

**절대 건드리지 말 것**: `lib/audit.ts`(v1, `rulesetVersion 2026.08.1` 동결).
**이번 라운드에서 하지 않을 것**: v1 rule 로직 변경, v2 공식 승격, Weight
값 변경, Citation scoring 정책 변경. Rule Weight 관련 코드는 리포트만
생성하고 실제 숫자는 바꾸지 않는다.

## P4. Sensitivity / Monotonicity 테스트 인프라

기획안 §1-5, §11, §12 근거: "author 하나 추가했더니 GEO가 22점 뛴다" 같은
게 rule weight 설계가 아니라 버그일 수 있는데, 지금 이걸 잡는 테스트가
없다.

**할 일**:
1. 대표 fixture(예: `기획문서/fixtures/v2/html/03-article.html`,
   `01-clean-homepage.html`) 하나를 baseline으로 삼아 Fact 하나만 바꾼
   변형 HTML을 만들고(fixture corpus에 새 파일을 추가하지 말 것 —
   `tests/v2/evidence.test.ts:20`이 corpus를 15개로 고정해뒀다. Claude가
   `tests/v2/page-type-signal-family.test.ts`에서 한 것처럼 `createSnapshot`
   으로 테스트 안에서 동적으로 HTML 문자열을 만들어라), SEO/GEO Fact
   score의 변화량(delta)을 기록하는 테스트를 작성한다.
2. 최소 다음 변경 각각에 대해 delta를 측정하고 "비정상적으로 크거나 작은
   변화가 아님"을 assert하는 테스트를 만든다: author 추가, date 추가,
   citation(외부 링크) 추가, canonical 제거, title 제거. "비정상"의 기준을
   임의로 정하지 말고, 각 rule의 `maxWeight`를 넘지 않는지(당연한 상한)와
   0이 되지 않는지 정도의 구조적 assert로 시작해도 된다 — 정밀한 "이 정도
   변화가 적절하다"는 숫자는 이번 라운드에서 calibration 없이 만들지 않는다.
3. Monotonicity: "좋은 Evidence를 추가했는데 점수가 내려가면 안 된다"를
   검증한다. 단, Page Type 자체가 바뀌면서 applicable set이 달라지는
   경우는 예외로 명시하고 테스트에서 걸러라(기획안 §12 단서 조항).

**완료 기준**: Vitest 통과, 새 테스트가 기존 fixture 15개 corpus를
건드리지 않음, typecheck/lint/build 통과.

## P5. Frozen Corpus (원본 HTML 비저장 방식)

기획안 §3-1 근거: 이 저장소는 **공개**다. 실제 사이트(stripe.com 등)의
원본 HTML을 통째로 커밋하면 저작권/ToS 문제가 된다.

**할 일**:
1. `lib/v2/evidence/layer.ts`(또는 관련 타입)에 이미 있는 `FactRecord`/
   `EvidenceRecord`(정규화된 값 + `contentHash`)만 저장하는 스냅샷 포맷을
   설계한다. 원본 HTML 전체는 저장소에 커밋하지 않는다.
2. 로컬에서만 쓰는 원본 HTML 캐시가 필요하면 `.gitignore` 처리된 디렉터리
   (예: `기획문서/citegraph-app/.local-corpus/`)에 두고 저장소에는 절대
   커밋하지 않는다. `.gitignore`에 그 경로를 반드시 추가해라.
3. "동일 HTML + 동일 ruleset = 동일 결과"를 검증하는 테스트를 `contentHash`
   비교로 작성한다 — 원본 HTML 없이도 hash만으로 재현성을 확인할 수
   있어야 한다.

**완료 기준**: 공개 저장소에 타 사이트 원본 HTML이 커밋되지 않음(git diff로
직접 확인해서 보고할 것), 재현성 테스트 통과.

## P6. 실전 검증 20 URL에 사람 라벨 컬럼 추가

기획안 §4(보류 항목 표) 근거: 50~100 URL 신규 라벨링 대신, 이미 있는
`real-world-validation-report-2026-08-20.md`의 20개 URL에 사람이 직접
Page Type을 매긴 컬럼만 추가한다. 새 크롤링 없음.

**할 일**:
1. `real-world-validation-report-2026-08-20.md`의 결과 표(20개 URL)에
   `Human Label` 컬럼을 추가한다. 각 URL을 직접 열어보고(또는 이미 저장된
   스냅샷이 있으면 그걸 보고) `PageType` 중 하나(HOMEPAGE/ARTICLE_BLOG/
   PRODUCT/SERVICE/CATEGORY_LISTING/DOCUMENTATION/LANDING_PAGE/
   CONTACT_ABOUT/UTILITY_AUTH)를 사람이 판단해서 채운다. 애매하면
   `Human Label` 옆에 `Reviewer Note`로 왜 애매한지 한 줄 남긴다(기획안
   §17 자기비판 A: 애매한 건 숨기지 않는다).
2. `Classifier Label`(P1 이후 재실행한 v2 결과) vs `Human Label`을 대조해서
   `Correct`/`Incorrect` 컬럼을 추가하고, 맨 아래 정오표 요약(Page Type별
   correct/incorrect raw count)을 남긴다. 이건 P1이 실제로 정확도를
   높였는지(UNKNOWN rate만 낮춘 게 아니라) 확인하는 핵심 증거다.
3. 실전 검증을 v2로 재실행할 때 v1도 같이 재실행해서 다음 라운드
   P7에서 쓸 원자료로 남긴다.

**완료 기준**: 새 문서 하나(`real-world-validation-report-2026-08-20-human-
labeled.md` 등, 기존 리포트를 덮어쓰지 말고 새로 만들어 DOCUMENT_MATRIX.md
에 등록)로 결과를 남긴다.

## P7. v1 / v2 / 사람 라벨 비교 리포트 (Shadow Mode 공식화)

기획안 §3-4 근거: v1=공식, v2=병행 계산 구조는 이미 존재한다
(`/api/audits?engine=v2`). 여기에 비교 리포트만 얹으면 된다.

**할 일**:
1. P6에서 만든 사람 라벨 데이터를 이용해 URL별로 `v1 SEO/GEO 점수`,
   `v2 SEO/GEO Fact 점수 + coverage`, `Human Label 기준 Page Type 정오`를
   한 표에 정리한다.
2. 결론에 "이게 무기한 병행이 아니라 승격 Gate가 있는 임시 단계"라는
   걸 명시한다(기획안 §17 자기비판 D). Gate 통과 기준은 이번 라운드에서
   확정하지 말고(근거 없는 숫자 금지), "다음에 확정해야 할 질문" 목록으로
   남겨라.

**완료 기준**: 새 리포트 문서, DOCUMENT_MATRIX.md 등록.

---

## 전체 완료 후 보고 형식

1. Vitest/typecheck/lint/build 결과
2. P4~P7 각각 "완료/부분 완료/보류(사유)"
3. `기획문서/score-reliability-improvement-plan-2026-08-20-v2-final.md`
   §1의 문제 5개 중 이번 작업으로 추가로 해결/확인된 게 있으면 명시
4. DOCUMENT_MATRIX.md §3/§4에 새 문서 등록 여부

작업 완료 후 **push는 하지 말고 로컬 커밋까지만** — AGENTS.md §6 프로토콜에
따라 Claude가 검수 후 push한다.
