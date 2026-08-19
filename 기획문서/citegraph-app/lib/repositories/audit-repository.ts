import { and, desc, eq, lt, or } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import type { CiteGraphDb } from "../db";
import {
  auditEvidence,
  auditFindings,
  auditResults,
  auditRuns,
  auditScores,
} from "../../db/schema";

export interface CacheKeyQuery {
  normalizedUrl: string;
  rulesetVersion: string;
  engineVersion: string;
  inputHash: string;
}

export interface PersistenceResultInput {
  result: typeof auditResults.$inferInsert;
  scores: Array<typeof auditScores.$inferInsert>;
  findings: Array<typeof auditFindings.$inferInsert>;
  evidences: Array<typeof auditEvidence.$inferInsert>;
  run: typeof auditRuns.$inferInsert;
}

export interface SaveRunInput {
  auditResultId?: string | null;
  requestedUrl: string;
  actorKey?: string | null;
  status: "SUCCESS" | "FAILED";
  cacheHit: boolean;
  errorCode?: string | null;
  errorMessage?: string | null;
  durationMs: number;
  requestedAt: Date;
}

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  if (items.length === 0) return [];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

export function encodeCursor(requestedAt: Date, id: string): string {
  const payload = `${requestedAt.getTime()}:${id}`;
  return Buffer.from(payload, "utf-8").toString("base64url");
}

export function decodeCursor(cursor: string): { requestedAt: Date; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 2) return null;
    const ts = Number(parts[0]);
    if (isNaN(ts)) return null;
    return { requestedAt: new Date(ts), id: parts[1] };
  } catch {
    return null;
  }
}

export async function findCachedResult(
  db: CiteGraphDb,
  query: CacheKeyQuery,
) {
  const result = await db.query.auditResults.findFirst({
    where: and(
      eq(auditResults.normalizedUrl, query.normalizedUrl),
      eq(auditResults.rulesetVersion, query.rulesetVersion),
      eq(auditResults.engineVersion, query.engineVersion),
      eq(auditResults.inputHash, query.inputHash),
    ),
    with: {
      scores: true,
      findings: {
        with: {
          evidences: true,
        },
      },
    },
  });

  return result || null;
}

export async function getAuditResultById(
  db: CiteGraphDb,
  id: string,
) {
  const result = await db.query.auditResults.findFirst({
    where: eq(auditResults.id, id),
    with: {
      scores: true,
      findings: {
        with: {
          evidences: true,
        },
      },
    },
  });

  return result || null;
}

export async function persistNewResultAndRun(
  db: CiteGraphDb,
  model: PersistenceResultInput,
) {
  // D1 90-parameter limit chunks:
  // auditScores: 6 columns -> 15 rows/chunk
  // auditFindings: 15 columns -> 5 rows/chunk (75 params)
  // auditEvidence: 5 columns -> 18 rows/chunk
  const scoreChunks = chunkArray(model.scores, 15);
  const findingChunks = chunkArray(model.findings, 5);
  const evidenceChunks = chunkArray(model.evidences, 18);

  const batchStatements: [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]] = [
    db.insert(auditResults).values(model.result),
    ...scoreChunks.map((chunk) => db.insert(auditScores).values(chunk)),
    ...findingChunks.map((chunk) => db.insert(auditFindings).values(chunk)),
    ...evidenceChunks.map((chunk) => db.insert(auditEvidence).values(chunk)),
    db.insert(auditRuns).values(model.run),
  ];

  await db.batch(batchStatements);
  return model.result;
}

export async function saveRun(
  db: CiteGraphDb,
  input: SaveRunInput,
) {
  const runRecord = {
    id: `run_${crypto.randomUUID()}`,
    auditResultId: input.auditResultId || null,
    requestedUrl: input.requestedUrl,
    actorKey: input.actorKey || null,
    status: input.status,
    cacheHit: input.cacheHit,
    errorCode: input.errorCode || null,
    errorMessage: input.errorMessage || null,
    durationMs: input.durationMs,
    requestedAt: input.requestedAt,
  };

  await db.insert(auditRuns).values(runRecord);
  return runRecord;
}

export async function getHistory(
  db: CiteGraphDb,
  options: {
    actorKey?: string;
    limit?: number;
    cursor?: string;
  },
) {
  const limit = Math.min(Math.max(options.limit || 20, 1), 50);
  const parsedCursor = options.cursor ? decodeCursor(options.cursor) : null;

  const conditions = [];

  if (options.actorKey) {
    conditions.push(eq(auditRuns.actorKey, options.actorKey));
  }

  if (parsedCursor) {
    conditions.push(
      or(
        lt(auditRuns.requestedAt, parsedCursor.requestedAt),
        and(
          eq(auditRuns.requestedAt, parsedCursor.requestedAt),
          lt(auditRuns.id, parsedCursor.id),
        ),
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const items = await db.query.auditRuns.findMany({
    where: whereClause,
    orderBy: [desc(auditRuns.requestedAt), desc(auditRuns.id)],
    limit: limit + 1,
  });

  let nextCursor: string | null = null;
  if (items.length > limit) {
    const nextItem = items.pop()!;
    nextCursor = encodeCursor(nextItem.requestedAt, nextItem.id);
  }

  return {
    items,
    nextCursor,
  };
}
