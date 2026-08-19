import { getDb } from "../../../../lib/db";
import { getCompareRunById } from "../../../../lib/repositories/compare-repository";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const run = await getCompareRunById(getDb(), params.id);

    if (!run) {
      return Response.json(
        { error: "NOT_FOUND", message: "비교 실행 이력을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return Response.json(run);
  } catch (err) {
    return Response.json(
      {
        error: "INTERNAL_ERROR",
        message: err instanceof Error ? err.message : "비교 결과를 조회하지 못했습니다.",
      },
      { status: 500 },
    );
  }
}
