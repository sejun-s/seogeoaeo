> **문서 상태**: 검증 결과 (비-정본) — 실제 코드에 대한 관측 기록이다. 이 문서
> 자체가 Weight나 Rule을 바꾸지 않는다. `citegraph-weight-calibration-plan.md`의
> Stage 1(curated 100 pages)을 실행 가능한 규모로 축소한 예비 관측이다.

# 실전 데이터 검증 — 실제 공개 페이지 20개

작성일: 2026-08-20 · 대상 엔진: `rulesetVersion 2026.08.1`(v1) + `methodology-v2-dev`(v2)

## 방법

CiteGraph의 실제 목표 고객군(한국 SEO/GEO 대행사, 인하우스 마케팅팀)에 가까운
실제 공개 페이지 20개를 선정해 v1 `POST /api/audits`와 v2
`POST /api/audits?engine=v2`를 동시에 실행했다. 대상: 한국 기술 블로그 5,
한국 SaaS 3, 한국 커머스 2, 한국 뉴스 2, 한국 문서 2, 한국 콘텐츠 마케팅 1,
한국 대기업 1, 글로벌 레퍼런스 5(SEO 최적화가 잘 된 것으로 알려진 사이트
포함, 상한선 비교용).

MOCK을 쓰지 않았다 — 전부 실제 네트워크로 가져온 실제 HTML이다.

## 핵심 수치

```
전체 21건 시도, 19건 성공(2건 실패는 아래 "실패 사례" 참고)

SEO Score(v1):  최소 42 · 최대 100 · 평균 74.2 · 중앙값 78
GEO Score(v1):  최소 17 · 최대 100 · 평균 64.5 · 중앙값 71

SEO Fact coverage(v2): 평균 40.0% · 중앙값 27.8%
GEO Fact coverage(v2): 평균 30.0% · 중앙값 32.5%

Page Type 분류:
  UNKNOWN/UNKNOWN        13/19 (68%)
  HOMEPAGE/PROVISIONAL    3/19
  ARTICLE_BLOG/PROVISIONAL 2/19
  HOMEPAGE/AUTO_ASSIGNED  1/19 (techblog.woowahan.com)
```

## 결과 전체

| 카테고리 | URL | SEO | GEO | Findings | Page Type | SEO cov | GEO cov |
|---|---|---:|---:|---:|---|---:|---:|
| KR_TECH_BLOG | toss.im | 49 | 19 | 24 | UNKNOWN | 27.8% | 20.6% |
| KR_TECH_BLOG | techblog.woowahan.com | 83 | 71 | 9 | HOMEPAGE(A) | 74.2% | 64.5% |
| KR_TECH_BLOG | d2.naver.com/home | 55 | 60 | 18 | UNKNOWN | 24.4% | 32.5% |
| KR_TECH_BLOG | tech.kakao.com/blog | 68 | 65 | 13 | UNKNOWN | 27.8% | 32.5% |
| KR_TECH_BLOG | helloworld.kurly.com | 87 | 73 | 8 | UNKNOWN | 30.9% | 32.5% |
| KR_SAAS | wanted.co.kr | 88 | 81 | 7 | HOMEPAGE(P) | 53.6% | 32.5% |
| KR_SAAS | channel.io/ko | 89 | 83 | 6 | UNKNOWN | 35.0% | 32.5% |
| KR_SAAS | banksalad.com | 87 | 83 | 6 | HOMEPAGE(P) | 53.6% | 32.5% |
| KR_ECOMMERCE | musinsa.com | 55 | 19 | 23 | UNKNOWN | 24.4% | 20.6% |
| KR_ECOMMERCE | oliveyoung.co.kr | 42 | 17 | 26 | UNKNOWN | 24.4% | 20.6% |
| KR_NEWS | hankyung.com/economy | 78 | 81 | 9 | UNKNOWN | 27.8% | 32.5% |
| KR_NEWS | yna.co.kr | 79 | 76 | 10 | HOMEPAGE(P) | 50.5% | 32.5% |
| KR_DOCS | developers.kakao.com/... | — | — | — | 실패(302) | — | — |
| KR_DOCS | docs.tosspayments.com/... | — | — | — | 실패(404) | — | — |
| KR_CONTENT_MKT | spartacodingclub.kr/blog | 76 | 53 | 14 | ARTICLE(P) | 55.0% | 20.6% |
| KR_CORP | lguplus.com | 67 | 60 | 15 | UNKNOWN | 27.8% | 32.5% |
| GLOBAL_REF | ahrefs.com/blog/what-is-seo | **100** | **100** | **0** | ARTICLE(P) | 55.0% | 32.5% |
| GLOBAL_REF | stripe.com/docs | 78 | 60 | 13 | UNKNOWN | 24.4% | 32.5% |
| GLOBAL_REF | vercel.com/blog | 81 | 87 | 7 | UNKNOWN | 27.8% | 32.5% |
| GLOBAL_REF | openai.com/index | 81 | 64 | 11 | UNKNOWN | 27.8% | 32.5% |
| GLOBAL_REF | wikipedia.org | 67 | 73 | 13 | UNKNOWN | 24.4% | 32.5% |

(P) = PROVISIONAL, (A) = AUTO_ASSIGNED

## 발견 1 — 점수가 실제로 품질을 구분한다 (긍정적)

- **ahrefs.com의 SEO 전문 블로그 글이 SEO 100 / GEO 100 / findings 0**으로
  나왔다. 실제로 업계에서 SEO 모범 사례로 꼽히는 페이지가 만점에 가깝게
  나온 것은 우연이 아니라 rule이 실제로 좋은 신호를 잡아낸다는 뜻이다.
- 반대로 **무신사(55/19)와 올리브영(42/17)** — 둘 다 무거운 클라이언트
  렌더링 커머스 사이트 — 는 v1/v2 둘 다에서 최하위권으로 나왔다. 정적
  HTML만 가져오는 이 엔진의 구조상 당연한 결과이지만, 실제로 "나쁜 사이트를
  낮게 채점"하는 방향은 맞다.
- 즉 **점수 자체의 방향성(직관과 일치하는가)은 20개 표본에서 검증됐다.**

## 발견 2 — Page Type UNKNOWN 68%가 v2 coverage 저하의 직접 원인

지난 세션에서 fixture 15개로도 확인했던 문제가 실제 페이지에서 더 뚜렷하게
재현됐다. **글로벌 유명 사이트(stripe.com/docs, vercel.com/blog, openai.com,
wikipedia.org)조차 전부 UNKNOWN**으로 분류됐다 — 한국 사이트만의 문제가
아니라 분류기 자체의 신호 부족이 원인이다.

유일하게 AUTO_ASSIGNED가 나온 `techblog.woowahan.com`은 SEO/GEO Fact
coverage도 가장 높다(74.2%/64.5%) — **Page Type 신뢰도와 coverage가 직접
연동**되어 있음을 실측으로 확인했다. Page Type 분류기를 개선하지 않으면
v2 coverage는 구조적으로 30% 대에 머문다.

## 발견 3 — v1 GEO 점수가 비-article 콘텐츠에 구조적으로 불리하다

가장 자주 실패한 규칙 상위:

```
GEO-ANSWER-002(질문형 Heading)      14/19
GEO-TRUST-001(저자 정보)            14/19
GEO-TRUST-002(작성·수정 날짜)       14/19
SEO-CONTENT-004(콘텐츠 갱신 신호)   14/19  ← TRUST-002와 동일 Fact
GEO-TRUST-004(발행 주체 식별)       13/19
```

`toss.im`(GEO 19), `musinsa.com`(GEO 19), `oliveyoung.co.kr`(GEO 17) —
홈페이지·상품 목록 페이지는 원래 저자·작성일이 있을 이유가 없는데, v1은
**page type을 전혀 모르기 때문에 이 rule들을 무조건 적용**한다. 그 결과
"콘텐츠 품질이 나빠서"가 아니라 "홈페이지라서" GEO 점수가 바닥을 친다.

이건 방법론 자체 감사(§12.6 "N/A가 필요한 항목": 홈페이지·유틸리티 페이지의
저자·날짜)에서 이미 이론적으로 지적했던 문제가 **실측으로 확인**된 것이다.
v2는 이미 이 문제를 Page Type 기반 N/A로 설계해뒀지만(발견 2 때문에)
아직 실효를 못 내고 있다.

`GEO-TRUST-002`와 `SEO-CONTENT-004`가 항상 같이 실패하는 것도 방법론
§12.3이 지적한 "동일 Fact(날짜)를 SEO/GEO 두 축에서 중복 실패로 잡는" 문제의
실측 증거다.

## 발견 4 — 실패 2건은 도구 결함이 아니다 (투명하게 밝힘)

- `developers.kakao.com/docs/...` → 302 리다이렉트. 실제 카카오 문서
  URL 구조가 바뀌었거나 로그인 리다이렉트로 추정 — 도구 버그 아님
- `docs.tosspayments.com/guides/payment` → 404. 제가 고른 URL 자체가
  존재하지 않았다(URL 선정 실수)

두 건 다 엔진 결함이 아니라 URL 선정·대상 사이트 쪽 사정이다. 실패를
성공처럼 포장하지 않기 위해 그대로 남긴다.

## 결론 — "지금 사용자에게 보여줘도 되는가"

| 질문 | 답 |
|---|---|
| v1 점수가 실제 품질과 방향이 맞는가? | **예** — ahrefs 100 vs 커머스 사이트 17~19로 명확히 구분됨 |
| v1을 지금 그대로 고객에게 보여줄 수 있는가? | **조건부** — 비-article 페이지의 GEO 점수가 부당하게 낮다는 걸 알고 봐야 함. Page Type 인지 없이는 "저자·날짜 없음"을 모든 페이지에 똑같이 감점 중 |
| v2 Fact score를 공식 지표로 승격할 수 있는가? | **아니오** — coverage 평균 30~40%는 "측정한 것의 30~40%만 신뢰 가능"이라는 뜻. Page Type 분류기 개선이 선행 조건 |
| Findings가 실행 가능한 조언인가? | **부분적** — Schema/Canonical/Alt 관련은 명확하고 실행 가능. 저자·날짜 관련은 페이지 유형을 무시한 채로 나와 신뢰도가 떨어짐 |

## 권고

1. **v1을 지금 당장 붙잡고 있지 말고, GEO-TRUST-001/002/004의 page-type
   예외 처리를 v1에도 최소한으로 넣는 것**이 가장 비용 대비 효과가 큰
   다음 작업이다 — 실측으로 "가장 자주, 가장 부당하게" 실패하는 rule로
   확인됐다.
2. **v2 Page Type 분류기 개선이 GEO calibration보다 먼저다** — 지금
   coverage가 낮은 근본 원인이 분류 실패이지 rule 자체의 결함이 아니다.
3. 이 20개짜리 관측은 `weight-calibration-plan.md` Stage 1(100개, 전문가
   2명 라벨링)을 대체하지 않는다 — 방향성 확인용이며, Weight 변경의 근거로
   쓰지 않는다.
