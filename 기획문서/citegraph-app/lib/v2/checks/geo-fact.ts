/**
 * GEO_FACT Atomic Check evaluator — 12개.
 *
 * 원본 판정 계약: 기획문서/citegraph-rule-registry-draft.md §3.2
 *
 * AC-GF-CITEURL은 tel:/mailto:/javascript: 링크를 citation으로 인정하지
 * 않는다 — v1이 전화번호를 출처로 인정한 오판(방법론 §12.4)의 재발 방지.
 */

import type { CheckEvalInput, CheckEvaluator } from "./types";
import { na, result, unknown } from "./types";

function f(input: CheckEvalInput, factType: Parameters<CheckEvalInput["index"]["one"]>[0]) {
  return input.index.one(factType);
}

export const GEO_FACT_CHECK_EVALUATORS: Record<string, CheckEvaluator> = {
  "AC-GF-QSTRUCT": input => {
    const fact = f(input, "content.question_section");
    return result(fact?.status === "PRESENT" ? "PASS" : "FAIL", fact?.status === "PRESENT" ? "question-section-present" : "question-section-absent", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
  },

  "AC-GF-LISTTABLE": input => {
    const fact = input.index.all("entity.signal").find(x => x.factId.endsWith("_list_table_structure"));
    return result(fact?.status === "PRESENT" ? "PASS" : "FAIL", fact?.status === "PRESENT" ? "list-table-present" : "list-table-absent", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
  },

  "AC-GF-LANDMARK": input => {
    const fact = f(input, "landmark.node");
    const value = fact?.value as { main?: number; article?: number; section?: number; mainTextRatio?: number } | undefined;
    const identified = (value?.main ?? 0) + (value?.article ?? 0) + (value?.section ?? 0) > 0;
    const ratio = value?.mainTextRatio ?? 0;
    if (!identified || ratio === 0) return result("FAIL", "main-landmark-unidentified", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
    return result(ratio >= 0.5 ? "PASS" : "WARN", ratio >= 0.5 ? "landmark-high-coverage" : "landmark-partial-coverage", [fact!.factId], fact!.evidenceIds);
  },

  "AC-GF-RAWCONTENT": input => {
    const fact = f(input, "content.main_text");
    const length = (fact?.value as { length?: number } | undefined)?.length ?? 0;
    // 이 threshold는 "raw HTML에 본문이 조금이라도 있는가"를 보는 shell-detection
    // 용이다. page type별 충분성 판단(calibration 필요)은 AC-SEO-BODY-AMOUNT가 맡는다.
    if (length >= 250) return result("PASS", "raw-content-present", [fact!.factId], fact!.evidenceIds);
    if (length > 0) return result("WARN", "raw-content-partial", [fact!.factId], fact!.evidenceIds);
    return result("FAIL", "raw-content-shell-or-absent", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
  },

  "AC-GF-RENDERDEP": input => {
    const fact = f(input, "render.diff");
    const value = fact?.value as { hasRendered?: boolean; rawMainLength?: number } | undefined;
    if (!value?.hasRendered) return unknown("UNSUPPORTED", "no-rendered-snapshot", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
    // rendered snapshot이 생기면(향후 renderer 도입 후) 여기서 raw/rendered 비율을 비교한다.
    return result("PASS", "render-dependency-low", [fact!.factId], fact!.evidenceIds);
  },

  "AC-GF-ACCESS": input => {
    const statusFact = f(input, "http.status");
    const status = (statusFact?.value as number | undefined) ?? 200;
    if (status === 401 || status === 403) return result("WARN", "http-status-partial-wall", statusFact ? [statusFact.factId] : [], statusFact?.evidenceIds ?? []);
    const barrier = f(input, "access.barrier");
    if (barrier?.status === "PRESENT") return result("FAIL", "access-blocked", [barrier.factId], barrier.evidenceIds);
    return result("PASS", "access-accessible", barrier ? [barrier.factId] : [], barrier?.evidenceIds ?? []);
  },

  "AC-GF-AUTHOR": input => {
    const fact = f(input, "author.signal");
    return result(fact?.status === "PRESENT" ? "PASS" : "FAIL", fact?.status === "PRESENT" ? "author-present" : "author-absent", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
  },

  "AC-GF-DATE": input => {
    const fact = f(input, "date.signal");
    if (fact?.status === "PRESENT") return result("PASS", "date-provenance-typed", [fact.factId], fact.evidenceIds);
    if (fact?.status === "INVALID") return result("WARN", "date-provenance-partial", [fact.factId], fact.evidenceIds);
    return result("FAIL", "date-provenance-absent", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
  },

  "AC-GF-PUBLISHER": input => {
    const fact = f(input, "publisher.signal");
    return result(fact?.status === "PRESENT" ? "PASS" : "FAIL", fact?.status === "PRESENT" ? "publisher-present" : "publisher-absent", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
  },

  "AC-GF-CITEURL": input => {
    const fact = f(input, "link.external_citation");
    const value = fact?.value as { httpCount?: number; nonHttpCount?: number } | undefined;
    if (!fact || fact.status === "ABSENT") return na("no-external-citation-candidate", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
    if ((value?.httpCount ?? 0) > 0) return result("PASS", "citation-url-valid-http", [fact.factId], fact.evidenceIds);
    return result("FAIL", "citation-url-non-http-only", [fact.factId], fact.evidenceIds);
  },

  "AC-GF-CITEPROX": input => {
    const fact = f(input, "citation.relation");
    const proximity = (fact?.value as { proximity?: string } | undefined)?.proximity;
    if (!proximity || proximity === "NO_CLAIM") return na("no-verifiable-claim", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
    if (proximity === "SAME_PARAGRAPH") return result("PASS", "citation-same-paragraph", [fact!.factId], fact!.evidenceIds);
    if (proximity === "SAME_DOCUMENT") return result("WARN", "citation-same-document", [fact!.factId], fact!.evidenceIds);
    return result("FAIL", "citation-remote-or-absent", [fact!.factId], fact!.evidenceIds);
  },

  "AC-GF-ENTITY": input => {
    const fact = input.index.all("entity.signal").find(x => x.factId.endsWith("_names"));
    const sources = (fact?.value as { sources?: string[] } | undefined)?.sources ?? [];
    if (sources.length >= 2) return result("PASS", "entity-multi-source", [fact!.factId], fact!.evidenceIds);
    if (sources.length === 1) return result("WARN", "entity-single-source", [fact!.factId], fact!.evidenceIds);
    return result("FAIL", "entity-signals-absent", fact ? [fact.factId] : [], fact?.evidenceIds ?? []);
  },
};
