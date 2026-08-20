import { executeAudit } from "../../../lib/services/audit-service";
import { executeAuditV2 } from "../../../lib/services/audit-v2-service";
import { getDb } from "../../../lib/db";
import { getOwnedProject } from "../../../lib/repositories/project-repository";
import { ensureLocalWorkspace } from "../../../lib/workspace";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: unknown; projectId?: unknown };
    if (typeof body.url !== "string" || !body.url.trim() || body.url.length > 2048) {
      return Response.json(
        { error: "INVALID_URL", message: "분석할 URL을 올바르게 입력해 주세요." },
        { status: 400 },
      );
    }

    const engine = new URL(request.url).searchParams.get("engine");
    if (engine !== null && engine !== "v2") {
      return Response.json(
        { error: "INVALID_ENGINE", message: "지원하는 engine 값은 v2뿐입니다." },
        { status: 400 },
      );
    }
    if (engine === "v2") {
      const db = getDb();
      const workspace = await ensureLocalWorkspace(db, request);
      const projectId = typeof body.projectId === "string" ? body.projectId : null;
      if (projectId && !await getOwnedProject(db, workspace.id, projectId)) {
        return Response.json({ error: "PROJECT_NOT_FOUND" }, { status: 404 });
      }
      return Response.json(await executeAuditV2(body.url.trim(), workspace.id, projectId), {
        status: 200,
        headers: workspace.setCookie ? { "set-cookie": workspace.setCookie } : undefined,
      });
    }

    const result = await executeAudit({ url: body.url.trim() });
    const status = result.cacheHit ? 200 : 201;

    return Response.json(result, { status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "분석 중 오류가 발생했습니다.";

    if (message.startsWith("INVALID_URL")) {
      return Response.json({ error: "INVALID_URL", message }, { status: 400 });
    }
    if (message.startsWith("SSRF_BLOCKED")) {
      return Response.json({ error: "SSRF_BLOCKED", message }, { status: 403 });
    }
    if (message.startsWith("HTML_TOO_LARGE")) {
      return Response.json({ error: "HTML_TOO_LARGE", message }, { status: 413 });
    }
    if (message.startsWith("UNSUPPORTED_CONTENT_TYPE")) {
      return Response.json({ error: "UNSUPPORTED_CONTENT_TYPE", message }, { status: 415 });
    }
    if (message.startsWith("UPSTREAM_TIMEOUT")) {
      return Response.json({ error: "UPSTREAM_TIMEOUT", message }, { status: 504 });
    }
    if (message.startsWith("UPSTREAM_FETCH_FAILED")) {
      return Response.json({ error: "UPSTREAM_FETCH_FAILED", message }, { status: 502 });
    }

    return Response.json(
      { error: "AUDIT_PERSISTENCE_FAILED", message },
      { status: 500 },
    );
  }
}
