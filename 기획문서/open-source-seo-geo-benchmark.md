# 오픈소스 SEO·GEO 감사 도구 벤치마킹 가이드

> 조사 기준일: 2026-08-18  
> 목적: SEO 감사, GEO/AEO 준비도 진단, AI 인용 추적 및 구조화 데이터 검증 제품을 설계할 때 참고하거나 재사용할 수 있는 오픈소스와 핵심 구현 요소를 정리한다.

## 1. 결론

한 프로젝트를 그대로 포크하기보다 다음 조합이 가장 실용적이다.

| 영역 | 우선 벤치마킹 대상 | 가져올 핵심 |
|---|---|---|
| 감사 규칙과 결과 계약 | `seo-skills/seo-audit-skill` | 규칙 레지스트리, 판정, 점수, 다중 출력 |
| 사이트 크롤링 | `open-seo-crawler`, `seonaut` | 동시 크롤링, 링크 그래프, CMS 프리셋, 운영형 UX |
| 렌더링·성능 | `site-audit-seo` | 크롤 결과와 Lighthouse 결합 |
| GEO 준비도 | `geo-optimizer-skill` | AI bot 접근, citability, diff/history, MCP·SARIF |
| AI 가시성 실측 | `geo-aeo-tracker`, `GetCito` | 프롬프트×엔진 추적, 인용 추출, 경쟁사 비교, 시계열 |
| 구조화 데이터 | Adobe validator | Schema.org와 Google Rich Results 이중 검증 |
| 검증 프로파일 설계 | Schemarama | 표준 규칙과 소비자별 요구사항 분리 |

권장 제품 흐름은 다음과 같다.

```text
크롤 → 증거 수집 → SEO/GEO 규칙 판정 → 이슈 우선순위화
     → 수정 → 재감사/diff → 실제 AI 언급·인용 변화 측정
```

## 2. 재사용 등급

이 문서에서는 소스 활용 방법을 다음처럼 구분한다.

| 등급 | 의미 |
|---|---|
| A — 직접 검토 후보 | 허용적 라이선스다. 저작권·라이선스 고지를 보존하고 코드 재사용을 검토할 수 있다. |
| B — 설계 우선 참고 | 코드 재사용도 가능할 수 있으나 의존성, 성숙도 또는 구조가 무거워 설계 벤치마킹이 우선이다. |
| C — 격리 또는 법무 검토 | 강한 카피레프트, 아카이브 또는 실험 상태다. 코드를 제품에 섞기 전에 반드시 별도 검토한다. |
| D — 자료 참고 | 큐레이션·연구 자료다. 제품 코드 소스로 보지 않는다. |

> 라이선스 표기는 저장소의 현재 파일을 기준으로 한 기술 조사이며 법률 자문이 아니다. 실제 도입 시 특정 커밋을 고정하고 그 커밋의 `LICENSE`, `NOTICE`, 서드파티 의존성 라이선스를 다시 검사해야 한다.

## 3. 프로젝트별 소스 링크와 벤치마킹 요소

### 3.1 seo-skills/seo-audit-skill

**용도:** 규칙 기반 종합 SEO 감사 CLI 및 에이전트 스킬  
**추천 등급:** A — 직접 검토 후보  
**라이선스:** MIT

#### 원본 링크

- [GitHub 저장소](https://github.com/seo-skills/seo-audit-skill)
- [README](https://github.com/seo-skills/seo-audit-skill/blob/main/README.md)
- [LICENSE — MIT](https://github.com/seo-skills/seo-audit-skill/blob/main/LICENSE)
- [릴리스](https://github.com/seo-skills/seo-audit-skill/releases)
- [태그](https://github.com/seo-skills/seo-audit-skill/tags)
- [커밋 기록](https://github.com/seo-skills/seo-audit-skill/commits/main/)
- [이슈](https://github.com/seo-skills/seo-audit-skill/issues)
- [npm 패키지 `@seomator/seo-audit`](https://www.npmjs.com/package/@seomator/seo-audit)
- [전체 코드 검색](https://github.com/search?q=repo%3Aseo-skills%2Fseo-audit-skill&type=code)

#### 벤치마킹할 요소

- 규칙 ID, 카테고리, 심각도, 점수 가중치로 구성된 규칙 레지스트리
- PASS/WARN/FAIL과 0~100 점수의 병행
- 카테고리별 점수와 종합 등급
- 규칙 결과에 실제값, 기대값, 증거, 수정 방법을 연결하는 구조
- CLI와 프로그래밍 API를 동시에 제공하는 방식
- JSON, HTML, Markdown, SARIF 또는 LLM 친화 출력으로 확장 가능한 렌더러
- GitHub Actions 등 CI 품질 게이트
- Playwright를 이용한 선택적 JS 렌더링과 Core Web Vitals 측정

#### 도입 시 확인할 점

- 규칙 수와 카테고리 수는 버전마다 달라질 수 있다. 문서나 마케팅 수치를 복사하지 말고 고정한 태그에서 직접 산정한다.
- 규칙 정의, 점수 계산, 크롤러, 리포터의 결합도를 확인한다.
- npm 패키지와 GitHub 저장소의 버전·라이선스가 일치하는지 확인한다.

```bash
git clone https://github.com/seo-skills/seo-audit-skill.git
cd seo-audit-skill
git tag --sort=-version:refname
```

---

### 3.2 StJudeWasHere/seonaut

**용도:** Go+MySQL 기반 운영형 SEO 크롤·감사 웹 애플리케이션  
**추천 등급:** B — 설계 우선 참고  
**라이선스:** MIT

#### 원본 링크

- [GitHub 저장소](https://github.com/StJudeWasHere/seonaut)
- [README](https://github.com/StJudeWasHere/seonaut/blob/main/README.md)
- [LICENSE — MIT](https://github.com/StJudeWasHere/seonaut/blob/main/LICENSE)
- [릴리스](https://github.com/StJudeWasHere/seonaut/releases)
- [태그](https://github.com/StJudeWasHere/seonaut/tags)
- [커밋 기록](https://github.com/StJudeWasHere/seonaut/commits/main/)
- [이슈](https://github.com/StJudeWasHere/seonaut/issues)
- [서버 진입점](https://github.com/StJudeWasHere/seonaut/tree/main/cmd/server)
- [핵심 내부 패키지](https://github.com/StJudeWasHere/seonaut/tree/main/internal)
- [DB 마이그레이션](https://github.com/StJudeWasHere/seonaut/tree/main/migrations)
- [웹 UI](https://github.com/StJudeWasHere/seonaut/tree/main/web)
- [Docker Compose](https://github.com/StJudeWasHere/seonaut/blob/main/docker-compose.yml)
- [공개 호스팅](https://seonaut.org/)
- [전체 코드 검색](https://github.com/search?q=repo%3AStJudeWasHere%2Fseonaut&type=code)

#### 벤치마킹할 요소

- 프로젝트와 크롤 이력을 DB에 저장하는 운영형 구조
- critical/high/low 중심의 수정 우선순위 UX
- 깨진 링크, 리디렉션, 중복 메타, 헤딩 구조 등 사이트 전체 이슈 집계
- URL별 상세 결과와 대시보드 시각화
- Docker Compose로 애플리케이션과 DB를 함께 배포하는 방식
- 단순한 프런트엔드와 서버 중심 아키텍처
- 다국어 리포트 구조

#### 도입 시 확인할 점

- 단발성 CLI 제품이라면 MySQL과 장기 실행 서버 구조는 과할 수 있다.
- 크롤 큐, 재시도, 중복 URL 정규화와 데이터 보존 정책을 집중적으로 본다.

```bash
git clone https://github.com/StJudeWasHere/seonaut.git
cd seonaut
docker compose up
```

---

### 3.3 viasite/site-audit-seo

**용도:** 사이트 크롤과 Lighthouse를 결합한 CLI·웹 리포트  
**추천 등급:** C — 격리 또는 법무 검토  
**라이선스:** GNU AGPL-3.0

#### 원본 링크

- [GitHub 저장소](https://github.com/viasite/site-audit-seo)
- [README](https://github.com/viasite/site-audit-seo/blob/master/README.md)
- [LICENSE — GNU AGPL-3.0](https://github.com/viasite/site-audit-seo/blob/master/LICENSE)
- [릴리스](https://github.com/viasite/site-audit-seo/releases)
- [태그](https://github.com/viasite/site-audit-seo/tags)
- [커밋 기록](https://github.com/viasite/site-audit-seo/commits/master/)
- [이슈](https://github.com/viasite/site-audit-seo/issues)
- [소스 디렉터리](https://github.com/viasite/site-audit-seo/tree/master/src)
- [기본 설정](https://github.com/viasite/site-audit-seo/blob/master/.site-audit-seo.conf.js)
- [Docker Compose](https://github.com/viasite/site-audit-seo/blob/master/docker-compose.yml)
- [package.json](https://github.com/viasite/site-audit-seo/blob/master/package.json)
- [전체 코드 검색](https://github.com/search?q=repo%3Aviasite%2Fsite-audit-seo&type=code)

#### 벤치마킹할 요소

- 크롤 데이터와 URL별 Lighthouse 결과의 결합
- 필드·열 선택, 필터 프리셋, 정렬, 상세 행을 제공하는 리포트 UX
- 렌더링 전후 DOM과 성능 데이터의 통합
- Readability·YAKE 등 콘텐츠 추출 부가기능
- JSON, CSV, XLSX 등 분석 친화 출력
- 공개 리포트 URL과 재스캔 흐름

#### 라이선스 주의

AGPL-3.0 코드를 수정해 네트워크 서비스로 제공하면 대응 소스 공개 의무가 문제될 수 있다. 폐쇄형·상용 제품에서는 다음 원칙이 안전하다.

- 구현 코드를 복사하지 않고 UX와 데이터 모델만 독립적으로 참고한다.
- 꼭 사용한다면 별도 프로세스·서비스 경계를 포함해 법무 검토를 거친다.
- 포크·수정·서비스 제공 시 AGPL 의무를 충족할 계획을 먼저 세운다.

```bash
git clone https://github.com/viasite/site-audit-seo.git
cd site-audit-seo
git log -1 --format='%H %cI %s'
```

---

### 3.4 puneetindersingh/open-seo-crawler

**용도:** CMS 인지형 로컬 SEO 크롤러 및 Screaming Frog 대안  
**추천 등급:** A — 직접 검토 후보  
**라이선스:** MIT

#### 원본 링크

- [GitHub 저장소](https://github.com/puneetindersingh/open-seo-crawler)
- [README](https://github.com/puneetindersingh/open-seo-crawler/blob/master/README.md)
- [LICENSE — MIT](https://github.com/puneetindersingh/open-seo-crawler/blob/master/LICENSE)
- [릴리스](https://github.com/puneetindersingh/open-seo-crawler/releases)
- [태그](https://github.com/puneetindersingh/open-seo-crawler/tags)
- [커밋 기록](https://github.com/puneetindersingh/open-seo-crawler/commits/master/)
- [이슈](https://github.com/puneetindersingh/open-seo-crawler/issues)
- [메인 애플리케이션](https://github.com/puneetindersingh/open-seo-crawler/blob/master/app.py)
- [데이터 정확성 테스트](https://github.com/puneetindersingh/open-seo-crawler/blob/master/test_data_correctness.py)
- [의존성](https://github.com/puneetindersingh/open-seo-crawler/blob/master/requirements.txt)
- [템플릿](https://github.com/puneetindersingh/open-seo-crawler/tree/master/templates)
- [정적 UI 자산](https://github.com/puneetindersingh/open-seo-crawler/tree/master/static)
- [전체 코드 검색](https://github.com/search?q=repo%3Apuneetindersingh%2Fopen-seo-crawler&type=code)

#### 벤치마킹할 요소

- 동시 크롤링과 호스트별 지연 설정
- CMS 자동 감지와 Shopify, WordPress, Webflow 등의 권장 제외 패턴
- sitemap 분석과 크롤 URL의 대조
- 중복 및 근접 중복 콘텐츠 탐지
- URL별 메타데이터, 이슈, 인링크, 아웃링크 패널
- 리디렉션 체인과 bulk report
- 로컬 우선 실행, XLSX 내보내기, 선택적 JS 렌더링
- 설치 전 preflight와 업데이트 실패 시 롤백

#### 도입 시 확인할 점

- 비교적 새로운 프로젝트이므로 대형 사이트, 잘못된 HTML, 무한 URL 공간에서의 안정성을 별도로 시험한다.
- 한 파일에 기능이 집중되어 있다면 로직을 그대로 가져오기보다 크롤러·파서·규칙 엔진으로 분리한다.
- 자동 업데이트 코드는 공급망 보안 관점에서 그대로 도입하지 않는다.

```bash
git clone https://github.com/puneetindersingh/open-seo-crawler.git
cd open-seo-crawler
python -m venv .venv
```

---

### 3.5 Auriti-Labs/geo-optimizer-skill

**용도:** GEO 준비도, citability, AI bot 접근 및 회귀 감사를 제공하는 CLI·Python·MCP 도구  
**추천 등급:** A — 직접 검토 후보  
**라이선스:** MIT

#### 원본 링크

- [GitHub 저장소](https://github.com/Auriti-Labs/geo-optimizer-skill)
- [README](https://github.com/Auriti-Labs/geo-optimizer-skill/blob/main/README.md)
- [LICENSE — MIT](https://github.com/Auriti-Labs/geo-optimizer-skill/blob/main/LICENSE)
- [릴리스](https://github.com/Auriti-Labs/geo-optimizer-skill/releases)
- [태그](https://github.com/Auriti-Labs/geo-optimizer-skill/tags)
- [커밋 기록](https://github.com/Auriti-Labs/geo-optimizer-skill/commits/main/)
- [이슈](https://github.com/Auriti-Labs/geo-optimizer-skill/issues)
- [Python 소스](https://github.com/Auriti-Labs/geo-optimizer-skill/tree/main/src/geo_optimizer)
- [내부 스킬 카탈로그](https://github.com/Auriti-Labs/geo-optimizer-skill/tree/main/src/geo_optimizer/skills/catalog)
- [테스트](https://github.com/Auriti-Labs/geo-optimizer-skill/tree/main/tests)
- [문서](https://github.com/Auriti-Labs/geo-optimizer-skill/tree/main/docs)
- [예제](https://github.com/Auriti-Labs/geo-optimizer-skill/tree/main/examples)
- [GitHub Action 정의](https://github.com/Auriti-Labs/geo-optimizer-skill/blob/main/action.yml)
- [PyPI 패키지](https://pypi.org/project/geo-optimizer-skill/)
- [전체 코드 검색](https://github.com/search?q=repo%3AAuriti-Labs%2Fgeo-optimizer-skill&type=code)

#### 벤치마킹할 요소

- `crawled → understood → cited → monitored`의 GEO 진단 프레임
- robots.txt의 AI bot별 접근 정책
- `llms.txt`, JSON-LD, 브랜드 엔티티, 콘텐츠 구조 검사
- 일반 브라우저와 AI bot 접근 차이 시뮬레이션
- 서버 로그에서 AI crawler user-agent 증거 추출
- citability를 기술 준비도와 별도 점수로 관리
- before/after diff, history, regression gate
- JSON 안정 계약, SARIF, GitHub Actions, MCP, Python API
- 플러그인 entry point 기반 커스텀 검사 확장
- URL 입력에 대한 SSRF 방어와 DNS pinning 설계

#### 도입 시 확인할 점

- `llms.txt`는 제안 규약이며 주요 AI 플랫폼의 채택·효과가 보장되지 않는다. 낮은 가중치 또는 정보성 판정으로 둔다.
- 준비도는 실제 인용과 다르므로 `AI Readiness`와 `AI Visibility` 점수를 합치지 않는다.
- 연구 기반이라고 표시된 각 수치와 규칙은 원 논문 및 재현 조건을 따로 검증한다.

```bash
git clone https://github.com/Auriti-Labs/geo-optimizer-skill.git
cd geo-optimizer-skill
git tag --sort=-version:refname
```

---

### 3.6 danishashko/geo-aeo-tracker

**용도:** 여러 AI 답변 엔진에서 브랜드 언급·인용을 추적하는 local-first 대시보드  
**추천 등급:** B — 설계 우선 참고  
**라이선스:** MIT

#### 원본 링크

- [GitHub 저장소](https://github.com/danishashko/geo-aeo-tracker)
- [README](https://github.com/danishashko/geo-aeo-tracker/blob/main/README.md)
- [LICENSE — MIT](https://github.com/danishashko/geo-aeo-tracker/blob/main/LICENSE)
- [릴리스](https://github.com/danishashko/geo-aeo-tracker/releases)
- [태그](https://github.com/danishashko/geo-aeo-tracker/tags)
- [커밋 기록](https://github.com/danishashko/geo-aeo-tracker/commits/main/)
- [이슈](https://github.com/danishashko/geo-aeo-tracker/issues)
- [환경변수 예시](https://github.com/danishashko/geo-aeo-tracker/blob/main/.env.example)
- [package.json](https://github.com/danishashko/geo-aeo-tracker/blob/main/package.json)
- [전체 코드 검색](https://github.com/search?q=repo%3Adanishashko%2Fgeo-aeo-tracker&type=code)
- [API route 검색](https://github.com/search?q=repo%3Adanishashko%2Fgeo-aeo-tracker+path%3Aapp%2Fapi&type=code)

#### 벤치마킹할 요소

- Prompt Hub와 `{brand}` 변수 주입
- 프롬프트×엔진 조합의 병렬 실행
- ChatGPT, Gemini, Perplexity, Grok, Copilot, Google AI 계열 비교
- 브랜드 언급, 위치, 빈도, 인용, 감성을 합친 가시성 지표
- 국가별 결과와 시계열 변화
- 경쟁사가 인용되고 자사는 빠진 URL을 찾는 citation opportunity
- persona fan-out과 업종별 고의도 질문 생성
- IndexedDB/localStorage 기본 저장과 선택적 Supabase 동기화
- 예약 실행, GitHub Actions 템플릿, CSV 내보내기, drift alert

#### 도입 시 확인할 점

- local-first라는 표현과 별개로 실제 AI 응답 수집은 Bright Data scraper API에 크게 의존한다.
- 특정 공급자의 dataset ID나 응답 포맷이 핵심 도메인 모델에 새지 않도록 provider adapter를 둔다.
- 직접 API 호출 결과와 실제 소비자용 검색 UI 결과는 동일하지 않을 수 있으므로 수집 방식을 결과에 기록한다.
- 프롬프트, 지역, 계정 상태, 시간에 따른 변동성을 고려해 반복 표본과 신뢰구간을 둔다.

```bash
git clone https://github.com/danishashko/geo-aeo-tracker.git
cd geo-aeo-tracker
npm install
```

---

### 3.7 ai-search-guru/GetCito

**용도:** AI 가시성 추적·경쟁사 분석을 위한 self-hosted 운영 플랫폼  
**추천 등급:** B — 설계 우선 참고  
**라이선스:** MIT

#### 원본 링크

- [GitHub 저장소](https://github.com/ai-search-guru/getcito-worlds-first-open-source-aio-aeo-or-geo-tool)
- [README](https://github.com/ai-search-guru/getcito-worlds-first-open-source-aio-aeo-or-geo-tool/blob/master/README.md)
- [LICENSE — MIT](https://github.com/ai-search-guru/getcito-worlds-first-open-source-aio-aeo-or-geo-tool/blob/master/LICENSE.md)
- [릴리스](https://github.com/ai-search-guru/getcito-worlds-first-open-source-aio-aeo-or-geo-tool/releases)
- [태그](https://github.com/ai-search-guru/getcito-worlds-first-open-source-aio-aeo-or-geo-tool/tags)
- [커밋 기록](https://github.com/ai-search-guru/getcito-worlds-first-open-source-aio-aeo-or-geo-tool/commits/master/)
- [이슈](https://github.com/ai-search-guru/getcito-worlds-first-open-source-aio-aeo-or-geo-tool/issues)
- [웹 앱](https://github.com/ai-search-guru/getcito-worlds-first-open-source-aio-aeo-or-geo-tool/tree/master/apps/web)
- [백그라운드 worker](https://github.com/ai-search-guru/getcito-worlds-first-open-source-aio-aeo-or-geo-tool/tree/master/apps/worker)
- [공유 패키지](https://github.com/ai-search-guru/getcito-worlds-first-open-source-aio-aeo-or-geo-tool/tree/master/packages)
- [API 명세 패키지](https://github.com/ai-search-guru/getcito-worlds-first-open-source-aio-aeo-or-geo-tool/tree/master/packages/api-spec)
- [provider 및 공통 라이브러리](https://github.com/ai-search-guru/getcito-worlds-first-open-source-aio-aeo-or-geo-tool/tree/master/packages/lib)
- [환경설정 레지스트리](https://github.com/ai-search-guru/getcito-worlds-first-open-source-aio-aeo-or-geo-tool/tree/master/packages/config)
- [Docker Compose](https://github.com/ai-search-guru/getcito-worlds-first-open-source-aio-aeo-or-geo-tool/blob/master/docker-compose.yml)
- [E2E 테스트](https://github.com/ai-search-guru/getcito-worlds-first-open-source-aio-aeo-or-geo-tool/tree/master/e2e)
- [전체 코드 검색](https://github.com/search?q=repo%3Aai-search-guru%2Fgetcito-worlds-first-open-source-aio-aeo-or-geo-tool&type=code)

#### 벤치마킹할 요소

- scraper와 LLM 공급자를 교체할 수 있는 provider adapter
- 브랜드, 경쟁사, 프롬프트, 응답 snapshot의 도메인 모델
- PostgreSQL과 `pg-boss`를 이용한 예약 작업, 내구성 있는 큐, 재시도
- 웹 API와 worker 분리
- Bearer 인증 REST API와 OpenAPI 명세
- 보고서 생성의 비동기 처리
- local/demo/white-label/cloud 배포 모드 분리
- Playwright E2E, Vitest, Changesets 등 운영 가능한 모노레포 품질 도구

#### 도입 시 확인할 점

- PostgreSQL, worker, 인증, white-label까지 포함하므로 초기 MVP에는 무겁다.
- `.env.local` 예제에 실제 비밀값이 포함되지 않았는지 반드시 검사한다.
- 외부 scraper의 이용약관, 개인정보, 지역별 자동화 규정을 별도 검토한다.

```bash
git clone https://github.com/ai-search-guru/getcito-worlds-first-open-source-aio-aeo-or-geo-tool.git getcito
cd getcito
docker compose build
```

---

### 3.8 amplifying-ai/awesome-generative-engine-optimization

**용도:** GEO 연구, 도구, 사례와 산업 자료 큐레이션  
**추천 등급:** D — 자료 참고

#### 원본 링크

- [GitHub 저장소](https://github.com/amplifying-ai/awesome-generative-engine-optimization)
- [README/큐레이션 목록](https://github.com/amplifying-ai/awesome-generative-engine-optimization/blob/main/README.md)
- [커밋 기록](https://github.com/amplifying-ai/awesome-generative-engine-optimization/commits/main/)
- [이슈](https://github.com/amplifying-ai/awesome-generative-engine-optimization/issues)
- [Pull requests](https://github.com/amplifying-ai/awesome-generative-engine-optimization/pulls)
- [저장소 라이선스 파일 확인](https://github.com/amplifying-ai/awesome-generative-engine-optimization/search?q=license&type=code)

#### 벤치마킹할 요소

- GEO 규칙 근거가 될 논문과 산업 보고서 탐색
- 신규 AI visibility 도구와 기능 변화 모니터링
- 경쟁 제품의 공통 지표와 용어 수집
- 인용, entity, crawler access, authority 등 연구 주제 분류

#### 도입 시 확인할 점

- 목록에 포함되었다는 사실은 품질 검증이나 재현성을 뜻하지 않는다.
- 마케팅 사례와 제3자 통계는 반드시 원출처를 따라가서 확인한다.
- 명시적 라이선스가 확인되지 않은 큐레이션 텍스트나 자료를 제품 문서에 복사하지 않는다.

---

### 3.9 google/schemarama

**용도:** ShEx·SHACL 기반 Schema.org 구조화 데이터 검증 연구 프레임워크  
**추천 등급:** C — 아카이브, 설계만 참고  
**라이선스:** Apache-2.0  
**상태:** 2025-10-22 아카이브, README에서 프로덕션 사용을 권장하지 않음

#### 원본 링크

- [GitHub 저장소 — archived](https://github.com/google/schemarama)
- [README](https://github.com/google/schemarama/blob/main/README.md)
- [LICENSE — Apache-2.0](https://github.com/google/schemarama/blob/main/LICENSE)
- [커밋 기록](https://github.com/google/schemarama/commits/main/)
- [이슈](https://github.com/google/schemarama/issues)
- [검증 코어](https://github.com/google/schemarama/tree/main/core)
- [데모](https://github.com/google/schemarama/tree/main/demo)
- [KGX](https://github.com/google/schemarama/tree/main/kgx)
- [문서](https://github.com/google/schemarama/tree/main/docs)
- [전체 코드 검색](https://github.com/search?q=repo%3Agoogle%2Fschemarama&type=code)

#### 벤치마킹할 요소

- Schema.org 자체 유효성과 특정 서비스의 정보 요구사항을 분리하는 개념
- 하나의 마크업을 여러 validation profile로 검사하는 구조
- 오류만 나열하지 않고 어떤 소비자 기능에 적격한지 설명하는 방식
- ShEx와 SHACL 같은 표준 기반 shape 정의

#### 도입 시 확인할 점

- 신규 제품의 핵심 런타임 의존성으로 사용하지 않는다.
- 구현 코드를 포크하기보다 validation profile 레이어 설계만 차용한다.
- Apache-2.0 코드 사용 시 LICENSE·NOTICE와 변경 고지를 검토한다.

```bash
git clone https://github.com/google/schemarama.git
cd schemarama
git log -1 --format='%H %cI %s'
```

---

### 3.10 adobe/structured-data-validator

**용도:** Schema.org 및 Google Rich Results 요구사항 기반 구조화 데이터 검증 라이브러리  
**추천 등급:** A — 직접 검토 후보  
**라이선스:** Apache-2.0

#### 원본 링크

- [GitHub 저장소](https://github.com/adobe/structured-data-validator)
- [README](https://github.com/adobe/structured-data-validator/blob/main/README.md)
- [LICENSE — Apache-2.0](https://github.com/adobe/structured-data-validator/blob/main/LICENSE)
- [CHANGELOG](https://github.com/adobe/structured-data-validator/blob/main/CHANGELOG.md)
- [릴리스](https://github.com/adobe/structured-data-validator/releases)
- [태그](https://github.com/adobe/structured-data-validator/tags)
- [커밋 기록](https://github.com/adobe/structured-data-validator/commits/main/)
- [이슈](https://github.com/adobe/structured-data-validator/issues)
- [소스](https://github.com/adobe/structured-data-validator/tree/main/src)
- [package.json](https://github.com/adobe/structured-data-validator/blob/main/package.json)
- [npm 패키지 `@adobe/structured-data-validator`](https://www.npmjs.com/package/@adobe/structured-data-validator)
- [전체 코드 검색](https://github.com/search?q=repo%3Aadobe%2Fstructured-data-validator&type=code)
- [연동 추출기 `@marbec/web-auto-extractor`](https://www.npmjs.com/package/@marbec/web-auto-extractor)

#### 벤치마킹할 요소

- Schema.org 표준과 Google Rich Results 요구사항의 이중 검증
- ERROR/WARNING 심각도
- 데이터 구조 내 오류 path, 관련 fieldNames, 원문 character location 반환
- 커스텀 type handler 기반 확장
- 최신 Schema.org JSON-LD vocabulary 주입
- JSON-LD, Microdata, RDFa 추출기와 검증기의 분리

#### 권장 적용 계층

1. Schema.org 문법·타입 유효성
2. Google Rich Results 필수·권장 필드
3. 업종별 내부 validation profile
4. 페이지 가시 콘텐츠와 structured data 값의 일치
5. 사이트 전체 `@id`, Organization, Person, Product 엔티티 일관성

#### 도입 시 확인할 점

- 추출은 별도 패키지에 의존하므로 두 패키지의 라이선스와 보안 상태를 함께 검사한다.
- Google Rich Results 요구사항 변화에 맞춰 규칙 업데이트 주기를 둔다.
- Apache-2.0의 LICENSE·NOTICE·변경 고지 요구사항을 검토한다.

```bash
git clone https://github.com/adobe/structured-data-validator.git
cd structured-data-validator
npm install
npm test
```

## 4. 통합 벤치마킹 요구사항

### 4.1 통합 결과 모델

모든 검사기는 아래와 같은 공통 결과 계약으로 변환하는 것이 좋다.

```json
{
  "ruleId": "technical.canonical.multiple",
  "category": "technical-seo",
  "status": "fail",
  "severity": "high",
  "confidence": 1.0,
  "scoreImpact": -5,
  "url": "https://example.com/page",
  "message": "canonical 링크가 2개 발견되었습니다.",
  "expected": "정규 canonical 1개",
  "actual": 2,
  "evidence": [],
  "remediation": {},
  "references": [],
  "ruleVersion": "1.0.0"
}
```

필수 설계 원칙:

- 판정과 심각도를 분리한다.
- 점수와 원시 이슈를 모두 보존한다.
- 증거, 발견 위치, 실제값을 남긴다.
- 규칙 버전과 근거 문서의 검토일을 기록한다.
- LLM의 해석과 결정론적 검사를 명확히 구분한다.
- URL별 이슈와 템플릿·사이트 전체 원인을 연결한다.

### 4.2 점수 체계

점수는 최소 세 축으로 분리한다.

| 점수 | 측정 대상 | 예시 |
|---|---|---|
| SEO Health | 전통 검색 기술 상태 | 크롤, canonical, hreflang, 성능, schema |
| AI Readiness | AI crawler 접근 및 콘텐츠 이해 가능성 | bot 접근, entity, 구조, 출처, citability |
| AI Visibility | 실제 AI 답변에서의 성과 | 언급, 인용, 위치, 점유율, 감성 |

세 점수를 하나로 합치면 원인 진단이 어려워지므로 별도 표시하고, 필요한 경우에만 가중 종합 지표를 추가한다.

> **CiteGraph 적용 시 명칭 정정**: 위 표는 일반화된 업계 용어다. CiteGraph의
> 공식 명칭은 `citegraph-rule-registry-draft.md`/`citegraph-phase1-mvp-design.md`
> 기준 **SEO Score**(위 "SEO Health"에 대응)와 **GEO Readiness Score**(위
> "AI Readiness"에 대응, 하위에 Technical/Semantic)이다. "AI Visibility"는
> CiteGraph에서 세 번째 점수가 아니라 **점수에 포함되지 않는 별도 관측
> 데이터**다(Phase 1 확정 결정: "MOCK 관측값은 진단 총점, 추세, 보고서의
> 실제 수치에 포함하지 않는다"). 이 문서를 CiteGraph 작업에 참고할 때는
> 이 문단의 대응관계를 따르고, 표의 업계 용어를 그대로 코드나 UI 문구에
> 옮기지 않는다.

### 4.3 크롤 비용 계층화

| 단계 | 적용 범위 | 검사 |
|---|---|---|
| 1. 경량 | 전체 URL | HTTP, 메타, 링크, robots, sitemap, raw HTML |
| 2. 렌더링 | 템플릿별 대표·이상 URL | JS DOM, lazy content, client redirect |
| 3. 정밀 | 핵심 페이지와 표본 | Lighthouse, CWV, screenshot, 접근성 |

모든 페이지에 브라우저와 Lighthouse를 실행하지 말고 템플릿 군집, 중요도, 이상 징후를 기준으로 표본을 선정한다.

### 4.4 AI 가시성 측정 모델

측정 단위는 최소한 다음 차원을 포함한다.

```text
workspace / brand / competitor / prompt / persona
engine / collection-method / locale / country / timestamp / response
mention / citation / cited-url / position / sentiment / confidence
```

반드시 저장할 재현 정보:

- 실행 프롬프트 원문
- 모델·검색 surface·수집 provider
- 국가·언어·시간
- 응답 원문과 인용 URL
- 파싱 규칙 또는 분석 모델 버전
- 실패·재시도·캐시 여부

## 5. 구현 우선순위

### 1단계 — 감사 코어

- 공통 규칙 인터페이스와 증거 모델
- HTTP/HTML 크롤러와 사이트 링크 그래프
- robots.txt, sitemap, status, redirect, canonical, hreflang
- title, description, heading, image, internal link
- JSON·Markdown·HTML·SARIF 출력
- Adobe 기반 구조화 데이터 검증 PoC

### 2단계 — 운영 가능한 감사

- 크롤 스냅샷과 신규·해결·재발 diff
- URL 템플릿 군집과 이슈 그룹화
- CMS 감지 및 권장 제외 프리셋
- 선택적 Playwright/Lighthouse
- CI 임계값과 회귀 gate
- 프로젝트·실행 이력 저장

### 3단계 — GEO 준비도

- AI bot별 robots 접근
- 일반 브라우저와 bot fetch 차이
- entity coherence와 구조화 데이터 완전성
- 출처, 저자, 날짜, 통계 및 인용 가능한 블록
- `llms.txt` 정보성 검사
- AI crawler 서버 로그 분석

### 4단계 — AI 가시성 실측

- provider adapter
- 프롬프트×엔진×지역 예약 실행
- 언급·인용·경쟁사 추출
- citation gap과 share of voice
- 시계열과 drift alert
- 수정 전후 재측정

## 6. 소스를 안전하게 가져오는 절차

### 6.1 저장소 고정

`main` 또는 `master`를 그대로 의존하지 말고 검토한 커밋 SHA나 태그를 고정한다.

```bash
git clone <repository-url>
cd <repository-directory>
git fetch --tags
git log -1 --format='%H %cI %s'
git tag --points-at HEAD
```

검토 기록에 다음을 남긴다.

```text
repository:
commit_sha:
tag:
retrieved_at:
license_file:
license_spdx:
files_reused:
files_modified:
upstream_notice:
```

### 6.2 라이선스·보안 확인

- 루트의 `LICENSE`, `LICENSE.md`, `NOTICE`, `COPYING`을 확인한다.
- 하위 디렉터리에 별도 라이선스가 있는지 검색한다.
- package lock을 포함해 서드파티 의존성 라이선스를 스캔한다.
- 복사한 파일의 원 저작권 헤더를 보존한다.
- 수정한 파일과 수정 내용을 기록한다.
- AGPL/GPL 코드는 폐쇄형 코드베이스와 섞기 전에 법무 검토한다.
- 릴리스 tarball과 GitHub 기본 브랜치의 라이선스가 같은지 확인한다.
- secret, `.env`, 테스트 키, telemetry, 자동 업데이트 코드를 검사한다.
- URL fetcher는 SSRF, DNS rebinding, redirect-to-private-IP를 시험한다.

### 6.3 권장 소스 반입 구조

```text
third_party/
  project-name/
    UPSTREAM.md        # 저장소, SHA, 태그, 반입일
    LICENSE            # 원본 라이선스
    NOTICE             # 필요한 경우
    PATCHES.md         # 변경 기록
    source/            # 실제 반입 파일
```

외부 프로젝트 전체를 복사하지 않고 필요한 모듈만 가져오더라도 `UPSTREAM.md`와 라이선스 사본은 유지한다.

### 6.4 벤치마킹 기록 양식

```markdown
## 프로젝트명

- Repository:
- Commit/tag:
- License:
- 검토한 파일:
- 가져올 설계:
- 가져올 코드:
- 가져오지 않을 부분:
- 의존성:
- 보안 위험:
- 라이선스 의무:
- 자체 구현과의 경계:
- 검증 테스트:
```

## 7. 피해야 할 접근

- 규칙 개수를 제품 품질의 핵심 KPI로 사용하는 것
- README의 기능·규칙 수·별 개수를 고정된 사실처럼 복사하는 것
- AGPL 코드를 MIT처럼 취급하거나 폐쇄형 서비스에 무검토로 포함하는 것
- archived 프로젝트를 핵심 런타임 의존성으로 채택하는 것
- 모든 URL에 Lighthouse를 실행하는 것
- `llms.txt` 존재를 실제 인용 성과로 해석하는 것
- LLM이 생성한 권고를 결정론적 검사 결과처럼 표시하는 것
- 외부 scraper 한 곳의 응답 포맷에 데이터 모델을 종속시키는 것
- AI 답변을 한 번 실행하고 순위처럼 단정하는 것
- 원본 응답, 시간, 지역, 프롬프트, provider를 저장하지 않는 것

## 8. 최종 채택 권고

| 프로젝트 | 권고 | 이유 |
|---|---|---|
| seo-audit-skill | 우선 코드·설계 검토 | 규칙 계약과 다중 출력의 기준점 |
| seonaut | 운영 UX·데이터 모델 참고 | 장기 프로젝트와 이력 관리가 강점 |
| site-audit-seo | 설계만 독립 참고 | Lighthouse 결합은 유용하지만 AGPL 주의 |
| open-seo-crawler | 크롤링 PoC 후보 | CMS 프리셋과 실무형 리포트가 강점 |
| geo-optimizer-skill | GEO 모듈 우선 검토 | 준비도, 회귀, MCP·SARIF 구조가 우수 |
| geo-aeo-tracker | 측정 UX 참고 | 멀티엔진·시계열·citation gap이 강점 |
| GetCito | 운영 아키텍처 참고 | provider, queue, API, worker 구조가 성숙 |
| awesome GEO | 리서치 레이더 | 코드가 아닌 근거·시장 탐색용 |
| Schemarama | 개념만 참고 | profile 설계는 유용하나 archived/experimental |
| Adobe validator | 통합 PoC 우선 후보 | 구조화된 오류와 Google 요구사항 검증 |

가장 좋은 조합은 다음과 같다.

> `seo-audit-skill`의 규칙 계약 + `open-seo-crawler`의 크롤 UX + `seonaut`의 운영 모델 + `geo-optimizer-skill`의 GEO·회귀 구조 + `geo-aeo-tracker`/`GetCito`의 실측 모델 + Adobe validator의 구조화 데이터 검증

이 조합의 최종 차별점은 단순히 이슈를 많이 찾는 것이 아니라, **증거를 보존하고 수정 우선순위를 제시하며 수정 이후 SEO 상태와 실제 AI 인용 성과를 다시 측정하는 폐쇄 루프**다.
