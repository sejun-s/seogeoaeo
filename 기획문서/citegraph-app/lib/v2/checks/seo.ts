/**
 * SEO FACT/VALIDATOR Atomic Check evaluator — 28개.
 * (SEO Atomic Check 34개 중 SEMANTIC 6개는 checks/index.ts에서 일괄 NOT_EVALUATED 처리한다.)
 *
 * 원본 판정 계약: 기획문서/citegraph-rule-registry-draft.md §3.1
 *
 * 길이 heuristic(title/meta/body)은 방법론 §7 Threshold Calibration이 요구하는
 * page-type/language별 calibration profile이 아직 없다. profile이 없으면
 * UNKNOWN만 반환한다 — v1처럼 20~65자 같은 고정 threshold로 PASS/FAIL을
 * 판정하지 않는다.
 */

import type { CheckEvalInput, CheckEvaluator } from "./types";
import { na, result, unknown } from "./types";

const NO_PROFILE = "no-calibrated-length-profile";
const NO_CORPUS = "no-site-corpus";

function f(input: CheckEvalInput, factType: Parameters<CheckEvalInput["index"]["one"]>[0]) {
  return input.index.one(factType);
}

export const SEO_CHECK_EVALUATORS: Record<string, CheckEvaluator> = {
  "AC-SEO-HTTPS": input => {
    const fact = f(input, "url.final");
    const protocol = (fact?.value as { protocol?: string } | undefined)?.protocol;
    const ok = protocol === "https:";
    return result(ok ? "PASS" : "FAIL", ok ? "https" : "not-https", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
  },

  "AC-SEO-CANON-PRESENT": input => {
    const fact = f(input, "document.canonical");
    const count = (fact?.value as { count?: number } | undefined)?.count ?? 0;
    if (count === 1) return result("PASS", "single-canonical", [fact!.factId], fact!.evidenceIds);
    if (count > 1) return result("WARN", "multiple-canonical", [fact!.factId], fact!.evidenceIds);
    return result("FAIL", "canonical-missing", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
  },

  "AC-SEO-CANON-VALID": input => {
    const fact = f(input, "document.canonical");
    const value = fact?.value as { count?: number; valid?: boolean } | undefined;
    if (!value || (value.count ?? 0) === 0) return na("canonical-not-declared", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
    return result(value.valid ? "PASS" : "FAIL", value.valid ? "canonical-valid" : "canonical-invalid-url", [fact!.factId], fact!.evidenceIds);
  },

  "AC-SEO-ROBOTS-PARSE": input => {
    const fact = f(input, "document.robots_directive");
    const value = fact?.value as { tokens?: string[] } | undefined;
    const KNOWN = new Set([
      "index", "noindex", "follow", "nofollow", "none", "all",
      "noarchive", "nosnippet", "noimageindex", "notranslate", "unavailable_after",
    ]);
    const tokens = value?.tokens ?? [];
    const unknownTokens = tokens.filter(token => !KNOWN.has(token) && !token.startsWith("max-"));
    if (unknownTokens.length > 0) {
      return result("WARN", `unknown-robots-token:${unknownTokens[0]}`, [fact!.factId], fact!.evidenceIds);
    }
    return result("PASS", "robots-tokens-parseable", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
  },

  "AC-SEO-ROBOTS-CONFLICT": input => {
    const fact = f(input, "document.robots_directive");
    const conflict = (fact?.value as { conflict?: boolean } | undefined)?.conflict ?? false;
    return result(conflict ? "FAIL" : "PASS", conflict ? "robots-conflict" : "robots-no-conflict", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
  },

  "AC-SEO-LANG-PRESENT": input => {
    const fact = f(input, "document.language");
    const raw = (fact?.value as { raw?: string } | undefined)?.raw ?? "";
    const ok = fact?.status === "PRESENT" || (fact?.status === "INVALID" && raw.length > 0);
    return result(ok ? "PASS" : "FAIL", ok ? "lang-present" : "lang-missing", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
  },

  "AC-SEO-LANG-VALID": input => {
    const fact = f(input, "document.language");
    const raw = (fact?.value as { raw?: string } | undefined)?.raw ?? "";
    if (!fact || fact.status === "ABSENT" || (fact.status === "INVALID" && raw === "")) {
      return na("lang-not-declared", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
    }
    return result(fact.status === "PRESENT" ? "PASS" : "FAIL", fact.status === "PRESENT" ? "lang-valid" : "lang-invalid-tag", [fact.factId], fact.evidenceIds);
  },

  "AC-SEO-TITLE-PRESENT": input => {
    const fact = f(input, "document.title");
    const length = (fact?.value as { length?: number } | undefined)?.length ?? 0;
    return result(length > 0 ? "PASS" : "FAIL", length > 0 ? "title-present" : "title-missing", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
  },

  "AC-SEO-TITLE-LENGTH": () => unknown(NO_PROFILE),
  "AC-SEO-TITLE-UNIQUE": () => unknown(NO_CORPUS),

  "AC-SEO-META-PRESENT": input => {
    const fact = f(input, "document.meta_description");
    const length = (fact?.value as { length?: number } | undefined)?.length ?? 0;
    return result(length > 0 ? "PASS" : "FAIL", length > 0 ? "meta-present" : "meta-missing", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
  },

  "AC-SEO-META-LENGTH": () => unknown(NO_PROFILE),
  "AC-SEO-META-UNIQUE": () => unknown(NO_CORPUS),

  "AC-SEO-H1-PRESENT": input => {
    const h1s = input.index.all("heading.node").filter(node => (node.value as { level?: number }).level === 1);
    const ok = h1s.length > 0;
    return result(ok ? "PASS" : "FAIL", ok ? "h1-present" : "h1-missing", h1s.map(node => node.factId), h1s.flatMap(node => node.evidenceIds));
  },

  "AC-SEO-H1-COUNT": input => {
    const h1s = input.index.all("heading.node").filter(node => (node.value as { level?: number }).level === 1);
    if (h1s.length === 1) return result("PASS", "h1-count-one", h1s.map(n => n.factId), h1s.flatMap(n => n.evidenceIds));
    if (h1s.length > 1) return result("WARN", "h1-count-multiple", h1s.map(n => n.factId), h1s.flatMap(n => n.evidenceIds));
    return result("FAIL", "h1-count-none", [], []);
  },

  "AC-SEO-HEADING-LEVEL": input => {
    const fact = f(input, "heading.outline");
    const value = fact?.value as { skips?: number; headingCount?: number } | undefined;
    if (!value || value.headingCount === 0) return result("FAIL", "no-headings", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
    if ((value.skips ?? 0) === 0) return result("PASS", "heading-outline-valid", [fact!.factId], fact!.evidenceIds);
    return result("WARN", "heading-level-skip", [fact!.factId], fact!.evidenceIds);
  },

  "AC-SEO-NOINDEX": input => {
    const fact = f(input, "document.robots_directive");
    const hasNoindex = (fact?.value as { hasNoindex?: boolean } | undefined)?.hasNoindex ?? false;
    return result(hasNoindex ? "FAIL" : "PASS", hasNoindex ? "noindex-present" : "noindex-absent", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
  },

  "AC-SEO-INDEX-INTENT": input => {
    if (input.pageType.type === "UNKNOWN") return unknown("page-type-unknown-cannot-determine-intent", input.pageType.evidenceIds);
    const intent = input.pageType.type === "UTILITY_AUTH" ? "NOT_INDEX_TARGET" : "PUBLIC_INDEX_TARGET";
    return result("PASS", `intent:${intent}`, [], input.pageType.evidenceIds);
  },

  "AC-SEO-NOFOLLOW": input => {
    const fact = f(input, "document.robots_directive");
    const hasNofollow = (fact?.value as { hasNofollow?: boolean } | undefined)?.hasNofollow ?? false;
    return result(hasNofollow ? "FAIL" : "PASS", hasNofollow ? "nofollow-present" : "nofollow-absent", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
  },

  "AC-SEO-CANON-RELATION": input => {
    const fact = f(input, "document.canonical");
    const value = fact?.value as { count?: number; valid?: boolean } | undefined;
    if (!value || (value.count ?? 0) === 0 || !value.valid) {
      return na("canonical-not-declared-or-invalid", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
    }
    return unknown("no-site-context-for-relation", [fact!.factId], fact!.evidenceIds);
  },

  "AC-SEO-SCHEMA-SYNTAX": input => {
    const fact = f(input, "schema.block");
    if (!fact || fact.status === "ABSENT") return result("WARN", "no-structured-data", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
    return result(fact.status === "PRESENT" ? "PASS" : "FAIL", fact.status === "PRESENT" ? "schema-syntax-valid" : "schema-syntax-error", [fact.factId], fact.evidenceIds);
  },

  "AC-SEO-SCHEMA-TYPE": input => {
    const fact = input.index.all("schema.node").find(x => x.factId.endsWith("_types"));
    const types = (fact?.value as { types?: string[] } | undefined)?.types ?? [];
    if (types.length === 0) return na("no-schema-type-to-check", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
    const GENERIC = new Set(["Organization", "Person", "WebSite", "WebPage", "BreadcrumbList", "NewsMediaOrganization"]);
    const TYPE_PAGE_MAP: Record<string, string> = {
      Article: "ARTICLE_BLOG", NewsArticle: "ARTICLE_BLOG", BlogPosting: "ARTICLE_BLOG",
      TechArticle: "DOCUMENTATION", FAQPage: "DOCUMENTATION", HowTo: "DOCUMENTATION",
      Product: "PRODUCT", ProductGroup: "PRODUCT", SoftwareApplication: "PRODUCT", WebApplication: "PRODUCT",
      Service: "SERVICE", ProfessionalService: "SERVICE",
      CollectionPage: "CATEGORY_LISTING", ItemList: "CATEGORY_LISTING",
      ContactPage: "CONTACT_ABOUT", AboutPage: "CONTACT_ABOUT",
    };
    const compatible = types.some(type => GENERIC.has(type) || TYPE_PAGE_MAP[type] === input.pageType.type);
    if (compatible) return result("PASS", "schema-type-compatible", [fact!.factId], fact!.evidenceIds);
    if (input.pageType.type === "UNKNOWN") return unknown("page-type-unknown-cannot-verify-compatibility", [fact!.factId], fact!.evidenceIds);
    return result("WARN", "schema-type-page-type-mismatch", [fact!.factId], fact!.evidenceIds);
  },

  "AC-SEO-SCHEMA-REQUIRED": input => {
    const fact = f(input, "schema.validation");
    const value = fact?.value as { validations?: Array<{ supported: boolean; missing: string[] }>; missingCount?: number } | undefined;
    const supported = (value?.validations ?? []).filter(v => v.supported);
    if (supported.length === 0) return na("no-supported-schema-type", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
    const ok = (value?.missingCount ?? 0) === 0;
    return result(ok ? "PASS" : "FAIL", ok ? "required-properties-complete" : "required-properties-missing", [fact!.factId], fact!.evidenceIds);
  },

  "AC-SEO-BODY-AMOUNT": () => unknown(NO_PROFILE),

  "AC-SEO-INTERNAL-CRAWL": input => {
    const fact = f(input, "link.internal");
    const crawlable = (fact?.value as { crawlable?: number } | undefined)?.crawlable ?? 0;
    if (crawlable >= 2) return result("PASS", "internal-links-sufficient", [fact!.factId], fact!.evidenceIds);
    if (crawlable === 1) return result("WARN", "internal-links-limited", [fact!.factId], fact!.evidenceIds);
    return result("FAIL", "internal-links-absent", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
  },

  "AC-SEO-ALT-PRESENCE": input => {
    const fact = f(input, "image.node");
    const value = fact?.value as { applicable?: number; withAltAttribute?: number } | undefined;
    const applicable = value?.applicable ?? 0;
    if (applicable === 0) return na("no-applicable-images", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
    const withAlt = value?.withAltAttribute ?? 0;
    if (withAlt === applicable) return result("PASS", "alt-all-present", [fact!.factId], fact!.evidenceIds);
    if (withAlt > 0) return result("WARN", "alt-partial", [fact!.factId], fact!.evidenceIds);
    return result("FAIL", "alt-missing-critical", [fact!.factId], fact!.evidenceIds);
  },

  "AC-SEO-DATE-APPLICABLE": input => {
    if (input.pageType.type === "UNKNOWN") return unknown("page-type-unknown", input.pageType.evidenceIds);
    const applicable = input.pageType.type === "ARTICLE_BLOG" || input.pageType.type === "DOCUMENTATION";
    return result("PASS", `applicable:${applicable}`, [], input.pageType.evidenceIds);
  },

  "AC-SEO-DATE-PRESENT": input => {
    if (input.pageType.type === "UNKNOWN") return unknown("page-type-unknown-cannot-determine-date-applicability", input.pageType.evidenceIds);
    const dateRelevant = input.pageType.type === "ARTICLE_BLOG" || input.pageType.type === "DOCUMENTATION";
    if (!dateRelevant) return na("date-not-required-for-page-type", [], input.pageType.evidenceIds);
    const fact = f(input, "date.signal");
    if (fact?.status === "PRESENT") return result("PASS", "date-typed-valid", [fact.factId], fact.evidenceIds);
    if (fact?.status === "INVALID") return result("WARN", "date-partial-inconsistent", [fact.factId], fact.evidenceIds);
    return result("FAIL", "date-missing", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
  },
};
