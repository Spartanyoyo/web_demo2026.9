"use client";

import { AppShell } from "@/components/AppShell";
import { PageIntro } from "@/components/anim/PageIntro";
import { Stagger } from "@/components/anim/Stagger";
import { CountUp } from "@/components/anim/CountUp";
import { gsap, useGSAP } from "@/components/anim/gsap";
import { formatPoints } from "@/lib/format";
import { useCallback, useEffect, useRef, useState } from "react";

type Product = {
  id: string;
  slug: string;
  title: string;
  description: string;
  cost: number;
  kind: string;
};

type RedeemResult = {
  replayed: boolean;
  status: string;
  pointsSpent: number;
  failReason: string | null;
  fulfillmentCode: string | null;
  product: { title: string };
  balance: number;
};

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [balance, setBalance] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [result, setResult] = useState<RedeemResult | null>(null);
  const [resultSeq, setResultSeq] = useState(0);
  const [lastKeys, setLastKeys] = useState<Record<string, string>>({});
  const resultRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((payload) => {
        if (!payload.ok) return;
        setProducts(payload.data.products);
        setBalance(payload.data.balance);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useGSAP(
    () => {
      if (!result) return;
      const el = resultRef.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: -12, scale: 0.985 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out" }
      );
      if (result.status !== "SUCCESS") {
        gsap.fromTo(
          el,
          { x: -6 },
          { x: 6, duration: 0.06, repeat: 4, yoyo: true, ease: "power1.inOut", clearProps: "x", delay: 0.5 }
        );
      }
    },
    { scope: resultRef, dependencies: [resultSeq] }
  );

  function newKey() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  async function redeem(product: Product, reuseKey?: string) {
    const idempotencyKey = reuseKey ?? newKey();
    setBusyId(product.id);
    const res = await fetch("/api/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, idempotencyKey }),
    });
    const payload = await res.json();
    setBusyId(null);
    if (!payload.ok) {
      setResult({
        replayed: false,
        status: "ERROR",
        pointsSpent: 0,
        failReason: payload.error,
        fulfillmentCode: null,
        product: { title: product.title },
        balance,
      });
      setResultSeq((s) => s + 1);
      return;
    }
    setLastKeys((prev) => ({ ...prev, [product.id]: idempotencyKey }));
    setResult(payload.data);
    setResultSeq((s) => s + 1);
    setBalance(payload.data.balance);
    load();
  }

  return (
    <AppShell>
      <PageIntro
        kicker="REDEEM"
        title="数字商品柜"
        right={
          <span className="mono text-[#8a6a2f]">
            可用余额 <CountUp value={balance} suffix=" 分" />
          </span>
        }
        sub="每次新兑换会生成幂等键。点击「用同一请求再提交一次」验证：不会重复扣分，也不会再次发货。"
      />

      {result && (
        <div
          ref={resultRef}
          className="mt-5 rounded-sm px-4 py-3 text-sm leading-6"
          style={{
            background:
              result.status === "SUCCESS"
                ? "#e4f3eb"
                : result.status === "FAILED" || result.status === "ERROR"
                  ? "#f8e2e2"
                  : "#f8e6d8",
          }}
        >
          <div>
            {result.replayed ? "重复提交，返回原兑换结果。" : "本次兑换已受理。"}
            商品「{result.product.title}」状态：
            <strong>
              {result.status === "SUCCESS"
                ? "发放成功"
                : result.status === "FAILED"
                  ? "发放失败"
                  : result.status === "REJECTED"
                    ? "未扣分驳回"
                    : result.status}
            </strong>
            。扣分 {result.pointsSpent}，余额 {result.balance}。
          </div>
          {result.fulfillmentCode && (
            <div className="mono mt-1">提取码 / 凭证：{result.fulfillmentCode}</div>
          )}
          {result.failReason && <div className="mt-1">{result.failReason}</div>}
        </div>
      )}

      <Stagger className="mt-6 grid gap-4 md:grid-cols-2" deps={[products.length]} each={0.09}>
        {products.map((product) => (
          <article
            key={product.id}
            data-reveal
            className="panel panel-hover flex flex-col self-stretch rounded-sm p-5"
          >
            <div className="text-xs tracking-wide text-[#8a6a2f]">
              {product.kind === "flaky" ? "FAILURE PATH" : product.kind.toUpperCase()}
            </div>
            <h2 className="mt-1 text-xl">{product.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-[#6b6458]">
              {product.description}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="mono">{formatPoints(product.cost)}</span>
              <button
                disabled={busyId === product.id}
                onClick={() => redeem(product)}
                className="btn-ink px-3 py-1.5 text-sm disabled:pointer-events-none disabled:opacity-60"
              >
                {busyId === product.id ? "处理中…" : "兑换"}
              </button>
            </div>
            {lastKeys[product.id] && (
              <button
                className="mt-2 self-end text-xs text-[#6b6458] underline transition-colors duration-200 hover:text-[#8a6a2f]"
                onClick={() => redeem(product, lastKeys[product.id])}
              >
                用同一请求再提交一次
              </button>
            )}
          </article>
        ))}
      </Stagger>
    </AppShell>
  );
}
