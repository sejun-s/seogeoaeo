import { getDb } from "../../../lib/db";
import { getHistory } from "../../../lib/repositories/audit-repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limitParam = Number(url.searchParams.get("limit") || 20);
    const cursor = url.searchParams.get("cursor") || undefined;

    const history = await getHistory(getDb(), {
      limit: limitParam,
      cursor,
    });

    return Response.json(history, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return Response.json(
      {
        error: "INTERNAL_ERROR",
        message: err instanceof Error ? err.message : "이력을 조회하지 못했습니다.",
      },
      { status: 500 },
    );
  }
}
