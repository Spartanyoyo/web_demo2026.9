import { handleRouteError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await requireSession();
    const [products, user] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.user.findUnique({
        where: { id: session.uid },
        select: { balance: true },
      }),
    ]);
    return jsonOk({
      balance: user?.balance ?? 0,
      products,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
