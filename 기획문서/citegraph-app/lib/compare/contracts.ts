export type CompareTargetRole = "ME" | "COMPETITOR";

export type CompareRunStatus =
  | "RUNNING"
  | "COMPLETED"
  | "PARTIAL"
  | "INSUFFICIENT"
  | "FAILED"
  | "ABORTED";

export type CompareTargetStatus =
  | "QUEUED"
  | "RUNNING"
  | "SUCCESS"
  | "ERROR"
  | "CANCELLED";

export interface CompareTargetInput {
  role: CompareTargetRole;
  url: string;
  label?: string;
}

export interface CompareRequestBody {
  projectId?: string;
  targets: CompareTargetInput[];
}

export interface TargetMetrics {
  citationRate: number | null;
  brandMentionRate: number | null;
  averageCitationPosition: number | null;
  citedObservationCount: number;
  mentionedObservationCount: number;
  eligibleObservationCount: number;
  seoScore: number | null;
  geoReadinessScore: number | null;
}

export interface CompareTargetResult {
  targetId: string;
  ordinal: number;
  role: CompareTargetRole;
  label: string;
  displayUrl: string;
  status: CompareTargetStatus;
  auditRunId: string | null;
  auditResultId: string | null;
  metrics: TargetMetrics | null;
  error: {
    code: string;
    message: string;
    retryable: boolean;
  } | null;
}

export interface PlatformComparison {
  platformId: string;
  platformName: string;
  metrics: Record<string, { citationRate: number | null; rank: number }>;
}

export interface QuestionComparison {
  questionId: string;
  questionText: string;
  winnerRole: CompareTargetRole | "NONE";
  winnerUrl: string | null;
  results: Record<
    string,
    {
      cited: boolean;
      position: number | null;
    }
  >;
}

export interface CategoryComparison {
  categoryName: string;
  scoreType: "SEO" | "GEO";
  maxScore: number;
  scores: Record<string, number | null>;
}

export interface FindingComparison {
  ruleId: string;
  title: string;
  scoreType: "SEO" | "GEO";
  category: string;
  weight: number;
  results: Record<string, "PASS" | "WARN" | "FAIL" | "MISSING">;
}

export interface CompareSummary {
  overallWinnerRole: CompareTargetRole | "NONE";
  overallWinnerUrl: string | null;
  rankings: Array<{
    ordinal: number;
    role: CompareTargetRole;
    url: string;
    rank: number;
    citationRate: number | null;
    brandMentionRate: number | null;
    averagePosition: number | null;
  }>;
  gapsVsMe: Record<
    string,
    {
      citationGap: number | null;
      brandMentionGap: number | null;
      positionAdvantage: number | null;
    }
  >;
}

export interface CompareResponse {
  compareRunId: string;
  status: CompareRunStatus;
  context: {
    projectId: string;
    questionSetId: string;
    questionSetVersion: string;
    platformSetVersion: string;
    rulesetVersion: string;
    engineVersion: string;
    comparisonAlgorithmVersion: string;
    startedAt: string;
    completedAt: string | null;
  };
  targets: CompareTargetResult[];
  summary: CompareSummary | null;
  platforms: PlatformComparison[];
  questions: QuestionComparison[];
  categories: CategoryComparison[];
  findingsDiff: FindingComparison[];
}
