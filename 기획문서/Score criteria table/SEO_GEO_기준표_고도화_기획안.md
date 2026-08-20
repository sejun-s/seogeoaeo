> **문서 상태**: 기획 검토안 (비-정본) — `SEO_GEO_기준표_기획안.docx`를 그대로 옮긴 것이다.
> 정본 전환 여부는 `citegraph-weight-calibration-plan.md` §10 승인 Gate를 통과해야 결정된다.
> 이 문서 자체를 근거로 코드의 Scoring Rule Weight를 바꾸지 않는다.

# SEO·GEO 진단 기준표 고도화 기획안

전문성(Expertise) 평가축 신설 및 해외 벤치마킹 기반 개선안

작성일: 2026-08-19

## 1. 개요

현행 SEO/GEO 진단 리포트는 SEO Score와 GEO Readiness Score를 각각 5개 항목·100점
만점으로 산출한다. 본 기획안은 이 체계를 고도화하여 (1) '전문성(Expertise)'을
독립된 필수 평가축으로 승격하고, (2) 최신 GEO 연구 결과를 반영해 평가 항목을
다양화하며, (3) 해외 벤치마킹 기업을 기준으로 채점 기준표를 재정렬하는 것을
목적으로 한다.

## 2. 기존 체계의 한계

- 전문성 관련 신호가 'Evidence & Trust' 한 항목에 뭉뚱그려져 있어, '근거가 있는
  콘텐츠'와 '누가 썼는가'가 구분되지 않음
- SEO 항목이 기술/온페이지 중심이라 권위(백링크)·신선도 같은 시간축 신호가
  빠져 있음
- GEO 항목이 AI 크롤러 접근성 위주라 실제 '인용될 확률'을 좌우하는 연구 기반
  요소(통계 밀도, 문서 구조)가 반영되지 않음
- Citation Readiness가 이미 만점(20/20)인데도 다른 항목과 동일 가중치를 가져
  개선 우선순위 판단에 왜곡을 줌

## 3. 개선 방향

- 전문성(Expertise) 독립 평가축 신설 — E-E-A-T(Experience·Expertise·
  Authoritativeness·Trustworthiness) 4개 요소로 분리하고, Expertise에 최고
  가중치(15점) 부여
- GEO 카테고리 다양화 — Structural Optimization, Statistical Density &
  Sourcing, Entity Clarity 등 연구 근거가 있는 항목 신설
- SEO 카테고리 확장 — Core Web Vitals, Internal Linking, Backlink Authority,
  Content Freshness 추가
- 해외 벤치마킹 전환 — 동일 업종(온톨로지/지식그래프) 해외 기업과, GEO 성과가
  수치로 검증된 해외 B2B SaaS 사례로 기준표를 보정

## 4. 신규 채점 기준표 — SEO Score (100점)

| 카테고리 | 배점 | 측정 항목 |
|---|---:|---|
| Technical SEO | 15 | 크롤링 오류, robots.txt/sitemap.xml 정합성, HTTPS, 모바일 친화성 |
| On-page | 15 | 타이틀태그·메타디스크립션 최적화, 헤딩 구조(H1–H3), 키워드-콘텐츠 정합성 |
| Indexability | 10 | 색인 커버리지, 캐노니컬 태그, 중복·씬 콘텐츠 비율 |
| Structured Data | 15 | JSON-LD 적용 범위(Organization/Product/FAQ/Article), 스키마 오류율 |
| Content Basics | 10 | 콘텐츠 볼륨, alt 텍스트, 문법·오탈자 |
| Core Web Vitals / Page Experience | 10 | LCP·INP·CLS, 모바일 로딩 속도 |
| Internal Linking & Site Architecture | 10 | 토픽 클러스터 구조, 클릭 depth, 앵커텍스트 다양성 |
| Backlink Authority | 10 | 도메인 신뢰도(DR/DA), 레퍼링 도메인 다양성 |
| Content Freshness | 5 | 최근 90일 내 콘텐츠 업데이트 비율 |
| **합계** | **100** | |

## 5. 신규 채점 기준표 — GEO Readiness Score (100점)

| 카테고리 | 배점 | 측정 항목 | 근거 |
|---|---:|---|---|
| Answerability | 10 | 질문형 콘텐츠 비율, 직접 답변형 문단 구조 | AEO 기본 원칙 |
| Machine Readability | 10 | llms.txt, SSR/프리렌더링 여부, 크롤러 허용 범위 | AI 크롤러 접근성 |
| Structural Optimization | 10 | 질문형 헤딩, TL;DR 요약 박스, FAQ 밀도 | GEO-SFE(2026): 구조 개선만으로 인용률 +17% |
| Statistical Density & Sourcing | 10 | 출처가 명시된 정량 데이터 삽입 빈도 | Princeton GEO 연구 최고 성과 요인, 최대 +41% |
| Citation Readiness | 5 | 인용 가능한 문단 길이·형식, 발췌 적합성 | 기존 항목 유지(현재 만점 대역) |
| Experience | 5 | 1인칭 실무 경험 서술, 사례 기반 콘텐츠 비중 | E-E-A-T |
| Expertise | 15 | 저자 프로필·자격 명시, 저자-콘텐츠 매핑, 전문용어 정합성 | E-E-A-T · 필수 항목, 최고 가중치 |
| Authoritativeness | 10 | 외부 인용·백링크, 업계지 언급 빈도 | E-E-A-T |
| Trustworthiness | 10 | 출처 명시율, 데이터 최신성, 정정 이력 투명성 | E-E-A-T · 기존 Evidence & Trust 재정의 |
| Entity Clarity & 3rd-party Corroboration | 5 | Wikidata/Crunchbase 등 외부 엔티티 연결, 리뷰·커뮤니티 언급 | 엔티티 신뢰 신호 |
| **합계** | **100** | |

## 6. GEO 강화 근거 — 연구 기반 요소

Aggarwal 등(Princeton·Georgia Tech·Allen Institute for AI·IIT Delhi)이 KDD
2024에 발표한 'GEO: Generative Engine Optimization' 논문은 9개 콘텐츠 최적화
전략을 대규모 벤치마크로 검증한 이 분야의 표준 레퍼런스다. 주요 결과는 다음과
같다.

| 전략 | 효과 | 비고 |
|---|---|---|
| Statistics Addition | 최대 +41%(Position-Adjusted Word Count 기준) | 출처가 딸린 정량 데이터, 단일 전략 중 최고 성과 |
| Cite Sources | 단독 +28% / 결합 시 평균 +31.4% | 다른 전략과 결합할 때 상승폭 극대화 — '승수' 역할 |
| Quotation Addition | 신뢰도·풍부함 유의미한 상승 | 전문가 인용문 삽입 |
| Fluency Optimization | 단독 +15~30% | Statistics Addition과 결합 시 논문 내 최고 성능 조합 |
| Authoritative Tone | 도메인별 편차 큼 | 법률·정부 등 특정 도메인에서만 유효 |
| Technical Terms | 도메인별 편차 큼 | 전문 분야일수록 유효 |
| Keyword Stuffing | 효과 미미 / 일부 음(-) | 전통 SEO 문법을 GEO에 그대로 적용 시 비효율 |

### 추가로 참고할 최신 연구 동향

- GEO-SFE(2026) — 문서 구조(질문형 제목, 명확한 섹션 분리) 최적화만으로
  인용률 +17% 상승을 보고
- Citation Selection vs. Citation Absorption(2026) — '언급되는 것'과 'AI
  답변이 실제로 그 콘텐츠에 깊이 의존하는 것'을 구분해 측정하는 프레임워크
  제안. 단순 언급 빈도보다 정교한 지표로, 향후 Citation Readiness 항목의
  세분화 근거로 활용 가능

## 7. 해외 벤치마킹

동일 업종(온톨로지·지식그래프) 해외 기업 2곳과, GEO 적용 성과가 수치로
검증된 해외 B2B SaaS 사례를 함께 제시한다.

| 기업 | 국가 | 유형 | 벤치마크 포인트 |
|---|---|---|---|
| Ontotext (Graphwise) | 불가리아 | 동일 업종 · 온톨로지/지식그래프 | 자사 온톨로지+GraphDB+LLM 파이프라인(Ontotext Metadata Studio)을 자사 콘텐츠 마케팅에 직접 적용 — 제품으로 제품을 증명하는 자기증명형 사례 |
| Stardog | 미국 | 동일 업종 · 온톨로지 기반 시맨틱 레이어 | 기술 백서·문서 중심으로 전문성 콘텐츠를 구조화, OWL 추론 기반 신뢰성 서사 |
| Stonly | 미국(B2B SaaS) | GEO 성과 검증 사례 | GEO 에이전시 협업 후 유효 트래픽 986% 증가 |
| Gumlet | 인도(B2B SaaS) | GEO 성과 검증 사례 | ChatGPT 인용이 인바운드 매출의 20%로 전환 |
| Semrush · ZoomInfo · Superhuman · Stampli | 미국(B2B SaaS) | GEO 성과 검증 사례 | GEO 컨설팅 14개월 적용 후 LLM 레퍼럴 매출 49배 성장 |

## 8. 적용 로드맵

| 단계 | 내용 |
|---|---|
| 1단계 · 자동 진단 | Technical SEO, Indexability, Structured Data, Machine Readability 등 크롤러로 측정 가능한 항목을 자동 스캔 툴로 우선 구축 |
| 2단계 · 정성 평가 | Expertise, Authoritativeness, Experience 등은 체크리스트 기반 전문가 리뷰로 평가(저자 프로필 유무, 외부 인용 빈도 등) |
| 3단계 · 파일럿 및 캘리브레이션 | Ontotext·Stardog 등 벤치마크 기업 사이트에 동일 기준표를 시범 적용해 점수 분포를 확인하고 배점을 보정 |
| 4단계 · 정기 리포트화 | 월간/분기별 재측정 체계 수립, Content Freshness·Update Cadence 지표에 반영 |

## 9. 참고자료

- Aggarwal, P. et al., "GEO: Generative Engine Optimization," KDD 2024 (arXiv:2311.09735)
- Ontotext 공식 블로그 — "Ontotext Marketing Gets a Boost from Knowledge Graph Powered LLMs" (ontotext.com)
- Stardog 공식 사이트 (stardog.com)
- Omniscient Digital — "The 8 Best GEO Agencies for B2B SaaS Brands in 2026" (beomniscient.com)
- Optimist — "The 7 Best GEO Agencies Driving Real Revenue from AI in 2026" (yesoptimist.com)
