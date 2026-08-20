import { and, eq, isNull } from "drizzle-orm";
import type { CiteGraphDb } from "../db";
import { auditV2Results, productEvents } from "../../db/schema";

export type ProductEventName = "AUDIT_V2_COMPLETED" | "V2_EVIDENCE_VIEWED";

export async function persistAuditV2Result(
  db: CiteGraphDb,
  input: typeof auditV2Results.$inferInsert,
) {
  await db.batch([
    db.insert(auditV2Results).values(input),
    db.insert(productEvents).values({
      id: `evt_${crypto.randomUUID()}`,
      eventName: "AUDIT_V2_COMPLETED",
      auditV2ResultId: input.id,
      createdAt: input.createdAt,
    }),
  ]);
  return input;
}

export async function getAuditV2Result(db: CiteGraphDb, workspaceId: string, id: string) {
  return await db.query.auditV2Results.findFirst({ where: and(eq(auditV2Results.id, id), eq(auditV2Results.workspaceId, workspaceId)) }) || null;
}

export async function getAuditV2ResultBySnapshot(db: CiteGraphDb, workspaceId: string, projectId: string | null, snapshotId: string) {
  return await db.query.auditV2Results.findFirst({ where: and(
    eq(auditV2Results.workspaceId, workspaceId),
    projectId ? eq(auditV2Results.projectId, projectId) : isNull(auditV2Results.projectId),
    eq(auditV2Results.snapshotId, snapshotId),
  ) }) || null;
}

export async function recordProductEvent(
  db: CiteGraphDb,
  eventName: ProductEventName,
  workspaceId: string,
  auditV2ResultId: string,
) {
  const result = await getAuditV2Result(db, workspaceId, auditV2ResultId);
  if (!result) return null;
  const event = {
    id: `evt_${crypto.randomUUID()}`,
    eventName,
    auditV2ResultId,
    createdAt: new Date(),
  } as const;
  await db.insert(productEvents).values(event);
  return event;
}

export async function assignAuditV2ToProject(
  db: CiteGraphDb,
  workspaceId: string,
  auditV2ResultId: string,
  projectId: string,
) {
  const result = await getAuditV2Result(db, workspaceId, auditV2ResultId);
  if (!result) return null;
  await db.update(auditV2Results)
    .set({ projectId })
    .where(and(eq(auditV2Results.id, auditV2ResultId), eq(auditV2Results.workspaceId, workspaceId)));
  return { ...result, projectId };
}
