import { compareAudits } from "../../../lib/services/compare-service";
import type { CompareRequestBody } from "../../../lib/compare/contracts";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CompareRequestBody;
    if (!body || !Array.isArray(body.targets) || body.targets.length < 2) {
      return Response.json(
        {
          error: "INVALID_COMPARE_TARGETS",
          message: "비교 대상을 2개 이상 5개 이하로 입력해 주세요.",
        },
        { status: 400 },
      );
    }

    const result = await compareAudits(body);
    const statusCode = result.status === "COMPLETED" || result.status === "PARTIAL" ? 200 : 200; // Returns 200 with status info

    return Response.json(result, { status: statusCode });
  } catch (err) {
    const message = err instanceof Error ? err.message : "비교 분석 중 오류가 발생했습니다.";

    if (message.startsWith("INVALID_COMPARE_TARGETS") || message.startsWith("DUPLICATE_TARGET") || message.startsWith("INVALID_URL")) {
      return Response.json({ error: "BAD_REQUEST", message }, { status: 400 });
    }

    return Response.json(
      { error: "COMPARE_FAILED", message },
      { status: 500 },
    );
  }
}
