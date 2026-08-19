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
 */
const SATURATION_FLOOR = 7;
const MAX_CONFIDENCE = 0.95;

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
  reason: string;
  evidenceIds: string[];
}

export function classifyPageType(index: FactIndex): PageTypeResult {
  const signals: Signal[] = [];
  const push = (type: PageType, points: number, reason: string, evidenceIds: string[] = []) =>
    signals.push({ type, points, reason, evidenceIds });

  const urlFact = index.one("url.final");
  const url = urlFact?.value as { href: string } | undefined;
  const path = url ? new URL(url.href).pathname : "/";

  /* --- schema --- */
  const schemaFact = index.all("schema.node").find(fact => fact.factId.endsWith("_types"));
  const schemaTypes = ((schemaFact?.value as { types?: string[] } | undefined)?.types ?? []) as string[];
  for (const type of schemaTypes) {
    const mapped = SCHEMA_TYPE_MAP[type];
    if (mapped) push(mapped, 5, `schema:${type}`, schemaFact?.evidenceIds ?? []);
  }
  // Organization/Person은 발행 주체 신호다. 루트 경로일 때만 HOMEPAGE 근거로 쓴다.
  if (path === "/" && schemaTypes.some(type => ["Organization", "NewsMediaOrganization", "Corporation"].includes(type))) {
    push("HOMEPAGE", 5, "schema:Organization@root");
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
      if (mapped) push(mapped, 3, `schema-recovered:${type}`);
    }
  }

  /* --- URL path --- */
  if (path === "/" || path === "") {
    push("HOMEPAGE", 4, "path:root");
  } else {
    const matched = PATH_MAP.find(entry => entry.pattern.test(path));
    if (matched) push(matched.type, 3, `path:${matched.pattern.source.slice(3, 20)}`);
  }

  /* --- document structure --- */
  const landmark = index.one("landmark.node")?.value as
    | { article?: number; form?: number; address?: number }
    | undefined;
  if ((landmark?.article ?? 0) > 0) push("ARTICLE_BLOG", 2, "element:article");

  const author = index.one("author.signal");
  const date = index.one("date.signal");
  if (author?.status === "PRESENT" && date?.status === "PRESENT") {
    push("ARTICLE_BLOG", 2, "signal:author+date", [...(author.evidenceIds ?? []), ...(date.evidenceIds ?? [])]);
  }

  // article 요소 + 2개 이상 H2 + 각 H2 아래 문단 존재는 하나의 신호를 여러 각도로
  // 확인한 것이라 단일 element 존재보다 신뢰도가 높다. 경로 키워드 하나(3점)에
  // 밀려 ARTICLE_BLOG가 UNKNOWN으로 빠지는 것을 막는다.
  // schema 신호가 이미 있으면(TechArticle 등) 적용하지 않는다 — schema 기반
  // 확정 신호를 구조 신호가 잠식해 오히려 confidence를 낮추면 안 된다.
  const headingNodes = index.all("heading.node");
  const h2Count = headingNodes.filter(node => (node.value as { level?: number }).level === 2).length;
  const paragraphCount = index.all("content.paragraph").length;
  if (schemaTypes.length === 0 && (landmark?.article ?? 0) > 0 && h2Count >= 2 && paragraphCount >= h2Count) {
    push("ARTICLE_BLOG", 3, "structure:article+multi-h2+paragraphs");
  }

  const barrier = index.one("access.barrier");
  if (barrier?.status === "PRESENT" && /log ?in|sign in|로그인|회원가입/i.test(String((barrier.value as { pattern?: string }).pattern ?? ""))) {
    push("UTILITY_AUTH", 4, "signal:auth-barrier", barrier.evidenceIds ?? []);
  }

  const structure = index.all("entity.signal").find(fact => fact.factId.endsWith("_list_table_structure"));
  const structureValue = structure?.value as { tables?: number; listItems?: number; orderedLists?: number } | undefined;
  if ((structureValue?.tables ?? 0) > 0) push("CATEGORY_LISTING", 2, "structure:table");

  // form + address는 연락처/문의 페이지의 흔한 구조적 조합이다.
  if ((landmark?.form ?? 0) > 0 && (landmark?.address ?? 0) > 0) {
    push("CONTACT_ABOUT", 4, "structure:form+address");
  }

  const mainText = index.one("content.main_text")?.value as { length?: number } | undefined;
  const internal = index.one("link.internal")?.value as { count?: number } | undefined;
  if ((mainText?.length ?? 0) < 200 && (internal?.count ?? 0) <= 2 && path !== "/") {
    push("LANDING_PAGE", 2, "signal:short-main+few-links");
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
    push("LANDING_PAGE", 3, "structure:hero-sections+feature-list");
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
