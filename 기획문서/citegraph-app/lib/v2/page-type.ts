/**
 * 결정론적 Page Type 분류기.
 *
 * Registry §2 confidence 계약:
 *   >= 0.85  AUTO_ASSIGNED
 *   0.60~0.84 PROVISIONAL
 *   < 0.60   UNKNOWN
 *
 * 첫 구현은 ML/LLM을 쓰지 않는다. schema, URL 경로, 문서 구조만 본다.
 * 신호가 약하면 억지로 유형을 확정하지 않고 UNKNOWN을 낸다. UNKNOWN이면
 * 유형 의존 check를 자동 N/A로 만들지 않는 것이 계약이다.
 */

import type { FactIndex } from "./evidence/layer";
import type { PageType, PageTypeResult } from "./types";

/**
 * SATURATION_FLOOR: 이 정도 신호량은 모여야 confidence를 100%까지 인정한다.
 * 단일 신호 하나로 AUTO_ASSIGNED가 나오는 것을 막는 장치이며 calibration 대상이다.
 *
 * 이번 라운드(점수 신뢰도 개선 기획안 v2-final §3-2, §5 P1)에서 Signal Family를
 * 도입하면서 값을 재유도하지 않았다 — 근거 없이 숫자를 바꾸면 §3-2가 경계한
 * "calibration 우회"가 된다. 대신 family 내부에서 같은 근거를 두 번 세던
 * 구체적인 두 지점(스키마 배열 중복 계산, DOM article 신호 이중 계산)만
 * 고쳤다. 이 값은 실전 데이터로 재검증하기 전까지 유지한다.
 */
const SATURATION_FLOOR = 7;
const MAX_CONFIDENCE = 0.95;

/**
 * Signal Family — 같은 근거가 여러 형태로 반복돼 confidence를 부풀리는 것을
 * 막기 위한 분류(기획안 §1-3/§3-2). 이번 라운드에서는 family를 점수 상한
 * 계산에 자동으로 쓰지 않는다(임의 cap 숫자를 근거 없이 정하지 않기 위해).
 * 대신 family 태그를 결과에 남겨서 "이 confidence가 몇 개의 독립적인 출처에서
 * 나왔는지"를 사람이 검토할 수 있게 하고, 실제로 발견된 중복 계산 두 건은
 * signal 생성 단계에서 구조적으로 제거했다(아래 SCHEMA/DOM_STRUCTURE 참고).
 */
type SignalFamily = "SCHEMA" | "URL_PATH" | "DOM_STRUCTURE" | "PROVENANCE" | "ACCESS_CONTROL" | "CONTENT_SHAPE" | "NAVIGATION";

const SCHEMA_TYPE_MAP: Readonly<Record<string, PageType>> = {
  Article: "ARTICLE_BLOG",
  NewsArticle: "ARTICLE_BLOG",
  BlogPosting: "ARTICLE_BLOG",
  Report: "ARTICLE_BLOG",
  TechArticle: "DOCUMENTATION",
  HowTo: "DOCUMENTATION",
  APIReference: "DOCUMENTATION",
  FAQPage: "DOCUMENTATION",
  QAPage: "DOCUMENTATION",
  Product: "PRODUCT",
  ProductGroup: "PRODUCT",
  SoftwareApplication: "PRODUCT",
  WebApplication: "PRODUCT",
  Service: "SERVICE",
  ProfessionalService: "SERVICE",
  CollectionPage: "CATEGORY_LISTING",
  ItemList: "CATEGORY_LISTING",
  ContactPage: "CONTACT_ABOUT",
  AboutPage: "CONTACT_ABOUT",
};

const PATH_MAP: ReadonlyArray<{ pattern: RegExp; type: PageType }> = [
  { pattern: /^\/(blog|articles?|news|posts?|insights?)(\/|$)/i, type: "ARTICLE_BLOG" },
  { pattern: /^\/(docs?|documentation|guides?|reference|manual|help)(\/|$)/i, type: "DOCUMENTATION" },
  { pattern: /^\/(products?|shop|store|item)(\/|$)/i, type: "PRODUCT" },
  { pattern: /^\/(services?|solutions?)(\/|$)/i, type: "SERVICE" },
  { pattern: /^\/(category|categories|tag|tags|collections?|list|compare)(\/|$)/i, type: "CATEGORY_LISTING" },
  { pattern: /^\/(contact|about|company|team|support)(\/|$)/i, type: "CONTACT_ABOUT" },
  { pattern: /^\/(login|signin|sign-in|signup|register|account|dashboard|admin|checkout|cart)(\/|$)/i, type: "UTILITY_AUTH" },
];

interface Signal {
  type: PageType;
  points: number;
  family: SignalFamily;
  reason: string;
  evidenceIds: string[];
}

export function classifyPageType(index: FactIndex): PageTypeResult {
  const signals: Signal[] = [];
  const push = (type: PageType, points: number, family: SignalFamily, reason: string, evidenceIds: string[] = []) =>
    signals.push({ type, points, family, reason, evidenceIds });

  const urlFact = index.one("url.final");
  const url = urlFact?.value as { href: string } | undefined;
  const path = url ? new URL(url.href).pathname : "/";

  /* --- schema ---
   * 같은 JSON-LD 블록이 "@type": ["Article", "NewsArticle"]처럼 배열로 여러
   * 토큰을 선언하면 SCHEMA_TYPE_MAP이 둘 다 같은 PageType에 매핑되는 경우가
   * 흔하다(뉴스 사이트 실측에서 확인). 토큰 수만큼 5점씩 더하면 "스키마 블록
   * 하나"라는 같은 근거를 여러 번 세는 것이다 — 매핑된 PageType별로 한 번만
   * 계산한다(기획안 §3-2 "사고형 중복" 방지와 같은 원칙). */
  const schemaFact = index.all("schema.node").find(fact => fact.factId.endsWith("_types"));
  const schemaTypes = ((schemaFact?.value as { types?: string[] } | undefined)?.types ?? []) as string[];
  const schemaMappedByType = new Map<PageType, string[]>();
  for (const type of schemaTypes) {
    const mapped = SCHEMA_TYPE_MAP[type];
    if (!mapped) continue;
    schemaMappedByType.set(mapped, [...(schemaMappedByType.get(mapped) ?? []), type]);
  }
  for (const [mapped, tokens] of schemaMappedByType) {
    push(mapped, 5, "SCHEMA", `schema:${tokens.join("+")}`, schemaFact?.evidenceIds ?? []);
  }
  // Organization/Person은 발행 주체 신호다. 루트 경로일 때만 HOMEPAGE 근거로 쓴다.
  if (path === "/" && schemaTypes.some(type => ["Organization", "NewsMediaOrganization", "Corporation"].includes(type))) {
    push("HOMEPAGE", 5, "SCHEMA", "schema:Organization@root");
  }

  // JSON-LD가 문법 오류로 파싱에 실패해도 @type 토큰 자체는 원문에 남아있는
  // 경우가 흔하다(trailing comma 등). schema.block FACT는 계속 INVALID로
  // 유지하되(점수 판정에 영향 없음), page type 추정에만 약한 신호로 회수한다.
  // 정상 파싱된 schemaTypes가 있으면 이중 계산을 피하려고 실행하지 않는다.
  if (schemaTypes.length === 0) {
    const brokenBlocks = index.evidence.filter(
      record => record.factType === "schema.block" && record.sourceType === "STRUCTURED_DATA",
    );
    const recovered = new Set<string>();
    for (const record of brokenBlocks) {
      const text = typeof record.rawValue === "string" ? record.rawValue : "";
      for (const match of text.matchAll(/"@type"\s*:\s*"([^"]+)"/g)) recovered.add(match[1]);
    }
    for (const type of recovered) {
      const mapped = SCHEMA_TYPE_MAP[type];
      // 검증되지 않은 원문 회수 신호라 정상 schema 신호(5점)보다 낮게 준다.
      if (mapped) push(mapped, 3, "SCHEMA", `schema-recovered:${type}`);
    }
  }

  /* --- URL path --- */
  let pathMatch: { pattern: RegExp; type: PageType } | undefined;
  if (path === "/" || path === "") {
    push("HOMEPAGE", 4, "URL_PATH", "path:root");
  } else {
    pathMatch = PATH_MAP.find(entry => entry.pattern.test(path));
    if (pathMatch) push(pathMatch.type, 3, "URL_PATH", `path:${pathMatch.pattern.source.slice(3, 20)}`);
  }

  /* --- document structure --- */
  const landmark = index.one("landmark.node")?.value as
    | { article?: number; form?: number; address?: number }
    | undefined;

  // element:article과 "article+multi-h2+paragraphs" 구조 신호는 둘 다
  // landmark.article 하나에서 파생된다. 예전에는 둘 다 독립 signal로
  // 더해서(2+3=5) 같은 근거를 두 번 세었다 — 하나의 tiered signal로
  // 합친다: <article> 요소만 있으면 약한 신호(2), H2/문단 구조까지
  // 확인되면 강한 신호(3)로 교체한다(가산 아님). schema 신호가 있으면
  // (TechArticle 등) 적용하지 않는다 — 확정 신호를 구조 신호가 잠식하면
  // 안 된다는 기존 원칙은 유지한다.
  const headingNodes = index.all("heading.node");
  const h2Count = headingNodes.filter(node => (node.value as { level?: number }).level === 2).length;
  const paragraphCount = index.all("content.paragraph").length;
  if ((landmark?.article ?? 0) > 0) {
    if (schemaTypes.length === 0 && h2Count >= 2 && paragraphCount >= h2Count) {
      push("ARTICLE_BLOG", 3, "DOM_STRUCTURE", "structure:article+multi-h2+paragraphs");
    } else {
      push("ARTICLE_BLOG", 2, "DOM_STRUCTURE", "element:article");
    }
  }

  // author+date 동시 존재는 DOM 구조가 아니라 provenance 메타데이터 신호다
  // (별도 family로 분리 — DOM_STRUCTURE와 근거 출처가 다르다).
  const author = index.one("author.signal");
  const date = index.one("date.signal");
  if (author?.status === "PRESENT" && date?.status === "PRESENT") {
    push("ARTICLE_BLOG", 2, "PROVENANCE", "signal:author+date", [...(author.evidenceIds ?? []), ...(date.evidenceIds ?? [])]);
  }

  const barrier = index.one("access.barrier");
  if (barrier?.status === "PRESENT" && /log ?in|sign in|로그인|회원가입/i.test(String((barrier.value as { pattern?: string }).pattern ?? ""))) {
    push("UTILITY_AUTH", 4, "ACCESS_CONTROL", "signal:auth-barrier", barrier.evidenceIds ?? []);
  }

  const structure = index.all("entity.signal").find(fact => fact.factId.endsWith("_list_table_structure"));
  const structureValue = structure?.value as { tables?: number; listItems?: number; orderedLists?: number } | undefined;
  if ((structureValue?.tables ?? 0) > 0) push("CATEGORY_LISTING", 2, "DOM_STRUCTURE", "structure:table");

  // form + address는 연락처/문의 페이지의 흔한 구조적 조합이다.
  if ((landmark?.form ?? 0) > 0 && (landmark?.address ?? 0) > 0) {
    push("CONTACT_ABOUT", 4, "DOM_STRUCTURE", "structure:form+address");
  }

  const mainText = index.one("content.main_text")?.value as { length?: number } | undefined;
  const internal = index.one("link.internal")?.value as { count?: number } | undefined;
  if ((mainText?.length ?? 0) < 200 && (internal?.count ?? 0) <= 2 && path !== "/") {
    push("LANDING_PAGE", 2, "CONTENT_SHAPE", "signal:short-main+few-links");
  }

  // hero+feature 섹션 패턴: H2가 이끄는 짧은 section이 3개 이상이고, 목록형
  // feature bullet이 있으며, 표/순서 목록(단계·비교 의도)은 없는 경우.
  // schema 신호가 있으면(SoftwareApplication 등) 적용하지 않는다 — 마케팅
  // 랜딩 페이지가 제품/서비스 schema를 함께 갖는 경우가 흔한데, 그 경우
  // schema 신호가 이미 있는 상태에서 이 구조 신호까지 더하면 두 후보가
  // 팽팽히 갈려 오히려 UNKNOWN으로 떨어진다. schema 신호가 없을 때만
  // fallback으로 쓴다.
  if (
    schemaTypes.length === 0 &&
    h2Count >= 3 &&
    (structureValue?.listItems ?? 0) > 0 &&
    (structureValue?.tables ?? 0) === 0 &&
    (structureValue?.orderedLists ?? 0) === 0
  ) {
    push("LANDING_PAGE", 3, "CONTENT_SHAPE", "structure:hero-sections+feature-list");
  }

  // --- breadcrumb 보강(신규 신호, 기획안 §5 P1) ---
  // BreadcrumbList는 이미 schema.node에서 추출되고 있었다(AC-SEO-SCHEMA-TYPE의
  // GENERIC 허용 목록에 이미 존재 — 새 추출기를 만들지 않고 기존 데이터를
  // 재사용한다). breadcrumb 자체는 어떤 PageType인지 말해주지 않지만, "이 URL
  // 경로는 이런 유형이다"라는 URL_PATH 신호와 "이 페이지는 실제로 계층 구조를
  // 가진 페이지다"라는 breadcrumb 존재가 함께일 때는 서로 다른 출처(URL 문자열
  // vs 구조화 데이터)가 같은 결론을 지지하는 것이라 교차 family 보강으로
  // 인정한다. path 신호가 없으면(홈페이지 등) 붙이지 않는다.
  if (pathMatch && schemaTypes.includes("BreadcrumbList")) {
    push(pathMatch.type, 2, "NAVIGATION", "schema:BreadcrumbList+path-match", schemaFact?.evidenceIds ?? []);
  }

  /* --- aggregate --- */
  const totals = new Map<PageType, number>();
  const reasons = new Map<PageType, string[]>();
  const evidenceByType = new Map<PageType, string[]>();
  for (const signal of signals) {
    totals.set(signal.type, (totals.get(signal.type) ?? 0) + signal.points);
    reasons.set(signal.type, [...(reasons.get(signal.type) ?? []), signal.reason]);
    evidenceByType.set(signal.type, [...(evidenceByType.get(signal.type) ?? []), ...signal.evidenceIds]);
  }

  const totalPoints = [...totals.values()].reduce((sum, points) => sum + points, 0);
  if (totalPoints === 0) {
    return { type: "UNKNOWN", confidence: 0, assignment: "UNKNOWN", alternatives: [], evidenceIds: [] };
  }

  const ranked = [...totals.entries()]
    .map(([type, points]) => ({ type, points }))
    .sort((a, b) => (b.points - a.points) || a.type.localeCompare(b.type));

  const top = ranked[0];
  const share = top.points / totalPoints;
  const saturation = Math.min(1, top.points / SATURATION_FLOOR);
  const confidence = Math.min(MAX_CONFIDENCE, Number((share * saturation).toFixed(4)));

  const assignment = confidence >= 0.85 ? "AUTO_ASSIGNED" : confidence >= 0.6 ? "PROVISIONAL" : "UNKNOWN";

  return {
    type: assignment === "UNKNOWN" ? "UNKNOWN" : top.type,
    confidence,
    assignment,
    alternatives: ranked.slice(assignment === "UNKNOWN" ? 0 : 1, 4).map(entry => ({
      type: entry.type,
      confidence: Number((Math.min(MAX_CONFIDENCE, (entry.points / totalPoints) * Math.min(1, entry.points / SATURATION_FLOOR))).toFixed(4)),
    })),
    evidenceIds: [...new Set(evidenceByType.get(top.type) ?? [])],
  };
}
