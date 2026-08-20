import { getDb } from "../../../lib/db";
import { recordProductEvent } from "../../../lib/repositories/audit-v2-repository";
import { readWorkspaceId } from "../../../lib/workspace";

export async function POST(request: Request) {
  const workspaceId = readWorkspaceId(request);
  if (!workspaceId) return Response.json({ error: "WORKSPACE_REQUIRED" }, { status: 401 });
  const body = await request.json() as { eventName?: unknown; auditV2ResultId?: unknown };
  if (body.eventName !== "V2_EVIDENCE_VIEWED" || typeof body.auditV2ResultId !== "string") {
    return Response.json({ error: "INVALID_EVENT" }, { status: 400 });
  }
  const event = await recordProductEvent(getDb(), body.eventName, workspaceId, body.auditV2ResultId);
  if (!event) return Response.json({ error: "RESULT_NOT_FOUND" }, { status: 404 });
  return Response.json({ accepted: true }, { status: 202 });
}
