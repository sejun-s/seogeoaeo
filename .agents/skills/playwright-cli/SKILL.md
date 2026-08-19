---
name: playwright-cli
description: CiteGraph 웹 기능을 실제 브라우저에서 검증하는 프로젝트 전용 QA workflow. 사용자 흐름, 입력·오류 상태, Evidence drill-down, console/page/network 오류, 1440px desktop과 390px mobile 반응형, screenshot 검수가 필요한 구현·버그 수정·UI 리뷰에 사용한다.
---

# CiteGraph Playwright QA

## 준비

1. `AGENTS.md`와 관련 프로젝트 Skill을 읽는다.
2. `기획문서/citegraph-phase1-mvp-design.md`에서 현재 기능의 완료 조건을 확인한다.
3. UI 작업이면 `DESIGN.md`를 읽는다.
4. 기존 `package.json`, Playwright 설정, 테스트, 실행 중인 서버를 확인한다.
5. 이미 사용 가능한 브라우저와 Playwright 환경을 재사용한다. 자동으로 새 패키지나 브라우저를 설치하지 않는다.

프로젝트에 Playwright CLI와 설정이 있으면 기존 명령을 사용한다. 없다면 Codex 인앱 브라우저의 Playwright API로 동일한 실제 브라우저 검증을 수행한다. CLI 부재를 애플리케이션 결함으로 보고하지 않는다.

## 서버

- 기존 개발 서버가 실행 중이면 재사용한다.
- 고정 포트를 추측해 여러 서버를 띄우지 않는다.
- 정확한 Local URL에 비브라우저 요청을 한 번 보내 정상 응답과 compile 여부를 확인한 후 브라우저를 연다.
- 코드 변경 후 HMR이 확실하지 않으면 탭을 새로 만들지 말고 기존 탭을 reload한다.

## 핵심 시나리오

첫 URL Audit vertical slice는 다음을 검증한다.

1. 초기 화면과 URL 입력이 표시된다.
2. 공개 URL을 입력하고 Analyze를 실행한다.
3. 실제 fetch 결과의 URL과 추출 정보가 나타난다.
4. SEO Score와 category breakdown이 나타난다.
5. GEO Readiness Score와 category breakdown이 별도로 나타난다.
6. Finding 행을 열어 Rule → Evidence → Recommendation을 확인한다.
7. 잘못된 URL과 차단 URL이 이해 가능한 오류로 표시된다.
8. 반복 분석 시 동일 HTML의 점수와 rule 결과가 동일하다.

향후 기능은 현재 사용자 요청과 Phase 범위에 있을 때만 시나리오를 추가한다.

## 오류 관찰

각 시나리오에서 다음을 수집한다.

- console error와 warning
- uncaught page error
- 예상하지 않은 4xx/5xx 내부 network response
- 실패한 resource와 API 요청
- 로딩이 끝나지 않는 상태
- 오류 후 입력·버튼이 복구되지 않는 상태

의도한 보안 차단의 4xx 응답은 제품 오류로 분류하지 않되, 사용자에게 명확한 메시지가 표시되는지 확인한다.

## 반응형 및 screenshot

결과 데이터가 표시된 동일한 상태를 다음 크기에서 확인한다.

- Desktop: 1440px 너비
- Mobile: 390px 너비

각 크기에서 확인한다.

- horizontal overflow
- 잘린 URL, rule ID, score, result
- score와 category 정렬
- Findings 행의 scan 가능성
- 펼친 Evidence와 Recommendation의 overflow
- 입력과 버튼의 touch/keyboard 사용성
- header 또는 sticky 요소가 콘텐츠를 가리는지

UI 변경이면 각 크기의 screenshot을 저장하고 `product-ui`의 체크리스트로 비판적으로 검토한다. full-page screenshot이 sticky header 때문에 반복되거나 왜곡되면 viewport screenshot, DOM snapshot, scrollWidth/clientWidth 측정을 함께 사용한다.

## 상호작용 원칙

- role, label, visible text 같은 semantic locator를 우선한다.
- 좌표 클릭은 semantic locator로 해결할 수 없을 때만 사용한다.
- 동작 후 DOM 또는 명확한 성공 상태를 확인하고 다음 단계로 이동한다.
- 같은 클릭을 결과 확인 없이 반복하지 않는다.
- 사용자 데이터나 외부 서비스에 쓰는 동작은 QA 범위를 벗어나며 필요한 권한을 먼저 확인한다.

## 실패 처리

1. screenshot, DOM, console, network 중 가장 직접적인 증거로 원인을 좁힌다.
2. 애플리케이션 결함인지 테스트 환경 문제인지 구분한다.
3. 애플리케이션 결함이면 최소 수정 후 같은 시나리오를 다시 실행한다.
4. 다른 시나리오가 회귀하지 않았는지 확인한다.
5. 해결하지 못한 문제는 재현 단계와 관찰 증거를 남긴다.

## 완료 보고

다음을 간결하게 보고한다.

- 검증한 URL과 사용자 흐름
- desktop/mobile 결과
- console/page/network 오류 수
- screenshot에서 발견하고 수정한 UI 문제
- 남은 제한

실행하지 않은 browser나 viewport를 통과했다고 말하지 않는다.
