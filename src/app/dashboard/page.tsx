"use client";

import { AppShell } from "@/components/AppShell";
import { PageIntro } from "@/components/anim/PageIntro";
import { Reveal } from "@/components/anim/Reveal";
import { Stagger } from "@/components/anim/Stagger";
import { CountUp } from "@/components/anim/CountUp";
import Link from "next/link";
import { useEffect, useState } from "react";

type Me = {
  name: string;
  email: string;
  balance: number;
  stats: { earned: number; spent: number; tasksCompleted: number; goodsRedeemed: number };
};

export default function DashboardPage() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((payload) => payload.ok && setMe(payload.data));
  }, []);

  return (
    <AppShell>
      <PageIntro
        kicker="OVERVIEW"
        title={me ? `${me.name} 的工作台` : "工作台"}
        sub="先完成任务入账，再兑换数字商品。账本是余额的唯一事实来源。"
      />

      <Stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" deps={[me]} each={0.09}>
        <Stat label="当前余额" value={me?.balance} suffix=" 分" highlight />
        <Stat label="累计入账" value={me?.stats.earned} suffix=" 分" />
        <Stat label="累计兑出" value={me?.stats.spent} suffix=" 分" />
        <Stat
          label="任务 / 成功兑换"
          dual={me ? [me.stats.tasksCompleted, me.stats.goodsRedeemed] : null}
        />
      </Stagger>

      <Reveal className="mt-8 grid gap-4 md:grid-cols-2" delay={0.15}>
        <Link
          href="/tasks"
          className="panel panel-hover group flex flex-col self-stretch rounded-sm p-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl">领取任务积分</h2>
            <span className="text-[#cbb98a] transition-transform duration-300 group-hover:translate-x-1.5 group-hover:text-[#8a6a2f]">
              →
            </span>
          </div>
          <p className="mt-2 flex-1 text-sm leading-6 text-[#6b6458]">
            每项任务仅可领取一次。重复提交会被唯一约束拒绝，不会加分。
          </p>
        </Link>
        <Link
          href="/shop"
          className="panel panel-hover group flex flex-col self-stretch rounded-sm p-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl">兑换数字商品</h2>
            <span className="text-[#cbb98a] transition-transform duration-300 group-hover:translate-x-1.5 group-hover:text-[#8a6a2f]">
              →
            </span>
          </div>
          <p className="mt-2 flex-1 text-sm leading-6 text-[#6b6458]">
            兑换请求带幂等键。同一请求重复提交只返回原结果，不二次扣分或发货。
          </p>
        </Link>
      </Reveal>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  suffix = "",
  dual,
  highlight = false,
}: {
  label: string;
  value?: number;
  suffix?: string;
  dual?: [number, number] | null;
  highlight?: boolean;
}) {
  return (
    <div
      data-reveal
      className={`panel panel-hover flex flex-col self-stretch rounded-sm p-4 ${
        highlight ? "border-[#cbb98a] bg-gradient-to-br from-[#fffdf8] to-[#faf3e0]" : ""
      }`}
    >
      <div className="text-xs tracking-wide text-[#6b6458]">{label}</div>
      <div className={`mt-auto pt-2 text-2xl ${highlight ? "text-[#8a6a2f]" : ""}`}>
        {dual ? (
          <span>
            <CountUp value={dual[0]} /> <span className="text-[#cbb98a]">/</span>{" "}
            <CountUp value={dual[1]} />
          </span>
        ) : value === undefined ? (
          "—"
        ) : (
          <CountUp value={value} suffix={suffix} />
        )}
      </div>
    </div>
  );
}
