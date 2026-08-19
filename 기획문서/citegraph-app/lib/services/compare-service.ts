import type { CiteGraphDb } from "../db";
import { getDb } from "../db";
import { validateAndNormalizeUrl } from "../audit/guard";
import {
  ENGINE_VERSION,
  RULESET_VERSION,
  executeAudit,
} from "./audit-service";
import type {
  CompareRequestBody,
  CompareResponse,
  CompareRunStatus,
  CompareTargetResult,
} from "../compare/contracts";
import {
  buildCategoryComparisons,
  buildFindingsComparisons,
  calculateSummary,
} from "../compare/metrics";
import {
  toComparableAuditSnapshot,
  type ComparableAuditSnapshot,
} from "../compare/normalize";
import {
  createCompareRun,
  createCompareTargets,
  updateCompareRunStatus,
  updateCompareTargetStatus,
} from "../repositories/compare-repository";

export const QUESTION_SET_ID = "default_qs_v1";
export const QUESTION_SET_VERSION = "2026.08.1";
export const PLATFORM_SET_VERSION = "2026.08.1";
export const COMPARISON_ALGORITHM_VERSION = "v1.0.0";

export async function compareAudits(
  body: CompareRequestBody,
  actorKey = "anonymous",
  dbInstance?: CiteGraphDb,
): Promise<CompareResponse> {
  const db = dbInstance || getDb();
  const startTime = new Date();
  const compareRunId = `crun_${crypto.randomUUID()}`;

  // 1. Request Validation
  const targetsInput = body.targets || [];
  if (targetsInput.length < 2 || targetsInput.length > 5) {
    throw new Error("INVALID_COMPARE_TARGETS: 비교 대상은 최소 2개에서 최대 5개까지 지원합니다.");
  }

  const meCount = targetsInput.filter((t) => t.role === "ME").length;
  if (meCount !== 1) {
    throw new Error("INVALID_COMPARE_TARGETS: 비교 대상 중 'ME' 역할은 정확히 1개여야 합니다.");
  }

  if (targetsInput[0].role !== "ME") {
    throw new Error("INVALID_COMPARE_TARGETS: 첫 번째 비교 대상은 'ME' 호스트여야 합니다.");
  }

  // Normalize URLs & check duplicates
  const normalizedTargets: Array<{
    id: string;
    ordinal: number;
    role: "ME" | "COMPETITOR";
    label: string;
    requestedUrl: string;
    normalizedUrl: string;
    fetchUrl: string;
  }> = [];

  const seenUrls = new Set<string>();

  for (let idx = 0; idx < targetsInput.length; idx++) {
    const item = targetsInput[idx];
    if (!item.url || typeof item.url !== "string") {
      throw new Error("INVALID_URL: 비교 대상 URL이 유효하지 않습니다.");
    }

    const norm = await validateAndNormalizeUrl(item.url.trim());
    if (seenUrls.has(norm.normalizedUrl)) {
      throw new Error(`DUPLICATE_TARGET: 동일한 정규화 URL이 중복되었습니다. (${norm.normalizedUrl})`);
    }
    seenUrls.add(norm.normalizedUrl);

    normalizedTargets.push({
      id: `ctarget_${crypto.randomUUID()}`,
      ordinal: idx + 1,
      role: item.role,
      label: item.label || (item.role === "ME" ? "자사 사이트" : `경쟁사 ${idx}`),
      requestedUrl: item.url.trim(),
      normalizedUrl: norm.normalizedUrl,
      fetchUrl: norm.fetchUrl,
    });
  }

  const projectId = body.projectId || "default_project";

  // 2. Initialize DB Compare Run & Targets
  await createCompareRun(db, {
    id: compareRunId,
    actorKey,
    projectId,
    questionSetId: QUESTION_SET_ID,
    questionSetVersion: QUESTION_SET_VERSION,
    platformSetVersion: PLATFORM_SET_VERSION,
    rulesetVersion: RULESET_VERSION,
    engineVersion: ENGINE_VERSION,
    comparisonAlgorithmVersion: COMPARISON_ALGORITHM_VERSION,
    status: "RUNNING",
    targetCount: normalizedTargets.length,
    successCount: 0,
    failureCount: 0,
    startedAt: startTime,
  });

  await createCompareTargets(
    db,
    normalizedTargets.map((t) => ({
      id: t.id,
      compareRunId,
      ordinal: t.ordinal,
      role: t.role,
      label: t.label,
      requestedUrl: t.requestedUrl,
      normalizedUrl: t.normalizedUrl,
      status: "QUEUED" as const,
    })),
  );

  // 3. Sequential Execution
  const targetResults: CompareTargetResult[] = [];
  const snapshots: Array<{ url: string; snapshot: ComparableAuditSnapshot | null }> = [];

  let successCount = 0;
  let failureCount = 0;

  for (const t of normalizedTargets) {
    await updateCompareTargetStatus(db, t.id, { status: "RUNNING" });

    try {
      const audit = await executeAudit(
        { url: t.fetchUrl, actorKey },
        db,
      );

      const snapshot = toComparableAuditSnapshot(audit, t.normalizedUrl);
      snapshots.push({ url: t.normalizedUrl, snapshot });

      await updateCompareTargetStatus(db, t.id, {
        status: "SUCCESS",
        auditRunId: audit.runId,
        auditResultId: audit.auditResultId,
      });

      targetResults.push({
        targetId: t.id,
        ordinal: t.ordinal,
        role: t.role,
        label: t.label,
        displayUrl: t.normalizedUrl,
        status: "SUCCESS",
        auditRunId: audit.runId,
        auditResultId: audit.auditResultId,
        metrics: snapshot.metrics,
        error: null,
      });

      successCount++;
    } catch (err) {
      failureCount++;
      const errorMessage = err instanceof Error ? err.message : "진단 실패";
      const errorCode = errorMessage.startsWith("SSRF_BLOCKED")
        ? "SSRF_BLOCKED"
        : errorMessage.startsWith("HTML_TOO_LARGE")
        ? "HTML_TOO_LARGE"
        : errorMessage.startsWith("UNSUPPORTED_CONTENT_TYPE")
        ? "UNSUPPORTED_CONTENT_TYPE"
        : errorMessage.startsWith("UPSTREAM_TIMEOUT")
        ? "UPSTREAM_TIMEOUT"
        : "UPSTREAM_FETCH_FAILED";

      await updateCompareTargetStatus(db, t.id, {
        status: "ERROR",
        errorCode,
      });

      snapshots.push({ url: t.normalizedUrl, snapshot: null });

      targetResults.push({
        targetId: t.id,
        ordinal: t.ordinal,
        role: t.role,
        label: t.label,
        displayUrl: t.normalizedUrl,
        status: "ERROR",
        auditRunId: null,
        auditResultId: null,
        metrics: null,
        error: {
          code: errorCode,
          message: errorMessage,
          retryable: true,
        },
      });
    }
  }

  // 4. Calculate Run Status
  let runStatus: CompareRunStatus = "COMPLETED";
  if (successCount === normalizedTargets.length) {
    runStatus = "COMPLETED";
  } else if (successCount >= 2 && failureCount >= 1) {
    runStatus = "PARTIAL";
  } else {
    runStatus = "INSUFFICIENT";
  }

  const completedAt = new Date();
  await updateCompareRunStatus(db, compareRunId, {
    status: runStatus,
    successCount,
    failureCount,
    completedAt,
  });

  // 5. Build DTO Summary, Category & Findings Matrix
  const summary = calculateSummary(targetResults);
  const categories = buildCategoryComparisons(snapshots);
  const findingsDiff = buildFindingsComparisons(snapshots);

  return {
    compareRunId,
    status: runStatus,
    context: {
      projectId,
      questionSetId: QUESTION_SET_ID,
      questionSetVersion: QUESTION_SET_VERSION,
      platformSetVersion: PLATFORM_SET_VERSION,
      rulesetVersion: RULESET_VERSION,
      engineVersion: ENGINE_VERSION,
      comparisonAlgorithmVersion: COMPARISON_ALGORITHM_VERSION,
      startedAt: startTime.toISOString(),
      completedAt: completedAt.toISOString(),
    },
    targets: targetResults,
    summary,
    platforms: [],
    questions: [],
    categories,
    findingsDiff,
  };
}
