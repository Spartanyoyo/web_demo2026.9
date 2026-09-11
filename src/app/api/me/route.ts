import { handleRouteError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await requireSession();
    const user = await prisma.user.findUnique({
      where: { id: session.uid },
      select: { id: true, email: true, name: true, balance: true, createdAt: true },
    });
    if (!user) {
      return jsonOk(null, 401);
    }
    const [earned, spent, taskCount, redeemCount] = await Promise.all([
      prisma.ledgerEntry.aggregate({
        where: { userId: user.id, direction: "CREDIT" },
        _sum: { amount: true },
      }),
      prisma.ledgerEntry.aggregate({
        where: { userId: user.id, direction: "DEBIT" },
        _sum: { amount: true },
      }),
      prisma.taskCompletion.count({ where: { userId: user.id } }),
      prisma.redemption.count({ where: { userId: user.id, status: "SUCCESS" } }),
    ]);
    return jsonOk({
      ...user,
      stats: {
        earned: earned._sum.amount ?? 0,
        spent: spent._sum.amount ?? 0,
        tasksCompleted: taskCount,
        goodsRedeemed: redeemCount,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
