import { and, desc, eq } from "drizzle-orm";
import type { CiteGraphDb } from "../db";
import { auditV2Results, projects } from "../../db/schema";

export async function listProjects(db: CiteGraphDb, workspaceId: string) {
  return db.query.projects.findMany({
    where: eq(projects.workspaceId, workspaceId),
    orderBy: [desc(projects.createdAt)],
  });
}

export async function getOwnedProject(db: CiteGraphDb, workspaceId: string, projectId: string) {
  return await db.query.projects.findFirst({ where: and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId)) }) || null;
}

export async function createProject(db: CiteGraphDb, workspaceId: string, name: string, domainLabel: string) {
  const project = { id: `prj_${crypto.randomUUID()}`, workspaceId, name, domainLabel, createdAt: new Date() };
  await db.insert(projects).values(project);
  return project;
}

export async function listProjectScans(db: CiteGraphDb, workspaceId: string, projectId: string) {
  return db.query.auditV2Results.findMany({
    where: and(eq(auditV2Results.workspaceId, workspaceId), eq(auditV2Results.projectId, projectId)),
    orderBy: [desc(auditV2Results.createdAt)],
    limit: 20,
  });
}
