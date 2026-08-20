import { describe, expect, it } from "vitest";
import { calculateSummary, buildCategoryComparisons, buildFindingsComparisons } from "../../lib/compare/metrics";
import type { CompareTargetResult } from "../../lib/compare/contracts";
import { toComparableAuditSnapshot } from "../../lib/compare/normalize";
import type { AuditDto } from "../../lib/services/audit-service";

describe("CiteGraph Compare Pipeline Tests", () => {
  it("calculates summary rankings and winner correctly", () => {
    const targets: CompareTargetResult[] = [
      {
        targetId: "t1",
        ordinal: 1,
        role: "ME",
        label: "자사 사이트",
        displayUrl: "https://mysite.com",
        status: "SUCCESS",
        auditRunId: "run1",
        auditResultId: "res1",
        metrics: {
          aiVisibilityStatus: "REAL",
          aiVisibilityReason: null,
          citationRate: 80,
          brandMentionRate: 75,
          averageCitationPosition: 1.2,
          citedObservationCount: 12,
          mentionedObservationCount: 15,
          eligibleObservationCount: 15,
          seoScore: 90,
          geoReadinessScore: 85,
        },
        error: null,
      },
      {
        targetId: "t2",
        ordinal: 2,
        role: "COMPETITOR",
        label: "경쟁사 A",
        displayUrl: "https://competitor.com",
        status: "SUCCESS",
        auditRunId: "run2",
        auditResultId: "res2",
        metrics: {
          aiVisibilityStatus: "REAL",
          aiVisibilityReason: null,
          citationRate: 60,
          brandMentionRate: 50,
          averageCitationPosition: 2.5,
          citedObservationCount: 9,
          mentionedObservationCount: 10,
          eligibleObservationCount: 15,
          seoScore: 70,
          geoReadinessScore: 65,
        },
        error: null,
      },
    ];

    const summary = calculateSummary(targets);
    expect(summary).not.toBeNull();
    expect(summary?.overallWinnerRole).toBe("ME");
    expect(summary?.overallWinnerUrl).toBe("https://mysite.com");
    expect(summary?.rankings).toHaveLength(2);
    expect(summary?.rankings[0].rank).toBe(1);
    expect(summary?.rankings[0].url).toBe("https://mysite.com");

    expect(summary?.gapsVsMe["https://competitor.com"]).toEqual({
      citationGap: -20,
      brandMentionGap: -25,
      positionAdvantage: -1.3,
    });
  });

  it("does not rank GEO Readiness as AI Visibility when observations are unavailable", () => {
    const unavailable: CompareTargetResult[] = [
      {
        targetId: "t1", ordinal: 1, role: "ME", label: "자사", displayUrl: "https://mysite.com",
        status: "SUCCESS", auditRunId: "run1", auditResultId: "res1", error: null,
        metrics: { aiVisibilityStatus: "UNAVAILABLE", aiVisibilityReason: "provider-not-connected", citationRate: null, brandMentionRate: null, averageCitationPosition: null, citedObservationCount: 0, mentionedObservationCount: 0, eligibleObservationCount: 0, seoScore: 90, geoReadinessScore: 85 },
      },
      {
        targetId: "t2", ordinal: 2, role: "COMPETITOR", label: "경쟁사", displayUrl: "https://competitor.com",
        status: "SUCCESS", auditRunId: "run2", auditResultId: "res2", error: null,
        metrics: { aiVisibilityStatus: "UNAVAILABLE", aiVisibilityReason: "provider-not-connected", citationRate: null, brandMentionRate: null, averageCitationPosition: null, citedObservationCount: 0, mentionedObservationCount: 0, eligibleObservationCount: 0, seoScore: 70, geoReadinessScore: 65 },
      },
    ];

    expect(calculateSummary(unavailable)).toBeNull();
  });

  it("normalizes a deterministic audit without fabricating AI observations", () => {
    const audit: AuditDto = {
      runId: "run-1", auditResultId: "result-1", cacheHit: false,
      finalUrl: "https://example.com/", rulesetVersion: "2026.08.1", engineVersion: "v1.0.0",
      extracted: { title: "Example", metaDescription: "", h1: ["Example"], canonical: "", robots: "", schemaTypes: [], lang: "en" },
      scores: {
        seo: { score: 90, categories: [{ name: "Technical SEO", score: 30, maxScore: 35 }] },
        geoReadiness: { score: 85, categories: [{ name: "Answerability", score: 20, maxScore: 30 }] },
      },
      findings: [{ id: "finding-1", ruleId: "GEO_TEST", scoreType: "GEO", category: "Answerability", title: "GEO test", description: "", weight: 5, result: "PASS", recommendation: "", evidence: [] }],
    };

    const snapshot = toComparableAuditSnapshot(audit, audit.finalUrl);
    expect(snapshot.metrics).toMatchObject({
      aiVisibilityStatus: "UNAVAILABLE",
      citationRate: null,
      brandMentionRate: null,
      averageCitationPosition: null,
      citedObservationCount: 0,
      eligibleObservationCount: 0,
      seoScore: 90,
      geoReadinessScore: 85,
    });
  });

  it("handles missing/failed targets in category & findings diff builders without crashing", () => {
    const snapshots = [
      {
        url: "https://mysite.com",
        snapshot: {
          auditRunId: "r1",
          auditResultId: "res1",
          displayUrl: "https://mysite.com",
          metrics: {
            aiVisibilityStatus: "REAL" as const,
            aiVisibilityReason: null,
            citationRate: 80,
            brandMentionRate: 70,
            averageCitationPosition: 1.0,
            citedObservationCount: 12,
            mentionedObservationCount: 14,
            eligibleObservationCount: 15,
            seoScore: 80,
            geoReadinessScore: 80,
          },
          categories: [
            { categoryName: "Technical SEO", scoreType: "SEO" as const, score: 20, maxScore: 20 },
          ],
          findings: [
            { ruleId: "SEO-TECH-001", title: "HTTPS 사용", scoreType: "SEO" as const, category: "Technical SEO", weight: 5, result: "PASS" as const },
          ],
        },
      },
      {
        url: "https://competitor.com",
        snapshot: null, // failed target
      },
    ];

    const categories = buildCategoryComparisons(snapshots);
    expect(categories).toHaveLength(1);
    expect(categories[0].scores["https://mysite.com"]).toBe(20);
    expect(categories[0].scores["https://competitor.com"]).toBeNull();

    const findings = buildFindingsComparisons(snapshots);
    expect(findings).toHaveLength(1);
    expect(findings[0].results["https://mysite.com"]).toBe("PASS");
    expect(findings[0].results["https://competitor.com"]).toBe("MISSING");
  });
});
