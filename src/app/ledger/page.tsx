"use client";

import { AppShell } from "@/components/AppShell";
import { PageIntro } from "@/components/anim/PageIntro";
import { Stagger } from "@/components/anim/Stagger";
import { CountUp } from "@/components/anim/CountUp";
import { formatTime } from "@/lib/format";
import { useEffect, useState } from "react";

type Entry = {
  id: string;
  direction: string;
  amount: number;
  balanceAfter: number;
  reason: string;
  note: string | null;
  createdAt: string;
};

export default function LedgerPage() {
  const [balance, setBalance] = useState(0);
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    fetch("/api/ledger")
      .then((r) => r.json())
      .then((payload) => {
        if (!payload.ok) return;
        setBalance(payload.data.balance);
        setEntries(payload.data.entries);
      });
  }, []);

  return (
    <AppShell>
      <PageIntro
        kicker="LEDGER"
        title="收支明细"
        right={
          <span className="mono text-[#8a6a2f]">
            账面余额 <CountUp value={balance} suffix=" 分" />
          </span>
        }
        sub="每一笔入账或兑出都落库。失败兑换不会产生借方分录。"
      />

      <div className="panel mt-6 overflow-x-auto rounded-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-[#ddd4c4] text-xs tracking-wide text-[#6b6458]">
            <tr>
              <th className="px-4 py-3 font-normal">时间</th>
              <th className="px-4 py-3 font-normal">方向</th>
              <th className="px-4 py-3 font-normal">金额</th>
              <th className="px-4 py-3 font-normal">余额</th>
              <th className="px-4 py-3 font-normal">说明</th>
            </tr>
          </thead>
          <Stagger as="tbody" deps={[entries.length]} each={0.05} y={0} duration={0.5}>
            {entries.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-[#6b6458]" colSpan={5}>
                  暂无分录。先去任务台领取一笔积分。
                </td>
              </tr>
            )}
            {entries.map((entry) => {
              const credit = entry.direction === "CREDIT";
              return (
                <tr
                  key={entry.id}
                  data-reveal
                  className="border-t border-[#eee6d8] transition-colors duration-150 hover:bg-[#faf6ec]"
                >
                  <td className="px-4 py-3 text-[#6b6458]">{formatTime(entry.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        credit
                          ? "bg-[#e4f3eb] text-[#1f6b4a]"
                          : "bg-[#f8e6d8] text-[#8a3d16]"
                      }`}
                    >
                      {credit ? "入账" : "兑出"}
                    </span>
                  </td>
                  <td className={`mono px-4 py-3 ${credit ? "text-[#1f6b4a]" : "text-[#8a3d16]"}`}>
                    {credit ? "+" : "−"}
                    {entry.amount}
                  </td>
                  <td className="mono px-4 py-3">{entry.balanceAfter}</td>
                  <td className="px-4 py-3">{entry.note ?? entry.reason}</td>
                </tr>
              );
            })}
          </Stagger>
        </table>
      </div>
    </AppShell>
  );
}
