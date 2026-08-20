import { getDb } from "../../../lib/db";
import { createProject, listProjects } from "../../../lib/repositories/project-repository";
import { ensureLocalWorkspace, normalizeDomainLabel } from "../../../lib/workspace";

export async function GET(request: Request) {
  const db = getDb();
  const workspace = await ensureLocalWorkspace(db, request);
  const items = await listProjects(db, workspace.id);
  return Response.json({ items }, { headers: workspace.setCookie ? { "set-cookie": workspace.setCookie } : undefined });
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const workspace = await ensureLocalWorkspace(db, request);
    const body = await request.json() as { name?: unknown; domain?: unknown };
    if (typeof body.name !== "string" || !body.name.trim() || body.name.length > 80 || typeof body.domain !== "string" || body.domain.length > 253) {
      return Response.json({ error: "INVALID_PROJECT" }, { status: 400 });
    }
    const item = await createProject(db, workspace.id, body.name.trim(), normalizeDomainLabel(body.domain));
    return Response.json({ item }, { status: 201, headers: workspace.setCookie ? { "set-cookie": workspace.setCookie } : undefined });
  } catch (error) {
    const message = error instanceof Error ? error.message : "INVALID_PROJECT";
    return Response.json({ error: message.includes("UNIQUE") ? "DOMAIN_ALREADY_REGISTERED" : "INVALID_PROJECT" }, { status: 400 });
  }
}
