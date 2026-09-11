import { z } from "zod";
import { DomainError, redeemProduct } from "@/lib/points";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const schema = z.object({
  productId: z.string().min(1),
  idempotencyKey: z.string().min(8).max(80),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = schema.parse(await request.json());
    const result = await redeemProduct({
      userId: session.uid,
      productId: body.productId,
      idempotencyKey: body.idempotencyKey,
    });
    const user = await prisma.user.findUnique({
      where: { id: session.uid },
      select: { balance: true },
    });
    return jsonOk({ ...result, balance: user?.balance ?? 0 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "参数不合法", 400);
    }
    if (error instanceof DomainError) {
      return jsonError(error.message, error.status, { code: error.code, ...error.extra });
    }
    return handleRouteError(error);
  }
}
