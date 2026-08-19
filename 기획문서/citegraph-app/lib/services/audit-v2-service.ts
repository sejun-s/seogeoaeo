import { fetchAuditDocument } from "../audit/guard";
import { analyzeSnapshotV2, createSnapshot } from "../v2";
import type { CheckState, DomainScore, PageTypeResult, RuleResultV2 } from "../v2";

export interface AuditV2Dto {
  engine: "v2-preview";
  methodologyVersion: string;
  registryVersion: string;
  extractorVersion: string;
  snapshotId: string;
  contentHash: string;
  finalUrl: string;
  pageType: PageTypeResult;
  registry: { atomicCheckCount: number; scoringRuleCount: number };
  seoFact: DomainScore;
  geoFact: DomainScore;
  geoSemantic: DomainScore;
  geoOverall: { state: "NOT_EVALUATED"; reason: string };
  exclusions: Array<{
    ruleId: string;
    domain: string;
    result: Extract<CheckState, "N_A" | "UNKNOWN" | "NOT_EVALUATED">;
    rationaleCode: string;
  }>;
}

function isExcludedRule(rule: RuleResultV2): rule is RuleResultV2 & {
  result: Extract<CheckState, "N_A" | "UNKNOWN" | "NOT_EVALUATED">;
} {
  return ["N_A", "UNKNOWN", "NOT_EVALUATED"].includes(rule.result);
}

export async function executeAuditV2(url: string): Promise<AuditV2Dto> {
  const document = await fetchAuditDocument(url);
  const snapshot = await createSnapshot({
    requestUrl: url,
    finalUrl: document.finalUrl,
    status: document.httpStatus,
    headers: {
      "content-type": document.contentType,
      "x-robots-tag": document.xRobotsTag,
    },
    rawHtml: document.html,
    renderedHtml: null,
  });
  const result = analyzeSnapshotV2(snapshot);
  const rules = [...result.seo.rules, ...result.geoFact.rules, ...result.geoSemantic.rules];

  return {
    engine: "v2-preview",
    methodologyVersion: result.methodologyVersion,
    registryVersion: result.registryVersion,
    extractorVersion: result.extractorVersion,
    snapshotId: result.snapshotId,
    contentHash: result.contentHash,
    finalUrl: result.finalUrl,
    pageType: result.pageType,
    registry: result.registry,
    seoFact: result.seo,
    geoFact: result.geoFact,
    geoSemantic: result.geoSemantic,
    geoOverall: result.geoOverall,
    exclusions: rules.filter(isExcludedRule).map((rule) => ({
      ruleId: rule.ruleId,
      domain: rule.scoreDomain,
      result: rule.result,
      rationaleCode: rule.rationaleCode || "reason-not-recorded",
    })),
  };
}
