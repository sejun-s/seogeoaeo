> **프로젝트명**: CiteGraph (`seogeoaeo`)  
> **문서명/역할**: 실전 검증 20개 URL 사람 라벨링 및 Page Type 분류기 정오표 (P6)  
> **버전**: `2026.08.20-v1.1`  
> **최종 갱신일**: 2026-08-20  
> **작업 담당 AI**: Antigravity(초안, Human Label) + Claude Sonnet 5(검수·데이터 재검증)  
> **문서 상태**: [검증 완료 / 관측 리포트]

---

> **v1.1 정정 안내(Claude, 2026-08-20)**: 최초 제출본(v1.0)의 `Classifier Label`
> 컬럼은 P1(Page Type Signal Family) 적용 **이전** 데이터(`real-world-
> validation-report-2026-08-20.md`)를 그대로 복사한 것으로 확인됐다 — 소수점
> 단위 coverage까지 원본과 정확히 일치했다. 검수 과정에서 19개 URL을 현재
> 코드(P1 반영 후)로 직접 재실행해 이 v1.1로 교체했다. 사람이 매긴 `Human
> Label`과 `Reviewer Note`는 원본 그대로 유지했다(코드 실행과 무관한 사람의
> 판단이라 재검증 대상이 아님). §4.1의 "ARTICLE_BLOG 100% 신뢰도" 서술은
> 표본 1개에서 나온 결과를 과장한 표현이라 함께 정정했다.

## 1. 개요 및 목적

`score-reliability-improvement-plan-2026-08-20-v2-final.md` §1-2 및 §5 P6 지침에 따라, 기존 실전 검증 20개 URL 표본에 대해 **전문가 휴먼 라벨(Human Label)**을 부여하고 P1(Signal Family) 적용 **후** v2 분류기(`Classifier Label`)와의 일치 여부(Correct/Incorrect)를 평가한 정오표입니다.

UNKNOWN 비율 감소만으로는 실제 정확도 향상을 담보할 수 없으므로, 사람이 직접 도메인과 페이지 목적을 검토하여 정답 기준(Ground Truth)을 정의했습니다.

---

## 2. 20개 실전 URL 라벨링 및 대조표 (P1 적용 후 재실행)

| 카테고리 | 대상 URL | Human Label | Classifier Label (v2, P1 이후) | 일치 여부 | Reviewer Note (판단 근거 및 애매성 기록) |
|---|---|---|---|:---:|---|
| KR_TECH_BLOG | `toss.im` | **HOMEPAGE** | UNKNOWN | ❌ (오분류) | 토스 금융 서비스 대표 메인 홈. SPA/클라이언트 렌더링 중심이라 정적 시그널 부족. |
| KR_TECH_BLOG | `techblog.woowahan.com` | **CATEGORY_LISTING** | HOMEPAGE (AUTO) | ⚠️ (부분인정) | 우아한형제들 기술블로그 홈이나 실질적으로 글 목록 피드. 사이트 루트로 홈 분류됨. |
| KR_TECH_BLOG | `d2.naver.com/home` | **CATEGORY_LISTING** | UNKNOWN | ❌ (오분류) | 네이버 D2 기술 포털 메인 피드. `/home` 경로이나 목록형 컨테이너 위주. |
| KR_TECH_BLOG | `tech.kakao.com/blog` | **CATEGORY_LISTING** | UNKNOWN | ❌ (오분류) | 카카오 기술블로그 글 목록 피드. |
| KR_TECH_BLOG | `helloworld.kurly.com` | **CATEGORY_LISTING** | UNKNOWN | ❌ (오분류) | 컬리 기술블로그 메인 목록 피드. |
| KR_SAAS | `wanted.co.kr` | **HOMEPAGE** | HOMEPAGE (PROVISIONAL) | ✅ **일치** | 원티드 채용/커리어 SaaS 메인 홈. 루트 경로 및 브랜드 신호 일치. |
| KR_SAAS | `channel.io/ko` | **HOMEPAGE** | UNKNOWN | ❌ (오분류) | 채널톡 한국어 메인 홈. 다국어 서브디렉토리(`/ko`) 신호 미흡. |
| KR_SAAS | `banksalad.com` | **HOMEPAGE** | HOMEPAGE (PROVISIONAL) | ✅ **일치** | 뱅크샐러드 서비스 메인 홈. 루트 경로 신호 일치. |
| KR_ECOMMERCE | `musinsa.com` | **HOMEPAGE** | UNKNOWN | ❌ (오분류) | 무신사 쇼핑몰 메인 홈. 무거운 CSR/동적 스크립트 의존으로 정적 시그널 미감지. |
| KR_ECOMMERCE | `oliveyoung.co.kr` | **HOMEPAGE** | UNKNOWN | ❌ (오분류) | 올리브영 쇼핑몰 메인 홈. CSR 구조로 인해 메타데이터 신호 누락. |
| KR_NEWS | `hankyung.com/economy` | **CATEGORY_LISTING** | UNKNOWN | ❌ (오분류) | 한국경제 경제 섹션 기사 목록. 섹션 경로 및 기사 링크 군집 형태. |
| KR_NEWS | `yna.co.kr` | **HOMEPAGE** | HOMEPAGE (PROVISIONAL) | ✅ **일치** | 연합뉴스 종합 뉴스 포털 메인 홈. |
| KR_DOCS | `developers.kakao.com/...` | **DOCUMENTATION** | — (HTTP 302) | — | 카카오 개발자 문서 (리다이렉트 응답으로 평가 제외). |
| KR_DOCS | `docs.tosspayments.com/...` | **DOCUMENTATION** | — (HTTP 404) | — | 토스페이먼츠 가이드 (404 오류 URL로 평가 제외). |
| KR_CONTENT_MKT| `spartacodingclub.kr/blog` | **CATEGORY_LISTING** | ARTICLE_BLOG (**AUTO**, P1 이전엔 PROVISIONAL) | ❌ (오분류) | 블로그 홈(글 목록)인데 Article 스키마/단일 글 신호 오감지로 Article 판정. **P1 적용 후 confidence가 PROVISIONAL→AUTO_ASSIGNED로 상승** — 틀린 판정이 더 확신에 차게 됐다는 뜻이라 반드시 같이 봐야 하는 결과다(§4.3 참고). |
| KR_CORP | `lguplus.com` | **HOMEPAGE** | UNKNOWN | ❌ (오분류) | LG유플러스 기업 포털 홈. |
| GLOBAL_REF | `ahrefs.com/blog/what-is-seo`| **ARTICLE_BLOG** | ARTICLE_BLOG (**PROVISIONAL**, AUTO 아님) | ✅ **일치(단, 시스템 확신도는 중간)** | Type은 맞췄으나 시스템 자체 confidence는 PROVISIONAL 밴드에 머문다. "완벽한 표준 Article"이라는 사람의 판단과 시스템의 확신 수준은 별개다. |
| GLOBAL_REF | `stripe.com/docs` | **DOCUMENTATION** | UNKNOWN | ❌ (오분류) | Stripe 개발자 공식 문서 홈. `/docs` 경로 신호가 있었으나 UNKNOWN 판정. |
| GLOBAL_REF | `vercel.com/blog` | **CATEGORY_LISTING** | UNKNOWN | ❌ (오분류) | Vercel 공식 블로그 포스트 목록 피드. |
| GLOBAL_REF | `openai.com/index` | **HOMEPAGE** | UNKNOWN | ❌ (오분류) | OpenAI 메인 홈. `/index` 경로 및 모던 프레임워크 렌더링. |
| GLOBAL_REF | `wikipedia.org` | **HOMEPAGE** | UNKNOWN | ❌ (오분류) | 위키피디아 글로벌 다국어 포털 랜딩/홈. |

---

## 3. 정오표 통계 및 분석 결과

P1(Signal Family) 적용 전후로 **TYPE 판정 자체가 바뀐 URL은 0개**다(assignment
band만 spartacodingclub 1건 상승). 따라서 아래 집계 수치는 원본(v1.0)과 동일하다
— P1은 이번 20개 표본에서 UNKNOWN rate를 낮추지 못했다. 이건 실패가 아니라
정직한 결과다: P1이 고친 건 "상관 신호 중복 계산"이라는 구체적 버그 2건이지,
새 독립 신호(og:type 등)를 대량으로 추가한 게 아니었다(§5 참고 —
`score-reliability-improvement-plan-2026-08-20-v2-final.md` §2-A는 og:type 같은
신규 추출 신호를 다음 라운드로 명시적으로 미뤄뒀다).

### 3.1 분류 결과 요약 (성공 19건 기준)

| 분류 구분 | 건수 (건) | 비율 (%) | 세부 내용 |
|---|:---:|:---:|---|
| **Human 정답과 정확히 일치 (Correct)** | 4 | 21.1% | wanted.co.kr, banksalad.com, yna.co.kr, ahrefs.com/blog |
| **부분 인정 / 경계 케이스 (Near-hit)** | 1 | 5.3% | techblog.woowahan.com (블로그 홈 vs 목록) |
| **UNKNOWN 미분류 (Uncertain)** | 13 | 68.4% | 글로벌/국내 주요 사이트 전반의 정적 시그널 부족 |
| **타 유형으로 오분류 (Misclassified)** | 1 | 5.3% | spartacodingclub.kr/blog (목록인데 단일 Article로 판정, P1 이후 더 확신에 참) |
| **HTTP 오류 제외** | 2 | — | 302 Redirect 1건, 404 Not Found 1건 |

### 3.2 PageType별 정답률 매트릭스

| Human Label (Ground Truth) | 표본 수 | Correct | Misclassified / UNKNOWN | 정답률 (%) |
|---|:---:|:---:|:---:|:---:|
| **HOMEPAGE** | 10 | 3 | 7 | 30.0% |
| **ARTICLE_BLOG** | 1 | 1 | 0 | 100.0%(**표본 1개 — 통계적으로 무의미, §4.1 참고**) |
| **CATEGORY_LISTING** | 7 | 0 (1 부분) | 7 | 0.0% |
| **DOCUMENTATION** | 1 (유효) | 0 | 1 | 0.0%(표본 1개 — 동일하게 무의미) |
| **합계 (유효 표본)** | **19** | **4** | **15** | **21.1%** |

---

## 4. 핵심 관찰 및 교훈

### 4.1 "단일 Article 검증력"은 표본 1개짜리 관측이지 신뢰할 근거가 아니다

최초본(v1.0)은 이 항목을 "100% 신뢰도로 정확히 감지됨", "탁월함"으로 서술했다.
**정정한다**: `ahrefs.com/blog/what-is-seo` 1건에서 TYPE은 일치했지만, 표본이
1개뿐이라 "100%"라는 숫자에 통계적 의미가 없다. 게다가 시스템 자체 confidence는
AUTO_ASSIGNED가 아니라 PROVISIONAL이다 — 사람이 보기엔 "완벽한 Article"이어도
분류기는 중간 확신에 머문다는 뜻이다. ARTICLE_BLOG 표본을 최소 5~10개로 늘리기
전에는 이 카테고리에 대해 어떤 정확도 주장도 하지 않는다.

### 4.2 Category Listing (글 목록 / 피드) 인식 체계 부재

기술블로그 홈(`tech.kakao.com/blog`, `helloworld.kurly.com` 등)과 뉴스 섹션
(`hankyung.com/economy`) 등 다수의 기사 링크가 나열된 피드 페이지가 전량
`UNKNOWN` 또는 `ARTICLE_BLOG`로 혼동된다. `CATEGORY_LISTING` 판별을 위한
"링크 밀도 / 반복 리스트 DOM 구조 / ItemList 스키마" 신호 패밀리 강화가
필수적이다. 이 정오표에서 CATEGORY_LISTING 정답률이 0%(7건 중 0건, 1건
부분인정)로 가장 시급한 항목임이 확인됐다.

### 4.3 P1의 실제 효과: 표본 1개에서 확인된 진짜 개선, 그리고 그 이면

`spartacodingclub.kr/blog`가 이번 표본에서 유일하게 P1 적용 전후로 confidence
band가 바뀐 사례다(PROVISIONAL → AUTO_ASSIGNED). 이건 P1이 실제로 신호 중복
계산을 줄여 확신도 계산을 더 정직하게 만들었다는 증거다 — **다만 이 케이스는
애초에 오분류였다.** 즉 P1은 "틀린 판정을 더 확신에 차게" 만든 셈이다. 이건
P1의 실패가 아니라 P1이 정확히 설계된 대로 동작했다는 증거에 가깝다(중복
계산을 없애면 남은 진짜 신호들의 비중이 커지고, 그 신호들이 마침 틀린
방향을 가리키고 있었을 뿐이다) — 하지만 "confidence가 올랐다"를 곧바로
"더 좋아졌다"로 읽으면 안 된다는 걸 실측으로 보여주는 사례라 그대로 기록해둔다.

### 4.4 루트 도메인 외 서브패스 홈 인식 한계

`channel.io/ko`, `openai.com/index`, `d2.naver.com/home`처럼 서브디렉토리가
실질적 홈인 경우 루트 도메인 규칙이 작동하지 않아 UNKNOWN으로 떨어진다.
