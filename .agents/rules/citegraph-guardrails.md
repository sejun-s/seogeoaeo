CiteGraph 저장소에서 작업 전 항상 적용되는 규칙이다. 이 파일은 Antigravity Rules — Always On으로 설정한다.

작업을 시작하기 전에 @AGENTS.md 의 기준 문서 순서를 먼저 읽는다. 이 파일은 그 위에
지금 시점 기준으로 반드시 필요한 추가 제약만 담는다.

## 지금 동결된 문제

`lib/v3/rules.ts`의 R_SEM Scoring Rule(Answer Capsule, Author Trust, Citation
Quality, Freshness, Semantic Coherence)은 실제 semantic 평가가 아니라 문자열
길이·속성 존재 heuristic이다. 이 결과가 `app/page.tsx`에서 "R_SEM Score
(GEO 의미)"로 표시되고, `OCI = 0.4×R_TECH + 0.6×R_SEM` 공식으로 사용자에게
확정 숫자처럼 노출된다.

이것은 @AGENTS.md 의 "MOCK을 실제 점수, 추세, 보고서에 섞지 않는다" 원칙과
`기획문서/citegraph-weight-calibration-plan.md` §9("calibration 전에는 두
readiness를 결합해 단일 공식 점수라고 표현하지 않는다")를 위반한다.

사용자의 명시적 승인 없이 이 문제를 우회하거나, 이 위에 새 기능(Compare 페이지
동기화, History 대시보드 등)을 추가하지 않는다.

## 항상 지킬 것

- 전체 기능을 한 번에 구현하지 않는다. 가장 작은 vertical slice만 완성한다.
- REAL / MOCK / UNAVAILABLE / NOT_EVALUATED를 코드와 UI에서 명확히 구분한다.
  heuristic 결과를 semantic 평가처럼 표시하지 않는다.
- 새로운 Scoring Rule, weight 값, 점수 결합 공식(OCI 비율 등)을 사용자 승인
  없이 추가·변경하지 않는다.
- 새로운 DB 테이블/컬럼, 새로운 외부 API 연동을 사용자 승인 없이 추가하지
  않는다.
- 코드부터 작성하지 않는다. 계획(Task List/Implementation Plan)을 먼저
  제시하고 사용자 승인을 기다린다.
- 프런트엔드/UI 변경은 반드시 내장 브라우저로 실제 실행해 스크린샷 또는
  녹화 Artifact를 남긴다. 실행하지 않은 검증을 했다고 보고하지 않는다.
- 이 저장소에는 병행 개발 중인 두 엔진(`lib/v2`, `lib/v3`)이 있다. 어느
  쪽을 수정하는지 명시하고, 서로 조용히 다른 결과를 내지 않게 한다.

## 작업 시작 전 체크리스트

- [ ] @AGENTS.md 의 기준 문서를 읽었다
- [ ] 위 "지금 동결된 문제"를 우회하지 않는다
- [ ] 이번 작업의 범위를 한 문장으로 요약할 수 있다
- [ ] 계획을 먼저 제시하고 사용자 승인을 받았다
