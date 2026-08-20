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

  const metrics: TargetMetrics = {
    aiVisibilityStatus: "UNAVAILABLE",
    aiVisibilityReason: "AI 관측 provider와 질문 세트가 연결되지 않았습니다.",
    citationRate: null,
    brandMentionRate: null,
    averageCitationPosition: null,
    citedObservationCount: 0,
    mentionedObservationCount: 0,
    eligibleObservationCount: 0,
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
