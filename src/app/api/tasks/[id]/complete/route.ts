import { DomainError, completeTask } from "@/lib/points";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { requireSession } from "@/lib/session";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    const result = await completeTask(session.uid, id);
    return jsonOk(result);
  } catch (error) {
    if (error instanceof DomainError) {
      return jsonError(error.message, error.status, { code: error.code, ...error.extra });
    }
    return handleRouteError(error);
  }
}
