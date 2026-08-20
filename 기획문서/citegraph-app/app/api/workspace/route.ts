import { getDb } from "../../../lib/db";
import { ensureLocalWorkspace } from "../../../lib/workspace";

export async function GET(request: Request) {
  const workspace = await ensureLocalWorkspace(getDb(), request);
  return Response.json(
    { id: workspace.id, kind: "LOCAL_WORKSPACE", isolation: "IDENTIFIER_ONLY" },
    { headers: workspace.setCookie ? { "set-cookie": workspace.setCookie } : undefined },
  );
}
