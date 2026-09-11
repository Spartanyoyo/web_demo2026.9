import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fulfillmentCode } from "@/lib/codes";

export class DomainError extends Error {
  status: number;
  code: string;
  extra?: Record<string, unknown>;

  constructor(message: string, status: number, code: string, extra?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

type LockedUser = { id: string; balance: number; email: string; name: string };

async function lockUser(tx: Prisma.TransactionClient, userId: string): Promise<LockedUser> {
  const rows = await tx.$queryRaw<LockedUser[]>`
    SELECT id, balance, email, name
    FROM "User"
    WHERE id = ${userId}
    FOR UPDATE
  `;
  const user = rows[0];
  if (!user) {
    throw new DomainError("用户不存在", 404, "USER_NOT_FOUND");
  }
  return user;
}

export async function completeTask(userId: string, taskId: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({ where: { id: taskId } });
      if (!task || !task.isActive) {
        throw new DomainError("任务不存在或已下线", 404, "TASK_NOT_FOUND");
      }

      const existing = await tx.taskCompletion.findUnique({
        where: { userId_taskId: { userId, taskId } },
      });
      if (existing) {
        throw new DomainError("该任务奖励已领取，不能重复发放", 409, "TASK_ALREADY_CLAIMED", {
          completionId: existing.id,
          pointsAwarded: existing.pointsAwarded,
        });
      }

      const user = await lockUser(tx, userId);
      const nextBalance = user.balance + task.reward;

      const completion = await tx.taskCompletion.create({
        data: {
          userId,
          taskId,
          pointsAwarded: task.reward,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { balance: nextBalance },
      });

      const ledger = await tx.ledgerEntry.create({
        data: {
          userId,
          direction: "CREDIT",
          amount: task.reward,
          balanceAfter: nextBalance,
          reason: "TASK_REWARD",
          refType: "TaskCompletion",
          refId: completion.id,
          note: `完成任务「${task.title}」`,
        },
      });

      return {
        completionId: completion.id,
        task: { id: task.id, title: task.title, reward: task.reward },
        balance: nextBalance,
        ledgerId: ledger.id,
      };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new DomainError("该任务奖励已领取，不能重复发放", 409, "TASK_ALREADY_CLAIMED");
    }
    throw error;
  }
}

export async function redeemProduct(input: {
  userId: string;
  productId: string;
  idempotencyKey: string;
}) {
  const { userId, productId, idempotencyKey } = input;
  if (!idempotencyKey || idempotencyKey.length < 8) {
    throw new DomainError("缺少有效的幂等键", 400, "INVALID_IDEMPOTENCY_KEY");
  }

  const replay = await prisma.redemption.findUnique({
    where: { userId_idempotencyKey: { userId, idempotencyKey } },
    include: { product: true },
  });
  if (replay) {
    return serializeRedemption(replay, true);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.redemption.findUnique({
        where: { userId_idempotencyKey: { userId, idempotencyKey } },
        include: { product: true },
      });
      if (existing) {
        return { kind: "replay" as const, redemption: existing };
      }

      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product || !product.isActive) {
        throw new DomainError("商品不存在或已下架", 404, "PRODUCT_NOT_FOUND");
      }

      const user = await lockUser(tx, userId);

      if (user.balance < product.cost) {
        const rejected = await tx.redemption.create({
          data: {
            userId,
            productId: product.id,
            idempotencyKey,
            pointsSpent: 0,
            status: "REJECTED",
            failReason: `余额不足：当前 ${user.balance} 分，兑换「${product.title}」需要 ${product.cost} 分`,
          },
          include: { product: true },
        });
        return { kind: "done" as const, redemption: rejected, balance: user.balance };
      }

      const fulfill = fulfillDigitalGood(product.slug, product.kind);
      if (!fulfill.ok) {
        const failed = await tx.redemption.create({
          data: {
            userId,
            productId: product.id,
            idempotencyKey,
            pointsSpent: 0,
            status: "FAILED",
            failReason: fulfill.reason,
          },
          include: { product: true },
        });
        return { kind: "done" as const, redemption: failed, balance: user.balance };
      }

      const nextBalance = user.balance - product.cost;
      const redemption = await tx.redemption.create({
        data: {
          userId,
          productId: product.id,
          idempotencyKey,
          pointsSpent: product.cost,
          status: "SUCCESS",
          fulfillmentCode: fulfill.code,
        },
        include: { product: true },
      });

      await tx.user.update({
        where: { id: userId },
        data: { balance: nextBalance },
      });

      await tx.ledgerEntry.create({
        data: {
          userId,
          direction: "DEBIT",
          amount: product.cost,
          balanceAfter: nextBalance,
          reason: "REDEEM",
          refType: "Redemption",
          refId: redemption.id,
          note: `兑换「${product.title}」`,
        },
      });

      return { kind: "done" as const, redemption, balance: nextBalance };
    });

    return serializeRedemption(result.redemption, result.kind === "replay");
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const again = await prisma.redemption.findUnique({
        where: { userId_idempotencyKey: { userId, idempotencyKey } },
        include: { product: true },
      });
      if (again) return serializeRedemption(again, true);
    }
    throw error;
  }
}

function fulfillDigitalGood(slug: string, kind: string) {
  const forceFail = process.env.FORCE_FULFILLMENT_FAIL === "true";
  if (kind === "flaky" || forceFail) {
    return {
      ok: false as const,
      reason:
        "数字商品发放失败：限量内参通道当前不可用（模拟履约失败）。本次未扣分，可更换幂等键后重试其他商品。",
    };
  }
  return { ok: true as const, code: fulfillmentCode(slug) };
}

function serializeRedemption(
  redemption: {
    id: string;
    status: string;
    pointsSpent: number;
    failReason: string | null;
    fulfillmentCode: string | null;
    idempotencyKey: string;
    createdAt: Date;
    product: { id: string; title: string; cost: number; slug: string };
  },
  replayed: boolean,
) {
  return {
    replayed,
    redemptionId: redemption.id,
    status: redemption.status,
    pointsSpent: redemption.pointsSpent,
    failReason: redemption.failReason,
    fulfillmentCode: redemption.fulfillmentCode,
    idempotencyKey: redemption.idempotencyKey,
    createdAt: redemption.createdAt,
    product: redemption.product,
  };
}
