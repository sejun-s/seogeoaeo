# CiteGraph 사이트/URL 대조 비교 기능 기획 명세서 (URL Comparison Spec v1.0)

> **프로젝트명**: CiteGraph (`seogeoaeo`)  
> **문서 상태**: 기획 검토안 (Review Required)  
> **작성일**: 2026-08-18  
> **연관 문서**: [`citegraph-final-prd-v2.md`](file:///c:/workspace/seogeoaeo/%EA%B8%B0%ED%9A%8D%EB%AC%B8%EC%84%9C/citegraph-final-prd-v2.md), [`DESIGN.md`](file:///c:/workspace/seogeoaeo/DESIGN.md)

---

## 1. 개요 및 목적 (Overview & Purpose)

현재 CiteGraph는 단일 URL 진단 기능만 제공하고 있어, 자사 웹사이트와 경쟁사 웹사이트 간의 **SEO Score / GEO Readiness Score / 35개 항목별 승패 대조 분석**이 불가능합니다.
본 기능은 2~4개의 URL을 동시에 진단하고, 점수, 카테고리별 달성률, 항목별 `PASS`/`WARN`/`FAIL` 차이를 수평 대조(Side-by-Side Comparison)하는 기능을 추가하는 명세입니다.

---

## 2. 주요 기능 및 사용자 경험 (User Experience & Features)

1. **다중 URL 입력 폼 (Multi-URL Input)**:
   * 2개~4개의 URL을 동시에 입력하거나 비교 대상(예: 기본 자사 URL + 경쟁사 URL)을 추가할 수 있는 폼 제공.
2. **수평 점수 비교 카드 (Side-by-Side Score Header)**:
   * 입력된 URL별 **SEO Score** 및 **GEO Readiness Score**를 수평 컬럼 카드로 배치하여 한눈에 비교.
3. **카테고리별 수평 매트릭스 (Category Matrix Table)**:
   * 10개 카테고리(Technical SEO, On-page, Answerability, Citation Readiness 등)별 수치 비교.
4. **Findings 규칙 대조표 (Findings Diff Matrix)**:
   * 35개 진단 규칙에 대한 각 사이트의 판정 결과(`PASS`/`WARN`/`FAIL`) 및 감점 항목 대조.

---

## 3. 데이터 및 API 설계 (API Specification)

### 3.1 `POST /api/compare`

**요청 (Request Payload)**:
```json
{
  "urls": [
    "https://mysite.com",
    "https://competitor-a.com"
  ]
}
```

**응답 (Response Payload)**:
```json
{
  "comparedAt": 1787035000000,
  "rulesetVersion": "2026.08.1",
  "targets": [
    {
      "url": "https://mysite.com",
      "auditResultId": "res_111",
      "seoScore": 85,
      "geoScore": 78
    },
    {
      "url": "https://competitor-a.com",
      "auditResultId": "res_222",
      "seoScore": 62,
      "geoScore": 54
    }
  ],
  "categories": [
    {
      "categoryName": "Technical SEO",
      "scoreType": "SEO",
      "maxScore": 20,
      "scores": {
        "https://mysite.com": 20,
        "https://competitor-a.com": 15
      }
    }
  ],
  "findingsDiff": [
    {
      "ruleId": "SEO-TECH-001",
      "title": "HTTPS 사용",
      "weight": 5,
      "results": {
        "https://mysite.com": "PASS",
        "https://competitor-a.com": "FAIL"
      }
    }
  ]
}
```

---

## 4. UI/UX 구현 방안 (`DESIGN.md` 준수)

* **URL 태그 폼**: 1440px 기준 수평 flex 레이아웃으로 최대 4개 URL 입력 지원.
* **대시보드 카드 배제**: 단순 Table 및 1px 구분선 수평 매트릭스로 가독성 유지.
* **상태 비교 시각화**: `PASS` (녹색), `WARN` (황갈색), `FAIL` (적색) 바이트 텍스트 병기.

---

## 5. 구현 계획 (Implementation Steps)

1. **백엔드 비교 파이프라인 (`lib/services/compare-service.ts`)**:
   * 입력된 URL 배열에 대해 `Promise.allSettled`로 병렬 `executeAudit()` 실행.
   * 각 진단 결과를 수평 Diff 구조 데이터로 재가공.
2. **API Route Handler (`app/api/compare/route.ts`)**:
   * `POST /api/compare` 엔드포인트 작성.
3. **프론트엔드 UI 컴포넌트 (`app/compare/page.tsx` 또는 `app/page.tsx` 비교 탭)**:
   * 단일 분석 / 비교 분석 탭 분리 또는 비교 전용 대시보드 뷰 추가.
