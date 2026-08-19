import type {
  CategoryComparison,
  CompareSummary,
  CompareTargetResult,
  FindingComparison,
} from "./contracts";
import type { ComparableAuditSnapshot } from "./normalize";

export function calculateSummary(
  targets: CompareTargetResult[],
): CompareSummary | null {
  const validTargets = targets.filter(
    (t) => t.status === "SUCCESS" && t.metrics !== null,
  );

  if (validTargets.length < 2) {
    return null;
  }

  const meTarget = validTargets.find((t) => t.role === "ME");

  // Rank sorting:
  // 1. Citation Rate desc
  // 2. Brand Mention Rate desc
  // 3. Avg Citation Position asc (lower is better)
  const sorted = [...validTargets].sort((a, b) => {
    const ma = a.metrics!;
    const mb = b.metrics!;

    if ((mb.citationRate || 0) !== (ma.citationRate || 0)) {
      return (mb.citationRate || 0) - (ma.citationRate || 0);
    }
    if ((mb.brandMentionRate || 0) !== (ma.brandMentionRate || 0)) {
      return (mb.brandMentionRate || 0) - (ma.brandMentionRate || 0);
    }
    const posA = ma.averageCitationPosition ?? 999;
    const posB = mb.averageCitationPosition ?? 999;
    return posA - posB;
  });

  const rankings = sorted.map((t, idx) => ({
    ordinal: t.ordinal,
    role: t.role,
    url: t.displayUrl,
    rank: idx + 1,
    citationRate: t.metrics!.citationRate,
    brandMentionRate: t.metrics!.brandMentionRate,
    averagePosition: t.metrics!.averageCitationPosition,
  }));

  const winner = sorted[0];
  const overallWinnerRole = winner ? winner.role : "NONE";
  const overallWinnerUrl = winner ? winner.displayUrl : null;

  const gapsVsMe: Record<
    string,
    {
      citationGap: number | null;
      brandMentionGap: number | null;
      positionAdvantage: number | null;
    }
  > = {};

  if (meTarget && meTarget.metrics) {
    const meMetrics = meTarget.metrics;
    for (const t of validTargets) {
      if (t.role === "COMPETITOR" && t.metrics) {
        const cMetrics = t.metrics;
        const citationGap =
          cMetrics.citationRate !== null && meMetrics.citationRate !== null
            ? Math.round((cMetrics.citationRate - meMetrics.citationRate) * 10) / 10
            : null;

        const brandMentionGap =
          cMetrics.brandMentionRate !== null && meMetrics.brandMentionRate !== null
            ? Math.round((cMetrics.brandMentionRate - meMetrics.brandMentionRate) * 10) / 10
            : null;

        const positionAdvantage =
          meMetrics.averageCitationPosition !== null && cMetrics.averageCitationPosition !== null
            ? Math.round((meMetrics.averageCitationPosition - cMetrics.averageCitationPosition) * 10) / 10
            : null;

        gapsVsMe[t.displayUrl] = {
          citationGap,
          brandMentionGap,
          positionAdvantage,
        };
      }
    }
  }

  return {
    overallWinnerRole,
    overallWinnerUrl,
    rankings,
    gapsVsMe,
  };
}

export function buildCategoryComparisons(
  snapshots: Array<{ url: string; snapshot: ComparableAuditSnapshot | null }>,
): CategoryComparison[] {
  const categoryMap = new Map<string, CategoryComparison>();

  for (const { url, snapshot } of snapshots) {
    if (!snapshot) continue;
    for (const cat of snapshot.categories) {
      const key = `${cat.scoreType}:${cat.categoryName}`;
      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          categoryName: cat.categoryName,
          scoreType: cat.scoreType,
          maxScore: cat.maxScore,
          scores: {},
        });
      }
      const entry = categoryMap.get(key)!;
      entry.scores[url] = cat.score;
    }
  }

  // Ensure all URLs have an entry or null
  for (const { url } of snapshots) {
    for (const entry of categoryMap.values()) {
      if (entry.scores[url] === undefined) {
        entry.scores[url] = null;
      }
    }
  }

  return Array.from(categoryMap.values());
}

export function buildFindingsComparisons(
  snapshots: Array<{ url: string; snapshot: ComparableAuditSnapshot | null }>,
): FindingComparison[] {
  const findingMap = new Map<string, FindingComparison>();

  for (const { url, snapshot } of snapshots) {
    if (!snapshot) continue;
    for (const f of snapshot.findings) {
      if (!findingMap.has(f.ruleId)) {
        findingMap.set(f.ruleId, {
          ruleId: f.ruleId,
          title: f.title,
          scoreType: f.scoreType,
          category: f.category,
          weight: f.weight,
          results: {},
        });
      }
      const entry = findingMap.get(f.ruleId)!;
      entry.results[url] = f.result;
    }
  }

  // Any target that succeeded but had no finding for a rule passed that rule.
  // Targets that failed audit return MISSING.
  for (const { url, snapshot } of snapshots) {
    for (const entry of findingMap.values()) {
      if (entry.results[url] === undefined) {
        entry.results[url] = snapshot ? "PASS" : "MISSING";
      }
    }
  }

  return Array.from(findingMap.values()).sort((a, b) => b.weight - a.weight);
}
