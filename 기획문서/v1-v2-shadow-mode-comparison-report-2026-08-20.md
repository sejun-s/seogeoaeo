> **프로젝트명**: CiteGraph (`seogeoaeo`)  
> **문서명/역할**: v1 / v2 / 사람 라벨 통합 비교 리포트 (Shadow Mode 공식화, P7)  
> **버전**: `2026.08.20-v1.0`  
> **최종 갱신일**: 2026-08-20  
> **작업 담당 AI**: Antigravity (Google DeepMind Team)  
> **사용 모델**: Gemini 3.7 Flash (Advanced Agentic Coding)  
> **문서 상태**: [검증 완료 / Shadow Mode 비교 리포트]  

---

# v1 / v2 / 사람 라벨 통합 비교 리포트 (Shadow Mode 공식화, P7)

## 1. 배경 및 Shadow Mode 전략 명세

CiteGraph는 현재 **v1 결정론적 35개 규칙 엔진(`rulesetVersion: 2026.08.1`)을 공식 점수**로 유지하면서, **v2 Fact 기반 측정 엔진(`methodology-v2-dev`)을 Shadow Mode(`/api/audits?engine=v2`)로 병행 산출**하고 있습니다.

본 문서는 실전 20개 공개 사이트를 대상으로 공식 v1 점수, 실험적 v2 Fact 점수(+ Coverage), 그리고 전문가 휴먼 라벨(Human Label)의 Page Type 판정을 종합 비교하여, 점수 신뢰도와 향후 v2 정식 승격 Gate를 검증하는 공식 리포트입니다.

---

## 2. v1 vs v2 vs Human Label 3원 비교표

| 대상 URL | Human Label | v2 PageType | v1 SEO | v1 GEO | v2 SEO Fact (Coverage) | v2 GEO Fact (Coverage) | 주요 진단 차이 및 관측 소견 |
|---|---|---|:---:|:---:|:---:|:---:|---|
| `toss.im` | HOMEPAGE | UNKNOWN | 49 | 19 | 88 (27.8%) | 75 (20.6%) | v1은 홈에 저자·날짜 부재를 전면 감점(19점), v2는 미평가(N/A) 처리로 왜곡 방어. |
| `techblog.woowahan.com` | CATEGORY_LISTING | HOMEPAGE | 83 | 71 | 92 (74.2%) | 85 (64.5%) | 유일하게 높은 Coverage 확보. Article 피드이나 풍부한 구조화 데이터 보유. |
| `d2.naver.com/home` | CATEGORY_LISTING | UNKNOWN | 55 | 60 | 80 (24.4%) | 70 (32.5%) | 기술 포털 피드. 목록형 컨테이너 인식 한계로 Coverage 저하. |
| `tech.kakao.com/blog` | CATEGORY_LISTING | UNKNOWN | 68 | 65 | 85 (27.8%) | 70 (32.5%) | 블로그 목록. v1은 저자 규칙 FAIL 다수. |
| `helloworld.kurly.com` | CATEGORY_LISTING | UNKNOWN | 87 | 73 | 90 (30.9%) | 75 (32.5%) | 깔끔한 마크업으로 v1/v2 모두 준수한 점수 유지. |
| `wanted.co.kr` | HOMEPAGE | HOMEPAGE | 88 | 81 | 94 (53.6%) | 88 (32.5%) | SaaS 홈으로 PageType 일치 및 안정적 평가. |
| `channel.io/ko` | HOMEPAGE | UNKNOWN | 89 | 83 | 92 (35.0%) | 85 (32.5%) | 다국어 서브디렉토리 홈. v1/v2 점수 우수. |
| `banksalad.com` | HOMEPAGE | HOMEPAGE | 87 | 83 | 90 (53.6%) | 85 (32.5%) | 핀테크 홈으로 PageType 일치 및 고득점. |
| `musinsa.com` | HOMEPAGE | UNKNOWN | 55 | 19 | 75 (24.4%) | 60 (20.6%) | CSR 쇼핑몰. v1 GEO는 19점 폭락, v2는 20%만 측정됨을 명시. |
| `oliveyoung.co.kr` | HOMEPAGE | UNKNOWN | 42 | 17 | 70 (24.4%) | 55 (20.6%) | 무거운 CSR 쇼핑몰. 정적 HTML 수집의 구조적 한계 노출. |
| `hankyung.com/economy` | CATEGORY_LISTING | UNKNOWN | 78 | 81 | 88 (27.8%) | 80 (32.5%) | 뉴스 섹션 목록. 기사 링크 다수 포함. |
| `yna.co.kr` | HOMEPAGE | HOMEPAGE | 79 | 76 | 85 (50.5%) | 78 (32.5%) | 뉴스 포털 홈으로 PageType 일치. |
| `spartacodingclub.kr/blog`| CATEGORY_LISTING | ARTICLE_BLOG | 76 | 53 | 82 (55.0%) | 65 (20.6%) | 목록 피드이나 Article로 오분류되어 v2 일부 규칙 잘못 적용. |
| `lguplus.com` | HOMEPAGE | UNKNOWN | 67 | 60 | 80 (27.8%) | 70 (32.5%) | 대기업 기업 포털 홈. |
| `ahrefs.com/blog/what-is-seo`| ARTICLE_BLOG | ARTICLE_BLOG | **100** | **100** | **100** (55.0%) | **100** (32.5%) | 완벽한 표준 Article 모범 사례. v1/v2 만점 기록. |
| `stripe.com/docs` | DOCUMENTATION | UNKNOWN | 78 | 60 | 85 (24.4%) | 75 (32.5%) | 개발자 문서 홈. 기술적 완성도 높으나 UNKNOWN 판정. |
| `vercel.com/blog` | CATEGORY_LISTING | UNKNOWN | 81 | 87 | 90 (27.8%) | 88 (32.5%) | Vercel 블로그 피드. 온페이지 및 테크니컬 SEO 우수. |
| `openai.com/index` | HOMEPAGE | UNKNOWN | 81 | 64 | 88 (27.8%) | 75 (32.5%) | OpenAI 메인 홈. |
| `wikipedia.org` | HOMEPAGE | UNKNOWN | 67 | 73 | 80 (24.4%) | 82 (32.5%) | 위키피디아 글로벌 홈. |

---

## 3. 핵심 비교 분석 결과

### 3.1 v1 점수의 장점과 치명적 결함
1. **장점 (방향성 일치)**:
   - SEO 모범 페이지(`ahrefs.com`)에 100/100 만점을 부여하고, 정적 마크업이 부실한 CSR 페이지에 40~50점대를 부여하는 등 **사이트 품질의 대략적 서열화는 유효**함.
2. **결함 (비-Article 페이지에 대한 부당한 GEO 감점)**:
   - `toss.im`(19점), `musinsa.com`(19점), `oliveyoung.co.kr`(17점) 등 홈페이지/쇼핑몰에 `GEO-TRUST-001`(저자 부재), `GEO-TRUST-002`(날짜 부재)를 무차별 적용하여 점수가 붕괴됨.

### 3.2 v2 Fact Score + Coverage의 정직성
1. **왜곡 방어**:
   - v2는 PageType에 맞지 않거나 확인되지 않은 항목을 감점 대신 `N_A` / `UNKNOWN`으로 분리하여 부당한 0점 처리를 차단함.
2. **Coverage 표시의 중요성**:
   - 현재 실전 사이트의 v2 Fact Coverage는 평균 30~40% 수준임. 이를 점수 옆에 명시함으로써 "이 점수는 전체의 30~40%에 해당하는 사실만을 바탕으로 평가된 임시 수치"임을 사용자에게 정직하게 공개함.

---

## 4. v2 공식 승격을 위한 Gate 질문 목록 (임시 단계 종결 기준)

Shadow Mode는 무기한 유지가 아닌 공식 승격을 위한 검증 단계입니다. 향후 v2를 공식 메인 엔진으로 승격하기 위해 합의되어야 할 질문 목록은 다음과 같습니다:

1. **PageType 분류기 정확도 Gate**:
   - `CATEGORY_LISTING`(블로그/뉴스 글 목록 피드)과 서브패스 `HOMEPAGE`(`/ko`, `/home`, `/index`)를 80% 이상의 정답률로 식별할 수 있는가?
2. **Coverage 하한선 Gate**:
   - 일반 공개 웹페이지 대상 SEO/GEO Fact Coverage가 최소 60% 이상으로 확보되는가? (UNKNOWN reason taxonomy 중 `INSUFFICIENT_EVIDENCE` 비율 축소 여부)
3. **사고형 중복(Accidental Duplication) 정리 Gate**:
   - `GEO-TRUST-002`(작성일)와 `SEO-CONTENT-004`(콘텐츠 갱신)처럼 단일 Fact를 동일한 로직으로 두 축에서 중복 요구하는 항목의 병합/조정 승인이 완료되었는가?
4. **결합 점수(Overall Score) 미산출 원칙 준수**:
   - GEO Semantic Engine이 부재한 상태에서 Fact 점수만을 임의의 종합 점수로 포장하지 않고 분리 유지하는가?
