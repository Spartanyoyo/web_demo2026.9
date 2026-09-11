import { handleRouteError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await requireSession();
    const [tasks, completions] = await Promise.all([
      prisma.task.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.taskCompletion.findMany({
        where: { userId: session.uid },
        select: { taskId: true, createdAt: true, pointsAwarded: true },
      }),
    ]);
    const claimed = new Map(completions.map((c) => [c.taskId, c]));
    return jsonOk(
      tasks.map((task) => ({
        ...task,
        claimed: claimed.has(task.id),
        claimedAt: claimed.get(task.id)?.createdAt ?? null,
      })),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
