import { getDb } from "../../../../lib/db";
import { getAuditResultById } from "../../../../lib/repositories/audit-repository";
import { formatResultDto } from "../../../../lib/services/audit-service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const result = await getAuditResultById(getDb(), params.id);

    if (!result) {
      return Response.json(
        { error: "NOT_FOUND", message: "진단 결과를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const dto = formatResultDto(result, "", false);
    return Response.json(dto);
  } catch (err) {
    return Response.json(
      {
        error: "INTERNAL_ERROR",
        message: err instanceof Error ? err.message : "결과를 조회하지 못했습니다.",
      },
      { status: 500 },
    );
  }
}
