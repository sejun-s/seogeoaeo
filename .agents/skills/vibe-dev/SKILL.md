---
name: vibe-dev
description: CiteGraph 기능을 작은 vertical slice로 개발하고, 결정론적 분석·보안·build/lint·Playwright 브라우저 QA·git diff까지 검증하는 프로젝트 전용 개발 workflow. 기능 구현, 버그 수정, 리팩터링, 테스트 또는 QA 요청에 사용한다.
---

# CiteGraph Vibe Development Workflow

## 목적

요구사항을 한 번에 크게 구현하지 않는다. 가장 작은 실제 사용자 흐름을 끝까지 완성하고, 코드 검증과 실제 브라우저 검증을 통과한 뒤 다음 범위로 이동한다.

이 Skill은 빠른 코딩보다 다음을 우선한다.

1. PRD와 확정 설계에 맞는 범위
2. 실제 기능과 MOCK의 정직한 구분
3. 재현 가능한 규칙 기반 결과
4. 보안 경계
5. 실행·브라우저·변경사항 검증

## 작업 전 필수 확인

작업을 시작하기 전에 다음 파일을 순서대로 읽는다.

1. `기획문서/citegraph-final-prd-v2.md`
2. `기획문서/citegraph-phase1-mvp-design.md`
3. `DESIGN.md` — UI가 포함된 작업에만 필수
4. 현재 작업과 관련된 기존 코드, 테스트, 설정, `package.json`

문서가 충돌하면 다음 우선순위를 적용한다.

```text
현재 사용자의 명시적 요청
→ citegraph-phase1-mvp-design.md의 확정 결정
→ DESIGN.md의 UI 원칙
→ citegraph-final-prd-v2.md의 장기 제품 원칙
```

Phase 1에서는 PRD의 과거 `SEO/AEO/GEO 통합 Diagnostic Score`를 구현하지 않는다. 최상위 점수는 서로 독립적인 `SEO Score`와 `GEO Readiness Score` 두 개뿐이다. Answerability는 GEO 하위 category다.

## 범위 통제

구현 전 이번 작업의 완료 조건을 한 문장과 체크리스트로 고정한다. 요청받지 않은 Phase 1 후반 또는 Phase 2 기능을 끌어오지 않는다.

첫 vertical slice가 안정적으로 완료되기 전에는 다음을 추가하지 않는다.

- Supabase 인증, 조직, 권한, RLS, 영구 저장
- PDF, 화이트라벨
- Gemini 또는 다른 AI Visibility provider
- WordPress, GitHub, 업무 도구 연동
- 결제, credit
- worker, queue, LangGraph
- headless crawler

기존 코드가 이미 있으면 새 프로젝트를 만들지 않는다. 기존 package manager와 lockfile을 유지하고, 필요한 파일만 읽는다.

## REAL / MOCK / UNAVAILABLE 계약

- `REAL`: 실제 공개 HTML과 결정론적 코드에서 나온 결과
- `MOCK`: UI 또는 계약 검증용 고정 데이터
- `UNAVAILABLE`: API 키나 provider가 연결되지 않아 실행할 수 없는 기능

MOCK은 실제 점수, 추세, 보고서 수치에 섞지 않는다. 데이터 모델과 UI 모두에 `MOCK`을 표시한다. API 키가 없으면 기능을 삭제하거나 가짜 성공을 만들지 않고 adapter 경계와 `UNAVAILABLE` 상태를 구현한다.

## 개발 순서

### 1. 발견

- `rg --files`와 `rg`로 현재 구현·테스트·설정을 확인한다.
- 사용자 변경과 무관한 파일을 수정하지 않는다.
- 이미 설치된 의존성으로 해결 가능한지 먼저 확인한다.
- 최신 API 사용법이 중요한 경우 Context7을 우선 사용한다.
- `codex mcp list`에서 Context7이 enabled인데 현재 세션에 도구가 없다면 미설치로 단정하지 않는다. 세션 MCP 가용성 문제로 기록하고 공식 문서로 대체한다.

### 2. 계약

- 입력, 출력, 오류, REAL/MOCK 상태를 먼저 정의한다.
- rule 결과는 `id`, `scoreType`, `category`, `title`, `description`, `weight`, `result`, `evidence`, `recommendation`을 유지한다.
- SEO와 GEO rule weight는 각각 100이며 서로의 계산에 사용하지 않는다.
- 동일한 HTML과 동일한 ruleset version은 항상 같은 결과를 반환해야 한다.
- 외부 AI 결과, 현재 시간, 난수는 결정론적 점수 계산에 넣지 않는다.

### 3. 최소 구현

- 사용자 흐름의 얇은 전체 경로를 먼저 완성한다.
- 변경은 작고 되돌리기 쉽게 유지한다.
- URL-only 분석은 repository 파일 위치를 안다고 주장하지 않는다.
- partial 또는 측정 불가 상태를 거짓 0점이나 성공으로 표현하지 않는다.

### 4. 코드 검증

변경 위험에 맞는 검증을 수행한다.

- 고정 fixture에서 동일 결과 재현
- PASS/WARN/FAIL과 weight 합계 확인
- SSRF: protocol, credential URL, private/loopback/link-local, redirect 재검사
- timeout, content-type, 응답 크기 제한
- 악성 HTML과 존재하지 않는 evidence ID
- REAL/MOCK 혼합 방지

필수 명령은 프로젝트의 기존 script를 사용한다.

```text
build
lint
관련 단위/통합 테스트
```

명령 실패를 무시하거나 결과를 성공으로 요약하지 않는다. 실제 원인을 수정하고 다시 실행한다.

### 5. Playwright 실제 브라우저 QA

웹 UI 또는 API 사용자 흐름이 바뀌면 실제 실행 서버에서 Playwright로 검증한다.

최소 시나리오:

1. 초기 화면이 blocking error 없이 렌더링된다.
2. 정상 공개 URL 입력과 분석이 완료된다.
3. Title, meta description, H1, canonical, robots, schema 결과가 표시된다.
4. SEO Score와 GEO Readiness Score가 각각 표시된다.
5. Score → Category → Rule → Evidence → Recommendation drill-down이 작동한다.
6. 잘못된 URL 또는 차단 URL이 이해 가능한 오류로 표시된다.

검사 항목:

- browser console error와 warning
- page error
- 실패한 내부 network request
- loading, disabled, error, partial 상태
- 키보드로 주요 입력과 disclosure 조작 가능 여부
- 1440px desktop과 390px mobile overflow

UI 변경이면 `product-ui` Skill의 screenshot 검수 절차도 함께 적용한다.

### 6. 최종 검토

- `git status`, `git diff`, `git diff --check`를 검토한다.
- 새 파일과 삭제 파일도 빠뜨리지 않는다.
- 디버그 코드, 임시 fixture, 비밀값, 불필요한 의존성을 확인한다.
- 사용자 소유의 기존 변경을 덮어쓰지 않는다.
- 범위 밖 기능이 섞였으면 제거한다.

## 완료 보고 형식

기술 용어를 최소화하고 아래 순서로 간결하게 보고한다.

1. 사용자가 실제로 할 수 있게 된 것
2. REAL / MOCK / UNAVAILABLE 상태
3. 통과한 build, lint, 테스트, 브라우저 시나리오
4. 남은 제한 또는 위험
5. 주요 파일 링크

검증하지 않은 내용을 검증했다고 말하지 않는다.

## 중단 조건

다음 상황에서는 범위를 추측해 확대하지 말고 사용자에게 알린다.

- 제품 결과를 바꾸는 중요한 요구사항 충돌
- 외부 서비스 쓰기, 배포, 결제처럼 새로운 권한이 필요한 경우
- 데이터 손실 또는 기존 사용자 변경 덮어쓰기 위험
- 실제 기능과 MOCK을 구분할 수 없는 계약
