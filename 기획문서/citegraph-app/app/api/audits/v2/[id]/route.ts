import { readAuditV2 } from "../../../../../lib/services/audit-v2-service";
import { readWorkspaceId } from "../../../../../lib/workspace";
import { getDb } from "../../../../../lib/db";
import { assignAuditV2ToProject } from "../../../../../lib/repositories/audit-v2-repository";
import { getOwnedProject } from "../../../../../lib/repositories/project-repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const workspaceId = readWorkspaceId(request);
  if (!workspaceId) return Response.json({ error: "WORKSPACE_REQUIRED" }, { status: 401 });
  const { id } = await context.params;
  if (!/^v2_[0-9a-f-]{36}$/i.test(id)) {
    return Response.json({ error: "INVALID_RESULT_ID" }, { status: 400 });
  }
  const result = await readAuditV2(workspaceId, id);
  if (!result) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  return Response.json(result, { status: 200 });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const workspaceId = readWorkspaceId(request);
  if (!workspaceId) return Response.json({ error: "WORKSPACE_REQUIRED" }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json() as { projectId?: unknown };
  if (typeof body.projectId !== "string") return Response.json({ error: "INVALID_PROJECT" }, { status: 400 });
  const db = getDb();
  if (!await getOwnedProject(db, workspaceId, body.projectId)) return Response.json({ error: "PROJECT_NOT_FOUND" }, { status: 404 });
  try {
    const result = await assignAuditV2ToProject(db, workspaceId, id, body.projectId);
    if (!result) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    return Response.json({ saved: true, projectId: body.projectId });
  } catch {
    return Response.json({ error: "SCAN_ALREADY_SAVED" }, { status: 409 });
  }
}
