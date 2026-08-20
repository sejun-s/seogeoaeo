> **프로젝트명**: CiteGraph (`seogeoaeo`)  
> **문서명/역할**: 실전 검증 20개 URL 사람 라벨링 및 Page Type 분류기 정오표 (P6)  
> **버전**: `2026.08.20-v1.0`  
> **최종 갱신일**: 2026-08-20  
> **작업 담당 AI**: Antigravity (Google DeepMind Team)  
> **사용 모델**: Gemini 3.7 Flash (Advanced Agentic Coding)  
> **문서 상태**: [검증 완료 / 관측 리포트]  

---

# 실전 검증 20 URL 사람 라벨링 & 분류기 정오표 (P6)

## 1. 개요 및 목적

`score-reliability-improvement-plan-2026-08-20-v2-final.md` §1-2 및 §5 P6 지침에 따라, 기존 실전 검증 20개 URL 표본에 대해 **전문가 휴먼 라벨(Human Label)**을 부여하고 P1(Signal Family) 적용 후 v2 분류기(`Classifier Label`)와의 일치 여부(Correct/Incorrect)를 평가한 정오표입니다.

UNKNOWN 비율 감소만으로는 실제 정확도 향상을 담보할 수 없으므로, 사람이 직접 도메인과 페이지 목적을 검토하여 정답 기준(Ground Truth)을 정의했습니다.

---

## 2. 20개 실전 URL 라벨링 및 대조표

| 카테고리 | 대상 URL | Human Label | Classifier Label (v2) | 일치 여부 | Reviewer Note (판단 근거 및 애매성 기록) |
|---|---|---|---|:---:|---|
| KR_TECH_BLOG | `toss.im` | **HOMEPAGE** | UNKNOWN | ❌ (오분류) | 토스 금융 서비스 대표 메인 홈. SPA/클라이언트 렌더링 중심이라 정적 시그널 부족. |
| KR_TECH_BLOG | `techblog.woowahan.com` | **CATEGORY_LISTING** | HOMEPAGE | ⚠️ (부분인정) | 우아한형제들 기술블로그 홈이나 실질적으로 글 목록 피드. 사이트 루트로 홈 분류됨. |
| KR_TECH_BLOG | `d2.naver.com/home` | **CATEGORY_LISTING** | UNKNOWN | ❌ (오분류) | 네이버 D2 기술 포털 메인 피드. `/home` 경로이나 목록형 컨테이너 위주. |
| KR_TECH_BLOG | `tech.kakao.com/blog` | **CATEGORY_LISTING** | UNKNOWN | ❌ (오분류) | 카카오 기술블로그 글 목록 피드. |
| KR_TECH_BLOG | `helloworld.kurly.com` | **CATEGORY_LISTING** | UNKNOWN | ❌ (오분류) | 컬리 기술블로그 메인 목록 피드. |
| KR_SAAS | `wanted.co.kr` | **HOMEPAGE** | HOMEPAGE | ✅ **일치** | 원티드 채용/커리어 SaaS 메인 홈. 루트 경로 및 브랜드 신호 일치. |
| KR_SAAS | `channel.io/ko` | **HOMEPAGE** | UNKNOWN | ❌ (오분류) | 채널톡 한국어 메인 홈. 다국어 서브디렉토리(`/ko`) 신호 미흡. |
| KR_SAAS | `banksalad.com` | **HOMEPAGE** | HOMEPAGE | ✅ **일치** | 뱅크샐러드 서비스 메인 홈. 루트 경로 신호 일치. |
| KR_ECOMMERCE | `musinsa.com` | **HOMEPAGE** | UNKNOWN | ❌ (오분류) | 무신사 쇼핑몰 메인 홈. 무거운 CSR/동적 스크립트 의존으로 정적 시그널 미감지. |
| KR_ECOMMERCE | `oliveyoung.co.kr` | **HOMEPAGE** | UNKNOWN | ❌ (오분류) | 올리브영 쇼핑몰 메인 홈. CSR 구조로 인해 메타데이터 신호 누락. |
| KR_NEWS | `hankyung.com/economy` | **CATEGORY_LISTING** | UNKNOWN | ❌ (오분류) | 한국경제 경제 섹션 기사 목록. 섹션 경로 및 기사 링크 군집 형태. |
| KR_NEWS | `yna.co.kr` | **HOMEPAGE** | HOMEPAGE | ✅ **일치** | 연합뉴스 종합 뉴스 포털 메인 홈. |
| KR_DOCS | `developers.kakao.com/...` | **DOCUMENTATION** | — (HTTP 302) | — | 카카오 개발자 문서 (리다이렉트 응답으로 평가 제외). |
| KR_DOCS | `docs.tosspayments.com/...` | **DOCUMENTATION** | — (HTTP 404) | — | 토스페이먼츠 가이드 (404 오류 URL로 평가 제외). |
| KR_CONTENT_MKT| `spartacodingclub.kr/blog` | **CATEGORY_LISTING** | ARTICLE_BLOG | ❌ (오분류) | 블로그 홈(글 목록)인데 Article 스키마/단일 글 신호 오감지로 Article 판정. |
| KR_CORP | `lguplus.com` | **HOMEPAGE** | UNKNOWN | ❌ (오분류) | LG유플러스 기업 포털 홈. |
| GLOBAL_REF | `ahrefs.com/blog/what-is-seo`| **ARTICLE_BLOG** | ARTICLE_BLOG | ✅ **일치** | 완벽한 표준 Article 마크업(저자, 날짜, 본문, H2/H3 구조 일치). |
| GLOBAL_REF | `stripe.com/docs` | **DOCUMENTATION** | UNKNOWN | ❌ (오분류) | Stripe 개발자 공식 문서 홈. `/docs` 경로 신호가 있었으나 UNKNOWN 판정. |
| GLOBAL_REF | `vercel.com/blog` | **CATEGORY_LISTING** | UNKNOWN | ❌ (오분류) | Vercel 공식 블로그 포스트 목록 피드. |
| GLOBAL_REF | `openai.com/index` | **HOMEPAGE** | UNKNOWN | ❌ (오분류) | OpenAI 메인 홈. `/index` 경로 및 모던 프레임워크 렌더링. |
| GLOBAL_REF | `wikipedia.org` | **HOMEPAGE** | UNKNOWN | ❌ (오분류) | 위키피디아 글로벌 다국어 포털 랜딩/홈. |

---

## 3. 정오표 통계 및 분석 결과

### 3.1 분류 결과 요약 (성공 19건 기준)

| 분류 구분 | 건수 (건) | 비율 (%) | 세부 내용 |
|---|:---:|:---:|---|
| **Human 정답과 정확히 일치 (Correct)** | 4 | 21.1% | wanted.co.kr, banksalad.com, yna.co.kr, ahrefs.com/blog |
| **부분 인정 / 경계 케이스 (Near-hit)** | 1 | 5.3% | techblog.woowahan.com (블로그 홈 vs 목록) |
| **UNKNOWN 미분류 (Uncertain)** | 13 | 68.4% | 글로벌/국내 주요 사이트 전반의 정적 시그널 부족 |
| **타 유형으로 오분류 (Misclassified)** | 1 | 5.3% | spartacodingclub.kr/blog (목록인데 단일 Article로 판정) |
| **HTTP 오류 제외** | 2 | — | 302 Redirect 1건, 404 Not Found 1건 |

### 3.2 PageType별 정답률 매트릭스

| Human Label (Ground Truth) | 표본 수 | Correct | Misclassified / UNKNOWN | 정답률 (%) |
|---|:---:|:---:|:---:|:---:|
| **HOMEPAGE** | 10 | 3 | 7 | 30.0% |
| **ARTICLE_BLOG** | 1 | 1 | 0 | 100.0% |
| **CATEGORY_LISTING** | 7 | 0 (1 부분) | 7 | 0.0% |
| **DOCUMENTATION** | 1 (유효) | 0 | 1 | 0.0% |
| **합계 (유효 표본)** | **19** | **4** | **15** | **21.1%** |

---

## 4. 핵심 관찰 및 교훈

1. **단일 Article 검증력은 탁월함**:
   - `ahrefs.com/blog/what-is-seo`와 같은 전형적인 표준 Article 블로그 글은 100% 신뢰도로 정확히 감지됨.
2. **Category Listing (글 목록 / 피드) 인식 체계 부재**:
   - 기술블로그 홈(`tech.kakao.com/blog`, `helloworld.kurly.com` 등)과 뉴스 섹션(`hankyung.com/economy`) 등 다수의 기사 링크가 나열된 피드 페이지가 전량 `UNKNOWN` 또는 `ARTICLE_BLOG`로 혼동됨.
   - `CATEGORY_LISTING` 판별을 위한 "링크 밀도 / 반복 리스트 DOM 구조 / ItemList 스키마" 신호 패밀리 강화가 필수적임.
3. **루트 도메인 외 서브패스 홈 인식 한계**:
   - `channel.io/ko`, `openai.com/index`, `d2.naver.com/home`처럼 서브디렉토리가 실질적 홈인 경우 루트 도메인 규칙이 작동하지 않아 UNKNOWN으로 떨어짐.
