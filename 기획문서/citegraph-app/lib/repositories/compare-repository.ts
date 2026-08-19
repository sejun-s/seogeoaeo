import { and, desc, eq, lt, or } from "drizzle-orm";
import type { CiteGraphDb } from "../db";
import { compareRuns, compareTargets } from "../../db/schema";
import { decodeCursor, encodeCursor } from "./audit-repository";

export interface CreateCompareRunInput {
  id: string;
  actorKey?: string | null;
  projectId: string;
  questionSetId: string;
  questionSetVersion: string;
  platformSetVersion: string;
  rulesetVersion: string;
  engineVersion: string;
  comparisonAlgorithmVersion: string;
  status: typeof compareRuns.$inferInsert["status"];
  targetCount: number;
  successCount: number;
  failureCount: number;
  startedAt: Date;
}

export interface CreateCompareTargetInput {
  id: string;
  compareRunId: string;
  ordinal: number;
  role: "ME" | "COMPETITOR";
  label?: string | null;
  requestedUrl: string;
  normalizedUrl: string;
  status: typeof compareTargets.$inferInsert["status"];
}

export async function createCompareRun(
  db: CiteGraphDb,
  input: CreateCompareRunInput,
) {
  await db.insert(compareRuns).values(input);
  return input;
}

export async function createCompareTargets(
  db: CiteGraphDb,
  targets: CreateCompareTargetInput[],
) {
  if (targets.length > 0) {
    await db.insert(compareTargets).values(targets);
  }
}

export async function updateCompareTargetStatus(
  db: CiteGraphDb,
  targetId: string,
  updates: {
    status: typeof compareTargets.$inferInsert["status"];
    auditRunId?: string | null;
    auditResultId?: string | null;
    errorCode?: string | null;
  },
) {
  await db
    .update(compareTargets)
    .set(updates)
    .where(eq(compareTargets.id, targetId));
}

export async function updateCompareRunStatus(
  db: CiteGraphDb,
  runId: string,
  updates: {
    status: typeof compareRuns.$inferInsert["status"];
    successCount: number;
    failureCount: number;
    completedAt: Date;
  },
) {
  await db
    .update(compareRuns)
    .set(updates)
    .where(eq(compareRuns.id, runId));
}

export async function getCompareRunById(
  db: CiteGraphDb,
  runId: string,
) {
  const result = await db.query.compareRuns.findFirst({
    where: eq(compareRuns.id, runId),
    with: {
      targets: {
        orderBy: (t, { asc }) => [asc(t.ordinal)],
        with: {
          auditRun: true,
          auditResult: {
            with: {
              scores: true,
              findings: {
                with: {
                  evidences: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return result || null;
}

export async function getCompareHistory(
  db: CiteGraphDb,
  options: {
    actorKey?: string;
    projectId?: string;
    limit?: number;
    cursor?: string;
  },
) {
  const limit = Math.min(Math.max(options.limit || 20, 1), 50);
  const parsedCursor = options.cursor ? decodeCursor(options.cursor) : null;

  const conditions = [];

  if (options.actorKey) {
    conditions.push(eq(compareRuns.actorKey, options.actorKey));
  }
  if (options.projectId) {
    conditions.push(eq(compareRuns.projectId, options.projectId));
  }

  if (parsedCursor) {
    conditions.push(
      or(
        lt(compareRuns.startedAt, parsedCursor.requestedAt),
        and(
          eq(compareRuns.startedAt, parsedCursor.requestedAt),
          lt(compareRuns.id, parsedCursor.id),
        ),
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const items = await db.query.compareRuns.findMany({
    where: whereClause,
    orderBy: [desc(compareRuns.startedAt), desc(compareRuns.id)],
    limit: limit + 1,
    with: {
      targets: {
        orderBy: (t, { asc }) => [asc(t.ordinal)],
      },
    },
  });

  let nextCursor: string | null = null;
  if (items.length > limit) {
    const nextItem = items.pop()!;
    nextCursor = encodeCursor(nextItem.startedAt, nextItem.id);
  }

  return {
    items,
    nextCursor,
  };
}
