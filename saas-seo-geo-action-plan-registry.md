# SaaS-Enabled SEO-GEO Integrated Action Plan Registry

본 문서는 **advanced-citegraph-scoring-v2.3** 점수 체계를 실제 기업용 컨설팅 및 SaaS(Software-as-a-Service) 플랫폼의 자동화 리포트 기능으로 구현하기 위한 **최종 통합 액션 플랜 레지스트리**입니다.

단순한 기술 스캔(Audit Theater)에 그치지 않고, 고객사의 개발진과 마케팅 조직이 매주 월요일 아침 즉시 배포 티켓(Jira/Asana)으로 생성해 성과를 입증할 수 있도록 **영향도-공수-검증 모델(ICE-R Framework)**에 입각하여 설계되었습니다.

---

## 1. 개요 및 설계 철학: "Findings가 아닌 Decisions를 판매한다"

전통적인 대행사의 기술 감사는 수백 페이지의 엑셀 행을 전달한 후 방치되는 문제를 겪었습니다. 본 SaaS 솔루션은 감사를 **템플릿 레벨(Template-based Evaluation)**로 묶고, 발견된 결함을 즉시 **실행 백로그(Actionable Backlog)**로 번역하는 파이프라인을 구축해야 합니다.

### 핵심 동작 전제 (The Crucial Couplings)
1. **기초 체력(SEO)이 GEO를 견인한다**: 구글 AI Overviews(AIO) 인용 출처의 **76% 이상**은 전통적인 오가닉 검색 결과 상위 10위 이내의 도메인에서 도출됩니다. 따라서 본 액션 플랜은 SEO 인프라의 완전 구축을 1단계 하드 게이트(Hard Gate)로 잡습니다.
2. **다중 경쟁 대비(Congestion Defense)**: 모든 경쟁사가 수치 삽입(Statistics Addition) 등 문체 튜닝을 동시 수행할 경우 개별 효과는 무력화되는 **제로섬 경쟁(Congestion)** 상태에 접어듭니다. 당사 SaaS는 단순히 '글쓰기 팁'에 그치지 않고, **독점적 브랜드 신뢰 자산 구축**과 **오프페이지 엔티티 바인딩**을 동시 실행 경로로 제시합니다.

---

## 2. 3단계 실행 우선순위 로드맵 (Tiered Implementation)

고객사 내부 리소스의 부하를 최소화하고 빠른 승리(Quick Wins)를 제공하기 위해, 엔지니어링 개입 수준에 따라 단계를 삼원화합니다.

```
[Tier 1: 즉시 실행 (마케팅팀)] ──> [Tier 2: 분기 내 배포 (기획/CMS)] ──> [Tier 3: 차세대 아키텍처 (개발팀)]
(Zero Engineering)               (Low-Code & Schema 주입)         (SSR 및 시스템 로그 옵저버빌리티)
```

### **Tier 1: 마케팅 조직 즉시 실행 단계 (Zero Engineering)**
*개발팀의 소스코드 수정이나 인프라 배포 없이, 마케터와 에디터의 설정 및 가이드 변경만으로 수일 내에 AI 인용률을 극대화하는 구간입니다.*

| 액션 항목 (ID) | 세부 실행 지침 (Practical Guide) | 검증 기준 및 SaaS 탐지 로직 |
| :--- | :--- | :--- |
| **ACT-T1-ROBOTS-ALLOW** | robots.txt 내에 AI 검색 봇(`OAI-SearchBot`, `PerplexityBot`, `Google-Extended`, `ClaudeBot`)의 명시적 수집 권한을 완전히 개방합니다. | **자동 스캔**: 루트 `/robots.txt`에 해당 User-agent 목록의 `Allow: /` 매치 여부 바이너리 검증. |
| **ACT-T1-ANSWER-CAPSULE** | 모든 타겟 본문 상세 페이지의 소제목(H2/H3)을 구글 PAA(People Also Ask) 기반 자연어 질문형으로 바꾸고, **소제목 직후 1~2문장의 명확하고 정제된 결론문(Answer Capsule)**을 두괄식 배치합니다. | **LLM 파싱**: 헤딩 태그 하단 첫 단락(`<p>`)의 토큰 길이(200~300단어 내외) 및 질문과의 문맥 정합성 분석. |
| **ACT-T1-3P-BOOSTERS** | 본문에 Princeton 연구 검증 3대 콘텐츠 장치를 주입합니다.<br>1. **Statistics Addition**: "획기적인 개선" -> "평균 처리 속도 24.5% 단축"<br>2. **Quotation Addition**: 업계 권위자 혹은 내부 C-Level의 직접 인용구(`""`) 연동<br>3. **Cite Sources**: 신뢰 학술지/공식 규격 명시 및 링크 연결. | **SaaS 가치 채점**: 정량 수치 수집용 Regex 스캔, 인용 부호 감지, 아웃바운드 신뢰 출처 하이퍼링크 수 세기. |
| **ACT-T1-UGC-SEEDING** | Reddit, Medium, Quora 등 대형 UGC 커뮤니티 및 주요 전문 카테고리 포럼에 브랜드 엔티티와 핵심 사용 후기 문맥을 자연스럽게 빌드업하여, AI가 답변 조합 시 학습 데이터로 가져갈 '외부 증거'를 확보합니다. | **외부 API 추적**: Reddit 등 오픈 커뮤니티 내 브랜드 키워드 언급 빈도(Co-occurrence) 증감 모니터링. |

---

### **Tier 2: 기획 및 CMS 배포 단계 (Low-Code & Schema)**
*웹 디자이너, 기획자, 혹은 워드프레스/쇼피파이 등 CMS 관리자가 노코드 툴이나 태그 매니저(GTM)를 활용해 템플릿 단위의 구조화를 갱신하는 영역입니다.*

| 액션 항목 (ID) | 세부 실행 지침 (Practical Guide) | 검증 기준 및 SaaS 탐지 로직 |
| :--- | :--- | :--- |
| **ACT-T2-JSONLD-ORG** | 홈페이지 `<head>` 영역에 `Organization` 구조화 데이터를 선언합니다. 특히 **`sameAs` 속성**을 사용해 공식 위키데이터(Wikidata ID), 크런치베이스, 공식 링크드인 주소를 하나의 배열로 연결하여 AI 지식 그래프 결합 신뢰도를 높입니다. | **스키마 검증**: Google Rich Results API 연동 및 JSON-LD 구문 오류 검수, `sameAs` 링크 존재율 측정. |
| **ACT-T2-JSONLD-AUTHOR** | 블로그, 칼럼 등 주요 저작물의 E-E-A-T 신뢰도 검증을 위해 `Article` 스키마와 `Person` 스키마를 연동 선언하고, 저자의 전문 분야(`knowsAbout`)와 학력/약력을 투명하게 매핑합니다. | **E-E-A-T 추출**: `Person` 내 `knowsAbout` 항목의 타겟 키워드 의미적 포함성 여부 진단. |
| **ACT-T2-HTML-TABLE** | 텍스트 나열형 비교 데이터들을 의미론적인 HTML `<table>` 구조 마크업 및 불릿 목록(`<ul>`, `<ol>`) 형식으로 전면 시각 다변화합니다. AI는 구조적 정형 데이터를 답변 요약 카드로 변환할 확률이 가장 높습니다. | **DOM 파싱**: 본문 내 정형 태그(`table`, `ul`, `ol`) 개수 및 비율 탐지. |
| **ACT-T2-LLMS-DEPLOY** | 루트 디렉토리에 마크다운 형식의 `llms.txt`를 생성 배치합니다. 핵심 지식 canonical URL, 제품 라인업 요약 정보를 10KB 미만의 텍스트 지도로 기술해 LLM 수집 노이즈를 최소화합니다. | **바이너리 체크**: `domain.com/llms.txt` 경로 성공적 `HTTP 200` 및 유효한 Markdown 문법 검출. |

---

### **Tier 3: 개발팀 핵심 시스템 인프라 아키텍처 개편 (Engineering Heavy)**
*프론트엔드 개발자 및 시스템 엔지니어가 개입하여 사이트 렌더링 방식과 서버 네트워크 계층의 수집 환경을 재구축하는 무거운 기술 영역입니다.*

| 액션 항목 (ID) | 세부 실행 지침 (Practical Guide) | 검증 기준 및 SaaS 탐지 로직 |
| :--- | :--- | :--- |
| **ACT-T3-RENDER-SSR** | 핵심 서비스 및 제품 상세 페이지에 적용된 클라이언트 사이드 자바스크립트 렌더링(CSR) 의존성을 **서버사이드 렌더링(SSR) 또는 정적 사이트 생성(SSG)** 환경으로 전면 마이그레이션합니다. | **렌더링 패리티 검수**: 수집기 최초 로드 시의 Raw HTML 크기와 렌더링 완료 후 Rendered DOM 내의 텍스트 일치율 점검. (매칭율 20% 미만 시 기술 과락 처리) |
| **ACT-T3-WAF-BYPASS** | Cloudflare, AWS WAF 등 웹 방화벽 보안 솔루션 단에서 AI 크롤링 전용 봇의 IP 대역 및 User-agent 차단 정책을 해제(Whitelisting)하고 속도 제한(Rate Limiting) 예외 조치를 수립합니다. | **WAF 감사**: 실제 CDN 서버 웹 액세스 로그 내 AI 봇의 성공 정상 반환율(`HTTP 200%`) 계산. |
| **ACT-T3-CWV-STABLE** | Core Web Vitals 지표를 2026년 기준값으로 완전히 안정화합니다.<br>1. 가장 큰 요소 렌더링 LCP: **2.5초 이내**<br>2. 입력 반응 지표 INP: **200ms 이내** (기존 FID 전면 대체) | **성능 리포트**: Chrome UX Report 데이터 및 Lighthouse CLI 연동 실시간 성능 갱신 추적. |
| **ACT-T3-DYNAMIC-SITEMAP** | 신규 발행되는 이커머스 상세 제품이나 실증 보도자료, pSEO(Programmatic SEO) 페이지들이 누락 없이 AI 봇에 고속 전달되도록 서버 사이드에서 실시간 동적 자동 생성되는 sitemap.xml 갱신 파이프라인을 온전하게 탑재합니다. | **사이트맵 스캔**: `/sitemap.xml` 내부 canonical 유효성 및 최종 수정 시간 데이터의 최신성 체크. |

---

## 3. SaaS 비즈니스에서 왜 이 리스트가 핵심 가치(ROI)인가?

SaaS 고객은 "우리 사이트의 기술 점수가 왜 65점인가?"라는 질문보다, **"그래서 그 점수를 90점으로 만들려면 내일 아침 무슨 개발 티켓을 발행해야 하는가?"**에 기꺼이 돈을 지불합니다. 

당사 SaaS 플랫폼은 이 레지스트리를 다음과 같은 방식으로 활용해 비즈니스 락인(Lock-in)을 형성합니다.

### 1) 티켓 자동 생성 가치 (Auto Ticket Generator)
* 스캔 후 수집된 에러 데이터(예: *Article Schema 내 author 누락, 자바스크립트 렌더링 60% 의존 등*)를 감지하면, 본 레지스트리의 세부 지침서 내용을 기반으로 **개발자용 맞춤형 JSON 코드 템플릿과 실행 기한, ICE 우선순위 등 완벽히 정제된 Jira 마크다운 문서**를 원클릭으로 내보내기(Export)할 수 있는 가치를 제공합니다.

### 2) 성과 증명 (The Proof of Value Loop)
* **Input-Output Gap 봉합**: "우리가 Tier 2의 Organization 스키마를 주입했더니, 14일 뒤 Perplexity 내 브랜드 답변 점유율(SOV)이 15% 상승하고 GA4 내 chatgpt.com 리퍼럴 트래픽이 2.4배 증가했다"는 사실을 스코어 변경 이력(V2.2 -> V2.3)과 실질 비즈니스 전환 데이터를 대조해 오버랩 대시보드로 시각화함으로써 컨설팅 계약을 리테이너 월정액 구조로 장기 유지시킵니다.

---

## 4. [부록] 57개 원천 자료 그룹화 및 매핑 매트릭스

SaaS 리포트와 컨설팅 매뉴얼의 신뢰도를 입증하기 위해, 본 문서에 포함된 모든 판단 기준의 원천이 되는 **57개 소스 자료**를 속성과 역할에 맞춰 6대 그룹으로 완전 통합 분류하였습니다.

```
                  ┌──────────────────────────────────────────────┐
                  │ 57 Core Sources Integrated Grouping (SaaS)   │
                  └──────────────────────┬───────────────────────┘
                                         │
     ┌───────────────────┬───────────────┼───────────────┬───────────────────┐
     │                   │               │               │                   │
┌────┴────┐         ┌────┴────┐     ┌────┴────┐     ┌────┴────┐         ┌────┴────┐
│ Group A │         │ Group B │     │ Group C │     │ Group D │         │ Group E │
│ 학술/원논문       │ 구글 공식 가이드│ 전문 마케팅사 │ 스마트마인드사   │ 국가 공간 데이터 │
└─────────┘         └─────────┘     └─────────┘     └─────────┘         └─────────┘
```

* **Group A: 학술 연구 및 벤치마크 원논문 (Academic Foundation)**
  * *대표 소스*: `GEO: Generative Engine Optimization - arXiv`, `GEO: GENERATIVE ENGINE OPTIMIZATION - OpenReview`, `Generative engine optimization - Wikipedia`, `The Impact of Google AI Overviews on Publisher Traffic and User Experience`, `Monitoring the FAIRness of geospatial data: Lessons learnt from the European Union`
  * *매뉴얼 및 액션 기여*: 3대 콘텐츠 부스터(Statistics, Quotations, Cite Sources) 가시성 향상 효과 수치 입증 및 다중 경쟁 환경 최적화 무력성(C-SEO Bench)의 수학적 설계 배경 제공.
* **Group B: 구글 검색 공식 에코시스템 문서 (Search Central Manuals)**
  * *대표 소스*: `SEO 기본 가이드: 기본사항 | Google 검색 센터`, `Google 검색의 생성형 AI 기능에 맞게 최적화하기 위한 Google 가이드`, `웹사이트의 생성형 AI 콘텐츠에 대한 Google 검색 안내`, `Understanding Core Web Vitals and Google search results`, `Google 검색 노출`, `Documentation to Improve SEO | Google Search Central`
  * *매뉴얼 및 액션 기여*: JSON-LD 구조화 데이터 표준 규격 정립, Core Web Vitals INP/LCP 벤치마크 지표 도출 및 자바스크립트 렌더링에 따른 색인 리스크 공식 문구 검증.
* **Group C: 글로벌 전문 컨설팅사 지식 및 실무 체크리스트 (Agency Knowledge)**
  * *대표 소스*: `Technical SEO for AI Crawlability: The Complete Checklist - ZipTie.dev`, `The 4-Pillar GEO Strategy Framework to Win Visibility in AI Search - Lumar`, `Technical SEO Audit Checklist 2026 | GEO & AI Search Optimization - Seypro`, `Technical SEO Checklist for 2026: The Complete Audit Guide - Rivulet IQ`, `Semantic SEO 2026: 7 Entity Strategies Beyond Keywords (Tested)`, `How to Use Schema Markup to Improve SEO Performance (Complete Guide) - BTmarketing`, `링크빌딩 가이드 — 백링크 전략·평가 기준·한국 시장 실무 2026 | 넥스트티`, `30가지 무료 SEO 도구 리스트 - 300cbt`
  * *매뉴얼 및 액션 기여*: ICE 우선순위 의사결정 프레임워크 설계 기여, robots.txt AI 봇 허용 복사 템플릿 제공, llms.txt의Supplementary 한계 지목 및 UGC(레딧, 미디엄) 시딩 전략 기틀 확보.
* **Group D: 스마트마인드 AI 비즈니스 실증 사례 (Case Studies)**
  * *대표 소스*: `SmartMind AI 공식 홈페이지`, `SEO/GEO 성공 사례를 공유합니다. 연 매출 400억 이커머스 브랜드가 3개월 만에 Organic 구매 매출을 80% 늘린 방법 - 오픈애즈`, `아티클 스터디 : 제로 클릭 시대, 마케터가 GEO에 주목해야 하는 이유`, `제로 클릭 시대 GEO 마케팅 전략 – 세타필, 레이크닷컴, 한화 키퍼 사례로 본 생성형 엔진 최적화 실행법`
  * *매뉴얼 및 액션 기여*: 온톨로지 AI 솔루션 'Qurify'의 비즈니스 페인 포인트 설계, 홍천군 공공 행정 AX 실구축사례 및 더존비즈온 MOU 기반 ERP 세무 가공 1차 증거 연동 설계법 예시 적용.
* **Group E: 국가 공간정보 정책 및 공간빅데이터 리소스 (Geospatial & Spatial Policies)**
  * *대표 소스*: `국가공간정보에 관한 법률 - 공간정보연구원`, `제7차 국가공간정보정책 기본계획(2023~2027)`, `2021년도 국가공간정보정책 시행계획`, `지오빅데이터 오픈플랫폼 모니터링단 최종 보고서 - 한국지질자원연구원`, `우리 동네에 가장 필요한 생활SOC, 공간빅데이터 분석 플랫폼에서 확인하세요 - 보안뉴스`, `국가공간정보시스템의 이해 - 투이컨설팅`, `PRACTICAL GeoAI ETHICS - Ordnance Survey`
  * *매뉴얼 및 액션 기여*: 지리 정보 시스템 및 지리 데이터 세트 기반 GEO 컨설팅 확장 시 요구되는 국가공간정보체계 보안 규격과 표준화 방법론의 가이드 제공.
* **Group F: 비디오/미디어 및 대화형 검색 전략 리소스 (Video & Media Training)**
  * *대표 소스*: `AI검색 시대, 어떻게 GEO(생성형 AI 최적화)를 할 것인가? (박세용 어센트코리아 대표)`, `SEO 끝났다고요? AEO·GEO·LLMEO까지, AI 검색 시대 노출 전략 총정리 (교육자료 공유)`, `Complete SEO Course for Beginners: Learn to Rank #1 in Google`, `AI가 당신의 콘텐츠를 외면하는 진짜 이유｜AEO 시대, 콘텐츠 구조의 혁명`, `SEO만 잘해도 됩니다.ㅣ99%가 모르는 GEO 최적화의 비밀`, `이제 GEO 모르면 뒤쳐집니다 - AI 시대의 SEO 전략`, `SEO의 종말? 이제 GEO 시대가 시작됩니다`
  * *매뉴얼 및 액션 기여*: 비전문가 실무자가 한눈에 파악할 수 있는 시각 정보화 설계, 다차원 연속 검색 여정 지도 설계안, 그리고 유튜브 자막 자산화 기반 AI 크롤러 훈련 활용법의 기본 구조 기여.
