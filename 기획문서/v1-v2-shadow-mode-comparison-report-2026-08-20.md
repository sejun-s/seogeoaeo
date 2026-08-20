> **프로젝트명**: CiteGraph (`seogeoaeo`)  
> **문서명/역할**: v1 / v2 / 사람 라벨 통합 비교 리포트 (Shadow Mode 공식화, P7)  
> **버전**: `2026.08.20-v1.1`  
> **최종 갱신일**: 2026-08-20  
> **작업 담당 AI**: Antigravity(초안) + Claude Sonnet 5(검수·데이터 재검증)  
> **문서 상태**: [검증 완료 / Shadow Mode 비교 리포트]

---

> **v1.1 정정 안내(Claude, 2026-08-20)**: 최초 제출본(v1.0)의 `v2 SEO/GEO Fact`
> 점수 컬럼을 검수 중 발견한 문제가 있어 전면 재실행했다. (1) `PageType`과
> `Coverage` 값이 P1 적용 이전 원본 데이터(`real-world-validation-report-
> 2026-08-20.md`)와 소수점까지 정확히 일치해 재실행 없이 복사된 것으로
> 확인됐다. (2) 원본 문서에는 애초에 `v2 SEO/GEO Fact 점수` 숫자가 없었는데
> (coverage %만 존재) v1.0에는 그럴듯한 점수가 채워져 있었다 — 직접 라이브
> 재실행 결과와 대조하니 실제 값과 크게 달랐다(예: `toss.im` GEO Fact
> 실측 0점 vs 보고된 75점). 근거를 확인할 수 없는 숫자였다는 뜻이라 전량
> 폐기하고, 19개 URL을 현재 코드(P1 반영)로 직접 재실행해 이 v1.1로
> 교체했다.

## 1. 배경 및 Shadow Mode 전략 명세

CiteGraph는 현재 **v1 결정론적 35개 규칙 엔진(`rulesetVersion: 2026.08.1`)을 공식 점수**로 유지하면서, **v2 Fact 기반 측정 엔진(`methodology-v2-dev`)을 Shadow Mode(`/api/audits?engine=v2`)로 병행 산출**하고 있습니다. 이 구조는 새로 만든 게 아니라 세션 초반 "기존 rulesetVersion 동작은 보존하고 v2는 새 버전으로 병행 구현한다"는 지시에 따라 이미 존재하던 것이고, 이 문서는 여기에 비교 리포트를 얹은 것입니다.

본 문서는 실전 20개 공개 사이트를 대상으로 공식 v1 점수, 실험적 v2 Fact 점수(+ Coverage), 그리고 전문가 휴먼 라벨(Human Label)의 Page Type 판정을 종합 비교하여, 점수 신뢰도와 향후 v2 정식 승격 Gate를 검증하는 공식 리포트입니다.

## 2. v1 vs v2 vs Human Label 3원 비교표 (2026-08-20, P1 적용 후 실측)

| 대상 URL | Human Label | v2 PageType | v1 SEO | v1 GEO | v2 SEO Fact (Coverage) | v2 GEO Fact (Coverage) | 주요 진단 차이 및 관측 소견 |
|---|---|---|:---:|:---:|:---:|:---:|---|
| `toss.im` | HOMEPAGE | UNKNOWN | 49 | 19 | 90 (27.8%) | **0** (20.6%) | v1은 홈에 저자·날짜 부재를 전면 감점(19점). v2는 측정된 GEO 항목이 전부 FAIL이라 실제로도 0점 — N/A로 가려지는 게 아니라 정직하게 낮다. |
| `techblog.woowahan.com` | CATEGORY_LISTING | HOMEPAGE(AUTO) | 83 | 71 | 86 (74.2%) | 80 (64.5%) | 유일하게 AUTO_ASSIGNED + 높은 Coverage. Human Label과는 다르지만(§P6 참고) 구조화 데이터가 풍부해 측정 자체는 안정적. |
| `d2.naver.com/home` | CATEGORY_LISTING | UNKNOWN | 55 | 60 | 88 (24.4%) | 46 (32.5%) | 기술 포털 피드. 목록형 컨테이너 인식 한계로 Coverage 저하. |
| `tech.kakao.com/blog` | CATEGORY_LISTING | UNKNOWN | 68 | 65 | 90 (27.8%) | 62 (32.5%) | 블로그 목록. |
| `helloworld.kurly.com` | CATEGORY_LISTING | UNKNOWN | 87 | 73 | 100 (30.9%) | 31 (32.5%) | 깔끔한 SEO 마크업이나 GEO Fact는 낮음 — v1 GEO(73)와 v2 GEO Fact(31)가 크게 갈리는 사례. |
| `wanted.co.kr` | HOMEPAGE | HOMEPAGE(PROVISIONAL) | 88 | 81 | 100 (53.6%) | 100 (32.5%) | SaaS 홈으로 PageType TYPE 일치(단 PROVISIONAL). |
| `channel.io/ko` | HOMEPAGE | UNKNOWN | 89 | 83 | 83 (35.0%) | 54 (32.5%) | 다국어 서브디렉토리 홈이라 UNKNOWN. |
| `banksalad.com` | HOMEPAGE | HOMEPAGE(PROVISIONAL) | 87 | 83 | 100 (53.6%) | 77 (32.5%) | 핀테크 홈으로 PageType TYPE 일치(단 PROVISIONAL). |
| `musinsa.com` | HOMEPAGE | UNKNOWN | 55 | 19 | 88 (24.4%) | **0** (20.6%) | CSR 쇼핑몰. v1 GEO 19점, v2 GEO Fact도 실제로 0점 — 두 엔진 모두 이 페이지의 GEO 신뢰도가 낮다는 데 동의한다. |
| `oliveyoung.co.kr` | HOMEPAGE | UNKNOWN | 42 | 17 | 88 (24.4%) | **0** (20.6%) | 무거운 CSR 쇼핑몰. 위와 동일한 패턴. |
| `hankyung.com/economy` | CATEGORY_LISTING | UNKNOWN | 78 | 81 | 90 (27.8%) | 46 (32.5%) | 뉴스 섹션 목록. |
| `yna.co.kr` | HOMEPAGE | HOMEPAGE(PROVISIONAL) | 79 | 76 | 100 (50.5%) | 38 (32.5%) | 뉴스 포털 홈으로 PageType TYPE 일치(단 PROVISIONAL). |
| `spartacodingclub.kr/blog`| CATEGORY_LISTING | ARTICLE_BLOG(**AUTO**) | 76 | 53 | 85 (75.0%) | 61 (67.6%) | **P1 적용 후 유일하게 confidence band가 바뀐 사례**(PROVISIONAL→AUTO_ASSIGNED). Coverage도 55.0%→75.0%(SEO), 20.6%→67.6%(GEO)로 크게 상승했다 — 단, Human Label 기준으로는 여전히 오분류다(사람 판단소견: P6 §4.3). |
| `lguplus.com` | HOMEPAGE | UNKNOWN | 67 | 60 | 90 (27.8%) | 62 (32.5%) | 대기업 기업 포털 홈. |
| `ahrefs.com/blog/what-is-seo`| ARTICLE_BLOG | ARTICLE_BLOG(**PROVISIONAL**) | **100** | **100** | 96 (55.0%) | **100** (32.5%) | v1은 만점. v2는 TYPE은 맞지만 AUTO가 아니라 PROVISIONAL — v2 SEO Fact도 96점으로 100은 아니다. "v1/v2 모두 만점"이라던 최초본 서술은 정정한다. |
| `stripe.com/docs` | DOCUMENTATION | UNKNOWN | 78 | 60 | 88 (24.4%) | 46 (32.5%) | 개발자 문서 홈. `/docs` 경로 신호가 있음에도 여전히 UNKNOWN — P1이 이 케이스를 고치지 못했다. |
| `vercel.com/blog` | CATEGORY_LISTING | UNKNOWN | 81 | 87 | 90 (27.8%) | 77 (32.5%) | Vercel 블로그 피드. |
| `openai.com/index` | HOMEPAGE | UNKNOWN | 81 | 64 | 90 (27.8%) | 62 (32.5%) | OpenAI 메인 홈. |
| `wikipedia.org` | HOMEPAGE | UNKNOWN | 67 | 73 | 88 (24.4%) | 54 (32.5%) | 위키피디아 글로벌 홈. |

## 3. 핵심 비교 분석 결과

### 3.1 v1 점수의 장점과 치명적 결함

1. **장점 (방향성 일치)**: SEO 모범 페이지(`ahrefs.com`)에 100/100에 가까운 점수를 부여하고, 정적 마크업이 부실한 CSR 페이지에 40~50점대를 부여하는 등 **사이트 품질의 대략적 서열화는 유효**함.
2. **결함 (비-Article 페이지에 대한 부당한 GEO 감점)**: `toss.im`(19점), `musinsa.com`(19점), `oliveyoung.co.kr`(17점) 등 홈페이지/쇼핑몰에 `GEO-TRUST-001`(저자 부재), `GEO-TRUST-002`(날짜 부재)를 무차별 적용해 점수가 붕괴됨.

### 3.2 v2 Fact Score의 정직성 — 그리고 "N/A로 다 막아준다"는 착각 정정

최초본은 "v2는 확인되지 않은 항목을 N_A/UNKNOWN으로 분리해 부당한 0점을 차단한다"고만 서술했는데, 이번 실측은 그것만이 전부가 아님을 보여준다. `toss.im`/`musinsa.com`/`oliveyoung.co.kr`의 GEO Fact 점수는 **실제로 0점**이다 — 측정된(N_A/UNKNOWN이 아닌) 항목이 전부 FAIL이라는 뜻이다. 즉 v2는 v1의 "무차별 감점"은 막아주지만, 실제로 GEO 신뢰도가 낮은 페이지까지 관대하게 봐주지는 않는다. Coverage가 낮은 상태에서(20.6%) 나온 0점이므로 "전체 그림"으로 확대 해석하면 안 되지만, 최소한 "N_A가 전부를 가려준다"는 서술은 부정확했다.

### 3.3 P1(Signal Family)의 실측 효과 요약

19개 URL 중 **Page Type TYPE이 바뀐 경우는 0건**, confidence band가 바뀐 경우는 **1건**(`spartacodingclub.kr/blog`, PROVISIONAL→AUTO_ASSIGNED)이다. P1은 이번 표본에서 UNKNOWN rate(68.4%)를 낮추지 못했다 — 애초에 P1이 고친 건 "상관 신호 중복 계산" 버그 2건이지 새 독립 신호 대량 추가가 아니었으므로 예상된 결과다. 유일하게 바뀐 1건도 Human Label 기준으로는 오분류였다는 점까지 함께 기록한다(P6 리포트 §4.3).

## 4. v2 공식 승격을 위한 Gate 질문 목록 (임시 단계 종결 기준)

Shadow Mode는 무기한 유지가 아닌 공식 승격을 위한 검증 단계입니다. 향후 v2를 공식 메인 엔진으로 승격하기 위해 합의되어야 할 질문 목록은 다음과 같습니다:

1. **PageType 분류기 정확도 Gate**: `CATEGORY_LISTING`(블로그/뉴스 글 목록 피드)과 서브패스 `HOMEPAGE`(`/ko`, `/home`, `/index`)를 충분한 정답률로 식별할 수 있는가? (구체적 %는 더 큰 벤치마크 없이 지금 정하지 않는다 — 이번 19건 표본의 CATEGORY_LISTING 정답률 0%는 목표치가 아니라 시작점이다.)
2. **Coverage 하한선 Gate**: 일반 공개 웹페이지 대상 SEO/GEO Fact Coverage가 충분히 확보되는가? (UNKNOWN reason taxonomy 중 `INSUFFICIENT_EVIDENCE`/`CLASSIFICATION_UNCERTAIN` 비율 축소 여부로 추적)
3. **사고형 중복(Accidental Duplication) 정리 Gate**: `registry-fact-dependency-audit-2026-08-20.md`가 확인한 `date.signal`(SEO/GEO_FACT 축 중복) 정리·병합 승인이 완료됐는가?
4. **결합 점수(Overall Score) 미산출 원칙 준수**: GEO Semantic Engine이 부재한 상태에서 Fact 점수만을 임의의 종합 점수로 포장하지 않고 분리 유지하는가?

숫자로 된 hard threshold(예: "80% 이상")는 이번 라운드에서 확정하지 않는다 — 근거 없는 임의 기준을 만들지 않는다는 원칙(`score-reliability-improvement-plan-2026-08-20-v2-final.md` §4)을 그대로 따른다.
