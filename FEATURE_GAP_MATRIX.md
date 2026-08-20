# CiteGraph Feature Gap Matrix

> **프로젝트명**: CiteGraph (`seogeoaeo`)  
> **문서명/역할**: Stage 0 전체 후보 기능 격차·채택 판정  
> **버전**: `2026.08.19-v1.1`  
> **최종 갱신일**: 2026-08-19  
> **작업 담당 AI**: OpenAI Codex  
> **사용 모델**: GPT-5  
> **문서 상태**: 기획 검토안 (비정본·읽기 전용 감사)

> 적용 범위: 첨부 마스터 문서의 전체 기능 카탈로그와 현재 저장소 구현 비교. 코드·스키마·점수 규칙 변경 없음.

## 1. 판정 원칙

이 문서는 후보 기능을 현재 정본으로 승격하지 않는다. 현재 구현 기준은 DOCUMENT_MATRIX.md §2와 rulesetVersion 2026.08.1이다. COMPLETE는 UI, API, 저장, 테스트, 운영 경로가 모두 확인될 때만 부여했다. 그 엄격한 기준에서 이번 카탈로그의 COMPLETE는 0개다.

상태는 COMPLETE, PARTIAL, MISSING, DUPLICATED, UNRELIABLE, NOT_NEEDED, BLOCKED 중 하나다. 추천은 ADOPT NOW, PILOT, LAB ONLY, REJECT, BUY/CONNECT와 선행조건 미충족 항목을 위한 DEFER를 사용했다.

점수 열은 사용자가 요청한 8개 차원을 1~5로 표시한다: 고객가치/신뢰/실행가능성/차별성/수익화/개발비용/운영비용/리스크. 비용과 리스크는 5가 부담이 큰 방향이다. 동일 추천군에는 1차 포트폴리오 비교용 공통 프로파일을 적용했으며, 실제 착수 전 acceptance test와 원가 추정으로 재평가해야 한다.

## 2. 증거 코드

- E1: lib/audit-guard.ts, lib/audit-service.ts 및 SSRF 테스트
- E2: lib/v2 Evidence Layer, Page Type, Fact scoring 및 관련 테스트
- E3: D1 migrations, repositories, audit persistence
- E4: rulesetVersion 2026.08.1 v1 엔진과 테스트
- E5: compare API/service/normalization/UI 및 테스트
- E6: 현재 URL 감사 UI와 API 결과 공개 방식
- E7: package/schema/repository 전역 조사—인증, 테넌시, 사용량 원장, 결제, 작업 시스템 부재
- E8: connector/observation/provider 수집 계층 부재

## 3. 전체 매트릭스

| ID | 기능 | 현재 상태 | 추천 | 8차원 점수 | 증거 |
|---|---|---|---|---|---|
| COL-01 | 도메인 소유권 확인 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E1/E3 |
| COL-02 | 크롤 정책 설정 | MISSING | ADOPT NOW | 5/5/4/4/5/3/2/2 | E1/E3 |
| COL-03 | robots.txt 준수·매트릭스 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E1/E3 |
| COL-04 | sitemap·내부 링크 URL 발견 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E1/E3 |
| COL-05 | canonical URL 정규화 | PARTIAL | PILOT | 4/4/4/4/4/4/3/3 | E1/E3 |
| COL-06 | JavaScript 렌더링 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E1/E3 |
| COL-07 | 로그인 영역 크롤 | MISSING | DEFER | 3/3/3/3/3/4/3/3 | E1/E3 |
| COL-08 | 예약·증분 스캔 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E1/E3 |
| COL-09 | 스캔 비용 예측·상한 | MISSING | ADOPT NOW | 5/5/4/4/5/3/2/2 | E1/E3 |
| COL-10 | 부분 성공·재개 | PARTIAL | ADOPT NOW | 5/5/4/4/5/3/2/2 | E1/E3 |
| COL-11 | 원본 증거 보관 | PARTIAL | ADOPT NOW | 5/5/4/4/5/3/2/2 | E1/E3 |
| COL-12 | 스테이징 대 프로덕션 비교 | MISSING | DEFER | 3/3/3/3/3/4/3/3 | E1/E3 |
| TSEO-01 | 상태코드·리디렉션 체인 | PARTIAL | ADOPT NOW | 5/5/4/4/5/3/2/2 | E1/E4 |
| TSEO-02 | indexability 종합 판정 | PARTIAL | ADOPT NOW | 5/5/4/4/5/3/2/2 | E1/E4 |
| TSEO-03 | title·description·H1 | PARTIAL | ADOPT NOW | 5/5/4/4/5/3/2/2 | E1/E4 |
| TSEO-04 | canonical 충돌 | PARTIAL | ADOPT NOW | 5/5/4/4/5/3/2/2 | E1/E4 |
| TSEO-05 | hreflang 클러스터 | MISSING | DEFER | 3/3/3/3/3/4/3/3 | E1/E4 |
| TSEO-06 | sitemap 품질 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E1/E4 |
| TSEO-07 | 내부 링크 그래프 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E1/E4 |
| TSEO-08 | 정확·근접 중복 | MISSING | DEFER | 3/3/3/3/3/4/3/3 | E1/E4 |
| TSEO-09 | 얇은 콘텐츠 | PARTIAL | DEFER | 3/3/3/3/3/4/3/3 | E1/E4 |
| TSEO-10 | 이미지 SEO | PARTIAL | DEFER | 3/3/3/3/3/4/3/3 | E1/E4 |
| TSEO-11 | 구조화 데이터 검증 | PARTIAL | PILOT | 4/4/4/4/4/4/3/3 | E1/E4 |
| TSEO-12 | Core Web Vitals | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E1/E4 |
| TSEO-13 | 모바일 렌더 비교 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E1/E4 |
| TSEO-14 | JS SEO 차이 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E1/E4 |
| TSEO-15 | 보안·HTTPS 기본 | PARTIAL | DEFER | 3/3/3/3/3/4/3/3 | E1/E4 |
| TSEO-16 | pagination·faceted URL | MISSING | DEFER | 3/3/3/3/3/4/3/3 | E1/E4 |
| TSEO-17 | 로그 기반 실제 봇 활동 | MISSING | DEFER | 3/3/3/3/3/4/3/3 | E1/E4 |
| TSEO-18 | 변경 영향 분석 | MISSING | DEFER | 3/3/3/3/3/4/3/3 | E1/E4 |
| CON-01 | 검색 의도·페이지 유형 | PARTIAL | ADOPT NOW | 5/5/4/4/5/3/2/2 | E2/E4 |
| CON-02 | 주제 커버리지 | MISSING | DEFER | 3/3/3/3/3/4/3/3 | E2/E4 |
| CON-03 | 질문-답변 커버리지 | PARTIAL | PILOT | 4/4/4/4/4/4/3/3 | E2/E4 |
| CON-04 | 주장-근거 연결 | PARTIAL | PILOT | 4/4/4/4/4/4/3/3 | E2/E4 |
| CON-05 | 작성자·검수자·최신성 | PARTIAL | PILOT | 4/4/4/4/4/4/3/3 | E2/E4 |
| CON-06 | 독창 정보 탐지 | MISSING | DEFER | 3/3/3/3/3/4/3/3 | E2/E4 |
| CON-07 | 콘텐츠 중복·잠식 | MISSING | DEFER | 3/3/3/3/3/4/3/3 | E2/E4 |
| CON-08 | 내부 링크 제안 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E2/E4 |
| CON-09 | 콘텐츠 갭 | MISSING | DEFER | 3/3/3/3/3/4/3/3 | E2/E4 |
| CON-10 | 업데이트 우선순위 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E2/E4 |
| CON-11 | 접근성·가독성 | PARTIAL | DEFER | 3/3/3/3/3/4/3/3 | E2/E4 |
| CON-12 | 자동 수정 초안 | MISSING | DEFER | 3/3/3/3/3/4/3/3 | E2/E4 |
| CON-13 | 브랜드·규제 가드레일 | MISSING | DEFER | 3/3/3/3/3/4/3/3 | E2/E4 |
| CON-14 | 콘텐츠 decay 탐지 | MISSING | DEFER | 3/3/3/3/3/4/3/3 | E2/E4 |
| GEO-01 | AI 크롤러 접근 매트릭스 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E2/E4 |
| GEO-02 | 본문 파싱 성공률 | PARTIAL | ADOPT NOW | 5/5/4/4/5/3/2/2 | E2/E4 |
| GEO-03 | 엔터티 일관성 | PARTIAL | PILOT | 4/4/4/4/4/4/3/3 | E2/E4 |
| GEO-04 | 답변 가능 구절 | PARTIAL | PILOT | 4/4/4/4/4/4/3/3 | E2/E4 |
| GEO-05 | 수치 인용 품질 | PARTIAL | PILOT | 4/4/4/4/4/4/3/3 | E2/E4 |
| GEO-06 | 출처 추적 가능성 | PARTIAL | ADOPT NOW | 5/5/4/4/5/3/2/2 | E2/E4 |
| GEO-07 | 멀티모달 자산 | MISSING | DEFER | 3/3/3/3/3/4/3/3 | E2/E4 |
| GEO-08 | llms.txt 검사 | MISSING | LAB ONLY | 2/2/2/3/2/3/3/4 | E2/E4 |
| GEO-09 | AI 전용 Schema 점수 | NOT_NEEDED | REJECT | 1/1/1/1/1/4/4/5 | E2/E4 |
| GEO-10 | “AI가 좋아하는 문체” 점수 | NOT_NEEDED | REJECT | 1/1/1/1/1/4/4/5 | E2/E4 |
| GEO-11 | 인용확률 단일 예측치 | NOT_NEEDED | REJECT | 1/1/1/1/1/4/4/5 | E2/E4 |
| GEO-12 | 실험 규칙 registry | PARTIAL | LAB ONLY | 2/2/2/3/2/3/3/4 | E2/E4 |
| OBS-01 | GSC OAuth 연결 | MISSING | BUY/CONNECT | 4/5/4/3/4/2/3/2 | E7/E8 |
| OBS-02 | 쿼리·페이지·국가·기기 추세 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E7/E8 |
| OBS-03 | GSC URL/감사 이슈 결합 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E7/E8 |
| OBS-04 | GA4 전환 결합 | MISSING | BUY/CONNECT | 4/5/4/3/4/2/3/2 | E7/E8 |
| OBS-05 | CrUX 실사용자 성능 | MISSING | BUY/CONNECT | 4/5/4/3/4/2/3/2 | E7/E8 |
| OBS-06 | 순위 추적 | MISSING | BUY/CONNECT | 4/5/4/3/4/2/3/2 | E7/E8 |
| OBS-07 | SERP feature/AIO 존재 | MISSING | BUY/CONNECT | 4/5/4/3/4/2/3/2 | E7/E8 |
| OBS-08 | SEO share of voice | MISSING | DEFER | 3/3/3/3/3/4/3/3 | E7/E8 |
| OBS-09 | anomaly 탐지 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E7/E8 |
| OBS-10 | 변경 annotation | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E7/E8 |
| OBS-11 | 원인 후보 분석 | MISSING | DEFER | 3/3/3/3/3/4/3/3 | E7/E8 |
| OBS-12 | 기회 매출 추정 | MISSING | DEFER | 3/3/3/3/3/4/3/3 | E7/E8 |
| AIO-01 | 질문 세트 관리 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E7/E8 |
| AIO-02 | query fan-out 후보 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E7/E8 |
| AIO-03 | 다중 AI 엔진 실행 | BLOCKED | PILOT | 4/4/4/4/4/4/3/3 | E7/E8 |
| AIO-04 | 반복 측정 | BLOCKED | PILOT | 4/4/4/4/4/4/3/3 | E7/E8 |
| AIO-05 | 브랜드 언급 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E7/E8 |
| AIO-06 | 클릭 가능한 인용 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E7/E8 |
| AIO-07 | 경쟁사 share of voice | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E7/E8 |
| AIO-08 | 주제·프롬프트 갭 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E7/E8 |
| AIO-09 | 인용 출처 네트워크 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E7/E8 |
| AIO-10 | 답변 감성·서술 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E7/E8 |
| AIO-11 | 오류·환각 모니터링 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E7/E8 |
| AIO-12 | AI referral 추적 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E7/E8 |
| AIO-13 | prompt cohort 버전 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E7/E8 |
| AIO-14 | API 비용 예산 | BLOCKED | PILOT | 4/4/4/4/4/4/3/3 | E7/E8 |
| CMP-01 | 경쟁사 세트 | PARTIAL | PILOT | 4/4/4/4/4/4/3/3 | E5 |
| CMP-02 | 기술 건강 비교 | PARTIAL | PILOT | 4/4/4/4/4/4/3/3 | E5 |
| CMP-03 | 콘텐츠/주제 격차 | MISSING | DEFER | 3/3/3/3/3/4/3/3 | E5 |
| CMP-04 | 경쟁사 신규/변경 페이지 | MISSING | DEFER | 3/3/3/3/3/4/3/3 | E5 |
| CMP-05 | 인용 격차 | MISSING | DEFER | 3/3/3/3/3/4/3/3 | E5 |
| CMP-06 | SERP overlap | MISSING | DEFER | 3/3/3/3/3/4/3/3 | E5 |
| CMP-07 | 과도한 백링크 DB 자체 구축 | NOT_NEEDED | REJECT | 1/1/1/1/1/4/4/5 | E5 |
| CMP-08 | 외부 권위 데이터 연결 | MISSING | BUY/CONNECT | 4/5/4/3/4/2/3/2 | E5 |
| ACT-01 | 영향×확신×노력 우선순위 | MISSING | DEFER | 3/3/3/3/3/4/3/3 | E6/E7 |
| ACT-02 | 수정 가이드 | PARTIAL | ADOPT NOW | 5/5/4/4/5/3/2/2 | E6/E7 |
| ACT-03 | 담당자·상태·기한 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E6/E7 |
| ACT-04 | Jira/Linear/GitHub 연동 | MISSING | DEFER | 3/3/3/3/3/4/3/3 | E6/E7 |
| ACT-05 | CMS draft 생성 | MISSING | DEFER | 3/3/3/3/3/4/3/3 | E6/E7 |
| ACT-06 | 수정 후 자동 재검증 | MISSING | ADOPT NOW | 5/5/4/4/5/3/2/2 | E6/E7 |
| ACT-07 | 전후 성과 추적 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E6/E7 |
| ACT-08 | ignore/exception 관리 | MISSING | ADOPT NOW | 5/5/4/4/5/3/2/2 | E6/E7 |
| ACT-09 | 회귀 알림 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E6/E7 |
| ACT-10 | CI 품질 게이트 | MISSING | DEFER | 3/3/3/3/3/4/3/3 | E6/E7 |
| ACT-11 | 실험·가설 관리 | MISSING | DEFER | 3/3/3/3/3/4/3/3 | E6/E7 |
| ACT-12 | recommendation feedback | MISSING | ADOPT NOW | 5/5/4/4/5/3/2/2 | E6/E7 |
| REP-01 | 경영진 요약 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E6/E7 |
| REP-02 | 전문가 상세 보고 | PARTIAL | ADOPT NOW | 5/5/4/4/5/3/2/2 | E6/E7 |
| REP-03 | 화이트라벨 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E6/E7 |
| REP-04 | 예약 보고서 | MISSING | PILOT | 4/4/4/4/4/4/3/3 | E6/E7 |
| REP-05 | 공유 링크·권한 | BLOCKED | PILOT | 4/4/4/4/4/4/3/3 | E6/E7 |
| REP-06 | CSV/JSON/API export | PARTIAL | ADOPT NOW | 5/5/4/4/5/3/2/2 | E6/E7 |
| REP-07 | 다중 고객 포트폴리오 | BLOCKED | PILOT | 4/4/4/4/4/4/3/3 | E6/E7 |
| REP-08 | 사용자 역할 | BLOCKED | PILOT | 4/4/4/4/4/4/3/3 | E6/E7 |
| REP-09 | 감사 로그 | BLOCKED | DEFER | 3/3/3/3/3/4/3/3 | E6/E7 |
| REP-10 | SSO/SAML/SCIM | BLOCKED | DEFER | 3/3/3/3/3/4/3/3 | E6/E7 |
| REP-11 | SLA·데이터 보존 설정 | BLOCKED | DEFER | 3/3/3/3/3/4/3/3 | E6/E7 |
| REP-12 | 다국어 보고서 | MISSING | DEFER | 3/3/3/3/3/4/3/3 | E6/E7 |
| BUS-01 | 무료 즉시 감사 | PARTIAL | PILOT | 4/4/4/4/4/4/3/3 | E3/E7 |
| BUS-02 | 가치 기반 paywall | BLOCKED | PILOT | 4/4/4/4/4/4/3/3 | E3/E7 |
| BUS-03 | 사용량 계량 | BLOCKED | ADOPT NOW | 5/5/4/4/5/3/2/2 | E3/E7 |
| BUS-04 | hard/soft limit | BLOCKED | ADOPT NOW | 5/5/4/4/5/3/2/2 | E3/E7 |
| BUS-05 | trial activation | BLOCKED | PILOT | 4/4/4/4/4/4/3/3 | E3/E7 |
| BUS-06 | 셀프서비스 결제 | BLOCKED | BUY/CONNECT | 4/5/4/3/4/2/3/2 | E3/E7 |
| BUS-07 | 좌석·워크스페이스 과금 | BLOCKED | PILOT | 4/4/4/4/4/4/3/3 | E3/E7 |
| BUS-08 | AI/SERP 크레딧 | BLOCKED | DEFER | 3/3/3/3/3/4/3/3 | E3/E7 |
| BUS-09 | 수익·원가 대시보드 | BLOCKED | PILOT | 4/4/4/4/4/4/3/3 | E3/E7 |
| BUS-10 | 기능 플래그 | MISSING | ADOPT NOW | 5/5/4/4/5/3/2/2 | E3/E7 |
| BUS-11 | 온보딩 checklist | MISSING | ADOPT NOW | 5/5/4/4/5/3/2/2 | E3/E7 |
| BUS-12 | 인앱 ROI 리포트 | BLOCKED | DEFER | 3/3/3/3/3/4/3/3 | E3/E7 |
| BUS-13 | 파트너/리셀러 | BLOCKED | DEFER | 3/3/3/3/3/4/3/3 | E3/E7 |
| BUS-14 | 전문 서비스 애드온 | BLOCKED | DEFER | 3/3/3/3/3/4/3/3 | E3/E7 |
| BUS-15 | API/데이터 라이선스 | BLOCKED | DEFER | 3/3/3/3/3/4/3/3 | E3/E7 |
| BUS-16 | 벤치마크 데이터 제품 | BLOCKED | DEFER | 3/3/3/3/3/4/3/3 | E3/E7 |

## 4. 핵심 항목 상세 판정

### CMP-02 기술 건강 비교

- 현재 상태: PARTIAL
- 증거: 2026-08-19 신뢰 복구 slice에서 합성 citation/mention/position을 제거했다. 실제 플랫폼·질문 관측이 없으면 데이터 계약과 UI가 `UNAVAILABLE`이며 AI Visibility 승자 선정에서 제외된다.
- 남은 범위: 근거가 있는 SEO/GEO Readiness 기술 비교는 유지하되 실제 AI Visibility는 향후 provider observation 계약 이후에만 별도로 도입한다.
- Acceptance test: provider observation이 없는 run은 citation/mention 필드가 null이고 `UNAVAILABLE`이며 승자 선정에 포함되지 않는다 — 자동 테스트 및 1440/390 브라우저 QA 통과.

### COL-11 원본 증거 보관

- 현재 상태: PARTIAL
- 증거: audit evidence와 HTML 기반 분석 경로는 있으나 원문 스냅샷 해시, 보존 정책, redirect chain, 재현 가능한 fetch manifest가 없다.
- 추천: ADOPT NOW.
- Acceptance test: run마다 서버 발급 evidence ID, content hash, fetch 시각, final URL, redirect chain, ruleset version을 저장하고 동일 입력 재실행을 추적할 수 있다.

### BUS-03 사용량 계량

- 현재 상태: BLOCKED
- 증거: UsageLedger, idempotency key, provider cost attribution, workspace scope가 없다.
- 추천: ADOPT NOW—결제 이전 기반 기능으로 구현.
- Acceptance test: 동일 요청 재시도는 중복 과금되지 않고 workspace/run/provider별 reserved, committed, released 사용량이 대사된다.

### GEO-01 AI 크롤러 접근 매트릭스

- 현재 상태: MISSING
- 증거: robots.txt와 주요 AI bot user-agent별 allow/disallow 판정 경로가 없다.
- 추천: PILOT. 새 점수에 즉시 합산하지 않고 사실성 검사로 시작한다.
- Acceptance test: robots 정책과 user-agent 조합별 판정을 evidence와 함께 반환하며 UNKNOWN을 PASS로 처리하지 않는다.

### OBS-01 GSC OAuth 연결

- 현재 상태: MISSING
- 증거: OAuth, encrypted token storage, workspace connector, sync job이 없다.
- 추천: BUY/CONNECT.
- Acceptance test: 최소 권한 OAuth, 토큰 암호화·철회, tenant 격리, incremental sync, rate-limit/backoff, 삭제 요청을 검증한다.

## 5. 포트폴리오 결론

1. ADOPT NOW: 신뢰 경계, 사용량 원장, hard/soft limit, 원본 증거·재개성처럼 이후 기능의 정확성과 원가를 지키는 기반.
2. PILOT: robots/AI bot 접근, GSC 결합, 실제 관측 기반 비교처럼 고객가치를 검증할 수 있는 작은 vertical slice.
3. LAB ONLY: llms.txt와 실험 규칙은 공식 점수에서 분리하고 가설·버전·실험 결과를 기록한다.
4. REJECT: AI 전용 schema, 문체 점수, 단일 인용확률, 자체 백링크 DB는 근거·원가·오해 위험이 기준을 넘는다.
5. BUY/CONNECT: GSC, GA4, CrUX, SERP/순위, 외부 권위 데이터, 결제는 직접 데이터망을 만들기보다 공식 API나 검증된 공급자를 연결한다.

## 6. 승인 Gate

CMP-02 허위 유사 지표 제거는 완료됐다. 다음 Stage 1 이동 전에는 인증·workspace 경계 결정, UsageLedger 설계, provider 약관·원가 확인, 선택 slice의 acceptance test 승인이 필요하다.
