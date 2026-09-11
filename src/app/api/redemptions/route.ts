import { handleRouteError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await requireSession();
    const rows = await prisma.redemption.findMany({
      where: { userId: session.uid },
      include: { product: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return jsonOk(rows);
  } catch (error) {
    return handleRouteError(error);
  }
}
