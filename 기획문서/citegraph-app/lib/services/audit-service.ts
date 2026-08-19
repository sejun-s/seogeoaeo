import type { CiteGraphDb } from "../db";
import { getDb } from "../db";
import { fetchAuditDocument, validateAndNormalizeUrl } from "../audit/guard";
import { calculateInputHash, sha256Hex } from "../audit/hash";
import { evaluateAuditRules } from "../audit";
import {
  findCachedResult,
  getAuditResultById,
  persistNewResultAndRun,
  saveRun,
} from "../repositories/audit-repository";
import type {
  auditEvidence,
  auditFindings,
  auditResults,
  auditRuns,
  auditScores,
} from "../../db/schema";

export const RULESET_VERSION = "2026.08.1";
export const ENGINE_VERSION = "v1.0.0";

export interface ExecuteAuditParams {
  url: string;
  actorKey?: string | null;
}

export interface AuditDto {
  runId: string;
  auditResultId: string;
  cacheHit: boolean;
  finalUrl: string;
  rulesetVersion: string;
  engineVersion: string;
  extracted: {
    title: string;
    metaDescription: string;
    h1: string[];
    canonical: string;
    robots: string;
    schemaTypes: string[];
    lang: string;
  };
  scores: {
    seo: {
      score: number;
      categories: Array<{
        name: string;
        score: number;
        maxScore: number;
      }>;
    };
    geoReadiness: {
      score: number;
      categories: Array<{
        name: string;
        score: number;
        maxScore: number;
      }>;
    };
  };
  findings: Array<{
    id: string;
    ruleId: string;
    scoreType: "SEO" | "GEO";
    category: string;
    title: string;
    description: string;
    weight: number;
    result: "PASS" | "WARN" | "FAIL";
    recommendation: string;
    evidence: Array<{
      id: string;
      evidenceCode: string;
      field: string;
      excerpt: string;
    }>;
  }>;
}

type DbAuditResultRecord = typeof auditResults.$inferSelect & {
  scores?: Array<typeof auditScores.$inferSelect>;
  findings?: Array<
    typeof auditFindings.$inferSelect & {
      evidences?: Array<typeof auditEvidence.$inferSelect>;
    }
  >;
};

function truncateJsonIfNeeded(data: unknown, maxBytes = 512 * 1024): { jsonString: string; truncated: boolean; bytes: number } {
  let str = JSON.stringify(data);
  let bytes = new TextEncoder().encode(str).length;

  if (bytes <= maxBytes) {
    return { jsonString: str, truncated: false, bytes };
  }

  // Cap extracted fields
  const copy = JSON.parse(JSON.stringify(data)) as Record<string, unknown>;
  if (Array.isArray(copy.h1)) copy.h1 = copy.h1.slice(0, 5);
  if (Array.isArray(copy.schemaTypes)) copy.schemaTypes = copy.schemaTypes.slice(0, 10);

  str = JSON.stringify(copy);
  bytes = new TextEncoder().encode(str).length;

  return { jsonString: str, truncated: true, bytes };
}

export function formatResultDto(
  result: DbAuditResultRecord | Record<string, unknown>,
  runId: string,
  cacheHit: boolean,
): AuditDto {
  const record = result as DbAuditResultRecord;

  let extracted: AuditDto["extracted"] = {
    title: "",
    metaDescription: "",
    h1: [],
    canonical: "",
    robots: "",
    schemaTypes: [],
    lang: "",
  };

  if (typeof record.extractedJson === "string") {
    try {
      extracted = JSON.parse(record.extractedJson);
    } catch {
      // fallback
    }
  }

  const scoresList = record.scores || [];
  const seoScores = scoresList.filter((s) => s.scoreType === "SEO");
  const geoScores = scoresList.filter((s) => s.scoreType === "GEO");

  const findingsList = record.findings || [];

  return {
    runId,
    auditResultId: record.id,
    cacheHit,
    finalUrl: record.finalUrl,
    rulesetVersion: record.rulesetVersion,
    engineVersion: record.engineVersion || ENGINE_VERSION,
    extracted,
    scores: {
      seo: {
        score: record.seoScore,
        categories: seoScores.map((s) => ({
          name: s.categoryName,
          score: s.score,
          maxScore: s.maxScore,
        })),
      },
      geoReadiness: {
        score: record.geoScore,
        categories: geoScores.map((s) => ({
          name: s.categoryName,
          score: s.score,
          maxScore: s.maxScore,
        })),
      },
    },
    findings: findingsList.map((f) => ({
      id: f.id,
      ruleId: f.ruleId || f.id,
      scoreType: f.scoreType as "SEO" | "GEO",
      category: f.category,
      title: f.title,
      description: f.description,
      weight: f.weight,
      result: f.result as "PASS" | "WARN" | "FAIL",
      recommendation: f.recommendation,
      evidence: (f.evidences || []).map((e) => ({
        id: e.id,
        evidenceCode: e.evidenceCode || e.id,
        field: e.field,
        excerpt: e.excerpt,
      })),
    })),
  };
}

export async function executeAudit(
  params: ExecuteAuditParams,
  dbInstance?: CiteGraphDb,
): Promise<AuditDto> {
  const startTime = Date.now();
  const db = dbInstance || getDb();

  // 1. Validate & Normalize URL
  const normalizedInfo = await validateAndNormalizeUrl(params.url);

  // 2. Fetch Document (catch fetch errors & log failed run)
  let doc: Awaited<ReturnType<typeof fetchAuditDocument>>;
  try {
    doc = await fetchAuditDocument(normalizedInfo.fetchUrl);
  } catch (err) {
    const elapsed = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : "페이지 수집 실패";
    const errorCode = errorMessage.startsWith("SSRF_BLOCKED")
      ? "SSRF_BLOCKED"
      : errorMessage.startsWith("HTML_TOO_LARGE")
      ? "HTML_TOO_LARGE"
      : errorMessage.startsWith("UNSUPPORTED_CONTENT_TYPE")
      ? "UNSUPPORTED_CONTENT_TYPE"
      : errorMessage.startsWith("UPSTREAM_TIMEOUT")
      ? "UPSTREAM_TIMEOUT"
      : "UPSTREAM_FETCH_FAILED";

    await saveRun(db, {
      auditResultId: null,
      requestedUrl: normalizedInfo.normalizedUrl,
      actorKey: params.actorKey,
      status: "FAILED",
      cacheHit: false,
      errorCode,
      errorMessage,
      durationMs: elapsed,
      requestedAt: new Date(startTime),
    });

    throw err;
  }

  // 3. Hashes
  const htmlHash = await sha256Hex(doc.html);
  const inputHash = await calculateInputHash({
    normalizedUrl: doc.normalizedUrl,
    finalUrl: doc.finalUrl,
    httpStatus: doc.httpStatus,
    htmlHash,
    headers: {
      contentType: doc.contentType,
      xRobotsTag: doc.xRobotsTag,
    },
  });

  const cacheKey = {
    normalizedUrl: doc.normalizedUrl,
    rulesetVersion: RULESET_VERSION,
    engineVersion: ENGINE_VERSION,
    inputHash,
  };

  // 4. DB Cache Lookup
  const cached = await findCachedResult(db, cacheKey);
  if (cached) {
    const run = await saveRun(db, {
      auditResultId: cached.id,
      requestedUrl: doc.normalizedUrl,
      actorKey: params.actorKey,
      status: "SUCCESS",
      cacheHit: true,
      durationMs: Date.now() - startTime,
      requestedAt: new Date(startTime),
    });

    return formatResultDto(cached, run.id, true);
  }

  // 5. Evaluate Rules (Cache MISS)
  const evalStart = Date.now();
  const evalResult = evaluateAuditRules({
    html: doc.html,
    finalUrl: doc.finalUrl,
    xRobots: doc.xRobotsTag,
  });
  const evalDurationMs = Date.now() - evalStart;

  // 6. Data truncation & Model preparation
  const auditResultId = `res_${crypto.randomUUID()}`;
  const runId = `run_${crypto.randomUUID()}`;

  const { jsonString, truncated, bytes } = truncateJsonIfNeeded(evalResult.extracted);

  const resultRow: typeof auditResults.$inferInsert = {
    id: auditResultId,
    normalizedUrl: doc.normalizedUrl,
    finalUrl: doc.finalUrl,
    rulesetVersion: RULESET_VERSION,
    engineVersion: ENGINE_VERSION,
    htmlHash,
    inputHash,
    status: "SUCCESS",
    httpStatus: doc.httpStatus,
    evaluationDurationMs: evalDurationMs,
    seoScore: evalResult.scores.seo.score,
    geoScore: evalResult.scores.geoReadiness.score,

    extractedJson: jsonString,
    extractedTruncated: truncated,
    extractedBytes: bytes,
    createdAt: new Date(),
  };

  const scoreRows: Array<typeof auditScores.$inferInsert> = [];
  for (const cat of evalResult.scores.seo.categories) {
    scoreRows.push({
      id: `score_${crypto.randomUUID()}`,
      auditResultId,
      scoreType: "SEO",
      categoryName: cat.name,
      score: cat.score,
      maxScore: cat.maxScore,
    });
  }
  for (const cat of evalResult.scores.geoReadiness.categories) {
    scoreRows.push({
      id: `score_${crypto.randomUUID()}`,
      auditResultId,
      scoreType: "GEO",
      categoryName: cat.name,
      score: cat.score,
      maxScore: cat.maxScore,
    });
  }

  const findingRows: Array<typeof auditFindings.$inferInsert> = [];
  const evidenceRows: Array<typeof auditEvidence.$inferInsert> = [];

  for (const rule of evalResult.findings) {
    const findingId = `find_${crypto.randomUUID()}`;
    findingRows.push({
      id: findingId,
      auditResultId,
      ruleId: rule.id,
      scoreType: rule.scoreType,
      category: rule.category,
      title: rule.title,
      description: rule.description,
      weight: rule.weight,
      result: rule.result,
      recommendation: rule.recommendation,
    });

    for (const ev of rule.evidence) {
      evidenceRows.push({
        id: `ev_${crypto.randomUUID()}`,
        findingId,
        evidenceCode: ev.id,
        field: ev.field,
        excerpt: ev.excerpt.slice(0, 2000),
      });
    }
  }

  const runRow: typeof auditRuns.$inferInsert = {
    id: runId,
    auditResultId,
    requestedUrl: doc.normalizedUrl,
    actorKey: params.actorKey || null,
    status: "SUCCESS",
    cacheHit: false,
    errorCode: null,
    errorMessage: null,
    durationMs: Date.now() - startTime,
    requestedAt: new Date(startTime),
  };

  // 7. Atomic Persistence (Handling Race Conditions)
  try {
    await persistNewResultAndRun(db, {
      result: resultRow,
      scores: scoreRows,
      findings: findingRows,
      evidences: evidenceRows,
      run: runRow,
    });
  } catch (err) {
    // Unique constraint race condition check
    const winner = await findCachedResult(db, cacheKey);
    if (!winner) {
      throw new Error(`AUDIT_PERSISTENCE_FAILED: DB 저장에 실패했습니다. (${err instanceof Error ? err.message : ""})`);
    }

    const winnerRun = await saveRun(db, {
      auditResultId: winner.id,
      requestedUrl: doc.normalizedUrl,
      actorKey: params.actorKey,
      status: "SUCCESS",
      cacheHit: true,
      durationMs: Date.now() - startTime,
      requestedAt: new Date(startTime),
    });

    return formatResultDto(winner, winnerRun.id, true);
  }

  const fresh = await getAuditResultById(db, auditResultId);
  return formatResultDto(fresh || resultRow, runId, false);
}
