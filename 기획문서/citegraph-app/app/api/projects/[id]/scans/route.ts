import { getDb } from "../../../../../lib/db";
import { getOwnedProject, listProjectScans } from "../../../../../lib/repositories/project-repository";
import { readWorkspaceId } from "../../../../../lib/workspace";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const workspaceId = readWorkspaceId(request);
  if (!workspaceId) return Response.json({ error: "WORKSPACE_REQUIRED" }, { status: 401 });
  const { id } = await context.params;
  const db = getDb();
  if (!await getOwnedProject(db, workspaceId, id)) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  const scans = await listProjectScans(db, workspaceId, id);
  return Response.json({
    items: scans.map((scan) => {
      let seoScore: number | null = null;
      let geoFactScore: number | null = null;
      try {
        const parsed = JSON.parse(scan.resultJson) as {
          seoFact?: { score?: number | null };
          geoFact?: { score?: number | null };
        };
        seoScore = parsed.seoFact?.score ?? null;
        geoFactScore = parsed.geoFact?.score ?? null;
      } catch {
        // ignore parse error
      }
      return {
        id: scan.id,
        finalUrl: scan.finalUrl,
        createdAt: scan.createdAt,
        methodologyVersion: scan.methodologyVersion,
        seoScore,
        geoFactScore,
      };
    }),
  });
}
