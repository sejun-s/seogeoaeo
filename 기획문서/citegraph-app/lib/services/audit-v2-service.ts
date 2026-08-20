import { fetchAuditDocument } from "../audit/guard";
import { analyzeSnapshotV2, createSnapshot } from "../v2";
import type { CheckState, DomainScore, PageTypeResult, RuleResultV2 } from "../v2";
import { getDb } from "../db";
import { getAuditV2Result, getAuditV2ResultBySnapshot, persistAuditV2Result, recordProductEvent } from "../repositories/audit-v2-repository";

export interface AuditV2Dto {
  engine: "v2-preview";
  methodologyVersion: string;
  registryVersion: string;
  extractorVersion: string;
  snapshotId: string;
  contentHash: string;
  finalUrl: string;
  resultId: string;
  persistence: { storageMode: "HASH_ONLY"; rawHtmlStored: false; evidenceCount: number; factCount: number };
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

export async function executeAuditV2(url: string, workspaceId: string, projectId: string | null): Promise<AuditV2Dto> {
  const document = await fetchAuditDocument(url);
  const snapshot = await createSnapshot({
    requestUrl: document.normalizedUrl,
    finalUrl: document.normalizedUrl,
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
  const db = getDb();
  const cached = await getAuditV2ResultBySnapshot(db, workspaceId, projectId, result.snapshotId);
  if (cached) {
    await recordProductEvent(db, "AUDIT_V2_COMPLETED", workspaceId, cached.id);
    return JSON.parse(cached.resultJson) as AuditV2Dto;
  }

  const resultId = `v2_${crypto.randomUUID()}`;
  const dto: AuditV2Dto = {
    engine: "v2-preview",
    methodologyVersion: result.methodologyVersion,
    registryVersion: result.registryVersion,
    extractorVersion: result.extractorVersion,
    snapshotId: result.snapshotId,
    contentHash: result.contentHash,
    finalUrl: result.finalUrl,
    resultId,
    persistence: {
      storageMode: "HASH_ONLY",
      rawHtmlStored: false,
      evidenceCount: result.evidence.length,
      factCount: result.facts.length,
    },
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
  await persistAuditV2Result(db, {
    id: resultId,
    workspaceId,
    projectId,
    snapshotId: result.snapshotId,
    requestedUrl: document.normalizedUrl,
    finalUrl: document.normalizedUrl,
    contentHash: result.contentHash,
    httpStatus: document.httpStatus,
    contentType: document.contentType,
    methodologyVersion: result.methodologyVersion,
    registryVersion: result.registryVersion,
    extractorVersion: result.extractorVersion,
    storageMode: "HASH_ONLY",
    resultJson: JSON.stringify(dto),
    createdAt: new Date(),
  });
  return dto;
}

export async function readAuditV2(workspaceId: string, id: string): Promise<AuditV2Dto | null> {
  const stored = await getAuditV2Result(getDb(), workspaceId, id);
  return stored ? JSON.parse(stored.resultJson) as AuditV2Dto : null;
}
