import type { AuditDto } from "../services/audit-service";
import type { TargetMetrics } from "./contracts";

export interface ComparableCategoryMetric {
  categoryName: string;
  scoreType: "SEO" | "GEO";
  score: number;
  maxScore: number;
}

export interface ComparableFinding {
  ruleId: string;
  title: string;
  scoreType: "SEO" | "GEO";
  category: string;
  weight: number;
  result: "PASS" | "WARN" | "FAIL";
}

export interface ComparableAuditSnapshot {
  auditRunId: string;
  auditResultId: string;
  displayUrl: string;
  metrics: TargetMetrics;
  categories: ComparableCategoryMetric[];
  findings: ComparableFinding[];
}

export function toComparableAuditSnapshot(
  audit: AuditDto,
  displayUrl: string,
): ComparableAuditSnapshot {
  const seoCategories = audit.scores.seo.categories.map((c) => ({
    categoryName: c.name,
    scoreType: "SEO" as const,
    score: c.score,
    maxScore: c.maxScore,
  }));

  const geoCategories = audit.scores.geoReadiness.categories.map((c) => ({
    categoryName: c.name,
    scoreType: "GEO" as const,
    score: c.score,
    maxScore: c.maxScore,
  }));

  const categories = [...seoCategories, ...geoCategories];

  const findings: ComparableFinding[] = audit.findings.map((f) => ({
    ruleId: f.ruleId,
    title: f.title,
    scoreType: f.scoreType,
    category: f.category,
    weight: f.weight,
    result: f.result,
  }));

  // Estimate citation metrics from GEO score & readiness findings
  const geoPassCount = audit.findings.filter((f) => f.scoreType === "GEO" && f.result === "PASS").length;
  const totalGeoRules = 15;
  const citationRate = Math.round((geoPassCount / totalGeoRules) * 100 * 10) / 10;
  const brandMentionRate = Math.round((audit.scores.geoReadiness.score / 100) * 100 * 10) / 10;

  const metrics: TargetMetrics = {
    citationRate,
    brandMentionRate,
    averageCitationPosition: citationRate > 0 ? 1.5 : null,
    citedObservationCount: geoPassCount,
    mentionedObservationCount: Math.round(geoPassCount * 1.2),
    eligibleObservationCount: totalGeoRules,
    seoScore: audit.scores.seo.score,
    geoReadinessScore: audit.scores.geoReadiness.score,
  };

  return {
    auditRunId: audit.runId,
    auditResultId: audit.auditResultId,
    displayUrl,
    metrics,
    categories,
    findings,
  };
}
