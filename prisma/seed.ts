import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("intern123", 10);

  await prisma.ledgerEntry.deleteMany();
  await prisma.redemption.deleteMany();
  await prisma.taskCompletion.deleteMany();
  await prisma.user.deleteMany();
  await prisma.task.deleteMany();
  await prisma.product.deleteMany();

  await prisma.user.createMany({
    data: [
      {
        email: "intern@pointdesk.local",
        name: "林析",
        passwordHash,
        balance: 0,
      },
      {
        email: "analyst@pointdesk.local",
        name: "周衡",
        passwordHash,
        balance: 0,
      },
    ],
  });

  await prisma.task.createMany({
    data: [
      {
        slug: "read-weekly-memo",
        title: "阅读本周投资备忘录",
        description: "完整阅读本周 Deal Memo，并在系统内确认已覆盖投资逻辑、关键风险与回报区间。",
        reward: 30,
        category: "研究",
        sortOrder: 1,
      },
      {
        slug: "three-statement-tie-out",
        title: "完成三表勾稽练习",
        description: "用一份简化财报完成资产负债表、利润表与现金流量表勾稽，提交核对结果。",
        reward: 50,
        category: "建模",
        sortOrder: 2,
      },
      {
        slug: "one-pager-industry",
        title: "提交行业研究一页纸",
        description: "选择一个关注赛道，产出一页纸：市场规模、格局、关键假设与待验证问题。",
        reward: 80,
        category: "研究",
        sortOrder: 3,
      },
      {
        slug: "monday-quiz",
        title: "参加周一晨会测验",
        description: "完成 8 道市场与条款快问快答。用于模拟晨会前的准备纪律。",
        reward: 20,
        category: "训练",
        sortOrder: 4,
      },
      {
        slug: "cim-key-terms",
        title: "复核 CIM 关键条款",
        description: "从模拟 CIM 中摘出估值、对赌、交割条件与重大或有事项，形成条款清单。",
        reward: 60,
        category: "交易",
        sortOrder: 5,
      },
    ],
  });

  await prisma.product.createMany({
    data: [
      {
        slug: "valuation-playbook",
        title: "《并购估值速查手册》",
        description: "数字商品。兑换成功后发放手册提取码，可用于下载虚构 PDF。",
        cost: 40,
        kind: "report",
        sortOrder: 1,
      },
      {
        slug: "lbo-template",
        title: "LBO 模型模板",
        description: "数字商品。兑换后发放模板提取码。不含真实资金或外部存储。",
        cost: 80,
        kind: "template",
        sortOrder: 2,
      },
      {
        slug: "tombstone-badge",
        title: "模拟项目 Tombstone 徽章",
        description: "数字收藏品。兑换后获得一枚不可转让的虚拟墓碑编号。",
        cost: 25,
        kind: "badge",
        sortOrder: 3,
      },
      {
        slug: "partner-office-hour",
        title: "合伙人 Office Hour 预约码",
        description: "数字预约凭证。成功兑换后生成 30 分钟模拟预约码。",
        cost: 120,
        kind: "booking",
        sortOrder: 4,
      },
      {
        slug: "limited-alpha-note",
        title: "限量内参（发放通道不稳定）",
        description:
          "用于验收「发放失败」路径：该商品在履约环节会失败，积分不得扣除，结果需明确说明。",
        cost: 15,
        kind: "flaky",
        sortOrder: 5,
      },
    ],
  });

  console.log("Seeded PointDesk catalog and demo users.");
  console.log("  intern@pointdesk.local / intern123");
  console.log("  analyst@pointdesk.local / intern123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
