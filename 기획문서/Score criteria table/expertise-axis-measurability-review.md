> **문서 상태**: 검토 결과 (비-정본) — `SEO_GEO_기준표_고도화_기획안.md`에 대한
> 측정 가능성 감사다. 이 문서 자체가 승인 문서는 아니며, 코드의 Scoring Rule
> Weight를 바꾸지 않는다. 실제 채택 여부는 `citegraph-weight-calibration-plan.md`
> §10 승인 Gate를 통해 사용자가 결정한다.

# SEO/GEO 기준표 고도화 기획안 — 측정 가능성 감사

작성일: 2026-08-19 · 검토 대상: `SEO_GEO_기준표_고도화_기획안.md`

## 결론 먼저

기획안의 **연구 근거 3편은 전부 실재하고 인용 수치도 일치**한다(§6 참고).
Aggarwal et al. KDD 2024(arXiv:2311.09735, +41%/+28%), GEO-SFE(arXiv:2603.29979,
+17.3%), Citation Selection vs. Absorption(arXiv:2604.25707) 모두 직접
검색해 확인했다. 조작된 근거가 아니다.

다만 제안된 19개 카테고리 중 **바로 코드에 반영 가능한 것은 소수이고,
나머지는 CiteGraph에 없는 인프라(백링크 API, 실제 브라우저 렌더링·성능 측정,
다중 페이지 크롤)나 존재하지 않는 Semantic Engine을 전제로 한다.** 특히
`Expertise`에 제안된 최고 가중치 15점은 지금 부여하면 이 세션에서 이미
한 번 겪은 문제(v3의 R_SEM/OCI — LLM 판정 없이 heuristic으로 semantic 점수를
확정 배점한 것)를 그대로 반복하는 것과 같다.

## 분류 기준

- **A. 이미 측정함**: 지금 v2 Atomic Check로 이미 존재
- **B. FACT로 바로 추가 가능**: 새 인프라나 LLM 없이 결정론적으로 추가 가능
- **C. 새 인프라 필요**: 외부 API(백링크 지수), 실제 브라우저 렌더링·성능
  측정, 다중 페이지 크롤 중 하나가 있어야 측정 가능 — 이번 세션에서 이미
  Phase 2+로 명시적으로 미룬 영역과 겹친다
- **D. Semantic Engine 필요**: LLM 판정 없이는 원천적으로 측정 불가. 지금
  GEO_SEMANTIC 15개 Atomic Check가 전부 `NOT_EVALUATED`인 이유가 이것이다

## SEO 카테고리 (9개)

| 카테고리 | 배점(제안) | 분류 | 근거 |
|---|---:|---|---|
| Technical SEO | 15 | A+B | HTTPS·robots directive는 A(`AC-SEO-HTTPS` 등). robots.txt/sitemap.xml 파일 자체 파싱, viewport 메타 태그 기반 모바일 친화성은 B — 결정론적으로 추가 가능 |
| On-page | 15 | A | Title/Meta/Heading 이미 대응(`AC-SEO-TITLE-*`, `AC-SEO-META-*`, `AC-SEO-H1-*`). 키워드-정합성은 이미 Advisory(Semantic)로 분리돼 있음 |
| Indexability | 10 | A | Canonical 이미 대응. 중복·씬 콘텐츠는 site corpus 필요 항목으로 이미 `DEFERRED_INPUT` 상태로 존재 |
| Structured Data | 15 | A | 이미 대응(`AC-SEO-SCHEMA-*`) |
| Content Basics | 10 | A+D | 본문량·alt는 A. 문법·오탈자 검사는 D(맞춤법/문체 판단은 LLM 영역) |
| Core Web Vitals / Page Experience | 10 | **C** | LCP·INP·CLS는 실제 브라우저 렌더링+성능 측정(Lighthouse/CrUX)이 있어야 한다. 지금 CiteGraph는 정적 HTML만 가져온다 — `AC-GF-RENDERDEP`가 항상 `no-rendered-snapshot`으로 UNKNOWN인 이유가 이것이다. Phase 1 설계가 "필요가 입증될 때 추가"로 이미 미룬 항목과 정확히 일치 |
| Internal Linking & Site Architecture | 10 | **C** | 개별 페이지 내부링크 수는 A로 이미 있음. "토픽 클러스터 구조"·"클릭 depth"는 사이트 전체 크롤+링크그래프가 있어야 하는데, CiteGraph는 단일 URL 감사로 범위가 확정돼 있음(Phase 1 확정 결정) |
| Backlink Authority | 10 | **C** | DR/DA는 Ahrefs/Moz/Semrush 같은 유료 백링크 인덱스 API 없이는 절대 측정 불가. 지금 이런 연동이 전혀 없고, 새 유료 벤더 계약이 전제된다 |
| Content Freshness | 5 | B(제한적) | 단일 페이지의 날짜 신호 유무는 A로 이미 있음(`AC-GF-DATE`). "최근 90일 업데이트 비율"은 다중 페이지·이력 추적이 필요해 지금 범위로는 "날짜 신호가 최근인가" 정도만 B로 추가 가능 |

## GEO 카테고리 (10개)

| 카테고리 | 배점(제안) | 분류 | 근거 |
|---|---:|---|---|
| Answerability | 10 | A | `AC-GF-QSTRUCT` 이미 대응. semantic 판단(직접 답변 품질)은 이미 GEO_SEMANTIC 후보로 분리돼 있음 |
| Machine Readability | 10 | A+B | landmark·raw content·render-dep 이미 A. `llms.txt` 존재 여부는 B — 지난 세션에서 설계만 하고 구현은 보류했던 항목, 지금 추가해도 Weight 0/Experimental 유지가 맞음(업계 채택률 근거 약함) |
| Structural Optimization | 10 | A+B | 질문형 헤딩은 A. TL;DR 요약 박스·FAQ 밀도는 B — 결정론적 패턴 매칭으로 추가 가능(예: FAQPage schema 존재는 이미 감지됨, "요약"류 heading 패턴은 새 FACT check로 가능) |
| Statistical Density & Sourcing | 10 | A(낮은 confidence) | `claim.candidate`(숫자 패턴)와 `citation.relation`(근접성)으로 부분 대응 중이나, 둘 다 confidence 0.5로 낮게 관리하고 있다 — 정규식 기반 숫자 탐지를 "정량 데이터"로 과신하지 않기 위함 |
| Citation Readiness | 5 | A | `AC-GF-CITEURL`/`AC-GF-CITEPROX` 이미 대응 |
| Experience | 5 | **D** | "1인칭 실무 경험 서술"은 텍스트를 읽고 판단해야 하는 순수 Semantic 영역 |
| **Expertise** | **15** | **D** | 저자 신원 존재는 A(`author.signal`)이지만, "저자-콘텐츠 매핑"·"전문용어 정합성"은 Semantic이다. 이미 `AC-GS-AUTHOR-ACCOUNT`(v2 candidate)·`AC-GS-AUTHOR-EXPERT`(v2.1 deferred, 외부 검증 필요)로 설계는 돼 있으나 **엔진이 없어 전부 `NOT_EVALUATED`**. 제안된 최고 가중치 15점을 지금 배정하면 검증 안 된 heuristic에 최고 배점을 주는 것과 같다 — 이번 세션에서 되돌린 v3 R_SEM/OCI 문제의 재발이다 |
| Authoritativeness | 10 | **C** | 외부 인용·백링크는 Backlink Authority와 동일한 외부 API 필요. "업계지 언급 빈도"는 미디어 모니터링 데이터 소스가 전혀 없다 |
| Trustworthiness | 10 | A+C | 출처 명시율·데이터 최신성은 A로 부분 대응. "정정 이력 투명성"은 사이트별 변경 이력 추적이 필요해 C |
| Entity Clarity & 3rd-party Corroboration | 5 | A+C | `entity.signal`(title/H1/schema 이름 일치)로 내부 일관성은 A. Wikidata/Crunchbase 외부 엔티티 연결은 새 외부 API 연동이 필요해 C |

## 배점 재확인이 필요한 것

기획안 §2가 지적한 "Citation Readiness가 이미 만점(20/20)"은 실제로는
현재 정본 35-rule 엔진(`GEO-CITE-*` 3개, 총 20점)이 example.com 같은 얇은
페이지에서 조건이 느슨하게 PASS되는 문제이지(§12 방법론 자체 감사에서 이미
지적됨), 가중치를 낮춘다고 해결되는 문제는 아니다. 배점보다 **판정 조건을
엄격하게 만드는 것**이 먼저다.

## 마케팅 사례 수치는 별도로 취급

Stonly 986%, Gumlet 20%, Semrush 등 49배는 GEO 에이전시 블로그(Omniscient
Digital, Optimist)가 출처다. 동료 심사 연구가 아니라 마케팅 사례 연구이며,
`citegraph-weight-calibration-plan.md`가 명시한 "마케팅 사례와 제3자 통계는
반드시 원출처를 따라가서 확인한다"는 원칙에 따라 **가중치 산정 근거로
쓰지 않는다.** 이 프로젝트의 실제 GEO Calibration 절차(Stage 1~3)를 대체할
수 없다.

## 권고

1. **Expertise 등 Semantic 축은 Weight 0 Advisory/Candidate로만 등록**한다 —
   지금 GEO_SEMANTIC이 이미 그렇게 설계돼 있으니 이 기획안의 카테고리명을
   기존 Atomic Check 매핑에 맞춰 재정리하는 것부터 시작한다.
2. **B로 분류된 항목(robots.txt/sitemap.xml 파싱, TL;DR/FAQ 밀도, llms.txt)만
   이번 iteration에서 신규 Atomic Check 후보로 등록**하고, Weight는
   Experimental로 시작한다.
3. **C로 분류된 항목(CWV, Backlink, 사이트 크롤, 외부 엔티티 연결)은
   지금 착수하지 않는다** — 각각 별도의 인프라/예산 결정이 필요하다.
4. SEO/GEO 카테고리 envelope 자체를 바꾸는 건 `weight-calibration-plan.md`
   §10 승인 Gate(최소 100개 curated page, 재현성·중복 검토)를 통과해야
   하며, 이 기획안 하나로 확정하지 않는다.
