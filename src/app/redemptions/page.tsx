"use client";

import { AppShell } from "@/components/AppShell";
import { PageIntro } from "@/components/anim/PageIntro";
import { Stagger } from "@/components/anim/Stagger";
import { formatTime, statusLabel } from "@/lib/format";
import { useEffect, useState } from "react";

type Row = {
  id: string;
  status: string;
  pointsSpent: number;
  failReason: string | null;
  fulfillmentCode: string | null;
  idempotencyKey: string;
  createdAt: string;
  product: { title: string; cost: number };
};

export default function RedemptionsPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    fetch("/api/redemptions")
      .then((r) => r.json())
      .then((payload) => payload.ok && setRows(payload.data));
  }, []);

  return (
    <AppShell>
      <PageIntro
        kicker="FULFILLMENT"
        title="兑换结果"
        sub="成功单会给出数字商品凭证；失败或余额不足单会保留原因，且 pointsSpent = 0。"
      />

      <Stagger className="mt-6 space-y-3" deps={[rows.length]} each={0.09}>
        {rows.length === 0 && (
          <div data-reveal className="panel rounded-sm px-4 py-8 text-[#6b6458]">
            还没有兑换记录。
          </div>
        )}
        {rows.map((row) => (
          <article key={row.id} data-reveal className="panel panel-hover rounded-sm p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg">{row.product.title}</h2>
                <p className="mt-1 text-sm text-[#6b6458]">{formatTime(row.createdAt)}</p>
              </div>
              <span
                className="rounded-full px-2.5 py-1 text-xs"
                style={{
                  background:
                    row.status === "SUCCESS"
                      ? "#e4f3eb"
                      : row.status === "FAILED"
                        ? "#f8e2e2"
                        : "#f8e6d8",
                  color:
                    row.status === "SUCCESS"
                      ? "#1f6b4a"
                      : row.status === "FAILED"
                        ? "#8f2d2d"
                        : "#8a3d16",
                }}
              >
                {statusLabel(row.status)}
              </span>
            </div>
            <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
              <div>扣分：{row.pointsSpent}</div>
              <div>标价：{row.product.cost}</div>
              {row.fulfillmentCode && (
                <div className="mono rounded-sm bg-[#faf6ec] px-2 py-1 md:col-span-2">
                  凭证：{row.fulfillmentCode}
                </div>
              )}
              {row.failReason && <div className="md:col-span-2">{row.failReason}</div>}
              <div className="mono text-xs text-[#6b6458] md:col-span-2">
                幂等键：{row.idempotencyKey}
              </div>
            </dl>
          </article>
        ))}
      </Stagger>
    </AppShell>
  );
}
