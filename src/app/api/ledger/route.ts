import { handleRouteError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await requireSession();
    const [user, entries] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.uid },
        select: { balance: true },
      }),
      prisma.ledgerEntry.findMany({
        where: { userId: session.uid },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);
    return jsonOk({ balance: user?.balance ?? 0, entries });
  } catch (error) {
    return handleRouteError(error);
  }
}
